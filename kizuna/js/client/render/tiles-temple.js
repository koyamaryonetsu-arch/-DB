// 第4章 Step 7 の タイル（16×16 ドット）: 砂の底の神殿
// ・地下1階の 水（水の 高さ 上・中・下で 色と 明るさが かわる）・水が ひいた 底・うく 石の 板・とび石・高い 柱・たて穴・3色の レバー
// ・鏡の 床（本物も にせも おなじ え）・光った 本物の 道・大きな 鏡・くだけた 鏡・水の 柱の ろう・水鏡（遠い 空に うかぶ 島）
// ・砂の海賊の ほこら・かべ画・空気の ドームの かべ・水が もどった 王都の ふん水
// render/tiles-ch4.js が まぜる。2.5D は render/field3d.js（TEMPLE_LIQUIDS・TEMPLE_FLOOR_H・templeBlockSpec）と render/tex3d.js（TEMPLE_PROPS）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす（templeMask）
import { T } from '../../shared/tiles.js?v=0136232bcf56';
import { HALL_POS } from '../../shared/maps/temple.js?v=0136232bcf56';
import { makeCanvas, ctxOf, prand, shade, mix } from './pixel.js?v=0136232bcf56';

// 神殿の 石の ゆか（theme 'temple' の 洞窟の ゆかと おなじ くらいの 色）
const ST = { floor: '#5e808c', floorD: '#4a6a76', floorL: '#7a9ca8', line: '#3e5e6a', wall: '#2e525a', wallL: '#4a7680' };
// 水（上・中・下: 下ほど ふかく くらい）
const WATER = {
  hi: { base: '#3a8ac8', deep: '#2e74b0', wave: '#6ab4e8', foam: '#d8f0ff' },
  mid: { base: '#2a6aa8', deep: '#205a94', wave: '#4a90cc', foam: '#a8d4f4' },
  lo: { base: '#1e4e88', deep: '#163e72', wave: '#3a70a8', foam: '#7aa8d8' },
};
export const TW_FRAMES = 3;

function stoneFloor(p, v, base = ST.floor) {
  p.rect(0, 0, 16, 16, base);
  const r = prand(v * 41 + 7);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? shade(base, -0.1) : shade(base, 0.08));
  // 石だたみの めじ
  p.hline(0, 15, 7, shade(base, -0.22));
  p.vline(v & 1 ? 5 : 10, 0, 6, shade(base, -0.22));
  p.vline(v & 2 ? 3 : 12, 8, 15, shade(base, -0.22));
  p.hline(0, 15, 15, shade(base, -0.16));
}

// 水（ゆっくり ゆれる 波。コマで ずれる）
function paintWater(p, v, f, pal) {
  p.rect(0, 0, 16, 16, pal.base);
  const r = prand(v * 29 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), pal.deep);
  const off = (f % TW_FRAMES) * 5 + v * 3;
  for (let k = 0; k < 3; k++) {
    const y = (k * 5 + 2 + (v & 1)) % 16;
    const x0 = (off + k * 6) % 16;
    for (let i = 0; i < 5; i++) p.set((x0 + i) % 16, y, pal.wave);
    p.set((x0 + 2) % 16, (y + 15) % 16, pal.foam);
  }
}
export const paintTwHi = (p, v, f) => paintWater(p, v, f, WATER.hi);
export const paintTwMid = (p, v, f) => paintWater(p, v, f, WATER.mid);
export const paintTwLo = (p, v, f) => paintWater(p, v, f, WATER.lo);

