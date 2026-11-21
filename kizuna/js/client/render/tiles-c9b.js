// 第3部 第1章 第2幕「鉱山の底の先」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3.md の 10）
// ・大地の下: 暗い 土（427）/ 岩（428）/ 水晶の 柱（429 まだ・430 ともった。2コマ）/ 光る こけの 原（431。光って いるかは client/c9b-light.js）/
//   大きな 空どう（432。ゆかより ずっと 下）/ 地下の 川（435。2コマ）/ 船着き場（436）
// ・たてあな: 岩かべ（433）/ 道（434）
// ・ヒカリゴケの里: キノコの 形の 家（437）/ 村の 明かりの 台（438 からっぽ・439 光る こけの かたまり。2コマ）/ 小さな こけの 明かり（446）
// ・大王のやしき: ゆか（440 赤い じゅうたん）/ かべ（441）/ ごちそうの テーブル（442）/ 村の ごちそうの はこ（443）/ 門（444）/ たる（445）
// どれも その 場所の 色で かいて あるので、テーマで 色を かえない（render/tiles-castle.js の THEME_PARTS）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=93a310251ce7';
import { prand } from './pixel.js?v=93a310251ce7';
import { THEME_PARTS } from './tiles-castle.js?v=93a310251ce7';

const GR = { d: '#16121e', b: '#241e30', l: '#342c44', hl: '#4a405e' }; // 大地の下の 土
const RK = { d: '#08070c', b: '#14121c', l: '#22202e', hl: '#363248' }; // 岩
const CY = { d: '#2a6a9a', b: '#6ac8f0', l: '#bff0ff', w: '#ffffff' }; // ともった 水晶
const DK = { d: '#1a1a2e', b: '#34344e', l: '#4e4e70', w: '#7a7aa0' }; // ともって いない 水晶
const MS = { d: '#163222', b: '#24543a', l: '#3e8a5a', hl: '#8ae8a8' }; // 光る こけ
const WD = { d: '#3a2414', b: '#6a4426', l: '#9a6a3a', hl: '#c89a5a' }; // 木
const HL = { d: '#4a1a18', b: '#7a2a24', l: '#a8443a', hl: '#d06a5a' }; // やしきの じゅうたん
const HW = { d: '#1a120e', b: '#3a2a22', l: '#5a4232', hl: '#7a5a42' }; // やしきの かべ

