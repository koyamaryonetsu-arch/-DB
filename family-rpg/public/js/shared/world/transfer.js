// 引っこしコード: キャラクターを べつの 場所へ つれていく
// （このブラウザの ひとりモード ⇄ 家族サーバー。コードを コピーして、むこうで はりつける）
//
// 形: KIZUNA-2-<しるし8もじ>-<ちぢめた データ>
//   しるし … とちゅうで 切れていないか たしかめる ための かず
//   ちぢめた データ … LZW で ちぢめて、英数字と - _ だけで 書いたもの
//   （LINE で 送れるように。LINE は 1回に 1万文字まで）
// 仲間が 多くて 1万文字を こえる ときは KIZUNA-3-（仲間の 空の 項目と ID を はぶいた 形。slimChar / unslimChar）。
//   仲間 40人（いっぱい）でも 9千文字ほど。こえない ときは 今までどおり KIZUNA-2-（前の 版でも 読める）
//   第51回: 幻の職業の 記録（feats）は KIZUNA-3 では みじかい 文字（world/phantom.js の packFeats。前の 版も そのまま 読める）
// 第51回: それでも 1万文字を こえる ときは KIZUNA-4-（KIZUNA-3 の 形に 加えて、ぜんぶ true の flags・chests を 名前の ならびに、
//   図鑑〈bestiary〉を 同じ 中みごとに まとめた 形。slimChar4 / unslimChar4）。KIZUNA-3 で 入る ときは KIZUNA-3（前の 版でも 読める）
// むかしの KIZUNA-1-<しるし>-<base64> も 読める
import { repairChar, upgradeSave, SAVE_VERSION } from './save.js';
import { dropGoneFamily } from '../data/wagon.js';
import { packFeats, unpackFeats } from './phantom.js';

const PREFIX = 'KIZUNA-2-';
const PREFIX_V1 = 'KIZUNA-1-';
const PREFIX_V3 = 'KIZUNA-3-';
const PREFIX_V4 = 'KIZUNA-4-';
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

// ───── KIZUNA-3: 仲間の 空の 項目を はぶく（読む ときに もとに もどす。仲間 40人でも LINE で 1回）─────
// はぶくのは、ここに ある 項目が この 空の 形と まったく 同じ ときだけ（もどすと 同じ 物に なる）
const COMP_EMPTY = {
  look: null, job: null, jobs: {}, items: [], keyItems: [], seeds: {}, status: {}, flags: {}, chests: {}, sparkles: {}, quests: {}, kills: {},
  skillUse: {}, hirameki: [], supportLog: [], pos: null, spawn: null, objective: '',
  equip: { weapon: null, armor: null, shield: null, head: null, acc: null },
};
const MON_KEYS = ['look', 'job', 'jobs', 'items', 'seeds', 'status', 'flags', 'equip'];
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// 魔物あずかり所の 魔物（c.storage。第43回 C）も 同じ 形なので いっしょに はぶく
const slimList = (char, list) => list.map((e) => {
  if (!e?.char || typeof e.char !== 'object') return e;
  const ch = {};
  for (const [k, v] of Object.entries(e.char)) {
    if (k === 'id' && v === `${char.id}:${e.key}`) continue;
    if (k in COMP_EMPTY && sameJson(v, COMP_EMPTY[k])) continue;
    if (k === 'species' && v === e.species) continue;
    ch[k] = v;
  }
  return { ...e, char: ch };
});
// たおした 魔物の 数（kills）は 同じ 数ごとに まとめる: { a: 99, b: 99, c: 3 } → [[99, 'a', 'b'], [3, 'c']]（魔物が ふえても LINE の 1回に 入るように）
function slimKills(kills) {
  if (!kills || typeof kills !== 'object' || Array.isArray(kills)) return kills;
  const by = new Map();
  for (const [sp, n] of Object.entries(kills)) {
    if (!Number.isFinite(n)) return kills;
    if (!by.has(n)) by.set(n, [n]);
    by.get(n).push(sp);
  }
  return [...by.values()];
}
function unslimKills(kills) {
  if (!Array.isArray(kills)) return kills;
  const out = {};
  for (const [n, ...sps] of kills) for (const sp of sps) out[sp] = n;
  return out;
}
export function slimChar(char) {
  // 第51回 F: 幻の職業の 記録は みじかい 形（world/phantom.js の packFeats。百文字くらい）
  if (char?.feats && typeof char.feats === 'object') char = { ...char, feats: packFeats(char.feats) };
  if (!Array.isArray(char?.companions)) return char;
  const companions = slimList(char, char.companions);
  return { ...char, companions, ...(Array.isArray(char.storage) ? { storage: slimList(char, char.storage) } : {}), ...(char.kills ? { kills: slimKills(char.kills) } : {}) };
}
export function unslimChar(char) {
  if (typeof char?.feats === 'string') char.feats = unpackFeats(char.feats);
  if (!Array.isArray(char?.companions)) return char;
  if (Array.isArray(char.kills)) char.kills = unslimKills(char.kills);
  for (const e of [...char.companions, ...(Array.isArray(char.storage) ? char.storage : [])]) {
    const ch = e?.char;
    if (!ch || typeof ch !== 'object') continue;
    if (ch.id === undefined && typeof e.key === 'string') ch.id = `${char.id}:${e.key}`;
    if (ch.species === undefined && e.species) ch.species = e.species;
    // 魔物の 仲間は 人の 仲間より 項目が 少ない（newMonsterCompanion）
    const keys = e.kind === 'monster' ? MON_KEYS : Object.keys(COMP_EMPTY);
    for (const k of keys) if (!(k in ch)) ch[k] = JSON.parse(JSON.stringify(COMP_EMPTY[k]));
  }
  return char;
}

