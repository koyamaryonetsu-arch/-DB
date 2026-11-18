// 第88回 G14班: 第5のせいれいのドレスの 氷の石の台（render/gacha-art.js の paintGachaSpecial から よぶ。{ p, oc } を かえす）
//   r88_fifth_altar … 白く こおった 石の 台。上に 4つの しるし（風 ＝ 白・火 ＝ むらさき・水 ＝ 青・大地 ＝ 茶色）と、
//   まん中の 雪の 結しょう（5つめの しるし）が 光る
import { Painter } from './pixel.js?v=1bbfc18c8d9d';

function paintAltar(f) {
  const p = new Painter(16, 21);
  const g = f ? '#ffffff' : '#bfe6ff';
  p.stamp(0, 0, [
    '................',
    '.......g........',
    '....g..g..g.....',
    '.....g.g.g......',
    '...gggg.gggg....',
    '.....g.g.g......',
    '....g..g..g.....',
    '.......g........',
    '..CCCCCCCCCCCC..',
    '..CwiwwpwwbwnC..',
    '..CCCCCCCCCCCC..',
    '...CsssssssssC..',
    '....CsiiiissC...',
    '....CsisssisC...',
    '....CsiiiissC...',
    '....CssssssC....',
    '...CCCCCCCCCC...',
    '..CsssssssssssC.',
    '..CCCCCCCCCCCCC.',
    '.DDDDDDDDDDDDDD.',
    '................',
  ], { C: '#8ab8d8', s: '#dff2ff', i: '#a8d8f0', w: '#ffffff', p: '#b070e0', b: '#3a8ae8', n: '#8a6a3a', D: '#4a6a8a', g });
  return { p, oc: '#1a2a3e' };
}

export function paintFifthSpecial(kind, dir, f) {
  return kind === 'r88_fifth_altar' ? paintAltar(f) : null;
}
