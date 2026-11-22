// 第3部 第2章 第2幕「青と白」（第95回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14）
// ・青 … 砂の底の神殿の 水鏡の うら c10b_blue1（水の 高さ。world/c10b-steps.js）・かれた 間 c10b_blue2
// ・白 … 白銀の湖の 氷の 下 c10b_white1・c10b_white2（こっそり。world/c10b-steps.js）・月の 間 c10b_white3
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   白銀の湖（north）の 小島 … 光の 階段（c10b_start と 夜）・立てふだ（c10b_start）/ 湖の 岸 … 氷の 階段（c10_note_la）
//   砂の底の神殿の 水鏡の広間 … 水鏡を しらべると もぐれる（c10_note_so。台本だけ。data/story-c10b.js）
//   地下の川の ピラミッドの 岸の いかだ乗り場 … 行き先「青い流れ」（c10b_start。台本だけ）
//   ながれ星のくぼ地 … 場面 0 の マス（c10_act1 から。幕が 開いて いる 時だけ 動く）・青と 白の 音の 台
// ・水の 高さ（0 下・1 中・2 上）は とびらの しるし '@w0'・'@w1'・'@w2'（world.js の hasFlagFn・client/field.js の hasFlag）
// ・「行った 所」の 記録は 5まいとも 取らない（map.noExplore）
import { T } from '../tiles.js?v=8604ab7ba7a1';
import { npc } from './npc.js?v=8604ab7ba7a1';
import { parseRows16 } from './past.js?v=8604ab7ba7a1';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=8604ab7ba7a1';
import {
  BLUE1_ROWS, BLUE1_POS, BLUE2_ROWS, BLUE2_POS, WHITE1_ROWS, WHITE2_ROWS, WHITE3_ROWS, WHITE1_POS, WHITE2_POS, WHITE3_POS,
  WHITE1_OWLS, WHITE2_OWLS, WHITE1_ROOMS, WHITE2_ROOMS, cells10b, heightAt10b, HALL_ARRIVE10B, LAKE_STAIRS10B, LAKE_SIGN10B, LAKE_LAND10B,
  LAKE_SCENE10B, SHORE_STAIRS10B, PED_SO10B, PED_LA10B,
} from './c10b-rows.js?v=8604ab7ba7a1';
import {
  C10B, C10B_ACT1, C10B_BLUE, C10B_WHITE, C10B_BONUS, C10B_PED, C10B_MAP, C10B_MAP_IDS, C10B_TABLE, C10B_CHEST_IDS, C10B_TRACKS,
  C10B_BLUE_BOSS_NAME, C10B_WHITE_BOSS_NAME,
} from './c10b-flags.js?v=8604ab7ba7a1';
import { PEDESTALS9C } from './c9c.js?v=8604ab7ba7a1';
import { CRATER_FORK10A } from './c10a-rows.js?v=8604ab7ba7a1';
import { c10bChest } from '../data/items-c10b.js?v=8604ab7ba7a1';

export const CH10B_MAPS = [...C10B_MAP_IDS];

// 宝箱の 中み（B班の data/items-c10b.js の c10bChest。14この id）
export const chestOf10b = (id) => c10bChest(id) || {};

const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, ...extra,
});
export const finishGates10b = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };
const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const key = (p) => `${p.x},${p.y}`;
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ───── 水の 高さ ─────
// 水の 高さの とびらの しるし（その 階に いる パーティーの 水。world/c10b-steps.js）
export const WATER_FLAG = (n) => `@w${n}`;
// 1マスの すがた（h … 地面の 高さ・L … 水の 高さ・kind … ふつう / ramp / dive・edge … ふちか・diveOk … 下が 水か）
export function c10bCell(h, L, kind = '', edge = false, diveOk = false) {
  if (h < L) return h < L - 1 ? T.C10B_DEEP : T.C10B_WATER;
  const floor = [T.C10B_FLOOR0, T.C10B_FLOOR1, T.C10B_FLOOR2][h];
  if (h === L) return floor;
  if (kind === 'ramp') return T.C10B_RAMP;
  if (kind === 'dive') return diveOk ? T.C10B_DIVE : T.C10B_CLIFF;
  return edge ? T.C10B_CLIFF : floor;
}
// 1マスの とびら（水の 高さ 0・1・2 の すがた。しるしが ない 時〈魔物の 動き〉は 中の すがた）
const waterGate = (x, y, t0, t1, t2) => ({ x, y, closed: t1, open: t1, levels: [[WATER_FLAG(0), t0], [WATER_FLAG(2), t2]] });

