// 第5章「星の塔」の タイル（16×16 ドット）と 塔の 色（テーマ）
// ・星空の ゆか・星座の ゆかの 星（光らない／夜に 光る／ふんで 光った）・上り下りの ゆか（下・通り道・上がって 止まった）・重りの ゆか
// ・風（東へ ふく）・風の 窓（ふいている／しまった）・風見の石（回す まえ／あと）・ふきぬけ・星の エレベーター（光っていない／光っている）
// ・星空の 窓・昔の 勇者の かべ画・星図・休み所の 星の いずみ・星の とびら
// ・フィールドの 塔の とびら（しまっている／開いた）・塔の 土台・てっぺんの ゆかと 石がき・紋章の さいだん・1階の 出口
// render/tiles.js が まぜる。2.5D は render/field3d.js（towerBlockSpec・TOWER_FLOOR_H）と render/tex3d.js（TOWER_PROPS）
// テーマ（star_tower … 1〜3階の 石・star_tower_mid … 4〜6階の あい色・star_tower_high … 7〜8階と てっぺんの 夜空の 色）は render/themes.js
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす（towerMask）
import { T } from '../../shared/tiles.js?v=6c1c54262b5a';
import { prand, shade } from './pixel.js?v=6c1c54262b5a';

// 塔の 石（あおみの ある 灰色）・夜空・星・金
const ST = { base: '#6e7488', light: '#8e94aa', dark: '#525870', line: '#424760' };
const SKY = { deep: '#141a44', mid: '#202a62', light: '#34408a' };
const STAR = { w: '#ffffff', y: '#fff4b0', b: '#c8d8ff', g: '#ffd84a' };
const GOLD = { g: '#e8c050', gl: '#fff0a0', gd: '#a8842a' };

function stone(p, v, base = ST.base) {
  p.rect(0, 0, 16, 16, base);
  const r = prand(v * 53 + 11);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? shade(base, -0.1) : shade(base, 0.1));
  p.hline(0, 15, 0, shade(base, -0.22));
  p.vline(v & 1 ? 0 : 8, 1, 7, shade(base, -0.22));
  p.hline(0, 15, 8, shade(base, -0.18));
  p.vline(v & 2 ? 4 : 12, 9, 15, shade(base, -0.22));
  p.hline(1, 15, 1, shade(base, 0.12));
}

// 星空の もようの ゆか（こい あい色に 小さな 星）
function paintSkyFloor(p, v) {
  p.rect(0, 0, 16, 16, SKY.mid);
  const r = prand(v * 31 + 7);
  for (let i = 0; i < 14; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? SKY.deep : SKY.light);
  for (let i = 0; i < 3; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i ? STAR.b : STAR.w);
  p.hline(0, 15, 15, shade(SKY.mid, -0.2));
  p.vline(15, 0, 15, shade(SKY.mid, -0.2));
}

// 星座の ゆかの 星（kind: 'dim' 光らない・'glow' 夜に 光る・'lit' ふんで 光った）
function starPoint(p, cx, cy, r, c, core) {
  for (let i = -r; i <= r; i++) { p.set(cx + i, cy, c); p.set(cx, cy + i, c); }
  p.set(cx - 1, cy - 1, c); p.set(cx + 1, cy - 1, c); p.set(cx - 1, cy + 1, c); p.set(cx + 1, cy + 1, c);
  p.set(cx, cy, core);
}
function paintStar(p, v, f, kind) {
  paintSkyFloor(p, v);
  // 星の 台（まるい 石の もよう）
  p.ellipse(8, 8, 6, 6, '#3a4486');
  p.ellipse(8, 8, 5, 5, '#2a3270');
  if (kind === 'dim') { starPoint(p, 8, 8, 3, '#8a94c8', '#b8c0e8'); return; }
  const big = kind === 'lit' ? 5 : 4 + (f % 2);
  const c = kind === 'lit' ? STAR.g : STAR.b;
  p.ellipse(8, 8, 5, 5, kind === 'lit' ? '#6a5a2a' : '#3a4aa0');
  starPoint(p, 8, 8, big, c, STAR.w);
  if (f % 2) { p.set(2, 3, STAR.w); p.set(13, 12, STAR.y); } else { p.set(13, 3, STAR.w); p.set(3, 12, STAR.y); }
}
export const STAR_FRAMES = 2;

