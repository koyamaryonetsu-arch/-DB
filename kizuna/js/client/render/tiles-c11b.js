// 第3部 第3章 第2幕「月の都と、名前のランプ」の タイル（16×16 ドット）。render/tiles-c9a.js が まぜる
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18）
// ・月の都 おもて（明るい 白と 銀・青い 水路）: 石だたみ（661）/ かべ（662）/ 家（663）/ 水路（664。2コマ）/ 花だん（696）
// ・月の都 うら（暗くて あたたかい 明かり）: 石だたみ（665）/ かべ（666）/ 小屋（667。まどに 明かり）/ がらくた（668）/ ちょうちん（695。2コマ）
// ・どちらも: 月かげの 戸（669。地面の 三日月の しるし。2コマ）・はかりの門（670）・名前の ランプの 台（671。2コマ）・ランプの ない かぎ（672）・
//   月の いずみ（673）・ともしびの 井戸（674）・はとば（675）・塔の 入口（676）
// ・名前の 塔: ゆか・かべ（おもて 677・678 / うら 679・680）・光の ゆか（681・ふんだ 682）・とじた とびら（683）・開いた とびら（684）・
//   青い ランプ（685・686）・金の ランプ（687・688）・かげの 谷（689）・かげの 橋（690）・ランプの たな（691）・テラス（692）・手すり（693）・
//   階段（おもて 697・うら 698）
// ・星の海: 月の都（三日月の 岩と 白い 塔。694）
// どれも テーマで 色を かえない（おもてと うらの 色は タイルが 持つ）
import { T } from '../../shared/tiles.js?v=31ca07498b9b';
import { prand } from './pixel.js?v=31ca07498b9b';

const GOLD = { d: '#a8801e', b: '#e8c040', l: '#ffe070', hl: '#fff8c8' };
const SILVER = { d: '#8a86b8', b: '#b8b4d8', l: '#e0dcf8', hl: '#ffffff' };
const WARM = { d: '#3a2420', b: '#6a4038', l: '#c87a40', hl: '#ffb060', glow: '#ffd890' };