function ground(p, v, c = GR) {
  p.rect(0, 0, 16, 16, c.b);
  const r = prand(v * 13 + 7);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), c.d);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), c.l);
  if (v % 3 === 0) { const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11); p.hline(x, x + 2, y, c.d); p.set(x + 1, y - 1, c.hl); }
}
function rock(p, v) {
  p.rect(0, 0, 16, 16, RK.b);
  const r = prand(v * 31 + 5);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.ellipse(x + 1, y + 1, 3, 2, RK.l); p.hline(x - 1, x + 2, y - 1, RK.hl); }
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RK.d);
}
export const PILLAR_FRAMES9B = 2;
function pillar(p, v, on, f = 0) {
  ground(p, v);
  const c = on ? CY : DK;
  p.ellipse(8, 14, 6, 1.6, '#06060c');
  for (let y = 1; y < 15; y++) { const w = y < 4 ? y - 1 : 3; p.hline(8 - w, 8 + w, y, c.b); }
  p.vline(6, 3, 14, c.l); p.vline(10, 4, 14, c.d); p.vline(8, 2, 14, c.l);
  for (let y = 8; y < 15; y++) { p.set(3, y, c.b); p.set(13, y, c.b); }
  p.set(3, 7, c.l); p.set(13, 7, c.l);
  if (on) { p.set(7, 2 + (f % 2) * 3, CY.w); p.set(9, 9 - (f % 2) * 2, CY.w); p.set(1, 4 + f % 2, CY.l); p.set(14, 2 + f % 2, CY.w); }
  else { p.set(7, 5, c.w); }
}
function moss(p, v) {
  ground(p, v);
  const r = prand(v * 23 + 9);
  for (let i = 0; i < 7; i++) {
    const x = 2 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 12);
    p.ellipse(x, y, 2, 1.4, i % 2 ? MS.b : MS.d);
    p.set(x, y - 1, MS.l);
  }
  p.set(4 + (v % 7), 9, MS.hl); p.set(11, 3 + (v % 5), MS.hl);
}
function voidTile(p, v) {
  p.rect(0, 0, 16, 16, '#04030a');
  const r = prand(v * 41 + 3);
  // はるか 下の かすかな 光の つぶ
  if (v % 3 === 0) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#2a2a4a');
  if (v % 5 === 0) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a4a6a');
}
function cliff(p, v) {
  p.rect(0, 0, 16, 16, '#2a2430');
  const r = prand(v * 17 + 3);
  for (let i = 0; i < 4; i++) { const y = Math.floor(r() * 16); p.hline(0, 15, y, '#1a1620'); }
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3e3648');
  p.hline(0, 15, 0, '#4a4256');
}
function shaftPath(p, v) {
  p.rect(0, 0, 16, 16, '#4a4252');
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 6; i++) p.ellipse(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1, '#5a5262');
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#322c3a');
}
export const RIVER_FRAMES9B = 2;
function river(p, v, f = 0) {
  p.rect(0, 0, 16, 16, '#0e2238');
  const k = f % 2;
  for (let y = 2; y < 16; y += 4) for (let x = (y + k * 3 + v) % 6; x < 16; x += 7) p.hline(x, x + 2, y, '#1e4a6a');
  p.set((v * 5 + k * 4) % 16, (v * 3) % 16, '#6ab0d8');
}
function dock(p, v) {
  p.rect(0, 0, 16, 16, '#0e2238');
  p.rect(1, 0, 14, 16, WD.b);
  for (let y = 0; y < 16; y += 4) p.hline(1, 14, y, WD.d);
  p.vline(1, 0, 15, WD.l); p.vline(14, 0, 15, WD.d);
  if (v % 2) p.set(6, 6, WD.hl);
}
function hut(p, v) {
  ground(p, v);
  hutShape(p, v, 0);
}
// 地下の 民の 家（キノコの かさの やね・石の かべ・まるい まど）
const CAPS9B = ['#8a5ab0', '#5a8ab0', '#b0705a', '#6aa86a'];
function hutShape(p, v, oy) {
  const cap = CAPS9B[v % 4];
  p.ellipse(8, 15 + oy, 7, 1.4, '#06060c');
  p.rect(3, 8 + oy, 10, 7, '#6a5a4a'); p.hline(3, 12, 8 + oy, '#8a7a6a');
  p.ellipse(8, 7 + oy, 7.5, 4, cap); p.hline(2, 14, 9 + oy, '#2a1e30');
  p.set(5, 5 + oy, '#f0e8f8'); p.set(10, 4 + oy, '#f0e8f8'); p.set(12, 7 + oy, '#f0e8f8');
  p.ellipse(10, 11 + oy, 1.5, 1.5, '#c8ff8a'); p.set(10, 11 + oy, '#f4ffd8');
  p.rect(5, 11 + oy, 2, 4, '#3a2a1a');
}
export const LUMP_FRAMES9B = 2;
function lump(p, v, on, f = 0) {
  ground(p, v);
  p.ellipse(8, 13, 6, 2, '#5a5a4a'); p.ellipse(8, 12, 5, 1.5, '#7a7a6a');
  if (!on) { p.set(6, 11, '#3a3a2e'); p.set(10, 11, '#3a3a2e'); return; }
  p.ellipse(8, 8, 5, 4.5, '#5ac86a'); p.ellipse(7, 7, 3.5, 3, '#9af08a'); p.ellipse(6, 6, 1.5, 1.2, '#e8ffd0');
  const tw = f % 2 ? [[2, 3], [13, 5]] : [[12, 2], [3, 6]];
  for (const [x, y] of tw) p.set(x, y, '#e8ffd0');
}
function hallFloor(p, v) {
  p.rect(0, 0, 16, 16, HL.b);
  p.hline(0, 15, 0, HL.d); p.vline(0, 0, 15, HL.d);
  const r = prand(v * 11 + 4);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), HL.l);
  if (v % 2) { p.set(8, 8, '#e8c060'); p.set(7, 8, '#c89a40'); p.set(9, 8, '#c89a40'); p.set(8, 7, '#c89a40'); p.set(8, 9, '#c89a40'); }
}
function hallWall(p, v) {
  p.rect(0, 0, 16, 16, HW.b);
  for (let y = 3; y < 16; y += 5) p.hline(0, 15, y, HW.d);
  for (let y = 0; y < 16; y += 5) for (let x = (y % 10 ? 4 : 0); x < 16; x += 8) p.vline(x, y, Math.min(15, y + 4), HW.d);
  p.hline(0, 15, 0, HW.hl);
  if (v % 3 === 0) { p.rect(6, 6, 4, 4, '#c8443a'); p.set(7, 7, '#f0c040'); } // 大王の 旗の もよう
}
// ごちそうの テーブル（白い ぬの・皿の 上の ごちそう）
const FOOD9B = [['#c86a3a', '#8a3a1a'], ['#f4e0f0', '#e86a8a'], ['#e85a2a', '#f0c040'], ['#8ac85a', '#5a8a3a']];
function table(p, v) {
  p.rect(0, 0, 16, 16, HL.b);
  p.rect(0, 2, 16, 12, '#f4f0e8'); p.hline(0, 15, 13, '#c8c0b0'); p.hline(0, 15, 2, '#ffffff');
  const [a, b] = FOOD9B[v % 4];
  p.ellipse(8, 8, 5, 3, '#d8d8e0'); p.ellipse(8, 7, 3.5, 2.2, a); p.set(7, 6, b); p.set(9, 7, b);
  if (v % 2) { p.set(2, 5, '#f0c040'); p.set(13, 10, '#f0c040'); }
}
function box(p, v) {
  hallFloor(p, v);
  p.rect(2, 4, 12, 10, WD.b); p.hline(2, 13, 4, WD.hl); p.hline(2, 13, 13, WD.d);
  p.vline(2, 4, 13, WD.l); p.vline(13, 4, 13, WD.d);
  p.rect(5, 7, 6, 3, '#f4e0b0'); p.hline(6, 9, 8, '#c86a3a'); // ごちそうの はり紙
  p.ellipse(8, 3, 3, 1.5, '#f0c040');
}
function gate(p) {
  p.rect(0, 0, 16, 16, HW.d);
  p.rect(1, 1, 14, 15, '#8a5a2a');
  p.vline(8, 1, 15, '#4a2a14');
  for (let y = 3; y < 16; y += 4) p.hline(1, 14, y, '#6a4220');
  p.ellipse(8, 6, 3, 3, '#e8c040'); p.ellipse(8, 6, 2, 2, '#c8443a'); // 大王の しるし
  p.set(6, 10, '#e8c040'); p.set(10, 10, '#e8c040');
}
function crate(p, v) {
  hallFloor(p, v);
  if (v % 2) {
    p.ellipse(8, 9, 5, 6, WD.b); p.hline(3, 13, 5, WD.d); p.hline(3, 13, 12, WD.d); p.ellipse(8, 3, 4, 1.5, WD.l);
  } else {
    p.rect(2, 3, 12, 11, WD.b); p.hline(2, 13, 3, WD.l); p.hline(2, 13, 13, WD.d); p.vline(7, 3, 13, WD.d);
  }
}
function lamp(p, v) {
  ground(p, v);
  p.vline(8, 6, 15, WD.d);
  p.ellipse(8, 5, 3, 3, '#7ad86a'); p.ellipse(8, 5, 1.5, 1.5, '#e8ffd0');
  p.hline(5, 11, 2, WD.d);
}

