// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」（第103回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19）
// ・はかりの 回ろう c11c_hall1〜3（かげの 台・光の さく・スピカの 光の 橋・見はりの カード）・ひと休みの 部屋 c11c_rest（回復）・大とびらの 前 c11c_door
// ・月の都（第2幕の マップ）に フラグで 足す 物: おもての 名前の 塔の 前（場面 0）・うらの 町の 小屋の おくの 古い 戸（c11c_join で 開く）・
//   3人組の るす番・戸の 前の アルゴル
//   ※ 幕が 閉じて いる 間は c11c_start が 立たないので、月の都は 今の まま（場面の マスは 何も しない）
// ・map.c11c … { floor: 1〜3, peds: [{ x, y, c, fences, bridges, cards }], fences: [{ c, cells }], bridges: [{ cells }], cards: [{ cells, x0, x1, y0, y1, back, speed }], arrive, up }
//   （world/c11c-steps.js・client/c11c-view.js が 読む）。さくの とびらの しるしは '@cf<番号>'・橋は '@lb<番号>'（その 人の パーティーの アルゴルと 家族の 台。セーブしない）
import { T } from '../tiles.js?v=28060a38724e';
import { npc } from './npc.js?v=28060a38724e';
import { parseRows16 } from './past.js?v=28060a38724e';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=28060a38724e';
import { SHOPS } from '../data/shops.js?v=28060a38724e';
import { c11cChest, C11C_BACK_ADD } from '../data/items-c11c.js?v=28060a38724e';
import { finishGates11a } from './c11a.js?v=28060a38724e';
import {
  C11C, C11C_ACT0, C11C_MAP, C11C_MAP_IDS, C11C_TRACKS, C11C_TABLE, C11C_FRONT, C11C_BACK, C11C_ALGOL_SPRITE, C11C_ALGOL_NAME,
  C11C_TRIO, C11C_TRIO_SPRITES,
} from './c11c-flags.js?v=28060a38724e';
import {
  HALL_ROWS11C, REST_ROWS11C, DOOR_ROWS11C, CHESTS11C, HALL_POS11C, REST_POS11C, DOOR_POS11C, CARDS11C, SCENES11C, CITY_POS11C, C11C_RANGE,
} from './c11c-rows.js?v=28060a38724e';

export const CH11C_MAPS = [...C11C_MAP_IDS];

// ───── 宝箱の 中み（B班の data/items-c11c.js の c11cChest）─────
let chestFn11c = c11cChest;
export const setChestOf11c = (fn) => { chestFn11c = fn; };
export const chestOf11c = (id) => chestFn11c(id) || {};

// ───── かげの 台・光の さく・橋・カード（どこからでも 読める きまり）─────
const COLORS = ['a', 'b', 'c', 'd'];
export const C11C_PED_TILES = { a: T.C11C_PED_A, b: T.C11C_PED_B, c: T.C11C_PED_C, d: T.C11C_PED_D };
export const C11C_FENCE_TILES = { a: T.C11C_FENCE_A, b: T.C11C_FENCE_B, c: T.C11C_FENCE_C, d: T.C11C_FENCE_D };
// 色の 名前（台本・助けの ひとこと）
export const C11C_COLOR_NAME = { a: '青', b: '緑', c: '赤', d: '黄' };
export const fenceFlag11c = (g) => `@cf${g}`;
export const bridgeFlag11c = (g) => `@lb${g}`;
// アルゴルが 台 a に いる・家族が 台 held（Set）に 立って いる 時、さく g は 開いて いるか
export function fenceOpen11c(map, a, held, g) {
  const P = map?.c11c?.peds;
  if (!P) return false;
  if (a >= 0 && P[a]?.fences.includes(g)) return true;
  if (held) for (const q of held) if (P[q]?.fences.includes(g)) return true;
  return false;
}
// 光の 橋 g は かかって いるか（アルゴルが 近くの 台に いると 消える）
export const bridgeOn11c = (map, a, g) => !(a >= 0 && map?.c11c?.peds[a]?.bridges.includes(g));
// 見はりの カード k は 止まって いるか（アルゴルが 食べて いる 間だけ）
export const cardFrozen11c = (map, a, k) => a >= 0 && !!map?.c11c?.peds[a]?.cards.includes(k);
// しるし f（'@cf<g>'・'@lb<g>'）の 値。わからない しるしは undefined
export function c11cMapFlag(map, a, held, f) {
  if (!map?.c11c || f[0] !== '@') return undefined;
  if (f.startsWith('@cf')) return fenceOpen11c(map, a, held, Number(f.slice(3)));
  if (f.startsWith('@lb')) return bridgeOn11c(map, a, Number(f.slice(3)));
  return undefined;
}
// その マスの 台の 番号（-1 … 台では ない）
export const pedAt11c = (map, x, y) => (map?.c11c ? map.c11c.peds.findIndex((p) => p.x === x && p.y === y) : -1);
// その マスの 見はりの カードの 通り道の 番号（-1 … ない）
export const laneAt11c = (map, x, y) => (map?.c11c ? map.c11c.cards.findIndex((k) => k.cells.some((q) => q.x === x && q.y === y)) : -1);