// 上り下りの ゆか（下に ある。金の わくの 石の 板・まん中に 星の もよう）
function liftPlate(p, up) {
  p.rect(1, 1, 14, 14, GOLD.gd);
  p.rect(2, 2, 12, 12, up ? '#d8c07a' : '#c8b06a');
  p.hline(2, 13, 2, GOLD.gl); p.vline(2, 2, 13, GOLD.gl);
  p.hline(3, 13, 13, shade('#c8b06a', -0.25));
  starPoint(p, 8, 8, 2, up ? '#ffffff' : '#a8842a', up ? STAR.y : '#fff0a0');
}
function paintLift(p, v) {
  stone(p, v, ST.dark);
  liftPlate(p, false);
  // ゆかの 下の くさり
  p.set(1, 0, '#8a8a9a'); p.set(14, 0, '#8a8a9a');
}
// 通り道（下に ゆかが ある あいだは 高い だん。たての レールと くさり）
function paintLiftShaft(p, v) {
  stone(p, v, ST.dark);
  p.rect(3, 0, 10, 16, '#2a2e44');
  p.vline(3, 0, 15, '#8a8a9a'); p.vline(12, 0, 15, '#8a8a9a');
  p.vline(4, 0, 15, '#5a5a6a'); p.vline(11, 0, 15, '#5a5a6a');
  for (let y = 1; y < 16; y += 3) { p.set(7, y, '#9a9aaa'); p.set(8, y + 1, '#9a9aaa'); }
}
// 上がって 止まった ゆか（だんを つなぐ 金の ゆか。上り下りできる）
function paintLiftUp(p, v) {
  stone(p, v, ST.dark);
  p.rect(2, 0, 12, 16, GOLD.gd);
  p.rect(3, 0, 10, 16, '#d8c07a');
  for (let y = 2; y < 16; y += 4) p.hline(3, 12, y, shade('#d8c07a', -0.2));
  p.vline(3, 0, 15, GOLD.gl);
  starPoint(p, 8, 8, 1, '#ffffff', STAR.y);
}
// 重りの ゆか（四角い 鉄の 板。しずむと 金色に 光る）
function paintWeight(p, v, on) {
  stone(p, v);
  p.rect(2, 2, 12, 12, '#3a3e50');
  p.rect(3, 3, 10, 10, on ? '#e8c050' : '#7a7e98');
  if (!on) { p.hline(3, 12, 3, '#9a9eb8'); p.vline(3, 3, 12, '#9a9eb8'); }
  else { p.rect(4, 4, 8, 8, '#fff0a0'); }
  // 重りの しるし（下むきの 矢じるし）
  const c = on ? '#a8842a' : '#4a4e68';
  p.vline(8, 5, 10, c); p.hline(6, 10, 9, c); p.hline(7, 9, 10, c); p.set(8, 11, c);
}

