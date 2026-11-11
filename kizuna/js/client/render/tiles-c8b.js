// 第8章 第2幕「よみの海底神殿」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c8a.js が まぜる
// ・青い 火の 台（355 火の ない 台・356 青い 火が ともった 台。3コマで ゆらゆら）
// ・よみの道（357 青い 火の 光の 中で 見える ゆか。3コマで きらきら）/ 光の ない よみの道（358 雲の 海に うすい ゆかの ふち）
// ・千年前の 海の 水（359。3コマで ゆれる）/ 貝の 箱（360）/ しまった しおの とびら（361 大きな 貝の もよう）
// ・青い ほのおの かべ（362。3コマ）/ 青い 火が ふき出す ゆか（363）/ ふき出した 青い 火の 柱（364。3コマ）
// ・うずしおの岩場の 青い うず（365。3コマで まわる）/ 雲から出てきた島の 貝の もようの 石の とびら（366）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=9a8a9aaa43ce';
import { prand } from './pixel.js?v=9a8a9aaa43ce';

const ST = { d: '#14243a', b: '#2a4262', l: '#4a6a90', hl: '#7a9ac0', ln: '#0c1828' }; // 海の 底の 神殿の 石
const BF = { d: '#1a5aa8', b: '#3aa8f0', l: '#8ae0ff', w: '#e8fcff' }; // 青い 火
const SEA = { d: '#0a2a50', b: '#164a80', l: '#3a7ab8', w: '#9ad0f0' }; // 海の 水
const CL = { d: '#b8c8e0', b: '#dce6f4', l: '#f4f8ff' }; // 雲
const SH = { d: '#b88a7a', b: '#f0c8b8', l: '#fff0e8', ln: '#8a5a4a' }; // 貝
const GD = { d: '#6a5a3a', b: '#a89a70', l: '#d8ccaa' }; // 石の とびらの 砂岩

