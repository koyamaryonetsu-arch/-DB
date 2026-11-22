// 第3部 第3章 第1幕「星の船と、星座の島」（第100回 A班: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）
// ・星の海 c11_sea（新しい 世界地図。船で すすむ。星の 流れ・あさせ。はとばで 島へ。章を 通して 使う）
// ・とまり木の島 c11a_perch（宿・店・いのりの いずみ・ヨイ）・星座の 島 c11a_isle1〜3（ひとふで書きの 星座 2つずつ・島の 明かり）
// ・今の マップに 足す 物は、フラグで 出る 物だけ（フラグの ない 人には 何も かわらない）:
//   ながれ星のくぼ地 … 場面 0 の マス（c10_act4 から。幕が 開いて いる 時だけ 動く）/
//   風の海の 灯台島 … レンズが うつした 星座（c11a_lens の 間だけ）/
//   星見の丘（overworld）… こぎ出す 場面の マス（c11a_chart から）・橋の たもとの 乗り場（c11a_launch から）
// ・星座の 星と 線は map.c11aCons（world/c11a-steps.js・client/c11a-view.js が 読む）。線は 空の 上（通れない マス）に 画面が かく
import { T, TILE_INFO } from '../tiles.js?v=c5f1443d1cb0';
import { npc } from './npc.js?v=c5f1443d1cb0';
import { parseRows16 } from './past.js?v=c5f1443d1cb0';
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=c5f1443d1cb0';
import {
  C11A, C11A_ACT0, C11A_LIGHTS, C11A_LENS, C11A_CON, C11A_MAP, C11A_MAP_IDS, C11A_CHEST_IDS, C11A_TRACKS, C11A_TABLE, C11A_PLACE,
} from './c11a-flags.js?v=c5f1443d1cb0';
import {
  SEA_ROWS, SEA_Y0, ISLES11A, SEA_DOCK11A, SEA_BRIDGE11A, SEA_ARRIVE11A, SEA_GATE11A, SEA_GATE_SCENE11A, CURRENTS11A,
  isleRows11a, ISLE1_CONS, ISLE2_CONS, ISLE3_CONS, ISLE_POS11A, PERCH_ROWS, PERCH_POS11A, LENS11A, LENS_LAND11A,
  HILL_SCENE11A, HILL_DOCK11A, HILL_BACK11A, CRATER_SCENE11A, cells11a,
} from './c11a-rows.js?v=c5f1443d1cb0';
import { CONSTELLATIONS11A } from '../data/constellations-c11a.js?v=c5f1443d1cb0';
import { SEA_PLACES } from './ch2.js?v=c5f1443d1cb0';
import { c11aChest, C11A_PERCH_ARMS, C11A_PERCH_TOOLS } from '../data/items-c11a.js?v=c5f1443d1cb0';
import { SHOPS } from '../data/shops.js?v=c5f1443d1cb0';

export const CH11A_MAPS = [...C11A_MAP_IDS];

// 宝箱の 中み（B班の data/items-c11a.js の c11aChest）
let chestFn11a = c11aChest;
export const setChestOf11a = (fn) => { chestFn11a = fn; };
export const chestOf11a = (id) => chestFn11a(id) || {};
// とまり木の島の 店（B班の 品の ならび C11A_PERCH_ARMS・C11A_PERCH_TOOLS で 2つ 作る。武具屋 c11a_perch_arms・道具屋 c11a_perch_tools）
export const SHOP11A = { arms: 'c11a_perch_arms', tools: 'c11a_perch_tools' };
if (!SHOPS[SHOP11A.arms]) SHOPS[SHOP11A.arms] = { name: 'とまり木の島の武具屋', kind: 'armor', keeper: '星のかけら屋', hello: 'いらっしゃい。\n星の海の、かるくて、じょうぶな防具だよ。', items: [...C11A_PERCH_ARMS] };
if (!SHOPS[SHOP11A.tools]) SHOPS[SHOP11A.tools] = { name: 'とまり木の島の道具屋', kind: 'item', keeper: '星のかけら屋', hello: 'いらっしゃい。\n旅の道具も、そろえておくれ。', items: [...C11A_PERCH_TOOLS] };
let perchShop11a = SHOP11A.arms;
export const setPerchShop11a = (id) => { perchShop11a = id; };
export const perchShopOf11a = () => perchShop11a;