// 風（東へ ふく 強い 風。白い すじが 流れる）
export const WIND_FRAMES = 4;
function paintWind(p, v, f) {
  stone(p, v, '#7a8aa8');
  const k = (f % WIND_FRAMES) * 4;
  const r = prand(v * 7 + 3);
  for (let i = 0; i < 4; i++) {
    const y = 2 + i * 4 + Math.floor(r() * 2);
    const x0 = (k + i * 5 + Math.floor(r() * 4)) % 16;
    for (let j = 0; j < 6; j++) p.set((x0 + j) % 16, y, j > 3 ? '#ffffff' : '#c8e8f8');
  }
}
// 風の 窓（かべの 窓。ふきこむ 風が 見える）・しまった 窓（木の よろい戸）
function windowFrame(p, v) {
  stone(p, v, ST.dark);
  p.rect(3, 2, 10, 12, '#2a2e44');
  p.hline(3, 12, 2, ST.light); p.vline(3, 2, 13, ST.light);
}
function paintWindWindow(p, v, f) {
  windowFrame(p, v);
  p.rect(4, 3, 8, 10, SKY.light);
  for (let i = 0; i < 3; i++) {
    const y = 4 + i * 3;
    const x0 = 4 + ((f + i) % 3);
    p.hline(x0, Math.min(11, x0 + 4), y, '#e8f8ff');
  }
}
function paintWindShut(p, v) {
  windowFrame(p, v);
  p.rect(4, 3, 8, 10, '#7a5a3a');
  for (let y = 4; y < 13; y += 2) p.hline(4, 11, y, '#5a3e26');
  p.vline(8, 3, 12, '#4a3020');
}
// 風見の石（石の 台の 上に 金の 矢じるし。回すと 青く 光る）
function paintVane(p, v, on) {
  stone(p, v);
  p.ellipse(8, 12, 5.5, 2.6, ST.line);
  p.rect(4, 7, 8, 6, '#8a90a8'); p.hline(4, 11, 7, '#aab0c8');
  p.vline(8, 1, 7, '#5a5a6a');
  const c = on ? '#7ae8ff' : GOLD.g;
  if (on) { p.hline(4, 12, 2, c); p.set(12, 1, c); p.set(12, 3, c); p.set(13, 2, c); }
  else { p.vline(8, 0, 5, c); p.set(7, 1, c); p.set(9, 1, c); p.set(8, 0, GOLD.gl); }
}
// ふきぬけ（下は まっくら。ふちに 石）
function paintWindPit(p, v) {
  p.rect(0, 0, 16, 16, '#0a0c1e');
  const r = prand(v * 17 + 5);
  for (let i = 0; i < 4; i++) p.set(Math.floor(r() * 16), 4 + Math.floor(r() * 12), '#1a1e3a');
  p.hline(0, 15, 0, '#2a2e48');
}
// 星の エレベーター（ゆかの まるい 金の わく。光ると 青白い 光が のぼる）
export const EV_FRAMES = 4;
function evBase(p, v, lit) {
  stone(p, v);
  p.ellipse(8, 8, 7, 6, GOLD.gd);
  p.ellipse(8, 8, 6, 5, lit ? '#2a4a7a' : '#4a4e60');
  p.ellipse(8, 8, 4, 3, lit ? '#7ae8ff' : '#6a7080');
  starPoint(p, 8, 8, 2, lit ? '#ffffff' : '#9aa0b0', lit ? STAR.y : '#c8ccd8');
}
const paintElevator = (p, v) => evBase(p, v, false);
function paintElevatorLit(p, v, f) {
  evBase(p, v, true);
  const k = f % EV_FRAMES;
  for (let i = 0; i < 3; i++) p.set(4 + i * 4, 12 - ((k + i * 2) % 8), '#e8fcff');
}
// 星空の 窓（かべに まるい 窓。外は 夜空と 星）
function paintStarWindow(p, v) {
  stone(p, v, ST.dark);
  p.ellipse(8, 7, 5.5, 6, ST.light);
  p.ellipse(8, 7, 4.5, 5, SKY.deep);
  const r = prand(v * 13 + 1);
  for (let i = 0; i < 4; i++) p.set(5 + Math.floor(r() * 7), 3 + Math.floor(r() * 8), i ? STAR.b : STAR.w);
  p.vline(8, 2, 12, ST.dark); p.hline(4, 12, 7, ST.dark);
}
// 昔の 勇者の かべ画（m … 2=東 8=西 も かべ画。4まいで 1まいの 絵: 塔・勇者・光の まく・空の 島）
function paintTowerMural(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#5a5470');
  p.rect(1, 2, 14, 12, '#d8cca8');
  p.hline(1, 14, 2, '#f0e6c8');
  const k = v % 4;
  if (k === 0) {
    // 塔
    p.rect(6, 5, 4, 9, '#8a8aa0'); p.rect(7, 3, 2, 2, '#8a8aa0'); p.set(8, 6, '#3a3a5a'); p.set(8, 9, '#3a3a5a');
  } else if (k === 1) {
    // 紋章を かかげる 勇者たち
    for (const x of [3, 7, 11]) { p.rect(x, 9, 2, 4, '#4a6ab8'); p.rect(x, 7, 2, 2, '#e8c8a0'); p.set(x + 1, 5, GOLD.g); p.set(x + 1, 6, '#e8c8a0'); }
  } else if (k === 2) {
    // 光の まく（天のとばり）
    p.hline(2, 13, 6, '#b8d8ff'); p.hline(3, 12, 5, '#e8f4ff'); p.hline(5, 10, 7, '#7ab0f0');
    starPoint(p, 8, 10, 2, GOLD.g, '#ffffff');
  } else {
    // 空の 島
    p.ellipse(8, 8, 5, 2, '#5ab85a'); p.ellipse(8, 10, 3.5, 2, '#8a6a4a'); p.set(8, 12, '#8a6a4a');
    p.hline(2, 5, 5, '#ffffff'); p.hline(11, 14, 4, '#ffffff');
  }
  if (!(m & 8)) p.vline(0, 0, 15, '#3a3450');
  if (!(m & 2)) p.vline(15, 0, 15, '#3a3450');
  p.hline(0, 15, 15, '#3a3450');
}
// 星図（3まいで 1まいの 絵。竜の 星座の 5つの 星を 線で つなぐ。m … 2=東 8=西 も 星図）
// 星の ならびは 5階の 星座の ゆか（maps/tower-rows.js の STAR_ORDER）と おなじ 形
const CHART_STARS = [[3, 4], [15, 8], [27, 4], [39, 10], [45, 13]];
function paintStarChart(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#2a2e50');
  p.rect(0, 1, 16, 14, SKY.deep);
  p.hline(0, 15, 1, '#c8a050'); p.hline(0, 15, 14, '#c8a050');
  const part = (m & 8) ? ((m & 2) ? 1 : 2) : 0; // 0 … 左・1 … まん中・2 … 右
  const ox = part * 16;
  // 線（となりの 星を つなぐ）
  for (let i = 0; i + 1 < CHART_STARS.length; i++) {
    const [ax, ay] = CHART_STARS[i], [bx, by] = CHART_STARS[i + 1];
    const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
    for (let s = 0; s <= n; s++) {
      const x = Math.round(ax + ((bx - ax) * s) / n) - ox, y = Math.round(ay + ((by - ay) * s) / n);
      if (x >= 0 && x < 16 && s % 2 === 0) p.set(x, y, '#5a6ab8');
    }
  }
  CHART_STARS.forEach(([x, y], i) => {
    const cx = x - ox;
    if (cx < -2 || cx > 17) return;
    starPoint(p, cx, y, i === 0 ? 2 : 1, i === 0 ? GOLD.g : STAR.b, STAR.w);
  });
  if (!(m & 8)) p.vline(0, 1, 14, '#c8a050');
  if (!(m & 2)) p.vline(15, 1, 14, '#c8a050');
}
// 休み所の 星の いずみ（石の ふちの 中で 星が きらめく 水）
export const FONT_FRAMES = 3;
function paintStarFont(p, v, f) {
  stone(p, v);
  p.ellipse(8, 9, 7, 6, '#8a90a8');
  p.ellipse(8, 9, 6, 5, '#2a4a8a');
  p.ellipse(8, 9, 5, 4, '#3a6ac8');
  const k = f % FONT_FRAMES;
  for (const [x, y, d] of [[5, 8, 0], [10, 10, 1], [8, 7, 2], [7, 11, 1]]) if ((d + k) % 3) p.set(x, y, (d + k) % 2 ? STAR.w : STAR.y);
  p.hline(4, 12, 4, ST.light);
}
// 星の とびら（光の 線で できた とびら）
function paintStarDoor(p, v) {
  stone(p, v, ST.dark);
  p.rect(2, 1, 12, 15, '#3a3a7a');
  p.rect(3, 2, 10, 14, '#5a5aa0');
  p.vline(8, 2, 15, '#2a2a5a');
  for (const [x, y] of [[5, 5], [11, 6], [6, 10], [10, 12], [8, 3]]) p.set(x, y, STAR.b);
  starPoint(p, 8, 8, 2, GOLD.g, '#ffffff');
}
// フィールド: 塔の とびら（しまっている。まん中に 紋章の くぼみ）・開いた とびら（中は くらい）・塔の 土台の 石
function paintTowerDoor(p, v) {
  stone(p, v, '#8a8a9a');
  p.rect(3, 2, 10, 14, '#5a5a6e');
  p.rect(4, 3, 8, 13, '#7a7a8e');
  p.vline(8, 3, 15, '#4a4a5e');
  p.ellipse(8, 8, 2.5, 2.5, '#3a3a50');
  starPoint(p, 8, 8, 1, '#9a9ab8', '#c8c8e0');
}
function paintTowerGate(p, v) {
  stone(p, v, '#8a8a9a');
  p.rect(3, 2, 10, 14, '#141420');
  p.rect(4, 3, 8, 13, '#20203a');
  for (let i = 0; i < 4; i++) p.hline(4, 11, 6 + i * 3, shade('#4a4a6a', -i * 0.1));
}
function paintTowerBase(p, v) {
  stone(p, v, '#9a9aaa');
  p.hline(0, 15, 12, '#6a6a7a');
}
// 1階の 出口（明るい 外が 見える）
function paintTowerExit(p, v) {
  stone(p, v);
  p.rect(2, 4, 12, 12, '#3a6a3a');
  p.rect(3, 5, 10, 11, '#6aa84a');
  p.hline(3, 12, 5, '#a8d878');
}
// てっぺんの ゆか（あおい 石だたみ・ところどころ 星の もよう）と ふちの 石がき
function paintTopFloor(p, v) {
  stone(p, v, '#6a70a8');
  if (v % 3 === 0) starPoint(p, 8, 4, 1, '#a8b0e8', '#d8dcff');
}
function paintTopEdge(p, v) {
  p.rect(0, 0, 16, 16, SKY.deep);
  const r = prand(v * 41 + 9);
  for (let i = 0; i < 5; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 9), i ? STAR.b : STAR.w);
  p.rect(0, 9, 16, 7, '#4a4e7a');
  p.hline(0, 15, 9, '#7a7eb0');
  p.rect(2, 7, 4, 2, '#4a4e7a'); p.rect(10, 7, 4, 2, '#4a4e7a'); p.hline(2, 5, 7, '#7a7eb0'); p.hline(10, 13, 7, '#7a7eb0');
}
// 紋章の さいだん（金の ふちの 台に 紋章の 星）
function paintCrestAltar(p, v) {
  paintTopFloor(p, v);
  p.rect(2, 5, 12, 10, '#5a5a8a');
  p.rect(3, 4, 10, 10, '#8a8ac8');
  p.hline(3, 12, 4, '#b8b8e8');
  p.ellipse(8, 9, 4, 3.5, GOLD.gd);
  starPoint(p, 8, 9, 3, GOLD.g, '#ffffff');
}