// つながった 同じ 文字の かたまり
function groups(rows, ch) {
  const h = rows.length, w = rows[0].length;
  const seen = new Set();
  const out = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (rows[y][x] !== ch || seen.has(y * w + x)) continue;
    const cells = [];
    const q = [[x, y]];
    seen.add(y * w + x);
    for (let i = 0; i < q.length; i++) {
      const [cx, cy] = q[i];
      cells.push({ x: cx, y: cy });
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || rows[ny][nx] !== ch || seen.has(ny * w + nx)) continue;
        seen.add(ny * w + nx);
        q.push([nx, ny]);
      }
    }
    out.push(cells);
  }
  return out;
}
const reach = (p, cells) => cells.some((q) => Math.hypot(q.x - p.x, q.y - p.y) <= C11C_RANGE + 1e-9);
// rows → map.c11c の 中み
export function hallData11c(rows, n) {
  const fences = COLORS.flatMap((c) => groups(rows, c).map((cells) => ({ c, cells })));
  const bridges = groups(rows, 'L').map((cells) => ({ cells }));
  const cards = groups(rows, 'l').map((cells, k) => {
    const xs = cells.map((q) => q.x), ys = cells.map((q) => q.y);
    const C = CARDS11C[n]?.[k] || {};
    return { cells, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), back: C.back, speed: C.speed || 1.6 };
  });
  const peds = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const c = COLORS[ch.charCodeAt(0) - 65];
    if (!c || !/[A-D]/.test(ch)) return;
    const p = { x, y, c };
    p.fences = fences.map((F, g) => (F.c === c && reach(p, F.cells) ? g : -1)).filter((g) => g >= 0);
    p.bridges = bridges.map((B, g) => (reach(p, B.cells) ? g : -1)).filter((g) => g >= 0);
    p.cards = cards.map((K, k) => (reach(p, K.cells) ? k : -1)).filter((k) => k >= 0);
    peds.push(p);
  }));
  return { floor: n, peds, fences, bridges, cards };
}

const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const HALL_SKY = { bg2d: '#0a0814', sky3d: { bg: '#100c1c', fog: 0x1c1430 }, dark: false };
const base = (id, name, kind, t, extra) => ({
  id, name, kind, w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, zoneAt: () => 'safe:c11c', ...HALL_SKY, ...extra,
});
const HALL_LEGEND = {
  '#': T.C11C_WALL, '.': T.C11C_FLOOR, $: T.C11C_FLOOR, '=': T.C11C_GROOVE, L: T.C11C_GROOVE, l: T.C11C_LANE,
  A: T.C11C_PED_A, B: T.C11C_PED_B, C: T.C11C_PED_C, D: T.C11C_PED_D,
  a: T.C11C_FENCE_A, b: T.C11C_FENCE_B, c: T.C11C_FENCE_C, d: T.C11C_FENCE_D,
  G: T.C11C_STAIRS_UP, E: T.C11C_STAIRS_DOWN, W: T.C11C_SPRING, K: T.C11C_BIGDOOR, p: T.C11C_PILLAR, ':': T.C11C_CARPET,
};
const trig = (m, id, R, show) => m.triggers.push({ id, x: R.x, y: R.y, w: R.w, h: R.h, script: id, show });
const putChests = (m, list) => { for (const c of list) m.chests.push({ id: c.id, x: c.x, y: c.y, ...chestOf11c(c.id) }); };

