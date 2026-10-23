// 第41回 A（2026年10月）の 2つの 伝説の 職業の ひらめき技
//
// ・京急の社長・野球界の殿堂入りに 2つずつ（ほかの 伝説の 職業と おなじ）
// ・しくみは hirameki-r40.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R41A_ABILITIES = {
  // 京急の社長: みんなへの 大ボーナスと、前の 電車の おいこし
  hi_kqp_bonus: sk('keikyu_president', {
    name: '社長の大ボーナス', kana: 'しゃちょうのだいぼーなす', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [80, 100], thr: 50 }, { type: 'mpHeal', base: [8, 12] }] },
    desc: '会社の売り上げで、みんなに大ボーナス！仲間全員のHPとMPを回復する。', cast: '{a}「みんな、いつもありがとう！」', anim: 'heal2',
  }),
  hi_kqp_oikoshi: sk('keikyu_president', {
    name: '快特のおいこし', kana: 'かいとくのおいこし', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, hits: 2 },
    desc: '前の電車を、ものすごい速さでおいこしていく。敵1体に2回、大ダメージ。', cast: '{a}の快特が、びゅんとおいこした！', anim: 'redtrain',
  }),
  // 野球界の殿堂入り: 3打席 つづけて ホームランと、殿堂入りの 式の スピーチ
  hi_hof_renpatsu: sk('hall_of_fame', {
    name: '3打席連続ホームラン', kana: 'さんだせきれんぞくほーむらん', mp: 22, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, hits: 3 },
    desc: '3回打席に立って、3回ともホームラン！敵1体に3回ダメージ。', cast: '{a}の打球が、3回つづけてスタンドへ！', anim: 'bat_swing',
  }),
  hi_hof_speech: sk('hall_of_fame', {
    name: '感動のスピーチ', kana: 'かんどうのすぴーち', mp: 24, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [120, 150], thr: 70 }, { type: 'buff', stat: 'agi', mult: 1.3, dur: 40 }] },
    desc: '殿堂入りの式で、心のこもったスピーチをする。仲間全員のHPを回復して、素早さも上がる。', cast: '{a}「野球が、みんなが、だいすきです！」', anim: 'heal2',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R41A = {
  hi_kqp_bonus: { from: { kqp_tenken: 8, kqp_gourei: 6 } },
  hi_kqp_oikoshi: { from: { kqp_tokkyu: 10, kqp_renketsu: 6 } },
  hi_hof_renpatsu: { from: { hof_makyu: 10, hof_yokoku: 6 } },
  hi_hof_speech: { from: { hof_enjin: 8, hof_sanshin: 6 } },
};
