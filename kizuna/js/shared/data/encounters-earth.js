// 第5章 Step 6・7「根の島」と「大地の神殿」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch5.md の 16）。昼と 夜の 区別は ない
//   t5_root      … 根の島（根っこのこびと。クモイ地方・星読みの里の まわりの 魔物も 少し）
//   t5_earth_up  … 大地の神殿 1〜4階（天空のまもり兵・根っこのこびと。しずみゆく島の 神殿の 岩の 魔物も）
//   t5_earth_low … 5〜8階（大地のダンゴムシ・かおのない影・天空のまもり兵・色ちがい。強い・経験値と お金が 多い）
// 5階の 休み所と 8階の ノクトの 祭だんは 魔物が 出ない（A の マップ）
import { registerVariant } from './variants.js?v=31a32b16dd7b';

// 色ちがい（data/variants.js）: 深い 階の ダーク天空のまもり兵・レッド大地のダンゴムシ・ゴールド根っこのこびと（めったに 出ない。お金が 多い）
export const EARTH_VARIANTS = [registerVariant('sky_guard', 'dark'), registerVariant('earth_pillbug', 'red'), registerVariant('root_sprite', 'gold')];
const [DARK_GUARD, RED_PILLBUG, GOLD_SPRITE] = EARTH_VARIANTS;

export const ENCOUNTERS_EARTH = {
  t5_root: [
    { w: 4, group: [['root_sprite', 1, 2], ['star_owl', 0, 1]] },
    { w: 3, group: [['root_sprite', 2, 3]] },
    { w: 3, group: [['sky_ray', 1, 1], ['root_sprite', 1, 1]] },
    { w: 2, group: [['stardust_slime', 1, 2], ['root_sprite', 1, 1]] },
    { w: 2, group: [['cloud_sheep', 1, 2], ['thunder_puff', 0, 1]] },
  ],
  t5_earth_up: [
    { w: 4, group: [['sky_guard', 1, 1], ['root_sprite', 1, 2]] },
    { w: 3, group: [['sky_guard', 1, 2]] },
    { w: 3, group: [['root_sprite', 2, 3]] },
    { w: 2, group: [['stone_keeper', 1, 1], ['sky_guard', 1, 1]] },
    { w: 2, group: [['rock_mole', 1, 2], ['root_sprite', 1, 1]] },
  ],
  t5_earth_low: [
    { w: 4, group: [['earth_pillbug', 1, 1], ['sky_guard', 0, 1]] },
    { w: 3, group: [['faceless_shade', 1, 1], ['root_sprite', 0, 1]] },
    { w: 3, group: [['earth_pillbug', 1, 1], ['faceless_shade', 1, 1]] },
    { w: 2, group: [['sky_guard', 1, 1], ['faceless_shade', 1, 1]] },
    { w: 2, group: [[DARK_GUARD, 1, 1], ['earth_pillbug', 0, 1]] },
    { w: 2, group: [[RED_PILLBUG, 1, 1], ['root_sprite', 0, 1]] },
    { w: 1, group: [[GOLD_SPRITE, 1, 1], ['root_sprite', 1, 2]] },
  ],
};

// きまった 戦い（A が 台本で ['battle', 'nocto_1'] と 使う。docs/plan-ch5.md の 16 の 名前の 約束）
//   曲は A が 作る（nocto_1 … ボス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   HPが 半分に なると 戦いは 勝ちで 終わる（battle-earth.js）。負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_EARTH = {
  nocto_1: { group: [['nocto_1', 1, 1]], bg: 'earth_temple_deep', bgm: 'nocto_1', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch5-earth-bg.js）
export const ZONE_BG_EARTH = { t5_root: 'root_isle', t5_earth_up: 'earth_temple', t5_earth_low: 'earth_temple_deep' };
