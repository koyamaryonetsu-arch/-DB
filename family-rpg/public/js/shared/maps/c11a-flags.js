// 第3部 第3章「星の海」第1幕「星の船と、星座の島」の フラグ・マップの ID・名前の 約束（第100回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17）。フラグ・id は セーブに のこるので かえない（17-5 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本の 線（STORY_STEPS。c10_act4 の うしろ）に 入るのは C11A_LINE。島の 明かり（すきな じゅん）・星座の しるしは 線に 入れない

// ───── 物語の すすみぐあい ─────
export const C11A = {
  start: 'c11a_start', // くぼ地で ガンツと 話した（星の船を 見た。題の 画面を 見た。幕が 始まった）
  chart: 'c11a_chart', // 灯台島の 灯台で 星図を もらった（灯台の 星座を つないだ）
  launch: 'c11a_launch', // 星見の丘から 星の船で こぎ出した（星の海へ 行ける）
  perch: 'c11a_perch', // とまり木の島で ヨイと 話した
  light1: 'c11a_light1', // 星座の 島 1の 明かり（すきな じゅん。線に 入れない）
  light2: 'c11a_light2',
  light3: 'c11a_light3',
  beast: 'c11a_beast', // 3つめの 明かりを ともした 島で、星座の けもの（中ボス）に 勝った
  pirate: 'c11a_pirate', // 星座の門の 前で、いかり船長に 勝った（幕の ボス）
  act1: 'c11_act1', // 門が 開いた（幕の クリア）
};
// 第2章 クリア（幕が 始まる 条件）
export const C11A_ACT0 = 'c10_act4';
// 一本の 線（すきな じゅんの 明かり 3つは 入れない）
export const C11A_LINE = [C11A.start, C11A.chart, C11A.launch, C11A.perch, C11A.beast, C11A.pirate, C11A.act1];
// 島の 明かり（すきな じゅん。3つ そろうと 門が 開きかける）
export const C11A_LIGHTS = [C11A.light1, C11A.light2, C11A.light3];
// 灯台の レンズで ゆかに 星座が うつって いる（小さな フラグ。灯台の 星座が できると 消す）
export const C11A_LENS = 'c11a_lens';

// ───── 星座の しるし（できた 星座。セーブする。7つ）─────
export const C11A_CON = {
  con0: 'c11a_con0', // 灯台（れんしゅう）
  con1a: 'c11a_con1a', con1b: 'c11a_con1b', // 島 1（きほん）
  con2a: 'c11a_con2a', con2b: 'c11a_con2b', // 島 2（ながれ星の 線 … 矢じるしの 向きにしか 進めない）
  con3a: 'c11a_con3a', con3b: 'c11a_con3b', // 島 3（ふたご星 … 片方に 入ると、もう 片方から 出る）
};
export const C11A_CON_IDS = Object.values(C11A_CON);
// 島ごとの 星座（2つめを つなぐと 島の 明かりが ともる）
export const C11A_ISLE_CONS = { 1: [C11A_CON.con1a, C11A_CON.con1b], 2: [C11A_CON.con2a, C11A_CON.con2b], 3: [C11A_CON.con3a, C11A_CON.con3b] };
// 助け（スピカ）: 3回 やり直すと 始める 星・6回で 次に 進む 線
export const C11A_HELP_START = 3;
export const C11A_HELP_LINE = 6;

