// 第7章 Step 5・6「氷の竜の城」と 千年前の シロガネ地方の タイル（16×16 ドット）と 色（テーマ）。render/tiles-c7s.js が まぜる
// ・いばら（337）… 雪の 上の 黒い いばら / 水たまり（338）… とけた 氷の 水たまり（石の ゆかに 青い 水）
// ・氷の 箱（339）… 青白く 光る 氷の 小箱 / 竜の とびら（340）… 竜の 絵が きざまれた 石の とびら
// ・つららの 落ちる ゆか（341）… 青い 影の ある 石の ゆか / 落ちてきた つらら（342）… 白い 氷の とげ（3コマ）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=e32f6eb85bad';
import { prand } from './pixel.js?v=e32f6eb85bad';
// 第8章 第1幕: 月の王宮の地下迷宮の タイル（render/tiles-c8a.js。ここで まぜる）
import { C8A_PAINTERS, C8A_FRAMES, C8A_SPEED, C8A_FLOOR_H, c8aBlockSpec, C8A_PROPS, C8A_PROPS_KEEP, C8A_THEMES } from './tiles-c8a.js?v=e32f6eb85bad';

const SN = { d: '#b8c8dc', b: '#e8eef8', l: '#ffffff' }; // 雪
const TH = { d: '#140a18', b: '#2a1a2e', l: '#4a2e50', t: '#6a4a70' }; // 黒い いばら
const ST = { d: '#4a5868', b: '#7a8898', l: '#a8b4c4', hl: '#d0d8e4', ln: '#3a4450' }; // 石
const IC = { d: '#5a8ab8', b: '#a8d4f0', l: '#dcf0ff', w: '#ffffff' }; // 氷
const WA = { d: '#2a5a8a', b: '#4a8ac0', l: '#8ac0e8' }; // 水たまり

