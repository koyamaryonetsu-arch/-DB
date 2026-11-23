// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」（第104回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）
// ・光の はかりの 広間 c11d_scale・かがやきの 塔 c11d_tower1〜4（2階は おもて c11d_tower2 ／ うら c11d_tower2b）・玉座の 間 c11d_throne
// ・1〜3階は 前の 幕の しくみを そのまま 使う（新しい きまりは 足さない）:
//   1階 … map.c11aCons（ひとふで書き。world/c11a-steps.js）/ 2階 … map.c11b（おもてと うら。world/c11b-steps.js。くみの 番号は 'c11d'）/
//   3階 … map.c11c（かげの 台。world/c11c-steps.js）
// ・4階 … map.c11dPads（7色の 音の 台。world/c11d-steps.js・client/c11d-view.js）
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   王宮の 大とびらの 前 … 大とびらの 中へ（場面 0 の マスは c11_act3 から。幕が 閉じて いる 間は 台本が から）/
//   月の都（おもて）… アルゴルの ランプ（c11d_lamp）・開いた はかりの門・星の橋の はし・女王 たち（c11_act4）/
//   星見の丘 … さいごまで かかった 星の橋（c11d_bridge）・月の都への 出入り口（c11_act4）/ ながれ星のくぼ地 … 光る 8つめの 台（c11_act4）
import { T } from '../tiles.js';
import { npc } from './npc.js';
import { parseRows16 } from './past.js';
import { ENCOUNTER_TABLES } from '../data/encounters.js';
import { SHOPS } from '../data/shops.js';
import { c11dChest, C11D_FRONT_ADD } from '../data/items-c11d.js';
import { finishGates11a, placeCon11a } from './c11a.js';
import { hallData11c, fenceFlag11c, C11C_FENCE_TILES } from './c11c.js';
import {
  C11D, C11D_ACT0, C11D_MAP, C11D_MAP_IDS, C11D_TRACKS, C11D_TABLE, C11D_PAIR, C11D_DOOR, C11D_FRONT, C11D_HILL, C11D_CRATER,
  C11D_QUEEN_NAME, C11D_MIRROR_NAME, C11D_OBORO_NAME, C11D_ACE_NAME, C11D_TOWER_MAPS,
} from './c11d-flags.js';
import {
  SCALE_ROWS11D, SCALE_POS11D, CON11D, CON_AT11D, TOWER1_ROWS11D, TOWER1_POS11D, TOWER2_ROWS11D, TOWER2_CHESTS11D, TOWER2_FLOORS11D,
  TOWER2_POS11D, TOWER2_SECTIONS11D, TOWER3_ROWS11D, TOWER3_POS11D, TOWER4_ROWS11D, TOWER4_POS11D, THRONE_ROWS11D, THRONE_POS11D,
  CHESTS11D, SCENES11D, DOOR_IN11D, DOOR_BACK11D, CITY_POS11D, HILL_POS11D, PED8_11D,
} from './c11d-rows.js';

export const CH11D_MAPS = [...C11D_MAP_IDS];

// ───── 宝箱の 中み（B班の data/items-c11d.js の c11dChest）─────
let chestFn11d = c11dChest;
export const setChestOf11d = (fn) => { chestFn11d = fn; };
export const chestOf11d = (id) => chestFn11d(id) || {};

// ───── 音の 間の 7色の 台 ─────
export const C11D_PAD_TILES = [T.C11D_PAD_1, T.C11D_PAD_2, T.C11D_PAD_3, T.C11D_PAD_4, T.C11D_PAD_5, T.C11D_PAD_6, T.C11D_PAD_7];
// その マスの 音の 台の 番号（-1 … 台では ない）
export const padAt11d = (map, x, y) => (map?.c11dPads ? map.c11dPads.findIndex((p) => p.x === x && p.y === y) : -1);