const tableOr = (t, safe) => (ENCOUNTER_TABLES[t] ? t : safe);
const near = (list, x, y, r) => list.some((q) => Math.abs(q.x - x) <= r && Math.abs(q.y - y) <= r);
export const finishGates11a = (m) => { m.gateAt = new Map(m.gates.map((g) => [g.y * m.w + g.x, g])); };
const warp = (m, from, map, to, dir, show) => {
  m.warps.push({ x: from.x, y: from.y, to: { map, x: to.x + 0.5, y: to.y + 0.5, dir }, ...(show ? { show } : {}) });
  (m.links = m.links || []).push({ x: from.x, y: from.y, to: map });
};
const SKY = { bg2d: '#0c1030', sky3d: { bg: '#141a44', fog: 0x2a3060 }, dark: false };
const base = (id, name, kind, t, extra) => ({
  id, name, kind, w: t.w, h: t.h, tiles: t.tiles, gates: [],
  npcs: [], chests: [], signs: [], warps: [], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
  areaName: () => name, spawnCounts: {}, noExplore: true, c9dShowAll: true, zoneAt: () => 'safe:c11a', ...SKY, ...extra,
});

// ───── 星座（map.c11aCons）─────
// { id, name, rule, ox, oy, stars: [[x, y]（マップの マス）], lines, twins, entries: [星の 番号]（地面に ふれて いる 星）, land: 地面の マス }
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
export function placeCon11a(m, id, ox, oy, walk) {
  const C = CONSTELLATIONS11A[id];
  const stars = C.stars.map(([x, y]) => [ox + x, oy + y]);
  const isStar = (x, y) => stars.some(([sx, sy]) => sx === x && sy === y);
  const entries = [];
  let land = null;
  stars.forEach(([x, y], i) => {
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (isStar(nx, ny) || !walk(nx, ny)) continue;
      if (!entries.includes(i)) entries.push(i);
      land ||= { x: nx, y: ny };
    }
  });
  const con = { id, name: C.name, rule: C.rule, ox, oy, stars, lines: C.lines, twins: C.twins || [], entries, land };
  (m.c11aCons = m.c11aCons || []).push(con);
  return con;
}

