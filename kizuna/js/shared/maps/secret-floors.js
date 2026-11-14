// ひみつのダンジョンの ふつうの 階の 形（2026年11月 第79回。テーマごとの 形・しかけ・立てふだ。docs/plan-r79-secret.md）
//
// 作り方
//  1) 形（shape）: cave（宝の洞窟の 作り方）・grid（四角い へやを 道で つなぐ）・hall（大広間と 上の 小べや）・
//     snake（くねくねの 長い 坑道）・rings（ピラミッドの ような 四角い わ）・mirror（左右が ぎゃくの 鏡うつし）
//  2) 上り階段・着く 所・いちばん 遠い へやの 下り階段
//  3) テーマの しかけ（すべる 氷・流れる ゆか・落とし穴 など。もう ある タイルだけ）と かざり・立てふだ・人
//     しかけを 置くたびに「着いた 所から 下り階段へ 行けるか・どこで 止まっても 下り階段へ 行けるか・人や 立てふだに 話せるか」を
//     たしかめる（sdReach。だめなら もとに もどす）
// 階の 形は ID（階と ちょうせんの seed）だけで きまる（サーバー・画面・家族で おなじ）
import { T, TILE_INFO } from '../tiles.js?v=5e5310169c06';
import { makeRng, hash2 } from '../rng.js?v=5e5310169c06';
import { layoutFloor } from './treasure-cave.js?v=5e5310169c06';
import { npc } from './npc.js?v=5e5310169c06';
import { MONSTERS } from '../data/monsters.js?v=5e5310169c06';
import { SD_THEME, sdCraftsmanHere, SD_CRAFTSMAN } from '../data/secret-themes.js?v=5e5310169c06';

const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const FLOOR = T.CAVE_FLOOR, WALL = T.CAVE_WALL;
const isSolidT = (v) => TILE_INFO[v]?.solid ?? true;

// ───────────── 行けるか たしかめる（すべる 氷・流れる ゆか・落とし穴（同じ 階の ワープ）・人）─────────────
// client/field.js の 動き（maps/slide.js・maps/flow.js と おなじ きまり）:
//  ・氷: 氷の マスに 入ると、ふさがるか 氷で ない ゆかに 着くまで すべる
//  ・流れる ゆか: のると その むきへ 流される（先が ふさがれば その マスで 止まる）
//  ・ワープ（落とし穴）: 入ると とび先へ
// opts: { block: Set(マスの 番号。人など), warpTo: Map(マス → とび先), start, goal }（マスの 番号は y * w + x）
// → { ok（どこで 止まっても goal へ 行ける）, goal（start から goal へ 行ける）, stops: Set（立ち止まれる マス）}
export function sdReach(w, h, t, { block = new Set(), warpTo = new Map(), start, goal }) {
  const solidAt = (x, y) => x < 0 || y < 0 || x >= w || y >= h || isSolidT(t[y * w + x]) || block.has(y * w + x);
  const ice = (i) => !!TILE_INFO[t[i]]?.slide;
  const flowOf = (i) => TILE_INFO[t[i]]?.flow || null;
  const settle = (i, path) => {
    for (let g = 0; g < 400; g++) {
      const wd = warpTo.get(i);
      if (wd !== undefined && wd !== i) {
        i = wd;
        path.push(i);
        continue;
      }
      const d = flowOf(i);
      if (!d) break;
      const x = i % w, y = (i / w) | 0;
      if (solidAt(x + d[0], y + d[1])) break;
      i = (y + d[1]) * w + x + d[0];
      path.push(i);
    }
    return i;
  };
  const move = (s, dx, dy, path) => {
    let x = s % w, y = (s / w) | 0;
    if (solidAt(x + dx, y + dy)) return -1;
    const sliding = ice(s) || ice((y + dy) * w + x + dx);
    x += dx;
    y += dy;
    let i = y * w + x;
    path.push(i);
    while (sliding && !warpTo.has(i) && ice(i) && !solidAt(x + dx, y + dy)) {
      x += dx;
      y += dy;
      i = y * w + x;
      path.push(i);
    }
    return settle(i, path);
  };
  const first = [start];
  const s0 = settle(start, first);
  const list = [s0];
  const id = new Map([[s0, 0]]);
  const hit = [first.includes(goal)];
  const rev = [[]];
  for (let k = 0; k < list.length; k++) {
    const s = list[k];
    for (const [dx, dy] of D4) {
      const path = [];
      const e = move(s, dx, dy, path);
      if (e < 0) continue;
      if (path.includes(goal)) hit[k] = true;
      if (e === s) continue;
      let j = id.get(e);
      if (j === undefined) {
        j = list.length;
        id.set(e, j);
        list.push(e);
        hit.push(e === goal);
        rev.push([]);
      }
      rev[j].push(k);
    }
  }
  // goal へ 行ける 止まる マス（うしろから）
  const good = new Uint8Array(list.length);
  const q = [];
  for (let k = 0; k < list.length; k++) if (hit[k]) { good[k] = 1; q.push(k); }
  while (q.length) {
    const j = q.pop();
    for (const k of rev[j]) if (!good[k]) { good[k] = 1; q.push(k); }
  }
  let ok = true;
  for (let k = 0; k < list.length; k++) if (!good[k]) { ok = false; break; }
  return { ok, goal: !!good[0], stops: new Set(list) };
}

