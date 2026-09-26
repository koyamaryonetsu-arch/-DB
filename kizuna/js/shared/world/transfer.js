// 引っこしコード: キャラクターを べつの 場所へ つれていく
// （このブラウザの ひとりモード ⇄ 家族サーバー。コードを コピーして、むこうで はりつける）
//
// 形: KIZUNA-2-<しるし8もじ>-<ちぢめた データ>
//   しるし … とちゅうで 切れていないか たしかめる ための かず
//   ちぢめた データ … LZW で ちぢめて、英数字と - _ だけで 書いたもの
//   （LINE で 送れるように。LINE は 1回に 1万文字まで。仲間が いっぱいでも 7千文字ほど）
// むかしの KIZUNA-1-<しるし>-<base64> も 読める
import { repairChar, upgradeSave, SAVE_VERSION } from './save.js?v=cb6fd0fb30e1';

const PREFIX = 'KIZUNA-2-';
const PREFIX_V1 = 'KIZUNA-1-';
export const CODE_MAX = 400000;
export const LINE_MAX = 10000;
export const CHAR_MAX = 12;

// キャラの ID は 英数字だけ（'__proto__' などは つかわせない）
export function validId(id) {
  return typeof id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(id) && !['__proto__', 'constructor', 'prototype'].includes(id);
}

export function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// ───── LZW（UTF-8 の バイトを ちぢめる。1つの 番号は 8〜16ビット） ─────
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const DICT_MAX = 1 << 16;
const OUT_MAX = 4000000;
// k 番めの 番号の ビット数（書く ほうと 読む ほうで おなじ）
const width = (k) => Math.max(8, 32 - Math.clz32(Math.min(255 + k, DICT_MAX - 1)));

export function pack(text) {
  const bytes = new TextEncoder().encode(text);
  if (!bytes.length) return '';
  const out = [];
  let acc = 0;
  let nacc = 0;
  let k = 0;
  const emit = (code) => {
    for (let i = width(k++) - 1; i >= 0; i--) {
      acc = (acc << 1) | ((code >> i) & 1);
      if (++nacc === 6) {
        out.push(ABC[acc]);
        acc = 0;
        nacc = 0;
      }
    }
  };
  const dict = new Map();
  let next = 256;
  const codeOf = (w) => (w.length === 1 ? w.charCodeAt(0) : dict.get(w));
  let w = String.fromCharCode(bytes[0]);
  for (let i = 1; i < bytes.length; i++) {
    const c = String.fromCharCode(bytes[i]);
    const wc = w + c;
    if (dict.has(wc)) {
      w = wc;
      continue;
    }
    emit(codeOf(w));
    if (next < DICT_MAX) dict.set(wc, next++);
    w = c;
  }
  emit(codeOf(w));
  if (nacc) out.push(ABC[acc << (6 - nacc)]);
  return out.join('');
}

export function unpack(str) {
  if (!str) return '';
  let acc = 0;
  let nacc = 0;
  let p = 0;
  let k = 0;
  const read = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) {
      if (!nacc) {
        acc = ABC.indexOf(str[p++]);
        if (acc < 0) throw new Error('bad char');
        nacc = 6;
      }
      nacc--;
      v = (v << 1) | ((acc >> nacc) & 1);
    }
    return v;
  };
  const entries = [];
  for (let i = 0; i < 256; i++) entries.push(String.fromCharCode(i));
  let prev = entries[read(width(k++))];
  const parts = [prev];
  let total = prev.length;
  // のこりが 1つぶんより 少なければ おわり（さいごの すきまは 5ビットまで、番号は 8ビット以上）
  while ((str.length - p) * 6 + nacc >= width(k)) {
    const code = read(width(k++));
    let cur;
    if (code < entries.length) cur = entries[code];
    else if (code === entries.length) cur = prev + prev[0];
    else throw new Error('bad code');
    total += cur.length;
    if (total > OUT_MAX) throw new Error('too long');
    parts.push(cur);
    if (entries.length < DICT_MAX) entries.push(prev + cur[0]);
    prev = cur;
  }
  const bin = parts.join('');
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
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
  return `${PREFIX}${hash(json)}-${pack(json)}`;
}

// コード → キャラクター（こわれていたら reason）
export function parseCode(text) {
  const code = String(text || '').replace(/\s+/g, '');
  if (!code) return { ok: false, reason: 'コードを入れてね' };
  if (code.length > CODE_MAX) return { ok: false, reason: 'コードが長すぎます' };
  const v1 = code.startsWith(PREFIX_V1);
  if (!v1 && !code.startsWith(PREFIX)) return { ok: false, reason: '引っこしコードではないみたい' };
  const rest = code.slice(PREFIX.length);
  const dash = rest.indexOf('-');
  if (dash !== 8) return { ok: false, reason: 'コードがこわれているみたい' };
  let json;
  try {
    json = v1 ? fromBase64(rest.slice(dash + 1)) : unpack(rest.slice(dash + 1));
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
