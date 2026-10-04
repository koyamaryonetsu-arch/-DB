// 2.5D（たちたい）がめんの ための え
// ・タイルの え を 1まいに ならべた「アトラス」
// ・かべの よこ・うえ、やま、はし など 3D だけで つかう え
// ・つぼ・さく・かんばん など たてて みせる「もの」の え（せなかは とうめい）
import { T } from '../../shared/tiles.js?v=e73ea3162cdf';
import { tileCanvas } from './tiles.js?v=e73ea3162cdf';
import { Painter, prand, makeCanvas, ctxOf, shade } from './pixel.js?v=e73ea3162cdf';
import { paintStorm } from './tiles-ch4.js?v=e73ea3162cdf';

const TAU = Math.PI * 2;

// ───────────── アトラス ─────────────
export class Atlas {
  constructor(size = 512) {
    this.size = size;
    this.cols = Math.floor(size / 16);
    this.canvas = makeCanvas(size, size);
    this.ctx = ctxOf(this.canvas);
    this.slots = new Map();
    this.n = 0;
  }

  // key の え を いれて UV（はんぴくせる うちがわ）を かえす
  uv(key, draw) {
    let r = this.slots.get(key);
    if (r) return r;
    const i = this.n++;
    const cx = (i % this.cols) * 16, cy = Math.floor(i / this.cols) * 16;
    if (cy + 16 > this.size) throw new Error('atlas full');
    const c = draw();
    if (c) this.ctx.drawImage(c, cx, cy);
    const s = this.size, e = 0.5;
    // three.js は v=1 が がぞうの うえ
    r = { u0: (cx + e) / s, u1: (cx + 16 - e) / s, v0: 1 - (cy + 16 - e) / s, v1: 1 - (cy + e) / s };
    this.slots.set(key, r);
    return r;
  }
}

const C = {
  rock: '#8f8270', rockD: '#62574a', rockL: '#b5a78f', snow: '#f4f6ff', snowD: '#d7dbe8',
  wood: '#a8733e', woodD: '#7c5329', woodL: '#c89358',
  stone: '#9fa0ad', stoneD: '#77788a', stoneL: '#c2c3cf',
  dirt: '#9a7448', dirtD: '#7c5a36', dirtL: '#b48a58',
  sand: '#d7bf82', sandD: '#bfa66a',
  grass: '#5bab4b', grassD: '#4a953f', grassL: '#79c663',
  cave: '#2c2420', caveL: '#4b3d33',
  leaf: '#2f8a3a', leafD: '#1f6128', leafL: '#4aad4c',
  pine: '#2a7040', pineD: '#1b4d2c', pineL: '#3f8f55', trunk: '#6d4a2b',
  gold: '#f2c14e',
};

function noise(p, base, dots, seed, n = 10) {
  p.rect(0, 0, 16, 16, base);
  const r = prand(seed);
  for (let i = 0; i < n; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), dots[i % dots.length]);
}

