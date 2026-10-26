// 第48回: 技の エフェクトの どうぐばこ（axkit）。ビーム・たま・三日月の 斬げき・しょうげきの わ・いなずま・ほのお・
// 水の 波・はなびら・集中線・画面の 色・ゆれ・ざんぞう・カットインの 帯 など。
// ・どれも Effects（battlefx.js）に つぶを 足すだけ。かきかたは AX_FINE（battlefx.js の FINE に まぜる）
// ・ざひょうは たたかいの 画面（BW 256 × BH 144）。BRES ばいの こまかさで かかれるので はんぱな 数も OK
// ・時間は ms（エフェクトの 時計。たたかいの 速さは Effects.tempo が かけるので、ここでは 気に しない）
// ・へんじ（return）は「あたる 時間（ms）」。つぎの えんしゅつを その 時間に あわせて ならべられる
// つかいかたは docs/plan-r48-fx-engine.md の「エンジンの使い方」。
import { makeCanvas, hexToRgb } from './pixel.js?v=5cf16f1946f7';

const TAU = Math.PI * 2;
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// t が from を こえたら 0 へ
export const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));
// きまった らんすう（こまごとに ちらつかない ギザギザ）
export const hash = (n) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
export const angleOf = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
// a から b へ len だけ すすんだ ところ
export const toward = (a, b, len) => { const L = dist(a, b) || 1; return { x: a.x + (b.x - a.x) / L * len, y: a.y + (b.y - a.y) / L * len }; };
export const centerOf = (pts) => ({ x: pts.reduce((s, p) => s + p.x, 0) / (pts.length || 1), y: pts.reduce((s, p) => s + p.y, 0) / (pts.length || 1) });

// ───────────── 属性ごとの 色 ─────────────
// main … からだの 色 / glow … まわりの ひかり / core … しん（白に ちかい） / dark … かげ / list … つぶの 色
export const PAL = {
  fire: { main: '#ff6a1a', glow: '#ffa040', core: '#fff2a0', dark: '#8a1a00', list: ['#ff4a1a', '#ffa020', '#fff27a'] },
  ice: { main: '#7ad8ff', glow: '#bfeaff', core: '#ffffff', dark: '#2a6ab0', list: ['#9ae6ff', '#e6fbff', '#5ab8e8'] },
  water: { main: '#2f7bff', glow: '#6ac8ff', core: '#eaf8ff', dark: '#123a8a', list: ['#2a78d8', '#6ac8ff', '#eaf8ff'] },
  wind: { main: '#7af0a0', glow: '#c8ffd8', core: '#ffffff', dark: '#2a8a5a', list: ['#d8ffe0', '#9af0b0', '#ffffff'] },
  blast: { main: '#ff9a2a', glow: '#ffd66b', core: '#ffffff', dark: '#8a3a0a', list: ['#ffffff', '#ffd66b', '#ff8a2a'] },
  bolt: { main: '#ffe040', glow: '#fff6b0', core: '#ffffff', dark: '#6a5a10', list: ['#fff6b0', '#ffe040', '#ffffff'] },
  light: { main: '#fff0a0', glow: '#fff6d0', core: '#ffffff', dark: '#b08a2a', list: ['#ffffff', '#fff6b0', '#ffd66b'] },
  dark: { main: '#8a4ae0', glow: '#c8a8f0', core: '#f0e0ff', dark: '#1a0a2a', list: ['#8a5ac8', '#3a2a5a', '#c8a8f0'] },
  void: { main: '#c8a8ff', glow: '#e8d8ff', core: '#ffffff', dark: '#3a2a6a', list: ['#c8a8ff', '#ffffff', '#8a6ae0'] },
  // 気（サイヤ人・かめはめ波）
  ki: { main: '#4ab8ff', glow: '#a8e4ff', core: '#ffffff', dark: '#1a4a9a', list: ['#7ad8ff', '#ffffff', '#4ab8ff'] },
  // 金色の 気
  gold: { main: '#ffd23a', glow: '#fff0a0', core: '#ffffff', dark: '#a06a0a', list: ['#ffd23a', '#fff6b0', '#ffffff'] },
  holy: { main: '#ffe8a0', glow: '#fffbe0', core: '#ffffff', dark: '#c09040', list: ['#ffffff', '#fff6c8', '#ffe08a'] },
  heal: { main: '#7dffb0', glow: '#c8ffe0', core: '#ffffff', dark: '#1a8a4a', list: ['#7dffb0', '#c8ffe0', '#ffffff'] },
  earth: { main: '#c08a50', glow: '#e8c89a', core: '#fff0d0', dark: '#4a3020', list: ['#a08060', '#6a5040', '#d8c0a0'] },
  poison: { main: '#b06ae0', glow: '#d8a8ff', core: '#f8e8ff', dark: '#4a1a6a', list: ['#b06ae0', '#d8a8ff', '#7a3aa8'] },
  pink: { main: '#ff7ad8', glow: '#ffb0ec', core: '#ffffff', dark: '#8a2a6a', list: ['#ff7ad8', '#ffb0ec', '#ffffff'] },
};
export function pal(el, fallback = 'light') {
  return PAL[el] || PAL[fallback] || PAL.light;
}
// 2つの 色の あいだ（#rrggbb だけ。ほかは a の まま）
export function mixHex(a, b, t) {
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
export function rgba(hex, a) {
  if (!/^#[0-9a-f]{3,6}$/i.test(hex)) return hex;
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ───────────── え の ぶひん ─────────────
// ぼんやり ひかる まる（#rgb・#rrggbb は 1まいの えを つかいまわす。ほかの 色は その場で グラデーション）
const glowCache = new Map();
function glowSprite(color, dense) {
  const key = dense ? color + '|d' : color;
  if (glowCache.has(key)) return glowCache.get(key);
  let c = null;
  try {
    if (typeof document !== 'undefined' && /^#[0-9a-f]{3,6}$/i.test(color)) {
      c = makeCanvas(64, 64);
      const g = c.getContext('2d');
      const [r, gg, b] = hexToRgb(color);
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      const stops = dense ? [[0, 1], [0.45, 0.85], [0.8, 0.3], [1, 0]] : [[0, 1], [0.22, 0.75], [0.55, 0.22], [1, 0]];
      for (const [o, a] of stops) gr.addColorStop(o, `rgba(${r},${gg},${b},${a})`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    }
  } catch { c = null; }
  glowCache.set(key, c);
  return c;
}
export function softGlow(x, cx, cy, r, color, a = 1, dense = false) {
  if (!(r > 0) || !(a > 0) || !Number.isFinite(cx) || !Number.isFinite(cy)) return;
  x.globalAlpha = Math.min(1, a);
  const s = glowSprite(color, dense);
  if (s) { x.drawImage(s, cx - r, cy - r, r * 2, r * 2); return; }
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
export function disc(x, cx, cy, r, color) {
  if (!(r > 0)) return;
  x.fillStyle = color;
  x.beginPath();
  x.arc(cx, cy, r, 0, TAU);
  x.fill();
}
function polyline(x, pts) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  x.stroke();
}
function polygon(x, pts) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  x.closePath();
  x.fill();
}
// 白く そめた えの うつし（カットインの かげ・ざんぞう）
const tintCache = new WeakMap();
export function tintCopy(img, color) {
  if (!img || typeof img !== 'object') return null;
  let m = tintCache.get(img);
  if (!m) { m = {}; tintCache.set(img, m); }
  if (m[color]) return m[color];
  try {
    const c = makeCanvas(img.width || 1, img.height || 1);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    m[color] = c;
  } catch { m[color] = null; }
  return m[color];
}
// 人の かげ（むねから 上。うしろ すがた / よこがお）。cx, cy … あたまの まん中、s … 大きさ（1 で あたま 半径 4）
function bustPath(x, cx, cy, s, side = 1) {
  x.beginPath();
  // あたま と かみの とげ
  const hr = 4 * s;
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const spike = i % 2 ? 1 : 1.35 + (i === 6 ? 0.25 : 0);
    const r = hr * (i > 1 && i < 11 ? spike : 1);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r * 1.05;
    if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
  }
  // あご → くび → かた → むね
  x.lineTo(cx + hr * 0.95, cy + hr * 0.6);
  x.lineTo(cx + hr * 0.5 * side, cy + hr * 1.25);
  x.lineTo(cx + hr * 0.55, cy + hr * 1.7);
  x.lineTo(cx + hr * 2.6, cy + hr * 2.3);
  x.lineTo(cx + hr * 3.1, cy + hr * 4.6);
  x.lineTo(cx - hr * 3.1, cy + hr * 4.6);
  x.lineTo(cx - hr * 2.6, cy + hr * 2.3);
  x.lineTo(cx - hr * 0.55, cy + hr * 1.7);
  x.lineTo(cx - hr * 0.5 * side, cy + hr * 1.25);
  x.lineTo(cx - hr * 0.95, cy + hr * 0.6);
  x.closePath();
}
// 雪の けっしょう・ほし・カード・ハート などの 小さな かたち（cx, cy の まわり。s … 大きさ）
function shapePath(x, shape, s) {
  x.beginPath();
  switch (shape) {
    case 'star': case 'star5':
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? s * 0.45 : s;
        i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      x.closePath();
      break;
    case 'twinkle':
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, r = i % 2 ? s * 0.22 : s;
        i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      x.closePath();
      break;
    case 'heart':
      x.moveTo(0, s * 0.9);
      x.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35);
      x.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.9);
      x.closePath();
      break;
    case 'card':
      x.rect(-s * 0.7, -s, s * 1.4, s * 2);
      break;
    case 'diamond':
      x.moveTo(0, -s); x.lineTo(s * 0.65, 0); x.lineTo(0, s); x.lineTo(-s * 0.65, 0); x.closePath();
      break;
    case 'petal':
      x.ellipse(0, 0, s, s * 0.45, 0, 0, TAU);
      break;
    case 'rock':
      x.moveTo(-s, -s * 0.2); x.lineTo(-s * 0.3, -s); x.lineTo(s * 0.8, -s * 0.6); x.lineTo(s, s * 0.4); x.lineTo(0, s); x.lineTo(-s * 0.8, s * 0.6); x.closePath();
      break;
    case 'note':
      x.ellipse(-s * 0.3, s * 0.6, s * 0.5, s * 0.35, -0.4, 0, TAU);
      x.rect(s * 0.1, -s, s * 0.22, s * 1.6);
      x.rect(s * 0.1, -s, s * 0.7, s * 0.3);
      break;
    default: // まる
      x.arc(0, 0, s, 0, TAU);
  }
}
// 雪の けっしょう（6本の うで と えだ）
function flake(x, s) {
  x.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU, c = Math.cos(a), sn = Math.sin(a);
    x.moveTo(0, 0); x.lineTo(c * s, sn * s);
    const bx = c * s * 0.55, by = sn * s * 0.55;
    for (const d of [-0.7, 0.7]) x.moveTo(bx, by), x.lineTo(bx + Math.cos(a + d) * s * 0.35, by + Math.sin(a + d) * s * 0.35);
  }
  x.stroke();
}

