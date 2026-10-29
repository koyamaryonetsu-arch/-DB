// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）: G2 だけの え の ぶひん（つぶの かきかた G2_FINE と 小さな どうぐ）
// ・どの つぶも p.age（ms）で かく。うごく ものは p.keys（[[ms, x, y, …], …]）で いちを きめる（p.x・p.y は 画面の 中の めじるし）
// ・大きな 形（らせん丸・ゴムの うで・赤い 電車・バット…）は 1つの つぶで パスを かく（つぶの かずを ふやさない）
// ・画面の 文字は ここの 線の 字（ハ・K・5・0・!・Z・オ・ー）だけ
import { softGlow, disc, rgba, clamp01, lerp, easeOut, easeIn, hash, rnd } from './axkit.js?v=894e2368ad04';

const TAU = Math.PI * 2;

// ───────────── こまかい どうぐ ─────────────
// キーフレーム（[[ms, a, b, …], …]）の あいだを なめらかに。ease: 'smooth' | 'lin' | 'out' | 'in'
export function kf(keys, age, ease = 'smooth') {
  if (!keys || !keys.length) return [];
  if (age <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (age <= b[0]) {
      const a = keys[i - 1];
      let u = clamp01((age - a[0]) / Math.max(1, b[0] - a[0]));
      u = ease === 'lin' ? u : ease === 'out' ? easeOut(u) : ease === 'in' ? easeIn(u) : u * u * (3 - 2 * u);
      return a.slice(1).map((v, j) => v + (b[j + 1] - v) * u);
    }
  }
  return keys[keys.length - 1].slice(1);
}
// 出る・消える こさ
export const envOf = (p, fin = 80, fout = 140) => clamp01(p.age / Math.max(1, fin)) * clamp01((p.life - p.age) / Math.max(1, fout));
function poly(x, pts, close = true) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
}
function rrect(x, a, b, w, h, r) {
  r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  x.beginPath();
  x.moveTo(a + r, b);
  x.lineTo(a + w - r, b); x.quadraticCurveTo(a + w, b, a + w, b + r);
  x.lineTo(a + w, b + h - r); x.quadraticCurveTo(a + w, b + h, a + w - r, b + h);
  x.lineTo(a + r, b + h); x.quadraticCurveTo(a, b + h, a, b + h - r);
  x.lineTo(a, b + r); x.quadraticCurveTo(a, b, a + r, b);
  x.closePath();
}
const INK = '#1a1220';

// 線の 字（0〜1 の はこの 中の 線）
const GLYPH = {
  'ハ': [[[0.3, 0.12], [0.2, 0.48], [0.0, 0.84]], [[0.7, 0.12], [0.84, 0.48], [1.0, 0.8]]],
  'K': [[[0.22, 0], [0.22, 1]], [[0.86, 0], [0.24, 0.6]], [[0.42, 0.42], [0.9, 1]]],
  '5': [[[0.85, 0.02], [0.25, 0.02], [0.2, 0.45], [0.62, 0.4], [0.86, 0.6], [0.78, 0.9], [0.5, 0.99], [0.14, 0.9]]],
  '0': [[[0.5, 0], [0.82, 0.12], [0.92, 0.5], [0.82, 0.88], [0.5, 1], [0.18, 0.88], [0.08, 0.5], [0.18, 0.12], [0.5, 0]]],
  '!': [[[0.5, 0], [0.5, 0.64]], [[0.5, 0.92], [0.5, 0.95]]],
  'Z': [[[0.1, 0.05], [0.9, 0.05], [0.1, 0.95], [0.9, 0.95]]],
  'オ': [[[0.08, 0.33], [0.92, 0.33]], [[0.62, 0], [0.62, 1], [0.44, 0.92]], [[0.56, 0.4], [0.08, 0.86]]],
  'ー': [[[0.08, 0.5], [0.92, 0.5]]],
};

