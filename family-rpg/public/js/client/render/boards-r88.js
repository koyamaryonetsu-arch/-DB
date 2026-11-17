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
  },  // G7班 犬夜しゃ: 大きな 刀（鉄さいが）と 風の きず
  r88_inuyasha: {
    rows: [
      '.......Ww',
      '......WWw',
      '.c...WWw.',
      '..c.WWw..',
      '...WWw.c.',
      '..rWw..c.',
      '.rrr...c.',
      'rr.r.....',
      'r........',
    ],
    pal: { W: '#f0f4ff', w: '#a8b4cc', r: '#d0202c', c: '#9af0d0' },
  },
  // G7班 ゆう☆遊☆白書: 指先の 青い れい丸
  r88_yuhaku: {
    rows: [
      '.....bbb.',
      '....bBWBb',
      '....bWWWb',
      '....bBWBb',
      '..s..bbb.',
      '..s......',
      '.sss.....',
      '.ssss....',
      '.ssss....',
    ],
    pal: { b: '#2a7ae8', B: '#7ac8ff', W: '#ffffff', s: '#f0c8a0' },
  },
};
// かんばんの いろ（いた・ふち・うえの ひかり）
export const R88_BOARD_COLORS = {
  r88_houshin: ['#5a3a8a', '#24143a', '#9a7ad0'],
  r88_yaiba: ['#8a2a2a', '#3a1010', '#d06a5a'],
  r88_slayers: ['#2a3a6a', '#101830', '#6a8ad0'],
  r88_rekka: ['#4a2a1a', '#1a0a06', '#c06a3a'],  r88_inuyasha: ['#3a2a3a', '#140a14', '#c04a5a'],
  r88_yuhaku: ['#1a3a2a', '#081a10', '#4aa86a'],
};

// G8班: らんま1/2（やかんと 湯気）・じごく先生ぬ〜べ〜（黒い 手ぶくろと お経の まき物）
Object.assign(R88_BOARD_ICONS, {
  r88_ranma: {
    rows: [
      '.w...w...',
      '..w.w....',
      '.w...w...',
      '...sss...',
      '..sSSSs.s',
      '.sSSSSSss',
      '.sSSSSSs.',
      '.sSSSSSs.',
      '..sssss..',
    ],
    pal: { w: '#ffffff', s: '#8a5a2a', S: '#d8a050' },
  },
  r88_nube: {
    rows: [
      '.d.d.d...',
      '.d.d.d.d.',
      '.ddddddd.',
      '.dDDDDdd.',
      '.ddddddd.',
      '..ddddd..',
      'yyyyyyy..',
      'yWWWWWy..',
      'yyyyyyy..',
    ],
    pal: { d: '#14141c', D: '#6a6a80', y: '#e8b84a', W: '#fff4d0' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_ranma: ['#8a1a1a', '#3a0808', '#e06a4a'],
  r88_nube: ['#2a5a3a', '#0e2a16', '#6aa07a'],
});

// G10班: ナルト（うずまきの 葉と クナイ）・きめつのやいば（市松もようと 日輪刀）
Object.assign(R88_BOARD_ICONS, {
  r88_naruto: {
    rows: [
      '...gg....',
      '..gGGg...',
      '.gGooGg..',
      '.gGoGoG..',
      '.gGoooG.s',
      '..gGGg.sS',
      '...gg.sS.',
      '....hsS..',
      '...h.h...',
    ],
    pal: { g: '#3a8a3a', G: '#7ad86a', o: '#ff8a1a', s: '#a0a8b8', S: '#e8eef8', h: '#5a3a2a' },
  },
  r88_kimetsu: {
    rows: [
      '........w',
      '.......wW',
      '......wW.',
      '.....wW..',
      'gkgk.W...',
      'kgkgy....',
      'gkgk.y...',
      'kgkg..r..',
      '.......r.',
    ],
    pal: { g: '#2a8a5a', k: '#14141c', w: '#2a2a34', W: '#8a8aa0', y: '#e8b84a', r: '#c03a2a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_naruto: ['#c8601a', '#4a2008', '#f0a050'],
  r88_kimetsu: ['#1a3a2a', '#0a140e', '#5aa07a'],
});
