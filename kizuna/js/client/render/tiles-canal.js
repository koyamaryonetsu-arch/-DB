// 第4章 Step 2「かれた地下水路」の タイル（16×16 ドット）: 石だたみの 通路・切り石の かべ・かれた 水路の 底・水路の 水・
// 水門（しまった・開いた）・鉄の こうし・がれきの せき（render/tiles-ch4.js が CH4_PAINTERS に まぜる）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす（mask）。ひかりは 左上から
// 水路の 中（底・水・せき）は 通路より ひくい。2D では 北の 岸の 石の かべが 見えて、西の 岸の かげが おちる
import { T } from '../../shared/tiles.js?v=0136232bcf56';
import { prand, shade } from './pixel.js?v=0136232bcf56';

const TAU = Math.PI * 2;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((n) => (n + 0.5) / 16);
const dither = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
const N8 = [[0, -1], [1, 0], [0, 1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];

// 水路の 中（通路より ひくい ところ）
export const TROUGH = new Set([T.CANAL_BED, T.CANAL_WATER, T.DAM]);
// 地下水路の タイル
export const CANAL_SET = new Set([T.CANAL_FLOOR, T.CANAL_WALL, T.CANAL_BED, T.CANAL_WATER, T.SLUICE, T.SLUICE_OPEN, T.GRATE, T.DAM]);
// かべの ように たつ もの（となりが これなら かべの はしの かどを かかない）
const WALLISH = new Set([T.CANAL_WALL, T.TORCH, T.SLUICE, T.SLUICE_OPEN, T.GRATE, T.CAVE_WALL, T.WALL_STONE, T.ADOBE, T.SANDSTONE, T.LOCKED_DOOR, T.PILLAR]);
// ふつうの ダンジョンの タイル（たいまつ・レバー・かいだん・柱・がれき・ボスの ゆか）を 地下水路の え で かく しるし（mask）
export const CANAL_CTX = 64;
// 外（フィールド）の 切り石の かべ: 日の あたる うえ・すそに 砂（mask）
export const CANAL_SUN = 32;
export const CANAL_CTX_TILES = new Set([T.TORCH, T.LEVER, T.LEVER_ON, T.STAIRS_UP, T.STAIRS_DOWN, T.PILLAR, T.RUBBLE, T.BOSS_FLOOR]);

// ───── いろ ─────
// 石だたみ（黄土色の 砂岩。砂ばくの 赤い 砂岩より 白っぽい）
const CF = {
  base: '#b8a07a', baseB: '#bfa781', baseC: '#b19973', hi: '#d3bd97', pit: '#9d8562', crack: '#806849',
  joint: '#77603f', sand: '#a88c5e', sandL: '#c4a670',
  curb: '#c2aa82', curbL: '#d6c19a', curbD: '#977f5c', curbJ: '#6c5638',
};
// 日の あたる 切り石の かべの うえ（フィールドの 水路の 入り口）
const SUNTOP = { top: '#b39370', topJ: '#8f7150', topL: '#d2b48b', topD: '#7c6042', topS: '#c3a47d', sand: '#e2c27e', sandD: '#cfa964' };
// 切り石の かべ（こい 黄土色。むかしの 水の あと）
const CW = {
  face: '#8c6c47', faceL: '#a3825a', faceH: '#b5916a', faceD: '#715436', mortar: '#4f3923', foot: '#352416',
  line: '#c6b38c', lineD: '#ab9670', stain: '#76603f', stain2: '#695538', algae: '#5d5b3b',
  top: '#3d2c1c', topJ: '#33251a', topL: '#5a442e', topD: '#291c11', topS: '#463422',
};
// 水路の 岸の 石（2D の 北の 岸・2.5D の よこの め）
const BK = { face: '#97774f', faceL: '#ab8b60', faceD: '#6f5335', joint: '#4f3923', crease: '#4a3a24', shadow: '#6c5738', shadow2: '#7f6846' };
// かれた どろ（ひびわれ）
const MUD = ['#735e3e', '#836d4a', '#937b55', '#a0875f', '#ad946a', '#bca37a'];
const MUDC = { crack: '#57442b', crackD: '#45351f', peb: '#8a8274', pebL: '#b4ab9c', pebD: '#5e574c', shell: '#efe3cb', shellD: '#c9b896', sand: '#c8ad78' };
// 水路の 水（すきとおった 青緑）
const WA = {
  shadow: '#235f80', deep: '#2b6f93', base: '#3a8bb0', mid: '#4b9cbf', streak: '#7ac3d7', foam: '#bfe9ef', white: '#f2fdff', bed: '#33809f',
  wet: '#6a5034', wetD: '#57412a',
};
// がれきの せき
const DM = {
  ramp: ['#45321f', '#5a432e', '#71573d', '#896c4d', '#a2845d', '#b99a6c', '#cfb07f'],
  gap: '#3b2b1a', sand: '#c8a56c', sandL: '#ddbf88', mud: '#6c583b', mudD: '#58472f', mudL: '#7d6847',
  blockT: '#d0ae7d', blockF: '#a07c54', blockD: '#795a3a', blockE: '#5a422a',
};
// 水門（木の 板・鉄の 帯）と 鉄の こうし
const SL = {
  wood: '#7a5332', woodL: '#946a40', woodD: '#5c3c20', woodG: '#4a2f18', wet: '#3c2a1a',
  iron: '#40404a', ironL: '#64646f', ironD: '#26262e', rivet: '#a2a2ae', rust: '#86502e', rustL: '#a8683a',
  dark: '#100a07', darkB: '#1b130c', darkC: '#2a1e14', drip: '#7ac3d7',
};

// ───── どうぐ ─────
function line(p, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) p.set(Math.round(x0 + ((x1 - x0) * i) / (n || 1)), Math.round(y0 + ((y1 - y0) * i) / (n || 1)), c);
}
// いまの いろを くらく（+ で 明るく）
function tone(p, x, y, k) {
  const c = p.get(x, y);
  if (c) p.set(x, y, shade(c, k));
}

// 石だたみの 1まい（ふちは 左上が 明るく、右下が くらい。すりへった かど）。タイルの そとに はみだした ところは かかない
function slab(p, x0, y0, x1, y1, c) {
  p.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, c);
  p.hline(x0, x1, y0, shade(c, 0.13));
  p.vline(x0, y0, y1, shade(c, 0.08));
  p.hline(x0, x1, y1, shade(c, -0.1));
  p.vline(x1, y0 + 1, y1, shade(c, -0.08));
  for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) p.set(x, y, shade(c, -0.2));
}

