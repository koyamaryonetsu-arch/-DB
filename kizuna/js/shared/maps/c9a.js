// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 9）
// ・maps/c9a-forest.js … 星ふるえの森 c9a_forest・ながれ星のくぼ地 c9a_crater
// ・maps/c9a-cave.js … 星の石の地下道 c9a_b1〜c9a_b4（光の輪。形は maps/c9a-rows.js、光の 計算は maps/c9a-light.js）
// ・maps/c9a-field.js … 今の ミドリナ地方の ホシフル村・星見の丘・ささやきの森の 入口に たす もの
// ・maps/c9a-flags.js … フラグ・マップの ID（9-4 の 名前の 約束。Z班）
import { buildC9aCaves, C9A_CAVE_IDS } from './c9a-cave.js?v=36007aad9f1d';
import { buildC9aForest, buildC9aCrater } from './c9a-forest.js?v=36007aad9f1d';
import { attachC9aField } from './c9a-field.js?v=36007aad9f1d';
import { C9A_MAP, C9A_MAP_IDS } from './c9a-flags.js?v=36007aad9f1d';

// 第3部 第1章 第1幕の マップの ID（セーブに のこるので かえない）
export const CH9A_MAPS = [...C9A_MAP_IDS];
export { C9A_CAVE_IDS };

export function attachC9a(maps) {
  maps[C9A_MAP.forest] = buildC9aForest(maps.overworld);
  maps[C9A_MAP.crater] = buildC9aCrater();
  Object.assign(maps, buildC9aCaves());
  attachC9aField(maps);
}
