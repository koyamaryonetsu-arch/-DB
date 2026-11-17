// 第88回 G3班: まぼろしの回廊の とびらの 上の 作品の しるし（render/boards.js の かんばんに まぜる。9×9。'.' は とうめい）
//   作品が ふえたら ここに 1つ 足して、data/rivals-r88.js の RIVAL_DOORS の mark に 書く
export const R88_BOARD_ICONS = {
  // ほう神演義: 雷の ムチ（雷公べん）
  r88_houshin: {
    rows: [
      '......yy.',
      '.....yy..',
      '..ww.yyy.',
      '.w..w..y.',
      'w....w...',
      '......w..',
      '.......g.',
      '.......g.',
      '.......g.',
    ],
    pal: { w: '#e8e0ff', y: '#ffe25a', g: '#7a4a22' },
  },
  // YAIBA: 剣と 玉（七つの玉）
  r88_yaiba: {
    rows: [
      '....w....',
      '...wWs...',
      '...wWs...',
      '...wWs...',
      '.rr.Ws.b.',
      'rRRr..bBb',
      'hhhhhhhbb',
      '....g....',
      '...hhh...',
    ],
    pal: { w: '#ffffff', W: '#d8e2f0', s: '#8a98b0', h: '#f2c14e', g: '#7a4a22', r: '#e85a3a', R: '#ff9a6a', b: '#3a7ae8', B: '#8ac8ff' },
  },
};
// かんばんの いろ（いた・ふち・うえの ひかり）
export const R88_BOARD_COLORS = {
  r88_houshin: ['#5a3a8a', '#24143a', '#9a7ad0'],
  r88_yaiba: ['#8a2a2a', '#3a1010', '#d06a5a'],
};
