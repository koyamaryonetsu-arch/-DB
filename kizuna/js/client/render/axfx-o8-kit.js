// 第51回 C2（o8）: 幻の職業の え で つかう 小さな どうぐと つぶの かきかた（なまえは o8 で はじめる）。この ファイルは C2 だけが さわる
// ・o8Prop … 小物を 1つの つぶで 大きく かく（虫めがね・目・かいちゅう時計・サッカーボール・かんむり・星・光の 弓・つえ・刀・光の しか）
// ・o8Text … カタカナの 擬音（ギザギザの 星・ふきだし）。漢字は 出さない
// ・o8Dome … 星くずの バリア（六角の もようの ドーム）。o8Galaxy … うずまく 銀河。o8Seal … 2つ ならぶ まほうじん（二重呪文）
// ・balance … 段の つぶの かず（伝説: 敵1体でも 下限 いじょう、敵5体でも 上限 いか）
// ・毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
import { softGlow, clamp01, lerp, easeOut, easeIn, easeInOut, rnd } from './axkit.js?v=e9f7d3379e55';
import { AX_BUDGET_ORIG } from '../../shared/ax-time.js?v=e9f7d3379e55';

const TAU = Math.PI * 2;
const OUT = '#1a1430';
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

// ───────────── かく どうぐ（単位の 大きさ: だいたい -1〜1） ─────────────
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, TAU); };
function poly(x, pts, close = true) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
const edge = (x, e = OUT, lw = 0.08) => { if (!e) return; x.lineWidth = lw; x.strokeStyle = e; x.stroke(); };
const E = (x, cx, cy, rx, ry, col, e = OUT, lw = 0.08, rot = 0) => { ell(x, cx, cy, rx, ry, rot); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const Pg = (x, pts, col, e = OUT, lw = 0.08) => { poly(x, pts); x.fillStyle = col; x.fill(); edge(x, e, lw); };
const Ln = (x, pts, col, lw = 0.08) => { poly(x, pts, false); x.lineWidth = lw; x.strokeStyle = col; x.lineCap = 'round'; x.stroke(); };
function starPts(n, r0, r1, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) { const an = rot + (i / (n * 2)) * TAU, r = i % 2 ? r1 : r0; out.push([Math.cos(an) * r, Math.sin(an) * r]); }
  return out;
}