// 3D だけの え（16×16）
const EXTRA = {
  rock_top: (p, v) => noise(p, C.rock, [C.rockD, C.rockL], v * 7 + 1, 14),
  snow_top: (p, v) => { noise(p, C.snow, [C.snowD, '#ffffff'], v * 5 + 2, 10); p.set(3, 12, C.rockL); p.set(11, 4, C.rockL); },
  rock_side: (p, v) => {
    p.rect(0, 0, 16, 16, C.rockD);
    const r = prand(v * 13 + 3);
    for (let y = 1; y < 16; y += 4) p.hline(0, 15, y, C.rock);
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? C.rockL : '#4e453b');
  },
  grass_top: (p, v) => {
    noise(p, C.grass, [C.grassD, C.grassL, '#3e8436'], v * 97 + 13, 12);
  },
  cliff_side: (p, v) => {
    p.rect(0, 0, 16, 16, C.dirt);
    p.rect(0, 0, 16, 3, C.grassD);
    p.hline(0, 15, 3, '#3e8436');
    const r = prand(v * 3 + 9);
    for (let i = 0; i < 9; i++) p.set(Math.floor(r() * 16), 4 + Math.floor(r() * 12), i % 2 ? C.dirtD : C.dirtL);
  },
  shore_side: (p, v) => noise(p, C.dirtD, [C.dirt, '#5f4428'], v * 11 + 4, 12),
  sand_side: (p, v) => noise(p, C.sandD, [C.sand, '#a88f58'], v * 17 + 6, 10),
  cave_side: (p, v) => noise(p, '#241d19', ['#1a1412', '#352b25'], v * 29 + 7, 12),
  wall_top_wood: (p) => { p.rect(0, 0, 16, 16, '#6b4524'); p.rect(1, 1, 14, 14, '#7c5330'); p.hline(1, 14, 7, '#6b4524'); },
  wall_top_stone: (p) => { p.rect(0, 0, 16, 16, '#6e6f80'); p.rect(1, 1, 14, 14, '#7f8092'); p.set(3, 3, '#9a9bab'); },
  cave_top: (p, v) => noise(p, '#1d1714', ['#2e2520', '#161110'], v * 31 + 3, 8),
  hedge_top: (p, v) => noise(p, '#2d7a35', ['#3f9747', '#5bb563', '#23632b'], v * 41 + 5, 16),
  hedge_side: (p, v) => { noise(p, '#256a2d', ['#2d7a35', '#1b5222'], v * 43 + 6, 14); p.hline(0, 15, 15, '#1b4d22'); },
  wood_top: (p) => { p.rect(0, 0, 16, 16, C.wood); for (let y = 0; y < 16; y += 4) p.hline(0, 15, y, C.woodD); p.hline(0, 15, 1, C.woodL); },
  wood_side: (p) => { p.rect(0, 0, 16, 16, C.woodD); for (let x = 0; x < 16; x += 4) p.vline(x, 0, 15, '#5b3a1e'); p.hline(0, 15, 0, C.wood); },
  stone_top: (p) => { p.rect(0, 0, 16, 16, C.stone); p.rect(1, 1, 14, 14, C.stoneL); p.rect(2, 2, 12, 12, C.stone); },
  stone_side: (p, v) => {
    p.rect(0, 0, 16, 16, C.stone);
    for (let y = 0; y < 16; y += 5) { p.hline(0, 15, y, C.stoneD); const o = (y / 5) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) p.vline(x, y, Math.min(15, y + 4), C.stoneD); }
  },
  table_top: (p) => { p.rect(0, 0, 16, 16, '#a86a32'); p.hline(0, 15, 0, '#c98b4c'); p.rect(5, 5, 6, 5, '#f0f0f0'); p.set(7, 6, '#d64d4d'); },
  counter_top: (p) => { p.rect(0, 0, 16, 16, '#b8773a'); p.hline(0, 15, 0, '#d49a5a'); p.hline(0, 15, 15, '#8a5528'); },
  plank_h: (p) => { p.rect(0, 0, 16, 16, C.wood); for (let x = 0; x < 16; x += 4) p.vline(x, 0, 15, C.woodD); p.hline(0, 15, 0, C.woodL); p.hline(0, 15, 15, C.woodD); },
  plank_v: (p) => { p.rect(0, 0, 16, 16, C.wood); for (let y = 0; y < 16; y += 4) p.hline(0, 15, y, C.woodD); p.vline(0, 0, 15, C.woodL); p.vline(15, 0, 15, C.woodD); },
  cave_plank: (p) => { p.rect(0, 0, 16, 16, '#7a5230'); for (let x = 0; x < 16; x += 4) p.vline(x, 0, 15, '#5a3a1e'); },
  pillar_side: (p) => { p.rect(0, 0, 16, 16, C.stoneD); p.rect(2, 0, 12, 16, C.stone); p.vline(4, 0, 15, C.stoneL); p.vline(12, 0, 15, '#6a6b7c'); },
  lintel: (p) => { p.rect(0, 0, 16, 16, '#5b3a1e'); p.hline(0, 15, 15, '#3a2410'); p.hline(0, 15, 1, '#8a5a2e'); },
  lintel_stone: (p) => { p.rect(0, 0, 16, 16, C.stoneD); p.hline(0, 15, 15, '#55566a'); p.hline(0, 15, 1, C.stoneL); },
  dark_hole: (p) => { p.rect(0, 0, 16, 16, '#0c0808'); p.set(4, 5, '#1c1414'); p.set(11, 9, '#1c1414'); },
  // ───── 第3章 ─────
  snow_side: (p, v) => { noise(p, '#c8d4ea', ['#e4ecf8', '#aab8d4'], v * 19 + 8, 12); p.hline(0, 15, 0, '#ffffff'); },
  snowrock_side: (p, v) => {
    p.rect(0, 0, 16, 16, '#5c6272');
    const r = prand(v * 13 + 5);
    for (let y = 1; y < 16; y += 4) p.hline(0, 15, y, '#7a8092');
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#a0a6b8' : '#464c5a');
    // 雪の すじ
    for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 13); p.hline(x, x + 2, Math.floor(r() * 14), '#e8eef8'); }
    p.hline(0, 15, 0, '#f4f8ff'); p.hline(0, 15, 1, '#dce6f4');
  },
  ice_top: (p, v) => { noise(p, '#9ad2f0', ['#e6f8ff', '#7ab8e0'], v * 23 + 4, 10); for (let i = 0; i < 5; i++) p.set(3 + i, 4 + i, '#ffffff'); },
  ice_side: (p, v) => {
    p.rect(0, 0, 16, 16, '#5a9ad0');
    const r = prand(v * 31 + 2);
    for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 14); p.vline(x, 1, 14, '#7ab8e8'); p.set(x + 1, 2, '#e0f4ff'); }
    p.hline(0, 15, 0, '#c8ecff'); p.hline(0, 15, 15, '#2a5a90');
  },
  ash_top: (p, v) => noise(p, '#4a3a3e', ['#2e2428', '#6a5658', '#c8401a'], v * 17 + 3, 12),
  ashrock_side: (p, v) => {
    p.rect(0, 0, 16, 16, '#3a2e32');
    const r = prand(v * 11 + 9);
    for (let y = 2; y < 16; y += 4) p.hline(0, 15, y, '#4e4044');
    for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#241c20' : '#ff6a1a');
  },
  beam_side: (p) => { p.rect(0, 0, 16, 16, '#6a4422'); for (let x = 1; x < 16; x += 5) p.vline(x, 0, 15, '#8a5a2e'); p.hline(0, 15, 0, '#9a6a3a'); },
  gate_side: (p) => {
    p.rect(0, 0, 16, 16, '#4a5a8a');
    for (let y = 0; y < 16; y += 5) { p.hline(0, 15, y, '#33406a'); const o = (y / 5) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) p.vline(x, y, Math.min(15, y + 4), '#33406a'); }
    p.hline(0, 15, 7, '#f2c14e');
  },
  flame_side: (p, v) => {
    p.rect(0, 0, 16, 16, '#3a0a24');
    const r = prand(v * 7 + 1);
    for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 14); const h = 6 + Math.floor(r() * 8); p.vline(x, 16 - h, 15, '#c8206a'); p.vline(x + 1, 18 - h, 15, '#ff5a9a'); p.set(x + 1, 17 - h, '#ffd0e8'); }
  },
  // ───── 第4章（砂の国）─────
  // 砂岩の 岩山の うえ（赤茶の 岩。白っぽく かわいた ところ・ひび・小石）
  sandstone_top: (p, v) => {
    noise(p, '#c27a4c', ['#b46e44', '#cc875a', '#ba7248'], v * 61 + 7, 26);
    const r = prand(v * 13 + 29);
    // 白っぽく かわいた ところ と、うすい ひび
    p.ellipse(3 + r() * 10, 3 + r() * 10, 2.8, 1.9, '#cc8a5c');
    p.ellipse(3 + r() * 10, 3 + r() * 10, 1.8, 1.2, '#d29262');
    let x = 2 + Math.floor(r() * 10), y = 2 + Math.floor(r() * 9);
    for (let i = 0; i < 4; i++) { p.set(x, y, '#a2603a'); if (i % 2) x++; else y++; }
    p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#e2a676'); p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#9c5a36');
  },
  // 砂岩の よこ（赤・だいだい・クリーム色の しま。となりの めんと しまが つながる）
  sandstone_side: (p, v) => {
    const bands = ['#e8b282', '#d08a58', '#c27448', '#dc9a68', '#b0603a', '#cc8452', '#a45632', '#c27a4c', '#8e4a2c'];
    const hs = [2, 2, 1, 2, 2, 1, 2, 2, 2];
    p.rect(0, 0, 16, 16, bands[bands.length - 1]);
    let y = 0;
    for (let b = 0; b < bands.length; b++) {
      for (let k = 0; k < hs[b]; k++, y++) {
        for (let x = 0; x < 16; x++) {
          const yy = y + Math.round(Math.sin(TAU * (x + v * 4) / 16) * 0.6);
          if (yy >= 0 && yy < 16) p.set(x, yy, bands[b]);
        }
      }
    }
    p.hline(0, 15, 0, '#f2c49a');
    const r = prand(v * 7 + 3);
    for (let i = 0; i < 3; i++) { const x = 1 + Math.floor(r() * 14), y0 = 3 + Math.floor(r() * 8); p.vline(x, y0, y0 + 2 + Math.floor(r() * 3), '#7a3e24'); }
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), 1 + Math.floor(r() * 15), i % 2 ? '#f0c08e' : '#8e4a2c');
  },
  // 砂丘の うえ（2.5D。かたちの かげは 3D で つける ので、うすい 風紋と 砂つぶ だけ）
  dune_top: (p, v) => {
    noise(p, '#dcb26c', ['#d2a660', '#e6c27e', '#d8ac66'], v * 47 + 11, 22);
    const r = prand(v * 29 + 3);
    for (let k = 0; k < 2; k++) {
      const len = 5 + Math.floor(r() * 5), x = 1 + Math.floor(r() * (14 - len)), y = 2 + k * 7 + Math.floor(r() * 4);
      for (let i = 0; i < len; i++) {
        const yy = y + (i === 0 || i === len - 1 ? 1 : 0);
        p.set(x + i, yy + 1, '#c99c5a');
        if (i && i < len - 1) p.set(x + i, yy, '#ecca88');
      }
    }
    p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#f6dca0');
  },
  // 日干しれんがの かべの よこ・うえ
  adobe_side: (p) => {
    noise(p, '#cc9a6a', ['#d8aa7a', '#bc8a5c'], 91, 10);
    p.hline(0, 15, 0, '#e8c292'); p.hline(0, 15, 1, '#dcb282'); p.hline(0, 15, 2, '#b88454');
    p.hline(0, 15, 13, '#b48252'); p.hline(0, 15, 14, '#a07048'); p.hline(0, 15, 15, '#80583a');
  },
  wall_top_adobe: (p) => { p.rect(0, 0, 16, 16, '#a87446'); p.rect(1, 1, 14, 14, '#c08a5a'); p.hline(1, 14, 1, '#d8a672'); p.vline(1, 1, 14, '#d8a672'); p.set(5, 6, '#d8a672'); },
};