// ───── おもて ─────
function fPave(p, v) {
  p.rect(0, 0, 16, 16, '#e8e4f8');
  p.hline(0, 15, 7, '#d0cce8'); p.hline(0, 15, 15, '#d0cce8');
  p.vline((v % 2) * 8 + 3, 0, 6, '#d0cce8'); p.vline(((v + 1) % 2) * 8 + 3, 8, 14, '#d0cce8');
  const r = prand(v * 7 + 1);
  if (v % 5 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, '#ffffff');
}
function fWall(p, v) {
  // 道（白）と 見分けやすい ように、少し 暗い 青むらさきの 石
  p.rect(0, 0, 16, 16, '#a8a6d4');
  p.rect(0, 0, 16, 3, '#c8c6ec'); p.hline(0, 15, 0, SILVER.hl);
  for (let y = 6; y < 16; y += 5) p.hline(0, 15, y, '#8886b8');
  for (let y = 3; y < 16; y += 5) for (let x = (y % 2 ? 2 : 6) + (v % 2) * 4; x < 16; x += 8) p.vline(x, y, Math.min(15, y + 2), '#8886b8');
}
function fHouse(p, v) {
  p.rect(0, 0, 16, 16, '#f4f2ff');
  p.rect(0, 0, 16, 6, '#6a7ad0'); p.hline(0, 15, 5, '#4a58a8');
  for (let x = (v % 2) * 2; x < 16; x += 4) p.vline(x, 0, 4, '#8a9ae0');
  if (v % 3 === 1) { p.rect(6, 9, 4, 7, '#8a86b8'); p.set(9, 12, GOLD.l); } else { p.rect(3, 8, 3, 4, '#c8e0ff'); p.rect(10, 8, 3, 4, '#c8e0ff'); p.set(4, 9, '#ffffff'); }
}
export const CANAL_FRAMES11B = 2;
function fCanal(p, v, f) {
  p.rect(0, 0, 16, 16, '#5a90d0');
  p.hline(0, 15, 0, SILVER.b); p.hline(0, 15, 15, '#4a78b8');
  const r = prand(v * 3 + 5);
  for (let i = 0; i < 3; i++) { const y = 3 + Math.floor(r() * 10); p.hline((Math.floor(r() * 8) + f * 3) % 12, (Math.floor(r() * 8) + f * 3) % 12 + 3, y, '#a8d0ff'); }
  if ((v + f) % 4 === 0) p.set(7, 7, '#ffffff');
}
function fFlower(p, v) {
  fPave(p, v);
  p.rect(1, 3, 14, 11, '#b8b4d8'); p.rect(2, 4, 12, 9, '#6a9a7a');
  for (const [x, y, c] of [[4, 6, '#ffffff'], [9, 5, '#c8d8ff'], [6, 9, '#fff0a0'], [11, 9, '#ffffff'], [3, 11, '#d8c8ff']]) p.set(x, y, c);
}
// ───── うら ─────
function bPave(p, v) {
  p.rect(0, 0, 16, 16, '#6a5048');
  const r = prand(v * 11 + 3);
  for (let i = 0; i < 6; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#5a4038' : '#7a6058');
  p.hline(0, 15, 8, '#5a4038');
  if (v % 6 === 0) p.set(Math.floor(r() * 14) + 1, Math.floor(r() * 14) + 1, WARM.hl);
}
function bWall(p, v) {
  p.rect(0, 0, 16, 16, '#2a2028');
  p.rect(0, 0, 16, 2, '#3a2c34');
  const r = prand(v * 13 + 2);
  for (let i = 0; i < 5; i++) p.hline(Math.floor(r() * 12), Math.floor(r() * 12) + 3, 3 + Math.floor(r() * 12), '#3a2c34');
}
function bHouse(p, v) {
  p.rect(0, 0, 16, 16, '#5a3a38');
  p.rect(0, 0, 16, 5, '#3a2428');
  for (let x = (v % 3); x < 16; x += 5) p.vline(x, 5, 15, '#4a3030');
  p.rect(4 + (v % 2) * 5, 8, 4, 3, WARM.hl); p.set(5 + (v % 2) * 5, 9, WARM.glow);
  p.hline(0, 15, 5, '#6a4440');
}
function bRubble(p, v) {
  bPave(p, v);
  const r = prand(v * 17 + 9);
  p.rect(1, 6, 7, 8, '#7a5a40'); p.rect(2, 7, 5, 6, '#9a7050'); p.hline(1, 7, 9, '#5a4030');
  p.rect(8, 3, 7, 7, '#5a4a48'); p.rect(9, 4, 5, 5, '#6a5a58');
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), 12 + Math.floor(r() * 4), '#4a3a30');
  p.set(11, 12, '#8a6a50'); p.set(12, 13, '#8a6a50');
}
export const LANTERN_FRAMES11B = 2;
function bLantern(p, v, f) {
  bPave(p, v);
  p.vline(8, 0, 3, '#3a2420');
  p.ellipse(8, 8, 4, 5, f ? '#ff8040' : '#ff7030'); p.ellipse(8, 8, 2.5, 3.5, f ? WARM.glow : WARM.hl);
  p.hline(5, 11, 3, '#2a1a18'); p.hline(5, 11, 13, '#2a1a18');
  p.set(8, 8, '#ffffff');
}
// ───── どちらも ─────
export const DOOR_FRAMES11B = 2;
function door(p, v, f) {
  p.rect(0, 0, 16, 16, '#3a3868');
  p.ellipse(8, 8, 7, 7, '#4a4880'); p.ellipse(8, 8, 6, 6, '#2a2858');
  // 三日月（左に ふくらむ）
  for (let y = 2; y < 15; y++) for (let x = 2; x < 15; x++) {
    const o = (x - 8) ** 2 + (y - 8) ** 2 <= 30;
    const i = (x - 10) ** 2 + (y - 7) ** 2 <= 22;
    if (o && !i) p.set(x, y, f ? GOLD.hl : GOLD.l);
  }
  p.set(12 - f, 3, '#ffffff'); p.set(3 + f, 12, '#c8d8ff');
}
function scaleGate(p) {
  p.rect(0, 0, 16, 16, '#3a3460');
  p.rect(0, 0, 16, 2, GOLD.b); p.rect(0, 14, 16, 2, GOLD.d);
  p.vline(1, 2, 13, GOLD.d); p.vline(14, 2, 13, GOLD.d);
  // 天びん
  p.vline(8, 3, 12, GOLD.l); p.hline(3, 13, 5, GOLD.l); p.hline(6, 10, 12, GOLD.b);
  p.ellipse(4, 9, 2, 1, GOLD.l); p.ellipse(12, 9, 2, 1, GOLD.l);
  p.set(4, 6, GOLD.b); p.set(4, 7, GOLD.b); p.set(12, 6, GOLD.b); p.set(12, 7, GOLD.b);
  p.set(8, 3, GOLD.hl);
}
export const RACK_FRAMES11B = 2;
function lampRack(p, v, f, empty = false) {
  fPave(p, v);
  p.rect(1, 2, 14, 2, '#8a6a4a'); p.vline(2, 2, 15, '#6a4a2a'); p.vline(13, 2, 15, '#6a4a2a');
  p.set(8, 4, '#4a3a2a'); p.set(8, 5, '#4a3a2a');
  if (empty) {
    p.set(7, 6, '#4a3a2a'); p.set(9, 6, '#4a3a2a');
  } else {
    p.rect(6, 6, 5, 6, f && v % 2 ? GOLD.hl : GOLD.l); p.rect(7, 7, 3, 4, '#ffffff');
    p.hline(6, 10, 12, GOLD.d);
  }
  p.rect(4, 13, 8, 2, '#d8d0b8'); p.hline(5, 10, 14, '#8a8070');
}
export const FOUNT_FRAMES11B = 2;
function fount(p, v, f) {
  fPave(p, v);
  p.ellipse(8, 9, 7, 5, SILVER.b); p.ellipse(8, 9, 6, 4, '#6ab0f0');
  p.vline(8, 2, 8, '#c8e8ff'); p.set(7 + f, 3, '#ffffff'); p.set(9 - f, 4, '#ffffff');
  p.set(5 + f, 10, '#ffffff');
}
function lanternWell(p, v, f) {
  bPave(p, v);
  p.ellipse(8, 10, 7, 5, '#4a3430'); p.ellipse(8, 10, 5, 3, f ? WARM.glow : WARM.hl);
  p.vline(2, 2, 9, '#3a2420'); p.vline(13, 2, 9, '#3a2420'); p.hline(2, 13, 2, '#3a2420');
  p.ellipse(8, 5, 2, 2, f ? '#ff9050' : '#ff8040'); p.set(8, 5, '#ffffff');
}
function dock(p) {
  p.rect(0, 0, 16, 16, '#3a3868');
  p.rect(2, 0, 12, 16, '#c8b0e0');
  for (let y = 3; y < 16; y += 4) p.hline(2, 13, y, '#a890c0');
  p.set(1, 12, '#8a78a8'); p.set(14, 12, '#8a78a8');
}
export const TOWERDOOR_FRAMES11B = 2;
function towerDoor(p, v, f) {
  p.rect(0, 0, 16, 16, SILVER.d);
  p.rect(3, 2, 10, 14, f ? '#fff8d0' : '#ffeeb0');
  p.ellipse(8, 3, 5, 2, f ? '#fff8d0' : '#ffeeb0');
  p.vline(3, 3, 15, GOLD.b); p.vline(12, 3, 15, GOLD.b);
  p.set(8, 6, '#ffffff'); p.set(7 + f, 10, '#ffffff');
}
// ───── 名前の 塔 ─────
function tFloor(p, v, back) {
  const [a, b, c] = back ? ['#5a4458', '#4a3448', '#6a5468'] : ['#d8d4f0', '#c0bce0', '#ecebff'];
  p.rect(0, 0, 16, 16, a);
  p.hline(0, 15, 0, b); p.vline(0, 0, 15, b);
  p.rect(1, 1, 6, 6, c); p.rect(9, 9, 6, 6, c);
  if (back && v % 7 === 0) p.set(5, 11, WARM.hl);
  if (!back && v % 7 === 0) p.set(11, 4, '#ffffff');
}
function tWall(p, v, back) {
  const [a, b, c] = back ? ['#221822', '#120a12', '#3a2a3a'] : ['#8a86b8', '#6a66a0', '#b0acd8'];
  p.rect(0, 0, 16, 16, a);
  p.hline(0, 15, 0, c);
  for (let y = 4; y < 16; y += 4) p.hline(0, 15, y, b);
  for (let y = 0; y < 16; y += 4) p.vline(((y / 4 + v) % 2) * 8 + 3, y + 1, y + 3, b);
}
export const LIGHT_FRAMES11B = 2;
function lightFloor(p, v, f, on) {
  tFloor(p, v, false);
  const c = on ? (f ? GOLD.hl : GOLD.l) : (f ? '#d8f0ff' : '#b8e0ff');
  p.ellipse(8, 8, 6, 5, c);
  p.ellipse(8, 8, 4, 3, on ? '#ffffff' : '#e8f8ff');
  for (let y = 3; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 10) ** 2 + (y - 7) ** 2 <= 9 && (x - 8) ** 2 + (y - 8) ** 2 <= 25) p.set(x, y, on ? GOLD.b : '#8ac0f0');
}
function shutDoor(p) {
  p.rect(0, 0, 16, 16, '#2a1a2a');
  p.rect(2, 1, 12, 15, '#5a3a3a'); for (let x = 4; x < 14; x += 3) p.vline(x, 1, 15, '#4a2a2a');
  p.hline(2, 13, 5, '#3a2424'); p.hline(2, 13, 11, '#3a2424');
  p.rect(7, 7, 3, 3, '#8a8a9a'); p.set(8, 8, '#2a2a2a');
}
function openDoor(p, v) {
  tFloor(p, v, true);
  p.vline(1, 0, 15, '#5a3a3a'); p.vline(14, 0, 15, '#5a3a3a');
  p.rect(2, 0, 12, 2, WARM.glow);
  p.set(7, 7, WARM.glow); p.set(8, 10, WARM.hl);
}
export const LAMP_FRAMES11B = 2;
function lamp(p, v, f, color, on) {
  tFloor(p, v, false);
  p.rect(6, 9, 4, 6, '#6a6690'); p.hline(5, 10, 15, '#4a4670');
  const C = color === 'b' ? [GOLD.b, GOLD.hl, '#8a7040'] : ['#5ab0ff', '#d0f0ff', '#4a5a8a'];
  p.rect(4, 1, 8, 8, on ? C[0] : C[2]);
  p.rect(5, 2, 6, 6, on ? (f ? '#ffffff' : C[1]) : '#3a3a5a');
  p.hline(4, 11, 0, '#3a3660'); p.hline(4, 11, 9, '#3a3660');
  if (on) { p.set(2, 3 + f, C[1]); p.set(13, 2 + f, C[1]); }
}
export const CHASM_FRAMES11B = 2;
function chasm(p, v, f) {
  p.rect(0, 0, 16, 16, '#0a060e');
  const r = prand(v * 23 + 7);
  for (let i = 0; i < 4; i++) p.hline(Math.floor(r() * 10), Math.floor(r() * 10) + 4, (Math.floor(r() * 16) + f * 2) % 16, '#2a1a34');
  if (v % 4 === f) p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#6a4a8a');
}
export const BRIDGE_FRAMES11B = 2;
function shadowBridge(p, v, f) {
  chasm(p, v, f);
  p.rect(2, 0, 12, 16, '#5a4a6a');
  for (let y = 1; y < 16; y += 3) p.hline(2, 13, y, f ? '#8a6a9a' : '#7a5a8a');
  p.vline(2, 0, 15, '#3a2a4a'); p.vline(13, 0, 15, '#3a2a4a');
}
function shelf(p) {
  tFloor(p, 3, false);
  p.rect(0, 0, 16, 14, '#7a6a5a');
  for (const y of [4, 9, 13]) p.hline(0, 15, y, '#5a4a3a');
  for (const [x, y] of [[2, 1], [7, 1], [12, 1], [4, 6], [10, 6], [2, 10], [8, 10], [13, 10]]) { p.rect(x, y, 2, 3, '#4a4a5a'); p.set(x, y, '#8a8a9a'); }
}
function terrace(p, v) {
  p.rect(0, 0, 16, 16, '#e0dcf8');
  p.hline(0, 15, 0, '#c8c4e8'); p.vline(0, 0, 15, '#c8c4e8');
  if (v % 3 === 0) p.set(6, 9, '#ffffff');
}
function rail(p) {
  p.rect(0, 0, 16, 16, '#141836');
  p.set(3, 3, '#ffffff'); p.set(12, 6, '#c8d8ff');
  p.rect(0, 10, 16, 2, SILVER.l); p.rect(0, 14, 16, 2, SILVER.b);
  for (let x = 1; x < 16; x += 4) p.vline(x, 12, 13, SILVER.b);
}
function stairs(p, back) {
  const [a, b, c] = back ? ['#5a4458', '#c89a70', '#8a6a50'] : ['#d8d4f0', '#ffffff', '#b8b4d8'];
  p.rect(0, 0, 16, 16, a);
  for (let i = 0; i < 4; i++) { p.rect(2, 2 + i * 3, 12, 2, b); p.hline(2, 13, 4 + i * 3, c); }
}
function moonRock(p, v) {
  p.rect(0, 0, 16, 16, '#f0e0a0');
  p.hline(0, 15, 15, '#c8b870');
  const r = prand(v * 29 + 3);
  if (v % 3 === 0) { const x = 3 + Math.floor(r() * 9); p.rect(x, 2, 3, 10, '#ffffff'); p.set(x + 1, 1, GOLD.l); p.set(x + 1, 6, '#a8a0d0'); }
  else { p.set(Math.floor(r() * 16), Math.floor(r() * 16), '#fff8d0'); }
}

