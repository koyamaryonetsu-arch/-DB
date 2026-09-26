// 家族サーバー ⇄ ひとりで遊ぶサイトを 行き来する ときに、キャラの データを 合わせる（画面の がわ）
//
// ・サイト →「🏠 家族サーバーで遊ぶ」… この スマホで 進んだ キャラを 持っていって 家族サーバーで 合わせる
// ・家族サーバー →「📱 ひとりで遊ぶサイトへ」… この スマホで 遊んだ キャラを サイトに 持っていく
// ・家族サーバーを 開いた とき … ときどき サイトへ ちょっと 行って、スマホの データを 持って もどってくる
//   （家族サーバーで 遊ぶ まえに、ひとりで 進めた ぶんが かならず 家族サーバーに 入る）
// どちらで 遊んだ ぶんも なくならない ように、合わせかたは shared/world/sync.js・merge.js
import { el, toast, confirmBox, askText } from './dom.js';
import {
  DEFAULT_SITE, familyServer, setFamilyServer, normalizeServer, serverAddress, isHomeAddress, takeAskServer,
  pendingSync, clearPendingSync, syncLink, mineIds, rememberMine,
} from '../links.js';

const LINKED_KEY = 'kizuna_site_linked';
const TRIP_KEY = 'kizuna_trip_at';
const TRIP_GAP = 20 * 60 * 1000;

