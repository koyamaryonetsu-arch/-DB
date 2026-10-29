// 第49回 O1（剣・和・かげの 仕事）: O1 だけの どうぐと つぶの かきかた（つぶの なまえは o1〜）
// ・o1Prop    … 小道具の 絵（かぶと・ナイフ・くない・はり・小判・ぜに・✓・サングラス・書類・ペン・変装・のぼり旗・軍配・扇・時計・天びん・
//                指さしの 手・手がかりカード・虫めがね・電球・六角の 盾・金の 丸い 盾・よろいの 板・赤い 目・印の 光）
// ・o1Hex     … 六角の まく（敵や 味方を つつむ。ひびが 入って 割れる）
// ・o1Chain   … まきつく 鎖（輪の 連なりが 的の まわりを まわって しまる）
// ・o1Reticle … 照準（4方から あつまって ちぢむ 輪と 十字）
// ・o1Bg      … 発射の あとの 一しゅんの うすい 背景（金の 城と 朝日・光の 空・夜の 影）。a は 0.35 まで
// ・o1Spot    … 上から の スポットライト
// ・o1Tri     … 光の 三角形（デルタストライク）
// 画面の 文字は カタカナ・ひらがな・記号だけ（漢字は 出さない）
import { rnd, clamp01, lerp, easeOut, easeInOut, softGlow, disc } from './axkit.js?v=060276fb0270';
import { prop as g3prop, text as g3text, hitBurst, blast, glitter, rich, per, line, ribbon, arcPts, capLife } from './axfx-g3-kit.js?v=060276fb0270';

export { hitBurst, blast, glitter, rich, per, line, ribbon, arcPts, capLife, g3prop, g3text };

const TAU = Math.PI * 2;
const W0 = 256, H0 = 144;
const cx = (v, m = 120) => Math.max(-m, Math.min(W0 + m, v));
const cy = (v, m = 120) => Math.max(-m, Math.min(H0 + m, v));

// ───────────── 色 ─────────────
export const COL = {
  white: ['#ffffff', '#e8f4ff', '#bfe4ff'],
  steel: ['#ffffff', '#d8e4f0', '#9ab0c8'],
  gold: ['#ffffff', '#fff0a0', '#ffd23a'],
  red: ['#ffffff', '#ffb0a0', '#ff4a3a'],
  fire: ['#fff2a0', '#ffb040', '#ff6a1a'],
  ice: ['#ffffff', '#c8f4ff', '#7ad8ff'],
  bolt: ['#ffffff', '#fff6b0', '#ffd83a'],
  wind: ['#ffffff', '#c8ffd8', '#6ad89a'],
  dark: ['#e8d8ff', '#b48aff', '#6a3ab8'],
  heal: ['#ffffff', '#c8ffe0', '#7dffb0'],
  holy: ['#ffffff', '#fff6d0', '#ffe08a'],
  earth: ['#e8d0a0', '#a08060', '#6a5040'],
  poison: ['#f0c8ff', '#c070f0', '#8a3ad8'],
  sakura: ['#f7a1c4', '#ffd0e4', '#ffffff'],
  orange: ['#fff2a0', '#ffa040', '#ff5a1a'],
  blue: ['#ffffff', '#bfe4ff', '#5a9aff'],
  ink: ['#4a4a5a', '#2a2a34', '#8a8aa8'],
};
// 属性の 色と 形（魔法剣・クロス魔法剣・デルタストライク）
export const ELEM = {
  fire: { main: '#ff6a1a', glow: '#ffb040', core: '#fff2a0', list: COL.fire, shape: 'fire' },
  ice: { main: '#7ad8ff', glow: '#c8f4ff', core: '#ffffff', list: COL.ice, shape: 'ice' },
  bolt: { main: '#ffd83a', glow: '#fff6b0', core: '#ffffff', list: COL.bolt, shape: 'bolt' },
  wind: { main: '#6ad89a', glow: '#c8ffd8', core: '#ffffff', list: COL.wind, shape: 'wind' },
  blast: { main: '#ff8a3a', glow: '#ffd08a', core: '#ffffff', list: ['#ffffff', '#ffd08a', '#ff8a3a'], shape: 'blast' },
  light: { main: '#ffe08a', glow: '#fff6d0', core: '#ffffff', list: COL.holy, shape: 'light' },
  dark: { main: '#8a5ad8', glow: '#b48aff', core: '#ffffff', list: COL.dark, shape: 'dark' },
  water: { main: '#2f7bff', glow: '#8fd8ff', core: '#ffffff', list: ['#ffffff', '#8fd8ff', '#2f7bff'], shape: 'water' },
  earth: { main: '#c89a5a', glow: '#e8d0a0', core: '#ffffff', list: COL.earth, shape: 'earth' },
  none: { main: '#bfe4ff', glow: '#7ac8ff', core: '#ffffff', list: COL.white, shape: 'none' },
};
export const elemOf = (e) => ELEM[e] || ELEM[{ heal: 'light', holy: 'light', poison: 'dark', void: 'light', thunder: 'bolt' }[e]] || ELEM.none;

// ───────────── 位置 ─────────────
// 出した 人（味方は 画面の 下の はし、敵は え の まん中）
export const src = (c) => ({ x: c.from.x, y: c.fromAlly ? c.H - 10 : c.from.y });
// 上むき（味方 → 敵）は -1、下むき（敵 → 味方）は 1
export const vdir = (c) => (c.dir === 'down' ? 1 : -1);
// 的の 上（頭の 上）
export const above = (c, t, k = 22) => ({ x: t.x, y: t.y - k * c.sz });

