// 第3部 第2章 第1幕「赤と緑」（第94回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13）
// ・赤 … 炎の山の 下の 古い 道 c10r_1・c10r_2・熱の 間 c10r_3（溶岩に 追われる しくみは world/c10a-steps.js・client/c10a-view.js）
// ・緑 … 大地の下の 根の国 c10g_1・c10g_2（音の 草木。つぼみ・つる・大きな 葉・きのこ・見はらし台）
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   炎の山の 火口（volcano3）… ひえた 溶岩（黒い 石）・まん中の 下り 階段（c10_start から）
//   大地の下（c9b_under）… 西の がけの たれ下がる 根（c10_start から）
//   ささやきの森の ひらけた 所（overworld）… 切りかぶの 近道（c10_note_fa から）
//   ながれ星のくぼ地 … 場面 0 の マス（c9_act4 から。幕が 開いて いる 時だけ 動く）・赤と 緑の 音の 台（音を 置くと 光る）
// ・「行った 所」の 記録は 5まいとも 取らない（map.noExplore。引っこしコードを のばさない）。地図は 全部 見える（c9dShowAll）
import { T } from '../tiles.js?v=cbd3e0b1870d';
import { npc } from './npc.js?v=cbd3e0b1870d';
import { parseRows16 } from './past.js?v=cbd3e0b1870d';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=cbd3e0b1870d';
import {
  R1_ROWS, R2_ROWS, R3_ROWS, G1_ROWS, G2_ROWS, C10A_POS, cells10a, CRATER_STAIRS10A, CRATER_SCENE10A, UNDER_ROOT10A, STUMP10A,
  PED_RE10A, PED_FA10A, CRATER_FORK10A,
} from './c10a-rows.js?v=cbd3e0b1870d';
import {
  C10A, C10A_ACT4, C10A_RED, C10A_GREEN, C10A_BUDS, C10A_LEVERS, C10A_BONUS, C10A_PED, C10A_MAP, C10A_MAP_IDS, C10A_TABLE, C10A_CHEST_IDS,
  C10A_TRACKS, C10A_RED_BOSS_NAME, C10A_GREEN_BOSS_NAME,
} from './c10a-flags.js?v=cbd3e0b1870d';
import { PEDESTALS9C } from './c9c.js?v=cbd3e0b1870d';
import { c10aChest } from '../data/items-c10a.js?v=cbd3e0b1870d';

export const CH10A_MAPS = [...C10A_MAP_IDS];

// 宝箱の 中み（B班の data/items-c10a.js の c10aChest。14この id）
export const chestOf10a = (id) => c10aChest(id) || {};

const base = (id, name, t, extra) => ({
  id, name, kind: 'dungeon', w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, ...extra,
});
export const finishGates10a = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };
// 魔物の 出る 表（B班の data/encounters-c10a.js。ない 時は 出さない）
const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const below = (p) => ({ x: p.x, y: p.y + 1 });
const above = (p) => ({ x: p.x, y: p.y - 1 });

