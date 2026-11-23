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
import { C10A_LINE } from '../maps/c10a-flags.js?v=efa1b5f542af';
import { applyCh10a, CH10A_PROGRESS, CH10A_OBJECTIVE_TARGETS, CH10A_OBJECTIVE_TALK, C10A_OBJ } from './story-c10a.js?v=efa1b5f542af';
// 第95回 A班: 第2幕「青と白」（story-c10b.js）
import { C10B_LINE } from '../maps/c10b-flags.js?v=efa1b5f542af';
import { applyCh10b, CH10B_PROGRESS, CH10B_OBJECTIVE_TARGETS, CH10B_OBJECTIVE_TALK, C10B_OBJ } from './story-c10b.js?v=efa1b5f542af';
// 第97回 A班: 第3幕「紫と、うばわれた音」（story-c10c.js）
import { C10C_LINE } from '../maps/c10c-flags.js?v=efa1b5f542af';
import { applyCh10c, CH10C_PROGRESS, CH10C_OBJECTIVE_TARGETS, CH10C_OBJECTIVE_TALK, C10C_OBJ } from './story-c10c.js?v=efa1b5f542af';
// 第99回 A班: 第4幕「金の音と、星の橋」（story-c10d.js）
import { C10D_LINE } from '../maps/c10d-flags.js?v=efa1b5f542af';
import { applyCh10d, CH10D_PROGRESS, CH10D_OBJECTIVE_TARGETS, CH10D_OBJECTIVE_TALK, C10D_OBJ } from './story-c10d.js?v=efa1b5f542af';
// 第100回 A班: 第3章 第1幕が 開くと、第2章 クリアの 目標が「ながれ星のくぼ地で、ガンツと話そう」（story-c11.js）
import { PART3_C11A_OPEN, C11A_START_OBJ } from './story-c11.js?v=efa1b5f542af';

// ───── 第1幕「赤と緑」を 開ける 切りかえ（13-6・13-7。第94回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に かえるのは ここだけ（false … 今の まま。第1章 クリアの 目標は「第3部　第2章へ（続きはアップデートで！）」・
//   くぼ地で 星の音さを 鳴らしても 幕は 始まらない / true … 目標が「ながれ星のくぼ地で、星の音さを鳴らそう」に かわる）
export const PART3_C10A_OPEN = true;

// ───── 第2幕「青と白」を 開ける 切りかえ（14-4・14-5。第95回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第1幕 クリアの 目標は 今の 文・
//   くぼ地で 星の音さを 鳴らしても 第2幕は 始まらない）
export const PART3_C10B_OPEN = true;

// ───── 第3幕「紫と、うばわれた音」を 開ける 切りかえ（15-4・15-5。第97回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第2幕 クリアの 目標は 今の 文・
//   くぼ地で 星の音さを 鳴らしても 第3幕は 始まらない）
export const PART3_C10C_OPEN = true;

// ───── 第4幕「金の音と、星の橋」を 開ける 切りかえ（16-4・16-5。第99回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に true に する（false … 今の まま。第3幕 クリアの 目標は 今の 文・
//   くぼ地で 星の音さを 鳴らしても 第4幕は 始まらない）
export const PART3_C10D_OPEN = true;

// ───── 第3部 第2章の 一本の 線（STORY_STEPS の c9_act4 の うしろ）─────
// 赤・緑の フラグは 線に 入れない（すきな じゅん。maps/c10a-flags.js）
// 第95回 A班: 第2幕の はじめと おわり（青・白の フラグは 線に 入れない）
// 第97回 A班: 第3幕は 一本道（ぜんぶ 線に 入る。幕が 閉じて いる 間も 線には 入れて おく … フラグが ない ので かわらない）
// 第99回 A班: 第4幕も 一本道（ぜんぶ 線に 入る。いずみの しるしは 入れない。幕が 閉じて いる 間も 線には 入れて おく）
export const CH10_STEPS = [...C10A_LINE, ...C10B_LINE, ...C10C_LINE, ...C10D_LINE];

// ───── 題の 画面（13-3 の 場面 0）─────
export const C10_TITLE = {
  chapter: '第2章　七つの星の音',
  act: '第1幕　赤と緑',
};
export const c10TitleSteps = () => [['chapter', C10_TITLE.chapter, C10_TITLE.act]];
// 第2幕の 題（14-1 の 場面 0）
export const C10B_TITLE = { chapter: C10_TITLE.chapter, act: '第2幕　青と白' };
export const c10bTitleSteps = () => [['chapter', C10B_TITLE.chapter, C10B_TITLE.act]];
// 第3幕の 題（15-1 の 場面 0）
export const C10C_TITLE = { chapter: C10_TITLE.chapter, act: '第3幕　むらさきと、うばわれた音' };
export const c10cTitleSteps = () => [['chapter', C10C_TITLE.chapter, C10C_TITLE.act]];
// 第4幕の 題（16-1 の 場面 0）
export const C10D_TITLE = { chapter: C10_TITLE.chapter, act: '第4幕　金の音と、星の橋' };
export const c10dTitleSteps = () => [['chapter', C10D_TITLE.chapter, C10D_TITLE.act]];

// ───── 第1章 クリア（c9_act4）の 目標の 文（story-c9.js が 使う。開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）─────
export const C10A_START_OBJ = C10A_OBJ.start;

