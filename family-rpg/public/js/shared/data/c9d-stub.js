// ※※ これは かり。A・B を 合わせる 時に 消す ※※（第93回 A班 … 第3部 第1章 第4幕「星のはかば」の かりの 戦い。docs/plan-part3-c9d.md の 12-5）
// A（世界と 物語）が B（戦いと 品）の 物を 待たずに 幕を 通して ためす ための かりの 中み。
// ゲームの 本体からは つながない（import するのは テストと 係の 手元の 作業だけ。test/ch9-act4-a.test.js が 見はる）。
//   ・かりの 決まった 戦い c9d_mu（あそびたい魔人）… 今 いる 魔物。勝てば 先へ 進む
//   ・かりの 魔物の 出る 表 t9d_lane・t9d_lane2 … 第3幕の ピラミッドの 表
//   どれも B の 本物が あれば 上がき しない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { C9D_BATTLE, C9D_TABLE, C9D_TRACKS } from '../maps/c9d-flags.js';

export const C9D_STUB = true;
const fill = (to, add) => { for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v; };

fill(FIXED_ENCOUNTERS, {
  [C9D_BATTLE.mu]: { group: [['c9c_golem', 1, 1]], bg: 'c9c_pyramid', bgm: C9D_TRACKS.mu, canFlee: false, boss: true },
});
fill(ENCOUNTER_TABLES, {
  [C9D_TABLE.lane]: ENCOUNTER_TABLES.t9c_pyr,
  [C9D_TABLE.lane2]: ENCOUNTER_TABLES.t9c_pyr2,
});