// 水が ひいた 中の 底（ぬれた 石だたみ。水たまりが 光る）
function paintBed(p, v) {
  stoneFloor(p, v, '#5a8a88');
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(r() * 11), y = 2 + Math.floor(r() * 11);
    p.hline(x, x + 2, y, '#7ab8b4'); p.set(x + 1, y + 1, '#9ad0cc');
  }
}
// 水が ひいた ふかい 底（もに おおわれた 石・小さな 貝がら）
function paintBedLo(p, v) {
  stoneFloor(p, v, '#3e6a6e');
  const r = prand(v * 17 + 9);
  for (let i = 0; i < 8; i++) {
    const x = Math.floor(r() * 15), y = Math.floor(r() * 15);
    p.set(x, y, '#2e5a50'); p.set(x + 1, y, '#3a6e5a');
  }
  const sx = 3 + (v * 5) % 9, sy = 4 + (v * 3) % 8;
  p.set(sx, sy, '#e8d8c0'); p.set(sx + 1, sy, '#c8b49a'); p.set(sx, sy + 1, '#c8b49a');
}
// うく 石の 板（水の 上に うかぶ 白い 石。ふちの 水が 光る）
function paintRaft(p, v, f = 0) {
  paintWater(p, v, f, WATER.hi);
  p.rect(1, 1, 14, 14, '#8aa0aa');
  p.rect(1, 1, 14, 13, '#c8d8e0');
  p.hline(1, 14, 1, '#e8f2f6'); p.vline(1, 1, 13, '#e0ecf0');
  p.hline(2, 13, 7, '#aabcc4'); p.vline(8, 2, 13, '#aabcc4');
  p.set(4, 4, '#9ab0ba'); p.set(11, 10, '#9ab0ba');
}
// とび石（水が「中」の ときに 水から 顔を 出す まるい 石）
function paintStep(p, v, f = 0) {
  paintWater(p, v, f, WATER.mid);
  p.ellipse(8, 8.6, 6.6, 5.8, '#6a8a92');
  p.ellipse(8, 8, 6.4, 5.6, '#a8c0c8');
  p.ellipse(7, 7, 4, 3.2, '#c4d6dc');
  p.set(5, 5, '#e4f0f4'); p.set(6, 5, '#e4f0f4');
}
// 高い 柱に なった とび石（まわりは 水が ひいた ふかい 底。上れない）
function paintColumn(p, v) {
  paintBedLo(p, v);
  p.ellipse(8, 9.4, 7, 6.2, '#1e3a3e');
  p.ellipse(8, 8, 6.4, 5.6, '#a8c0c8');
  p.ellipse(7, 7, 4, 3.2, '#c4d6dc');
  p.set(5, 5, '#e4f0f4');
}
// 石の 板が しずんだ あとの ふかい たて穴
function paintShaft(p, v) {
  p.rect(0, 0, 16, 16, '#0a1418');
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#12303a');
  p.hline(0, 15, 0, '#1e3a44'); p.hline(0, 15, 1, '#142a32');
}

// 3色の レバー（神殿の 石の 台。しまっている ときは 左、ひいた あとは 右に たおれて 宝石が 光る）
const LEVER_COLORS = { r: ['#c8403a', '#ff8a7a'], b: ['#3a6ac8', '#9ac8ff'], y: ['#c8a020', '#fff07a'] };
function paintTempleLever(p, v, color, on) {
  stoneFloor(p, v);
  const [c, cl] = LEVER_COLORS[color];
  p.rect(3, 9, 11, 6, '#2e4a52');
  p.rect(3, 8, 10, 6, '#7a9aa4');
  p.hline(3, 12, 8, '#a8c4cc'); p.vline(12, 9, 13, '#4e6e78'); p.hline(3, 12, 13, '#4e6e78');
  p.rect(6, 10, 4, 2, '#24363c');
  for (let i = 0; i < 6; i++) p.set(on ? 8 + i : 7 - i, 9 - i, i % 2 ? shade(c, -0.1) : c);
  // とっての 玉と、台の 宝石（ひくと 光る）
  const [hx, hy] = on ? [13, 3] : [2, 3];
  p.rect(hx - 1, hy - 1, 3, 3, c); p.set(hx - 1, hy - 1, cl);
  p.rect(7, 11, 2, 1, on ? cl : shade(c, -0.35));
  if (on) { p.set(6, 11, c); p.set(9, 11, c); }
}

