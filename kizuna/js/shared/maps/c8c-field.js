// 第8章 第3幕（A: 世界と物語）千年前の ミドリナ地方（overworld_past。第6章の マップ）と 今の ミドリナ地方（overworld）に たす もの（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-2・8）
// ・千年前: 第3幕の はじめの 場面（c8c_arrive・泉の里に 入ると c8c_spring_arrive）・森（今の ささやきの森の 東の 原っぱ）に ささった ようさいの いかりと くさり
//   （リオンと しらべると のぼれる → ようさいの 1階）・時をこえる手紙（1 … 鏡の湖の 東の ほとりの 絵かきの 女の子・2 … 森の 入口の きこり）。
//   リオンと ミナモは 第3幕の あいだ 泉の里に いない（リオンは ゲスト・ミナモは ようさいの 上）
// ・今: 森に おちた ようさいの 残がい（c8_sky から 見える。c8_fortress の あと 出入り口が 開く → 空中ようさいの残がい）
//   時をこえる手紙を 見つける 所（今の 鏡の湖の 東の ほとり・ささやきの森の 入口）
// だいほんは data/story-c8c.js・data/sidequests-c8c.js
import { T, TILE_INFO } from '../tiles.js?v=8f3c13478779';
import { npc } from './npc.js?v=8f3c13478779';
import { SPRING, PAST_POS } from './past.js?v=8f3c13478779';
import {
  C8C, ARRIVE8C, ENTRY8C, CALM8C, LETTER8C, LETTER8C_SIDE, PAST_FIELD_ID, NOW_FIELD_ID, ENTRANCE8C, WRECK8C,
} from './c8c-flags.js?v=8f3c13478779';
import { c8cArrive, c8cMapId } from './c8c-fort.js?v=8f3c13478779';

const inRect = (x, y, r, pad = 0) => x >= r.x - pad && y >= r.y - pad && x < r.x + r.w + pad && y < r.y + r.h + pad;
// 森の 原っぱ（いかり・残がいの まわり）
export const FOREST8C = { x: 110, y: 30, w: 12, h: 8 };
export const FOREST8C_PAST_NAME = 'いかりの森';

// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
//   1 … 鏡の湖の 東の ほとり / 2 … ささやきの森の 入口の 草地
export const LETTER8C_SPOTS = { 1: { x: 101, y: 81 }, 2: { x: 93, y: 50 } };
export const LETTER8C_ASKERS = { 1: 'c8c_painter', 2: 'c8c_woodcutter' };
export const LETTER8C_PLACES = { 1: '鏡の湖のほとり', 2: '森の入口' };
export const LETTER8C_NOW_PLACES = { 1: '鏡の湖の東のほとり', 2: 'ささやきの森の入口' };
// たのむ 人（千年前。湖の 絵かきの 女の子・森の きこり）
export const ASKER8C_POS = { 1: { x: 102, y: 79 }, 2: { x: 90, y: 50 } };
export const C8C_FIELD_POS = {
  glass: { x: 82, y: 41 }, // 目標の しるし（今の ルミナの町の 東の 門の 外の 道）
  springIn: { x: SPRING.x + 14, y: SPRING.y + SPRING.h - 2 },
  stage: { x: SPRING.x + 13, y: SPRING.y + 2 }, // 泉の里の 場面の まん中（さらわれる 場面・さいごの 場面）
  rion: PAST_POS.rion, minamo: PAST_POS.minamo,
  entrance: ENTRANCE8C,
  out: { x: ENTRANCE8C.x, y: ENTRANCE8C.y + 1 },
};