const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const SKY = { bg2d: '#100c24', sky3d: { bg: '#1a1438', fog: 0x2a2458 }, dark: false };
const base = (id, name, kind, t, extra) => ({
  id, name, kind, w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, zoneAt: () => 'safe:c11d',
  // アルゴルは 王宮の 中でも いっしょに 歩く（第3幕から。3階では かげの 台に 立つ）
  c11cAlgol: true, ...SKY, ...extra,
});
const trig = (m, id, R, show) => m.triggers.push({ id, x: R.x, y: R.y, w: R.w, h: R.h, script: id, show });
const putChests = (m, list) => { for (const c of list) m.chests.push({ id: c.id, x: c.x, y: c.y, ...chestOf11d(c.id) }); };
const near = (list, x, y, r) => list.some((q) => Math.abs(q.x - x) <= r && Math.abs(q.y - y) <= r);
// 魔物の 出る 所（ゆかの 上。しかけ・出入り口の まわり 1マスは 出ない）
function monsters(m, n, floorTiles, quiet) {
  const t = C11D_TABLE[n];
  m.zoneAt = (x, y) => (floorTiles.includes(m.tiles[y * m.w + x]) && !near(quiet, x, y, 1) ? tableOr(t, 'safe:wait') : 'safe:c11d_tower');
  if (ENCOUNTER_TABLES[t]) m.spawnCounts = { [t]: 3 };
}

// ───── 光の はかりの 広間 ─────
const SCALE_LEGEND = {
  '#': T.C11D_WALL, '.': T.C11D_FLOOR, ':': T.C11D_CARPET, S: T.C11D_SCALE, p: T.C11D_PILLAR, G: T.C11D_STAIRS_UP, E: T.C11D_STAIRS_DOWN, l: T.C11D_PILLAR,
};
function buildScale() {
  const t = parseRows16(SCALE_ROWS11D, SCALE_LEGEND);
  const m = base(C11D_MAP.scale, '光のはかりの広間', 'dungeon', t, { bgm: C11D_TRACKS.scale, indoor: true, bg2d: '#14102a', sky3d: { bg: '#e8e0f8', fog: 0x8a82b8 } });
  const P = SCALE_POS11D;
  warp(m, P.down, C11D_DOOR, DOOR_BACK11D, 'down');
  warp(m, P.up, C11D_MAP.tower1, TOWER1_POS11D.arrive, 'up');
  // 光の のぼり台（4階に 着くと 開く。4階への 近道）
  m.gates.push({ x: P.lift.x, y: P.lift.y, closed: T.C11D_PILLAR, open: T.C11D_LIFT, flag: C11D.t3 });
  warp(m, P.lift, C11D_MAP.tower4, TOWER4_POS11D.arrive, 'up', { all: [C11D.t3] });
  for (let y = P.scale.y; y <= P.scale.y + 1; y++) for (let x = P.scale.x; x <= P.scale.x + 1; x++) m.actions.push({ x, y, script: 'c11d_scale' });
  return m;
}

// ───── 1階 星座の 間（ひとふで書き）─────
const TOWER1_LEGEND = { '#': T.C11D_WALL, '.': T.C11D_FLOOR, $: T.C11D_FLOOR, ' ': T.C11D_VOID, '*': T.C11D_STAR, K: T.C11D_CONDOOR, E: T.C11D_STAIRS_DOWN };
function buildTower1() {
  const rows = TOWER1_ROWS11D;
  const t = parseRows16(rows, TOWER1_LEGEND);
  const m = base(C11D_MAP.tower1, 'かがやきの塔　1階　星座の間', 'dungeon', t, { bgm: C11D_TRACKS.tower, indoor: false, c11dTower: 1 });
  const P = TOWER1_POS11D;
  putChests(m, CHESTS11D.tower1);
  warp(m, P.down, C11D_MAP.scale, SCALE_POS11D.back, 'down');
  // 星座の とびら（星座が できると 上への 道）
  m.gates.push({ x: P.up.x, y: P.up.y, closed: T.C11D_CONDOOR, open: T.C11D_CONDOOR_OPEN, flag: C11D.t1 });
  m.actions.push({ x: P.up.x, y: P.up.y, script: 'c11d_condoor' });
  warp(m, P.up, C11D_MAP.tower2, TOWER2_POS11D.arrive, 'up', { all: [C11D.t1] });
  // 星座（id は 階を 通った しるし c11d_t1。できると とびらが 開く）
  const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && '.$'.includes(rows[y][x]);
  const con = placeCon11a(m, CON11D.id, CON_AT11D.x, CON_AT11D.y, walk, CON11D);
  con.land = { ...P.land };
  trig(m, 'c11d_tower1_event', SCENES11D.tower1, { all: [C11D.start], not: [C11D.t1, '@cs41'] });
  const quiet = [...con.stars.map(([x, y]) => ({ x, y })), P.arrive, P.up, P.back];
  m.zoneAt = (x, y) => (rows[y]?.[x] === '.' && !near(quiet, x, y, 1) ? tableOr(C11D_TABLE[1], 'safe:wait') : 'safe:c11d_tower');
  if (ENCOUNTER_TABLES[C11D_TABLE[1]]) m.spawnCounts = { [C11D_TABLE[1]]: 3 };
  return m;
}

