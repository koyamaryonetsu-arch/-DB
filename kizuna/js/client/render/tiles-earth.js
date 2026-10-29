// 第5章 Step 6・7「大地の神殿」と 根の島の タイル（16×16 ドット）と 神殿の 色（テーマ）
// ・根の 橋（太い 根が からみあった 橋）・根の すきまの ふかい 谷（くらやみに 根の ひげ。4コマで ちりが ゆれる）
// ・根の 水がめ（からっぽ／水を そそいだ〈2コマで 水面が ゆれる〉）・土の 守り手（南むき・東むきの 石の ゴーレム）
// ・守り手の 石板（金の しるし）・もとに もどす 石板（青い 回る 矢じるし）・ゆかの あな・あなを うめた ゴーレムの せなか
// ・根の とびら（4階）・こわれた 上り下りの ゆか・直った 上り下りの ゆか・大地の 守り星の 祭だん（3コマ）・神殿の 入口（根の とびら）
// render/tiles.js が まぜる。2.5D は render/field3d.js（EARTH_LIQUIDS・EARTH_FLOOR_H・earthBlockSpec）と render/tex3d.js（EARTH_PROPS）
// テーマ（earth_1 … 1〜2階 土の こげ茶〜 earth_4 … 7〜8階 大地の 心の あかね色）は render/themes.js
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=99ee8fb62a40';
import { prand } from './pixel.js?v=99ee8fb62a40';

// 根（こげ茶）・谷（くらやみ）・石（灰土色）・水（あおい）・金の 光
const RT = { d: '#3e2814', b: '#6a4626', m: '#8a5e34', l: '#a87a48', hl: '#c89a62' };
const GP = { b: '#0e0a06', m: '#1a120a', l: '#2a1c10', r: '#3a2814', dust: '#6a5038' };
const ST = { d: '#4e463c', b: '#7a7062', m: '#958a78', l: '#b4a890', ln: '#5e5648' };
const WA = { d: '#1e4a7a', b: '#3a78b8', l: '#7ab8e8', hl: '#d8f0ff' };
const GOLD = { g: '#e8c050', gl: '#fff0a0', gd: '#a8842a' };
const FL = { b: '#6a5e50', l: '#7e7262', d: '#544a3e', ln: '#463e34' };

function floorBase(p, v) {
  p.rect(0, 0, 16, 16, FL.b);
  const r = prand(v * 41 + 13);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? FL.d : FL.l);
  p.hline(0, 15, 0, FL.ln);
}