// ───────────── 作る 道具 ─────────────
function makeLay(w, h, rng) {
  const t = new Uint16Array(w * h).fill(WALL);
  const L = {
    w, h, t, rng, rooms: [], up: null, arrive: null, down: null,
    block: new Set(), warpTo: new Map(), warps: [], signs: [], npcs: [], fakes: [], actions: [], needs: [], safe: [], log: [],
  };
  L.I = (x, y) => y * w + x;
  L.at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? WALL : t[y * w + x]);
  L.inner = (x, y) => x >= 2 && y >= 3 && x < w - 2 && y < h - 2;
  // 元に もどせる 書きかえ
  L.set = (x, y, v) => {
    if (!L.inner(x, y)) return;
    const i = y * w + x;
    if (t[i] === v) return;
    L.log.push(['t', i, t[i]]);
    t[i] = v;
  };
  L.rect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) L.set(x, y, v); };
  L.addBlock = (x, y) => { const i = y * w + x; if (!L.block.has(i)) { L.block.add(i); L.log.push(['b', i]); } };
  L.addNeed = (x, y) => { L.needs.push({ x, y }); L.log.push(['n']); };
  L.addWarp = (x, y, tx, ty) => { L.warpTo.set(y * w + x, ty * w + tx); L.log.push(['w', y * w + x]); };
  L.mark = () => L.log.length;
  L.undo = (m) => {
    while (L.log.length > m) {
      const e = L.log.pop();
      if (e[0] === 't') t[e[1]] = e[2];
      else if (e[0] === 'b') L.block.delete(e[1]);
      else if (e[0] === 'n') L.needs.pop();
      else if (e[0] === 'w') L.warpTo.delete(e[1]);
    }
  };
  L.check = () => {
    if (!L.arrive || !L.down) return true;
    const r = sdReach(w, h, t, { block: L.block, warpTo: L.warpTo, start: L.I(L.arrive.x, L.arrive.y), goal: L.I(L.down.x, L.down.y) });
    if (!r.ok || !r.goal) return false;
    for (const n of L.needs) if (!D4.some(([dx, dy]) => r.stops.has(L.I(n.x + dx, n.y + dy)))) return false;
    return true;
  };
  // fn() で 書きかえて、行けなく なったら もとに もどす（true … 書きかえた）
  L.tryEdit = (fn) => {
    const m = L.mark();
    if (fn() === false) { L.undo(m); return false; }
    if (L.check()) return true;
    L.undo(m);
    return false;
  };
  L.keyPts = () => [L.up, L.arrive, L.down, L.down && { x: L.down.x, y: L.down.y + 1 }, L.up && { x: L.up.x, y: L.up.y + 1 }].filter(Boolean);
  L.nearKey = (x, y, r) => L.keyPts().some((p) => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r);
  L.isFloor = (x, y) => L.at(x, y) === FLOOR && !L.block.has(y * w + x);
  L.walls = (x, y) => D4.filter(([dx, dy]) => isSolidT(L.at(x + dx, y + dy))).length;
  L.cells = (pred) => {
    const out = [];
    for (let y = 3; y < h - 2; y++) for (let x = 2; x < w - 2; x++) if (pred(x, y)) out.push({ x, y });
    return out;
  };
  L.roomOf = (x, y) => L.rooms.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1) || null;
  return L;
}

// 階段を 置く 所（へやの 上の 行。上が かべ・下が ゆか）
function stairSpot(L, r, avoid = []) {
  const spots = [];
  for (let y = r.y0; y <= Math.min(r.y1 - 1, r.y0 + 1); y++) {
    for (let x = r.x0; x <= r.x1; x++) {
      if (L.at(x, y) !== FLOOR || L.at(x, y + 1) !== FLOOR || L.at(x, y - 1) !== WALL) continue;
      if (avoid.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 4)) continue;
      spots.push({ x, y, s: Math.abs(x - (r.x0 + r.x1) / 2) + L.rng.next() * 2 });
    }
  }
  spots.sort((a, b) => a.s - b.s);
  return spots[0] || null;
}
const below = (L, p) => ({ x: p.x, y: L.at(p.x, p.y + 2) === FLOOR && L.at(p.x, p.y + 1) === FLOOR ? p.y + 2 : p.y + 1 });

// 歩く だけの きょり（しかけを 置く 前）
function walkDist(L, from) {
  const { w, h, t } = L;
  const dist = new Int32Array(w * h).fill(-1);
  const q = [L.I(from.x, from.y)];
  dist[q[0]] = 0;
  for (let k = 0; k < q.length; k++) {
    const i = q[k];
    const x = i % w, y = (i / w) | 0;
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (dist[j] >= 0 || isSolidT(t[j])) continue;
      dist[j] = dist[i] + 1;
      q.push(j);
    }
  }
  return dist;
}

// へやの 形の 階: 上り階段の へや → いちばん 遠い へやに 下り階段
function stairsByRooms(L, startRoom = null) {
  const rooms = L.rooms.filter((r) => stairSpot(L, r));
  const sr = startRoom && stairSpot(L, startRoom) ? startRoom : L.rng.pick(rooms);
  L.up = stairSpot(L, sr);
  L.t[L.I(L.up.x, L.up.y)] = T.STAIRS_UP;
  L.arrive = below(L, L.up);
  const dist = walkDist(L, L.arrive);
  let best = null;
  for (const r of rooms) {
    if (r === sr) continue;
    const p = stairSpot(L, r, [L.up, L.arrive]);
    if (!p) continue;
    const d = dist[L.I(p.x, p.y + 1)];
    if (d < 0) continue;
    if (!best || d > best.d) best = { p, d };
  }
  L.down = best ? best.p : stairSpot(L, sr, [L.up, L.arrive]);
  L.t[L.I(L.down.x, L.down.y)] = T.STAIRS_DOWN;
}

