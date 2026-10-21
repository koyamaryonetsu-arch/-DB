// 古代の大迷宮（第4章クリアの あとの より道）の タイル（16×16 ドット）
// ・古代の 大きな 石だたみ（馬車の わだちの あと）・砂の海の 小島の 門（下りかいだん）と 砂に うもれた 門
// ・休み所の 聖なる 火・転送の門（光っている／まだ 光っていない）・古代の 石の とびら・古代の かべ画・竜の ほね
// render/tiles-ch4.js が まぜる。2.5D は render/field3d.js（labBlockSpec）と render/tex3d.js（LAB_PROPS）
// (p, v, f, m) … Painter / ちがい / アニメの コマ / となりの ようす
import { T } from '../../shared/tiles.js?v=848d7b87f783';
import { prand, shade } from './pixel.js?v=848d7b87f783';

const R = {
  stone: '#c8b08a', stoneL: '#e0caa0', stoneD: '#a8906a', line: '#8a7452', dust: '#d8c49c',
  gold: '#e8b840', goldL: '#fff0a0', goldD: '#a87a20',
  wall: '#7a5a3a', wallL: '#9a7a52', wallD: '#5a3e26',
};

// 古代の 石だたみ（大きな 四角い 石。ところどころ ひび・砂ぼこり・わだち）
function paintRuinFloor(p, v) {
  p.rect(0, 0, 16, 16, R.stone);
  const r = prand(v * 37 + 11);
  for (let i = 0; i < 12; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 3 ? shade(R.stone, -0.07) : R.stoneL);
  // 石の めじ（2まいの 大きな 石）
  p.hline(0, 15, 0, R.line);
  p.vline(v & 1 ? 0 : 8, 1, 15, R.line);
  p.hline(0, 15, 8, shade(R.line, 0.1));
  // 石の ふちの ひかり
  p.hline(1, 15, 1, R.stoneL);
  p.hline(1, 15, 9, shade(R.stoneL, -0.04));
  // ひび
  if (v % 5 === 1) { p.set(4, 4, R.line); p.set(5, 5, R.line); p.set(5, 6, R.line); p.set(6, 7, R.line); }
  if (v % 7 === 3) { p.set(11, 11, R.line); p.set(12, 12, R.line); p.set(12, 13, R.line); }
  // 砂ぼこり
  if (v % 3 === 0) for (let x = 2; x < 14; x += 2) p.set(x + (x % 4 ? 1 : 0), 14 - (x % 3), R.dust);
}

// 砂の海の 小島の 門の 下の かいだん（くらい 下りかいだん）
function paintRuinGate(p) {
  p.rect(0, 0, 16, 16, '#3a2a1a');
  for (let i = 0; i < 5; i++) {
    const y = 2 + i * 3;
    p.hline(1, 14, y, shade('#8a6a40', -i * 0.12));
    p.hline(1, 14, y + 1, shade('#5a4026', -i * 0.12));
  }
  p.vline(0, 0, 15, '#6a4e2e'); p.vline(15, 0, 15, '#6a4e2e');
}
// 砂に うもれた 門（砂が つまっている）
function paintRuinGateShut(p, v) {
  p.rect(0, 0, 16, 16, '#d8b070');
  const r = prand(v * 13 + 3);
  for (let i = 0; i < 10; i++) p.set(Math.floor(r() * 16), Math.floor(r() * 16), i % 2 ? '#c89c58' : '#ecc888');
  p.rect(2, 0, 12, 6, '#8a6a40'); p.rect(3, 1, 10, 4, '#5a4026');
  for (let x = 2; x < 14; x++) p.set(x, 5 + ((x * 3) % 3), '#d8b070');
}

// 休み所の 聖なる 火（石の 台の 上で ゆれる 金色の 火）
export const FIRE_FRAMES = 4;
function paintRestFire(p, v, f) {
  paintRuinFloor(p, v);
  p.ellipse(8, 13, 6.5, 2.4, '#6a4e30');
  p.rect(3, 9, 10, 5, '#8a6a42'); p.rect(3, 8, 10, 5, '#b89462');
  p.hline(3, 12, 8, '#d8b880'); p.vline(12, 9, 12, '#8a6a42');
  p.rect(5, 10, 6, 2, '#5a3e26');
  const k = f % FIRE_FRAMES;
  const sway = [0, 1, 0, -1][k];
  p.ellipse(8 + sway * 0.5, 5.5, 3.2, 3.6, '#e86a1a');
  p.ellipse(8 + sway * 0.5, 5.2, 2.4, 3, '#ffa830');
  p.ellipse(8 + sway, 4.6, 1.4, 2.2, '#fff0a0');
  p.set(8 + sway, 0 + (k % 2), '#ffd060');
  p.set(5 - sway, 3 + k % 2, '#ffd060');
  p.set(11 + sway, 2 + (k + 1) % 2, '#ffe890');
}

