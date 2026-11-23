// 第3部 第3章 第1幕「星の船と、星座の島」の ひとふで書きの 星座（第100回 A班。docs/plan-part3-c11a.md の 17-3）
// ※ ネタバレ注意。ほかの ファイルは maps/c11a-flags.js だけ 読む（maps・world・client・test の どこからでも 読める）
//
// 星座 1つ: { id, name, isle, rule, stars, lines, twins }
//   stars … 星の 場所（星座の 中の [x, y]。マップに 置く 時は 左上を (ox, oy) に ずらす）。線は たて・よこ だけ（星の 上で 向きを 入れる）
//   lines … [a, b] 星 a と 星 b を むすぶ 線（どちらへも 進める）/ [a, b, 1] ながれ星の 線（a → b の 向きにしか 進めない）
//   twins … [[i, j]] ふたご星（線を 通って 片方に 着くと、もう 片方から 出る）
// きまり（world/c11a-steps.js・client/c11a-view.js・test/ch11-act1-a.test.js が 同じ きまりを 使う）:
//   ・星の 上で 向きを 入れると、その 向きの 線の 上を 次の 星まで うかんで 進む（とちゅうで 止まれない）
//   ・同じ 線は 1回だけ。全部の 線を 光らせると 星座が できる
//   ・地面に ふれて いる 星（入口の 星）なら どこからでも 入れる。入った 星では 何も おきない（ふたご星でも とばない）
import { C11A_CON } from '../maps/c11a-flags.js?v=efa1b5f542af';

export const CON_RULE = { basic: 'basic', arrow: 'arrow', twin: 'twin' };

export const CONSTELLATIONS11A = {
  // 灯台の ゆか（れんしゅう）: 5つの 星・5本の 線
  [C11A_CON.con0]: {
    id: C11A_CON.con0, name: 'ちいさなふね', isle: 0, rule: CON_RULE.basic,
    stars: [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2]],
    lines: [[0, 1], [1, 2], [0, 3], [3, 4], [1, 4]],
    twins: [],
  },
  // 島 1（きほん）
  [C11A_CON.con1a]: {
    id: C11A_CON.con1a, name: 'ほしうさぎ', isle: 1, rule: CON_RULE.basic,
    stars: [[0, 0], [4, 0], [0, 2], [2, 2], [4, 2], [2, 4]],
    lines: [[0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [3, 5]],
    twins: [],
  },
  [C11A_CON.con1b]: {
    id: C11A_CON.con1b, name: 'ほしのいえ', isle: 1, rule: CON_RULE.basic,
    stars: [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2], [2, 4]],
    lines: [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [4, 6]],
    twins: [],
  },
  // 島 2（ながれ星の 線）
  [C11A_CON.con2a]: {
    id: C11A_CON.con2a, name: 'ながれぼしのさかな', isle: 2, rule: CON_RULE.arrow,
    stars: [[0, 0], [2, 0], [4, 0], [0, 2], [2, 2], [4, 2]],
    lines: [[0, 1], [1, 2, 1], [2, 5], [5, 4], [4, 3, 1], [3, 0], [1, 4]],
    twins: [],
  },
  [C11A_CON.con2b]: {
    id: C11A_CON.con2b, name: 'かぜのとり', isle: 2, rule: CON_RULE.arrow,
    stars: [[0, 0], [4, 0], [0, 2], [2, 2], [4, 2], [0, 4], [4, 4]],
    lines: [[0, 1, 1], [0, 2], [1, 4], [2, 3, 1], [3, 4], [2, 5], [4, 6, 1], [6, 5]],
    twins: [],
  },
  // 島 3（ふたご星）
  [C11A_CON.con3a]: {
    id: C11A_CON.con3a, name: 'ふたごのねこ', isle: 3, rule: CON_RULE.twin,
    stars: [[0, 0], [2, 0], [0, 2], [2, 2], [6, 2], [8, 2], [6, 0]],
    lines: [[0, 1], [0, 2], [2, 3], [1, 3], [4, 5], [4, 6]],
    twins: [[3, 4]],
  },
  [C11A_CON.con3b]: {
    id: C11A_CON.con3b, name: 'おおきなくじら', isle: 3, rule: CON_RULE.twin,
    stars: [[0, 0], [2, 0], [0, 2], [2, 2], [6, 0], [8, 0], [6, 2], [8, 2]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 3], [4, 5], [4, 6], [5, 7]],
    twins: [[3, 6]],
  },
};
export const CON_IDS11A = Object.keys(CONSTELLATIONS11A);
export const conOf11a = (id) => CONSTELLATIONS11A[id] || null;