function snowBase(p, v) {
  p.rect(0, 0, 16, 16, SN.b);
  const r = prand(v * 37 + 5);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? SN.d : SN.l);
}
function stoneFloor(p, v) {
  p.rect(0, 0, 16, 16, ST.b);
  const r = prand(v * 41 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? ST.l : ST.d);
  p.hline(0, 15, 0, ST.ln); p.vline(0, 0, 15, ST.ln);
}
// 黒い いばら（とげの ある つるが からみあう）
function paintThorn(p, v) {
  snowBase(p, v);
  const r = prand(v * 13 + 9);
  for (let k = 0; k < 3; k++) {
    const y0 = 3 + k * 5 + Math.floor(r() * 2);
    for (let x = 0; x < 16; x++) {
      const y = y0 + Math.round(Math.sin(x * 0.7 + k * 2) * 1.5);
      p.set(x, y, TH.b); p.set(x, y + 1, TH.d);
      if ((x + k) % 4 === 0) { p.set(x, y - 1, TH.t); p.set(x + 1, y - 2, TH.l); }
    }
  }
  p.set(4, 6, '#8a2a5a'); p.set(11, 11, '#8a2a5a');
}
// とけた 氷の 水たまり
function paintPuddle(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 6, 4.5, WA.d);
  p.ellipse(8, 7.6, 5.4, 3.8, WA.b);
  p.hline(5, 8, 6, WA.l); p.set(10, 9, WA.l);
}
// 氷の 箱（青白い 小箱。ふたに 雪の しるし）
function paintIceBox(p, v) {
  stoneFloor(p, v);
  p.rect(3, 5, 10, 9, IC.d);
  p.rect(3, 5, 10, 8, IC.b);
  p.hline(3, 12, 5, IC.l); p.hline(3, 12, 8, IC.d);
  p.vline(8, 6, 7, IC.w); p.hline(7, 9, 6, IC.w); p.set(7, 7, IC.l); p.set(9, 7, IC.l);
  p.set(4, 6, IC.w);
}
// 竜の とびら（石の とびらに 白い 竜の 絵）
function paintDDoor(p, v) {
  p.rect(0, 0, 16, 16, ST.d);
  p.rect(1, 1, 14, 14, ST.b);
  p.vline(8, 1, 14, ST.ln);
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 5; i++) p.set(1 + Math.floor(r() * 14), 1 + Math.floor(r() * 14), ST.l);
  // 竜の 絵（頭と つばさ）
  p.ellipse(8, 7, 3, 2, IC.l); p.set(5, 6, IC.w); p.set(4, 5, IC.l);
  p.hline(3, 6, 9, IC.b); p.hline(10, 13, 9, IC.b); p.set(2, 8, IC.b); p.set(13, 8, IC.b);
  p.vline(8, 9, 12, IC.b);
}
// つららの 落ちる ゆか（上の つららの 青い 影）
function paintIcicleFloor(p, v) {
  stoneFloor(p, v);
  p.ellipse(8, 8, 4, 2, '#5a6a80');
  p.set(8, 8, '#8aa0c0');
}
// 落ちてきた つらら（2D: 上から 見た 白い 氷の とげと 氷の かけら）
export const ICICLE_FRAMES = 3;
function paintIcicle(p, v, f) {
  stoneFloor(p, v);
  const k = f % ICICLE_FRAMES;
  p.ellipse(8, 9, 6, 4, IC.d);
  for (let y = 2; y < 12; y++) { const w = Math.max(0, Math.round((12 - y) / 3)); p.hline(8 - w, 8 + w, y, y % 3 ? IC.b : IC.l); }
  p.vline(8, 2, 11, IC.w);
  // とびちる 氷の かけら（コマで 外へ 広がる）
  for (const [dx, dy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) p.set(8 + dx * (3 + k * 2), 11 + dy * (1 + k), IC.w);
  p.set(8, 2 + k, IC.l);
}

export const C7I_PAINTERS = {
  [T.C7I_THORN]: (p, v) => paintThorn(p, v),
  [T.C7I_PUDDLE]: (p, v) => paintPuddle(p, v),
  [T.C7I_ICEBOX]: (p, v) => paintIceBox(p, v),
  [T.C7I_DDOOR]: (p, v) => paintDDoor(p, v),
  [T.C7I_ICICLE_FLOOR]: (p, v) => paintIcicleFloor(p, v),
  [T.C7I_ICICLE]: (p, v, f) => paintIcicle(p, v, f),
  ...C8A_PAINTERS,
};
export const C7I_FRAMES = { [T.C7I_ICICLE]: ICICLE_FRAMES, ...C8A_FRAMES };
export const C7I_SPEED = { [T.C7I_ICICLE]: 160, ...C8A_SPEED };

// ───── 2.5D ─────
// 水たまりは 少し ひくい。竜の とびらは かべ（洞窟の かべと おなじ 高さ）
export const C7I_FLOOR_H = { [T.C7I_PUDDLE]: -0.08, [T.C7I_ICICLE_FLOOR]: -0.02, ...C8A_FLOOR_H };
export function c7iBlockSpec(id, v) {
  if (id === T.C7I_DDOOR) return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.C7I_DDOOR, 0, 0], gate: true };
  return c8aBlockSpec(id, v);
}
// たてた もの（[はば, 高さ, かく 関数]）: いばら・氷の 箱・落ちてきた つらら
export const C7I_PROPS = {
  [T.C7I_THORN]: [16, 18, (p) => {
    for (const [x0, h, d] of [[2, 16, 1], [7, 18, -1], [11, 14, 1]]) {
      for (let y = 18 - h; y < 18; y++) {
        const x = x0 + Math.round(Math.sin(y * 0.6) * 1.5) * d;
        p.set(x, y, TH.b); p.set(x + 1, y, TH.d);
        if (y % 3 === 0) { p.set(x - 1, y, TH.t); p.set(x + 2, y - 1, TH.l); }
      }
    }
    p.set(5, 5, '#8a2a5a'); p.set(12, 8, '#8a2a5a');
  }],
  [T.C7I_ICEBOX]: [14, 12, (p) => {
    p.rect(1, 3, 12, 9, IC.d); p.rect(1, 3, 12, 8, IC.b); p.hline(1, 12, 3, IC.l); p.rect(1, 0, 12, 3, IC.l);
    p.vline(7, 5, 9, IC.w); p.hline(5, 9, 7, IC.w);
  }],
  [T.C7I_ICICLE]: [12, 22, (p) => {
    for (let y = 0; y < 22; y++) { const w = Math.max(0, Math.round((22 - y) / 5)); p.hline(6 - w, 5 + w, y, y % 4 ? IC.b : IC.l); }
    p.vline(5, 0, 20, IC.w);
  }],
  ...C8A_PROPS,
};
// たてた ものでも 色を かえない（つららの 白）
export const C7I_PROPS_KEEP = new Set([T.C7I_ICICLE, T.C7I_ICEBOX, ...C8A_PROPS_KEEP]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const C7I_THEMES = {
  // 千年前の 氷の竜の城: 青白い 氷の 石と、すきとおった 水
  c7i_castle: {
    floor: G([0, '#1a2434'], [0.3, '#6a84a4'], [0.6, '#c4d8ec'], [1, '#ffffff']),
    wall: G([0, '#0c1424'], [0.3, '#3a5478'], [0.6, '#8aa8cc'], [1, '#eaf4ff']),
    water: G([0, '#0a2040'], [0.5, '#3a7ac0'], [1, '#e8f8ff']),
    gem: G([0, '#1a3050'], [0.5, '#8ad0f0'], [1, '#ffffff']),
    flame: G([0, '#2a5a8a'], [0.5, '#8ad8ff'], [1, '#f4fcff']),
  },
  // 第8章 第1幕: 月の王宮の地下迷宮（千年前）
  ...C8A_THEMES,
};
