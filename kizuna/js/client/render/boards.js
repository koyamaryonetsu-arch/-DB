// お店の かんばん（たてものに かける）と、地図の しるし
import { Painter, makeCanvas, ctxOf } from './pixel.js?v=1a19851ff61f';

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
  // はさみ（美容室）
  salon: {
    rows: [
      'Ws.....sW',
      '.Ws...sW.',
      '..Ws.sW..',
      '...WsW...',
      '....y....',
      '...W.W...',
      '.rrr.rrr.',
      'r..r.r..r',
      '.rrr.rrr.',
    ],
    pal: { W: '#ffffff', s: '#b8c0d0', y: '#f2c14e', r: '#ff6a9a' },
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
  // 金貨（預かり所）
  bank: {
    rows: [
      '..yyyyy..',
      '.yYYYYYy.',
      'yYYgggYYy',
      'yYgYYYYYy',
      'yYgYYggYy',
      'yYgYYYgYy',
      'yYYgggYYy',
      '.yYYYYYy.',
      '..yyyyy..',
    ],
    pal: { y: '#a8740a', Y: '#f2c14e', g: '#7a4a08' },
  },
  // かなづちと かなとこ（かじ屋）
  smith: {
    rows: [
      '....hhh..',
      '...hhhhh.',
      '....hhh..',
      '...w.....',
      '..w...s..',
      '.w..s....',
      'aaaaaaaa.',
      '..aaaa...',
      '.aaaaaa..',
    ],
    pal: { h: '#dfe4f0', w: '#a0703a', a: '#3a3a4a', s: '#ffd66b' },
  },
  // 7（カジノ）
  casino: {
    rows: [
      '.YYYYYYY.',
      '.yyyyyyY.',
      '......yY.',
      '.....yY..',
      '....yY...',
      '....yY...',
      '...yY....',
      '...yY....',
      '...yY....',
    ],
    pal: { Y: '#ffd84a', y: '#fff4b0' },
  },
  // 小さなメダル（メダル王の城）
  medal: {
    rows: [
      '..bb.rr..',
      '...brr...',
      '...rrb...',
      '..ooooo..',
      '.oYYYYYo.',
      '.oYWYYYo.',
      '.oYYWYYo.',
      '.oYYYYYo.',
      '..ooooo..',
    ],
    pal: { b: '#3a64c8', r: '#e8303a', o: '#7a4a12', Y: '#f2c14e', W: '#fff6c0' },
  },
  // ───── 第4章 王都サファラ ─────
  // かんむり（宮殿）
  palace: {
    rows: [
      '.........',
      'y...y...y',
      'yy.yYy.yy',
      'yYyYYYyYy',
      'yYYbYbYYy',
      'yYYYrYYYy',
      'yyyyyyyyy',
      '.........',
      '.........',
    ],
    pal: { y: '#c8902a', Y: '#f2c14e', r: '#e8303a', b: '#3ac8e8' },
  },
  // ぶっちがいの 剣（闘技場）
  arena: {
    rows: [
      'w.......w',
      '.w.....w.',
      '..w...w..',
      '...w.w...',
      '....w....',
      '...w.w...',
      '.hw...wh.',
      '.gh...hg.',
      'g.......g',
    ],
    pal: { w: '#e8eef8', h: '#f2c14e', g: '#7a4a22' },
  },
  // ひらいた 本（学者の家）
  scholar: {
    rows: [
      '.........',
      '.bb...bb.',
      'bWWb.bWWb',
      'bWlWbWlWb',
      'bWWWbWWWb',
      'bWlWbWlWb',
      'bWWWbWWWb',
      '.bbbbbbb.',
      '.........',
    ],
    pal: { b: '#5a3a22', W: '#fff6dc', l: '#8a98b0' },
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
  salon: ['#c85a8e', '#5a1e3e', '#e886b6'],
  general: ['#4a9a5a', '#1f4a2a', '#78c888'],
  inn: ['#b83a3a', '#5a1a1a', '#e06a5a'],
  church: ['#4a4ab8', '#1e1e5a', '#7a7ae0'],
  temple: ['#3a3a8a', '#141440', '#6a6ac8'],
  harbor: ['#2a7a8a', '#123a44', '#5aaab8'],
  bank: ['#7a5a2a', '#3a2610', '#b08a4a'],
  smith: ['#8a4a2a', '#3a1e10', '#c8703a'],
  casino: ['#7a2a7a', '#3a0f3a', '#a84aa8'],
  medal: ['#2a3a8a', '#101a44', '#5a6ac8'],
  palace: ['#3a64b0', '#162a5a', '#6a94e0'],
  arena: ['#a83a2a', '#4a1a10', '#d8604a'],
  scholar: ['#6a4a8a', '#2a1a40', '#9a7ab8'],
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
