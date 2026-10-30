// 第6章 Step 1〜4（A: 世界と物語）の マップを まとめる（maps/index.js の attachCh6 から）
// ・maps/past.js … 千年前の ミドリナ地方（overworld_past）と 今の ミドリナ地方に たす もの
// ・maps/toki-shrine.js … 時のほこら（toki_shrine_1f〜3f）
// ・maps/toki-ruin.js … 時のいせき（今 toki_ruin_1f〜7f・千年前 toki_ruin_1f_past〜7f_past・番人の間 toki_ruin_boss）
// ・maps/hoshimichi.js … Step 3・4: 星読みの社（千年前の 森のひろば）と 星めぐりの古道（今 hoshimichi_1f〜8f・千年前 hoshimichi_1f_past〜8f_past）
// ・maps/ch6-side.js … Step 3・4: 第6章の より道（時のタイムカプセル・千年前のレシピ・ちびアステルのたからもの）の 人と 場所
// ・maps/tokei.js … Step 5: 千年前の 北の 山の 止まった時計塔（tokei_1f〜5f）・灰色の 森・今の 星の塔の かべ画と 時の すきま
// ・maps/ch6c-side.js … Step 5: より道「トキネの砂時計のかざり」（12こ）
// ・maps/tokei-high.js … Step 6: 止まった時計塔の 6〜10階・てっぺん（tokei_6f〜10f・tokei_top）・今の 星の塔 6階の 時の すきま・泉の里の リオン
import { attachPast, PAST_MAPS, PAST_POS, PAST_ID } from './past.js?v=cc4d7c14aec3';
import { buildShrineMaps, SHRINE_MAPS } from './toki-shrine.js?v=cc4d7c14aec3';
import { buildRuinMaps, RUIN_MAPS } from './toki-ruin.js?v=cc4d7c14aec3';
import { buildHoshimichiMaps, HM_MAPS, attachShaPast, attachShaNow } from './hoshimichi.js?v=cc4d7c14aec3';
import { attachCh6Side } from './ch6-side.js?v=cc4d7c14aec3';
import { buildTokeiMaps, TK_MAPS, attachTokeiPast, attachTokeiNow } from './tokei.js?v=cc4d7c14aec3';
import { attachCh6cSide } from './ch6c-side.js?v=cc4d7c14aec3';
import { buildTokeiHighMaps, TH_MAPS, attachTokeiHigh } from './tokei-high.js?v=cc4d7c14aec3';

// 第6章 Step 1・2 の マップの ID（セーブに のこるので かえない）
export const CH6_MAPS = [...PAST_MAPS, ...SHRINE_MAPS, ...RUIN_MAPS];
// 第6章 Step 3・4 の マップの ID
export const CH6B_MAPS = [...HM_MAPS];
// 第6章 Step 5 の マップの ID
export const CH6C_MAPS = [...TK_MAPS];
// 第6章 Step 6 の マップの ID
export const CH6D_MAPS = [...TH_MAPS];

export function attachCh6(maps) {
  attachPast(maps);
  Object.assign(maps, buildShrineMaps(PAST_POS.shrineOut));
  Object.assign(maps, buildRuinMaps());
  // Step 3・4: 星読みの社・古道の 入口（今と 千年前）・星めぐりの古道
  attachShaPast(maps[PAST_ID]);
  attachShaNow(maps.overworld);
  Object.assign(maps, buildHoshimichiMaps());
  attachCh6Side(maps);
  // Step 5: 止まった時計塔（千年前の 北の 山）・今の 星の塔の かべ画と 時の すきま・トキネの砂時計のかざり
  Object.assign(maps, buildTokeiMaps());
  attachTokeiPast(maps[PAST_ID]);
  attachTokeiNow(maps);
  attachCh6cSide(maps);
  // Step 6: 止まった時計塔の 6〜10階・てっぺん・今の 星の塔 6階の 時の すきま
  Object.assign(maps, buildTokeiHighMaps());
  attachTokeiHigh(maps);
}