export const C11B_PAINTERS = {
  [T.C11B_F_PAVE]: (p, v) => fPave(p, v),
  [T.C11B_F_WALL]: (p, v) => fWall(p, v),
  [T.C11B_F_HOUSE]: (p, v) => fHouse(p, v),
  [T.C11B_F_CANAL]: (p, v, f) => fCanal(p, v, f),
  [T.C11B_F_FLOWER]: (p, v) => fFlower(p, v),
  [T.C11B_B_PAVE]: (p, v) => bPave(p, v),
  [T.C11B_B_WALL]: (p, v) => bWall(p, v),
  [T.C11B_B_HOUSE]: (p, v) => bHouse(p, v),
  [T.C11B_B_RUBBLE]: (p, v) => bRubble(p, v),
  [T.C11B_B_LANTERN]: (p, v, f) => bLantern(p, v, f),
  [T.C11B_DOOR]: (p, v, f) => door(p, v, f),
  [T.C11B_SCALEGATE]: (p) => scaleGate(p),
  [T.C11B_LAMPRACK]: (p, v, f) => lampRack(p, v, f),
  [T.C11B_LAMPHOOK]: (p, v) => lampRack(p, v, 0, true),
  [T.C11B_FOUNT]: (p, v, f) => fount(p, v, f),
  [T.C11B_LANTERNWELL]: (p, v, f) => lanternWell(p, v, f),
  [T.C11B_DOCK]: (p) => dock(p),
  [T.C11B_TOWERDOOR]: (p, v, f) => towerDoor(p, v, f),
  [T.C11B_T_FLOOR_F]: (p, v) => tFloor(p, v, false),
  [T.C11B_T_WALL_F]: (p, v) => tWall(p, v, false),
  [T.C11B_T_FLOOR_B]: (p, v) => tFloor(p, v, true),
  [T.C11B_T_WALL_B]: (p, v) => tWall(p, v, true),
  [T.C11B_LIGHTFLOOR]: (p, v, f) => lightFloor(p, v, f, false),
  [T.C11B_LIGHTFLOOR_ON]: (p, v, f) => lightFloor(p, v, f, true),
  [T.C11B_SHUTDOOR]: (p) => shutDoor(p),
  [T.C11B_OPENDOOR]: (p, v) => openDoor(p, v),
  [T.C11B_LAMP_A]: (p, v) => lamp(p, v, 0, 'a', false),
  [T.C11B_LAMP_A_ON]: (p, v, f) => lamp(p, v, f, 'a', true),
  [T.C11B_LAMP_B]: (p, v) => lamp(p, v, 0, 'b', false),
  [T.C11B_LAMP_B_ON]: (p, v, f) => lamp(p, v, f, 'b', true),
  [T.C11B_CHASM]: (p, v, f) => chasm(p, v, f),
  [T.C11B_SHADOWBRIDGE]: (p, v, f) => shadowBridge(p, v, f),
  [T.C11B_SHELF]: (p) => shelf(p),
  [T.C11B_TERRACE]: (p, v) => terrace(p, v),
  [T.C11B_RAIL]: (p) => rail(p),
  [T.C11B_MOONROCK]: (p, v) => moonRock(p, v),
  [T.C11B_T_STAIRS_F]: (p) => stairs(p, false),
  [T.C11B_T_STAIRS_B]: (p) => stairs(p, true),
};
export const C11B_FRAMES = {
  [T.C11B_F_CANAL]: CANAL_FRAMES11B, [T.C11B_B_LANTERN]: LANTERN_FRAMES11B, [T.C11B_DOOR]: DOOR_FRAMES11B, [T.C11B_LAMPRACK]: RACK_FRAMES11B,
  [T.C11B_FOUNT]: FOUNT_FRAMES11B, [T.C11B_LANTERNWELL]: FOUNT_FRAMES11B, [T.C11B_TOWERDOOR]: TOWERDOOR_FRAMES11B,
  [T.C11B_LIGHTFLOOR]: LIGHT_FRAMES11B, [T.C11B_LIGHTFLOOR_ON]: LIGHT_FRAMES11B, [T.C11B_LAMP_A_ON]: LAMP_FRAMES11B, [T.C11B_LAMP_B_ON]: LAMP_FRAMES11B,
  [T.C11B_CHASM]: CHASM_FRAMES11B, [T.C11B_SHADOWBRIDGE]: BRIDGE_FRAMES11B,
};
export const C11B_SPEED = {
  [T.C11B_F_CANAL]: 700, [T.C11B_B_LANTERN]: 600, [T.C11B_DOOR]: 700, [T.C11B_LAMPRACK]: 900, [T.C11B_FOUNT]: 500, [T.C11B_LANTERNWELL]: 600,
  [T.C11B_TOWERDOOR]: 800, [T.C11B_LIGHTFLOOR]: 600, [T.C11B_LIGHTFLOOR_ON]: 500, [T.C11B_LAMP_A_ON]: 450, [T.C11B_LAMP_B_ON]: 450,
  [T.C11B_CHASM]: 1100, [T.C11B_SHADOWBRIDGE]: 700,
};

