// 第6章 Step 1・2（A: 世界と物語）の マップを まとめる（maps/index.js の attachCh6 から）
// ・maps/past.js … 千年前の ミドリナ地方（overworld_past）と 今の ミドリナ地方に たす もの
// ・maps/toki-shrine.js … 時のほこら（toki_shrine_1f〜3f）
// ・maps/toki-ruin.js … 時のいせき（今 toki_ruin_1f〜7f・千年前 toki_ruin_1f_past〜7f_past・番人の間 toki_ruin_boss）
import { attachPast, PAST_MAPS, PAST_POS } from './past.js?v=909bdfecce1d';
import { buildShrineMaps, SHRINE_MAPS } from './toki-shrine.js?v=909bdfecce1d';
import { buildRuinMaps, RUIN_MAPS } from './toki-ruin.js?v=909bdfecce1d';

// 第6章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const CH6_MAPS = [...PAST_MAPS, ...SHRINE_MAPS, ...RUIN_MAPS];

export function attachCh6(maps) {
  attachPast(maps);
  Object.assign(maps, buildShrineMaps(PAST_POS.shrineOut));
  Object.assign(maps, buildRuinMaps());
}
