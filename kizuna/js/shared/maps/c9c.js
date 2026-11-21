// 第3部 第1章 第3幕「さかさのピラミッド」（第92回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 11）
// ・地下の川 c9c_river … いかだの 川下り（流れる 砂と 同じ きまり。maps/flow.js）。暗い（スピカの 光 4マス）。天じょうに さかさの 町
// ・さかさのピラミッド c9c_p1〜c9c_p4 … さかさの 台と たての ふきぬけ（maps/c9c-flip.js・world/c9c-steps.js）
// ・今の マップに 足す 物: 第4章の ピラミッドの 地下（pyramid_b1）の すみの 上り 階段（c9_note1 から。第4章を 遊んで いる 人には 見えない）・
//   ながれ星のくぼ地の 7つの 音の 台（c9_note1 から）・くぼ地の 場面（c9_act3）
// ・「行った 所」の 記録は 5まいとも 取らない（map.noExplore。引っこしコードを のばさない）
import { T } from '../tiles.js?v=f7068908c0e8';
import { npc } from './npc.js?v=f7068908c0e8';
import { parseRows16 } from './past.js?v=f7068908c0e8';
import { RIVER_ROWS, RIVER_POS, RIVER_LIGHTS, RIVER_DECOR, PYR_C1, PYR_C2, PYR_C3, PYR_C4, PYR_C_POS } from './c9c-rows.js?v=f7068908c0e8';
import { FLIP_FLAG } from './c9c-flip.js?v=f7068908c0e8';
import { UNDER_POS } from './c9b-rows.js?v=f7068908c0e8';
import { CRATER_POS } from './c9a-rows.js?v=f7068908c0e8';
import { c9cChest } from '../data/items-c9c.js?v=f7068908c0e8';
import {
  C9C, C9C_MAP, C9C_MAP_IDS, C9C_CHEST_IDS, C9C_TABLE, C9C_TRACKS, C9C_SPICA_LIGHT, C9C_SONG, ALGOL,
} from './c9c-flags.js?v=f7068908c0e8';

// 第3部 第1章 第3幕の マップの ID（セーブに のこるので かえない）
export const CH9C_MAPS = [...C9C_MAP_IDS];
// 小さな フラグ（しかけ・見た 場面。幕の クリアで 消す。セーブを 小さく する）
export const C9C_SEEN = { town: 'c9c_town', p1: 'c9c_seen1' };
// 歌の ボタン（4階）: さかさの じゅん（星 → 月 → 砂 → 太陽）に おす。光った ボタンの 小さな フラグ（さいごの 太陽で c9_song。その 時に 消す）
export const C9C_BUTTONS = [
  { key: 'sun', name: '太陽', ch: '1', tile: T.BTN_SUN, on: T.BTN_SUN_ON },
  { key: 'sand', name: '砂', ch: '2', tile: T.BTN_SAND, on: T.BTN_SAND_ON },
  { key: 'moon', name: '月', ch: '3', tile: T.BTN_MOON, on: T.BTN_MOON_ON },
  { key: 'star', name: '星', ch: '4', tile: T.BTN_STAR, on: T.BTN_STAR_ON },
].map((b) => ({ ...b, flag: `c9c_sb_${b.key}` }));
export const C9C_BUTTON_FLAGS = C9C_BUTTONS.map((b) => b.flag);
// 第4章の ピラミッドの 地下（ミイラのへや）の すみの 上り 階段（音の 間への 近道。c9_note1 から）
export const PYR_B1_STAIRS9C = { map: 'pyramid_b1', x: 2, y: 2 };
// ながれ星のくぼ地の 7つの 音の 台（ド〜シ。3つめが 黄・ミ）
export const PEDESTALS9C = Array.from({ length: 7 }, (_, i) => ({ x: 6 + i * 2, y: 5 }));
export const PED_COLORS9C = ['赤', 'だいだい', '黄', '緑', '青', 'あい', 'むらさき'];
export const PED_MI = 2;
export const CRATER_EVENT9C = { x: 8, y: 11, w: 9, h: 5 }; // くぼ地に 入る 所（音を 持って 来た 場面）

