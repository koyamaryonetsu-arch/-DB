// 第82回 A班の ひらめき技: 犬夜叉の 系統（docs/plan-r82-jobs-a.md）
//
// ・半ようの少年・鉄さいがの使い手・犬夜しゃ・ばくりゅうはの大よう に 1つずつ
// ・しくみは hirameki-r66e1.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。anim は 前から ある エフェクト
//   つめの 技は weapon: 'fist'、刀の 技は weapon: 'sword'（abilities-r82a.js と おなじ）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R82A_ABILITIES = {
  // 半ようの少年: 両手の つめで 十の 字に 引っかく
  hi_hyb_juuji: sk('hanyo_boy', {
    name: '大づめの十文字', kana: 'おおづめのじゅうもんじ', mp: 6, target: 'enemy', weapon: 'fist',
    effect: { type: 'phys', mult: 1.05, hits: 2, critBonus: 0.1 },
    desc: '両手のつめで、十の字に引っかく。敵1体に2回ダメージ。会心も出やすい。つめか素手の時に使える。', cast: '{a}の、大づめの十文字！', anim: 'punch',
  }),
  // 鉄さいがの使い手: つむじ風を まとった 一太刀
  hi_tsg_tsumuji: sk('tessaiga_user', {
    name: 'つむじ風の一太刀', kana: 'つむじかぜのひとたち', mp: 10, target: 'enemy', weapon: 'sword',
    effect: { type: 'phys', mult: 2.4, element: 'wind' },
    desc: 'つむじ風をまとった刀で、まっすぐ切る。敵1体に風の大ダメージ。剣の時に使える。', cast: '{a}の、つむじ風の一太刀！', anim: 'wind2',
  }),
  // 犬夜しゃ: 風のきずに ダイヤの やりを のせる
  hi_iny_kongoukaze: sk('inuyasha', {
    name: '金ごう風のきず', kana: 'こんごうかぜのきず', mp: 22, target: 'enemies', weapon: 'sword',
    effect: { type: 'phys', mult: 1.5, element: 'wind', ignoreDef: 0.2 },
    desc: '風のきずに、ダイヤモンドのかけらをのせて切る。敵全体に風の大ダメージ。守りの固い敵にも少し効く。剣の時に使える。', cast: '{a}「風のきずに、金ごうそうはをのせる！」', anim: 'quake',
  }),
  // ばくりゅうはの大よう: 大ようの 力で 風のきずを 大きく
  hi_bry_taifuu: sk('bakuryuha', {
    name: '大ようの風のきず', kana: 'たいようのかぜのきず', mp: 28, target: 'enemies', weapon: 'sword',
    effect: { type: 'phys', mult: 1.9, element: 'wind', vsBuff: 1.3 },
    desc: '大ようの力をこめて、とても大きな風のきずを切る。敵全体に風の大ダメージ。自分を強くしている敵には、もっと効く。剣の時に使える。', cast: '{a}「これが、おれの風のきずだ！」', anim: 'wind2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R82A = {
  hi_hyb_juuji: { from: { hyb_sankon: 20, hyb_renge: 6 } },
  hi_tsg_tsumuji: { from: { tsg_hitofuri: 15, tessaiga_user_sig: 4 } },
  hi_iny_kongoukaze: { from: { iny_kaze_ren: 8, iny_kongou: 8 } },
  hi_bry_taifuu: { from: { bry_kongou: 8, bry_ryurin: 10 } },
};
