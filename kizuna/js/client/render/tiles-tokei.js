// 第6章 Step 5「止まった時計塔」の タイル（16×16 ドット）と 色（テーマ）。render/tiles-ch6.js が まぜる
// ・文字ばんの あな（CLOCK_PIT 289）… 下の ほうで 止まった 歯車が うっすら 見える まっくらな あな
// ・針の 橋（290）… 金の 時計の 針（びょうが うってある 板）/ 文字ばんの まん中の 台（291）/ 針の スイッチ（292。レバー）
// ・かべの 時計の 絵（293）/ ドッスンの 下の ゆか（294。まるい かげ）/ 落ちてきた 石（295。こわい 顔の 石）
// ・止まった 部屋の ゆか（296）・止まった 水（297。灰色で さざなみも 止まっている）
// ・止まった 大きな 歯車（298）・回って 道に なった 歯車（299）・時の すきま（300。光る ゆか。3コマ）
// ・歯車の とびら（301）・大きな かね（302）・灰色の 木（303）・灰色の 草（304）・星の塔の 新しい かべ画（305。うすく 半分）・かべの 大時計（306）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=dd582b3d4c53';
import { prand } from './pixel.js?v=dd582b3d4c53';

const BR = { d: '#5a3e18', b: '#a07a30', l: '#d8b050', hl: '#f8e090' }; // 金の 真ちゅう
const FL = { b: '#6e5a46', l: '#86705a', d: '#56463a', ln: '#3e322a' }; // 塔の ゆか（くすんだ 茶色の 石）
const GR = { d: '#6a6870', b: '#8e8c94', l: '#aaa8b0', hl: '#c8c6cc' }; // 止まった 灰色

function floorBase(p, v, c = FL) {
  p.rect(0, 0, 16, 16, c.b);
  const r = prand(v * 43 + 7);
  for (let i = 0; i < 7; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? c.l : c.d);
  p.hline(0, 15, 0, c.ln);
  p.vline(0, 0, 15, c.ln);
}
// 歯車（cx, cy … まん中・r … 大きさ・teeth … 歯の 数・rot … まわり）
function gear(p, cx, cy, r, c, cl, cd, teeth = 8, rot = 0) {
  p.ellipse(cx, cy, r, r, c);
  for (let i = 0; i < teeth; i++) {
    const a = rot + (i * Math.PI * 2) / teeth;
    p.set(Math.round(cx + Math.cos(a) * (r + 1)), Math.round(cy + Math.sin(a) * (r + 1)), c);
    p.set(Math.round(cx + Math.cos(a) * (r + 0.4)), Math.round(cy + Math.sin(a) * (r + 0.4)), cl);
  }
  p.ellipse(cx, cy, Math.max(1, r * 0.35), Math.max(1, r * 0.35), cd);
}

