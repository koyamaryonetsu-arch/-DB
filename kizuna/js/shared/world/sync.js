// 家族サーバーと スマホ（ひとりで遊ぶサイト）の キャラを 合わせる
//
// ・どちらも「さいごに やりとりした キャラ」を すこし おぼえておく（版ごとに 名前 vid を つける）
// ・送る とき: いまの キャラ + その版の 名前 + おぼえている 版の 名前（新しい じゅん）
// ・うけとる とき: 両方が おぼえている いちばん 新しい 版を「わかれる まえ」に して merge.js で まとめる
//   → 家族サーバーで 遊んだ ぶんも、スマホで ひとりで 遊んだ ぶんも なくならない
// ・「わかれる まえ」が わからない とき（はじめて 合わせる キャラ など）は、両方の 多い ほうを とる
import { SAVE_VERSION, upgradeSave } from './save.js?v=cb6fd0fb30e1';
import { pack, unpack, hash, validId, CHAR_MAX } from './transfer.js?v=cb6fd0fb30e1';
import { mergeChars, canon, charTime } from './merge.js?v=cb6fd0fb30e1';

const PREFIX = 'KIZUNA-S1-';
export const SYNC_MAX = 1500000;
const KNOWN_MAX = 12;

const clone = (x) => JSON.parse(JSON.stringify(x));
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const strip = (c) => {
  const { savedAt, ...rest } = c || {};
  return rest;
};
const sameChar = (x, y) => canon(strip(x)) === canon(strip(y));
const validVid = (v) => typeof v === 'string' && /^[a-z0-9]{6,24}$/.test(v);

export function newVid(rand = Math.random) {
  let s = Date.now().toString(36);
  while (s.length < 16) s += Math.floor(rand() * 36).toString(36);
  return s;
}

// ───── 送る 文字 ─────
export function encodeSync(obj) {
  const json = JSON.stringify(obj);
  return `${PREFIX}${hash(json)}-${pack(json)}`;
}

export function decodeSync(text) {
  const t = String(text || '').replace(/\s+/g, '');
  if (!t.startsWith(PREFIX)) return { ok: false, reason: 'データの形がちがいます' };
  if (t.length > SYNC_MAX) return { ok: false, reason: 'データが大きすぎます' };
  const rest = t.slice(PREFIX.length);
  if (rest.indexOf('-') !== 8) return { ok: false, reason: 'データがこわれているみたい' };
  let json;
  try {
    json = unpack(rest.slice(9));
  } catch {
    return { ok: false, reason: 'データがとちゅうで切れているみたい' };
  }
  if (hash(json) !== rest.slice(0, 8)) return { ok: false, reason: 'データがとちゅうで切れているみたい' };
  try {
    const data = JSON.parse(json);
    if (!isObj(data) || !Array.isArray(data.chars)) return { ok: false, reason: 'データがこわれているみたい' };
    return { ok: true, data };
  } catch {
    return { ok: false, reason: 'データがこわれているみたい' };
  }
}

// ───── おぼえておく 版（テスト・ほかに 場所が ない ときは メモリ） ─────
// entries(id) … 新しい じゅん [{ vid, kind: 'sent'|'received', at, char }] / add(id, entry)
export function memorySyncStore(max = 12) {
  const map = new Map();
  return {
    entries: (id) => map.get(id) || [],
    add(id, entry) {
      map.set(id, pruneEntries([entry, ...(map.get(id) || [])], max));
    },
    drop: (id) => map.delete(id),
  };
}

// いくつまで おぼえるか。さいごに うけとった 版は いつも のこす
export function pruneEntries(list, max) {
  const out = [];
  for (const e of list) {
    if (!e || !validVid(e.vid) || out.some((x) => x.vid === e.vid)) continue;
    // おなじ 中みを つづけて 送った ときは 1つに
    const prev = out[out.length - 1];
    if (prev && prev.kind === 'sent' && e.kind === 'sent' && sameChar(prev.char, e.char)) continue;
    out.push(e);
  }
  if (out.length <= max) return out;
  const keep = out.slice(0, max);
  const lastIn = out.find((e) => e.kind === 'received');
  if (lastIn && !keep.includes(lastIn)) keep[max - 1] = lastIn;
  return keep;
}

