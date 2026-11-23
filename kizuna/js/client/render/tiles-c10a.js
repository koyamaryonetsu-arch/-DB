// 第3部 第2章 第1幕「赤と緑」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13）
// ・炎の山の 古い 道: 石だたみ（491）/ 岩かべ（492）/ 下で 光る 溶岩（493。2コマ）/ つるの かべ（494）・ひらいた（495）/ 赤い 光の 玉（496。2コマ）
// ・根の国: 地面（497）/ 根の かべ（498）/ 谷（499）/ がけ（500）/ 音の つぼみ（501。2コマ）・さいた（502）/ つる（503）/ 大きな 葉（504）/
//   きのこの め（505）/ きのこ（506）/ 見はらし台（507）/ 大木の みき（508）/ うろ（509）/ こおった つぼみ（510）/ 火の 花（511。2コマ）/ 光る 胞子の 草（514）
// ・今の マップに フラグで 出る 物: たれ下がる 根（512。大地の下）/ 切りかぶ（513。ささやきの森）
// どれも テーマで 色を かえない（古い 道は 炎の山の テーマ lava の 中でも もとの 色）
import { T } from '../../shared/tiles.js?v=dc7c9b067c89';
import { prand } from './pixel.js?v=dc7c9b067c89';
import { THEME_PARTS } from './tiles-castle.js?v=dc7c9b067c89';

const RD = { d: '#2a1a16', b: '#4a3430', l: '#6a5048', hl: '#8a6a5a' };
const WL = { d: '#140806', b: '#2a1612', l: '#3e2018', hl: '#5a3020' };
// 根の国の こけ（青みどり。今までの 草原の 黄みどりと ちがう）
const GD = { d: '#163a36', b: '#215248', l: '#2e6c5c', hl: '#6ad8b0' };
const RT = { d: '#2a1a0e', b: '#4a3020', l: '#6a4a30', hl: '#8a6a44' };

