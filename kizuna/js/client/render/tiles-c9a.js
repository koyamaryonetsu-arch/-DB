// 第3部 第1章 第1幕「星ふるえの夜」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c8r.js が まぜる
// ・光る こけ（407。光って いるかは 光の輪の 絵 client/c9a-light.js が 上に かさねる）/ 光の みなもと（408。3コマ）/
//   とびらの 水しょう（409 光って いない・410 光った）/ 光の とびら（411）/ 見えない 穴（412。光が とどいた 時だけ client/c9a-light.js が かく）
// ・たおれた 木（413）/ 光る かけら（414。3コマ）/ ながれ星の 石（415。3コマ）/ くぼ地の ゆか（416）/ 職人の テント（417）
// ・黒板（418）/ 黒板の とびら（419）/ こおった とびら（420）/ 井戸の ひも（421）/ ためしの とびら（422）/ 星の音さの 台（423）
// ・祭りの ちょうちん（424 火が ない・425 火が ともった。2コマ）/ くぼ地の ふち（426。焼けた 土の もり上がり）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=f8927db0fd05';
import { prand } from './pixel.js?v=f8927db0fd05';
// 第91回 A班: 第3部 第1章 第2幕の タイル（render/tiles-c9b.js。ここで まぜる）
import { C9B_PAINTERS, C9B_FRAMES, C9B_SPEED, C9B_FLOOR_H, c9bBlockSpec, C9B_PROPS, C9B_PROPS_KEEP, C9B_THEMES } from './tiles-c9b.js?v=f8927db0fd05';
// 第92回 A班: 第3部 第1章 第3幕の タイル（render/tiles-c9c.js。ここで まぜる）
import { C9C_PAINTERS, C9C_FRAMES, C9C_SPEED, C9C_FLOOR_H, c9cBlockSpec, C9C_PROPS, C9C_PROPS_KEEP, C9C_THEMES } from './tiles-c9c.js?v=f8927db0fd05';
// 第93回 A班: 第3部 第1章 第4幕の タイル（render/tiles-c9d.js。ここで まぜる）
import { C9D_PAINTERS, C9D_FRAMES, C9D_SPEED, C9D_FLOOR_H, c9dBlockSpec, C9D_PROPS, C9D_PROPS_KEEP, C9D_THEMES } from './tiles-c9d.js?v=f8927db0fd05';
// 第94回 A班: 第3部 第2章 第1幕の タイル（render/tiles-c10a.js。ここで まぜる）
import { C10A_PAINTERS, C10A_FRAMES, C10A_SPEED, C10A_FLOOR_H, c10aBlockSpec, C10A_PROPS, C10A_PROPS_KEEP, C10A_THEMES } from './tiles-c10a.js?v=f8927db0fd05';
// 第95回 A班: 第3部 第2章 第2幕の タイル（render/tiles-c10b.js。ここで まぜる）
import { C10B_PAINTERS, C10B_FRAMES, C10B_SPEED, C10B_FLOOR_H, c10bBlockSpec, C10B_PROPS, C10B_PROPS_KEEP, C10B_THEMES } from './tiles-c10b.js?v=f8927db0fd05';
import { C10C_PAINTERS, C10C_FRAMES, C10C_SPEED, C10C_FLOOR_H, c10cBlockSpec, C10C_PROPS, C10C_PROPS_KEEP, C10C_THEMES } from './tiles-c10c.js?v=f8927db0fd05';
// 第99回 A班: 第3部 第2章 第4幕（render/tiles-c10d.js）
import { C10D_PAINTERS, C10D_FRAMES, C10D_SPEED, C10D_FLOOR_H, c10dBlockSpec, C10D_PROPS, C10D_PROPS_KEEP, C10D_THEMES } from './tiles-c10d.js?v=f8927db0fd05';
// 第100回 A班: 第3部 第3章 第1幕（render/tiles-c11a.js）
import { C11A_PAINTERS, C11A_FRAMES, C11A_SPEED, C11A_FLOOR_H, c11aBlockSpec, C11A_PROPS, C11A_PROPS_KEEP, C11A_THEMES } from './tiles-c11a.js?v=f8927db0fd05';
// 第102回 A班: 第3部 第3章 第2幕（render/tiles-c11b.js）
import { C11B_PAINTERS, C11B_FRAMES, C11B_SPEED, C11B_FLOOR_H, c11bBlockSpec, C11B_PROPS, C11B_PROPS_KEEP, C11B_THEMES } from './tiles-c11b.js?v=f8927db0fd05';
// 第103回 A班: 第3部 第3章 第3幕（render/tiles-c11c.js）
import { C11C_PAINTERS, C11C_FRAMES, C11C_SPEED, C11C_FLOOR_H, c11cBlockSpec, C11C_PROPS, C11C_PROPS_KEEP, C11C_THEMES } from './tiles-c11c.js?v=f8927db0fd05';