// ───────────── つぶの かきかた ─────────────
export const G2_FINE = {
  // らせん丸（青い チャクラの 玉。中で うずの 線が 高速回転）。blades … 風の 刃 4まい（らせん手裏剣）。cols … [こい, 中, あかるい, しん]
  g2Spiral(x, p) {
    const [cx, cy, r0] = kf(p.keys, p.age, p.ease);
    const a = envOf(p, 60, p.fout || 140);
    const r = r0 * (1 + 0.05 * Math.sin(p.age / 30));
    if (!(r > 0.4) || a <= 0) return;
    const [deep, mid, light, core] = p.cols || ['#1a4ad8', '#3a8cff', '#9ad8ff', '#ffffff'];
    const rot = (p.age / 1000) * TAU * (p.spin || 3);
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, r * 3, light, 0.55 * a);
    softGlow(x, cx, cy, r * 1.7, mid, 0.8 * a);
    // 風の 刃（うしろに ざんぞう）
    if (p.blades) {
      const bl = p.blades;
      for (let g = 2; g >= 0; g--) {
        const rr = rot * 1.4 - g * 0.22;
        x.globalAlpha = (g ? 0.22 / g : 0.9) * a;
        x.fillStyle = g ? light : '#ffffff';
        for (let k = 0; k < 4; k++) {
          const th = rr + (k / 4) * TAU;
          const P = (rad, d) => [cx + Math.cos(th + d) * rad, cy + Math.sin(th + d) * rad * (p.sy || 0.8)];
          x.beginPath();
          x.moveTo(...P(r * 0.85, -0.45));
          x.quadraticCurveTo(...P(r * 2.1 * bl, -0.15), ...P(r * 3.1 * bl, 0.5));
          x.quadraticCurveTo(...P(r * 1.75 * bl, 0.22), ...P(r * 0.85, 0.4));
          x.closePath();
          x.fill();
        }
      }
      // うすい 円ばん と キィィンの わ
      x.globalAlpha = 0.25 * a;
      x.strokeStyle = '#ffffff';
      x.lineWidth = 0.7;
      x.beginPath(); x.ellipse(cx, cy, r * 2.9 * bl, r * 2.9 * bl * (p.sy || 0.8), 0, 0, TAU); x.stroke();
      softGlow(x, cx, cy, r * 3.2 * bl, '#e8f8ff', 0.25 * a);
    }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.9 * a;
    disc(x, cx, cy, r, deep);
    x.globalAlpha = 0.85 * a;
    disc(x, cx - r * 0.12, cy - r * 0.12, r * 0.8, mid);
    // うずの 線（かたむいた だ円の 弧が ぐるぐる）
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    const n = p.lines || 10;
    for (let i = 0; i < n; i++) {
      const rr = r * (0.35 + 0.62 * hash(i + 1.3));
      const ry = rr * (0.2 + 0.55 * hash(i * 3.1 + 2));
      const tilt = hash(i * 5.7) * Math.PI;
      const st = rot * (0.8 + hash(i * 7.3) * 0.9) + i;
      x.strokeStyle = i % 3 ? light : core;
      x.globalAlpha = (0.55 + 0.45 * hash(i * 2.2)) * a;
      x.lineWidth = Math.max(0.4, r * (0.06 + 0.05 * hash(i * 9)));
      x.beginPath(); x.ellipse(cx, cy, rr, ry, tilt, st, st + 2.3); x.stroke();
    }
    // まわりの 風の わ
    x.strokeStyle = light;
    x.globalAlpha = 0.5 * a;
    x.lineWidth = Math.max(0.4, r * 0.05);
    for (let k = 0; k < 2; k++) { x.beginPath(); x.ellipse(cx, cy, r * 1.25, r * 0.42, rot * 0.5 + k * 1.6, 0, TAU); x.stroke(); }
    if (p.rim) {
      // ふちの 赤と 青（びじゅう玉）
      x.lineWidth = Math.max(0.6, r * 0.12);
      x.strokeStyle = p.rim[0]; x.globalAlpha = 0.85 * a;
      x.beginPath(); x.arc(cx, cy, r * 1.02, rot, rot + Math.PI); x.stroke();
      x.strokeStyle = p.rim[1];
      x.beginPath(); x.arc(cx, cy, r * 1.02, rot + Math.PI, rot + TAU); x.stroke();
    }
    x.globalAlpha = a;
    softGlow(x, cx, cy, r * 0.8, core, 0.9 * a);
    disc(x, cx, cy, r * 0.28, core);
    x.restore();
  },
  // 風の 大ドーム（白い まる。中で 細い 針の 線が 光る）。keys: [[ms, r]]、cols: [ふち, 中, 針]
  g2Dome(x, p) {
    const [R] = kf(p.keys, p.age, 'out');
    const a = envOf(p, 40, 220);
    if (!(R > 1) || a <= 0) return;
    const [rim, fill, needle] = p.cols || ['#e8f8ff', '#ffffff', '#5a9ae8'];
    const sy = p.sy || 0.85;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, R * 1.5, rim, 0.45 * a);
    x.globalAlpha = 0.22 * a;
    x.fillStyle = fill;
    x.beginPath(); x.ellipse(p.x, p.y, R, R * sy, 0, 0, TAU); x.fill();
    x.globalAlpha = 0.85 * a;
    x.strokeStyle = rim;
    x.lineWidth = 1.6;
    x.beginPath(); x.ellipse(p.x, p.y, R, R * sy, 0, 0, TAU); x.stroke();
    if (p.rim2) {
      x.strokeStyle = p.rim2[0]; x.lineWidth = 2.2;
      x.beginPath(); x.ellipse(p.x, p.y, R * 1.04, R * sy * 1.04, 0, Math.PI * 0.1, Math.PI * 1.1); x.stroke();
      x.strokeStyle = p.rim2[1];
      x.beginPath(); x.ellipse(p.x, p.y, R * 1.04, R * sy * 1.04, 0, Math.PI * 1.1, Math.PI * 2.1); x.stroke();
    }
    // 針（白い ドームの 上に こい 線）
    const fr = Math.floor(p.age / 45);
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = needle;
    x.lineWidth = 0.6;
    x.globalAlpha = 0.9 * a;
    x.beginPath();
    const N = p.n || 70;
    for (let i = 0; i < N; i++) {
      const h1 = hash(i * 3.7 + fr * 11.1), h2 = hash(i * 1.9 + fr * 5.3), h3 = hash(i * 7.7 + fr);
      const ang = h1 * TAU;
      const rr = R * Math.sqrt(h2) * 0.95;
      const len = 3 + h3 * R * 0.25;
      const ax = p.x + Math.cos(ang) * rr, ay = p.y + Math.sin(ang) * rr * sy;
      const da = ang + (h3 - 0.5) * 0.8;
      x.moveTo(ax, ay); x.lineTo(ax + Math.cos(da) * len, ay + Math.sin(da) * len * sy);
    }
    x.stroke();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, R * 0.6, '#ffffff', 0.35 * a);
    x.restore();
  },
  // ナルトの 影分身（オレンジと 黒の 人の 形）。keys: [[ms, x, y]]（足もと）、s … 大きさ（1 で 18px）、dir … むき、pose: stand・run・jump・seal・throw・kick
  // look: 'naruto'（ふつう）・'kyuubi'（金と オレンジの 光の 衣）・'shinobi'（黒い 忍び）
  g2Ninja(x, p) {
    const [fx0, fy0] = kf(p.keys, p.age, p.ease || 'lin');
    const a = envOf(p, p.fin ?? 60, p.fout ?? 90);
    if (a <= 0) return;
    const s = p.s || 1, d = p.dir || 1, pose = p.pose || 'stand';
    const look = p.look || 'naruto';
    const C = look === 'shinobi'
      ? { suit: '#2a2a3a', dark: '#101018', hair: '#3a3048', skin: '#f2c8a0', band: '#5a6a8a', ink: '#05050a' }
      : look === 'kyuubi'
        ? { suit: '#ffb02a', dark: '#2a1408', hair: '#ffe86a', skin: '#ffd88a', band: '#2a1408', ink: '#8a3a00' }
        : { suit: '#ff8a1a', dark: '#1c1c2c', hair: '#ffd83a', skin: '#f6c89a', band: '#3a5ab0', ink: '#2a1408' };
    const bob = pose === 'run' ? Math.abs(Math.sin(p.age / 45)) * 1.2 : pose === 'stand' ? Math.sin(p.age / 120 + (p.seed || 0)) * 0.4 : 0;
    x.save();
    x.translate(fx0, fy0 - bob * s);
    x.scale(s * d, s);
    if (pose === 'run') x.rotate(0.38);
    if (pose === 'kick') x.rotate(-0.5 + Math.sin(p.age / 50) * 0.3);
    x.globalAlpha = a;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    if (look === 'kyuubi') {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, -9, 16, '#ff9a1a', 0.8 * a);
      x.globalCompositeOperation = 'source-over';
    }
    const ph = p.age / 60;
    const limb = (x0, y0, x1, y1, col, w) => { x.strokeStyle = C.ink; x.lineWidth = w + 1; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
    // あし
    if (pose === 'run') {
      const sw = Math.sin(ph) * 3.5;
      limb(0, -7, sw, 0, C.suit, 2.4); limb(0, -7, -sw, 0, C.suit, 2.4);
    } else if (pose === 'jump') {
      limb(0, -7, 3, -2.5, C.suit, 2.4); limb(0, -7, -2.5, -1.5, C.suit, 2.4);
    } else if (pose === 'kick') {
      limb(0, -7, 8, -9, C.suit, 2.4); limb(0, -7, -2, 0, C.suit, 2.4);
    } else {
      limb(-1.2, -7, -2, 0, C.suit, 2.4); limb(1.2, -7, 2, 0, C.suit, 2.4);
    }
    // うで
    const arm = (x1, y1) => limb(0, -12, x1, y1, C.suit, 2);
    if (pose === 'run') { arm(-8, -9.5); arm(-7.5, -11.5); }
    else if (pose === 'seal') { arm(2.6, -10.5); arm(2.8, -10); }
    else if (pose === 'throw') { const k = Math.sin(clamp01(p.age / 160) * Math.PI); arm(4 + 4 * k, -14 - 3 * k); arm(-4, -8); }
    else if (pose === 'jump') { arm(5, -16); arm(-5, -15); }
    else { arm(-3.5, -7); arm(3.5, -7); }
    // からだ（オレンジの 上着・黒い かた）
    x.fillStyle = C.ink;
    rrect(x, -3.9, -14.4, 7.8, 8.4, 1.6); x.fill();
    x.fillStyle = C.suit;
    rrect(x, -3.3, -13.8, 6.6, 7.4, 1.4); x.fill();
    x.fillStyle = C.dark;
    x.fillRect(-3.3, -13.8, 6.6, 2.2);
    x.fillStyle = '#ffffff';
    x.globalAlpha = 0.85 * a;
    x.fillRect(-0.25, -11.6, 0.5, 5.2);
    x.globalAlpha = a;
    if (look === 'kyuubi') {
      // むねの うずまき と たての 線
      x.strokeStyle = C.dark; x.lineWidth = 0.6;
      x.beginPath();
      for (let k = 0; k <= 16; k++) { const t2 = k / 16, an = t2 * TAU * 1.5, rr = 0.2 + t2 * 1.8; k ? x.lineTo(Math.cos(an) * rr, -9.6 + Math.sin(an) * rr) : x.moveTo(Math.cos(an) * rr, -9.6 + Math.sin(an) * rr); }
      x.stroke();
      x.beginPath(); x.moveTo(-2.4, -13); x.lineTo(-2.4, -6.5); x.moveTo(2.4, -13); x.lineTo(2.4, -6.5); x.stroke();
    }
    // あたま
    x.fillStyle = C.ink;
    disc(x, 0.4, -17.2, 3.9, C.ink);
    disc(x, 0.4, -17.2, 3.35, C.skin);
    // とがった かみ
    x.fillStyle = C.hair;
    x.beginPath();
    const spikes = [[-4.6, -17.6], [-4.4, -20.4], [-2.2, -19.6], [-1.6, -23], [0.4, -20.4], [2.2, -22.6], [2.6, -19.8], [5.2, -20.6], [4, -17.8], [5.6, -16.6], [3.8, -18.6], [-3.6, -18.6]];
    spikes.forEach(([a1, b1], i) => (i ? x.lineTo(a1, b1) : x.moveTo(a1, b1)));
    x.closePath();
    x.strokeStyle = C.ink; x.lineWidth = 0.7; x.stroke();
    x.fill();
    // ひたいあて
    x.fillStyle = C.band;
    x.fillRect(-3.2, -19.2, 7.2, 1.5);
    x.fillStyle = '#d8e0ee';
    x.fillRect(0.6, -19.4, 2.6, 1.9);
    // 目
    x.fillStyle = look === 'kyuubi' ? '#ff3a1a' : '#2a3a8a';
    x.fillRect(2.2, -17, 0.9, 1);
    if (pose === 'seal') {
      // 十字の 印の 光
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 3, -10.5, 5, '#c8f0ff', 0.9 * a);
    }
    x.restore();
  },
  // 「ボン」の けむり（まるい くもが いっきに ふくらんで 消える）
  g2Pop(x, p) {
    const t = clamp01(p.age / p.life);
    const e = easeOut(clamp01(p.age / 170));
    const a = t < 0.55 ? 1 : clamp01((1 - t) / 0.45);
    if (a <= 0) return;
    const r = p.r * (0.4 + 0.75 * e);
    x.save();
    x.globalAlpha = 0.95 * a;
    const n = 7;
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + (p.seed || 0);
      blobs.push([p.x + Math.cos(an) * r * 0.62, p.y + Math.sin(an) * r * 0.5 - r * 0.1, r * (0.42 + 0.16 * hash(i + (p.seed || 0)))]);
    }
    blobs.push([p.x, p.y - r * 0.1, r * 0.62]);
    for (const [bx, by, br] of blobs) disc(x, bx, by + br * 0.18, br * 1.04, p.shade || '#b8bccc');
    for (const [bx, by, br] of blobs) disc(x, bx, by, br, p.color || '#ffffff');
    // マンガの 線
    if (p.age < 220) {
      x.strokeStyle = '#ffffff';
      x.lineWidth = 0.9;
      x.globalAlpha = (1 - p.age / 220) * 0.9;
      x.beginPath();
      for (let i = 0; i < 8; i++) {
        const an = (i / 8) * TAU + 0.2;
        x.moveTo(p.x + Math.cos(an) * r * 1.15, p.y + Math.sin(an) * r * 1.0);
        x.lineTo(p.x + Math.cos(an) * r * 1.6, p.y + Math.sin(an) * r * 1.4);
      }
      x.stroke();
    }
    x.restore();
  },
  // クナイ（ひし形の 刃＋わ）。keys: [[ms, x, y]]。とんで いる あいだは 青い すじ、ついたら ささって のこる
  g2Kunai(x, p) {
    const [kx, ky] = kf(p.keys, p.age, 'lin');
    const last = p.keys[p.keys.length - 1][0];
    const a = envOf(p, 30, 120);
    if (a <= 0) return;
    const fly = p.age < last;
    let ang = p.ang;
    if (ang === undefined) {
      const [ax, ay] = kf(p.keys, Math.max(0, Math.min(p.age, last) - 20), 'lin');
      const [bx, by] = kf(p.keys, Math.min(p.age, last) + 0.01, 'lin');
      ang = Math.atan2(by - ay, bx - ax);
      if (!fly) { const [ux, uy] = kf(p.keys, last - 20, 'lin'); const [vx, vy] = p.keys[p.keys.length - 1].slice(1); ang = Math.atan2(vy - uy, vx - ux); }
    }
    const s = p.s || 1;
    x.save();
    if (fly) {
      x.globalCompositeOperation = 'lighter';
      const [tx, ty] = kf(p.keys, Math.max(0, p.age - 70), 'lin');
      x.strokeStyle = p.trail || '#7ab8ff';
      x.lineCap = 'round';
      x.globalAlpha = 0.6 * a;
      x.lineWidth = 2.2 * s;
      x.beginPath(); x.moveTo(tx, ty); x.lineTo(kx, ky); x.stroke();
      x.strokeStyle = '#ffffff'; x.lineWidth = 0.7 * s; x.globalAlpha = 0.8 * a;
      x.beginPath(); x.moveTo(lerp(tx, kx, 0.5), lerp(ty, ky, 0.5)); x.lineTo(kx, ky); x.stroke();
      x.globalCompositeOperation = 'source-over';
    }
    const wob = fly ? 0 : Math.sin((p.age - last) / 18) * Math.exp(-(p.age - last) / 120) * 0.25;
    x.translate(kx, ky);
    x.rotate(ang + wob);
    x.scale(s, s);
    x.globalAlpha = a;
    // 刃
    x.fillStyle = '#1a1c24';
    poly(x, [[1.2, 0], [-3.6, -2.3], [-5.6, -0.7], [-5.6, 0.7], [-3.6, 2.3]]); x.fill();
    x.fillStyle = '#6a7284';
    poly(x, [[0.6, 0], [-3.6, -1.7], [-5.2, -0.4], [-5.2, 0.4], [-3.6, 1.7]]); x.fill();
    x.fillStyle = '#d8e0ec';
    poly(x, [[0.4, 0], [-3.8, -0.5], [-5, 0], [-3.8, 0.5]]); x.fill();
    // え（まいた ぬの）と わ
    x.fillStyle = '#2a2420';
    x.fillRect(-9.6, -0.75, 4.2, 1.5);
    x.fillStyle = '#6a5a48';
    for (let i = 0; i < 3; i++) x.fillRect(-9.2 + i * 1.3, -0.75, 0.5, 1.5);
    x.strokeStyle = '#1a1c24'; x.lineWidth = 0.7;
    x.beginPath(); x.arc(-11.1, 0, 1.4, 0, TAU); x.stroke();
    x.restore();
  },
  // 九尾の しっぽ（オレンジの 炎の しっぽが 扇に ひろがる）。x,y … ねもと、len … 長さ、n … かず
  g2Tails(x, p) {
    const a = envOf(p, 200, 260);
    if (a <= 0) return;
    const grow = easeOut(clamp01(p.age / 380));
    const n = p.n || 9;
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (const [col, wk, al] of [['#ff6a0a', 1, 0.45], ['#ffa02a', 0.62, 0.6], ['#ffe08a', 0.28, 0.75]]) {
      x.fillStyle = col;
      x.globalAlpha = al * a;
      for (let i = 0; i < n; i++) {
        const base = -Math.PI / 2 + (i / (n - 1) - 0.5) * (p.spread || 2.6);
        const L = p.len * grow * (0.8 + 0.25 * hash(i + 2));
        const W = (p.w || 7) * wk;
        const left = [], right = [];
        const M = 12;
        for (let k = 0; k <= M; k++) {
          const s = k / M;
          const wav = Math.sin(s * 3.2 - p.age / 130 + i * 1.3) * L * 0.13 * s;
          const an = base + Math.sin(p.age / 260 + i) * 0.12 * s;
          const cx = p.x + Math.cos(an) * L * s - Math.sin(an) * wav;
          const cy = p.y + Math.sin(an) * L * s + Math.cos(an) * wav;
          const ww = W * Math.pow(1 - s, 0.55) * (0.6 + 0.4 * Math.sin(s * Math.PI * 0.9 + 0.3));
          left.push([cx - Math.sin(an) * ww, cy + Math.cos(an) * ww]);
          right.push([cx + Math.sin(an) * ww, cy - Math.cos(an) * ww]);
        }
        poly(x, [...left, ...right.reverse()]); x.fill();
      }
    }
    x.restore();
  },
  // 火影の マント（白・すそに 赤い 炎の もよう）。x,y … かた、w,h … 大きさ
  g2Mantle(x, p) {
    const a = envOf(p, 160, 240);
    if (a <= 0) return;
    const open = easeOut(clamp01(p.age / 320));
    const w = p.w * (0.3 + 0.7 * open), h = p.h * (0.5 + 0.5 * open);
    const hem = (u) => p.y + h + Math.sin(u * 9 + p.age / 70) * 4 * open;
    x.save();
    x.globalAlpha = 0.82 * a;
    const sway = Math.sin(p.age / 160) * 10 * open;
    const pts = [[p.x - w * 0.16, p.y], [p.x + w * 0.16, p.y]];
    for (let k = 0; k <= 16; k++) { const u = 1 - k / 16; pts.push([p.x + (u - 0.5) * w + sway, hem(u)]); }
    x.fillStyle = '#f6f4ee';
    x.strokeStyle = '#7a7468'; x.lineWidth = 1;
    poly(x, pts); x.fill(); x.stroke();
    // ひだの かげ
    x.strokeStyle = '#cfc8ba'; x.lineWidth = 1.2;
    x.beginPath();
    for (let k = 1; k < 6; k++) { const u = k / 6; x.moveTo(p.x + (u - 0.5) * w * 0.36, p.y + 2); x.lineTo(p.x + (u - 0.5) * w * 0.9, hem(u) - 6); }
    x.stroke();
    // すその 赤い 炎
    x.fillStyle = '#e8321a';
    x.beginPath();
    const N = 14;
    for (let k = 0; k < N; k++) {
      const u0 = k / N, u1 = (k + 1) / N, um = (u0 + u1) / 2;
      const fh = h * (0.2 + 0.12 * Math.sin(p.age / 60 + k * 1.7));
      x.moveTo(p.x + (u0 - 0.5) * w + sway, hem(u0));
      x.quadraticCurveTo(p.x + (um - 0.5) * w - 2 + sway, hem(um) - fh * 0.5, p.x + (um - 0.5) * w + Math.sin(p.age / 50 + k) * 2 + sway, hem(um) - fh);
      x.quadraticCurveTo(p.x + (um - 0.5) * w + 1 + sway, hem(um) - fh * 0.4, p.x + (u1 - 0.5) * w + sway, hem(u1));
    }
    x.lineTo(p.x + 0.5 * w + sway, hem(0) + 1); x.lineTo(p.x - 0.5 * w + sway, hem(1) + 1);
    x.fill();
    // えり
    x.fillStyle = '#d8d0c0';
    x.fillRect(p.x - w * 0.16, p.y - 1, w * 0.32, 3);
    x.restore();
  },
  // 六角の たて（オレンジ）
  g2Hex(x, p) {
    const a = envOf(p, 60, 200);
    if (a <= 0) return;
    const r = p.r * (0.5 + 0.5 * easeOut(clamp01(p.age / 160)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, r * 1.5, p.color || '#ff9a2a', 0.5 * a);
    const hx = (rr) => { const pts = []; for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + Math.PI / 6; pts.push([p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr]); } return pts; };
    x.globalAlpha = 0.25 * a;
    x.fillStyle = p.color || '#ff9a2a';
    poly(x, hx(r)); x.fill();
    x.globalAlpha = 0.95 * a;
    x.strokeStyle = '#ffe0a0'; x.lineWidth = 1.4;
    poly(x, hx(r)); x.stroke();
    x.lineWidth = 0.7;
    poly(x, hx(r * 0.7)); x.stroke();
    x.restore();
  },
  // すりばちの くぼみ（だ円の ひび＋ふちの 光）
  g2Crater(x, p) {
    const a = envOf(p, 60, 300);
    if (a <= 0) return;
    const r = p.r * easeOut(clamp01(p.age / 160));
    x.save();
    x.globalAlpha = 0.55 * a;
    x.fillStyle = '#1a1410';
    x.beginPath(); x.ellipse(p.x, p.y, r, r * 0.3, 0, 0, TAU); x.fill();
    x.fillStyle = '#3a2a20';
    x.beginPath(); x.ellipse(p.x, p.y + r * 0.05, r * 0.7, r * 0.18, 0, 0, TAU); x.fill();
    x.strokeStyle = p.glow || '#9ad8ff';
    x.globalCompositeOperation = 'lighter';
    x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(p.x, p.y, r, r * 0.3, 0, Math.PI, TAU); x.stroke();
    x.strokeStyle = '#2a1a10';
    x.globalCompositeOperation = 'source-over';
    x.lineWidth = 0.8;
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + hash(i) * 0.4;
      x.moveTo(p.x + Math.cos(an) * r * 0.9, p.y + Math.sin(an) * r * 0.27);
      x.lineTo(p.x + Math.cos(an) * r * 1.5, p.y + Math.sin(an) * r * 0.45);
    }
    x.stroke();
    x.restore();
  },
  // ゴムの うで（のびる 肌色の 線＋こぶし）。bx,by … ねもと、keys: [[ms, 先x, 先y, ふとさ]]
  // style: 'skin'・'gear2'（赤い はだ）・'black'（ギア4: 黒に 赤い すじ）・'white'（ニカ: 白に 黒い ふち）、hand: 'fist'・'palm'・'foot'
  g2Arm(x, p) {
    const [tx, ty, w0] = kf(p.keys, p.age, p.ease || 'smooth');
    const a = envOf(p, 20, 90) * (p.alpha ?? 1);
    if (a <= 0) return;
    const w = Math.max(0.8, w0 || p.w || 4);
    const style = p.style || 'skin';
    const C = style === 'black' ? { arm: '#1c1418', hi: '#ff3a4a', ink: '#05030a', sleeve: '#d42a2a' }
      : style === 'white' ? { arm: '#ffffff', hi: '#e8e0ff', ink: '#2a2040', sleeve: '#ffffff' }
        : style === 'gear2' ? { arm: '#ff8a8a', hi: '#ffd0d0', ink: '#7a1a20', sleeve: '#d42a2a' }
          : { arm: '#f6c49a', hi: '#ffe8d0', ink: '#7a3a1a', sleeve: p.leg ? '#3a6ad8' : '#d42a2a' };
    const dx = tx - p.bx, dy = ty - p.by;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    // ゴムの ゆれ（ちぢむ ときに びよんびよん）
    const wob = (p.wob || 0) * Math.sin(p.age / 28) * Math.exp(-Math.max(0, p.age - (p.wobAt || 0)) / 240) * (p.age > (p.wobAt || 0) ? 1 : 0);
    const bend = (p.bend || 0) * L + wob * L * 0.12;
    const mx = (p.bx + tx) / 2 + nx * bend, my = (p.by + ty) / 2 + ny * bend;
    x.save();
    x.globalAlpha = a;
    x.lineCap = 'round';
    const curve = () => { x.beginPath(); x.moveTo(p.bx, p.by); x.quadraticCurveTo(mx, my, tx, ty); x.stroke(); };
    if (style === 'white') {
      x.globalCompositeOperation = 'lighter';
      x.strokeStyle = '#fff6d0'; x.globalAlpha = 0.35 * a; x.lineWidth = w * 2.6; curve();
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = a;
    }
    x.strokeStyle = C.ink; x.lineWidth = w + 1.4; curve();
    x.strokeStyle = C.arm; x.lineWidth = w; curve();
    x.strokeStyle = C.hi; x.lineWidth = Math.max(0.4, w * 0.28); x.globalAlpha = 0.8 * a;
    x.beginPath(); x.moveTo(p.bx + nx * w * 0.22, p.by + ny * w * 0.22); x.quadraticCurveTo(mx + nx * w * 0.22, my + ny * w * 0.22, tx + nx * w * 0.22, ty + ny * w * 0.22); x.stroke();
    x.globalAlpha = a;
    if (style === 'black') {
      // 赤い すじ（武装色）
      x.strokeStyle = C.hi; x.lineWidth = 0.6;
      x.beginPath();
      for (let k = 1; k < 7; k++) { const s = k / 7; const px = lerp(lerp(p.bx, mx, s), lerp(mx, tx, s), s), py = lerp(lerp(p.by, my, s), lerp(my, ty, s), s); x.moveTo(px - nx * w * 0.4, py - ny * w * 0.4); x.lineTo(px + ux * 3 + nx * w * 0.3, py + uy * 3 + ny * w * 0.3); }
      x.stroke();
    }
    // そで（ねもと）
    if (p.sleeve !== false) {
      x.strokeStyle = C.ink; x.lineWidth = w + 3;
      const sl = Math.min(8, L * 0.25);
      x.beginPath(); x.moveTo(p.bx, p.by); x.lineTo(p.bx + ux * sl, p.by + uy * sl); x.stroke();
      x.strokeStyle = C.sleeve; x.lineWidth = w + 1.8;
      x.beginPath(); x.moveTo(p.bx, p.by); x.lineTo(p.bx + ux * sl, p.by + uy * sl); x.stroke();
    }
    // 白い 炎（太陽の こぶし）
    if (p.flame) {
      const f0 = w * 1.6;
      x.globalCompositeOperation = 'lighter';
      softGlow(x, tx, ty, f0 * 2.6, '#ffe08a', 0.8 * a);
      x.fillStyle = '#fff6d0';
      x.globalAlpha = 0.35 * a;
      x.beginPath();
      for (let k = 0; k < 14; k++) { const an = (k / 14) * TAU + p.age / 300; const r1 = f0 * (1.9 + 0.5 * hash(k + Math.floor(p.age / 60))); x.moveTo(tx + Math.cos(an - 0.12) * f0, ty + Math.sin(an - 0.12) * f0); x.lineTo(tx + Math.cos(an) * r1 * 1.4, ty + Math.sin(an) * r1 * 1.4); x.lineTo(tx + Math.cos(an + 0.12) * f0, ty + Math.sin(an + 0.12) * f0); }
      x.fill();
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a;
      // うしろに たなびく 白い 炎（雲の ような かたまり）
      const fb = [];
      for (let k = 0; k < 7; k++) {
        const u = k / 6;
        const sw = Math.sin(p.age / 90 + k * 1.7) * f0 * 0.5;
        fb.push([tx - ux * f0 * (0.6 + 1.6 * u) + nx * (sw + (k % 2 ? 1 : -1) * f0 * 0.7 * (1 - u * 0.5)), ty - uy * f0 * (0.6 + 1.6 * u) + ny * (sw + (k % 2 ? 1 : -1) * f0 * 0.7 * (1 - u * 0.5)), f0 * (0.62 - 0.3 * u)]);
      }
      for (const [bx, by, br] of fb) disc(x, bx, by, br + 1.2, INK);
      for (const [bx, by, br] of fb) disc(x, bx, by, br, '#ffffff');
      x.globalAlpha = 0.7 * a;
      for (const [bx, by, br] of fb) disc(x, bx + ux * br * 0.2, by + uy * br * 0.2 + br * 0.25, br * 0.55, '#ffe8a0');
      x.globalAlpha = a;
    }
    // こぶし
    const ang = Math.atan2(ty - my, tx - mx);
    x.translate(tx, ty);
    x.rotate(ang);
    const f = w * (p.fist || 1.05);
    x.lineWidth = Math.max(0.7, f * (style === 'white' ? 0.18 : 0.14));
    x.strokeStyle = C.ink;
    x.fillStyle = C.arm;
    if (p.hand === 'palm') {
      rrect(x, -f * 0.2, -f * 1.05, f * 1.3, f * 2.1, f * 0.45); x.fill(); x.stroke();
      for (let k = 0; k < 4; k++) { rrect(x, f * 0.9, -f * 0.95 + k * f * 0.5, f * 0.9, f * 0.4, f * 0.2); x.fill(); x.stroke(); }
      rrect(x, f * 0.2, f * 0.9, f * 0.8, f * 0.38, f * 0.18); x.fill(); x.stroke();
    } else if (p.hand === 'foot') {
      // 足の うら（かかと → つまさき）と ゆび
      x.beginPath(); x.ellipse(f * 0.5, 0, f * 1.25, f * 0.95, 0, 0, TAU); x.fill(); x.stroke();
      for (let k = 0; k < 5; k++) {
        const ty2 = (k - 2) * f * 0.36;
        const tr = f * (k === 0 ? 0.32 : 0.24);
        x.beginPath(); x.arc(f * 1.78 - Math.abs(k - 2) * f * 0.12, ty2, tr, 0, TAU); x.fill(); x.stroke();
      }
      x.fillStyle = style === 'white' ? '#d8cfff' : '#8a5a2a';
      x.fillRect(-f * 0.1, -f * 0.95, f * 0.3, f * 1.9);
    } else {
      rrect(x, -f * 0.55, -f * 1.0, f * 1.95, f * 2.0, f * 0.6); x.fill(); x.stroke();
      // ゆびの すじ
      x.beginPath();
      for (let k = 1; k < 4; k++) { x.moveTo(f * 1.4, -f + k * f * 0.5); x.lineTo(f * 0.75, -f + k * f * 0.5); }
      x.stroke();
      // おやゆび
      rrect(x, -f * 0.2, f * 0.25, f * 1.0, f * 0.55, f * 0.25); x.fill(); x.stroke();
      x.fillStyle = C.hi; x.globalAlpha = 0.7 * a;
      rrect(x, f * 0.1, -f * 0.85, f * 0.9, f * 0.35, f * 0.15); x.fill();
    }
    x.restore();
  },
  // ニカの 白い 雲の 炎（もこもこ わきあがる。黒い ふち）。x,y … ねもと、w,h … 大きさ
  g2Cloud(x, p) {
    const a = clamp01((p.life - p.age) / 90);
    if (a <= 0 || p.age >= p.life) return;
    const g = easeOut(clamp01(p.age / 300)) * Math.sqrt(clamp01((p.life - p.age) / 260));
    const n = p.n || 9;
    const blobs = [];
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) - 0.5 : 0;
      const up = 1 - Math.abs(u) * 1.6;
      const by = p.y - (p.h * (0.25 + 0.75 * Math.max(0, up)) * hash(i * 2.3 + (p.seed || 0)) + p.age * (p.rise || 0.012) * (0.5 + hash(i)));
      const br = (p.w / n) * 1.3 * (0.9 + 0.5 * hash(i * 4.1 + (p.seed || 0))) * (1 + 0.08 * Math.sin(p.age / 90 + i * 2));
      blobs.push([p.x + u * p.w + Math.sin(p.age / 160 + i) * 2, by, br * g]);
    }
    x.save();
    x.globalAlpha = 0.95 * a;
    for (const [bx, by, br] of blobs) disc(x, bx, by, br + 1, p.ink || INK);
    for (const [bx, by, br] of blobs) disc(x, bx, by, br, '#ffffff');
    x.globalAlpha = 0.6 * a;
    for (const [bx, by, br] of blobs) disc(x, bx + br * 0.15, by + br * 0.35, br * 0.55, p.shade || '#dcd2ff');
    x.restore();
  },
  // ルフィの すがた（むぎわらぼうし）。keys: [[ms, x, y, s]]（足もと）。gear: 0・2・4・5
  g2Luffy(x, p) {
    const [lx, ly, s0] = kf(p.keys, p.age, p.ease || 'out');
    const a = envOf(p, 120, 200);
    if (a <= 0) return;
    const s = s0 || p.s || 1;
    const G = p.gear || 0;
    const white = G === 5;
    const C = {
      skin: G === 2 ? '#ff8a84' : white ? '#ffffff' : '#f6c49a',
      vest: white ? '#ffffff' : '#d8262a', pants: white ? '#ffffff' : '#3a6ad8', sash: white ? '#b89aff' : '#ffd23a',
      hair: white ? '#ffffff' : '#1a1418', ink: white ? '#2a2040' : '#3a1a10', limb: G === 4 ? '#1c1418' : null,
    };
    const squash = G === 4 ? 1 + 0.12 * Math.sin(p.age / 70) : 1;
    x.save();
    x.translate(lx, ly);
    x.scale(s / squash, s * squash);
    x.globalAlpha = a;
    x.lineJoin = 'round'; x.lineCap = 'round';
    const lw = 0.8;
    const limb = (x0, y0, x1, y1, col, w) => { x.strokeStyle = C.ink; x.lineWidth = w + lw * 1.4; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
    const big = G === 4 ? 1.7 : 1;
    // あし
    limb(-2, -8, -3.5, 0, C.limb || C.skin, 2.2 * big); limb(2, -8, 3.5, 0, C.limb || C.skin, 2.2 * big);
    x.fillStyle = C.ink; rrect(x, -4.6, -10.5, 9.2, 4, 1); x.fill();
    x.fillStyle = C.pants; rrect(x, -4.1, -10.1, 8.2, 3.4, 0.8); x.fill();
    // うで（ばんざい ニカ / ふつう）
    const wave = Math.sin(p.age / 90);
    if (white) { limb(-3.5, -16, -8, -22 - wave * 2, C.skin, 2); limb(3.5, -16, 8, -22 + wave * 2, C.skin, 2); }
    else { limb(-3.5, -16, -6.5 * big, -10, C.limb || C.skin, 2 * big); limb(3.5, -16, 6.5 * big, -10, C.limb || C.skin, 2 * big); }
    // むね（ひらいた ベスト）
    x.fillStyle = C.ink; rrect(x, -4.6 * big, -17.6, 9.2 * big, 8, 1.6); x.fill();
    x.fillStyle = C.skin; rrect(x, -4 * big, -17, 8 * big, 7, 1.4); x.fill();
    x.fillStyle = C.vest;
    x.fillRect(-4 * big, -17, 2.4 * big, 7); x.fillRect(1.6 * big, -17, 2.4 * big, 7);
    x.fillStyle = C.sash; x.fillRect(-4 * big, -10.8, 8 * big, 1.2);
    if (G === 4) {
      // 黒い かたと 赤い すじ
      x.fillStyle = C.limb; rrect(x, -6.5, -18.5, 13, 3.2, 1.5); x.fill();
      x.strokeStyle = '#ff3a4a'; x.lineWidth = 0.5;
      x.beginPath(); x.moveTo(-6, -17); x.lineTo(-3, -16.2); x.moveTo(6, -17); x.lineTo(3, -16.2); x.stroke();
    }
    // あたま
    disc(x, 0, -21.5, 4.2, C.ink);
    disc(x, 0, -21.5, 3.6, C.skin);
    if (white) {
      // 白い 雲の かみ
      for (let i = 0; i < 7; i++) { const an = Math.PI + (i / 6) * Math.PI; disc(x, Math.cos(an) * 4.4, -22.5 + Math.sin(an) * 3.6 + Math.sin(p.age / 80 + i) * 0.4, 2.4, C.ink); }
      for (let i = 0; i < 7; i++) { const an = Math.PI + (i / 6) * Math.PI; disc(x, Math.cos(an) * 4.4, -22.5 + Math.sin(an) * 3.6 + Math.sin(p.age / 80 + i) * 0.4, 2, '#ffffff'); }
      // 大わらい（目は まる、口は 大きく）
      x.strokeStyle = C.ink; x.lineWidth = 0.6;
      x.beginPath(); x.arc(-1.4, -22, 0.9, 0, TAU); x.moveTo(2.3, -22); x.arc(1.4, -22, 0.9, 0, TAU); x.stroke();
      x.fillStyle = '#ff5a6a';
      x.beginPath(); x.arc(0, -20.2, 1.9, 0, Math.PI); x.closePath(); x.fill(); x.stroke();
    } else {
      // くろい かみ・むぎわらぼうし
      x.fillStyle = C.hair; x.fillRect(-3.6, -23.6, 7.2, 1.6);
      x.fillStyle = '#2a1a10'; x.fillRect(1.2, -21.6, 0.8, 1); x.fillRect(-1.8, -21.6, 0.8, 1);
      x.strokeStyle = C.ink; x.lineWidth = 0.5; x.beginPath(); x.arc(0, -20.4, 1.4, 0.2, Math.PI - 0.2); x.stroke();
      x.fillStyle = C.ink; x.beginPath(); x.ellipse(0, -24, 7.3, 1.8, 0, 0, TAU); x.fill();
      x.fillStyle = '#f2d06a'; x.beginPath(); x.ellipse(0, -24, 6.7, 1.3, 0, 0, TAU); x.fill();
      x.fillStyle = C.ink; rrect(x, -3.9, -28.2, 7.8, 4.6, 2.2); x.fill();
      x.fillStyle = '#f2d06a'; rrect(x, -3.4, -27.7, 6.8, 3.8, 1.9); x.fill();
      x.fillStyle = '#d8262a'; x.fillRect(-3.4, -25.2, 6.8, 1.1);
    }
    x.restore();
  },
  // 大きな ニカの 顔（白い かげ。黒い ふち・雲の かみ・大わらい）。keys: [[ms, x, y, s]]（あご）
  g2Nika(x, p) {
    const [nx0, ny0, s] = kf(p.keys, p.age, 'out');
    const a = envOf(p, 160, 260);
    if (a <= 0 || !(s > 0)) return;
    x.save();
    x.translate(nx0, ny0);
    x.scale(s, s);
    x.globalAlpha = a;
    x.lineJoin = 'round';
    const lw = 1.4 / Math.max(0.5, s * 0.6);
    // かた
    x.fillStyle = INK;
    x.beginPath(); x.ellipse(0, 26, 46, 22, 0, Math.PI, TAU); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(0, 26.5, 44.5, 20.5, 0, Math.PI, TAU); x.fill();
    x.fillStyle = '#d8cfff';
    x.fillRect(-4, 8, 8, 18);
    // 雲の かみ
    const hb = [];
    for (let i = 0; i < 11; i++) { const an = Math.PI * 0.95 + (i / 10) * Math.PI * 1.1; hb.push([Math.cos(an) * 24, -20 + Math.sin(an) * 22 + Math.sin(p.age / 110 + i) * 1.5, 9 + 3 * hash(i)]); }
    for (const [bx, by, br] of hb) disc(x, bx, by, br + lw, INK);
    for (const [bx, by, br] of hb) disc(x, bx, by, br, '#ffffff');
    // かお
    disc(x, 0, -16, 19 + lw, INK);
    disc(x, 0, -16, 19, '#ffffff');
    x.globalAlpha = 0.5 * a;
    disc(x, 6, -10, 12, '#ece6ff');
    x.globalAlpha = a;
    // にこにこの 目（^ ^）と ほっぺ
    x.strokeStyle = INK; x.lineWidth = lw * 1.5; x.lineCap = 'round';
    for (const sd of [-1, 1]) { x.beginPath(); x.arc(sd * 7, -19, 4, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    x.globalAlpha = 0.6 * a;
    disc(x, -12, -12, 3, '#ffb0c0'); disc(x, 12, -12, 3, '#ffb0c0');
    x.globalAlpha = a;
    // 大きな 口（わらう）
    const open = 0.75 + 0.25 * Math.abs(Math.sin(p.age / 110));
    x.fillStyle = INK;
    x.beginPath(); x.moveTo(-13, -11); x.quadraticCurveTo(0, -11 + 18 * open, 13, -11); x.closePath(); x.fill();
    x.fillStyle = '#ffffff';
    x.fillRect(-11, -11, 22, 2.6);
    x.fillStyle = '#ff6a7a';
    x.beginPath(); x.ellipse(0, -11 + 10 * open, 5.5, 2.6 * open, 0, 0, TAU); x.fill();
    x.restore();
  },
  // 線の 字（ハ・K・5・0・!・Z・オ・ー）。keys: [[ms, x, y]]、size、color、ink（ふち）、pop … ぽんと 出る
  g2Text(x, p) {
    const [tx, ty] = p.keys ? kf(p.keys, p.age, 'out') : [p.x, p.y];
    const a = envOf(p, 40, 160);
    if (a <= 0) return;
    const pop = p.pop === false ? 1 : 1 + 0.5 * Math.exp(-p.age / 70) * Math.cos(p.age / 30);
    const sz = p.size * Math.max(0.2, pop);
    const chars = [...p.str];
    const adv = sz * (p.str.includes('ハ') ? 1.05 : 0.85);
    let ox = tx - (chars.length * adv - sz * 0.15) / 2;
    x.save();
    x.globalAlpha = a;
    x.lineCap = 'round'; x.lineJoin = 'round';
    const draw = (col, w) => {
      x.strokeStyle = col; x.lineWidth = w;
      chars.forEach((ch, i) => {
        const g = GLYPH[ch];
        if (!g) return;
        const bx = ox + i * adv, by = ty - sz / 2 + (p.wave ? Math.sin(p.age / 60 + i) * sz * 0.08 : 0);
        for (const st of g) { x.beginPath(); st.forEach(([u, v], k) => (k ? x.lineTo(bx + u * sz * 0.7, by + v * sz) : x.moveTo(bx + u * sz * 0.7, by + v * sz))); x.stroke(); }
      });
    };
    draw(p.ink || INK, sz * 0.3);
    draw(p.color || '#ffffff', sz * 0.16);
    x.restore();
  },
  // 赤い 電車（赤い 車体・白い 帯・まどの ならび・ライト）。keys: [[ms, あたまx, あたまy]]、cars … 車両の かず、ang … すすむ むき
  g2Train(x, p) {
    const [hx, hy] = kf(p.keys, p.age, p.ease || 'lin');
    const a = envOf(p, 40, 120);
    if (a <= 0) return;
    const s = p.s || 1;
    const L = 30, H = 12;
    const n = p.cars || 1;
    const body = p.body || '#d8102a', band = p.band || '#ffffff', dark = p.dark || '#8a0814';
    x.save();
    x.translate(hx, hy);
    const ang = p.ang || 0;
    x.rotate(ang);
    if (Math.cos(ang) < -0.01) x.scale(1, -1);
    x.scale(s, s);
    x.globalAlpha = a;
    // ライトの 光（まえへ）
    if (p.light !== false) {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.45 * a;
      x.fillStyle = '#fff6c8';
      x.beginPath(); x.moveTo(0, -3.5); x.lineTo(46, -12); x.lineTo(46, 4); x.closePath(); x.fill();
      softGlow(x, 1, -3.2, 8, '#fff6c8', a);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a;
    }
    // すすむ すじ（車体の うしろ）
    x.strokeStyle = '#ffffff';
    x.globalAlpha = 0.45 * a;
    x.lineWidth = 0.6;
    x.beginPath();
    for (let i = 0; i < 6; i++) {
      const yy = -H - 3 + hash(i * 3.1 + (p.seed || 0)) * (H + 8);
      const xx = -((p.age * 0.4 + hash(i) * 200) % (n * L + 40));
      x.moveTo(xx, yy); x.lineTo(xx - 14 - hash(i * 7) * 20, yy);
    }
    x.stroke();
    x.globalAlpha = a;
    const shakeY = (hash(Math.floor(p.age / 50)) - 0.5) * 0.5;
    for (let i = 0; i < n; i++) {
      const x1 = -i * L, x0 = x1 - L + 1.4;
      const yy = shakeY * (i % 2 ? 1 : -1);
      // 台車と 車輪
      x.fillStyle = '#18181e';
      x.fillRect(x0 + 3, yy - 2.2, 7, 2.2); x.fillRect(x1 - 10, yy - 2.2, 7, 2.2);
      x.fillStyle = '#4a4a58';
      for (const wx of [x0 + 4.5, x0 + 8.5, x1 - 8.5, x1 - 4.5]) disc(x, wx, yy - 0.6, 1.25, '#3a3a44');
      // 車体
      const top = yy - H - 1.8, bot = yy - 2;
      x.fillStyle = '#2a0408';
      if (i === 0) {
        poly(x, [[x0 - 0.5, top - 0.5], [x1 - 3, top - 0.5], [x1 + 0.6, top + 3.5], [x1 + 1.2, bot + 0.5], [x0 - 0.5, bot + 0.5]]); x.fill();
        x.fillStyle = body;
        poly(x, [[x0, top], [x1 - 3.2, top], [x1, top + 3.6], [x1 + 0.6, bot], [x0, bot]]); x.fill();
      } else {
        rrect(x, x0 - 0.5, top - 0.5, L - 0.4, H + 1, 1.6); x.fill();
        x.fillStyle = body;
        rrect(x, x0, top, L - 1.4, H, 1.4); x.fill();
      }
      // 屋根
      x.fillStyle = '#c8c8d0';
      x.fillRect(x0 + 1.5, top - 0.9, L - 5, 0.9);
      // まど
      x.fillStyle = '#1a2436';
      for (let k = 0; k < 6; k++) x.fillRect(x0 + 2.2 + k * 4.4, top + 2, 2.8, 3.4);
      x.fillStyle = '#7a9ac8';
      x.globalAlpha = 0.6 * a;
      for (let k = 0; k < 6; k++) x.fillRect(x0 + 2.2 + k * 4.4, top + 2, 1, 1.2);
      x.globalAlpha = a;
      // 白い 帯
      x.fillStyle = band;
      x.fillRect(x0, top + 6.2, L - 1.4 + (i === 0 ? 0.4 : 0), 1.6);
      // ドア
      x.fillStyle = dark;
      x.fillRect(x0 + 7.6, top + 1.6, 0.6, H - 2); x.fillRect(x1 - 9, top + 1.6, 0.6, H - 2);
      // すそ
      x.fillStyle = dark;
      x.fillRect(x0, bot - 1.2, L - 1.4, 1.2);
      // パンタグラフ
      if (i % 2 === 1) {
        x.strokeStyle = '#3a3a44'; x.lineWidth = 0.6;
        const px = x0 + L * 0.5;
        x.beginPath(); x.moveTo(px - 4, top - 0.9); x.lineTo(px, top - 4.5); x.lineTo(px + 4, top - 0.9); x.moveTo(px - 3, top - 4.5); x.lineTo(px + 3, top - 4.5); x.stroke();
      }
      // れんけつ
      if (i < n - 1) { x.fillStyle = '#18181e'; x.fillRect(x0 - 1.4, top + 4, 1.6, 4); }
      if (i === 0) {
        // まえの かお（大きな まど・行き先・ライト）
        x.fillStyle = '#0c1018';
        poly(x, [[x1 - 3.6, top + 1.2], [x1 - 1.2, top + 1.2], [x1 + 0.2, top + 5.4], [x1 - 3.6, top + 5.4]]); x.fill();
        x.fillStyle = p.sign || '#ff5a3a';
        x.globalCompositeOperation = 'lighter';
        x.fillRect(x1 - 6.6, top + 0.5, 3, 1.2);
        x.fillStyle = '#ffffff';
        disc(x, x1 + 0.2, top + 8.8, 0.9, '#fff6c8');
        disc(x, x1 + 0.4, top + 10.2, 0.7, '#fff6c8');
        x.globalCompositeOperation = 'source-over';
      }
      if (i === n - 1 && p.tail) {
        x.globalCompositeOperation = 'lighter';
        softGlow(x, x0, top + 9, 5, '#ff2a2a', a);
        x.globalCompositeOperation = 'source-over';
      }
    }
    x.restore();
  },
  // 線路（2本の レール と まくら木。レールが 光る）。x0..x1 の よこ、y … 高さ
  g2Rails(x, p) {
    const a = envOf(p, 120, 200);
    if (a <= 0) return;
    const W = 256;
    const x0 = p.x0 ?? -8, x1 = p.x1 ?? W + 8;
    x.save();
    x.globalAlpha = 0.8 * a;
    x.fillStyle = '#3a2a22';
    for (let xx = x0 + ((p.age * (p.scroll || 0)) % 8); xx < x1; xx += 8) x.fillRect(xx, p.y - 1.6, 3, 4.2);
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = p.color || '#ff4a4a';
    x.globalAlpha = 0.45 * a;
    x.fillRect(x0, p.y - 2.2, x1 - x0, 2.2);
    x.fillRect(x0, p.y + 1.6, x1 - x0, 2.2);
    x.globalAlpha = 0.95 * a;
    x.fillStyle = '#e8e8f0';
    x.fillRect(x0, p.y - 1.4, x1 - x0, 0.8);
    x.fillRect(x0, p.y + 2.2, x1 - x0, 0.8);
    x.restore();
  },
  // 画面いっぱいの 背景（style: sun・sky・storm・rails・stadium・lines）。a … こさ
  g2Bg(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const env = envOf(p, p.fin ?? 200, p.fout ?? 300);
    if (env <= 0) return;
    const A = (p.a ?? 0.6) * env;
    const age = p.age;
    x.save();
    x.globalCompositeOperation = 'source-over';
    const fill = (col, al, y0 = -8, h = H + 16) => { x.globalAlpha = al; x.fillStyle = col; x.fillRect(-8, y0, W + 16, h); };
    if (p.style === 'sun') {
      fill('#2a1a48', A);
      x.globalCompositeOperation = 'lighter';
      const cx = p.cx ?? W / 2, cy = p.cy ?? 30;
      x.fillStyle = '#ffe8a0';
      x.globalAlpha = 0.15 * env;
      const n = 16, rot = age / 2400;
      x.beginPath();
      for (let i = 0; i < n; i++) {
        const a0 = rot + (i / n) * TAU, a1 = a0 + TAU / n * 0.5;
        x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a0) * 320, cy + Math.sin(a0) * 320); x.lineTo(cx + Math.cos(a1) * 320, cy + Math.sin(a1) * 320); x.closePath();
      }
      x.fill();
      softGlow(x, cx, cy, 70, '#fff0b0', 0.5 * env);
      softGlow(x, cx, cy, 26, '#ffffff', 0.85 * env, true);
    } else if (p.style === 'sky' || p.style === 'storm') {
      const storm = p.style === 'storm';
      fill(storm ? '#0c1024' : '#1a2a5a', A, -8, H * 0.5);
      fill(storm ? '#141a30' : '#c8603a', A * (storm ? 1 : 0.5), H * 0.5 - 8, H * 0.6);
      // 雲
      x.globalAlpha = A * 0.9;
      for (let i = 0; i < 7; i++) {
        const cxp = ((i * 47 + age * (0.01 + 0.006 * i)) % (W + 80)) - 40, cyp = 12 + hash(i) * 40;
        x.fillStyle = storm ? '#2a3048' : '#f0c8a8';
        x.globalAlpha = A * (storm ? 0.9 : 0.45);
        for (let k = 0; k < 3; k++) disc(x, cxp + k * 9, cyp + (k === 1 ? -4 : 0), 8 + (k === 1 ? 3 : 0), x.fillStyle);
      }
      if (!storm) {
        x.globalCompositeOperation = 'lighter';
        softGlow(x, W * 0.5, H * 0.52, 110, '#ff9a40', 0.3 * env);
      } else if (Math.floor(age / 90) % 7 === 0) {
        fill('#c8d8ff', 0.12 * env);
      }
    } else if (p.style === 'rails') {
      fill('#0a0816', A);
      x.globalCompositeOperation = 'lighter';
      // 遠くに のびる レール（光る）
      const vx = W / 2, vy = H * 0.34;
      x.strokeStyle = '#ff3a3a';
      x.lineWidth = 1;
      x.globalAlpha = 0.5 * env;
      x.beginPath();
      for (const bx of [-60, 20, 236, 316]) { x.moveTo(bx, H + 8); x.lineTo(vx + (bx - vx) * 0.05, vy); }
      x.stroke();
      // まくら木が 手前へ
      x.strokeStyle = '#ff8a6a';
      x.globalAlpha = 0.35 * env;
      x.beginPath();
      for (let i = 0; i < 9; i++) {
        const u = ((age / 700 + i / 9) % 1);
        const yy = vy + (H + 8 - vy) * u * u;
        const hw = 8 + 160 * u * u;
        x.moveTo(vx - hw, yy); x.lineTo(vx + hw, yy);
      }
      x.stroke();
      // 空中の レール
      if (p.sky) {
        x.strokeStyle = '#ffd0c8';
        x.globalAlpha = 0.4 * env;
        x.lineWidth = 0.8;
        x.beginPath();
        for (let i = 0; i < 4; i++) { const y0 = 10 + i * 14; x.moveTo(-8, y0 + 30); x.lineTo(W + 8, y0 - 6 + i * 4); }
        x.stroke();
      }
      softGlow(x, vx, vy, 40, '#ff4a3a', 0.6 * env);
    } else if (p.style === 'stadium') {
      fill('#06102a', A);
      // スタンド と 観客の 光
      fill('#0c1430', A, H * 0.22, H * 0.3);
      x.globalCompositeOperation = 'lighter';
      const cols = ['#ffffff', '#ffd23a', '#ff6a6a', '#6ab8ff'];
      for (let i = 0; i < 70; i++) {
        const sx = hash(i * 1.7) * W, sy = H * 0.24 + hash(i * 3.3) * H * 0.26;
        const tw = 0.4 + 0.6 * Math.max(0, Math.sin(age / (90 + hash(i) * 120) + i + (p.wave ? sx / 30 - age / 120 : 0)));
        x.globalAlpha = tw * env * 0.9;
        x.fillStyle = cols[i % 4];
        x.fillRect(sx, sy, 1, 1);
      }
      // ナイターの ライト
      for (const lx of [24, 92, 164, 232]) {
        x.globalAlpha = 0.18 * env;
        x.fillStyle = '#e8f0ff';
        x.beginPath(); x.moveTo(lx - 6, 6); x.lineTo(lx + 6, 6); x.lineTo(lx + 40 - (lx - W / 2) * 0.5, H); x.lineTo(lx - 40 - (lx - W / 2) * 0.5, H); x.closePath(); x.fill();
        softGlow(x, lx, 7, 14, '#ffffff', 0.9 * env, true);
        x.globalAlpha = env;
        x.fillStyle = '#ffffff';
        x.fillRect(lx - 6, 5, 12, 3);
      }
      x.globalCompositeOperation = 'source-over';
      fill('#1a4a2a', A * 0.8, H * 0.82, H * 0.3);
    } else {
      // lines: マンガの 集中線
      fill(p.color || '#ffffff', A * 0.7);
      x.strokeStyle = INK;
      x.globalAlpha = 0.6 * env;
      x.lineWidth = 1;
      x.beginPath();
      const fr = Math.floor(age / 60);
      for (let i = 0; i < 40; i++) {
        const an = (i / 40) * TAU + hash(i + fr) * 0.1;
        const r0 = 50 + hash(i * 2 + fr) * 30;
        x.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0 * 0.6);
        x.lineTo(W / 2 + Math.cos(an) * 200, H / 2 + Math.sin(an) * 120);
      }
      x.stroke();
    }
    x.restore();
  },
  // やきゅうの 球（白に 赤い ぬいめ）。keys: [[ms, x, y, 大きさ]]、trail: 'white'・'fire'・'gold'、vanish: [[ms0, ms1]…]（消える あいだ）
  g2Ball(x, p) {
    const [bx, by, bs] = kf(p.keys, p.age, p.ease || 'lin');
    let a = envOf(p, 20, 100);
    if (p.vanish) for (const [v0, v1] of p.vanish) if (p.age > v0 && p.age < v1) a *= p.age - v0 < 60 ? (Math.floor(p.age / 20) % 2 ? 0.2 : 0.7) : 0;
    if (a <= 0) return;
    const r = 2.3 * (bs || 1) * (p.s || 1);
    x.save();
    // すじ
    if (p.trail) {
      x.globalCompositeOperation = 'lighter';
      x.lineCap = 'round';
      const cols = p.trail === 'fire' ? ['#ff4a0a', '#ffa02a', '#fff0a0'] : p.trail === 'gold' ? ['#ffa00a', '#ffd23a', '#fffbe0'] : ['#9ab8ff', '#e0ecff', '#ffffff'];
      const len = p.tlen || 90;
      for (let k = 0; k < 3; k++) {
        const [qx, qy] = kf(p.keys, Math.max(0, p.age - len * (1 - k * 0.3)), p.ease || 'lin');
        x.strokeStyle = cols[k];
        x.globalAlpha = (0.35 + k * 0.25) * a;
        x.lineWidth = r * (2.6 - k * 0.7);
        x.beginPath(); x.moveTo(qx, qy); x.lineTo(bx, by); x.stroke();
      }
      softGlow(x, bx, by, r * 4, cols[1], 0.7 * a);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = a;
    disc(x, bx, by, r + 0.5, '#6a6a7a');
    disc(x, bx, by, r, '#fbfbf6');
    x.translate(bx, by);
    x.rotate(p.age / 25);
    x.strokeStyle = '#e02a2a';
    x.lineWidth = Math.max(0.35, r * 0.2);
    x.beginPath(); x.arc(-r * 1.15, 0, r * 0.85, -0.9, 0.9); x.stroke();
    x.beginPath(); x.arc(r * 1.15, 0, r * 0.85, Math.PI - 0.9, Math.PI + 0.9); x.stroke();
    x.restore();
  },
  // バット（ふりぬく）。x,y … にぎり、keys: [[ms, 角度]]、len、gold … 金の バット
  g2Bat(x, p) {
    const [ang] = kf(p.keys, p.age, p.ease || 'in');
    const a = envOf(p, 40, 140);
    if (a <= 0) return;
    const L = p.len || 26;
    x.save();
    x.translate(p.x, p.y);
    // ふった あとの 白い 弧
    const [a0] = kf(p.keys, Math.max(0, p.age - 70), p.ease || 'in');
    if (Math.abs(ang - a0) > 0.05) {
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.55 * a;
      x.fillStyle = p.gold ? '#ffe08a' : '#ffffff';
      x.beginPath(); x.arc(0, 0, L, Math.min(a0, ang), Math.max(a0, ang)); x.arc(0, 0, L * 0.45, Math.max(a0, ang), Math.min(a0, ang), true); x.closePath(); x.fill();
      x.globalCompositeOperation = 'source-over';
    }
    x.rotate(ang);
    x.globalAlpha = a;
    if (p.gold) { x.globalCompositeOperation = 'lighter'; softGlow(x, L * 0.7, 0, L * 0.5, '#ffd23a', 0.8 * a); x.globalCompositeOperation = 'source-over'; }
    const wood = p.gold ? '#ffd23a' : '#d8a060', hi = p.gold ? '#fffbe0' : '#f8d8a8', ink = p.gold ? '#8a5a0a' : '#5a3418';
    x.fillStyle = ink;
    poly(x, [[-1, -1.3], [L * 0.42, -1.3], [L, -2.9], [L + 1.2, 0], [L, 2.9], [L * 0.42, 1.3], [-1, 1.3]]); x.fill();
    x.fillStyle = wood;
    poly(x, [[-0.4, -0.8], [L * 0.42, -0.8], [L - 0.4, -2.3], [L + 0.4, 0], [L - 0.4, 2.3], [L * 0.42, 0.8], [-0.4, 0.8]]); x.fill();
    x.fillStyle = hi;
    x.fillRect(L * 0.45, -1.4, L * 0.5, 0.8);
    disc(x, -1.4, 0, 1.6, ink);
    x.restore();
  },
  // 光の 人かげ（バッター）。x,y … 足もと、keys: [[ms, バットの 角度]]、s … 大きさ、col … 光の 色、point … バットで 空を さす
  g2Batter(x, p) {
    const a = envOf(p, 140, 200);
    if (a <= 0) return;
    const [ang] = kf(p.keys || [[0, -2.4]], p.age, 'in');
    const s = p.s || 1, d = p.dir || 1;
    const col = p.col || '#ffe08a';
    x.save();
    x.translate(p.x, p.y);
    x.scale(s * d, s);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -11, 18, col, 0.6 * a);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = 0.92 * a;
    x.lineCap = 'round';
    x.strokeStyle = col; x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(-1, -8); x.lineTo(-4, 0); x.moveTo(1, -8); x.lineTo(4, 0); x.stroke();
    x.fillStyle = col;
    rrect(x, -3.2, -15, 6.4, 8, 2); x.fill();
    disc(x, 0, -18, 3, col);
    // ぼうしの つば
    x.fillRect(0, -19.6, 4.4, 1.2);
    // うでと バット
    const hx = 2.5, hy = -12;
    x.lineWidth = 1.8;
    x.beginPath(); x.moveTo(0, -13); x.lineTo(hx, hy); x.stroke();
    if (p.nobat) { x.restore(); return; }
    x.translate(hx, hy);
    x.rotate(ang);
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(0, 0); x.lineTo(15, 0); x.stroke();
    x.lineWidth = 2.6;
    x.beginPath(); x.moveTo(8, 0); x.lineTo(15, 0); x.stroke();
    x.restore();
  },
  // 花火（ひかりの わ と おちる 火の粉は つぶで。ここは まん中の ひらく 線）
  g2Firework(x, p) {
    const t = clamp01(p.age / p.life);
    const a = t < 0.5 ? 1 : clamp01((1 - t) / 0.5);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / 380));
    const R = p.r * e;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y + R * 0.1 * t, R * 1.3, p.cols[0], 0.5 * a * (1 - t));
    const n = p.n || 18;
    for (let k = 0; k < 2; k++) {
      x.strokeStyle = p.cols[k % p.cols.length];
      x.lineWidth = 1.1 - k * 0.4;
      x.globalAlpha = a;
      x.beginPath();
      for (let i = 0; i < n; i++) {
        const an = (i / n) * TAU + k * 0.17;
        const rr = R * (k ? 0.62 : 1);
        const ex = p.x + Math.cos(an) * rr, ey = p.y + Math.sin(an) * rr + 14 * t * t;
        x.moveTo(lerp(p.x, ex, 0.55 + 0.3 * t), lerp(p.y, ey, 0.55 + 0.3 * t)); x.lineTo(ex, ey);
      }
      x.stroke();
      x.fillStyle = '#ffffff';
      for (let i = 0; i < n; i += 2) {
        const an = (i / n) * TAU + k * 0.17, rr = R * (k ? 0.62 : 1);
        disc(x, p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr + 14 * t * t, 0.7, '#ffffff');
      }
    }
    x.restore();
  },
  // 小さな 道具の 絵（icon: drum・signal・plane・clock・trophy・pillow・mic・envelope・hammer・frog・eyes・sage・foxmaw・front・platform・diagram・balloon・hammerbig・smile・hand・mark）
  // keys: [[ms, x, y, s]] か x,y,s（vx・vy・g で うごく）
  g2Icon(x, p) {
    const k = p.keys ? kf(p.keys, p.age, p.ease || 'out') : [p.x, p.y, p.s || 1];
    const [ix, iy] = k, s = k[2] ?? p.s ?? 1;
    const a = envOf(p, p.fin ?? 80, p.fout ?? 160);
    if (a <= 0 || !(s > 0)) return;
    const draw = ICONS[p.icon];
    if (!draw) return;
    x.save();
    x.translate(ix, iy);
    if (p.rkeys) x.rotate(kf(p.rkeys, p.age, p.rease || 'in')[0]);
    else if (p.rot || p.spin) x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000);
    x.scale(s, s);
    x.globalAlpha = a;
    x.lineJoin = 'round'; x.lineCap = 'round';
    draw(x, p, a);
    x.restore();
  },
  // ぎざぎざの いなずまの 大きな 弧（雷を ふりまわす）。x,y … まん中、r、a0 → a1 を swing ms で
  g2Jag(x, p) {
    const e = easeOut(clamp01(p.age / Math.max(1, p.swing)));
    const a = envOf(p, 20, 160);
    if (a <= 0) return;
    const a1 = lerp(p.a0, p.a1, e);
    const tailA = lerp(p.a0, p.a1, Math.max(0, e - 0.55));
    const fr = Math.floor(p.age / 40);
    const pts = [];
    const N = 22;
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      const an = lerp(tailA, a1, s);
      const j = (hash(i * 3.3 + fr * 7.7) - 0.5) * 10 * Math.sin(s * Math.PI);
      pts.push([p.x + Math.cos(an) * (p.r + j), p.y + Math.sin(an) * (p.r + j) * (p.sy || 0.6)]);
    }
    x.save();
    x.globalCompositeOperation = 'lighter';
    for (const [col, w, al] of [[p.glow || '#ffe040', 9, 0.35], [p.color || '#fff6b0', 3.4, 0.9], ['#ffffff', 1.4, 1]]) {
      x.strokeStyle = col; x.lineWidth = w; x.globalAlpha = al * a;
      poly(x, pts, false); x.stroke();
    }
    x.restore();
  },
  // 地面が ゴムの ように うねる（よこの 波の 線）
  g2Ripple(x, p, t, fx) {
    const a = envOf(p, 120, 220);
    if (a <= 0) return;
    const W = fx?.W || 256;
    x.save();
    x.strokeStyle = p.color || '#ffffff';
    x.lineWidth = 1.2;
    for (let r = 0; r < (p.n || 4); r++) {
      const yy = p.y + r * 9;
      x.globalAlpha = a * (0.9 - r * 0.15);
      x.beginPath();
      for (let xx = -8; xx <= W + 8; xx += 6) {
        const yv = yy + Math.sin(xx / 22 - p.age / 70 + r) * (p.amp || 5) * (1 + r * 0.3);
        xx > -8 ? x.lineTo(xx, yv) : x.moveTo(xx, yv);
      }
      x.stroke();
    }
    x.restore();
  },
  // 画面の よこ帯（色の 帯。命令の 赤い 光など）
  g2Band(x, p, t, fx) {
    const a = envOf(p, 120, 220);
    if (a <= 0) return;
    const W = fx?.W || 256;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = (p.a ?? 0.35) * a;
    x.fillStyle = p.color || '#ff3a3a';
    const h = p.h * easeOut(clamp01(p.age / 200));
    x.fillRect(-8, p.y - h / 2, W + 16, h);
    x.globalAlpha = 0.8 * a;
    x.fillStyle = '#ffffff';
    x.fillRect(-8, p.y - h / 2, W + 16, 0.8);
    x.fillRect(-8, p.y + h / 2 - 0.8, W + 16, 0.8);
    x.restore();
  },
};

