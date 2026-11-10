// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第8章 第1幕 Step 1・2（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・地下迷宮の 宝箱の 中み・時をこえる手紙の ごほうび）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch8.md の「実装メモ（A … 世界と物語。第8章 第1幕）」の「まとめる時に消すもの」）:
//   ・maps/c8a-palace.js の `import { C8A_TREASURE } from '../data/c8a-stub.js';`（'../data/items-c8a.js' から）
//   ・data/sidequests-c8a.js の `import { C8A_LETTER_REWARDS } from './c8a-stub.js';`（'./items-c8a.js' から）
//   ・data/story-c8.js の `import './c8a-stub.js';`（行ごと けす）
//   ・test/ch8-step12-a.test.js の `from '../public/js/shared/data/c8a-stub.js'`（B の items-c8a.js から）と、漢字の テストの ファイルの 一覧の c8a-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c8a-stub.js
//
// 名前の 約束（docs/plan-ch8.md の 5-2）:
//   出現表 t8a_palace（地下迷宮 1〜4階。Lv80〜82）・t8a_deep（5〜8階。Lv82〜84）
//   きまった 戦い c8_vizier_pet（オウムのイアゴン。Lv81）・c8_jafar（大臣ジャハール。Lv83。3だん）。boss: true・canFlee: false
//   宝箱 C8A_TREASURE（1〜8階に 2つずつ。★5 装備 1つ・素材か 道具 1つ）/ 時をこえる手紙の ごほうび C8A_LETTER_REWARDS（3つ）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { C7I_TREASURE, C7I_LETTER_REWARDS } from './items-c7i.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 魔物。第7章の stub と おなじ。第7章の 魔物の 表を 使うと 章わけが かわるので 使わない）
fill(ENCOUNTER_TABLES, { t8a_palace: ENCOUNTER_TABLES.t6_tower_high, t8a_deep: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t8a_palace: 'tower', t8a_deep: 'tower' });
// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 数える ように、古道の 一らんにも 入れる（stub を けせば 消える）
for (const id of ['t8a_palace', 't8a_deep']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];
// きまった 戦い（今は 第7章 第3幕の ボス）。曲は boss6
fill(FIXED_ENCOUNTERS, {
  c8_vizier_pet: { group: FIXED_ENCOUNTERS.c7_witch?.group || [['geardon', 1, 1]], bg: 'ice_cave', bgm: 'boss6', canFlee: false, boss: true },
  c8_jafar: { group: FIXED_ENCOUNTERS.c7_shadow?.group || [['geardon', 1, 1]], bg: 'ice_cave', bgm: 'boss6', canFlee: false, boss: true },
});

// 地下迷宮の 宝箱の 中み（B の data/items-c8a.js の C8A_TREASURE。今は 第7章 第3幕の 品）
export const C8A_TREASURE = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, C7I_TREASURE[n] || ['star_shard', 'star_shard']]));

// 時をこえる手紙の ごほうび（B の data/items-c8a.js の C8A_LETTER_REWARDS。今は 第7章 第3幕の 品）
// 形は { 1: [[id, こすう], …], 2: …, 3: … }・id の ならび でも よい（data/sidequests-c8a.js の letterReward8 が どれでも 読む）
export const C8A_LETTER_REWARDS = { 1: C7I_LETTER_REWARDS[1], 2: C7I_LETTER_REWARDS[2], 3: C7I_LETTER_REWARDS[3] };
