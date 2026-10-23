// エンカウント（てきの くみあわせ）
// group: [[モンスターID, 最小数, 最大数], ...]
// フィールドでは 先頭の モンスターの すがたで うろうろしている（シンボルエンカウント）

import { ENCOUNTERS_CH2, FIXED_CH2, ZONE_BG_CH2 } from './encounters-ch2.js?v=c2ce3805193b';
import { NIGHT_ENCOUNTERS, NIGHT_ZONE_BG, NIGHT_ZONES } from './night.js?v=c2ce3805193b';
import { ENCOUNTERS_CH3, FIXED_CH3, ZONE_BG_CH3 } from './encounters-ch3.js?v=c2ce3805193b';
import { ENCOUNTERS_CH4, FIXED_CH4, ZONE_BG_CH4, NIGHT_ZONES_CH4 } from './encounters-ch4.js?v=c2ce3805193b';
import { ENCOUNTERS_TEMPLE, FIXED_TEMPLE, ZONE_BG_TEMPLE } from './encounters-temple.js?v=c2ce3805193b';
import { ENCOUNTERS_LAB, FIXED_LAB, ZONE_BG_LAB } from './encounters-lab.js?v=c2ce3805193b';
import { FIXED_FAMILY } from './encounters-family.js?v=c2ce3805193b';
import { ENCOUNTERS_CH5, FIXED_CH5, ZONE_BG_CH5 } from './encounters-ch5.js?v=c2ce3805193b';
import { ENCOUNTERS_KUMOI, FIXED_KUMOI, ZONE_BG_KUMOI } from './encounters-kumoi.js?v=c2ce3805193b';
import { ENCOUNTERS_HOSHIYOMI, FIXED_HOSHIYOMI, ZONE_BG_HOSHIYOMI } from './encounters-hoshiyomi.js?v=c2ce3805193b';
import { ENCOUNTERS_EARTH, FIXED_EARTH, ZONE_BG_EARTH } from './encounters-earth.js?v=c2ce3805193b';
import { FIXED_FINAL } from './encounters-final.js?v=c2ce3805193b';
import { ENCOUNTERS_PHANTOM, FIXED_PHANTOM, ZONE_BG_PHANTOM } from './encounters-phantom.js?v=c2ce3805193b';
import { ENCOUNTERS_PAST, FIXED_PAST, ZONE_BG_PAST } from './encounters-past.js?v=c2ce3805193b';
// 第37回 A: サファラ闘技場の ランク戦（3連戦）
import { FIXED_ARENA } from './encounters-arena.js?v=c2ce3805193b';
// 第38回 B: 職業の試練（師しょうのまぼろし）
import { FIXED_TRIAL } from './monsters-trial.js?v=c2ce3805193b';

