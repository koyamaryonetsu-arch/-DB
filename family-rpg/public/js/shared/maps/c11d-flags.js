// 第3部 第3章「星の海」第4幕「かがやきの女王と、八つめの音」の フラグ・マップの ID・名前の 約束（第104回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20）。フラグ・id は セーブに のこるので かえない（20-6 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本の 線（STORY_STEPS。c11_act3 の うしろ）に 入るのは C11D_LINE。階を 通った しるし（c11d_t1〜t4）も 線の 中
// ※ 第3部の さいごの 幕。c11_act4 ＝ 第3部の クリア

// ───── 物語の すすみぐあい ─────
export const C11D = {
  start: 'c11d_start', // 大とびらの 中・光の はかりの 広間で 女王に 会った（題の 画面を 見た。幕が 始まった）
  t1: 'c11d_t1', // かがやきの 塔 1階（星座の 間）を 通った（星座が できて とびらに なった）
  t2: 'c11d_t2', // 2階（月かげの 間）を 通った
  t3: 'c11d_t3', // 3階（かげの 間）を 通った
  t4: 'c11d_t4', // 4階（音の 間）の 7つの 音を 鳴らした
  duo: 'c11d_duo', // 中ボス「鏡と 月の 使い」に 勝った（2人とも 引く）
  queen: 'c11d_queen', // さいごの ボス「かがやきの 女王」と 向き合った（女王は 手を 下ろす。E1）
  lamp: 'c11d_lamp', // 名前の ランプを ともす 日（月の都の 名前の 広場。E2）
  bridge: 'c11d_bridge', // 星の橋が さいごまで かかった（星見の丘。E3）
  act4: 'c11_act4', // 第3部の クリア（E4）
};
// 第3章 第3幕 クリア（幕が 始まる 条件）
export const C11D_ACT0 = 'c11_act3';
// 一本の 線
export const C11D_LINE = [C11D.start, C11D.t1, C11D.t2, C11D.t3, C11D.t4, C11D.duo, C11D.queen, C11D.lamp, C11D.bridge, C11D.act4];
// 階を 通った しるし（1〜4階。線の 中）
export const C11D_FLOOR_FLAGS = { 1: C11D.t1, 2: C11D.t2, 3: C11D.t3, 4: C11D.t4 };
// 2階（月かげの 間）の 光の ゆかの しるし（第2幕の しくみ。リーダーの フラグ。線には 入れない。1こ だけ）
export const C11D_MARKS = ['c11d_m1'];