export const TOWER_PAINTERS = {
  [T.SKY_FLOOR]: paintSkyFloor,
  [T.STAR_DIM]: (p, v, f) => paintStar(p, v, f, 'dim'), [T.STAR_GLOW]: (p, v, f) => paintStar(p, v, f, 'glow'), [T.STAR_LIT]: (p, v, f) => paintStar(p, v, f, 'lit'),
  [T.LIFT]: paintLift, [T.LIFT_SHAFT]: paintLiftShaft, [T.LIFT_UP]: paintLiftUp,
  [T.WEIGHT]: (p, v) => paintWeight(p, v, false), [T.WEIGHT_ON]: (p, v) => paintWeight(p, v, true),
  [T.WIND_E]: paintWind, [T.WIND_WINDOW]: paintWindWindow, [T.WIND_SHUT]: paintWindShut,
  [T.VANE]: (p, v) => paintVane(p, v, false), [T.VANE_ON]: (p, v) => paintVane(p, v, true), [T.WIND_PIT]: paintWindPit,
  [T.ELEVATOR]: paintElevator, [T.ELEVATOR_LIT]: paintElevatorLit,
  [T.STAR_WINDOW]: paintStarWindow, [T.TOWER_MURAL]: paintTowerMural, [T.STAR_CHART]: paintStarChart, [T.STAR_FONT]: paintStarFont, [T.STAR_DOOR]: paintStarDoor,
  [T.TOWER_DOOR]: paintTowerDoor, [T.TOWER_GATE]: paintTowerGate, [T.TOWER_BASE]: paintTowerBase,
  [T.TOP_FLOOR]: paintTopFloor, [T.TOP_EDGE]: paintTopEdge, [T.CREST_ALTAR]: paintCrestAltar, [T.TOWER_EXIT]: paintTowerExit,
};
export const TOWER_FRAMES = {
  [T.STAR_GLOW]: STAR_FRAMES, [T.STAR_LIT]: STAR_FRAMES, [T.WIND_E]: WIND_FRAMES, [T.WIND_WINDOW]: 3, [T.ELEVATOR_LIT]: EV_FRAMES, [T.STAR_FONT]: FONT_FRAMES,
};
export const TOWER_SPEED = { [T.STAR_GLOW]: 600, [T.STAR_LIT]: 400, [T.WIND_E]: 90, [T.WIND_WINDOW]: 160, [T.ELEVATOR_LIT]: 220, [T.STAR_FONT]: 300 };
// 色を かえない タイル（render/themes.js。塔の 色で かいてある）
export const TOWER_TILES = Object.keys(TOWER_PAINTERS).map(Number);
// まえの かおが ある かべ（render/tiles.js の WALLS）
export const TOWER_WALLS = [T.STAR_WINDOW, T.TOWER_MURAL, T.STAR_CHART, T.WIND_WINDOW, T.WIND_SHUT, T.STAR_DOOR, T.LIFT_SHAFT];

