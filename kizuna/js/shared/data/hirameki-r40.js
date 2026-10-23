// 第40回（2026年10月）の 2つの 伝説の 職業の ひらめき技
//
// ・竜魔人・ネオ・クイーン・セレニティに 2つずつ（ほかの 伝説の 職業〈暴れんぼう将軍・飛天御剣流けい承者・3年B組の担任〉と おなじ）
// ・しくみは hirameki-r33.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数（伝説の 技は MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる。ネオ・クイーン・セレニティの 男の子（キング・エンディミオン）は masc の 名前（abilities-jobs10.js と おなじ）

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R40_ABILITIES = {
  // 竜魔人: いなずまの 魔法剣を 十字に 2回。大きな つばさの ような 竜闘気
  hi_ryuma_juuji: sk('ryumajin', {
    name: '竜魔の十字斬り', kana: 'りゅうまのじゅうじぎり', mp: 20, target: 'enemy',
    effect: { type: 'phys', mult: 1.9, hits: 2, element: 'bolt' },
    desc: 'いなずまをまとった剣で、たてと横に十字に切る。敵1体に2回、雷の大ダメージ。', cast: '{a}の剣が、十字にひらめいた！', anim: 'gigabreak',
  }),
  hi_ryuma_tsubasa: sk('ryumajin', {
    name: '竜闘気の大つばさ', kana: 'どらごにっくおーらのおおつばさ', mp: 18, target: 'enemies',
    effect: { type: 'phys', mult: 1.6, element: 'wind' },
    desc: '竜闘気をつばさのように大きく広げて、はばたく。敵全体に風のダメージ。', cast: '{a}の背中に、竜闘気の大きなつばさが広がった！', anim: 'wind2',
  }),
  // ネオ・クイーン・セレニティ: クリスタルの 都の 朝と、銀色の 月
  hi_yoake: sk('neo_queen', {
    name: 'クリスタルの都の夜明け', kana: 'くりすたるのみやこのよあけ', mp: 26, target: 'allies', role: 'heal',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [130, 160], thr: 70 }, { type: 'buff', stat: 'mag', mult: 1.3, dur: 40 }] },
    desc: 'クリスタルの都に、新しい朝の光がさしこむ。仲間全員のHPを回復して、魔力も上がる。', cast: '{a}「さあ、新しい朝が来たわ」', anim: 'heal2',
    masc: { name: '地球の王国の夜明け', kana: 'ちきゅうのおうこくのよあけ', cast: '{a}「さあ、新しい朝が来たぞ」', desc: '地球の王国に、新しい朝の光がさしこむ。仲間全員のHPを回復して、魔力も上がる。' },
  }),
  hi_tsukiakari: sk('neo_queen', {
    name: '銀色の月のかがやき', kana: 'ぎんいろのつきのかがやき', mp: 22, target: 'enemy',
    effect: { type: 'magic', element: 'light', base: [230, 270], thr: 90 },
    desc: '銀色の大きな月が、まっすぐ光をそそぐ。敵1体に光のとても大きなダメージ。', cast: '{a}の後ろに、銀色の大きな月がのぼった！', anim: 'holy',
    masc: { name: '地球の王のつるぎ', kana: 'ちきゅうのおうのつるぎ', cast: '{a}は、王の剣に地球の光を集めた！', desc: '王の剣に地球の光を集めて、まっすぐ切りおろす。敵1体に光のとても大きなダメージ。' },
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R40 = {
  hi_ryuma_juuji: { from: { rm_mahouken: 8, rm_monshou: 6 } },
  hi_ryuma_tsubasa: { from: { rm_honoo: 6, rm_otakebi: 6 } },
  hi_yoake: { from: { nq_iyashi: 8, nq_kekkai: 6 } },
  hi_tsukiakari: { from: { nq_hikari: 10, nq_shizume: 6 } },
};
