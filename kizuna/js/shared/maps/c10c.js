// 第3部 第2章 第3幕「紫と、うばわれた音」（第97回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15）
// ・空 … 空の 小島 c10c_isles1・c10c_isles2（音の 橋。world/c10c-steps.js）・うかぶ いせき c10c_isles3（中ボス）
// ・とりで … ベルトの 工場 c10c_fort1・c10c_fort2（流れる ベルトと レバー）・少年の 間 c10c_fort3（幕の ボス）
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   クモイ地方（kumoi）の 影の城の 北東の 空 … 光の うず（c10c_start）/ 大地の下（c9b_under）の 東の はし … うら口（c10c_trio）/
//   ながれ星のくぼ地 … 場面 0 の マス（c10_act2 から。幕が 開いて いる 時だけ 動く）・紫の 音の 台
// ・音の 橋は とびらの しるし '@br<すき間の 番号>:<色>'（world.js の hasFlagFn・client/field.js の hasFlag。パーティーで 同じ・セーブしない）
// ・ベルトの 向きは レバーの フラグ（c10c_lv_red・c10c_lv_blue。リーダーの フラグ ＝ パーティーで 同じ・セーブする）
// ・「行った 所」の 記録は 6まいとも 取らない（map.noExplore）
import { T } from '../tiles.js?v=47b761b2972a';
import { npc } from './npc.js?v=47b761b2972a';
import { parseRows16 } from './past.js?v=47b761b2972a';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=47b761b2972a';
import {
  ISLES1_ROWS, ISLES1_POS, ISLES1_SPANS, ISLES2_ROWS, ISLES2_POS, ISLES2_SPANS, ISLES3_ROWS, ISLES3_POS,
  FORT1_ROWS, FORT1_POS, FORT2_ROWS, FORT2_POS, FORT3_ROWS, FORT3_POS, cells10c,
  KUMOI_VORTEX10C, KUMOI_LAND10C, UNDER_BACKDOOR10C, UNDER_LAND10C, PED_SI10C,
} from './c10c-rows.js?v=47b761b2972a';
import {
  C10C, C10C_ACT2, C10C_LEVER, C10C_PED, C10C_MAP, C10C_MAP_IDS, C10C_TABLE, C10C_CHEST_IDS, C10C_TRACKS, C10C_BRIDGE_COLORS,
  C10C_COLONEL_NAME, C10C_ALGOL_NAME,
} from './c10c-flags.js?v=47b761b2972a';
import { PEDESTALS9C } from './c9c.js?v=47b761b2972a';
import { CRATER_FORK10A } from './c10a-rows.js?v=47b761b2972a';
import { ALGOL } from './c9c-flags.js?v=47b761b2972a';
import { c10cChest } from '../data/items-c10c.js?v=47b761b2972a';

export const CH10C_MAPS = [...C10C_MAP_IDS];

// 宝箱の 中み（B班の data/items-c10c.js の c10cChest。12この id）
export const chestOf10c = (id) => c10cChest(id) || {};

const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, ...extra,
});
export const finishGates10c = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };
const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const near = (list, x, y, r) => list.some((q) => Math.abs(q.x - x) <= r && Math.abs(q.y - y) <= r);

// ───── 音の 橋 ─────
// 橋の とびらの しるし（その 階に いる パーティーの 橋。world/c10c-steps.js）: すき間 i に 色 c の 橋が かかって いる
export const BRIDGE_FLAG = (i, c) => `@br${i}:${c}`;
const BRIDGE_TILE = { red: T.C10C_BRIDGE_R, yellow: T.C10C_BRIDGE_Y, green: T.C10C_BRIDGE_G, blue: T.C10C_BRIDGE_B, white: T.C10C_BRIDGE_W };
export const bridgeTile10c = (c) => BRIDGE_TILE[c];
// すき間の マス（横 か たて の 1列）
export const spanCells10c = (sp) => {
  const out = [];
  for (let y = sp.y0; y <= sp.y1; y++) for (let x = sp.x0; x <= sp.x1; x++) out.push({ x, y });
  return out;
};
// すき間の 両はしの 橋の 石（maps/c10c-rows.js と 同じ 置き方）
export const spanStones10c = (sp) => (sp.y0 === sp.y1
  ? [{ x: sp.x0 - 1, y: sp.y0 - 1 }, { x: sp.x1 + 1, y: sp.y0 - 1 }]
  : [{ x: sp.x0 + 1, y: sp.y0 - 1 }, { x: sp.x0 + 1, y: sp.y1 + 1 }]);
