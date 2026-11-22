// 第3部 第2章 第4幕「金の音と、星の橋」（第99回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）
// ・星の 階段 c10d_stair1〜3（のぼる 連戦。門 4つ・星の いずみ 4つ。world/c10d-steps.js）・いただき c10d_summit（幕の ボス）
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   星の塔 1階 … 2つの 像の 間の 金色の ゆか（c10d_start）/ てっぺん … 金色の ゆか（c10d_start）・空へ のびる 光の 階段（c10d_top）/
//   星見の丘（overworld）… 星の橋の 場面の マス（c10_note_do から）・とちゅうで 止まった 星の橋の 絵（c10d_bridge）/
//   ながれ星のくぼ地 … 場面 0 の マス（c10_act3 から。幕が 開いて いる 時だけ 動く）・金の 台・8つめの 台（c10_act4）
// ・魔物は 出ない（門の 番人と ボスだけ）。「行った 所」の 記録は 4まいとも 取らない（map.noExplore）
import { T } from '../tiles.js?v=10ad7ced5cfe';
import { npc } from './npc.js?v=10ad7ced5cfe';
import { parseRows16 } from './past.js?v=10ad7ced5cfe';
import {
  STAIR1_ROWS, STAIR1_POS, STAIR2_ROWS, STAIR2_POS, STAIR3_ROWS, STAIR3_POS, SUMMIT_ROWS, SUMMIT_POS, cells10d,
  TOWER1_GOLD10D, TOWER1_BACK10D, TOP_GOLD10D, TOP_ARRIVE10D, TOP_SKYSTAIR10D, TOP_BACK10D, TOP_SCENE10D,
  HILL_SCENE10D, HILL_BRIDGE10D, PED_DO10D, PED8_10D,
} from './c10d-rows.js?v=10ad7ced5cfe';
import {
  C10D, C10D_ACT3, C10D_GATES, C10D_WELLS, C10D_PED, C10D_MAP, C10D_MAP_IDS, C10D_CHEST_IDS, C10D_TRACKS,
} from './c10d-flags.js?v=10ad7ced5cfe';
import { PEDESTALS9C } from './c9c.js?v=10ad7ced5cfe';
import { CRATER_FORK10A } from './c10a-rows.js?v=10ad7ced5cfe';
import { ALGOL, ALGOL_NAME } from './c9c-flags.js?v=10ad7ced5cfe';
import { towerMapId } from './tower.js?v=10ad7ced5cfe';
import { c10dChest } from '../data/items-c10d.js?v=10ad7ced5cfe';

export const CH10D_MAPS = [...C10D_MAP_IDS];
export const TOWER_TOP10D = towerMapId(9);
export const TOWER_1F10D = towerMapId(1);

// 宝箱の 中み（B班の data/items-c10d.js の c10dChest。6この id）
export const chestOf10d = (id) => c10dChest(id) || {};

const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, zoneAt: () => 'safe:c10d', ...extra,
});
export const finishGates10d = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };
const warp = (m, from, map, to, dir) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir } });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};

// 門の 台本の id・いずみの 台本の id
export const gateScript10d = (g) => `c10d_gate${g}_event`;
export const wellScript10d = (i) => `c10d_well${i}`;

const LEGEND = {
  '~': T.CLOUD_SEA, '=': T.C10D_STEP, '.': T.C10D_LANDING, G: T.C10D_GATE, W: T.C10D_WELL, c: T.C10D_LANDING,
  U: T.STAIRS_UP, D: T.STAIRS_DOWN, s: T.C10D_SUMMIT, O: T.C10D_ORB, '*': T.C10D_STARROCK,
};
const SKY = { bg2d: '#0c1030', sky3d: { bg: '#141a44', fog: 0x2a3060 }, dark: false };