// ───────────── 小さな 道具の 絵（g2Icon。ばしょは 0,0 の まわり） ─────────────
const ICONS = {
  // 白い ドラム（ニカ）
  drum(x, p) {
    const hit = Math.max(0, Math.sin(p.age / 60)) * 0.1;
    x.scale(1 + hit, 1 - hit);
    x.fillStyle = INK; rrect(x, -9, -6, 18, 13, 2); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, -8.2, -5.2, 16.4, 11.4, 1.6); x.fill();
    x.strokeStyle = '#b89aff'; x.lineWidth = 0.8;
    x.beginPath(); for (let i = 0; i < 5; i++) { x.moveTo(-8 + i * 4, -5); x.lineTo(-6 + i * 4, 6); } x.stroke();
    x.fillStyle = INK; x.beginPath(); x.ellipse(0, -6, 9, 3, 0, 0, TAU); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(0, -6, 8.2, 2.4, 0, 0, TAU); x.fill();
  },
  // 信号機（赤 → 青）
  signal(x, p) {
    const go = p.age > (p.go ?? 200);
    x.fillStyle = '#3a3a44'; x.fillRect(-1, 0, 2, 40);
    x.fillStyle = '#14141a'; rrect(x, -5, -24, 10, 25, 3); x.fill();
    x.strokeStyle = '#5a5a68'; x.lineWidth = 0.8; rrect(x, -5, -24, 10, 25, 3); x.stroke();
    disc(x, 0, -18, 3, go ? '#3a1010' : '#ff2a2a');
    disc(x, 0, -11.5, 3, '#2a2a10');
    disc(x, 0, -5, 3, go ? '#3aff9a' : '#103a24');
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, go ? -5 : -18, 12, go ? '#3aff9a' : '#ff2a2a', 0.9);
  },
  // 白い 飛行機
  plane(x) {
    x.fillStyle = '#ffffff'; x.strokeStyle = '#6a7a9a'; x.lineWidth = 0.5;
    poly(x, [[14, 0], [10, -1.8], [-10, -1.8], [-14, -6], [-16, -6], [-13, 0], [-16, 6], [-14, 6], [-10, 1.8], [10, 1.8]]); x.fill(); x.stroke();
    poly(x, [[3, -1.5], [-4, -10], [-7, -10], [-3, -1.5]]); x.fill(); x.stroke();
    poly(x, [[3, 1.5], [-4, 7], [-7, 7], [-3, 1.5]]); x.fill(); x.stroke();
    x.fillStyle = '#d8102a'; x.fillRect(-12, -1, 20, 0.8);
  },
  // とけい（はりが すすむ）
  clock(x, p) {
    disc(x, 0, 0, 11, '#3a4a6a'); disc(x, 0, 0, 10, '#f4f8ff');
    x.strokeStyle = '#3a4a6a'; x.lineWidth = 0.8;
    x.beginPath(); for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; x.moveTo(Math.cos(an) * 8, Math.sin(an) * 8); x.lineTo(Math.cos(an) * 9.3, Math.sin(an) * 9.3); } x.stroke();
    const m = p.age / 120, h = p.age / 1400;
    x.lineWidth = 1.4; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(h) * 5, -Math.cos(h) * 5); x.stroke();
    x.strokeStyle = '#d8102a'; x.lineWidth = 0.9; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(m) * 8, -Math.cos(m) * 8); x.stroke();
  },
  // 金の トロフィー
  trophy(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, -6, 20, '#ffd23a', 0.8); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#8a5a0a';
    poly(x, [[-8, -16], [8, -16], [6, -6], [2, -2], [2, 3], [5, 5], [5, 8], [-5, 8], [-5, 5], [-2, 3], [-2, -2], [-6, -6]]); x.fill();
    x.fillStyle = '#ffd23a';
    poly(x, [[-7, -15.3], [7, -15.3], [5.4, -6.4], [1.5, -2.6], [1.5, 3.4], [4.3, 5.4], [4.3, 7.3], [-4.3, 7.3], [-4.3, 5.4], [-1.5, 3.4], [-1.5, -2.6], [-5.4, -6.4]]); x.fill();
    x.strokeStyle = '#ffd23a'; x.lineWidth = 1.2;
    x.beginPath(); x.arc(-8, -11, 3, Math.PI * 0.5, Math.PI * 1.5); x.moveTo(8, -14); x.arc(8, -11, 3, -Math.PI * 0.5, Math.PI * 0.5); x.stroke();
    x.fillStyle = '#fffbe0'; x.fillRect(-4, -14, 1.4, 6);
  },
  // まくら
  pillow(x) {
    x.fillStyle = '#9ab8d8'; rrect(x, -12, -6, 24, 12, 5); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, -11.3, -5.4, 22.6, 10.6, 4.6); x.fill();
    x.fillStyle = '#d8e8ff'; x.beginPath(); x.ellipse(2, 1, 6, 2.4, 0, 0, TAU); x.fill();
  },
  // マイク
  mic(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, -8, 16, '#ffd23a', 0.7); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#3a3a48'; x.fillRect(-1.2, -2, 2.4, 22);
    x.fillStyle = '#5a5a6a'; rrect(x, -4, -3, 8, 4, 1); x.fill();
    disc(x, 0, -8, 5.6, '#2a2a34'); disc(x, 0, -8, 5, '#c8c8d4');
    x.strokeStyle = '#7a7a88'; x.lineWidth = 0.5;
    x.beginPath(); for (let i = -2; i <= 2; i++) { x.moveTo(-4.6, -8 + i * 1.8); x.lineTo(4.6, -8 + i * 1.8); } x.stroke();
  },
  // 金の ふうとう
  envelope(x, p) {
    x.scale(Math.cos(p.age / 120 + (p.seed || 0)) * 0.4 + 0.6, 1);
    x.fillStyle = '#a0700a'; x.fillRect(-7, -5, 14, 10);
    x.fillStyle = '#ffd23a'; x.fillRect(-6.4, -4.4, 12.8, 8.8);
    x.strokeStyle = '#a0700a'; x.lineWidth = 0.8;
    x.beginPath(); x.moveTo(-6.4, -4.4); x.lineTo(0, 0.8); x.lineTo(6.4, -4.4); x.stroke();
    disc(x, 0, 0.6, 1.4, '#e02a2a');
  },
  // 点検ハンマー
  hammer(x, p) {
    const sw = Math.sin(p.age / 60) * 0.6;
    x.rotate(sw);
    x.fillStyle = '#8a6a4a'; x.fillRect(-0.8, -2, 1.6, 16);
    x.fillStyle = '#c8ccd8'; rrect(x, -5, -4.5, 10, 4, 1); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(-4.6, -4.2, 9, 0.8);
  },
  // カエルの ひかり
  frog(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 10, '#ffe066', 0.9); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#ff9a2a';
    x.beginPath(); x.ellipse(0, 0, 5.4, 3.8, 0, 0, TAU); x.fill();
    disc(x, -2.6, -3.2, 1.8, '#ff9a2a'); disc(x, 2.6, -3.2, 1.8, '#ff9a2a');
    disc(x, -2.6, -3.4, 0.8, '#2a1408'); disc(x, 2.6, -3.4, 0.8, '#2a1408');
    x.strokeStyle = '#2a1408'; x.lineWidth = 0.5; x.beginPath(); x.arc(0, -0.6, 2.4, 0.3, Math.PI - 0.3); x.stroke();
  },
  // とび出す 目（マンガ）
  eyes(x, p) {
    const out = 4 + 10 * Math.abs(Math.sin(clamp01(p.age / 500) * Math.PI * 2.5));
    for (const sd of [-1, 1]) {
      x.strokeStyle = INK; x.lineWidth = 0.8;
      x.beginPath();
      for (let i = 0; i <= 8; i++) { const yy = -i / 8 * out; const xx = sd * 3 + Math.sin(i * 2.2) * 1.4; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); }
      x.stroke();
      disc(x, sd * 3, -out, 4.6, INK); disc(x, sd * 3, -out, 3.9, '#ffffff'); disc(x, sd * 3 + 0.8, -out, 1.5, INK);
    }
  },
  // せん人の 目（オレンジの くま＋黄色い 目）
  sage(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 22, '#ffe066', 0.55); x.globalCompositeOperation = 'source-over';
    for (const sd of [-1, 1]) {
      x.fillStyle = '#ff8a1a';
      x.beginPath(); x.ellipse(sd * 8, 0, 6.4, 4.4, 0, 0, TAU); x.fill();
      x.fillStyle = '#fff6b0';
      x.beginPath(); x.ellipse(sd * 8, 0.3, 3.8, 2.4, 0, 0, TAU); x.fill();
      x.fillStyle = '#1a1408'; x.fillRect(sd * 8 - 2.2, 0, 4.4, 0.9);
      x.globalCompositeOperation = 'lighter'; softGlow(x, sd * 8, 0.3, 6, '#ffe066', 0.9); x.globalCompositeOperation = 'source-over';
    }
  },
  // 九尾の 口の かげ（オレンジの きば）
  foxmaw(x, p) {
    const open = 0.6 + 0.4 * clamp01(p.age / 400);
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 4, 46, '#ff6a1a', 0.55); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#c8460a';
    x.beginPath(); x.moveTo(-44, -14); x.quadraticCurveTo(0, -34, 44, -14); x.lineTo(30, -2); x.quadraticCurveTo(0, 6, -30, -2); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-36, 10 + 12 * open); x.quadraticCurveTo(0, 30 + 14 * open, 36, 10 + 12 * open); x.lineTo(28, 6 + 8 * open); x.quadraticCurveTo(0, 18 + 8 * open, -28, 6 + 8 * open); x.closePath(); x.fill();
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6 - 0.5; const bx = u * 54, by = -2 + 6 * (1 - Math.abs(u) * 2) * 0.6; poly(x, [[bx - 3, by], [bx + 3, by], [bx, by + 7]]); x.fill(); }
    for (let i = 0; i < 5; i++) { const u = (i + 0.5) / 5 - 0.5; const bx = u * 46, by = 8 + 8 * open + 6 * (1 - Math.abs(u) * 2) * 0.6; poly(x, [[bx - 2.6, by], [bx + 2.6, by], [bx, by - 6]]); x.fill(); }
    // 目（すこし）
    x.fillStyle = '#ff2a1a';
    poly(x, [[-30, -22], [-14, -18], [-28, -16]]); x.fill(); poly(x, [[30, -22], [14, -18], [28, -16]]); x.fill();
  },
  // 赤い 先頭車の かお（まえから）
  front(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 34, '#ff4a4a', 0.5); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#5a0410'; rrect(x, -17, -21, 34, 40, 6); x.fill();
    x.fillStyle = '#d8102a'; rrect(x, -16, -20, 32, 38, 5); x.fill();
    x.fillStyle = '#0c1018'; rrect(x, -13, -16, 26, 12, 2); x.fill();
    x.fillStyle = '#3a4a6a'; x.fillRect(-12, -15, 6, 2);
    x.fillStyle = '#ff6a3a'; x.fillRect(-6, -19, 12, 2.4);
    x.fillStyle = '#ffffff'; x.fillRect(-16, 0, 32, 2.6);
    x.fillStyle = '#1a1a22'; x.fillRect(-14, 12, 28, 6);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, -10, 7, 7, '#fff6c8', 1); softGlow(x, 10, 7, 7, '#fff6c8', 1);
    disc(x, -10, 7, 2, '#ffffff'); disc(x, 10, 7, 2, '#ffffff');
  },
  // ホームの 柱が ながれる（つうか）
  platform(x, p) {
    const W = 256;
    x.fillStyle = '#5a5a68'; x.fillRect(-W / 2 - 8, 6, W + 16, 10);
    x.fillStyle = '#ffd23a'; x.fillRect(-W / 2 - 8, 6, W + 16, 1.4);
    x.fillStyle = '#3a3a48';
    for (let i = 0; i < 6; i++) { const xx = ((i * 52 - p.age * 0.7) % (W + 52) + W + 52) % (W + 52) - W / 2 - 26; x.fillRect(xx, -60, 5, 66); }
    x.fillStyle = '#2a2a34'; x.fillRect(-W / 2 - 8, -62, W + 16, 4);
  },
  // ダイヤ（時刻表の 線）
  diagram(x, p) {
    const W = 220, H = 80;
    x.strokeStyle = '#8aa0c8'; x.lineWidth = 0.4; x.globalAlpha *= 0.7;
    x.beginPath();
    for (let i = 0; i <= 8; i++) { x.moveTo(-W / 2, -H / 2 + i * H / 8); x.lineTo(W / 2, -H / 2 + i * H / 8); }
    for (let i = 0; i <= 12; i++) { x.moveTo(-W / 2 + i * W / 12, -H / 2); x.lineTo(-W / 2 + i * W / 12, H / 2); }
    x.stroke();
    const prog = clamp01(p.age / 500), prog2 = clamp01((p.age - 350) / 450);
    x.globalAlpha = Math.min(1, x.globalAlpha / 0.7);
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.9;
    x.beginPath();
    for (let i = 0; i < 7; i++) { const x0 = -W / 2 + i * 30; x.moveTo(x0, -H / 2); x.lineTo(x0 + 60 * prog, -H / 2 + H * prog); }
    x.stroke();
    x.strokeStyle = '#ff3a3a'; x.lineWidth = 1.6;
    x.beginPath();
    for (let i = 0; i < 7; i++) { const x0 = -W / 2 + 10 + i * 30; x.moveTo(x0, -H / 2); x.lineTo(x0 + 26 * prog2, -H / 2 + H * prog2); }
    x.stroke();
  },
  // ふうせんの ルフィ（まるい おなか＋むぎわらぼうし）
  balloon(x, p) {
    const sq = 1 + 0.08 * Math.sin(p.age / 50);
    x.scale(sq, 1 / sq);
    disc(x, 0, 0, 21, '#7a3a1a'); disc(x, 0, 0, 20, '#f6c49a');
    x.fillStyle = '#ffe8d0'; x.globalAlpha *= 0.7; x.beginPath(); x.ellipse(-7, -8, 6, 4, -0.5, 0, TAU); x.fill(); x.globalAlpha = Math.min(1, x.globalAlpha / 0.7);
    x.fillStyle = '#d8262a'; x.fillRect(-20, -4, 7, 12); x.fillRect(13, -4, 7, 12);
    x.fillStyle = '#3a6ad8'; x.beginPath(); x.ellipse(0, 17, 12, 4, 0, 0, TAU); x.fill();
    disc(x, 0, -22, 5, '#7a3a1a'); disc(x, 0, -22, 4.3, '#f6c49a');
    x.fillStyle = '#7a3a1a'; x.beginPath(); x.ellipse(0, -25.5, 8, 2, 0, 0, TAU); x.fill();
    x.fillStyle = '#f2d06a'; x.beginPath(); x.ellipse(0, -25.5, 7.3, 1.4, 0, 0, TAU); x.fill();
    rrect(x, -4, -30, 8, 5, 2.4); x.fill();
    x.fillStyle = '#d8262a'; x.fillRect(-4, -27, 8, 1.2);
  },
  // 白い 大きな ハンマー（マンガ）
  // にぎりが 0,0、あたまは 上（-40）
  hammerbig(x) {
    x.fillStyle = INK; x.fillRect(-2.6, -34, 5.2, 34);
    x.fillStyle = '#ffffff'; x.fillRect(-1.8, -33, 3.6, 32);
    x.fillStyle = INK; rrect(x, -17, -48, 34, 18, 4); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, -16, -47, 32, 16, 3.4); x.fill();
    x.fillStyle = '#dcd2ff'; x.fillRect(-16, -37, 32, 3);
    x.fillStyle = INK; x.fillRect(-16, -41, 32, 0.8);
  },
  // にこにこ顔の 光
  smile(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 0, 0, 10, '#fff6b0', 0.8); x.globalCompositeOperation = 'source-over';
    disc(x, 0, 0, 5, INK); disc(x, 0, 0, 4.4, '#ffffff');
    x.strokeStyle = INK; x.lineWidth = 0.7;
    x.beginPath(); x.arc(-1.6, -1, 0.9, Math.PI, TAU); x.moveTo(2.5, -1); x.arc(1.6, -1, 0.9, Math.PI, TAU); x.stroke();
    x.beginPath(); x.arc(0, 0.6, 2.4, 0.2, Math.PI - 0.2); x.stroke();
  },
  // 指さしの 手（白い 光）
  hand(x) {
    x.globalCompositeOperation = 'lighter'; softGlow(x, 4, 0, 10, '#ffffff', 0.7); x.globalCompositeOperation = 'source-over';
    x.fillStyle = '#ffffff'; x.strokeStyle = '#8a8aa0'; x.lineWidth = 0.5;
    rrect(x, -6, -3.4, 7, 6.8, 2); x.fill(); x.stroke();
    rrect(x, 0, -3.4, 9, 2.4, 1.2); x.fill(); x.stroke();
  },
  // 十字の 印（白い ＋ の 光）
  mark(x) {
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 14, '#c8f0ff', 0.9);
    x.fillStyle = '#ffffff';
    x.fillRect(-1.2, -9, 2.4, 18); x.fillRect(-9, -1.2, 18, 2.4);
  },
};

