// たたかいの はいけいと エフェクト
import { makeCanvas, ctxOf } from './pixel.js?v=5d38639d0719';

export const BW = 256;
export const BH = 144;

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

export class Effects {
  constructor() {
    this.parts = [];
    this.bolts = [];
    this.flash = 0;
    this.flashColor = '#fff';
    this.tint = null;
    this.shakeT = 0;
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
          this.slash(x, y, '#ffffff', 1, { len: crit ? 44 : 34, w: crit ? 4 : 3, glow: '#ffd66b', delay: d });
          this.star(x, y, '#fff6b0', crit ? 16 : 10, d + 90);
          this.burst(x, y, ['#fff', '#ffd66b'], 10, 60, { delay: d + 90 });
          if (crit) this.hitStop(160);
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
          this.slash(x, y, '#ffffff', 4, { angs: [-0.8, 0.8, -0.1, 1.4], spread: 4, gap: 70, len: 28, glow: '#9ad8ff', delay: d });
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
          this.star(x, y, '#ffffff', crit ? 16 : 12, d);
          this.ring(x, y, '#9ad8ff', 3, d, 280, 26);
          this.burst(x, y, ['#ffffff', '#9ad8ff'], 12, 90, { delay: d });
          break;
        case 'bite':
          this.add({ kind: 'bite', x, y, color: '#ffffff', life: 320, delay: d });
          this.burst(x, y + 2, ['#ff6464', '#ffffff'], 8, 60, { delay: d + 150 });
          break;
        case 'hit': case 'hit_all':
          this.star(x, y, '#ffffff', 9, d);
          this.burst(x, y, ['#ffffff'], 6, 40, { delay: d });
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
        default:
          this.star(x, y, '#ffffff', 8, d);
          this.burst(x, y, ['#ffffff'], 6, 40, { delay: d });
      }
    });
  }

  // ふつうの こうげき（ぶきの しゅるいで かわる）
  weaponHit(targets, weapon, crit) {
    for (const t of targets) {
      const { x, y } = t;
      switch (weapon) {
        case 'claw': case 'none':
          this.play('punch', [t], null, { crit });
          if (weapon === 'claw') this.slash(x, y, '#dfe4f0', 3, { angs: [0.9, 0.9, 0.9], spread: 4, gap: 30, len: 20, w: 1 });
          break;
        case 'spear': // つき
          this.add({ kind: 'thrust', x, y, color: '#ffffff', life: 240 });
          this.star(x, y, '#fff6b0', crit ? 14 : 9, 120);
          this.burst(x, y, ['#fff', '#ffd66b'], 8, 60, { delay: 120 });
          break;
        case 'staff': // なぐる
          this.star(x, y, '#ffffff', crit ? 16 : 11);
          this.ring(x, y, '#9ad8ff', 2, 0, 240, 20);
          this.burst(x, y, ['#fff', '#9ad8ff'], 8, 60);
          break;
        case 'axe':
          this.slash(x, y, '#ffffff', 1, { angs: [1.2], len: 36, w: 4, glow: '#ffb070' });
          this.star(x, y, '#ffd66b', crit ? 18 : 13, 80);
          this.burst(x, y, ['#fff', '#ffd66b', '#ff8a2a'], 12, 80, { delay: 80 });
          this.hitStop(crit ? 180 : 90, 80);
          break;
        case 'fan':
          this.slash(x, y, '#ffd0e8', 2, { angs: [-0.4, 0.4], len: 26, w: 2, glow: '#f7a1c4' });
          for (let k = 0; k < 8; k++) this.add({ kind: 'petal', x: x + (Math.random() - 0.5) * 20, y: y - 14, vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 20, color: k % 2 ? '#f7a1c4' : '#ffffff', life: 700, delay: 80 });
          break;
        case 'dagger':
          this.slash(x, y, '#ffffff', 2, { angs: [-0.9, 0.5], len: 20, w: 2, gap: 60 });
          this.star(x, y, '#ffffff', 8, 100);
          break;
        case 'whip':
          this.play('whip', [t], null, { crit });
          break;
        default: // けん
          this.play('slash_heavy', [t], null, { crit });
      }
      if (crit) {
        this.flashAt(140, '#ffffff', 60);
        this.hitStop(160, 60);
      }
    }
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
  hitStop(ms, delay = 0) {
    this.add({ kind: 'shake', x: 0, y: 0, color: '#000', life: 1, delay, dur: ms });
  }

  update(dt) {
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
      if (p.kind === 'lash' || p.kind === 'beam') continue;
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
        this.shakeT = Math.max(this.shakeT, p.dur);
        continue;
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
  }

  // ゆれの ずれ（がめんに つかう）
  get shakeOffset() {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    const k = Math.min(1, this.shakeT / 120);
    return { x: Math.round((Math.random() - 0.5) * 6 * k), y: Math.round((Math.random() - 0.5) * 4 * k) };
  }

  get busy() {
    return this.parts.length > 0 || this.bolts.length > 0;
  }

  draw(x) {
    for (const p of this.parts) {
      if (p.delay > 0 || p.kind === 'flash' || p.kind === 'shake') continue;
      const t = Math.min(1, p.age / p.life);
      x.globalAlpha = Math.max(0, 1 - t * 0.9);
      x.fillStyle = p.color;
      x.strokeStyle = p.color;
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
          const L = 30 * Math.min(1, t * 3);
          x.lineWidth = 2;
          x.beginPath(); x.moveTo(p.x, p.y + 30); x.lineTo(p.x, p.y + 30 - L); x.stroke();
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
        case 'petal':
          x.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
          x.fillRect(Math.round(p.x) + 1, Math.round(p.y) + 1, 1, 1);
          break;
        case 'z':
          x.font = '8px monospace';
          x.fillText('Z', Math.round(p.x), Math.round(p.y));
          break;
        case 'streak':
          x.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
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
    x.globalAlpha = 1;
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
    if (this.tint) {
      x.fillStyle = this.tint.color;
      x.fillRect(0, 0, BW, BH);
    }
    if (this.flash > 0) {
      x.globalAlpha = Math.min(0.8, this.flash / 200);
      x.fillStyle = this.flashColor;
      x.fillRect(0, 0, BW, BH);
      x.globalAlpha = 1;
      if (this.flash <= 0) this.flashColor = '#fff';
    }
  }
}