// 星の 階段 1まい（門・いずみ・宝箱）
//   wellNo … この マップの いずみの 番号（1〜4）/ chestIds … 上から じゅんに
function stairMap(id, name, rows, P, wellNo, chestIds) {
  const t = parseRows16(rows, LEGEND);
  const m = base(id, name, t, { bgm: C10D_TRACKS.stairs, ...SKY, c10dSky: true });
  // 門（番人に 勝つと 開く。開いた まま）・門の 前の マス（番人との 戦い）・番人の 絵（門の まん中）
  for (const G of P.gates) {
    const flag = C10D_GATES[G.g - 1];
    for (let x = G.x; x < G.x + G.w; x++) {
      m.gates.push({ x, y: G.y, closed: T.C10D_GATE, open: T.C10D_GATE_OPEN, flag });
      m.actions.push({ x, y: G.y, script: gateScript10d(G.g), show: { not: [flag] } });
    }
    const F = G.front;
    m.triggers.push({ id: gateScript10d(G.g), x: F.x, y: F.y, w: F.w, h: F.h, script: gateScript10d(G.g), show: { not: [flag] } });
    const sprite = G.g === 4 ? 'c10d_guard_s' : 'c10d_guard';
    m.npcs.push(npc(`c10d_guard${G.g}`, '門の番人', [G.x + Math.floor(G.w / 2), G.y], sprite, gateScript10d(G.g), { dir: 'down', show: { not: [flag] } }));
  }
  // 星の いずみ（えらぶと しずかに なる。3回 負けると もう 一度 わく … world/c10d-steps.js が しるしを 消す）
  P.wells.forEach((w, k) => {
    const i = wellNo + k;
    m.gates.push({ x: w.x, y: w.y, closed: T.C10D_WELL, open: T.C10D_WELL_DRY, flag: C10D_WELLS[i - 1] });
    m.actions.push({ x: w.x, y: w.y, script: wellScript10d(i) });
  });
  cells10d(rows, 'c').forEach((p, i) => { const cid = chestIds[i]; if (cid) m.chests.push({ id: cid, x: p.x, y: p.y, ...chestOf10d(cid) }); });
  return m;
}