// 転送の門（ゆかの まるい もんしょう。光っている ものは 青白く まわる）
export const RING_FRAMES = 4;
function ringBase(p, v, lit) {
  paintRuinFloor(p, v);
  const c = lit ? '#7ae8ff' : '#7a8a9a', cD = lit ? '#3ab0e0' : '#4a5a6a', cL = lit ? '#e8fcff' : '#a8b4c0';
  p.ellipse(8, 8, 7, 6, cD);
  p.ellipse(8, 8, 6, 5, lit ? '#2a5a7a' : '#5a5e66');
  p.ellipse(8, 8, 5, 4, c);
  p.ellipse(8, 8, 3.8, 2.9, lit ? '#2a5a7a' : '#5a5e66');
  p.ellipse(8, 8, 1.6, 1.3, cL);
  for (const [x, y] of [[8, 1], [8, 14], [1, 8], [14, 8]]) p.set(x, y, cL);
}
function paintWarpRing(p, v, f) {
  ringBase(p, v, true);
  const k = f % RING_FRAMES;
  const pts = [[8, 3], [12, 8], [8, 12], [3, 8]];
  for (let i = 0; i < 4; i++) {
    const [x, y] = pts[(i + k) % 4];
    if (i % 2 === 0) p.set(x, y, '#ffffff');
  }
}
const paintWarpRingOff = (p, v) => ringBase(p, v, false);

// 古代の 石の とびら（かべの 中の 大きな 2まいの 石の とびら・金の かざり）
function paintAncDoor(p) {
  p.rect(0, 0, 16, 16, R.wallD);
  p.rect(1, 1, 7, 15, R.wall); p.rect(8, 1, 7, 15, R.wall);
  p.vline(8, 1, 15, R.wallD);
  p.hline(1, 14, 1, R.wallL);
  for (const y of [5, 11]) { p.hline(2, 6, y, R.wallD); p.hline(9, 13, y, R.wallD); }
  // 金の とって と 竜の しるし
  p.rect(6, 7, 2, 2, R.gold); p.rect(9, 7, 2, 2, R.gold); p.set(6, 7, R.goldL); p.set(9, 7, R.goldL);
  p.set(4, 3, R.goldD); p.set(11, 3, R.goldD);
}

// 古代の かべ画（竜と 王と 人びと。m … 2=東 8=西 も かべ画）
function paintAncMural(p, v, f, m = 0) {
  p.rect(0, 0, 16, 16, '#a87a4a');
  p.hline(0, 15, 0, '#c89a62'); p.hline(0, 15, 15, '#6a4a2a');
  p.rect(1, 2, 14, 11, '#d8b880');
  const r = v % 3;
  if (r === 0) {
    // 竜（こはく色）
    p.hline(3, 11, 9, '#c87a2a'); p.hline(4, 10, 8, '#e89a3a'); p.rect(10, 5, 3, 3, '#e89a3a'); p.set(12, 6, '#3a2a1a');
    p.set(5, 6, '#c87a2a'); p.set(6, 5, '#c87a2a'); p.set(7, 6, '#c87a2a'); p.set(3, 10, '#c87a2a'); p.set(2, 11, '#c87a2a');
  } else if (r === 1) {
    // 王（金の かんむり）と 人
    p.rect(4, 6, 2, 5, '#4a6ab8'); p.rect(4, 4, 2, 2, '#e8c8a0'); p.hline(3, 6, 3, '#e8b840');
    for (const x of [8, 11]) { p.rect(x, 7, 2, 4, '#8a5a3a'); p.rect(x, 5, 2, 2, '#e8c8a0'); }
  } else {
    // 星と 竜の 目
    for (const [x, y] of [[3, 4], [7, 3], [12, 5], [5, 10], [11, 10]]) { p.set(x, y, '#fff0a0'); p.set(x + 1, y, '#e8b840'); }
    p.ellipse(8, 7.5, 2.2, 1.6, '#e89a3a'); p.set(8, 7, '#3a2a1a');
  }
  if (!(m & 8)) p.vline(0, 0, 15, '#6a4a2a');
  if (!(m & 2)) p.vline(15, 0, 15, '#6a4a2a');
}