function road(p, v) {
  p.rect(0, 0, 16, 16, RD.b);
  // 石だたみの 目地
  p.hline(0, 15, 7, RD.d); p.hline(0, 15, 15, RD.d);
  const o = (v % 2) * 4;
  for (const x of [o + 3, o + 11]) p.vline(x % 16, 0, 6, RD.d);
  for (const x of [o + 7, o + 15]) p.vline(x % 16, 8, 14, RD.d);
  const r = prand(v * 11 + 3);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), RD.hl);
}
function wall(p, v) {
  p.rect(0, 0, 16, 16, WL.b);
  const r = prand(v * 29 + 5);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 14), y = Math.floor(r() * 14); p.ellipse(x + 1, y + 1, 3, 2, WL.l); p.hline(x - 1, x + 2, y - 1, WL.hl); }
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), WL.d);
}
export const GLOW_FRAMES10A = 2;
function glow(p, v, f) {
  p.rect(0, 0, 16, 16, '#1a0604');
  const r = prand(v * 17 + 7);
  // ずっと 下で 赤く 光る 溶岩
  for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 14) + 1; p.ellipse(x, y, 2.5, 1.5, f && i % 2 ? '#c8401a' : '#8a2a10'); }
  p.set(Math.floor(r() * 16), Math.floor(r() * 16), f ? '#ffb040' : '#ff7a2a');
}
function vineWall(p, v, open) {
  if (open) { road(p, v); p.set(2, 3, '#4a7a3a'); p.set(13, 12, '#4a7a3a'); return; }
  wall(p, v);
  for (let y = 0; y < 16; y++) { p.set(4 + Math.round(Math.sin(y / 2) * 2), y, '#3a6a2a'); p.set(11 + Math.round(Math.cos(y / 2) * 2), y, '#4a8a3a'); }
  for (const [x, y] of [[5, 3], [10, 6], [3, 10], [12, 12], [7, 14]]) { p.set(x, y, '#6ab04a'); p.set(x + 1, y, '#8ad060'); }
}
export const ORB_FRAMES10A = 2;
function orb(p, v, f) {
  road(p, v);
  p.ellipse(8, 13, 6, 2, '#2a0a04');
  p.ellipse(8, 8, 5 + f * 0.5, 5 + f * 0.5, '#c8301a'); p.ellipse(8, 8, 3.5, 3.5, '#ff6a2a'); p.ellipse(7, 7, 1.6, 1.6, '#ffd080');
  if (f) { p.set(2, 3, '#ffb040'); p.set(14, 5, '#ffb040'); }
}
function ground(p, v) {
  p.rect(0, 0, 16, 16, GD.b);
  const r = prand(v * 13 + 1);
  // こけの もこもこ
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 14) + 1; p.ellipse(x, y, 2, 1.2, i % 2 ? GD.l : GD.d); }
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), GD.hl);
  // 地面を はう 太い 根（ところどころ）
  if (v === 3) {
    // 小さな 光る きのこ
    for (const [x, y] of [[4, 10], [11, 7]]) { p.vline(x, y, y + 2, '#d8e8e0'); p.ellipse(x, y, 2, 1.2, '#3ac8d8'); p.set(x, y - 1, '#c8ffff'); }
  }
  // 光る ほうしの つぶ
  if (v % 3 === 0) { const x = Math.floor(r() * 12) + 2, y = Math.floor(r() * 12) + 2; p.set(x, y, '#c8ffe8'); p.set(x + 1, y, '#7affd0'); }
}
function spore(p, v) {
  ground(p, v);
  const r = prand(v * 7 + 3);
  // 光る ほうしの くさ（先が 光る）
  for (let i = 0; i < 4; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 10) + 5; p.vline(x, y, y + 3, '#2a7a5a'); p.set(x, y - 1, '#d8fff0'); p.set(x - 1, y - 1, '#7affd0'); p.set(x + 1, y - 1, '#7affd0'); }
}
// 地面を はう 太い 根（よこ・たて。となりの 根と つながる）
function crawlRoot(p, v, vert) {
  ground(p, v === 3 ? 1 : v);
  for (let i = 0; i < 16; i++) {
    const o = Math.round(Math.sin((i + v * 4) / 2.6) * 1.2);
    const a = 8 + o;
    if (vert) { p.hline(a - 3, a + 3, i, RT.b); p.set(a - 3, i, RT.hl); p.set(a - 2, i, RT.l); p.set(a + 3, i, RT.d); }
    else { p.vline(i, a - 3, a + 3, RT.b); p.set(i, a - 3, RT.hl); p.set(i, a - 2, RT.l); p.set(i, a + 3, RT.d); }
  }
  // こぶと こけ
  if (vert) { p.ellipse(8, 5 + v * 2, 3.5, 2, RT.l); p.set(6, 4 + v * 2, '#4ac8a0'); } else { p.ellipse(5 + v * 2, 8, 2, 3.5, RT.l); p.set(4 + v * 2, 6, '#4ac8a0'); }
}
function rootWall(p, v) {
  p.rect(0, 0, 16, 16, RT.b);
  // ねじれた 根
  for (let y = 0; y < 16; y++) {
    const a = 3 + Math.round(Math.sin((y + v) / 3) * 2), b = 11 + Math.round(Math.cos((y + v) / 3) * 2);
    p.hline(a - 1, a + 1, y, RT.l); p.set(a, y, RT.hl); p.hline(b - 1, b + 1, y, RT.d);
  }
  if (v % 4 === 0) {
    // 大きな きのこ（根に 生えた）
    p.rect(6, 8, 4, 7, '#e8e0d0');
    p.ellipse(8, 7, 7, 4, '#3aa8c8'); p.ellipse(8, 6, 6, 3, '#6ad8f0');
    for (const [x, y] of [[5, 6], [10, 5], [8, 8]]) p.set(x, y, '#e8ffff');
  } else if (v % 4 === 2) {
    // 大きな 葉
    for (let y = 2; y < 15; y++) { const w = Math.round(Math.sin(((y - 2) / 12) * Math.PI) * 6); p.hline(8 - w, 8 + w, y, y % 3 ? '#3a9a5a' : '#2a7a48'); }
    p.vline(8, 2, 15, '#1e5a36'); p.set(6, 5, '#8ae8a8'); p.set(10, 9, '#8ae8a8');
  } else if (v % 3 === 0) { p.set(7, 5, '#4ac8a0'); p.set(8, 5, '#8affd0'); }
}
function gap(p, v) {
  // 谷の 下は 大地の下の やみ（ずっと 下に 光る こけと 水しょうが かすかに 見える）
  p.rect(0, 0, 16, 16, '#05040c');
  const r = prand(v * 19 + 9);
  for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 16), y = Math.floor(r() * 16); p.set(x, y, ['#1e3a4a', '#4a2a6a', '#6affd0'][i]); }
  if (v % 4 === 0) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#9ad8ff');
}
function cliff(p, v) {
  p.rect(0, 0, 16, 16, '#5a3e24');
  p.hline(0, 15, 0, '#8a6a44'); p.hline(0, 15, 1, '#7a5a3a');
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, '#4a3018');
  const r = prand(v * 23 + 4);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), 2 + Math.floor(r() * 13), '#3a2410');
}
export const BUD_FRAMES10A = 2;
function bud(p, v, f, open) {
  ground(p, v);
  p.ellipse(8, 14, 5, 1.5, '#2a3a1a');
  p.vline(8, 9, 14, '#3a7a2a'); p.set(6, 11, '#4a9a3a'); p.set(10, 12, '#4a9a3a');
  if (open) {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; p.ellipse(8 + Math.cos(a) * 3, 6 + Math.sin(a) * 3, 2, 2, '#f0a0d0'); }
    p.ellipse(8, 6, 1.8, 1.8, '#ffe070'); p.set(8, 6, '#fff8d0');
  } else {
    p.ellipse(8, 6 - f * 0.5, 3.5, 4, '#a878d0'); p.ellipse(7, 5 - f * 0.5, 1.6, 2, '#d0b0f0');
    if (f) { p.set(3, 3, '#e8d0ff'); p.set(13, 4, '#e8d0ff'); }
  }
}
function vine(p, v) {
  cliff(p, v);
  p.vline(6, 0, 15, '#3a7a2a'); p.vline(10, 0, 15, '#3a7a2a');
  for (let y = 1; y < 16; y += 3) { p.hline(6, 10, y, '#5aa83a'); p.set(5, y + 1, '#7ac850'); p.set(11, y, '#7ac850'); }
}
function leaf(p, v) {
  gap(p, v);
  p.rect(0, 1, 16, 14, '#5aa83a'); p.rect(0, 2, 16, 12, '#7ac85a');
  p.hline(0, 15, 8, '#4a8a2a');
  for (let x = (v % 4); x < 16; x += 4) { p.set(x, 5, '#4a8a2a'); p.set(x + 1, 11, '#4a8a2a'); }
  p.hline(0, 15, 2, '#a8e880');
}
function sprout(p, v) {
  ground(p, v);
  p.ellipse(8, 11, 3, 1.5, '#e0a090'); p.vline(8, 11, 13, '#e8e0c8');
}
function shroom(p, v) {
  ground(p, v);
  p.ellipse(8, 14, 6, 1.5, '#2a3a1a');
  p.rect(6, 8, 4, 6, '#f0e8d0');
  p.ellipse(8, 7, 7, 4, '#d84a3a'); p.ellipse(8, 6, 6, 3, '#f06a5a');
  for (const [x, y] of [[5, 6], [10, 5], [8, 8]]) p.set(x, y, '#fff4e0');
}
function lookout(p, v) {
  ground(p, v);
  p.vline(3, 4, 15, '#6a4a2a'); p.vline(12, 4, 15, '#6a4a2a');
  for (let y = 6; y < 16; y += 3) p.hline(3, 12, y, '#8a6a42');
  p.rect(1, 1, 14, 3, '#a88a5a'); p.hline(1, 14, 1, '#c8a878');
}
function tree(p, v) {
  p.rect(0, 0, 16, 16, '#5a3a22');
  for (let x = (v % 3); x < 16; x += 3) p.vline(x, 0, 15, '#4a2e18');
  const r = prand(v * 31 + 2);
  // 白い カビ
  for (let i = 0; i < 5; i++) { const x = Math.floor(r() * 14) + 1, y = Math.floor(r() * 14) + 1; p.ellipse(x, y, 1.5, 1, '#d8d8c8'); }
}
function hollow(p, v) {
  tree(p, v);
  p.ellipse(8, 10, 6, 6, '#1a0e08'); p.ellipse(8, 11, 4.5, 5, '#0a0604');
}
function iceBud(p, v) {
  ground(p, v);
  p.ellipse(8, 14, 5, 1.5, '#2a3a1a');
  p.ellipse(8, 8, 5, 6, '#9ad8f0'); p.ellipse(7, 7, 3, 4, '#c8f0ff'); p.set(6, 5, '#ffffff');
  p.hline(4, 12, 11, '#6aa8c8');
}
export const BLOOM_FRAMES10A = 2;
function fireBloom(p, v, f) {
  ground(p, v);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + f * 0.3; p.ellipse(8 + Math.cos(a) * 3.5, 8 + Math.sin(a) * 3.5, 2, 2, i % 2 ? '#ff8a3a' : '#ffb040'); }
  p.ellipse(8, 8, 2, 2, '#ffe070');
}
function hangRoot(p, v) {
  // 大地の下の 地面の 上に、天じょうから たれ下がる 太い 根（足場の きのこ）
  p.rect(0, 0, 16, 16, '#1a1420');
  p.rect(4, 0, 8, 16, RT.b); p.vline(5, 0, 15, RT.hl); p.vline(10, 0, 15, RT.d);
  for (const y of [3, 8, 13]) { p.ellipse(3, y, 2.5, 1.2, '#e0a070'); p.ellipse(13, y + 2, 2.5, 1.2, '#e0a070'); }
}
function stump(p, v) {
  p.rect(0, 0, 16, 16, '#3a6a2a');
  p.ellipse(8, 9, 7, 5, '#6a4a2a'); p.ellipse(8, 8, 6, 4, '#a88a5a');
  p.ellipse(8, 8, 3, 2, '#8a6a42'); p.ellipse(8, 8, 1, 0.8, '#1a0e08');
  p.set(3, 3, '#ffe070'); p.set(13, 4, '#c8ffb0');
}

