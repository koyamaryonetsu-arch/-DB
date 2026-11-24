// 第3部 第3章 第2幕「月の都と、名前のランプ」（第102回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18）
// ・月の都 c11b_front（おもて）・c11b_back（うら）… 同じ 大きさ・同じ 形（maps/c11b-rows.js の もとの 形から 作る）
// ・名前の 塔 c11b_tower1〜3（おもて）・c11b_towerb1〜3（うら）
// ・星の海 c11_sea の 北（星座の門の むこう）: きりは c11b_start で 晴れる・月の都の はとば・北へ 流れる 星の 流れ・門の 前の 場面 0 の マス
//   ※ 幕が 閉じて いる 間は c11b_start が 立たないので、星の海は 今の まま（きりで ふさがって いる）
// ・map.c11b … { pair: くみの 番号（0 町・1〜3 塔）, side: 0 おもて・1 うら, other: もう 片方の マップ, floors, lamps, bridges }
//   （world/c11b-steps.js・client/c11b-view.js が 読む）
import { T } from '../tiles.js?v=71ec2a6ff6b8';
import { npc } from './npc.js?v=71ec2a6ff6b8';
import { parseRows16 } from './past.js?v=71ec2a6ff6b8';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=71ec2a6ff6b8';
import { SHOPS } from '../data/shops.js?v=71ec2a6ff6b8';
import { c11bChest, C11B_FRONT_ARMS, C11B_BACK_TOOLS, C11B_BACK_FINDS } from '../data/items-c11b.js?v=71ec2a6ff6b8';
import { SEA_PLACES } from './ch2.js?v=71ec2a6ff6b8';
import { finishGates11a } from './c11a.js?v=71ec2a6ff6b8';
import {
  C11B, C11B_ACT0, C11B_MAP, C11B_MAP_IDS, C11B_TRACKS, C11B_TABLE, C11B_PLACE, C11B_PAIRS,
} from './c11b-flags.js?v=71ec2a6ff6b8';
import {
  CITY_ROWS11B, CITY_CHESTS11B, CITY_POS11B, CITY_RECT11B, TOWER_ROWS11B, TOWER_CHESTS11B, TOWER_FLOORS11B, TOWER_LAMPS11B, TOWER_BRIDGES11B,
  TOWER_POS11B, TOWER3_SCENES11B, SEA_MOON11B, SEA_MOON_PIER11B, SEA_MOON_OUT11B, SEA_NORTH_CUR11B, SEA_SCENE0_11B,
} from './c11b-rows.js?v=71ec2a6ff6b8';

export const CH11B_MAPS = [...C11B_MAP_IDS];

// ───── 宝箱の 中み（B班の data/items-c11b.js の c11bChest）─────
let chestFn11b = c11bChest;
export const setChestOf11b = (fn) => { chestFn11b = fn; };
export const chestOf11b = (id) => chestFn11b(id) || {};
// ───── 店（おもての 武具屋・道具屋 / うらの 小さな 店〈道具と ほり出し物〉。品の ならびは B班の data/items-c11b.js）─────
export const SHOP11B = { arms: 'c11b_arms', tools: 'c11b_tools', back: 'c11b_back_shop' };
if (!SHOPS[SHOP11B.arms]) SHOPS[SHOP11B.arms] = { name: '月の都の武具屋', kind: 'armor', keeper: '武具屋', hello: 'いらっしゃいませ。\n月の都の、上等な品でございます。', items: [...C11B_FRONT_ARMS] };
if (!SHOPS[SHOP11B.tools]) SHOPS[SHOP11B.tools] = { name: '月の都の道具屋', kind: 'item', keeper: '道具屋', hello: 'いらっしゃいませ。\nお代は、きちんと、いただきます。', items: [...C11B_BACK_TOOLS] };
if (!SHOPS[SHOP11B.back]) SHOPS[SHOP11B.back] = { name: 'うらの町の小さな店', kind: 'item', keeper: 'うらの店主', hello: 'いらっしゃい！\nうらの町の、ほり出し物だよ。', items: [...C11B_BACK_TOOLS, ...C11B_BACK_FINDS] };
export function setShopItems11b(id, items) { if (SHOPS[id]) SHOPS[id].items = [...items]; }

const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const base = (id, name, kind, t, extra) => ({
  id, name, kind, w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, zoneAt: () => 'safe:c11b', ...extra,
});