// 文字ばんの あな（まっくら。下に 止まった 歯車）
function paintPit(p, v) {
  p.rect(0, 0, 16, 16, '#120e0a');
  const r = prand(v * 29 + 3);
  gear(p, 4 + Math.floor(r() * 8), 4 + Math.floor(r() * 8), 3, '#2a2016', '#3a2c1c', '#120e0a', 7, r());
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#241c14');
}
// 針の 橋（金の 板に びょう）
function paintHand(p, v) {
  paintPit(p, v);
  p.rect(1, 1, 14, 14, BR.b);
  p.hline(1, 14, 1, BR.hl); p.vline(1, 1, 14, BR.l);
  p.hline(1, 14, 14, BR.d); p.vline(14, 1, 14, BR.d);
  for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12]]) { p.set(x, y, BR.d); p.set(x, y - 1, BR.hl); }
  p.hline(5, 10, 8, BR.l); p.hline(6, 9, 7, BR.hl);
}
// 文字ばんの まん中の 台（金の まるい 台）
function paintHub(p, v) {
  paintPit(p, v);
  p.rect(0, 0, 16, 16, BR.d);
  p.rect(1, 1, 14, 14, BR.b);
  p.ellipse(8, 8, 5.5, 5.5, BR.l); p.ellipse(8, 8, 3.5, 3.5, BR.b); p.ellipse(8, 8, 1.5, 1.5, BR.hl);
  p.hline(1, 14, 1, BR.hl);
}
// 針の スイッチ（石の 台に 金の レバー）
function paintSwitch(p, v) {
  floorBase(p, v);
  p.ellipse(8, 14.5, 6, 1.4, FL.ln);
  p.rect(3, 9, 10, 6, '#7a7068'); p.hline(3, 12, 9, '#a8a098'); p.hline(3, 12, 14, '#4a4440');
  p.vline(9, 2, 9, BR.b); p.vline(10, 3, 9, BR.d); p.set(8, 3, BR.l);
  p.ellipse(9.5, 2.5, 2, 2, '#c83a2a'); p.set(9, 1, '#ff8a6a');
  gear(p, 6, 11, 1.6, BR.l, BR.hl, BR.d, 6);
}
// かべの 時計の 絵（かべに 金の わく・白い 文字ばん・針）
function paintClockPaint(p, v) {
  p.rect(0, 0, 16, 16, '#4a3a2c');
  p.hline(0, 15, 15, '#2a2018');
  p.rect(2, 1, 12, 13, BR.d); p.rect(3, 2, 10, 11, BR.b);
  p.ellipse(8, 7.5, 4.5, 4.5, '#f4ecd8'); p.ellipse(8, 7.5, 4.5, 4.5, '#f4ecd8');
  for (const [x, y] of [[8, 3], [12, 7], [8, 12], [4, 7]]) p.set(x, y, '#3a2a1a');
  // 針（v で 少し ちがう 時こく）
  const ang = ((v % 4) + 1) * (Math.PI / 6);
  for (let k = 1; k <= 3; k++) p.set(Math.round(8 + Math.sin(ang) * k), Math.round(7.5 - Math.cos(ang) * k), '#1a1010');
  p.vline(8, 4, 7, '#1a1010');
  p.set(8, 7, '#c83a2a');
}
// かべの 大時計（12時で 止まっている）
function paintClockFace(p, v) {
  p.rect(0, 0, 16, 16, '#4a3a2c');
  p.hline(0, 15, 15, '#2a2018');
  p.ellipse(8, 7.5, 7, 7, BR.d); p.ellipse(8, 7.5, 6, 6, '#e8dcc0');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; p.set(Math.round(8 + Math.sin(a) * 5), Math.round(7.5 - Math.cos(a) * 5), i % 3 ? '#8a7a5a' : '#2a1a10'); }
  p.vline(8, 2, 7, '#1a1010'); p.vline(7, 3, 7, '#1a1010');
  p.set(8, 8, '#c83a2a');
  void v;
}
// ドッスンの 下の ゆか（石が 落ちてくる 所の まるい かげ）
function paintThudFloor(p, v) {
  floorBase(p, v);
  p.ellipse(8, 8, 6.5, 5.5, '#4a3c30');
  p.ellipse(8, 8, 5, 4, '#3e322a');
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) p.set(x, y, '#2a221c');
  p.set(7, 7, '#56463a');
}
// 落ちてきた 石（こわい 顔の 石の かたまり。ふちに とげ）
function thudFace(p, x0, y0, w, h) {
  p.rect(x0, y0, w, h, '#8a8a9a');
  p.hline(x0, x0 + w - 1, y0, '#b8b8c8'); p.vline(x0, y0, y0 + h - 1, '#a8a8b8');
  p.hline(x0, x0 + w - 1, y0 + h - 1, '#5a5a6a'); p.vline(x0 + w - 1, y0, y0 + h - 1, '#5a5a6a');
  for (let i = x0 + 1; i < x0 + w - 1; i += 3) { p.set(i, y0 - 1, '#b8b8c8'); p.set(i, y0 + h, '#5a5a6a'); }
  const cx = x0 + Math.floor(w / 2);
  const ey = y0 + Math.floor(h * 0.35);
  p.rect(cx - 4, ey, 3, 2, '#ffffff'); p.rect(cx + 1, ey, 3, 2, '#ffffff');
  p.set(cx - 3, ey + 1, '#c82020'); p.set(cx + 2, ey + 1, '#c82020');
  p.hline(cx - 5, cx - 2, ey - 2, '#3a3a4a'); p.hline(cx + 1, cx + 4, ey - 2, '#3a3a4a');
  p.hline(cx - 3, cx + 2, ey + 4, '#3a3a4a');
  for (let i = cx - 3; i <= cx + 2; i += 2) p.set(i, ey + 5, '#e8e8f0');
}
function paintThudStone(p, v) {
  floorBase(p, v);
  thudFace(p, 1, 1, 14, 14);
}
// 止まった 部屋の ゆか（灰色。時計の はりの もようが うっすら）
function paintStopFloor(p, v) {
  floorBase(p, v, { b: GR.b, l: GR.l, d: GR.d, ln: '#5a5860' });
  if (v % 5 === 0) { p.vline(8, 5, 8, GR.l); p.hline(8, 10, 8, GR.l); }
}
// 止まった 水（灰色の 水。さざなみも 止まったまま）
function paintStopWater(p, v) {
  p.rect(0, 0, 16, 16, '#8a96a2');
  const r = prand(v * 31 + 5);
  for (let k = 0; k < 3; k++) {
    const y = 2 + k * 5 + Math.floor(r() * 2);
    const x0 = Math.floor(r() * 9);
    p.hline(x0, x0 + 5, y, '#b4bec8');
    p.set(x0 + 2, y - 1, '#a4aeb8');
  }
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#ccd4dc');
}
// 止まった 大きな 歯車（ゆかに 立った 大きな 歯車の 一部）
function paintBigGear(p, v) {
  floorBase(p, v);
  gear(p, 8, 8, 6, BR.b, BR.l, BR.d, 10, v * 0.3);
  p.ellipse(8, 8, 3, 3, BR.d); p.ellipse(8, 8, 1.5, 1.5, '#2a1a0a');
  p.set(5, 4, BR.hl); p.set(6, 3, BR.hl);
}
// 回って 道に なった 歯車（たおれて ゆかに なった）
function paintGearFlat(p, v) {
  p.rect(0, 0, 16, 16, BR.d);
  p.rect(0, 1, 16, 14, BR.b);
  for (let x = 1; x < 16; x += 3) { p.set(x, 0, BR.l); p.set(x, 15, BR.d); }
  p.hline(0, 15, 1, BR.hl);
  p.hline(2, 13, 8, BR.l);
  const r = prand(v * 7 + 1);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), 3 + Math.floor(r() * 10), BR.d);
}
// 時の すきま（光る ゆか。光の 砂が うずを まく）
export const GAP_FRAMES = 3;
function paintGap(p, v, f) {
  p.rect(0, 0, 16, 16, '#6a5ea8');
  p.ellipse(8, 8, 7, 7, '#9a8ed8'); p.ellipse(8, 8, 5, 5, '#c8bef0'); p.ellipse(8, 8, 2.5, 2.5, '#f4f0ff');
  const k = f % GAP_FRAMES;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + k * 0.7;
    p.set(Math.round(8 + Math.cos(a) * 5.5), Math.round(8 + Math.sin(a) * 5.5), i % 2 ? '#fff4c8' : '#ffffff');
  }
  p.hline(0, 15, 0, '#4a3e88'); p.vline(0, 0, 15, '#4a3e88');
  void v;
}
// 歯車の とびら（金の わくに 大きな 歯車の しるし）
function paintClockDoor(p, v) {
  p.rect(0, 0, 16, 16, '#3a2a1a');
  p.rect(1, 0, 14, 16, BR.d);
  p.rect(2, 2, 12, 14, '#6a4a22');
  p.vline(7, 2, 15, '#3a2a14'); p.vline(8, 2, 15, '#8a6a3a');
  gear(p, 8, 8, 3.5, BR.b, BR.l, BR.d, 8);
  p.hline(1, 14, 1, BR.l);
  void v;
}
// 大きな かね（金の かね。下に ゆか）
function paintBell(p, v) {
  floorBase(p, v);
  p.rect(7, 0, 2, 2, '#3a2a1a');
  for (let y = 2; y < 13; y++) { const half = Math.round(2 + (y - 2) * 0.5); p.hline(8 - half, 7 + half, y, BR.b); p.set(8 - half, y, BR.l); p.set(7 + half, y, BR.d); }
  p.hline(1, 14, 13, BR.d); p.hline(2, 13, 12, BR.l);
  p.ellipse(8, 14, 1.4, 1.2, '#3a2a1a');
  p.vline(5, 4, 9, BR.hl);
}
// 灰色の 木（時が 止まった 森）・灰色の 草
function grayGrass(p, v) {
  p.rect(0, 0, 16, 16, '#9a9ca2');
  const r = prand(v * 17 + 9);
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(r() * 15), y = 2 + Math.floor(r() * 13);
    p.set(x, y, '#80828a'); p.set(x + 1, y - 1, '#b4b6bc');
  }
}
function paintFrozenTree(p, v) {
  grayGrass(p, v);
  p.rect(7, 10, 2, 5, '#6a6a70');
  p.ellipse(8, 7, 6, 5.5, '#76787e'); p.ellipse(7, 6, 4.5, 4, '#8e9096'); p.ellipse(6, 5, 2, 1.6, '#aeb0b6');
  p.set(11, 9, '#5e6066');
}
// 星の塔の 新しい かべ画（うすく、半分しか 見えない。大きな 時計の 前に 4人の 子ども）
function paintMuralNew(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#5a5470');
  const keep = (x, y) => x < 8 || (x + y) % 3 === 0;
  const set = (x, y, c) => { if (keep(x, y)) p.set(x, y, c); };
  for (let y = 2; y < 14; y++) for (let x = 1; x < 15; x++) set(x, y, '#d8cca8');
  for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; set(Math.round(8 + Math.sin(a) * 3), Math.round(6 - Math.cos(a) * 3), '#8a7a5a'); }
  set(8, 4, '#3a2a1a'); set(8, 5, '#3a2a1a'); set(8, 6, '#c83a2a');
  for (const x of [3, 6, 10, 13]) { set(x, 10, '#e8c8a0'); set(x, 11, '#4a6ab8'); set(x, 12, '#4a6ab8'); }
  set(3, 9, '#f2d870');
  p.hline(0, 15, 15, '#3a3450');
  if (!(m & 8)) p.vline(0, 0, 15, '#3a3450');
  if (!(m & 2)) p.vline(15, 0, 15, '#3a3450');
  void v; void f;
}