// ───── 目標の 文の 表（幕が 開いて いる 時だけ まぜる）─────
// 第1幕 クリア（c10_act1）の 目標の 文（第2幕が 開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）。
//   開いた あとは 前の 文「第3部　第2章　第2幕へ（続きはアップデートで！）」を 表から ぬく（知らない 文に なり、すすみぐあいから なおる）
export const act1ClearObjective = (open = PART3_C10B_OPEN) => (open ? C10B_OBJ.start : C10A_OBJ.act1);
const dropOld = (open) => (t) => !(open && t === C10A_OBJ.act1);
// 第2幕 クリア（c10_act2）の 目標の 文（第3幕が 開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）。
//   開いた あとは 前の 文「第3部　第2章　第3幕へ（続きはアップデートで！）」を 表から ぬく（第97回 A班）
export const act2ClearObjective = (open = PART3_C10C_OPEN) => (open ? C10C_OBJ.start : C10B_OBJ.act2);
const dropOld2 = (open) => (t) => !(open && t === C10B_OBJ.act2);
// 第3幕 クリア（c10_act3）の 目標の 文（第4幕が 開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」）。
//   開いた あとは 前の 文「第3部　第2章　第4幕へ（続きはアップデートで！）」を 表から ぬく（第99回 A班）
export const act3ClearObjective = (open = PART3_C10D_OPEN) => (open ? C10D_OBJ.start : C10C_OBJ.act3);
const dropOld3 = (open) => (t) => !(open && t === C10C_OBJ.act3);
// 第2章 クリア（c10_act4）の 目標の 文（第3章 第1幕が 開いた あとは「ながれ星のくぼ地で、ガンツと話そう」）。
//   開いた あとは 前の 文「第3部　第3章へ（続きはアップデートで！）」を 表から ぬく（第100回 A班）
export const act4ClearObjective = (open = PART3_C11A_OPEN) => (open ? C11A_START_OBJ : C10D_OBJ.act4);
const dropOld4 = (open) => (t) => !(open && t === C10D_OBJ.act4);
const OPEN_A = PART3_C10A_OPEN, OPEN_B = OPEN_A && PART3_C10B_OPEN, OPEN_C = OPEN_B && PART3_C10C_OPEN, OPEN_D = OPEN_C && PART3_C10D_OPEN;
const pick = (obj, keep) => Object.fromEntries(Object.entries(obj).filter(([k]) => keep(k)));
export const CH10_PROGRESS = [
  ...(OPEN_A ? CH10A_PROGRESS.filter(([, t]) => dropOld(PART3_C10B_OPEN)(t)) : []),
  ...(OPEN_B ? CH10B_PROGRESS.filter(([, t]) => dropOld2(OPEN_C)(t)) : []),
  ...(OPEN_C ? CH10C_PROGRESS.filter(([, t]) => dropOld3(OPEN_D)(t)) : []),
  ...(OPEN_D ? CH10D_PROGRESS.filter(([, t]) => dropOld4(OPEN_D && PART3_C11A_OPEN)(t)) : []),
];
export const CH10_OBJECTIVE_TARGETS = {
  ...(OPEN_A ? pick(CH10A_OBJECTIVE_TARGETS, dropOld(PART3_C10B_OPEN)) : {}),
  ...(OPEN_B ? pick(CH10B_OBJECTIVE_TARGETS, dropOld2(OPEN_C)) : {}),
  ...(OPEN_C ? pick(CH10C_OBJECTIVE_TARGETS, dropOld3(OPEN_D)) : {}),
  ...(OPEN_D ? pick(CH10D_OBJECTIVE_TARGETS, dropOld4(OPEN_D && PART3_C11A_OPEN)) : {}),
};
export const CH10_OBJECTIVE_TALK = {
  ...(OPEN_A ? pick(CH10A_OBJECTIVE_TALK, dropOld(PART3_C10B_OPEN)) : {}),
  ...(OPEN_B ? pick(CH10B_OBJECTIVE_TALK, dropOld2(OPEN_C)) : {}),
  ...(OPEN_C ? pick(CH10C_OBJECTIVE_TALK, dropOld3(OPEN_D)) : {}),
  ...(OPEN_D ? pick(CH10D_OBJECTIVE_TALK, dropOld4(OPEN_D && PART3_C11A_OPEN)) : {}),
};

// ───── story.js から: だいほんを まぜる（幕が 開いて いない 間は、くぼ地で 音さを 鳴らしても 始まらない）─────
export function applyCh10(SCRIPTS, STORY_SCRIPTS) {
  applyCh10a(SCRIPTS, STORY_SCRIPTS, { title: c10TitleSteps, open: PART3_C10A_OPEN, act1Obj: act1ClearObjective() });
  applyCh10b(SCRIPTS, STORY_SCRIPTS, { title: c10bTitleSteps, open: OPEN_B, act2Obj: act2ClearObjective() });
  applyCh10c(SCRIPTS, STORY_SCRIPTS, { title: c10cTitleSteps, open: OPEN_C, act3Obj: act3ClearObjective() });
  applyCh10d(SCRIPTS, STORY_SCRIPTS, { title: c10dTitleSteps, open: OPEN_D, act4Obj: act4ClearObjective() });
}
