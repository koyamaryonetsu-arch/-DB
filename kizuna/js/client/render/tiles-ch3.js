// 第3章の タイル（16×16 ドット）: 雪・氷・ようがん・鉱山・神殿（render/tiles.js が まぜる）
// (p, v, f, m) … Painter / ちがい（0〜3）/ アニメの コマ / となりの ようす（mask）
import { T } from '../../shared/tiles.js?v=e388712b9c60';
import { prand, shade } from './pixel.js?v=e388712b9c60';

const SN = { base: '#eef2fa', dot: '#dce4f2', lit: '#ffffff', blue: '#c4d2ea', deep: '#a8b8d6' };
const ICE = { base: '#a6d8f2', lit: '#e6f8ff', dark: '#84bce0', crack: '#6aa4d0' };
const LAVA = { base: '#c8300a', mid: '#ff6a1a', hot: '#ffb040', glow: '#ffe08a', crust: '#3a1a12', crustL: '#5a2a1a' };
const ROCK = { base: '#7a8092', dark: '#565c6e', lit: '#a0a6b8' };
const ASHR = { base: '#4a3a3e', dark: '#2e2428', lit: '#6a5658' };
const STONE = { base: '#9fa0ad', dark: '#77788a', lit: '#c2c3cf' };
const CAVE = { base: '#4a4038', dark: '#332b25', lit: '#62564b' };

export function snowBase(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, SN.base);
  const r = prand(v * 37 + 11 + seed);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? SN.dot : SN.lit);
  for (let i = 0; i < 2; i++) {
    const x = Math.floor(r() * 14), y = Math.floor(r() * 14) + 1;
    p.set(x, y, SN.blue);
    p.set(x + 1, y, SN.blue);
  }
}

function caveBase(p, v) {
  p.rect(0, 0, 16, 16, CAVE.base);
  const r = prand(v * 23 + 1);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? CAVE.dark : CAVE.lit);
}

function stoneBase(p) {
  p.rect(0, 0, 16, 16, '#a3a3b3');
  p.rect(0, 0, 8, 8, '#afafbf');
  p.rect(8, 8, 8, 8, '#afafbf');
  p.hline(0, 15, 0, '#8e8ea0');
  p.vline(0, 0, 15, '#8e8ea0');
}

// レールの 線（mask: 1=北 2=東 4=南 8=西 に つながる）
function rails(p, m) {
  const tie = '#6a4422', tieL = '#8a5a2e', steel = '#b8bcc8', steelD = '#7a7e8c';
  let mm = m & 15;
  if (!mm) mm = 2 | 8;
  const horiz = (x0, x1) => {
    for (let x = x0; x <= x1; x += 3) { p.vline(x, 3, 12, tie); p.set(x, 3, tieL); }
    p.hline(x0, x1, 5, steel); p.hline(x0, x1, 6, steelD);
    p.hline(x0, x1, 10, steel); p.hline(x0, x1, 11, steelD);
  };
  const vert = (y0, y1) => {
    for (let y = y0; y <= y1; y += 3) { p.hline(3, 12, y, tie); p.set(3, y, tieL); }
    p.vline(5, y0, y1, steel); p.vline(6, y0, y1, steelD);
    p.vline(10, y0, y1, steel); p.vline(11, y0, y1, steelD);
  };
  const h = (mm & 2) || (mm & 8), vv = (mm & 1) || (mm & 4);
  if (h && !vv) horiz(0, 15);
  else if (vv && !h) vert(0, 15);
  else {
    // まがり角・分かれ道: まんなかから つながる ほうへ
    if (mm & 8) horiz(0, 8);
    if (mm & 2) horiz(7, 15);
    if (mm & 1) vert(0, 8);
    if (mm & 4) vert(7, 15);
  }
}