// 3D だけの え を ペインターに かく（テストでも つかう）
export function extraPainter(name, v = 0) {
  const p = new Painter(16, 16);
  EXTRA[name](p, v);
  return p;
}
export const hasExtra = (name) => typeof EXTRA[name] === 'function';
export function extraCanvas(name, v = 0) {
  return extraPainter(name, v).toCanvas();
}

// ───────────── たてて みせる もの（うしろは とうめい）─────────────
const PROPS = {
  [T.ROCK]: [16, 12, (p) => {
    p.ellipse(8, 7, 6.5, 4.8, C.rockD); p.ellipse(7.5, 6, 5.5, 4, C.rock); p.ellipse(6.4, 4.8, 2.8, 1.8, C.rockL);
  }],
  [T.FENCE]: [16, 12, (p) => {
    p.hline(0, 15, 4, '#b07a44'); p.hline(0, 15, 5, '#8a5a2e'); p.hline(0, 15, 8, '#8a5a2e');
    for (let x = 1; x < 16; x += 7) { p.rect(x, 1, 2, 11, '#7a4a22'); p.set(x, 1, '#b07a44'); }
  }],
  [T.SIGN]: [16, 16, (p) => {
    p.rect(7, 8, 2, 8, '#6b4220');
    p.rect(1, 1, 14, 8, '#8a5528'); p.rect(2, 2, 12, 6, '#d49a5a');
    p.hline(4, 11, 3, '#6b4220'); p.hline(4, 9, 5, '#6b4220');
  }],
  [T.POT]: [16, 14, (p) => {
    p.ellipse(8, 8, 5.4, 5.4, '#6b3818'); p.ellipse(8, 7.6, 4.6, 4.6, '#b8683a');
    p.rect(6, 1, 4, 3, '#8c4a24'); p.hline(5, 10, 1, '#a85a30');
    p.set(6, 6, '#d88a5a'); p.set(6, 7, '#d88a5a');
  }],
  [T.BARREL]: [16, 16, (p) => {
    p.rect(3, 2, 10, 14, '#7a4a22'); p.rect(4, 2, 8, 14, '#9a6232');
    p.hline(3, 12, 5, '#4a4a4a'); p.hline(3, 12, 11, '#4a4a4a');
    p.ellipse(8, 2.5, 4.5, 1.6, '#b87a42');
  }],
  [T.LAMP]: [16, 24, (p) => {
    p.rect(7, 7, 2, 16, '#3b3b48'); p.rect(5, 22, 6, 2, '#3b3b48');
    p.rect(5, 1, 6, 6, '#3b3b48'); p.rect(6, 2, 4, 4, '#ffe28a'); p.hline(4, 11, 0, '#55556a');
  }],
  [T.STATUE]: [16, 24, (p) => {
    p.rect(3, 19, 10, 5, '#77788a'); p.hline(3, 12, 19, '#c2c3cf');
    p.ellipse(8, 5, 3, 3, '#9fa0ad');
    p.rect(5, 8, 6, 11, '#9fa0ad'); p.vline(12, 2, 18, '#c2c3cf'); p.set(12, 1, '#c2c3cf');
    p.set(7, 4, '#77788a'); p.set(9, 4, '#77788a'); p.vline(6, 9, 17, '#c2c3cf');
  }],
  [T.CRYSTAL]: [16, 16, (p) => {
    const c1 = '#7d6af0', c2 = '#b8a8ff';
    p.rect(6, 1, 3, 15, c1); p.rect(3, 6, 3, 10, c1); p.rect(10, 4, 3, 12, c1);
    p.vline(7, 1, 14, c2); p.vline(4, 6, 14, c2); p.vline(11, 4, 14, c2); p.set(7, 2, '#ffffff');
  }],
  [T.CAVE_ENTRANCE]: null,
  // 第3章: レバー・かがり火
  [T.LEVER]: [16, 14, (p) => {
    p.rect(2, 8, 12, 6, '#3a3a48'); p.rect(3, 9, 10, 4, '#5a5a6e'); p.hline(3, 12, 9, '#7a7a8e');
    for (let i = 0; i < 7; i++) p.set(7 - i, 8 - i, '#8a8a9a');
    p.rect(0, 0, 3, 3, '#d8403a');
  }],
  [T.LEVER_ON]: [16, 14, (p) => {
    p.rect(2, 8, 12, 6, '#3a3a48'); p.rect(3, 9, 10, 4, '#5a5a6e'); p.hline(3, 12, 9, '#7a7a8e');
    for (let i = 0; i < 7; i++) p.set(8 + i, 8 - i, '#8a8a9a');
    p.rect(13, 0, 3, 3, '#4ac86a');
  }],
  [T.BRAZIER]: [16, 16, (p) => {
    p.rect(7, 8, 2, 6, '#5a5a6a'); p.rect(4, 13, 8, 3, '#4a4a58');
    p.rect(2, 4, 12, 4, '#4a4a58'); p.rect(3, 5, 10, 2, '#2a2a32'); p.hline(2, 13, 4, '#7a7a8a');
  }],
  // 第4章: サボテン（はしらの 形。左に ひかり）
  [T.CACTUS]: [16, 20, (p) => {
    const g = '#5a9a4e', gD = '#3a7034', gL = '#86c46c', gH = '#b4e08c';
    const col = (x0, y0, y1) => {
      p.rect(x0, y0 + 1, 4, y1 - y0, g);
      p.hline(x0 + 1, x0 + 2, y0, g);
      p.vline(x0, y0 + 1, y1, gL); p.vline(x0 + 3, y0 + 1, y1, gD); p.vline(x0 + 2, y0 + 2, y1, shade(g, -0.14));
      p.set(x0 + 1, y0, gH);
    };
    col(6, 1, 19);
    p.rect(2, 11, 4, 3, g); p.hline(2, 5, 11, gL); p.hline(2, 5, 13, gD);
    col(2, 5, 12);
    p.rect(10, 8, 3, 3, g); p.hline(10, 12, 8, gL); p.hline(10, 12, 10, gD);
    col(11, 3, 9);
    for (const [x, y] of [[5, 7], [10, 13], [7, 16], [1, 8], [15, 5], [10, 4], [8, 10]]) p.set(x, y, '#f4f0d8');
    p.set(7, 0, '#f27a9a'); p.set(8, 0, '#f8b4c8');
  }],
  [T.BRAZIER_LIT]: [16, 22, (p) => {
    p.rect(7, 14, 2, 6, '#5a5a6a'); p.rect(4, 19, 8, 3, '#4a4a58');
    p.rect(2, 10, 12, 4, '#4a4a58'); p.rect(3, 11, 10, 2, '#2a2a32'); p.hline(2, 13, 10, '#7a7a8a');
    p.rect(4, 3, 8, 8, '#ff7a2a'); p.rect(5, 1, 6, 9, '#ffb13a'); p.rect(7, 0, 2, 2, '#ffb13a'); p.rect(6, 5, 4, 5, '#fff0a0');
  }],
};

