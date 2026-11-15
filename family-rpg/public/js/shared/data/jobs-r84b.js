// 第84回 B班: らんま1/2 の 系統（手数と カウンター）「無差別格闘流の門下生 → 早おとめ乱馬 → 飛竜しょう天はの達人」
// （docs/plan-jobs-r79.md の 10-2・docs/plan-r84-jobs-b.md）
//
// ・今の 職業から 枝分かれ（警察官〈地方公務員 ＋ 戦士〉・きさつ隊〈戦士 ＋ 武闘家〉と おなじ 形）
//   無差別格闘流の門下生（上級職。武闘家 ＋ 遊び人 を きわめる）→ 早おとめ乱馬（超級職。門下生を きわめる）
//   → 飛竜しょう天はの達人（伝説。早おとめ乱馬 ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・この 系統だけの しくみ（水の すがた／お湯の すがた・飛竜しょう天は〈カウンター〉・かけひき・どげざ・敵前だい逃亡・心の水）は
//   shared/battle-r84b.js（戦いの 中だけ。キャラにも セーブにも 項目を 足さない）
// ・名前の 字: 「乙」「昇」は 習わない 字なので かな（早おとめ乱馬・飛竜しょう天はの達人）。のこりは 設計の まま
//   （「乙女」は 1つの ことば〈おとめ〉なので まとめて かなに した）
// ・すがたの 書き方（子ども向け・家族向け）: 画面では「水のすがた」「お湯のすがた」と だけ 書く。男女が 入れかわる 話には しない
// ・技は abilities-r84b.js・ひらめき技は hirameki-r84b.js
// jobs.js が JOBS に まぜて、ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R84B_ORDERS。基本職は ない）

export const JOBS_R84B = {
  musabetsu_student: {
    id: 'musabetsu_student', name: '無差別格闘流の門下生', kana: 'むさべつかくとうりゅうのもんかせい', short: '門下生', tier: 1, req: ['monk', 'jester'], family: 'phys', color: '#d83a3a',
    desc: 'どんな手を使ってでも勝つ「無差別格闘流」の門下生。水をかぶると素早い水のすがた、お湯をかぶると力強いお湯のすがたになる。武闘家と遊び人をきわめるとなれる。',
    mods: { hp: 1.05, mp: 0.8, str: 1.3, def: 0.95, agi: 1.5, mag: 0.55, heal: 0.85 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'ms_amaguri'], [2, 'ms_mizu'], [3, 'ms_dogeza'], [5, 'ms_kawashi'], [7, 'ms_osage'], [10, 'musabetsu_student_sig']],
  },
  ranma: {
    id: 'ranma', name: '早おとめ乱馬', kana: 'さおとめらんま', short: '乱馬', tier: 2, req: ['musabetsu_student'], family: 'phys', color: '#c8202a',
    desc: 'おさげの、うでじまんの格闘家。水のすがたとお湯のすがたを、うまく使い分ける。敵が強くなるほど強いカウンター「飛竜しょう天は」が切り札。門下生をきわめるとなれる。',
    mods: { hp: 1.3, mp: 1.0, str: 1.55, def: 1.1, agi: 1.75, mag: 0.65, heal: 0.95 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, agi: 1 },
    learn: [[1, 'rm_kachuu'], [2, 'rm_kakehiki'], [3, 'rm_kidan'], [5, 'rm_itadaki'], [7, 'rm_panda'], [10, 'ranma_sig']],
  },
  hiryu_master: {
    id: 'hiryu_master', name: '飛竜しょう天はの達人', kana: 'ひりゅうしょうてんはのたつじん', short: '飛竜', tier: 3, req: ['ranma'], reqSuper: 1, family: 'phys', color: '#2aa8c8',
    desc: '竜巻をあやつる、伝説の格闘家。かまえなくても、空から竜巻を落とせる。水とお湯の、両方のよい所も持てる。早おとめ乱馬と、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.5, mp: 1.2, str: 1.8, def: 1.25, agi: 1.95, mag: 0.75, heal: 1.1 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1.5, agi: 1, hp: 0.5 },
    learn: [[1, 'hr_kidan'], [3, 'hr_toubou'], [5, 'hr_kokoro'], [7, 'hr_senju'], [8, 'hr_kakehiki'], [10, 'hiryu_master_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す。基本職は ない）
export const R84B_ORDERS = [[], ['musabetsu_student'], ['ranma'], ['hiryu_master']];
export const R84B_JOBS = R84B_ORDERS.flat();

// 神殿の うわさ（超級職・伝説）
export const HINTS_R84B = {
  ranma: '無差別格闘流の門下生をきわめた者は、水とお湯ですがたをかえる、おさげの格闘家になれるらしい…',
  hiryu_master: '早おとめ乱馬と、ほかの超級職を1つきわめた者は、竜巻をあやつる達人になれるらしい…',
};
