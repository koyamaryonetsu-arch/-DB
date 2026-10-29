// 第48回 G5（セーラームーン ＋ アナと雪の女王 ＋ アイドル）: 大きな え の つぶ（1つの つぶで 大きな 絵を かく）と べんりな どうぐ
// ・つぶの なまえは 'g5' で はじめる（AX_G5_FINE に まぜる）。どれも p.age（ms）で かく。x の globalAlpha・まぜかたは じぶんで きめて もどす
// ・G5 の え（axfx-g5-moon.js・axfx-g5-ice.js・axfx-g5-idol.js）が つかう
// ・画面の 文字は かかない（数字や Z も 線で かく）
import { softGlow, disc, rnd, lerp, clamp01, easeOut, easeIn, easeInOut, hash, mixHex } from './axkit.js?v=060276fb0270';
import { AX_BUDGET } from '../../shared/ax-time.js?v=060276fb0270';

const TAU = Math.PI * 2;
const env = (p, fin = 120, fout = 200) => clamp01(p.age / Math.max(1, fin)) * clamp01((p.life - p.age) / Math.max(1, fout));
const poly = (x, pts, close = true) => {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  if (close) x.closePath();
};
// いろの ならびの とちゅう（u … 0〜1）
export function grad(cols, u) {
  if (cols.length === 1) return cols[0];
  const s = clamp01(u) * (cols.length - 1);
  const i = Math.min(cols.length - 2, Math.floor(s));
  return mixHex(cols[i], cols[i + 1], s - i);
}
// とぶ つぶの いち（x0,y0 → x1,y1。cx,cy が あれば まがる。hop … 上に はねる）
function travelPos(p, age = p.age) {
  if (p.x1 === undefined || !(p.travel > 0)) return { x: p.x0 ?? p.x, y: p.y0 ?? p.y, e: 1, ang: p.ang0 || 0 };
  const raw = clamp01((age - (p.start || 0)) / p.travel);
  const e = p.ease === 'in' ? easeIn(raw) * 0.6 + raw * 0.4 : p.ease === 'lin' ? raw : raw * raw * (3 - 2 * raw) * 0.4 + raw * 0.6;
  const at = (k) => {
    if (p.cx !== undefined) {
      const u = 1 - k;
      return [u * u * p.x0 + 2 * u * k * p.cx + k * k * p.x1, u * u * p.y0 + 2 * u * k * p.cy + k * k * p.y1 - (p.hop || 0) * Math.sin(k * Math.PI)];
    }
    return [lerp(p.x0, p.x1, k), lerp(p.y0, p.y1, k) - (p.hop || 0) * Math.sin(k * Math.PI)];
  };
  const [px, py] = at(e);
  const [qx, qy] = at(Math.min(1, e + 0.02));
  const [rx, ry] = at(Math.max(0, e - 0.02));
  return { x: px, y: py, e, raw, ang: Math.atan2(qy - ry, qx - rx), at };
}

// ───────────── 小さな かたち（線で かく） ─────────────
export function heartPath(x, s) {
  x.beginPath();
  x.moveTo(0, s * 0.9);
  x.bezierCurveTo(-s * 1.4, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35);
  x.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.4, -s * 0.1, 0, s * 0.9);
  x.closePath();
}
function starPath(x, s, n = 5, inner = 0.45) {
  x.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i / (n * 2)) * TAU, r = i % 2 ? s * inner : s;
    i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
}
// 三日月（右に ひらく。thick … ふとさ 0〜1）
export function crescentPath(x, r, thick = 0.5) {
  x.beginPath();
  x.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, true);
  x.ellipse(0, 0, r * Math.max(0.05, 1 - thick), r, 0, Math.PI / 2, -Math.PI / 2, false);
  x.closePath();
}
function drawHeart(x, s, col, rim = '#ffffff', a = 1) {
  x.globalAlpha = a;
  x.fillStyle = col;
  heartPath(x, s);
  x.fill();
  if (rim) {
    x.strokeStyle = rim;
    x.lineWidth = Math.max(0.5, s * 0.14);
    x.stroke();
  }
  x.fillStyle = '#ffffff';
  x.globalAlpha = a * 0.8;
  x.beginPath(); x.ellipse(-s * 0.42, -s * 0.38, s * 0.22, s * 0.13, -0.6, 0, TAU); x.fill();
}
// 雪の けっしょう（大きい。grow 0〜1 で うでが のびる）
function drawFlake(x, s, grow, col, glow, w = 1) {
  const g = clamp01(grow);
  const arm = (lw, c, al) => {
    x.strokeStyle = c;
    x.globalAlpha = al;
    x.lineWidth = lw;
    x.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a);
      const L = s * g;
      x.moveTo(0, 0); x.lineTo(ca * L, sa * L);
      for (const [f, bl] of [[0.38, 0.32], [0.62, 0.26], [0.82, 0.16]]) {
        if (g < f) continue;
        const bx = ca * s * f, by = sa * s * f, b = s * bl * clamp01((g - f) / 0.2);
        for (const d of [-0.75, 0.75]) { x.moveTo(bx, by); x.lineTo(bx + Math.cos(a + d) * b, by + Math.sin(a + d) * b); }
      }
    }
    x.stroke();
  };
  x.lineCap = 'round';
  arm(Math.max(0.8, s * 0.16 * w), glow, 0.35);
  arm(Math.max(0.5, s * 0.07 * w), col, 0.95);
  // まん中の 6かく
  x.globalAlpha = 0.9;
  x.strokeStyle = '#ffffff';
  x.lineWidth = Math.max(0.4, s * 0.04);
  x.beginPath();
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; const r = s * 0.2 * g; i ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  x.stroke();
}
// 銀水晶（上から 見た ブリリアントカット。face … ひかる 面の ずれ）
function drawCrystal(x, s, col, edge, face, a = 1) {
  const n = 8;
  const outer = [], inner = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU - Math.PI / 2;
    outer.push([Math.cos(ang) * s, Math.sin(ang) * s]);
    inner.push([Math.cos(ang + Math.PI / n) * s * 0.52, Math.sin(ang + Math.PI / n) * s * 0.52]);
  }
  x.globalAlpha = a;
  x.fillStyle = col;
  poly(x, outer); x.fill();
  // 面（ひかりが まわる）
  for (let i = 0; i < n; i++) {
    const lit = 0.5 + 0.5 * Math.sin(face + i * 1.3);
    x.globalAlpha = a * (0.15 + 0.55 * lit);
    x.fillStyle = lit > 0.6 ? '#ffffff' : edge;
    poly(x, [outer[i], outer[(i + 1) % n], inner[i]]); x.fill();
  }
  x.globalAlpha = a * 0.9;
  x.fillStyle = '#ffffff';
  poly(x, inner); x.fill();
  x.globalAlpha = a;
  x.strokeStyle = edge;
  x.lineWidth = Math.max(0.4, s * 0.06);
  poly(x, outer); x.stroke();
  poly(x, inner); x.stroke();
  x.beginPath();
  for (let i = 0; i < n; i++) { x.moveTo(...outer[i]); x.lineTo(...inner[i]); x.moveTo(...outer[(i + 1) % n]); x.lineTo(...inner[i]); }
  x.stroke();
}
// 赤い バラ（あたま。s … 大きさ）
function drawRoseHead(x, s, col, dark, a = 1) {
  x.globalAlpha = a;
  disc(x, 0, 0, s, dark);
  for (let i = 0; i < 5; i++) {
    const ang = (i / 5) * TAU + 0.3;
    x.fillStyle = col;
    x.beginPath(); x.ellipse(Math.cos(ang) * s * 0.42, Math.sin(ang) * s * 0.42, s * 0.62, s * 0.5, ang, 0, TAU); x.fill();
  }
  x.strokeStyle = dark;
  x.lineWidth = Math.max(0.4, s * 0.14);
  x.beginPath();
  for (let k = 0; k <= 16; k++) { const ang = k * 0.75; const r = s * 0.08 + k * s * 0.035; k ? x.lineTo(Math.cos(ang) * r, Math.sin(ang) * r) : x.moveTo(Math.cos(ang) * r, Math.sin(ang) * r); }
  x.stroke();
  x.globalAlpha = a * 0.6;
  disc(x, -s * 0.35, -s * 0.35, s * 0.2, '#ffffff');
}
// くだもの（kind: cherry・banana・pine・straw・orange・grape・melon・peach・apple）
function drawFruit(x, kind, s) {
  const leaf = (lx, ly, ang, L = s * 0.5) => { x.fillStyle = '#4ac850'; x.beginPath(); x.ellipse(lx, ly, L, L * 0.38, ang, 0, TAU); x.fill(); };
  const shine = (hx, hy, r) => { x.globalAlpha *= 1; disc(x, hx, hy, r, 'rgba(255,255,255,0.75)'); };
  switch (kind) {
    case 'cherry': {
      x.strokeStyle = '#3a8a2a'; x.lineWidth = Math.max(0.6, s * 0.12);
      x.beginPath(); x.moveTo(-s * 0.5, s * 0.2); x.quadraticCurveTo(-s * 0.3, -s * 0.6, s * 0.05, -s * 1.0); x.moveTo(s * 0.55, s * 0.3); x.quadraticCurveTo(s * 0.4, -s * 0.5, s * 0.05, -s * 1.0); x.stroke();
      leaf(s * 0.35, -s * 0.95, -0.4, s * 0.4);
      disc(x, -s * 0.5, s * 0.45, s * 0.55, '#e0102a'); disc(x, s * 0.55, s * 0.55, s * 0.55, '#ff2a40');
      shine(-s * 0.68, s * 0.28, s * 0.14); shine(s * 0.38, s * 0.38, s * 0.14);
      break;
    }
    case 'banana': {
      x.fillStyle = '#ffe040';
      x.save(); x.rotate(-0.6); crescentPath(x, s * 1.05, 0.42); x.fill();
      x.strokeStyle = '#c8a020'; x.lineWidth = Math.max(0.4, s * 0.08); x.stroke(); x.restore();
      disc(x, Math.cos(-0.6 - Math.PI / 2) * s * 1.02, Math.sin(-0.6 - Math.PI / 2) * s * 1.02, s * 0.13, '#5a3a10');
      break;
    }
    case 'pine': {
      x.fillStyle = '#3ab84a';
      for (let i = -2; i <= 2; i++) poly(x, [[i * s * 0.18 - s * 0.12, -s * 0.55], [i * s * 0.32, -s * 1.35 + Math.abs(i) * s * 0.22], [i * s * 0.18 + s * 0.12, -s * 0.55]]), x.fill();
      x.fillStyle = '#ffc020';
      x.beginPath(); x.ellipse(0, s * 0.15, s * 0.62, s * 0.82, 0, 0, TAU); x.fill();
      x.strokeStyle = '#c87a10'; x.lineWidth = Math.max(0.4, s * 0.07);
      x.beginPath();
      for (let i = -3; i <= 3; i++) { x.moveTo(i * s * 0.25 - s * 0.5, -s * 0.6); x.lineTo(i * s * 0.25 + s * 0.5, s * 0.95); x.moveTo(i * s * 0.25 + s * 0.5, -s * 0.6); x.lineTo(i * s * 0.25 - s * 0.5, s * 0.95); }
      x.save(); x.beginPath(); x.ellipse(0, s * 0.15, s * 0.62, s * 0.82, 0, 0, TAU); x.clip();
      x.beginPath();
      for (let i = -3; i <= 3; i++) { x.moveTo(i * s * 0.25 - s * 0.5, -s * 0.6); x.lineTo(i * s * 0.25 + s * 0.5, s * 0.95); x.moveTo(i * s * 0.25 + s * 0.5, -s * 0.6); x.lineTo(i * s * 0.25 - s * 0.5, s * 0.95); }
      x.stroke(); x.restore();
      break;
    }
    case 'straw': {
      x.fillStyle = '#ff2a4a';
      x.beginPath(); x.moveTo(0, s * 1.0); x.bezierCurveTo(-s * 1.1, s * 0.1, -s * 0.8, -s * 0.7, 0, -s * 0.6); x.bezierCurveTo(s * 0.8, -s * 0.7, s * 1.1, s * 0.1, 0, s * 1.0); x.fill();
      for (let i = 0; i < 7; i++) disc(x, (hash(i * 3.1) - 0.5) * s * 1.0, (hash(i * 7.7) - 0.3) * s * 1.0, s * 0.07, '#ffe060');
      x.fillStyle = '#3ac850';
      for (let i = -1; i <= 1; i++) { x.beginPath(); x.ellipse(i * s * 0.28, -s * 0.66, s * 0.3, s * 0.12, i * 0.5, 0, TAU); x.fill(); }
      break;
    }
    case 'orange': {
      disc(x, 0, 0, s * 0.9, '#ff9a1a');
      x.strokeStyle = '#ffd08a'; x.lineWidth = Math.max(0.4, s * 0.07);
      x.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; x.moveTo(0, 0); x.lineTo(Math.cos(a) * s * 0.75, Math.sin(a) * s * 0.75); } x.stroke();
      leaf(s * 0.35, -s * 0.85, -0.5, s * 0.38);
      shine(-s * 0.35, -s * 0.35, s * 0.16);
      break;
    }
    case 'grape': {
      const g = [[0, -0.55], [-0.38, -0.3], [0.38, -0.3], [-0.2, 0.05], [0.2, 0.05], [0, 0.4], [-0.55, 0.05], [0.55, 0.05]];
      for (const [gx, gy] of g) { disc(x, gx * s, gy * s, s * 0.3, '#8a3ae0'); disc(x, gx * s - s * 0.09, gy * s - s * 0.09, s * 0.08, '#e0c8ff'); }
      leaf(s * 0.3, -s * 0.95, 0.4, s * 0.38);
      break;
    }
    case 'melon': {
      disc(x, 0, 0, s * 0.9, '#8ae05a');
      x.strokeStyle = '#d8ffb8'; x.lineWidth = Math.max(0.3, s * 0.05);
      x.beginPath(); for (let i = -2; i <= 2; i++) { x.moveTo(i * s * 0.3, -s * 0.85); x.quadraticCurveTo(i * s * 0.3 + s * 0.3, 0, i * s * 0.3, s * 0.85); } x.stroke();
      shine(-s * 0.35, -s * 0.35, s * 0.16);
      break;
    }
    case 'peach': {
      disc(x, 0, 0, s * 0.9, '#ffa8b8');
      disc(x, s * 0.2, s * 0.15, s * 0.6, '#ffc8c0');
      x.strokeStyle = '#e07890'; x.lineWidth = Math.max(0.4, s * 0.08);
      x.beginPath(); x.moveTo(0, -s * 0.85); x.quadraticCurveTo(-s * 0.3, 0, 0, s * 0.85); x.stroke();
      leaf(s * 0.35, -s * 0.85, -0.4, s * 0.4);
      break;
    }
    default: { // apple
      disc(x, -s * 0.28, 0, s * 0.7, '#ff2a2a'); disc(x, s * 0.28, 0, s * 0.7, '#ff2a2a');
      x.strokeStyle = '#6a3a10'; x.lineWidth = Math.max(0.5, s * 0.1); x.beginPath(); x.moveTo(0, -s * 0.5); x.lineTo(s * 0.1, -s * 1.0); x.stroke();
      leaf(s * 0.38, -s * 0.85, -0.4, s * 0.36);
      shine(-s * 0.45, -s * 0.3, s * 0.15);
    }
  }
}
export const FRUITS = ['cherry', 'banana', 'pine', 'straw', 'orange', 'grape', 'melon', 'peach', 'apple'];
export const FRUIT_COL = { cherry: '#ff2a40', banana: '#ffe040', pine: '#ffc020', straw: '#ff4a6a', orange: '#ff9a1a', grape: '#a85aff', melon: '#8ae05a', peach: '#ffa8b8', apple: '#ff3a3a' };

