// 第5章 Step 5「ノクトの思い出の迷宮」「星読みの里」の タイル（16×16 ドット）と 迷宮の 色（テーマ）
// ・思い出の とぎれた ところ（くらい もやに 小さな 星。4コマで ゆっくり 流れる）・影の 道（あい色の 影に 星の つぶ。3コマ）
// ・ゆかに おちた 影・ランプ台（光って いない／光っている〈2コマで ゆれる〉）・思い出の かけら（うかぶ 光の かけら。3コマ）
// ・思い出の 柱（年の 色に 色がえ）・思い出の 出口（光の 門。3コマ）
// ・星読みの 水しょう（大きな 水しょうの 玉。3コマで 光が めぐる）・星見の 遠めがね
// render/tiles.js が まぜる。2.5D は render/field3d.js（MEMORY_LIQUIDS・MEMORY_FLOOR_H）と render/tex3d.js（MEMORY_PROPS）
// テーマ（memory_1 … 5さい〈星祭りの 夜。あたたかい 色〉〜 memory_6 … 今〈くらい あい色〉）は render/themes.js
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=6f0cf3958911';
import { prand, shade } from './pixel.js?v=6f0cf3958911';

// もや（くらい むらさき）・影（あい色）・金の 光・ゆか（色がえ される 灰色）
const VD = { b: '#0c0a1a', m: '#16122a', l: '#221c3c', s: '#5a5090', st: '#c8c0ff' };
const SH = { b: '#2a2250', m: '#342a62', l: '#463a7e', e: '#1a1438', st: '#d8d0ff' };
const GOLD = { g: '#e8c050', gl: '#fff0a0', gd: '#a8842a', f: '#ffd060', fo: '#ff9a30' };
const FL = { b: '#8a8a90', l: '#a4a4aa', d: '#6e6e74', ln: '#5a5a60' };

