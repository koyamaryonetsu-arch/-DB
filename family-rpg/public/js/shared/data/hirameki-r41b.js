// 第41回 B（2026年10月）の 雪の女王・第5のせいれいの ひらめき技
//
// ・雪の女王は 1つ（第33回の 超級職と おなじ）、第5のせいれいは 2つ（ほかの 伝説の 職業と おなじ）
// ・しくみは hirameki-r33.js・hirameki-r40.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R41B_ABILITIES = {
  // 雪の女王: 空から するどい つららが ふりそそぐ
  hi_tsurara: sk('snow_queen', {
    name: 'つららの雨', kana: 'つららのあめ', mp: 18, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [96, 116], thr: 65 },
    desc: '空いっぱいに、するどいつららをつくって、雨のようにふらせる。敵全体に氷のダメージ。', cast: '{a}が手をふると、空につららがならんだ！', anim: 'blizzard',
  }),
  // 第5のせいれい: こおりつく 大波・せいれいたちの 輪
  hi_koori_nami: sk('fifth_spirit', {
    name: 'こおりつく大波', kana: 'こおりつくおおなみ', mp: 22, target: 'enemies',
    effect: { type: 'magic', element: 'ice', base: [118, 138], thr: 80 },
    desc: 'おしよせる大波に手をかざして、そのまま氷にかえる。敵全体に氷のダメージ。', cast: '{a}は、大波に向かって両手をのばした！', anim: 'ice2',
  }),
  hi_seirei_wa: sk('fifth_spirit', {
    name: 'せいれいたちの輪', kana: 'せいれいたちのわ', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 65 }, { type: 'mpHeal', base: [8, 12] }] },
    desc: '4つのせいれいが手をつないで、大きな輪になる。仲間全員のHPとMPを回復する。', cast: '{a}のまわりで、せいれいたちが輪になった！', anim: 'heal2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R41B = {
  hi_tsurara: { from: { sq_tsubute: 12, sq_ootoko: 6 } },
  hi_koori_nami: { from: { fs_hi: 8, fs_kaze: 6 } },
  hi_seirei_wa: { from: { fs_mizu: 8, fs_kokoro: 6 } },
};
