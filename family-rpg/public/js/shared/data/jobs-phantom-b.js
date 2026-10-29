// 第51回 C2: 幻の職業（tier 4。伝説の 上）の 4つ。docs/plan-r51-phantom.md
//   名探てい王（名探てい＋おしり探てい）・銀河の女王（ネオ・クイーン・セレニティ＋第5のせいれい）
//   大魔導王（大魔道士＋ハリーポッター）・天下むそうの剣聖（飛天御剣流けい承者＋暴れんぼう将軍）
// ・なる 条件は req の 2つを きわめる ＋ やりこみの 条件（shared/data/phantom.js。F 班）。reqSuper は 使わない
// ・強さは もとの 職業（伝説の 職業）より 1〜2わり 上。技は abilities-phantom-b.js（えんしゅつは o8）
// ・「双」は 習わない 字なので「天下むそうの剣聖」
// ・とくべつな ちから（shared/battle-r51b.js）:
//   名探てい王 … 先読み（敵の 次の 行動を 読んで つぶし、反撃する）
//   銀河の女王 … バリア（ダメージを すいとる まく）
//   大魔導王 … 二重呪文（攻撃の 呪文が もう1度 出る）
//   天下むそうの剣聖 … passive.critStack（会心が 出るほど 強く なる。per … 1だんの 強さ、cap … だんの 上限、rate … 1だんの 会心の 出やすさ）

export const PHANTOM_JOBS_B = {
  detective_king: {
    id: 'detective_king', name: '名探てい王', kana: 'めいたんていおう', short: '探てい王', tier: 4, req: ['meitantei', 'oshiri_tantei'], family: 'magic', color: '#1a3a8a',
    desc: 'どんななぞも解き明かす、探ていの王さま。名探ていとおしり探ていをきわめ、たくさん推理した者だけがなれる。敵の次の行動を先に読み、動こうとしたしゅんかんに、ぴたりとつぶす。',
    mods: { hp: 1.55, mp: 1.75, str: 1.3, def: 1.4, agi: 1.85, mag: 1.9, heal: 1.45 },
    weapons: ['boomerang', 'staff', 'dagger', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: true,
    perLv: { mag: 1, agi: 1, mp: 0.5 },
    learn: [[1, 'tk_suiri'], [2, 'tk_yomi'], [3, 'tk_megane'], [4, 'tk_trick'], [5, 'tk_alibi'], [7, 'tk_shoot'], [8, 'tk_show'], [10, 'detective_king_sig']],
  },
  galaxy_queen: {
    id: 'galaxy_queen', name: '銀河の女王', kana: 'ぎんがのじょおう', short: '銀河女王', tier: 4, req: ['neo_queen', 'fifth_spirit'], family: 'magic', color: '#7a5ae0',
    desc: '星の海をおさめる、やさしい銀河の女王。ネオ・クイーン・セレニティと第5のせいれいをきわめ、たくさん回復した者だけがなれる。仲間みんなをいやし、星くずのバリアで守りぬく。',
    masc: {
      name: '銀河の王', short: '銀河王', kana: 'ぎんがのおう',
      desc: '星の海をおさめる、たのもしい銀河の王。キング・エンディミオンと第5のせいれいをきわめ、たくさん回復した者だけがなれる。仲間みんなをいやし、星くずのバリアで守りぬく。',
      hint: '未来の都の王と第5のせいれいをきわめ、仲間をたくさんいやした者は、星の海の王になれるらしい…',
    },
    mods: { hp: 1.6, mp: 1.9, str: 1.05, def: 1.45, agi: 1.6, mag: 1.9, heal: 1.85 },
    weapons: ['staff', 'fan', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { heal: 1, mag: 1, mp: 1 },
    learn: [[1, 'gq_hoshi'], [2, 'gq_iyashi'], [3, 'gq_barrier'], [4, 'gq_nagare'], [5, 'gq_fukkatsu'], [7, 'gq_amanogawa'], [8, 'gq_kanmuri'], [10, 'galaxy_queen_sig']],
  },
  grand_magus: {
    id: 'grand_magus', name: '大魔導王', kana: 'だいまどうおう', short: '魔導王', tier: 4, req: ['archmage', 'harry'], family: 'magic', color: '#2a8a6a',
    desc: 'すべての呪文をしたがえる、魔法の王。大魔道士とハリーポッターをきわめ、攻撃の呪文をたくさん使った者だけがなれる。2つの呪文を同時にはなつ「二重呪文」で、どんな敵も打ちやぶる。',
    mods: { hp: 1.45, mp: 2.0, str: 0.95, def: 1.3, agi: 1.65, mag: 2.1, heal: 1.4 },
    weapons: ['staff', 'dagger', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1.5, mp: 1 },
    learn: [[1, 'gm_hyouka'], [2, 'gm_buki'], [3, 'gm_mana'], [4, 'gm_niju'], [5, 'gm_raifuu'], [7, 'gm_shugo'], [8, 'gm_medroa'], [10, 'grand_magus_sig']],
  },
  sword_saint: {
    id: 'sword_saint', name: '天下むそうの剣聖', kana: 'てんかむそうのけんせい', short: '剣聖', tier: 4, req: ['hiten', 'abarenbo_shogun'], family: 'phys', color: '#c8d0e0',
    desc: '天下にならぶ者のない、剣の道の頂点。飛天御剣流けい承者と暴れんぼう将軍をきわめ、剣の技と会心の一撃をたくさん出した者だけがなれる。会心の一撃が出るたびに、剣気がどんどん強くなる。',
    mods: { hp: 1.85, mp: 1.2, str: 2.1, def: 1.65, agi: 2.0, mag: 1.0, heal: 1.1 },
    weapons: ['sword', 'spear', 'dagger', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { str: 1.5, agi: 1.5, hp: 1 },
    passive: { critStack: { per: 0.06, cap: 10, rate: 0.012 } },
    learn: [[1, 'ks_issen'], [2, 'ks_kokoro'], [3, 'ks_tsubame'], [4, 'ks_kenki'], [5, 'ks_hyakka'], [7, 'ks_kiwami'], [8, 'ks_seibai'], [10, 'sword_saint_sig']],
  },
};

// 神殿の うわさ（片方を きわめると 聞こえる。F 班の 幻の書・酒場の うわさで 使える）
export const PHANTOM_HINTS_B = {
  detective_king: '名探ていとおしり探てい、2人の探ていの道をきわめ、推理をつみかさねた者は、探ていの王になれるらしい…',
  galaxy_queen: '未来の都の女王と第5のせいれいをきわめ、仲間をたくさんいやした者は、星の海の女王になれるらしい…',
  grand_magus: '大魔道士とハリーポッターをきわめ、攻撃の呪文をたくさんとなえた者は、魔法の王になれるらしい…',
  sword_saint: '飛天御剣流と上様の剣をきわめ、会心の一撃をたくさん出した者は、天下にならぶ者のない剣聖になれるらしい…',
};