export const C10A_PAINTERS = {
  [T.C10A_ROAD]: (p, v) => road(p, v),
  [T.C10A_WALL]: (p, v) => wall(p, v),
  [T.C10A_GLOW]: (p, v, f) => glow(p, v, f),
  [T.C10A_VINEWALL]: (p, v) => vineWall(p, v, false),
  [T.C10A_VINEWALL_OPEN]: (p, v) => vineWall(p, v, true),
  [T.C10A_ORB]: (p, v, f) => orb(p, v, f),
  [T.C10A_GROUND]: (p, v) => ground(p, v),
  [T.C10A_ROOTWALL]: (p, v) => rootWall(p, v),
  [T.C10A_GAP]: (p, v) => gap(p, v),
  [T.C10A_CLIFF]: (p, v) => cliff(p, v),
  [T.C10A_BUD]: (p, v, f) => bud(p, v, f, false),
  [T.C10A_BUD_OPEN]: (p, v) => bud(p, v, 0, true),
  [T.C10A_VINE]: (p, v) => vine(p, v),
  [T.C10A_LEAF]: (p, v) => leaf(p, v),
  [T.C10A_SPROUT]: (p, v) => sprout(p, v),
  [T.C10A_SHROOM]: (p, v) => shroom(p, v),
  [T.C10A_LOOKOUT]: (p, v) => lookout(p, v),
  [T.C10A_TREE]: (p, v) => tree(p, v),
  [T.C10A_HOLLOW]: (p, v) => hollow(p, v),
  [T.C10A_ICEBUD]: (p, v) => iceBud(p, v),
  [T.C10A_FIREBLOOM]: (p, v, f) => fireBloom(p, v, f),
  [T.C10A_HANGROOT]: (p, v) => hangRoot(p, v),
  [T.C10A_STUMP]: (p, v) => stump(p, v),
  [T.C10A_SPORE]: (p, v) => spore(p, v),
  [T.C10A_ROOT_H]: (p, v) => crawlRoot(p, v, false),
  [T.C10A_ROOT_V]: (p, v) => crawlRoot(p, v, true),
};
export const C10A_FRAMES = { [T.C10A_GLOW]: GLOW_FRAMES10A, [T.C10A_ORB]: ORB_FRAMES10A, [T.C10A_BUD]: BUD_FRAMES10A, [T.C10A_FIREBLOOM]: BLOOM_FRAMES10A };
export const C10A_SPEED = { [T.C10A_GLOW]: 520, [T.C10A_ORB]: 360, [T.C10A_BUD]: 700, [T.C10A_FIREBLOOM]: 300 };