// ───────────── 千年前の ミドリナ地方（overworld_past）に たす もの ─────────────
function addPast(m) {
  const E = ENTRANCE8C;
  // 森に ささった ようさいの いかり（第3幕で 泉の里の 場面の あと。リオンと しらべると くさりを のぼれる）。その 前は 木が 1本
  m.gates = m.gates.filter((g) => !(g.x === E.x && g.y === E.y));
  m.gates.push({ x: E.x, y: E.y, closed: T.TREE, open: T.C8C_CHAIN, levels: [[ENTRY8C, T.C8C_CHAIN], [C8C.spring, T.C8C_ANCHOR]] });
  m.warps.push({ x: E.x, y: E.y, to: c8cArrive(1) });
  m.links.push({ x: E.x, y: E.y, to: c8cMapId(1) });
  m.actions.push({ x: E.x, y: E.y, script: 'c8c_anchor', show: { not: [ENTRY8C] } });
  // 出入り口の 下は いつも 歩ける
  const O = C8C_FIELD_POS.out;
  if (TILE_INFO[m.tiles[O.y * m.w + O.x]]?.solid) m.tiles[O.y * m.w + O.x] = T.FOREST_FLOOR;
  // 第3幕で はじめて 来た（どこに 着いても）・泉の里に 着いた（c8_spring）
  m.triggers.push({ id: 'c8c_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c8c_arrive', show: { all: [C8C.sky], not: [ARRIVE8C] } });
  m.triggers.push({ id: 'c8c_spring_arrive', x: SPRING.x + 1, y: SPRING.y + 1, w: SPRING.w - 2, h: SPRING.h - 2, script: 'c8c_spring_arrive', show: { all: [ARRIVE8C], not: [C8C.spring] } });
  // 泉の里の リオン（第6章クリアの あとの 剣の けいこ。maps/tokei-high.js の rion_spar）は 第3幕の あいだ いない（ゲスト）。c8_bowser で もどる。
  //   ミナモ（第6章クリアの あとは 里に いなかった）は c8_bowser の あと 里の 家に
  const spar = m.npcs.find((n) => n.id === 'rion_spar');
  if (spar) {
    spar.show = { ...(spar.show || {}), not: [...(spar.show?.not || []), C8C.spring] };
    m.npcs.push({ ...spar, id: 'c8c_rion_back', show: { all: [...(spar.show.all || []), C8C.bowser] } });
  } else m.npcs.push(npc('c8c_rion_back', 'リオン', [PAST_POS.rion.x, PAST_POS.rion.y], 'rion', 'c6_rion_spar', { show: { all: [C8C.bowser] } }));
  m.npcs.push(npc('c8c_minamo_back', 'ミナモ', [PAST_POS.minamo.x, PAST_POS.minamo.y], 'minamo', 'c6_minamo_home', { show: { all: [C8C.bowser] } }));
  // さいごの 場面の とちゅうで 切れた ときの 続き（ようさいの 上の 場面を 見おえて、泉の里の 場面の 前）
  const st = C8C_FIELD_POS.stage;
  m.npcs.push(npc('c8c_minamo_wait', 'ミナモ', [st.x, st.y - 1], 'minamo', 'c8c_minamo_wait', { show: { all: [CALM8C], not: [C8C.bowser] } }));
  // 時をこえる手紙: たのむ 人・うめる 所（千年前。たのまれた あと・うめる まで）
  m.npcs.push(npc('c8c_painter', '湖の絵かきの女の子', [ASKER8C_POS[1].x, ASKER8C_POS[1].y], 'c8c_painter', 'c8c_painter', { dir: 'down', show: { all: [C8C.spring] } }));
  m.npcs.push(npc('c8c_woodcutter', '森のきこり', [ASKER8C_POS[2].x, ASKER8C_POS[2].y], 'c8c_woodcutter', 'c8c_woodcutter', { dir: 'right', show: { all: [C8C.spring] } }));
  for (const k of LETTER8C_SIDE) {
    const p = LETTER8C_SPOTS[k];
    m.npcs.push(npc(`c8c_bury_${k}`, '手紙をうめる場所', [p.x, p.y], 'capsule_hole', `c8c_letter_bury_${k}`, { solid: false, show: { all: [LETTER8C.start(k)], not: [LETTER8C.bury(k)] } }));
  }
  // 手紙の 場所・たのむ 人の 立つ マスは 歩ける ままに
  for (const p of [...Object.values(LETTER8C_SPOTS), ...Object.values(ASKER8C_POS)]) if (TILE_INFO[m.tiles[p.y * m.w + p.x]]?.solid) m.tiles[p.y * m.w + p.x] = T.GRASS;
  // 森の 原っぱの 名前・魔物は 出ない
  const area0 = m.areaName, zone0 = m.zoneAt;
  m.areaName = (x, y, ...r) => (inRect(x, y, FOREST8C) ? FOREST8C_PAST_NAME : area0(x, y, ...r));
  m.zoneAt = (x, y, ...r) => (inRect(x, y, FOREST8C, 1) ? 'safe:anchor' : zone0(x, y, ...r));
}

// ───────────── 今の ミドリナ地方（overworld）に たす もの ─────────────
function addPresent(s) {
  const E = ENTRANCE8C;
  // 森に おちた ようさいの 残がい（こけの 鉄の 板。c8_sky から 見える。その 前は 木）
  for (const [x, y] of WRECK8C) {
    s.gates = s.gates.filter((g) => !(g.x === x && g.y === y));
    s.gates.push({ x, y, closed: s.tiles[y * s.w + x], open: T.C8C_WRECK, flag: C8C.sky });
  }
  // 残がいの 出入り口（c8_sky から しまった 出入り口・c8_fortress の あと 開く）
  s.gates = s.gates.filter((g) => !(g.x === E.x && g.y === E.y));
  s.gates.push({ x: E.x, y: E.y, closed: T.TREE, open: T.C8C_HATCH, levels: [[C8C.fortress, T.C8C_HATCH], [C8C.sky, T.C8C_WRECKDOOR]] });
  s.warps.push({ x: E.x, y: E.y, to: c8cArrive(1, true), noMark: true /* 宝の地図の 目じるしに しない */ });
  (s.links = s.links || []).push({ x: E.x, y: E.y, to: c8cMapId(1, true) });
  s.actions.push({ x: E.x, y: E.y, script: 'c8c_door_now', show: { all: [C8C.sky], not: [C8C.fortress] } });
  const O = C8C_FIELD_POS.out;
  if (TILE_INFO[s.tiles[O.y * s.w + O.x]]?.solid) s.tiles[O.y * s.w + O.x] = T.FOREST_FLOOR;
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER8C_SIDE) {
    const p = LETTER8C_SPOTS[k];
    s.npcs.push(npc(`c8c_dig_${k}`, '時をこえる手紙', [p.x, p.y], 'capsule_spot', `c8c_letter_dig_${k}`, { solid: false, show: { all: [LETTER8C.bury(k)], not: [LETTER8C.found(k)] } }));
  }
  // 残がいの まわりは 魔物が 出ない（名前は ささやきの森の まま）
  const zone0 = s.zoneAt;
  s.zoneAt = (x, y, ...r) => (Math.abs(x - E.x) <= 2 && Math.abs(y - E.y) <= 2 ? 'safe:wreck' : zone0(x, y, ...r));
}

export function attachC8cField(maps) {
  addPast(maps[PAST_FIELD_ID]);
  addPresent(maps[NOW_FIELD_ID]);
  // とびらの 表を 作りなおす（ほかの 所〈2D の 絵・テスト〉は gateAt を そのまま 見るので、すぐ 作る）
  for (const id of [PAST_FIELD_ID, NOW_FIELD_ID]) { const m = maps[id]; m.gateAt = new Map((m.gates || []).map((g) => [g.y * m.w + g.x, g])); }
}
export { inRect };
