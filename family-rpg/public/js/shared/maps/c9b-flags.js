// 第3部 第1章「おちてきた星の子」第2幕「鉱山の底の先」の フラグ・マップの ID・名前の 約束（第91回 A班 … はじめの 置き場）
// ※ ネタバレ注意（docs/plan-part3.md の 10）。フラグ・id は セーブに のこるので かえない（10-4 の 名前の 約束。係が かってに かえない）
// ほかの ファイルを 読まない（maps・data・world・client・tools の どこからでも 読める）
// A（世界と 物語）・B（戦いと 品）・F（曲）の 係は、ここの 名前を 使う

// ───── 物語の すすみぐあい（一本の 線。data/story-c9.js の CH9_STEPS の c9_act1 の うしろ）─────
export const C9B = {
  ring2: 'c9_ring2', // くぼ地で 星の音さを 鳴らした（幕が 始まった。題の 画面を 見た）
  mine: 'c9_mine', // カナトコ鉱山の いちばん 下に 下りの 階段が 出た
  under: 'c9_under', // 大地の下に 着いた
  village: 'c9_village', // ヒカリゴケの里に 着いた
  gate: 'c9_gate', // 大王の やしきの 門が 開いた（5・6本めの 柱）
  king: 'c9_king', // デデドン大王に 勝った（幕の ボス）
  raft: 'c9_raft', // 村長から いかだを もらった
  act2: 'c9_act2', // 第2幕 クリア
};
// 一本の 線の じゅん（この じゅんで CH9_STEPS に ならぶ）
// 第1幕 クリア（スピカの「てらす」が 出る。B班 battle-c9b.js）
export const C9B_ACT1 = 'c9_act1';
export const C9B_LINE = ['ring2', 'mine', 'under', 'village', 'gate', 'king', 'raft', 'act2'].map((k) => C9B[k]);

// ───── 水晶の 柱（6本。セーブする）・食料庫の はこ（3つ）─────
export const C9B_PILLARS = ['c9_pillar1', 'c9_pillar2', 'c9_pillar3', 'c9_pillar4', 'c9_pillar5', 'c9_pillar6'];
export const c9bPillar = (n) => `c9_pillar${n}`; // n 本め（1〜6）
export const C9B_BOXES = ['c9_box1', 'c9_box2', 'c9_box3'];

// ───── マップの ID（先頭 c9b_）。村は c9b_under の 中 ─────
export const C9B_MAP = {
  shaft: 'c9b_shaft', // たてあな
  under: 'c9b_under', // 大地の下（暗い 世界地図。ヒカリゴケの里も この 中）
  hall: 'c9b_hall', // 大王のやしき（食料庫 → ごちそうの 間）
};
export const C9B_MAP_IDS = Object.values(C9B_MAP);

// ───── 決まった 戦い（台本は ['showMon', id] → ['battle', id]）─────
export const C9B_BATTLE = { king: 'c9b_king', guard1: 'c9b_guard1', guard2: 'c9b_guard2', guard3: 'c9b_guard3' };
export const C9B_GUARDS = [C9B_BATTLE.guard1, C9B_BATTLE.guard2, C9B_BATTLE.guard3];
// 魔物の id（先頭 c9b_）
export const C9B_MON_PREFIX = 'c9b_';
export const C9B_BOSS_MON = 'c9b_dededon'; // デデドン大王
export const C9B_KING_NAME = 'デデドン大王';
export const C9B_DISH_MON = { meat: 'c9b_dish_meat', cake: 'c9b_dish_cake', soup: 'c9b_dish_soup' }; // ごちそうの 皿（べつの 的）
export const C9B_MIMIZU = 'c9b_mimizu'; // くらやみの 大ミミズ（darkOnly。暗い マスだけを 歩く）

// ───── 魔物の 出る 表（B班の data/encounters-c9b.js）─────
export const C9B_TABLE = { shaft: 't9b_shaft', light: 't9b_light', hall: 't9b_hall' };

// ───── 宝箱の id（B班が 中みを 決める。c9bChest(id) → { item, n }）─────
export const C9B_CHEST_IDS = {
  under: ['c9b_u1', 'c9b_u2', 'c9b_u3', 'c9b_u4', 'c9b_u5', 'c9b_u6'], // 大地の下（暗い 所に かくれた 宝箱。明るく すると 見える）
  village: ['c9b_v1'], // ヒカリゴケの里
  hall: ['c9b_h1', 'c9b_h2', 'c9b_h3'], // 大王のやしき
};
export const C9B_CHEST_ALL = [...C9B_CHEST_IDS.under, ...C9B_CHEST_IDS.village, ...C9B_CHEST_IDS.hall];

// ───── だいじな 物 ─────
export const UNDER_RAFT = 'under_raft'; // いかだ（村長から。川を 下るのは 第3幕）

// ───── 曲の id（F班が 作る）─────
export const C9B_TRACKS = {
  under: 'c9b_under', // 大地の下（柱の 数で もりあがる。画面の 状態 pillarStage 0〜6）
  village: 'c9b_village', // ヒカリゴケの里
  hall: 'c9b_hall', // 大王のやしき
  king: 'c9b_king', // デデドン大王
};
export const C9B_TRACK_IDS = Object.values(C9B_TRACKS);

// ───── タイルの 番号（shared/tiles.js の T に A が C9B_ で 足す）。427〜446 を この 幕に とって おく ─────
export const C9B_TILE_FIRST = 427;
export const C9B_TILE_LAST = 446;

// ───── 明かりを 広げる 探検の 数（10-2）─────
export const C9B_SPICA_LIGHT = 4; // スピカの 光（まわり 4マス）
export const C9B_PILLAR_RADIUS = 9; // ともした 柱の まわり（ずっと 明るい）
export const C9B_MOSS_STEPS = 40; // 光る こけが 消えるまでの 歩数
