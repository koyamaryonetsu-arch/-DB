// マップの タイル（16×16 ドット）を プログラムで かく
import { T, TILE_INFO } from '../../shared/tiles.js';
import { hash2 } from '../../shared/rng.js';
import { Painter, shade, prand } from './pixel.js';

export const TS = 16;

const C = {
  grass: '#5bab4b', grassD: '#4a953f', grassL: '#79c663', blade: '#3e8436',
  dirt: '#caa367', dirtD: '#b38d55', dirtL: '#dcbb82',
  sand: '#ead79c', sandD: '#d7bf82',
  water: '#3c80d6', waterD: '#2e69bd', waterL: '#6ea8ec', foam: '#d7ecff',
  deep: '#2a58a8', deepL: '#3d6fc0',
  leaf: '#2f8a3a', leafD: '#1f6128', leafL: '#4aad4c', trunk: '#6d4a2b',
  pine: '#2a7040', pineD: '#1b4d2c', pineL: '#3f8f55',
  rock: '#8f8270', rockD: '#62574a', rockL: '#b5a78f', snow: '#f4f6ff',
  wood: '#a8733e', woodD: '#7c5329', woodL: '#c89358',
  stone: '#9fa0ad', stoneD: '#77788a', stoneL: '#c2c3cf',
  cave: '#4a4038', caveD: '#332b25', caveL: '#62564b', caveWall: '#2c2420', caveWallL: '#4b3d33',
  swamp: '#5f4a73', swampD: '#4a3a5c', swampL: '#7d6694',
  red: '#d9534f', gold: '#f2c14e', white: '#f8f8f8',
};

function grassBase(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, C.grass);
  const r = prand(v * 97 + 13 + seed);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 14) + 1;
    p.set(x, y, C.blade);
    p.set(x, y - 1, C.grassL);
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), C.grassD);
}

function waterBase(p, frame, v, deep = false) {
  const base = deep ? C.deep : C.water;
  p.rect(0, 0, 16, 16, base);
  const hi = deep ? C.deepL : C.waterL;
  const off = (frame * 5 + v * 3) % 16;
  for (let k = 0; k < 3; k++) {
    const y = (k * 6 + 2 + (v & 1) * 2) % 16;
    const x0 = (off + k * 7) % 16;
    for (let i = 0; i < 4; i++) p.set((x0 + i) % 16, y, hi);
    p.set((x0 + 1) % 16, y - 1 < 0 ? 15 : y - 1, hi);
  }
}

function foamEdges(p, mask, frame) {
  const f = C.foam;
  const wig = frame % 2;
  if (mask & 1) { p.hline(0, 15, 0, f); for (let x = wig; x < 16; x += 3) p.set(x, 1, f); }
  if (mask & 4) { p.hline(0, 15, 15, f); for (let x = wig; x < 16; x += 3) p.set(x, 14, f); }
  if (mask & 8) { p.vline(0, 0, 15, f); for (let y = wig; y < 16; y += 3) p.set(1, y, f); }
  if (mask & 2) { p.vline(15, 0, 15, f); for (let y = wig; y < 16; y += 3) p.set(14, y, f); }
}

function stoneBricks(p, base, dark, light, small = false) {
  p.rect(0, 0, 16, 16, base);
  const rowH = small ? 4 : 5;
  for (let y = 0; y < 16; y += rowH) {
    p.hline(0, 15, y, dark);
    const off = (y / rowH) % 2 ? 4 : 0;
    for (let x = off; x < 16; x += 8) p.vline(x, y, Math.min(15, y + rowH - 1), dark);
    p.hline(1, 14, y + 1, light);
  }
}

