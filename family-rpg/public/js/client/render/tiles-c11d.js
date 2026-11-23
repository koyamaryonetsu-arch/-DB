// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）
// ・王宮（白い 石・金の ふち）: ゆか（741）/ かべ（742）/ じゅうたん（743）/ 柱（744）/ 階段（上 745・下 746）/ 光の はかり（747。2コマ）
// ・星座の 間: 夜の ガラス（748。2コマ）/ 星（749。2コマ）/ 星座の とびら（750・開いた 751。2コマ）
// ・月かげの 間: おもての ゆか（752）・かべ（753）/ うらの ゆか（754）・かべ（755）… 月かげの 戸・光の ゆかは 第2幕の タイル
// ・かげの 間: ゆか（756）・かべ（757）… かげの 台・光の さくは 第3幕の タイル
// ・音の 間: 7色の 音の 台（758〜764）/ かべの 歌の 絵（765）/ いずみ（766。2コマ）/ 音の とびら（767・開いた 768。2コマ）
// ・玉座の 間: 玉座（769）/ 星の海の まど（770。2コマ）
// ・光の のぼり台（771。2コマ）/ 月の都: アルゴルの ランプ（772。2コマ）・開いた はかりの門（773）・星の橋の はし（774。2コマ）
// どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js';
import { prand } from './pixel.js';

const GOLD = { d: '#a8801e', b: '#e8c040', l: '#ffe070', hl: '#fff8c8' };
// 音の 台の 色（くぼ地の 台の ならび … 赤・金・黄・緑・青・白・むらさき）
export const PAD_COLORS11D = [['#ff6a6a', '#ffd0d0'], ['#e8b030', '#fff0b0'], ['#ffe050', '#fff8c8'], ['#5ad870', '#c8f8d0'], ['#5a8aff', '#c8d8ff'], ['#e8ecf8', '#ffffff'], ['#b070f0', '#e8d0ff']];

