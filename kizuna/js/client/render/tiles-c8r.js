// 第8章 第4幕「時のはざま」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c8c.js が まぜる
// ・時のはざまの 空（395。3コマで 星と 金の 砂が うずまく）/ 時の砂の 川（396。3コマで 流れる。通れない）/ 時の砂の 浅せ（397。3コマで きらきら。わたると 時代が かわる）
// ・時の広間の 紋章の 台（398 光って いない・399 月・400 青い 火・401 星・402 氷）/ 最後の 回廊の 大とびら（403）/ つばさの 入口の 光の アーチ（404。3コマ）
// ・にげる 青い 火（405。3コマで ぴょこぴょこ）/ 時の さけめ（406。3コマで うずまく）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=283f9a2c8227';
import { prand } from './pixel.js?v=283f9a2c8227';

const VO = { d: '#120a26', b: '#21153e', l: '#3a2a66', s: '#f4ecff' }; // 時のはざまの 空
const SA = { d: '#8a6420', b: '#c8a050', l: '#f0d890', w: '#fff8e0' }; // 時の砂
const ST = { d: '#3a3450', b: '#5a5478', l: '#8a84a8', hl: '#c8c4e0', ln: '#1e1a30' }; // 石の 台
const BF = { d: '#0a5aa8', b: '#3ab8ff', l: '#9ae8ff', w: '#f0fcff' }; // 青い 火
const MG = { d: '#4a1a8a', b: '#8a5ae8', l: '#d0b0ff', w: '#f8f0ff' }; // さけめの 光