// ───────────── かきかた（Effects の FINE に まぜる） ─────────────
// どれも p.age（ms）で かく。x の globalAlpha・まぜかたは じぶんで きめて、さいごに もどす
export const AX_FINE = {
  // ふとい ビーム（しん＋からだ＋ひかり。ふちが ゆらぐ・ちらつく・先が のびて いく）
  axBeam(x, p) {
    const age = p.age, life = p.life;
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const head = L * easeOut(clamp01(age / Math.max(1, p.grow)));
    let env = age < p.rise ? easeOut(age / Math.max(1, p.rise)) : 1;
    if (age > life - p.fall) env *= clamp01((life - age) / Math.max(1, p.fall));
    if (p.widths && p.widths.length) {
      const s = clamp01(age / life) * (p.widths.length - 1);
      const i = Math.min(p.widths.length - 2, Math.floor(s));
      env *= p.widths.length > 1 ? lerp(p.widths[i], p.widths[i + 1], s - i) : p.widths[0];
    }
    const fl = 1 + p.flicker * (Math.sin(age / 23 + p.seed) * 0.6 + (hash(Math.floor(age / 40) + p.seed) - 0.5));
    const w = Math.max(0, p.w * env * fl);
    if (w <= 0.05) return;
    x.save();
    x.translate(p.x0, p.y0);
    x.rotate(Math.atan2(dy, dx));
    x.globalCompositeOperation = 'lighter';
    // ふちが ゆらぐ はば
    const band = (half, wob, ph) => {
      const pts = [];
      const step = 5;
      for (let s = 0; s <= head; s += step) pts.push([s, -half * (1 + wob * Math.sin(s / 6 - age / 28 + ph))]);
      pts.push([head, -half]);
      for (let s = head; s >= 0; s -= step) pts.push([s, half * (1 + wob * Math.sin(s / 7 - age / 31 + ph + 2))]);
      pts.push([0, half]);
      polygon(x, pts);
    };
    const A = p.alpha ?? 1;
    x.globalAlpha = 0.28 * A;
    x.fillStyle = p.glow;
    band(w * 1.25, 0.18, 0);
    x.globalAlpha = 0.5 * A;
    band(w * 0.8, 0.1, 1);
    x.globalAlpha = 0.95 * A;
    x.fillStyle = p.color;
    band(w * 0.5, 0.06, 2);
    x.fillStyle = p.core;
    band(w * 0.2, 0.05, 3);
    // まえへ ながれる 光の すじ
    if (p.streaks) {
      x.strokeStyle = p.core;
      x.lineWidth = Math.max(0.5, w * 0.08);
      x.globalAlpha = 0.6 * A;
      x.beginPath();
      for (let i = 0; i < 6; i++) {
        const u = ((age * 0.9 + hash(p.seed + i) * 400) % 400) / 400;
        const sx = u * head, oy = (hash(p.seed + i * 3) - 0.5) * w * 0.9;
        x.moveTo(sx, oy); x.lineTo(Math.min(head, sx + 10 + w), oy);
      }
      x.stroke();
    }
    // 出口と 先っぽの ひかり
    softGlow(x, 0, 0, w * 1.6, p.glow, 0.8 * A);
    softGlow(x, head, 0, w * 1.9, p.glow, 0.9 * A);
    x.globalAlpha = A;
    disc(x, head, 0, w * 0.55, p.core);
    x.restore();
  },
  // まわる たま（ふち・うずの うで・まわりの わ）。x1,y1 が あれば start から travel で とぶ
  axOrb(x, p) {
    const age = p.age;
    let cx = p.x0, cy = p.y0;
    let e = 0;
    if (p.x1 !== undefined && p.travel > 0) {
      e = clamp01((age - p.start) / p.travel);
      const k = e * e * (3 - 2 * e) * 0.35 + e * 0.65;
      cx = lerp(p.x0, p.x1, k);
      cy = lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI);
    }
    const grow = easeOut(clamp01(age / Math.max(1, p.grow)));
    const tail = clamp01((p.life - age) / 120);
    const r = p.r * (0.25 + 0.75 * grow) * (1 + 0.06 * Math.sin(age / 40)) * (0.4 + 0.6 * tail);
    if (r <= 0.2) return;
    const rot = (age / 1000) * TAU * 1.6 * (p.spin || 1);
    x.save();
    // しっぽ
    if (e > 0 && e < 1) {
      for (let i = 3; i >= 1; i--) {
        const ke = Math.max(0, e - i * 0.06);
        const k = ke * ke * (3 - 2 * ke) * 0.35 + ke * 0.65;
        x.globalAlpha = 0.15 * (4 - i) * tail;
        disc(x, lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI), r * (1 - i * 0.18), p.color);
      }
    }
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    softGlow(x, cx, cy, r * 2.7, p.glow, (p.dark ? 0.5 : 0.85) * tail);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = tail;
    disc(x, cx, cy, r, p.color);
    // うずの うで
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    x.strokeStyle = p.rim;
    x.lineWidth = Math.max(0.5, r * 0.16);
    const arms = p.arms || 4;
    for (let k = 0; k < arms; k++) {
      x.globalAlpha = 0.85 * tail;
      x.beginPath();
      for (let s = 0; s <= 1.0001; s += 0.125) {
        const a = rot + (k / arms) * TAU + s * 2.4;
        const rr = r * (0.2 + 0.8 * s);
        const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
        s ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    }
    // ふち と まわりの わ
    x.globalAlpha = 0.9 * tail;
    x.lineWidth = Math.max(0.5, r * 0.12);
    x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
    x.globalAlpha = 0.55 * tail;
    x.lineWidth = Math.max(0.4, r * 0.08);
    for (let k = 0; k < 2; k++) {
      x.beginPath();
      x.ellipse(cx, cy, r * 1.35, r * 0.38, rot * 0.7 + k * 1.2, 0, TAU);
      x.stroke();
    }
    x.globalAlpha = tail;
    disc(x, cx, cy, r * 0.42, p.core);
    x.restore();
  },
  // 三日月の 斬げき（まん中が ふとく、はしが ほそい）。after … ざんぞうの かず
  axCrescent(x, p) {
    const draw = (age, alpha, back) => {
      if (age < 0) return;
      const head = easeOut(clamp01(age / Math.max(1, p.swing)));
      const fade = age < p.swing ? 1 : clamp01(1 - (age - p.swing) / Math.max(1, p.life - p.swing));
      if (head <= 0.01 || fade <= 0) return;
      const thin = 0.45 + 0.55 * fade;
      const a0 = p.a0 - back * Math.sign(p.a1 - p.a0);
      const span = (p.a1 - p.a0) * head;
      const N = 18;
      const outer = [], inner = [], glowO = [], glowI = [];
      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const a = a0 + span * s;
        const th = p.w * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.85 + 0.15 * s * s)), 0.7) * thin;
        const c = Math.cos(a), sn = Math.sin(a);
        outer.push([c * (p.r + th * 0.25), sn * (p.r + th * 0.25)]);
        inner.push([c * (p.r - th), sn * (p.r - th)]);
        glowO.push([c * (p.r + th * 0.6 + 1.2), sn * (p.r + th * 0.6 + 1.2)]);
        glowI.push([c * (p.r - th * 1.6 - 1.2), sn * (p.r - th * 1.6 - 1.2)]);
      }
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.4 * fade * alpha;
      x.fillStyle = p.glow;
      polygon(x, [...glowO, ...glowI.reverse()]);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.95 * fade * alpha;
      x.fillStyle = p.color;
      polygon(x, [...outer, ...[...inner].reverse()]);
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = fade * alpha;
      x.fillStyle = p.core;
      const coreIn = outer.map(([ox, oy], i) => [lerp(ox, inner[i][0], 0.35), lerp(oy, inner[i][1], 0.35)]);
      polygon(x, [...outer, ...coreIn.reverse()]);
    };
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.rot || 0);
    x.scale(1, p.sy || 1);
    for (let k = p.after || 0; k >= 1; k--) draw(p.age - k * 30, 0.4 / k, k * 0.1);
    draw(p.age, 1, 0);
    x.restore();
  },
  // いなずま（えだわかれ・ちらつき）
  axBolt(x, p) {
    const life = p.life;
    let a = fadeOut(p.age / life, 0.5);
    if (a <= 0) return;
    const frame = Math.floor(p.age / (p.flick || 55));
    if (hash(p.seed + frame * 3.3) < 0.2) a *= 0.45;
    const k = clamp01(p.age / Math.max(1, p.grow));
    const make = (x0, y0, x1, y1, n, amp, seed, upto = 1) => {
      const dx = x1 - x0, dy = y1 - y0;
      const L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      const pts = [[x0, y0]];
      for (let i = 1; i < n; i++) {
        const s = i / n;
        if (s > upto) break;
        const j = (hash(seed + i * 7.1) - 0.5) * 2 * amp * Math.sin(s * Math.PI);
        pts.push([x0 + dx * s + nx * j, y0 + dy * s + ny * j]);
      }
      pts.push([x0 + dx * upto, y0 + dy * upto]);
      return pts;
    };
    const seed = p.seed + frame * 17;
    const main = make(p.x0, p.y0, p.x1, p.y1, p.n || 9, p.amp || 9, seed, k);
    const branches = [];
    for (let f = 0; f < (p.forks || 0); f++) {
      const i = 1 + Math.floor(hash(seed + f * 5.7) * Math.max(1, main.length - 2));
      const [bx, by] = main[Math.min(i, main.length - 1)];
      const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0) + (hash(seed + f) < 0.5 ? -1 : 1) * (0.4 + hash(seed + f * 2) * 0.6);
      const len = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) * (0.18 + hash(seed + f * 9) * 0.22);
      branches.push(make(bx, by, bx + Math.cos(ang) * len, by + Math.sin(ang) * len, 4, (p.amp || 9) * 0.5, seed + f * 31));
    }
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineJoin = 'miter';
    for (const [col, wk, al] of [[p.glow, 3.2, 0.42], [p.color, 1, 1], ['#ffffff', 0.4, 1]]) {
      x.strokeStyle = col;
      x.globalAlpha = a * al;
      x.lineWidth = Math.max(0.4, p.w * wk);
      polyline(x, main);
      x.lineWidth = Math.max(0.3, p.w * wk * 0.55);
      for (const b of branches) polyline(x, b);
    }
    x.restore();
  },
  // ほのおの したの かたち（ゆらめく した を かさねる）。x,y … ねもと
  axFlame(x, p) {
    const env = clamp01(p.age / 120) * fadeOut(p.age / p.life, 0.65);
    if (env <= 0) return;
    const n = p.n || 5;
    const [c0, c1, c2] = p.cols;
    x.save();
    x.translate(p.x, p.y);
    for (const [col, sc, al, comp] of [[c0, 1, 0.75, 'source-over'], [c1, 0.72, 0.9, 'lighter'], [c2, 0.42, 1, 'lighter']]) {
      x.globalCompositeOperation = comp;
      x.globalAlpha = al * env;
      x.fillStyle = col;
      x.beginPath();
      for (let i = 0; i < n; i++) {
        const ox = (n > 1 ? i / (n - 1) - 0.5 : 0) * p.w;
        const hh = p.h * (0.55 + 0.45 * hash(p.seed + i)) * (0.82 + 0.18 * Math.sin(p.age / 60 + i * 1.7)) * env * sc;
        const tw = (p.w / n) * 1.7 * sc;
        const sway = Math.sin(p.age / 90 + i * 2.1 + p.seed) * tw * 0.45;
        x.moveTo(ox - tw / 2, 0);
        x.quadraticCurveTo(ox - tw * 0.65, -hh * 0.5, ox + sway, -hh);
        x.quadraticCurveTo(ox + tw * 0.65, -hh * 0.5, ox + tw / 2, 0);
        x.closePath();
      }
      x.fill();
    }
    x.restore();
  },
  // 水の 大波（すすむ むきに たてに ならんだ 水の かべ・あわ・しぶき）
  axWave(x, p) {
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
    const L = Math.hypot(dx, dy) || 1;
    const e = easeInOut(clamp01(p.age / Math.max(1, p.travel)));
    const fade = p.age < p.travel ? 1 : clamp01(1 - (p.age - p.travel) / Math.max(1, p.life - p.travel));
    if (fade <= 0) return;
    const hx = e * L;
    const body = p.h * 2.6;
    const half = p.span / 2;
    const [deep, mid, foam] = p.cols;
    x.save();
    x.translate(p.x0, p.y0);
    x.rotate(Math.atan2(dy, dx));
    const edge = (yy, k) => hx + Math.sin(yy / 7 + p.age / 80) * 2.5 * k + Math.cos(yy / 13 - p.age / 120) * 2 * k;
    const shape = (front, backLen, k) => {
      x.beginPath();
      x.moveTo(Math.max(0, front - backLen), -half);
      for (let yy = -half; yy <= half; yy += 4) x.lineTo(edge(yy, k) - (hx - front), yy);
      x.lineTo(Math.max(0, front - backLen), half);
      x.closePath();
      x.fill();
    };
    x.globalAlpha = 0.85 * fade;
    x.fillStyle = deep;
    shape(hx, body, 1);
    x.globalAlpha = 0.9 * fade;
    x.fillStyle = mid;
    shape(hx, p.h * 1.1, 1.2);
    // あわ
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = foam;
    x.globalAlpha = fade;
    for (let yy = -half; yy <= half; yy += 3) {
      const fx0 = edge(yy, 1.2);
      const r = 0.8 + hash(Math.floor(yy) + Math.floor(p.age / 70)) * 1.6;
      x.beginPath(); x.arc(fx0 - 1, yy, r, 0, TAU); x.fill();
    }
    x.restore();
  },
  // 画面いっぱいの 平行な すじ（ang … ながれる むき）
  axStreaks(x, p, t, fx) {
    const env = clamp01(p.age / 60) * fadeOut(t, 0.65);
    if (env <= 0) return;
    const W = fx?.W || 256, H = fx?.H || 144;
    const D = Math.hypot(W, H);
    x.save();
    x.translate(W / 2, H / 2);
    x.rotate(p.ang);
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.color;
    x.lineWidth = p.w || 1;
    x.globalAlpha = (p.alpha ?? 0.7) * env;
    x.beginPath();
    for (let i = 0; i < p.n; i++) {
      const lane = (hash(p.seed + i) - 0.5) * (p.spread || D);
      const len = 14 + hash(p.seed + i * 3) * 40;
      const u = ((p.age * (p.speed || 0.9) + hash(p.seed + i * 5) * D * 2) % (D * 2)) - D;
      x.moveTo(u, lane); x.lineTo(u + len, lane);
    }
    x.stroke();
    x.restore();
  },
  // 画面の 色（fin で こく なって、fout で もどる）
  axTint(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    let a = p.a;
    if (p.age < p.fin) a *= p.age / Math.max(1, p.fin);
    if (p.age > p.life - p.fout) a *= clamp01((p.life - p.age) / Math.max(1, p.fout));
    if (a <= 0) return;
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = Math.min(1, a);
    x.fillStyle = p.color;
    x.fillRect(-8, -8, W + 16, H + 16);
  },
  // カットインの 帯（よこ 長い 帯・集中線・大きく ひかる かげ・目の ひかり。文字は なし）。いちばん 上に かく（top）
  axBand(x, p, t, fx) {
    const W = fx?.W || 256;
    const inT = 0.16, outT = 0.84;
    const open = t < inT ? easeOut(t / inT) : t > outT ? 1 - easeIn((t - outT) / (1 - outT)) : 1;
    if (open <= 0.01) return;
    const hh = p.h * open;
    const y0 = p.y - hh / 2;
    const dir = p.dir || 1;
    x.save();
    // 帯の いろ
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.94;
    x.fillStyle = p.color2;
    x.fillRect(-8, y0, W + 16, hh);
    x.beginPath(); x.rect(-8, y0, W + 16, hh); x.clip();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, W * (dir > 0 ? 0.36 : 0.64), p.y, p.h * 1.3, p.color, 0.55);
    // ながれる 集中線（よこ）
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1;
    x.globalAlpha = 0.5;
    x.beginPath();
    for (let i = 0; i < 26; i++) {
      const ly = y0 + hash(p.seed + i) * hh;
      const len = 18 + hash(p.seed + i * 2) * 50;
      const sp = 0.7 + hash(p.seed + i * 4) * 0.8;
      const u = ((p.age * sp + hash(p.seed + i * 7) * (W + 80)) % (W + 80)) - 40;
      const lx = dir > 0 ? W - u : u;
      x.moveTo(lx, ly); x.lineTo(lx + len * dir, ly);
    }
    x.stroke();
    x.strokeStyle = p.color;
    x.globalAlpha = 0.6;
    x.lineWidth = 1.6;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const ly = y0 + hash(p.seed + 40 + i) * hh;
      const u = ((p.age * 1.3 + hash(p.seed + i * 9) * (W + 80)) % (W + 80)) - 40;
      const lx = dir > 0 ? W - u : u;
      x.moveTo(lx, ly); x.lineTo(lx + 40 * dir, ly);
    }
    x.stroke();
    // 大きな かげ（すこしずつ よってくる）
    const slide = (1 - easeOut(clamp01(t / 0.3))) * 60 + t * 10;
    const sx = (dir > 0 ? W * 0.3 : W * 0.7) - slide * dir;
    const big = p.h * 1.15;
    x.globalCompositeOperation = 'source-over';
    if (p.img && (p.img.width || 0) > 0) {
      const iw = p.img.width / (p.img.res || 1), ih = p.img.height / (p.img.res || 1);
      const k = (big * 1.35) / Math.max(1, ih);
      const w = iw * k, h = ih * k;
      const rim = tintCopy(p.img, p.color);
      const dark = tintCopy(p.img, p.color2 === '#000000' ? '#101018' : p.dark || '#0a0a14');
      if (rim) {
        x.globalCompositeOperation = 'lighter';
        x.globalAlpha = 0.9;
        x.drawImage(rim, sx - w / 2 - 2, p.y - h * 0.42 - 2, w + 4, h + 4);
      }
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 1;
      if (dark) x.drawImage(dark, sx - w / 2 + dir * 1.5, p.y - h * 0.42, w, h);
      else x.drawImage(p.img, sx - w / 2, p.y - h * 0.42, w, h);
    } else {
      const s = big / 22;
      const hy = p.y - big * 0.12;
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = p.color;
      x.globalAlpha = 0.95;
      x.save(); x.translate(sx, hy); x.scale(1.12, 1.12); x.translate(-sx, -hy);
      bustPath(x, sx, hy, s, dir); x.fill();
      x.restore();
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = p.dark || '#0a0a14';
      x.globalAlpha = 1;
      bustPath(x, sx + dir * 1.2, hy, s, dir); x.fill();
    }
    // 目の ひかり（キラッ）
    const ex = sx + dir * big * 0.12, ey = p.y - big * 0.18;
    const blink = clamp01((t - 0.3) / 0.12) * (t < 0.8 ? 1 : 1 - (t - 0.8) / 0.2);
    if (blink > 0) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, ex, ey, 10 * blink, p.color, 1);
      x.globalAlpha = blink;
      x.fillStyle = '#ffffff';
      x.fillRect(ex - 14 * blink, ey - 0.6, 28 * blink, 1.2);
      x.fillRect(ex - 0.6, ey - 6 * blink, 1.2, 12 * blink);
    }
    // ななめに はしる 光
    const sw = clamp01((t - 0.45) / 0.2);
    if (sw > 0 && sw < 1) {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.35 * Math.sin(sw * Math.PI);
      x.fillStyle = '#ffffff';
      const bx = lerp(-40, W + 40, dir > 0 ? sw : 1 - sw);
      x.beginPath(); x.moveTo(bx, y0); x.lineTo(bx + 16, y0); x.lineTo(bx - 4, y0 + hh); x.lineTo(bx - 20, y0 + hh); x.closePath(); x.fill();
    }
    x.restore();
    // ふちの 線
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.9;
    x.fillStyle = p.color;
    x.fillRect(-8, y0 - 1.5, W + 16, 1.5);
    x.fillRect(-8, y0 + hh, W + 16, 1.5);
    x.fillStyle = '#ffffff';
    x.fillRect(-8, y0 - 0.6, W + 16, 0.6);
    x.fillRect(-8, y0 + hh, W + 16, 0.6);
    x.restore();
  },
  // はなつ 直前の スローモーションの ひかり（いろが 反転 → 集中線が せまって 白く）。いちばん 上に かく（top）
  axFreeze(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    x.save();
    if (t < 0.32) {
      x.globalCompositeOperation = 'difference';
      x.globalAlpha = 1;
      x.fillStyle = '#ffffff';
      x.fillRect(-8, -8, W + 16, H + 16);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.25;
      x.fillStyle = p.color;
      x.fillRect(-8, -8, W + 16, H + 16);
    } else {
      const u = (t - 0.32) / 0.68;
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = '#ffffff';
      x.globalAlpha = 0.75;
      x.lineWidth = 1.2;
      x.beginPath();
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU + hash(p.seed + i) * 0.2;
        const r1 = 180, r0 = lerp(150, 14 + hash(p.seed + i * 3) * 18, easeOut(u));
        x.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0);
        x.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
      }
      x.stroke();
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.6 * easeIn(u);
      x.fillStyle = '#ffffff';
      x.fillRect(-8, -8, W + 16, H + 16);
    }
    x.restore();
  },
  // ためる ときの オーラ（style ごとに かたちが ちがう）
  axAura(x, p) {
    const age = p.age, life = p.life;
    // alpha … うすさ（第49回: 気の オーラは からだが すけて 見える ように うすく）
    const env = easeOut(clamp01(age / (life * 0.3))) * (age > life - 90 ? clamp01((life - age) / 90) : 1) * (p.alpha ?? 1);
    if (env <= 0) return;
    const grow = 0.55 + 0.45 * clamp01(age / life);
    const k = p.k || 1;
    const { x: cx, y: cy } = p;
    const R = p.r * grow, H = p.h;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, R * 1.6, p.color, 0.45 * env * Math.min(1.3, k));
    const draw = AURA[p.style] || AURA.pulse;
    draw(x, p, { cx, cy, R, H, env, k, age, life, grow });
    x.restore();
  },
  // 味方の うしろ すがた（ためる ときの からだ。ふちが ひかる）
  axFigure(x, p) {
    const env = clamp01(p.age / 140) * clamp01((p.life - p.age) / 140);
    if (env <= 0) return;
    const s = p.s || 1.6;
    const shake = (hash(Math.floor(p.age / 40) + p.seed) - 0.5) * (p.k || 1) * 0.8;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.7 * env;
    x.fillStyle = p.color;
    const hx = p.x + shake, hy = p.y - 4 * s * 1.7;
    x.save(); x.translate(hx, hy + 4 * s * 2); x.scale(1.1, 1.08); x.translate(-hx, -(hy + 4 * s * 2));
    bustPath(x, hx, hy, s, 1); x.fill();
    x.restore();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.88 * env;
    x.fillStyle = p.dark || '#141420';
    bustPath(x, hx, hy, s, 1); x.fill();
    x.restore();
  },
  // まほうじん（じめんに ひらたく。variant: 'magic' 五芒星 / 'alchemy' 円と 三角と 四角 / 'rune' 文字の わ だけ）
  axGlyph(x, p) {
    const env = easeOut(clamp01(p.age / (p.life * 0.25))) * clamp01((p.life - p.age) / 120);
    if (env <= 0) return;
    drawGlyph(x, p.x, p.y, p.r * (0.6 + 0.4 * env), p.sy || 0.36, p.age, p.color, p.color2 || p.color, p.variant || 'magic', env);
  },
  // 小さな かたちの つぶ（雪・ほし・カード・ハート…）。うごきは Effects.update（vx・vy・g・drag）
  axShape(x, p, t) {
    const a = fadeOut(t, 0.6) * (p.alpha ?? 1);
    if (a <= 0) return;
    x.save();
    x.translate(p.x, p.y);
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000);
    x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    x.globalAlpha = a;
    const s = p.size * (p.pop ? 0.4 + 0.6 * easeOut(clamp01(t * 4)) : 1);
    if (p.shape === 'flake') {
      x.strokeStyle = p.color;
      x.lineWidth = Math.max(0.4, s * 0.18);
      flake(x, s);
    } else {
      x.fillStyle = p.color;
      shapePath(x, p.shape, s);
      x.fill();
      if (p.color2) {
        x.fillStyle = p.color2;
        shapePath(x, p.shape === 'card' ? 'diamond' : p.shape, s * 0.45);
        x.fill();
      }
    }
    x.restore();
  },
  // ダッシュの ざんぞう（光の からだ＋うしろに のこる かげ＋すじ）
  axDash(x, p) {
    const e = easeIn(clamp01(p.age / Math.max(1, p.travel))) * 0.6 + clamp01(p.age / Math.max(1, p.travel)) * 0.4;
    const fade = p.age < p.travel ? 1 : clamp01(1 - (p.age - p.travel) / Math.max(1, p.life - p.travel));
    if (fade <= 0) return;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const at = (k) => [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k)];
    x.save();
    x.globalCompositeOperation = 'lighter';
    // うしろの すじ
    const [hx, hy] = at(e);
    x.strokeStyle = p.color;
    x.lineCap = 'round';
    x.globalAlpha = 0.5 * fade;
    x.lineWidth = p.w * 0.9;
    x.beginPath(); x.moveTo(...at(Math.max(0, e - 0.35))); x.lineTo(hx, hy); x.stroke();
    x.globalAlpha = 0.8 * fade;
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(0.5, p.w * 0.3);
    x.beginPath(); x.moveTo(...at(Math.max(0, e - 0.2))); x.lineTo(hx, hy); x.stroke();
    // ざんぞう（まえの いち）
    const n = p.n || 4;
    for (let i = n; i >= 0; i--) {
      const ke = Math.max(0, e - i * 0.07);
      const [gx, gy] = at(ke);
      const al = (i ? 0.45 / (i + 0.5) : 1) * fade;
      if (p.img) {
        const im = tintCopy(p.img, i ? p.color : '#ffffff');
        if (im) {
          const iw = p.img.width / (p.img.res || 1), ih = p.img.height / (p.img.res || 1);
          const k2 = (p.h || 24) / Math.max(1, ih);
          x.globalAlpha = al;
          x.drawImage(im, gx - iw * k2 / 2, gy - ih * k2 / 2, iw * k2, ih * k2);
          continue;
        }
      }
      x.save();
      x.translate(gx, gy);
      x.rotate(ang);
      softGlow(x, 0, 0, p.w * 1.8, p.color, al * 0.8);
      x.globalAlpha = al;
      x.fillStyle = i ? p.color : '#ffffff';
      x.beginPath(); x.ellipse(0, 0, p.w * 1.1, p.w * 0.55, 0, 0, TAU); x.fill();
      x.restore();
    }
    x.restore();
  },
};

