// 第4章 Step 4「王家のピラミッド」の タイル（16×16 ドット。render/tiles-ch4.js が まぜる）
// ・フィールド: 大きな ピラミッド（15×15 マス。4つの 面と だんだん）・日時計の とびら・オベリスクの 台・オベリスクの 影
// ・ピラミッドの 中: 歌の ボタン・流れる 砂・ありじごく・ひびの 入った かべ・石の とびら・金の ひつぎ・王の 台・絵文字の かべ・
//   呪文を すいこむ もんしょう・外への 出口
// (p, v, f, m) … Painter / ちがい（0〜3）/ アニメの コマ / となりの ようす（mask。pyramidMask）
// ピラミッドの 中の ゆか・かべは 洞窟の タイルを 金色に 色がえ（render/themes.js の 'pyramid'）。ここの タイルは その 色に あわせて かく
import { T } from '../../shared/tiles.js?v=0136232bcf56';
import { PYRAMID } from '../../shared/maps/south.js?v=0136232bcf56';
import { prand } from './pixel.js?v=0136232bcf56';
import { desertBase } from './tiles-ch4.js?v=0136232bcf56';

const TAU = Math.PI * 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];

// ピラミッドの 中の 石（themes.js の 'pyramid' で 色がえ した 洞窟の ゆか・かべと おなじ 色）
const IN = {
  floor: '#b79357', floorD: '#8b6b39', floorL: '#caa86a',
  face: '#8d6a36', faceLine: '#5c401d', faceSpeck: '#a68045', faceFoot: '#3b2610',
  top: '#412b13', topSpeck: '#5e421e',
};
// ピラミッドの 外の 石（4つの 面。ひかりは 左上から: 北と 西が 明るく、南は まえ、東は かげ）
const FACE = {
  n: { top: '#f2d896', joint: '#c8a462', riser: '#fff2c8', speck: '#e2c47e' },
  w: { top: '#e6c886', joint: '#bc9858', riser: '#f8e4ac', speck: '#d6b672' },
  s: { top: '#d6b06c', joint: '#9c7840', riser: '#7e5e30', speck: '#c49c5a' },
  e: { top: '#b88e50', joint: '#80602e', riser: '#5e4420', speck: '#a47c42' },
};
const RIDGE = { nw: '#fff6d4', ne: '#ecd08e', sw: '#e4c07a', se: '#8a6834' };
// てっぺんの 金の 石（ベンベン石）
const CAP = ['#fff6c0', '#ffe070', '#f2bc36', '#c88a1a', '#8a5a10'];
// 金の ひつぎ・王の 台
const GOLD = { hi: '#fff4b0', light: '#ffe070', base: '#eab634', mid: '#c88e1e', dark: '#8e5c12', line: '#5a3608' };
const LAPIS = { light: '#5a8ae0', base: '#2a54b0', dark: '#16306e' };

// ───── ピラミッドの 中の ゆか・かべ（洞窟の タイルを 色がえ した ものと おなじ）─────
function pyrFloor(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, IN.floor);
  const r = prand(v * 23 + 1 + seed * 13);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? IN.floorD : IN.floorL);
}
function pyrWallFace(p, v, seed = 0) {
  p.rect(0, 0, 16, 16, IN.face);
  const r = prand(v * 29 + 7 + seed * 11);
  for (let y = 2; y < 16; y += 4) p.hline(0, 15, y, IN.faceLine);
  // ブロックの たての 目地（1だんごとに ずらす）
  for (let k = 0; k < 4; k++) {
    const off = (k % 2) * 4 + (v & 1) * 2;
    for (let x = off; x < 16; x += 8) p.vline(x, k * 4 + 3, k * 4 + 5, IN.faceLine);
  }
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), IN.faceSpeck);
  p.hline(0, 15, 15, IN.faceFoot);
}
function pyrWallTop(p, v) {
  p.rect(0, 0, 16, 16, IN.top);
  const r = prand(v * 31 + 3);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), IN.topSpeck);
}