function floor(p, v) {
  p.rect(0, 0, 16, 16, '#e8e0f0');
  p.hline(0, 15, 15, '#c8c0d8'); p.vline(15, 0, 15, '#c8c0d8');
  p.hline(0, 15, 0, '#f8f4ff'); p.vline(0, 0, 15, '#f8f4ff');
  const r = prand(v * 13 + 7);
  if (v % 5 === 0) { p.set(7, 7, GOLD.b); p.set(8, 8, GOLD.b); p.set(7, 8, GOLD.l); p.set(8, 7, GOLD.l); } // 小さな 星の もよう
  else if (v % 3 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, '#d8d0e8');
}
function wall(p, v) {
  p.rect(0, 0, 16, 16, '#3a3458');
  p.hline(0, 15, 0, '#6a6290');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#2a2444');
  for (let y = 0; y < 16; y += 4) p.vline(((y / 4 + v) % 2) * 8 + 3, y + 1, y + 3, '#2a2444');
  if (v % 4 === 1) { p.hline(6, 9, 2, GOLD.d); p.set(7, 1, GOLD.b); }
}
function carpet(p, v) {
  p.rect(0, 0, 16, 16, '#c8a8e8');
  p.vline(v % 2 ? 15 : 0, 0, 15, GOLD.b);
  if (v % 3 === 0) { p.set(8, 8, '#ffffff'); p.set(7, 8, GOLD.l); p.set(9, 8, GOLD.l); }
}
function pillar(p) {
  floor(p, 1);
  p.rect(3, 0, 10, 16, '#c8c0e0'); p.vline(4, 0, 15, '#f0ecff'); p.vline(11, 0, 15, '#8a82a8');
  p.hline(2, 13, 0, GOLD.b); p.hline(2, 13, 15, GOLD.b);
}
function stairs(p, up) {
  p.rect(0, 0, 16, 16, up ? '#c8c0e0' : '#6a6290');
  for (let i = 0; i < 4; i++) { p.rect(2, 2 + i * 3, 12, 2, up ? '#ffffff' : '#a8a0c8'); p.hline(2, 13, 4 + i * 3, up ? GOLD.l : '#4a4470'); }
}
export const SCALE_FRAMES11D = 2;
function scale(p, v, f) {
  floor(p, 2);
  // 光の はかり（2×2 マスで 1つ。左上 v%2・右上 … 同じ 絵を くりかえす）
  p.rect(7, 0, 2, 16, GOLD.b); p.vline(7, 0, 15, GOLD.hl);
  p.hline(0, 15, 3, GOLD.b); p.hline(0, 15, 4, GOLD.d);
  p.ellipse(3, 10 + f, 3, 1.5, f ? '#fff8c8' : GOLD.l); p.vline(3, 4, 9 + f, GOLD.d);
  p.ellipse(12, 11 - f, 3, 1.5, f ? GOLD.l : '#fff8c8'); p.vline(12, 4, 10 - f, GOLD.d);
  p.set(8, 2, '#ffffff');
}
export const VOID_FRAMES11D = 2;
function voidGlass(p, v, f) {
  p.rect(0, 0, 16, 16, '#0c0a24');
  const r = prand(v * 19 + 1);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), (i + f) % 2 ? '#5a5aa8' : '#2a2a5a');
  if (v % 4 === f) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#ffffff');
}
export const STAR_FRAMES11D = 2;
function star(p, v, f) {
  voidGlass(p, v, 0);
  p.ellipse(8, 8, 5, 5, '#2a2a5a');
  p.ellipse(8, 8, 3.5, 3.5, f ? '#fff0a0' : '#ffe070');
  p.vline(8, 2 - f, 14 + f, '#fff8c8'); p.hline(2 - f, 14 + f, 8, '#fff8c8');
  p.set(8, 8, '#ffffff');
}
function conDoor(p, v) {
  p.rect(0, 0, 16, 16, '#4a4878');
  p.rect(2, 1, 12, 15, '#2a2850');
  for (const [x, y] of [[5, 4], [10, 5], [7, 9], [11, 11], [4, 12]]) p.set(x, y, '#8a88c8');
  p.vline(2, 1, 15, GOLD.d); p.vline(13, 1, 15, GOLD.d); p.hline(2, 13, 1, GOLD.d);
}
export const CONDOOR_FRAMES11D = 2;
function conDoorOpen(p, v, f) {
  p.rect(0, 0, 16, 16, '#4a4878');
  p.rect(2, 1, 12, 15, f ? '#fff8c0' : '#fff0a0');
  for (let i = 0; i < 4; i++) p.rect(4, 3 + i * 3, 8, 1, GOLD.l);
  p.vline(2, 1, 15, GOLD.b); p.vline(13, 1, 15, GOLD.b); p.hline(2, 13, 1, GOLD.b);
}
// 月かげの 間（おもて … 白い 月の 光の 石 ／ うら … 暗い あたたかい 石）
function moonF(p, v) {
  p.rect(0, 0, 16, 16, '#d8dcf8');
  p.hline(0, 15, 15, '#b8bce0'); p.vline(15, 0, 15, '#b8bce0');
  if (v % 4 === 0) { p.set(6, 6, '#a8b0e8'); p.set(7, 5, '#a8b0e8'); p.set(7, 7, '#a8b0e8'); } // 三日月の もよう
}
function moonWallF(p, v) {
  p.rect(0, 0, 16, 16, '#4a5088');
  p.hline(0, 15, 0, '#7a80b8');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#3a4070');
  if (v % 3 === 0) p.set(8, 2, '#d8dcf8');
}
function moonB(p, v) {
  p.rect(0, 0, 16, 16, '#5a3a4a');
  p.hline(0, 15, 15, '#4a2a3a'); p.vline(15, 0, 15, '#4a2a3a');
  if (v % 4 === 2) p.set(8, 8, '#8a5a4a');
}
function moonWallB(p, v) {
  p.rect(0, 0, 16, 16, '#1a0c14');
  p.hline(0, 15, 0, '#3a2028');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#0c0408');
  if (v % 5 === 1) p.set(7, 3, '#5a3020');
}
// かげの 間
function shadowFloor(p, v) {
  p.rect(0, 0, 16, 16, '#8a7aa8');
  p.hline(0, 15, 15, '#6a5a88'); p.vline(15, 0, 15, '#6a5a88');
  p.hline(0, 15, 0, '#a89ac8'); p.vline(0, 0, 15, '#a89ac8');
  if (v % 4 === 0) p.set(5, 9, '#5a4a78');
}
function shadowWall(p, v) {
  p.rect(0, 0, 16, 16, '#2a2040');
  p.hline(0, 15, 0, '#4a3a68');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#1a1428');
  for (let y = 0; y < 16; y += 4) p.vline(((y / 4 + v) % 2) * 8 + 3, y + 1, y + 3, '#1a1428');
}
// 音の 台（i … 0〜6）
function pad(p, v, i) {
  floor(p, 1);
  const [col, hl] = PAD_COLORS11D[i];
  p.ellipse(8, 9, 7.5, 6, '#4a4470');
  p.ellipse(8, 8.5, 7, 5.5, col);
  p.ellipse(8, 8.5, 4.5, 3.4, hl);
  // 音ぷ
  p.vline(9, 5, 9, '#3a3458'); p.ellipse(7.5, 10, 1.6, 1.2, '#3a3458'); p.set(10, 5, '#3a3458'); p.set(11, 6, '#3a3458');
}
function mural(p, v) {
  wall(p, 2);
  p.rect(1, 3, 14, 11, '#f0e8d0'); p.hline(1, 14, 3, GOLD.b); p.hline(1, 14, 13, GOLD.b);
  // 歌の 絵の 五線（7色の 音ぷと じゅんの 数は client/c11d-view.js が かさねる）
  for (const y of [5, 7, 9, 11]) p.hline(1, 14, y, '#c8b890');
}
export const SPRING_FRAMES11D = 2;
function spring(p, v, f) {
  floor(p, 2);
  p.ellipse(8, 9, 7, 5, '#c8c0e0');
  p.ellipse(8, 9, 5.5, 3.5, f ? '#a8e0ff' : '#88c8f0');
  p.set(6, 8 + f, '#ffffff'); p.set(10, 10 - f, '#ffffff');
}
function soundDoor(p, v) {
  p.rect(0, 0, 16, 16, '#6a5a98');
  p.rect(1, 0, 14, 16, '#8a7ab8');
  for (let y = 3; y < 16; y += 5) p.hline(1, 14, y, '#6a5a98');
  p.ellipse(7, 10, 2, 1.5, GOLD.b); p.vline(9, 5, 10, GOLD.b);
}
export const SOUNDDOOR_FRAMES11D = 2;
function soundDoorOpen(p, v, f) {
  p.rect(0, 0, 16, 16, f ? '#ffffff' : '#fff8e0');
  p.vline(v % 2 ? 15 : 0, 0, 15, '#8a7ab8');
  for (let i = 0; i < 3; i++) p.set((v * 5 + i * 5 + f) % 16, (i * 5 + f * 3) % 16, GOLD.l);
}
function throne(p, v) {
  floor(p, 1);
  p.rect(2, 1, 12, 14, GOLD.d); p.rect(3, 2, 10, 12, GOLD.b); p.rect(5, 6, 6, 8, '#c8a8e8');
  p.set(8, 0, '#ffffff'); p.set(7, 1, GOLD.hl); p.set(9, 1, GOLD.hl);
}
export const WINDOW_FRAMES11D = 2;
function windowSea(p, v, f) {
  p.rect(0, 0, 16, 16, '#3a3458');
  p.rect(1, 1, 14, 15, '#0a1440');
  const r = prand(v * 23 + 5);
  for (let i = 0; i < 6; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), (i + f) % 3 ? '#8ab0ff' : '#ffffff');
  p.vline(8, 1, 15, GOLD.d); p.hline(1, 14, 8, GOLD.d);
}
export const LIFT_FRAMES11D = 2;
function lift(p, v, f) {
  floor(p, 1);
  p.ellipse(8, 9, 7, 5, '#a8e8ff');
  p.ellipse(8, 9, 5, 3.5, f ? '#ffffff' : '#d8f8ff');
  for (let i = 0; i < 3; i++) p.vline(4 + i * 4, 1 + ((i + f) % 2) * 2, 6, '#ffffff');
}
export const HOOK_FRAMES11D = 2;
function hookOn(p, v, f) {
  p.rect(0, 0, 16, 16, '#e8e4f8');
  p.vline(8, 0, 4, '#6a6080'); p.hline(6, 10, 4, '#6a6080');
  p.rect(5, 6, 6, 7, '#5a4a3a'); p.rect(6, 7, 4, 5, f ? '#ffe890' : '#ffd060');
  p.set(8, 9, '#ffffff');
}
function scaleGateOpen(p) {
  p.rect(0, 0, 16, 16, '#e8e4f8');
  p.vline(0, 0, 15, GOLD.b); p.vline(15, 0, 15, GOLD.b);
  p.rect(2, 0, 12, 16, '#fff8d0');
  p.hline(4, 11, 4, GOLD.d); p.vline(8, 2, 4, GOLD.d); p.set(4, 5, GOLD.d); p.set(11, 5, GOLD.d);
}
export const BRIDGE_END_FRAMES11D = 2;
const BRIDGE_COLS = ['#ff7a7a', '#ffb060', '#ffe070', '#7ae08a', '#7ab8ff', '#f4f8ff', '#c890ff', '#fff4d0'];
function bridgeEnd(p, v, f) {
  p.rect(0, 0, 16, 16, '#e8e4f8');
  for (let i = 0; i < 8; i++) p.hline(1, 14, 3 + i, BRIDGE_COLS[(i + f) % 8]);
  p.hline(1, 14, 2, '#ffffff'); p.hline(1, 14, 11, '#ffffff');
  p.set(4 + f * 6, 13, '#fff0a0');
}