// ───── きまり ─────
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const CON_DIRS = DIRS;
const sgn = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
// 線 k の 向き（a から b へ）: 'up' など
export function lineDir11a(con, k, from) {
  const [a, b] = con.lines[k];
  const [p, q] = from === b ? [b, a] : [a, b];
  const dx = sgn(con.stars[q][0] - con.stars[p][0]), dy = sgn(con.stars[q][1] - con.stars[p][1]);
  return Object.keys(DIRS).find((d) => DIRS[d][0] === dx && DIRS[d][1] === dy);
}
// 線 k が 通る マス（星の 間。星は 入れない）
export function lineCells11a(con, k) {
  const [a, b] = con.lines[k];
  const [x0, y0] = con.stars[a], [x1, y1] = con.stars[b];
  const dx = sgn(x1 - x0), dy = sgn(y1 - y0);
  const out = [];
  for (let x = x0 + dx, y = y0 + dy; x !== x1 || y !== y1; x += dx, y += dy) out.push([x, y]);
  return out;
}
// 星 i から 向き dir に ある 線（{ k, to } か null）。ながれ星の 線は 逆には 進めない（{ k, to, blocked: true }）
export function lineFrom11a(con, i, dir) {
  for (let k = 0; k < con.lines.length; k++) {
    const [a, b, one] = con.lines[k];
    if (a !== i && b !== i) continue;
    if (lineDir11a(con, k, i) !== dir) continue;
    const to = a === i ? b : a;
    return { k, to, blocked: !!one && a !== i };
  }
  return null;
}
// 着いた 星（ふたご星なら もう 片方）
export function landOf11a(con, i) {
  for (const [p, q] of con.twins || []) {
    if (p === i) return q;
    if (q === i) return p;
  }
  return i;
}
// 星 i から 進める 線（used … 通った 線の しるし。数の ビット）: [{ k, to, dir }]
export function movesFrom11a(con, i, used) {
  const out = [];
  for (const dir of Object.keys(DIRS)) {
    const L = lineFrom11a(con, i, dir);
    if (L && !L.blocked && !(used & (1 << L.k))) out.push({ k: L.k, to: L.to, dir });
  }
  return out;
}
export const fullMask11a = (con) => (1 << con.lines.length) - 1;

// とき方（at … 今 いる 星・used … 通った 線）。とけるなら 進む 線の じゅん [{ k, to, dir }]。とけなければ null
export function solveFrom11a(con, at, used = 0) {
  const all = fullMask11a(con);
  const dead = new Set();
  const path = [];
  const go = (i, u) => {
    if (u === all) return true;
    const key = i * 65536 + u;
    if (dead.has(key)) return false;
    for (const m of movesFrom11a(con, i, u)) {
      path.push(m);
      if (go(landOf11a(con, m.to), u | (1 << m.k))) return true;
      path.pop();
    }
    dead.add(key);
    return false;
  };
  return go(at, used) ? path : null;
}
// 入口の 星（entries）の どれかから とけるか: { start, path } か null
export function solve11a(con, entries) {
  for (const s of entries) {
    const path = solveFrom11a(con, s, 0);
    if (path) return { start: s, path };
  }
  return null;
}
// 入口の 星の うち、そこから 始めて とける 星
export const goodStarts11a = (con, entries) => entries.filter((s) => !!solveFrom11a(con, s, 0));