// ───── フィールドの ピラミッド ─────
// m … ピラミッドの 中の いち（x … m の 下4ビット、y … 上4ビット。0〜14）。15×15 マスで 1つの 大きな 絵に なる
export function pyramidPixel(gx, gy) {
  // gx, gy … ピラミッドの まん中からの ドット（-120〜120）
  const ax = Math.abs(gx), ay = Math.abs(gy);
  const r = Math.max(ax, ay);
  if (r < 8) {
    // てっぺんの 金の 石（左上が 明るい）
    if (r > 7) return CAP[4];
    const l = (-gx - gy) / 16 + 0.5;
    return CAP[Math.max(0, Math.min(3, Math.round((1 - l) * 2.6)))];
  }
  // ななめの すじ（面と 面の さかい）
  if (Math.abs(ax - ay) < 0.75) return gy < 0 ? (gx < 0 ? RIDGE.nw : RIDGE.ne) : gx < 0 ? RIDGE.sw : RIDGE.se;
  const face = ay >= ax ? (gy < 0 ? 'n' : 's') : gx < 0 ? 'w' : 'e';
  const F = FACE[face];
  // だん（8ドットで 1だん。そとがわの ふちに だんの かげ・ひかり）
  const k = Math.floor(r / 8);
  const o = (k + 1) * 8 - r; // だんの そとの ふちからの きょり（0〜8）
  if (o < 1) return F.riser;
  // 石の ブロックの 目地（だんごとに ずらす）
  const a = face === 'n' || face === 's' ? gx : gy;
  const j = ((a + (k % 2) * 6 + 240) % 12);
  if (j < 1) return F.joint;
  return F.top;
}
function paintPyramid(p, m, v = 0) {
  const dx = m & 15, dy = m >> 4;
  const C = 7.5 * 16;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) p.set(x, y, pyramidPixel(dx * 16 + x + 0.5 - C, dy * 16 + y + 0.5 - C));
  }
  // 風で ついた 砂と 石の よごれ（すみ っこの 小さな 点）
  const r = prand(dx * 31 + dy * 17 + v);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r() * 16), y = Math.floor(r() * 16);
    const gx = dx * 16 + x + 0.5 - C, gy = dy * 16 + y + 0.5 - C;
    if (Math.max(Math.abs(gx), Math.abs(gy)) < 9) continue;
    const face = Math.abs(gy) >= Math.abs(gx) ? (gy < 0 ? 'n' : 's') : gx < 0 ? 'w' : 'e';
    if (p.get(x, y) === FACE[face].top) p.set(x, y, FACE[face].speck);
  }
  // いちばん 下の だんの 南と 東は、砂が ふきよせて いる
  if (dy === 14 || dx === 14) {
    for (let x = 0; x < 16; x++) {
      if (dy === 14 && (x + v) % 3 !== 0) p.set(x, 15, '#e2c27e');
    }
    if (dx === 14) for (let y = 0; y < 16; y += 2) p.set(15, y, '#e2c27e');
  }
}

// 日時計の とびら（しまっている）・開いた 入り口（外は くらい あな、中から 見ると 外の 光）
function doorFrame(p) {
  // わく（こい 石）と、上の まぐさ石
  p.rect(2, 1, 12, 15, '#7a5a2c');
  p.rect(1, 1, 14, 3, '#a8844a');
  p.hline(1, 14, 1, '#d8b878');
  p.hline(1, 14, 3, '#5e4420');
  p.vline(2, 4, 15, '#9c7a44');
  p.vline(13, 4, 15, '#5e4420');
}
function sunEmblem(p, cx, cy, lit) {
  const col = lit ? GOLD.light : '#e0a82a';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    p.set(cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6, col);
  }
  p.ellipse(cx + 0.5, cy + 0.5, 2.4, 2.4, GOLD.dark);
  p.ellipse(cx + 0.5, cy + 0.5, 1.9, 1.9, col);
  p.set(cx - 1, cy - 1, GOLD.hi);
}
function paintDoor(p, v, m) {
  if (m) paintPyramid(p, m, v);
  else {
    // 2.5D の かべの え（まわりは 南の 面の 石）
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, (y % 8 === 7) ? FACE.s.riser : ((x + (y >> 3) * 6) % 12 === 0 ? FACE.s.joint : FACE.s.top));
  }
  doorFrame(p);
  // 石の とびら（1まいの 大きな 石。まん中に 太陽の しるし）
  p.rect(4, 4, 8, 12, '#c8a060');
  p.vline(4, 4, 15, '#e0bc78');
  p.hline(4, 11, 4, '#e0bc78');
  p.vline(11, 5, 15, '#9a7842');
  p.hline(4, 11, 15, '#6a4a20');
  sunEmblem(p, 7.5, 9, false);
}
function paintGate(p, v, m) {
  if (!m) {
    // ピラミッドの 中から 見た 外への 出口: 外の 光が さしこむ
    pyrWallFace(p, v, 3);
    p.rect(3, 0, 10, 16, '#fff4cc');
    for (let y = 0; y < 16; y++) {
      const t = y / 15;
      const c = t < 0.35 ? '#fffbe8' : t < 0.7 ? '#fff0c0' : '#f8e0a0';
      p.hline(3, 12, y, c);
    }
    // 外の 砂ばくと 空（とおくに 見える）
    p.hline(4, 11, 9, '#f0d8a0'); p.hline(5, 10, 10, '#e8cc88');
    p.vline(3, 0, 15, '#d8b878'); p.vline(12, 0, 15, '#c8a464');
    p.hline(3, 12, 15, '#f0d090');
    return;
  }
  paintPyramid(p, m, v);
  doorFrame(p);
  // 入り口の 中は まっくら（上の ほうだけ すこし 外の 光）
  p.rect(4, 4, 8, 12, '#0c0806');
  p.hline(4, 11, 4, '#3a2610');
  p.hline(4, 11, 5, '#21160a');
  p.hline(5, 10, 6, '#160e06');
  for (let y = 12; y < 16; y++) for (let x = 4; x < 12; x++) if (dither(x, y) < (y - 11) * 0.12) p.set(x, y, '#2a1c0e');
}

