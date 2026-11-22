// 第3部「ほしのね」第1章「おちてきた星の子」の まとめ（第90回 Z班 … 下じき。docs/plan-part3.md の 8・9）
// ※ ネタバレ注意。物語は まだ 進まない（遊ぶ 人から 見て、今の ゲームは 何も かわらない）
//
// ここに ある もの:
//   ・CH9_STEPS … 第3部 第1章の 一本の 線（STORY_STEPS の さいご。c8_solitus の うしろ）
//   ・CH9_PROGRESS・CH9_OBJECTIVE_TARGETS・CH9_OBJECTIVE_TALK … 目標の 文の 表の わく（progress.js・quest-targets.js・party-talk.js に つないで ある。今は から）
//   ・applyCh9 … だいほんを まぜる 入口（story.js が よぶ。今は 何も つながない）
//   ・題の 画面（c9TitleSteps）と、第2部 クリアの 目標の 文の 入れかえ（PART3_OPEN）
//
// 幕を つなぐ 時（A班が 第1幕を 作り終えた 時）に かえる 所は 1か所: 下の PART3_OPEN を true に する
//   → story-c8r.js の C8R_OBJ.solitus（第2部 クリアの 目標）が「ホシフル村の星祭りに行こう…」に かわり、
//     前の 文「第2部　完！第3部へ（続きはアップデートで！）」は story-c8.js の OLD_C8_OBJ.solitus に 回る
//     （今は 知らない 文に なるので、progress.js の repairObjective が すすみぐあいから 新しい 文に なおす）
//   → 仲間の ひとこと（C9_START_TALK）・行き先（C9_START_TARGETS）も 新しい 文の 物に かわる
// ほかの ファイルは 読まない（maps/c9a-flags.js だけ）。story-c8r.js から 読まれるので、story.js や story-c8*.js を import しない こと
import { C9A_LINE } from '../maps/c9a-flags.js?v=a3f1dc027cbc';
// 第1幕「星ふるえの夜」（第90回 A班。data/story-c9a.js。story-c9a.js は ここを import しない）
import { applyCh9a, CH9A_PROGRESS, CH9A_OBJECTIVE_TARGETS, CH9A_OBJECTIVE_TALK, C9A_OBJ } from './story-c9a.js?v=a3f1dc027cbc';
// 第2幕「鉱山の底の先」（第91回 A班。data/story-c9b.js。story-c9b.js は ここを import しない）
import { C9B_LINE } from '../maps/c9b-flags.js?v=a3f1dc027cbc';
import { applyCh9b, CH9B_PROGRESS, CH9B_OBJECTIVE_TARGETS, CH9B_OBJECTIVE_TALK, C9B_OBJ } from './story-c9b.js?v=a3f1dc027cbc';
// 第3幕「さかさのピラミッド」（第92回 A班。data/story-c9c.js。story-c9c.js は ここを import しない）
import { C9C_LINE } from '../maps/c9c-flags.js?v=a3f1dc027cbc';
import { applyCh9c, CH9C_PROGRESS, CH9C_OBJECTIVE_TARGETS, CH9C_OBJECTIVE_TALK, C9C_OBJ } from './story-c9c.js?v=a3f1dc027cbc';
// 第4幕「星のはかば」（第93回 A班。data/story-c9d.js。story-c9d.js は ここを import しない）
import { C9D_LINE } from '../maps/c9d-flags.js?v=a3f1dc027cbc';
import { applyCh9d, CH9D_PROGRESS, CH9D_OBJECTIVE_TARGETS, CH9D_OBJECTIVE_TALK, C9D_OBJ } from './story-c9d.js?v=a3f1dc027cbc';
// 第3部 第2章 第1幕「赤と緑」（第94回 A班。data/story-c10.js。story-c10.js は ここを import しない）
import { PART3_C10A_OPEN, C10A_START_OBJ } from './story-c10.js?v=a3f1dc027cbc';

