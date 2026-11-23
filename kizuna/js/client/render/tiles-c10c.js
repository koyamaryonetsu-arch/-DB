// 第3部 第2章 第3幕「紫と、うばわれた音」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15）
// ・空の 小島: 地面（551）/ 光の 橋 5色（552〜556。2コマ）/ 橋の 石（557）/ いせきの 石だたみ（558）・くずれた 柱（559）・うき石（560）/
//   紫の 光の 玉（561。2コマ）/ 光の うず（562。4コマ）。下の 雲の 海は 第5章の T.CLOUD_SEA
// ・少年の とりで: かべ（563）・ゆか（564）/ 流れる ベルト 赤・青 × 4方向（565〜572。4コマ … 矢じるしが 流れる 方へ 動く）/
//   赤・青の レバー（573〜576）/ 箱の 山（577）/ おし出される 箱（578。2コマ）/ 光の びんの たな（579）/ 少年の 間の ゆか（580）/
//   うら口（581）/ 光の 出口（582。2コマ）
// どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js?v=ae1035a9a013';
import { prand } from './pixel.js?v=ae1035a9a013';
import { THEME_PARTS } from './tiles-castle.js?v=ae1035a9a013';

const GR = { d: '#4a7a3a', b: '#7ab05a', l: '#9ac87a', hl: '#d0f0a8' }; // 小島の 草
const RU = { d: '#7a7090', b: '#b8b0c8', l: '#d0c8dc', hl: '#f0ecf8' }; // いせきの 石
const FW = { d: '#14101e', b: '#2a2438', l: '#3e3654', hl: '#5a5078' }; // とりでの かべ
const FF = { d: '#3a3448', b: '#5a5468', l: '#746e84', hl: '#9a94aa' }; // とりでの ゆか
const BRIDGE = {
  [T.C10C_BRIDGE_R]: ['#c83a3a', '#ff7a7a', '#ffd0d0'],
  [T.C10C_BRIDGE_Y]: ['#c8a020', '#ffe070', '#fff8d0'],
  [T.C10C_BRIDGE_G]: ['#3a9a4a', '#7ae08a', '#d8ffe0'],
  [T.C10C_BRIDGE_B]: ['#2a6ac8', '#7ab8ff', '#e0f0ff'],
  [T.C10C_BRIDGE_W]: ['#a8b0c8', '#f4f8ff', '#ffffff'],
};

