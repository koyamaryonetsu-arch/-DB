// 第3部 第3章「星の海」第3幕「はかりの回ろうと、ふたつの光」の フラグ・マップの ID・名前の 約束（第103回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19）。フラグ・id は セーブに のこるので かえない（19-5 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本の 線（STORY_STEPS。c11_act2 の うしろ）に 入るのは C11C_LINE。階を 通った しるし（c11c_h1〜h3）も 線の 中
// ※ アルゴルが 今 立って いる 台は セーブしない（サーバーの メモ。階に 入り直すと はじめの 所）

// ───── 物語の すすみぐあい ─────
export const C11C = {
  start: 'c11c_start', // 月の都（おもて）の 名前の 塔の 前で、アルゴルが 屋根から 下りた（題の 画面を 見た。幕が 始まった）
  mecha: 'c11c_mecha', // 3人組の メカ 3号（中ボス）に 勝った
  join: 'c11c_join', // アルゴルが いっしょに 行く（3人組は うらの 町で るす番）
  h1: 'c11c_h1', // はかりの 回ろう 1階を 通った
  h2: 'c11c_h2', // 2階を 通った
  rest: 'c11c_rest', // ひと休みの 部屋で アルゴルの 話を 聞いた
  h3: 'c11c_h3', // 3階を 通った（大とびらの 前へ）
  ace: 'c11c_ace', // 大とびらの 前で、近衛の 隊長（幕の ボス）に 勝った
  act3: 'c11_act3', // 幕の クリア
};
// 第3章 第2幕 クリア（幕が 始まる 条件）
export const C11C_ACT0 = 'c11_act2';
// 一本の 線
export const C11C_LINE = [C11C.start, C11C.mecha, C11C.join, C11C.h1, C11C.h2, C11C.rest, C11C.h3, C11C.ace, C11C.act3];
// 階を 通った しるし（1〜3階。線の 中）
export const C11C_FLOOR_FLAGS = { 1: C11C.h1, 2: C11C.h2, 3: C11C.h3 };

// ───── マップの ID ─────
export const C11C_MAP = {
  hall1: 'c11c_hall1', // はかりの 回ろう 1階（きほん）
  hall2: 'c11c_hall2', // 2階（スピカの 光の 橋）
  rest: 'c11c_rest', // ひと休みの 部屋（2階と 3階の 間。回復）
  hall3: 'c11c_hall3', // 3階（見はりの カード。2つを 合わせた 短い 階）
  door: 'c11c_door', // 王宮の 大とびらの 前（幕の ボス）
};
export const C11C_MAP_IDS = Object.values(C11C_MAP);
// かげの 台と 光の さくの ある 階（1〜3階）
export const C11C_HALL_MAPS = [C11C_MAP.hall1, C11C_MAP.hall2, C11C_MAP.hall3];
// 前の 幕の マップ（フラグで 出る 物を 足す 所）
export const C11C_FRONT = 'c11b_front'; // 月の都・おもて（名前の 塔の 前に アルゴルと 3人組）
export const C11C_BACK = 'c11b_back'; // 月の都・うら（おくに 回ろうへの 戸。3人組の るす番）

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C11C_BATTLE = { mecha: 'c11c_mecha', ace: 'c11c_ace' };
// 魔物の id（先頭 c11c_）・ボスの id（B班が 決める。下は かりの id … 台本は ここを 読む）
export const C11C_MON_PREFIX = 'c11c_';
export const C11C_BOSS_MON = { mecha: 'c11c_mhead', arm: 'c11c_marm', leg: 'c11c_mleg', ace: 'c11c_ace', guard: 'c11c_guard' };
// 名前（台本・目標・ヒントは ここを 読む。B班の monsters-c11c.js と 同じ 字）
export const C11C_MECHA_NAME = 'バラバラン3号'; // 中ボス（3人組の メカ 3号）
export const C11C_ACE_NAME = '近衛の隊長エース'; // 幕の ボス（カードの よろいの 隊長）
export const C11C_ACE_SHORT = 'エース';
// 魔物の 表（B班。data/encounters-c11c.js）。表が ない 間は 魔物が 出ない（'safe:wait'）。回ろうの 1〜3階で 階ごとに 出る
export const C11C_TABLE = { 1: 't11c_hall1', 2: 't11c_hall2', 3: 't11c_hall3' };
// 戦いの 背景（B班の 背景の id。回ろう・名前の 塔の 前・大とびらの 前）
export const C11C_BG = { hall: 'c11c_hall', tower: 'c11c_tower', door: 'c11c_door' };