// ───── 石だたみの 通路 ─────
// v: 0〜3 … ちがい / 4 … 北が かべ（かげ）/ 8 … 西が かべ（かげ）
// m: 1=北 2=東 4=南 8=西 が 水路（ふちの 石）/ 16=北東 32=南東 64=南西 128=北西 の すみだけ 水路
function canalFloor(p, v, m) {
  const k = v & 3;
  const r = prand(k * 61 + 7);
  p.rect(0, 0, 16, 16, CF.joint);
  // 上の れつ（この マスの 中で 1まい か 2まい）
  const split = [0, 9, 0, 6][k];
  const toneA = [CF.base, CF.baseB, CF.baseC, CF.base][k];
  if (split) { slab(p, 0, 0, split - 2, 6, toneA); slab(p, split, 0, 14, 6, CF.baseB); }
  else slab(p, 0, 0, 14, 6, toneA);
  // 下の れつ（となりの マスと 半分ずつ。いろは そろえる）
  slab(p, -8, 8, 6, 14, CF.base);
  slab(p, 8, 8, 22, 14, CF.base);
  // めじの 砂ぼこり
  for (let x = 0; x < 16; x++) for (const y of [7, 15]) if (r() < 0.22) p.set(x, y, CF.sand);
  for (let y = 0; y < 7; y++) if (r() < 0.2) p.set(15, y, CF.sand);
  for (let y = 8; y < 15; y++) if (r() < 0.2) p.set(7, y, CF.sand);
  // めじが まじわる ところの 小さな 砂の 山
  p.set(15, 7, CF.sandL); p.set(14, 7, CF.sand);
  if (k & 1) { p.set(7, 15, CF.sandL); p.set(6, 15, CF.sand); }
  // すりへって 光る ところ・小さな くぼみ・ひび
  const wx = 3 + Math.floor(r() * 6);
  p.hline(wx, wx + 2, 3, shade(toneA, 0.07)); p.set(wx + 1, 4, shade(toneA, 0.05));
  p.set(10 + Math.floor(r() * 3), 11, CF.hi);
  p.set(2 + Math.floor(r() * 4), 10 + Math.floor(r() * 3), CF.pit);
  if (k === 2) { line(p, 9, 1, 11, 3, CF.crack); line(p, 11, 3, 11, 5, CF.crack); p.set(12, 2, CF.hi); }
  if (k === 3) { line(p, 2, 9, 4, 11, CF.crack); p.set(5, 12, CF.crack); p.set(3, 8, CF.hi); }
  curbs(p, m);
  // かべの かげ（北・西に かべ）
  if (v & 4) for (let x = 0; x < 16; x++) { tone(p, x, 0, -0.16); tone(p, x, 1, -0.07); }
  if (v & 8) for (let y = 0; y < 16; y++) { tone(p, 0, y, -0.14); tone(p, 1, y, -0.06); }
}

// 水路の ふちの 石（通路が わ）
function curbs(p, m) {
  const C = CF;
  if (m & 1) { p.hline(0, 15, 0, C.curbL); p.hline(0, 15, 1, C.curb); p.hline(0, 15, 2, C.curbJ); for (const x of [7, 15]) p.vline(x, 0, 1, C.curbJ); }
  if (m & 4) { p.hline(0, 15, 13, C.curbJ); p.hline(0, 15, 14, C.curb); p.hline(0, 15, 15, C.curbL); for (const x of [3, 11]) p.vline(x, 14, 15, C.curbJ); }
  if (m & 8) { p.vline(0, 0, 15, C.curbL); p.vline(1, 0, 15, C.curb); p.vline(2, 0, 15, C.curbJ); for (const y of [7, 15]) p.hline(0, 1, y, C.curbJ); }
  if (m & 2) { p.vline(13, 0, 15, C.curbJ); p.vline(14, 0, 15, C.curb); p.vline(15, 0, 15, C.curbD); for (const y of [3, 11]) p.hline(14, 15, y, C.curbJ); }
  // すみ（ななめの マスだけ 水路）
  const corner = (x0, y0) => {
    p.rect(x0, y0, 3, 3, C.curb);
    p.hline(x0, x0 + 2, y0, C.curbL);
    p.set(x0 + 2, y0 + 2, C.curbJ);
  };
  if (m & 16) { corner(13, 0); p.vline(13, 0, 2, C.curbJ); p.hline(13, 15, 2, C.curbJ); p.set(15, 1, C.curbD); }
  if (m & 32) { corner(13, 13); p.vline(13, 13, 15, C.curbJ); p.hline(13, 15, 13, C.curbJ); p.set(15, 15, C.curbD); }
  if (m & 64) { corner(0, 13); p.vline(2, 13, 15, C.curbJ); p.hline(0, 2, 13, C.curbJ); p.set(0, 15, C.curbL); }
  if (m & 128) { corner(0, 0); p.vline(2, 0, 2, C.curbJ); p.hline(0, 2, 2, C.curbJ); }
}

// ───── 切り石の かべ ─────
// 切り石 1つ（左上が 明るく 右下が くらい）。タイルの そとに はみだした ところは かかない
function block(p, x0, y0, x1, y1, c) {
  p.rect(x0, y0, x1 - x0 + 1, y1 - y0 + 1, c);
  p.hline(x0, x1, y0, shade(c, 0.16));
  p.vline(x0, y0, y1, shade(c, 0.1));
  p.hline(x0 + 1, x1, y1, shade(c, -0.16));
  p.vline(x1, y0 + 1, y1, shade(c, -0.13));
}

// m: 1 … まえの かお（下が かべで ない）/ 2 … 下が 水路（かおが 水路の 底まで つづく）/ 4 … 西が ひらいている / 8 … 東が ひらいている / 16 … 北が ひらいている /
//    32 … 外（すそに 砂が ふきよせる。うえは 日が あたる）
// 大きな 切り石が 2だん（はしの 石は となりの マスと つながる）。むかしの 水の あと（白い 線と、その 下の しみ）
export function canalWallFace(p, v, m) {
  const r = prand((v & 3) * 43 + 11);
  const deep = m & 2;
  p.rect(0, 0, 16, 16, CW.mortar);
  // 1だんめ（y 1〜6。めじ x 3・11）・2だんめ（y 8〜13。めじ x 7）
  const mid = [CW.face, '#93724c', '#87683f', '#8f6f49'][v & 3];
  block(p, -4, 1, 2, 6, CW.face);
  block(p, 4, 1, 10, 6, mid);
  block(p, 12, 1, 18, 6, CW.face);
  block(p, -8, 8, 6, 13, CW.face);
  block(p, 8, 8, 22, 13, CW.face);
  if (deep) { block(p, -4, 15, 2, 20, CW.face); block(p, 4, 15, 10, 20, CW.face); block(p, 12, 15, 18, 20, CW.face); }
  p.hline(0, 15, 0, CW.faceL);
  // のみの あと（ななめの みじかい 線）・小さな あな
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 13), y = i < 2 ? 2 + Math.floor(r() * 3) : 9;
    p.set(x, y, CW.faceD); p.set(x + 1, y + 1, CW.faceD);
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), 2 + Math.floor(r() * 4) + (i % 2) * 7, i % 2 ? CW.faceL : CW.faceD);
  // むかしの 水の あと: 白い 線（y 10）、その 下は しみで くらい、したたった すじ
  for (let x = 0; x < 16; x++) {
    p.set(x, 10, (x * 5 + v) % 7 ? CW.line : CW.lineD);
    if ((x * 3 + v) % 5 === 0) p.set(x, 9, CW.lineD);
    for (let y = 11; y <= (deep ? 15 : 13); y++) tone(p, x, y, y === 11 ? -0.08 : -0.13);
  }
  for (let i = 0; i < 3; i++) {
    const x = 1 + Math.floor(r() * 14);
    p.vline(x, 11, 12 + Math.floor(r() * 2), CW.stain2);
  }
  if (deep) {
    // 水路の 底まで つづく かべ（こけの あと）
    for (const [x, y] of [[2, 14], [3, 15], [9, 15], [12, 15], [13, 14]]) p.set((x + v * 5) % 16, y, CW.algae);
  } else {
    p.hline(0, 15, 14, CW.faceD);
    p.hline(0, 15, 15, CW.foot);
  }
  if (m & 4) { p.vline(0, 0, deep ? 15 : 13, CW.faceH); p.set(0, 10, CW.line); }
  if (m & 8) p.vline(15, 0, deep ? 15 : 14, CW.mortar);
  // 外: すそに ふきよせた 砂
  if (m & CANAL_SUN && !deep) {
    for (let x = 0; x < 16; x++) {
      const h = 1 + Math.round(0.8 + Math.sin(x * 0.38 + v * 1.9) * 0.9);
      for (let k = 0; k < h; k++) p.set(x, 15 - k, k === h - 1 ? SUNTOP.sand : SUNTOP.sandD);
    }
  }
}

