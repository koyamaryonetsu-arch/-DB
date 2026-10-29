// 第51回 C2: 幻の職業（名探てい王・銀河の女王・大魔導王・天下むそうの剣聖）の ひらめき技（1つずつ）
// ・しくみは hirameki-r41b.js と おなじ
//   job … その 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 職業の 技を 使った 回数
//   anim は 前から ある エフェクト
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_PHANTOM_B_ABILITIES = {
  // 名探てい王: 敵の 弱点を いっぺんに 見ぬく
  hi_nazotoki: sk('detective_king', {
    name: 'なぞときの大推理', kana: 'なぞときのだいすいり', mp: 24, target: 'enemies',
    effect: { type: 'deduce', base: [130, 150], thr: 80 },
    desc: 'ばらばらの手がかりが、1本の線につながった。敵全体それぞれの弱点を見ぬいて、その属性で攻撃する。', cast: '{a}「…すべての手がかりが、つながった！」', anim: 'holy',
  }),
  // 銀河の女王: ほうき星が 仲間の 上を とおって いやす
  hi_houkiboshi: sk('galaxy_queen', {
    name: 'ほうき星のいやし', kana: 'ほうきぼしのいやし', mp: 26, target: 'allies', role: 'heal', kind: 'spell',
    effect: { type: 'multi', parts: [{ type: 'heal', base: [150, 180], thr: 70 }, { type: 'regen', base: [20, 26], thr: 30, dur: 24 }] },
    desc: '長い光のしっぽをひくほうき星が、仲間の上を通りすぎる。仲間全員のHPを回復して、そのあとも少しずつ回復する。', cast: '{a}が空を見上げると、ほうき星が流れた！', anim: 'heal2',
  }),
  // 大魔導王: 炎・氷・いなずまを 1度に
  hi_sanju: sk('grand_magus', {
    name: '三重呪文', kana: 'さんじゅうじゅもん', mp: 30, target: 'enemies', kind: 'spell',
    effect: {
      type: 'multi',
      parts: [
        { type: 'magic', element: 'fire', base: [70, 84], thr: 75 },
        { type: 'magic', element: 'ice', base: [70, 84], thr: 75 },
        { type: 'magic', element: 'bolt', base: [70, 84], thr: 75 },
      ],
    },
    desc: '二重呪文のさらに上。炎と氷といなずまの呪文を、1度にとなえる。敵全体に3つのダメージ。', cast: '{a}のまわりに、3つの魔法じんがうかんだ！', anim: 'fire3',
  }),
  // 天下むそうの剣聖: 目にも とまらない 4回の 太刀
  hi_senbon: sk('sword_saint', {
    name: '千本の太刀', kana: 'せんぼんのたち', mp: 22, target: 'enemy', sword: true,
    effect: { type: 'phys', mult: 1.3, hits: 4, critBonus: 0.2 },
    desc: '千本の刀がいっぺんにふられたように見える、目にもとまらない太刀。敵1体を4回切る。会心も出やすい。', cast: '{a}の太刀が、千本に分かれて見えた…！', anim: 'slash_heavy',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_PHANTOM_B = {
  hi_nazotoki: { from: { tk_suiri: 10, tk_yomi: 6 } },
  hi_houkiboshi: { from: { gq_iyashi: 10, gq_barrier: 6 } },
  hi_sanju: { from: { gm_hyouka: 10, gm_raifuu: 6 } },
  hi_senbon: { from: { ks_issen: 10, ks_tsubame: 6 } },
};
