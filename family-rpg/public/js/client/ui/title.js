// タイトル・ログイン・キャラクターえらび・キャラクターづくり
import { el, ListMenu, toast, askText, confirmBox } from './dom.js';
import { JOBS, JOB_ORDER } from '../../shared/data/jobs.js';
import { HAIR, CLOTH, SKIN, HAIR_NAMES } from '../render/chars.js';
import { playerSprite } from '../field.js';
import { makeCanvas, ctxOf } from '../render/pixel.js';
import { ago } from './services.js';
import { LINE_MAX } from '../../shared/world/transfer.js';

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

// セーブの 場所（画面に 出す）。warn … 消えるかも しれない とき
export function saveWhere(game) {
  if (game.net.mode === 'server') return { short: `家族サーバー: ${game.net.family || ''}`, long: `家族サーバー「${game.net.family || 'わが家'}」につながっています`, place: `家族サーバー「${game.net.family || 'わが家'}」` };
  const st = game.net.local?.cloud;
  const state = st?.state || 'off';
  if (state === 'loading' || state === 'asking') return { short: '☁ セーブを読みこみ中…', long: 'ひとりで遊ぶモード（セーブを読みこみ中…）', place: 'ひとりで遊ぶモード' };
  if (state === 'on') return { short: '☁ claude.aiにセーブ（ブラウザを閉じても消えません）', long: 'ひとりで遊ぶモード（claude.aiにセーブ）', place: 'ひとりで遊ぶモード（claude.aiにセーブ）' };
  if (state === 'error') return { short: '☁ 今はclaude.aiにセーブできていません（このブラウザには残っています）', long: 'ひとりで遊ぶモード（claude.aiにセーブ）', place: 'ひとりで遊ぶモード（claude.aiにセーブ）', warn: true };
  if (st?.inViewer) {
    const why = state === 'readonly' ? '見るだけの共有なので、claude.aiにはセーブできません。' : 'claude.aiにセーブできないので、';
    return { short: `このブラウザだけにセーブ（${why}ブラウザを閉じると消えることがあります）`, long: 'ひとりで遊ぶモード（このブラウザだけにセーブ）', place: 'このブラウザ（ひとりで遊ぶモード）', warn: true };
  }
  return { short: 'このブラウザのセーブ', long: 'ひとりで遊ぶモード（このブラウザにセーブ）', place: 'このブラウザ（ひとりで遊ぶモード）' };
}

// セーブを 読みこんでいる あいだ
export function showLoading(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const asking = game.net.local?.cloud?.state === 'asking';
  ui.append(el('div', { class: 'panel center-panel', style: { width: 'min(90vw, 460px)' } },
    el('div', { class: 'win col' },
      el('div', { class: 'gold', text: asking ? '☁ クラウドセーブの確認' : '☁ セーブを読みこんでいます…' }),
      el('div', { class: 'small', text: asking ? 'claude.aiの画面に出ている確認で「許可」を選ぶと、ブラウザを閉じてもセーブが消えなくなります。' : 'ちょっと待ってね。' }))));
}

export function showTitle(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const crest = crestCanvas(48);
  crest.className = 'crest';
  const mode = saveWhere(game).long;
  const start = el('button', { class: 'bigbtn sel', text: '▶ 始める' });
  const box = el('div', { class: 'title-screen' },
    el('div', { class: 'logo' }, crest, el('div', { class: 'main', text: 'きずなの紋章' }), el('div', { class: 'sub', text: '～ 星ふる村の物語 ～' })),
    el('div', { class: 'win col', style: { minWidth: 'min(88vw, 420px)' } },
      start,
      el('div', { class: `small ${saveWhere(game).warn ? 'warn' : 'muted'} title-save`, text: mode }),
      el('div', { class: 'small muted', text: '操作: 矢印キー/WASD・Z/Enter・X/Esc　（スマホは画面のボタン）' })));
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
  const pw = await askText(game.input, { title: failed ? `合言葉がちがうみたい…（${failed}）` : '家族の合言葉を入れてね', placeholder: 'サーバーの画面に出ている合言葉', max: 40 });
  if (pw === null) return showLogin(game, failed);
  try { localStorage.setItem('kizuna_pw', pw); } catch { /* */ }
  game.net.send({ t: 'hello', pw });
}