export const C9B_PAINTERS = {
  [T.C9B_GROUND]: (p, v) => ground(p, v),
  [T.C9B_ROCK]: (p, v) => rock(p, v),
  [T.C9B_PILLAR]: (p, v) => pillar(p, v, false),
  [T.C9B_PILLAR_ON]: (p, v, f) => pillar(p, v, true, f),
  [T.C9B_MOSS]: (p, v) => moss(p, v),
  [T.C9B_VOID]: (p, v) => voidTile(p, v),
  [T.C9B_CLIFF]: (p, v) => cliff(p, v),
  [T.C9B_SHAFT]: (p, v) => shaftPath(p, v),
  [T.C9B_RIVER]: (p, v, f) => river(p, v, f),
  [T.C9B_DOCK]: (p, v) => dock(p, v),
  [T.C9B_HUT]: (p, v) => hut(p, v),
  [T.C9B_LUMP]: (p, v) => lump(p, v, false),
  [T.C9B_LUMP_ON]: (p, v, f) => lump(p, v, true, f),
  [T.C9B_HALL]: (p, v) => hallFloor(p, v),
  [T.C9B_HALLWALL]: (p, v) => hallWall(p, v),
  [T.C9B_TABLE]: (p, v) => table(p, v),
  [T.C9B_BOX]: (p, v) => box(p, v),
  [T.C9B_GATE]: (p) => gate(p),
  [T.C9B_CRATE]: (p, v) => crate(p, v),
  [T.C9B_LAMP]: (p, v) => lamp(p, v),
};
export const C9B_FRAMES = { [T.C9B_PILLAR_ON]: PILLAR_FRAMES9B, [T.C9B_RIVER]: RIVER_FRAMES9B, [T.C9B_LUMP_ON]: LUMP_FRAMES9B };
export const C9B_SPEED = { [T.C9B_PILLAR_ON]: 420, [T.C9B_RIVER]: 520, [T.C9B_LUMP_ON]: 380 };