// ───── 2階 月かげの 間（おもてと うら）─────
const withChests = (rows, chests) => rows.map((r, y) => [...r].map((ch, x) => {
  if (ch !== 'c') return ch;
  const c = chests.find((q) => q.x === x && q.y === y);
  return c?.side === 1 ? 'f' : 'b';
}).join(''));
const TOWER2_LEGEND = [
  { '#': T.C11D_MOON_WALL_F, '.': T.C11D_MOON_F, b: T.C11D_MOON_F, f: T.C11D_MOON_WALL_F, D: T.C11B_DOOR, L: T.C11B_LIGHTFLOOR, U: T.C11D_STAIRS_UP, X: T.C11D_STAIRS_DOWN },
  { '#': T.C11D_MOON_WALL_B, '.': T.C11D_MOON_B, b: T.C11D_MOON_WALL_B, f: T.C11D_MOON_B, D: T.C11B_DOOR, L: T.C11B_SHUTDOOR, U: T.C11D_MOON_WALL_B, X: T.C11D_MOON_WALL_B },
];
const SIDE_NAMES = ['おもて', 'うら'];
function buildTower2(side) {
  const rows = withChests(TOWER2_ROWS11D, TOWER2_CHESTS11D);
  const t = parseRows16(rows, TOWER2_LEGEND[side]);
  const id = side ? C11D_MAP.tower2b : C11D_MAP.tower2;
  const floors = TOWER2_FLOORS11D.map((q) => ({ ...q }));
  const m = base(id, `かがやきの塔　2階　月かげの間　${SIDE_NAMES[side]}`, 'dungeon', t, {
    bgm: C11D_TRACKS.tower, indoor: false, c11dTower: 2,
    bg2d: side ? '#0c060e' : '#141836', sky3d: side ? { bg: '#120a16', fog: 0x1a0e1e } : { bg: '#1e2450', fog: 0x3a4a88 },
    c11b: { pair: C11D_PAIR, side, other: side ? C11D_MAP.tower2 : C11D_MAP.tower2b, floors, lamps: [], bridges: [], sections: TOWER2_SECTIONS11D,
      helpText: 'スピカ「…こっち。光が、教えてくれる」\n（小さな光が、次の場所を、てらしている）' },
  });
  for (const c of TOWER2_CHESTS11D.filter((q) => q.side === side)) m.chests.push({ id: c.id, x: c.x, y: c.y, ...chestOf11d(c.id) });
  for (const F of floors) m.gates.push(side ? { x: F.x, y: F.y, closed: T.C11B_SHUTDOOR, open: T.C11B_OPENDOOR, flag: F.f } : { x: F.x, y: F.y, closed: T.C11B_LIGHTFLOOR, open: T.C11B_LIGHTFLOOR_ON, flag: F.f });
  const P = TOWER2_POS11D;
  if (side === 0) {
    warp(m, P.down, C11D_MAP.tower1, TOWER1_POS11D.back, 'down');
    warp(m, P.up, C11D_MAP.tower3, TOWER3_POS11D.arrive, 'up');
    trig(m, 'c11d_tower2_event', SCENES11D.tower2, { all: [C11D.t1], not: [C11D.t2, '@cs42'] });
  }
  const floorT = side ? T.C11D_MOON_B : T.C11D_MOON_F;
  monsters(m, 2, [floorT], [...floors, ...m.warps, P.arrive, { x: 18, y: 11 }, { x: 11, y: 3 }]);
  return m;
}