export function showSelect(game, chars) {
  clearUI();
  const ui = document.getElementById('ui');
  const wrap = el('div', { class: 'panel center-panel', style: { width: 'min(96vw, 900px)' } });
  const head = el('div', { class: 'win row', style: { justifyContent: 'space-between', marginBottom: '6px' } },
    el('span', { class: 'gold', text: 'だれで遊ぶ？' }),
    (() => {
      const w = saveWhere(game);
      return el('span', { class: w.warn ? 'small warn' : 'small muted', text: w.short });
    })());
  const list = el('div', { class: 'win scroll', style: { maxHeight: '64vh' } });
  const grid = el('div', { class: 'chars' });
  list.append(grid);
  const items = [];
  for (const c of chars) {
    const cv = makeCanvas(16, 21);
    ctxOf(cv).drawImage(playerSprite(c.look, c.job, 'down', 0, c.equip), 0, 0);
    const card = el('button', { class: 'win charcard' }, cv, el('div', {},
      el('div', { text: c.name }),
      el('div', { class: 'meta', text: `${JOBS[c.job]?.name} Lv${c.level}${c.online ? '' : ''}` }),
      c.online ? el('div', { class: 'meta on', text: '今遊んでいる' }) : el('div', { class: 'meta', text: c.lastPlayed ? playedAgo(c.lastPlayed) : '' }),
      el('div', { class: 'meta', text: c.objective || '' })));
    card.addEventListener('click', () => choose(c));
    grid.append(card);
    items.push({ card, c });
  }
  const newBtn = el('button', { class: 'win charcard', style: { justifyContent: 'center' } }, el('span', { class: 'gold', text: '＋ 新しく作る' }));
  newBtn.addEventListener('click', () => { cleanup(); showCreate(game); });
  grid.append(newBtn);
  const foot = el('div', { class: 'win row', style: { marginTop: '6px', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4em' } },
    el('span', { class: 'small muted', text: chars.length ? 'カードを選んでね（矢印キーでも動かせる）' : 'まずはキャラクターを作ろう！' }),
    el('span', { class: 'row', style: { gap: '0.4em' } },
      el('button', { class: 'btn', text: '引っこしコード', onclick: () => { cleanup(); showTransfer(game, chars); } }),
      chars.length ? el('button', { class: 'btn danger', text: 'キャラを消す', onclick: () => delFlow() }) : null));
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
    const name = await askText(game.input, { title: '消すキャラクターの名前を入れてね（元にもどせません）', max: 8 });
    const c = chars.find((x) => x.name === name);
    if (c && await confirmBox(game.input, `${c.name}を本当に消しますか？\n（セーブも全て消えます）`, '消す', 'やめる', (x) => game.audio.sfx(x))) {
      game.net.send({ t: 'deleteChar', id: c.id, confirm: c.name });
    } else if (name) toast('やめました');
    showSelect(game, game.chars || chars);
  };
}

// 「3分前に遊んだ」「たった今遊んだ」
function playedAgo(t) {
  const when = ago(t);
  return when === 'たった今' ? 'たった今遊んだ' : `${when}に遊んだ`;
}

// ───────────── 引っこしコード（キャラクターを べつの 場所へ つれていく） ─────────────
// コピー: iPhone の Safari（http の 家族サーバー）や アプリの 中では、新しい コピーの しくみ
// （navigator.clipboard）が つかえない ことが あるので、まず 文字を 全部 選んで コピーする
function selectAllText(ta) {
  ta.focus({ preventScroll: true });
  ta.select();
  ta.setSelectionRange(0, ta.value.length);
}

function copyBySelect(ta) {
  selectAllText(ta);
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

// 書き出す: キャラを えらぶ → コードが 出る → コピー
// 連れてくる: コードを はりつける → 「だれで遊ぶ？」に くわわる
function request(game, msg, want) {
  return new Promise((resolve) => {
    game.transferWaiter = (m) => {
      if (m.t !== want) return false;
      game.transferWaiter = null;
      resolve(m);
      return true;
    };
    game.net.send(msg);
    setTimeout(() => {
      if (game.transferWaiter) {
        game.transferWaiter = null;
        resolve({ ok: false, text: '通信がおくれています' });
      }
    }, 8000);
  });
}

export function showTransfer(game, chars) {
  clearUI();
  const ui = document.getElementById('ui');
  const where = saveWhere(game).place;
  const wrap = el('div', { class: 'panel center-panel transfer-panel', style: { width: 'min(96vw, 720px)' } });
  const box = el('div', { class: 'win scroll', style: { maxHeight: '88vh' } });
  const body = el('div', { class: 'col', style: { gap: '0.6em' } });
  const close = el('button', { class: 'btn closebtn', text: '✕ 閉じる', 'aria-label': '閉じる' });
  const head = el('div', { class: 'svc-head', style: { marginBottom: '0.3em' } }, el('span', { class: 'gold', text: '引っこしコード' }), close);
  box.append(head, body);
  wrap.append(box);
  ui.append(wrap);
  const h = { onNav: (a) => { if (a === 'b') done(); } };
  game.input.push(h);
  const done = () => {
    game.input.pop(h);
    game.transferWaiter = null;
    showSelect(game, game.chars || chars);
  };
  close.addEventListener('click', done);

  const top = () => {
    body.innerHTML = '';
    body.append(
      el('div', { class: 'small', text: `キャラクターを、べつの場所へ連れていけます。\n今いる場所: ${where}` }),
      el('div', { class: 'detail', text: 'れい: 家族サーバーの電源がないときに、スマホの「ひとりで遊ぶモード」で進めたキャラを、あとで家族サーバーに連れてくる。\n書き出したあとは、連れていった先で続きを遊んでね（両方で遊ぶと、あとで進んだほうのデータになります）。' }),
      el('div', { class: 'row', style: { gap: '0.5em', flexWrap: 'wrap' } },
        el('button', { class: 'btn primary', text: '① キャラを書き出す', disabled: !chars.length, onclick: pickExport }),
        el('button', { class: 'btn primary', text: '② コードから連れてくる', onclick: importView })));
  };

  const pickExport = () => {
    body.innerHTML = '';
    body.append(el('div', { class: 'small gold', text: 'だれを書き出す？' }));
    const row = el('div', { class: 'row', style: { gap: '0.4em', flexWrap: 'wrap' } });
    for (const c of chars) row.append(el('button', { class: 'btn', text: `${c.name}（Lv${c.level}）`, onclick: () => exportView(c) }));
    body.append(row, el('button', { class: 'btn', text: '← もどる', onclick: top }));
  };

  const exportView = async (c) => {
    body.innerHTML = '';
    body.append(el('div', { class: 'small muted', text: 'コードを作っています…' }));
    const r = await request(game, { t: 'exportChar', id: c.id }, 'exportCode');
    body.innerHTML = '';
    if (!r.code) {
      body.append(el('div', { class: 'warn', text: r.text || '書き出せませんでした' }), el('button', { class: 'btn', text: '← もどる', onclick: top }));
      return;
    }
    const ta = el('textarea', { class: 'textin codearea', readonly: true, rows: '5', spellcheck: 'false' });
    ta.value = r.code;
    const copyBtn = el('button', { class: 'btn primary', text: 'コピーする' });
    const hint = el('div', { class: 'small' });
    copyBtn.addEventListener('click', () => {
      const copied = () => {
        ta.setSelectionRange(0, 0);
        ta.blur();
        toast('コピーしました！');
        game.audio.sfx('confirm');
        hint.className = 'small good';
        hint.textContent = 'コピーしました！　連れていく先で「② コードから連れてくる」を開いて、はりつけてね。\n（同じスマホなら、そのまま連れていく先をブラウザで開いて、はりつけるだけ）';
      };
      const manual = () => {
        selectAllText(ta);
        hint.className = 'small warn';
        hint.textContent = '自動でコピーできませんでした。コードを全部選んであるので、青いところを長おし →「コピー」してね。';
      };
      // http の 家族サーバーや アプリの 中でも コピーできる やりかたから ためす
      if (copyBySelect(ta)) return copied();
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(r.code).then(copied, manual);
      else manual();
    });
    const send = r.code.length < LINE_MAX
      ? 'べつのスマホへは、LINE・メッセージ・AirDrop・メモなどで送れます。'
      : '長いので、LINEでは送れません。メッセージ・AirDrop・メモなどで送ってね。';
    body.append(
      el('div', { class: 'gold', text: `${r.name}の引っこしコード` }),
      el('div', { class: 'small', text: '連れていく先の「だれで遊ぶ？」→「引っこしコード」→「② コードから連れてくる」で、このコードをはりつけてね。' }),
      ta,
      el('div', { class: 'row', style: { gap: '0.5em' } }, copyBtn, el('button', { class: 'btn', text: '← もどる', onclick: top })),
      hint,
      el('div', { class: 'detail', text: `コードの長さ: ${r.code.length}文字。${send}\n全部コピーしてね（とちゅうで切れると読めません）。コードをメモにとっておくと、もしものときのバックアップにもなります。` }));
  };

  const importView = () => {
    body.innerHTML = '';
    const ta = el('textarea', { class: 'textin codearea', rows: '5', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', placeholder: 'ここに引っこしコードをはりつける（KIZUNA-…）' });
    const go = el('button', { class: 'btn primary', text: '連れてくる' });
    const msg = el('div', { class: 'small' });
    go.addEventListener('click', async () => {
      const code = ta.value.trim();
      if (!code) {
        toast('コードをはりつけてね');
        return;
      }
      go.disabled = true;
      msg.textContent = '読みこんでいます…';
      const r = await request(game, { t: 'importChar', code }, 'importResult');
      go.disabled = false;
      msg.textContent = r.text || '';
      msg.className = r.ok ? 'small good' : 'small warn';
      game.audio.sfx(r.ok ? 'join' : 'buzz');
      if (r.ok && r.mode !== 'kept') ta.value = '';
    });
    body.append(
      el('div', { class: 'small', text: `書き出したコードを、ここにはりつけてね。キャラクターが「${where}」にやってきます。\niPhone・iPad: わくの中を長おし →「ペースト」` }),
      ta,
      el('div', { class: 'row', style: { gap: '0.5em' } }, go, el('button', { class: 'btn', text: '← もどる', onclick: top })),
      msg,
      el('div', { class: 'detail', text: 'もういるキャラクターのコードなら、コードのほうが後で遊んだデータのときだけ入れかえます。' }));
    setTimeout(() => ta.focus(), 50);
  };
  top();
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
  const name = el('input', { class: 'textin', id: 'cname', maxlength: '8', placeholder: '名前（8文字まで）', autocomplete: 'off' });
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
  const bodyOpt = opts(['男の子', '女の子'], look.body, (i) => { look.body = i; }, (v) => el('button', { class: 'btn', text: v }));
  const hairOpt = opts(HAIR_NAMES, look.hair, (i) => { look.hair = i; }, (v) => el('button', { class: 'btn', text: v }));
  const hairCol = opts(HAIR, look.hairColor, (i) => { look.hairColor = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': 'かみの色' }));
  const skinOpt = opts(SKIN, look.skin, (i) => { look.skin = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': 'はだの色' }));
  const clothOpt = opts(CLOTH, look.color, (i) => { look.color = i; }, (v) => el('button', { class: 'swatch', style: { background: v }, 'aria-label': '服の色' }));
  const jobsEl = el('div', { class: 'jobs' });
  JOB_ORDER.forEach((j) => {
    const b = el('button', { class: `btn jobbtn ${j === job ? 'sel' : ''}` }, el('span', { class: 'jn', text: JOBS[j].name }), el('span', { class: 'jd', text: { warrior: '固くて強い', monk: 'とても素早い', priest: '回復の女神', mage: '攻撃呪文', performer: 'みんなをおうえん' }[j] }));
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
  const turn = el('button', { class: 'btn', text: '回す', onclick: () => { dirI = (dirI + 1) % 4; draw(); } });
  const ok = el('button', { class: 'btn primary', text: 'これで始める！' });
  const back = el('button', { class: 'btn', text: 'もどる' });
  box.append(
    el('h2', { text: 'キャラクターを作る' }),
    el('div', { class: 'create' },
      el('div', { class: 'preview' }, preview, turn),
      el('div', { class: 'col' },
        row('名前', name),
        row('体', bodyOpt),
        row('かみがた', hairOpt),
        row('かみの色', hairCol),
        row('はだの色', skinOpt),
        row('服の色', clothOpt),
        row('最初の職業（後で転職できるよ）', jobsEl),
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
      toast('名前を入れてね');
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
