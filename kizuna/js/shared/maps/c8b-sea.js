// 第8章 第2幕（A: 世界と物語）千年前の クモイの 海（c7s_sea。第7章の マップ）と 今の クモイ地方（kumoi）に たす もの（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 6）
// ・千年前: 第2幕の はじめの 場面（c8b_arrive・ナギの村に 入ると c8b_abyss_arrive）・うずしおの岩場（今の 雲から出てきた島と おなじ 場所の あさせ）と
//   青い うず（カイと しらべると 海の 底への かいだん）・大木の島から 岩場へ 流れる しお・岩場から 北へ 流れて 東への しお（w6）に 合流する しお・
//   時をこえる手紙（1 … かもめの小島の 女の子・2 … 大木の島の もぐり漁師）。海のほこらの みこは 第2幕の あいだ 村に いない（海底神殿 4階）
// ・今: 雲から出てきた島（海の 底が 空へ うかんだ 所）の 貝の もようの 石の とびら（c8_temple の あと 開く → 海底神殿のあと）
//   時をこえる手紙を 見つける 所（今の 西の風見の小島・根の島）
// だいほんは data/story-c8b.js・data/sidequests-c8b.js
import { T, TILE_INFO } from '../tiles.js?v=a13852808b4d';
import { hash2 } from '../rng.js?v=a13852808b4d';
import { npc } from './npc.js?v=a13852808b4d';
import { K5 } from './kumoi.js?v=a13852808b4d';
import { VILLAGE } from './c7s-flags.js?v=a13852808b4d';
import { C7S_POS } from './c7s-sea.js?v=a13852808b4d';
import {
  C8B, ARRIVE8B, ENTRY8B, CALM8B, LETTER8B, LETTER8B_SIDE, C7S_SEA_ID, KUMOI_ID, SHOAL8B, ENTRANCE8B, SHOAL_CUR_IN, SHOAL_CUR_OUT,
} from './c8b-flags.js?v=a13852808b4d';
import { c8bArrive, c8bMapId } from './c8b-temple.js?v=a13852808b4d';

const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
const shoalD = (x, y) => ((x + 0.5 - SHOAL8B.cx) / SHOAL8B.rx) ** 2 + ((y + 0.5 - SHOAL8B.cy) / SHOAL8B.ry) ** 2;
export const inShoal8b = (x, y) => shoalD(x, y) < 1;
export const SHOAL8B_NAME = 'うずしおの岩場';

// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
//   1 … かもめの小島（今の 西の風見の小島）/ 2 … 大木の島（今の 根の島）
export const LETTER8B_SPOTS = { 1: { x: 16, y: 15 }, 2: { x: 63, y: 53 } };
export const LETTER8B_ASKERS = { 1: 'c8b_gullgirl', 2: 'c8b_diver' };
export const LETTER8B_PLACES = { 1: 'かもめの小島', 2: '大木の島' };
export const LETTER8B_NOW_PLACES = { 1: '西の風見の小島', 2: '根の島' };
// たのむ 人（千年前。かもめの小島の 女の子・大木の島の もぐり漁師）
export const ASKER8B_POS = { 1: { x: 17, y: 13 }, 2: { x: 60, y: 49 } };
export const C8B_SEA_POS = {
  villageIn: C7S_POS.villageIn, elder: C7S_POS.elder, kaiHome: C7S_POS.kaiHome, shrine: C7S_POS.shrine,
  glass: C7S_POS.glass, // 目標の しるし（今の ハネノの島の 西の 船着き場の 道）
  rootWest: { x: SHOAL_CUR_IN.x1 + 1, y: SHOAL_CUR_IN.y }, // 大木の島の 西の はし（岩場への しおの のりば）
  rootIn: { x: 61, y: 48 }, // 大木の島に 着く ところ（ナギの村から 南へ 流れる しお w9 の 先）
  entrance: ENTRANCE8B,
  beach: C7S_POS.beach, // ナギの村の 南の 浜（さいごの 場面）
};