// まほうじんを かく（ほかの ファイルからも つかえる）
export function drawGlyph(x, cx, cy, r, sy, age, color, color2, variant, alpha = 1) {
  const rot = age / 900;
  x.save();
  x.translate(cx, cy);
  x.scale(1, sy);
  x.globalCompositeOperation = 'lighter';
  softGlow(x, 0, 0, r * 1.3, color, 0.35 * alpha);
  x.strokeStyle = color;
  x.globalAlpha = 0.9 * alpha;
  x.lineWidth = 1.2;
  x.beginPath(); x.arc(0, 0, r, 0, TAU); x.stroke();
  x.lineWidth = 0.8;
  x.beginPath(); x.arc(0, 0, r * 0.82, 0, TAU); x.stroke();
  // 文字の わ（小さな しかく が まわる）
  x.fillStyle = color2;
  for (let i = 0; i < 16; i++) {
    const a = rot + (i / 16) * TAU;
    const rr = r * 0.91;
    x.save();
    x.translate(Math.cos(a) * rr, Math.sin(a) * rr);
    x.rotate(a);
    x.fillRect(-1, -0.6, i % 3 ? 2 : 1.2, 1.2);
    x.restore();
  }
  x.globalAlpha = 0.85 * alpha;
  x.strokeStyle = color2;
  x.lineWidth = 1;
  const star = (n, step, rr, ph) => {
    x.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = ph + ((i * step) % n) / n * TAU;
      i ? x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : x.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    x.stroke();
  };
  if (variant === 'alchemy') {
    star(3, 1, r * 0.8, -rot * 0.6 - Math.PI / 2);
    star(4, 1, r * 0.56, rot * 0.8);
    x.beginPath(); x.arc(0, 0, r * 0.3, 0, TAU); x.stroke();
  } else if (variant === 'magic') {
    star(5, 2, r * 0.8, -rot - Math.PI / 2);
    x.beginPath(); x.arc(0, 0, r * 0.36, 0, TAU); x.stroke();
  } else {
    star(6, 1, r * 0.7, rot);
  }
  x.restore();
}