function buildStair1() {
  const P = STAIR1_POS;
  const m = stairMap(C10D_MAP.stair1, '星の階段', STAIR1_ROWS, P, 1, C10D_CHEST_IDS.slice(0, 1));
  warp(m, P.up, C10D_MAP.stair2, STAIR2_POS.entry, 'up');
  warp(m, P.down, TOWER_TOP10D, TOP_BACK10D, 'down');
  m.areaName = (x, y) => (y >= 28 ? '星の階段　はじめのおどり場' : '星の階段');
  return m;
}
function buildStair2() {
  const P = STAIR2_POS;
  const m = stairMap(C10D_MAP.stair2, '星の階段　なかほど', STAIR2_ROWS, P, 2, C10D_CHEST_IDS.slice(1, 3).reverse());
  warp(m, P.up, C10D_MAP.stair3, STAIR3_POS.entry, 'up');
  warp(m, P.down, C10D_MAP.stair1, STAIR1_POS.fromUp, 'down');
  return m;
}
function buildStair3() {
  const P = STAIR3_POS;
  const m = stairMap(C10D_MAP.stair3, '星の階段　上のほう', STAIR3_ROWS, P, 4, C10D_CHEST_IDS.slice(3, 4));
  warp(m, P.up, C10D_MAP.summit, SUMMIT_POS.entry, 'up');
  warp(m, P.down, C10D_MAP.stair2, STAIR2_POS.fromUp, 'down');
  return m;
}
function buildSummit() {
  const P = SUMMIT_POS;
  const t = parseRows16(SUMMIT_ROWS, LEGEND);
  const m = base(C10D_MAP.summit, '星の階段のいただき', t, { bgm: C10D_TRACKS.stairs, ...SKY, bg2d: '#0a0c28', c10dSky: true, c10dSummit: true });
  cells10d(SUMMIT_ROWS, 'c').forEach((p, i) => { const cid = C10D_CHEST_IDS[4 + i]; if (cid) m.chests.push({ id: cid, x: p.x, y: p.y, ...chestOf10d(cid) }); });
  warp(m, P.down, C10D_MAP.stair3, STAIR3_POS.fromUp, 'down');
  // 金色の 光の 玉（金の 音を 取った あとは 光らない。とちゅうで とぎれた 時の 場面の やり直しも ここ）
  m.gates.push({ x: P.orb.x, y: P.orb.y, closed: T.C10D_ORB, open: T.C10D_STARROCK, flag: C10D.note });
  m.actions.push({ x: P.orb.x, y: P.orb.y, script: 'c10d_orb' });
  // 少年（ひとり）・幕の ボスの 場面
  const B = P.bossScene;
  m.triggers.push({ id: 'c10d_mirror_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10d_mirror_event', show: { not: [C10D.mirror] } });
  m.npcs.push(npc('c10d_boy', ALGOL_NAME, [P.boy.x, P.boy.y], ALGOL, 'c10d_mirror_event', { dir: 'up', show: { not: [C10D.mirror] } }));
  // 光の 出口（金の 音の あと。星の塔の てっぺんへ）
  const Q = P.portal;
  m.gates.push({ x: Q.x, y: Q.y, closed: T.C10D_SUMMIT, open: T.C10D_PORTAL, flag: C10D.note });
  m.warps.push({ x: Q.x, y: Q.y, to: { map: TOWER_TOP10D, x: TOP_ARRIVE10D.x + 0.5, y: TOP_ARRIVE10D.y + 0.5, dir: 'down' }, show: { all: [C10D.note] } });
  m.links.push({ x: Q.x, y: Q.y, to: TOWER_TOP10D });
  return m;
}

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// 星の塔: 1階の 金色の ゆか（てっぺんへ）・てっぺんの 金色の ゆか（1階へ）・空へ のびる 光の 階段（星の 階段へ）・音さを 鳴らす 場面
function attachTower(maps) {
  const f1 = maps[TOWER_1F10D], top = maps[TOWER_TOP10D];
  if (!f1 || !top) return;
  const arrive = { map: TOWER_TOP10D, x: TOP_ARRIVE10D.x + 0.5, y: TOP_ARRIVE10D.y + 0.5, dir: 'down' };
  for (const p of TOWER1_GOLD10D) {
    f1.gates.push({ x: p.x, y: p.y, closed: f1.tiles[p.y * f1.w + p.x], open: T.C10D_GOLD, flag: C10D.start });
    f1.warps.push({ x: p.x, y: p.y, to: arrive, show: { all: [C10D.start] } });
    f1.links.push({ x: p.x, y: p.y, to: TOWER_TOP10D });
  }
  const G = TOP_GOLD10D;
  top.gates.push({ x: G.x, y: G.y, closed: top.tiles[G.y * top.w + G.x], open: T.C10D_GOLD, flag: C10D.start });
  top.warps.push({ x: G.x, y: G.y, to: { map: TOWER_1F10D, x: TOWER1_BACK10D.x + 0.5, y: TOWER1_BACK10D.y + 0.5, dir: 'down' }, show: { all: [C10D.start] } });
  top.links.push({ x: G.x, y: G.y, to: TOWER_1F10D });
  const S = TOP_SKYSTAIR10D;
  top.gates.push({ x: S.x, y: S.y, closed: top.tiles[S.y * top.w + S.x], open: T.C10D_SKYSTAIR, flag: C10D.top });
  top.warps.push({ x: S.x, y: S.y, to: { map: C10D_MAP.stair1, x: STAIR1_POS.entry.x + 0.5, y: STAIR1_POS.entry.y + 0.5, dir: 'up' }, show: { all: [C10D.top] } });
  top.links.push({ x: S.x, y: S.y, to: C10D_MAP.stair1 });
  const A = TOP_SCENE10D;
  top.triggers.push({ id: 'c10d_top_event', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10d_top_event', show: { all: [C10D.start], not: [C10D.top] } });
  finishGates10d(f1);
  finishGates10d(top);
}
// 星見の丘（世界地図）: 星の橋の 場面（c10_note_do から）・とちゅうで 止まった 星の橋の 絵（c10d_bridge から。さわれない）
function attachHill(maps) {
  const ow = maps.overworld;
  if (!ow) return;
  const A = HILL_SCENE10D;
  ow.triggers.push({ id: 'c10d_bridge_event', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10d_bridge_event', show: { all: [C10D.note], not: [C10D.bridge] } });
  ow.npcs.push(npc('c10d_bridge', '星の橋', [HILL_BRIDGE10D.x, HILL_BRIDGE10D.y], 'c10d_bridge', 'c10d_bridge_look', { solid: false, show: { all: [C10D.bridge] } }));
}
// ながれ星のくぼ地: 場面 0（音さを 鳴らす）・金の 台（置くと 光る）・8つめの 台（第2章の クリアの あと）
function attachCrater(maps) {
  const m = maps.c9a_crater;
  const E = CRATER_FORK10A;
  m.triggers.push({ id: 'c10d_fork_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10d_fork_event', show: { all: [C10D_ACT3], not: [C10D.start] } });
  const i = PED_DO10D;
  const old = m.npcs.find((n) => n.id === `c9c_ped${i + 1}`);
  const P = PEDESTALS9C[i];
  if (old) {
    old.show = { ...(old.show || {}), not: [...(old.show?.not || []), C10D_PED.do, C10D.act4] };
    old.script = 'c10_ped_do';
  }
  m.npcs.push(npc('c10_ped_do_on', '金の音の台', [P.x, P.y], `c10d_ped${i}_on`, 'c10_ped_do', { dir: 'down', show: { all: [C10D_PED.do] } }));
  m.npcs.push(npc('c10_ped_do_on2', '金の音の台', [P.x, P.y], `c10d_ped${i}_on`, 'c10_ped_do', { dir: 'down', show: { all: [C10D.act4] } }));
  m.npcs.push(npc('c10d_ped8', '8つめの台', [PED8_10D.x, PED8_10D.y], 'c10d_ped8', 'c10d_ped8', { dir: 'down', show: { all: [C10D.act4] } }));
}

export function attachC10d(maps) {
  for (const m of [buildStair1(), buildStair2(), buildStair3(), buildSummit()]) {
    finishGates10d(m);
    maps[m.id] = m;
  }
  attachTower(maps);
  attachHill(maps);
  attachCrater(maps);
}
export { C10D_MAP, C10D_PED };
