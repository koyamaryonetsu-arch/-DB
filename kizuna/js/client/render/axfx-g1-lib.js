// 第48回 G1: え の ぶひん（つぶの かきかた g1〜 と 小さな どうぐ）。axfx-g1.js が まとめて とうろく する
// ・気の たま（g1Ball）・かめはめ波の ビーム（g1Beam）・ドーム爆発（g1Dome）・気円斬（g1Disc）・竜（g1Dragon）・こぶし（g1Fist）
//   ざんぞうの 人（g1Ghost）・しるし（g1Mark: Z ? ! ×2 ぐるぐる やじるし）・どうぐ（g1Prop）・マンガの 爆発（g1Boom）・大ザル（g1Monkey）
//   はいけい（g1Bg）・ライト（g1Cone）・タケコプター（g1Copter）・水の 弧（g1Arc）・空気の わ（g1Air）・花（g1Flower）・扇の 気（g1Fan）・光の みち（g1Path）・はかいの 膜（g1Hakai）
// ・ざひょうは 256×144。p.age（ms）で かく。x の 状態は save/restore で もどす
import { softGlow, disc, hash, clamp01, lerp, easeOut, easeIn, easeInOut, fadeOut, mixHex } from './axkit.js?v=4ed9358095f4';

export const TAU = Math.PI * 2;
const ell = (x, cx, cy, rx, ry, rot = 0) => { if (rx > 0.05 && ry > 0.05) { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot, 0, TAU); return true; } return false; };
const fillEll = (x, cx, cy, rx, ry, rot = 0) => { if (ell(x, cx, cy, rx, ry, rot)) x.fill(); };
const strokeEll = (x, cx, cy, rx, ry, rot = 0) => { if (ell(x, cx, cy, rx, ry, rot)) x.stroke(); };
const poly = (x, pts, close = true) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); if (close) x.closePath(); };
const envOf = (p, fin = 100, fout = 160) => clamp01(p.age / Math.max(1, fin)) * clamp01((p.life - p.age) / Math.max(1, fout));
// たびの いち（start から travel で x0,y0 → x1,y1。hop … 弧）
function travelPos(p, ease = 'smooth') {
  if (p.x1 === undefined || !(p.travel > 0)) return [p.x0 ?? p.x, p.y0 ?? p.y, 0];
  const e = clamp01((p.age - (p.start || 0)) / p.travel);
  const k = ease === 'in' ? easeIn(e) * 0.6 + e * 0.4 : ease === 'lin' ? e : e * e * (3 - 2 * e) * 0.4 + e * 0.6;
  return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI), e];
}

// ───────────── 小さな どうぐ ─────────────
// はなつ ところ（味方は 画面の 下の その 人の 列、敵は え の まん中の すこし 前）
export function org(c, up = 0) {
  return c.fromAlly ? { x: c.from.x, y: c.H - 16 - up } : { x: c.from.x, y: c.from.y + 4 - up };
}
// 自分・味方に かける ときの まん中（味方は 画面の 下。敵が 自分に かけた ときは 敵の からだ）
export function selfAt(c, t = c.t) {
  if (c.fromAlly || t.y > c.H * 0.7) return { x: t.x, y: c.H - 18, foot: c.H + 2, top: c.H - 64, ally: true };
  return { x: t.x, y: t.y, foot: t.y + 22, top: t.y - 34, ally: false };
}
// 的の かずで つぶの かずを へらす
// （敵 2体 0.64・3体 0.52・5体 0.4 ばい。k … へらしかたの よわさ 0.55 が ふつう）
export const N = (c, base, k = 0.55) => Math.max(1, Math.round(base * (c.n > 1 ? Math.min(1, Math.max(0.25, (k / 0.55) * 0.9 / Math.sqrt(c.n))) : 1)));
// 段の くらさ（S・L は はなつ あいだ くらく）
export function darken(c, a, life, o = {}) {
  c.k.tint(o.color || '#05030c', { a, life, fin: o.fin ?? 60, fout: o.fout ?? 260, delay: o.delay || 0 });
}
// はいけい（style: space・lines・rays・sky）
export function bg(c, style, o = {}) {
  c.fx.add({ kind: 'g1Bg', style, x: o.x ?? c.W / 2, y: o.y ?? c.H / 2, color: o.color || '#ffd23a', color2: o.color2 || '#1a1030', a: o.a ?? 0.85, delay: o.delay || 0, life: o.life ?? c.len, fin: o.fin ?? 120, fout: o.fout ?? 260, seed: Math.random() * 100 });
}
// 気の たま
export function ball(c, x, y, o = {}) {
  const p = { kind: 'g1Ball', x: o.to ? o.to.x : x, y: o.to ? o.to.y : y, x0: x, y0: y, r: o.r || 8, style: o.style || 'ki', color: o.color || '#4ab8ff', glow: o.glow || '#a8e4ff', core: o.core || '#ffffff', rim: o.rim || null, swirl: o.swirl || null, zap: o.zap || null, rays: o.rays ?? true, grow: o.grow ?? 160, delay: o.delay || 0, life: o.life ?? 400, seed: Math.random() * 100, pop: o.pop ?? 120 };
  if (o.to) Object.assign(p, { x1: o.to.x, y1: o.to.y, start: o.start ?? p.grow, travel: o.travel ?? 200, hop: o.hop || 0, ease: o.ease || 'smooth' });
  c.fx.add(p);
  return (o.delay || 0) + (o.to ? (o.start ?? p.grow) + (o.travel ?? 200) : p.grow);
}
// かめはめ波の ビーム
export function kbeam(c, x0, y0, x1, y1, o = {}) {
  const p = {
    kind: 'g1Beam', x: x1, y: y1, x0, y0, tx: x1, ty: y1, w: o.w || 9, color: o.color || '#4ab8ff', glow: o.glow || '#a8e4ff', core: o.core || '#ffffff',
    rim: o.rim || null, rim2: o.rim2 || null, spiral: o.spiral || null, twist: o.twist || null, zap: o.zap || null, path: o.path || null, sweep: o.sweep || null,
    through: !!o.through, coreW: o.coreW, grow: o.grow ?? 140, rise: o.rise ?? 60, fall: o.fall ?? 220, widths: o.widths || null, delay: o.delay || 0, life: o.life ?? 600, head: o.head ?? 1, seed: Math.random() * 100,
  };
  c.fx.add(p);
  return (o.delay || 0) + p.grow;
}
// ドーム爆発（じめんから ふくらむ 半円）
export function dome(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Dome', x, y, r: o.r || 40, sx: o.sx ?? 1.4, color: o.color || '#4ab8ff', glow: o.glow || '#a8e4ff', core: o.core || '#ffffff', grow: o.grow ?? 260, delay: o.delay || 0, life: o.life ?? 600 });
}
// しるし（Z ? ! x2 dizzy up down anger sweat heart）
export function mark(c, m, x, y, o = {}) {
  c.fx.add({ kind: 'g1Mark', mark: m, x, y, vx: o.vx || 0, vy: o.vy ?? 0, g: o.g || 0, size: o.size || 6, color: o.color || '#ffffff', color2: o.color2 || '#000000', delay: o.delay || 0, life: o.life ?? 600, spin: o.spin || 0, seed: Math.random() * 100 });
}
// どうぐ・もの（prop の なまえ。to で とぶ、vx/vy で うごく）
export function prop(c, name, x, y, o = {}) {
  const p = { kind: 'g1Prop', prop: name, x: o.to ? o.to.x : x, y: o.to ? o.to.y : y, x0: x, y0: y, s: o.s || 1, rot0: o.rot ?? 0, spin: o.spin || 0, color: o.color || null, color2: o.color2 || null, delay: o.delay || 0, life: o.life ?? 600, pop: o.pop ?? 120, fade: o.fade ?? 150, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag ?? 1, seed: Math.random() * 100, flip: o.flip ? -1 : 1, open: o.open ?? null, swing: o.swing || 0, bites: o.bites || 0, glowc: o.glow || null, shrink: o.shrink || 0, spinLines: !!o.spinLines };
  if (o.to) Object.assign(p, { x0: x, y0: y, x1: o.to.x, y1: o.to.y, start: o.start || 0, travel: o.travel || 200, hop: o.hop || 0, vx: 0, vy: 0, g: 0, move: true });
  c.fx.add(p);
  return (o.delay || 0) + (o.to ? (o.start || 0) + (o.travel || 200) : 0);
}
// こぶし・手（style: fist・round・palm・muscle）。x0,y0 → x1,y1
export function fist(c, x0, y0, x1, y1, o = {}) {
  c.fx.add({ kind: 'g1Fist', style: o.style || 'fist', x: x1, y: y1, x0, y0, x1, y1, s: o.s || 1, color: o.color || '#ffffff', glow: o.glow || '#ffd23a', travel: o.travel ?? 90, delay: o.delay || 0, life: o.life ?? 260, zap: o.zap || null, seed: Math.random() * 100 });
  return (o.delay || 0) + (o.travel ?? 90);
}
// マンガの 爆発（ギザギザ）
export function boom(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Boom', x, y, r: o.r || 30, cols: o.cols || ['#ffffff', '#fff27a', '#ff9a2a', '#e8401a'], grow: o.grow ?? 160, spikes: o.spikes || 12, delay: o.delay || 0, life: o.life ?? 520, seed: Math.random() * 100, smoke: o.smoke ?? true });
}
// 光の みち（ジグザグに のこる すじ）。pts … [{x,y}]、travel … さいごまで
export function path(c, pts, o = {}) {
  c.fx.add({ kind: 'g1Path', x: pts[pts.length - 1].x, y: pts[pts.length - 1].y, pts: pts.map((q) => [q.x, q.y]), color: o.color || '#ffd23a', glow: o.glow || '#fff0a0', w: o.w || 3, travel: o.travel || 400, tail: o.tail ?? 0.35, delay: o.delay || 0, life: o.life ?? (o.travel || 400) + 300, img: o.img || null, ball: o.ball ?? true });
}

