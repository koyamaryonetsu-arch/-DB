// 第3部 第3章 第1幕「星の船と、星座の島」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c11a.md の 17-3・17-5。表の 名前は B班が きめた）
//   t11a_sea   … 星の海 c11_sea（船の 上の 戦い。Lv118〜119。流れに 運ばれて いる 間は 出ない … A班）
//   t11a_isle1 … 星座の 島 1（c11a_isle1。Lv119。星座の 上では 出ない … A班）
//   t11a_isle2 … 星座の 島 2（c11a_isle2。Lv119〜120）
//   t11a_isle3 … 星座の 島 3（c11a_isle3。Lv120）
// ふつうの 戦いの 長さ（17-4）: 超級職 4人で 1回 30〜50秒（tools/sim-ch9-field.mjs の SUPER=1）
import { C11A_HEAD, C11A_CHEST, C11A_TAIL, C11A_CAPTAIN } from './monsters-c11a.js?v=c5f1443d1cb0';
import { C11A_BATTLE_B as C11A_BATTLE, C11A_TRACKS_B as C11A_TRACKS } from '../maps/c11a-flags.js?v=c5f1443d1cb0';
// 負けた 時の ヒントの 文（boss-hints-c11a.js が mergeBossHints を よぶ）
import './boss-hints-c11a.js?v=c5f1443d1cb0';

export const ENCOUNTERS_C11A = {
  t11a_sea: [
    { w: 5, group: [['c11a_jelly', 1, 2]] },
    { w: 4, group: [['c11a_comet', 1, 2]] },
    { w: 3, group: [['c11a_ray', 1, 1], ['c11a_jelly', 0, 1]] },
    { w: 3, group: [['c11a_tobi', 1, 2]] },
    { w: 2, group: [['c11a_ray', 1, 1], ['c11a_tobi', 1, 1]] },
  ],
  t11a_isle1: [
    { w: 5, group: [['c11a_ram', 1, 2]] },
    { w: 4, group: [['c11a_crab', 1, 2]] },
    { w: 3, group: [['c11a_wisp', 1, 1], ['c11a_ram', 0, 1]] },
  ],
  t11a_isle2: [
    { w: 5, group: [['c11a_crab', 1, 2]] },
    { w: 4, group: [['c11a_ram', 1, 2]] },
    { w: 3, group: [['c11a_wisp', 1, 1], ['c11a_crab', 0, 1]] },
    { w: 1, group: [['c11a_owl', 1, 1], ['c11a_ram', 1, 1]] },
  ],
  t11a_isle3: [
    { w: 4, group: [['c11a_ram', 1, 2]] },
    { w: 4, group: [['c11a_crab', 1, 2]] },
    { w: 3, group: [['c11a_wisp', 1, 1], ['c11a_crab', 1, 1]] },
    { w: 5, group: [['c11a_owl', 1, 1], ['c11a_wisp', 0, 1]] },
  ],
};
export const C11A_ZONES = Object.keys(ENCOUNTERS_C11A);

// きまった 戦い（docs/plan-part3-c11a.md の 17-5）。台本は ['battle', 'c11a_beast']・['battle', 'c11a_pirate']
//   c11a_beast … 星座のけもの（3つめの 明かりを ともした 島。Lv119。3つの 星 ＝ 3体）
//   c11a_pirate … いかり船長 イバリー（星座の門の 前。Lv120。チクタクザメは 的に ならない）
//   にげられない。スピカは かならず 出る（てらす・星のうた も）。曲は F班の c11a_beast・c11a_pirate
export const FIXED_C11A = {
  [C11A_BATTLE.beast]: { group: [[C11A_HEAD, 1, 1], [C11A_CHEST, 1, 1], [C11A_TAIL, 1, 1]], bg: 'c11a_isle', bgm: C11A_TRACKS.beast, canFlee: false, boss: true },
  [C11A_BATTLE.pirate]: { group: [[C11A_CAPTAIN, 1, 1]], bg: 'c11a_gate', bgm: C11A_TRACKS.pirate, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（client/render/c11a-bg.js）
export const ZONE_BG_C11A = { t11a_sea: 'c11a_deck', t11a_isle1: 'c11a_isle', t11a_isle2: 'c11a_isle', t11a_isle3: 'c11a_isle' };
