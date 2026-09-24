// たたかいの はいけいと エフェクト
import { makeCanvas, ctxOf } from './pixel.js';

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
  if (id === 'grass' || id === 'plains_east') {
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
  // じめん
  x.fillStyle = d.near;
  x.fillRect(0, hor, BW, 4);
  for (let y = hor + 4; y < BH; y++) {
    const t = (y - hor) / (BH - hor);
    x.fillStyle = t < 0.5 ? d.ground[0] : d.ground[1];
    x.fillRect(0, y, BW, 1);
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
export class Effects {
  constructor() {
    this.parts = [];
    this.bolts = [];
    this.flash = 0;
    this.flashColor = '#fff';
    this.tint = null;
  }

  add(p) { this.parts.push({ life: 600, age: 0, size: 2, vx: 0, vy: 0, g: 0, ...p }); }

  burst(x, y, colors, n = 14, speed = 60, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.4 + Math.random() * 0.8);
      this.add({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color: colors[i % colors.length], life: 450 + Math.random() * 300, size: 1 + Math.random() * 2, ...opts });
    }
  }

  slash(x, y, color = '#ffffff', n = 1) {
    for (let i = 0; i < n; i++) {
      this.add({ kind: 'slash', x: x + (i - (n - 1) / 2) * 6, y, color, life: 260, delay: i * 90, len: 26 });
    }
  }

  // anim の しゅるいで エフェクトを だす
  play(anim, targets, element) {
    const col = {
      fire: ['#ff5a2a', '#ff9a3a', '#ffe07a'], ice: ['#9ae6ff', '#e6fbff', '#5ab8e8'], wind: ['#d8ffe0', '#9af0b0', '#ffffff'],
      blast: ['#ffffff', '#ffd66b', '#ff8a2a'], bolt: ['#ffffff', '#fff6b0', '#9ad8ff'], light: ['#ffffff', '#fff6b0', '#ffd66b'],
      dark: ['#8a5ac8', '#3a2a5a', '#c8a8f0'], void: ['#ffffff', '#c8a8ff', '#8a5ac8'],
    };
    for (const t of targets) {
      const { x, y } = t;
      switch (anim) {
        case 'slash_heavy': this.slash(x, y, '#ffffff', 1); this.burst(x, y, ['#fff', '#ffd66b'], 8, 50); break;
        case 'slash_fast': this.slash(x, y, '#bfe6ff', 2); break;
        case 'slash_light': this.slash(x, y, '#fff6b0', 1); this.burst(x, y, col.light, 10, 40); break;
        case 'slash_multi': this.slash(x, y, '#ffffff', 3); break;
        case 'strash': this.slash(x, y, '#fff6b0', 3); this.burst(x, y, col.light, 26, 110); this.flash = 180; break;
        case 'mahouken': this.slash(x, y, (col[element] || col.light)[0], 2); this.burst(x, y, col[element] || col.light, 18, 80); break;
        case 'punch': case 'kick': this.burst(x, y, ['#ffd66b', '#ffffff'], 10, 70); break;
        case 'punch_multi': for (let k = 0; k < 3; k++) this.burst(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 12, ['#ffd66b', '#ffffff'], 6, 60, { delay: k * 90 }); break;
        case 'holy_punch': this.burst(x, y, ['#ffffff', '#fff6b0', '#7dffb0'], 26, 100); this.flash = 120; break;
        case 'fire1': case 'fire2': case 'fire3':
          for (let k = 0; k < (anim === 'fire1' ? 18 : 30); k++) this.add({ x: x + (Math.random() - 0.5) * 20, y: y + 10, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 50, color: col.fire[k % 3], life: 500 + Math.random() * 300, size: 2 + Math.random() * 2 });
          break;
        case 'fire_wave': case 'fire_tornado':
          for (let k = 0; k < 26; k++) {
            const a = k / 26 * Math.PI * 4;
            this.add({ x: x + Math.cos(a) * 14, y: y + 14 - k, vx: Math.cos(a + 1.5) * 30, vy: -40, color: col.fire[k % 3], life: 600, size: 2.5 });
          }
          break;
        case 'ice1': case 'ice2':
          for (let k = 0; k < 16; k++) this.add({ x: x + (Math.random() - 0.5) * 24, y: y - 40 - Math.random() * 20, vx: 0, vy: 90 + Math.random() * 40, color: col.ice[k % 3], life: 450, size: 2, kind: 'shard' });
          this.burst(x, y, col.ice, 10, 40, { delay: 300 });
          break;
        case 'wind1': case 'wind2':
          for (let k = 0; k < 20; k++) {
            const a = k / 20 * Math.PI * 2;
            this.add({ x: x + Math.cos(a) * 18, y: y + Math.sin(a) * 10, vx: -Math.sin(a) * 70, vy: Math.cos(a) * 30, color: col.wind[k % 3], life: 450, size: 1.5, kind: 'streak' });
          }
          break;
        case 'blast1': case 'blast2':
          this.add({ kind: 'ring', x, y, color: '#ffffff', life: 350, size: 4 });
          this.burst(x, y, col.blast, 24, 110);
          this.flash = 140;
          break;
        case 'void':
          this.add({ kind: 'ring', x, y, color: '#c8a8ff', life: 500, size: 6 });
          this.burst(x, y, col.void, 30, 60, { delay: 200 });
          this.flash = 220;
          this.flashColor = '#e8d8ff';
          break;
        case 'dark1': this.burst(x, y, col.dark, 18, 50); break;
        case 'minadein':
          this.bolts.push({ x, life: 500, age: 0 });
          this.burst(x, y, col.bolt, 20, 90, { delay: 200 });
          this.flash = 300;
          this.flashColor = '#fffbe0';
          break;
        case 'heal1': case 'heal2': case 'heal_dance':
          for (let k = 0; k < 12; k++) this.add({ x: x + (Math.random() - 0.5) * 20, y: y + 10, vx: 0, vy: -35 - Math.random() * 20, color: ['#7dffb0', '#ffffff', '#b8ffd0'][k % 3], life: 700, size: 1.5 });
          break;
        case 'buff': this.add({ kind: 'ring', x, y, color: '#ffd66b', life: 400, size: 3 }); break;
        case 'debuff': for (let k = 0; k < 10; k++) this.add({ x: x + (Math.random() - 0.5) * 20, y: y - 10, vx: 0, vy: 30, color: '#8a5ac8', life: 500, size: 2 }); break;
        case 'sleep': this.add({ kind: 'z', x: x + 6, y: y - 10, vx: 8, vy: -14, color: '#ffffff', life: 1000 }); this.add({ kind: 'z', x: x - 4, y: y - 4, vx: 6, vy: -12, color: '#c8e0ff', life: 1000, delay: 250 }); break;
        case 'breath': this.tint = { color: 'rgba(200, 230, 255, 0.25)', life: 500, age: 0 }; break;
        case 'dance': this.burst(x, y, ['#f7a1c4', '#ffe066', '#9ad1ff'], 12, 50); break;
        default: this.burst(x, y, ['#ffffff'], 6, 40);
      }
    }
  }

  update(dt) {
    for (const p of this.parts) {
      if (p.delay > 0) { p.delay -= dt; continue; }
      p.age += dt;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += (p.g || 0) * dt / 1000;
    }
    this.parts = this.parts.filter((p) => p.age < p.life);
    for (const b of this.bolts) b.age += dt;
    this.bolts = this.bolts.filter((b) => b.age < b.life);
    if (this.flash > 0) this.flash -= dt;
    if (this.tint) {
      this.tint.age += dt;
      if (this.tint.age > this.tint.life) this.tint = null;
    }
  }

  draw(x) {
    for (const p of this.parts) {
      if (p.delay > 0) continue;
      const t = p.age / p.life;
      x.globalAlpha = Math.max(0, 1 - t * 0.9);
      x.fillStyle = p.color;
      x.strokeStyle = p.color;
      switch (p.kind) {
        case 'slash': {
          const L = p.len * Math.min(1, t * 3);
          x.lineWidth = 2;
          x.beginPath();
          x.moveTo(p.x + 12 - L * 0.5, p.y - 14 + 0);
          x.lineTo(p.x + 12 - L, p.y - 14 + L * 0.9);
          x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'ring': {
          const r = 4 + t * 40;
          x.lineWidth = Math.max(1, p.size * (1 - t));
          x.beginPath();
          x.arc(p.x, p.y, r, 0, Math.PI * 2);
          x.stroke();
          x.lineWidth = 1;
          break;
        }
        case 'z':
          x.font = '8px monospace';
          x.fillText('Z', Math.round(p.x), Math.round(p.y));
          break;
        case 'streak':
          x.fillRect(Math.round(p.x), Math.round(p.y), 3, 1);
          break;
        case 'shard':
          x.fillRect(Math.round(p.x), Math.round(p.y), 1, 4);
          break;
        default:
          x.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 2), Math.ceil(p.size), Math.ceil(p.size));
      }
    }
    x.globalAlpha = 1;
    for (const b of this.bolts) {
      x.strokeStyle = b.age % 100 < 50 ? '#ffffff' : '#fff6b0';
      x.lineWidth = 2;
      x.beginPath();
      let px = b.x + (Math.random() - 0.5) * 10, py = 0;
      x.moveTo(px, py);
      while (py < 110) {
        py += 10 + Math.random() * 10;
        px += (Math.random() - 0.5) * 16;
        x.lineTo(px, py);
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