// オベリスクの 台（石の 柱そのものは 人の え。client/render/chars.js の obelisk）
function paintObeliskBase(p, v) {
  desertBase(p, v, 13);
  // かげ（右下）
  p.rect(3, 5, 13, 11, '#c8a466');
  // 台（2だん）
  p.rect(1, 3, 14, 11, '#cdb282');
  p.hline(1, 14, 3, '#efdcae'); p.vline(1, 3, 13, '#e6d0a0');
  p.vline(14, 4, 13, '#a88c5e'); p.hline(1, 14, 13, '#9a7e52');
  p.rect(3, 5, 10, 7, '#dcc494');
  p.hline(3, 12, 5, '#f4e4bc'); p.vline(3, 5, 11, '#f0dcb0');
  p.hline(3, 12, 11, '#b49868'); p.vline(12, 6, 11, '#b49868');
  // まえの かお（きざまれた 線）
  p.rect(1, 13, 14, 2, '#a88c5e');
  p.hline(1, 14, 15, '#7a6038');
  for (const x of [3, 6, 9, 12]) p.set(x, 14, '#7a6038');
}

// オベリスクの 影（m … 1=北 2=東 4=南 8=西 に 影・オベリスクが つづく。つづかない はしは とがった さき）
const SHADOW = '#b89458', SHADOW_EDGE = '#c9a66a';
function paintSunShadow(p, v, m) {
  desertBase(p, v, 17);
  const HW = 3; // はばの はんぶん（ドット）
  const horiz = !!(m & (2 | 8)) || !(m & (1 | 4));
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      // u … 影の むきの いち（0〜16）、q … まん中の 線からの きょり
      const u = horiz ? x + 0.5 : y + 0.5;
      const q = Math.abs((horiz ? y : x) + 0.5 - 8);
      const lo = horiz ? m & 8 : m & 1; // 小さい がわに つづく
      const hi = horiz ? m & 2 : m & 4; // 大きい がわに つづく
      let hw = HW;
      // つづかない がわは とがった さき（オベリスクの さきの 形）
      if (!lo && u < 8) hw = Math.min(HW, (u - 1) * 0.75);
      if (!hi && u > 8) hw = Math.min(HW, (15 - u) * 0.75);
      if (q > hw + 0.6) continue;
      p.set(x, y, q > hw - 0.4 && dither(x, y) > 0.5 ? SHADOW_EDGE : SHADOW);
    }
  }
}

