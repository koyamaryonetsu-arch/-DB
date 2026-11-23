// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19）
// ・はかりの 回ろう（王宮の 下。暗い むらさきの 石・金の 天びんの もよう）: ゆか（701）/ かべ（702）/ 柱（722）
// ・かげの 台（703〜706。青・緑・赤・黄の ふち）・光の さく（707〜710。2コマ。台と 同じ 色）・食べられた さく（711）
// ・みぞ（712。2コマ）・スピカの 光の 橋（713。2コマ）・見はりの カードの 通り道（714）・階段（上 715・下 716）
// ・うらの 町の 古い 戸（717。2コマ）・ひと休みの いずみ（718。2コマ）・ゆか（723）・王宮の 大とびら（719・開いた 720。2コマ）・じゅうたん（721）
// どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js';
import { prand } from './pixel.js';

const GOLD = { d: '#a8801e', b: '#e8c040', l: '#ffe070', hl: '#fff8c8' };
const PED = { a: ['#5a8aff', '#c8d8ff'], b: ['#5ad870', '#c8f8d0'], c: ['#ff6a6a', '#ffd0d0'], d: ['#ffd84a', '#fff4c0'] };

function floor(p, v) {
  p.rect(0, 0, 16, 16, '#4a4060');
  p.hline(0, 15, 15, '#3a3050'); p.vline(15, 0, 15, '#3a3050');
  p.hline(0, 15, 0, '#5a5074'); p.vline(0, 0, 15, '#5a5074');
  const r = prand(v * 11 + 5);
  if (v % 4 === 0) { p.hline(5, 10, 8, '#6a5a3a'); p.vline(8, 6, 8, '#6a5a3a'); p.set(5, 9, '#6a5a3a'); p.set(10, 9, '#6a5a3a'); } // 天びんの もよう
  else if (v % 3 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, '#6a5e84');
}
function wall(p, v) {
  p.rect(0, 0, 16, 16, '#1a1428');
  p.hline(0, 15, 0, '#3a3050');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#0e0a18');
  for (let y = 0; y < 16; y += 4) p.vline(((y / 4 + v) % 2) * 8 + 3, y + 1, y + 3, '#0e0a18');
  if (v % 5 === 2) p.set(8, 2, GOLD.d);
}
function ped(p, v, c) {
  floor(p, 1);
  const [col, hl] = PED[c];
  p.ellipse(8, 9, 7, 5, '#14101e');
  p.ellipse(8, 8, 6, 4, '#2a2238');
  p.ellipse(8, 8, 4, 2.5, '#0a0812');
  for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; p.set(8 + Math.cos(t) * 6.5, 8.5 + Math.sin(t) * 4.5, a % 2 ? col : hl); }
}
export const FENCE_FRAMES11C = 2;
function fence(p, v, f, c) {
  floor(p, 2);
  const [col, hl] = PED[c];
  for (const x of [2, 6, 10, 14]) { p.vline(x, 0, 15, col); p.vline(x - 1, 0, 15, f ? hl : col); }
  for (const y of [3, 12]) p.hline(0, 15, y + f, hl);
  p.set(4, (v * 3 + f * 5) % 16, '#ffffff'); p.set(12, (v * 7 + f * 3 + 8) % 16, '#ffffff');
}
function fenceOff(p, v) {
  floor(p, v);
  for (const x of [1, 5, 9, 13]) p.set(x, 15, '#2a2238');
  p.set(3, 14, '#3a3050'); p.set(11, 14, '#3a3050');
}
export const GROOVE_FRAMES11C = 2;
function groove(p, v, f) {
  p.rect(0, 0, 16, 16, '#06040c');
  const r = prand(v * 17 + 3);
  for (let i = 0; i < 3; i++) p.hline(Math.floor(r() * 10), Math.floor(r() * 10) + 3, (Math.floor(r() * 16) + f * 3) % 16, '#1a1230');
  if (v % 3 === f) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#5a4a8a');
}
export const BRIDGE_FRAMES11C = 2;
function bridge(p, v, f) {
  groove(p, v, f);
  p.rect(2, 0, 12, 16, f ? '#e8f0ff' : '#d0dcff');
  for (let y = 1; y < 16; y += 4) p.hline(3, 12, y + f, '#ffffff');
  p.vline(2, 0, 15, '#a8c0ff'); p.vline(13, 0, 15, '#a8c0ff');
  p.set(5, (v + f * 7) % 16, '#fff8c0'); p.set(10, (v * 5 + 9) % 16, '#fff8c0');
}
function lane(p, v) {
  p.rect(0, 0, 16, 16, '#5a3e50');
  p.vline(0, 0, 15, '#7a5a6a'); p.vline(15, 0, 15, '#7a5a6a');
  for (let y = (v % 2) * 4; y < 16; y += 8) { p.hline(5, 10, y, '#8a6a7a'); p.hline(6, 9, y + 1, '#8a6a7a'); }
}
function stairs(p, up) {
  p.rect(0, 0, 16, 16, up ? '#5a5074' : '#2a2238');
  for (let i = 0; i < 4; i++) { p.rect(2, 2 + i * 3, 12, 2, up ? '#e8e4f8' : '#6a6088'); p.hline(2, 13, 4 + i * 3, up ? '#a8a4c8' : '#3a3050'); }
}
export const HALLDOOR_FRAMES11C = 2;
function hallDoor(p, v, f) {
  p.rect(0, 0, 16, 16, '#3a2a28');
  p.rect(2, 1, 12, 15, '#1a1020');
  p.rect(3, 2, 10, 14, f ? '#3a2a5a' : '#2a1a4a');
  for (let y = 4; y < 16; y += 3) p.set(8 + ((y + f) % 3) - 1, y, '#c8a0ff');
  p.vline(2, 1, 15, '#6a4a30'); p.vline(13, 1, 15, '#6a4a30'); p.hline(2, 13, 1, '#6a4a30');
}
export const SPRING_FRAMES11C = 2;
function spring(p, v, f) {
  restFloor(p, 2);
  p.ellipse(8, 9, 7, 5, '#8a7a6a');
  p.ellipse(8, 9, 5.5, 3.5, f ? '#a8e0ff' : '#88c8f0');
  p.set(6, 8 + f, '#ffffff'); p.set(10, 10 - f, '#ffffff');
}
function restFloor(p, v) {
  p.rect(0, 0, 16, 16, '#6a5a50');
  p.hline(0, 15, 7, '#5a4a40'); p.hline(0, 15, 15, '#5a4a40');
  p.vline((v % 2) * 8 + 3, 0, 6, '#5a4a40'); p.vline(((v + 1) % 2) * 8 + 3, 8, 14, '#5a4a40');
}
function bigDoor(p, v) {
  p.rect(0, 0, 16, 16, '#8a6a2a');
  p.rect(1, 0, 14, 16, '#c8a050');
  for (let y = 3; y < 16; y += 5) p.hline(1, 14, y, '#8a6a2a');
  p.vline(v % 2 ? 15 : 0, 0, 15, '#5a4010');
  if (v % 4 === 1) { p.hline(4, 11, 8, GOLD.hl); p.vline(8, 6, 8, GOLD.hl); p.set(4, 9, GOLD.hl); p.set(11, 9, GOLD.hl); }
}
export const BIGDOOR_FRAMES11C = 2;
function bigDoorOpen(p, v, f) {
  p.rect(0, 0, 16, 16, f ? '#ffffff' : '#fff8e0');
  p.vline(v % 2 ? 15 : 0, 0, 15, '#c8a050');
  for (let i = 0; i < 4; i++) p.set((v * 5 + i * 4 + f) % 16, (i * 5 + f * 2) % 16, '#fff0a0');
}
function carpet(p, v) {
  p.rect(0, 0, 16, 16, '#6a5aa8');
  p.vline(v % 2 ? 15 : 0, 0, 15, GOLD.b);
  if (v % 3 === 0) p.set(8, 8, GOLD.l);
}
function pillar(p) {
  floor(p, 1);
  p.rect(3, 0, 10, 16, '#3a3058'); p.vline(4, 0, 15, '#5a5078'); p.vline(11, 0, 15, '#2a2040');
  p.hline(2, 13, 0, GOLD.d); p.hline(2, 13, 15, GOLD.d);
}