export const TK_PAINTERS = {
  [T.CLOCK_PIT]: (p, v) => paintPit(p, v),
  [T.HAND_BRIDGE]: (p, v) => paintHand(p, v),
  [T.CLOCK_HUB]: (p, v) => paintHub(p, v),
  [T.HAND_SWITCH]: (p, v) => paintSwitch(p, v),
  [T.CLOCK_PAINT]: (p, v) => paintClockPaint(p, v),
  [T.THUD_FLOOR]: (p, v) => paintThudFloor(p, v),
  [T.THUD_STONE]: (p, v) => paintThudStone(p, v),
  [T.STOP_FLOOR]: (p, v) => paintStopFloor(p, v),
  [T.STOP_WATER]: (p, v) => paintStopWater(p, v),
  [T.BIG_GEAR]: (p, v) => paintBigGear(p, v),
  [T.GEAR_FLAT]: (p, v) => paintGearFlat(p, v),
  [T.TIME_GAP]: (p, v, f) => paintGap(p, v, f),
  [T.CLOCK_DOOR]: (p, v) => paintClockDoor(p, v),
  [T.BIG_BELL]: (p, v) => paintBell(p, v),
  [T.FROZEN_TREE]: (p, v) => paintFrozenTree(p, v),
  [T.FROZEN_GRASS]: (p, v) => grayGrass(p, v),
  [T.MURAL_NEW]: (p, v, f, m) => paintMuralNew(p, v, f, m),
  [T.CLOCK_FACE]: (p, v) => paintClockFace(p, v),
};
export const TK_FRAMES = { [T.TIME_GAP]: GAP_FRAMES };
export const TK_SPEED = { [T.TIME_GAP]: 260 };

