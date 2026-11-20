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
import { C9A_LINE } from '../maps/c9a-flags.js?v=c14a906fd512';

// ───── 第3部の 章の すすみかた（STORY_STEPS の c8_solitus の うしろ。plan-part3.md の 9-4 の 名前の 約束）─────
// 第1幕: c9_festival → c9_night → c9_starfall → c9_child → c9_trio → c9_stairs → c9_b1 → c9_b2 → c9_b3 → c9_trial → c9_fork → c9_act1
// 第2幕からは うしろに 足す（CH9_STEPS.push(...)）
export const CH9_STEPS = [...C9A_LINE];

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

// ───── 第2部 クリアの 目標の 文の 入れかえ（plan-part3.md の 8-1・9-5 の 0）─────
// ★ 幕を つなぐ 時に かえるのは ここだけ（false … 今の まま「第2部　完！…」/ true … 第3部の はじまり）
export const PART3_OPEN = false;
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

// ───── 目標の 文の 表の わく（A班が 幕の 目標を 足す。今は から）─────
// すすみぐあい（progress.js の PROGRESS の さいご）: [フラグ か (c) => 真偽, 目標の 文]
export const CH9_PROGRESS = [];
// 行き先（quest-targets.js）: { [目標の 文]: [{ npc } か { map, x, y }] }
export const CH9_OBJECTIVE_TARGETS = {};
// 仲間の ひとこと（party-talk.js）: { [目標の 文]: { self, bold, kind, kid } }
export const CH9_OBJECTIVE_TALK = {};

// ───── story.js から: だいほんを まぜる（今は 何も つながない）─────
// A班は ここで 第1幕の だいほん（data/story-c9a.js の applyCh9a）を よぶ。パーティー全員で 見る イベントは STORY_SCRIPTS に 足す
export function applyCh9(SCRIPTS, STORY_SCRIPTS) {
  void SCRIPTS;
  void STORY_SCRIPTS;
}