export const C11C_PAINTERS = {
  [T.C11C_FLOOR]: (p, v) => floor(p, v),
  [T.C11C_WALL]: (p, v) => wall(p, v),
  [T.C11C_PED_A]: (p, v) => ped(p, v, 'a'),
  [T.C11C_PED_B]: (p, v) => ped(p, v, 'b'),
  [T.C11C_PED_C]: (p, v) => ped(p, v, 'c'),
  [T.C11C_PED_D]: (p, v) => ped(p, v, 'd'),
  [T.C11C_FENCE_A]: (p, v, f) => fence(p, v, f, 'a'),
  [T.C11C_FENCE_B]: (p, v, f) => fence(p, v, f, 'b'),
  [T.C11C_FENCE_C]: (p, v, f) => fence(p, v, f, 'c'),
  [T.C11C_FENCE_D]: (p, v, f) => fence(p, v, f, 'd'),
  [T.C11C_FENCE_OFF]: (p, v) => fenceOff(p, v),
  [T.C11C_GROOVE]: (p, v, f) => groove(p, v, f),
  [T.C11C_BRIDGE]: (p, v, f) => bridge(p, v, f),
  [T.C11C_LANE]: (p, v) => lane(p, v),
  [T.C11C_STAIRS_UP]: (p) => stairs(p, true),
  [T.C11C_STAIRS_DOWN]: (p) => stairs(p, false),
  [T.C11C_HALLDOOR]: (p, v, f) => hallDoor(p, v, f),
  [T.C11C_SPRING]: (p, v, f) => spring(p, v, f),
  [T.C11C_BIGDOOR]: (p, v) => bigDoor(p, v),
  [T.C11C_BIGDOOR_OPEN]: (p, v, f) => bigDoorOpen(p, v, f),
  [T.C11C_CARPET]: (p, v) => carpet(p, v),
  [T.C11C_PILLAR]: (p) => pillar(p),
  [T.C11C_REST_FLOOR]: (p, v) => restFloor(p, v),
};
export const C11C_FRAMES = {
  [T.C11C_FENCE_A]: FENCE_FRAMES11C, [T.C11C_FENCE_B]: FENCE_FRAMES11C, [T.C11C_FENCE_C]: FENCE_FRAMES11C, [T.C11C_FENCE_D]: FENCE_FRAMES11C,
  [T.C11C_GROOVE]: GROOVE_FRAMES11C, [T.C11C_BRIDGE]: BRIDGE_FRAMES11C, [T.C11C_HALLDOOR]: HALLDOOR_FRAMES11C, [T.C11C_SPRING]: SPRING_FRAMES11C,
  [T.C11C_BIGDOOR_OPEN]: BIGDOOR_FRAMES11C,
};
export const C11C_SPEED = {
  [T.C11C_FENCE_A]: 260, [T.C11C_FENCE_B]: 260, [T.C11C_FENCE_C]: 260, [T.C11C_FENCE_D]: 260,
  [T.C11C_GROOVE]: 1100, [T.C11C_BRIDGE]: 500, [T.C11C_HALLDOOR]: 700, [T.C11C_SPRING]: 600, [T.C11C_BIGDOOR_OPEN]: 400,
};