// 鏡の 床（銀色に 光る 床。ななめの 光の すじ。本物も にせも おなじ）
function paintMirrorFloor(p, v) {
  p.rect(0, 0, 16, 16, '#9ab8d0');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = (x + y + v * 3) % 16;
    if (d === 3 || d === 4) p.set(x, y, '#c8dcec');
    else if (d === 5) p.set(x, y, '#e8f4ff');
    else if (d === 11) p.set(x, y, '#b0c8dc');
  }
  p.hline(0, 15, 15, '#7a98b0'); p.vline(15, 0, 15, '#7a98b0');
  p.hline(0, 15, 0, '#b8d0e4'); p.vline(0, 0, 15, '#b8d0e4');
}
// 月の鏡で 光った 本物の 道（青白い 光が 下から わき上がる。コマで きらめく）
export const MIRROR_LIT_FRAMES = 4;
function paintMirrorLit(p, v, f) {
  p.rect(0, 0, 16, 16, '#d8f0ff');
  p.rect(2, 2, 12, 12, '#eef8ff');
  p.rect(4, 4, 8, 8, '#ffffff');
  p.hline(0, 15, 15, '#9ac8e8'); p.vline(15, 0, 15, '#9ac8e8');
  p.hline(0, 15, 0, '#c8e8ff'); p.vline(0, 0, 15, '#c8e8ff');
  const k = f % MIRROR_LIT_FRAMES;
  const r = prand(v * 11 + k * 5 + 1);
  for (let i = 0; i < 4; i++) {
    const x = 1 + Math.floor(r() * 14), y = 1 + Math.floor(r() * 14);
    p.set(x, y, '#7ac8f8'); p.set(x, y - 1, '#b8e4ff');
  }
}
// 大きな 鏡（かべに かかった、金の わくの 大きな 鏡。3マス つづき。m … 2=東 8=西 が 鏡）
function paintBigMirror(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, ST.wall);
  // ガラス（上ほど 明るい。みんなの すがたが ぼんやり うつる）
  for (let y = 1; y < 16; y++) p.hline(0, 15, y, mix('#e8f4ff', '#7a9ab8', y / 16));
  for (let x = 0; x < 16; x++) if ((x + 2) % 7 === 0) p.vline(x, 2, 6, '#f8fcff');
  // うつった 人かげ
  p.rect(6, 9, 3, 6, '#5a7088'); p.rect(6, 7, 3, 2, '#6a8098');
  // 金の わく（上と 下。となりが 鏡で ない がわは たての わく）
  p.hline(0, 15, 0, '#f2c14e'); p.hline(0, 15, 1, '#c8a040');
  p.hline(0, 15, 15, '#a8801e');
  if (!(m & 8)) { p.vline(0, 0, 15, '#f2c14e'); p.vline(1, 0, 15, '#c8a040'); }
  if (!(m & 2)) { p.vline(15, 0, 15, '#a8801e'); p.vline(14, 0, 15, '#c8a040'); }
  if (!(m & 8) || !(m & 2)) p.set(m & 8 ? 14 : 1, 1, '#fff4b0');
}
// くだけた 大きな 鏡の あと（通れる ゆか。ガラスの かけらが ちらばる）
function paintMirrorBroken(p, v) {
  stoneFloor(p, v);
  const r = prand(v * 19 + 3);
  for (let i = 0; i < 7; i++) {
    const x = 1 + Math.floor(r() * 13), y = 1 + Math.floor(r() * 13);
    p.set(x, y, '#e8f4ff'); p.set(x + 1, y, '#a8c8e0'); p.set(x, y + 1, '#c8dcec');
  }
}
// 水の 柱の ろう（ゆかの 上に たつ、すきとおった 水の 柱。あわが 上る）
export const PRISON_FRAMES = 3;
function paintWaterPrison(p, v, f) {
  stoneFloor(p, v);
  p.ellipse(8, 13, 7, 2.6, '#2e5a72');
  p.rect(2, 0, 12, 14, '#4aa8e0');
  p.rect(3, 0, 10, 14, '#6ac0f0');
  p.vline(4, 0, 13, '#b8e8ff'); p.vline(5, 0, 13, '#9ad8fc');
  p.vline(12, 0, 13, '#3a90c8');
  const k = f % PRISON_FRAMES;
  for (const [bx, by] of [[7, 11], [10, 6], [6, 3]]) p.set(bx, (by - k * 3 + 16) % 14, '#e8faff');
  p.ellipse(8, 13.4, 6, 1.6, '#8ad4f8');
}

