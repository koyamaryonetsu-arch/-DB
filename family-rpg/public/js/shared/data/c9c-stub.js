// ※※ これは かり。A・B を 合わせる 時に 消す ※※（第92回 A班 … 第3部 第1章 第3幕「さかさのピラミッド」の かりの 戦い。docs/plan-part3.md の 11-6）
// A（世界と 物語）が B（戦いと 品）の 物を 待たずに 幕を 通して ためす ための かりの 中み。
// ゲームの 本体からは つながない（import するのは テストと 係の 手元の 作業だけ。test/ch9-act3-a.test.js が 見はる）。
//   ・かりの 決まった 戦い c9c_riddle（ナゾカケ）・c9c_trio2（ヒックリカエール2号）… 今 いる 弱い 魔物。勝てば 先へ 進む
//   ・かりの 魔物の 出る 表 t9c_river・t9c_pyr・t9c_pyr2 … 第2幕の 表
//   ・かりの だいじな 物 note_mi（星の音・ミ）
//   どれも B の 本物が あれば 上がき しない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { ITEMS } from './items.js';
import { C9C_BATTLE, C9C_TABLE, NOTE_MI } from '../maps/c9c-flags.js';

export const C9C_STUB = true;
const fill = (to, add) => { for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v; };

fill(FIXED_ENCOUNTERS, {
  [C9C_BATTLE.riddle]: { group: [['tsunousagi', 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true },
  [C9C_BATTLE.trio2]: { group: [['tsunousagi', 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true },
});
fill(ENCOUNTER_TABLES, {
  [C9C_TABLE.river]: ENCOUNTER_TABLES.t9b_light,
  [C9C_TABLE.pyr]: ENCOUNTER_TABLES.t9b_hall,
  [C9C_TABLE.pyr2]: ENCOUNTER_TABLES.t9b_shaft,
});
fill(ITEMS, {
  [NOTE_MI]: { id: NOTE_MI, name: '星の音・ミ', type: 'key', price: 0, desc: 'さかさのピラミッドの音の間で見つけた、黄色い星の音。' },
});
