// 第6章 Step 1〜4（A: 世界と物語）の マップを まとめる（maps/index.js の attachCh6 から）
// ・maps/past.js … 千年前の ミドリナ地方（overworld_past）と 今の ミドリナ地方に たす もの
// ・maps/toki-shrine.js … 時のほこら（toki_shrine_1f〜3f）
// ・maps/toki-ruin.js … 時のいせき（今 toki_ruin_1f〜7f・千年前 toki_ruin_1f_past〜7f_past・番人の間 toki_ruin_boss）
// ・maps/hoshimichi.js … Step 3・4: 星読みの社（千年前の 森のひろば）と 星めぐりの古道（今 hoshimichi_1f〜8f・千年前 hoshimichi_1f_past〜8f_past）
// ・maps/ch6-side.js … Step 3・4: 第6章の より道（時のタイムカプセル・千年前のレシピ・ちびアステルのたからもの）の 人と 場所
import { attachPast, PAST_MAPS, PAST_POS, PAST_ID } from './past.js?v=c553fc066ee8';
import { buildShrineMaps, SHRINE_MAPS } from './toki-shrine.js?v=c553fc066ee8';
import { buildRuinMaps, RUIN_MAPS } from './toki-ruin.js?v=c553fc066ee8';
import { buildHoshimichiMaps, HM_MAPS, attachShaPast, attachShaNow } from './hoshimichi.js?v=c553fc066ee8';
import { attachCh6Side } from './ch6-side.js?v=c553fc066ee8';

// 第6章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const CH6_MAPS = [...PAST_MAPS, ...SHRINE_MAPS, ...RUIN_MAPS];
// 第6章 Step 3・4 の マップの ID
export const CH6B_MAPS = [...HM_MAPS];

export function attachCh6(maps) {
  attachPast(maps);
  Object.assign(maps, buildShrineMaps(PAST_POS.shrineOut));
  Object.assign(maps, buildRuinMaps());
  // Step 3・4: 星読みの社・古道の 入口（今と 千年前）・星めぐりの古道
  attachShaPast(maps[PAST_ID]);
  attachShaNow(maps.overworld);
  Object.assign(maps, buildHoshimichiMaps());
  attachCh6Side(maps);
}