const painters = {
  [T.VOID]: (p) => p.rect(0, 0, 16, 16, '#000'),
  [T.GRASS]: (p, v) => grassBase(p, v),
  [T.FLOWERS]: (p, v) => {
    grassBase(p, v, 5);
    const r = prand(v * 31 + 7);
    const cols = ['#f25f5c', '#ffe066', '#ffffff', '#f7a1c4', '#9ad1ff'];
    for (let i = 0; i < 3; i++) {
      const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11);
      const c = cols[Math.floor(r() * cols.length)];
      p.set(x, y, c); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, C.blade);
      p.set(x, y, '#fff2a8');
    }
  },
  [T.TALLGRASS]: (p, v) => {
    p.rect(0, 0, 16, 16, C.grassD);
    const r = prand(v * 53 + 3);
    for (let i = 0; i < 9; i++) {
      const x = Math.floor(r() * 15), y = 4 + Math.floor(r() * 11);
      p.vline(x, y - 3, y, C.blade);
      p.set(x + 1, y - 2, C.grassL);
    }
  },
  [T.DIRT]: (p, v) => {
    p.rect(0, 0, 16, 16, C.dirt);
    const r = prand(v * 11 + 1);
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? C.dirtD : C.dirtL);
  },
  [T.SAND]: (p, v) => {
    p.rect(0, 0, 16, 16, C.sand);
    const r = prand(v * 17 + 5);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), C.sandD);
  },
  [T.WATER]: (p, v, f, m) => { waterBase(p, f, v); foamEdges(p, m, f); },
  [T.DEEP]: (p, v, f, m) => { waterBase(p, f, v, true); foamEdges(p, m, f); },
  [T.TREE]: (p, v) => {
    grassBase(p, v, 9);
    p.rect(7, 11, 3, 4, C.trunk);
    p.set(7, 14, shade(C.trunk, -0.3));
    p.ellipse(8, 7, 6.6, 6.2, C.leafD);
    p.ellipse(8, 6.2, 6, 5.4, C.leaf);
    p.ellipse(6.5, 4.8, 3, 2.4, C.leafL);
    p.set(10, 8, C.leafD); p.set(4, 9, C.leafD); p.set(11, 5, C.leafL);
  },
  [T.PINE]: (p, v) => {
    grassBase(p, v, 11);
    p.rect(7, 12, 2, 3, C.trunk);
    for (let y = 1; y < 13; y++) {
      const w = Math.floor(y * 0.55) + 1;
      p.hline(8 - w, 7 + w, y, y % 4 === 0 ? C.pineD : C.pine);
      p.set(8 - w, y, C.pineD);
      if (w > 1) p.set(9 - w, y, C.pineL);
    }
  },
  [T.MOUNTAIN]: (p, v) => {
    grassBase(p, v, 21);
    const r = prand(v * 7 + 2);
    const peak = 5 + Math.floor(r() * 5);
    for (let y = 2; y < 16; y++) {
      const half = Math.floor((y - 1) * 0.62) + 1;
      for (let x = peak - half; x <= peak + half; x++) {
        if (x < 0 || x > 15) continue;
        p.set(x, y, x < peak ? C.rockL : x === peak ? C.rock : C.rockD);
      }
    }
    p.set(peak, 2, C.snow); p.set(peak - 1, 3, C.snow); p.set(peak, 3, C.snow); p.set(peak + 1, 3, '#d7dbe8');
    p.hline(0, 15, 15, C.rockD);
  },
  [T.HILL]: (p, v) => {
    grassBase(p, v, 23);
    p.ellipse(8, 11, 7, 4, '#6cb558');
    p.ellipse(7, 10, 5, 2.6, '#86ca6d');
  },
  [T.ROCK]: (p, v) => {
    grassBase(p, v, 29);
    p.ellipse(8, 10, 5.5, 4.2, C.rockD);
    p.ellipse(7.5, 9.2, 4.8, 3.4, C.rock);
    p.ellipse(6.5, 8.4, 2.4, 1.6, C.rockL);
  },
  [T.BRIDGE_H]: (p, v, f) => {
    waterBase(p, f, v);
    p.rect(0, 1, 16, 14, C.wood);
    for (let x = 0; x < 16; x += 4) p.vline(x, 1, 14, C.woodD);
    p.hline(0, 15, 1, C.woodL);
    p.hline(0, 15, 14, C.woodD);
  },
  [T.BRIDGE_V]: (p, v, f) => {
    waterBase(p, f, v);
    p.rect(1, 0, 14, 16, C.wood);
    for (let y = 0; y < 16; y += 4) p.hline(1, 14, y, C.woodD);
    p.vline(1, 0, 15, C.woodL);
    p.vline(14, 0, 15, C.woodD);
  },
  [T.BROKEN_BRIDGE]: (p, v, f) => {
    waterBase(p, f, v);
    const r = prand(v + 3);
    if (r() < 0.6) { p.rect(1, 2, 3, 12, C.woodD); p.set(2, 2, C.woodL); }
    if (r() < 0.5) { p.rect(10, 5, 4, 2, C.wood); p.set(10, 5, C.woodL); }
    p.rect(6, 12, 2, 4, C.woodD);
  },
  [T.SWAMP]: (p, v, f) => {
    p.rect(0, 0, 16, 16, C.swamp);
    const r = prand(v * 5 + 1);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), C.swampD);
    const bx = (v * 5 + 3) % 12 + 2, by = (v * 7 + 4) % 10 + 3;
    if (f === 1) { p.set(bx, by, C.swampL); p.set(bx + 1, by, C.swampL); }
    if (f === 2) { p.set(bx, by - 1, C.swampL); p.set(bx - 1, by, C.swampL); p.set(bx + 1, by, C.swampL); p.set(bx, by + 1, C.swampL); }
  },
  [T.FOREST_FLOOR]: (p, v) => {
    p.rect(0, 0, 16, 16, '#3f7d3a');
    const r = prand(v * 19 + 9);
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#356b31' : '#6a8a3a');
  },
  [T.STEPPING]: (p, v, f) => {
    waterBase(p, f, v);
    p.ellipse(8, 8, 5, 4, C.stoneD);
    p.ellipse(7.5, 7.4, 4.2, 3.2, C.stone);
    p.set(6, 6, C.stoneL); p.set(7, 6, C.stoneL);
  },
  [T.SHRINE_FLOOR]: (p) => {
    p.rect(0, 0, 16, 16, '#d9d6e6');
    p.hline(0, 15, 0, '#b8b4ca'); p.vline(0, 0, 15, '#b8b4ca');
    p.hline(0, 15, 8, '#c6c2d8'); p.vline(8, 0, 15, '#c6c2d8');
    p.set(4, 4, '#ffffff'); p.set(12, 12, '#ffffff');
  },
  [T.CAVE_ENTRANCE]: (p, v) => {
    p.rect(0, 0, 16, 16, C.rockD);
    p.ellipse(8, 11, 6, 8, '#120c10');
    p.ellipse(8, 12, 4.5, 7, '#000000');
    p.hline(1, 14, 15, C.rockD);
  },
  [T.STONE_PATH]: (p, v) => {
    p.rect(0, 0, 16, 16, '#a9a6a0');
    const d = '#8c8983', l = '#c4c1bb';
    p.hline(0, 15, 0, d); p.hline(0, 15, 8, d);
    p.vline(0, 0, 7, d); p.vline(8, 8, 15, d);
    p.hline(1, 6, 1, l); p.hline(9, 14, 9, l);
    if (v & 1) p.set(12, 4, d);
  },
  [T.PLAZA]: (p) => {
    p.rect(0, 0, 16, 16, '#c9bfa8');
    const d = '#ae a38b'.replace(' ', '');
    for (let i = 0; i < 16; i += 8) { p.hline(0, 15, i, '#b1a68e'); p.vline(i, 0, 15, '#b1a68e'); }
    p.set(4, 4, '#ddd3bd'); p.set(12, 12, '#ddd3bd');
  },
  [T.WALL_STONE]: (p, v, f, m) => {
    if (m & 1) {
      stoneBricks(p, C.stone, C.stoneD, C.stoneL);
      p.hline(0, 15, 15, shade(C.stoneD, -0.3));
    } else {
      p.rect(0, 0, 16, 16, '#6e6f80');
      p.rect(1, 1, 14, 14, '#7f8092');
      p.set(3, 3, '#9a9bab');
    }
  },
  [T.WALL_WOOD]: (p, v, f, m) => {
    if (m & 1) {
      p.rect(0, 0, 16, 16, C.wood);
      for (let x = 0; x < 16; x += 4) p.vline(x, 0, 15, C.woodD);
      for (let x = 1; x < 16; x += 4) p.vline(x, 0, 15, C.woodL);
      p.hline(0, 15, 15, shade(C.woodD, -0.3));
      p.rect(5, 4, 6, 5, '#3d5a86'); p.rect(6, 5, 4, 3, '#8fc3ff'); p.set(8, 5, '#3d5a86'); p.vline(8, 5, 7, '#3d5a86');
    } else {
      p.rect(0, 0, 16, 16, '#6b4524');
      p.rect(1, 1, 14, 14, '#7c5330');
    }
  },
  [T.FLOOR_WOOD]: (p, v) => {
    p.rect(0, 0, 16, 16, '#b88449');
    for (let y = 0; y < 16; y += 4) p.hline(0, 15, y, '#9a6b38');
    const off = (v % 2) * 6;
    p.vline(off + 3, 1, 3, '#9a6b38'); p.vline(off + 9, 5, 7, '#9a6b38'); p.vline((off + 5) % 16, 9, 11, '#9a6b38'); p.vline((off + 12) % 16, 13, 15, '#9a6b38');
  },
  [T.FLOOR_STONE]: (p, v) => {
    p.rect(0, 0, 16, 16, '#a3a3b3');
    p.rect(0, 0, 8, 8, '#afafbf'); p.rect(8, 8, 8, 8, '#afafbf');
    p.hline(0, 15, 0, '#8e8ea0'); p.vline(0, 0, 15, '#8e8ea0');
  },
  [T.DOOR]: (p) => {
    p.rect(0, 0, 16, 16, '#5b3a1e');
    p.rect(2, 1, 12, 15, '#8a5a2e');
    p.vline(8, 1, 15, '#5b3a1e');
    p.rect(2, 1, 12, 1, '#a9743f');
    p.set(6, 9, C.gold); p.set(10, 9, C.gold);
  },
  [T.COUNTER]: (p) => {
    p.rect(0, 0, 16, 16, '#b88449');
    p.rect(0, 2, 16, 12, '#8a5528');
    p.rect(0, 2, 16, 3, '#b8773a');
    p.hline(0, 15, 2, '#d49a5a');
    p.hline(0, 15, 13, '#5f3918');
  },
  [T.TABLE]: (p) => {
    p.rect(0, 0, 16, 16, '#b88449');
    p.rect(2, 3, 12, 8, '#a86a32'); p.hline(2, 13, 3, '#c98b4c');
    p.rect(3, 11, 2, 4, '#6b4220'); p.rect(11, 11, 2, 4, '#6b4220');
    p.rect(6, 5, 4, 3, '#f0f0f0'); p.set(7, 5, '#d64d4d');
  },
  [T.CHAIR]: (p, v) => {
    painters[T.FLOOR_WOOD](p, v);
    p.rect(4, 6, 8, 6, '#7c4a24'); p.hline(4, 11, 6, '#9c6334'); p.rect(4, 12, 2, 3, '#5b3418'); p.rect(10, 12, 2, 3, '#5b3418');
  },
  [T.BED]: (p) => {
    p.rect(0, 0, 16, 16, '#b88449');
    p.rect(1, 0, 14, 16, '#6b4220');
    p.rect(2, 1, 12, 14, '#f4f4f8');
    p.rect(3, 2, 10, 4, '#ffffff'); p.hline(3, 12, 5, '#d8d8e8');
    p.rect(2, 7, 12, 8, '#d6504e'); p.hline(2, 13, 7, '#ef7472'); p.hline(2, 13, 14, '#a83a38');
  },
  [T.SHELF]: (p) => {
    p.rect(0, 0, 16, 16, '#6b4220');
    p.rect(1, 1, 14, 14, '#8a5528');
    p.hline(1, 14, 7, '#5b3418'); p.hline(1, 14, 14, '#5b3418');
    p.rect(2, 3, 3, 4, '#5ba4d6'); p.rect(6, 4, 3, 3, '#e0b84c'); p.rect(10, 3, 3, 4, '#c85a8a');
    p.rect(3, 10, 3, 4, '#7dc46a'); p.rect(8, 9, 5, 5, '#c89358');
  },
  [T.POT]: (p, v) => {
    painters[T.FLOOR_WOOD](p, v);
    p.ellipse(8, 10, 5, 5, '#8c4a24');
    p.ellipse(8, 9.5, 4.2, 4.2, '#b8683a');
    p.rect(6, 3, 4, 3, '#8c4a24'); p.hline(5, 10, 3, '#a85a30');
    p.set(6, 8, '#d88a5a'); p.set(6, 9, '#d88a5a');
  },
  [T.BARREL]: (p, v) => {
    painters[T.FLOOR_WOOD](p, v);
    p.rect(3, 2, 10, 13, '#7a4a22');
    p.rect(4, 2, 8, 13, '#9a6232');
    p.hline(3, 12, 5, '#4a4a4a'); p.hline(3, 12, 11, '#4a4a4a');
    p.ellipse(8, 3, 4.5, 1.6, '#b87a42');
  },
  [T.WELL]: (p, v) => {
    grassBase(p, v, 41);
    p.ellipse(8, 9, 7, 6, C.stoneD);
    p.ellipse(8, 8.5, 6, 5, C.stone);
    p.ellipse(8, 8.5, 3.8, 3, '#1c3d6e');
    p.set(6, 7, '#3c6eae');
  },
  [T.FOUNTAIN]: (p, v, f) => {
    p.rect(0, 0, 16, 16, '#c9bfa8');
    p.rect(0, 0, 16, 16, C.stone);
    p.rect(1, 1, 14, 14, C.water);
    p.rect(1, 1, 14, 1, C.stoneL);
    const wy = 3 + f;
    p.set(7, wy, C.foam); p.set(8, wy + 2, C.foam); p.set(5, 8 + f, C.waterL); p.set(10, 10 - f, C.waterL);
  },
  [T.FENCE]: (p, v) => {
    grassBase(p, v, 43);
    p.hline(0, 15, 6, '#8a5a2e'); p.hline(0, 15, 10, '#8a5a2e');
    p.hline(0, 15, 5, '#b07a44');
    for (let x = 1; x < 16; x += 7) { p.rect(x, 3, 2, 11, '#7a4a22'); p.set(x, 3, '#b07a44'); }
  },
  [T.SIGN]: (p, v) => {
    grassBase(p, v, 47);
    p.rect(7, 8, 2, 7, '#6b4220');
    p.rect(2, 2, 12, 7, '#b8773a'); p.rect(3, 3, 10, 5, '#d49a5a');
    p.hline(4, 11, 4, '#6b4220'); p.hline(4, 9, 6, '#6b4220');
  },
  [T.STATUE]: (p) => {
    p.rect(0, 0, 16, 16, '#c9bfa8');
    p.rect(3, 12, 10, 4, C.stoneD); p.hline(3, 12, 12, C.stoneL);
    p.ellipse(8, 3.5, 2.5, 2.5, C.stone);
    p.rect(5, 6, 6, 6, C.stone); p.vline(12, 1, 11, C.stoneL); p.set(12, 0, C.stoneL);
    p.set(7, 3, C.stoneD); p.set(9, 3, C.stoneD);
  },
  [T.ALTAR]: (p) => {
    p.rect(0, 0, 16, 16, '#cfcfe0');
    p.rect(1, 4, 14, 11, C.stoneD); p.rect(2, 3, 12, 3, C.stoneL);
    p.rect(3, 6, 10, 6, '#6a4aa8'); p.hline(3, 12, 6, C.gold); p.set(8, 9, C.gold);
  },
  [T.STAR_ALTAR]: (p) => {
    p.rect(0, 0, 16, 16, '#c9bfa8');
    p.rect(1, 6, 14, 10, C.stoneD); p.rect(2, 5, 12, 3, C.stoneL); p.hline(2, 13, 9, '#6d6f86');
    p.set(5, 11, C.gold); p.set(10, 11, C.gold);
  },
  [T.CARPET]: (p) => {
    p.rect(0, 0, 16, 16, '#b8343a');
    p.vline(1, 0, 15, C.gold); p.vline(14, 0, 15, C.gold);
    p.set(8, 4, '#e0575c'); p.set(8, 12, '#e0575c');
  },
  [T.LAMP]: (p, v, f) => {
    p.rect(0, 0, 16, 16, '#c9bfa8');
    p.rect(7, 5, 2, 10, '#3b3b48'); p.rect(5, 14, 6, 2, '#3b3b48');
    p.rect(5, 1, 6, 5, '#3b3b48'); p.rect(6, 2, 4, 3, f === 1 ? '#fff4b0' : '#ffd66b');
  },
  [T.HEDGE]: (p, v) => {
    grassBase(p, v, 53);
    p.ellipse(8, 9, 7.5, 6, '#2d7a35');
    p.ellipse(7, 8, 5.5, 4, '#3f9747');
    p.set(5, 6, '#5bb563'); p.set(10, 9, '#5bb563');
  },
  [T.FIREPLACE]: (p, v, f) => {
    stoneBricks(p, '#8a7f76', '#655c55', '#a89d93', true);
    p.rect(3, 6, 10, 9, '#1a1010');
    const fl = ['#ff7a2a', '#ffb13a', '#ffe07a'];
    p.rect(5, 10 - f, 6, 5 + f, fl[0]); p.rect(6, 11 - f, 4, 4 + f, fl[1]); p.rect(7, 12, 2, 3, fl[2]);
  },
  [T.BOOKSHELF]: (p) => {
    p.rect(0, 0, 16, 16, '#5b3418');
    p.rect(1, 1, 14, 14, '#7a4a22');
    p.hline(1, 14, 8, '#4a2a12');
    const cols = ['#c84a4a', '#4a7ac8', '#e0b84c', '#5aa85a', '#9a5ac8', '#e08a4a'];
    for (let i = 0; i < 6; i++) { p.rect(2 + i * 2, 2, 2, 6, cols[i]); p.rect(2 + ((i * 3) % 12), 10, 2, 5, cols[(i + 2) % 6]); }
  },
  [T.CRATE]: (p, v) => {
    painters[T.FLOOR_WOOD](p, v);
    p.rect(2, 3, 12, 12, '#9a6a36'); p.rect(2, 3, 12, 1, '#c08a4a');
    p.hline(2, 13, 9, '#6b4a22'); p.vline(2, 3, 14, '#6b4a22'); p.vline(13, 3, 14, '#6b4a22');
    for (let i = 0; i < 12; i++) p.set(2 + i, 3 + i, '#6b4a22');
  },
  [T.TOWN_FLOWERS]: (p, v) => {
    p.rect(0, 0, 16, 16, '#7a5230');
    p.rect(0, 0, 16, 2, '#8a8a8a');
    const r = prand(v * 13 + 5);
    const cols = ['#f25f5c', '#ffe066', '#f7a1c4', '#ffffff'];
    for (let i = 0; i < 6; i++) {
      const x = 1 + Math.floor(r() * 14), y = 4 + Math.floor(r() * 10);
      p.set(x, y + 1, '#3f8a3a'); p.set(x, y, cols[i % 4]);
    }
  },
  [T.STAIRS_DOWN]: (p) => {
    p.rect(0, 0, 16, 16, '#18131a');
    for (let i = 0; i < 4; i++) { p.rect(1 + i, 2 + i * 3, 14 - i * 2, 2, C.stone); p.hline(1 + i, 14 - i, 2 + i * 3, C.stoneL); }
  },
  [T.STAIRS_UP]: (p) => {
    p.rect(0, 0, 16, 16, C.cave);
    for (let i = 0; i < 4; i++) { p.rect(4 - i, 2 + i * 3, 8 + i * 2, 2, C.stoneL); p.hline(4 - i, 11 + i, 3 + i * 3, C.stoneD); }
  },
  [T.CAVE_FLOOR]: (p, v) => {
    p.rect(0, 0, 16, 16, C.cave);
    const r = prand(v * 23 + 1);
    for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? C.caveD : C.caveL);
  },
  [T.CAVE_WALL]: (p, v, f, m) => {
    if (m & 1) {
      p.rect(0, 0, 16, 16, C.caveWallL);
      const r = prand(v * 29 + 7);
      for (let y = 2; y < 16; y += 4) p.hline(0, 15, y, C.caveWall);
      for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#5f4f42');
      p.hline(0, 15, 15, '#1a1412');
    } else {
      p.rect(0, 0, 16, 16, '#1d1714');
      const r = prand(v * 31 + 3);
      for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#2e2520');
    }
  },
  [T.CAVE_WATER]: (p, v, f) => {
    p.rect(0, 0, 16, 16, '#1f3f6e');
    const off = (f * 5 + v * 3) % 16;
    p.hline(off % 13, off % 13 + 3, 5, '#3a6aa8'); p.hline((off + 7) % 13, (off + 7) % 13 + 2, 11, '#3a6aa8');
  },
  [T.CRYSTAL]: (p, v, f) => {
    painters[T.CAVE_FLOOR](p, v);
    const c1 = '#7d6af0', c2 = '#b8a8ff', c3 = '#ffffff';
    p.rect(6, 3, 3, 11, c1); p.rect(3, 7, 3, 7, c1); p.rect(10, 6, 3, 8, c1);
    p.vline(7, 3, 12, c2); p.vline(4, 7, 12, c2); p.vline(11, 6, 12, c2);
    if (f === 1) p.set(7, 4, c3);
    if (f === 2) p.set(11, 7, c3);
  },
  [T.TORCH]: (p, v, f) => {
    painters[T.CAVE_WALL](p, v, 0, 1);
    p.rect(7, 8, 2, 6, '#6b4220');
    const fl = [['#ff7a2a', '#ffd66b'], ['#ff9a3a', '#fff0a0'], ['#ff6a1a', '#ffc85a']][f % 3];
    p.rect(6, 4 - (f % 2), 4, 4 + (f % 2), fl[0]);
    p.rect(7, 5, 2, 3, fl[1]);
  },
  [T.PILLAR]: (p, v) => {
    painters[T.CAVE_FLOOR](p, v);
    p.rect(4, 0, 8, 16, C.stoneD); p.rect(5, 0, 5, 16, C.stone); p.vline(6, 0, 15, C.stoneL);
    p.rect(3, 13, 10, 3, C.stoneD);
  },
  [T.LOCKED_DOOR]: (p) => {
    p.rect(0, 0, 16, 16, '#3a3a48');
    p.rect(1, 0, 14, 16, '#5a5a6e');
    for (let x = 3; x < 14; x += 4) p.vline(x, 0, 15, '#44445a');
    p.hline(1, 14, 4, '#77778e'); p.hline(1, 14, 11, '#77778e');
    p.rect(6, 6, 4, 4, C.gold); p.set(7, 8, '#3a2a10'); p.set(8, 8, '#3a2a10');
  },
  [T.RUBBLE]: (p, v) => {
    painters[T.CAVE_FLOOR](p, v);
    p.ellipse(5, 10, 2.5, 2, C.caveL); p.ellipse(11, 6, 2, 1.6, C.caveL); p.set(9, 12, '#7a6a5a');
  },
  [T.BOSS_FLOOR]: (p, v) => {
    p.rect(0, 0, 16, 16, '#3c3048');
    p.hline(0, 15, 0, '#2c2238'); p.vline(0, 0, 15, '#2c2238');
    if ((v & 3) === 0) { p.set(7, 7, '#8a5ac8'); p.set(8, 8, '#8a5ac8'); p.set(7, 8, '#6a4aa0'); }
  },
  [T.CAVE_BRIDGE]: (p, v, f) => {
    painters[T.CAVE_WATER](p, v, f);
    p.rect(0, 1, 16, 14, '#7a5230');
    for (let x = 0; x < 16; x += 4) p.vline(x, 1, 14, '#5a3a1e');
  },
  [T.PIER]: (p, v, f) => {
    waterBase(p, f, v);
    p.rect(2, 0, 12, 16, C.wood);
    for (let y = 0; y < 16; y += 4) p.hline(2, 13, y, C.woodD);
    p.vline(2, 0, 15, C.woodL);
  },
  [T.RUBBLE_WALL]: (p, v) => {
    grassBase(p, v, 61);
    p.ellipse(5, 10, 5, 4.5, C.rockD); p.ellipse(11, 9, 5, 5, C.rock); p.ellipse(8, 5, 4, 3.5, C.rockL);
  },
};

