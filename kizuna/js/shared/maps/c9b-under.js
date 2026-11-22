// 第3部 第1章 第2幕「鉱山の底の先」（A: 世界と 物語）の 大地の下 c9b_under（80×60 の 暗い 世界地図。maps/c9b.js が まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 10-1・10-2）
// ・形は ここで 作る（同じ たねで いつも 同じ 形）: まわりは 岩・ところどころ 岩の かたまり・西に 大きな 空どう・南に 東へ 流れる 地下の 川
//   柱と 柱・村・やしきを むすぶ 道は かならず 歩ける（道の まわりに 岩を 置かない）
// ・水晶の 柱 6本（ともすと ずっと 明るい）・光る こけの 原（柱と 柱の 間）・暗い 所に かくれた 宝箱 6つ（その 柱を ともすと 見える）
// ・ヒカリゴケの里（村長・宿・道具屋・村の 人 6人・村の 明かりの 台・船着き場）・大王のやしきの 門（5・6本めの 柱で 開く）
// ・天じょうから ぶら下がる 今までの ダンジョンの 底の かざり（map.c9bDecor。絵は client/c9b-light.js）
// ・大地の下の「行った 所」は 取らない（map.noExplore。地図は 柱の 明るさで かく … maps/c9b-light.js の mapCells9b）
import { T } from '../tiles.js?v=92b65651df0b';
import { npc } from './npc.js?v=92b65651df0b';
import { lightInfo } from './c9a-light.js?v=92b65651df0b';
import { UNDER_POS, UNDER_W, UNDER_H, UNDER_DECOR, HALL_POS, SHAFT_POS } from './c9b-rows.js?v=92b65651df0b';
import { LAMPS9B } from './c9b-light.js?v=92b65651df0b';
import { c9bChest } from '../data/items-c9b.js?v=92b65651df0b';
import { C9B, C9B_MAP, C9B_PILLARS, C9B_CHEST_IDS, C9B_TABLE, C9B_TRACKS, C9B_MOSS_STEPS } from './c9b-flags.js?v=92b65651df0b';

