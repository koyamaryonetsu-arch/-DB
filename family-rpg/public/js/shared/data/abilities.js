// 呪文・特技・掛け合わせ技のデータ
//
// kind:
//   'spell'  … 呪文（マホトーンで ふうじられる）
//   'skill'  … 特技（けん・こぶし・おどり など）
//   'combo'  … 掛け合わせ技（ちがう技を おぼえていると ひらめく）
//   'monster'… モンスター専用
// target:
//   'enemy' 1体 / 'group' おなじ種類の てき全部 / 'enemies' てき全部
//   'ally' みかた1人 / 'allies' みかた全員 / 'self' 自分 / 'deadAlly' しんだ みかた
// effect.type:
//   phys(物理) magic(呪文ダメージ) heal revive buff debuff status cure
//   charge(ためる) cover(かばう) bondUp(きずなゲージ) drainHp mahouken(魔法剣) bond(きずな技)
//   callHelp(なかまをよぶ) telegraph(ためこみ→大技) flee(にげだす) nothing
// element: fire ice wind blast bolt light dark
//
// 名前の一部は「ダイの大冒険」「ロトの紋章」へのオマージュです。
// 上級職・超級職の 技は abilities-adv.js（さいごに まぜる）

import { ADV_ABILITIES } from './abilities-adv.js';

