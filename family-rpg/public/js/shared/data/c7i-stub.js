// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第7章 Step 5・6（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・城の 宝箱の 中み・時をこえる手紙の ごほうび）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch7.md の「実装メモ（A … 世界と物語。第7章 Step 5・6）」の「まとめる時に消すもの」）:
//   ・maps/c7i-castle.js の `import { C7I_TREASURE } from '../data/c7i-stub.js';`（'../data/items-c7i.js' から）
//   ・data/sidequests-c7i.js の `import { C7I_LETTER_REWARDS } from './c7i-stub.js';`（'./items-c7i.js' から）
//   ・test/ch7-step56-a.test.js の `from '../public/js/shared/data/c7i-stub.js'`（B の items-c7i.js から）と、漢字の テストの ファイルの 一覧の c7i-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c7i-stub.js
//
// 名前の 約束（docs/plan-ch7.md の 8-2）:
//   出現表 t7_snow（千年前の シロガネの フィールド。Lv76〜78）・t7_castle（城。Lv78〜80）
//   きまった 戦い c7_witch（中ボス いばらの魔女マレフィナ。Lv78。2だん）・c7_shadow（さいごの ボス カイの影。Lv80）。boss: true・canFlee: false
//   宝箱 C7I_TREASURE（城の 1〜8階に 2つずつ。★5 装備 1つ・素材か 道具 1つ）/ 時をこえる手紙の ごほうび C7I_LETTER_REWARDS
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { C7S_TREASURE } from './items-c7s.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 魔物。第1幕・第2幕の stub と おなじ）
fill(ENCOUNTER_TABLES, { t7_snow: ENCOUNTER_TABLES.t6_tower_high, t7_castle: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t7_snow: 'past_field', t7_castle: 'tower' });
// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 第6章に 数える ように、古道の 一らんにも 入れる（stub を けせば 消える。
// B の 出現表は gen-monster-ranks.mjs の CHAPTER_SRC の 第7章に 入れること。ENCOUNTERS_C7・ENCOUNTERS_C7S の 名前は test/ch7-step12-b.test.js・ch7-step34-b.test.js が 見るので さわらない）
for (const id of ['t7_snow', 't7_castle']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];
// きまった 戦い（今は 第2幕の ボス）。曲は boss6
fill(FIXED_ENCOUNTERS, {
  c7_witch: { group: FIXED_ENCOUNTERS.c7_light?.group || [['geardon', 1, 1]], bg: 'past_field', bgm: 'boss6', canFlee: false, boss: true },
  c7_shadow: { group: FIXED_ENCOUNTERS.c7_temple?.group || [['geardon', 1, 1]], bg: 'tower', bgm: 'boss6', canFlee: false, boss: true },
});

// 城の 宝箱の 中み（B の data/items-c7i.js の C7I_TREASURE。今は 第2幕の 灯台の ★5 の 品 1つと 素材 1つ）
export const C7I_TREASURE = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, [C7S_TREASURE[n]?.[0] || 'star_shard', ['star_shard', 2]]]));

// 時をこえる手紙の ごほうび（B の data/items-c7i.js の C7I_LETTER_REWARDS。今は 種）
// 形は { 1: [[id, こすう], …], 2: …, 3: … }・id の ならび でも よい（data/sidequests-c7i.js の letterReward7i が どれでも 読む）
export const C7I_LETTER_REWARDS = { 1: [['seed_hp', 2]], 2: [['seed_str', 2], ['seed_def', 1]], 3: [['seed_mag', 2], ['seed_agi', 1]] };