// ───────────── 人の かげ（ざんぞう・大ザル） ─────────────
function personPath(x, cx, cy, s) {
  // あたま（とがった かみ）＋ からだ（台形）＋ うで
  x.beginPath();
  const hr = 4 * s;
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI + (i / 14) * Math.PI;
    const r = hr * (i > 0 && i < 14 ? (i % 2 ? 1.0 : 1.45) : 1);
    const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
    i ? x.lineTo(px, py) : x.moveTo(px, py);
  }
  x.lineTo(cx + hr, cy + hr * 0.7);
  x.lineTo(cx + hr * 0.5, cy + hr * 1.2);
  x.lineTo(cx + hr * 2.4, cy + hr * 1.7);
  x.lineTo(cx + hr * 2.9, cy + hr * 4.2);
  x.lineTo(cx + hr * 2.0, cy + hr * 4.3);
  x.lineTo(cx + hr * 1.7, cy + hr * 2.8);
  x.lineTo(cx + hr * 1.5, cy + hr * 5.2);
  x.lineTo(cx + hr * 1.6, cy + hr * 8.2);
  x.lineTo(cx + hr * 0.3, cy + hr * 8.2);
  x.lineTo(cx, cy + hr * 5.8);
  x.lineTo(cx - hr * 0.3, cy + hr * 8.2);
  x.lineTo(cx - hr * 1.6, cy + hr * 8.2);
  x.lineTo(cx - hr * 1.5, cy + hr * 5.2);
  x.lineTo(cx - hr * 1.7, cy + hr * 2.8);
  x.lineTo(cx - hr * 2.0, cy + hr * 4.3);
  x.lineTo(cx - hr * 2.9, cy + hr * 4.2);
  x.lineTo(cx - hr * 2.4, cy + hr * 1.7);
  x.lineTo(cx - hr * 0.5, cy + hr * 1.2);
  x.lineTo(cx - hr, cy + hr * 0.7);
  x.closePath();
}

// ストロークの 字（Z ? ! ×2 など）
function strokeMark(x, m, s) {
  x.beginPath();
  switch (m) {
    case 'Z': x.moveTo(-s, -s); x.lineTo(s, -s); x.lineTo(-s, s); x.lineTo(s, s); break;
    case '?': x.arc(0, -s * 0.45, s * 0.6, Math.PI * 1.05, Math.PI * 2.35); x.lineTo(0, s * 0.45); x.moveTo(0, s * 0.95); x.lineTo(0, s * 1.05); break;
    case '!': x.moveTo(0, -s * 1.1); x.lineTo(0, s * 0.4); x.moveTo(0, s * 0.95); x.lineTo(0, s * 1.05); break;
    case 'x2':
      x.moveTo(-s * 1.4, -s * 0.5); x.lineTo(-s * 0.4, s * 0.5); x.moveTo(-s * 0.4, -s * 0.5); x.lineTo(-s * 1.4, s * 0.5);
      x.moveTo(s * 0.1, -s * 0.5); x.arc(s * 0.6, -s * 0.45, s * 0.5, Math.PI, Math.PI * 2.25); x.lineTo(s * 0.1, s * 0.75); x.lineTo(s * 1.2, s * 0.75); break;
    case 'dizzy':
      for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 1.6, r = s * (0.15 + 0.85 * i / 24); const px = Math.cos(a) * r, py = Math.sin(a) * r * 0.45; i ? x.lineTo(px, py) : x.moveTo(px, py); }
      break;
    case 'up': x.moveTo(0, s); x.lineTo(0, -s); x.moveTo(-s * 0.7, -s * 0.3); x.lineTo(0, -s); x.lineTo(s * 0.7, -s * 0.3); break;
    case 'down': x.moveTo(0, -s); x.lineTo(0, s); x.moveTo(-s * 0.7, s * 0.3); x.lineTo(0, s); x.lineTo(s * 0.7, s * 0.3); break;
    case 'anger':
      for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { x.moveTo(sx * s * 0.25, sy * s); x.quadraticCurveTo(sx * s * 0.25, sy * s * 0.25, sx * s, sy * s * 0.25); }
      break;
    case 'sweat': x.moveTo(0, -s); x.quadraticCurveTo(s * 0.8, s * 0.2, 0, s * 0.7); x.quadraticCurveTo(-s * 0.8, s * 0.2, 0, -s); break;
    case 'lines': for (let i = -1; i <= 1; i++) { x.moveTo(i * s * 0.6, -s); x.lineTo(i * s * 0.5, s * 0.2); } break;
    default: x.arc(0, 0, s, 0, TAU);
  }
}