// ───── 第3部の 章の すすみかた（STORY_STEPS の c8_solitus の うしろ。plan-part3.md の 9-4 の 名前の 約束）─────
// 第1幕: c9_festival → c9_night → c9_starfall → c9_child → c9_trio → c9_stairs → c9_b1 → c9_b2 → c9_b3 → c9_trial → c9_fork → c9_act1
// 第2幕からは うしろに 足す（CH9_STEPS.push(...)）
export const CH9_STEPS = [...C9A_LINE, ...C9B_LINE, ...C9C_LINE, ...C9D_LINE];

// ───── 題の 画面（9-1 の 場面 1。村に 入って ルカが かけて きた あと）─────
// 題「ほしのね」は 家族が きめた 名前（ひらがなの まま。kanji-check の ひらがなの 目安に 出るが それで よい）
export const C9_TITLE = {
  part: '第3部　ほしのね',
  chapter: '第1章　おちてきた星の子',
  act: '第1幕　星ふるえの夜',
};
// 台本に そのまま 入れる 形（['chapter', 上の 行, 下の 行] を 2まい）
export function c9TitleSteps() {
  return [
    ['chapter', C9_TITLE.part, C9_TITLE.chapter],
    ['chapter', C9_TITLE.chapter, C9_TITLE.act],
  ];
}
// 第2幕の 題の 画面（10-1 の 場面 1）
export const C9B_TITLE = { chapter: C9_TITLE.chapter, act: '第2幕　鉱山の底の先' };
export const c9bTitleSteps = () => [['chapter', C9B_TITLE.chapter, C9B_TITLE.act]];
// 第3幕の 題の 画面（11-1 の 場面 1）
export const C9C_TITLE = { chapter: C9_TITLE.chapter, act: '第3幕　さかさのピラミッド' };
export const c9cTitleSteps = () => [['chapter', C9C_TITLE.chapter, C9C_TITLE.act]];
// 第4幕の 題の 画面（12-1 の 場面 1）
export const C9D_TITLE = { chapter: C9_TITLE.chapter, act: '第4幕　星のはかば' };
export const c9dTitleSteps = () => [['chapter', C9D_TITLE.chapter, C9D_TITLE.act]];

// ───── 第2部 クリアの 目標の 文の 入れかえ（plan-part3.md の 8-1・9-5 の 0）─────
// ★ 幕を つなぐ 時に かえるのは ここだけ（false … 今の まま「第2部　完！…」/ true … 第3部の はじまり）
export const PART3_OPEN = true;
// 今の 第2部 クリアの 文（入れかえた あとは story-c8.js の OLD_C8_OBJ.solitus）
export const PART2_END_OBJ = '第2部　完！第3部へ（続きはアップデートで！）';
// 第3部の 目標の 文（A班が 幕の 中の 文を 足す）
export const C9_OBJ = {
  start: 'ホシフル村の星祭りに行こう（ホシミばあちゃんが呼んでいる）',
};
// 第2部 クリア（c8_solitus）の 目標の 文（story-c8r.js の C8R_OBJ.solitus が 使う）
export const part2ClearObjective = (open = PART3_OPEN) => (open ? C9_OBJ.start : PART2_END_OBJ);
// 入れかえた あとの 仲間の ひとこと（party-talk.js の 形 { self, bold, kind, kid }）と 行き先（quest-targets.js の 形）
export const C9_START_TALK = {
  self: '今日は、1年に一度の星祭りだ。ホシミばあちゃんが呼んでいる。ホシフル村へ行こう。',
  bold: '星祭りか！あれから、もう1年だな。ホシフル村へ行こうぜ！',
  kind: 'ホシフル村の星祭りですね。ホシミばあちゃんが、待っていますよ。',
  kid: 'ほしまつりだ！ホシフル村へ、いこう！',
};
export const C9_START_TARGETS = [{ npc: 'elder' }];

