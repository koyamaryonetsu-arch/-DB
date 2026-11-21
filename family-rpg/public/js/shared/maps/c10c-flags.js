// 第3部 第2章「七つの星の音」第3幕「紫と、うばわれた音」の フラグ・マップの ID・名前の 約束（第97回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15）。フラグ・id は セーブに のこるので かえない（15-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 一本道の 幕: フラグは ぜんぶ 一本の 線（STORY_STEPS。c10_act2 の うしろ）に 入る

// ───── 物語の すすみぐあい（一本の 線。data/story-c10.js の CH10_STEPS。c10_act2 の うしろ）─────
export const C10C = {
  start: 'c10c_start', // くぼ地で 音さを 鳴らした（紫の 光が 空へ。幕が 始まった。題の 画面を 見た）
  isles2: 'c10c_isles2', // 空の 小島の 2まいめに 着いた
  colonel: 'c10c_colonel', // たいさに 勝った（中ボス）
  stolen: 'c10c_stolen', // 紫の 音を 少年に うばわれた
  trio: 'c10c_trio', // くぼ地で 3人組の 話を 聞いた（うら口が 開く）
  fortIn: 'c10c_fort_in', // とりでに 入った
  fort2: 'c10c_fort2', // とりでの 2まいめに 着いた
  algol: 'c10c_algol', // 少年に 勝った（幕の ボス）
  note: 'c10_note_si', // 紫の 音（シ）
  act3: 'c10_act3', // 紫の 音を 台に 置いた（幕の クリア）
};
// 第2幕 クリア（幕が 始まる 条件）
export const C10C_ACT2 = 'c10_act2';
export const C10C_LINE = [C10C.start, C10C.isles2, C10C.colonel, C10C.stolen, C10C.trio, C10C.fortIn, C10C.fort2, C10C.algol, C10C.note, C10C.act3];

// ───── レバー（ベルトの 向き。パーティーで 同じ・セーブする）・台 ─────
export const C10C_LEVER = { red: 'c10c_lv_red', blue: 'c10c_lv_blue' };
export const C10C_LEVER_COLORS = ['red', 'blue'];
// くぼ地の 台に 置いた（小さな フラグ。幕の クリアで 消す。クリアの あとは c10_act3 で 光る）
export const C10C_PED = { si: 'c10_ped_si' };

// ───── マップの ID ─────
export const C10C_MAP = {
  isles1: 'c10c_isles1', // 空の 小島 1（音の 橋の れんしゅう）
  isles2: 'c10c_isles2', // 空の 小島 2（遠回りの 小島に 宝箱・風の 小島）
  isles3: 'c10c_isles3', // うかぶ いせき（中ボス）
  fort1: 'c10c_fort1', // 少年の とりで 1（ベルトの 工場）
  fort2: 'c10c_fort2', // 少年の とりで 2（ベルトの 工場）
  fort3: 'c10c_fort3', // 少年の 間（幕の ボス）
};
export const C10C_MAP_IDS = Object.values(C10C_MAP);
export const C10C_ISLE_MAPS = [C10C_MAP.isles1, C10C_MAP.isles2, C10C_MAP.isles3];
export const C10C_FORT_MAPS = [C10C_MAP.fort1, C10C_MAP.fort2, C10C_MAP.fort3];
// 音の 橋の ある 階
export const C10C_BRIDGE_MAPS = [C10C_MAP.isles1, C10C_MAP.isles2];
// ベルトの ある 階
export const C10C_BELT_MAPS = [C10C_MAP.fort1, C10C_MAP.fort2];

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C10C_BATTLE = { colonel: 'c10c_colonel', algol: 'c10c_algol' };
// 魔物の id（先頭 c10c_）
export const C10C_MON_PREFIX = 'c10c_';
export const C10C_BOSS_MON = { colonel: 'c10c_muscari', algol: 'c10c_algol' };
export const C10C_COLONEL_NAME = 'たいさ　ムスカリ'; // むらさきの 軍服の たいさ（もとの 作品の 名前・せりふは 使わない）
export const C10C_COLONEL_SHORT = 'ムスカリ';
export const C10C_ALGOL_NAME = '星くいの少年　アルゴル';
export const C10C_ALGOL_SHORT = 'アルゴル';

