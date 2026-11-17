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
  // G5班 スレイヤーズ: 魔血玉（赤い 玉）の ついた つえと、光の剣の 光
  r88_slayers: {
    rows: [
      '.......y.',
      '..rr..yWy',
      '.rRRr..y.',
      '.rRRr....',
      '..rr.....',
      '...g.....',
      '....g....',
      '.....g...',
      '......g..',
    ],
    pal: { r: '#c8202a', R: '#ff6a6a', g: '#8a6a3a', y: '#ffe25a', W: '#ffffff' },
  },
  // G5班 烈火の炎: 火の 竜（ほのお）と 手の こう
  r88_rekka: {
    rows: [
      '....r....',
      '...rRr...',
      '..rRyRr..',
      '.rRyWyRr.',
      '.rRyWyRr.',
      '..rRyRr..',
      '...ddd...',
      '..dDDDd..',
      '..ddddd..',
    ],
    pal: { r: '#d83a10', R: '#ff7a2a', y: '#ffd040', W: '#fff4c0', d: '#3a2a2a', D: '#6a5a5a' },
  },
};
// かんばんの いろ（いた・ふち・うえの ひかり）
export const R88_BOARD_COLORS = {
  r88_houshin: ['#5a3a8a', '#24143a', '#9a7ad0'],
  r88_yaiba: ['#8a2a2a', '#3a1010', '#d06a5a'],
  r88_slayers: ['#2a3a6a', '#101830', '#6a8ad0'],
  r88_rekka: ['#4a2a1a', '#1a0a06', '#c06a3a'],
};
