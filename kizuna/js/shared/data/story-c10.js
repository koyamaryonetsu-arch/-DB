// 第3部「ほしのね」第2章「七つの星の音」の まとめ（第94回 A班。docs/plan-part3-c10a.md の 13）
// ※ ネタバレ注意
//
// ここに ある もの:
//   ・PART3_C10A_OPEN … 第1幕「赤と緑」を 開ける 切りかえ（B班を 取りこんで つなぐ 時に true に する）
//   ・CH10_STEPS … 第3部 第2章の 一本の 線（STORY_STEPS の さいご。c9_act4 の うしろ。すきな じゅんの 赤・緑は 入れない）
//   ・CH10_PROGRESS・CH10_OBJECTIVE_TARGETS・CH10_OBJECTIVE_TALK … 目標の 文の 表（progress.js・quest-targets.js・party-talk.js）
//   ・applyCh10 … だいほんを まぜる 入口（story.js が よぶ）
//   ・題の 画面（c10TitleSteps）・第1章 クリアの 目標の 文の 入れかえ（act4ClearObjective。story-c9.js が 使う）
// story-c9.js から 読まれるので、story.js・story-c9*.js を import しない こと
import { C10A_LINE } from '../maps/c10a-flags.js?v=c53292a2af59';
import { applyCh10a, CH10A_PROGRESS, CH10A_OBJECTIVE_TARGETS, CH10A_OBJECTIVE_TALK, C10A_OBJ } from './story-c10a.js?v=c53292a2af59';
// 第95回 A班: 第2幕「青と白」（story-c10b.js）
import { C10B_LINE } from '../maps/c10b-flags.js?v=c53292a2af59';
import { applyCh10b, CH10B_PROGRESS, CH10B_OBJECTIVE_TARGETS, CH10B_OBJECTIVE_TALK, C10B_OBJ } from './story-c10b.js?v=c53292a2af59';

// ───── 第1幕「赤と緑」を 開ける 切りかえ（13-6・13-7。第94回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に かえるのは ここだけ（false … 今の まま。第1章 クリアの 目標は「第3部　第2章へ（続きはアップデートで！）」・
//   くぼ地で 星の音さを 鳴らしても 幕は 始まらない / true … 目標が「ながれ星のくぼ地で、星の音さを鳴らそう」に かわる）
export const PART3_C10A_OPEN = true;

// ───── 第2幕「青と白」を 開ける 切りかえ（14-4・14-5。第95回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第1幕 クリアの 目標は 今の 文・
//   くぼ地で 星の音さを 鳴らしても 第2幕は 始まらない）
export const PART3_C10B_OPEN = true;

// ───── 第3部 第2章の 一本の 線（STORY_STEPS の c9_act4 の うしろ）─────
// 赤・緑の フラグは 線に 入れない（すきな じゅん。maps/c10a-flags.js）
// 第95回 A班: 第2幕の はじめと おわり（青・白の フラグは 線に 入れない）
export const CH10_STEPS = [...C10A_LINE, ...C10B_LINE];

// ───── 題の 画面（13-3 の 場面 0）─────
export const C10_TITLE = {
  chapter: '第2章　七つの星の音',
  act: '第1幕　赤と緑',
};
export const c10TitleSteps = () => [['chapter', C10_TITLE.chapter, C10_TITLE.act]];
// 第2幕の 題（14-1 の 場面 0）
export const C10B_TITLE = { chapter: C10_TITLE.chapter, act: '第2幕　青と白' };
export const c10bTitleSteps = () => [['chapter', C10B_TITLE.chapter, C10B_TITLE.act]];

// ───── 第1章 クリア（c9_act4）の 目標の 文（story-c9.js が 使う。開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）─────
export const C10A_START_OBJ = C10A_OBJ.start;

// ───── 目標の 文の 表（幕が 開いて いる 時だけ まぜる）─────
// 第1幕 クリア（c10_act1）の 目標の 文（第2幕が 開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）。
//   開いた あとは 前の 文「第3部　第2章　第2幕へ（続きはアップデートで！）」を 表から ぬく（知らない 文に なり、すすみぐあいから なおる）
export const act1ClearObjective = (open = PART3_C10B_OPEN) => (open ? C10B_OBJ.start : C10A_OBJ.act1);
const dropOld = (open) => (t) => !(open && t === C10A_OBJ.act1);
const pick = (obj, keep) => Object.fromEntries(Object.entries(obj).filter(([k]) => keep(k)));
export const CH10_PROGRESS = [
  ...(PART3_C10A_OPEN ? CH10A_PROGRESS.filter(([, t]) => dropOld(PART3_C10B_OPEN)(t)) : []),
  ...(PART3_C10A_OPEN && PART3_C10B_OPEN ? CH10B_PROGRESS : []),
];
export const CH10_OBJECTIVE_TARGETS = {
  ...(PART3_C10A_OPEN ? pick(CH10A_OBJECTIVE_TARGETS, dropOld(PART3_C10B_OPEN)) : {}),
  ...(PART3_C10A_OPEN && PART3_C10B_OPEN ? CH10B_OBJECTIVE_TARGETS : {}),
};
export const CH10_OBJECTIVE_TALK = {
  ...(PART3_C10A_OPEN ? pick(CH10A_OBJECTIVE_TALK, dropOld(PART3_C10B_OPEN)) : {}),
  ...(PART3_C10A_OPEN && PART3_C10B_OPEN ? CH10B_OBJECTIVE_TALK : {}),
};

// ───── story.js から: だいほんを まぜる（幕が 開いて いない 間は、くぼ地で 音さを 鳴らしても 始まらない）─────
export function applyCh10(SCRIPTS, STORY_SCRIPTS) {
  applyCh10a(SCRIPTS, STORY_SCRIPTS, { title: c10TitleSteps, open: PART3_C10A_OPEN, act1Obj: act1ClearObjective() });
  applyCh10b(SCRIPTS, STORY_SCRIPTS, { title: c10bTitleSteps, open: PART3_C10A_OPEN && PART3_C10B_OPEN });
}
