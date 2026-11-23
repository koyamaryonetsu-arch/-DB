// 第3部 第1章 第4幕「星のはかば」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12）
// ・ふたごの道: 岩かべ（471）/ ゆか（472）/ 深い 谷（473。下に かすかな 星くず）/ 光の 橋（474。2コマ）/ ひびきの石（475。2コマ）/
//   道の ランプ（476。光るかは client/c9d-view.js）/ 光る こけ（477）
// ・ピラミッドの 岸: ひびきの とびら（478）・開いた とびら（479）
// ・星のはかば: 地面（480）/ 小さな くぼみと ねむる 星（481。2コマ。かすかに またたく）/ 大きな くぼみ（482）/ まわりの 岩（483）/ 古い 石の 文字（484）
// どれも テーマで 色を かえない（暗い ので もとの 色の まま）
// (p, v, f) … Painter / ちがい / アニメの コマ
import { T } from '../../shared/tiles.js?v=28060a38724e';
import { prand } from './pixel.js?v=28060a38724e';
import { THEME_PARTS } from './tiles-castle.js?v=28060a38724e';

const RK = { d: '#08060e', b: '#16121f', l: '#262036', hl: '#3c3456' };
const FL = { d: '#221e30', b: '#302a42', l: '#3e3856', hl: '#5a5276' };
const GR = { d: '#262a40', b: '#343a56', l: '#464c6c', hl: '#6a7092' };

function rock(p, v) {
  p.rect(0, 0, 16, 16, RK.b);
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.ellipse(x + 1, y + 1, 3, 2, RK.l); p.hline(x - 1, x + 2, y - 1, RK.hl); }
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RK.d);
}
function floor(p, v) {
  p.rect(0, 0, 16, 16, FL.b);
  const r = prand(v * 13 + 3);
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); p.ellipse(x, y, 1.5, 1, i % 2 ? FL.l : FL.d); }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), FL.hl);
}
function chasm(p, v) {
  p.rect(0, 0, 16, 16, '#020107');
  const r = prand(v * 17 + 5);
  // ずっと 下の かすかな 星くず
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i ? '#2a2850' : '#4a4880');
}
export const BRIDGE_FRAMES9D = 2;
function bridge(p, v, f) {
  chasm(p, v);
  p.rect(0, 3, 16, 10, '#5a4a7a');
  p.rect(0, 4, 16, 8, f ? '#b89ae8' : '#9a7ad8');
  p.hline(0, 15, 4, '#e8dcff'); p.hline(0, 15, 11, '#6a4aa8');
  for (let x = (v + f * 3) % 5; x < 16; x += 5) p.set(x, 7, '#ffffff');
}
export const ECHO_FRAMES9D = 2;
function echo(p, v, f) {
  floor(p, v);
  p.ellipse(8, 13, 6, 2, '#100c18');
  // すきとおった 石（水しょうの ような 六かく）
  for (let y = 2; y < 14; y++) { const w = y < 5 ? (y - 2) + 1 : y > 11 ? 14 - y + 1 : 4; p.hline(8 - w, 8 + w, y, '#5aa8d8'); }
  p.vline(6, 4, 12, '#9ad8ff'); p.vline(10, 5, 12, '#3a78a8');
  p.set(7, 3, '#ffffff'); p.set(6, 6, '#e0f8ff');
  if (f) { p.set(12, 2, '#e0f8ff'); p.set(3, 8, '#e0f8ff'); }
  // 音の しるし（わ）
  p.hline(6, 10, 9, '#c8f0ff');
}
function lamp(p, v) {
  rock(p, v);
  p.vline(8, 6, 15, '#5a4a30');
  p.rect(5, 2, 7, 6, '#3a3020'); p.rect(6, 3, 5, 4, '#6a5a3a');
  p.hline(5, 11, 1, '#5a4a30');
}
function moss(p, v) {
  floor(p, v);
  const r = prand(v * 23 + 11);
  for (let i = 0; i < 7; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 14) + 1; p.set(x, y, '#3a7a5a'); p.set(x + 1, y, '#2a5a44'); }
  p.set(4 + (v % 7), 9, '#6ae0b0');
}
function door(p) {
  rock(p, 1);
  p.rect(2, 1, 12, 15, '#4a4a68'); p.rect(3, 2, 10, 14, '#6a6a8a');
  p.vline(8, 2, 15, '#3a3a58');
  // 音の もよう
  p.ellipse(8, 7, 3, 3, '#9ad8ff'); p.ellipse(8, 7, 1.6, 1.6, '#4a4a68'); p.set(8, 7, '#e0f8ff');
  p.hline(4, 6, 12, '#9ad8ff'); p.hline(10, 12, 12, '#9ad8ff');
}
function doorOpen(p) {
  rock(p, 2);
  p.rect(2, 1, 12, 15, '#0a0814'); p.rect(3, 2, 10, 14, '#14101e');
  p.set(6, 8, '#3a3456'); p.set(10, 11, '#3a3456');
}
function ground(p, v) {
  p.rect(0, 0, 16, 16, GR.b);
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); p.set(x, y, i % 2 ? GR.l : GR.d); }
  // 小さな 星の すな
  if (v % 3 === 0) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#9aa0d0');
}
export const HOLLOW_FRAMES9D = 2;
function hollow(p, v, f) {
  ground(p, v);
  p.ellipse(8, 9, 7, 5, '#1e2034'); p.ellipse(8, 9.5, 6, 4, '#14162a');
  // ねむる 星（灰色の 石）
  p.ellipse(8, 9, 3.5, 3, '#7a7a8a'); p.ellipse(7, 8, 2, 1.6, '#a2a2b2'); p.set(6, 7, '#c8c8d8');
  if (f && v % 2) p.set(9, 8, '#e8e4ff');
}
function hollowBig(p, v) {
  ground(p, v);
  p.rect(0, 0, 16, 16, '#0a0816');
  const r = prand(v * 41 + 9);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#1e1a34');
}
function graveRock(p, v) {
  p.rect(0, 0, 16, 16, '#1a1a2e');
  const r = prand(v * 19 + 2);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.ellipse(x + 1, y + 1, 3, 2, '#2a2a44'); p.hline(x - 1, x + 2, y - 1, '#40406a'); }
}
function tablet(p, v) {
  ground(p, v);
  p.rect(3, 2, 10, 13, '#5a5a6a'); p.rect(4, 3, 8, 11, '#9a96a8');
  for (let y = 5; y < 13; y += 3) p.hline(5, 10, y, '#5a5a6a');
  p.hline(3, 12, 15, '#2a2a3a');
}

