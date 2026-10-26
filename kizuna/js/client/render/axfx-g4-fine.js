// 第48回 G4: 大技の つぶの かきかた（AX_G4_FINE。なまえは g4 で はじめる）。この ファイルは G4 だけが さわる
// ・ダイの大冒険（竜の紋章・剣・アバンストラッシュの A・十字・竜の あたま・メドローアの 弓と 消滅の 球・竜闘気の つばさ）
// ・ロトの勇者（金の 鳥の 紋章・雷雲の うず・きずなの 糸）
// ・マリオ（スター・キノコ・こうら・POW・コイン・ファイアボール・ハンマー・たまご・土管・カート・大きな 足・人の かげ）
// ・3年B組（夕日の 背景・「人」の 2画・ハートの 波・出席簿・ふきだし・家・卒業証書の 筒）
// ・どれも 1つの つぶで 大きな 絵を かく（つぶを 何百も つかわない）。毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
// ・画面の 文字は カタカナ・ひらがな・記号・ローマ字だけ（漢字なし）
import { softGlow, disc, clamp01, lerp, easeOut, easeIn, easeInOut, hash } from './axkit.js?v=5cf16f1946f7';

const TAU = Math.PI * 2;
// 出て きえる こさ（fin で こく、さいごの fout で うすく）
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

function path(x, pts, close = false) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
// ひかる 線（ひかり → からだ → しん の 3かい）
export function glowStroke(x, pts, w, glow, color, core, a = 1, close = false) {
  x.globalCompositeOperation = 'lighter';
  for (const [col, k, al] of [[glow, 2.8, 0.32], [color, 1, 0.9], [core, 0.38, 1]]) {
    x.strokeStyle = col;
    x.lineWidth = Math.max(0.4, w * k);
    x.globalAlpha = Math.min(1, a * al);
    path(x, pts, close);
    x.stroke();
  }
}
// ふちどりの ある かたち（明るい はいけいでも 見える）。lw … ふちの 太さ（いまの 大きさで）
function shapeFill(x, pts, color, edge, a, lw) {
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = Math.min(1, a);
  x.fillStyle = color;
  path(x, pts, true);
  x.fill();
  if (edge) { x.lineWidth = lw; x.strokeStyle = edge; x.stroke(); }
}
function fillPoly(x, pts, color, a) {
  x.globalAlpha = Math.min(1, a);
  x.fillStyle = color;
  path(x, pts, true);
  x.fill();
}
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
// ジグザグの 線（いなずまの ふち）。seed ごとに おなじ かたち
function zig(x0, y0, x1, y1, n, amp, seed) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const pts = [[x0, y0]];
  for (let i = 1; i < n; i++) {
    const s = i / n, j = (hash(seed + i * 7.3) - 0.5) * 2 * amp;
    pts.push([x0 + dx * s + nx * j, y0 + dy * s + ny * j]);
  }
  pts.push([x1, y1]);
  return pts;
}

