// 第3部 第3章 第2幕「月の都と、名前のランプ」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c11b.md の 18-3・18-5。表の 名前は B班が きめた）
//   おもての 町（c11b_front）では 出ない（A班）。うら道と 塔で 出る（おもてと うらで 表を かえる）
//   t11b_alley  … うらの 町の 道・塔への 道の うら（Lv120〜121）
//   t11b_tower  … 名前の 塔の おもて（c11b_tower1〜3。Lv121）
//   t11b_towerb … 名前の 塔の うら（c11b_towerb1〜3。Lv121〜122）
// ふつうの 戦いの 長さ（18-4）: 超級職 4人で 1回 30〜50秒（tools/sim-ch9-field.mjs の SUPER=1）
import { C11B_KEEPER, C11B_OBORO, C11B_TENNIN } from './monsters-c11b.js?v=6a7817ffa6c0';
import { C11B_BATTLE_B as C11B_BATTLE, C11B_TRACKS_B as C11B_TRACKS } from './c11b-names-b.js?v=6a7817ffa6c0';
// 負けた 時の ヒントの 文（boss-hints-c11b.js が mergeBossHints を よぶ）
import './boss-hints-c11b.js?v=6a7817ffa6c0';

export const ENCOUNTERS_C11B = {
  t11b_alley: [
    { w: 5, group: [['c11b_moth', 1, 2]] },
    { w: 4, group: [['c11b_kage', 1, 2]] },
    { w: 3, group: [['c11b_cat', 1, 1], ['c11b_moth', 0, 1]] },
    { w: 2, group: [['c11b_kage', 1, 1], ['c11b_cat', 1, 1]] },
  ],
  t11b_tower: [
    { w: 5, group: [['c11b_lamp', 1, 2]] },
    { w: 4, group: [['c11b_guard', 1, 2]] },
    { w: 3, group: [['c11b_guard', 1, 1], ['c11b_lamp', 1, 1]] },
    { w: 1, group: [['c11b_moth', 1, 2]] },
  ],
  t11b_towerb: [
    { w: 5, group: [['c11b_dim', 1, 2]] },
    { w: 4, group: [['c11b_cloud', 1, 1], ['c11b_dim', 0, 1]] },
    { w: 3, group: [['c11b_kage', 1, 1], ['c11b_dim', 1, 1]] },
    { w: 2, group: [['c11b_cloud', 1, 2]] },
  ],
};
export const C11B_ZONES = Object.keys(ENCOUNTERS_C11B);

// きまった 戦い（docs/plan-part3-c11b.md の 18-5）。台本は ['battle', 'c11b_keeper']・['battle', 'c11b_oboro']
//   c11b_keeper … ランプの番人カンテラ（名前の 塔の いちばん 上。Lv121）
//   c11b_oboro  … 月のむかえ オボロ と 天人 2体（塔の 上の テラス。Lv122。ひとりの 時は 天人 1体）
//   にげられない。スピカは かならず 出る（てらす・星のうた も）。曲は F班の c11b_keeper・c11b_oboro
export const FIXED_C11B = {
  [C11B_BATTLE.keeper]: { group: [[C11B_KEEPER, 1, 1]], bg: 'c11b_tower', bgm: C11B_TRACKS.keeper, canFlee: false, boss: true },
  [C11B_BATTLE.oboro]: { group: [[C11B_TENNIN, 1, 1], [C11B_OBORO, 1, 1], [C11B_TENNIN, 1, 1]], bg: 'c11b_terrace', bgm: C11B_TRACKS.oboro, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c11b-bg.js）
export const ZONE_BG_C11B = { t11b_alley: 'c11b_alley', t11b_tower: 'c11b_tower', t11b_towerb: 'c11b_towerb' };
