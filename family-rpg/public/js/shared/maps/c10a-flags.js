// 第3部 第2章「七つの星の音」第1幕「赤と緑」の フラグ・マップの ID・名前の 約束（第94回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13）。フラグ・id は セーブに のこるので かえない（13-6 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ はじめての「すきな じゅん」: 赤の 道と 緑の 道は どちらを 先に しても よい。だから 一本の 線（STORY_STEPS）に 入れるのは
//   はじめ（c10_start）と おわり（c10_act1）だけ。赤・緑の フラグは 線に 入れない（入れると、片方を 立てた 時に もう 片方まで 立って しまう）

// ───── 物語の すすみぐあい（一本の 線。data/story-c10.js の CH10_STEPS。STORY_STEPS の c9_act4 の うしろ）─────
export const C10A = {
  start: 'c10_start', // 2つの 方向（くぼ地で 音さを 鳴らした・幕が 始まった。題の 画面を 見た）
  act1: 'c10_act1', // 赤と 緑の 音を 台に 置いた（幕の クリア）
};
// 第1章 クリア（幕が 始まる 条件）
export const C10A_ACT4 = 'c9_act4';
export const C10A_LINE = [C10A.start, C10A.act1];

// ───── 赤の 道（炎の山の 下の 古い 道）─────
export const C10A_RED = {
  stairs: 'c10_r_stairs', // 火口の 階段を 見た（ひえた 火口・まん中の 下り 階段）
  boss: 'c10_r_boss', // 科学者に 勝った（中ボス）
  run: 'c10_red_run', // 溶岩に 追われて にげて いる 間だけ（にげ終わると 消す）
  note: 'c10_note_re', // 赤の 音（レ）を 手に 入れた・にげ終わった
};
// ───── 緑の 道（大地の下の 根の国）─────
export const C10A_GREEN = {
  root: 'c10_g_root', // 根を のぼった（根の国に 着いた）
  boss: 'c10_g_boss', // だんしゃくに 勝った（中ボス）
  note: 'c10_note_fa', // 緑の 音（ファ）を 手に 入れた
};
// 赤・緑の 線（幕の 中の じゅん。それぞれの 中では この じゅん）
export const C10A_RED_LINE = [C10A_RED.stairs, C10A_RED.boss, C10A_RED.note];
export const C10A_GREEN_LINE = [C10A_GREEN.root, C10A_GREEN.boss, C10A_GREEN.note];

// ───── 草木・レバー・おまけ ─────
// 音の つぼみ（根の国。1つの つぼみで その あたりの 草木が まとめて のびる。1階 2つ・2階 2つ。緑の 音を 取ると 消して、のびた ままに する）
export const C10A_BUDS = ['c10_bud1', 'c10_bud2', 'c10_bud3', 'c10_bud4'];
// 古い 道の レバー（溶岩が 黒い 石に なる。行きに 引くと、帰りの 近道。1 … 1階・2・3 … 2階）
export const C10A_LEVERS = ['c10_lv1', 'c10_lv2', 'c10_lv3'];
// おまけの 部屋（先に 取った 音が、もう 片方で 役に 立つ）
export const C10A_BONUS = {
  red: 'c10_bonus_r', // 赤の 道 c10r_2 の、緑の 音で つるが のびる かべ（開いた）
  green: 'c10_bonus_g', // 緑の 道 c10g_1 の、赤の 音で 火の 花が さく 所（開いた）
};
// くぼ地の 台に 置いた（小さな フラグ。幕の クリアで 消す。クリアの あとは c10_act1 で 2つとも 光る）
export const C10A_PED = { re: 'c10_ped_re', fa: 'c10_ped_fa' };

// ───── マップの ID ─────
export const C10A_MAP = {
  r1: 'c10r_1', // 古い 道 1階（火口の 下）
  r2: 'c10r_2', // 古い 道 2階
  r3: 'c10r_3', // 熱の 間（いちばん 下）
  g1: 'c10g_1', // 根の国 1（大地の下の 西の がけの 根の 上）
  g2: 'c10g_2', // 根の国 2（おくに かれた 大木）
};
export const C10A_MAP_IDS = Object.values(C10A_MAP);
export const C10A_RED_MAPS = [C10A_MAP.r1, C10A_MAP.r2, C10A_MAP.r3];
export const C10A_GREEN_MAPS = [C10A_MAP.g1, C10A_MAP.g2];
// 溶岩に 追われる 階（下から 上へ にげる）
export const C10A_RUN_MAPS = [C10A_MAP.r2, C10A_MAP.r1];

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C10A_BATTLE = { red: 'c10r_boss', green: 'c10g_boss' };
// 魔物の id（先頭 c10r_・c10g_）
export const C10A_MON_PREFIX = { red: 'c10r_', green: 'c10g_' };
export const C10A_BOSS_MON = { red: 'c10r_tamagon', green: 'c10g_mold' };
export const C10A_RED_BOSS_NAME = 'ドクター・タマゴン'; // たまごの 形の 科学者（メカは グルグルドリル号）
export const C10A_RED_MECHA_NAME = 'グルグルドリル号';
export const C10A_GREEN_BOSS_NAME = 'カビだんしゃく　モルド'; // カビの だんしゃく（メカは カビカビ号）
export const C10A_GREEN_SHORT = 'モルド';
export const C10A_GREEN_MECHA_NAME = 'カビカビ号';

