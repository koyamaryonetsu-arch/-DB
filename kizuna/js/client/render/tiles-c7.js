// 第7章 Step 1・2「みどりの水の神殿」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-ch6.js が まぜる
// ・流れる 水路（C7_CUR_N/E/S/W 317〜320）… あさい 水に 白い すじが 流れの 向きへ 動く（3コマ）
// ・はすの 葉（321）… 水に うかぶ 大きな 葉（ときどき 小さな 花）。水が ゆれる（2コマ）
// ・水路に たまった 砂（322）… 今の かれた 水路の 砂の 山 / 水の ふき上げ口（323）… 石の ゆかに まるい あな
// ・ふき上げる 水（324）… 白い 水の 柱（3コマ）/ 番人の 石像（325）… 石の 箱を かかえた 騎士の 石像
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=a5c15ff5e061';
import { prand } from './pixel.js?v=a5c15ff5e061';

const WA = { d: '#1e5a6a', b: '#2e7e8e', l: '#5ab0b8', w: '#d8f4f0' }; // みどりがかった 水
const ST = { d: '#5a6458', b: '#8a9486', l: '#b4bcae', hl: '#dce2d4', ln: '#454c42' }; // みどりの 石
const LF = { d: '#2e6a2e', b: '#4a9a42', l: '#7ac862', v: '#2a5226' }; // はすの 葉
const SA = { d: '#9a7a48', b: '#c8a868', l: '#e4cc94' }; // 砂

function waterBase(p, v, f) {
  p.rect(0, 0, 16, 16, WA.b);
  const r = prand(v * 23 + 5);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), WA.d);
  for (let i = 0; i < 3; i++) {
    const x = (Math.floor(r() * 12) + f * 2) % 14, y = Math.floor(r() * 14) + 1;
    p.hline(x, x + 2, y, WA.l);
  }
}
// 流れる 水路（dx, dy … 流れの 向き）。白い すじが コマごとに 流れる
export const CUR_FRAMES = 3;
function paintCurrent(p, v, f, dx, dy) {
  // あさくて 明るい 水（ふつうの 水より 明るい 色）に、流れの 向きの 白い 山形（コマごとに 進む）
  p.rect(0, 0, 16, 16, '#4ab0b8');
  const r = prand(v * 13 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), WA.b);
  const k = (f % CUR_FRAMES) * 5;
  const put = (along, across, c) => {
    const a = (((along % 16) + 16) % 16);
    const q = dx > 0 || dy > 0 ? a : 15 - a;
    const [x, y] = dx ? [q, across] : [across, q];
    p.set(x, y, c);
  };
  for (const base of [k, k + 8]) {
    for (let i = -3; i <= 3; i++) {
      put(base - Math.abs(i), 8 + i, WA.w);
      put(base - Math.abs(i) - 1, 8 + i, WA.l);
    }
  }
  // 両はしの 波の すじ
  for (let t = 0; t < 16; t += 3) { put(t + k, 1, WA.l); put(t + k + 1, 14, WA.l); }
}
// はすの 葉
export const LOTUS_FRAMES = 2;
function paintLotus(p, v, f) {
  waterBase(p, v, f);
  p.ellipse(8, 8.5, 6.5, 5.5, LF.d);
  p.ellipse(7.5, 8, 6, 5, LF.b);
  p.ellipse(6, 6.5, 3, 2, LF.l);
  // 葉の きれめ と すじ
  p.set(8, 3, WA.b); p.set(8, 4, WA.b); p.set(8, 5, LF.v);
  for (let i = 1; i < 5; i++) { p.set(8 + i, 8 + Math.round(i * 0.3), LF.v); p.set(8 - i, 8 + Math.round(i * 0.3), LF.v); }
  if (prand(v * 7 + 1)() < 0.35) { p.set(11, 10, '#f0a0c0'); p.set(12, 10, '#f8c8d8'); p.set(11, 11, '#f8c8d8'); p.set(12, 11, '#ffffff'); }
}
// 水路に たまった 砂の 山
function paintSand(p, v) {
  p.rect(0, 0, 16, 16, '#9a8158');
  p.ellipse(8, 9, 7.5, 6.5, SA.d);
  p.ellipse(7.5, 8.5, 6.5, 5.5, SA.b);
  p.ellipse(6, 6.5, 3.5, 2.5, SA.l);
  const r = prand(v * 31 + 9);
  for (let i = 0; i < 6; i++) p.set(2 + Math.floor(r() * 12), 3 + Math.floor(r() * 11), i % 2 ? SA.d : SA.l);
}
// 水の ふき上げ口（石の ゆかに まるい あな。水が 出ていない 間は 歩ける）
function stoneFloor(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 41 + 5);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.l : ST.d);
  p.hline(0, 15, 0, ST.ln); p.vline(0, 0, 15, ST.ln);
}
function paintSpoutFloor(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 5, 4, ST.ln);
  p.ellipse(8, 8, 4, 3, '#24363a');
  for (const x of [5, 8, 11]) p.vline(x, 6, 10, ST.d);
  p.set(7, 7, WA.l); p.set(9, 9, WA.l);
}
// ふき上げる 水の 柱（2D: 上から 見た 白い しぶき）
export const SPOUT_FRAMES = 3;
function paintSpout(p, v, f) {
  stoneFloor(p, v);
  const k = f % SPOUT_FRAMES;
  p.ellipse(8, 8, 6.5, 6, WA.l);
  p.ellipse(8, 8, 5, 4.5, '#bfeaf0');
  p.ellipse(8, 8, 2.5 + k * 0.5, 2.5, WA.w);
  const r = prand(v * 3 + k);
  for (let i = 0; i < 6; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), WA.w);
}
// 番人の 石像（2D: 上から 見た すがた。かぶとと 石の 箱）
function paintGuard(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 9, 6, 6, ST.ln);
  p.ellipse(8, 8.5, 5.5, 5.5, ST.b);
  p.ellipse(8, 6, 3, 2.5, ST.l);
  p.rect(5, 9, 6, 4, ST.d); p.hline(5, 10, 9, ST.hl); p.hline(5, 10, 12, ST.ln);
  p.set(8, 4, ST.hl);
}