// ───── マップの ID ─────
export const C11D_MAP = {
  scale: 'c11d_scale', // 光の はかりの 広間（大とびらの 中）
  tower1: 'c11d_tower1', // かがやきの 塔 1階・星座の 間（ひとふで書き）
  tower2: 'c11d_tower2', // 2階・月かげの 間（おもて）
  tower2b: 'c11d_tower2b', // 2階・月かげの 間（うら）
  tower3: 'c11d_tower3', // 3階・かげの 間（かげの 台。アルゴルが 立つ）
  tower4: 'c11d_tower4', // 4階・音の 間（7つの 音の 台・回復の いずみ・中ボス）
  throne: 'c11d_throne', // 玉座の 間（いただき。まどの 外に 星の海。さいごの ボス）
};
export const C11D_MAP_IDS = Object.values(C11D_MAP);
// かがやきの 塔（曲の towerStage 1〜4）
export const C11D_TOWER_MAPS = { [C11D_MAP.tower1]: 1, [C11D_MAP.tower2]: 2, [C11D_MAP.tower2b]: 2, [C11D_MAP.tower3]: 3, [C11D_MAP.tower4]: 4 };
// 2階の おもてと うらの くみ（第2幕の しくみ world/c11b-steps.js の くみの 番号）
export const C11D_PAIR = 'c11d';
// 前の 幕・前の 章の マップ（フラグで 出る 物を 足す 所）
export const C11D_DOOR = 'c11c_door'; // 王宮の 大とびらの 前（ここから 入る）
export const C11D_FRONT = 'c11b_front'; // 月の都・おもて（名前の 広場・はかりの門・クリアの あとの 人）
export const C11D_HILL = 'overworld'; // 星見の丘（星の橋）
export const C11D_CRATER = 'c9a_crater'; // ながれ星のくぼ地（8つめの 台）

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C11D_BATTLE = { duo: 'c11d_duo', queen: 'c11d_queen' };
// 魔物の id（先頭 c11d_）・ボスの id（B班が 決める。下は かりの id … 台本は ここを 読む）
export const C11D_MON_PREFIX = 'c11d_';
export const C11D_BOSS_MON = { mirror: 'c11d_mirror', oboro: 'c11d_moon', queen: 'c11d_queen' };
// 名前（台本・目標・ヒントは ここを 読む。B班の monsters-c11d.js と 同じ 字）
export const C11D_QUEEN_NAME = 'かがやきの女王ポラリス'; // さいごの ボス（20-5。北の 空で 動かない 星の 名前）
export const C11D_QUEEN_SHORT = 'ポラリス';
export const C11D_QUEEN_TITLE = '女王'; // 台本の 名前の 札
export const C11D_DUO_NAME = '鏡と月の使い'; // 中ボス（第2章の 鏡と 第2幕の オボロが 2人で）
export const C11D_MIRROR_NAME = 'ミラーレ'; // 鏡（第2章 第4幕）
export const C11D_OBORO_NAME = 'オボロ'; // 月の 使い（第2幕）
export const C11D_ACE_NAME = 'エース'; // 近衛の 隊長（第3幕）
// 技の 名前（台本・ヒントが 読む。中みは B班）
export const C11D_SKILL = {
  scale: '光のはかり', // 女王: いちばん 弱って いる 人を はかって ながす
  shine: 'かがやき', // 女王: 全体攻撃（つないで いない 人に 大きく）
  dazzle: 'まぶしすぎる光', // 女王: HPが 半分で つなぎが 全部 ほどける（T6）
  names: '星の名前をよぶ', // 女王: ながした 星の 名前を よぶ（自分が 回復）
};
// 魔物の 表（B班。data/encounters-c11d.js）。表が ない 間は 魔物が 出ない（'safe:wait'）。塔の 1〜3階で 階ごとに 出る（4階・玉座の 間は 出ない）
export const C11D_TABLE = { 1: 't11d_tower1', 2: 't11d_tower2', 3: 't11d_tower3' };
// 戦いの 背景（B班の 背景の id。塔・音の 間・玉座の 間）
export const C11D_BG = { tower: 'c11d_tower', sound: 'c11d_sound', throne: 'c11d_throne' };

// ───── 宝箱の id（B班が 中みを 決める。★5 は 4つ。さいごの 1つは 第3部で いちばん 強い 品）─────
export const C11D_CHEST_IDS = ['c11d_c1', 'c11d_c2', 'c11d_c3', 'c11d_c4', 'c11d_c5', 'c11d_c6', 'c11d_c7', 'c11d_c8'];

// ───── だいじな 物 ─────
export const NOTE_EIGHT = 'note_eight'; // 八つめの 音（中みと 絵は B班）

// ───── コマンド（B班）─────
export const C11D_CMD_HOLD = 'c11dhold'; // 手をつなぐ
export const C11D_CMD_EIGHT = 'c11deight'; // 八つの音
// 中ボスは 今 ある コマンド（音を鳴らす・よびかける）
export const C11D_CMD_DUO = { ring: 'c10dring', call: 'c11bcall' };