export const ABILITIES = {
  // ───────────── 戦士 ─────────────
  daichi: {
    name: '大地斬', kana: 'だいちざん', kind: 'skill', job: 'warrior', mp: 2, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.5, acc: 0.95 },
    desc: 'ちからを こめた おもい いちげき。かたい てきにも つよい。',
    cast: '{a}の 大地斬！', anim: 'slash_heavy', sword: true,
  },
  kabau: {
    name: 'かばう', kana: 'かばう', kind: 'skill', job: 'warrior', mp: 0, target: 'ally',
    effect: { type: 'cover', dur: 20 },
    desc: 'しばらくの あいだ、なかま 1人への こうげきを かわりに うける。',
    cast: '{a}は {t}の まえに たちはだかった！', anim: 'guard',
  },
  chikaratame: {
    name: 'ちからため', kana: 'ちからため', kind: 'skill', job: 'warrior', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.0 },
    desc: 'ちからを ためて、つぎの こうげきの いりょくを 2ばいにする。',
    cast: '{a}は ちからを ためている！', anim: 'charge',
  },
  kaiha: {
    name: '海波斬', kana: 'かいはざん', kind: 'skill', job: 'warrior', mp: 2, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.15, atbAfter: 45, vsElement: { fire: 1.5 }, vsRace: { slime: 1.4 } },
    desc: 'めにも とまらぬ はやわざ。うったあと すぐに つぎの じゅんばんが くる。ほのおや ぷるぷるした てきに つよい。',
    cast: '{a}の 海波斬！', anim: 'slash_fast', sword: true,
  },
  kabutowari: {
    name: 'かぶと割り', kana: 'かぶとわり', kind: 'skill', job: 'warrior', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.1, debuff: { stat: 'def', mult: 0.7, dur: 30, chance: 0.8 } },
    desc: 'てきの しゅび力を さげる いちげき。',
    cast: '{a}の かぶと割り！', anim: 'slash_heavy', sword: true,
  },
  kuuretsu: {
    name: '空裂斬', kana: 'くうれつざん', kind: 'skill', job: 'warrior', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.2, ignoreDef: 0.6, vsRace: { spirit: 2.0, undead: 1.8 } },
    desc: 'こころの めで てきの かくを きる。ゆうれいや まぞくに とても つよい。',
    cast: '{a}の 空裂斬！', anim: 'slash_light', sword: true,
  },
  majingiri: {
    name: 'まじん斬り', kana: 'まじんぎり', kind: 'skill', job: 'warrior', mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.0, acc: 0.5, forceCrit: true },
    desc: 'あたれば かならず かいしんの いちげき。でも よく はずれる。',
    cast: '{a}の まじん斬り！', anim: 'slash_heavy', sword: true,
  },
  tsurugimai: {
    name: 'つるぎのまい', kana: 'つるぎのまい', kind: 'skill', job: 'warrior', mp: 5, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 0.55, hits: 4, random: true },
    desc: 'まうように 4かい きりつける。あいては ランダム。',
    cast: '{a}の つるぎのまい！', anim: 'slash_multi', sword: true,
  },
  tamashii: {
    name: 'たましいの一撃', kana: 'たましいのいちげき', kind: 'skill', job: 'warrior', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.4 },
    desc: 'せんしの たましいを こめた ひっさつの いちげき。',
    cast: '{a}は たましいを こめて きりかかった！', anim: 'slash_heavy',
  },

  // ───────────── 武闘家 ─────────────
  seiken: {
    name: 'せいけんづき', kana: 'せいけんづき', kind: 'skill', job: 'monk', mp: 2, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 1.6, acc: 0.88, critBonus: 0.05 },
    desc: 'きあいを こめた つき。あたれば おおきな ダメージ。',
    cast: '{a}の せいけんづき！', anim: 'punch', fist: true,
  },
  mikawashi: {
    name: 'みかわしきゃく', kana: 'みかわしきゃく', kind: 'skill', job: 'monk', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.35, dur: 30 },
    desc: 'しばらく てきの こうげきを かわしやすくなる。',
    cast: '{a}は みがるな ステップを ふみはじめた！', anim: 'buff',
  },
  bakuretsu: {
    name: 'ばくれつけん', kana: 'ばくれつけん', kind: 'skill', job: 'monk', mp: 4, target: 'enemies', weapon: 'fist',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: 'めにも とまらぬ 4れんぞく パンチ。あいては ランダム。',
    cast: '{a}の ばくれつけん！', anim: 'punch_multi', fist: true,
  },
  kamaitachi: {
    name: 'かまいたち', kana: 'かまいたち', kind: 'skill', job: 'monk', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, element: 'wind', ignoreDef: 0.3 },
    desc: 'しんくうの やいばを とばす。かぜの ぞくせい。',
    cast: '{a}は しんくうの やいばを はなった！', anim: 'wind1',
  },
  kiaitame: {
    name: 'きあいため', kana: 'きあいため', kind: 'skill', job: 'monk', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.5 },
    desc: 'きあいを ためて、つぎの こうげきを 2.5ばいにする。',
    cast: '{a}は きあいを ためている！', anim: 'charge',
  },
  mouko: {
    name: '猛虎破砕拳', kana: 'もうこはさいけん', kind: 'skill', job: 'monk', mp: 6, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 2.2, debuff: { stat: 'def', mult: 0.75, dur: 25, chance: 0.5 } },
    desc: 'もうこの ごとき ちからで てきを くだく ひっさつけん。',
    cast: '{a}の 猛虎破砕拳！', anim: 'punch', fist: true,
  },
  mawashigeri: {
    name: 'まわしげり', kana: 'まわしげり', kind: 'skill', job: 'monk', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: 'てき全体を けりとばす。',
    cast: '{a}の まわしげり！', anim: 'kick',
  },
  issen: {
    name: 'いっせんづき', kana: 'いっせんづき', kind: 'skill', job: 'monk', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, acc: 0.55, forceCrit: true },
    desc: 'あたれば かならず かいしん。',
    cast: '{a}の いっせんづき！', anim: 'punch',
  },
  hyakuretsu: {
    name: '百裂拳', kana: 'ひゃくれつけん', kind: 'skill', job: 'monk', mp: 8, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 0.5, hits: 6 },
    desc: '1体に 6れんぞくの こぶしを たたきこむ。',
    cast: '{a}の 百裂拳！', anim: 'punch_multi', fist: true,
  },

  // ───────────── 僧侶 ─────────────
  hoimi: {
    name: 'ホイミ', kana: 'ほいみ', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'heal', base: [26, 34], thr: 12 },
    desc: 'なかま 1人の HPを 30ほど かいふくする。',
    cast: '{a}は ホイミを となえた！', anim: 'heal1',
  },
  sukara: {
    name: 'スカラ', kana: 'すから', kind: 'spell', job: 'priest', mp: 2, target: 'ally',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 40 },
    desc: 'なかま 1人の しゅび力を あげる。',
    cast: '{a}は スカラを となえた！', anim: 'buff',
  },
  kiarii: {
    name: 'キアリー', kana: 'きありー', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'cure', statuses: ['poison'] },
    desc: 'どくを なおす。',
    cast: '{a}は キアリーを となえた！', anim: 'heal1',
  },
  bagi: {
    name: 'バギ', kana: 'ばぎ', kind: 'spell', job: 'priest', mp: 3, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [10, 16], thr: 14 },
    desc: 'かまいたちで おなじ しゅるいの てきを きりさく。',
    cast: '{a}は バギを となえた！', anim: 'wind1',
  },
  mahoton: {
    name: 'マホトーン', kana: 'まほとーん', kind: 'spell', job: 'priest', mp: 3, target: 'group',
    effect: { type: 'status', status: 'silence', chance: 0.6, turns: [3, 5] },
    desc: 'てきの じゅもんを ふうじこめる。',
    cast: '{a}は マホトーンを となえた！', anim: 'debuff',
  },
  behoimi: {
    name: 'ベホイミ', kana: 'べほいみ', kind: 'spell', job: 'priest', mp: 5, target: 'ally', field: true,
    effect: { type: 'heal', base: [70, 90], thr: 30 },
    desc: 'なかま 1人の HPを 80ほど かいふくする。',
    cast: '{a}は ベホイミを となえた！', anim: 'heal2',
  },
  zao: {
    name: 'ザオ', kana: 'ざお', kind: 'spell', job: 'priest', mp: 10, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 0.25 },
    desc: 'しんでしまった なかまを いきかえらせる。',
    cast: '{a}は ザオを となえた！', anim: 'revive',
  },
  sukuruto: {
    name: 'スクルト', kana: 'すくると', kind: 'spell', job: 'priest', mp: 6, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
    desc: 'なかま 全員の しゅび力を あげる。',
    cast: '{a}は スクルトを となえた！', anim: 'buff',
  },
  kiariku: {
    name: 'キアリク', kana: 'きありく', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'cure', statuses: ['paralyze', 'sleep', 'confuse'] },
    desc: 'まひ・ねむり・こんらんを なおす。',
    cast: '{a}は キアリクを となえた！', anim: 'heal1',
  },
  bagima: {
    name: 'バギマ', kana: 'ばぎま', kind: 'spell', job: 'priest', mp: 5, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [28, 38], thr: 40 },
    desc: 'つよい かまいたちで おなじ しゅるいの てきを きりさく。',
    cast: '{a}は バギマを となえた！', anim: 'wind2',
  },
  behomara: {
    name: 'ベホマラー', kana: 'べほまらー', kind: 'spell', job: 'priest', mp: 16, target: 'allies', field: true,
    effect: { type: 'heal', base: [60, 80], thr: 60 },
    desc: 'なかま 全員の HPを 70ほど かいふくする。',
    cast: '{a}は ベホマラーを となえた！', anim: 'heal2',
  },

  // ───────────── 魔法使い ─────────────
  mera: {
    name: 'メラ', kana: 'めら', kind: 'spell', job: 'mage', mp: 2, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [12, 16], thr: 12 },
    desc: 'ちいさな 火のたまを ぶつける。',
    cast: '{a}は メラを となえた！', anim: 'fire1', attackSpell: true,
  },
  hyado: {
    name: 'ヒャド', kana: 'ひゃど', kind: 'spell', job: 'mage', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'ice', base: [18, 24], thr: 16 },
    desc: 'するどい こおりの かけらで こうげきする。',
    cast: '{a}は ヒャドを となえた！', anim: 'ice1', attackSpell: true,
  },
  gira: {
    name: 'ギラ', kana: 'ぎら', kind: 'spell', job: 'mage', mp: 4, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [12, 18], thr: 18 },
    desc: 'せんねつで おなじ しゅるいの てきを やきはらう。',
    cast: '{a}は ギラを となえた！', anim: 'fire_wave', attackSpell: true,
  },
  rukani: {
    name: 'ルカニ', kana: 'るかに', kind: 'spell', job: 'mage', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.6, dur: 35, chance: 0.85 },
    desc: 'てき 1体の しゅび力を さげる。',
    cast: '{a}は ルカニを となえた！', anim: 'debuff',
  },
  rariho: {
    name: 'ラリホー', kana: 'らりほー', kind: 'spell', job: 'mage', mp: 3, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [1, 3] },
    desc: 'おなじ しゅるいの てきを ねむらせる。',
    cast: '{a}は ラリホーを となえた！', anim: 'sleep',
  },
  io: {
    name: 'イオ', kana: 'いお', kind: 'spell', job: 'mage', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [16, 22], thr: 24 },
    desc: 'ばくはつで てき 全体に ダメージ。',
    cast: '{a}は イオを となえた！', anim: 'blast1', attackSpell: true,
  },
  merami: {
    name: 'メラミ', kana: 'めらみ', kind: 'spell', job: 'mage', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [48, 62], thr: 34 },
    desc: 'おおきな 火のたまを ぶつける。',
    cast: '{a}は メラミを となえた！', anim: 'fire2', attackSpell: true,
  },
  hyadaruko: {
    name: 'ヒャダルコ', kana: 'ひゃだるこ', kind: 'spell', job: 'mage', mp: 6, target: 'group',
    effect: { type: 'magic', element: 'ice', base: [32, 42], thr: 40 },
    desc: 'こおりの あらしで おなじ しゅるいの てきを こうげき。',
    cast: '{a}は ヒャダルコを となえた！', anim: 'ice2', attackSpell: true,
  },
  begirama: {
    name: 'ベギラマ', kana: 'べぎらま', kind: 'spell', job: 'mage', mp: 7, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [38, 50], thr: 46 },
    desc: 'はげしい せんねつで おなじ しゅるいの てきを やく。',
    cast: '{a}は ベギラマを となえた！', anim: 'fire_wave', attackSpell: true,
  },
  iora: {
    name: 'イオラ', kana: 'いおら', kind: 'spell', job: 'mage', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [46, 58], thr: 52 },
    desc: 'だいばくはつで てき 全体に ダメージ。',
    cast: '{a}は イオラを となえた！', anim: 'blast2', attackSpell: true,
  },
  merazoma: {
    name: 'メラゾーマ', kana: 'めらぞーま', kind: 'spell', job: 'mage', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [140, 170], thr: 80 },
    desc: 'きょだいな 火のたまを ぶつける。',
    cast: '{a}は メラゾーマを となえた！', anim: 'fire3', attackSpell: true,
  },

  // ───────────── 旅芸人 ─────────────
  hustle: {
    name: 'ハッスルダンス', kana: 'はっするだんす', kind: 'skill', job: 'performer', mp: 3, target: 'allies', field: true,
    effect: { type: 'heal', base: [12, 18], thr: 12 },
    desc: 'ゆかいな おどりで なかま 全員の HPを すこし かいふくする。',
    cast: '{a}は ハッスルダンスを おどった！', anim: 'dance',
  },
  piorimu: {
    name: 'ピオリム', kana: 'ぴおりむ', kind: 'spell', job: 'performer', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'agi', mult: 1.35, dur: 40 },
    desc: 'なかま 全員の すばやさを あげる。こうどうの じゅんばんが はやく くる。',
    cast: '{a}は ピオリムを となえた！', anim: 'buff',
  },
  manusa: {
    name: 'マヌーサ', kana: 'まぬーさ', kind: 'spell', job: 'performer', mp: 4, target: 'group',
    effect: { type: 'status', status: 'blind', chance: 0.65, turns: [3, 5] },
    desc: 'まぼろしで つつみ、てきの こうげきを はずれやすくする。',
    cast: '{a}は マヌーサを となえた！', anim: 'debuff',
  },
  medapani: {
    name: 'メダパニダンス', kana: 'めだぱにだんす', kind: 'skill', job: 'performer', mp: 4, target: 'group',
    effect: { type: 'status', status: 'confuse', chance: 0.5, turns: [1, 3] },
    desc: 'ふしぎな おどりで てきを こんらんさせる。',
    cast: '{a}は メダパニダンスを おどった！', anim: 'dance',
  },
  baikiruto: {
    name: 'バイキルト', kana: 'ばいきると', kind: 'spell', job: 'performer', mp: 5, target: 'ally',
    effect: { type: 'buff', stat: 'atk', mult: 1.6, dur: 40 },
    desc: 'なかま 1人の こうげき力を おおきく あげる。',
    cast: '{a}は バイキルトを となえた！', anim: 'buff',
  },
  juggling: {
    name: 'ナイフジャグリング', kana: 'ないふじゃぐりんぐ', kind: 'skill', job: 'performer', mp: 5, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: 'ナイフを なげて てきに 4かい こうげき。あいては ランダム。',
    cast: '{a}の ナイフジャグリング！', anim: 'slash_multi',
  },
  ouen: {
    name: 'おうえんのうた', kana: 'おうえんのうた', kind: 'skill', job: 'performer', mp: 4, target: 'allies',
    effect: { type: 'bondUp', amount: 20 },
    desc: 'げんきな うたで きずなゲージを ふやす。',
    cast: '{a}は おうえんのうたを うたった！', anim: 'dance',
  },
  tatakai_uta: {
    name: 'たたかいのうた', kana: 'たたかいのうた', kind: 'skill', job: 'performer', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 35 },
    desc: 'なかま 全員の こうげき力を あげる。',
    cast: '{a}は たたかいのうたを うたった！', anim: 'dance',
  },
  zameha_dance: {
    name: 'めざめのおどり', kana: 'めざめのおどり', kind: 'skill', job: 'performer', mp: 3, target: 'allies',
    effect: { type: 'cure', statuses: ['sleep', 'confuse', 'paralyze'] },
    desc: 'なかま 全員の ねむり・こんらん・まひを なおす。',
    cast: '{a}は めざめのおどりを おどった！', anim: 'dance',
  },

  // ───────────── 掛け合わせ技（ちがう職業の技を あわせる） ─────────────
  // requires: おぼえている ひつようが ある 技。reqJobLv: 職業レベルの じょうけん
  // つかえるのは、もとに なった しょくぎょうを ぜんぶ あわせもつ 上級職いじょう だけ（stats.js の comboAllowed）
  mahouken: {
    name: '魔法剣', kana: 'まほうけん', kind: 'combo', requires: ['daichi', 'mera'], mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'mahouken' },
    desc: 'おぼえた こうげき呪文を けんに やどらせ、けんの わざで きりつける。「メラ＋大地斬」のように じゆうに くみあわせられる。',
    cast: '', anim: 'slash_heavy',
  },
  senka: {
    name: '閃華裂光拳', kana: 'せんかれっこうけん', kind: 'combo', requires: ['seiken', 'hoimi'], mp: 5, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 2.2, ignoreDef: 0.5, vsRace: { material: 0.3, undead: 1.5 } },
    desc: 'ホイミの ちからを こぶしに こめ、いきものの からだを うちくだく。いわや きかいには きかない。',
    cast: '{a}の 閃華裂光拳！', anim: 'holy_punch',
  },
  kaen_senpu: {
    name: '火炎旋風', kana: 'かえんせんぷう', kind: 'combo', requires: ['gira', 'bagi'], mp: 7, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'fire', base: [24, 32], thr: 24 },
    desc: 'ギラの ほのおを バギの かぜで まきあげる。てき 全体を やきはらう。',
    cast: '{a}は ギラと バギを かけあわせた！ 火炎旋風！', anim: 'fire_tornado',
  },
  nioudachi: {
    name: 'におうだち', kana: 'におうだち', kind: 'combo', requires: ['kabau', 'sukara'], mp: 4, target: 'self',
    effect: { type: 'cover', dur: 15, all: true, defMult: 1.5 },
    desc: 'スカラで からだを かため、なかま 全員への こうげきを ひきうける。',
    cast: '{a}は におうだちで みんなを まもる！', anim: 'guard',
  },
  iyashi_mai: {
    name: 'いやしのまい', kana: 'いやしのまい', kind: 'combo', requires: ['hustle', 'hoimi'], mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [30, 42], thr: 20 },
    desc: 'ホイミの ひかりを まといながら おどり、なかま 全員を かいふくする。',
    cast: '{a}の いやしのまい！', anim: 'heal_dance',
  },
  hayatezuki: {
    name: 'はやてづき', kana: 'はやてづき', kind: 'combo', requires: ['piorimu', 'seiken'], mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, atbAfter: 60 },
    desc: 'かぜの ように つきを はなつ。うったあと すぐに つぎの じゅんばんが くる。',
    cast: '{a}の はやてづき！', anim: 'punch',
  },
  madoromi: {
    name: 'まどろみのうた', kana: 'まどろみのうた', kind: 'combo', requires: ['rariho', 'hustle'], mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.5, turns: [1, 3] },
    desc: 'ラリホーの まりょくを うたに のせ、てき 全体を ねむらせる。',
    cast: '{a}は まどろみのうたを うたった！', anim: 'sleep',
  },
  medoro: {
    name: 'メドロ', kana: 'めどろ', kind: 'combo', requires: ['mera', 'hyado'], reqJobLv: { mage: 4 }, mp: 10, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'void', base: [44, 56], thr: 30 },
    desc: 'しょう消滅呪文。メラと ヒャドを まったく おなじ つよさで ぶつけ、たいせいを むしして けしさる。いつか「メドローア」へ…',
    cast: '{a}は 左手に メラ、右手に ヒャドを…！ メドロ！', anim: 'void',
  },
  star_strash: {
    name: 'スターストラッシュ', kana: 'すたーすとらっしゅ', kind: 'combo', requires: ['daichi', 'kaiha', 'kuuretsu'], mp: 10, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.5, element: 'light' },
    desc: '大地・海・空、3つの かたを きわめた ものだけが はなてる ひっさつけん。',
    cast: '{a}は ぎゃくてに けんを かまえた…！ スターストラッシュ！', anim: 'strash',
  },

  // ───────────── きずな技（パーティーで ちからを あわせる） ─────────────
  minadein: {
    name: 'ミナデイン', kana: 'みなでいん', kind: 'bond', mp: 0, target: 'enemy',
    effect: { type: 'bond' },
    desc: 'きずなゲージが まんたんの ときだけ つかえる。なかま みんなの ちからを あわせた いかずち。',
    cast: '{a}は きずなの紋章を たかく かかげた！', anim: 'minadein',
  },

  // ───────────── モンスター専用 ─────────────
  m_tackle: {
    name: 'たいあたり', kind: 'monster', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.85 }, cast: '{a}の たいあたり！', anim: 'tackle',
    desc: 'からだごと ぶつかる。いりょくは たかいが すこし はずれやすい。',
  },
  m_bite: {
    name: 'かみつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}は するどい キバで かみついた！', anim: 'bite',
    desc: 'するどい キバで かみつく。',
  },
  m_warcry: {
    name: 'おたけび', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.15, dur: 25 }, cast: '{a}は ちからづよい おたけびを あげた！', anim: 'warcry',
    desc: 'みかた みんなの こうげき力を すこし あげる。',
  },
  m_king_press: {
    name: 'キングプレス', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}は とびあがって のしかかった！', anim: 'quake',
    desc: 'おおきな からだで のしかかり、てき 全体に ダメージ。',
  },
  m_blaze: {
    name: 'はげしいほのお', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [40, 55], thr: 30, breath: true }, cast: '{a}は はげしい ほのおを はいた！', anim: 'breath',
    desc: 'はげしい ほのおで てき 全体を やく。',
  },
  m_dragon_claw: {
    name: 'ドラゴンクロー', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 }, cast: '{a}の するどい ツメが ひらめいた！', anim: 'slash_multi',
    desc: 'するどい ツメで ひきさく。',
  },
  m_pounce: {
    name: 'とびかかり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, acc: 0.9 }, cast: '{a}は すばやく とびかかった！', anim: 'bite',
    desc: 'すばやく とびかかって かみつく。',
  },
  m_darkslash: {
    name: 'やみのつるぎ', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'dark' }, cast: '{a}の やみの つるぎ！', anim: 'dark_slash',
    desc: 'やみの ちからを こめた けんで きる。',
  },
  m_horn: {
    name: 'つのでつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は するどい ツノで つきさしてきた！', anim: 'hit',
    desc: 'するどい ツノで つきさす。ふつうの こうげきより つよい。',
  },
  m_sleep_powder: {
    name: 'ねむりのこな', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.4, turns: [1, 2] }, cast: '{a}は ねむりのこなを まきちらした！', anim: 'sleep',
    desc: 'てき1体を ねむらせる こなを まく。',
  },
  m_sweet_breath: {
    name: 'あまいいき', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}は あまい いきを はいた！', anim: 'breath',
    desc: 'あまい いきで てき みんなを ねむらせる ことが ある。',
  },
  m_rock_throw: {
    name: 'いしなげ', kind: 'monster', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.25 }, cast: '{a}は いしを なげつけてきた！', anim: 'hit',
    desc: 'いしを なげつける。',
  },
  m_drain: {
    name: 'ちゅうちゅう', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'drainHp', mult: 0.9 }, cast: '{a}は {t}に かみついて ちを すった！', anim: 'hit',
    desc: 'てきに かみついて、あたえた ダメージの ぶん HPを かいふくする。',
  },
  m_poison_lick: {
    name: 'どくのしたで', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, status: { status: 'poison', chance: 0.4 } }, cast: '{a}は どくの したで なめまわしてきた！', anim: 'hit',
    desc: 'どくの したで なめる。どくに する ことが ある。',
  },
  m_poison_spray: {
    name: 'どくのしぶき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'poison', chance: 0.3 }, cast: '{a}は どくの しぶきを まきちらした！', anim: 'breath',
    desc: 'どくの しぶきで てき みんなを どくに する ことが ある。',
  },
  m_howl: {
    name: 'とおぼえ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'wolf' }, cast: '{a}は とおぼえを あげた！', anim: 'none',
  },
  m_peck: {
    name: 'つつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は するどい くちばしで つついてきた！', anim: 'hit',
    desc: 'するどい くちばしで つつく。',
  },
  m_gust: {
    name: 'かぜをおこす', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [6, 10], thr: 99 }, cast: '{a}は つばさで はげしい かぜを おこした！', anim: 'wind1',
    desc: 'はげしい かぜで てき みんなに ダメージ。',
  },
  m_pinch: {
    name: 'はさむ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は おおきな ハサミで はさみこんできた！', anim: 'hit',
    desc: 'おおきな ハサミで はさむ。',
  },
  m_harden: {
    name: 'かたくなる', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 30 }, cast: '{a}の からだが かたくなった！', anim: 'buff',
    desc: 'からだを かたくして しゅび力を あげる。',
  },
  m_swing: {
    name: 'けんをふりまわす', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, acc: 0.85 }, cast: '{a}は けんを めちゃくちゃに ふりまわした！', anim: 'hit',
    desc: 'けんを ふりまわす。いりょくは たかいが はずれやすい。',
  },
  m_boulder: {
    name: 'いわなげ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は おおきな いわを なげつけてきた！', anim: 'hit',
    desc: 'おおきな いわを なげつける。',
  },
  m_branch_whip: {
    name: 'えだのむち', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は えだを むちのように ふりまわした！', anim: 'hit_all',
    desc: 'えだを むちのように ふりまわし、てき 全体を うつ。',
  },
  m_pollen: {
    name: 'ねむりのかふん', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}は ねむりの かふんを ふりまいた！', anim: 'sleep',
    desc: 'ねむりの かふんで てき 全体を ねむらせる ことが ある。',
  },
  m_root_heal: {
    name: 'ねをはる', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [55, 70], thr: 999, fixed: true }, cast: '{a}は じめんに ねを はった！ だいちの ちからを すいあげる！', anim: 'heal1',
    desc: 'じめんに ねを はり、じぶんの HPを かいふくする。',
  },
  m_big_branch: {
    name: 'おおえだたたき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は ふとい えだを ふりおろした！', anim: 'hit',
  },
  m_rock_crush: {
    name: 'いわくだき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は いわのような こぶしを たたきつけた！', anim: 'hit',
  },
  m_stomp: {
    name: 'じならし', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.65 }, cast: '{a}は じめんを ふみならした！ だいちが ゆれる！', anim: 'quake',
    desc: 'じめんを ふみならして てき みんなに ダメージ。',
  },
  m_inhale: {
    name: 'いきをすいこむ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_avalanche' }, cast: '{a}は おおきく いきを すいこんだ！', anim: 'charge',
  },
  m_avalanche: {
    name: 'いわなだれ', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.25, ignoreDef: 0.3 }, cast: '{a}の いわなだれ！ きょだいな いわが ふりそそぐ！', anim: 'quake',
    desc: 'いわなだれで てき みんなに おおきな ダメージ。',
  },
  m_summon_rocks: {
    name: 'いわをよぶ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'rock_shard', count: 2 }, cast: '{a}の からだから いわの かけらが はがれおちた！', anim: 'none',
  },
  m_flee: {
    name: 'にげだす', kind: 'monster', target: 'self',
    effect: { type: 'flee' }, cast: '{a}は にげだした！', anim: 'none',
  },
  m_dark_bolt: {
    name: 'やみのいかずち', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [14, 20], thr: 99 }, cast: '{a}は やみの いかずちを はなった！', anim: 'dark1',
    desc: 'やみの いかずちで てき1体を うつ。',
  },
  m_fire_breath: {
    name: 'ひのいき', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [8, 12], thr: 99, breath: true }, cast: '{a}は ひのいきを はいた！', anim: 'breath',
    desc: 'ひのいきで てき みんなを やく。',
  },
  m_glare: {
    name: 'にらみつける', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.25, turns: [1, 2] }, cast: '{a}は {t}を するどく にらみつけた！', anim: 'debuff',
    desc: 'するどく にらんで まひさせる ことが ある。',
  },
  m_nothing: {
    name: 'ようすをみる', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は ようすを うかがっている。', anim: 'none',
  },
  m_dance: {
    name: 'ふしぎなおどり', kind: 'monster', target: 'enemy',
    effect: { type: 'drainMp', amount: [3, 6] }, cast: '{a}は ふしぎな おどりを おどった！', anim: 'dance',
  },
};
Object.assign(ABILITIES, ADV_ABILITIES);

