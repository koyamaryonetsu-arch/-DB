// 第3部「ほしのね」第3章「星の海」の まとめ（第100回 A班。docs/plan-part3-c11a.md の 17）
// ※ ネタバレ注意
//
// ここに ある もの:
//   ・PART3_C11A_OPEN … 第1幕「星の船と、星座の島」を 開ける 切りかえ（B班を 取りこんで つなぐ 時に true に する）
//   ・CH11_STEPS … 第3部 第3章の 一本の 線（STORY_STEPS の さいご。c10_act4 の うしろ。すきな じゅんの 島の 明かりは 入れない）
//   ・CH11_PROGRESS・CH11_OBJECTIVE_TARGETS・CH11_OBJECTIVE_TALK … 目標の 文の 表（progress.js・quest-targets.js・party-talk.js）
//   ・applyCh11 … だいほんを まぜる 入口（story.js が よぶ）
//   ・題の 画面（c11aTitleSteps）・第2章 クリアの 目標の 文（C11A_START_OBJ。story-c10.js が 使う）
//   ・PART3_C11B_OPEN … 第2幕「月の都と、名前のランプ」を 開ける 切りかえ（第102回 A班）・第1幕 クリアの 目標の 文（act1ClearObjective）・題の 画面（c11bTitleSteps）
// story-c10.js から 読まれるので、story.js・story-c9*.js・story-c10*.js を import しない こと
import { C11A_LINE } from '../maps/c11a-flags.js?v=34af8e641519';
import { applyCh11a, CH11A_PROGRESS, CH11A_OBJECTIVE_TARGETS, CH11A_OBJECTIVE_TALK, C11A_OBJ } from './story-c11a.js?v=34af8e641519';
// 第102回 A班: 第2幕「月の都と、名前のランプ」（story-c11b.js）
import { C11B_LINE } from '../maps/c11b-flags.js?v=34af8e641519';
import { applyCh11b, CH11B_PROGRESS, CH11B_OBJECTIVE_TARGETS, CH11B_OBJECTIVE_TALK, C11B_OBJ } from './story-c11b.js?v=34af8e641519';

// ───── 第1幕「星の船と、星座の島」を 開ける 切りかえ（17-5・17-6。第100回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第2章 クリアの 目標は「第3部　第3章へ（続きはアップデートで！）」・
//   くぼ地で ガンツと 話しても 幕は 始まらない / true … 目標が「ながれ星のくぼ地で、ガンツと話そう」に かわる）
// 第101回: 開けた（もう 第2章を クリアした 人の 前の 文は 表から ぬいたので、ログインの 時に progress.js の repairObjective が なおす）
export const PART3_C11A_OPEN = true;

// ───── 第2幕「月の都と、名前のランプ」を 開ける 切りかえ（18-5・18-6。第102回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第1幕 クリアの 目標は「第3部　第3章　第2幕へ（続きはアップデートで！）」・
//   星座の門の むこうの きりは 晴れない / true … 目標が「星の船で、星座の門のむこうへ。月の都をめざそう」に かわる）
// 第102回: 開けた（もう 第1幕を クリアした 人の 前の 文は 表から ぬいたので、ログインの 時に progress.js の repairObjective が なおす）
export const PART3_C11B_OPEN = true;

// ───── 第3部 第3章の 一本の 線（STORY_STEPS の c10_act4 の うしろ）─────
// 島の 明かり（すきな じゅん）・星座の しるしは 線に 入れない。幕が 閉じて いる 間も 線には 入れて おく（フラグが ない ので かわらない）
// 第102回 A班: 第2幕の 線（とびら・ランプの しるしは 入れない）
export const CH11_STEPS = [...C11A_LINE, ...C11B_LINE];

// ───── 題の 画面（17-2 の 場面 0）─────
export const C11_TITLE = {
  chapter: '第3章　星の海',
  act: '第1幕　星の船と、星座の島',
};
export const c11aTitleSteps = () => [['chapter', C11_TITLE.chapter, C11_TITLE.act]];
// 第2幕（18-2 の 場面 0）
export const C11B_TITLE = { chapter: C11_TITLE.chapter, act: '第2幕　月の都と、名前のランプ' };
export const c11bTitleSteps = () => [['chapter', C11B_TITLE.chapter, C11B_TITLE.act]];

// ───── 第2章 クリア（c10_act4）の 目標の 文（story-c10.js が 使う。開いた あとは「ながれ星のくぼ地で、ガンツと話そう」）─────
export const C11A_START_OBJ = C11A_OBJ.start;
// 第1幕 クリア（c11_act1）の 目標の 文（第2幕が 開いた あとは「星の船で、星座の門のむこうへ。月の都をめざそう」）。
//   開いた あとは 前の 文「第3部　第3章　第2幕へ（続きはアップデートで！）」を 表から ぬく（ログインの 時に repairObjective が なおす。第102回 A班）
export const act1ClearObjective = (open = PART3_C11B_OPEN) => (open ? C11B_OBJ.start : C11A_OBJ.act1);
const dropOld1 = (open) => (t) => !(open && t === C11A_OBJ.act1);
const pick = (obj, keep) => Object.fromEntries(Object.entries(obj).filter(([k]) => keep(k)));

// ───── 目標の 文の 表（幕が 開いて いる 時だけ まぜる）─────
const OPEN_A = PART3_C11A_OPEN, OPEN_B = OPEN_A && PART3_C11B_OPEN;
export const CH11_PROGRESS = [
  ...(OPEN_A ? CH11A_PROGRESS.filter(([, t]) => dropOld1(OPEN_B)(t)) : []),
  ...(OPEN_B ? CH11B_PROGRESS : []),
];
export const CH11_OBJECTIVE_TARGETS = { ...(OPEN_A ? pick(CH11A_OBJECTIVE_TARGETS, dropOld1(OPEN_B)) : {}), ...(OPEN_B ? CH11B_OBJECTIVE_TARGETS : {}) };
export const CH11_OBJECTIVE_TALK = { ...(OPEN_A ? pick(CH11A_OBJECTIVE_TALK, dropOld1(OPEN_B)) : {}), ...(OPEN_B ? CH11B_OBJECTIVE_TALK : {}) };

// ───── story.js から: だいほんを まぜる（幕が 開いて いない 間は、くぼ地で ガンツと 話しても 始まらない）─────
export function applyCh11(SCRIPTS, STORY_SCRIPTS) {
  applyCh11a(SCRIPTS, STORY_SCRIPTS, { title: c11aTitleSteps, open: PART3_C11A_OPEN, act1Obj: act1ClearObjective(), act2Open: OPEN_B });
  // 第102回 A班: 第2幕（PART3_C11B_OPEN が false の 間は、星座の門の むこうの きりが 晴れない）
  applyCh11b(SCRIPTS, STORY_SCRIPTS, { title: c11bTitleSteps, open: OPEN_B });
}