function stoneFloor(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 37 + 11);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.l : ST.d);
  p.hline(0, 15, 0, ST.ln); p.vline(0, 0, 15, ST.ln);
}
function clouds(p, v, f = 0) {
  p.rect(0, 0, 16, 16, CL.b);
  const r = prand(v * 29 + 5);
  for (let i = 0; i < 4; i++) {
    const x = (Math.floor(r() * 16) + f) % 16, y = Math.floor(r() * 16);
    p.ellipse(x, y, 3, 1.5, i % 2 ? CL.l : CL.d);
  }
}
// 青い 火の 台（on … 火が ともっている）
export const FIRE_FRAMES = 3;
function paintBrazier(p, v, on, f) {
  stoneFloor(p, v);
  p.ellipse(8, 14, 6, 1.5, ST.ln);
  p.rect(6, 9, 4, 5, ST.d); p.vline(6, 9, 13, ST.hl);
  p.ellipse(8, 8.5, 5, 2, ST.hl);
  p.ellipse(8, 8.5, 4, 1.4, ST.ln);
  if (!on) { p.set(7, 8, '#3a3a4a'); p.set(9, 9, '#3a3a4a'); return; }
  const k = f % FIRE_FRAMES;
  // ほのお（上が ほそく とがって、下が ふとい。まわりは 青・中は 水色・しんは 白）
  for (let y = 0; y < 8; y++) {
    const w = Math.max(0, Math.round((y + 1) / 2.2 + ((y + k) % 3 === 0 ? 0.6 : 0)));
    const sway = y < 4 ? (k - 1) : 0;
    p.hline(8 - w + sway, 7 + w + sway, y + 1, BF.b);
    if (w > 1) p.hline(9 - w + sway, 6 + w + sway, y + 1, BF.l);
  }
  p.vline(8 + (k === 2 ? 1 : 0) - 1, 5, 8, BF.w);
  p.set(4 + k, 3, BF.l); p.set(12 - k, 4, BF.b);
}
// よみの道（光の 中で 見える 青い すきとおった ゆか）
export const WAY_FRAMES = 3;
function paintSpiritWay(p, v, f) {
  clouds(p, v);
  p.rect(1, 1, 14, 14, BF.d);
  p.rect(2, 2, 12, 12, BF.b);
  for (let y = 4; y < 14; y += 4) p.hline(2, 13, y, BF.d);
  for (let x = 5; x < 14; x += 5) p.vline(x, 2, 13, BF.d);
  const k = f % WAY_FRAMES;
  for (let i = 0; i < 4; i++) p.set(3 + ((i * 4 + k * 3) % 10), 3 + ((i * 3 + k * 2) % 10), BF.w);
  p.hline(2, 13, 2, BF.l);
}
// 光の ない よみの道（雲の 海に、うすい ゆかの ふちだけ）
export const VOID_FRAMES = 3;
function paintVoid(p, v, f) {
  clouds(p, v, f % VOID_FRAMES);
  for (let x = 2; x < 14; x += 3) { p.set(x, 1, '#a8b8d8'); p.set(x, 14, '#a8b8d8'); }
  for (let y = 2; y < 14; y += 3) { p.set(1, y, '#a8b8d8'); p.set(14, y, '#a8b8d8'); }
}
// 千年前の 海の 水（神殿に 入りこんだ 深い 水）
export const SEA_FRAMES = 3;
function paintSeaWater(p, v, f) {
  p.rect(0, 0, 16, 16, SEA.b);
  const k = f % SEA_FRAMES;
  for (let y = 1; y < 16; y += 4) {
    const off = (y + k * 2 + v) % 8;
    for (let x = off; x < 16; x += 8) { p.hline(x, Math.min(15, x + 2), y, SEA.l); p.set(x + 1, y - 1, SEA.w); }
  }
  p.set((3 + k * 5) % 16, 9, SEA.d); p.set((11 + k * 3) % 16, 13, SEA.d);
  // 青い 火の 光の うつりこみ
  p.set((6 + k * 4) % 16, 6, BF.l);
}
// 貝の 箱
function paintShellBox(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 13, 6, 1.5, ST.ln);
  p.rect(3, 8, 10, 5, SH.d); p.rect(3, 8, 10, 4, SH.b);
  // ふた（ほたての 貝）
  p.ellipse(8, 7, 5, 4, SH.b);
  for (let i = -2; i <= 2; i++) p.vline(8 + i * 2, 4, 9, SH.ln);
  p.hline(4, 11, 9, SH.d); p.set(8, 5, SH.l); p.set(6, 6, SH.l);
}
// しまった しおの とびら（大きな 貝の もよう）
function paintShellGate(p, v) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(1, 1, 14, 15, ST.b);
  p.vline(8, 1, 15, ST.ln);
  const r = prand(v * 7 + 3);
  for (let i = 0; i < 4; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), ST.l);
  p.ellipse(8, 7, 5, 4, SH.b);
  for (let i = -2; i <= 2; i++) p.vline(8 + i * 2, 4, 10, SH.ln);
  p.rect(6, 10, 4, 2, SH.d);
  p.set(3, 13, BF.b); p.set(12, 13, BF.b);
}
// 青い ほのおの かべ
export const WALL_FRAMES = 3;
function paintFlameWall(p, v, f) {
  p.rect(0, 0, 16, 16, '#06122a');
  const k = f % WALL_FRAMES;
  for (let x = 0; x < 16; x++) {
    const h = 6 + ((x * 7 + k * 5 + v) % 9);
    p.vline(x, 16 - h, 15, x % 2 ? BF.b : BF.d);
    p.set(x, 16 - h, BF.l);
    if ((x + k) % 4 === 0) p.vline(x, 16 - Math.floor(h / 2), 15, BF.w);
  }
}
// 青い 火が ふき出す ゆか（あな）
function paintGeyserFloor(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 4, 2.5, ST.ln);
  p.ellipse(8, 8, 3, 1.6, '#06101e');
  p.set(7, 8, BF.d); p.set(9, 7, BF.d);
}
// ふき出した 青い 火の 柱
export const GEYSER_FRAMES = 3;
function paintGeyser(p, v, f) {
  stoneFloor(p, v);
  const k = f % GEYSER_FRAMES;
  p.ellipse(8, 12, 6, 3, BF.d);
  p.ellipse(8, 11.5, 5, 2.4, BF.b);
  p.rect(4, 0, 8, 12, BF.b);
  for (let y = 0; y < 12; y++) for (let x = 4; x < 12; x += 2) if ((y + k + x) % 3 === 0) p.set(x, y, BF.l);
  p.vline(5, 0, 11, BF.d); p.vline(10, 0, 11, BF.d);
  p.vline(8, 0, 10, BF.w);
  p.set(3, 13 - k, BF.w); p.set(12, 12 + (k % 2), BF.w);
}
// うずしおの岩場の 青い うず
export const WHIRL_FRAMES = 3;
function paintWhirl(p, v, f) {
  p.rect(0, 0, 16, 16, SEA.d);
  const k = f % WHIRL_FRAMES;
  for (let a = 0; a < 30; a++) {
    const t = a * 0.45 + k * 0.8;
    const rr = 0.6 + a * 0.24;
    p.set(Math.round(8 + Math.cos(t) * rr), Math.round(8 + Math.sin(t) * rr), a % 3 ? SEA.l : BF.b);
  }
  p.ellipse(8, 8, 1.6, 1.6, BF.l);
  p.set(8, 8, BF.w);
}
// 雲から出てきた島の 貝の もようの 石の とびら（草の 上に 立つ 石）
function paintShellDoor(p, v) {
  p.rect(0, 0, 16, 16, '#7aa860');
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#5a8a48');
  p.rect(2, 1, 12, 14, GD.d);
  p.rect(3, 2, 10, 12, GD.b);
  p.hline(3, 12, 2, GD.l);
  p.ellipse(8, 7, 4, 3.5, SH.b);
  for (let i = -1; i <= 1; i++) p.vline(8 + i * 2, 4, 9, SH.ln);
  p.rect(6, 10, 4, 4, '#3a3020');
}

