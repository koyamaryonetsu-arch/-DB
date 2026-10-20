// 第5章 Step 9「影の城の てっぺん ― 星のない広間」の タイル（16×16 ドット）と 広間の 色（テーマ ctop）
// ・星のない 広間の ゆか（STARLESS_FLOOR 189）… 黒い 石だたみ。星の もようの あとが、光を うしなって 灰色に のこっている
// ・星のない 祭だん（STARLESS_ALTAR 229）… 黒い 石の 台。からっぽの 星の くぼみから、むらさきの もやが ゆれる（3コマ）
// ソリトゥスを たおすと、ゆかは 星の塔の 星空の ゆか（SKY_FLOOR）・祭だんは 守り星の かけらの 台（SHARD_ALTAR）に かわる（maps/castle-top.js）
// render/tiles.js が まぜる。2.5D は render/tex3d.js（TOP_PROPS）。テーマは render/themes.js（TOP_THEMES）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=2d8d7ef5c868';
import { prand } from './pixel.js?v=2d8d7ef5c868';

const FL = { b: '#1c1828', l: '#26203a', d: '#120f1c', ln: '#0c0a14', ghost: '#3a3450', ghost2: '#2e2a40' };
const AL = { d: '#0e0b16', b: '#221c30', m: '#2e2640', l: '#3e3456', hl: '#4e4468' };
const MIST = ['#5a3a7a', '#7a4a9a', '#4a2e6a'];

// 星のない 広間の ゆか（4まいの 石だたみ。星の もようの あとが 灰色の 点と 線で のこる）
function paintTopFloor(p, v) {
  p.rect(0, 0, 16, 16, FL.b);
  p.hline(0, 15, 7, FL.ln); p.vline(7 + (v & 1), 0, 6, FL.ln); p.vline(3 + ((v >> 1) & 3), 8, 15, FL.ln);
  p.hline(0, 15, 15, FL.d);
  const r = prand(v * 53 + 7);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? FL.l : FL.d);
  // 光を うしなった 星の あと（小さな 十字）
  if (v % 3 === 0) {
    const x = 3 + Math.floor(r() * 10), y = 2 + Math.floor(r() * 11);
    p.set(x, y, FL.ghost); p.set(x - 1, y, FL.ghost2); p.set(x + 1, y, FL.ghost2); p.set(x, y - 1, FL.ghost2); p.set(x, y + 1, FL.ghost2);
  }
}
// 星のない 祭だん（黒い 石の 台。からっぽの 星の くぼみから、もやが ゆらゆら）
export const TOP_ALTAR_FRAMES = 3;
function paintTopAltar(p, v, f) {
  paintTopFloor(p, v);
  p.rect(1, 6, 14, 9, AL.b); p.hline(1, 14, 6, AL.l); p.hline(1, 14, 14, AL.d); p.vline(1, 6, 14, AL.m); p.vline(14, 6, 14, AL.d);
  p.rect(2, 3, 12, 4, AL.m); p.hline(2, 13, 3, AL.hl); p.hline(2, 13, 6, AL.d);
  // 星の 形の くぼみ（からっぽ）
  for (const [x, y] of [[8, 3], [7, 4], [8, 4], [9, 4], [6, 5], [8, 5], [10, 5]]) p.set(x, y, AL.d);
  const k = f % TOP_ALTAR_FRAMES;
  // もや（コマごとに 少し 上へ）
  for (const [x, y] of [[7, 2], [9, 1], [8, 0], [6, 1], [10, 2]]) p.set(x + (k === 1 ? 1 : 0) - (k === 2 ? 1 : 0), Math.max(0, y - (k === 2 ? 1 : 0)), MIST[(x + y + k) % 3]);
  for (const [x, y] of [[3, 9], [12, 9], [5, 12], [10, 12]]) p.set(x, y, AL.l);
}

export const TOP_PAINTERS = { [T.STARLESS_FLOOR]: paintTopFloor, [T.STARLESS_ALTAR]: paintTopAltar };
export const TOP_FRAMES = { [T.STARLESS_ALTAR]: TOP_ALTAR_FRAMES };
export const TOP_SPEED = { [T.STARLESS_ALTAR]: 420 };
export const TOP_TILES = Object.keys(TOP_PAINTERS).map(Number);
// 色を かえない タイル（もとの 色で かいてある。render/themes.js）。かべ・柱・かいだんは 広間の 色に
export const TOP_KEEP_COLOR = TOP_TILES;

// ───── 2.5D（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）─────
export const TOP_PROPS = {
  [T.STARLESS_ALTAR]: [24, 20, (p) => {
    p.rect(1, 8, 22, 12, AL.b); p.hline(1, 22, 8, AL.l); p.hline(1, 22, 19, AL.d); p.vline(1, 8, 19, AL.m); p.vline(22, 8, 19, AL.d);
    p.rect(3, 4, 18, 5, AL.m); p.hline(3, 20, 4, AL.hl);
    for (const [x, y] of [[12, 4], [11, 5], [12, 5], [13, 5], [10, 6], [12, 6], [14, 6]]) p.set(x, y, AL.d);
    for (const [x, y] of [[11, 2], [13, 1], [12, 0], [10, 1], [14, 2]]) p.set(x, y, MIST[(x + y) % 3]);
  }],
};

// ───── 広間の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const TOP_THEMES = {
  // 星のない 夜の 色（黒に ちかい むらさき。かべの 上の ふちだけ 少し 明るい）
  ctop: {
    floor: G([0, '#0a0812'], [0.3, '#2a2440'], [0.6, '#5a5078'], [1, '#e8e0ff']),
    wall: G([0, '#06040c'], [0.3, '#1e1830'], [0.6, '#3e3458'], [1, '#d8d0f0']),
    water: G([0, '#06040c'], [0.5, '#2a2450'], [1, '#d0d8ff']),
    gem: G([0, '#140c20'], [0.5, '#7a4a9a'], [1, '#ffffff']),
    flame: null,
  },
};
