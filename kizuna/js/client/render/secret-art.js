// ひみつのダンジョンの え（render/chars.js の paintSpecial から）と 戦いの 背景（render/battlefx.js の BG に まぜる）
// ・sd_door        … ミドリナ地方の 入口（石の アーチの 中に 下り階段。むらさきの 光が もれる）
// ・sd_door_closed … ルミナの町に 着く 前（石の とびらで ふさがっている。星の しるし）
// ・sd_board       … 家族の記録の板（木の 板に 金の メダルと 記録の 行）
// ・sd_chest       … 休み所の ごほうびの 宝箱（むらさきに 金の ふち。きらきら）
import { Painter } from './pixel.js?v=0136232bcf56';

const ST = '#8a84a0', STL = '#b4aec8', STD = '#5e5874', STDD = '#3e3a52';
const VI = '#7a4ac8', VIL = '#c8a0ff', VIH = '#f4e8ff', DK = '#140c22', DK2 = '#24183a';
const GO = '#f2c14e', GOL = '#fff0a0', GOD = '#a8700e';

// 石の アーチ（入口の まわり）
function arch(p) {
  p.ellipse(8, 9, 7.6, 7, STD);
  p.rect(0, 9, 16, 11, STD);
  p.ellipse(7.6, 8.6, 7, 6.4, ST);
  p.rect(1, 9, 14, 11, ST);
  // 石の めじ
  for (const [x, y] of [[2, 6], [12, 5], [1, 12], [14, 11], [2, 16], [13, 16], [5, 3], [10, 3]]) { p.set(x, y, STL); p.set(x + 1, y, STL); }
  for (const [x, y] of [[1, 9], [14, 9], [1, 14], [14, 14], [3, 4], [12, 4]]) p.hline(x, x + 1, y, STDD);
  // 足もとの 石だん
  p.rect(0, 19, 16, 2, STD);
  p.hline(0, 15, 19, STL);
}

export function paintSdDoor(f) {
  const p = new Painter(16, 21);
  arch(p);
  // 中は くらい 下り階段（おくへ いくほど せまく、くらい）
  p.ellipse(8, 10, 4.6, 4.4, DK);
  p.rect(4, 10, 8, 10, DK);
  for (const [y, x0, x1, c] of [[18, 4, 11, '#5a4a7a'], [16, 5, 10, '#46386a'], [14, 5, 10, '#382c58'], [12, 6, 9, DK2]]) {
    p.hline(x0, x1, y, c);
    p.hline(x0, x1, y + 1, '#100a1a');
  }
  // むらさきの 光（おくから もれる）
  p.set(7, 9, VI); p.set(8, 9, VI); p.set(7, 10, '#4a2a8a'); p.set(8, 10, '#4a2a8a');
  // 上の 星の しるし（金色）
  p.set(8, 1, GOL); p.hline(7, 9, 2, GO); p.set(8, 3, GOD); p.set(6, 2, GOD); p.set(10, 2, GOD);
  // 光の つぶ（コマで うごく）
  const dots = f ? [[6, 7], [10, 11], [8, 13]] : [[9, 8], [6, 12], [10, 15]];
  for (const [x, y] of dots) p.set(x, y, VIL);
  p.set(f ? 3 : 12, f ? 2 : 1, VIH);
  return p;
}

export function paintSdDoorClosed(f) {
  const p = new Painter(16, 21);
  arch(p);
  // とびら（大きな 石の 板。まん中に 星の ふういん）
  p.ellipse(8, 10, 4.6, 4.4, '#6a6482');
  p.rect(4, 10, 8, 10, '#6a6482');
  p.vline(4, 10, 19, STDD); p.vline(11, 10, 19, '#4e4864');
  p.hline(5, 10, 12, '#7a7494');
  // ひび
  p.set(6, 14, STDD); p.set(7, 15, STDD); p.set(7, 16, STDD); p.set(10, 11, STDD);
  // 星の しるし（うすく 光る）
  const c = f ? '#d8c8ff' : '#a890e0';
  p.set(8, 14, c); p.set(7, 15, c); p.set(9, 15, c); p.set(8, 16, c); p.set(8, 15, '#ffffff');
  p.set(8, 1, GOD); p.hline(7, 9, 2, '#8a6a2a');
  return p;
}