// ───── 曲の id（F班。client/audio-c11d.js）─────
export const C11D_TRACKS = {
  scale: 'c11d_scale', // はかりの 広間（大きく つめたい）
  tower: 'c11d_tower', // かがやきの 塔（画面の 状態 towerStage 1〜4 で、その 階の 幕の 曲の ふしが 少し 顔を 出す）
  duo: 'c11d_duo', // 中ボス（鏡の 曲と 月の 使いの 曲の ふしが かわるがわる）
  queen: 'c11d_queen', // 女王・前半
  eight: 'c11d_eight', // 八つめの 音の 場面（短い）
  queen2: 'c11d_queen2', // 女王・後半（みんなの 曲）
  lamps: 'c11d_lamps', // 名前の ランプを ともす 日
  end: 'c11d_end', // 第3部 完（星の橋）
};
export const C11D_TRACK_IDS = Object.values(C11D_TRACKS);
// 画面の 状態（F班の 曲）: field.towerStage（今 いる 塔の 階 1〜4。塔の 外では 0。前の 幕の pairStage と 同じ 形）
export const C11D_TOWER_MAX = 4;

// ───── タイルの 番号（shared/tiles.js の T に A が C11D_ で 足す）。741〜780 を この 幕に とって おく ─────
export const C11D_TILE_FIRST = 741;
export const C11D_TILE_LAST = 780;

// ───── 音の 間（4階）: 7色の 台（ならびは くぼ地の 台と 同じ … 赤・金・黄・緑・青・白・むらさき）─────
// 鳴らす じゅん ＝ スピカの 歌の 7ふしの じゅん（ふしが ふえた 音の じゅん … ミ・レ・ファ・ソ・ラ・シ・ド）
export const C11D_PADS = [
  { c: '赤', note: 'レ' }, { c: '金', note: 'ド' }, { c: '黄', note: 'ミ' }, { c: '緑', note: 'ファ' },
  { c: '青', note: 'ソ' }, { c: '白', note: 'ラ' }, { c: 'むらさき', note: 'シ' },
];
export const C11D_SONG_ORDER = [2, 0, 3, 4, 5, 6, 1];
// まちがえた 回数が これに なると、じゅんが 光る（スピカが 口ずさむ）
export const C11D_PAD_HELP = 3;

// ───── 八つめの 音（T6。戦いの 中で 女王の HPが 半分に なった 時。しくみは B班の battle-c11d.js）─────
// 場面の 文と 絵は data/story-c11d.js の C11D_EIGHT_SCENE（B班は そこを 読む）。絵の 名前（render/c11d-npc-art.js）:
export const C11D_EIGHT_ART = { ped: 'c11d_ped8_on', light: 'c11d_light' };
export const C11D_EIGHT_SCENE_NAME = 'C11D_EIGHT_SCENE'; // data/story-c11d.js から export する 名前

// ───── 助け（前の 幕と 同じ 歩数）─────
export const C11D_HELP_STEPS = 80;

// ───── すすめ Lv（20-5）─────
export const C11D_LV = { tower: 125, duo: 125, queen: 126 };

// ───── 幕の 切りかえ ─────
export const C11D_OPEN = 'PART3_C11D_OPEN'; // data/story-c11.js

// ───── B班の かりの 置き場（data/c11d-names-b.js。合わせた 時に 消した）に あった 名前（同じ 物。B の ファイルが as で 読む）─────
export const C11D_B = { act3: C11D_ACT0, ...C11D };
export const C11D_MAP_B = { ...C11D_MAP };
export const C11D_BATTLE_B = { ...C11D_BATTLE };
export const C11D_MON_PREFIX_B = C11D_MON_PREFIX;
export const C11D_CHEST_IDS_B = [...C11D_CHEST_IDS];
export const C11D_KEYS_B = { eight: NOTE_EIGHT };
export const C11D_CMD_B = { hold: C11D_CMD_HOLD, eight: C11D_CMD_EIGHT };
export const C11D_TRACKS_B = { ...C11D_TRACKS };
export const C11D_OPEN_B = C11D_OPEN;