// 思い出の とぎれた ところ（くらい もやが ゆっくり 流れ、小さな 星が またたく）
export const VOID_FRAMES = 4;
function paintVoid(p, v, f) {
  p.rect(0, 0, 16, 16, VD.b);
  const off = (f % VOID_FRAMES) * 4;
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 4; i++) {
    const cx = (Math.floor(r() * 16) + off) % 16, cy = Math.floor(r() * 16), rr = 2 + Math.floor(r() * 3);
    for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr - 1; dx <= rr + 1; dx++) {
      if ((dx * dx) / 1.6 + dy * dy > rr * rr) continue;
      p.set((cx + dx + 16) % 16, (cy + dy + 16) % 16, dy < 0 ? VD.l : VD.m);
    }
  }
  const r2 = prand(v * 13 + 3);
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r2() * 16), y = Math.floor(r2() * 16);
    p.set(x, y, (i + f) % 4 === 0 ? VD.st : VD.s);
  }
}
// 影の 道（あい色の 影。ふちは こく、まん中に 星の つぶが ながれる）
export const SHADOW_FRAMES = 3;
function paintShadowPath(p, v, f) {
  p.rect(0, 0, 16, 16, SH.m);
  const r = prand(v * 17 + 5);
  for (let i = 0; i < 8; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? SH.b : SH.l);
  p.hline(0, 15, 0, SH.e); p.vline(0, 0, 15, SH.e);
  const k = f % SHADOW_FRAMES;
  for (let i = 0; i < 3; i++) {
    const x = (3 + i * 5 + k * 2) % 16, y = (5 + i * 4 + k) % 16;
    p.set(x, y, SH.st);
    p.set((x + 1) % 16, y, SH.l);
  }
}
// ゆかに おちた 影（ゆかの 石を こく。色がえ される）
function paintShadowFloor(p, v) {
  p.rect(0, 0, 16, 16, '#3e3e44');
  const r = prand(v * 23 + 9);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#34343a' : '#48484e');
  p.hline(0, 15, 0, '#2e2e34');
  p.vline(v & 1 ? 4 : 11, 1, 15, '#38383e');
}
// 思い出の ゆか（色がえ される 石。ランプ台・柱・かけらの 下）
function floorBase(p, v) {
  p.rect(0, 0, 16, 16, FL.b);
  const r = prand(v * 41 + 11);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? FL.d : FL.l);
  p.hline(0, 15, 0, FL.ln);
}
// ランプ台（木の 柱に つるした 小さな ランプ。光ると 金色に ゆれる）
function paintLamp(p, v, f, lit) {
  floorBase(p, v);
  p.ellipse(8, 14, 4, 1.5, FL.d);
  p.rect(7, 4, 2, 11, '#6a4a2a'); p.vline(7, 4, 14, '#8a6a3a');
  p.hline(5, 11, 3, '#6a4a2a');
  // ランプ（ガラスの かご）
  p.rect(9, 4, 4, 5, lit ? GOLD.f : '#5a5a6a');
  p.hline(9, 12, 4, '#3a3a4a'); p.hline(9, 12, 8, '#3a3a4a');
  if (lit) {
    const fl = f % 2 ? GOLD.gl : '#ffe890';
    p.set(10, 6, fl); p.set(11, 6, fl); p.set(10, 5, GOLD.fo); p.set(11, 7, GOLD.fo);
    for (const [x, y] of [[14, 3], [8, 2], [14, 8], [12, 10]]) p.set(x, y, f % 2 ? '#fff4c0' : GOLD.g);
  } else {
    p.set(10, 6, '#7a7a8a'); p.set(11, 6, '#7a7a8a');
  }
}
export const LAMP_FRAMES = 2;
// 思い出の かけら（小さな 台の 上に うかぶ 光の かけら）
export const SHARD_FRAMES = 3;
function paintMemShard(p, v, f) {
  floorBase(p, v);
  p.rect(4, 11, 8, 4, FL.d); p.hline(4, 11, 11, FL.l);
  const y0 = 3 + (f % SHARD_FRAMES === 1 ? -1 : 0);
  p.ellipse(8, y0 + 4, 2.5, 4, '#9ad8ff');
  p.ellipse(8, y0 + 3, 1.5, 2.5, '#d8f0ff');
  p.set(8, y0 + 1, '#ffffff');
  const tw = [[3, 4], [13, 3], [12, 9], [4, 9]];
  const [sx, sy] = tw[f % 4] || tw[0];
  p.set(sx, sy, '#ffffff');
}
// 思い出の 柱（年の 色に 色がえ。星の きざみ）
function paintMemPillar(p, v) {
  floorBase(p, v);
  p.ellipse(8, 14, 5, 1.5, FL.ln);
  p.rect(4, 1, 8, 14, '#b0b0b8');
  p.vline(4, 1, 14, '#d0d0d8'); p.vline(11, 1, 14, '#7a7a82');
  p.hline(3, 12, 1, '#d8d8e0'); p.hline(3, 12, 14, '#6a6a72');
  // 星の きざみ
  for (const [x, y] of [[8, 5], [7, 6], [9, 6], [8, 7], [8, 6]]) p.set(x, y, '#e8e8f0');
  p.set(6, 10, '#8a8a92'); p.set(10, 11, '#8a8a92');
}
// 思い出の 出口（白い 光の 門）
export const EXIT_FRAMES = 3;
function paintMemExit(p, v, f) {
  p.rect(0, 0, 16, 16, '#2a2440');
  p.ellipse(8, 9, 6.5, 7.5, '#8a80c8');
  p.ellipse(8, 9, 5, 6, '#c8c0f0');
  p.ellipse(8, 9, 3, 4.5, '#f4f0ff');
  const k = f % EXIT_FRAMES;
  for (let i = 0; i < 4; i++) p.set(3 + ((i * 4 + k * 3) % 11), 2 + ((i * 5 + k * 2) % 13), '#ffffff');
}
// 星読みの 水しょう（台の 上の 大きな 水しょうの 玉。光が めぐる）
export const CRYSTAL_FRAMES = 3;
function paintStarCrystal(p, v, f) {
  p.rect(0, 0, 16, 16, '#b88a5a');
  p.hline(0, 15, 0, '#8a6a42');
  p.rect(3, 11, 10, 4, '#5a4a7a'); p.hline(3, 12, 11, '#8a7ab0'); p.hline(4, 11, 14, '#3a2e52');
  p.ellipse(8, 7, 5.5, 5.5, '#4a6ab8');
  p.ellipse(8, 6.5, 4.5, 4.5, '#7aa8e8');
  p.ellipse(7, 5.5, 2.5, 2.5, '#c8e4ff');
  p.set(6, 4, '#ffffff');
  const k = f % CRYSTAL_FRAMES;
  const ring = [[11, 7], [9, 10], [5, 9], [4, 6], [7, 3], [10, 4]];
  for (let i = 0; i < 2; i++) { const [x, y] = ring[(k * 2 + i * 3) % ring.length]; p.set(x, y, '#fff8d0'); }
}
// 星見の 遠めがね（三つ足に 金の つつ。木の ゆかの 上）
function paintStarScope(p, v) {
  p.rect(0, 0, 16, 16, '#b88a5a');
  p.hline(0, 15, 0, '#8a6a42');
  for (const [x0, x1] of [[8, 4], [8, 12], [8, 8]]) {
    for (let y = 9; y <= 15; y++) p.set(Math.round(x0 + (x1 - x0) * (y - 9) / 6), y, '#5a3a22');
  }
  for (let i = 0; i < 9; i++) { p.set(3 + i, 9 - Math.floor(i * 0.7), GOLD.gd); p.set(3 + i, 8 - Math.floor(i * 0.7), GOLD.g); }
  p.set(12, 2, GOLD.gl); p.set(11, 2, GOLD.gl); p.set(3, 9, '#2a2a3a');
}