// ───── 3階 かげの 間（かげの 台と 光の さく）─────
const TOWER3_LEGEND = {
  '#': T.C11D_SHADOW_WALL, '.': T.C11D_SHADOW_FLOOR, $: T.C11D_SHADOW_FLOOR, A: T.C11C_PED_A, B: T.C11C_PED_B, C: T.C11C_PED_C, D: T.C11C_PED_D,
  a: T.C11C_FENCE_A, b: T.C11C_FENCE_B, c: T.C11C_FENCE_C, d: T.C11C_FENCE_D, G: T.C11D_STAIRS_UP, E: T.C11D_STAIRS_DOWN,
};
function buildTower3() {
  const rows = TOWER3_ROWS11D;
  const t = parseRows16(rows, TOWER3_LEGEND);
  const P = TOWER3_POS11D;
  const c11c = hallData11c(rows, 'c11d');
  c11c.arrive = P.arrive;
  c11c.up = P.up;
  c11c.passFlag = C11D.t3; // 助けを 出さなく なる しるし（3階を 通った）
  const m = base(C11D_MAP.tower3, 'かがやきの塔　3階　かげの間', 'dungeon', t, { bgm: C11D_TRACKS.tower, indoor: false, c11c, c11dTower: 3 });
  c11c.fences.forEach((F, g) => { for (const q of F.cells) m.gates.push({ x: q.x, y: q.y, closed: C11C_FENCE_TILES[F.c], open: T.C11C_FENCE_OFF, flag: fenceFlag11c(g) }); });
  putChests(m, CHESTS11D.tower3);
  warp(m, P.down, C11D_MAP.tower2, TOWER2_POS11D.back, 'down');
  warp(m, P.up, C11D_MAP.tower4, TOWER4_POS11D.arrive, 'up');
  trig(m, 'c11d_tower3_event', SCENES11D.tower3, { all: [C11D.t1], not: [C11D.t3, '@cs43'] });
  monsters(m, 3, [T.C11D_SHADOW_FLOOR], [...c11c.peds, ...c11c.fences.flatMap((F) => F.cells), ...m.warps, P.arrive]);
  return m;
}