// ───── 宝箱の id（B班が 中みを 決める。★5 は 3つ）─────
export const C11C_CHEST_IDS = ['c11c_c1', 'c11c_c2', 'c11c_c3', 'c11c_c4', 'c11c_c5', 'c11c_c6', 'c11c_c7', 'c11c_c8'];

// ───── コマンド（B班）─────
export const C11C_CMD_EAT = 'c11ceat'; // アルゴルにたのむ

// ───── 曲の id（F班。client/audio-c11c.js）─────
export const C11C_TRACKS = {
  hall: 'c11c_hall', // はかりの 回ろう（画面の 状態 pairStage … アルゴルが 台に 立って いる 間 1）
  rest: 'c11c_rest', // ひと休み・アルゴルの 話（しずか）
  join: 'c11c_join', // アルゴルが いっしょに（短い）
  mecha: 'c11c_mecha', // 中ボス（3人組の 曲の 3つめ）
  ace: 'c11c_ace', // 幕の ボス（きちんと した 行進）
  door: 'c11c_door', // 大とびらが 開く（短い）
};
export const C11C_TRACK_IDS = Object.values(C11C_TRACKS);
// 画面の 状態（F班の 曲）: field.pairStage（0 … アルゴルが 台に いない・1 … 台に 立って いる。前の 幕の sideStage と 同じ 形）
export const C11C_PAIR_MAX = 1;

// ───── タイルの 番号（shared/tiles.js の T に A が C11C_ で 足す）。701〜740 を この 幕に とって おく ─────
export const C11C_TILE_FIRST = 701;
export const C11C_TILE_LAST = 740;

// ───── アルゴル（フィールドの 絵は 今 ある 少年の 絵）─────
export const C11C_ALGOL_SPRITE = 'algol';
export const C11C_ALGOL_NAME = 'アルゴル';

// ───── 3人組（前の 幕までと 同じ 名前・絵）─────
export const C11C_TRIO = { boss: 'キラジョ', mecha: 'ボヤッチ', power: 'ズラッカ' };
export const C11C_TRIO_SPRITES = { boss: 'c9a_kirajo', mecha: 'c9a_boyacchi', power: 'c9a_zurakka' };

// ───── 助け（3人組の 声）: 同じ 階で この 歩数 歩いても すすまないと、次の 台を 光らせる ─────
export const C11C_HELP_STEPS = 80;

// ───── すすめ Lv（19-4）─────
export const C11C_LV = { hall: 123, mecha: 123, ace: 124 };

// ───── 幕の 切りかえ ─────
export const C11C_OPEN = 'PART3_C11C_OPEN'; // data/story-c11.js

// ───── B班の かりの 置き場（data/c11c-names-b.js。合わせた 時に 消した）に あった 名前（同じ 物。B の ファイルが as で 読む）─────
export const C11C_B = {
  act2: C11C_ACT0, start: C11C.start, mecha: C11C.mecha, join: C11C.join, h1: C11C.h1, h2: C11C.h2, rest: C11C.rest, h3: C11C.h3,
  ace: C11C.ace, act3: C11C.act3,
};
export const C11C_MAP_B = { hall1: C11C_MAP.hall1, hall2: C11C_MAP.hall2, hall3: C11C_MAP.hall3, rest: C11C_MAP.rest, door: C11C_MAP.door };
export const C11C_BATTLE_B = { ...C11C_BATTLE };
export const C11C_MON_PREFIX_B = C11C_MON_PREFIX;
export const C11C_CHEST_IDS_B = [...C11C_CHEST_IDS];
export const C11C_CMD_B = C11C_CMD_EAT;
export const C11C_TRACKS_B = { ...C11C_TRACKS };
export const C11C_OPEN_B = C11C_OPEN;
