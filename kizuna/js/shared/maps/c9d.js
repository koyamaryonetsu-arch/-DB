// 第3部 第1章 第4幕「星のはかば」（第93回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12）
// ・ふたごの道 c9d_g1・c9d_g2 … スピカと ふた手に 分かれる 暗い 道（しくみは maps/c9d-lane.js・world/c9d-steps.js・client/c9d-view.js）
// ・星のはかば c9d_grave … 魔物は 出ない。ねむる 星・古い 石の 文字・魔人・大きな くぼみ
// ・今の マップに 足す 物: 第3幕の 地下の川の 終わりの 岸に ひびきの とびらと ひびきの石 2つ（c9_song1 から。れんしゅう）・
//   ながれ星のくぼ地の 黄の 台の 前の 場面（c9_act3 から。幕が 開いて いる 時だけ 始まる）
// ・「行った 所」の 記録は 3まいとも 取らない（map.noExplore。引っこしコードを のばさない）。地図は 全部 見える（c9dShowAll）
import { T } from '../tiles.js?v=5845e0f225ba';
import { npc } from './npc.js?v=5845e0f225ba';
import { parseRows16 } from './past.js?v=5845e0f225ba';
import { lightInfo } from './c9a-light.js?v=5845e0f225ba';
import { G1_ROWS, G2_ROWS, GRAVE_ROWS, C9D_POS, SHORE_DOOR9D, SHORE_STONES9D, SHORE_SCENE9D } from './c9d-rows.js?v=5845e0f225ba';
import {
  C9D, C9D_ACT3, C9D_MAP, C9D_MAP_IDS, C9D_ECHO, C9D_CHEST_IDS, C9D_TABLE, C9D_TRACKS, C9D_SPICA_LIGHT, C9D_APART_LIGHT, C9D_MOSS_STEPS,
} from './c9d-flags.js?v=5845e0f225ba';
import { C9C_MAP } from './c9c-flags.js?v=5845e0f225ba';
import { c9dChest } from '../data/items-c9d.js?v=5845e0f225ba';

// 第3部 第1章 第4幕の マップの ID（セーブに のこるので かえない）
export const CH9D_MAPS = [...C9D_MAP_IDS];
// 小さな フラグ（見た 場面。幕の クリアで 消す。セーブを 小さく する）
export const C9D_SEEN = { door: 'c9d_seen_door', g1: 'c9d_seen_g1' };
// ながれ星のくぼ地の 黄の 台の 前（場面 1。幕が 始まる）
export const CRATER_SONG9D = { x: 5, y: 6, w: 14, h: 2 };

// 宝箱の 中み（B班の data/items-c9d.js の c9dChest。8この id）
export const chestOf9d = (id) => c9dChest(id) || {};

const cells = (rows, ch) => { const out = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) out.push({ x, y }); })); return out; };
const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, ...extra,
});
const finishGates = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };

// ひびきの石の しらべる 台本の id（world/c9d-steps.js が SCRIPTS に 入れる）
export const stoneScript9d = (id) => `c9d_stone_${id}`;
export const echoFlag9d = (n) => C9D_ECHO[n - 1];