// ためる オーラの かたち（axAura の style）
const AURA = {
  // 気: もえあがる オーラ（上が とがって ゆらめく）＋ のぼる 光の すじ
  flame(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    const shape = (sc) => {
      x.beginPath();
      const N = 28;
      for (let i = 0; i <= N; i++) {
        const th = (i / N) * TAU;
        const up = Math.max(0, -Math.sin(th));
        const spike = up > 0.25 ? (0.25 + 0.75 * hash(Math.floor(age / 70) * 13 + i + p.seed)) * up * 0.9 * k : 0;
        const rx = R * 0.8 * sc * (1 + 0.06 * Math.sin(age / 50 + i));
        const ry = H * 0.55 * sc;
        const px = cx + Math.cos(th) * rx * (1 - up * 0.35);
        const py = cy + 0.15 * H + Math.sin(th) * ry * (1 + up * (0.6 + spike));
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.closePath();
      x.fill();
    };
    x.fillStyle = p.color;
    x.globalAlpha = 0.3 * env;
    shape(1.15);
    x.globalAlpha = 0.42 * env;
    shape(0.85);
    x.fillStyle = p.color2;
    x.globalAlpha = 0.5 * env;
    shape(0.55);
    // のぼる すじ
    x.strokeStyle = p.color2;
    x.lineWidth = 0.8;
    x.globalAlpha = 0.7 * env;
    x.beginPath();
    const n = Math.round(6 + 4 * k);
    for (let i = 0; i < n; i++) {
      const u = ((age / 420 + hash(p.seed + i)) % 1);
      const lx = cx + (hash(p.seed + i * 3) - 0.5) * R * 1.1;
      const ly = cy + H * 0.5 - u * H * 1.5;
      x.moveTo(lx, ly); x.lineTo(lx, ly - 5 - 4 * k);
    }
    x.stroke();
  },
  // チャクラ: からだの まわりを まわる うず
  swirl(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    for (const [col, wk, ph] of [[p.color, 1.6, 0], [p.color2, 0.8, 0.5]]) {
      x.strokeStyle = col;
      for (let arm = 0; arm < 3; arm++) {
        x.globalAlpha = 0.8 * env;
        x.lineWidth = wk;
        x.beginPath();
        for (let s = 0; s <= 1.0001; s += 0.05) {
          const a = s * Math.PI * 2.4 + age / 160 + (arm / 3) * TAU + ph;
          const rr = R * (0.25 + 0.85 * s);
          const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.45 - (s - 0.5) * H * 0.5 * k;
          s ? x.lineTo(px, py) : x.moveTo(px, py);
        }
        x.stroke();
      }
    }
  },
  // 呼吸: ひろがって また すいこまれる わ
  rings(x, p, o) {
    const { cx, cy, R, env, k, age } = o;
    x.strokeStyle = p.color;
    const n = 3 + Math.round(k);
    for (let i = 0; i < n; i++) {
      const u = (age / 650 + i / n) % 1;
      const inhale = Math.floor(age / 650 + i / n) % 2 === 1;
      const rr = R * (inhale ? 1.5 - u * 1.2 : 0.3 + u * 1.2);
      x.globalAlpha = 0.75 * env * Math.sin(u * Math.PI);
      x.lineWidth = 1.2;
      x.beginPath(); x.ellipse(cx, cy, rr, rr * 0.82, 0, 0, TAU); x.stroke();
    }
    x.strokeStyle = p.color2;
    x.globalAlpha = 0.5 * env;
    x.lineWidth = 0.8;
    x.beginPath(); x.ellipse(cx, cy + o.H * 0.45, R * 1.1, R * 0.3, 0, 0, TAU); x.stroke();
  },
  // 剣: 刀身を はしる ひかり（キラッ）
  glint(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    const bx0 = cx + R * 0.45, by0 = cy + H * 0.25;
    const bx1 = cx + R * 0.45 + H * 0.35, by1 = cy - H * 0.95;
    x.strokeStyle = p.color2;
    x.lineWidth = 1.6;
    x.globalAlpha = 0.65 * env;
    x.beginPath(); x.moveTo(bx0, by0); x.lineTo(bx1, by1); x.stroke();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 0.6;
    x.globalAlpha = 0.9 * env;
    x.beginPath(); x.moveTo(bx0, by0); x.lineTo(bx1, by1); x.stroke();
    const u = (age / 520) % 1;
    const gx = lerp(bx0, bx1, u), gy = lerp(by0, by1, u);
    softGlow(x, gx, gy, 6 + 2 * k, p.color, env);
    // さきっぽの ほし
    const tw = 0.5 + 0.5 * Math.sin(age / 70);
    x.globalAlpha = env;
    x.fillStyle = '#ffffff';
    const s = (5 + 3 * k) * (0.6 + 0.4 * tw);
    x.fillRect(bx1 - s, by1 - 0.5, s * 2, 1);
    x.fillRect(bx1 - 0.5, by1 - s, 1, s * 2);
    softGlow(x, bx1, by1, s * 1.2, p.color, env * tw);
  },
  // 竜の紋章: ひたいの 上に ひかる 紋章と まわる ひかりの すじ
  crest(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    const ey = cy - H * 0.62, s = 4 + 2 * k;
    const pulse = 0.7 + 0.3 * Math.sin(age / 90);
    // ひかりの すじ
    x.strokeStyle = p.color;
    x.lineWidth = 1;
    x.globalAlpha = 0.45 * env * pulse;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = age / 700 + (i / 8) * TAU;
      x.moveTo(cx + Math.cos(a) * s * 1.2, ey + Math.sin(a) * s * 1.2);
      x.lineTo(cx + Math.cos(a) * s * 4.5, ey + Math.sin(a) * s * 4.5);
    }
    x.stroke();
    softGlow(x, cx, ey, s * 3, p.color, env * pulse);
    // 紋章（まん中の ひし形・左右の つばさ・したの とげ）
    x.globalAlpha = env;
    x.fillStyle = p.color2;
    x.beginPath();
    x.moveTo(cx, ey - s * 1.3); x.lineTo(cx + s * 0.5, ey); x.lineTo(cx, ey + s * 1.6); x.lineTo(cx - s * 0.5, ey); x.closePath();
    for (const sd of [-1, 1]) {
      x.moveTo(cx + sd * s * 0.6, ey - s * 0.2);
      x.quadraticCurveTo(cx + sd * s * 1.6, ey - s * 1.2, cx + sd * s * 2.1, ey - s * 0.4);
      x.quadraticCurveTo(cx + sd * s * 1.4, ey - s * 0.3, cx + sd * s * 0.6, ey + s * 0.4);
      x.closePath();
    }
    x.fill();
    x.fillStyle = '#ffffff';
    x.fillRect(cx - 0.5, ey - s * 0.6, 1, s * 1.2);
  },
  // 聖なる 光: からだを まわる リボンと きらきら
  ribbons(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    for (let r = 0; r < 2 + (k > 1.2 ? 1 : 0); r++) {
      const col = r % 2 ? p.color2 : p.color;
      x.strokeStyle = col;
      for (let i = 0; i < 24; i++) {
        const s0 = i / 24, s1 = (i + 1) / 24;
        const pt = (s) => {
          const a = s * TAU * 1.5 + age / 260 + r * 2.1;
          return [cx + Math.cos(a) * R * 0.9, cy + H * 0.4 - s * H * 1.1 + Math.sin(a) * R * 0.25, Math.sin(a)];
        };
        const [ax, ay, d] = pt(s0), [bx, by] = pt(s1);
        x.globalAlpha = env * (d > 0 ? 0.85 : 0.3) * Math.sin(s0 * Math.PI);
        x.lineWidth = d > 0 ? 1.8 : 1;
        x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
      }
    }
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) {
      const tw = Math.max(0, Math.sin(age / 90 + i * 1.9));
      const sx = cx + (hash(p.seed + i) - 0.5) * R * 2, sy = cy + (hash(p.seed + i * 2) - 0.6) * H * 1.2;
      x.globalAlpha = env * tw;
      const s = 3 * tw;
      x.fillRect(sx - s, sy - 0.4, s * 2, 0.8);
      x.fillRect(sx - 0.4, sy - s, 0.8, s * 2);
    }
  },
  // 魔法・錬金術: あしもとの まほうじん
  glyph(x, p, o) {
    const { cx, cy, R, H, env, age } = o;
    drawGlyph(x, cx, cy + H * 0.5, R * 1.35, 0.34, age, p.color, p.color2, p.variant || 'magic', env);
    // まほうじんから のぼる ひかり
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = p.color;
    for (let i = 0; i < 5; i++) {
      const u = (age / 600 + hash(p.seed + i)) % 1;
      const lx = cx + (hash(p.seed + i * 4) - 0.5) * R * 2;
      x.globalAlpha = env * 0.6 * Math.sin(u * Math.PI);
      x.fillRect(lx - 0.5, cy + H * 0.5 - u * H * 1.2, 1, 6);
    }
  },
  // アイドル: 上から スポットライト
  spot(x, p, o) {
    const { cx, cy, H, env, age } = o;
    const cols = [p.color, p.color2, '#ffe066'];
    for (let i = 0; i < 3; i++) {
      // 第49回: スポットライトは その 人の 上 だけ（画面の 上から では ない）
      const top = cx + (i - 1) * 22 + Math.sin(age / 400 + i * 2) * 8;
      const ty = Math.max(-8, cy - H * 1.6);
      const bx = cx + (i - 1) * 6 + Math.sin(age / 300 + i) * 4;
      x.globalAlpha = 0.22 * env;
      x.fillStyle = cols[i];
      x.beginPath();
      x.moveTo(top - 3, ty); x.lineTo(top + 3, ty); x.lineTo(bx + 18, cy + H * 0.55); x.lineTo(bx - 18, cy + H * 0.55); x.closePath();
      x.fill();
    }
    x.strokeStyle = p.color;
    x.globalAlpha = 0.6 * env;
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(cx, cy + H * 0.55, 24, 6, 0, 0, TAU); x.stroke();
  },
  // 手品・わざ: まわる カード
  cards(x, p, o) {
    const { cx, cy, R, env, k, age } = o;
    const n = 5 + Math.round(k * 2);
    for (let i = 0; i < n; i++) {
      const a = age / 300 + (i / n) * TAU;
      const px = cx + Math.cos(a) * R * 1.1, py = cy + Math.sin(a) * R * 0.35;
      const depth = 0.75 + 0.25 * Math.sin(a);
      x.save();
      x.translate(px, py);
      x.rotate(a * 0.5);
      x.scale(Math.abs(Math.cos(age / 200 + i)) * 0.8 + 0.2, 1);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = env * depth;
      x.fillStyle = '#ffffff';
      x.fillRect(-2.6 * depth, -3.6 * depth, 5.2 * depth, 7.2 * depth);
      x.fillStyle = i % 2 ? p.color : p.color2;
      x.beginPath(); shapePath(x, i % 2 ? 'heart' : 'diamond', 1.6 * depth); x.fill();
      x.restore();
    }
  },
  // 氷: まわる 雪の けっしょうと つめたい わ
  snow(x, p, o) {
    const { cx, cy, R, H, env, k, age } = o;
    x.strokeStyle = p.color2;
    const n = 5 + Math.round(k * 2);
    for (let i = 0; i < n; i++) {
      const a = age / 500 + (i / n) * TAU;
      const px = cx + Math.cos(a) * R * 1.05, py = cy + Math.sin(a) * R * 0.4 - Math.sin(age / 300 + i) * H * 0.15;
      x.save();
      x.translate(px, py);
      x.rotate(age / 400 + i);
      x.globalAlpha = env * (0.6 + 0.4 * Math.sin(a));
      x.lineWidth = 0.8;
      flake(x, 2.6 + k);
      x.restore();
    }
    x.strokeStyle = p.color;
    x.globalAlpha = 0.6 * env;
    x.lineWidth = 1;
    x.beginPath(); x.ellipse(cx, cy + H * 0.5, R * 1.2, R * 0.3, 0, 0, TAU); x.stroke();
  },
  // 星: うしろで まわる 大きな ほしの きらめき
  star(x, p, o) {
    const { cx, cy, R, env, k, age } = o;
    const s = R * (1.1 + 0.15 * Math.sin(age / 120)) * (0.8 + 0.2 * k);
    x.save();
    x.translate(cx, cy);
    x.rotate(age / 900);
    x.globalAlpha = 0.55 * env;
    x.fillStyle = p.color;
    shapePath(x, 'star', s); x.fill();
    x.globalAlpha = 0.8 * env;
    x.fillStyle = p.color2;
    shapePath(x, 'star', s * 0.5); x.fill();
    x.restore();
    x.globalAlpha = 0.8 * env;
    x.fillStyle = '#ffffff';
    const f = s * 1.6;
    x.fillRect(cx - f, cy - 0.5, f * 2, 1);
    x.fillRect(cx - 0.5, cy - f, 1, f * 2);
  },
  // ゴム: ぶよぶよ ゆれる わ（湯気は つぶで）
  gomu(x, p, o) {
    const { cx, cy, R, env, age } = o;
    for (const [col, sc] of [[p.color, 1.2], [p.color2, 0.85]]) {
      x.strokeStyle = col;
      x.globalAlpha = 0.7 * env;
      x.lineWidth = 1.4;
      x.beginPath();
      for (let i = 0; i <= 32; i++) {
        const th = (i / 32) * TAU;
        const rr = R * sc * (1 + 0.14 * Math.sin(th * 5 + age / 55) + 0.08 * Math.sin(age / 90));
        const px = cx + Math.cos(th) * rr, py = cy + Math.sin(th) * rr * 0.9;
        i ? x.lineTo(px, py) : x.moveTo(px, py);
      }
      x.stroke();
    }
  },
  // ふつう: ひかりが どくどく
  pulse(x, p, o) {
    const { cx, cy, R, env, age } = o;
    const u = (age / 380) % 1;
    x.strokeStyle = p.color2;
    x.globalAlpha = env * (1 - u) * 0.8;
    x.lineWidth = 1.2;
    x.beginPath(); x.arc(cx, cy, R * (0.5 + u * 0.9), 0, TAU); x.stroke();
    softGlow(x, cx, cy, R * (0.8 + 0.2 * Math.sin(age / 80)), p.color2, env * 0.6);
  },
};
export const AURA_STYLES = Object.keys(AURA);

