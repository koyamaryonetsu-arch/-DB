// 第5章 Step 5「星読みの里」の まわりと「ノクトの思い出の迷宮」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch5.md の 14）。昼と 夜の 区別は ない
//   t5_village     … 星読みの里の まわり（黒ずくめの追っ手・星読みフクロウ・星くずスライム。クモイ地方の 魔物も 少し）
//   t5_memory      … 思い出の迷宮 1〜3階（さびしさのゆうれい・ひとりぼっちの人形・かげぼうし）
//   t5_memory_deep … 思い出の迷宮 4〜6階（たましいすい・ひとがたの影・色ちがい。強い・経験値と お金が 多い）
// 3階の 休み所と 6階の ノクトの影の 広間は 魔物が 出ない（A の マップ）
import { registerVariant } from './variants.js?v=5c89bfcd3c09';

// 色ちがい（data/variants.js）: 深い 階の シャドウかげぼうし・ダークひとりぼっちの人形
export const HOSHIYOMI_VARIANTS = [registerVariant('kage_boushi', 'shadow'), registerVariant('lonely_doll', 'dark')];
const [SHADOW_KAGE, DARK_DOLL] = HOSHIYOMI_VARIANTS;

export const ENCOUNTERS_HOSHIYOMI = {
  t5_village: [
    { w: 4, group: [['black_agent', 1, 2], ['star_owl', 0, 1]] },
    { w: 3, group: [['star_owl', 1, 2], ['stardust_slime', 1, 1]] },
    { w: 3, group: [['stardust_slime', 2, 3]] },
    { w: 2, group: [['black_agent', 1, 1], ['stardust_slime', 1, 2]] },
    { w: 1, group: [['sky_serpent', 1, 1], ['star_owl', 1, 1]] },
    { w: 1, group: [['thunder_puff', 1, 2], ['stardust_slime', 1, 1]] },
  ],
  t5_memory: [
    { w: 4, group: [['lonely_ghost', 1, 2], ['lonely_doll', 0, 1]] },
    { w: 3, group: [['lonely_doll', 1, 2], ['kage_boushi', 1, 1]] },
    { w: 3, group: [['kage_boushi', 1, 2], ['lonely_ghost', 0, 1]] },
    { w: 2, group: [['lonely_doll', 2, 3]] },
    { w: 1, group: [['lonely_ghost', 1, 1], ['kage_boushi', 1, 1], ['lonely_doll', 1, 1]] },
  ],
  t5_memory_deep: [
    { w: 4, group: [['soul_eater', 1, 2], ['lonely_ghost', 0, 1]] },
    { w: 3, group: [['homunculus_shade', 1, 2], ['kage_boushi', 0, 1]] },
    { w: 3, group: [['soul_eater', 1, 1], ['homunculus_shade', 1, 1]] },
    { w: 2, group: [[SHADOW_KAGE, 1, 1], ['lonely_ghost', 1, 1]] },
    { w: 2, group: [[DARK_DOLL, 1, 2], ['homunculus_shade', 0, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['battle', 'nocto_shadow'] と 使う。docs/plan-ch5.md の 14 の 名前の 約束）
//   曲は A が 作る（nocto_shadow … ボス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_HOSHIYOMI = {
  nocto_shadow: { group: [['nocto_shadow', 1, 1]], bg: 'memory_deep', bgm: 'nocto_shadow', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch5-hoshiyomi-bg.js）
export const ZONE_BG_HOSHIYOMI = { t5_village: 'hoshiyomi', t5_memory: 'memory', t5_memory_deep: 'memory_deep' };