// 小物（p.col … 主な 色、p.col2 … 2ばんめの 色）
const PROP = {
  // 虫めがね（金の わく・青い レンズの 光）
  glass(x, p) {
    Ln(x, [[0.45, 0.45], [1.05, 1.05]], '#5a3a1a', 0.32);
    Ln(x, [[0.5, 0.5], [1.0, 1.0]], '#a8743a', 0.2);
    E(x, 0, 0, 0.7, 0.7, p.col || '#ffd23a', OUT, 0.08);
    E(x, 0, 0, 0.55, 0.55, p.col2 || '#bfe8ff', null);
    x.globalAlpha *= 0.8;
    E(x, -0.2, -0.22, 0.16, 0.1, '#ffffff', null, 0, -0.6);
  },
  // 目（先を 見とおす）
  eye(x, p) {
    Pg(x, [[-1, 0], [-0.5, -0.5], [0, -0.62], [0.5, -0.5], [1, 0], [0.5, 0.5], [0, 0.62], [-0.5, 0.5]], '#ffffff', p.col2 || '#1a3a8a', 0.1);
    E(x, 0, 0, 0.42, 0.42, p.col || '#3a7ae0', null);
    E(x, 0, 0, 0.2, 0.2, '#0a1430', null);
    E(x, -0.12, -0.14, 0.09, 0.09, '#ffffff', null);
  },
  // かいちゅう時計（針が まわる）
  clock(x, p) {
    E(x, 0, -1.05, 0.16, 0.16, '#ffd23a', OUT, 0.06);
    E(x, 0, 0, 0.9, 0.9, p.col || '#ffd23a', OUT, 0.1);
    E(x, 0, 0, 0.74, 0.74, '#fff8e6', null);
    for (let i = 0; i < 12; i++) { const an = (i / 12) * TAU; Ln(x, [[Math.cos(an) * 0.6, Math.sin(an) * 0.6], [Math.cos(an) * 0.7, Math.sin(an) * 0.7]], '#5a4a3a', 0.06); }
    const a1 = (p.age || 0) / 120, a2 = (p.age || 0) / 700;
    Ln(x, [[0, 0], [Math.sin(a1) * 0.6, -Math.cos(a1) * 0.6]], '#c8202a', 0.07);
    Ln(x, [[0, 0], [Math.sin(a2) * 0.4, -Math.cos(a2) * 0.4]], '#1a1430', 0.1);
  },
  // サッカーボール
  ball(x) {
    E(x, 0, 0, 1, 1, '#ffffff', OUT, 0.1);
    Pg(x, starPts(5, 0.34, 0.34, -Math.PI / 2), '#1a1a2a', null);
    for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i / 5) * TAU; const cx = Math.cos(an) * 0.78, cy = Math.sin(an) * 0.78; E(x, cx, cy, 0.2, 0.2, '#1a1a2a', null); }
  },
  // かんむり
  crown(x, p) {
    Pg(x, [[-1, 0.5], [-1, -0.35], [-0.5, 0.05], [0, -0.7], [0.5, 0.05], [1, -0.35], [1, 0.5]], p.col || '#ffd23a', '#7a4a0a', 0.1);
    E(x, 0, 0.18, 0.18, 0.18, p.col2 || '#c8a8ff', null);
    E(x, -0.6, 0.25, 0.12, 0.12, '#7ad8ff', null);
    E(x, 0.6, 0.25, 0.12, 0.12, '#ff8ab0', null);
    for (const [cx, cy] of [[-1, -0.35], [0, -0.7], [1, -0.35]]) E(x, cx, cy, 0.13, 0.13, '#ffffff', null);
  },
  // 5つの とがりの 星
  star(x, p) { Pg(x, starPts(5, 1, 0.45), p.col || '#ffe060', p.col2 || '#ffffff', 0.1); },
  // 三日月の ゆりかご
  moon(x, p) {
    x.beginPath(); x.arc(0, 0, 1, 0.15 * Math.PI, 0.85 * Math.PI, false); x.arc(0, -0.38, 0.86, 0.85 * Math.PI, 0.15 * Math.PI, true); x.closePath();
    x.fillStyle = p.col || '#fff2c0'; x.fill(); edge(x, p.col2 || '#c8a040', 0.08);
  },
  // 光の 弓（矢つき）
  bow(x, p) {
    x.beginPath(); x.arc(0.4, 0, 1, Math.PI * 0.62, Math.PI * 1.38); x.lineWidth = 0.18; x.strokeStyle = p.col || '#e8d8ff'; x.stroke();
    Ln(x, [[0.4 + Math.cos(Math.PI * 0.62), Math.sin(Math.PI * 0.62)], [0.05, 0], [0.4 + Math.cos(Math.PI * 1.38), Math.sin(Math.PI * 1.38)]], '#ffffff', 0.05);
    Ln(x, [[0.05, 0], [1.25, 0]], p.col2 || '#ffffff', 0.1);
    Pg(x, [[1.45, 0], [1.2, -0.14], [1.2, 0.14]], '#ffffff', null);
  },
  // つえ（先に 光る 玉）
  wand(x, p) {
    Ln(x, [[0, 1], [0, -0.6]], '#7a4a2a', 0.16);
    E(x, 0, -0.78, 0.24, 0.24, p.col || '#7ad8ff', '#ffffff', 0.06);
  },
  // 刀（そりの ある 白い 刃）
  sword(x, p) {
    Pg(x, [[-0.08, 0.55], [-0.06, -0.9], [0.06, -1.05], [0.08, 0.55]], p.col || '#eef4ff', '#5a6a8a', 0.05);
    Pg(x, [[-0.3, 0.55], [0.3, 0.55], [0.3, 0.65], [-0.3, 0.65]], '#ffd23a', null);
    Ln(x, [[0, 0.65], [0, 1.1]], '#2a1a3a', 0.16);
  },
  // 光の しか（守護の 呪文の けもの）
  stag(x, p) {
    const c = p.col || '#e8f4ff';
    E(x, 0, 0.1, 0.75, 0.38, c, null);
    E(x, 0.72, -0.28, 0.24, 0.2, c, null);
    Pg(x, [[0.52, -0.18], [0.66, -0.5], [0.8, -0.18]], c, null);
    for (const lx of [-0.5, -0.25, 0.3, 0.55]) Ln(x, [[lx, 0.35], [lx + 0.04, 0.95]], c, 0.12);
    for (const s of [-1, 1]) Ln(x, [[0.68, -0.42], [0.6 + s * 0.14, -0.85], [0.5 + s * 0.3, -1.0]], c, 0.07);
    Ln(x, [[0.6, -0.72], [0.82, -0.86]], c, 0.06);
  },
};
export const O8_PROPS = Object.keys(PROP);

