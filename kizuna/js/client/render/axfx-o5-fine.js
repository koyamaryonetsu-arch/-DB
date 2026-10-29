// 第49回 O5（家・学校・料理）: つぶの かきかた（AX_O5_FINE。なまえは o5 で はじめる）。この ファイルは O5 だけが さわる
// ・o5Obj … 家・学校・台所の 小物（ランドセル・おたま・包丁・中華なべ・ケーキ・スリッパ・ちゃぶ台…）を 1つの つぶで 大きく かく
// ・o5Text … カタカナの 擬音（ふきだし・ギザギザの 星つき）。o5Arrow … 上向き・下向きの 矢印。o5Line … のびる 線（白線・心電図・手を つなぐ 光）
// ・o5Steam … 湯気。o5Twister … 竜巻（炎・ジャージ）。o5Bg … 発射の あと 一しゅんの うすい 背景
// ・毎フレーム グラデーションを 作らない（softGlow の キャッシュ）。画面の 文字は カタカナ・ひらがな・記号だけ（漢字なし）
import { softGlow, clamp01, lerp, easeOut, easeIn, easeInOut, hash } from './axkit.js?v=99ee8fb62a40';

const TAU = Math.PI * 2;
const OUT = '#3a2414';
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

// ───────────── かく どうぐ（単位の 大きさ: だいたい -1〜1） ─────────────
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
function rrect(x, x0, y0, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  x.beginPath();
  x.moveTo(x0 + r, y0);
  x.lineTo(x0 + w - r, y0); x.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  x.lineTo(x0 + w, y0 + h - r); x.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  x.lineTo(x0 + r, y0 + h); x.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  x.lineTo(x0, y0 + r); x.quadraticCurveTo(x0, y0, x0 + r, y0);
  x.closePath();
}
function poly(x, pts, close = true) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
const edge = (x, e = OUT, lw = 0.08) => { if (!e) return; x.lineWidth = lw; x.strokeStyle = e; x.stroke(); };
const E = (x, cx, cy, rx, ry, col, e = OUT, lw = 0.08, rot = 0) => { ell(x, cx, cy, rx, ry, rot); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const R = (x, x0, y0, w, h, r, col, e = OUT, lw = 0.08) => { rrect(x, x0, y0, w, h, r); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const P = (x, pts, col, e = OUT, lw = 0.08) => { poly(x, pts); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const L = (x, pts, col, lw = 0.08) => { poly(x, pts, false); x.lineWidth = lw; x.strokeStyle = col; x.lineCap = 'round'; x.stroke(); };
const D = (x, cx, cy, r, col) => { ell(x, cx, cy, r, r); x.fillStyle = col; x.fill(); };
// 星の かたち
function starPts(n, r0, r1, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) { const an = rot + (i / (n * 2)) * TAU, r = i % 2 ? r1 : r0; out.push([Math.cos(an) * r, Math.sin(an) * r]); }
  return out;
}
// ふわふわの 雲（まるの あつまり）
function puffy(x, circles, fill, e = OUT, lw = 0.1) {
  x.fillStyle = e;
  for (const [cx, cy, r] of circles) { ell(x, cx, cy, r + lw, r + lw); x.fill(); }
  x.fillStyle = fill;
  for (const [cx, cy, r] of circles) { ell(x, cx, cy, r, r); x.fill(); }
}
// 手（gu・choki・pa）。col … はだの 色
function hand(x, kind, col, e = OUT) {
  if (kind === 'pa') {
    for (let i = 0; i < 4; i++) { const fx0 = -0.48 + i * 0.32; R(x, fx0 - 0.12, -1, 0.24, 0.8, 0.12, col, e); }
    R(x, -0.62, -0.4, 1.24, 1.15, 0.4, col, e);
    x.save(); x.translate(0.62, 0.05); x.rotate(-0.7); R(x, -0.12, -0.55, 0.24, 0.62, 0.12, col, e); x.restore();
    ell(x, 0, 0.15, 0.5, 0.4); x.fillStyle = col; x.fill();
    return;
  }
  if (kind === 'choki') {
    x.save(); x.rotate(-0.25); R(x, -0.3, -1.05, 0.26, 0.9, 0.13, col, e); x.restore();
    x.save(); x.rotate(0.25); R(x, 0.04, -1.05, 0.26, 0.9, 0.13, col, e); x.restore();
  }
  R(x, -0.66, -0.35, 1.32, 1.05, 0.45, col, e);
  if (kind === 'gu') for (let i = 0; i < 3; i++) L(x, [[-0.4 + i * 0.32, -0.33], [-0.4 + i * 0.32, -0.05]], e, 0.07);
  else L(x, [[-0.35, -0.2], [0.35, -0.2]], e, 0.06);
}
// 人の かげ（kid … 子ども、adult … 大人、okan … エプロンと おだんご）
function person(x, kind, col) {
  const kid = kind === 'kid';
  const hr = kid ? 0.36 : 0.3, hy = kid ? -0.55 : -0.68;
  if (kind === 'okan') { D(x, 0, hy - 0.34, 0.18, col); }
  D(x, 0, hy, hr, col);
  P(x, [[-0.38, hy + hr + 0.02], [0.38, hy + hr + 0.02], [0.55, 1], [-0.55, 1]], col, null);
  if (kind === 'okan') P(x, [[-0.25, hy + hr + 0.25], [0.25, hy + hr + 0.25], [0.35, 0.9], [-0.35, 0.9]], 'rgba(255,255,255,0.35)', null);
  if (kid) R(x, -0.62, hy + 0.45, 0.24, 0.5, 0.08, '#c8282e', null);
}

// ───────────── 小物（o5Obj の shape）。x.globalAlpha は かく 前に きまって いる ─────────────
const OBJ = {
  // ── 学校
  randoseru(x, p) {
    R(x, -0.85, -0.75, 1.7, 1.6, 0.4, '#e0282e');
    R(x, -0.85, -0.75, 1.7, 0.95, 0.4, '#b81822');
    R(x, -0.14, 0.08, 0.28, 0.24, 0.06, '#ffd23a');
    L(x, [[-0.6, -0.55], [-0.2, -0.62]], 'rgba(255,255,255,0.7)', 0.1);
    L(x, [[-0.7, 0.55], [0.7, 0.55]], '#ffd23a', 0.07);
  },
  book(x, p) {
    R(x, -0.7, -0.95, 1.4, 1.9, 0.1, p.color || '#3a7ae0');
    R(x, 0.45, -0.88, 0.18, 1.76, 0.03, '#fff8e8', null);
    R(x, -0.45, -0.6, 0.75, 0.3, 0.05, 'rgba(255,255,255,0.75)', null);
  },
  pencil(x, p) {
    R(x, -1.05, -0.18, 0.28, 0.36, 0.06, '#ff9ab0');
    R(x, -0.8, -0.2, 0.12, 0.4, 0.02, '#c8c8c8');
    P(x, [[-0.68, -0.2], [0.5, -0.2], [0.5, 0.2], [-0.68, 0.2]], p.color || '#ffd23a');
    P(x, [[0.5, -0.2], [1.02, 0], [0.5, 0.2]], '#f0c890');
    P(x, [[0.84, -0.06], [1.02, 0], [0.84, 0.06]], '#3a3a3a', null);
  },
  eraser(x, p) {
    R(x, -0.8, -0.4, 1.6, 0.8, 0.12, '#ffffff');
    R(x, -0.25, -0.42, 0.85, 0.84, 0.04, p.color || '#3a7ae0');
  },
  recorder(x, p) {
    R(x, -0.16, -1, 0.32, 2, 0.14, '#f4ecd0');
    R(x, -0.2, -1.05, 0.4, 0.42, 0.12, '#d8c8a0');
    R(x, -0.22, 0.75, 0.44, 0.3, 0.1, '#d8c8a0');
    for (let i = 0; i < 5; i++) D(x, 0, -0.4 + i * 0.23, 0.06, '#5a4020');
  },
  tray(x, p) {
    R(x, -1, -0.5, 2, 1.1, 0.18, '#9ad8a8');
    R(x, -0.88, -0.36, 0.7, 0.4, 0.18, '#e8a050');
    R(x, 0.3, -0.85, 0.42, 0.72, 0.06, '#ffffff');
    R(x, 0.3, -0.85, 0.42, 0.2, 0.04, '#3a8ae0');
    E(x, -0.25, 0.25, 0.42, 0.24, '#ffffff');
    E(x, -0.25, 0.22, 0.3, 0.14, '#c86a2a', null);
    E(x, 0.55, 0.25, 0.3, 0.2, '#ffffff');
    E(x, 0.55, 0.22, 0.2, 0.1, '#7ac850', null);
  },
  sun(x, p) {
    x.fillStyle = '#ffb020';
    for (let i = 0; i < 12; i++) { x.save(); x.rotate((i / 12) * TAU + p.age / 900); P(x, [[-0.13, -0.72], [0, -1.05], [0.13, -0.72]], '#ffb020', null); x.restore(); }
    E(x, 0, 0, 0.72, 0.72, '#ffd83a', '#e08a10', 0.08);
    D(x, -0.25, -0.12, 0.08, OUT); D(x, 0.25, -0.12, 0.08, OUT);
    x.beginPath(); x.arc(0, 0.05, 0.32, 0.2, Math.PI - 0.2); edge(x, OUT, 0.09);
    D(x, -0.45, 0.15, 0.1, '#ff8a8a'); D(x, 0.45, 0.15, 0.1, '#ff8a8a');
  },
  ball(x, p) {
    E(x, 0, 0, 1, 1, p.color || '#e8302a', '#7a1010', 0.09);
    x.beginPath(); x.arc(0, 0, 0.7, -2.6, -1.2); edge(x, 'rgba(255,255,255,0.8)', 0.12);
    L(x, [[-1, 0.1], [-0.3, 0.2], [0.3, 0.2], [1, 0.1]], 'rgba(90,10,10,0.6)', 0.06);
  },
  cloud(x, p) {
    puffy(x, [[-0.55, 0.05, 0.42], [0, -0.25, 0.55], [0.55, 0.05, 0.42], [0.2, 0.3, 0.4], [-0.25, 0.3, 0.4]], p.color || '#ffffff', p.edge || '#8a8ab0', 0.08);
  },
  rocket(x, p) {
    P(x, [[-0.32, 0.5], [-0.75, 0.95], [-0.32, 0.85]], '#e8302a');
    P(x, [[0.32, 0.5], [0.75, 0.95], [0.32, 0.85]], '#e8302a');
    P(x, [[-0.32, -0.4], [0, -1.05], [0.32, -0.4], [0.32, 0.85], [-0.32, 0.85]], '#f4f4ff');
    P(x, [[-0.32, -0.4], [0, -1.05], [0.32, -0.4]], '#e8302a');
    E(x, 0, -0.05, 0.17, 0.17, '#5ac8ff');
  },
  crown(x, p) {
    P(x, [[-0.9, 0.5], [-0.9, -0.5], [-0.45, 0], [0, -0.75], [0.45, 0], [0.9, -0.5], [0.9, 0.5]], '#ffd23a', '#a06a0a', 0.09);
    D(x, 0, 0.18, 0.13, '#e8302a'); D(x, -0.55, 0.22, 0.1, '#3a8ae0'); D(x, 0.55, 0.22, 0.1, '#3ac860');
  },
  shortcake(x, p) {
    P(x, [[-0.9, -0.1], [0.9, -0.5], [0.9, 0.7], [-0.9, 0.7]], '#fff4e0');
    L(x, [[-0.9, 0.3], [0.9, 0.1]], '#ff9ab0', 0.16);
    P(x, [[-0.9, -0.1], [0.9, -0.5], [0.9, -0.3], [-0.9, 0.08]], '#ffffff', null);
    E(x, 0.35, -0.55, 0.24, 0.22, '#e8202a'); P(x, [[0.2, -0.75], [0.35, -0.68], [0.5, -0.75], [0.35, -0.82]], '#3ab840', null);
  },
  radio(x, p) {
    L(x, [[0.5, -0.5], [0.8, -1.05]], '#9a9aa8', 0.08);
    R(x, -1, -0.55, 2, 1.25, 0.2, '#c8402a');
    E(x, -0.45, 0.08, 0.36, 0.36, '#3a2a20', '#ffd8a0', 0.06);
    for (let i = 0; i < 3; i++) L(x, [[-0.7, -0.15 + i * 0.18], [-0.2, -0.15 + i * 0.18]], '#8a6a50', 0.04);
    R(x, 0.15, -0.3, 0.7, 0.3, 0.05, '#fff6c0');
    D(x, 0.5, 0.35, 0.12, '#ffd23a');
  },
  gu(x, p) { hand(x, 'gu', p.color || '#ffd0a8'); },
  choki(x, p) { hand(x, 'choki', p.color || '#ffd0a8'); },
  pa(x, p) { hand(x, 'pa', p.color || '#ffd0a8', p.edge || OUT); },
  shuttle(x, p) {
    P(x, [[-0.15, 0.15], [-0.55, -0.95], [0.55, -0.95], [0.15, 0.15]], '#ffffff');
    for (let i = -2; i <= 2; i++) L(x, [[i * 0.05, 0.1], [i * 0.24, -0.9]], '#c8c8d8', 0.04);
    E(x, 0, 0.35, 0.28, 0.28, '#f0d8a8');
    L(x, [[-0.3, 0.12], [0.3, 0.12]], '#e8302a', 0.08);
  },
  racket(x, p) {
    R(x, -0.08, 0.2, 0.16, 0.85, 0.05, '#3a3a4a');
    E(x, 0, -0.42, 0.5, 0.62, 'rgba(255,255,255,0.25)', p.color || '#3a8ae0', 0.12);
    for (let i = -2; i <= 2; i++) { L(x, [[i * 0.17, -0.98], [i * 0.17, 0.14]], 'rgba(255,255,255,0.7)', 0.03); L(x, [[-0.48, -0.42 + i * 0.2], [0.48, -0.42 + i * 0.2]], 'rgba(255,255,255,0.7)', 0.03); }
    E(x, 0, -0.42, 0.5, 0.62, 'rgba(0,0,0,0)', p.color || '#3a8ae0', 0.12);
  },
  notebook(x, p) {
    R(x, -1, -0.65, 1, 1.3, 0.06, '#ffffff'); R(x, 0, -0.65, 1, 1.3, 0.06, '#ffffff');
    for (let i = 0; i < 5; i++) { L(x, [[-0.85, -0.4 + i * 0.22], [-0.12, -0.4 + i * 0.22]], '#9ac8ff', 0.04); L(x, [[0.12, -0.4 + i * 0.22], [0.85, -0.4 + i * 0.22]], '#9ac8ff', 0.04); }
    L(x, [[0, -0.65], [0, 0.65]], '#3a3a5a', 0.06);
  },
  door(x, p) {
    R(x, -0.6, -1, 1.2, 2, 0.06, '#a8703a');
    R(x, -0.42, -0.82, 0.84, 0.7, 0.04, '#8a5a2a'); R(x, -0.42, 0.05, 0.84, 0.75, 0.04, '#8a5a2a');
    D(x, 0.4, 0.05, 0.08, '#ffd23a');
  },
  bat(x, p) { P(x, [[-1, -0.07], [0.2, -0.13], [1, -0.18], [1, 0.18], [0.2, 0.13], [-1, 0.07]], '#d8a060'); R(x, -1.08, -0.1, 0.1, 0.2, 0.04, '#8a5a2a'); },
  baton(x, p) {
    R(x, -0.9, -0.22, 0.9, 0.44, 0.15, '#e8302a'); R(x, 0, -0.22, 0.9, 0.44, 0.15, '#ffffff');
  },
  whistle(x, p) {
    R(x, -0.8, -0.35, 1.1, 0.7, 0.3, '#d8dce8'); E(x, 0.35, 0.05, 0.45, 0.45, '#d8dce8'); D(x, 0.35, 0.05, 0.16, '#5a5a6a');
  },
  lantern(x, p) {
    R(x, -0.35, -1, 0.7, 0.18, 0.04, '#2a2a2a'); R(x, -0.35, 0.82, 0.7, 0.18, 0.04, '#2a2a2a');
    E(x, 0, 0, 0.7, 0.86, p.color || '#e8302a');
    for (let i = -2; i <= 2; i++) { ell(x, 0, i * 0.3, 0.68 * Math.sqrt(Math.max(0.05, 1 - (i * 0.3 / 0.86) ** 2)), 0.04); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fill(); }
  },
  balloon(x, p) { L(x, [[0, 0.75], [0.1, 1.05], [-0.05, 1.3]], '#ffffff', 0.05); E(x, 0, -0.1, 0.65, 0.82, p.color || '#ff5a8a'); E(x, -0.25, -0.4, 0.13, 0.2, 'rgba(255,255,255,0.7)', null); },
  pflower(x, p) {
    for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU; E(x, Math.cos(an) * 0.55, Math.sin(an) * 0.55, 0.42, 0.42, i % 2 ? (p.color || '#ff8ac8') : '#ffd0ec', p.color2 || '#d0508a', 0.05); }
    E(x, 0, 0, 0.35, 0.35, '#ffe060', '#d0a020', 0.05);
  },
  pillow(x, p) {
    P(x, [[-1, -0.6], [-0.6, -0.48], [0.6, -0.48], [1, -0.6], [0.88, 0], [1, 0.6], [0.6, 0.48], [-0.6, 0.48], [-1, 0.6], [-0.88, 0]], p.color || '#ffffff', '#8a8ab0', 0.08);
    L(x, [[-0.5, 0], [0.5, 0]], 'rgba(140,140,180,0.5)', 0.05);
  },
  feather(x, p) { E(x, 0, 0, 0.3, 1, '#ffffff', '#b8b8d0', 0.06); L(x, [[0, -0.95], [0, 1.1]], '#b8b8d0', 0.05); },
  kid(x, p) { person(x, 'kid', p.color || '#2a2a4a'); },
  adult(x, p) { person(x, 'adult', p.color || '#2a2a4a'); },
  okan(x, p) { person(x, 'okan', p.color || '#5a2a4a'); },
  trophy(x, p) {
    P(x, [[-0.7, -0.9], [0.7, -0.9], [0.5, -0.1], [0.12, 0.15], [0.12, 0.55], [-0.12, 0.55], [-0.12, 0.15], [-0.5, -0.1]], '#ffd23a', '#a06a0a', 0.08);
    R(x, -0.5, 0.55, 1, 0.35, 0.06, '#8a5a2a');
    x.beginPath(); x.arc(-0.72, -0.55, 0.25, Math.PI * 0.5, Math.PI * 1.5); edge(x, '#ffd23a', 0.1);
    x.beginPath(); x.arc(0.72, -0.55, 0.25, -Math.PI * 0.5, Math.PI * 0.5); edge(x, '#ffd23a', 0.1);
  },
  // ── 台所
  knife(x, p) {
    P(x, [[-0.25, -0.2], [0.95, -0.2], [1.05, -0.05], [0.7, 0.18], [-0.25, 0.18]], p.color || '#e8eef8', '#6a7088', 0.06);
    L(x, [[-0.2, -0.12], [0.9, -0.12]], '#ffffff', 0.05);
    R(x, -1.05, -0.15, 0.8, 0.3, 0.1, p.color2 || '#6a3a1a');
    D(x, -0.85, 0, 0.04, '#d8d8d8'); D(x, -0.55, 0, 0.04, '#d8d8d8');
  },
  board(x, p) { R(x, -1, -0.45, 2, 0.9, 0.12, '#e8c890', '#8a6030', 0.08); L(x, [[-0.8, -0.15], [0.6, -0.2]], 'rgba(160,110,50,0.4)', 0.05); D(x, 0.82, -0.25, 0.08, '#8a6030'); },
  veg(x, p) { E(x, 0, 0, 1, 0.8, p.color || '#ff8a2a', null); E(x, 0, 0, 0.55, 0.42, 'rgba(255,255,255,0.35)', null); },
  bowl(x, p) {
    x.beginPath(); x.ellipse(0, -0.1, 1, 0.9, 0, 0, Math.PI); x.closePath(); x.fillStyle = p.color2 || '#ffffff'; x.fill(); edge(x);
    E(x, 0, -0.1, 1, 0.3, p.color || '#f0a040');
    E(x, -0.3, -0.15, 0.15, 0.06, 'rgba(255,255,255,0.6)', null);
    R(x, -0.35, 0.72, 0.7, 0.15, 0.05, p.color2 || '#ffffff');
  },
  wok(x, p) {
    R(x, 0.8, -0.32, 0.7, 0.16, 0.08, '#6a3a1a');
    x.beginPath(); x.ellipse(0, -0.3, 1, 0.85, 0, 0, Math.PI); x.closePath(); x.fillStyle = '#2a2a32'; x.fill(); edge(x, '#0a0a10');
    E(x, 0, -0.3, 1, 0.22, '#4a4a58', '#0a0a10');
    if (p.food) for (let i = 0; i < 5; i++) D(x, -0.6 + i * 0.3, -0.36 + (i % 2) * 0.06, 0.12, ['#ff8a2a', '#7ac850', '#ffe060', '#e8402a', '#ffffff'][i]);
  },
  chili(x, p) {
    P(x, [[-0.5, -0.7], [-0.1, -0.75], [0.6, 0.2], [0.75, 0.9], [0.3, 0.4], [-0.45, -0.3]], '#e8202a', '#7a0a0a', 0.07);
    P(x, [[-0.65, -0.95], [-0.2, -0.85], [-0.1, -0.68], [-0.55, -0.65]], '#3ab840', null);
  },
  steak(x, p) {
    E(x, 0, 0.2, 1, 0.45, '#2a2a30', '#0a0a10');
    P(x, [[-0.7, -0.05], [-0.2, -0.4], [0.55, -0.3], [0.75, 0.1], [0.2, 0.35], [-0.55, 0.3]], '#a0502a', '#5a2010', 0.07);
    L(x, [[-0.3, -0.1], [0.4, 0]], '#f8e8c8', 0.08);
    D(x, -0.65, 0.42, 0.12, '#fff4d0'); D(x, 0.72, 0.4, 0.1, '#fff4d0');
  },
  plate(x, p) {
    E(x, 0, 0.1, 1, 0.42, '#ffffff', '#9a9ab0', 0.06);
    E(x, 0, 0.1, 0.7, 0.28, '#f0f0f8', null);
    if (p.food !== false) { E(x, 0, -0.05, 0.45, 0.25, p.color || '#e8802a'); D(x, -0.1, -0.15, 0.08, p.color2 || '#7ac850'); D(x, 0.15, -0.12, 0.07, '#ffffff'); }
  },
  cloche(x, p) {
    E(x, 0, 0.55, 1.05, 0.25, '#ffffff', '#8a8aa0', 0.06);
    const o = p._open || 0;
    x.save(); x.translate(o * 0.9, -o * 0.9); x.rotate(o * 0.7);
    x.beginPath(); x.ellipse(0, 0.5, 0.9, 1.05, 0, Math.PI, TAU); x.closePath(); x.fillStyle = p.color || '#d8dce8'; x.fill(); edge(x, '#6a6a80');
    D(x, 0, -0.62, 0.13, p.color || '#d8dce8');
    L(x, [[-0.55, 0.05], [-0.25, -0.3]], 'rgba(255,255,255,0.9)', 0.1);
    x.restore();
  },
  frypan(x, p) { R(x, 0.85, -0.12, 0.85, 0.24, 0.1, '#6a3a1a'); E(x, 0, 0, 0.95, 0.95, '#2a2a32', '#0a0a10'); E(x, 0, 0, 0.75, 0.75, '#3a3a46', null); },
  pipingbag(x, p) {
    P(x, [[-0.7, -0.9], [0.7, -0.9], [0.12, 0.7], [-0.12, 0.7]], '#f4f4ff', '#8a8aa0', 0.07);
    P(x, [[-0.12, 0.7], [0.12, 0.7], [0, 1.02]], '#c8c8d8');
    L(x, [[-0.5, -0.6], [-0.15, 0.3]], 'rgba(255,255,255,0.9)', 0.07);
  },
  candy(x, p) {
    L(x, [[0, 0.5], [0, 1.25]], '#ffffff', 0.12);
    E(x, 0, 0, 0.7, 0.7, '#ffffff', OUT, 0.07);
    x.beginPath();
    for (let i = 0; i < 40; i++) { const an = i * 0.45, r = 0.66 * (i / 40); i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r) : x.moveTo(0, 0); }
    edge(x, p.color || '#ff5a8a', 0.16);
  },
  ame(x, p) {
    P(x, [[-0.45, 0], [-1, -0.42], [-1, 0.42]], p.color2 || '#fff4b0');
    P(x, [[0.45, 0], [1, -0.42], [1, 0.42]], p.color2 || '#fff4b0');
    E(x, 0, 0, 0.55, 0.45, p.color || '#ff7a3a');
    E(x, -0.18, -0.15, 0.15, 0.1, 'rgba(255,255,255,0.7)', null);
  },
  macaron(x, p) {
    const c = p.color || '#ff9ac8';
    E(x, 0, 0.32, 0.95, 0.38, c); R(x, -0.88, -0.12, 1.76, 0.3, 0.12, p.color2 || '#fff4e8', null);
    E(x, 0, -0.32, 0.95, 0.38, c); E(x, -0.3, -0.45, 0.25, 0.08, 'rgba(255,255,255,0.6)', null);
  },
  wcake(x, p) {
    R(x, -1, 0.3, 2, 0.7, 0.08, '#ffffff', '#c8b8c8', 0.06);
    R(x, -0.72, -0.35, 1.44, 0.65, 0.08, '#ffffff', '#c8b8c8', 0.06);
    R(x, -0.45, -0.95, 0.9, 0.6, 0.08, '#ffffff', '#c8b8c8', 0.06);
    for (const [yy, w] of [[0.3, 1], [-0.35, 0.72], [-0.95, 0.45]]) for (let i = 0; i < 7; i++) D(x, -w + 0.1 + (i / 6) * (w * 2 - 0.2), yy + 0.04, 0.07, '#ff9ac8');
    D(x, -0.5, 0.65, 0.09, '#e8202a'); D(x, 0.5, 0.65, 0.09, '#e8202a'); D(x, 0, 0.0, 0.09, '#e8202a');
  },
  bell(x, p) {
    P(x, [[-0.15, -0.95], [0.15, -0.95], [0.6, -0.3], [0.75, 0.55], [-0.75, 0.55], [-0.6, -0.3]], '#ffd23a', '#a06a0a', 0.08);
    D(x, 0, 0.72, 0.16, '#d8a020');
    L(x, [[-0.35, -0.4], [-0.45, 0.3]], 'rgba(255,255,255,0.8)', 0.1);
  },
  cookiehouse(x, p) {
    R(x, -0.8, -0.2, 1.6, 1.15, 0.06, '#c8803a', '#5a3010', 0.08);
    P(x, [[-1, -0.15], [0, -1.05], [1, -0.15]], '#6a3a1a', '#2a1006', 0.08);
    L(x, [[-0.9, -0.2], [0, -0.98], [0.9, -0.2]], '#ffffff', 0.12);
    R(x, -0.55, 0.05, 0.45, 0.4, 0.04, '#ffe080', '#ffffff', 0.08);
    R(x, 0.15, 0.25, 0.4, 0.7, 0.18, '#ff7a9a', '#ffffff', 0.06);
    for (let i = 0; i < 4; i++) D(x, -0.6 + i * 0.4, -0.35, 0.08, ['#ff5a8a', '#5ac8ff', '#ffe060', '#7ae070'][i]);
  },
  saladbowl(x, p) {
    for (let i = 0; i < 6; i++) E(x, -0.7 + i * 0.28, -0.3 - (i % 2) * 0.15, 0.3, 0.22, i % 2 ? '#8ae060' : '#5ac840', '#2a7a20', 0.05);
    D(x, -0.35, -0.42, 0.14, '#e8302a'); D(x, 0.3, -0.38, 0.13, '#e8302a');
    for (let i = 0; i < 4; i++) D(x, -0.1 + i * 0.12, -0.25, 0.06, '#ffe040');
    x.beginPath(); x.ellipse(0, -0.2, 1, 1, 0, 0, Math.PI); x.closePath(); x.fillStyle = '#c8904a'; x.fill(); edge(x, '#6a4018');
    L(x, [[-0.8, 0.2], [0.8, 0.2]], 'rgba(255,230,180,0.5)', 0.06);
  },
  menuboard(x, p) {
    L(x, [[-0.6, 0.6], [-0.8, 1.05]], '#8a5a2a', 0.1); L(x, [[0.6, 0.6], [0.8, 1.05]], '#8a5a2a', 0.1);
    R(x, -0.95, -0.9, 1.9, 1.5, 0.06, '#1e3a2a', '#8a5a2a', 0.12);
    const u = clamp01((p.age - (p.drawAt || 0)) / 400);
    x.beginPath(); x.ellipse(0, 0.05, 0.55, 0.22, 0, 0, TAU * u); edge(x, '#ffffff', 0.06);
    if (u > 0.5) { x.beginPath(); x.ellipse(0, -0.05, 0.35, 0.28, 0, Math.PI, TAU); edge(x, '#ffe0a0', 0.06); }
    if (u > 0.8) for (let i = 0; i < 3; i++) L(x, [[-0.2 + i * 0.2, -0.45], [-0.15 + i * 0.2, -0.7]], '#ffffff', 0.04);
  },
  spoon(x, p) { E(x, 0, -0.55, 0.32, 0.42, '#e8eef8', '#6a7088', 0.06); R(x, -0.07, -0.15, 0.14, 1.15, 0.06, '#e8eef8', '#6a7088', 0.06); },
  gstar(x, p) { P(x, starPts(5, 1, 0.45), p.color || '#ffd23a', p.edge || '#a06a0a', 0.09); P(x, starPts(5, 0.5, 0.22), 'rgba(255,255,255,0.55)', null); },
  cakebox(x, p) {
    const o = p._open || 0;
    R(x, -0.9, -0.3, 1.8, 1.2, 0.06, '#ffffff', '#c8a8b8', 0.07);
    L(x, [[0, -0.3], [0, 0.9]], '#ff7aa8', 0.16);
    x.save(); x.translate(o * 0.5, -o * 0.8); x.rotate(o * 0.5);
    R(x, -1, -0.55, 2, 0.3, 0.05, '#ffffff', '#c8a8b8', 0.07);
    L(x, [[0, -0.55], [0, -0.25]], '#ff7aa8', 0.16);
    E(x, -0.22, -0.68, 0.22, 0.13, '#ff7aa8'); E(x, 0.22, -0.68, 0.22, 0.13, '#ff7aa8');
    x.restore();
  },
  sushi(x, p) {
    R(x, -0.8, -0.05, 1.6, 0.6, 0.28, '#ffffff', '#b8b8c8', 0.06);
    P(x, [[-0.9, 0.05], [-0.6, -0.4], [0.7, -0.45], [0.95, 0.0], [0.4, 0.1]], p.color || '#ff8a5a', '#a04020', 0.06);
    for (let i = 0; i < 3; i++) L(x, [[-0.4 + i * 0.4, -0.35], [-0.25 + i * 0.4, 0.0]], 'rgba(255,255,255,0.6)', 0.05);
  },
  kappamaki(x, p) { E(x, 0, 0, 0.9, 0.9, '#1a3a1a', '#0a1a0a'); E(x, 0, 0, 0.72, 0.72, '#ffffff', null); E(x, 0, 0, 0.3, 0.3, '#5ac840', '#2a7a20', 0.05); },
  cucumber(x, p) { E(x, 0, 0, 1, 0.3, '#3a9a30', '#1a5a10', 0.07, 0); for (let i = 0; i < 5; i++) D(x, -0.6 + i * 0.3, -0.08 + (i % 2) * 0.14, 0.04, '#9ae080'); },
  // ── 家
  futon(x, p) {
    R(x, -1, -0.6, 2, 1.2, 0.2, p.color || '#5a8ae0', '#2a3a7a', 0.08);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) D(x, -0.7 + i * 0.45, -0.25 + j * 0.5, 0.1, 'rgba(255,255,255,0.6)');
    R(x, -1.05, -0.75, 0.6, 0.4, 0.15, '#ffffff', '#8a8ab0', 0.06);
  },
  futonroll(x, p) {
    E(x, 0, 0, 0.75, 1, p.color || '#5a8ae0', '#2a3a7a', 0.08);
    for (let i = 0; i < 4; i++) L(x, [[-0.7, -0.6 + i * 0.4], [0.7, -0.45 + i * 0.4]], 'rgba(255,255,255,0.55)', 0.08);
    D(x, 0, -0.75, 0.3, '#ffd8b0');
    D(x, -0.1, -0.78, 0.04, OUT); D(x, 0.1, -0.78, 0.04, OUT);
  },
  chips(x, p) {
    P(x, [[-0.7, -0.75], [-0.4, -1], [-0.1, -0.78], [0.2, -1.02], [0.45, -0.8], [0.7, -0.98], [0.75, 0.95], [-0.75, 0.95]], '#ffd23a', '#a06a0a', 0.08);
    R(x, -0.75, -0.2, 1.5, 0.5, 0.02, '#e8302a', null);
    E(x, 0, 0.05, 0.32, 0.22, '#ffe880', '#a06a0a', 0.05);
  },
  chip(x, p) { P(x, [[-0.9, -0.1], [-0.4, -0.7], [0.5, -0.6], [0.95, 0.05], [0.4, 0.65], [-0.5, 0.55]], '#ffd860', '#c89020', 0.08); D(x, -0.2, 0, 0.08, '#c89020'); D(x, 0.3, -0.2, 0.06, '#c89020'); },
  moon(x, p) {
    x.beginPath(); x.arc(0, 0, 1, 0.6, TAU - 0.6 + 0.0001, false); x.arc(0.42, -0.1, 0.78, TAU - 0.9, 0.95, true); x.closePath(); x.fillStyle = '#ffe680'; x.fill(); edge(x, '#c8a020', 0.06);
  },
  phone(x, p) { R(x, -0.55, -1, 1.1, 2, 0.18, '#2a2a3a', '#0a0a10'); R(x, -0.44, -0.8, 0.88, 1.5, 0.06, '#5ac8ff', null); R(x, -0.3, -0.6, 0.6, 0.15, 0.03, '#ffffff', null); R(x, -0.3, -0.35, 0.4, 0.12, 0.03, '#d8f4ff', null); D(x, 0, 0.85, 0.07, '#5a5a6a'); },
  calendar(x, p) {
    R(x, -0.9, -0.95, 1.8, 1.9, 0.08, '#ffffff', '#8a8aa0', 0.07);
    R(x, -0.9, -0.95, 1.8, 0.45, 0.08, '#e8302a', null);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) R(x, -0.75 + i * 0.4, -0.35 + j * 0.42, 0.26, 0.28, 0.03, '#d8dce8', null);
    const mx = -0.75 + (p.mark ?? 1) * 0.4 + 0.13, my = -0.35 + 0.42 + 0.14;
    const u = clamp01((p.age - (p.markAt ?? 200)) / 220);
    if (u > 0) { x.beginPath(); x.arc(mx, my, 0.26, -Math.PI / 2, -Math.PI / 2 + TAU * u); edge(x, '#e8202a', 0.1); }
  },
  magnifier(x, p) { L(x, [[0.4, 0.4], [1, 1]], '#6a3a1a', 0.24); E(x, 0, 0, 0.6, 0.6, 'rgba(200,240,255,0.45)', '#3a3a4a', 0.14); L(x, [[-0.3, -0.2], [-0.12, -0.38]], '#ffffff', 0.08); },
  clock(x, p) {
    D(x, -0.55, -0.75, 0.3, '#e8302a'); D(x, 0.55, -0.75, 0.3, '#e8302a');
    E(x, 0, 0, 0.85, 0.85, '#e8302a', '#7a1010', 0.08); E(x, 0, 0, 0.66, 0.66, '#ffffff', null);
    L(x, [[0, 0], [0, -0.45]], OUT, 0.08); L(x, [[0, 0], [0.32, 0.12]], OUT, 0.08);
    L(x, [[-0.5, 0.75], [-0.65, 1]], '#7a1010', 0.1); L(x, [[0.5, 0.75], [0.65, 1]], '#7a1010', 0.1);
  },
  jersey(x, p) {
    P(x, [[-0.4, -0.9], [0.4, -0.9], [1, -0.55], [0.85, -0.05], [0.55, -0.25], [0.55, 0.95], [-0.55, 0.95], [-0.55, -0.25], [-0.85, -0.05], [-1, -0.55]], p.color || '#8a1a3a', '#3a0814', 0.08);
    L(x, [[0, -0.9], [0, 0.95]], '#d8d8e8', 0.06);
    L(x, [[-0.95, -0.5], [-0.42, -0.85]], '#ffffff', 0.08); L(x, [[0.95, -0.5], [0.42, -0.85]], '#ffffff', 0.08);
  },
  tag(x, p) {
    P(x, [[-1, -0.5], [0.55, -0.5], [1, 0], [0.55, 0.5], [-1, 0.5]], p.color || '#fff4b0', '#a06a0a', 0.07);
    D(x, 0.55, 0, 0.1, '#ffffff');
    R(x, -0.8, -0.18, 1.1, 0.36, 0.04, p.color2 || '#e8302a', null);
  },
  bento(x, p) {
    const o = p._open || 0;
    R(x, -1, -0.6, 2, 1.25, 0.12, '#3a2a2a', '#1a0a0a');
    R(x, -0.9, -0.5, 1.05, 1.05, 0.08, '#ffffff', null);
    D(x, -0.38, -0.02, 0.13, '#e8302a');
    R(x, 0.22, -0.5, 0.7, 0.45, 0.06, '#ffe060', null); L(x, [[0.3, -0.28], [0.85, -0.28]], '#e8b020', 0.05);
    E(x, 0.4, 0.25, 0.18, 0.12, '#e8402a', null); E(x, 0.72, 0.25, 0.16, 0.16, '#3ab840', null);
    if (o < 1) {
      x.save(); x.translate(0, -o * 1.3); x.globalAlpha *= 1 - o;
      R(x, -1.08, -0.68, 2.16, 1.4, 0.14, p.color || '#3a8ae0', '#1a2a5a');
      for (let i = 0; i < 4; i++) { L(x, [[-1.05 + i * 0.6, -0.68], [-1.05 + i * 0.6, 0.72]], 'rgba(255,255,255,0.5)', 0.12); L(x, [[-1.08, -0.4 + i * 0.4], [1.08, -0.4 + i * 0.4]], 'rgba(255,255,255,0.5)', 0.12); }
      E(x, 0, -0.78, 0.35, 0.18, p.color || '#3a8ae0', '#1a2a5a'); E(x, -0.4, -0.95, 0.2, 0.15, p.color || '#3a8ae0', '#1a2a5a'); E(x, 0.4, -0.95, 0.2, 0.15, p.color || '#3a8ae0', '#1a2a5a');
      x.restore();
    }
  },
  onigiri(x, p) { P(x, [[0, -0.9], [0.9, 0.7], [-0.9, 0.7]], '#ffffff', '#9a9ab0', 0.08); R(x, -0.4, 0.15, 0.8, 0.6, 0.05, '#1a2a1a', null); },
  tamago(x, p) { R(x, -0.9, -0.45, 1.8, 0.9, 0.2, '#ffe060', '#c89020', 0.07); x.beginPath(); x.arc(-0.4, 0, 0.25, 0, TAU * 0.8); edge(x, '#e8b020', 0.06); },
  broom(x, p) {
    L(x, [[0, -1.05], [0, 0.15]], '#a8703a', 0.14);
    P(x, [[-0.2, 0.1], [0.2, 0.1], [0.65, 1], [-0.65, 1]], '#e8c060', '#8a6020', 0.07);
    for (let i = -2; i <= 2; i++) L(x, [[i * 0.06, 0.2], [i * 0.25, 0.95]], '#b88a30', 0.04);
    L(x, [[-0.25, 0.25], [0.25, 0.25]], '#e8302a', 0.08);
  },
  trash(x, p) { P(x, [[-0.7, -0.6], [0.7, -0.6], [0.55, 0.95], [-0.55, 0.95]], '#8a9aa8', '#3a4a58', 0.08); R(x, -0.8, -0.8, 1.6, 0.22, 0.06, '#6a7a88', '#3a4a58'); for (let i = -1; i <= 1; i++) L(x, [[i * 0.3, -0.4], [i * 0.25, 0.8]], '#5a6a78', 0.06); },
  trashbag(x, p) { E(x, 0, 0.2, 0.85, 0.8, '#2a2a34', '#0a0a10'); P(x, [[-0.15, -0.55], [0.15, -0.55], [0.35, -1], [0, -0.8], [-0.35, -1]], '#2a2a34', '#0a0a10'); E(x, -0.35, 0.0, 0.15, 0.25, 'rgba(255,255,255,0.25)', null); },
  slipper(x, p) {
    E(x, 0, 0, 1, 0.48, p.color || '#ff5a9a', '#8a1a4a', 0.08);
    E(x, 0.05, 0, 0.82, 0.34, p.color2 || '#ffb0d0', null);
    x.beginPath(); x.ellipse(0.35, 0, 0.5, 0.55, 0, -Math.PI / 2, Math.PI / 2); x.closePath(); x.fillStyle = p.color || '#ff5a9a'; x.fill(); edge(x, '#8a1a4a', 0.08);
    D(x, 0.45, 0, 0.12, '#ffffff');
  },
  heart(x, p) {
    x.beginPath(); x.moveTo(0, 0.9); x.bezierCurveTo(-1.2, 0, -0.9, -1.05, 0, -0.45); x.bezierCurveTo(0.9, -1.05, 1.2, 0, 0, 0.9); x.closePath();
    x.fillStyle = p.color || '#ff4a7a'; x.fill(); edge(x, p.edge || '#8a1a3a', 0.08);
    E(x, -0.4, -0.35, 0.15, 0.1, 'rgba(255,255,255,0.7)', null, 0, -0.6);
  },
  chawan(x, p) {
    puffy(x, [[-0.35, -0.2, 0.38], [0.05, -0.38, 0.42], [0.42, -0.18, 0.36]], '#ffffff', '#b8b8c8', 0.06);
    x.beginPath(); x.ellipse(0, -0.05, 0.95, 0.85, 0, 0, Math.PI); x.closePath(); x.fillStyle = p.color || '#3a6ac8'; x.fill(); edge(x, '#1a2a5a');
    L(x, [[-0.7, 0.3], [0.7, 0.3]], '#ffffff', 0.06);
  },
  ohitsu(x, p) {
    E(x, 0, -0.45, 0.95, 0.3, '#ffffff', '#b8b8c8', 0.06);
    R(x, -0.95, -0.45, 1.9, 1.2, 0.15, '#d8a868', '#6a4018');
    L(x, [[-0.95, -0.15], [0.95, -0.15]], '#c8a020', 0.12); L(x, [[-0.95, 0.45], [0.95, 0.45]], '#c8a020', 0.12);
  },
  shamoji(x, p) { E(x, 0, -0.45, 0.42, 0.55, '#f4e8c8', '#a08050', 0.07); R(x, -0.1, 0, 0.2, 1, 0.08, '#f4e8c8', '#a08050', 0.07); },
  chabudai(x, p) {
    R(x, -0.75, 0, 0.14, 0.75, 0.04, '#5a3010'); R(x, 0.61, 0, 0.14, 0.75, 0.04, '#5a3010');
    E(x, 0, 0.08, 1, 0.42, '#6a3a18', '#2a1006', 0.06);
    E(x, 0, 0, 1, 0.4, '#a8642a', '#2a1006', 0.08);
    E(x, -0.2, -0.1, 0.5, 0.12, 'rgba(255,220,170,0.35)', null);
  },
  washer(x, p) {
    R(x, -0.85, -1, 1.7, 2, 0.14, '#f4f6fa', '#8a9aa8', 0.08);
    E(x, 0, 0.15, 0.58, 0.58, '#5ab8ff', '#6a7a88', 0.1);
    x.beginPath(); for (let i = 0; i < 24; i++) { const an = i * 0.5 + p.age / 60, r = 0.5 * (i / 24); i ? x.lineTo(Math.cos(an) * r, 0.15 + Math.sin(an) * r) : x.moveTo(0, 0.15); } edge(x, '#ffffff', 0.08);
    R(x, -0.65, -0.85, 0.6, 0.18, 0.04, '#5a6a78', null); D(x, 0.5, -0.76, 0.1, '#3ac860');
  },
  basket(x, p) {
    L(x, [[-0.4, -0.6], [-0.2, -1.05]], '#3ab840', 0.18); L(x, [[-0.25, -0.6], [0.05, -1.1]], '#ffffff', 0.18);
    R(x, 0.15, -0.95, 0.4, 0.6, 0.04, '#ffffff', '#3a8ae0', 0.06);
    D(x, 0.62, -0.55, 0.18, '#e8302a');
    P(x, [[-1, -0.5], [1, -0.5], [0.8, 0.85], [-0.8, 0.85]], '#3ab860', '#1a6a30', 0.08);
    for (let i = 0; i < 5; i++) L(x, [[-0.75 + i * 0.37, -0.4], [-0.65 + i * 0.32, 0.75]], 'rgba(255,255,255,0.45)', 0.06);
    L(x, [[-0.9, 0.15], [0.9, 0.15]], 'rgba(255,255,255,0.45)', 0.06);
  },
  milk(x, p) { P(x, [[-0.5, -0.5], [0, -1], [0.5, -0.5], [0.5, 1], [-0.5, 1]], '#ffffff', '#6a7a9a', 0.07); R(x, -0.5, 0, 1, 0.5, 0.02, p.color || '#3a8ae0', null); },
  medbag(x, p) {
    P(x, [[-0.75, -0.8], [0.75, -0.8], [0.8, 0.95], [-0.8, 0.95]], '#ffffff', '#8a9aa8', 0.07);
    P(x, [[-0.75, -0.8], [0.75, -0.8], [0.6, -1], [-0.6, -1]], '#e8f0f8', '#8a9aa8', 0.07);
    R(x, -0.12, -0.35, 0.24, 0.8, 0.03, '#3ac860', null); R(x, -0.4, -0.07, 0.8, 0.24, 0.03, '#3ac860', null);
  },
  capsule(x, p) {
    x.save(); x.rotate(-0.5);
    R(x, -0.95, -0.38, 0.95, 0.76, 0.38, p.color || '#e8302a', OUT, 0.07); R(x, 0, -0.38, 0.95, 0.76, 0.38, '#ffffff', OUT, 0.07);
    E(x, -0.5, -0.15, 0.25, 0.08, 'rgba(255,255,255,0.7)', null);
    x.restore();
  },
  spray(x, p) {
    R(x, -0.45, -0.25, 0.9, 1.25, 0.18, 'rgba(160,220,255,0.85)', '#3a7ab0', 0.08);
    R(x, -0.25, -0.55, 0.5, 0.32, 0.06, '#ffffff', '#6a7a88');
    P(x, [[-0.25, -0.55], [0.75, -0.75], [0.75, -0.5], [0.25, -0.4]], '#ffffff', '#6a7a88', 0.07);
    R(x, -0.35, 0.2, 0.7, 0.4, 0.04, '#ffffff', null); R(x, -0.08, 0.27, 0.16, 0.26, 0.02, '#3ac860', null); R(x, -0.2, 0.33, 0.4, 0.13, 0.02, '#3ac860', null);
  },
  paper(x, p) { R(x, -0.75, -0.95, 1.5, 1.9, 0.04, '#ffffff', '#9a9ab0', 0.06); for (let i = 0; i < 5; i++) L(x, [[-0.55, -0.6 + i * 0.3], [0.5 - (i % 2) * 0.3, -0.6 + i * 0.3]], p.color || '#7ab8e0', 0.07); },
  stetho(x, p) {
    x.beginPath(); x.moveTo(-0.6, -0.9); x.quadraticCurveTo(-0.7, 0.3, 0, 0.3); x.quadraticCurveTo(0.7, 0.3, 0.6, -0.9); edge(x, '#3a3a4a', 0.12);
    L(x, [[0, 0.3], [0, 0.6]], '#3a3a4a', 0.12);
    E(x, 0, 0.78, 0.25, 0.25, '#c8ccd8', '#3a3a4a', 0.08);
    D(x, -0.6, -0.92, 0.1, '#c8ccd8'); D(x, 0.6, -0.92, 0.1, '#c8ccd8');
  },
  scale(x, p) { R(x, -0.9, -0.5, 1.8, 1, 0.2, '#ffffff', '#8a9aa8', 0.08); R(x, -0.4, -0.3, 0.8, 0.35, 0.05, '#2a3a2a', null); R(x, -0.3, -0.24, 0.6, 0.22, 0.03, '#7aff9a', null); },
  card(x, p) { R(x, -1, -0.62, 2, 1.24, 0.12, p.color || '#ffd23a', '#a06a0a', 0.07); R(x, -1, -0.3, 2, 0.24, 0.02, p.color2 || '#e8302a', null); P(x, starPts(5, 0.3, 0.13).map(([a, b]) => [a + 0.55, b + 0.25]), '#ffffff', null); },
  shopbag(x, p) {
    x.beginPath(); x.arc(0, -0.55, 0.35, Math.PI, TAU); edge(x, '#6a4018', 0.08);
    P(x, [[-0.75, -0.55], [0.75, -0.55], [0.85, 1], [-0.85, 1]], p.color || '#e8302a', '#5a1010', 0.08);
    P(x, starPts(5, 0.3, 0.13).map(([a, b]) => [a, b + 0.25]), '#ffffff', null);
  },
  shirt(x, p) { P(x, [[-0.35, -0.85], [0.35, -0.85], [1, -0.45], [0.75, 0], [0.5, -0.2], [0.5, 0.9], [-0.5, 0.9], [-0.5, -0.2], [-0.75, 0], [-1, -0.45]], p.color || '#5ac8ff', '#1a3a5a', 0.08); },
  noren(x, p) {
    L(x, [[-1.05, -0.95], [1.05, -0.95]], '#6a3a1a', 0.14);
    for (let i = 0; i < 3; i++) { const sw = Math.sin(p.age / 160 + i) * 0.05; P(x, [[-0.95 + i * 0.65, -0.9], [-0.37 + i * 0.65, -0.9], [-0.37 + i * 0.65 + sw, 0.7], [-0.95 + i * 0.65 + sw, 0.7]], '#1a2a6a', '#0a1030', 0.06); }
    E(x, 0, -0.1, 0.32, 0.32, '#ffffff', null);
  },
  taiko(x, p) {
    E(x, 0, 0.1, 0.95, 0.8, '#a8401a', '#4a1006', 0.08);
    E(x, 0, -0.55, 0.8, 0.25, '#f4e8c8', '#4a1006', 0.08);
    for (let i = 0; i < 7; i++) D(x, -0.8 + i * 0.27, -0.4 + Math.abs(i - 3) * -0.02, 0.05, '#2a1006');
    L(x, [[-0.8, 0.45], [0.8, 0.45]], '#ffd23a', 0.06);
  },
  handbook(x, p) { R(x, -0.65, -0.9, 1.3, 1.8, 0.1, p.color || '#ff9ac8', '#8a2a5a', 0.07); R(x, -0.4, -0.55, 0.8, 0.4, 0.05, '#ffffff', null); P(x, starPts(5, 0.22, 0.1).map(([a, b]) => [a, b + 0.4]), '#ffffff', null); },
  yatai(x, p) {
    for (let i = 0; i < 6; i++) P(x, [[-1 + i * 0.34, -1], [-0.66 + i * 0.34, -1], [-0.66 + i * 0.34, -0.55], [-1 + i * 0.34, -0.55]], i % 2 ? '#ffffff' : '#e8302a', null);
    L(x, [[-1, -1], [1.04, -1]], OUT, 0.06);
    L(x, [[-0.9, -0.55], [-0.9, 0.95]], '#8a5a2a', 0.1); L(x, [[0.9, -0.55], [0.9, 0.95]], '#8a5a2a', 0.1);
    R(x, -1, 0.3, 2, 0.6, 0.04, '#c8904a', '#6a4018');
  },
  oven(x, p) { R(x, -1, -0.85, 2, 1.7, 0.12, '#e8e8f0', '#6a6a80', 0.08); R(x, -0.8, -0.45, 1.6, 1.1, 0.08, '#3a2a20', '#6a6a80', 0.06); R(x, -0.7, -0.35, 1.4, 0.9, 0.06, '#ff9a3a', null); D(x, -0.6, -0.65, 0.1, '#6a6a80'); D(x, -0.3, -0.65, 0.1, '#6a6a80'); },
  searchbar(x, p) {
    R(x, -1, -0.32, 2, 0.64, 0.32, '#ffffff', '#5a7ac8', 0.1);
    const u = clamp01((p.age - 60) / 260);
    for (let i = 0; i < Math.floor(u * 5); i++) D(x, -0.75 + i * 0.2, 0, 0.06, '#3a3a5a');
    E(x, 0.72, -0.04, 0.13, 0.13, 'rgba(0,0,0,0)', '#5a7ac8', 0.07); L(x, [[0.81, 0.06], [0.9, 0.16]], '#5a7ac8', 0.07);
  },
  target(x, p) {
    E(x, 0, 0, 0.9, 0.9, 'rgba(0,0,0,0)', p.color || '#ff2a2a', 0.12);
    E(x, 0, 0, 0.45, 0.45, 'rgba(0,0,0,0)', p.color || '#ff2a2a', 0.1);
    for (const [a, b, c2, d2] of [[0, -1.2, 0, -0.55], [0, 1.2, 0, 0.55], [-1.2, 0, -0.55, 0], [1.2, 0, 0.55, 0]]) L(x, [[a, b], [c2, d2]], p.color || '#ff2a2a', 0.1);
    D(x, 0, 0, 0.1, p.color || '#ff2a2a');
  },
  hataki(x, p) {
    L(x, [[0, -1.05], [0, 0.2]], '#8a5a2a', 0.12);
    for (let i = -3; i <= 3; i++) E(x, i * 0.12, 0.55, 0.12, 0.5, i % 2 ? '#ffffff' : '#ffe0f0', '#a090a0', 0.04, i * 0.15);
  },
  sweat(x, p) { x.beginPath(); x.moveTo(0, -1); x.quadraticCurveTo(0.7, 0.2, 0, 0.6); x.quadraticCurveTo(-0.7, 0.2, 0, -1); x.fillStyle = p.color || '#7ad8ff'; x.fill(); edge(x, '#2a6ab0', 0.08); },
  cloudd(x, p) { puffy(x, [[-0.6, 0.1, 0.45], [-0.1, -0.2, 0.6], [0.5, 0, 0.5], [0.1, 0.3, 0.45]], p.color || '#5a5a6a', p.edge || '#2a2a34', 0.08); },
  hinadan(x, p) {
    for (let i = 0; i < 3; i++) R(x, -1 + i * 0.15, 0.1 + i * 0.3 - 0.9, 2 - i * 0.3, 0.3, 0.03, '#c8904a', '#6a4018', 0.05);
  },
  gate(x, p) {
    R(x, -1, -0.5, 0.18, 1.5, 0.04, '#c8904a', '#6a4018', 0.06); R(x, 0.82, -0.5, 0.18, 1.5, 0.04, '#c8904a', '#6a4018', 0.06);
    x.beginPath(); x.ellipse(0, -0.45, 1, 0.55, 0, Math.PI, TAU); edge(x, '#ff7ab0', 0.28);
    for (let i = 0; i < 9; i++) { const an = Math.PI + (i / 8) * Math.PI; D(x, Math.cos(an), -0.45 + Math.sin(an) * 0.55, 0.1, ['#ffe060', '#5ac8ff', '#ff5a8a'][i % 3]); }
  },
};
export const O5_SHAPES = Object.keys(OBJ);

