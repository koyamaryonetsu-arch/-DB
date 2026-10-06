// 宝の洞窟（宝の地図の seed から 毎回 おなじ 形に つくる。サーバーと 画面で おなじ）
//
// つくりかた（1つの 階）
//  1) かべで うめる → へや（まるい 形）を いくつか ほる
//  2) へやを いちばん みじかい 道で ぜんぶ つなぐ（プリム法）＋ 回り道を 1〜2本。道は すこし くねくね
//  3) かべの ふちを すこし けずって 洞窟らしく（ゆかを ふやす だけ なので つながりは こわれない）
//  4) のぼり階段の へや → いちばん 遠い へやに くだり階段（さいごの 階は 主の 大広間）
//  5) 宝箱・水たまり（ようがん）・水晶・がれき・たいまつ。置くたびに ぜんぶの ゆかへ 行けるか たしかめる
import { T } from '../tiles.js?v=882bfcc52306';
import { makeRng, hash2 } from '../rng.js?v=882bfcc52306';
import { npc } from './npc.js?v=882bfcc52306';
import { MONSTERS } from '../data/monsters.js?v=882bfcc52306';
import {
  parseFloorId, caveInfo, floorMapId, enemyLvOf, clearedFlag, chestPrefix, chestLoot, ensureEncounterTable, TM_THEMES,
} from '../data/treasure.js?v=882bfcc52306';

const WALK = new Set([T.CAVE_FLOOR, T.RUBBLE, T.BOSS_FLOOR, T.STAIRS_UP, T.STAIRS_DOWN]);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const HALL_W = 13, HALL_H = 9;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function floorRng(seed, floor, salt) {
  return makeRng((Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(floor + 1, 0x85ebca6b) ^ salt) >>> 0);
}

// ───────────── 形（タイル・階段・宝箱の 場所）─────────────
const layoutCache = new Map();

export function layoutFloor(seed, lv, floor, floors, theme) {
  const key = `${seed}:${lv}:${floor}:${floors}:${theme}`;
  const hit = layoutCache.get(key);
  if (hit) return hit;
  const lay = makeLayout(seed, lv, floor, floors, theme);
  if (layoutCache.size > 64) layoutCache.delete(layoutCache.keys().next().value);
  layoutCache.set(key, lay);
  return lay;
}