// ───── 歌の ボタン（石の 台。上に きざまれた しるし。光ると 金色）─────
const SYMBOLS = {
  sun: ['...#...', '.#...#.', '..###..', '#.###.#', '..###..', '.#...#.', '...#...'],
  sand: ['.......', '.##....', '#..#..#', '....##.', '.##....', '#..#..#', '....##.'],
  moon: ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'],
  star: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##'],
};
function paintButton(p, v, key, on) {
  pyrFloor(p, v, 5);
  // かげ（右下）
  p.rect(2, 3, 14, 13, '#6e5028');
  // 台
  p.rect(1, 1, 14, 13, '#d2ba84');
  p.hline(1, 14, 1, '#f0e0b0'); p.vline(1, 1, 13, '#ecdaa6');
  p.vline(14, 2, 13, '#a08858');
  // まえの かお
  p.rect(1, 13, 14, 2, '#a48a58');
  p.hline(1, 14, 14, '#7e6438');
  // しるしを きざんだ くぼみ
  const panel = on ? '#c07c18' : '#c4aa74';
  p.rect(3, 3, 10, 9, panel);
  p.hline(3, 12, 3, on ? '#8a5208' : '#a08a5c'); p.vline(3, 3, 11, on ? '#8a5208' : '#a08a5c');
  p.hline(3, 12, 11, on ? '#e8a838' : '#e2d0a2'); p.vline(12, 4, 11, on ? '#e8a838' : '#e2d0a2');
  const rows = SYMBOLS[key];
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      if (row[i] !== '#') continue;
      if (on) {
        p.set(4 + i, 4 + j, (i + j) % 3 === 0 ? '#ffffff' : '#fff2a0');
        // 光の ふち
        for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (rows[j + oy]?.[i + ox] !== '#' && p.get(4 + i + ox, 4 + j + oy) === panel) p.set(4 + i + ox, 4 + j + oy, '#f0b030');
        }
      } else {
        // きざんだ みぞ（下と 右に ひかり）
        p.set(4 + i, 4 + j, '#6e5630');
        if (rows[j + 1]?.[i] !== '#') p.set(4 + i, 5 + j, '#e2d0a2');
      }
    }
  });
  if (on) {
    // 光の つぶ
    p.set(2, 2, '#fffbe0'); p.set(13, 12, '#ffe680'); p.set(13, 2, '#ffe680');
  }
}

// ───── 流れる 砂（矢じるしの むきへ 流れる。4コマで 8ドット すすむ）─────
// m … 1=北 2=東 4=南 8=西 の となりも 流れる 砂・ありじごく（そこには ふちを かかない）
const FLOW = { base: '#d6ae68', dot: '#c8a05c', lit: '#e6c27e', ridge: '#f8e4aa', back: '#ac8646', bank: '#7a5a2e', bankL: '#a8844a' };
const FLOW_DIR = { [T.FLOW_N]: [0, -1], [T.FLOW_E]: [1, 0], [T.FLOW_S]: [0, 1], [T.FLOW_W]: [-1, 0] };
function paintFlow(p, v, f, m, id) {
  const [dx, dy] = FLOW_DIR[id];
  p.rect(0, 0, 16, 16, FLOW.base);
  // u … 流れる むきの いち（さきへ いくほど 大きい）、w … よこの いち
  const uv = (x, y) => (dx ? [dx > 0 ? x : 15 - x, y] : [dy > 0 ? y : 15 - y, x]);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const [u, w] = uv(x, y);
      const ph = (((u - f * 2) % 8) + 8) % 8;
      // 流れの すじ（こまかい 砂つぶが 流れていく）
      if (((w * 5 + u - f * 2) & 7) === 0 && (w & 1)) p.set(x, y, FLOW.dot);
      // くの字の 矢じるし（さきが 流れの むき）
      const a = Math.abs(w + 0.5 - 8);
      if (a > 5.2) continue;
      const tip = 5 - a * 0.7;
      if (Math.abs(ph - tip) < 0.5) p.set(x, y, FLOW.ridge);
      else if (Math.abs(ph - (tip - 1)) < 0.5) p.set(x, y, FLOW.back);
      else if (Math.abs(ph - (tip + 1)) < 0.5 && a < 3) p.set(x, y, FLOW.lit);
    }
  }
  // 流れの よこの ふち（となりが 流れる 砂で ない とき）。流れの 前と うしろには かかない
  const sideBits = dx ? [[1, 'n'], [4, 's']] : [[8, 'w'], [2, 'e']];
  for (const [bit, side] of sideBits) {
    if (m & bit) continue;
    if (side === 'n') { p.hline(0, 15, 0, FLOW.bank); p.hline(0, 15, 1, FLOW.bankL); }
    if (side === 's') { p.hline(0, 15, 15, FLOW.bank); p.hline(0, 15, 14, FLOW.bankL); }
    if (side === 'w') { p.vline(0, 0, 15, FLOW.bank); p.vline(1, 0, 15, FLOW.bankL); }
    if (side === 'e') { p.vline(15, 0, 15, FLOW.bank); p.vline(14, 0, 15, FLOW.bankL); }
  }
}

