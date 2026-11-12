// 第8章 第1幕（A: 世界と物語）千年前の コガネ地方（c7_field。第7章の マップ）と 今の コガネ地方（south）に たす もの（maps/c8.js の attachCh8 で まぜる）
// ※ ネタバレ注意（docs/plan-ch8.md の 5）
// ・千年前: 緑の王国に 第8章の はじめの 場面（c8a_arrive・c8a_kingdom_arrive）・王の間の 東の すみの 月の 石板（王家の たてで 開くと 地下迷宮への かいだん）・
//   月の王宮の 番兵・お城の めし使い・王家の森の 番人（時をこえる手紙 2）。王さまと 王女ナディアは 第1幕の あいだ お城に いない（地下迷宮）
// ・今: 王都サファラの 宮殿の 王の間の おなじ 所に 月の 石板（c8_moon の あと 開く → サファラの宮殿の地下）
// ・時をこえる手紙（data/sidequests-c8a.js）: 千年前で うめる 所と、今の おなじ 座標で 見つける 所
//   1 … 騎士の 訓練場（騎士の 見習い）→ 今の 闘技場の 前 / 2 … 王家の森（森の 番人）→ 今の 王家のピラミッドの 前の 広場
// だいほんは data/story-c8.js
import { T, TILE_INFO } from '../tiles.js?v=eb1c3a4395d7';
import { npc } from './npc.js?v=eb1c3a4395d7';
import { C8, ARRIVE8, ENTRY8, KING8, LETTER8, LETTER8_SIDE, C7_FIELD_ID, SOUTH_ID, STAIR8 } from './c8a-flags.js?v=eb1c3a4395d7';
import { c8aArrive, c8aMapId } from './c8a-palace.js?v=eb1c3a4395d7';