// ───── 水鏡（最深部。広間 ぜんたいで 1まいの え: 遠い 空に うかぶ 島が うつる）─────
// v … 水鏡の 左上からの ずれ（下4ビット x・上4ビット y。templeVariant）
export const MIRROR_W = HALL_POS.mirror.w, MIRROR_H = HALL_POS.mirror.h;
export const WATER_MIRROR_FRAMES = 4;
// 水鏡の ドット（gx, gy … 水鏡の 左上からの ドット）の 色
export function waterMirrorColor(gx, gy, f, W = MIRROR_W * 16, H = MIRROR_H * 16) {
  const k = f % WATER_MIRROR_FRAMES;
  // 夜空の うつり（ふちほど こい 青）
  const ex = Math.min(gx, W - 1 - gx), ey = Math.min(gy, H - 1 - gy);
  const edge = Math.min(ex, ey);
  let c = mix('#0e2a5a', '#3a7ac8', Math.min(1, edge / 22));
  // 星
  const h = ((gx * 73856093) ^ (gy * 19349663)) >>> 0;
  if (h % 97 === 0) c = (h >> 8) % 2 ? '#f0f8ff' : '#b8d8ff';
  // うかぶ 島（まん中。上は 草と 木、下に 岩が たれさがる。小さな たき）
  const cx = W / 2, cy = H / 2 - 4;
  const dx = gx - cx, dy = gy - cy;
  if (dy >= -2 && dy <= 4 && Math.abs(dx) <= 30 - dy * 0.6) c = dy <= 0 ? '#5ab85a' : '#3a8a4a';
  const rockW = 26 - (dy - 4) * 2.2;
  if (dy > 4 && dy < 16 && Math.abs(dx + Math.sin(dy) * 2) <= rockW) c = dy % 3 === 0 ? '#6a5a4a' : '#8a7058';
  if (dy >= -9 && dy < -2 && Math.abs(dx + 10) <= 3 - (dy + 9) * 0.1 + (dy > -5 ? 2 : 0)) c = '#2a7a3a';
  if (dy >= -12 && dy < -2 && Math.abs(dx - 12) <= 1) c = '#e8e8f0';
  if (dy >= 5 && dy <= 22 && Math.abs(dx - 14) <= 1) c = (gy + k * 2) % 4 < 2 ? '#c8ecff' : '#8ad0f8';
  // 水面の さざなみ（コマで ながれる）
  if ((gy + Math.floor(gx / 9) + k * 3) % 11 === 0 && (gx + gy) % 3 !== 0) c = shade(c, 0.25);
  return c;
}
function paintWaterMirror(p, v, f, m = 0) {
  const ox = (v & 15) * 16, oy = ((v >> 4) & 15) * 16;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, waterMirrorColor(ox + x, oy + y, f));
  // 石の ふち（となりが 水鏡で ない がわ。1=北 2=東 4=南 8=西）
  const RIM = '#a8c4cc', RIMD = '#5e808c';
  if (m & 1) { p.hline(0, 15, 0, RIM); p.hline(0, 15, 1, RIMD); }
  if (m & 4) { p.hline(0, 15, 15, RIMD); p.hline(0, 15, 14, RIM); }
  if (m & 8) { p.vline(0, 0, 15, RIM); p.vline(1, 0, 15, RIMD); }
  if (m & 2) { p.vline(15, 0, 15, RIMD); p.vline(14, 0, 15, RIM); }
}
// 2.5D: 水鏡 ぜんたいの え（コマ f）
export function waterMirrorCanvas(f) {
  const W = MIRROR_W * 16, H = MIRROR_H * 16;
  const c = makeCanvas(W, H);
  const x = ctxOf(c);
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      x.fillStyle = waterMirrorColor(px, py, f);
      x.fillRect(px, py, 1, 1);
    }
  }
  return c;
}
// render/tiles.js の prepareMap: 水鏡の マスの ちがい（map.waterMirror … 水鏡の 左上）
export function templeVariant(t, map, x, y, v) {
  if (t !== T.WATER_MIRROR || !map?.waterMirror) return v;
  return ((x - map.waterMirror.x) & 15) | (((y - map.waterMirror.y) & 15) << 4);
}

