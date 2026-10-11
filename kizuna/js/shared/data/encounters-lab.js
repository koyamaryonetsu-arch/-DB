// 古代の大迷宮の 出現表と きまった 戦い（encounters.js で まぜる）
// 魔物は 今ある 第4章・砂の底の神殿の 魔物を まぜる。強さは 階ごとの レベル（maps/labyrinth.js の LAB_ENEMY_LV。Lv40〜46）まで 上げる
//   lab_a … 地下1〜3階（古代都市の 番兵・ピラミッドの 魔物）
//   lab_b … 地下4〜6階（砂の 魔物・ランプの魔人・鏡）
//   lab_c … 地下7〜9階（水竜・鏡の騎士・やみサソリ。いちばん 強い）
export const ENCOUNTERS_LAB = {
  lab_a: [
    { w: 4, group: [['sandstone_golem', 1, 1], ['mummy_soldier', 1, 2]] },
    { w: 3, group: [['castle_armor', 1, 2], ['cursed_pot', 0, 1]] },
    { w: 3, group: [['lamp_genie', 1, 1], ['mummy_soldier', 1, 1]] },
    { w: 2, group: [['sand_worm', 1, 1], ['sandstone_golem', 0, 1]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
  lab_b: [
    { w: 4, group: [['dark_scorpion', 1, 2], ['sandstorm_spirit', 0, 1]] },
    { w: 3, group: [['sand_crab', 1, 1], ['lamp_genie', 1, 1]] },
    { w: 3, group: [['trick_mirror', 1, 1], ['castle_armor', 1, 1]] },
    { w: 2, group: [['sand_worm', 1, 1], ['dark_scorpion', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1], ['sandstone_golem', 1, 1]] },
  ],
  lab_c: [
    { w: 4, group: [['water_dragon', 1, 1], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['mirror_knight', 1, 1], ['dark_scorpion', 1, 1]] },
    { w: 3, group: [['sand_crab', 1, 2], ['water_spirit', 0, 1]] },
    { w: 2, group: [['lamp_genie', 1, 1], ['trick_mirror', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
};

// きまった 戦い（だいほんは data/story-lab.js・data/sidequests.js）。enemyLv … その レベルまで 強く する
export const FIXED_LAB = {
  // 地下5階: スフィンクスの なぞに まちがえると 宝物庫の 番人が 動き出す
  lab_sphinx_guard: { group: [['sandstone_golem', 2, 2]], bg: 'pyramid', bgm: 'battle', canFlee: true, enemyLv: 43 },
  // 地下8階: 古代の 番兵（古城のよろい 2体と 砂岩ゴーレム）
  lab_guardians: { group: [['castle_armor', 2, 2], ['sandstone_golem', 1, 1]], bg: 'sand_castle', bgm: 'boss', canFlee: false, enemyLv: 46 },
  // 地下10階: ねむれる古竜オルドラ
  lab_dragon: { group: [['old_dragon', 1, 1]], bg: 'cave_boss', bgm: 'boss3', canFlee: false, boss: true },
  // たのまれごと: カモメ港の 南の 海の 大ダコ（大王イカを 強く した もの）・東の 平原の はぐれゴーレム（マグマゴーレムを 強く した もの）
  q_kraken: { group: [['giant_squid', 1, 1]], bg: 'sea', bgm: 'boss', canFlee: false, boss: true, enemyLv: 42 },
  q_golem: { group: [['magma_golem', 1, 1]], bg: 'plains_east', bgm: 'boss', canFlee: false, boss: true, enemyLv: 42 },
};

// 出現表 → 戦いの 背景
export const ZONE_BG_LAB = { lab_a: 'pyramid', lab_b: 'sand_castle', lab_c: 'cave_boss' };
