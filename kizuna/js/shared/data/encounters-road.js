// 第2部 第6章 Step 3・4「星めぐりの古道」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch6.md の 12-1）。今と 千年前の 両方の 階で おなじ 表
//   t6_road_up  … 星めぐりの古道 1〜4階（ほしかげオオカミ・ひなたの星ひつじ・星くずモグラ・ゆがみの精。Lv61〜62）
//   t6_road_low … 5〜8階（星座ガニ・時わすれフクロウ・ふたご星の精・星くずドラゴン。上の 階の 魔物と 色ちがいも。Lv63〜64）
// 4階と 8階の 前の 休み所は 魔物が 出ない（A の マップ）
// 星座の 魔物は 昼か 夜かで 強さが かわる（monsters-road.js の c6tod。battle-road.js）
import { registerVariant } from './variants.js?v=bf896afe56a6';

// 色ちがい（data/variants.js）: まれに 出る（経験値と お金が 多い）
export const ROAD_VARIANTS = [registerVariant('dust_mole', 'gold'), registerVariant('star_wolf', 'shadow'), registerVariant('dust_drake', 'dark')];
const [GOLD_MOLE, SHADOW_WOLF, DARK_DRAKE] = ROAD_VARIANTS;

export const ENCOUNTERS_ROAD = {
  t6_road_up: [
    { w: 4, group: [['star_wolf', 1, 2], ['dust_mole', 0, 1]] },
    { w: 3, group: [['sun_ram', 1, 1], ['star_wolf', 0, 1]] },
    { w: 3, group: [['warp_wisp', 1, 2], ['dust_mole', 0, 1]] },
    { w: 3, group: [['dust_mole', 2, 3]] },
    { w: 2, group: [['sun_ram', 1, 1], ['warp_wisp', 1, 1]] },
    { w: 1, group: [['chrono_knight', 1, 1], ['warp_wisp', 0, 1]] },
    { w: 1, group: [[GOLD_MOLE, 1, 1], ['dust_mole', 0, 1]] },
  ],
  t6_road_low: [
    { w: 4, group: [['crab_star', 1, 1], ['twin_star', 0, 1]] },
    { w: 3, group: [['toki_owl', 1, 2], ['twin_star', 0, 1]] },
    { w: 3, group: [['dust_drake', 1, 1], ['toki_owl', 0, 1]] },
    { w: 2, group: [['twin_star', 1, 2]] },
    { w: 2, group: [['star_wolf', 1, 1], ['sun_ram', 1, 1]] },
    { w: 1, group: [[SHADOW_WOLF, 1, 1], ['toki_owl', 0, 1]] },
    { w: 1, group: [[DARK_DRAKE, 1, 1], ['twin_star', 0, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['showMon', id] → ['battle', id] と 使う。docs/plan-ch6.md の 12-1 の 名前の 約束）
//   曲 boss6 は A が 作った。勝つと 台本が つづく。負けた ときは 今までの ボスと おなじ（loseOk なし）
export const FIXED_ROAD = {
  star_eater: { group: [['star_eater', 1, 1]], bg: 'hoshimichi', bgm: 'boss6', canFlee: false, boss: true },
  pendula: { group: [['pendula', 1, 1]], bg: 'hoshimichi_deep', bgm: 'boss6', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch6-road-bg.js）
export const ZONE_BG_ROAD = { t6_road_up: 'hoshimichi', t6_road_low: 'hoshimichi_deep' };