// となりの ようす（render/tiles.js の prepareMap から）。あてはまらない ときは -1
export function towerMask(t, at, x, y) {
  if (t === T.TOWER_MURAL || t === T.STAR_CHART) return (at(x + 1, y) === t ? 2 : 0) | (at(x - 1, y) === t ? 8 : 0);
  return -1;
}
// かべ画は 4まいで 1まいの 絵（左から じゅんに 塔・勇者・光の まく・空の 島）
export function towerVariant(t, at, x, y, v) {
  if (t !== T.TOWER_MURAL) return v;
  let i = 0;
  while (at(x - i - 1, y) === T.TOWER_MURAL) i++;
  return i % 4;
}

// ───── 2.5D（render/field3d.js）─────
// ゆかの 高さ: ふきぬけは ふかく、上がった ゆかは 少し 高い
export const TOWER_FLOOR_H = { [T.WIND_PIT]: -1.3, [T.LIFT_UP]: 0.08, [T.TOWER_GATE]: -0.05 };
// かべに なる タイル（高さと え。field3d.js の blockSpec）
export function towerBlockSpec(id, v) {
  switch (id) {
    case T.STAR_WINDOW: case T.TOWER_MURAL: case T.STAR_CHART: case T.WIND_WINDOW: case T.WIND_SHUT: case T.STAR_DOOR: case T.LIFT_SHAFT:
      return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', id, v, 0] };
    case T.TOWER_DOOR: return { h: 1.4, top: ['t', T.TOWER_BASE, v, 0], side: ['t', T.TOWER_BASE, v, 0], south: ['t', T.TOWER_DOOR, 0, 0] };
    case T.TOWER_BASE: return { h: 1.4, top: ['t', T.TOWER_BASE, v, 0], side: ['t', T.TOWER_BASE, v, 0] };
    case T.TOP_EDGE: return { h: 0.55, top: ['t', T.TOP_FLOOR, v, 0], side: ['t', T.TOP_EDGE, v, 0] };
    default: return null;
  }
}

// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）: 風見の石・星の いずみ・紋章の さいだん
function vaneProp(on) {
  return [16, 22, (p) => {
    p.rect(4, 14, 8, 8, '#6a7088'); p.rect(4, 13, 8, 8, '#8a90a8'); p.hline(4, 11, 13, '#aab0c8');
    p.vline(8, 3, 13, '#5a5a6a');
    const c = on ? '#7ae8ff' : GOLD.g;
    if (on) { p.hline(3, 13, 4, c); p.set(13, 3, c); p.set(13, 5, c); p.set(14, 4, c); p.hline(3, 5, 3, c); }
    else { p.vline(8, 0, 6, c); p.set(7, 1, c); p.set(9, 1, c); p.set(6, 2, c); p.set(10, 2, c); }
  }];
}
export const TOWER_PROPS = {
  [T.VANE]: vaneProp(false),
  [T.VANE_ON]: vaneProp(true),
  [T.STAR_FONT]: [16, 14, (p) => {
    p.ellipse(8, 9, 7.5, 4.5, '#6a7088'); p.ellipse(8, 8, 7, 4, '#8a90a8');
    p.ellipse(8, 8, 5.5, 3, '#3a6ac8'); p.set(6, 7, STAR.w); p.set(10, 8, STAR.y); p.set(8, 9, STAR.w);
    p.set(8, 2, STAR.b); p.set(5, 4, STAR.w); p.set(11, 3, STAR.y);
  }],
  [T.CREST_ALTAR]: [16, 18, (p) => {
    p.rect(2, 8, 12, 10, '#5a5a8a'); p.rect(3, 7, 10, 10, '#8a8ac8'); p.hline(3, 12, 7, '#b8b8e8');
    p.ellipse(8, 3.5, 3.5, 3.5, GOLD.gd);
    starPoint(p, 8, 3, 3, GOLD.g, '#ffffff');
  }],
};

