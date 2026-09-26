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

import { ADV_ABILITIES } from './abilities-adv.js?v=5d38639d0719';
import { CH2_ABILITIES } from './abilities-ch2.js?v=5d38639d0719';

export const ABILITIES = {
  // ───────────── 戦士 ─────────────
  daichi: {
    name: '大地斬', kana: 'だいちざん', kind: 'skill', job: 'warrior', mp: 2, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.5, acc: 0.95 },
    desc: '力をこめた重い一撃。固い敵にも強い。',
    cast: '{a}の大地斬！', anim: 'slash_heavy', sword: true,
  },
  kabau: {
    name: 'かばう', kana: 'かばう', kind: 'skill', job: 'warrior', mp: 0, target: 'ally',
    effect: { type: 'cover', dur: 20 },
    desc: 'しばらくの間、仲間1人への攻撃を代わりに受ける。',
    cast: '{a}は{t}の前に立ちはだかった！', anim: 'guard',
  },
  chikaratame: {
    name: '力ため', kana: 'ちからため', kind: 'skill', job: 'warrior', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.0 },
    desc: '力をためて、次の攻撃の威力を2倍にする。',
    cast: '{a}は力をためている！', anim: 'charge',
  },
  kaiha: {
    name: '海波斬', kana: 'かいはざん', kind: 'skill', job: 'warrior', mp: 2, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.15, atbAfter: 45, vsElement: { fire: 1.5 }, vsRace: { slime: 1.4 } },
    desc: '目にも止まらぬ早業。打った後すぐに次の順番が来る。炎やぷるぷるした敵に強い。',
    cast: '{a}の海波斬！', anim: 'slash_fast', sword: true,
  },
  kabutowari: {
    name: 'かぶと割り', kana: 'かぶとわり', kind: 'skill', job: 'warrior', mp: 3, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.1, debuff: { stat: 'def', mult: 0.7, dur: 30, chance: 0.8 } },
    desc: '敵の守備力を下げる一撃。',
    cast: '{a}のかぶと割り！', anim: 'slash_heavy', sword: true,
  },
  kuuretsu: {
    name: '空裂斬', kana: 'くうれつざん', kind: 'skill', job: 'warrior', mp: 4, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.2, ignoreDef: 0.6, vsRace: { spirit: 2.0, undead: 1.8 } },
    desc: '心の目で敵のかくを切る。ゆうれいや魔族にとても強い。',
    cast: '{a}の空裂斬！', anim: 'slash_light', sword: true,
  },
  majingiri: {
    name: '魔神斬り', kana: 'まじんぎり', kind: 'skill', job: 'warrior', mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 1.0, acc: 0.5, forceCrit: true },
    desc: '当たれば必ず会心の一撃。でもよく外れる。',
    cast: '{a}の魔神斬り！', anim: 'slash_heavy', sword: true,
  },
  tsurugimai: {
    name: 'つるぎのまい', kana: 'つるぎのまい', kind: 'skill', job: 'warrior', mp: 5, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 0.55, hits: 4, random: true },
    desc: 'まうように4回切りつける。相手はランダム。',
    cast: '{a}のつるぎのまい！', anim: 'slash_multi', sword: true,
  },
  tamashii: {
    name: 'たましいの一撃', kana: 'たましいのいちげき', kind: 'skill', job: 'warrior', mp: 8, target: 'enemy',
    effect: { type: 'phys', mult: 2.4 },
    desc: '戦士のたましいをこめた必殺の一撃。',
    cast: '{a}はたましいをこめて切りかかった！', anim: 'slash_heavy',
  },

  // ───────────── 武闘家 ─────────────
  seiken: {
    name: 'せいけんづき', kana: 'せいけんづき', kind: 'skill', job: 'monk', mp: 2, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 1.6, acc: 0.88, critBonus: 0.05 },
    desc: '気合いをこめたつき。当たれば大きなダメージ。',
    cast: '{a}のせいけんづき！', anim: 'punch', fist: true,
  },
  mikawashi: {
    name: 'みかわしきゃく', kana: 'みかわしきゃく', kind: 'skill', job: 'monk', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'eva', add: 0.35, dur: 30 },
    desc: 'しばらく敵の攻撃をかわしやすくなる。',
    cast: '{a}は身軽なステップをふみ始めた！', anim: 'buff',
  },
  bakuretsu: {
    name: '爆裂拳', kana: 'ばくれつけん', kind: 'skill', job: 'monk', mp: 4, target: 'enemies', weapon: 'fist',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: '目にも止まらぬ4連続パンチ。相手はランダム。',
    cast: '{a}の爆裂拳！', anim: 'punch_multi', fist: true,
  },
  kamaitachi: {
    name: 'かまいたち', kana: 'かまいたち', kind: 'skill', job: 'monk', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.25, element: 'wind', ignoreDef: 0.3 },
    desc: '真空のやいばを飛ばす。風の属性。',
    cast: '{a}は真空のやいばを放った！', anim: 'wind1',
  },
  kiaitame: {
    name: '気合いため', kana: 'きあいため', kind: 'skill', job: 'monk', mp: 0, target: 'self',
    effect: { type: 'charge', mult: 2.5 },
    desc: '気合いをためて、次の攻撃を2.5倍にする。',
    cast: '{a}は気合いをためている！', anim: 'charge',
  },
  mouko: {
    name: '猛虎破砕拳', kana: 'もうこはさいけん', kind: 'skill', job: 'monk', mp: 6, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 2.2, debuff: { stat: 'def', mult: 0.75, dur: 25, chance: 0.5 } },
    desc: '猛虎のごとき力で敵を砕く必殺拳。',
    cast: '{a}の猛虎破砕拳！', anim: 'punch', fist: true,
  },
  mawashigeri: {
    name: 'まわしげり', kana: 'まわしげり', kind: 'skill', job: 'monk', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.8 },
    desc: '敵全体をけり飛ばす。',
    cast: '{a}のまわしげり！', anim: 'kick',
  },
  issen: {
    name: 'いっせんづき', kana: 'いっせんづき', kind: 'skill', job: 'monk', mp: 0, target: 'enemy',
    effect: { type: 'phys', mult: 1.0, acc: 0.55, forceCrit: true },
    desc: '当たれば必ず会心。',
    cast: '{a}のいっせんづき！', anim: 'punch',
  },
  hyakuretsu: {
    name: '百裂拳', kana: 'ひゃくれつけん', kind: 'skill', job: 'monk', mp: 8, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 0.5, hits: 6 },
    desc: '1体に6連続のこぶしをたたきこむ。',
    cast: '{a}の百裂拳！', anim: 'punch_multi', fist: true,
  },

  // ───────────── 僧侶 ─────────────
  hoimi: {
    name: 'ホイミ', kana: 'ほいみ', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'heal', base: [26, 34], thr: 12 },
    desc: '仲間1人のHPを30ほど回復する。',
    cast: '{a}はホイミを唱えた！', anim: 'heal1',
  },
  sukara: {
    name: 'スカラ', kana: 'すから', kind: 'spell', job: 'priest', mp: 2, target: 'ally',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 40 },
    desc: '仲間1人の守備力を上げる。',
    cast: '{a}はスカラを唱えた！', anim: 'buff',
  },
  kiarii: {
    name: 'キアリー', kana: 'きありー', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'cure', statuses: ['poison'] },
    desc: '毒を治す。',
    cast: '{a}はキアリーを唱えた！', anim: 'heal1',
  },
  bagi: {
    name: 'バギ', kana: 'ばぎ', kind: 'spell', job: 'priest', mp: 3, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [10, 16], thr: 14 },
    desc: 'かまいたちで同じ種類の敵を切り裂く。',
    cast: '{a}はバギを唱えた！', anim: 'wind1',
  },
  mahoton: {
    name: 'マホトーン', kana: 'まほとーん', kind: 'spell', job: 'priest', mp: 3, target: 'group',
    effect: { type: 'status', status: 'silence', chance: 0.6, turns: [3, 5] },
    desc: '敵の呪文をふうじこめる。',
    cast: '{a}はマホトーンを唱えた！', anim: 'debuff',
  },
  behoimi: {
    name: 'ベホイミ', kana: 'べほいみ', kind: 'spell', job: 'priest', mp: 5, target: 'ally', field: true,
    effect: { type: 'heal', base: [70, 90], thr: 30 },
    desc: '仲間1人のHPを80ほど回復する。',
    cast: '{a}はベホイミを唱えた！', anim: 'heal2',
  },
  zao: {
    name: 'ザオ', kana: 'ざお', kind: 'spell', job: 'priest', mp: 10, target: 'deadAlly', field: true,
    effect: { type: 'revive', hpRatio: 0.25 },
    desc: '死んでしまった仲間を生き返らせる。',
    cast: '{a}はザオを唱えた！', anim: 'revive',
  },
  sukuruto: {
    name: 'スクルト', kana: 'すくると', kind: 'spell', job: 'priest', mp: 6, target: 'allies',
    effect: { type: 'buff', stat: 'def', mult: 1.35, dur: 40 },
    desc: '仲間全員の守備力を上げる。',
    cast: '{a}はスクルトを唱えた！', anim: 'buff',
  },
  kiariku: {
    name: 'キアリク', kana: 'きありく', kind: 'spell', job: 'priest', mp: 2, target: 'ally', field: true,
    effect: { type: 'cure', statuses: ['paralyze', 'sleep', 'confuse'] },
    desc: 'マヒ・ねむり・混乱を治す。',
    cast: '{a}はキアリクを唱えた！', anim: 'heal1',
  },
  bagima: {
    name: 'バギマ', kana: 'ばぎま', kind: 'spell', job: 'priest', mp: 5, target: 'group',
    effect: { type: 'magic', element: 'wind', base: [28, 38], thr: 40 },
    desc: '強いかまいたちで同じ種類の敵を切り裂く。',
    cast: '{a}はバギマを唱えた！', anim: 'wind2',
  },
  behomara: {
    name: 'ベホマラー', kana: 'べほまらー', kind: 'spell', job: 'priest', mp: 16, target: 'allies', field: true,
    effect: { type: 'heal', base: [60, 80], thr: 60 },
    desc: '仲間全員のHPを70ほど回復する。',
    cast: '{a}はベホマラーを唱えた！', anim: 'heal2',
  },

  // ───────────── 魔法使い ─────────────
  mera: {
    name: 'メラ', kana: 'めら', kind: 'spell', job: 'mage', mp: 2, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [12, 16], thr: 12 },
    desc: '小さな火の玉をぶつける。',
    cast: '{a}はメラを唱えた！', anim: 'fire1', attackSpell: true,
  },
  hyado: {
    name: 'ヒャド', kana: 'ひゃど', kind: 'spell', job: 'mage', mp: 3, target: 'enemy',
    effect: { type: 'magic', element: 'ice', base: [18, 24], thr: 16 },
    desc: 'するどい氷のかけらで攻撃する。',
    cast: '{a}はヒャドを唱えた！', anim: 'ice1', attackSpell: true,
  },
  gira: {
    name: 'ギラ', kana: 'ぎら', kind: 'spell', job: 'mage', mp: 4, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [12, 18], thr: 18 },
    desc: '閃熱で同じ種類の敵を焼きはらう。',
    cast: '{a}はギラを唱えた！', anim: 'fire_wave', attackSpell: true,
  },
  rukani: {
    name: 'ルカニ', kana: 'るかに', kind: 'spell', job: 'mage', mp: 3, target: 'enemy',
    effect: { type: 'debuff', stat: 'def', mult: 0.6, dur: 35, chance: 0.85 },
    desc: '敵1体の守備力を下げる。',
    cast: '{a}はルカニを唱えた！', anim: 'debuff',
  },
  rariho: {
    name: 'ラリホー', kana: 'らりほー', kind: 'spell', job: 'mage', mp: 3, target: 'group',
    effect: { type: 'status', status: 'sleep', chance: 0.6, turns: [1, 3] },
    desc: '同じ種類の敵をねむらせる。',
    cast: '{a}はラリホーを唱えた！', anim: 'sleep',
  },
  io: {
    name: 'イオ', kana: 'いお', kind: 'spell', job: 'mage', mp: 5, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [16, 22], thr: 24 },
    desc: '爆発で敵全体にダメージ。',
    cast: '{a}はイオを唱えた！', anim: 'blast1', attackSpell: true,
  },
  merami: {
    name: 'メラミ', kana: 'めらみ', kind: 'spell', job: 'mage', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [48, 62], thr: 34 },
    desc: '大きな火の玉をぶつける。',
    cast: '{a}はメラミを唱えた！', anim: 'fire2', attackSpell: true,
  },
  hyadaruko: {
    name: 'ヒャダルコ', kana: 'ひゃだるこ', kind: 'spell', job: 'mage', mp: 6, target: 'group',
    effect: { type: 'magic', element: 'ice', base: [32, 42], thr: 40 },
    desc: '氷の嵐で同じ種類の敵を攻撃。',
    cast: '{a}はヒャダルコを唱えた！', anim: 'ice2', attackSpell: true,
  },
  begirama: {
    name: 'ベギラマ', kana: 'べぎらま', kind: 'spell', job: 'mage', mp: 7, target: 'group',
    effect: { type: 'magic', element: 'fire', base: [38, 50], thr: 46 },
    desc: '激しい閃熱で同じ種類の敵を焼く。',
    cast: '{a}はベギラマを唱えた！', anim: 'fire_wave', attackSpell: true,
  },
  iora: {
    name: 'イオラ', kana: 'いおら', kind: 'spell', job: 'mage', mp: 9, target: 'enemies',
    effect: { type: 'magic', element: 'blast', base: [46, 58], thr: 52 },
    desc: '大爆発で敵全体にダメージ。',
    cast: '{a}はイオラを唱えた！', anim: 'blast2', attackSpell: true,
  },
  merazoma: {
    name: 'メラゾーマ', kana: 'めらぞーま', kind: 'spell', job: 'mage', mp: 12, target: 'enemy',
    effect: { type: 'magic', element: 'fire', base: [140, 170], thr: 80 },
    desc: 'きょだいな火の玉をぶつける。',
    cast: '{a}はメラゾーマを唱えた！', anim: 'fire3', attackSpell: true,
  },

  // ───────────── 旅芸人 ─────────────
  hustle: {
    name: 'ハッスルダンス', kana: 'はっするだんす', kind: 'skill', job: 'performer', mp: 3, target: 'allies', field: true,
    effect: { type: 'heal', base: [12, 18], thr: 12 },
    desc: 'ゆかいなおどりで仲間全員のHPを少し回復する。',
    cast: '{a}はハッスルダンスをおどった！', anim: 'dance',
  },
  piorimu: {
    name: 'ピオリム', kana: 'ぴおりむ', kind: 'spell', job: 'performer', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'agi', mult: 1.35, dur: 40 },
    desc: '仲間全員の素早さを上げる。行動の順番が早く来る。',
    cast: '{a}はピオリムを唱えた！', anim: 'buff',
  },
  manusa: {
    name: 'マヌーサ', kana: 'まぬーさ', kind: 'spell', job: 'performer', mp: 4, target: 'group',
    effect: { type: 'status', status: 'blind', chance: 0.65, turns: [3, 5] },
    desc: 'まぼろしで包み、敵の攻撃を外れやすくする。',
    cast: '{a}はマヌーサを唱えた！', anim: 'debuff',
  },
  medapani: {
    name: 'メダパニダンス', kana: 'めだぱにだんす', kind: 'skill', job: 'performer', mp: 4, target: 'group',
    effect: { type: 'status', status: 'confuse', chance: 0.5, turns: [1, 3] },
    desc: '不思議なおどりで敵を混乱させる。',
    cast: '{a}はメダパニダンスをおどった！', anim: 'dance',
  },
  baikiruto: {
    name: 'バイキルト', kana: 'ばいきると', kind: 'spell', job: 'performer', mp: 5, target: 'ally',
    effect: { type: 'buff', stat: 'atk', mult: 1.6, dur: 40 },
    desc: '仲間1人の攻撃力を大きく上げる。',
    cast: '{a}はバイキルトを唱えた！', anim: 'buff',
  },
  juggling: {
    name: 'ナイフジャグリング', kana: 'ないふじゃぐりんぐ', kind: 'skill', job: 'performer', mp: 5, target: 'enemies', weapon: 'blade',
    effect: { type: 'phys', mult: 0.6, hits: 4, random: true },
    desc: 'ナイフを投げて敵に4回攻撃。相手はランダム。',
    cast: '{a}のナイフジャグリング！', anim: 'slash_multi',
  },
  ouen: {
    name: 'おうえんの歌', kana: 'おうえんのうた', kind: 'skill', job: 'performer', mp: 4, target: 'allies',
    effect: { type: 'bondUp', amount: 20 },
    desc: '元気な歌できずなゲージを増やす。',
    cast: '{a}はおうえんの歌を歌った！', anim: 'dance',
  },
  tatakai_uta: {
    name: '戦いの歌', kana: 'たたかいのうた', kind: 'skill', job: 'performer', mp: 8, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.25, dur: 35 },
    desc: '仲間全員の攻撃力を上げる。',
    cast: '{a}は戦いの歌を歌った！', anim: 'dance',
  },
  zameha_dance: {
    name: '目覚めのおどり', kana: 'めざめのおどり', kind: 'skill', job: 'performer', mp: 3, target: 'allies',
    effect: { type: 'cure', statuses: ['sleep', 'confuse', 'paralyze'] },
    desc: '仲間全員のねむり・混乱・マヒを治す。',
    cast: '{a}は目覚めのおどりをおどった！', anim: 'dance',
  },

  // ───────────── 掛け合わせ技（ちがう職業の技を あわせる） ─────────────
  // requires: おぼえている ひつようが ある 技。reqJobLv: 職業レベルの じょうけん
  // つかえるのは、もとに なった しょくぎょうを ぜんぶ あわせもつ 上級職いじょう だけ（stats.js の comboAllowed）
  mahouken: {
    name: '魔法剣', kana: 'まほうけん', kind: 'combo', requires: ['daichi', 'mera'], mp: 0, target: 'enemy', weapon: 'blade',
    effect: { type: 'mahouken' },
    desc: '覚えた攻撃呪文を剣に宿らせ、剣の技で切りつける。「メラ＋大地斬」のように自由に組み合わせられる。',
    cast: '', anim: 'slash_heavy',
  },
  senka: {
    name: '閃華裂光拳', kana: 'せんかれっこうけん', kind: 'combo', requires: ['seiken', 'hoimi'], mp: 5, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 2.2, ignoreDef: 0.5, vsRace: { material: 0.3, undead: 1.5 } },
    desc: 'ホイミの力をこぶしにこめ、生き物の体を打ち砕く。岩や機械には効かない。',
    cast: '{a}の閃華裂光拳！', anim: 'holy_punch',
  },
  kaen_senpu: {
    name: '火炎旋風', kana: 'かえんせんぷう', kind: 'combo', requires: ['gira', 'bagi'], mp: 7, target: 'enemies', spellLike: true,
    effect: { type: 'magic', element: 'fire', base: [24, 32], thr: 24 },
    desc: 'ギラの炎をバギの風で巻き上げる。敵全体を焼きはらう。',
    cast: '{a}はギラとバギを掛け合わせた！火炎旋風！', anim: 'fire_tornado',
  },
  nioudachi: {
    name: '仁王立ち', kana: 'におうだち', kind: 'combo', requires: ['kabau', 'sukara'], mp: 4, target: 'self',
    effect: { type: 'cover', dur: 15, all: true, defMult: 1.5 },
    desc: 'スカラで体を固め、仲間全員への攻撃を引き受ける。',
    cast: '{a}は仁王立ちでみんなを守る！', anim: 'guard',
  },
  iyashi_mai: {
    name: 'いやしのまい', kana: 'いやしのまい', kind: 'combo', requires: ['hustle', 'hoimi'], mp: 6, target: 'allies', field: true,
    effect: { type: 'heal', base: [30, 42], thr: 20 },
    desc: 'ホイミの光をまといながらおどり、仲間全員を回復する。',
    cast: '{a}のいやしのまい！', anim: 'heal_dance',
  },
  hayatezuki: {
    name: 'はやてづき', kana: 'はやてづき', kind: 'combo', requires: ['piorimu', 'seiken'], mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, atbAfter: 60 },
    desc: '風のようにつきを放つ。打った後すぐに次の順番が来る。',
    cast: '{a}のはやてづき！', anim: 'punch',
  },
  madoromi: {
    name: 'まどろみの歌', kana: 'まどろみのうた', kind: 'combo', requires: ['rariho', 'hustle'], mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.5, turns: [1, 3] },
    desc: 'ラリホーの魔力を歌に乗せ、敵全体をねむらせる。',
    cast: '{a}はまどろみの歌を歌った！', anim: 'sleep',
  },
  medoro: {
    name: 'メドロ', kana: 'めどろ', kind: 'combo', requires: ['mera', 'hyado'], reqJobLv: { mage: 4 }, mp: 10, target: 'enemy', spellLike: true,
    effect: { type: 'magic', element: 'void', base: [44, 56], thr: 30 },
    desc: '対消滅呪文。メラとヒャドを全く同じ強さでぶつけ、たいせいを無視して消し去る。いつか「メドローア」へ…',
    cast: '{a}は左手にメラ、右手にヒャドを…！メドロ！', anim: 'void',
  },
  star_strash: {
    name: 'スターストラッシュ', kana: 'すたーすとらっしゅ', kind: 'combo', requires: ['daichi', 'kaiha', 'kuuretsu'], mp: 10, target: 'enemy', weapon: 'blade',
    effect: { type: 'phys', mult: 3.0, ignoreDef: 0.5, element: 'light' },
    desc: '大地・海・空、3つの型を極めた者だけが放てる必殺剣。',
    cast: '{a}は逆手に剣を構えた…！スターストラッシュ！', anim: 'strash',
  },

  // ───────────── きずな技（パーティーで ちからを あわせる） ─────────────
  minadein: {
    name: 'ミナデイン', kana: 'みなでいん', kind: 'bond', mp: 0, target: 'enemy',
    effect: { type: 'bond' },
    desc: 'きずなゲージが満タンのときだけ使える。仲間みんなの力を合わせた雷。',
    cast: '{a}はきずなの紋章を高くかかげた！', anim: 'minadein',
  },

  // ───────────── モンスター専用 ─────────────
  m_tackle: {
    name: '体当たり', kind: 'monster', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.4, acc: 0.85 }, cast: '{a}の体当たり！', anim: 'tackle',
    desc: '体ごとぶつかる。威力は高いが少し外れやすい。',
  },
  m_bite: {
    name: 'かみつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.35 }, cast: '{a}はするどいキバでかみついた！', anim: 'bite',
    desc: 'するどいキバでかみつく。',
  },
  m_warcry: {
    name: 'おたけび', kind: 'monster', mp: 4, target: 'allies',
    effect: { type: 'buff', stat: 'atk', mult: 1.15, dur: 25 }, cast: '{a}は力強いおたけびを上げた！', anim: 'warcry',
    desc: '味方みんなの攻撃力を少し上げる。',
  },
  m_king_press: {
    name: 'キングプレス', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'phys', mult: 1.0 }, cast: '{a}は飛び上がってのしかかった！', anim: 'quake',
    desc: '大きな体でのしかかり、敵全体にダメージ。',
  },
  m_blaze: {
    name: '激しい炎', kind: 'monster', mp: 8, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [40, 55], thr: 30, breath: true }, cast: '{a}は激しい炎をはいた！', anim: 'breath',
    desc: '激しい炎で敵全体を焼く。',
  },
  m_dragon_claw: {
    name: 'ドラゴンクロー', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.8 }, cast: '{a}のするどいツメがひらめいた！', anim: 'slash_multi',
    desc: 'するどいツメで引き裂く。',
  },
  m_pounce: {
    name: '飛びかかり', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 2.0, acc: 0.9 }, cast: '{a}は素早く飛びかかった！', anim: 'bite',
    desc: '素早く飛びかかってかみつく。',
  },
  m_darkslash: {
    name: '闇の剣', kind: 'monster', mp: 4, target: 'enemy',
    effect: { type: 'phys', mult: 1.6, element: 'dark' }, cast: '{a}の闇の剣！', anim: 'dark_slash',
    desc: '闇の力をこめた剣で切る。',
  },
  m_horn: {
    name: 'つのでつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}はするどいツノでつきさしてきた！', anim: 'hit',
    desc: 'するどいツノでつきさす。ふつうの攻撃より強い。',
  },
  m_sleep_powder: {
    name: 'ねむりの粉', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'sleep', chance: 0.4, turns: [1, 2] }, cast: '{a}はねむりの粉をまき散らした！', anim: 'sleep',
    desc: '敵1体をねむらせる粉をまく。',
  },
  m_sweet_breath: {
    name: 'あまい息', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}はあまい息をはいた！', anim: 'breath',
    desc: 'あまい息で敵みんなをねむらせることがある。',
  },
  m_rock_throw: {
    name: '石投げ', kind: 'monster', mp: 1, target: 'enemy',
    effect: { type: 'phys', mult: 1.25 }, cast: '{a}は石を投げつけてきた！', anim: 'hit',
    desc: '石を投げつける。',
  },
  m_drain: {
    name: 'ちゅうちゅう', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'drainHp', mult: 0.9 }, cast: '{a}は{t}にかみついて血を吸った！', anim: 'hit',
    desc: '敵にかみついて、あたえたダメージの分HPを回復する。',
  },
  m_poison_lick: {
    name: '毒の舌で', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 0.9, status: { status: 'poison', chance: 0.4 } }, cast: '{a}は毒の舌でなめ回してきた！', anim: 'hit',
    desc: '毒の舌でなめる。毒にすることがある。',
  },
  m_poison_spray: {
    name: '毒のしぶき', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'status', status: 'poison', chance: 0.3 }, cast: '{a}は毒のしぶきをまき散らした！', anim: 'breath',
    desc: '毒のしぶきで敵みんなを毒にすることがある。',
  },
  m_howl: {
    name: '遠ぼえ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'wolf' }, cast: '{a}は遠ぼえを上げた！', anim: 'none',
  },
  m_peck: {
    name: 'つつく', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}はするどいくちばしでつついてきた！', anim: 'hit',
    desc: 'するどいくちばしでつつく。',
  },
  m_gust: {
    name: '風を起こす', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'magic', element: 'wind', base: [6, 10], thr: 99 }, cast: '{a}はつばさで激しい風を起こした！', anim: 'wind1',
    desc: '激しい風で敵みんなにダメージ。',
  },
  m_pinch: {
    name: 'はさむ', kind: 'monster', mp: 2, target: 'enemy',
    effect: { type: 'phys', mult: 1.4 }, cast: '{a}は大きなハサミではさみこんできた！', anim: 'hit',
    desc: '大きなハサミではさむ。',
  },
  m_harden: {
    name: '固くなる', kind: 'monster', mp: 3, target: 'self',
    effect: { type: 'buff', stat: 'def', mult: 1.5, dur: 30 }, cast: '{a}の体が固くなった！', anim: 'buff',
    desc: '体を固くして守備力を上げる。',
  },
  m_swing: {
    name: '剣をふり回す', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, acc: 0.85 }, cast: '{a}は剣をめちゃくちゃにふり回した！', anim: 'hit',
    desc: '剣をふり回す。威力は高いが外れやすい。',
  },
  m_boulder: {
    name: '岩投げ', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'phys', mult: 1.3 }, cast: '{a}は大きな岩を投げつけてきた！', anim: 'hit',
    desc: '大きな岩を投げつける。',
  },
  m_branch_whip: {
    name: '枝のむち', kind: 'monster', mp: 4, target: 'enemies',
    effect: { type: 'phys', mult: 0.7 }, cast: '{a}は枝をむちのようにふり回した！', anim: 'hit_all',
    desc: '枝をむちのようにふり回し、敵全体を打つ。',
  },
  m_pollen: {
    name: 'ねむりの花粉', kind: 'monster', mp: 5, target: 'enemies',
    effect: { type: 'status', status: 'sleep', chance: 0.3, turns: [1, 2] }, cast: '{a}はねむりの花粉をふりまいた！', anim: 'sleep',
    desc: 'ねむりの花粉で敵全体をねむらせることがある。',
  },
  m_root_heal: {
    name: '根を張る', kind: 'monster', mp: 4, target: 'self',
    effect: { type: 'heal', base: [55, 70], thr: 999, fixed: true }, cast: '{a}は地面に根を張った！大地の力を吸い上げる！', anim: 'heal1',
    desc: '地面に根を張り、自分のHPを回復する。',
  },
  m_big_branch: {
    name: '大枝たたき', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.6 }, cast: '{a}は太い枝をふり下ろした！', anim: 'hit',
  },
  m_rock_crush: {
    name: '岩砕き', kind: 'monster', target: 'enemy',
    effect: { type: 'phys', mult: 1.5 }, cast: '{a}は岩のようなこぶしをたたきつけた！', anim: 'hit',
  },
  m_stomp: {
    name: '地ならし', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'phys', mult: 0.65 }, cast: '{a}は地面をふみ鳴らした！大地がゆれる！', anim: 'quake',
    desc: '地面をふみ鳴らして敵みんなにダメージ。',
  },
  m_inhale: {
    name: '息を吸いこむ', kind: 'monster', target: 'self',
    effect: { type: 'telegraph', next: 'm_avalanche' }, cast: '{a}は大きく息を吸いこんだ！', anim: 'charge',
  },
  m_avalanche: {
    name: '岩なだれ', kind: 'monster', mp: 12, target: 'enemies',
    effect: { type: 'phys', mult: 1.25, ignoreDef: 0.3 }, cast: '{a}の岩なだれ！きょだいな岩が降り注ぐ！', anim: 'quake',
    desc: '岩なだれで敵みんなに大きなダメージ。',
  },
  m_summon_rocks: {
    name: '岩を呼ぶ', kind: 'monster', target: 'self',
    effect: { type: 'callHelp', species: 'rock_shard', count: 2 }, cast: '{a}の体から岩のかけらがはがれ落ちた！', anim: 'none',
  },
  m_flee: {
    name: '逃げ出す', kind: 'monster', target: 'self',
    effect: { type: 'flee' }, cast: '{a}は逃げ出した！', anim: 'none',
  },
  m_dark_bolt: {
    name: '闇の雷', kind: 'monster', mp: 5, target: 'enemy',
    effect: { type: 'magic', element: 'dark', base: [14, 20], thr: 99 }, cast: '{a}は闇の雷を放った！', anim: 'dark1',
    desc: '闇の雷で敵1体を打つ。',
  },
  m_fire_breath: {
    name: '火の息', kind: 'monster', mp: 6, target: 'enemies',
    effect: { type: 'magic', element: 'fire', base: [8, 12], thr: 99, breath: true }, cast: '{a}は火の息をはいた！', anim: 'breath',
    desc: '火の息で敵みんなを焼く。',
  },
  m_glare: {
    name: 'にらみつける', kind: 'monster', mp: 3, target: 'enemy',
    effect: { type: 'status', status: 'paralyze', chance: 0.25, turns: [1, 2] }, cast: '{a}は{t}をするどくにらみつけた！', anim: 'debuff',
    desc: 'するどくにらんでマヒさせることがある。',
  },
  m_nothing: {
    name: '様子を見る', kind: 'monster', target: 'self',
    effect: { type: 'nothing' }, cast: '{a}は様子をうかがっている。', anim: 'none',
  },
  m_dance: {
    name: '不思議なおどり', kind: 'monster', target: 'enemy',
    effect: { type: 'drainMp', amount: [3, 6] }, cast: '{a}は不思議なおどりをおどった！', anim: 'dance',
  },
};
Object.assign(ABILITIES, ADV_ABILITIES, CH2_ABILITIES);

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
  fire: '炎', ice: '氷', wind: '風', blast: '爆発', bolt: '雷', light: '光', dark: '闇', void: '消滅',
};

// れんけい（ちがう人が つづけて こうげき）で おこる 合体ボーナス
// 先の属性 → 後の属性 の組み合わせ（順番は どちらでも よい）
export const TEAM_COMBOS = [
  { a: 'fire', b: 'ice', name: '対消滅', kana: 'ついしょうめつ', mult: 0.8, element: 'void', desc: '炎と氷がぶつかり、全てを消し去る光が生まれた！' },
  { a: 'fire', b: 'wind', name: '火炎旋風', kana: 'かえんせんぷう', mult: 0.5, element: 'fire', all: true, desc: '炎が風に乗ってうずを巻いた！' },
  { a: 'ice', b: 'wind', name: 'ブリザード', kana: 'ぶりざーど', mult: 0.5, element: 'ice', all: true, desc: '氷が風に乗り、ふぶきがふきあれた！' },
  { a: 'fire', b: 'blast', name: '大爆炎', kana: 'だいばくえん', mult: 0.6, element: 'blast', all: true, desc: '炎が爆発し、大きな爆炎が上がった！' },
  { a: 'phys', b: 'wind', name: '真空斬り', kana: 'しんくうぎり', mult: 0.5, element: 'wind', desc: '風がやいばを追いかけ、真空の傷を刻んだ！' },
];
