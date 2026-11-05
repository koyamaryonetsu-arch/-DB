// 第66回 E2班: 上級職で 終わっていた 職業の 先（プロゲーマー・楽天カードマン・超能力者の 先）。docs/plan-r66-legend.md
//   超級職: eスポーツ世界王者・楽天ゴールドカードマン・サイキッカー / 伝説の職業: ゲームの神・楽天ブラックカードマン・さいき楠雄
// ・jobs.js が JOBS に まぜる（ならびは SUPER_/LEGEND_R66E2_ORDER。JOBS に ある 物だけ 一覧に 入る）
// ・超級職は 今と 同じ形（上級職 2つを きわめる）。伝説は 超級職を きわめる＋ほかの 超級職 1つ（reqSuper: 1。竜魔人と おなじ）
// ・「楠」「雄」は 小学校で 習わない 字なので、名前は かなで「さいきくすお」
// ・技は abilities-r66e2.js・ひらめき技は hirameki-r66e2.js・戦いの しかけ（セーブとロード・楽天ポイント）は battle-r66e2.js
// ・HINTS_R66E2 … 神殿の うわさ（jobs.js の JOB_HINTS に まぜる）
export const SUPER_R66E2_ORDER = ['esports_king', 'gold_cardman', 'psychicer'];
export const LEGEND_R66E2_ORDER = ['game_god', 'black_cardman', 'saiki'];

