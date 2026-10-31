// 第51回 C1（o7）: 幻の職業の え で つかう 小さな どうぐ と つぶの かきかた（AX_O7_FINE。なまえは o7 で はじめる）
// ・o7Obj  … 大きな 小物（麦わらぼうし・海賊旗・海賊船・ゴムの こぶし・肉・太陽・勇者の 剣・影分身・きつね・ドローン・カプセル・AIチップ・笑い顔…）
// ・o7Text … カタカナの 擬音（ふきだし・ギザギザの 星つき）。o7Hex … AIの 六角形の パネル。o7Reticle … ねらいの わ（AIの 照準）
// ・o7Bg   … 発射の あと 一しゅんの うすい 背景（a 0.35 まで）
// ・毎フレーム グラデーションを 作らない（softGlow の キャッシュ）。画面の 文字は カタカナ・ひらがな・記号・ローマ字だけ（漢字なし）
import { softGlow, clamp01, lerp, easeOut, easeIn, easeInOut, rnd, hash } from './axkit.js?v=31a32b16dd7b';
import { AX_BUDGET_ORIG } from '../../shared/ax-time.js?v=31a32b16dd7b';

const TAU = Math.PI * 2;
const OUT = '#2a1a10';
export const envOf = (p, fin = 80, fout = 160) => clamp01(p.age / Math.max(1, p.fin ?? fin)) * clamp01((p.life - p.age) / Math.max(1, p.fout ?? fout));
const backOut = (t) => { const s = 1.70158; const u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; };