const W = UNDER_W, H = UNDER_H;
const P = UNDER_POS;
const h01 = (x, y, s = 0) => {
  let n = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
// なめらかな ゆらぎ（4マスごとの 点を つなぐ）
function smooth(x, y, s) {
  const gx = Math.floor(x / 4), gy = Math.floor(y / 4);
  const fx = (x % 4) / 4, fy = (y % 4) / 4;
  const a = h01(gx, gy, s), b = h01(gx + 1, gy, s), c = h01(gx, gy + 1, s), d = h01(gx + 1, gy + 1, s);
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}
function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const V = P.village;
const pl = (i) => P.pillars[i];
// 歩く 道（この まわりには 岩を 置かない）
export const ROUTES9B = [
  [P.arrive, pl(0)],
  // 西まわり（1 → 2 → 村の 西）
  [pl(0), { x: 14, y: 22 }], [{ x: 14, y: 22 }, pl(1)], [pl(1), { x: 24, y: 34 }], [{ x: 24, y: 34 }, { x: V.x, y: 34 }],
  // 北まわり（1 → 3 → 村の 北）
  [pl(0), { x: 22, y: 10 }], [{ x: 22, y: 10 }, pl(2)], [pl(2), { x: 38, y: 19 }], [{ x: 38, y: 19 }, { x: 41, y: V.y }],
  // 村の 東 → 5 → 6 → やしきの 門
  [{ x: V.x + V.w - 1, y: 31 }, pl(4)], [pl(4), { x: 61, y: 23 }], [{ x: 61, y: 23 }, pl(5)], [pl(5), { x: P.gate.x, y: P.gate.y + 1 }],
  // 村の 南 → 船着き場
  [{ x: 43, y: V.y + V.h - 1 }, P.dock],
  // たてあなへ もどる 道
  [P.arrive, P.up],
  // かくれた 宝箱へ（その 柱から）
  ...P.chests.map((c, i) => [pl(i), c]),
];
// 光る こけの 原（柱と 柱の 間の 暗い 所）: 道の この 区間の まわり
const MOSS_SEGS = [
  [{ x: 14, y: 17 }, { x: 15, y: 26 }, 2.2],
  [{ x: 18, y: 33 }, { x: 28, y: 34 }, 2.0],
  [{ x: 20, y: 11 }, { x: 25, y: 11 }, 1.8],
  [{ x: 34, y: 16 }, { x: 38, y: 21 }, 2.0],
  [{ x: 52, y: 29 }, { x: 54, y: 27 }, 1.6],
  [{ x: 59, y: 23 }, { x: 63, y: 22 }, 1.6],
];
// 村の 家（地下の 民の キノコの 形の 家）と 店の 人の 場所
export const HUTS9B = [
  { x: 36, y: 28 }, { x: 37, y: 28 }, { x: 47, y: 28 }, { x: 48, y: 28 },
  { x: 35, y: 32 }, { x: 49, y: 33 }, { x: 35, y: 37 }, { x: 48, y: 39 }, { x: 40, y: 40 },
];
export const FOLK9B = {
  chief: { x: 41, y: 35, name: '村長ポロロ', sprite: 'c9b_chief' },
  inn: { x: 36, y: 29, name: '宿屋のモモン', sprite: 'c9b_folk2' },
  shop: { x: 47, y: 29, name: '道具屋のピコ', sprite: 'c9b_folk3' },
  folk: [
    { x: 38, y: 31, name: 'ヒカリゴケの子ども', sprite: 'c9b_kid' },
    { x: 44, y: 33, name: '地下の民のおばさん', sprite: 'c9b_folk4' },
    { x: 37, y: 36, name: '地下の民のおじいさん', sprite: 'c9b_folk1' },
    { x: 46, y: 37, name: '地下の民の見はり', sprite: 'c9b_folk3' },
    { x: 42, y: 39, name: '地下の民のむすめ', sprite: 'c9b_folk2' },
    { x: 43, y: 43, name: '船着き場の番人', sprite: 'c9b_folk1' },
  ],
  king: { x: 39, y: 37, name: 'デデドン大王', sprite: 'c9b_king_npc' }, // 幕の あと（村の テーブルに）
};

export function buildUnderTiles() {
  const tiles = new Uint16Array(W * H).fill(T.C9B_ROCK);
  const set = (x, y, id) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = id; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? tiles[y * W + x] : T.C9B_ROCK);
  const nearRoute = (x, y, r) => ROUTES9B.some(([a, b]) => distSeg(x, y, a.x, a.y, b.x, b.y) <= r);
  const keyPts = [P.arrive, P.up, ...P.pillars, ...P.chests, P.villageChest, P.lump, P.dock];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    // まわりは 岩（ふちが ゆらぐ）
    const edge = Math.min(x, y, W - 1 - x, H - 1 - y);
    if (edge < 2 + smooth(x, y, 3) * 2.2) continue;
    // 岩の かたまり（道・だいじな 所の まわりには 置かない）
    const rock = smooth(x, y, 7) > 0.62 && h01(x, y, 9) > 0.25;
    const pebble = h01(x, y, 11) > 0.965;
    if ((rock || pebble) && !nearRoute(x, y, 2.6) && !keyPts.some((p) => Math.hypot(x - p.x, y - p.y) < 2.5)) continue;
    set(x, y, T.C9B_GROUND);
  }
  // 道は かならず 歩ける
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (nearRoute(x, y, 1.6)) set(x, y, T.C9B_GROUND);
  // 西の 大きな 空どう（さかさの 町の かざりの 下）
  const C = P.chasm;
  for (let y = C.y0; y <= C.y1; y++) for (let x = C.x0; x <= C.x1 + Math.round(smooth(x, y, 5) * 3); x++) if (!nearRoute(x, y, 1.6)) set(x, y, T.C9B_VOID);
  // 地下の 川（空どうから 東へ。南の 岸の 先は 岩）
  const R = P.river;
  for (let x = C.x0; x < W; x++) {
    for (let y = R.y0; y <= R.y1; y++) if (get(x, y) !== T.C9B_VOID) set(x, y, T.C9B_RIVER);
    for (let y = R.y1 + 1; y < H; y++) if (get(x, y) !== T.C9B_VOID) set(x, y, y === R.y1 + 1 ? T.C9B_GROUND : T.C9B_ROCK);
  }
  // 光る こけの 原
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (get(x, y) !== T.C9B_GROUND) continue;
    if (MOSS_SEGS.some(([a, b, r]) => distSeg(x, y, a.x, a.y, b.x, b.y) <= r)) set(x, y, T.C9B_MOSS);
  }
  // ヒカリゴケの里（ゆかを ならす・家・小さな 明かり・村の 明かりの 台）
  for (let y = V.y; y < V.y + V.h; y++) for (let x = V.x; x < V.x + V.w; x++) {
    const rx = (x - (V.x + V.w / 2)) / (V.w / 2 + 0.5), ry = (y - (V.y + V.h / 2)) / (V.h / 2 + 0.5);
    if (rx * rx + ry * ry <= 1.05) set(x, y, T.C9B_GROUND);
  }
  for (const p of HUTS9B) set(p.x, p.y, T.C9B_HUT);
  for (const p of LAMPS9B) set(p.x, p.y, T.C9B_LAMP);
  set(P.lump.x, P.lump.y, T.C9B_LUMP);
  // 船着き場（川へ のびる さんばし）
  for (let y = P.dock.y - 1; y <= P.dock.y + 1; y++) set(P.dock.x, y, T.C9B_DOCK);
  set(P.dock.x - 1, P.dock.y, T.C9B_DOCK); set(P.dock.x + 1, P.dock.y, T.C9B_DOCK);
  // 大王のやしき（外から 見た かべ）と 門
  const Hh = P.hall;
  for (let y = Hh.y; y < Hh.y + Hh.h; y++) for (let x = Hh.x; x < Hh.x + Hh.w; x++) set(x, y, T.C9B_HALLWALL);
  set(P.gate.x, P.gate.y, T.C9B_GATE);
  for (let x = P.gate.x - 2; x <= P.gate.x + 2; x++) for (let y = P.gate.y + 1; y <= P.gate.y + 3; y++) set(x, y, T.C9B_GROUND);
  // たてあなへ もどる 道・柱・宝箱の 所
  set(P.up.x, P.up.y, T.C9B_SHAFT);
  set(P.arrive.x, P.arrive.y, T.C9B_GROUND);
  for (const p of P.pillars) set(p.x, p.y, T.C9B_PILLAR);
  for (const p of [...P.chests, P.villageChest]) set(p.x, p.y, T.C9B_GROUND);
  return tiles;
}