// ───────────── どうぐ ─────────────
export function prop(fx, name, x, y, o = {}) {
  const { life = 700, fout = 180, delay = 0, s = 1, spin = 0, rot0 = 0 } = o;
  const p = { ...o, kind: 'o1Prop', prop: name, x: cx(x), y: cy(y), life, fout, delay, s, spin, rot0 };
  if (o.to) Object.assign(p, { x1: cx(o.to.x), y1: cy(o.to.y), travel: o.travel || 300 });
  delete p.to;
  fx.add(p);
  return delay;
}
export function hex(fx, x, y, o = {}) {
  const { r = 22, sy = 1.15, color = '#7ac8ff', color2 = '#ffffff', life = 600, fin = 120, fout = 160, crack = -1, delay = 0, alpha = 1, dome = true } = o;
  fx.add({ kind: 'o1Hex', x: cx(x), y: cy(y), r, sy, color, color2, life, fin, fout, crack, delay, alpha, dome, seed: Math.random() * 10 });
  return delay;
}
// 六角の まくが くだける（かけらが とぶ）
export function shatter(fx, x, y, o = {}) {
  const { r = 22, n = 12, colors = ['#bfe4ff', '#ffffff', '#7ac8ff'], delay = 0, speed = 120 } = o;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(-0.2, 0.2);
    const sp = speed * rnd(0.6, 1.3);
    fx.add({ kind: 'axShape', shape: 'diamond', x: x + Math.cos(a) * r * 0.7, y: y + Math.sin(a) * r * 0.7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, g: 220, drag: 0.97, color: colors[i % colors.length], size: rnd(1.8, 3.2), rot0: rnd(0, 6), spin: rnd(-10, 10), delay, life: rnd(420, 620), add: true, pop: false });
  }
  return delay;
}
export function chain(fx, x, y, o = {}) {
  const { r0 = 30, r1 = 14, sy = 0.45, n = 14, color = '#c8a0ff', color2 = '#5a2a9a', life = 700, wrap = 300, fout = 200, delay = 0, rows = 2, h = 16 } = o;
  fx.add({ kind: 'o1Chain', x: cx(x), y: cy(y), r0, r1, sy, n, color, color2, life, wrap, fout, delay, rows, h });
  return delay + wrap;
}
export function reticle(fx, x, y, o = {}) {
  const { r0 = 40, r1 = 12, lock = 300, life = 600, fout = 160, color = '#ff3a3a', delay = 0 } = o;
  fx.add({ kind: 'o1Reticle', x: cx(x), y: cy(y), r0, r1, lock, life, fout, color, delay });
  return delay + lock;
}
export function bg(fx, v, o = {}) {
  const { a = 0.3, life = 500, fin = 100, fout = 220, delay = 0 } = o;
  fx.add({ kind: 'o1Bg', x: W0 / 2, y: H0 / 2, v, a: Math.min(0.35, a), life, fin, fout, delay });
  return delay;
}
export function spot(fx, x, y, o = {}) {
  const { w = 26, color = '#fff6d0', life = 600, fin = 80, fout = 200, delay = 0, a = 0.5 } = o;
  fx.add({ kind: 'o1Spot', x: cx(x), y: cy(y), w, color, life, fin, fout, delay, a });
  return delay;
}
export function tri(fx, x, y, o = {}) {
  const { r = 40, cols = ['#ffffff', '#ff8a3a', '#7ad8ff'], life = 900, draw = 300, shrink = -1, fout = 200, delay = 0, rot = -Math.PI / 2 } = o;
  fx.add({ kind: 'o1Tri', x: cx(x), y: cy(y), r, cols, life, draw, shrink, fout, delay, rot });
  return delay + draw;
}
// 文字（カタカナ・記号）
export const text = (fx, s, x, y, o = {}) => g3text(fx, s, x, y, o);
// 何回も あたる 技の j回目の 的（ランダムの かわりに じゅんばん）
export const pick = (c, j) => c.targets[j % c.n];
// 的の かずで つぶを へらす（1体 … n、3体 … n/2、5体 … n×0.3）
export const pn = (c, n) => per(c, n);

// 状態の しるし（上向き・下向きの 矢印）
export function arrows(fx, x, y, o = {}) {
  const { color = '#ff5a5a', up = true, n = 2, delay = 0, life = 520, s = 1.6, gap = 70, dx = 9 } = o;
  for (let i = 0; i < n; i++) {
    const ox = (i - (n - 1) / 2) * dx;
    g3prop(fx, 'arrow', x + ox, y + (i % 2) * 4, { s, dir: up ? -1 : 1, color, life, fout: 180, vy: up ? -24 : 22, delay: delay + i * gap, glow: color, glowR: 6 });
  }
  return delay;
}
// Zz（ねむり）
export function zzz(fx, x, y, o = {}) {
  const { delay = 0, life = 520, color = '#e8d8ff' } = o;
  ['Z', 'z', 'Z'].forEach((s, i) => g3text(fx, s, x + 4 + i * 6, y - i * 6, { size: 7 + (2 - i) * 1.2, color, color2: '#4a2a7a', life: life - i * 60, fout: 160, delay: delay + i * 90, vy: -12 }));
  return delay;
}
// 頭の 上の 星（ピヨピヨ）
export function dizzy(fx, x, y, o = {}) {
  const { delay = 0, life = 520, n = 3 } = o;
  for (let j = 0; j < n; j++) {
    const a = (j / n) * TAU;
    g3prop(fx, j === 1 ? 'chick' : 'text', x + Math.cos(a) * 10, y + Math.sin(a) * 3, { text: '★', size: 7, color: '#ffe066', color2: '#8a5a08', s: 1.1, life, fout: 160, delay: delay + j * 40 });
  }
  return delay;
}
// あたった 光（的の かずで つぶを わける）
export function strike(fx, c, t, at, o = {}) {
  const { r = 14, glow = '#bfe4ff', colors = COL.white, n = 18, heavy = false, rings = 1, extra = 0, extraCols = colors } = o;
  hitBurst(fx, t.x, t.y, { r: r * c.sz, glow, colors, n: per(c, n), delay: at, heavy: heavy && !c.all, rings });
  if (extra) rich(fx, c, t, at, extra, extraCols);
  return at;
}
// 剣の 一閃（三日月）
export function swing(fx, c, t, at, o = {}) {
  const { r = 28, ang = -0.6, w = 7, color = '#e8f4ff', glow = '#7ac8ff', core = '#ffffff', swing: sw = 120, life = 380, after = 2, flip = false, span = 2.2, spark = !c.all } = o;
  const a = c.dir === 'down' ? -ang : ang;
  // 出した 人から 的へ はしる 細い 光（はなって から 斬る まで の あいだ）
  const start = Math.max(0, at - Math.round(sw * 0.6));
  if (o.rush !== false && start > 90) {
    const s = src(c);
    const base = Math.max(0, Math.min(start - 90, at - c.hit));
    const dr = Math.max(60, start - base - 20);
    line(fx, s.x, s.y - 6, t.x, t.y, { w: 1.4, color, glow, core, draw: dr, hold: 30, life: dr + 120, delay: base, alpha: 0.8 });
  }
  return c.k.slash(t.x, t.y, { r: r * c.sz, ang: a, flip, w: w * c.sz, color, glow, core, delay: Math.max(0, at - Math.round(sw * 0.6)), swing: sw, life, after, span, spark });
}
// 残像の 人かげ（剣士・忍び）
export function figure(fx, x, y, o = {}) {
  return g3prop(fx, 'swordsman', x, y, { s: 1.2, pose: 'slash', color: '#ffffff', blade: '#ffffff', alpha: 0.6, ...o });
}
// 地面の 土けむり
export function dust(fx, x, y, o = {}) {
  const { n = 4, color = '#c8b090', delay = 0, r1 = 10, life = 440, alpha = 0.5 } = o;
  for (let j = 0; j < n; j++) fx.puff(x + (j - (n - 1) / 2) * 7, y, { color, r0: 3, r1, vx: (j - (n - 1) / 2) * 18, vy: -8, life, alpha, delay: delay + j * 15 });
  return delay;
}
// ドロン（けむり）
export function poof(fx, x, y, o = {}) {
  const { n = 6, color = '#e8e8f0', delay = 0, r = 10, life = 480 } = o;
  for (let j = 0; j < n; j++) {
    const a = (j / n) * TAU;
    fx.puff(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.3, { color, r0: 3, r1: r, vx: Math.cos(a) * 30, vy: Math.sin(a) * 16 - 10, life, alpha: 0.7, delay: delay + (j % 2) * 20 });
  }
  return delay;
}

