// 第84回 B班: らんま1/2 の 系統の ひらめき技（3つの 職業に 1つずつ。第83回 A班〈封神演義の 系統〉と おなじ）
// ・しくみは hirameki-r29.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R84B_ABILITIES = {
  // 無差別格闘流の門下生: 水しぶきを 上げて ける
  hi_mizushibuki: sk('musabetsu_student', {
    name: '水しぶきげり', kana: 'みずしぶきげり', mp: 5, target: 'enemy',
    effect: { type: 'phys', mult: 1.7, element: 'water' },
    desc: '水たまりを思いきりけって、水しぶきごと敵1体をける。水のダメージ。', cast: '{a}の水しぶきげり！', anim: 'r84b_kick',
  }),
  // 早おとめ乱馬: 強気の 気を ぶつける
  hi_moukotakabisha: sk('ranma', {
    name: 'もうこ高飛車', kana: 'もうこたかびしゃ', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.7 },
    desc: '強気な気持ちを、大きな気だんにして、敵1体にぶつける。', cast: '{a}「もうこ高飛車！」', anim: 'r84b_kidan',
  }),
  // 飛竜しょう天はの達人: 竜巻の 中で まう
  hi_tatsumaki_mai: sk('hiryu_master', {
    name: '竜巻のまい', kana: 'たつまきのまい', mp: 24, target: 'enemies',
    effect: { type: 'phys', mult: 1.75, element: 'wind' },
    desc: '竜巻の中で、まうように戦う。敵全体に風のダメージ。', cast: '{a}は、竜巻の中でまった！', anim: 'hiryu_master_sig',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R84B = {
  hi_mizushibuki: { from: { ms_amaguri: 20, ms_mizu: 8 } },
  hi_moukotakabisha: { from: { rm_kidan: 10, rm_kachuu: 15 } },
  hi_tatsumaki_mai: { from: { hiryu_master_sig: 6, hr_senju: 10 } },
};
