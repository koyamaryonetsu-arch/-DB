// 第3部 第2章 第4幕「金の音と、星の橋」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16）
// ・星の 階段: 光の 段（591。2コマ）/ おどり場（592）/ 門（593）・開いた 門（594）/ 星の いずみ（595。2コマ）・えらんだ あと（596）
// ・いただき: ゆか（597）/ 金色の 光の 玉（598。2コマ）/ ふちの 光る 石（599）
// ・星の塔に 足す 物: 金色に 光る 星の ゆか（600。2コマ）/ 空へ のびる 光の 階段（601。2コマ）/ いただきの 光の 出口（602。2コマ）
// 下の 雲の 海は 第5章の T.CLOUD_SEA（雲の すき間の 小さな 世界は client/c10d-view.js）。どれも テーマで 色を かえない
import { T } from '../../shared/tiles.js?v=b3f22aad5877';
import { prand } from './pixel.js?v=b3f22aad5877';
import { THEME_PARTS } from './tiles-castle.js?v=b3f22aad5877';

const GOLD = { d: '#a8801e', b: '#e8c040', l: '#ffe070', hl: '#fff8c8' };
const STONE = { d: '#6a6490', b: '#a8a0c8', l: '#c8c0e0', hl: '#eae6f8' };

export const STEP_FRAMES10D = 2;
function step(p, v, f) {
  // 光の 段（金色の ふちの すきとおった 板。横に すじ ＝ 段）
  p.rect(0, 0, 16, 16, '#d8d0a8');
  p.rect(1, 1, 14, 14, '#f0e8c0');
  for (const y of [3, 8, 13]) p.hline(0, 15, y, '#c8b878');
  for (const y of [4, 9, 14]) p.hline(0, 15, y, '#fffbe8');
  const r = prand(v * 7 + f);
  for (let i = 0; i < 2; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#ffffff');
  if ((v + f) % 3 === 0) p.set(8, 6, GOLD.l);
}
function landing(p, v) {
  p.rect(0, 0, 16, 16, STONE.b);
  p.hline(0, 15, 0, STONE.d); p.vline(0, 0, 15, STONE.d);
  p.hline(1, 15, 1, STONE.l); p.vline(1, 1, 15, STONE.l);
  const r = prand(v * 13 + 5);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, STONE.hl);
  if (v % 6 === 0) { p.set(8, 8, '#fff0a0'); p.set(7, 8, '#e8d890'); p.set(9, 8, '#e8d890'); p.set(8, 7, '#e8d890'); p.set(8, 9, '#e8d890'); }
}
function gate(p, open) {
  p.rect(0, 0, 16, 16, '#f0e8c0');
  // 金の 柱と 光の とびら（開くと 光の 門の わくだけ）
  p.rect(0, 0, 3, 16, GOLD.d); p.rect(13, 0, 3, 16, GOLD.d);
  p.vline(1, 0, 15, GOLD.l); p.vline(14, 0, 15, GOLD.b);
  p.rect(0, 0, 16, 3, GOLD.b); p.hline(0, 15, 0, GOLD.l);
  if (!open) {
    p.rect(3, 3, 10, 13, '#c8b8f0');
    for (let x = 4; x < 13; x += 3) p.vline(x, 3, 15, '#9a88d8');
    p.ellipse(8, 9, 2, 2, '#fff8c8'); p.set(8, 9, '#ffffff');
  } else {
    p.rect(3, 3, 10, 13, '#fffbe8');
    p.set(5, 8, '#ffffff'); p.set(10, 12, '#ffffff');
  }
}
export const WELL_FRAMES10D = 2;
function well(p, v, f, dry) {
  p.rect(0, 0, 16, 16, STONE.b);
  p.ellipse(8, 9, 7, 6, STONE.d);
  p.ellipse(8, 9, 6, 5, STONE.l);
  if (dry) { p.ellipse(8, 9, 4.5, 3.5, '#5a5878'); p.set(7, 9, '#7a78a0'); return; }
  // 3つの 水（赤み・青み・金色の ひかり）
  p.ellipse(8, 9, 4.5, 3.5, '#4a8ad8');
  p.set(5, 9, '#ff9aa8'); p.set(8, 8, '#9ad8ff'); p.set(11, 9, '#ffe070');
  p.set(6 + f, 10, '#ffffff'); p.set(10 - f, 8, '#ffffff');
  p.set(8, 2 + f, '#d8f0ff'); p.set(4, 4 - f, '#fff8c8'); p.set(12, 3 + f, '#ffd0d8');
}
function summit(p, v) {
  p.rect(0, 0, 16, 16, '#c8c0e0');
  p.hline(0, 15, 15, '#a8a0c8'); p.vline(15, 0, 15, '#a8a0c8');
  const r = prand(v * 11 + 9);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 15), Math.floor(r() * 15), '#f0ecff');
  if (v % 5 === 0) p.set(6, 6, '#ffe8a0');
}
export const ORB_FRAMES10D = 2;
function orb(p, v, f) {
  summit(p, v);
  p.rect(4, 11, 8, 4, '#8a80b0'); p.hline(3, 12, 11, '#b0a8d0');
  p.ellipse(8, 7 - f, 5, 5, GOLD.d); p.ellipse(8, 7 - f, 3.8, 3.8, GOLD.b); p.ellipse(7, 5 - f, 1.6, 1.6, GOLD.hl);
  p.set(2, 2 + f, GOLD.l); p.set(13, 4 - f, GOLD.l); p.set(8, 0, GOLD.hl);
}
function starrock(p) {
  p.rect(0, 0, 16, 16, '#c8c0e0');
  p.ellipse(8, 13, 6, 2, '#8a80b0');
  p.ellipse(8, 8, 5, 6, '#7a70a8'); p.ellipse(7, 7, 3.5, 4.5, '#a8a0d0');
  p.set(8, 4, '#fff8c8'); p.set(7, 5, '#ffe070'); p.set(9, 5, '#ffe070'); p.set(8, 6, '#ffe070');
}
export const GOLD_FRAMES10D = 2;
function goldFloor(p, v, f) {
  // 星座の ゆかが 金色に 光る（星の 形）
  p.rect(0, 0, 16, 16, '#6a5a20');
  p.rect(1, 1, 14, 14, f ? GOLD.b : GOLD.l);
  p.rect(3, 3, 10, 10, f ? GOLD.l : GOLD.hl);
  for (const [x, y] of [[8, 3], [8, 12], [3, 8], [12, 8]]) p.set(x, y, '#ffffff');
  p.rect(7, 7, 2, 2, '#ffffff');
  p.set(5, 5, GOLD.hl); p.set(10, 10, GOLD.hl); p.set(10, 5, GOLD.hl); p.set(5, 10, GOLD.hl);
}
export const SKYSTAIR_FRAMES10D = 2;
function skystair(p, v, f) {
  // 夜空へ のびる 光の 段（上へ 行くほど 細く・すける）
  p.rect(0, 0, 16, 16, '#141a44');
  for (let y = 0; y < 16; y++) {
    const w = 4 + Math.round(y / 3);
    const c = y % 4 === (f ? 1 : 3) ? '#ffffff' : y % 2 ? GOLD.hl : GOLD.l;
    p.hline(8 - w, 7 + w, y, c);
  }
  p.set(2, 3 + f, '#fff8c8'); p.set(13, 6 - f, '#fff8c8');
}
export const PORTAL_FRAMES10D = 2;
function portal(p, v, f) {
  summit(p, v);
  p.ellipse(8, 8, 6, 6, f ? GOLD.b : GOLD.l); p.ellipse(8, 8, 4, 4, GOLD.hl); p.ellipse(8, 8, 2, 2, '#ffffff');
}