// うごく みち: x0,y0 → x1,y1（hop … とびはねる 高さ、bounces … はねる かず）か pts（[[x,y],…] を じゅんに。hops … くぎりごとの 高さ）
export function pathPos(p, age = p.age) {
  const travel = p.travel || 0;
  if (!(travel > 0)) return [p.x0 ?? p.x, p.y0 ?? p.y, 1];
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

// ───────────── マリオ・3年B組 の 小さな え（g4Obj の shape） ─────────────
const OUT = '#2a1408';
const OBJ = {
  star(x, p, a) {
    const col = p.rainbow ? `hsl(${Math.floor(p.age * 0.9) % 360},100%,62%)` : p.color || '#ffd800';
    x.globalAlpha = a;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 0.48 : 1;
      i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r) : x.moveTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    x.closePath();
    x.fillStyle = col; x.fill();
    x.lineWidth = 0.12; x.strokeStyle = p.edge || '#c85a00'; x.stroke();
    x.fillStyle = '#1a1008';
    ell(x, -0.17, -0.02, 0.07, 0.19); x.fill();
    ell(x, 0.17, -0.02, 0.07, 0.19); x.fill();
  },
  mush(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#f8e8c8';
    rrect(x, -0.52, -0.05, 1.04, 0.85, 0.25); x.fill();
    x.lineWidth = 0.1; x.strokeStyle = OUT; x.stroke();
    x.fillStyle = '#1a1008';
    x.fillRect(-0.24, 0.12, 0.11, 0.3); x.fillRect(0.13, 0.12, 0.11, 0.3);
    x.beginPath(); x.ellipse(0, 0.02, 1, 0.92, 0, Math.PI, TAU); x.closePath();
    x.fillStyle = p.color || '#e83a2a'; x.fill(); x.stroke();
    x.fillStyle = p.color2 || '#ffffff';
    for (const [sx, sy, r] of [[0, -0.55, 0.27], [-0.66, -0.22, 0.2], [0.66, -0.22, 0.2]]) { ell(x, sx, sy, r, r * 0.9); x.fill(); }
  },
  shell(x, p, a) {
    x.globalAlpha = a;
    const ph = (p.age / 60) % 1;
    x.fillStyle = '#fff6e0';
    rrect(x, -1, 0.05, 2, 0.42, 0.2); x.fill();
    x.lineWidth = 0.1; x.strokeStyle = OUT; x.stroke();
    x.beginPath(); x.ellipse(0, 0.1, 0.95, 0.95, 0, Math.PI, TAU); x.closePath();
    x.fillStyle = p.color || '#2ab84a'; x.fill(); x.stroke();
    x.strokeStyle = p.color2 || '#d8ffd8'; x.lineWidth = 0.09;
    for (let i = -1; i <= 1; i++) {
      const cx = ((i + ph + 1.5) % 3 - 1.5) * 0.55;
      if (Math.abs(cx) > 0.75) continue;
      x.beginPath();
      for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; const px = cx + Math.cos(an) * 0.24, py = -0.42 + Math.sin(an) * 0.22; k ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.closePath(); x.stroke();
    }
  },
  block(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = p.color || '#3a62e8';
    rrect(x, -1, -1, 2, 2, 0.25); x.fill();
    x.lineWidth = 0.14; x.strokeStyle = '#e8f0ff'; x.stroke();
    x.fillStyle = '#ffffff';
    x.font = 'bold 10px sans-serif';
    x.save(); x.scale(0.075, 0.075);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(p.text || 'POW', 0, 0.05);
    x.restore();
  },
  coin(x, p, a) {
    const w = 0.12 + 0.55 * Math.abs(Math.cos(p.age / 70 + (p.seed || 0)));
    x.globalAlpha = a;
    ell(x, 0, 0, w, 0.85); x.fillStyle = '#ffc81a'; x.fill();
    x.lineWidth = 0.1; x.strokeStyle = '#a05a00'; x.stroke();
    x.fillStyle = '#fff6b0'; x.fillRect(-w * 0.2, -0.5, w * 0.4, 1);
  },
  fireball(x, p, a) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 2.2, p.glow || '#ff7a1a', a * 0.8);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    disc(x, 0, 0, 1, p.color || '#ff5a10');
    disc(x, 0.15, -0.15, 0.62, '#ffb030');
    disc(x, 0.22, -0.22, 0.3, '#fff2a0');
  },
  hammer(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#8a5a2a'; x.fillRect(-0.15, -0.2, 0.3, 1.3);
    x.fillStyle = p.color || '#9aa4b8';
    rrect(x, -0.85, -0.95, 1.7, 0.8, 0.15); x.fill();
    x.lineWidth = 0.1; x.strokeStyle = OUT; x.stroke();
    x.fillStyle = '#e8eef8'; x.fillRect(-0.75, -0.85, 1.5, 0.18);
  },
  egg(x, p, a) {
    x.globalAlpha = a;
    ell(x, 0, 0, 0.78, 1); x.fillStyle = '#fffaf0'; x.fill();
    x.lineWidth = 0.1; x.strokeStyle = OUT; x.stroke();
    x.fillStyle = p.color || '#3ac83a';
    for (const [sx, sy, r] of [[-0.3, -0.35, 0.22], [0.32, 0.05, 0.25], [-0.2, 0.5, 0.18], [0.28, -0.62, 0.13]]) { ell(x, sx, sy, r, r); x.fill(); }
  },
  flower(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#2ab84a'; x.fillRect(-0.1, 0.3, 0.2, 0.9);
    ell(x, -0.35, 0.8, 0.35, 0.15, -0.4); x.fill(); ell(x, 0.35, 0.8, 0.35, 0.15, 0.4); x.fill();
    const fl = Math.floor(p.age / 70) % 2;
    for (const [rx, ry, col] of [[0.9, 0.62, fl ? '#ffffff' : '#ff3a1a'], [0.68, 0.45, '#ff9a1a'], [0.46, 0.3, '#ffe85a']]) { ell(x, 0, 0, rx, ry); x.fillStyle = col; x.fill(); }
    x.fillStyle = '#1a1008'; x.fillRect(-0.18, -0.12, 0.08, 0.22); x.fillRect(0.1, -0.12, 0.08, 0.22);
  },
  pipe(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#1e9a2e'; x.fillRect(-0.8, -0.2, 1.6, 2.6);
    x.fillStyle = '#5ae06a'; x.fillRect(-0.6, -0.2, 0.25, 2.6);
    x.fillStyle = '#0e5a18'; x.fillRect(0.5, -0.2, 0.2, 2.6);
    x.fillStyle = '#22b034'; rrect(x, -1, -0.65, 2, 0.5, 0.08); x.fill();
    x.lineWidth = 0.08; x.strokeStyle = '#0a3a10'; x.stroke();
    x.fillStyle = '#7af08a'; x.fillRect(-0.85, -0.58, 0.3, 0.36);
  },
  kart(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#1a1a22'; ell(x, -0.7, 0.45, 0.32, 0.32); x.fill(); ell(x, 0.75, 0.45, 0.36, 0.36); x.fill();
    x.fillStyle = p.color || '#e83a2a'; rrect(x, -1.1, -0.2, 2.2, 0.6, 0.2); x.fill();
    x.lineWidth = 0.08; x.strokeStyle = OUT; x.stroke();
    x.fillStyle = '#ffd23a'; x.fillRect(0.7, -0.15, 0.35, 0.18);
    x.fillStyle = '#f8d8b0'; ell(x, -0.15, -0.55, 0.3, 0.3); x.fill();
    x.fillStyle = p.color2 || '#e83a2a'; x.beginPath(); x.ellipse(-0.15, -0.62, 0.34, 0.24, 0, Math.PI, TAU); x.fill(); x.fillRect(-0.15, -0.66, 0.5, 0.08);
  },
  foot(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = p.color || '#8a3a1a';
    x.beginPath(); x.moveTo(-0.9, -1.4); x.lineTo(0.2, -1.4); x.lineTo(0.3, -0.2); x.quadraticCurveTo(1.2, -0.3, 1.2, 0.3); x.lineTo(1.2, 0.5); x.lineTo(-1.0, 0.5); x.closePath(); x.fill();
    x.lineWidth = 0.08; x.strokeStyle = OUT; x.stroke();
    x.fillStyle = '#3a1a08'; x.fillRect(-1.0, 0.35, 2.2, 0.15);
    x.fillStyle = p.color2 || '#3a5ae8'; x.fillRect(-0.95, -2.2, 1.2, 0.85);
  },
  runner(x, p, a) {
    // はしる / とぶ 人の かげ（frame … 足の うごき、jump … とぶ かっこう）
    x.globalAlpha = a;
    x.fillStyle = p.color || '#1a1420';
    const f = p.jump ? 2 : Math.floor(p.age / 90) % 2;
    ell(x, 0, -1.55, 0.42, 0.42); x.fill();
    if (p.cap) { x.fillStyle = p.cap; x.beginPath(); x.ellipse(0, -1.65, 0.46, 0.32, 0, Math.PI, TAU); x.fill(); x.fillRect(0, -1.7, 0.62, 0.12); x.fillStyle = p.color || '#1a1420'; }
    if (p.hair) { x.beginPath(); x.moveTo(-0.4, -1.7); x.quadraticCurveTo(-0.9, -1.0, -0.6, -0.5); x.lineTo(-0.2, -1.2); x.fill(); }
    rrect(x, -0.35, -1.12, 0.7, 1.15, 0.2); x.fill();
    x.strokeStyle = p.color || '#1a1420'; x.lineWidth = 0.26; x.lineCap = 'round';
    const L = f === 2 ? [[-0.2, 0, -0.65, 0.5], [0.2, 0, 0.6, 0.35]] : f ? [[-0.2, 0, -0.6, 0.8], [0.2, 0, 0.45, 0.85]] : [[-0.2, 0, 0.1, 0.9], [0.2, 0, 0.5, 0.6]];
    const A = f === 2 ? [[-0.3, -0.95, -0.75, -1.6], [0.3, -0.95, 0.75, -1.6]] : f ? [[-0.3, -0.9, -0.75, -0.4], [0.3, -0.9, 0.65, -1.3]] : [[-0.3, -0.9, -0.6, -1.3], [0.3, -0.9, 0.75, -0.45]];
    for (const [a0, b0, a1, b1] of [...L, ...A]) { x.beginPath(); x.moveTo(a0, b0); x.lineTo(a1, b1); x.stroke(); }
  },
  chalk(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#ffffff'; rrect(x, -1, -0.22, 2, 0.44, 0.18); x.fill();
    x.fillStyle = '#d8d8e0'; x.fillRect(0.6, -0.22, 0.12, 0.44);
  },
  book(x, p, a) {
    const op = clamp01((p.age - (p.openAt || 0)) / 200);
    x.globalAlpha = a;
    x.fillStyle = '#1a2a3a';
    rrect(x, -1.1 - op * 0.9, -0.75, 1.1 + op * 0.9, 1.5, 0.08); x.fill();
    rrect(x, 0, -0.75, 1.1 + op * 0.9 * 0, 1.5, 0.08); x.fill();
    if (op > 0) {
      x.fillStyle = '#fbf6e8';
      x.fillRect(-1.85 * op, -0.65, 1.8 * op, 1.3); x.fillRect(0.05, -0.65, 0.95, 1.3);
      x.fillStyle = '#4a6a8a';
      for (let i = 0; i < 5; i++) { x.fillRect(-1.7 * op, -0.5 + i * 0.25, 1.5 * op, 0.05); x.fillRect(0.15, -0.5 + i * 0.25, 0.75, 0.05); }
    }
  },
  house(x, p, a) {
    const op = clamp01((p.age - (p.openAt || 0)) / 260);
    x.globalAlpha = a;
    x.fillStyle = '#c8603a'; x.beginPath(); x.moveTo(-1.25, -0.2); x.lineTo(0, -1.25); x.lineTo(1.25, -0.2); x.closePath(); x.fill();
    x.fillStyle = '#f4e4c8'; x.fillRect(-1, -0.2, 2, 1.3);
    x.lineWidth = 0.08; x.strokeStyle = OUT; x.strokeRect(-1, -0.2, 2, 1.3);
    x.fillStyle = '#ffd86a'; x.fillRect(0.35, 0.05, 0.4, 0.35);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, -0.25, 0.55, 1.4 * op + 0.01, '#ffb84a', a * op);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = '#fff2c0'; x.fillRect(-0.55, 0.15, 0.6, 0.95);
    x.fillStyle = '#7a4a2a'; x.fillRect(-0.55, 0.15, 0.6 * (1 - op * 0.85), 0.95);
  },
  tube(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = '#1a1a2a'; rrect(x, -1.2, -0.28, 2.4, 0.56, 0.25); x.fill();
    x.fillStyle = '#d8a83a'; x.fillRect(-1.0, -0.28, 0.14, 0.56); x.fillRect(0.86, -0.28, 0.14, 0.56);
    x.fillStyle = '#e83a4a'; x.fillRect(-0.1, -0.3, 0.2, 0.6);
  },
  clock(x, p, a) {
    x.globalAlpha = a;
    disc(x, 0, 0, 1, '#e8e8f0');
    x.lineWidth = 0.14; x.strokeStyle = '#5a5a6a'; x.beginPath(); x.arc(0, 0, 1, 0, TAU); x.stroke();
    x.lineWidth = 0.12; x.strokeStyle = '#2a2a3a';
    const an = -Math.PI / 2 + Math.min(1, p.age / 600) * 0.6;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -0.7); x.moveTo(0, 0); x.lineTo(Math.cos(an) * 0.5, Math.sin(an) * 0.5); x.stroke();
  },
  spanner(x, p, a) {
    x.globalAlpha = a;
    x.fillStyle = p.color || '#b8c0d0';
    x.fillRect(-0.16, -0.5, 0.32, 1.6);
    x.beginPath(); x.arc(0, -0.75, 0.48, 0, TAU); x.fill();
    x.fillStyle = '#e8eef8'; x.fillRect(-0.06, -0.4, 0.1, 1.3);
    x.globalCompositeOperation = 'destination-out';
    x.fillRect(-0.18, -1.3, 0.36, 0.55);
  },
};
export const G4_SHAPES = Object.keys(OBJ);

