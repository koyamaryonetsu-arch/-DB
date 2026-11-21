// 第3部 第1章 第3幕「さかさのピラミッド」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3.md の 11）
// ・地下の川: 岩かべ（447）/ 川岸（448）/ 川の 流れ（449〜452。流れる むきに すじが 動く。2コマ）/ ゆるい 所（453）/ 川の 中の 岩（454）/ いかだ乗り場（455）
// ・さかさのピラミッド: かべ（456）/ ゆか（457。さかさの 時は テーマ c9c_flip で 天じょうの 色）/ ゆかの あな（458）/ あなの 上の 天じょう（459。あなは うすく 見える）/
//   ぶら下がる 石（460 さかさの 時の かべ）/ 石の 下（461 ふつうの 時。かげと 先っぽ）/ さかさの 台（462。2コマ）/
//   ふきぬけ（463 砂が 下へ・464 さかさの 時 砂が 上へ。3コマ）/ ふちの さく（465）/ 回復の いずみ（466）/ わらべ歌の 石の 板（467）
// かべ・ゆか・石は テーマの 色（c9c_pyr … 金の 砂岩 / c9c_flip … さかさの 時の 天じょう。うす紫）。ほかは もとの 色の まま
// (p, v, f) … Painter / ちがい / アニメの コマ
import { T } from '../../shared/tiles.js?v=36007aad9f1d';
import { prand } from './pixel.js?v=36007aad9f1d';
import { THEME_PARTS } from './tiles-castle.js?v=36007aad9f1d';

const RK = { d: '#06060c', b: '#12121e', l: '#20203a', hl: '#34345a' }; // 川の 岩かべ
const BK = { d: '#1a1824', b: '#2a2836', l: '#3c3a4c', hl: '#5a5870' }; // 川岸
const WA = { d: '#081a30', b: '#0e2a48', l: '#2a5a8a', hl: '#7ab8e8' }; // 川の 水
const WD = { d: '#3a2414', b: '#6a4426', l: '#9a6a3a', hl: '#c89a5a' }; // 木
const SA = { d: '#7a5a2a', b: '#c8a050', l: '#f0d080', hl: '#fff4c0' }; // 砂