export const C10D_PAINTERS = {
  [T.C10D_STEP]: (p, v, f) => step(p, v, f),
  [T.C10D_LANDING]: (p, v) => landing(p, v),
  [T.C10D_GATE]: (p) => gate(p, false),
  [T.C10D_GATE_OPEN]: (p) => gate(p, true),
  [T.C10D_WELL]: (p, v, f) => well(p, v, f, false),
  [T.C10D_WELL_DRY]: (p, v) => well(p, v, 0, true),
  [T.C10D_SUMMIT]: (p, v) => summit(p, v),
  [T.C10D_ORB]: (p, v, f) => orb(p, v, f),
  [T.C10D_STARROCK]: (p) => starrock(p),
  [T.C10D_GOLD]: (p, v, f) => goldFloor(p, v, f),
  [T.C10D_SKYSTAIR]: (p, v, f) => skystair(p, v, f),
  [T.C10D_PORTAL]: (p, v, f) => portal(p, v, f),
};
export const C10D_FRAMES = {
  [T.C10D_STEP]: STEP_FRAMES10D, [T.C10D_WELL]: WELL_FRAMES10D, [T.C10D_ORB]: ORB_FRAMES10D, [T.C10D_GOLD]: GOLD_FRAMES10D,
  [T.C10D_SKYSTAIR]: SKYSTAIR_FRAMES10D, [T.C10D_PORTAL]: PORTAL_FRAMES10D,
};
export const C10D_SPEED = {
  [T.C10D_STEP]: 700, [T.C10D_WELL]: 500, [T.C10D_ORB]: 400, [T.C10D_GOLD]: 450, [T.C10D_SKYSTAIR]: 380, [T.C10D_PORTAL]: 350,
};