export const C11D_PAINTERS = {
  [T.C11D_FLOOR]: (p, v) => floor(p, v),
  [T.C11D_WALL]: (p, v) => wall(p, v),
  [T.C11D_CARPET]: (p, v) => carpet(p, v),
  [T.C11D_PILLAR]: (p) => pillar(p),
  [T.C11D_STAIRS_UP]: (p) => stairs(p, true),
  [T.C11D_STAIRS_DOWN]: (p) => stairs(p, false),
  [T.C11D_SCALE]: (p, v, f) => scale(p, v, f),
  [T.C11D_VOID]: (p, v, f) => voidGlass(p, v, f),
  [T.C11D_STAR]: (p, v, f) => star(p, v, f),
  [T.C11D_CONDOOR]: (p, v) => conDoor(p, v),
  [T.C11D_CONDOOR_OPEN]: (p, v, f) => conDoorOpen(p, v, f),
  [T.C11D_MOON_F]: (p, v) => moonF(p, v),
  [T.C11D_MOON_WALL_F]: (p, v) => moonWallF(p, v),
  [T.C11D_MOON_B]: (p, v) => moonB(p, v),
  [T.C11D_MOON_WALL_B]: (p, v) => moonWallB(p, v),
  [T.C11D_SHADOW_FLOOR]: (p, v) => shadowFloor(p, v),
  [T.C11D_SHADOW_WALL]: (p, v) => shadowWall(p, v),
  [T.C11D_PAD_1]: (p, v) => pad(p, v, 0),
  [T.C11D_PAD_2]: (p, v) => pad(p, v, 1),
  [T.C11D_PAD_3]: (p, v) => pad(p, v, 2),
  [T.C11D_PAD_4]: (p, v) => pad(p, v, 3),
  [T.C11D_PAD_5]: (p, v) => pad(p, v, 4),
  [T.C11D_PAD_6]: (p, v) => pad(p, v, 5),
  [T.C11D_PAD_7]: (p, v) => pad(p, v, 6),
  [T.C11D_MURAL]: (p, v) => mural(p, v),
  [T.C11D_SPRING]: (p, v, f) => spring(p, v, f),
  [T.C11D_SOUNDDOOR]: (p, v) => soundDoor(p, v),
  [T.C11D_SOUNDDOOR_OPEN]: (p, v, f) => soundDoorOpen(p, v, f),
  [T.C11D_THRONE]: (p, v) => throne(p, v),
  [T.C11D_WINDOW]: (p, v, f) => windowSea(p, v, f),
  [T.C11D_LIFT]: (p, v, f) => lift(p, v, f),
  [T.C11D_HOOK_ON]: (p, v, f) => hookOn(p, v, f),
  [T.C11D_SCALEGATE_OPEN]: (p) => scaleGateOpen(p),
  [T.C11D_BRIDGE_END]: (p, v, f) => bridgeEnd(p, v, f),
};
export const C11D_FRAMES = {
  [T.C11D_SCALE]: SCALE_FRAMES11D, [T.C11D_VOID]: VOID_FRAMES11D, [T.C11D_STAR]: STAR_FRAMES11D, [T.C11D_CONDOOR_OPEN]: CONDOOR_FRAMES11D,
  [T.C11D_SPRING]: SPRING_FRAMES11D, [T.C11D_SOUNDDOOR_OPEN]: SOUNDDOOR_FRAMES11D, [T.C11D_WINDOW]: WINDOW_FRAMES11D, [T.C11D_LIFT]: LIFT_FRAMES11D,
  [T.C11D_HOOK_ON]: HOOK_FRAMES11D, [T.C11D_BRIDGE_END]: BRIDGE_END_FRAMES11D,
};
export const C11D_SPEED = {
  [T.C11D_SCALE]: 900, [T.C11D_VOID]: 1200, [T.C11D_STAR]: 500, [T.C11D_CONDOOR_OPEN]: 500, [T.C11D_SPRING]: 600, [T.C11D_SOUNDDOOR_OPEN]: 400,
  [T.C11D_WINDOW]: 900, [T.C11D_LIFT]: 400, [T.C11D_HOOK_ON]: 500, [T.C11D_BRIDGE_END]: 300,
};