const ST = { d: '#1a1a2a', b: '#2c2c44', l: '#44466a', hl: '#6a6c98', ln: '#10101c' }; // 地下道の 石
const MS = { d: '#1c3a2c', b: '#2e5a40', l: '#4a8a5a', hl: '#7ac08a' }; // こけ
const CY = { d: '#2a6a9a', b: '#6ac8f0', l: '#bff0ff', w: '#ffffff' }; // 光る 水しょう
const DK = { d: '#2a2a40', b: '#4a4a6a', l: '#6a6a90' }; // 光って いない 水しょう
const WD = { d: '#3a2414', b: '#6a4426', l: '#9a6a3a', hl: '#c89a5a' }; // 木
const GD = { d: '#8a6a20', b: '#e0b040', l: '#fff0a0', w: '#fffcf0' }; // 金・星の 光
const CR = { d: '#3a2c22', b: '#5a4636', l: '#7a6450', hl: '#a08468' }; // 焼けた 土

function stone(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 17 + 3);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), ST.d);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), ST.l);
}
function paintMoss(p, v) {
  stone(p, v);
  const r = prand(v * 23 + 9);
  for (let i = 0; i < 6; i++) {
    const x = 2 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 12);
    p.ellipse(x, y, 2, 1.5, i % 2 ? MS.b : MS.d);
    p.set(x, y - 1, MS.l);
  }
  p.set(7, 8, MS.hl); p.set(10, 5, MS.hl);
}
export const SOURCE_FRAMES9A = 3;
function crystalShape(p, c, k = 0) {
  // まん中の 大きな 柱と 左右の 小さな 柱
  for (let y = 2; y < 15; y++) { const w = y < 5 ? y - 2 : 2; p.hline(8 - w, 8 + w, y, c.b); }
  p.vline(7, 4, 14, c.l); p.vline(9, 6, 14, c.d);
  for (let y = 7; y < 15; y++) { const w = y < 9 ? y - 7 : 1; p.hline(3 - w, 3 + w, y, c.b); p.hline(13 - w, 13 + w, y, c.b); }
  p.vline(3, 9, 14, c.l); p.vline(13, 9, 14, c.d);
  if (c.w) { p.set(7, 3 + (k % 3), c.w); p.set(3, 10 + (k % 2), c.w); p.set(13, 11 - (k % 2), c.w); }
}
function paintSource(p, v, f) {
  stone(p, v);
  const k = f % SOURCE_FRAMES9A;
  p.ellipse(8, 14, 7, 2, ST.d);
  crystalShape(p, CY, k);
  if (k === 1) { p.set(1, 3, CY.w); p.set(14, 2, CY.l); }
  if (k === 2) { p.set(2, 1, CY.l); p.set(12, 4, CY.w); }
}
function paintCrystal(p, v, on, f = 0) {
  stone(p, v);
  p.ellipse(8, 14, 5, 1.5, ST.d);
  const c = on ? CY : { ...DK, w: null };
  for (let y = 3; y < 15; y++) { const w = y < 6 ? y - 3 : 2; p.hline(8 - w, 8 + w, y, c.b); }
  p.vline(7, 5, 14, c.l); p.vline(10, 7, 14, c.d);
  if (on) { p.set(7, 4 + (f % 2), CY.w); p.set(9, 9, CY.w); }
}
function paintDoor(p, v) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(1, 1, 14, 15, '#2a2a50');
  p.vline(8, 1, 15, ST.ln);
  p.hline(1, 14, 1, ST.hl);
  // 星の わ
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    p.set(Math.round(8 + Math.cos(a) * 4), Math.round(8 + Math.sin(a) * 4), i % 2 ? DK.l : '#8a8ad8');
  }
  p.set(8, 8, '#8a8ad8');
}
function paintHole(p, v) {
  stone(p, v);
  p.ellipse(8, 9, 6, 4.5, '#06060c');
  p.ellipse(8, 8, 5, 3, '#000000');
  p.hline(3, 12, 5, ST.l);
}
function paintLog(p, v) {
  p.rect(0, 0, 16, 16, '#2a4a24');
  const r = prand(v * 11 + 1);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a6a2e');
  // よこに たおれた 木
  p.rect(0, 5, 16, 7, WD.b);
  p.hline(0, 15, 5, WD.l); p.hline(0, 15, 11, WD.d);
  for (let x = 2; x < 16; x += 5) p.vline(x, 6, 10, WD.d);
  p.ellipse(13, 8, 2.5, 3, WD.hl); p.ellipse(13, 8, 1.5, 2, WD.l); p.set(13, 8, WD.d);
  p.set(4, 4, '#3a8a3a'); p.set(9, 3, '#3a8a3a'); p.set(5, 3, '#2a6a2a');
}
export const SHARD_FRAMES9A = 3;
function paintShard(p, v, f) {
  p.rect(0, 0, 16, 16, '#4a3a22');
  const r = prand(v * 7 + 5);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#5a4a2c');
  const k = f % SHARD_FRAMES9A;
  // 星の かけら（とがった 小さな 石が 光る）
  p.ellipse(8, 10, 3, 1.2, '#2a2014');
  for (let y = 4; y < 11; y++) { const w = Math.max(0, Math.round((y - 4) / 2)); p.hline(8 - w, 8 + w, y, GD.b); }
  p.vline(8, 5, 9, GD.l); p.set(8, 4, GD.w);
  const tw = [[3, 3], [13, 5], [4, 12]][k];
  p.set(tw[0], tw[1], GD.w); p.set(tw[0] + 1, tw[1], GD.l);
}
export const ROCK_FRAMES9A = 3;
function paintStarRock(p, v, f) {
  p.rect(0, 0, 16, 16, CR.b);
  const k = f % ROCK_FRAMES9A;
  p.ellipse(8, 13, 7, 2.5, CR.d);
  p.ellipse(8, 9, 6, 5, '#5a5468');
  p.ellipse(7, 8, 4.5, 3.5, '#8a84a0');
  p.ellipse(6, 7, 2, 1.5, '#c8c4e0');
  // 石の 中の 光
  p.set(9, 10, GD.b); p.set(10, 9, GD.l); p.set(5, 10, GD.b);
  p.set(...[[2, 2], [13, 3], [12, 1]][k], GD.w);
}
// くぼ地の ゆか: 焼けて 黒っぽい 土・ひびわれ・はい・ちいさな 星の かけら
function paintCrater(p, v) {
  p.rect(0, 0, 16, 16, CR.d);
  const r = prand(v * 19 + 2);
  for (let i = 0; i < 6; i++) p.ellipse(Math.floor(r() * 16), Math.floor(r() * 16), 2, 1, CR.b);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#1e140c');
  // ひびわれ（ななめに のびる）
  let x = Math.floor(r() * 10) + 3, y = Math.floor(r() * 6) + 2;
  for (let i = 0; i < 6; i++) { p.set(x, y, '#140c06'); x += r() < 0.5 ? 1 : 0; y += 1; }
  // はい（白っぽい）
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#8a8070');
  // 小さな かけら
  if (v % 2 === 0) { const a = 3 + Math.floor(r() * 10), b = 3 + Math.floor(r() * 10); p.set(a, b, GD.b); p.set(a, b - 1, GD.l); }
}
// くぼ地の ふち: もり上がった 焼けた 土（上が 明るい。こげた あと・まだ あつい 赤い 火の こ）
function paintRim(p, v) {
  p.rect(0, 0, 16, 16, '#2e2018');
  const r = prand(v * 29 + 11);
  for (let y = 0; y < 16; y++) {
    const top = 3 + Math.round(Math.sin((y + v) * 0.9) * 1.5);
    p.hline(top, 15 - top, y, y < 8 ? CR.b : CR.d);
  }
  p.hline(2, 13, 2, CR.l); p.hline(4, 11, 1, CR.hl);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), 3 + Math.floor(r() * 13), '#160e08');
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#7a6a5a');
  if (v % 2 === 1) { p.set(4 + Math.floor(r() * 8), 9 + Math.floor(r() * 5), '#e0703a'); }
  p.hline(0, 15, 15, '#1a120c');
}
// 職人の テント（しまの ぬの・入口から あたたかい 明かり・てっぺんに 小さな 旗）
const TENT9A = [['#e8d0a0', '#c8a870'], ['#e88a7a', '#f4e0c8'], ['#8aaad8', '#f0f0f8']];
function paintTent(p, v) {
  p.rect(0, 0, 16, 16, '#3a5a2a');
  const [a, b] = TENT9A[v % 3];
  p.ellipse(8, 15, 7, 1.2, '#1e2e14');
  for (let y = 3; y < 15; y++) { const w = Math.round((y - 3) * 0.6); for (let x = 8 - w; x <= 8 + w; x++) p.set(x, y, ((x + 16) >> 1) % 2 ? a : b); }
  p.vline(8, 0, 3, '#5a3a20'); p.hline(9, 11, 0, '#e04a3a'); p.set(9, 1, '#e04a3a');
  for (let y = 9; y < 15; y++) { const w = Math.round((y - 9) * 0.5); p.hline(8 - w, 8 + w, y, '#ffcf6a'); }
  p.set(8, 12, '#fff4c0');
  p.set(1, 14, '#5a3a20'); p.set(15, 14, '#5a3a20');
}
function paintBoard(p, v) {
  stone(p, v);
  p.rect(1, 3, 14, 10, WD.b);
  p.rect(2, 4, 12, 8, '#2a4a3a');
  // チョークの 字
  p.hline(3, 6, 6, '#e8f0e8'); p.hline(8, 12, 6, '#e8f0e8'); p.hline(4, 10, 9, '#e8f0e8'); p.set(12, 9, '#f0e080');
  p.hline(2, 13, 12, WD.d); p.rect(5, 12, 2, 1, '#ffffff');
}
function paintChalkDoor(p) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(1, 1, 14, 15, '#2a4a3a');
  p.rect(1, 1, 14, 1, WD.l);
  p.hline(3, 7, 5, '#e8f0e8'); p.hline(3, 9, 8, '#e8f0e8'); p.set(11, 8, '#f0e080'); p.hline(4, 6, 11, '#e8f0e8');
  p.vline(1, 1, 15, WD.d); p.vline(14, 1, 15, WD.d);
}
function paintIceDoor(p) {
  p.rect(0, 0, 16, 16, '#5a8aa8');
  p.rect(1, 1, 14, 15, '#a8e0f8');
  for (let i = 0; i < 6; i++) p.vline(2 + i * 2, 1 + (i % 3), 6 + (i % 2) * 3, '#e8fcff');
  p.hline(1, 14, 15, '#7ab8d8'); p.set(5, 10, '#ffffff'); p.set(11, 12, '#ffffff');
}
function paintRope(p, v) {
  stone(p, v);
  p.ellipse(8, 13, 4, 1.5, ST.d);
  for (let y = 0; y < 14; y++) p.set(8 + (y % 4 === 1 ? 1 : 0), y, y % 2 ? '#c8a870' : '#a8884a');
  p.ellipse(8, 13, 2, 1, '#c8a870');
}
function paintTrialDoor(p) {
  p.rect(0, 0, 16, 16, '#3a342c');
  p.rect(1, 1, 14, 15, '#6a5a4a');
  p.vline(8, 1, 15, '#3a342c');
  // ふくろうの もよう
  p.ellipse(8, 7, 4, 4, '#8a7a6a');
  p.ellipse(6, 6, 1.5, 1.5, GD.b); p.ellipse(10, 6, 1.5, 1.5, GD.b);
  p.set(6, 6, '#2a2014'); p.set(10, 6, '#2a2014');
  p.set(8, 8, '#c89a4a'); p.hline(5, 11, 11, '#8a7a6a');
}
function paintPedestal(p, v) {
  stone(p, v);
  p.rect(4, 8, 8, 7, ST.l); p.hline(3, 12, 8, ST.hl); p.hline(3, 12, 14, ST.ln);
  // 金の 音さ
  p.vline(6, 2, 6, GD.b); p.vline(10, 2, 6, GD.b); p.hline(6, 10, 6, GD.b); p.vline(8, 6, 8, GD.l); p.set(6, 2, GD.w); p.set(10, 2, GD.w);
}
export const LANTERN_FRAMES9A = 2;
function paintLantern(p, v, on, f = 0) {
  p.rect(0, 0, 16, 16, '#4a8a3a');
  const r = prand(v * 5 + 3);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#3a7a2e');
  p.vline(8, 4, 15, WD.d); p.hline(5, 11, 3, WD.d);
  const c = on ? (f % 2 ? '#ffd86a' : '#ffb84a') : '#a8584a';
  p.ellipse(8, 8, 3, 3.5, c);
  p.hline(6, 10, 5, on ? '#fff0b0' : '#c87a6a');
  p.hline(6, 10, 11, '#5a2a1a');
  if (on) { p.set(8, 8, '#fffcf0'); p.set(7, 7, '#fff4c0'); }
}