// L 字の 道（wide … 2マス はば）
function corridor(L, a, b, wide = false, v = FLOOR) {
  const ax = Math.round((a.x0 + a.x1) / 2), ay = Math.round((a.y0 + a.y1) / 2);
  const bx = Math.round((b.x0 + b.x1) / 2), by = Math.round((b.y0 + b.y1) / 2);
  const dig = (x, y) => {
    if (L.at(x, y) === WALL) L.set(x, y, v);
    if (wide) for (const [ox, oy] of [[1, 0], [0, 1], [1, 1]]) if (L.at(x + ox, y + oy) === WALL) L.set(x + ox, y + oy, v);
  };
  const hFirst = L.rng.chance(0.5);
  let x = ax, y = ay;
  if (hFirst) {
    while (x !== bx) { dig(x, y); x += Math.sign(bx - x); }
    while (y !== by) { dig(x, y); y += Math.sign(by - y); }
  } else {
    while (y !== by) { dig(x, y); y += Math.sign(by - y); }
    while (x !== bx) { dig(x, y); x += Math.sign(bx - x); }
  }
  dig(x, y);
}

// ───────────── 形 ─────────────
// cave: 宝の洞窟の 作り方（まるい へやと くねくねの 道）
function shapeCave(L, fseed, lv) {
  const lay = layoutFloor(fseed, lv, 1, 99, 'earth');
  const L2 = makeLay(lay.w, lay.h, L.rng);
  L2.t.set(lay.tiles);
  L2.up = { ...lay.up };
  L2.arrive = { ...lay.arrive };
  L2.down = { ...lay.down };
  // へやの かわり: ひらけた 所（まわり 2マスが ゆか）
  return L2;
}

// grid: 四角い へやを 3〜4 列 × 3 行に ならべ、道で つなぐ（木の 形 ＋ 回り道）
function shapeGrid(L, { roomMin = 4, wide = 0.3, loops = 2 } = {}) {
  const { w, h, rng } = L;
  const cols = w >= 42 ? 4 : w >= 30 ? 3 : 2, rows = 3;
  const cw = Math.floor((w - 4) / cols), ch = Math.floor((h - 5) / rows);
  const grid = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = 2 + c * cw, by = 3 + r * ch;
      const rw = rng.int(Math.min(roomMin, cw - 3), Math.max(roomMin, cw - 3));
      const rh = rng.int(3, Math.max(3, ch - 3));
      const x0 = bx + rng.int(1, Math.max(1, cw - rw - 1)), y0 = by + rng.int(1, Math.max(1, ch - rh - 1));
      const room = { x0, y0, x1: Math.min(w - 3, x0 + rw - 1), y1: Math.min(h - 3, y0 + rh - 1), c, r };
      L.rect(room.x0, room.y0, room.x1, room.y1, FLOOR);
      L.rooms.push(room);
      grid.push(room);
    }
  }
  const at = (c, r) => grid[r * cols + c];
  // 木の 形（ランダムな 深さ優先）
  const seen = new Set([0]);
  const stack = [grid[0]];
  const edges = [];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const nb = rng.shuffle(D4.map(([dx, dy]) => [cur.c + dx, cur.r + dy]).filter(([c, r]) => c >= 0 && r >= 0 && c < cols && r < rows && !seen.has(r * cols + c)));
    if (!nb.length) { stack.pop(); continue; }
    const [c, r] = nb[0];
    seen.add(r * cols + c);
    edges.push([cur, at(c, r)]);
    stack.push(at(c, r));
  }
  for (let k = 0; k < loops; k++) {
    const a = rng.pick(grid);
    const [dx, dy] = rng.pick(D4);
    const b = at(a.c + dx, a.r + dy);
    if (b && a.c + dx >= 0 && a.c + dx < cols) edges.push([a, b]);
  }
  for (const [a, b] of edges) corridor(L, a, b, rng.chance(wide));
}

// hall: まん中の 大広間と、上の 小べや（入口の 小べやに 上り階段、どこかの 小べやに 下り階段）
function shapeHall(L) {
  const { w, h, rng } = L;
  const hall = { x0: 3, y0: 8, x1: w - 4, y1: h - 4 };
  L.rect(hall.x0, hall.y0, hall.x1, hall.y1, FLOOR);
  L.hall = hall;
  const tops = [];
  let x = 3;
  while (x + 3 <= w - 4) {
    const rw = rng.int(3, 5);
    const x1 = Math.min(w - 4, x + rw - 1);
    if (x1 - x < 2) break;
    const room = { x0: x, y0: 3, x1, y1: 5, top: true };
    L.rect(room.x0, room.y0, room.x1, room.y1, FLOOR);
    // 下の とびら（大広間へ）
    const dx = rng.int(room.x0, room.x1);
    L.set(dx, 6, FLOOR);
    L.set(dx, 7, FLOOR);
    room.door = { x: dx, y: 6 };
    tops.push(room);
    L.rooms.push(room);
    x = x1 + 2;
  }
  L.rooms.push(hall);
  L.tops = tops;
  // 上り階段は 左の 小べや、下り階段は 右がわの どれか
  const sr = tops[0];
  L.up = stairSpot(L, sr) || { x: sr.x0, y: sr.y0 };
  L.t[L.I(L.up.x, L.up.y)] = T.STAIRS_UP;
  L.arrive = below(L, L.up);
  const far = tops.slice(Math.max(1, tops.length - 3));
  const dr = rng.pick(far);
  L.down = stairSpot(L, dr) || { x: dr.x0, y: dr.y0 };
  L.t[L.I(L.down.x, L.down.y)] = T.STAIRS_DOWN;
  L.downRoom = dr;
}