function cave(p, v) {
  p.rect(0, 0, 16, 16, RK.b);
  const r = prand(v * 29 + 3);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.ellipse(x + 1, y + 1, 3, 2, RK.l); p.hline(x - 1, x + 2, y - 1, RK.hl); }
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RK.d);
}
function bank(p, v) {
  p.rect(0, 0, 16, 16, BK.b);
  const r = prand(v * 11 + 5);
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 15); p.ellipse(x, y, 1.6, 1.1, i % 2 ? BK.l : BK.d); p.set(x, y - 1, BK.hl); }
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), BK.d);
}
const DIRV = { [T.C9C_RIV_N]: [0, -1], [T.C9C_RIV_E]: [1, 0], [T.C9C_RIV_S]: [0, 1], [T.C9C_RIV_W]: [-1, 0] };
export const RIVER_FRAMES9C = 2;
function water(p, v, f, calm = false) {
  p.rect(0, 0, 16, 16, calm ? '#0a2240' : WA.b);
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), WA.d);
  if (calm) {
    // ゆるい 所: 小さな わ
    const x = 4 + (v % 7), y = 4 + ((v >> 2) % 7);
    p.hline(x - 2 - f, x + 2 + f, y, WA.l); p.set(x, y - 1, WA.hl);
  }
}
function river(p, v, f, id) {
  water(p, v, f);
  const [dx, dy] = DIRV[id];
  // 流れる むきの すじ（コマで すすむ）
  for (let k = 0; k < 3; k++) {
    const a = (k * 5 + (v % 5) + f * 4) % 16, b = (k * 6 + 3 + (v % 3)) % 14 + 1;
    if (dx) { const x0 = dx > 0 ? a : 15 - a; for (let j = 0; j < 4; j++) { const x = (x0 + j * dx + 16) % 16; p.set(x, b, j < 2 ? WA.l : WA.hl); } }
    else { const y0 = dy > 0 ? a : 15 - a; for (let j = 0; j < 4; j++) { const y = (y0 + j * dy + 16) % 16; p.set(b, y, j < 2 ? WA.l : WA.hl); } }
  }
}
function rivRock(p, v, f) {
  water(p, v, f);
  p.ellipse(8, 9, 6, 5, '#2a2834'); p.ellipse(7, 7, 4.5, 3.5, '#3e3c4c'); p.hline(5, 9, 5, '#5a586c');
  p.hline(2, 14, 14, WA.hl);
}
function dock(p, v) {
  p.rect(0, 0, 16, 16, WD.b);
  for (let y = 0; y < 16; y += 4) { p.hline(0, 15, y, WD.d); p.hline(0, 15, y + 1, WD.l); }
  p.set(2 + (v % 3), 6, WD.d); p.set(12, 10 + (v % 2), WD.d);
  p.vline(0, 0, 15, WD.d); p.vline(15, 0, 15, WD.d);
}
// ピラミッドの かべ・ゆか（明るい 灰色で かく。色は テーマ）
function wall(p, v) {
  p.rect(0, 0, 16, 16, '#9a9a9a');
  for (let y = 0; y < 16; y += 4) {
    p.hline(0, 15, y, '#5a5a5a');
    const off = (y / 4) % 2 ? 4 : 0;
    for (let x = off; x < 16; x += 8) p.vline(x, y, y + 3, '#5a5a5a');
    p.hline(0, 15, y + 1, '#c4c4c4');
  }
  const r = prand(v * 17 + 9);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#7a7a7a');
}
function floor(p, v) {
  p.rect(0, 0, 16, 16, '#bcbcbc');
  p.hline(0, 15, 0, '#8a8a8a'); p.vline(0, 0, 15, '#8a8a8a');
  p.hline(1, 15, 8, '#a2a2a2'); p.vline(8, 1, 15, '#a2a2a2');
  const r = prand(v * 13 + 7);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#d8d8d8' : '#9a9a9a');
}
function hole(p, v) {
  floor(p, v);
  p.ellipse(8, 8, 7, 6.5, '#3a2a12'); p.ellipse(8, 8.5, 6, 5.5, '#120a04'); p.ellipse(8, 9, 4, 3.5, '#040202');
  const r = prand(v * 5 + 2);
  for (let i = 0; i < 4; i++) p.set(4 + Math.floor(r() * 8), 5 + Math.floor(r() * 6), SA.d);
}
function holeCeil(p, v) {
  floor(p, v);
  // あなは うすく（下の ゆかに ある 物）
  for (let a = 0; a < 24; a++) { const t = (a / 24) * Math.PI * 2; if (a % 2) p.set(Math.round(8 + Math.cos(t) * 6), Math.round(8 + Math.sin(t) * 5.5), '#8a8a8a'); }
}
function stone(p, v) {
  p.rect(0, 0, 16, 16, '#6a6a6a');
  p.ellipse(8, 8, 7.5, 7, '#8a8a8a'); p.ellipse(7, 6, 5, 4, '#a8a8a8'); p.hline(4, 9, 3, '#c8c8c8');
  p.ellipse(10, 12, 3, 2, '#5a5a5a');
}
function stoneLow(p, v) {
  floor(p, v);
  // 上に ぶら下がる 石の かげと、先っぽ
  p.ellipse(8, 10, 6, 3, '#8a8a8a'); p.ellipse(8, 10, 4, 2, '#7a7a7a');
  for (let y = 0; y < 6; y++) p.hline(8 - Math.max(0, 3 - Math.floor(y / 2)), 8 + Math.max(0, 3 - Math.floor(y / 2)), y, y % 2 ? '#5a4a6a' : '#6a5a7a');
  p.set(8, 6, '#4a3a5a');
}
export const PAD_FRAMES9C = 2;
function pad(p, v, f) {
  p.rect(0, 0, 16, 16, '#5a4a6a');
  p.ellipse(8, 8, 7, 6.5, '#2a1a3a'); p.ellipse(8, 8, 6, 5.5, f ? '#c8a0ff' : '#9a70e0'); p.ellipse(8, 8, 4, 3.5, '#3a2a5a');
  // 上と 下の 矢じるし
  const c = f ? '#ffffff' : '#f0e0ff';
  p.set(8, 3, c); p.hline(7, 9, 4, c); p.set(8, 5, c);
  p.set(8, 12, c); p.hline(7, 9, 11, c); p.set(8, 10, c);
  p.hline(6, 10, 8, '#e8d8ff');
}
export const SHAFT_FRAMES9C = 3;
function shaft(p, v, f, up) {
  p.rect(0, 0, 16, 16, '#06040a');
  const r = prand(v * 3 + 1);
  // 砂の すじ（下へ … ふつう / 上へ … さかさ）
  for (let k = 0; k < 6; k++) {
    const x = Math.floor(r() * 16), y0 = Math.floor(r() * 16);
    for (let j = 0; j < 3; j++) {
      const y = up ? (y0 - f * 4 - j * 2 + 32) % 16 : (y0 + f * 4 + j * 2) % 16;
      p.set(x, y, up ? (j ? '#a888d8' : '#f0d8ff') : (j ? SA.b : SA.hl));
    }
  }
  p.set((v * 5) % 16, (f * 5 + v) % 16, up ? '#e8c8ff' : SA.l);
}
function fence(p, v) {
  floor(p, v);
  p.hline(0, 15, 5, WD.d); p.hline(0, 15, 6, WD.l); p.hline(0, 15, 11, WD.d); p.hline(0, 15, 12, WD.l);
  for (const x of [1, 6, 11]) { p.vline(x, 2, 15, WD.d); p.vline(x + 1, 2, 15, WD.b); p.set(x + 1, 2, WD.hl); }
}
export const FOUNT_FRAMES9C = 2;
function fount(p, v, f) {
  floor(p, v);
  p.ellipse(8, 9, 7, 5.5, '#8a7a5a'); p.ellipse(8, 9, 5.5, 4, '#2a6a9a'); p.ellipse(7, 8, 3, 2, '#6ac8f0');
  p.set(6 + f * 2, 8, '#ffffff'); p.set(10 - f, 10, '#e0f8ff');
}
function tablet(p, v) {
  floor(p, v);
  p.rect(3, 1, 10, 14, '#7a6a4a'); p.rect(4, 2, 8, 12, '#c8b078');
  for (let y = 4; y < 13; y += 3) { p.hline(5, 10, y, '#7a6a4a'); p.set(5 + (y % 4), y - 1, '#7a6a4a'); }
  p.hline(3, 12, 15, '#4a3a2a');
}