// ───── 星の海 ─────
const SEA_LEGEND = {
  '#': T.C11A_CLOUD, '~': T.C11A_SEA, '^': T.C11A_CUR_N, '>': T.C11A_CUR_E, v: T.C11A_CUR_S, '<': T.C11A_CUR_W, ',': T.C11A_SHOAL,
  I: T.C11A_ISLE, P: T.C11A_PIER, B: T.C11A_BRIDGE, G: T.C11A_GATE, R: T.C11A_GATEROCK, M: T.C11A_MIST,
};
const ISLE_OF = { isle1: 1, isle2: 2, isle3: 3 };
function buildSea() {
  const t = parseRows16(SEA_ROWS, SEA_LEGEND);
  const m = base(C11A_MAP.sea, '星の海', 'field', t, {
    sailable: true, ship: 'star_ship', bgm: C11A_TRACKS.sea, c11aSea: true, outside: 'cloud', bg2d: '#0a0e2a', sky3d: { bg: '#10143a', fog: 0x202a5a },
  });
  const piers = [];
  // 島の はとば（ふむと 島へ）
  for (const [k, I] of Object.entries(ISLES11A)) {
    const to = k === 'perch' ? C11A_MAP.perch : C11A_MAP[k];
    const P = k === 'perch' ? PERCH_POS11A : ISLE_POS11A[ISLE_OF[k]];
    warp(m, I.pier, to, P.arrive, 'up');
    piers.push(I.pier);
  }
  // 橋の先の はとば（光の 橋を ふむと 星見の丘へ）
  for (const b of SEA_BRIDGE11A) warp(m, b, 'overworld', HILL_BACK11A, 'down');
  piers.push(SEA_DOCK11A);
  // 星座の門（幕の クリアで 開く。むこうは まだ 星の きり）
  for (let x = SEA_GATE11A.x; x < SEA_GATE11A.x + SEA_GATE11A.w; x++) {
    m.gates.push({ x, y: SEA_GATE11A.y, closed: T.C11A_GATE, open: T.C11A_GATE_OPEN, flag: C11A.act1 });
    m.actions.push({ x, y: SEA_GATE11A.y, script: 'c11a_gate' });
  }
  const G = SEA_GATE_SCENE11A;
  m.triggers.push({ id: 'c11a_pirate_event', x: G.x, y: G.y, w: G.w, h: G.h, script: 'c11a_pirate_event', show: { all: [...C11A_LIGHTS, C11A.beast], not: [C11A.pirate] } });
  m.areaName = (x, y) => {
    if (y < SEA_Y0 + 16) return '星の海　星座の門';
    if (x < 20) return '星の海　西';
    if (x > 44) return '星の海　東';
    if (y > SEA_Y0 + 48) return '星の海　橋の先';
    return '星の海';
  };
  // 魔物: しずかな 海の 上だけ（星の 流れ・はとばの まわり・門の 前は 出ない）
  const quiet = [...piers, { x: SEA_GATE11A.x + 1, y: SEA_GATE11A.y }, SEA_ARRIVE11A];
  m.zoneAt = (x, y) => {
    const t0 = m.tiles[y * m.w + x];
    if (t0 !== T.C11A_SEA || y < SEA_Y0 || near(quiet, x, y, 3)) return t0 === T.C11A_SEA ? 'safe:c11a_sea' : 'safe:c11a';
    return tableOr(C11A_TABLE.sea, 'safe:wait');
  };
  if (ENCOUNTER_TABLES[C11A_TABLE.sea]) m.spawnCounts = { [C11A_TABLE.sea]: 8 };
  m.c11aCurrents = CURRENTS11A;
  return m;
}