// ───────────── つぶを 足す ─────────────
export function add(c, kind, o) {
  const x = o.x ?? o.x0 ?? (o.keys ? o.keys[0][1] : 0), y = o.y ?? o.y0 ?? (o.keys ? o.keys[0][2] : 0);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// 小物（shape は OBJ）。x0,y0 → x1,y1 へ travel ms で とぶ（ease: in・out・io）。s … 大きさ px
export const obj = (c, shape, o) => add(c, 'o7Obj', { shape, ...o });
export const fly = (c, shape, x0, y0, x1, y1, o = {}) => obj(c, shape, { x0, y0, x1, y1, travel: o.travel ?? c.hit, life: (o.travel ?? c.hit) + (o.stay ?? 120), fout: o.fout ?? 100, ...o });
// カタカナの 擬音（画面の 中に おさめる）
export const text = (c, x, y, t, o = {}) => add(c, 'o7Text', { x: Math.max(24, Math.min(c.W - 24, x)), y: Math.max(11, Math.min(c.H - 10, y)), text: t, life: 560, ...o });
export const hex = (c, x, y, o = {}) => add(c, 'o7Hex', { x, y, life: 700, ...o });
export const reticle = (c, x, y, o = {}) => add(c, 'o7Reticle', { x, y, life: 600, ...o });
export const bg = (c, v, o = {}) => add(c, 'o7Bg', { v, x: 0, y: 0, life: Math.min(600, o.life ?? 560), fin: 120, fout: 220, ...o, a: Math.min(0.35, o.a ?? 0.28) });

// ───────────── いち ─────────────
// つかう 人の 手もと（味方は 画面の 下。すこし 左上に はなす）。敵なら え の すこし 下
export const hands = (c, up = 22) => (c.fromAlly ? { x: Math.max(24, Math.min(c.W - 24, c.from.x - 30)), y: c.H - 18 - up * 0.6 } : { x: c.from.x, y: c.from.y + 6 });
export const ground = (c, t, dy = 18) => Math.min(c.H - 4, t.y + dy);
export const above = (c, t, dy = 30) => Math.max(10, t.y - dy);
// 敵の かずで つぶを へらす
export const per = (c, n, min = 1) => (c.n === 1 ? n : Math.max(min, Math.round((n * 1.3) / c.n)));
// 下向き（敵が 味方に つかう）なら 1、上向きなら -1
export const vdir = (c) => (c.dir === 'down' ? 1 : -1);
// 味方 ぜんいんの まん中の 上
export const partyTop = (c, dy = 44) => ({ x: c.center.x, y: Math.max(16, c.center.y - dy) });

// あたった ところ（1体目・2体目は 光の まる、3体目から きまりの しるし）
export function hitFx(c, t, i, d, o = {}) {
  const { k } = c;
  const glow = o.glow || '#ffffff', cols = o.colors || ['#ffffff', glow];
  if (i < 2) k.impact(t.x, t.y + (o.dy || 0), { r: (o.r || 15) * c.sz, glow, colors: cols, delay: d, heavy: o.heavy ?? i === 0 });
  else c.hitMark({ x: t.x, y: t.y + (o.dy || 0) }, d, [glow]);
  if (o.n !== 0) k.particles(t.x, t.y + (o.dy || 0), { n: per(c, o.n ?? 14), colors: cols, speed: o.speed || 140, delay: d, life: 420 });
  if (o.ring) k.shockwave(t.x, t.y, { r0: 4, r1: (o.ring === true ? 36 : o.ring) * c.sz, color: o.ringColor || glow, w: 2, delay: d + 10, life: 380 });
}
// 味方に かける 技の しるし（t … 味方）
export function allyGlow(c, t, d, color = '#7dffb0', o = {}) {
  const { fx, k } = c;
  fx.glow(t.x, t.y - 8, { color, r: o.r || 22, delay: d, life: o.life || 480, alpha: 0.85 });
  k.shockwave(t.x, t.y, { r0: 4, r1: o.ring || 26, sy: 0.35, color, w: 1.8, delay: d, life: 420 });
  for (let j = 0; j < (o.drops ?? 5); j++) fx.twinkle(t.x + rnd(-14, 14), t.y - rnd(4, 24), { color: j % 2 ? '#ffffff' : color, size: rnd(2.5, 4.5), vy: rnd(-26, -8), delay: d + j * 40, life: 420 });
}
// 上向きの 矢印（力が 上がる しるし）
export function upArrow(c, x, y, d, color = '#ff5a5a') {
  obj(c, 'arrow', { x, y, s: 6, keys: [[0, x, y + 6, 0.6], [260, x, y - 6, 1], [520, x, y - 12, 1]], color, delay: d, life: 560, fout: 160 });
}
// いなずまの すじ（x0,y0 → x1,y1。grow ms で のびる）
export function zap(c, x0, y0, x1, y1, d, o = {}) {
  c.k.bolt(x0, y0, x1, y1, { w: o.w || 2.4, amp: o.amp ?? 10, forks: o.forks ?? 2, grow: o.grow ?? 70, delay: d, life: o.life || 260, color: o.color || '#fff27a', glow: o.glow || '#ffd23a' });
}

// ───────────── 段の つぶの かず に あわせる（AX_BUDGET_ORIG。o5 と おなじ やりかた） ─────────────
const TRIM = ['spark', 'twinkle', 'puff', 'drop', 'bubble', 'petal', 'axShape', 'converge'];
export function balance(fx, c, start, o = {}) {
  const B = AX_BUDGET_ORIG[c.dual ? 'super' : c.tier] || AX_BUDGET_ORIG.legend;
  const lo = Math.max(Math.ceil(B.parts[0] * (c.party ? 0.5 : 1) * 1.1), o.minParts || 0);
  const hi = Math.floor(B.parts[1] * 0.95);
  // 余韻は 技の おわり（len ＋ 敵全体の ずらし）の すこし あと までに きえる
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
function starPts(n, r0, r1, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) { const an = rot + (i / (n * 2)) * TAU, r = i % 2 ? r1 : r0; out.push([Math.cos(an) * r, Math.sin(an) * r]); }
  return out;
}
// にこにこ顔（海賊旗・笑い顔・太陽）。big … 大わらい（口を 大きく あける）
function smile(x, col = OUT, big = false, lw = 0.1) {
  x.fillStyle = col;
  if (big) {
    poly(x, [[-0.32, -0.22], [-0.14, -0.3], [-0.32, -0.38]], false); x.lineWidth = lw; x.strokeStyle = col; x.stroke();
    poly(x, [[0.32, -0.22], [0.14, -0.3], [0.32, -0.38]], false); x.stroke();
    x.beginPath(); x.moveTo(-0.42, 0.02); x.quadraticCurveTo(0, 0.08, 0.42, 0.02); x.quadraticCurveTo(0.3, 0.6, 0, 0.62); x.quadraticCurveTo(-0.3, 0.6, -0.42, 0.02); x.closePath(); x.fill();
    ell(x, 0, 0.42, 0.18, 0.12); x.fillStyle = '#ff6a6a'; x.fill();
  } else {
    D(x, -0.22, -0.18, 0.08, col); D(x, 0.22, -0.18, 0.08, col);
    x.beginPath(); x.arc(0, 0.02, 0.32, 0.2, Math.PI - 0.2); x.lineWidth = lw; x.strokeStyle = col; x.stroke();
  }
}

// ───────────── 小物（o7Obj の shape） ─────────────
const OBJ = {
  // 麦わらぼうし（赤い リボン）
  strawhat(x) {
    E(x, 0, 0.25, 1, 0.32, '#f2cf5a', '#7a5a14', 0.08);
    x.beginPath(); x.moveTo(-0.55, 0.22); x.quadraticCurveTo(-0.5, -0.55, 0, -0.58); x.quadraticCurveTo(0.5, -0.55, 0.55, 0.22); x.closePath();
    x.fillStyle = '#f6d86a'; x.fill(); edge(x, '#7a5a14', 0.08);
    R(x, -0.55, -0.02, 1.1, 0.2, 0.04, '#d8262a', '#7a1414', 0.06);
    for (let i = -3; i <= 3; i++) L(x, [[i * 0.24, 0.18], [i * 0.3, 0.42]], 'rgba(122,90,20,0.45)', 0.04);
  },
  // 海賊旗（くろい 旗に 麦わらぼうしの にこにこ顔。p.wave … はためく）
  flag(x, p) {
    const w = Math.sin((p.age || 0) / 90) * 0.08;
    R(x, -1.05, -1, 0.1, 2.1, 0.04, '#8a5a2a', '#3a2410', 0.05);
    x.beginPath();
    x.moveTo(-0.95, -0.95);
    x.quadraticCurveTo(-0.3, -0.95 + w * 2, 0.95, -0.9 - w);
    x.lineTo(0.95, 0.15 - w);
    x.quadraticCurveTo(-0.3, 0.2 + w * 2, -0.95, 0.15);
    x.closePath();
    x.fillStyle = '#1a1a22'; x.fill(); edge(x, '#000000', 0.05);
    x.save(); x.translate(0, -0.38); x.scale(0.42, 0.42);
    E(x, 0, 0.1, 0.62, 0.6, '#ffffff', null);
    smile(x, '#1a1a22');
    x.save(); x.translate(0, -0.55); x.scale(0.75, 0.7); OBJ.strawhat(x); x.restore();
    x.restore();
    L(x, [[-0.5, -0.02], [0.5, -0.02]], '#ffffff', 0.09);
  },
  // 海賊船（横から。p.flip で 左むき）
  ship(x) {
    // 帆
    for (const [mx, h] of [[-0.35, 1.1], [0.25, 1.35]]) {
      R(x, mx - 0.03, -h, 0.06, h + 0.1, 0.02, '#7a4a20', '#3a2410', 0.04);
      x.beginPath(); x.moveTo(mx - 0.32, -h + 0.18); x.quadraticCurveTo(mx + 0.05, -h * 0.55, mx - 0.32, -0.2); x.lineTo(mx + 0.34, -0.2); x.quadraticCurveTo(mx + 0.55, -h * 0.55, mx + 0.34, -h + 0.18); x.closePath();
      x.fillStyle = '#fff8e8'; x.fill(); edge(x, '#8a7a5a', 0.04);
      D(x, mx + 0.01, -h * 0.55, 0.13, '#d8262a');
    }
    R(x, 0.22, -1.6, 0.36, 0.2, 0.02, '#1a1a22', null);
    // 船体
    P(x, [[-1, -0.2], [1.05, -0.25], [0.8, 0.3], [-0.75, 0.3]], '#a8642a', '#4a2a10', 0.06);
    R(x, -0.9, -0.12, 1.85, 0.08, 0.02, '#f2cf5a', null);
    for (let i = 0; i < 4; i++) D(x, -0.5 + i * 0.36, 0.08, 0.06, '#2a1a10');
    // ひつじの 頭（まえの かざり）
    E(x, 1.05, -0.38, 0.2, 0.18, '#fff6dc', OUT, 0.05);
    D(x, 1.1, -0.42, 0.03, OUT);
  },
  // ゴムの こぶし（p.col … はだの 色）
  fist(x, p) {
    const col = p.col || '#ffd2a8';
    R(x, -0.75, -0.55, 1.35, 1.1, 0.42, col, OUT, 0.09);
    for (let i = 0; i < 3; i++) L(x, [[0.25, -0.38 + i * 0.32], [0.55, -0.38 + i * 0.32]], OUT, 0.07);
    E(x, -0.2, -0.58, 0.4, 0.2, col, OUT, 0.07);
    R(x, -1, -0.28, 0.32, 0.56, 0.1, '#d8262a', '#7a1414', 0.06);
  },
  // ほねつき肉
  meat(x) {
    E(x, 0.2, 0, 0.68, 0.52, '#b85a28', '#5a2a10', 0.07);
    E(x, 0.12, -0.12, 0.42, 0.26, '#d8803a', null);
    R(x, -0.95, -0.08, 0.6, 0.16, 0.08, '#fff6e8', '#8a7a6a', 0.05);
    D(x, -0.95, -0.14, 0.12, '#fff6e8'); D(x, -0.95, 0.12, 0.12, '#fff6e8');
  },
  // ほう弾（くろい まるい たま）
  ball(x) {
    E(x, 0, 0, 0.9, 0.9, '#2a2a34', '#000000', 0.06);
    D(x, -0.3, -0.3, 0.25, '#7a7a8a');
    R(x, -0.12, -1.15, 0.24, 0.3, 0.05, '#8a7a5a', null);
  },
  // 太陽の 顔（ひかりの とげ・にこにこ）
  sun(x, p) {
    x.save(); x.rotate((p.age || 0) / 1400);
    P(x, starPts(12, 1, 0.72), '#ffb02a', '#c86a0a', 0.05);
    x.restore();
    E(x, 0, 0, 0.66, 0.66, '#ffe45a', '#c88a0a', 0.06);
    smile(x, '#a8520a', !!p.laugh, 0.09);
  },
  // 勇者の 剣（青い つか・金の つば）
  sword(x) {
    P(x, [[-0.1, -1], [0.1, -1], [0.12, 0.42], [0, 0.55], [-0.12, 0.42]].map(([a, b]) => [a, b - 0.15]), '#e8f4ff', '#5a7aa8', 0.05);
    L(x, [[0, -1.1], [0, 0.35]], '#ffffff', 0.04);
    R(x, -0.42, 0.36, 0.84, 0.14, 0.06, '#ffd23a', '#8a6a0a', 0.05);
    R(x, -0.07, 0.48, 0.14, 0.42, 0.04, '#2a5ad8', '#0a2a6a', 0.04);
    D(x, 0, 0.92, 0.1, '#ffd23a');
    D(x, 0, 0.43, 0.07, '#ff3a5a');
  },
  // 影分身（オレンジの 服・はちまき。p.pose … 刀の むき。p.fire … 刀に 炎）
  ninja(x, p) {
    const pose = p.pose ?? 0;
    // 刀（うでごと 回る）
    x.save(); x.translate(0.15, -0.15); x.rotate(pose + (p.swing ? Math.sin((p.age || 0) / 70) * 1.2 : 0));
    R(x, -0.04, -1.25, 0.08, 1.05, 0.03, p.fire ? '#ff7a1a' : '#c8d8f0', OUT, 0.04);
    if (p.fire) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, -0.75, 0.55, '#ff8a2a', 0.9); x.globalCompositeOperation = 'source-over'; }
    R(x, -0.12, -0.22, 0.24, 0.08, 0.03, '#1a1a1a', null);
    x.restore();
    // からだ
    P(x, [[-0.38, -0.2], [0.38, -0.2], [0.5, 0.95], [-0.5, 0.95]], '#f08a20', '#6a3a0a', 0.06);
    R(x, -0.42, 0.25, 0.84, 0.12, 0.04, '#1a1a1a', null);
    E(x, 0, -0.52, 0.32, 0.32, '#ffd8b0', '#6a3a0a', 0.06);
    // かみ（とがった 黄色）
    P(x, [[-0.36, -0.6], [-0.42, -0.95], [-0.18, -0.78], [0, -1.02], [0.18, -0.78], [0.42, -0.95], [0.36, -0.6]], '#ffd23a', '#8a6a0a', 0.05);
    R(x, -0.36, -0.68, 0.72, 0.12, 0.03, '#2a3a5a', null);
    D(x, 0, -0.62, 0.05, '#c8d0dc');
    D(x, -0.11, -0.5, 0.035, OUT); D(x, 0.11, -0.5, 0.035, OUT);
    // ほっぺの もよう（日の あざ ふう）
    L(x, [[-0.28, -0.42], [-0.18, -0.4]], '#c8302a', 0.04);
  },
  // きつね（びじゅう。オレンジの 顔）
  fox(x) {
    P(x, [[-0.7, -0.2], [-0.95, -1.05], [-0.25, -0.55]], '#ff8a2a', '#8a3a0a', 0.06);
    P(x, [[0.7, -0.2], [0.95, -1.05], [0.25, -0.55]], '#ff8a2a', '#8a3a0a', 0.06);
    P(x, [[-0.9, -0.35], [0.9, -0.35], [0.5, 0.55], [0, 0.9], [-0.5, 0.55]], '#ff9a3a', '#8a3a0a', 0.07);
    P(x, [[-0.35, 0.3], [0.35, 0.3], [0, 0.82]], '#fff0dc', null);
    P(x, [[-0.55, -0.12], [-0.15, -0.02], [-0.5, 0.06]], '#c8202a', null);
    P(x, [[0.55, -0.12], [0.15, -0.02], [0.5, 0.06]], '#c8202a', null);
    D(x, 0, 0.62, 0.08, OUT);
  },
  // ドローン（4つの プロペラ。まわる）
  drone(x, p) {
    const sp = (p.age || 0) / 20;
    R(x, -0.42, -0.2, 0.84, 0.4, 0.15, '#e8eef6', '#3a4a5a', 0.06);
    D(x, 0, 0.02, 0.12, '#20d0c8');
    for (const s of [-1, 1]) {
      L(x, [[s * 0.4, -0.05], [s * 0.85, -0.3]], '#3a4a5a', 0.08);
      x.save(); x.translate(s * 0.85, -0.35); x.scale(1, 0.25); x.rotate(sp * s);
      x.globalAlpha *= 0.7; R(x, -0.38, -0.06, 0.76, 0.12, 0.05, '#c8d8e8', null); x.restore();
    }
    R(x, -0.1, 0.18, 0.2, 0.18, 0.04, '#3a4a5a', null);
  },
  // カプセルの お薬（赤と 白）
  capsule(x) {
    x.save(); x.rotate(0.5);
    R(x, -0.8, -0.32, 0.8, 0.64, 0.32, '#ff4a6a', '#8a1a2a', 0.06);
    R(x, 0, -0.32, 0.8, 0.64, 0.32, '#ffffff', '#8a1a2a', 0.06);
    R(x, -0.5, -0.2, 0.4, 0.1, 0.05, 'rgba(255,255,255,0.7)', null);
    x.restore();
  },
  // AIの チップ（四角に ピン。まん中に ひかる わ）
  chip(x, p) {
    R(x, -0.7, -0.7, 1.4, 1.4, 0.12, '#1a2a3a', '#20d0c8', 0.07);
    for (let i = 0; i < 4; i++) {
      const u = -0.45 + i * 0.3;
      L(x, [[u, -0.7], [u, -0.95]], '#c8d8e8', 0.08); L(x, [[u, 0.7], [u, 0.95]], '#c8d8e8', 0.08);
      L(x, [[-0.7, u], [-0.95, u]], '#c8d8e8', 0.08); L(x, [[0.7, u], [0.95, u]], '#c8d8e8', 0.08);
    }
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 0.75, '#20d0c8', 0.6 + 0.3 * Math.sin((p.age || 0) / 90));
    x.globalCompositeOperation = 'source-over';
    x.font = 'bold 0.7px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#e8fffc'; x.fillText('AI', 0, 0.04);
  },
  // おなかを かかえて 笑う 顔（なみだ つき）
  laugh(x, p) {
    const b = Math.sin((p.age || 0) / 60) * 0.06;
    E(x, 0, b, 0.85, 0.82, '#ffd84a', '#a8720a', 0.07);
    x.save(); x.translate(0, b); smile(x, '#5a3a0a', true, 0.1); x.restore();
    D(x, -0.62, -0.1 + b, 0.1, '#7ad8ff'); D(x, 0.62, -0.1 + b, 0.1, '#7ad8ff');
  },
  // 上向きの 矢印（p.color）
  arrow(x, p) {
    P(x, [[0, -1], [0.85, -0.05], [0.35, -0.05], [0.35, 0.95], [-0.35, 0.95], [-0.35, -0.05], [-0.85, -0.05]], p.color || '#ff5a5a', '#ffffff', 0.16);
  },
  // 金の 王冠
  crown(x) {
    P(x, [[-0.9, 0.5], [-0.95, -0.45], [-0.45, 0.05], [0, -0.7], [0.45, 0.05], [0.95, -0.45], [0.9, 0.5]], '#ffd23a', '#8a6a0a', 0.07);
    for (const [cx, cy, col] of [[-0.95, -0.5, '#ff3a5a'], [0, -0.75, '#3a8aff'], [0.95, -0.5, '#3aff9a']]) D(x, cx, cy, 0.12, col);
  },
  // しせつの 建物の 断面（AIが まもる）
  building(x, p) {
    R(x, -0.8, -0.95, 1.6, 1.9, 0.06, '#e8eef6', '#3a4a5a', 0.06);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) {
      const on = hash(r * 7 + q + Math.floor((p.age || 0) / 160)) > 0.35;
      R(x, -0.6 + q * 0.42, -0.8 + r * 0.42, 0.3, 0.28, 0.03, on ? '#7af0ff' : '#5a7a9a', null);
    }
    R(x, -0.16, 0.6, 0.32, 0.35, 0.03, '#3a4a5a', null);
  },
};
export const O7_SHAPES = Object.keys(OBJ);