// ───── 第2幕「鉱山の底の先」を 開ける 切りかえ（plan-part3.md の 10-5。第91回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に かえるのは ここだけ（false … 今の まま。第1幕 クリアの 目標は「第2幕へ（続きはアップデートで！）」・
//   くぼ地で 星の音さを 鳴らしても 幕は 始まらない / true … 目標が「ながれ星のくぼ地で、星の音さを鳴らしてみよう」に かわり、前の 文は 古い 文の 表へ）
export const PART3_ACT2_OPEN = true;
// 第1幕 クリア（c9_act1）の 目標の 文（開いた あとは「ながれ星のくぼ地で、星の音さを鳴らしてみよう」。前の 文は 古い 文 ACT1_END_OLD）
export const act1ClearObjective = (open = PART3_ACT2_OPEN) => (open ? C9B_OBJ.start : C9A_OBJ.act1);
// 幕を 開けた あと、セーブに のこる 前の 文（今は 知らない 文に なるので、progress.js の repairObjective が すすみぐあいから なおす）
export const ACT1_END_OLD = C9A_OBJ.act1;
const ACT1_END = act1ClearObjective();
const swapAct1 = (k) => (k === C9A_OBJ.act1 ? ACT1_END : k);

// ───── 第3幕「さかさのピラミッド」を 開ける 切りかえ（plan-part3.md の 11-5・11-6。第92回 A班）─────
// ★ B班（戦い）・D班を 取りこんで つなぐ 時に かえるのは ここだけ（false … 今の まま。第2幕 クリアの 目標は「第3幕へ（続きはアップデートで！）」・
//   船着き場の 番人に 話しても 幕は 始まらない / true … 目標が「ヒカリゴケの里の船着き場から、いかだで川を下ろう」に かわる）
export const PART3_ACT3_OPEN = true;
// 第2幕 クリア（c9_act2）の 目標の 文（開いた あとは「ヒカリゴケの里の船着き場から、いかだで川を下ろう」。前の 文は 古い 文 ACT2_END_OLD）
export const act2ClearObjective = (open = PART3_ACT3_OPEN) => (open ? C9C_OBJ.start : C9B_OBJ.act2);
export const ACT2_END_OLD = C9B_OBJ.act2;
const ACT2_END = act2ClearObjective();
const swapAct2 = (k) => (k === C9B_OBJ.act2 ? ACT2_END : k);

// ───── 第4幕「星のはかば」を 開ける 切りかえ（plan-part3-c9d.md の 12-4・12-5。第93回 A班）─────
// ★ B班（戦い）を 取りこんで つなぐ 時に かえるのは ここだけ（false … 今の まま。第3幕 クリアの 目標は「第4幕へ（続きはアップデートで！）」・
//   くぼ地の 黄の 台を 見ても 幕は 始まらない / true … 目標が「ながれ星のくぼ地の、黄色い音の台を見に行こう」に かわる）
export const PART3_ACT4_OPEN = true;
// 第3幕 クリア（c9_act3）の 目標の 文（開いた あとは「ながれ星のくぼ地の、黄色い音の台を見に行こう」。前の 文は 古い 文 ACT3_END_OLD）
export const act3ClearObjective = (open = PART3_ACT4_OPEN) => (open ? C9D_OBJ.start : C9C_OBJ.act3);
export const ACT3_END_OLD = C9C_OBJ.act3;
const ACT3_END = act3ClearObjective();
const swapAct3 = (k) => (k === C9C_OBJ.act3 ? ACT3_END : k);

// ───── 第3部 第2章 第1幕「赤と緑」を 開ける 切りかえ（plan-part3-c10a.md の 13-6・13-7。第94回 A班。切りかえは story-c10.js の PART3_C10A_OPEN）─────
// 第1章 クリア（c9_act4）の 目標の 文（開いた あとは「ながれ星のくぼ地で、星の音さを鳴らそう」。前の 文は 古い 文 ACT4_END_OLD）
export const act4ClearObjective = (open = PART3_C10A_OPEN) => (open ? C10A_START_OBJ : C9D_OBJ.act4);
export const ACT4_END_OLD = C9D_OBJ.act4;
const ACT4_END = act4ClearObjective();
const swapAct4 = (k) => (k === C9D_OBJ.act4 ? ACT4_END : k);