// ───── 星座の 島 ─────
const ISLE_LEGEND = {
  ' ': T.C11A_SKY, '.': T.C11A_GROUND, ':': T.C11A_GRASS, '%': T.C11A_RIM, '*': T.C11A_STAR, L: T.C11A_LIGHT, D: T.C11A_DOCK,
  c: T.C11A_GROUND, T: T.C11A_TREE, S: T.C11A_TABLET,
};
export const ISLE_NAMES11A = { 1: 'うさぎの島', 2: 'ながれ星の島', 3: 'ふたご星の島' };
const ISLE_CONS = { 1: ISLE1_CONS, 2: ISLE2_CONS, 3: ISLE3_CONS };
const ISLE_CHESTS = { 1: C11A_CHEST_IDS.slice(0, 3), 2: C11A_CHEST_IDS.slice(3, 5), 3: C11A_CHEST_IDS.slice(5, 7) };
function buildIsle(n) {
  const rows = isleRows11a(n, CONSTELLATIONS11A);
  const t = parseRows16(rows, ISLE_LEGEND);
  const id = C11A_MAP[`isle${n}`];
  const name = `星座の島　${ISLE_NAMES11A[n]}`;
  const m = base(id, name, 'dungeon', t, { bgm: C11A_TRACKS.isle, c11aIsle: n, c11aSky: true });
  const P = ISLE_POS11A[n];
  // 船着き場（ふむと 星の海の はとばの 前へ）
  const I = ISLES11A[`isle${n}`];
  warp(m, P.dock, C11A_MAP.sea, I.sea, 'down');
  // 島の 明かり（2つめの 星座が できると ともる）
  m.gates.push({ x: P.light.x, y: P.light.y, closed: T.C11A_LIGHT, open: T.C11A_LIGHT_ON, flag: C11A_LIGHTS[n - 1] });
  m.actions.push({ x: P.light.x, y: P.light.y, script: `c11a_light${n}` });
  // 3つめの 明かりを ともした 島で 星座の けもの（ここで 負けた 時の やり直しの マスも）
  m.triggers.push({ id: 'c11a_beast_event', x: P.light.x - 2, y: P.light.y + 1, w: 5, h: 3, script: 'c11a_beast_event', show: { all: [...C11A_LIGHTS], not: [C11A.beast] } });
  m.actions.push({ x: P.tablet.x, y: P.tablet.y, script: `c11a_tablet${n}` });
  // 宝箱
  cells11a(rows, 'c').forEach((p, i) => { const cid = ISLE_CHESTS[n][i]; if (cid) m.chests.push({ id: cid, x: p.x, y: p.y, ...chestOf11a(cid) }); });
  // 星座
  const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && '.:c'.includes(rows[y][x]) && rows[y][x] !== ' ';
  for (const C of ISLE_CONS[n]) placeCon11a(m, C.id, C.ox, C.oy, walk);
  m.areaName = () => name;
  // 魔物: 地面の 上（星座の まわり・船着き場・明かりの まわりは 出ない）
  const quiet = [P.dock, P.arrive, P.light, ...m.c11aCons.flatMap((C) => C.stars.map(([x, y]) => ({ x, y })))];
  m.zoneAt = (x, y) => {
    const ch = rows[y]?.[x];
    if (!'.:'.includes(ch) || ch === ' ' || near(quiet, x, y, 2)) return 'safe:c11a_isle';
    return tableOr(C11A_TABLE[`isle${n}`], 'safe:wait');
  };
  if (ENCOUNTER_TABLES[C11A_TABLE[`isle${n}`]]) m.spawnCounts = { [C11A_TABLE[`isle${n}`]]: 5 };
  return m;
}

// ───── とまり木の島 ─────
const PERCH_LEGEND = {
  ' ': T.C11A_SKY, '.': T.C11A_GROUND, ':': T.C11A_GRASS, '%': T.C11A_RIM, '=': T.C11A_PATH, H: T.C11A_HUT, D: T.C11A_DOCK,
  W: T.C11A_SPRING, T: T.C11A_TREE, c: T.C11A_GROUND,
};
function buildPerch() {
  const t = parseRows16(PERCH_ROWS, PERCH_LEGEND);
  const m = base(C11A_MAP.perch, 'とまり木の島', 'town', t, { bgm: C11A_TRACKS.perch, c11aSky: true, c11aPerch: true });
  const P = PERCH_POS11A;
  warp(m, P.dock, C11A_MAP.sea, ISLES11A.perch.sea, 'down');
  m.npcs.push(npc('c11a_yoi', 'おばあさん星のヨイ', [P.yoi.x, P.yoi.y], 'c11a_yoi', 'c11a_yoi', { dir: 'down' }));
  m.npcs.push(npc('c11a_inn', '宿屋のホタル', [P.inn.x, P.inn.y], 'c11a_folk1', 'c11a_inn', { dir: 'down' }));
  m.npcs.push(npc('c11a_shop', '星のかけら屋（防具）', [P.shop.x, P.shop.y], 'c11a_folk2', 'c11a_shop', { dir: 'down' }));
  m.npcs.push(npc('c11a_tools', '星のかけら屋（道具）', [P.shop.x - 2, P.shop.y], 'c11a_folk1', 'c11a_tools', { dir: 'down' }));
  P.folks.forEach((f, i) => m.npcs.push(npc(`c11a_folk${i + 1}`, ['星の子ども', '光の弱い星', 'ねむそうな星', 'しずかな星'][i], [f.x, f.y], `c11a_folk${(i % 3) + 1}`, `c11a_folk${i + 1}`, { dir: 'down', wander: i === 0 ? 2 : 0 })));
  m.actions.push({ x: P.spring.x, y: P.spring.y, script: 'c11a_spring' });
  const S = P.scene;
  m.triggers.push({ id: 'c11a_perch_event', x: S.x, y: S.y, w: S.w, h: S.h, script: 'c11a_perch_event', show: { all: [C11A.launch], not: [C11A.perch] } });
  cells11a(PERCH_ROWS, 'c').forEach((p, i) => { const cid = C11A_CHEST_IDS.slice(7)[i]; if (cid) m.chests.push({ id: cid, x: p.x, y: p.y, ...chestOf11a(cid) }); });
  return m;
}

