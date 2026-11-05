// 第66回 A班: 伝説の職業（tier 3。ドラクエ系）。docs/plan-r66-legend.md
//   守りの神・光と闇の剣神・ポケモンマスター・千年の大魔法使い
// ・jobs.js が JOBS に まぜる（ならびは LEGEND_R66A_ORDER。JOBS に ある 物だけ LEGEND_ORDER に 入る）
// ・技は abilities-r66a.js（看板の 技は <id>_sig）・ひらめき技は hirameki-r66a.js
// ・強さ（mods の 合計）は 今の 伝説の 職業の はんい（9.30〜10.20）。perLv の 合計は 3.5 まで
export const LEGEND_R66A_ORDER = ['guard_god', 'kenshin', 'poke_master', 'sennen_mage'];
export const LEGEND_R66A_JOBS = {
  // ガーディアン ＋ 大神官 → 守りの神（2つの 超級職を きわめる。はかい神・魔王と おなじ 形）
  // 仲間を かばって 守りながら、回復も する。いちばん かたい 守り役
  guard_god: {
    id: 'guard_god', name: '守りの神', kana: 'まもりのかみ', short: '守り神', tier: 3, req: ['guardian', 'high_priest'], family: 'phys', color: '#f2d27a',
    desc: '仲間を守りぬく、守りの神さま。ガーディアンと大神官、2つの超級職をきわめた者だけがなれる。光のたてで仲間をかばいながら、神のめぐみで回復もする。だれよりもかたい。',
    mods: { hp: 1.75, mp: 1.4, str: 1.2, def: 1.9, agi: 1.0, mag: 1.0, heal: 1.6 },
    weapons: ['spear', 'sword', 'axe', 'staff', 'none'], shield: true, armor: ['cloth', 'heavy', 'robe'], helm: true,
    perLv: { hp: 1.5, def: 1, heal: 1 },
    learn: [[1, 'gg_seinaru'], [2, 'gg_kabau'], [3, 'gg_megumi'], [5, 'gg_hikari'], [7, 'gg_inochi'], [8, 'gg_ten'], [10, 'guard_god_sig']],
  },
  // ソードマスター ＋ 魔剣士 → 光と闇の剣神（2つの 超級職を きわめる）
  // 右手に 光の 剣、左手に 闇の 剣。2つの 剣を 両方 使う 剣の 神
  kenshin: {
    id: 'kenshin', name: '光と闇の剣神', kana: 'ひかりとやみのけんしん', short: '剣神', tier: 3, req: ['sword_master', 'magic_swordsman'], family: 'phys', color: '#8a6ad8',
    desc: '光の剣と闇の剣、2つの剣をあやつる剣の神。ソードマスターと魔剣士、2つの超級職をきわめた者だけがなれる。光の剣で悪いものをはらい、闇の剣で力をすいとる。',
    mods: { hp: 1.6, mp: 1.2, str: 1.9, def: 1.4, agi: 1.55, mag: 1.4, heal: 0.85 },
    weapons: ['sword', 'dagger', 'axe', 'none'], shield: true, armor: ['cloth', 'heavy', 'gi', 'robe'], helm: true,
    perLv: { str: 1.5, hp: 1, agi: 0.5, mag: 0.5 },
    learn: [[1, 'ks_hikari'], [2, 'ks_yami'], [3, 'ks_nitou'], [5, 'ks_ame'], [7, 'ks_yaminami'], [8, 'ks_juuji'], [10, 'kenshin_sig']],
  },
  // モンスターマスター ＋ ほかの 超級職 1つ → ポケモンマスター
  // 仲間の 魔物が もっと 強く なる・魔物が 仲間に なりやすい・ボールの 技・魔物と いっしょに 出す 技（monPal。battle-r66a.js）
  poke_master: {
    id: 'poke_master', name: 'ポケモンマスター', kana: 'ぽけもんますたー', short: 'ポケマス', tier: 3, req: ['monster_master'], reqSuper: 1, family: 'tech', color: '#d8303a',
    desc: '世界中の魔物と友だちになった、魔物使いの頂点。モンスターマスターと、ほかの超級職を1つきわめた者だけがなれる。ボールの技と、仲間の魔物との力を合わせた技で戦う。魔物がもっと仲間になりやすく、仲間の魔物もさらに強くなる。',
    mods: { hp: 1.55, mp: 1.3, str: 1.55, def: 1.35, agi: 1.6, mag: 1.2, heal: 1.25 },
    weapons: ['whip', 'claw', 'axe', 'staff', 'boomerang', 'none'], shield: true, armor: ['cloth', 'gi', 'heavy'], helm: true,
    perLv: { hp: 1, str: 1, agi: 1 },
    passive: { befriend: 2.5, monsterBoost: 1.2 },
    learn: [[1, 'pk_ball'], [2, 'pk_kimeta'], [3, 'pk_10man'], [5, 'pk_center'], [7, 'pk_issho'], [8, 'pk_masterball'], [10, 'poke_master_sig']],
  },
  // 大賢者 ＋ ほかの 超級職 1つ → 千年の大魔法使い
  // 千年 生きて いる エルフの 魔法使い。呪文の 威力が とても 高い。花畑を 出す 魔法が すき
  sennen_mage: {
    id: 'sennen_mage', name: '千年の大魔法使い', kana: 'せんねんのだいまほうつかい', short: '大魔法', tier: 3, req: ['daikenja'], reqSuper: 1, family: 'magic', color: '#e8eef8',
    desc: '千年も旅をつづけている、長生きのエルフの魔法使い。大賢者と、ほかの超級職を1つきわめた者だけがなれる。集めた魔法はかぞえきれない。呪文の力がとても強く、花畑を出す魔法が大すき。',
    mods: { hp: 1.35, mp: 1.8, str: 0.8, def: 1.25, agi: 1.4, mag: 1.85, heal: 1.4 },
    weapons: ['staff', 'spear', 'dagger', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1.5, mp: 1, heal: 0.5 },
    learn: [[1, 'sm_hanabatake'], [2, 'sm_kougeki'], [3, 'sm_bougyo'], [5, 'sm_kaminari'], [7, 'sm_kakusu'], [8, 'sm_koori'], [10, 'sennen_mage_sig']],
  },
};
// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる）
export const LEGEND_R66A_HINTS = {
  guard_god: 'ガーディアンと大神官、2つの守りの道をきわめた者は、仲間を守りぬく神になれるらしい…',
  kenshin: 'ソードマスターと魔剣士、光の剣と闇の剣をきわめた者は、剣の神になれるらしい…',
  poke_master: 'モンスターマスターと、ほかの超級職を1つきわめた者は、世界中の魔物と友だちになれるらしい…',
  sennen_mage: '大賢者と、ほかの超級職を1つきわめた者は、千年生きるエルフのような、大魔法使いになれるらしい…',
};
