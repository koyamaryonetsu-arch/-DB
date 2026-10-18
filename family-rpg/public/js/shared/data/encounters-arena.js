// 第37回 A: サファラ闘技場の きまった 戦い（encounters.js で まぜる。だいほんは world/arena.js の ランク戦）
// 1つの ランクは 休みなしの 3連戦（ar<ランク>_1・_2・_3。3戦目が 王者）。にげられない。負けても お金は へらない（loseOk）
// 1・2戦目は 今ある 魔物を enemyLv まで 強く する（world/battles.js の enemyLv）。王者は monsters-arena.js の 強さの まま
const A = (group, enemyLv, extra = {}) => ({ group, bg: 'arena', bgm: 'battle', canFlee: false, loseOk: true, arena: true, enemyLv, ...extra });
const CHAMP = (group, bgm = 'boss') => ({ group, bg: 'arena', bgm, canFlee: false, loseOk: true, arena: true, boss: true });

export const FIXED_ARENA = {
  // ランク1（おすすめ Lv36）
  ar1_1: A([['scorpion_soldier', 2, 2], ['sand_vulture', 1, 1]], 34),
  ar1_2: A([['sandstone_golem', 1, 1], ['mummy_soldier', 2, 2]], 35),
  ar1_3: CHAMP([['ar_fighter', 1, 1]]),
  // ランク2（Lv39）
  ar2_1: A([['sand_worm', 1, 1], ['sand_shark', 1, 1]], 38),
  ar2_2: A([['cursed_pot', 2, 2], ['royal_mummy', 1, 1]], 38),
  ar2_3: CHAMP([['ar_pirate1', 1, 1], ['ar_pirate2', 1, 1], ['ar_pirate3', 1, 1]]),
  // ランク3（Lv42）
  ar3_1: A([['dark_scorpion', 2, 2], ['sandstorm_spirit', 1, 1]], 41),
  ar3_2: A([['castle_armor', 2, 2], ['moon_ghost', 1, 1]], 42),
  ar3_3: CHAMP([['ar_lamp', 1, 1], ['ar_genie', 1, 1], ['ar_lamp', 1, 1]]),
  // ランク4（Lv45）
  ar4_1: A([['water_dragon', 2, 2]], 44),
  ar4_2: A([['sand_crab', 2, 2], ['sandstorm_spirit', 1, 1]], 45),
  ar4_3: CHAMP([['ar_sun', 1, 1], ['ar_moon', 1, 1]]),
  // ランク5（Lv48）
  ar5_1: A([['lamp_genie', 2, 2], ['sandstorm_spirit', 1, 1]], 47),
  ar5_2: A([['castle_armor', 1, 1], ['mirror_knight', 1, 1], ['dark_scorpion', 1, 1]], 48),
  ar5_3: CHAMP([['ar_king', 1, 1]], 'boss3'),
  // 伝説の部 ランク6（Lv50。ガイアイーターの あと）
  ar6_1: A([['cloud_wyvern', 2, 2], ['sky_serpent', 1, 1]], 48),
  ar6_2: A([['black_agent', 2, 2], ['star_owl', 1, 1]], 49),
  ar6_3: CHAMP([['ar_sharkking', 1, 1]], 'boss3'),
  // ランク7（Lv53。ノクトの影の あと）
  ar7_1: A([['soul_eater', 1, 1], ['homunculus_shade', 1, 1], ['lonely_doll', 1, 1]], 53),
  ar7_2: A([['sky_guard', 1, 1], ['earth_pillbug', 1, 1], ['kage_boushi', 1, 1]], 54),
  ar7_3: CHAMP([['ar_prism', 1, 1]], 'boss3'),
  // ランク8（Lv56。大地の神殿の ノクトの あと）
  ar8_1: A([['earth_pillbug', 1, 1], ['sky_guard', 1, 1], ['cloud_wyvern', 1, 1]], 56),
  ar8_2: A([['homunculus_shade', 2, 2], ['soul_eater', 1, 1]], 57),
  ar8_3: CHAMP([['ar_disciple1', 1, 1], ['ar_legend', 1, 1], ['ar_disciple2', 1, 1]], 'boss3'),
};
