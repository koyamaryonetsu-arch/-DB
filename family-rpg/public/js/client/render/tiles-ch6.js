// 第2部 第6章 Step 1・2「時の砂時計」の タイル（16×16 ドット）と 色（テーマ）
// ・砂時計の とびら（SAND_DOOR 256）… 砂色の 石の わくに 砂時計の もよう / 開いた とびら（257）… わくの 上から 砂が こぼれる（3コマ）
// ・砂時計の 台（258）… 石の 台に 砂時計（砂は 下）/ 砂が 落ちている 台（259）… 上の 砂が へっていく（3コマ・光る）
// ・時の砂時計の 台座（260）… 光の 砂が 上へ 流れる 大きな 砂時計（4コマ）/ からっぽの 台座（261）
// ・時が 止まった 泉（262）… 灰色の まま 動かない 水 / わらの 家の かべ（263。mask 1 … 上から 見た やね）
// ・時の ふむ石（264）/ しずんだ 時の ふむ石（265）
// render/tiles.js が まぜる。2.5D は render/field3d.js（CH6_FLOOR_H・ch6BlockSpec）と render/tex3d.js（CH6_PROPS）
// テーマ: past（千年前の フィールド。もとの 色に 少し セピアを まぜる）・toki_shrine（時のほこら）・toki_ruin（今の いせき）・toki_ruin_past（千年前の 神殿）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js';
import { prand } from './pixel.js';

const SD = { d: '#5a4220', b: '#8a6a3a', m: '#a8844a', l: '#c8a868', hl: '#e8d098' }; // 砂色の 石
const SAND = { d: '#b8904a', b: '#e0b860', l: '#f8dc90', w: '#fff4c8' };
const GLASS = { f: '#d8f0ff', e: '#7aa8c8', g: '#ffffff' };
const GOLD = { d: '#8a6418', b: '#d8a830', l: '#ffe070' };
const FL = { b: '#9a8058', l: '#b09468', d: '#7a6444', ln: '#5e4a30' };

function floorBase(p, v) {
  p.rect(0, 0, 16, 16, FL.b);
  const r = prand(v * 41 + 5);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? FL.l : FL.d);
  p.hline(0, 15, 0, FL.ln);
  p.vline(0, 0, 15, FL.ln);
}
// 砂時計の 形（x0, y0 … 左上。h … 高さ 9 か 7。top・bot … 上と 下の 砂の 量 0〜1。fall … 落ちている 砂の すじ）
function hourglass(p, x0, y0, h, top, bot, fall = false, f = 0) {
  const half = Math.floor(h / 2);
  p.hline(x0, x0 + 6, y0, GOLD.b); p.hline(x0, x0 + 6, y0 + h + 1, GOLD.b);
  p.set(x0, y0, GOLD.l); p.set(x0 + 6, y0 + h + 1, GOLD.d);
  for (let i = 0; i < h; i++) {
    const y = y0 + 1 + i;
    const wdt = i < half ? Math.max(0, 2 - Math.floor(i / 2)) : Math.max(0, Math.floor((i - half) / 2));
    const x1 = x0 + 3 - wdt - 1, x2 = x0 + 3 + wdt + 1;
    p.set(x1, y, GLASS.e); p.set(x2, y, GLASS.e);
    for (let x = x1 + 1; x < x2; x++) p.set(x, y, GLASS.f);
  }
  // 上の 砂（上から へる）・下の 砂（下から たまる）
  const tn = Math.round(top * half), bn = Math.round(bot * half);
  for (let i = half - tn; i < half; i++) {
    const wdt = Math.max(0, 2 - Math.floor(i / 2));
    for (let x = x0 + 3 - wdt; x <= x0 + 3 + wdt; x++) p.set(x, y0 + 1 + i, i === half - tn ? SAND.l : SAND.b);
  }
  for (let k = 0; k < bn; k++) {
    const i = h - 1 - k;
    const wdt = Math.max(0, Math.floor((i - half) / 2));
    for (let x = x0 + 3 - wdt; x <= x0 + 3 + wdt; x++) p.set(x, y0 + 1 + i, k === bn - 1 ? SAND.l : SAND.b);
  }
  if (fall) for (let i = half; i < h - bn; i++) if ((i + f) % 2 === 0) p.set(x0 + 3, y0 + 1 + i, SAND.w);
  p.set(x0 + 2, y0 + 2, GLASS.g);
}