// かべの うえ（地下は くらい。石の めじが うすく 見える。外は 日が あたって 明るく、すみに 砂が たまる）
export function canalWallTop(p, v, m) {
  const r = prand((v & 3) * 29 + 5);
  const C = m & CANAL_SUN ? SUNTOP : CW;
  p.rect(0, 0, 16, 16, C.top);
  p.hline(0, 15, 7, C.topJ);
  p.vline(11, 0, 6, C.topJ);
  p.vline(3, 8, 15, C.topJ);
  p.hline(0, 10, 0, C.topS); p.hline(4, 15, 8, C.topS);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? C.topD : C.topS);
  if (m & CANAL_SUN) {
    // めじに たまった 砂
    for (const [x, y] of [[9, 6], [10, 6], [10, 5], [1, 14], [2, 14], [2, 15], [12, 7], [13, 7]]) p.set((x + v * 5) % 16, y, SUNTOP.sand);
  }
  if (m & 16) { p.hline(0, 15, 0, C.topL); p.hline(0, 15, 1, C.topS); }
  if (m & 4) { p.vline(0, 0, 15, C.topL); p.vline(1, 0, 15, C.topS); }
  if (m & 8) p.vline(15, 0, 15, C.topD);
}

// ───── 水路の 中の き まり（2D と 2.5D）─────
// 水の 流れる むき（0 = 東西・1 = 南北）。水路の 中を まっすぐ どこまで つづくかで きめる
export function canalFlow(at, x, y) {
  const run = (dx, dy) => {
    let n = 0;
    for (let k = 1; k <= 12; k++) {
      if (!TROUGH.has(at(x + dx * k, y + dy * k))) break;
      n++;
    }
    return n;
  };
  return run(0, -1) + run(0, 1) > run(-1, 0) + run(1, 0) ? 1 : 0;
}

// ちがい（prepareMap・field3d.js）: 水路の 中は ばしょ（4×4 マスで ひとまわり）と 流れの むき。通路は かべの かげ
export function canalVariant(t, at, x, y, v) {
  if (TROUGH.has(t)) return (x & 3) | ((y & 3) << 2) | (canalFlow(at, x, y) << 4);
  if (t === T.CANAL_FLOOR) {
    const wall = (dx, dy) => WALLISH.has(at(x + dx, y + dy));
    return (v & 3) | (wall(0, -1) ? 4 : 0) | (wall(-1, 0) ? 8 : 0);
  }
  return v;
}

// まわりに 地下水路の タイルが 2マス いじょう（ふつうの ダンジョンの タイルを 水路の え で かく）
function canalCtx(at, x, y) {
  let n = 0;
  for (const [dx, dy] of N8) if (CANAL_SET.has(at(x + dx, y + dy))) n++;
  return n >= 2;
}

// となりの ようす（tiles-ch4.js の ch4Mask から）。あてはまらない ときは -1
// 水路の 中（底・水・せき）: 1=北 2=東 4=南 8=西 が 岸 / 128 … 北西の すみだけ 岸（かげ）。
// とびらで 底 ⇔ 水 ⇔ せき が かわっても おなじ mask（どれも 水路の 中）
export function canalMask(t, at, x, y) {
  if (TROUGH.has(t)) {
    const bank = (dx, dy) => { const n = at(x + dx, y + dy); return n !== -1 && !TROUGH.has(n); };
    let m = (bank(0, -1) ? 1 : 0) | (bank(1, 0) ? 2 : 0) | (bank(0, 1) ? 4 : 0) | (bank(-1, 0) ? 8 : 0);
    if (!(m & 9) && bank(-1, -1)) m |= 128;
    return m;
  }
  if (t === T.CANAL_FLOOR) {
    const tr = (dx, dy) => TROUGH.has(at(x + dx, y + dy));
    let m = (tr(0, -1) ? 1 : 0) | (tr(1, 0) ? 2 : 0) | (tr(0, 1) ? 4 : 0) | (tr(-1, 0) ? 8 : 0);
    if (!(m & 3) && tr(1, -1)) m |= 16;
    if (!(m & 6) && tr(1, 1)) m |= 32;
    if (!(m & 12) && tr(-1, 1)) m |= 64;
    if (!(m & 9) && tr(-1, -1)) m |= 128;
    return m;
  }
  if (CANAL_CTX_TILES.has(t)) return canalCtx(at, x, y) ? CANAL_CTX : -1;
  return -1;
}

// せきが たてに ならぶか（南北の せすじ）。となりの せきの むき、ひとつだけなら 岸の むきで きめる
export function damVertical(at, x, y) {
  const dam = (dx, dy) => at(x + dx, y + dy) === T.DAM;
  if (dam(0, -1) || dam(0, 1)) return true;
  if (dam(-1, 0) || dam(1, 0)) return false;
  const bank = (dx, dy) => { const n = at(x + dx, y + dy); return n !== -1 && !TROUGH.has(n); };
  return (bank(0, -1) || bank(0, 1)) && !(bank(-1, 0) || bank(1, 0));
}
// とびらの まえの タイルで きまる しるし（prepareMap）。せき: 16 … たてに ならぶ（ないときは よこ）
export function canalBaseBits(t, at, x, y) {
  return t === T.DAM && damVertical(at, x, y) ? 16 : 0;
}

// かべの しるし（prepareMap の WALLS）: 切り石の かべ（2 … 下が 水路 / 4・8 … 西・東が ひらいている / 16 … 北が ひらいている）・水路の かべの たいまつ
function wallBits(at, x, y) {
  const open = (dx, dy) => { const n = at(x + dx, y + dy); return n !== -1 && !WALLISH.has(n); };
  return (TROUGH.has(at(x, y + 1)) ? 2 : 0) | (open(-1, 0) ? 4 : 0) | (open(1, 0) ? 8 : 0) | (open(0, -1) ? 16 : 0);
}
// outdoor … フィールド（ダンジョンで ない）
export function canalWallBits(t, at, x, y, outdoor = false) {
  if (t === T.CANAL_WALL) return wallBits(at, x, y) | (outdoor ? CANAL_SUN : 0);
  if (t === T.TORCH && canalCtx(at, x, y)) return CANAL_CTX | wallBits(at, x, y);
  return 0;
}

// ───── かれた 水路の 底（ひびわれた どろ）─────
// 64×64 で くりかえす ひびわれ（ばしょで となりの マスと つながる）。8×8 の わくに 1つずつ 板の まんなか
const MUD_PTS = (() => {
  const r = prand(6113);
  const pts = [];
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) pts.push([i * 8 + 1.2 + r() * 5.6, j * 8 + 1.2 + r() * 5.6, r()]);
  return pts;
})();
// 小石・貝がら（64×64 の 中の いち）: [x, y, しゅるい（0 小石・1 大きな 小石・2 貝がら）]
const MUD_BITS = [[5, 6, 0], [21, 3, 1], [40, 12, 0], [57, 7, 2], [12, 25, 2], [30, 21, 0], [49, 28, 1], [3, 41, 1], [26, 38, 0], [44, 45, 2], [60, 37, 0], [15, 55, 0], [35, 58, 1], [53, 54, 0]];