const propCache = new Map();
export function propCanvas(id) {
  if (propCache.has(id)) return propCache.get(id);
  const p = propPainter(id);
  const c = p ? p.toCanvas() : null;
  propCache.set(id, c);
  return c;
}
// もの の え を ペインターに（ふちどり つき。ない ときは null）
export function propPainter(id) {
  const d = PROPS[id];
  if (!d) return null;
  const [w, h, fn] = d;
  const p = new Painter(w, h);
  fn(p);
  p.outline('#1b1330');
  return p;
}
export const PROP_TILES = new Set(Object.keys(PROPS).map(Number).filter((k) => PROPS[k]));

// たからばこ（あいている・しまっている）
const chestCache = new Map();
export function chestCanvas(opened) {
  if (chestCache.has(opened)) return chestCache.get(opened);
  const p = new Painter(16, 14);
  p.rect(1, 3, 14, 11, '#1b1330');
  p.rect(2, 4, 12, 9, opened ? '#6a4220' : '#b8773a');
  p.rect(2, 4, 12, opened ? 2 : 3, opened ? '#3a2410' : '#d8995a');
  p.hline(2, 13, 7, C.gold);
  p.rect(7, 6, 2, 3, C.gold);
  if (opened) { p.rect(2, 0, 12, 4, '#8a5a2e'); p.hline(2, 13, 0, '#b8773a'); }
  const c = p.toCanvas();
  chestCache.set(opened, c);
  return c;
}