// ありじごく（すりばちの あな。砂が うずを まいて すいこまれる。4コマで 4分の1 まわる）
function paintPit(p, v, f) {
  p.rect(0, 0, 16, 16, FLOW.base);
  const rings = [[7.6, '#c09858'], [6.2, '#a88446'], [4.8, '#8a6834'], [3.4, '#5e4220'], [2.1, '#2e1e0c'], [1.1, '#120a04']];
  for (const [r, c] of rings) p.ellipse(8, 8, r, r * 0.9, c);
  // うずの すじ（4本。まん中へ すいこまれる）
  for (let k = 0; k < 4; k++) {
    for (let t = 0; t < 1; t += 0.06) {
      const rad = 7.2 - t * 5.4;
      const a = k * (TAU / 4) + t * 2.6 + f * (TAU / 16);
      p.set(8 + Math.cos(a) * rad - 0.5, 8 + Math.sin(a) * rad * 0.9 - 0.5, t < 0.5 ? '#e6c27e' : '#b08a4a');
    }
  }
  // そこの アリジゴクの きば
  p.set(6, 7, '#3a2410'); p.set(9, 7, '#3a2410'); p.set(6, 8, '#5a3a18'); p.set(9, 8, '#5a3a18');
}

// ───── ピラミッドの 中の かべ・とびら・かざり ─────
// ひびの 入った かべ（かくしべやの 入り口）: まえの かおにも うえにも 大きな ひび（よこの かべでも 気づける）
function paintCrack(p, v, f, m) {
  if (m & 1) pyrWallFace(p, v, 9);
  else pyrWallTop(p, v);
  const path = [[7, 0], [6, 3], [8, 5], [7, 8], [9, 10], [8, 13], [10, 15]];
  const dark = m & 1 ? '#2a1a08' : '#1a0e04', lit = m & 1 ? '#c8a060' : '#8a6a38';
  for (let k = 0; k < path.length - 1; k++) {
    const [x0, y0] = path[k], [x1, y1] = path[k + 1];
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      p.set(x, y, dark);
      p.set(x + 1, y, lit);
    }
  }
  // えだわかれ・こぼれた 石
  p.set(5, 4, dark); p.set(4, 5, dark); p.set(10, 9, dark); p.set(11, 8, dark);
  p.set(3, 14, lit); p.set(12, 15, lit); p.set(5, 15, dark);
  // すきまから ふきこむ 風の 砂つぶ
  p.set(9, 6, '#f0e2c0'); p.set(10, 12, '#f0e2c0');
}
// 石の とびら（レバー・ボタンで 開く）: なめらかな 大きな 石。まん中に 目の しるし
function paintSlab(p, v, f, m) {
  if (m & 1) {
    p.rect(0, 0, 16, 16, '#a8844a');
    p.vline(0, 0, 15, '#6e5028'); p.vline(15, 0, 15, '#5c401d');
    p.hline(0, 15, 0, '#c8a464');
    p.vline(1, 1, 14, '#c09a5a');
    p.hline(1, 14, 5, '#8a6a38'); p.hline(1, 14, 6, '#c09a5a');
    p.hline(1, 14, 11, '#8a6a38'); p.hline(1, 14, 12, '#c09a5a');
    // 目の しるし
    p.hline(5, 10, 8, '#5c401d'); p.set(4, 9, '#5c401d'); p.set(11, 9, '#5c401d'); p.hline(5, 10, 10, '#5c401d');
    p.set(7, 9, '#2a54b0'); p.set(8, 9, '#2a54b0');
    p.hline(0, 15, 15, IN.faceFoot);
  } else {
    // うえから 見た 石の とびら（かべの うえより 明るい 切り石。まん中に みぞ）
    p.rect(0, 0, 16, 16, '#7a5a30');
    p.rect(1, 1, 14, 14, '#9a7842');
    p.hline(1, 14, 1, '#b89458'); p.vline(1, 1, 14, '#b89458');
    p.hline(1, 14, 7, '#5c401d'); p.hline(1, 14, 8, '#b89458');
    p.set(4, 4, '#5c401d'); p.set(11, 11, '#5c401d');
  }
}
// 絵文字の きざまれた かべ（王の 歌の 絵。青と 赤の 絵の具）
const GLYPHS = [
  // 太陽（円と 光）
  ['.###.', '#...#', '#.#.#', '#...#', '.###.'],
  // 目
  ['.....', '.###.', '##.##', '.###.', '..#..'],
  // 鳥
  ['..##.', '.####', '###..', '.#...', '.#.#.'],
  // アンク（命の しるし）
  ['.###.', '.#.#.', '.###.', '#####', '..#..'],
  // 水（波）
  ['.....', '#.#.#', '.#.#.', '#.#.#', '.#.#.'],
  // 月
  ['.##..', '#....', '#....', '#....', '.##..'],
];
function paintGlyph(p, v, f, m) {
  if (!(m & 1)) { pyrWallTop(p, v); return; }
  pyrWallFace(p, v, 7);
  // ぬりかべ（たいらに ならした ところ）
  p.rect(1, 3, 14, 11, '#a88450');
  p.hline(1, 14, 3, '#c8a464'); p.hline(1, 14, 13, '#6e5028');
  const pick = [v % GLYPHS.length, (v + 2) % GLYPHS.length];
  const cols = [['#2a54b0', '#16306e'], ['#a8381c', '#5a1a08']];
  pick.forEach((g, k) => {
    const [c, d] = cols[(k + v) % 2];
    GLYPHS[g].forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') p.set(2 + k * 7 + i, 5 + j + (k ? 1 : 0), j === 4 ? d : c);
    });
  });
  // たての くぎり
  p.vline(8, 4, 12, '#6e5028');
}
// 金の ひつぎ（王家の 人の ひつぎ。顔と ずきん）
function paintSarcophagus(p, v) {
  pyrFloor(p, v, 7);
  // かげ
  p.rect(5, 2, 9, 14, '#6e5028');
  // からだ（下に いくほど ほそい）
  for (let y = 1; y < 16; y++) {
    const half = y < 6 ? 4 : 4 - (y - 6) * 0.22;
    const x0 = Math.round(8 - half), x1 = Math.round(8 + half) - 1;
    p.hline(x0, x1, y, GOLD.base);
    p.set(x0, y, GOLD.light); p.set(x1, y, GOLD.mid);
  }
  // ずきん（青と 金の しま）
  for (let y = 1; y < 7; y++) p.hline(4, 11, y, y % 2 ? LAPIS.base : GOLD.light);
  // 顔
  p.rect(6, 2, 4, 4, '#d89a3a');
  p.set(6, 3, '#2a1a08'); p.set(9, 3, '#2a1a08');
  p.hline(7, 8, 5, '#a86a1a');
  // むねで くんだ うで・しま もよう
  p.hline(5, 10, 8, GOLD.dark); p.hline(5, 10, 9, GOLD.hi);
  for (let y = 11; y < 15; y += 2) p.hline(6, 9, y, LAPIS.dark);
  p.set(7, 15, GOLD.mid); p.set(8, 15, GOLD.mid);
}
// 王の 台（月の鏡を まつる 台。三日月の しるし）
function paintAltar(p, v) {
  pyrFloor(p, v, 11);
  p.rect(2, 3, 14, 13, '#6e5028');
  p.rect(1, 2, 14, 12, '#d8c08a');
  p.rect(1, 2, 14, 1, GOLD.light); p.rect(1, 2, 1, 12, GOLD.light);
  p.rect(14, 3, 1, 11, GOLD.mid); p.rect(1, 13, 14, 1, GOLD.mid);
  p.rect(3, 4, 10, 8, '#c8ae78');
  // 三日月（銀色）
  p.ellipse(8, 8, 3.2, 3.2, '#e8f0ff');
  p.ellipse(9.3, 7.4, 2.8, 2.8, '#c8ae78');
  p.set(6, 7, '#ffffff');
  // まえの かお
  p.rect(1, 14, 14, 2, '#a48a58');
  p.hline(1, 14, 15, '#7e6438');
}
// 呪文を すいこむ もんしょう（2階の ゆか。むらさきの 輪と 目）
function paintSealRune(p, v) {
  pyrFloor(p, v, 15);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x + 0.5 - 8, y + 0.5 - 8);
      if (d > 5.6 && d < 6.8) p.set(x, y, dither(x, y) > 0.3 ? '#7a4ab8' : '#5a3088');
      else if (d > 3.2 && d < 4) p.set(x, y, '#9a6ad8');
    }
  }
  // 輪の まわりの 小さな 文字
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU + 0.3;
    p.set(8 + Math.cos(a) * 4.9 - 0.5, 8 + Math.sin(a) * 4.9 - 0.5, '#c8a8ff');
  }
  // まん中の 目
  p.hline(6, 9, 7, '#d8b8ff'); p.hline(6, 9, 8, '#d8b8ff');
  p.set(7, 7, '#3a1a6a'); p.set(8, 8, '#3a1a6a');
}