// ───────────── 千年前の クモイの 海（c7s_sea）に たす もの ─────────────
function addPast(m) {
  const has = (x, y) => m.gates.some((g) => g.x === x && g.y === y);
  const gate = (x, y, open) => {
    const k = y * m.w + x;
    m.gates = m.gates.filter((g) => !(g.x === x && g.y === y));
    m.gates.push({ x, y, closed: m.tiles[k], open, flag: C8B.sea });
  };
  // うずしおの岩場（あさせ。第2幕に なると 見える。まわりは あさい 海）
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    const d = shoalD(x, y);
    if (d >= 2.2 || has(x, y)) continue;
    const v = m.tiles[y * m.w + x];
    if (d < 1) gate(x, y, d > 0.7 ? T.SAND : hash2(x, y, 8201) < 0.12 ? T.C7S_REEF : T.SAND);
    else if (v === T.DEEP) gate(x, y, T.WATER);
  }
  // 大木の島の 西の はしから 岩場へ（西へ）・岩場から 北へ（40,44 の 東への しお w6 に 合流）
  for (let x = SHOAL_CUR_IN.x0; x <= SHOAL_CUR_IN.x1; x++) gate(x, SHOAL_CUR_IN.y, T.C7_CUR_W);
  for (let y = SHOAL_CUR_OUT.y0; y <= SHOAL_CUR_OUT.y1; y++) gate(SHOAL_CUR_OUT.x, y, T.C7_CUR_N);
  // 青い うず（第2幕に なると あらわれる。カイと しらべると 海の 底への かいだん）。うずの まわりの 岩場は いつも 歩ける
  const E = ENTRANCE8B;
  m.gates = m.gates.filter((g) => !(g.x === E.x && g.y === E.y));
  m.gates.push({ x: E.x, y: E.y, closed: m.tiles[E.y * m.w + E.x], open: T.STAIRS_DOWN, levels: [[ENTRY8B, T.STAIRS_DOWN], [C8B.sea, T.C8B_WHIRL]] });
  for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]]) {
    const x = E.x + dx, y = E.y + dy;
    m.gates = m.gates.filter((g) => !(g.x === x && g.y === y));
    m.gates.push({ x, y, closed: m.tiles[y * m.w + x], open: T.SAND, flag: C8B.sea });
  }
  m.warps.push({ x: E.x, y: E.y, to: c8bArrive(1) });
  m.links.push({ x: E.x, y: E.y, to: c8bMapId(1) });
  m.actions.push({ x: E.x, y: E.y, script: 'c8b_whirl', show: { all: [C8B.sea], not: [ENTRY8B] } });
  // 第2幕で はじめて 来た（どこに 着いても）・ナギの村に 着いた（c8_abyss）
  m.triggers.push({ id: 'c8b_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c8b_arrive', show: { all: [C8B.sea], not: [ARRIVE8B] } });
  m.triggers.push({ id: 'c8b_abyss_arrive', x: VILLAGE.x, y: VILLAGE.y, w: VILLAGE.w, h: VILLAGE.h, script: 'c8b_abyss_arrive', show: { all: [ARRIVE8B], not: [C8B.abyss] } });
  // 海のほこらの みこは 第2幕の あいだ 海底神殿（もどって くると また ほこらに）
  for (const n of m.npcs) if (n.id === 'c7s_shrine') n.show = { not: [C8B.abyss] };
  m.npcs.push(npc('c8b_miko_back', '海のほこらのみこ', [C8B_SEA_POS.shrine.x, C8B_SEA_POS.shrine.y], 'c7s_miko', 'c7s_shrine', { dir: 'right', show: { all: [C8B.hades] } }));
  // 時をこえる手紙: たのむ 人・うめる 所（千年前。たのまれた あと・うめる まで）
  m.npcs.push(npc('c8b_gullgirl', 'かもめの好きな女の子', [ASKER8B_POS[1].x, ASKER8B_POS[1].y], 'c8b_gullgirl', 'c8b_gullgirl', { dir: 'down', show: { all: [C8B.abyss] } }));
  m.npcs.push(npc('c8b_diver', 'もぐり漁師', [ASKER8B_POS[2].x, ASKER8B_POS[2].y], 'c8b_diver', 'c8b_diver', { dir: 'left', show: { all: [C8B.abyss] } }));
  for (const k of LETTER8B_SIDE) {
    const p = LETTER8B_SPOTS[k];
    m.npcs.push(npc(`c8b_bury_${k}`, '手紙をうめる場所', [p.x, p.y], 'capsule_hole', `c8b_letter_bury_${k}`, { solid: false, show: { all: [LETTER8B.start(k)], not: [LETTER8B.bury(k)] } }));
  }
  // 手紙の 場所・たのむ 人の 立つ マスは 歩ける ままに
  for (const p of [...Object.values(LETTER8B_SPOTS), ...Object.values(ASKER8B_POS)]) if (TILE_INFO[m.tiles[p.y * m.w + p.x]]?.solid) m.tiles[p.y * m.w + p.x] = T.SAND;
  // かんばん（大木の島の 西の はし）
  const sg = { x: C8B_SEA_POS.rootWest.x + 1, y: C8B_SEA_POS.rootWest.y - 1 };
  if (!TILE_INFO[m.tiles[sg.y * m.w + sg.x]]?.solid) {
    m.signs.push({ x: sg.x, y: sg.y, text: '流木の札だ。\n「← しおの流れにのると、うずしおの岩場へ」' });
    m.tiles[sg.y * m.w + sg.x] = T.SIGN;
  }
  // うずしおの岩場の 名前・魔物は 出ない
  const area0 = m.areaName, zone0 = m.zoneAt;
  m.areaName = (x, y, ...r) => (inShoal8b(x, y) ? SHOAL8B_NAME : area0(x, y, ...r));
  m.zoneAt = (x, y, ...r) => (shoalD(x, y) < 2.2 ? 'safe:shoal' : zone0(x, y, ...r));
}

