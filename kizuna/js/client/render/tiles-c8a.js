// 第8章 第1幕「月の王宮の地下迷宮」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c7i.js が まぜる
// ・月の 鏡（343「／」・344「＼」）… 銀の まるい 鏡と 台。ななめの 光の すじで むきが わかる
// ・月の 光の 橋（345）… 暗い 谷の 上の 白い 光の 板（3コマで きらきら）/ 光の 当たらない 谷（346）… 暗い 谷に うすい 橋の あと
// ・千年前の 砂の 川（347）… 流れる 金色の 砂（3コマ）/ 今の 砂山（348）… つもった 砂
// ・月の 箱（349）… 三日月の かざりの 小箱 / 月の 門（350）… 三日月の もようの 石の 門 / 黒い 砂の かべ（351）… うずを まく 黒い 砂（3コマ）
// ・砂の ふる ゆか（352）… 砂の 影の ある 石の ゆか / 砂の 滝（353）… ふりそそぐ 砂（3コマ）/ 月の 石板（354）… まるい 月の もようの 石板
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=c6a25f593e36';
import { prand } from './pixel.js?v=c6a25f593e36';
// 第8章 第2幕: よみの海底神殿の タイル（render/tiles-c8b.js。ここで まぜる）
import { C8B_PAINTERS, C8B_FRAMES, C8B_SPEED, C8B_FLOOR_H, c8bBlockSpec, C8B_PROPS, C8B_PROPS_KEEP, C8B_THEMES } from './tiles-c8b.js?v=c6a25f593e36';

const ST = { d: '#2a2848', b: '#4a4a78', l: '#7a7aa8', hl: '#a8a8d0', ln: '#1e1c38' }; // 月の 王宮の 石
const SV = { d: '#6a7088', b: '#c8d0e4', l: '#eef2ff', w: '#ffffff' }; // 銀
const GO = { d: '#8a6a1a', b: '#d8a830', l: '#f8d870' }; // 金
const SA = { d: '#9a7030', b: '#d0a050', l: '#f0d088', w: '#fff0c0' }; // 砂
const DK = { d: '#06060e', b: '#10101e', l: '#1e1e34' }; // 暗い 谷
const MO = { d: '#c8c088', b: '#f4f0b8', l: '#fffce8' }; // 月の 光
const SH = { d: '#06040a', b: '#1a1024', l: '#3a2a4a', t: '#6a4a8a' }; // 黒い 砂