// 宝箱の 中み（B班の data/items-c9c.js の c9cChest。11この id）
export const chestOf9c = (id) => c9cChest(id) || {};

const cells = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, ...extra,
});
const finishGates = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };

// ───── 地下の川 ─────
const RIVER_LEGEND = {
  '#': T.C9C_CAVE, ',': T.C9C_BANK, '=': T.C9C_DOCK, '^': T.C9C_RIV_N, '>': T.C9C_RIV_E, v: T.C9C_RIV_S, '<': T.C9C_RIV_W,
  '~': T.C9C_POOL, r: T.C9C_RIVROCK,
};
export const isRiverTile = (t) => t >= T.C9C_RIV_N && t <= T.C9C_POOL;
function buildRiver() {
  const t = parseRows16(RIVER_ROWS, RIVER_LEGEND);
  const P = RIVER_POS;
  t.tiles[P.stone.y * t.w + P.stone.x] = T.C9C_TABLET;
  const m = base(C9C_MAP.river, '地下の川', t, {
    bgm: C9C_TRACKS.river, theme: 'c9c_river', bg2d: '#04040a', sky3d: { bg: '#03030a', fog: 0x05050e },
    c9cDark: { spica: C9C_SPICA_LIGHT, lights: RIVER_LIGHTS }, c9bDecor: RIVER_DECOR, c9cRaft: true,
    spawnCounts: { [C9C_TABLE.river]: 6 },
  });
  m.areaName = (x) => (x >= P.shore.x - 1 ? 'ピラミッドの岸' : '地下の川');
  // 川の はじめの さんばし（ヒカリゴケの里へ もどる）・ピラミッドの 入口（1階へ）
  const D = UNDER_POS.dock;
  m.warps.push({ x: P.startDock.x, y: P.startDock.y, to: { map: 'c9b_under', x: D.x + 0.5, y: D.y - 0.5, dir: 'up' } });
  m.links.push({ x: P.startDock.x, y: P.startDock.y, to: 'c9b_under' });
  const E = PYR_C_POS.c9c_p1.enter;
  m.warps.push({ x: P.gate.x, y: P.gate.y, to: { map: C9C_MAP.p1, x: E.x + 0.5, y: E.y + 0.5, dir: 'up' } });
  m.links.push({ x: P.gate.x, y: P.gate.y, to: C9C_MAP.p1 });
  // いかだ乗り場の 立てふだ（川の はじめ・ピラミッドの 岸）
  m.npcs.push(npc('c9c_post1', 'いかだ乗り場', [P.startPost.x, P.startPost.y], 'c9c_post', 'c9c_raftstop_start', { dir: 'down' }));
  m.npcs.push(npc('c9c_post2', 'いかだ乗り場', [P.shorePost.x, P.shorePost.y], 'c9c_post', 'c9c_raftstop_shore', { dir: 'down' }));
  m.actions.push({ x: P.stone.x, y: P.stone.y, script: 'c9c_stone' });
  // さかさの 町の 下・ピラミッドの 岸の 場面
  const Tn = P.town;
  m.triggers.push({ id: 'c9c_town', x: Tn.x, y: Tn.y, w: Tn.w, h: Tn.h, script: 'c9c_town', show: { not: [C9C.river, C9C_SEEN.town] } });
  const S = P.shoreScene;
  m.triggers.push({ id: 'c9c_shore', x: S.x, y: S.y, w: S.w, h: S.h, script: 'c9c_shore', show: { all: [C9C.raftGo], not: [C9C.river] } });
  // わき道の 宝箱
  P.chests.forEach((p, i) => m.chests.push({ id: C9C_CHEST_IDS.river[i], x: p.x, y: p.y, ...chestOf9c(C9C_CHEST_IDS.river[i]) }));
  // 魔物: 川の 流れの 上だけ（ゆるい 所・岸・さんばしは 出ない）
  m.zoneAt = (x, y) => {
    const id = m.tiles[y * m.w + x];
    return id >= T.C9C_RIV_N && id <= T.C9C_RIV_W ? C9C_TABLE.river : 'safe:river';
  };
  finishGates(m);
  return m;
}

