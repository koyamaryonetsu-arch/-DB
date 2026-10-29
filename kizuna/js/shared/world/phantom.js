// 第51回 F: 幻の職業の 記録（c.feats）の 足しこみ・ととのえ・データ合わせ・引っこし・掲示板への 知らせ
//   記録の 中みと 条件の 表は data/phantom.js。戦いの 中の 数え方は shared/battle.js（combatant.feat）
//   ・戦いの おわり（world/battles.js の finishBattle・馬車の 入れかえ world/wagon.js）で addFeats → phantomAfterBattle
//   ・転職（world/services.js の jobChange）で はじめて 幻の職業に なったら phantomGot
//   ・掲示板は B 班の world.boardPost（ない ときは 何も しない）
//   ・知らない タグ（あとの 版で ふえた もの）も けさずに のこす（world/save.js の やくそく）
import { PHANTOM_TAGS, FEAT_STATS, PHANTOM_JOBS, newFeat, phantomSeen, phantomReady, phantomName, phantomCondText } from '../data/phantom.js?v=b006a21bc0e3';
import { JOBS, PHANTOM_ORDER } from '../data/jobs.js?v=b006a21bc0e3';

const CAP = 1e15;
const int = (v) => (Number.isFinite(v) && v > 0 ? Math.min(CAP, Math.floor(v)) : 0);
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const bit = (id) => 2 ** PHANTOM_ORDER.indexOf(id);
const hasBit = (mask, id) => PHANTOM_ORDER.includes(id) && Math.floor(int(mask) / bit(id)) % 2 === 1;
const orBits = (x, y) => {
  let out = 0;
  for (const id of PHANTOM_ORDER) if (hasBit(x, id) || hasBit(y, id)) out += bit(id);
  return out;
};
// タグの 回数（英数字の 名前・40こまで）
const TAG_RE = /^[A-Za-z][A-Za-z0-9_]{0,23}$/;
function cleanUse(u) {
  const out = {};
  if (!isObj(u)) return out;
  for (const [k, v] of Object.entries(u)) {
    if (TAG_RE.test(k) && int(v) && Object.keys(out).length < 40) out[k] = int(v);
  }
  return out;
}

// ───── 引っこしコードの みじかい 形（base36）─────
//   「数6つ.rv.ok|タグの番号:回数,…」 例: 'a1.0.0.k.2.0.1.0|0:3,5:1c'（知らない タグは _名前:回数）
export function packFeats(f) {
  f = toFeats(f);
  const head = [...FEAT_STATS.map((k) => int(f[k]).toString(36)), int(f.rv).toString(36), int(f.ok).toString(36)].join('.');
  const use = Object.entries(f.use).map(([t, n]) => {
    const i = PHANTOM_TAGS.indexOf(t);
    return `${i >= 0 ? i.toString(36) : `_${t}`}:${n.toString(36)}`;
  }).join(',');
  return `${head}|${use}`;
}
export function unpackFeats(s) {
  const out = newFeat();
  if (typeof s !== 'string') return out;
  const [head = '', use = ''] = s.split('|');
  const nums = head.split('.').map((x) => parseInt(x, 36));
  FEAT_STATS.forEach((k, i) => { out[k] = int(nums[i]); });
  if (int(nums[FEAT_STATS.length])) out.rv = orBits(nums[FEAT_STATS.length], 0);
  if (int(nums[FEAT_STATS.length + 1])) out.ok = orBits(nums[FEAT_STATS.length + 1], 0);
  const raw = {};
  for (const part of use.split(',')) {
    const [k = '', n = ''] = part.split(':');
    const t = k.startsWith('_') ? k.slice(1) : PHANTOM_TAGS[parseInt(k, 36)];
    if (t) raw[t] = parseInt(n, 36);
  }
  out.use = cleanUse(raw);
  return out;
}