function makeLayout(seed, lv, floor, floors, theme) {
  const rng = floorRng(seed, floor, 0x51ed);
  const L6 = Math.min(lv, 6);
  const w = 36 + L6 * 2 + rng.int(0, 4), h = 28 + L6 * 2 + rng.int(0, 3);
  const t = new Uint8Array(w * h).fill(T.CAVE_WALL);
  const I = (x, y) => y * w + x;
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? T.CAVE_WALL : t[I(x, y)]);
  const inner = (x, y) => x >= 2 && y >= 3 && x < w - 2 && y < h - 2;
  const dig = (x, y, v = T.CAVE_FLOOR) => { if (inner(x, y)) t[I(x, y)] = v; };
  const isBoss = floor === floors;

  // 1) へや
  const rooms = [];
  const want = Math.min(10, 5 + Math.floor(lv / 2) + rng.int(0, 1));
  for (let tries = 0; tries < 500 && rooms.length < want; tries++) {
    const rx = rng.int(3, 6), ry = rng.int(2, 4);
    const cx = rng.int(3 + rx, w - 4 - rx), cy = rng.int(4 + ry, h - 4 - ry);
    if (rooms.some((r) => Math.abs(r.cx - cx) < r.rx + rx + 3 && Math.abs(r.cy - cy) < r.ry + ry + 3)) continue;
    rooms.push({ cx, cy, rx, ry });
  }
  if (rooms.length < 2) {
    rooms.length = 0;
    rooms.push({ cx: 8, cy: h - 8, rx: 4, ry: 3 }, { cx: w - 9, cy: 8, rx: 4, ry: 3 });
  }
  const blob = rng.int(0, 1e6);
  for (const r of rooms) {
    for (let y = r.cy - r.ry - 1; y <= r.cy + r.ry + 1; y++) {
      for (let x = r.cx - r.rx - 1; x <= r.cx + r.rx + 1; x++) {
        const d = ((x - r.cx) / (r.rx + 0.5)) ** 2 + ((y - r.cy) / (r.ry + 0.5)) ** 2;
        if (d < 1 + (hash2(x, y, blob) - 0.5) * 0.45) dig(x, y);
      }
    }
  }

  // 2) 道（プリム法で ぜんぶ つなぐ ＋ 回り道）
  const edges = [];
  const linked = [0];
  const d2 = (a, b) => (a.cx - b.cx) ** 2 + (a.cy - b.cy) ** 2;
  while (linked.length < rooms.length) {
    let best = null;
    for (const i of linked) {
      for (let j = 0; j < rooms.length; j++) {
        if (linked.includes(j)) continue;
        const d = d2(rooms[i], rooms[j]);
        if (!best || d < best.d) best = { i, j, d };
      }
    }
    linked.push(best.j);
    edges.push([best.i, best.j]);
  }
  const loops = rooms.length > 3 ? 1 + (lv >= 4 ? 1 : 0) : 0;
  for (let k = 0; k < loops; k++) {
    const i = rng.int(0, rooms.length - 1), j = rng.int(0, rooms.length - 1);
    if (i !== j && !edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i))) edges.push([i, j]);
  }
  for (const [i, j] of edges) {
    const a = rooms[i], b = rooms[j];
    const wide = rng.chance(0.35);
    const carve = (x, y) => {
      dig(x, y);
      if (wide) { dig(x + 1, y); dig(x, y + 1); dig(x + 1, y + 1); }
    };
    let x = a.cx, y = a.cy;
    for (let step = 0; step < 800 && (x !== b.cx || y !== b.cy); step++) {
      carve(x, y);
      const dx = b.cx - x, dy = b.cy - y;
      if (rng.chance(0.14)) {
        // よりみち（くねくね）
        if (dy !== 0 && rng.chance(0.5)) x = clamp(x + (rng.chance(0.5) ? 1 : -1), 3, w - 4);
        else if (dx !== 0) y = clamp(y + (rng.chance(0.5) ? 1 : -1), 4, h - 4);
        continue;
      }
      if (dx !== 0 && (dy === 0 || rng.next() < Math.abs(dx) / (Math.abs(dx) + Math.abs(dy)))) x += Math.sign(dx);
      else y += Math.sign(dy);
    }
    while (x !== b.cx) { carve(x, y); x += Math.sign(b.cx - x); }
    while (y !== b.cy) { carve(x, y); y += Math.sign(b.cy - y); }
    carve(x, y);
  }

  // 3) かべの ふちを けずる
  const rough = rng.int(0, 1e6);
  for (let y = 4; y < h - 3; y++) {
    for (let x = 3; x < w - 3; x++) {
      if (t[I(x, y)] !== T.CAVE_WALL) continue;
      let nf = 0;
      for (const [dx, dy] of DIRS) if (t[I(x + dx, y + dy)] === T.CAVE_FLOOR) nf++;
      if (nf && hash2(x, y, rough) < 0.08 * nf) t[I(x, y)] = T.CAVE_FLOOR;
    }
  }
  // へやの ふちに ぽつんと できた ゆか（どこにも つながらない）は かべに もどす
  {
    const seen = new Uint8Array(w * h);
    const q = [I(rooms[0].cx, rooms[0].cy)];
    seen[q[0]] = 1;
    while (q.length) {
      const i = q.pop();
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of DIRS) {
        const j = I(x + dx, y + dy);
        if (!seen[j] && t[j] === T.CAVE_FLOOR) { seen[j] = 1; q.push(j); }
      }
    }
    for (let i = 0; i < t.length; i++) if (t[i] === T.CAVE_FLOOR && !seen[i]) t[i] = T.CAVE_WALL;
  }

  // 階段を 置く ところ: 下が ゆか。上が かべだと なお よい。へやの まんなかに ちかい ほど よい
  const stairSpot = (r, avoid = []) => {
    let best = null;
    for (let y = r.cy - r.ry - 1; y <= r.cy + r.ry; y++) {
      for (let x = r.cx - r.rx; x <= r.cx + r.rx; x++) {
        if (at(x, y) !== T.CAVE_FLOOR || at(x, y + 1) !== T.CAVE_FLOOR) continue;
        if (avoid.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 4)) continue;
        const score = (at(x, y - 1) === T.CAVE_WALL ? 0 : 3) + Math.abs(x - r.cx) * 0.5 + Math.abs(y - r.cy) * 0.3 + hash2(x, y, blob + 7) * 0.2;
        if (!best || score < best.score) best = { x, y, score };
      }
    }
    if (best) return { x: best.x, y: best.y };
    // へやの 中に なければ 地図の どこかで いちばん ちかい ところ
    let far = null;
    for (let y = 3; y < h - 3; y++) {
      for (let x = 2; x < w - 2; x++) {
        if (at(x, y) !== T.CAVE_FLOOR || at(x, y + 1) !== T.CAVE_FLOOR) continue;
        if (avoid.some((p) => Math.abs(p.x - x) + Math.abs(p.y - y) < 4)) continue;
        const d = Math.abs(x - r.cx) + Math.abs(y - r.cy);
        if (!far || d < far.d) far = { x, y, d };
      }
    }
    return far ? { x: far.x, y: far.y } : { x: r.cx, y: r.cy };
  };

  // 4) のぼり階段 → いちばん 遠い へや
  const entry = floor === 1 ? rooms.reduce((bi, r, i) => (r.cy > rooms[bi].cy ? i : bi), 0) : rng.int(0, rooms.length - 1);
  const up = stairSpot(rooms[entry]);
  t[I(up.x, up.y)] = T.STAIRS_UP;
  t[I(up.x, up.y + 1)] = T.CAVE_FLOOR;
  // 階段の 2つ下（かべなら 1つ下）に 着く（階段が 人に かくれない ように）
  const below = (p) => ({ x: p.x, y: at(p.x, p.y + 2) === T.CAVE_FLOOR ? p.y + 2 : p.y + 1 });
  const arrive = below(up);
  const bfs = (blocked) => {
    const dist = new Int32Array(w * h).fill(-1);
    const q = new Int32Array(w * h);
    let qh = 0, qt = 0;
    const s0 = I(arrive.x, arrive.y);
    dist[s0] = 0;
    q[qt++] = s0;
    while (qh < qt) {
      const i = q[qh++];
      const x = i % w, y = (i / w) | 0;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (dist[j] >= 0 || !WALK.has(t[j]) || blocked?.has(j)) continue;
        dist[j] = dist[i] + 1;
        q[qt++] = j;
      }
    }
    return dist;
  };
  // ゆかの ぜんぶに 行けるか（blocked … 宝箱・主の いる ところ）
  const blocked = new Set();
  const allReachable = () => {
    const dist = bfs(blocked);
    for (let i = 0; i < t.length; i++) if (WALK.has(t[i]) && !blocked.has(i) && dist[i] < 0) return false;
    return true;
  };
  let dist = bfs();
  const order = rooms.map((r, i) => ({ r, i, d: dist[I(r.cx, r.cy)] })).filter((o) => o.i !== entry).sort((a, b) => b.d - a.d);
  const target = order[0] || { r: rooms[entry], i: entry };

  let down = null, hall = null, boss = null, exitGate = null;
  const bossChests = [];
  if (!isBoss) {
    down = stairSpot(target.r, [up, arrive]);
    t[I(down.x, down.y)] = T.STAIRS_DOWN;
    t[I(down.x, down.y + 1)] = T.CAVE_FLOOR;
  } else {
    // 主の 大広間（のぼり階段と かさならない へや）
    for (const o of order.length ? order : [target]) {
      const x0 = clamp(o.r.cx - 6, 2, w - 2 - HALL_W), y0 = clamp(o.r.cy - 4, 3, h - 3 - HALL_H);
      const overlap = up.x >= x0 - 2 && up.x <= x0 + HALL_W + 1 && up.y >= y0 - 2 && up.y <= y0 + HALL_H + 1;
      if (overlap && o !== order[order.length - 1]) continue;
      hall = { x: x0, y: y0, w: HALL_W, h: HALL_H };
      break;
    }
    for (let y = hall.y; y < hall.y + hall.h; y++) for (let x = hall.x; x < hall.x + hall.w; x++) t[I(x, y)] = T.BOSS_FLOOR;
    t[I(up.x, up.y)] = T.STAIRS_UP;
    boss = { x: hall.x + 6, y: hall.y + 2 };
    for (let y = boss.y - 1; y <= boss.y; y++) for (let x = boss.x - 1; x <= boss.x + 1; x++) blocked.add(I(x, y));
    for (const bx of [hall.x + 2, hall.x + 10]) {
      bossChests.push({ x: bx, y: hall.y + 2 });
      blocked.add(I(bx, hall.y + 2));
    }
    exitGate = { x: boss.x, y: hall.y + 6 };
    // はしら（道を ふさぐ ときは 置かない）
    for (const [px, py] of [[hall.x + 1, hall.y + 5], [hall.x + 11, hall.y + 5], [hall.x + 1, hall.y + 1], [hall.x + 11, hall.y + 1]]) {
      const old = t[I(px, py)];
      t[I(px, py)] = T.PILLAR;
      if (!allReachable()) t[I(px, py)] = old;
    }
    if (TM_THEMES[theme].dark) {
      for (const tx of [hall.x + 3, hall.x + 9]) if (at(tx, hall.y - 1) === T.CAVE_WALL) t[I(tx, hall.y - 1)] = T.TORCH;
    }
  }
  const inHall = (x, y, pad = 0) => !!hall && x >= hall.x - pad && y >= hall.y - pad && x < hall.x + hall.w + pad && y < hall.y + hall.h + pad;
  const downArrive = down && below(down);
  const keyPts = [up, arrive, { x: up.x, y: up.y + 1 }, down, downArrive, down && { x: down.x, y: down.y + 1 }].filter(Boolean);
  const nearKey = (x, y, r) => keyPts.some((p) => Math.abs(p.x - x) <= r && Math.abs(p.y - y) <= r);
  dist = bfs(blocked);

  // 5) 宝箱（すみっこ・行き止まり。遠い ところから）
  const wallsAround = (x, y) => DIRS.filter(([dx, dy]) => at(x + dx, y + dy) === T.CAVE_WALL).length;
  const chests = [];
  const nChest = isBoss ? rng.int(1, 2) : rng.int(2, 3) + (lv >= 5 ? 1 : 0);
  // すみっこ（かべ 2つ いじょう）→ たりなければ かべぎわ でも
  for (const [minWalls, gap] of [[2, 7], [1, 4]]) {
    const spots = [];
    for (let y = 3; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const i = I(x, y);
        if (t[i] !== T.CAVE_FLOOR || blocked.has(i) || dist[i] < 5 || inHall(x, y, 1) || nearKey(x, y, 2) || wallsAround(x, y) < minWalls) continue;
        spots.push({ x, y, s: dist[i] + rng.next() * 18 });
      }
    }
    spots.sort((a, b) => b.s - a.s);
    for (const sp of spots) {
      if (chests.length >= nChest) break;
      if (chests.some((c) => Math.abs(c.x - sp.x) + Math.abs(c.y - sp.y) < gap)) continue;
      const i = I(sp.x, sp.y);
      blocked.add(i);
      if (allReachable()) chests.push({ x: sp.x, y: sp.y });
      else blocked.delete(i);
    }
  }
  const nearThing = (x, y, r) => nearKey(x, y, r) || chests.some((c) => Math.abs(c.x - x) <= r && Math.abs(c.y - y) <= r) || inHall(x, y, 1);

  // 6) 水たまり（炎の 洞窟は ようがん。とおれない）
  const pools = theme === 'earth' ? rng.int(0, 1) : rng.int(1, 2);
  const poolRooms = rng.shuffle(rooms.filter((r, i) => i !== entry && r !== target.r && r.rx >= 4 && r.ry >= 3));
  for (const r of poolRooms.slice(0, pools)) {
    const changed = [];
    const px = r.cx + rng.int(-1, 1), py = r.cy + rng.int(-1, 1);
    const prx = r.rx - 1.8, pry = r.ry - 1.2;
    for (let y = r.cy - r.ry; y <= r.cy + r.ry; y++) {
      for (let x = r.cx - r.rx; x <= r.cx + r.rx; x++) {
        if (at(x, y) !== T.CAVE_FLOOR || nearThing(x, y, 2)) continue;
        if (((x - px) / prx) ** 2 + ((y - py) / pry) ** 2 >= 1) continue;
        changed.push(I(x, y));
        t[I(x, y)] = T.CAVE_WATER;
      }
    }
    if (!allReachable()) for (const i of changed) t[i] = T.CAVE_FLOOR;
  }

  // 7) 水晶（かべぎわ。とおれない）・がれき・たいまつ
  const nCrystal = theme === 'ice' ? rng.int(8, 14) : theme === 'lava' ? rng.int(3, 6) : rng.int(2, 5);
  for (let k = 0, tries = 0; k < nCrystal && tries < 300; tries++) {
    const x = rng.int(3, w - 4), y = rng.int(4, h - 4);
    if (at(x, y) !== T.CAVE_FLOOR || wallsAround(x, y) < 1 || nearThing(x, y, 2)) continue;
    t[I(x, y)] = T.CRYSTAL;
    if (allReachable()) k++;
    else t[I(x, y)] = T.CAVE_FLOOR;
  }
  const nRubble = theme === 'ice' ? rng.int(2, 4) : rng.int(7, 13);
  for (let k = 0, tries = 0; k < nRubble && tries < 300; tries++) {
    const x = rng.int(3, w - 4), y = rng.int(4, h - 4);
    if (at(x, y) !== T.CAVE_FLOOR || nearThing(x, y, 1)) continue;
    t[I(x, y)] = T.RUBBLE;
    k++;
  }
  const nTorch = TM_THEMES[theme].dark ? rng.int(4, 8) : rng.int(0, 2);
  for (let k = 0, tries = 0; k < nTorch && tries < 400; tries++) {
    const x = rng.int(2, w - 3), y = rng.int(3, h - 4);
    if (at(x, y) !== T.CAVE_WALL || !WALK.has(at(x, y + 1))) continue;
    if (inHall(x, y, 1)) continue;
    t[I(x, y)] = T.TORCH;
    k++;
  }

  let walkable = 0;
  for (let i = 0; i < t.length; i++) if (WALK.has(t[i])) walkable++;
  return { w, h, tiles: t, up, arrive, down, downArrive, hall, boss, exitGate, chests, bossChests, walkable };
}