// 橋の 石の 台本の id（石ごと。data/story-c10c.js が 同じ 名前で 作る）
export const stoneScript10c = (mapId, i) => `c10c_stone_${mapId}_${i}`;

const SKY_LEGEND = {
  '~': T.CLOUD_SEA, '.': T.C10C_ISLE, o: T.C10C_STONE, c: T.C10C_ISLE, U: T.STAIRS_UP, D: T.STAIRS_DOWN, v: T.C10C_VORTEX,
  n: T.SKYWIND_N, s: T.SKYWIND_S, r: T.C10C_RUIN, R: T.C10C_RUINWALL, f: T.C10C_FLOAT, O: T.C10C_ORB,
};
function skyMap(id, name, rows, spans, extra = {}) {
  const t = parseRows16(rows, SKY_LEGEND);
  const m = base(id, name, t, { bgm: C10C_TRACKS.isles, bg2d: '#8ab8e8', sky3d: { bg: '#9cc4ee', fog: 0xc8dcf4 }, c10cSky: true, dark: false, ...extra });
  if (spans) {
    m.c10cSpans = spans.map((sp, i) => ({ ...sp, i, cells: spanCells10c(sp), stones: spanStones10c(sp) }));
    // すき間の マス: 5色の どれかの 橋が かかって いる 時だけ 歩ける（ほかは 雲の 海）
    for (const sp of m.c10cSpans) for (const p of sp.cells) {
      m.gates.push({ x: p.x, y: p.y, closed: T.CLOUD_SEA, open: T.CLOUD_SEA, levels: C10C_BRIDGE_COLORS.map((c) => [BRIDGE_FLAG(sp.i, c), BRIDGE_TILE[c]]) });
    }
    // 橋の 石（石ごとに すき間が 1つ）
    m.c10cStones = [];
    for (const sp of m.c10cSpans) for (const s of sp.stones) {
      const k = m.c10cStones.length;
      m.c10cStones.push({ x: s.x, y: s.y, span: sp.i, k });
      m.actions.push({ x: s.x, y: s.y, script: stoneScript10c(id, k) });
    }
  }
  // 光の うず（クモイ地方へ もどる）
  for (const v of cells10c(rows, 'v')) m.actions.push({ x: v.x, y: v.y, script: 'c10c_vortex_back' });
  // 魔物: 小島の 上（入口・石の まわりは 出ない。橋・風の 道の 上も 出ない）
  const quiet = [...cells10c(rows, 'v'), ...cells10c(rows, 'U'), ...cells10c(rows, 'D'), ...(m.c10cStones || [])];
  const ground = new Set([T.C10C_ISLE, T.C10C_RUIN]);
  m.zoneAt = (x, y) => {
    const t0 = m.tiles[y * m.w + x];
    if (!ground.has(t0) || m.gateAt?.has(y * m.w + x) || near(quiet, x, y, 2)) return 'safe:sky';
    return tableOr(C10C_TABLE.isles, 'safe:wait');
  };
  if (ENCOUNTER_TABLES[C10C_TABLE.isles]) m.spawnCounts = { [C10C_TABLE.isles]: 6 };
  return m;
}
function chestsFrom(m, rows, ids) {
  cells10c(rows, 'c').forEach((p, i) => { const id = ids[i]; if (id) m.chests.push({ id, x: p.x, y: p.y, ...chestOf10c(id) }); });
}

