// 第3部 第2章 第2幕「青と白」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14）
// ・水鏡の うら: 青い 石の かべ（521）/ 湖の 底（522）・中の 段（523）・高い 岸（524）/ がけ（525）/ 水（526。2コマ）・ふかい 水（550。2コマ）/
//   坂（527）/ 飛びこめる ふち（528）/ 音の かね（529）/ 流れる 水路（530・531。2コマ）/ 水路の 穴（532）/ かぎの 石（533）/ とびら（534）/
//   うず（535。2コマ）・こおった 橋（536）
// ・かれた 間: 青い 光の 玉（537。2コマ）/ 砂の ゆか（538）/ わき水（539。2コマ）
// ・氷の 下: ゆか（540）/ かべ（541）/ すべる 氷（542）/ 雪の 山（543）/ うすい 氷（544）/ 氷の 柱（545）/ とける 氷の かべ（546）/ 月の 光の ゆか（547）
// ・今の マップに フラグで 出る 物: 光の 階段（548。白銀の湖の 小島。2コマ）/ 氷の 階段（549。湖の 岸）
// どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js?v=96e031897dcd';
import { prand } from './pixel.js?v=96e031897dcd';
import { THEME_PARTS } from './tiles-castle.js?v=96e031897dcd';

const BS = { d: '#18222e', b: '#3a4a5c', l: '#52667a', hl: '#7a90a6' }; // 青い 石の かべ
const F0 = { d: '#4a5856', b: '#6a7a78', l: '#86968e', hl: '#a8b8b0' }; // 湖の 底（ぬれた 石・もの すじ）
const F1 = { d: '#4a6478', b: '#7a96a8', l: '#94b0c0', hl: '#c0d8e4' }; // 中の 段
const F2 = { d: '#7890a0', b: '#a8c0cc', l: '#c4d8e0', hl: '#eef6fa' }; // 高い 岸
const WA = { d: '#164a8a', b: '#2a7ac0', l: '#4a9ad8', hl: '#a8dcff' }; // 水
const IC = { d: '#5a7a98', b: '#9ab8d0', l: '#b8d0e4', hl: '#e8f4ff' }; // 氷の 下の ゆか