// ───── はかりの 回ろう ─────
const HALL_NAMES = { 1: 'はかりの回ろう　1階', 2: 'はかりの回ろう　2階', 3: 'はかりの回ろう　3階' };
function buildHall(n) {
  const rows = HALL_ROWS11C[n];
  const t = parseRows16(rows, HALL_LEGEND);
  const id = C11C_MAP[`hall${n}`];
  const c11c = hallData11c(rows, n);
  const P = HALL_POS11C[n];
  c11c.arrive = P.arrive;
  c11c.up = P.up;
  const m = base(id, HALL_NAMES[n], 'dungeon', t, { bgm: C11C_TRACKS.hall, indoor: false, c11c, c11cAlgol: true });
  // さく（とびら '@cf<g>'）・橋（'@lb<g>'）
  c11c.fences.forEach((F, g) => { for (const q of F.cells) m.gates.push({ x: q.x, y: q.y, closed: C11C_FENCE_TILES[F.c], open: T.C11C_FENCE_OFF, flag: fenceFlag11c(g) }); });
  c11c.bridges.forEach((B, g) => { for (const q of B.cells) m.gates.push({ x: q.x, y: q.y, closed: T.C11C_GROOVE, open: T.C11C_BRIDGE, flag: bridgeFlag11c(g) }); });
  putChests(m, CHESTS11C[`hall${n}`]);
  // 出入り口: 1階の 下 → うらの 町の 古い 戸の 前 / 上 → 次の 階（3階の 上は ひと休みの 部屋を はさまず 大とびらの 前）
  if (n === 1) warp(m, P.down, C11C_BACK, CITY_POS11C.hallDoorFront, 'down');
  if (n === 2) warp(m, P.down, C11C_MAP.hall1, HALL_POS11C[1].back, 'down');
  if (n === 3) warp(m, P.down, C11C_MAP.rest, REST_POS11C.back, 'down');
  if (n === 1) warp(m, P.up, C11C_MAP.hall2, HALL_POS11C[2].arrive, 'up');
  if (n === 2) warp(m, P.up, C11C_MAP.rest, REST_POS11C.arrive, 'up');
  if (n === 3) warp(m, P.up, C11C_MAP.door, DOOR_POS11C.arrive, 'up');
  // 場面（着いた 所）
  // 1階・3階の 説明は その 人が この 回の あそびで 1回（'@cs<n>'。world/c11c-steps.js）
  if (n === 1) trig(m, 'c11c_hall1_event', SCENES11C.hall1, { all: [C11C.join], not: [C11C.h1, '@cs1'] });
  if (n === 2) trig(m, 'c11c_hall2_event', SCENES11C.hall2, { all: [C11C.join], not: [C11C.h1] });
  if (n === 3) trig(m, 'c11c_hall3_event', SCENES11C.hall3, { all: [C11C.rest], not: [C11C.h3, '@cs3'] });
  // 魔物: ゆかの 上だけ（台・さく・橋・みぞ・カードの 通り道・出入り口の まわり 1マスは 出ない）
  const quiet = [...c11c.peds, ...c11c.fences.flatMap((F) => F.cells), ...c11c.bridges.flatMap((B) => B.cells), ...c11c.cards.flatMap((K) => K.cells), ...m.warps, P.arrive];
  m.zoneAt = (x, y) => {
    if (m.tiles[y * m.w + x] !== T.C11C_FLOOR || quiet.some((q) => Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1)) return 'safe:c11c_hall';
    return tableOr(C11C_TABLE[n], 'safe:wait');
  };
  if (ENCOUNTER_TABLES[C11C_TABLE[n]]) m.spawnCounts = { [C11C_TABLE[n]]: 3 };
  return m;
}

// ───── ひと休みの 部屋 ─────
function buildRest() {
  const t = parseRows16(REST_ROWS11C, { ...HALL_LEGEND, '.': T.C11C_REST_FLOOR, $: T.C11C_REST_FLOOR });
  const m = base(C11C_MAP.rest, 'はかりの回ろう　ひと休みの部屋', 'dungeon', t, { bgm: C11C_TRACKS.rest, indoor: true, c11cAlgol: true, bg2d: '#140e0c', sky3d: { bg: '#1a120e', fog: 0x2a1a14 } });
  const P = REST_POS11C;
  putChests(m, CHESTS11C.rest);
  warp(m, P.down, C11C_MAP.hall2, HALL_POS11C[2].back, 'down');
  warp(m, P.up, C11C_MAP.hall3, HALL_POS11C[3].arrive, 'up');
  m.actions.push({ x: P.spring.x, y: P.spring.y, script: 'c11c_spring' });
  trig(m, 'c11c_rest_event', SCENES11C.rest, { all: [C11C.h1], not: [C11C.rest] });
  return m;
}

