// 第86回 A班: 幻の職業 2つの ひらめき技（1つずつ。今の 幻の職業〈hirameki-phantom-a/b/c.js〉と おなじ）
// ・しくみは hirameki-r41b.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
// ・id は hi_ で はじめる。竜神の剣士の 剣は 2つの 属性（r86a: 'dual'。shared/battle-r86a.js）

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R86A_ABILITIES = {
  // 人とようかいのかけ橋: 白い 大きな 犬の きばのような 風
  hi_shiroinu: sk('yokai_bridge', {
    name: '白い犬のきば', kana: 'しろいいぬのきば', mp: 18, target: 'enemy',
    effect: { type: 'phys', mult: 3.0, element: 'wind', vsBuff: 1.3, oni: true },
    desc: '大きな白い犬のきばのような風が、敵1体にかみつく。自分を強くしている敵には、もっとよく効く。', cast: '{a}のうしろに、白い犬のすがたがうかんだ！', anim: 'r86a_onizume',
  }),
  // 竜神の剣士: 2ひきの 竜の きばで 敵全体を 2回
  hi_nihiki: sk('ryujin_kenshi', {
    name: '二ひきの竜のきば', kana: 'にひきのりゅうのきば', mp: 24, target: 'enemies', sword: true,
    effect: { type: 'phys', mult: 0.95, hits: 2, r86a: 'dual' },
    desc: '雷の竜と火の竜が、敵全体に2回ずつかみつく。1体ずつ、今の玉の属性と炎の、よく効く方で当たる。', cast: '{a}の刀から、2ひきの竜がとび出した！', anim: 'r86a_senpu',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R86A = {
  hi_shiroinu: { from: { kb_onizume: 10, kb_kaze: 6 } },
  hi_nihiki: { from: { rs_futae: 10, rs_senpu: 6 } },
};
