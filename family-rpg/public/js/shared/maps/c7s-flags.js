// 第7章 Step 3・4（A: 世界と物語。第2幕「海の紋章」）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch7.md の 4）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch7.md の 4-3 の 名前の 約束。data/story-c7.js の CH7_STEPS の c7_karim の うしろ）─────
export const C7S = { sea: 'c7_sea', isle: 'c7_isle', reef: 'c7_reef', lamp: 'c7_lamp', kai: 'c7_kai' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE7S = 'c7s_arrive'; // はじめて 千年前の クモイの 海に 来た
export const LF7 = (n) => (n === 1 ? C7S.lamp : `c7s_f${n}`); // 灯台の その 階に 来た（1階は c7_lamp と 同時）
export const EBB3 = 'c7s_f3_ebb'; // 3階: 千年前の しおの 鐘で しおが 引いている（もう 1回 鳴らすと 満ちる）
export const OPEN6S = 'c7s_f6_open'; // 6階: 2つの 時代の ふむ石で 近道の とびらが 開いた
export const WAIT6S = 'c7s_f6_wait'; // 6階: カイが 千年前の ふむ石の 上で 待っている（ひとりの とき）
export const WIN7S = 'c7s_lwin'; // 灯台の ボスに 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）

// ───── 時をこえる手紙（data/sidequests-c7s.js。1〜3 … より道・4 … 灯台 5階の なぞとき）─────
export const LETTER7S = {
  start: (k) => `c7s_l${k}_start`, // たのまれた（4 … 灯台守が 合言葉の 手紙を 書いてくれた）
  bury: (k) => `c7s_l${k}_bury`, // 千年前で うめた（4 … からくりの とびらの よこの 戸だなに 入れた）
  found: (k) => `c7s_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER7S_KEYS = [1, 2, 3, 4];
export const LETTER7S_SIDE = [1, 2, 3]; // より道の 手紙（ごほうびは B の C7S_LETTER_REWARDS）
export const LETTER7S_LIGHT = 4; // 灯台 5階の からくりの とびらの 手紙
export const KEEPER_LETTER = 'c7s_keeper_letter'; // 大事な物「灯台守の手紙」（戸だなに 入れると なくなる）

// ───── マップの ID ─────
export const C7S_SEA = 'c7s_sea'; // 千年前の クモイの 海（今の kumoi と おなじ 大きさ・おなじ 座標）
export const PRESENT_SEA = 'kumoi'; // 今の クモイ地方（第5章）
export const c7slMapId = (n, now = false) => `c7s_light_${n}f${now ? '_now' : ''}`;
export const C7SL_FLOORS = 8;
export const C7SL_NOW_FLOORS = 7; // 今の がわ（しずんだ灯台）が ある 階。8階は 千年前だけ
export const C7SL_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C7SL_BOSS_FLOOR = 8;

// ───── 千年前の クモイの 海の だいじな 場所（今の 地図と おなじ 座標）─────
// ナギの島の 村（今の ハネノの島の 町の あたり。22×14。maps/c7s-village-rows.js）
export const VILLAGE = { x: 48, y: 21, w: 22, h: 14, name: 'ナギの村' };
// しずむ前の島の 灯台の 外がわ（今の しずみゆく島の 古い神殿と おなじ 場所。maps/sink-ruin.js の RUIN_OUT）
export const LIGHT_WALL = { x: 12, y: 40, w: 9, h: 6 };
export const LIGHT_DOOR = { x: 16, y: 45 };
export const LIGHT_OUT = { x: 16.5, y: 46.6 }; // 灯台から 出て 着く ところ
// しずむ前の島の 北の 浜（しおの流れで 着く ところ）。海賊船と 手下が 待ちぶせている（中ボス）
export const REEF_ZONE = { x: 14, y: 37, w: 9, h: 2 };
export const REEF_SHIP = { x: 14, y: 35 }; // 海賊船（大きな 人の え。海の 上）
