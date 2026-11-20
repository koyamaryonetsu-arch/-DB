// ※※ これは かり。A・B を 合わせる 時に 消す ※※（第91回 A班 … 第3部 第1章 第2幕「鉱山の底の先」の かりの 戦い。docs/plan-part3.md の 10-5）
// A（世界と 物語）が B（戦いと 品）の 物を 待たずに 幕を 通して ためす ための かりの 中み。
// ゲームの 本体からは つながない（import するのは テストと 係の 手元の 作業だけ。test/ch9-act2-a.test.js が 見はる）。
//   ・かりの 決まった 戦い c9b_king（デデドン大王）・c9b_guard1〜3（もぐら兵）… 今 いる 弱い 魔物。勝てば 先へ 進む
//   ・かりの 魔物の 出る 表 t9b_shaft・t9b_light・t9b_hall … 第1幕の 表（大地の下は くらやみ虫〈darkOnly〉の いる 表）
//   ・かりの だいじな 物 under_raft（いかだ）
//   どれも B の 本物が あれば 上がき しない
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from './encounters.js';
import { ITEMS } from './items.js';
import { C9B_BATTLE, C9B_TABLE, UNDER_RAFT } from '../maps/c9b-flags.js';

export const C9B_STUB = true;
const fill = (to, add) => { for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v; };

fill(FIXED_ENCOUNTERS, {
  [C9B_BATTLE.king]: { group: [['tsunousagi', 1, 1]], bg: 'cave_boss', bgm: 'boss', canFlee: false, boss: true },
  [C9B_BATTLE.guard1]: { group: [['pururin', 2, 2]], bg: 'cave', bgm: 'battle', canFlee: false },
  [C9B_BATTLE.guard2]: { group: [['pururin', 2, 2]], bg: 'cave', bgm: 'battle', canFlee: false },
  [C9B_BATTLE.guard3]: { group: [['pururin', 3, 3]], bg: 'cave', bgm: 'battle', canFlee: false },
});
fill(ENCOUNTER_TABLES, {
  [C9B_TABLE.shaft]: ENCOUNTER_TABLES.t9a_b2,
  [C9B_TABLE.light]: ENCOUNTER_TABLES.t9a_b3,
  [C9B_TABLE.hall]: ENCOUNTER_TABLES.t9a_b1,
});
fill(ITEMS, {
  [UNDER_RAFT]: { id: UNDER_RAFT, name: 'いかだ', type: 'key', price: 0, desc: 'ヒカリゴケの里の村長にもらった、川を下るいかだ。' },
});
