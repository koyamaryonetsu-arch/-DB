// 第4章の てきの くみあわせ（encounters.js で まぜる）
// 昼と 夜で 出る 魔物が かわる（夜は 月のゆうれいが 出る。経験値も 多い）。北の古井戸の 中は 昼も 夜も おなじ
export const ENCOUNTERS_CH4 = {
  // ── コガネ地方（北の 海辺・砂ばく・オアシスの まわり）──
  s_coast: [
    { w: 4, group: [['sand_slime', 2, 3]] },
    { w: 3, group: [['sand_vulture', 1, 2], ['sand_slime', 0, 1]] },
    { w: 2, group: [['sand_slime', 1, 2], ['sand_vulture', 1, 1]] },
    { w: 1, group: [['scorpion_soldier', 1, 1], ['sand_slime', 1, 2]] },
  ],
  s_dune: [
    { w: 4, group: [['scorpion_soldier', 1, 2], ['sand_slime', 0, 1]] },
    { w: 3, group: [['sand_slime', 2, 4]] },
    { w: 3, group: [['sand_vulture', 1, 2], ['sand_slime', 1, 1]] },
    { w: 2, group: [['scorpion_soldier', 1, 1], ['sand_vulture', 1, 1], ['sand_slime', 0, 1]] },
    { w: 2, group: [['mirage_flower', 1, 1], ['scorpion_soldier', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  s_oasis: [
    { w: 4, group: [['mirage_flower', 1, 2], ['sand_slime', 0, 1]] },
    { w: 3, group: [['mirage_flower', 1, 1], ['sand_slime', 1, 2]] },
    { w: 2, group: [['scorpion_soldier', 1, 1], ['mirage_flower', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  // ── 夜（月のゆうれいが 出る。昼より 手ごわいが、経験値も 多い）──
  s_coast_night: [
    { w: 4, group: [['moon_ghost', 1, 1], ['sand_slime', 1, 2]] },
    { w: 3, group: [['sand_slime', 2, 4]] },
    { w: 2, group: [['moon_ghost', 1, 2]] },
  ],
  s_dune_night: [
    { w: 4, group: [['moon_ghost', 1, 2], ['scorpion_soldier', 0, 1]] },
    { w: 3, group: [['scorpion_soldier', 2, 3]] },
    { w: 2, group: [['moon_ghost', 1, 1], ['scorpion_soldier', 1, 2]] },
    { w: 2, group: [['mirage_flower', 1, 2], ['moon_ghost', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
  s_oasis_night: [
    { w: 4, group: [['mirage_flower', 1, 2], ['moon_ghost', 1, 1]] },
    { w: 3, group: [['moon_ghost', 1, 2], ['sand_slime', 0, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  // ── 北の古井戸 ──
  s_well: [
    { w: 4, group: [['sand_slime', 2, 3]] },
    { w: 3, group: [['scorpion_soldier', 1, 2], ['sand_slime', 0, 1]] },
    { w: 2, group: [['sand_slime', 1, 2], ['scorpion_soldier', 1, 1]] },
  ],
  // ── かれた地下水路（Step 2）。おくへ 行くほど サソリ兵が ふえる ──
  s_canal: [
    { w: 4, group: [['dry_frog', 1, 2], ['sand_slime', 0, 1]] },
    { w: 3, group: [['scorpion_soldier', 1, 2], ['dry_frog', 0, 1]] },
    { w: 2, group: [['sand_slime', 2, 3]] },
    { w: 2, group: [['dry_frog', 2, 3]] },
  ],
  s_canal2: [
    { w: 4, group: [['scorpion_soldier', 1, 2], ['dry_frog', 1, 1]] },
    { w: 3, group: [['dry_frog', 2, 3]] },
    { w: 2, group: [['scorpion_soldier', 2, 3]] },
    { w: 2, group: [['dry_frog', 1, 2], ['sand_slime', 1, 2]] },
  ],
  // ── 宮殿の地下水路（Step 3）。くらい 水路には 月のゆうれいも まよいこんでいる（Lv30〜33）──
  s_pcanal: [
    { w: 4, group: [['moon_ghost', 1, 2], ['dry_frog', 0, 1]] },
    { w: 3, group: [['scorpion_soldier', 1, 2], ['moon_ghost', 1, 1]] },
    { w: 3, group: [['dry_frog', 2, 3]] },
    { w: 2, group: [['mirage_flower', 1, 2], ['moon_ghost', 0, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  // ── 王家の墓の砂ばく（Step 4。王都の 東）: 岩の 魔物。夜は ランプの魔人と 月のゆうれい（Lv30〜34）──
  s_pdesert: [
    { w: 4, group: [['sandstone_golem', 1, 1], ['scorpion_soldier', 0, 1]] },
    { w: 3, group: [['scorpion_soldier', 1, 2], ['sand_vulture', 1, 1]] },
    { w: 3, group: [['sand_vulture', 2, 3]] },
    { w: 2, group: [['sandstone_golem', 1, 1], ['sand_vulture', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  s_pdesert_night: [
    { w: 4, group: [['lamp_genie', 1, 1], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['moon_ghost', 1, 2], ['sandstone_golem', 0, 1]] },
    { w: 2, group: [['lamp_genie', 1, 1], ['scorpion_soldier', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
  // ── 王家のピラミッド（Step 4）: ミイラ兵・のろいのつぼ・砂岩ゴーレム（Lv32〜33）──
  s_pyr1: [
    { w: 4, group: [['mummy_soldier', 1, 2]] },
    { w: 3, group: [['mummy_soldier', 1, 1], ['cursed_pot', 1, 1]] },
    { w: 2, group: [['scorpion_soldier', 1, 2], ['mummy_soldier', 0, 1]] },
    { w: 2, group: [['moon_ghost', 1, 1], ['mummy_soldier', 1, 1]] },
  ],
  // 地下の ミイラのへや（ミイラ兵が たくさん）
  s_pyr_b1: [
    { w: 5, group: [['mummy_soldier', 2, 3]] },
    { w: 2, group: [['mummy_soldier', 1, 2], ['cursed_pot', 1, 1]] },
  ],
  // 呪文の ふうじられた 2階（てきの 呪文も ふうじられる。とくぎと 道具で たたかう）
  s_pyr2: [
    { w: 4, group: [['sandstone_golem', 1, 1], ['mummy_soldier', 0, 1]] },
    { w: 3, group: [['mummy_soldier', 2, 2]] },
    { w: 2, group: [['cursed_pot', 1, 2]] },
    { w: 2, group: [['sandstone_golem', 1, 1], ['cursed_pot', 1, 1]] },
  ],
  s_pyr3: [
    { w: 4, group: [['mummy_soldier', 1, 2], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['sandstone_golem', 1, 1]] },
    { w: 2, group: [['cursed_pot', 1, 1], ['mummy_soldier', 1, 1]] },
  ],
  s_pyr4: [
    { w: 4, group: [['mummy_soldier', 2, 2], ['sandstone_golem', 0, 1]] },
    { w: 2, group: [['sandstone_golem', 1, 1], ['cursed_pot', 1, 1]] },
  ],
  // ── 南の砂ばく（Step 5。王都の 南の 砂嵐の 切れ目の 先。Lv34〜36）: サンドワーム・砂嵐の精。夜は やみサソリ・月のゆうれい ──
  s_sdesert: [
    { w: 4, group: [['sand_worm', 1, 1], ['scorpion_soldier', 0, 1]] },
    { w: 3, group: [['sandstorm_spirit', 1, 2]] },
    { w: 3, group: [['sand_worm', 1, 1], ['sandstorm_spirit', 1, 1]] },
    { w: 2, group: [['sand_vulture', 2, 3]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  s_sdesert_night: [
    { w: 4, group: [['dark_scorpion', 1, 2], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['sand_worm', 1, 1], ['moon_ghost', 1, 1]] },
    { w: 2, group: [['lamp_genie', 1, 1], ['dark_scorpion', 1, 1]] },
    { w: 2, group: [['moon_ghost', 1, 2]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
};

export const FIXED_CH4 = {
  // 北の古井戸の おく: アミを かこんでいる 魔物たち（にげられない）
  well_ambush: { group: [['scorpion_soldier', 2, 2], ['sand_slime', 2, 2]], bg: 'sand_cave', bgm: 'battle', canFlee: false },
  // かれた地下水路の おく: よろい大サソリ（ボス）
  armor_scorpion: { group: [['armor_scorpion', 1, 1]], bg: 'canal', bgm: 'boss', canFlee: false, boss: true },
  // 王家のピラミッドの 金色の つぼ（のろいのつぼ 2ひき。にげても よい。にげると つぼは そのまま）
  pot_ambush: { group: [['cursed_pot', 2, 2]], bg: 'pyramid', bgm: 'battle', canFlee: true },
  // 王のへや: ミイラの王アンク（ボス）と 王のミイラ兵 2体
  mummy_king: { group: [['mummy_king', 1, 1], ['royal_mummy', 2, 2]], bg: 'pyramid_boss', bgm: 'pharaoh', canFlee: false, boss: true },
  // 夜の 宮殿の 王の間（Step 5）: 大臣ザイード（3体の うち 1体だけが 本物。のこりは まぼろしの 分身。shared/battle-ch4.js）
  zaid: { group: [['zaid_minister', 3, 3]], bg: 'palace_night', bgm: 'sand_demon', canFlee: false, boss: true },
  // そのまま つづけて 真の すがた（あいだに 月の鏡の 光: HPは ぜんぶ・MPは 少しだけ。story-ch4.js の zaidEvent）
  zaid_demon: { group: [['zaid_demon', 1, 1]], bg: 'palace_night', bgm: 'sand_demon', canFlee: false, boss: true },
};

export const ZONE_BG_CH4 = {
  s_coast: 'beach', s_dune: 'desert', s_oasis: 'desert', s_well: 'sand_cave', s_canal: 'canal', s_canal2: 'canal', s_pcanal: 'canal',
  s_coast_night: 'beach_night', s_dune_night: 'desert_night', s_oasis_night: 'desert_night',
  // Step 4
  s_pdesert: 'desert', s_pdesert_night: 'desert_night',
  s_pyr1: 'pyramid', s_pyr_b1: 'pyramid', s_pyr2: 'pyramid', s_pyr3: 'pyramid', s_pyr4: 'pyramid',
  // Step 5
  s_sdesert: 'desert', s_sdesert_night: 'desert_night',
};

// 昼の ちいき → 夜の 出現表（night.js の NIGHT_ZONES に まぜる）
export const NIGHT_ZONES_CH4 = { s_coast: 's_coast_night', s_dune: 's_dune_night', s_oasis: 's_oasis_night', s_pdesert: 's_pdesert_night', s_sdesert: 's_sdesert_night' };