// ───────────── つぶの かきかた ─────────────
export const AX_G4_FINE = {
  // マリオ・3年B組の もの（shape）。うごきは pathPos、spin … まわる、pop … ふくらむ ms、trail … ざんぞうの かず、glow … うしろの ひかり
  g4Obj(x, p) {
    const a = envOf(p, 60, 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = OBJ[p.shape];
    if (!draw) return;
    if (p.cols) p.color = p.cols[Math.floor(p.age / (p.colMs || 60)) % p.cols.length];
    const s = p.s || 6;
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    x.save();
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      for (let i = p.trail; i >= 1; i--) {
        const [tx, ty, te] = pathPos(p, p.age - i * 26);
        if (te <= 0 || te >= 1) continue;
        softGlow(x, tx, ty, s * (1.6 - i * 0.18), p.glow || '#ffffff', a * 0.5 / i);
      }
    }
    const [cx, cy] = pathPos(p);
    x.translate(cx, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * 2.2, p.glow, a * 0.55); }
    x.globalCompositeOperation = 'source-over';
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000);
    const sq = p.squash ? 1 + 0.25 * Math.sin(p.age / 50) : 1;
    x.scale(s * sc * (p.flip ? -1 : 1) * sq, s * sc / sq);
    // ふちどり（明るい はいけいでも 人の かたちが わかる）
    if (p.outline) {
      x.save();
      x.translate(0, -0.7); x.scale(1.16, 1.12); x.translate(0, 0.7);
      draw(x, { ...p, color: p.outline, cap: p.cap ? p.outline : null, cols: null, rainbow: false }, a * 0.9);
      x.restore();
    }
    draw(x, p, a);
    x.restore();
  },
  // 文字（カタカナ・ひらがな・記号・ローマ字）。bubble … ふきだしの 色
  g4Text(x, p) {
    const a = envOf(p, 40, 180);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / 180)) * (p.s || 1);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate(p.rot || 0);
    x.scale(sc, sc);
    x.font = `bold ${p.size || 12}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    if (p.bubble) {
      const mw = x.measureText(p.text)?.width;
      const w = (Number.isFinite(mw) ? mw : p.text.length * (p.size || 12)) + 8, h = (p.size || 12) + 6;
      x.fillStyle = p.edge || '#2a1a10';
      rrect(x, -w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 5); x.fill();
      x.fillStyle = p.bubble;
      rrect(x, -w / 2, -h / 2, w, h, 4); x.fill();
      x.beginPath(); x.moveTo(-3, h / 2 - 0.5); x.lineTo(3, h / 2 - 0.5); x.lineTo(-4, h / 2 + 5); x.fill();
    } else {
      x.lineWidth = 3;
      x.strokeStyle = p.edge || '#2a1a10';
      x.strokeText(p.text, 0, 0.5);
    }
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(p.text, 0, 0.5);
    x.restore();
  },
  // 竜の 紋章（ダイの ひたい・竜の騎士）。s … 大きさ、color … ひかり、core … しん。ふくらんで どくん どくん
  g4Crest(x, p) {
    const a = envOf(p, 120, 220) * (p.alpha ?? 1);
    if (a <= 0) return;
    const s = (p.s || 10) * (p.pop ? backOut(clamp01(p.age / p.pop)) : 1) * (1 + 0.06 * Math.sin(p.age / 60));
    const [cx, cy] = p.travel ? pathPos(p) : [p.x, p.y];
    x.save();
    x.translate(cx, cy);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 3, p.color || '#5ad0ff', a * 0.8);
    x.scale(s, s);
    const col = p.color || '#5ad0ff', core = p.core || '#ffffff';
    // ほね ぐみ: まん中の しずく・上の とげ・2本の つの・よこの つばさ
    const gem = [[0, -0.45], [0.36, 0.12], [0, 1.05], [-0.36, 0.12]];
    const spike = [[0, -0.5], [0.12, -0.6], [0, -1.35], [-0.12, -0.6]];
    const horn = (sx) => [[0.18 * sx, -0.3], [0.55 * sx, -0.55], [0.95 * sx, -1.25], [0.78 * sx, -0.62], [0.42 * sx, -0.12]];
    const wing = (sx) => [[0.36 * sx, 0.05], [1.2 * sx, -0.05], [0.95 * sx, 0.2], [1.05 * sx, 0.42], [0.42 * sx, 0.42]];
    const edge = p.edge || '#0a2a5a';
    for (const pts of [gem, spike, horn(1), horn(-1), wing(1), wing(-1)]) shapeFill(x, pts, col, edge, a * 0.95, 0.12);
    x.globalCompositeOperation = 'lighter';
    fillPoly(x, [[0, -0.2], [0.18, 0.15], [0, 0.7], [-0.18, 0.15]], core, a);
    for (const pts of [horn(1), horn(-1)]) fillPoly(x, pts.slice(1, 4), core, a * 0.45);
    x.restore();
  },
  // ロトの しるし（金の 鳥。つばさを 上に ひろげる）。flap … はばたき
  g4Loto(x, p) {
    const a = envOf(p, 140, 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const s = (p.s || 12) * (p.pop ? backOut(clamp01(p.age / p.pop)) : 1);
    const col = p.color || '#ffd23a', core = p.core || '#fff6c8';
    const fl = (p.flap || 0) * Math.sin(p.age / 120);
    const [cx, cy] = p.travel ? pathPos(p) : [p.x, p.y];
    x.save();
    x.translate(cx, cy);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 3.2, p.glow || col, a * 0.75);
    x.scale(s, s);
    for (const sx of [1, -1]) {
      for (let f = 0; f < 4; f++) {
        const an = (-0.35 - f * 0.32 - fl) * sx;
        const L = 1.6 - f * 0.18;
        const bx = 0.15 * sx, by = -0.1 + f * 0.08;
        const tx = bx + Math.sin(an) * L, ty = by - Math.cos(an) * L * 0.95;
        const nx = Math.cos(an) * 0.2 * sx, ny = Math.sin(an) * 0.2;
        shapeFill(x, [[bx, by], [lerp(bx, tx, 0.5) + nx * sx, lerp(by, ty, 0.5) + ny], [tx, ty], [lerp(bx, tx, 0.55) - nx * sx * 0.5, lerp(by, ty, 0.55) - ny * 0.5]], f % 2 ? core : col, p.edge || '#6a3a00', a * (0.95 - f * 0.08), 0.07);
      }
    }
    // からだ・あたま・くちばし・しっぽ
    const ed = p.edge || '#6a3a00';
    for (const k of [-1, 0, 1]) shapeFill(x, [[0, 0.6], [0.12 + k * 0.32, 1.5 - Math.abs(k) * 0.15], [k * 0.32 - 0.1, 1.42 - Math.abs(k) * 0.15]], k ? col : core, ed, a * 0.95, 0.07);
    shapeFill(x, [[0, -0.55], [0.25, -0.1], [0.18, 0.55], [0, 0.75], [-0.18, 0.55], [-0.25, -0.1]], col, ed, a, 0.08);
    x.globalAlpha = a; x.fillStyle = core; ell(x, 0, -0.72, 0.2, 0.22); x.fill(); x.lineWidth = 0.07; x.strokeStyle = ed; x.stroke();
    shapeFill(x, [[0, -0.95], [0.1, -1.12], [-0.02, -1.05]], col, ed, a, 0.05);
    x.restore();
  },
  // 竜の あたま（よこがお。ang の むきに 口を あける）。open … あごの ひらき（0〜1）
  g4Dragon(x, p) {
    const a = envOf(p, 100, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    let cx = p.x, cy = p.y;
    if (p.travel) [cx, cy] = pathPos(p);
    const s = (p.s || 12) * (p.pop ? backOut(clamp01(p.age / p.pop)) : 1);
    const op = p.openAt !== undefined ? clamp01((p.age - p.openAt) / 160) * (p.open ?? 1) : (p.open ?? 0.6);
    const col = p.color || '#5ad0ff', glow = p.glow || col, core = p.core || '#ffffff';
    x.save();
    x.translate(cx, cy);
    x.rotate(p.ang || 0);
    if (Math.cos(p.ang || 0) < -0.01 && !p.noFlip) x.scale(1, -1);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 2.6, glow, a * 0.7);
    x.scale(s, s);
    const jaw = op * 0.55;
    const ed = p.edge || '#0a1a3a', lw = 0.09;
    const F = (pts, c2, al = 0.95) => shapeFill(x, pts, c2, ed, a * al, lw);
    // つの と たてがみ（うしろ）
    F([[-0.9, -0.7], [-2.0, -1.45], [-1.25, -0.5]], core);
    F([[-0.4, -0.78], [-1.3, -1.6], [-0.75, -0.62]], col);
    for (let i = 0; i < 3; i++) F([[-1.45 + i * 0.05, -0.1 + i * 0.25], [-2.1 - i * 0.1, 0.0 + i * 0.35], [-1.45, 0.15 + i * 0.25]], col, 0.85);
    // 下あご（ひらく）
    x.save();
    x.translate(-1.0, 0.05);
    x.rotate(jaw);
    for (let i = 0; i < 3; i++) F([[0.9 + i * 0.4, 0.1], [1.0 + i * 0.4, -0.18], [1.1 + i * 0.4, 0.1]], core);
    F([[0, 0], [1.9, 0.08], [2.15, 0.22], [1.2, 0.45], [0.1, 0.5]], col);
    x.restore();
    // 上あご（はなさき が +x）と うわの きば
    for (let i = 0; i < 3; i++) F([[0.2 + i * 0.4, -0.06], [0.3 + i * 0.4, 0.22], [0.4 + i * 0.4, -0.06]], core);
    F([[-1.5, -0.2], [-1.1, -0.75], [-0.3, -0.8], [0.5, -0.55], [1.35, -0.35], [1.45, -0.12], [0.6, -0.05], [-0.2, 0]], col);
    x.globalCompositeOperation = 'lighter';
    fillPoly(x, [[-1.0, -0.62], [-0.3, -0.7], [0.6, -0.45], [1.2, -0.3], [0.4, -0.38], [-0.4, -0.5]], core, a * 0.5);
    // 目
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a; x.fillStyle = p.eye || '#ffffff';
    ell(x, -0.35, -0.48, 0.2, 0.09, -0.25); x.fill();
    x.fillStyle = ed; ell(x, -0.3, -0.48, 0.06, 0.07); x.fill();
    x.globalCompositeOperation = 'lighter';
    // 口の 中の ひかり
    if (op > 0.05) softGlow(x, 0.9, 0.2, 1.1 * op, core, a * op);
    x.restore();
  },
  // 剣（つかを 中心に ふる）。ang0 → ang1 を swing ms で。len … 刃の ながさ（grow ms で のびる）、elec … いなずまを まとう、loto … つばに 金の つばさ
  g4Blade(x, p) {
    const a = envOf(p, 60, 180) * (p.alpha ?? 1);
    if (a <= 0) return;
    const sw = clamp01((p.age - (p.swingAt || 0)) / Math.max(1, p.swing || 1));
    const ang = lerp(p.ang0 ?? -Math.PI / 2, p.ang1 ?? p.ang0 ?? -Math.PI / 2, p.swing ? easeIn(sw) * 0.3 + easeOut(sw) * 0.7 : 0);
    const len = (p.len || 30) * (p.grow ? lerp(p.len0 ?? 0.3, 1, easeOut(clamp01(p.age / p.grow))) : 1);
    const w = p.w || 3;
    const col = p.color || '#9ad8ff', glow = p.glow || col, core = p.core || '#ffffff';
    let cx = p.x, cy = p.y;
    if (p.travel) [cx, cy] = pathPos(p);
    x.save();
    x.translate(cx, cy);
    // ふった あと（弧の ざんぞう）
    if (p.swing && sw > 0 && p.trail !== false) {
      const a0 = p.ang0 ?? 0;
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.45 * a * (1 - clamp01((p.age - (p.swingAt || 0) - p.swing) / 260));
      x.fillStyle = glow;
      x.beginPath();
      x.arc(0, 0, len, a0, ang, p.ang1 < a0);
      x.arc(0, 0, len * 0.35, ang, a0, !(p.ang1 < a0));
      x.closePath(); x.fill();
    }
    x.rotate(ang);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, len * 0.55, 0, len * 0.75, glow, a * 0.55);
    // 刃
    const blade = [[w * 1.2, -w * 0.5], [len - w * 2.2, -w * 0.5], [len, 0], [len - w * 2.2, w * 0.5], [w * 1.2, w * 0.5]];
    x.globalCompositeOperation = 'source-over';
    fillPoly(x, blade, p.steel || '#d8e4f0', a);
    x.globalCompositeOperation = 'lighter';
    fillPoly(x, blade, col, a * 0.7);
    fillPoly(x, [[w * 1.2, -w * 0.12], [len - w * 2, -w * 0.12], [len - w * 0.6, 0], [len - w * 2, w * 0.12], [w * 1.2, w * 0.12]], core, a);
    softGlow(x, len, 0, w * 3.5, core, a);
    // つば・つか
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = p.hilt || '#ffd23a';
    if (p.loto) {
      for (const sy of [1, -1]) fillPoly(x, [[w * 1.2, 0], [w * 0.2, sy * w * 3.2], [w * 1.6, sy * w * 2.6], [w * 2.0, sy * w * 0.6]], p.hilt || '#ffd23a', a);
      disc(x, w * 1.2, 0, w * 0.6, '#3a8aff');
    } else x.fillRect(w * 0.9, -w * 1.8, w * 0.7, w * 3.6);
    x.fillStyle = '#6a3a1a'; x.fillRect(-w * 2.2, -w * 0.4, w * 3.1, w * 0.8);
    disc(x, -w * 2.3, 0, w * 0.55, p.hilt || '#ffd23a');
    // いなずまを まとう
    if (p.elec) {
      const seed = Math.floor(p.age / 50) * 13 + (p.seed || 0);
      glowStroke(x, zig(w, -w, len, 0, 8, w * 1.4, seed), Math.max(0.6, w * 0.3), p.elecGlow || '#ffe040', p.elecCol || '#fff6b0', '#ffffff', a);
      glowStroke(x, zig(w, w, len * 0.9, 0, 7, w * 1.4, seed + 5), Math.max(0.5, w * 0.25), p.elecGlow || '#ffe040', p.elecCol || '#fff6b0', '#ffffff', a * 0.8);
    }
    x.restore();
  },
  // まっすぐな 斬げきの 光（x0,y0 → x1,y1 へ grow ms で のびる）。zig … いなずまの ふち
  g4Cleave(x, p) {
    const a = envOf(p, 20, Math.max(120, p.life * 0.5)) * (p.alpha ?? 1);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / Math.max(1, p.grow || 80)));
    const x1 = lerp(p.x0, p.x1, k), y1 = lerp(p.y0, p.y1, k);
    const fat = 1 + 0.8 * clamp01((p.age - (p.grow || 80)) / 120) * (1 - clamp01((p.age - (p.grow || 80) - 120) / 300));
    const w = (p.w || 4) * fat;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0), nx = -Math.sin(ang), ny = Math.cos(ang);
    x.save();
    x.globalCompositeOperation = 'lighter';
    const mx = (p.x0 + x1) / 2, my = (p.y0 + y1) / 2;
    // 細長い ひし形（まん中が ふとい）
    const dia = (ww) => [[p.x0, p.y0], [mx + nx * ww, my + ny * ww], [x1, y1], [mx - nx * ww, my - ny * ww]];
    fillPoly(x, dia(w * 2.6), p.glow || '#9ad8ff', a * 0.3);
    if (p.edge !== false) { x.globalCompositeOperation = 'source-over'; fillPoly(x, dia(w * 1.35), p.edge || p.glow || '#2a6ab0', a * 0.55); x.globalCompositeOperation = 'lighter'; }
    fillPoly(x, dia(w), p.color || '#e8f6ff', a * 0.9);
    fillPoly(x, dia(w * 0.4), p.core || '#ffffff', a);
    if (p.zig) {
      const seed = Math.floor(p.age / 45) * 11 + (p.seed || 0);
      for (const sd of [1, -1]) glowStroke(x, zig(p.x0 + nx * w * sd, p.y0 + ny * w * sd, x1 + nx * w * sd * 0.3, y1 + ny * w * sd * 0.3, 9, w * 0.9, seed + sd * 3), 0.9, p.zigGlow || '#ffe040', p.zigCol || '#fff6b0', '#ffffff', a * 0.9);
    }
    x.restore();
  },
  // アバンストラッシュの「A」（ひだりの 足 → みぎの 足 → よこ 線 の じゅんに かいて、ほしが ひかる）
  g4AStrash(x, p) {
    const a = envOf(p, 10, 300);
    if (a <= 0) return;
    const s = p.s || 30;
    const sw = p.swing || 240;
    const u = (k) => clamp01((p.age - k * sw / 3) / (sw / 3));
    const grow = 1 + 0.15 * clamp01((p.age - sw) / (p.life - sw));
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.rot || 0);
    x.scale(grow, grow);
    const apex = [0, -s], L = [-s * 0.72, s * 0.85], R = [s * 0.72, s * 0.85];
    const segs = [[L, apex, u(0)], [apex, R, u(1)], [[-s * 0.48, s * 0.2], [s * 0.6, s * 0.12], u(2)]];
    const col = p.color || '#ffe08a', glow = p.glow || '#ffb020', core = p.core || '#ffffff';
    for (const [[ax0, ay0], [ax1, ay1], k] of segs) {
      if (k <= 0) continue;
      const ex = lerp(ax0, ax1, easeOut(k)), ey = lerp(ay0, ay1, easeOut(k));
      const ang = Math.atan2(ey - ay0, ex - ax0), nx = -Math.sin(ang), ny = Math.cos(ang);
      const w = (p.w || 5);
      const mx = (ax0 + ex) / 2, my = (ay0 + ey) / 2;
      const dia = (ww) => [[ax0, ay0], [mx + nx * ww, my + ny * ww], [ex, ey], [mx - nx * ww, my - ny * ww]];
      x.globalCompositeOperation = 'lighter';
      fillPoly(x, dia(w * 2.4), glow, a * 0.35);
      x.globalCompositeOperation = 'source-over';
      fillPoly(x, dia(w * 1.45), p.edge || '#b05a00', a * 0.8);
      x.globalCompositeOperation = 'lighter';
      fillPoly(x, dia(w), col, a * 0.95);
      fillPoly(x, dia(w * 0.38), core, a);
      softGlow(x, ex, ey, w * 3, core, a * 0.8);
    }
    // てっぺんの ほし（4本の ひかり）
    const st = clamp01((p.age - sw) / 120) * a;
    if (st > 0) {
      const r = s * (0.55 + 0.25 * Math.sin(p.age / 70));
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, -s, r * 1.2, glow, st);
      x.fillStyle = core; x.globalAlpha = st;
      x.beginPath();
      for (let i = 0; i < 8; i++) { const an = (i / 8) * TAU + p.age / 600, rr = i % 2 ? r * 0.14 : r; i ? x.lineTo(Math.cos(an) * rr, -s + Math.sin(an) * rr) : x.moveTo(Math.cos(an) * rr, -s + Math.sin(an) * rr); }
      x.closePath(); x.fill();
    }
    x.restore();
  },
  // 大きな 十字の 光（たて → よこ。h2 … よこが 出る ms）。elec … いなずまの ふち
  g4Cross(x, p) {
    const a = envOf(p, 20, 360) * (p.alpha ?? 1);
    if (a <= 0) return;
    const s = p.s || 40, w = p.w || 5;
    const kv = easeOut(clamp01(p.age / 90)), kh = easeOut(clamp01((p.age - (p.h2 ?? 180)) / 90));
    const end = clamp01((p.age - (p.boomAt ?? p.life * 0.55)) / 300);
    const sc = 1 + end * 0.35;
    const col = p.color || '#ffd23a', glow = p.glow || col, core = p.core || '#ffffff';
    x.save();
    x.translate(p.x, p.y);
    x.scale(sc, sc);
    x.globalCompositeOperation = 'lighter';
    const bar = (vert, k) => {
      if (k <= 0) return;
      const L = s * k;
      // はばが そろった 棒（はしだけ とがる）。たては 上から、よこは 左から のびる
      const len2 = 2 * L, tip = Math.min(len2 / 2, w * 2.2);
      const dia = (ww2) => {
        const pts = [[0, 0], [tip, -ww2], [len2 - tip, -ww2], [len2, 0], [len2 - tip, ww2], [tip, ww2]];
        return vert ? pts.map(([u, v]) => [v, -s + u]) : pts.map(([u, v]) => [-s + u, v]);
      };
      fillPoly(x, dia(w * 2.8), glow, a * 0.3);
      x.globalCompositeOperation = 'source-over';
      fillPoly(x, dia(w * 1.4), p.edge || glow, a * 0.6);
      x.globalCompositeOperation = 'lighter';
      fillPoly(x, dia(w), col, a * 0.95);
      fillPoly(x, dia(w * 0.4), core, a);
    };
    bar(true, kv);
    bar(false, kh);
    if (kh > 0.5) softGlow(x, 0, 0, s * 0.7 * (1 + end), core, a);
    if (p.elec && kv > 0) {
      const seed = Math.floor(p.age / 45) * 7 + (p.seed || 0);
      glowStroke(x, zig(0, -s, 0, -s + 2 * s * kv, 10, w * 1.6, seed), 0.9, glow, col, core, a * 0.8);
      if (kh > 0) glowStroke(x, zig(-s, 0, -s + 2 * s * kh, 0, 10, w * 1.6, seed + 3), 0.9, glow, col, core, a * 0.8);
    }
    x.restore();
  },
  // メドローアの 光の 弓（x,y … にぎり、ang … ねらう むき、s … 大きさ）。左が ほのお（赤）、右が こおり（青）、矢は 白むらさき
  g4Bow(x, p) {
    const a = envOf(p, 120, 160);
    if (a <= 0) return;
    const s = p.s || 16;
    const pull = easeOut(clamp01(p.age / Math.max(1, p.draw || 260)));
    const shot = p.age > (p.shootAt ?? 1e9);
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.ang || -Math.PI / 2);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 1.8, '#c8a8ff', a * 0.6);
    // 弓（2つの 弧）
    const arc = (sgn, col) => {
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([Math.sin(u * Math.PI / 2) * -0.0 + (1 - Math.pow(u, 2)) * s * 0.35, sgn * u * s]); }
      glowStroke(x, pts, 2.2, col, col, '#ffffff', a);
    };
    arc(-1, '#ff5a2a');
    arc(1, '#3aa8ff');
    // つる（ひく）
    const back = shot ? 0 : -s * 0.75 * pull;
    glowStroke(x, [[0, -s], [back, 0], [0, s]], 0.8, '#e8d8ff', '#ffffff', '#ffffff', a * 0.9);
    // 矢
    if (!shot) {
      glowStroke(x, [[back, 0], [s * 0.9, 0]], 1.6, '#c8a8ff', '#f0e8ff', '#ffffff', a);
      fillPoly(x, [[s * 1.05, 0], [s * 0.8, -3], [s * 0.85, 0], [s * 0.8, 3]], '#ffffff', a);
      softGlow(x, s, 0, 6, '#ffffff', a);
    }
    x.restore();
  },
  // 光の 矢（x0,y0 → x1,y1 を travel ms で。ながい しっぽ）
  g4Arrow(x, p) {
    const e = clamp01(p.age / Math.max(1, p.travel));
    const a = clamp01((p.life - p.age) / 120);
    if (a <= 0 || e >= 1) return;
    const hx = lerp(p.x0, p.x1, easeIn(e) * 0.4 + e * 0.6), hy = lerp(p.y0, p.y1, easeIn(e) * 0.4 + e * 0.6);
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const tl = p.tail || 60;
    const tx = hx - Math.cos(ang) * tl, ty = hy - Math.sin(ang) * tl;
    x.save();
    glowStroke(x, [[tx, ty], [hx, hy]], p.w || 2.4, p.glow || '#b08aff', p.color || '#e8d8ff', '#ffffff', a);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, hx, hy, 12, '#ffffff', a);
    x.translate(hx, hy); x.rotate(ang);
    fillPoly(x, [[5, 0], [-3, -3.5], [-1, 0], [-3, 3.5]], '#ffffff', a);
    x.restore();
  },
  // 消滅の 白い 球（ふくらむ → しずかに ひかる → ちぢんで きえる）。r … 半径、hold … ひかる ms
  g4Void(x, p) {
    const g = easeOut(clamp01(p.age / 140));
    const hold = p.hold || 360;
    const sh = clamp01((p.age - 140 - hold) / Math.max(1, p.life - 140 - hold));
    const r = p.r * g * (1 - easeIn(sh)) * (1 + 0.03 * Math.sin(p.age / 30));
    if (r <= 0.3) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 2.2, '#b08aff', 0.85);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.96;
    disc(x, p.x, p.y, r, '#fbf8ff');
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#c8a8ff';
    x.lineWidth = 1.6;
    x.globalAlpha = 0.9;
    x.beginPath(); x.arc(p.x, p.y, r, 0, TAU); x.stroke();
    // 中で ゆらめく わ
    x.globalAlpha = 0.5;
    x.lineWidth = 0.8;
    for (let i = 0; i < 2; i++) { x.beginPath(); x.ellipse(p.x, p.y, r * 0.8, r * (0.2 + 0.15 * Math.sin(p.age / 90 + i * 2)), p.age / 400 + i * 1.4, 0, TAU); x.stroke(); }
    x.restore();
  },
  // 竜闘気の つばさ（x,y … せなか。s … 大きさ、flap … はばたき、open … ひらく ms）
  g4Wings(x, p) {
    const a = envOf(p, 140, 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const s = (p.s || 30) * easeOut(clamp01(p.age / (p.open || 260)));
    const fl = (p.flap || 0) * Math.sin((p.age - (p.flapAt || 0)) / (p.flapMs || 140)) * (p.age > (p.flapAt || 0) ? 1 : 0);
    const col = p.color || '#7ad8ff', core = p.core || '#ffffff';
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 1.4, col, a * 0.4);
    for (const sx of [1, -1]) {
      for (let f = 0; f < 6; f++) {
        const an = (-0.2 - f * 0.26 + fl) ;
        const L = s * (1.15 - f * 0.1);
        const bx = sx * 3, by = 0;
        const tx = bx + sx * Math.cos(an) * L, ty = by + Math.sin(an) * L * 0.9;
        const mx = lerp(bx, tx, 0.55), my = lerp(by, ty, 0.55);
        const nx = -Math.sin(an) * s * 0.09 * sx, ny = Math.cos(an) * s * 0.09;
        fillPoly(x, [[bx, by], [mx + nx, my + ny], [tx, ty], [mx - nx, my - ny]], f % 2 ? core : col, a * (0.75 - f * 0.06));
      }
    }
    x.restore();
  },
  // 雷雲の うず（画面の 上。r … 大きさ、spin … まわる、flash … 中が ひかる）
  g4Cloud(x, p) {
    const a = envOf(p, 200, 300) * (p.alpha ?? 1);
    if (a <= 0) return;
    const R = p.r || 70;
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, p.sy || 0.4);
    const rot = p.age / 1000 * (p.spin || 1.2);
    const n = p.n || 16;
    for (let i = 0; i < n; i++) {
      const u = i / n;
      const an = rot + u * TAU * 2.2;
      const rr = R * (0.25 + 0.75 * u);
      const px = Math.cos(an) * rr, py = Math.sin(an) * rr;
      const fl = hash(i * 3.1 + Math.floor(p.age / 70)) < (p.flash ?? 0.12);
      x.globalCompositeOperation = fl ? 'lighter' : 'source-over';
      x.globalAlpha = a * (fl ? 0.45 : 0.85);
      disc(x, px, py, R * (0.22 + 0.12 * hash(i)) * (fl ? 0.7 : 1), fl ? (p.lit || '#c8d8ff') : i % 2 ? (p.color || '#1a1830') : (p.color2 || '#2a2848'));
    }
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, R * 0.45, p.lit || '#c8d8ff', a * (0.5 + 0.4 * Math.sin(p.age / 60)));
    x.restore();
  },
  // 背景（v: storm 雷雲の 空・space むらさきの 宇宙・sunset 夕日と 土手・gold 金の ひかり・dawn しろい ひかり）。a … こさ
  g4Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = envOf(p, 160, 260) * (p.a ?? 0.9);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const bands = (cols, y0 = 0, y1 = H) => {
      const n = cols.length, hh = (y1 - y0) / n;
      cols.forEach((c, i) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(-8, y0 + i * hh - 0.5, W + 16, hh + 1); });
    };
    if (p.v === 'sunset') {
      bands(['#2a1a4a', '#4a2050', '#7a2a48', '#b03a3a', '#e05a2a', '#f8883a', '#ffb050'], -8, 96);
      // 夕日
      x.globalCompositeOperation = 'lighter';
      softGlow(x, p.sx ?? W * 0.5, 92, 70, '#ff9a3a', a * 0.8);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a; disc(x, p.sx ?? W * 0.5, 92, 24, '#ffd070');
      // 川（ひかりの 線）と 土手
      x.fillStyle = '#7a3a3a'; x.fillRect(-8, 92, W + 16, 12);
      x.fillStyle = '#ffb860';
      for (let i = 0; i < 6; i++) { const w = 30 - i * 4, yy = 95 + i * 1.6; x.globalAlpha = a * (0.8 - i * 0.1); x.fillRect((p.sx ?? W * 0.5) - w / 2 + Math.sin(p.age / 200 + i) * 2, yy, w, 0.8); }
      x.globalAlpha = a; x.fillStyle = '#2a1428';
      x.beginPath(); x.moveTo(-8, 104); x.lineTo(W * 0.3, 100); x.lineTo(W * 0.7, 101); x.lineTo(W + 8, 98); x.lineTo(W + 8, H + 8); x.lineTo(-8, H + 8); x.closePath(); x.fill();
    } else if (p.v === 'board') {
      // 黒板（みどり）と 木の わく
      x.globalAlpha = a; x.fillStyle = '#6a4a2a'; x.fillRect(-8, 6, W + 16, 92);
      x.fillStyle = '#1e4a32'; x.fillRect(4, 12, W - 8, 80);
      x.fillStyle = '#2a5a3e';
      for (let i = 0; i < 6; i++) { x.globalAlpha = a * 0.5; x.fillRect(4 + hash(i * 2.3) * (W - 40), 18 + hash(i * 4.1) * 64, 26 + hash(i) * 20, 1.2); }
      x.globalAlpha = a; x.fillStyle = '#8a6a4a'; x.fillRect(-8, 92, W + 16, 4);
    } else if (p.v === 'ground') {
      bands(['#5ab0f0', '#7ac4f8', '#a8dcff'], -8, 70);
      x.globalAlpha = a; x.fillStyle = '#c89a5a'; x.fillRect(-8, 70, W + 16, H);
      x.fillStyle = '#fff8e8';
      for (const yy of [84, 102, 122]) { x.globalAlpha = a * 0.7; x.fillRect(-8, yy, W + 16, 1); }
    } else if (p.v === 'sakura') {
      bands(['#ffd8e8', '#ffe4ee', '#fff0f4', '#ffe4ee', '#f8c8dc']);
    } else if (p.v === 'space') {
      bands(['#08020f', '#140628', '#22083a', '#300c48', '#22083a', '#140628']);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) {
        const sx = hash(i * 1.7) * W, sy = hash(i * 2.9) * H;
        x.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(p.age / 150 + i)));
        x.fillStyle = i % 3 ? '#e8d8ff' : '#ffffff';
        x.fillRect(sx, sy, 1.2, 1.2);
      }
      softGlow(x, p.sx ?? W / 2, p.sy ?? H / 2, 110, '#8a3ae0', a * 0.45);
    } else if (p.v === 'gold' || p.v === 'dawn') {
      bands(p.v === 'gold' ? ['#3a2808', '#5a3a10', '#7a5018', '#5a3a10', '#3a2808'] : ['#c8d8ff', '#e8f0ff', '#fff8e8', '#ffffff', '#fff8e8']);
      x.globalCompositeOperation = 'lighter';
      const cx = p.sx ?? W / 2, cy = p.sy ?? 30;
      x.fillStyle = p.v === 'gold' ? '#ffd23a' : '#ffffff';
      for (let i = 0; i < 14; i++) {
        const an = (i / 14) * TAU + p.age / 2600;
        x.globalAlpha = a * 0.28;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an - 0.09) * 300, cy + Math.sin(an - 0.09) * 300); x.lineTo(cx + Math.cos(an + 0.09) * 300, cy + Math.sin(an + 0.09) * 300); x.closePath(); x.fill();
      }
      softGlow(x, cx, cy, 80, p.v === 'gold' ? '#fff0a0' : '#ffffff', a * 0.7);
    } else {
      // storm: 雷雲の 空
      bands(['#06061a', '#0c0e28', '#141838', '#1a2048', '#202850', '#141838']);
      const fl = hash(Math.floor(p.age / 90) * 3.7 + (p.seed || 0));
      if (fl < 0.22) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * 0.25; x.fillStyle = '#c8d8ff'; x.fillRect(-8, -8, W + 16, H + 16); }
    }
    x.restore();
  },
  // まわる 光の すじ（ほうしゃ。n … かず、r … ながさ）
  g4Rays(x, p) {
    const a = envOf(p, 120, 220) * (p.alpha ?? 0.5);
    if (a <= 0) return;
    const n = p.n || 12, r = (p.r || 60) * (0.6 + 0.4 * easeOut(clamp01(p.age / 300)));
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.age / 1000 * (p.spin || 0.6));
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU, wd = p.wd || 0.08;
      x.globalAlpha = a * (i % 2 ? 0.6 : 1);
      x.fillStyle = Array.isArray(p.colors) ? p.colors[i % p.colors.length] : p.color || '#fff6b0';
      x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(an - wd) * r, Math.sin(an - wd) * r); x.lineTo(Math.cos(an + wd) * r, Math.sin(an + wd) * r); x.closePath(); x.fill();
    }
    x.restore();
  },
  // 「人」の 2画（ひだりの はらい → みぎの はらいが ささえる）。s … 大きさ
  g4Hito(x, p) {
    const a = envOf(p, 40, 300);
    if (a <= 0) return;
    const s = p.s || 40;
    const k1 = easeOut(clamp01(p.age / 260)), k2 = easeOut(clamp01((p.age - 300) / 260));
    const glow = p.glow || '#ffb050', col = p.color || '#ffffff';
    x.save();
    x.translate(p.x, p.y);
    // ひだり: 上の まん中から ひだり下へ（ふでの ように まがる）
    const s1 = [];
    for (let i = 0; i <= 14 * k1; i++) { const u = i / 14; s1.push([lerp(0.05, -0.75, Math.pow(u, 1.4)) * s, lerp(-0.95, 0.85, u) * s]); }
    // みぎ: まん中から みぎ下へ（ひだりに もたれる）
    const s2 = [];
    for (let i = 0; i <= 12 * k2; i++) { const u = i / 12; s2.push([lerp(-0.12, 0.8, Math.pow(u, 0.8)) * s, lerp(-0.05, 0.85, u) * s]); }
    const wv = s * 0.13;
    if (s1.length > 1) glowStroke(x, s1, wv, glow, col, '#ffffff', a);
    if (s2.length > 1) glowStroke(x, s2, wv * 1.1, glow, col, '#ffffff', a);
    if (k2 >= 1) { x.globalCompositeOperation = 'lighter'; softGlow(x, -0.08 * s, -0.02 * s, s * 0.5, glow, a * (0.6 + 0.3 * Math.sin(p.age / 80))); }
    x.restore();
  },
  // ハートの かたちの しょうげきの 波（r0 → r1 に ひろがる）
  g4HeartWave(x, p) {
    const k = easeOut(clamp01(p.age / p.life));
    const a = (1 - k) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = lerp(p.r0 || 4, p.r1 || 60, k);
    x.save();
    x.translate(p.x, p.y);
    x.scale(r, r);
    x.beginPath();
    x.moveTo(0, 0.9);
    x.bezierCurveTo(-1.4, -0.1, -0.6, -1.1, 0, -0.35);
    x.bezierCurveTo(0.6, -1.1, 1.4, -0.1, 0, 0.9);
    x.closePath();
    x.globalCompositeOperation = 'lighter';
    if (p.fill) { x.globalAlpha = a * 0.25; x.fillStyle = p.fill; x.fill(); }
    x.lineWidth = (p.w || 3) / r;
    x.globalAlpha = a * 0.5; x.strokeStyle = p.glow || '#ff8ab0'; x.stroke();
    x.lineWidth = (p.w || 3) * 0.45 / r;
    x.globalAlpha = a; x.strokeStyle = p.color || '#ffe0ec'; x.stroke();
    x.restore();
  },
  // きずなの 糸（pts を なみうつ 光の 線で つなぐ。光が ながれる。loop … わに する）
  g4Thread(x, p) {
    const a = envOf(p, 100, 260) * (p.alpha ?? 1);
    if (a <= 0 || !p.pts || p.pts.length < 2) return;
    const k = easeOut(clamp01(p.age / (p.grow || 300)));
    const ring = p.loop ? [...p.pts, p.pts[0]] : p.pts;
    const pts = [];
    const segN = ring.length - 1;
    const upto = k * segN;
    for (let i = 0; i < segN; i++) {
      if (i > upto) break;
      const [ax, ay] = ring[i], [bx, by] = ring[i + 1];
      const m = Math.min(1, upto - i);
      for (let j = 0; j <= 10 * m; j++) {
        const u = j / 10;
        const sag = Math.sin(u * Math.PI) * (p.sag ?? -10) + Math.sin(u * 9 + p.age / 90) * 1.2;
        pts.push([lerp(ax, bx, u), lerp(ay, by, u) + sag]);
      }
    }
    if (pts.length < 2) return;
    x.save();
    glowStroke(x, pts, p.w || 1.4, p.glow || '#ffd23a', p.color || '#fff0a0', '#ffffff', a);
    // ながれる ひかり
    x.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const q = pts[Math.floor(((p.age / 500 + i / 3) % 1) * (pts.length - 1))];
      softGlow(x, q[0], q[1], 6, '#ffffff', a);
    }
    x.restore();
  },
  // 竜闘気の 球（ふちが 波うつ うすい 球）。r … 半径
  g4Bubble(x, p) {
    const a = envOf(p, 120, 220) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = (p.r || 20) * (0.5 + 0.5 * easeOut(clamp01(p.age / (p.grow || 200))));
    const col = p.color || '#7ad8ff', core = p.core || '#ffffff';
    const pts = [];
    for (let i = 0; i <= 28; i++) { const an = (i / 28) * TAU; const rr = r * (1 + (p.wob ?? 0.07) * Math.sin(an * 5 + p.age / 70) + 0.04 * Math.sin(an * 3 - p.age / 50)); pts.push([p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr * (p.sy || 1)]); }
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 1.5, col, a * 0.55);
    fillPoly(x, pts, col, a * (p.fill ?? 0.22));
    glowStroke(x, pts, 1.2, col, col, core, a, true);
    x.restore();
  },
  // 虹色に ひかる わく（スターで むてき）。色が 高速で かわる
  g4Prism(x, p) {
    const a = envOf(p, 80, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const hue = Math.floor(p.age * 1.4) % 360;
    const col = `hsl(${hue},100%,62%)`, col2 = `hsl(${(hue + 120) % 360},100%,70%)`;
    const r = (p.r || 16) * (1 + 0.08 * Math.sin(p.age / 40));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 1.6, ['#ff5a5a', '#ffe066', '#5aff8a', '#5ac8ff', '#c87aff'][Math.floor(p.age / 50) % 5], a * 0.7);
    x.lineWidth = 2.2; x.strokeStyle = col; x.globalAlpha = a;
    ell(x, p.x, p.y, r * 0.7, r * 1.05); x.stroke();
    x.lineWidth = 1; x.strokeStyle = col2;
    ell(x, p.x, p.y, r * 0.9, r * 1.25); x.stroke();
    x.restore();
  },
  // 六角の 光の まく（竜闘気の 守り）。r … 半径
  g4Hex(x, p) {
    const a = envOf(p, 80, 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = (p.r || 20) * (0.7 + 0.3 * easeOut(clamp01(p.age / 200)));
    const col = p.color || '#7ad8ff';
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, r * 1.5, col, a * 0.5);
    const hex = (cx, cy, rr) => { const pts = []; for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + Math.PI / 6; pts.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]); } return pts; };
    glowStroke(x, hex(0, 0, r), 1.2, col, col, '#ffffff', a, true);
    const sweep = (p.age / 300) % 1;
    const cell = r * 0.33;
    for (const [q, w] of [[0, 0], [1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87]]) {
      const cx = q * cell * 1.75, cy = w * cell * 1.75;
      const lit = Math.max(0, 1 - Math.abs((cy / (r * 2) + 0.5) - sweep) * 4);
      glowStroke(x, hex(cx, cy, cell), 0.6, col, col, '#ffffff', a * (0.35 + 0.65 * lit), true);
    }
    x.restore();
  },
};