// 根の すきまの 谷（くらやみの 底に、細い 根の ひげ。ちりが ゆっくり ゆれる）
export const GAP_FRAMES = 4;
function paintRootGap(p, v, f) {
  p.rect(0, 0, 16, 16, GP.b);
  const r = prand(v * 29 + 3);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r() * 16), y0 = Math.floor(r() * 6), len = 4 + Math.floor(r() * 7);
    for (let k = 0; k < len; k++) p.set((x + Math.floor(k / 4)) % 16, (y0 + k) % 16, k % 3 ? GP.m : GP.l);
  }
  const r2 = prand(v * 7 + 11);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r2() * 16), y = (Math.floor(r2() * 16) + (f % GAP_FRAMES)) % 16;
    p.set(x, y, i === f % 3 ? GP.dust : GP.r);
  }
}
// 根の 橋（太い 根が 3本 からみあう。すきまから 谷が 見える）
function paintRootBridge(p, v) {
  p.rect(0, 0, 16, 16, GP.m);
  const r = prand(v * 17 + 5);
  for (const [y0, w] of [[1, 4], [6, 5], [12, 3]]) {
    const wave = Math.floor(r() * 3);
    for (let x = 0; x < 16; x++) {
      const y = y0 + ((x + wave) % 8 < 4 ? 0 : 1);
      for (let k = 0; k < w; k++) p.set(x, Math.min(15, y + k), k === 0 ? RT.hl : k === w - 1 ? RT.d : k === 1 ? RT.l : RT.m);
    }
  }
  // よこに からむ 細い 根
  for (const x of [3 + (v & 1), 10 + ((v >> 1) & 1)]) for (let y = 0; y < 16; y++) if (y % 5 !== 4) p.set(x, y, y % 2 ? RT.b : RT.m);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RT.d);
}
// 根の 水がめ（ゆかの 上に、口の 大きな 土の かめ）
export const JAR_FRAMES = 2;
function paintJar(p, v, f, on) {
  floorBase(p, v);
  p.ellipse(8, 14, 5.5, 1.6, FL.d);
  p.ellipse(8, 9.5, 5.5, 5, '#8a5a3a');
  p.ellipse(7, 8.5, 4, 3.5, '#a87048');
  p.rect(4, 3, 9, 3, '#7a4a2e');
  p.hline(4, 12, 3, '#b88050');
  p.ellipse(8, 4, 3.5, 1.2, on ? WA.b : '#2a1a10');
  if (on) {
    p.set(6 + (f % 2), 4, WA.hl); p.set(10 - (f % 2), 4, WA.l);
    for (const [x, y] of [[2, 2], [14, 6], [13, 1]]) p.set(x, y, f % 2 ? WA.hl : WA.l);
  }
  p.set(5, 10, '#6a4028'); p.set(11, 12, '#6a4028');
}
// 土の 守り手（石の ゴーレム。南むきは 正面、東むきは よこ。目が 金に 光る）
function paintGolem(p, v, dir) {
  floorBase(p, v);
  p.ellipse(8, 15, 6, 1.2, FL.ln);
  if (dir === 'S') {
    p.rect(3, 4, 10, 10, ST.b); p.rect(3, 4, 10, 1, ST.l); p.vline(3, 4, 13, ST.l); p.vline(12, 4, 13, ST.d);
    p.rect(5, 1, 6, 4, ST.m); p.hline(5, 10, 1, ST.l);
    p.set(6, 3, GOLD.gl); p.set(9, 3, GOLD.gl);
    p.rect(1, 6, 2, 6, ST.m); p.rect(13, 6, 2, 6, ST.d);
    p.rect(4, 14, 3, 1, ST.d); p.rect(9, 14, 3, 1, ST.d);
    p.hline(5, 10, 8, ST.ln); p.set(8, 10, '#5a8a3a'); p.set(6, 11, '#5a8a3a');
  } else {
    p.rect(3, 4, 9, 10, ST.b); p.rect(3, 4, 9, 1, ST.l); p.vline(3, 4, 13, ST.l); p.vline(11, 4, 13, ST.d);
    p.rect(7, 1, 6, 4, ST.m); p.hline(7, 12, 1, ST.l);
    p.set(11, 3, GOLD.gl); p.set(12, 3, GOLD.g);
    p.rect(10, 7, 4, 2, ST.m); p.set(14, 7, ST.l);
    p.rect(4, 14, 3, 1, ST.d); p.rect(8, 14, 3, 1, ST.d);
    p.set(5, 9, '#5a8a3a'); p.set(7, 11, '#5a8a3a');
  }
}
// 守り手の 石板（たてた 石の 板に 金の ゴーレムの しるし）・もとに もどす 石板（青い 回る 矢じるし）
function paintSlab(p, v, undo) {
  floorBase(p, v);
  p.ellipse(8, 14.5, 5, 1.2, FL.ln);
  p.rect(4, 2, 8, 12, ST.m); p.hline(4, 11, 2, ST.l); p.vline(4, 2, 13, ST.l); p.vline(11, 2, 13, ST.d); p.hline(4, 11, 13, ST.d);
  if (!undo) {
    const c = GOLD.g;
    p.rect(7, 4, 2, 2, c); p.rect(6, 6, 4, 4, c); p.set(5, 7, c); p.set(10, 7, c); p.rect(6, 10, 1, 2, c); p.rect(9, 10, 1, 2, c);
    p.set(7, 4, GOLD.gl);
  } else {
    const c = '#7ab8e8';
    for (const [x, y] of [[6, 4], [7, 4], [8, 4], [9, 5], [10, 6], [10, 7], [10, 8], [9, 9], [8, 10], [7, 10], [6, 9], [5, 8]]) p.set(x, y, c);
    p.set(5, 6, c); p.set(4, 7, c); p.set(6, 7, c); p.set(5, 7, '#d8f0ff');
  }
}
// ゆかの あな（ふかい 四角い あな）・あなを うめた ゴーレムの せなか（こけの 生えた 石。歩ける）
function paintPit(p, v) {
  floorBase(p, v);
  p.rect(2, 2, 12, 12, GP.l); p.rect(3, 3, 10, 10, GP.m); p.rect(4, 5, 8, 8, GP.b);
  p.hline(2, 13, 2, FL.d); p.hline(3, 12, 13, FL.l);
}
function paintFill(p, v) {
  floorBase(p, v);
  p.rect(2, 2, 12, 12, ST.b); p.hline(2, 13, 2, ST.l); p.vline(2, 2, 13, ST.l); p.vline(13, 2, 13, ST.d); p.hline(2, 13, 13, ST.d);
  p.hline(4, 11, 7, ST.ln); p.vline(8, 3, 12, ST.ln);
  const r = prand(v * 13 + 7);
  for (let i = 0; i < 6; i++) p.set(3 + Math.floor(r() * 10), 3 + Math.floor(r() * 10), i % 2 ? '#5a8a3a' : '#7aaa4a');
  p.set(5, 4, GOLD.gd); p.set(10, 4, GOLD.gd);
}
// 根の とびら（太い 根が あみの ように からみあった とびら）
function paintEarthDoor(p, v) {
  p.rect(0, 0, 16, 16, RT.d);
  for (let x = 1; x < 16; x += 4) for (let y = 0; y < 16; y++) p.set(x + ((y >> 2) & 1), y, y % 4 === 0 ? RT.hl : RT.m);
  for (let y = 2; y < 16; y += 5) for (let x = 0; x < 16; x++) p.set(x, y + ((x >> 2) & 1), x % 3 ? RT.l : RT.b);
  p.rect(6, 6, 4, 4, '#5a3a1e'); p.set(7, 7, GOLD.g); p.set(8, 8, GOLD.gd);
  p.hline(0, 15, 15, '#2a1a0a');
  void v;
}
// 上り下りの ゆか（こわれて かたむいた・直って 金の ふちが 光る）
function paintLift(p, v, ok) {
  floorBase(p, v);
  if (!ok) {
    p.rect(1, 1, 14, 14, GP.m);
    for (let y = 4; y < 14; y++) p.hline(3, 12 - Math.floor((y - 4) / 3), y, y % 3 ? '#6a4a2a' : '#4e3418');
    p.set(5, 6, GP.b); p.set(8, 9, GP.b); p.set(6, 11, GP.b);
    p.vline(2, 0, 3, '#7a7a7a'); p.vline(13, 0, 1, '#7a7a7a');
  } else {
    p.rect(1, 1, 14, 14, '#8a6a3a'); p.rect(2, 2, 12, 12, '#a88048');
    for (let y = 4; y < 14; y += 3) p.hline(2, 13, y, '#7a5a2a');
    p.hline(1, 14, 1, GOLD.g); p.hline(1, 14, 14, GOLD.gd); p.vline(1, 1, 14, GOLD.g); p.vline(14, 1, 14, GOLD.gd);
    p.set(2, 2, GOLD.gl); p.set(13, 2, GOLD.gl);
  }
}
// 大地の 守り星の 祭だん（石の 台の 上に、土色の 光の くぼみ）
export const ALTAR_FRAMES = 3;
function paintAltar(p, v, f) {
  floorBase(p, v);
  p.rect(1, 5, 14, 10, '#6a4a3a'); p.hline(1, 14, 5, '#9a6a4a'); p.hline(1, 14, 14, '#3a2418');
  p.rect(2, 3, 12, 3, '#8a5a40'); p.hline(2, 13, 3, '#b8805a');
  p.ellipse(8, 4, 3, 1.4, '#3a1a0a');
  const k = f % ALTAR_FRAMES;
  p.ellipse(8, 3.5, 2, 1, k === 1 ? '#ffb070' : '#e8905a');
  p.set(8, 2 - (k === 2 ? 1 : 0), '#fff0c0');
  for (const [x, y] of [[3, 9], [12, 9], [8, 11]]) p.set(x, y, '#d87a4a');
  p.set(4 + k * 3, 0, '#ffd8a0');
}
// 神殿の 入口（根の とびら。くらい 入口を 根が ふちどる。歩ける）
function paintRootGate(p) {
  p.rect(0, 0, 16, 16, '#2a1a0e');
  p.rect(2, 2, 12, 14, '#140c06');
  for (let y = 0; y < 16; y++) { p.set(1, y, y % 3 ? RT.m : RT.l); p.set(14, y, y % 3 ? RT.b : RT.m); }
  p.hline(1, 14, 0, RT.l); p.hline(2, 13, 1, RT.b);
  p.set(4, 6, '#3a2814'); p.set(11, 9, '#3a2814');
  p.hline(3, 12, 15, '#4a3a28');
}