function mudCell(wx, wy) {
  const ci = Math.floor(wx / 8), cj = Math.floor(wy / 8);
  let d1 = 1e9, d2 = 1e9, a = null, b = null;
  for (let dj = -1; dj <= 1; dj++) {
    for (let di = -1; di <= 1; di++) {
      const i = ci + di, j = cj + dj;
      const ii = ((i % 8) + 8) % 8, jj = ((j % 8) + 8) % 8;
      const s = MUD_PTS[jj * 8 + ii];
      const sx = s[0] + (i - ii) * 8, sy = s[1] + (j - jj) * 8;
      const d = Math.hypot(wx + 0.5 - sx, wy + 0.5 - sy);
      if (d < d1) { d2 = d1; b = a; d1 = d; a = [sx, sy, s[2]]; } else if (d < d2) { d2 = d; b = [sx, sy, s[2]]; }
    }
  }
  const gx = b[0] - a[0], gy = b[1] - a[1], gl = Math.hypot(gx, gy) || 1;
  // ひびまでの きょり（2つの 点の まんなかの 線まで）
  return { dist: (d2 * d2 - d1 * d1) / (2 * gl), nx: gx / gl, ny: gy / gl, t: a[2] };
}

// 64×64 の もようの (ox, oy) から w×h（2D の タイル も 2.5D の え も）。flow … 0 東西・1 南北（風紋の むき）
export function paintCanalBed(p, ox, oy, w, h, flow = 0) {
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const wx = (((ox + x) % 64) + 64) % 64, wy = (((oy + y) % 64) + 64) % 64;
      const c = mudCell(wx, wy);
      if (c.dist < 0.55) { p.set(x, y, c.dist < 0.25 && c.t > 0.5 ? MUDC.crackD : MUDC.crack); continue; }
      let lv = 2.6 + (c.t < 0.25 ? -0.6 : c.t > 0.8 ? 0.5 : 0);
      // 板の ふち: ひびが 左上なら 明るく、右下なら くらい
      if (c.dist < 1.7) {
        const l = -c.nx * 0.6 - c.ny * 0.8;
        if (l > 0.3) lv += 1.1;
        else if (l < -0.3) lv -= 1;
      }
      // うすい 風紋（流れに 直角）
      const u = flow ? wy : wx, s = flow ? wx : wy;
      const rp = Math.sin(TAU * (u + 1.6 * Math.sin(TAU * s / 32)) / 8);
      if (rp > 0.8) lv += 0.45;
      else if (rp < -0.85) lv -= 0.4;
      lv = Math.max(0, Math.min(MUD.length - 1, lv));
      let k = Math.floor(lv);
      if (lv - k > dither(x, y)) k++;
      p.set(x, y, MUD[Math.min(MUD.length - 1, k)]);
    }
  }
  // 小石・貝がら（タイルの はしを こえても つながる）
  for (const [bx, by, kind] of MUD_BITS) {
    const px = ((bx - ox) % 64 + 64) % 64, py = ((by - oy) % 64 + 64) % 64;
    for (const [dx, dy] of [[0, 0], [-64, 0], [0, -64], [-64, -64]]) {
      const x = px + dx, y = py + dy;
      if (x < -3 || y < -3 || x >= w + 1 || y >= h + 1) continue;
      if (kind === 2) {
        p.set(x, y, MUDC.shell); p.set(x + 1, y, MUDC.shell); p.set(x - 1, y, MUDC.shellD);
        p.set(x, y + 1, MUDC.shellD); p.set(x + 1, y - 1, MUDC.shell); p.set(x, y - 1, MUDC.shellD);
      } else if (kind === 1) {
        p.set(x, y + 1, MUDC.pebD); p.set(x + 1, y + 1, MUDC.pebD); p.set(x + 2, y + 1, MUDC.pebD);
        p.set(x, y, MUDC.peb); p.set(x + 1, y, MUDC.peb); p.set(x + 2, y, MUDC.pebD); p.set(x + 1, y - 1, MUDC.pebL); p.set(x, y - 1, MUDC.pebL);
      } else {
        p.set(x, y, MUDC.pebL); p.set(x + 1, y, MUDC.peb); p.set(x, y + 1, MUDC.pebD); p.set(x + 1, y + 1, MUDC.pebD);
      }
    }
  }
}

// 水路の 岸（底・せき）: 北は 石の かべの かお と かげ、西は かげ、東・南は ほそい 線
function bedBanks(p, m) {
  if (m & 128) { p.set(0, 0, BK.shadow); p.set(1, 0, BK.shadow); p.set(0, 1, BK.shadow); p.set(2, 0, BK.shadow2); p.set(0, 2, BK.shadow2); }
  if (m & 8) {
    for (let y = 0; y < 16; y++) {
      p.set(1, y, BK.shadow);
      if (dither(2, y) < 0.6) p.set(2, y, BK.shadow2);
    }
    p.vline(0, 0, 15, BK.crease);
  }
  if (m & 2) p.vline(15, 0, 15, BK.crease);
  if (m & 4) p.hline(0, 15, 15, BK.crease);
  if (m & 1) {
    // 北の 岸の かべ（1だんの 切り石）と その かげ
    p.rect(0, 0, 16, 3, BK.face);
    p.hline(0, 15, 0, BK.faceL);
    p.hline(0, 15, 3, BK.faceD);
    for (const x of [4, 12]) { p.vline(x, 0, 3, BK.joint); p.set(x + 1, 0, BK.faceL); p.set(x + 1, 1, BK.faceL); }
    for (let x = 0; x < 16; x++) {
      p.set(x, 4, BK.shadow);
      if (dither(x, 5) < 0.5) p.set(x, 5, BK.shadow2);
    }
    if (m & 8) { p.vline(0, 0, 5, BK.crease); }
    if (m & 2) p.vline(15, 0, 3, BK.crease);
  }
}

// ───── 水路の 水 ─────
// 32×32 で くりかえす もよう。16コマで 32ドット ながれて もとに もどる。flow … 0 東へ・1 南へ
// さざなみ（よこに ながい 光の すじ）は いつも よこむき。流れの むきに うごく
// 流れの すじ: [a, b, ながさ, こさ（0 うすい・1 明るい）]（a … 流れの むき、b … よこ）
const STREAKS = [[3, 2, 7, 1], [19, 5, 4, 0], [9, 9, 8, 1], [26, 12, 5, 0], [14, 15, 4, 1], [1, 18, 6, 0], [22, 20, 7, 1], [8, 24, 4, 0], [17, 27, 6, 1], [29, 29, 4, 0], [12, 31, 5, 0], [30, 7, 5, 1]];
// きらきら: [a, b, コマの ずれ]
const GLINTS = [[6, 6, 0], [24, 14, 5], [13, 22, 10], [28, 26, 3], [2, 11, 12], [19, 30, 7]];
// 水の 下に すけて 見える 底の 石: [x, y, はば, たかさ]（うごかない）
const UNDER = [[4, 13, 3, 2], [20, 25, 4, 2], [27, 3, 2, 2], [11, 28, 3, 1]];