// 砂の海賊の 一族の ほこら（砂の 上の 小さな 石の さいだん。青い 火と、ムチと いかりの しるし）
export const SHRINE_FRAMES = 2;
function paintClanShrine(p, v, f) {
  p.rect(0, 0, 16, 16, '#e2c27e');
  const r = prand(v * 23 + 1);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#d0ac68' : '#f0d698');
  p.rect(2, 7, 12, 8, '#8a6a40');
  p.rect(2, 6, 12, 8, '#c8a46a');
  p.hline(2, 13, 6, '#e8c890'); p.vline(13, 7, 13, '#9a7a48'); p.hline(2, 13, 13, '#8a6a40');
  // しるし（いかり）
  p.vline(8, 8, 12, '#5a3a22'); p.hline(6, 10, 9, '#5a3a22'); p.set(6, 12, '#5a3a22'); p.set(10, 12, '#5a3a22'); p.hline(7, 9, 12, '#5a3a22');
  // 青い 火
  const k = f % SHRINE_FRAMES;
  p.rect(6, 2 + k, 4, 4 - k, '#3a8ae8'); p.rect(7, 1 + k, 2, 5 - k, '#7ac8ff'); p.set(7, 4, '#e8f8ff');
  p.rect(5, 5, 6, 1, '#5a4a3a');
}
// かべ画（神殿の 入口の かべ。上に 流れおちる 水、下から 上る 光。m … 2=東 8=西 も かべ画）
function paintMural(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#3e6a72');
  p.hline(0, 15, 0, '#5a8890'); p.hline(0, 15, 15, '#24464e');
  // 水（上から 下へ）
  for (let x = 2; x < 14; x += 3) for (let y = 2; y < 8; y++) p.set(x + ((y + v) % 2), y, y % 3 ? '#4aa8e0' : '#9ad8fc');
  p.hline(1, 14, 8, '#2e7ab8');
  // 光（下から 上へ）
  for (let x = 3; x < 14; x += 4) { p.vline(x, 10, 14, '#f2c14e'); p.set(x, 9, '#fff4b0'); p.set(x - 1, 11, '#e8b040'); p.set(x + 1, 11, '#e8b040'); }
  if (!(m & 8)) p.vline(0, 0, 15, '#24464e');
  if (!(m & 2)) p.vline(15, 0, 15, '#24464e');
}
// 空気の ドームの かべ（あわの 向こうは 砂。m … 1=北 2=東 4=南 8=西 が ドームの 中 → あわの ふちが 光る）
function paintAirWall(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#b8946a');
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? '#a07c54' : '#d0ac80');
  // 砂の すじ（ゆっくり 流れる 砂）
  for (let x = 0; x < 16; x++) p.set(x, (x + v * 4) % 16, '#c8a478');
  const RIM = '#e8f6ff', RIM2 = '#a8d4e8';
  if (m & 1) { p.hline(0, 15, 0, RIM); p.hline(0, 15, 1, RIM2); }
  if (m & 4) { p.hline(0, 15, 15, RIM); p.hline(0, 15, 14, RIM2); }
  if (m & 8) { p.vline(0, 0, 15, RIM); p.vline(1, 0, 15, RIM2); }
  if (m & 2) { p.vline(15, 0, 15, RIM); p.vline(14, 0, 15, RIM2); }
}
// 水が もどった 王都の ふん水（かれた ふん水と おなじ 形。m … 1=北 2=東 4=南 8=西 が ふち。まん中から 水が ふき上がる）
export const FOUNTAIN_FRAMES = 3;
function paintFullFountain(p, v, f, m = 0) {
  paintWater(p, v, f, WATER.hi);
  const RIM = '#d8c8a4', RIML = '#f0e4c4', RIMD = '#a8946c', FACE = '#8a7a5a';
  if (m & 1) { p.rect(0, 0, 16, 3, RIM); p.hline(0, 15, 0, RIML); p.hline(0, 15, 3, FACE); }
  if (m & 4) { p.rect(0, 13, 16, 3, RIM); p.hline(0, 15, 13, RIML); p.hline(0, 15, 15, RIMD); }
  if (m & 8) { p.rect(0, 0, 3, 16, RIM); p.vline(0, 0, 15, RIML); }
  if (m & 2) { p.rect(13, 0, 3, 16, RIM); p.vline(15, 0, 15, RIMD); }
  if (m === 0) {
    // まん中: 石の 皿から 水が ふき上がる（コマで しぶきが はねる）
    const k = f % FOUNTAIN_FRAMES;
    p.ellipse(8, 10.5, 6.2, 3.6, FACE);
    p.ellipse(8, 9.6, 6, 3.4, RIM);
    p.ellipse(8, 9.2, 4.6, 2.4, '#6ab4e8');
    p.rect(7, 1, 2, 9, '#9ad8fc'); p.vline(7, 1, 9, '#e8f8ff');
    for (const [sx, sy] of [[4, 4], [11, 3], [3, 7], [12, 6]]) p.set(sx + (k === 1 ? 1 : 0), sy + k, '#d8f0ff');
    p.set(8, 0, '#ffffff');
  }
}

