// 第66回 B班: 伝説の職業（tier 3。アイドル・芸能・料理）。docs/plan-r66-legend.md
//   ニューカワイイ・SMAP・大御所・五つ星シェフ
// ・jobs.js が JOBS に まぜる（ならびは LEGEND_R66B_ORDER。JOBS に ある 物だけ LEGEND_ORDER に 入る）
// ・技は abilities-r66b.js・ひらめき技は hirameki-r66b.js・見た目は client/render/hero-r66b.js・えんしゅつは client/render/battlefx-r66b.js
// ・なり方
//   ニューカワイイ … 星の歌姫 か フルーツジッパー を きわめた 女性だけ（body: 1。reqAlt は 賢者・スーパースターと おなじ しくみ）
//   SMAP           … 星の歌姫 か アラシ を きわめた 男性だけ（body: 0）
//   大御所         … M-1王者 ＋ ほかの 超級職 1つ（reqSuper: 1。竜魔人と おなじ）
//   五つ星シェフ   … 三ツ星シェフ ＋ ほかの 超級職 1つ
// ・「紅白の大トリ」の 女の子の 行き先が ニューカワイイ、男の子の 行き先が SMAP（家族が 決めた）
export const LEGEND_R66B_ORDER = ['new_kawaii', 'smap', 'oogosho', 'five_star_chef'];

export const LEGEND_R66B_JOBS = {
  // 星の歌姫 か フルーツジッパー → ニューカワイイ（女性だけ）。歌で 仲間 みんなを 強く する
  new_kawaii: {
    id: 'new_kawaii', name: 'ニューカワイイ', kana: 'にゅーかわいい', short: 'ニューカワ', tier: 3, req: ['star_diva'], reqAlt: [['fruit_idol']], body: 1, family: 'magic', color: '#ff7ac8',
    desc: '新しい「かわいい」で、世界中をむちゅうにする伝説のアイドル。星の歌姫かフルーツジッパーをきわめた女性だけがなれる。かわいい歌で仲間全員を強くして、ハートのビームで敵をうちぬく。',
    mods: { hp: 1.4, mp: 1.6, str: 0.95, def: 1.2, agi: 1.6, mag: 1.5, heal: 1.6 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, heal: 1, agi: 1 },
    versatile: true,
    learn: [[1, 'nk_ichiban'], [2, 'nk_heart'], [3, 'nk_yell'], [5, 'nk_mitore'], [7, 'nk_newstage'], [8, 'nk_ribbon'], [10, 'new_kawaii_sig']],
  },
  // 星の歌姫 か アラシ → SMAP（男性だけ）。5人の 歌で 仲間 みんなを 強く する
  smap: {
    id: 'smap', name: 'SMAP', kana: 'すまっぷ', short: 'SMAP', tier: 3, req: ['star_diva'], reqAlt: [['storm_idol']], body: 0, family: 'magic', color: '#2a6ae0',
    desc: '5人の歌声で日本中を元気にした、伝説の国民的アイドル。星の歌姫かアラシをきわめた男性だけがなれる。5人の歌で仲間全員を強くして、いなずまのステージで敵をけちらす。',
    mods: { hp: 1.55, mp: 1.5, str: 1.25, def: 1.3, agi: 1.55, mag: 1.45, heal: 1.3 },
    weapons: ['fan', 'whip', 'staff', 'none'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, hp: 1, agi: 1 },
    versatile: true,
    learn: [[1, 'sm_smile'], [2, 'sm_inazuma'], [3, 'sm_lion'], [5, 'sm_shake'], [7, 'sm_ganbaro'], [8, 'sm_yozora'], [10, 'smap_sig']],
  },
  // M-1王者 → 大御所（M-1王者と ほかの 超級職 1つ）。お笑い界の トップ
  oogosho: {
    id: 'oogosho', name: '大御所', kana: 'おおごしょ', short: '大御所', tier: 3, req: ['m1_champion'], reqSuper: 1, family: 'tech', color: '#c8901e',
    desc: 'だれもが頭を下げる、お笑い界のトップ。M-1王者と、ほかの超級職を1つきわめた者だけがなれる。ひとことで敵を笑わせて動けなくし、ボケで大こんらんさせる。',
    mods: { hp: 1.55, mp: 1.5, str: 1.25, def: 1.35, agi: 1.55, mag: 1.55, heal: 1.15 },
    weapons: ['fan', 'staff', 'whip', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe', 'gi'], helm: false,
    perLv: { mag: 1, agi: 1, mp: 1 },
    versatile: true,
    learn: [[1, 'og_hitokoto'], [2, 'og_bakushou'], [3, 'og_boke'], [5, 'og_kanroku'], [7, 'og_wakate'], [8, 'og_harisen'], [10, 'oogosho_sig']],
  },
  // 三ツ星シェフ → 五つ星シェフ（三ツ星シェフと ほかの 超級職 1つ）。戦いの 中で 料理を 出す
  five_star_chef: {
    id: 'five_star_chef', name: '五つ星シェフ', kana: 'いつつぼししぇふ', short: '五つ星', tier: 3, req: ['star_chef'], reqSuper: 1, family: 'tech', color: '#f0b428',
    desc: '星が5つもついた、世界でいちばんのレストランのシェフ。三ツ星シェフと、ほかの超級職を1つきわめた者だけがなれる。戦いの中でも料理を出して、仲間全員を回復して強くする。',
    mods: { hp: 1.6, mp: 1.45, str: 1.5, def: 1.3, agi: 1.3, mag: 1.25, heal: 1.55 },
    weapons: ['dagger', 'axe', 'fan', 'staff', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, heal: 1, str: 1 },
    learn: [[1, 'fc_zensai'], [2, 'fc_houchou'], [3, 'fc_flambe'], [5, 'fc_soup'], [7, 'fc_main'], [8, 'fc_dessert'], [10, 'five_star_chef_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる。もとの 職業を はじめた 人に だけ、名前を ださずに 聞こえる）
export const LEGEND_R66B_HINTS = {
  new_kawaii: '星の歌姫かフルーツジッパーをきわめた女性は、世界中がむちゅうになる、新しい「かわいい」の伝説になれるらしい…',
  smap: '星の歌姫かアラシをきわめた男性は、5人の歌で日本中を元気にした、伝説のアイドルになれるらしい…',
  oogosho: 'M-1王者と、ほかの超級職を1つきわめた者は、お笑い界のトップに立てるらしい…',
  five_star_chef: '三ツ星シェフと、ほかの超級職を1つきわめた料理人は、星が5つもつくシェフになれるらしい…',
};
