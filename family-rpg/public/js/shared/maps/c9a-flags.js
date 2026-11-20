// 第3部「ほしのね」第1章「おちてきた星の子」第1幕「星ふるえの夜」の フラグ・マップの ID・名前の 約束（第90回 Z班 … 下じき）
// ※ ネタバレ注意（docs/plan-part3.md の 9）。フラグ・id は セーブに のこるので かえない（9-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）・D（いらいと より道）の 係は、ここの 名前を 使う

// ───── 物語の すすみぐあい（一本の 線。data/story-c9.js の CH9_STEPS。STORY_STEPS の c8_solitus の うしろ）─────
export const C9A = {
  festival: 'c9_festival', // 幕が 始まった（1年ぶりの 星祭りの 朝。題の 画面を 見た）
  night: 'c9_night', // したく 3つが 終わり 夜
  starfall: 'c9_starfall', // 星ふるえ（ながれ星が 北東の 森へ）
  child: 'c9_child', // 星の子と 会った
  trio: 'c9_trio', // 3人組に 勝った（中ボス）
  stairs: 'c9_stairs', // 守り星の石の 南に 階段が 出た
  b1: 'c9_b1', // 地下1階の とびらが 開いた
  b2: 'c9_b2', // 地下2階の とびらが 開いた
  b3: 'c9_b3', // 地下3階の とびらが 開いた
  trial: 'c9_trial', // ともしびの ためしに 勝った（幕の ボス）
  fork: 'c9_fork', // 星の音さを 手に 入れた
  act1: 'c9_act1', // 第1幕 クリア
};
// 一本の 線の じゅん（この じゅんで CH9_STEPS に ならぶ）
export const C9A_LINE = ['festival', 'night', 'starfall', 'child', 'trio', 'stairs', 'b1', 'b2', 'b3', 'trial', 'fork', 'act1'].map((k) => C9A[k]);

// ───── 小さな フラグ（一本の 線では ない。どれから でも）─────
export const C9A_PREP = { flower: 'c9_prep_flower', lamp: 'c9_prep_lamp', story: 'c9_prep_story' }; // ホシミばあちゃんの たのみ 3つ
export const C9A_LAMPS = ['c9_lamp1', 'c9_lamp2', 'c9_lamp3', 'c9_lamp4']; // 広場の ちょうちん 4つ
export const C9A_SECRETS = ['c9_secret1', 'c9_secret2']; // ひみつの 部屋（地下2階 … 先生の 流れ・地下3階 … 炎術士の 流れ）

// ───── マップの ID（先頭 c9a_）─────
export const C9A_MAP = {
  forest: 'c9a_forest', // 星ふるえの森
  crater: 'c9a_crater', // ながれ星のくぼ地
  b1: 'c9a_b1', // 星の石の地下道 地下1階
  b2: 'c9a_b2',
  b3: 'c9a_b3',
  b4: 'c9a_b4', // 地下4階（井戸への 近道・回復の いずみ・ためしの とびら）
};
export const C9A_MAP_IDS = Object.values(C9A_MAP);
export const c9aCaveId = (n) => `c9a_b${n}`; // 地下道 n 階（1〜4）
export const C9A_CAVE_FLOORS = 4;

// ───── 決まった 戦い（台本は ['showMon', id] → ['battle', id]）─────
export const C9A_BATTLE = { trio: 'c9a_trio', trial: 'c9a_trial' };
// 魔物の id（先頭 c9a_）。ボス 2つ
export const C9A_MON_PREFIX = 'c9a_';
export const C9A_BOSS_MON = { trio: 'c9a_suitoru', trial: 'c9a_hoshimori' };

// ───── 星の子・だいじな 物 ─────
export const SPICA = 'spica'; // 星の子の id（名前が かわっても id は この まま）
export const SPICA_NAME = 'スピカ';
export const STAR_FORK = 'star_fork'; // 星の音さ

// ───── 曲の id（F班が 作る。今は まだ ない）─────
export const C9A_TRACKS = {
  festival: 'c9a_festival', // 1年後の 星祭り（今の 祭りの 曲の 編曲）
  forest: 'c9a_forest', // 星ふるえの森
  child: 'c9a_child', // 星の子
  cave: 'c9a_cave', // 星の石の地下道
  trio: 'c9a_trio', // 3人組（中ボス）
  trial: 'c9a_trial', // ともしびの ためし（幕の ボス）
};
export const C9A_TRACK_IDS = Object.values(C9A_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C9A_ で 足す）。407〜426 を この 幕に とって おく ─────
export const C9A_TILE_FIRST = 407;
export const C9A_TILE_LAST = 426;

// ───── A班（世界と 物語）が 足した 名前（第90回 A班。9-4 に ない 小さな 物。かえない）─────
// したくの 中の 小さな フラグ（したくが 終わると 消す。セーブを 小さく する）
export const C9A_FLOWERS = ['c9_flower1', 'c9_flower2', 'c9_flower3']; // 星見の丘の 星の花 3本
export const C9A_KIDS = ['c9_kid1', 'c9_kid2', 'c9_kid3']; // 勇者の 像の 話を した 子ども 3人
export const C9A_PREP_ASK = 'c9_prep_ask'; // ホシミばあちゃんに したくを たのまれた
export const C9A_SHARD_N = 5; // 星ふるえの森の 光る かけら
export const c9aShard = (k) => `c9_shard${k}`; // 光る かけらを 拾った（星の子に 会うと 消す）
export const C9A_FOREST_IN = 'c9_forest_in'; // 星ふるえの森に 入った（星の子に 会うと 消す）
export const c9aSeen = (n) => `c9_seen_b${n}`; // 地下道 n 階に 来た（はじめの ことばを 見た）
export const C9A_ROPE = 'c9_rope'; // ルカが 井戸の ひもを 下ろした（地下4階 ⇄ 村の 井戸の 近道）
export const C9A_FORK_RING = 'c9_forkring'; // くぼ地で 星の音さを 鳴らした（かくれた 宝箱が 光る。れんしゅう）
// 魔物の 出る 表（B班が data/encounters-c9a.js で 作る 名前。ない 間は maps/c9a.js の C9A_TABLE_FALLBACK を かりに 使う）
export const C9A_TABLE = { forest: 't9a_forest', cave: 't9a_cave', deep: 't9a_deep' };
// 宝箱の id（B班が 中みを 決める。maps/c9a-*.js が この 名前で 置く）
export const C9A_CHEST_IDS = {
  forest: ['c9a_f1', 'c9a_f2'],
  b1: ['c9a_b1a', 'c9a_b1b'], b2: ['c9a_b2a', 'c9a_b2b'], b3: ['c9a_b3a', 'c9a_b3b'], b4: ['c9a_b4a', 'c9a_b4b'],
  secret: ['c9a_s1', 'c9a_s2'],
  fork: 'c9a_fork1',
};
// ひみつの 部屋を 開ける 職業の 流れ（data/fq-common.js の jobLine の もと）。地下2階 … 先生・地下3階 … 炎術士
export const C9A_SECRET_ROOTS = [['elem_teacher'], ['enjutsushi']];