// うごく みち: x0,y0 → x1,y1（hop … とびはねる 高さ）か pts（[[x,y],…]。hops … くぎりごとの 高さ）
export function pathPos(p, age = p.age) {
  const travel = p.travel || 0;
  if (!(travel > 0)) return [p.x, p.y, 1];
  const e = clamp01((age - (p.start || 0)) / travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : p.ease === 'out' ? easeOut(e) : p.ease === 'io' ? easeInOut(e) : e;
  if (p.pts) {
    const n = p.pts.length - 1;
    const s = Math.min(n - 1e-6, k * n), i = Math.floor(s), u = s - i;
    const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1];
    const h = Array.isArray(p.hops) ? p.hops[i] || 0 : p.hop || 0;
    return [lerp(ax, bx, u), lerp(ay, by, u) - h * Math.sin(u * Math.PI), e];
  }
  const b = p.bounces || 1;
  const seg = Math.min(b - 1, Math.floor(k * b));
  const hop = (p.hop || 0) * Math.abs(Math.sin(k * Math.PI * b)) * Math.pow(p.decay || 1, seg);
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - hop, e];
}

// 線の かたち（o5Line の pts を 長さで 切る）
function cutPts(pts, u) {
  if (u >= 1) return pts;
  let tot = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
  let left = tot * u;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (left >= seg[i - 1]) { out.push(pts[i]); left -= seg[i - 1]; continue; }
    const k = seg[i - 1] ? left / seg[i - 1] : 0;
    out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]);
    break;
  }
  return out;
}