// ───── もとの 形 → おもて・うらの タイル ─────
// 宝箱の 文字 c は、その 宝箱の 側だけ 道（おもての 宝箱 … b・うらの 宝箱 … f）
const withChests = (rows, chests) => rows.map((r, y) => [...r].map((ch, x) => {
  if (ch !== 'c') return ch;
  const c = chests.find((q) => q.x === x && q.y === y);
  return c?.side === 1 ? 'f' : 'b';
}).join(''));
const CITY_LEGEND = [
  { '#': T.C11B_F_WALL, '.': T.C11B_F_PAVE, f: T.C11B_F_CANAL, b: T.C11B_F_PAVE, D: T.C11B_DOOR, G: T.C11B_SCALEGATE, R: T.C11B_F_WALL, T: T.C11B_TOWERDOOR,
    P: T.C11B_DOCK, H: T.C11B_F_HOUSE, L: T.C11B_LAMPRACK, E: T.C11B_LAMPHOOK, W: T.C11B_FOUNT, n: T.C11B_F_FLOWER },
  { '#': T.C11B_B_WALL, '.': T.C11B_B_PAVE, f: T.C11B_B_PAVE, b: T.C11B_B_RUBBLE, D: T.C11B_DOOR, G: T.C11B_B_WALL, R: T.C11B_B_RUBBLE, T: T.C11B_B_WALL,
    P: T.C11B_B_RUBBLE, H: T.C11B_B_HOUSE, L: T.C11B_B_RUBBLE, E: T.C11B_B_RUBBLE, W: T.C11B_LANTERNWELL, n: T.C11B_B_LANTERN },
];
const TOWER_LEGEND = [
  { '#': T.C11B_T_WALL_F, '.': T.C11B_T_FLOOR_F, f: T.C11B_T_WALL_F, b: T.C11B_T_FLOOR_F, D: T.C11B_DOOR, L: T.C11B_LIGHTFLOOR, P: T.C11B_LAMP_A,
    K: T.C11B_T_WALL_F, U: T.C11B_T_STAIRS_F, u: T.C11B_T_WALL_F, X: T.C11B_TOWERDOOR, S: T.C11B_SHELF, '=': T.C11B_TERRACE, '|': T.C11B_RAIL },
  { '#': T.C11B_T_WALL_B, '.': T.C11B_T_FLOOR_B, f: T.C11B_T_FLOOR_B, b: T.C11B_T_WALL_B, D: T.C11B_DOOR, L: T.C11B_SHUTDOOR, P: T.C11B_T_WALL_B,
    K: T.C11B_CHASM, U: T.C11B_T_WALL_B, u: T.C11B_T_STAIRS_B, X: T.C11B_T_WALL_B, S: T.C11B_T_WALL_B, '=': T.C11B_T_WALL_B, '|': T.C11B_T_WALL_B },
];
// ───── 月の都 ─────
const SIDE_NAMES = ['おもて', 'うら'];
function buildCity(side) {
  const rows = withChests(CITY_ROWS11B, CITY_CHESTS11B);
  const t = parseRows16(rows, CITY_LEGEND[side]);
  const id = side ? C11B_MAP.back : C11B_MAP.front;
  const name = `月の都　${SIDE_NAMES[side]}`;
  const m = base(id, name, 'town', t, {
    bgm: side ? C11B_TRACKS.back : C11B_TRACKS.front,
    bg2d: side ? '#120c14' : '#1a1e3a', sky3d: side ? { bg: '#1a1020', fog: 0x2a1a28 } : { bg: '#2a3060', fog: 0x5a6aa8 },
    c11b: { pair: 0, side, other: side ? C11B_MAP.front : C11B_MAP.back, floors: [], lamps: [], bridges: [] },
    c11bCity: true,
  });
  const P = CITY_POS11B;
  m.areaName = (x, y) => (y <= 25 ? `月の都　${SIDE_NAMES[side]}の${side ? 'うら道' : '細道'}` : name);
  for (const c of CITY_CHESTS11B.filter((q) => q.side === side)) m.chests.push({ id: c.id, x: c.x, y: c.y, ...chestOf11b(c.id) });
  if (side === 0) {
    // はとば（ふむと 星の海へ）・名前の 塔の 入口
    warp(m, P.dock, 'c11_sea', SEA_MOON_OUT11B, 'down');
    warp(m, P.tower, C11B_MAP.tower1, TOWER_POS11B[1].arrive, 'up');
    m.actions.push({ x: P.gate.x, y: P.gate.y, script: 'c11b_scalegate' });
    m.actions.push({ x: P.fount.x, y: P.fount.y, script: 'c11b_fount' });
    m.actions.push({ x: P.hook.x, y: P.hook.y, script: 'c11b_hook' });
    for (let x = 13; x <= 22; x++) if (x !== P.hook.x && x !== 17 && x !== 18) m.actions.push({ x, y: 30, script: 'c11b_lamps' });
    m.npcs.push(npc('c11b_inn', '宿屋', [P.inn.x, P.inn.y], 'c11b_folkF2', 'c11b_inn', { dir: 'down' }));
    m.npcs.push(npc('c11b_arms', '武具屋', [P.arms.x, P.arms.y], 'c11b_folkF1', 'c11b_arms', { dir: 'down' }));
    m.npcs.push(npc('c11b_tools', '道具屋', [P.tools.x, P.tools.y], 'c11b_folkF3', 'c11b_tools', { dir: 'down' }));
    m.npcs.push(npc('c11b_guard', '門番', [P.guard.x, P.guard.y], 'c11b_guard', 'c11b_guard', { dir: 'down' }));
    P.folksF.forEach((f, i) => m.npcs.push(npc(`c11b_folkF${i + 1}`, ['都の人', '都の人', '都の子ども', '都の人'][i], [f.x, f.y], `c11b_folkF${(i % 3) + 1}`, `c11b_folkF${i + 1}`, { dir: 'down', wander: i === 2 ? 2 : 0 })));
    // ホタル（広場を 見た あと・うらに 入る 前）
    m.npcs.push(npc('c11b_hotaru', '星の子ホタル', [P.hotaru.x, P.hotaru.y], 'c11b_hotaru', 'c11b_hotaru', { dir: 'left', show: { all: [C11B.plaza], not: [C11B.back] } }));
    // M1・M2（はとばから 上がった 所）
    const A = P.arrive;
    m.triggers.push({ id: 'c11b_city_event', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c11b_city_event', show: { all: [C11B.start], not: [C11B.plaza] } });
  } else {
    // うら道の 入口（トモシビに きまりを 聞くと がらくたが どく）
    m.gates.push({ x: P.rule.x, y: P.rule.y, closed: T.C11B_B_RUBBLE, open: T.C11B_B_PAVE, flag: C11B.rule });
    m.actions.push({ x: P.rule.x, y: P.rule.y, script: 'c11b_rubble' });
    m.actions.push({ x: P.fount.x, y: P.fount.y, script: 'c11b_well' });
    m.npcs.push(npc('c11b_shopB', 'うらの店主', [P.shopB.x, P.shopB.y], 'c11b_folkB2', 'c11b_back_shop', { dir: 'down' }));
    m.npcs.push(npc('c11b_tomoshibi', 'ランプ守のトモシビ', [P.tomoshibi.x, P.tomoshibi.y], 'c11b_tomoshibi', 'c11b_tomoshibi', { dir: 'down' }));
    P.folksB.forEach((f, i) => m.npcs.push(npc(`c11b_folkB${i + 1}`, ['うらの町の人', 'うらの町の子ども', 'うらの町の人', 'うらの町の人'][i], [f.x, f.y], `c11b_folkB${(i % 3) + 1}`, `c11b_folkB${i + 1}`, { dir: 'down', wander: i === 1 ? 2 : 0 })));
    m.npcs.push(npc('c11b_hotaruB', '星の子ホタル', [P.hotaruB.x, P.hotaruB.y], 'c11b_hotaru', 'c11b_hotaru', { dir: 'down', show: { all: [C11B.back] } }));
    const B = P.backIn;
    m.triggers.push({ id: 'c11b_back_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c11b_back_event', show: { all: [C11B.plaza], not: [C11B.back] } });
    // 魔物: うら道（町の 北）だけ
    m.zoneAt = (x, y) => (y <= 25 && m.tiles[y * m.w + x] === T.C11B_B_PAVE ? tableOr(C11B_TABLE.back, 'safe:wait') : 'safe:c11b');
    if (ENCOUNTER_TABLES[C11B_TABLE.back]) m.spawnCounts = { [C11B_TABLE.back]: 4 };
  }
  return m;
}

// ───── 名前の 塔 ─────
function buildTower(n, side) {
  const chests = TOWER_CHESTS11B[n];
  const rows = withChests(TOWER_ROWS11B[n], chests);
  const t = parseRows16(rows, TOWER_LEGEND[side]);
  const id = side ? C11B_MAP[`towerb${n}`] : C11B_MAP[`tower${n}`];
  const name = `名前の塔　${n}階　${SIDE_NAMES[side]}`;
  const floors = (TOWER_FLOORS11B[n] || []).map((q) => ({ ...q }));
  const lamps = (TOWER_LAMPS11B[n] || []).map((q) => ({ ...q }));
  const bridges = (TOWER_BRIDGES11B[n] || []).map((q) => ({ ...q }));
  const m = base(id, name, 'dungeon', t, {
    bgm: C11B_TRACKS.tower, indoor: false,
    bg2d: side ? '#0c060e' : '#141836', sky3d: side ? { bg: '#120a16', fog: 0x1a0e1e } : { bg: '#1e2450', fog: 0x3a4a88 },
    c11b: { pair: n, side, other: side ? C11B_MAP[`tower${n}`] : C11B_MAP[`towerb${n}`], floors, lamps, bridges },
    c11bTower: n,
  });
  for (const c of chests.filter((q) => q.side === side)) m.chests.push({ id: c.id, x: c.x, y: c.y, ...chestOf11b(c.id) });
  if (side === 0) {
    for (const F of floors) m.gates.push({ x: F.x, y: F.y, closed: T.C11B_LIGHTFLOOR, open: T.C11B_LIGHTFLOOR_ON, flag: F.f });
    for (const L of lamps) {
      const [off, on] = L.c === 'b' ? [T.C11B_LAMP_B, T.C11B_LAMP_B_ON] : [T.C11B_LAMP_A, T.C11B_LAMP_A_ON];
      m.gates.push({ x: L.x, y: L.y, closed: off, open: on, flag: L.f });
    }
  } else {
    for (const F of floors) m.gates.push({ x: F.x, y: F.y, closed: T.C11B_SHUTDOOR, open: T.C11B_OPENDOOR, flag: F.f });
    for (const B of bridges) m.gates.push({ x: B.x, y: B.y, closed: T.C11B_CHASM, open: T.C11B_SHADOWBRIDGE, flag: B.f });
  }
  const P = TOWER_POS11B[n];
  // 階段・出口
  if (n === 1 && side === 0) warp(m, P.exit, C11B_MAP.front, CITY_POS11B.towerBack, 'down');
  if (n === 1 && side === 1) warp(m, P.up, C11B_MAP.towerb2, TOWER_POS11B[2].arrive, 'up');
  if (n === 2 && side === 1) warp(m, P.down, C11B_MAP.towerb1, TOWER_POS11B[1].back, 'down');
  if (n === 2 && side === 0) warp(m, P.up, C11B_MAP.tower3, TOWER_POS11B[3].arrive, 'up');
  if (n === 3 && side === 0) warp(m, P.down, C11B_MAP.tower2, TOWER_POS11B[2].back, 'down');
  m.areaName = () => name;
  if (n === 1 && side === 0) {
    const E = TOWER3_SCENES11B.enter;
    m.triggers.push({ id: 'c11b_tower_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c11b_tower_event', show: { all: [C11B.rule], not: [C11B.tower] } });
  }
  if (n === 3 && side === 0) {
    const S = TOWER3_SCENES11B;
    m.triggers.push({ id: 'c11b_keeper_event', x: S.keeper.x, y: S.keeper.y, w: S.keeper.w, h: S.keeper.h, script: 'c11b_keeper_event', show: { all: [C11B.tower], not: [C11B.keeper] } });
    m.triggers.push({ id: 'c11b_shelf_event', x: S.shelf.x, y: S.shelf.y, w: S.shelf.w, h: S.shelf.h, script: 'c11b_shelf_event', show: { all: [C11B.keeper], not: [C11B.lamp] } });
    m.triggers.push({ id: 'c11b_oboro_event', x: S.terrace.x, y: S.terrace.y, w: S.terrace.w, h: S.terrace.h, script: 'c11b_oboro_event', show: { all: [C11B.lamp], not: [C11B.oboro] } });
    for (let x = 5; x <= 18; x++) if (x !== 11 && x !== 12) m.actions.push({ x, y: 4, script: 'c11b_shelf' });
  }
  // 魔物: おもてと うらで 表を かえる（光の ゆか・ランプ・戸・階段の まわり・3階の 上の 広間より 上は 出ない）
  const table = side ? C11B_TABLE.towerBack : C11B_TABLE.towerFront;
  const floorT = side ? T.C11B_T_FLOOR_B : T.C11B_T_FLOOR_F;
  const quiet = [...floors, ...lamps, ...m.warps, P.arrive || { x: -9, y: -9 }];
  m.zoneAt = (x, y) => {
    if (m.tiles[y * m.w + x] !== floorT || (n === 3 && y <= 10) || quiet.some((q) => Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1)) return 'safe:c11b_tower';
    return tableOr(table, 'safe:wait');
  };
  if (ENCOUNTER_TABLES[table]) m.spawnCounts = { [table]: 3 };
  return m;
}

// ───── 星の海の 北（c11_sea に 足す。きりは c11b_start で 晴れる）─────
function attachSea(maps) {
  const m = maps.c11_sea;
  if (!m) return;
  const at = (x, y) => y * m.w + x;
  // 三日月の 岩（月の都）
  const M = SEA_MOON11B;
  const cx = (M.x0 + M.x1 + 1) / 2;
  for (let y = M.y0; y <= M.y1; y++) for (let x = M.x0; x <= M.x1; x++) {
    const o = ((x + 0.5 - cx) / 7) ** 2 + ((y + 0.5 - 5) / 5) ** 2 <= 1;
    const i = ((x + 0.5 - cx) / 6) ** 2 + ((y + 0.5 - 3.4) / 4.4) ** 2 <= 1;
    if (o && !i) m.tiles[at(x, y)] = T.C11B_MOONROCK;
  }
  m.tiles[at(SEA_MOON_PIER11B.x, SEA_MOON_PIER11B.y)] = T.C11A_PIER;
  for (const [x, y] of [[SEA_MOON_PIER11B.x, SEA_MOON_PIER11B.y - 1], [SEA_MOON_PIER11B.x - 1, SEA_MOON_PIER11B.y - 1], [SEA_MOON_PIER11B.x + 1, SEA_MOON_PIER11B.y - 1]]) m.tiles[at(x, y)] = T.C11B_MOONROCK;
  // 北の 海の 西と 東は 雲（せまく して 都が 見つけやすい 形）
  for (let y = 2; y <= 34; y++) for (let x = 3; x <= 60; x++) if (x < 14 || x > 49) m.tiles[at(x, y)] = T.C11A_CLOUD;
  for (const [x, y] of [[20, 20], [21, 20], [44, 26], [45, 26], [18, 12], [46, 9], [24, 30]]) m.tiles[at(x, y)] = T.C11A_SHOAL;
  // 北へ 流れる 星の 流れ（門の すぐ 北から 都の 前の しずかな 海まで）
  const C = SEA_NORTH_CUR11B;
  for (let y = C.y1; y <= C.y0; y++) m.tiles[at(C.x, y)] = T.C11A_CUR_N;
  // 星の きり（門の むこう）: c11b_start で 晴れる
  for (let y = 33; y <= 36; y++) for (let x = 0; x < m.w; x++) {
    if (m.tiles[at(x, y)] !== T.C11A_MIST) continue;
    m.gates.push({ x, y, closed: T.C11A_MIST, open: T.C11A_SEA, flag: C11B.start });
  }
  finishGates11a(m);
  // はとば（ふむと 月の都へ）
  warp(m, SEA_MOON_PIER11B, C11B_MAP.front, CITY_POS11B.harbor, 'up');
  // 場面 0（門の 前。第1幕 クリアの あと・幕が 開いて いる 時だけ 動く）
  const S = SEA_SCENE0_11B;
  m.triggers.push({ id: 'c11b_start_event', x: S.x, y: S.y, w: S.w, h: S.h, script: 'c11b_start_event', show: { all: [C11B_ACT0], not: [C11B.start] } });
  const area0 = m.areaName;
  m.areaName = (x, y) => (y < 30 ? '星の海　月の都の前' : area0(x, y));
}

export function attachC11b(maps) {
  for (const m of [buildCity(0), buildCity(1), ...[1, 2, 3].flatMap((n) => [buildTower(n, 0), buildTower(n, 1)])]) {
    finishGates11a(m);
    maps[m.id] = m;
  }
  attachSea(maps);
  // ルーラ（行った 所）: 月の都（おもての 町に 着くと おぼえる）
  const H = CITY_POS11B.harbor;
  SEA_PLACES[C11B_PLACE] = { name: '月の都', map: C11B_MAP.front, x: H.x, y: H.y - 1, rect: CITY_RECT11B };
}
export { C11B_MAP, C11B_PAIRS };