// ───── ふたごの道 ─────
const BRIDGE = { b: 2, n: 3, d: 4, D: 5 }; // 光の 橋の 文字 → 組の 番号
const LANE_LEGEND = {
  '#': T.C9D_ROCK, '.': T.C9D_FLOOR, '~': T.C9D_CHASM, m: T.C9D_MOSS, L: T.C9D_LAMP, R: T.C9D_LAMP, c: T.C9D_FLOOR,
  F: T.C9C_FOUNT, X: T.C9D_FLOOR, b: T.C9D_CHASM, n: T.C9D_CHASM, d: T.C9D_CHASM, D: T.C9D_CHASM,
};
function laneMap(id, name, rows, P, table, extra) {
  const t = parseRows16(rows, LANE_LEGEND);
  for (const s of P.stones) t.tiles[s.y * t.w + s.x] = T.C9D_ECHO;
  const mossRows = rows.map((r) => [...r].map((ch) => (ch === 'm' ? 'm' : '.')).join(''));
  const m = base(id, name, t, {
    bgm: C9D_TRACKS.lane, theme: 'c9d_lane', bg2d: '#04030a', sky3d: { bg: '#04030a', fog: 0x06050e },
    c9dLane: {
      spica: C9D_SPICA_LIGHT, apart: C9D_APART_LIGHT,
      lamps: { L: cells(rows, 'L'), R: cells(rows, 'R') },
    },
    c9dStones: P.stones.map((s) => ({ ...s, map: id, flag: echoFlag9d(s.echo) })),
    // 光る こけ（第1幕の 光の輪の しくみ。40歩。world/c9a-steps.js の stepC9a）
    c9a: Object.assign(lightInfo(0, mossRows, { source: 'S', moss: 'm', crystal: 'q', hole: 'o' }), { mossSteps: C9D_MOSS_STEPS }),
    spawnCounts: { [table]: 6 },
    ...extra,
  });
  m.c9a.holeSet = new Set();
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (BRIDGE[ch]) m.gates.push({ x, y, closed: T.C9D_CHASM, open: T.C9D_BRIDGE, flag: echoFlag9d(BRIDGE[ch]) });
  }));
  for (const s of m.c9dStones) m.actions.push({ x: s.x, y: s.y, script: stoneScript9d(s.id) });
  // 魔物: 入口の 広間・橋の 上は 出ない
  m.zoneAt = (x, y) => {
    const tile = m.tiles[y * m.w + x];
    if (tile !== T.C9D_FLOOR && tile !== T.C9D_MOSS) return 'safe:lane';
    if (y >= P.hallY) return 'safe:lane';
    return table;
  };
  return m;
}

function buildG1() {
  const P = { ...C9D_POS.c9d_g1, hallY: 33 };
  const m = laneMap(C9D_MAP.g1, 'ふたごの道　1階', G1_ROWS, P, C9D_TABLE.lane);
  m.areaName = (x, y) => (y >= 33 ? 'ふたごの道　1階' : x < 15 ? 'ふたごの道　左の道' : 'ふたごの道　右の道');
  const E = P.exit;
  m.warps.push({ x: E.x, y: E.y, to: { map: C9C_MAP.river, x: SHORE_DOOR9D.x + 0.5, y: SHORE_DOOR9D.y + 1.5, dir: 'down' } });
  m.links.push({ x: E.x, y: E.y, to: C9C_MAP.river });
  const S = P.stairs;
  m.tiles[S.y * m.w + S.x] = T.STAIRS_UP;
  const S2 = C9D_POS.c9d_g2.stairs;
  m.warps.push({ x: S.x, y: S.y, to: { map: C9D_MAP.g2, x: S2.x + 0.5, y: S2.y - 0.5, dir: 'up' } }); // 階段の となり（ワープの 上には 着かない）
  m.links.push({ x: S.x, y: S.y, to: C9D_MAP.g2 });
  const A = P.arrive;
  m.triggers.push({ id: 'c9d_g1_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c9d_g1_in', show: { not: [C9D_SEEN.g1, C9D.g2] } });
  return m;
}
function buildG2() {
  const P = { ...C9D_POS.c9d_g2, hallY: 27 };
  const m = laneMap(C9D_MAP.g2, 'ふたごの道　2階', G2_ROWS, P, C9D_TABLE.lane2);
  m.areaName = (x, y) => (y >= 27 ? 'ふたごの道　2階' : y <= 5 && x >= 8 && x <= 22 ? 'ふたごの道　北の出口' : x < 15 ? 'ふたごの道　左の道' : 'ふたごの道　右の道');
  const S = P.stairs;
  m.tiles[S.y * m.w + S.x] = T.STAIRS_DOWN;
  const S1 = C9D_POS.c9d_g1.stairs;
  m.warps.push({ x: S.x, y: S.y, to: { map: C9D_MAP.g1, x: S1.x + 0.5, y: S1.y + 1.5, dir: 'down' } });
  m.links.push({ x: S.x, y: S.y, to: C9D_MAP.g1 });
  const E = P.exit, GE = C9D_POS.c9d_grave.enter;
  m.warps.push({ x: E.x, y: E.y, to: { map: C9D_MAP.grave, x: GE.x + 0.5, y: GE.y + 1.5, dir: 'up' } });
  m.links.push({ x: E.x, y: E.y, to: C9D_MAP.grave });
  const Fo = P.fount;
  m.actions.push({ x: Fo.x, y: Fo.y, script: 'c9d_fount' });
  const A = P.arrive;
  m.triggers.push({ id: 'c9d_g2_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c9d_g2_in', show: { not: [C9D.g2] } });
  // 北の 出口の 台（谷の 上）は 魔物が 出ない
  const z0 = m.zoneAt;
  m.zoneAt = (x, y) => (y <= 5 && x >= 7 && x <= 23 ? 'safe:lane' : z0(x, y));
  return m;
}