// ───── 2.5D ─────
// 水路と かげの 谷は ひくい（谷は ずっと 下）。かげの 橋は 谷の 上に うかぶ
export const C11B_FLOOR_H = {
  [T.C11B_F_CANAL]: -0.3, [T.C11B_CHASM]: -1.0, [T.C11B_SHADOWBRIDGE]: -0.02, [T.C11B_DOOR]: 0.01, [T.C11B_LIGHTFLOOR]: 0.02, [T.C11B_LIGHTFLOOR_ON]: 0.02,
};
export function c11bBlockSpec(id, v) {
  const t = (k = 0) => ['t', id, v, k];
  switch (id) {
    case T.C11B_F_WALL: case T.C11B_B_WALL: return { h: 1.4, top: t(), side: t() };
    case T.C11B_F_HOUSE: return { h: 1.3, top: ['t', T.C11B_F_HOUSE, 0, 0], side: t() };
    case T.C11B_B_HOUSE: return { h: 1.1, top: ['t', T.C11B_B_HOUSE, 0, 0], side: t() };
    case T.C11B_B_RUBBLE: return { h: 0.6, top: t(), side: t() };
    case T.C11B_F_FLOWER: return { h: 0.25, top: t(), side: ['t', T.C11B_F_WALL, v, 0] };
    case T.C11B_SCALEGATE: return { h: 1.9, top: ['t', T.C11B_F_WALL, v, 0], side: t() };
    case T.C11B_T_WALL_F: case T.C11B_T_WALL_B: return { h: 1.5, top: t(), side: t() };
    case T.C11B_SHUTDOOR: return { h: 1.3, top: ['t', T.C11B_T_WALL_B, v, 0], side: t() };
    case T.C11B_SHELF: return { h: 1.2, top: ['t', T.C11B_T_WALL_F, v, 0], side: t() };
    case T.C11B_MOONROCK: return { h: 0.9, top: t(), side: t() };
    case T.C11B_RAIL: return { h: 0.45, top: ['t', T.C11B_TERRACE, v, 0], side: t() };
    default: return null;
  }
}
const prop = (fn) => [16, 20, fn];
export const C11B_PROPS = {
  [T.C11B_B_LANTERN]: prop((p) => { p.vline(8, 0, 5, '#3a2420'); p.ellipse(8, 11, 5, 6, '#ff7030'); p.ellipse(8, 11, 3, 4, WARM.hl); p.set(8, 11, '#ffffff'); p.hline(4, 12, 5, '#2a1a18'); p.hline(4, 12, 17, '#2a1a18'); }),
  [T.C11B_LAMPRACK]: prop((p) => { p.rect(1, 2, 14, 2, '#8a6a4a'); p.vline(2, 2, 19, '#6a4a2a'); p.vline(13, 2, 19, '#6a4a2a'); p.rect(6, 6, 5, 7, GOLD.l); p.rect(7, 7, 3, 5, '#ffffff'); }),
  [T.C11B_LAMPHOOK]: prop((p) => { p.rect(1, 2, 14, 2, '#8a6a4a'); p.vline(2, 2, 19, '#6a4a2a'); p.vline(13, 2, 19, '#6a4a2a'); p.set(8, 4, '#4a3a2a'); p.set(8, 5, '#4a3a2a'); p.set(7, 6, '#4a3a2a'); p.set(9, 6, '#4a3a2a'); }),
  [T.C11B_FOUNT]: [16, 16, (p) => { p.ellipse(8, 11, 7, 4, SILVER.b); p.ellipse(8, 10, 6, 3, '#6ab0f0'); p.vline(8, 2, 9, '#c8e8ff'); p.set(8, 2, '#ffffff'); }],
  [T.C11B_LANTERNWELL]: [16, 18, (p) => { p.ellipse(8, 13, 7, 4, '#4a3430'); p.ellipse(8, 13, 5, 2, WARM.hl); p.vline(2, 2, 12, '#3a2420'); p.vline(13, 2, 12, '#3a2420'); p.hline(2, 13, 2, '#3a2420'); p.ellipse(8, 6, 2, 2, '#ff8040'); }],
  [T.C11B_LAMP_A]: prop((p) => { p.rect(6, 10, 4, 9, '#6a6690'); p.rect(4, 2, 8, 8, '#4a5a8a'); p.rect(5, 3, 6, 6, '#3a3a5a'); }),
  [T.C11B_LAMP_A_ON]: prop((p) => { p.rect(6, 10, 4, 9, '#6a6690'); p.rect(4, 2, 8, 8, '#5ab0ff'); p.rect(5, 3, 6, 6, '#d0f0ff'); p.set(8, 5, '#ffffff'); p.set(1, 1, '#d0f0ff'); p.set(14, 2, '#d0f0ff'); }),
  [T.C11B_LAMP_B]: prop((p) => { p.rect(6, 10, 4, 9, '#6a6690'); p.rect(4, 2, 8, 8, '#8a7040'); p.rect(5, 3, 6, 6, '#3a3a5a'); }),
  [T.C11B_LAMP_B_ON]: prop((p) => { p.rect(6, 10, 4, 9, '#6a6690'); p.rect(4, 2, 8, 8, GOLD.b); p.rect(5, 3, 6, 6, GOLD.hl); p.set(8, 5, '#ffffff'); p.set(1, 1, GOLD.hl); p.set(14, 2, GOLD.hl); }),
};
export const C11B_PROPS_KEEP = new Set(Object.keys(C11B_PROPS).map(Number));
export const C11B_THEMES = {};
