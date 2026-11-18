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

// G9班: ドラゴンボール（星の 入った オレンジの 玉）・ワンピース（麦わらぼうし）
Object.assign(R88_BOARD_ICONS, {
  r88_dragonball: {
    rows: [
      '...ooo...',
      '.oOOOOOo.',
      '.OWOOOOo.',
      'oOOrOrOOo',
      'oOOOrOOOo',
      'oOOrOrOOo',
      '.OOOOOOo.',
      '.ooOOOoo.',
      '...ooo...',
    ],
    pal: { o: '#c8641a', O: '#ff9a2a', W: '#fff4d0', r: '#e8201a' },
  },
  r88_onepiece: {
    rows: [
      '.........',
      '...yyy...',
      '..yYYYy..',
      '..yYYYy..',
      '..rrrrr..',
      'yyyyyyyyy',
      'yYYYYYYYy',
      '.yyyyyyy.',
      '.........',
    ],
    pal: { y: '#c89a3a', Y: '#f2d27a', r: '#d8201a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_dragonball: ['#1a3a8a', '#081a4a', '#5a8ae8'],
  r88_onepiece: ['#2a6a9a', '#0a2a4a', '#6ab0e0'],
});

// G11班: るろうに剣心（十字の きずと 逆ば刀）・コナン・快と（白い シルクハットと 赤い ちょうネクタイ）
Object.assign(R88_BOARD_ICONS, {
  r88_kenshin: {
    rows: [
      '........w',
      '.......wW',
      '.r...rwW.',
      '..r.rwW..',
      '...rwW...',
      '..rwWr...',
      '.hhh..r..',
      'hhh......',
      'hh.......',
    ],
    pal: { w: '#e8eef8', W: '#a0a8b8', r: '#e8303a', h: '#7a2a1a' },
  },
  r88_conan: {
    rows: [
      '..wwwww..',
      '..wWWWw..',
      '..wWWWw..',
      '..wWWWw..',
      '.bbbbbbb.',
      'wwwwwwwww',
      '.........',
      'rr..o..rr',
      'rRRRoRRRr',
    ],
    pal: { w: '#ffffff', W: '#e0e6f4', b: '#3a5ad8', r: '#c0182a', R: '#ff3a4a', o: '#8a0a1a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_kenshin: ['#6a1a24', '#2a0a10', '#c8404a'],
  r88_conan: ['#1a2a5a', '#0a1028', '#5a7ae0'],
});

// G12班: ドラえもん（赤い 首わと 金の すず）・セーラームーン（三日月と ハートの 変身ブローチ）
Object.assign(R88_BOARD_ICONS, {
  r88_doraemon: {
    rows: [
      '.........',
      'rrrrrrrrr',
      'RRRRRRRRR',
      '...yyy...',
      '..yYYYy..',
      '.yYWYYYy.',
      '.yykkkyy.',
      '..yykyy..',
      '...yyy...',
    ],
    pal: { r: '#c81a1a', R: '#ff4a3a', y: '#c8961a', Y: '#ffd23a', W: '#fff8d0', k: '#5a3a0a' },
  },
  r88_sailormoon: {
    rows: [
      '...yy....',
      '..y......',
      '.y...p.p.',
      '.y..pPpPp',
      '.y..pPPPp',
      '..y..pPp.',
      '...yy.p..',
      '.........',
      '.........',
    ],
    pal: { y: '#ffd23a', p: '#d8307a', P: '#ff8ac0' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_doraemon: ['#1a8ae0', '#0a3a7a', '#7ac8ff'],
  r88_sailormoon: ['#2a1a5a', '#0a0a2a', '#8a6ae0'],
});

// G14班: 鋼のれん金術師（れん成の 円と 赤い 星）・アナと雪の女王（雪の 結しょう）
Object.assign(R88_BOARD_ICONS, {
  r88_hagaren: {
    rows: [
      '...www...',
      '.ww...ww.',
      '.w..r..w.',
      'w..rRr..w',
      'w.rRRRr.w',
      'w..r.r..w',
      '.w.....w.',
      '.ww...ww.',
      '...www...',
    ],
    pal: { w: '#f0f0ff', r: '#c81a1a', R: '#ff4a3a' },
  },
  r88_frozen: {
    rows: [
      '....w....',
      '.w..W..w.',
      '..w.W.w..',
      '...wWw...',
      'wWWWbWWWw',
      '...wWw...',
      '..w.W.w..',
      '.w..W..w.',
      '....w....',
    ],
    pal: { w: '#bfe6ff', W: '#ffffff', b: '#7ac8ff' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_hagaren: ['#2a3a6a', '#0a1430', '#6a8ad8'],
  r88_frozen: ['#2a7ab8', '#0a2a5a', '#a8e0ff'],
});

// G15班: ダイの大冒険（竜の 紋章と 剣）・大魔王の城（光魔のつえと 第三の目）・ドラゴンクエスト（ロトの 紋章の 鳥）
Object.assign(R88_BOARD_ICONS, {
  r88_dai: {
    rows: [
      '....w....',
      '...wWw...',
      '.b.wWw.b.',
      'bBb.W.bBb',
      '.bBbWbBb.',
      '..bBWBb..',
      '...yyy...',
      '....g....',
      '...ggg...',
    ],
    pal: { w: '#ffffff', W: '#d8e2f0', b: '#2a8ae0', B: '#8ad0ff', y: '#ffd23a', g: '#7a4a22' },
  },
  r88_daimaou: {
    rows: [
      '...rrr...',
      '..rRRRr..',
      '..rRkRr..',
      '...rrr...',
      '....y....',
      '...yYy...',
      '....y....',
      '....y....',
      '...yyy...',
    ],
    pal: { r: '#8a1a3a', R: '#ff5a7a', k: '#1a0a14', y: '#c8961a', Y: '#ffe680' },
  },
  r88_dq: {
    rows: [
      '....y....',
      'y..yYy..y',
      'yy.yYy.yy',
      '.yyyYyyy.',
      '..yYYYy..',
      '...yYy...',
      '..y.y.y..',
      '.y..y..y.',
      '....y....',
    ],
    pal: { y: '#c8961a', Y: '#ffe680' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_dai: ['#1a5a3a', '#0a2a18', '#5ac88a'],
  r88_daimaou: ['#3a1a4a', '#140a1e', '#a86ad8'],
  r88_dq: ['#a82a2a', '#3a0a0a', '#ff8a6a'],
});

// G13班: ハリー・ポッター（いなずまの きずと 丸メガネ）・マリオ（赤い キノコ）
Object.assign(R88_BOARD_ICONS, {
  r88_harrypotter: {
    rows: [
      '....yy...',
      '...yy....',
      '..yyyy...',
      '....yy...',
      '...yy....',
      '.........',
      'kkk...kkk',
      'k.k.k.k.k',
      'kkk...kkk',
    ],
    pal: { y: '#ffd23a', k: '#2a1a0a' },
  },
  r88_mario: {
    rows: [
      '...rrr...',
      '..rWWrr..',
      '.rrWWrrW.',
      'rWrrrrrWr',
      'rrrrWWrrr',
      '..sssss..',
      '..sksks..',
      '..sssss..',
      '...sss...',
    ],
    pal: { r: '#e8201a', W: '#ffffff', s: '#fff0d0', k: '#2a1a0a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_harrypotter: ['#7a1a2a', '#2a0a10', '#e0b040'],
  r88_mario: ['#2a8a2a', '#0a3a0a', '#ffd23a'],
});

// G16班: ポケモン（モンスターボールの 形。上が 赤・下が 白・まん中に 黒い 帯と ボタン）
Object.assign(R88_BOARD_ICONS, {
  r88_pokemon: {
    rows: [
      '...kkk...',
      '..kRRrk..',
      '.kRRrrrk.',
      '.kRrrrrk.',
      'kkkkWkkkk',
      '.kwwkwwk.',
      '.kWwwwwk.',
      '..kWwwk..',
      '...kkk...',
    ],
    pal: { k: '#1a1a22', R: '#ff6a6a', r: '#e02a2a', W: '#ffffff', w: '#e0e4ec' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_pokemon: ['#c82a2a', '#3a0a0a', '#ff9a8a'],
});

// G19班: SPY×FAMILY（金色の 星〈ステラ〉と 黒い マスク）・オリジナル（白い 剣と 黒い 剣の 十字）
Object.assign(R88_BOARD_ICONS, {
  r88_spyfamily: {
    rows: [
      '....y....',
      '...yYy...',
      'yyyyYyyyy',
      '.yyYYYyy.',
      '..yyYyy..',
      '.kkkkkkk.',
      'kkWkkkWkk',
      '.kkk.kkk.',
      '.........',
    ],
    pal: { y: '#e8b020', Y: '#fff2a0', k: '#1a1a22', W: '#ffffff' },
  },
  r88_original: {
    rows: [
      'w.......k',
      '.w.....k.',
      '..w...k..',
      '...w.k...',
      '....y....',
      '...k.w...',
      '..g...g..',
      '.k.....w.',
      'g.......g',
    ],
    pal: { w: '#ffffff', k: '#2a1a3a', y: '#ffe680', g: '#c8961a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_spyfamily: ['#2a3a5a', '#0a1020', '#e8b020'],
  r88_original: ['#4a3a6a', '#140a1e', '#d8c8ff'],
});

// G18班: はなかっぱ・おしり探てい（頭の 花と 緑の 顔）・暴れんぼう将軍・3年B組（金の 丸に あおいの 葉 3まい）
Object.assign(R88_BOARD_ICONS, {
  r88_kids: {
    rows: [
      '...p.p...',
      '..pPpPp..',
      '...pYp...',
      '....g....',
      '..ggggg..',
      '.gGkGkGg.',
      '.gGGGGGg.',
      '.gGGrGGg.',
      '..ggggg..',
    ],
    pal: { p: '#ff7ab0', P: '#ffc0d8', Y: '#ffe25a', g: '#3a9a3a', G: '#7ad84a', k: '#1a1a22', r: '#e84a4a' },
  },
  r88_jidai: {
    rows: [
      '..yyyyy..',
      '.y..G..y.',
      'y..gGg..y',
      'y...g...y',
      'y.Gg.gG.y',
      'yggg.gggy',
      'y.g...g.y',
      '.y.....y.',
      '..yyyyy..',
    ],
    pal: { y: '#ffd860', g: '#3a9a3a', G: '#8ad86a' },
  },
});
Object.assign(R88_BOARD_COLORS, {
  r88_kids: ['#3a8a4a', '#123a1a', '#ff9ac8'],
  r88_jidai: ['#2c4a9c', '#0e1a3a', '#e0c060'],
});