// ───── さかさのピラミッド ─────
const PYR_LEGEND = {
  '#': T.C9C_WALL, '.': T.C9C_FLOOR, c: T.C9C_FLOOR, C: T.C9C_FLOOR, K: T.C9C_FLOOR, X: T.C9C_FLOOR, L: T.C9C_FLOOR, f: T.C9C_FLOOR,
  o: T.C9C_HOLE, s: T.C9C_STONE_LOW, P: T.C9C_PAD, '@': T.C9C_SHAFT, '~': T.C9C_HOLE,
  '^': T.FLOW_N, '>': T.FLOW_E, v: T.FLOW_S, '<': T.FLOW_W, O: T.SAND_PIT,
  F: T.C9C_FOUNT, T: T.C9C_TABLET, D: T.PYR_SLAB, G: T.PYR_GLYPH, i: T.TORCH, p: T.PILLAR, 6: T.BRAZIER_LIT, '!': T.SIGN,
  ...Object.fromEntries(C9C_BUTTONS.map((b) => [b.ch, b.tile])),
};
// さかさの 時に かわる マス（'@flip'）
const FLIP_SWAP = {
  o: [T.C9C_HOLE, T.C9C_HOLE_C], s: [T.C9C_STONE_LOW, T.C9C_STONE], '@': [T.C9C_SHAFT, T.C9C_SHAFT_UP],
  '^': [T.FLOW_N, T.FLOW_S], v: [T.FLOW_S, T.FLOW_N], '>': [T.FLOW_E, T.FLOW_W], '<': [T.FLOW_W, T.FLOW_E],
};
const NO_ESCAPE_HINT9C = 'ふきぬけを落ちて、1階から岸へもどろう';
function pyrMap(id, name, rows, extra) {
  const t = parseRows16(rows, PYR_LEGEND);
  const m = base(id, name, t, {
    bgm: C9C_TRACKS.pyramid, theme: 'c9c_pyr', bg2d: '#0a0612', sky3d: { bg: '#0a0612', fog: 0x120a1a },
    dark: false, c9cPyr: true, noEscape: true, noEscapeHint: NO_ESCAPE_HINT9C, ...extra,
  });
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    const sw = FLIP_SWAP[ch];
    if (sw) m.gates.push({ x, y, closed: sw[0], open: sw[1], flag: FLIP_FLAG });
    // 2階: ふきぬけの ふちの さく（番人に 勝つまで、さかさの 人は 通れない）
    if (ch === 'f') m.gates.push({ x, y, closed: T.C9C_FLOOR, levels: [[C9C.riddle, T.C9C_FLOOR], [FLIP_FLAG, T.C9C_FENCE]] });
  }));
  // 宝箱（c … ゆか・C … 天じょう）。番号は 階の じゅん・行の じゅん
  return m;
}
function addChests(m, rows, ids) {
  const list = [];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === 'c' || ch === 'C') list.push({ x, y, ceil: ch === 'C' }); }));
  list.forEach((p, i) => m.chests.push({ id: ids[i], x: p.x, y: p.y, c9cSide: p.ceil ? 'ceil' : 'floor', ...chestOf9c(ids[i]) }));
  return list.length;
}
// 階の 魔物: 着く 所・ふきぬけ・台・流れる 砂の 上は 出ない
const pyrZone = (m, table, safeRects = []) => (x, y) => {
  const id = m.tiles[y * m.w + x];
  if ([T.C9C_SHAFT, T.C9C_PAD, T.FLOW_N, T.FLOW_E, T.FLOW_S, T.FLOW_W, T.SAND_PIT].includes(id)) return 'safe:pyr';
  for (const [x0, y0, x1, y1] of safeRects) if (x >= x0 && y >= y0 && x <= x1 && y <= y1) return 'safe:pyr';
  return table;
};

