// タイトル・ログイン・キャラクターえらび・キャラクターづくり
import { el, ListMenu, toast, askText, confirmBox } from './dom.js';
import { JOBS, JOB_ORDER } from '../../shared/data/jobs.js';
import { HAIR, CLOTH, SKIN, HAIR_NAMES } from '../render/chars.js';
import { playerSprite } from '../field.js';
import { makeCanvas, ctxOf } from '../render/pixel.js';
import { ago } from './services.js';

function clearUI() {
  document.getElementById('ui').innerHTML = '';
}

// きずなの紋章（エンブレム）
export function crestCanvas(size = 32) {
  const c = makeCanvas(size, size);
  const x = ctxOf(c);
  const cx = size / 2, cy = size / 2;
  x.fillStyle = '#1b1330';
  x.beginPath(); x.arc(cx, cy, size * 0.48, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#f2c14e';
  x.beginPath(); x.arc(cx, cy, size * 0.44, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#3c2a8c';
  x.beginPath(); x.arc(cx, cy, size * 0.36, 0, Math.PI * 2); x.fill();
  // ほし
  x.fillStyle = '#fff6d8';
  x.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? size * 0.13 : size * 0.3;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.closePath();
  x.fill();
  // 4つの ちいさな わ（なかまの しるし）
  x.strokeStyle = '#f2c14e';
  x.lineWidth = Math.max(1, size / 24);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    x.beginPath(); x.arc(cx + Math.cos(a) * size * 0.3, cy + Math.sin(a) * size * 0.3, size * 0.06, 0, Math.PI * 2); x.stroke();
  }
  return c;
}

export function showTitle(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const crest = crestCanvas(48);
  crest.className = 'crest';
  const mode = game.net.mode === 'server'
    ? `家族サーバー「${game.net.family || 'わが家'}」に つながっています`
    : 'ひとりで あそぶ モード（このブラウザに セーブ）';
  const start = el('button', { class: 'bigbtn sel', text: '▶ はじめる' });
  const box = el('div', { class: 'title-screen' },
    el('div', { class: 'logo' }, crest, el('div', { class: 'main', text: 'きずなの紋章' }), el('div', { class: 'sub', text: '～ ほしふる むらの ものがたり ～' })),
    el('div', { class: 'win col', style: { minWidth: 'min(88vw, 420px)' } },
      start,
      el('div', { class: 'small muted', text: mode }),
      el('div', { class: 'small muted', text: 'そうさ: やじるしキー/WASD・Z/Enter・X/Esc　（スマホは がめんの ボタン）' })));
  ui.append(box);
  const go = () => {
    game.input.pop(h);
    game.audio.unlock();
    game.audio.sfx('confirm');
    game.afterTitle();
  };
  start.addEventListener('click', go);
  const h = { onNav: (a) => { if (a === 'a') go(); } };
  game.input.push(h);
  game.audio.play('title');
}

export async function showLogin(game, failed) {
  clearUI();
  let saved = '';
  try { saved = localStorage.getItem('kizuna_pw') || ''; } catch { /* */ }
  if (saved && !failed) {
    game.net.send({ t: 'hello', pw: saved });
    return;
  }
  const pw = await askText(game.input, { title: failed ? `あいことばが ちがうみたい…（${failed}）` : '家族の あいことばを いれてね', placeholder: 'サーバーの がめんに でている あいことば', max: 40 });
  if (pw === null) return showLogin(game, failed);
  try { localStorage.setItem('kizuna_pw', pw); } catch { /* */ }
  game.net.send({ t: 'hello', pw });
}

export function showSelect(game, chars) {
  clearUI();
  const ui = document.getElementById('ui');
  const wrap = el('div', { class: 'panel center-panel', style: { width: 'min(96vw, 900px)' } });
  const head = el('div', { class: 'win row', style: { justifyContent: 'space-between', marginBottom: '6px' } },
    el('span', { class: 'gold', text: 'だれで あそぶ？' }),
    el('span', { class: 'small muted', text: game.net.mode === 'server' ? `家族サーバー: ${game.net.family || ''}` : 'このブラウザの セーブ' }));
  const list = el('div', { class: 'win scroll', style: { maxHeight: '64vh' } });
  const grid = el('div', { class: 'chars' });
  list.append(grid);
  const items = [];
  for (const c of chars) {
    const cv = makeCanvas(16, 21);
    ctxOf(cv).drawImage(playerSprite(c.look, c.job, 'down', 0), 0, 0);
    const card = el('button', { class: 'win charcard' }, cv, el('div', {},
      el('div', { text: c.name }),
      el('div', { class: 'meta', text: `${JOBS[c.job]?.name} Lv${c.level}${c.online ? '' : ''}` }),
      c.online ? el('div', { class: 'meta on', text: 'いま あそんでいる' }) : el('div', { class: 'meta', text: c.lastPlayed ? `${ago(c.lastPlayed)}に あそんだ` : '' }),
      el('div', { class: 'meta', text: c.objective || '' })));
    card.addEventListener('click', () => choose(c));
    grid.append(card);
    items.push({ card, c });
  }
  const newBtn = el('button', { class: 'win charcard', style: { justifyContent: 'center' } }, el('span', { class: 'gold', text: '＋ あたらしく つくる' }));
  newBtn.addEventListener('click', () => { cleanup(); showCreate(game); });
  grid.append(newBtn);
  const foot = el('div', { class: 'win row', style: { marginTop: '6px', justifyContent: 'space-between' } },
    el('span', { class: 'small muted', text: chars.length ? 'カードを えらんでね（やじるしキーでも うごかせる）' : 'まずは キャラクターを つくろう！' }),
    chars.length ? el('button', { class: 'btn danger', text: 'キャラを けす', onclick: () => delFlow() }) : null);
  wrap.append(head, list, foot);
  ui.append(wrap);
  let idx = 0;
  const all = [...items.map((i) => i.card), newBtn];
  const sel = () => all.forEach((c, i) => c.classList.toggle('sel', i === idx));
  sel();
  const choose = (c) => {
    cleanup();
    game.audio.sfx('confirm');
    game.net.send({ t: 'play', id: c.id });
  };
  const h = {
    onNav: (a) => {
      const cols = Math.max(1, Math.round(grid.clientWidth / (all[0]?.clientWidth || 200)));
      if (a === 'right') idx = Math.min(all.length - 1, idx + 1);
      if (a === 'left') idx = Math.max(0, idx - 1);
      if (a === 'down') idx = Math.min(all.length - 1, idx + cols);
      if (a === 'up') idx = Math.max(0, idx - cols);
      if (a === 'a') return all[idx].click();
      game.audio.sfx('cursor');
      sel();
      all[idx].scrollIntoView({ block: 'nearest' });
    },
  };
  game.input.push(h);
  const cleanup = () => game.input.pop(h);
  const delFlow = async () => {
    cleanup();
    const name = await askText(game.input, { title: 'けす キャラクターの なまえを いれてね（もとに もどせません）', max: 8 });
    const c = chars.find((x) => x.name === name);
    if (c && await confirmBox(game.input, `${c.name}を ほんとうに けしますか？\n（セーブも すべて きえます）`, 'けす', 'やめる', (x) => game.audio.sfx(x))) {
      game.net.send({ t: 'deleteChar', id: c.id, confirm: c.name });
    } else if (name) toast('やめました');
    showSelect(game, game.chars || chars);
  };
}

export function showCreate(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const look = { body: 0, hair: 0, hairColor: 1, skin: 0, color: 1 };
  let job = 'warrior';
  let dirI = 0;
  const dirs = ['down', 'left', 'up', 'right'];
  const wrap = el('div', { class: 'panel center-panel', style: { width: 'min(96vw, 860px)' } });
  const box = el('div', { class: 'win scroll', style: { maxHeight: '86vh' } });
  const preview = makeCanvas(16, 21);
  const name = el('input', { class: 'textin', id: 'cname', maxlength: '8', placeholder: 'なまえ（8もじまで）', autocomplete: 'off' });
  const jobDesc = el('div', { class: 'jobdesc' });
  const draw = () => {
    const x = ctxOf(preview);
    x.clearRect(0, 0, 16, 21);
    x.drawImage(playerSprite(look, job, dirs[dirI], Math.floor(performance.now() / 300) % 2), 0, 0);
  };
  const timer = setInterval(draw, 150);
  setTimeout(() => { dirI = 0; }, 0);
  const row = (label, node) => el('div', { class: 'col', style: { gap: '0.2em' } }, el('span', { class: 'small gold', text: label }), node);
  const opts = (values, cur, onPick, render) => {
    const o = el('div', { class: 'opt' });
    values.forEach((v, i) => {
      const b = render(v, i);
      b.addEventListener('click', () => {
        onPick(i);
        [...o.children].forEach((x, j) => x.classList.toggle('sel', j === i));
        game.audio.sfx('cursor');
        draw();
      });
      if (i === cur) b.classList.add('sel');
      o.append(b);
    });
    return o;
  };
  const bodyOpt = opts(['おとこのこ', 'おんなのこ'], look.body, (i) => { look.body = i; }, (v) => el('button', { class: 'btn', text: v }));
  const hairOpt = opts(HAIR_NAMES, look.hair, (i) => { look.hair = i; }, (v) => el('button', { class: 'btn', text: v }));
  const hairCol = opts(HAIR, look.hairColor, (i) => { look.hairColor = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': 'かみの いろ' }));
  const skinOpt = opts(SKIN, look.skin, (i) => { look.skin = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': 'はだの いろ' }));
  const clothOpt = opts(CLOTH, look.color, (i) => { look.color = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': 'ふくの いろ' }));
  const jobsEl = el('div', { class: 'jobs' });
  JOB_ORDER.forEach((j) => {
    const b = el('button', { class: `btn jobbtn ${j === job ? 'sel' : ''}` }, el('span', { class: 'jn', text: JOBS[j].name }), el('span', { class: 'jd', text: { warrior: 'かたくて つよい', monk: 'とても すばやい', priest: 'かいふくの めがみ', mage: 'こうげき呪文', performer: 'みんなを おうえん' }[j] }));
    b.addEventListener('click', () => {
      job = j;
      [...jobsEl.children].forEach((x) => x.classList.toggle('sel', x === b));
      jobDesc.textContent = JOBS[j].desc;
      game.audio.sfx('cursor');
      draw();
    });
    jobsEl.append(b);
  });
  jobDesc.textContent = JOBS[job].desc;
  const turn = el('button', { class: 'btn', text: 'まわす', onclick: () => { dirI = (dirI + 1) % 4; draw(); } });
  const ok = el('button', { class: 'btn primary', text: 'これで はじめる！' });
  const back = el('button', { class: 'btn', text: 'もどる' });
  box.append(
    el('h2', { text: 'キャラクターを つくる' }),
    el('div', { class: 'create' },
      el('div', { class: 'preview' }, preview, turn),
      el('div', { class: 'col' },
        row('なまえ', name),
        row('からだ', bodyOpt),
        row('かみがた', hairOpt),
        row('かみの いろ', hairCol),
        row('はだの いろ', skinOpt),
        row('ふくの いろ', clothOpt),
        row('さいしょの しょくぎょう（あとで 転職できるよ）', jobsEl),
        jobDesc,
        el('div', { class: 'row end' }, back, ok))),
  );
  wrap.append(box);
  ui.append(wrap);
  draw();
  const h = { onNav: (a) => { if (a === 'b') doBack(); } };
  game.input.push(h);
  const cleanup = () => {
    clearInterval(timer);
    game.input.pop(h);
  };
  const doBack = () => {
    cleanup();
    showSelect(game, game.chars || []);
  };
  back.addEventListener('click', doBack);
  ok.addEventListener('click', () => {
    const n = name.value.trim();
    if (!n) {
      toast('なまえを いれてね');
      name.focus();
      return;
    }
    cleanup();
    game.audio.sfx('join');
    game.pendingPlay = true;
    game.net.send({ t: 'createChar', name: n, look, job });
  });
  setTimeout(() => name.focus(), 50);
}