// ───── 赤: 炎の山の 下の 古い 道 ─────
const RED_LEGEND = {
  '#': T.C10A_WALL, '.': T.C10A_ROAD, V: T.C10A_GLOW, B: T.LAVA, L: T.LEVER, c: T.C10A_ROAD, U: T.STAIRS_UP, D: T.STAIRS_DOWN,
  w: T.C10A_VINEWALL, O: T.C10A_ORB,
};
export const leverScript10a = (n) => `c10r_lv${n}`;
function redMap(id, name, rows, P, chests, table) {
  const t = parseRows16(rows, RED_LEGEND);
  const m = base(id, name, t, {
    bgm: C10A_TRACKS.road, theme: 'lava', bg2d: '#0e0604', sky3d: { bg: '#1a0604', fog: 0x2a0a04 }, weather: 'embers',
    c10Red: true, spawnCounts: table ? { [table]: 7 } : {},
  });
  // レバー と 溶岩の 川（引くと 黒い 石の 近道）
  for (const L of P.levers || []) {
    const f = C10A_LEVERS[L.n - 1];
    m.gates.push({ x: L.x, y: L.y, closed: T.LEVER, open: T.LEVER_ON, flag: f });
    m.actions.push({ x: L.x, y: L.y, script: leverScript10a(L.n) });
  }
  for (const R of P.lava || []) {
    const f = C10A_LEVERS[R.lever - 1];
    for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0; x <= R.x1; x++) m.gates.push({ x, y, closed: T.LAVA, open: T.OBSIDIAN, flag: f });
  }
  cells10a(rows, 'c').forEach((p, i) => m.chests.push({ id: chests[i], x: p.x, y: p.y, ...chestOf10a(chests[i]) }));
  // 魔物: 階段の まわりは 出ない。溶岩から にげて いる 間は 出ない（world/c10a-steps.js の symBlock）
  const ups = [P.up, P.down].filter(Boolean);
  m.zoneAt = (x, y) => {
    if (!table || ups.some((s) => Math.abs(s.x - x) <= 4 && Math.abs(s.y - y) <= 3)) return 'safe:road';
    const tile = m.tiles[y * m.w + x];
    if (tile !== T.C10A_ROAD) return 'safe:road';
    return tableOr(table, 'safe:wait');
  };
  return m;
}
function buildR1() {
  const P = C10A_POS.c10r_1;
  const m = redMap(C10A_MAP.r1, '炎の山　古い道　1階', R1_ROWS, P, C10A_CHEST_IDS.red.slice(0, 2), C10A_TABLE.r1);
  warp(m, P.up, CRATER_STAIRS10A.map, below(CRATER_STAIRS10A), 'down');
  warp(m, P.down, C10A_MAP.r2, below(C10A_POS.c10r_2.up), 'down');
  m.areaName = (x, y) => (y >= 18 && y <= 20 ? '炎の山　古い道　ようがんの川' : '炎の山　古い道　1階');
  return m;
}
function buildR2() {
  const P = C10A_POS.c10r_2;
  const m = redMap(C10A_MAP.r2, '炎の山　古い道　2階', R2_ROWS, P, [C10A_CHEST_IDS.bonus.red, ...C10A_CHEST_IDS.red.slice(2, 4)], C10A_TABLE.r2);
  // 宝箱の じゅん（文字の じゅん）: おまけ（19行め 4）は いちばん 先に 出ないので、場所で 入れなおす
  m.chests = [];
  const ids = { [`${P.bonus.x},${P.bonus.y}`]: C10A_CHEST_IDS.bonus.red };
  const rest = [...C10A_CHEST_IDS.red.slice(2, 4)];
  for (const p of cells10a(R2_ROWS, 'c')) {
    const id = ids[`${p.x},${p.y}`] || rest.shift();
    m.chests.push({ id, x: p.x, y: p.y, ...chestOf10a(id) });
  }
  warp(m, P.up, C10A_MAP.r1, above(C10A_POS.c10r_1.down), 'up');
  warp(m, P.down, C10A_MAP.r3, below(C10A_POS.c10r_3.up), 'down');
  // おまけの 部屋（緑の 音で つるの かべが ひらく）
  const W = P.vineWall;
  m.gates.push({ x: W.x, y: W.y, closed: T.C10A_VINEWALL, open: T.C10A_VINEWALL_OPEN, flag: C10A_BONUS.red });
  m.actions.push({ x: W.x, y: W.y, script: 'c10r_vinewall', show: { not: [C10A_BONUS.red] } });
  return m;
}
function buildR3() {
  const P = C10A_POS.c10r_3;
  const m = redMap(C10A_MAP.r3, '炎の山　熱の間', R3_ROWS, P, C10A_CHEST_IDS.red.slice(4, 6), null);
  warp(m, P.up, C10A_MAP.r2, above(C10A_POS.c10r_2.down), 'up');
  m.actions.push({ x: P.orb.x, y: P.orb.y, script: 'c10r_orb' });
  const B = P.bossScene;
  m.triggers.push({ id: 'c10r_boss_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10r_boss_event', show: { all: [C10A_RED.stairs], not: [C10A_RED.boss] } });
  m.npcs.push(npc('c10r_tamagon', C10A_RED_BOSS_NAME, [P.boss.x, P.boss.y], 'c10r_tamagon', 'c10r_boss_event', { dir: 'down', big: true, show: { all: [C10A_RED.stairs], not: [C10A_RED.boss] } }));
  m.zoneAt = () => 'safe:heat';
  return m;
}