// snake: くねくねの 長い 坑道（2マス はば）。ところどころ 行き止まり
function shapeSnake(L) {
  const { w, h, rng } = L;
  const step = 5;
  const lanes = [];
  for (let y = 4; y + 1 <= h - 4; y += step) lanes.push(y);
  const x0 = 3, x1 = w - 4;
  let side = 1; // 1 … 右で 下へ / -1 … 左で 下へ
  const stubs = [];
  for (let k = 0; k < lanes.length; k++) {
    const y = lanes[k];
    L.rect(x0, y, x1, y + 1, FLOOR);
    L.rooms.push({ x0, y0: y, x1, y1: y + 1, lane: k });
    if (k + 1 < lanes.length) {
      // つなぎ（端から すこし 内がわ。その 先は 行き止まり）
      const inset = rng.int(3, 7);
      const cx = side > 0 ? x1 - inset : x0 + inset;
      L.rect(cx, y + 2, cx + 1, lanes[k + 1] - 1, FLOOR);
      stubs.push({ x: side > 0 ? x1 : x0, y, lane: k });
      side = -side;
    }
    // ところどころ へや（坑道が ひろがる）
    if (rng.chance(0.6)) {
      const rx = rng.int(x0 + 4, x1 - 8);
      L.rect(rx, Math.max(3, y - 1), rx + rng.int(3, 5), Math.min(h - 3, y + 2), FLOOR);
    }
  }
  L.lanes = lanes;
  L.stubs = stubs;
  // 上り階段は 1本目の はし（つなぎの 反対）、下り階段は さいごの 坑道の はし
  const firstEnd = { x: x0 + 1, y: lanes[0] };
  L.up = firstEnd;
  L.t[L.I(firstEnd.x, firstEnd.y)] = T.STAIRS_UP;
  L.arrive = { x: firstEnd.x, y: firstEnd.y + 1 };
  const last = lanes[lanes.length - 1];
  const lastEnd = side > 0 ? x1 - 1 : x0 + 1;
  L.down = { x: lastEnd, y: last };
  L.t[L.I(L.down.x, L.down.y)] = T.STAIRS_DOWN;
}

// rings: ピラミッドの ような 四角い わ（かべの わに 1つずつ すきま）。まん中の へやに 下り階段
function shapeRings(L) {
  const { w, h, rng } = L;
  L.rect(3, 3, w - 4, h - 3, FLOOR);
  const rings = [];
  let k = 0;
  for (let ins = 3; ; ins += 3, k++) {
    const x0 = 3 + ins, y0 = 3 + ins, x1 = w - 4 - ins, y1 = h - 3 - ins;
    if (x1 - x0 < 8 || y1 - y0 < 6) break;
    for (let x = x0; x <= x1; x++) { L.set(x, y0, WALL); L.set(x, y1, WALL); }
    for (let y = y0; y <= y1; y++) { L.set(x0, y, WALL); L.set(x1, y, WALL); }
    rings.push({ x0, y0, x1, y1 });
  }
  // すきま（となりの わと ちがう 辺）
  let prevSide = -1;
  for (const r of rings) {
    let side = rng.int(0, 3);
    if (side === prevSide) side = (side + 2) % 4;
    prevSide = side;
    const gx = rng.int(r.x0 + 2, r.x1 - 2), gy = rng.int(r.y0 + 2, r.y1 - 2);
    const g = [[gx, r.y0], [r.x1, gy], [gx, r.y1], [r.x0, gy]][side];
    L.set(g[0], g[1], FLOOR);
    L.set(g[0] + (side === 1 || side === 3 ? 0 : 1), g[1] + (side === 1 || side === 3 ? 1 : 0), FLOOR);
  }
  L.ringsList = rings;
  const inner = rings.length ? rings[rings.length - 1] : { x0: 3, y0: 3, x1: w - 4, y1: h - 3 };
  const center = { x0: inner.x0 + 1, y0: inner.y0 + 1, x1: inner.x1 - 1, y1: inner.y1 - 1 };
  L.center = center;
  L.rooms.push(center, { x0: 3, y0: 3, x1: w - 4, y1: 4 });
  L.up = { x: rng.int(4, 8), y: 3 };
  L.t[L.I(L.up.x, L.up.y)] = T.STAIRS_UP;
  L.arrive = { x: L.up.x, y: 5 };
  const dx = Math.round((center.x0 + center.x1) / 2);
  L.down = { x: dx, y: center.y0 };
  L.t[L.I(dx, center.y0 - 1)] = WALL;
  L.t[L.I(L.down.x, L.down.y)] = T.STAIRS_DOWN;
}

// mirror: 左半分を 作って、右へ 鏡うつし（上り階段の 鏡の 場所に 下り階段）
function shapeMirror(L) {
  const { w, rng } = L;
  const hw = Math.floor(w / 2);
  const half = makeLay(hw + 1, L.h, rng);
  shapeGrid(half, { roomMin: 3, wide: 0.2, loops: 1 });
  for (let y = 0; y < L.h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x < hw ? x : w - 1 - x;
      L.t[L.I(x, y)] = sx < half.w && sx < hw ? half.t[y * half.w + sx] : WALL;
    }
  }
  L.rooms = [];
  for (const r of half.rooms) {
    if (r.x1 >= hw) continue;
    L.rooms.push({ ...r, side: 'l' }, { x0: w - 1 - r.x1, x1: w - 1 - r.x0, y0: r.y0, y1: r.y1, side: 'r' });
  }
  // まん中を つなぐ 道（左の へやから 右の 鏡の へやへ。いくつか）
  const left = L.rooms.filter((r) => r.side === 'l').sort((a, b) => b.x1 - a.x1);
  for (const r of left.slice(0, 2)) {
    const y = Math.round((r.y0 + r.y1) / 2);
    for (let x = r.x1; x <= w - 1 - r.x1; x++) if (L.at(x, y) === WALL) L.set(x, y, FLOOR);
  }
  // 上り階段: まん中から いちばん 遠い 左の へや。下り階段: その 鏡の 場所
  const far = L.rooms.filter((r) => r.side === 'l' && stairSpot(L, r)).sort((a, b) => a.x0 - b.x0);
  const sr = far[0] || L.rooms[0];
  L.up = stairSpot(L, sr);
  L.t[L.I(L.up.x, L.up.y)] = T.STAIRS_UP;
  L.arrive = below(L, L.up);
  L.down = { x: w - 1 - L.up.x, y: L.up.y };
  L.t[L.I(L.down.x, L.down.y)] = T.STAIRS_DOWN;
}