// ───── 4階 音の 間 ─────
const TOWER4_LEGEND = {
  '#': T.C11D_WALL, '.': T.C11D_FLOOR, $: T.C11D_FLOOR, m: T.C11D_MURAL, O: T.C11D_SOUNDDOOR, W: T.C11D_SPRING, U: T.C11D_WALL, E: T.C11D_STAIRS_DOWN,
  1: T.C11D_PAD_1, 2: T.C11D_PAD_2, 3: T.C11D_PAD_3, 4: T.C11D_PAD_4, 5: T.C11D_PAD_5, 6: T.C11D_PAD_6, 7: T.C11D_PAD_7,
};
function buildTower4() {
  const t = parseRows16(TOWER4_ROWS11D, TOWER4_LEGEND);
  const P = TOWER4_POS11D;
  const m = base(C11D_MAP.tower4, 'かがやきの塔　4階　音の間', 'dungeon', t, {
    bgm: C11D_TRACKS.tower, indoor: true, c11dTower: 4, c11dPads: P.pads.map((q, i) => ({ x: q.x, y: q.y, i })),
  });
  putChests(m, CHESTS11D.tower4);
  // 下は はかりの 広間の 光の のぼり台の 前（3階の 上には もどらない）
  warp(m, P.down, C11D_MAP.scale, SCALE_POS11D.liftBack, 'down');
  // 音の とびら（7つの 音で 開く）・上への 階段（中ボスに 勝つと 開く）
  for (const D of P.door) {
    m.gates.push({ x: D.x, y: D.y, closed: T.C11D_SOUNDDOOR, open: T.C11D_SOUNDDOOR_OPEN, flag: C11D.t4 });
    m.actions.push({ x: D.x, y: D.y, script: 'c11d_sounddoor' });
  }
  m.gates.push({ x: P.up.x, y: P.up.y, closed: T.C11D_WALL, open: T.C11D_STAIRS_UP, flag: C11D.duo });
  warp(m, P.up, C11D_MAP.throne, THRONE_POS11D.arrive, 'up', { all: [C11D.duo] });
  // かべの 歌の 絵・いずみ・音の 台（しらべると 音の 名前）
  for (let x = 4; x <= 17; x++) if (!P.door.some((D) => D.x === x)) m.actions.push({ x, y: 7, script: 'c11d_mural' });
  m.actions.push({ x: P.spring.x, y: P.spring.y, script: 'c11d_spring' });
  trig(m, 'c11d_tower4_event', SCENES11D.tower4, { all: [C11D.t2], not: [C11D.t4, '@cs44'] });
  trig(m, 'c11d_duo_event', SCENES11D.duo, { all: [C11D.t4], not: [C11D.duo] });
  return m;
}

// ───── 玉座の 間 ─────
const THRONE_LEGEND = { '#': T.C11D_WALL, '.': T.C11D_FLOOR, $: T.C11D_FLOOR, ':': T.C11D_CARPET, w: T.C11D_WINDOW, T: T.C11D_THRONE, p: T.C11D_PILLAR, E: T.C11D_STAIRS_DOWN };
function buildThrone() {
  const t = parseRows16(THRONE_ROWS11D, THRONE_LEGEND);
  const P = THRONE_POS11D;
  const m = base(C11D_MAP.throne, 'かがやきの塔　玉座の間', 'dungeon', t, { bgm: C11D_TRACKS.scale, indoor: false, c11dThrone: true, bg2d: '#0a0c24', sky3d: { bg: '#0c1030', fog: 0x1a2050 } });
  putChests(m, CHESTS11D.throne);
  warp(m, P.down, C11D_MAP.tower4, TOWER4_POS11D.back, 'down');
  for (let x = 3; x <= 18; x++) m.actions.push({ x, y: 1, script: 'c11d_window' });
  for (const [x, y] of [[10, 2], [11, 2], [10, 3], [11, 3]]) m.actions.push({ x, y, script: 'c11d_throne' });
  trig(m, 'c11d_queen_event', SCENES11D.queen, { all: [C11D.duo], not: [C11D.queen] });
  trig(m, 'c11d_end_event', SCENES11D.queen, { all: [C11D.queen], not: [C11D.act4] });
  return m;
}

