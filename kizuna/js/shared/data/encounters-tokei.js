// 第2部 第6章 Step 5「止まった時計塔」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch6.md の 15）
//   t6_tower_low … 時計塔 1〜5階（千年前だけ。おすすめ Lv64〜66）。3階の 休み所・5階の 中ボスの 間は 魔物が 出ない（A の マップ）
// 新しい 絵の 魔物は 3しゅ（ころがり歯車・びっくりばねばこ・キラー）。のこりは 時のいせきの からくりの 魔物の
// 色ちがい「ぜんまい〇〇」（variants.js の 'clock'。真ちゅう色・体が かたい・雷に 少し 弱い）
import { registerVariant } from './variants.js?v=7033f2971814';

// 色ちがい（data/variants.js）: ぜんまいじかけ 4しゅ と、まれに 出る ゴールドころがり歯車（お金が 多い）
export const TOKEI_VARIANTS = [
  registerVariant('chrono_knight', 'clock'), registerVariant('clock_spider', 'clock'), registerVariant('pendulum_bat', 'clock'),
  registerVariant('gear_beetle', 'clock'), registerVariant('cog_roller', 'gold'),
];
const [W_KNIGHT, W_SPIDER, W_BAT, W_BEETLE, GOLD_COG] = TOKEI_VARIANTS;

export const ENCOUNTERS_TOKEI = {
  t6_tower_low: [
    { w: 4, group: [['cog_roller', 1, 2], ['spring_box', 0, 1]] },
    { w: 3, group: [['killer', 1, 2], ['spring_box', 0, 1]] },
    { w: 3, group: [['spring_box', 1, 2], [W_SPIDER, 0, 1]] },
    { w: 3, group: [[W_KNIGHT, 1, 1], ['cog_roller', 0, 1]] },
    { w: 2, group: [[W_BEETLE, 1, 1], ['killer', 0, 1], ['cog_roller', 0, 1]] },
    { w: 2, group: [[W_BAT, 1, 2], [W_SPIDER, 0, 1]] },
    { w: 1, group: [[GOLD_COG, 1, 1], ['cog_roller', 0, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['showMon', 'carillon'] → ['battle', 'carillon'] と 使う。docs/plan-ch6.md の 15）
//   曲 boss6（A）・背景 tokei（render/ch6-tokei-bg.js）。勝つと 台本が つづく（c6_bell）。負けた ときは 今までの ボスと おなじ（loseOk なし）
export const FIXED_TOKEI = {
  carillon: { group: [['carillon', 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景
export const ZONE_BG_TOKEI = { t6_tower_low: 'tokei' };
