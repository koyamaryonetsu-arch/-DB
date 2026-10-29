// 第50回 D2: すごろくの えんしゅつ（3Dの さいころ・つぶつぶ・ルーレット・花火）
//   render/sugoroku.js の SgBoardView が つかう。ここは 絵を かくだけ（さいころの 目は サーバーが きめる）
const FONT = "'KizunaDot', 'DotGothic16', monospace";

// ───────────── 3Dの さいころ ─────────────
// 3x3 の 回転（行ごと）
const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
export function mul3(a, b) {
  const o = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
  return o;
}
const rx = (t) => [1, 0, 0, 0, Math.cos(t), -Math.sin(t), 0, Math.sin(t), Math.cos(t)];
const ry = (t) => [Math.cos(t), 0, Math.sin(t), 0, 1, 0, -Math.sin(t), 0, Math.cos(t)];
// 軸 k（長さ 1）の まわりに t
export function rotAxis(k, t) {
  const [x, y, z] = k, c = Math.cos(t), s = Math.sin(t), v = 1 - c;
  return [c + x * x * v, x * y * v - z * s, x * z * v + y * s, y * x * v + z * s, c + y * y * v, y * z * v - x * s, z * x * v - y * s, z * y * v + x * s, c + z * z * v];
}
const ap = (m, [x, y, z]) => [m[0] * x + m[1] * y + m[2] * z, m[3] * x + m[4] * y + m[5] * z, m[6] * x + m[7] * y + m[8] * z];
// 面（目・むき n・面の 横 a・面の たて b）。むかいあう 面は たして 7
const FACES = [
  { v: 1, n: [0, 0, 1], a: [1, 0, 0], b: [0, 1, 0] },
  { v: 6, n: [0, 0, -1], a: [-1, 0, 0], b: [0, 1, 0] },
  { v: 2, n: [0, -1, 0], a: [1, 0, 0], b: [0, 0, 1] },
  { v: 5, n: [0, 1, 0], a: [1, 0, 0], b: [0, 0, -1] },
  { v: 3, n: [1, 0, 0], a: [0, 0, -1], b: [0, 1, 0] },
  { v: 4, n: [-1, 0, 0], a: [0, 0, 1], b: [0, 1, 0] },
];
const TO_FRONT = { 1: I3, 6: ry(Math.PI), 2: rx(-Math.PI / 2), 5: rx(Math.PI / 2), 3: ry(-Math.PI / 2), 4: ry(Math.PI / 2) };
const TILT = mul3(rx(-0.42), ry(-0.5));
// その 目が 前を むく むき（上と 右の 面も 少し 見える）
export function dieOrient(v) {
  return mul3(TILT, TO_FRONT[v] || I3);
}
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