export const VOID_FRAMES8R = 3;
function paintVoid(p, v, f) {
  p.rect(0, 0, 16, 16, VO.b);
  const r = prand(v * 29 + 11);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), VO.d);
  const k = f % VOID_FRAMES8R;
  // 金の 砂の すじ（ゆっくり 流れる）
  for (let i = 0; i < 2; i++) {
    const y = (Math.floor(r() * 16) + k) % 16, x0 = Math.floor(r() * 10);
    p.hline(x0, x0 + 4, y, VO.l); p.set(x0 + 2, y, SA.d);
  }
  // 星
  for (let i = 0; i < 2; i++) { const x = Math.floor(r() * 16), y = Math.floor(r() * 16); p.set(x, y, (i + k) % 3 ? VO.s : VO.l); }
}
export const SAND_FRAMES8R = 3;
function paintSandFlow(p, v, f) {
  p.rect(0, 0, 16, 16, SA.b);
  const k = f % SAND_FRAMES8R;
  for (let y = 0; y < 16; y += 3) {
    const off = (y * 5 + k * 3 + v) % 16;
    p.hline(off, Math.min(15, off + 5), y, SA.l);
    p.set((off + 9) % 16, y + 1 < 16 ? y + 1 : y, SA.d);
  }
  p.set((v * 3 + k * 5) % 16, (v * 7) % 16, SA.w);
}
function paintFord(p, v, f) {
  p.rect(0, 0, 16, 16, SA.l);
  const k = f % SAND_FRAMES8R;
  for (let y = 1; y < 16; y += 4) p.hline((y + k * 2) % 6, (y + k * 2) % 6 + 8, y, SA.b);
  // ふみ石
  for (const [x, y] of [[4, 4], [11, 7], [5, 12]]) { p.ellipse(x, y, 2.5, 1.6, ST.l); p.hline(x - 1, x + 1, y - 1, ST.hl); }
  p.set((3 + k * 5) % 16, (9 + k * 3) % 16, SA.w);
  p.set((12 + k * 3) % 16, (2 + k * 5) % 16, SA.w);
}
// 紋章の 台（光って いない / 光る）
const CREST_LIGHT = {
  moon: { b: '#f0e070', l: '#fff8c0' }, fire: { b: '#3ab8ff', l: '#c0f0ff' }, iron: { b: '#a87ae8', l: '#e8d8ff' }, ice: { b: '#7ad8f0', l: '#f0ffff' },
};
function crestMark(p, kind, c) {
  if (kind === 'moon') { p.ellipse(8, 6, 3, 3, c.b); p.ellipse(9, 5, 2.5, 2.5, ST.d); p.set(6, 6, c.l); }
  else if (kind === 'fire') { for (let y = 3; y < 9; y++) { const w = Math.round((y - 2) / 2); p.hline(8 - w, 8 + w, y, c.b); } p.vline(8, 5, 8, c.l); }
  else if (kind === 'iron') { p.vline(8, 2, 9, c.b); p.hline(5, 11, 5, c.b); p.set(6, 3, c.b); p.set(10, 3, c.b); p.set(6, 7, c.b); p.set(10, 7, c.b); p.set(8, 5, c.l); }
  else if (kind === 'ice') { p.vline(8, 2, 9, c.b); p.hline(5, 11, 6, c.b); p.set(6, 4, c.l); p.set(10, 4, c.l); p.set(6, 8, c.l); p.set(10, 8, c.l); }
  else { p.ellipse(8, 6, 3, 3, ST.ln); p.set(8, 6, ST.l); }
}
function paintCrest(p, v, kind) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(2, 10, 12, 5, ST.b); p.hline(2, 13, 10, ST.hl); p.hline(2, 13, 15, ST.ln);
  p.rect(4, 1, 8, 10, ST.b); p.hline(4, 11, 1, ST.hl); p.vline(11, 1, 10, ST.ln);
  const c = CREST_LIGHT[kind];
  if (c) { p.ellipse(8, 6, 4, 4, c.b); p.ellipse(8, 6, 3, 3, ST.ln); }
  crestMark(p, kind, c || {});
}
function paintBigDoor(p, v) {
  p.rect(0, 0, 16, 16, MG.d);
  p.rect(1, 1, 14, 15, '#3a2a5a'); p.vline(8, 1, 15, MG.d);
  p.hline(1, 14, 1, MG.l);
  for (const [x, y, k] of [[4, 5, 'moon'], [12, 5, 'fire'], [4, 11, 'iron'], [12, 11, 'ice']]) { p.ellipse(x, y, 2, 2, ST.ln); p.set(x, y, CREST_LIGHT[k].b); }
}
export const ARCH_FRAMES8R = 3;
function paintWingDoor(p, v, f) {
  p.rect(0, 0, 16, 16, '#2a2050');
  const k = f % ARCH_FRAMES8R;
  for (let r = 7; r >= 2; r -= 1) p.ellipse(8, 9, r, r + 1, (r + k) % 3 === 0 ? MG.l : r % 2 ? MG.b : '#6a4ac8');
  p.ellipse(8, 9, 2, 3, MG.w);
  p.hline(1, 14, 15, ST.ln);
}
export const WISP_FRAMES8R = 3;
function paintWisp(p, v, f) {
  p.rect(0, 0, 16, 16, '#1a2440');
  const k = f % WISP_FRAMES8R;
  const up = k === 1 ? -1 : 0;
  p.ellipse(8, 14, 4, 1.2, '#0a1020');
  for (let y = 2; y < 13; y++) {
    const w = Math.max(0, Math.round(Math.min(y - 1, 13 - y) / 1.6));
    p.hline(8 - w, 8 + w, y + up, BF.b);
    if (w > 1) p.hline(9 - w, 7 + w, y + up, BF.l);
  }
  p.vline(8, 4 + up, 10 + up, BF.w);
  // 目（にこにこ）
  p.set(6, 8 + up, '#0a2a5a'); p.set(10, 8 + up, '#0a2a5a'); p.hline(7, 9, 10 + up, '#0a2a5a');
  if (k === 2) { p.set(2, 4, BF.l); p.set(13, 6, BF.l); }
}
export const RIFT_FRAMES8R = 3;
function paintRift(p, v, f) {
  p.rect(0, 0, 16, 16, '#3a2a5a');
  const k = f % RIFT_FRAMES8R;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + k * 0.5;
    const rr = 2 + (i % 4) * 1.5;
    p.set(Math.round(8 + Math.cos(a) * rr), Math.round(8 + Math.sin(a) * rr * 0.8), i % 2 ? MG.l : SA.l);
  }
  p.ellipse(8, 8, 2, 2, MG.w);
}