export const C9D_PAINTERS = {
  [T.C9D_ROCK]: (p, v) => rock(p, v),
  [T.C9D_FLOOR]: (p, v) => floor(p, v),
  [T.C9D_CHASM]: (p, v) => chasm(p, v),
  [T.C9D_BRIDGE]: (p, v, f) => bridge(p, v, f),
  [T.C9D_ECHO]: (p, v, f) => echo(p, v, f),
  [T.C9D_LAMP]: (p, v) => lamp(p, v),
  [T.C9D_MOSS]: (p, v) => moss(p, v),
  [T.C9D_DOOR]: (p) => door(p),
  [T.C9D_DOOR_OPEN]: (p) => doorOpen(p),
  [T.C9D_GRAVE]: (p, v) => ground(p, v),
  [T.C9D_HOLLOW]: (p, v, f) => hollow(p, v, f),
  [T.C9D_HOLLOW_BIG]: (p, v) => hollowBig(p, v),
  [T.C9D_GRAVE_ROCK]: (p, v) => graveRock(p, v),
  [T.C9D_TABLET]: (p, v) => tablet(p, v),
};
export const C9D_FRAMES = { [T.C9D_BRIDGE]: BRIDGE_FRAMES9D, [T.C9D_ECHO]: ECHO_FRAMES9D, [T.C9D_HOLLOW]: HOLLOW_FRAMES9D };
export const C9D_SPEED = { [T.C9D_BRIDGE]: 380, [T.C9D_ECHO]: 520, [T.C9D_HOLLOW]: 900 };

