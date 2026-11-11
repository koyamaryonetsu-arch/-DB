// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第8章 第3幕 Step 5・6（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・ようさいの 宝箱の 中み・時をこえる手紙の ごほうび・ゲストの リオン）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch8.md の「実装メモ（A … 世界と物語。第8章 第3幕）」の「まとめる時に消すもの」）:
//   ・maps/c8c-fort.js の `import * as ITEMS8C from '../data/c8c-stub.js';`（'../data/items-c8c.js' から）
//   ・data/sidequests-c8c.js の `import { C8C_LETTER_REWARDS } from './c8c-stub.js';`（'./items-c8c.js' から）
//   ・data/story-c8c.js の `import './c8c-stub.js';`（行ごと けす）
//   ・test/ch8-step56-a.test.js の `from '../public/js/shared/data/c8c-stub.js'`（B の items-c8c.js から）と、漢字の テストの ファイルの 一覧の c8c-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c8c-stub.js
//
// 名前の 約束（docs/plan-ch8.md の 8-2）:
//   出現表 t8c_fort（ようさい 1〜4階。Lv86〜88）・t8c_deep（5〜8階。Lv88〜90）
//   きまった 戦い c8_kamek（マジカメック。Lv88）・c8_bowser（初代大魔王クッパード。Lv90。2だん）。boss: true・canFlee: false
//   宝箱 C8C_TREASURE（1〜8階に 2つずつ。★5 装備 1つ・素材か 道具 1つ）/ 時をこえる手紙の ごほうび C8C_LETTER_REWARDS（3つ）
//   ゲスト GUESTS.rion8（data/shops.js。第8章の 装備の リオン）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { C8B_TREASURE, C8B_TREASURE_N, C8B_LETTER_REWARDS } from './items-c8b.js';
import { GUESTS } from './shops.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 表。第1・2幕の stub と おなじ。第8章の 魔物の 表を 使うと 魔物の 章わけが かわるので 使わない）
fill(ENCOUNTER_TABLES, { t8c_fort: ENCOUNTER_TABLES.t6_tower_high, t8c_deep: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t8c_fort: 'tower', t8c_deep: 'tower' });
// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 数える ように、古道の 一らんにも 入れる（stub を けせば 消える）
for (const id of ['t8c_fort', 't8c_deep']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];
// きまった 戦い（今は 第8章 第2幕の ボス）。曲は boss6
fill(FIXED_ENCOUNTERS, {
  c8_kamek: { group: FIXED_ENCOUNTERS.c8_painpanic?.group || [['geardon', 1, 1]], bg: 'tower', bgm: 'boss6', canFlee: false, boss: true },
  c8_bowser: { group: FIXED_ENCOUNTERS.c8_hades?.group || [['geardon', 1, 1]], bg: 'tower', bgm: 'boss6', canFlee: false, boss: true },
});
// ゲスト（今は 第6章の リオンの まま。B が 第8章の 装備で 作る）
if (!GUESTS.rion8 && GUESTS.rion) GUESTS.rion8 = { ...GUESTS.rion, id: 'guest_rion8', minLevel: 88 };

// ようさいの 宝箱の 中み（B の data/items-c8c.js の C8C_TREASURE。今は 第8章 第2幕の 品）
export const C8C_TREASURE = { ...C8B_TREASURE };
export const C8C_TREASURE_N = { ...C8B_TREASURE_N };

// 時をこえる手紙の ごほうび（B の data/items-c8c.js の C8C_LETTER_REWARDS。今は 第8章 第2幕の 品）
// 形は { 1: [[id, こすう], …], 2: …, 3: … }・id の ならび でも よい（data/sidequests-c8c.js の letterReward8c が どれでも 読む）
export const C8C_LETTER_REWARDS = { 1: C8B_LETTER_REWARDS[1], 2: C8B_LETTER_REWARDS[2], 3: C8B_LETTER_REWARDS[3] };