function buildBlue1() {
  const P = BLUE1_POS;
  const rows = BLUE1_ROWS;
  const W = rows[0].length, H = rows.length;
  const tiles = new Uint16Array(W * H).fill(T.C10B_WALL);
  const m = base(C10B_MAP.blue1, '水鏡のうら', { w: W, h: H, tiles }, {
    bgm: C10B_TRACKS.blue, bg2d: '#04101c', sky3d: { bg: '#06182a', fog: 0x0a2a44 }, c10bBlue: true, dark: false,
  });
  const special = new Map();
  const put = (list, kind) => { for (const p of [].concat(list)) special.set(key(p), { kind, ...p }); };
  put(P.bells, 'bell'); put(P.ramps, 'ramp'); put(P.dives, 'dive'); put(P.key, 'key'); put(P.door, 'door'); put(P.down, 'down');
  put(P.flowE, 'flowE'); put(P.flowW, 'flowW'); put(P.whirl, 'whirl'); put(P.plinth, 'plinth'); put(P.stone, 'stone');
  // ふち（となりに もっと 低い 地面が ある マス。うず・台は かべと 同じ）
  const fixed = (x, y) => ['whirl', 'plinth'].includes(special.get(`${x},${y}`)?.kind);
  const hAt = (x, y) => (fixed(x, y) ? -1 : heightAt10b(x, y));
  const edgeOf = (x, y, h) => D4.some(([dx, dy]) => { const n = hAt(x + dx, y + dy); return n >= 0 && n < h; });
  m.c10bHeights = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const h = heightAt10b(x, y);
    if (h < 0) continue;
    const sp = special.get(`${x},${y}`);
    const kind = sp?.kind || '';
    const i = y * W + x;
    if (kind === 'bell') { tiles[i] = T.C10B_BELL; continue; }
    if (kind === 'stone') { tiles[i] = T.C10B_FLOOR1; continue; }
    if (kind === 'plinth') { tiles[i] = T.C10B_FLOOR1; continue; }
    if (kind === 'down') { tiles[i] = T.STAIRS_DOWN; continue; }
    if (kind === 'whirl') {
      tiles[i] = T.C10B_WHIRL;
      m.gates.push({ x, y, closed: T.C10B_WHIRL, open: T.C10B_ICEBRIDGE, flag: C10B_BONUS.blue });
      continue;
    }
    if (kind === 'door') {
      tiles[i] = T.C10B_DOOR;
      m.gates.push({ x, y, closed: T.C10B_DOOR, open: T.C10B_FLOOR2, flag: C10B_BLUE.key });
      continue;
    }
    if (kind === 'key') {
      tiles[i] = T.C10B_KEYSTONE;
      m.gates.push({ x, y, closed: T.C10B_KEYSTONE, open: T.C10B_KEYSTONE, levels: [[WATER_FLAG(1), T.C10B_WATER], [WATER_FLAG(2), T.C10B_DEEP], [C10B_BLUE.key, T.C10B_FLOOR0]] });
      continue;
    }
    if (kind === 'flowE' || kind === 'flowW') {
      const f = kind === 'flowE' ? T.C10B_FLOW_E : T.C10B_FLOW_W;
      tiles[i] = f;
      m.gates.push(waterGate(x, y, T.C10B_TRENCH, f, T.C10B_TRENCH));
      continue;
    }
    const edge = edgeOf(x, y, h);
    const land = sp?.to ? heightAt10b(sp.to.x, sp.to.y) : -1;
    const at = (L) => c10bCell(h, L, kind, edge, land >= 0 && land < L);
    tiles[i] = at(1);
    m.gates.push(waterGate(x, y, at(0), at(1), at(2)));
    m.c10bHeights.push([x, y, h]);
  }
  // 飛びこめる ふち（下が 水の 時だけ。着く 所は 下の 水の マス）
  for (const d of P.dives) {
    const h = heightAt10b(d.x, d.y), land = heightAt10b(d.to.x, d.to.y);
    const Ls = [0, 1, 2].filter((L) => land < L && L < h);
    for (const L of Ls) m.warps.push({ x: d.x, y: d.y, to: { map: m.id, x: d.to.x + 0.5, y: d.to.y + 0.5, dir: 'down' }, show: { all: [WATER_FLAG(L)] }, c10bDive: true });
  }
  // 音の かね・石の 文字・かぎの 石・とびら・うず
  for (const b of P.bells) m.actions.push({ x: b.x, y: b.y, script: 'c10b_bell' });
  m.npcs.push(npc('c10b_stone', '石の文字', [P.stone.x, P.stone.y], 'c9a_signpost', 'c10b_stone', { dir: 'down' }));
  m.actions.push({ x: P.key.x, y: P.key.y, script: 'c10b_keystone' });
  m.actions.push({ x: P.door.x, y: P.door.y, script: 'c10b_door', show: { not: [C10B_BLUE.key] } });
  m.actions.push({ x: P.freeze.x, y: P.freeze.y, script: 'c10b_whirl', show: { not: [C10B_BONUS.blue] } });
  // いかだ乗り場の 立てふだ（ピラミッドの 岸へ もどる）
  m.npcs.push(npc('c10b_post', 'いかだ乗り場', [P.post.x, P.post.y], 'c9c_post', 'c10b_dock', { dir: 'down' }));
  // かれた 間への 下り 階段（とびらの おく）
  warp(m, P.down, C10B_MAP.blue2, { x: BLUE2_POS.up.x, y: BLUE2_POS.up.y + 1 }, 'down');
  // 宝箱（c10b_bc1〜bc4）・おまけ（うずの まん中の 台）
  P.chests.forEach((p, i) => { const id = C10B_CHEST_IDS.blue[i]; m.chests.push({ id, x: p.x, y: p.y, ...chestOf10b(id) }); });
  m.chests.push({ id: C10B_CHEST_IDS.bonus.blue, x: P.plinth.x, y: P.plinth.y, ...chestOf10b(C10B_CHEST_IDS.bonus.blue) });
  // 魔物: 湖の 底（低い 0）は 水の 魔物・段（1・2）は 砂の 魔物。入口・かねの まわり・水路は 出ない
  const quiet = [P.entry, ...P.bells];
  m.zoneAt = (x, y) => {
    const h = heightAt10b(x, y);
    if (h < 0 || special.has(`${x},${y}`) || quiet.some((q) => Math.abs(q.x - x) <= 3 && Math.abs(q.y - y) <= 3)) return 'safe:blue';
    if (x >= 39) return 'safe:blue';
    return tableOr(h === 0 ? C10B_TABLE.wet : C10B_TABLE.dry, 'safe:wait');
  };
  m.spawnCounts = { [C10B_TABLE.wet]: 6, [C10B_TABLE.dry]: 5 };
  m.areaName = (x, y) => (y <= 8 && x >= 14 ? '水鏡のうら　高い岸' : x >= 39 ? '水鏡のうら　東のほら穴' : y >= 32 ? '水鏡のうら　いかだ乗り場' : '水鏡のうら');
  return m;
}

