// 第3部 第2章「七つの星の音」第2幕「青と白」の フラグ・マップの ID・名前の 約束（第95回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14）。フラグ・id は セーブに のこるので かえない（14-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う
// ※ 2つめの「すきな じゅん」: 青の 道と 白の 道は どちらを 先に しても よい。だから 一本の 線（STORY_STEPS）に 入れるのは
//   はじめ（c10b_start）と おわり（c10_act2）だけ。青・白の フラグは 線に 入れない（第1幕と 同じ）

// ───── 物語の すすみぐあい（一本の 線。data/story-c10.js の CH10_STEPS。c10_act1 の うしろ）─────
export const C10B = {
  start: 'c10b_start', // 青と 白（くぼ地で 音さを 鳴らした・幕が 始まった。題の 画面を 見た）
  act2: 'c10_act2', // 青と 白の 音を 台に 置いた（幕の クリア）
};
// 第1幕 クリア（幕が 始まる 条件）
export const C10B_ACT1 = 'c10_act1';
export const C10B_LINE = [C10B.start, C10B.act2];

// ───── 青の 道（砂の底の神殿の 水鏡の うら）─────
export const C10B_BLUE = {
  in: 'c10b_blue_in', // 水鏡の うらに 着いた
  key: 'c10b_blue_key', // かぎの 石（湖の 底。おくへの とびらが 開く）
  boss: 'c10b_blue_boss', // ゲッコーに 勝った（中ボス）
  note: 'c10_note_so', // 青の 音（ソ）
};
// ───── 白の 道（白銀の湖の 氷の 下）─────
export const C10B_WHITE = {
  in: 'c10b_white_in', // 氷の 下に 入った
  two: 'c10b_white2', // 2まいめに 着いた
  boss: 'c10b_white_boss', // シロフクロウに 勝った（中ボス）
  note: 'c10_note_la', // 白の 音（ラ）
};
export const C10B_BLUE_LINE = [C10B_BLUE.in, C10B_BLUE.key, C10B_BLUE.boss, C10B_BLUE.note];
export const C10B_WHITE_LINE = [C10B_WHITE.in, C10B_WHITE.two, C10B_WHITE.boss, C10B_WHITE.note];

// ───── おまけ・台 ─────
// おまけの 部屋（先に 取った 音が、もう 片方で 役に 立つ。2つ 取った あとなら 両方 取れる）
export const C10B_BONUS = {
  blue: 'c10b_bonus_b', // 青の 階の、白の 音で こおる 水面 → 氷の 橋（こおった）
  white: 'c10b_bonus_w', // 白の 道の、青の 音で とける 氷の かべ（とけた）
};
// くぼ地の 台に 置いた（小さな フラグ。幕の クリアで 消す。クリアの あとは c10_act2 で 光る）
export const C10B_PED = { so: 'c10_ped_so', la: 'c10_ped_la' };

// ───── マップの ID ─────
export const C10B_MAP = {
  blue1: 'c10b_blue1', // 水鏡の うら（1まいの 大きな 階。水の 高さ）
  blue2: 'c10b_blue2', // かれた 間（おく。中ボス）
  white1: 'c10b_white1', // 氷の 下の 道 1（こっそり）
  white2: 'c10b_white2', // 氷の 下の 道 2（こっそり）
  white3: 'c10b_white3', // 月の 間（中ボス）
};
export const C10B_MAP_IDS = Object.values(C10B_MAP);
export const C10B_BLUE_MAPS = [C10B_MAP.blue1, C10B_MAP.blue2];
export const C10B_WHITE_MAPS = [C10B_MAP.white1, C10B_MAP.white2, C10B_MAP.white3];
// こっそり 進む 階
export const C10B_SNEAK_MAPS = [C10B_MAP.white1, C10B_MAP.white2];