export function paintCanalWater(p, ox, oy, f, w, h, flow = 0) {
  const sh = f * 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const wx = ox + x, wy = oy + y;
      const a = flow ? wy : wx, b = flow ? wx : wy;
      // ゆるい すじ（深い ところ と 明るい ところ）と、流れに のって うごく ななめの なみ
      const lane = Math.sin(TAU * (b / 32 + 0.15)) * 0.6 + Math.sin(TAU * (b / 16 + 0.4)) * 0.3;
      const wave = flow ? Math.sin(TAU * ((a - sh) / 16 + b / 32)) : Math.sin(TAU * ((a - sh) / 32 + b / 16));
      const t = lane * 0.75 + wave * 0.5 + (dither(x, y) - 0.5) * 0.2;
      p.set(x, y, t < -0.6 ? WA.deep : t < 0.62 ? WA.base : WA.mid);
    }
  }
  // 32×32 の もようの (X, Y) に かく
  const put = (X, Y, c) => {
    const x = (((X - ox) % 32) + 32) % 32, y = (((Y - oy) % 32) + 32) % 32;
    if (x < w && y < h) p.set(x, y, c);
  };
  for (const [ux, uy, wd, ht] of UNDER) for (let i = 0; i < wd; i++) for (let j = 0; j < ht; j++) put(ux + i, uy + j, WA.bed);
  // さざなみ（よこに ながい。東へ ながれる ときは 頭が 明るく、南へ ながれる ときは まんなかが 明るい。下に こい かげ）
  for (const [a0, b0, len, c] of STREAKS) {
    for (let i = 0; i < len; i++) {
      let X, Y, head;
      if (flow) {
        Y = a0 + sh;
        X = b0 + i - (len >> 1);
        head = Math.abs(i - (len >> 1)) <= 1;
      } else {
        X = a0 + sh - i;
        Y = b0 + Math.round(Math.sin(TAU * (X / 32) + b0) * 0.6);
        head = i === 0;
      }
      if (i > 0 && i < len - 1) put(X, Y + 1, WA.deep);
      put(X, Y, head ? (c ? WA.white : WA.foam) : i < len * 0.6 ? (c ? WA.foam : WA.streak) : WA.streak);
    }
  }
  for (const [a, b, ph] of GLINTS) {
    const t = (f + ph) % 16;
    if (t < 2) put(flow ? b : a + sh, flow ? a + sh : b, t ? WA.foam : WA.white);
  }
}

// 水路の 岸（水）: 北は ぬれた 石の かべ と あわ、ほかは あわの 線（コマで うごく）
function waterBanks(p, m, f) {
  const fo = (i) => (i + f) % 4 !== 0;
  if (m & 128) { p.set(0, 0, WA.shadow); p.set(1, 0, WA.shadow); p.set(0, 1, WA.shadow); }
  if (m & 8) {
    for (let y = 0; y < 16; y++) { p.set(0, y, WA.shadow); if (dither(1, y) < 0.5) p.set(1, y, WA.deep); if ((y + f) % 3 === 0) p.set(1, y, WA.foam); }
  }
  if (m & 2) {
    for (let y = 0; y < 16; y++) { p.set(15, y, WA.mid); if ((y + f + 1) % 3 === 0) p.set(14, y, WA.foam); }
  }
  if (m & 4) for (let x = 0; x < 16; x++) { p.set(x, 15, fo(x + 2) ? WA.foam : WA.streak); p.set(x, 14, x % 3 ? WA.mid : WA.streak); }
  if (m & 1) {
    // 北の 岸: 水の 上に 見える ぬれた 石（2ドット）・あわ・かげ
    p.hline(0, 15, 0, BK.face);
    for (const x of [4, 12]) p.set(x, 0, BK.joint);
    p.hline(0, 15, 1, WA.wet);
    for (const x of [4, 12]) p.set(x, 1, WA.wetD);
    for (let x = 0; x < 16; x++) {
      p.set(x, 2, fo(x) ? WA.foam : WA.white);
      p.set(x, 3, WA.shadow);
      if (dither(x, 4) < 0.5) p.set(x, 4, WA.deep);
    }
    if (m & 8) p.vline(0, 0, 4, WA.shadow);
  }
}

// ───── がれきの せき ─────
// ぬれた どろの 上に、魔物が つみ上げた がれきの 山（砂と じゃりの 上に、大きな 石・くずれた 切り石を つむ）
// m: 1〜8・128 … 水路の 岸（底と おなじ）/ 16 … たてに ならぶ（ないときは よこ）
// 石（ひかりは 左上から。まわりに こい すきま）
function boulder(p, cx, cy, rx, ry, base) {
  p.ellipse(cx + 0.4, cy + 0.5, rx + 0.7, ry + 0.7, DM.gap);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const l = -nx * 0.55 - ny * 0.8 + (1 - d) * 0.35;
      const k = Math.max(0, Math.min(DM.ramp.length - 1, base + (l > 0.55 ? 2 : l > 0.15 ? 1 : l < -0.45 ? -1 : 0)));
      p.set(x, y, DM.ramp[k]);
    }
  }
}
// くずれた 切り石（うえの めんが 明るく、まえの めんは くらい）
function rubbleBlock(p, x, y, w, h) {
  p.rect(x - 1, y - 1, w + 2, h + 2, DM.gap);
  p.rect(x, y, w, 2, DM.blockT);
  p.hline(x, x + w - 1, y, shade(DM.blockT, 0.12));
  p.rect(x, y + 2, w, h - 2, DM.blockF);
  p.vline(x + w - 1, y + 2, y + h - 1, DM.blockD);
  p.hline(x, x + w - 1, y + h - 1, DM.blockD);
  p.set(x + 1, y + 3, DM.blockD);
}
function damPaint(p, v, m) {
  const r = prand((v & 15) * 37 + 3);
  const vert = m & 16;
  const P = (b, a) => (vert ? [a, b] : [b, a]); // b … せきの ならぶ むき、a … よこぎる むき
  // ぬれた どろ
  p.rect(0, 0, 16, 16, DM.mud);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? DM.mudD : DM.mudL);
  bedBanks(p, m);
  // 砂と じゃりの 山（ふちは でこぼこ）
  for (let b = 0; b < 16; b++) {
    const top = 2.5 + Math.sin(b * 0.9 + v) * 0.8, bot = 14 + Math.sin(b * 1.3 + v * 2) * 0.7;
    for (let a = Math.floor(top); a <= Math.min(15, Math.ceil(bot)); a++) {
      const [x, y] = P(b, a);
      const t = (a - top) / (bot - top);
      p.set(x, y, t < 0.18 ? DM.sandL : (x * 3 + y * 5 + v) % 7 === 0 ? DM.ramp[2] : t > 0.85 ? DM.sand : dither(x, y) < 0.5 ? DM.sand : DM.sandL);
    }
    const [sx, sy] = P(b, Math.min(15, Math.ceil(bot) + 1));
    if (sy < 16 && sx < 16) p.set(sx, sy, DM.mudD);
  }
  // 石（うしろの だんから じゅんに）。ばしょと 大きさは v で かわる
  const rocks = [];
  for (let i = 0; i < 3; i++) rocks.push([1.5 + i * 5.2 + r() * 2.2, 4.6 + r() * 1.2, 1.9 + r() * 0.9, 1.5 + r() * 0.6, 3 + Math.floor(r() * 2)]);
  for (let i = 0; i < 3; i++) rocks.push([3.2 + i * 5 + r() * 1.8, 8.4 + r() * 1.2, 2.4 + r() * 0.8, 1.9 + r() * 0.5, 2 + Math.floor(r() * 2)]);
  for (let i = 0; i < 2; i++) rocks.push([1.5 + i * 9 + r() * 3, 11.6 + r() * 0.8, 2.6 + r() * 0.9, 1.9 + r() * 0.4, 1 + Math.floor(r() * 2)]);
  const blk = 2 + Math.floor(r() * 8), blkA = 6 + Math.floor(r() * 2);
  rocks.sort((a, b) => a[1] - b[1]);
  let drawn = false;
  for (const [b, a, rb, ra, tn] of rocks) {
    if (!drawn && a > blkA + 3) {
      const [x, y] = P(blk, blkA);
      if (vert) rubbleBlock(p, y - 1, x, 4, 6); else rubbleBlock(p, x, y, 6, 4);
      drawn = true;
    }
    const [x, y] = P(b, a);
    boulder(p, x, y, vert ? ra : rb, vert ? rb : ra, tn);
  }
  // こまかい じゃり と 砂の すじ
  for (let i = 0; i < 6; i++) {
    const [x, y] = P(Math.floor(r() * 16), 3 + Math.floor(r() * 11));
    p.set(x, y, i % 2 ? DM.ramp[5] : DM.ramp[1]);
  }
}