// ───── 2.5D ─────
// 溶岩・谷は ずっと 下。かべ・根・がけ・大木は ブロック
export const C10A_FLOOR_H = { [T.C10A_GLOW]: -1.1, [T.C10A_GAP]: -1.2, [T.C10A_LEAF]: -0.05, [T.C10A_ROOT_H]: 0.12, [T.C10A_ROOT_V]: 0.12 };
export function c10aBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C10A_WALL: return { h: 1.5 + (v % 3) * 0.15, top: t(), side: t() };
    case T.C10A_VINEWALL: return { h: 1.5, top: ['t', T.C10A_WALL, v, 0], side: ['t', T.C10A_WALL, v, 0], south: t() };
    case T.C10A_ROOTWALL: return { h: 1.4 + (v % 3) * 0.2, top: t(), side: t() };
    case T.C10A_CLIFF: return { h: 0.9, top: ['t', T.C10A_GROUND, v, 0], side: t() };
    case T.C10A_TREE: return { h: 2.6, top: ['t', T.C10A_TREE, v, 0], side: t() };
    default: return null;
  }
}
export const C10A_PROPS = {
  [T.C10A_ORB]: [16, 18, (p) => {
    p.ellipse(8, 16, 6, 1.5, '#2a0a04');
    p.ellipse(8, 9, 6, 6, '#c8301a'); p.ellipse(8, 9, 4, 4, '#ff6a2a'); p.ellipse(7, 7, 2, 2, '#ffd080');
  }],
  [T.C10A_BUD]: [14, 16, (p) => {
    p.vline(7, 8, 15, '#3a7a2a'); p.set(5, 11, '#4a9a3a'); p.set(9, 12, '#4a9a3a');
    p.ellipse(7, 5, 4, 5, '#a878d0'); p.ellipse(6, 4, 2, 2.4, '#d0b0f0');
  }],
  [T.C10A_BUD_OPEN]: [16, 16, (p) => {
    p.vline(8, 8, 15, '#3a7a2a');
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; p.ellipse(8 + Math.cos(a) * 3.5, 5 + Math.sin(a) * 3.5, 2.2, 2.2, '#f0a0d0'); }
    p.ellipse(8, 5, 2, 2, '#ffe070');
  }],
  [T.C10A_LOOKOUT]: [16, 22, (p) => {
    p.vline(3, 6, 21, '#6a4a2a'); p.vline(12, 6, 21, '#6a4a2a');
    for (let y = 8; y < 22; y += 3) p.hline(3, 12, y, '#8a6a42');
    p.rect(1, 2, 14, 4, '#a88a5a'); p.hline(1, 14, 2, '#c8a878');
  }],
  [T.C10A_ICEBUD]: [14, 16, (p) => {
    p.ellipse(7, 8, 5, 7, '#9ad8f0'); p.ellipse(6, 6, 3, 4, '#c8f0ff'); p.set(5, 3, '#ffffff');
  }],
  [T.C10A_HANGROOT]: [14, 30, (p) => {
    p.rect(4, 0, 6, 30, RT.b); p.vline(5, 0, 29, RT.hl); p.vline(9, 0, 29, RT.d);
    for (const y of [6, 14, 22]) { p.ellipse(2, y, 2.5, 1.2, '#e0a070'); p.ellipse(12, y + 3, 2.5, 1.2, '#e0a070'); }
  }],
};
export const C10A_PROPS_KEEP = new Set([T.C10A_ORB, T.C10A_BUD, T.C10A_BUD_OPEN, T.C10A_LOOKOUT, T.C10A_ICEBUD, T.C10A_HANGROOT]);

// ───── 色（テーマ）: 古い 道は 炎の山の テーマ（lava）の 中でも もとの 色。大地の下（c9b_under）・森でも もとの 色 ─────
const IDS10A = Object.keys(C10A_PAINTERS).map(Number);
for (const th of ['lava', 'c9b_under']) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...Object.fromEntries(IDS10A.map((id) => [id, 'none'])) };
export const C10A_THEMES = {};