export const PYRAMID_PAINTERS = {
  [T.PYRAMID]: (p, v, f, m) => paintPyramid(p, m, v),
  [T.PYR_DOOR]: (p, v, f, m) => paintDoor(p, v, m),
  [T.PYR_GATE]: (p, v, f, m) => paintGate(p, v, m),
  [T.OBELISK_BASE]: (p, v) => paintObeliskBase(p, v),
  [T.SUN_SHADOW]: (p, v, f, m) => paintSunShadow(p, v, m),
  [T.BTN_SUN]: (p, v) => paintButton(p, v, 'sun', false),
  [T.BTN_SAND]: (p, v) => paintButton(p, v, 'sand', false),
  [T.BTN_MOON]: (p, v) => paintButton(p, v, 'moon', false),
  [T.BTN_STAR]: (p, v) => paintButton(p, v, 'star', false),
  [T.BTN_SUN_ON]: (p, v) => paintButton(p, v, 'sun', true),
  [T.BTN_SAND_ON]: (p, v) => paintButton(p, v, 'sand', true),
  [T.BTN_MOON_ON]: (p, v) => paintButton(p, v, 'moon', true),
  [T.BTN_STAR_ON]: (p, v) => paintButton(p, v, 'star', true),
  [T.FLOW_N]: (p, v, f, m) => paintFlow(p, v, f, m, T.FLOW_N),
  [T.FLOW_E]: (p, v, f, m) => paintFlow(p, v, f, m, T.FLOW_E),
  [T.FLOW_S]: (p, v, f, m) => paintFlow(p, v, f, m, T.FLOW_S),
  [T.FLOW_W]: (p, v, f, m) => paintFlow(p, v, f, m, T.FLOW_W),
  [T.SAND_PIT]: (p, v, f) => paintPit(p, v, f),
  [T.PYR_CRACK]: paintCrack,
  [T.PYR_SLAB]: paintSlab,
  [T.SARCOPHAGUS]: (p, v) => paintSarcophagus(p, v),
  [T.PYR_ALTAR]: (p, v) => paintAltar(p, v),
  [T.PYR_GLYPH]: paintGlyph,
  [T.SEAL_RUNE]: (p, v) => paintSealRune(p, v),
};
// ピラミッドの 中の かがり火（金色の 青銅の 台。render/tiles.js の かがり火が mask 4 の とき）
export function paintPyrBrazier(p, v, f, lit) {
  pyrFloor(p, v, 23);
  // かげ
  p.rect(6, 14, 6, 2, IN.floorD);
  // あし と 台
  p.rect(7, 9, 2, 5, '#8a5c1c'); p.vline(7, 9, 13, '#c88e30');
  p.rect(4, 13, 8, 2, '#7a4e14'); p.hline(4, 11, 13, '#b07a26');
  // はち
  p.rect(3, 5, 10, 4, '#a86e1e'); p.hline(3, 12, 5, '#f0c050'); p.rect(4, 6, 8, 2, lit ? '#4a2008' : '#3a2410');
  p.set(3, 8, '#7a4e14'); p.set(12, 8, '#7a4e14');
  if (!lit) return;
  const h = 5 + (f % 3);
  p.rect(6, 7 - h + 2, 5, h - 1, '#ff7a2a');
  p.rect(7, 7 - h, 3, h, '#ffb13a');
  p.set(8, 7 - h - 1, '#ffb13a');
  p.rect(7 + (f % 2), 7 - h + 3, 2, Math.max(1, h - 4), '#fff0a0');
}

