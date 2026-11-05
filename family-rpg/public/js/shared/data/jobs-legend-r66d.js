// 第66回 D班: 伝説の職業（tier 3。キャラクター）。docs/plan-r66-legend.md
//   月下のき術師・のぶドラ・かっぱの大王・真理のとびらをひらく者・ロゼッタ（男の子は ギャラクシーマリオ）
// ・jobs.js が JOBS に まぜる（ならびは LEGEND_R66D_ORDER。JOBS に ある 物だけ LEGEND_ORDER に 入る）
// ・なり方は 今の 伝説と おなじ形（req の 超級職を きわめる＋ほかの 超級職も 1つ。竜魔人と おなじ reqSuper: 1）
// ・技は abilities-r66d.js・ひらめき技は hirameki-r66d.js・見た目は client/render/hero-r66d.js・えんしゅつは client/render/battlefx-r66d.js
// ・「扉」は 習わない 字なので「真理のとびらをひらく者」（家族の 名前の 形は のこす）
// ・「奇」は 習わない 字なので「月下のき術師」（はがねのれん金術師と おなじ 形）
export const LEGEND_R66D_ORDER = ['gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta'];

export const LEGEND_R66D_JOBS = {
  // かいとうキッド → 月下のき術師（かいとうキッドと ほかの 超級職 1つ）。トランプの 技と、すがたを 消して かわす 技
  gekka: {
    id: 'gekka', name: '月下のき術師', kana: 'げっかのきじゅつし', short: '月下', tier: 3, req: ['kaito_kid'], reqSuper: 1, family: 'tech', color: '#2a3a8a',
    desc: '満月の夜にだけあらわれる、なぞのき術師。かいとうキッドと、ほかの超級職を1つきわめた者だけがなれる。光るトランプで敵をまどわせ、ぱっとすがたを消して攻撃をかわす。',
    mods: { hp: 1.5, mp: 1.35, str: 1.65, def: 1.25, agi: 1.9, mag: 1.3, heal: 1.0 },
    weapons: ['dagger', 'staff', 'fan', 'boomerang', 'none'], shield: false, armor: ['cloth', 'robe'], helm: true,
    perLv: { agi: 1.5, str: 1, mag: 0.5 },
    learn: [[1, 'gx_ace'], [2, 'gx_kieru'], [3, 'gx_hanafubuki'], [5, 'gx_mirror'], [7, 'gx_yokoku'], [8, 'gx_ushiro'], [10, 'gekka_sig']],
  },
  // ドラえもん → のぶドラ（ドラえもんと ほかの 超級職 1つ）。なつかしい 声の ころの ドラえもん。むかしの ひみつ道具を つぎつぎ 出す
  nobu_dora: {
    id: 'nobu_dora', name: 'のぶドラ', kana: 'のぶどら', short: 'のぶドラ', tier: 3, req: ['doraemon'], reqSuper: 1, family: 'tech', color: '#1a74d8',
    desc: 'なつかしい声のころの、むかしのドラえもん。ドラえもんと、ほかの超級職を1つきわめた者だけがなれる。4次元ポケットから、なつかしいひみつ道具をつぎつぎに出して、みんなを助ける。',
    mods: { hp: 1.6, mp: 1.6, str: 1.3, def: 1.5, agi: 1.15, mag: 1.5, heal: 1.45 },
    weapons: ['staff', 'boomerang', 'fan', 'none'], shield: true, armor: ['cloth'], helm: false,
    perLv: { hp: 1, mp: 1, heal: 1 },
    versatile: true,
    learn: [[1, 'nd_dokodemo'], [2, 'nd_biglight'], [3, 'nd_gourmet'], [5, 'nd_ishikoro'], [7, 'nd_shock'], [8, 'nd_kibidango'], [10, 'nobu_dora_sig']],
  },
  // はなかっぱ（筋肉ニンニク）→ かっぱの大王（はなかっぱ（筋肉ニンニク）と ほかの 超級職 1つ）。頭の 花が かわる 大技・力が とても 高い
  kappa_king: {
    id: 'kappa_king', name: 'かっぱの大王', kana: 'かっぱのだいおう', short: '大王', tier: 3, req: ['kinniku_kappa'], reqSuper: 1, family: 'phys', color: '#2e9a3e',
    desc: 'すべてのカッパの上に立つ、かっぱの大王。はなかっぱ（筋肉ニンニク）と、ほかの超級職を1つきわめた者だけがなれる。力がとても強く、頭にさく花がかわるたびに、ちがう大技が出る。',
    mods: { hp: 1.75, mp: 1.0, str: 2.0, def: 1.5, agi: 1.3, mag: 1.0, heal: 1.0 },
    weapons: ['claw', 'axe', 'spear', 'none'], shield: false, armor: ['cloth', 'gi', 'heavy'], helm: false,
    perLv: { str: 1.5, hp: 1.5 },
    learn: [[1, 'kd_harite'], [2, 'kd_kyuuri'], [3, 'kd_osara'], [5, 'kd_himawari'], [7, 'kd_shiko'], [8, 'kd_saboten'], [10, 'kappa_king_sig']],
  },
  // はがねのれん金術師 → 真理のとびらをひらく者（はがねのれん金術師と ほかの 超級職 1つ）。手を 合わせるだけで 地形や 武器を 作りかえる
  // この 系統なので、パーティーに いると れん金がまの 歩数が 半分（data/alchemy.js の POT_FAST_JOBS）
  truth_gate: {
    id: 'truth_gate', name: '真理のとびらをひらく者', kana: 'しんりのとびらをひらくもの', short: '真理', tier: 3, req: ['fullmetal'], reqSuper: 1, family: 'phys', color: '#c89a2a',
    desc: 'れん成のひみつをすべて知り、真理のとびらをひらいた者。はがねのれん金術師と、ほかの超級職を1つきわめた者だけがなれる。手を合わせるだけで、地形も武器も一しゅんで作りかえる。パーティーにいると、れん金がまの歩数が半分。',
    mods: { hp: 1.6, mp: 1.4, str: 1.75, def: 1.5, agi: 1.45, mag: 1.5, heal: 0.9 },
    weapons: ['spear', 'claw', 'sword', 'axe', 'none'], shield: false, armor: ['cloth', 'gi', 'robe', 'heavy'], helm: false,
    perLv: { str: 1, mag: 1, def: 0.5 },
    learn: [[1, 'tg_ude'], [2, 'tg_buki'], [3, 'tg_toride'], [5, 'tg_chikei'], [7, 'tg_iyashi'], [8, 'tg_yari'], [10, 'truth_gate_sig']],
  },
  // ピーチ／マリオ → ロゼッタ（男の子は ギャラクシーマリオ。ピーチ／マリオと ほかの 超級職 1つ）。星の 世界の 女王。流れ星と、ちびっこの 星の 仲間（チコ）で 戦う
  // データの 名前は 女の子（ピーチと おなじ）。男の子は masc（見た目 hero-r66d.js の R66D_MASC・看板の 技の 名前は 技の masc）
  rosetta: {
    id: 'rosetta', name: 'ロゼッタ', kana: 'ろぜった', short: 'ロゼッタ', tier: 3, req: ['mario'], reqSuper: 1, family: 'magic', color: '#5ab8e8',
    desc: 'ほうき星の天文台で、星の世界を見守る女王。ピーチと、ほかの超級職を1つきわめた者だけがなれる。流れ星をよび、ちびっこの星の仲間チコたちといっしょに戦う。',
    masc: {
      name: 'ギャラクシーマリオ', short: 'ギャラクシー', kana: 'ぎゃらくしーまりお',
      desc: '星の世界をかけめぐる、宇宙のヒーローになったマリオ。マリオと、ほかの超級職を1つきわめた者だけがなれる。くるっとスピンして、流れ星とちびっこの星の仲間チコたちといっしょに戦う。',
      hint: 'マリオと、ほかの超級職を1つきわめた男の人は、星の世界をかけめぐるヒーローになれるらしい…',
    },
    mods: { hp: 1.5, mp: 1.45, str: 1.45, def: 1.3, agi: 1.55, mag: 1.5, heal: 1.4 },
    weapons: ['axe', 'boomerang', 'staff', 'fan', 'none'], shield: false, armor: ['cloth', 'gi', 'robe'], helm: true,
    perLv: { mag: 1, agi: 1, hp: 1 },
    learn: [[1, 'rz_ryusei'], [2, 'rz_chiko'], [3, 'rz_spin'], [5, 'rz_starbits'], [7, 'rz_tenmondai'], [8, 'rz_henshin'], [10, 'rosetta_sig']],
  },
};

// 神殿の うわさ（jobs.js の JOB_HINTS に まぜる。もとの 超級職を きわめた 人に、名前を ださずに 聞こえる）
export const LEGEND_R66D_HINTS = {
  gekka: 'かいとうキッドと、ほかの超級職を1つきわめた者は、満月の夜にだけあらわれる、なぞのき術師になれるらしい…',
  nobu_dora: 'ドラえもんと、ほかの超級職を1つきわめた者は、なつかしい声のころのドラえもんになれるらしい…',
  kappa_king: 'はなかっぱ（筋肉ニンニク）と、ほかの超級職を1つきわめた者は、すべてのカッパの上に立てるらしい…',
  truth_gate: 'はがねのれん金術師と、ほかの超級職を1つきわめた者は、れん成のひみつのとびらをひらけるらしい…',
  rosetta: 'ピーチと、ほかの超級職を1つきわめた女の人は、ほうき星の天文台の女王になれるらしい…',
};
