// 第5章 Step 8「影の城」の タイル（16×16 ドット）と 城の 色（テーマ）
// ・風車（3階。4まいの 羽が 4コマで 回る）・炎の 柱（ふき上がる 炎。3コマ）・炎の 柱の ふき出し口（鉄の こうしの 下に 赤い おき火）
// A8 が 使って よい タイルの あきは 97・187・188 だけ。ほかは 今の タイルを 城の 色で（render/themes.js の castle_wind・castle_fire・castle_water）。
// 水の階の 流れる ゆか（ピラミッドの 流れる 砂の タイル）は 水の 色に（THEME_PARTS）
// render/tiles.js が まぜる。2.5D は render/field3d.js（CASTLE_FLOOR_H）と render/tex3d.js（CASTLE_PROPS）
// (p, v, f) … Painter / ちがい / アニメの コマ
import { T } from '../../shared/tiles.js?v=847e4bcd6ab2';
import { prand } from './pixel.js?v=847e4bcd6ab2';

// 黒い 城の 石・木の 羽・炎・鉄
const ST = { d: '#2e2a3a', b: '#4a4458', m: '#625a74', l: '#7e7690', ln: '#3a3448' };
const WD = { d: '#5a3e24', b: '#8a6238', l: '#b88a52', hl: '#e0b878', cloth: '#d8d0e0', clothD: '#a8a0b8' };
const FI = { d: '#8a1a0a', r: '#d83a14', o: '#ff7a1a', y: '#ffc040', w: '#fff4c0' };
const IR = { d: '#1a1418', b: '#2e262c', l: '#4a3e44', ember: '#c8401a', emberL: '#ff8a3a' };

function floorBase(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 37 + 11);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.d : ST.m);
  p.hline(0, 15, 0, ST.ln);
  p.vline(0, 0, 15, ST.ln);
}

// 風車（石の 台に 木の じく。布を はった 4まいの 羽が 回る）
export const MILL_FRAMES = 4;
function paintWindmill(p, v, f) {
  floorBase(p, v);
  p.ellipse(8, 14.5, 5, 1.2, ST.ln);
  p.rect(6, 9, 4, 6, ST.m); p.vline(6, 9, 14, ST.l); p.vline(9, 9, 14, ST.d); p.hline(6, 9, 9, ST.l);
  const cx = 8, cy = 6;
  // 羽（f で 45どずつ 回る。0・2 … 十字 / 1・3 … ななめ）
  const arms = f % 2 === 0 ? [[0, -1], [1, 0], [0, 1], [-1, 0]] : [[1, -1], [1, 1], [-1, 1], [-1, -1]];
  arms.forEach(([dx, dy], i) => {
    for (let k = 1; k <= 5; k++) {
      const x = cx + dx * k, y = cy + dy * k;
      if (x < 0 || y < 0 || x > 15 || y > 15) continue;
      p.set(x, y, WD.b);
      // 布（羽の かたがわ）
      const sx = x + (dy === 0 ? 0 : (i % 2 ? -1 : 1)) * (dx === 0 ? 1 : 0), sy = y + (dx === 0 ? 0 : (i % 2 ? 1 : -1)) * (dy === 0 ? 1 : 0);
      if (k > 1 && sx >= 0 && sy >= 0 && sx < 16 && sy < 16) p.set(sx, sy, (k + f) % 2 ? WD.cloth : WD.clothD);
    }
  });
  p.rect(cx - 1, cy - 1, 2, 2, WD.d); p.set(cx - 1, cy - 1, WD.hl);
}
// 炎の 柱（ふき出し口から 赤い 炎が ふき上がる。3コマで ゆれる）
export const PILLAR_FRAMES = 3;
function paintFirePillar(p, v, f) {
  paintVent(p, v, 0);
  const k = f % PILLAR_FRAMES;
  const sway = [0, 1, -1][k];
  for (let y = 0; y < 15; y++) {
    const half = Math.max(1, Math.round(5.5 - Math.abs(y - 10) * 0.42 - (y < 6 ? (6 - y) * 0.35 : 0)));
    const x0 = 8 - half + (y < 8 ? sway : 0);
    p.hline(Math.max(0, x0), Math.min(15, x0 + half * 2 - 1), y, y > 11 ? FI.d : FI.r);
    if (half > 2) p.hline(Math.max(0, x0 + 1), Math.min(15, x0 + half * 2 - 2), y, y > 12 ? FI.r : FI.o);
    if (half > 3 && y > 4) p.hline(x0 + 2, x0 + half * 2 - 3, y, y > 9 ? FI.y : FI.o);
  }
  p.vline(8 + sway, 3, 11, FI.y);
  p.set(7, 9 + k % 2, FI.w); p.set(8 + sway, 6, FI.w);
  const r = prand(v * 13 + k * 7);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 4), FI.y);
}
// 炎の 柱の ふき出し口（鉄の こうし。すきまから おき火が 見える。歩ける）
function paintVent(p, v, f) {
  floorBase(p, v);
  p.rect(2, 2, 12, 12, IR.d);
  p.rect(3, 3, 10, 10, IR.ember);
  for (let x = 3; x < 13; x += 3) p.vline(x, 2, 13, IR.b);
  for (let y = 3; y < 13; y += 3) p.hline(2, 13, y, IR.b);
  p.hline(2, 13, 2, IR.l); p.vline(2, 2, 13, IR.l); p.hline(2, 13, 13, IR.d);
  const r = prand(v * 19 + 3 + f);
  for (let i = 0; i < 3; i++) p.set(4 + Math.floor(r() * 3) * 3, 4 + Math.floor(r() * 3) * 3, IR.emberL);
}