// ───── 水門 ─────
// 石の わく（左右の 柱と うえの まぐさ石）
function sluiceFrame(p) {
  for (const x0 of [0, 13]) {
    p.rect(x0, 0, 3, 16, CW.face);
    p.hline(x0, x0 + 2, 8, CW.mortar);
    p.hline(x0, x0 + 2, 9, CW.faceL);
    p.hline(x0, x0 + 2, 15, CW.foot);
  }
  p.vline(0, 3, 14, CW.faceH); p.vline(15, 3, 14, CW.faceD);
  // 板が すべる みぞ
  p.vline(2, 3, 15, CW.mortar); p.vline(13, 3, 15, CW.mortar);
  p.rect(0, 0, 16, 3, CW.face);
  p.hline(0, 15, 0, CW.faceH);
  p.hline(0, 15, 1, CW.faceL);
  p.hline(0, 15, 2, CW.mortar);
  p.vline(8, 0, 1, CW.mortar);
  p.set(9, 0, CW.faceL);
}

// 木の 板（x 3〜12・y0〜y1）と 鉄の 帯
function sluiceBoards(p, y0, y1, bands) {
  for (let x = 3; x <= 12; x++) {
    const k = (x - 3) % 2;
    p.vline(x, y0, y1, k ? SL.wood : SL.woodL);
  }
  for (const x of [4, 8, 10]) p.set(x, y0 + 2, SL.woodG);
  for (const x of [6, 11]) p.set(x, y1 - 2, SL.woodD);
  for (const by of bands) {
    p.hline(3, 12, by, SL.ironL);
    p.hline(3, 12, by + 1, SL.iron);
    for (const x of [4, 8, 11]) { p.set(x, by, SL.rivet); p.set(x, by + 1, SL.ironD); }
    p.set(6, by + 1, SL.rust);
  }
}

// ───── 鉄の こうし ─────
function grate(p) {
  sluiceFrame(p);
  // うしろの くらやみ と 下へ おりる かいだん
  p.rect(3, 3, 10, 13, SL.dark);
  p.hline(3, 12, 9, SL.darkC); p.hline(4, 11, 10, SL.darkB);
  p.hline(3, 12, 12, '#3a2a1c'); p.hline(4, 11, 13, SL.darkC);
  p.hline(3, 12, 15, '#4a3624');
  // 鉄の ぼう（左が 明るい）
  for (const x of [3, 6, 9, 12]) {
    p.vline(x, 3, 15, SL.ironL);
    if (x < 12) p.vline(x + 1, 3, 15, SL.ironD);
  }
  for (const y of [5, 11]) {
    p.hline(3, 12, y, SL.ironL);
    p.hline(3, 12, y + 1, SL.ironD);
    for (const x of [3, 6, 9, 12]) p.set(x, y, SL.rivet);
  }
  // さび
  for (const [x, y] of [[4, 8], [7, 13], [10, 7], [9, 14], [12, 9]]) p.set(x, y, y % 2 ? SL.rust : SL.rustL);
  // 下の とがった さき
  for (const x of [3, 6, 9, 12]) p.set(x, 15, SL.rivet);
}

// ───── 地下水路の え（ふつうの ダンジョンの タイル）─────
// たいまつ: 切り石の かべに 鉄の 金具で とめた たいまつ
function canalTorch(p, v, f, m) {
  canalWallFace(p, v, (m & 30) | 1);
  const fl = [['#ff7a2a', '#ffd66b'], ['#ff9a3a', '#fff0a0'], ['#ff6a1a', '#ffc85a']][f % 3];
  // かべに うつる 火の あかり
  for (const [x, y] of [[4, 4], [11, 4], [5, 2], [10, 2], [4, 7], [11, 7], [6, 1], [9, 1]]) tone(p, x, y, 0.22);
  // 金具 と え
  p.rect(6, 10, 4, 2, SL.iron); p.hline(6, 9, 10, SL.ironL); p.set(5, 10, SL.ironD); p.set(10, 10, SL.ironD);
  p.rect(7, 7, 2, 6, '#6b4220'); p.vline(7, 7, 12, '#8a5a2e');
  p.rect(6, 6, 4, 2, '#3a2a1a');
  // ほのお
  p.rect(6, 3 - (f % 2), 4, 4 + (f % 2), fl[0]);
  p.rect(7, 4, 2, 3, fl[1]);
  p.set(7 + (f % 2), 2 - (f % 2), fl[0]);
}

// レバー（石だたみの 上の 鉄の はこ）
function canalLever(p, v, on) {
  canalFloor(p, v & 3, 0);
  p.ellipse(8.5, 13.5, 6, 1.6, CF.pit);
  p.rect(3, 9, 10, 6, '#3a3a48'); p.rect(4, 10, 8, 4, '#5a5a6e'); p.hline(4, 11, 10, '#7a7a8e');
  if (on) {
    for (let i = 0; i < 6; i++) p.set(8 + i, 9 - i, '#8a8a9a');
    p.rect(12, 2, 3, 3, '#4ac86a'); p.set(12, 2, '#9aff9a');
  } else {
    for (let i = 0; i < 6; i++) p.set(7 - i, 9 - i, '#8a8a9a');
    p.rect(1, 2, 3, 3, '#d8403a'); p.set(1, 2, '#ff8a7a');
  }
}