// ───── 2.5D ─────
// 文字ばんの あなは ふかい。止まった 水は 少し ひくい
export const TK_FLOOR_H = { [T.CLOCK_PIT]: -0.8, [T.STOP_WATER]: -0.06 };
export function tkBlockSpec(id, v) {
  switch (id) {
    case T.CLOCK_PAINT: case T.CLOCK_FACE: case T.MURAL_NEW:
      return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', id, v, 0] };
    case T.CLOCK_DOOR: return { h: 1.4, top: ['t', T.TOWER_BASE, v, 0], side: ['t', T.TOWER_BASE, v, 0], south: ['t', T.CLOCK_DOOR, 0, 0] };
    case T.BIG_GEAR: return { h: 1.1, top: ['t', T.GEAR_FLAT, v, 0], side: ['t', T.BIG_GEAR, v, 0], south: ['t', T.BIG_GEAR, v, 0] };
    default: return null;
  }
}
export const TK_PROPS = {
  [T.HAND_SWITCH]: [12, 20, (p) => {
    p.rect(1, 13, 10, 6, '#7a7068'); p.hline(1, 10, 13, '#a8a098'); p.hline(1, 10, 18, '#4a4440');
    p.vline(6, 3, 13, BR.b); p.vline(7, 4, 13, BR.d);
    p.ellipse(6.5, 3, 2, 2, '#c83a2a'); p.set(6, 2, '#ff8a6a');
  }],
  [T.THUD_STONE]: [16, 18, (p) => { thudFace(p, 1, 2, 14, 15); }],
  [T.BIG_BELL]: [20, 28, (p) => {
    p.rect(9, 0, 2, 4, '#3a2a1a');
    for (let y = 4; y < 22; y++) { const half = Math.round(3 + (y - 4) * 0.36); p.hline(10 - half, 9 + half, y, BR.b); p.set(10 - half, y, BR.l); p.set(9 + half, y, BR.d); }
    p.hline(1, 18, 22, BR.d); p.hline(2, 17, 21, BR.l);
    p.ellipse(10, 24, 2, 2, '#3a2a1a'); p.vline(6, 7, 17, BR.hl);
  }],
  [T.FROZEN_TREE]: [20, 28, (p) => {
    p.rect(9, 18, 3, 10, '#5e5e64'); p.vline(9, 18, 27, '#7a7a80');
    for (const [cx, cy, rx, ry] of [[10, 15, 9, 6], [10, 10, 7, 5], [10, 5, 5, 4]]) {
      p.ellipse(cx, cy, rx, ry, '#6e7076'); p.ellipse(cx - 1, cy - 1, rx - 2, ry - 2, '#888a90'); p.ellipse(cx - 3, cy - 2, rx * 0.35, ry * 0.35, '#a8aab0');
    }
    for (const [x, y] of [[4, 16], [15, 12], [7, 8], [13, 4]]) p.set(x, y, '#c4c6cc');
  }],
};

// たてた ものでも 色を かえない（赤い にぎり・こわい 目・金の かね。render/themes.js の partOfProp）
export const TK_PROPS_KEEP = new Set([T.HAND_SWITCH, T.THUD_STONE, T.BIG_BELL]);

// ───── 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([q, h]) => [q, hex(h)]);
export const TK_THEMES = {
  // 止まった時計塔: すすけた 茶色の 石と 真ちゅうの 金（千年前の 塔）
  tokei: {
    floor: G([0, '#1e140c'], [0.3, '#6e5640'], [0.6, '#bca484'], [1, '#fff4e4']),
    wall: G([0, '#140c06'], [0.3, '#4e3a28'], [0.6, '#8e7458'], [1, '#f4e8d4']),
    water: G([0, '#141a20'], [0.5, '#5a6a7a'], [1, '#e8f0f8']),
    gem: G([0, '#2a1a0a'], [0.5, '#e8b850'], [1, '#ffffff']),
    flame: null,
  },
};