export const C8R_PAINTERS = {
  [T.C8R_VOID]: (p, v, f) => paintVoid(p, v, f),
  [T.C8R_SANDFLOW]: (p, v, f) => paintSandFlow(p, v, f),
  [T.C8R_FORD]: (p, v, f) => paintFord(p, v, f),
  [T.C8R_CREST]: (p, v) => paintCrest(p, v, null),
  [T.C8R_CREST_MOON]: (p, v) => paintCrest(p, v, 'moon'),
  [T.C8R_CREST_FIRE]: (p, v) => paintCrest(p, v, 'fire'),
  [T.C8R_CREST_IRON]: (p, v) => paintCrest(p, v, 'iron'),
  [T.C8R_CREST_ICE]: (p, v) => paintCrest(p, v, 'ice'),
  [T.C8R_BIGDOOR]: (p, v) => paintBigDoor(p, v),
  [T.C8R_WINGDOOR]: (p, v, f) => paintWingDoor(p, v, f),
  [T.C8R_WISP]: (p, v, f) => paintWisp(p, v, f),
  [T.C8R_RIFT]: (p, v, f) => paintRift(p, v, f),
};
export const C8R_FRAMES = {
  [T.C8R_VOID]: VOID_FRAMES8R, [T.C8R_SANDFLOW]: SAND_FRAMES8R, [T.C8R_FORD]: SAND_FRAMES8R, [T.C8R_WINGDOOR]: ARCH_FRAMES8R, [T.C8R_WISP]: WISP_FRAMES8R, [T.C8R_RIFT]: RIFT_FRAMES8R,
};
export const C8R_SPEED = {
  [T.C8R_VOID]: 700, [T.C8R_SANDFLOW]: 160, [T.C8R_FORD]: 300, [T.C8R_WINGDOOR]: 220, [T.C8R_WISP]: 180, [T.C8R_RIFT]: 150,
};

