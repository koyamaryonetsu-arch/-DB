// 流れる 砂の きまり（第4章 Step 4・王家のピラミッド 3階の ありじごく）
// client/field.js の 流される うごきと おなじ。テストと しかけ作りで つかう
//  ・流れる 砂（TILE_INFO の flow）に のると、その マスの むきへ 1マスずつ 流される（流されて いる あいだは 歩けない）
//  ・流れの 先も 流れる 砂なら、その マスの むきへ（曲がる 流れも ある）
//  ・流れる 砂では ない ゆかに 着いたら とまる。流れの 先が かべなら、その マスで とまる（そこからは 歩ける）
//  ・ありじごく（ワープの マス）に 流れこむと、下の 階へ おちる
import { TILE_INFO } from '../tiles.js?v=fa0687a214b4';
import { effectiveTile, isBlocked } from './index.js?v=fa0687a214b4';

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

// (x, y) の 流れの むき（[dx, dy]。流れる 砂で なければ null）
export function flowAt(map, x, y, has) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return null;
  return TILE_INFO[effectiveTile(map, x, y, has)]?.flow || null;
}

const warpAt = (map, x, y) => !!map.warpAt?.get(y * map.w + x) || !!map.warps?.some((w) => w.x === x && w.y === y);

// (x, y) に 立った ときに 流される 先: { x, y, pit, path }（path … とおる マス。pit … ワープ（ありじごく）に おちる）
export function carry(map, x, y, has) {
  const path = [[x, y]];
  let cx = x, cy = y;
  const seen = new Set([`${x},${y}`]);
  for (let guard = 0; guard < 400; guard++) {
    if (warpAt(map, cx, cy)) return { x: cx, y: cy, pit: true, path };
    const d = flowAt(map, cx, cy, has);
    if (!d) break;
    const nx = cx + d[0], ny = cy + d[1];
    if (isBlocked(map, nx, ny, has)) break;
    cx = nx;
    cy = ny;
    const k = `${cx},${cy}`;
    // 流れが ぐるっと まわる ときは そこで とまる（マップの まちがい。テストで 見つける）
    if (seen.has(k)) return { x: cx, y: cy, pit: false, path, loop: true };
    seen.add(k);
    path.push([cx, cy]);
  }
  return { x: cx, y: cy, pit: warpAt(map, cx, cy), path };
}

// 歩いて・流されて 行ける ところ: { stops: Set('x,y'), pits: Set('x,y') }
// stops … 立ちどまれる マス（流れる 砂の 上は、流れの 先が かべの とき だけ）
export function flowReach(map, start, has) {
  const stops = new Set();
  const pits = new Set();
  const q = [];
  const add = (x, y) => {
    const r = carry(map, x, y, has);
    const k = `${r.x},${r.y}`;
    if (r.pit) { pits.add(k); return; }
    if (stops.has(k)) return;
    stops.add(k);
    q.push([r.x, r.y]);
  };
  add(start[0], start[1]);
  for (let head = 0; head < q.length; head++) {
    const [x, y] = q[head];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || isBlocked(map, nx, ny, has)) continue;
      add(nx, ny);
    }
  }
  return { stops, pits };
}

// start から goal まで 行けるか（流されて とまる ところを つたって）
export function flowCanReach(map, start, goal, has) {
  return flowReach(map, start, has).stops.has(`${goal[0]},${goal[1]}`);
}
