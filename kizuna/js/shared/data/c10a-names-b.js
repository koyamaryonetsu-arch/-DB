// 第3部 第2章 第1幕「赤と緑」の 名前（B班が 使う 分だけ。docs/plan-part3-c10a.md の 13-6 の 表の とおり）
// A班の maps/c10a-flags.js が できるまでの かりの 置き場。合わせる 時は ここを maps/c10a-flags.js からの よびなおしに かえる（名前は かえない）
// ほかの ファイルを 読まない（data・battle・client・tools の どこからでも 読める）

// フラグ（セーブに のこるので かえない）
export const C10A = {
  start: 'c10_start', // 2つの 方向・幕が 始まった
  // 赤
  rStairs: 'c10_r_stairs', // 火口の 階段
  rBoss: 'c10_r_boss', // 科学者に 勝った
  redRun: 'c10_red_run', // にげて いる 間だけ
  noteRe: 'c10_note_re', // 赤の 音・にげ終わった（スピカの ほのかな光 6% → 9%）
  // 緑
  gRoot: 'c10_g_root', // 根を のぼった
  gBoss: 'c10_g_boss', // だんしゃくに 勝った
  noteFa: 'c10_note_fa', // 緑の 音（スピカの てらす 4回 → 3回）
  // おわり
  act1: 'c10_act1', // 2つを 台に 置いた
};
// 第1章 クリア（この 幕の 始まりの 条件）
export const C10A_ACT4 = 'c9_act4';
// 草木・レバー・おまけ
export const C10A_LEVERS = ['c10_lv1', 'c10_lv2', 'c10_lv3'];
export const C10A_BONUS = { r: 'c10_bonus_r', g: 'c10_bonus_g' };
// マップ
export const C10A_MAP = { r1: 'c10r_1', r2: 'c10r_2', r3: 'c10r_3', g1: 'c10g_1', g2: 'c10g_2' };
// 決まった 戦い（台本は ['showMon', 'c10r_tamagon'] → ['battle', 'c10r_boss'] など）
export const C10A_BATTLE = { red: 'c10r_boss', green: 'c10g_boss' };
// 魔物の id（先頭 赤 c10r_・緑 c10g_）
export const C10A_MON_PREFIX = { red: 'c10r_', green: 'c10g_' };
export const C10A_BOSS_MON = { red: 'c10r_tamagon', green: 'c10g_mold' };
// 魔物の 出る 表
export const C10A_TABLE = { r1: 't10r_1', r2: 't10r_2', g1: 't10g_1', g2: 't10g_2' };
// 宝箱の id
export const C10A_CHEST_IDS = {
  red: ['c10r_c1', 'c10r_c2', 'c10r_c3', 'c10r_c4', 'c10r_c5', 'c10r_c6'],
  green: ['c10g_c1', 'c10g_c2', 'c10g_c3', 'c10g_c4', 'c10g_c5', 'c10g_c6'],
  bonus: ['c10r_bonus', 'c10g_bonus'],
};
// だいじな 物
export const C10A_NOTES = { re: 'note_re', fa: 'note_fa' };
// 曲の id（F班）
export const C10A_TRACKS = { fork: 'c10_fork', road: 'c10r_road', run: 'c10r_run', redBoss: 'c10r_boss', roots: 'c10g_roots', greenBoss: 'c10g_boss' };
// 幕の 切りかえ（A班）
export const C10A_OPEN = 'PART3_C10A_OPEN';