// 小さな しるし（kind: crown・hand・uchiwa・eye・wink・lips・mask・hat・z・one・globe・cat・note・sword・cane・arrowUp・arrowDown・cup）
function drawMark(x, kind, s, p) {
  const c1 = p.color || '#ffffff', c2 = p.color2 || '#ffd23a';
  x.lineCap = 'round'; x.lineJoin = 'round';
  switch (kind) {
    case 'crown': {
      x.fillStyle = '#ffd23a';
      poly(x, [[-s, s * 0.5], [-s, -s * 0.3], [-s * 0.5, s * 0.05], [0, -s * 0.7], [s * 0.5, s * 0.05], [s, -s * 0.3], [s, s * 0.5]]); x.fill();
      x.strokeStyle = '#fff6c8'; x.lineWidth = Math.max(0.4, s * 0.1); x.stroke();
      disc(x, 0, s * 0.18, s * 0.17, '#ff3a6a'); disc(x, -s * 0.55, s * 0.25, s * 0.12, '#4ab8ff'); disc(x, s * 0.55, s * 0.25, s * 0.12, '#4ab8ff');
      break;
    }
    case 'hand': {
      x.fillStyle = c1;
      x.beginPath(); x.ellipse(0, s * 0.25, s * 0.55, s * 0.6, 0, 0, TAU); x.fill();
      for (let i = 0; i < 4; i++) { const fx0 = -s * 0.42 + i * s * 0.28; x.beginPath(); x.ellipse(fx0, -s * 0.45 - (i === 1 || i === 2 ? s * 0.12 : 0), s * 0.12, s * 0.4, 0, 0, TAU); x.fill(); }
      x.beginPath(); x.ellipse(s * 0.65, s * 0.15, s * 0.13, s * 0.36, -0.9, 0, TAU); x.fill();
      x.strokeStyle = c2; x.lineWidth = Math.max(0.4, s * 0.08);
      x.beginPath(); x.ellipse(0, s * 0.25, s * 0.55, s * 0.6, 0, 0, TAU); x.stroke();
      break;
    }
    case 'uchiwa': {
      x.strokeStyle = '#e8e8e8'; x.lineWidth = Math.max(0.6, s * 0.14);
      x.beginPath(); x.moveTo(0, s * 0.6); x.lineTo(0, s * 1.4); x.stroke();
      disc(x, 0, 0, s * 0.85, c1);
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, s * 0.1);
      x.beginPath(); x.arc(0, 0, s * 0.85, 0, TAU); x.stroke();
      x.save(); x.translate(0, s * 0.05); x.fillStyle = '#ffffff'; heartPath(x, s * 0.42); x.fill(); x.restore();
      break;
    }
    case 'eye': case 'wink': {
      const open = kind === 'wink' ? Math.abs(Math.cos(clamp01(p.age / Math.max(1, p.life * 0.5)) * Math.PI)) : 1;
      x.fillStyle = '#ffffff';
      x.beginPath(); x.ellipse(0, 0, s, s * 0.55 * open + 0.3, 0, 0, TAU); x.fill();
      if (open > 0.3) { disc(x, 0, 0, s * 0.42 * open, c1); disc(x, s * 0.12, -s * 0.12, s * 0.14 * open, '#ffffff'); }
      x.strokeStyle = '#1a1a2a'; x.lineWidth = Math.max(0.5, s * 0.12);
      x.beginPath(); x.ellipse(0, 0, s, s * 0.55 * open + 0.3, 0, Math.PI, TAU); x.stroke();
      for (let i = -1; i <= 1; i++) { x.beginPath(); x.moveTo(i * s * 0.5, -s * 0.5 * open - 0.3); x.lineTo(i * s * 0.75, -s * (0.5 * open + 0.45)); x.stroke(); }
      break;
    }
    case 'lips': {
      x.fillStyle = '#ff3a7a';
      x.beginPath(); x.moveTo(-s, 0); x.quadraticCurveTo(-s * 0.5, -s * 0.7, 0, -s * 0.25); x.quadraticCurveTo(s * 0.5, -s * 0.7, s, 0); x.quadraticCurveTo(0, s * 0.8, -s, 0); x.fill();
      x.strokeStyle = '#a01a4a'; x.lineWidth = Math.max(0.4, s * 0.08); x.beginPath(); x.moveTo(-s * 0.9, 0); x.quadraticCurveTo(0, s * 0.15, s * 0.9, 0); x.stroke();
      disc(x, -s * 0.35, -s * 0.25, s * 0.12, '#ffd0e0');
      break;
    }
    case 'mask': {
      x.fillStyle = '#ffffff';
      x.beginPath(); x.moveTo(-s, -s * 0.2); x.quadraticCurveTo(-s * 0.5, -s * 0.6, 0, -s * 0.2); x.quadraticCurveTo(s * 0.5, -s * 0.6, s, -s * 0.2); x.quadraticCurveTo(s * 0.8, s * 0.5, s * 0.2, s * 0.25); x.quadraticCurveTo(0, s * 0.1, -s * 0.2, s * 0.25); x.quadraticCurveTo(-s * 0.8, s * 0.5, -s, -s * 0.2); x.fill();
      x.fillStyle = '#1a1a2a';
      x.beginPath(); x.ellipse(-s * 0.45, -s * 0.02, s * 0.22, s * 0.12, 0.2, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(s * 0.45, -s * 0.02, s * 0.22, s * 0.12, -0.2, 0, TAU); x.fill();
      break;
    }
    case 'hat': {
      x.fillStyle = '#14141e';
      x.fillRect(-s * 0.55, -s * 1.1, s * 1.1, s * 1.1);
      x.beginPath(); x.ellipse(0, 0, s * 1.05, s * 0.25, 0, 0, TAU); x.fill();
      x.fillStyle = '#c81a3a'; x.fillRect(-s * 0.55, -s * 0.35, s * 1.1, s * 0.22);
      x.strokeStyle = '#8a8aa8'; x.lineWidth = Math.max(0.3, s * 0.06); x.strokeRect(-s * 0.55, -s * 1.1, s * 1.1, s * 1.1);
      break;
    }
    case 'z': {
      x.strokeStyle = c1; x.lineWidth = Math.max(0.6, s * 0.22);
      poly(x, [[-s * 0.5, -s * 0.5], [s * 0.5, -s * 0.5], [-s * 0.5, s * 0.5], [s * 0.5, s * 0.5]], false); x.stroke();
      break;
    }
    case 'one': {
      x.fillStyle = '#ffd23a'; x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, s * 0.1);
      poly(x, [[-s * 0.35, -s * 0.55], [s * 0.12, -s], [s * 0.12, s * 0.75], [s * 0.42, s * 0.75], [s * 0.42, s], [-s * 0.42, s], [-s * 0.42, s * 0.75], [-s * 0.12, s * 0.75], [-s * 0.12, -s * 0.5], [-s * 0.35, -s * 0.3]]);
      x.fill(); x.stroke();
      break;
    }
    case 'globe': {
      disc(x, 0, 0, s, '#2a7ae8');
      x.fillStyle = '#4ad870';
      x.save(); x.beginPath(); x.arc(0, 0, s, 0, TAU); x.clip();
      const sh = (p.age || 0) / 900;
      for (const [bx, by, br] of [[-0.3, -0.3, 0.38], [0.35, 0.25, 0.3], [0.1, -0.55, 0.2], [-0.45, 0.4, 0.22]]) {
        const xx = ((bx + sh + 1.5) % 2.4) - 1.2;
        x.beginPath(); x.ellipse(xx * s, by * s, br * s, br * s * 0.7, 0.4, 0, TAU); x.fill();
      }
      x.restore();
      x.strokeStyle = '#bfe6ff'; x.lineWidth = Math.max(0.5, s * 0.07);
      x.beginPath(); x.arc(0, 0, s, 0, TAU); x.stroke();
      disc(x, -s * 0.4, -s * 0.4, s * 0.2, 'rgba(255,255,255,0.6)');
      break;
    }
    case 'cat': {
      // 黒ねこ（ひたいに 金の 三日月）
      x.fillStyle = '#16121e';
      x.beginPath(); x.ellipse(0, s * 0.35, s * 0.75, s * 0.5, 0, 0, TAU); x.fill();
      disc(x, s * 0.55, -s * 0.25, s * 0.45, '#16121e');
      poly(x, [[s * 0.2, -s * 0.45], [s * 0.3, -s * 0.95], [s * 0.55, -s * 0.6]]); x.fill();
      poly(x, [[s * 0.6, -s * 0.62], [s * 0.85, -s * 0.95], [s * 0.92, -s * 0.45]]); x.fill();
      x.strokeStyle = '#16121e'; x.lineWidth = Math.max(0.6, s * 0.16);
      x.beginPath(); x.moveTo(-s * 0.7, s * 0.3); x.quadraticCurveTo(-s * 1.3, s * 0.1 + Math.sin((p.age || 0) / 120) * s * 0.2, -s * 1.1, -s * 0.5); x.stroke();
      x.strokeStyle = '#3a3050'; x.lineWidth = Math.max(0.3, s * 0.06);
      x.beginPath(); x.ellipse(0, s * 0.35, s * 0.75, s * 0.5, 0, 0, TAU); x.stroke();
      x.save(); x.translate(s * 0.55, -s * 0.48); x.rotate(-0.4); x.fillStyle = '#ffd23a'; crescentPath(x, s * 0.17, 0.6); x.fill(); x.restore();
      disc(x, s * 0.4, -s * 0.22, s * 0.08, '#ffd23a'); disc(x, s * 0.72, -s * 0.22, s * 0.08, '#ffd23a');
      break;
    }
    case 'note': {
      x.fillStyle = c1;
      x.beginPath(); x.ellipse(-s * 0.35, s * 0.6, s * 0.38, s * 0.28, -0.4, 0, TAU); x.fill();
      x.beginPath(); x.ellipse(s * 0.55, s * 0.45, s * 0.38, s * 0.28, -0.4, 0, TAU); x.fill();
      x.fillRect(-s * 0.05, -s * 0.8, s * 0.15, s * 1.4); x.fillRect(s * 0.85, -s * 0.95, s * 0.15, s * 1.4);
      poly(x, [[-s * 0.05, -s * 0.8], [s * 1.0, -s * 0.95], [s * 1.0, -s * 0.7], [-s * 0.05, -s * 0.55]]); x.fill();
      break;
    }
    case 'sword': {
      // 金の 剣（上むき）
      x.fillStyle = '#fff6d0';
      poly(x, [[0, -s * 2.2], [s * 0.22, -s * 1.9], [s * 0.22, 0], [-s * 0.22, 0], [-s * 0.22, -s * 1.9]]); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(-s * 0.05, -s * 1.95, s * 0.1, s * 1.9);
      x.fillStyle = '#ffd23a'; x.fillRect(-s * 0.7, 0, s * 1.4, s * 0.22);
      x.fillStyle = '#a06a0a'; x.fillRect(-s * 0.12, s * 0.22, s * 0.24, s * 0.7);
      disc(x, 0, s * 1.02, s * 0.2, '#ffd23a'); disc(x, 0, s * 0.11, s * 0.12, '#4ab8ff');
      break;
    }
    case 'cane': {
      x.strokeStyle = '#14141e'; x.lineWidth = Math.max(0.6, s * 0.2);
      x.beginPath(); x.moveTo(0, s * 1.6); x.lineTo(0, -s * 1.2); x.stroke();
      x.strokeStyle = '#e8e8f8'; x.lineWidth = Math.max(0.5, s * 0.16);
      x.beginPath(); x.moveTo(0, -s * 1.2); x.lineTo(0, -s * 1.6); x.stroke();
      disc(x, 0, -s * 1.65, s * 0.22, '#ffffff');
      break;
    }
    case 'arrowUp': case 'arrowDown': {
      const d = kind === 'arrowUp' ? -1 : 1;
      x.fillStyle = c1;
      poly(x, [[0, d * s], [s * 0.8, 0], [s * 0.32, 0], [s * 0.32, -d * s], [-s * 0.32, -d * s], [-s * 0.32, 0], [-s * 0.8, 0]]); x.fill();
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.4, s * 0.1); x.stroke();
      break;
    }
    case 'cup': {
      // ジュースの グラス（7色の しま・ストロー）
      const cols = p.cols || ['#ff4a6a', '#ff9a1a', '#ffe040', '#8ae05a', '#4ab8ff', '#a85aff', '#ff8ad8'];
      const top = -s, bot = s, wt = s * 0.75, wb = s * 0.5;
      x.save();
      poly(x, [[-wt, top], [wt, top], [wb, bot], [-wb, bot]]); x.clip();
      const fill = p.fill ?? 1;
      for (let i = 0; i < cols.length; i++) {
        const y0 = bot - (i + 1) * (2 * s / cols.length) * fill;
        x.fillStyle = cols[i]; x.fillRect(-wt, y0, wt * 2, (2 * s / cols.length) * fill + 0.5);
      }
      x.restore();
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, s * 0.08);
      poly(x, [[-wt, top], [wt, top], [wb, bot], [-wb, bot]]); x.stroke();
      x.strokeStyle = '#ff6aa8'; x.lineWidth = Math.max(0.5, s * 0.1);
      x.beginPath(); x.moveTo(s * 0.2, s * 0.3); x.lineTo(s * 0.45, -s * 1.3); x.lineTo(s * 0.8, -s * 1.5); x.stroke();
      disc(x, -s * 0.5, top, s * 0.25, '#ff9a1a');
      break;
    }
    case 'crescent': {
      x.rotate(p.crot ?? -0.5);
      x.fillStyle = c1; crescentPath(x, s, p.thick ?? 0.5); x.fill();
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.4, s * 0.08); x.stroke();
      break;
    }
    case 'boot': {
      x.fillStyle = c1 === '#ffffff' ? '#e8143a' : c1;
      poly(x, [[-s * 0.35, -s], [s * 0.25, -s], [s * 0.3, s * 0.35], [s * 1.0, s * 0.55], [s * 1.0, s * 0.8], [-s * 0.4, s * 0.8]]); x.fill();
      x.fillStyle = '#ffffff'; x.fillRect(-s * 0.4, -s, s * 0.7, s * 0.18);
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.4, s * 0.08); x.stroke();
      break;
    }
    case 'basket': {
      x.strokeStyle = '#8a5a2a'; x.lineWidth = Math.max(0.6, s * 0.14);
      x.beginPath(); x.arc(0, -s * 0.1, s * 0.85, Math.PI, TAU); x.stroke();
      x.fillStyle = '#c88a4a';
      poly(x, [[-s, -s * 0.1], [s, -s * 0.1], [s * 0.75, s * 0.8], [-s * 0.75, s * 0.8]]); x.fill();
      x.strokeStyle = '#8a5a2a'; x.lineWidth = Math.max(0.4, s * 0.07);
      x.beginPath();
      for (let i = 0; i < 4; i++) { const yy = -s * 0.1 + i * s * 0.25; x.moveTo(-s + i * s * 0.07, yy); x.lineTo(s - i * s * 0.07, yy); }
      for (let i = -3; i <= 3; i++) { x.moveTo(i * s * 0.28, -s * 0.1); x.lineTo(i * s * 0.21, s * 0.8); }
      x.stroke();
      break;
    }
    case 'rose': drawRoseHead(x, s, c1 === '#ffffff' ? '#e8143a' : c1, p.dark || '#8a0a24', x.globalAlpha); break;
    case 'feather': {
      x.fillStyle = c1;
      x.beginPath(); x.ellipse(0, 0, s * 0.35, s, 0.3, 0, TAU); x.fill();
      x.strokeStyle = c2 === '#ffd23a' ? '#d8e0f0' : c2; x.lineWidth = Math.max(0.3, s * 0.08);
      x.beginPath(); x.moveTo(-s * 0.3, s * 1.1); x.lineTo(s * 0.3, -s * 0.95); x.stroke();
      break;
    }
    default: {
      x.fillStyle = c1; starPath(x, s); x.fill();
      if (p.rim) { x.strokeStyle = p.rim; x.lineWidth = Math.max(0.4, s * 0.1); x.stroke(); }
    }
  }
}