function buildPyramid() {
  const Q = C9C_CHEST_IDS.pyr;
  let qi = 0;
  const P = PYR_C_POS;
  // 1階（れんしゅう）
  const p1 = pyrMap(C9C_MAP.p1, 'さかさのピラミッド　1階', PYR_C1);
  qi += addChests(p1, PYR_C1, Q.slice(qi));
  const R = RIVER_POS.gate;
  for (const e of cells(PYR_C1, 'X')) {
    p1.warps.push({ x: e.x, y: e.y, to: { map: C9C_MAP.river, x: R.x - 0.5, y: R.y + 0.5, dir: 'left' } });
    p1.links.push({ x: e.x, y: e.y, to: C9C_MAP.river });
  }
  p1.triggers.push({ id: 'c9c_p1_in', x: 6, y: 13, w: 5, h: 3, script: 'c9c_p1_in', show: { not: [C9C_SEEN.p1, C9C.p2] } });
  p1.zoneAt = pyrZone(p1, C9C_TABLE.pyr, [[5, 12, 11, 16], [5, 4, 11, 10]]);
  p1.spawnCounts = { [C9C_TABLE.pyr]: 2 };
  // 2階（2まいの 道・なぞの番人）
  const p2 = pyrMap(C9C_MAP.p2, 'さかさのピラミッド　2階', PYR_C2);
  qi += addChests(p2, PYR_C2, Q.slice(qi));
  const K = P.c9c_p2.keeper, Rd = P.c9c_p2.riddle;
  p2.npcs.push(npc('c9c_keeper', 'なぞの番人', [K.x, K.y], 'c9c_nazokake', 'c9c_keeper', { dir: 'down' }));
  p2.triggers.push({ id: 'c9c_riddle_event', x: Rd.x, y: Rd.y, w: Rd.w, h: Rd.h, script: 'c9c_riddle_event', show: { not: [C9C.riddle] } });
  p2.zoneAt = pyrZone(p2, C9C_TABLE.pyr, [[7, 8, 15, 14], [7, 1, 13, 3]]);
  p2.spawnCounts = { [C9C_TABLE.pyr]: 4 };
  // 3階（流れる 砂・回復の いずみ・わらべ歌の 石の 板・2階への 近道）
  const p3 = pyrMap(C9C_MAP.p3, 'さかさのピラミッド　3階', PYR_C3);
  qi += addChests(p3, PYR_C3, Q.slice(qi));
  const Tb = P.c9c_p3.tablet, Fo = P.c9c_p3.fount;
  p3.actions.push({ x: Tb.x, y: Tb.y, script: 'c9c_tablet' }, { x: Fo.x, y: Fo.y, script: 'c9c_fount' });
  const D2 = P.c9c_p2.down;
  for (const o of cells(PYR_C3, 'O')) p3.warps.push({ x: o.x, y: o.y, to: { map: C9C_MAP.p2, x: D2.x + 0.5, y: D2.y + 0.5, dir: 'down' } });
  p3.zoneAt = pyrZone(p3, C9C_TABLE.pyr2, [[9, 9, 17, 17]]);
  p3.spawnCounts = { [C9C_TABLE.pyr2]: 4 };
  // 4階（さかさの 大広間・音の 間）。魔物は 出ない
  const p4 = pyrMap(C9C_MAP.p4, 'さかさのピラミッド　4階', PYR_C4);
  qi += addChests(p4, PYR_C4, Q.slice(qi));
  const P4 = P.c9c_p4;
  for (const b of C9C_BUTTONS) {
    for (const c of cells(PYR_C4, b.ch)) {
      p4.gates.push({ x: c.x, y: c.y, closed: b.tile, levels: [[C9C.song, b.on], [b.flag, b.on]] });
      p4.actions.push({ x: c.x, y: c.y, script: `c9c_btn_${b.key}` });
    }
  }
  for (const d of cells(PYR_C4, 'D')) {
    p4.gates.push({ x: d.x, y: d.y, closed: T.PYR_SLAB, open: T.C9C_FLOOR, flag: C9C.song });
    p4.actions.push({ x: d.x, y: d.y, script: 'c9c_slab', show: { not: [C9C.song] } });
  }
  p4.signs.push({ x: P4.sign.x, y: P4.sign.y, text: '石の文字ばんに、さかさの字で、こう書いてある。\n「王の歌を、さかさのじゅんに。\nまちがえし者は、下の階へ落ちる」' });
  const D3 = P.c9c_p3.down;
  for (const o of cells(PYR_C4, 'O')) p4.warps.push({ x: o.x, y: o.y, to: { map: C9C_MAP.p3, x: D3.x + 0.5, y: D3.y + 0.5, dir: 'down' } });
  // 音の 間（3人組の 場面・星の音）
  const Rm = P4.room, Ob = P4.orb;
  p4.triggers.push({ id: 'c9c_trio2_event', x: Rm.x, y: Rm.y, w: Rm.w, h: Rm.h, script: 'c9c_trio2_event', show: { all: [C9C.song], not: [C9C.trio2] } });
  p4.npcs.push(npc('c9c_orb', '黄色い光の玉', [Ob.x, Ob.y], 'c9c_orb', 'c9c_orb', { dir: 'down', show: { not: [C9C.note1] } }));
  // 第4章の ピラミッドの 地下への 階段（星の音を 手に 入れた あと）
  const St = P4.stairs, B1 = PYR_B1_STAIRS9C;
  p4.gates.push({ x: St.x, y: St.y, closed: T.C9C_FLOOR, open: T.STAIRS_DOWN, flag: C9C.note1 });
  p4.warps.push({ x: St.x, y: St.y, to: { map: B1.map, x: B1.x + 1.5, y: B1.y + 0.5, dir: 'right' }, show: { all: [C9C.note1] } });
  p4.links.push({ x: St.x, y: St.y, to: B1.map });
  p4.zoneAt = () => 'safe:pyr4';
  for (const m of [p1, p2, p3, p4]) finishGates(m);
  return { p1, p2, p3, p4, chests: qi };
}

