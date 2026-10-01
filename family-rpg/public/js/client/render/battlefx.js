// たたかいの はいけいと エフェクト
import { makeCanvas, ctxOf, hexToRgb } from './pixel.js';
import { weaponLook, playWeapon } from './weaponfx.js';

export const BW = 256;
export const BH = 144;
// たたかいの え の こまかさ（なかみは BW×BH の まま、3ばいの こまかさで かく）
export const BRES = 3;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;

// ぼんやり ひかる まるの え（いろごとに 1まいだけ つくる）
// dense: けむりの ように ふちまで こい
const glowCache = new Map();
export function glowSprite(color, dense = false) {
  const key = dense ? color + '|d' : color;
  let c = glowCache.get(key);
  if (c) return c;
  c = makeCanvas(64, 64);
  const x = c.getContext('2d');
  const [r, g, b] = /^#[0-9a-f]{3,6}$/i.test(color) ? hexToRgb(color) : [255, 255, 255];
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  const stops = dense ? [[0, 1], [0.45, 0.85], [0.8, 0.3], [1, 0]] : [[0, 1], [0.22, 0.75], [0.55, 0.22], [1, 0]];
  for (const [o, a] of stops) gr.addColorStop(o, `rgba(${r},${g},${b},${a})`);
  x.fillStyle = gr;
  x.fillRect(0, 0, 64, 64);
  glowCache.set(key, c);
  return c;
}

// 3つの てんを とおる 円（きりさきの みちすじ）。a0 → a1 の むきで b を とおる
export function arcThrough(ax, ay, bx, by, cx, cy) {
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-6) return null;
  const A = ax * ax + ay * ay, B = bx * bx + by * by, C = cx * cx + cy * cy;
  const ux = (A * (by - cy) + B * (cy - ay) + C * (ay - by)) / d;
  const uy = (A * (cx - bx) + B * (ax - cx) + C * (bx - ax)) / d;
  const TAU = Math.PI * 2;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const a0 = Math.atan2(ay - uy, ax - ux);
  const am = Math.atan2(by - uy, bx - ux);
  const ac = Math.atan2(cy - uy, cx - ux);
  const pos = norm(am - a0) < norm(ac - a0);
  const a1 = pos ? a0 + norm(ac - a0) : a0 - norm(a0 - ac);
  const mid = pos ? norm(am - a0) : norm(a0 - am);
  return { x: ux, y: uy, r: Math.hypot(ax - ux, ay - uy), a0, a1, f: mid / Math.abs(a1 - a0) };
}

const BG = {
  grass: { sky: ['#6fb7ff', '#a8d8ff', '#e0f2ff'], far: '#7fb86a', near: '#5aa84a', ground: ['#6cbb52', '#5aa84a'], deco: 'hills' },
  plains_east: { sky: ['#f0a86a', '#ffd6a0', '#fff0d0'], far: '#b89a5a', near: '#8aa84a', ground: ['#9ab85a', '#86a84a'], deco: 'rocks' },
  forest: { sky: ['#2a5a3a', '#3a7a4a', '#5a9a5a'], far: '#1e4a2a', near: '#2a6a36', ground: ['#3a7a3a', '#2e6a32'], deco: 'trees' },
  swamp: { sky: ['#4a3a5a', '#6a5a7a', '#8a7a8a'], far: '#3a3048', near: '#5a4a6a', ground: ['#5f4a73', '#4a3a5c'], deco: 'dead' },
  cave: { sky: ['#0e0a10', '#1a1418', '#2a221e'], far: '#2a221e', near: '#3a3028', ground: ['#4a4038', '#3a322a'], deco: 'stalactite' },
  cave_boss: { sky: ['#0a0612', '#1a1024', '#2a1a38'], far: '#2a1a38', near: '#3a2848', ground: ['#3c3048', '#2c2238'], deco: 'crystal' },
  village_night: { sky: ['#0a1030', '#1a2450', '#2a3470'], far: '#1a2a3a', near: '#2a3a2a', ground: ['#3a5a3a', '#2e4a2e'], deco: 'houses' },
  // 第2章
  sea: { sky: ['#5aa8f0', '#8ccaff', '#c8e8ff'], far: '#2e69bd', near: '#6a4222', ground: ['#a8733e', '#96652f'], deco: 'sea', deck: true },
  beach: { sky: ['#5aa8f0', '#8ccaff', '#d0ecff'], far: '#3c80d6', near: '#d7bf82', ground: ['#ead79c', '#dcc88a'], deco: 'palms' },
  storm: { sky: ['#22222e', '#34344a', '#4a4a62'], far: '#1e3050', near: '#4a2e1a', ground: ['#7c5329', '#6a4522'], deco: 'storm', deck: true },
  sea_cave: { sky: ['#061014', '#0e2026', '#16303a'], far: '#163640', near: '#22505a', ground: ['#2a4a50', '#223c42'], deco: 'stalactite' },
  tower: { sky: ['#16162a', '#24243c', '#32324e'], far: '#4a4a62', near: '#5a5a70', ground: ['#77788a', '#686a7e'], deco: 'pillars' },
  tower_top: { sky: ['#1a1a28', '#2e2e46', '#46466a'], far: '#3a3a52', near: '#5a5a70', ground: ['#77788a', '#686a7e'], deco: 'storm' },
  // 宝の洞窟（氷・炎）
  tm_ice: { sky: ['#0a1a30', '#16304e', '#28507a'], far: '#3a6a9a', near: '#7ea2cf', ground: ['#a8c8e8', '#8aaed6'], deco: 'crystal' },
  tm_lava: { sky: ['#1a0604', '#3a0e06', '#6a1a08'], far: '#4a1a0e', near: '#8a2a0a', ground: ['#4a2216', '#3a1a10'], deco: 'stalactite' },
};

export function battleBackground(id) {
  const d = BG[id] || BG.grass;
  const c = makeCanvas(BW, BH);
  const x = ctxOf(c);
  const hor = 78;
  // そら（だんだん）
  const bands = d.sky;
  for (let y = 0; y < hor; y++) {
    const t = y / hor;
    const i = Math.min(bands.length - 1, Math.floor(t * bands.length));
    x.fillStyle = bands[i];
    x.fillRect(0, y, BW, 1);
    // ディザ
    if ((y % 4 === 0) && i < bands.length - 1 && t * bands.length - i > 0.7) {
      x.fillStyle = bands[i + 1];
      for (let k = y % 8 ? 0 : 2; k < BW; k += 4) x.fillRect(k, y, 1, 1);
    }
  }
  if (id === 'village_night' || id === 'cave_boss') {
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 30; i++) x.fillRect((i * 97) % BW, (i * 53) % (hor - 10), 1, 1);
  }
  if (d.deco === 'storm') {
    // くらい くもと いなずま
    x.fillStyle = 'rgba(12,12,20,0.55)';
    for (const [cx, cy, w] of [[20, 10, 60], [110, 4, 70], [190, 14, 60]]) {
      x.fillRect(cx, cy, w, 8); x.fillRect(cx + 6, cy - 4, w - 12, 4);
    }
    x.fillStyle = '#fff6b0';
    let lx = 168, ly = 12;
    for (let i = 0; i < 7; i++) {
      const nx = lx + (i % 2 ? 5 : -4), ny = ly + 7;
      for (let k = 0; k <= 7; k++) x.fillRect(Math.round(lx + (nx - lx) * k / 7), ly + k, 2, 1);
      lx = nx; ly = ny;
    }
  }
  if (id === 'grass' || id === 'plains_east' || id === 'sea' || id === 'beach') {
    x.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [cx, cy, w] of [[40, 20, 26], [150, 12, 34], [220, 28, 22]]) {
      x.fillRect(cx, cy, w, 5); x.fillRect(cx + 4, cy - 3, w - 8, 3); x.fillRect(cx + 8, cy - 5, w - 18, 2);
    }
  }
  // とおくの けしき
  x.fillStyle = d.far;
  for (let px = 0; px < BW; px++) {
    let h;
    switch (d.deco) {
      case 'trees': h = 20 + Math.abs(Math.sin(px * 0.21) * 16) + (px % 7 < 3 ? 6 : 0); break;
      case 'stalactite': h = 8 + (px % 23 < 3 ? 12 : 0) + Math.abs(Math.sin(px * 0.1) * 6); break;
      case 'crystal': h = 10 + (px % 31 < 4 ? 18 : 0); break;
      case 'houses': h = (px % 48 < 30) ? 18 + (px % 48 > 10 && px % 48 < 20 ? 8 : 0) : 6; break;
      case 'rocks': h = 10 + Math.abs(Math.sin(px * 0.05) * 18); break;
      case 'dead': h = 8 + (px % 29 < 2 ? 20 : 0) + Math.abs(Math.sin(px * 0.08) * 6); break;
      case 'sea': case 'palms': h = 7 + Math.abs(Math.sin(px * 0.3)) * 2; break;
      case 'storm': h = 9 + Math.abs(Math.sin(px * 0.22) * 7) + (px % 17 < 3 ? 3 : 0); break;
      case 'pillars': h = px % 48 < 10 ? 78 : 14 + (px % 48 > 20 && px % 48 < 38 ? 10 : 0); break;
      default: h = 10 + Math.abs(Math.sin(px * 0.035) * 14) + Math.abs(Math.sin(px * 0.11) * 4);
    }
    if (d.deco === 'stalactite' || d.deco === 'crystal') {
      x.fillRect(px, 0, 1, Math.max(2, h * 0.8));
      x.fillRect(px, hor - h * 0.5, 1, h * 0.5);
    } else x.fillRect(px, hor - h, 1, h);
  }
  if (d.deco === 'houses') {
    x.fillStyle = '#ffd66b';
    for (let k = 10; k < BW; k += 48) x.fillRect(k + 8, hor - 12, 3, 3);
  }
  if (d.deco === 'sea' || d.deco === 'palms' || d.deco === 'storm') {
    // なみの しろい あわ
    x.fillStyle = d.deco === 'storm' ? 'rgba(220,230,255,0.55)' : 'rgba(255,255,255,0.8)';
    for (let k = 0; k < BW; k += 9) x.fillRect((k * 7) % BW, hor - 3 - (k % 4), 4, 1);
  }
  if (d.deco === 'palms') {
    // ヤシの木
    for (const [tx, th] of [[26, 40], [226, 34]]) {
      x.fillStyle = '#7a5a32';
      for (let k = 0; k < th; k++) x.fillRect(tx + Math.round(Math.sin(k / 9) * 3), hor + 6 - k, 3, 1);
      x.fillStyle = '#2f8a3a';
      const top = hor + 6 - th;
      for (let k = -14; k <= 14; k++) {
        x.fillRect(tx + k, top + Math.round(Math.abs(k) / 3), 2, 2);
        x.fillRect(tx + Math.round(k / 2), top - 5 + Math.round(Math.abs(k) / 2), 2, 2);
      }
    }
  }
  if (d.deco === 'pillars') {
    x.fillStyle = 'rgba(255,255,255,0.12)';
    for (let k = 0; k < BW; k += 48) x.fillRect(k + 1, 0, 2, hor);
  }
  // じめん
  x.fillStyle = d.near;
  x.fillRect(0, hor, BW, 4);
  for (let y = hor + 4; y < BH; y++) {
    const t = (y - hor) / (BH - hor);
    x.fillStyle = t < 0.5 ? d.ground[0] : d.ground[1];
    x.fillRect(0, y, BW, 1);
  }
  // 船の かんぱん（いたの すじ）
  if (d.deck) {
    x.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = hor + 8; y < BH; y += 7) x.fillRect(0, y, BW, 1);
    for (let y = hor + 8; y < BH; y += 7) for (let k = (y * 13) % 40; k < BW; k += 40) x.fillRect(k, y - 6, 1, 6);
    x.fillStyle = '#5a3a22';
    x.fillRect(0, hor - 2, BW, 3);
    for (let k = 4; k < BW; k += 16) x.fillRect(k, hor - 8, 2, 8);
    x.fillRect(0, hor - 9, BW, 2);
  }
  // えんきんの せん
  x.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 6; i++) {
    const y = hor + 6 + i * i * 2;
    if (y < BH) x.fillRect(0, y, BW, 1);
  }
  // モンスターの たつ ばしょ
  x.fillStyle = 'rgba(0,0,0,0.10)';
  x.beginPath();
  x.ellipse(BW / 2, 118, 118, 14, 0, 0, Math.PI * 2);
  x.fill();
  return c;
}

