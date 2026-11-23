// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c11c.md の 19-3・19-5。表の 名前は B班が きめた）
//   はかりの 回ろうで 出る（かげの 台の 上と、光の さくの すぐ そばでは 出さない … A班）。ひと休みの 部屋・大とびらの 前では 出ない
//   t11c_hall1 … 回ろう 1階（c11c_hall1。Lv122）
//   t11c_hall2 … 回ろう 2階（c11c_hall2。Lv122〜123）
//   t11c_hall3 … 回ろう 3階（c11c_hall3。Lv123〜124）
// ふつうの 戦いの 長さ（19-4）: 超級職 4人で 1回 30〜50秒（tools/sim-ch9-field.mjs の SUPER=1）
import { C11C_HEAD, C11C_ARM, C11C_LEG, C11C_ACE, C11C_GUARD } from './monsters-c11c.js?v=f8927db0fd05';
import { C11C_BATTLE_B as C11C_BATTLE, C11C_TRACKS_B as C11C_TRACKS } from '../maps/c11c-flags.js?v=f8927db0fd05';
// 負けた 時の ヒントの 文（boss-hints-c11c.js が mergeBossHints を よぶ）
import './boss-hints-c11c.js?v=f8927db0fd05';

export const ENCOUNTERS_C11C = {
  t11c_hall1: [
    { w: 5, group: [['c11c_tmoon', 1, 2]] },
    { w: 4, group: [['c11c_tstar', 1, 2]] },
    { w: 3, group: [['c11c_bird', 1, 1], ['c11c_tmoon', 0, 1]] },
    { w: 2, group: [['c11c_tmoon', 1, 1], ['c11c_tstar', 1, 1]] },
  ],
  t11c_hall2: [
    { w: 5, group: [['c11c_tcomet', 1, 2]] },
    { w: 4, group: [['c11c_lamp', 1, 2]] },
    { w: 3, group: [['c11c_tcomet', 1, 1], ['c11c_lamp', 1, 1]] },
    { w: 2, group: [['c11c_tstar', 1, 1], ['c11c_bird', 1, 1]] },
  ],
  t11c_hall3: [
    { w: 5, group: [['c11c_tsun', 1, 2]] },
    { w: 4, group: [['c11c_moth', 1, 2]] },
    { w: 3, group: [['c11c_tsun', 1, 1], ['c11c_tcomet', 1, 1]] },
    { w: 2, group: [['c11c_moth', 1, 1], ['c11c_lamp', 0, 1]] },
  ],
};
export const C11C_ZONES = Object.keys(ENCOUNTERS_C11C);

// きまった 戦い（docs/plan-part3-c11c.md の 19-5）。台本は ['battle', 'c11c_mecha']・['battle', 'c11c_ace']
//   c11c_mecha … 3人組の メカ 3号 バラバラン3号（月の都の 名前の 塔の 前。Lv123）。あたま・うで・あし の 3体
//   c11c_ace   … 近衛の隊長エース と トランプの へいたい 2体（大とびらの 前。Lv124。ひとりの 時は へいたい 1体）
//   にげられない。スピカは かならず 出る（てらす・星のうた も）。曲は F班の c11c_mecha・c11c_ace
export const FIXED_C11C = {
  [C11C_BATTLE.mecha]: { group: [[C11C_ARM, 1, 1], [C11C_HEAD, 1, 1], [C11C_LEG, 1, 1]], bg: 'c11c_tower', bgm: C11C_TRACKS.mecha, canFlee: false, boss: true },
  [C11C_BATTLE.ace]: { group: [[C11C_GUARD, 1, 1], [C11C_ACE, 1, 1], [C11C_GUARD, 1, 1]], bg: 'c11c_door', bgm: C11C_TRACKS.ace, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c11c-bg.js）
export const ZONE_BG_C11C = { t11c_hall1: 'c11c_hall', t11c_hall2: 'c11c_hall', t11c_hall3: 'c11c_hall' };