export const C9C_PAINTERS = {
  [T.C9C_CAVE]: (p, v) => cave(p, v),
  [T.C9C_BANK]: (p, v) => bank(p, v),
  [T.C9C_RIV_N]: (p, v, f) => river(p, v, f, T.C9C_RIV_N),
  [T.C9C_RIV_E]: (p, v, f) => river(p, v, f, T.C9C_RIV_E),
  [T.C9C_RIV_S]: (p, v, f) => river(p, v, f, T.C9C_RIV_S),
  [T.C9C_RIV_W]: (p, v, f) => river(p, v, f, T.C9C_RIV_W),
  [T.C9C_POOL]: (p, v, f) => water(p, v, f, true),
  [T.C9C_RIVROCK]: (p, v, f) => rivRock(p, v, f),
  [T.C9C_DOCK]: (p, v) => dock(p, v),
  [T.C9C_WALL]: (p, v) => wall(p, v),
  [T.C9C_FLOOR]: (p, v) => floor(p, v),
  [T.C9C_HOLE]: (p, v) => hole(p, v),
  [T.C9C_HOLE_C]: (p, v) => holeCeil(p, v),
  [T.C9C_STONE]: (p, v) => stone(p, v),
  [T.C9C_STONE_LOW]: (p, v) => stoneLow(p, v),
  [T.C9C_PAD]: (p, v, f) => pad(p, v, f),
  [T.C9C_SHAFT]: (p, v, f) => shaft(p, v, f, false),
  [T.C9C_SHAFT_UP]: (p, v, f) => shaft(p, v, f, true),
  [T.C9C_FENCE]: (p, v) => fence(p, v),
  [T.C9C_FOUNT]: (p, v, f) => fount(p, v, f),
  [T.C9C_TABLET]: (p, v) => tablet(p, v),
};
const RIV = [T.C9C_RIV_N, T.C9C_RIV_E, T.C9C_RIV_S, T.C9C_RIV_W, T.C9C_POOL, T.C9C_RIVROCK];
export const C9C_FRAMES = {
  ...Object.fromEntries(RIV.map((id) => [id, RIVER_FRAMES9C])),
  [T.C9C_PAD]: PAD_FRAMES9C, [T.C9C_SHAFT]: SHAFT_FRAMES9C, [T.C9C_SHAFT_UP]: SHAFT_FRAMES9C, [T.C9C_FOUNT]: FOUNT_FRAMES9C,
};
export const C9C_SPEED = {
  ...Object.fromEntries(RIV.map((id) => [id, 260])),
  [T.C9C_PAD]: 420, [T.C9C_SHAFT]: 120, [T.C9C_SHAFT_UP]: 120, [T.C9C_FOUNT]: 480,
};

