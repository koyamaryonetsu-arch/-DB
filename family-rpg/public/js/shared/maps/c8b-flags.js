// 第8章 第2幕「よみの青い火」（Step 3・4。A: 世界と物語）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data の 両方から 読む）
// ※ ネタバレ注意（docs/plan-ch8.md の 6）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch8.md の 6-2 の 名前の 約束。data/story-c8.js の CH8_STEPS。c8_jafar の うしろ）─────
export const C8B = { sea: 'c8_sea', abyss: 'c8_abyss', temple: 'c8_temple', imps: 'c8_imps', depth: 'c8_depth', hades: 'c8_hades' };

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE8B = 'c8b_arrive'; // 第2幕で はじめて 千年前の クモイの 海に 来た
export const ENTRY8B = 'c8b_entry'; // うずしおの岩場の 青い うずが 開いた（海の 底への かいだん。千年前）
// 海底神殿の その 階に 来た（1階は c8_temple・5階は c8_depth と 同時）
export const PF8B = (n) => (n === 1 ? C8B.temple : n === 5 ? C8B.depth : `c8b_f${n}`);
export const MIKO8B = 'c8b_miko4'; // 4階の 休み所で 海のほこらの みこに 会った
export const VOICE8B = 'c8b_voice7'; // 7階の 休み所で よみの王の 声を 聞いた
export const WIN8B = 'c8b_win'; // よみの王ハデロスに 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）
export const CALM8B = 'c8b_calm'; // 海の 底の 場面を 見おえた（のこりは ナギの村の 場面）

// ───── 青い 火の 台（千年前で ともす。よみの 火は 千年 消えない → 今の 時代で その 光の とどく 所だけ「よみの道」が 見える）─────
// 階 n の k ばんめの 台（上の 行から・左から）が ともっている
export const FIRE8B = (n, k) => `c8b_b${n}_${k}`;
// その 階で 同時に ともせる 火の 数（火種。たりない ときは、ともっている 火を 1つ うつす）
export const FIRE_LIMIT8B = { 1: 1, 2: 1, 3: 1, 5: 1, 6: 1, 7: 2 };
// 台の 光の とどく はんい（台の まん中から この きょりの 2じょう いない）
export const LIGHT_R2 = 10;

// ───── 時をこえる手紙（data/sidequests-c8b.js。1・2 … より道・3 … 海底神殿 5階の なぞとき）─────
export const LETTER8B = {
  start: (k) => `c8b_l${k}_start`, // たのまれた（3 … みこが 手紙を 書いてくれた）
  bury: (k) => `c8b_l${k}_bury`, // 千年前で うめた（3 … 貝の 箱に 入れた）
  found: (k) => `c8b_l${k}_found`, // 今で 見つけた（ごほうびは この 時に 1回だけ）
};
export const LETTER8B_KEYS = [1, 2, 3];
export const LETTER8B_SIDE = [1, 2]; // より道の 手紙
export const LETTER8B_TEMPLE = 3; // 海底神殿 5階の しおの とびらの 手紙
export const MIKO_LETTER8B = 'c8b_miko_letter'; // 大事な物「みこの祝いの手紙」（貝の 箱に 入れると なくなる）

// ───── マップの ID ─────
export const C7S_SEA_ID = 'c7s_sea'; // 千年前の クモイの 海（第7章。ナギの村が ある）
export const KUMOI_ID = 'kumoi'; // 今の クモイ地方（第5章）
export const c8bMapId = (n, now = false) => `c8b_temple_${n}f${now ? '_now' : ''}`;
export const C8B_FLOORS = 8;
export const C8B_NOW_FLOORS = 7; // 今の がわ（空に うかんだ 海底神殿の あと）が ある 階。8階は 千年前だけ
export const C8B_REST = [4, 7]; // 休み所（いずみ）の ある 階
export const C8B_BOSS_FLOOR = 8;
export const C8B_IMPS_FLOOR = 4; // ペイニックと パニクルが 待つ 階（Step 3 の さいご）

// ───── 千年前の クモイの 海の だいじな 場所（今の 地図と おなじ 座標）─────
// うずしおの岩場（千年前。海底神殿の 真上の あさせ）＝ 今の「雲から出てきた島」（海の 底が 空へ うかんだ 所。maps/kumoi.js の KUMOI_ISLES.rise）
export const SHOAL8B = { cx: 40, cy: 50.5, rx: 4, ry: 3 };
export const ENTRANCE8B = { x: 40, y: 49 }; // 千年前 … 青い うず（開くと 海の 底への かいだん）/ 今 … 貝の もようの 石の とびら（c8_temple の あと 開く）
// 大木の島（今の 根の島）の 西の はしから うずしおの岩場へ 西に 流れる しお・岩場から 北へ 流れて 東への しお（w6）に 合流する しお
export const SHOAL_CUR_IN = { y: 51, x0: 44, x1: 53 }; // 西へ（x1 → x0）
export const SHOAL_CUR_OUT = { x: 40, y0: 45, y1: 47 }; // 北へ（y1 → y0。40,44 の 東への しおへ）
