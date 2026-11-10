// 第71回: 階だんを 上り下り したら、行った 先の 階だんの 真上に 立つ（家族の ねがい
//   「階段の となりの マスから 始まるので、いとせず 階段を 往復して しまう」）
//
//   ・階だん（STAIRS_UP / STAIRS_DOWN。フラグで 出てくる 階だんも）から 階だんへの ワープだけ。
//     とびら・町の 入口・フィールドへの 出口・洞窟の 入口は これまで どおり（となりの マス）
//   ・行き先の 階だん … 行き先の マップの ワープの うち、階だんの マスで、もとの マップへ もどる もの。
//     ワープの 行き先（to）に いちばん 近く（PAIR_REACH マス いない）、その 行き先が もとの 階だんの
//     そば（BACK_REACH マス いない）の もの。見つからない・ふさがっている ときは これまで どおり
//   ・ついた 階だんは「いちど おりるまで」つかわない（s.stairGuard。world.js の onEnterTile）。
//     2マス はばの 階だんは、となりの 階だんの マスも おなじ 階だん（横に 1歩 でも もどらない）
//   ・マップの データ（warps の to）は かえない（みちびきの糸・ルーラ・テストの きまりは そのまま）
import { MAPS, tileAt, isBlocked, condOk, npcCovers } from '../maps/index.js?v=b421f4c1530b';
import { T } from '../tiles.js?v=b421f4c1530b';

const PAIR_REACH = 2.6;
const BACK_REACH = 3.2;
// 階だんから これまでの つく マス（to）まで、この 歩数で 行けない ときは これまで どおり
//   （城の 封印の とびらの おくの 階だん など。とじこめられない ように）
const STEP_REACH = 4;

export const isStairsTile = (t) => t === T.STAIRS_UP || t === T.STAIRS_DOWN;

// (x, y) が 階だんの マスか（フラグで あらわれる・きえる 階だんも 階だんと みる）
export function stairsAt(map, x, y) {
  if (!map) return false;
  if (isStairsTile(tileAt(map, x, y))) return true;
  const g = (map.gates || []).find((q) => q.x === x && q.y === y);
  if (!g) return false;
  if (isStairsTile(g.open) || isStairsTile(g.closed)) return true;
  return !!g.levels?.some(([, t]) => isStairsTile(t));
}

// 階だんの ワープ（fromId の warp）で 行く 先の 階だん { x, y（マスの まん中）, tx, ty } か null
export function stairsPair(fromId, warp) {
  const from = MAPS[fromId];
  const to = warp?.to;
  const dest = to && MAPS[to.map];
  if (!from || !dest || !stairsAt(from, warp.x, warp.y)) return null;
  let best = null;
  for (const v of dest.warps || []) {
    if (v.to?.map !== fromId || !stairsAt(dest, v.x, v.y)) continue;
    const d = Math.hypot(v.x + 0.5 - to.x, v.y + 0.5 - to.y);
    if (d > PAIR_REACH) continue;
    if (Math.hypot(v.to.x - (warp.x + 0.5), v.to.y - (warp.y + 0.5)) > BACK_REACH) continue;
    if (!best || d < best.d) best = { v, d };
  }
  return best ? { x: best.v.x + 0.5, y: best.v.y + 0.5, tx: best.v.x, ty: best.v.y } : null;
}

// (tx, ty) の 階だんと つながっている 階だんの マス（おなじ マップへ 行く ワープ。2マス はばの 階だん など）の key
export function stairsGroup(map, tx, ty) {
  const first = map?.warpAt?.get(ty * map.w + tx);
  if (!first) return [];
  const out = [], seen = new Set([ty * map.w + tx]), q = [[tx, ty]];
  while (q.length && out.length < 16) {
    const [x, y] = q.shift();
    out.push(y * map.w + x);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || seen.has(k)) continue;
      seen.add(k);
      const w = map.warpAt.get(k);
      if (w && w.to?.map === first.to?.map && stairsAt(map, nx, ny)) q.push([nx, ny]);
    }
  }
  return out;
}

// ワープで おりる ところ: 階だんどうしなら 行き先の 階だんの 上（立てない ときは これまでの to）
//   { map, x, y, dir, stair: true|false }
export function warpLanding(fromId, warp, hasFlag) {
  const to = warp.to;
  const p = stairsPair(fromId, warp);
  if (p) {
    const map = MAPS[to.map];
    const k = p.ty * map.w + p.tx;
    const chest = map.chestAt?.get(k);
    const npc = map.npcs.some((n) => n.solid && condOk(n.show, hasFlag) && npcCovers(n, n.x + 0.5, n.y + 0.5, p.tx, p.ty));
    if (!isBlocked(map, p.tx, p.ty, hasFlag) && !(chest && condOk(chest.show, hasFlag)) && !npc
      && stepsTo(map, p.tx, p.ty, Math.floor(to.x), Math.floor(to.y), hasFlag) >= 0) {
      return { map: to.map, x: p.x, y: p.y, dir: to.dir, stair: true };
    }
  }
  return { map: to.map, x: to.x, y: to.y, dir: to.dir, stair: false };
}

// (sx, sy) の 階だんから (gx, gy) まで 何歩か（STEP_REACH より 遠い・行けない ときは -1）。
//   かべ・とじた とびら・ほかの 出入り口は とおらない（おなじ 階だんの となりの マスは よい）
export function stepsTo(map, sx, sy, gx, gy, hasFlag) {
  const group = new Set(stairsGroup(map, sx, sy));
  const dist = new Map([[sy * map.w + sx, 0]]);
  const q = [[sx, sy]];
  for (let head = 0; head < q.length; head++) {
    const [x, y] = q[head];
    const d = dist.get(y * map.w + x);
    if (x === gx && y === gy) return d;
    if (d >= STEP_REACH) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || dist.has(k) || isBlocked(map, nx, ny, hasFlag)) continue;
      if (map.warpAt?.has(k) && !group.has(k)) continue;
      dist.set(k, d + 1);
      q.push([nx, ny]);
    }
  }
  return -1;
}

// ついた 階だんの 上に いる あいだは その 階だんを つかわない
export function guardStair(s, landing) {
  const map = landing?.stair && MAPS[landing.map];
  s.stairGuard = map ? { map: landing.map, keys: stairsGroup(map, Math.floor(landing.x), Math.floor(landing.y)) } : null;
}
export function stairGuarded(s, tx, ty) {
  const g = s.stairGuard;
  const map = g && g.map === s.map && MAPS[s.map];
  return !!map && g.keys.includes(ty * map.w + tx);
}
