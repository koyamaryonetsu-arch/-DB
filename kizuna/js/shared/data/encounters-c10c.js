// 第3部 第2章 第3幕「紫と、うばわれた音」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c10c.md の 15-4）
//   t10c_isles … 空の 小島（c10c_isles1・c10c_isles2。Lv113〜114）。うかぶ いせき（c10c_isles3）は 魔物が 出ない
//   t10c_fort  … 少年の とりで・ベルトの 工場（c10c_fort1・c10c_fort2。Lv114〜115。ベルトの 上では 出さない … A班）。少年の 間（c10c_fort3）は 出ない
// ふつうの 戦いの 長さ（15-3）: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない（tools/sim-ch9-field.mjs）
import { C10C_COLONEL, C10C_ALGOL } from './monsters-c10c.js?v=d4d473d565e8';
import { C10C_BATTLE_B as C10C_BATTLE, C10C_TRACKS_B as C10C_TRACKS } from './c10c-names-b.js?v=d4d473d565e8';
// 負けた 時の ヒントの 文（boss-hints-c10c.js が mergeBossHints を よぶ）
import './boss-hints-c10c.js?v=d4d473d565e8';

export const ENCOUNTERS_C10C = {
  t10c_isles: [
    { w: 5, group: [['c10c_sheep', 1, 2]] },
    { w: 4, group: [['c10c_ray', 1, 2]] },
    { w: 3, group: [['c10c_puff', 1, 1], ['c10c_sheep', 1, 1]] },
    { w: 3, group: [['c10c_jelly', 1, 1], ['c10c_ray', 0, 1]] },
    { w: 2, group: [['c10c_puff', 2, 2]] },
  ],
  t10c_fort: [
    { w: 5, group: [['c10c_carrier', 1, 2]] },
    { w: 4, group: [['c10c_mole', 1, 2]] },
    { w: 3, group: [['c10c_lamp', 1, 1], ['c10c_carrier', 1, 1]] },
    { w: 3, group: [['c10c_haniwa', 1, 1], ['c10c_mole', 0, 1]] },
    { w: 2, group: [['c10c_haniwa', 1, 1], ['c10c_lamp', 1, 1]] },
  ],
};
export const C10C_ZONES = Object.keys(ENCOUNTERS_C10C);

// きまった 戦い（docs/plan-part3-c10c.md の 15-4）。台本は ['battle', 'c10c_colonel']・['battle', 'c10c_algol']
//   c10c_colonel … たいさムスカリ（うかぶ いせき。Lv114）
//   c10c_algol … アルゴル（少年の 間。Lv116。HPが 3わりで 終わる）
//   スピカは かならず 出る（てらす・星のうた も）。曲は F班の c10c_colonel・c10c_rival
export const FIXED_C10C = {
  [C10C_BATTLE.colonel]: { group: [[C10C_COLONEL, 1, 1]], bg: 'c10c_ruin', bgm: C10C_TRACKS.colonel, canFlee: false, boss: true },
  [C10C_BATTLE.algol]: { group: [[C10C_ALGOL, 1, 1]], bg: 'c10c_room', bgm: C10C_TRACKS.rival, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c10c-bg.js）
export const ZONE_BG_C10C = { t10c_isles: 'c10c_sky', t10c_fort: 'c10c_belt' };
