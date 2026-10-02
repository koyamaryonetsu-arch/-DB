// 氷の しかけの きまり（client/field.js の すべる うごきと おなじ。テストと しかけ作りで つかう）
//  ・ふつうの ゆかから となりへ: 氷なら すべりだす / ゆかなら 1歩
//  ・氷の 上で とまっている ときは、むいた ほうへ すべる
//  ・すべると、つぎの マスが ふさがっているか、氷では ない ゆかに 着いたら とまる
import { isBlocked, slidesAt } from './index.js';

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// ふさがっている マス（タイル・宝箱・人。extra … ほかに ふさぐ マスの Set('x,y')）
export function slideSolid(map, has, extra = null) {
  const npcs = new Set();
  for (const n of map.npcs || []) {
    if (!n.solid || (n.show && !condShow(n.show, has))) continue;
    npcs.add(`${Math.floor(n.x)},${Math.floor(n.y)}`);
  }
  return (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return true;
    if (isBlocked(map, x, y, has)) return true;
    const ch = map.chestAt?.get(y * map.w + x);
    if (ch && (!ch.show || condShow(ch.show, has))) return true;
    const k = `${x},${y}`;
    return npcs.has(k) || !!extra?.has(k);
  };
}

function condShow(show, has) {
  if (show.all && !show.all.every(has)) return false;
  if (show.not && show.not.some(has)) return false;
  return true;
}

// (x, y) で とまっている とき、行ける ところ（とまる マス）の 一覧
export function slideMoves(map, x, y, has, solid = slideSolid(map, has)) {
  const ice = (tx, ty) => slidesAt(map, tx, ty, has);
  const out = [];
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (solid(nx, ny)) continue;
    if (!ice(x, y) && !ice(nx, ny)) {
      out.push([nx, ny]);
      continue;
    }
    // すべる
    let cx = ice(x, y) ? x : nx, cy = ice(x, y) ? y : ny;
    if (!ice(x, y)) { /* 氷に のった */ }
    for (let guard = 0; guard < 400; guard++) {
      if (!ice(cx, cy)) break;
      if (solid(cx + dx, cy + dy)) break;
      cx += dx;
      cy += dy;
    }
    if (cx !== x || cy !== y) out.push([cx, cy]);
  }
  return out;
}

// start から 行ける とまる マス（Set of 'x,y'）
export function slideReach(map, start, has, solid = slideSolid(map, has)) {
  const seen = new Set([`${start[0]},${start[1]}`]);
  const q = [start];
  for (let head = 0; head < q.length; head++) {
    const [x, y] = q[head];
    for (const [nx, ny] of slideMoves(map, x, y, has, solid)) {
      const k = `${nx},${ny}`;
      if (seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return seen;
}

// いちばん 少ない 手数（とどかなければ -1）。手数は 1歩・1すべり を 1回と かぞえる
export function slideSteps(map, start, goal, has, solid = slideSolid(map, has)) {
  const key = (p) => `${p[0]},${p[1]}`;
  const dist = new Map([[key(start), 0]]);
  const q = [start];
  for (let head = 0; head < q.length; head++) {
    const p = q[head];
    if (p[0] === goal[0] && p[1] === goal[1]) return dist.get(key(p));
    for (const n of slideMoves(map, p[0], p[1], has, solid)) {
      if (dist.has(key(n))) continue;
      dist.set(key(n), dist.get(key(p)) + 1);
      q.push(n);
    }
  }
  return -1;
}

// とじこめられる 場所（start から 行けるのに、start へ もどれない とまる マス）
export function slideTraps(map, start, has, solid = slideSolid(map, has)) {
  const reach = slideReach(map, start, has, solid);
  const traps = [];
  for (const k of reach) {
    const [x, y] = k.split(',').map(Number);
    if (!slideReach(map, [x, y], has, solid).has(`${start[0]},${start[1]}`)) traps.push([x, y]);
  }
  return traps;
}
