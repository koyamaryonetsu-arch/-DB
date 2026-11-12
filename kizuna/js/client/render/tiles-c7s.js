// 第7章 Step 3・4「しずむ前の島の灯台」と 千年前の クモイの 海の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c7.js が まぜる
// ・うき板（326）… 満ち潮の 水に うかぶ 木の 板（水が ゆれる 2コマ）/ ぬれた 砂（327）… 引き潮で 出てきた 砂と 水たまり
// ・しおの かね（328）… 石の ゆかに 金の かね / 大波の 通路（329）… みぞの ある ぬれた 石の ゆか / 大波（330）… 白い しぶき（3コマ）
// ・からくりの とびら（331）… さびた 鉄の とびらと 歯車 / かべの 戸だな（332）… 石の かべの 木の 戸
// ・灯台の 大ランプ（333 火が 消えている・334 ともっている 3コマ）/ かわいた 海の そこ（335）… 貝がらと サンゴの かけら
// ・サンゴの 岩（336）… 海の 中の 赤い サンゴ（波が ゆれる 2コマ）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=9a5805f1f322';
import { prand } from './pixel.js?v=9a5805f1f322';
// 第7章 Step 5・6（第3幕）: 氷の竜の城・千年前の シロガネ地方の タイル（render/tiles-c7i.js。ここで まぜる）
import { C7I_PAINTERS, C7I_FRAMES, C7I_SPEED, C7I_FLOOR_H, c7iBlockSpec, C7I_PROPS, C7I_PROPS_KEEP, C7I_THEMES } from './tiles-c7i.js?v=9a5805f1f322';

const SEA = { d: '#123a6a', b: '#1e5a9a', l: '#4a8ad0', w: '#d8f0ff' }; // 灯台の 中の 海の 水
const WD = { d: '#5a3a1e', b: '#8a5a32', l: '#b8844e', n: '#3a2412' }; // 木の 板
const SA = { d: '#7a6a4e', b: '#9a8866', l: '#bcae8a' }; // ぬれた 砂
const ST = { d: '#5a6270', b: '#8a92a0', l: '#b4bcc8', hl: '#dce2ec', ln: '#454c58' }; // 白っぽい 石
const GO = { d: '#8a5a14', b: '#d8a030', l: '#f8d870', hl: '#fff8c8' }; // 金
const IR = { d: '#3a2418', b: '#6a3e22', l: '#9a5e32', r: '#b86a2a' }; // さびた 鉄
const DRY = { d: '#8a8272', b: '#b8b0a0', l: '#d8d0bc' }; // かわいた 海の そこ
const CO = { d: '#8a2a3a', b: '#d85a5a', l: '#f8a0a0' }; // サンゴ

