// 第3部 第1章 第3幕「さかさのピラミッド」の 名前（B班が 使う 分だけ。docs/plan-part3.md の 11-5 の 表の とおり）
// A班の maps/c9c-flags.js が できるまでの かりの 置き場。合わせる 時は ここを maps/c9c-flags.js からの よびなおしに かえる（名前は かえない）
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（B班が 見る もの … 1つの 線の じゅん。セーブに のこるので かえない）
export const C9C = {
  raftGo: 'c9_raft_go', // いかだに 乗った（幕が 始まった）
  river: 'c9_river', // 川の 終わりに 着いた
  p2: 'c9_p2', // 2階に 着いた
  riddle: 'c9_riddle', // 番人に 勝った
  p3: 'c9_p3', // 3階
  p4: 'c9_p4', // 4階
  song: 'c9_song', // さかさの 歌で とびらが 開いた
  trio2: 'c9_trio2', // 3人組に 勝った
  note1: 'c9_note1', // 黄の 星の音
  act3: 'c9_act3', // 幕の クリア
};
// 第2幕 クリア（この 幕の 始まりの 条件）
export const C9C_ACT2 = 'c9_act2';
// マップ（背景の 名前に 使う）
export const C9C_MAP = { river: 'c9c_river', p1: 'c9c_p1', p2: 'c9c_p2', p3: 'c9c_p3', p4: 'c9c_p4' };
// 決まった 戦い（台本は ['showMon', id] → ['battle', id]）
export const C9C_BATTLE = { riddle: 'c9c_riddle', trio2: 'c9c_trio2' };
// 魔物の id（先頭 c9c_）
export const C9C_MON_PREFIX = 'c9c_';
export const C9C_BOSS_MON = { riddle: 'c9c_nazokake', trio2: 'c9c_hikkuri' };
// 魔物の 出る 表（川・ピラミッド 1〜2階・3〜4階）
export const C9C_TABLE = { river: 't9c_river', pyr: 't9c_pyr', pyr2: 't9c_pyr2' };
// 宝箱の id（川 c9c_r1〜r3・ピラミッド c9c_q1〜q8）
export const C9C_CHEST_IDS = {
  river: ['c9c_r1', 'c9c_r2', 'c9c_r3'],
  pyramid: ['c9c_q1', 'c9c_q2', 'c9c_q3', 'c9c_q4', 'c9c_q5', 'c9c_q6', 'c9c_q7', 'c9c_q8'],
};
// だいじな 物（星の音・ミ）
export const NOTE_MI = 'note_mi';
// 曲の id（F班）
export const C9C_TRACKS = {
  river: 'c9c_river', pyramid: 'c9c_pyramid', riddle: 'c9c_riddle', trio2: 'c9c_trio2', algol: 'c9c_algol', note: 'c9c_note',
};