// ───── KIZUNA-4（第51回）: KIZUNA-3 より もっと みじかく ─────
const isPlain = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
// { a: true, b: true, c: 3 } → ['a', 'b', { c: 3 }]（true で ない 物は さいごに まとめて）
function slimTrue(o) {
  if (!isPlain(o)) return o;
  const keys = [], rest = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === true) keys.push(k);
    else rest[k] = v;
  }
  return Object.keys(rest).length ? [...keys, rest] : keys;
}
function unslimTrue(a) {
  if (!Array.isArray(a)) return a;
  const out = {};
  for (const x of a) {
    if (typeof x === 'string') out[x] = true;
    else if (isPlain(x)) Object.assign(out, x);
  }
  return out;
}
// 図鑑: { a: { friend: 1 }, b: { friend: 1 } } → [[{ friend: 1 }, 'a', 'b']]
function slimSame(o) {
  if (!isPlain(o)) return o;
  const by = new Map();
  for (const [k, v] of Object.entries(o)) {
    const key = JSON.stringify(v);
    if (!by.has(key)) by.set(key, [v]);
    by.get(key).push(k);
  }
  return [...by.values()];
}
function unslimSame(a) {
  if (!Array.isArray(a)) return a;
  const out = {};
  for (const [v, ...ks] of a.filter(Array.isArray)) for (const k of ks) out[k] = JSON.parse(JSON.stringify(v ?? null));
  return out;
}
export function slimChar4(char) {
  const s = slimChar(char);
  return { ...s, ...(isPlain(s.flags) ? { flags: slimTrue(s.flags) } : {}), ...(isPlain(s.chests) ? { chests: slimTrue(s.chests) } : {}),
    ...(isPlain(s.bestiary) ? { bestiary: slimSame(s.bestiary) } : {}) };
}
export function unslimChar4(char) {
  if (Array.isArray(char.flags)) char.flags = unslimTrue(char.flags);
  if (Array.isArray(char.chests)) char.chests = unslimTrue(char.chests);
  if (Array.isArray(char.bestiary)) char.bestiary = unslimSame(char.bestiary);
  return unslimChar(char);
}

// キャラクター → コード（LINE の 1回に 入らない ときだけ KIZUNA-3、それでも 入らない ときだけ KIZUNA-4）
export function exportCode(char, now = Date.now()) {
  const json = JSON.stringify({ v: SAVE_VERSION, at: now, char });
  const code = `${PREFIX}${hash(json)}-${pack(json)}`;
  if (code.length <= LINE_MAX) return code;
  const slim = JSON.stringify({ v: SAVE_VERSION, at: now, char: slimChar(char) });
  const code3 = `${PREFIX_V3}${hash(slim)}-${pack(slim)}`;
  const best = code3.length < code.length ? code3 : code;
  if (best.length <= LINE_MAX) return best;
  const slim4 = JSON.stringify({ v: SAVE_VERSION, at: now, char: slimChar4(char) });
  const code4 = `${PREFIX_V4}${hash(slim4)}-${pack(slim4)}`;
  return code4.length < best.length ? code4 : best;
}

// コード → キャラクター（こわれていたら reason）
export function parseCode(text) {
  const code = String(text || '').replace(/\s+/g, '');
  if (!code) return { ok: false, reason: 'コードを入れてね' };
  if (code.length > CODE_MAX) return { ok: false, reason: 'コードが長すぎます' };
  const v1 = code.startsWith(PREFIX_V1);
  const v3 = code.startsWith(PREFIX_V3);
  const v4 = code.startsWith(PREFIX_V4);
  if (!v1 && !v3 && !v4 && !code.startsWith(PREFIX)) return { ok: false, reason: '引っこしコードではないみたい' };
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
  if (v3) unslimChar(c);
  if (v4) unslimChar4(c);
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
  // 家族の キャラを つれていく しるし（fam:）は、この セーブに いない 人の ぶんを はずす（パーティーと 馬車）
  dropGoneFamily(c, chars);
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
