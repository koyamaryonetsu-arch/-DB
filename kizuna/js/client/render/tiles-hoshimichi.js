// 第6章 Step 3・4「星めぐりの古道」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-ch6.js が まぜる
// ・星の もや（HM_MIST 280）… 夜色の 石の ゆかに 白い もやが うずまく / 星の 道しるべ（281）… もやの 上で 星が 光る（3コマ）
// ・かれた 谷（282）… 千年前の 川の 底（ひびわれた 砂と 小石）/ 星の木の なえ（283）/ 落ちた星（284）… 光る ひびの 入った 星の 岩
// ・光る 道しるべ（285）… 星を のせた 石の 柱（3コマ）/ 星受けの台（286）/ 星の石（287）・ともった 星の石（288）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=df2b5cb0d2d6';
import { prand } from './pixel.js?v=df2b5cb0d2d6';

const NS = { d: '#1a1c34', b: '#2a2e50', l: '#3c4270', ln: '#14162a' }; // 夜色の 石
const MIST = { a: '#9aa0d0', b: '#c8ccf0', w: '#eef0ff' };
const STAR = { g: '#ffe680', w: '#ffffff', b: '#a8c8ff', o: '#f0c040' };

function stoneBase(p, v) {
  p.rect(0, 0, 16, 16, NS.b);
  const r = prand(v * 37 + 11);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? NS.l : NS.d);
  p.hline(0, 15, 0, NS.ln);
  p.vline(0, 0, 15, NS.ln);
}
function mistOver(p, v) {
  const r = prand(v * 19 + 3);
  for (let k = 0; k < 3; k++) {
    const y = 2 + k * 5 + Math.floor(r() * 2);
    const x0 = Math.floor(r() * 6);
    p.hline(x0, x0 + 6 + Math.floor(r() * 4), y, MIST.a);
    p.hline(x0 + 2, x0 + 5, y - 1, MIST.b);
  }
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), MIST.b);
}
// 星の もや（昼の 本当の 道も この 絵）
function paintMist(p, v) {
  stoneBase(p, v);
  mistOver(p, v);
}
// 星の 道しるべ（夜空が 見える 間、本当の 道に 星が 光る）
export const ROUTE_FRAMES = 3;
function paintRoute(p, v, f) {
  stoneBase(p, v);
  mistOver(p, v);
  const k = f % ROUTE_FRAMES;
  // まん中の 星（5つの とげ）
  const c = k === 1 ? STAR.w : STAR.g;
  p.hline(5, 10, 7, c); p.hline(5, 10, 8, c); p.vline(7, 4, 11, c); p.vline(8, 4, 11, c);
  p.set(6, 6, c); p.set(9, 6, c); p.set(6, 9, c); p.set(9, 9, c);
  p.set(7, 7, STAR.w); p.set(8, 8, STAR.w);
  // まわりの 小さな 光
  for (const [x, y] of [[2, 2], [13, 3], [3, 13], [12, 12]]) if ((x + y + k) % 3 !== 0) p.set(x, y, STAR.b);
}
// かれた 谷（千年前の 川の 底）
function paintDryValley(p, v) {
  p.rect(0, 0, 16, 16, '#a08a62');
  const r = prand(v * 29 + 7);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#8a7450' : '#c0a87a');
  // ひびわれ
  let x = Math.floor(r() * 6) + 2, y = 1;
  for (let i = 0; i < 12; i++) { p.set(x, y, '#6a5638'); y += 1; x += Math.floor(r() * 3) - 1; x = Math.max(0, Math.min(15, x)); }
  // 小石
  for (let i = 0; i < 3; i++) { const sx = Math.floor(r() * 13) + 1, sy = Math.floor(r() * 13) + 1; p.rect(sx, sy, 2, 2, '#7a7468'); p.set(sx, sy, '#a8a294'); }
}
// 千年前の 星の木の なえ
function paintYoungTree(p, v, f) {
  stoneBase(p, v);
  p.ellipse(8, 13.5, 5, 1.8, '#5a3e22'); p.hline(4, 11, 13, '#7a5a32');
  p.vline(8, 6, 13, '#5a8a3a');
  for (const [x, y] of [[6, 7], [10, 6], [5, 10], [11, 10], [8, 4]]) { p.ellipse(x, y, 2, 1.4, '#4aa05a'); p.set(x, y, f % 2 ? '#d8ffb0' : '#b8f090'); }
  p.set(8, 3, '#fff6b0');
}
// 今の 落ちた星（道を ふさぐ 大きな 星の 岩。ひびが 光る）
function paintMeteor(p, v, f) {
  stoneBase(p, v);
  p.ellipse(8, 9, 7, 6, '#3a3448'); p.ellipse(7, 8, 6, 5, '#5a5068'); p.ellipse(6, 6, 3, 2, '#7a7088');
  const g = f % 2 ? '#ffd860' : '#f0b040';
  for (const [x, y] of [[5, 9], [6, 10], [7, 10], [8, 11], [10, 7], [11, 8], [9, 6]]) p.set(x, y, g);
  p.set(4, 5, '#a8a0c0');
}
// 光る 道しるべ（千年前に 受けとめた 星を のせた 石の 柱）
export const POST_FRAMES = 3;
function paintStarPost(p, v, f) {
  stoneBase(p, v);
  p.ellipse(8, 14, 4, 1.4, NS.ln);
  p.rect(6, 6, 4, 8, '#8a88a8'); p.vline(6, 6, 13, '#b0aecc'); p.vline(9, 6, 13, '#5a5878');
  const k = f % POST_FRAMES;
  const c = k === 2 ? STAR.w : STAR.g;
  p.hline(5, 10, 3, c); p.vline(7, 0, 5, c); p.vline(8, 0, 5, c); p.set(6, 2, c); p.set(9, 2, c); p.set(6, 4, c); p.set(9, 4, c);
  p.set(7, 2, STAR.w); p.set(8, 3, STAR.w);
  for (const [x, y] of [[3, 1], [12, 2], [2, 6], [13, 7]]) if ((x + k) % 2) p.set(x, y, STAR.b);
}
// 千年前の 星受けの台（石の 台に 星の 形の くぼみ）
function paintStarCatch(p, v) {
  stoneBase(p, v);
  p.ellipse(8, 14, 6, 1.6, NS.ln);
  p.rect(3, 9, 10, 5, '#9a96b8'); p.hline(3, 12, 9, '#c8c4e0'); p.hline(3, 12, 13, '#6a6688');
  p.ellipse(8, 7, 5, 2.4, '#b8b4d4'); p.ellipse(8, 7, 3.6, 1.4, '#5a5878');
  p.set(8, 6, STAR.b); p.set(7, 7, STAR.b); p.set(9, 7, STAR.b);
}
// 星の石（ふむ石。on … ともった）
function paintStarStone(p, v, on) {
  p.rect(0, 0, 16, 16, '#4a4c70');
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a3c5c');
  p.rect(2, 2, 12, 12, on ? '#6a6450' : '#7a7aa8');
  p.hline(2, 13, 2, on ? '#4a4434' : '#a8a8d0'); p.vline(2, 2, 13, on ? '#4a4434' : '#a8a8d0');
  p.hline(2, 13, 13, '#2a2c48'); p.vline(13, 2, 13, '#2a2c48');
  const c = on ? STAR.g : '#4a4a78';
  p.hline(5, 10, 7, c); p.hline(5, 10, 8, c); p.vline(7, 4, 11, c); p.vline(8, 4, 11, c);
  p.set(6, 6, c); p.set(9, 6, c); p.set(6, 9, c); p.set(9, 9, c);
  if (on) { p.set(7, 7, STAR.w); p.set(8, 8, STAR.w); }
}

