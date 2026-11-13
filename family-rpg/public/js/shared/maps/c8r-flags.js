// 第8章 第4幕「時のはざま」（Step 7・8。A: 世界と物語）の フラグ・マップの ID・だいじな 場所（ほかの ファイルを 読まない。maps と data と world の どれからも 読む）
// ※ ネタバレ注意（docs/plan-ch8.md の 7-3・9）。フラグは セーブに のこるので かえない

// ───── 物語の すすみぐあい（plan-ch8.md の 9-2 の 名前の 約束。data/story-c8.js の CH8_STEPS。c8_bowser の うしろ）─────
export const C8R = {
  rift: 'c8_rift', // 今の ほしみの丘の トキネの 話（砂時計が どこでもない 所で 鳴る）
  hall: 'c8_hall', // 時の広間に 着いた・4人 そろう
  wings1: 'c8_wings1', // つばさ 1つ・門番 1回目の あと
  wings2: 'c8_wings2',
  wings3: 'c8_wings3', // 門番 2回目の あと
  wings4: 'c8_wings4',
  gatekeeper: 'c8_gatekeeper', // 時の門番フリーゾンを たおした（Step 7 の さいご）
  corridor: 'c8_corridor', // 最後の 回廊へ
  gather: 'c8_gather', // 第1部の 仲間が かけつけた
  solitus: 'c8_solitus', // 第8章 クリア・第2部 完
};

// ───── つばさごとの しるし（順は 自由。ためしを クリアすると つく。家族で 同時）─────
export const WINGS = ['moon', 'fire', 'iron', 'ice'];
export const WING_MARK = { moon: 'c8w_moon', fire: 'c8w_fire', iron: 'c8w_iron', ice: 'c8w_ice' };
export const WING_NAME = { moon: '月のつばさ', fire: '青火のつばさ', iron: 'くろがねのつばさ', ice: '氷のつばさ' };
// その つばさの 勇者（ゲストの id・名前）
export const WING_HERO = { moon: 'karim', fire: 'kai', iron: 'minamo', ice: 'rion' };
export const HERO_NAME = { karim: 'カリム', kai: 'カイ', minamo: 'ミナモ', rion: 'リオン' };
export const HERO_GUEST = { karim: 'karim8r', kai: 'kai8', minamo: 'minamo8', rion: 'rion8' };
export const wingCount = (has) => WINGS.filter((w) => has(WING_MARK[w])).length;

// ───── 物語の すすみぐあいでは ない フラグ ─────
export const ARRIVE8R = 'c8r_arrive'; // 第4幕で はじめて 時の広間に 来た（章の 字を 見た。冒険のしおりの 幕の 名前）
export const GATE_DUE8R = 'c8r_gate_due'; // つばさの しるしが ふえた（広間に もどると 門番の 場面）
export const WIN_GATE8R = 'c8r_gate_win'; // 門番に 勝った（さいごの 場面の とちゅうで 切れた ときの 続き）
export const CORE8R = 'c8r_core_in'; // さいごの 場所に 着いた
export const WIN_SOL8R = 'c8r_sol_win'; // ソリトゥスに 勝った（エンディングの とちゅうで 切れた ときの 続き）
export const SEAL8R = 'c8r_sealed'; // 千年前の ふういんの 場面を 見おえた（のこりは 今の ほしみの丘）
// ためしの 前の 場面を 見た（勇者の 見せ場）
export const TRIAL_SEEN8R = (w) => `c8r_t_${w}`;
// 階に 来た（その 階の はじめの ことば）
export const FLOOR_SEEN8R = (fk) => `c8r_f_${fk}`;

// ───── しかけの フラグ（階ごと。千年前と 今で おなじ フラグ）─────
// fk … 階の 名前（'moon1'・'fire2'・'last3' など）
export const MIR8R = (fk, k) => `c8r_${fk}_m${k}`; // 鏡を 回した（月の 鏡。どちらの 時代でも 回せる）
export const FIRE8R = (fk, k) => `c8r_${fk}_f${k}`; // 青い 火が ともっている（歩くと 消える）
export const DEV8R = (fk, k) => `c8r_${fk}_d${k}`; // くろがねの しかけを 動かした（千年前だけ 動かせる）
// 追いかけっこ（青火のつばさ）: j ばんめの 場所に 青い 火が 来た（じゅんに たつ。やり直すと ぜんぶ 消える）
export const CHASE8R = (j) => `c8r_chase_${j}`;
// 星読みの なぞ（くろがねのつばさ）: k ばんめの レバーを 引いた・まちがえた 回数
export const STAR8R = (k) => `c8r_star_${k}`;
export const MISS8R = (n) => `c8r_miss${n}`;

// ───── マップの ID ─────
export const HALL_ID = 'c8r_hall';
export const CORE_ID = 'c8r_core';
export const NOW_FIELD_ID = 'overworld'; // 今の ミドリナ地方（ほしみの丘の 時の さけめ）
export const wingMapId = (w, n, now = false) => `c8r_${w}_${n}${now ? '_now' : ''}`;
export const lastMapId = (n, now = false) => `c8r_last_${n}${now ? '_now' : ''}`;
export const WING_FLOORS = 2;
export const LAST_FLOORS = 3;
// 階の 名前（しかけの フラグ・宝箱の id に 使う）
export const floorKey = (w, n) => `${w}${n}`;