const KX = 15, KY = 84;
const K = (x, y) => ({ x: KX + x, y: KY + y });
// 緑の王国（今の 王都サファラ）の まわり
export const KINGDOM8 = { x: KX, y: KY, w: 51, h: 40 };
const inRect = (x, y, r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;

// 時をこえる手紙の 場所（千年前で うめる 所と 今で 見つける 所は おなじ 座標）
export const LETTER8_SPOTS = { 1: K(44, 23), 2: { x: 95, y: 101 } };
export const LETTER8_ASKERS = { 1: 'c7_knight1', 2: 'c8a_ranger' };
export const LETTER8_PLACES = { 1: '騎士の訓練場', 2: '王家の森' };
export const LETTER8_NOW_PLACES = { 1: '王都サファラの闘技場の前', 2: '王家のピラミッドの前の広場' };
// 王家の森の 番人（千年前。今の ピラミッドの 前の 広場の 西の はし）
export const RANGER8 = { x: 92, y: 100 };
export const C8A_FIELD_POS = { kingdomIn: K(25, 13), throne: K(25, 26), hall: K(25, 24), stair: STAIR8, garden: K(25, 34), guard: K(34, 27), maid: K(19, 28) };

// ───────────── 千年前の コガネ地方（c7_field）に たす もの ─────────────
function addPast(m) {
  const S = STAIR8;
  // 王の間の 東の すみの 月の 石板（ENTRY8 で 地下への かいだん）
  m.tiles[S.y * m.w + S.x] = T.C8A_SLAB;
  m.gates.push({ x: S.x, y: S.y, closed: T.C8A_SLAB, open: T.STAIRS_DOWN, flag: ENTRY8 });
  m.warps.push({ x: S.x, y: S.y, to: c8aArrive(1) });
  m.links.push({ x: S.x, y: S.y, to: c8aMapId(1) });
  m.actions.push({ x: S.x, y: S.y, script: 'c8a_slab', show: { not: [ENTRY8] } });
  // 第8章で はじめて 来た（どこに 着いても）・王国に 着いた（c8_kingdom）
  m.triggers.push({ id: 'c8a_arrive', x: 0, y: 0, w: m.w, h: m.h, script: 'c8a_arrive', show: { all: [C8.start], not: [ARRIVE8] } });
  m.triggers.push({ id: 'c8a_kingdom_arrive', x: KX + 1, y: KY + 1, w: 49, h: 38, script: 'c8a_kingdom_arrive', show: { all: [ARRIVE8], not: [C8.kingdom] } });
  // 王さま・王女ナディアは 第1幕の あいだ 地下迷宮（もどって くると また お城に）
  for (const n of m.npcs) {
    if (n.id === 'c7_king') n.show = { not: [C8.kingdom] };
    if (n.id === 'c7_princess') n.show = { not: [C8.kingdom] };
  }
  m.npcs.push(npc('c8a_king_back', '緑の王', [C8A_FIELD_POS.throne.x, C8A_FIELD_POS.throne.y], 'c7_king', 'c7_king', { dir: 'up', show: { all: [KING8] } }));
  m.npcs.push(npc('c8a_princess_back', '王女ナディア', [C8A_FIELD_POS.garden.x, C8A_FIELD_POS.garden.y], 'c7_princess', 'c7_princess', { wander: 1, show: { all: [KING8] } }));
  // 月の王宮の 番兵（石板の そば）・お城の めし使い・王家の森の 番人
  m.npcs.push(npc('c8a_guard', '月の王宮の番兵', [C8A_FIELD_POS.guard.x, C8A_FIELD_POS.guard.y], 'c8a_guard', 'c8a_guard', { dir: 'left', show: { all: [C8.start] } }));
  m.npcs.push(npc('c8a_maid', 'お城のめし使い', [C8A_FIELD_POS.maid.x, C8A_FIELD_POS.maid.y], 'c8a_maid', 'c8a_maid', { wander: 1, show: { all: [C8.start] } }));
  m.npcs.push(npc('c8a_ranger', '王家の森の番人', [RANGER8.x, RANGER8.y], 'c8a_ranger', 'c8a_ranger', { dir: 'right', show: { all: [C8.kingdom] } }));
  // 時をこえる手紙: うめる 所（千年前。たのまれた あと・うめる まで）
  for (const k of LETTER8_SIDE) {
    const p = LETTER8_SPOTS[k];
    m.npcs.push(npc(`c8a_bury_${k}`, '手紙をうめる場所', [p.x, p.y], 'capsule_hole', `c8a_letter_bury_${k}`, { solid: false, show: { all: [LETTER8.start(k)], not: [LETTER8.bury(k)] } }));
  }
  // 手紙の 場所・番人の 所は 歩ける ままに（森で うめない）
  for (const p of [...Object.values(LETTER8_SPOTS), RANGER8]) if (TILE_INFO[m.tiles[p.y * m.w + p.x]]?.solid) m.tiles[p.y * m.w + p.x] = T.GRASS;
}

// ───────────── 今の コガネ地方（south）に たす もの ─────────────
function addPresent(s) {
  const S = STAIR8;
  // 今の 王の間の おなじ 所の 月の 石板（c8_moon の あと 開く → サファラの宮殿の地下）
  s.tiles[S.y * s.w + S.x] = T.C8A_SLAB;
  s.gates.push({ x: S.x, y: S.y, closed: T.C8A_SLAB, open: T.STAIRS_DOWN, flag: C8.moon });
  s.warps.push({ x: S.x, y: S.y, to: c8aArrive(1, true) });
  (s.links = s.links || []).push({ x: S.x, y: S.y, to: c8aMapId(1, true) });
  s.actions.push({ x: S.x, y: S.y, script: 'c8a_slab_now', show: { not: [C8.moon] } });
  // 時をこえる手紙: 見つける 所（今。千年前で うめた あと・見つける まで）
  for (const k of LETTER8_SIDE) {
    const p = LETTER8_SPOTS[k];
    s.npcs.push(npc(`c8a_dig_${k}`, '時をこえる手紙', [p.x, p.y], 'capsule_spot', `c8a_letter_dig_${k}`, { solid: false, show: { all: [LETTER8.bury(k)], not: [LETTER8.found(k)] } }));
  }
}

export function attachC8aField(maps) {
  addPast(maps[C7_FIELD_ID]);
  addPresent(maps[SOUTH_ID]);
  // とびらの 表を 作りなおす（ほかの 所〈2D の 絵・テスト〉は gateAt を そのまま 見るので、すぐ 作る）
  for (const id of [C7_FIELD_ID, SOUTH_ID]) { const m = maps[id]; m.gateAt = new Map((m.gates || []).map((g) => [g.y * m.w + g.x, g])); }
}
export { inRect };