// ───────────── どうぐ（fx を さいしょに わたす。へんじは あたる 時間 ms） ─────────────
// ふとい ビーム。widths … 時間で かわる はばの わりあい（例 [0.3, 1, 1, 0.6, 0]）。burst … 先っぽで はじける。alpha … こさ
export function beam(fx, x0, y0, x1, y1, o = {}) {
  const { w = 8, color = '#7ad8ff', glow = '#bfeaff', core = '#ffffff', delay = 0, life = 620, grow = 120, rise = 80, fall = 200, widths = null, flicker = 0.12, streaks = true, burst = true, alpha = 1 } = o;
  fx.add({ kind: 'axBeam', x: x1, y: y1, x0, y0, x1, y1, w, color, glow, core, delay, life, grow, rise, fall, widths, flicker, streaks, alpha, seed: Math.random() * 100 });
  const hit = delay + grow;
  if (burst) {
    fx.glow(x1, y1, { color: glow, r: w * 3, delay: hit, life: Math.max(160, life - grow), alpha: 0.9 });
    fx.shock(x1, y1, { r0: w * 0.5, r1: w * 4.5, color: core, w: 1.8, delay: hit, life: 360 });
    fx.sparks(x1, y1, { colors: [core, color, glow], n: 14, speed: 160, delay: hit, life: 420, len: 7 });
    // ビームが あたって いる あいだ ずっと 火花
    for (let t = hit + 90; t < delay + life - fall; t += 110) fx.sparks(x1, y1, { colors: [core, glow], n: 5, speed: 120, delay: t, life: 300, len: 6 });
  }
  return hit;
}
// 空や 上から おちる 光の はしら（x, y … あたる ところ）
export function pillar(fx, x, y, o = {}) {
  const { w = 10, color = '#fff6b0', glow = '#ffffff', core = '#ffffff', delay = 0, life = 520, from = -12 } = o;
  return beam(fx, x, from, x, y, { w, color, glow, core, delay, life, grow: 70, rise: 50, fall: 220, streaks: false, burst: o.burst ?? true, alpha: o.alpha ?? 1, widths: o.widths || null });
}
// まわる たま。to が あれば start（ふくらむ 時間）の あと travel で とぶ。へんじ: あたる（つく）時間
export function orb(fx, x, y, o = {}) {
  const { r = 8, color = '#4ab8ff', glow = '#a8e4ff', rim = '#ffffff', core = '#ffffff', arms = 4, spin = 1, delay = 0, grow = 240, to = null, start = grow, travel = 260, hop = 0, hold = 120, dark = false } = o;
  const life = o.life ?? (to ? start + travel + 60 : grow + hold + 200);
  const p = { kind: 'axOrb', x, y, x0: x, y0: y, r, color, glow, rim, core, arms, spin, delay, grow, life, dark, hop };
  if (to) Object.assign(p, { x1: to.x, y1: to.y, start, travel });
  fx.add(p);
  return delay + (to ? start + travel : grow);
}
// 三日月の 斬げき（cx, cy … 円の まん中。r … 半径、a0 → a1 … ふる むき）
export function crescent(fx, cx, cy, o = {}) {
  const { r = 26, a0 = -2.4, a1 = 0.6, w = 7, color = '#e8f4ff', glow = '#7ad8ff', core = '#ffffff', delay = 0, swing = 140, life = 380, after = 2, sy = 1, rot = 0 } = o;
  fx.add({ kind: 'axCrescent', x: cx, y: cy, r, a0, a1, w, color, glow, core, delay, swing, life, after, sy, rot });
  return delay + swing * 0.6;
}
// 的（x, y）を 三日月で 切る（ang … 切る すじの かたむき、flip … ぎゃくむき）
export function slash(fx, x, y, o = {}) {
  const { r = 30, ang = -0.6, flip = false } = o;
  const span = o.span ?? 2.2;
  // 円の まん中を 的から はなして、弧が 的を とおる ように
  const c = { x: x - Math.cos(ang + Math.PI / 2) * r * 0.8, y: y - Math.sin(ang + Math.PI / 2) * r * 0.8 };
  const mid = Math.atan2(y - c.y, x - c.x);
  const a0 = flip ? mid + span / 2 : mid - span / 2, a1 = flip ? mid - span / 2 : mid + span / 2;
  const hit = crescent(fx, c.x, c.y, { ...o, r, a0, a1 });
  if (o.spark !== false) fx.sparks(x, y, { colors: [o.core || '#ffffff', o.glow || '#7ad8ff'], n: 8, speed: 130, delay: hit, life: 300, len: 7 });
  return hit;
}
// なんども 切る（n 回。gap … あいだ）
export function multiSlash(fx, x, y, o = {}) {
  const { n = 3, gap = 70, delay = 0, r = 26, spread = 6 } = o;
  let hit = delay;
  for (let i = 0; i < n; i++) {
    const ang = (i % 2 ? 0.7 : -0.7) + rnd(-0.35, 0.35);
    hit = slash(fx, x + rnd(-spread, spread), y + rnd(-spread, spread), { ...o, r: r * rnd(0.85, 1.15), ang, flip: i % 2 === 1, delay: delay + i * gap });
  }
  return hit;
}
// ひろがる しょうげきの わ（n … かず、gap … あいだ）
export function shockwave(fx, x, y, o = {}) {
  const { r0 = 4, r1 = 46, color = '#ffffff', w = 2, sy = 1, delay = 0, life = 380, n = 1, gap = 80 } = o;
  for (let i = 0; i < n; i++) fx.shock(x, y, { r0, r1: r1 * (1 - i * 0.12), color, w: w * (1 - i * 0.2), sy, delay: delay + i * gap, life });
  return delay;
}
// あたった しゅんかんの ひかり（しろい まる＋ほし＋わ＋火花）
export function impact(fx, x, y, o = {}) {
  const { r = 16, color = '#ffffff', glow = '#ffd66b', colors = null, delay = 0, heavy = false } = o;
  fx.glow(x, y, { color: glow, r: r * 2.2, delay, life: 320, alpha: 0.9 });
  fx.impact(x, y, { r, color, delay });
  fx.star(x, y, glow, r * 0.9, delay + 20, 240);
  fx.shock(x, y, { r0: r * 0.3, r1: r * 2.6, color: glow, w: heavy ? 2.6 : 1.8, delay: delay + 10, life: 320 });
  fx.sparks(x, y, { colors: colors || [color, glow], n: heavy ? 18 : 11, speed: heavy ? 170 : 130, delay, life: 380, len: 7 });
  if (heavy) fx.hitStop(160, delay, 1.8);
  return delay;
}
// 大きな 爆発（ひかり＋わ＋火花＋けむり＋はへん）
export function explosion(fx, x, y, o = {}) {
  const P = o.pal || pal(o.element || 'blast');
  const { r = 22, delay = 0, heavy = true, smoke = '#4a4040' } = o;
  fx.glow(x, y, { color: P.glow, r: r * 2.4, delay, life: 520, alpha: 1 });
  fx.impact(x, y, { r: r * 1.1, color: P.core, delay });
  shockwave(fx, x, y, { r0: r * 0.3, r1: r * 3, color: P.glow, w: 2.6, delay, n: 2, gap: 90, life: 420 });
  fx.sparks(x, y, { colors: P.list, n: 24, speed: 200, delay, life: 520, len: 8, size: 1.2 });
  for (let i = 0; i < 6; i++) fx.puff(x + rnd(-r, r) * 0.6, y + rnd(-r, r) * 0.4, { color: smoke, r0: 3, r1: r * 0.8, vx: rnd(-30, 30), vy: rnd(-40, -10), life: 700, alpha: 0.5, delay: delay + 80 });
  if (heavy) { fx.flashAt(90, P.core, delay); fx.hitStop(220, delay, 2); }
  return delay;
}
// はへん（いし・つち。じゅうりょくで おちる）
export function debris(fx, x, y, o = {}) {
  const { n = 10, colors = ['#a08060', '#6a5040', '#d8c0a0'], up = 110, g = 300, spread = 1.1, delay = 0, size = 1.6, shape = 'rock' } = o;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + rnd(-spread, spread);
    const sp = up * rnd(0.5, 1.3);
    fx.add({ kind: 'axShape', shape, x: x + rnd(-8, 8), y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g, color: colors[i % colors.length], size: size * rnd(0.6, 1.4), rot0: rnd(0, 6), spin: rnd(-8, 8), delay, life: rnd(500, 800) });
  }
  return delay;
}
// 火花・ひかりの つぶ（fx.sparks と おなじ。ang … むき、spread … ひろがり）
export function particles(fx, x, y, o = {}) {
  fx.sparks(x, y, { colors: o.colors || ['#ffffff'], n: o.n ?? 12, speed: o.speed ?? 100, ang: o.ang ?? null, spread: o.spread ?? Math.PI, life: o.life ?? 420, delay: o.delay || 0, g: o.g ?? 60, size: o.size ?? 0.9, drag: o.drag ?? 0.92, len: o.len ?? 6 });
  return o.delay || 0;
}
// かたちの つぶ（shape: flake・star・twinkle・card・heart・diamond・petal・rock・note・まる）
export function shapes(fx, x, y, o = {}) {
  const { shape = 'star', n = 8, colors = ['#ffffff'], color2 = null, speed = 60, ang = null, spread = Math.PI, g = 0, drag = 0.97, spin = 4, size = 2.4, delay = 0, life = 700, add = true, pop = true, r = 0 } = o;
  for (let i = 0; i < n; i++) {
    const a = ang === null ? rnd(0, Math.PI * 2) : ang + rnd(-spread, spread);
    const s = speed * rnd(0.5, 1.2);
    const ox = r ? Math.cos(a) * r : 0, oy = r ? Math.sin(a) * r : 0;
    fx.add({ kind: 'axShape', shape, x: x + ox, y: y + oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g, drag, color: colors[i % colors.length], color2, size: size * rnd(0.7, 1.2), rot0: rnd(0, 6), spin: rnd(-spin, spin), delay: delay + rnd(0, 60), life: life * rnd(0.75, 1.15), add, pop });
  }
  return delay;
}
// きらきら（4本の ひかり）
export function sparkles(fx, x, y, o = {}) {
  const { n = 8, colors = ['#ffffff', '#fff6b0'], r = 18, size = 5, delay = 0, life = 380, gap = 40 } = o;
  for (let i = 0; i < n; i++) fx.twinkle(x + rnd(-r, r), y + rnd(-r, r) * 0.8, { color: colors[i % colors.length], size: size * rnd(0.6, 1.2), delay: delay + i * gap * rnd(0.5, 1), life });
  return delay;
}
// はなびら（まう）
export function petals(fx, x, y, o = {}) {
  const { n = 12, colors = ['#f7a1c4', '#ffd0e4', '#ffffff'], spread = 40, delay = 0, life = 900, rise = 50 } = o;
  for (let i = 0; i < n; i++) fx.petal(x + rnd(-spread, spread), y + rnd(-spread, spread) * 0.4, { color: colors[i % colors.length], vx: rnd(-40, 40), vy: rnd(-rise, -rise * 0.2), size: rnd(1.4, 2.4), delay: delay + rnd(0, 120), life });
  return delay;
}
// あつまる ひかり（waves かい くりかえす）
export function gather(fx, x, y, o = {}) {
  const { colors = ['#ffffff'], n = 12, r = 40, life = 320, delay = 0, waves = 1, gap = 140, size = 0.9 } = o;
  for (let i = 0; i < waves; i++) fx.converge(x, y, { colors, n, r, life, delay: delay + i * gap, size });
  return delay + (waves - 1) * gap + life;
}
// いなずま（えだわかれ。grow … とどく 時間）
export function bolt(fx, x0, y0, x1, y1, o = {}) {
  const { w = 2, color = '#fff6b0', glow = '#ffd83a', amp = 9, n = 9, forks = 2, delay = 0, life = 340, grow = 60, flick = 55 } = o;
  fx.add({ kind: 'axBolt', x: x1, y: y1, x0, y0, x1, y1, w, color, glow, amp, n, forks, delay, life, grow, flick, seed: Math.random() * 1000 });
  return delay + grow;
}
// 空から おちる いなずま（n 本）
export function boltRain(fx, x, y, o = {}) {
  const { n = 3, spread = 18, gap = 80, delay = 0 } = o;
  let hit = delay;
  for (let i = 0; i < n; i++) hit = Math.max(hit, bolt(fx, x + rnd(-spread, spread), -10, x + rnd(-4, 4), y, { ...o, delay: delay + i * gap, w: (o.w || 2.4) * (i ? 0.75 : 1) }));
  return delay + 60;
}
// もえる ほのお（x, y … ねもと）＋ 火の粉
export function flames(fx, x, y, o = {}) {
  const P = pal('fire');
  const { w = 24, h = 26, cols = [P.list[0], P.list[1], P.list[2]], n = 5, delay = 0, life = 700, embers = true } = o;
  fx.add({ kind: 'axFlame', x, y, w, h, cols, n, delay, life, seed: Math.random() * 100 });
  if (embers) fx.sparks(x, y - h * 0.3, { colors: cols, n: 10, speed: 70, ang: -Math.PI / 2, spread: 0.7, g: -90, drag: 0.96, delay: delay + 60, life: 620, size: 1.1 });
  return delay;
}
// 水の 大波（x0,y0 から x1,y1 へ。span … はば、h … 高さ）。へんじ: とどく 時間
export function wave(fx, x0, y0, x1, y1, o = {}) {
  const P = pal('water');
  const { span = 70, h = 14, cols = [P.main, P.glow, P.core], travel = 360, delay = 0, life = travel + 260, splash: sp = true } = o;
  fx.add({ kind: 'axWave', x: x1, y: y1, x0, y0, x1, y1, span, h, cols, travel, delay, life });
  const hit = delay + travel;
  if (sp) splash(fx, x1, y1, { cols, delay: hit });
  return hit;
}
// 水しぶき・あわ
export function splash(fx, x, y, o = {}) {
  const P = pal('water');
  const { cols = P.list, n = 16, power = 1, delay = 0 } = o;
  for (let i = 0; i < n; i++) fx.drop(x + rnd(-10, 10), y + rnd(-4, 4), { color: cols[i % cols.length], vx: rnd(-120, 120) * power, vy: rnd(-200, -60) * power, g: 380, size: rnd(1.1, 2.2), delay: delay + (i % 3) * 30, life: 600 });
  for (let i = 0; i < 4; i++) fx.bubble(x + rnd(-12, 12), y + rnd(-4, 8), { color: '#e6fbff', size: rnd(1.2, 2.2), vy: rnd(-40, -20), delay: delay + 60 + i * 50, life: 640 });
  fx.shock(x, y + 6, { r0: 4, r1: 36 * power, sy: 0.35, color: '#bfe6ff', w: 1.8, delay, life: 380 });
  return delay;
}
// 集中線（x, y に むかって）
export function speedLines(fx, x, y, o = {}) {
  fx.speedLines(x, y, { color: o.color || '#ffffff', n: o.n ?? 20, delay: o.delay || 0, life: o.life ?? 300, r0: o.r0 ?? 18, r1: o.r1 ?? 140 });
  return o.delay || 0;
}
// 画面いっぱいの 平行な すじ（ang … ながれる むき。ラジアン）
export function streaks(fx, o = {}) {
  const { ang = 0, color = '#ffffff', n = 24, delay = 0, life = 420, speed = 0.9, w = 1, alpha = 0.7 } = o;
  fx.add({ kind: 'axStreaks', x: 0, y: 0, ang, color, n, delay, life, speed, w, alpha, seed: Math.random() * 100 });
  return delay;
}
// 画面の 色（color … いろ、a … こさ）
export function tint(fx, color = '#000000', o = {}) {
  const { a = 0.4, delay = 0, life = 600, fin = 120, fout = 160, top = false } = o;
  fx.add({ kind: 'axTint', x: 0, y: 0, color, a, delay, life, fin, fout, top });
  return delay;
}
// 画面を くらく
export function dim(fx, o = {}) { return tint(fx, o.color || '#05030c', { a: 0.5, ...o }); }
// 画面が ひかる
export function flash(fx, color = '#ffffff', ms = 120, delay = 0) { fx.flashAt(ms, color, delay); return delay; }
// 画面が ゆれる（amp … 1 が ふつう）
export function shake(fx, ms = 200, amp = 1, delay = 0) { fx.hitStop(ms, delay, amp); return delay; }
// ダッシュ（ざんぞう）。へんじ: つく 時間
export function dash(fx, x0, y0, x1, y1, o = {}) {
  const { color = '#9ad8ff', travel = 160, w = 5, h = 24, n = 4, delay = 0, life = travel + 200, img = null } = o;
  fx.add({ kind: 'axDash', x: x1, y: y1, x0, y0, x1, y1, color, travel, w, h, n, delay, life, img });
  return delay + travel;
}
// カットインの 帯（文字なし。color … ひかりの 色、color2 … 帯の 色、img … かげに する え）
export function cutIn(fx, o = {}) {
  const { color = '#7ad8ff', color2 = '#0a1430', dark = '#0a0a14', img = null, delay = 0, life = 640, y = 58, h = 46, dir = 1 } = o;
  fx.add({ kind: 'axBand', x: 0, y, h, color, color2, dark, img, delay, life, dir, top: true, seed: Math.random() * 100 });
  return delay;
}
// まほうじん
export function glyph(fx, x, y, o = {}) {
  const { r = 24, color = '#c8a8ff', color2 = '#ffffff', variant = 'magic', delay = 0, life = 800, sy = 0.36 } = o;
  fx.add({ kind: 'axGlyph', x, y, r, color, color2, variant, delay, life, sy });
  return delay;
}
// オーラ（style: flame・swirl・rings・glint・crest・ribbons・glyph・spot・cards・snow・star・gomu・pulse）
export function aura(fx, x, y, o = {}) {
  const { style = 'pulse', r = 14, h = 30, color = '#7ad8ff', color2 = '#ffffff', delay = 0, life = 700, k = 1, variant, alpha } = o;
  fx.add({ kind: 'axAura', x, y, r, h, color, color2, style, delay, life, k, variant, alpha, seed: Math.random() * 100 });
  return delay;
}
// あたった ときの きまりの しるし（しろい まる＋火花）
export function hitMark(fx, x, y, o = {}) {
  const { r = 14, colors = ['#ffffff'], delay = 0 } = o;
  fx.impact(x, y, { r, color: '#ffffff', delay });
  fx.sparks(x, y, { colors: ['#ffffff', ...colors], n: 12, speed: 140, delay, life: 340, len: 6 });
  return delay;
}

// fx を しばった どうぐばこ（ctx.k）。k.beam(x0, y0, x1, y1, {...}) の ように fx なしで つかえる
export const KIT_FNS = {
  beam, pillar, orb, crescent, slash, multiSlash, shockwave, impact, explosion, debris, particles, shapes, sparkles, petals, gather,
  bolt, boltRain, flames, wave, splash, speedLines, streaks, tint, dim, flash, shake, dash, cutIn, glyph, aura, hitMark,
};
export function bindKit(fx) {
  const k = {};
  for (const [name, fn] of Object.entries(KIT_FNS)) k[name] = (...a) => fn(fx, ...a);
  return k;
}