// ───── 星のはかば ─────
const GRAVE_LEGEND = {
  r: T.C9D_GRAVE_ROCK, g: T.C9D_GRAVE, o: T.C9D_HOLLOW, H: T.C9D_HOLLOW_BIG, T: T.C9D_TABLET, c: T.C9D_GRAVE, X: T.C9D_GRAVE,
};
function buildGrave() {
  const P = C9D_POS.c9d_grave;
  const t = parseRows16(GRAVE_ROWS, GRAVE_LEGEND);
  const m = base(C9D_MAP.grave, '星のはかば', t, {
    bgm: C9D_TRACKS.grave, theme: 'c9d_grave', bg2d: '#06061a', sky3d: { bg: '#05051a', fog: 0x0a0a24 },
    c9dGrave: true, dark: false,
  });
  const E = P.exit, X2 = C9D_POS.c9d_g2.exit;
  m.warps.push({ x: E.x, y: E.y, to: { map: C9D_MAP.g2, x: X2.x + 0.5, y: X2.y + 1.5, dir: 'down' } });
  m.links.push({ x: E.x, y: E.y, to: C9D_MAP.g2 });
  // ねむる 星（小さな くぼみ）・大きな くぼみ・古い 石の 文字
  for (const o of cells(GRAVE_ROWS, 'o')) m.actions.push({ x: o.x, y: o.y, script: 'c9d_sleeper' });
  for (const h of cells(GRAVE_ROWS, 'H')) m.actions.push({ x: h.x, y: h.y, script: 'c9d_hollow' });
  m.actions.push({ x: P.tablet.x, y: P.tablet.y, script: 'c9d_tablet' });
  // 着いた 時・魔人・大きな くぼみの 場面
  const A = P.arrive, Ms = P.muScene, Hs = P.hollowScene;
  m.triggers.push({ id: 'c9d_grave_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c9d_grave_in', show: { not: [C9D.grave] } });
  m.triggers.push({ id: 'c9d_mu_event', x: Ms.x, y: Ms.y, w: Ms.w, h: Ms.h, script: 'c9d_mu_event', show: { all: [C9D.grave], not: [C9D.mu] } });
  m.triggers.push({ id: 'c9d_hollow_event', x: Hs.x, y: Hs.y, w: Hs.w, h: Hs.h, script: 'c9d_hollow_event', show: { all: [C9D.mu], not: [C9D.act4] } });
  // 魔人（勝つ 前は おかしの 星で 遊んで いる・勝つと 2人で ならんで すわる。はかばの 番）
  const Mu = P.mu;
  m.npcs.push(npc('c9d_mu_play', 'あそびたい魔人', [Mu.x, Mu.y], 'c9d_mu', 'c9d_mu_talk', { dir: 'down', show: { all: [C9D.grave], not: [C9D.mu] } }));
  m.npcs.push(npc('c9d_mu_sit', 'ムウ', [Mu.x - 1, Mu.y], 'c9d_mu_sit', 'c9d_mu_talk', { dir: 'down', show: { all: [C9D.mu] } }));
  m.npcs.push(npc('c9d_mumu_sit', 'ムウムウ', [Mu.x + 1, Mu.y], 'c9d_mumu_sit', 'c9d_mu_talk', { dir: 'down', show: { all: [C9D.mu] } }));
  const ids = C9D_CHEST_IDS.slice(6);
  cells(GRAVE_ROWS, 'c').forEach((p, i) => m.chests.push({ id: ids[i], x: p.x, y: p.y, ...chestOf9d(ids[i]) }));
  m.zoneAt = () => 'safe:grave';
  finishGates(m);
  return m;
}

