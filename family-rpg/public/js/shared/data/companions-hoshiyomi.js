// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の 魔物の なかま（companions.js で まぜる）
// 第26回の きまり（data/companions-kumoi.js と おなじ）:
// ・ふつうの 魔物は 1/12〜1/18・強い 魔物（迷宮の 深い 階の 魔物）は 1/20〜1/24
// ・growth の 合計は 今までの 仲間と おなじ はば（力の 魔物 5.8〜6.1・呪文の 魔物 6.8〜7.3）
// ・learn の 技は 味方が 使っても うごく もの（ノクトの影の 技は 入れない）
// ・familyPool に 入れない（noFamily: 系統配合の 子には ならない）
// ・たましいすい × ひとがたの影 ＋ ノクトの影の 品 → ボス級「影の王」（data/monsters-boss.js の 素材配合）
export const FRIENDS_HOSHIYOMI = {
  black_agent: {
    rate: 1 / 16, names: ['クロ', 'スーツ', 'サングラ', 'カゲオ'],
    growth: { hp: 1.05, mp: 0.55, str: 1.2, def: 1.0, agi: 1.15, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_swing'], [4, 'm_agent_smoke'], [9, 'm_agent_shot'], [14, 'piorimu'], [20, 'm_agent_drug']],
    gear: { weapons: ['dagger', 'bat', 'boomerang'] },
    note: '黒い服のあやしい男。今はなぜか仲間として、しのびうちで戦う。',
  },
  star_owl: {
    rate: 1 / 14, names: ['ホーホー', 'ミミズク', 'ヨミ', 'ほしまる'],
    growth: { hp: 0.95, mp: 1.1, str: 0.95, def: 0.85, agi: 1.2, mag: 1.15, heal: 0.75 },
    learn: [[1, 'm_peck'], [4, 'bagi'], [8, 'm_owl_dive'], [13, 'm_owl_gaze'], [19, 'm_owl_wind']],
    gear: { weapons: [] },
    note: '星読みの里の夜空を見上げるフクロウ。夜風と星のまなざしを使う。',
  },
  stardust_slime: {
    rate: 1 / 12, names: ['キラリン', 'スター', 'ほしぷる', 'ピカぷる'],
    growth: { hp: 0.95, mp: 1.15, str: 0.8, def: 1.05, agi: 1.0, mag: 1.2, heal: 0.95 },
    learn: [[1, 'm_tackle'], [4, 'hoimi'], [8, 'm_stardust_hop'], [13, 'behoimi'], [19, 'm_stardust_shine']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: false },
    note: '星くずをすいこんだスライム。星くずの光で戦う。',
  },
  lonely_ghost: {
    rate: 1 / 16, names: ['シクシク', 'ポツン', 'ユウ', 'ひとり'],
    growth: { hp: 0.95, mp: 1.25, str: 0.7, def: 0.9, agi: 1.1, mag: 1.35, heal: 0.75 },
    learn: [[1, 'hyado'], [4, 'm_ghost_cling'], [9, 'm_ghost_tear'], [14, 'm_ghost_song'], [20, 'hyadaruko']],
    gear: { weapons: ['dagger'], armor: ['cloth', 'robe'], shield: false, head: 'hat' },
    note: 'さびしさが形になったゆうれい。仲間になると、もうひとりではない。',
  },
  lonely_doll: {
    rate: 1 / 14, names: ['ヌイ', 'ボタン', 'モフ', 'くまこ'],
    growth: { hp: 1.1, mp: 0.55, str: 1.15, def: 1.15, agi: 0.95, mag: 0.6, heal: 0.6 },
    learn: [[1, 'm_tackle'], [4, 'm_doll_stare'], [9, 'm_doll_spin'], [14, 'm_doll_mend'], [20, 'kabau']],
    gear: { weapons: [], armor: ['cloth'], shield: false, head: 'hat' },
    note: 'わすれられていたぬいぐるみの人形。だきしめてもらって、元気になった。',
  },
  kage_boushi: {
    rate: 1 / 16, names: ['カゲ', 'ボウシ', 'シルエ', 'くろすけ'],
    growth: { hp: 1.0, mp: 0.6, str: 1.15, def: 0.9, agi: 1.35, mag: 0.75, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_shade_step'], [9, 'm_shade_melt'], [14, 'piorimu'], [20, 'm_twin_slash']],
    gear: { weapons: ['dagger', 'claw'], armor: ['cloth'], shield: false, head: false },
    note: '歩きだした影。影ふみで敵を動けなくする。',
  },
  soul_eater: {
    rate: 1 / 22, names: ['ボロマント', 'スイスイ', 'ヒエヒエ', 'カゲロウ'],
    growth: { hp: 1.0, mp: 1.25, str: 0.85, def: 0.9, agi: 1.05, mag: 1.35, heal: 0.6 },
    learn: [[1, 'hyado'], [4, 'm_soul_kiss'], [9, 'm_soul_chill'], [14, 'manusa'], [20, 'm_soul_joy']],
    gear: { weapons: [], armor: ['cloth', 'robe'], shield: false, head: false },
    note: 'ぼろぼろのマントのかげ。めったに仲間にならない。光の近くはにがて。',
  },
  homunculus_shade: {
    rate: 1 / 22, names: ['ヒトガタ', 'アカイシ', 'カゲヒト', 'ホム'],
    growth: { hp: 1.15, mp: 0.5, str: 1.3, def: 1.1, agi: 1.0, mag: 0.55, heal: 0.5 },
    learn: [[1, 'm_bite'], [4, 'm_homun_claw'], [9, 'm_homun_stone'], [14, 'm_twin_slash'], [20, 'm_homun_blades']],
    note: '人の形をまねた影。むねの赤い石で、キズがふさがる。めったに仲間にならない。',
  },
};

// 系統配合の 子には ならない（companions.js の familyPool）
for (const f of Object.values(FRIENDS_HOSHIYOMI)) f.noFamily = true;