// ───────────── テーマの かざりと しかけ ─────────────
// ゆかの マス（だいじな 所から r より 遠い）
const freeFloor = (L, r = 2, pred = () => true) => L.cells((x, y) => L.isFloor(x, y) && !L.nearKey(x, y, r) && pred(x, y));
// かべで、下が ゆか（かべの かざり・たいまつ）
const wallFaces = (L) => L.cells((x, y) => L.at(x, y) === WALL && !isSolidT(L.at(x, y + 1)) && L.at(x, y + 1) !== T.STAIRS_UP && L.at(x, y + 1) !== T.STAIRS_DOWN);

// 立てふだ（かべぎわの ゆか。読める 所）
function placeSigns(L, texts, n = 2) {
  const list = L.rng.shuffle(texts).slice(0, n);
  for (const text of list) {
    const apart = (x, y) => !L.signs.some((s) => Math.abs(s.x - x) + Math.abs(s.y - y) < 6);
    const spots = L.rng.shuffle(freeFloor(L, 3, (x, y) => L.walls(x, y) >= 1 && L.walls(x, y) <= 2 && apart(x, y)));
    for (const p of spots.slice(0, 30)) {
      if (L.tryEdit(() => { L.set(p.x, p.y, T.SIGN); L.addNeed(p.x, p.y); })) {
        L.signs.push({ x: p.x, y: p.y, text });
        break;
      }
    }
  }
}
// 人（solid）。spots … 置く 場所の こうほ
function placeNpc(L, spots, make) {
  for (const p of spots.slice(0, 40)) {
    if (L.tryEdit(() => { L.addBlock(p.x, p.y); L.addNeed(p.x, p.y); })) {
      L.npcs.push(make(p));
      return p;
    }
  }
  return null;
}
// 1つの しかけを まとめて 置く（cells … [x, y, タイル]）
const patch = (L, cells) => L.tryEdit(() => { for (const [x, y, v] of cells) L.set(x, y, v); });

// 氷の 大広間（すべる）。止まれる 所が たりなければ ゆかに もどす
function iceHall(L, block) {
  const r = L.hall;
  const m = L.mark();
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (L.at(x, y) === FLOOR) L.set(x, y, T.ICE);
  const n = Math.round(((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1)) / 16);
  for (let k = 0; k < n; k++) {
    const x = L.rng.int(r.x0, r.x1), y = L.rng.int(r.y0 + 1, r.y1);
    if (L.at(x, y) === T.ICE) L.set(x, y, block);
  }
  for (let g = 0; g < 200 && !L.check(); g++) {
    const x = L.rng.int(r.x0, r.x1), y = L.rng.int(r.y0, r.y1);
    if (L.at(x, y) === T.ICE) L.set(x, y, FLOOR);
  }
  if (!L.check()) L.undo(m);
}

// 流れる ゆかの おび（へやの 中。dirTile … むきの タイル。horiz … よこ）
function flowBands(L, n, pick) {
  const rooms = L.rng.shuffle(L.rooms.filter((r) => r.x1 - r.x0 >= 4 && r.y1 - r.y0 >= 2));
  let made = 0;
  for (const r of rooms) {
    if (made >= n) break;
    const { tile, horiz } = pick();
    const cells = [];
    if (horiz) {
      const y = L.rng.int(r.y0 + 1, r.y1);
      for (let x = r.x0; x <= r.x1; x++) if (L.isFloor(x, y) && !L.nearKey(x, y, 1)) cells.push([x, y, tile]);
    } else {
      const x = L.rng.int(r.x0 + 1, r.x1 - 1);
      for (let y = r.y0 + 1; y <= r.y1; y++) if (L.isFloor(x, y) && !L.nearKey(x, y, 1)) cells.push([x, y, tile]);
    }
    if (cells.length >= 3 && patch(L, cells)) made++;
  }
  return made;
}

// 池（ゆかの まるい かたまりを タイルに）
function pools(L, n, tile, rmax = 3) {
  let made = 0;
  for (const c of L.rng.shuffle(freeFloor(L, 3, (x, y) => L.walls(x, y) === 0)).slice(0, 40)) {
    if (made >= n) break;
    const rx = L.rng.int(1, rmax), ry = L.rng.int(1, Math.max(1, rmax - 1));
    const cells = [];
    for (let y = c.y - ry; y <= c.y + ry; y++) {
      for (let x = c.x - rx; x <= c.x + rx; x++) {
        if (((x - c.x) / (rx + 0.5)) ** 2 + ((y - c.y) / (ry + 0.5)) ** 2 >= 1) continue;
        if (L.isFloor(x, y) && !L.nearKey(x, y, 2)) cells.push([x, y, tile]);
      }
    }
    if (cells.length && patch(L, cells)) made++;
  }
  return made;
}