function seaBase(p, v, f) {
  p.rect(0, 0, 16, 16, SEA.b);
  const r = prand(v * 23 + 7);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), SEA.d);
  for (let i = 0; i < 3; i++) {
    const x = (Math.floor(r() * 12) + f * 3) % 14, y = Math.floor(r() * 14) + 1;
    p.hline(x, x + 2, y, SEA.l);
  }
}
function stoneFloor(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 41 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.l : ST.d);
  p.hline(0, 15, 0, ST.ln); p.vline(0, 0, 15, ST.ln);
}
// うき板（水が ゆれて、板が 少し 上下する）
export const BOARD_FRAMES = 2;
function paintBoard(p, v, f) {
  seaBase(p, v, f);
  const y0 = 3 + (f % 2);
  p.rect(1, y0, 14, 9, WD.d);
  p.rect(1, y0, 14, 8, WD.b);
  for (const y of [y0 + 2, y0 + 5]) p.hline(1, 14, y, WD.n);
  p.hline(2, 13, y0, WD.l);
  for (const [x, y] of [[3, y0 + 1], [12, y0 + 1], [3, y0 + 6], [12, y0 + 6]]) p.set(x, y, '#c8c8c8');
  p.hline(0, 15, y0 + 9, SEA.w);
}
// ぬれた 砂（水たまりと 小さな 貝）
function paintWetSand(p, v) {
  p.rect(0, 0, 16, 16, SA.b);
  const r = prand(v * 17 + 5);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? SA.d : SA.l);
  p.ellipse(5, 10, 3, 1.5, '#6a8aa0'); p.hline(4, 6, 9, '#a8c8e0');
  p.ellipse(11, 4, 2, 1, '#6a8aa0');
  p.set(12, 11, '#f0e0d0'); p.set(13, 11, '#e8c8b8');
}
// しおの かね（上から 見た 金の かねと 木の わく）
function paintBell(p, v) {
  stoneFloor(p, v);
  p.rect(2, 2, 12, 2, WD.b); p.hline(2, 13, 2, WD.l);
  p.ellipse(8, 9, 5, 5, GO.d);
  p.ellipse(8, 8.5, 4.5, 4.5, GO.b);
  p.ellipse(7, 7, 2, 1.5, GO.l);
  p.set(6, 6, GO.hl);
  p.ellipse(8, 9, 1.2, 1.2, GO.d);
}
// 大波の 通路（ぬれた 石の ゆかに みぞ）
function paintWaveFloor(p, v) {
  stoneFloor(p, v);
  for (const y of [5, 10]) { p.hline(1, 14, y, ST.ln); p.hline(1, 14, y + 1, ST.d); }
  p.set(4, 3, SEA.l); p.set(11, 8, SEA.l); p.set(7, 13, SEA.l);
}
// 大波（2D: 上から 見た 白い しぶき）
export const WAVE_FRAMES = 3;
function paintWave(p, v, f) {
  seaBase(p, v, f);
  const k = f % WAVE_FRAMES;
  p.ellipse(8, 8, 7, 6.5, SEA.l);
  p.ellipse(8, 8 - k * 0.5, 6, 5, '#bfe4f8');
  p.ellipse(8, 7 - k, 4 - k * 0.5, 3, SEA.w);
  const r = prand(v * 5 + k);
  for (let i = 0; i < 7; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), SEA.w);
}
// さびた からくりの とびら（鉄の とびらと 歯車）
function paintKDoor(p, v) {
  p.rect(0, 0, 16, 16, IR.d);
  p.rect(1, 1, 14, 14, IR.b);
  p.vline(8, 1, 14, IR.d);
  for (const y of [3, 12]) p.hline(1, 14, y, IR.d);
  const r = prand(v * 13 + 1);
  for (let i = 0; i < 8; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), IR.r);
  p.ellipse(8, 8, 3, 3, IR.l); p.ellipse(8, 8, 1.5, 1.5, IR.d);
  for (const [x, y] of [[8, 4], [12, 8], [8, 12], [4, 8]]) p.set(x, y, IR.l);
}
// かべの 戸だな（石の かべに 木の 小さな 戸）
function paintCabinet(p, v) {
  p.rect(0, 0, 16, 16, ST.d);
  const r = prand(v * 7 + 3);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), ST.ln);
  p.rect(3, 4, 10, 9, WD.n);
  p.rect(4, 5, 8, 7, WD.b);
  p.vline(8, 5, 11, WD.n);
  p.hline(4, 11, 5, WD.l);
  p.set(7, 8, GO.l); p.set(9, 8, GO.l);
}
// 灯台の 大ランプ（上から 見た ガラスの つつと 金の わく。on … 火が ともっている）
export const LAMP_FRAMES = 3;
function paintLamp(p, v, f, on) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 7, 7, GO.d);
  p.ellipse(8, 8, 6, 6, on ? '#fff0a0' : '#5a6a7a');
  p.ellipse(8, 8, 4, 4, on ? '#ffd040' : '#3a4a5a');
  if (on) {
    const k = f % LAMP_FRAMES;
    p.ellipse(8, 8, 2 + k * 0.5, 2 + k * 0.5, '#ffffff');
    for (const [x, y] of [[1, 8], [14, 8], [8, 1], [8, 14]]) p.set(x, y, k % 2 ? '#fff8c8' : '#ffe890');
  } else {
    p.set(7, 7, '#8a9aa8');
  }
}
// かわいた 海の そこ（貝がらと サンゴの かけら）
function paintDry(p, v) {
  p.rect(0, 0, 16, 16, DRY.b);
  const r = prand(v * 29 + 11);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? DRY.d : DRY.l);
  const sx = 3 + Math.floor(r() * 8), sy = 3 + Math.floor(r() * 8);
  p.set(sx, sy, '#f8f0e8'); p.set(sx + 1, sy, '#e8d0c0'); p.set(sx, sy + 1, '#e8d0c0');
  p.set(sx + 5, sy + 4, CO.b); p.set(sx + 6, sy + 4, CO.l); p.set(sx + 5, sy + 3, CO.b);
}
// サンゴの 岩（海の 中）
export const REEF_FRAMES = 2;
function paintReef(p, v, f) {
  p.rect(0, 0, 16, 16, '#2a6ab8');
  const r = prand(v * 19 + 2);
  for (let i = 0; i < 5; i++) { const x = (Math.floor(r() * 12) + f * 3) % 14, y = Math.floor(r() * 14) + 1; p.hline(x, x + 2, y, '#5a9ae0'); }
  p.ellipse(8, 9, 6, 5, '#7a4a3a');
  p.ellipse(8, 8.5, 5, 4, CO.d);
  for (const [x, y] of [[5, 6], [8, 5], [11, 7], [6, 10], [10, 10]]) { p.set(x, y, CO.b); p.set(x, y - 1, CO.l); }
  p.hline(2, 13, 14, f % 2 ? '#d8f0ff' : '#8ac8f0');
}