export const EARTH_PAINTERS = {
  [T.ROOT_BRIDGE]: paintRootBridge, [T.ROOT_GAP]: paintRootGap,
  [T.WATER_JAR]: (p, v, f) => paintJar(p, v, f, false), [T.WATER_JAR_ON]: (p, v, f) => paintJar(p, v, f, true),
  [T.GOLEM_S]: (p, v) => paintGolem(p, v, 'S'), [T.GOLEM_E]: (p, v) => paintGolem(p, v, 'E'),
  [T.GOLEM_SLAB]: (p, v) => paintSlab(p, v, false), [T.UNDO_SLAB]: (p, v) => paintSlab(p, v, true),
  [T.EARTH_PIT]: paintPit, [T.GOLEM_FILL]: paintFill, [T.EARTH_DOOR]: paintEarthDoor,
  [T.LIFT_BROKEN]: (p, v) => paintLift(p, v, false), [T.EARTH_LIFT]: (p, v) => paintLift(p, v, true),
  [T.EARTH_ALTAR]: paintAltar, [T.ROOT_GATE]: paintRootGate,
};
export const EARTH_FRAMES = { [T.ROOT_GAP]: GAP_FRAMES, [T.WATER_JAR_ON]: JAR_FRAMES, [T.EARTH_ALTAR]: ALTAR_FRAMES };
export const EARTH_SPEED = { [T.ROOT_GAP]: 700, [T.WATER_JAR_ON]: 420, [T.EARTH_ALTAR]: 380 };
export const EARTH_TILES = Object.keys(EARTH_PAINTERS).map(Number);
// 色を かえない タイル（もとの 色で かいてある。render/themes.js）。かべと ゆかは 洞窟の タイルを 階の 色に
export const EARTH_KEEP_COLOR = EARTH_TILES;