// 砂時計の とびら（しまっている）: 砂色の 石の わくと 2まいの 石の とびら・まん中に 砂時計の もよう
function paintSandDoor(p, v) {
  p.rect(0, 0, 16, 16, SD.d);
  p.rect(1, 0, 14, 16, SD.b);
  p.rect(2, 2, 12, 14, SD.m);
  p.vline(7, 2, 15, SD.d); p.vline(8, 2, 15, SD.l);
  p.hline(1, 14, 1, SD.hl); p.hline(2, 13, 15, SD.d);
  for (const y of [5, 10]) { p.hline(3, 6, y, SD.l); p.hline(9, 12, y, SD.l); }
  hourglass(p, 4, 3, 7, 0.4, 0.6);
  p.set(3, 13, SD.d); p.set(12, 13, SD.d);
  const r = prand(v * 7 + 3);
  for (let i = 0; i < 3; i++) p.set(2 + Math.floor(r() * 12), 12 + Math.floor(r() * 3), SAND.d);
}
// 開いた 砂時計の とびら（わくだけ のこり、上から 砂が さらさら こぼれる）
export const DOOR_FRAMES = 3;
function paintSandDoorOpen(p, v, f) {
  floorBase(p, v);
  p.rect(0, 0, 2, 16, SD.b); p.rect(14, 0, 2, 16, SD.b);
  p.vline(1, 0, 15, SD.l); p.vline(14, 0, 15, SD.d);
  p.rect(0, 0, 16, 2, SD.m); p.hline(0, 15, 0, SD.hl);
  const k = f % DOOR_FRAMES;
  for (const x of [4, 8, 11]) for (let y = 2; y < 14; y++) if ((y + k * 2 + x) % 4 < 2) p.set(x, y, SAND.l);
  p.ellipse(8, 14.5, 5, 1.3, SAND.b); p.hline(5, 11, 14, SAND.l);
}
// 砂時計の 台（石の 台の 上に 砂時計。on … 砂が 落ちている）
export const DIAL_FRAMES = 3;
function paintDial(p, v, f, on) {
  floorBase(p, v);
  p.ellipse(8, 14.5, 6, 1.4, FL.ln);
  p.rect(3, 11, 10, 4, SD.b); p.hline(3, 12, 11, SD.hl); p.hline(3, 12, 14, SD.d);
  p.rect(4, 10, 8, 1, SD.l);
  if (on) {
    const k = f % DIAL_FRAMES;
    hourglass(p, 5, 0, 9, 0.85 - k * 0.25, 0.2 + k * 0.25, true, k);
    p.set(2, 2 + k, SAND.w); p.set(13, 4 - k, SAND.w);
  } else hourglass(p, 5, 0, 9, 0, 1);
}
// 時の砂時計の 台座（光の 砂が 下から 上へ 流れる。4コマ）・からっぽの 台座
export const ALTAR_FRAMES = 4;
function paintTimeAltar(p, v, f, empty = false) {
  floorBase(p, v);
  p.ellipse(8, 14.5, 7, 1.4, FL.ln);
  p.rect(1, 11, 14, 4, SD.b); p.hline(1, 14, 11, SD.hl); p.hline(1, 14, 14, SD.d);
  p.rect(2, 9, 12, 2, SD.m); p.hline(2, 13, 9, SD.l);
  for (const x of [3, 12]) { p.set(x, 12, GOLD.b); p.set(x, 13, GOLD.d); }
  if (empty) {
    p.ellipse(8, 9, 3, 0.8, SD.d);
    p.set(5, 7, SAND.l); p.set(11, 6, SAND.l);
    return;
  }
  const k = f % ALTAR_FRAMES;
  hourglass(p, 5, 0, 7, 0.5, 0.5);
  // 光の 砂（下から 上へ）
  for (let i = 0; i < 4; i++) {
    const y = 8 - ((k * 2 + i * 3) % 9);
    p.set(8, Math.max(1, y), '#ffffff');
  }
  p.set(3, 5 - (k % 3), SAND.w); p.set(13, 2 + (k % 3), SAND.w); p.set(2, 8, GOLD.l);
}
// 時が 止まった 泉（灰色の 水。さざなみも 止まっている）
function paintFrozenWater(p, v, f, m) {
  p.rect(0, 0, 16, 16, '#8a9098');
  const r = prand(v * 23 + 1);
  for (let k = 0; k < 3; k++) {
    const y = 2 + k * 5 + Math.floor(r() * 2);
    const x0 = Math.floor(r() * 10);
    p.hline(x0, x0 + 4, y, '#b4bac2');
    p.set(x0 + 1, y - 1, '#a4aab2');
  }
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#767c84');
  // 岸（となりが 水でない がわ）
  const rim = '#c8ccd2';
  if (m & 1) p.hline(0, 15, 0, rim);
  if (m & 2) p.vline(15, 0, 15, rim);
  if (m & 4) p.hline(0, 15, 15, rim);
  if (m & 8) p.vline(0, 0, 15, rim);
}
// わらの 家の かべ（たてに 木の 柱、よこに わらの たば）。mask 1 … 上から 見た やね（2.5D の 上の 面）
function paintStrawWall(p, v, f, m) {
  const S = { d: '#7a5a28', b: '#b8903e', l: '#d8b45a', hl: '#f0d488' };
  p.rect(0, 0, 16, 16, S.b);
  const r = prand(v * 31 + 9);
  if (m & 1) {
    for (let y = 0; y < 16; y += 2) for (let x = (y / 2) % 2; x < 16; x += 2) p.set(x, y, S.l);
    for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), S.d);
    return;
  }
  for (let y = 1; y < 16; y += 3) {
    p.hline(0, 15, y, S.l);
    for (let x = Math.floor(r() * 3); x < 16; x += 3) p.set(x, y + 1, S.d);
  }
  p.hline(0, 15, 0, S.hl);
  p.vline(0, 0, 15, S.d); p.vline(15, 0, 15, S.d);
  p.vline(7, 0, 15, '#6a4a20');
}
// 時の ふむ石（石の 板に 砂時計の しるし）・しずんだ ふむ石（光る）
function paintTimePlate(p, v, on) {
  p.rect(0, 0, 16, 16, '#6a6478');
  const r = prand(v * 13 + 7);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#565064');
  p.rect(2, 2, 12, 12, on ? '#7a7058' : '#9a94aa');
  p.hline(2, 13, 2, on ? '#5a5040' : '#c4bed4'); p.vline(2, 2, 13, on ? '#5a5040' : '#c4bed4');
  p.hline(2, 13, 13, '#4a4458'); p.vline(13, 2, 13, '#4a4458');
  const c = on ? '#ffe680' : '#5a5470';
  for (let i = 0; i < 4; i++) { p.hline(5 + i, 10 - i, 4 + i, c); p.hline(5 + i, 10 - i, 11 - i, c); }
  if (on) { p.set(7, 7, '#ffffff'); p.set(8, 8, '#ffffff'); }
}