// ───── 2.5D ─────
// 夜の ガラスは ずっと 下（星は うかぶ）。音の 台は 少し 高い
export const C11D_FLOOR_H = {
  [T.C11D_VOID]: -1.0, [T.C11D_STAR]: -0.04,
  [T.C11D_PAD_1]: 0.05, [T.C11D_PAD_2]: 0.05, [T.C11D_PAD_3]: 0.05, [T.C11D_PAD_4]: 0.05, [T.C11D_PAD_5]: 0.05, [T.C11D_PAD_6]: 0.05, [T.C11D_PAD_7]: 0.05,
};
export function c11dBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C11D_WALL: case T.C11D_MOON_WALL_F: case T.C11D_MOON_WALL_B: case T.C11D_SHADOW_WALL: return { h: 1.6, top: t(), side: t() };
    case T.C11D_PILLAR: return { h: 1.9, top: ['t', T.C11D_FLOOR, v, 0], side: t() };
    case T.C11D_CONDOOR: case T.C11D_SOUNDDOOR: return { h: 1.6, top: ['t', T.C11D_WALL, v, 0], side: t() };
    case T.C11D_MURAL: return { h: 1.6, top: ['t', T.C11D_WALL, v, 0], side: t() };
    case T.C11D_WINDOW: return { h: 2.0, top: ['t', T.C11D_WALL, v, 0], side: t() };
    case T.C11D_THRONE: return { h: 0.9, top: t(), side: t() };
    case T.C11D_SCALE: return { h: 1.2, top: t(), side: t() };
    case T.C11D_HOOK_ON: case T.C11D_SCALEGATE_OPEN: return { h: 1.4, top: t(), side: t() };
    default: return null;
  }
}
export const C11D_PROPS = {
  [T.C11D_SPRING]: [16, 18, (p) => { p.ellipse(8, 14, 7, 3, '#c8c0e0'); p.ellipse(8, 13, 5, 2, '#a8e0ff'); p.vline(8, 3, 12, '#d8f0ff'); p.set(8, 2, '#ffffff'); p.set(7, 5, '#ffffff'); }],
};
export const C11D_PROPS_KEEP = new Set(Object.keys(C11D_PROPS).map(Number));
export const C11D_THEMES = {};