function stoneFloor(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 41 + 7);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.l : ST.d);
  p.hline(0, 15, 0, ST.ln); p.vline(0, 0, 15, ST.ln);
}
function chasm(p, v) {
  p.rect(0, 0, 16, 16, DK.b);
  const r = prand(v * 23 + 3);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? DK.l : DK.d);
}
// 月の 鏡（on … 「＼」）
function paintMirror(p, v, on) {
  stoneFloor(p, v);
  p.rect(6, 12, 4, 3, GO.d); p.hline(5, 10, 14, GO.b);
  p.ellipse(8, 7, 5, 6, GO.b);
  p.ellipse(8, 7, 4, 5, SV.b);
  p.ellipse(7, 6, 2, 2, SV.l);
  // 光の すじ（むき）
  for (let i = -3; i <= 3; i++) p.set(8 + (on ? i : -i), 7 + i, SV.w);
  p.set(4, 2, MO.l); p.set(12, 2, MO.l);
}
// 月の 光の 橋（暗い 谷の 上の 光の 板）
export const LIGHT_FRAMES = 3;
function paintLight(p, v, f) {
  chasm(p, v);
  p.rect(1, 2, 14, 12, MO.d);
  p.rect(2, 3, 12, 10, MO.b);
  for (let y = 4; y < 13; y += 3) p.hline(2, 13, y, MO.d);
  const k = f % LIGHT_FRAMES;
  for (let i = 0; i < 4; i++) p.set(3 + ((i * 4 + k * 3) % 11), 4 + ((i * 3 + k) % 8), MO.l);
}
// 光の 当たらない 谷（うすい 橋の あと）
function paintDarkBridge(p, v) {
  chasm(p, v);
  for (let x = 2; x < 14; x += 2) { p.set(x, 2, '#2a2a48'); p.set(x, 13, '#2a2a48'); }
  for (let y = 2; y < 14; y += 2) { p.set(1, y, '#2a2a48'); p.set(14, y, '#2a2a48'); }
}
// 千年前の 砂の 川（流れる 砂）
export const RIVER_FRAMES = 3;
function paintSandRiver(p, v, f) {
  p.rect(0, 0, 16, 16, SA.d);
  const k = f % RIVER_FRAMES;
  for (let y = 0; y < 16; y++) {
    const off = (y * 3 + k * 2 + v) % 6;
    for (let x = off; x < 16; x += 6) { p.set(x, y, SA.b); p.set((x + 1) % 16, y, SA.l); }
  }
  p.set((5 + k * 4) % 16, 4, SA.w); p.set((11 + k * 4) % 16, 11, SA.w);
}
// 今の 砂山
function paintDune(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 10, 7, 5, SA.d);
  p.ellipse(8, 9, 6, 4, SA.b);
  p.ellipse(6, 7, 3, 2, SA.l);
  const r = prand(v * 17 + 1);
  for (let i = 0; i < 4; i++) p.set(3 + Math.floor(r() * 10), 7 + Math.floor(r() * 5), SA.w);
}
// 月の 箱
function paintMoonBox(p, v) {
  stoneFloor(p, v);
  p.rect(3, 6, 10, 8, GO.d);
  p.rect(3, 6, 10, 7, GO.b);
  p.hline(3, 12, 6, GO.l); p.hline(3, 12, 9, GO.d);
  p.ellipse(8, 10.5, 2, 2, SV.l); p.ellipse(9, 10, 1.5, 1.5, GO.b);
}
// 月の 門（しまっている）
function paintMoonGate(p, v) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(1, 1, 14, 15, ST.b);
  p.vline(8, 1, 15, ST.ln);
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 4; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), ST.l);
  // 三日月
  p.ellipse(8, 7, 4, 4, SV.b); p.ellipse(9.5, 6, 3.4, 3.6, ST.b);
  p.set(4, 12, GO.l); p.set(11, 12, GO.l);
}
// 黒い 砂の かべ（うず）
export const SEAL_FRAMES = 3;
function paintShadowSeal(p, v, f) {
  p.rect(0, 0, 16, 16, SH.b);
  const k = f % SEAL_FRAMES;
  for (let a = 0; a < 24; a++) {
    const t = a * 0.5 + k * 0.7;
    const rr = 1 + a * 0.28;
    p.set(Math.round(8 + Math.cos(t) * rr), Math.round(8 + Math.sin(t) * rr), a % 3 ? SH.l : SH.t);
  }
  p.set(8, 8, SH.d);
}
// 砂の ふる ゆか
function paintFallFloor(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 5, 3, '#3a3450');
  p.set(7, 8, SA.d); p.set(9, 7, SA.d);
}
// 砂の 滝（ふりそそぐ 砂）
export const FALL_FRAMES = 3;
function paintSandFall(p, v, f) {
  stoneFloor(p, v);
  const k = f % FALL_FRAMES;
  p.ellipse(8, 12, 6, 3, SA.d);
  p.ellipse(8, 11.5, 5, 2.4, SA.b);
  p.rect(4, 0, 8, 12, SA.b);
  for (let y = 0; y < 12; y++) for (let x = 4; x < 12; x += 2) if ((y + k + x) % 3 === 0) p.set(x, y, SA.l);
  p.vline(5, 0, 11, SA.d); p.vline(10, 0, 11, SA.d);
  p.set(3, 13 - k, SA.w); p.set(12, 12 + (k % 2), SA.w);
}
// 月の 石板
function paintSlab(p, v) {
  p.rect(0, 0, 16, 16, '#5a5a78');
  p.rect(1, 1, 14, 14, '#8a8aa8');
  p.hline(1, 14, 1, '#b8b8d0'); p.vline(1, 1, 14, '#b8b8d0');
  p.ellipse(8, 8, 5, 5, '#5a5a78');
  p.ellipse(8, 8, 4, 4, SV.b);
  p.ellipse(9.5, 7, 3.2, 3.4, '#8a8aa8');
  const r = prand(v * 5 + 2);
  for (let i = 0; i < 3; i++) p.set(2 + Math.floor(r() * 12), 2 + Math.floor(r() * 12), '#6a6a88');
}

export const C8A_PAINTERS = {
  [T.C8A_MIRROR_A]: (p, v) => paintMirror(p, v, false),
  [T.C8A_MIRROR_B]: (p, v) => paintMirror(p, v, true),
  [T.C8A_LIGHT]: (p, v, f) => paintLight(p, v, f),
  [T.C8A_DARKBRIDGE]: (p, v) => paintDarkBridge(p, v),
  [T.C8A_SANDRIVER]: (p, v, f) => paintSandRiver(p, v, f),
  [T.C8A_DUNE]: (p, v) => paintDune(p, v),
  [T.C8A_MOONBOX]: (p, v) => paintMoonBox(p, v),
  [T.C8A_MOONGATE]: (p, v) => paintMoonGate(p, v),
  [T.C8A_SHADOWSEAL]: (p, v, f) => paintShadowSeal(p, v, f),
  [T.C8A_FALL_FLOOR]: (p, v) => paintFallFloor(p, v),
  [T.C8A_SANDFALL]: (p, v, f) => paintSandFall(p, v, f),
  [T.C8A_SLAB]: (p, v) => paintSlab(p, v),
  ...C8B_PAINTERS,
};
export const C8A_FRAMES = { [T.C8A_LIGHT]: LIGHT_FRAMES, [T.C8A_SANDRIVER]: RIVER_FRAMES, [T.C8A_SHADOWSEAL]: SEAL_FRAMES, [T.C8A_SANDFALL]: FALL_FRAMES, ...C8B_FRAMES };
export const C8A_SPEED = { [T.C8A_LIGHT]: 260, [T.C8A_SANDRIVER]: 180, [T.C8A_SHADOWSEAL]: 200, [T.C8A_SANDFALL]: 140, ...C8B_SPEED };