function buildIsles1() {
  const P = ISLES1_POS;
  const m = skyMap(C10C_MAP.isles1, '空の小島', ISLES1_ROWS, ISLES1_SPANS);
  chestsFrom(m, ISLES1_ROWS, C10C_CHEST_IDS.isles.slice(0, 2));
  // 立てふだ（橋の 石の きまり）
  m.npcs.push(npc('c10c_sign1', '立てふだ', [P.sign.x, P.sign.y], 'c9a_signpost', 'c10c_sign1', { dir: 'down' }));
  warp(m, P.up, C10C_MAP.isles2, ISLES2_POS.entry, 'up');
  m.areaName = (x, y) => (y <= 7 ? '空の小島　北のはし' : '空の小島');
  return m;
}
function buildIsles2() {
  const P = ISLES2_POS;
  const m = skyMap(C10C_MAP.isles2, '空の小島　風の島々', ISLES2_ROWS, ISLES2_SPANS);
  chestsFrom(m, ISLES2_ROWS, C10C_CHEST_IDS.isles.slice(2, 5));
  warp(m, P.down, C10C_MAP.isles1, { x: ISLES1_POS.up.x, y: ISLES1_POS.up.y + 1 }, 'down');
  warp(m, P.up, C10C_MAP.isles3, ISLES3_POS.entry, 'up');
  const A = P.arrive;
  m.triggers.push({ id: 'c10c_isles2_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10c_isles2_in', show: { not: [C10C.isles2] } });
  m.areaName = (x, y) => (y <= 7 && x <= 20 ? '空の小島　風の島' : '空の小島　風の島々');
  return m;
}
function buildIsles3() {
  const P = ISLES3_POS;
  const m = skyMap(C10C_MAP.isles3, 'うかぶいせき', ISLES3_ROWS, null, { bg2d: '#9ab0e0', sky3d: { bg: '#a8b8e8', fog: 0xd0d8f4 } });
  chestsFrom(m, ISLES3_ROWS, C10C_CHEST_IDS.isles.slice(5, 6));
  warp(m, P.down, C10C_MAP.isles2, { x: ISLES2_POS.up.x, y: ISLES2_POS.up.y + 1 }, 'down');
  // 紫の 光の 玉（音が うばわれた あとは 光らない。とちゅうで とぎれた 時の 場面の やり直しも ここ）
  m.gates.push({ x: P.orb.x, y: P.orb.y, closed: T.C10C_ORB, open: T.C10C_RUINWALL, flag: C10C.stolen });
  m.actions.push({ x: P.orb.x, y: P.orb.y, script: 'c10c_orb' });
  const B = P.bossScene;
  m.triggers.push({ id: 'c10c_colonel_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10c_colonel_event', show: { not: [C10C.colonel] } });
  m.npcs.push(npc('c10c_colonel', C10C_COLONEL_NAME, [P.boss.x, P.boss.y], 'c10c_colonel', 'c10c_colonel_event', { dir: 'down', show: { not: [C10C.colonel] } }));
  m.zoneAt = () => 'safe:ruin';
  m.spawnCounts = {};
  return m;
}

// ───── とりで: ベルトと レバー ─────
// ベルト（レバーを 引く 前の 向き → 引いた あとの 向き）
const BELT = {
  n: [T.C10C_BELT_RN, T.C10C_BELT_RS, 'red'], e: [T.C10C_BELT_RE, T.C10C_BELT_RW, 'red'], s: [T.C10C_BELT_RS, T.C10C_BELT_RN, 'red'], w: [T.C10C_BELT_RW, T.C10C_BELT_RE, 'red'],
  N: [T.C10C_BELT_BN, T.C10C_BELT_BS, 'blue'], E: [T.C10C_BELT_BE, T.C10C_BELT_BW, 'blue'], S: [T.C10C_BELT_BS, T.C10C_BELT_BN, 'blue'], W: [T.C10C_BELT_BW, T.C10C_BELT_BE, 'blue'],
};
const LV = { red: C10C_LEVER.red, blue: C10C_LEVER.blue };
const FORT_LEGEND = {
  '#': T.C10C_FWALL, '.': T.C10C_FFLOOR, k: T.C10C_CRATES, c: T.C10C_FFLOOR, U: T.STAIRS_UP, D: T.STAIRS_DOWN, X: T.C10C_FFLOOR,
  J: T.C10C_JARS, h: T.C10C_HALL, O: T.C10C_ORB, r: T.C10C_LEVER_R, b: T.C10C_LEVER_B, p: T.C10C_FFLOOR, P: T.C10C_FFLOOR,
  ...Object.fromEntries(Object.entries(BELT).map(([ch, [t]]) => [ch, t])),
};
function fortMap(id, name, rows, extra = {}) {
  const t = parseRows16(rows, FORT_LEGEND);
  const m = base(id, name, t, { bgm: C10C_TRACKS.fort, bg2d: '#120e1a', sky3d: { bg: '#141020', fog: 0x241c34 }, c10cFort: true, dark: false, ...extra });
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const b = BELT[ch];
    if (b) m.gates.push({ x, y, closed: b[0], open: b[1], levels: [[LV[b[2]], b[1]]] });
    if (ch === 'r') { m.gates.push({ x, y, closed: T.C10C_LEVER_R, open: T.C10C_LEVER_R_ON, flag: LV.red }); m.actions.push({ x, y, script: 'c10c_lever_red' }); }
    if (ch === 'b') { m.gates.push({ x, y, closed: T.C10C_LEVER_B, open: T.C10C_LEVER_B_ON, flag: LV.blue }); m.actions.push({ x, y, script: 'c10c_lever_blue' }); }
    // おし出される 箱（その 色の レバーを 引いた 時だけ 出る）
    if (ch === 'p') m.gates.push({ x, y, closed: T.C10C_FFLOOR, open: T.C10C_PUSHER, flag: LV.red });
    if (ch === 'P') m.gates.push({ x, y, closed: T.C10C_FFLOOR, open: T.C10C_PUSHER, flag: LV.blue });
  }));
  // 魔物: ベルト・箱の 上・レバーと 階段の まわりは 出ない
  const quiet = [...cells10c(rows, 'r'), ...cells10c(rows, 'b'), ...cells10c(rows, 'U'), ...cells10c(rows, 'D'), ...cells10c(rows, 'X')];
  m.zoneAt = (x, y) => {
    const ch = rows[y]?.[x];
    if (ch !== '.' || near(quiet, x, y, 2)) return 'safe:fort';
    return tableOr(C10C_TABLE.fort, 'safe:wait');
  };
  if (ENCOUNTER_TABLES[C10C_TABLE.fort]) m.spawnCounts = { [C10C_TABLE.fort]: 5 };
  return m;
}
const HINT_SPRITE = { kirajo: 'c9a_kirajo', boyacchi: 'c9a_boyacchi', zurakka: 'c9a_zurakka' };
const HINT_NAME = { kirajo: 'キラジョ', boyacchi: 'ボヤッチ', zurakka: 'ズラッカ' };
const hintNpc = (id, who, p) => npc(id, HINT_NAME[who], [p.x, p.y], HINT_SPRITE[who], id, { dir: 'down', show: { not: [C10C.algol] } });