// rot … むき（3x3）/ label(v) … 面に かく 数（金のさいころ）。null なら 目（●）
export function drawDie3D(ctx, cx, cy, size, rot, { gold = false, label = null, glow = 0 } = {}) {
  const h = size / 2;
  const light = [-0.35, -0.6, 0.72];
  for (const f of FACES) {
    const n = ap(rot, f.n);
    if (n[2] <= 0.02) continue;
    const C = ap(rot, f.n.map((x) => x * h)), A = ap(rot, f.a.map((x) => x * h)), B = ap(rot, f.b.map((x) => x * h));
    const bright = Math.max(0.45, Math.min(1.08, 0.55 + 0.55 * (n[0] * light[0] + n[1] * light[1] + n[2] * light[2])));
    ctx.save();
    ctx.translate(cx + C[0], cy + C[1]);
    ctx.transform(A[0], A[1], B[0], B[1], 0, 0);
    // 面（角を まるく）
    const r = 0.28;
    ctx.beginPath();
    ctx.moveTo(-1 + r, -1);
    ctx.lineTo(1 - r, -1); ctx.quadraticCurveTo(1, -1, 1, -1 + r);
    ctx.lineTo(1, 1 - r); ctx.quadraticCurveTo(1, 1, 1 - r, 1);
    ctx.lineTo(-1 + r, 1); ctx.quadraticCurveTo(-1, 1, -1, 1 - r);
    ctx.lineTo(-1, -1 + r); ctx.quadraticCurveTo(-1, -1, -1 + r, -1);
    ctx.closePath();
    const base = gold ? [255, 214, 74] : [250, 248, 240];
    ctx.fillStyle = `rgb(${base.map((x) => Math.round(Math.min(255, x * bright))).join(',')})`;
    ctx.fill();
    ctx.lineWidth = 0.07;
    ctx.strokeStyle = gold ? '#8a5a08' : '#5a5060';
    ctx.stroke();
    if (glow > 0 && f.v === 1) {
      ctx.fillStyle = `rgba(255,255,200,${glow * 0.35})`;
      ctx.fill();
    }
    const lab = label ? label(f.v) : null;
    if (lab !== null && lab !== undefined) {
      ctx.scale(1 / 40, 1 / 40);
      ctx.fillStyle = gold ? '#5a2a08' : '#2a1a3a';
      ctx.font = `${String(lab).length > 1 ? 50 : 62}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(lab), 0, 4);
    } else {
      for (const [px, py] of PIPS[f.v]) {
        ctx.beginPath();
        ctx.arc(px * 0.52, py * 0.52, f.v === 1 ? 0.27 : 0.17, 0, Math.PI * 2);
        ctx.fillStyle = f.v === 1 ? (gold ? '#c0202a' : '#d0202a') : '#1a1a2a';
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

// ───────────── つぶつぶ ─────────────
// p: { x, y, vx, vy, g, life, max, size, color, kind, rot, vr, screen, text, drag }
//   board の つぶは マスの 目（1 ＝ 1マス）、screen の つぶは 画面の 点
export class Sparks {
  constructor() { this.list = []; }
  add(p) {
    this.list.push({ vx: 0, vy: 0, g: 0, rot: 0, vr: 0, drag: 0, size: 0.1, life: 0, max: 700, color: '#fff', kind: 'dot', ...p });
    if (this.list.length > 600) this.list.splice(0, this.list.length - 600);
  }
  update(dt) {
    const s = dt / 1000;
    for (const p of this.list) {
      p.life += dt;
      p.vy += p.g * s;
      if (p.drag) { p.vx *= Math.pow(1 - p.drag, s * 60); p.vy *= Math.pow(1 - p.drag, s * 60); }
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.rot += p.vr * s;
      if (p.burst && !p.done && p.life >= p.max) { p.done = true; p.burst(p); }
    }
    this.list = this.list.filter((p) => p.life < p.max);
  }
  // toPx(x, y) … マスの 目 → 画面 / c … 1マスの 大きさ
  draw(ctx, toPx, c, screen = false) {
    for (const p of this.list) {
      if (!!p.screen !== screen) continue;
      const k = p.life / p.max;
      const [x, y] = screen ? [p.x, p.y] : toPx(p.x, p.y);
      const sz = (screen ? p.size : p.size * c) * (p.grow ? 1 + k * p.grow : 1);
      const a = p.fade === false ? 1 : k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.globalAlpha = Math.max(0, Math.min(1, a * (p.alpha ?? 1)));
      drawSpark(ctx, p, x, y, sz, k);
    }
    ctx.globalAlpha = 1;
  }
}

function star(ctx, x, y, r, n = 5, inner = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const t = rot + (i * Math.PI) / n;
    ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
  }
  ctx.closePath();
}
export { star as starPath };

function drawSpark(ctx, p, x, y, sz, k) {
  ctx.fillStyle = p.color;
  switch (p.kind) {
    case 'coin': {
      // くるくる まわる 金貨
      const w = Math.abs(Math.cos(p.rot)) * sz + 1;
      ctx.fillStyle = '#b07808';
      ctx.beginPath(); ctx.ellipse(x, y + sz * 0.12, w, sz, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd84a';
      ctx.beginPath(); ctx.ellipse(x, y, w, sz, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff6c0';
      ctx.beginPath(); ctx.ellipse(x - w * 0.3, y - sz * 0.3, w * 0.25, sz * 0.25, 0, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'star':
      star(ctx, x, y, sz, 5, 0.45, p.rot);
      ctx.fill();
      break;
    case 'spark':
      // 十字の きらめき
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
      star(ctx, 0, 0, sz, 4, 0.22, 0);
      ctx.fill();
      ctx.restore();
      break;
    case 'confetti':
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
      ctx.fillRect(-sz, -sz * 0.45 * Math.abs(Math.cos(p.rot * 1.7)), sz * 2, sz * 0.9 * Math.abs(Math.cos(p.rot * 1.7)) + 1);
      ctx.restore();
      break;
    case 'ring':
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, sz * 0.18 * (1 - k));
      ctx.beginPath(); ctx.arc(x, y, sz * (0.2 + k), 0, Math.PI * 2); ctx.stroke();
      break;
    case 'swirl': {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1.5, sz * 0.12);
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const r = sz * (1 - k) * (0.4 + i * 0.3);
        ctx.moveTo(x + Math.cos(p.rot + i * 2.1) * r, y + Math.sin(p.rot + i * 2.1) * r);
        ctx.arc(x, y, r, p.rot + i * 2.1, p.rot + i * 2.1 + 1.6);
      }
      ctx.stroke();
      break;
    }
    case 'heart': {
      const s = sz;
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.8);
      ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.4);
      ctx.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.2, x, y + s * 0.8);
      ctx.fill();
      break;
    }
    case 'plus':
      ctx.fillRect(x - sz, y - sz * 0.3, sz * 2, sz * 0.6);
      ctx.fillRect(x - sz * 0.3, y - sz, sz * 0.6, sz * 2);
      break;
    case 'dust':
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(x, y, sz * (0.6 + k * 0.8), 0, Math.PI * 2); ctx.fill();
      break;
    case 'text': {
      // ぽんと 出る 文字（大きく → 少し 小さく）
      const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : k < 0.25 ? 1.2 - ((k - 0.15) / 0.1) * 0.2 : 1;
      ctx.font = `${Math.round(sz * pop)}px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = Math.max(3, sz * pop * 0.16);
      ctx.strokeStyle = p.stroke || '#2a1408';
      ctx.strokeText(p.text, x, y);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, x, y);
      break;
    }
    case 'img':
      if (p.img) {
        const hop = Math.abs(Math.sin(p.life / 140)) * sz * 0.15;
        const kk = (sz * 1.6) / Math.max(p.img.width, p.img.height);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(p.img, x - (p.img.width * kk) / 2, y - p.img.height * kk - hop, p.img.width * kk, p.img.height * kk);
      }
      break;
    case 'chest': chestArt(ctx, x, y, sz, Math.min(1, k * 3)); break;
    case 'spikes': {
      const up = k < 0.3 ? k / 0.3 : 1;
      ctx.fillStyle = '#c8c8d8';
      ctx.strokeStyle = '#4a4a5a';
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * sz * 0.36 - sz * 0.15, y);
        ctx.lineTo(x + i * sz * 0.36, y - sz * 0.9 * up);
        ctx.lineTo(x + i * sz * 0.36 + sz * 0.15, y);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      break;
    }
    case 'rays': {
      ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, sz);
      g.addColorStop(0, p.color);
      g.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = g;
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sz, -sz * 0.12); ctx.lineTo(sz, sz * 0.12); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      break;
    }
    default:
      ctx.beginPath(); ctx.arc(x, y, sz, 0, Math.PI * 2); ctx.fill();
  }
}

