// エンカウント（てきの くみあわせ）
// group: [[モンスターID, 最小数, 最大数], ...]
// フィールドでは 先頭の モンスターの すがたで うろうろしている（シンボルエンカウント）

import { ENCOUNTERS_CH2, FIXED_CH2, ZONE_BG_CH2 } from './encounters-ch2.js?v=cb6fd0fb30e1';

export const ENCOUNTER_TABLES = {
  outskirts: [
    { w: 6, group: [['pururin', 1, 2]] },
    { w: 4, group: [['tsunousagi', 1, 2]] },
    { w: 3, group: [['kobushi', 1, 2]] },
    { w: 2, group: [['pururin', 1, 1], ['tsunousagi', 1, 1]] },
  ],
  plains: [
    { w: 4, group: [['pururin', 2, 3]] },
    { w: 3, group: [['koumorin', 1, 3]] },
    { w: 3, group: [['goblin', 1, 2]] },
    { w: 2, group: [['pururin_beth', 1, 2]] },
    { w: 2, group: [['goblin', 1, 1], ['koumorin', 1, 2]] },
    { w: 1, group: [['tsunousagi', 2, 3]] },
  ],
  forest: [
    { w: 4, group: [['frog', 2, 3]] },
    { w: 3, group: [['wolf', 1, 3]] },
    { w: 3, group: [['lamp', 1, 3]] },
    { w: 3, group: [['nemuri', 1, 3]] },
    { w: 2, group: [['wolf', 1, 2], ['frog', 1, 2]] },
  ],
  swamp: [
    { w: 4, group: [['hedoron', 1, 2]] },
    { w: 3, group: [['frog', 2, 3]] },
    { w: 2, group: [['nemuri', 1, 2], ['hedoron', 1, 1]] },
  ],
  east: [
    { w: 4, group: [['armor_crab', 1, 3]] },
    { w: 3, group: [['ice_pururin', 1, 3]] },
    { w: 3, group: [['crow', 2, 3]] },
    { w: 2, group: [['wolf', 2, 3]] },
    { w: 2, group: [['crow', 1, 2], ['armor_crab', 1, 2]] },
  ],
  cave1: [
    { w: 4, group: [['skeleton', 2, 3]] },
    { w: 3, group: [['dark_bat', 1, 3]] },
    { w: 2, group: [['rockman', 1, 1]] },
    { w: 2, group: [['shadow_mage', 1, 1], ['skeleton', 1, 2]] },
  ],
  cave2: [
    { w: 3, group: [['skeleton', 2, 3]] },
    { w: 3, group: [['rockman', 1, 2], ['dark_bat', 0, 1]] },
    { w: 3, group: [['shadow_mage', 1, 2], ['dark_bat', 1, 2]] },
    { w: 2, group: [['dark_bat', 2, 4]] },
  ],
  rare: [
    { w: 3, group: [['kirakira', 1, 1]] },
    { w: 1, group: [['kirakira', 1, 1], ['pururin', 1, 2]] },
  ],
};

// ストーリーで きまった たたかい
export const FIXED_ENCOUNTERS = {
  shadow_attack: { group: [['shadow_soldier', 2, 2]], bg: 'village_night', bgm: 'battle', canFlee: false },
  treant: { group: [['dark_treant', 1, 1]], bg: 'forest', bgm: 'boss', canFlee: false, boss: true },
  goldoon: { group: [['goldoon', 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true },
};

// 地域ごとの バトルはいけい
export const ZONE_BG = {
  outskirts: 'grass', plains: 'grass', forest: 'forest', swamp: 'swamp', east: 'plains_east',
  cave1: 'cave', cave2: 'cave', rare: 'grass',
};

// 第2章
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_CH2);
Object.assign(FIXED_ENCOUNTERS, FIXED_CH2);
Object.assign(ZONE_BG, ZONE_BG_CH2);
