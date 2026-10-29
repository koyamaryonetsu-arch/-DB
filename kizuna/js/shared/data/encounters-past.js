// 第2部 第6章 Step 1・2 の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch6.md の 9）。昼と 夜の 区別は ない
//   t6_past_field … 千年前の ミドリナ地方（こけむしツノジカ・こはくのガ・古木のこども・ときうさぎ。根っこのこびとも 少し）
//   t6_shrine     … 時のほこら 1〜3階（砂つぶの精・砂時計サソリ・砂の番兵。ときうさぎも 少し）
//   t6_ruin_up    … 時のいせき 1〜4階（今と 千年前の 両方。歯車カブト・いにしえの番兵・ふりこコウモリ。からくりの守り手・石のガーゴイルも 少し）
//   t6_ruin_low   … 時のいせき 5〜7階（今と 千年前の 両方。ときの守り手・まきもどしのゆうれい・とけいグモ。上の 階の 魔物と 色ちがいも）
// ホシフルの里・泉の里の 中、時のいせき 4階の 休み所、番人の間は 魔物が 出ない（A の マップ）
import { registerVariant } from './variants.js?v=acb97b73a32c';

// 色ちがい（data/variants.js）: まれに 出る（経験値と お金が 多い）
export const PAST_VARIANTS = [registerVariant('toki_hare', 'gold'), registerVariant('gear_beetle', 'red'), registerVariant('chrono_knight', 'dark'), registerVariant('clock_spider', 'shadow')];
const [GOLD_HARE, RED_BEETLE, DARK_KNIGHT, SHADOW_SPIDER] = PAST_VARIANTS;

export const ENCOUNTERS_PAST = {
  t6_past_field: [
    { w: 4, group: [['moss_deer', 1, 1], ['toki_hare', 0, 1]] },
    { w: 3, group: [['amber_moth', 1, 2], ['elder_sprout', 0, 1]] },
    { w: 3, group: [['toki_hare', 2, 3]] },
    { w: 3, group: [['elder_sprout', 1, 1], ['moss_deer', 0, 1]] },
    { w: 2, group: [['amber_moth', 1, 1], ['toki_hare', 1, 1]] },
    { w: 1, group: [['root_sprite', 1, 2], ['elder_sprout', 0, 1]] },
    { w: 1, group: [[GOLD_HARE, 1, 1], ['toki_hare', 0, 1]] },
  ],
  t6_shrine: [
    { w: 4, group: [['sand_sprite', 1, 2], ['glass_scorpion', 0, 1]] },
    { w: 3, group: [['sand_golem', 1, 1], ['sand_sprite', 0, 1]] },
    { w: 3, group: [['glass_scorpion', 1, 2]] },
    { w: 2, group: [['sand_golem', 1, 1], ['glass_scorpion', 1, 1]] },
    { w: 2, group: [['sand_sprite', 2, 3]] },
    { w: 1, group: [['toki_hare', 1, 1], ['sand_sprite', 1, 1]] },
  ],
  t6_ruin_up: [
    { w: 4, group: [['gear_beetle', 1, 2], ['pendulum_bat', 0, 1]] },
    { w: 3, group: [['ruin_sentinel', 1, 1], ['gear_beetle', 0, 1]] },
    { w: 3, group: [['pendulum_bat', 2, 3]] },
    { w: 2, group: [['ruin_sentinel', 1, 1], ['pendulum_bat', 1, 1]] },
    { w: 1, group: [['clockwork_guard', 1, 2], ['stone_gargoyle', 0, 1]] },
    { w: 1, group: [[RED_BEETLE, 1, 1], ['pendulum_bat', 0, 1]] },
  ],
  t6_ruin_low: [
    { w: 4, group: [['chrono_knight', 1, 1], ['rewind_ghost', 0, 1]] },
    { w: 3, group: [['clock_spider', 1, 2], ['rewind_ghost', 0, 1]] },
    { w: 3, group: [['rewind_ghost', 1, 1], ['clock_spider', 1, 1]] },
    { w: 2, group: [['chrono_knight', 1, 1], ['gear_beetle', 1, 1]] },
    { w: 1, group: [['ruin_sentinel', 1, 1], ['clock_spider', 0, 1]] },
    { w: 1, group: [[DARK_KNIGHT, 1, 1], ['rewind_ghost', 0, 1]] },
    { w: 1, group: [[SHADOW_SPIDER, 1, 1], ['clock_spider', 0, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['showMon', id] → ['battle', id] と 使う。docs/plan-ch6.md の 9 の 名前の 約束）
//   曲 boss6 は A が 作る（まだ ない ときは 音が 鳴らないだけ。client/audio.js の play）
//   勝つと 台本が つづく。負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_PAST = {
  sand_clock: { group: [['sand_clock', 1, 1]], bg: 'toki_shrine', bgm: 'boss6', canFlee: false, boss: true },
  geardon: { group: [['geardon', 1, 1]], bg: 'toki_ruin_boss', bgm: 'boss6', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch6-past-bg.js）。いせきの 5〜7階も おなじ 背景
export const ZONE_BG_PAST = { t6_past_field: 'past_field', t6_shrine: 'toki_shrine', t6_ruin_up: 'toki_ruin', t6_ruin_low: 'toki_ruin' };