function isle(p, v) {
  p.rect(0, 0, 16, 16, GR.b);
  const r = prand(v * 11 + 3);
  for (let i = 0; i < 6; i++) { const x = Math.floor(r() * 15), y = Math.floor(r() * 14) + 1; p.set(x, y, GR.l); p.set(x, y - 1, GR.hl); }
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), GR.d);
  if (v % 5 === 0) { p.set(5, 9, '#f0d0f0'); p.set(11, 4, '#fff0a0'); }
}
export const BRIDGE_FRAMES10C = 2;
function bridge(p, v, f, [d, b, l]) {
  // 光の 板（マスいっぱいに ぬる ＝ 横の 橋も たての 橋も すき間なく つながる）。まん中は 明るく・きらきらが 流れる
  p.rect(0, 0, 16, 16, b);
  p.rect(3, 3, 10, 10, l);
  p.rect(5, 5, 6, 6, b);
  for (let k = 0; k < 16; k += 4) { p.set((k + (f ? 2 : 0)) % 16, k, l); p.set(k, (k + 8 + (f ? 2 : 0)) % 16, d); }
  const r = prand(v * 7 + f);
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#ffffff');
}
function stone(p) {
  p.rect(0, 0, 16, 16, GR.b);
  p.ellipse(8, 14, 6, 1.5, '#3a5a2a');
  p.rect(4, 3, 8, 11, '#9a90b8'); p.hline(4, 11, 3, '#c8c0e0'); p.vline(4, 3, 13, '#c8c0e0'); p.vline(11, 4, 13, '#6a6088');
  // 5つの 音の 色の 点（どの 色の 橋でも かけられる）
  const C = ['#ff5a5a', '#ffd83a', '#5ad86a', '#4a9aff', '#ffffff'];
  C.forEach((c, i) => p.set(5 + (i % 3) * 3, 6 + Math.floor(i / 3) * 3, c));
}
function ruin(p, v) {
  p.rect(0, 0, 16, 16, RU.b);
  p.hline(0, 15, 7, RU.d); p.hline(0, 15, 15, RU.d);
  const o = (v % 2) * 4;
  p.vline((o + 3) % 16, 0, 6, RU.d); p.vline((o + 11) % 16, 0, 6, RU.d); p.vline((o + 7) % 16, 8, 14, RU.d);
  const r = prand(v * 13 + 1);
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RU.hl);
  if (v % 3 === 0) { p.set(3, 10, '#7aa05a'); p.set(4, 11, '#7aa05a'); }
}
function ruinWall(p) {
  p.rect(0, 0, 16, 16, RU.b);
  p.rect(4, 0, 8, 16, RU.d); p.rect(5, 0, 6, 16, '#8a80a0'); p.vline(5, 0, 15, RU.l);
  p.hline(3, 12, 0, RU.l);
}
function floatStone(p) {
  p.rect(0, 0, 16, 16, RU.b);
  p.ellipse(8, 14, 6, 1.5, RU.d);
  p.ellipse(8, 8, 6, 4, '#8a80a8'); p.ellipse(8, 7, 5, 2.5, '#b0a8d0'); p.set(6, 6, '#ffffff');
}
export const ORB_FRAMES10C = 2;
function orb(p, v, f) {
  p.rect(0, 0, 16, 16, RU.b);
  p.rect(4, 11, 8, 4, '#6a6088'); p.hline(3, 12, 11, '#8a80a8');
  p.ellipse(8, 7 - f, 5, 5, '#7a3ac8'); p.ellipse(8, 7 - f, 3.5, 3.5, '#a86ae0'); p.ellipse(7, 5 - f, 1.5, 1.5, '#f0e0ff');
  p.set(2, 2 + f, '#e0c8ff'); p.set(13, 4 - f, '#e0c8ff');
}
export const VORTEX_FRAMES10C = 4;
function vortex(p, v, f) {
  // 雲の 上に 回る むらさきの 光の うず（遠くからも 見える こい 色）
  p.rect(0, 0, 16, 16, '#e4ecf8');
  p.ellipse(8, 8, 7.5, 7.5, '#6a3ab8');
  p.ellipse(8, 8, 5.5, 5.5, '#8a5ad8');
  for (let i = 0; i < 3; i++) {
    const a0 = (f * Math.PI) / 2 + (i * 2 * Math.PI) / 3;
    for (let k = 0; k < 11; k++) {
      const a = a0 + k * 0.38, rr = 0.8 + k * 0.62;
      const x = Math.round(8 + Math.cos(a) * rr), y = Math.round(8 + Math.sin(a) * rr);
      p.set(x, y, k < 4 ? '#ffffff' : k < 8 ? '#f0e0ff' : '#c8a8ff');
      if (k >= 3 && k < 8) p.set(x + 1, y, '#d8c0ff');
    }
  }
  p.ellipse(8, 8, 1.6, 1.6, '#ffffff');
  p.set(8, 8, '#ffffff');
}
function fwall(p, v) {
  p.rect(0, 0, 16, 16, FW.b);
  for (const y of [0, 8]) p.hline(0, 15, y, FW.d);
  p.vline((v % 2) * 8 + 3, 1, 7, FW.d); p.vline((v % 2) * 8 + 11, 9, 15, FW.d);
  p.set(2, 2, FW.hl); p.set(10, 10, FW.hl); p.hline(1, 6, 1, FW.l);
}
function ffloor(p, v) {
  p.rect(0, 0, 16, 16, FF.b);
  p.hline(0, 15, 0, FF.d); p.vline(0, 0, 15, FF.d);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) p.set(x, y, FF.hl);
  if (v % 4 === 1) { p.set(7, 8, '#c8b0ff'); }
}
export const BELT_FRAMES10C = 4;
// ベルト（d … 流れる 向き [dx, dy]・c … しるしの 色）。矢じるしが コマごとに 流れる 方へ 1/4 ずつ 動く
function belt(p, v, f, d, c) {
  p.rect(0, 0, 16, 16, '#2a2630');
  const horiz = d[1] === 0;
  // ベルトの 板（よこ じま）
  for (let i = 0; i < 16; i += 4) {
    const o = ((i + (horiz ? d[0] : d[1]) * f * 4) % 16 + 16) % 16;
    if (horiz) p.vline(o, 1, 14, '#3a3644'); else p.hline(1, 14, o, '#3a3644');
  }
  // ふちの しるしの 色
  if (horiz) { p.hline(0, 15, 0, c); p.hline(0, 15, 15, c); } else { p.vline(0, 0, 15, c); p.vline(15, 0, 15, c); }
  // 矢じるし（流れる 方へ 動く）
  const s = (horiz ? d[0] : d[1]) * f * 4;
  for (let k = -1; k <= 1; k++) {
    const t = ((k * 8 + s) % 16 + 16) % 16;
    for (let j = 0; j < 4; j++) {
      const a = (horiz ? d[0] : d[1]) > 0 ? t - j : t + j;
      if (a < 1 || a > 14) continue;
      if (horiz) { p.set(a, 8 - j, c); p.set(a, 7 + j, c); } else { p.set(8 - j, a, c); p.set(7 + j, a, c); }
    }
  }
}
function lever(p, on, c) {
  p.rect(0, 0, 16, 16, FF.b);
  p.rect(4, 10, 8, 5, '#4a4458'); p.hline(4, 11, 10, '#6a6478');
  const top = on ? [12, 3] : [4, 3];
  for (let k = 0; k <= 6; k++) { const x = Math.round(8 + (top[0] - 8) * k / 6), y = Math.round(11 + (top[1] - 11) * k / 6); p.set(x, y, '#c8c8d0'); }
  p.ellipse(top[0], top[1], 2, 2, c);
}
function crates(p, v) {
  p.rect(0, 0, 16, 16, FF.b);
  for (const [x, y] of [[0, 8], [8, 8], [4, 0]]) {
    p.rect(x, y, 8, 8, '#8a6a4a'); p.hline(x, x + 7, y, '#b08a5a'); p.vline(x, y, y + 7, '#b08a5a'); p.hline(x, x + 7, y + 7, '#5a4028'); p.vline(x + 7, y, y + 7, '#5a4028');
    p.set(x + 3, y + 3, '#f0e080'); p.set(x + 4, y + 4, '#fff8c0');
  }
  if (v % 2) p.set(12, 2, '#fff8c0');
}
export const PUSHER_FRAMES10C = 2;
function pusher(p, v, f) {
  p.rect(0, 0, 16, 16, FF.b);
  // レールの 上で 前後に ゆれる 大きな 箱
  const o = f ? 1 : 0;
  p.rect(2 + o, 2, 12, 12, '#a07a4a'); p.hline(2 + o, 13 + o, 2, '#c89a60'); p.vline(2 + o, 2, 13, '#c89a60');
  p.hline(2 + o, 13 + o, 13, '#5a4028'); p.vline(13 + o, 2, 13, '#5a4028');
  p.hline(4 + o, 11 + o, 7, '#5a4028'); p.vline(7 + o, 4, 11, '#5a4028');
  p.set(5 + o, 5, '#fff0a0');
}
function jars(p, v) {
  p.rect(0, 0, 16, 16, '#2a2238');
  p.hline(0, 15, 9, '#5a4a3a'); p.hline(0, 15, 15, '#5a4a3a');
  const C = ['#ffe070', '#7ab8ff', '#ff9a7a', '#a8ffb8', '#e0c8ff'];
  for (const [x, y, i] of [[2, 3, 0], [7, 2, 1], [12, 3, 2], [4, 10, 3], [10, 10, 4]]) {
    const c = C[(i + v) % C.length];
    p.rect(x - 1, y + 1, 3, 5, '#c8d0e0'); p.set(x, y, '#8a7a6a'); p.rect(x - 1, y + 3, 3, 3, c); p.set(x, y + 3, '#ffffff');
  }
}
function hall(p, v) {
  p.rect(0, 0, 16, 16, '#3a3050');
  p.hline(0, 15, 15, '#2a2240'); p.vline(15, 0, 15, '#2a2240');
  const r = prand(v * 5 + 2);
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#5a4a78');
  if (v % 7 === 0) p.set(8, 8, '#8a6ac8');
}
function backdoor(p) {
  p.rect(0, 0, 16, 16, '#1a1410');
  p.rect(3, 2, 10, 14, '#3a2a1a'); p.rect(4, 3, 8, 13, '#0a0806');
  p.hline(3, 12, 2, '#6a5030'); p.set(10, 9, '#c8a040');
}
export const PORTAL_FRAMES10C = 2;
function portal(p, v, f) {
  p.rect(0, 0, 16, 16, '#3a3050');
  p.ellipse(8, 8, 6, 6, f ? '#a888f0' : '#c8b0ff'); p.ellipse(8, 8, 4, 4, '#f0e8ff'); p.ellipse(8, 8, 2, 2, '#ffffff');
}

