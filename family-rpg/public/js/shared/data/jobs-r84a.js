// 第84回 A班: 幽☆遊☆白書の 系統（一発の 重い 格闘家）「ふりょう → れい界探てい → うら飯ゆう助 → 魔界の王の子」
// （docs/plan-jobs-r79.md の 10-1・docs/plan-r84-jobs-a.md）
//
// ・自分の 基本職から 伝説まで 4だん（封神演義の 系統〈jobs-r83a.js〉と おなじ 形）
//   ふりょう（基本職。さいしょから えらべる）→ れい界探てい（上級職。ふりょうを きわめる）
//   → うら飯ゆう助（超級職。れい界探ていを きわめる）→ 魔界の王の子（伝説。うら飯ゆう助 ＋ ほかの 超級職 1つ ＝ reqSuper: 1）
// ・この 系統だけの しくみ（shared/battle-r84a.js。どれも 戦いの 中だけ。キャラに 項目を 足さない）
//   れい丸の 数（戦い 1回に うてる 数。段で ふえる）・1回だけ 立ち上がる（passive.rise。超級職から）・仲間のために
// ・名前の 字: 「霊」「幽」「浦」「弾」は 習わない 字なので かな（れい界探てい・うら飯ゆう助・れい丸）。のこりは 設計の まま
// ・「ふりょう」は 子ども向けに: けんかっ早いが 仲間思い（こわい ことばは 使わない）
// ・技は abilities-r84a.js・ひらめき技は hirameki-r84a.js
// jobs.js が JOBS に まぜて、JOB_ORDER・ADVANCED_ORDER・SUPER_ORDER・LEGEND_ORDER に 1つずつ 足す（R84A_ORDERS）
//
// passive.rise … 1回だけ 立ち上がる（hp … 立ち上がった 時の HP の わりあい / pow・acts … そのあと acts 回の 行動の 間 物理の 力が pow 倍）

export const JOBS_R84A = {
  furyo: {
    id: 'furyo', name: 'ふりょう', kana: 'ふりょう', short: 'ふりょう', tier: 0, family: 'phys', color: '#3a8a4a',
    desc: 'みどりの学生服をきた、けんかっ早い中学生。口はわるいけど、こまっている仲間は、ぜったいに見すてない。こぶしやバットで戦う。きわめるとれい界探ていになれる。',
    mods: { hp: 1.2, mp: 0.7, str: 1.3, def: 1.05, agi: 1.15, mag: 0.4, heal: 0.7 },
    weapons: ['claw', 'bat', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 0.5, hp: 1 },
    learn: [[1, 'fr_punch'], [2, 'fr_gan'], [3, 'fr_zutsuki'], [5, 'fr_hirune'], [7, 'fr_kabau'], [10, 'furyo_sig']],
  },
  reikai_tantei: {
    id: 'reikai_tantei', name: 'れい界探てい', kana: 'れいかいたんてい', short: 'れい界探', tier: 1, req: ['furyo'], family: 'phys', color: '#3a6ad8',
    desc: 'れい界からたのまれて、ふしぎな事件を追う探てい。指先から青い光の玉「れい丸」をうつ。れい丸は、1回の戦いで2発までしかうてないが、とても強い。ふりょうをきわめるとなれる。',
    mods: { hp: 1.25, mp: 0.95, str: 1.45, def: 1.1, agi: 1.3, mag: 0.4, heal: 0.55 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, agi: 0.5 },
    learn: [[1, 'rt_reigan'], [2, 'rt_tame'], [3, 'rt_dougu'], [5, 'rt_shotgun'], [7, 'rt_konjou'], [10, 'reikai_tantei_sig']],
  },
  yusuke: {
    id: 'yusuke', name: 'うら飯ゆう助', kana: 'うらめしゆうすけ', short: 'ゆう助', tier: 2, req: ['reikai_tantei'], family: 'phys', color: '#2a9ad8',
    desc: '白い道着で、れい光はどうけんを修行した、一発の重いけんか屋。れい丸は1回の戦いで4発。たおれても、1回だけ「まだ、終わってねえ！」と立ち上がる。れい界探ていをきわめるとなれる。',
    mods: { hp: 1.5, mp: 0.9, str: 1.7, def: 1.2, agi: 1.5, mag: 0.6, heal: 0.95 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1, agi: 1 },
    passive: { rise: { hp: 0.3 } },
    learn: [[1, 'yu_reikou'], [2, 'yu_shugyou'], [3, 'yu_niren'], [5, 'yu_nakama'], [7, 'yu_bakuretsu'], [10, 'yusuke_sig']],
  },
  makai_prince: {
    id: 'makai_prince', name: '魔界の王の子', kana: 'まかいのおうのこ', short: '王の子', tier: 3, req: ['yusuke'], reqSuper: 1, family: 'phys', color: '#5a4ab8',
    desc: '魔界の王の血に目ざめた、長いかみのすがた。れい丸は1回の戦いで6発。たおれても1回だけ、HP半分で立ち上がり、しばらく力が上がる。うら飯ゆう助と、ほかの超級職を1つきわめた者だけがなれる。',
    mods: { hp: 1.75, mp: 1.0, str: 1.95, def: 1.45, agi: 1.7, mag: 0.75, heal: 1.0 },
    weapons: ['claw', 'none'], shield: false, armor: ['cloth', 'gi'], helm: false,
    perLv: { str: 1.5, agi: 1, hp: 1 },
    passive: { rise: { hp: 0.5, pow: 1.3, acts: 3 } },
    learn: [[1, 'mk_youga'], [3, 'mk_mazoku'], [5, 'mk_sandan'], [7, 'mk_touki'], [8, 'mk_tanoshii'], [10, 'makai_prince_sig']],
  },
};

// 段ごとの ならび（[基本職, 上級職, 超級職, 伝説]。jobs.js が それぞれの ORDER に 足す）
export const R84A_ORDERS = [['furyo'], ['reikai_tantei'], ['yusuke'], ['makai_prince']];
export const R84A_JOBS = R84A_ORDERS.flat();

// 神殿の うわさ（超級職・伝説）
export const HINTS_R84A = {
  yusuke: 'れい界探ていをきわめた者は、たおれても1回だけ立ち上がる、けんか屋になれるらしい…',
  makai_prince: 'うら飯ゆう助と、ほかの超級職を1つきわめた者は、魔界の王の血に目ざめるらしい…',
};