// ───── 2.5D（render/field3d.js）─────
// 根の すきまの 谷は ずっと 下の くらやみ（根の 橋は ゆかと ほぼ おなじ 高さに かかる）。あなは ふかく、こわれた ゆかは しずむ
export const EARTH_LIQUIDS = { [T.ROOT_GAP]: { name: 'root_gap', y: -1.3, speed: 700, frames: GAP_FRAMES } };
export const EARTH_FLOOR_H = {
  [T.ROOT_BRIDGE]: -0.05, [T.EARTH_PIT]: -0.7, [T.GOLEM_FILL]: -0.04, [T.LIFT_BROKEN]: -0.32, [T.EARTH_LIFT]: -0.02, [T.ROOT_GATE]: -0.04,
};
// かべに なる タイル（根の とびら。洞窟の かべと おなじ 高さ。field3d.js の blockSpec）
export function earthBlockSpec(id, v) {
  if (id === T.EARTH_DOOR) return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.EARTH_DOOR, 0, 0] };
  return null;
}
// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）
const jarProp = (on) => [16, 18, (p) => {
  p.ellipse(8, 11, 7, 6.5, '#8a5a3a'); p.ellipse(6.5, 9.5, 5, 4.5, '#a87048');
  p.rect(3, 1, 11, 4, '#7a4a2e'); p.hline(3, 13, 1, '#b88050');
  p.ellipse(8, 2, 4.5, 1.4, on ? WA.b : '#2a1a10');
  if (on) { p.set(6, 2, WA.hl); p.set(10, 2, WA.l); p.set(14, 0, WA.hl); }
  p.set(4, 12, '#6a4028'); p.set(12, 14, '#6a4028');
}];
const golemProp = (side) => [20, 30, (p) => {
  if (!side) {
    p.rect(3, 9, 14, 17, ST.b); p.hline(3, 16, 9, ST.l); p.vline(3, 9, 25, ST.l); p.vline(16, 9, 25, ST.d);
    p.rect(6, 1, 8, 8, ST.m); p.hline(6, 13, 1, ST.l);
    p.set(8, 5, GOLD.gl); p.set(11, 5, GOLD.gl);
    p.rect(0, 11, 3, 10, ST.m); p.rect(17, 11, 3, 10, ST.d);
    p.rect(5, 26, 4, 4, ST.d); p.rect(11, 26, 4, 4, ST.d);
    p.set(9, 16, '#5a8a3a'); p.set(7, 20, '#5a8a3a'); p.hline(6, 13, 14, ST.ln);
  } else {
    p.rect(3, 9, 12, 17, ST.b); p.hline(3, 14, 9, ST.l); p.vline(3, 9, 25, ST.l); p.vline(14, 9, 25, ST.d);
    p.rect(9, 1, 8, 8, ST.m); p.hline(9, 16, 1, ST.l);
    p.set(15, 5, GOLD.gl); p.set(16, 5, GOLD.g);
    p.rect(13, 13, 6, 3, ST.m); p.set(19, 13, ST.l);
    p.rect(4, 26, 4, 4, ST.d); p.rect(10, 26, 4, 4, ST.d);
    p.set(6, 16, '#5a8a3a'); p.set(8, 21, '#5a8a3a');
  }
}];
const slabProp = (undo) => [14, 22, (p) => {
  p.rect(1, 1, 12, 21, ST.m); p.hline(1, 12, 1, ST.l); p.vline(1, 1, 21, ST.l); p.vline(12, 1, 21, ST.d);
  if (!undo) { p.rect(6, 5, 2, 2, GOLD.g); p.rect(5, 7, 4, 6, GOLD.g); p.rect(5, 13, 1, 3, GOLD.g); p.rect(8, 13, 1, 3, GOLD.g); p.set(6, 5, GOLD.gl); } else {
    for (const [x, y] of [[5, 5], [6, 5], [7, 5], [8, 6], [9, 7], [9, 8], [9, 9], [9, 10], [8, 11], [7, 12], [6, 12], [5, 11], [4, 10]]) p.set(x, y, '#7ab8e8');
    p.set(4, 7, '#7ab8e8'); p.set(3, 8, '#7ab8e8'); p.set(5, 8, '#7ab8e8'); p.set(4, 8, '#d8f0ff');
  }
}];
export const EARTH_PROPS = {
  [T.WATER_JAR]: jarProp(false), [T.WATER_JAR_ON]: jarProp(true),
  [T.GOLEM_S]: golemProp(false), [T.GOLEM_E]: golemProp(true),
  [T.GOLEM_SLAB]: slabProp(false), [T.UNDO_SLAB]: slabProp(true),
  [T.EARTH_ALTAR]: [24, 18, (p) => {
    p.rect(1, 7, 22, 11, '#6a4a3a'); p.hline(1, 22, 7, '#9a6a4a'); p.hline(1, 22, 17, '#3a2418');
    p.rect(3, 3, 18, 5, '#8a5a40'); p.hline(3, 20, 3, '#b8805a');
    p.ellipse(12, 4, 4, 1.5, '#3a1a0a'); p.ellipse(12, 3.5, 2.5, 1, '#e8905a'); p.set(12, 1, '#fff0c0'); p.set(5, 0, '#ffd8a0'); p.set(19, 1, '#ffd8a0');
  }],
};