// ぱらぱら 置く（solid か ゆかの かざり）
function sprinkle(L, n, tile, pred = () => true, r = 2) {
  let made = 0;
  for (const c of L.rng.shuffle(freeFloor(L, r, pred)).slice(0, n * 4)) {
    if (made >= n) break;
    if (isSolidT(tile) ? patch(L, [[c.x, c.y, tile]]) : (L.set(c.x, c.y, tile), true)) made++;
  }
  return made;
}

const DRESS = {
  // 階段だらけ: 上の 小べやと 大広間に にせものの 下り階段（ふむと ひとこと）
  stairs(L) {
    const tops = L.tops || [];
    for (const r of tops) {
      if (r === L.downRoom || r === tops[0]) continue;
      const p = stairSpot(L, r);
      if (p) L.fakes.push(p);
    }
    const hall = L.hall;
    for (const c of L.rng.shuffle(freeFloor(L, 2, (x, y) => y >= hall.y0 && y < hall.y1 && L.isFloor(x, y + 1))).slice(0, 60)) {
      if (L.fakes.length >= 12) break;
      if (L.fakes.some((p) => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) < 4)) continue;
      L.fakes.push(c);
    }
    for (const p of L.fakes) L.t[L.I(p.x, p.y)] = T.STAIRS_DOWN;
    sprinkle(L, 6, T.PILLAR, (x, y) => y > L.hall.y0 + 1 && !L.fakes.some((p) => Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1));
  },
  // 宝箱だらけ: へやの かべぎわに 宝箱（当たりは 1つ。あとは からっぽ か びっくり箱）
  boxes(L, ctx) {
    const n = L.rng.int(7, 10);
    const hitAt = L.rng.int(0, n - 1);
    for (let k = 0; k < n; k++) {
      const spots = L.rng.shuffle(freeFloor(L, 3, (x, y) => L.walls(x, y) >= 1 && L.roomOf(x, y) && !L.npcs.some((m) => Math.abs(m.x - x) + Math.abs(m.y - y) < 3)));
      const kind = k === hitAt ? 'hit' : L.rng.chance(0.5) ? 'empty' : 'jack';
      placeNpc(L, spots, (p) => npc(`sd_box_${k}`, '宝箱', [p.x, p.y], 'sd_chest', `sd_box_${kind}`));
    }
    ctx.signs(1);
  },
  // 魔物が 休けい中: お茶の へや（じゅうたん・テーブル・いす）。ここでは 戦いに ならない
  teatime(L, ctx) {
    const spots = L.rng.shuffle(freeFloor(L, 5, (x, y) => L.walls(x, y) === 0));
    for (const c of spots.slice(0, 30)) {
      const x0 = c.x - 3, y0 = c.y - 2, x1 = c.x + 3, y1 = c.y + 2;
      if (L.nearKey(c.x, c.y, 6) || x0 < 3 || y0 < 4 || x1 > L.w - 4 || y1 > L.h - 4) continue;
      const sps = ctx.monsters.slice(0, 3);
      const ok = L.tryEdit(() => {
        L.rect(x0, y0, x1, y1, FLOOR);
        L.rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, T.CARPET);
        L.set(c.x, c.y, T.TABLE);
        L.set(c.x - 2, c.y, T.CHAIR);
        L.set(c.x + 2, c.y, T.CHAIR);
        sps.forEach((sp, k) => {
          const p = [[c.x - 1, c.y], [c.x + 1, c.y], [c.x, c.y - 1]][k];
          L.addBlock(p[0], p[1]);
          L.addNeed(p[0], p[1]);
        });
      });
      if (!ok) continue;
      sps.forEach((sp, k) => {
        const p = [[c.x - 1, c.y], [c.x + 1, c.y], [c.x, c.y - 1]][k];
        L.npcs.push(npc(`sd_tea_${k}`, MONSTERS[sp]?.name || '魔物', p, `mon:${sp}`, 'sd_tea', { dir: k === 0 ? 'right' : k === 1 ? 'left' : 'down' }));
      });
      L.safe.push({ x0: x0 - 1, y0: y0 - 1, x1: x1 + 1, y1: y1 + 1 });
      L.teaSpot = { x: c.x, y: c.y };
      break;
    }
    ctx.signs(1);
  },
  // 作りかけ: 木の ゆか・がれき・作りかけの かべ
  craft(L, ctx) {
    for (const r of L.rng.shuffle(L.rooms).slice(0, 3)) {
      for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) if (L.isFloor(x, y) && !L.nearKey(x, y, 1)) L.set(x, y, T.FLOOR_WOOD);
    }
    sprinkle(L, 14, T.RUBBLE, () => true, 1);
    sprinkle(L, 6, T.RUBBLE_WALL, (x, y) => L.walls(x, y) >= 1);
    ctx.signs(2);
  },
  // 明るすぎる 洞窟: かべ いっぱいの たいまつ
  bright(L, ctx) {
    for (const p of wallFaces(L)) if (hash2(p.x, p.y, 79) < 0.45) L.t[L.I(p.x, p.y)] = T.TORCH;
    ctx.signs(2);
  },
  // 水たまりだらけ
  puddle(L, ctx) {
    pools(L, L.rng.int(6, 9), T.CAVE_WATER, 3);
    sprinkle(L, 4, T.CRYSTAL, (x, y) => L.walls(x, y) >= 1);
    ctx.signs(2);
  },
  // レールだらけ（坑道の 下の 行に レール・はしに 止め木・かべに 坑木）。行き止まりに 立てふだ
  mine(L, ctx) {
    for (const r of L.rooms) {
      if (r.lane === undefined) continue;
      for (let x = r.x0; x <= r.x1; x++) if (L.at(x, r.y1) === FLOOR) L.t[L.I(x, r.y1)] = T.RAIL;
    }
    for (const p of wallFaces(L)) if ((p.x + p.y) % 6 === 0) L.t[L.I(p.x, p.y)] = T.MINE_BEAM;
    let nth = 0;
    for (const s of L.stubs || []) {
      if (L.nearKey(s.x, s.y, 2)) continue;
      nth++;
      const text = nth >= 4 ? '行き止まりです。（またです）' : `行き止まりです。（${nth}回目）`;
      if (L.tryEdit(() => { L.set(s.x, s.y, T.SIGN); L.addNeed(s.x, s.y); })) {
        L.signs.push({ x: s.x, y: s.y, text });
        L.set(s.x, s.y + 1, T.RAIL_STOP);
      }
    }
    // とまっている トロッコ
    const spots = L.rng.shuffle(freeFloor(L, 4, (x, y) => L.at(x, y + 1) === T.RAIL || L.at(x, y - 1) === T.RAIL));
    placeNpc(L, spots, (p) => npc('sd_cart', 'トロッコ', [p.x, p.y], 'minecart', 'sd_cart', { dir: 'right' }));
    ctx.signs(1);
  },
  // スケート場（大広間が 氷）
  skate(L, ctx) {
    iceHall(L, T.ICE_BLOCK);
    ctx.signs(2);
  },
  // 温泉（湯の 池・灰の ゆか）
  onsen(L, ctx) {
    pools(L, L.rng.int(5, 8), T.HOT_SPRING, 2);
    ctx.signs(2);
  },
  // 落とし穴（落ちると 着いた 所の そばへ）。立てふだは（ほんと）と（うそ）
  pyramid(L, ctx) {
    const pits = [];
    const spots = L.rng.shuffle(freeFloor(L, 4));
    const want = L.rng.int(3, 5);
    for (const p of spots.slice(0, 80)) {
      if (pits.length >= want) break;
      if (pits.some((q) => Math.abs(q.x - p.x) + Math.abs(q.y - p.y) < 6)) continue;
      if (L.tryEdit(() => { L.set(p.x, p.y, T.SAND_PIT); L.addWarp(p.x, p.y, L.arrive.x, L.arrive.y); })) pits.push(p);
    }
    L.pits = pits;
    // （ほんと）… 落とし穴の 近く /（うそ）… 落とし穴の ない 所
    const signAt = (pred, text) => {
      for (const c of L.rng.shuffle(freeFloor(L, 3, (x, y) => L.walls(x, y) >= 1 && pred(x, y))).slice(0, 30)) {
        if (L.tryEdit(() => { L.set(c.x, c.y, T.SIGN); L.addNeed(c.x, c.y); })) {
          L.signs.push({ x: c.x, y: c.y, text });
          return;
        }
      }
    };
    const near = (x, y, r) => pits.some((p) => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r);
    if (pits.length) signAt((x, y) => near(x, y, 2), 'この先、落とし穴。（ほんと）');
    signAt((x, y) => !near(x, y, 5), 'この先、落とし穴。（うそ）');
    if (L.center) {
      const c = L.center;
      for (const [x, y] of [[c.x0, c.y1], [c.x1, c.y1]]) patch(L, [[x, y, T.SARCOPHAGUS]]);
    }
    for (const p of wallFaces(L)) if (hash2(p.x, p.y, 7) < 0.12) L.t[L.I(p.x, p.y)] = T.PYR_GLYPH;
  },
  // せんぷうき（東へ ふく 風。西の かべに 風の 窓）
  wind(L, ctx) {
    const made = flowBands(L, L.rng.int(3, 5), () => ({ tile: T.WIND_E, horiz: true }));
    for (let i = 0; i < L.t.length; i++) {
      if (L.t[i] !== T.WIND_E) continue;
      const x = i % L.w, y = (i / L.w) | 0;
      if (L.at(x - 1, y) === WALL && L.inner(x - 1, y)) L.t[i - 1] = T.WIND_WINDOW;
    }
    if (made) sprinkle(L, 2, T.VANE, (x, y) => L.walls(x, y) >= 1);
    ctx.signs(2);
  },
  // 歯車（北・南へ 運ぶ 歯車の ゆか・大きな 歯車・かべの 時計）
  clock(L, ctx) {
    flowBands(L, L.rng.int(3, 5), () => ({ tile: L.rng.chance(0.5) ? T.GEAR_N : T.GEAR_S, horiz: false }));
    sprinkle(L, 4, T.BIG_GEAR, (x, y) => L.walls(x, y) >= 2);
    for (const p of wallFaces(L)) if (hash2(p.x, p.y, 13) < 0.08) L.t[L.I(p.x, p.y)] = T.CLOCK_FACE;
    ctx.signs(2);
  },
  // 流れる プール（流れる 水路・はすの 葉）
  canal(L, ctx) {
    flowBands(L, L.rng.int(3, 5), () => {
      const k = L.rng.int(0, 3);
      return { tile: [T.C7_CUR_N, T.C7_CUR_E, T.C7_CUR_S, T.C7_CUR_W][k], horiz: k === 1 || k === 3 };
    });
    sprinkle(L, 6, T.C7_LOTUS, () => true, 2);
    ctx.signs(2);
  },
  // こたつ（大広間は 氷。まん中に こたつの 休み所。ここでは 戦いに ならない）
  kotatsu(L, ctx) {
    const r = L.hall;
    const cx = Math.round((r.x0 + r.x1) / 2), cy = Math.round((r.y0 + r.y1) / 2);
    iceHall(L, T.C7I_ICICLE);
    // こたつに 行けるまで、氷を すこしずつ ゆかに する（だめなら こたつは なし）
    const put = () => {
      L.rect(cx - 2, cy - 1, cx + 2, cy + 1, T.CARPET);
      L.set(cx, cy, T.TABLE);
      L.addNeed(cx, cy);
    };
    const m0 = L.mark();
    let ok = L.tryEdit(put);
    for (let g = 0; g < 150 && !ok; g++) {
      const x = L.rng.int(r.x0, r.x1), y = L.rng.int(r.y0, r.y1);
      if (L.at(x, y) === T.ICE) L.set(x, y, FLOOR);
      ok = L.tryEdit(put);
    }
    if (!ok) L.undo(m0);
    if (L.at(cx, cy) === T.TABLE) {
      L.actions.push({ x: cx, y: cy, script: 'sd_kotatsu' });
      L.safe.push({ x0: cx - 3, y0: cy - 2, x1: cx + 3, y1: cy + 2 });
    }
    ctx.signs(2);
  },
  // 左右が ぎゃく（鏡の かざりも 左右で ぎゃく むき）
  mirror(L, ctx) {
    const hw = Math.floor(L.w / 2);
    for (const c of L.rng.shuffle(freeFloor(L, 3, (x, y) => x < hw - 1 && L.walls(x, y) >= 2)).slice(0, 20)) {
      const mx = L.w - 1 - c.x;
      if (L.mirrors >= 3) break;
      if (!L.isFloor(mx, c.y) || L.nearKey(mx, c.y, 3)) continue;
      if (patch(L, [[c.x, c.y, T.C8A_MIRROR_A], [mx, c.y, T.C8A_MIRROR_B]])) L.mirrors = (L.mirrors || 0) + 1;
    }
    ctx.signs(2);
  },
  // 見えない 道（へやを つなぐ 道は 光る よみの道。へやの すみに 青い 火）
  yomi(L, ctx) {
    for (let y = 3; y < L.h - 2; y++) {
      for (let x = 2; x < L.w - 2; x++) if (L.at(x, y) === FLOOR && !L.roomOf(x, y) && !L.nearKey(x, y, 1)) L.t[L.I(x, y)] = T.C8B_SPIRITWAY;
    }
    for (const r of L.rooms) {
      for (const [x, y] of [[r.x0, r.y0 + 1], [r.x1, r.y0 + 1]]) if (L.isFloor(x, y) && !L.nearKey(x, y, 2) && L.walls(x, y) >= 1) patch(L, [[x, y, T.C8B_BRAZIER_ON]]);
    }
    ctx.signs(2);
  },
  // 動く ゆか（4つの むき）・プロペラ
  fort(L, ctx) {
    flowBands(L, L.rng.int(3, 5), () => {
      const k = L.rng.int(0, 3);
      return { tile: [T.C8C_SLIDE_N, T.C8C_SLIDE_E, T.C8C_SLIDE_S, T.C8C_SLIDE_W][k], horiz: k === 1 || k === 3 };
    });
    sprinkle(L, 3, T.C8C_PROP_ON, (x, y) => L.walls(x, y) >= 2);
    sprinkle(L, 10, T.C8C_TILT, () => true, 1);
    ctx.signs(2);
  },
};