// ───── 魔物の 出る 表（B班）─────
export const C10A_TABLE = { r1: 't10r_1', r2: 't10r_2', g1: 't10g_1', g2: 't10g_2' };

// ───── 宝箱の id（B班が 中みを 決める）─────
export const C10A_CHEST_IDS = {
  red: ['c10r_c1', 'c10r_c2', 'c10r_c3', 'c10r_c4', 'c10r_c5', 'c10r_c6'],
  green: ['c10g_c1', 'c10g_c2', 'c10g_c3', 'c10g_c4', 'c10g_c5', 'c10g_c6'],
  bonus: { red: 'c10r_bonus', green: 'c10g_bonus' },
};
export const C10A_CHEST_ALL = [...C10A_CHEST_IDS.red, ...C10A_CHEST_IDS.green, C10A_CHEST_IDS.bonus.red, C10A_CHEST_IDS.bonus.green];

// ───── だいじな 物（星の音）─────
export const NOTE_RE = 'note_re'; // 星の音・レ（赤）
export const NOTE_FA = 'note_fa'; // 星の音・ファ（緑）

// ───── 曲の id（F班。client/audio-c10a.js）─────
export const C10A_TRACKS = {
  fork: 'c10_fork', // 2つの 方向（くり返さない）
  road: 'c10r_road', // 古い 道（c10r_1〜3）
  run: 'c10r_run', // かけ上がる 帰り道（lavaStage 0〜3）
  redBoss: 'c10r_boss', // 科学者
  roots: 'c10g_roots', // 根の国（c10g_1・c10g_2）
  greenBoss: 'c10g_boss', // だんしゃく
};
export const C10A_TRACK_IDS = Object.values(C10A_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C10A_ で 足す）。491〜520 を この 幕に とって おく ─────
export const C10A_TILE_FIRST = 491;
export const C10A_TILE_LAST = 520;

// ───── しくみの 数（13-4）─────
export const C10A_LAVA_MS = 3000; // 溶岩が 1だん 上がる 間（3びょう）
export const C10A_LAVA_SLOW_MS = 5000; // 3回 追いつかれた あと（小さい 子の ため）
export const C10A_LAVA_SLOW_AFTER = 3; // この 回数 追いつかれると おそく なる
export const C10A_LAVA_GAP_MIN = 10; // 歩きつづければ 溶岩と この だん いじょう 開く（テストの めやす）
// 画面の 状態 lavaStage（0〜3。F班の 曲 c10r_run）: 溶岩まで 10だん いじょう → 0・7〜9 → 1・4〜6 → 2・3 いか → 3
export const lavaStageOfGap = (gap) => (gap >= 10 ? 0 : gap >= 7 ? 1 : gap >= 4 ? 2 : 3);

// ───── すすめ Lv（13-1）─────
export const C10A_LV = { red: 105, green: 107 };

// ───── 幕の 切りかえ ─────
export const C10A_OPEN = 'PART3_C10A_OPEN'; // data/story-c10.js

// ───── B班の かりの 置き場（data/c10a-names-b.js。合わせた 時に 消した）に あった 形（同じ 名前・同じ 値。B の ファイルは as で よぶ）─────
export const C10A_B = {
  start: C10A.start, rStairs: C10A_RED.stairs, rBoss: C10A_RED.boss, redRun: C10A_RED.run, noteRe: C10A_RED.note,
  gRoot: C10A_GREEN.root, gBoss: C10A_GREEN.boss, noteFa: C10A_GREEN.note, act1: C10A.act1,
};
export const C10A_BONUS_B = { r: C10A_BONUS.red, g: C10A_BONUS.green };
export const C10A_CHEST_IDS_B = { red: C10A_CHEST_IDS.red, green: C10A_CHEST_IDS.green, bonus: [C10A_CHEST_IDS.bonus.red, C10A_CHEST_IDS.bonus.green] };
export const C10A_NOTES = { re: NOTE_RE, fa: NOTE_FA };
