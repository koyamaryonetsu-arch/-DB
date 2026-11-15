// 第83回 B班: ぬ〜べ〜の 系統「守る 先生」（docs/plan-jobs-r79.md の 9-0・9-2・9-3。docs/plan-r83-jobs-b.md）
//
// ・今の 職業から 枝分かれする 系統（警察官〈地方公務員＋戦士〉・消防士〈地方公務員＋僧侶〉と おなじ 形）
//   小学校の先生（上級職。地方公務員 ＋ 小学生 を きわめる）→ れい能力教師ぬ〜べ〜（超級職。小学校の先生を きわめる）
//   → おにの手のじごく先生（伝説。ぬ〜べ〜 ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・この 系統だけの しくみ（shared/battle-r83b.js。どれも 戦いの 中だけ。キャラに 項目を 足さない）
//   passive.protect … 生徒を 守る: HP が 3わり いかの 仲間への 敵の 攻撃を、この 確率で 自動で かばう（超級職 0.5・伝説 0.8。上級職は なし）
//   passive.oniMax  … おにの手を 出して いる 間の ダメージの 上がり方の 上限（超級職 0.6・伝説 0.9。番ごとに ＋0.15）
// ・名前の 字: 「霊・鬼・獄・封」は 小学校で ならわない 字なので かな（れい能力教師・おにの手・じごく・ふういん）。「〜」は 使える
// ・強さ（mods の 合計）: 7.2・8.4・9.6（設計の 表の とおり。HP と 守備力が 高め）
// ・技は abilities-r83b.js・ひらめき技は hirameki-r83b.js・見た目は client/render/hero-r83b.js・えんしゅつは client/render/battlefx-r83b.js
// jobs.js が JOBS に まぜて、ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R83B_ORDERS。基本職は ない）
export const R83B_JOBS = ['elem_teacher', 'nube', 'jigoku_sensei'];
// [基本職, 上級職, 超級職, 伝説]
export const R83B_ORDERS = [[], ['elem_teacher'], ['nube'], ['jigoku_sensei']];

export const JOBS_R83B = {
  elem_teacher: {
    id: 'elem_teacher', name: '小学校の先生', kana: 'しょうがっこうのせんせい', short: '先生', tier: 1, req: ['civil_local', 'schoolkid'], family: 'phys', color: '#4a7a5a',
    desc: '元気な子どもたちを、体をはって守る小学校の先生。黒板けしを投げて戦い、保健室につれて行って仲間を手当てする。地方公務員と小学生をきわめるとなれる。',
    mods: { hp: 1.3, mp: 0.95, str: 1.05, def: 1.25, agi: 0.85, mag: 0.85, heal: 0.95 },
    weapons: ['staff', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, def: 1 },
    learn: [[1, 'et_kokuban'], [2, 'et_kabau'], [3, 'et_hoken'], [5, 'et_shukudai'], [7, 'et_ofuda'], [10, 'elem_teacher_sig']],
  },
  nube: {
    id: 'nube', name: 'れい能力教師ぬ〜べ〜', kana: 'れいのうりょくきょうしぬーべー', short: 'ぬ〜べ〜', tier: 2, req: ['elem_teacher'], family: 'phys', color: '#2a2a3a',
    desc: '左手の黒い手ぶくろに、強い「おにの手」をふういんしている先生。おにの手を出すと、番が来るたびに強くなるが、自分のHPがへっていく。弱った仲間への攻撃を、自分からかばうことがある。ゆうれいや悪魔にとても強い。',
    mods: { hp: 1.5, mp: 1.1, str: 1.35, def: 1.4, agi: 0.95, mag: 1.0, heal: 1.1 },
    weapons: ['staff', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1, str: 1, def: 0.5 },
    passive: { protect: 0.5, oniMax: 0.6 },
    learn: [[1, 'nb_onite'], [2, 'nb_kannon'], [3, 'nb_dasu'], [5, 'nb_reisui'], [7, 'nb_youki'], [10, 'nube_sig']],
  },
  jigoku_sensei: {
    id: 'jigoku_sensei', name: 'おにの手のじごく先生', kana: 'おにのてのじごくせんせい', short: 'じごく先生', tier: 3, req: ['nube'], reqSuper: 1, family: 'phys', color: '#6a1a2a',
    desc: 'おにの手の力を、生徒を守るためだけに使いこなす先生。ぬ〜べ〜と、ほかの超級職を1つきわめた者だけがなれる。弱った仲間を、ほとんどいつもかばう。おにの手は、もっと強くなる。',
    mods: { hp: 1.75, mp: 1.25, str: 1.55, def: 1.6, agi: 1.05, mag: 1.2, heal: 1.2 },
    weapons: ['staff', 'none'], shield: true, armor: ['cloth', 'robe'], helm: false,
    perLv: { hp: 1.5, str: 1, def: 0.5 },
    passive: { protect: 0.8, oniMax: 0.9 },
    learn: [[1, 'js_renda'], [3, 'js_fubuki'], [5, 'js_koe'], [7, 'js_kakusei'], [8, 'js_tsuiteru'], [10, 'jigoku_sensei_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる。もとの 職業を はじめた 人に だけ、名前を ださずに 聞こえる）
export const HINTS_R83B = {
  nube: '小学校の先生をきわめると、左手に黒い手ぶくろをした、あの先生になれるらしい…',
  jigoku_sensei: 'ぬ〜べ〜と、ほかの超級職を1つきわめた先生は、おにの手を自分のものにできるらしい…',
};