// ───── 2.5D ─────
// 深い 谷・大きな くぼみは ずっと 下。岩かべ・とびら・まわりの 岩は ブロック
export const C9D_FLOOR_H = { [T.C9D_CHASM]: -1.2, [T.C9D_HOLLOW_BIG]: -0.7, [T.C9D_BRIDGE]: -0.05 };
export function c9dBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C9D_ROCK: return { h: 1.5 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C9D_GRAVE_ROCK: return { h: 1.2 + (v % 3) * 0.2, top: t(), side: t() };
    case T.C9D_LAMP: return { h: 1.5, top: ['t', T.C9D_ROCK, v, 0], side: ['t', T.C9D_ROCK, v, 0], south: t() };
    case T.C9D_DOOR: return { h: 1.6, top: ['t', T.C9C_CAVE, v, 0], side: ['t', T.C9C_CAVE, v, 0], south: t() };
    default: return null;
  }
}
export const C9D_PROPS = {
  [T.C9D_ECHO]: [14, 22, (p) => {
    p.ellipse(7, 20, 6, 1.5, '#06040c');
    for (let y = 2; y < 20; y++) { const w = y < 6 ? (y - 2) * 0.9 + 1 : y > 17 ? 20 - y : 4.5; p.hline(Math.round(7 - w), Math.round(7 + w), y, '#5aa8d8'); }
    p.vline(5, 5, 18, '#9ad8ff'); p.vline(9, 6, 18, '#3a78a8'); p.set(6, 3, '#ffffff'); p.hline(5, 9, 12, '#c8f0ff');
  }],
  [T.C9D_TABLET]: [14, 18, (p) => {
    p.rect(2, 2, 10, 15, '#5a5a6a'); p.rect(3, 3, 8, 13, '#9a96a8');
    for (let y = 5; y < 15; y += 3) p.hline(4, 9, y, '#5a5a6a');
  }],
  [T.C9D_HOLLOW]: [16, 10, (p) => {
    p.ellipse(8, 6, 7, 3.5, '#14162a'); p.ellipse(8, 5, 3.5, 2.8, '#7a7a8a'); p.ellipse(7, 4, 2, 1.4, '#a2a2b2'); p.set(6, 3, '#c8c8d8');
  }],
};
export const C9D_PROPS_KEEP = new Set([T.C9D_ECHO, T.C9D_TABLET, T.C9D_HOLLOW]);

// ───── 色（テーマ）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C9D_THEMES = {
  // ふたごの道: 青むらさきの やみ
  c9d_lane: {
    floor: G([0, '#04030a'], [0.3, '#1a1630'], [0.6, '#40386a'], [1, '#e4dcff']),
    wall: G([0, '#03020a'], [0.3, '#141024'], [0.6, '#342c58'], [1, '#d8d0ff']),
    water: G([0, '#0a1430'], [0.5, '#3a6ab0'], [1, '#e0f0ff']),
    gem: G([0, '#0a2a4a'], [0.5, '#6ac8f0'], [1, '#ffffff']),
    flame: G([0, '#3a2a0a'], [0.5, '#f0c050'], [1, '#fff8e0']),
  },
  // 星のはかば: しずかな 夜の 青
  c9d_grave: {
    floor: G([0, '#06061a'], [0.3, '#22264a'], [0.6, '#50588a'], [1, '#eef0ff']),
    wall: G([0, '#04040f'], [0.3, '#16183a'], [0.6, '#3a4070'], [1, '#dce0ff']),
    water: G([0, '#0a1430'], [0.5, '#3a6ab0'], [1, '#e0f0ff']),
    gem: G([0, '#2a2a5a'], [0.5, '#a8b0f0'], [1, '#ffffff']),
    flame: G([0, '#2a2a4a'], [0.5, '#c8c8f0'], [1, '#ffffff']),
  },
};
const C9D_TILE_IDS = [...Object.keys(C9D_PAINTERS).map(Number), T.C9C_FOUNT, T.STAIRS_UP, T.STAIRS_DOWN];
export const C9D_THEME_PARTS = {
  c9d_lane: Object.fromEntries(C9D_TILE_IDS.map((id) => [id, 'none'])),
  c9d_grave: Object.fromEntries(C9D_TILE_IDS.map((id) => [id, 'none'])),
};
for (const [th, parts] of Object.entries(C9D_THEME_PARTS)) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...parts };
// 地下の川（第3幕）の テーマでも ひびきの とびら・石は もとの 色の まま
THEME_PARTS.c9c_river = { ...(THEME_PARTS.c9c_river || {}), ...Object.fromEntries(Object.keys(C9D_PAINTERS).map((id) => [Number(id), 'none'])) };
