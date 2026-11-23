// 第3部 第1章 第2幕「鉱山の底の先」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3.md の 10-4）
//   t9b_shaft … たてあな（c9b_shaft。Lv98）
//   t9b_light … 大地の下（c9b_under。明るい 所 Lv98〜99）。くらやみの大ミミズ（darkOnly）も この 表に 入れる
//     （A班の フィールドで 暗い マスだけを 歩く。柱を ともすと その まわりには 来ない）
//   t9b_hall … 大王の やしき（c9b_hall。Lv99。もぐら兵）
// ふつうの 魔物 6しゅ（どれも 仲間に なる）。重みで 出やすさを きめて、ランクが ちらばる ように する（tools/gen-monster-ranks.mjs）
import { C9B_DEDEDON, C9B_DISHES, C9B_MIMIZU } from './monsters-c9b.js?v=9315c53e5c23';
import { C9B_BATTLE, C9B_TRACKS } from '../maps/c9b-flags.js?v=9315c53e5c23';
// 負けた 時の ヒントの 文（boss-hints-c9b.js が mergeBossHints を よぶ）
import './boss-hints-c9b.js?v=9315c53e5c23';

export const ENCOUNTERS_C9B = {
  t9b_shaft: [
    { w: 6, group: [['c9b_kinoko', 1, 2]] },
    { w: 2, group: [['c9b_bat', 1, 1], ['c9b_kinoko', 1, 1]] },
    { w: 2, group: [['c9b_crab', 1, 1], ['c9b_kinoko', 1, 1]] },
  ],
  t9b_light: [
    { w: 6, group: [['c9b_kinoko', 1, 2]] },
    { w: 3, group: [['c9b_crab', 1, 1], ['c9b_kinoko', 1, 1]] },
    { w: 2, group: [['c9b_bat', 1, 1], ['c9b_kinoko', 1, 1]] },
    { w: 1, group: [['c9b_crab', 1, 2]] },
    { w: 1, group: [[C9B_MIMIZU, 1, 1]] },
    { w: 1, group: [[C9B_MIMIZU, 1, 1], ['c9b_bat', 1, 1]] },
  ],
  t9b_hall: [
    { w: 6, group: [['c9b_mole_spear', 1, 2]] },
    { w: 2, group: [['c9b_mole_spear', 1, 2], ['c9b_mole_pot', 1, 1]] },
    { w: 1, group: [['c9b_mole_pot', 1, 1], ['c9b_mole_spear', 1, 1]] },
  ],
};
export const C9B_ZONES = Object.keys(ENCOUNTERS_C9B);

// きまった 戦い（docs/plan-part3.md の 10-4）。台本は ['showMon', id] → ['battle', id]
//   c9b_king … デデドン大王（ごちそうの 間。Lv100）。皿 3つ（べつの 的）と いっしょ。スピカは かならず 出る（てらす も）
//   c9b_guard1〜3 … やしきの 手下（もぐら兵）。にげても よい
//   曲は F班の id（C9B_TRACKS。曲が まだ ない ときは 今の しくみの まま）
export const FIXED_C9B = {
  [C9B_BATTLE.king]: {
    group: [[C9B_DEDEDON, 1, 1], [C9B_DISHES.meat, 1, 1], [C9B_DISHES.cake, 1, 1], [C9B_DISHES.soup, 1, 1]],
    bg: 'c9b_feast', bgm: C9B_TRACKS.king, canFlee: false, boss: true,
  },
  [C9B_BATTLE.guard1]: { group: [['c9b_mole_spear', 2, 2]], bg: 'c9b_feast', bgm: C9B_TRACKS.hall, canFlee: true },
  [C9B_BATTLE.guard2]: { group: [['c9b_mole_spear', 1, 1], ['c9b_mole_pot', 1, 1]], bg: 'c9b_feast', bgm: C9B_TRACKS.hall, canFlee: true },
  [C9B_BATTLE.guard3]: { group: [['c9b_mole_pot', 2, 2], ['c9b_mole_spear', 1, 1]], bg: 'c9b_feast', bgm: C9B_TRACKS.hall, canFlee: true },
};

// 出現表 → 戦いの 背景（大地の下・ごちそうの 間。client/render/c9b-bg.js）
export const ZONE_BG_C9B = { t9b_shaft: 'c9b_under', t9b_light: 'c9b_under', t9b_hall: 'c9b_feast' };