// ───── 魔物の 出る 表（B班）─────
export const C10C_TABLE = { isles: 't10c_isles', fort: 't10c_fort' };

// ───── 宝箱の id（B班が 中みを 決める）─────
export const C10C_CHEST_IDS = {
  isles: ['c10c_ic1', 'c10c_ic2', 'c10c_ic3', 'c10c_ic4', 'c10c_ic5', 'c10c_ic6'],
  fort: ['c10c_fc1', 'c10c_fc2', 'c10c_fc3', 'c10c_fc4', 'c10c_fc5', 'c10c_fc6'],
};
export const C10C_CHEST_ALL = [...C10C_CHEST_IDS.isles, ...C10C_CHEST_IDS.fort];

// ───── だいじな 物（星の音）─────
export const NOTE_SI = 'note_si'; // 星の音・シ（紫）

// ───── 曲の id（F班。client/audio-c10c.js）─────
export const C10C_TRACKS = {
  isles: 'c10c_isles', // 空の 小島（bridgeStage 0〜5）
  colonel: 'c10c_colonel', // たいさ
  stolen: 'c10c_stolen', // うばわれた（短い 場面）
  fort: 'c10c_fort', // ベルトの 工場
  rival: 'c10c_rival', // 少年との 戦い
  six: 'c10c_six', // 6つの 音（短い）
};
export const C10C_TRACK_IDS = Object.values(C10C_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C10C_ で 足す）。551〜590 を この 幕に とって おく ─────
export const C10C_TILE_FIRST = 551;
export const C10C_TILE_LAST = 590;

// ───── しくみの 数（15-2）─────
// 音の 橋: 持って いる 星の音（レ赤・ミ黄・ファ緑・ソ青・ラ白）。同じ 色の 橋は 1本だけ。パーティーで 同じ・セーブしない
export const C10C_BRIDGE_NOTES = { note_re: 'red', note_mi: 'yellow', note_fa: 'green', note_so: 'blue', note_la: 'white' };
export const C10C_BRIDGE_COLORS = ['red', 'yellow', 'green', 'blue', 'white'];
export const C10C_BRIDGE_COLOR_NAMES = { red: '赤', yellow: '黄', green: '緑', blue: '青', white: '白' };
// 画面の 状態（F班の 曲）: field.bridgeStage（かかって いる 橋の 数 0〜5）
export const C10C_BRIDGE_MAX = 5;

// ───── すすめ Lv（13-1）─────
export const C10C_LV = { isles: 113, fort: 114, colonel: 114, algol: 116 };

// ───── 幕の 切りかえ ─────
export const C10C_OPEN = 'PART3_C10C_OPEN'; // data/story-c10.js

// ───── B班の かりの 置き場（data/c10c-names-b.js。合わせた 時に 消した）に あった 形（同じ 名前・同じ 値。B の ファイルは as で よぶ）─────
export const C10C_B = {
  act2: C10C_ACT2, start: C10C.start, isles2: C10C.isles2, colonel: C10C.colonel, stolen: C10C.stolen, trio: C10C.trio,
  fortIn: C10C.fortIn, fort2: C10C.fort2, algol: C10C.algol, noteSi: C10C.note, act3: C10C.act3,
};
export const C10C_LEVER_B = C10C_LEVER;
export const C10C_PED_B = C10C_PED;
export const C10C_MAP_B = { i1: C10C_MAP.isles1, i2: C10C_MAP.isles2, i3: C10C_MAP.isles3, f1: C10C_MAP.fort1, f2: C10C_MAP.fort2, f3: C10C_MAP.fort3 };
export const C10C_BATTLE_B = C10C_BATTLE;
export const C10C_MON_PREFIX_B = C10C_MON_PREFIX;
export const C10C_BOSS_MON_B = C10C_BOSS_MON;
export const C10C_TABLE_B = C10C_TABLE;
export const C10C_CHEST_IDS_B = C10C_CHEST_IDS;
export const C10C_NOTES_B = { si: NOTE_SI };
export const C10C_TRACKS_B = C10C_TRACKS;
export const C10C_OPEN_B = C10C_OPEN;
