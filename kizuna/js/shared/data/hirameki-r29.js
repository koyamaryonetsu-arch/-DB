// 第29回（2026年10月）の るろうに剣士の 道の ひらめき技
//
// ・上級職より 上の 3つ（人斬りばっ刀さい・ひ村ばっ刀さい・飛天御剣流けい承者）に 1〜2こずつ
// ・しくみは hirameki-r27.js と おなじ
//   job … その 職業か、その 職業から 進んだ 職業の とき だけ ひらめく（stats.js の hiraAllowed）
//   from … その 道の 技を 使った 回数（上の 職業ほど 技の MPが 多いので、回数は 少なめ）
//   強さは その 職業の 同じくらいの MPの 技と おなじくらい
//   anim は 前から ある エフェクト（真・九頭竜閃は 九頭竜閃の エフェクト）
// ・id は hi_ で はじめる

const sk = (job, o) => ({ kind: 'skill', job, hirameki: true, ...o });

export const HIRA_R29_ABILITIES = {
  // 人斬りばっ刀さい: 竜しょう閃で 切り上げて、そのまま 竜つい閃で 打ち下ろす
  hi_ryutsui_shou: sk('hitokiri', {
    name: '竜ついしょう閃', kana: 'りゅうついしょうせん', mp: 9, target: 'enemy',
    effect: { type: 'phys', mult: 1.3, hits: 2 },
    desc: '下から切り上げて飛び上がり、そのまま真上から打ち下ろす。敵1体を2回切る。', cast: '{a}の飛天御剣流！竜ついしょう閃！', anim: 'slash_heavy',
  }),
  // ひ村ばっ刀さい: 竜巻閃の 3つめの 型
  hi_kogarashi: sk('himura', {
    name: '竜巻閃・こがらし', kana: 'りゅうかんせんこがらし', mp: 12, target: 'enemy',
    effect: { type: 'phys', mult: 2.9, critBonus: 0.1 },
    desc: 'こがらしのように、すっと敵の後ろへ回りこんで切る。敵1体に大きなダメージ。会心も出やすい。', cast: '{a}の飛天御剣流！竜巻閃・こがらし！', anim: 'wind2',
  }),
  // 飛天御剣流けい承者: 九頭竜閃を 神速で
  hi_shin_kuzu: sk('hiten', {
    name: '真・九頭竜閃', kana: 'しんくずりゅうせん', mp: 30, target: 'enemy',
    effect: { type: 'phys', mult: 0.45, hits: 9, ignoreDef: 0.2 },
    desc: '神速で打ちこむ、ほんとうの九頭竜閃。敵1体を9回切る。守りの固い敵にもよく効く。', cast: '{a}の飛天御剣流！真・九頭竜閃！', anim: 'himura_sig',
  }),
  // 飛天御剣流けい承者: 大地を ゆらす 土竜閃
  hi_dai_doryu: sk('hiten', {
    name: '大土竜閃', kana: 'だいどりゅうせん', mp: 20, target: 'enemies',
    effect: {
      type: 'multi',
      parts: [
        { type: 'phys', mult: 1.9 },
        { type: 'atbSet', sub: 40, chance: 0.45, msg: '{t}は、ゆれる地面でころんだ！', failMsg: '{t}は、ふんばった！' },
      ],
    },
    desc: '刀で大地を打ちわり、大きな岩を飛ばす。敵全体に大ダメージ。ころんで動きが止まる敵もいる。', cast: '{a}の飛天御剣流！大土竜閃！', anim: 'quake',
  }),
};

// ひらめきの じょうけん（技 → 使った 回数）
export const HIRAMEKI_R29 = {
  hi_ryutsui_shou: { from: { htk_ryusho: 12, rurouni_sig: 6 } },
  hi_kogarashi: { from: { hm_arashi: 10, hm_tsumuji: 6 } },
  hi_shin_kuzu: { from: { ht_shinsoku: 10, himura_sig: 4 } },
  hi_dai_doryu: { from: { ht_ootatsu: 8, rr_doryu: 20 } },
};