// ───────────── 小道具の 絵 ─────────────
function poly(x, pts, fill = true) {
  x.beginPath();
  for (let i = 0; i < pts.length; i += 2) (i ? x.lineTo(pts[i], pts[i + 1]) : x.moveTo(pts[i], pts[i + 1]));
  x.closePath();
  if (fill) x.fill(); else x.stroke();
}
function hexPath(x, r) {
  x.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.closePath();
}
const PROP = {
  // かぶと（half: -1・1 … 割れた かたほう）
  helmet(x, p) {
    const h = p.half || 0;
    x.save();
    if (h) { x.beginPath(); x.rect(h < 0 ? -14 : 0, -14, 14, 24); x.clip(); }
    x.fillStyle = '#5a6a80';
    x.beginPath(); x.arc(0, 0, 9, Math.PI, 0); x.lineTo(11, 3); x.lineTo(-11, 3); x.closePath(); x.fill();
    x.fillStyle = '#9ab0c8';
    x.beginPath(); x.arc(0, 0, 7, Math.PI, Math.PI * 1.55); x.lineTo(0, 0); x.closePath(); x.fill();
    x.fillStyle = '#ffd23a';
    x.beginPath(); x.moveTo(-2, -8); x.quadraticCurveTo(-9, -14, -10, -18); x.quadraticCurveTo(-4, -13, 0, -9); x.quadraticCurveTo(4, -13, 10, -18); x.quadraticCurveTo(9, -14, 2, -8); x.closePath(); x.fill();
    x.fillStyle = '#3a4656'; x.fillRect(-11, 2, 22, 2.4);
    x.restore();
  },
  knife(x) {
    x.fillStyle = '#e8eef8';
    x.beginPath(); x.moveTo(-10, 0); x.lineTo(2, -2); x.lineTo(2, 2); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(-6, -1.2, 8, 0.6);
    x.fillStyle = '#5a5a6a'; x.fillRect(2, -2.6, 1.2, 5.2);
    x.fillStyle = '#1a1a22'; x.fillRect(3.2, -1.3, 6, 2.6);
  },
  kunai(x) {
    x.fillStyle = '#3a3a46';
    x.beginPath(); x.moveTo(-10, 0); x.lineTo(-3, -2.6); x.lineTo(0, 0); x.lineTo(-3, 2.6); x.closePath(); x.fill();
    x.fillStyle = '#9aa8c0'; x.beginPath(); x.moveTo(-9, 0); x.lineTo(-3, -1.4); x.lineTo(-3, 0); x.closePath(); x.fill();
    x.fillStyle = '#2a2a34'; x.fillRect(0, -0.9, 6, 1.8);
    x.strokeStyle = '#2a2a34'; x.lineWidth = 0.8; x.beginPath(); x.arc(8, 0, 1.8, 0, TAU); x.stroke();
  },
  needle(x) {
    x.strokeStyle = '#e8f0ff'; x.lineWidth = 0.9;
    x.beginPath(); x.moveTo(-9, 0); x.lineTo(6, 0); x.stroke();
    x.fillStyle = '#c070f0'; x.fillRect(5, -1, 3, 2);
  },
  koban(x, p) {
    const sq = Math.cos((p.age || 0) / 60);
    x.scale(0.4 + 0.6 * Math.abs(sq), 1);
    x.fillStyle = '#c8901a'; x.beginPath(); x.ellipse(0, 0, 4, 6, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(0, 0, 3.2, 5.2, 0, 0, TAU); x.fill();
    x.strokeStyle = '#c8901a'; x.lineWidth = 0.5;
    for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(-2.2, i * 1.8); x.lineTo(2.2, i * 1.8); x.stroke(); }
  },
  zeni(x, p) {
    const sq = Math.cos((p.age || 0) / 55 + 1);
    x.scale(0.4 + 0.6 * Math.abs(sq), 1);
    x.fillStyle = '#b8782a'; x.beginPath(); x.arc(0, 0, 4.4, 0, TAU); x.fill();
    x.fillStyle = '#e8a84a'; x.beginPath(); x.arc(0, 0, 3.6, 0, TAU); x.fill();
    x.fillStyle = '#3a2208'; x.fillRect(-1.2, -1.2, 2.4, 2.4);
  },
  check(x, p) {
    x.strokeStyle = p.color || '#ffd23a'; x.lineWidth = 3; x.lineCap = 'round'; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(-7, 0); x.lineTo(-2, 6); x.lineTo(9, -8); x.stroke();
    x.strokeStyle = '#ffffff'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(-7, 0); x.lineTo(-2, 6); x.lineTo(9, -8); x.stroke();
  },
  shades(x) {
    x.fillStyle = '#14141c';
    x.beginPath(); x.ellipse(-4.5, 0, 4, 2.8, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(4.5, 0, 4, 2.8, 0, 0, TAU); x.fill();
    x.fillRect(-1, -1.2, 2, 1);
    x.fillStyle = '#ffffff'; x.fillRect(-6.5, -1.4, 2, 0.8); x.fillRect(2.5, -1.4, 2, 0.8);
  },
  doc(x) {
    x.fillStyle = '#ffffff'; x.fillRect(-5, -7, 10, 14);
    x.fillStyle = '#c8d0e0'; for (let i = 0; i < 4; i++) x.fillRect(-3.5, -4 + i * 2.6, 7, 0.8);
    x.strokeStyle = '#e8202a'; x.lineWidth = 1.2; x.beginPath(); x.arc(2, 3, 2.6, 0, TAU); x.stroke();
    x.fillStyle = '#e8202a'; x.fillRect(1.4, 1.6, 1.2, 2.8);
  },
  pen(x, p) {
    x.fillStyle = '#1a1a26'; x.fillRect(-8, -1.4, 13, 2.8);
    x.fillStyle = '#c8c8d8'; x.fillRect(-8, -1.4, 2, 2.8); x.fillRect(-3, -2, 0.8, 1);
    x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(5, -1.4); x.lineTo(9, 0); x.lineTo(5, 1.4); x.closePath(); x.fill();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 9, 0, 5, p.color || '#7ad8ff', 0.9 * x.globalAlpha);
  },
  // 変装（v: 0 帽子・1 めがね・2 ひげ）
  disguise(x, p) {
    const v = p.v || 0;
    x.fillStyle = '#2a2230'; x.beginPath(); x.arc(0, 2, 6, 0, TAU); x.fill();
    if (v === 0) { x.fillStyle = '#5a3a2a'; x.fillRect(-8, -4, 16, 2); x.fillRect(-5, -10, 10, 6); x.fillStyle = '#c83a3a'; x.fillRect(-5, -6, 10, 1.4); }
    if (v === 1) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.9; x.beginPath(); x.arc(-2.6, 1, 2, 0, TAU); x.arc(2.6, 1, 2, 0, TAU); x.stroke(); x.fillStyle = '#ffd0a0'; x.fillRect(-0.6, 2, 1.2, 2.4); }
    if (v === 2) { x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(-2.6, 4, 3, 1.2, 0.3, 0, TAU); x.ellipse(2.6, 4, 3, 1.2, -0.3, 0, TAU); x.fill(); x.fillStyle = '#ffffff'; x.fillRect(-3, -0.5, 1.4, 1.4); x.fillRect(1.6, -0.5, 1.4, 1.4); }
  },
  // のぼり旗（赤）
  flag(x, p) {
    const fl = Math.sin((p.age || 0) / 90) * 1.2;
    x.fillStyle = '#5a3a1a'; x.fillRect(-0.8, -22, 1.6, 26);
    x.fillStyle = '#ffd23a'; x.beginPath(); x.arc(0, -23, 1.6, 0, TAU); x.fill();
    x.fillStyle = p.color || '#e8302a';
    x.beginPath(); x.moveTo(0.8, -20); x.lineTo(9 + fl, -19); x.lineTo(9 - fl * 0.5, -4); x.lineTo(0.8, -4); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(4.8, -12, 2.4, 0, TAU); x.fill();
    x.fillStyle = '#ffd23a'; x.fillRect(0.8, -20, 8.6, 1.2);
  },
  // 軍配（うちわの 形）
  gunbai(x) {
    x.fillStyle = '#3a2a1a'; x.fillRect(-0.9, 2, 1.8, 10);
    x.fillStyle = '#1a1a26'; x.beginPath(); x.ellipse(0, -5, 8, 9, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffd23a'; x.beginPath(); x.ellipse(0, -5, 6.6, 7.6, 0, 0, TAU); x.fill();
    x.fillStyle = '#e8302a'; x.beginPath(); x.arc(0, -5, 3.2, 0, TAU); x.fill();
  },
  // 金の 扇（日の丸）
  sensu(x, p) {
    const op = clamp01((p.age || 0) / 200);
    const sp = 0.2 + 1.2 * easeOut(op);
    x.fillStyle = '#ffd23a';
    x.beginPath(); x.moveTo(0, 6); x.arc(0, 6, 16, -Math.PI / 2 - sp, -Math.PI / 2 + sp); x.closePath(); x.fill();
    x.fillStyle = '#fff6d0';
    x.beginPath(); x.moveTo(0, 6); x.arc(0, 6, 6, -Math.PI / 2 - sp, -Math.PI / 2 + sp); x.closePath(); x.fill();
    x.strokeStyle = '#a87a10'; x.lineWidth = 0.4;
    for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 - sp + (2 * sp * i) / 8; x.beginPath(); x.moveTo(0, 6); x.lineTo(Math.cos(a) * 16, 6 + Math.sin(a) * 16); x.stroke(); }
    if (op > 0.6) { x.fillStyle = '#e8302a'; x.beginPath(); x.arc(0, -4, 3.4, 0, TAU); x.fill(); }
  },
  // 時計（行動ゲージ。針が はやく 回る）
  clock(x, p) {
    x.strokeStyle = p.color || '#5ab8ff'; x.lineWidth = 1.6;
    x.beginPath(); x.arc(0, 0, 8, 0, TAU); x.stroke();
    x.lineWidth = 0.6;
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; x.beginPath(); x.moveTo(Math.cos(a) * 6.4, Math.sin(a) * 6.4); x.lineTo(Math.cos(a) * 7.6, Math.sin(a) * 7.6); x.stroke(); }
    const a = (p.age || 0) / 40;
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 6, Math.sin(a) * 6); x.stroke();
    x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a / 12) * 4, Math.sin(a / 12) * 4); x.stroke();
  },
  // 天びん
  scales(x, p) {
    const sw = Math.sin((p.age || 0) / 120) * 0.15;
    x.strokeStyle = p.color || '#ffd23a'; x.fillStyle = p.color || '#ffd23a'; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, -10); x.lineTo(0, 9); x.moveTo(-5, 9); x.lineTo(5, 9); x.stroke();
    x.save(); x.translate(0, -8); x.rotate(sw);
    x.beginPath(); x.moveTo(-11, 0); x.lineTo(11, 0); x.stroke();
    for (const s of [-1, 1]) {
      x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(s * 11, 0); x.lineTo(s * 8, 7); x.moveTo(s * 11, 0); x.lineTo(s * 14, 7); x.stroke();
      x.beginPath(); x.arc(s * 11, 7, 3.4, 0, Math.PI); x.fill();
    }
    x.restore();
  },
  // 指さしの 手
  finger(x, p) {
    x.fillStyle = p.color || '#ffe0c0'; x.strokeStyle = '#5a3a2a'; x.lineWidth = 0.8;
    x.beginPath();
    x.moveTo(-10, -4); x.lineTo(6, -4); x.quadraticCurveTo(10, -4, 10, -2); x.quadraticCurveTo(10, 0, 6, 0);
    x.lineTo(0, 0); x.lineTo(0, 7); x.quadraticCurveTo(-5, 9, -10, 6); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#2a3a8a'; x.fillRect(-16, -5, 6, 12);
    x.fillStyle = '#ffffff'; x.fillRect(-11, -5, 1.4, 12);
  },
  // 手がかりカード（v: 0 虫めがね・1 足あと・2 指紋・3 かぎ）
  clue(x, p) {
    const v = p.v || 0;
    x.fillStyle = '#fff6e0'; x.fillRect(-7, -9, 14, 18);
    x.strokeStyle = '#c8901a'; x.lineWidth = 1; x.strokeRect(-7, -9, 14, 18);
    x.strokeStyle = '#3a2a1a'; x.fillStyle = '#3a2a1a'; x.lineWidth = 1;
    if (v === 0) { x.beginPath(); x.arc(-1, -1, 3.4, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(1.6, 1.6); x.lineTo(4.6, 4.6); x.stroke(); }
    if (v === 1) { for (const [a, b] of [[-2, 3], [2, -3]]) { x.beginPath(); x.ellipse(a, b, 1.6, 2.6, 0, 0, TAU); x.fill(); x.beginPath(); x.arc(a, b - 3.6, 0.8, 0, TAU); x.fill(); } }
    if (v === 2) { for (let r = 1; r <= 5; r += 1.3) { x.beginPath(); x.ellipse(0, 0, r * 0.8, r, 0, Math.PI * 1.1, Math.PI * 2.9); x.stroke(); } }
    if (v === 3) { x.beginPath(); x.arc(0, -4, 2.4, 0, TAU); x.stroke(); x.fillRect(-0.5, -1.6, 1, 8); x.fillRect(0, 3, 2.4, 1); x.fillRect(0, 5, 1.8, 1); }
  },
  magnifier(x, p) {
    x.strokeStyle = '#3a2a1a'; x.lineWidth = 3; x.lineCap = 'round';
    x.beginPath(); x.moveTo(7, 7); x.lineTo(15, 15); x.stroke();
    x.strokeStyle = '#ffd23a'; x.lineWidth = 2.4;
    x.beginPath(); x.arc(0, 0, 10, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha *= 0.35; x.fillStyle = p.color || '#c8f0ff'; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill(); x.globalAlpha /= 0.35;
    x.fillStyle = '#ffffff'; x.fillRect(-5, -6, 3, 1.2);
  },
  bulb(x) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -2, 18, '#fff2a0', 0.9 * x.globalAlpha);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#fff6b0'; x.beginPath(); x.arc(0, -3, 6, 0, TAU); x.fill();
    x.fillStyle = '#fffbe0'; x.beginPath(); x.arc(-1.6, -5, 2, 0, TAU); x.fill();
    x.fillStyle = '#9aa0b0'; x.fillRect(-2.6, 2.6, 5.2, 4);
    x.fillStyle = '#6a7080'; x.fillRect(-2.6, 3.6, 5.2, 0.8); x.fillRect(-2.6, 5.2, 5.2, 0.8);
    x.strokeStyle = '#ffd23a'; x.lineWidth = 0.8;
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45; x.beginPath(); x.moveTo(Math.cos(a) * 9, -3 + Math.sin(a) * 9); x.lineTo(Math.cos(a) * 13, -3 + Math.sin(a) * 13); x.stroke(); }
  },
  // 六角の 盾（前に 立つ）
  hexshield(x, p) {
    const C = p.color || '#7ac8ff';
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 20, C, 0.6 * x.globalAlpha);
    x.globalAlpha *= 0.55; x.fillStyle = C; hexPath(x, 11); x.fill();
    x.globalAlpha /= 0.55; x.strokeStyle = '#ffffff'; x.lineWidth = 1.2; hexPath(x, 11); x.stroke();
    x.lineWidth = 0.5; hexPath(x, 6); x.stroke();
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; x.beginPath(); x.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); x.lineTo(Math.cos(a) * 11, Math.sin(a) * 11); x.stroke(); }
  },
  // 金の 丸い 盾（アイギス）
  aegis(x, p) {
    const C = p.color || '#ffd23a';
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 22, C, 0.5 * x.globalAlpha);
    x.globalCompositeOperation = 'source-over';
    disc(x, 0, 0, 11, '#a87a10'); disc(x, 0, 0, 9.6, C);
    x.strokeStyle = '#fff6d0'; x.lineWidth = 0.8; x.beginPath(); x.arc(0, 0, 7, 0, TAU); x.stroke();
    x.fillStyle = '#fff6d0';
    poly(x, [0, -5.6, 1.6, -1.6, 5.6, 0, 1.6, 1.6, 0, 5.6, -1.6, 1.6, -5.6, 0, -1.6, -1.6]);
  },
  // よろいの 板
  armor(x, p) {
    const h = p.half || 0;
    x.save();
    if (h) { x.beginPath(); x.rect(h < 0 ? -12 : 0, -14, 12, 28); x.clip(); }
    x.fillStyle = '#6a7484';
    x.beginPath(); x.moveTo(-10, -10); x.lineTo(-4, -12); x.lineTo(4, -12); x.lineTo(10, -10); x.lineTo(9, 6); x.lineTo(0, 12); x.lineTo(-9, 6); x.closePath(); x.fill();
    x.fillStyle = '#a8b4c4'; x.beginPath(); x.moveTo(-8, -9); x.lineTo(-2, -10.5); x.lineTo(-2, 9); x.lineTo(-7.5, 5); x.closePath(); x.fill();
    x.fillStyle = '#4a5464'; for (let i = 0; i < 3; i++) x.fillRect(-9, -4 + i * 4.6, 18, 1);
    x.restore();
  },
  // 赤い 目（こわく ない まるい 光）
  eyes(x, p) {
    x.globalCompositeOperation = 'lighter';
    for (const s of [-1, 1]) { softGlow(x, s * 4, 0, 5, p.color || '#ff3a3a', 0.9 * x.globalAlpha); disc(x, s * 4, 0, 1.3, '#ffd0d0'); }
  },
  // 光の 十字
  cross(x, p) {
    const C = p.color || '#fff6b0';
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 20, C, 0.6 * x.globalAlpha);
    x.fillStyle = C; x.fillRect(-2.4, -14, 4.8, 28); x.fillRect(-10, -6, 20, 4.8);
    x.fillStyle = '#ffffff'; x.fillRect(-0.8, -12, 1.6, 24); x.fillRect(-8, -4.4, 16, 1.6);
  },
  // 光の 剣（ジャッジメント。先が 下）
  lightsword(x, p) {
    const C = p.color || '#ffe08a';
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 4, 16, C, 0.7 * x.globalAlpha);
    x.fillStyle = C;
    poly(x, [-2.2, -8, 2.2, -8, 2.2, 14, 0, 19, -2.2, 14]);
    x.fillStyle = '#ffffff'; x.fillRect(-0.7, -8, 1.4, 22);
    x.fillStyle = '#ffd23a'; x.fillRect(-7, -10, 14, 2.4);
    x.fillStyle = '#c8901a'; x.fillRect(-1.4, -17, 2.8, 7);
    disc(x, 0, -18, 1.8, '#ffd23a');
  },
  // 印を むすぶ 光（忍び）
  seal(x, p) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 10, p.color || '#ffe08a', 0.8 * x.globalAlpha);
    x.strokeStyle = p.color || '#ffe08a'; x.lineWidth = 1;
    x.beginPath(); x.arc(0, 0, 6, 0, TAU); x.stroke();
    x.beginPath(); x.moveTo(-6, 0); x.lineTo(6, 0); x.moveTo(0, -6); x.lineTo(0, 6); x.stroke();
  },
  // 金の 采配（ふさ）
  saihai(x, p) {
    x.fillStyle = '#3a2a1a'; x.fillRect(-0.8, -2, 1.6, 12);
    const fl = Math.sin((p.age || 0) / 60);
    x.fillStyle = '#ffd23a';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.28 + fl * 0.2; x.beginPath(); x.moveTo(0, -2); x.lineTo(Math.cos(a) * 12 - 1, -2 + Math.sin(a) * 12); x.lineTo(Math.cos(a) * 12 + 1, -2 + Math.sin(a) * 12); x.closePath(); x.fill(); }
    x.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.4; x.fillRect(Math.cos(a) * 9 - 0.5, -2 + Math.sin(a) * 9, 1, 1); }
  },
  // 葉っぱ
  leaf(x, p) {
    x.fillStyle = p.color || '#6ad89a';
    x.beginPath(); x.moveTo(-4, 0); x.quadraticCurveTo(0, -3.4, 4, 0); x.quadraticCurveTo(0, 3.4, -4, 0); x.fill();
    x.strokeStyle = '#2a7a4a'; x.lineWidth = 0.4; x.beginPath(); x.moveTo(-4, 0); x.lineTo(4, 0); x.stroke();
  },
  // 音符
  note(x, p) {
    x.fillStyle = p.color || '#d8b0ff';
    x.beginPath(); x.ellipse(-1.5, 3, 2.4, 1.8, -0.4, 0, TAU); x.fill();
    x.fillRect(0.4, -6, 1.1, 9);
    x.beginPath(); x.moveTo(1.5, -6); x.quadraticCurveTo(5, -4, 4, -1); x.quadraticCurveTo(4, -3.6, 1.5, -3.6); x.fill();
  },
  // つばめ（白い 光の かげ）
  swallow(x, p) {
    const fl = Math.sin((p.age || 0) / 40) * 0.25;
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 12, p.color || '#9ad8ff', 0.6 * x.globalAlpha);
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.moveTo(6, 0); x.quadraticCurveTo(2, -2, -1, -1.2);
    x.lineTo(-6, -8 - fl * 8); x.lineTo(-3, -1);
    x.lineTo(-9, -1.6); x.lineTo(-12, -4); x.lineTo(-10, 0); x.lineTo(-12, 4); x.lineTo(-9, 1.6);
    x.lineTo(-3, 1); x.lineTo(-6, 8 + fl * 8); x.lineTo(-1, 1.2); x.quadraticCurveTo(2, 2, 6, 0);
    x.closePath(); x.fill();
  },
  // 草むら（お庭番）
  bush(x) {
    for (const [bx, by, r, col] of [[-8, 2, 7, '#2a6a3a'], [6, 2, 8, '#2a7a40'], [-1, -3, 8, '#3a8a4a'], [0, 3, 6, '#1a5a2a']]) disc(x, bx, by, r, col);
  },
  // 三日月（夜）
  moon(x, p) {
    x.fillStyle = p.color || '#fff6dc';
    x.beginPath(); x.arc(0, 0, 8, -Math.PI * 0.5, Math.PI * 0.5); x.arc(-3.5, 0, 7, Math.PI * 0.42, -Math.PI * 0.42, true); x.closePath(); x.fill();
  },
};
export const O1_PROPS = Object.keys(PROP);