const BELTS = {
  [T.C10C_BELT_RN]: [[0, -1], '#e05a4a'], [T.C10C_BELT_RE]: [[1, 0], '#e05a4a'], [T.C10C_BELT_RS]: [[0, 1], '#e05a4a'], [T.C10C_BELT_RW]: [[-1, 0], '#e05a4a'],
  [T.C10C_BELT_BN]: [[0, -1], '#4a8aff'], [T.C10C_BELT_BE]: [[1, 0], '#4a8aff'], [T.C10C_BELT_BS]: [[0, 1], '#4a8aff'], [T.C10C_BELT_BW]: [[-1, 0], '#4a8aff'],
};
export const C10C_PAINTERS = {
  [T.C10C_ISLE]: (p, v) => isle(p, v),
  ...Object.fromEntries(Object.entries(BRIDGE).map(([id, c]) => [id, (p, v, f) => bridge(p, v, f, c)])),
  [T.C10C_STONE]: (p) => stone(p),
  [T.C10C_RUIN]: (p, v) => ruin(p, v),
  [T.C10C_RUINWALL]: (p) => ruinWall(p),
  [T.C10C_FLOAT]: (p) => floatStone(p),
  [T.C10C_ORB]: (p, v, f) => orb(p, v, f),
  [T.C10C_VORTEX]: (p, v, f) => vortex(p, v, f),
  [T.C10C_FWALL]: (p, v) => fwall(p, v),
  [T.C10C_FFLOOR]: (p, v) => ffloor(p, v),
  ...Object.fromEntries(Object.entries(BELTS).map(([id, [d, c]]) => [id, (p, v, f) => belt(p, v, f, d, c)])),
  [T.C10C_LEVER_R]: (p) => lever(p, false, '#e05a4a'),
  [T.C10C_LEVER_R_ON]: (p) => lever(p, true, '#e05a4a'),
  [T.C10C_LEVER_B]: (p) => lever(p, false, '#4a8aff'),
  [T.C10C_LEVER_B_ON]: (p) => lever(p, true, '#4a8aff'),
  [T.C10C_CRATES]: (p, v) => crates(p, v),
  [T.C10C_PUSHER]: (p, v, f) => pusher(p, v, f),
  [T.C10C_JARS]: (p, v) => jars(p, v),
  [T.C10C_HALL]: (p, v) => hall(p, v),
  [T.C10C_BACKDOOR]: (p) => backdoor(p),
  [T.C10C_PORTAL]: (p, v, f) => portal(p, v, f),
};
export const C10C_FRAMES = {
  ...Object.fromEntries(Object.keys(BRIDGE).map((id) => [id, BRIDGE_FRAMES10C])),
  ...Object.fromEntries(Object.keys(BELTS).map((id) => [id, BELT_FRAMES10C])),
  [T.C10C_ORB]: ORB_FRAMES10C, [T.C10C_VORTEX]: VORTEX_FRAMES10C, [T.C10C_PUSHER]: PUSHER_FRAMES10C, [T.C10C_PORTAL]: PORTAL_FRAMES10C,
};
export const C10C_SPEED = {
  ...Object.fromEntries(Object.keys(BRIDGE).map((id) => [id, 500])),
  ...Object.fromEntries(Object.keys(BELTS).map((id) => [id, 140])),
  [T.C10C_ORB]: 400, [T.C10C_VORTEX]: 160, [T.C10C_PUSHER]: 450, [T.C10C_PORTAL]: 350,
};

