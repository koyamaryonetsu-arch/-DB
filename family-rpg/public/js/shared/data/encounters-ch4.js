// 第4章の てきの くみあわせ（encounters.js で まぜる）
// 昼と 夜で 出る 魔物が かわる（夜は 月のゆうれいが 出る。経験値も 多い）。北の古井戸の 中は 昼も 夜も おなじ
export const ENCOUNTERS_CH4 = {
  // ── コガネ地方（北の 海辺・砂ばく・オアシスの まわり）──
  s_coast: [
    { w: 4, group: [['sand_slime', 1, 3]] },
    { w: 3, group: [['sand_vulture', 1, 2]] },
    { w: 2, group: [['sand_slime', 1, 2], ['sand_vulture', 1, 1]] },
    { w: 1, group: [['scorpion_soldier', 1, 1], ['sand_slime', 0, 1]] },
  ],
  s_dune: [
    { w: 4, group: [['scorpion_soldier', 1, 2]] },
    { w: 3, group: [['sand_slime', 2, 3]] },
    { w: 3, group: [['sand_vulture', 1, 2], ['sand_slime', 1, 1]] },
    { w: 2, group: [['scorpion_soldier', 1, 1], ['sand_slime', 1, 2]] },
    { w: 2, group: [['mirage_flower', 1, 1], ['scorpion_soldier', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  s_oasis: [
    { w: 4, group: [['mirage_flower', 1, 2]] },
    { w: 3, group: [['mirage_flower', 1, 1], ['sand_slime', 1, 2]] },
    { w: 2, group: [['scorpion_soldier', 1, 1], ['mirage_flower', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  // ── 夜 ──
  s_coast_night: [
    { w: 4, group: [['moon_ghost', 1, 1], ['sand_slime', 1, 2]] },
    { w: 3, group: [['sand_slime', 2, 3]] },
    { w: 2, group: [['moon_ghost', 1, 2]] },
  ],
  s_dune_night: [
    { w: 4, group: [['moon_ghost', 1, 2]] },
    { w: 3, group: [['scorpion_soldier', 2, 3]] },
    { w: 2, group: [['moon_ghost', 1, 1], ['scorpion_soldier', 1, 1]] },
    { w: 2, group: [['mirage_flower', 1, 2], ['moon_ghost', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 2]] },
  ],
  s_oasis_night: [
    { w: 4, group: [['mirage_flower', 1, 2], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['moon_ghost', 1, 2]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  // ── 北の古井戸 ──
  s_well: [
    { w: 4, group: [['sand_slime', 2, 3]] },
    { w: 3, group: [['scorpion_soldier', 1, 2]] },
    { w: 2, group: [['sand_slime', 1, 2], ['scorpion_soldier', 1, 1]] },
  ],
};

export const FIXED_CH4 = {
  // 北の古井戸の おく: アミを かこんでいる 魔物たち（にげられない）
  well_ambush: { group: [['scorpion_soldier', 2, 2], ['sand_slime', 1, 1]], bg: 'sand_cave', bgm: 'battle', canFlee: false },
};

export const ZONE_BG_CH4 = {
  s_coast: 'beach', s_dune: 'desert', s_oasis: 'desert', s_well: 'sand_cave',
  s_coast_night: 'beach_night', s_dune_night: 'desert_night', s_oasis_night: 'desert_night',
};

// 昼の ちいき → 夜の 出現表（night.js の NIGHT_ZONES に まぜる）
export const NIGHT_ZONES_CH4 = { s_coast: 's_coast_night', s_dune: 's_dune_night', s_oasis: 's_oasis_night' };