export const CH6_PAINTERS = {
  [T.SAND_DOOR]: (p, v) => paintSandDoor(p, v),
  [T.SAND_DOOR_OPEN]: (p, v, f) => paintSandDoorOpen(p, v, f),
  [T.SAND_DIAL]: (p, v, f) => paintDial(p, v, f, false),
  [T.SAND_DIAL_ON]: (p, v, f) => paintDial(p, v, f, true),
  [T.TIME_ALTAR]: (p, v, f) => paintTimeAltar(p, v, f),
  [T.TIME_ALTAR_EMPTY]: (p, v, f) => paintTimeAltar(p, v, f, true),
  [T.FROZEN_WATER]: (p, v, f, m) => paintFrozenWater(p, v, f, m),
  [T.STRAW_WALL]: (p, v, f, m) => paintStrawWall(p, v, f, m),
  [T.TIME_PLATE]: (p, v) => paintTimePlate(p, v, false),
  [T.TIME_PLATE_ON]: (p, v) => paintTimePlate(p, v, true),
};
export const CH6_FRAMES = { [T.SAND_DOOR_OPEN]: DOOR_FRAMES, [T.SAND_DIAL_ON]: DIAL_FRAMES, [T.TIME_ALTAR]: ALTAR_FRAMES };
export const CH6_SPEED = { [T.SAND_DOOR_OPEN]: 160, [T.SAND_DIAL_ON]: 300, [T.TIME_ALTAR]: 220 };
export const CH6_TILES = Object.keys(CH6_PAINTERS).map(Number);
// 色を かえない タイル（もとの 色で かいてある。render/themes.js）
export const CH6_KEEP_COLOR = CH6_TILES;