// ───────────── き・やね ─────────────
export function leafCanvas(kind = 'tree') {
  return leafPainter(kind).toCanvas();
}
export function leafPainter(kind = 'tree') {
  const p = new Painter(16, 16);
  // ヤシの 葉（第4章）: まんなかの すじから こまかい 葉が ななめに のびる。すきまは とうめい（v=0 が 根もと → 下）
  if (kind === 'palm') {
    for (let y = 0; y < 16; y++) {
      for (let k = 1; k < 8; k++) {
        // 葉の さきへ むかって ななめ 上に
        const ly = y - Math.floor(k / 2);
        if ((y + 16) % 3 === 0 && ly >= 0) { p.set(7 - k, ly, k < 3 ? '#4a9a46' : '#3f8a46'); p.set(8 + k, ly, k < 3 ? '#3a7a3c' : '#2f6c36'); }
      }
      p.set(7, y, '#9ad47a'); p.set(8, y, '#6cba5a');
    }
  } else if (kind === 'palmtrunk') {
    p.rect(0, 0, 16, 16, '#8e6a3a');
    for (let y = 1; y < 16; y += 3) { p.hline(0, 15, y, '#6a4a26'); p.hline(0, 15, y + 1, '#a8824c'); }
    for (let x = 0; x < 16; x += 5) p.vline(x, 0, 15, '#7a5a30');
  } else if (kind === 'coconut') noise(p, '#6a4422', ['#5a3a1c', '#82562e'], 83, 20);
  else if (kind === 'pine') noise(p, C.pine, [C.pineD, C.pineL], 77, 40);
  // 雪の つもった もみの木（第3章）
  else if (kind === 'snowpine') { noise(p, '#2a6048', ['#1b4434', '#3a7a5a'], 79, 30); for (let i = 0; i < 26; i++) p.set((i * 7) % 16, (i * 5 + (i >> 2)) % 16, i % 3 ? '#f4f8ff' : '#d8e4f4'); }
  else if (kind === 'trunk') { p.rect(0, 0, 16, 16, C.trunk); for (let x = 1; x < 16; x += 4) p.vline(x, 0, 15, '#553820'); }
  else noise(p, C.leaf, [C.leafD, C.leafL, '#3a9a44'], 55, 44);
  return p;
}

