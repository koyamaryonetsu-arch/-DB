// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）: G3 だけの どうぐと つぶの かきかた
// ・ribbon … 道に そって のびる ふでの 帯（水の呼吸の 浮世絵の 波・炎の 刃・日輪の 刃・風・剣の 光）
// ・dragon … 道を すすむ 竜（あたま＋うねる からだ。水・炎・金・風。あたまは 竜 か 虎）
// ・line   … まっすぐな 神速の 太刀すじ（さきに 小さな 竜の あたま も）
// ・tornado … 竜巻（つみかさねた わ・木の葉）
// ・sun    … 日輪（赤い 円・金の ふち・ほのおの した・ひかりの すじ）
// ・bg     … 全画面の 背景（夜の 月・夜明けの 日輪・夕方の 浜辺・炎・ちょうちん・すきとおる）
// ・prop   … 小道具の 絵（ひょうたん・お弁当・たらい・湯のみ・マント・白馬・お庭番・ふすま・目安箱・まとい・紋・剣士の かげ…）
// つぶの なまえは g3〜（AX_G3_FINE）。画面の 文字は ひらがな・カタカナ・記号だけ
import { rnd, clamp01, lerp, easeOut, easeIn, easeInOut, hash, softGlow, disc } from './axkit.js?v=b006a21bc0e3';

const TAU = Math.PI * 2;
const W0 = 256, H0 = 144;

// ───────────── 道（なめらかな 曲線を 2px ごとに） ─────────────
// ctrl: [[x, y], …] → { P（x,y の ならび）, N, ds, L }
export function makePath(ctrl, ds = 2) {
  const n = ctrl.length;
  if (n < 2) return { P: [ctrl[0][0], ctrl[0][1], ctrl[0][0] + 0.01, ctrl[0][1]], N: 2, ds, L: ds };
  const raw = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(n - 1, i + 2)];
    const seg = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 1.5));
    for (let k = 0; k < seg; k++) {
      const t = k / seg, t2 = t * t, t3 = t2 * t;
      const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      raw.push([cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  raw.push([ctrl[n - 1][0], ctrl[n - 1][1]]);
  const P = [raw[0][0], raw[0][1]];
  let acc = 0;
  for (let i = 1; i < raw.length; i++) {
    const [ax, ay] = raw[i - 1], [bx, by] = raw[i];
    const seg = Math.hypot(bx - ax, by - ay);
    if (seg <= 0) continue;
    let used = 0;
    while (acc + (seg - used) >= ds) {
      const need = ds - acc;
      used += need;
      const f = used / seg;
      P.push(ax + (bx - ax) * f, ay + (by - ay) * f);
      acc = 0;
    }
    acc += seg - used;
  }
  const last = raw[raw.length - 1];
  if (acc > 0.2) P.push(last[0], last[1]);
  if (P.length < 4) P.push(P[0] + 0.01, P[1]);
  const N = P.length / 2;
  return { P, N, ds, L: (N - 1) * ds };
}
// 道の d（px）の ところ { x, y, a（むき） }
function at(p, d) {
  const N = p.N;
  const s = Math.max(0, Math.min(N - 1.0001, d / p.ds));
  const i = Math.floor(s), f = s - i;
  const P = p.P;
  const x0 = P[i * 2], y0 = P[i * 2 + 1], x1 = P[i * 2 + 2], y1 = P[i * 2 + 3];
  return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, a: Math.atan2(y1 - y0, x1 - x0) };
}
// 円・弧・らせんの 点
export function arcPts(cx, cy, r, a0, a1, n = 16, sy = 1) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy]);
  }
  return out;
}
export function spiralPts(cx, cy, r0, r1, a0, turns, n = 40, sy = 1) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n, a = a0 + turns * TAU * u, r = lerp(r0, r1, u);
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * sy]);
  }
  return out;
}
const clampX = (v, m = 120) => Math.max(-m, Math.min(W0 + m, v));
const clampY = (v, m = 120) => Math.max(-m, Math.min(H0 + m, v));
export const safePts = (pts) => pts.map(([x, y]) => [clampX(x), clampY(y)]);

// ───────────── かく ための 小さな どうぐ ─────────────
function poly(x, pts) {
  x.beginPath();
  for (let i = 0; i < pts.length; i += 2) (i ? x.lineTo(pts[i], pts[i + 1]) : x.moveTo(pts[i], pts[i + 1]));
  x.closePath();
  x.fill();
}
// S: [{ x, y, nx, ny, w }] の 帯（k … はばの わりあい、o … まん中から ずらす わりあい）
function band(x, S, k, o = 0) {
  if (S.length < 2) return;
  const pts = [];
  for (const s of S) pts.push(s.x + s.nx * s.w * (o + k), s.y + s.ny * s.w * (o + k));
  for (let i = S.length - 1; i >= 0; i--) { const s = S[i]; pts.push(s.x + s.nx * s.w * (o - k), s.y + s.ny * s.w * (o - k)); }
  poly(x, pts);
}
function edgeLine(x, S, o) {
  x.beginPath();
  S.forEach((s, i) => { const px = s.x + s.nx * s.w * o, py = s.y + s.ny * s.w * o; i ? x.lineTo(px, py) : x.moveTo(px, py); });
  x.stroke();
}
// 浮世絵の しぶきの つめ（くるりと まく 白い 線）
function claw(x, ex, ey, nx, ny, tx, ty, R) {
  const cx = ex + nx * R, cy = ey + ny * R;
  const a0 = Math.atan2(-ny, -nx);
  const dir = (nx * ty - ny * tx) > 0 ? -1 : 1;
  x.beginPath();
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, a = a0 + dir * u * 4.2, r = R * (1 - 0.55 * u);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.stroke();
}

// 色の セット（ribbon・dragon の style）
export const G3_STYLE = {
  water: { dark: '#123a8a', main: '#2f6fe8', light: '#8fd8ff', core: '#ffffff', glow: '#6ac8ff', eye: '#ffffff' },
  flame: { dark: '#c42000', main: '#ff6a1a', light: '#ffb040', core: '#fff2a0', glow: '#ff9a2a', eye: '#fff6a0' },
  sun: { dark: '#a80010', main: '#ff3414', light: '#ffa020', core: '#fff4b0', glow: '#ff6a2a', eye: '#fff0a0', rim: '#ffd23a' },
  gold: { dark: '#9a5a08', main: '#ffc828', light: '#fff0a0', core: '#ffffff', glow: '#ffd66b', eye: '#ffffff' },
  wind: { dark: '#4a8aa8', main: '#cfefff', light: '#ffffff', core: '#ffffff', glow: '#bfeaff', eye: '#ffffff' },
  blade: { dark: '#5a8ac8', main: '#bfe4ff', light: '#ffffff', core: '#ffffff', glow: '#7ac8ff', eye: '#ffffff' },
  cold: { dark: '#3a9ac8', main: '#9ae6ff', light: '#e6fbff', core: '#ffffff', glow: '#7ad8ff', eye: '#ffffff' },
  red: { dark: '#5a0010', main: '#c8102a', light: '#ff5a5a', core: '#ffd0d0', glow: '#ff3a3a', eye: '#ffd23a' },
  ink: { dark: '#000000', main: '#1a1a26', light: '#8a8aa8', core: '#e8e8ff', glow: '#4a4a6a', eye: '#ffffff' },
};
const styleOf = (s) => (typeof s === 'object' && s ? s : G3_STYLE[s] || G3_STYLE.blade);