// ───────────── つかいやすい まとめ（fx に たす） ─────────────
// 画面を くらく（ためからの つづき）
export function darken(fx, a, life, delay = 0, fout = 260) {
  fx.add({ kind: 'axTint', x: 0, y: 0, color: '#04020c', a, delay, life, fin: 40, fout });
}
// 背景
export function bg(fx, style, o = {}) {
  fx.add({ kind: 'g2Bg', x: 128, y: 72, style, life: o.life || 1000, delay: o.delay || 0, a: o.a ?? 0.6, fin: o.fin, fout: o.fout, cx: o.cx, cy: o.cy, sky: o.sky, wave: o.wave, color: o.color });
}
// 「ボン」の けむり
export function pop(fx, x, y, o = {}) {
  fx.add({ kind: 'g2Pop', x, y, r: o.r || 9, delay: o.delay || 0, life: o.life || 420, seed: Math.random() * 6, color: o.color, shade: o.shade });
}
// 影分身（いちに 立つ）。keys が なければ x,y に 立つ
export function ninja(fx, x, y, o = {}) {
  const keys = o.keys || [[0, x, y]];
  fx.add({ kind: 'g2Ninja', x: keys[0][1], y: keys[0][2], keys, s: o.s || 1, dir: o.dir || 1, pose: o.pose || 'stand', look: o.look, delay: o.delay || 0, life: o.life || 600, fin: o.fin, fout: o.fout, ease: o.ease, seed: Math.random() * 6 });
}
// 当たった ところ（白い 星・わ・火花）。big … 段の 大きさ
export function blow(fx, x, y, o = {}) {
  const { r = 14, delay = 0, colors = ['#ffffff', '#ffd66b'], heavy = false, n = 16 } = o;
  fx.glow(x, y, { color: colors[1] || colors[0], r: r * 2.4, delay, life: 340, alpha: 0.9 });
  fx.impact(x, y, { r, color: '#ffffff', delay });
  fx.star(x, y, '#ffffff', r * 1.1, delay + 10, 260);
  fx.shock(x, y, { r0: r * 0.3, r1: r * 2.8, color: colors[0], w: heavy ? 2.8 : 2, delay, life: 340 });
  fx.sparks(x, y, { colors, n, speed: heavy ? 190 : 140, delay, life: 420, len: 7 });
  if (heavy) fx.hitStop(150, delay, 1.6);
}
// 線の 字
export function text(fx, str, x, y, o = {}) {
  fx.add({ kind: 'g2Text', str, x, y, keys: o.keys || null, size: o.size || 10, color: o.color, ink: o.ink, delay: o.delay || 0, life: o.life || 600, pop: o.pop, wave: o.wave });
}
// 道具の 絵
export function icon(fx, name, x, y, o = {}) {
  fx.add({ kind: 'g2Icon', icon: name, x, y, s: o.s || 1, keys: o.keys || null, delay: o.delay || 0, life: o.life || 600, vx: o.vx || 0, vy: o.vy || 0, g: o.g || 0, drag: o.drag, rot: o.rot, spin: o.spin, rkeys: o.rkeys, rease: o.rease, fin: o.fin, fout: o.fout, go: o.go, ease: o.ease, seed: Math.random() * 6 });
}
// ゴムの うで（b … ねもと、keys: [[ms, 先x, 先y, ふとさ]]）
export function arm(fx, b, keys, o = {}) {
  const last = keys[keys.length - 1];
  const far = keys.reduce((m, k) => (Math.hypot(k[1] - b.x, k[2] - b.y) > Math.hypot(m[1] - b.x, m[2] - b.y) ? k : m), keys[0]);
  fx.add({ kind: 'g2Arm', x: Math.max(-120, Math.min(376, far[1])), y: Math.max(-120, Math.min(264, far[2])), bx: b.x, by: b.y, keys, delay: o.delay || 0, life: o.life || last[0] + 40, style: o.style, hand: o.hand, leg: o.leg, sleeve: o.sleeve, wob: o.wob ?? 1, wobAt: o.wobAt || 0, bend: o.bend || 0, fist: o.fist, flame: o.flame, ease: o.ease, alpha: o.alpha });
}
// 花火（ひらく 線 ＋ おちる 火の粉）
export function firework(fx, x, y, o = {}) {
  const { r = 26, cols = ['#ff6a8a', '#ffd23a'], delay = 0, n = 18, sparks = 24 } = o;
  fx.add({ kind: 'g2Firework', x, y, r, cols, n, delay, life: 900 });
  fx.sparks(x, y, { colors: [...cols, '#ffffff'], n: sparks, speed: r * 4.5, delay, life: 760, g: 60, drag: 0.93, len: 5, size: 1 });
  fx.glow(x, y, { color: cols[0], r: r * 1.4, delay, life: 260, alpha: 0.8 });
}
// 赤い 電車（うごく）。keys: [[ms, x, y]]（あたま）。p.x・p.y は 画面の 中に
export function train(fx, keys, o = {}) {
  const mid = keys[Math.floor(keys.length / 2)];
  fx.add({ kind: 'g2Train', x: Math.max(-100, Math.min(356, mid[1])), y: Math.max(-100, Math.min(244, mid[2])), keys, cars: o.cars || 1, s: o.s || 1, ang: o.ang || 0, delay: o.delay || 0, life: o.life || 900, body: o.body, band: o.band, dark: o.dark, sign: o.sign, light: o.light, tail: o.tail, ease: o.ease, seed: Math.random() * 10 });
}
export { rnd };
