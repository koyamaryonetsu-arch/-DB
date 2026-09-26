// 2.5D（たちたい）がめんの ための え
// ・タイルの え を 1まいに ならべた「アトラス」
// ・かべの よこ・うえ、やま、はし など 3D だけで つかう え
// ・つぼ・さく・かんばん など たてて みせる「もの」の え（せなかは とうめい）
import { T } from '../../shared/tiles.js?v=cb6fd0fb30e1';
import { tileCanvas } from './tiles.js?v=cb6fd0fb30e1';
import { Painter, prand, makeCanvas, ctxOf } from './pixel.js?v=cb6fd0fb30e1';

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
};

export function extraCanvas(name, v = 0) {
  const p = new Painter(16, 16);
  EXTRA[name](p, v);
  return p.toCanvas();
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
};

const propCache = new Map();
export function propCanvas(id) {
  if (propCache.has(id)) return propCache.get(id);
  const d = PROPS[id];
  let c = null;
  if (d) {
    const [w, h, fn] = d;
    const p = new Painter(w, h);
    fn(p);
    p.outline('#1b1330');
    c = p.toCanvas();
  }
  propCache.set(id, c);
  return c;
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
  const p = new Painter(16, 16);
  if (kind === 'pine') noise(p, C.pine, [C.pineD, C.pineL], 77, 40);
  else if (kind === 'trunk') { p.rect(0, 0, 16, 16, C.trunk); for (let x = 1; x < 16; x += 4) p.vline(x, 0, 15, '#553820'); }
  else noise(p, C.leaf, [C.leafD, C.leafL, '#3a9a44'], 55, 44);
  return p.toCanvas();
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

// タイルの え（16×16）を そのまま
export function tileArt(id, variant = 0, mask = 0) {
  return tileCanvas(id, variant, 0, mask);
}

