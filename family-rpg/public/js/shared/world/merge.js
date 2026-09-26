// べつべつの 場所で 遊んだ おなじ キャラを ひとつに まとめる（どちらで 進めた ぶんも なくさない）
//
//   base   … 2つに わかれる まえの キャラ（さいごに データを 合わせた ときの もの）
//   ours   … こちらの キャラ（たとえば 家族サーバー）
//   theirs … とどいた キャラ（たとえば スマホの ひとりで遊ぶサイト）
//
// ・けいけんち・ゴールド・たおした 数・職業の 勝った 数・種 … 両方で ふえた（へった）ぶんを たす
// ・フラグ・宝箱・行った 場所・大事な物 … 両方を 合わせる（どちらかで 使った 大事な物は なくなる）
// ・道具と そうび … 品物ごとに 両方で ふえた・へった 数を たす（そうびは 手もとに ある ものだけ）
// ・仲間 … 両方の 仲間を のこす（べつべつに 仲間に なった まものは 両方とも）
// ・いる場所・HP・作戦 など … 両方で かわって いたら、あとで 遊んだ ほう
import { expForLevel, MAX_LEVEL, computeStats } from '../stats.js';
import { JOBS, JOB_MAX_LEVEL, jobBattlesForLevel } from '../data/jobs.js';
import { SLOTS } from '../data/items.js';
import { STORY_STEPS } from '../data/story.js';
import { COMPANION_SLOTS } from '../data/companions.js';
import { repairChar } from './save.js';

const GOLD_MAX = 9999999;
const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const num = (v) => (Number.isFinite(v) ? v : 0);
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

