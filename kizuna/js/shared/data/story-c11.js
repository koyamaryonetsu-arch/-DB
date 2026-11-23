// 第3部「ほしのね」第3章「星の海」の まとめ（第100回 A班。docs/plan-part3-c11a.md の 17）
// ※ ネタバレ注意
//
// ここに ある もの:
//   ・PART3_C11A_OPEN … 第1幕「星の船と、星座の島」を 開ける 切りかえ（B班を 取りこんで つなぐ 時に true に する）
//   ・CH11_STEPS … 第3部 第3章の 一本の 線（STORY_STEPS の さいご。c10_act4 の うしろ。すきな じゅんの 島の 明かりは 入れない）
//   ・CH11_PROGRESS・CH11_OBJECTIVE_TARGETS・CH11_OBJECTIVE_TALK … 目標の 文の 表（progress.js・quest-targets.js・party-talk.js）
//   ・applyCh11 … だいほんを まぜる 入口（story.js が よぶ）
//   ・題の 画面（c11aTitleSteps）・第2章 クリアの 目標の 文（C11A_START_OBJ。story-c10.js が 使う）
// story-c10.js から 読まれるので、story.js・story-c9*.js・story-c10*.js を import しない こと
import { C11A_LINE } from '../maps/c11a-flags.js?v=6a7817ffa6c0';
import { applyCh11a, CH11A_PROGRESS, CH11A_OBJECTIVE_TARGETS, CH11A_OBJECTIVE_TALK, C11A_OBJ } from './story-c11a.js?v=6a7817ffa6c0';

// ───── 第1幕「星の船と、星座の島」を 開ける 切りかえ（17-5・17-6。第100回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第2章 クリアの 目標は「第3部　第3章へ（続きはアップデートで！）」・
//   くぼ地で ガンツと 話しても 幕は 始まらない / true … 目標が「ながれ星のくぼ地で、ガンツと話そう」に かわる）
// 第101回: 開けた（もう 第2章を クリアした 人の 前の 文は 表から ぬいたので、ログインの 時に progress.js の repairObjective が なおす）
export const PART3_C11A_OPEN = true;

// ───── 第3部 第3章の 一本の 線（STORY_STEPS の c10_act4 の うしろ）─────
// 島の 明かり（すきな じゅん）・星座の しるしは 線に 入れない。幕が 閉じて いる 間も 線には 入れて おく（フラグが ない ので かわらない）
export const CH11_STEPS = [...C11A_LINE];

// ───── 題の 画面（17-2 の 場面 0）─────
export const C11_TITLE = {
  chapter: '第3章　星の海',
  act: '第1幕　星の船と、星座の島',
};
export const c11aTitleSteps = () => [['chapter', C11_TITLE.chapter, C11_TITLE.act]];

// ───── 第2章 クリア（c10_act4）の 目標の 文（story-c10.js が 使う。開いた あとは「ながれ星のくぼ地で、ガンツと話そう」）─────
export const C11A_START_OBJ = C11A_OBJ.start;

// ───── 目標の 文の 表（幕が 開いて いる 時だけ まぜる）─────
const OPEN_A = PART3_C11A_OPEN;
export const CH11_PROGRESS = [...(OPEN_A ? CH11A_PROGRESS : [])];
export const CH11_OBJECTIVE_TARGETS = { ...(OPEN_A ? CH11A_OBJECTIVE_TARGETS : {}) };
export const CH11_OBJECTIVE_TALK = { ...(OPEN_A ? CH11A_OBJECTIVE_TALK : {}) };

// ───── story.js から: だいほんを まぜる（幕が 開いて いない 間は、くぼ地で ガンツと 話しても 始まらない）─────
export function applyCh11(SCRIPTS, STORY_SCRIPTS) {
  applyCh11a(SCRIPTS, STORY_SCRIPTS, { title: c11aTitleSteps, open: PART3_C11A_OPEN });
}
