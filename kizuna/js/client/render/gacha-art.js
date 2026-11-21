// 第88回 G4班: 作品の ガチャガチャの 台・竜神の ほこら（render/chars.js の paintSpecial の さいごで よぶ。{ p, oc } を かえす）
import { Painter } from './pixel.js?v=786b3cdacd05';
// 第88回 G9班: 神龍の さいだんと 神龍（render/shenron-art.js）
import { paintShenronSpecial } from './shenron-art.js?v=786b3cdacd05';
// 第88回 G12班: 聖はいの 水しょうの台（render/grail-art.js）
import { paintGrailSpecial } from './grail-art.js?v=786b3cdacd05';
// 第88回 G14班: 第5のせいれいのドレスの 氷の石の台（render/frozen-art.js）
import { paintFifthSpecial } from './frozen-art.js?v=786b3cdacd05';

// ガチャガチャの 台（上は とうめいな まるい まどに 色とりどりの カプセル・下は 赤い 台と 回す ハンドル・取り出し口）
function paintGacha(f) {
  const p = new Painter(16, 21);
  const [a, b] = f ? ['#ff6a6a', '#6ab0ff'] : ['#6ab0ff', '#ff6a6a'];
  p.stamp(0, 0, [
    '.....kkkkkk.....',
    '...kkwwwwwwkk...',
    '..kwwaw.ywwbwk..',
    '.kwwbwwgwwawwwk.',
    '.kwaywwbwwywgwk.',
    '.kwwwbwwawwwbwk.',
    '.kwgwwyawwbwywk.',
    '..kwwawbwwgwwk..',
    '...kkkkkkkkkk...',
    '..RRRRRRRRRRRR..',
    '..RrrrrrrrrrrR..',
    '..RrrrYYYYrrrR..',
    '..RrrYyyyyYrrR..',
    '..RrrYyKKyYrrR..',
    '..RrrYyyyyYrrR..',
    '..RrrrYYYYrrrR..',
    '..RrrrrrrrrrrR..',
    '..RrrKKKKKKrrR..',
    '..RrrKkkkkKrrR..',
    '..RRRRRRRRRRRR..',
    '..DDDDDDDDDDDD..',
  ], { k: '#2a2a3a', w: '#dff2ff', a, b, y: '#ffd84a', g: '#6ad87a', R: '#a8202a', r: '#e04848', Y: '#f2c14e', K: '#3a1a1a', D: '#4a1a1a' });
  if (f) p.set(4, 2, '#ffffff');
  else p.set(11, 3, '#ffffff');
  return { p, oc: '#1a0a14' };
}

// 竜神の ほこら（小さな 石の ほこら。7つの くぼみが 光る）
function paintHokora(f) {
  const p = new Painter(16, 21);
  const g = f ? '#ffe680' : '#ffd040';
  p.stamp(0, 0, [
    '................',
    '.......SS.......',
    '.....SSSSSS.....',
    '...SSSSSSSSSS...',
    '..SLLLLLLLLLLS..',
    '..DDDDDDDDDDDD..',
    '...SsssssssssS..',
    '...SsBBBBBBsS...',
    '...SsBddddBsS...',
    '...SsBdgGdBsS...',
    '...SsBddddBsS...',
    '...SsBBBBBBsS...',
    '...SssssssssS...',
    '...S1s2s3s4sS...',
    '...Sss5s6s7sS...',
    '...SssssssssS...',
    '..SSSSSSSSSSSS..',
    '..LLLLLLLLLLLL..',
    '.SSSSSSSSSSSSSS.',
    '.DDDDDDDDDDDDDD.',
    '................',
  ], {
    S: '#8a8a9a', L: '#b4b4c4', D: '#4a4a5a', s: '#a4a4b4', B: '#5a5a6a', d: '#3a4a7a', g: '#6ae0c8', G: g,
    1: '#e8503a', 2: '#4a8ae8', 3: '#a8e8ff', 4: '#4a2a6a', 5: '#f2c14e', 6: '#c08a5a', 7: '#e8e8f8',
  });
  return { p, oc: '#22222e' };
}

export function paintGachaSpecial(kind, dir, f) {
  switch (kind) {
    case 'r88_gacha': return paintGacha(f);
    case 'r88_hokora': return paintHokora(f);
    default: return paintShenronSpecial(kind, dir, f) || paintGrailSpecial(kind, dir, f) || paintFifthSpecial(kind, dir, f); // G9班・G12班・G14班
  }
}