export const HM_PAINTERS = {
  [T.HM_MIST]: (p, v) => paintMist(p, v),
  [T.HM_ROUTE]: (p, v, f) => paintRoute(p, v, f),
  [T.DRY_VALLEY]: (p, v) => paintDryValley(p, v),
  [T.YOUNG_TREE]: (p, v, f) => paintYoungTree(p, v, f),
  [T.METEOR]: (p, v, f) => paintMeteor(p, v, f),
  [T.STAR_POST]: (p, v, f) => paintStarPost(p, v, f),
  [T.STAR_CATCH]: (p, v) => paintStarCatch(p, v),
  [T.STAR_STONE]: (p, v) => paintStarStone(p, v, false),
  [T.STAR_STONE_ON]: (p, v) => paintStarStone(p, v, true),
};
export const HM_FRAMES = { [T.HM_ROUTE]: ROUTE_FRAMES, [T.STAR_POST]: POST_FRAMES };
export const HM_SPEED = { [T.HM_ROUTE]: 260, [T.STAR_POST]: 300 };

// ───── 2.5D ─────
// かれた 谷は 少し ひくい（今の 川と おなじ くらい）。落ちた星は ひくい 岩の かたまり
export const HM_FLOOR_H = { [T.DRY_VALLEY]: -0.22, [T.STAR_STONE_ON]: -0.05 };
export function hmBlockSpec(id, v) {
  if (id === T.METEOR) return { h: 0.9, top: ['t', T.METEOR, v, 0], side: ['t', T.METEOR, v, 0] };
  return null;
}
export const HM_PROPS = {
  [T.YOUNG_TREE]: [12, 16, (p) => {
    p.ellipse(6, 14.5, 4, 1.4, '#5a3e22');
    p.vline(6, 6, 14, '#5a8a3a');
    for (const [x, y] of [[4, 7], [8, 6], [3, 10], [9, 10], [6, 3]]) { p.ellipse(x, y, 2, 1.4, '#4aa05a'); p.set(x, y, '#d8ffb0'); }
  }],
  [T.STAR_POST]: [12, 24, (p) => {
    p.rect(4, 8, 4, 15, '#8a88a8'); p.vline(4, 8, 22, '#b0aecc'); p.vline(7, 8, 22, '#5a5878');
    p.hline(2, 9, 4, STAR.g); p.vline(5, 0, 7, STAR.g); p.vline(6, 0, 7, STAR.g); p.set(5, 3, STAR.w); p.set(6, 4, STAR.w);
  }],
  [T.STAR_CATCH]: [16, 16, (p) => {
    p.rect(3, 8, 10, 7, '#9a96b8'); p.hline(3, 12, 8, '#c8c4e0'); p.hline(3, 12, 14, '#6a6688');
    p.ellipse(8, 6, 5, 2.4, '#b8b4d4'); p.ellipse(8, 6, 3.6, 1.4, '#5a5878');
  }],
};

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
const theme = (floor, wall, water, gem) => ({
  floor: G([0, floor[0]], [0.3, floor[1]], [0.6, floor[2]], [1, '#f4f0ff']),
  wall: G([0, wall[0]], [0.3, wall[1]], [0.6, wall[2]], [1, '#ece8ff']),
  water: G([0, water[0]], [0.5, water[1]], [1, '#e8f0ff']),
  gem: G([0, '#0a0a20'], [0.5, gem], [1, '#ffffff']),
  flame: null,
});
export const HM_THEMES = {
  // 今の 古道: こけむした 夜色の 石（青むらさき）
  hoshimichi: theme(['#0e1020', '#3a4068', '#9aa0c8'], ['#080a18', '#2a2e50', '#6a70a0'], ['#0a1430', '#3a5aa8'], '#a8c8ff'),
  // 千年前の 古道: できたばかりの 白い 石と 星の 金
  hoshimichi_past: theme(['#1a1828', '#7a7898', '#e0dcf0'], ['#121020', '#5a5878', '#b8b4d0'], ['#1a1830', '#6a68a8'], '#ffe680'),
};
