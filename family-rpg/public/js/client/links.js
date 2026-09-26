// ひとりで遊ぶサイト（Webサイト）と 家族サーバーを 行き来する リンク
//
//   https://…/#kizuna=<引っこしコード>&server=<家族サーバーの アドレス>
//   http://192.168.…:3000/#kizuna=<引っこしコード>
// を 開くと、ログインの あとで「〇〇を連れてきますか？」と 聞く。
// server= は ひとりで遊ぶサイトが おぼえておく（つぎから「家族サーバーへ連れていく」ボタンが つかえる）。
//
// データを 合わせる リンク（sync.js・ui/syncui.js）
//   家族サーバー: http://…/#sync=<キャラの データ>            … 合わせて 保存する
//   サイト:       https://…/#sync=<データ>&back=<家族サーバー>  … 合わせたら、このスマホの データを 持って もどる

// ひとりで遊ぶサイト（GitHub Pages。家族サーバーの config.json の siteUrl で かえられる）
export const DEFAULT_SITE = 'https://koyamaryonetsu-arch.github.io/-DB/kizuna/';
const SERVER_KEY = 'kizuna_family_server';
const PENDING_KEY = 'kizuna_pending_import';
const SYNC_KEY = 'kizuna_pending_sync';
const BACK_KEY = 'kizuna_sync_back';
const ASK_SERVER_KEY = 'kizuna_ask_server';
const MINE_KEY = 'kizuna_mine';

// ページを 開いた ときに よぶ。リンクの 中みを しまって、アドレスバーからは 消す
export function readLinkHash(loc = globalThis.location, hist = globalThis.history) {
  const h = String(loc?.hash || '').replace(/^#/, '');
  if (!/(^|&)(kizuna|server|sync|back)=/.test(h)) return null;
  const params = new URLSearchParams(h);
  const code = params.get('kizuna');
  const sync = params.get('sync');
  const back = normalizeServer(params.get('back'));
  const server = normalizeServer(params.get('server'));
  // 家の 中の アドレス（192.168.… など）なら すぐ おぼえる。ちがう ときは 画面で たしかめてから
  try {
    if (server && (isHomeAddress(server) || server === familyServer())) localStorage.setItem(SERVER_KEY, server);
    else if (server) sessionStorage.setItem(ASK_SERVER_KEY, server);
  } catch { /* */ }
  try {
    if (code) sessionStorage.setItem(PENDING_KEY, code);
    if (sync !== null) sessionStorage.setItem(SYNC_KEY, sync);
    if (back) sessionStorage.setItem(BACK_KEY, back);
    else if (sync !== null) sessionStorage.removeItem(BACK_KEY);
  } catch { /* */ }
  try {
    hist?.replaceState(null, '', loc.pathname + loc.search);
  } catch { /* */ }
  return { code, server, sync, back };
}

// 家の 中（LAN）・Tailscale などの アドレスか（知らない サイトへ データを 送らない ため）
export function isHomeAddress(url) {
  let host = '';
  try {
    host = new URL(normalizeServer(url)).hostname.replace(/^\[|\]$/g, '').toLowerCase();
  } catch {
    return false;
  }
  if (!host) return false;
  if (host === 'localhost' || /\.(local|lan|home|internal|ts\.net)$/.test(host) || !host.includes('.') && !host.includes(':')) return true;
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    return a === 10 || a === 127 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127);
  }
  return host === '::1' || /^f[cd][0-9a-f]{2}:/.test(host) || host.startsWith('fe80:');
}

// たしかめ待ちの 家族サーバーの アドレス（家の 外の アドレスが リンクで とどいた とき）
export function takeAskServer() {
  try {
    const s = sessionStorage.getItem(ASK_SERVER_KEY) || '';
    sessionStorage.removeItem(ASK_SERVER_KEY);
    return s;
  } catch {
    return '';
  }
}

// とどいた データ（合わせる）
export function pendingSync() {
  try {
    const text = sessionStorage.getItem(SYNC_KEY);
    return text === null ? null : { text, back: sessionStorage.getItem(BACK_KEY) || '' };
  } catch {
    return null;
  }
}

export function clearPendingSync() {
  try {
    sessionStorage.removeItem(SYNC_KEY);
    sessionStorage.removeItem(BACK_KEY);
  } catch { /* */ }
}

// データを 合わせる リンク
export function syncLink(base, { text = '', back = '', server = '' } = {}) {
  const b = String(base || '').split('#')[0];
  const parts = [`sync=${encodeURIComponent(text)}`];
  if (back) parts.push(`back=${encodeURIComponent(back)}`);
  if (server) parts.push(`server=${encodeURIComponent(server)}`);
  return `${b}${b.endsWith('/') ? '' : '/'}#${parts.join('&')}`;
}

// この スマホで 遊んだ キャラ（家族サーバーの 画面で おぼえる）
export function mineIds() {
  try {
    const a = JSON.parse(localStorage.getItem(MINE_KEY) || '[]');
    return Array.isArray(a) ? a.filter((x) => typeof x === 'string').slice(0, 12) : [];
  } catch {
    return [];
  }
}

export function rememberMine(ids) {
  const list = [...new Set([...(ids || []).filter((x) => typeof x === 'string'), ...mineIds()])].slice(0, 12);
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(list));
  } catch { /* */ }
  return list;
}

export function pendingImport() {
  try {
    return sessionStorage.getItem(PENDING_KEY) || '';
  } catch {
    return '';
  }
}

export function clearPendingImport() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch { /* */ }
}

// 「192.168.1.23:3000」→「http://192.168.1.23:3000」
export function normalizeServer(text) {
  let t = String(text || '').trim().replace(/\/+$/, '');
  if (!t) return '';
  if (!/^https?:\/\//i.test(t)) t = 'http://' + t;
  try {
    const u = new URL(t);
    if (!/^https?:$/.test(u.protocol) || !u.hostname) return '';
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

export function familyServer() {
  try {
    return localStorage.getItem(SERVER_KEY) || '';
  } catch {
    return '';
  }
}

export function setFamilyServer(text) {
  const s = normalizeServer(text);
  if (!s) return '';
  try {
    localStorage.setItem(SERVER_KEY, s);
  } catch { /* */ }
  return s;
}

// 家族サーバーへ（ひとりで遊ぶサイトから）
export function linkToFamilyServer(server, code) {
  return `${normalizeServer(server)}/#kizuna=${encodeURIComponent(code)}`;
}

// ひとりで遊ぶサイトへ（家族サーバーから）。server … 家族サーバーの アドレス（おぼえてもらう）
export function linkToSite(site, { code = '', server = '' } = {}) {
  const base = String(site || DEFAULT_SITE).split('#')[0];
  const parts = [];
  if (code) parts.push(`kizuna=${encodeURIComponent(code)}`);
  if (server) parts.push(`server=${encodeURIComponent(server)}`);
  return parts.length ? `${base}#${parts.join('&')}` : base;
}

// この 家族サーバーを、ほかの スマホから 開く アドレス
export function serverAddress(net, loc = globalThis.location) {
  const here = loc?.origin || '';
  const local = /^https?:\/\/(localhost|127\.|\[::1\])/i.test(here);
  if (!local && here) return here;
  return (net?.urls || [])[0] || here;
}