function buildBlue2() {
  const P = BLUE2_POS;
  const t = parseRows16(BLUE2_ROWS, { '#': T.C10B_WALL, '.': T.C10B_SAND, ',': T.C10B_SAND, U: T.STAIRS_UP, W: T.C10B_ORB, c: T.C10B_SAND });
  const m = base(C10B_MAP.blue2, 'かれた間', t, { bgm: C10B_TRACKS.blue, bg2d: '#1a1408', sky3d: { bg: '#1a140a', fog: 0x2a2010 }, c10bDry: true });
  warp(m, P.up, C10B_MAP.blue1, { x: BLUE1_POS.door.x, y: BLUE1_POS.door.y }, 'down');
  // 青い 光の 玉（音を 取った あとは わき水。水鏡の 広間へ うき上がる 近道）
  const O = P.orb;
  m.gates.push({ x: O.x, y: O.y, closed: T.C10B_ORB, open: T.C10B_SPRING, flag: C10B_BLUE.note });
  m.actions.push({ x: O.x, y: O.y, script: 'c10b_orb', show: { not: [C10B_BLUE.note] } });
  const Hh = HALL_ARRIVE10B;
  m.warps.push({ x: O.x, y: O.y, to: { map: Hh.map, x: Hh.x + 0.5, y: Hh.y + 0.5, dir: 'down' }, show: { all: [C10B_BLUE.note] } });
  m.links.push({ x: O.x, y: O.y, to: Hh.map });
  const B = P.bossScene;
  m.triggers.push({ id: 'c10b_gecko_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10b_gecko_event', show: { not: [C10B_BLUE.boss] } });
  m.npcs.push(npc('c10b_gecko', C10B_BLUE_BOSS_NAME, [P.boss.x, P.boss.y], 'c10b_gecko', 'c10b_gecko_event', { dir: 'down', show: { not: [C10B_BLUE.boss] } }));
  cells10b(BLUE2_ROWS, 'c').forEach((p, i) => { const id = C10B_CHEST_IDS.blue[4 + i]; m.chests.push({ id, x: p.x, y: p.y, ...chestOf10b(id) }); });
  m.zoneAt = () => 'safe:dry';
  return m;
}

