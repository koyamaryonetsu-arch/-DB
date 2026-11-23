// 第3部 第3章「星の海」第2幕「月の都と、名前のランプ」の フラグ・マップの ID・名前の 約束（第102回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18）。フラグ・id は セーブに のこるので かえない（18-5 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本の 線（STORY_STEPS。c11_act1 の うしろ）に 入るのは C11B_LINE。とびら・ランプの しるし（C11B_MARKS）は 線に 入れない

// ───── 物語の すすみぐあい ─────
export const C11B = {
  start: 'c11b_start', // 星座の門の むこうへ（きりが 晴れた。題の 画面を 見た。幕が 始まった）
  plaza: 'c11b_plaza', // 月の都の おもての 町・名前の 広場を 見た
  back: 'c11b_back', // 月かげの 戸で うらの 町に 入った
  rule: 'c11b_rule', // うらの 町で トモシビに きまりを 聞いた
  tower: 'c11b_tower', // 名前の 塔に 入った
  keeper: 'c11b_keeper', // 塔の 上で、ランプの 番人（中ボス）に 勝った
  lamp: 'c11b_lamp', // スピカの ランプに 火が もどった
  oboro: 'c11b_oboro', // テラスで、月の むかえ オボロ（幕の ボス）に 勝った
  act2: 'c11_act2', // 幕の クリア
};
// 第3章 第1幕 クリア（幕が 始まる 条件）
export const C11B_ACT0 = 'c11_act1';
// 一本の 線
export const C11B_LINE = [C11B.start, C11B.plaza, C11B.back, C11B.rule, C11B.tower, C11B.keeper, C11B.lamp, C11B.oboro, C11B.act2];

// ───── とびら・ランプの しるし（セーブする。使う 分だけ。12こ まで）─────
//   d1〜d3 … 塔 1階の 月の 光の ゆか（ふむと うらの 同じ 場所の とびらが 開く。開いた まま。d3 は 宝箱の 小部屋）
//   d4・d5 … 塔 2階の ランプ（青・金。1つ ともすと ほかは 消える。うらの かげの 橋の 場所が かわる）
//   d6 … 塔 3階の 月の 光の ゆか / d7 … 塔 3階の ランプ（青。ともした まま）
export const C11B_MARKS = ['c11b_d1', 'c11b_d2', 'c11b_d3', 'c11b_d4', 'c11b_d5', 'c11b_d6', 'c11b_d7'];
export const C11B_MARK_MAX = 12;
// 光の ゆか（f: しるし）と ランプ（ひとくみの 中で 1つだけ ともる）
export const C11B_FLOORS = { t1: ['c11b_d1', 'c11b_d2', 'c11b_d3'], t3: ['c11b_d6'] };
export const C11B_LAMPS = { t2: ['c11b_d4', 'c11b_d5'], t3: ['c11b_d7'] };

// ───── マップの ID ─────
export const C11B_MAP = {
  front: 'c11b_front', // 月の都・おもて（宿・店 2つ・回復・名前の 広場・はかりの門）
  back: 'c11b_back', // 月の都・うら（小さな 店・回復・トモシビ）
  tower1: 'c11b_tower1', // 名前の 塔 1階・おもて
  tower2: 'c11b_tower2',
  tower3: 'c11b_tower3', // 3階・おもて（上に 番人・ランプの たな・テラス）
  towerb1: 'c11b_towerb1', // 名前の 塔 1階・うら
  towerb2: 'c11b_towerb2',
  towerb3: 'c11b_towerb3',
};
export const C11B_MAP_IDS = Object.values(C11B_MAP);
// おもてと うら（同じ 大きさ・同じ 形）の くみ
export const C11B_PAIRS = [
  [C11B_MAP.front, C11B_MAP.back],
  [C11B_MAP.tower1, C11B_MAP.towerb1],
  [C11B_MAP.tower2, C11B_MAP.towerb2],
  [C11B_MAP.tower3, C11B_MAP.towerb3],
];
export const C11B_TOWER_MAPS = [C11B_MAP.tower1, C11B_MAP.tower2, C11B_MAP.tower3, C11B_MAP.towerb1, C11B_MAP.towerb2, C11B_MAP.towerb3];
// 0 ＝ おもて・1 ＝ うら（曲の sideStage と 同じ）
export const C11B_SIDE = { front: 0, back: 1 };
// ルーラ（行った 所）の id（maps/ch2.js の SEA_PLACES に 足す）
export const C11B_PLACE = 'c11b_city';

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C11B_BATTLE = { keeper: 'c11b_keeper', oboro: 'c11b_oboro' };
// 魔物の id（先頭 c11b_）・ボスの id（名前は B班が 決める。下は かりの 名前 … 台本は ここを 読む）
export const C11B_MON_PREFIX = 'c11b_';
export const C11B_BOSS_MON = { keeper: 'c11b_keeper', oboro: 'c11b_oboro', tennin: 'c11b_tennin' };
// 名前（台本・目標・ヒントは ここを 読む）
export const C11B_OBORO_NAME = '月のむかえオボロ'; // 幕の ボス（18-4。メインが 決めた）
export const C11B_OBORO_SHORT = 'オボロ';
export const C11B_KEEPER_NAME = 'ランプの番人カンテラ'; // 中ボス（B班が 決めた）
// 魔物の 表（B班。data/encounters-c11b.js）。表が ない 間は 魔物が 出ない（'safe:wait'）
//   うら道（月の都・うら の 北）・塔の おもて・塔の うら（おもてと うらで 表を かえる）。おもての 町では 出ない
export const C11B_TABLE = { back: 't11b_alley', towerFront: 't11b_tower', towerBack: 't11b_towerb' };
// 戦いの 背景（B班の 背景の id。うら道・塔・テラス）
export const C11B_BG = { back: 'c11b_alley', tower: 'c11b_tower', towerBack: 'c11b_towerb' };