// ───── 今の マップに 足す 物 ─────
// 王宮の 大とびらの 前: 大とびらの 中へ（場面 0 の マス・c11d_start から 出入り口）
function attachDoor(maps) {
  const m = maps[C11D_DOOR];
  if (!m) return;
  trig(m, 'c11d_start_event', SCENES11D.enter, { all: [C11D_ACT0], not: [C11D.start] });
  for (const p of DOOR_IN11D) warp(m, p, C11D_MAP.scale, SCALE_POS11D.arrive, 'up', { all: [C11D.start] });
  finishGates11a(m);
}
// 月の都（おもて）: アルゴルの ランプ・開いた はかりの門・星の橋の はし・クリアの あとの 女王 たち
function attachCity(maps) {
  const F = maps[C11D_FRONT];
  if (!F) return;
  const C = CITY_POS11D;
  F.gates.push({ x: C.hook.x, y: C.hook.y, closed: T.C11B_LAMPHOOK, open: T.C11D_HOOK_ON, flag: C11D.lamp });
  F.gates.push({ x: C.gate.x, y: C.gate.y, closed: T.C11B_SCALEGATE, open: T.C11D_SCALEGATE_OPEN, flag: C11D.act4 });
  F.gates.push({ x: C.bridgeEnd.x, y: C.bridgeEnd.y, closed: T.C11B_F_PAVE, open: T.C11D_BRIDGE_END, flag: C11D.act4 });
  warp(F, C.bridgeEnd, C11D_HILL, HILL_POS11D.back, 'down', { all: [C11D.act4] });
  const after = { all: [C11D.act4] };
  F.npcs.push(npc('c11d_queen', C11D_QUEEN_NAME, [C.queen.x, C.queen.y], 'c11d_queen', 'c11d_queen_talk', { dir: 'down', show: after }));
  F.npcs.push(npc('c11d_mirror', C11D_MIRROR_NAME, [C.mirror.x, C.mirror.y], 'c10d_mirror_f', 'c11d_mirror_talk', { dir: 'down', show: after }));
  F.npcs.push(npc('c11d_oboro', C11D_OBORO_NAME, [C.oboro.x, C.oboro.y], 'c11b_oboro', 'c11d_oboro_talk', { dir: 'down', show: after }));
  F.npcs.push(npc('c11d_ace', C11D_ACE_NAME, [C.ace.x, C.ace.y], 'c11c_ace', 'c11d_ace_talk', { dir: 'left', show: after }));
  finishGates11a(F);
  // おもての 武具屋: 第3部の クリア（c11_act4）で 品が 4つ ふえる（B班の C11D_FRONT_ADD）
  const shop = SHOPS.c11b_arms;
  if (shop && !(shop.more || []).some((x) => x.show?.all?.[0] === C11D.act4)) {
    shop.more = [...(shop.more || []), { show: { all: [C11D.act4] }, items: [...C11D_FRONT_ADD], hello: 'いらっしゃいませ。\nランプの日の、とくべつな品で、ございます。' }];
  }
}
// 星見の丘: とちゅうで 止まった 橋の 絵 → さいごまで かかった 星の橋（c11d_bridge）・月の都への 出入り口（c11_act4）
function attachHill(maps) {
  const ow = maps[C11D_HILL];
  if (!ow) return;
  const B = HILL_POS11D.bridge;
  const old = ow.npcs.find((n) => n.id === 'c10d_bridge');
  if (old) old.show = { ...(old.show || {}), not: [...(old.show?.not || []), C11D.bridge] };
  ow.npcs.push(npc('c11d_bridge', '星の橋', [B.x, B.y], 'c11d_bridge', 'c11d_bridge_look', { solid: false, show: { all: [C11D.bridge] } }));
  warp(ow, B, C11D_FRONT, CITY_POS11D.bridgeBack, 'up', { all: [C11D.act4] });
}
// ながれ星のくぼ地: 光る 8つめの 台（c11_act4）
function attachCrater(maps) {
  const m = maps[C11D_CRATER];
  if (!m) return;
  const old = m.npcs.find((n) => n.id === 'c10d_ped8');
  if (old) old.show = { ...(old.show || {}), not: [...(old.show?.not || []), C11D.act4] };
  m.npcs.push(npc('c11d_ped8', '8つめの音の台', [PED8_11D.x, PED8_11D.y], 'c11d_ped8_on', 'c11d_ped8', { dir: 'down', show: { all: [C11D.act4] } }));
}

export function attachC11d(maps) {
  for (const m of [buildScale(), buildTower1(), buildTower2(0), buildTower2(1), buildTower3(), buildTower4(), buildThrone()]) {
    finishGates11a(m);
    maps[m.id] = m;
  }
  attachDoor(maps);
  attachCity(maps);
  attachHill(maps);
  attachCrater(maps);
}
// 塔の 階（曲の towerStage。塔の 外は 0）
export const towerFloorOf11d = (mapId) => C11D_TOWER_MAPS[mapId] || 0;
export { C11D_MAP };