export const MEMORY_PAINTERS = {
  [T.MEM_VOID]: paintVoid, [T.SHADOW_PATH]: paintShadowPath, [T.SHADOW_FLOOR]: paintShadowFloor,
  [T.LAMP_STAND]: (p, v, f) => paintLamp(p, v, f, false), [T.LAMP_LIT]: (p, v, f) => paintLamp(p, v, f, true),
  [T.MEM_SHARD]: paintMemShard, [T.MEM_PILLAR]: paintMemPillar, [T.MEM_EXIT]: paintMemExit,
  [T.STAR_CRYSTAL]: paintStarCrystal, [T.STAR_SCOPE]: paintStarScope,
};
export const MEMORY_FRAMES = {
  [T.MEM_VOID]: VOID_FRAMES, [T.SHADOW_PATH]: SHADOW_FRAMES, [T.LAMP_LIT]: LAMP_FRAMES, [T.MEM_SHARD]: SHARD_FRAMES, [T.MEM_EXIT]: EXIT_FRAMES, [T.STAR_CRYSTAL]: CRYSTAL_FRAMES,
};
export const MEMORY_SPEED = { [T.MEM_VOID]: 800, [T.SHADOW_PATH]: 260, [T.LAMP_LIT]: 220, [T.MEM_SHARD]: 420, [T.MEM_EXIT]: 300, [T.STAR_CRYSTAL]: 500 };
export const MEMORY_TILES = Object.keys(MEMORY_PAINTERS).map(Number);
// 色を かえない タイル（もとの 色で かいてある。render/themes.js）。柱・ランプ台・かけら・ゆかの 影は 年の 色に 色がえ
export const MEMORY_KEEP_COLOR = [T.MEM_VOID, T.SHADOW_PATH, T.MEM_EXIT, T.STAR_CRYSTAL, T.STAR_SCOPE];