// ───── 今の マップに 足す 物（フラグで 出る 物だけ）─────
// 風の海の 灯台島: レンズが うつした 星座（c11a_lens の 間だけ。灯台の 星座が できると もとの 草地）
function attachLens(maps) {
  const m = maps.sea;
  if (!m) return;
  const L = LENS11A;
  const C = CONSTELLATIONS11A[C11A_CON.con0];
  const starAt = new Set(C.stars.map(([x, y]) => `${L.ox + x},${L.oy + y}`));
  for (let y = L.oy; y < L.oy + L.h; y++) for (let x = L.ox; x < L.ox + L.w; x++) {
    const orig = m.tiles[y * m.w + x];
    const proj = starAt.has(`${x},${y}`) ? T.C11A_LENS_STAR : T.C11A_LENS;
    m.gates.push({ x, y, closed: orig, levels: [[C11A_CON.con0, orig], [C11A_LENS, proj]] });
  }
  const walk = (x, y) => {
    if (x >= L.ox && x < L.ox + L.w && y >= L.oy && y < L.oy + L.h) return false;
    return !(TILE_INFO[m.tiles[y * m.w + x]]?.solid ?? true);
  };
  const con = placeCon11a(m, C11A_CON.con0, L.ox, L.oy, walk);
  con.land = { ...LENS_LAND11A };
  con.lens = true;
  con.show = C11A_LENS;
  finishGates11a(m);
}
// 星見の丘: こぎ出す 場面（c11a_chart から）・橋の たもとの 乗り場（c11a_launch から。ふむと 星の海の 橋の先へ）
function attachHill(maps) {
  const ow = maps.overworld;
  if (!ow) return;
  const A = HILL_SCENE11A;
  ow.triggers.push({ id: 'c11a_launch_event', x: A.x, y: A.y, w: A.w, h: A.h, script: 'c11a_launch_event', show: { all: [C11A.chart], not: [C11A.launch] } });
  warp(ow, HILL_DOCK11A, C11A_MAP.sea, SEA_ARRIVE11A, 'up', { all: [C11A.launch] });
  ow.npcs.push(npc('c11a_dock', '星の船の乗り場', [HILL_DOCK11A.x, HILL_DOCK11A.y], 'c11a_dock_sign', 'c11a_dock', { solid: false, show: { all: [C11A.launch] } }));
}
// ながれ星のくぼ地: 場面 0（ガンツ。c10_act4 から）
function attachCrater(maps) {
  const m = maps.c9a_crater;
  if (!m) return;
  const E = CRATER_SCENE11A;
  m.triggers.push({ id: 'c11a_ship_event', x: E.x, y: E.y, w: E.w, h: E.h, script: 'c11a_ship_event', show: { all: [C11A_ACT0], not: [C11A.start] } });
}

export function attachC11a(maps) {
  for (const m of [buildSea(), buildPerch(), buildIsle(1), buildIsle(2), buildIsle(3)]) {
    finishGates11a(m);
    maps[m.id] = m;
  }
  attachLens(maps);
  attachHill(maps);
  attachCrater(maps);
  // ルーラ（行った 所）: とまり木の島（着くと おぼえる）
  const P = PERCH_POS11A;
  SEA_PLACES[C11A_PLACE] = { name: 'とまり木の島', map: C11A_MAP.perch, x: P.arrive.x, y: P.arrive.y, rect: [1, 1, 24, 17] };
}
export { C11A_MAP };
