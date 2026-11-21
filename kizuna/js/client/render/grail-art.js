// 第88回 G12班: 聖はいの 水しょうの台（render/gacha-art.js の paintGachaSpecial から よぶ。{ p, oc } を かえす）
//   r88_grail_altar … すきとおった 水色の 台。上に 3つの くぼみ（剣・鏡・玉の 色）。光が ゆらめく
import { Painter } from './pixel.js?v=10a0240c2bf8';

function paintAltar(f) {
  const p = new Painter(16, 21);
  const g = f ? '#fff4b0' : '#ffe070';
  p.stamp(0, 0, [
    '................',
    '................',
    '................',
    '.......g........',
    '......gGg.......',
    '.......g........',
    '................',
    '...CCCCCCCCCC...',
    '..CcccccccccC...',
    '..CcSccMccOcC...',
    '..CCCCCCCCCCC...',
    '...CwwwwwwwwC...',
    '....CwccccwC....',
    '....CwcwwcwC....',
    '....CwccccwC....',
    '....CwwwwwwC....',
    '...CCCCCCCCCC...',
    '..CwwwwwwwwwwC..',
    '..CCCCCCCCCCCC..',
    '.DDDDDDDDDDDDDD.',
    '................',
  ], { C: '#6aa8d8', c: '#bfe6ff', w: '#e8f8ff', D: '#3a5a7a', S: '#d8e2f0', M: '#5ad0e0', O: '#c03a6a', g, G: '#ffffff' });
  return { p, oc: '#1a2a3e' };
}

export function paintGrailSpecial(kind, dir, f) {
  return kind === 'r88_grail_altar' ? paintAltar(f) : null;
}