// ───────────── はいけい（画面いっぱい。うすく かさねる） ─────────────
const SKY = {
  night: ['#03041a', '#0c1440', '#1c2458', '#2a2a5a'],
  moon: ['#07031a', '#1c1040', '#3a2058', '#5a3068'],
  stage: ['#080214', '#1a0628', '#2a0a38', '#3a1040'],
  snow: ['#020c24', '#06204a', '#0e3a66', '#1a5080'],
  sea: ['#01060e', '#04182c', '#0a2a44', '#0e3a58'],
  dawn: ['#0c1a50', '#5a3a8a', '#ff8ab0', '#ffd27a'],
  sky: ['#1a4ac8', '#4a8ae8', '#9ad0ff', '#ffe8a0'],
  storm: ['#04040c', '#0e0e22', '#1a1a34', '#26263e'],
  tropical: ['#ff8ac8', '#ffb0a0', '#ffd88a', '#8ae8ff'],
  cosmos: ['#05020e', '#160a30', '#2a1050', '#100820'],
};
const STAR_N = 46;
export const AX_G5_FINE_KIT = {
  // はいけい（style: night・moon・stage・snow・sea・dawn・sky・storm・tropical・cosmos）
  g5Sky(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = p.a * env(p, p.fin || 200, p.fout || 300);
    if (a <= 0) return;
    let cols = p.cols || SKY[p.style] || SKY.night;
    if (p.to) { const k = easeInOut(clamp01(p.age / (p.life * 0.7))); const to = SKY[p.to] || p.to; cols = cols.map((c, i) => mixHex(c, to[Math.min(i, to.length - 1)], k)); }
    x.save();
    x.globalCompositeOperation = 'source-over';
    const n = 18, bh = (H + 16) / n;
    x.globalAlpha = a;
    for (let i = 0; i < n; i++) { const y0 = Math.round(-8 + i * bh), y1 = Math.round(-8 + (i + 1) * bh); x.fillStyle = grad(cols, i / (n - 1)); x.fillRect(-8, y0, W + 16, y1 - y0); }
    x.globalCompositeOperation = 'lighter';
    const st = p.style;
    if (st === 'night' || st === 'moon' || st === 'snow' || st === 'cosmos') {
      for (let i = 0; i < STAR_N; i++) {
        const sx = hash(i * 3.7 + 1) * W, sy = hash(i * 9.1 + 2) * H * 0.75;
        const tw = 0.5 + 0.5 * Math.sin(p.age / (120 + 60 * hash(i)) + i);
        x.globalAlpha = a * (0.35 + 0.65 * tw);
        x.fillStyle = i % 5 ? '#ffffff' : '#ffe8a0';
        const s = 0.5 + hash(i * 5.3) * 0.9;
        x.fillRect(sx - s / 2, sy - s / 2, s, s);
        if (i % 7 === 0) { x.fillRect(sx - s * 2, sy - 0.25, s * 4, 0.5); x.fillRect(sx - 0.25, sy - s * 2, 0.5, s * 4); }
      }
    }
    if (st === 'snow') {
      // オーロラ（ゆらめく 3本の 帯）
      for (const [k, col] of [[0, '#5affb8'], [1, '#7ad8ff'], [2, '#ff8ad8']]) {
        x.globalAlpha = a * 0.22;
        x.fillStyle = col;
        x.beginPath();
        for (let xx = -8; xx <= W + 8; xx += 8) { const yy = 18 + k * 12 + Math.sin(xx / 34 + p.age / 700 + k * 2) * 9; xx === -8 ? x.moveTo(xx, yy) : x.lineTo(xx, yy); }
        for (let xx = W + 8; xx >= -8; xx -= 8) { const yy = 18 + k * 12 + Math.sin(xx / 34 + p.age / 700 + k * 2) * 9 + 14 + Math.sin(xx / 20 + k) * 6; x.lineTo(xx, yy); }
        x.closePath(); x.fill();
      }
      // ふる 雪
      x.fillStyle = '#ffffff';
      for (let i = 0; i < 34; i++) {
        const sx = (hash(i * 4.1) * W + Math.sin(p.age / 400 + i) * 6) % W;
        const sy = ((hash(i * 2.3) * H + p.age * (0.02 + hash(i) * 0.03)) % (H + 8)) - 4;
        x.globalAlpha = a * 0.75;
        x.fillRect(sx, sy, 1.2, 1.2);
      }
    }
    if (st === 'stage' || st === 'storm' || st === 'tropical') {
      // ステージの 光の はしら（上から ゆれる）
      const cs = p.lights || ['#ff7ad8', '#7ad8ff', '#ffe066', '#9aff8a', '#c08aff'];
      for (let i = 0; i < 6; i++) {
        const bx = (i + 0.5) * (W / 6), ang = Math.sin(p.age / 360 + i * 1.7) * 0.45;
        const ex = bx + Math.sin(ang) * H * 1.1;
        x.globalAlpha = a * 0.16;
        x.fillStyle = cs[i % cs.length];
        poly(x, [[bx - 2, -4], [bx + 2, -4], [ex + 14, H + 4], [ex - 14, H + 4]]); x.fill();
      }
      x.globalAlpha = a * 0.5;
      x.fillStyle = st === 'tropical' ? '#ffffff' : '#ff7ad8';
      x.fillRect(-8, H - 6, W + 16, 1);
    }
    if (st === 'storm') {
      // 雷雲
      x.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 14; i++) { const cx0 = i * 20 - 6 + Math.sin(p.age / 600 + i) * 5, cy0 = -2 + (i % 3) * 5; x.globalAlpha = a * 0.75; x.fillStyle = i % 2 ? '#16162a' : '#202036'; x.beginPath(); x.ellipse(cx0, cy0, 22, 9 + (i % 2) * 3, 0, 0, TAU); x.fill(); }
      x.globalAlpha = a * 0.35; x.fillStyle = '#4a4a6a'; for (let i = 0; i < 14; i++) { x.beginPath(); x.ellipse(i * 20 + 2, 9 + (i % 3) * 4, 12, 2, 0, 0, TAU); x.fill(); }
      x.globalCompositeOperation = 'lighter';
    }
    if (st === 'tropical') {
      // ヤシの 葉の かげ（すみに）
      x.globalCompositeOperation = 'source-over';
      x.fillStyle = '#1a5a3a';
      for (const [cx0, dir] of [[0, 1], [W, -1]]) {
        for (let k = 0; k < 5; k++) {
          const ang = (dir > 0 ? 0.1 : Math.PI - 0.1) + dir * (k * 0.32 - 0.2) + Math.sin(p.age / 300 + k) * 0.05;
          x.globalAlpha = a * 0.75;
          x.save(); x.translate(cx0, -4); x.rotate(ang); x.beginPath(); x.ellipse(28, 0, 30, 5, 0.25 * dir, 0, TAU); x.fill(); x.restore();
        }
      }
      x.globalCompositeOperation = 'lighter';
    }
    if (st === 'sea') {
      x.strokeStyle = '#4a8ab8';
      x.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        x.globalAlpha = a * 0.4;
        x.beginPath();
        for (let xx = -8; xx <= W + 8; xx += 6) { const yy = H * 0.55 + k * 11 + Math.sin(xx / 16 + p.age / 200 + k) * 2.5; xx === -8 ? x.moveTo(xx, yy) : x.lineTo(xx, yy); }
        x.stroke();
      }
    }
    if (st === 'dawn' || st === 'sky') {
      const k = st === 'dawn' ? easeOut(clamp01(p.age / (p.life * 0.7))) : 1;
      const sy = lerp(H + 10, H * 0.62, k);
      softGlow(x, W / 2, sy, 90, '#ffe08a', a * 0.7);
      x.globalAlpha = a * 0.9;
      disc(x, W / 2, sy, 16, '#fff6d0');
      x.globalAlpha = a * 0.3;
      x.strokeStyle = '#fff0a0';
      x.lineWidth = 2;
      x.beginPath();
      for (let i = 0; i < 12; i++) { const an = Math.PI + (i / 11) * Math.PI + p.age / 3000; x.moveTo(W / 2 + Math.cos(an) * 22, sy + Math.sin(an) * 22); x.lineTo(W / 2 + Math.cos(an) * 160, sy + Math.sin(an) * 160); }
      x.stroke();
    }
    x.restore();
  },
  // 月（phase: 'full' 満月 / 'crescent' 三日月）。rise … 下から のぼる ms
  g5Moon(x, p) {
    const a = env(p, 160, 260) * (p.alpha ?? 1);
    if (a <= 0) return;
    const k = p.rise ? easeOut(clamp01(p.age / p.rise)) : 1;
    const cx = p.x, cy = lerp(p.y + (p.dy ?? 30), p.y, k);
    const r = p.r * (0.7 + 0.3 * k) * (1 + 0.02 * Math.sin(p.age / 160));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, r * 2.6, p.glow || '#fff0c0', a * 0.35);
    softGlow(x, cx, cy, r * 1.45, p.glow || '#fff0c0', a * 0.4);
    x.globalCompositeOperation = 'source-over';
    x.translate(cx, cy);
    x.rotate(p.rot || 0);
    x.globalAlpha = a;
    x.fillStyle = p.color || '#fff6dc';
    if (p.phase === 'crescent') { crescentPath(x, r, p.thick ?? 0.55); x.fill(); }
    else {
      disc(x, 0, 0, r, p.color || '#fff6dc');
      x.globalAlpha = a * 0.16;
      for (const [mx, my, mr] of [[-0.3, -0.2, 0.22], [0.25, 0.25, 0.16], [0.35, -0.35, 0.1], [-0.15, 0.4, 0.12]]) disc(x, mx * r, my * r, mr * r, p.dark || '#c8a870');
    }
    x.restore();
  },
  // ティアラ → 光の 円ばん（start まで ひたいで ひかる → x1,y1 へ まわりながら とぶ。back … もどる）
  g5Tiara(x, p) {
    const a = env(p, 80, 160);
    if (a <= 0) return;
    const T = travelPos(p);
    let px = T.x, py = T.y;
    if (p.back && p.age > (p.start || 0) + p.travel) {
      const u = clamp01((p.age - p.start - p.travel - (p.hold || 0)) / p.back);
      const e = easeInOut(u);
      px = lerp(p.x1, p.x0, e); py = lerp(p.y1, p.y0, e) + Math.sin(e * Math.PI) * 18;
    }
    const r = p.r * (p.age < (p.start || 0) ? 0.6 + 0.4 * clamp01(p.age / Math.max(1, p.start)) : 1);
    const spin = p.age / 34;
    x.save();
    x.globalCompositeOperation = 'lighter';
    // うしろの ざんぞう
    if (T.e > 0 && T.e < 1 && T.at) {
      for (let i = 5; i >= 1; i--) {
        const [qx, qy] = T.at(Math.max(0, T.e - i * 0.045));
        x.globalAlpha = a * 0.13 * (6 - i);
        x.fillStyle = p.color;
        x.beginPath(); x.ellipse(qx, qy, r * (1 - i * 0.08), r * 0.42 * (1 - i * 0.08), p.tilt || 0, 0, TAU); x.fill();
      }
    }
    softGlow(x, px, py, r * 2.2, p.glow, a * 0.5);
    x.translate(px, py);
    x.rotate(p.tilt || 0);
    const pre = p.age < (p.start || 0);
    const dark = p.edge || mixHex(p.color, '#3a2000', 0.45);
    if (pre) {
      // ひたいの ティアラ（金の 帯 ＋ まん中が とがる ＋ 赤い 石）
      const k = clamp01(p.age / Math.max(1, p.start));
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a;
      x.lineCap = 'round';
      x.strokeStyle = dark; x.lineWidth = Math.max(1, r * 0.34);
      x.beginPath(); x.moveTo(-r, r * 0.25); x.quadraticCurveTo(0, -r * 0.15, r, r * 0.25); x.stroke();
      x.strokeStyle = p.color; x.lineWidth = Math.max(0.8, r * 0.22);
      x.beginPath(); x.moveTo(-r, r * 0.25); x.quadraticCurveTo(0, -r * 0.15, r, r * 0.25); x.stroke();
      x.fillStyle = p.color;
      poly(x, [[-r * 0.35, r * 0.05], [0, -r * 0.7], [r * 0.35, r * 0.05]]); x.fill();
      x.strokeStyle = dark; x.lineWidth = 0.6; x.stroke();
      disc(x, 0, -r * 0.12, r * 0.2, p.gem || '#ff3a5a');
      x.globalCompositeOperation = 'lighter';
      softGlow(x, 0, -r * 0.1, r * (1 + k * 1.6), '#ffffff', a * k);
      x.restore();
      return;
    }
    // 光の 輪（まわる 円ばん。ふちは こく、まん中は すける）
    const sq = 0.38 + 0.14 * Math.sin(spin * 0.5);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.35;
    x.fillStyle = p.core || '#fffbe8';
    x.beginPath(); x.ellipse(0, 0, r, r * sq, 0, 0, TAU); x.fill();
    x.globalAlpha = a;
    x.strokeStyle = dark; x.lineWidth = Math.max(1.2, r * 0.42);
    x.beginPath(); x.ellipse(0, 0, r * 0.85, r * sq * 0.85, 0, 0, TAU); x.stroke();
    x.strokeStyle = p.color; x.lineWidth = Math.max(1, r * 0.3);
    x.beginPath(); x.ellipse(0, 0, r * 0.85, r * sq * 0.85, 0, 0, TAU); x.stroke();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, r * 0.1);
    x.beginPath(); x.ellipse(0, 0, r * 0.85, r * sq * 0.85, 0, spin, spin + 2.2); x.stroke();
    // ふちの まわる ひかり
    for (let i = 0; i < 3; i++) {
      const an = spin + (i / 3) * TAU;
      disc(x, Math.cos(an) * r * 0.85, Math.sin(an) * r * sq * 0.85, Math.max(0.6, r * 0.14), '#ffffff');
    }
    x.restore();
  },
  // バラ（くきが すすむ むき。x0,y0 → x1,y1。stick … ついたら ささった まま）
  g5Rose(x, p) {
    const a = env(p, 60, 200);
    if (a <= 0) return;
    const T = travelPos(p);
    const ang = p.stickAng !== undefined && T.e >= 1 ? p.stickAng : T.ang + (p.spin ? p.age / 1000 * p.spin : 0);
    const s = p.s;
    x.save();
    x.globalCompositeOperation = 'lighter';
    if (T.e < 1 && T.at) {
      x.strokeStyle = p.trail || '#ff6a8a';
      x.lineWidth = s * 0.6;
      x.globalAlpha = a * 0.35;
      x.beginPath();
      for (let k = 0; k <= 8; k++) { const [qx, qy] = T.at(Math.max(0, T.e - 0.25 + k * 0.031)); k ? x.lineTo(qx, qy) : x.moveTo(qx, qy); }
      x.stroke();
    }
    softGlow(x, T.x, T.y, s * 3.6, p.glow || '#ff4a6a', a * 0.6);
    x.globalCompositeOperation = 'source-over';
    x.translate(T.x, T.y);
    x.rotate(ang);
    // くき（まえ）と は
    x.globalAlpha = a;
    x.strokeStyle = '#2a8a3a';
    x.lineWidth = Math.max(0.6, s * 0.28);
    x.beginPath(); x.moveTo(-s * 0.4, 0); x.lineTo(s * 3.2, 0); x.stroke();
    x.fillStyle = '#3aa84a';
    x.beginPath(); x.ellipse(s * 1.4, -s * 0.5, s * 0.6, s * 0.25, -0.5, 0, TAU); x.fill();
    // あたま（うしろ）
    x.translate(-s * 0.6, 0);
    drawRoseHead(x, s, p.col || '#e8143a', p.dark || '#8a0a24', a);
    x.restore();
  },
  // つえ・ステッキ・剣（variant: moon・heart・cane・sword・crystal）。pop して ひかる
  g5Wand(x, p) {
    const a = env(p, 100, 220);
    if (a <= 0) return;
    const s = p.s * (0.5 + 0.5 * easeOut(clamp01(p.age / 220)));
    const T = travelPos(p);
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, T.x, T.y - s * 1.8, s * 2.6, p.glow || '#ffe08a', a * 0.4);
    x.translate(T.x, T.y);
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    const v = p.variant || 'moon';
    if (v === 'cane') drawMark(x, 'cane', s, p);
    else if (v === 'sword') drawMark(x, 'sword', s * 1.1, p);
    else {
      // え（ピンクと 白）
      x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.8, s * 0.32);
      x.beginPath(); x.moveTo(0, s * 1.8); x.lineTo(0, -s * 0.6); x.stroke();
      x.strokeStyle = v === 'crystal' ? '#c8d8ff' : '#ff8ad0'; x.lineWidth = Math.max(0.5, s * 0.18);
      x.beginPath(); x.moveTo(0, s * 1.8); x.lineTo(0, -s * 0.6); x.stroke();
      disc(x, 0, s * 1.85, s * 0.22, '#ffd23a');
      if (v === 'moon') {
        x.save(); x.translate(0, -s * 1.35); x.rotate(-Math.PI / 2); x.fillStyle = '#ffd23a'; crescentPath(x, s * 0.85, 0.5); x.fill(); x.strokeStyle = '#fff6c8'; x.lineWidth = Math.max(0.4, s * 0.08); x.stroke(); x.restore();
        disc(x, 0, -s * 0.85, s * 0.28, '#ff3a6a');
      } else if (v === 'heart') {
        x.save(); x.translate(0, -s * 1.25); x.fillStyle = '#ff6ab8'; heartPath(x, s * 0.75); x.fill(); x.strokeStyle = '#ffd23a'; x.lineWidth = Math.max(0.4, s * 0.12); x.stroke(); x.restore();
        x.fillStyle = '#ffffff';
        for (const d of [-1, 1]) { x.beginPath(); x.ellipse(d * s * 0.85, -s * 1.3, s * 0.45, s * 0.2, d * 0.5, 0, TAU); x.fill(); }
      } else if (v === 'crystal') {
        x.save(); x.translate(0, -s * 1.3); drawCrystal(x, s * 0.7, '#e8f0ff', '#9ab8ff', p.age / 120, a); x.restore();
      }
    }
    x.restore();
    if (p.glint !== false) {
      const g = clamp01((p.age - 140) / 160);
      if (g > 0 && g < 1) {
        x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.sin(g * Math.PI) * a; x.fillStyle = '#ffffff';
        const gx = T.x, gy = T.y - s * 1.5;
        x.fillRect(gx - 10 * s / 4, gy - 0.5, 20 * s / 4, 1); x.fillRect(gx - 0.5, gy - 10 * s / 4, 1, 20 * s / 4);
        x.restore();
      }
    }
  },
  // 銀水晶（gold … 金の クリスタル）
  g5Crystal(x, p) {
    const a = env(p, 140, 240);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s * (0.4 + 0.6 * easeOut(clamp01(p.age / (p.grow || 300)))) * (1 + 0.04 * Math.sin(p.age / 90));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, T.x, T.y, s * 4.2, p.glow || '#d8e8ff', a * 0.75);
    // 光の すじ（十字＋ななめ）
    x.globalAlpha = a * 0.6;
    x.fillStyle = '#ffffff';
    const L = s * (3 + Math.sin(p.age / 70));
    x.save(); x.translate(T.x, T.y); x.rotate(p.age / 2000);
    for (let i = 0; i < 4; i++) { x.rotate(Math.PI / 4); x.fillRect(-L * (i % 2 ? 0.6 : 1), -0.5, L * 2 * (i % 2 ? 0.6 : 1), 1); }
    x.restore();
    x.globalCompositeOperation = 'source-over';
    x.translate(T.x, T.y);
    x.scale(1, p.sy ?? 1);
    drawCrystal(x, s, p.col || '#eef4ff', p.edge || '#8aa8ff', p.age / 110, a);
    x.restore();
  },
  // 宮殿・城の かげ（style: moon 白銀の 宮殿 / ice 氷の 城 / crystal クリスタルの 塔 / gold）。x … まん中、y … じめん、grow … たちあがる ms
  g5Palace(x, p) {
    const a = env(p, 100, 320) * (p.alpha ?? 1);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const st = p.style || 'moon';
    const W = p.w, H = p.h * k;
    const fill = p.fill || (st === 'ice' ? '#bfeaff' : st === 'gold' ? '#ffe8a0' : st === 'crystal' ? '#d8e8ff' : '#e8ecff');
    const edge = p.edge || (st === 'ice' ? '#ffffff' : st === 'gold' ? '#fff6d0' : '#ffffff');
    const towers = st === 'ice'
      ? [[0, 0.16, 1, 'spike'], [-0.17, 0.11, 0.78, 'spike'], [0.17, 0.11, 0.78, 'spike'], [-0.32, 0.1, 0.6, 'spike'], [0.32, 0.1, 0.6, 'spike'], [-0.45, 0.08, 0.4, 'spike'], [0.45, 0.08, 0.4, 'spike'], [-0.08, 0.06, 0.88, 'spike'], [0.08, 0.06, 0.88, 'spike']]
      : st === 'crystal'
        ? [[0, 0.12, 1, 'spike'], [-0.14, 0.1, 0.8, 'spike'], [0.14, 0.1, 0.8, 'spike'], [-0.28, 0.08, 0.62, 'spike'], [0.28, 0.08, 0.62, 'spike'], [-0.42, 0.07, 0.45, 'spike'], [0.42, 0.07, 0.45, 'spike']]
        : [[0, 0.14, 1, 'dome'], [-0.17, 0.08, 0.74, 'spire'], [0.17, 0.08, 0.74, 'spire'], [-0.31, 0.08, 0.56, 'dome'], [0.31, 0.08, 0.56, 'dome'], [-0.44, 0.06, 0.4, 'spire'], [0.44, 0.06, 0.4, 'spire']];
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y - H * 0.5, Math.max(W, H) * 0.8, p.glow || '#c8e0ff', a * 0.55);
    x.globalCompositeOperation = 'source-over';
    const shapes = [];
    for (const [dx, tw, th, roof] of towers) {
      const cx = p.x + dx * W, hw = tw * W / 2, top = p.y - th * H;
      if (roof === 'spike') shapes.push([[cx - hw, p.y], [cx - hw, top + hw * 1.2], [cx - hw * 0.4, top + hw * 0.4], [cx, top - hw * 1.6], [cx + hw * 0.4, top + hw * 0.4], [cx + hw, top + hw * 1.2], [cx + hw, p.y]]);
      else if (roof === 'spire') shapes.push([[cx - hw, p.y], [cx - hw, top], [cx, top - hw * 3], [cx + hw, top], [cx + hw, p.y]]);
      else {
        const pts = [[cx - hw, p.y], [cx - hw, top]];
        for (let i = 0; i <= 8; i++) { const an = Math.PI + (i / 8) * Math.PI; pts.push([cx + Math.cos(an) * hw, top + Math.sin(an) * hw * 1.2]); }
        pts.push([cx + hw, top], [cx + hw, p.y]);
        shapes.push(pts);
        shapes.push([[cx - 0.6, top - hw * 1.2], [cx, top - hw * 1.2 - hw * 1.6], [cx + 0.6, top - hw * 1.2]]);
      }
    }
    // かべ
    if (st === 'moon' || st === 'gold') shapes.push([[p.x - W * 0.48, p.y], [p.x - W * 0.48, p.y - H * 0.22], [p.x + W * 0.48, p.y - H * 0.22], [p.x + W * 0.48, p.y]]);
    x.globalAlpha = a * (p.solid ?? 0.78);
    x.fillStyle = fill;
    for (const s of shapes) { poly(x, s); x.fill(); }
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.strokeStyle = edge;
    x.lineWidth = 0.8;
    for (const s of shapes) { poly(x, s); x.stroke(); }
    // まど・かがやき
    x.fillStyle = st === 'ice' ? '#ffffff' : '#fff6c8';
    for (let i = 0; i < 14; i++) {
      const wx = p.x + (hash(i * 3.3 + p.seed) - 0.5) * W * 0.8, wy = p.y - hash(i * 5.1 + p.seed) * H * 0.7 - 3;
      x.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(p.age / 150 + i)));
      x.fillRect(wx - 0.6, wy - 1, 1.2, 2);
    }
    // 氷の すじ
    if (st === 'ice' || st === 'crystal') {
      x.globalAlpha = a * 0.5;
      x.strokeStyle = '#ffffff';
      x.beginPath();
      for (const [dx, tw, th] of towers) { const cx = p.x + dx * W; x.moveTo(cx, p.y); x.lineTo(cx, p.y - th * H - tw * W * 0.6); }
      x.stroke();
    }
    // 上へ はしる ひかり
    const sweep = clamp01((p.age - p.grow * 0.6) / 500);
    if (sweep > 0 && sweep < 1) {
      x.globalAlpha = a * 0.3 * Math.sin(sweep * Math.PI);
      x.fillStyle = '#ffffff';
      x.fillRect(p.x - W * 0.42, p.y - H * sweep - 1, W * 0.84, 2);
    }
    x.restore();
  },
  // リボン（cx, cy から 上へ らせん。cols … [おもて, うら]、turns … まわる かず）
  g5Ribbon(x, p) {
    const a = env(p, 80, 220);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.grow || 400)));
    const tail = Math.max(0, e - (p.len ?? 0.7));
    const N = 36;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const s = tail + (e - tail) * (i / N);
      const an = s * p.turns * TAU + p.age / (p.spinMs || 220) + (p.phase || 0);
      const rr = p.r * (1 - (p.taper ?? 0.3) * s);
      const px = p.x + Math.cos(an) * rr, py = p.y - s * p.h + Math.sin(an) * rr * (p.flat ?? 0.35);
      if (prev) {
        const front = Math.sin(an) > 0;
        x.globalAlpha = a * (front ? 0.95 : 0.55) * (0.3 + 0.7 * (i / N));
        x.strokeStyle = front ? p.cols[0] : p.cols[1];
        x.lineWidth = Math.max(0.4, p.w * (0.35 + 0.65 * Math.abs(Math.cos(an * 0.5 + p.age / 300))));
        x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(px, py); x.stroke();
      }
      prev = [px, py];
    }
    if (prev) softGlow(x, prev[0], prev[1], p.w * 3, p.cols[0], a * 0.8);
    x.restore();
  },
  // リボンの 帯（2点を むすぶ。ねじれる）
  g5Link(x, p) {
    const a = env(p, 80, 220);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.grow || 300)));
    const N = 24;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    let prev = null;
    for (let i = 0; i <= N; i++) {
      const s = (i / N) * e;
      const u = 1 - s;
      const mx = (p.x0 + p.x1) / 2, my = Math.min(p.y0, p.y1) - (p.bow ?? 24);
      const px = u * u * p.x0 + 2 * u * s * mx + s * s * p.x1, py = u * u * p.y0 + 2 * u * s * my + s * s * p.y1 + Math.sin(s * 9 + p.age / 120) * 2;
      if (prev) {
        const tw = Math.cos(s * 10 - p.age / 140);
        x.globalAlpha = a * (tw > 0 ? 0.95 : 0.6);
        x.strokeStyle = tw > 0 ? p.col : mixHex(p.col, '#ffffff', 0.5);
        x.lineWidth = Math.max(0.4, p.w * (0.3 + 0.7 * Math.abs(tw)));
        x.beginPath(); x.moveTo(prev[0], prev[1]); x.lineTo(px, py); x.stroke();
      }
      prev = [px, py];
    }
    x.restore();
  },
  // 光の 大波（下から 上へ。cols … 3まいの 色）
  g5Wave(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = env(p, 80, p.fout || 300);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.travel)));
    x.save();
    const yAt = (xx, front, k) => front + Math.sin(xx / (p.wl || 18) + p.age / 90 + k * 1.7) * p.amp + Math.sin(xx / 7 - p.age / 60 + k) * 1.5;
    // からだ（すける いろ。うしろの 敵が 見える）
    p.cols.forEach((col, k) => {
      const front = lerp(p.y0, p.y1, e) + k * (p.gap ?? 9);
      x.globalCompositeOperation = p.solid ? 'source-over' : 'lighter';
      x.globalAlpha = p.solid ? a * p.solid * (k ? 0.6 : 1) : a * (p.alpha ?? 0.2) * 0.42;
      x.fillStyle = p.solid && k ? col : p.body || col;
      x.beginPath();
      x.moveTo(-8, H + 8);
      for (let xx = -8; xx <= W + 8; xx += 6) x.lineTo(xx, yAt(xx, front, k));
      x.lineTo(W + 8, H + 8);
      x.closePath();
      x.fill();
    });
    // ひかる なみがしら（いろの 線 ＋ 白い しん）
    x.globalCompositeOperation = 'lighter';
    p.cols.forEach((col, k) => {
      const front = lerp(p.y0, p.y1, e) + k * (p.gap ?? 9);
      for (const [lw, c2, al] of [[3.2, col, 0.55], [1.2, '#ffffff', 0.95]]) {
        x.globalAlpha = a * al * (k ? 0.75 : 1);
        x.strokeStyle = c2;
        x.lineWidth = lw;
        x.beginPath();
        for (let xx = -8; xx <= W + 8; xx += 6) { const yy = yAt(xx, front, k); xx === -8 ? x.moveTo(xx, yy) : x.lineTo(xx, yy); }
        x.stroke();
      }
      // なみがしらの きらきら
      for (let i = 0; i < 10; i++) {
        const xx = ((hash(i * 7.3 + k) * W + p.age * 0.06 * (k % 2 ? -1 : 1)) % (W + 16)) - 8;
        const yy = yAt(xx, front, k);
        const tw = 0.5 + 0.5 * Math.sin(p.age / 70 + i * 2);
        x.globalAlpha = a * tw;
        x.fillStyle = '#ffffff';
        x.fillRect(xx - 3 * tw, yy - 0.4, 6 * tw, 0.8);
        x.fillRect(xx - 0.4, yy - 3 * tw, 0.8, 6 * tw);
      }
    });
    x.restore();
  },
  // 光の カーテン（上から おりる たての すじ。月光・オーロラ）
  g5Curtain(x, p, t, fx) {
    const W = fx?.W || 256, H = fx?.H || 144;
    const a = env(p, 120, 320);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / Math.max(1, p.grow || 400)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    const n = p.n || 16;
    for (let i = 0; i < n; i++) {
      const cx = (p.x0 ?? 0) + (i + 0.5) * ((p.w ?? W) / n) + Math.sin(p.age / 400 + i * 1.3) * 5;
      const len = H * (p.reach ?? 1) * e * (0.7 + 0.3 * hash(i * 2.7));
      const wv = 3 + hash(i) * 5;
      x.globalAlpha = a * (0.12 + 0.18 * (0.5 + 0.5 * Math.sin(p.age / 160 + i * 2.1)));
      x.fillStyle = p.cols[i % p.cols.length];
      poly(x, [[cx - wv, -6], [cx + wv, -6], [cx + wv * 0.4, len], [cx - wv * 0.4, len]]); x.fill();
    }
    x.restore();
  },
  // 大きな ハート（x0,y0 → x1,y1 へ とぶ・pop・どきどき）
  g5Heart(x, p) {
    const a = env(p, 60, p.fout || 180);
    if (a <= 0) return;
    const T = travelPos(p);
    const pop = p.pop === false ? 1 : 0.3 + 0.7 * easeOut(clamp01(p.age / 160));
    const beat = 1 + (p.beat ?? 0.1) * Math.max(0, Math.sin(p.age / 70));
    const s = p.s * pop * beat * (p.grow ? 1 + clamp01((p.age - (p.growAt || 0)) / p.grow) * (p.growTo || 1) : 1);
    x.save();
    x.globalCompositeOperation = 'lighter';
    if (T.e > 0 && T.e < 1 && T.at) {
      for (let i = 4; i >= 1; i--) {
        const [qx, qy] = T.at(Math.max(0, T.e - i * 0.06));
        x.globalAlpha = a * 0.12 * (5 - i);
        x.save(); x.translate(qx, qy); x.fillStyle = p.col; heartPath(x, s * (1 - i * 0.1)); x.fill(); x.restore();
      }
    }
    softGlow(x, T.x, T.y, s * 3, p.glow || p.col, a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.translate(T.x, T.y);
    x.rotate(p.rot || 0);
    drawHeart(x, s, p.col, p.rim ?? '#ffffff', a);
    x.restore();
  },
  // ハートの わ（r0 → r1 に ひろがる n この ハート）
  g5HeartRing(x, p) {
    const a = env(p, 60, 220);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / p.life));
    const r = lerp(p.r0, p.r1, e);
    x.save();
    x.globalCompositeOperation = 'source-over';
    for (let i = 0; i < p.n; i++) {
      const an = (i / p.n) * TAU + p.age / (p.spinMs || 900);
      x.save(); x.translate(p.x + Math.cos(an) * r, p.y + Math.sin(an) * r * (p.sy ?? 0.8));
      drawHeart(x, p.s * (1 - e * 0.3), p.cols[i % p.cols.length], '#ffffff', a);
      x.restore();
    }
    x.restore();
  },
  // ハートの ビーム（x0,y0 → x1,y1。ハートが ながれる）
  g5HeartBeam(x, p) {
    const a = env(p, 60, 220);
    if (a <= 0) return;
    const L = Math.hypot(p.x1 - p.x0, p.y1 - p.y0) || 1;
    const head = L * easeOut(clamp01(p.age / Math.max(1, p.grow)));
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    x.save();
    x.translate(p.x0, p.y0);
    x.rotate(ang);
    const gap = p.gap || 11;
    const off = (p.age * 0.12) % gap;
    for (let s = off; s < head; s += gap) {
      const k = s / L;
      const sz = p.s * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, k * 1.2 + 0.1)));
      x.save(); x.translate(s, Math.sin(s / 9 + p.age / 80) * 1.5); x.rotate(Math.PI / 2);
      drawHeart(x, sz, p.cols[Math.floor(s / gap) % p.cols.length], '#ffffff', a);
      x.restore();
    }
    x.restore();
  },
  // スポットライト（上 x0,y0 から 下 x1,y1 へ。sway … ゆれ）
  g5Spot(x, p) {
    const a = env(p, 120, 220) * (p.alpha ?? 1);
    if (a <= 0) return;
    const sw = (p.sway || 0) * Math.sin(p.age / (p.swayMs || 300) + (p.phase || 0));
    const ex = p.x1 + sw * 60, ey = p.y1;
    const w = p.w;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.fillStyle = p.col;
    x.globalAlpha = a * 0.2;
    poly(x, [[p.x0 - 2, p.y0], [p.x0 + 2, p.y0], [ex + w, ey], [ex - w, ey]]); x.fill();
    x.globalAlpha = a * 0.22;
    poly(x, [[p.x0 - 1, p.y0], [p.x0 + 1, p.y0], [ex + w * 0.45, ey], [ex - w * 0.45, ey]]); x.fill();
    x.globalAlpha = a * 0.5;
    x.beginPath(); x.ellipse(ex, ey, w, w * 0.28, 0, 0, TAU); x.fill();
    softGlow(x, p.x0, p.y0 + 2, 8, '#ffffff', a);
    x.restore();
  },
  // ペンライトの 海（y … ならぶ 高さ。cols … 色）
  g5Penlights(x, p, t, fx) {
    const W = fx?.W || 256;
    const a = env(p, 160, 260);
    if (a <= 0) return;
    const n = p.n || 30;
    x.save();
    x.lineCap = 'round';
    const rows = p.rows || 1;
    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < n; i++) {
        const bx = (i + 0.5 + (r % 2) * 0.5) * (W / n), by = p.y + r * 7;
        const ang = Math.sin(p.age / (p.tempo || 160) + i * 0.35 + r) * 0.55;
        const tx = bx + Math.sin(ang) * 10, ty = by - Math.cos(ang) * 10;
        const col = p.cols[(i + r * 2) % p.cols.length];
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = a;
        x.strokeStyle = '#2a2a3a'; x.lineWidth = 1.4;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(lerp(bx, tx, 0.4), lerp(by, ty, 0.4)); x.stroke();
        x.globalCompositeOperation = 'lighter';
        x.strokeStyle = col; x.lineWidth = 1.8;
        x.beginPath(); x.moveTo(lerp(bx, tx, 0.4), lerp(by, ty, 0.4)); x.lineTo(tx, ty); x.stroke();
        softGlow(x, tx, ty, 5, col, a * 0.8);
      }
    }
    x.restore();
  },
  // ドームの やね（画面の 上の 大きな 弧・ほねぐみ・ライトの つぶ）
  g5Dome(x, p, t, fx) {
    const W = fx?.W || 256;
    const a = env(p, 160, 260);
    if (a <= 0) return;
    const e = easeOut(clamp01(p.age / 400));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.strokeStyle = p.col || '#c8b8ff';
    x.globalAlpha = a * 0.7;
    x.lineWidth = 1.6;
    const cx = W / 2, cy = 120, rx = 170, ry = 112 + (1 - e) * 30;
    x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, Math.PI, TAU); x.stroke();
    x.globalAlpha = a * 0.35;
    x.lineWidth = 0.8;
    x.beginPath(); x.ellipse(cx, cy, rx * 0.8, ry * 0.85, 0, Math.PI, TAU); x.stroke();
    x.beginPath();
    for (let i = 1; i < 10; i++) { const an = Math.PI + (i / 10) * Math.PI; x.moveTo(cx + Math.cos(an) * rx, cy + Math.sin(an) * ry); x.lineTo(cx + Math.cos(an) * rx * 0.8, cy + Math.sin(an) * ry * 0.85); }
    x.stroke();
    for (let i = 0; i < 22; i++) {
      const an = Math.PI + ((i + 0.5) / 22) * Math.PI;
      const lx = cx + Math.cos(an) * rx * 0.9, ly = cy + Math.sin(an) * ry * 0.92;
      if (ly > 140) continue;
      const on = 0.4 + 0.6 * Math.abs(Math.sin(p.age / 120 + i * 0.7));
      softGlow(x, lx, ly, 4, p.cols[i % p.cols.length], a * on);
    }
    x.restore();
  },
  // レーザー（x0,y0 から ang0 → ang1 へ ふる）
  g5Laser(x, p) {
    const a = env(p, 60, 160);
    if (a <= 0) return;
    const e = easeInOut(clamp01(p.age / p.life));
    const ang = lerp(p.ang0, p.ang1, e);
    const L = p.len || 220;
    const ex = p.x + Math.cos(ang) * L, ey = p.y + Math.sin(ang) * L;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.lineCap = 'round';
    for (const [w, col, al] of [[p.w * 3, p.col, 0.25], [p.w, p.col, 0.9], [p.w * 0.4, '#ffffff', 1]]) {
      x.globalAlpha = a * al; x.strokeStyle = col; x.lineWidth = Math.max(0.4, w);
      x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(ex, ey); x.stroke();
    }
    softGlow(x, p.x, p.y, p.w * 4, p.col, a);
    x.restore();
  },
  // くだもの（x0,y0 → x1,y1 へ。tail … 流れ星の しっぽ）
  g5Fruit(x, p) {
    const a = env(p, 50, p.fout || 160);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s * (p.pop ? 0.3 + 0.7 * easeOut(clamp01(p.age / 160)) : 1);
    x.save();
    x.globalCompositeOperation = 'lighter';
    if (p.tail && T.e > 0 && T.e < 1 && T.at) {
      const [tx, ty] = T.at(Math.max(0, T.e - 0.3));
      x.strokeStyle = p.tail;
      x.lineCap = 'round';
      for (const [w, al] of [[s * 2.2, 0.25], [s * 1.1, 0.5], [s * 0.4, 0.9]]) {
        x.globalAlpha = a * al; x.lineWidth = w;
        x.beginPath(); x.moveTo(tx, ty); x.lineTo(T.x, T.y); x.stroke();
      }
      softGlow(x, T.x, T.y, s * 3, p.tail, a * 0.8);
    }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(T.x, T.y);
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000);
    drawFruit(x, p.fruit, s);
    x.restore();
  },
  // しるし（drawMark の kind。x0,y0 → x1,y1。float … ふわふわ）
  g5Mark(x, p) {
    const a = env(p, 60, p.fout || 180) * (p.alpha ?? 1);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s * (p.pop === false ? 1 : 0.3 + 0.7 * easeOut(clamp01(p.age / 180)));
    x.save();
    if (p.glow) { x.globalCompositeOperation = 'lighter'; softGlow(x, T.x, T.y, s * 2.6, p.glow, a * 0.7); }
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(T.x, T.y + (p.float ? Math.sin(p.age / 140) * p.float : 0));
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000 + (p.wobble ? Math.sin(p.age / 90) * p.wobble : 0));
    if (p.flip) x.scale(-1, 1);
    drawMark(x, p.mark, s, p);
    x.restore();
  },
  // 大きな 雪の けっしょう（grow … のびる ms）
  g5Flake(x, p) {
    const a = env(p, 80, p.fout || 220);
    if (a <= 0) return;
    const T = travelPos(p);
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow || 300)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, T.x, T.y, p.s * 1.8, p.glow || '#9ae6ff', a * 0.6);
    x.translate(T.x, T.y);
    x.rotate((p.rot || 0) + (p.spin || 0) * p.age / 1000);
    x.scale(1, p.sy ?? 1);
    x.globalAlpha = a;
    drawFlake(x, p.s, g, p.col || '#ffffff', p.glow || '#9ae6ff', p.lw || 1);
    x.restore();
  },
  // せいれいの しるし（kind: wind・fire・water・earth・five。ひし形の わく）
  g5Sigil(x, p) {
    const a = env(p, 100, 240);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s * (0.4 + 0.6 * easeOut(clamp01(p.age / 260)));
    const col = p.col;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, T.x, T.y, s * 2.3, col, a * 0.5);
    x.translate(T.x, T.y);
    x.lineCap = 'round'; x.lineJoin = 'round';
    // こい 色の ひしがたの わく（中の もようが 見える ように）
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.85;
    x.fillStyle = /^#[0-9a-f]{6}$/i.test(col) ? mixHex(col, '#060818', 0.6) : '#101828';
    poly(x, [[0, -s], [s * 0.8, 0], [0, s], [-s * 0.8, 0]]); x.fill();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.strokeStyle = col;
    x.lineWidth = Math.max(0.8, s * 0.16);
    poly(x, [[0, -s], [s * 0.8, 0], [0, s], [-s * 0.8, 0]]); x.stroke();
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(0.5, s * 0.06);
    poly(x, [[0, -s], [s * 0.8, 0], [0, s], [-s * 0.8, 0]]); x.stroke();
    x.strokeStyle = p.sigil === 'five' ? '#ffffff' : mixHex(col, '#ffffff', 0.55);
    x.lineWidth = Math.max(0.7, s * 0.13);
    const k = s * 0.45;
    x.beginPath();
    switch (p.sigil) {
      case 'wind': for (let i = 0; i <= 20; i++) { const an = i * 0.55 + p.age / 300; const r = k * (i / 20); i ? x.lineTo(Math.cos(an) * r, Math.sin(an) * r) : x.moveTo(0, 0); } break;
      case 'fire': x.moveTo(0, -k * 1.1); x.quadraticCurveTo(k * 0.9, -k * 0.1, k * 0.4, k * 0.8); x.quadraticCurveTo(0, k * 1.0, -k * 0.4, k * 0.8); x.quadraticCurveTo(-k * 0.9, -k * 0.1, 0, -k * 1.1); x.moveTo(0, -k * 0.2); x.quadraticCurveTo(k * 0.3, k * 0.3, 0, k * 0.7); break;
      case 'water': for (let r = -1; r <= 1; r++) { for (let i = 0; i <= 10; i++) { const xx = -k + (i / 10) * k * 2, yy = r * k * 0.5 + Math.sin(i * 0.9 + p.age / 150) * k * 0.18; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } } break;
      case 'earth': x.moveTo(-k, k * 0.6); x.lineTo(-k * 0.3, -k * 0.6); x.lineTo(0, -k * 0.1); x.lineTo(k * 0.35, -k * 0.8); x.lineTo(k, k * 0.6); x.closePath(); break;
      default: for (let i = 0; i < 4; i++) { const an = (i / 4) * Math.PI; x.moveTo(Math.cos(an) * k, Math.sin(an) * k); x.lineTo(-Math.cos(an) * k, -Math.sin(an) * k); }
    }
    x.stroke();
    x.restore();
  },
  // つらら（x0,y0 → x1,y1 へ おちる）
  g5Icicle(x, p) {
    const a = env(p, 40, 120);
    if (a <= 0) return;
    const T = travelPos(p);
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    x.save();
    x.translate(T.x, T.y);
    x.rotate(ang);
    x.globalCompositeOperation = 'lighter';
    if (T.e < 1) { x.globalAlpha = a * 0.35; x.strokeStyle = '#bfeaff'; x.lineWidth = p.w * 0.8; x.beginPath(); x.moveTo(-p.len * 2.2, 0); x.lineTo(-p.len * 0.5, 0); x.stroke(); }
    softGlow(x, 0, 0, p.len * 0.9, '#9ae6ff', a * 0.45);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.92;
    x.fillStyle = p.col || '#d8f4ff';
    poly(x, [[p.len * 0.5, 0], [-p.len * 0.5, -p.w], [-p.len * 0.62, 0], [-p.len * 0.5, p.w]]); x.fill();
    x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(p.len * 0.5, 0); x.lineTo(-p.len * 0.55, -p.w * 0.3); x.stroke();
    x.restore();
  },
  // 氷の はしら・かけらの むれ（x … まん中、y … じめん。n … ほん数、w … はば、h … 高さ）
  g5Shards(x, p) {
    const a = env(p, 60, p.fout || 260);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow || 160)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y - p.h * 0.4 * g, Math.min(p.w * 1.2, 46), '#9ae6ff', a * 0.5);
    x.globalCompositeOperation = 'source-over';
    const n = p.n || 5;
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) - 0.5 : 0;
      const bx = p.x + u * p.w, hw = (p.w / n) * 0.7 * (0.8 + hash(p.seed + i) * 0.5);
      const hh = p.h * g * (0.55 + 0.45 * Math.cos(u * 2.4)) * (0.8 + 0.4 * hash(p.seed + i * 3));
      const tilt = u * (p.fan ?? 0.6);
      x.save(); x.translate(bx, p.y); x.rotate(tilt);
      x.globalAlpha = a * 0.85;
      x.fillStyle = i % 2 ? (p.col || '#bfeaff') : (p.col2 || '#e6f8ff');
      poly(x, [[-hw, 0], [-hw * 0.7, -hh * 0.75], [0, -hh], [hw * 0.7, -hh * 0.72], [hw, 0]]); x.fill();
      x.globalAlpha = a;
      x.strokeStyle = '#ffffff'; x.lineWidth = 0.6;
      x.beginPath(); x.moveTo(0, -hh); x.lineTo(-hw * 0.2, 0); x.moveTo(-hw * 0.7, -hh * 0.75); x.lineTo(0, -hh * 0.4); x.stroke();
      x.restore();
    }
    x.restore();
  },
  // 雪だるま（x, y … じめん。wave … 手を ふる、hug … ぎゅっ）
  g5Snowman(x, p) {
    const a = env(p, 120, 240);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 300));
    const s = p.s * rise;
    const sq = 1 + 0.06 * Math.sin(p.age / 90);
    x.save();
    x.translate(p.x, p.y);
    x.scale(1 / sq, sq);
    x.globalAlpha = a;
    const balls = [[0, -s * 0.9, s * 0.95], [0, -s * 2.3, s * 0.7], [0, -s * 3.4, s * 0.55]];
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 2, s * 3.2, '#bfeaff', a * 0.5);
    x.globalCompositeOperation = 'source-over';
    // うで（えだ）
    const wave = Math.sin(p.age / 110) * 0.5;
    x.strokeStyle = '#7a4a1a'; x.lineWidth = Math.max(0.6, s * 0.14);
    for (const d of [-1, 1]) {
      const an = d < 0 ? Math.PI + 0.5 + wave : -0.5 - wave;
      const sx = d * s * 0.6, sy = -s * 2.4, ex = sx + Math.cos(an) * s * 1.5, ey = sy + Math.sin(an) * s * 1.5;
      x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.moveTo(lerp(sx, ex, 0.7), lerp(sy, ey, 0.7)); x.lineTo(lerp(sx, ex, 0.7) + d * s * 0.3, lerp(sy, ey, 0.7) - s * 0.35); x.stroke();
    }
    for (const [bx, by, br] of balls) { disc(x, bx, by, br, '#ffffff'); x.strokeStyle = '#9ad0f0'; x.lineWidth = Math.max(0.4, s * 0.06); x.beginPath(); x.arc(bx, by, br, 0, TAU); x.stroke(); }
    disc(x, -s * 0.2, -s * 3.5, s * 0.08, '#1a1a2a'); disc(x, s * 0.2, -s * 3.5, s * 0.08, '#1a1a2a');
    x.fillStyle = '#ff8a1a';
    poly(x, [[0, -s * 3.4], [s * 0.7, -s * 3.3], [0, -s * 3.25]]); x.fill();
    x.strokeStyle = '#1a1a2a'; x.lineWidth = Math.max(0.4, s * 0.06);
    x.beginPath(); x.arc(0, -s * 3.3, s * 0.25, 0.3, Math.PI - 0.3); x.stroke();
    disc(x, 0, -s * 2.3, s * 0.08, '#1a1a2a'); disc(x, 0, -s * 2.0, s * 0.08, '#1a1a2a');
    x.restore();
  },
  // 雪の 大男（x, y … じめん。smash … うでを ふりおろす 時間）
  g5Giant(x, p) {
    const a = env(p, 160, 280);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 360));
    const s = p.s;
    const swing = clamp01((p.age - p.smash + 180) / 180);
    const armAng = lerp(-2.4, 0.3, easeIn(swing));
    x.save();
    x.translate(p.x, p.y + (1 - rise) * s * 6);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 3, s * 5, '#9ae6ff', a * 0.5);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a * 0.92;
    // からだ
    x.fillStyle = '#e8f6ff';
    x.beginPath(); x.ellipse(0, -s * 2.2, s * 2.2, s * 2.3, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(0, -s * 4.6, s * 1.2, s * 1.0, 0, 0, TAU); x.fill();
    // こおりの とげ
    x.fillStyle = '#9ad8ff';
    for (let i = 0; i < 7; i++) { const an = Math.PI + 0.25 + (i / 6) * (Math.PI - 0.5); const bx = Math.cos(an) * s * 1.1, by = -s * 4.6 + Math.sin(an) * s * 0.9; poly(x, [[bx - s * 0.25, by + s * 0.2], [bx + Math.cos(an) * s * 0.9, by + Math.sin(an) * s * 0.9], [bx + s * 0.25, by + s * 0.2]]); x.fill(); }
    for (const d of [-1, 1]) poly(x, [[d * s * 1.6, -s * 3.4], [d * s * 2.6, -s * 4.4], [d * s * 2.0, -s * 3.0]]), x.fill();
    // あし
    x.fillStyle = '#d0ecff';
    x.fillRect(-s * 1.4, -s * 0.6, s * 0.9, s * 0.6); x.fillRect(s * 0.5, -s * 0.6, s * 0.9, s * 0.6);
    // 目（あおく ひかる。こわく ない まるい 目）
    x.globalCompositeOperation = 'lighter';
    softGlow(x, -s * 0.45, -s * 4.6, s * 0.7, '#4ab8ff', a);
    softGlow(x, s * 0.45, -s * 4.6, s * 0.7, '#4ab8ff', a);
    x.globalCompositeOperation = 'source-over';
    disc(x, -s * 0.45, -s * 4.6, s * 0.18, '#2a6ab0'); disc(x, s * 0.45, -s * 4.6, s * 0.18, '#2a6ab0');
    // うで（ふりおろす）
    x.save(); x.translate(s * 1.8, -s * 3.2); x.rotate(armAng);
    x.fillStyle = '#e8f6ff';
    x.beginPath(); x.ellipse(s * 1.4, 0, s * 1.6, s * 0.6, 0, 0, TAU); x.fill();
    disc(x, s * 3, 0, s * 0.85, '#ffffff');
    x.strokeStyle = '#9ad8ff'; x.lineWidth = 0.8; x.beginPath(); x.ellipse(s * 1.4, 0, s * 1.6, s * 0.6, 0, 0, TAU); x.stroke();
    x.restore();
    x.save(); x.translate(-s * 1.8, -s * 3.2); x.rotate(Math.PI - 0.5 + Math.sin(p.age / 200) * 0.1);
    x.fillStyle = '#e8f6ff'; x.beginPath(); x.ellipse(s * 1.2, 0, s * 1.4, s * 0.55, 0, 0, TAU); x.fill();
    x.restore();
    x.strokeStyle = '#9ad8ff'; x.lineWidth = 0.8;
    x.beginPath(); x.ellipse(0, -s * 2.2, s * 2.2, s * 2.3, 0, 0, TAU); x.stroke();
    x.restore();
  },
  // 水の 馬（x0 → x1 を かける。y … じめん、dir … むき）
  g5Horse(x, p) {
    const a = env(p, 140, 260);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s;
    const dir = p.x1 >= p.x0 ? 1 : -1;
    const run = p.age / 70;
    const bob = Math.sin(run * 2) * s * 0.05;
    x.save();
    x.translate(T.x, T.y + bob);
    x.scale(dir, 1);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 0.2, s * 1.4, '#4ab8ff', a * 0.6);
    x.globalAlpha = a * 0.55;
    x.fillStyle = p.col || '#4a9aff';
    const body = () => {
      x.beginPath(); x.ellipse(0, 0, s * 0.5, s * 0.22, 0, 0, TAU); x.fill();
      poly(x, [[s * 0.28, -s * 0.12], [s * 0.55, -s * 0.62], [s * 0.72, -s * 0.58], [s * 0.48, s * 0.05]]); x.fill();
      x.beginPath(); x.ellipse(s * 0.72, -s * 0.6, s * 0.2, s * 0.09, 0.55, 0, TAU); x.fill();
    };
    body();
    x.strokeStyle = p.col || '#4a9aff';
    x.lineWidth = s * 0.1;
    x.lineCap = 'round';
    for (const [lx, ph] of [[-0.35, 0], [-0.22, 1.6], [0.25, 3.1], [0.38, 4.7]]) {
      const sw = Math.sin(run + ph) * 0.6;
      x.beginPath(); x.moveTo(lx * s, s * 0.12); x.lineTo(lx * s + Math.sin(sw) * s * 0.4, s * 0.12 + Math.cos(sw) * s * 0.42); x.stroke();
    }
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff';
    x.lineWidth = Math.max(0.6, s * 0.035);
    x.beginPath(); x.ellipse(0, 0, s * 0.5, s * 0.22, 0, Math.PI, TAU); x.stroke();
    // たてがみ・しっぽ（白い しぶき）
    x.lineWidth = Math.max(0.6, s * 0.05);
    x.beginPath();
    for (let i = 0; i < 5; i++) { const mx = s * (0.38 + i * 0.07), my = -s * (0.25 + i * 0.08); x.moveTo(mx, my); x.lineTo(mx - s * 0.25, my - s * 0.08 + Math.sin(run + i) * s * 0.05); }
    x.moveTo(-s * 0.5, -s * 0.05); x.quadraticCurveTo(-s * 0.85, -s * 0.2 + Math.sin(run) * s * 0.1, -s * 0.95, s * 0.2);
    x.stroke();
    disc(x, s * 0.78, -s * 0.66, Math.max(0.5, s * 0.03), '#ffffff');
    x.restore();
  },
  // 小さな 火の トカゲ（x0 → x1 を ちょろちょろ。青むらさきの ほのお）
  g5Lizard(x, p) {
    const a = env(p, 80, 200);
    if (a <= 0) return;
    const T = travelPos(p);
    const s = p.s;
    const wig = Math.sin(p.age / 40) * 0.35;
    x.save();
    x.translate(T.x, T.y);
    x.rotate(T.ang);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, s * 2.4, '#7a5aff', a * 0.8);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.strokeStyle = '#6a4ae0'; x.lineWidth = Math.max(0.6, s * 0.3); x.lineCap = 'round';
    x.beginPath(); x.moveTo(-s * 0.4, 0); x.quadraticCurveTo(-s * 1.1, Math.sin(p.age / 50) * s * 0.5, -s * 1.7, wig * s); x.stroke();
    x.lineWidth = Math.max(0.5, s * 0.16);
    x.beginPath();
    for (const [lx, d] of [[0.25, 1], [-0.25, -1]]) { x.moveTo(lx * s, 0); x.lineTo(lx * s + wig * s * d, s * 0.45); x.moveTo(lx * s, 0); x.lineTo(lx * s - wig * s * d, -s * 0.45); }
    x.stroke();
    x.fillStyle = '#8a6aff';
    x.beginPath(); x.ellipse(0, 0, s * 0.55, s * 0.25, 0, 0, TAU); x.fill();
    disc(x, s * 0.6, 0, s * 0.24, '#8a6aff');
    disc(x, s * 0.68, -s * 0.1, s * 0.07, '#fff6a0'); disc(x, s * 0.68, s * 0.1, s * 0.07, '#fff6a0');
    x.restore();
  },
  // 岩の 大きな 足（上から ドスン。x, y … じめん。drop … おちる 時間）
  g5Foot(x, p) {
    const a = env(p, 80, 220);
    if (a <= 0) return;
    const s = p.s;
    const k = easeIn(clamp01(p.age / Math.max(1, p.drop)));
    const lift = clamp01((p.age - p.drop - (p.hold || 200)) / 300);
    const fy = lerp(-s * 2.2, p.y, k) - easeIn(lift) * (p.y + s * 2.4);
    x.save();
    // かげ
    x.globalAlpha = a * 0.45 * k;
    x.fillStyle = '#000000';
    x.beginPath(); x.ellipse(p.x, p.y + 2, s * 1.3 * (0.4 + 0.6 * k), s * 0.28, 0, 0, TAU); x.fill();
    x.globalAlpha = a;
    x.translate(p.x, fy);
    x.fillStyle = '#6a5a4a';
    x.beginPath();
    x.moveTo(-s * 1.2, 0); x.lineTo(-s * 1.0, -s * 2.4); x.lineTo(s * 1.0, -s * 2.6); x.lineTo(s * 1.25, -s * 0.2);
    for (let i = 0; i < 4; i++) { const tx0 = s * 1.2 - i * s * 0.6; x.quadraticCurveTo(tx0 - s * 0.05, s * 0.32, tx0 - s * 0.55, 0); }
    x.closePath(); x.fill();
    x.fillStyle = '#8a7a64';
    poly(x, [[-s * 0.9, -s * 2.2], [s * 0.2, -s * 2.4], [-s * 0.1, -s * 1.2], [-s * 0.95, -s * 1.0]]); x.fill();
    x.strokeStyle = '#3a2a1a'; x.lineWidth = Math.max(0.5, s * 0.06);
    x.beginPath(); x.moveTo(-s * 0.3, -s * 2.2); x.lineTo(0, -s * 1.4); x.lineTo(-s * 0.2, -s * 0.6); x.moveTo(s * 0.6, -s * 1.9); x.lineTo(s * 0.4, -s * 1.2); x.stroke();
    // こけ（みどりの つぶ）
    x.fillStyle = '#4a8a3a';
    for (let i = 0; i < 4; i++) disc(x, -s * 0.8 + i * s * 0.5, -s * 2.35 - (i % 2) * s * 0.1, s * 0.16, '#4a8a3a');
    x.restore();
  },
  // 氷の かいだん（x, y … したの はじめ。n … だんの かず）
  g5Stairs(x, p) {
    const a = env(p, 80, 260);
    if (a <= 0) return;
    const n = p.n || 10;
    const show = clamp01(p.age / Math.max(1, p.grow)) * n;
    x.save();
    for (let i = 0; i < Math.ceil(show); i++) {
      const k = clamp01(show - i);
      const sx = p.x + Math.sin(i * 0.55 + (p.phase || 0)) * p.w, sy = p.y - i * p.step;
      const w = 14 - i * 0.4;
      x.globalCompositeOperation = 'lighter';
      softGlow(x, sx, sy, w, '#9ae6ff', a * 0.5 * k);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a * 0.85 * k;
      x.fillStyle = '#d8f4ff';
      poly(x, [[sx - w, sy], [sx + w, sy], [sx + w - 3, sy + 3], [sx - w - 3, sy + 3]]); x.fill();
      x.globalAlpha = a * k;
      x.fillStyle = '#ffffff';
      x.fillRect(sx - w, sy - 0.5, w * 2, 1);
    }
    x.restore();
  },
  // 5色の たつまき（x, y … ねもと。cols … 色。x1 が あれば うごく）
  g5Tornado(x, p) {
    const a = env(p, 120, 260);
    if (a <= 0) return;
    const T = travelPos(p);
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow || 300)));
    const n = 12;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, T.x, T.y - p.h * 0.5 * g, p.w * 1.2, p.cols[0], a * 0.5);
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const yy = T.y - u * p.h * g;
      const rx = (p.w * 0.15 + p.w * 0.85 * u) * (0.85 + 0.15 * Math.sin(p.age / 80 + i));
      const cx = T.x + Math.sin(p.age / 140 + u * 4) * p.w * 0.12 * u;
      x.globalAlpha = a * (0.55 + 0.4 * u);
      x.strokeStyle = p.cols[(i + Math.floor(p.age / 90)) % p.cols.length];
      x.lineWidth = 1.2 + u * 1.4;
      const sp = p.age / 60 + i;
      x.beginPath(); x.ellipse(cx, yy, rx, rx * 0.22, 0, sp % TAU, (sp % TAU) + 4.4); x.stroke();
    }
    x.restore();
  },
  // パフェ（x, y … グラスの そこ。だんだん つみあがる）
  g5Parfait(x, p) {
    const a = env(p, 100, 240);
    if (a <= 0) return;
    const s = p.s;
    const k = clamp01(p.age / Math.max(1, p.grow));
    const layers = ['#fff6e8', '#ff8ab0', '#fff6e8', '#ffd060', '#fff6e8', '#ff5a7a'];
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, -s * 2, s * 3, '#ffb0d8', a * 0.5);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    // あし
    x.fillStyle = '#d8f0ff'; x.fillRect(-s * 0.12, -s * 0.7, s * 0.24, s * 0.7);
    x.beginPath(); x.ellipse(0, 0, s * 0.6, s * 0.15, 0, 0, TAU); x.fill();
    // なかみ
    const shown = k * layers.length;
    for (let i = 0; i < Math.ceil(shown); i++) {
      const f = clamp01(shown - i);
      const y0 = -s * 0.7 - i * s * 0.42;
      const wv = s * (0.45 + i * 0.09);
      x.globalAlpha = a * f;
      x.fillStyle = layers[i];
      x.fillRect(-wv, y0 - s * 0.42, wv * 2, s * 0.43);
    }
    // グラス
    x.globalAlpha = a;
    x.strokeStyle = '#ffffff'; x.lineWidth = Math.max(0.5, s * 0.07);
    poly(x, [[-s * 0.45, -s * 0.7], [-s * 1.0, -s * 3.25], [s * 1.0, -s * 3.25], [s * 0.45, -s * 0.7]], false); x.stroke();
    // うえの クリームと さくらんぼ・くだもの
    if (k > 0.85) {
      const f = clamp01((k - 0.85) / 0.15);
      x.globalAlpha = a * f;
      for (let i = -2; i <= 2; i++) disc(x, i * s * 0.32, -s * 3.35 - (2 - Math.abs(i)) * s * 0.18, s * 0.38, '#ffffff');
      x.save(); x.translate(0, -s * 4.2); drawFruit(x, 'cherry', s * 0.45); x.restore();
      x.save(); x.translate(-s * 0.75, -s * 3.6); x.rotate(-0.4); drawFruit(x, 'straw', s * 0.4); x.restore();
      x.save(); x.translate(s * 0.75, -s * 3.6); x.rotate(0.4); drawFruit(x, 'orange', s * 0.36); x.restore();
    }
    x.restore();
  },
  // クリスタルの かべ（6かくの いたが ならぶ。にじ色の ふち）
  g5Wall(x, p) {
    const a = env(p, 120, 260);
    if (a <= 0) return;
    const g = easeOut(clamp01(p.age / Math.max(1, p.grow || 300)));
    const n = p.n || 7;
    const rain = ['#ff8a8a', '#ffd08a', '#fff68a', '#8aff9a', '#8ad8ff', '#b08aff'];
    x.save();
    for (let i = 0; i < n; i++) {
      const cx = p.x - p.w / 2 + (i + 0.5) * (p.w / n);
      const r = (p.w / n) * 0.62;
      const cy = p.y - r * (1 + (i % 2) * 0.9) * g;
      const pts = [];
      for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU + Math.PI / 6; pts.push([cx + Math.cos(an) * r * g, cy + Math.sin(an) * r * g]); }
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = a * 0.22;
      x.fillStyle = '#c8e8ff';
      poly(x, pts); x.fill();
      x.globalAlpha = a * 0.9;
      x.lineWidth = 1;
      for (let k = 0; k < 6; k++) {
        x.strokeStyle = rain[(k + i + Math.floor(p.age / 120)) % rain.length];
        x.beginPath(); x.moveTo(...pts[k]); x.lineTo(...pts[(k + 1) % 6]); x.stroke();
      }
      const sh = (p.age / 600 + i * 0.15) % 1.4;
      if (sh < 1) { x.globalAlpha = a * 0.6; x.fillStyle = '#ffffff'; x.fillRect(cx - r * 0.7 + sh * r * 1.4, cy - r * 0.8, 1, r * 1.6); }
    }
    x.restore();
  },
};