// ───── 2.5D ─────
// 光の 橋は 小島より 少し 低い（雲の 上に うかぶ 板）。ベルトは ゆかと 同じ
export const C10C_FLOOR_H = { ...Object.fromEntries(Object.keys(BRIDGE).map((id) => [id, -0.05])) };
export function c10cBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    // とりでの かべは ひくめ（1マスの はばの ベルトの 道が 2.5D でも 見える ように）
    case T.C10C_FWALL: return { h: 1.05 + (v % 3) * 0.08, top: t(), side: t() };
    case T.C10C_RUINWALL: return { h: 1.3 + (v % 2) * 0.3, top: ['t', T.C10C_RUIN, v, 0], side: t() };
    case T.C10C_CRATES: return { h: 0.9, top: t(), side: t() };
    case T.C10C_JARS: return { h: 1.5, top: ['t', T.C10C_FWALL, v, 0], side: ['t', T.C10C_FWALL, v, 0], south: t() };
    default: return null;
  }
}
export const C10C_PROPS = {
  [T.C10C_STONE]: [12, 18, (p) => {
    p.ellipse(6, 16, 5, 1.5, '#3a5a2a');
    p.rect(2, 3, 8, 13, '#9a90b8'); p.hline(2, 9, 3, '#c8c0e0'); p.vline(2, 3, 15, '#c8c0e0'); p.vline(9, 4, 15, '#6a6088');
    const C = ['#ff5a5a', '#ffd83a', '#5ad86a', '#4a9aff', '#ffffff'];
    C.forEach((c, i) => p.set(4 + (i % 2) * 3, 5 + Math.floor(i / 2) * 3, c));
  }],
  [T.C10C_ORB]: [16, 20, (p) => {
    p.rect(4, 14, 8, 5, '#6a6088'); p.hline(3, 12, 14, '#8a80a8');
    p.ellipse(8, 8, 6, 6, '#7a3ac8'); p.ellipse(8, 8, 4, 4, '#a86ae0'); p.ellipse(7, 6, 2, 2, '#f0e0ff');
  }],
  [T.C10C_FLOAT]: [16, 16, (p) => {
    p.ellipse(8, 15, 5, 1, '#5a5078');
    p.ellipse(8, 7, 7, 4, '#8a80a8'); p.ellipse(8, 6, 5, 2.5, '#b0a8d0'); p.set(5, 5, '#ffffff');
  }],
  [T.C10C_LEVER_R]: [12, 16, (p) => { p.rect(2, 10, 8, 5, '#4a4458'); p.vline(6, 3, 10, '#c8c8d0'); p.vline(5, 3, 10, '#c8c8d0'); p.ellipse(3, 3, 2, 2, '#e05a4a'); }],
  [T.C10C_LEVER_R_ON]: [12, 16, (p) => { p.rect(2, 10, 8, 5, '#4a4458'); p.vline(6, 3, 10, '#c8c8d0'); p.ellipse(9, 3, 2, 2, '#e05a4a'); }],
  [T.C10C_LEVER_B]: [12, 16, (p) => { p.rect(2, 10, 8, 5, '#4a4458'); p.vline(6, 3, 10, '#c8c8d0'); p.ellipse(3, 3, 2, 2, '#4a8aff'); }],
  [T.C10C_LEVER_B_ON]: [12, 16, (p) => { p.rect(2, 10, 8, 5, '#4a4458'); p.vline(6, 3, 10, '#c8c8d0'); p.ellipse(9, 3, 2, 2, '#4a8aff'); }],
};
export const C10C_PROPS_KEEP = new Set(Object.keys(C10C_PROPS).map(Number));

// ───── 色（テーマ）: もとの 色 ─────
const IDS10C = Object.keys(C10C_PAINTERS).map(Number);
for (const th of ['c9b_under']) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...Object.fromEntries(IDS10C.map((id) => [id, 'none'])) };
export const C10C_THEMES = {};