export function paintSdBoard(f) {
  const p = new Painter(16, 21);
  const W = '#8a5a2e', WL = '#b07a44', WD = '#5a3a1a', PA = '#f2e4c0', PAD = '#d8c49a', INK = '#5a4a3a';
  // 足（2本）
  p.rect(2, 13, 2, 8, WD); p.rect(12, 13, 2, 8, WD);
  p.vline(2, 13, 20, W); p.vline(12, 13, 20, W);
  // 板（木の わく と かみ）
  p.rect(0, 3, 16, 12, WD);
  p.rect(1, 4, 14, 10, W);
  p.hline(1, 14, 4, WL);
  p.rect(2, 5, 12, 8, PA);
  p.hline(2, 13, 12, PAD);
  // 記録の 行（1位は 金、2位は 銀、3位は どう）
  const marks = [['#f2c14e', '#a8700e'], ['#d8dce8', '#8a90a8'], ['#d8905a', '#8a4a22']];
  marks.forEach(([a, b], i) => {
    const y = 6 + i * 2;
    p.set(3, y, a); p.set(4, y, b);
    p.hline(6, 12 - i, y, INK);
  });
  // てっぺんの 王かん（金色）
  p.rect(5, 1, 6, 2, GO);
  p.set(5, 0, GO); p.set(8, 0, GOL); p.set(10, 0, GO);
  p.hline(5, 10, 2, GOD);
  p.set(f ? 7 : 9, 1, '#e8303a');
  if (f) p.set(14, 0, '#ffffff');
  return p;
}

export function paintSdChest(f) {
  const p = new Painter(16, 21);
  const PU = '#6a3aa8', PUL = '#9a6ad8', PUD = '#3e1e6a';
  // かげ
  p.ellipse(8, 19.5, 7, 1.4, '#1a1026');
  // はこ
  p.rect(1, 11, 14, 8, PUD);
  p.rect(2, 11, 12, 7, PU);
  p.hline(2, 13, 11, PUL);
  // ふた（まるい）
  p.ellipse(8, 10, 7, 3.6, PUD);
  p.ellipse(8, 9.6, 6.4, 3, PU);
  p.hline(3, 12, 8, PUL);
  // 金の ふち・おび・カギ
  p.hline(1, 14, 11, GO); p.hline(1, 14, 18, GOD);
  p.vline(4, 7, 18, GO); p.vline(11, 7, 18, GO);
  p.rect(7, 11, 2, 3, GOL); p.set(7, 13, GOD); p.set(8, 13, GOD);
  // 星の かざり
  p.set(8, 15, GOL); p.set(7, 16, GO); p.set(9, 16, GO);
  // きらきら（コマで うごく）
  const tw = f ? [[1, 4], [14, 7], [12, 1]] : [[3, 2], [15, 3], [0, 8]];
  for (const [x, y] of tw) { p.set(x, y, '#ffffff'); p.set(x + 1, y, '#fff6c0'); p.set(x, y + 1, '#fff6c0'); }
  return p;
}

// ふちどりの 色
export const SD_OUTLINE = { sd_door: '#1e1830', sd_door_closed: '#1e1830', sd_board: '#2a1a0a', sd_chest: '#1a0a2a' };

// 戦いの 背景（階の 色ごと と 番人）
export const SECRET_BG = {
  sd_moss: { sky: ['#0c120c', '#162418', '#22362a'], far: '#2a4a32', near: '#3e6a46', ground: ['#4e6a4a', '#40583e'], deco: 'pillars' },
  sd_aqua: { sky: ['#06121e', '#0e2438', '#183a56'], far: '#2a5a8a', near: '#4a8ab8', ground: ['#5a8aa8', '#4a7898'], deco: 'crystal' },
  sd_violet: { sky: ['#0e0618', '#1e0e30', '#30184a'], far: '#4a2a6a', near: '#6a428a', ground: ['#5a4270', '#4a3460'], deco: 'crystal' },
  sd_crimson: { sky: ['#160406', '#2e080c', '#4a1014'], far: '#5a1a1a', near: '#8a2a22', ground: ['#5a2a24', '#4a221e'], deco: 'rocks', embers: true },
  sd_gold: { sky: ['#120c02', '#241806', '#3a280c'], far: '#6a5020', near: '#a88a3a', ground: ['#b89848', '#a88a40'], deco: 'pillars' },
  sd_star: { sky: ['#02030e', '#080c24', '#121a3e'], far: '#1a2250', near: '#2e3a74', ground: ['#3a4682', '#323c72'], deco: 'crystal', stars: true },
  sd_guard: { sky: ['#0a0414', '#1a0a2a', '#2e1444'], far: '#3a1a52', near: '#5a2a78', ground: ['#4a3a62', '#3c2e54'], deco: 'pillars', stars: true },
};