export const C7_PAINTERS = {
  [T.C7_CUR_N]: (p, v, f) => paintCurrent(p, v, f, 0, -1),
  [T.C7_CUR_E]: (p, v, f) => paintCurrent(p, v, f, 1, 0),
  [T.C7_CUR_S]: (p, v, f) => paintCurrent(p, v, f, 0, 1),
  [T.C7_CUR_W]: (p, v, f) => paintCurrent(p, v, f, -1, 0),
  [T.C7_LOTUS]: (p, v, f) => paintLotus(p, v, f),
  [T.C7_SAND]: (p, v) => paintSand(p, v),
  [T.C7_SPOUT_FLOOR]: (p, v) => paintSpoutFloor(p, v),
  [T.C7_SPOUT]: (p, v, f) => paintSpout(p, v, f),
  [T.C7_GUARD]: (p, v) => paintGuard(p, v),
};
export const C7_FRAMES = {
  [T.C7_CUR_N]: CUR_FRAMES, [T.C7_CUR_E]: CUR_FRAMES, [T.C7_CUR_S]: CUR_FRAMES, [T.C7_CUR_W]: CUR_FRAMES, [T.C7_LOTUS]: LOTUS_FRAMES, [T.C7_SPOUT]: SPOUT_FRAMES,
};
export const C7_SPEED = { [T.C7_CUR_N]: 160, [T.C7_CUR_E]: 160, [T.C7_CUR_S]: 160, [T.C7_CUR_W]: 160, [T.C7_LOTUS]: 600, [T.C7_SPOUT]: 140 };

// ───── 2.5D ─────
// 流れる 水路・はすの 葉は 少し ひくい。砂の 山は ひくい かたまり
export const C7_FLOOR_H = { [T.C7_CUR_N]: -0.2, [T.C7_CUR_E]: -0.2, [T.C7_CUR_S]: -0.2, [T.C7_CUR_W]: -0.2, [T.C7_LOTUS]: -0.16, [T.C7_SPOUT_FLOOR]: -0.04 };
export function c7BlockSpec(id, v) {
  if (id === T.C7_SAND) return { h: 0.55, top: ['t', T.C7_SAND, v, 0], side: ['t', T.C7_SAND, v, 0], south: ['t', T.C7_SAND, v, 0] };
  return null;
}
// たてた もの（[はば, 高さ, かく 関数]）: ふき上げる 水の 柱・番人の 石像
export const C7_PROPS = {
  [T.C7_SPOUT]: [14, 26, (p) => {
    for (let y = 2; y < 26; y++) {
      const w = 3 + Math.round(Math.sin(y * 0.7) * 1.2) + (y > 20 ? 2 : 0);
      p.hline(7 - w, 6 + w, y, y % 3 ? '#bfeaf0' : WA.w);
      p.set(7 - w, y, WA.l); p.set(6 + w, y, WA.l);
    }
    p.ellipse(7, 2, 4, 2, WA.w);
    for (const [x, y] of [[1, 4], [12, 7], [2, 12], [11, 15]]) p.set(x, y, WA.w);
  }],
  [T.C7_GUARD]: [16, 28, (p) => {
    // 台座
    p.rect(1, 22, 14, 6, ST.d); p.hline(1, 14, 22, ST.hl); p.hline(1, 14, 27, ST.ln);
    // 足・体
    p.rect(4, 16, 3, 6, ST.b); p.rect(9, 16, 3, 6, ST.b);
    p.rect(3, 7, 10, 10, ST.b); p.vline(3, 7, 16, ST.l); p.vline(12, 7, 16, ST.ln);
    // かぶと
    p.rect(5, 1, 6, 6, ST.l); p.hline(5, 10, 1, ST.hl); p.hline(6, 9, 4, ST.ln);
    // かかえた 石の 箱
    p.rect(4, 11, 8, 5, ST.d); p.hline(4, 11, 11, ST.hl); p.hline(4, 11, 15, ST.ln); p.vline(8, 12, 14, ST.ln);
  }],
};
// たてた ものでも 色を かえない（水の 柱の 白）
export const C7_PROPS_KEEP = new Set([T.C7_SPOUT]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C7_THEMES = {
  // 千年前の みどりの水の神殿: 白っぽい みどりの 石と、すきとおった 青みどりの 水
  c7_temple: {
    floor: G([0, '#14201a'], [0.3, '#5e7a68'], [0.6, '#b4ccb8'], [1, '#f4fff6']),
    wall: G([0, '#0c1610'], [0.3, '#3e5a48'], [0.6, '#7e9e86'], [1, '#eef8ee']),
    water: G([0, '#0a2026'], [0.5, '#3a9aa8'], [1, '#e8fffa']),
    gem: G([0, '#0a1a1a'], [0.5, '#5ad8c8'], [1, '#ffffff']),
    flame: null,
  },
};
