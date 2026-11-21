// 第3部 第1章 第4幕「星のはかば」の 名前（B班が 使う 分だけ。docs/plan-part3-c9d.md の 12-4 の 表の とおり）
// A班の maps/c9d-flags.js が できるまでの かりの 置き場。合わせる 時は ここを maps/c9d-flags.js からの よびなおしに かえる（名前は かえない）
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（1つの 線の じゅん。セーブに のこるので かえない）
export const C9D = {
  song1: 'c9_song1', // 黄の 台で 歌った・幕が 始まった（スピカの「星のうた」が 使える）
  door: 'c9_door', // ひびきの とびら
  g2: 'c9_g2', // 2階
  grave: 'c9_grave', // はかばに 着いた
  mu: 'c9_mu', // 魔人に 勝った
  hollow: 'c9_hollow', // 大きな くぼみ
  act4: 'c9_act4', // 幕と 第1章の クリア
};
// 第3幕 クリア（この 幕の 始まりの 条件）
export const C9D_ACT3 = 'c9_act3';
// ひびきの石の 組
export const C9D_ECHOES = ['c9_echo1', 'c9_echo2', 'c9_echo3', 'c9_echo4', 'c9_echo5'];
// マップ
export const C9D_MAP = { g1: 'c9d_g1', g2: 'c9d_g2', grave: 'c9d_grave' };
// 決まった 戦い（台本は ['showMon', 'c9d_mu'] → ['battle', 'c9d_mu']）
export const C9D_BATTLE = { mu: 'c9d_mu' };
// 魔物の id（先頭 c9d_）
export const C9D_MON_PREFIX = 'c9d_';
export const C9D_BOSS_MON = { mu: 'c9d_mu', mumu: 'c9d_mumu' };
// 魔物の 出る 表（ふたごの道 1階・2階）
export const C9D_TABLE = { lane: 't9d_lane', lane2: 't9d_lane2' };
// 宝箱の id
export const C9D_CHEST_IDS = ['c9d_c1', 'c9d_c2', 'c9d_c3', 'c9d_c4', 'c9d_c5', 'c9d_c6', 'c9d_c7', 'c9d_c8'];
// 曲の id（F班）
export const C9D_TRACKS = { lane: 'c9d_lane', grave: 'c9d_grave', mu: 'c9d_mu', song: 'c9d_song', end: 'c9d_end' };
// 幕の 切りかえ（data/story-c9.js。A班）
export const C9D_OPEN = 'PART3_ACT4_OPEN';