function stone(p, v, C) {
  p.rect(0, 0, 16, 16, C.b);
  p.hline(0, 15, 7, C.d); p.hline(0, 15, 15, C.d);
  const o = (v % 2) * 5;
  for (const x of [o + 2, o + 10]) p.vline(x % 16, 0, 6, C.d);
  for (const x of [o + 6, o + 14]) p.vline(x % 16, 8, 14, C.d);
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), C.hl);
}
function wall(p, v) {
  // 大きな 石を つんだ かべ（目地が はっきり。水と まちがえない）
  p.rect(0, 0, 16, 16, BS.b);
  for (const y of [0, 5, 10, 15]) p.hline(0, 15, y, BS.d);
  const o = (v % 2) * 4;
  for (let row = 0; row < 3; row++) for (const x of [o + (row % 2) * 4, o + 8 + (row % 2) * 4]) p.vline(x % 16, row * 5 + 1, row * 5 + 4, BS.d);
  for (let row = 0; row < 3; row++) p.hline(1, 14, row * 5 + 1, BS.l);
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), BS.hl);
}
function floor0(p, v) {
  stone(p, v, F0);
  // 水が ひいた あとの もの すじ
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 2; i++) { const y = Math.floor(r() * 14) + 1; for (let x = 0; x < 16; x += 2) p.set(x, y + ((x >> 2) % 2), '#4a6a5a'); }
}
function cliff(p, v) {
  p.rect(0, 0, 16, 16, BS.l);
  p.rect(0, 0, 16, 4, F2.b); p.hline(0, 15, 4, BS.hl);
  for (let x = 1; x < 16; x += 4) p.vline(x + (v % 2), 6, 15, BS.d);
  p.hline(0, 15, 15, BS.d);
}
export const WATER_FRAMES10B = 2;
function water(p, v, f, C = WA) {
  p.rect(0, 0, 16, 16, C.b);
  const r = prand(v * 17 + 3);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r() * 12), y = Math.floor(r() * 14) + 1;
    p.hline(x + (f ? 1 : 0), x + 3 + (f ? 1 : 0), y, C.l);
  }
  p.set(Math.floor(r() * 16), Math.floor(r() * 16), C.hl);
}
const DEEP = { d: '#0a2a5a', b: '#164a8a', l: '#2a6ab0', hl: '#6aa8e8' };
function ramp(p, v) {
  stone(p, v, F1);
  for (let y = 2; y < 16; y += 4) p.hline(1, 14, y, F1.d);
  p.hline(1, 14, 0, F1.hl);
}
function dive(p, v) {
  stone(p, v, F2);
  // ふちの しるし（青い 波の もよう）
  for (let x = 1; x < 16; x += 3) { p.set(x, 13, WA.l); p.set(x + 1, 12, WA.l); }
  p.hline(0, 15, 15, WA.d);
}
function bell(p, v) {
  stone(p, v, F1);
  p.ellipse(8, 14, 6, 1.5, '#203040');
  // 2D の かね（2.5D は C10B_PROPS）
  p.vline(2, 1, 14, '#5a4a2a'); p.vline(13, 1, 14, '#5a4a2a'); p.hline(2, 13, 1, '#7a6a3a');
  p.ellipse(8, 6, 3.5, 3.5, '#c8a040'); p.rect(4, 6, 8, 4, '#c8a040'); p.hline(3, 12, 10, '#e0c060'); p.set(6, 4, '#f0e090'); p.set(8, 11, '#5a4a2a');
}
export const FLOW_FRAMES10B = 2;
function flow(p, v, f, dir) {
  water(p, v, 0);
  for (let i = 0; i < 3; i++) {
    const y = 3 + i * 5;
    const x0 = ((f * 4 + i * 5) % 16);
    for (let k = 0; k < 4; k++) p.set((x0 + k * dir + 16) % 16, y, WA.hl);
    p.set((x0 + 4 * dir + 16) % 16, y - 1, WA.hl); p.set((x0 + 4 * dir + 16) % 16, y + 1, WA.hl);
  }
}
function trench(p) {
  p.rect(0, 0, 16, 16, '#0a121c');
  p.hline(0, 15, 0, BS.l); p.hline(0, 15, 15, BS.l);
  p.set(4, 7, '#1a2a3a'); p.set(11, 9, '#1a2a3a');
}
function keystone(p, v) {
  floor0(p, v); p.ellipse(8, 14, 5, 1.4, '#2a3a40');
  p.ellipse(8, 8, 5, 4.5, '#3a6a8a'); p.ellipse(8, 7, 3.6, 3.2, '#6ae0ff'); p.vline(8, 5, 10, '#1a3a5a'); p.hline(6, 10, 7, '#1a3a5a'); p.set(6, 5, '#ffffff');
}
function door(p, v) {
  p.rect(0, 0, 16, 16, BS.b);
  p.rect(2, 1, 12, 15, '#3a6a9a'); p.rect(3, 2, 10, 13, '#4a7aaa');
  p.vline(8, 2, 15, '#2a4a6a');
  p.ellipse(8, 8, 2.5, 2.5, '#1a3048'); p.ellipse(8, 8, 1.4, 1.4, '#6ae0ff');
  p.hline(2, 13, 1, BS.hl);
  if (v % 2) p.set(4, 4, '#8ab0d0');
}
export const WHIRL_FRAMES10B = 2;
function whirl(p, v, f) {
  p.rect(0, 0, 16, 16, '#0e3a6a');
  for (let i = 0; i < 18; i++) {
    const a = i * 0.7 + f * 0.6;
    const rr = 1 + i * 0.35;
    p.set(Math.round(8 + Math.cos(a) * rr), Math.round(8 + Math.sin(a) * rr), i % 3 ? '#4a9ad8' : '#c8ecff');
  }
}
function iceBridge(p, v) {
  p.rect(0, 0, 16, 16, '#c0e8fa');
  p.hline(0, 15, 0, '#ffffff'); p.hline(0, 15, 15, '#88c0e0');
  const r = prand(v * 5 + 9);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 12) + 1, y = Math.floor(r() * 12) + 2; p.hline(x, x + 2, y, '#e8f8ff'); }
}
export const ORB_FRAMES10B = 2;
function sand(p, v) {
  p.rect(0, 0, 16, 16, '#c8b080');
  const r = prand(v * 19 + 2);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#a89060' : '#e0cca0');
  if (v % 3 === 0) for (let x = 2; x < 14; x++) p.set(x, 9 + Math.round(Math.sin(x / 2)), '#b49c6c');
}
function orb(p, v) {
  sand(p, v); p.ellipse(8, 14, 5, 1.4, '#6a5a3a');
  p.ellipse(8, 8, 5, 5, '#1a5ac8'); p.ellipse(8, 8, 3.5, 3.5, '#3a8aff'); p.ellipse(7, 6, 1.6, 1.6, '#c8e8ff');
}
export const SPRING_FRAMES10B = 2;
function spring(p, v, f) {
  sand(p, v);
  p.ellipse(8, 8, 6.5, 6, '#2a7ac0'); p.ellipse(8, 8, 5, 4.5, '#4a9ad8');
  p.ellipse(8, 7 - f, 2, 1.5 + f * 0.5, '#c8ecff'); p.set(5, 9, '#a8dcff'); p.set(11, 6 + f, '#a8dcff');
}
// ───── 氷の 下 ─────
function iceFloor(p, v) {
  p.rect(0, 0, 16, 16, IC.b);
  const r = prand(v * 23 + 1);
  for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 12), y = Math.floor(r() * 14) + 1; p.hline(x, x + 3, y, IC.l); }
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), IC.hl);
}
function iceWall(p, v) {
  p.rect(0, 0, 16, 16, '#4a6a90');
  const r = prand(v * 37 + 3);
  for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.vline(x, y, Math.min(15, y + 3), '#6a90b8'); p.set(x + 1, y, '#a8c8e8'); }
}
function slide(p, v) {
  p.rect(0, 0, 16, 16, '#c8e8ff');
  p.hline(1, 6, 3 + (v % 3), '#ffffff'); p.hline(8, 14, 10 - (v % 2), '#ffffff');
  p.set(12, 4, '#ffffff'); p.set(3, 12, '#e8f8ff');
}
function snowPile(p, v) {
  iceFloor(p, v);
  p.ellipse(8, 10, 7, 5.5, '#dce8f4'); p.ellipse(7, 8.5, 6, 4.5, '#f4f8ff'); p.ellipse(6, 7, 3, 2, '#ffffff');
  p.set(11, 7, '#c8d8e8');
}
function thin(p, v) {
  iceFloor(p, v);
  // ひびの 絵
  const pts = [[2, 3], [5, 6], [8, 7], [11, 5], [14, 4]];
  for (let i = 0; i < pts.length - 1; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; for (let k = 0; k <= 4; k++) p.set(Math.round(x1 + ((x2 - x1) * k) / 4), Math.round(y1 + ((y2 - y1) * k) / 4), '#4a6a8a'); }
  p.vline(8, 7, 12, '#4a6a8a'); p.set(7, 13, '#4a6a8a'); p.set(9, 13, '#4a6a8a');
}
function pillar(p, v) { iceFloor(p, v); p.ellipse(8, 14, 5, 1.4, '#3a5a7a'); }
function meltWall(p, v) {
  iceWall(p, v);
  p.rect(3, 2, 10, 12, '#8ac8f0'); p.rect(4, 3, 8, 10, '#b0e0ff');
  p.ellipse(8, 8, 2, 2, '#ffe080');
}
function moonFloor(p, v) {
  p.rect(0, 0, 16, 16, '#b8c8e0');
  const r = prand(v * 41 + 6);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#ffffff');
  if (v % 2) p.hline(2, 13, 8, '#c8d8ec');
}
export const STAIRS_FRAMES10B = 2;
function lightStairs(p, v, f) {
  p.rect(0, 0, 16, 16, '#e8f0f8');
  p.rect(2, 2, 12, 12, '#9ad8f4');
  for (let i = 0; i < 4; i++) p.hline(3 + i, 12 - i, 3 + i * 3, i % 2 === f ? '#ffffff' : '#d8f4ff');
  p.set(1, 1, '#ffffff'); p.set(14, 13, '#ffffff');
}
function iceStairs(p) {
  p.rect(0, 0, 16, 16, '#e8f0f8');
  for (let i = 0; i < 4; i++) { p.rect(2, 2 + i * 3, 12, 3, i % 2 ? '#a8d8f0' : '#c8ecff'); p.hline(2, 13, 2 + i * 3, '#ffffff'); }
}