// かいだん（上り: 石だたみから 上へ・下り: くらい あなへ）
const ST = { top: '#d4bf98', topL: '#e2d0ac', rise: '#9e8662', side: '#7d6646', hole: '#140e0a', holeB: '#20160e' };
function canalStairsUp(p, v) {
  canalFloor(p, v & 3, 0);
  for (let i = 0; i < 4; i++) {
    const x0 = 4 - i, x1 = 11 + i, y = 1 + i * 3;
    p.rect(x0, y, x1 - x0 + 1, 3, ST.rise);
    p.hline(x0, x1, y, ST.topL);
    p.hline(x0, x1, y + 1, ST.top);
    p.set(x0, y + 1, ST.side); p.set(x1, y + 1, ST.side); p.set(x1, y + 2, ST.side);
  }
  p.hline(1, 14, 13, CF.joint);
}
function canalStairsDown(p) {
  p.rect(0, 0, 16, 16, ST.hole);
  // 左右の 石の かべ
  p.rect(0, 0, 2, 16, CW.face); p.vline(0, 0, 15, CW.faceH); p.vline(1, 0, 15, CW.faceD);
  p.rect(14, 0, 2, 16, CW.face); p.vline(14, 0, 15, CW.mortar); p.vline(15, 0, 15, CW.faceD);
  p.hline(0, 15, 0, CF.curbL); p.hline(2, 13, 1, CF.curbJ);
  for (let i = 0; i < 4; i++) {
    const y = 2 + i * 3, k = i * 0.16;
    p.rect(2 + i, y, 12 - i * 2, 2, shade(ST.top, -k));
    p.hline(2 + i, 13 - i, y, shade(ST.topL, -k));
    p.hline(2 + i, 13 - i, y + 2, shade(ST.rise, -0.3 - k));
  }
  p.hline(5, 10, 15, ST.holeB);
}

// 柱（石だたみの 上の みぞの ある 砂岩の 柱）
const PL = { c: '#c4a87e', l: '#d8c09a', h: '#e8d6b4', d: '#9c8058', dd: '#7a6242', flute: '#ad9268' };
function canalPillar(p, v) {
  canalFloor(p, v & 3, 0);
  p.ellipse(9.5, 14.6, 6.5, 1.5, CF.pit);
  p.rect(3, 12, 10, 3, PL.d); p.hline(3, 12, 12, PL.l); p.hline(3, 12, 14, PL.dd); p.vline(12, 12, 14, PL.dd);
  p.rect(5, 2, 6, 10, PL.c);
  p.vline(5, 2, 11, PL.l); p.vline(6, 2, 11, PL.h); p.vline(8, 2, 11, PL.flute); p.vline(9, 2, 11, PL.d); p.vline(10, 2, 11, PL.dd);
  p.rect(4, 0, 8, 3, PL.c); p.hline(4, 11, 0, PL.h); p.hline(4, 11, 2, PL.d); p.set(11, 1, PL.dd);
}

// がれき（石だたみに おちた 切り石の かけら と 砂）
function canalRubble(p, v) {
  canalFloor(p, v & 3, 0);
  const r = prand((v & 3) * 17 + 9);
  for (let i = 0; i < 6; i++) p.set(2 + Math.floor(r() * 12), 2 + Math.floor(r() * 12), i % 2 ? CF.sand : CF.sandL);
  const chunk = (x, y, w, c) => {
    p.rect(x, y + 1, w, 2, shade(c, -0.18));
    p.rect(x, y, w, 2, c);
    p.hline(x, x + w - 1, y, shade(c, 0.15));
    p.set(x + w, y + 2, shade(c, -0.35)); p.hline(x, x + w - 1, y + 3, shade(c, -0.35));
  };
  chunk(2, 8, 4, DM.blockT); chunk(9, 4, 3, DM.ramp[5]); chunk(10, 10, 3, DM.ramp[4]);
  p.set(6, 12, DM.ramp[3]); p.set(13, 7, DM.ramp[3]);
}

// ボスの ゆか: 大きな 石だたみ（かどに 青い 石の はめこみ。4マスで ひしがたに なる）
const BF = { s: '#c2aa82', l: '#d4bf98', d: '#a08862', j: '#6e583a', q: '#2fa39a', qL: '#7ad8c8', qD: '#1d6a66', g: '#d8b860' };
function canalBossFloor(p, v) {
  const r = prand((v & 3) * 23 + 1);
  p.rect(0, 0, 16, 16, BF.s);
  p.hline(0, 15, 0, BF.j); p.vline(0, 0, 15, BF.j);
  p.hline(1, 15, 1, BF.l); p.vline(1, 1, 15, BF.l);
  p.hline(1, 15, 15, BF.d); p.vline(15, 1, 15, BF.d);
  for (let i = 0; i < 5; i++) p.set(2 + Math.floor(r() * 12), 2 + Math.floor(r() * 12), i % 2 ? BF.d : BF.l);
  // かどの はめこみ（4分の1の ひしがた）
  const corner = (cx, cy, sx, sy) => {
    for (let k = 0; k < 4; k++) for (let j = 0; j <= 3 - k; j++) p.set(cx + sx * j, cy + sy * k, k + j < 2 ? BF.qL : BF.q);
    p.set(cx + sx * 3, cy, BF.qD); p.set(cx, cy + sy * 3, BF.qD);
  };
  corner(0, 0, 1, 1); corner(15, 0, -1, 1); corner(0, 15, 1, -1); corner(15, 15, -1, -1);
  // まんなかの 小さな 金の かざり
  p.set(7, 7, BF.g); p.set(8, 8, BF.g); p.set(7, 8, BF.d); p.set(8, 7, BF.d);
}

// ───── 2.5D の え（render/tex3d.js）─────
// 水路の 岸の よこ（通路・かべの 下から 水路の 底まで）。ひくい めんは え の 上の ほう だけ 見える:
// 上の ふち・切り石 1だん（白い 水の あと と しみ）・下の だんは こく しめっている
export function canalSidePaint(p, v) {
  const r = prand((v & 3) * 13 + 5);
  p.rect(0, 0, 16, 16, BK.joint);
  block(p, -4, 1, 3, 6, BK.face);
  block(p, 5, 1, 11, 6, [BK.face, '#9c7c53', '#8f7049', BK.face][v & 3]);
  block(p, 13, 1, 20, 6, BK.face);
  block(p, -8, 8, 6, 15, CW.face);
  block(p, 8, 8, 23, 15, CW.face);
  p.hline(0, 15, 0, BK.faceL);
  for (let x = 0; x < 16; x++) {
    p.set(x, 4, (x * 3 + v) % 7 ? CW.line : CW.lineD);
    for (let y = 5; y < 16; y++) tone(p, x, y, y < 7 ? -0.1 : -0.18);
  }
  for (let i = 0; i < 3; i++) { const x = 1 + Math.floor(r() * 14); p.vline(x, 5, 6 + Math.floor(r() * 2), CW.stain2); }
  for (const [x, y] of [[3, 12], [9, 10], [12, 13]]) p.set((x + v * 5) % 16, y, CW.algae);
}

// がれきの 山の うえ（2.5D。山の かたちの かげは 3D で つける。大きな 石は 3D の 石を のせるので、ここは 砂と じゃり）
export function damTopPaint(p, v) {
  const r = prand((v & 3) * 71 + 13);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = dither(x + v, y);
    p.set(x, y, d < 0.4 ? DM.sand : d < 0.8 ? DM.ramp[4] : DM.sandL);
  }
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 15);
    p.set(x, y, DM.ramp[5]); p.set(x + 1, y, DM.ramp[3]); p.set(x, y + 1, DM.ramp[2]); p.set(x + 1, y + 1, DM.ramp[1]);
  }
}