// ───────────── 竜・虎の あたま ─────────────
// s … 大きさ（あたまの ながさの 半分くらい）、open … 口の ひらき（0〜1）
function dragonHead(x, hx, hy, ang, s, C, open, age, kind, alpha) {
  x.save();
  x.translate(hx, hy);
  x.rotate(ang);
  if (Math.cos(ang) < 0) x.scale(1, -1);
  x.scale(s, s);
  x.globalAlpha = alpha;
  x.lineJoin = 'round';
  x.lineWidth = Math.max(0.12, 0.7 / s);
  if (kind === 'tiger') {
    // ほのおの たてがみ（うしろ）
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = C.main;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.55 + (i / 8) * Math.PI * 1.0;
      const fl = 0.55 + 0.6 * hash(Math.floor(age / 55) + i * 7.3);
      const bx = -0.25 + Math.cos(a) * 0.62, by = -0.15 + Math.sin(a) * 0.62;
      const tx = -0.25 + Math.cos(a) * (0.62 + fl) - 0.35, ty = -0.15 + Math.sin(a) * (0.62 + fl * 0.8);
      x.beginPath(); x.moveTo(bx - Math.sin(a) * 0.18, by + Math.cos(a) * 0.18); x.lineTo(tx, ty); x.lineTo(bx + Math.sin(a) * 0.18, by - Math.cos(a) * 0.18); x.closePath(); x.fill();
    }
    x.fillStyle = C.light;
    for (let i = 0; i < 6; i++) {
      const a = Math.PI * 0.65 + (i / 5) * Math.PI * 0.8;
      const fl = 0.3 + 0.4 * hash(Math.floor(age / 50) + i * 3.1);
      const bx = -0.25 + Math.cos(a) * 0.5, by = -0.15 + Math.sin(a) * 0.5;
      x.beginPath(); x.moveTo(bx - 0.1, by); x.lineTo(bx + Math.cos(a) * fl - 0.2, by + Math.sin(a) * fl); x.lineTo(bx + 0.1, by + 0.08); x.closePath(); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
    // した あご
    x.save();
    x.translate(0.3, 0.08); x.rotate(open * 0.6); x.translate(-0.3, -0.08);
    x.fillStyle = C.main; x.strokeStyle = C.dark;
    x.beginPath(); x.moveTo(0.3, 0.05); x.lineTo(1.12, 0.08); x.quadraticCurveTo(1.15, 0.32, 0.88, 0.36); x.lineTo(0.1, 0.46); x.quadraticCurveTo(-0.2, 0.4, 0.3, 0.05); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(0.92, 0.1); x.lineTo(0.98, -0.16); x.lineTo(1.04, 0.1); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(0.55, 0.1); x.lineTo(0.6, -0.04); x.lineTo(0.66, 0.1); x.closePath(); x.fill();
    x.restore();
    // くち の なか
    x.fillStyle = C.dark;
    x.beginPath(); x.moveTo(0.3, 0.02); x.lineTo(1.15, 0.02); x.lineTo(0.35, 0.12 + open * 0.3); x.closePath(); x.fill();
    // あたま
    x.fillStyle = C.main; x.strokeStyle = C.dark;
    x.beginPath();
    x.moveTo(-0.8, 0.12); x.quadraticCurveTo(-0.88, -0.75, -0.05, -0.8); x.quadraticCurveTo(0.6, -0.8, 0.95, -0.45);
    x.lineTo(1.25, -0.3); x.quadraticCurveTo(1.38, -0.15, 1.26, -0.0); x.lineTo(0.3, 0.02); x.lineTo(-0.3, 0.5); x.quadraticCurveTo(-0.72, 0.5, -0.8, 0.12);
    x.closePath(); x.fill(); x.stroke();
    // みみ
    x.beginPath(); x.moveTo(-0.5, -0.68); x.lineTo(-0.3, -1.12); x.lineTo(-0.02, -0.76); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = C.light;
    x.beginPath(); x.moveTo(-0.38, -0.72); x.lineTo(-0.29, -0.98); x.lineTo(-0.14, -0.76); x.closePath(); x.fill();
    // しま
    x.strokeStyle = C.dark; x.lineWidth = 0.09;
    for (const [a, b, c2, d] of [[-0.55, -0.55, -0.2, -0.3], [-0.6, -0.15, -0.25, 0.05], [0.1, -0.78, 0.05, -0.55], [0.45, -0.72, 0.35, -0.52]]) { x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo((a + c2) / 2 + 0.1, (b + d) / 2, c2, d); x.stroke(); }
    // はな の うえ の あかり
    x.strokeStyle = C.light; x.lineWidth = 0.08;
    x.beginPath(); x.moveTo(0.55, -0.58); x.quadraticCurveTo(0.95, -0.45, 1.22, -0.26); x.stroke();
    // きば
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(1.0, -0.02); x.lineTo(1.04, 0.3); x.lineTo(1.12, -0.02); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(0.5, 0.0); x.lineTo(0.54, 0.18); x.lineTo(0.6, 0.0); x.closePath(); x.fill();
    // め（つりあがった 目）
    x.fillStyle = C.eye;
    x.beginPath(); x.moveTo(0.18, -0.42); x.quadraticCurveTo(0.4, -0.58, 0.6, -0.48); x.quadraticCurveTo(0.4, -0.36, 0.18, -0.42); x.fill();
    x.fillStyle = C.dark; x.fillRect(0.36, -0.52, 0.07, 0.12);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0.4, -0.47, 0.35, C.glow, alpha);
  } else {
    // たてがみ（うしろ の とげ）
    x.fillStyle = C.light;
    for (let i = 0; i < 4; i++) {
      const bx = -0.5 - i * 0.22, by = -0.35 + i * 0.12;
      const fl = 0.35 + 0.25 * hash(Math.floor(age / 60) + i);
      x.beginPath(); x.moveTo(bx + 0.15, by - 0.05); x.lineTo(bx - fl, by - fl * 0.7); x.lineTo(bx - 0.05, by + 0.15); x.closePath(); x.fill();
    }
    // つの
    x.strokeStyle = C.light; x.lineCap = 'round';
    x.lineWidth = 0.16;
    x.beginPath(); x.moveTo(-0.2, -0.58); x.quadraticCurveTo(-0.7, -1.05, -1.45, -1.0); x.stroke();
    x.lineWidth = 0.12;
    x.beginPath(); x.moveTo(-0.38, -0.45); x.quadraticCurveTo(-0.85, -0.7, -1.3, -0.55); x.stroke();
    // した あご
    x.save();
    x.translate(0.2, 0.08); x.rotate(open * 0.55); x.translate(-0.2, -0.08);
    x.fillStyle = C.main; x.strokeStyle = C.dark; x.lineWidth = Math.max(0.1, 0.6 / s);
    x.beginPath(); x.moveTo(0.2, 0.06); x.lineTo(1.25, 0.12); x.quadraticCurveTo(1.32, 0.3, 1.02, 0.32); x.lineTo(0.0, 0.38); x.quadraticCurveTo(-0.5, 0.42, -0.6, 0.2); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff';
    for (const tx of [0.55, 0.8, 1.05]) { x.beginPath(); x.moveTo(tx - 0.05, 0.12); x.lineTo(tx, -0.02); x.lineTo(tx + 0.05, 0.12); x.closePath(); x.fill(); }
    x.restore();
    x.fillStyle = C.dark;
    x.beginPath(); x.moveTo(0.25, 0.0); x.lineTo(1.3, 0.0); x.lineTo(0.3, 0.1 + open * 0.3); x.closePath(); x.fill();
    // うえ の あたま
    x.fillStyle = C.main; x.strokeStyle = C.dark; x.lineWidth = Math.max(0.1, 0.6 / s);
    x.beginPath();
    x.moveTo(-0.7, 0.22); x.quadraticCurveTo(-0.68, -0.72, 0.02, -0.64); x.lineTo(0.38, -0.56);
    x.quadraticCurveTo(0.95, -0.5, 1.38, -0.32); x.quadraticCurveTo(1.58, -0.24, 1.5, -0.06); x.lineTo(0.3, 0.04); x.quadraticCurveTo(-0.3, 0.3, -0.7, 0.22);
    x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#ffffff';
    for (const tx of [0.6, 0.85, 1.1]) { x.beginPath(); x.moveTo(tx - 0.05, 0.0); x.lineTo(tx, 0.13); x.lineTo(tx + 0.05, 0.0); x.closePath(); x.fill(); }
    x.beginPath(); x.moveTo(1.28, -0.02); x.lineTo(1.31, 0.22); x.lineTo(1.38, -0.03); x.closePath(); x.fill();
    // まゆ・はな の あかり
    x.strokeStyle = C.light; x.lineWidth = 0.08;
    x.beginPath(); x.moveTo(-0.15, -0.55); x.quadraticCurveTo(0.25, -0.62, 0.62, -0.46); x.stroke();
    x.beginPath(); x.moveTo(0.7, -0.44); x.quadraticCurveTo(1.1, -0.38, 1.4, -0.24); x.stroke();
    // め
    x.fillStyle = C.eye;
    x.beginPath(); x.ellipse(0.28, -0.38, 0.13, 0.08, -0.25, 0, TAU); x.fill();
    x.fillStyle = C.dark; x.fillRect(0.3, -0.43, 0.06, 0.1);
    // ひげ
    x.strokeStyle = C.light; x.lineWidth = 0.06;
    const wv = Math.sin(age / 90);
    x.beginPath(); x.moveTo(1.35, -0.12); x.quadraticCurveTo(0.6, 0.7 + wv * 0.2, -1.4, 0.55 + wv * 0.35); x.stroke();
    x.beginPath(); x.moveTo(1.3, -0.28); x.quadraticCurveTo(0.4, -0.15 - wv * 0.2, -1.3, -0.25 - wv * 0.3); x.stroke();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0.28, -0.38, 0.32, C.glow, alpha);
  }
  x.restore();
}

// ───────────── 剣士・人の かげ ─────────────
// pose: 'iai'（さやに 手。まえかがみ）・'slash'（刀を まえに）・'up'（刀を 上に）・'stand'（たつ）・'ninja'（しゃがむ）・'bow'（ひれふす）
function figure(x, s, pose, body, blade, age) {
  x.save();
  x.scale(s, s);
  x.fillStyle = body;
  x.strokeStyle = body;
  x.lineCap = 'round';
  x.lineJoin = 'round';
  const lean = pose === 'iai' ? 0.35 : pose === 'slash' ? 0.2 : pose === 'ninja' ? 0.15 : 0;
  if (pose === 'bow') {
    // ひれふす（まるまった せなか）
    x.beginPath(); x.ellipse(0, -3, 7, 3.6, 0, Math.PI, 0); x.fill();
    x.fillRect(-7, -3, 14, 3);
    x.beginPath(); x.arc(7.5, -2.5, 2.4, 0, TAU); x.fill();
    x.restore();
    return;
  }
  x.save();
  x.rotate(lean);
  if (pose === 'ninja') {
    // しゃがむ にんじゃ
    x.beginPath(); x.arc(0, -14, 2.8, 0, TAU); x.fill();
    x.beginPath(); x.moveTo(-3, -11.5); x.lineTo(3, -11.5); x.lineTo(4, -5); x.lineTo(-4, -5); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-4, -5); x.lineTo(5, -5); x.lineTo(7, 0); x.lineTo(1, 0); x.lineTo(0, -2); x.lineTo(-2, 0); x.lineTo(-7, 0); x.closePath(); x.fill();
    // はちまきの はし
    x.lineWidth = 0.8;
    const fl = Math.sin(age / 70) * 1.2;
    x.beginPath(); x.moveTo(-2.4, -14.5); x.lineTo(-6, -15 + fl); x.moveTo(-2.4, -14); x.lineTo(-5.5, -12.8 - fl); x.stroke();
    x.fillStyle = '#ffffff';
    x.fillRect(0.4, -14.8, 2.2, 0.7);
    x.restore();
    x.restore();
    return;
  }
  // あたま・かみ（うしろで むすぶ）
  x.beginPath(); x.arc(0, -20, 3, 0, TAU); x.fill();
  x.beginPath(); x.moveTo(-2.5, -21.5); x.lineTo(-7.5, -19 + Math.sin(age / 80) * 1.2); x.lineTo(-2.5, -18.5); x.closePath(); x.fill();
  // からだ・はかま
  x.beginPath(); x.moveTo(-2.4, -17); x.lineTo(2.8, -16.6); x.lineTo(3.6, -8); x.lineTo(-3.2, -8); x.closePath(); x.fill();
  x.beginPath(); x.moveTo(-3.6, -8.5); x.lineTo(4.4, -8.5); x.lineTo(8, 0); x.lineTo(1.6, 0); x.lineTo(0.4, -4); x.lineTo(-1.2, 0); x.lineTo(-7.6, 0); x.closePath(); x.fill();
  // うで と 刀
  x.lineWidth = 2;
  if (pose === 'iai') {
    x.beginPath(); x.moveTo(1.5, -15); x.lineTo(4, -10.5); x.stroke();
    x.strokeStyle = blade; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(5, -10); x.lineTo(-7, -7.5); x.stroke();
  } else if (pose === 'up') {
    x.beginPath(); x.moveTo(1, -16); x.lineTo(2.5, -23); x.stroke();
    x.strokeStyle = blade; x.lineWidth = 1;
    x.beginPath(); x.moveTo(2.5, -23); x.lineTo(5, -38); x.stroke();
  } else if (pose === 'stand') {
    x.beginPath(); x.moveTo(1.5, -15.5); x.lineTo(3, -9); x.stroke();
    x.strokeStyle = blade; x.lineWidth = 1;
    x.beginPath(); x.moveTo(3, -9); x.lineTo(14, -4); x.stroke();
  } else {
    x.beginPath(); x.moveTo(1.5, -15.5); x.lineTo(8, -12.5); x.stroke();
    x.strokeStyle = blade; x.lineWidth = 1;
    x.beginPath(); x.moveTo(8, -12.5); x.lineTo(23, -16.5); x.stroke();
  }
  x.restore();
  x.restore();
}