// ───── 2.5D ─────
// 川と ゆるい 所は 少し ひくい・ゆかの あなと ふきぬけは ずっと 下。岩かべ・かべ・ぶら下がる 石（さかさの 時）・川の 岩・さくは ブロック
export const C9C_FLOOR_H = {
  ...Object.fromEntries(RIV.slice(0, 5).map((id) => [id, -0.2])),
  [T.C9C_HOLE]: -0.8, [T.C9C_SHAFT]: -0.9, [T.C9C_SHAFT_UP]: -0.9,
};
export function c9cBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C9C_CAVE: return { h: 1.4 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C9C_WALL: return { h: 1.6, top: t(), side: t() };
    case T.C9C_RIVROCK: return { h: 0.5, top: t(), side: ['t', T.C9C_CAVE, v, 0] };
    case T.C9C_STONE: return { h: 1.2, top: t(), side: t() };
    case T.C9C_FENCE: return { h: 0.6, top: ['t', T.C9C_FENCE, v, 0], side: ['t', T.C9C_FENCE, v, 0] };
    case T.C9C_TABLET: return { h: 0.9, top: ['t', T.C9C_WALL, v, 0], side: t() };
    default: return null;
  }
}
export const C9C_PROPS = {
  [T.C9C_FOUNT]: [16, 14, (p) => {
    p.ellipse(8, 10, 7, 3.5, '#8a7a5a'); p.ellipse(8, 9.5, 5.5, 2.5, '#2a6a9a'); p.ellipse(7, 9, 3, 1.4, '#6ac8f0');
    p.vline(8, 2, 8, '#8ad8ff'); p.set(8, 1, '#ffffff'); p.set(6, 4, '#e0f8ff'); p.set(10, 5, '#e0f8ff');
  }],
};
export const C9C_PROPS_KEEP = new Set([T.C9C_FOUNT]);

// ───── 色（テーマ）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C9C_THEMES = {
  // 地下の川: 青い やみ（川の タイルは 色を かえない）
  c9c_river: {
    floor: G([0, '#06060c'], [0.3, '#1a1a2e'], [0.6, '#44446a'], [1, '#e0e0ff']),
    wall: G([0, '#04040a'], [0.3, '#141428'], [0.6, '#363660'], [1, '#d8d8ff']),
    water: G([0, '#06142a'], [0.5, '#2a6a9a'], [1, '#e0f8ff']),
    gem: G([0, '#0a2a4a'], [0.5, '#6ac8f0'], [1, '#ffffff']),
    flame: G([0, '#3a2a0a'], [0.5, '#f0c050'], [1, '#fff8e0']),
  },
  // さかさのピラミッド（ふつう）: 金の 砂岩。ゆかの 下から 見上げた ような、少し 赤みの ある 金
  c9c_pyr: {
    floor: G([0, '#1a1006'], [0.15, '#4a3214'], [0.3, '#8a6430'], [0.5, '#c09a52'], [0.75, '#e2c47e'], [1, '#fff4d4']),
    wall: G([0, '#120a04'], [0.15, '#3a240e'], [0.3, '#6a4820'], [0.5, '#9a7238'], [0.75, '#c8a05a'], [1, '#f4dca0']),
    water: G([0, '#06222e'], [0.35, '#1d6c8c'], [0.7, '#5cbad2'], [1, '#e8fcff']),
    gem: G([0, '#0a2a58'], [0.5, '#2a7ad0'], [1, '#d0f0ff']),
    flame: null,
  },
  // さかさのピラミッド（さかさの 時）: 天じょうの 色（うす紫の 石・金の すじ）
  c9c_flip: {
    floor: G([0, '#100818'], [0.15, '#2a1a3e'], [0.3, '#4a3466'], [0.5, '#6e5490'], [0.75, '#a088c0'], [1, '#f0e4ff']),
    wall: G([0, '#0a0610'], [0.15, '#22142e'], [0.3, '#3e2852'], [0.5, '#5e4478'], [0.75, '#8a70a8'], [1, '#e8dcff']),
    water: G([0, '#1a0a3a'], [0.35, '#5a2aa8'], [0.7, '#a87ae8'], [1, '#fbf0ff']),
    gem: G([0, '#3a2a08'], [0.5, '#f0c850'], [1, '#fffcf0']),
    flame: null,
  },
};
// テーマで 色を かえない タイル（かべ・ゆか・石・天じょうだけ テーマの 色）
const C9C_TILE_IDS = Object.keys(C9C_PAINTERS).map(Number);
const THEMED = {
  [T.C9C_WALL]: 'wall', [T.C9C_STONE]: 'wall', [T.C9C_TABLET]: 'wall',
  [T.C9C_FLOOR]: 'floor', [T.C9C_STONE_LOW]: 'floor', [T.C9C_HOLE_C]: 'floor', [T.C9C_HOLE]: 'floor', [T.C9C_FENCE]: 'floor', [T.C9C_FOUNT]: 'floor',
};
export const C9C_THEME_PARTS = {
  c9c_river: Object.fromEntries(C9C_TILE_IDS.map((id) => [id, 'none'])),
  c9c_pyr: Object.fromEntries(C9C_TILE_IDS.map((id) => [id, THEMED[id] || 'none'])),
  c9c_flip: Object.fromEntries(C9C_TILE_IDS.map((id) => [id, THEMED[id] || 'none'])),
};
for (const [th, parts] of Object.entries(C9C_THEME_PARTS)) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...parts };
// 第3部 第1章 第2幕の タイルも この テーマでは もとの 色の まま（2.5D の まわりの 石）
export const C9C_TILE_LIST = C9C_TILE_IDS;