// ───────────── つぶつぶ エフェクト ─────────────
// こうげき・じゅもんの えんしゅつ（てきの え の うえに かく）
// つぶ（parts）は delay で じゅんばんに でてくる。proj は とんでいく たま、swirl は うずまき

const COL = {
  fire: ['#ff5a2a', '#ff9a3a', '#ffe07a', '#ffffff'],
  ice: ['#9ae6ff', '#e6fbff', '#5ab8e8', '#ffffff'],
  wind: ['#d8ffe0', '#9af0b0', '#ffffff', '#6ad89a'],
  blast: ['#ffffff', '#ffd66b', '#ff8a2a', '#ff5a2a'],
  bolt: ['#ffffff', '#fff6b0', '#9ad8ff'],
  light: ['#ffffff', '#fff6b0', '#ffd66b'],
  dark: ['#8a5ac8', '#3a2a5a', '#c8a8f0', '#5a2a8a'],
  void: ['#ffffff', '#c8a8ff', '#8a5ac8'],
  heal: ['#7dffb0', '#ffffff', '#b8ffd0'],
  poison: ['#b06ae0', '#7a3aa8', '#d8a8ff'],
  phys: ['#ffffff', '#ffd66b'],
};

// うごかない（かたちが じかんで かわるだけの）つぶ
const STILL = new Set(['lash', 'beam', 'arc', 'impact', 'lines', 'crossflash', 'ellipse', 'spot', 'glow', 'trail', 'cut', 'shock', 'crack', 'lash2', 'spear', 'zap', 'fang', 'gust', 'fanshape', 'bigcut', 'rune']);

// ムチの かたち（t: 0〜1）
function lashPts(p, t) {
  // とどいたら すぐ ひきもどす
  const reach = t < p.snap ? easeOut(t / p.snap) : 1 - 0.75 * easeIn((t - p.snap) / (1 - p.snap));
  const dx = p.x1 - p.x0, dy = p.y1 - p.y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const fade = t < p.snap ? 1 : 1 - (t - p.snap) / (1 - p.snap);
  const out = [];
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const u = (i / N) * reach;
    const bow = Math.sin(u * Math.PI) * p.bow;
    const wave = Math.sin(u * Math.PI * 3 - t * 16 + p.phase) * p.amp * u * (1 - u) * 4 * (0.3 + 0.7 * fade);
    out.push([p.x0 + dx * u + nx * (bow + wave), p.y0 + dy * u + ny * (bow + wave)]);
  }
  return out;
}

// 三日月の きせきの かたち（u0〜u1 の あいだ、あたまが ふとい）
function trailPath(x, ah, at, rOut, thick) {
  const N = 20;
  x.beginPath();
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = at + (ah - at) * u;
    x.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
  }
  for (let i = N; i >= 0; i--) {
    const u = i / N;
    const a = at + (ah - at) * u;
    const th = thick * Math.pow(u, 0.75) * (u > 0.9 ? 1 - (u - 0.9) * 5 : 1);
    x.lineTo(Math.cos(a) * (rOut - th), Math.sin(a) * (rOut - th));
  }
  x.closePath();
  x.fill();
}

function drawTrail(x, p, age, alpha, rShift = 0, aShift = 0) {
  if (age <= 0) return;
  const rest = Math.max(1, p.life - p.swing);
  const span = 0.85;
  let hu, tu;
  if (age < p.swing) {
    hu = Math.pow(age / p.swing, p.pow);
    tu = Math.max(0, hu - span);
  } else {
    hu = 1;
    tu = 1 - span + span * easeIn(clamp01((age - p.swing) / rest));
  }
  if (hu - tu <= 0.01) return;
  const da = p.a1 - p.a0;
  const ah = p.a0 + da * hu + aShift, at = p.a0 + da * tu + aShift;
  const fade = age < p.swing ? 1 : 1 - clamp01((age - p.swing) / rest);
  const w = p.w * (0.35 + 0.65 * fade);
  const r = p.r + rShift;
  x.save();
  x.translate(p.x, p.y);
  if (p.sy !== 1) x.scale(1, p.sy);
  if (alpha < 1) {
    // ざんぞうは 1まいだけ（かるく）
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = alpha * fade;
    x.fillStyle = p.glow;
    trailPath(x, ah, at, r, w * 1.2);
    x.restore();
    return;
  }
  x.globalCompositeOperation = 'lighter';
  x.globalAlpha = alpha * 0.4 * fade;
  x.fillStyle = p.glow;
  trailPath(x, ah, at, r + w * 0.45, w * 2.1);
  x.globalCompositeOperation = 'source-over';
  x.globalAlpha = alpha * 0.9 * (0.4 + 0.6 * fade);
  x.fillStyle = p.color;
  trailPath(x, ah, at, r, w);
  x.globalAlpha = alpha * fade;
  x.fillStyle = p.core;
  trailPath(x, ah, at, r - w * 0.08, w * 0.38);
  // やいばの さき（ふっている あいだ ひかる）
  if (alpha >= 1 && age < p.swing + 60) {
    const hx = Math.cos(ah) * (r - w * 0.35), hy = Math.sin(ah) * (r - w * 0.35);
    const k = 1 - clamp01((age - p.swing) / 60);
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = 0.8 * k;
    const g = w * 1.9;
    x.drawImage(glowSprite(p.glow), hx - g, hy - g, g * 2, g * 2);
    x.globalAlpha = k;
    x.drawImage(glowSprite('#ffffff'), hx - g * 0.45, hy - g * 0.45, g * 0.9, g * 0.9);
  }
  x.restore();
}

// ギザギザの せん（いなずま）
function zapPts(x0, y0, x1, y1, n = 8) {
  const dx = x1 - x0, dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const out = [[x0, y0]];
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const j = (Math.random() - 0.5) * L * 0.22 * Math.sin(u * Math.PI);
    out.push([x0 + dx * u + nx * j, y0 + dy * u + ny * j]);
  }
  out.push([x1, y1]);
  return out;
}

function polyline(x, pts) {
  x.beginPath();
  pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b)));
  x.stroke();
}