export const C8B_PAINTERS = {
  [T.C8B_BRAZIER]: (p, v) => paintBrazier(p, v, false, 0),
  [T.C8B_BRAZIER_ON]: (p, v, f) => paintBrazier(p, v, true, f),
  [T.C8B_SPIRITWAY]: (p, v, f) => paintSpiritWay(p, v, f),
  [T.C8B_VOID]: (p, v, f) => paintVoid(p, v, f),
  [T.C8B_SEAWATER]: (p, v, f) => paintSeaWater(p, v, f),
  [T.C8B_SHELLBOX]: (p, v) => paintShellBox(p, v),
  [T.C8B_SHELLGATE]: (p, v) => paintShellGate(p, v),
  [T.C8B_FLAMEWALL]: (p, v, f) => paintFlameWall(p, v, f),
  [T.C8B_GEYSER_FLOOR]: (p, v) => paintGeyserFloor(p, v),
  [T.C8B_GEYSER]: (p, v, f) => paintGeyser(p, v, f),
  [T.C8B_WHIRL]: (p, v, f) => paintWhirl(p, v, f),
  [T.C8B_SHELLDOOR]: (p, v) => paintShellDoor(p, v),
};
export const C8B_FRAMES = {
  [T.C8B_BRAZIER_ON]: FIRE_FRAMES, [T.C8B_SPIRITWAY]: WAY_FRAMES, [T.C8B_VOID]: VOID_FRAMES, [T.C8B_SEAWATER]: SEA_FRAMES,
  [T.C8B_FLAMEWALL]: WALL_FRAMES, [T.C8B_GEYSER]: GEYSER_FRAMES, [T.C8B_WHIRL]: WHIRL_FRAMES,
};
export const C8B_SPEED = {
  [T.C8B_BRAZIER_ON]: 160, [T.C8B_SPIRITWAY]: 260, [T.C8B_VOID]: 600, [T.C8B_SEAWATER]: 220,
  [T.C8B_FLAMEWALL]: 150, [T.C8B_GEYSER]: 140, [T.C8B_WHIRL]: 180,
};

