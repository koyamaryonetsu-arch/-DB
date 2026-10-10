// カジノの ドットえ（スロットの 絵がら・トランプ・コイン・小さなメダル）
// 絵がらは 16×16 で かいて、Scale2x を 2かい（ほかの キャラと おなじ 4ばいの こまかさ）
import { Painter, scale2x, makeCanvas, ctxOf } from './pixel.js?v=2d30a5044288';
import { monsterCanvas } from './monsters.js?v=2d30a5044288';
import { JOKER, cardSuit, cardRank } from '../../shared/data/casino.js?v=2d30a5044288';

const OUT = '#1b1330';

// ───────────── スロットの 絵がら（16×16。'.' は とうめい）─────────────
const SYMBOL_ART = {
  seven: {
    rows: [
      '................',
      '..rrrrrrrrrrrr..',
      '..RRRRRRRRRRRR..',
      '..RRRRRRRRRRRD..',
      '...........RRD..',
      '..........RRD...',
      '.........RRD....',
      '.........RRD....',
      '........RRD.....',
      '........RRD.....',
      '.......RRD......',
      '.......RRD......',
      '.......RRD......',
      '.......RRD......',
      '.......DDD......',
      '................',
    ],
    pal: { r: '#ff9a8a', R: '#e8303a', D: '#9a1624' },
    outline: '#3a0a14',
  },
  bar: {
    rows: [
      '................',
      '................',
      '................',
      '.gggggggggggggg.',
      '.gKKKKKKKKKKKKg.',
      '.gKWWKKKWKKWWKg.',
      '.gKWKWKWKWKWKWg.',
      '.gKWWKKWWWKWWKg.',
      '.gKWKWKWKWKWKWg.',
      '.gKWWKKWKWKWKWg.',
      '.gKKKKKKKKKKKKg.',
      '.gggggggggggggg.',
      '................',
      '................',
      '................',
      '................',
    ],
    pal: { g: '#f2c14e', K: '#23233a', W: '#ffffff' },
    outline: '#5a3a0a',
  },
  star: {
    rows: [
      '.......Y........',
      '.......Y........',
      '......YWY.......',
      '......YWY.......',
      '.....YYWYY......',
      'YYYYYYYWYYYYYYY.',
      '.YYYYYYYYYYYYD..',
      '..YYYYYYYYYYD...',
      '...YYYYYYYYD....',
      '...YYYYYYYYD....',
      '..YYYYDYYYYYD...',
      '..YYYD...YYYD...',
      '.YYYD.....YYYD..',
      '.YYD.......YYD..',
      '.YD.........YD..',
      '................',
    ],
    pal: { Y: '#ffd84a', W: '#fff8d0', D: '#d89a1a' },
    outline: '#6a4208',
  },
  bell: {
    rows: [
      '.......oo.......',
      '......YYYY......',
      '.....YWYYYY.....',
      '....YWYYYYYY....',
      '....YWYYYYYD....',
      '...YWYYYYYYYD...',
      '...YWYYYYYYYD...',
      '...YYYYYYYYYD...',
      '..YYYYYYYYYYYD..',
      '..YYYYYYYYYYYD..',
      '.YYYYYYYYYYYYYD.',
      '.DDDDDDDDDDDDDD.',
      '......oooo......',
      '.......oo.......',
      '................',
      '................',
    ],
    pal: { Y: '#f6c84a', W: '#fff4c0', D: '#b8862a', o: '#8a5a1a' },
    outline: '#4a2a08',
  },
  cherry: {
    rows: [
      '...........GG...',
      '.........GGLG...',
      '........G..G....',
      '.......G...G....',
      '......G.....G...',
      '.....G......G...',
      '....G.......G...',
      '...G........G...',
      '..RRR......RRR..',
      '.RWRRR....RWRRR.',
      '.RRRRR....RRRRR.',
      '.RRRRD....RRRRD.',
      '..RRD......RRD..',
      '................',
      '................',
      '................',
    ],
    pal: { R: '#e8303a', W: '#ffb0a8', D: '#9a1624', G: '#3a9a3a', L: '#7fd06a' },
    outline: '#3a0a14',
  },
};

const symCache = new Map();
// 絵がらの キャンバス（64×64。res 4）
export function symbolCanvas(id) {
  if (symCache.has(id)) return symCache.get(id);
  let c;
  if (id === 'pururin') {
    // ぷるりんは フィールドと おなじ え
    const src = monsterCanvas('pururin', 0, true);
    c = makeCanvas(64, 64);
    const x = ctxOf(c);
    const k = Math.min(56 / src.width, 56 / src.height);
    const w = Math.round(src.width * k), h = Math.round(src.height * k);
    x.drawImage(src, Math.round((64 - w) / 2), Math.round((64 - h) / 2) + 2, w, h);
  } else {
    const art = SYMBOL_ART[id];
    const p = new Painter(16, 16);
    p.stamp(0, 0, art.rows, art.pal);
    p.outline(art.outline);
    c = scale2x(scale2x(p)).toCanvas();
  }
  c.res = 4;
  symCache.set(id, c);
  return c;
}

const urlCache = new Map();
export function symbolURL(id) {
  if (!urlCache.has(id)) urlCache.set(id, symbolCanvas(id).toDataURL());
  return urlCache.get(id);
}