export function roofCanvas([base, dark, light]) {
  const p = new Painter(16, 16);
  p.rect(0, 0, 16, 16, base);
  for (let y = 3; y < 16; y += 4) {
    p.hline(0, 15, y, dark);
    for (let x = (y % 8 === 3) ? 2 : 6; x < 16; x += 8) p.vline(x, y - 3, y - 1, dark);
  }
  p.hline(0, 15, 0, light);
  return p.toCanvas();
}

// ───────────── 砂嵐の かべ（第4章）─────────────
// 2D の 砂嵐と おなじ もようの 64×64 の え（4×4 マスぶん。くりかえすと つなぎめが ない。f … コマ 0〜15）
export function stormPainter(f) {
  const p = new Painter(64, 64);
  paintStorm(p, 0, 0, f, 64, 64);
  return p;
}
export function stormCanvas(f) {
  return stormPainter(f).toCanvas();
}

// 砂嵐の まく（64×32。たてに たてて なんまいも かさねる）: 下ほど こく、上は ちぎれた 砂けむりで とうめいに。よこに くりかえす
const CURTAIN = [[94, 60, 32], [120, 80, 44], [146, 102, 58], [172, 128, 76], [200, 156, 98], [226, 188, 132]];
export function curtainPainter(seed = 0) {
  const p = new Painter(64, 32);
  const r = prand(seed * 977 + 31);
  for (let x = 0; x < 64; x++) {
    // 上の ふちの でこぼこ（タイルの はしで つながる）
    const top = 3 + 4 * (1 + Math.sin(TAU * (x / 32 + seed * 0.29))) + 3 * (1 + Math.sin(TAU * (x * 3 / 64 + seed * 0.61))) + 1.5 * Math.sin(TAU * x * 7 / 64);
    for (let y = Math.max(0, Math.floor(top)); y < 32; y++) {
      const t = (y - top) / (32 - top); // 0 = 上の ふち, 1 = 下
      if (t < 0.12 && (x + y) % 2) continue; // ふちは ふわっと
      const a = t < 0.12 ? 0.3 : t < 0.3 ? 0.46 : t < 0.55 ? 0.62 : 0.8;
      // 風の しま（よこに ながい）と、下ほど くらい
      const band = Math.sin(TAU * (y / 9 + 0.18 * Math.sin(TAU * (x / 64 + seed * 0.13)))) * 0.5 + 0.5;
      let k = Math.round(1 + band * 2.4 + (1 - t) * 1.6 + (r() - 0.5) * 0.9);
      k = Math.max(0, Math.min(CURTAIN.length - 1, k));
      const [cr, cg, cb] = CURTAIN[k];
      p.set(x, y, `rgba(${cr},${cg},${cb},${a})`);
    }
  }
  return p;
}
export function curtainCanvas(seed = 0) {
  return curtainPainter(seed).toCanvas();
}