// 中みが おなじか（キーの じゅんばんは 気にしない）
export function canon(x) {
  if (Array.isArray(x)) return `[${x.map(canon).join(',')}]`;
  if (isObj(x)) return `{${Object.keys(x).filter((k) => x[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canon(x[k])}`).join(',')}}`;
  return JSON.stringify(x ?? null);
}
const same = (x, y) => canon(x) === canon(y);

// さいごに さわった 時こく
export function charTime(c) {
  return Math.max(num(c?.lastPlayed), num(c?.savedAt));
}

// ものがたりの すすみぐあい（-1 … まだ はじまっていない）
function storyIndex(c) {
  let idx = -1;
  STORY_STEPS.forEach((f, i) => {
    if (c?.flags?.[f]) idx = i;
  });
  return idx;
}

// かわった ほうを とる（両方 かわって いたら あとで 遊んだ ほう）
function pick(b, a, t, tLater) {
  if (same(a, b)) return clone(t);
  if (same(t, b)) return clone(a);
  return clone(tLater ? t : a);
}

// ふえた・へった ぶんを たす
function add(b, a, t) {
  return Math.max(0, num(a) + num(t) - num(b));
}

// { key: あたい } を 1つずつ まとめる
function eachKey(b, a, t, fn) {
  const out = {};
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(t || {}), ...Object.keys(b || {})])) {
    const v = fn(b?.[k], a?.[k], t?.[k], k);
    if (v !== undefined && v !== null) out[k] = v;
  }
  return out;
}

// なまえの あつまり（どちらかで 消した ものは 消す。あたらしく ふえた ものは のこす）
function mergeSet(b = [], a = [], t = []) {
  const B = new Set(b), A = new Set(a), T = new Set(t);
  const out = [];
  for (const x of [...a, ...t]) {
    if (out.includes(x)) continue;
    if (B.has(x) && (!A.has(x) || !T.has(x))) continue;
    out.push(x);
  }
  return out;
}

// 地図の 行った ところ（ビットの OR）
function orBits(x, y) {
  if (!x) return y;
  if (!y || x === y) return x;
  try {
    const p = atob(x), q = atob(y);
    let s = '';
    for (let i = 0; i < Math.max(p.length, q.length); i++) s += String.fromCharCode((p.charCodeAt(i) || 0) | (q.charCodeAt(i) || 0));
    return btoa(s);
  } catch {
    return x.length >= y.length ? x : y;
  }
}

function levelForExp(exp) {
  let lv = 1;
  while (lv < MAX_LEVEL && exp >= expForLevel(lv + 1)) lv++;
  return lv;
}

// 職業ごとの 勝った 数（レベルは 勝った 数から。どちらの レベルより 下には しない）
function mergeJobs(b = {}, a = {}, t = {}) {
  return eachKey(b, a, t, (jb, ja, jt, id) => {
    if (!ja && !jt) return undefined;
    const tier = JOBS[id]?.tier || 0;
    const bb = add(jb?.b, ja?.b, jt?.b);
    let lv = Math.max(ja?.lv || 1, jt?.lv || 1);
    while (lv < JOB_MAX_LEVEL && bb >= jobBattlesForLevel(lv + 1, tier)) lv++;
    return { ...(clone(ja) || clone(jt)), lv, b: Math.max(bb, ja?.b || 0, jt?.b || 0) };
  });
}

// ずかん（見た 数・仲間に した 数 など）
function mergeBestiary(b = {}, a = {}, t = {}) {
  return eachKey(b, a, t, (eb, ea, et) => {
    if (!ea && !et) return undefined;
    return eachKey(eb, ea, et, (vb, va, vt) => (typeof (va ?? vt) === 'number' ? add(vb, va, vt) : pick(vb, va, vt, true)));
  });
}

// キャラの 中みを まとめる（主人公・仲間 どちらも）。道具は あとで まとめて 数える
function mergeBody(b, a, t, tLater) {
  const out = {};
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(t || {})]);
  for (const k of keys) {
    const vb = b?.[k], va = a?.[k], vt = t?.[k];
    switch (k) {
      case 'exp': out.exp = Math.max(add(vb, va, vt), num(va), num(vt)); break;
      case 'gold': out.gold = Math.min(GOLD_MAX, add(vb, va, vt)); break;
      case 'kills': case 'seeds': out[k] = eachKey(vb, va, vt, (x, y, z) => add(x, y, z) || undefined); break;
      case 'jobs': out.jobs = mergeJobs(vb, va, vt); break;
      case 'bestiary': out.bestiary = mergeBestiary(vb, va, vt); break;
      case 'flags': case 'chests': case 'visited': case 'searched':
        out[k] = eachKey(vb, va, vt, (x, y, z) => pick(x, y, z, tLater));
        break;
      case 'quests': out.quests = eachKey(vb, va, vt, (x, y, z) => pick(x, y, z, tLater)); break;
      case 'sparkles': out.sparkles = eachKey(vb, va, vt, (x, y, z) => Math.max(num(y), num(z)) || undefined); break;
      case 'explored': out.explored = eachKey(vb, va, vt, (x, y, z) => orBits(y, z)); break;
      case 'keyItems': out.keyItems = mergeSet(vb, va, vt); break;
      case 'supportLog': {
        const seen = new Set((vb || []).map(canon));
        out.supportLog = [...clone(va || []), ...clone((vt || []).filter((e) => !seen.has(canon(e))))].slice(-10);
        break;
      }
      case 'monsterSeq': out.monsterSeq = Math.max(num(va), num(vt), 1); break;
      case 'jobSys': out.jobSys = Math.max(num(va), num(vt)) || undefined; break;
      case 'createdAt': {
        const ts = [va, vt].filter(Number.isFinite);
        if (ts.length) out.createdAt = Math.min(...ts);
        break;
      }
      case 'lastPlayed': case 'savedAt': out[k] = Math.max(num(va), num(vt)) || undefined; break;
      case 'level': case 'companions': case 'items': case 'equip': case 'partyKeys': break; // あとで
      default: out[k] = pick(vb, va, vt, tLater);
    }
    if (out[k] === undefined) delete out[k];
  }
  if (a?.exp !== undefined || t?.exp !== undefined) out.level = Math.max(num(a?.level) || 1, num(t?.level) || 1, levelForExp(out.exp || 0));
  return out;
}

// 仲間（key ごと。べつべつに できた おなじ key の まものは 両方 のこす）
function mergeCompanions(b = [], a = [], t = [], tLater, nextKey) {
  const byKey = (list) => new Map((list || []).filter((e) => e?.key && e.char).map((e) => [e.key, e]));
  const B = byKey(b), A = byKey(a), T = byKey(t);
  const out = [];
  const renamed = new Map();
  const mergeOne = (eb, ea, et) => {
    const e = { ...clone(tLater ? et : ea), ...mergeBody(eb, ea, et, tLater) };
    e.char = { ...mergeBody(eb?.char, ea.char, et.char, tLater), equip: mergeEquip(eb?.char?.equip, ea.char.equip, et.char.equip, tLater) };
    return e;
  };
  for (const [k, ea] of A) {
    const eb = B.get(k), et = T.get(k);
    if (eb && !et) continue; // とどいた ほうで わかれた（酒場で おわかれ・配合）
    if (!et) out.push(clone(ea));
    else if (eb) out.push(mergeOne(eb, ea, et));
    else if (ea.kind !== 'monster' || same(ea, et)) {
      // おなじ 人（両方で 酒場の 仲間に なった）… 強い ほう（もう 片方の そうびは ふくろへ）
      out.push(clone(num(et.char.exp) > num(ea.char.exp) ? et : ea));
    } else {
      // べつべつに 仲間に なった まもの → 両方
      out.push(clone(ea));
      const e2 = clone(et);
      e2.key = nextKey();
      renamed.set(k, e2.key);
      out.push(e2);
    }
  }
  for (const [k, et] of T) {
    if (A.has(k) || B.has(k)) continue; // B に あって A に ない … こちらで わかれた
    out.push(clone(et));
  }
  return { list: out, renamed };
}

function mergeEquip(b = {}, a = {}, t = {}, tLater) {
  const out = {};
  for (const slot of SLOTS) out[slot] = pick(b?.[slot] ?? null, a?.[slot] ?? null, t?.[slot] ?? null, tLater) ?? null;
  return out;
}

// 道具ぶくろ + そうび（主人公と 仲間）の 数
function inventory(c) {
  const m = new Map();
  const put = (id, n = 1) => {
    if (id) m.set(id, (m.get(id) || 0) + n);
  };
  for (const e of c?.items || []) put(e?.id, num(e?.n) || 1);
  for (const slot of SLOTS) put(c?.equip?.[slot]);
  for (const e of c?.companions || []) for (const slot of SLOTS) put(e?.char?.equip?.[slot]);
  return m;
}

// 3つの キャラから 1つを つくる。もどりち: あたらしい キャラ（ours / theirs は かえない）
export function mergeChars(base, ours, theirs) {
  const b = base || {};
  const a = ours;
  const t = theirs;
  const tLater = charTime(t) > charTime(a);
  const out = mergeBody(b, a, t, tLater);
  out.id = a.id;

  // ものがたりは すすんでいる ほうに あわせる（目標・ゲスト）
  const sa = storyIndex(a), st = storyIndex(t);
  if (sa !== st) {
    const ahead = st > sa ? t : a;
    out.objective = clone(ahead.objective);
    out.guests = clone(ahead.guests);
  }

  // 仲間（まものの 番号が かさなったら あたらしい 番号に）
  const used = new Set([...(a.companions || []), ...(t.companions || [])].map((e) => e?.key));
  let seq = Math.max(num(a.monsterSeq), num(t.monsterSeq), 1);
  const nextKey = () => {
    while (used.has(`m${seq}`)) seq++;
    const k = `m${seq++}`;
    used.add(k);
    return k;
  };
  let renamed = new Map();
  if (a.companions || t.companions) {
    const r = mergeCompanions(b.companions, a.companions, t.companions, tLater, nextKey);
    out.companions = r.list;
    renamed = r.renamed;
    out.monsterSeq = Math.max(out.monsterSeq || 1, seq);
  }
  out.equip = mergeEquip(b.equip, a.equip, t.equip, tLater);
  const tKeys = (t.partyKeys || []).map((k) => renamed.get(k) || k);
  const keys = pick(b.partyKeys, a.partyKeys, tKeys, tLater) || [];
  const have = new Set((out.companions || []).map((e) => e.key));
  out.partyKeys = [...new Set(keys)].filter((k) => String(k).startsWith('fam:') || have.has(k)).slice(0, COMPANION_SLOTS);

  // 道具と そうび: 品物ごとに ふえた・へった 数を たして、そうびの ぶんを のぞいた のこりが ふくろ
  const IB = inventory(b), IA = inventory(a), IT = inventory(t);
  const total = new Map();
  for (const id of new Set([...IA.keys(), ...IT.keys(), ...IB.keys()])) {
    const n = (IA.get(id) || 0) + (IT.get(id) || 0) - (IB.get(id) || 0);
    if (n > 0) total.set(id, n);
  }
  const take = (id) => {
    if (!id) return null;
    const n = total.get(id) || 0;
    if (n <= 0) return null;
    total.set(id, n - 1);
    return id;
  };
  for (const slot of SLOTS) out.equip[slot] = take(out.equip[slot]);
  for (const e of out.companions || []) {
    e.char.equip = e.char.equip || {};
    for (const slot of SLOTS) e.char.equip[slot] = take(e.char.equip[slot] ?? null);
  }
  const order = [...(a.items || []), ...(t.items || [])].map((e) => e?.id);
  out.items = [];
  for (const id of new Set([...order, ...total.keys()])) {
    const n = total.get(id) || 0;
    if (n > 0 && !out.items.some((e) => e.id === id)) out.items.push({ id, n });
  }

  repairChar(out, a.id);
  // HP・MP は 最大を こえない ように
  try {
    const stats = computeStats(out);
    out.hp = Math.min(out.hp, stats.maxHp);
    out.mp = Math.min(out.mp, stats.maxMp);
  } catch { /* */ }
  return out;
}