// ───────────── 今の クモイ地方（kumoi）に たす もの ─────────────
function addPresent(s) {
  const E = ENTRANCE8B;
  // 雲から出てきた島（海の 底が 空へ うかんだ 所）の 貝の もようの 石の とびら（第2幕の 前は かたむいた 柱。c8_temple の あと 開く）
  s.gates = s.gates.filter((g) => !(g.x === E.x && g.y === E.y));
  s.gates.push({ x: E.x, y: E.y, closed: T.CLOUD_SEA, open: T.STAIRS_DOWN, levels: [[C8B.temple, T.STAIRS_DOWN], [C8B.sea, T.C8B_SHELLDOOR], [K5.shard, T.TILT_PILLAR]] });
  s.warps.push({ x: E.x, y: E.y, to: c8bArrive(1, true) });
  (s.links = s.links || []).push({ x: E.x, y: E.y, to: c8bMapId(1, true) });
  s.actions.push({ x: E.x, y: E.y, script: 'c8b_door_now', show: { all: [C8B.sea], not: [C8B.temple] } });
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER8B_SIDE) {
    const p = LETTER8B_SPOTS[k];
    s.npcs.push(npc(`c8b_dig_${k}`, '時をこえる手紙', [p.x, p.y], 'capsule_spot', `c8b_letter_dig_${k}`, { solid: false, show: { all: [LETTER8B.bury(k)], not: [LETTER8B.found(k)] } }));
  }
}

export function attachC8bSea(maps) {
  addPast(maps[C7S_SEA_ID]);
  addPresent(maps[KUMOI_ID]);
  // とびらの 表を 作りなおす（ほかの 所〈2D の 絵・テスト〉は gateAt を そのまま 見るので、すぐ 作る）
  for (const id of [C7S_SEA_ID, KUMOI_ID]) { const m = maps[id]; m.gateAt = new Map((m.gates || []).map((g) => [g.y * m.w + g.x, g])); }
}
export { inRect, CALM8B };