// ───── 塔の 色（render/themes.js の THEMES に まぜる。明るさを たもって 色だけ かえる）─────
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const G = (...stops) => stops.map(([p, h]) => [p, hex(h)]);
export const TOWER_THEMES = {
  // 1〜3階: あおみの ある 灰色の 石・だいだいの たいまつ
  star_tower: {
    floor: G([0, '#14161e'], [0.15, '#2e3242'], [0.3, '#4a5064'], [0.5, '#6e7488'], [0.75, '#a4aac0'], [1, '#f4f6ff']),
    wall: G([0, '#0c0e14'], [0.15, '#1e2230'], [0.3, '#363c50'], [0.5, '#545a72'], [1, '#d0d4e8']),
    water: G([0, '#0a1a3a'], [0.35, '#2a5aa8'], [0.7, '#7ab0f0'], [1, '#ffffff']),
    gem: G([0, '#2a2a6a'], [0.5, '#a8b8ff'], [1, '#ffffff']),
    flame: null,
  },
  // 4〜6階: あい色の 石（星空に ちかづく）・青白い たいまつ
  star_tower_mid: {
    floor: G([0, '#0c0e22'], [0.15, '#1e2448'], [0.3, '#323c70'], [0.5, '#4e5a98'], [0.75, '#8a96d0'], [1, '#f0f2ff']),
    wall: G([0, '#06081a'], [0.15, '#141a3a'], [0.3, '#242c5a'], [0.5, '#3a4482'], [1, '#c0c8f4']),
    water: G([0, '#0a0a3a'], [0.35, '#2a3aa8'], [0.7, '#8a9af0'], [1, '#ffffff']),
    gem: G([0, '#2a2a6a'], [0.5, '#c8d0ff'], [1, '#ffffff']),
    flame: G([0, '#3a4aaa'], [0.5, '#a8c0ff'], [1, '#ffffff']),
  },
  // 7〜8階・てっぺん: 夜空の こい あい色と むらさき・金色の たいまつ
  star_tower_high: {
    floor: G([0, '#08061a'], [0.15, '#181238'], [0.3, '#2a2260'], [0.5, '#443a8a'], [0.75, '#7a70c8'], [1, '#f4f0ff']),
    wall: G([0, '#040312'], [0.15, '#0e0a2a'], [0.3, '#1c164a'], [0.5, '#2e2670'], [1, '#b8b0f0']),
    water: G([0, '#0a0a3a'], [0.35, '#3a2aa8'], [0.7, '#a89af0'], [1, '#ffffff']),
    gem: G([0, '#4a3a08'], [0.5, '#f0d060'], [1, '#fff8d0']),
    flame: G([0, '#8a6a10'], [0.5, '#ffd84a'], [1, '#fff8d0']),
  },
};