export const AX_O5_FINE = {
  // 小物: shape・s（大きさ px）・pop（ふくらむ ms）・spin（回る 速さ）・rot0・flip・wob（ゆれ）・squash・trail（のこりの ひかり）・glow・openAt（ふた が ひらく）
  o5Obj(x, p) {
    const a = envOf(p, 60, 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = OBJ[p.shape];
    if (!draw) return;
    const s = p.s || 6;
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    if (p.openAt !== undefined) p._open = easeOut(clamp01((p.age - p.openAt) / 200));
    x.save();
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      for (let i = p.trail; i >= 1; i--) {
        const [tx, ty, te] = pathPos(p, p.age - i * 24);
        if (te <= 0 || te >= 1) continue;
        softGlow(x, tx, ty, s * (1.5 - i * 0.15), p.glow || '#ffffff', a * 0.5 / i);
      }
    }
    const [cx, cy] = pathPos(p);
    x.translate(cx, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * (p.glowR || 2.1), p.glow, a * 0.55); }
    x.globalCompositeOperation = 'source-over';
    const wob = p.wob ? Math.sin(p.age / (p.wobMs || 70)) * p.wob : 0;
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000 + wob);
    const sq = p.squash ? 1 + p.squash * Math.sin(p.age / 50) : 1;
    x.scale(s * sc * (p.flip ? -1 : 1) * sq, s * sc / sq);
    x.globalAlpha = a;
    x.lineJoin = 'round';
    draw(x, p, a);
    x.restore();
  },
  // カタカナの 擬音: text・size・fill・edge・bubble（ふきだしの 色）・burst（ギザギザ星の 色）・rot・rise・s・type（1字ずつ 出る ms）
  o5Text(x, p) {
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / (p.pop || 170))) * (p.s || 1);
    const txt = p.type ? p.text.slice(0, Math.max(1, Math.ceil(p.age / p.type))) : p.text;
    const size = p.size || 12;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate((p.rot || 0) + (p.wob ? Math.sin(p.age / 80) * p.wob : 0));
    x.scale(sc, sc);
    x.font = `bold ${size}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const mw = x.measureText(txt)?.width;
    const w = Number.isFinite(mw) ? mw : txt.length * size;
    if (p.burst) {
      const rx = w * 0.62 + 8, ry = size * 1.05 + 4;
      const pts = starPts(12, 1, 0.72, p.age / 900).map(([u, v]) => [u * rx, v * ry]);
      P(x, pts, p.burst, p.burstEdge || '#c8202a', 2);
    }
    if (p.bubble) {
      const bw = w + 10, bh = size + 7;
      x.fillStyle = p.edge || '#2a1a10';
      rrect(x, -bw / 2 - 1.2, -bh / 2 - 1.2, bw + 2.4, bh + 2.4, 6); x.fill();
      x.beginPath(); x.moveTo(-4, bh / 2); x.lineTo(4, bh / 2); x.lineTo(p.tail ?? -6, bh / 2 + 7); x.closePath(); x.fill();
      x.fillStyle = p.bubble;
      rrect(x, -bw / 2, -bh / 2, bw, bh, 5); x.fill();
      x.beginPath(); x.moveTo(-3, bh / 2 - 0.6); x.lineTo(3, bh / 2 - 0.6); x.lineTo((p.tail ?? -6) * 0.8, bh / 2 + 4.5); x.closePath(); x.fill();
    } else if (!p.burst || p.stroke) {
      x.lineWidth = p.lw || 3;
      x.lineJoin = 'round';
      x.strokeStyle = p.edge || '#2a1a10';
      x.strokeText(txt, 0, 0.5);
    }
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(txt, 0, 0.5);
    x.restore();
  },
  // 上向き・下向きの 矢印（down … 下向き）。のぼって（さがって）きえる
  o5Arrow(x, p) {
    const a = envOf(p, 80, 200);
    if (a <= 0) return;
    const u = clamp01(p.age / p.life);
    const s = (p.s || 7) * backOut(clamp01(p.age / 160));
    const dy = (p.down ? 1 : -1) * (p.move ?? 10) * easeOut(u);
    x.save();
    x.translate(p.x, p.y + dy);
    if (p.down) x.scale(1, -1);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 2, p.color || '#ff5a5a', a * 0.5);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.scale(s, s);
    P(x, [[0, -1], [0.85, -0.05], [0.35, -0.05], [0.35, 0.95], [-0.35, 0.95], [-0.35, -0.05], [-0.85, -0.05]], p.color || '#ff5a5a', p.edge || '#ffffff', 0.16);
    x.restore();
  },
  // のびる 線: pts・w・color・glow・grow（のびる ms）・solid（ひかりなし の 白い 線）・dash
  o5Line(x, p) {
    const a = envOf(p, 30, 200) * (p.alpha ?? 1);
    if (a <= 0 || !p.pts || p.pts.length < 2) return;
    const u = p.grow ? easeOut(clamp01(p.age / p.grow)) : 1;
    const pts = cutPts(p.pts, u);
    if (pts.length < 2) return;
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (p.dash) x.setLineDash?.(p.dash);
    const lay = p.solid ? [[p.color || '#ffffff', 1, 1]] : [[p.glow || p.color || '#ffffff', 2.6, 0.3], [p.color || '#ffffff', 1, 0.9], [p.core || '#ffffff', 0.4, 1]];
    x.globalCompositeOperation = p.solid ? 'source-over' : 'lighter';
    for (const [col, k, al] of lay) {
      x.strokeStyle = col; x.lineWidth = Math.max(0.4, (p.w || 2) * k); x.globalAlpha = Math.min(1, a * al);
      poly(x, pts, false); x.stroke();
    }
    x.restore();
  },
  // 湯気（ゆらゆら のぼる 3本）: h・n・color
  o5Steam(x, p) {
    const a = envOf(p, 120, 260) * (p.alpha ?? 0.75);
    if (a <= 0) return;
    const n = p.n || 3, h = p.h || 20, w = p.w || 12;
    x.save();
    x.strokeStyle = p.color || '#ffffff'; x.lineCap = 'round';
    x.lineWidth = p.lw || 1.6;
    for (let i = 0; i < n; i++) {
      const bx = p.x + (n > 1 ? (i / (n - 1) - 0.5) * w : 0);
      x.globalAlpha = a * (0.7 + 0.3 * Math.sin(i * 2.1));
      x.beginPath();
      for (let k = 0; k <= 10; k++) {
        const yy = p.y - (k / 10) * h - (p.age / 40) % 4;
        const xx = bx + Math.sin(k * 0.9 + p.age / 120 + i * 1.7) * 2.6;
        k ? x.lineTo(xx, yy) : x.moveTo(xx, yy);
      }
      x.stroke();
    }
    x.restore();
  },
  // 竜巻（下が ほそい だ円の かさなり）: h・w・cols・travel で うごく
  o5Twister(x, p) {
    const a = envOf(p, 100, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const [cx, cy] = pathPos(p);
    const h = (p.h || 50) * (0.4 + 0.6 * easeOut(clamp01(p.age / 220))), w = p.w || 22;
    const cols = p.cols || ['#ff4a1a', '#ffa020', '#fff27a'];
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy - h * 0.5, w * 1.6, cols[1], a * 0.4);
    x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
    const n = 9;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const yy = cy - u * h, rr = w * (0.2 + 0.8 * u);
      const sw = Math.sin(p.age / 90 + u * 4) * w * 0.18 * u;
      x.globalAlpha = a * (0.7 + 0.25 * u);
      x.strokeStyle = cols[i % cols.length];
      x.lineWidth = 2 + u * 2.2;
      x.beginPath();
      const ph = p.age / 70 + i;
      x.ellipse(cx + sw, yy, Math.max(0.5, rr), Math.max(0.4, rr * 0.28), 0, ph % TAU, ph % TAU + 4.4);
      x.stroke();
    }
    x.restore();
  },
  // 発射の あと 一しゅんの うすい 背景（v: sunset・dawn・night・gym・yard・kitchen・tatami・fest・class・gold・stage・pink）
  o5Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = envOf(p, 120, 220) * Math.min(0.35, p.a ?? 0.3);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const bands = (cols, y0 = 0, y1 = H) => {
      const n = cols.length, hh = (y1 - y0) / n;
      cols.forEach((c, i) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(-8, y0 + i * hh - 0.5, W + 16, hh + 1); });
    };
    const rays = (cx, cy, col, n = 14) => {
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + p.age / 2400;
        x.globalAlpha = a * 0.6;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an - 0.08) * 320, cy + Math.sin(an - 0.08) * 320); x.lineTo(cx + Math.cos(an + 0.08) * 320, cy + Math.sin(an + 0.08) * 320); x.closePath(); x.fill();
      }
      softGlow(x, cx, cy, 70, col, a * 1.4);
      x.globalCompositeOperation = 'source-over';
    };
    const v = p.v;
    if (v === 'sunset') {
      bands(['#7a2a48', '#b03a3a', '#e05a2a', '#f8883a', '#ffb050', '#7a3a3a']);
      x.globalAlpha = a * 1.6; D(x, p.sx ?? W / 2, 88, 26, '#ffd070');
    } else if (v === 'dawn') {
      bands(['#a8c8ff', '#d8e8ff', '#fff4d8', '#ffe0a0', '#fff8e8']);
      rays(p.sx ?? W / 2, p.sy ?? 96, '#fff0a0');
    } else if (v === 'night') {
      bands(['#0a0a28', '#141838', '#1a2048', '#202850']);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 24; i++) { x.globalAlpha = a * (1 + Math.sin(p.age / 140 + i)); x.fillStyle = '#ffffff'; x.fillRect(hash(i * 1.7) * W, hash(i * 2.9) * H * 0.7, 1.3, 1.3); }
    } else if (v === 'gym') {
      bands(['#e8d8b0', '#f0e0c0', '#d8b880', '#c8a060', '#b88a50']);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) softGlow(x, 30 + i * 66, 8, 30, '#ffffff', a * 1.6);
    } else if (v === 'yard') {
      bands(['#7ac4f8', '#a8dcff', '#c89a5a', '#c89a5a', '#b88a4a'], -8, H);
    } else if (v === 'kitchen') {
      bands(['#fff4e0', '#ffe8c8', '#ffe0b0']);
      x.globalAlpha = a; x.strokeStyle = '#d8b890'; x.lineWidth = 1;
      for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 24, 0); x.lineTo(i * 24, H); x.stroke(); }
      for (let j = 0; j < 7; j++) { x.beginPath(); x.moveTo(0, j * 24); x.lineTo(W, j * 24); x.stroke(); }
    } else if (v === 'tatami') {
      bands(['#e8e0c0', '#d8d0a0', '#c8c088', '#b8b078']);
      x.globalAlpha = a; x.fillStyle = '#4a5a2a';
      for (let i = 0; i < 5; i++) x.fillRect(i * 64 - 2, 0, 3, H);
    } else if (v === 'fest') {
      bands(['#1a1040', '#2a1850', '#3a2058', '#4a2848']);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 9; i++) softGlow(x, 14 + i * 29, 16 + (i % 2) * 4, 14, '#ff8a3a', a * 2);
    } else if (v === 'class') {
      bands(['#f4ead8', '#e8dcc0', '#e8dcc0', '#c8a878']);
      x.globalAlpha = a * 1.4; x.fillStyle = '#1e4a32'; x.fillRect(30, 10, W - 60, 50);
    } else if (v === 'gold' || v === 'stage') {
      bands(v === 'gold' ? ['#5a3a10', '#7a5018', '#a06a20', '#7a5018'] : ['#2a0a3a', '#3a1048', '#4a1458', '#3a1048']);
      rays(p.sx ?? W / 2, p.sy ?? 20, v === 'gold' ? '#ffe080' : '#ffb0ec');
    } else {
      bands(['#ffe0f0', '#ffd0e8', '#fff0f8']);
    }
    x.restore();
  },
};