function flame(p, cx, by, f, cols, big = 1) {
  const [a, b, c] = cols;
  const h = Math.round((5 + (f % 3)) * big);
  p.rect(cx - 2, by - h + 2, 5, h - 1, a);
  p.rect(cx - 1, by - h, 3, h, b);
  p.set(cx, by - h - 1, b);
  p.rect(cx - 1 + (f % 2), by - h + 3, 2, Math.max(1, h - 4), c);
}

export const CH3_PAINTERS = {
  [T.SNOW]: (p, v) => snowBase(p, v),
  [T.SNOW_PATH]: (p, v) => {
    p.rect(0, 0, 16, 16, '#d6d0c6');
    const r = prand(v * 41 + 3);
    for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#c4bcb0' : '#e6e2da');
    // 足あと
    const fx = 3 + (v % 2) * 6, fy = 3 + (v >> 1) * 5;
    p.set(fx, fy, '#b4aca0'); p.set(fx + 1, fy + 1, '#b4aca0'); p.set(fx + 3, fy + 4, '#b4aca0'); p.set(fx + 4, fy + 5, '#b4aca0');
  },
  [T.DEEP_SNOW]: (p, v) => {
    snowBase(p, v, 5);
    p.ellipse(8, 10, 7, 4.5, SN.blue);
    p.ellipse(7.5, 9, 6.5, 3.8, SN.lit);
    p.ellipse(6, 8, 3, 1.6, '#ffffff');
  },
  [T.SNOW_PINE]: (p, v) => {
    snowBase(p, v, 11);
    p.rect(7, 12, 2, 3, '#5a3a22');
    const pine = '#2a6048', pineD = '#1b4434';
    for (let y = 1; y < 13; y++) {
      const w = Math.floor(y * 0.55) + 1;
      p.hline(8 - w, 7 + w, y, y % 4 === 0 ? pineD : pine);
      p.set(8 - w, y, pineD);
      // 枝に つもった 雪
      if (y % 4 === 1) p.hline(8 - w + 1, 7 + w - 1, y, SN.lit);
      else if (y % 4 === 2 && w > 2) { p.set(9 - w, y, SN.base); p.set(6 + w, y, SN.blue); }
    }
    p.set(7, 0, SN.lit); p.set(8, 0, SN.lit);
  },
  [T.SNOW_ROCK]: (p, v) => {
    snowBase(p, v, 21);
    const r = prand(v * 7 + 2);
    const peak = 5 + Math.floor(r() * 5);
    for (let y = 2; y < 16; y++) {
      const half = Math.floor((y - 1) * 0.62) + 1;
      for (let x = peak - half; x <= peak + half; x++) {
        if (x < 0 || x > 15) continue;
        let c = x < peak ? ROCK.lit : x === peak ? ROCK.base : ROCK.dark;
        // 上の ほうは 雪
        if (y < 7 || (y < 9 && (x + y) % 3 === 0)) c = x <= peak ? SN.lit : SN.blue;
        p.set(x, y, c);
      }
    }
    p.hline(0, 15, 15, ROCK.dark);
  },
  [T.ASH_ROCK]: (p, v) => {
    p.rect(0, 0, 16, 16, '#6a5e5a');
    const r = prand(v * 13 + 7);
    const peak = 5 + Math.floor(r() * 5);
    for (let y = 2; y < 16; y++) {
      const half = Math.floor((y - 1) * 0.62) + 1;
      for (let x = peak - half; x <= peak + half; x++) {
        if (x < 0 || x > 15) continue;
        p.set(x, y, x < peak ? ASHR.lit : x === peak ? ASHR.base : ASHR.dark);
      }
    }
    if (v & 1) { p.set(peak + 1, 9, '#ff6a1a'); p.set(peak + 2, 10, '#c8300a'); }
    p.hline(0, 15, 15, ASHR.dark);
  },
  [T.ICE]: (p, v) => {
    p.rect(0, 0, 16, 16, ICE.base);
    const r = prand(v * 53 + 9);
    // ななめの ひかり
    const o = Math.floor(r() * 10);
    for (let i = 0; i < 6; i++) { p.set((o + i) % 16, 3 + i, ICE.lit); p.set((o + i + 1) % 16, 3 + i, ICE.lit); }
    for (let i = 0; i < 3; i++) p.set((o + 9 + i) % 16, 10 + i, ICE.lit);
    // ひび
    const cx = Math.floor(r() * 12) + 2, cy = Math.floor(r() * 12) + 2;
    p.set(cx, cy, ICE.crack); p.set(cx + 1, cy + 1, ICE.crack); p.set(cx + 1, cy + 2, ICE.crack); p.set(cx - 1, cy + 1, ICE.dark);
    p.hline(0, 15, 15, ICE.dark);
  },
  [T.ICE_BLOCK]: (p, v) => {
    p.rect(0, 0, 16, 16, ICE.base);
    p.hline(0, 15, 15, ICE.dark);
    p.rect(2, 4, 12, 11, '#3a78b0');
    p.rect(3, 5, 10, 9, '#6ab0e0');
    p.rect(3, 2, 10, 4, '#3a78b0');
    p.rect(4, 3, 8, 3, '#d8f4ff');
    p.vline(4, 6, 12, '#a8dcf8'); p.set(5, 7, '#ffffff'); p.vline(11, 7, 12, '#4a90c8');
  },
  [T.LAVA]: (p, v, f) => {
    p.rect(0, 0, 16, 16, LAVA.base);
    const off = (f * 5 + v * 3) % 16;
    for (let k = 0; k < 3; k++) {
      const y = (k * 5 + 2 + (v & 1) * 2) % 16;
      const x0 = (off + k * 6) % 16;
      for (let i = 0; i < 5; i++) p.set((x0 + i) % 16, y, LAVA.mid);
      p.set((x0 + 1) % 16, (y + 1) % 16, LAVA.hot);
      p.set((x0 + 2) % 16, (y + 1) % 16, LAVA.glow);
    }
    if (f === 1) { p.set((v * 5 + 7) % 14 + 1, 8, LAVA.glow); p.set((v * 5 + 8) % 14 + 1, 7, LAVA.hot); }
  },
  [T.LAVA_FLOOR]: (p, v, f) => {
    p.rect(0, 0, 16, 16, LAVA.crust);
    const r = prand(v * 61 + 5);
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), LAVA.crustL);
    // 光る ひび（ゆっくり またたく）
    const glow = f % 2 ? LAVA.hot : LAVA.mid;
    let x = Math.floor(r() * 6) + 1, y = Math.floor(r() * 4) + 2;
    for (let i = 0; i < 9; i++) {
      p.set(x, y, glow);
      if (i % 2) x += 1; else y += 1;
      if (x > 14 || y > 14) break;
    }
    p.set(12, 4, glow); p.set(13, 5, LAVA.mid); p.set(3, 12, LAVA.mid);
  },
  [T.OBSIDIAN]: (p, v) => {
    p.rect(0, 0, 16, 16, '#2e2630');
    const r = prand(v * 71 + 2);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#1a141e' : '#4a3e52');
    p.set(4, 4, '#6a5a7a'); p.set(5, 4, '#5a4a6a'); p.set(11, 10, '#6a5a7a');
  },
  [T.ASH]: (p, v) => {
    p.rect(0, 0, 16, 16, '#6a5e5a');
    const r = prand(v * 19 + 4);
    for (let i = 0; i < 9; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#5a4e4a' : '#7e726c');
  },
  [T.RAIL]: (p, v, f, m) => {
    p.rect(0, 0, 16, 16, '#6e6052');
    const r = prand(v * 29 + 1);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#5a4e42' : '#827262');
    rails(p, m);
  },
  [T.RAIL_STOP]: (p, v, f, m) => {
    CH3_PAINTERS[T.RAIL](p, v, f, m);
    // とめる くい（赤と 白）
    p.rect(4, 4, 8, 8, '#2a2230');
    p.rect(5, 5, 6, 6, '#e8e4e0');
    p.rect(5, 5, 3, 3, '#d8403a'); p.rect(8, 8, 3, 3, '#d8403a');
  },
  [T.RAIL_BRIDGE]: (p, v, f, m) => {
    p.rect(0, 0, 16, 16, '#06040a');
    p.set(3, 13, '#1a141e'); p.set(12, 2, '#1a141e');
    // 木の やぐら
    let mm = m & 15;
    if (!mm) mm = 2 | 8;
    if ((mm & 2) || (mm & 8)) { p.rect(0, 2, 16, 12, '#5a3a1e'); p.hline(0, 15, 2, '#7a5230'); p.hline(0, 15, 13, '#3a2410'); }
    else { p.rect(2, 0, 12, 16, '#5a3a1e'); p.vline(2, 0, 15, '#7a5230'); p.vline(13, 0, 15, '#3a2410'); }
    rails(p, m);
  },
  [T.CHASM]: (p, v) => {
    p.rect(0, 0, 16, 16, '#06040a');
    const r = prand(v * 83 + 6);
    for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#141018');
  },
  [T.LEVER]: (p, v) => {
    caveBase(p, v);
    p.rect(3, 9, 10, 6, '#3a3a48'); p.rect(4, 10, 8, 4, '#5a5a6e'); p.hline(4, 11, 10, '#7a7a8e');
    // レバー（ひだりに たおれている）
    for (let i = 0; i < 6; i++) p.set(7 - i, 9 - i, '#8a8a9a');
    p.rect(1, 2, 3, 3, '#d8403a'); p.set(1, 2, '#ff8a7a');
  },
  [T.LEVER_ON]: (p, v) => {
    caveBase(p, v);
    p.rect(3, 9, 10, 6, '#3a3a48'); p.rect(4, 10, 8, 4, '#5a5a6e'); p.hline(4, 11, 10, '#7a7a8e');
    // レバー（みぎに たおれている）
    for (let i = 0; i < 6; i++) p.set(8 + i, 9 - i, '#8a8a9a');
    p.rect(12, 2, 3, 3, '#4ac86a'); p.set(12, 2, '#9aff9a');
  },
  [T.PLATE]: (p) => {
    stoneBase(p);
    p.ellipse(8, 8, 6, 5, '#5a5a70');
    p.ellipse(8, 7.6, 5, 4, '#8a8aa8');
    p.ellipse(8, 7.4, 2.4, 2, '#6a6a84');
  },
  [T.PLATE_ON]: (p) => {
    stoneBase(p);
    p.ellipse(8, 8, 6, 5, '#8a6a20');
    p.ellipse(8, 7.6, 5, 4, '#ffd66b');
    p.ellipse(8, 7.4, 2.4, 2, '#fff6c0');
  },
  [T.BRAZIER]: (p) => {
    stoneBase(p);
    p.rect(7, 9, 2, 5, '#5a5a6a'); p.rect(5, 13, 6, 2, '#4a4a58');
    p.rect(3, 5, 10, 4, '#4a4a58'); p.rect(4, 6, 8, 2, '#2a2a32'); p.hline(3, 12, 5, '#7a7a8a');
  },
  [T.BRAZIER_LIT]: (p, v, f) => {
    CH3_PAINTERS[T.BRAZIER](p, v, f);
    flame(p, 8, 7, f, ['#ff7a2a', '#ffb13a', '#fff0a0']);
  },
  [T.HOT_SPRING]: (p, v, f) => {
    p.rect(0, 0, 16, 16, '#4ab8c4');
    const off = (f * 3 + v * 5) % 16;
    p.hline(off % 12, off % 12 + 3, 5, '#7ad8e0');
    p.hline((off + 7) % 12, (off + 7) % 12 + 2, 11, '#7ad8e0');
    // 湯気
    const sx = (v * 5 + 3) % 12 + 2;
    p.set(sx, 7 - f, '#ffffff'); p.set(sx + 1, 6 - f, '#e8f8ff'); p.set(sx - 1, 4 - f, '#e8f8ff');
    if (f === 2) { p.set((sx + 6) % 14 + 1, 9, '#ffffff'); }
  },
  [T.SNOW_WALL]: (p, v) => {
    p.rect(0, 0, 16, 16, SN.blue);
    p.ellipse(5, 10, 6, 5, SN.base); p.ellipse(11, 8, 6, 6, SN.lit); p.ellipse(8, 4, 5, 3.5, '#ffffff');
    p.set(3, 13, SN.deep); p.set(12, 14, SN.deep); p.set(9, 12, SN.deep);
    if (v & 1) p.set(6, 7, '#8a90a0');
  },
  [T.FLAME_WALL]: (p, v, f) => {
    p.rect(0, 0, 16, 16, '#2a0a1e');
    const cols = ['#c8206a', '#ff5a9a', '#ffd0e8'];
    flame(p, 4, 15, (f + v) % 3, cols, 1.6);
    flame(p, 11, 15, (f + v + 1) % 3, cols, 1.8);
    p.set((f * 5 + v) % 16, 2, '#ffd0e8');
  },
  [T.MINE_BEAM]: (p, v) => {
    caveBase(p, v);
    p.rect(1, 0, 3, 16, '#6a4422'); p.vline(1, 0, 15, '#8a5a2e');
    p.rect(12, 0, 3, 16, '#6a4422'); p.vline(12, 0, 15, '#8a5a2e');
    p.rect(0, 1, 16, 3, '#7a5230'); p.hline(0, 15, 1, '#9a6a3a'); p.hline(0, 15, 3, '#4a2e16');
  },
  [T.ICE_WALL]: (p, v, f, m) => {
    if (m & 1) {
      p.rect(0, 0, 16, 16, '#5a8ac8');
      const r = prand(v * 47 + 3);
      for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 13); p.vline(x, 2, 12, '#7aaee0'); p.set(x + 1, 3, '#d8f0ff'); }
      p.hline(0, 15, 0, '#a8d4f4');
      p.hline(0, 15, 15, '#2a4a7a');
    } else {
      p.rect(0, 0, 16, 16, '#3a6098');
      p.rect(1, 1, 14, 14, '#4a74ae');
      p.set(4, 4, '#8ab8e8'); p.set(10, 9, '#8ab8e8');
    }
  },
  [T.DRAGON_GATE]: (p, v) => {
    p.rect(0, 0, 16, 16, '#4a5a8a');
    for (let y = 0; y < 16; y += 5) { p.hline(0, 15, y, '#33406a'); const o = (y / 5) % 2 ? 4 : 0; for (let x = o; x < 16; x += 8) p.vline(x, y, Math.min(15, y + 4), '#33406a'); }
    p.hline(0, 15, 7, '#f2c14e'); p.hline(0, 15, 8, '#c8902a');
    if (v === 0) { p.rect(6, 4, 4, 7, '#f2c14e'); p.rect(7, 5, 2, 5, '#fff0a0'); }
  },
};

// アニメーションする タイルの コマ数
export const CH3_FRAMES = {
  [T.LAVA]: 3, [T.LAVA_FLOOR]: 2, [T.BRAZIER_LIT]: 3, [T.HOT_SPRING]: 3, [T.FLAME_WALL]: 3,
};
export const CH3_SPEED = { [T.LAVA]: 380, [T.LAVA_FLOOR]: 640, [T.BRAZIER_LIT]: 140, [T.HOT_SPRING]: 520, [T.FLAME_WALL]: 150 };
// レールの つながり（render/tiles.js の prepareMap）
export const RAIL_TILES = new Set([T.RAIL, T.RAIL_BRIDGE, T.RAIL_STOP]);
// まえの かおが ある かべ
export const CH3_WALLS = [T.ICE_WALL];
export { shade };