function addLaneChests(m, rows, ids) {
  cells(rows, 'c').forEach((p, i) => m.chests.push({ id: ids[i], x: p.x, y: p.y, ...chestOf9d(ids[i]) }));
}

// ───── 今の マップに 足す 物 ─────
// ピラミッドの 岸（地下の川の 終わり）: 岩かべの ひびきの とびら と 左右の ひびきの石（c9_song1 から）
function attachShore(maps) {
  const m = maps[C9C_MAP.river];
  const D = SHORE_DOOR9D;
  m.camPadR = 5; // 岸は マップの 右の はし。画面の 右の ボタンの 下に 主人公が かくれない ように（client/field.js）
  m.gates.push({ x: D.x, y: D.y, closed: m.tiles[D.y * m.w + D.x], levels: [[C9D.door, T.C9D_DOOR_OPEN], [C9D.song1, T.C9D_DOOR]] });
  const G1 = C9D_POS.c9d_g1.enter;
  m.warps.push({ x: D.x, y: D.y, to: { map: C9D_MAP.g1, x: G1.x + 0.5, y: G1.y + 1.5, dir: 'up' }, show: { all: [C9D.door] } });
  m.links.push({ x: D.x, y: D.y, to: C9D_MAP.g1 });
  m.c9dStones = SHORE_STONES9D.map((s) => ({ ...s, map: m.id, flag: echoFlag9d(s.echo), show: { all: [C9D.song1] } }));
  for (const s of m.c9dStones) {
    m.gates.push({ x: s.x, y: s.y, closed: m.tiles[s.y * m.w + s.x], levels: [[C9D.song1, T.C9D_ECHO]] });
    m.actions.push({ x: s.x, y: s.y, script: stoneScript9d(s.id), show: { all: [C9D.song1] } });
  }
  const S = SHORE_SCENE9D;
  m.triggers.push({ id: 'c9d_door_event', x: S.x, y: S.y, w: S.w, h: S.h, script: 'c9d_door_event', show: { all: [C9D.song1], not: [C9D.door, C9D_SEEN.door] } });
  m.actions.push({ x: D.x, y: D.y, script: 'c9d_door', show: { all: [C9D.song1], not: [C9D.door] } });
  finishGates(m);
}
// ながれ星のくぼ地: 黄の 台の 前で スピカが 歌う（場面 1。幕が 開いて いる 時だけ。story-c9d.js）
function attachCrater(maps) {
  const m = maps.c9a_crater;
  const E = CRATER_SONG9D;
  m.triggers.push({ id: 'c9d_song_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c9d_song_event', show: { all: [C9D_ACT3], not: [C9D.song1] } });
}

export function attachC9d(maps) {
  const g1 = buildG1();
  addLaneChests(g1, G1_ROWS, C9D_CHEST_IDS.slice(0, 3));
  finishGates(g1);
  const g2 = buildG2();
  addLaneChests(g2, G2_ROWS, C9D_CHEST_IDS.slice(3, 6));
  finishGates(g2);
  maps[C9D_MAP.g1] = g1;
  maps[C9D_MAP.g2] = g2;
  maps[C9D_MAP.grave] = buildGrave();
  attachShore(maps);
  attachCrater(maps);
}
export { C9D_MAP };