// 水門の うえ（2.5D）: かべの うえに 木の ふたと、とびらを 上げ下げする 鉄の 車
export function sluiceTopPaint(p, v) {
  canalWallTop(p, v, 0);
  p.rect(2, 2, 12, 12, SL.woodG);
  for (let y = 3; y < 13; y++) p.hline(3, 12, y, y % 3 === 0 ? SL.woodD : y % 3 === 1 ? SL.woodL : SL.wood);
  p.ellipse(8, 8, 4.8, 4.8, SL.ironD);
  p.ellipse(8, 8, 4.1, 4.1, SL.ironL);
  p.ellipse(8, 8, 3.1, 3.1, SL.wood);
  line(p, 5, 5, 10, 10, SL.iron); line(p, 5, 10, 10, 5, SL.iron);
  p.rect(7, 7, 2, 2, SL.ironL); p.set(7, 7, SL.rivet);
  p.set(5, 4, SL.rivet); p.set(4, 6, SL.rivet);
}
// 引き上げた 水門の 板（2.5D）
export function sluiceBoardPaint(p) {
  for (let x = 0; x < 16; x++) p.vline(x, 0, 15, x % 3 === 2 ? SL.woodD : x % 3 === 0 ? SL.woodL : SL.wood);
  for (const by of [3, 11]) {
    p.hline(0, 15, by, SL.ironL);
    p.hline(0, 15, by + 1, SL.iron);
    for (const x of [1, 6, 11]) { p.set(x, by, SL.rivet); p.set(x, by + 1, SL.ironD); }
  }
  p.hline(0, 15, 15, SL.wet); p.hline(0, 15, 14, SL.woodG);
  p.set(4, 15, SL.drip); p.set(12, 15, SL.drip);
}
// 柱（2.5D）: みぞの ある 砂岩の 柱の よこ・うえ
export function pillarSidePaint(p) {
  p.rect(0, 0, 16, 16, PL.c);
  for (let x = 0; x < 16; x++) {
    const c = x < 2 ? PL.h : x < 5 ? PL.l : x % 4 === 1 ? PL.flute : x > 12 ? PL.d : PL.c;
    p.vline(x, 0, 15, c);
  }
  p.hline(0, 15, 0, PL.h); p.hline(0, 15, 1, PL.l); p.hline(0, 15, 2, PL.d);
  p.hline(0, 15, 14, PL.l); p.hline(0, 15, 15, PL.dd);
}
export function pillarTopPaint(p) {
  p.rect(0, 0, 16, 16, PL.c);
  p.hline(0, 15, 0, PL.h); p.vline(0, 0, 15, PL.l); p.hline(0, 15, 15, PL.d); p.vline(15, 0, 15, PL.d);
  p.rect(3, 3, 10, 10, PL.l); p.rect(4, 4, 8, 8, PL.c); p.set(5, 5, PL.h);
}
// がれきの 石と 切り石（2.5D の たてた 石。48×16: 石 | 切り石の よこ | 切り石の うえ）
export function rubbleAtlasPaint(p) {
  const r = prand(4471);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const k = 2 + Math.floor(r() * 2.2) + (dither(x, y) > 0.8 ? 1 : 0);
    p.set(x, y, DM.ramp[Math.min(DM.ramp.length - 1, k)]);
  }
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.set(x, y, DM.gap); p.set(x + 1, y + 1, DM.ramp[1]); }
  p.rect(16, 0, 16, 16, DM.blockF);
  p.hline(16, 31, 0, DM.blockT); p.hline(16, 31, 5, DM.blockD); p.hline(16, 31, 6, DM.blockE);
  p.hline(16, 31, 11, DM.blockD); p.vline(23, 7, 10, DM.blockE);
  for (let i = 0; i < 4; i++) { const x = 17 + Math.floor(r() * 13), y = 1 + Math.floor(r() * 13); p.set(x, y, DM.blockD); }
  p.rect(32, 0, 16, 16, DM.blockT);
  p.hline(32, 47, 0, shade(DM.blockT, 0.12)); p.vline(32, 0, 15, shade(DM.blockT, 0.08));
  p.hline(32, 47, 15, DM.blockF); p.vline(47, 0, 15, DM.blockF);
  for (let i = 0; i < 4; i++) p.set(34 + Math.floor(r() * 12), 2 + Math.floor(r() * 12), DM.ramp[4]);
}

// ───── え の 一覧 ─────
export const CANAL_PAINTERS = {
  [T.CANAL_FLOOR]: (p, v, f, m) => canalFloor(p, v, m),
  [T.CANAL_WALL]: (p, v, f, m) => (m & 1 ? canalWallFace(p, v, m) : canalWallTop(p, v, m)),
  [T.CANAL_BED]: (p, v, f, m) => {
    paintCanalBed(p, (v & 3) * 16, ((v >> 2) & 3) * 16, 16, 16, (v >> 4) & 1);
    bedBanks(p, m);
  },
  [T.CANAL_WATER]: (p, v, f, m) => {
    paintCanalWater(p, (v & 1) * 16, ((v >> 2) & 1) * 16, f, 16, 16, (v >> 4) & 1);
    waterBanks(p, m, f);
  },
  [T.SLUICE]: (p) => {
    sluiceFrame(p);
    // まぐさ石の 下の かげ・板・鉄の 帯・くさり
    sluiceBoards(p, 3, 15, [6, 12]);
    p.hline(3, 12, 3, SL.woodD);
    p.vline(7, 3, 5, SL.ironL); p.vline(8, 4, 5, SL.ironD); p.set(8, 3, SL.ironD);
    // 下の ぬれた ところ と しみでる 水
    p.hline(3, 12, 15, SL.wet); p.hline(3, 12, 14, SL.woodD);
    p.set(5, 15, SL.drip); p.set(10, 15, SL.drip);
  },
  [T.SLUICE_OPEN]: (p) => {
    sluiceFrame(p);
    // 引き上げた 板（まぐさ石の 上に つきでる）と、下の くらい あな
    p.rect(3, 9, 10, 7, SL.dark);
    p.hline(3, 12, 13, SL.darkB); p.hline(3, 12, 14, SL.darkB); p.hline(3, 12, 15, SL.darkC);
    p.set(6, 14, WA.shadow); p.set(7, 14, WA.deep); p.set(10, 15, WA.shadow);
    sluiceBoards(p, 0, 8, [5]);
    p.hline(3, 12, 2, CW.mortar);
    p.hline(3, 12, 8, SL.woodD); p.hline(3, 12, 9, SL.wet);
    // まぐさ石の ふち（板の まえ）
    p.hline(0, 2, 0, CW.faceH); p.hline(13, 15, 0, CW.faceH);
    p.set(5, 10, SL.drip); p.set(9, 12, SL.drip); p.set(11, 10, SL.drip);
  },
  [T.GRATE]: (p) => grate(p),
  [T.DAM]: (p, v, f, m) => damPaint(p, v, m),
};

// 地下水路の まわりの ふつうの タイル（mask に CANAL_CTX が ある とき。render/tiles.js が もとの え と いれかえる）
export const CANAL_CTX_PAINTERS = {
  [T.TORCH]: canalTorch,
  [T.LEVER]: (p, v) => canalLever(p, v, false),
  [T.LEVER_ON]: (p, v) => canalLever(p, v, true),
  [T.STAIRS_UP]: (p, v) => canalStairsUp(p, v),
  [T.STAIRS_DOWN]: (p) => canalStairsDown(p),
  [T.PILLAR]: (p, v) => canalPillar(p, v),
  [T.RUBBLE]: (p, v) => canalRubble(p, v),
  [T.BOSS_FLOOR]: (p, v) => canalBossFloor(p, v),
};

// アニメーション（水は 16コマで 32ドット ながれる）
export const CANAL_FRAMES = { [T.CANAL_WATER]: 16 };
export const CANAL_SPEED = { [T.CANAL_WATER]: 110 };
export const CANAL_WALLS = [T.CANAL_WALL];