// ───── 2.5D ─────
// 空どうは ゆかより ずっと 下・川は 少し ひくい。岩・かべ・門・たる・テーブル・はこは ブロック。柱・家・明かりは たてた もの
export const C9B_FLOOR_H = { [T.C9B_VOID]: -0.9, [T.C9B_RIVER]: -0.22, [T.C9B_MOSS]: -0.01 };
export function c9bBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C9B_ROCK: return { h: 1.3 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C9B_CLIFF: return { h: 1.6, top: t(), side: t() };
    case T.C9B_HALLWALL: return { h: 1.6, top: ['t', T.C9B_HALLWALL, 1, 0], side: t(), south: t() };
    case T.C9B_GATE: return { h: 1.6, top: ['t', T.C9B_HALLWALL, 1, 0], side: ['t', T.C9B_HALLWALL, 1, 0], south: ['t', T.C9B_GATE, 0, 0] };
    case T.C9B_CRATE: return { h: 0.7, top: t(), side: t() };
    case T.C9B_TABLE: return { h: 0.5, top: t(), side: ['t', T.C9B_HALLWALL, 0, 0] };
    case T.C9B_BOX: return { h: 0.55, top: t(), side: t() };
    default: return null;
  }
}
const pillarProp = (c, h = 30) => [16, h, (p) => {
  p.ellipse(8, h - 2, 6, 1.6, '#06060c');
  for (let y = 1; y < h - 1; y++) { const w = y < 5 ? (y - 1) / 1.3 : 3.2; p.hline(Math.round(8 - w), Math.round(8 + w), y, c.b); }
  p.vline(7, 3, h - 2, c.l); p.vline(10, 6, h - 2, c.d);
  for (let y = h - 12; y < h - 1; y++) { p.hline(2, 3, y, c.b); p.hline(13, 14, y, c.b); }
  p.vline(2, h - 12, h - 2, c.l);
  if (c.w) { p.set(7, 2, c.w); p.set(8, 10, c.w); p.set(2, h - 10, c.w); p.set(13, h - 8, c.w); }
}];
export const C9B_PROPS = {
  [T.C9B_PILLAR]: pillarProp({ ...DK, w: null }),
  [T.C9B_PILLAR_ON]: pillarProp(CY),
  [T.C9B_HUT]: [16, 18, (p, v = 0) => hutShape(p, v, 2)],
  [T.C9B_LUMP]: [16, 12, (p) => { p.ellipse(8, 9, 6, 2, '#5a5a4a'); p.ellipse(8, 8, 5, 1.5, '#7a7a6a'); }],
  [T.C9B_LUMP_ON]: [16, 18, (p) => {
    p.ellipse(8, 16, 6, 1.6, '#5a5a4a');
    p.ellipse(8, 10, 6, 5.5, '#5ac86a'); p.ellipse(7, 9, 4, 3.5, '#9af08a'); p.ellipse(6, 7, 1.8, 1.4, '#e8ffd0');
    p.set(13, 4, '#e8ffd0'); p.set(2, 6, '#e8ffd0');
  }],
  [T.C9B_LAMP]: [10, 18, (p) => {
    p.vline(5, 6, 17, WD.d); p.hline(2, 8, 2, WD.d);
    p.ellipse(5, 6, 3, 3, '#7ad86a'); p.ellipse(5, 6, 1.5, 1.5, '#e8ffd0');
  }],
};
export const C9B_PROPS_KEEP = new Set(Object.keys(C9B_PROPS).map(Number));