export const ENCOUNTER_TABLES = {
  outskirts: [
    { w: 6, group: [['pururin', 1, 2]] },
    { w: 4, group: [['tsunousagi', 1, 2]] },
    { w: 3, group: [['kobushi', 1, 2]] },
    { w: 2, group: [['pururin', 1, 1], ['tsunousagi', 1, 1]] },
    // あたらしい 仲間モンスター（monsters-r23.js）
    { w: 2, group: [['donguri', 1, 2]] },
  ],
  plains: [
    { w: 4, group: [['pururin', 2, 3]] },
    { w: 3, group: [['koumorin', 1, 3]] },
    { w: 3, group: [['goblin', 1, 2]] },
    { w: 2, group: [['pururin_beth', 1, 2]] },
    { w: 2, group: [['goblin', 1, 1], ['koumorin', 1, 2]] },
    { w: 1, group: [['tsunousagi', 2, 3]] },
    { w: 2, group: [['hana_pururin', 1, 2], ['pururin', 0, 1]] },
  ],
  forest: [
    { w: 4, group: [['frog', 2, 3]] },
    { w: 3, group: [['wolf', 1, 3]] },
    { w: 3, group: [['lamp', 1, 3]] },
    { w: 3, group: [['nemuri', 1, 3]] },
    { w: 2, group: [['wolf', 1, 2], ['frog', 1, 2]] },
    { w: 2, group: [['karamizuta', 1, 2]] },
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
    // めずらしい: ぷるりん騎士（monsters-rare.js）
    { w: 1, group: [['pururin_knight', 1, 1], ['ice_pururin', 0, 2]] },
  ],
  cave1: [
    { w: 4, group: [['skeleton', 2, 3]] },
    { w: 3, group: [['dark_bat', 1, 3]] },
    { w: 2, group: [['rockman', 1, 1]] },
    { w: 2, group: [['shadow_mage', 1, 1], ['skeleton', 1, 2]] },
    { w: 2, group: [['koakuma', 1, 2], ['dark_bat', 0, 1]] },
  ],
  cave2: [
    { w: 3, group: [['skeleton', 2, 3]] },
    { w: 3, group: [['rockman', 1, 2], ['dark_bat', 0, 1]] },
    { w: 3, group: [['shadow_mage', 1, 2], ['dark_bat', 1, 2]] },
    { w: 2, group: [['dark_bat', 2, 4]] },
    { w: 2, group: [['buriki', 1, 2], ['koakuma', 0, 1]] },
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
// 夜の 出現表（night.js）
Object.assign(ENCOUNTER_TABLES, NIGHT_ENCOUNTERS);
Object.assign(ZONE_BG, NIGHT_ZONE_BG);
// 第3章
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_CH3);
Object.assign(FIXED_ENCOUNTERS, FIXED_CH3);
Object.assign(ZONE_BG, ZONE_BG_CH3);
// 第4章（昼と 夜で 出る 魔物が かわる ちいきも ある）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_CH4);
Object.assign(FIXED_ENCOUNTERS, FIXED_CH4);
Object.assign(ZONE_BG, ZONE_BG_CH4);
Object.assign(NIGHT_ZONES, NIGHT_ZONES_CH4);
// 第4章 Step 7「砂の底の神殿」（encounters-temple.js。昼と 夜の 区別は ない）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_TEMPLE);
Object.assign(FIXED_ENCOUNTERS, FIXED_TEMPLE);
Object.assign(ZONE_BG, ZONE_BG_TEMPLE);
// 第4章クリアの あとの より道: 古代の大迷宮・たのまれごとの 強い 魔物（encounters-lab.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_LAB);
Object.assign(FIXED_ENCOUNTERS, FIXED_LAB);
// 第39回 C: 家族の 仕事の たのまれごとの 軽い 戦い（encounters-family.js）
Object.assign(FIXED_ENCOUNTERS, FIXED_FAMILY);
Object.assign(ZONE_BG, ZONE_BG_LAB);
// 第5章 Step 2「星の塔」（encounters-ch5.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_CH5);
Object.assign(FIXED_ENCOUNTERS, FIXED_CH5);
Object.assign(ZONE_BG, ZONE_BG_CH5);
// 第5章 Step 3・4「クモイ地方・しずみゆく島の古い神殿」・ガイアイーター（encounters-kumoi.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_KUMOI);
Object.assign(FIXED_ENCOUNTERS, FIXED_KUMOI);
Object.assign(ZONE_BG, ZONE_BG_KUMOI);
// 第5章 Step 5「星読みの里・ノクトの思い出の迷宮」・ノクトの影（encounters-hoshiyomi.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_HOSHIYOMI);
Object.assign(FIXED_ENCOUNTERS, FIXED_HOSHIYOMI);
Object.assign(ZONE_BG, ZONE_BG_HOSHIYOMI);
// 第5章 Step 6・7「根の島・大地の神殿」・ノクト（1回目）（encounters-earth.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_EARTH);
Object.assign(FIXED_ENCOUNTERS, FIXED_EARTH);
Object.assign(FIXED_ENCOUNTERS, FIXED_ARENA);
Object.assign(FIXED_ENCOUNTERS, FIXED_TRIAL);
Object.assign(ZONE_BG, ZONE_BG_EARTH);
// 第5章 Step 9: ノクト（本気）・魔王ソリトゥス（encounters-final.js）
Object.assign(FIXED_ENCOUNTERS, FIXED_FINAL);
// 第5章 Step 8「影の城」・3人の まぼろし（encounters-phantom.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_PHANTOM);
Object.assign(FIXED_ENCOUNTERS, FIXED_PHANTOM);
Object.assign(ZONE_BG, ZONE_BG_PHANTOM);
// 第2部 第6章 Step 1・2「千年前」「時の祠」「時の遺跡」・サンドクロック・ギアドン（encounters-past.js）
Object.assign(ENCOUNTER_TABLES, ENCOUNTERS_PAST);
Object.assign(FIXED_ENCOUNTERS, FIXED_PAST);
Object.assign(ZONE_BG, ZONE_BG_PAST);