export const C10B_PAINTERS = {
  [T.C10B_WALL]: (p, v) => wall(p, v),
  [T.C10B_FLOOR0]: (p, v) => floor0(p, v),
  [T.C10B_FLOOR1]: (p, v) => stone(p, v, F1),
  [T.C10B_FLOOR2]: (p, v) => stone(p, v, F2),
  [T.C10B_CLIFF]: (p, v) => cliff(p, v),
  [T.C10B_WATER]: (p, v, f) => water(p, v, f),
  [T.C10B_DEEP]: (p, v, f) => water(p, v, f, DEEP),
  [T.C10B_RAMP]: (p, v) => ramp(p, v),
  [T.C10B_DIVE]: (p, v) => dive(p, v),
  [T.C10B_BELL]: (p, v) => bell(p, v),
  [T.C10B_FLOW_E]: (p, v, f) => flow(p, v, f, 1),
  [T.C10B_FLOW_W]: (p, v, f) => flow(p, v, f, -1),
  [T.C10B_TRENCH]: (p) => trench(p),
  [T.C10B_KEYSTONE]: (p, v) => keystone(p, v),
  [T.C10B_DOOR]: (p, v) => door(p, v),
  [T.C10B_WHIRL]: (p, v, f) => whirl(p, v, f),
  [T.C10B_ICEBRIDGE]: (p, v) => iceBridge(p, v),
  [T.C10B_ORB]: (p, v) => orb(p, v),
  [T.C10B_SAND]: (p, v) => sand(p, v),
  [T.C10B_SPRING]: (p, v, f) => spring(p, v, f),
  [T.C10B_ICEFLOOR]: (p, v) => iceFloor(p, v),
  [T.C10B_ICEWALL]: (p, v) => iceWall(p, v),
  [T.C10B_SLIDE]: (p, v) => slide(p, v),
  [T.C10B_SNOWPILE]: (p, v) => snowPile(p, v),
  [T.C10B_THIN]: (p, v) => thin(p, v),
  [T.C10B_PILLAR]: (p, v) => pillar(p, v),
  [T.C10B_MELTWALL]: (p, v) => meltWall(p, v),
  [T.C10B_MOONFLOOR]: (p, v) => moonFloor(p, v),
  [T.C10B_LIGHTSTAIRS]: (p, v, f) => lightStairs(p, v, f),
  [T.C10B_ICESTAIRS]: (p) => iceStairs(p),
};
export const C10B_FRAMES = {
  [T.C10B_WATER]: WATER_FRAMES10B, [T.C10B_DEEP]: WATER_FRAMES10B, [T.C10B_FLOW_E]: FLOW_FRAMES10B, [T.C10B_FLOW_W]: FLOW_FRAMES10B,
  [T.C10B_WHIRL]: WHIRL_FRAMES10B, [T.C10B_SPRING]: SPRING_FRAMES10B, [T.C10B_LIGHTSTAIRS]: STAIRS_FRAMES10B,
};
export const C10B_SPEED = {
  [T.C10B_WATER]: 700, [T.C10B_DEEP]: 800, [T.C10B_FLOW_E]: 180, [T.C10B_FLOW_W]: 180, [T.C10B_WHIRL]: 220, [T.C10B_SPRING]: 400, [T.C10B_LIGHTSTAIRS]: 500,
};