// 読める 形に（数で ない 物は すてる。引っこしの みじかい 形も もどす）
export function toFeats(v) {
  if (typeof v === 'string') return unpackFeats(v);
  const out = newFeat();
  if (!isObj(v)) return out;
  for (const k of FEAT_STATS) out[k] = int(v[k]);
  out.use = cleanUse(v.use);
  if (int(v.rv)) out.rv = orBits(v.rv, 0);
  if (int(v.ok)) out.ok = orBits(v.ok, 0);
  return out;
}

// セーブを ととのえる（world/save.js の repairChar。記録が ある 人だけ）
export function repairFeats(c) {
  if (!c || c.feats === undefined) return;
  if (c.species) {
    delete c.feats;
    return;
  }
  c.feats = toFeats(c.feats);
}

// 戦いの 記録を キャラに 足す
export function addFeats(c, f) {
  if (!c || c.species || !isObj(f)) return;
  const cur = toFeats(c.feats);
  for (const k of FEAT_STATS) cur[k] = Math.min(CAP, cur[k] + int(f[k]));
  for (const [t, n] of Object.entries(cleanUse(f.use))) cur.use[t] = Math.min(CAP, (cur.use[t] || 0) + n);
  c.feats = cur;
}

// データ合わせ（world/merge.js）: 両方で ふえた ぶんを たす（どちらの 数より 下に しない）。見つけた しるしは 両方
export function mergeFeats(b, a, t) {
  if (a === undefined && t === undefined) return undefined;
  const B = toFeats(b), A = toFeats(a), T = toFeats(t);
  const sum = (x = 0, y = 0, z = 0) => Math.min(CAP, Math.max(y + z - x, y, z, 0));
  const out = newFeat();
  for (const k of FEAT_STATS) out[k] = sum(B[k], A[k], T[k]);
  for (const tag of new Set([...Object.keys(A.use), ...Object.keys(T.use)])) {
    const n = sum(B.use[tag], A.use[tag], T.use[tag]);
    if (n) out.use[tag] = n;
  }
  const rv = orBits(A.rv, T.rv), ok = orBits(A.ok, T.ok);
  if (rv) out.rv = rv;
  if (ok) out.ok = ok;
  return out;
}

// 掲示板へ（B 班の world.boardPost。ない・こわれても 戦いの おわりは とめない）
function post(world, msg) {
  try {
    world?.boardPost?.(msg);
  } catch { /* 掲示板が なくても 遊べる */ }
}

// 戦いの おわり: 条件が 見えた（きわめておく 職業を 1つ きわめた）・なれるように なった 幻の職業を 1回だけ 知らせる
// もどりち: けっかの まどに 出す 行
export function phantomAfterBattle(world, c) {
  const notes = [];
  if (!c || c.species || !c.jobs) return notes;
  const f = c.feats = toFeats(c.feats);
  for (const id of PHANTOM_ORDER) {
    if (!PHANTOM_JOBS[id]) continue;
    const name = phantomName(id, c);
    if (phantomSeen(c, id) && !hasBit(f.rv, id)) {
      f.rv = orBits(f.rv, bit(id));
      notes.push(`☆ ${c.name}は、幻の職業「${name}」の条件を見つけた！（メニューの「幻の書」で見られる）`);
      post(world, { kind: 'phantom_reveal', by: c.name, charId: c.id, job: id, text: `${c.name}が、幻の職業「${name}」の条件を見つけた！`, detail: phantomCondText(id, c) });
    }
    // なれるように なった（職業の データが ある ときだけ。転職できるので）
    if (JOBS[id] && !c.jobs[id] && phantomReady(c, id) && !hasBit(f.ok, id)) {
      f.ok = orBits(f.ok, bit(id));
      notes.push(`★ ${c.name}は、幻の職業「${name}」になれるようになった！（ルミナの町の神殿で転職できる）`);
    }
  }
  return notes;
}

// はじめて 幻の職業に なった（world/services.js の jobChange）
export function phantomGot(world, c, id) {
  if (!c || !PHANTOM_JOBS[id]) return;
  const name = phantomName(id, c);
  post(world, { kind: 'phantom_get', by: c.name, charId: c.id, job: id, text: `${c.name}が、幻の職業「${name}」になった！`, detail: phantomCondText(id, c) });
}