// ───── 2.5D（render/field3d.js）─────
// 思い出の とぎれた ところは ずっと 下の くらい もや（影の 道は ゆかと おなじ 高さに うかぶ）
export const MEMORY_LIQUIDS = { [T.MEM_VOID]: { name: 'mem_void', y: -1.3, speed: 800, frames: VOID_FRAMES } };
export const MEMORY_FLOOR_H = { [T.SHADOW_PATH]: -0.02, [T.MEM_EXIT]: -0.02 };
// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）
export const MEMORY_PROPS = {
  [T.LAMP_STAND]: [12, 26, (p) => {
    p.rect(5, 6, 2, 20, '#6a4a2a'); p.vline(5, 6, 25, '#8a6a3a'); p.hline(2, 10, 5, '#6a4a2a');
    p.rect(7, 6, 5, 6, '#5a5a6a'); p.hline(7, 11, 6, '#3a3a4a'); p.hline(7, 11, 11, '#3a3a4a'); p.set(9, 8, '#7a7a8a');
  }],
  [T.LAMP_LIT]: [14, 26, (p) => {
    p.rect(5, 6, 2, 20, '#6a4a2a'); p.vline(5, 6, 25, '#8a6a3a'); p.hline(2, 10, 5, '#6a4a2a');
    p.rect(7, 6, 5, 6, GOLD.f); p.hline(7, 11, 6, '#3a3a4a'); p.hline(7, 11, 11, '#3a3a4a');
    p.set(9, 8, GOLD.gl); p.set(9, 9, GOLD.fo); p.set(12, 3, '#fff4c0'); p.set(1, 9, '#fff4c0');
  }],
  [T.MEM_SHARD]: [12, 20, (p) => {
    p.rect(2, 15, 8, 5, FL.d); p.hline(2, 9, 15, FL.l);
    p.ellipse(6, 7, 3, 5.5, '#9ad8ff'); p.ellipse(6, 6, 2, 3.5, '#d8f0ff'); p.set(6, 3, '#ffffff'); p.set(1, 2, '#ffffff'); p.set(11, 5, '#ffffff');
  }],
  [T.MEM_PILLAR]: [14, 34, (p) => {
    p.rect(2, 1, 10, 33, '#b0b0b8'); p.vline(2, 1, 33, '#d0d0d8'); p.vline(11, 1, 33, '#7a7a82');
    p.hline(1, 12, 0, '#d8d8e0'); p.hline(1, 12, 33, '#6a6a72');
    for (const [x, y] of [[7, 8], [6, 9], [8, 9], [7, 10], [7, 9]]) p.set(x, y, '#e8e8f0');
  }],
  [T.STAR_CRYSTAL]: [16, 20, (p) => {
    p.rect(3, 14, 10, 6, '#5a4a7a'); p.hline(3, 12, 14, '#8a7ab0');
    p.ellipse(8, 7, 6.5, 6.5, '#4a6ab8'); p.ellipse(8, 6.5, 5.5, 5.5, '#7aa8e8'); p.ellipse(6.5, 5, 3, 3, '#c8e4ff'); p.set(5, 3, '#ffffff');
  }],
  [T.STAR_SCOPE]: [16, 18, (p) => {
    for (const [x0, x1] of [[8, 3], [8, 13], [8, 8]]) for (let y = 9; y <= 17; y++) p.set(Math.round(x0 + (x1 - x0) * (y - 9) / 8), y, '#5a3a22');
    for (let i = 0; i < 11; i++) { p.set(2 + i, 9 - Math.floor(i * 0.7), GOLD.gd); p.set(2 + i, 8 - Math.floor(i * 0.7), GOLD.g); }
    p.set(12, 1, GOLD.gl);
  }],
};

// ───── 迷宮の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
const theme = (floor, wall, gem) => ({
  floor: G([0, floor[0]], [0.3, floor[1]], [0.6, floor[2]], [1, '#fffcf4']),
  wall: G([0, wall[0]], [0.3, wall[1]], [0.6, wall[2]], [1, '#f4f0ff']),
  water: G([0, '#0a0a2a'], [0.5, '#5a5aa8'], [1, '#ffffff']),
  gem: G([0, '#1a2a4a'], [0.5, gem], [1, '#ffffff']),
  flame: null,
});
export const MEMORY_THEMES = {
  // 5さい: 星祭りの 夜（ちょうちんの あたたかい 色）
  memory_1: theme(['#3a2418', '#8a5a3a', '#d0a070'], ['#24140e', '#5a3a28', '#9a7050'], '#ffd890'),
  // 7さい: ひとりで 見上げた 星（夜の 丘の あい色）
  memory_2: theme(['#1a2238', '#4a5a88', '#90a0d0'], ['#10162a', '#2e3a62', '#5a6a9a'], '#c8d8ff'),
  // 9さい: 雪の 夜（白っぽい 灰青）
  memory_3: theme(['#2a3240', '#7a8aa0', '#d0dcec'], ['#1a2030', '#4a5668', '#8a98ac'], '#e8f4ff'),
  // 11さい: くらい 森と ひくい 声（くすんだ むらさき）
  memory_4: theme(['#221a2a', '#5a4a68', '#9a88a8'], ['#140e1a', '#3a2a48', '#6a5878'], '#b8a0e0'),
  // 13さい: 雲の上の 町（空色）
  memory_5: theme(['#2a3a50', '#6a90b8', '#c0dcf4'], ['#1a2638', '#3e5a7e', '#7a9cc0'], '#d8f0ff'),
  // 今: 星祭りの 夜、ふたたび（くらい あい色と 金）
  memory_6: theme(['#14121e', '#3e3a58', '#7e78a0'], ['#0a0812', '#24203a', '#4a4468'], '#ffe8a0'),
};