// 小物の いち（keys … [[ms, x, y, 大きさ, 回転], …] か x0,y0 → x1,y1）。へんじ [x, y, 大きさ, 回転]
export function objPos(p, age = p.age) {
  if (p.keys) {
    const ks = p.keys;
    if (age <= ks[0][0]) return [ks[0][1], ks[0][2], ks[0][3] ?? 1, ks[0][4] ?? 0];
    for (let i = 1; i < ks.length; i++) {
      if (age <= ks[i][0]) {
        const a = ks[i - 1], b = ks[i];
        let u = (age - a[0]) / Math.max(1, b[0] - a[0]);
        u = p.ease === 'in' ? easeIn(u) * 0.6 + u * 0.4 : p.ease === 'io' ? easeInOut(u) : easeOut(u);
        return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3] ?? 1, b[3] ?? 1, u), lerp(a[4] ?? 0, b[4] ?? 0, u)];
      }
    }
    const z = ks[ks.length - 1];
    return [z[1], z[2], z[3] ?? 1, z[4] ?? 0];
  }
  const travel = p.travel || 0;
  if (!(travel > 0) || p.x0 === undefined) return [p.x, p.y, 1, 0];
  const e = clamp01(age / travel);
  const k = p.ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : p.ease === 'io' ? easeInOut(e) : p.ease === 'lin' ? e : easeOut(e);
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(e * Math.PI), 1, 0];
}

