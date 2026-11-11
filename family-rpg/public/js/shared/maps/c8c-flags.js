// 第8章 第3幕「くろがねの空中ようさい」（Step 5・6。A: 世界と物語）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-2・8）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch8.md の 8-2 の 名前の 約束。data/story-c8.js の CH8_STEPS。c8_hades の うしろ）─────
export const C8C = { sky: 'c8_sky', spring: 'c8_spring', fortress: 'c8_fortress', kamek: 'c8_kamek', engine: 'c8_engine', bowser: 'c8_bowser' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE8C = 'c8c_arrive'; // 第3幕で はじめて 千年前の ミドリナ地方に 来た
export const ENTRY8C = 'c8c_entry'; // 森に ささった ようさいの いかりの くさりを、リオンと のぼれる ように なった
// ようさいの その 階に 来た（1階は c8_fortress・5階は c8_engine と 同時）
export const PF8C = (n) => (n === 1 ? C8C.fortress : n === 5 ? C8C.engine : `c8c_f${n}`);
export const POCO8C = 'c8c_poco4'; // 4階の 休み所で 泉の里の 子ポコに 会った
export const VOICE8C = 'c8c_voice7'; // 7階の 休み所で 大魔王の 声を 聞いた
export const WIN8C = 'c8c_win'; // 初代大魔王クッパードに 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）
export const CALM8C = 'c8c_calm'; // ようさいの 上の 場面を 見おえた（のこりは 泉の里の 場面）
export const CAGE8C = 'c8c_cage_open'; // 8階の まほうの おりが 開いた（さいごの 場面の とちゅう）

// ───── ようさいの しかけ（千年前で 動かす。おちた 時の 形が かわる → 今の 残がいの 通れる 道・かたむきが かわる）─────
// 階 n の k ばんめの しかけ（上の 行から・左から）を 動かした（プロペラを 止めた・たいほうの 向きを かえた・シャッターを しめた）
export const DEV8C = (n, k) => `c8c_d${n}_${k}`;
// 今の かべの すきまを 通る 木の 根を 見つけた（千年前の その かべに すきまが ある と わかる → 千年前で 通れる）
export const ROOT8C = (n, k) => `c8c_r${n}_${k}`;

// ───── 時をこえる手紙（data/sidequests-c8c.js。1・2 … より道・3 … ようさい 5階の なぞとき）─────
export const LETTER8C = {
  start: (k) => `c8c_l${k}_start`, // たのまれた（3 … ポコが 手紙を 書いてくれた）
  bury: (k) => `c8c_l${k}_bury`, // 千年前で うめた（3 … 鉄の ポストに 入れた）
  found: (k) => `c8c_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER8C_KEYS = [1, 2, 3];
export const LETTER8C_SIDE = [1, 2]; // より道の 手紙
export const LETTER8C_FORT = 3; // ようさい 5階の まほうの じょうの とびらの 手紙
export const POCO_LETTER8C = 'c8c_poco_letter'; // 大事な物「ポコの手紙」（鉄の ポストに 入れると なくなる）

// ───── マップの ID ─────
export const PAST_FIELD_ID = 'overworld_past'; // 千年前の ミドリナ地方（第6章）
export const NOW_FIELD_ID = 'overworld'; // 今の ミドリナ地方
export const c8cMapId = (n, now = false) => `c8c_fort_${n}f${now ? '_now' : ''}`;
export const C8C_FLOORS = 8;
export const C8C_NOW_FLOORS = 7; // 今の がわ（森に おちた ようさいの 残がい）が ある 階。8階（上の かんぱん）は 千年前だけ
export const C8C_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C8C_BOSS_FLOOR = 8;
export const C8C_KAMEK_FLOOR = 4; // マジカメックが 待つ 階（Step 5 の さいご）

// ───── だいじな 場所（今の 地図と 千年前の 地図は おなじ 座標）─────
// 森（今の ささやきの森の 東の 小さな 原っぱ）: 千年前 … 空の ようさいから おろされた いかりと くさり / 今 … 森に おちた ようさいの 残がいの 出入り口
export const ENTRANCE8C = { x: 116, y: 33 };
// 今の 残がいの 鉄の 板（出入り口の まわり。c8_sky から 見える）
export const WRECK8C = [[114, 32], [115, 32], [117, 32], [118, 32], [115, 33], [117, 33], [113, 33]];