// ───── 2.5D ─────
// 光の 段は 少し 高い（うかぶ 板）。門は 背の 高い 金の 門（とびらは 上の 絵）
export const C10D_FLOOR_H = { [T.C10D_STEP]: 0.04, [T.C10D_GATE_OPEN]: 0.02, [T.C10D_SKYSTAIR]: 0.06 };
export function c10dBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C10D_GATE: return { h: 1.6, top: ['t', T.C10D_LANDING, v, 0], side: t() };
    case T.C10D_STARROCK: return { h: 0.7, top: t(), side: t() };
    default: return null;
  }
}
export const C10D_PROPS = {
  [T.C10D_WELL]: [16, 16, (p) => {
    p.ellipse(8, 11, 7, 4, STONE.d); p.ellipse(8, 10, 6, 3.2, STONE.l);
    p.ellipse(8, 10, 4.5, 2.2, '#4a8ad8'); p.set(5, 10, '#ff9aa8'); p.set(8, 9, '#9ad8ff'); p.set(11, 10, '#ffe070');
    p.set(8, 3, '#d8f0ff'); p.set(4, 5, '#fff8c8'); p.set(12, 4, '#ffd0d8');
  }],
  [T.C10D_WELL_DRY]: [16, 16, (p) => {
    p.ellipse(8, 11, 7, 4, STONE.d); p.ellipse(8, 10, 6, 3.2, STONE.l); p.ellipse(8, 10, 4.5, 2.2, '#5a5878');
  }],
  [T.C10D_ORB]: [16, 20, (p) => {
    p.rect(4, 14, 8, 5, '#8a80b0'); p.hline(3, 12, 14, '#b0a8d0');
    p.ellipse(8, 8, 6, 6, GOLD.d); p.ellipse(8, 8, 4.5, 4.5, GOLD.b); p.ellipse(7, 6, 2, 2, GOLD.hl);
  }],
};
export const C10D_PROPS_KEEP = new Set(Object.keys(C10D_PROPS).map(Number));

// ───── 色（テーマ）: もとの 色（星の塔の テーマでも 金色の ゆか・光の 階段は かえない）─────
const IDS10D = Object.keys(C10D_PAINTERS).map(Number);
for (const th of ['star_tower', 'star_tower_mid', 'star_tower_high']) THEME_PARTS[th] = { ...(THEME_PARTS[th] || {}), ...Object.fromEntries(IDS10D.map((id) => [id, 'none'])) };
export const C10D_THEMES = {};