// 砂嵐の 砂けむりの かたまり（32×32 が 4しゅるい。f … コマ 0〜3。もこもこ うごく）
// 左上から ひかり（上が 明るい 黄土色、下が こげ茶）。ふちは ドットで ちぎれる
const PUFF = ['#68442a', '#865a34', '#a27042', '#bc8a52', '#d4a666', '#eac488'];
const PUFF_BLOBS = [
  [[16, 18, 9], [9, 21, 6], [23, 21, 7], [13, 12, 6], [21, 13, 5]],
  [[15, 19, 10], [24, 22, 6], [7, 23, 5], [18, 11, 6]],
  [[10, 20, 8], [21, 19, 8], [15, 13, 7], [26, 24, 4], [5, 25, 4]],
  [[16, 20, 9], [8, 18, 6], [24, 17, 6], [16, 10, 5], [11, 25, 5], [22, 25, 5]],
];
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
export function puffPainter(f = 0) {
  const p = new Painter(128, 32);
  PUFF_BLOBS.forEach((blobs, vi) => {
    const bs = blobs.map(([x, y, r], i) => {
      const ph = TAU * (f / 4) + i * 1.7 + vi;
      return [x + Math.round(Math.sin(ph)), y + Math.round(Math.cos(ph * 0.7) * 0.6), r + Math.sin(ph + 0.8) * 0.9];
    });
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        // いちばん 中に いる まる（そこから の むきで 明るさ）
        let best = null, bd = -1;
        for (const [cx, cy, r] of bs) {
          const d = 1 - Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r;
          if (d > bd) { bd = d; best = [cx, cy, r]; }
        }
        if (bd <= 0) continue;
        const dith = BAYER4[(y & 3) * 4 + (x & 3)];
        if (bd < 0.12 && dith > bd / 0.12) continue; // ふちは ちぎれる
        const [cx, cy, r] = best;
        const nx = (x + 0.5 - cx) / r, ny = (y + 0.5 - cy) / r;
        const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
        const lum = (-nx * 0.55 - ny * 0.7 + nz * 0.45) * 0.5 + 0.5 - (y / 32) * 0.25;
        const t = Math.max(0, Math.min(PUFF.length - 1.001, lum * (PUFF.length - 0.6)));
        let k = Math.floor(t);
        if (t - k > dith) k++;
        p.set(vi * 32 + x, y, PUFF[Math.min(PUFF.length - 1, k)]);
      }
    }
  });
  return p;
}
export function puffCanvas(f = 0) {
  return puffPainter(f).toCanvas();
}

// タイルの え（16×16）を そのまま
export function tileArt(id, variant = 0, mask = 0) {
  return tileCanvas(id, variant, 0, mask);
}

