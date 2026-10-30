// 第50回 D3: 景品の なかまの 小さな 絵（12×12 ドット。ui/prizes.js の 一覧の 左）
//   gear 強い装備（剣）/ look 見た目（リボン）/ tool 便利な道具（本）/ mon めずらしい魔物（ぷるりん）/ star 星のかけら
import { Painter, scale2x } from './pixel.js?v=a02b94650854';

const ICONS = {
  gear: {
    rows: [
      '.........oo.',
      '........oWo.',
      '.......oWSo.',
      '......oWSo..',
      '.....oWSo...',
      '..o.oWSo....',
      '..ooWSo.....',
      '...oSo......',
      '..oGoo......',
      '.oGo.oo.....',
      'oGo.........',
      'oo..........',
    ],
    pal: { o: '#2a2438', W: '#ffffff', S: '#b8c4dc', G: '#f2c14e' },
  },
  look: {
    rows: [
      '............',
      '.oo......oo.',
      'oPPo....oPPo',
      'oPLPo..oPLPo',
      'oPPPPooPPPPo',
      'oPPPoGGoPPPo',
      'oPPPoGGoPPPo',
      'oPPPPooPPPPo',
      'oPPo.oo.oPPo',
      '.oo.oPPo.oo.',
      '....oPPo....',
      '.....oo.....',
    ],
    pal: { o: '#5a1a3a', P: '#ff7ab4', L: '#ffd0e4', G: '#f2c14e' },
  },
  tool: {
    rows: [
      '............',
      '.oooooooooo.',
      'oBBBBoBBBBBo',
      'oBWWBoBWWWBo',
      'oBBBBoBBBBBo',
      'oBWWBoBWWBBo',
      'oBBBBoBBBBBo',
      'oBWWBoBWWWBo',
      'oBBBBoBBBBBo',
      'oDDDDoDDDDDo',
      '.oooooooooo.',
      '............',
    ],
    pal: { o: '#1a2a4a', B: '#5a9ae8', W: '#e8f4ff', D: '#3a64b8' },
  },
  mon: {
    rows: [
      '.....oo.....',
      '....oLLo....',
      '...oLGGGo...',
      '..oGGGGGGo..',
      '.oGGGGGGGGo.',
      '.oGWoGGWoGo.',
      'oGGooGGooGGo',
      'oGGGGGGGGGGo',
      'oGGGRRRRGGGo',
      'oDGGGRRGGGDo',
      '.oDDDDDDDDo.',
      '..oooooooo..',
    ],
    pal: { o: '#1a2a1a', G: '#5ac85a', L: '#c8f6b0', W: '#ffffff', R: '#d84a5a', D: '#3a9a3a' },
  },
  star: {
    rows: [
      '.....oo.....',
      '.....oYo....',
      '....oYYo....',
      '....oYWYo...',
      'oooooYWYoooo',
      'oYYYYYYYYYYo',
      '.oYYYYYYYYo.',
      '..oYYYYYYo..',
      '..oYYYYYYo..',
      '.oYYYooYYYo.',
      '.oYYo..oYYo.',
      '.ooo....ooo.',
    ],
    pal: { o: '#6a4208', Y: '#ffe070', W: '#ffffff' },
  },
};
const cache = new Map();
// 絵の data URL（知らない なかまは 便利な道具の 絵）
export function prizeIconURL(kind) {
  const k = ICONS[kind] ? kind : 'tool';
  if (cache.has(k)) return cache.get(k);
  const art = ICONS[k];
  const p = new Painter(12, 12);
  p.stamp(0, 0, art.rows, art.pal);
  const u = scale2x(scale2x(p)).toCanvas().toDataURL();
  cache.set(k, u);
  return u;
}
export const PRIZE_ICON_KINDS = Object.keys(ICONS);
export const prizeIconRows = (kind) => ICONS[kind]?.rows || null;
