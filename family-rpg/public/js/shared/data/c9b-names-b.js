// 第3部 第1章 第2幕「鉱山の底の先」の 名前（B班が 使う 分だけ。docs/plan-part3.md の 10-4 の 表の とおり）
// A班の maps/c9b-flags.js が できるまでの かりの 置き場。合わせる 時は ここを maps/c9b-flags.js からの よびなおしに かえる（名前は かえない）
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（B班が 見る もの）
export const C9B_ACT1 = 'c9_act1'; // 第1幕 クリア … スピカの「てらす」が 出る
export const C9B_BOXES = ['c9_box1', 'c9_box2', 'c9_box3']; // 食料庫の はこ（1つに つき 大王の 戦いの はじめの 皿が 1つ へる）
// 決まった 戦い（台本は ['showMon', id] → ['battle', id]）
export const C9B_BATTLE = { king: 'c9b_king', guard1: 'c9b_guard1', guard2: 'c9b_guard2', guard3: 'c9b_guard3' };
// 魔物の id（先頭 c9b_）
export const C9B_MON_PREFIX = 'c9b_';
export const C9B_BOSS_MON = { king: 'c9b_dededon' };
// 魔物の 出る 表
export const C9B_TABLE = { shaft: 't9b_shaft', light: 't9b_light', hall: 't9b_hall' };
// マップ（背景の 名前に 使う）
export const C9B_MAP = { shaft: 'c9b_shaft', under: 'c9b_under', hall: 'c9b_hall' };
// だいじな 物
export const UNDER_RAFT = 'under_raft';
// 曲の id（F班）
export const C9B_TRACKS = { under: 'c9b_under', village: 'c9b_village', hall: 'c9b_hall', king: 'c9b_king' };