export const TEMPLE_PAINTERS = {
  [T.TW_HI]: paintTwHi, [T.TW_MID]: paintTwMid, [T.TW_LO]: paintTwLo,
  [T.TW_BED]: paintBed, [T.TW_BED_LO]: paintBedLo, [T.TW_RAFT]: paintRaft, [T.TW_STEP]: paintStep, [T.TW_COLUMN]: paintColumn, [T.TW_SHAFT]: paintShaft,
  [T.LEVER_R]: (p, v) => paintTempleLever(p, v, 'r', false), [T.LEVER_R_ON]: (p, v) => paintTempleLever(p, v, 'r', true),
  [T.LEVER_B]: (p, v) => paintTempleLever(p, v, 'b', false), [T.LEVER_B_ON]: (p, v) => paintTempleLever(p, v, 'b', true),
  [T.LEVER_Y]: (p, v) => paintTempleLever(p, v, 'y', false), [T.LEVER_Y_ON]: (p, v) => paintTempleLever(p, v, 'y', true),
  [T.MIRROR_FLOOR]: paintMirrorFloor, [T.MIRROR_LIT]: paintMirrorLit, [T.BIG_MIRROR]: paintBigMirror, [T.MIRROR_BROKEN]: paintMirrorBroken,
  [T.WATER_PRISON]: paintWaterPrison, [T.WATER_MIRROR]: paintWaterMirror,
  [T.CLAN_SHRINE]: paintClanShrine, [T.MURAL]: paintMural, [T.AIR_WALL]: paintAirWall, [T.FULL_FOUNTAIN]: paintFullFountain,
};
export const TEMPLE_FRAMES = {
  [T.TW_HI]: TW_FRAMES, [T.TW_MID]: TW_FRAMES, [T.TW_LO]: TW_FRAMES, [T.MIRROR_LIT]: MIRROR_LIT_FRAMES, [T.WATER_PRISON]: PRISON_FRAMES,
  [T.WATER_MIRROR]: WATER_MIRROR_FRAMES, [T.CLAN_SHRINE]: SHRINE_FRAMES, [T.FULL_FOUNTAIN]: FOUNTAIN_FRAMES,
};
export const TEMPLE_SPEED = {
  [T.TW_HI]: 520, [T.TW_MID]: 560, [T.TW_LO]: 600, [T.MIRROR_LIT]: 260, [T.WATER_PRISON]: 300, [T.WATER_MIRROR]: 380, [T.CLAN_SHRINE]: 240, [T.FULL_FOUNTAIN]: 160,
};
// 色を かえない タイル（render/themes.js の partOfTile。神殿の 色で かいてある）
export const TEMPLE_TILES = Object.keys(TEMPLE_PAINTERS).map(Number);

// となりの ようす（render/tiles-ch4.js の ch4Mask から）。あてはまらない ときは -1
const same = (at, x, y, set) => set.has(at(x, y));
const MIRRORS = new Set([T.BIG_MIRROR, T.MIRROR_BROKEN]);
const MURALS = new Set([T.MURAL]);
const WMIRROR = new Set([T.WATER_MIRROR]);
const AIRS = new Set([T.AIR_WALL]);
export function templeMask(t, at, x, y) {
  if (t === T.BIG_MIRROR || t === T.MIRROR_BROKEN) return (same(at, x + 1, y, MIRRORS) ? 2 : 0) | (same(at, x - 1, y, MIRRORS) ? 8 : 0);
  if (t === T.MURAL) return (same(at, x + 1, y, MURALS) ? 2 : 0) | (same(at, x - 1, y, MURALS) ? 8 : 0);
  if (t === T.WATER_MIRROR) {
    const o = (dx, dy) => !same(at, x + dx, y + dy, WMIRROR);
    return (o(0, -1) ? 1 : 0) | (o(1, 0) ? 2 : 0) | (o(0, 1) ? 4 : 0) | (o(-1, 0) ? 8 : 0);
  }
  if (t === T.AIR_WALL) {
    const inside = (dx, dy) => { const n = at(x + dx, y + dy); return n !== -1 && !AIRS.has(n); };
    return (inside(0, -1) ? 1 : 0) | (inside(1, 0) ? 2 : 0) | (inside(0, 1) ? 4 : 0) | (inside(-1, 0) ? 8 : 0);
  }
  return -1;
}