// うごく みち: x0,y0 → x1,y1（travel ms・ease）
function pathPos(p, age = p.age) {
  if (!(p.travel > 0)) return [p.x, p.y];
  const e = clamp01((age - (p.start || 0)) / p.travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : p.ease === 'io' ? easeInOut(e) : easeOut(e);
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI)];
}

export const AX_O8_FINE = {
  // 小物: prop・s（大きさ px）・pop（ふくらむ ms）・spin・rot0・wob・glow・glowR・travel で とぶ
  o8Prop(x, p) {
    const a = envOf(p, 60, p.fout ?? 160) * (p.alpha ?? 1);
    const draw = PROP[p.prop];
    if (a <= 0 || !draw) return;
    const s = p.s || 8;
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    const [cx, cy] = pathPos(p);
    x.save();
    x.translate(cx, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * (p.glowR || 2), p.glow, a * 0.6); }
    x.globalCompositeOperation = 'source-over';
    x.rotate((p.rot0 || 0) + (p.spin || 0) * p.age / 1000 + (p.wob ? Math.sin(p.age / 90) * p.wob : 0));
    x.scale(s * sc * (p.flip ? -1 : 1), s * sc);
    x.globalAlpha = a;
    x.lineJoin = 'round';
    draw(x, p);
    x.restore();
  },
  // カタカナの 擬音: text・size・fill・edge・burst（ギザギザ星の 色）・bubble（ふきだし）・rot・rise
  o8Text(x, p) {
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / (p.pop || 170)));
    const size = p.size || 12;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate(p.rot || 0);
    x.scale(sc, sc);
    x.font = `bold ${size}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const mw = x.measureText(p.text)?.width;
    const w = Number.isFinite(mw) ? mw : p.text.length * size;
    if (p.burst) Pg(x, starPts(12, 1, 0.72, p.age / 900).map(([u, v]) => [u * (w * 0.62 + 8), v * (size * 1.05 + 4)]), p.burst, p.burstEdge || '#1a1430', 2);
    if (p.bubble) {
      E(x, 0, 0, w / 2 + 7, size * 0.85 + 2, p.bubble, p.edge || '#1a1430', 1.4);
    } else if (!p.burst || p.stroke) {
      x.lineWidth = p.lw || 3; x.lineJoin = 'round'; x.strokeStyle = p.edge || '#1a1430';
      x.strokeText(p.text, 0, 0.5);
    }
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(p.text, 0, 0.5);
    x.restore();
  },
  // 星くずの バリア（六角の もようの ドーム）: r・sy（たての つぶれ）・color・color2
  o8Dome(x, p) {
    const a = envOf(p, 120, 220) * (p.alpha ?? 1);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / (p.grow || 260)));
    const r = (p.r || 30) * g, ry = r * (p.sy ?? 1.05);
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y - ry * 0.4, r * 1.3, p.color || '#9ad8ff', a * 0.35);
    // ドームの 中は 色の ついた うすい まく（明るい 地面でも 色が 見える）
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.3;
    x.beginPath(); x.ellipse(p.x, p.y, r, ry, 0, Math.PI, TAU); x.closePath();
    x.fillStyle = p.color || '#9ad8ff'; x.fill();
    x.globalCompositeOperation = 'lighter';
    // 六角の もよう（ドームの 中で きらきら）
    x.globalAlpha = a * 0.55;
    x.strokeStyle = p.color2 || '#ffffff'; x.lineWidth = 0.8;
    const hs = Math.max(4, r / 3.2);
    for (let row = 0; row < 5; row++) {
      for (let col = -4; col <= 4; col++) {
        const hx = p.x + col * hs * 1.5 + (row % 2) * hs * 0.75, hy = p.y - row * hs * 0.86 - hs * 0.3;
        const dx = (hx - p.x) / r, dy = (p.y - hy) / ry;
        if (dx * dx + dy * dy > 0.82) continue;
        const tw = 0.5 + 0.5 * Math.sin(p.age / 90 + col * 1.7 + row * 2.3);
        x.globalAlpha = a * (0.25 + 0.45 * tw);
        x.beginPath();
        for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU; const px = hx + Math.cos(an) * hs * 0.48, py = hy + Math.sin(an) * hs * 0.48; k ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.closePath(); x.stroke();
      }
    }
    // ふち
    x.globalAlpha = a * 0.9;
    x.lineWidth = 1.6; x.strokeStyle = p.color2 || '#ffffff';
    x.beginPath(); x.ellipse(p.x, p.y, r, ry, 0, Math.PI, TAU); x.stroke();
    x.restore();
  },
  // うずまく 銀河: r・turn（まわる 速さ）・cols
  o8Galaxy(x, p) {
    const a = envOf(p, 160, 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = (p.r || 30) * easeOut(clamp01(p.age / (p.grow || 300)));
    const sy = p.sy ?? 0.45;
    const cols = p.cols || ['#c8a8ff', '#7ad8ff', '#ffffff', '#ff9ad8'];
    const rot = p.age / 1000 * (p.turn || 2);
    x.save();
    // 夜空の 円ばん（明るい 空でも 銀河が 見える ように。うすい むらさき）
    x.globalAlpha = a * 0.5;
    x.fillStyle = p.night || '#2a1a5a';
    ell(x, p.x, p.y, r * 1.05, r * sy * 1.15);
    x.fill();
    x.globalAlpha = a * 0.35;
    x.fillStyle = '#5a3aa8';
    ell(x, p.x, p.y, r * 0.7, r * sy * 0.8);
    x.fill();
    // うずの うで
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 22; i++) {
        const u = i / 22;
        const an = rot + arm * (TAU / 3) + u * 3.4;
        const rr = r * (0.1 + u * 0.9);
        x.globalAlpha = a * (1 - u * 0.55);
        x.fillStyle = cols[(i + arm) % cols.length];
        const sz = 2.6 * (1 - u * 0.5);
        x.fillRect(p.x + Math.cos(an) * rr - sz / 2, p.y + Math.sin(an) * rr * sy - sz / 2, sz, sz);
      }
    }
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 0.45, cols[0], a * 0.6);
    softGlow(x, p.x, p.y, r * 0.18, '#ffffff', a * 0.9);
    x.restore();
  },
  // 2つ ならぶ まほうじん（二重呪文）: r・gap・color・color2
  o8Seal(x, p) {
    const a = envOf(p, 100, 200) * (p.alpha ?? 1);
    if (a <= 0) return;
    const r = (p.r || 14) * backOut(clamp01(p.age / 220));
    const rot = p.age / 600;
    x.save();
    for (const [k, col] of [[-1, p.color || '#ff7a3a'], [1, p.color2 || '#7ad8ff']]) {
      const cx = p.x + k * (p.gap || 20), cy = p.y;
      // うすい 円ばん（明るい 空でも 色が 見える）と こい 線
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a * 0.35; x.fillStyle = col;
      ell(x, cx, cy, r, r); x.fill();
      x.globalAlpha = a; x.strokeStyle = col; x.lineWidth = 2;
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
      x.lineWidth = 1.2;
      x.beginPath(); x.arc(cx, cy, r * 0.72, 0, TAU); x.stroke();
      x.beginPath();
      for (let i = 0; i <= 5; i++) { const an = rot * k + (i * 2 / 5) * TAU; const px = cx + Math.cos(an) * r * 0.72, py = cy + Math.sin(an) * r * 0.72; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      x.stroke();
      // まわりの 小さな しるし
      for (let i = 0; i < 8; i++) { const an = -rot * k + (i / 8) * TAU; x.fillStyle = '#ffffff'; x.fillRect(cx + Math.cos(an) * r * 0.86 - 0.8, cy + Math.sin(an) * r * 0.86 - 0.8, 1.6, 1.6); }
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy, r * 1.3, col, a * 0.35);
    }
    x.restore();
  },
};

// ───────────── え を かく どうぐ（c … play の ctx） ─────────────
// つぶを 1つ 足す（kind は o8〜）
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? 0, y = o.y ?? o.y0 ?? 0;
  c.fx.add({ life: 600, delay: 0, ...o, kind, x, y });
}
export const prop = (c, name, o) => add(c, 'o8Prop', { prop: name, ...o });
// カタカナの 擬音（画面の 中に おさめる）
export const text = (c, x, y, t, o = {}) => add(c, 'o8Text', { x: Math.max(24, Math.min(c.W - 24, x)), y: Math.max(12, Math.min(c.H - 10, y)), text: t, life: 560, ...o });
export const dome = (c, x, y, o = {}) => add(c, 'o8Dome', { x, y, life: 700, ...o });
export const galaxy = (c, x, y, o = {}) => add(c, 'o8Galaxy', { x, y, life: 800, ...o });
export const seal = (c, x, y, o = {}) => add(c, 'o8Seal', { x, y, life: 700, ...o });

// 使う 人の 手もと（味方は 画面の 下の すこし 上。敵は その 前）
export const hands = (c, up = 22) => (c.fromAlly ? { x: Math.max(24, Math.min(c.W - 24, c.from.x)), y: c.H - 22 - up * 0.6 } : { x: c.from.x, y: c.from.y + 6 });
// 的の 上（画面の そとに 出ない）
export const above = (c, t, dy = 30) => Math.max(12, t.y - dy);
// 空の 上（敵が 使う ときは 敵の 上）
export const sky = (c) => (c.dir === 'down' ? Math.max(14, c.from.y - 30) : 14);
// 敵の かずで へらす
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.3) / c.n)));
// 味方 ぜんいんの まん中の 上
export const partyTop = (c, dy = 44) => ({ x: c.center.x, y: Math.max(16, c.center.y - dy) });
export { rnd };

// あたった ところ（1・2体目は 光の まる、3体目から きまりの しるし）
export function hitFx(c, t, i, d, o = {}) {
  const { k } = c;
  const glow = o.glow || '#ffffff', cols = o.colors || ['#ffffff', glow];
  if (i < 2) k.impact(t.x, t.y, { r: (o.r || 15) * c.sz, glow, colors: cols, delay: d, heavy: i === 0 });
  else c.hitMark(t, d, [glow]);
  k.particles(t.x, t.y, { n: per(c, o.n ?? 16), colors: cols, speed: o.speed || 150, delay: d, life: 440 });
  if (o.ring !== false) k.shockwave(t.x, t.y, { r0: 4, r1: (o.ring || 38) * c.sz, color: o.ringColor || glow, w: 2.2, delay: d + 10, life: 380 });
}
// 味方に かける 技の しるし（t … 味方）
export function allyGlow(c, t, d, color = '#7dffb0', o = {}) {
  const { fx, k } = c;
  fx.glow(t.x, t.y - 8, { color, r: o.r || 24, delay: d, life: o.life || 520, alpha: 0.85 });
  k.shockwave(t.x, t.y, { r0: 4, r1: o.ring || 28, sy: 0.35, color, w: 1.8, delay: d, life: 440 });
  for (let j = 0; j < (o.drops ?? 5); j++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(4, 26), { color: j % 2 ? '#ffffff' : color, size: rnd(2.5, 4.5), vy: rnd(-26, -8), delay: d + j * 40, life: 440 });
}
// 伝説の 命中の ゆれ と ひかり
export function bigShake(c, d, o = {}) {
  c.k.shake(o.ms || 280, o.amp || 2, d);
  if (o.flash !== false) c.k.flash(o.flash || '#ffffff', 90, d);
}

// へらして よい つぶ（こまかい もの から）
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];

// 段の つぶの かずに あわせる（AX_BUDGET_ORIG.legend）
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.tier] || AX_BUDGET_ORIG.legend;
  const lo = Math.max(Math.ceil(B.parts[0] * (c.party ? 0.5 : 1) * 1.1), o.minParts || 0);
  const hi = Math.floor(B.parts[1] * 0.97);
  // 余韻は 技の おわりの すこし あと までに きえる
  const limit = c.len + (c.n - 1) * c.stagger + 220;
  for (let i = fx.parts.length - 1; i >= start; i--) {
    const p = fx.parts[i];
    const d = p.delay > 0 ? p.delay : 0;
    if (d >= limit) fx.parts.splice(i, 1);
    else if (d + (p.life - (p.age || 0)) > limit) p.life = (p.age || 0) + limit - d;
  }
  let over = fx.parts.length - hi;
  for (const kind of TRIM) {
    if (over <= 0) break;
    for (let i = fx.parts.length - 1; i >= start && over > 0; i--) {
      if (fx.parts[i].kind === kind) { fx.parts.splice(i, 1); over--; }
    }
  }
  const need = Math.min(lo - fx.parts.length, hi - fx.parts.length);
  if (need <= 0) return;
  const cols = [o.color || '#ffffff', o.color2 || '#fff6b0', '#ffffff'];
  const t0 = c.hit, t1 = Math.max(c.hit + 60, c.len - 420);
  for (let i = 0; i < need; i++) {
    const t = c.targets[i % c.n];
    const x = Math.max(4, Math.min(c.W - 4, t.x + rnd(-30, 30))), y = Math.max(4, Math.min(c.H - 4, t.y + rnd(-26, 14)));
    fx.twinkle(x, y, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(t0, t1), life: rnd(220, 340), vy: rnd(-24, -6) });
  }
}

// どの え も さいごに balance
export function withBalance(defs) {
  const out = {};
  for (const [anim, def] of Object.entries(defs)) {
    const { minParts, ...rest } = def;
    out[anim] = {
      ...rest,
      play(fx, c) {
        const start = fx.parts.length;
        def.play(fx, c);
        balance(fx, c, start, { minParts, color: def.charge?.color, color2: def.charge?.color2 });
      },
    };
  }
  return out;
}