// ───── 神殿の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
const theme = (floor, wall, gem, flame) => ({
  floor: G([0, floor[0]], [0.3, floor[1]], [0.6, floor[2]], [1, '#fff8ec']),
  wall: G([0, wall[0]], [0.3, wall[1]], [0.6, wall[2]], [1, '#f8f0e0']),
  water: G([0, '#06121a'], [0.5, '#2a6a98'], [1, '#e0f4ff']),
  gem: G([0, '#2a1a0a'], [0.5, gem], [1, '#ffffff']),
  flame,
});
export const EARTH_THEMES = {
  // 1〜2階: 土の こげ茶
  earth_1: theme(['#24160c', '#6a4a2a', '#b08a5a'], ['#160c06', '#4a3018', '#8a6a42'], '#e8b060', null),
  // 3〜4階: 根の みどり
  earth_2: theme(['#18200e', '#4a6a2e', '#98b06a'], ['#0e1408', '#2e4418', '#5e7a3a'], '#b8e070', null),
  // 5〜6階: 地下水の 青
  earth_3: theme(['#0e1a24', '#3a5a74', '#88a8c0'], ['#08101a', '#24384e', '#4e6a84'], '#9ad8ff', null),
  // 7〜8階: 大地の 心の あかね色
  earth_4: theme(['#2a0e0a', '#7a3424', '#c87a5a'], ['#180604', '#4e1a12', '#8a3e2a'], '#ff9a60', null),
};
