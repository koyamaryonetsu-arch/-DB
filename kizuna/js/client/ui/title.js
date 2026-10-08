// タイトル・ログイン・キャラクターえらび・キャラクターづくり
import { el, ListMenu, toast, askText, confirmBox } from './dom.js?v=76455ba73f77';
import { JOBS, JOB_ORDER } from '../../shared/data/jobs.js?v=76455ba73f77';
import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, FACES, FACE_BY_ID, CLOTH_COLORS, cleanLook } from '../../shared/data/looks.js?v=76455ba73f77';
import { previewCache } from '../render/hero.js?v=76455ba73f77';
import { playerSprite } from '../field.js?v=76455ba73f77';
import { makeCanvas, ctxOf } from '../render/pixel.js?v=76455ba73f77';
import { LINE_MAX, parseCode } from '../../shared/world/transfer.js?v=76455ba73f77';
import { DEFAULT_SITE, pendingImport, clearPendingImport, familyServer, setFamilyServer, linkToFamilyServer, linkToSite, siteServerAddress } from '../links.js?v=76455ba73f77';
import { goFamilyServer, goSite, roundTrip, changeServer, syncOnServer, maybeRoundTrip, notePlayed, familyServerUp } from './syncui.js?v=76455ba73f77';
import { shownEquip } from '../../shared/look-equip.js?v=76455ba73f77';

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

// いまの 版（ひとりで遊ぶサイト・家族サーバー）
function versionLine(game) {
  const d = new Date(globalThis.KIZUNA_VERSION?.date || game.net.version || '');
  if (Number.isNaN(d.getTime())) return null;
  const p = (n) => String(n).padStart(2, '0');
  return el('div', { class: 'small muted', style: { opacity: 0.6 }, text: `版: ${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` });
}

// セーブを 読みこんでいる あいだ
export function showLoading(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const asking = game.net.local?.cloud?.state === 'asking';
  ui.append(el('div', { class: 'panel center-panel', style: { width: 'min(90vw, 460px)' } },
    el('div', { class: 'win col' },
      el('div', { class: 'gold', text: asking ? '☁ クラウドセーブの確認' : '☁ セーブを読みこんでいます…' }),
      el('div', { class: 'small', text: asking ? 'claude.aiの画面に出ている確認で「許可」を選ぶと、ブラウザを閉じてもセーブが消えなくなります。' : '少しお待ちください。' }))));
}

