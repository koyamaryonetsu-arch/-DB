// なかまに なる モンスター
//
// 紋章の ちから「まもののこころ」に めざめると、たたかいで さいごに たおした まものが
// ときどき おきあがって なかまに なりたがる（ボスや ものがたりの てきは なかまに ならない）
//
// rate:   なかまに なりたがる かくりつ（たたかい 1かいごと）
// growth: レベルごとの のびかた（にんげんの 基本ステータスに かける ばいりつ。職業の mods と おなじ）
// learn:  [レベル, わざID] … レベルが あがると おぼえる
// names:  なかまに なった ときの なまえ（じゅんばんに つかう。酒場で かえられる）
// resist: たいせい（しゅぞくの たいせいを つかう。ここに かけば うわがき）

export const MONSTER_FRIENDS = {
  pururin: {
    rate: 1 / 10, names: ['ぷるる', 'ぷるお', 'ぷるみ', 'ぷるたろう'],
    growth: { hp: 0.9, mp: 0.85, str: 0.85, def: 0.9, agi: 1.0, mag: 0.9, heal: 1.1 },
    learn: [[1, 'm_tackle'], [3, 'hoimi'], [7, 'mera'], [11, 'sukara'], [15, 'behoimi'], [20, 'merami'], [26, 'behomara']],
    note: 'いやしの じゅもんを おぼえる ぷるぷるの なかま。',
  },
  tsunousagi: {
    rate: 1 / 12, names: ['ツノすけ', 'ピョンタ', 'うさみ', 'ツノまる'],
    growth: { hp: 0.9, mp: 0.5, str: 1.05, def: 0.8, agi: 1.35, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_horn'], [4, 'mikawashi'], [8, 'piorimu'], [12, 'kamaitachi'], [17, 'mawashigeri'], [22, 'issen']],
    note: 'とても すばやい。まっさきに とびこんでいく。',
  },
  kobushi: {
    rate: 1 / 12, names: ['コブシン', 'キノパン', 'こぶりん', 'ナグール'],
    growth: { hp: 1.05, mp: 0.6, str: 1.1, def: 1.0, agi: 0.8, mag: 0.5, heal: 0.8 },
    learn: [[1, 'seiken'], [3, 'm_sleep_powder'], [7, 'kiarii'], [11, 'bakuretsu'], [16, 'kiaitame'], [22, 'hyakuretsu']],
    note: 'こぶしの わざが とくいな キノコ。',
  },
  koumorin: {
    rate: 1 / 14, names: ['コウモン', 'バッティ', 'ぱたぱた', 'よるまる'],
    growth: { hp: 0.85, mp: 0.8, str: 0.95, def: 0.8, agi: 1.3, mag: 0.9, heal: 0.7 },
    learn: [[1, 'm_drain'], [4, 'manusa'], [8, 'm_gust'], [12, 'bagi'], [18, 'bagima']],
    note: 'てきの HPを すいとる。かぜの じゅもんも おぼえる。',
  },
  goblin: {
    rate: 1 / 16, names: ['ゴブたろう', 'ゴブリー', 'いたずらっこ', 'ゴブすけ'],
    growth: { hp: 1.05, mp: 0.6, str: 1.15, def: 1.0, agi: 0.95, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_rock_throw'], [4, 'chikaratame'], [8, 'm_boulder'], [13, 'medapani'], [18, 'm_stomp']],
    note: 'ちからもちの いたずらもの。',
  },
  pururin_beth: {
    rate: 1 / 14, names: ['ベス', 'ほのか', 'あかぷる', 'ベスたろう'],
    growth: { hp: 0.95, mp: 1.2, str: 0.8, def: 0.9, agi: 1.0, mag: 1.25, heal: 1.0 },
    learn: [[1, 'mera'], [4, 'hoimi'], [8, 'gira'], [12, 'merami'], [17, 'begirama'], [23, 'merazoma']],
    note: 'ほのおの じゅもんが とくいな あかい ぷるりん。',
  },
  frog: {
    rate: 1 / 16, names: ['ケロッタ', 'ゲコすけ', 'どくみ', 'ケロまる'],
    growth: { hp: 1.0, mp: 0.8, str: 1.0, def: 0.95, agi: 1.05, mag: 0.9, heal: 0.8 },
    learn: [[1, 'm_poison_lick'], [4, 'kiarii'], [8, 'hyado'], [12, 'm_poison_spray'], [17, 'hyadaruko']],
    note: 'どくに つよい カエル。こおりの じゅもんも つかう。',
  },
  nemuri: {
    rate: 1 / 16, names: ['スヤリン', 'ねむこ', 'まくらん', 'ふわり'],
    growth: { hp: 1.1, mp: 1.1, str: 0.85, def: 1.05, agi: 0.7, mag: 0.9, heal: 1.2 },
    learn: [[1, 'm_sweet_breath'], [4, 'hoimi'], [8, 'rariho'], [13, 'behoimi'], [18, 'kiariku'], [24, 'zao']],
    note: 'てきを ねむらせる。いやしの ちからも つよい。',
  },
  wolf: {
    rate: 1 / 18, names: ['ガルル', 'シルバ', 'ウルフィ', 'はやて'],
    growth: { hp: 1.05, mp: 0.5, str: 1.2, def: 0.95, agi: 1.35, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_bite'], [5, 'm_warcry'], [9, 'kamaitachi'], [14, 'mouko'], [20, 'issen']],
    note: 'するどい キバの おおかみ。おたけびで みんなを ふるいたたせる。',
  },
  lamp: {
    rate: 1 / 18, names: ['ランプル', 'ともしび', 'ほむら', 'ポッポ'],
    growth: { hp: 0.85, mp: 1.35, str: 0.7, def: 0.85, agi: 1.05, mag: 1.4, heal: 0.8 },
    learn: [[1, 'mera'], [4, 'gira'], [8, 'merami'], [12, 'begirama'], [18, 'merazoma'], [24, 'm_fire_breath']],
    note: 'ほのおの せいれい。こうげき呪文の いりょくが たかい。',
  },
  hedoron: {
    rate: 1 / 18, names: ['ヘドロン', 'どろすけ', 'ぬまお', 'べとべと'],
    growth: { hp: 1.25, mp: 0.7, str: 1.0, def: 1.1, agi: 0.7, mag: 0.7, heal: 0.9 },
    learn: [[1, 'm_poison_spray'], [5, 'm_harden'], [9, 'hoimi'], [14, 'm_poison_lick'], [19, 'behoimi']],
    note: 'HPが おおく しぶとい。どくを まきちらす。',
  },
  armor_crab: {
    rate: 1 / 20, names: ['カニタ', 'ガニー', 'はさみん', 'よろいまる'],
    growth: { hp: 1.15, mp: 0.5, str: 1.1, def: 1.45, agi: 0.75, mag: 0.5, heal: 0.6 },
    learn: [[1, 'm_pinch'], [4, 'm_harden'], [8, 'kabau'], [12, 'sukuruto'], [18, 'nioudachi']],
    note: 'かたい こうらで なかまを まもる。',
  },
  ice_pururin: {
    rate: 1 / 18, names: ['ヒャドりん', 'ゆきみ', 'つららん', 'ひえぷる'],
    growth: { hp: 0.95, mp: 1.2, str: 0.8, def: 1.0, agi: 1.05, mag: 1.25, heal: 1.05 },
    learn: [[1, 'hyado'], [4, 'hoimi'], [9, 'hyadaruko'], [14, 'behoimi'], [19, 'sukuruto']],
    note: 'こおりの じゅもんが とくいな つめたい ぷるりん。',
  },
  crow: {
    rate: 1 / 20, names: ['カーすけ', 'クロウ', 'はばたき', 'くろまる'],
    growth: { hp: 0.95, mp: 0.8, str: 1.1, def: 0.85, agi: 1.35, mag: 0.9, heal: 0.6 },
    learn: [[1, 'm_peck'], [4, 'm_gust'], [8, 'bagi'], [13, 'piorimu'], [18, 'bagima']],
    note: 'そらから つつく すばやい カラス。',
  },
  skeleton: {
    rate: 1 / 24, names: ['ホネゾウ', 'カラコロ', 'ボーン', 'しろほね'],
    growth: { hp: 1.1, mp: 0.6, str: 1.25, def: 1.1, agi: 0.9, mag: 0.5, heal: 0.5 },
    learn: [[1, 'm_swing'], [5, 'chikaratame'], [10, 'm_glare'], [15, 'mawashigeri'], [21, 'tamashii']],
    note: 'けんの うでが たつ がいこつ。こうげき力が たかい。',
  },
  dark_bat: {
    rate: 1 / 22, names: ['ヤミー', 'くらやみ', 'ノクト', 'バット'],
    growth: { hp: 0.95, mp: 1.0, str: 1.05, def: 0.85, agi: 1.35, mag: 1.0, heal: 0.7 },
    learn: [[1, 'm_drain'], [4, 'manusa'], [9, 'm_dark_bolt'], [14, 'rukani'], [19, 'mahoton']],
    note: 'くらやみの ちからを つかう こうもり。',
  },
  rockman: {
    rate: 1 / 28, names: ['ゴロン', 'いわお', 'ガンさん', 'ロック'],
    growth: { hp: 1.4, mp: 0.4, str: 1.3, def: 1.4, agi: 0.6, mag: 0.4, heal: 0.5 },
    learn: [[1, 'm_boulder'], [4, 'm_harden'], [9, 'kabau'], [14, 'm_stomp'], [20, 'm_avalanche']],
    note: 'とても かたくて ちからもち。うごきは おそい。',
  },
  shadow_mage: {
    rate: 1 / 32, names: ['カゲロウ', 'シャドー', 'よみ', 'ゆらぎ'],
    growth: { hp: 0.95, mp: 1.35, str: 0.8, def: 0.9, agi: 1.0, mag: 1.3, heal: 1.2 },
    learn: [[1, 'gira'], [3, 'hoimi'], [7, 'rukani'], [11, 'begirama'], [15, 'behoimi'], [20, 'zao'], [25, 'iora']],
    note: 'やみから ときはなたれた まほうつかい。こうげきも かいふくも できる。',
  },
  kirakira: {
    rate: 1 / 40, names: ['キラリン', 'ぎんちゃん', 'ピカ', 'メタリン'],
    growth: { hp: 0.7, mp: 1.0, str: 0.9, def: 2.0, agi: 1.8, mag: 1.0, heal: 1.0 },
    learn: [[1, 'mera'], [3, 'hoimi'], [6, 'piorimu'], [10, 'merami'], [15, 'io'], [20, 'behoimi'], [25, 'iora']],
    resist: { sleep: 0.5, poison: 0.5, confuse: 0.5 },
    note: 'めったに なかまに ならない ぎんいろの ぷるりん。とても かたくて すばやい！',
  },
};

// なかまに できる かず（酒場で まっている なかまも ふくむ）
export const ROSTER_MAX = 24;
// いっしょに ぼうけんできる なかまの かず（じぶんを のぞく）
export const COMPANION_SLOTS = 3;

// モンスターの なかまの 「からだの つよさ」（ぶきや よろい・つえの かわり）
export function monsterNatural(level) {
  const L = level - 1;
  return { atk: 4 + 1.4 * L, dfn: 4 + 1.5 * L, mag: 1.5 + 1.0 * L, heal: 1.5 + 1.0 * L };
}