// ───── 2.5D ─────
// 地面の 高さ（低い 湖の 底・中の 段・高い 岸。水は 水面）。かべ・がけ・柱は ブロック
export const C10B_FLOOR_H = {
  [T.C10B_FLOOR0]: -0.35, [T.C10B_FLOOR2]: 0.3, [T.C10B_DIVE]: 0.3, [T.C10B_WATER]: -0.12, [T.C10B_DEEP]: -0.12, [T.C10B_FLOW_E]: -0.12, [T.C10B_FLOW_W]: -0.12,
  [T.C10B_TRENCH]: -0.9, [T.C10B_WHIRL]: -0.15, [T.C10B_SPRING]: -0.08, [T.C10B_RAMP]: 0.1, [T.C10B_SNOWPILE]: 0.12,
};
export function c10bBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C10B_WALL: return { h: 1.6 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C10B_CLIFF: return { h: 0.7, top: ['t', T.C10B_FLOOR2, v, 0], side: t() };
    case T.C10B_DOOR: return { h: 1.6, top: ['t', T.C10B_WALL, v, 0], side: ['t', T.C10B_WALL, v, 0], south: t() };
    case T.C10B_ICEWALL: return { h: 1.5 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C10B_PILLAR: return { h: 1.4, top: ['t', T.C10B_ICEBRIDGE, v, 0], side: ['t', T.C10B_ICEWALL, v, 0] };
    case T.C10B_MELTWALL: return { h: 1.5, top: ['t', T.C10B_ICEWALL, v, 0], side: ['t', T.C10B_ICEWALL, v, 0], south: t() };
    default: return null;
  }
}
export const C10B_PROPS = {
  [T.C10B_BELL]: [14, 22, (p) => {
    p.vline(2, 2, 21, '#5a4a2a'); p.vline(11, 2, 21, '#5a4a2a'); p.hline(2, 11, 2, '#7a6a3a');
    p.ellipse(7, 10, 4, 5, '#c8a040'); p.rect(3, 10, 9, 4, '#c8a040'); p.hline(2, 12, 14, '#e0c060'); p.ellipse(6, 8, 1.5, 2, '#f0e090');
    p.set(7, 15, '#5a4a2a');
  }],
  [T.C10B_KEYSTONE]: [14, 14, (p) => {
    p.ellipse(7, 8, 6, 5, '#3a6a8a'); p.ellipse(7, 7, 4.5, 3.8, '#6ae0ff'); p.vline(7, 4, 10, '#1a3a5a'); p.hline(5, 9, 6, '#1a3a5a'); p.set(5, 5, '#ffffff');
  }],
  [T.C10B_ORB]: [16, 18, (p) => {
    p.ellipse(8, 16, 6, 1.5, '#4a3a20');
    p.ellipse(8, 9, 6, 6, '#1a5ac8'); p.ellipse(8, 9, 4, 4, '#3a8aff'); p.ellipse(7, 7, 2, 2, '#c8e8ff');
  }],
};
export const C10B_PROPS_KEEP = new Set([T.C10B_BELL, T.C10B_KEYSTONE, T.C10B_ORB]);

// ───── 色（テーマ）: 白銀の湖（北の テーマ）でも もとの 色 ─────
const IDS10B = Object.keys(C10B_PAINTERS).map(Number);
for (const th of ['snow', 'north']) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...Object.fromEntries(IDS10B.map((id) => [id, 'none'])) };
export const C10B_THEMES = {};