export function showTitle(game) {
  clearUI();
  const ui = document.getElementById('ui');
  const crest = crestCanvas(48);
  crest.className = 'crest';
  const mode = saveWhere(game).long;
  const start = el('button', { class: 'bigbtn sel', text: '▶ 始める' });
  // ひとりで遊ぶサイト: 家族サーバーを 知っていれば、そちらへも 1タップで（この スマホの データも 持っていく）
  const home = game.net.mode !== 'server' && familyServer() && !game.net.local?.cloud?.inViewer
    ? el('button', { class: 'bigbtn home-btn', text: '家族サーバーで遊ぶ', onclick: () => { game.audio.unlock(); goFamilyServer(game); } })
    : null;
  const homeNote = home ? el('div', { class: 'small muted', text: 'このスマホで進めたキャラも、家族サーバーに保存されます' }) : null;
  // 外出先から つながる（https の）家族サーバーなら、動いているか 見る
  if (home) {
    familyServerUp().then((up) => {
      if (up === null || !home.isConnected) return;
      home.textContent = up ? '家族サーバーで遊ぶ（動いています）' : '家族サーバー（今はお休み中）';
      home.classList.toggle('down', !up);
      if (!up) {
        homeNote.textContent = '家族サーバーのPCが動いていないみたい。「▶ 始める」でひとりで遊べます（あとで家族サーバーに合わせられます）';
        homeNote.className = 'small warn';
      }
    });
  }
  const box = el('div', { class: 'title-screen' },
    el('div', { class: 'logo' }, crest, el('div', { class: 'main', text: 'きずなの紋章' }), el('div', { class: 'sub', text: '～ 星ふる村の物語 ～' })),
    el('div', { class: 'win col', style: { minWidth: 'min(88vw, 420px)' } },
      start,
      home,
      homeNote,
      el('div', { class: `small ${saveWhere(game).warn ? 'warn' : 'muted'} title-save`, text: mode }),
      el('div', { class: 'small muted', text: '操作: 矢印キー/WASD・Z/Enter・X/Esc　（スマホは画面のボタン）' }),
      versionLine(game)));
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

// code … 'wait'（まちがいが 多いので 待ってね）/ 'weak'（外出先からは 合言葉が 短いと 入れない）
export async function showLogin(game, failed, code = '') {
  clearUI();
  let saved = '';
  try { saved = localStorage.getItem('kizuna_pw') || ''; } catch { /* */ }
  if (saved && !failed) {
    game.net.send({ t: 'hello', pw: saved });
    return;
  }
  const title = code ? failed : failed ? `合言葉がちがうみたい…（${failed}）` : '家族の合言葉を入れてください';
  const pw = await askText(game.input, { title, placeholder: 'サーバーの画面に出ている合言葉', max: 60, initial: code ? saved : '' });
  if (pw === null) return showLogin(game, failed, code);
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
  const list = el('div', { class: 'win scroll', style: { maxHeight: 'calc(64vh - var(--pad-h))' } });
  const grid = el('div', { class: 'chars' });
  list.append(grid);
  const items = [];
  for (const c of chars) {
    const sp = playerSprite(c.look, c.job, 'down', 0, shownEquip(c));
    const cv = makeCanvas(sp.width, sp.height);
    ctxOf(cv).drawImage(sp, 0, 0);
    const card = el('button', { class: 'win charcard' }, cv, el('div', {},
      el('div', { text: c.name }),
      el('div', { class: 'meta', text: `${JOBS[c.job]?.name} Lv${c.level}` }),
      el('div', { class: 'meta', text: c.objective || '' })));
    card.addEventListener('click', () => choose(c));
    grid.append(card);
    items.push({ card, c });
  }
  const newBtn = el('button', { class: 'win charcard', style: { justifyContent: 'center' } }, el('span', { class: 'gold', text: '＋ 新しく作る' }));
  newBtn.addEventListener('click', () => { cleanup(); showCreate(game); });
  grid.append(newBtn);
  const foot = el('div', { class: 'win row', style: { marginTop: '6px', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4em' } },
    el('span', { class: 'small muted', text: chars.length ? 'カードを選ぶ（矢印キーでも動かせる）' : 'まずはキャラクターを作ろう' }),
    el('span', { class: 'row', style: { gap: '0.4em', flexWrap: 'wrap' } },
      ...syncButtons(game, () => cleanup()),
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
    notePlayed(game, c.id);
    game.net.send({ t: 'play', id: c.id });
  };
  const h = {
    pad: true,
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
  // 「連れていく」リンクで 開いた ときは、ここで 聞く。
  // 家族サーバーでは、スマホの データを 合わせてから（とどいて いなければ ときどき 取りに 行く）
  setTimeout(async () => {
    if (game.net.mode === 'server' && !game.syncing) {
      game.syncing = true;
      try {
        if (!(await syncOnServer(game))) await maybeRoundTrip(game);
      } finally {
        game.syncing = false;
      }
    }
    offerPendingImport(game);
  }, 0);
  const delFlow = async () => {
    cleanup();
    const name = await askText(game.input, { title: '消すキャラクターの名前を入れてください（元にもどせません）', max: 8 });
    const c = chars.find((x) => x.name === name);
    if (c && await confirmBox(game.input, `${c.name}を本当に消しますか？\n（セーブも全て消えます）`, '消す', 'やめる', (x) => game.audio.sfx(x))) {
      game.net.send({ t: 'deleteChar', id: c.id, confirm: c.name });
    } else if (name) toast('やめました');
    showSelect(game, game.chars || chars);
  };
}

// 家族サーバー ⇄ ひとりで遊ぶサイト（データを 合わせる）
function syncButtons(game, cleanup) {
  if (game.net.local?.cloud?.inViewer) return [];
  // 行かなかった（やめた）ときは「だれで遊ぶ？」に もどる
  const go = (fn) => async () => {
    cleanup();
    if (!(await fn(game))) showSelect(game, game.chars || []);
  };
  if (game.net.mode === 'server') {
    return [
      el('button', { class: 'btn', text: '📱 ひとりで遊ぶサイトへ', onclick: go(goSite) }),
      el('button', { class: 'btn', text: '🔄 スマホと合わせる', onclick: go(roundTrip) }),
    ];
  }
  const out = [el('button', { class: 'btn primary', text: '家族サーバーで遊ぶ', onclick: go(goFamilyServer) })];
  if (familyServer()) out.push(el('button', { class: 'btn', text: 'アドレス', 'aria-label': '家族サーバーのアドレスを変える', onclick: () => changeServer(game) }));
  return out;
}

// ───────────── 行き来の リンク（ひとりで遊ぶサイト ⇄ 家族サーバー） ─────────────
function goTo(game, url) {
  // claude.ai の 中では 新しい タブ、それ以外は この タブで 開く（ポップアップを ブロックされない）
  if (game.net.local?.cloud?.inViewer) window.open(url, '_blank', 'noopener');
  else location.assign(url);
}

async function offerPendingImport(game) {
  const code = pendingImport();
  if (!code || game.importOffering || document.querySelector('.modal-back, .transfer-panel, .create')) return;
  game.importOffering = true;
  clearPendingImport();
  try {
    const r = parseCode(code);
    if (!r.ok) {
      toast(r.reason, 6000);
      return;
    }
    const place = game.net.mode === 'server' ? `家族サーバー「${game.net.family || 'わが家'}」` : 'このブラウザ';
    const ok = await confirmBox(game.input, `${r.char.name}（Lv${r.char.level}）を\n${place}に連れてきますか？`, '連れてくる', 'やめる', (x) => game.audio.sfx(x));
    if (!ok) {
      toast('やめました');
      return;
    }
    const res = await request(game, { t: 'importChar', code }, 'importResult');
    toast(res.text || '', 6000);
    game.audio.sfx(res.ok ? 'join' : 'buzz');
  } finally {
    game.importOffering = false;
    if (game.state === 'select') showSelect(game, game.chars || []);
  }
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
  const box = el('div', { class: 'win scroll', style: { maxHeight: 'calc(88vh - var(--pad-h))' } });
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
        el('button', { class: 'btn primary', text: '② コードから連れてくる', onclick: importView })),
      game.net.mode === 'server'
        ? el('div', { class: 'col', style: { gap: '0.3em' } },
          el('div', { class: 'small', text: 'PCがついていない時も、スマホだけで遊べる「ひとりで遊ぶサイト」があります。ここから開くと、この家族サーバーのアドレスを覚えるので、あとで1タップで連れてこられます。' }),
          el('div', { class: 'row' }, el('button', { class: 'btn', text: '📱 ひとりで遊ぶサイトを開く', onclick: () => goTo(game, linkToSite(game.net.site || DEFAULT_SITE, { server: siteServerAddress(game.net) })) })))
        : null);
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
        hint.textContent = 'コピーしました！　連れていく先で「② コードから連れてくる」を開いて、はりつけてください。\n（同じスマホなら、そのまま連れていく先をブラウザで開いて、はりつけるだけ）';
      };
      const manual = () => {
        selectAllText(ta);
        hint.className = 'small warn';
        hint.textContent = '自動でコピーできませんでした。コードを全部選んであるので、青いところを長おし →「コピー」してください。';
      };
      // http の 家族サーバーや アプリの 中でも コピーできる やりかたから ためす
      if (copyBySelect(ta)) return copied();
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(r.code).then(copied, manual);
      else manual();
    });
    const send = r.code.length < LINE_MAX
      ? 'べつのスマホへは、LINE・メッセージ・AirDrop・メモなどで送れます。'
      : '長いので、LINEでは送れません。メッセージ・AirDrop・メモなどで送ってください。';
    // 1タップで 連れていく（リンクで 開くと、むこうで「連れてきますか？」と 聞かれる）
    const jump = [];
    if (game.net.mode === 'server') {
      jump.push(el('button', { class: 'btn primary', text: '📱 ひとりで遊ぶサイトへ連れていく', onclick: () => goTo(game, linkToSite(game.net.site || DEFAULT_SITE, { code: r.code, server: siteServerAddress(game.net) })) }));
    } else {
      const toServer = async () => {
        let server = familyServer();
        if (!server) {
          const typed = await askText(game.input, { title: '家族サーバーのアドレスを入れてください（PCの画面に出ている「同じWi-Fiのスマホから」のアドレス）', placeholder: '192.168.1.23:3000', max: 60, initial: '' });
          if (typed === null) return;
          server = setFamilyServer(typed);
          if (!server) {
            toast('アドレスの形がちがうみたい（例: 192.168.1.23:3000）', 5000);
            return;
          }
        }
        goTo(game, linkToFamilyServer(server, r.code));
      };
      jump.push(el('button', { class: 'btn primary', text: '家族サーバーへ連れていく', onclick: toServer }));
      if (familyServer()) jump.push(el('button', { class: 'btn', text: 'アドレスを変える', onclick: async () => {
        const typed = await askText(game.input, { title: '家族サーバーのアドレス', placeholder: '192.168.1.23:3000', max: 60, initial: familyServer().replace(/^https?:\/\//, '') });
        if (typed !== null && !setFamilyServer(typed)) toast('アドレスの形がちがうみたい', 4000);
      } }));
    }
    body.append(
      el('div', { class: 'gold', text: `${r.name}の引っこしコード` }),
      el('div', { class: 'small', text: '連れていく先の「だれで遊ぶ？」→「引っこしコード」→「② コードから連れてくる」で、このコードをはりつけてください。' }),
      el('div', { class: 'row', style: { gap: '0.5em', flexWrap: 'wrap' } }, ...jump),
      el('div', { class: 'small muted', text: game.net.mode === 'server' ? '同じスマホなら、このボタンだけでOK（ひとりで遊ぶサイトが開いて、連れていくか聞かれます）。' : '家に帰ってPCがついていれば、このボタンだけでOK（家族サーバーが開いて、連れていくか聞かれます）。' }),
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
        toast('コードをはりつけてください');
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
  // あたらしい みため（style / hcol / tone / face）。むかしの 番号（hair など）は サーバーが あわせて つける
  const look = { body: 0, style: 'short', hcol: 'brown', tone: 'light', face: 'std', color: 1 };
  let job = 'warrior';
  let dirI = 0;
  const dirs = ['down', 'left', 'up', 'right'];
  const wrap = el('div', { class: 'panel center-panel', style: { width: 'min(96vw, 860px)' } });
  const box = el('div', { class: 'win scroll', style: { maxHeight: 'calc(86vh - var(--pad-h))' } });
  const preview = makeCanvas(128, 168);
  const sprite = previewCache(16);
  const name = el('input', { class: 'textin', id: 'cname', maxlength: '8', placeholder: '名前（8文字まで）', autocomplete: 'off' });
  const jobDesc = el('div', { class: 'jobdesc' });
  const draw = () => {
    const x = ctxOf(preview);
    x.clearRect(0, 0, preview.width, preview.height);
    x.drawImage(sprite(look, job, undefined, dirs[dirI], Math.floor(performance.now() / 300) % 2, 8), 0, 0);
  };
  const timer = setInterval(draw, 150);
  const upd = [];
  const refresh = () => { upd.forEach((f) => f()); draw(); };
  const row = (label, node, note) => el('div', { class: 'col', style: { gap: '0.2em' } },
    el('span', { class: 'small gold' }, label, note ? el('span', { class: 'muted cr-note' }, note) : ''), node);
  // ボタンを ならべる（えらんだ ものに しるし）
  const opts = (values, get, set, render) => {
    const o = el('div', { class: 'opt' });
    values.forEach((v) => {
      const b = render(v);
      b.addEventListener('click', () => {
        set(v);
        game.audio.sfx('cursor');
        refresh();
      });
      o.append(b);
    });
    upd.push(() => values.forEach((v, i) => o.children[i].classList.toggle('sel', get() === v)));
    return o;
  };
  // ◀ なまえ ▶（数が 多い ものは じゅんばんに めくる）
  const stepper = (list, key) => {
    const nm = el('span', { class: 'step-name' });
    const no = el('span', { class: 'small muted step-no' });
    const go = (d) => {
      const i = list.findIndex((x) => x.id === look[key]);
      look[key] = list[(i + d + list.length) % list.length].id;
      game.audio.sfx('cursor');
      refresh();
    };
    upd.push(() => {
      const i = list.findIndex((x) => x.id === look[key]);
      nm.textContent = list[i]?.name || '';
      no.textContent = `${i + 1}/${list.length}`;
    });
    return el('div', { class: 'stepper' },
      el('button', { class: 'btn', text: '◀', 'aria-label': 'まえ', onclick: () => go(-1) }), nm, no,
      el('button', { class: 'btn', text: '▶', 'aria-label': 'つぎ', onclick: () => go(1) }));
  };
  const swatches = (list, key, label) => opts(list.map((x) => x.id), () => look[key], (v) => { look[key] = v; },
    (v) => el('button', { class: 'swatch', style: { background: list.find((x) => x.id === v).hex }, 'aria-label': label }));
  const nameOf = (list, key) => {
    const s = el('span');
    upd.push(() => { s.textContent = `　${list.find((x) => x.id === look[key])?.name || ''}`; });
    return s;
  };
  const bodyOpt = opts([0, 1], () => look.body, (v) => { look.body = v; }, (v) => el('button', { class: 'btn', text: v ? '女性' : '男性' }));
  const hairOpt = stepper(HAIR_STYLES, 'style');
  const hairCol = swatches(HAIR_COLORS, 'hcol', 'かみの色');
  const faceOpt = opts(FACES.map((x) => x.id), () => look.face, (v) => { look.face = v; }, (v) => el('button', { class: 'btn', text: FACE_BY_ID.get(v).name }));
  const skinOpt = swatches(SKIN_TONES, 'tone', 'はだの色');
  const clothOpt = opts(CLOTH_COLORS.map((_, i) => i), () => look.color, (v) => { look.color = v; }, (v) => el('button', { class: 'swatch', style: { background: CLOTH_COLORS[v] }, 'aria-label': '服の色' }));
  const pick = (list) => list[Math.floor(Math.random() * list.length)].id;
  const rnd = el('button', { class: 'btn', text: 'おまかせ', onclick: () => {
    look.style = pick(HAIR_STYLES);
    look.hcol = pick(HAIR_COLORS);
    look.face = pick(FACES);
    look.tone = pick(SKIN_TONES);
    look.color = Math.floor(Math.random() * CLOTH_COLORS.length);
    game.audio.sfx('cursor');
    refresh();
  } });
  const jobsEl = el('div', { class: 'jobs' });
  JOB_ORDER.forEach((j) => {
    const b = el('button', { class: `btn jobbtn ${j === job ? 'sel' : ''}` }, el('span', { class: 'jn', text: JOBS[j].name }), el('span', { class: 'jd', text: {
      warrior: '固くて強い', monk: 'とても素早い', priest: '回復の女神', mage: '攻撃呪文', performer: 'みんなをおうえん',
      jester: '何が起こるかな？', salaryman: 'チームを支える', idol: 'みんなの人気者', railman: '時間に正確', ballplayer: 'かっとばせ！',
      schoolkid: 'のびざかり！', civil_local: '町を守る', cook: '食べて元気に', parttimer: '何でもこなす',
      neet: 'のびしろ無限大', saiyan: '戦闘民族', youtuber: '動画で人気者', gamer: 'ゲームの達人', okan: 'みんなのおかん',
    }[j] }));
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
      el('div', { class: 'preview' }, preview, el('div', { class: 'col pv-btns' }, turn, rnd)),
      el('div', { class: 'col' },
        row('名前', name),
        row('体', bodyOpt),
        row('かみがた', hairOpt),
        row('かみの色', hairCol, nameOf(HAIR_COLORS, 'hcol')),
        row('目もと', faceOpt),
        row('はだの色', skinOpt, nameOf(SKIN_TONES, 'tone')),
        row('服の色', clothOpt),
        row('最初の職業（後で転職できる）', jobsEl),
        jobDesc,
        el('div', { class: 'row end' }, back, ok))),
  );
  wrap.append(box);
  ui.append(wrap);
  refresh();
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
      toast('名前を入れてください');
      name.focus();
      return;
    }
    cleanup();
    game.audio.sfx('join');
    game.pendingPlay = true;
    game.net.send({ t: 'createChar', name: n, look: cleanLook(look), job });
  });
  setTimeout(() => name.focus(), 50);
}