// ───────────── 階を 作る ─────────────
// f … 階 / fseed … 階の 形の もと（data/secret.js の sdFloorSeed）/ lv … 広さ（sdLayoutLv）/ themeId … テーマ /
// monsters … その 階に 出る 魔物（休けい中の 魔物）/ runSeed … ちょうせんの seed（まよいの職人）
export function buildThemeLayout({ f, fseed, lv, themeId, monsters = [], runSeed = 0 }) {
  const th = SD_THEME[themeId] || SD_THEME.craft;
  const rng = makeRng((fseed ^ 0x79e5) >>> 0);
  const L6 = Math.min(lv, 6);
  const w = 34 + L6 * 2 + rng.int(0, 4), h = 26 + L6 * 2 + rng.int(0, 3);
  let L = makeLay(w, h, rng);
  if (th.shape === 'cave') L = shapeCave(L, fseed, lv);
  else if (th.shape === 'hall') shapeHall(L);
  else if (th.shape === 'snake') shapeSnake(L);
  else if (th.shape === 'rings') shapeRings(L);
  else if (th.shape === 'mirror') shapeMirror(L);
  else {
    shapeGrid(L, themeId === 'yomi' ? { roomMin: 3, wide: 0, loops: 1 } : themeId === 'fort' ? { roomMin: 6, wide: 0.5, loops: 2 } : {});
    stairsByRooms(L);
  }
  L.log.length = 0;
  const ctx = { monsters, signs: (n) => placeSigns(L, th.signs, n) };
  DRESS[themeId]?.(L, ctx);
  // まよいの職人（作りかけの 階は いつも。ほかは ときどき）
  if (sdCraftsmanHere(f, runSeed, themeId)) {
    const spots = L.rng.shuffle(freeFloor(L, 3, (x, y) => L.walls(x, y) >= 1));
    placeNpc(L, spots, (p) => npc('sd_craftsman', SD_CRAFTSMAN, [p.x, p.y], 'oldman', 'sd_craftsman'));
  }
  L.log.length = 0;
  let walkable = 0;
  for (let i = 0; i < L.t.length; i++) if (!isSolidT(L.t[i])) walkable++;
  return {
    w: L.w, h: L.h, tiles: L.t, up: L.up, arrive: L.arrive, down: L.down, walkable,
    signs: L.signs, npcs: L.npcs, fakes: L.fakes, actions: L.actions, safe: L.safe,
    warps: [...L.warpTo.entries()].map(([i, j]) => ({ x: i % L.w, y: (i / L.w) | 0, tx: j % L.w, ty: (j / L.w) | 0 })),
  };
}
