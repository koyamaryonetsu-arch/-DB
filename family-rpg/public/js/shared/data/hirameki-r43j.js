// 第43回（2026年10月）の 配管工の 系統の ひらめき技（docs/plan-r43-jobs.md）
//
// ・ひげおやじ（おてんば姫）に 1つ・マリオ（ピーチ）に 1つ（第33回の 上級職・超級職と おなじ 1つずつ）
// ・しくみは hirameki-r33.js・hirameki-r41b.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい。anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R43J_ABILITIES = {
  // ひげおやじ: ねらった 敵を どこまでも 追いかける 赤い こうら
  hi_red_koura: sk('mustache', {
    name: '赤いこうら', kana: 'あかいこうら', mp: 10, target: 'enemy',
    effect: { type: 'phys', mult: 2.3 },
    desc: 'ねらった敵を、どこまでも追いかける赤いこうら。敵1体に大きなダメージ。', cast: '{a}は、赤いこうらをけり出した！', anim: 'tackle',
  }),
  // マリオ: 体が 大きく なって 敵を まとめて ふみつぶす
  hi_mega_kinoko: sk('mario', {
    name: 'メガキノコ', kana: 'めがきのこ', mp: 22, target: 'enemies',
    effect: { type: 'phys', mult: 1.6 },
    desc: 'とても大きなキノコで、体が山のように大きくなる。敵全体をまとめてふみつぶす。', cast: '{a}の体が、ぐんぐん大きくなっていく…！', anim: 'quake',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R43J = {
  hi_red_koura: { from: { mu_koura: 12, mu_fire: 8 } },
  hi_mega_kinoko: { from: { mr_hip: 10, mr_egg: 6 } },
};