export const C7S_PAINTERS = {
  [T.C7S_BOARD]: (p, v, f) => paintBoard(p, v, f),
  [T.C7S_WET_SAND]: (p, v) => paintWetSand(p, v),
  [T.C7S_BELL]: (p, v) => paintBell(p, v),
  [T.C7S_WAVE_FLOOR]: (p, v) => paintWaveFloor(p, v),
  [T.C7S_WAVE]: (p, v, f) => paintWave(p, v, f),
  [T.C7S_KDOOR]: (p, v) => paintKDoor(p, v),
  [T.C7S_CABINET]: (p, v) => paintCabinet(p, v),
  [T.C7S_LAMP]: (p, v, f) => paintLamp(p, v, f, false),
  [T.C7S_LAMP_ON]: (p, v, f) => paintLamp(p, v, f, true),
  [T.C7S_DRY]: (p, v) => paintDry(p, v),
  [T.C7S_REEF]: (p, v, f) => paintReef(p, v, f),
  ...C7I_PAINTERS,
};
export const C7S_FRAMES = { [T.C7S_BOARD]: BOARD_FRAMES, [T.C7S_WAVE]: WAVE_FRAMES, [T.C7S_LAMP_ON]: LAMP_FRAMES, [T.C7S_REEF]: REEF_FRAMES, ...C7I_FRAMES };
export const C7S_SPEED = { [T.C7S_BOARD]: 700, [T.C7S_WAVE]: 150, [T.C7S_LAMP_ON]: 220, [T.C7S_REEF]: 650, ...C7I_SPEED };

