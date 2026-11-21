// 第3部 第1章「おちてきた星の子」第3幕「さかさのピラミッド」の フラグ・マップの ID・名前の 約束（第92回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3.md の 11）。フラグ・id は セーブに のこるので かえない（11-5 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）・D（いらいと より道）の 係は、ここの 名前を 使う

// ───── 物語の すすみぐあい（一本の 線。data/story-c9.js の CH9_STEPS の c9_act2 の うしろ）─────
export const C9C = {
  raftGo: 'c9_raft_go', // 船着き場で いかだに 乗った（幕が 始まった。題の 画面を 見た）
  river: 'c9_river', // 川の 終わり（ピラミッドの 岸）に 着いた（いかだ乗り場が 使える）
  p2: 'c9_p2', // さかさのピラミッド 2階に 着いた
  riddle: 'c9_riddle', // なぞの番人 ナゾカケに 勝った（中ボス）
  p3: 'c9_p3', // 3階に 着いた
  p4: 'c9_p4', // 4階（さかさの 大広間）に 着いた
  song: 'c9_song', // さかさの 歌で おくの とびらが 開いた
  trio2: 'c9_trio2', // 3人組（ヒックリカエール2号）に 勝った（幕の ボス）
  note1: 'c9_note1', // 1つめの 星の音（黄・ミ）を 手に 入れた
  act3: 'c9_act3', // 第3幕 クリア
};
// 第2幕 クリア（幕が 始まる 条件）
export const C9C_ACT2 = 'c9_act2';
// 一本の 線の じゅん（この じゅんで CH9_STEPS に ならぶ）
export const C9C_LINE = ['raftGo', 'river', 'p2', 'riddle', 'p3', 'p4', 'song', 'trio2', 'note1', 'act3'].map((k) => C9C[k]);

// ───── マップの ID（先頭 c9c_）─────
export const C9C_MAP = {
  river: 'c9c_river', // 地下の川（いかだの 川下り）
  p1: 'c9c_p1', // さかさのピラミッド 1階（いちばん 下。17×17）
  p2: 'c9c_p2', // 2階（23×23。おくに なぞの番人）
  p3: 'c9c_p3', // 3階（27×27。流れる 砂）
  p4: 'c9c_p4', // 4階 さかさの 大広間（31×27。おくに 音の 間）
};
export const C9C_MAP_IDS = Object.values(C9C_MAP);
export const C9C_PYR_MAPS = [C9C_MAP.p1, C9C_MAP.p2, C9C_MAP.p3, C9C_MAP.p4]; // 下から 上へ

// ───── 決まった 戦い（台本は ['showMon', id] → ['battle', id]）─────
export const C9C_BATTLE = { riddle: 'c9c_riddle', trio2: 'c9c_trio2' };
// 魔物の id（先頭 c9c_）
export const C9C_MON_PREFIX = 'c9c_';
export const C9C_BOSS_MON = { riddle: 'c9c_nazokake', trio2: 'c9c_hikkuri' };
export const C9C_RIDDLE_NAME = 'ナゾカケ'; // なぞの番人
export const C9C_MECHA_NAME = 'ヒックリカエール2号'; // 3人組の 2つめの メカ

// ───── 魔物の 出る 表（B班の data/encounters-c9c.js）─────
export const C9C_TABLE = { river: 't9c_river', pyr: 't9c_pyr', pyr2: 't9c_pyr2' }; // pyr … 1〜2階・pyr2 … 3〜4階

// ───── 宝箱の id（B班が 中みを 決める。c9cChest(id) → { item, n }）─────
export const C9C_CHEST_IDS = {
  river: ['c9c_r1', 'c9c_r2', 'c9c_r3'], // 川の わき道の 小さな 岸
  pyr: ['c9c_q1', 'c9c_q2', 'c9c_q3', 'c9c_q4', 'c9c_q5', 'c9c_q6', 'c9c_q7', 'c9c_q8'], // さかさのピラミッド
};
export const C9C_CHEST_ALL = [...C9C_CHEST_IDS.river, ...C9C_CHEST_IDS.pyr];

// ───── だいじな 物 ─────
export const NOTE_MI = 'note_mi'; // 星の音・ミ（黄。1つめの 星の音）

// ───── 少年（ライバル。名前と すがたと ひとことだけ。わけは まだ 書かない）─────
export const ALGOL = 'algol'; // 人の id・絵の id
export const ALGOL_NAME = 'アルゴル';

// ───── 曲の id（F班が 作る）─────
export const C9C_TRACKS = {
  river: 'c9c_river', // 地下の川
  pyramid: 'c9c_pyramid', // さかさのピラミッド
  riddle: 'c9c_riddle', // なぞの番人
  trio2: 'c9c_trio2', // ヒックリカエール2号
  algol: 'c9c_algol', // 少年
  note: 'c9c_note', // 星の音を 手に 入れた
};
export const C9C_TRACK_IDS = Object.values(C9C_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C9C_ で 足す）。447〜470 を この 幕に とって おく ─────
export const C9C_TILE_FIRST = 447;
export const C9C_TILE_LAST = 470;

// ───── しくみの 数（11-2・11-3）─────
export const C9C_SPICA_LIGHT = 4; // 地下の川は 暗い（スピカの 光 4マス）
export const C9C_FLIP_STATES = ['up', 'down']; // 向き（up … ふつう〈ゆかを 歩く〉/ down … さかさ〈天じょうを 歩く〉）
// わらべ歌（第4章 1階の 歌の ボタン。太陽 → 砂 → 月 → 星）と、さかさの じゅん（4階の とびら）
export const C9C_SONG = ['sun', 'sand', 'moon', 'star'];
export const C9C_SONG_REVERSED = [...C9C_SONG].reverse();