// ───── 2.5D ─────
// 時のはざまの 空は ひくい（下に 星）・時の砂の 川は 少し ひくい。紋章の 台・大とびら・にげる 青い 火は たてた もの
export const C8R_FLOOR_H = { [T.C8R_VOID]: -0.6, [T.C8R_SANDFLOW]: -0.2, [T.C8R_FORD]: -0.06, [T.C8R_RIFT]: -0.02 };
export function c8rBlockSpec(id) {
  switch (id) {
    default: return null;
  }
}
const crestProp = (kind) => [16, 22, (p) => {
  p.rect(2, 14, 12, 8, ST.d); p.hline(2, 13, 14, ST.hl); p.hline(1, 14, 21, ST.ln);
  p.rect(4, 2, 8, 13, ST.b); p.hline(4, 11, 2, ST.hl); p.vline(11, 2, 14, ST.ln);
  const c = CREST_LIGHT[kind];
  if (c) { p.ellipse(8, 8, 4, 4, c.b); p.ellipse(8, 8, 3, 3, ST.ln); }
  p.ellipse(8, 8, 2.5, 2.5, c ? c.l : ST.ln);
  if (!c) p.set(8, 8, ST.l);
}];
export const C8R_PROPS = {
  [T.C8R_CREST]: crestProp(null),
  [T.C8R_CREST_MOON]: crestProp('moon'),
  [T.C8R_CREST_FIRE]: crestProp('fire'),
  [T.C8R_CREST_IRON]: crestProp('iron'),
  [T.C8R_CREST_ICE]: crestProp('ice'),
  [T.C8R_BIGDOOR]: [16, 30, (p) => {
    p.rect(0, 2, 16, 28, '#2a1a4a'); p.rect(1, 3, 14, 26, '#4a3a7a'); p.vline(8, 3, 28, '#2a1a4a');
    p.hline(0, 15, 2, MG.l); p.ellipse(8, 2, 8, 2, MG.b);
    for (const [x, y, k] of [[4, 10, 'moon'], [12, 10, 'fire'], [4, 18, 'iron'], [12, 18, 'ice']]) { p.ellipse(x, y, 2, 2, ST.ln); p.set(x, y, CREST_LIGHT[k].b); }
  }],
  [T.C8R_WISP]: [12, 16, (p) => {
    for (let y = 1; y < 14; y++) {
      const w = Math.max(0, Math.round(Math.min(y, 14 - y) / 1.6));
      p.hline(6 - w, 6 + w, y, BF.b);
      if (w > 1) p.hline(7 - w, 5 + w, y, BF.l);
    }
    p.vline(6, 3, 11, BF.w);
    p.set(4, 8, '#0a2a5a'); p.set(8, 8, '#0a2a5a'); p.hline(5, 7, 10, '#0a2a5a');
  }],
};
// たてた ものでも 色を かえない（紋章の 光・大とびらの むらさき・青い 火）
export const C8R_PROPS_KEEP = new Set([T.C8R_CREST_MOON, T.C8R_CREST_FIRE, T.C8R_CREST_IRON, T.C8R_CREST_ICE, T.C8R_BIGDOOR, T.C8R_WISP]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C8R_THEMES = {
  // 時のはざま（千年前の すがた）: 古い 金と こはく色の 石
  c8r_past: {
    floor: G([0, '#1a1006'], [0.3, '#5a4020'], [0.6, '#b08a50'], [1, '#fff4d8']),
    wall: G([0, '#140c06'], [0.3, '#4a3018'], [0.6, '#8a6a40'], [1, '#f0e0c0']),
    water: G([0, '#0a1a3a'], [0.5, '#3a6ab0'], [1, '#d8f0ff']),
    gem: G([0, '#3a2a08'], [0.5, '#e0b040'], [1, '#fff8e0']),
    flame: G([0, '#5a2a0a'], [0.5, '#f0a040'], [1, '#fff4d8']),
  },
  // 時のはざま（今の すがた）: 青むらさきの 石と 銀の 光
  c8r_now: {
    floor: G([0, '#0a0a1e'], [0.3, '#2a2a5a'], [0.6, '#6a70b0'], [1, '#eef0ff']),
    wall: G([0, '#06061a'], [0.3, '#22224a'], [0.6, '#545a98'], [1, '#e0e4ff']),
    water: G([0, '#0a1a3a'], [0.5, '#3a7ab8'], [1, '#d8f4ff']),
    gem: G([0, '#1a1a4a'], [0.5, '#8a9af0'], [1, '#ffffff']),
    flame: G([0, '#1a2a6a'], [0.5, '#6aa8ff'], [1, '#f0f8ff']),
  },
  // 時の広間: むらさきの 石と 金の かざり
  c8r_hall: {
    floor: G([0, '#140a20'], [0.3, '#3e2a5a'], [0.6, '#8a70b0'], [1, '#fff0ff']),
    wall: G([0, '#0e0618'], [0.3, '#32204a'], [0.6, '#6a5090'], [1, '#f0e0ff']),
    water: G([0, '#1a0a3a'], [0.5, '#7a5ad8'], [1, '#f0e8ff']),
    gem: G([0, '#3a2a08'], [0.5, '#e0b040'], [1, '#fff8e0']),
    flame: G([0, '#3a1a5a'], [0.5, '#c88aff'], [1, '#fff4ff']),
  },
  // 時のはざまの おく: しずかな やみと 星あかり
  c8r_core: {
    floor: G([0, '#06040e'], [0.3, '#1e1636'], [0.6, '#4e4278'], [1, '#e8e0ff']),
    wall: G([0, '#030208'], [0.3, '#140e26'], [0.6, '#3a3060'], [1, '#d8d0f0']),
    water: G([0, '#0a0620'], [0.5, '#4a3a90'], [1, '#e0d8ff']),
    gem: G([0, '#1a1030'], [0.5, '#9a80e0'], [1, '#ffffff']),
    flame: G([0, '#2a0a3a'], [0.5, '#a05ad8'], [1, '#f8eaff']),
  },
};