// どうぐの え（まん中が 0,0。s … 大きさ 1 で はば 10 くらい）
const PROPS = {
  dorayaki(x, p) {
    const c1 = p.color || '#b8682a', c2 = p.color2 || '#6a2a1a';
    x.fillStyle = '#7a3a12'; fillEll(x, 0, 2.2, 6.4, 3);
    x.fillStyle = c2; x.fillRect(-6, -0.6, 12, 2.2);
    x.fillStyle = c1; fillEll(x, 0, -1.8, 6.4, 3);
    x.fillStyle = '#e8a050'; fillEll(x, -1.5, -2.6, 3, 1.1);
  },
  pot(x) { x.fillStyle = '#9aa0b0'; x.fillRect(-5, -2, 10, 6); x.fillStyle = '#c8ccd8'; x.fillRect(-6, -3, 12, 1.6); x.fillRect(-8, -1, 2, 1.2); x.fillRect(6, -1, 2, 1.2); },
  boot(x) { x.fillStyle = '#6a8a3a'; x.fillRect(-2, -6, 5, 9); x.fillRect(-2, 1, 8, 3.5); x.fillStyle = '#4a6a2a'; x.fillRect(-2, -6, 5, 1.4); },
  ball(x, p) { x.fillStyle = p.color || '#ff5a5a'; disc(x, 0, 0, 4.5, x.fillStyle); x.fillStyle = '#ffffff'; x.fillRect(-4.5, -0.8, 9, 1.6); x.fillStyle = '#ffffff'; disc(x, -1.5, -1.8, 1, '#ffffff'); },
  fish(x) { x.fillStyle = '#8ab0d0'; fillEll(x, 0, 0, 5, 2.4); poly(x, [[4, 0], [7.5, -2.6], [7.5, 2.6]]); x.fill(); disc(x, -2.8, -0.6, 0.6, '#102030'); },
  door(x, p) {
    const o = p.open ?? 0;
    x.fillStyle = '#ffffff'; x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 22, '#fff6d0', 0.6 * o); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#c03a7a'; x.fillRect(-6.6, -11, 13.2, 22);
    x.fillStyle = '#ff7ab8'; x.fillRect(-5.6, -10, 11.2 * (1 - o * 0.75), 20);
    x.fillStyle = '#ffe066'; disc(x, 3.4 - o * 8, 1, 1, '#ffe066');
    if (o > 0) { x.fillStyle = '#fff6d0'; x.fillRect(-5.6 + 11.2 * (1 - o * 0.75), -10, 11.2 * o * 0.75, 20); }
  },
  cannon(x) {
    x.fillStyle = '#2a9a4a'; x.fillRect(-7, -3.4, 12, 6.8);
    x.fillStyle = '#5ad87a'; x.fillRect(-7, -3.4, 12, 1.6);
    x.fillStyle = '#1a6a3a'; fillEll(x, 5, 0, 1.6, 3.8);
    x.fillStyle = '#ffffff'; x.fillRect(-7.5, -2.4, 1.8, 4.8);
  },
  copter(x, p) {
    const a = p.age / 22;
    x.fillStyle = '#ffd23a'; x.fillRect(-0.8, -4, 1.6, 4.4);
    x.fillStyle = '#ffb000'; fillEll(x, 0, 0.8, 2.2, 1.2);
    x.fillStyle = '#ffe066';
    const L = 7 * Math.abs(Math.cos(a));
    fillEll(x, 0, -4.4, L + 0.6, 0.9);
    x.globalAlpha *= 0.4; x.strokeStyle = '#ffffff'; x.lineWidth = 0.5; strokeEll(x, 0, -4.4, 7.4, 1.4);
  },
  light(x, p) {
    x.fillStyle = p.color || '#8a8aa0'; x.fillRect(-7, -2, 9, 4);
    x.fillStyle = p.color2 || '#c8c8e0'; poly(x, [[2, -2], [6, -4], [6, 4], [2, 2]]); x.fill();
    x.fillStyle = '#fff6b0'; x.fillRect(5.6, -3.6, 1.2, 7.2);
  },
  bell(x) {
    x.fillStyle = '#e8a010'; disc(x, 0, 0, 5, '#e8a010');
    x.fillStyle = '#ffd23a'; disc(x, -0.8, -0.8, 4.2, '#ffd23a');
    x.fillStyle = '#ffffff'; disc(x, -2, -2, 1.1, '#ffffff');
    x.strokeStyle = '#8a5a00'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(-4.6, 0.4); x.lineTo(4.6, 0.4); x.stroke();
    x.fillStyle = '#5a3a00'; disc(x, 0, 2.4, 1, '#5a3a00'); x.fillRect(-0.4, 2.4, 0.8, 2.2);
    x.fillStyle = '#e83a3a'; x.fillRect(-6, -6.4, 12, 1.8);
  },
  bomb(x, p) {
    x.fillStyle = '#20202a'; disc(x, 0, 0, 8, '#20202a');
    x.fillStyle = '#4a4a5a'; disc(x, -2.6, -2.6, 2.6, '#4a4a5a');
    x.fillStyle = '#6a6a7a'; x.fillRect(-2, -10, 4, 3);
    x.strokeStyle = '#c8a070'; x.lineWidth = 1; x.beginPath(); x.moveTo(0, -10); x.quadraticCurveTo(4, -14, 6, -12); x.stroke();
    if (p.fuse !== false) { x.globalCompositeOperation = 'lighter'; softGlow(x, 6, -12, 4 + Math.sin(p.age / 30) * 1.5, '#ffb030', 1); disc(x, 6, -12, 1, '#ffffff'); }
  },
  pudding(x, p) {
    const w = 1 + 0.06 * Math.sin(p.age / 40) * (p.wobble || 0);
    x.save(); x.scale(w, 2 - w);
    x.fillStyle = '#ffd86a'; poly(x, [[-7, 6], [-4.6, -4], [4.6, -4], [7, 6]]); x.fill();
    x.fillStyle = '#8a4a1a'; poly(x, [[-4.9, -2.6], [-4.6, -4], [4.6, -4], [4.9, -2.6]]); x.fill(); fillEll(x, 0, -4, 4.6, 1.4);
    x.fillStyle = '#fff2b0'; x.fillRect(-5, 0, 1.2, 4.6);
    x.restore();
    x.fillStyle = '#e8e8f0'; fillEll(x, 0, 6.4, 9, 1.6);
  },
  cucumber(x, p) {
    x.fillStyle = '#2a8a2a'; fillEll(x, 0, 0, 8 * (p.bite ?? 1), 2.4);
    x.fillStyle = '#5ac85a'; fillEll(x, -0.5, -0.8, 7 * (p.bite ?? 1), 1);
    x.fillStyle = '#c8f0a0'; if ((p.bite ?? 1) < 1) fillEll(x, 8 * (p.bite ?? 1), 0, 1, 2.2);
    x.fillStyle = '#ffe066'; disc(x, -8 * (p.bite ?? 1), 0, 1, '#ffe066');
  },
  slice(x) {
    x.fillStyle = '#2a8a2a'; disc(x, 0, 0, 4.6, '#2a8a2a');
    x.fillStyle = '#c8f0a0'; disc(x, 0, 0, 3.8, '#c8f0a0');
    x.fillStyle = '#e8ffd0'; disc(x, 0, 0, 1.8, '#e8ffd0');
    x.fillStyle = '#8ab070'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; fillEll(x, Math.cos(a) * 1.9, Math.sin(a) * 1.9, 0.8, 0.45, a); }
  },
  garlic(x) {
    x.fillStyle = '#f4f0e8'; fillEll(x, 0, 1, 5.5, 4.6);
    x.strokeStyle = '#c8c0b0'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(-2, -2.6); x.quadraticCurveTo(-3, 1, -1.6, 5); x.moveTo(2, -2.6); x.quadraticCurveTo(3, 1, 1.6, 5); x.stroke();
    x.fillStyle = '#e8e0c8'; poly(x, [[-1.4, -3], [0, -7], [1.4, -3]]); x.fill();
  },
  shaker(x) {
    x.fillStyle = '#f0f0f8'; x.fillRect(-3.4, -6, 6.8, 11);
    x.fillStyle = '#ff8a2a'; x.fillRect(-3.4, -1, 6.8, 3);
    x.fillStyle = '#3a8aff'; x.fillRect(-3, -8, 6, 2.4);
    x.fillStyle = '#ffffff'; x.fillRect(-2.6, -5, 1, 8);
  },
  wrench(x) { x.fillStyle = '#c8d0e0'; x.fillRect(-6, -1, 10, 2); disc(x, 5, 0, 2.6, '#c8d0e0'); x.fillStyle = '#20202a'; x.fillRect(5, -1, 3, 2); },
  driver(x) { x.fillStyle = '#e83a3a'; x.fillRect(-6, -1.6, 5, 3.2); x.fillStyle = '#d0d8e8'; x.fillRect(-1, -0.6, 7, 1.2); },
  gear(x, p) {
    x.fillStyle = p.color || '#a8b0c8';
    x.beginPath();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 4 : 5.4; const a2 = (i + 1) / 16 * TAU; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); x.lineTo(Math.cos(a2) * r, Math.sin(a2) * r); }
    x.closePath(); x.fill();
    x.fillStyle = '#3a3a4a'; disc(x, 0, 0, 1.6, '#3a3a4a');
  },
  screw(x) { x.fillStyle = '#d0d8e8'; x.fillRect(-0.7, -1, 1.4, 6); x.fillRect(-2, -2.2, 4, 1.6); x.fillStyle = '#8a90a0'; for (let i = 0; i < 3; i++) x.fillRect(-1, 0.6 + i * 1.5, 2, 0.5); },
  mouse(x) {
    x.fillStyle = '#9a9aa8'; fillEll(x, 0, 0, 4, 2.4);
    disc(x, -2.2, -2.2, 1.4, '#b0b0c0'); x.fillStyle = '#ffb0c0'; disc(x, -2.2, -2.2, 0.6, '#ffb0c0');
    x.fillStyle = '#20202a'; disc(x, -3.2, -0.4, 0.5, '#20202a');
    x.strokeStyle = '#9a9aa8'; x.lineWidth = 0.6; x.beginPath(); x.moveTo(4, 0.5); x.quadraticCurveTo(7, -1, 8, 1.6); x.stroke();
  },
  hammer(x) { x.fillStyle = '#a06a3a'; x.fillRect(-1, -2, 2, 10); x.fillStyle = '#b0b8c8'; x.fillRect(-5, -5, 10, 4); x.fillStyle = '#e0e4f0'; x.fillRect(-5, -5, 10, 1.2); },
  furoshiki(x, p) {
    const o = p.open ?? 0;
    x.fillStyle = '#e83a3a'; poly(x, [[-10, -6 + o * 3], [10, -8], [11, 6], [-9, 8 - o * 2]]); x.fill();
    x.fillStyle = '#3a6aff'; poly(x, [[10, -8], [11, 6], [7, 3]]); x.fill();
    x.fillStyle = '#ffd23a'; for (let i = 0; i < 4; i++) disc(x, -6 + i * 4.5, -1 + (i % 2) * 3, 1, '#ffd23a');
  },
  clock(x, p) {
    x.fillStyle = '#fff6d8'; disc(x, 0, 0, 7, '#fff6d8');
    x.strokeStyle = '#8a6a2a'; x.lineWidth = 1; strokeEll(x, 0, 0, 7, 7);
    const a = -p.age / 60;
    x.strokeStyle = '#20202a'; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * 5.4, Math.sin(a) * 5.4); x.moveTo(0, 0); x.lineTo(Math.cos(a / 12) * 3.6, Math.sin(a / 12) * 3.6); x.stroke();
  },
  pocket(x) {
    x.fillStyle = '#ffffff'; x.beginPath(); x.arc(0, 0, 8, 0, Math.PI); x.closePath(); x.fill();
    x.strokeStyle = '#20202a'; x.lineWidth = 0.8; x.stroke();
  },
  drop(x, p) { x.fillStyle = p.color || '#ffc83a'; x.beginPath(); x.moveTo(0, -4); x.quadraticCurveTo(3.4, 1, 0, 3); x.quadraticCurveTo(-3.4, 1, 0, -4); x.fill(); x.fillStyle = '#ffffff'; disc(x, -0.8, 0.4, 0.7, '#ffffff'); },
  plate(x) { x.fillStyle = '#f0f8ff'; fillEll(x, 0, 0, 7, 2.6); x.fillStyle = '#c8e8f8'; fillEll(x, 0, -0.4, 5, 1.6); },
  // あおい まるい ロボットの あたま（顔・目・赤い 鼻・ひげ。耳は なし）
  robo(x, p) {
    x.fillStyle = '#1a5aa0'; disc(x, 0, 0, 8.6, '#1a5aa0');
    x.fillStyle = '#2a9aff'; disc(x, 0, 0, 8, '#2a9aff');
    x.fillStyle = '#ffffff'; fillEll(x, 0, 1.6, 6.4, 5.6);
    fillEll(x, -1.7, -3.2, 1.8, 2.2); fillEll(x, 1.7, -3.2, 1.8, 2.2);
    x.fillStyle = '#20202a'; disc(x, -1.2, -2.8, 0.7, '#20202a'); disc(x, 1.2, -2.8, 0.7, '#20202a');
    x.fillStyle = '#e8342a'; disc(x, 0, -0.9, 1.3, '#e8342a');
    x.strokeStyle = '#20202a'; x.lineWidth = 0.5;
    x.beginPath(); x.moveTo(0, 0.4); x.lineTo(0, 4.2);
    for (const sx of [-1, 1]) for (const dy of [-0.8, 0.6, 2]) { x.moveTo(sx * 2, 1 + dy * 0.6); x.lineTo(sx * 5.6, 0.4 + dy); }
    x.moveTo(-3.4, 4); x.quadraticCurveTo(0, 6.6, 3.4, 4);
    x.stroke();
    if (p.spinLines) { x.strokeStyle = '#ffffff'; x.lineWidth = 0.8; x.globalAlpha *= 0.8; x.beginPath(); x.arc(0, 0, 11, 0.3, 1.6); x.moveTo(-11 * Math.cos(0.3), -11 * Math.sin(0.3)); x.arc(0, 0, 11, Math.PI + 0.3, Math.PI + 1.6); x.stroke(); }
  },
  petal(x, p) { x.fillStyle = p.color || '#ff8ac8'; fillEll(x, 0, 0, 5, 2.2); x.fillStyle = p.color2 || '#ffd0e8'; fillEll(x, -1, -0.5, 2.6, 0.8); },
  saiyanpod(x) { x.fillStyle = '#ffffff'; disc(x, 0, 0, 6, '#ffffff'); },
};