// ───── 白: こっそり ─────
const WHITE_LEGEND = {
  '#': T.C10B_ICEWALL, '.': T.C10B_ICEFLOOR, s: T.C10B_SNOWPILE, '=': T.C10B_SLIDE, x: T.C10B_THIN, O: T.C10B_PILLAR, P: T.C10B_PILLAR,
  c: T.C10B_ICEFLOOR, U: T.STAIRS_UP, D: T.STAIRS_DOWN, L: T.LEVER, Z: T.C10B_ICEFLOOR, M: T.C10B_MELTWALL, b: T.C10B_ICEFLOOR,
  m: T.C10B_MOONFLOOR, W: T.C10B_MOONFLOOR,
};
function sneakMap(id, name, rows, owls, rooms, P, chests, battle) {
  const t = parseRows16(rows, WHITE_LEGEND);
  const m = base(id, name, t, {
    bgm: C10B_TRACKS.white, bg2d: '#0a1424', sky3d: { bg: '#0c1a2e', fog: 0x16304c }, c10bSneak: true, dark: false,
    c10bOwls: owls.map((o, i) => ({ ...o, i })), c10bRooms: rooms, c10bBattle: battle,
  });
  cells10b(rows, 'c').forEach((p, i) => m.chests.push({ id: chests[i], x: p.x, y: p.y, ...chestOf10b(chests[i]) }));
  // レバー（見はりを ねむらせる。パーティーで 同じ・セーブしない）
  m.actions.push({ x: P.lever.x, y: P.lever.y, script: 'c10b_lever' });
  // ねむる けもの（かざり。うすい 氷を ふむと 目を さます）
  P.beasts.forEach((b, i) => m.npcs.push(npc(`${id}_beast${i}`, 'ねむるけもの', [b.x, b.y], 'c10b_beast', 'c10b_beast', { dir: 'down', big: true })));
  m.zoneAt = () => 'safe:sneak';
  return m;
}
function buildWhite1() {
  const P = WHITE1_POS;
  const m = sneakMap(C10B_MAP.white1, '氷の下の道', WHITE1_ROWS, WHITE1_OWLS, WHITE1_ROOMS, P, C10B_CHEST_IDS.white.slice(0, 2), 0);
  warp(m, P.up, LAKE_STAIRS10B.map, LAKE_LAND10B, 'right');
  warp(m, P.down, C10B_MAP.white2, { x: WHITE2_POS.up.x, y: WHITE2_POS.up.y - 1 }, 'up');
  const A = P.arrive;
  m.triggers.push({ id: 'c10b_white_in', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c10b_white_in', show: { not: [C10B_WHITE.in] } });
  // おまけ（青の 音で とける 氷の かべ）
  const M = P.melt;
  m.gates.push({ x: M.x, y: M.y, closed: T.C10B_MELTWALL, open: T.C10B_ICEFLOOR, flag: C10B_BONUS.white });
  m.actions.push({ x: M.x, y: M.y, script: 'c10b_melt', show: { not: [C10B_BONUS.white] } });
  m.chests.push({ id: C10B_CHEST_IDS.bonus.white, x: P.bonus.x, y: P.bonus.y, ...chestOf10b(C10B_CHEST_IDS.bonus.white) });
  return m;
}
function buildWhite2() {
  const P = WHITE2_POS;
  const m = sneakMap(C10B_MAP.white2, '氷の下の道　おく', WHITE2_ROWS, WHITE2_OWLS, WHITE2_ROOMS, P, C10B_CHEST_IDS.white.slice(2, 4), 1);
  warp(m, P.up, C10B_MAP.white1, { x: WHITE1_POS.down.x, y: WHITE1_POS.down.y + 1 }, 'down');
  warp(m, P.down, C10B_MAP.white3, { x: WHITE3_POS.up.x, y: WHITE3_POS.up.y - 1 }, 'up');
  m.triggers.push({ id: 'c10b_white2_in', x: P.up.x - 3, y: P.up.y - 2, w: 7, h: 2, script: 'c10b_white2_in', show: { not: [C10B_WHITE.two] } });
  return m;
}
function buildWhite3() {
  const P = WHITE3_POS;
  const t = parseRows16(WHITE3_ROWS, WHITE_LEGEND);
  const m = base(C10B_MAP.white3, '月の間', t, { bgm: C10B_TRACKS.white, bg2d: '#0a1428', sky3d: { bg: '#101c34', fog: 0x1c2c50 }, c10bMoon: true });
  warp(m, P.up, C10B_MAP.white2, { x: WHITE2_POS.down.x, y: WHITE2_POS.down.y + 1 }, 'down');
  cells10b(WHITE3_ROWS, 'c').forEach((p, i) => { const id = C10B_CHEST_IDS.white[4 + i]; m.chests.push({ id, x: p.x, y: p.y, ...chestOf10b(id) }); });
  const O = P.orb;
  m.npcs.push(npc('c10b_worb', '白い光の玉', [O.x, O.y], 'c10b_worb', 'c10b_worb', { dir: 'down', show: { not: [C10B_WHITE.note] } }));
  const B = P.bossScene;
  m.triggers.push({ id: 'c10b_owl_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10b_owl_event', show: { not: [C10B_WHITE.boss] } });
  m.npcs.push(npc('c10b_owl', C10B_WHITE_BOSS_NAME, [P.boss.x, P.boss.y], 'c10b_thief', 'c10b_owl_event', { dir: 'down', show: { not: [C10B_WHITE.boss] } }));
  // 岸への 氷の 階段（白の 音の あと。昼でも 使える）
  const S = P.iceStairs, SH = SHORE_STAIRS10B;
  m.gates.push({ x: S.x, y: S.y, closed: T.C10B_ICEFLOOR, open: T.C10B_ICESTAIRS, flag: C10B_WHITE.note });
  m.warps.push({ x: S.x, y: S.y, to: { map: SH.map, x: SH.x + 0.5, y: SH.y + 1.5, dir: 'down' }, show: { all: [C10B_WHITE.note] } });
  m.links.push({ x: S.x, y: S.y, to: SH.map });
  m.zoneAt = () => 'safe:moon';
  return m;
}

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// 白銀の湖の 小島: 光の 階段（c10b_start と 夜）・立てふだ（c10b_start。昼に 来た 人への しるし）・夜の 場面
export const NIGHT_STAIRS_FLAG = `@&${C10B.start}&@night`;
function attachLake(maps) {
  const m = maps[LAKE_STAIRS10B.map];
  const S = LAKE_STAIRS10B;
  const t0 = m.tiles[S.y * m.w + S.x];
  m.gates.push({ x: S.x, y: S.y, closed: t0, open: T.C10B_LIGHTSTAIRS, levels: [[NIGHT_STAIRS_FLAG, T.C10B_LIGHTSTAIRS]] });
  // 夜の 湖: 小島の まわりの 氷が すきとおる（すべる 氷の まま。絵だけ かわる。幕が 始まった 人の 夜だけ）
  for (let y = S.y - 6; y <= S.y + 4; y++) for (let x = S.x - 7; x <= S.x + 7; x++) {
    if (m.tiles[y * m.w + x] !== T.ICE || Math.hypot((x - S.x) / 7, (y - S.y + 1) / 5) > 1) continue;
    m.gates.push({ x, y, closed: T.ICE, open: T.C10B_SLIDE, levels: [[NIGHT_STAIRS_FLAG, T.C10B_SLIDE]] });
  }
  const A = WHITE1_POS.up;
  m.warps.push({ x: S.x, y: S.y, to: { map: C10B_MAP.white1, x: A.x + 0.5, y: A.y - 0.5, dir: 'up' }, show: { all: [C10B.start, '@night'] } });
  (m.links = m.links || []).push({ x: S.x, y: S.y, to: C10B_MAP.white1 });
  const G = LAKE_SIGN10B;
  m.npcs.push(npc('c10b_lake_sign', '光る立てふだ', [G.x, G.y], 'c10b_sign', 'c10b_lake_sign', { dir: 'down', show: { all: [C10B.start], not: [C10B_WHITE.note] } }));
  const E = LAKE_SCENE10B;
  m.triggers.push({ id: 'c10b_lake_night', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10b_lake_night', show: { all: [C10B.start, '@night'], not: [C10B_WHITE.in] } });
  // 岸の 氷の 階段（白の 音の あと。月の 間へ）
  const SH = SHORE_STAIRS10B;
  const t1 = m.tiles[SH.y * m.w + SH.x];
  m.gates.push({ x: SH.x, y: SH.y, closed: t1, open: T.C10B_ICESTAIRS, levels: [[C10B_WHITE.note, T.C10B_ICESTAIRS]] });
  const W3 = WHITE3_POS.iceStairs;
  m.warps.push({ x: SH.x, y: SH.y, to: { map: C10B_MAP.white3, x: W3.x + 0.5, y: W3.y - 0.5, dir: 'up' }, show: { all: [C10B_WHITE.note] } });
  m.links.push({ x: SH.x, y: SH.y, to: C10B_MAP.white3 });
  finishGates10b(m);
}
// ながれ星のくぼ地: 場面 0（音さを 鳴らす）・青と 白の 音の 台（置くと 光る）
function attachCraterPeds(maps) {
  const m = maps.c9a_crater;
  const E = CRATER_FORK10A;
  m.triggers.push({ id: 'c10b_fork_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10b_fork_event', show: { all: [C10B_ACT1], not: [C10B.start] } });
  const pair = [[PED_SO10B, C10B_PED.so, 'c10_ped_so', '青'], [PED_LA10B, C10B_PED.la, 'c10_ped_la', '白']];
  for (const [i, placed, script, color] of pair) {
    const old = m.npcs.find((n) => n.id === `c9c_ped${i + 1}`);
    const P = PEDESTALS9C[i];
    if (old) {
      old.show = { ...(old.show || {}), not: [...(old.show?.not || []), placed, C10B.act2] };
      old.script = script;
    }
    const sprite = `c10b_ped${i}_on`;
    m.npcs.push(npc(`${script}_on`, `${color}の音の台`, [P.x, P.y], sprite, script, { dir: 'down', show: { all: [placed] } }));
    m.npcs.push(npc(`${script}_on2`, `${color}の音の台`, [P.x, P.y], sprite, script, { dir: 'down', show: { all: [C10B.act2] } }));
  }
}

export function attachC10b(maps) {
  for (const m of [buildBlue1(), buildBlue2(), buildWhite1(), buildWhite2(), buildWhite3()]) {
    finishGates10b(m);
    maps[m.id] = m;
  }
  attachLake(maps);
  attachCraterPeds(maps);
}
export { C10B_MAP };