// ───────────── トランプ（24×34。1ドットを 4ばいで かく）─────────────
const GLYPH = {
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  10: ['.#..##.', '##.#..#', '.#.#..#', '.#.#..#', '.#.#..#', '.#.#..#', '###.##.'],
  11: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  12: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  13: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  14: ['..#..', '.#.#.', '#...#', '#...#', '#####', '#...#', '#...#'],
};
const SUIT_ART = [
  ['...#...', '..###..', '.#####.', '#######', '#######', '.#.#.#.', '..###..'],
  ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
  ['...#...', '..###..', '.#####.', '#######', '.#####.', '..###..', '...#...'],
  ['..###..', '..###..', '##.#.##', '#######', '##.#.##', '...#...', '..###..'],
];
// 3×5 の 字（JOKER）
const MINI = {
  J: ['..#', '..#', '..#', '#.#', '.#.'],
  O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
  K: ['#.#', '#.#', '##.', '#.#', '#.#'],
  E: ['###', '#..', '##.', '#..', '###'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
};
const CARD_W = 24, CARD_H = 34, CARD_K = 4;
export const CARD_SIZE = { w: CARD_W * CARD_K, h: CARD_H * CARD_K };

function stampBits(p, x, y, rows, col, k = 1) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') p.rect(x + i * k, y + j * k, k, k, col);
  });
}

function cardBase(face, rim) {
  const p = new Painter(CARD_W, CARD_H);
  p.rect(1, 0, CARD_W - 2, CARD_H, rim);
  p.rect(0, 1, CARD_W, CARD_H - 2, rim);
  p.rect(1, 1, CARD_W - 2, CARD_H - 2, face);
  p.rect(2, 1, CARD_W - 4, 1, face);
  return p;
}

const cardCache = new Map();
// card: 0〜52（52 は ジョーカー）。null は うら
export function cardCanvas(card) {
  const key = card === null || card === undefined ? 'back' : card;
  if (cardCache.has(key)) return cardCache.get(key);
  let p;
  if (key === 'back') {
    p = cardBase('#2a3c8a', '#f4f2fa');
    for (let y = 2; y < CARD_H - 2; y++) for (let x = 2; x < CARD_W - 2; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) p.set(x, y, '#3a52b0');
    p.rect(3, 3, CARD_W - 6, 1, '#f2c14e');
    p.rect(3, CARD_H - 4, CARD_W - 6, 1, '#f2c14e');
    const star = ['...#...', '...#...', '..###..', '#######', '.#####.', '.##.##.', '#.....#'];
    p.rect(7, 12, 10, 10, '#1e2a6a');
    stampBits(p, 8, 13, star, '#ffd84a');
  } else if (key === JOKER) {
    p = cardBase('#fbfaf4', '#3a2a5a');
    const word = 'JOKER';
    [...word].forEach((ch, i) => stampBits(p, 3 + i * 4, 3, MINI[ch], '#7a3ab8'));
    [...word].forEach((ch, i) => stampBits(p, 3 + i * 4, CARD_H - 8, MINI[ch], '#7a3ab8'));
  } else {
    const red = cardSuit(card) === 1 || cardSuit(card) === 2;
    const col = red ? '#d8283a' : '#23233a';
    p = cardBase('#fbfaf4', '#3a3a52');
    const r = cardRank(card);
    stampBits(p, 2, 2, GLYPH[r], col);
    stampBits(p, CARD_W - 9, 2, SUIT_ART[cardSuit(card)], col);
    stampBits(p, 5, 13, SUIT_ART[cardSuit(card)], col, 2);
    if (r >= 11 && r <= 13) {
      // 絵札は まわりに 金の わく
      p.rect(3, 11, CARD_W - 6, 1, '#d8a83a');
      p.rect(3, 29, CARD_W - 6, 1, '#d8a83a');
    }
  }
  const c = p.toCanvas(CARD_K);
  if (key === JOKER) {
    // まん中に ぷるりん
    const x = ctxOf(c);
    const src = monsterCanvas('pururin', 0, true);
    const k = Math.min(64 / src.width, 60 / src.height);
    const w = Math.round(src.width * k), h = Math.round(src.height * k);
    x.drawImage(src, Math.round((c.width - w) / 2), Math.round((c.height - h) / 2) + 2, w, h);
  }
  c.res = CARD_K;
  cardCache.set(key, c);
  return c;
}

// ───────────── コイン・小さなメダルの しるし（12×12）─────────────
const ICON_ART = {
  coin: {
    rows: [
      '...oooooo...',
      '..oYYYYYYo..',
      '.oYWWYYYYDo.',
      'oYWYYYYYYYDo',
      'oYWYYDDYYYDo',
      'oYYYDYYDYYDo',
      'oYYYDYYDYYDo',
      'oYYYYDDYYYDo',
      'oYYYYYYYYYDo',
      '.oYYYYYYYDo.',
      '..oDDDDDDo..',
      '...oooooo...',
    ],
    pal: { o: '#6a4208', Y: '#f6c84a', W: '#fff4c0', D: '#c8922a' },
  },
  medal: {
    rows: [
      '...BB..RR...',
      '...BBRRRR...',
      '....RRBB....',
      '...oooooo...',
      '..oYYYYYYo..',
      '.oYYWYYYYDo.',
      '.oYWYYSYYDo.',
      '.oYYYSSSYDo.',
      '.oYYYYSYYDo.',
      '.oYYYYYYYDo.',
      '..oDDDDDDo..',
      '...oooooo...',
    ],
    pal: { o: '#5a3a08', Y: '#f2c14e', W: '#fff4c0', D: '#b8862a', S: '#ffffff', B: '#3a64c8', R: '#d8303a' },
  },
};
const iconCache = new Map();
export function iconURL(kind) {
  if (iconCache.has(kind)) return iconCache.get(kind);
  const art = ICON_ART[kind];
  const p = new Painter(12, 12);
  p.stamp(0, 0, art.rows, art.pal);
  const u = scale2x(scale2x(p)).toCanvas().toDataURL();
  iconCache.set(kind, u);
  return u;
}
