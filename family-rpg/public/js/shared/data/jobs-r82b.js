// 第82回 B班: YAIBA の 系統「サムライ小ぞう → 雷神けんの剣士 → ヤイバ → 竜神けんのサムライ」（docs/plan-jobs-r79.md の 8-2・docs/plan-r82-jobs-b.md）
//
// ・自分の 基本職から 伝説まで 4だん（るろうに剣士 → 飛天御剣流けい承者 と おなじ 形）
//   サムライ小ぞう（基本職。さいしょから えらべる）→ 雷神けんの剣士（上級職。サムライ小ぞうを きわめる）
//   → ヤイバ（超級職。雷神けんの剣士を きわめる）→ 竜神けんのサムライ（伝説。ヤイバ ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・この 系統だけの しくみ「玉がえ」（刀に はめる 玉で 剣の 技の 属性が かわる）は shared/battle-r82b.js（戦いの 中だけ。キャラに 項目を 足さない）
// ・名前の 字: 「龍」は 習わない 字なので「竜」（第29回の 九頭竜閃と おなじ）。「小僧」の「僧」も 習わないので「小ぞう」
// ・技は abilities-r82b.js・ひらめき技は hirameki-r82b.js
// jobs.js が JOBS に まぜて、JOB_ORDER・ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R82B_ORDERS）

export const JOBS_R82B = {
  samurai_kid: {
    id: 'samurai_kid', name: 'サムライ小ぞう', kana: 'さむらいこぞう', short: '小ぞう', tier: 0, family: 'phys', color: '#e0782a',
    desc: '「天下一のサムライになる！」が口ぐせの、元気いっぱいの男の子。木刀をふり回して、まっすぐ前へつっこむ。おなかがすくと力が出ない。きわめると雷神けんの剣士になれる。',
    mods: { hp: 1.1, mp: 0.6, str: 1.3, def: 1.0, agi: 1.25, mag: 0.55, heal: 0.65 },
    weapons: ['sword', 'bat', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { str: 0.5, agi: 0.8 },
    learn: [[1, 'kk_men'], [2, 'kk_harahetta'], [3, 'kk_kazaguruma'], [5, 'kk_mushaburui'], [7, 'kk_kabuto'], [10, 'samurai_kid_sig']],
  },
  raijin_sword: {
    id: 'raijin_sword', name: '雷神けんの剣士', kana: 'らいじんけんのけんし', short: '雷神けん', tier: 1, req: ['samurai_kid'], family: 'phys', color: '#e8c020',
    desc: 'かみなりの力をやどす刀「雷神けん」に、えらばれた剣士。刀に雷の玉がはまっていて、剣の技がみんな雷になる。サムライ小ぞうをきわめるとなれる。',
    mods: { hp: 1.1, mp: 0.7, str: 1.45, def: 1.0, agi: 1.4, mag: 0.7, heal: 0.6 },
    weapons: ['sword', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { str: 1, agi: 0.5 },
    learn: [[1, 'rj_raikou'], [2, 'rj_tame'], [3, 'rj_inazuma'], [5, 'rj_shibire'], [7, 'rj_mamori'], [10, 'raijin_sword_sig']],
  },
  yaiba: {
    id: 'yaiba', name: 'ヤイバ', kana: 'やいば', short: 'ヤイバ', tier: 2, req: ['raijin_sword'], family: 'phys', color: '#2a6ad8',
    desc: '雷・火・水・氷の玉を、刀にはめかえて戦う少年剣士。玉をかえると、剣の技の属性がかわる。どんな敵の弱点もつける。雷の天気だと、もっと強い。雷神けんの剣士をきわめるとなれる。',
    mods: { hp: 1.35, mp: 0.9, str: 1.65, def: 1.15, agi: 1.55, mag: 0.85, heal: 0.9 },
    weapons: ['sword', 'none'], shield: false, armor: ['cloth', 'gi'], helm: true,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'yb_tamagae'], [2, 'yb_zokusei'], [3, 'yb_senpu'], [5, 'yb_juji'], [7, 'yb_kaminarigumo'], [10, 'yaiba_sig']],
  },
  ryujin_samurai: {
    id: 'ryujin_samurai', name: '竜神けんのサムライ', kana: 'りゅうじんけんのさむらい', short: '竜神けん', tier: 3, req: ['yaiba'], reqSuper: 1, family: 'phys', color: '#2aa878',
    desc: '7つの玉をすべて手にして、竜神けんをふるうサムライ。風の玉と、体が大きくなる金色の玉、竜神の光の玉も使える。ヤイバと、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.55, mp: 1.05, str: 1.9, def: 1.35, agi: 1.75, mag: 0.95, heal: 1.1 },
    weapons: ['sword', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { str: 1.5, agi: 1, hp: 0.5 },
    learn: [[1, 'ry_tachi'], [3, 'ry_kyodai'], [5, 'ry_tatsumaki'], [7, 'ry_tamashii'], [8, 'ry_ikari'], [10, 'ryujin_samurai_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す）
export const R82B_ORDERS = [['samurai_kid'], ['raijin_sword'], ['yaiba'], ['ryujin_samurai']];
export const R82B_JOBS = R82B_ORDERS.flat();

// 神殿の うわさ（超級職・伝説）
export const HINTS_R82B = {
  yaiba: '雷神けんの剣士をきわめた者は、いろいろな玉を刀にはめて戦えるらしい…',
  ryujin_samurai: 'ヤイバと、ほかの超級職を1つきわめた者は、7つの玉をそろえて竜神けんをふるえるらしい…',
};