// ───── 目標の 文の 表（幕ごとに 足す。第1幕 … story-c9a.js）─────
// すすみぐあい（progress.js の PROGRESS の さいご）: [フラグ か (c) => 真偽, 目標の 文]
// 第2幕は 幕が 開いて から（PART3_ACT2_OPEN）。開くと 第1幕の さいごの 文が 第2幕の はじまりの 文に かわる
// 第3幕も 同じ（PART3_ACT3_OPEN。開くと 第2幕の さいごの 文が 第3幕の はじまりの 文に かわる）
const swapKeys = (o, sw = swapAct1) => Object.fromEntries(Object.entries(o).map(([k, v]) => [sw(k), v]));
const CH9B_PROGRESS2 = CH9B_PROGRESS.map(([f, t]) => [f, swapAct2(t)]);
export const CH9_PROGRESS = [...CH9A_PROGRESS.map(([f, t]) => [f, swapAct1(t)]), ...(PART3_ACT2_OPEN ? CH9B_PROGRESS2 : []), ...(PART3_ACT3_OPEN ? CH9C_PROGRESS.map(([f, t]) => [f, swapAct3(t)]) : []), ...(PART3_ACT4_OPEN ? CH9D_PROGRESS.map(([f, t]) => [f, swapAct4(t)]) : [])];
// 行き先（quest-targets.js）: { [目標の 文]: [{ npc } か { map, x, y }] }
export const CH9_OBJECTIVE_TARGETS = {
  ...swapKeys(CH9A_OBJECTIVE_TARGETS), ...(PART3_ACT2_OPEN ? swapKeys(CH9B_OBJECTIVE_TARGETS, swapAct2) : {}), ...(PART3_ACT3_OPEN ? swapKeys(CH9C_OBJECTIVE_TARGETS, swapAct3) : {}), ...(PART3_ACT4_OPEN ? swapKeys(CH9D_OBJECTIVE_TARGETS, swapAct4) : {}),
};
// 仲間の ひとこと（party-talk.js）: { [目標の 文]: { self, bold, kind, kid } }
export const CH9_OBJECTIVE_TALK = {
  ...swapKeys(CH9A_OBJECTIVE_TALK), ...(PART3_ACT2_OPEN ? swapKeys(CH9B_OBJECTIVE_TALK, swapAct2) : {}), ...(PART3_ACT3_OPEN ? swapKeys(CH9C_OBJECTIVE_TALK, swapAct3) : {}), ...(PART3_ACT4_OPEN ? swapKeys(CH9D_OBJECTIVE_TALK, swapAct4) : {}),
};

// ───── story.js から: だいほんを まぜる ─────
// 第1幕の だいほん（data/story-c9a.js の applyCh9a）。パーティー全員で 見る イベントは STORY_SCRIPTS に 足す。題の 画面は c9TitleSteps
export function applyCh9(SCRIPTS, STORY_SCRIPTS) {
  applyCh9a(SCRIPTS, STORY_SCRIPTS, { title: c9TitleSteps, act1End: ACT1_END });
  // 第2幕（幕が 開いて いない 間は、くぼ地で 音さを 鳴らしても 始まらない）
  applyCh9b(SCRIPTS, STORY_SCRIPTS, { title: c9bTitleSteps, open: PART3_ACT2_OPEN, act2End: ACT2_END });
  // 第3幕（幕が 開いて いない 間は、船着き場の 番人に 話しても 始まらない）
  applyCh9c(SCRIPTS, STORY_SCRIPTS, { title: c9cTitleSteps, open: PART3_ACT3_OPEN, act3End: ACT3_END });
  // 第4幕（幕が 開いて いない 間は、くぼ地の 黄の 台の 前に 来ても 始まらない）
  applyCh9d(SCRIPTS, STORY_SCRIPTS, { title: c9dTitleSteps, open: PART3_ACT4_OPEN, act4End: ACT4_END });
}
