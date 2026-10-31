// 第7章 Step 1・2（A: 世界と物語）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch7.md の 3）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch7.md の 3 の 名前の 約束。data/story-c7.js の CH7_STEPS）─────
export const C7 = { start: 'c7_start', kingdom: 'c7_kingdom', gate: 'c7_gate', temple: 'c7_temple', karim: 'c7_karim' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE7 = 'c7_arrive'; // はじめて 千年前の コガネ地方に 来た
export const TF7 = (n) => (n === 1 ? C7.temple : `c7_tf${n}`); // 神殿の その 階に 来た（1階は c7_temple と 同時）
export const LEVER3 = 'c7_t3_lever'; // 3階: 千年前の 水門の レバーを 引いた（下の 水路の 水が ひく）
export const OPEN6 = 'c7_t6_open'; // 6階: 2つの 時代の 水の ふむ石で 近道の とびらが 開いた
export const WAIT6 = 'c7_t6_wait'; // 6階: カリムが 千年前の ふむ石の 上で 待っている（ひとりの とき）
export const WIN7 = 'c7_twin'; // 神殿の ボスに 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）

// ───── 時をこえる手紙（data/sidequests-c7.js。1〜3 … より道・4 … 神殿 5階の なぞとき）─────
export const LETTER = {
  start: (k) => `c7_l${k}_start`, // たのまれた（4 … みこに 手紙を 書いてもらった）
  bury: (k) => `c7_l${k}_bury`, // 千年前で うめた（4 … 番人の 石の 箱に 入れた）
  found: (k) => `c7_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER_KEYS = [1, 2, 3, 4];
export const LETTER_SIDE = [1, 2, 3]; // より道の 手紙（ごほうびは B の C7_LETTER_REWARDS）
export const LETTER_TEMPLE = 4; // 神殿 5階の 番人の 手紙
export const MIKO_LETTER = 'c7_miko_letter'; // 大事な物「みこの手紙」（番人の 箱に 入れると なくなる）

// ───── マップの ID ─────
export const C7_FIELD = 'c7_field';
export const PRESENT_FIELD = 'south'; // 今の コガネ地方（第4章）
export const c7tMapId = (n, now = false) => `c7_temple_${n}f${now ? '_now' : ''}`;
export const C7T_FLOORS = 8;
export const C7T_NOW_FLOORS = 7; // 今の がわ（かれた 水の神殿）が ある 階。8階は 千年前だけ
export const C7T_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C7T_BOSS_FLOOR = 8;

// ───── 千年前の コガネ地方の だいじな 場所（今の 地図と おなじ 座標）─────
// 緑の王国（今の 王都サファラの 場所。51×40）
export const KINGDOM = { x: 15, y: 84, w: 51, h: 40, name: '緑の王国' };
// みどりの水の神殿の 外がわ（今の かれた地下水路の 入口の あたり。神殿から 北と 南へ 川が 流れ出る）
export const TEMPLE_WALL = { x: 47, y: 45, w: 11, h: 7 };
export const TEMPLE_DOOR = { x: 52, y: 51 };
export const TEMPLE_OUT = { x: 52.5, y: 52.6 }; // 神殿から 出て 着く ところ
export const TEMPLE_YARD = { x: 46, y: 52, w: 13, h: 6 }; // 神殿の 前の 広場（中ボスが 門を ふさいでいる）
export const GATE_BOSS = { x: 52, y: 54 }; // 中ボスの 大きな 人の え
