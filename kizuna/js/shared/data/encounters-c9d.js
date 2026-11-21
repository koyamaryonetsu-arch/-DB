// 第3部 第1章 第4幕「星のはかば」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-part3-c9d.md の 12-4）
//   t9d_lane  … ふたごの道 1階（c9d_g1。Lv102）
//   t9d_lane2 … ふたごの道 2階（c9d_g2。Lv102〜103）
//   かげぼうしネコ（darkOnly）は 両方の 表に 入れる（A班の フィールドで 暗い マスだけを 歩く ＝ スピカと はなれた 人の 暗い 道だけ）
//   星のはかば（c9d_grave）は 魔物が 出ない（表は ない）
// ふつうの 魔物 5しゅ（どれも 仲間に なる）。こだまのふたごは かならず 2ひき 1組で 出る
// ふつうの 戦いの 長さ（12-3）: 勇者 Lv102 ＋ 酒場の 仲間 3人で 90秒 いない（tools/sim-ch9-field.mjs）
import { C9D_MU, C9D_MUMU, C9D_TWIN, C9D_KAGE } from './monsters-c9d.js?v=e423b0b228a9';
import { C9D_BATTLE, C9D_TRACKS } from '../maps/c9d-flags.js?v=e423b0b228a9';
// 負けた 時の ヒントの 文（boss-hints-c9d.js が mergeBossHints を よぶ）
import './boss-hints-c9d.js?v=e423b0b228a9';

export const ENCOUNTERS_C9D = {
  t9d_lane: [
    { w: 5, group: [[C9D_TWIN, 2, 2]] },
    { w: 4, group: [['c9d_moth', 1, 2]] },
    { w: 3, group: [['c9d_spider', 1, 1], ['c9d_moth', 0, 1]] },
    { w: 1, group: [[C9D_KAGE, 1, 1]] },
  ],
  t9d_lane2: [
    { w: 3, group: [[C9D_TWIN, 2, 2]] },
    { w: 3, group: [['c9d_spider', 1, 2]] },
    { w: 3, group: [['c9d_goat', 1, 1]] },
    { w: 2, group: [['c9d_goat', 1, 1], ['c9d_moth', 1, 1]] },
    { w: 1, group: [[C9D_KAGE, 1, 1]] },
    { w: 1, group: [[C9D_KAGE, 1, 1], ['c9d_spider', 1, 1]] },
  ],
};
export const C9D_ZONES = Object.keys(ENCOUNTERS_C9D);

// きまった 戦い（docs/plan-part3-c9d.md の 12-4）。台本は ['showMon', 'c9d_mu'] → ['battle', 'c9d_mu']
//   c9d_mu … あそびたい魔人 ムウ（星のはかばの まん中。Lv104）。ムウムウは はじめは いない（ムウが 分かれると 出る。battle-c9d.js）
//   スピカは かならず 出る（てらす・星のうた も）。曲は F班の c9d_mu（pub の muStage で 2体の おいかけっこ）
export const FIXED_C9D = {
  [C9D_BATTLE.mu]: { group: [[C9D_MU, 1, 1], [C9D_MUMU, 1, 1]], bg: 'c9d_grave', bgm: C9D_TRACKS.mu, canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（ふたごの道。client/render/c9d-bg.js）
export const ZONE_BG_C9D = { t9d_lane: 'c9d_lane', t9d_lane2: 'c9d_lane' };
