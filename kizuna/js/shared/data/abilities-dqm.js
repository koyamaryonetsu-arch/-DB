// 第45回（ドラクエふう D1。docs/plan-breed-new.md の 7-1 の 2回目）: ドラクエふうの 魔物 11しゅが 覚える 技（data/companions-dqm.js の learn）
//   ・kind は 'monster'（魔物の 技。仲間の 魔物は MP を つかう）
//   ・看板の 技の えんしゅつ（anim）の dq_〜 は 絵の 係（D2）が 作る（名前の 約束: dq_gold_rain・dq_rose_storm・dq_world_tree・dq_lantern・
//     dq_bone_king・dq_seasons・dq_killer_slash・dq_chomp・dq_dragon_lord）。ほかの 技は 今 ある えんしゅつ
//   ・強さの めやす: 系統の おうぎ（abilities-ougi.js。Lv30 の 1体 150〜180・Lv60 の 全体 135〜180）を こえない（1つの 魔法は 180 まで・物理は 2.6倍 まで）
//   abilities.js が まぜる。ここは ほかの データを import しない

const STATUS_ALL = ['poison', 'sleep', 'paralyze', 'confuse', 'blind', 'silence'];

export const DQM_ABILITIES = {
  // ───────────── スライム系（ぷるりんクイーン・ゴールドぷるりん）─────────────
  dq_queen_grace: {
    name: 'クイーンのめぐみ', kana: 'くいーんのめぐみ', kind: 'monster', mp: 14, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [55, 70], thr: 40 }, { type: 'buff', stat: 'def', mult: 1.2, dur: 30 }] },
    desc: '女王のやさしい光で、仲間全員のHPを回復して、守備力も少し上げる。', cast: '{a}のかんむりが、やさしく光った！', anim: 'heal_dance',
  },
  dq_royal_press: {
    name: 'ロイヤルプレス', kana: 'ろいやるぷれす', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'phys', mult: 1.0, status: { status: 'paralyze', chance: 0.15, turns: [1, 2] } },
    desc: '高くとび上がって、女王の重みでおしつぶす。敵全体にダメージ。マヒさせることもある。', cast: '{a}は高くとび上がった！ロイヤルプレス！', anim: 'quake',
  },
  dq_gold_rain: {
    name: 'ゴールドシャワー', kana: 'ごーるどしゃわー', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'magic', base: [80, 100], thr: 50 },
    desc: '金色のコインを、雨のようにふらせる。敵全体にダメージ。', cast: '{a}の体から、金色のコインがあふれ出した！', anim: 'dq_gold_rain',
  },
  dq_gold_body: {
    name: '黄金のからだ', kana: 'おうごんのからだ', kind: 'monster', mp: 4, target: 'self', role: 'sup',
    effect: { type: 'buff', stat: 'def', mult: 1.6, dur: 30 },
    desc: '体をピカピカの金色にかためる。自分の守備力がとても上がる。', cast: '{a}の体が、ピカピカの金色にかたまった！', anim: 'buff',
  },

  // ───────────── 植物系（ローズクイーン・せかいじゅの子）─────────────
  dq_rose_whip: {
    name: 'いばらのムチ', kana: 'いばらのむち', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, status: { status: 'poison', chance: 0.4 } },
    desc: 'トゲだらけのバラのつるで打つ。敵1体にダメージ。毒にすることもある。', cast: '{a}のいばらのムチ！', anim: 'slash_multi',
  },
  dq_rose_charm: {
    name: 'みりょうのかおり', kana: 'みりょうのかおり', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.35, turns: [1, 3] },
    desc: 'あまいバラのかおりで、敵全体の心をまどわせる。混乱させることがある。', cast: '{a}のまわりに、あまいかおりが広がった…', anim: 'dance',
  },
  dq_rose_storm: {
    name: 'ローズストーム', kana: 'ろーずすとーむ', kind: 'monster', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [110, 135], thr: 70, status: { status: 'poison', chance: 0.25 } },
    desc: 'バラの花びらのあらしを起こす。敵全体に風のダメージ。毒にすることもある。', cast: '{a}「さあ、花びらの中でおどりなさい！」ローズストーム！', anim: 'dq_rose_storm',
  },
  dq_yggdra_leaf: {
    name: 'せかいじゅのは', kana: 'せかいじゅのは', kind: 'monster', mp: 18, target: 'deadAlly', role: 'heal',
    effect: { type: 'revive', hpRatio: 0.5 },
    desc: 'せかいじゅの葉っぱで、死んでしまった仲間1人を生き返らせる（HPは半分）。', cast: '{a}は、せかいじゅの葉っぱをそっとのせた…', anim: 'revive',
  },
  dq_world_tree: {
    name: 'せかいじゅのいのり', kana: 'せかいじゅのいのり', kind: 'monster', mp: 28, target: 'allies', role: 'heal',
    effect: {
      type: 'multi',
      parts: [{ type: 'heal', base: [100, 125], thr: 60 }, { type: 'cure', statuses: STATUS_ALL }, { type: 'regen', base: [10, 13], thr: 40, dur: 24 }],
    },
    desc: 'せかいじゅの葉っぱがまいおりる。仲間全員のHPを大きく回復して、悪いじょうたいも治し、しばらく少しずつ回復する。', cast: '空から、せかいじゅの葉っぱがまいおりてきた…！', anim: 'dq_world_tree',
  },

  // ───────────── ゾンビ系（ランタンゴースト・がいこつ王）─────────────
  dq_lantern: {
    name: 'おにび', kana: 'おにび', kind: 'monster', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [60, 78], thr: 40, status: { status: 'blind', chance: 0.2, turns: [2, 3] } },
    desc: 'ランタンの中の青い火を、ふわふわとばす。敵全体に炎のダメージ。目がくらむこともある。', cast: '{a}のランタンから、青い火がふわりとうかんだ…', anim: 'dq_lantern',
  },
  dq_lantern_lure: {
    name: 'まよいびのあかり', kana: 'まよいびのあかり', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'confuse', chance: 0.3, turns: [1, 2] },
    desc: 'ゆらゆらゆれるあかりで、敵全体を道にまよわせる。混乱させることがある。', cast: '{a}のランタンが、ゆらゆらゆれた…', anim: 'dance',
  },
  dq_bone_king: {
    name: 'ほねの王のいかり', kana: 'ほねのおうのいかり', kind: 'monster', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 1.55, element: 'dark', debuff: { stat: 'def', mult: 0.8, dur: 25, chance: 0.5 } },
    desc: '地面からほねの山がふき上がる、がいこつ王の技。敵全体に闇のダメージ。守備力が下がる敵もいる。', cast: '{a}「ほねの王の力を見よ！」地面から、ほねがふき上がった！', anim: 'dq_bone_king',
  },

  // ───────────── せいれい系（こよみのせいれい）─────────────
  dq_spring_breeze: {
    name: 'はるかぜ', kana: 'はるかぜ', kind: 'monster', mp: 10, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [45, 60], thr: 40 }, { type: 'cure', statuses: ['poison', 'sleep'] }] },
    desc: 'あたたかい春の風で、仲間全員のHPを回復して、毒とねむりを治す。', cast: '{a}のまわりに、あたたかい春の風がふいた！', anim: 'heal_dance',
  },
  dq_summer_sun: {
    name: 'なつのひざし', kana: 'なつのひざし', kind: 'monster', mp: 10, target: 'allies', role: 'sup',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 30 },
    desc: 'まぶしい夏のひざしで、仲間全員を元気にする。攻撃力が上がる。', cast: '{a}のまわりに、まぶしい夏のひざしがさした！', anim: 'buff',
  },
  dq_winter_snow: {
    name: 'ふゆのふぶき', kana: 'ふゆのふぶき', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [80, 100], thr: 50 },
    desc: 'つめたい冬のふぶきを起こす。敵全体に氷のダメージ。', cast: '{a}のまわりに、冬のふぶきがふきあれた！', anim: 'ice1',
  },
  dq_seasons: {
    name: '四季のめぐり', kana: 'しきのめぐり', kind: 'monster', mp: 28, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'light', base: [36, 44], thr: 20 },
        { type: 'magic', element: 'fire', base: [36, 44], thr: 20 },
        { type: 'magic', element: 'wind', base: [36, 44], thr: 20 },
        { type: 'magic', element: 'ice', base: [36, 44], thr: 20 },
      ],
    },
    desc: '春の光・夏の火・秋の風・冬の氷が、じゅんばんにめぐる、こよみのせいれいの技。敵全体に4回ダメージ。', cast: '春・夏・秋・冬…{a}のまわりで、四季がめぐりはじめた！', anim: 'dq_seasons',
  },

  // ───────────── 物質系（キラーからくり・ひとくい箱）─────────────
  dq_killer_slash: {
    name: 'キラーれんぎり', kana: 'きらーれんぎり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, hits: 2 },
    desc: '2本のうでの剣で、すばやく2回切りつける。敵1体に2回ダメージ（2回こうげき）。', cast: '{a}の2本の剣がうなった！キラーれんぎり！', anim: 'dq_killer_slash',
  },
  dq_killer_arrow: {
    name: 'キラーアロー', kana: 'きらーあろー', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.5, ignoreDef: 0.3, acc: 1 },
    desc: 'うでの弓で、ねらいすました矢をうつ。敵1体にダメージ。守りのかたい敵にも、よく当たる。', cast: '{a}は弓をかまえた…キラーアロー！', anim: 'hit',
  },
  dq_karakuri_rush: {
    name: 'からくりらんぶ', kana: 'からくりらんぶ', kind: 'monster', mp: 10, target: 'enemies',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: '歯車をギリギリ回して、むちゃくちゃに切りまくる。敵にランダムで4回ダメージ。', cast: '{a}の歯車が、ギリギリと回りだした！', anim: 'slash_multi',
  },
  dq_chomp: {
    name: 'ひとくいかみつき', kana: 'ひとくいかみつき', kind: 'monster', mp: 6, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, acc: 0.9, critBonus: 0.25 },
    desc: '大きなふたの口で、ばくっとかみつく。敵1体に大きなダメージ。会心がとても出やすい。', cast: '{a}のふたが、ガバッと開いた！', anim: 'dq_chomp',
  },

  // ───────────── 悪魔系（プチデビ）─────────────
  dq_petit_fork: {
    name: 'フォークでつつく', kana: 'ふぉーくでつつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.45 },
    desc: '小さなフォークで、ちくちくつつく。敵1体にダメージ。', cast: '{a}はフォークでつついた！', anim: 'hit',
  },
  dq_petit_trick: {
    name: 'いたずらトリック', kana: 'いたずらとりっく', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'status', status: 'confuse', chance: 0.45, turns: [1, 3] },
    desc: 'へんな顔やいたずらで、敵1体をまどわせる。混乱させることがある。', cast: '{a}はいたずらっぽく笑った！', anim: 'dance',
  },

  // ───────────── ドラゴン系（竜王のまご）─────────────
  dq_dark_breath: {
    name: 'やみのいき', kana: 'やみのいき', kind: 'monster', mp: 14, target: 'enemies',
    effect: { type: 'magic', element: 'dark', base: [80, 100], thr: 50, breath: true },
    desc: 'まっ黒なけむりのような、闇の息をはく。敵全体に闇のダメージ。', cast: '{a}は、まっ黒な息をはいた！', anim: 'breath',
  },
  dq_dragon_lord: {
    name: '竜王へんしん', kana: 'りゅうおうへんしん', kind: 'monster', mp: 32, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'buff', target: 'self', stats: ['atk', 'def'], mult: 1.3, dur: 40 },
        { type: 'magic', element: 'fire', base: [140, 170], thr: 80, breath: true },
      ],
    },
    desc: 'おじいちゃんゆずりの力で、大きな竜のすがたにかわり、ものすごい炎をはく。敵全体に炎の大ダメージ。自分の攻撃力と守備力も上がる。', cast: '{a}の体が光につつまれ…大きな竜のすがたになった！', anim: 'dq_dragon_lord',
  },
};

export const DQM_ABILITY_IDS = Object.keys(DQM_ABILITIES);