// ピラミッドの 中の レバー（砂岩の 台に 青銅の レバー。render/tiles.js の レバーが mask 4 の とき）
export function paintPyrLever(p, v, on) {
  pyrFloor(p, v, 29);
  p.rect(4, 10, 10, 6, '#6e5028');
  p.rect(3, 9, 10, 6, '#c8ae78');
  p.hline(3, 12, 9, '#ecd8a8'); p.vline(12, 10, 14, '#9a7e4e'); p.hline(3, 12, 14, '#8a6e40');
  p.rect(6, 11, 4, 2, '#5c401d');
  // レバー（しまっている ときは 左、ひいた あとは 右に たおれている）
  for (let i = 0; i < 6; i++) p.set(on ? 8 + i : 7 - i, 10 - i, i % 2 ? '#c88e30' : '#e0a840');
  if (on) { p.rect(12, 2, 3, 3, '#4ac86a'); p.set(12, 2, '#9aff9a'); } else { p.rect(1, 2, 3, 3, '#d8403a'); p.set(1, 2, '#ff8a7a'); }
}

// 石の 文字ばん（ピラミッドの 中の かんばん。render/tiles.js の かんばんが mask 4 の とき）
export function paintTablet(p, v) {
  pyrFloor(p, v, 19);
  p.rect(4, 3, 10, 13, '#6e5028');
  p.rect(3, 1, 10, 13, '#c8ae78');
  p.ellipse(8, 2.5, 5, 2, '#c8ae78');
  p.hline(4, 11, 1, '#ecd8a8'); p.vline(3, 2, 13, '#e2cc98'); p.vline(12, 2, 13, '#9a7e4e');
  for (const y of [4, 6, 8, 10]) p.hline(5, 10 - (y % 4 ? 1 : 0), y, '#6e5630');
  p.rect(2, 13, 12, 3, '#9a7e4e'); p.hline(2, 13, 13, '#c8ae78');
}

