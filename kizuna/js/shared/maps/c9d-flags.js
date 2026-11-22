// 第3部 第1章「おちてきた星の子」第4幕「星のはかば」の フラグ・マップの ID・名前の 約束（第93回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12）。フラグ・id は セーブに のこるので かえない（12-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う

// ───── 物語の すすみぐあい（一本の 線。data/story-c9.js の CH9_STEPS の c9_act3 の うしろ）─────
export const C9D = {
  song1: 'c9_song1', // 黄の 台で スピカが 歌った（幕が 始まった。題の 画面を 見た。スピカの「星のうた」が 使える）
  door: 'c9_door', // ひびきの とびらが 開いた（ピラミッドの 岸）
  g2: 'c9_g2', // ふたごの道 2階に 着いた
  grave: 'c9_grave', // 星のはかばに 着いた
  mu: 'c9_mu', // あそびたい魔人に 勝った（幕の ボス）
  hollow: 'c9_hollow', // 大きな くぼみを 見た
  act4: 'c9_act4', // 第4幕 クリア（第1章 クリア）
};
// 第3幕 クリア（幕が 始まる 条件）
export const C9D_ACT3 = 'c9_act3';
// 一本の 線の じゅん（この じゅんで CH9_STEPS に ならぶ）
export const C9D_LINE = ['song1', 'door', 'g2', 'grave', 'mu', 'hollow', 'act4'].map((k) => C9D[k]);

// ───── ひびきの石の 組（2つ 同時に 鳴ると 橋か とびらが 開く。一度 開くと 開いた まま）─────
// echo1 … ひびきの とびら（ピラミッドの 岸。れんしゅう）/ echo2・echo3 … ふたごの道 1階 / echo4・echo5 … 2階（echo5 は こだま。石 3つ）
export const C9D_ECHO = ['c9_echo1', 'c9_echo2', 'c9_echo3', 'c9_echo4', 'c9_echo5'];

// ───── マップの ID（先頭 c9d_）─────
export const C9D_MAP = {
  g1: 'c9d_g1', // ふたごの道 1階
  g2: 'c9d_g2', // ふたごの道 2階
  grave: 'c9d_grave', // 星のはかば
};
export const C9D_MAP_IDS = Object.values(C9D_MAP);
export const C9D_LANE_MAPS = [C9D_MAP.g1, C9D_MAP.g2]; // スピカと ふた手に 分かれる マップ

// ───── 決まった 戦い（台本は ['showMon', id] → ['battle', id]）─────
export const C9D_BATTLE = { mu: 'c9d_mu' };
// 魔物の id（先頭 c9d_）
export const C9D_MON_PREFIX = 'c9d_';
export const C9D_BOSS_MON = { mu: 'c9d_mu', mumu: 'c9d_mumu' }; // ボス・分かれた 方
export const C9D_MU_NAME = 'ムウ'; // あそびたい魔人
export const C9D_MUMU_NAME = 'ムウムウ'; // 分かれた 方

// ───── 魔物の 出る 表（B班の data/encounters-c9d.js）─────
export const C9D_TABLE = { lane: 't9d_lane', lane2: 't9d_lane2' }; // lane … 1階・lane2 … 2階

// ───── 宝箱の id（B班が 中みを 決める）─────
export const C9D_CHEST_IDS = ['c9d_c1', 'c9d_c2', 'c9d_c3', 'c9d_c4', 'c9d_c5', 'c9d_c6', 'c9d_c7', 'c9d_c8'];

// ───── 曲の id（F班。client/audio-c9d.js）─────
export const C9D_TRACKS = {
  lane: 'c9d_lane', // ふたごの道（apartStage 0 いっしょ・1 はなれて いる）
  grave: 'c9d_grave', // 星のはかば
  mu: 'c9d_mu', // 魔人
  song: 'c9d_song', // スピカの歌（songStage 1〜7）
  end: 'c9d_end', // 第1章の おわり
};
export const C9D_TRACK_IDS = Object.values(C9D_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C9D_ で 足す）。471〜490 を この 幕に とって おく ─────
export const C9D_TILE_FIRST = 471;
export const C9D_TILE_LAST = 490;

// ───── しくみの 数（12-2）─────
export const C9D_SPICA_LIGHT = 5; // スピカの 明かり（まわり 5マス。音を 1つ 手に 入れて 少し 広がった）
export const C9D_APART_LIGHT = 1.5; // スピカから はなれた 人の 見える はんい（1マス半）
export const C9D_FORK_SECONDS = 20; // 星の音さで 鳴らした ひびきの石が 鳴る 秒
export const C9D_MOSS_STEPS = 40; // 光る こけ（ふむと 40歩 光る。第2幕と 同じ）
export const C9D_SONG_SKILL = 'c9_song1'; // スピカの「星のうた」が 使える 条件（フラグ）
export const C9D_SONG_STAGE_MAX = 7; // スピカの歌の ふしの 数

// ───── スピカの歌の 歌える ふし（songStage。F班の 曲 c9d_song）─────
// くぼ地の 音の 台に 置いた 星の音の 数。置いた しるしの フラグを ここに 足して いく（第2章・第3章で ふえる）
// 第94回 A班: 第2章 第1幕の 赤（レ）・緑（ファ）は 手に 入れた 時に ふえる（13-3 の R6・G4。台に 置くのは その あと。maps/c10a-flags.js の C10A_RED.note・C10A_GREEN.note）
export const C9D_NOTES_PLACED = ['c9_act3', 'c10_note_re', 'c10_note_fa', 'c10_note_so', 'c10_note_la', 'c10_note_si', 'c10_note_do']; // c9_act3 … 黄の 台に ミを 置いた（第95回 A班: 青の ソ・白の ラ。第97回 A班: 紫の シ。第99回 A班: 金の ド … 7ふし）
export const songStage9 = (has) => Math.max(1, Math.min(C9D_SONG_STAGE_MAX, C9D_NOTES_PLACED.filter((f) => has(f)).length));

// ───── B班の かりの 置き場（data/c9d-names-b.js。合わせた 時に 消した）に あった 名前（同じ 物）─────
export const C9D_ECHOES = C9D_ECHO;
export const C9D_OPEN = 'PART3_ACT4_OPEN'; // 幕の 切りかえ（data/story-c9.js）