export const JOBS_R66E2 = {
  // ───────────── 超級職 ─────────────
  // eスポーツ世界王者（プロゲーマー＋魔法戦士）: れんだ・魔法剣の コンボ・せめながら 守る
  esports_king: {
    id: 'esports_king', name: 'eスポーツ世界王者', kana: 'いーすぽーつせかいおうじゃ', short: '世界王者', tier: 2, req: ['pro_gamer', 'magic_knight'], family: 'tech', color: '#e0263a',
    desc: 'ゲームの世界大会で、だれにも負けなかったチャンピオン。目にもとまらぬ連打と、魔法剣をつなぐコンボで戦い、せめながら守りもかためる。プロゲーマーと魔法戦士をきわめるとなれる。',
    mods: { hp: 1.25, mp: 1.15, str: 1.45, def: 1.1, agi: 1.6, mag: 1.2, heal: 0.8 },
    weapons: ['sword', 'boomerang', 'dagger', 'axe', 'staff', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { agi: 1, str: 0.5, mag: 0.5 },
    learn: [[1, 'ek_renda'], [2, 'ek_guard'], [3, 'ek_mahouken'], [5, 'ek_bunseki'], [7, 'ek_voice'], [8, 'ek_gauge'], [10, 'esports_king_sig']],
  },
  // 楽天ゴールドカードマン（楽天カードマン＋部長）: カードで 戦うほど 楽天ポイントが たまって 強く なる・お金が ふえる
  gold_cardman: {
    id: 'gold_cardman', name: '楽天ゴールドカードマン', kana: 'らくてんごーるどかーどまん', short: 'ゴールド', tier: 2, req: ['rakuten_cardman', 'bucho'], family: 'tech', color: '#d6a02e',
    desc: '金色の全身タイツのヒーロー。金のカードで戦うたびに楽天ポイントがたまり、ポイントが多いほど強くなる。戦いで手に入るお金もふえる。楽天カードマンと部長をきわめるとなれる。',
    mods: { hp: 1.35, mp: 1.1, str: 1.35, def: 1.25, agi: 1.35, mag: 1.0, heal: 1.1 },
    weapons: ['fan', 'dagger', 'staff', 'none'], shield: true, armor: ['cloth', 'gi', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, agi: 0.5, str: 0.5 },
    passive: { gold: 1.3 },
    learn: [[1, 'gcm_card'], [2, 'gcm_kaimono'], [3, 'gcm_bonus'], [5, 'gcm_arashi'], [7, 'gcm_tokuten'], [10, 'gold_cardman_sig']],
  },
  // サイキッカー（超能力者＋賢者）: 念力・心を 読む・テレポート・いやしの 念
  psychicer: {
    id: 'psychicer', name: 'サイキッカー', kana: 'さいきっかー', short: 'サイキ', tier: 2, req: ['esper', 'sage'], family: 'magic', color: '#6a3ad8',
    desc: '超能力をきたえぬいた者。強い念力で敵をおしつぶし、心を読んで先回りし、テレポートで攻撃をよける。賢者の力で、仲間のいやしもできる。超能力者と賢者をきわめるとなれる。',
    mods: { hp: 1.05, mp: 1.55, str: 0.8, def: 1.0, agi: 1.35, mag: 1.6, heal: 1.25 },
    weapons: ['staff', 'dagger', 'spear', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 0.5, agi: 0.5 },
    learn: [[1, 'psy_nenriki'], [2, 'psy_yomu'], [3, 'psy_teleport'], [5, 'psy_iyashi'], [7, 'psy_storm'], [10, 'psychicer_sig']],
  },

  // ───────────── 伝説の職業 ─────────────
  // ゲームの神（eスポーツ世界王者＋ほかの 超級職 1つ）: セーブと ロード（ピンチの 前に もどる）・れんだ・コンボ・せめて 守る
  game_god: {
    id: 'game_god', name: 'ゲームの神', kana: 'げーむのかみ', short: 'ゲーム神', tier: 3, req: ['esports_king'], reqSuper: 1, family: 'tech', color: '#f2c430',
    desc: 'どんなゲームもクリアしてしまう、ゲームの神様。セーブで今のみんなを記録して、ピンチの時にロードで前にもどる。神の連打と、むげんのコンボで敵を止める。eスポーツ世界王者と、ほかの超級職を1つきわめるとなれる。',
    mods: { hp: 1.55, mp: 1.3, str: 1.65, def: 1.3, agi: 1.75, mag: 1.3, heal: 0.95 },
    weapons: ['sword', 'boomerang', 'dagger', 'axe', 'staff', 'none'], shield: true, armor: ['cloth', 'robe', 'heavy'], helm: true,
    perLv: { agi: 1.5, str: 1, hp: 1 },
    learn: [[1, 'gg_save'], [2, 'gg_renda'], [3, 'gg_load'], [5, 'gg_combo'], [6, 'gg_guard'], [7, 'gg_command'], [8, 'gg_pico'], [10, 'game_god_sig']],
  },
  // 楽天ブラックカードマン（楽天ゴールドカードマン＋ほかの 超級職 1つ）: ポイントが もっと たまる・お金が もっと ふえる
  black_cardman: {
    id: 'black_cardman', name: '楽天ブラックカードマン', kana: 'らくてんぶらっくかーどまん', short: 'ブラック', tier: 3, req: ['gold_cardman'], reqSuper: 1, family: 'tech', color: '#26222e',
    desc: '黒い全身タイツに金のマントの、カードマンの頂点。黒いカードで戦うたびに楽天ポイントがどんどんたまり、ポイントが多いほど強くなる。戦いで手に入るお金も、もっとふえる。楽天ゴールドカードマンと、ほかの超級職を1つきわめるとなれる。',
    mods: { hp: 1.6, mp: 1.3, str: 1.65, def: 1.45, agi: 1.6, mag: 1.05, heal: 1.15 },
    weapons: ['fan', 'dagger', 'staff', 'none'], shield: true, armor: ['cloth', 'gi', 'robe', 'heavy'], helm: false,
    perLv: { hp: 1, str: 1, agi: 1 },
    passive: { gold: 1.4 },
    learn: [[1, 'bcm_card'], [2, 'bcm_concierge'], [3, 'bcm_gobai'], [5, 'bcm_lounge'], [7, 'bcm_arashi'], [8, 'bcm_kanshasai'], [10, 'black_cardman_sig']],
  },
  // さいきくすお（サイキッカー＋ほかの 超級職 1つ）: 何でも できる 超能力。めだたない ように 力を おさえている
  saiki: {
    id: 'saiki', name: 'さいきくすお', kana: 'さいきくすお', short: 'くすお', tier: 3, req: ['psychicer'], reqSuper: 1, family: 'magic', color: '#f07ab0',
    desc: 'ピンクのかみに緑のメガネの高校生。念力もテレポートも、心を読むことも、何でもできる。でも、めだたないように、頭の制御装置でいつも力をおさえている。サイキッカーと、ほかの超級職を1つきわめるとなれる。',
    mods: { hp: 1.35, mp: 1.65, str: 1.1, def: 1.3, agi: 1.5, mag: 1.75, heal: 1.2 },
    weapons: ['staff', 'dagger', 'spear', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 1, agi: 0.5 },
    learn: [[1, 'ksu_nenriki'], [2, 'ksu_teleport'], [3, 'ksu_telepathy'], [5, 'ksu_seigyo'], [6, 'ksu_medatanai'], [7, 'ksu_modosu'], [8, 'ksu_arashi'], [10, 'saiki_sig']],
  },
};

// 神殿の うわさ（まだ ひみつの 職業。名前を ださずに）
export const HINTS_R66E2 = {
  esports_king: 'ゲームの大会と魔法の剣、2つの道をきわめた者は、世界一のプレイヤーになれるらしい…',
  gold_cardman: '赤い全身タイツのヒーローが、部長の道もきわめると、金色にかがやくらしい…',
  psychicer: 'ふしぎな力と賢者の呪文、両方をきわめた者は、もっと強い超能力に目ざめるらしい…',
  game_god: 'ゲームの世界チャンピオンと、ほかの超級職を1つきわめた者は、セーブとロードができる神様になれるらしい…',
  black_cardman: '金色のカードのヒーローと、ほかの超級職を1つきわめた者は、黒いカードを手にするらしい…',
  saiki: '強い超能力の持ち主と、ほかの超級職を1つきわめた者は、何でもできるのに目立たない高校生になれるらしい…',
};