// ───── 2.5D（render/field3d.js・render/tex3d.js）─────
// 泉は 地面より 少し ひくい。とびらと わらの かべは かべ（とびらは 洞窟の かべと おなじ 高さ。わらの かべは 家の かべ）
export const CH6_FLOOR_H = { [T.FROZEN_WATER]: -0.28, [T.TIME_PLATE_ON]: -0.05 };
export function ch6BlockSpec(id, v) {
  if (id === T.SAND_DOOR) return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.SAND_DOOR, 0, 0] };
  if (id === T.STRAW_WALL) return { h: 1.25, top: ['t', T.STRAW_WALL, v, 1], side: ['t', T.STRAW_WALL, v, 0], south: ['t', T.STRAW_WALL, v, 0] };
  return null;
}
// たてた もの（[はば, 高さ, かく 関数]）
const dialProp = (on) => [16, 22, (p) => {
  p.rect(3, 15, 10, 6, SD.b); p.hline(3, 12, 15, SD.hl); p.hline(3, 12, 20, SD.d); p.rect(4, 14, 8, 1, SD.l);
  hourglass(p, 5, 3, 9, on ? 0.6 : 0, on ? 0.4 : 1, on, 0);
  if (on) { p.set(2, 4, SAND.w); p.set(13, 7, SAND.w); }
}];
const altarProp = (empty) => [20, 26, (p) => {
  p.rect(1, 18, 18, 7, SD.b); p.hline(1, 18, 18, SD.hl); p.hline(1, 18, 24, SD.d);
  p.rect(3, 15, 14, 3, SD.m); p.hline(3, 16, 15, SD.l);
  if (empty) return;
  hourglass(p, 7, 2, 11, 0.5, 0.5);
  for (const [x, y] of [[10, 4], [10, 7], [10, 10], [4, 6], [16, 3]]) p.set(x, y, '#ffffff');
}];
export const CH6_PROPS = {
  [T.SAND_DIAL]: dialProp(false), [T.SAND_DIAL_ON]: dialProp(true),
  [T.TIME_ALTAR]: altarProp(false), [T.TIME_ALTAR_EMPTY]: altarProp(true),
};

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
const theme = (floor, wall, gem, flame) => ({
  floor: G([0, floor[0]], [0.3, floor[1]], [0.6, floor[2]], [1, '#fff8ec']),
  wall: G([0, wall[0]], [0.3, wall[1]], [0.6, wall[2]], [1, '#f8f0e0']),
  water: G([0, '#0e1a22'], [0.5, '#4a7a98'], [1, '#e8f6ff']),
  gem: G([0, '#2a1a0a'], [0.5, gem], [1, '#ffffff']),
  flame,
});
export const CH6_THEMES = {
  // 千年前の フィールド: もとの 色に セピアを 3わり まぜる（mix）。草の 緑も 水の 青も のこる
  past: { ...theme(['#2a1c0c', '#8a6a3e', '#d8b886'], ['#1e140a', '#6a5030', '#b89868'], '#f0d090', null), mix: 0.3 },
  // 時のほこら: 砂色の 石（金の 光）
  toki_shrine: theme(['#2a1e0c', '#8a6a3a', '#d4b478'], ['#1a1206', '#5a4422', '#a88a56'], '#ffe08a', null),
  // 今の 時のいせき: こけむした 灰みどりの 古い 石
  toki_ruin: theme(['#141a12', '#4e5a46', '#9aa48a'], ['#0c120c', '#34402e', '#6a7a5e'], '#a8e0a0', null),
  // 千年前の 時の神殿: できたばかりの 白っぽい 石と 金
  toki_ruin_past: theme(['#2a2214', '#a08c64', '#e8dab4'], ['#1e180c', '#7a6a48', '#c8b88e'], '#ffe08a', null),
};