// ───────────── マップ（MAPS に 入れる 形）─────────────
export function buildTreasureFloor(id) {
  const p = parseFloorId(id);
  if (!p) return null;
  const info = caveInfo(p.seed, p.lv);
  if (p.floor > info.floors) return null;
  const { seed, lv, floor } = p;
  const theme = info.theme;
  const th = TM_THEMES[theme];
  const lay = layoutFloor(seed, lv, floor, info.floors, theme);
  const tm = { seed, lv, map: p.spot.map, x: p.spot.x, y: p.spot.y };
  const flag = clearedFlag(seed);
  const name = `${info.caveName}　地下${floor}階`;
  const zone = ensureEncounterTable(lv, theme);

  const warps = [], triggers = [], npcs = [], chests = [], gates = [];
  if (floor === 1) {
    // 出口（地上の 地図の 場所へ もどる。world/treasure.js）
    triggers.push({ id: 'tm_exit', x: lay.up.x, y: lay.up.y, w: 1, h: 1, script: 'tm_exit' });
  } else {
    const prev = layoutFloor(seed, lv, floor - 1, info.floors, theme);
    warps.push({ x: lay.up.x, y: lay.up.y, to: { map: floorMapId(tm, floor - 1), x: prev.downArrive.x + 0.5, y: prev.downArrive.y + 0.5, dir: 'down' } });
  }
  if (lay.down) {
    const next = layoutFloor(seed, lv, floor + 1, info.floors, theme);
    warps.push({ x: lay.down.x, y: lay.down.y, to: { map: floorMapId(tm, floor + 1), x: next.arrive.x + 0.5, y: next.arrive.y + 0.5, dir: 'down' } });
  }
  const pre = chestPrefix(seed);
  lay.chests.forEach((c, i) => {
    chests.push({ id: `${pre}${floor}_${i}`, x: c.x, y: c.y, ...chestLoot(floorRng(seed, floor, 0xc0 + i), lv) });
  });
  if (lay.hall) {
    const h = lay.hall;
    lay.bossChests.forEach((c, i) => {
      chests.push({ id: `${pre}b${i}`, x: c.x, y: c.y, ...chestLoot(floorRng(seed, floor, 0xb0 + i), lv, i ? 'bossB' : 'bossA'), show: { all: [flag] } });
    });
    npcs.push(npc('tm_boss', MONSTERS[info.boss]?.name || '洞窟の主', [lay.boss.x, lay.boss.y], `mon:${info.boss}`, 'tm_boss', { big: true, show: { not: [flag] } }));
    triggers.push({ id: 'tm_boss_room', x: h.x, y: h.y, w: h.w, h: 6, script: 'tm_boss', show: { not: [flag] } });
    // 主を たおすと 出口が あらわれる
    gates.push({ x: lay.exitGate.x, y: lay.exitGate.y, closed: T.BOSS_FLOOR, open: T.STAIRS_UP, flag });
    triggers.push({ id: 'tm_exit_boss', x: lay.exitGate.x, y: lay.exitGate.y, w: 1, h: 1, script: 'tm_exit', show: { all: [flag] } });
  }
  const safe = (x, y) => (lay.hall && x >= lay.hall.x - 1 && y >= lay.hall.y - 1 && x <= lay.hall.x + lay.hall.w && y <= lay.hall.y + lay.hall.h)
    || (Math.abs(x - lay.arrive.x) <= 2 && Math.abs(y - lay.arrive.y) <= 2);
  return {
    id, name, kind: 'dungeon', bgm: 'cave', dark: th.dark,
    theme, enemyLv: enemyLvOf(lv, floor),
    w: lay.w, h: lay.h, tiles: lay.tiles.slice(), gates,
    npcs, chests, signs: [], warps, triggers, sparkles: [], roofs: [],
    zoneAt: (x, y) => (safe(x, y) ? 'safe:tm' : zone),
    areaName: () => name,
    spawnCounts: { [zone]: clamp(4 + Math.round(lay.walkable / 110), 5, 11) },
    tm: {
      seed, lv, floor, floors: info.floors, theme, boss: info.boss, spot: p.spot,
      arrive: { x: lay.arrive.x + 0.5, y: lay.arrive.y + 0.5 },
    },
  };
}
