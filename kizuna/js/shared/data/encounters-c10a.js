// 第3部 第2章 第1幕「赤と緑」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c10a.md の 13-6）
//   t10r_1 … 炎の山の 下の 古い 道 1階（c10r_1。Lv105）
//   t10r_2 … 古い 道 2階（c10r_2。Lv105〜106）。熱の 間（c10r_3）と かけ上がる 帰り道は 魔物が 出ない（表は ない）
//   t10g_1 … 大地の下の 根の国 1まいめ（c10g_1。Lv106）
//   t10g_2 … 根の国 2まいめ（c10g_2。Lv106〜107）
// ふつうの 魔物 8しゅ（どれも 仲間に なる）
// ふつうの 戦いの 長さ（13-5）: 勇者 ＋ ゲームと おなじ 作りの 酒場の 仲間 3人で 90秒 いない（tools/sim-ch9-field.mjs）
import { C10R_TAMAGON, C10G_MOLD } from './monsters-c10a.js?v=e423b0b228a9';
import { C10A_BATTLE, C10A_TRACKS } from '../maps/c10a-flags.js?v=e423b0b228a9';
// 負けた 時の ヒントの 文（boss-hints-c10a.js が mergeBossHints を よぶ）
import './boss-hints-c10a.js?v=e423b0b228a9';

export const ENCOUNTERS_C10A = {
  t10r_1: [
    { w: 5, group: [['c10r_lizard', 1, 2]] },
    { w: 4, group: [['c10r_slime', 1, 2]] },
    { w: 3, group: [['c10r_lizard', 1, 1], ['c10r_slime', 1, 1]] },
    { w: 2, group: [['c10r_pot', 1, 1]] },
  ],
  t10r_2: [
    { w: 2, group: [['c10r_turtle', 1, 1]] },
    { w: 2, group: [['c10r_pot', 1, 2]] },
    { w: 3, group: [['c10r_lizard', 1, 2]] },
    { w: 2, group: [['c10r_turtle', 1, 1], ['c10r_slime', 1, 1]] },
    { w: 2, group: [['c10r_pot', 1, 1], ['c10r_lizard', 1, 1]] },
  ],
  t10g_1: [
    { w: 5, group: [['c10g_spore', 1, 2]] },
    { w: 4, group: [['c10g_vine', 1, 2]] },
    { w: 3, group: [['c10g_spore', 1, 1], ['c10g_vine', 1, 1]] },
    { w: 2, group: [['c10g_bag', 1, 1]] },
  ],
  t10g_2: [
    { w: 3, group: [['c10g_beetle', 1, 1]] },
    { w: 1, group: [['c10g_bag', 1, 2]] },
    { w: 3, group: [['c10g_vine', 1, 2]] },
    { w: 2, group: [['c10g_beetle', 1, 1], ['c10g_spore', 1, 1]] },
    { w: 2, group: [['c10g_bag', 1, 1], ['c10g_spore', 1, 1]] },
  ],
};
export const C10A_ZONES = Object.keys(ENCOUNTERS_C10A);

// きまった 戦い（docs/plan-part3-c10a.md の 13-6）。台本は ['showMon', 'c10r_tamagon'] → ['battle', 'c10r_boss'] など
//   c10r_boss … ドクター・タマゴン と グルグルドリル号（熱の 間。Lv107）
//   c10g_boss … カビだんしゃく モルド と カビカビ号（かれた 大木の 前。Lv108）
//   スピカは かならず 出る（てらす・星のうた も）。曲は F班の c10r_boss・c10g_boss（ボスの だんは ふつう … HP 半分で 上がる）
export const FIXED_C10A = {
  [C10A_BATTLE.red]: { group: [[C10R_TAMAGON, 1, 1]], bg: 'c10r_heat', bgm: C10A_TRACKS.redBoss, canFlee: false, boss: true },
  [C10A_BATTLE.green]: { group: [[C10G_MOLD, 1, 1]], bg: 'c10g_tree', bgm: C10A_TRACKS.greenBoss, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c10a-bg.js）
export const ZONE_BG_C10A = { t10r_1: 'c10r_road', t10r_2: 'c10r_road', t10g_1: 'c10g_roots', t10g_2: 'c10g_roots' };