// ───── 決まった 戦い（台本は ['battle', id]）─────
export const C10B_BATTLE = {
  blue: 'c10b_gecko',
  white: 'c10b_owl',
  watch: ['c10b_watch1', 'c10b_watch2', 'c10b_watch3'], // 見はりに 見つかった 時
};
// 魔物の id（先頭 c10b_）
export const C10B_MON_PREFIX = 'c10b_';
export const C10B_BOSS_MON = { blue: 'c10b_gecko', white: 'c10b_owl', fake: 'c10b_owl_fake' };
export const C10B_BLUE_BOSS_NAME = 'サー・ゲッコー'; // 砂の しんし
export const C10B_WHITE_BOSS_NAME = 'かいとう　シロフクロウ'; // 白い マントの かいとう（「盗」は 漢字の きまりで 使えない）
export const C10B_WHITE_SHORT = 'シロフクロウ';

// ───── 魔物の 出る 表（B班）─────
export const C10B_TABLE = { wet: 't10b_blue_wet', dry: 't10b_blue_dry' };

// ───── 宝箱の id（B班が 中みを 決める）─────
export const C10B_CHEST_IDS = {
  blue: ['c10b_bc1', 'c10b_bc2', 'c10b_bc3', 'c10b_bc4', 'c10b_bc5', 'c10b_bc6'],
  white: ['c10b_wc1', 'c10b_wc2', 'c10b_wc3', 'c10b_wc4', 'c10b_wc5', 'c10b_wc6'],
  bonus: { blue: 'c10b_bbonus', white: 'c10b_wbonus' },
};
export const C10B_CHEST_ALL = [...C10B_CHEST_IDS.blue, ...C10B_CHEST_IDS.white, C10B_CHEST_IDS.bonus.blue, C10B_CHEST_IDS.bonus.white];

// ───── だいじな 物（星の音）─────
export const NOTE_SO = 'note_so'; // 星の音・ソ（青）
export const NOTE_LA = 'note_la'; // 星の音・ラ（白）

// ───── 曲の id（F班。client/audio-c10b.js）─────
export const C10B_TRACKS = {
  blue: 'c10b_blue', // 水鏡の うら（waterStage 0〜2）
  gecko: 'c10b_gecko', // 砂の しんし
  night: 'c10b_night', // 夜の 湖（短い 場面）
  white: 'c10b_white', // こっそり（alertStage 0〜2）
  owl: 'c10b_owl', // かい盗
  five: 'c10b_five', // 5つの 音（短い）
};
export const C10B_TRACK_IDS = Object.values(C10B_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C10B_ で 足す）。521〜550 を この 幕に とって おく ─────
export const C10B_TILE_FIRST = 521;
export const C10B_TILE_LAST = 550;

// ───── しくみの 数（14-2）─────
// 水の 高さ（0 … 下・1 … 中・2 … 上）。階に 入った 時は 中。セーブしない
export const C10B_WATER = { low: 0, mid: 1, high: 2 };
export const C10B_WATER_START = 1;
export const C10B_WATER_NAMES = ['下', '中', '上'];
// 鐘で 鳴らす 音と 水の 高さ（音が 高いほど 水も 高い）: レ → 下・ミ → 中・ファ → 上
export const C10B_BELL_NOTES = { note_re: 0, note_mi: 1, note_fa: 2 };
// こっそり
export const C10B_OWL_TURN_STEPS = 4; // 自分が この 歩数 歩く たびに 見はりが 向きを かえる
export const C10B_OWL_RANGE = 3; // 前の 3マス（扇の 形）
export const C10B_NOISE_MAX = 3; // うすい 氷の もの音 3回で けものが 目を さます
export const C10B_CAUGHT_EASE = 3; // 3回 見つかる（か 起こす）と 見はりが 1ぴき へる
// 画面の 状態（F班の 曲）: field.waterStage（0〜2）・field.alertStage（0 … 遠い・1 … 近い・2 … 見つかった）
export const C10B_ALERT_NEAR = 4; // 見はりの 見て いる マスまで この マス いないなら「近い」

// ───── すすめ Lv（13-1）─────
export const C10B_LV = { blue: 109, white: 111 };

// ───── 幕の 切りかえ ─────
export const C10B_OPEN = 'PART3_C10B_OPEN'; // data/story-c10.js