// ───── 2.5D ─────
// 谷・光の 橋・砂の 川は ひくい。月の 門は たてた もの（横から 来ても 見える ように）
export const C8A_FLOOR_H = { [T.C8A_LIGHT]: -0.04, [T.C8A_DARKBRIDGE]: -0.5, [T.C8A_SANDRIVER]: -0.2, [T.C8A_FALL_FLOOR]: -0.02, ...C8B_FLOOR_H };
export function c8aBlockSpec(id, v) {
  return c8bBlockSpec(id, v);
}
// たてた もの（[はば, 高さ, かく 関数]）: 月の 門・月の 鏡・砂山・月の 箱・黒い 砂の かべ・砂の 滝
const mirrorProp = (on) => [14, 22, (p) => {
  p.rect(4, 18, 6, 4, GO.d); p.hline(3, 10, 21, GO.b);
  p.ellipse(7, 9, 6, 8, GO.b);
  p.ellipse(7, 9, 5, 7, SV.b);
  p.ellipse(6, 7, 2, 3, SV.l);
  for (let i = -4; i <= 4; i++) p.set(7 + (on ? i : -i), 9 + i, SV.w);
}];
export const C8A_PROPS = {
  [T.C8A_MOONGATE]: [16, 26, (p) => {
    p.rect(1, 2, 14, 24, ST.d); p.rect(2, 3, 12, 22, ST.b); p.vline(8, 3, 25, ST.ln);
    p.ellipse(8, 9, 4, 4, SV.b); p.ellipse(9.5, 8, 3.4, 3.6, ST.b);
    p.rect(1, 0, 14, 3, ST.l); p.set(4, 20, GO.l); p.set(11, 20, GO.l);
  }],
  [T.C8A_MIRROR_A]: mirrorProp(false),
  [T.C8A_MIRROR_B]: mirrorProp(true),
  [T.C8A_DUNE]: [16, 8, (p) => { p.ellipse(8, 6, 7, 3, SA.d); p.ellipse(8, 5, 6, 3, SA.b); p.ellipse(6, 4, 3, 1.5, SA.l); }],
  [T.C8A_MOONBOX]: [14, 12, (p) => {
    p.rect(1, 3, 12, 9, GO.d); p.rect(1, 3, 12, 8, GO.b); p.hline(1, 12, 3, GO.l); p.rect(1, 0, 12, 3, GO.l);
    p.ellipse(7, 7, 2, 2, SV.l); p.ellipse(8, 6.5, 1.5, 1.5, GO.b);
  }],
  [T.C8A_SHADOWSEAL]: [16, 20, (p) => {
    for (let y = 0; y < 20; y++) { const w = 4 + Math.round(Math.sin(y * 0.6) * 2); p.hline(8 - w, 7 + w, y, y % 3 ? SH.b : SH.l); }
    p.set(5, 6, SH.t); p.set(10, 12, SH.t);
  }],
  [T.C8A_SANDFALL]: [12, 24, (p) => {
    for (let y = 0; y < 24; y++) { p.hline(2, 9, y, y % 3 ? SA.b : SA.l); p.set(2, y, SA.d); p.set(9, y, SA.d); }
    p.ellipse(6, 22, 5, 2, SA.d);
  }],
  ...C8B_PROPS,
};
// たてた ものでも 色を かえない（鏡の 銀・砂の 金色）
export const C8A_PROPS_KEEP = new Set([T.C8A_MIRROR_A, T.C8A_MIRROR_B, T.C8A_MOONBOX, T.C8A_SANDFALL, T.C8A_DUNE, ...C8B_PROPS_KEEP]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C8A_THEMES = {
  // 千年前の 月の王宮の 地下: 青むらさきの 石と 銀の 月の 色・金の かざり
  c8a_moon: {
    floor: G([0, '#141228'], [0.3, '#4a4a7a'], [0.6, '#9a9ac8'], [1, '#f4f0ff']),
    wall: G([0, '#0a0a1a'], [0.3, '#2e2c58'], [0.6, '#6a68a0'], [1, '#e0dcff']),
    water: G([0, '#3a2a10'], [0.5, '#c89a40'], [1, '#fff4d0']),
    gem: G([0, '#2a2008'], [0.5, '#e8c050'], [1, '#ffffff']),
    flame: G([0, '#3a3a6a'], [0.5, '#c8c8f8'], [1, '#ffffff']),
  },
  // 第8章 第2幕: よみの海底神殿（千年前）
  ...C8B_THEMES,
};