// アニメーションする タイル（流れる 砂: 4コマで 8ドット・ありじごく: 4コマで 4分の1 まわる）
export const PYRAMID_FRAMES = { [T.FLOW_N]: 4, [T.FLOW_E]: 4, [T.FLOW_S]: 4, [T.FLOW_W]: 4, [T.SAND_PIT]: 4 };
export const PYRAMID_SPEED = { [T.FLOW_N]: 130, [T.FLOW_E]: 130, [T.FLOW_S]: 130, [T.FLOW_W]: 130, [T.SAND_PIT]: 170 };
// まえの かおが ある かべ（render/tiles.js の WALLS）
export const PYRAMID_WALLS = [T.PYR_GLYPH, T.PYR_CRACK, T.PYR_SLAB];

const FLOWING = new Set([T.FLOW_N, T.FLOW_E, T.FLOW_S, T.FLOW_W, T.SAND_PIT]);
// となりの ようす（tiles-ch4.js の ch4Mask から）。あてはまらない ときは -1
export function pyramidMask(t, at, x, y) {
  if (t === T.PYRAMID || t === T.PYR_DOOR || t === T.PYR_GATE) {
    const dx = x - PYRAMID.x, dy = y - PYRAMID.y;
    // ピラミッドの 中の 出口（ピラミッドの マップ）は 0
    if (dx < 0 || dy < 0 || dx >= PYRAMID.w || dy >= PYRAMID.h || !(at(x, y - 1) === T.PYRAMID || t === T.PYRAMID)) return 0;
    return dx | (dy << 4);
  }
  if (t === T.SUN_SHADOW) {
    const s = (dx, dy) => { const n = at(x + dx, y + dy); return n === T.SUN_SHADOW || n === T.OBELISK_BASE; };
    return (s(0, -1) ? 1 : 0) | (s(1, 0) ? 2 : 0) | (s(0, 1) ? 4 : 0) | (s(-1, 0) ? 8 : 0);
  }
  if (FLOWING.has(t) && t !== T.SAND_PIT) {
    const s = (dx, dy) => FLOWING.has(at(x + dx, y + dy));
    return (s(0, -1) ? 1 : 0) | (s(1, 0) ? 2 : 0) | (s(0, 1) ? 4 : 0) | (s(-1, 0) ? 8 : 0);
  }
  return -1;
}

// ───── 2.5D だけの え（render/tex3d.js）─────
// ピラミッドの だんの うえ（切り石の 目地）・よこ（石の だん）・ボタンや 王の 台の よこ・金の ひつぎの よこ
export const PYRAMID_EXTRAS = {
  pyramid_top: (p, v) => {
    p.rect(0, 0, 16, 16, FACE.n.top);
    for (let x = (v & 1) * 6; x < 16; x += 12) p.vline(x, 0, 15, FACE.n.joint);
    p.hline(0, 15, 15, FACE.n.joint);
    const r = prand(v * 37 + 5);
    for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), FACE.n.speck);
  },
  pyramid_side: (p, v) => {
    p.rect(0, 0, 16, 16, FACE.s.top);
    p.hline(0, 15, 0, FACE.n.riser);
    p.hline(0, 15, 7, FACE.s.joint); p.hline(0, 15, 15, FACE.s.riser);
    for (let k = 0; k < 2; k++) for (let x = (k + v) % 2 * 6; x < 16; x += 12) p.vline(x, k * 8 + 1, k * 8 + 6, FACE.s.joint);
    const r = prand(v * 41 + 9);
    for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), 1 + Math.floor(r() * 14), FACE.s.speck);
  },
  pyr_stone_side: (p) => {
    p.rect(0, 0, 16, 16, '#a48a58');
    p.hline(0, 15, 0, '#d2ba84'); p.hline(0, 15, 15, '#7e6438');
    p.hline(0, 15, 8, '#8e7448');
  },
  pyr_gold_side: (p) => {
    p.rect(0, 0, 16, 16, GOLD.mid);
    p.hline(0, 15, 0, GOLD.light); p.hline(0, 15, 15, GOLD.dark);
    for (let x = 1; x < 16; x += 4) p.vline(x, 4, 11, LAPIS.base);
  },
};