// ───── 2.5D ─────
// みぞは ずっと 下。光の 橋は みぞの 上に うかぶ。かげの 台は 少し 高い
export const C11C_FLOOR_H = {
  [T.C11C_GROOVE]: -1.0, [T.C11C_BRIDGE]: -0.02, [T.C11C_PED_A]: 0.05, [T.C11C_PED_B]: 0.05, [T.C11C_PED_C]: 0.05, [T.C11C_PED_D]: 0.05, [T.C11C_LANE]: -0.03,
};
export function c11cBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C11C_WALL: return { h: 1.6, top: t(), side: t() };
    case T.C11C_PILLAR: return { h: 1.8, top: ['t', T.C11C_WALL, v, 0], side: t() };
    case T.C11C_FENCE_A: case T.C11C_FENCE_B: case T.C11C_FENCE_C: case T.C11C_FENCE_D: return { h: 1.0, top: t(), side: t() };
    case T.C11C_BIGDOOR: case T.C11C_BIGDOOR_OPEN: return { h: 2.2, top: ['t', T.C11C_WALL, v, 0], side: t() };
    default: return null;
  }
}
export const C11C_PROPS = {
  [T.C11C_SPRING]: [16, 18, (p) => { p.ellipse(8, 14, 7, 3, '#8a7a6a'); p.ellipse(8, 13, 5, 2, '#a8e0ff'); p.vline(8, 3, 12, '#d8f0ff'); p.set(8, 2, '#ffffff'); p.set(7, 5, '#ffffff'); }],
};
export const C11C_PROPS_KEEP = new Set(Object.keys(C11C_PROPS).map(Number));
export const C11C_THEMES = {};
