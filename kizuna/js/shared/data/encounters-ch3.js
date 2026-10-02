// 第3章の てきの くみあわせ（encounters.js で まぜる）
// ちがう 魔物が まざった むれは、ムチ（1つの むれ）・ブーメラン（みんな）の ねらいどころ
export const ENCOUNTERS_CH3 = {
  // ── シロガネ地方 ──
  n_snow: [
    { w: 4, group: [['snow_slime', 1, 3]] },
    { w: 3, group: [['ice_bat', 2, 3]] },
    { w: 3, group: [['frost_wolf', 1, 2]] },
    { w: 3, group: [['snowman', 1, 2]] },
    { w: 3, group: [['snow_slime', 1, 2], ['ice_bat', 1, 2]] },
    { w: 2, group: [['frost_wolf', 1, 1], ['snowman', 1, 1]] },
    { w: 1, group: [['yeti', 1, 1]] },
  ],
  n_forest: [
    { w: 4, group: [['snow_wisp', 1, 3]] },
    { w: 3, group: [['frost_wolf', 2, 3]] },
    { w: 3, group: [['snowman', 1, 2], ['snow_wisp', 1, 1]] },
    { w: 2, group: [['snow_slime', 2, 3], ['snow_wisp', 0, 1]] },
    { w: 1, group: [['yeti', 1, 1], ['frost_wolf', 0, 1]] },
  ],
  n_lake: [
    { w: 4, group: [['penguin_knight', 1, 3]] },
    { w: 3, group: [['kiba_walrus', 1, 2]] },
    { w: 3, group: [['penguin_knight', 1, 2], ['snow_slime', 1, 2]] },
    { w: 2, group: [['kiba_walrus', 1, 1], ['penguin_knight', 1, 1]] },
  ],
  n_mine: [
    { w: 4, group: [['mole_miner', 1, 3]] },
    { w: 3, group: [['ore_slime', 1, 2], ['mole_miner', 0, 1]] },
    { w: 3, group: [['frost_wolf', 2, 3]] },
    { w: 2, group: [['yeti', 1, 1], ['snow_wisp', 1, 2]] },
    { w: 2, group: [['mole_miner', 1, 2], ['snowman', 1, 1]] },
  ],
  n_peak: [
    { w: 4, group: [['yeti', 1, 2]] },
    { w: 3, group: [['frost_wolf', 2, 3]] },
    { w: 3, group: [['snow_wisp', 1, 2], ['ice_bat', 1, 2]] },
    { w: 2, group: [['snowman', 2, 3]] },
    { w: 1, group: [['frost_drake', 1, 1]] },
  ],
  n_volcano: [
    { w: 4, group: [['lava_lizard', 1, 2]] },
    { w: 3, group: [['fire_imp', 2, 3]] },
    { w: 3, group: [['ember_bird', 2, 3]] },
    { w: 2, group: [['magma_slime', 1, 2], ['fire_imp', 1, 1]] },
    { w: 2, group: [['lava_lizard', 1, 1], ['ember_bird', 1, 2]] },
  ],
  // ── 氷の洞窟 ──
  n_ice: [
    { w: 4, group: [['penguin_knight', 1, 2], ['ice_bat', 0, 2]] },
    { w: 3, group: [['ice_golem', 1, 1], ['snow_slime', 0, 2]] },
    { w: 3, group: [['ice_bat', 2, 4]] },
    { w: 2, group: [['kiba_walrus', 1, 2]] },
    { w: 2, group: [['snow_wisp', 2, 3]] },
  ],
  // ── カナトコ鉱山 ──
  n_mine1: [
    { w: 4, group: [['mole_miner', 2, 3]] },
    { w: 3, group: [['ore_slime', 1, 2], ['mole_miner', 1, 1]] },
    { w: 3, group: [['fire_imp', 1, 2], ['mole_miner', 1, 1]] },
    { w: 2, group: [['minecart_ghost', 1, 1], ['ore_slime', 0, 1]] },
  ],
  n_mine2: [
    { w: 4, group: [['minecart_ghost', 1, 2]] },
    { w: 3, group: [['fire_imp', 2, 3]] },
    { w: 3, group: [['mole_miner', 1, 2], ['fire_imp', 1, 1]] },
    { w: 2, group: [['ore_slime', 2, 3]] },
    { w: 1, group: [['shadow_flame', 1, 2], ['fire_imp', 0, 1]] },
  ],
  // ── 炎の山 ──
  n_volc: [
    { w: 4, group: [['lava_lizard', 1, 2], ['magma_slime', 0, 1]] },
    { w: 3, group: [['fire_hound', 1, 3]] },
    { w: 3, group: [['ember_bird', 2, 3], ['fire_imp', 0, 1]] },
    { w: 3, group: [['magma_slime', 2, 3]] },
    { w: 2, group: [['obsidian_knight', 1, 1], ['fire_hound', 0, 1]] },
  ],
  // ── 竜の試練の神殿 ──
  n_temple: [
    { w: 4, group: [['dragon_statue', 1, 2]] },
    { w: 3, group: [['shadow_flame', 2, 3]] },
    { w: 2, group: [['dragon_statue', 1, 1], ['shadow_flame', 1, 2]] },
    { w: 1, group: [['obsidian_knight', 1, 1], ['shadow_flame', 0, 1]] },
  ],
  // ── 星竜山 ──
  n_peak_out: [
    { w: 4, group: [['frost_drake', 1, 2]] },
    { w: 3, group: [['star_wyvern', 1, 1], ['snow_wisp', 0, 2]] },
    { w: 3, group: [['yeti', 1, 2], ['frost_wolf', 1, 2]] },
    { w: 2, group: [['star_wyvern', 1, 2]] },
  ],
  n_peak_in: [
    { w: 4, group: [['ice_golem', 1, 2]] },
    { w: 3, group: [['frost_drake', 1, 1], ['shadow_flame', 1, 2]] },
    { w: 3, group: [['shadow_flame', 2, 3]] },
    { w: 2, group: [['star_wyvern', 1, 1], ['ice_golem', 0, 1]] },
  ],
};