// 攻撃呪文かどうか（魔法剣で使える）
export function isAttackSpell(id) {
  const a = ABILITIES[id];
  return !!(a && a.attackSpell);
}

// 剣技かどうか（魔法剣で使える）
export function isSwordSkill(id) {
  const a = ABILITIES[id];
  return !!(a && a.sword);
}

export const ELEMENT_NAMES = {
  fire: 'ほのお', ice: 'こおり', wind: 'かぜ', blast: 'ばくはつ', bolt: 'いかずち', light: 'ひかり', dark: 'やみ', void: 'しょうめつ',
};

// れんけい（ちがう人が つづけて こうげき）で おこる 合体ボーナス
// 先の属性 → 後の属性 の組み合わせ（順番は どちらでも よい）
export const TEAM_COMBOS = [
  { a: 'fire', b: 'ice', name: '対消滅', kana: 'ついしょうめつ', mult: 0.8, element: 'void', desc: 'ほのおと こおりが ぶつかり、すべてを けしさる ひかりが うまれた！' },
  { a: 'fire', b: 'wind', name: '火炎旋風', kana: 'かえんせんぷう', mult: 0.5, element: 'fire', all: true, desc: 'ほのおが かぜに のって うずを まいた！' },
  { a: 'ice', b: 'wind', name: 'ブリザード', kana: 'ぶりざーど', mult: 0.5, element: 'ice', all: true, desc: 'こおりが かぜに のり、ふぶきが ふきあれた！' },
  { a: 'fire', b: 'blast', name: '大爆炎', kana: 'だいばくえん', mult: 0.6, element: 'blast', all: true, desc: 'ほのおが ばくはつし、おおきな ばくえんが あがった！' },
  { a: 'phys', b: 'wind', name: 'しんくうぎり', kana: 'しんくうぎり', mult: 0.5, element: 'wind', desc: 'かぜが やいばを おいかけ、しんくうの きずを きざんだ！' },
];