// ───── 2.5D ─────
// うき板・ぬれた 砂・海の そこ・サンゴは 少し ひくい。からくりの とびら・戸だなは かべ（洞窟の かべと おなじ 高さ）
export const C7S_FLOOR_H = { [T.C7S_BOARD]: -0.14, [T.C7S_WET_SAND]: -0.12, [T.C7S_DRY]: -0.16, [T.C7S_WAVE_FLOOR]: -0.04, [T.C7S_REEF]: -0.2, ...C7I_FLOOR_H };
export function c7sBlockSpec(id, v) {
  if (id === T.C7S_KDOOR) return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.C7S_KDOOR, 0, 0], gate: true };
  if (id === T.C7S_CABINET) return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.C7S_CABINET, v, 0] };
  return c7iBlockSpec(id, v);
}
// たてた もの（[はば, 高さ, かく 関数]）: 大波・しおの かね・灯台の 大ランプ・サンゴ
const lampProp = (on) => [18, 30, (p) => {
  // 台
  p.rect(2, 24, 14, 6, GO.d); p.hline(2, 15, 24, GO.l); p.hline(2, 15, 29, '#5a3a0a');
  // ガラスの つつと わく
  p.rect(3, 6, 12, 18, GO.d);
  p.rect(4, 7, 10, 16, on ? '#fff0a0' : '#4a5a6a');
  for (const x of [4, 9, 13]) p.vline(x, 7, 22, GO.b);
  if (on) { p.ellipse(9, 15, 4, 5, '#ffd040'); p.ellipse(9, 15, 2, 3, '#ffffff'); } else p.ellipse(9, 16, 2, 2, '#2a3440');
  // やね
  p.rect(2, 3, 14, 3, GO.b); p.hline(2, 15, 3, GO.l); p.rect(7, 0, 4, 3, GO.d);
}];
export const C7S_PROPS = {
  [T.C7S_WAVE]: [16, 24, (p) => {
    for (let y = 4; y < 24; y++) {
      const w = 5 + Math.round(Math.sin(y * 0.5) * 1.5) + (y > 18 ? 2 : 0);
      p.hline(8 - w, 7 + w, y, y % 3 ? '#bfe4f8' : SEA.w);
      p.set(8 - w, y, SEA.l); p.set(7 + w, y, SEA.l);
    }
    p.ellipse(8, 4, 6, 3, SEA.w); p.ellipse(11, 2, 3, 2, SEA.w);
    for (const [x, y] of [[1, 6], [14, 9], [2, 14], [13, 17]]) p.set(x, y, SEA.w);
  }],
  [T.C7S_BELL]: [16, 26, (p) => {
    // 木の わく
    p.vline(2, 2, 25, WD.d); p.vline(3, 2, 25, WD.b); p.vline(12, 2, 25, WD.d); p.vline(13, 2, 25, WD.b);
    p.rect(1, 1, 14, 3, WD.b); p.hline(1, 14, 1, WD.l);
    // 金の かね
    p.vline(8, 4, 6, '#3a3a3a');
    p.rect(5, 7, 6, 2, GO.b);
    for (let y = 9; y < 17; y++) { const w = 3 + Math.floor((y - 9) / 3); p.hline(8 - w, 7 + w, y, GO.b); p.set(8 - w, y, GO.l); p.set(7 + w, y, GO.d); }
    p.hline(3, 12, 17, GO.d); p.set(8, 18, GO.d);
  }],
  [T.C7S_LAMP]: lampProp(false),
  [T.C7S_LAMP_ON]: lampProp(true),
  [T.C7S_REEF]: [14, 12, (p) => {
    for (const [x, h] of [[3, 8], [6, 11], [9, 9], [12, 7]]) { p.vline(x, 12 - h, 11, CO.b); p.set(x, 12 - h, CO.l); p.set(x - 1, 14 - h, CO.d); p.set(x + 1, 13 - h, CO.d); }
  }],
  ...C7I_PROPS,
};
// たてた ものでも 色を かえない（大波の 白・ともった ランプの 光）
export const C7S_PROPS_KEEP = new Set([T.C7S_WAVE, T.C7S_LAMP_ON, ...C7I_PROPS_KEEP]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C7S_THEMES = {
  // 千年前の しずむ前の島の灯台: 白い 石と、青い 海の 水
  c7s_light: {
    floor: G([0, '#141a22'], [0.3, '#6a7484'], [0.6, '#c4ccd8'], [1, '#ffffff']),
    wall: G([0, '#0e121a'], [0.3, '#4a5468'], [0.6, '#9aa4b8'], [1, '#f4f8ff']),
    water: G([0, '#081a36'], [0.5, '#2a6ac0'], [1, '#e0f4ff']),
    gem: G([0, '#1a1408'], [0.5, '#f0c050'], [1, '#ffffff']),
    flame: null,
  },
  // 第7章 Step 5・6: 氷の竜の城（千年前）
  ...C7I_THEMES,
};