// 宝箱（open 0 → 1 で ふたが 開く）
export function chestArt(ctx, x, y, sz, open = 0) {
  const w = sz * 1.5, h = sz * 0.9;
  if (open > 0.4) {
    const g = ctx.createRadialGradient(x, y - h, 0, x, y - h, sz * 1.6);
    g.addColorStop(0, `rgba(255,240,150,${0.8 * open})`);
    g.addColorStop(1, 'rgba(255,240,150,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - sz * 1.6, y - h - sz * 1.6, sz * 3.2, sz * 3.2);
  }
  ctx.fillStyle = '#8a4a14';
  ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = '#ffd84a';
  ctx.fillRect(x - w / 2, y - h * 0.62, w, h * 0.14);
  ctx.fillRect(x - w * 0.08, y - h * 0.75, w * 0.16, h * 0.4);
  ctx.strokeStyle = '#3a1a08';
  ctx.lineWidth = Math.max(1, sz * 0.06);
  ctx.strokeRect(x - w / 2, y - h, w, h);
  // ふた（開くと 上へ たおれる）
  ctx.save();
  ctx.translate(x, y - h);
  ctx.scale(1, 1 - open * 1.6);
  ctx.fillStyle = '#a85a1a';
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h * 0.35); ctx.quadraticCurveTo(0, -h * 0.75, w / 2, -h * 0.35); ctx.lineTo(w / 2, 0); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.restore();
}