// 「わかれる まえ」が わからない ときの かわり（両方に ある ものだけ・少ない ほうの 数）
// → mergeChars で まとめると、数は 多い ほう・フラグや 仲間は 両方 に なる
export function meet(x, y) {
  if (typeof x === 'number' && typeof y === 'number') return Math.min(x, y);
  if (Array.isArray(x) && Array.isArray(y)) {
    if (x.every((v) => typeof v !== 'object') && y.every((v) => typeof v !== 'object')) return x.filter((v) => y.includes(v));
    const idOf = (e) => e?.key ?? e?.id;
    if (x.every((e) => isObj(e) && idOf(e) !== undefined)) {
      const out = [];
      for (const e of x) {
        const f = y.find((z) => isObj(z) && idOf(z) === idOf(e));
        if (f) out.push(meet(e, f));
      }
      return out;
    }
    return canon(x) === canon(y) ? clone(x) : undefined;
  }
  if (isObj(x) && isObj(y)) {
    const out = {};
    for (const k of Object.keys(x)) {
      if (!(k in y)) continue;
      const v = meet(x[k], y[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return canon(x) === canon(y) ? clone(x) : undefined;
}

// ───── 送る ─────
//  ids … 送る キャラ（null なら ぜんぶ）
//  onlyChanged … さいごに うけとった ときから かわっていない キャラは 送らない
export function buildSyncOut(world, { ids = null, onlyChanged = false, from = '', now = Date.now() } = {}) {
  const store = world.syncStore;
  const chars = [];
  const names = [];
  for (const c of Object.values(world.data.characters)) {
    if (ids && !ids.includes(c.id)) continue;
    const hist = store.entries(c.id);
    if (onlyChanged && hist[0]?.kind === 'received' && sameChar(hist[0].char, c)) continue;
    const char = strip(clone(c));
    const vid = newVid(() => world.rng?.next?.() ?? Math.random());
    const known = hist.map((e) => e.vid).slice(0, KNOWN_MAX);
    store.add(c.id, { vid, kind: 'sent', at: now, char });
    chars.push({ vid, known, char });
    names.push(`${c.name}（Lv${c.level}）`);
  }
  return { data: { v: 1, sv: SAVE_VERSION, at: now, from, chars }, names };
}

// とどいた キャラを 読める 形に
function readChar(raw, sv) {
  if (!isObj(raw) || !validId(raw.id) || typeof raw.name !== 'string') return null;
  const up = upgradeSave({ version: Number(sv) || SAVE_VERSION, characters: { [raw.id]: clone(raw) } });
  const c = up.data.characters[raw.id];
  if (!c) return null;
  c.name = String(c.name).replace(/[<>&"'\s]/g, '').slice(0, 8) || '勇者';
  return c;
}

// ───── うけとる ─────
// もどりち: [{ id, name, mode, level, before }]
//   mode: new（はじめて）/ same（おなじ）/ updated（とどいた ほうに）/ kept（こちらの ほうが 新しい）
//         merged（両方を 合わせた）/ busy（今 遊んでいる）/ deleted（こちらで 消した）/ full / bad
export function applySyncIn(world, data, { online = () => false, now = Date.now() } = {}) {
  const store = world.syncStore;
  const chars = world.data.characters;
  const deleted = world.data.deleted || {};
  const results = [];
  for (const entry of (data?.chars || []).slice(0, CHAR_MAX * 2)) {
    const inc = readChar(entry?.char, data.sv);
    if (!inc || !validVid(entry.vid)) {
      results.push({ mode: 'bad', name: String(entry?.char?.name || '？').slice(0, 8) });
      continue;
    }
    const id = inc.id;
    const known = [entry.vid, ...(Array.isArray(entry.known) ? entry.known.filter(validVid).slice(0, KNOWN_MAX) : [])];
    const mine = chars[id];
    const res = { id, name: mine?.name || inc.name, level: inc.level, before: mine?.level ?? null };
    const remember = () => store.add(id, { vid: entry.vid, kind: 'received', at: now, char: strip(inc) });
    if (!mine) {
      if (deleted[id] && charTime(inc) <= deleted[id]) {
        results.push({ ...res, mode: 'deleted' });
        continue;
      }
      if (Object.keys(chars).length >= CHAR_MAX) {
        results.push({ ...res, mode: 'full' });
        continue;
      }
      // おなじ 名前が いたら うしろに 数字
      const names = new Set(Object.values(chars).map((x) => x.name));
      if (names.has(inc.name)) {
        for (let i = 2; i < 100; i++) {
          const n = `${inc.name.slice(0, 7)}${i}`.slice(0, 8);
          if (!names.has(n)) {
            inc.name = n;
            break;
          }
        }
      }
      fixPartyKeys(inc, chars);
      chars[id] = inc;
      if (deleted[id]) delete deleted[id];
      remember();
      results.push({ ...res, name: inc.name, mode: 'new' });
      continue;
    }
    if (online(id)) {
      results.push({ ...res, mode: 'busy' });
      continue;
    }
    const hist = store.entries(id);
    const base = known.map((v) => hist.find((e) => e.vid === v)).find(Boolean);
    let next = null;
    let mode;
    if (sameChar(mine, inc)) mode = 'same';
    else if (base && sameChar(base.char, inc)) mode = 'kept'; // とどいた ほうは なにも 進んでいない
    else if (base && sameChar(base.char, mine)) {
      mode = 'updated'; // こちらは なにも 進んでいない
      next = clone(inc);
    } else {
      mode = 'merged';
      next = mergeChars(base ? base.char : meet(strip(mine), strip(inc)), mine, inc);
    }
    if (next) {
      next.name = mine.name;
      fixPartyKeys(next, chars);
      chars[id] = next;
    }
    remember();
    results.push({ ...res, level: (next || mine).level, mode });
  }
  return results;
}

// 家族の キャラを つれていく しるし（fam:）は、ここに いない 人の ぶんを はずす
function fixPartyKeys(c, chars) {
  if (Array.isArray(c.partyKeys)) c.partyKeys = c.partyKeys.filter((k) => !String(k).startsWith('fam:') || chars[String(k).slice(4)]);
}

// 結果を ことばに（画面に 出す）
export function syncSummary(results, place) {
  const lines = [];
  for (const r of results) {
    const lv = r.before && r.level > r.before ? `Lv${r.before}→Lv${r.level}` : `Lv${r.level}`;
    switch (r.mode) {
      case 'new': lines.push(`${r.name}（${lv}）が${place}にやってきた！`); break;
      case 'updated': lines.push(`${r.name}を新しいデータにしました（${lv}）`); break;
      case 'merged': lines.push(`${r.name}の両方で遊んだデータを合わせました（${lv}）`); break;
      case 'busy': lines.push(`${r.name}は今遊んでいるので、あとで合わせます`); break;
      case 'deleted': lines.push(`${r.name}は${place}で消したキャラなので、連れてきませんでした`); break;
      case 'full': lines.push(`${r.name}: キャラクターは${CHAR_MAX}人までです`); break;
      case 'bad': lines.push(`${r.name}: データが読めませんでした`); break;
      default:
    }
  }
  return lines;
}