export const FIXED_CH3 = {
  blizzard_mammoth: { group: [['blizzard_mammoth', 1, 1]], bg: 'ice_cave', bgm: 'boss', canFlee: false, boss: true },
  magma_golem: { group: [['magma_golem', 1, 1]], bg: 'mine', bgm: 'boss', canFlee: false, boss: true },
  flame_knight: { group: [['flame_knight', 1, 1]], bg: 'volcano', bgm: 'boss', canFlee: false, boss: true },
  trial_guardian: { group: [['trial_guardian', 1, 1]], bg: 'temple3', bgm: 'boss', canFlee: false, boss: true },
  flame_witch: { group: [['flame_witch', 1, 1]], bg: 'summit', bgm: 'boss3', canFlee: false, boss: true },
  flame_witch_true: { group: [['flame_witch_true', 1, 1]], bg: 'summit', bgm: 'boss3', canFlee: false, boss: true },
  // 鉱山の 地下2階: つかまった 鉱夫たちの 見はり
  m2_guards: { group: [['fire_imp', 2, 2], ['shadow_flame', 1, 1]], bg: 'mine', bgm: 'battle', canFlee: false },
};

export const ZONE_BG_CH3 = {
  n_snow: 'snowfield', n_forest: 'snowforest', n_lake: 'snowfield', n_mine: 'snowfield', n_peak: 'snowfield', n_volcano: 'ashland',
  n_ice: 'ice_cave', n_mine1: 'mine', n_mine2: 'mine', n_volc: 'volcano', n_temple: 'temple3', n_peak_out: 'peak', n_peak_in: 'ice_cave',
};