function buildFort1() {
  const P = FORT1_POS;
  const m = fortMap(C10C_MAP.fort1, '少年のとりで', FORT1_ROWS);
  chestsFrom(m, FORT1_ROWS, C10C_CHEST_IDS.fort.slice(0, 2));
  warp(m, P.exit, UNDER_BACKDOOR10C.map, UNDER_LAND10C, 'left');
  warp(m, P.down, C10C_MAP.fort2, FORT2_POS.entry, 'down');
  const A = P.arrive;
  m.triggers.push({ id: 'c10c_fort_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10c_fort_in', show: { not: [C10C.fortIn] } });
  m.npcs.push(hintNpc('c10c_hint_f1a', 'kirajo', P.hint1), hintNpc('c10c_hint_f1b', 'boyacchi', P.hint2));
  m.areaName = (x, y) => (y >= 19 ? '少年のとりで　うら口' : y <= 3 ? '少年のとりで　上の部屋' : '少年のとりで　ベルトの工場');
  return m;
}
function buildFort2() {
  const P = FORT2_POS;
  const m = fortMap(C10C_MAP.fort2, '少年のとりで　おく', FORT2_ROWS);
  chestsFrom(m, FORT2_ROWS, C10C_CHEST_IDS.fort.slice(2, 5));
  warp(m, P.up, C10C_MAP.fort1, { x: FORT1_POS.down.x, y: FORT1_POS.down.y + 1 }, 'down');
  warp(m, P.down, C10C_MAP.fort3, FORT3_POS.entry, 'up');
  const A = P.arrive;
  m.triggers.push({ id: 'c10c_fort2_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10c_fort2_in', show: { not: [C10C.fort2] } });
  m.npcs.push(hintNpc('c10c_hint_f2a', 'boyacchi', P.hint1), hintNpc('c10c_hint_f2b', 'zurakka', P.hint2),
    hintNpc('c10c_hint_f2c', 'zurakka', P.hint3), hintNpc('c10c_hint_f2d', 'kirajo', P.hint4));
  return m;
}
function buildFort3() {
  const P = FORT3_POS;
  const t = parseRows16(FORT3_ROWS, FORT_LEGEND);
  const m = base(C10C_MAP.fort3, '少年の間', t, { bgm: C10C_TRACKS.fort, bg2d: '#0e0a18', sky3d: { bg: '#100c1c', fog: 0x1e1830 }, c10cHall: true, dark: false });
  chestsFrom(m, FORT3_ROWS, C10C_CHEST_IDS.fort.slice(5, 6));
  warp(m, P.up, C10C_MAP.fort2, { x: FORT2_POS.down.x, y: FORT2_POS.down.y + 1 }, 'down');
  // 紫の 光の 玉（紫の 音を 取った あとは 光らない）
  m.gates.push({ x: P.orb.x, y: P.orb.y, closed: T.C10C_ORB, open: T.C10C_HALL, flag: C10C.note });
  m.actions.push({ x: P.orb.x, y: P.orb.y, script: 'c10c_vorb', show: { not: [C10C.note] } });
  const B = P.bossScene;
  m.triggers.push({ id: 'c10c_algol_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10c_algol_event', show: { not: [C10C.algol] } });
  m.npcs.push(npc('c10c_algol', C10C_ALGOL_NAME, [P.boss.x, P.boss.y], ALGOL, 'c10c_algol_event', { dir: 'down', show: { not: [C10C.algol] } }));
  // 光の 出口（紫の 音の あと。大地の下の うら口の 前へ）
  const Q = P.portal;
  m.gates.push({ x: Q.x, y: Q.y, closed: T.C10C_HALL, open: T.C10C_PORTAL, flag: C10C.note });
  m.warps.push({ x: Q.x, y: Q.y, to: { map: UNDER_BACKDOOR10C.map, x: UNDER_LAND10C.x + 0.5, y: UNDER_LAND10C.y + 0.5, dir: 'left' }, show: { all: [C10C.note] } });
  m.links.push({ x: Q.x, y: Q.y, to: UNDER_BACKDOOR10C.map });
  m.zoneAt = () => 'safe:hall';
  return m;
}

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// クモイ地方: 影の城の 北東の 空の 光の うず（c10c_start から。しらべると 竜が 空の 小島へ 乗せて くれる）
function attachKumoi(maps) {
  const m = maps[KUMOI_VORTEX10C.map];
  if (!m) return;
  const V = KUMOI_VORTEX10C;
  const t0 = m.tiles[V.y * m.w + V.x];
  m.gates.push({ x: V.x, y: V.y, closed: t0, open: T.C10C_VORTEX, flag: C10C.start });
  m.actions.push({ x: V.x, y: V.y, script: 'c10c_vortex', show: { all: [C10C.start] } });
  (m.links = m.links || []).push({ x: V.x, y: V.y, to: C10C_MAP.isles1 });
  finishGates10c(m);
}
// 大地の下: 東の はしの うら口（c10c_trio から）
function attachUnder(maps) {
  const m = maps[UNDER_BACKDOOR10C.map];
  if (!m) return;
  const B = UNDER_BACKDOOR10C;
  const t0 = m.tiles[B.y * m.w + B.x];
  m.gates.push({ x: B.x, y: B.y, closed: t0, open: T.C10C_BACKDOOR, flag: C10C.trio });
  const E = FORT1_POS.entry;
  m.warps.push({ x: B.x, y: B.y, to: { map: C10C_MAP.fort1, x: E.x + 0.5, y: E.y + 0.5, dir: 'up' }, show: { all: [C10C.trio] } });
  (m.links = m.links || []).push({ x: B.x, y: B.y, to: C10C_MAP.fort1 });
  finishGates10c(m);
}
// ながれ星のくぼ地: 場面 0（音さを 鳴らす）・紫の 音の 台（置くと 光る）・3人組の 場面の やり直し
function attachCrater(maps) {
  const m = maps.c9a_crater;
  const E = CRATER_FORK10A;
  m.triggers.push({ id: 'c10c_fork_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10c_fork_event', show: { all: [C10C_ACT2], not: [C10C.start] } });
  m.triggers.push({ id: 'c10c_trio_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10c_trio_event', show: { all: [C10C.stolen], not: [C10C.trio] } });
  const i = PED_SI10C;
  const old = m.npcs.find((n) => n.id === `c9c_ped${i + 1}`);
  const P = PEDESTALS9C[i];
  if (old) {
    old.show = { ...(old.show || {}), not: [...(old.show?.not || []), C10C_PED.si, C10C.act3] };
    old.script = 'c10_ped_si';
  }
  m.npcs.push(npc('c10_ped_si_on', 'むらさきの音の台', [P.x, P.y], `c10c_ped${i}_on`, 'c10_ped_si', { dir: 'down', show: { all: [C10C_PED.si] } }));
  m.npcs.push(npc('c10_ped_si_on2', 'むらさきの音の台', [P.x, P.y], `c10c_ped${i}_on`, 'c10_ped_si', { dir: 'down', show: { all: [C10C.act3] } }));
}

export function attachC10c(maps) {
  for (const m of [buildIsles1(), buildIsles2(), buildIsles3(), buildFort1(), buildFort2(), buildFort3()]) {
    finishGates10c(m);
    maps[m.id] = m;
  }
  attachKumoi(maps);
  attachUnder(maps);
  attachCrater(maps);
}
export { C10C_MAP, C10C_PED };
