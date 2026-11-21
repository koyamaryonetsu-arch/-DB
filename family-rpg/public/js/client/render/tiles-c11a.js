// 第3部 第3章 第1幕「星の船と、星座の島」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）
// ・星の海: しずかな 海（621。2コマ）/ 星の 流れ 4向き（622〜625。4コマ。光の すじが 流れの 向きへ 動く）/ あさせ（626）/ 雲（627。2コマ）/
//   島の 岩（628）/ はとば（629）/ 光の 橋の 先（630）/ 星座の門（631）・開いた 門（632）/ 門の 岩（633）/ 星の きり（634）
// ・島: 地面（635）/ 星の 草（636）/ ふち（637）/ 空（638。2コマ）/ 星（639。2コマ）/ 明かり（640）・ともった 明かり（641）/ 船着き場（642）/
//   星の 木（643）/ 石ぶみ（644）/ 家（645）/ いのりの いずみ（646）/ 道（647）
// ・灯台島: レンズが うつした 光の ゆか（648）・星（649）
// 星座の 線・矢じるし・ふたご星の しるしは 画面が かく（client/c11a-view.js）。どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js';
import { prand } from './pixel.js';

const NAVY = { d: '#0c1030', b: '#1a2260', l: '#2a3478', hl: '#4a5aa8' };
const STONE = { d: '#4a4878', b: '#7a76a8', l: '#9a96c8', hl: '#c8c4f0' };
const GOLD = { d: '#a8801e', b: '#e8c040', l: '#ffe070', hl: '#fff8c8' };