// こまかい つぶの かきかた（しゅるいごと）
const FINE = {
  glow(x, p, t) {
    const r = p.r * (1 - p.grow + p.grow * easeOut(clamp01(t * 2.5)));
    x.globalAlpha = p.a * Math.pow(1 - t, 1.4);
    x.drawImage(glowSprite(p.color), p.x - r, p.y - r, r * 2, r * 2);
  },
  puff(x, p, t) {
    const r = p.r0 + (p.r1 - p.r0) * easeOut(t);
    x.globalAlpha = p.a * (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85);
    x.drawImage(glowSprite(p.color, !p.add), p.x - r, p.y - r, r * 2, r * 2);
  },
  trail(x, p) {
    // ざんぞう: すこし おくれて、すこし うちがわに（ずらす はばは ながさで きめる）
    const back = p.a1 > p.a0 ? -1 : 1;
    const da = Math.min(0.16, 7 / p.r);
    for (let k = p.after; k >= 1; k--) drawTrail(x, p, p.age - k * 24, 0.5 / k, -k * 2.2, back * k * da);
    drawTrail(x, p, p.age, 1);
  },
  cut(x, p) {
    const e = easeOut(clamp01(p.age / p.speed));
    const tu = clamp01((p.age - p.speed) / Math.max(1, p.life - p.speed));
    const c = Math.cos(p.ang), s = Math.sin(p.ang);
    const x0 = p.x - c * p.len / 2, y0 = p.y - s * p.len / 2;
    const head = p.len * e, tail = head * easeIn(tu);
    const hx = x0 + c * head, hy = y0 + s * head, tx = x0 + c * tail, ty = y0 + s * tail;
    const mx = tx + (hx - tx) * 0.62, my = ty + (hy - ty) * 0.62;
    const dia = (w) => {
      x.beginPath();
      x.moveTo(tx, ty); x.lineTo(mx - s * w / 2, my + c * w / 2); x.lineTo(hx, hy); x.lineTo(mx + s * w / 2, my - c * w / 2);
      x.closePath(); x.fill();
    };
    const k = 1 - tu;
    x.globalAlpha = 0.45 * k; x.fillStyle = p.glow; dia(p.w * 3.4);
    x.globalAlpha = 0.95 * k; x.fillStyle = p.color; dia(p.w);
    x.globalAlpha = k; x.fillStyle = '#ffffff'; dia(p.w * 0.35);
  },
  shock(x, p, t) {
    const r = p.r0 + (p.r1 - p.r0) * easeOut(t);
    x.globalAlpha = Math.max(0, 1 - t) * 0.95;
    x.lineWidth = Math.max(0.3, p.w * (1 - t));
    x.beginPath(); x.ellipse(p.x, p.y, r, r * p.sy, 0, 0, Math.PI * 2); x.stroke();
  },
  crack(x, p, t) {
    const show = clamp01(t * 5);
    const a = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    for (const pass of [0, 1]) {
      x.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      x.globalAlpha = pass ? a * (1 - t) : a;
      x.strokeStyle = pass ? p.hi : p.color;
      x.lineWidth = pass ? 0.8 : 1.8;
      x.beginPath();
      for (const ln of p.lines) {
        const n = Math.max(1, Math.ceil((ln.length - 1) * show));
        x.moveTo(p.x + ln[0][0], p.y + ln[0][1]);
        for (let i = 1; i <= n; i++) x.lineTo(p.x + ln[i][0], p.y + ln[i][1]);
      }
      x.stroke();
    }
  },
  lash2(x, p, t) {
    const pts = lashPts(p, t);
    const fade = t < p.snap ? 1 : 1 - (t - p.snap) / (1 - p.snap);
    const n = pts.length - 1;
    if (p.glow) {
      x.strokeStyle = p.glow; x.globalAlpha = 0.35 * fade; x.lineWidth = p.w * 2;
      polyline(x, pts);
    }
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = p.color; x.globalAlpha = fade;
    for (let i = 1; i <= n; i++) {
      x.lineWidth = Math.max(0.4, p.w * (1 - (i / n) * 0.75));
      x.beginPath(); x.moveTo(pts[i - 1][0], pts[i - 1][1]); x.lineTo(pts[i][0], pts[i][1]); x.stroke();
    }
    if (p.links) {
      // くさりの わ
      x.fillStyle = '#ffffff';
      for (let i = 2; i <= n; i += 2) x.fillRect(pts[i][0] - 0.6, pts[i][1] - 0.6, 1.2, 1.2);
    }
    const [ex, ey] = pts[n];
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(ex, ey, p.w * 0.45, 0, Math.PI * 2); x.fill();
  },
  spear(x, p) {
    const e = easeOut(clamp01(p.age / p.travel));
    const back = clamp01((p.age - p.travel - p.hold) / Math.max(1, p.life - p.travel - p.hold));
    const dx = p.x1 - p.x0, dy = p.y1 - p.y0, L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const D = (L + p.over) * e;
    const hx = p.x0 + ux * D, hy = p.y0 + uy * D;
    const tl = p.len * (1 - back) * Math.min(1, e * 1.5);
    const tx = hx - ux * tl, ty = hy - uy * tl;
    const k = 1 - back;
    const streak = (w, col, a) => {
      x.globalAlpha = a; x.fillStyle = col;
      x.beginPath(); x.moveTo(tx, ty); x.lineTo(hx + nx * w / 2, hy + ny * w / 2); x.lineTo(hx - nx * w / 2, hy - ny * w / 2); x.closePath(); x.fill();
    };
    streak(p.w * 3, p.glow, 0.4 * k);
    streak(p.w, p.color, 0.9 * k);
    streak(p.w * 0.35, '#ffffff', k);
    const tipL = p.w * 3.2, tipW = p.w * 1.2;
    x.globalAlpha = k; x.fillStyle = p.tip;
    x.beginPath(); x.moveTo(hx + ux * tipL, hy + uy * tipL); x.lineTo(hx + nx * tipW, hy + ny * tipW); x.lineTo(hx - nx * tipW, hy - ny * tipW); x.closePath(); x.fill();
  },
  twinkle(x, p, t) {
    const s = p.size * Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.08));
    if (s <= 0.05) return;
    const rot = p.spin * p.age / 1000;
    x.globalAlpha = 0.55 * (1 - t);
    x.drawImage(glowSprite(p.color), p.x - s * 1.4, p.y - s * 1.4, s * 2.8, s * 2.8);
    x.globalAlpha = 1 - t * 0.4;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const rr = i % 2 ? s * 0.16 : s;
      const a = rot + (i / 8) * Math.PI * 2;
      x.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
    }
    x.closePath(); x.fill();
  },
  drop(x, p, t) {
    x.globalAlpha = 1 - t * t;
    const sp = Math.hypot(p.vx, p.vy) || 1;
    const ux = p.vx / sp, uy = p.vy / sp, r = p.size;
    x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(p.x - ux * r * 2.6, p.y - uy * r * 2.6); x.lineTo(p.x - uy * r, p.y + ux * r); x.lineTo(p.x + uy * r, p.y - ux * r); x.closePath(); x.fill();
    x.fillStyle = '#ffffff';
    x.globalAlpha *= 0.7;
    x.fillRect(p.x - r * 0.55, p.y - r * 0.55, r * 0.5, r * 0.5);
  },
  bubble(x, p, t) {
    x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 0.9;
    x.lineWidth = 0.5;
    const bx = p.x + Math.sin(p.age / 90 + p.phase) * 1.5;
    x.beginPath(); x.arc(bx, p.y, p.size * (1 + t * 0.3), 0, Math.PI * 2); x.stroke();
    x.fillStyle = '#ffffff';
    x.fillRect(bx - p.size * 0.55, p.y - p.size * 0.55, p.size * 0.45, p.size * 0.45);
  },
  zap(x, p, t) {
    const step = Math.floor(p.age / 45);
    if (step !== p.step) {
      p.step = step;
      p.pts = zapPts(p.x0, p.y0, p.x1, p.y1, 9);
      p.fk = [];
      for (let i = 0; i < p.forks; i++) {
        const [fx0, fy0] = p.pts[2 + Math.floor(Math.random() * (p.pts.length - 4))];
        p.fk.push(zapPts(fx0, fy0, fx0 + (Math.random() - 0.5) * 30, fy0 + 6 + Math.random() * 14, 4));
      }
    }
    const k = (1 - t) * (step % 2 ? 0.6 : 1);
    for (const pts of [p.pts, ...p.fk]) {
      x.globalAlpha = 0.35 * k; x.strokeStyle = p.glow; x.lineWidth = p.w * 4; polyline(x, pts);
      x.globalAlpha = k; x.strokeStyle = p.color; x.lineWidth = p.w; polyline(x, pts);
      x.strokeStyle = '#ffffff'; x.lineWidth = p.w * 0.4; polyline(x, pts);
    }
  },
  fang(x, p, t) {
    const close = easeIn(clamp01(t * 3.2));
    const s = p.size;
    const gap = 16 * s * (1 - close);
    const jit = t > 0.31 && t < 0.5 ? (Math.random() - 0.5) * 1.6 : 0;
    const a = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
    for (const dir of [-1, 1]) {
      const by = p.y + dir * gap + jit;
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = 0.6 * a; x.strokeStyle = p.glow; x.lineWidth = 2.4 * s;
      x.beginPath();
      for (let i = -3; i <= 3; i++) x.lineTo(p.x + i * 5 * s, by + dir * (2 + i * i * 0.45) * s);
      x.stroke();
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = a; x.fillStyle = p.color;
      x.beginPath();
      for (let i = -3; i <= 3; i++) {
        const tx = p.x + i * 5 * s, ty = by + dir * (2 + i * i * 0.45) * s;
        const L = 6.5 * s * (1 - Math.abs(i) * 0.1);
        x.moveTo(tx - 2.1 * s, ty); x.lineTo(tx, ty - dir * L); x.lineTo(tx + 2.1 * s, ty);
      }
      x.fill();
    }
  },
  gust(x, p, t) {
    const head = easeOut(clamp01(t * 1.5));
    const tail = easeIn(clamp01(t * 1.5 - 0.3));
    if (head - tail < 0.01) return;
    x.globalAlpha = 0.9 * (1 - t * 0.6);
    x.lineWidth = p.w;
    x.beginPath();
    let hx = 0, hy = 0;
    for (let i = 0; i <= 14; i++) {
      const u = tail + (head - tail) * (i / 14);
      hx = p.x + p.dir * (u - 0.5) * p.len;
      hy = p.y + Math.sin(u * Math.PI * 2 + p.phase) * p.amp;
      if (i) x.lineTo(hx, hy); else x.moveTo(hx, hy);
    }
    // さきっぽが くるりと まく
    if (head > 0.45) {
      const cr = 2.2 + p.amp * 0.3;
      x.arc(hx, hy - cr, cr, Math.PI / 2, Math.PI / 2 - p.dir * 4.2, p.dir > 0);
    }
    x.stroke();
  },
  fanshape(x, p, t) {
    const open = easeOut(clamp01(t * 3));
    const A = p.spread * open;
    const r = p.r * (0.8 + 0.2 * open);
    const k = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5;
    x.globalAlpha = 0.55 * k;
    x.beginPath(); x.moveTo(p.x, p.y); x.arc(p.x, p.y, r, p.a - A / 2, p.a + A / 2); x.closePath(); x.fill();
    x.globalAlpha = 0.9 * k; x.strokeStyle = p.rib; x.lineWidth = 0.6;
    x.beginPath();
    for (let i = 0; i <= p.ribs; i++) {
      const a = p.a - A / 2 + (A * i) / p.ribs;
      x.moveTo(p.x, p.y); x.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
    }
    x.stroke();
    x.lineWidth = 1.4;
    x.beginPath(); x.arc(p.x, p.y, r, p.a - A / 2, p.a + A / 2); x.stroke();
  },
  bigcut(x, p, t) {
    const e = easeOut(clamp01(t * 4));
    const w = p.w * (t < 0.2 ? 1 : 1 - (t - 0.2) / 0.8);
    const c = Math.cos(p.ang), s = Math.sin(p.ang);
    const x0 = p.x - c * 300, y0 = p.y - s * 300;
    const x1 = x0 + c * 600 * e, y1 = y0 + s * 600 * e;
    x.globalAlpha = 0.5 * (1 - t); x.strokeStyle = p.glow; x.lineWidth = w * 4;
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    x.globalAlpha = 1 - t * 0.7; x.strokeStyle = p.color; x.lineWidth = w;
    x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
  },
  petal2(x, p, t) {
    x.globalAlpha = t > 0.7 ? (1 - t) / 0.3 : 1;
    x.save();
    x.translate(p.x, p.y);
    x.rotate(p.rot + (p.spin * p.age) / 1000);
    x.scale(1, Math.abs(Math.sin(p.age / 140 + p.phase)) * 0.8 + 0.2);
    x.beginPath(); x.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  rune(x, p, t) {
    const r = p.r * easeOut(clamp01(t * 3));
    const a = (t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4) * 0.9;
    x.globalAlpha = a;
    x.lineWidth = 0.7;
    x.beginPath(); x.ellipse(p.x, p.y, r, r * 0.32, 0, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.ellipse(p.x, p.y, r * 0.72, r * 0.23, 0, 0, Math.PI * 2); x.stroke();
    const rot = p.age / 300;
    for (const off of [0, Math.PI / 3]) {
      x.beginPath();
      for (let i = 0; i <= 3; i++) {
        const an = rot + off + (i * Math.PI * 2) / 3;
        const px = p.x + Math.cos(an) * r * 0.72, py = p.y + Math.sin(an) * r * 0.23;
        if (i) x.lineTo(px, py); else x.moveTo(px, py);
      }
      x.stroke();
    }
    x.globalAlpha = a * 0.4;
    x.drawImage(glowSprite(p.color), p.x - r, p.y - r * 0.7, r * 2, r * 1.4);
  },
};

export class Effects {
  constructor() {
    this.parts = [];
    this.bolts = [];
    this.flash = 0;
    this.flashColor = '#fff';
    this.tint = null;
    this.shakeT = 0;
    this.shakeAmp = 1;
    this.vig = null;
    // じかんの はやさ（たたかいの はやさ せってい）
    this.tempo = 1;
    this.W = BW;
    this.H = BH;
  }

  add(p) { this.parts.push({ life: 600, age: 0, size: 2, vx: 0, vy: 0, g: 0, ...p }); }

  burst(x, y, colors, n = 14, speed = 60, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color: colors[i % colors.length], life: 450 + Math.random() * 300, size: 1 + Math.random() * 2, ...opts });
    }
  }

  // ななめの きりさき（ang: かたむき、len: ながさ）
  slash(x, y, color = '#ffffff', n = 1, opts = {}) {
    const angs = opts.angs || [-0.8, 0.8, -0.2, 0.3];
    for (let i = 0; i < n; i++) {
      this.add({
        kind: 'slash', x: x + (i - (n - 1) / 2) * (opts.spread ?? 6), y, color, life: opts.life || 280, delay: (opts.delay || 0) + i * (opts.gap ?? 90),
        len: opts.len || 30, ang: angs[i % angs.length] + (opts.rot || 0), w: opts.w || 2, glow: opts.glow || null,
      });
    }
  }

  // しょうげきの ほし
  star(x, y, color = '#ffffff', size = 10, delay = 0, life = 260) {
    this.add({ kind: 'star', x, y, color, size, delay, life });
  }

  ring(x, y, color, size = 3, delay = 0, life = 380, r1 = 40) {
    this.add({ kind: 'ring', x, y, color, size, delay, life, r1 });
  }

  // したから とんでいく たま（じゅもん）
  proj(x1, y1, colors, { size = 3, travel = 300, delay = 0, from } = {}) {
    const x0 = from?.x ?? BW / 2 + (Math.random() - 0.5) * 30, y0 = from?.y ?? BH + 6;
    this.add({ kind: 'proj', x0, y0, x1, y1, x: x0, y: y0, colors, size, life: travel, delay });
  }

  // じめんから たつ はしら（こおり・ひかり）
  pillar(x, y, color, { w = 6, h = 46, delay = 0, life = 520, edge = '#ffffff' } = {}) {
    this.add({ kind: 'pillar', x, y, color, edge, w, h, delay, life });
  }

  // うずまき（かぜ・ほのおの たつまき）
  swirl(x, y, colors, { n = 24, rad = 16, h = 50, delay = 0, life = 700, size = 1.5 } = {}) {
    for (let k = 0; k < n; k++) {
      this.add({ kind: 'swirl', cx: x, cy: y + 12, x, y, ang: (k / n) * Math.PI * 4, rad: rad * (0.5 + Math.random() * 0.6), rise: h * (0.6 + Math.random() * 0.5), color: colors[k % colors.length], life, delay: delay + k * 12, size });
    }
  }

  // ↑↓ やじるし（つよく なる・よわく なる）
  arrows(x, y, color, up = true, n = 3, delay = 0) {
    for (let k = 0; k < n; k++) this.add({ kind: 'arrow', x: x + (k - (n - 1) / 2) * 9, y: y + (up ? 10 : -14), vy: up ? -32 : 32, color, up, life: 620, delay: delay + k * 80 });
  }

  // まほうじん（となえた とき）
  circle(color = '#9ad8ff', delay = 0) {
    this.add({ kind: 'circle', x: BW / 2, y: BH - 10, color, life: 420, delay });
  }

  // 三日月の ような 太い きりさき（弧）。a0→a1 へ のびる
  arc(x, y, { r = 28, a0 = -2.5, a1 = 0.5, w = 5, color = '#ffffff', glow = '#ffd66b', delay = 0, life = 300 } = {}) {
    this.add({ kind: 'arc', x, y, r, a0, a1, w, color, glow, delay, life });
  }

  // しょうげき（白い 円が はじける）
  impact(x, y, { r = 16, color = '#ffffff', delay = 0, life = 170 } = {}) {
    this.add({ kind: 'impact', x, y, r, color, delay, life });
  }

  // 集中線（大きな 一撃）
  speedLines(x, y, { color = '#ffffff', n = 16, delay = 0, life = 260, r0 = 18, r1 = 80 } = {}) {
    this.add({ kind: 'lines', x, y, color, n, r0, r1, delay, life, seed: Math.random() * 6 });
  }

  // はへん（岩・木・すな）
  debris(x, y, colors, n = 10, delay = 0, up = 90) {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = up * (0.5 + Math.random() * 0.8);
      this.add({ kind: 'chip', x: x + (Math.random() - 0.5) * 16, y: y + 8, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 260, color: colors[k % colors.length], life: 520 + Math.random() * 200, size: 2 + Math.random() * 2, delay });
    }
  }

  // 大きな 一撃の セット（しょうげき＋ほし＋わ＋火花）
  bigHit(x, y, { color = '#ffd66b', crit = false, delay = 0, heavy = false } = {}) {
    this.impact(x, y, { r: crit ? 26 : heavy ? 20 : 15, delay });
    this.star(x, y, color, crit ? 22 : heavy ? 17 : 13, delay + 20, 240);
    this.ring(x, y, color, heavy || crit ? 4 : 3, delay + 20, 320, crit ? 52 : 36);
    this.burst(x, y, ['#ffffff', color], crit ? 22 : 14, crit ? 130 : 95, { delay: delay + 20 });
    if (crit || heavy) this.speedLines(x, y, { delay, r1: crit ? 110 : 80, color: crit ? '#fff6b0' : '#ffffff' });
    if (crit) { this.flashAt(150, '#ffffff', delay); this.hitStop(200, delay); } else if (heavy) this.hitStop(110, delay);
  }

  // ───────────── こまかい エフェクト（ぶき・てきの うごき） ─────────────
  // ぼんやり ひかる（add: かさねると あかるく なる）
  glow(x, y, { color = '#ffffff', r = 16, delay = 0, life = 260, alpha = 1, add = true, grow = 0.5 } = {}) {
    this.add({ kind: 'glow', x, y, color, r, delay, life, a: alpha, add, grow });
  }

  // うごく けむり・ひかりの たま（ブレス など）。r0 → r1 に ふくらむ
  puff(x, y, { color = '#ffffff', vx = 0, vy = 0, r0 = 4, r1 = 14, delay = 0, life = 500, alpha = 0.8, add = false, drag = 1 } = {}) {
    this.add({ kind: 'puff', x, y, vx, vy, r0, r1, color, delay, life, a: alpha, add, drag });
  }

  // ふりぬく きせき（三日月）。S → P → E を とおる。w: ふとさ、after: ざんぞうの かず
  swipe(S, P, E, { w = 5, color = '#ffffff', glow = '#9ad8ff', core = '#ffffff', delay = 0, swing = 170, life = 380, after = 0, pow = 1.6, sy = 1 } = {}) {
    const c = arcThrough(S[0], S[1], P[0], P[1], E[0], E[1]);
    if (!c) return delay;
    this.add({ kind: 'trail', x: c.x, y: c.y, r: c.r, a0: c.a0, a1: c.a1, w, color, glow, core, delay, swing, life, after, pow, sy });
    // P を とおる じかん
    return delay + swing * Math.pow(c.f, 1 / pow);
  }

  // まっすぐな ほそい きりさき（ang: むき、len: ながさ、speed: のびる じかん）
  cut(x, y, { ang = 0.8, len = 34, w = 2, color = '#ffffff', glow = '#9ad8ff', delay = 0, life = 260, speed = 60 } = {}) {
    this.add({ kind: 'cut', x, y, ang, len, w, color, glow, delay, life, speed: Math.min(speed, life * 0.6), add: true });
  }

  // ひばな（すじに なって とぶ）。ang/spread で むきを しぼる
  sparks(x, y, { colors = ['#ffffff'], n = 10, speed = 90, ang = null, spread = Math.PI, life = 380, delay = 0, g = 60, size = 0.8, drag = 0.9, len = 7, add = true } = {}) {
    for (let i = 0; i < n; i++) {
      const a = ang === null ? Math.random() * Math.PI * 2 : ang + (Math.random() - 0.5) * spread * 2;
      const s = speed * (0.45 + Math.random() * 0.8);
      this.add({ kind: 'spark', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g, drag, len, color: colors[i % colors.length], size: size * (0.6 + Math.random() * 0.7), life: life * (0.6 + Math.random() * 0.6), delay, add });
    }
  }

  // ひろがる わ（sy: たてに つぶす。じめんの しょうげきは 0.3 くらい）
  shock(x, y, { r0 = 3, r1 = 30, color = '#ffffff', w = 1.5, delay = 0, life = 300, sy = 1, add = true } = {}) {
    this.add({ kind: 'shock', x, y, r0, r1, color, w, delay, life, sy, add });
  }

  // じめんの ひびわれ
  crack(x, y, { n = 5, len = 26, color = '#2a1a10', hi = '#ffd66b', delay = 0, life = 760, sy = 0.38 } = {}) {
    const lines = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.8;
      const L = len * (0.6 + Math.random() * 0.6);
      let px = 0, py = 0;
      const pts = [[0, 0]];
      for (let k = 1; k <= 4; k++) {
        const aa = a + (Math.random() - 0.5) * 0.9;
        px += Math.cos(aa) * L / 4;
        py += Math.sin(aa) * L / 4 * sy;
        pts.push([px, py]);
        if (k === 2 && Math.random() < 0.6) {
          const ba = aa + (Math.random() < 0.5 ? -0.8 : 0.8);
          lines.push([[px, py], [px + Math.cos(ba) * L / 4, py + Math.sin(ba) * L / 4 * sy]]);
        }
      }
      lines.push(pts);
    }
    this.add({ kind: 'crack', x, y, lines, color, hi, delay, life });
  }

  // ムチ（x0,y0 から x1,y1 へ しなって とどく。snap: とどく わりあい）
  lash(x0, y0, x1, y1, { color = '#e8c89a', glow = null, w = 2.4, delay = 0, life = 380, snap = 0.45, bow = -22, amp = 9, emit = null, links = false } = {}) {
    this.add({ kind: 'lash2', x0, y0, x1, y1, x: x1, y: y1, color, glow, w, delay, life, snap, bow, amp, emit, links, phase: Math.random() * 6, add: !!glow });
    return delay + life * snap;
  }

  // やりの つき（x0,y0 から x,y へ）。over: つきぬける ながさ
  spear(x0, y0, x, y, { len = 60, w = 2.5, color = '#ffffff', glow = '#9ad8ff', tip = '#ffffff', delay = 0, travel = 80, hold = 50, life = 260, over = 10 } = {}) {
    this.add({ kind: 'spear', x0, y0, x1: x, y1: y, x, y, len, w, color, glow, tip, delay, travel, hold, life, over, add: true });
    return delay + travel;
  }

  // きらり（4ほんの ひかりの ほし）
  twinkle(x, y, { color = '#ffffff', size = 6, delay = 0, life = 360, vx = 0, vy = 0, g = 0, spin = 0, drag = 1 } = {}) {
    this.add({ kind: 'twinkle', x, y, vx, vy, g, color, size, delay, life, spin, drag, add: true });
  }

  // しずく（どく・みず）
  drop(x, y, { color = '#b06ae0', vx = 0, vy = 0, g = 260, size = 1.4, delay = 0, life = 600 } = {}) {
    this.add({ kind: 'drop', x, y, vx, vy, g, color, size, delay, life });
  }

  // あわ
  bubble(x, y, { color = '#bfe6ff', size = 1.6, vy = -30, delay = 0, life = 700 } = {}) {
    this.add({ kind: 'bubble', x, y, vx: 0, vy, color, size, delay, life, phase: Math.random() * 6 });
  }

  // いなずま（x0,y0 から x1,y1 へ ギザギザ）
  zap(x0, y0, x1, y1, { color = '#fff6b0', glow = '#9ad8ff', w = 1.2, delay = 0, life = 300, forks = 1 } = {}) {
    this.add({ kind: 'zap', x0, y0, x1, y1, x: x1, y: y1, color, glow, w, delay, life, forks, step: -1, add: true });
  }

  // キバが とじる（サメのキバ・かみつき）
  fang(x, y, { color = '#ffffff', glow = '#5ab8e8', size = 1, delay = 0, life = 380 } = {}) {
    this.add({ kind: 'fang', x, y, color, glow, size, delay, life });
  }

  // かぜの すじ（dir: 1=みぎへ -1=ひだりへ）
  gust(x, y, { len = 60, amp = 4, color = '#e8fff0', w = 1, dir = 1, delay = 0, life = 380 } = {}) {
    this.add({ kind: 'gust', x, y, len, amp, color, w, dir, delay, life, phase: Math.random() * 6, add: true });
  }

  // ひらく おうぎ（かなめ x,y。a: むき、spread: ひらく はば）
  fanShape(x, y, { r = 30, a = -Math.PI / 2, spread = 1.6, color = '#ffe0f0', rib = '#ffffff', delay = 0, life = 360, ribs = 7 } = {}) {
    this.add({ kind: 'fanshape', x, y, r, a, spread, color, rib, delay, life, ribs });
  }

  // がめんを よこぎる 大きな きりさき（かいしん）
  bigCut(x, y, { ang = 0.5, color = '#ffffff', glow = '#9ad8ff', w = 2.5, delay = 0, life = 300 } = {}) {
    this.add({ kind: 'bigcut', x, y, ang, color, glow, w, delay, life, add: true });
  }

  // はなびら・はね・は（くるくる まう）
  petal(x, y, { color = '#f7a1c4', vx = 0, vy = 0, size = 1.8, delay = 0, life = 800, g = 30 } = {}) {
    this.add({ kind: 'petal2', x, y, vx, vy, g, color, size, delay, life, rot: Math.random() * 6, spin: (Math.random() - 0.5) * 16, phase: Math.random() * 6 });
  }

  // まほうじん（じめんに ひろがる）
  rune(x, y, { color = '#c8a8ff', r = 20, delay = 0, life = 520 } = {}) {
    this.add({ kind: 'rune', x, y, color, r, delay, life, add: true });
  }

  // あつまる ひかり（ためる）
  converge(x, y, { colors = ['#ffffff'], n = 12, r = 30, delay = 0, life = 300, size = 0.9, sy = 0.8 } = {}) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const rr = r * (0.7 + Math.random() * 0.5);
      const lf = life * (0.7 + Math.random() * 0.3);
      const sx = x + Math.cos(a) * rr, sy2 = y + Math.sin(a) * rr * sy;
      this.add({ kind: 'spark', x: sx, y: sy2, vx: (x - sx) / (lf / 1000), vy: (y - sy2) / (lf / 1000), g: 0, drag: 1, len: 6, color: colors[i % colors.length], size, life: lf, delay: delay + Math.random() * 60, add: true });
    }
  }

  // がめんの ふちが そまる（みかたが いたい とき）
  vignette(color = '#ff2a2a', ms = 380, a = 0.5) {
    this.vig = { color, life: ms, age: 0, a };
  }

  // ぶきの こうげき（id が あれば ぶきごとに かわる）
  // へんじ: あたる までの じかん（ms）
  weaponStrike(targets, cat, crit, id = null, mon = null) {
    const look = weaponLook(id, cat, mon);
    let hit = 0;
    targets.forEach((t, i) => { hit = Math.max(hit, playWeapon(this, t, look, crit, i * 70)); });
    return hit;
  }

  // anim の しゅるいで エフェクトを だす
  // opts: { crit, element, fromAlly }
  play(anim, targets, element, opts = {}) {
    const crit = !!opts.crit;
    const ec = COL[element] || null;
    const spell = /^(fire|ice|wind|blast|void|dark1|minadein|bolt|meteor)/.test(anim);
    if (spell && opts.fromAlly !== false) this.circle((ec || COL.light)[0]);
    const all = targets.length > 1;
    targets.forEach((t, ti) => {
      const { x, y } = t;
      const d = ti * (all ? 70 : 0); // ぜんたい こうげきは すこし ずらす
      switch (anim) {
        // ── けん ──
        case 'slash_heavy':
          this.arc(x, y, { r: crit ? 36 : 30, a0: -2.6, a1: 0.6, w: crit ? 7 : 5, glow: '#ffd66b', delay: d });
          this.bigHit(x, y, { crit, heavy: true, delay: d + 110 });
          break;
        case 'slash_fast': // 海波斬: みずの ように すばやい 2れん
          this.slash(x, y, '#bfe6ff', 2, { angs: [-0.6, 0.6], len: 30, gap: 70, glow: '#5ab8e8', delay: d });
          this.burst(x, y + 4, ['#9ae6ff', '#e6fbff', '#5ab8e8'], 14, 55, { delay: d + 120, g: 120 });
          break;
        case 'slash_light': // 空裂斬: ひかりの きりさき
          this.slash(x, y, '#fff6b0', 1, { len: 38, w: 3, glow: '#ffffff', delay: d });
          this.pillar(x, y + 14, 'rgba(255,246,176,0.55)', { w: 5, h: 40, delay: d + 120, life: 380 });
          this.burst(x, y, COL.light, 14, 50, { delay: d + 120 });
          break;
        case 'slash_multi':
          [[-2.6, 0.5], [-0.6, 2.5], [-2.0, 1.0], [0.4, 3.3]].forEach(([a0, a1], k) => {
            this.arc(x + (k % 2 ? 4 : -4), y, { r: 24, a0, a1, w: 4, glow: '#9ad8ff', delay: d + k * 80, life: 220 });
            this.impact(x, y, { r: 10, delay: d + k * 80 + 60 });
          });
          this.burst(x, y, ['#ffffff', '#9ad8ff'], 16, 100, { delay: d + 300 });
          break;
        case 'cross_slash': // クロスブレイク: 2人の 剣が 十字を えがく
          this.arc(x, y, { r: 36, a0: -2.4, a1: 0.7, w: 6, glow: '#ffd66b', delay: d });
          this.arc(x, y, { r: 36, a0: -0.7, a1: 2.4, w: 6, glow: '#9ad8ff', delay: d + 120 });
          this.bigHit(x, y, { crit: true, delay: d + 260, color: '#fff6b0' });
          break;
        case 'rock_smash': // 大地のいかり: 地面ごと 打ち上げる
          this.arc(x, y - 6, { r: 30, a0: -1.9, a1: 1.2, w: 6, glow: '#d8b070', delay: d });
          this.debris(x, y + 12, ['#a08060', '#6a5040', '#d8c0a0', '#8a7050'], 16, d + 120, 140);
          this.burst(x, y + 14, ['#d8c0a0', '#a08060'], 14, 70, { delay: d + 120, g: 120 });
          this.bigHit(x, y, { heavy: true, crit, delay: d + 120, color: '#ffd66b' });
          if (ti === 0) this.hitStop(260, d + 120);
          break;
        case 'strash': // アバンストラッシュ ふう
          this.slash(x, y, '#fff6b0', 3, { angs: [-0.8, 0.8, 0], spread: 2, gap: 90, len: 50, w: 4, glow: '#ffffff', delay: d });
          this.ring(x, y, '#fff6b0', 5, d + 300, 450, 60);
          this.burst(x, y, COL.light, 34, 130, { delay: d + 300 });
          this.flashAt(200, '#fffbe0', d + 300);
          this.hitStop(220);
          break;
        case 'mahouken': {
          const c = COL[element] || COL.light;
          this.slash(x, y, c[0], 2, { angs: [-0.7, 0.7], len: 40, w: 3, glow: c[2] || '#fff', delay: d });
          this.burst(x, y, c, 22, 90, { delay: d + 150 });
          if (element === 'fire') this.fireUp(x, y, 14, d + 150);
          if (element === 'ice') for (let k = 0; k < 6; k++) this.add({ kind: 'shard', x: x + (Math.random() - 0.5) * 24, y: y - 26, vy: 110, color: COL.ice[k % 3], life: 350, delay: d + 150 });
          if (element === 'wind') this.swirl(x, y, COL.wind, { n: 16, rad: 12, delay: d + 150, life: 500 });
          break;
        }
        // ── こぶし・け ──
        case 'punch': case 'kick':
          this.star(x, y, '#ffffff', crit ? 16 : 11, d);
          this.ring(x, y, '#ffd66b', 2, d, 260, 22);
          this.burst(x, y, ['#ffd66b', '#ffffff'], 10, 80, { delay: d });
          if (anim === 'kick') this.add({ kind: 'streak', x: x - 20, y: y + 6, vx: 160, vy: -30, color: '#ffffff', life: 220, delay: d });
          if (crit) this.hitStop(140);
          break;
        case 'punch_multi':
          for (let k = 0; k < 5; k++) {
            const px = x + (Math.random() - 0.5) * 22, py = y + (Math.random() - 0.5) * 16;
            this.star(px, py, k % 2 ? '#ffd66b' : '#ffffff', 8, d + k * 70, 200);
            this.burst(px, py, ['#ffd66b', '#ffffff'], 4, 60, { delay: d + k * 70 });
          }
          break;
        case 'holy_punch':
          this.star(x, y, '#ffffff', 16, d);
          this.pillar(x, y + 16, 'rgba(125,255,176,0.55)', { w: 10, h: 70, delay: d + 60, life: 500, edge: '#e8fff0' });
          this.burst(x, y, ['#ffffff', '#fff6b0', '#7dffb0'], 26, 100, { delay: d + 60 });
          this.flashAt(120, '#eaffef', d + 60);
          break;
        // ── ほのお ──
        case 'fire1': case 'fire2': case 'fire3': {
          const big = anim === 'fire3' ? 3 : anim === 'fire2' ? 2 : 1;
          this.proj(x, y, COL.fire, { size: 2 + big * 1.5, travel: 280 + big * 40, delay: d });
          const hit = d + 280 + big * 40;
          this.star(x, y, '#ffe07a', 8 + big * 5, hit);
          this.fireUp(x, y, 12 + big * 10, hit);
          this.burst(x, y, COL.fire, 8 + big * 8, 50 + big * 25, { delay: hit });
          if (big >= 2) this.ring(x, y, '#ff9a3a', big, hit, 400, 20 + big * 12);
          if (big === 3) { this.flashAt(220, '#ffd0a0', hit); this.hitStop(200, hit); }
          break;
        }
        case 'fire_wave': // ギラ: ほのおの なみが よこに はしる
          for (let k = 0; k < 10; k++) {
            const px = x - 26 + k * 6;
            this.add({ x: px, y: y + 14, vx: 0, vy: -45 - Math.random() * 40, color: COL.fire[k % 3], life: 480, size: 3, delay: d + k * 22 });
            this.add({ x: px, y: y + 10, vx: (Math.random() - 0.5) * 10, vy: -25, color: COL.fire[(k + 1) % 3], life: 380, size: 2, delay: d + k * 22 + 60 });
          }
          this.star(x, y, '#ffe07a', 9, d + 120);
          break;
        case 'fire_tornado':
          this.swirl(x, y, COL.fire, { n: 36, rad: 20, h: 70, delay: d, life: 800, size: 2.5 });
          this.flashAt(120, '#ffd0a0', d + 250);
          break;
        // ── こおり ──
        case 'ice1': // ヒャド: こおりの つぶが あつまって はじける
          for (let k = 0; k < 8; k++) {
            const a = (k / 8) * Math.PI * 2;
            this.add({ kind: 'shard', x: x + Math.cos(a) * 22, y: y + Math.sin(a) * 14, vx: -Math.cos(a) * 70, vy: -Math.sin(a) * 45, color: COL.ice[k % 3], life: 300, delay: d });
          }
          this.star(x, y, '#e6fbff', 12, d + 280);
          this.burst(x, y, COL.ice, 14, 60, { delay: d + 280 });
          break;
        case 'ice2': // ヒャダルコ: したから こおりの はしら
          for (let k = -1; k <= 1; k++) this.pillar(x + k * 9, y + 16, 'rgba(154,230,255,0.75)', { w: 6, h: 30 + (k === 0 ? 14 : 0), delay: d + (k + 1) * 60, life: 560 });
          this.burst(x, y + 6, COL.ice, 16, 70, { delay: d + 260 });
          break;
        // ── かぜ ──
        case 'wind1':
          this.swirl(x, y, COL.wind, { n: 22, rad: 14, h: 44, delay: d, life: 560 });
          for (let k = 0; k < 4; k++) this.slash(x + (k - 1.5) * 5, y, '#d8ffe0', 1, { len: 18, w: 1, delay: d + 100 + k * 60, angs: [k % 2 ? 0.6 : -0.6] });
          break;
        case 'wind2':
          this.swirl(x, y, COL.wind, { n: 40, rad: 22, h: 70, delay: d, life: 760, size: 2 });
          for (let k = 0; k < 6; k++) this.slash(x + (k - 2.5) * 5, y, '#ffffff', 1, { len: 22, w: 1, delay: d + 80 + k * 55, angs: [k % 2 ? 0.7 : -0.7] });
          this.flashAt(80, '#e8fff0', d + 200);
          break;
        // ── ばくはつ ──
        case 'blast1': case 'blast2': {
          const n = anim === 'blast2' ? 3 : 1;
          for (let k = 0; k < n; k++) {
            const px = x + (n > 1 ? (k - 1) * 12 : 0), py = y + (n > 1 ? (k % 2) * 6 - 3 : 0), dd = d + k * 110;
            this.star(px, py, '#ffffff', 14, dd, 220);
            this.ring(px, py, '#ffffff', 4, dd, 330, 36);
            this.ring(px, py, '#ff8a2a', 2, dd + 60, 380, 28);
            this.burst(px, py, COL.blast, 20, 120, { delay: dd, g: 90 });
          }
          this.flashAt(anim === 'blast2' ? 200 : 140, '#fff4d0', d);
          this.hitStop(anim === 'blast2' ? 220 : 140, d);
          break;
        }
        // ── ひかり・やみ・しょうめつ ──
        case 'void': // メドローア: ほのおと こおりが まじって しろい ひかりに
          this.proj(x, y, COL.fire, { size: 3, travel: 320, delay: d, from: { x: BW / 2 - 40, y: BH + 6 } });
          this.proj(x, y, COL.ice, { size: 3, travel: 320, delay: d, from: { x: BW / 2 + 40, y: BH + 6 } });
          this.add({ kind: 'orb', x, y, color: '#ffffff', r: 26, life: 520, delay: d + 320 });
          this.ring(x, y, '#c8a8ff', 6, d + 320, 500, 64);
          this.burst(x, y, COL.void, 30, 60, { delay: d + 360 });
          this.flashAt(260, '#f0e8ff', d + 320);
          this.hitStop(240, d + 320);
          break;
        case 'dark1':
          for (let k = 0; k < 3; k++) this.bolts.push({ x: x + (k - 1) * 8, life: 360, age: -d - k * 70, color: '#c8a8f0', to: y });
          this.burst(x, y, COL.dark, 18, 50, { delay: d + 120 });
          this.tintAt('rgba(40, 10, 60, 0.28)', 420);
          break;
        case 'minadein':
          for (let k = 0; k < 3; k++) this.bolts.push({ x: x + (k - 1) * 10, life: 520, age: -d - k * 90, color: '#fff6b0', to: y + 10 });
          this.add({ kind: 'orb', x, y, color: '#fff6b0', r: 22, life: 600, delay: d + 200 });
          this.burst(x, y, COL.bolt, 26, 110, { delay: d + 200 });
          this.flashAt(320, '#fffbe0', d);
          this.hitStop(260, d + 200);
          break;
        // ── かいふく・ほじょ（てきの ほう） ──
        case 'heal1': case 'heal2': case 'heal_dance':
          for (let k = 0; k < 14; k++) this.add({ x: x + (Math.random() - 0.5) * 22, y: y + 12, vx: 0, vy: -35 - Math.random() * 20, color: COL.heal[k % 3], life: 700, size: 1.5, delay: d + k * 20 });
          this.ring(x, y, '#7dffb0', 2, d, 420, 26);
          break;
        case 'revive':
          this.pillar(x, y + 16, 'rgba(255,246,176,0.6)', { w: 12, h: 80, delay: d, life: 700 });
          break;
        case 'buff': case 'charge': case 'guard': case 'warcry':
          this.ring(x, y, '#ffd66b', 3, d, 420, 30);
          this.arrows(x, y, '#ffd66b', true, 3, d);
          break;
        case 'debuff':
          this.arrows(x, y, '#b07ae0', false, 3, d);
          for (let k = 0; k < 8; k++) this.add({ x: x + (Math.random() - 0.5) * 20, y: y - 10, vx: 0, vy: 30, color: '#8a5ac8', life: 500, size: 2, delay: d });
          break;
        case 'sleep':
          this.add({ kind: 'z', x: x + 6, y: y - 10, vx: 8, vy: -14, color: '#ffffff', life: 1000, delay: d });
          this.add({ kind: 'z', x: x - 4, y: y - 4, vx: 6, vy: -12, color: '#c8e0ff', life: 1000, delay: d + 250 });
          for (let k = 0; k < 10; k++) this.add({ x: x + (Math.random() - 0.5) * 30, y: y - 20, vx: 0, vy: 18, color: '#f7c8e8', life: 700, size: 1, delay: d + k * 30 });
          break;
        case 'breath':
          this.tintAt('rgba(200, 230, 255, 0.25)', 500);
          break;
        case 'dance':
          this.burst(x, y, ['#f7a1c4', '#ffe066', '#9ad1ff'], 14, 50, { delay: d });
          for (let k = 0; k < 3; k++) this.star(x + (k - 1) * 12, y - 12, ['#f7a1c4', '#ffe066', '#9ad1ff'][k], 5, d + k * 90, 300);
          break;
        // ── モンスターの なかま ──
        case 'tackle':
          this.add({ kind: 'streak', x: x - 60, y: y + 4, vx: 380, vy: 0, color: '#ffffff', life: 150, delay: d, w: 10 });
          this.bigHit(x, y, { crit, heavy: true, delay: d + 140, color: '#9ad8ff' });
          this.debris(x, y + 10, ['#d8c0a0', '#a08060'], 6, d + 140, 80);
          break;
        case 'bite':
          this.add({ kind: 'bite', x, y, color: '#ffffff', life: 320, delay: d });
          this.burst(x, y + 2, ['#ff6464', '#ffffff'], 8, 60, { delay: d + 150 });
          break;
        case 'hit': case 'hit_all':
          this.bigHit(x, y, { crit, delay: d, color: '#ffffff' });
          break;
        case 'quake':
          this.burst(x, y + 16, ['#a08060', '#6a5040', '#d8c0a0'], 12, 50, { delay: d, g: 160 });
          break;
        // ── いかずち ──
        case 'bolt1': // ライデイン
          this.bolts.push({ x, life: 420, age: -d, color: '#fff6b0', to: y + 8 });
          this.star(x, y, '#ffffff', 14, d + 60, 260);
          this.burst(x, y, COL.bolt, 18, 90, { delay: d + 60 });
          this.flashAt(160, '#fffbe0', d);
          this.hitStop(140, d + 60);
          break;
        case 'bolt2': // ギガデイン・いかずち
          for (let k = 0; k < 4; k++) this.bolts.push({ x: x + (k - 1.5) * 9, life: 520, age: -d - k * 60, color: k % 2 ? '#9ad8ff' : '#fff6b0', to: y + 12 });
          this.add({ kind: 'orb', x, y, color: '#fff6b0', r: 20, life: 520, delay: d + 180 });
          this.ring(x, y, '#9ad8ff', 4, d + 180, 420, 44);
          this.burst(x, y, COL.bolt, 26, 120, { delay: d + 180 });
          this.flashAt(260, '#fffbe0', d);
          this.hitStop(220, d + 180);
          break;
        case 'gigabreak': // ギガブレイク・いなずま斬り: かみなりを まとった きりさき
          this.bolts.push({ x: x + 4, life: 360, age: -d, color: '#fff6b0', to: y });
          this.slash(x, y, '#fffbe0', 2, { angs: [-0.9, 0.9], len: 46, w: 4, gap: 110, glow: '#9ad8ff', delay: d + 140 });
          this.star(x, y, '#ffffff', crit ? 20 : 15, d + 250);
          this.burst(x, y, COL.bolt, 28, 130, { delay: d + 250 });
          this.flashAt(200, '#fffbe0', d + 250);
          this.hitStop(crit ? 260 : 200, d + 250);
          break;
        // ── ムチ・しゅりけん ──
        case 'whip':
          this.add({ kind: 'lash', x0: x - 70, y0: y + 34, x, y, color: '#e8c89a', w: 2, phase: Math.random() * 6, life: 380, delay: d });
          this.star(x, y, '#ffffff', crit ? 14 : 10, d + 200, 220);
          this.burst(x, y, ['#ffffff', '#e8c89a'], 8, 70, { delay: d + 200 });
          break;
        case 'shuriken':
          for (let k = 0; k < 3; k++) {
            const x0 = -8, y0 = y - 18 + k * 14;
            this.add({ kind: 'shuri', x0, y0, x1: x + (k - 1) * 4, y1: y + (k - 1) * 3, x: x0, y: y0, color: '#dfe4f0', size: 4, travel: 220, life: 300, delay: d + k * 50 });
          }
          this.star(x, y, '#ffffff', 9, d + 260, 200);
          this.burst(x, y, ['#ffffff', '#dfe4f0'], 8, 60, { delay: d + 260 });
          break;
        // ── 竜の騎士 ──
        case 'dragon_beam': // ドルオーラ: りゅうの とうきが まっすぐ とんでいく
          if (ti === 0) this.circle('#7dffb0', d);
          this.add({ kind: 'beam', x0: BW / 2, y0: BH + 4, x, y, color: '#b8ffd0', glow: '#2aa06a', w: 14, life: 620, delay: d + 150 });
          this.add({ kind: 'orb', x, y, color: '#b8ffd0', r: 30, life: 560, delay: d + 380 });
          this.ring(x, y, '#7dffb0', 6, d + 380, 520, 70);
          this.burst(x, y, ['#ffffff', '#b8ffd0', '#2aa06a'], 36, 140, { delay: d + 380 });
          this.flashAt(300, '#eaffef', d + 380);
          this.hitStop(300, d + 380);
          break;
        // ── しょうかん ──
        case 'summon': // 天地雷鳴士: まじんを よびだす
          if (ti === 0) {
            this.circle('#ff9a3a', d);
            this.add({ kind: 'orb', x: BW / 2, y: 30, color: 'rgba(255,120,40,0.8)', r: 34, life: 700, delay: d });
          }
          this.swirl(x, y, COL.fire, { n: 30, rad: 18, h: 60, delay: d + 300, life: 700, size: 2 });
          this.fireUp(x, y, 24, d + 380);
          this.burst(x, y, COL.fire, 24, 110, { delay: d + 420 });
          this.flashAt(220, '#ffd0a0', d + 420);
          this.hitStop(200, d + 420);
          break;
        // ── ほし・いんせき ──
        case 'meteor': {
          for (let k = 0; k < 2; k++) {
            const from = { x: x - 70 + k * 25 + (Math.random() - 0.5) * 20, y: -12 };
            this.proj(x + (k - 0.5) * 8, y, ['#ffd66b', '#ff8a2a', '#ffffff'], { size: 3 + k, travel: 360, delay: d + k * 120, from });
          }
          const hit = d + 480;
          this.star(x, y, '#ffffff', 16, hit, 240);
          this.ring(x, y, '#ffd66b', 4, hit, 400, 44);
          this.burst(x, y, COL.blast, 26, 130, { delay: hit, g: 90 });
          this.flashAt(200, '#fff4d0', hit);
          this.hitStop(200, hit);
          break;
        }
        case 'dark_slash': // あんこくの けん
          this.slash(x, y, '#c8a8f0', 2, { angs: [-0.8, 0.8], len: 40, w: 3, gap: 90, glow: '#5a2a8a', delay: d });
          this.burst(x, y, COL.dark, 20, 80, { delay: d + 120 });
          this.ring(x, y, '#8a5ac8', 3, d + 120, 380, 34);
          if (ti === 0) this.tintAt('rgba(40, 10, 60, 0.22)', 380);
          break;
        // ── あたらしい 職業の 技 ──
        case 'bat_swing': { // バットで かっとばす（カキーン）
          this.arc(x, y - 2, { r: 34, a0: Math.PI * 0.95, a1: 0.1, w: 6, glow: '#ffe07a', delay: d, life: 240 });
          this.bigHit(x, y, { crit, heavy: true, delay: d + 110, color: '#ffe07a' });
          if (ti === 0) this.add({ kind: 'ball', x0: x, y0: y, x1: BW + 20, y1: -20, x, y, color: '#ffffff', life: 520, delay: d + 120 });
          break;
        }
        case 'ball': { // 速い 球（ごう速球・魔球・160キロ）
          this.add({ kind: 'ball', x0: BW / 2, y0: BH + 8, x1: x, y1: y, x: BW / 2, y: BH + 8, color: '#ffffff', life: 200, delay: d, trail: true });
          this.bigHit(x, y, { crit, heavy: true, delay: d + 200, color: '#ffffff' });
          break;
        }
        case 'train': { // 電車が 走りぬける
          if (ti === 0) this.add({ kind: 'train', x: -90, y: Math.min(BH - 30, y + 6), vx: 520, vy: 0, color: '#3a8ad8', life: 700, delay: d });
          this.speedLines(x, y, { delay: d + 150, r1: 90 });
          this.bigHit(x, y, { crit, heavy: true, delay: d + 180 + ti * 40, color: '#9ad8ff' });
          break;
        }
        case 'cards': // めいし・カードを 投げる
          for (let k = 0; k < 3; k++) {
            const x0 = -8, y0 = y - 20 + k * 12;
            this.add({ kind: 'card', x0, y0, x1: x + (k - 1) * 5, y1: y + (k - 1) * 3, x: x0, y: y0, color: '#ffffff', travel: 200, life: 280, delay: d + k * 60 });
          }
          this.impact(x, y, { r: 12, delay: d + 240 });
          this.burst(x, y, ['#ffffff', '#dfe4f0'], 10, 70, { delay: d + 240 });
          break;
        case 'hearts': // 投げキッス・ラブリービーム
          for (let k = 0; k < 5; k++) this.add({ kind: 'heart', x: BW / 2 + (k - 2) * 10, y: BH - 4, x0: BW / 2 + (k - 2) * 10, y0: BH - 4, x1: x + (k - 2) * 4, y1: y, color: k % 2 ? '#ff8ac8' : '#ffc8e8', life: 420, delay: d + k * 50 });
          this.impact(x, y, { r: 16, color: '#ffd0ec', delay: d + 420 });
          this.burst(x, y, ['#ff8ac8', '#ffffff', '#ffc8e8'], 18, 90, { delay: d + 420 });
          break;
        case 'coins': // ぜに投げ・大型買収
          for (let k = 0; k < 10; k++) this.add({ kind: 'coin', x: x + (Math.random() - 0.5) * 34, y: y - 60 - Math.random() * 30, vx: 0, vy: 150 + Math.random() * 60, color: '#ffd66b', life: 520, delay: d + k * 30 });
          this.star(x, y, '#ffe07a', 14, d + 380, 260);
          this.burst(x, y, ['#ffd66b', '#fff6b0', '#ffffff'], 18, 110, { delay: d + 380 });
          break;
        case 'laugh': // ギャグ・大ばくしょう
          for (let k = 0; k < 6; k++) this.add({ kind: 'ha', x: x + (Math.random() - 0.5) * 36, y: y - 6 + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 20, vy: -28, color: k % 2 ? '#ffe066' : '#ffffff', life: 800, delay: d + k * 70 });
          break;
        case 'ice_arrow': // 氷の矢
          this.add({ kind: 'arrowshot', x0: BW / 2, y0: BH + 6, x1: x, y1: y, x: BW / 2, y: BH + 6, color: '#e6fbff', life: 220, delay: d });
          for (let k = 0; k < 8; k++) this.add({ kind: 'shard', x, y, vx: (Math.random() - 0.5) * 140, vy: (Math.random() - 0.5) * 100, color: COL.ice[k % 3], life: 380, delay: d + 220 });
          this.bigHit(x, y, { crit, delay: d + 220, color: '#9ae6ff' });
          break;
        case 'holy': // 聖なる光
          this.pillar(x, y + 18, 'rgba(255,246,176,0.7)', { w: 14, h: 90, delay: d, life: 620, edge: '#ffffff' });
          this.add({ kind: 'crossflash', x, y, color: '#fffbe0', life: 360, delay: d + 160 });
          this.burst(x, y, COL.light, 24, 90, { delay: d + 160 });
          if (ti === 0) this.flashAt(180, '#fffbe0', d + 160);
          break;
        case 'blizzard': // ブリザード
          if (ti === 0) {
            this.tintAt('rgba(220, 240, 255, 0.28)', 700);
            for (let k = 0; k < 40; k++) this.add({ kind: 'shard', x: Math.random() * BW + 40, y: -10 - Math.random() * 60, vx: -150, vy: 120 + Math.random() * 60, color: COL.ice[k % 4], life: 700, delay: d + k * 12 });
          }
          this.burst(x, y, COL.ice, 16, 80, { delay: d + 350 });
          this.impact(x, y, { r: 14, color: '#e6fbff', delay: d + 350 });
          break;
        case 'heal_ring': // いやしの輪
          if (ti === 0) this.add({ kind: 'ellipse', x: BW / 2, y: BH - 16, color: '#7dffb0', life: 700, delay: d, r1: 110 });
          for (let k = 0; k < 10; k++) this.add({ x: x + (Math.random() - 0.5) * 24, y: y + 12, vx: 0, vy: -40 - Math.random() * 20, color: COL.heal[k % 3], life: 700, size: 2, delay: d + k * 25 });
          break;
        case 'stage': // ステージ・インタビュー: スポットライト
          if (ti === 0) {
            for (let k = 0; k < 3; k++) this.add({ kind: 'spot', x: 50 + k * 78, y: BH, color: ['#ffe066', '#ff8ac8', '#9ad1ff'][k], life: 800, delay: d + k * 80 });
          }
          for (let k = 0; k < 3; k++) this.star(x + (k - 1) * 14, y - 14, ['#f7a1c4', '#ffe066', '#9ad1ff'][k], 7, d + 200 + k * 90, 320);
          break;
        default:
          this.bigHit(x, y, { crit, delay: d, color: '#ffffff' });
      }
    });
  }

  // ふつうの こうげき（ぶきの しゅるいで かわる。opts.id: ぶきの ID、opts.mon: まものの なかまの しゅるい）
  // へんじ: ダメージが でる までの じかん（ms）
  weaponHit(targets, weapon, crit, opts = {}) {
    return this.weaponStrike(targets, weapon || 'none', crit, opts.id || null, opts.mon || null);
  }

  // ほのおが たちのぼる
  fireUp(x, y, n, delay) {
    for (let k = 0; k < n; k++) this.add({ x: x + (Math.random() - 0.5) * 20, y: y + 10, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 50, color: COL.fire[k % 3], life: 500 + Math.random() * 300, size: 2 + Math.random() * 2, delay });
  }

  flashAt(ms, color, delay = 0) {
    this.add({ kind: 'flash', x: 0, y: 0, color, life: 1, delay, dur: ms });
  }

  tintAt(color, ms) {
    this.tint = { color, life: ms, age: 0 };
  }

  // こうげきが あたった しゅんかんに がめんが ゆれる
  // amp: ゆれの 大きさ（1 が ふつう）
  hitStop(ms, delay = 0, amp = 1) {
    this.add({ kind: 'shake', x: 0, y: 0, color: '#000', life: 1, delay, dur: ms, amp });
  }

  update(dt) {
    dt *= this.tempo || 1;
    for (const p of this.parts) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      if (p.kind === 'proj') {
        const t = Math.min(1, p.age / p.life);
        const e = t * t * (3 - 2 * t);
        p.x = p.x0 + (p.x1 - p.x0) * e;
        p.y = p.y0 + (p.y1 - p.y0) * e - Math.sin(t * Math.PI) * 18;
        // しっぽ
        if (Math.random() < 0.9) this.add({ x: p.x + (Math.random() - 0.5) * 3, y: p.y + (Math.random() - 0.5) * 3, vx: (Math.random() - 0.5) * 12, vy: 10, color: p.colors[Math.floor(Math.random() * p.colors.length)], life: 260, size: 1 + Math.random() * p.size * 0.6 });
        continue;
      }
      if (p.kind === 'shuri') {
        const t = Math.min(1, p.age / p.travel);
        p.x = p.x0 + (p.x1 - p.x0) * t;
        p.y = p.y0 + (p.y1 - p.y0) * t;
        p.rot = p.age / 35;
        continue;
      }
      if (p.kind === 'lash' || p.kind === 'beam' || p.kind === 'arc' || p.kind === 'impact' || p.kind === 'lines' || p.kind === 'crossflash' || p.kind === 'ellipse' || p.kind === 'spot') continue;
      if (p.kind === 'ball' || p.kind === 'card' || p.kind === 'heart' || p.kind === 'arrowshot') {
        const t = Math.min(1, p.age / (p.travel || p.life));
        const e = p.kind === 'heart' ? t * t * (3 - 2 * t) : t;
        p.x = p.x0 + (p.x1 - p.x0) * e;
        p.y = p.y0 + (p.y1 - p.y0) * e - (p.kind === 'heart' ? Math.sin(t * Math.PI) * 14 : 0);
        p.rot = p.age / 40;
        if (p.trail && Math.random() < 0.9) this.add({ x: p.x, y: p.y, vx: 0, vy: 0, color: '#dfe4f0', life: 140, size: 2 });
        continue;
      }
      if (p.kind === 'swirl') {
        const t = p.age / p.life;
        const a = p.ang + t * 9;
        p.x = p.cx + Math.cos(a) * p.rad * (1 - t * 0.3);
        p.y = p.cy - t * p.rise + Math.sin(a) * p.rad * 0.3;
        continue;
      }
      if (p.kind === 'flash' && p.age >= 0 && !p.done) {
        p.done = true;
        this.flash = Math.max(this.flash, p.dur);
        this.flashColor = p.color;
        continue;
      }
      if (p.kind === 'shake' && !p.done) {
        p.done = true;
        this.shakeAmp = this.shakeT > 0 ? Math.max(this.shakeAmp, p.amp || 1) : (p.amp || 1);
        this.shakeT = Math.max(this.shakeT, p.dur);
        continue;
      }
      if (STILL.has(p.kind)) {
        if (p.kind === 'lash2' && p.emit && p.age < p.life * 0.8 && Math.random() < 0.8) {
          const pts = lashPts(p, p.age / p.life);
          const [ex, ey] = pts[Math.floor(pts.length * (0.4 + Math.random() * 0.6)) - 1] || pts[pts.length - 1];
          this.add({ kind: 'spark', x: ex, y: ey, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 40, g: -40, drag: 0.96, len: 4, color: p.emit[Math.floor(Math.random() * p.emit.length)], size: 0.9 + Math.random() * 0.8, life: 300 + Math.random() * 200, add: true });
        }
        continue;
      }
      if (p.drag && p.drag !== 1) {
        const k = Math.pow(p.drag, dt / 16);
        p.vx *= k;
        p.vy *= k;
      }
      if (p.kind === 'petal2') {
        p.x += Math.sin(p.age / 110 + p.phase) * 18 * dt / 1000;
        p.vx *= Math.pow(0.94, dt / 16);
        p.vy = Math.min(p.vy, 40);
      }
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += (p.g || 0) * dt / 1000;
    }
    this.parts = this.parts.filter((p) => p.age < p.life || p.delay > 0);
    for (const b of this.bolts) b.age += dt;
    this.bolts = this.bolts.filter((b) => b.age < b.life);
    if (this.flash > 0) this.flash -= dt;
    if (this.shakeT > 0) this.shakeT -= dt;
    if (this.tint) {
      this.tint.age += dt;
      if (this.tint.age > this.tint.life) this.tint = null;
    }
    if (this.vig) {
      this.vig.age += dt;
      if (this.vig.age > this.vig.life) this.vig = null;
    }
  }

  // ゆれの ずれ（がめんに つかう。こまかく かくので はんぱな かずも OK）
  get shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const k = Math.min(1, this.shakeT / 120) * (this.shakeAmp || 1);
    return { x: (Math.random() - 0.5) * 6 * k, y: (Math.random() - 0.5) * 4 * k };
  }

  get busy() {
    return this.parts.length > 0 || this.bolts.length > 0;
  }

  // がめん ぜんたいの いろ（つぶより したに かく: こうげきの えが かくれない ように）
  drawOverlay(x) {
    if (this.tint) {
      x.fillStyle = this.tint.color;
      x.fillRect(-8, -8, BW + 16, BH + 16);
    }
    if (this.vig) {
      // がめんの ふちを そめる
      const v = this.vig;
      const k = 1 - v.age / v.life;
      const [r, g, b] = hexToRgb(v.color);
      const gr = x.createRadialGradient(BW / 2, BH / 2, BH * 0.32, BW / 2, BH / 2, BW * 0.62);
      gr.addColorStop(0, `rgba(${r},${g},${b},0)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},${(v.a * k).toFixed(3)})`);
      x.fillStyle = gr;
      x.fillRect(-8, -8, BW + 16, BH + 16);
    }
    if (this.flash > 0) {
      x.globalAlpha = Math.min(0.8, this.flash / 200);
      x.fillStyle = this.flashColor;
      x.fillRect(-8, -8, BW + 16, BH + 16);
      x.globalAlpha = 1;
      if (this.flash <= 0) this.flashColor = '#fff';
    }
  }

  draw(x) {
    this.drawOverlay(x);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    // ひばなは いろ・ふとさ・こさ ごとに まとめて 1かいで かく（かるく する）
    const sparks = new Map();
    for (const p of this.parts) {
      if (p.delay > 0 || p.kind === 'flash' || p.kind === 'shake') continue;
      const t = Math.min(1, p.age / p.life);
      if (p.kind === 'spark') {
        const a = Math.ceil(Math.max(0, 1 - t * t) * 4) / 4;
        if (a <= 0) continue;
        const key = `${p.color}|${Math.round(p.size * 4) / 4}|${a}|${p.add ? 1 : 0}`;
        let arr = sparks.get(key);
        if (!arr) sparks.set(key, (arr = []));
        const sp = Math.hypot(p.vx, p.vy) || 1;
        const L = Math.min(p.len, sp * 0.035 + 0.4);
        arr.push(p.x, p.y, p.x - (p.vx / sp) * L, p.y - (p.vy / sp) * L);
        continue;
      }
      x.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      x.globalAlpha = Math.max(0, 1 - t * 0.9);
      x.fillStyle = p.color;
      x.strokeStyle = p.color;
      if (FINE[p.kind]) {
        FINE[p.kind](x, p, t, this);
        continue;
      }
      switch (p.kind) {
        case 'slash': {
          // のびて きえる ななめの せん（まわりに ひかり）
          const L = p.len * Math.min(1, t * 3.5);
          const c = Math.cos(p.ang), s = Math.sin(p.ang);
          const x0 = p.x - c * p.len / 2, y0 = p.y - s * p.len / 2;
          if (p.glow) {
            x.strokeStyle = p.glow;
            x.globalAlpha = Math.max(0, 0.45 * (1 - t));
            x.lineWidth = p.w + 3;
            x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + c * L, y0 + s * L); x.stroke();
            x.globalAlpha = Math.max(0, 1 - t * 0.9);
            x.strokeStyle = p.color;
          }
          x.lineWidth = p.w;
          x.beginPath(); x.moveTo(x0, y0); x.lineTo(x0 + c * L, y0 + s * L); x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'ring': {
          const r = 4 + t * (p.r1 || 40);
          x.lineWidth = Math.max(1, p.size * (1 - t));
          x.beginPath();
          x.arc(p.x, p.y, r, 0, Math.PI * 2);
          x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'star': {
          const r = p.size * (0.5 + Math.min(1, t * 3) * 0.7);
          x.beginPath();
          for (let i = 0; i < 16; i++) {
            const rr = i % 2 ? r * 0.3 : r;
            const a = (i / 16) * Math.PI * 2 + 0.2;
            x.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
          }
          x.closePath();
          x.fill();
          break;
        }
        case 'proj': {
          const r = p.size;
          // まわりの ひかり
          x.globalCompositeOperation = 'lighter';
          x.drawImage(glowSprite(p.colors[2] || p.colors[0]), p.x - r * 4, p.y - r * 4, r * 8, r * 8);
          x.globalCompositeOperation = 'source-over';
          x.fillStyle = p.colors[2] || '#fff';
          x.beginPath(); x.arc(p.x, p.y, r + 1.5, 0, Math.PI * 2); x.fill();
          x.fillStyle = p.colors[0];
          x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#ffffff';
          x.fillRect(Math.round(p.x - 1), Math.round(p.y - 1), 2, 2);
          break;
        }
        case 'pillar': {
          const g = Math.min(1, t * 4);
          const h = p.h * g;
          x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.5) * 2);
          x.fillStyle = p.color;
          x.fillRect(Math.round(p.x - p.w / 2), Math.round(p.y - h), p.w, Math.round(h));
          x.fillStyle = p.edge;
          x.fillRect(Math.round(p.x - p.w / 2), Math.round(p.y - h), 1, Math.round(h));
          x.fillRect(Math.round(p.x - p.w / 2), Math.round(p.y - h), p.w, 1);
          break;
        }
        case 'orb': {
          const r = p.r * Math.min(1, t * 2.5);
          x.globalAlpha = Math.max(0, 0.9 * (1 - t));
          x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
          x.globalAlpha = Math.max(0, 1 - t);
          x.fillStyle = '#ffffff';
          x.beginPath(); x.arc(p.x, p.y, r * 0.5, 0, Math.PI * 2); x.fill();
          break;
        }
        case 'arrow': {
          const ax = Math.round(p.x), ay = Math.round(p.y);
          const dir = p.up ? -1 : 1;
          x.fillRect(ax - 1, ay - 4, 2, 8);
          x.fillRect(ax - 3, ay + dir * 3, 6, 1);
          x.fillRect(ax - 2, ay + dir * 4, 4, 1);
          break;
        }
        case 'circle': {
          // まほうじん（したに ひろがる だえん）
          const r = 16 + t * 34;
          x.lineWidth = 1;
          x.globalAlpha = Math.max(0, 0.8 * (1 - t));
          x.beginPath(); x.ellipse(p.x, p.y, r, r * 0.28, 0, 0, Math.PI * 2); x.stroke();
          x.beginPath(); x.ellipse(p.x, p.y, r * 0.7, r * 0.2, 0, 0, Math.PI * 2); x.stroke();
          break;
        }
        case 'bite': {
          // うえと したから とじる キバ
          const k = Math.min(1, t * 3);
          const gap = 14 * (1 - k);
          for (let i = -2; i <= 2; i++) {
            x.fillRect(Math.round(p.x + i * 5 - 1), Math.round(p.y - 8 - gap), 2, 5);
            x.fillRect(Math.round(p.x + i * 5 - 1), Math.round(p.y + 3 + gap), 2, 5);
          }
          break;
        }
        case 'thrust': {
          const L = 56 * Math.min(1, t * 3.5);
          x.lineWidth = p.w || 2;
          x.beginPath(); x.moveTo(p.x, p.y + 56); x.lineTo(p.x, p.y + 56 - L); x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'lash': {
          // ムチ: したから しなって とどく
          const n = 18, upto = Math.max(2, Math.floor(n * Math.min(1, t * 2.8)));
          x.lineWidth = p.w || 2;
          x.beginPath();
          for (let i = 0; i <= upto; i++) {
            const u = i / n;
            const bx = p.x0 + (p.x - p.x0) * u, by = p.y0 + (p.y - p.y0) * u;
            const wob = Math.sin(u * Math.PI * 2.5 + p.phase) * (1 - u) * 14 * (1 - t);
            if (i === 0) x.moveTo(bx, by + wob);
            else x.lineTo(bx, by + wob);
          }
          x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'shuri': {
          const r = p.size || 4;
          x.beginPath();
          for (let i = 0; i < 8; i++) {
            const rr = i % 2 ? r * 0.35 : r;
            const a = (p.rot || 0) + (i / 8) * Math.PI * 2;
            x.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
          }
          x.closePath();
          x.fill();
          break;
        }
        case 'beam': {
          // ドルオーラ: ふとい ひかりの せん
          const g = Math.max(0, t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8);
          const w = p.w * g;
          const L = Math.hypot(p.x - p.x0, p.y - p.y0);
          x.save();
          x.translate(p.x0, p.y0);
          x.rotate(Math.atan2(p.y - p.y0, p.x - p.x0));
          x.globalAlpha = 0.5 * g;
          x.fillStyle = p.glow;
          x.fillRect(0, -w, L, w * 2);
          x.globalAlpha = g;
          x.fillStyle = p.color;
          x.fillRect(0, -w / 2, L, w);
          x.fillStyle = '#ffffff';
          x.fillRect(0, -w / 5, L, (w * 2) / 5);
          x.restore();
          break;
        }
        case 'arc': {
          // 三日月: 先に のびて、太さが へる
          const grow = Math.min(1, t * 3.2);
          const a1 = p.a0 + (p.a1 - p.a0) * grow;
          const fade = Math.max(0, 1 - Math.max(0, t - 0.35) / 0.65);
          x.lineCap = 'round';
          x.globalAlpha = 0.55 * fade;
          x.strokeStyle = p.glow;
          x.lineWidth = p.w + 5;
          x.beginPath(); x.arc(p.x, p.y, p.r, Math.min(p.a0, a1), Math.max(p.a0, a1)); x.stroke();
          x.globalAlpha = fade;
          x.strokeStyle = p.color;
          x.lineWidth = Math.max(1, p.w * (1 - t * 0.6));
          x.beginPath(); x.arc(p.x, p.y, p.r, Math.min(p.a0, a1), Math.max(p.a0, a1)); x.stroke();
          x.lineWidth = 1;
          x.lineCap = 'butt';
          break;
        }
        case 'impact': {
          const r = p.r * (0.35 + t * 0.9);
          x.globalAlpha = Math.max(0, 0.95 * (1 - t));
          x.beginPath(); x.arc(p.x, p.y, r, 0, Math.PI * 2); x.fill();
          break;
        }
        case 'lines': {
          x.globalAlpha = Math.max(0, 0.8 * (1 - t));
          x.lineWidth = 1;
          x.beginPath();
          for (let i = 0; i < p.n; i++) {
            const a = p.seed + (i / p.n) * Math.PI * 2 + (i % 2) * 0.12;
            const r0 = p.r0 + t * 10, r1 = p.r1 * (0.7 + ((i * 37) % 10) / 30);
            x.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0);
            x.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
          }
          x.stroke();
          break;
        }
        case 'chip':
          x.fillRect(Math.round(p.x), Math.round(p.y), Math.ceil(p.size), Math.ceil(p.size * 0.7));
          break;
        case 'ball':
          x.fillStyle = '#ffffff';
          x.beginPath(); x.arc(p.x, p.y, 3, 0, Math.PI * 2); x.fill();
          x.fillStyle = '#e04848';
          x.fillRect(Math.round(p.x - 2), Math.round(p.y - 1), 1, 2);
          x.fillRect(Math.round(p.x + 1), Math.round(p.y - 1), 1, 2);
          break;
        case 'train': {
          // 電車（先頭車両の 横から 見た 形）
          const tx = Math.round(p.x), ty = Math.round(p.y);
          x.globalAlpha = 1;
          x.fillStyle = '#e8ecf4'; x.fillRect(tx, ty - 18, 88, 18);
          x.fillStyle = p.color; x.fillRect(tx, ty - 8, 88, 4);
          x.fillStyle = '#2a3a5a';
          for (let i = 0; i < 5; i++) x.fillRect(tx + 8 + i * 15, ty - 15, 10, 6);
          x.fillStyle = '#e8ecf4'; x.beginPath(); x.moveTo(tx + 88, ty - 18); x.lineTo(tx + 100, ty - 4); x.lineTo(tx + 88, ty); x.fill();
          x.fillStyle = '#2a2a3a'; for (let i = 0; i < 4; i++) x.fillRect(tx + 10 + i * 22, ty, 6, 3);
          x.fillStyle = '#ffffff'; x.globalAlpha = 0.6;
          for (let i = 0; i < 4; i++) x.fillRect(tx - 20 - i * 14, ty - 14 + i * 4, 14, 1);
          break;
        }
        case 'card':
          x.save(); x.translate(p.x, p.y); x.rotate(p.rot || 0);
          x.fillRect(-3, -2, 6, 4);
          x.fillStyle = '#5a6a9a'; x.fillRect(-2, -1, 3, 1);
          x.restore();
          break;
        case 'heart': {
          const hx = Math.round(p.x), hy = Math.round(p.y);
          x.fillRect(hx - 3, hy - 2, 2, 2); x.fillRect(hx + 1, hy - 2, 2, 2);
          x.fillRect(hx - 3, hy, 6, 1); x.fillRect(hx - 2, hy + 1, 4, 1); x.fillRect(hx - 1, hy + 2, 2, 1);
          break;
        }
        case 'coin':
          x.fillStyle = '#ffd66b'; x.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, 4);
          x.fillStyle = '#fff6b0'; x.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 1, 2);
          break;
        case 'ha':
          x.font = 'bold 9px sans-serif';
          x.fillText('ハ', Math.round(p.x), Math.round(p.y));
          break;
        case 'arrowshot': {
          const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
          x.save(); x.translate(p.x, p.y); x.rotate(ang);
          x.fillRect(-16, -1, 16, 2);
          x.beginPath(); x.moveTo(4, 0); x.lineTo(-2, -4); x.lineTo(-2, 4); x.fill();
          x.restore();
          break;
        }
        case 'crossflash': {
          const L = 40 * Math.min(1, t * 3);
          x.globalAlpha = Math.max(0, 1 - t);
          x.fillRect(Math.round(p.x - 2), Math.round(p.y - L), 4, L * 2);
          x.fillRect(Math.round(p.x - L), Math.round(p.y - 2), L * 2, 4);
          break;
        }
        case 'ellipse': {
          const r = 10 + t * p.r1;
          x.globalAlpha = Math.max(0, 0.9 * (1 - t));
          x.lineWidth = 3;
          x.beginPath(); x.ellipse(p.x, p.y, r, r * 0.3, 0, 0, Math.PI * 2); x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'spot': {
          x.globalAlpha = Math.max(0, 0.35 * (1 - Math.abs(t - 0.5) * 2) + 0.05);
          x.beginPath(); x.moveTo(p.x - 4, 0); x.lineTo(p.x + 4, 0); x.lineTo(p.x + 26, p.y); x.lineTo(p.x - 26, p.y); x.fill();
          break;
        }
        case 'petal':
          x.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
          x.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1);
          break;
        case 'z':
          x.font = '8px monospace';
          x.fillText('Z', Math.round(p.x), Math.round(p.y));
          break;
        case 'streak':
          x.fillRect(Math.round(p.x), Math.round(p.y), p.w || 3, 1);
          break;
        case 'shard':
          x.fillRect(Math.round(p.x), Math.round(p.y), 1, 4);
          x.fillRect(Math.round(p.x) - 1, Math.round(p.y) + 1, 3, 1);
          break;
        case 'swirl':
          x.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size));
          break;
        default:
          x.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size));
      }
    }
    for (const [key, arr] of sparks) {
      const [color, w, a, add] = key.split('|');
      x.globalCompositeOperation = add === '1' ? 'lighter' : 'source-over';
      x.globalAlpha = +a;
      x.strokeStyle = color;
      x.lineWidth = +w || 0.5;
      x.beginPath();
      for (let i = 0; i < arr.length; i += 4) { x.moveTo(arr[i], arr[i + 1]); x.lineTo(arr[i + 2], arr[i + 3]); }
      x.stroke();
    }
    x.globalAlpha = 1;
    x.globalCompositeOperation = 'source-over';
    x.lineCap = 'butt';
    for (const b of this.bolts) {
      if (b.age < 0) continue;
      x.strokeStyle = b.age % 100 < 50 ? '#ffffff' : (b.color || '#fff6b0');
      x.lineWidth = 2;
      x.beginPath();
      let px = b.x + (Math.random() - 0.5) * 10, py = 0;
      const to = b.to ?? 110;
      x.moveTo(px, py);
      while (py < to) {
        py += 10 + Math.random() * 10;
        px += (Math.random() - 0.5) * 16;
        x.lineTo(px, Math.min(py, to));
      }
      x.stroke();
      x.lineWidth = 1;
    }
  }
}