// ───── 緑: 大地の下の 根の国 ─────
const GREEN_LEGEND = {
  '#': T.C10A_ROOTWALL, '.': T.C10A_GROUND, ',': T.C10A_SPORE, '~': T.C10A_GAP, '=': T.C10A_CLIFF, b: T.C10A_BUD, v: T.C10A_CLIFF, l: T.C10A_GAP,
  m: T.C10A_SPROUT, O: T.C10A_LOOKOUT, T: T.C10A_TREE, H: T.C10A_HOLLOW, i: T.C10A_ICEBUD, c: T.C10A_GROUND, S: T.STAIRS_DOWN, N: T.C10A_HOLLOW,
  r: T.C10A_ROOT_H, q: T.C10A_ROOT_V,
};
export const budScript10a = (n) => `c10g_bud${n}`;
function greenMap(id, name, rows, P, chests, table, lookN) {
  const t = parseRows16(rows, GREEN_LEGEND);
  const m = base(id, name, t, {
    bgm: C10A_TRACKS.roots, bg2d: '#05040c', sky3d: { bg: '#0a1c22', fog: 0x0e2a2c }, dark: false,
    c10Green: true, spawnCounts: { [table]: 10 },
  });
  // 音の つぼみ（星の音さで さく）と のびる 草木（つる・大きな 葉・きのこ）
  for (const b of P.buds) {
    const f = C10A_BUDS[b.n - 1];
    m.gates.push({ x: b.x, y: b.y, closed: T.C10A_BUD, open: T.C10A_BUD_OPEN, flag: f });
    m.actions.push({ x: b.x, y: b.y, script: budScript10a(b.n) });
  }
  for (const L of P.leaves) {
    const f = C10A_BUDS[L.bud - 1];
    for (let y = L.y0; y <= L.y1; y++) for (let x = L.x0; x <= L.x1; x++) m.gates.push({ x, y, closed: T.C10A_GAP, open: T.C10A_LEAF, flag: f });
  }
  for (const v of P.vines) m.gates.push({ x: v.x, y: v.y, closed: T.C10A_CLIFF, open: T.C10A_VINE, flag: C10A_BUDS[v.bud - 1] });
  for (const s of P.shrooms) {
    const f = C10A_BUDS[s.bud - 1];
    m.gates.push({ x: s.x, y: s.y, closed: T.C10A_SPROUT, open: T.C10A_SHROOM, flag: f });
    m.warps.push({ x: s.x, y: s.y, to: { map: id, x: s.to.x + 0.5, y: s.to.y + 0.5, dir: 'down' }, show: { all: [f] }, c10Bounce: true });
    // 高い 台から とびおりる きのこ（いつでも）
    m.tiles[s.back.y * m.w + s.back.x] = T.C10A_SHROOM;
    m.warps.push({ x: s.back.x, y: s.back.y, to: { map: id, x: s.back.to.x + 0.5, y: s.back.to.y + 0.5, dir: 'down' }, c10Bounce: true });
  }
  // 見はらし台
  m.actions.push({ x: P.lookout.x, y: P.lookout.y, script: `c10g_look${lookN}` });
  if (chests.length) cells10a(rows, 'c').forEach((p, i) => m.chests.push({ id: chests[i], x: p.x, y: p.y, ...chestOf10a(chests[i]) }));
  const S = P.south;
  m.zoneAt = (x, y) => {
    if (Math.abs(x - S.x) <= 5 && y >= S.y - 5) return 'safe:roots';
    const tile = m.tiles[y * m.w + x];
    if (tile !== T.C10A_GROUND && tile !== T.C10A_SPORE && tile !== T.C10A_ROOT_H && tile !== T.C10A_ROOT_V) return 'safe:roots';
    return tableOr(table, 'safe:wait');
  };
  return m;
}
function buildG1() {
  const P = C10A_POS.c10g_1;
  const ids = [C10A_CHEST_IDS.green[0], C10A_CHEST_IDS.green[1], C10A_CHEST_IDS.green[2]];
  const m = greenMap(C10A_MAP.g1, '根の国', G1_ROWS, P, [], C10A_TABLE.g1, 1);
  // 宝箱（場所で 入れる。おまけは 東の 小部屋）
  const byPos = { [`${P.bonus.x},${P.bonus.y}`]: C10A_CHEST_IDS.bonus.green };
  for (const p of cells10a(G1_ROWS, 'c')) {
    const id = byPos[`${p.x},${p.y}`] || ids.shift();
    m.chests.push({ id, x: p.x, y: p.y, ...chestOf10a(id) });
  }
  const R = UNDER_ROOT10A;
  warp(m, P.south, R.map, { x: R.x + 1, y: R.y }, 'right');
  warp(m, P.north, C10A_MAP.g2, above(C10A_POS.c10g_2.south), 'up');
  // おまけ（赤の 音で 火の 花）
  const I = P.iceBud;
  m.gates.push({ x: I.x, y: I.y, closed: T.C10A_ICEBUD, open: T.C10A_FIREBLOOM, flag: C10A_BONUS.green });
  m.actions.push({ x: I.x, y: I.y, script: 'c10g_icebud', show: { not: [C10A_BONUS.green] } });
  m.areaName = (x, y) => (y >= 25 ? '根の国　下の原' : y >= 12 ? '根の国　まん中の原' : x <= 11 ? '根の国　西の高い台' : '根の国　上の段');
  return m;
}
function buildG2() {
  const P = C10A_POS.c10g_2;
  const m = greenMap(C10A_MAP.g2, '根の国　大木の原', G2_ROWS, P, C10A_CHEST_IDS.green.slice(3, 6), C10A_TABLE.g2, 2);
  warp(m, P.south, C10A_MAP.g1, below(C10A_POS.c10g_1.north), 'down');
  // 大木の うろ: 緑の 音の 場面（だんしゃくに 勝った あと）・ささやきの森の 切りかぶへの 近道（緑の 音の あと）
  for (const h of P.hollow) {
    m.triggers.push({ id: 'c10g_note_event', x: h.x, y: h.y, w: 1, h: 1, script: 'c10g_note_event', show: { all: [C10A_GREEN.boss], not: [C10A_GREEN.note] } });
    m.warps.push({ x: h.x, y: h.y, to: { map: STUMP10A.map, x: STUMP10A.x - 1 + 0.5, y: STUMP10A.y + 1 + 0.5, dir: 'down' }, show: { all: [C10A_GREEN.note] } });
    m.links.push({ x: h.x, y: h.y, to: STUMP10A.map });
  }
  const B = P.bossScene;
  m.triggers.push({ id: 'c10g_boss_event', x: B.x, y: B.y, w: B.w, h: B.h, script: 'c10g_boss_event', show: { not: [C10A_GREEN.boss] } });
  m.npcs.push(npc('c10g_mold', C10A_GREEN_BOSS_NAME, [P.boss.x, P.boss.y], 'c10g_mold', 'c10g_boss_event', { dir: 'down', show: { not: [C10A_GREEN.boss] } }));
  // 大木の 前は 魔物が 出ない
  const z0 = m.zoneAt;
  m.zoneAt = (x, y) => (y <= 13 && x >= 12 && x <= 34 ? 'safe:tree' : z0(x, y));
  m.areaName = (x, y) => (y >= 30 ? '根の国　大木の原' : y >= 17 ? '根の国　大木の原' : x >= 39 ? '根の国　東の高い台' : '根の国　かれた大木');
  return m;
}

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// 炎の山の 火口: 星ふるえで ひえた 溶岩（黒い 石）・まん中の 下り 階段（c10_start から）
function attachCrater3(maps) {
  const m = maps[CRATER_STAIRS10A.map];
  const S = CRATER_STAIRS10A;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const t = m.tiles[y * m.w + x];
    if (t === T.LAVA || t === T.LAVA_FLOOR) m.gates.push({ x, y, closed: t, open: T.OBSIDIAN, levels: [[C10A.start, T.OBSIDIAN]] });
  }
  m.gates.push({ x: S.x, y: S.y, closed: m.tiles[S.y * m.w + S.x], open: T.STAIRS_DOWN, levels: [[C10A.start, T.STAIRS_DOWN]] });
  warp(m, S, C10A_MAP.r1, below(C10A_POS.c10r_1.up), 'down', { all: [C10A.start] });
  const E = CRATER_SCENE10A;
  m.triggers.push({ id: 'c10r_crater', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10r_crater', show: { all: [C10A.start], not: [C10A_RED.stairs] } });
  finishGates10a(m);
}
// 大地の下: 西の がけの たれ下がる 根（c10_start から。しらべて 音さを 鳴らすと 足場の きのこが 生える）
function attachUnder(maps) {
  const R = UNDER_ROOT10A;
  const m = maps[R.map];
  m.gates.push({ x: R.x, y: R.y, closed: m.tiles[R.y * m.w + R.x], open: T.C10A_HANGROOT, levels: [[C10A.start, T.C10A_HANGROOT]] });
  m.actions.push({ x: R.x, y: R.y, script: 'c10g_root', show: { all: [C10A.start] } });
  (m.links = m.links || []).push({ x: R.x, y: R.y, to: C10A_MAP.g1 });
  finishGates10a(m);
}
// ささやきの森の ひらけた 所: 切りかぶの 近道（緑の 音の あと。大木の うろと つながる）
function attachStump(maps) {
  const S = STUMP10A;
  const m = maps[S.map];
  m.gates.push({ x: S.x, y: S.y, closed: m.tiles[S.y * m.w + S.x], open: T.C10A_STUMP, levels: [[C10A_GREEN.note, T.C10A_STUMP]] });
  const H = C10A_POS.c10g_2.hollow[0];
  m.warps.push({ x: S.x, y: S.y, to: { map: C10A_MAP.g2, x: H.x + 0.5, y: H.y + 2.5, dir: 'down' }, show: { all: [C10A_GREEN.note] } });
  finishGates10a(m);
}
// ながれ星のくぼ地: 場面 0（音さを 鳴らす）・赤と 緑の 音の 台（置くと 光る）
function attachCraterPeds(maps) {
  const m = maps.c9a_crater;
  const E = CRATER_FORK10A;
  m.triggers.push({ id: 'c10_fork_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c10_fork_event', show: { all: [C10A_ACT4], not: [C10A.start] } });
  const pair = [[PED_RE10A, C10A_PED.re, 'c10_ped_re', '赤'], [PED_FA10A, C10A_PED.fa, 'c10_ped_fa', '緑']];
  for (const [i, placed, script, color] of pair) {
    const old = m.npcs.find((n) => n.id === `c9c_ped${i + 1}`);
    const P = PEDESTALS9C[i];
    if (old) {
      // 光って いない 台（今の まま）。音を 置いたら かくす。しらべた 時の 台本は 前の 台本に もどる（data/story-c10a.js）
      old.show = { ...(old.show || {}), not: [...(old.show?.not || []), placed, C10A.act1] };
      old.script = script;
    }
    const sprite = `c10a_ped${i}_on`;
    m.npcs.push(npc(`${script}_on`, `${color}の音の台`, [P.x, P.y], sprite, script, { dir: 'down', show: { all: [placed] } }));
    m.npcs.push(npc(`${script}_on2`, `${color}の音の台`, [P.x, P.y], sprite, script, { dir: 'down', show: { all: [C10A.act1] } }));
  }
}

export function attachC10a(maps) {
  for (const m of [buildR1(), buildR2(), buildR3(), buildG1(), buildG2()]) {
    finishGates10a(m);
    maps[m.id] = m;
  }
  attachCrater3(maps);
  attachUnder(maps);
  attachStump(maps);
  attachCraterPeds(maps);
}
export { C10A_MAP };
