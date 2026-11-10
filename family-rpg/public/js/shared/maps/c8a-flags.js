// 第8章 第1幕「月の王宮のうらぎり」（Step 1・2。A: 世界と物語）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch8.md の 5）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch8.md の 5-2 の 名前の 約束。data/story-c8.js の CH8_STEPS。c7_clear の うしろ）─────
export const C8 = { start: 'c8_start', kingdom: 'c8_kingdom', moon: 'c8_moon', pet: 'c8_pet', deep: 'c8_deep', jafar: 'c8_jafar' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE8 = 'c8a_arrive'; // 第8章で はじめて 千年前の コガネ地方に 来た
export const ENTRY8 = 'c8a_entry'; // 王の間の 月の 石板が 開いた（地下への かいだんが あらわれた。千年前）
// 地下迷宮の その 階に 来た（1階は c8_moon・5階は c8_deep と 同時）
export const PF8 = (n) => (n === 1 ? C8.moon : n === 5 ? C8.deep : `c8a_f${n}`);
export const NADIA4 = 'c8a_nadia4'; // 4階の 休み所で 王女ナディアに 会った
export const VOICE7 = 'c8a_voice7'; // 7階の 休み所の 入口で 大臣の 声を 聞いた
export const WIN8 = 'c8a_win'; // 大臣ジャハールに 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）
export const KING8 = 'c8a_king'; // 王さまが 目を さました（地下の 場面を 見おえた。のこりは 王の間の 場面）

// ───── 月の 鏡（千年前で 回す。むきは その まま 千年 のこる → 今の 月の 光の 橋）─────
// 階 n の k ばんめの 鏡（上の 行から・左から）のフラグ。たっている … 「＼」・たっていない … 「／」（はじめ）
export const MIRROR8 = (n, k) => `c8a_m${n}_${k}`;

// ───── 時をこえる手紙（data/sidequests-c8a.js。1・2 … より道・3 … 地下迷宮 5階の なぞとき）─────
export const LETTER8 = {
  start: (k) => `c8a_l${k}_start`, // たのまれた（3 … 王女ナディアが 手紙を 書いてくれた）
  bury: (k) => `c8a_l${k}_bury`, // 千年前で うめた（3 … 月の 箱に 入れた）
  found: (k) => `c8a_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER8_KEYS = [1, 2, 3];
export const LETTER8_SIDE = [1, 2]; // より道の 手紙
export const LETTER8_PALACE = 3; // 地下迷宮 5階の 月の 門の 手紙
export const NADIA_LETTER = 'c8a_nadia_letter'; // 大事な物「王女ナディアの手紙」（月の 箱に 入れると なくなる）

// ───── マップの ID ─────
export const C7_FIELD_ID = 'c7_field'; // 千年前の コガネ地方（第7章。緑の王国が ある）
export const SOUTH_ID = 'south'; // 今の コガネ地方（第4章。王都サファラが ある）
export const c8aMapId = (n, now = false) => `c8a_palace_${n}f${now ? '_now' : ''}`;
export const C8A_FLOORS = 8;
export const C8A_NOW_FLOORS = 7; // 今の がわ（サファラの 宮殿の 地下）が ある 階。8階は 千年前だけ
export const C8A_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C8A_BOSS_FLOOR = 8;
export const C8A_PET_FLOOR = 4; // オウムのイアゴンが 待つ 階（Step 1 の さいご）

// ───── 王国（王都）の 中の だいじな 場所（千年前の 緑の王国と 今の 王都サファラは おなじ 場所・おなじ ならび）─────
const KX = 15, KY = 84; // 緑の王国・王都サファラの 左上（maps/c7-flags.js の KINGDOM・south.js の SOUTH_PLACES.safara）
const K = (x, y) => ({ x: KX + x, y: KY + y });
// 王の間の 東の すみの 月の 石板（千年前 … 王家の たてで 開くと 地下への かいだん / 今 … 宮殿の 王の間の おなじ 所。c8_moon の あと 開く）
export const STAIR8 = K(33, 28);
export const THRONE8 = K(25, 26); // 王の いす（緑の王）
export const HALL8 = K(25, 24); // 王の 前（さいしょの 場面で 立つ 所）
export const JAHAR8 = K(27, 25); // 大臣ジャハール（王の 右）
export const KINGDOM_IN8 = K(25, 13); // 王国の まん中（大通り）
