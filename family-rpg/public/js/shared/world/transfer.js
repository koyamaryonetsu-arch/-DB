// 引っこしコード: キャラクターを べつの 場所へ つれていく
// （このブラウザの ひとりモード ⇄ 家族サーバー。コードを コピーして、むこうで はりつける）
//
// 形: KIZUNA-1-<しるし8もじ>-<base64>
//   しるし … とちゅうで 切れていないか たしかめる ための かず
import { repairChar, upgradeSave, SAVE_VERSION } from './save.js';

const PREFIX = 'KIZUNA-1-';
export const CODE_MAX = 400000;
export const CHAR_MAX = 12;

// キャラの ID は 英数字だけ（'__proto__' などは つかわせない）
function validId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(id) && !['__proto__', 'constructor', 'prototype'].includes(id);
}

function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function toBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

// キャラクター → コード
export function exportCode(char, now = Date.now()) {
  const json = JSON.stringify({ v: SAVE_VERSION, at: now, char });
  return `${PREFIX}${hash(json)}-${toBase64(json)}`;
}

// コード → キャラクター（こわれていたら reason）
export function parseCode(text) {
  const code = String(text || '').replace(/\s+/g, '');
  if (!code) return { ok: false, reason: 'コードを入れてね' };
  if (code.length > CODE_MAX) return { ok: false, reason: 'コードが長すぎます' };
  if (!code.startsWith(PREFIX)) return { ok: false, reason: '引っこしコードではないみたい' };
  const rest = code.slice(PREFIX.length);
  const dash = rest.indexOf('-');
  if (dash !== 8) return { ok: false, reason: 'コードがこわれているみたい' };
  let json;
  try {
    json = fromBase64(rest.slice(dash + 1));
  } catch {
    return { ok: false, reason: 'コードがとちゅうで切れているみたい。全部コピーしてね' };
  }
  if (hash(json) !== rest.slice(0, 8)) return { ok: false, reason: 'コードがとちゅうで切れているみたい。全部コピーしてね' };
  let body;
  try {
    body = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'コードがこわれているみたい' };
  }
  const c = body?.char;
  if (!c || typeof c !== 'object' || !validId(c.id) || typeof c.name !== 'string') return { ok: false, reason: 'キャラクターが入っていないみたい' };
  // むかしの 版の コードも 読める 形に
  const up = upgradeSave({ version: Number(body.v) || 1, characters: { [c.id]: c } });
  const char = up.data.characters[c.id];
  if (!char) return { ok: false, reason: 'キャラクターが読めませんでした' };
  return { ok: true, char, at: body.at || 0 };
}

// data（セーブ）に キャラを 入れる。もどりち: { ok, mode: 'new'|'updated'|'kept', name, reason }
//  ・はじめての キャラ … 新しく 入れる（おなじ 名前が いたら 名前の うしろに 数字）
//  ・もう いる キャラ … コードの ほうが あとに 遊んだ ものなら 入れかえる。そうでなければ そのまま
export function importChar(data, incoming, { online = () => false } = {}) {
  const c = repairChar(JSON.parse(JSON.stringify(incoming)));
  if (!c || !validId(c.id)) return { ok: false, reason: 'キャラクターが読めませんでした' };
  c.name = String(c.name).replace(/[<>&"'\s]/g, '').slice(0, 8) || '勇者';
  const chars = data.characters;
  // 家族の キャラを つれていく しるし（fam:）は、この セーブに いない 人の ぶんを はずす
  if (Array.isArray(c.partyKeys)) c.partyKeys = c.partyKeys.filter((k) => !String(k).startsWith('fam:') || chars[String(k).slice(4)]);
  const mine = chars[c.id];
  if (mine) {
    if (online(c.id)) return { ok: false, reason: `${mine.name}は今遊んでいるので、終わってからにしてね` };
    if ((c.lastPlayed || 0) <= (mine.lastPlayed || 0)) return { ok: true, mode: 'kept', name: mine.name };
    c.name = mine.name;
    chars[c.id] = c;
    return { ok: true, mode: 'updated', name: c.name };
  }
  if (Object.keys(chars).length >= CHAR_MAX) return { ok: false, reason: `キャラクターは${CHAR_MAX}人までです` };
  const names = new Set(Object.values(chars).map((x) => x.name));
  if (names.has(c.name)) {
    const base = c.name.slice(0, 7);
    for (let i = 2; i < 100; i++) {
      const n = `${base}${i}`.slice(0, 8);
      if (!names.has(n)) {
        c.name = n;
        break;
      }
    }
  }
  chars[c.id] = c;
  return { ok: true, mode: 'new', name: c.name };
}