// ───────────── つぶの かきかた ─────────────
export const G1_FINE = {
  // はいけい（画面いっぱい）。style: space（宇宙の 星）・lines（集中線）・rays（まわる 光の すじ）・sky（くもり空と いなずま色）
  g1Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    let a = p.a;
    if (p.age < p.fin) a *= p.age / Math.max(1, p.fin);
    if (p.age > p.life - p.fout) a *= clamp01((p.life - p.age) / Math.max(1, p.fout));
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = p.color2;
    if (p.color2) x.fillRect(-8, -8, W + 16, H + 16);
    x.globalCompositeOperation = 'lighter';
    if (p.style === 'space') {
      softGlow(x, W * 0.3, H * 0.35, 70, mixHex(p.color, '#000000', 0.4), 0.5 * a);
      softGlow(x, W * 0.75, H * 0.6, 60, mixHex(p.color, '#2a40ff', 0.5), 0.4 * a);
      for (let i = 0; i < 48; i++) {
        const sx = hash(p.seed + i) * W, sy = hash(p.seed + i * 3.7) * H;
        const tw = 0.5 + 0.5 * Math.sin(p.age / 120 + i);
        x.globalAlpha = a * (0.4 + 0.6 * tw);
        x.fillStyle = i % 5 ? '#ffffff' : p.color;
        const s = i % 7 ? 0.8 : 1.6;
        x.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
    } else if (p.style === 'lines' || p.style === 'rays') {
      softGlow(x, p.x, p.y, 90, p.color, 0.55 * a);
      x.strokeStyle = p.color;
      const n = p.style === 'rays' ? 18 : 40;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * TAU + (p.style === 'rays' ? p.age / 1600 : hash(p.seed + i) * 0.2);
        if (p.style === 'rays') {
          x.globalAlpha = a * 0.35;
          x.fillStyle = i % 2 ? p.color : mixHex(p.color, '#ffffff', 0.5);
          poly(x, [[p.x, p.y], [p.x + Math.cos(ang - 0.08) * 300, p.y + Math.sin(ang - 0.08) * 300], [p.x + Math.cos(ang + 0.08) * 300, p.y + Math.sin(ang + 0.08) * 300]]);
          x.fill();
        } else {
          const r0 = 26 + hash(p.seed + i * 3 + Math.floor(p.age / 60)) * 40;
          x.globalAlpha = a * (0.3 + 0.4 * hash(p.seed + i * 5));
          x.lineWidth = 0.6 + hash(p.seed + i * 7) * 1.6;
          x.beginPath();
          x.moveTo(p.x + Math.cos(ang) * r0, p.y + Math.sin(ang) * r0);
          x.lineTo(p.x + Math.cos(ang) * 300, p.y + Math.sin(ang) * 300);
          x.stroke();
        }
      }
    } else if (p.style === 'sky') {
      // あれた 空（くもの かたまりが ながれる）
      for (let i = 0; i < 9; i++) {
        const cx = ((hash(p.seed + i) * W * 1.4 + p.age * 0.03 * (1 + i % 3)) % (W * 1.4)) - W * 0.2;
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = a * 0.5;
        x.fillStyle = i % 2 ? '#2a2440' : '#3a3458';
        fillEll(x, cx, 10 + hash(p.seed + i * 3) * 40, 40, 12);
      }
      x.globalCompositeOperation = 'lighter';
      softGlow(x, p.x, p.y, 80, p.color, 0.35 * a);
    }
    x.restore();
  },
  // 気の たま（style: ki・genki・sun・white）
  g1Ball(x, p) {
    const [cx, cy, e] = travelPos(p, p.ease);
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const out = clamp01((p.life - p.age) / Math.max(1, p.pop));
    const r = p.r * (0.15 + 0.85 * g) * (1 + 0.05 * Math.sin(p.age / 35)) * (0.3 + 0.7 * out);
    if (!(r > 0.3)) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    // しっぽ
    if (e > 0 && e < 1 && p.x1 !== undefined) {
      const dx = p.x1 - p.x0, dy = p.y1 - p.y0, L = Math.hypot(dx, dy) || 1;
      for (let i = 1; i <= 4; i++) softGlow(x, cx - dx / L * r * i * 0.9, cy - dy / L * r * i * 0.9, r * (1.4 - i * 0.2), p.glow, 0.35 * out);
    }
    if (p.style === 'sun') {
      softGlow(x, cx, cy, r * 2.2, '#c86aff', 0.6 * out);
      softGlow(x, cx, cy, r * 1.6, '#ff8a1a', 0.9 * out);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = out;
      disc(x, cx, cy, r, '#ff7a10');
      x.save();
      x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.clip();
      x.lineWidth = Math.max(0.6, r * 0.12);
      for (let i = 0; i < 5; i++) {
        x.strokeStyle = i % 2 ? '#ffb02a' : '#e8400a';
        x.globalAlpha = 0.7 * out;
        const yy = cy - r + (i + 0.5) * r * 0.4 + Math.sin(p.age / 160 + i) * r * 0.08;
        x.beginPath();
        for (let s = -1; s <= 1.0001; s += 0.1) x.lineTo(cx + s * r, yy + Math.sin(s * 4 + p.age / 90 + i * 1.3) * r * 0.08);
        x.stroke();
      }
      x.restore();
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx - r * 0.3, cy - r * 0.3, r * 0.7, '#fff2a0', 0.8 * out);
      x.globalAlpha = 0.8 * out; x.strokeStyle = '#e0a8ff'; x.lineWidth = Math.max(0.6, r * 0.05);
      strokeEll(x, cx, cy, r * 1.04, r * 1.04);
    } else {
      const big = p.style === 'genki';
      softGlow(x, cx, cy, r * (big ? 2.2 : 2.4), p.glow, (big ? 0.5 : 0.85) * out);
      if (big) softGlow(x, cx, cy, r * 1.35, p.color, 0.45 * out, true);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = (big ? 0.75 : 0.95) * out;
      disc(x, cx, cy, r, p.color);
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = out;
      softGlow(x, cx, cy, r * (big ? 0.8 : 0.95), p.glow, (big ? 0.55 : 0.9) * out, true);
      disc(x, cx, cy, r * (big ? 0.3 : 0.5), p.core);
      if (big) {
        // 表面の ひかりの もよう
        x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, r * 0.03);
        for (let i = 0; i < 3; i++) { x.globalAlpha = 0.35 * out; strokeEll(x, cx, cy, r * (0.6 + i * 0.15), r * (0.6 + i * 0.15) * (0.3 + 0.2 * Math.sin(p.age / 300 + i)), p.age / 900 + i); }
      }
      if (p.rim) { x.globalAlpha = 0.9 * out; x.strokeStyle = p.rim; x.lineWidth = Math.max(0.6, r * 0.16); strokeEll(x, cx, cy, r * 1.02, r * 1.02); }
      if (p.swirl) {
        x.lineWidth = Math.max(0.6, r * 0.18);
        p.swirl.forEach((col, k) => {
          x.strokeStyle = col; x.globalAlpha = 0.85 * out;
          const a0 = p.age / 70 + k * Math.PI;
          x.beginPath(); x.arc(cx, cy, r * 0.78, a0, a0 + 2.2); x.stroke();
        });
      }
      if (p.rays) {
        x.strokeStyle = p.core; x.lineWidth = Math.max(0.5, r * 0.07);
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + p.age / 200 + hash(p.seed + i) * 0.3;
          const L = r * (1.3 + 0.6 * hash(Math.floor(p.age / 50) + i + p.seed));
          x.globalAlpha = 0.55 * out;
          x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9); x.lineTo(cx + Math.cos(a) * L, cy + Math.sin(a) * L); x.stroke();
        }
      }
      if (p.zap) {
        x.strokeStyle = p.zap; x.lineWidth = 0.9;
        for (let k = 0; k < 3; k++) {
          const f = Math.floor(p.age / 50) + k * 11 + p.seed;
          if (hash(f) < 0.25) continue;
          const a0 = hash(f * 1.3) * TAU;
          x.globalAlpha = out;
          x.beginPath();
          for (let i = 0; i <= 5; i++) { const a = a0 + i * 0.35, rr = r * (1.05 + 0.35 * hash(f + i)); i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
          x.stroke();
        }
      }
    }
    x.restore();
  },
  // かめはめ波の ビーム（rim … ふちの 色、spiral … らせんの もよう、twist … 2色の よじれ、zap … まとわる いなずま、path＋sweep … なぎはらう、through … 画面の はしまで）
  g1Beam(x, p) {
    const age = p.age, life = p.life;
    let ex = p.tx, ey = p.ty;
    if (p.path && p.path.length > 1) {
      const [s0, s1] = p.sweep || [0, life];
      const k = easeInOut(clamp01((age - s0) / Math.max(1, s1 - s0))) * (p.path.length - 1);
      const i = Math.min(p.path.length - 2, Math.floor(k));
      ex = lerp(p.path[i].x, p.path[i + 1].x, k - i);
      ey = lerp(p.path[i].y, p.path[i + 1].y, k - i);
    }
    const dx = ex - p.x0, dy = ey - p.y0;
    const Lt = Math.hypot(dx, dy) || 1;
    const L = p.through ? Lt + 320 : Lt;
    const g1 = clamp01(age / Math.max(1, p.grow));
    const head = p.through ? (age < p.grow ? Lt * easeOut(g1) : Math.min(L, Lt + (age - p.grow) * 1.2)) : Lt * easeOut(g1);
    let env = age < p.rise ? easeOut(age / Math.max(1, p.rise)) : 1;
    if (age > life - p.fall) env *= clamp01((life - age) / Math.max(1, p.fall));
    if (p.widths) {
      const s = clamp01(age / life) * (p.widths.length - 1);
      const i = Math.min(p.widths.length - 2, Math.floor(s));
      env *= lerp(p.widths[i], p.widths[i + 1], s - i);
    }
    const w = p.w * env * (1 + 0.07 * Math.sin(age / 21 + p.seed) + 0.05 * (hash(Math.floor(age / 40) + p.seed) - 0.5));
    if (!(w > 0.1)) return;
    const h = w / 2;
    x.save();
    x.translate(p.x0, p.y0);
    x.rotate(Math.atan2(dy, dx));
    const band = (half, wob, ph, taper = 1) => {
      const pts = [];
      for (let s = 0; s <= head; s += 5) pts.push([s, -half * Math.min(1, 0.55 + s / (12 * taper)) * (1 + wob * Math.sin(s / 6 - age / 26 + ph))]);
      pts.push([head, -half]);
      for (let s = head; s >= 0; s -= 5) pts.push([s, half * Math.min(1, 0.55 + s / (12 * taper)) * (1 + wob * Math.sin(s / 7 - age / 29 + ph + 2))]);
      poly(x, pts);
      x.fill();
    };
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.3; x.fillStyle = p.glow; band(h * 2.0, 0.16, 0);
    x.globalAlpha = 0.45; band(h * 1.45, 0.1, 1);
    if (p.rim2) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.9; x.fillStyle = p.rim2; band(h * 1.55, 0.08, 4); }
    if (p.rim) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.95; x.fillStyle = p.rim; band(h * 1.3, 0.07, 3); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.95; x.fillStyle = p.color; band(h, 0.06, 2);
    x.globalCompositeOperation = 'lighter';
    // 2色の よじれ
    if (p.twist) {
      x.lineWidth = Math.max(0.6, h * 0.6);
      p.twist.forEach((col, k) => {
        x.strokeStyle = col; x.globalAlpha = 0.9;
        x.beginPath();
        for (let s = 0; s <= head; s += 3) { const yy = h * 0.62 * Math.sin(s / 11 - age / 30 + k * Math.PI); s ? x.lineTo(s, yy) : x.moveTo(s, yy); }
        x.stroke();
      });
    }
    x.fillStyle = p.core; x.globalAlpha = 1; band(h * (p.coreW ?? 0.42), 0.05, 3, 2);
    // らせんの もよう（ななめの すじが まえへ ながれる）
    if (p.spiral) {
      x.save();
      poly(x, [[0, -h], [head, -h], [head, h], [0, h]]); x.clip();
      x.strokeStyle = p.spiral; x.lineWidth = Math.max(0.6, h * 0.18); x.globalAlpha = 0.55;
      x.beginPath();
      const ph = (age * 0.32) % (h * 1.6);
      for (let s = -h * 2 + ph; s <= head + h; s += h * 1.6) { x.moveTo(s, -h); x.lineTo(s + h * 1.1, h); }
      x.stroke();
      x.restore();
    }
    // まとわる いなずま
    if (p.zap) {
      x.lineWidth = 1.3; x.strokeStyle = p.zap; x.globalAlpha = 0.95;
      for (let k = 0; k < 2; k++) {
        x.beginPath();
        const f = Math.floor(age / 45);
        for (let s = 0; s <= head; s += 4) { const yy = (h * 1.25) * Math.sin(s / 10 - age / 24 + k * Math.PI) + (hash(f + s * 0.37 + k * 9) - 0.5) * 4; s ? x.lineTo(s, yy) : x.moveTo(s, yy); }
        x.stroke();
      }
      x.lineWidth = 3.2; x.globalAlpha = 0.25; x.stroke();
    }
    // まえへ ながれる 光の すじ
    x.strokeStyle = p.core; x.lineWidth = Math.max(0.5, h * 0.12); x.globalAlpha = 0.6;
    x.beginPath();
    for (let i = 0; i < 7; i++) {
      const u = ((age * 0.8 + hash(p.seed + i) * 400) % 400) / 400;
      const sx = u * head, oy = (hash(p.seed + i * 3) - 0.5) * h * 1.6;
      x.moveTo(sx, oy); x.lineTo(Math.min(head, sx + 10 + h * 2), oy);
    }
    x.stroke();
    softGlow(x, 0, 0, h * 3, p.glow, 0.9);
    disc(x, 0, 0, h * 1.1, p.core);
    if (p.head) {
      const hr = h * 2.2 * p.head;
      softGlow(x, Math.min(head, Lt), 0, hr * 1.6, p.glow, 1);
      x.globalAlpha = 1; disc(x, Math.min(head, Lt), 0, hr * 0.55, p.core);
    }
    x.restore();
  },
  // ドーム爆発
  g1Dome(x, p) {
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const out = clamp01((p.life - p.age) / (p.life * 0.5));
    const r = p.r * (0.1 + 0.9 * g);
    if (!(r > 0.5) || out <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y - r * 0.3, r * 2, p.glow, 0.7 * out);
    x.globalAlpha = 0.55 * out;
    x.fillStyle = p.color;
    if (ell(x, p.x, p.y, r * p.sx, r, 0)) { x.save(); x.clip(); x.fillRect(p.x - r * p.sx, p.y - r, r * 2 * p.sx, r * 1.25); x.restore(); }
    x.globalAlpha = 0.8 * out;
    x.fillStyle = p.glow;
    x.beginPath(); x.ellipse(p.x, p.y, r * p.sx * 0.75, r * 0.75, 0, Math.PI, TAU); x.closePath(); x.fill();
    x.globalAlpha = out;
    x.fillStyle = p.core;
    x.beginPath(); x.ellipse(p.x, p.y, r * p.sx * 0.45, r * 0.45, 0, Math.PI, TAU); x.closePath(); x.fill();
    // ふちの わ
    x.strokeStyle = p.core; x.lineWidth = 1.4; x.globalAlpha = 0.8 * out;
    x.beginPath(); x.ellipse(p.x, p.y, r * p.sx * 1.02, r * 1.02, 0, Math.PI, TAU); x.stroke();
    // じめんの 光
    x.globalAlpha = 0.7 * out; x.fillStyle = p.core;
    fillEll(x, p.x, p.y, r * p.sx * 1.15, Math.max(1, r * 0.12));
    x.restore();
  },
  // 気円斬（黄色い うすい 円盤。ふちが ギザギザ）。x0,y0 で ふくらむ → (cx,cy) を とおって x1,y1 の 先へ
  g1Disc(x, p) {
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const e = clamp01((p.age - p.grow) / Math.max(1, p.travel));
    const k = e * e * 0.3 + e * 0.7;
    // 2次ベジェ（x0 → c → x1）のさきへ のびる
    const bx = (u) => (1 - u) * (1 - u) * p.x0 + 2 * (1 - u) * u * p.cx + u * u * p.x1;
    const by = (u) => (1 - u) * (1 - u) * p.y0 + 2 * (1 - u) * u * p.cy + u * u * p.y1;
    const u = k * 1.6;
    const px = u <= 1 ? bx(u) : p.x1 + (p.x1 - bx(0.95)) * (u - 1) * 20, py = u <= 1 ? by(u) : p.y1 + (p.y1 - by(0.95)) * (u - 1) * 20;
    const out = clamp01((p.life - p.age) / 100);
    const r = p.r * (0.2 + 0.8 * g);
    if (!(r > 0.4) || out <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    // しっぽ（ざんぞう）
    if (e > 0) for (let i = 1; i <= 3; i++) { const uu = Math.max(0, u - i * 0.06); const qx = uu <= 1 ? bx(uu) : p.x1 + (p.x1 - bx(0.95)) * (uu - 1) * 20, qy = uu <= 1 ? by(uu) : p.y1 + (p.y1 - by(0.95)) * (uu - 1) * 20; x.globalAlpha = 0.25 * out / i; x.fillStyle = '#ffe84a'; fillEll(x, qx, qy, r, r * 0.3); }
    softGlow(x, px, py, r * 2, '#fff27a', 0.7 * out);
    x.globalAlpha = 0.85 * out;
    x.fillStyle = '#ffe84a';
    x.beginPath();
    const rot = p.age / 18;
    for (let i = 0; i <= 36; i++) { const a = i / 36 * TAU; const rr = r * (i % 2 ? 0.86 : 1.06); const qx = px + Math.cos(a + rot) * rr, qy = py + Math.sin(a + rot) * rr * 0.32; i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
    x.closePath(); x.fill();
    x.globalAlpha = out; x.fillStyle = '#fffbe0'; fillEll(x, px, py, r * 0.62, r * 0.18);
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6; strokeEll(x, px, py, r * 0.95, r * 0.3);
    x.restore();
  },
  // 金の 竜（竜拳）: 的の 下から まきついて 上へ のぼる。head … いまの あたまの いち
  g1Dragon(x, p) {
    const T = clamp01(p.age / p.travel);
    const out = clamp01((p.life - p.age) / 200);
    if (out <= 0) return;
    // あたまの みち（u: 0〜1）
    const at = (u) => {
      if (u < 0.35) { const k = u / 0.35; return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1 + 6, k)]; }
      const k = (u - 0.35) / 0.65;
      const a = k * TAU * 1.25 + Math.PI / 2;
      return [p.x1 + Math.cos(a) * p.r * (1 - k * 0.25), p.y1 + 6 - k * p.rise + Math.sin(a) * p.r * 0.35];
    };
    const n = 30;
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = Math.max(0, easeOut(T) - i * 0.022); pts.push(at(u)); }
    const wAt = (i) => Math.max(0.6, p.w * (1 - (i / n) ** 1.6 * 0.8));
    x.save();
    x.lineCap = 'round'; x.lineJoin = 'round';
    // ひかり（うしろ）
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.glow; x.globalAlpha = 0.3 * out;
    for (let i = 0; i < n; i++) { x.lineWidth = wAt(i) * 3; x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke(); }
    // ふち（こい 金）→ からだ（金）→ おなか（あわい 金）。色が うすく ならない ように ふつうに ぬる
    x.globalCompositeOperation = 'source-over';
    for (const [col, wk, al] of [['#7a4a00', 1.9, 0.95], [p.color, 1.55, 1], ['#fff0a0', 0.55, 0.95]]) {
      x.strokeStyle = col; x.globalAlpha = al * out;
      for (let i = 0; i < n; i++) { x.lineWidth = wAt(i) * wk; x.beginPath(); x.moveTo(pts[i][0], pts[i][1]); x.lineTo(pts[i + 1][0], pts[i + 1][1]); x.stroke(); }
    }
    // せなかの とげ と うろこ
    for (let i = 3; i < n - 1; i += 3) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const a = Math.atan2(by - ay, bx - ax) + Math.PI / 2;
      const w = wAt(i);
      x.globalAlpha = out; x.fillStyle = '#ffe066';
      poly(x, [[ax + Math.cos(a) * w * 0.7, ay + Math.sin(a) * w * 0.7], [ax + Math.cos(a) * w * 1.7 + (bx - ax) * 0.6, ay + Math.sin(a) * w * 1.7 + (by - ay) * 0.6], [bx + Math.cos(a) * w * 0.7, by + Math.sin(a) * w * 0.7]]); x.fill();
      x.fillStyle = '#a06a00'; disc(x, ax - Math.cos(a) * w * 0.2, ay - Math.sin(a) * w * 0.2, w * 0.22, '#a06a00');
    }
    // あたま（つの・ひげ・赤い 目・口）
    const [hx, hy] = pts[0], [qx, qy] = pts[2];
    const ang = Math.atan2(hy - qy, hx - qx);
    const s = p.w * 1.25;
    x.save();
    x.translate(hx, hy); x.rotate(ang);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 5, p.glow, 0.9 * out);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = out;
    // たてがみ
    x.fillStyle = '#ff9a10';
    poly(x, [[-s * 0.2, -s * 1.1], [-s * 2.2, -s * 1.9], [-s * 1.4, -s * 0.6], [-s * 2.6, -s * 0.2], [-s * 1.4, s * 0.4], [-s * 2.2, s * 1.6], [-s * 0.2, s * 1.1]]); x.fill();
    x.fillStyle = '#7a4a00';
    poly(x, [[-s * 1.3, -s * 1.3], [s * 1.0, -s * 1.0], [s * 2.9, -s * 0.5], [s * 3.1, s * 0.15], [s * 1.6, s * 0.35], [s * 2.8, s * 0.7], [s * 1.0, s * 1.25], [-s * 1.3, s * 1.2]]); x.fill();
    x.fillStyle = p.color;
    poly(x, [[-s * 1.1, -s * 1.1], [s * 1.0, -s * 0.85], [s * 2.7, -s * 0.4], [s * 2.9, s * 0.1], [s * 1.5, s * 0.3], [s * 2.6, s * 0.6], [s * 0.9, s * 1.05], [-s * 1.1, s * 1.0]]); x.fill();
    x.fillStyle = '#fff0a0';
    poly(x, [[-s * 0.6, -s * 1.0], [-s * 2.8, -s * 2.6], [-s * 0.1, -s * 0.5]]); x.fill();
    poly(x, [[-s * 0.6, s * 0.9], [-s * 2.6, s * 2.3], [-s * 0.1, s * 0.6]]); x.fill();
    x.fillStyle = '#ffffff'; disc(x, s * 0.9, -s * 0.4, s * 0.38, '#ffffff');
    x.fillStyle = '#e8201a'; disc(x, s * 1.0, -s * 0.4, s * 0.24, '#e8201a');
    x.strokeStyle = '#fff0a0'; x.lineWidth = Math.max(0.6, s * 0.14);
    x.beginPath(); x.moveTo(s * 2.6, -s * 0.3); x.quadraticCurveTo(s * 1.6, -s * 2.8, -s * 0.6, -s * 3.4); x.moveTo(s * 2.6, s * 0.4); x.quadraticCurveTo(s * 1.6, s * 2.6, -s * 0.6, s * 3.2); x.stroke();
    x.restore();
    x.restore();
  },
  // こぶし・手。x0,y0 → x1,y1（travel）→ その場で すこし のこる
  g1Fist(x, p) {
    const e = easeIn(clamp01(p.age / Math.max(1, p.travel))) * 0.7 + clamp01(p.age / Math.max(1, p.travel)) * 0.3;
    const out = clamp01((p.life - p.age) / 90);
    if (out <= 0) return;
    const fx0 = lerp(p.x0, p.x1, e), fy0 = lerp(p.y0, p.y1, e);
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const s = p.s * (0.7 + 0.3 * e) * (p.age > p.travel ? 1 + 0.1 * Math.sin(Math.min(1, (p.age - p.travel) / 80) * Math.PI) : 1);
    x.save();
    // すじ
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.glow; x.globalAlpha = 0.5 * out; x.lineWidth = s * 5;
    x.lineCap = 'round';
    const tb = Math.max(0, e - 0.4);
    x.beginPath(); x.moveTo(lerp(p.x0, p.x1, tb), lerp(p.y0, p.y1, tb)); x.lineTo(fx0, fy0); x.stroke();
    softGlow(x, fx0, fy0, s * 9, p.glow, 0.6 * out);
    x.translate(fx0, fy0);
    x.rotate(ang);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = out;
    const st = p.style;
    if (st === 'round') {
      // ドラえもんの まるい 手（白・黒い ふち）＋ うで（青）
      x.fillStyle = '#3aa0ff'; x.fillRect(-s * 9, -s * 2.2, s * 6, s * 4.4);
      x.fillStyle = '#20202a'; disc(x, 0, 0, s * 4.4, '#20202a');
      x.fillStyle = '#ffffff'; disc(x, 0, 0, s * 3.8, '#ffffff');
      x.fillStyle = '#e8eef8'; disc(x, s * 0.8, s * 0.8, s * 2, '#e8eef8');
    } else if (st === 'palm') {
      x.fillStyle = p.color; fillEll(x, 0, 0, s * 3.2, s * 4.2);
      for (let i = 0; i < 4; i++) fillEll(x, s * 3.2, (i - 1.5) * s * 1.7, s * 2, s * 0.75);
      fillEll(x, s * 0.6, -s * 4.4, s * 0.8, s * 1.8, -0.5);
      x.fillStyle = mixHex(p.color, '#ffffff', 0.35); fillEll(x, -s * 0.5, 0, s * 1.8, s * 2.6);
    } else {
      // にぎった こぶし
      const c1 = p.color, c2 = mixHex(p.color, '#000000', 0.25);
      x.fillStyle = c2; fillEll(x, -s * 0.6, 0, s * 3.8, s * 3.6);
      x.fillStyle = c1; fillEll(x, -s * 0.8, -s * 0.3, s * 3.4, s * 3.2);
      x.fillStyle = c2;
      for (let i = 0; i < 4; i++) fillEll(x, s * 2.4, (i - 1.5) * s * 1.6, s * 1.1, s * 0.8);
      x.fillStyle = mixHex(p.color, '#ffffff', 0.5); fillEll(x, -s * 1.8, -s * 1.4, s * 1.2, s * 0.8);
      if (st === 'muscle') { x.fillStyle = c2; x.fillRect(-s * 9, -s * 2.8, s * 5.2, s * 5.6); x.fillStyle = c1; fillEll(x, -s * 7, -s * 2.6, s * 3, s * 1.6); }
    }
    x.restore();
    if (p.zap && p.age < p.life * 0.8) {
      x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = p.zap; x.lineWidth = 0.9; x.globalAlpha = out;
      for (let k = 0; k < 2; k++) {
        const f = Math.floor(p.age / 40) + k * 7 + p.seed;
        x.beginPath();
        for (let i = 0; i <= 5; i++) { const a = hash(f) * TAU + i * 0.5, rr = s * (4 + 3 * hash(f + i)); const qx = fx0 + Math.cos(a) * rr, qy = fy0 + Math.sin(a) * rr; i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
        x.stroke();
      }
      x.restore();
    }
  },
  // ざんぞうの 人（白い かげ。ちらつく）
  g1Ghost(x, p) {
    const env = envOf(p, 80, 140);
    if (env <= 0) return;
    const fl = p.flick ? (hash(Math.floor(p.age / 50) + p.seed) < 0.3 ? 0.35 : 1) : 1;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y + p.s * 14, p.s * 22, p.color, 0.35 * env * fl);
    x.globalAlpha = 0.55 * env * fl;
    x.fillStyle = p.color;
    personPath(x, p.x, p.y, p.s); x.fill();
    x.globalAlpha = 0.6 * env * fl;
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.8; x.stroke();
    x.restore();
  },
  // しるし（字・やじるし など）
  g1Mark(x, p) {
    const env = envOf(p, 80, 160);
    if (env <= 0) return;
    const pop = 0.5 + 0.5 * easeOut(clamp01(p.age / 140));
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.spin * p.age / 1000);
    x.lineCap = 'round'; x.lineJoin = 'round';
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = env;
    x.strokeStyle = p.color2; x.lineWidth = Math.max(1, p.size * 0.5);
    strokeMark(x, p.mark, p.size * pop); x.stroke();
    x.strokeStyle = p.color; x.lineWidth = Math.max(0.6, p.size * 0.28);
    strokeMark(x, p.mark, p.size * pop); x.stroke();
    if (p.mark === 'sweat') { x.fillStyle = p.color; x.fill(); }
    x.restore();
  },
  // どうぐ・もの
  g1Prop(x, p) {
    let px = p.x, py = p.y;
    if (p.move) [px, py] = travelPos(p);
    const pop = p.pop > 0 ? easeOut(clamp01(p.age / p.pop)) : 1;
    const out = clamp01((p.life - p.age) / Math.max(1, p.fade));
    if (out <= 0 || pop <= 0) return;
    const draw = PROPS[p.prop];
    if (!draw) return;
    x.save();
    x.translate(px, py);
    const s = p.s * (p.pop > 0 ? 0.3 + 0.7 * pop + 0.15 * Math.sin(Math.min(1, p.age / p.pop) * Math.PI) : 1) * (p.shrink ? Math.max(0.05, 1 - clamp01((p.age - p.shrink) / 200)) : 1);
    if (p.glowc) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 16 * s, p.glowc, 0.8 * out); }
    x.rotate(p.rot0 + p.spin * p.age / 1000 + (p.swing ? Math.sin(p.age / 70) * p.swing : 0));
    if (p.bites) p.bite = Math.max(0.15, 1 - Math.floor(p.age / p.bites) * 0.22);
    x.scale(s * p.flip, s);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = out;
    x.lineCap = 'round'; x.lineJoin = 'round';
    draw(x, p);
    x.restore();
  },
  // マンガの 爆発（ギザギザの 星形が かさなる）
  g1Boom(x, p) {
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const out = clamp01((p.life - p.age) / (p.life * 0.45));
    if (out <= 0 || g <= 0) return;
    const star = (r, k, seed) => {
      x.beginPath();
      const n = p.spikes * 2;
      for (let i = 0; i <= n; i++) {
        const a = i / n * TAU + seed;
        const rr = r * (i % 2 ? 0.62 : 1) * (0.85 + 0.3 * hash(p.seed + i * k));
        i ? x.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * 0.85) : x.moveTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr * 0.85);
      }
      x.closePath();
    };
    const r = p.r * (0.3 + 0.7 * g);
    x.save();
    x.globalCompositeOperation = 'source-over';
    const [c0, c1, c2, c3] = p.cols;
    if (p.smoke && p.age > p.life * 0.4) { x.globalAlpha = 0.5 * out; x.fillStyle = '#3a3438'; star(r * 1.15, 5, 0.3); x.fill(); }
    x.globalAlpha = out; x.fillStyle = c3; star(r * 1.05, 1, 0); x.fill();
    x.fillStyle = c2; star(r * 0.82, 2, 0.2); x.fill();
    x.fillStyle = c1; star(r * 0.6, 3, 0.1); x.fill();
    x.fillStyle = c0; star(r * 0.34, 4, 0.25); x.fill();
    x.strokeStyle = '#2a1a10'; x.lineWidth = 1; x.globalAlpha = 0.6 * out; star(r * 1.05, 1, 0); x.stroke();
    x.restore();
  },
  // 大ザルの かげ（画面の 下から 立ちあがる あたま と かた・赤い 目）
  g1Monkey(x, p) {
    const up = easeOut(clamp01(p.age / Math.max(1, p.rise)));
    const out = clamp01((p.life - p.age) / 260);
    if (out <= 0) return;
    const s = p.s;
    const cx = p.x, cy = p.y + (1 - up) * 40 * s / 3;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const eyesOnly = p.age > p.life - 170;
    x.globalAlpha = 0.9 * out * up;
    x.fillStyle = '#2a0a0a';
    if (!eyesOnly) {
      // かた
      fillEll(x, cx, cy + 22 * s, 46 * s, 20 * s);
      // あたま（もじゃもじゃ）
      x.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const rr = 20 * s * (i % 2 ? 1 : 1.12); x.lineTo(cx + Math.cos(a) * rr * 1.05, cy + Math.sin(a) * rr * 0.95); }
      x.closePath(); x.fill();
      // 耳
      fillEll(x, cx - 22 * s, cy - 2 * s, 5 * s, 6 * s); fillEll(x, cx + 22 * s, cy - 2 * s, 5 * s, 6 * s);
      // 口もと
      x.fillStyle = '#4a1a14'; fillEll(x, cx, cy + 9 * s, 12 * s, 7 * s);
      x.fillStyle = '#ffffff'; x.globalAlpha = 0.85 * out * up;
      for (const sx of [-1, 1]) poly(x, [[cx + sx * 7 * s, cy + 8 * s], [cx + sx * 5 * s, cy + 13 * s], [cx + sx * 3.5 * s, cy + 8 * s]]), x.fill();
    }
    // 赤い 目
    x.globalCompositeOperation = 'lighter';
    for (const sx of [-1, 1]) {
      softGlow(x, cx + sx * 8 * s, cy - 3 * s, 7 * s, '#ff2a1a', out);
      x.globalAlpha = out; x.fillStyle = '#ff4a2a'; fillEll(x, cx + sx * 8 * s, cy - 3 * s, 3.4 * s, 1.8 * s, sx * 0.25);
      x.fillStyle = '#ffffff'; fillEll(x, cx + sx * 8 * s, cy - 3 * s, 1.2 * s, 0.8 * s);
    }
    x.restore();
  },
  // ライトの 光（x0,y0 から x1,y1 へ ひろがる 円すい）
  g1Cone(x, p) {
    const env = envOf(p, 90, 160);
    if (env <= 0) return;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const L = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) + p.over;
    const sp = p.spread * (0.8 + 0.2 * env);
    x.save();
    x.translate(p.x0, p.y0); x.rotate(ang);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.35 * env; x.fillStyle = p.color;
    poly(x, [[0, -1.5], [L, -L * sp], [L, L * sp], [0, 1.5]]); x.fill();
    x.globalAlpha = 0.4 * env; x.fillStyle = p.color2;
    poly(x, [[0, -1], [L, -L * sp * 0.5], [L, L * sp * 0.5], [0, 1]]); x.fill();
    x.globalAlpha = 0.6 * env; x.strokeStyle = p.color2; x.lineWidth = 0.6;
    strokeEll(x, L - p.over, 0, L * sp * 0.25 + 2, (L - p.over) * sp);
    softGlow(x, 0, 0, 8, p.color2, env);
    x.restore();
  },
  // 水の 弧（口・目 から ピューッ。x0,y0 → x1,y1、hop … 高さ）
  g1Arc(x, p) {
    const g = clamp01(p.age / Math.max(1, p.travel));
    const out = clamp01((p.life - p.age) / 160);
    if (out <= 0) return;
    const tail = clamp01((p.age - p.hold) / Math.max(1, p.travel));
    const pt = (u) => [lerp(p.x0, p.x1, u), lerp(p.y0, p.y1, u) - p.hop * Math.sin(u * Math.PI)];
    x.save();
    x.globalCompositeOperation = 'source-over';
    x.lineCap = 'round';
    for (const [col, w, al] of [[p.color, p.w, 0.85], [p.color2, p.w * 0.45, 0.95]]) {
      x.strokeStyle = col; x.lineWidth = w; x.globalAlpha = al * out;
      x.beginPath();
      for (let u = tail; u <= g + 0.001; u += 0.04) { const [a, b] = pt(Math.min(u, g)); u === tail ? x.moveTo(a, b) : x.lineTo(a, b); }
      x.stroke();
    }
    x.restore();
  },
  // すきとおった 空気の わ（すすむ むきに たてな だ円）
  g1Air(x, p) {
    const e = clamp01((p.age - p.start) / Math.max(1, p.travel));
    if (p.age < p.start) return;
    const out = clamp01((p.life - p.age) / 120);
    const px = lerp(p.x0, p.x1, e), py = lerp(p.y0, p.y1, e);
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const r = p.r * (0.5 + 0.7 * e);
    x.save();
    x.translate(px, py); x.rotate(ang);
    x.globalCompositeOperation = 'lighter';
    for (const [col, lw, al] of [['#c8f0ff', 3, 0.35], ['#ffffff', 1.2, 0.9]]) {
      x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = al * out;
      x.beginPath();
      for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU; const rr = 1 + 0.08 * Math.sin(a * 5 + p.age / 30); const qx = Math.cos(a) * r * 0.32 * rr, qy = Math.sin(a) * r * rr; i ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
      x.stroke();
    }
    x.globalAlpha = 0.5 * out; x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
    x.beginPath(); for (let i = -2; i <= 2; i++) { x.moveTo(-r * 0.6, i * r * 0.3); x.lineTo(-r * 1.6, i * r * 0.3); } x.stroke();
    x.restore();
  },
  // 花（open … ひらく 時間、n … 花びら、cols … [花びら, なか, ふち]、bud … つぼみから）
  g1Flower(x, p) {
    const o = easeOut(clamp01((p.age - (p.at || 0)) / Math.max(1, p.open)));
    const out = clamp01((p.life - p.age) / 200);
    const pop = easeOut(clamp01(p.age / 120));
    if (out <= 0 || pop <= 0) return;
    const r = p.r * pop;
    const [px, py] = p.travel ? travelPos(p) : [p.x, p.y];
    x.save();
    x.translate(px, py);
    if (p.glowc) { x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, r * 2.2, p.glowc, 0.7 * out * o); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = out;
    if (p.stem) { x.strokeStyle = '#3a9a3a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, r * 0.5); x.lineTo(0, p.stem); x.stroke(); }
    const [pc, cc, ec] = p.cols;
    if (o < 0.05) {
      // つぼみ
      x.fillStyle = '#3a9a3a'; fillEll(x, 0, r * 0.25, r * 0.35, r * 0.4);
      x.fillStyle = pc; fillEll(x, 0, -r * 0.05, r * 0.28, r * 0.42);
    } else {
      x.rotate(p.rot + p.age / 1500);
      for (let i = 0; i < p.n; i++) {
        const a = i / p.n * TAU;
        x.save(); x.rotate(a);
        x.fillStyle = pc; fillEll(x, r * 0.55 * o, 0, r * 0.5 * o + 0.3, r * (p.fat || 0.26) * (0.4 + 0.6 * o) + 0.2);
        x.fillStyle = ec; fillEll(x, r * 0.62 * o, 0, r * 0.28 * o + 0.2, r * 0.1 * o + 0.1);
        x.restore();
      }
      x.fillStyle = cc; disc(x, 0, 0, r * 0.26, cc);
      x.fillStyle = '#ffffff'; disc(x, -r * 0.07, -r * 0.07, r * 0.08, '#ffffff');
    }
    x.restore();
  },
  // 扇の 気（はなつ ところから 扇形に ひろがる 光の 波）
  g1Fan(x, p) {
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const out = clamp01((p.life - p.age) / 220);
    if (out <= 0) return;
    const R = p.r * g;
    x.save();
    x.translate(p.x0, p.y0);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.35 * out; x.fillStyle = p.glow;
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, Math.max(0.1, R), p.ang - p.spread, p.ang + p.spread); x.closePath(); x.fill();
    x.globalAlpha = 0.5 * out; x.fillStyle = p.color;
    x.beginPath(); x.moveTo(0, 0); x.arc(0, 0, Math.max(0.1, R * 0.85), p.ang - p.spread * 0.8, p.ang + p.spread * 0.8); x.closePath(); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { const rr = R * (1 - i * 0.12) - ((p.age * 0.1) % 10); if (rr > 1) { x.globalAlpha = 0.8 * out; x.beginPath(); x.arc(0, 0, rr, p.ang - p.spread, p.ang + p.spread); x.stroke(); } }
    x.restore();
  },
  // 光の みち（ジグザグ。あたまに 光の たま）
  g1Path(x, p) {
    const e = clamp01(p.age / Math.max(1, p.travel));
    const out = clamp01((p.life - p.age) / 200);
    if (out <= 0) return;
    const pts = p.pts;
    const segs = pts.length - 1;
    const at = (u) => { const k = clamp01(u) * segs; const i = Math.min(segs - 1, Math.floor(k)); return [lerp(pts[i][0], pts[i + 1][0], k - i), lerp(pts[i][1], pts[i + 1][1], k - i)]; };
    const t0 = Math.max(0, e - p.tail - (p.age > p.travel ? (p.age - p.travel) / 300 : 0));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round'; x.lineJoin = 'round';
    for (const [col, wk, al] of [[p.glow, 2.4, 0.35], [p.color, 1, 0.9], ['#ffffff', 0.35, 1]]) {
      x.strokeStyle = col; x.lineWidth = p.w * wk; x.globalAlpha = al * out;
      x.beginPath();
      for (let u = t0; u <= e + 0.0001; u += 0.01) { const [a, b] = at(u); u === t0 ? x.moveTo(a, b) : x.lineTo(a, b); }
      x.stroke();
    }
    if (p.ball && e < 1) { const [hx, hy] = at(e); softGlow(x, hx, hy, p.w * 5, p.glow, out); disc(x, hx, hy, p.w * 1.2, '#ffffff'); }
    x.restore();
  },
  // はかい: 的を つつむ うすむらさきの 膜 → 白く ひかって 下から 粉に くずれる（敵の え は そのまま。光の かたちが くずれる）
  g1Hakai(x, p) {
    const out = clamp01((p.life - p.age) / 200);
    if (out <= 0) return;
    const film = clamp01(p.age / 260);
    const crumble = clamp01((p.age - p.cAt) / Math.max(1, p.cDur));
    const rx = p.rx, ry = p.ry;
    x.save();
    x.globalCompositeOperation = 'lighter';
    // 膜
    x.globalAlpha = 0.5 * film * out * (1 - crumble * 0.6);
    x.strokeStyle = '#e0c8ff'; x.lineWidth = 1.2;
    strokeEll(x, p.x, p.y, rx * 1.35, ry * 1.25);
    softGlow(x, p.x, p.y, rx * 1.8, '#c8a0ff', 0.45 * film * out);
    // 光の からだ（下から けずれる）
    const cut = p.y + ry - crumble * ry * 2.2;
    if (cut > p.y - ry) {
      x.save();
      x.beginPath(); x.rect(p.x - rx * 2, p.y - ry * 2, rx * 4, cut - (p.y - ry * 2)); x.clip();
      const wh = clamp01((p.age - p.cAt + 200) / 200);
      x.globalAlpha = (0.35 + 0.5 * wh) * out;
      x.fillStyle = mixHex('#c8a0ff', '#ffffff', wh);
      fillEll(x, p.x, p.y, rx, ry);
      softGlow(x, p.x, p.y, rx * 1.2, '#ffffff', 0.5 * wh * out, true);
      x.restore();
      // くずれる ふち
      if (crumble > 0 && crumble < 1) {
        x.globalAlpha = out; x.fillStyle = '#ffffff';
        const half = Math.sqrt(Math.max(0, 1 - ((cut - p.y) / ry) ** 2)) * rx;
        for (let i = 0; i < 10; i++) { const qx = p.x - half + hash(i + Math.floor(p.age / 40)) * half * 2; x.fillRect(qx, cut - 1 - hash(i * 3 + p.age) * 2, 1.2, 1.2); }
      }
    }
    x.restore();
  },
  // タケコプター（あたまの 上で まわって のぼる）は g1Prop の copter。ここは 下向きの 風の すじ
  g1Wind(x, p) {
    const env = envOf(p, 60, 160);
    if (env <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.color; x.lineWidth = 0.9;
    for (let i = 0; i < p.n; i++) {
      const u = ((p.age / 300 + hash(p.seed + i)) % 1);
      const lx = p.x + (hash(p.seed + i * 3) - 0.5) * p.w;
      const ly = p.y + u * p.h * p.dir;
      x.globalAlpha = env * (1 - u) * 0.9;
      x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx, ly + 7 * p.dir); x.stroke();
    }
    x.restore();
  },
};
// 下向きの 風・上向きの 風の すじ
export function wind(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Wind', x, y, w: o.w || 30, h: o.h || 40, dir: o.dir ?? 1, n: o.n || 10, color: o.color || '#e8f8ff', delay: o.delay || 0, life: o.life ?? 500, seed: Math.random() * 100 });
}
export function cone(c, x0, y0, x1, y1, o = {}) {
  c.fx.add({ kind: 'g1Cone', x: x1, y: y1, x0, y0, x1, y1, spread: o.spread ?? 0.35, over: o.over ?? 6, color: o.color || '#fff27a', color2: o.color2 || '#ffffff', delay: o.delay || 0, life: o.life ?? 500 });
}
export function arc(c, x0, y0, x1, y1, o = {}) {
  c.fx.add({ kind: 'g1Arc', x: x1, y: y1, x0, y0, x1, y1, hop: o.hop ?? 20, w: o.w || 3, color: o.color || '#4aa8ff', color2: o.color2 || '#e8f8ff', travel: o.travel || 200, hold: o.hold ?? 260, delay: o.delay || 0, life: o.life ?? 600 });
  return (o.delay || 0) + (o.travel || 200);
}
export function air(c, x0, y0, x1, y1, o = {}) {
  c.fx.add({ kind: 'g1Air', x: x1, y: y1, x0, y0, x1, y1, r: o.r || 10, start: o.start || 0, travel: o.travel || 200, delay: o.delay || 0, life: o.life ?? (o.start || 0) + (o.travel || 200) + 80 });
  return (o.delay || 0) + (o.start || 0) + (o.travel || 200);
}
export function flower(c, x, y, o = {}) {
  const p = { kind: 'g1Flower', x, y, x0: x, y0: y, r: o.r || 12, n: o.n || 8, cols: o.cols || ['#ff7ab8', '#ffe066', '#ffd0e4'], open: o.open ?? 200, at: o.at || 0, rot: o.rot ?? Math.random() * 6, fat: o.fat, stem: o.stem || 0, delay: o.delay || 0, life: o.life ?? 700, glowc: o.glow || null };
  if (o.to) Object.assign(p, { x: o.to.x, y: o.to.y, x1: o.to.x, y1: o.to.y, start: o.start || 0, travel: o.travel || 200, hop: o.hop || 0 });
  c.fx.add(p);
}
export function fan(c, x0, y0, o = {}) {
  c.fx.add({ kind: 'g1Fan', x: x0 + Math.cos(o.ang) * (o.r || 120) * 0.6, y: y0 + Math.sin(o.ang) * (o.r || 120) * 0.6, x0, y0, ang: o.ang, spread: o.spread ?? 0.6, r: o.r || 120, color: o.color || '#ffe84a', glow: o.glow || '#fff8b0', grow: o.grow ?? 240, delay: o.delay || 0, life: o.life ?? 600 });
}
export function ghost(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Ghost', x, y, s: o.s || 1.4, color: o.color || '#e8f4ff', vx: o.vx || 0, vy: o.vy || 0, flick: o.flick ?? true, delay: o.delay || 0, life: o.life ?? 500, seed: Math.random() * 100 });
}
export function hakaiFilm(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Hakai', x, y, rx: o.rx || 14, ry: o.ry || 18, cAt: o.cAt ?? 300, cDur: o.cDur ?? 500, delay: o.delay || 0, life: o.life ?? 1000 });
}
export function dragon(c, x0, y0, x1, y1, o = {}) {
  c.fx.add({ kind: 'g1Dragon', x: x1, y: y1, x0, y0, x1, y1, r: o.r || 20, rise: o.rise || 70, w: o.w || 4, color: o.color || '#ffd23a', glow: o.glow || '#fff0a0', travel: o.travel || 700, delay: o.delay || 0, life: o.life ?? 1000 });
}
export function disk(c, x0, y0, x1, y1, o = {}) {
  const cx = o.cx ?? (x0 + x1) / 2 + (o.bend ?? 40), cy = o.cy ?? (y0 + y1) / 2;
  c.fx.add({ kind: 'g1Disc', x: x1, y: y1, x0, y0, x1, y1, cx, cy, r: o.r || 12, grow: o.grow ?? 120, travel: o.travel || 300, delay: o.delay || 0, life: o.life ?? 700 });
}
export function monkey(c, x, y, o = {}) {
  c.fx.add({ kind: 'g1Monkey', x, y, s: o.s || 1.4, rise: o.rise ?? 260, delay: o.delay || 0, life: o.life ?? 800 });
}
export { easeOut, easeIn, easeInOut, fadeOut, hash, lerp, clamp01, mixHex };