// ───── 2.5D ─────
// よみの道は 少し ひくい・光の ない 所と 海の 水は ひくい。台・貝の 箱・火の 柱・ほのおの かべ・とびらは たてた もの
export const C8B_FLOOR_H = { [T.C8B_SPIRITWAY]: -0.04, [T.C8B_VOID]: -0.5, [T.C8B_SEAWATER]: -0.2, [T.C8B_GEYSER_FLOOR]: -0.02 };
export function c8bBlockSpec() {
  return null;
}
const brazierProp = (on) => [12, 22, (p) => {
  p.rect(3, 12, 6, 10, ST.d); p.vline(3, 12, 21, ST.hl); p.hline(2, 9, 21, ST.ln);
  p.ellipse(6, 11, 5, 2, ST.hl); p.ellipse(6, 11, 4, 1.4, ST.ln);
  if (!on) return;
  for (let y = 0; y < 11; y++) {
    const w = Math.max(0, Math.round((y + 1) / 2.2));
    p.hline(6 - w, 5 + w, y, BF.b);
    if (w > 1) p.hline(7 - w, 4 + w, y, BF.l);
  }
  p.vline(5, 4, 10, BF.w); p.vline(6, 6, 10, BF.w);
}];
export const C8B_PROPS = {
  [T.C8B_BRAZIER]: brazierProp(false),
  [T.C8B_BRAZIER_ON]: brazierProp(true),
  [T.C8B_SHELLBOX]: [14, 12, (p) => {
    p.rect(1, 6, 12, 6, SH.d); p.rect(1, 6, 12, 5, SH.b);
    p.ellipse(7, 4, 6, 4, SH.b);
    for (let i = -2; i <= 2; i++) p.vline(7 + i * 2, 1, 7, SH.ln);
    p.set(7, 2, SH.l);
  }],
  [T.C8B_SHELLGATE]: [16, 26, (p) => {
    p.rect(1, 2, 14, 24, ST.d); p.rect(2, 3, 12, 22, ST.b); p.vline(8, 3, 25, ST.ln);
    p.ellipse(8, 10, 5, 4, SH.b);
    for (let i = -2; i <= 2; i++) p.vline(8 + i * 2, 7, 13, SH.ln);
    p.rect(1, 0, 14, 3, ST.l); p.set(4, 20, BF.b); p.set(11, 20, BF.b);
  }],
  [T.C8B_SHELLDOOR]: [16, 24, (p) => {
    p.rect(1, 1, 14, 23, GD.d); p.rect(2, 2, 12, 21, GD.b); p.hline(2, 13, 2, GD.l);
    p.ellipse(8, 9, 4, 3.5, SH.b);
    for (let i = -1; i <= 1; i++) p.vline(8 + i * 2, 6, 11, SH.ln);
    p.rect(6, 15, 4, 8, '#3a3020');
  }],
  [T.C8B_FLAMEWALL]: [16, 22, (p) => {
    for (let y = 0; y < 22; y++) { const w = 4 + Math.round(Math.sin(y * 0.7) * 2); p.hline(8 - w, 7 + w, y, y % 3 ? BF.b : BF.l); }
    p.vline(8, 4, 20, BF.w); p.set(5, 8, BF.d); p.set(11, 14, BF.d);
  }],
  [T.C8B_GEYSER]: [12, 24, (p) => {
    for (let y = 0; y < 24; y++) { p.hline(2, 9, y, y % 3 ? BF.b : BF.l); p.set(2, y, BF.d); p.set(9, y, BF.d); }
    p.vline(6, 0, 22, BF.w);
    p.ellipse(6, 22, 5, 2, BF.d);
  }],
};
// たてた ものでも 色を かえない（青い 火・貝の 色）
export const C8B_PROPS_KEEP = new Set([T.C8B_BRAZIER_ON, T.C8B_SHELLBOX, T.C8B_FLAMEWALL, T.C8B_GEYSER, T.C8B_SHELLDOOR]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C8B_THEMES = {
  // 千年前の よみの海底神殿: 深い 海の 青い 石と 青い 火・白い 貝の かざり
  c8b_abyss: {
    floor: G([0, '#06101e'], [0.3, '#1e3a5a'], [0.6, '#5a88b0'], [1, '#e8f6ff']),
    wall: G([0, '#040a16'], [0.3, '#16304e'], [0.6, '#3a6a98'], [1, '#d8f0ff']),
    water: G([0, '#04142a'], [0.5, '#2a6ab0'], [1, '#c8ecff']),
    gem: G([0, '#0a2040'], [0.5, '#5ac0f0'], [1, '#ffffff']),
    flame: G([0, '#0a3a7a'], [0.5, '#5ac8ff'], [1, '#f0fcff']),
  },
};