export const C9A_PAINTERS = {
  [T.C9A_MOSS]: (p, v) => paintMoss(p, v),
  [T.C9A_SOURCE]: (p, v, f) => paintSource(p, v, f),
  [T.C9A_CRYSTAL]: (p, v) => paintCrystal(p, v, false),
  [T.C9A_CRYSTAL_ON]: (p, v, f) => paintCrystal(p, v, true, f),
  [T.C9A_DOOR]: (p, v) => paintDoor(p, v),
  [T.C9A_HOLE]: (p, v) => paintHole(p, v),
  [T.C9A_LOG]: (p, v) => paintLog(p, v),
  [T.C9A_SHARD]: (p, v, f) => paintShard(p, v, f),
  [T.C9A_STARROCK]: (p, v, f) => paintStarRock(p, v, f),
  [T.C9A_CRATER]: (p, v) => paintCrater(p, v),
  [T.C9A_TENT]: (p, v) => paintTent(p, v),
  [T.C9A_RIM]: (p, v) => paintRim(p, v),
  [T.C9A_BOARD]: (p, v) => paintBoard(p, v),
  [T.C9A_CHALKDOOR]: (p) => paintChalkDoor(p),
  [T.C9A_ICEDOOR]: (p) => paintIceDoor(p),
  [T.C9A_ROPE]: (p, v) => paintRope(p, v),
  [T.C9A_TRIALDOOR]: (p) => paintTrialDoor(p),
  [T.C9A_PEDESTAL]: (p, v) => paintPedestal(p, v),
  [T.C9A_LANTERN]: (p, v) => paintLantern(p, v, false),
  [T.C9A_LANTERN_ON]: (p, v, f) => paintLantern(p, v, true, f),
  ...C9B_PAINTERS,
  ...C9C_PAINTERS,
  ...C9D_PAINTERS,
  ...C10A_PAINTERS,
  ...C10B_PAINTERS,
  ...C10C_PAINTERS,
  ...C10D_PAINTERS,
  ...C11A_PAINTERS,
  ...C11B_PAINTERS,
  ...C11C_PAINTERS,
};
export const C9A_FRAMES = {
  [T.C9A_SOURCE]: SOURCE_FRAMES9A, [T.C9A_CRYSTAL_ON]: 2, [T.C9A_SHARD]: SHARD_FRAMES9A, [T.C9A_STARROCK]: ROCK_FRAMES9A, [T.C9A_LANTERN_ON]: LANTERN_FRAMES9A, ...C9B_FRAMES, ...C9C_FRAMES, ...C9D_FRAMES, ...C10A_FRAMES, ...C10B_FRAMES, ...C10C_FRAMES, ...C10D_FRAMES, ...C11A_FRAMES, ...C11B_FRAMES, ...C11C_FRAMES,
};
export const C9A_SPEED = {
  [T.C9A_SOURCE]: 260, [T.C9A_CRYSTAL_ON]: 400, [T.C9A_SHARD]: 220, [T.C9A_STARROCK]: 320, [T.C9A_LANTERN_ON]: 300, ...C9B_SPEED, ...C9C_SPEED, ...C9D_SPEED, ...C10A_SPEED, ...C10B_SPEED, ...C10C_SPEED, ...C10D_SPEED, ...C11A_SPEED, ...C11B_SPEED, ...C11C_SPEED,
};