export const CASTLE_PAINTERS = {
  [T.WINDMILL]: paintWindmill, [T.FIRE_PILLAR]: paintFirePillar, [T.FIRE_VENT]: paintVent,
};
export const CASTLE_FRAMES = { [T.WINDMILL]: MILL_FRAMES, [T.FIRE_PILLAR]: PILLAR_FRAMES };
export const CASTLE_SPEED = { [T.WINDMILL]: 220, [T.FIRE_PILLAR]: 140 };
export const CASTLE_TILES = Object.keys(CASTLE_PAINTERS).map(Number);
// 色を かえない タイル（もとの 色で かいてある。render/themes.js）。かべと ゆかは 洞窟の タイルを 階の 色に
export const CASTLE_KEEP_COLOR = CASTLE_TILES;
// テーマごとに 色の かえかたを かえる タイル（水の階の 流れる ゆか … ピラミッドの 流れる 砂の 絵を 水の 色に）
export const THEME_PARTS = {
  castle_water: { [T.FLOW_N]: 'water_all', [T.FLOW_E]: 'water_all', [T.FLOW_S]: 'water_all', [T.FLOW_W]: 'water_all' },
};

// ───── 2.5D（render/field3d.js）─────
export const CASTLE_FLOOR_H = { [T.FIRE_VENT]: -0.03 };
// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）
export const CASTLE_PROPS = {
  [T.WINDMILL]: [24, 34, (p) => {
    p.rect(9, 16, 6, 18, ST.m); p.vline(9, 16, 33, ST.l); p.vline(14, 16, 33, ST.d); p.hline(8, 15, 33, ST.d);
    const cx = 12, cy = 11;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      for (let k = 1; k <= 10; k++) {
        const x = cx + dx * k, y = cy + dy * k;
        p.set(x, y, WD.b);
        if (k > 2) p.set(x + (dy !== 0 ? 1 : 0), y + (dx !== 0 ? -1 : 0), WD.cloth);
        if (k > 2) p.set(x + (dy !== 0 ? 2 : 0), y + (dx !== 0 ? -2 : 0), WD.clothD);
      }
    }
    p.rect(cx - 1, cy - 1, 3, 3, WD.d); p.set(cx - 1, cy - 1, WD.hl);
  }],
  [T.FIRE_PILLAR]: [16, 32, (p) => {
    for (let y = 0; y < 32; y++) {
      const half = Math.max(1, Math.round(6 - Math.abs(y - 24) * 0.25 - (y < 14 ? (14 - y) * 0.3 : 0)));
      const x0 = 8 - half;
      p.hline(Math.max(0, x0), Math.min(15, x0 + half * 2 - 1), y, y > 27 ? FI.d : FI.r);
      if (half > 2) p.hline(x0 + 1, x0 + half * 2 - 2, y, FI.o);
      if (half > 3 && y > 10) p.hline(x0 + 2, x0 + half * 2 - 3, y, y > 20 ? FI.y : FI.o);
    }
    p.vline(8, 6, 26, FI.y); p.set(8, 18, FI.w); p.set(7, 24, FI.w);
  }],
};

// ───── 城の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
const theme = (floor, wall, water, gem) => ({
  floor: G([0, floor[0]], [0.3, floor[1]], [0.6, floor[2]], [1, '#f4f0ff']),
  wall: G([0, wall[0]], [0.3, wall[1]], [0.6, wall[2]], [1, '#ece4f8']),
  water: G([0, water[0]], [0.5, water[1]], [1, water[2]]),
  gem: G([0, '#140a1e'], [0.5, gem], [1, '#ffffff']),
  flame: null,
});
export const CASTLE_THEMES = {
  // 1〜4階 風の階: むらさきがかった 灰色の 石
  castle_wind: theme(['#16121e', '#4a4460', '#9a94b4'], ['#0c0a14', '#2e2a42', '#6a6488'], ['#0a1220', '#3a6a98', '#e0f0ff'], '#b8a8ff'),
  // 5〜8階 炎の階: 黒い 石に 赤い 光
  castle_fire: theme(['#1c0a0a', '#5a2a24', '#a8645a'], ['#100606', '#3a1612', '#784038'], ['#1a0604', '#a83a14', '#ffd8a0'], '#ff8a4a'),
  // 9〜12階 水の階: 深い あい色と 水色
  castle_water: theme(['#0a121e', '#2a4664', '#7aa0c4'], ['#060a14', '#1a2c48', '#486488'], ['#04101e', '#2a7ab8', '#e0f8ff'], '#7ae0ff'),
};