const font = (size) => `bold ${size}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;

export const AX_O7_FINE = {
  // 小物: shape・s（大きさ px）・pop（ふくらむ ms）・spin・rot0・flip・wob・glow・trail（のこりの ひかり）・alpha
  o7Obj(x, p) {
    const a = envOf(p, 60, 140) * (p.alpha ?? 1);
    if (a <= 0) return;
    const draw = OBJ[p.shape];
    if (!draw) return;
    const s0 = p.s || 8;
    const sc = p.pop ? backOut(clamp01(p.age / p.pop)) : 1;
    x.save();
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      for (let i = p.trail; i >= 1; i--) {
        const [tx, ty] = objPos(p, p.age - i * 26);
        softGlow(x, tx, ty, s0 * (1.4 - i * 0.12), p.glow || '#ffffff', (a * 0.45) / i);
      }
    }
    const [cx, cy, k, r] = objPos(p);
    const s = s0 * k;
    x.translate(cx, cy);
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, s * (p.glowR || 2), p.glow, a * 0.55); }
    x.globalCompositeOperation = 'source-over';
    const wob = p.wob ? Math.sin(p.age / (p.wobMs || 70)) * p.wob : 0;
    x.rotate((p.rot0 || 0) + r + ((p.spin || 0) * p.age) / 1000 + wob);
    x.scale(s * sc * (p.flip ? -1 : 1), s * sc);
    x.globalAlpha = a;
    x.lineJoin = 'round';
    draw(x, p, a);
    x.restore();
  },
  // カタカナの 擬音: text・size・fill・edge・burst（ギザギザ星の 色）・bubble・rot・rise・s
  o7Text(x, p) {
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const sc = backOut(clamp01(p.age / (p.pop || 170))) * (p.s || 1);
    const size = p.size || 12;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - (p.rise || 0) * clamp01(p.age / p.life));
    x.rotate((p.rot || 0) + (p.wob ? Math.sin(p.age / 80) * p.wob : 0));
    x.scale(sc, sc);
    x.font = font(size);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    const mw = x.measureText(p.text)?.width;
    const w = Number.isFinite(mw) ? mw : p.text.length * size;
    if (p.burst) {
      const rx = w * 0.62 + 8, ry = size * 1.05 + 4;
      P(x, starPts(12, 1, 0.72, p.age / 900).map(([u, v]) => [u * rx, v * ry]), p.burst, p.burstEdge || '#c8202a', 2);
    }
    if (p.bubble) {
      const bw = w + 10, bh = size + 7;
      R(x, -bw / 2, -bh / 2, bw, bh, 5, p.bubble, p.edge || OUT, 1.6);
    } else if (!p.burst || p.stroke) {
      x.lineWidth = p.lw || 3; x.lineJoin = 'round';
      x.strokeStyle = p.edge || OUT;
      x.strokeText(p.text, 0, 0.5);
    }
    x.fillStyle = p.fill || '#ffffff';
    x.fillText(p.text, 0, 0.5);
    x.restore();
  },
  // AIの 六角形の パネル（r … 大きさ、n … 何重、color）。ひろがって ちかちか
  o7Hex(x, p) {
    const a = envOf(p, 120, 220) * (p.alpha ?? 0.9);
    if (a <= 0) return;
    const u = easeOut(clamp01(p.age / (p.grow || 260)));
    const r = (p.r || 8) * (0.4 + 0.6 * u), n = p.n || 2;
    const col = p.color || '#20d0c8';
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, p.sy ?? 1);
    x.globalCompositeOperation = 'lighter';
    x.lineWidth = 1;
    const cells = [[0, 0]];
    for (let ring = 1; ring <= n; ring++) for (let i = 0; i < 6; i++) {
      const an = (i / 6) * TAU + Math.PI / 6;
      for (let j = 0; j < ring; j++) {
        const bx = Math.cos(an) * ring - Math.cos(an + TAU / 3) * j, by = Math.sin(an) * ring - Math.sin(an + TAU / 3) * j;
        cells.push([bx * r * 1.75, by * r * 1.75]);
      }
    }
    cells.forEach(([cx, cy], i) => {
      const fl = 0.45 + 0.55 * hash(i * 3.1 + Math.floor(p.age / 90));
      x.globalAlpha = a * fl;
      x.strokeStyle = col;
      poly(x, [0, 1, 2, 3, 4, 5].map((q) => [cx + Math.cos((q / 6) * TAU) * r, cy + Math.sin((q / 6) * TAU) * r]));
      x.stroke();
      if (fl > 0.85) { x.globalAlpha = a * 0.25; x.fillStyle = col; x.fill(); }
    });
    x.restore();
  },
  // ねらいの わ（AIの 照準）: r・color。ちぢんで ロックオン（lock ms）
  o7Reticle(x, p) {
    const a = envOf(p, 80, 180);
    if (a <= 0) return;
    const u = easeOut(clamp01(p.age / (p.lock || 300)));
    const r = (p.r || 16) * (1.8 - 0.8 * u);
    const col = u >= 1 ? p.lockColor || '#ff4a5a' : p.color || '#20d0c8';
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.age / 400);
    x.globalAlpha = a;
    x.strokeStyle = col;
    x.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(0, 0, r, (i / 4) * TAU + 0.25, ((i + 1) / 4) * TAU - 0.25); x.stroke(); }
    x.rotate(-p.age / 400);
    for (let i = 0; i < 4; i++) {
      const an = (i / 4) * TAU;
      x.beginPath(); x.moveTo(Math.cos(an) * r * 0.55, Math.sin(an) * r * 0.55); x.lineTo(Math.cos(an) * r * 1.2, Math.sin(an) * r * 1.2); x.stroke();
    }
    x.restore();
  },
  // うすい 背景（v: sea・dawn・sky・night・fire・tech）
  o7Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = envOf(p, 120, 220) * Math.min(0.35, p.a ?? 0.28);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const bands = (cols) => { const hh = H / cols.length; cols.forEach((c, i) => { x.globalAlpha = a; x.fillStyle = c; x.fillRect(-8, i * hh - 0.5, W + 16, hh + 1); }); };
    const rays = (cx, cy, col, n = 14) => {
      x.globalCompositeOperation = 'lighter';
      x.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + p.age / 2400;
        x.globalAlpha = a * 0.6;
        x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an - 0.08) * 320, cy + Math.sin(an - 0.08) * 320); x.lineTo(cx + Math.cos(an + 0.08) * 320, cy + Math.sin(an + 0.08) * 320); x.closePath(); x.fill();
      }
      softGlow(x, cx, cy, 70, col, a * 1.4);
    };
    const v = p.v;
    if (v === 'sea') {
      bands(['#7ac8ff', '#a8dcff', '#e8f6ff', '#2a8ad8', '#1a6ab8', '#0a4a98']);
      rays(p.sx ?? W / 2, p.sy ?? 70, '#fff6c8');
    } else if (v === 'dawn') {
      bands(['#ffd8a0', '#ffe8c0', '#fff4d8', '#ffe0a0', '#ffc070']);
      rays(p.sx ?? W / 2, p.sy ?? 60, '#fff0a0');
    } else if (v === 'night') {
      bands(['#0a0a28', '#141838', '#1a2048', '#202850']);
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 20; i++) { x.globalAlpha = a * (1 + Math.sin(p.age / 140 + i)); x.fillStyle = '#ffffff'; x.fillRect(hash(i * 1.7) * W, hash(i * 2.9) * H * 0.7, 1.3, 1.3); }
    } else if (v === 'fire') {
      bands(['#3a0a0a', '#7a1a0a', '#c83a0a', '#ff7a1a', '#ffb04a']);
    } else if (v === 'gold') {
      bands(['#5a3a10', '#7a5018', '#a06a20', '#7a5018']);
      rays(p.sx ?? W / 2, p.sy ?? 40, '#ffe080');
    } else {
      bands(['#06222a', '#0a3038', '#0a3a44', '#06222a']);
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = '#20d0c8';
      x.globalAlpha = a * 0.9;
      x.lineWidth = 0.6;
      const off = (p.age / 20) % 16;
      for (let i = -1; i < W / 16 + 1; i++) { x.beginPath(); x.moveTo(i * 16 + off, 0); x.lineTo(i * 16 + off, H); x.stroke(); }
      for (let j = 0; j < H / 16 + 1; j++) { x.beginPath(); x.moveTo(0, j * 16); x.lineTo(W, j * 16); x.stroke(); }
    }
    x.restore();
  },
};
