// お店の かんばん（たてものに かける）と、地図の しるし
import { Painter, makeCanvas, ctxOf } from './pixel.js?v=5d38639d0719';

// しるしの え（9×9。'.' は とうめい）
const ICONS = {
  // 剣
  weapon: {
    rows: [
      '....w....',
      '...wWs...',
      '...wWs...',
      '...wWs...',
      '...wWs...',
      '.hhhhhhh.',
      '....g....',
      '....g....',
      '...hhh...',
    ],
    pal: { w: '#ffffff', W: '#d8e2f0', s: '#8a98b0', h: '#f2c14e', g: '#7a4a22' },
  },
  // たて
  armor: {
    rows: [
      '.ooooooo.',
      'oBBBYBBBo',
      'oBBBYBBBo',
      'oBYYYYYBo',
      'oBBBYBBBo',
      '.oBBYBBo.',
      '.oBBBBBo.',
      '..oBBBo..',
      '...ooo...',
    ],
    pal: { o: '#1e2e6a', B: '#4a78d8', Y: '#f2c14e' },
  },
  // 剣と たて
  arms: {
    rows: [
      '.w.......',
      'wWs.oooo.',
      'wWsoBYBBo',
      'wWsoYYYBo',
      'wWsoBYBBo',
      'hhh.oBBo.',
      '.g...oo..',
      '.g.......',
      'hhh......',
    ],
    pal: { w: '#ffffff', W: '#d8e2f0', s: '#8a98b0', h: '#f2c14e', g: '#7a4a22', o: '#1e2e6a', B: '#4a78d8', Y: '#f2c14e' },
  },
  // ふくろ（道具）
  item: {
    rows: [
      '...ttt...',
      '....t....',
      '..bbbbb..',
      '.bBBBBBb.',
      'bBBByBBBb',
      'bBByyyBBb',
      'bBBByBBBb',
      '.bBBBBBb.',
      '..bbbbb..',
    ],
    pal: { t: '#c83a3a', b: '#5a3a22', B: '#e0b070', y: '#fff6b0' },
  },
  // INN（宿屋。ドラクエの かんばん）
  inn: {
    x: 2,
    rows: [
      '#.#..#.#..#',
      '#.##.#.##.#',
      '#.#.##.#.##',
      '#.#..#.#..#',
      '#.#..#.#..#',
      '...........',
      'ccccccccccc',
    ],
    pal: { '#': '#ffffff', c: '#f2c14e' },
    y: 6,
  },
  // 十字（教会）
  church: {
    rows: [
      '....y....',
      '...yWy...',
      '.yyyWyyy.',
      'yWWWWWWWy',
      '.yyyWyyy.',
      '...yWy...',
      '...yWy...',
      '...yWy...',
      '....y....',
    ],
    pal: { y: '#f2c14e', W: '#ffffff' },
  },
  // ジョッキ（酒場）
  bar: {
    rows: [
      '.wwwww...',
      'wwwwwww..',
      'gAAAAAgg.',
      'gAAAAAg.g',
      'gAAAAAg.g',
      'gAAAAAgg.',
      'gAAAAAg..',
      'gAAAAAg..',
      '.ggggg...',
    ],
    pal: { w: '#ffffff', A: '#f2a93a', g: '#6a4222' },
  },
  // 星（神殿）
  temple: {
    rows: [
      '....y....',
      '....y....',
      '...yYy...',
      'yyyYYYyyy',
      '.yYYYYYy.',
      '..yYYYy..',
      '..yY.Yy..',
      '.yY...Yy.',
      '.y.....y.',
    ],
    pal: { y: '#f2c14e', Y: '#fff6b0' },
  },
  // いかり（港長の家）
  harbor: {
    rows: [
      '...www...',
      '...w.w...',
      '...www...',
      '.wwwwwww.',
      '....w....',
      '....w....',
      'w...w...w',
      'ww..w..ww',
      '.wwwwwww.',
    ],
    pal: { w: '#e8eef8' },
  },
};

ICONS.general = ICONS.item;

// 地図だけの しるし（宿屋は ベッド）
const MAP_ICONS = {
  inn: {
    rows: [
      '.........',
      '.........',
      'ww.......',
      'wwbbbbbbb',
      'BBBBBBBBB',
      'BBBBBBBBB',
      'B.......B',
      'B.......B',
      '.........',
    ],
    pal: { w: '#ffffff', b: '#8ab8f0', B: '#f4f2fa' },
  },
};

// かんばんの いろ（いた・ふち・うえの ひかり）
const BOARD = {
  default: ['#c8904a', '#5a3a22', '#e8b878'],
  general: ['#4a9a5a', '#1f4a2a', '#78c888'],
  inn: ['#b83a3a', '#5a1a1a', '#e06a5a'],
  church: ['#4a4ab8', '#1e1e5a', '#7a7ae0'],
  temple: ['#3a3a8a', '#141440', '#6a6ac8'],
  harbor: ['#2a7a8a', '#123a44', '#5aaab8'],
};

// たてものに かける かんばん（16×15）
const boardCache = new Map();
export function boardCanvas(kind) {
  if (boardCache.has(kind)) return boardCache.get(kind);
  const p = new Painter(16, 15);
  const [base, dark, light] = BOARD[kind] || BOARD.default;
  const iron = '#2a2230';
  // つりさげる かなぐ
  p.hline(3, 12, 0, iron);
  p.vline(4, 1, 2, iron);
  p.vline(11, 1, 2, iron);
  // いた
  p.rect(1, 3, 14, 12, dark);
  p.rect(2, 4, 12, 10, base);
  p.hline(2, 13, 4, light);
  const ic = ICONS[kind];
  if (ic) p.stamp(ic.x ?? 3, ic.y ?? 5, ic.rows, ic.pal);
  const c = p.toCanvas();
  boardCache.set(kind, c);
  return c;
}

// 地図の しるし（11×11。まるい かどの いた）
const iconCache = new Map();
export function mapIconCanvas(kind) {
  if (iconCache.has(kind)) return iconCache.get(kind);
  const p = new Painter(11, 11);
  const [base, dark] = BOARD[kind] || BOARD.default;
  p.rect(1, 0, 9, 11, dark);
  p.rect(0, 1, 11, 9, dark);
  p.rect(1, 1, 9, 9, base);
  const ic = MAP_ICONS[kind] || ICONS[kind];
  if (ic) p.stamp(1, 1, ic.rows, ic.pal);
  const c = p.toCanvas();
  iconCache.set(kind, c);
  return c;
}

// メニューなどに だす しるし（データURL）
const urlCache = new Map();
export function boardIconURL(kind) {
  if (!kind) return null;
  if (urlCache.has(kind)) return urlCache.get(kind);
  const src = mapIconCanvas(kind);
  const c = makeCanvas(src.width * 3, src.height * 3);
  const x = ctxOf(c);
  x.drawImage(src, 0, 0, c.width, c.height);
  const u = c.toDataURL();
  urlCache.set(kind, u);
  return u;
}

export const BOARD_KINDS = Object.keys(ICONS);