// ───── マップの ID ─────
export const C11A_MAP = {
  sea: 'c11_sea', // 星の海（章を 通して 使う 世界地図。この 幕で 行けるのは 星座の門の 手前だけ）
  perch: 'c11a_perch', // とまり木の島（宿・店・いのりの いずみ）
  isle1: 'c11a_isle1', // 星座の 島 1
  isle2: 'c11a_isle2', // 星座の 島 2
  isle3: 'c11a_isle3', // 星座の 島 3
};
export const C11A_MAP_IDS = Object.values(C11A_MAP);
export const C11A_ISLE_MAPS = [C11A_MAP.isle1, C11A_MAP.isle2, C11A_MAP.isle3];
// ルーラ（行った 所）の id（maps/ch2.js の SEA_PLACES に 足す）
export const C11A_PLACE = 'c11a_perch';

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C11A_BATTLE = { beast: 'c11a_beast', pirate: 'c11a_pirate' };
// 魔物の id（先頭 c11a_）・ボスの id（名前は B班が 決める。下は かりの 名前 … 台本は ここを 読む）
export const C11A_MON_PREFIX = 'c11a_';
export const C11A_BOSS_MON = { beast: 'c11a_beast', pirate: 'c11a_captain', shark: 'c11a_shark' };
// 名前（B班が 決めた。台本・目標・ヒントは ここを 読む）
export const C11A_CAPTAIN_NAME = 'いかり船長イバリー';
export const C11A_CAPTAIN_SHORT = 'イバリー';
export const C11A_SHARK_NAME = 'チクタクザメ';
export const C11A_BEAST_NAME = '星座のけもの';
// 魔物の 表（B班。data/encounters-c11a.js）。島ごとに べつの 表。表が ない 間は 魔物が 出ない（'safe:wait'）
export const C11A_TABLE = { sea: 't11a_sea', isle1: 't11a_isle1', isle2: 't11a_isle2', isle3: 't11a_isle3' };
// 戦いの 背景（B班の 背景の id。海 … 星の船の 上・島・船長 … 星座の門の 前）
export const C11A_BG = { sea: 'c11a_deck', isle: 'c11a_isle', pirate: 'c11a_gate' };

// ───── 宝箱の id（B班が 中みを 決める。★5 は 3つ）─────
export const C11A_CHEST_IDS = ['c11a_c1', 'c11a_c2', 'c11a_c3', 'c11a_c4', 'c11a_c5', 'c11a_c6', 'c11a_c7', 'c11a_c8'];

// ───── だいじな 物 ─────
export const STAR_CHART = 'star_chart'; // 星図（灯台の 星座で もらう）
export const STAR_SHIP = 'star_ship'; // 星の船（星の海の 中だけの 乗り物）

// ───── コマンド（B班）─────
export const C11A_CMD_PASS = 'c11apass'; // 時計を投げる

// ───── 曲の id（F班。client/audio-c11a.js）─────
export const C11A_TRACKS = {
  sea: 'c11a_sea', // 星の海・船
  isle: 'c11a_isle', // 星座の 島（field.conStage … その 島で できた 星座の 数 0〜2）
  perch: 'c11a_perch', // とまり木の島
  const: 'c11a_const', // 星座が できた（短い）
  launch: 'c11a_launch', // こぎ出す（短い）
  beast: 'c11a_beast', // 中ボス
  pirate: 'c11a_pirate', // 船長（チクタクの 音が 入る）
};
export const C11A_TRACK_IDS = Object.values(C11A_TRACKS);
// 画面の 状態（F班の 曲）: field.conStage（その 島で できた 星座の 数 0〜2）
export const C11A_CON_MAX = 2;

// ───── タイルの 番号（shared/tiles.js の T に A が C11A_ で 足す）。621〜660 を この 幕に とって おく ─────
export const C11A_TILE_FIRST = 621;
export const C11A_TILE_LAST = 660;

// ───── すすめ Lv（17-4）─────
export const C11A_LV = { sea: 118, beast: 119, pirate: 120 };

// ───── 幕の 切りかえ ─────
export const C11A_OPEN = 'PART3_C11A_OPEN'; // data/story-c11.js

// ───── B班の かりの 置き場（data/c11a-names-b.js。合わせた 時に 消した）に あった 名前（同じ 物。B の ファイルが as で 読む）─────
export const C11A_B = {
  act4: C11A_ACT0, start: C11A.start, chart: C11A.chart, launch: C11A.launch, perch: C11A.perch,
  light1: C11A.light1, light2: C11A.light2, light3: C11A.light3, beast: C11A.beast, pirate: C11A.pirate, act1: C11A.act1,
};
export const C11A_CON_B = [...C11A_CON_IDS];
export const C11A_MAP_B = { ...C11A_MAP };
export const C11A_BATTLE_B = { ...C11A_BATTLE };
export const C11A_MON_PREFIX_B = C11A_MON_PREFIX;
export const C11A_CHEST_IDS_B = [...C11A_CHEST_IDS];
export const C11A_KEYS_B = { chart: STAR_CHART, ship: STAR_SHIP };
export const C11A_CMD_B = C11A_CMD_PASS;
export const C11A_TRACKS_B = { sea: C11A_TRACKS.sea, isle: C11A_TRACKS.isle, perch: C11A_TRACKS.perch, con: C11A_TRACKS.const, launch: C11A_TRACKS.launch, beast: C11A_TRACKS.beast, pirate: C11A_TRACKS.pirate };
export const C11A_OPEN_B = C11A_OPEN;