// ───── 宝箱の id（B班が 中みを 決める。★5 は 3つ）─────
export const C11B_CHEST_IDS = ['c11b_c1', 'c11b_c2', 'c11b_c3', 'c11b_c4', 'c11b_c5', 'c11b_c6', 'c11b_c7', 'c11b_c8'];

// ───── だいじな 物 ─────
export const NAME_LAMP = 'name_lamp'; // スピカの 名前の ランプ

// ───── コマンド（B班）─────
export const C11B_CMD_CALL = 'c11bcall'; // よびかける

// ───── 曲の id（F班。client/audio-c11b.js）─────
export const C11B_TRACKS = {
  front: 'c11b_front', // 月の都・おもて
  back: 'c11b_back', // うら（おもてと 同じ ふしを うら返した 形）
  tower: 'c11b_tower', // 名前の 塔（画面の 状態 sideStage … 0 おもて・1 うら で 楽器が かわる）
  plaza: 'c11b_plaza', // 名前の 広場（短い）
  call: 'c11b_call', // よびかける（とても 短い）
  keeper: 'c11b_keeper', // 中ボス
  oboro: 'c11b_oboro', // ボス
};
export const C11B_TRACK_IDS = Object.values(C11B_TRACKS);
// 画面の 状態（F班の 曲）: field.sideStage（0 ＝ おもて・1 ＝ うら。前の 幕の conStage と 同じ 形）
export const C11B_SIDE_MAX = 1;

// ───── タイルの 番号（shared/tiles.js の T に A が C11B_ で 足す）。661〜700 を この 幕に とって おく ─────
export const C11B_TILE_FIRST = 661;
export const C11B_TILE_LAST = 700;

// ───── 助け（ホタル）: 同じ 区切りで この 歩数 歩いても すすまないと、次の 戸を 光らせる ─────
export const C11B_HELP_STEPS = 80;

// ───── すすめ Lv（18-4）─────
export const C11B_LV = { back: 120, tower: 121, keeper: 121, oboro: 122 };

// ───── 幕の 切りかえ ─────
export const C11B_OPEN = 'PART3_C11B_OPEN'; // data/story-c11.js

// ───── B班の かりの 置き場（data/c11b-names-b.js。合わせた 時に 消した）に あった 名前（同じ 物。B の ファイルが as で 読む）─────
export const C11B_B = {
  act1: C11B_ACT0, start: C11B.start, plaza: C11B.plaza, back: C11B.back, rule: C11B.rule, tower: C11B.tower,
  keeper: C11B.keeper, lamp: C11B.lamp, oboro: C11B.oboro, act2: C11B.act2,
};
// とびら・ランプの しるしの わく（12こ まで。A班が 使うのは C11B_MARKS の 7こ）
export const C11B_DOORS_B = Array.from({ length: C11B_MARK_MAX }, (_, i) => `c11b_d${i + 1}`);
export const C11B_MAP_B = { sea: 'c11_sea', ...C11B_MAP };
export const C11B_BATTLE_B = { ...C11B_BATTLE };
export const C11B_MON_PREFIX_B = C11B_MON_PREFIX;
export const C11B_CHEST_IDS_B = [...C11B_CHEST_IDS];
export const C11B_KEYS_B = { lamp: NAME_LAMP };
export const C11B_CMD_B = C11B_CMD_CALL;
export const C11B_TRACKS_B = { ...C11B_TRACKS };
export const C11B_OPEN_B = C11B_OPEN;
