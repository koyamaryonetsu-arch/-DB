// 第3部 第1章 第1幕「星ふるえの夜」の 魔物の 仲間（companions.js で まぜる）
// 第26回の きまり（data/companions-c8r.js と おなじ）:
// ・ふつうの 魔物は 1/10〜1/16・強い 魔物は 1/22〜1/26
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ボスの しかけの 技は 入れない）
// ・mix … 系統まぜ配合で 生まれる 相手の 系統（breed-mix.js）。6しゅ ぜんぶ
//   系統配合（familyPool）の 子にも なるのは A の 石の子どもだけ（第7章・第8章と おなじ きまり）。F〜C の 5しゅは noFamily
//   けもの F（森）・植物 E・せいれい D・けもの C・植物 F（地下道）・物質 A（ランクは tools/gen-monster-ranks.mjs の 表〈monster-ranks.js〉）
//   第3部 第1章の B〜S は 2わりまで（test/monsters-r43a.test.js）なので、B〜S は 石の子どもだけ
// ・ここは ほかの データを import しない（酒場・ゲストの 一覧からも 読む ため）
export const FRIENDS_C9A = {
  // けもの F（1/10）
  c9a_star_wolf: {
    rate: 1 / 10, mix: ['dragon'], names: ['ホシキバ', 'キラリ', 'ルナウ', 'ポラリス'],
    growth: { hp: 1.05, mp: 0.5, str: 1.3, def: 0.95, agi: 1.35, mag: 0.4, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9n_wf_fang'], [9, 'baikiruto'], [14, 'm9n_wf_howl'], [20, 'm9n_wf_dash']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '星くずの毛なみのウルフ。仲間になると、夜になるたびに、ながれ星をさがして空を見上げている。',
  },
  // 植物 E（1/11）
  c9a_star_kinoko: {
    rate: 1 / 11, mix: ['slime'], names: ['キララ', 'ホシタケ', 'ポコン', 'ネムネム'],
    growth: { hp: 1.15, mp: 0.9, str: 1.05, def: 1.1, agi: 0.7, mag: 1.0, heal: 1.0 },
    learn: [[1, 'm_tackle'], [4, 'm9n_kn_bonk'], [9, 'hoimi'], [14, 'm9n_kn_spore'], [20, 'm9n_kn_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '星くずのかさのキノコ。仲間になると、暗い夜道で、かさをぽうっと光らせてくれる。',
  },
  // せいれい D（1/14）
  c9a_star_lamp: {
    rate: 1 / 14, mix: ['material'], names: ['ホシビ', 'ランラン', 'キラビ', 'トモシ'],
    growth: { hp: 0.9, mp: 1.25, str: 0.65, def: 0.85, agi: 1.2, mag: 1.45, heal: 0.75 },
    learn: [[1, 'mera'], [4, 'm9n_lp_fire'], [9, 'piorimu'], [14, 'm9n_lp_flare'], [20, 'merazoma']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '星くずの火をともすランプの精。仲間になると、たき火のそばで、星のお話をしてくれる。',
  },
  // けもの C（1/16）
  c9a_yamimushi: {
    rate: 1 / 16, mix: ['undead'], names: ['クラムシ', 'ヤミヤミ', 'メダマ', 'ゴソゴソ'],
    growth: { hp: 1.1, mp: 0.55, str: 1.3, def: 1.15, agi: 1.1, mag: 0.5, heal: 0.4 },
    learn: [[1, 'm_bite'], [4, 'm9n_ym_bite'], [9, 'sukara'], [14, 'm9n_ym_dust'], [20, 'm9n_ym_drain']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '暗やみがすきな大きな虫。仲間になると、明るいところでは、こっそりかげにかくれている。',
  },
  // 植物 F（1/10。地下道で いちばん よく 出る）
  c9a_kokedama: {
    rate: 1 / 10, mix: ['beast'], names: ['コケマル', 'モスモ', 'ミドリン', 'コロン'],
    growth: { hp: 1.2, mp: 0.85, str: 1.05, def: 1.2, agi: 0.65, mag: 0.95, heal: 1.05 },
    learn: [[1, 'm_tackle'], [4, 'm9n_kd_roll'], [9, 'hoimi'], [14, 'm9n_kd_moss'], [20, 'm9n_kd_glow']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '光るこけの玉。仲間になると、ねるときに、ころころ転がって、まくらになってくれる。',
  },
  // 物質 A（なりにくい 1/26）
  c9a_ishinoko: {
    rate: 1 / 26, mix: ['spirit'], names: ['イシコ', 'ホウホウ', 'コモリ', 'カチコ'],
    growth: { hp: 1.15, mp: 0.55, str: 1.3, def: 1.35, agi: 0.8, mag: 0.55, heal: 0.4 },
    learn: [[1, 'm_tackle'], [4, 'm9n_is_peck'], [9, 'sukara'], [14, 'm9n_is_harden'], [20, 'm9n_is_gaze']],
    gear: { weapons: [], armor: ['heavy'], shield: false, head: 'helm' },
    note: 'ホシモリの小さな石像。仲間になると、夜になると目をあけて、みんなのねがおを見守っている。',
  },
};

// F〜C の 5しゅは 系統配合の 子には ならない（companions.js の familyPool。まぜ配合の 子には なる）
for (const sp of ['c9a_star_wolf', 'c9a_star_kinoko', 'c9a_star_lamp', 'c9a_yamimushi', 'c9a_kokedama']) FRIENDS_C9A[sp].noFamily = true;
