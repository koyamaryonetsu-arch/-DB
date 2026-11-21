// ※※ これは かり。A・B を 合わせる 時に 消す ※※（第94回 A班 … 第3部 第2章 第1幕「赤と緑」の かりの 戦い。docs/plan-part3-c10a.md の 13-7）
// A（世界と 物語）が B（戦いと 品）の 物を 待たずに 幕を 通して ためす ための かりの 中み。
// ゲームの 本体からは つながない（import するのは テストと 係の 手元の 作業だけ。test/ch10-act1-a.test.js が 見はる）。
//   ・かりの 決まった 戦い c10r_boss（科学者）・c10g_boss（だんしゃく）… 今 いる 魔物。勝てば 先へ 進む
//   ・かりの 魔物の 出る 表 t10r_1・t10r_2・t10g_1・t10g_2 … 第1章の 表
//   ・かりの だいじな 物 note_re・note_fa
//   どれも B の 本物が あれば 上がき しない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { ITEMS } from './items.js';
import { C10A_BATTLE, C10A_TABLE, C10A_TRACKS, NOTE_RE, NOTE_FA } from '../maps/c10a-flags.js';

export const C10A_STUB = true;
const fill = (to, add) => { for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v; };

fill(FIXED_ENCOUNTERS, {
  [C10A_BATTLE.red]: { group: [['c9c_golem', 1, 1]], bg: 'c9c_pyramid', bgm: C10A_TRACKS.redBoss, canFlee: false, boss: true },
  [C10A_BATTLE.green]: { group: [['c9c_golem', 1, 1]], bg: 'c9c_pyramid', bgm: C10A_TRACKS.greenBoss, canFlee: false, boss: true },
});
fill(ENCOUNTER_TABLES, {
  [C10A_TABLE.r1]: ENCOUNTER_TABLES.t9c_pyr,
  [C10A_TABLE.r2]: ENCOUNTER_TABLES.t9c_pyr2,
  [C10A_TABLE.g1]: ENCOUNTER_TABLES.t9d_lane,
  [C10A_TABLE.g2]: ENCOUNTER_TABLES.t9d_lane2,
});
fill(ITEMS, {
  [NOTE_RE]: { id: NOTE_RE, name: '星の音（レ）', type: 'key', desc: 'かり' },
  [NOTE_FA]: { id: NOTE_FA, name: '星の音（ファ）', type: 'key', desc: 'かり' },
});