// ───── 2.5D ─────
// くぼ地の ゆかは 少し ひくい。とびら 4つは かべ（洞窟の かべと おなじ 高さ）。たおれた 木は ひくい ブロック。
// みなもと・水しょう・ながれ星の 石・テント・黒板・音さの 台・ちょうちんは たてた もの
export const C9A_FLOOR_H = { [T.C9A_CRATER]: -0.16, [T.C9A_MOSS]: -0.01, ...C9B_FLOOR_H, ...C9C_FLOOR_H, ...C9D_FLOOR_H, ...C10A_FLOOR_H, ...C10B_FLOOR_H, ...C10C_FLOOR_H, ...C10D_FLOOR_H, ...C11A_FLOOR_H, ...C11B_FLOOR_H, ...C11C_FLOOR_H };
export function c9aBlockSpec(id, v) {
  switch (id) {
    case T.C9A_DOOR: case T.C9A_CHALKDOOR: case T.C9A_ICEDOOR: case T.C9A_TRIALDOOR:
      return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', id, 0, 0] };
    case T.C9A_LOG: return { h: 0.55, top: ['t', T.C9A_LOG, v, 0], side: ['t', T.C9A_LOG, v, 0] };
    case T.C9A_RIM: return { h: 0.42, top: ['t', T.C9A_RIM, v, 0], side: ['t', T.C9A_RIM, v, 0] }; // くぼ地の ふち（ひくい 土の もり上がり）
    default: return c9bBlockSpec(id, v) || c9cBlockSpec(id, v) || c9dBlockSpec(id, v) || c10aBlockSpec(id, v) || c10bBlockSpec(id, v) || c10cBlockSpec(id, v) || c10dBlockSpec(id, v) || c11aBlockSpec(id, v) || c11bBlockSpec(id, v) || c11cBlockSpec(id, v);
  }
}
const crystalProp = (c, h = 24) => [16, h, (p) => {
  p.ellipse(8, h - 2, 6, 1.5, '#06060c');
  for (let y = 2; y < h - 1; y++) { const w = y < 6 ? (y - 2) / 1.4 : 3; p.hline(Math.round(8 - w), Math.round(8 + w), y, c.b); }
  p.vline(7, 4, h - 2, c.l); p.vline(10, 7, h - 2, c.d);
  for (let y = h - 10; y < h - 1; y++) { p.hline(2, 4, y, c.b); p.hline(12, 14, y, c.b); }
  p.vline(3, h - 10, h - 2, c.l);
  if (c.w) { p.set(7, 3, c.w); p.set(8, 9, c.w); p.set(3, h - 8, c.w); }
}];
const lanternProp = (on) => [10, 22, (p) => {
  p.vline(5, 6, 21, WD.d); p.hline(1, 9, 5, WD.d);
  p.ellipse(5, 11, 3, 4, on ? '#ffc85a' : '#a8584a');
  p.hline(3, 7, 8, on ? '#fff0b0' : '#c87a6a'); p.hline(3, 7, 14, '#5a2a1a');
  if (on) { p.set(5, 11, '#fffcf0'); p.set(4, 10, '#fff4c0'); }
}];
export const C9A_PROPS = {
  [T.C9A_SOURCE]: crystalProp(CY, 26),
  [T.C9A_CRYSTAL]: crystalProp({ ...DK, w: null }, 20),
  [T.C9A_CRYSTAL_ON]: crystalProp(CY, 20),
  [T.C9A_STARROCK]: [16, 16, (p) => {
    p.ellipse(8, 13, 7, 2.5, '#2a2014');
    p.ellipse(8, 9, 6, 5, '#5a5468'); p.ellipse(7, 8, 4.5, 3.5, '#8a84a0'); p.ellipse(6, 7, 2, 1.5, '#c8c4e0');
    p.set(9, 10, GD.b); p.set(10, 9, GD.l); p.set(5, 10, GD.b); p.set(12, 3, GD.w);
  }],
  [T.C9A_TENT]: [26, 26, (p, v = 0) => {
    const [a, b] = TENT9A[v % 3];
    p.ellipse(13, 24, 12, 2, '#14200e');
    for (let y = 5; y < 24; y++) { const w = Math.round((y - 5) * 0.62); for (let x = 13 - w; x <= 13 + w; x++) p.set(x, y, ((x + 26) >> 1) % 2 ? a : b); }
    p.vline(13, 0, 5, '#5a3a20'); p.rect(14, 0, 5, 3, '#e04a3a'); p.set(18, 3, '#e04a3a');
    for (let y = 14; y < 24; y++) { const w = Math.round((y - 14) * 0.55); p.hline(13 - w, 13 + w, y, '#ffcf6a'); }
    p.vline(13, 15, 23, '#fff4c0'); p.hline(11, 15, 22, '#fff4c0');
    p.vline(1, 20, 24, '#5a3a20'); p.vline(25, 20, 24, '#5a3a20');
    for (let i = 0; i < 6; i++) { p.set(2 + i, 19 + Math.floor(i / 2), '#a89070'); p.set(24 - i, 19 + Math.floor(i / 2), '#a89070'); }
  }],
  [T.C9A_BOARD]: [16, 16, (p) => {
    p.rect(1, 2, 14, 10, WD.b); p.rect(2, 3, 12, 8, '#2a4a3a');
    p.hline(3, 6, 5, '#e8f0e8'); p.hline(8, 12, 5, '#e8f0e8'); p.hline(4, 10, 8, '#e8f0e8');
    p.vline(3, 12, 15, WD.d); p.vline(12, 12, 15, WD.d);
  }],
  [T.C9A_PEDESTAL]: [12, 16, (p) => {
    p.rect(2, 8, 8, 7, ST.l); p.hline(1, 10, 8, ST.hl); p.hline(1, 10, 15, ST.ln);
    p.vline(4, 1, 5, GD.b); p.vline(8, 1, 5, GD.b); p.hline(4, 8, 5, GD.b); p.vline(6, 5, 7, GD.l); p.set(4, 1, GD.w); p.set(8, 1, GD.w);
  }],
  [T.C9A_LANTERN]: lanternProp(false),
  [T.C9A_LANTERN_ON]: lanternProp(true),
  ...C9B_PROPS,
  ...C9C_PROPS,
  ...C9D_PROPS,
  ...C10A_PROPS,
  ...C10B_PROPS,
  ...C10C_PROPS,
  ...C10D_PROPS,
  ...C11A_PROPS,
  ...C11B_PROPS,
  ...C11C_PROPS,
};
// たてた ものでも 色を かえない
export const C9A_PROPS_KEEP = new Set([T.C9A_SOURCE, T.C9A_CRYSTAL, T.C9A_CRYSTAL_ON, T.C9A_STARROCK, T.C9A_TENT, T.C9A_BOARD, T.C9A_PEDESTAL, T.C9A_LANTERN, T.C9A_LANTERN_ON, ...C9B_PROPS_KEEP, ...C9C_PROPS_KEEP, ...C9D_PROPS_KEEP, ...C10A_PROPS_KEEP, ...C10B_PROPS_KEEP, ...C10C_PROPS_KEEP, ...C10D_PROPS_KEEP, ...C11A_PROPS_KEEP, ...C11B_PROPS_KEEP, ...C11C_PROPS_KEEP]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C9A_THEMES = {
  // 星の石の地下道: 青むらさきの 石と 水しょうの 光
  c9a_cave: {
    floor: G([0, '#08081a'], [0.3, '#22244a'], [0.6, '#545a90'], [1, '#e4ecff']),
    wall: G([0, '#05050f'], [0.3, '#1a1a38'], [0.6, '#40467a'], [1, '#d8e0ff']),
    water: G([0, '#0a1a3a'], [0.5, '#3a8ac8'], [1, '#e0f8ff']),
    gem: G([0, '#0a2a4a'], [0.5, '#6ac8f0'], [1, '#ffffff']),
    flame: G([0, '#1a2a5a'], [0.5, '#8ac8ff'], [1, '#f4fcff']),
  },
  // 星ふるえの森・ながれ星のくぼ地: 星の 光が まじった 深い みどり
  c9a_forest: {
    floor: G([0, '#0e1a10'], [0.3, '#2e4a2a'], [0.6, '#6a8a50'], [1, '#f0f8d8']),
    wall: G([0, '#0a140c'], [0.3, '#1e3a24'], [0.6, '#4a7a4a'], [1, '#e0f4d8']),
    water: G([0, '#0a2a3a'], [0.5, '#4a9ab8'], [1, '#e0f8ff']),
    gem: G([0, '#3a2a08'], [0.5, '#f0c850'], [1, '#fffcf0']),
    flame: G([0, '#4a2a0a'], [0.5, '#f0b050'], [1, '#fff8e0']),
  },
  ...C9B_THEMES,
  ...C9C_THEMES,
  ...C9D_THEMES,
  ...C10A_THEMES,
  ...C10B_THEMES,
  ...C10C_THEMES,
  ...C10D_THEMES,
  ...C11A_THEMES,
  ...C11B_THEMES,
  ...C11C_THEMES,
};