// ───── 2.5D（render/field3d.js）─────
// 水の 高さ（上・中・下）で ちがう 高さの 水面。水鏡は 広間 ぜんたいで 1まいの え（field3d.js が まとめる）
export const TEMPLE_LIQUIDS = {
  [T.TW_HI]: { name: 'tw_hi', y: -0.12, speed: 520, frames: TW_FRAMES },
  [T.TW_MID]: { name: 'tw_mid', y: -0.46, speed: 560, frames: TW_FRAMES },
  [T.TW_LO]: { name: 'tw_lo', y: -0.7, speed: 600, frames: TW_FRAMES },
  [T.WATER_MIRROR]: { name: 'water_mirror', y: -0.16, speed: 380, frames: WATER_MIRROR_FRAMES },
};
// 地面の 高さ: 中の 底は 水の「上」より ひくく、ふかい 底は「中」より ひくい。うく 石の 板は 水の 上、とび石・柱は「中」の 水の 上
export const TEMPLE_FLOOR_H = {
  [T.TW_BED]: -0.38, [T.TW_BED_LO]: -0.78, [T.TW_RAFT]: -0.08, [T.TW_STEP]: -0.4, [T.TW_COLUMN]: -0.4, [T.TW_SHAFT]: -1.3,
};
// かべに なる タイル（高さと え。field3d.js の blockSpec）
export function templeBlockSpec(id, v) {
  switch (id) {
    case T.BIG_MIRROR: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.BIG_MIRROR, 0, 0] };
    case T.MURAL: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.MURAL, v, 0] };
    case T.AIR_WALL: return { h: 2.2, top: ['t', T.AIR_WALL, v, 0], side: ['t', T.AIR_WALL, v, 0] };
    case T.FULL_FOUNTAIN: return { h: 0.35, top: ['t', T.FULL_FOUNTAIN, v, 0], side: ['x', 'stone_side', 0] };
    default: return null;
  }
}

// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）: 3色の レバー・水の 柱の ろう・砂の海賊の ほこら
function leverProp(color, on) {
  const [c, cl] = LEVER_COLORS[color];
  return [16, 14, (p) => {
    p.rect(2, 8, 12, 6, '#2e4a52'); p.rect(3, 9, 10, 4, '#7a9aa4'); p.hline(3, 12, 9, '#a8c4cc');
    for (let i = 0; i < 7; i++) p.set(on ? 8 + i : 7 - i, 8 - i, '#8a9aa4');
    if (on) { p.rect(13, 0, 3, 3, c); p.set(13, 0, cl); p.rect(7, 10, 2, 2, cl); } else { p.rect(0, 0, 3, 3, c); p.set(0, 0, cl); p.rect(7, 10, 2, 2, shade(c, -0.35)); }
  }];
}
export const TEMPLE_PROPS = {
  [T.LEVER_R]: leverProp('r', false), [T.LEVER_R_ON]: leverProp('r', true),
  [T.LEVER_B]: leverProp('b', false), [T.LEVER_B_ON]: leverProp('b', true),
  [T.LEVER_Y]: leverProp('y', false), [T.LEVER_Y_ON]: leverProp('y', true),
  [T.WATER_PRISON]: [16, 30, (p) => {
    p.ellipse(8, 28, 7, 2, '#2e5a72');
    p.rect(2, 1, 12, 27, '#4aa8e0'); p.rect(3, 1, 10, 27, '#6ac0f0');
    p.vline(4, 1, 27, '#b8e8ff'); p.vline(5, 1, 27, '#9ad8fc'); p.vline(12, 1, 27, '#3a90c8');
    p.ellipse(8, 1.5, 6, 1.4, '#a8e4ff');
    for (const [bx, by] of [[7, 22], [10, 15], [6, 9], [9, 4]]) p.set(bx, by, '#e8faff');
  }],
  [T.CLAN_SHRINE]: [16, 20, (p) => {
    p.rect(2, 11, 12, 9, '#8a6a40'); p.rect(2, 10, 12, 9, '#c8a46a'); p.hline(2, 13, 10, '#e8c890'); p.vline(13, 11, 18, '#9a7a48');
    p.vline(8, 12, 16, '#5a3a22'); p.hline(6, 10, 13, '#5a3a22'); p.hline(7, 9, 16, '#5a3a22'); p.set(6, 16, '#5a3a22'); p.set(10, 16, '#5a3a22');
    p.rect(5, 8, 6, 2, '#5a4a3a');
    p.rect(6, 2, 4, 6, '#3a8ae8'); p.rect(7, 0, 2, 7, '#7ac8ff'); p.set(7, 5, '#e8f8ff');
  }],
};