// ───── 色（テーマ。この 幕の タイルは 色を かえない。かえるのは 階段など 今の タイルだけ）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C9B_THEMES = {
  // 大地の下・たてあな: 青むらさきの やみ
  c9b_under: {
    floor: G([0, '#06050c'], [0.3, '#1e1a2e'], [0.6, '#4a4466'], [1, '#e4e0ff']),
    wall: G([0, '#04040a'], [0.3, '#16142a'], [0.6, '#3a3660'], [1, '#d8d8ff']),
    water: G([0, '#06142a'], [0.5, '#2a6a9a'], [1, '#e0f8ff']),
    gem: G([0, '#0a2a4a'], [0.5, '#6ac8f0'], [1, '#ffffff']),
    flame: G([0, '#1a3a1a'], [0.5, '#7ad86a'], [1, '#f4fff0']),
  },
  // 大王のやしき: あたたかい 赤と 金
  c9b_hall: {
    floor: G([0, '#140806'], [0.3, '#4a1e16'], [0.6, '#a8583a'], [1, '#fff0d8']),
    wall: G([0, '#0e0806'], [0.3, '#2e1e16'], [0.6, '#6a4a32'], [1, '#f4e0c8']),
    water: G([0, '#0a1a2a'], [0.5, '#3a7aa8'], [1, '#e0f8ff']),
    gem: G([0, '#3a2a08'], [0.5, '#f0c850'], [1, '#fffcf0']),
    flame: G([0, '#4a1a0a'], [0.5, '#f08050'], [1, '#fff8e0']),
  },
};
// テーマで 色を かえない タイル（render/tiles-castle.js の THEME_PARTS に まぜる）
const C9B_TILE_IDS = Object.keys(C9B_PAINTERS).map(Number);
export const C9B_THEME_PARTS = Object.fromEntries(['c9b_under', 'c9b_hall', 'c9a_forest'].map((th) => [th, Object.fromEntries(C9B_TILE_IDS.map((id) => [id, 'none']))]));
for (const [th, parts] of Object.entries(C9B_THEME_PARTS)) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...parts };