// ───── 大とびらの 前 ─────
function buildDoor() {
  const t = parseRows16(DOOR_ROWS11C, HALL_LEGEND);
  const m = base(C11C_MAP.door, '王宮の大とびらの前', 'dungeon', t, { bgm: C11C_TRACKS.hall, indoor: false, c11cAlgol: true, bg2d: '#0c0a18', sky3d: { bg: '#14102a', fog: 0x221a3a } });
  const P = DOOR_POS11C;
  putChests(m, CHESTS11C.door);
  warp(m, P.down, C11C_MAP.hall3, HALL_POS11C[3].back, 'down');
  // 大とびら（幕の クリアで 開いた 絵。中へは 入れない）
  for (let y = 1; y <= 2; y++) for (let x = 8; x <= 11; x++) {
    m.gates.push({ x, y, closed: T.C11C_BIGDOOR, open: T.C11C_BIGDOOR_OPEN, flag: C11C.ace });
    m.actions.push({ x, y, script: 'c11c_bigdoor' });
  }
  trig(m, 'c11c_door_event', SCENES11C.door, { all: [C11C.rest], not: [C11C.h3] });
  trig(m, 'c11c_ace_event', SCENES11C.door, { all: [C11C.h3], not: [C11C.ace] });
  trig(m, 'c11c_end_event', SCENES11C.door, { all: [C11C.ace], not: [C11C.act3] });
  return m;
}

// ───── 月の都に 足す 物 ─────
function attachCity(maps) {
  const F = maps[C11C_FRONT], B = maps[C11C_BACK];
  if (!F || !B) return;
  const C = CITY_POS11C;
  // おもて: 名前の 塔の 前（場面 0 … 第2幕 クリアの あと・幕が 開いて いる 時だけ 動く。中ボスの やり直し・アルゴルが いっしょに）
  trig(F, 'c11c_start_event', C.towerFront, { all: [C11C_ACT0], not: [C11C.start] });
  trig(F, 'c11c_mecha_event', C.towerFront, { all: [C11C.start], not: [C11C.mecha] });
  trig(F, 'c11c_join_event', C.towerFront, { all: [C11C.mecha], not: [C11C.join] });
  // うら: 小屋の おくの 古い 戸（アルゴルが いっしょに なると 開く）→ 回ろう 1階
  const D = C.hallDoor;
  B.gates.push({ x: D.x, y: D.y, closed: T.C11B_B_HOUSE, open: T.C11C_HALLDOOR, flag: C11C.join });
  warp(B, D, C11C_MAP.hall1, HALL_POS11C[1].arrive, 'up', { all: [C11C.join] });
  // 戸の 前の アルゴル（いっしょに 来る 前の あんない。幕の クリアまで）・3人組の るす番
  B.npcs.push(npc('c11c_algol', C11C_ALGOL_NAME, [C.algol.x, C.algol.y], C11C_ALGOL_SPRITE, 'c11c_algol', { dir: 'down', show: { all: [C11C.join], not: [C11C.act3] } }));
  const keys = ['boss', 'mecha', 'power'];
  C.trio.forEach((p, i) => B.npcs.push(npc(`c11c_trio${i + 1}`, C11C_TRIO[keys[i]], [p.x, p.y], C11C_TRIO_SPRITES[keys[i]], `c11c_trio${i + 1}`, { dir: 'left', show: { all: [C11C.join] } })));
  finishGates11a(B);
  // うらの 町の 小さな 店: 幕の クリア（c11_act3）で 品が 4つ ふえる（B班の C11C_BACK_ADD）
  const shop = SHOPS.c11b_back_shop;
  if (shop && !(shop.more || []).some((x) => x.show?.all?.[0] === C11C.act3)) {
    shop.more = [...(shop.more || []), { show: { all: [C11C.act3] }, items: [...C11C_BACK_ADD], hello: 'いらっしゃい！\n王宮の下から、めずらしい品が、とどいたよ。' }];
  }
}

export function attachC11c(maps) {
  for (const m of [buildHall(1), buildHall(2), buildRest(), buildHall(3), buildDoor()]) {
    finishGates11a(m);
    maps[m.id] = m;
  }
  attachCity(maps);
}
export { C11C_MAP };