function twinkle(p, v, f, n, cols = ['#ffffff', '#fff0a0', '#c8d8ff']) {
  const r = prand(v * 31 + 7);
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * 16), y = Math.floor(r() * 16);
    if ((i + f) % 3 === 0) continue;
    p.set(x, y, cols[i % cols.length]);
  }
}
export const SEA_FRAMES11A = 2;
function sea(p, v, f) {
  p.rect(0, 0, 16, 16, NAVY.l);
  const r = prand(v * 5 + 3);
  for (let i = 0; i < 3; i++) p.hline(Math.floor(r() * 10), Math.floor(r() * 10) + 4, Math.floor(r() * 16), NAVY.b);
  twinkle(p, v, f, 4);
}
export const CUR_FRAMES11A = 4;
function current(p, v, f, dir) {
  p.rect(0, 0, 16, 16, '#3a4a9a');
  // 光の すじ（流れの 向きへ 動く）と 矢じるし
  const [dx, dy] = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] }[dir];
  for (let k = 0; k < 3; k++) {
    const o = ((k * 6 + f * 4) % 16);
    for (let i = 0; i < 4; i++) {
      const a = (o + (dx || dy) * 0 + i) % 16;
      const x = dx ? (dx > 0 ? a : 15 - a) : 3 + k * 5, y = dy ? (dy > 0 ? a : 15 - a) : 3 + k * 5;
      p.set(x, y, i === 3 ? '#ffffff' : '#a8c0ff');
    }
  }
  // 矢じるし（まん中）
  const c = '#fff0a0';
  if (dx) { const x0 = dx > 0 ? 10 : 5; p.set(x0, 8, c); p.set(x0 - dx, 7, c); p.set(x0 - dx, 9, c); p.set(x0 - 2 * dx, 6, c); p.set(x0 - 2 * dx, 10, c); }
  else { const y0 = dy > 0 ? 10 : 5; p.set(8, y0, c); p.set(7, y0 - dy, c); p.set(9, y0 - dy, c); p.set(6, y0 - 2 * dy, c); p.set(10, y0 - 2 * dy, c); }
}
function shoal(p, v) {
  p.rect(0, 0, 16, 16, '#b8b0e0');
  const r = prand(v * 9 + 1);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#d8d0f8' : '#9a90c8');
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#fff8c8');
}
export const CLOUD_FRAMES11A = 2;
function cloud(p, v, f) {
  p.rect(0, 0, 16, 16, '#6a74a8');
  const r = prand(v * 13 + 4);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(r() * 16), y = Math.floor(r() * 16);
    p.ellipse((x + f) % 16, y, 3 + (i % 2), 2, i % 2 ? '#8a94c8' : '#9aa4d8');
  }
}
function isle(p, v) {
  p.rect(0, 0, 16, 16, '#5a5a90');
  p.rect(0, 0, 16, 5, '#5a8a7a');
  p.hline(0, 15, 5, '#4a6a6a');
  const r = prand(v * 17 + 2);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), 6 + Math.floor(r() * 10), '#7a7ab0');
  if (v % 3 === 0) { p.ellipse(6, 2, 3, 2, '#3a7a6a'); p.set(6, 1, '#ffe070'); }
}
function pier(p) {
  p.rect(0, 0, 16, 16, NAVY.l);
  p.rect(3, 0, 10, 16, '#a87a4a');
  for (let y = 2; y < 16; y += 4) p.hline(3, 12, y, '#7a5230');
  p.vline(3, 0, 15, '#7a5230'); p.vline(12, 0, 15, '#7a5230');
  p.set(2, 4, '#5a3a20'); p.set(13, 10, '#5a3a20');
}
export const BRIDGE_FRAMES11A = 2;
function bridge(p, v, f) {
  p.rect(0, 0, 16, 16, NAVY.d);
  p.rect(4, 0, 8, 16, f ? GOLD.b : GOLD.l);
  p.rect(6, 0, 4, 16, GOLD.hl);
  for (let y = f * 2; y < 16; y += 4) p.hline(5, 10, y, '#ffffff');
}
export const GATE_FRAMES11A = 2;
function gate(p, v, f, open) {
  p.rect(0, 0, 16, 16, open ? '#fff4c0' : '#2a2a60');
  p.rect(0, 0, 16, 2, GOLD.b); p.hline(0, 15, 0, GOLD.hl);
  p.rect(0, 14, 16, 2, GOLD.d);
  if (!open) {
    // 星座の もようの とびら（星と 線）
    p.hline(2, 13, 7, '#8a8ad8');
    p.vline(8, 3, 12, '#8a8ad8');
    for (const [x, y] of [[2, 7], [13, 7], [8, 3], [8, 12]]) { p.set(x, y, f ? '#ffffff' : GOLD.l); }
    p.set(8, 7, GOLD.hl);
  } else {
    twinkle(p, v, f, 6, ['#ffffff', '#ffe070']);
  }
}
function gaterock(p, v) {
  p.rect(0, 0, 16, 16, NAVY.b);
  p.rect(3, 0, 10, 16, '#7a74b0');
  p.vline(4, 0, 15, '#9a96d0'); p.vline(12, 0, 15, '#5a5490');
  p.set(8, 3 + (v % 3) * 4, GOLD.l);
}
export const MIST_FRAMES11A = 2;
function mist(p, v, f) {
  p.rect(0, 0, 16, 16, '#9a9ac8');
  const r = prand(v * 7 + 8);
  for (let i = 0; i < 5; i++) p.ellipse((Math.floor(r() * 16) + f * 2) % 16, Math.floor(r() * 16), 4, 2, i % 2 ? '#c8c8e8' : '#b0b0d8');
}
// ───── 島 ─────
function ground(p, v) {
  p.rect(0, 0, 16, 16, '#8a86b8');
  const r = prand(v * 11 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#7a76a8' : '#a8a4d0');
  if (v % 7 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, '#fff0a0');
}
function grass(p, v) {
  p.rect(0, 0, 16, 16, '#5a8a8a');
  const r = prand(v * 3 + 9);
  for (let i = 0; i < 8; i++) { const x = Math.floor(r() * 16), y = Math.floor(r() * 15) + 1; p.set(x, y, '#7ab8a8'); p.set(x, y - 1, '#9ad8c8'); }
  if (v % 4 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, '#ffe070');
}
function rim(p, v) {
  p.rect(0, 0, 16, 16, NAVY.d);
  p.rect(0, 0, 16, 7, STONE.d);
  p.hline(0, 15, 0, STONE.b);
  const r = prand(v * 5 + 6);
  for (let x = 0; x < 16; x++) { const d = 7 + Math.floor(r() * 3); p.vline(x, 7, d, STONE.d); }
  twinkle(p, v, 0, 2);
}
export const SKY_FRAMES11A = 2;
function sky(p, v, f) {
  p.rect(0, 0, 16, 16, NAVY.d);
  const r = prand(v * 19 + 5);
  if (v % 5 === 0) p.ellipse(Math.floor(r() * 16), Math.floor(r() * 16), 4, 2, '#1a2050');
  twinkle(p, v, f, 3);
}
export const STAR_FRAMES11A = 2;
function star(p, v, f, onGrass = false) {
  if (onGrass) p.rect(0, 0, 16, 16, '#5a7aa8'); else sky(p, v, 0);
  // うかぶ 星の 石（光る 星の 形）
  p.ellipse(8, 9, 6, 5, f ? '#b8a860' : '#a89850');
  const C = f ? GOLD.hl : GOLD.l;
  for (let i = -4; i <= 4; i++) { p.set(8 + i, 8, C); p.set(8, 8 + i, C); }
  p.ellipse(8, 8, 2.5, 2.5, GOLD.hl); p.set(8, 8, '#ffffff');
  p.set(5, 5, GOLD.b); p.set(11, 5, GOLD.b); p.set(5, 11, GOLD.b); p.set(11, 11, GOLD.b);
}
function light(p, on, f) {
  ground(p, 3);
  p.rect(6, 6, 4, 9, '#5a5480'); p.hline(5, 10, 14, '#3a3460');
  p.rect(4, 1, 8, 6, on ? (f ? GOLD.b : GOLD.l) : '#6a6890');
  p.rect(5, 2, 6, 4, on ? GOLD.hl : '#4a4870');
  if (on) { p.set(8, 3, '#ffffff'); p.set(2, 2 + f, GOLD.hl); p.set(13, 1 + f, GOLD.hl); }
}
function dock(p) {
  p.rect(0, 0, 16, 16, NAVY.d);
  p.rect(2, 0, 12, 16, '#b88a5a');
  for (let y = 3; y < 16; y += 4) p.hline(2, 13, y, '#8a6238');
  p.set(1, 12, '#6a4a28'); p.set(14, 12, '#6a4a28');
}
function tree(p, v) {
  ground(p, v);
  p.rect(7, 9, 2, 6, '#5a4a6a');
  p.ellipse(8, 6, 6, 5, '#3a6a7a'); p.ellipse(7, 5, 4, 3, '#5a9a9a');
  p.set(5, 6, GOLD.l); p.set(10, 4, GOLD.hl); p.set(9, 8, GOLD.l);
}
function tablet(p) {
  ground(p, 5);
  p.rect(4, 3, 8, 11, STONE.b); p.rect(5, 4, 6, 9, STONE.l);
  for (const y of [6, 8, 10]) p.hline(6, 9, y, STONE.d);
  p.hline(3, 12, 14, STONE.d);
}
function hut(p, v) {
  p.rect(0, 0, 16, 16, '#7a6a9a');
  p.rect(0, 0, 16, 6, '#4a3a6a');
  for (let x = (v % 2) * 2; x < 16; x += 4) p.vline(x, 0, 5, '#5a4a7a');
  p.rect(0, 6, 16, 10, '#a898c0');
  if (v % 3 === 1) { p.rect(6, 9, 4, 7, '#5a4a6a'); p.set(9, 12, GOLD.l); }
  else { p.rect(4, 8, 3, 3, '#fff0a0'); p.rect(10, 8, 3, 3, '#fff0a0'); }
}
export const SPRING_FRAMES11A = 2;
function spring(p, v, f) {
  ground(p, v);
  p.ellipse(8, 9, 7, 5, STONE.d); p.ellipse(8, 9, 6, 4, '#4a8ad8');
  p.set(6 + f, 9, '#ffffff'); p.set(10 - f, 8, '#d8f0ff'); p.set(8, 3 + f, GOLD.hl);
}
function path(p, v) {
  p.rect(0, 0, 16, 16, '#a8a0c8');
  const r = prand(v * 7 + 2);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#9088b8');
}
export const LENS_FRAMES11A = 2;
function lens(p, v, f) {
  p.rect(0, 0, 16, 16, f ? '#6a8ad0' : '#5a7ac0');
  p.rect(1, 1, 14, 14, '#7a9ae0');
  twinkle(p, v, f, 3, ['#ffffff', '#c8e0ff']);
}

export const C11A_PAINTERS = {
  [T.C11A_SEA]: (p, v, f) => sea(p, v, f),
  [T.C11A_CUR_N]: (p, v, f) => current(p, v, f, 'n'),
  [T.C11A_CUR_E]: (p, v, f) => current(p, v, f, 'e'),
  [T.C11A_CUR_S]: (p, v, f) => current(p, v, f, 's'),
  [T.C11A_CUR_W]: (p, v, f) => current(p, v, f, 'w'),
  [T.C11A_SHOAL]: (p, v) => shoal(p, v),
  [T.C11A_CLOUD]: (p, v, f) => cloud(p, v, f),
  [T.C11A_ISLE]: (p, v) => isle(p, v),
  [T.C11A_PIER]: (p) => pier(p),
  [T.C11A_BRIDGE]: (p, v, f) => bridge(p, v, f),
  [T.C11A_GATE]: (p, v, f) => gate(p, v, f, false),
  [T.C11A_GATE_OPEN]: (p, v, f) => gate(p, v, f, true),
  [T.C11A_GATEROCK]: (p, v) => gaterock(p, v),
  [T.C11A_MIST]: (p, v, f) => mist(p, v, f),
  [T.C11A_GROUND]: (p, v) => ground(p, v),
  [T.C11A_GRASS]: (p, v) => grass(p, v),
  [T.C11A_RIM]: (p, v) => rim(p, v),
  [T.C11A_SKY]: (p, v, f) => sky(p, v, f),
  [T.C11A_STAR]: (p, v, f) => star(p, v, f),
  [T.C11A_LIGHT]: (p) => light(p, false, 0),
  [T.C11A_LIGHT_ON]: (p, v, f) => light(p, true, f),
  [T.C11A_DOCK]: (p) => dock(p),
  [T.C11A_TREE]: (p, v) => tree(p, v),
  [T.C11A_TABLET]: (p) => tablet(p),
  [T.C11A_HUT]: (p, v) => hut(p, v),
  [T.C11A_SPRING]: (p, v, f) => spring(p, v, f),
  [T.C11A_PATH]: (p, v) => path(p, v),
  [T.C11A_LENS]: (p, v, f) => lens(p, v, f),
  [T.C11A_LENS_STAR]: (p, v, f) => star(p, v, f, true),
};
export const C11A_FRAMES = {
  [T.C11A_SEA]: SEA_FRAMES11A, [T.C11A_CUR_N]: CUR_FRAMES11A, [T.C11A_CUR_E]: CUR_FRAMES11A, [T.C11A_CUR_S]: CUR_FRAMES11A, [T.C11A_CUR_W]: CUR_FRAMES11A,
  [T.C11A_CLOUD]: CLOUD_FRAMES11A, [T.C11A_BRIDGE]: BRIDGE_FRAMES11A, [T.C11A_GATE]: GATE_FRAMES11A, [T.C11A_GATE_OPEN]: GATE_FRAMES11A,
  [T.C11A_MIST]: MIST_FRAMES11A, [T.C11A_SKY]: SKY_FRAMES11A, [T.C11A_STAR]: STAR_FRAMES11A, [T.C11A_LIGHT_ON]: 2,
  [T.C11A_SPRING]: SPRING_FRAMES11A, [T.C11A_LENS]: LENS_FRAMES11A, [T.C11A_LENS_STAR]: STAR_FRAMES11A,
};
export const C11A_SPEED = {
  [T.C11A_SEA]: 900, [T.C11A_CUR_N]: 160, [T.C11A_CUR_E]: 160, [T.C11A_CUR_S]: 160, [T.C11A_CUR_W]: 160, [T.C11A_CLOUD]: 1400,
  [T.C11A_BRIDGE]: 420, [T.C11A_GATE]: 600, [T.C11A_GATE_OPEN]: 400, [T.C11A_MIST]: 1200, [T.C11A_SKY]: 1100, [T.C11A_STAR]: 500,
  [T.C11A_LIGHT_ON]: 450, [T.C11A_SPRING]: 500, [T.C11A_LENS]: 600, [T.C11A_LENS_STAR]: 500,
};

// ───── 2.5D ─────
// 海は 少し ひくい（船が うかぶ）。空は ずっと 下（島が 空に うかんで 見える）。雲は 海より 下。星は 空に うかぶ 石（地面と 同じ 高さ）
export const C11A_FLOOR_H = {
  [T.C11A_SEA]: -0.14, [T.C11A_CUR_N]: -0.14, [T.C11A_CUR_E]: -0.14, [T.C11A_CUR_S]: -0.14, [T.C11A_CUR_W]: -0.14,
  [T.C11A_SHOAL]: -0.06, [T.C11A_CLOUD]: -0.6, [T.C11A_RIM]: -0.45, [T.C11A_MIST]: -0.1, [T.C11A_SKY]: -1.1, [T.C11A_PIER]: 0.02, [T.C11A_DOCK]: 0.02,
  [T.C11A_BRIDGE]: 0.04, [T.C11A_GATE_OPEN]: -0.14,
};
export function c11aBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C11A_ISLE: return { h: 0.7, top: t(), side: ['t', T.C11A_RIM, v, 0] };
    case T.C11A_GATE: return { h: 1.6, top: ['t', T.C11A_GATEROCK, v, 0], side: t() };
    case T.C11A_GATEROCK: return { h: 1.4, top: t(), side: t() };
    case T.C11A_HUT: return { h: 1.2, top: ['t', T.C11A_HUT, 0, 0], side: t() };
    default: return null;
  }
}
const prop = (fn) => [16, 20, fn];
export const C11A_PROPS = {
  [T.C11A_TREE]: [16, 22, (p) => {
    p.rect(7, 13, 2, 8, '#5a4a6a');
    p.ellipse(8, 8, 7, 7, '#3a6a7a'); p.ellipse(7, 6, 5, 4, '#5a9a9a');
    p.set(4, 8, GOLD.l); p.set(11, 5, GOLD.hl); p.set(9, 11, GOLD.l);
  }],
  [T.C11A_LIGHT]: prop((p) => { p.rect(6, 8, 4, 11, '#5a5480'); p.rect(4, 2, 8, 7, '#6a6890'); p.rect(5, 3, 6, 5, '#4a4870'); }),
  [T.C11A_LIGHT_ON]: prop((p) => {
    p.rect(6, 8, 4, 11, '#5a5480'); p.rect(4, 2, 8, 7, GOLD.b); p.rect(5, 3, 6, 5, GOLD.hl); p.set(8, 5, '#ffffff');
    p.set(1, 1, GOLD.hl); p.set(14, 2, GOLD.hl);
  }),
  [T.C11A_TABLET]: prop((p) => { p.rect(4, 6, 8, 13, STONE.b); p.rect(5, 7, 6, 11, STONE.l); for (const y of [9, 11, 13]) p.hline(6, 9, y, STONE.d); }),
  [T.C11A_SPRING]: [16, 16, (p) => { p.ellipse(8, 11, 7, 4, STONE.d); p.ellipse(8, 10, 6, 3, '#4a8ad8'); p.set(8, 4, GOLD.hl); p.set(6, 10, '#ffffff'); }],
};
export const C11A_PROPS_KEEP = new Set(Object.keys(C11A_PROPS).map(Number));
export const C11A_THEMES = {};