// ───────────── べんりな どうぐ ─────────────
// 段の 上限（同時の つぶ）。これより 多く なりそうな ときは 小さな つぶを たさない
const CAP = Object.fromEntries(Object.entries(AX_BUDGET).map(([k, v]) => [k, v.parts[1]]));
const LOW = new Set(['spark', 'twinkle', 'axShape', 'petal2', 'drop', 'bubble', 'puff', undefined, 'arrow']);
// もっと 多い ときは ひかり・わ・ほしも たさない
const MID = new Set(['glow', 'shock', 'star', 'impact', 'g5Mark', 'g5Heart', 'g5Fruit', 'g5Bubble']);
function guarded(fx, cap, fn) {
  const own = Object.prototype.hasOwnProperty.call(fx, 'add');
  const prev = fx.add;
  fx.add = function addCap(q) {
    if (q && LOW.has(q.kind) && this.parts.length >= cap) return;
    if (q && MID.has(q.kind) && this.parts.length >= cap * 1.07) return;
    return prev.call(this, q);
  };
  try { return fn(); } finally { if (own) fx.add = prev; else delete fx.add; }
}
// play を つつむ: 小さな つぶの 上限・c.at の 中も おなじ・べんりな もの（c.o … 出どころ、c.big … 大きな つぶを たす）
export function wrapPlay(play) {
  return function g5Play(fx, c) {
    const tier = c.dual ? 'super' : c.tier;
    const cap = Math.round(CAP[tier] * 0.98);
    const at0 = c.at;
    c.at = (ms, fn) => at0.call(c, ms, () => guarded(fx, cap, fn));
    c.o = c.fromAlly ? { x: c.from.x, y: c.H + 6 } : { x: c.from.x, y: c.from.y };
    c.add = (kind, o) => fx.add({ kind, x: o.x ?? o.x1 ?? o.x0 ?? 0, y: o.y ?? o.y1 ?? o.y0 ?? 0, seed: Math.random() * 100, ...o });
    c.cap = cap;
    c.lo = Math.round(AX_BUDGET[tier].parts[0]);
    return guarded(fx, cap, () => play(fx, c));
  };
}
// たりなければ きらきらを 足して にぎやかに（at … 時間、want … めやすの かず。x, y … まん中、r … ひろがり）
export function sparkleFill(c, at, x, y, { want, r = 30, cols = ['#ffffff', '#fff6b0'], shape = 'twinkle', up = false } = {}) {
  c.at(at, () => {
    const need = Math.min(c.cap - 4, want ?? Math.round(c.lo * 1.18)) - c.fx.parts.length;
    // len の 中で おわる 長さ
    const L = Math.max(200, Math.min(520, c.len + 180 - at - 170));
    for (let i = 0; i < need; i++) {
      const px = x + rnd(-r, r), py = y + rnd(-r, r) * 0.7;
      if (shape === 'twinkle') c.fx.twinkle(px, py, { color: cols[i % cols.length], size: rnd(2.5, 5), delay: rnd(0, 160), life: rnd(L * 0.6, L), vy: up ? rnd(-30, -10) : rnd(-6, 6) });
      else c.fx.add({ kind: 'axShape', shape, x: px, y: py, vx: rnd(-20, 20), vy: up ? rnd(-40, -10) : rnd(-20, 20), g: 0, drag: 0.97, color: cols[i % cols.length], size: rnd(1.6, 2.8), rot0: rnd(0, 6), spin: rnd(-4, 4), delay: rnd(0, 160), life: rnd(L * 0.6, L) / 1.1, add: true, pop: true });
    }
  });
}
// ↑↓ やじるし（つよく なる・よわく なる）。len の 中で おわる
// len の 中で おわる つぶの 長さ（shapes は ながさが 1.15ばい まで・おくれ 60ms まで のびる）
export const lifeFor = (c, delay, want) => Math.max(140, Math.min(want, (c.len + 200 - delay - 70) / 1.16));
export function arrows(c, x, y, col, up = true, n = 3, delay = 0) {
  for (let k = 0; k < n; k++) {
    const d = delay + k * 70;
    const life = Math.min(560, c.len - d - 30);
    if (life < 120) continue;
    const ax = x + (k - (n - 1) / 2) * 9;
    c.add('g5Mark', { mark: up ? 'arrowUp' : 'arrowDown', x0: ax, y0: y + (up ? 6 : -14), x1: ax, y1: y + (up ? -18 : 8), travel: life, ease: 'lin', s: 3.4, color: col, glow: col, delay: d, life, fout: 160, pop: false });
  }
}
export { travelPos, drawMark, drawFruit, drawHeart, drawFlake, drawCrystal };