const SAFE9B = [
  [P.arrive.x - 5, P.arrive.y - 4, P.arrive.x + 5, P.arrive.y + 5, 'safe:arrive'],
  [V.x - 1, V.y - 1, V.x + V.w, V.y + V.h + 4, 'safe:village'],
  [P.gate.x - 4, P.gate.y, P.gate.x + 4, P.gate.y + 4, 'safe:gate'],
];

export function buildC9bUnder() {
  const tiles = buildUnderTiles();
  const rows = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (tiles[y * W + x] === T.C9B_MOSS ? 'm' : '.')).join(''));
  const m = {
    id: C9B_MAP.under, name: '大地の下', kind: 'dungeon', bgm: C9B_TRACKS.under, dark: false, theme: 'c9b_under', bg2d: '#05040a',
    sky3d: { bg: '#04030a', fog: 0x06050e },
    w: W, h: H, tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [], labels: [],
    areaName: (x, y) => (x >= V.x - 1 && y >= V.y - 1 && x <= V.x + V.w && y <= V.y + V.h + 4 ? 'ヒカリゴケの里' : '大地の下'),
    // 光る こけ（第1幕の 光の輪の 計算。40歩で 消える。みなもとに つなぐ きまりは ない）
    c9a: Object.assign(lightInfo(0, rows, { source: 'S', moss: 'm', crystal: 'c', hole: 'o' }), { mossSteps: C9B_MOSS_STEPS }),
    c9b: { under: true },
    noExplore: true, // 「行った 所」の 記録を 取らない（地図は 柱の 明るさで かく）
    c9bDecor: UNDER_DECOR,
    spawnCounts: { [C9B_TABLE.light]: 14 },
  };
  m.c9a.holeSet = new Set();
  m.labels.push({ name: 'ヒカリゴケの里', x: V.x, y: V.y, w: V.w, h: V.h });
  // たてあなへ もどる 道
  m.warps.push({ x: P.up.x, y: P.up.y, to: { map: C9B_MAP.shaft, x: SHAFT_POS.exit.x + 0.5, y: SHAFT_POS.exit.y - 0.5, dir: 'up' } });
  m.links.push({ x: P.up.x, y: P.up.y, to: C9B_MAP.shaft });
  // 着いた 時の ことば
  m.triggers.push({ id: 'c9b_under_in', x: P.arrive.x - 2, y: P.arrive.y - 1, w: 5, h: 4, script: 'c9b_under_in', show: { not: [C9B.under] } });
  // 水晶の 柱
  P.pillars.forEach((p, i) => {
    m.gates.push({ x: p.x, y: p.y, closed: T.C9B_PILLAR, open: T.C9B_PILLAR_ON, flag: C9B_PILLARS[i] });
    m.actions.push({ x: p.x, y: p.y, script: `c9b_pillar${i + 1}` });
  });
  // 暗い 所に かくれた 宝箱（その 番号の 柱を ともすと 見える）
  P.chests.forEach((p, i) => m.chests.push({ id: C9B_CHEST_IDS.under[i], x: p.x, y: p.y, show: { all: [C9B_PILLARS[i]] }, ...chestOf9b(C9B_CHEST_IDS.under[i]) }));
  m.chests.push({ id: C9B_CHEST_IDS.village[0], x: P.villageChest.x, y: P.villageChest.y, ...chestOf9b(C9B_CHEST_IDS.village[0]) });
  // ヒカリゴケの里
  m.triggers.push({ id: 'c9b_village_in', x: V.x, y: V.y, w: V.w, h: V.h, script: 'c9b_village_in', show: { all: [C9B.under], not: [C9B.village] } });
  const F = FOLK9B;
  m.npcs.push(npc('c9b_chief', F.chief.name, [F.chief.x, F.chief.y], F.chief.sprite, 'c9b_chief', { dir: 'down' }));
  m.npcs.push(npc('c9b_inn', F.inn.name, [F.inn.x, F.inn.y], F.inn.sprite, 'c9b_inn', { dir: 'down' }));
  m.npcs.push(npc('c9b_shop', F.shop.name, [F.shop.x, F.shop.y], F.shop.sprite, 'c9b_shop', { dir: 'down' }));
  F.folk.forEach((f, i) => m.npcs.push(npc(`c9b_folk${i + 1}`, f.name, [f.x, f.y], f.sprite, `c9b_folk${i + 1}`, { dir: 'down', wander: i < 5 ? 1 : 0 })));
  m.npcs.push(npc('c9b_king_v', F.king.name, [F.king.x, F.king.y], F.king.sprite, 'c9b_king_v', { big: true, show: { all: [C9B.raft] }, dir: 'down' }));
  m.gates.push({ x: P.lump.x, y: P.lump.y, closed: T.C9B_LUMP, open: T.C9B_LUMP_ON, flag: C9B.king });
  m.actions.push({ x: P.lump.x, y: P.lump.y, script: 'c9b_lump' });
  // 船着き場（川の 先を 見る 場面。いかだの あと）
  const D = P.dockScene;
  m.triggers.push({ id: 'c9b_dock', x: D.x, y: D.y, w: D.w, h: D.h, script: 'c9b_dock', show: { all: [C9B.raft], not: [C9B.act2] } });
  m.actions.push({ x: P.dock.x, y: P.dock.y + 1, script: 'c9b_dock_end' });
  // 大王のやしきの 門（5・6本めの 柱で 開く）
  m.gates.push({ x: P.gate.x, y: P.gate.y, closed: T.C9B_GATE, open: T.C9B_HALL, flag: C9B.gate });
  m.actions.push({ x: P.gate.x, y: P.gate.y, script: 'c9b_gate', show: { not: [C9B.gate] } });
  m.warps.push({ x: P.gate.x, y: P.gate.y, to: { map: C9B_MAP.hall, x: HALL_POS.enter.x + 1, y: HALL_POS.enter.y + 0.5, dir: 'up' }, show: { all: [C9B.gate] } });
  m.links.push({ x: P.gate.x, y: P.gate.y, to: C9B_MAP.hall });
  // 魔物: 明るい 所は ふつうの 魔物・暗い 所は 大ミミズ（world/c9b-steps.js の symBlock）
  m.zoneAt = (x, y) => {
    if (y >= P.river.y0) return 'safe:river'; // 川と 川の むこう（行けない）
    for (const [x0, y0, x1, y1, z] of SAFE9B) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return z;
    return C9B_TABLE.light;
  };
  m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g]));
  return m;
}

// 宝箱の 中み（B班の data/items-c9b.js の c9bChest。10この id）
export const chestOf9b = (id) => c9bChest(id) || {};