// ───── 今の マップに 足す 物 ─────
function attachPyramidB1(maps) {
  const m = maps[PYR_B1_STAIRS9C.map];
  const S = PYR_B1_STAIRS9C;
  m.gates.push({ x: S.x, y: S.y, closed: m.tiles[S.y * m.w + S.x], open: T.STAIRS_UP, flag: C9C.note1 });
  const St = PYR_C_POS.c9c_p4.stairs;
  m.warps.push({ x: S.x, y: S.y, to: { map: C9C_MAP.p4, x: St.x + 0.5, y: St.y - 0.5, dir: 'up' }, show: { all: [C9C.note1] } });
  (m.links = m.links || []).push({ x: S.x, y: S.y, to: C9C_MAP.p4 });
  finishGates(m);
}
function attachCrater(maps) {
  const m = maps.c9a_crater;
  PEDESTALS9C.forEach((p, i) => {
    const lit = i === PED_MI;
    m.npcs.push(npc(`c9c_ped${i + 1}`, `${PED_COLORS9C[i]}の音の台`, [p.x, p.y], `c9c_ped${i}`, 'c9c_ped', { dir: 'down', show: { all: [C9C.note1], ...(lit ? { not: [C9C.act3] } : {}) } }));
    if (lit) m.npcs.push(npc('c9c_ped_mi', '黄の音の台', [p.x, p.y], 'c9c_ped_on', 'c9c_ped', { dir: 'down', show: { all: [C9C.act3] } }));
  });
  const E = CRATER_EVENT9C;
  m.triggers.push({ id: 'c9c_crater', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c9c_crater', show: { all: [C9C.note1], not: [C9C.act3] } });
}

export function attachC9c(maps) {
  maps[C9C_MAP.river] = buildRiver();
  const { p1, p2, p3, p4 } = buildPyramid();
  maps[C9C_MAP.p1] = p1;
  maps[C9C_MAP.p2] = p2;
  maps[C9C_MAP.p3] = p3;
  maps[C9C_MAP.p4] = p4;
  attachPyramidB1(maps);
  attachCrater(maps);
}
export { C9C_MAP, C9C_SONG, ALGOL, CRATER_POS };
