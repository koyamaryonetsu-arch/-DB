// 第7章 Step 5・6（A: 世界と物語。第3幕「ひとりぼっちの星」）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch7.md の 8）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch7.md の 8-2 の 名前の 約束。data/story-c7.js の CH7_STEPS の c7_kai の うしろ）─────
export const C7I = { snow: 'c7_snow', frost: 'c7_frost', witch: 'c7_witch', icecastle: 'c7_icecastle', clear: 'c7_clear' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE7I = 'c7i_arrive'; // はじめて 千年前の シロガネ地方に 来た
export const CF7 = (n) => (n === 1 ? C7I.icecastle : `c7i_f${n}`); // 城の その 階に 来た（1階は c7_icecastle と 同時）
export const KAI4 = 'c7i_kai4'; // 4階の いずみで カイに 追いついた（カイは さきに 上へ）
export const SHADOW7 = 'c7i_shadow7'; // 7階の 休み所で カイの 影の 声を 聞いた
export const WIN7I = 'c7i_swin'; // さいごの ボス（カイの影）に 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）
export const DRAGON7I = 'c7i_dragon'; // 氷の竜が 目を さました（城の 場面を 見おえた。のこりは 里の 場面）

// ───── 時をこえる手紙（data/sidequests-c7i.js。1〜3 … より道・4 … 城 5階の なぞとき）─────
export const LETTER7I = {
  start: (k) => `c7i_l${k}_start`, // たのまれた（4 … 雪の精が 竜の 名前の 手紙を 書いてくれた）
  bury: (k) => `c7i_l${k}_bury`, // 千年前で うめた（4 … 竜の とびらの よこの 氷の 箱に 入れた）
  found: (k) => `c7i_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER7I_KEYS = [1, 2, 3, 4];
export const LETTER7I_SIDE = [1, 2, 3]; // より道の 手紙（ごほうびは B の C7I_LETTER_REWARDS）
export const LETTER7I_CASTLE = 4; // 城 5階の 竜の とびらの 手紙
export const SPIRIT_LETTER = 'c7i_spirit_letter'; // 大事な物「雪の精の手紙」（氷の 箱に 入れると なくなる）

// ───── マップの ID ─────
export const C7I_SNOW = 'c7i_snow'; // 千年前の シロガネ地方（今の north と おなじ 大きさ・おなじ 座標）
export const PRESENT_SNOW = 'north'; // 今の シロガネ地方（第3章）
export const c7icMapId = (n, now = false) => `c7i_castle_${n}f${now ? '_now' : ''}`;
export const C7IC_FLOORS = 8;
export const C7IC_NOW_FLOORS = 7; // 今の がわ（城あと）が ある 階。8階は 千年前だけ
export const C7IC_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C7IC_BOSS_FLOOR = 8;

// ───── 千年前の シロガネ地方の だいじな 場所（今の 地図と おなじ 座標）─────
// 白雪の里（竜守りの村の はじまり。今の 竜守りの村〈48,42 32×25〉の まん中。22×14。maps/c7i-village-rows.js）
export const VILLAGE7I = { x: 53, y: 47, w: 22, h: 14, name: '白雪の里' };
// 氷の竜の城（今の 竜の試練の神殿〈38,21 17×11〉と おなじ 場所。のちに 城あとの 上に 神殿が 建つ）
export const CASTLE_WALL = { x: 37, y: 18, w: 19, h: 12 };
export const CASTLE_DOOR = { x: 46, y: 29 };
export const CASTLE_OUT = { x: 46.5, y: 31.5 }; // 城から 出て 着く ところ
// 城の 前の いばら（いばらの魔女マレフィナの のろい。中ボスに 勝つと 消える。今の 神殿の 前の ふしぎな 炎と おなじ 所）
export const THORNS = { y: 30, x: [44, 49] };
// 魔女が 待ちぶせる 城の 前の 雪の 広場（ここに 入ると 中ボスの 場面）
export const WITCH_ZONE = { x: 38, y: 32, w: 20, h: 3 };
export const WITCH_POS = { x: 46, y: 31 }; // 魔女（大きな 人の え）