// ───────────── つぶの かきかた（AX_O1_FINE） ─────────────
const fadeOf = (p) => {
  const fin = p.fin ?? 0;
  const a = fin > 0 ? clamp01(p.age / fin) : 1;
  const b = p.age > p.life - p.fout ? clamp01((p.life - p.age) / Math.max(1, p.fout)) : 1;
  return Math.min(a, b);
};
export const O1_FINE = {
  o1Prop(x, p) {
    const fn = PROP[p.prop];
    if (!fn) return;
    const age = p.age;
    const pop = p.pop === false ? 1 : easeOut(clamp01(age / 140));
    const fade = age > p.life - p.fout ? clamp01((p.life - age) / Math.max(1, p.fout)) : 1;
    if (fade <= 0) return;
    let px = p.x, py = p.y;
    if (p.x1 !== undefined) {
      const m = clamp01((age - (p.moveAt || 0)) / Math.max(1, p.travel));
      const k = p.ease === 'in' ? m * m : p.ease === 'lin' ? m : p.ease === 'out' ? easeOut(m) : easeInOut(m);
      px = lerp(p.x, p.x1, k); py = lerp(p.y, p.y1, k) - Math.sin(k * Math.PI) * (p.hop || 0);
    }
    x.save();
    x.translate(px, py);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, (p.glowR || 12) * (p.s || 1), p.glow, 0.7 * fade); }
    x.rotate((p.rot0 || 0) + (p.spin || 0) * age / 1000);
    const sc = (p.s || 1) * (0.4 + 0.6 * pop);
    if (p.flipX) x.scale(-1, 1);
    x.scale(sc, sc);
    x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    x.globalAlpha = fade * (p.alpha ?? 1);
    fn(x, p, age);
    x.restore();
  },
  // 六角の まく（dome: 楕円の 中に 六角の あみ。crack ms で ひび）
  o1Hex(x, p) {
    const f = fadeOf(p);
    if (f <= 0) return;
    const grow = easeOut(clamp01(p.age / 140));
    const r = p.r * (0.6 + 0.4 * grow), ry = r * p.sy;
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    const A = f * p.alpha;
    softGlow(x, 0, 0, r * 1.3, p.color, 0.35 * A);
    x.globalAlpha = 0.18 * A; x.fillStyle = p.color;
    x.beginPath(); x.ellipse(0, 0, r, ry, 0, 0, TAU); x.fill();
    x.save();
    x.beginPath(); x.ellipse(0, 0, r, ry, 0, 0, TAU); x.clip();
    x.strokeStyle = p.color; x.lineWidth = 0.7; x.globalAlpha = 0.65 * A;
    const s = 5;
    for (let row = -6; row <= 6; row++) {
      for (let col = -6; col <= 6; col++) {
        const hx = col * s * 1.74 + (row % 2 ? s * 0.87 : 0), hy = row * s * 1.5;
        if (Math.abs(hx) > r + s || Math.abs(hy) > ry + s) continue;
        x.save(); x.translate(hx, hy); hexPath(x, s); x.stroke(); x.restore();
      }
    }
    x.restore();
    x.globalAlpha = 0.9 * A; x.strokeStyle = p.color2; x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(0, 0, r, ry, 0, 0, TAU); x.stroke();
    // 上の ハイライト
    x.globalAlpha = 0.5 * A; x.lineWidth = 1;
    x.beginPath(); x.ellipse(-r * 0.2, -ry * 0.25, r * 0.5, ry * 0.5, 0, Math.PI * 1.1, Math.PI * 1.45); x.stroke();
    if (p.crack >= 0 && p.age > p.crack) {
      const k = clamp01((p.age - p.crack) / 120);
      x.globalAlpha = A; x.strokeStyle = '#ffffff'; x.lineWidth = 1.1;
      for (let i = 0; i < 6; i++) {
        const a = p.seed + i * 1.05;
        x.beginPath(); x.moveTo(0, 0);
        let px = 0, py = 0;
        for (let j = 1; j <= 3; j++) { px = Math.cos(a + (j % 2 ? 0.25 : -0.2)) * r * k * (j / 3); py = Math.sin(a + (j % 2 ? 0.25 : -0.2)) * ry * k * (j / 3); x.lineTo(px, py); }
        x.stroke();
      }
    }
    x.restore();
  },
  // 鎖（輪の 連なり。まわりながら しまる）
  o1Chain(x, p) {
    const f = p.age > p.life - p.fout ? clamp01((p.life - p.age) / Math.max(1, p.fout)) : 1;
    if (f <= 0) return;
    const k = easeOut(clamp01(p.age / Math.max(1, p.wrap)));
    const r = lerp(p.r0, p.r1, k);
    const spin = p.age / 300;
    x.save();
    x.translate(p.x, p.y);
    for (let row = 0; row < p.rows; row++) {
      const oy = (row - (p.rows - 1) / 2) * p.h * (0.6 + 0.4 * k);
      for (let i = 0; i < p.n; i++) {
        const a = spin * (row % 2 ? -1 : 1) + (i / p.n) * TAU + row * 0.3;
        const lx = Math.cos(a) * r, ly = oy + Math.sin(a) * r * p.sy;
        const front = Math.sin(a) > 0;
        x.globalAlpha = f * (front ? 1 : 0.45);
        x.globalCompositeOperation = 'source-over';
        x.strokeStyle = p.color2; x.lineWidth = 2.2;
        x.beginPath(); x.ellipse(lx, ly, i % 2 ? 1.6 : 2.8, i % 2 ? 2.4 : 1.4, a + Math.PI / 2, 0, TAU); x.stroke();
        x.strokeStyle = p.color; x.lineWidth = 1.1;
        x.beginPath(); x.ellipse(lx, ly, i % 2 ? 1.6 : 2.8, i % 2 ? 2.4 : 1.4, a + Math.PI / 2, 0, TAU); x.stroke();
      }
    }
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, r * 1.2, p.color, 0.25 * f);
    x.restore();
  },
  // 照準
  o1Reticle(x, p) {
    const f = p.age > p.life - p.fout ? clamp01((p.life - p.age) / Math.max(1, p.fout)) : 1;
    if (f <= 0) return;
    const k = easeOut(clamp01(p.age / Math.max(1, p.lock)));
    const r = lerp(p.r0, p.r1, k);
    const locked = p.age >= p.lock;
    const pulse = locked ? 1 + 0.15 * Math.sin((p.age - p.lock) / 30) : 1;
    x.save();
    x.translate(p.x, p.y);
    x.rotate((1 - k) * 1.6);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = f;
    x.strokeStyle = p.color; x.lineWidth = locked ? 1.8 : 1.2;
    x.beginPath(); x.arc(0, 0, r * pulse, 0, TAU); x.stroke();
    x.lineWidth = 0.8;
    x.beginPath(); x.arc(0, 0, r * 0.55 * pulse, 0, TAU); x.stroke();
    // 4方の かぎ
    x.lineWidth = 1.6;
    for (let i = 0; i < 4; i++) {
      x.save(); x.rotate(i * Math.PI / 2);
      x.beginPath(); x.moveTo(r * 1.15, 0); x.lineTo(r * 1.15 + 7 * (1 - k * 0.4), 0); x.stroke();
      x.beginPath(); x.moveTo(r * 0.75, -r * 0.75); x.lineTo(r * 0.9, -r * 0.9); x.stroke();
      x.restore();
    }
    x.fillStyle = locked ? '#ffffff' : p.color;
    x.beginPath(); x.arc(0, 0, 1.4, 0, TAU); x.fill();
    if (locked) softGlow(x, 0, 0, r * 0.8, p.color, 0.4 * f);
    x.restore();
  },
  // 背景（うすい）
  o1Bg(x, p) {
    const f = fadeOf(p);
    if (f <= 0) return;
    const A = p.a * f;
    x.save();
    x.globalCompositeOperation = 'source-over';
    if (p.v === 'castle') {
      // 朝日 と 金の 城の かげ
      const g = x.createLinearGradient(0, 0, 0, H0);
      g.addColorStop(0, '#ff9a3a'); g.addColorStop(0.6, '#ffd27a'); g.addColorStop(1, '#fff0c0');
      x.globalAlpha = A * 0.8; x.fillStyle = g; x.fillRect(-8, -8, W0 + 16, H0 + 16);
      x.globalCompositeOperation = 'lighter';
      softGlow(x, W0 / 2, 70, 70, '#fff0a0', A * 1.6);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = A * 1.6;
      x.fillStyle = '#5a3a10';
      const bx = W0 / 2, by = 92;
      x.fillRect(bx - 50, by - 10, 100, 14);
      x.fillRect(bx - 32, by - 26, 64, 16);
      x.fillRect(bx - 18, by - 40, 36, 14);
      for (const [w, y] of [[60, by - 10], [42, by - 26], [26, by - 40]]) { x.beginPath(); x.moveTo(bx - w, y); x.lineTo(bx, y - 10); x.lineTo(bx + w, y); x.closePath(); x.fill(); }
      x.fillStyle = '#ffd23a';
      x.beginPath(); x.moveTo(bx - 4, by - 50); x.quadraticCurveTo(bx - 8, by - 56, bx - 9, by - 58); x.lineTo(bx - 3, by - 52); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(bx + 4, by - 50); x.quadraticCurveTo(bx + 8, by - 56, bx + 9, by - 58); x.lineTo(bx + 3, by - 52); x.closePath(); x.fill();
    } else if (p.v === 'sky') {
      // 光の 空（天から 光）
      const g = x.createLinearGradient(0, 0, 0, H0);
      g.addColorStop(0, '#fff6d0'); g.addColorStop(1, '#ffffff');
      x.globalAlpha = A; x.fillStyle = g; x.fillRect(-8, -8, W0 + 16, H0 + 16);
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = A;
      x.fillStyle = '#fff0a0';
      for (let i = 0; i < 7; i++) {
        const xx = W0 / 2 + (i - 3) * 34 + Math.sin(p.age / 300 + i) * 4;
        x.beginPath(); x.moveTo(xx - 6, -8); x.lineTo(xx + 6, -8); x.lineTo(xx + 20, H0); x.lineTo(xx - 20, H0); x.closePath(); x.fill();
      }
    } else if (p.v === 'night') {
      x.globalAlpha = A; x.fillStyle = '#1a1030'; x.fillRect(-8, -8, W0 + 16, H0 + 16);
      x.globalAlpha = A * 2; x.fillStyle = '#fff6dc';
      x.beginPath(); x.arc(206, 28, 10, -Math.PI * 0.5, Math.PI * 0.5); x.arc(202, 28, 9, Math.PI * 0.42, -Math.PI * 0.42, true); x.closePath(); x.fill();
    } else if (p.v === 'storm') {
      x.globalAlpha = A; x.fillStyle = '#2a2a5a'; x.fillRect(-8, -8, W0 + 16, H0 + 16);
    } else if (p.v === 'stage') {
      x.globalAlpha = A; x.fillStyle = '#1a1028'; x.fillRect(-8, -8, W0 + 16, H0 + 16);
    }
    x.restore();
  },
  // スポットライト（上から）
  o1Spot(x, p) {
    const f = fadeOf(p);
    if (f <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = p.a * f;
    const g = x.createLinearGradient(0, -8, 0, p.y + 20);
    g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(1, p.color);
    x.fillStyle = g;
    x.beginPath(); x.moveTo(p.x - 6, -8); x.lineTo(p.x + 6, -8); x.lineTo(p.x + p.w, p.y + 16); x.lineTo(p.x - p.w, p.y + 16); x.closePath(); x.fill();
    x.globalAlpha = p.a * f * 1.4;
    x.beginPath(); x.ellipse(p.x, p.y + 16, p.w, p.w * 0.25, 0, 0, TAU); x.fill();
    x.restore();
  },
  // 光の 三角形（3色の 辺。shrink ms から 1点に ちぢむ）
  o1Tri(x, p) {
    const f = p.age > p.life - p.fout ? clamp01((p.life - p.age) / Math.max(1, p.fout)) : 1;
    if (f <= 0) return;
    const k = easeOut(clamp01(p.age / Math.max(1, p.draw)));
    const sh = p.shrink >= 0 && p.age > p.shrink ? easeInOut(clamp01((p.age - p.shrink) / 160)) : 0;
    const r = p.r * (1 - sh * 0.92);
    const V = [0, 1, 2].map((i) => [p.x + Math.cos(p.rot + i * TAU / 3 + sh * 2) * r, p.y + Math.sin(p.rot + i * TAU / 3 + sh * 2) * r]);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = f;
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = V[i], [bx, by] = V[(i + 1) % 3];
      const ex = lerp(ax, bx, k), ey = lerp(ay, by, k);
      x.strokeStyle = p.cols[i % p.cols.length]; x.lineWidth = 4;
      x.globalAlpha = f * 0.5;
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = 1.4; x.globalAlpha = f;
      x.beginPath(); x.moveTo(ax, ay); x.lineTo(ex, ey); x.stroke();
      softGlow(x, ax, ay, 8, p.cols[i % p.cols.length], 0.8 * f);
    }
    x.restore();
  },
};
