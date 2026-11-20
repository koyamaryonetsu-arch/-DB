// 第3部 第1章 第1幕「星ふるえの夜」（A: 世界と 物語）の マップを まとめる（maps/index.js の buildMaps で まぜる）
// ※ ネタバレ注意（docs/plan-part3.md の 9）
// ・maps/c9a-forest.js … 星ふるえの森 c9a_forest・ながれ星のくぼ地 c9a_crater
// ・maps/c9a-cave.js … 星の石の地下道 c9a_b1〜c9a_b4（光の輪。形は maps/c9a-rows.js、光の 計算は maps/c9a-light.js）
// ・maps/c9a-field.js … 今の ミドリナ地方の ホシフル村・星見の丘・ささやきの森の 入口に たす もの
// ・maps/c9a-flags.js … フラグ・マップの ID（9-4 の 名前の 約束。Z班）
import { buildC9aCaves, C9A_CAVE_IDS } from './c9a-cave.js';
import { buildC9aForest, buildC9aCrater } from './c9a-forest.js';
import { attachC9aField } from './c9a-field.js';
import { C9A_MAP, C9A_MAP_IDS, C9A_TABLE } from './c9a-flags.js';
import { ENCOUNTER_TABLES } from '../data/encounters.js';

// 第3部 第1章 第1幕の マップの ID（セーブに のこるので かえない）
export const CH9A_MAPS = [...C9A_MAP_IDS];
export { C9A_CAVE_IDS };

// 魔物の 出る 表の かり（B班の data/encounters-c9a.js に その 表が ない 間だけ。第8章 第4幕の 表）
export const C9A_TABLE_FALLBACK = { [C9A_TABLE.forest]: 't8r_wing', [C9A_TABLE.cave]: 't8r_last', [C9A_TABLE.deep]: 't8r_last' };

export const c9aTableOf = (zone) => (ENCOUNTER_TABLES[zone] ? zone : C9A_TABLE_FALLBACK[zone] || zone);

export function attachC9a(maps) {
  maps[C9A_MAP.forest] = buildC9aForest(maps.overworld);
  maps[C9A_MAP.crater] = buildC9aCrater();
  Object.assign(maps, buildC9aCaves());
  for (const id of [C9A_MAP.forest, ...C9A_CAVE_IDS]) maps[id].tableFor = (zone) => c9aTableOf(zone);
  attachC9aField(maps);
}
