// 第2章の てきの くみあわせ（encounters.js で まぜる）
export const ENCOUNTERS_CH2 = {
  sea: [
    { w: 4, group: [['marine_slime', 1, 3]] },
    { w: 4, group: [['wild_gull', 2, 3]] },
    { w: 3, group: [['shell_knight', 1, 2]] },
    { w: 2, group: [['sea_serpent', 1, 1]] },
    { w: 2, group: [['marine_slime', 1, 2], ['wild_gull', 1, 2]] },
    { w: 1, group: [['sea_serpent', 1, 1], ['shell_knight', 1, 1]] },
    // あたらしい 仲間モンスター（monsters-r23.js）
    { w: 2, group: [['tobiuo', 2, 3]] },
  ],
  isle: [
    { w: 4, group: [['coconut', 1, 3]] },
    { w: 3, group: [['wind_imp', 2, 3]] },
    { w: 3, group: [['ghost_pirate', 1, 2]] },
    { w: 2, group: [['wind_imp', 1, 2], ['coconut', 1, 1]] },
    { w: 1, group: [['wild_gull', 2, 3]] },
  ],
  storm: [
    { w: 4, group: [['thunder_imp', 1, 3]] },
    { w: 3, group: [['storm_bird', 1, 2]] },
    { w: 2, group: [['sea_serpent', 1, 2]] },
    { w: 2, group: [['storm_bird', 1, 1], ['thunder_imp', 1, 2]] },
    // めずらしい: アックスライダー（monsters-rare.js）
    { w: 1, group: [['axe_rider', 1, 1], ['storm_bird', 0, 1]] },
  ],
  seacave: [
    { w: 4, group: [['coral_golem', 1, 2], ['marine_slime', 0, 2]] },
    { w: 3, group: [['shell_knight', 2, 3], ['marine_slime', 0, 1]] },
    { w: 3, group: [['ghost_pirate', 2, 3]] },
    { w: 2, group: [['sea_serpent', 1, 1], ['coral_golem', 1, 1]] },
    { w: 2, group: [['uzumaki_gai', 1, 2], ['marine_slime', 0, 1]] },
    // めずらしい: からくり騎士
    { w: 1, group: [['clockwork_knight', 1, 1]] },
  ],
  tower: [
    { w: 4, group: [['storm_soldier', 2, 3]] },
    { w: 3, group: [['thunder_imp', 2, 4]] },
    { w: 3, group: [['storm_bird', 1, 2], ['wind_imp', 1, 2]] },
    { w: 2, group: [['storm_soldier', 1, 2], ['thunder_imp', 1, 2]] },
    // めずらしい: アックスライダー・ヴァルドラゴン
    { w: 1, group: [['axe_rider', 1, 1], ['storm_soldier', 0, 1]] },
    { w: 1, group: [['great_dragon', 1, 1]] },
  ],
};

export const FIXED_CH2 = {
  giant_squid: { group: [['giant_squid', 1, 1]], bg: 'sea_cave', bgm: 'boss', canFlee: false, boss: true },
  storm_general: { group: [['storm_general', 1, 1]], bg: 'tower_top', bgm: 'boss', canFlee: false, boss: true },
};

export const ZONE_BG_CH2 = { sea: 'sea', isle: 'beach', storm: 'storm', seacave: 'sea_cave', tower: 'tower' };