// ───────────── 小道具の 絵（1つの つぶで） ─────────────
const PROP = {
  // ひょうたん（ふくらむ）
  gourd(x, p, u) {
    const inf = 1 + (p.inflate || 0) * easeIn(clamp01(p.age / Math.max(1, p.life * 0.85)));
    x.save(); x.scale(inf, inf);
    x.fillStyle = '#c86a10'; disc(x, 0, 3, 5, '#c86a10'); disc(x, 0, -4, 3.4, '#c86a10');
    disc(x, 0, 3, 4.2, '#f0902a'); disc(x, 0, -4, 2.7, '#f0902a');
    x.fillStyle = '#ffd08a'; x.fillRect(-2.5, 0, 1.2, 3); x.fillRect(-1.5, -5.5, 0.9, 2);
    x.fillStyle = '#8a3a0a'; x.fillRect(-1.2, -0.8, 2.4, 1.2);
    x.fillStyle = '#6a3a1a'; x.fillRect(-0.8, -8.6, 1.6, 2);
    x.restore();
  },
  // お弁当（ふたが あく）
  bento(x, p) {
    const op = clamp01(p.age / 260);
    x.fillStyle = '#5a2a10'; x.fillRect(-9, -3, 18, 8);
    x.fillStyle = '#a0461a'; x.fillRect(-8, -2, 16, 6);
    x.fillStyle = '#ffffff'; x.fillRect(-7.5, -2.6, 9, 4);
    disc(x, -3, -1, 1.3, '#e8203a');
    x.fillStyle = '#ffd23a'; x.fillRect(2.4, -2.4, 2.4, 1.6);
    x.fillStyle = '#e86a2a'; x.fillRect(5, -2.4, 2, 1.6);
    x.fillStyle = '#3aa040'; x.fillRect(2.4, -0.4, 4.6, 1.6);
    x.save(); x.translate(-9, -3); x.rotate(-op * 1.1);
    x.fillStyle = '#3a1808'; x.fillRect(0, -2.4, 18, 2.4);
    x.fillStyle = '#c8302a'; x.fillRect(0, -1.4, 18, 0.6);
    x.restore();
    x.strokeStyle = '#c89050'; x.lineWidth = 0.7;
    x.beginPath(); x.moveTo(6, -5); x.lineTo(12, -11); x.moveTo(7.2, -4.6); x.lineTo(13, -10.4); x.stroke();
  },
  // たらい（あわ つき）
  tub(x, p) {
    x.fillStyle = '#6a4020'; x.beginPath(); x.ellipse(0, 0, 13, 4.5, 0, 0, Math.PI); x.lineTo(-13, 0); x.fill();
    x.fillRect(-13, -3, 26, 3);
    x.fillStyle = '#b07a40'; x.beginPath(); x.ellipse(0, 0, 12, 4, 0, 0, Math.PI); x.fill(); x.fillRect(-12, -3, 24, 3);
    x.fillStyle = '#3a2a1a'; x.fillRect(-12.5, -1.8, 25, 0.8); x.fillRect(-12, 1.6, 24, 0.7);
    x.fillStyle = '#8ad0ff'; x.beginPath(); x.ellipse(0, -3, 12, 3.4, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 9; i++) {
      const bx = -9 + i * 2.3 + Math.sin(p.age / 120 + i) * 0.8, by = -3.5 - hash(i + 3) * 2.5 - Math.abs(Math.sin(p.age / 160 + i)) * 1.5;
      x.globalAlpha *= 1; disc(x, bx, by, 1.4 + hash(i) * 1.2, '#ffffff');
    }
    x.fillStyle = '#e8f6ff';
    x.save(); x.translate(4, -6); x.rotate(Math.sin(p.age / 90) * 0.4);
    x.fillRect(-3, -2, 6, 4); x.restore();
  },
  // 湯のみと 湯気
  cup(x, p) {
    x.fillStyle = '#2a6a3a'; x.beginPath(); x.moveTo(-5, -6); x.lineTo(5, -6); x.lineTo(4, 3); x.lineTo(-4, 3); x.closePath(); x.fill();
    x.fillStyle = '#5aa86a'; x.fillRect(-4.5, -5.5, 2, 8);
    x.fillStyle = '#c8e8a0'; x.beginPath(); x.ellipse(0, -6, 5, 1.4, 0, 0, TAU); x.fill();
    x.fillStyle = '#e8d8b0'; x.fillRect(-7, 3, 14, 1.4);
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.8;
    for (let k = 0; k < 3; k++) {
      const ph = p.age / 160 + k * 2;
      x.globalAlpha = 0.6 * (0.6 + 0.4 * Math.sin(ph));
      x.beginPath();
      for (let i = 0; i <= 8; i++) { const yy = -8 - i * 1.6, xx = (k - 1) * 2.6 + Math.sin(ph + i * 0.7) * 1.4; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
    }
  },
  // 白い マント（うらが 赤い。ひるがえる）
  mantle(x, p) {
    const fl = p.age / 70;
    const pts = [];
    for (let i = 0; i <= 8; i++) pts.push([-12 + i * 3, 14 + Math.sin(fl + i * 0.8) * 3]);
    x.fillStyle = '#c8202a';
    x.beginPath(); x.moveTo(-4, -12); x.lineTo(4, -12);
    for (let i = pts.length - 1; i >= 0; i--) x.lineTo(pts[i][0] * 1.05 + 1.5, pts[i][1] + 1);
    x.closePath(); x.fill();
    x.fillStyle = '#f4f4f8';
    x.beginPath(); x.moveTo(-5, -13); x.lineTo(5, -13);
    pts.slice().reverse().forEach(([a, b]) => x.lineTo(a, b));
    x.closePath(); x.fill();
    x.strokeStyle = '#c8c8d8'; x.lineWidth = 0.7;
    for (const sx of [-6, 0, 6]) { x.beginPath(); x.moveTo(sx * 0.3, -11); x.lineTo(sx, 12); x.stroke(); }
    x.fillStyle = '#d0b060'; x.fillRect(-5, -14, 10, 2);
  },
  // 白馬（はしる。lift … さむらいが のる）
  horse(x, p) {
    const ph = p.age / 55;
    x.fillStyle = p.color || '#ffffff';
    x.strokeStyle = p.color || '#ffffff';
    x.lineCap = 'round';
    x.beginPath(); x.ellipse(0, -10, 10, 5, 0, 0, TAU); x.fill();
    // くび・あたま
    x.beginPath(); x.moveTo(6, -13); x.lineTo(12, -22); x.lineTo(16, -21); x.lineTo(10, -10); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(12, -23); x.lineTo(20, -18.5); x.lineTo(19, -16.4); x.lineTo(13, -19); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(12.5, -22.5); x.lineTo(13.4, -25.5); x.lineTo(14.4, -22.6); x.fill();
    // たてがみ・しっぽ
    x.fillStyle = p.color2 || '#e8e0d0';
    x.beginPath(); x.moveTo(11, -23); x.lineTo(5, -14 + Math.sin(ph) * 1.5); x.lineTo(8, -13); x.closePath(); x.fill();
    x.lineWidth = 2.2; x.strokeStyle = p.color2 || '#e8e0d0';
    x.beginPath(); x.moveTo(-9.5, -12); x.quadraticCurveTo(-15, -12 + Math.sin(ph) * 2, -18, -6 + Math.sin(ph * 1.3) * 2); x.stroke();
    // あし（ギャロップ）
    x.strokeStyle = p.color || '#ffffff'; x.lineWidth = 1.8;
    const leg = (hx, hy, a) => { const kx = hx + Math.sin(a) * 4, ky = hy + 5; x.beginPath(); x.moveTo(hx, hy); x.lineTo(kx, ky); x.lineTo(kx + Math.sin(a + 1) * 2.5, ky + 5); x.stroke(); };
    leg(7, -7, ph); leg(5, -7, ph + 2.2); leg(-6, -7, ph + 3.6); leg(-8, -7, ph + 5.4);
    // のる 人
    if (p.rider) {
      x.fillStyle = p.rider;
      x.beginPath(); x.moveTo(-3, -14); x.lineTo(3, -14); x.lineTo(2, -23); x.lineTo(-2.4, -23); x.closePath(); x.fill();
      disc(x, 0, -25.5, 2.6, p.rider);
      x.beginPath(); x.moveTo(-2, -27); x.lineTo(-6, -25); x.lineTo(-2, -24.5); x.fill();
      x.strokeStyle = '#e8f4ff'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(2, -20); x.lineTo(13, -27); x.stroke();
    }
  },
  // 金の ふすま（open 0 … しまる、1 … ひらく。side -1 … 左、1 … 右）
  fusuma(x, p) {
    const op = easeOut(clamp01((p.age - (p.wait || 0)) / 420));
    const side = p.side || 1;
    const w = 34, h = 70;
    x.translate(side * op * w * 0.95, 0);
    const x0 = side > 0 ? 0 : -w;
    x.fillStyle = '#7a4a10'; x.fillRect(x0, -h / 2, w, h);
    x.fillStyle = '#e8b030'; x.fillRect(x0 + 2, -h / 2 + 2, w - 4, h - 4);
    x.fillStyle = '#ffe080';
    for (let i = 0; i < 4; i++) x.fillRect(x0 + 4, -h / 2 + 5 + i * 16, w - 8, 1);
    // くも の もよう
    x.fillStyle = '#fff2b0';
    for (let i = 0; i < 3; i++) { const cx = x0 + 8 + (i % 2) * 14, cy = -h / 2 + 14 + i * 18; x.beginPath(); x.ellipse(cx, cy, 7, 2.4, 0, 0, TAU); x.fill(); }
    x.fillStyle = '#3a2008'; x.fillRect(side > 0 ? x0 + 3 : x0 + w - 6, -3, 3, 6);
  },
  // 目安箱
  box(x, p) {
    x.fillStyle = '#5a3218'; x.fillRect(-9, -8, 18, 14);
    x.fillStyle = '#a06a34'; x.fillRect(-8, -7, 16, 12);
    x.fillStyle = '#3a2010'; x.beginPath(); x.moveTo(-11, -8); x.lineTo(0, -14); x.lineTo(11, -8); x.closePath(); x.fill();
    x.fillStyle = '#1a0a04'; x.fillRect(-4, -5, 8, 1.4);
    x.fillStyle = '#ffffff'; x.fillRect(-5, -2, 10, 6);
    x.fillStyle = '#3a3a3a'; for (let i = 0; i < 3; i++) x.fillRect(-4 + i * 3.2, -1.2, 0.6, 4.4);
  },
  // 手紙（ひらひら）
  letter(x, p) {
    const sq = Math.cos(p.age / 90 + (p.seed || 0)) * 0.8 + 0.2;
    x.scale(1, Math.max(0.15, Math.abs(sq)));
    x.fillStyle = '#ffffff'; x.fillRect(-3.4, -2.4, 6.8, 4.8);
    x.strokeStyle = '#b8b0a0'; x.lineWidth = 0.4;
    x.beginPath(); x.moveTo(-3.4, -2.4); x.lineTo(0, 0.4); x.lineTo(3.4, -2.4); x.stroke();
  },
  // まとい（火消しの しるし。まわる）
  matoi(x, p) {
    const sp = p.age / 120;
    x.fillStyle = '#c8a060'; x.fillRect(-0.8, -6, 1.6, 34);
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(0, -10, 4.6, 0, TAU); x.fill();
    x.fillStyle = '#e8e8e8'; x.fillRect(-6, -6, 12, 3);
    for (let i = 0; i < 10; i++) {
      const a = sp + (i / 10) * TAU;
      const sx = Math.cos(a) * 7, depth = Math.sin(a);
      x.fillStyle = i % 2 ? '#ffffff' : '#e83020';
      x.globalAlpha = 0.6 + 0.4 * (depth + 1) / 2;
      x.fillRect(sx - 1, -4, 2, 12 + depth * 1.5);
    }
    x.globalAlpha = 1;
    x.fillStyle = '#1a1a1a'; x.fillRect(-2, -16, 4, 2);
  },
  // 金の 丸い 紋（丸に 3まいの 葉。本物の 家紋では ない）
  crest(x, p) {
    const C = p.color || '#ffd23a', D = p.color2 || '#7a4a08';
    disc(x, 0, 0, 11, D);
    x.strokeStyle = C; x.lineWidth = 1.8;
    x.beginPath(); x.arc(0, 0, 9.6, 0, TAU); x.stroke();
    x.fillStyle = C;
    // まるい 葉（ハートの かたち。先が まん中）3まい ＋ 葉の すじ
    for (let i = 0; i < 3; i++) {
      x.save(); x.rotate(-Math.PI / 2 + (i / 3) * TAU);
      x.fillStyle = C;
      x.beginPath();
      x.moveTo(1, 0);
      x.bezierCurveTo(2.5, -4.8, 7.8, -4.6, 7.4, -0.6);
      x.quadraticCurveTo(7.2, 0, 6.4, 0.2);
      x.quadraticCurveTo(7.2, 0.4, 7.4, 0.8);
      x.bezierCurveTo(7.8, 4.6, 2.5, 4.8, 1, 0);
      x.fill();
      x.strokeStyle = D; x.lineWidth = 0.5;
      x.beginPath(); x.moveTo(1.6, 0); x.lineTo(6.2, 0);
      for (const t of [3, 4.6]) { x.moveTo(t, 0); x.lineTo(t + 1, -1.4); x.moveTo(t, 0); x.lineTo(t + 1, 1.4); }
      x.stroke();
      x.restore();
    }
    disc(x, 0, 0, 1.2, D);
  },
  // ちょうちん
  lantern(x, p) {
    const sw = Math.sin(p.age / 300 + (p.seed || 0)) * 0.12;
    x.rotate(sw);
    x.strokeStyle = '#3a2a1a'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(0, -12); x.lineTo(0, -6); x.stroke();
    x.fillStyle = '#1a1a1a'; x.fillRect(-3, -6.5, 6, 1.6); x.fillRect(-3, 5, 6, 1.6);
    x.fillStyle = '#e8302a'; x.beginPath(); x.ellipse(0, -0.5, 4.6, 5.8, 0, 0, TAU); x.fill();
    x.strokeStyle = '#a01810'; x.lineWidth = 0.4;
    for (let i = -2; i <= 2; i++) { x.beginPath(); x.ellipse(0, -0.5 + i * 2.2, 4.6 * Math.cos(i * 0.32), 0.6, 0, 0, TAU); x.stroke(); }
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 12, '#ff8a3a', 0.6 * x.globalAlpha);
  },
  // ぐるぐる（おろ）
  spiral(x, p) {
    x.strokeStyle = p.color || '#ffffff'; x.lineWidth = 0.9;
    x.beginPath();
    for (let i = 0; i <= 30; i++) { const a = i * 0.45 + p.age / 90, r = 0.4 + i * 0.22; const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.6; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
  },
  // あせの しずく
  drop(x, p) {
    x.fillStyle = p.color || '#7ad0ff';
    x.beginPath(); x.moveTo(0, -4); x.quadraticCurveTo(3, 0, 0, 2.4); x.quadraticCurveTo(-3, 0, 0, -4); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(-0.8, -0.6, 0.8, 1.2);
  },
  // やじるし（dir -1 … 上、1 … 下）
  arrow(x, p) {
    const d = p.dir || -1;
    x.fillStyle = p.color || '#7dffb0';
    x.beginPath(); x.moveTo(0, 5 * d); x.lineTo(-4, 0); x.lineTo(-1.6, 0); x.lineTo(-1.6, -5 * d); x.lineTo(1.6, -5 * d); x.lineTo(1.6, 0); x.lineTo(4, 0); x.closePath(); x.fill();
  },
  // 目の きらり
  eye(x, p) {
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(-6, 0); x.quadraticCurveTo(0, -4, 6, 0); x.quadraticCurveTo(0, 4, -6, 0); x.fill();
    disc(x, 0, 0, 2.4, p.color || '#ffd23a');
    disc(x, 0, 0, 1, '#1a1a1a');
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = '#ffffff';
    const tw = Math.sin(clamp01(p.age / p.life) * Math.PI);
    x.fillRect(-12 * tw, -0.4, 24 * tw, 0.8); x.fillRect(-0.4, -6 * tw, 0.8, 12 * tw);
  },
  // ほのおの かたち（むねの 火・ひたいの あざ）
  flame(x, p) {
    const fl = Math.sin(p.age / 50) * 0.15;
    x.fillStyle = p.color || '#ff4a1a';
    x.beginPath(); x.moveTo(0, 4); x.quadraticCurveTo(-4, 1, -2, -3); x.quadraticCurveTo(-1, -1, 0, -2);
    x.quadraticCurveTo(0, -5, 2 + fl * 4, -8); x.quadraticCurveTo(1, -3, 3.5, -2); x.quadraticCurveTo(4, 1, 0, 4); x.fill();
    x.fillStyle = p.color2 || '#ffd23a';
    x.beginPath(); x.moveTo(0, 3); x.quadraticCurveTo(-2, 1, -0.6, -1); x.quadraticCurveTo(0.4, 0, 1, -2.5); x.quadraticCurveTo(2.4, 0.5, 0, 3); x.fill();
  },
  // 刀（まわって とぶ。つかが 先）
  katana(x, p) {
    x.fillStyle = '#d8e8f8'; x.fillRect(-12, -0.7, 15, 1.4);
    x.fillStyle = '#ffffff'; x.fillRect(-12, -0.7, 15, 0.5);
    x.fillStyle = '#c8a040'; x.fillRect(3, -2, 1.4, 4);
    x.fillStyle = '#2a2030'; x.fillRect(4.4, -0.9, 6, 1.8);
    x.fillStyle = '#c8c8d8'; for (let i = 0; i < 3; i++) x.fillRect(5 + i * 1.8, -0.9, 0.6, 1.8);
  },
  // さや
  sheath(x) {
    x.fillStyle = '#2a1a3a'; x.fillRect(-12, -1.2, 18, 2.4);
    x.fillStyle = '#c8a040'; x.fillRect(6, -1.4, 1.2, 2.8); x.fillRect(-12, -1.2, 1.4, 2.4);
  },
  // ひよこ
  chick(x, p) {
    const hop = Math.abs(Math.sin(p.age / 80)) * 1.2;
    x.translate(0, -hop);
    disc(x, 0, 0, 2.6, '#ffe040'); disc(x, 1.6, -2, 1.8, '#ffe040');
    x.fillStyle = '#ff8a1a'; x.beginPath(); x.moveTo(3.2, -2); x.lineTo(4.6, -1.6); x.lineTo(3.2, -1.2); x.fill();
    x.fillStyle = '#1a1a1a'; x.fillRect(2, -2.6, 0.6, 0.6);
  },
  // 手裏剣（くろ）
  shuriken(x) {
    x.fillStyle = '#2a2a34';
    x.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = i % 2 ? 1.2 : 4; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    x.closePath(); x.fill();
    x.fillStyle = '#c8c8d8'; x.fillRect(-0.6, -0.6, 1.2, 1.2);
  },
  // ものほし（せんたく物が はためく）
  laundry(x, p) {
    const w = p.w || 60;
    x.strokeStyle = '#8a6a4a'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(-w / 2, 0); x.quadraticCurveTo(0, 4, w / 2, 0); x.stroke();
    const cols = ['#ffffff', '#e8f4ff', '#fff4e0', '#ffffff', '#e8ffe8'];
    for (let i = 0; i < 5; i++) {
      const sx = -w / 2 + (i + 0.5) * (w / 5), sy = 1.6 * Math.sin(((i + 0.5) / 5) * Math.PI) + 0.6;
      const fl = Math.sin(p.age / 80 + i * 1.3) * 0.25;
      x.save(); x.translate(sx, sy); x.transform(1, 0, fl, 1, 0, 0);
      x.fillStyle = cols[i];
      if (i % 2) { x.fillRect(-4, 0, 8, 7); x.fillRect(-6, 0, 12, 2.4); } else x.fillRect(-3.5, 0, 7, 8);
      x.restore();
    }
  },
  // 光の たて
  shield(x, p) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 22, p.color || '#bfe4ff', 0.6 * x.globalAlpha);
    x.fillStyle = p.color || '#bfe4ff';
    x.globalAlpha *= 0.5;
    x.beginPath(); x.moveTo(0, -14); x.lineTo(11, -9); x.quadraticCurveTo(10, 6, 0, 14); x.quadraticCurveTo(-10, 6, -11, -9); x.closePath(); x.fill();
    x.globalAlpha *= 1.8;
    x.strokeStyle = '#ffffff'; x.lineWidth = 1;
    x.stroke();
  },
  // すける 線（からだの 中の 骨組みの ような 白い 線。こわく ない）
  frame(x, p) {
    const s = p.s || 1;
    x.scale(s, s);
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.color || '#ffffff'; x.lineWidth = 0.7;
    const sh = p.age / 1000;
    const A0 = x.globalAlpha;
    // うすい からだの りんかく と 中を ながれる 気の すじ（こわく ない 線）
    x.globalAlpha *= 0.8;
    x.beginPath(); x.ellipse(0, 0, 11, 15, 0, 0, TAU); x.stroke();
    x.globalAlpha *= 0.7;
    x.beginPath(); x.ellipse(0, 0, 7.5, 11, 0, 0, TAU); x.stroke();
    x.lineWidth = 0.6;
    for (const sd of [-1, 0, 1]) {
      x.beginPath();
      for (let i = 0; i <= 12; i++) { const y = -12 + i * 2, xx = sd * 4 + Math.sin(i * 0.9 - sh * 8 + sd) * 1.6; i ? x.lineTo(xx, y) : x.moveTo(xx, y); }
      x.stroke();
    }
    // 大事な ところ（急所）が ひかる
    const pu = 0.6 + 0.4 * Math.sin(sh * 20);
    softGlow(x, 0, -3, 6, p.color2 || '#ff5a3a', pu * A0);
    x.globalAlpha = A0;
    x.beginPath(); x.arc(0, -3, 2.4 + pu, 0, TAU); x.stroke();
  },
  // 剣士の かげ（pose・color・blade）
  swordsman(x, p) {
    figure(x, p.s || 1, p.pose || 'slash', p.color || '#ffffff', p.blade || '#ffffff', p.age);
  },
  // 文字（ひらがな・記号。ふちどり）
  text(x, p) {
    const sz = p.size || 10;
    x.font = `bold ${sz}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineJoin = 'round';
    x.strokeStyle = p.color2 || '#3a1004';
    x.lineWidth = Math.max(1.5, sz * 0.22);
    x.strokeText(p.text || '', 0, 0);
    x.fillStyle = p.color || '#ffffff';
    x.fillText(p.text || '', 0, 0);
  },
  // 大きな ！
  bang(x, p) {
    x.fillStyle = p.color2 || '#7a0a0a';
    x.beginPath(); x.moveTo(-4.6, -16); x.lineTo(4.6, -16); x.lineTo(2.4, 5); x.lineTo(-2.4, 5); x.closePath(); x.fill();
    disc(x, 0, 11, 3.6, p.color2 || '#7a0a0a');
    x.fillStyle = p.color || '#ffd23a';
    x.beginPath(); x.moveTo(-3.4, -15); x.lineTo(3.4, -15); x.lineTo(1.6, 4); x.lineTo(-1.6, 4); x.closePath(); x.fill();
    disc(x, 0, 11, 2.6, p.color || '#ffd23a');
  },
  // ほそい 月（三日月）
  moon(x) {
    x.fillStyle = '#fff6dc';
    x.beginPath(); x.arc(0, 0, 8, -Math.PI * 0.5, Math.PI * 0.5); x.arc(-3.5, 0, 7, Math.PI * 0.42, -Math.PI * 0.42, true); x.closePath(); x.fill();
  },
  // 岩の 柱（じめんから 立つ。h … 高さ）
  rockpillar(x, p) {
    const up = easeOut(clamp01(p.age / 140));
    const h = (p.h || 26) * up, w = p.w || 9;
    x.fillStyle = '#4a3020';
    x.beginPath(); x.moveTo(-w, 2); x.lineTo(-w * 0.7, -h * 0.7); x.lineTo(-w * 0.25, -h); x.lineTo(w * 0.35, -h * 0.85); x.lineTo(w * 0.8, -h * 0.4); x.lineTo(w, 2); x.closePath(); x.fill();
    x.fillStyle = '#8a6a48';
    x.beginPath(); x.moveTo(-w * 0.8, 1); x.lineTo(-w * 0.55, -h * 0.66); x.lineTo(-w * 0.2, -h * 0.92); x.lineTo(w * 0.1, -h * 0.6); x.lineTo(w * 0.05, 1); x.closePath(); x.fill();
    x.fillStyle = '#c8a880';
    x.beginPath(); x.moveTo(-w * 0.55, -h * 0.66); x.lineTo(-w * 0.2, -h * 0.92); x.lineTo(-w * 0.1, -h * 0.75); x.closePath(); x.fill();
    x.strokeStyle = '#2a1a10'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(-w * 0.2, -h * 0.5); x.lineTo(w * 0.2, -h * 0.3); x.lineTo(0, -h * 0.1); x.stroke();
  },
  // はなふだの 耳かざり（赤い 日と 白い ふだ）
  earring(x, p) {
    x.fillStyle = '#ffffff'; x.fillRect(-3, -5, 6, 10);
    x.strokeStyle = '#3a1a1a'; x.lineWidth = 0.4; x.strokeRect(-3, -5, 6, 10);
    disc(x, 0, -1, 2.4, '#e8202a');
    x.fillStyle = '#3a8a3a'; x.fillRect(-3, 3, 6, 2);
  },
  // こけし の ような 小さな 人（味方の むね の 光の 位置）… 使わない ときは 何も かかない
};
export const G3_PROPS = Object.keys(PROP);

// ───────────── 背景の 色の 帯 ─────────────
const BG = {
  night: { sky: ['#03040e', '#0a1030', '#182450', '#22305a'], lo: '#0a0c18' },
  dawn: { sky: ['#1a0408', '#4a0a14', '#a01a14', '#ff6a1a', '#ffb050'], lo: '#2a0606' },
  sea: { sky: ['#4a2a6a', '#c8506a', '#ff9a4a', '#ffd27a'], lo: '#1a3a7a' },
  flame: { sky: ['#1a0200', '#4a0800', '#8a1a00', '#c83a08'], lo: '#2a0400' },
  lantern: { sky: ['#05030c', '#120a20', '#24102a', '#2a1418'], lo: '#0e0a10' },
  white: { sky: ['#f0f4ff', '#ffffff', '#e8f0ff'], lo: '#f0f4ff' },
  ukiyo: { sky: ['#0a1a4a', '#123a8a', '#1a5ab0'], lo: '#0a2a6a' },
  wind: { sky: ['#0a1820', '#16303a', '#204850'], lo: '#0a1418' },
};
const hexRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function bandColor(list, u) {
  const s = clamp01(u) * (list.length - 1);
  const i = Math.min(list.length - 2, Math.floor(s)), f = s - i;
  const a = hexRgb(list[i]), b = hexRgb(list[i + 1]);
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;
}

// ───────────── つぶの かきかた（AX_G3_FINE） ─────────────
export const G3_FINE = {
  // 道に そって のびる ふでの 帯
  g3Ribbon(x, p) {
    const age = p.age;
    const L = p.L;
    const hd = L * easeOut(clamp01(age / Math.max(1, p.draw)));
    const after = age - p.draw;
    const fade = after > p.hold ? clamp01(1 - (after - p.hold) / Math.max(1, p.life - p.draw - p.hold)) : 1;
    if (fade <= 0 || hd <= 1) return;
    const td = after > p.hold ? hd * p.retract * (1 - fade) : 0;
    const C = styleOf(p.style);
    const S = [];
    const step = p.step || 2.5;
    for (let d = td; ; d += step) {
      if (d > hd) d = hd;
      const q = at(p, d);
      const u = d / L;
      let w = p.w * Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.94 + 0.03)), 0.55) * (0.5 + 0.5 * fade);
      w *= Math.min(1, 0.25 + (hd - d) / 9);
      if (p.flare >= 0) w *= 1 + 0.8 * Math.exp(-Math.pow((age - p.flare) / 70, 2));
      const nx = -Math.sin(q.a), ny = Math.cos(q.a);
      const off = p.wob ? p.wob * Math.sin(d / 8 - age / 45 + p.seed) * (0.4 + 0.6 * fade) : 0;
      S.push({ x: q.x + nx * off, y: q.y + ny * off, nx, ny, w: Math.max(0, w), d, tx: Math.cos(q.a), ty: Math.sin(q.a) });
      if (d >= hd) break;
    }
    if (S.length < 2) return;
    const A = (p.alpha ?? 1) * fade;
    const side = p.side || 1;
    x.save();
    x.lineCap = 'round';
    x.lineJoin = 'round';
    const st = p.style;
    if (st === 'water') {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.35 * A; x.fillStyle = C.glow; band(x, S, 1.7);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.95 * A; x.fillStyle = C.dark; band(x, S, 1.2);
      x.fillStyle = C.main; band(x, S, 0.95, -0.05 * side);
      // 浮世絵の すじ
      x.strokeStyle = C.light; x.lineWidth = 0.8;
      edgeLine(x, S, 0.35 * side); edgeLine(x, S, -0.2 * side);
      x.globalAlpha = 0.7 * A; edgeLine(x, S, -0.6 * side);
      // しぶきの ふち と つめ
      x.globalAlpha = A; x.strokeStyle = C.core; x.lineWidth = 1.2;
      edgeLine(x, S, 0.92 * side);
      x.lineWidth = 1;
      const gap = p.clawGap || 11;
      for (let i = 1; i < S.length - 1; i++) {
        const s = S[i];
        const k = Math.floor(s.d / gap);
        if (Math.floor(S[i - 1].d / gap) === k || s.w < 2) continue;
        claw(x, s.x + s.nx * s.w * 0.92 * side, s.y + s.ny * s.w * 0.92 * side, s.nx * side, s.ny * side, -s.tx, -s.ty, Math.min(6, s.w * 0.62));
      }
      // 太刀すじの 白い しん
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.9 * A; x.fillStyle = C.core; band(x, S, 0.14, 0.55 * side);
    } else if (st === 'flame' || st === 'sun' || st === 'gold' || st === 'red') {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.45 * A; x.fillStyle = C.dark; band(x, S, 1.35);
      x.globalAlpha = 0.85 * A; x.fillStyle = C.main; band(x, S, 1.0);
      // ほのおの した（うしろへ なびく）
      if (st !== 'gold') {
        const fk = Math.floor(age / 55);
        for (let i = 1; i < S.length - 1; i += 2) {
          const s = S[i];
          if (s.w < 1.5) continue;
          for (const sd of p.both === false ? [side] : [1, -1]) {
            const len = s.w * (0.5 + 1.0 * hash(fk * 3.1 + i * 7.7 + sd));
            const bx = s.x + s.nx * s.w * 0.85 * sd, by = s.y + s.ny * s.w * 0.85 * sd;
            x.globalAlpha = 0.8 * A;
            x.fillStyle = (i >> 1) % 2 ? C.main : C.light;
            x.beginPath();
            x.moveTo(bx + s.tx * 2.2, by + s.ty * 2.2);
            x.lineTo(bx + s.nx * sd * len - s.tx * len * 0.9, by + s.ny * sd * len - s.ty * len * 0.9);
            x.lineTo(bx - s.tx * 2.2, by - s.ty * 2.2);
            x.closePath(); x.fill();
          }
        }
      }
      x.globalAlpha = 0.95 * A; x.fillStyle = C.light; band(x, S, 0.6);
      x.fillStyle = C.core; band(x, S, 0.26);
      if (C.rim) { x.strokeStyle = C.rim; x.lineWidth = 0.9; x.globalAlpha = 0.8 * A; edgeLine(x, S, 1.02); edgeLine(x, S, -1.02); }
    } else if (st === 'ink') {
      // さやの 黒い 一撃（ふちが 白く ひかる）
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.5 * A; x.fillStyle = C.glow; band(x, S, 1.5);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.95 * A; x.fillStyle = C.dark; band(x, S, 1.1);
      x.fillStyle = C.main; band(x, S, 0.8);
      x.strokeStyle = C.core; x.lineWidth = 1; x.globalAlpha = A;
      edgeLine(x, S, 1.08 * side);
      x.strokeStyle = C.light; x.lineWidth = 0.6; edgeLine(x, S, 0.3 * side);
    } else if (st === 'wind' || st === 'cold') {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.22 * A; x.fillStyle = C.main; band(x, S, 1.1);
      x.strokeStyle = C.light; x.lineWidth = 0.9;
      for (const [o, al] of [[-0.85, 0.5], [-0.35, 0.9], [0.15, 0.7], [0.65, 0.9], [1.0, 0.4]]) { x.globalAlpha = al * A; edgeLine(x, S, o); }
      x.globalAlpha = A; x.fillStyle = C.core; band(x, S, 0.12, 0.3);
    } else {
      // blade: 光の 太刀すじ
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.4 * A; x.fillStyle = C.glow; band(x, S, 1.45);
      x.globalAlpha = 0.9 * A; x.fillStyle = C.main; band(x, S, 0.85);
      x.globalAlpha = A; x.fillStyle = C.core; band(x, S, 0.38);
    }
    // さきっぽの ひかり
    if (age < p.draw + 60) {
      const h = S[S.length - 1];
      x.globalCompositeOperation = 'lighter';
      softGlow(x, h.x, h.y, p.w * 2.4, C.glow, 0.9 * A);
    }
    if (p.curl && st === 'water') {
      // 波の 先が くるりと まく（浮世絵の 大波の 先）
      const h = S[S.length - 1];
      const R = p.w * 1.25 * (age < p.draw ? 0.6 + 0.4 * (age / p.draw) : 1);
      const ex = h.x + h.nx * p.w * 0.7 * side, ey = h.y + h.ny * p.w * 0.7 * side;
      const nx = h.nx * side, ny = h.ny * side;
      const cx = ex + nx * R, cy = ey + ny * R;
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.95 * A;
      x.fillStyle = C.dark;
      x.beginPath(); x.arc(cx, cy, R * 1.05, 0, TAU); x.fill();
      x.fillStyle = C.main;
      x.beginPath(); x.arc(cx, cy, R * 0.82, 0, TAU); x.fill();
      x.strokeStyle = C.light; x.lineWidth = 0.8;
      x.beginPath(); x.arc(cx, cy, R * 0.5, 0, TAU); x.stroke();
      x.strokeStyle = C.core; x.lineWidth = 1.5; x.globalAlpha = A;
      claw(x, ex, ey, nx, ny, -h.tx, -h.ty, R);
      // しぶきの ゆび
      x.lineWidth = 1;
      for (let j = 0; j < 4; j++) {
        const a = Math.atan2(ny, nx) + Math.PI + (j - 1.5) * 0.45 + Math.sin(age / 80 + j) * 0.08;
        const fx0 = cx + Math.cos(a) * R * 1.05, fy0 = cy + Math.sin(a) * R * 1.05;
        claw(x, fx0, fy0, Math.cos(a), Math.sin(a), -h.tx, -h.ty, R * 0.35);
      }
    }
    x.restore();
  },
  // 竜（・虎）。道を あたまが すすみ、からだが ついていく
  g3Dragon(x, p) {
    const age = p.age;
    const L = p.L;
    const pr = clamp01(age / Math.max(1, p.travel));
    const e = p.ease === 'lin' ? pr : p.ease === 'in' ? pr * pr : easeInOut(pr);
    const hd = L * e;
    const fade = Math.min(clamp01(age / 90), age > p.life - p.fout ? clamp01((p.life - age) / p.fout) : 1);
    if (fade <= 0) return;
    const C = styleOf(p.style);
    const A = (p.alpha ?? 1) * fade;
    const S = [];
    const bl = p.body;
    const grow = p.grow ? lerp(p.grow, 1, e) : 1;
    const W = p.w * grow;
    for (let d = hd; ; d -= 3) {
      if (d < Math.max(0, hd - bl)) d = Math.max(0, hd - bl);
      const u = (hd - d) / bl;
      const q = at(p, d);
      const nx = -Math.sin(q.a), ny = Math.cos(q.a);
      const wv = p.amp * Math.sin(((hd - d) / p.wl) * TAU - age / 70 + p.seed) * clamp01(u * 4);
      let th = W * Math.pow(Math.max(0, 1 - u), 0.75) * (u < 0.14 ? 0.72 + 0.28 * (u / 0.14) : 1);
      S.push({ x: q.x + nx * wv, y: q.y + ny * wv, nx, ny, w: Math.max(0.3, th), tx: Math.cos(q.a), ty: Math.sin(q.a), u });
      if (d <= Math.max(0, hd - bl)) break;
    }
    x.save();
    x.lineJoin = 'round';
    x.lineCap = 'round';
    if (S.length >= 2) {
      const st = p.style;
      const glowy = st === 'flame' || st === 'sun' || st === 'gold' || st === 'wind' || st === 'cold';
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.35 * A; x.fillStyle = C.glow; band(x, S, 1.6);
      // せなかの とげ（ほのお・しぶき・ひれ）
      const fk = Math.floor(age / 60);
      for (let i = 2; i < S.length - 1; i += 2) {
        const s = S[i];
        const len = s.w * (st === 'flame' || st === 'sun' ? 0.9 + 0.9 * hash(fk + i * 3.3) : 0.75);
        const bx = s.x + s.nx * s.w * 0.8, by = s.y + s.ny * s.w * 0.8;
        x.globalCompositeOperation = glowy ? 'lighter' : 'source-over';
        x.globalAlpha = 0.9 * A;
        x.fillStyle = (i >> 1) % 2 ? C.light : C.main;
        x.beginPath();
        x.moveTo(bx - s.tx * 2.5, by - s.ty * 2.5);
        x.lineTo(bx + s.nx * len + s.tx * len * 0.8, by + s.ny * len + s.ty * len * 0.8);
        x.lineTo(bx + s.tx * 2.5, by + s.ty * 2.5);
        x.closePath(); x.fill();
        if (st === 'flame' || st === 'sun') {
          const bx2 = s.x - s.nx * s.w * 0.8, by2 = s.y - s.ny * s.w * 0.8, len2 = len * 0.7;
          x.beginPath(); x.moveTo(bx2 - s.tx * 2, by2 - s.ty * 2); x.lineTo(bx2 - s.nx * len2 + s.tx * len2, by2 - s.ny * len2 + s.ty * len2); x.lineTo(bx2 + s.tx * 2, by2 + s.ty * 2); x.closePath(); x.fill();
        }
      }
      x.globalCompositeOperation = glowy ? 'lighter' : 'source-over';
      x.globalAlpha = (glowy ? 0.8 : 0.95) * A;
      x.fillStyle = C.dark; band(x, S, 1.15);
      x.fillStyle = C.main; band(x, S, 0.95);
      // おなか
      x.fillStyle = C.light; x.globalAlpha = 0.85 * A; band(x, S, 0.28, -0.55);
      // うろこ
      x.strokeStyle = st === 'water' ? C.core : C.light; x.lineWidth = 0.7; x.globalAlpha = 0.75 * A;
      x.beginPath();
      for (let i = 1; i < S.length - 1; i += 2) {
        const s = S[i];
        if (s.w < 2) continue;
        const cx2 = s.x + s.nx * s.w * 0.2, cy2 = s.y + s.ny * s.w * 0.2;
        const r = s.w * 0.35;
        x.moveTo(cx2 + s.nx * r - s.tx * r, cy2 + s.ny * r - s.ty * r);
        x.lineTo(cx2 + s.tx * r * 0.6, cy2 + s.ty * r * 0.6);
        x.lineTo(cx2 - s.nx * r - s.tx * r, cy2 - s.ny * r - s.ty * r);
      }
      x.stroke();
      if (st === 'water') {
        // しぶきの ふち
        x.strokeStyle = C.core; x.lineWidth = 1; x.globalAlpha = A;
        edgeLine(x, S, 1.0);
        for (let i = 4; i < S.length - 2; i += 4) { const s = S[i]; claw(x, s.x + s.nx * s.w, s.y + s.ny * s.w, s.nx, s.ny, s.tx, s.ty, Math.min(4, s.w * 0.6)); }
      }
      if (glowy) { x.globalCompositeOperation = 'lighter'; x.fillStyle = C.core; x.globalAlpha = 0.8 * A; band(x, S, 0.22); }
    }
    // あたま
    const h = S[0] || { x: p.x, y: p.y, tx: 1, ty: 0 };
    const ang = Math.atan2(h.ty, h.tx) + Math.sin(age / 110 + p.seed) * 0.08;
    const open = age < p.travel ? 0.6 + 0.4 * Math.sin(age / 90) * 0.5 + 0.2 : Math.max(0.05, 0.8 - (age - p.travel) / 70);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, h.x, h.y, W * 3.2 * (p.hs || 1), C.glow, 0.7 * A);
    x.globalCompositeOperation = 'source-over';
    dragonHead(x, h.x, h.y, ang, W * 1.25 * (p.hs || 1), C, open, age, p.head || 'dragon', A);
    x.restore();
  },
  // 神速の 太刀すじ（まっすぐ。のびる → のこる → ひかる → きえる）
  g3Line(x, p) {
    const age = p.age;
    const e = easeOut(clamp01(age / Math.max(1, p.draw)));
    const tu = clamp01((age - p.draw - p.hold) / Math.max(1, p.life - p.draw - p.hold));
    if (tu >= 1 || e <= 0) return;
    const fl = p.flare >= 0 ? Math.exp(-Math.pow((age - p.flare) / 55, 2)) : 0;
    const tail = p.keepTail ? 0 : easeIn(tu);
    const hx = lerp(p.x0, p.x1, e), hy = lerp(p.y0, p.y1, e);
    const tx = lerp(p.x0, p.x1, tail * e), ty = lerp(p.y0, p.y1, tail * e);
    const dx = hx - tx, dy = hy - ty, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const mx = tx + dx * 0.6, my = ty + dy * 0.6;
    const A = (p.alpha ?? 1) * (p.keepTail ? 1 - tu : 1);
    const w = p.w * (1 + 1.6 * fl) * (1 - 0.5 * tu);
    const dia = (k) => { x.beginPath(); x.moveTo(tx, ty); x.lineTo(mx + nx * w * k, my + ny * w * k); x.lineTo(hx, hy); x.lineTo(mx - nx * w * k, my - ny * w * k); x.closePath(); x.fill(); };
    x.save();
    x.globalCompositeOperation = p.dark ? 'source-over' : 'lighter';
    x.globalAlpha = 0.4 * A; x.fillStyle = p.glow; dia(2.6);
    x.globalAlpha = 0.95 * A; x.fillStyle = p.color; dia(1);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = A; x.fillStyle = p.core; dia(0.38);
    if (fl > 0.05) softGlow(x, mx, my, L * 0.35 * fl + 4, p.glow, fl * A);
    if (age < p.draw + 40) softGlow(x, hx, hy, w * 4 + 4, p.glow, A);
    if (p.tip && age < p.draw + p.hold * 0.6) {
      const C = styleOf(p.tip);
      dragonHead(x, hx, hy, Math.atan2(p.y1 - p.y0, p.x1 - p.x0), p.tipS || 4, C, 0.7, age, 'dragon', A * clamp01(1 - (age - p.draw) / Math.max(1, p.hold * 0.6)));
    }
    x.restore();
  },
  // 竜巻（つみかさねた わ。path が あれば うごく）
  g3Tornado(x, p) {
    const age = p.age;
    const rise = easeOut(clamp01(age / Math.max(1, p.rise)));
    const fade = age > p.life - p.fout ? clamp01((p.life - age) / p.fout) : 1;
    if (fade <= 0 || rise <= 0) return;
    let bx = p.x, by = p.y;
    if (p.x1 !== undefined) {
      const m = easeInOut(clamp01((age - (p.moveAt || 0)) / Math.max(1, p.travel)));
      bx = lerp(p.x, p.x1, m); by = lerp(p.y, p.y1, m) - Math.sin(m * Math.PI) * (p.hop || 0);
    }
    const H = p.h * rise;
    const N = p.rings || 10;
    const A = (p.alpha ?? 1) * fade;
    const C = styleOf(p.style || 'wind');
    const spin = (age / 1000) * TAU * (p.spin || 2.4);
    x.save();
    x.globalCompositeOperation = 'lighter';
    // うすい からだ
    x.globalAlpha = 0.18 * A;
    x.fillStyle = C.main;
    x.beginPath();
    for (let i = 0; i <= N; i++) { const u = i / N, r = lerp(p.r0, p.r1, Math.pow(u, 1.3)), sw = Math.sin(u * 3 - age / 160) * r * 0.25; x.lineTo(bx + sw + r, by - H * u); }
    for (let i = N; i >= 0; i--) { const u = i / N, r = lerp(p.r0, p.r1, Math.pow(u, 1.3)), sw = Math.sin(u * 3 - age / 160) * r * 0.25; x.lineTo(bx + sw - r, by - H * u); }
    x.closePath(); x.fill();
    // まわる わ
    for (let i = 0; i <= N; i++) {
      const u = i / N, r = lerp(p.r0, p.r1, Math.pow(u, 1.3)), sw = Math.sin(u * 3 - age / 160) * r * 0.25;
      const cy = by - H * u, cx = bx + sw;
      const a0 = spin + i * 0.9;
      x.strokeStyle = i % 3 === 0 ? C.light : C.main;
      x.lineWidth = Math.max(0.6, (p.lw || 1.4) * (0.6 + u * 0.8));
      x.globalAlpha = 0.85 * A;
      x.beginPath(); x.ellipse(cx, cy, r, r * 0.28, 0, a0, a0 + Math.PI * 1.15); x.stroke();
      x.globalAlpha = 0.35 * A;
      x.beginPath(); x.ellipse(cx, cy, r * 0.8, r * 0.22, 0, a0 + Math.PI * 1.3, a0 + Math.PI * 1.9); x.stroke();
    }
    // 木の葉・ちり・枯れ葉
    if (p.leaves) {
      x.globalCompositeOperation = 'source-over';
      for (let i = 0; i < p.leaves; i++) {
        const u = hash(i * 3.7 + p.seed);
        const r = lerp(p.r0, p.r1, Math.pow(u, 1.3)) * (0.7 + 0.3 * hash(i));
        const a = spin * 1.3 + i * 2.1;
        const lx = bx + Math.cos(a) * r, ly = by - H * u + Math.sin(a) * r * 0.28;
        x.globalAlpha = A * (Math.sin(a) > -0.3 ? 1 : 0.5);
        x.fillStyle = p.leafCols ? p.leafCols[i % p.leafCols.length] : (i % 2 ? '#6ab040' : '#c8a040');
        x.save(); x.translate(lx, ly); x.rotate(a * 2);
        x.beginPath(); x.ellipse(0, 0, 1.8, 0.8, 0, 0, TAU); x.fill();
        x.restore();
      }
    }
    softGlow(x, bx, by - H * 0.5, p.r1 * 1.3, C.glow, 0.25 * A);
    x.restore();
  },
  // 日輪
  g3Sun(x, p) {
    const age = p.age;
    const g = easeOut(clamp01(age / Math.max(1, p.grow)));
    const fade = age > p.life - p.fout ? clamp01((p.life - age) / p.fout) : 1;
    const burst = p.burst >= 0 && age > p.burst ? easeOut(clamp01((age - p.burst) / 260)) : 0;
    if (fade <= 0 || g <= 0) return;
    const r = p.r * g * (1 + burst * 0.6);
    const A = (p.alpha ?? 1) * fade;
    const rot = age / 1000 * (p.spin ?? 1);
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, p.sy || 1);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, r * 2.6, '#ff6a1a', 0.7 * A);
    // ひかりの すじ
    x.fillStyle = '#ffb040';
    const nr = p.rays ?? 12;
    for (let i = 0; i < nr; i++) {
      const a = rot * 0.5 + (i / nr) * TAU;
      const len = r * (1.9 + 0.5 * Math.sin(age / 120 + i * 1.7));
      x.globalAlpha = 0.35 * A;
      x.beginPath(); x.moveTo(Math.cos(a - 0.08) * r, Math.sin(a - 0.08) * r); x.lineTo(Math.cos(a) * len, Math.sin(a) * len); x.lineTo(Math.cos(a + 0.08) * r, Math.sin(a + 0.08) * r); x.closePath(); x.fill();
    }
    // ほのおの した（まわる）
    const fk = Math.floor(age / 50);
    const nt = 22;
    for (let i = 0; i < nt; i++) {
      const a = rot + (i / nt) * TAU;
      const len = r * (0.25 + 0.35 * hash(fk + i * 5.3));
      x.globalAlpha = 0.85 * A;
      x.fillStyle = i % 2 ? '#ff4a14' : '#ffa020';
      const ca = Math.cos(a), sa = Math.sin(a);
      x.beginPath();
      x.moveTo(Math.cos(a - 0.16) * r * 0.95, Math.sin(a - 0.16) * r * 0.95);
      x.lineTo(ca * (r + len) - sa * len * 0.5, sa * (r + len) + ca * len * 0.5);
      x.lineTo(Math.cos(a + 0.16) * r * 0.95, Math.sin(a + 0.16) * r * 0.95);
      x.closePath(); x.fill();
    }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = A * (1 - burst);
    disc(x, 0, 0, r, '#b00818');
    disc(x, 0, 0, r * 0.88, '#e8201a');
    x.globalCompositeOperation = 'lighter';
    disc(x, 0, 0, r * 0.62, '#ff6a1a');
    disc(x, 0, 0, r * 0.36, '#ffd060');
    disc(x, 0, 0, r * 0.16, '#fff8d0');
    x.strokeStyle = '#ffd23a'; x.lineWidth = Math.max(0.8, r * 0.07);
    x.globalAlpha = A;
    x.beginPath(); x.arc(0, 0, r * 1.02, 0, TAU); x.stroke();
    if (p.ring !== false) { x.lineWidth = Math.max(0.5, r * 0.03); x.beginPath(); x.arc(0, 0, r * 0.75, 0, TAU); x.stroke(); }
    if (burst > 0) { x.globalAlpha = A * (1 - burst); softGlow(x, 0, 0, r * 2, '#ffffff', 1 - burst); }
    x.restore();
  },
  // 火車（たてに まわる ほのおの 車輪。x0,y0 → x1,y1 へ とぶ）
  g3Wheel(x, p) {
    const age = p.age;
    const m = clamp01(age / Math.max(1, p.travel));
    const k = easeInOut(m);
    const fade = Math.min(clamp01(age / 80), age > p.life - p.fout ? clamp01((p.life - age) / p.fout) : 1);
    if (fade <= 0) return;
    const C = styleOf(p.style || 'sun');
    const pos = (kk) => [lerp(p.x0, p.x1, kk), lerp(p.y0, p.y1, kk) - Math.sin(kk * Math.PI) * (p.hop || 0)];
    const [cx, cy] = pos(k);
    const r = p.r * (0.6 + 0.4 * clamp01(age / 160));
    const rot = (age / 1000) * TAU * (p.spin || 2.5) * (p.dir || 1);
    const A = (p.alpha ?? 1) * fade;
    x.save();
    x.globalCompositeOperation = 'lighter';
    // ざんぞう
    for (let g = 2; g >= 1; g--) {
      const [gx, gy] = pos(Math.max(0, k - g * 0.07));
      x.globalAlpha = 0.22 * A / g; x.strokeStyle = C.main; x.lineWidth = r * 0.3;
      x.beginPath(); x.arc(gx, gy, r, 0, TAU); x.stroke();
    }
    softGlow(x, cx, cy, r * 2, C.glow, 0.7 * A);
    for (const [col, lw, al] of [[C.dark, 0.42, 0.6], [C.main, 0.26, 0.9], [C.light, 0.13, 1], [C.core, 0.05, 1]]) {
      x.strokeStyle = col; x.lineWidth = Math.max(0.5, r * lw); x.globalAlpha = al * A;
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
    }
    const fk = Math.floor(age / 45);
    const n = 16, sg = p.dir || 1;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      const ca = Math.cos(a), sa = Math.sin(a);
      const len = r * (0.35 + 0.45 * hash(fk + i * 3.7));
      const bx = cx + ca * r, by = cy + sa * r;
      x.globalAlpha = 0.85 * A;
      x.fillStyle = i % 2 ? C.main : C.light;
      x.beginPath();
      x.moveTo(bx - sa * 2 * sg, by + ca * 2 * sg);
      x.lineTo(bx + ca * len * 0.6 + sa * len * sg, by + sa * len * 0.6 - ca * len * sg);
      x.lineTo(bx + ca * 1.5, by + sa * 1.5);
      x.closePath(); x.fill();
    }
    if (C.rim) { x.strokeStyle = C.rim; x.lineWidth = 0.9; x.globalAlpha = A; x.beginPath(); x.arc(cx, cy, r * 1.18, 0, TAU); x.stroke(); }
    x.strokeStyle = C.light; x.lineWidth = 0.8; x.globalAlpha = 0.35 * A;
    x.beginPath();
    for (let i = 0; i < 3; i++) { const a = rot * 0.8 + (i / 3) * Math.PI; x.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); x.lineTo(cx - Math.cos(a) * r, cy - Math.sin(a) * r); }
    x.stroke();
    x.restore();
  },
  // 全画面の 背景（えんしゅつの いちばん 下）
  g3Bg(x, p, t, fx) {
    const W = fx?.W || W0, H = fx?.H || H0;
    let env = p.age < p.fin ? p.age / Math.max(1, p.fin) : 1;
    if (p.age > p.life - p.fout) env *= clamp01((p.life - p.age) / Math.max(1, p.fout));
    if (env <= 0) return;
    const B = BG[p.v] || BG.night;
    const A = (p.a ?? 0.7) * env;
    const hor = p.hor ?? 62;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const nb = 14;
    for (let i = 0; i < nb; i++) {
      const y0 = (i / nb) * hor, y1 = ((i + 1) / nb) * hor;
      x.globalAlpha = A * (p.v === 'white' ? 0.55 : lerp(0.95, 0.72, i / nb));
      x.fillStyle = bandColor(B.sky, i / (nb - 1));
      x.fillRect(-8, y0 - 0.5, W + 16, y1 - y0 + 1);
    }
    x.globalAlpha = A * (p.v === 'white' ? 0.5 : 0.6);
    x.fillStyle = B.lo;
    x.fillRect(-8, hor, W + 16, H - hor + 8);
    const v = p.v;
    if (v === 'night' || v === 'lantern') {
      // ほし
      x.fillStyle = '#ffffff';
      for (let i = 0; i < 26; i++) {
        const sx = hash(i * 7.1 + 1) * W, sy = hash(i * 3.3 + 2) * hor * 0.8;
        x.globalAlpha = A * (0.4 + 0.6 * Math.abs(Math.sin(p.age / 300 + i)));
        x.fillRect(sx, sy, 0.8, 0.8);
      }
      if (v === 'night') {
        const mx = p.mx ?? W * 0.78, my = p.my ?? 24, mr = p.mr ?? 13;
        x.globalCompositeOperation = 'lighter';
        softGlow(x, mx, my, mr * 3.2, '#bcd4ff', 0.6 * A);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = A;
        disc(x, mx, my, mr, '#fff6dc');
        x.globalAlpha = A * 0.25;
        disc(x, mx - mr * 0.3, my - mr * 0.2, mr * 0.22, '#c8b890');
        disc(x, mx + mr * 0.35, my + mr * 0.25, mr * 0.16, '#c8b890');
        if (p.cloud) {
          x.globalAlpha = A * 0.55; x.fillStyle = '#1a2240';
          const cx = mx - 10 + (p.age / 40) % 30;
          x.beginPath(); x.ellipse(cx, my + mr * 0.5, mr * 1.6, mr * 0.28, 0, 0, TAU); x.fill();
        }
        // とおくの 山
        x.globalAlpha = A * 0.8; x.fillStyle = '#060814';
        x.beginPath(); x.moveTo(-8, hor);
        for (let i = 0; i <= 16; i++) x.lineTo((i / 16) * (W + 16) - 8, hor - 6 - hash(i * 2.3) * 9);
        x.lineTo(W + 8, hor); x.closePath(); x.fill();
      } else {
        // ちょうちんの 列
        x.strokeStyle = '#2a1a10'; x.lineWidth = 0.6; x.globalAlpha = A;
        x.beginPath(); x.moveTo(-8, 6); x.quadraticCurveTo(W / 2, 20, W + 8, 6); x.stroke();
        for (let i = 0; i < 7; i++) {
          const lx = 14 + i * ((W - 28) / 6), ly = 6 + Math.sin((lx / W) * Math.PI) * 7 + 9;
          x.save(); x.translate(lx, ly); x.rotate(Math.sin(p.age / 300 + i) * 0.1); x.globalAlpha = A;
          PROP.lantern(x, { age: p.age, seed: i });
          x.restore();
        }
        // やねの かげ
        x.globalAlpha = A * 0.85; x.fillStyle = '#05030a';
        x.beginPath(); x.moveTo(-8, hor);
        for (let i = 0; i <= 8; i++) { const bx = (i / 8) * (W + 16) - 8; x.lineTo(bx, hor - 10 - (i % 2) * 6); x.lineTo(bx + 16, hor - 16 - (i % 2) * 6); }
        x.lineTo(W + 8, hor); x.closePath(); x.fill();
      }
    } else if (v === 'dawn') {
      // 夜明けの 赤い 日輪
      const sx = p.mx ?? W / 2, sy = p.my ?? hor - 2, sr = p.mr ?? 26;
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = '#ff7a2a';
      for (let i = 0; i < 16; i++) {
        const a = Math.PI + (i / 15) * Math.PI + Math.sin(p.age / 500) * 0.04;
        x.globalAlpha = A * 0.22;
        x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a - 0.05) * 200, sy + Math.sin(a - 0.05) * 200); x.lineTo(sx + Math.cos(a + 0.05) * 200, sy + Math.sin(a + 0.05) * 200); x.closePath(); x.fill();
      }
      softGlow(x, sx, sy, sr * 3, '#ff6a1a', 0.8 * A);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = A;
      x.save(); x.beginPath(); x.rect(-8, -8, W + 16, sy + 8); x.clip();
      disc(x, sx, sy, sr, '#e8201a'); disc(x, sx, sy, sr * 0.8, '#ff4a1a');
      x.restore();
      x.globalAlpha = A * 0.8; x.fillStyle = '#1a0204';
      x.beginPath(); x.moveTo(-8, hor);
      for (let i = 0; i <= 12; i++) x.lineTo((i / 12) * (W + 16) - 8, hor - 4 - hash(i * 5.1) * 7);
      x.lineTo(W + 8, hor); x.closePath(); x.fill();
    } else if (v === 'sea') {
      const sx = p.mx ?? W * 0.3, sy = hor - 4;
      x.globalCompositeOperation = 'lighter';
      softGlow(x, sx, sy, 40, '#ffb040', 0.8 * A);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = A; disc(x, sx, sy, 12, '#ffe080');
      // うみ と すなはま
      x.globalAlpha = A * 0.75; x.fillStyle = '#2a4a8a'; x.fillRect(-8, hor, W + 16, 26);
      x.fillStyle = '#ffd890';
      for (let i = 0; i < 8; i++) { x.globalAlpha = A * 0.7; x.fillRect(sx - 14 + Math.sin(p.age / 200 + i) * 3, hor + 2 + i * 3, 28 - i * 2.5, 0.8); }
      x.globalAlpha = A * 0.6; x.fillStyle = '#e8c890'; x.fillRect(-8, hor + 26, W + 16, H);
      x.strokeStyle = '#ffffff'; x.lineWidth = 0.8; x.globalAlpha = A * 0.8;
      x.beginPath();
      for (let i = 0; i <= 32; i++) { const bx = (i / 32) * (W + 16) - 8; x.lineTo(bx, hor + 26 + Math.sin(i * 0.9 + p.age / 140) * 1.5); }
      x.stroke();
    } else if (v === 'flame') {
      x.globalCompositeOperation = 'lighter';
      const fk = Math.floor(p.age / 60);
      for (let i = 0; i < 18; i++) {
        const bx = (i / 17) * (W + 16) - 8, hh = 22 + 30 * hash(fk + i * 3.3);
        x.globalAlpha = A * 0.7; x.fillStyle = i % 2 ? '#ff3a08' : '#ff7a14';
        x.beginPath(); x.moveTo(bx - 9, H + 4); x.quadraticCurveTo(bx - 6, H - hh * 0.5, bx + Math.sin(p.age / 90 + i) * 4, H - hh); x.quadraticCurveTo(bx + 6, H - hh * 0.5, bx + 9, H + 4); x.closePath(); x.fill();
      }
    } else if (v === 'white') {
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = '#ffffff'; x.lineWidth = 0.8;
      for (let i = 0; i < 4; i++) {
        const u = ((p.age / 900) + i / 4) % 1;
        x.globalAlpha = A * 0.4 * Math.sin(u * Math.PI);
        x.beginPath(); x.ellipse(p.mx ?? W / 2, p.my ?? H * 0.5, 20 + u * 150, (20 + u * 150) * 0.5, 0, 0, TAU); x.stroke();
      }
    } else if (v === 'ukiyo' || v === 'wind') {
      // 浮世絵の 波の もよう（青海波）
      x.strokeStyle = v === 'ukiyo' ? '#6ac8ff' : '#8ab8c0'; x.lineWidth = 0.7;
      for (let row = 0; row < 7; row++) {
        for (let col = -1; col < 18; col++) {
          const cx = col * 16 + (row % 2) * 8 + ((p.age / 40) % 16), cy = hor + 4 + row * 10;
          x.globalAlpha = A * 0.45;
          for (const rr of [7, 4.6, 2.2]) { x.beginPath(); x.arc(cx, cy, rr, Math.PI, TAU); x.stroke(); }
        }
      }
    }
    x.restore();
  },
  // 小道具（p.prop）。うごきは Effects（vx・vy・g）か fly（x1,y1・travel・hop）
  g3Prop(x, p) {
    const age = p.age;
    const fn = PROP[p.prop];
    if (!fn) return;
    const pop = p.pop === false ? 1 : easeOut(clamp01(age / 140));
    const fade = age > p.life - p.fout ? clamp01((p.life - age) / Math.max(1, p.fout)) : 1;
    if (fade <= 0 || pop <= 0) return;
    let px = p.x, py = p.y;
    if (p.x1 !== undefined) {
      const m = clamp01((age - (p.moveAt || 0)) / Math.max(1, p.travel));
      const k = p.ease === 'in' ? m * m : p.ease === 'lin' ? m : easeInOut(m);
      px = lerp(p.x, p.x1, k); py = lerp(p.y, p.y1, k) - Math.sin(k * Math.PI) * (p.hop || 0);
    }
    x.save();
    x.translate(px, py);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, (p.glowR || 12) * (p.s || 1), p.glow, 0.7 * fade); }
    x.rotate((p.rot0 || 0) + (p.spin || 0) * age / 1000);
    const sc = (p.s || 1) * (0.4 + 0.6 * pop);
    if (p.flipX) x.scale(-1, 1);
    if (p.prop !== 'swordsman') x.scale(sc, sc);
    x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    x.globalAlpha = fade * (p.alpha ?? 1);
    fn(x, p.prop === 'swordsman' ? { ...p, s: sc } : p, age);
    x.restore();
  },
};

// ───────────── どうぐ（fx を さいしょに。へんじは あたる 時間 ms） ─────────────
// 帯。ctrl … 道の 点、o: { style, w, draw, hold, life, retract, side, curl, wob, flare, alpha, delay }
export function ribbon(fx, ctrl, o = {}) {
  const path = makePath(safePts(ctrl));
  const { style = 'blade', w = 6, draw = 180, hold = 160, life = draw + hold + 260, retract = 0.7, side = 1, curl = false, wob = 0, flare = -1, alpha = 1, delay = 0, both } = o;
  const last = ctrl[ctrl.length - 1];
  fx.add({ kind: 'g3Ribbon', x: clampX(last[0]), y: clampY(last[1]), ...path, style, w, draw, hold, life, retract, side, curl, wob, flare, alpha, delay, both, step: o.step, clawGap: o.clawGap, seed: Math.random() * 10 });
  return delay + draw;
}
// 竜。ctrl … あたまの 道、o: { style, w, body, travel, life, fout, amp, wl, head, hs, ease, grow, delay }
export function dragon(fx, ctrl, o = {}) {
  const path = makePath(safePts(ctrl));
  const { style = 'water', w = 6, body = 70, travel = 400, life = travel + 260, fout = 200, amp = 4, wl = 40, head = 'dragon', hs = 1, ease = 'io', grow = 0, alpha = 1, delay = 0 } = o;
  const last = ctrl[ctrl.length - 1];
  fx.add({ kind: 'g3Dragon', x: clampX(last[0]), y: clampY(last[1]), ...path, style, w, body, travel, life, fout, amp, wl, head, hs, ease, grow, alpha, delay, seed: Math.random() * 10 });
  return delay + travel;
}
// まっすぐな 太刀すじ
export function line(fx, x0, y0, x1, y1, o = {}) {
  const { w = 2, color = '#e8f4ff', glow = '#7ac8ff', core = '#ffffff', draw = 70, hold = 220, life = draw + hold + 200, flare = -1, delay = 0, tip = null, tipS = 4, alpha = 1, dark = false, keepTail = false } = o;
  fx.add({ kind: 'g3Line', x: clampX(x1), y: clampY(y1), x0: clampX(x0), y0: clampY(y0), x1: clampX(x1), y1: clampY(y1), w, color, glow, core, draw, hold, life, flare, delay, tip, tipS, alpha, dark, keepTail });
  return delay + draw;
}
export function tornado(fx, x, y, o = {}) {
  const { h = 60, r0 = 6, r1 = 26, rise = 260, life = 900, fout = 260, spin = 2.4, style = 'wind', leaves = 0, leafCols = null, rings = 10, lw = 1.4, alpha = 1, delay = 0 } = o;
  const p = { kind: 'g3Tornado', x: clampX(x), y: clampY(y), h, r0, r1, rise, life, fout, spin, style, leaves, leafCols, rings, lw, alpha, delay, seed: Math.random() * 10 };
  if (o.to) Object.assign(p, { x1: clampX(o.to.x), y1: clampY(o.to.y), travel: o.travel || 300, moveAt: o.moveAt || 0, hop: o.hop || 0 });
  fx.add(p);
  return delay + rise;
}
export function sun(fx, x, y, o = {}) {
  const { r = 16, grow = 220, life = 800, fout = 220, burst = -1, spin = 1, rays = 12, sy = 1, alpha = 1, delay = 0, ring = true } = o;
  fx.add({ kind: 'g3Sun', x: clampX(x), y: clampY(y), r, grow, life, fout, burst, spin, rays, sy, alpha, delay, ring });
  return delay + grow;
}
// 火車の 車輪（x0,y0 → to）
export function wheel(fx, x0, y0, o = {}) {
  const { r = 12, travel = 300, hop = 20, spin = 2.5, dir = 1, style = 'sun', life = travel + 200, fout = 160, alpha = 1, delay = 0 } = o;
  const to = o.to || { x: x0, y: y0 };
  fx.add({ kind: 'g3Wheel', x: clampX(to.x), y: clampY(to.y), x0: clampX(x0), y0: clampY(y0), x1: clampX(to.x), y1: clampY(to.y), r, travel, hop, spin, dir, style, life, fout, alpha, delay });
  return delay + travel;
}
// 背景（v: night・dawn・sea・flame・lantern・white・ukiyo・wind）
export function bg(fx, v, o = {}) {
  const { a = 0.7, life = 1000, fin = 160, fout = 260, delay = 0, hor = 62, mx, my, mr, cloud = false } = o;
  fx.add({ kind: 'g3Bg', x: 0, y: 0, v, a, life, fin, fout, delay, hor, mx, my, mr, cloud });
  return delay;
}
// 小道具（name は PROP の なまえ）
export function prop(fx, name, x, y, o = {}) {
  const { life = 700, fout = 180, delay = 0, s = 1, spin = 0, rot0 = 0 } = o;
  const p = { ...o, kind: 'g3Prop', prop: name, x: clampX(x), y: clampY(y), life, fout, delay, s, spin, rot0 };
  if (o.to) Object.assign(p, { x1: clampX(o.to.x), y1: clampY(o.to.y), travel: o.travel || 300 });
  delete p.to;
  fx.add(p);
  return delay;
}
// 画面の 文字（ひらがな・記号）
export function text(fx, str, x, y, o = {}) {
  return prop(fx, 'text', x, y, { text: str, ...o });
}
// ───────────── 時間と つぶの かずの まもり ─────────────
// fn の 中で 足す つぶ（あとで よばれる fx.at の 中も）は「はなって から limit ms」までに きえる（life を ちぢめる。fade は life で きまるので すっと きえる）
export function capLife(fx, limit, fn, off = 0) {
  const own = Object.prototype.hasOwnProperty.call(fx, 'add');
  const prev = fx.add;
  fx.add = function addCap(p) {
    if (!p) return prev.call(this, p);
    if (p.kind === 'call') {
      if (typeof p.fn === 'function' && !p.capWrapped) {
        const f = p.fn, at = off + (p.delay || 0);
        p = { ...p, capWrapped: true, fn: () => capLife(fx, limit, f, at) };
      }
    } else if (p.kind !== 'flash' && p.kind !== 'shake') {
      const room = limit - off - (p.delay || 0);
      if (room <= 24) return undefined;
      const life = p.life ?? 600;
      if (life > room) p = { ...p, life: room };
    }
    return prev.call(this, p);
  };
  try {
    return fn();
  } finally {
    if (own) fx.add = prev;
    else delete fx.add;
  }
}
// 的の かずで つぶを わける（1体 … n、3体 … n/2 ずつ、5体 … n×0.3 ずつ）
export const per = (c, n) => Math.max(2, Math.round(n * Math.min(1, 1.5 / Math.max(1, c.n))));
// あたった ひかり（つぶの かずを きめられる）
export function hitBurst(fx, x, y, o = {}) {
  const { r = 14, glow = '#ffd66b', colors = ['#ffffff', glow], n = 14, delay = 0, heavy = false, rings = 1, speed = 150, life = 380, star = true } = o;
  fx.glow(x, y, { color: glow, r: r * 2.2, delay, life: 300, alpha: 0.9 });
  fx.impact(x, y, { r, color: '#ffffff', delay });
  if (star) fx.star(x, y, glow, r * 0.9, delay + 20, 220);
  for (let k = 0; k < rings; k++) fx.shock(x, y, { r0: r * 0.3, r1: r * (2.6 + k * 0.9), color: k % 2 ? colors[0] : glow, w: heavy ? 2.6 : 1.8, delay: delay + 10 + k * 70, life: 340 });
  fx.sparks(x, y, { colors, n, speed, delay, life, len: 7 });
  if (heavy) fx.hitStop(160, delay, 1.8);
  return delay;
}
// 大きな 爆発（みじかい けむり）
export function blast(fx, x, y, o = {}) {
  const { r = 22, glow = '#ffa040', core = '#ffffff', colors = ['#ffffff', glow], n = 20, delay = 0, heavy = true, smoke = '#4a4040', puffs = 3, flash = true } = o;
  fx.glow(x, y, { color: glow, r: r * 2.6, delay, life: 460, alpha: 1 });
  fx.impact(x, y, { r: r * 1.1, color: core, delay });
  fx.shock(x, y, { r0: r * 0.3, r1: r * 3, color: glow, w: 2.6, delay, life: 400 });
  fx.shock(x, y, { r0: r * 0.3, r1: r * 2.3, color: core, w: 2, delay: delay + 90, life: 380 });
  fx.sparks(x, y, { colors, n, speed: 210, delay, life: 460, len: 8, size: 1.2 });
  for (let i = 0; i < puffs; i++) fx.puff(x + rnd(-r, r) * 0.6, y + rnd(-r, r) * 0.4, { color: smoke, r0: 3, r1: r * 0.8, vx: rnd(-30, 30), vy: rnd(-40, -10), life: 440, alpha: 0.45, delay: delay + 60 });
  if (heavy) { if (flash) fx.flashAt(90, core, delay); fx.hitStop(220, delay, 2); }
  return delay;
}
// 水しぶき（しずくの かずを きめられる）
export function splashN(fx, x, y, o = {}) {
  const { n = 12, power = 1, delay = 0, cols = ['#2a78d8', '#6ac8ff', '#eaf8ff'], ring = true, life = 520 } = o;
  for (let i = 0; i < n; i++) fx.drop(x + rnd(-10, 10), y + rnd(-4, 4), { color: cols[i % cols.length], vx: rnd(-120, 120) * power, vy: rnd(-200, -60) * power, g: 380, size: rnd(1.1, 2.2), delay: delay + (i % 3) * 30, life });
  if (ring) fx.shock(x, y + 6, { r0: 4, r1: 36 * power, sy: 0.35, color: '#bfe6ff', w: 1.8, delay, life: 380 });
  return delay;
}
// きらめき（dur の あいだ ぽつぽつ。ring … 円の 上に ならべる）
export function glitter(fx, x, y, o = {}) {
  const { n = 12, colors = ['#ffffff', '#ffd23a'], spread = 30, sy = 0.6, dur = 400, delay = 0, life = 300, size = 3, ring = 0, vy = 0 } = o;
  for (let i = 0; i < n; i++) {
    let px, py;
    if (ring) { const a = (i / n) * Math.PI * 2; px = x + Math.cos(a) * ring; py = y + Math.sin(a) * ring * sy; } else { px = x + rnd(-spread, spread); py = y + rnd(-spread, spread) * sy; }
    fx.twinkle(px, py, { color: colors[i % colors.length], size: size * rnd(0.7, 1.3), delay: delay + (ring ? (i / n) * dur : rnd(0, dur)), life, vy });
  }
  return delay;
}
// あたった あとの 火花と きらめき（的の かずで わける）
export function rich(fx, c, t, delay, n, colors, o = {}) {
  const m = per(c, n);
  const a = Math.ceil(m * 0.5);
  fx.sparks(t.x, t.y, { colors, n: a, speed: o.speed || 170, delay, life: 420, len: 8 });
  glitter(fx, t.x, t.y + (o.dy || 0), { n: m - a, spread: o.spread || 28, colors, dur: o.dur || 500, delay: delay + 60, vy: o.vy || 0 });
  return delay;
}
// 水しぶきの 雨（上から ふる しずく）
export function rain(fx, x, y, o = {}) {
  const { n = 12, spread = 40, colors = ['#eaf8ff', '#6ac8ff', '#2a78d8'], delay = 0, life = 600 } = o;
  for (let i = 0; i < n; i++) fx.drop(x + rnd(-spread, spread), y - rnd(10, 40), { color: colors[i % colors.length], vx: rnd(-20, 20), vy: rnd(40, 120), g: 300, size: rnd(0.9, 1.6), delay: delay + rnd(0, 200), life });
  return delay;
}
// 火の粉（ふる・のぼる）
export function embers(fx, x, y, o = {}) {
  const { n = 12, spread = 30, colors = ['#ffd23a', '#ff8a2a', '#fff2a0'], up = true, delay = 0, life = 700 } = o;
  fx.sparks(x, y, { colors, n, speed: 50, ang: up ? -Math.PI / 2 : Math.PI / 2, spread: 1.2, g: up ? -60 : 50, drag: 0.97, delay, life, len: 3, size: 1 });
  if (spread > 0) for (let i = 0; i < Math.round(n / 3); i++) fx.twinkle(x + rnd(-spread, spread), y + rnd(-spread, spread) * 0.5, { color: colors[i % colors.length], size: rnd(1.5, 3), delay: delay + rnd(0, 200), life: 360, vy: up ? -20 : 20 });
  return delay;
}
