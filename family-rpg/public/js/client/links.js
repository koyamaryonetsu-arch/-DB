// ひとりで遊ぶサイト（Webサイト）と 家族サーバーを 行き来する リンク
//
//   https://…/#kizuna=<引っこしコード>&server=<家族サーバーの アドレス>
//   http://192.168.…:3000/#kizuna=<引っこしコード>
// を 開くと、ログインの あとで「〇〇を連れてきますか？」と 聞く。
// server= は ひとりで遊ぶサイトが おぼえておく（つぎから「家族サーバーへ連れていく」ボタンが つかえる）。

// ひとりで遊ぶサイト（GitHub Pages。家族サーバーの config.json の siteUrl で かえられる）
export const DEFAULT_SITE = 'https://koyamaryonetsu-arch.github.io/-DB/';
const SERVER_KEY = 'kizuna_family_server';
const PENDING_KEY = 'kizuna_pending_import';

// ページを 開いた ときに よぶ。リンクの 中みを しまって、アドレスバーからは 消す
export function readLinkHash(loc = globalThis.location, hist = globalThis.history) {
  const h = String(loc?.hash || '').replace(/^#/, '');
  if (!/(^|&)(kizuna|server)=/.test(h)) return null;
  const params = new URLSearchParams(h);
  const code = params.get('kizuna');
  const server = normalizeServer(params.get('server'));
  try {
    if (server) localStorage.setItem(SERVER_KEY, server);
  } catch { /* */ }
  try {
    if (code) sessionStorage.setItem(PENDING_KEY, code);
  } catch { /* */ }
  try {
    hist?.replaceState(null, '', loc.pathname + loc.search);
  } catch { /* */ }
  return { code, server };
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
