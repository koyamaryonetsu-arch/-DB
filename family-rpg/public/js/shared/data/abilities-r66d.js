// 第66回 D班の 伝説の 職業の 技（docs/plan-r66-legend.md の D班）
//   月下のき術師（かいとうキッドの 先）・のぶドラ（ドラえもんの 先）・かっぱの大王（はなかっぱ（筋肉ニンニク）の 先）・
//   真理のとびらをひらく者（はがねのれん金術師の 先）・ロゼッタ／ギャラクシーマリオ（ピーチ／マリオの 先）
//
// ・月下のき術師: 光る トランプの 技と、すがたを 消して かわす 技（消えるマジック・鏡のイリュージョン・うしろからの 一げき）
// ・のぶドラ: なつかしい ひみつ道具（どこでもドア・ガリバートンネル・グルメテーブルかけ・石ころぼうし・ショックガン・きびだんご）を つぎつぎ
// ・かっぱの大王: 力が とても 強い。頭に さく 花で 大技が かわる（看板の 技は 運しだいで バラ・トウガラシ・さくら・ニンニク）
// ・真理のとびらをひらく者: 手を 合わせるだけで 地形（足もとの 地面・とりで・やり）や 武器を 作りかえる
// ・ロゼッタ: 流れ星と、ちびっこの 星の 仲間チコ。男の子（ギャラクシーマリオ）は 看板の 技の 名前だけ かわる（masc）
// きまりは abilities-r41a.js と おなじ
//  ・攻撃技は 伝説 2つ いじょう・Lv10 の 技が いちばん MPを 使う
//  ・みんなに かける 補助は 伝説の 上限まで（1.4倍。いくつもの 強さは 1.35倍）
//  ・看板の 技は <職業の id>_sig（えんしゅつは client/render/battlefx-r66d.js。anim も 同じ 名前）
//  ・「扉・突・避・刃」などは 習わない 字なので かなに する

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const R66D_ABILITIES = {
  // ───────────── 月下のき術師（伝説の職業。かいとうキッド＋ほかの 超級職 1つ） ─────────────
  gx_ace: {
    name: 'エースのトランプ', kana: 'えーすのとらんぷ', kind: 'skill', job: 'gekka', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, critBonus: 0.15 },
    desc: '光るエースのトランプを、まっすぐ投げる。敵1体に大ダメージ。会心も出やすい。', cast: '{a}「このエースで、決まりです」', anim: 'r66d_ace',
  },
  gx_kieru: {
    name: '月夜の消えるマジック', kana: 'つきよのきえるまじっく', kind: 'skill', job: 'gekka', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.4, dur: 30 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: 'ぱっとすがたを消して、どこかへ…。自分が攻撃をとてもかわしやすくなり、素早さも上がる。', cast: '{a}がマントをひるがえすと、すがたが消えた！', anim: 'r33_smoke_flash',
  },
  gx_hanafubuki: {
    name: 'トランプの花ふぶき', kana: 'とらんぷのはなふぶき', kind: 'skill', job: 'gekka', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.65, status: { status: 'blind', chance: 0.35, turns: [1, 2] } },
    desc: 'たくさんのトランプが、花びらのようにまいおどる。敵全体にダメージ。目の前がまぼろしにつつまれる敵もいる。', cast: '{a}が指を鳴らすと、トランプがふぶきのようにまった！', anim: 'r66d_cards',
  },
  gx_mirror: {
    name: '鏡のイリュージョン', kana: 'かがみのいりゅーじょん', kind: 'skill', job: 'gekka', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'eva', add: 0.25, dur: 30 }, { type: 'buff', stat: 'def', mult: 1.3, dur: 40 }] },
    desc: '大きな鏡で、みんなのすがたをいくつにもうつす。仲間全員が攻撃をかわしやすくなり、守備力も上がる。', cast: '{a}「さあ、本物はどれでしょう？」', anim: 'buff',
  },
  gx_yokoku: {
    name: '月下の予告状', kana: 'げっかのよこくじょう', kind: 'skill', job: 'gekka', mp: 14, target: 'enemies', role: 'sup',
    effect: {
      type: 'multi',
      parts: [
        { type: 'debuff', stat: 'def', mult: 0.75, dur: 35, chance: 0.85 },
        { type: 'debuff', stat: 'atk', mult: 0.85, dur: 35, chance: 0.6 },
      ],
    },
    desc: '「今夜、あなたの守りをいただきます」予告状がとどくと、敵全体の守備力が下がる。攻撃力が下がる敵もいる。', cast: '{a}は、月の光の中で予告状を投げた！', anim: 'debuff',
  },
  gx_ushiro: {
    name: 'まぼろしの早がわり', kana: 'まぼろしのはやがわり', kind: 'skill', job: 'gekka', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, hits: 2, ignoreDef: 0.25, atbAfter: 40 },
    desc: '消えたと思ったら、もう敵のうしろに。敵1体に2回、大ダメージ。守りの固い敵にもよく効き、早めに次の番が来る。', cast: '{a}のすがたが消えた…と思ったら、うしろから！', anim: 'r66d_vanish',
  },
  gekka_sig: {
    name: '月下のロイヤルストレートフラッシュ', kana: 'げっかのろいやるすとれーとふらっしゅ', kind: 'skill', job: 'gekka', mp: 40, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 5, critBonus: 0.1 },
    desc: '満月を背に、5まいのトランプが光りかがやく、月下のき術師の最強の技。敵全体に5回ずつダメージ。会心も出やすい。', cast: '{a}「ショーの最後は、ロイヤルストレートフラッシュで！」', anim: 'gekka_sig',
  },

  // ───────────── のぶドラ（伝説の職業。ドラえもん＋ほかの 超級職 1つ） ─────────────
  nd_dokodemo: {
    name: 'どこでもドア', kana: 'どこでもどあ', kind: 'skill', job: 'nobu_dora', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.9, ignoreDef: 0.3 },
    desc: '敵のすぐうしろにドアを出して、ガチャッ、ポカン！敵1体に大ダメージ。守りの固い敵にもよく効く。', cast: '{a}「どこでもドア〜！」', anim: 'r66d_door',
  },
  nd_biglight: {
    name: 'ガリバートンネル', kana: 'がりばーとんねる', kind: 'skill', job: 'nobu_dora', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.45, dur: 45 },
    desc: '大きくなる方の出口から出てくると、体が大きくなるトンネル。自分の攻撃力と守備力がとても上がる。', cast: '{a}「ガリバートンネル〜！」くぐりぬけると、体がぐんぐん大きくなった！', anim: 'charge',
  },
  nd_gourmet: {
    name: 'グルメテーブルかけ', kana: 'ぐるめてーぶるかけ', kind: 'skill', job: 'nobu_dora', mp: 20, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [105, 130], thr: 55 }, { type: 'mpHeal', base: [4, 7] }] },
    desc: '食べたい物を言うと、ごちそうが出てくるテーブルかけ。仲間全員のHPとMPを回復する。', cast: '{a}「グルメテーブルかけ〜！」みんなで、いただきます！', anim: 'heal2',
  },
  nd_ishikoro: {
    name: '石ころぼうし', kana: 'いしころぼうし', kind: 'skill', job: 'nobu_dora', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'eva', add: 0.45, dur: 30 },
    desc: 'かぶると、道ばたの石ころのように、だれにも気にされなくなるぼうし。自分が攻撃をとてもかわしやすくなる。', cast: '{a}「石ころぼうし〜！」', anim: 'r33_smoke_flash',
  },
  nd_shock: {
    name: 'ショックガン', kana: 'しょっくがん', kind: 'skill', job: 'nobu_dora', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.5, element: 'bolt' },
        { type: 'atbSet', sub: 35, chance: 0.4, msg: '{t}は、しびれて動けない！', failMsg: '{t}は、しびれをふりはらった！' },
      ],
    },
    desc: 'ビビビッとしびれる光をうつ。敵全体に雷のダメージ。しびれて止まる敵もいる。', cast: '{a}「ショックガン〜！」', anim: 'r66d_shock',
  },
  nd_kibidango: {
    name: 'ももたろう印のきびだんご', kana: 'ももたろうじるしのきびだんご', kind: 'skill', job: 'nobu_dora', mp: 14, target: 'enemies', role: 'sup',
    effect: { type: 'debuff', stat: 'atk', mult: 0.75, dur: 35, chance: 0.75 },
    desc: '食べると、だれでもなかよしになってしまうきびだんご。敵全体の攻撃力が下がる。', cast: '{a}「ももたろう印のきびだんご〜！」', anim: 'debuff',
  },
  nobu_dora_sig: {
    name: 'ひみつ道具大行進', kana: 'ひみつどうぐだいこうしん', kind: 'skill', job: 'nobu_dora', mp: 40, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.3, element: 'blast' },
        { type: 'phys', mult: 1.3, ignoreDef: 0.3 },
        { type: 'buff', target: 'allies', stats: ['atk', 'def'], mult: 1.2, dur: 30 },
      ],
    },
    desc: '4次元ポケットから、なつかしいひみつ道具がつぎつぎにとび出す、のぶドラの最強の技。空気ほうと名刀電光丸で、敵全体に2回大ダメージ。仲間全員の攻撃力と守備力も上がる。', cast: '{a}「あれも、これも…ひみつ道具、全部出しちゃえ〜！」', anim: 'nobu_dora_sig',
  },

  // ───────────── かっぱの大王（伝説の職業。はなかっぱ（筋肉ニンニク）＋ほかの 超級職 1つ） ─────────────
  kd_harite: {
    name: '大王のはり手', kana: 'だいおうのはりて', kind: 'skill', job: 'kappa_king', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 3.2 },
    desc: '大きな手のひらで、思い切りつっぱる。敵1体に大ダメージ。', cast: '{a}「どすこーい！」', anim: 'r66d_harite',
  },
  kd_kyuuri: {
    name: '大王のキュウリ', kana: 'だいおうのきゅうり', kind: 'skill', job: 'kappa_king', mp: 8, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 40 }, { type: 'buff', stat: 'atk', mult: 1.4, dur: 40 }] },
    desc: '大王だけが食べられる、大きなキュウリをかじる。自分のHPが回復して、攻撃力も上がる。', cast: '{a}は、大きなキュウリをボリボリかじった！', anim: 'heal2',
  },
  kd_osara: {
    name: 'お皿の大水しぶき', kana: 'おさらのおおみずしぶき', kind: 'skill', job: 'kappa_king', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, element: 'water' },
    desc: '頭のお皿の水を、ザッバーンとまきちらす。敵全体に水のダメージ。', cast: '{a}は、頭をぶるんとふった！', anim: 'r66d_splash',
  },
  kd_himawari: {
    name: 'ひまわりの花', kana: 'ひまわりのはな', kind: 'skill', job: 'kappa_king', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [95, 120], thr: 50 }, { type: 'buff', stat: 'atk', mult: 1.3, dur: 40 }] },
    desc: '頭に大きなひまわりがさいて、みんなをてらす。仲間全員のHPを回復して、攻撃力も上がる。', cast: '{a}の頭に、ひまわりがさいた！', anim: 'heal_ring',
  },
  kd_shiko: {
    name: '大王のしこふみ', kana: 'だいおうのしこふみ', kind: 'skill', job: 'kappa_king', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.55 },
        { type: 'atbSet', sub: 35, chance: 0.4, msg: '{t}は、地ひびきでころんだ！', failMsg: '{t}は、ぐっとふんばった！' },
      ],
    },
    desc: '大きな足で、ドシーンとしこをふむ。敵全体にダメージ。地ひびきでころんで止まる敵もいる。', cast: '{a}は、足を高く上げて…ドシーン！', anim: 'quake',
  },
  kd_saboten: {
    name: 'サボテンの花', kana: 'さぼてんのはな', kind: 'skill', job: 'kappa_king', mp: 14, target: 'self', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.5, dur: 45 }, { type: 'regen', base: [26, 32], thr: 30, dur: 24 }] },
    desc: '頭にサボテンがさいて、とげで身を守る。自分の守備力がとても上がり、しばらくHPが少しずつ回復する。', cast: '{a}の頭に、サボテンがさいた！', anim: 'guard',
  },
  kappa_king_sig: {
    name: '大王の大パッカーン', kana: 'だいおうのだいぱっかーん', kind: 'skill', job: 'kappa_king', mp: 40, target: 'enemies', role: 'dmg', autoRandom: true,
    effect: { type: 'random', options: ['kd_s_bara', 'kd_s_tougarashi', 'kd_s_sakura', 'kd_s_ninniku'] },
    desc: '頭の花がくるくるかわり、最後にさいた花の大技が出る、かっぱの大王の最強の技。何の花かは運しだい（バラ・トウガラシ・さくら・ニンニク）。どれも敵全体に大ダメージ。', cast: '{a}「パッカーン！」頭の花が、くるくるかわっていく…！', anim: 'kappa_king_sig',
  },
  kd_s_bara: {
    name: 'バラの大王パンチ', kana: 'ばらのだいおうぱんち', kind: 'skill', job: 'kappa_king', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 2.5, ignoreDef: 0.4 },
    desc: '敵全体に大ダメージ。守りの固い敵にもよく効く。', cast: '頭に、まっかなバラがさいた！とげのパンチが、敵をつらぬく！', anim: 'kappa_king_sig',
  },
  kd_s_tougarashi: {
    name: 'トウガラシの大王ほのお', kana: 'とうがらしのだいおうほのお', kind: 'skill', job: 'kappa_king', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 2.5, element: 'fire', critBonus: 0.15 },
    desc: '敵全体に炎の大ダメージ。会心も出やすい。', cast: '頭に、トウガラシがさいた！からーい！口から大きなほのおが出た！', anim: 'kappa_king_sig',
  },
  kd_s_sakura: {
    name: 'さくらの大王ふぶき', kana: 'さくらのだいおうふぶき', kind: 'skill', job: 'kappa_king', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'multi', parts: [{ type: 'phys', mult: 2.2 }, { type: 'heal', target: 'allies', base: [70, 90], thr: 40 }] },
    desc: '敵全体に大ダメージ。仲間全員のHPも回復する。', cast: '頭に、さくらがまんかい！花びらのふぶきが、敵をつつむ！', anim: 'kappa_king_sig',
  },
  kd_s_ninniku: {
    name: 'ニンニクの大王マッスル', kana: 'にんにくのだいおうまっする', kind: 'skill', job: 'kappa_king', mp: 0, target: 'enemies', hidden: true,
    effect: { type: 'phys', mult: 2.9 },
    desc: '敵全体に、とても大きなダメージ。', cast: '頭に、ニンニクの花がさいた！全身の筋肉が、もりもりっ！', anim: 'kappa_king_sig',
  },

  // ───────────── 真理のとびらをひらく者（伝説の職業。はがねのれん金術師＋ほかの 超級職 1つ） ─────────────
  tg_ude: {
    name: '石の大うで', kana: 'いしのおおうで', kind: 'skill', job: 'truth_gate', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.3 },
    desc: '手を合わせて地面にふれると、大きな石のうでがのびて、敵をなぐる。敵1体に大ダメージ。守りの固い敵にもよく効く。', cast: '{a}が両手をパン！と合わせた。地面から、大きな石のうでが！', anim: 'r66d_stonefist',
  },
  tg_buki: {
    name: '武器のれん成', kana: 'ぶきのれんせい', kind: 'skill', job: 'truth_gate', mp: 10, target: 'self', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'def'], mult: 1.45, dur: 45 },
    desc: '手を合わせるだけで、持っている物を、もっと強い武器とよろいに作りかえる。自分の攻撃力と守備力がとても上がる。', cast: '{a}の手の中で、武器が光って形をかえた！', anim: 'charge',
  },
  tg_toride: {
    name: 'とりでのれん成', kana: 'とりでのれんせい', kind: 'skill', job: 'truth_gate', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'barrier', base: [70, 90], thr: 60 }] },
    desc: 'みんなのまわりに、石のとりでを一しゅんで作る。仲間全員の守備力が上がり、光のかべがダメージをすいとる。', cast: '{a}「みんな、とりでの中へ！」', anim: 'r33_alchemy_wall',
  },
  tg_chikei: {
    name: '地形のれん成', kana: 'ちけいのれんせい', kind: 'skill', job: 'truth_gate', mp: 18, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.7 },
        { type: 'atbSet', sub: 35, chance: 0.4, msg: '{t}は、足もとの地面にはまって動けない！', failMsg: '{t}は、地面からぬけ出した！' },
      ],
    },
    desc: 'あたり一面の地面を、山と谷に作りかえる。敵全体にダメージ。地面にはまって止まる敵もいる。', cast: '{a}が地面に手をつくと、大地がぐらりと形をかえた！', anim: 'r66d_terrain',
  },
  tg_iyashi: {
    name: 'いやしのれん成', kana: 'いやしのれんせい', kind: 'skill', job: 'truth_gate', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [125, 150], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }] },
    desc: '体の中の流れをととのえるれん成。仲間全員のHPを回復して、悪いじょうたいも治す。', cast: '{a}のれん成の光が、みんなをやさしくつつむ…', anim: 'heal_ring',
  },
  tg_yari: {
    name: '千本やりのれん成', kana: 'せんぼんやりのれんせい', kind: 'skill', job: 'truth_gate', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.7, hits: 3, ignoreDef: 0.2 },
    desc: '地面から、数えきれないほどのやりが、つぎつぎにつき出す。敵全体に3回ダメージ。', cast: '{a}が両手をパン！と合わせた。地面一面から、やりが！', anim: 'r33_alchemy_spear',
  },
  truth_gate_sig: {
    name: '真理のとびら・大れん成', kana: 'しんりのとびらだいれんせい', kind: 'skill', job: 'truth_gate', mp: 40, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 2.75, ignoreDef: 0.35 },
        { type: 'barrier', target: 'allies', base: [60, 80], thr: 60 },
      ],
    },
    desc: '大きなとびらがひらき、あたり一面の大地が一しゅんで作りかわる、真理のとびらをひらく者の最強の技。敵全体に大ダメージ。守りの固い敵にもよく効き、仲間全員を光のかべで守る。', cast: '{a}「これが…真理のとびらの向こうの力だ！」', anim: 'truth_gate_sig',
  },

  // ───────────── ロゼッタ／ギャラクシーマリオ（伝説の職業。ピーチ／マリオ＋ほかの 超級職 1つ） ─────────────
  rz_ryusei: {
    name: '流れ星', kana: 'ながれぼし', kind: 'skill', job: 'rosetta', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [130, 155], thr: 70 },
    desc: '夜空から、光る流れ星をよびよせる。敵1体に光の大ダメージ。', cast: '{a}が空を指さすと、流れ星が落ちてきた！', anim: 'r66d_meteor',
  },
  rz_chiko: {
    name: 'チコのおうえん', kana: 'ちこのおうえん', kind: 'skill', job: 'rosetta', mp: 16, target: 'allies', role: 'sup',
    effect: { type: 'buff', stats: ['atk', 'mag'], mult: 1.3, dur: 40 },
    desc: 'ちびっこの星の仲間チコたちが、くるくる回っておうえんする。仲間全員の攻撃力と魔力が上がる。', cast: 'チコたちが、{a}のまわりでぴょんぴょんはねた！', anim: 'buff',
  },
  rz_spin: {
    name: '星のスピン', kana: 'ほしのすぴん', kind: 'skill', job: 'rosetta', mp: 16, target: 'enemies',
    effect: { type: 'phys', mult: 1.55, status: { status: 'confuse', chance: 0.3, turns: [1, 2] } },
    desc: '星の光をまとって、くるっと回る。敵全体にダメージ。目を回してこんらんする敵もいる。', cast: '{a}は、星の光をまとってくるっと回った！', anim: 'r66d_spin',
  },
  rz_starbits: {
    name: 'スターピースのシャワー', kana: 'すたーぴーすのしゃわー', kind: 'skill', job: 'rosetta', mp: 22, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [115, 140], thr: 60 }, { type: 'mpHeal', base: [6, 9] }] },
    desc: '色とりどりの星のかけらが、雨のようにふってくる。仲間全員のHPとMPを回復する。', cast: 'キラキラ…{a}のまわりに、星のかけらがふってきた！', anim: 'heal2',
  },
  rz_tenmondai: {
    name: 'ほうき星の天文台', kana: 'ほうきぼしのてんもんだい', kind: 'skill', job: 'rosetta', mp: 20, target: 'allies', role: 'sup',
    effect: { type: 'multi', parts: [{ type: 'buff', stat: 'def', mult: 1.35, dur: 45 }, { type: 'regen', base: [20, 26], thr: 30, dur: 24 }] },
    desc: '星の世界をめぐる天文台の光で、みんなを守る。仲間全員の守備力が上がり、しばらくHPが少しずつ回復する。', cast: '{a}「天文台の光よ、みんなを守って」', anim: 'buff',
  },
  rz_henshin: {
    name: 'チコの大へんしん', kana: 'ちこのだいへんしん', kind: 'skill', job: 'rosetta', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 0.75, hits: 3 },
    desc: 'チコたちが、大きな星にへんしんして体当たり。敵全体に3回ダメージ。', cast: 'チコたちが、ピカーッと光って大きな星になった！', anim: 'r66d_luma',
  },
  rosetta_sig: {
    name: '流星群とチコの大行進', kana: 'りゅうせいぐんとちこのだいこうしん', kind: 'skill', job: 'rosetta', mp: 40, target: 'enemies', spellLike: true,
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [195, 230], thr: 90 },
        { type: 'buff', target: 'allies', stat: 'agi', mult: 1.25, dur: 30 },
      ],
    },
    desc: '数えきれない流れ星と、たくさんのチコたちが空をかける、ロゼッタの最強の技。敵全体に光の大ダメージ。仲間全員の素早さも上がる。', cast: '{a}「チコたち、行きましょう！」空いっぱいに、流れ星がふりそそぐ！', anim: 'rosetta_sig',
    masc: {
      name: 'ギャラクシースターラッシュ', kana: 'ぎゃらくしーすたーらっしゅ',
      desc: '流れ星にのって、たくさんのチコたちと宇宙をかけぬける、ギャラクシーマリオの最強の技。敵全体に光の大ダメージ。仲間全員の素早さも上がる。', cast: '{a}「レッツ・ゴー、ギャラクシー！」空いっぱいに、流れ星がふりそそぐ！',
    },
  },
};