// アニメーションする タイルの コマ数
const FRAMES = {
  [T.WATER]: 3, [T.DEEP]: 3, [T.SWAMP]: 3, [T.FOUNTAIN]: 2, [T.FIREPLACE]: 2, [T.CAVE_WATER]: 3, [T.CRYSTAL]: 3,
  [T.TORCH]: 3, [T.LAMP]: 2, [T.STEPPING]: 3, [T.BRIDGE_H]: 3, [T.BRIDGE_V]: 3, [T.BROKEN_BRIDGE]: 3, [T.CAVE_BRIDGE]: 3, [T.PIER]: 3,
};
const SPEED = { [T.TORCH]: 140, [T.FIREPLACE]: 180, [T.CRYSTAL]: 500, [T.LAMP]: 700 };

export function frameOf(id, t) {
  const n = FRAMES[id];
  if (!n) return 0;
  return Math.floor(t / (SPEED[id] || 420)) % n;
}

const cache = new Map();
export function tileCanvas(id, variant, frame, mask) {
  const key = (id << 16) | (variant << 12) | (frame << 8) | mask;
  let c = cache.get(key);
  if (c) return c;
  const p = new Painter(TS, TS);
  (painters[id] || painters[T.VOID])(p, variant, frame, mask);
  c = p.toCanvas();
  cache.set(key, c);
  return c;
}