// ───────────── ルーレット ─────────────
const WHEEL_COL = ['#e8b818', '#3a9a5a', '#2a8ad8', '#d85a8a', '#d87a20', '#9a6020', '#7a5ab8', '#e83a3a'];
// segs … わくの 文字 / ang … 回った 角度（0 で わく0 が 上）/ hi … 光らせる わく
export function drawWheel(ctx, cx, cy, r, segs, ang, hi = -1, now = 0) {
  const n = segs.length;
  const step = (Math.PI * 2) / n;
  // かげ
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.arc(cx + r * 0.05, cy + r * 0.07, r * 1.08, 0, Math.PI * 2); ctx.fill();
  // ふち（電球）
  ctx.fillStyle = '#5a2a6a';
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.08, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const on = (Math.floor(now / 120) + i) % 2 === 0;
    ctx.fillStyle = on ? '#fff6a0' : '#a87a30';
    ctx.beginPath(); ctx.arc(cx + Math.cos(t) * r * 1.04, cy + Math.sin(t) * r * 1.04, r * 0.035, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + ang + i * step - step / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a0 + step);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COL[i % WHEEL_COL.length];
    ctx.fill();
    if (i === hi && Math.floor(now / 110) % 2 === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fill();
    }
    ctx.strokeStyle = '#fff6e0';
    ctx.lineWidth = Math.max(1.5, r * 0.02);
    ctx.stroke();
    // 文字
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a0 + step / 2);
    ctx.translate(r * 0.66, 0);
    ctx.rotate(Math.PI / 2);
    const t = segs[i];
    ctx.font = `${Math.round(r * (t.length >= 3 ? 0.13 : t.length === 2 ? 0.17 : 0.24))}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(2, r * 0.03);
    ctx.strokeStyle = 'rgba(40,20,10,0.8)';
    ctx.strokeText(t, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillText(t, 0, 0);
    ctx.restore();
  }
  // まん中
  ctx.fillStyle = '#ffd84a';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5a08'; ctx.lineWidth = Math.max(2, r * 0.03); ctx.stroke();
  // はり（上）
  ctx.fillStyle = '#ff3a3a';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = Math.max(2, r * 0.025);
  ctx.beginPath();
  ctx.moveTo(cx, cy - r * 0.84);
  ctx.lineTo(cx - r * 0.12, cy - r * 1.2);
  ctx.lineTo(cx + r * 0.12, cy - r * 1.2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
}

// ───────────── 花火・紙ふぶき（screen の つぶ）─────────────
const HUES = ['#ff5a5a', '#ffd84a', '#5ad8ff', '#8aff6a', '#ff8ae8', '#ffffff', '#ffa84a'];
export function firework(sp, x, y, big = 1) {
  const col = HUES[Math.floor(Math.random() * HUES.length)];
  const col2 = HUES[Math.floor(Math.random() * HUES.length)];
  const n = Math.round(28 * big);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 + Math.random() * 0.1;
    const v = (120 + Math.random() * 90) * big;
    sp.add({ screen: true, x, y, vx: Math.cos(t) * v, vy: Math.sin(t) * v, g: 90, drag: 0.04, max: 900 + Math.random() * 400, size: 2.6 * big, color: i % 3 ? col : col2, kind: i % 4 ? 'dot' : 'spark', vr: 6 });
  }
  sp.add({ screen: true, x, y, max: 420, size: 60 * big, color: col, kind: 'ring' });
}
// 上へ のぼって ひらく 花火（ひらいた ときに cb）
export function rocket(sp, x, y0, y1, cb) {
  sp.add({ screen: true, x, y: y0, vy: -(y0 - y1) / 0.6, max: 600, size: 2.5, color: '#fff6c0', kind: 'dot', burst: (p) => cb?.(p.x, p.y) });
}
export function confetti(sp, w, n = 40) {
  for (let i = 0; i < n; i++) {
    sp.add({
      screen: true, x: Math.random() * w, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 40, vy: 60 + Math.random() * 70,
      g: 30, drag: 0.01, max: 3200 + Math.random() * 1200, size: 4 + Math.random() * 3, color: HUES[i % HUES.length], kind: 'confetti', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8,
    });
  }
}