const store = {
  get(k) {
    try {
      return localStorage.getItem(k) || '';
    } catch {
      return '';
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch { /* */ }
  },
};

// サーバー（家族サーバー・この ブラウザ）に たのんで、返事を まつ
export function request(game, msg, want, ms = 15000) {
  return new Promise((resolve) => {
    const w = (m) => {
      if (m.t !== want) return false;
      game.waiters.delete(w);
      clearTimeout(timer);
      resolve(m);
      return true;
    };
    const timer = setTimeout(() => {
      game.waiters.delete(w);
      resolve({ t: want, ok: false, timeout: true, text: '通信がおくれています' });
    }, ms);
    game.waiters.add(w);
    game.net.send(msg);
  });
}

// 「合わせています…」の まく（うまく いかない ときの ボタンつき）
function overlay(text, fallback) {
  document.querySelector('.sync-cover')?.remove();
  const box = el('div', { class: 'win col', style: { maxWidth: 'min(90vw, 460px)', gap: '0.6em', textAlign: 'center' } },
    el('div', { class: 'gold', text: '🔄 データを合わせています' }),
    el('div', { class: 'small', text }));
  const cover = el('div', { class: 'sync-cover' }, box);
  if (fallback) {
    const btn = el('button', { class: 'btn', text: fallback.label, onclick: fallback.run });
    btn.hidden = true;
    box.append(btn);
    setTimeout(() => { btn.hidden = false; }, 6000);
  }
  document.getElementById('app').append(cover);
  return cover;
}

const standalone = () => {
  try {
    return !!navigator.standalone || matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  } catch {
    return false;
  }
};

function siteBase(game) {
  return String(game.net.site || DEFAULT_SITE).split('#')[0];
}

function showLines(lines, ms = 7000) {
  if (lines?.length) toast(lines.join('\n'), ms);
}

// ─────────── ひとりで遊ぶサイトの がわ ───────────

// 家族サーバーから とどいた データを 合わせる（back が あれば、この スマホの データを 持って もどる）
export async function syncOnSite(game) {
  const p = pendingSync();
  if (!p) return false;
  clearPendingSync();
  const back = normalizeServer(p.back);
  let cover = null;
  if (back) {
    cover = overlay('家族サーバーから来ました。このスマホのデータと合わせて、すぐにもどります…', { label: '家族サーバーにもどる', run: () => location.replace(back) });
  }
  let lines = [];
  if (p.text) {
    const r = await request(game, { t: 'syncIn', text: p.text }, 'syncResult', 20000);
    lines = r.lines || (r.ok === false ? [r.text] : []);
  }
  if (!back) {
    game.audio.sfx('join');
    showLines(lines.length ? lines : ['家族サーバーのデータと合わせました']);
    return true;
  }
  // 家の 中の アドレスでなければ、送って いいか 聞く
  if (!isHomeAddress(back) && back !== familyServer()) {
    cover.remove();
    const ok = await confirmBox(game.input, `このスマホのキャラのデータを\n${back}\nに送りますか？（家族サーバーのアドレスでなければ「やめる」）`, '送る', 'やめる', (x) => game.audio.sfx(x));
    if (!ok) {
      toast('やめました');
      return true;
    }
    overlay('家族サーバーにもどります…');
  }
  setFamilyServer(back);
  const out = await request(game, { t: 'syncOut', onlyChanged: true }, 'syncPayload', 20000);
  location.replace(syncLink(back, { text: out.text || '' }));
  return true;
}

// 「🏠 家族サーバーで遊ぶ」: この スマホで 進んだ キャラを 持って 家族サーバーへ
// もどりち: 家族サーバーへ 行く とき true
export async function goFamilyServer(game) {
  let server = familyServer();
  if (!server) {
    const typed = await askText(game.input, { title: '家族サーバーのアドレスを入れてね（PCの画面の「同じWi-Fiのスマホから」のアドレス）', placeholder: '192.168.1.23:3000', max: 80, initial: '' });
    if (typed === null) return false;
    server = setFamilyServer(typed);
    if (!server) {
      toast('アドレスの形がちがうみたい（例: 192.168.1.23:3000）', 5000);
      return false;
    }
  }
  overlay('このスマホで進めたキャラを持って、家族サーバーへ行きます…\n（家族サーバーが開かないときは、家のWi-Fiにつながっているか、PCがついているか見てね）');
  const out = await request(game, { t: 'syncOut', onlyChanged: true }, 'syncPayload', 20000);
  const url = out.text ? syncLink(server, { text: out.text }) : `${server}/`;
  if (game.net.local?.cloud?.inViewer) {
    document.querySelector('.sync-cover')?.remove();
    window.open(url, '_blank', 'noopener');
    return false;
  }
  location.assign(url);
  return true;
}

export async function changeServer(game) {
  const typed = await askText(game.input, { title: '家族サーバーのアドレス', placeholder: '192.168.1.23:3000', max: 80, initial: familyServer().replace(/^https?:\/\//, '') });
  if (typed === null) return;
  if (!setFamilyServer(typed)) toast('アドレスの形がちがうみたい', 4000);
  else toast(`家族サーバー: ${familyServer()}`);
}

// リンクで 家の 外の アドレスが とどいた ときは たしかめる
export async function confirmAskedServer(game) {
  const s = takeAskServer();
  if (!s) return;
  const ok = await confirmBox(game.input, `家族サーバーのアドレスを\n${s}\nにしますか？`, 'する', 'しない', (x) => game.audio.sfx(x));
  if (ok) setFamilyServer(s);
}

// ─────────── 家族サーバーの がわ ───────────

// サイトから とどいた データを 合わせる（ログインの あと）
export async function syncOnServer(game) {
  const p = pendingSync();
  if (!p) return false;
  clearPendingSync();
  store.set(LINKED_KEY, '1');
  store.set(TRIP_KEY, String(Date.now()));
  if (!p.text) return true;
  const r = await request(game, { t: 'syncIn', text: p.text }, 'syncResult', 20000);
  rememberMine((r.results || []).filter((x) => x.id && !['bad', 'full', 'deleted'].includes(x.mode)).map((x) => x.id));
  if (r.ok === false) toast(r.text || '合わせられませんでした', 6000);
  else {
    game.audio.sfx('join');
    const lines = r.lines?.length ? r.lines : ['スマホのデータは、家族サーバーと同じでした'];
    showLines([...lines, '（家族サーバーに保存しました）']);
  }
  return true;
}

// 家族サーバーを 開いた とき: ひとりで遊ぶサイトの データを 取りに 行く（ときどき・自動）
export async function maybeRoundTrip(game) {
  if (game.net.mode !== 'server' || game.tripChecked) return false;
  game.tripChecked = true;
  if (!store.get(LINKED_KEY) || standalone()) return false;
  if (Date.now() - (Number(store.get(TRIP_KEY)) || 0) < TRIP_GAP) return false;
  // サイトに つながるか（インターネットが なければ 行かない）
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    // 中みは 読まない（no-cors）。とどけば OK
    await fetch(`${siteBase(game)}version.json`, { cache: 'no-store', mode: 'no-cors', signal: ctrl.signal });
    clearTimeout(t);
  } catch {
    return false;
  }
  if (document.querySelector('.modal-back, .transfer-panel, .create') || game.state !== 'select') return false;
  return roundTrip(game);
}

// サイトへ ちょっと 行って、スマホの データを 持って もどる（家族サーバーの キャラも スマホに 保存）
export async function roundTrip(game) {
  store.set(TRIP_KEY, String(Date.now()));
  overlay('このスマホの「ひとりで遊ぶサイト」のデータを取りに行きます。すぐにもどります…');
  const ids = mineIds();
  const out = ids.length ? await request(game, { t: 'syncOut', ids }, 'syncPayload', 20000) : { text: '' };
  location.assign(syncLink(siteBase(game), { text: out.text || '', back: serverAddress(game.net) }));
  return true;
}

// 「📱 ひとりで遊ぶサイトへ」: この スマホで 遊んだ キャラを 持っていく
export async function goSite(game) {
  store.set(LINKED_KEY, '1');
  let ids = mineIds();
  if (!ids.length) {
    // どの キャラか わからない ときは 聞く
    const pick = await pickChars(game);
    if (!pick) return false;
    ids = rememberMine(pick);
  }
  overlay('このスマホで遊んだキャラを持って、ひとりで遊ぶサイトへ行きます…');
  const out = await request(game, { t: 'syncOut', ids }, 'syncPayload', 20000);
  location.assign(syncLink(siteBase(game), { text: out.text || '', server: serverAddress(game.net) }));
  return true;
}

function pickChars(game) {
  const chars = game.chars || [];
  if (!chars.length) return Promise.resolve([]);
  return new Promise((resolve) => {
    const back = el('div', { class: 'modal-back' });
    const box = el('div', { class: 'win col', style: { maxWidth: 'min(92vw, 520px)', gap: '0.5em' } },
      el('div', { class: 'gold', text: 'どのキャラをスマホに持っていく？' }));
    const picked = new Set();
    const row = el('div', { class: 'row', style: { flexWrap: 'wrap', gap: '0.4em' } });
    for (const c of chars) {
      const b = el('button', { class: 'btn', text: `${c.name}（Lv${c.level}）` });
      b.addEventListener('click', () => {
        if (picked.has(c.id)) picked.delete(c.id);
        else picked.add(c.id);
        b.classList.toggle('sel', picked.has(c.id));
      });
      row.append(b);
    }
    const done = (v) => {
      back.remove();
      game.input.pop(h);
      resolve(v);
    };
    const h = { onNav: (a) => { if (a === 'b') done(null); } };
    game.input.push(h);
    box.append(row,
      el('div', { class: 'small muted', text: '選んだキャラが、このスマホの「ひとりで遊ぶサイト」にも保存されます。' }),
      el('div', { class: 'row', style: { gap: '0.5em' } },
        el('button', { class: 'btn primary', text: '持っていく', onclick: () => done([...picked]) }),
        el('button', { class: 'btn', text: 'やめる', onclick: () => done(null) })));
    back.append(box);
    document.getElementById('ui').append(back);
  });
}

// 家族サーバーで キャラを えらんだ: この スマホの キャラと して おぼえる
export function notePlayed(game, id) {
  if (game.net.mode === 'server') rememberMine([id]);
}
