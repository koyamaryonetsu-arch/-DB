// 第85回 A班: スレイヤーズの 系統（ためて うつ 大砲）「大食いの旅の魔道士 → 天才美少女魔道士リナ → ドラまた」
// （docs/plan-jobs-r79.md の 10-3・docs/plan-r85-jobs-a.md）
//
// ・今の 職業から 枝分かれ（らんま1/2 の 系統〈武闘家 ＋ 遊び人〉と おなじ 形）
//   大食いの旅の魔道士（上級職。魔法使い ＋ 料理人 を きわめる）→ 天才美少女魔道士リナ（超級職。旅の魔道士を きわめる）
//   → ドラまた（伝説。リナ ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・男の子が なった 時の 名前は masc（ももの姫 ／ 配管工 と おなじ やり方。shared/job-label.js）: リナ → 天才魔道士
// ・この 系統だけの しくみ（となえる → 大砲の 呪文・ギガ・スレイブ・定食で MP 回復・とう賊たいじ・早口）は
//   shared/battle-r85a.js（戦いの 中だけ。キャラにも セーブにも 項目を 足さない）
// ・今の 魔法の 職業（大魔道士・ハリーポッター・千年の大魔法使い）は 毎ターン うてる。こちらは「2ターンで 1発の 大砲」
// ・名前の 字: 設計の 名前の まま（習わない 字は ない）。技の「盗ぞくいじめ」は「とう賊たいじ」（盗 は 習わない 字・いじめる と 言わない）
// ・passive.hayakuchi … 早口（となえた ターンに、この わりあいで すぐ もう 1回 動ける。battle-r85a.js）
//   passive.gold      … 戦いの あとの お金が ふえる（今 ある しくみ。world/battles.js。パーティーで いちばん 大きい 倍率 だけ。足し算に ならない）
// ・技は abilities-r85a.js・ひらめき技は hirameki-r85a.js
// jobs.js が JOBS に まぜて、ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R85A_ORDERS。基本職は ない）

export const JOBS_R85A = {
  tabi_madoshi: {
    id: 'tabi_madoshi', name: '大食いの旅の魔道士', kana: 'おおぐいのたびのまどうし', short: '旅魔道', tier: 1, req: ['mage', 'cook'], family: 'magic', color: '#d8402a',
    desc: 'よく食べ、よく旅する魔道士。炎の呪文で敵をけちらし、大もり定食でHPもMPも元気になる。わるいとう賊も、こらしめてしまう。魔法使いと料理人をきわめるとなれる。',
    mods: { hp: 1.05, mp: 1.3, str: 0.85, def: 0.9, agi: 1.1, mag: 1.35, heal: 0.75 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 0.5, mp: 0.5, hp: 0.5 },
    learn: [[1, 'tm_fireball'], [2, 'tm_oomori'], [3, 'tm_lighting'], [5, 'tm_digbolt'], [7, 'tm_touzoku'], [10, 'tabi_madoshi_sig']],
  },
  lina: {
    id: 'lina', name: '天才美少女魔道士リナ', kana: 'てんさいびしょうじょまどうしりな', short: 'リナ', tier: 2, req: ['tabi_madoshi'], family: 'magic', color: '#e8282a',
    desc: '自分で天才と言う、元気な魔道士の女の子。先に「となえる」と、いちばん強い呪文ドラグ・スレイブが使える。2ターンで1発の大ばくはつ。大食いの旅の魔道士をきわめるとなれる。',
    masc: {
      name: '天才魔道士', short: '天才', kana: 'てんさいまどうし',
      desc: '自分で天才と言う、元気な魔道士の男の子。先に「となえる」と、いちばん強い呪文ドラグ・スレイブが使える。2ターンで1発の大ばくはつ。大食いの旅の魔道士をきわめるとなれる。',
      hint: '大食いの旅の魔道士をきわめた男の子は、自分で天才と言う魔道士になれるらしい…',
    },
    mods: { hp: 1.15, mp: 1.55, str: 0.95, def: 1.0, agi: 1.3, mag: 1.65, heal: 0.8 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1, mp: 1 },
    learn: [[1, 'ln_elmekia'], [2, 'ln_tonaeru'], [3, 'ln_blam'], [5, 'ln_raywing'], [7, 'ln_recovery'], [10, 'lina_sig']],
  },
  doramata: {
    id: 'doramata', name: 'ドラまた', kana: 'どらまた', short: 'ドラまた', tier: 3, req: ['lina'], reqSuper: 1, family: 'magic', color: '#b0101a',
    desc: '「ドラゴンもまたいで通る」と、うわさされる伝説の魔道士。となえてから、闇のやいばラグナ・ブレードや、のこりのMPを全部使うギガ・スレイブがうてる。ときどき早口で、となえたらすぐに動ける。戦いで手に入るお金が少しふえる。リナ（天才魔道士）と、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.35, mp: 1.75, str: 1.05, def: 1.15, agi: 1.45, mag: 1.85, heal: 1.1 },
    weapons: ['staff', 'dagger'], shield: false, armor: ['cloth', 'robe'], helm: false,
    perLv: { mag: 1.5, mp: 1, hp: 0.5 },
    passive: { hayakuchi: 0.25, gold: 1.2 },
    learn: [[1, 'dr_zelas'], [3, 'dr_zoufuku'], [5, 'dr_ragna'], [7, 'dr_tokumori'], [8, 'dr_matagu'], [10, 'doramata_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す。基本職は ない）
export const R85A_ORDERS = [[], ['tabi_madoshi'], ['lina'], ['doramata']];
export const R85A_JOBS = R85A_ORDERS.flat();

// 神殿の うわさ（超級職・伝説。男の子の リナの うわさは masc.hint）
export const HINTS_R85A = {
  lina: '大食いの旅の魔道士をきわめた女の子は、自分で天才と言う魔道士になれるらしい…',
  doramata: 'リナ（天才魔道士）と、ほかの超級職を1つきわめた者は、ドラゴンもまたいで通る、伝説の魔道士になれるらしい…',
};