const WATERY = new Set([T.WATER, T.DEEP, T.BROKEN_BRIDGE, T.STEPPING, T.PIER, T.BRIDGE_H, T.BRIDGE_V]);
const WALLS = new Set([T.WALL_STONE, T.WALL_WOOD, T.CAVE_WALL, T.TORCH]);

// マップごとに いちど だけ けいさん（となりの タイルで かわる みため）
export function prepareMap(map) {
  if (map._render) return map._render;
  const { w, h, tiles } = map;
  const variant = new Uint8Array(w * h);
  const mask = new Uint8Array(w * h);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : tiles[y * w + x]);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const t = tiles[i];
      variant[i] = Math.floor(hash2(x, y, 17) * 4);
      if (t === T.WATER || t === T.DEEP) {
        let m = 0;
        const land = (tt) => tt !== -1 && !WATERY.has(tt);
        if (land(at(x, y - 1))) m |= 1;
        if (land(at(x + 1, y))) m |= 2;
        if (land(at(x, y + 1))) m |= 4;
        if (land(at(x - 1, y))) m |= 8;
        mask[i] = m;
      } else if (WALLS.has(t)) {
        const below = at(x, y + 1);
        if (!WALLS.has(below)) mask[i] = 1;
      }
    }
  }
  map._render = { variant, mask };
  return map._render;
}

export function isAnimated(id) {
  return !!FRAMES[id];
}

export { TILE_INFO };