// 竜の ほね（大きな あばら骨・頭の ほね）
function paintDragonBone(p, v) {
  paintRuinFloor(p, v);
  const B = '#f0e6cc', BD = '#c8b894', BS = '#8a7a5a';
  if (v % 2) {
    // あばら骨
    p.hline(1, 14, 12, BS); p.hline(1, 14, 11, BD); p.hline(1, 14, 10, B);
    for (const x of [3, 7, 11]) { p.vline(x, 3, 10, B); p.vline(x + 1, 4, 10, BD); p.set(x - 1, 3, B); }
  } else {
    // 頭の ほね
    p.ellipse(8, 9, 6, 4.4, BD); p.ellipse(7.6, 8.6, 5.4, 3.8, B);
    p.rect(4, 8, 3, 2, BS); p.rect(9, 8, 3, 2, BS);
    p.hline(5, 11, 12, BS); for (const x of [5, 7, 9, 11]) p.set(x, 13, B);
    p.set(2, 5, B); p.set(3, 4, B); p.set(13, 4, B); p.set(14, 5, B);
  }
}

export const LAB_PAINTERS = {
  [T.RUIN_FLOOR]: paintRuinFloor, [T.RUIN_GATE]: paintRuinGate, [T.RUIN_GATE_SHUT]: paintRuinGateShut,
  [T.REST_FIRE]: paintRestFire, [T.WARP_RING]: paintWarpRing, [T.WARP_RING_OFF]: paintWarpRingOff,
  [T.ANC_DOOR]: paintAncDoor, [T.ANC_MURAL]: paintAncMural, [T.DRAGON_BONE]: paintDragonBone,
};
export const LAB_FRAMES = { [T.REST_FIRE]: FIRE_FRAMES, [T.WARP_RING]: RING_FRAMES };
export const LAB_SPEED = { [T.REST_FIRE]: 150, [T.WARP_RING]: 220 };
// 色を かえない タイル（render/themes.js。古代都市の 色で かいてある）
export const LAB_TILES = Object.keys(LAB_PAINTERS).map(Number);
// まえの かおが ある かべ（render/tiles.js の WALLS）
export const LAB_WALLS = [T.ANC_DOOR, T.ANC_MURAL];

// となりの ようす（render/tiles-ch4.js の ch4Mask から）。あてはまらない ときは -1
export function labMask(t, at, x, y) {
  if (t === T.ANC_MURAL) return (at(x + 1, y) === T.ANC_MURAL ? 2 : 0) | (at(x - 1, y) === T.ANC_MURAL ? 8 : 0);
  return -1;
}

// ───── 2.5D（render/field3d.js）─────
// かべに なる タイル（高さと え。field3d.js の blockSpec）
export function labBlockSpec(id, v) {
  switch (id) {
    case T.ANC_DOOR: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.ANC_DOOR, 0, 0] };
    case T.ANC_MURAL: return { h: 1.6, top: ['x', 'cave_top', v], side: ['x', 'cave_side', v], south: ['t', T.ANC_MURAL, v, 0] };
    case T.RUIN_GATE_SHUT: return { h: 0.5, top: ['t', T.RUIN_GATE_SHUT, v, 0], side: ['x', 'sandstone_side', v] };
    default: return null;
  }
}

// 2.5D の たてた もの（render/tex3d.js の PROPS に まぜる。[はば, 高さ, かく 関数]）: 聖なる 火・竜の ほね
export const LAB_PROPS = {
  [T.REST_FIRE]: [16, 22, (p) => {
    p.rect(2, 14, 12, 8, '#8a6a42'); p.rect(2, 13, 12, 8, '#b89462'); p.hline(2, 13, 13, '#d8b880'); p.vline(13, 14, 20, '#8a6a42');
    p.rect(5, 16, 6, 2, '#5a3e26');
    p.ellipse(8, 8.5, 4, 5, '#e86a1a'); p.ellipse(8, 8, 3, 4, '#ffa830'); p.ellipse(8, 7, 1.6, 2.6, '#fff0a0');
    p.set(8, 1, '#ffd060'); p.set(5, 4, '#ffd060'); p.set(11, 3, '#ffe890');
  }],
  [T.DRAGON_BONE]: [16, 18, (p) => {
    const B = '#f0e6cc', BD = '#c8b894';
    p.hline(1, 14, 16, BD); p.hline(1, 14, 15, B);
    for (const x of [2, 6, 10, 13]) { p.vline(x, 4, 15, B); p.vline(x + 1, 6, 15, BD); }
    p.hline(2, 13, 3, B); p.set(1, 4, B); p.set(14, 4, B);
  }],
};
