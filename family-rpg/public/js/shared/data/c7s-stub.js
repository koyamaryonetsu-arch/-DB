// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第7章 Step 3・4（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・ゲストと 酒場の カイ・灯台の 宝箱の 中み・時をこえる手紙の ごほうび）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch7.md の「実装メモ（A … 世界と物語。第7章 Step 3・4）」の「まとめる時に消すもの」）:
//   ・maps/c7s-light.js の `import { C7S_TREASURE } from '../data/c7s-stub.js';`（'../data/items-c7s.js' から）
//   ・data/story-c7s.js の `import { KAI_SUPPORT } from './c7s-stub.js';`（B の 酒場の カイの ファイル〈companions-c7s.js など〉から）
//   ・data/sidequests-c7s.js の `import { C7S_LETTER_REWARDS } from './c7s-stub.js';`（'./items-c7s.js' から）
//   ・test/ch7-step34-a.test.js の `from '../public/js/shared/data/c7s-stub.js'`（B の ファイルから）と、漢字の テストの ファイルの 一覧の c7s-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c7s-stub.js
//
// 名前の 約束（docs/plan-ch7.md の 4-3）:
//   出現表 t7_sea（千年前の 海の フィールド。Lv72〜74）・t7_light（灯台。Lv74〜76）
//   きまった 戦い c7_reef（中ボス。Lv74）・c7_light（灯台の ボス。Lv76）。boss: true・canFlee: false
//   ゲスト KAI_GUEST（GUESTS.kai）・酒場 KAI_SUPPORT（unlock: 'c7_kai'）/ 宝箱 C7S_TREASURE（灯台の 1〜8階に 2つずつ。★5 装備 1つ・素材か 道具 1つ）/
//   時をこえる手紙の ごほうび C7S_LETTER_REWARDS
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { GUESTS } from './shops.js';
import { C7_TREASURE } from './items-c7.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 魔物。第1幕の stub と おなじ）
fill(ENCOUNTER_TABLES, { t7_sea: ENCOUNTER_TABLES.t6_tower_high, t7_light: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t7_sea: 'past_field', t7_light: 'sand_temple' });
// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 第6章に 数える ように、古道の 一らんにも 入れる（stub を けせば 消える。
// B の 出現表は gen-monster-ranks.mjs の CHAPTER_SRC の 第7章に 入れること。第1幕の ENCOUNTERS_C7 の 名前は test/ch7-step12-b.test.js が 見るので さわらない）
for (const id of ['t7_sea', 't7_light']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];
// きまった 戦い（今は 第1幕の ボス）。曲は boss6
fill(FIXED_ENCOUNTERS, {
  c7_reef: { group: FIXED_ENCOUNTERS.c7_gate?.group || [['geardon', 1, 1]], bg: 'past_field', bgm: 'boss6', canFlee: false, boss: true },
  c7_light: { group: FIXED_ENCOUNTERS.c7_temple?.group || [['geardon', 1, 1]], bg: 'morgana_hall', bgm: 'boss6', canFlee: false, boss: true },
});

// ゲストの カイ（千年前の 海の 小さな 島の 少年。明るくて 素早い。今は カリムと おなじ 形の 仮）
export const KAI_GUEST = GUESTS.kai || {
  id: 'guest_kai', name: 'カイ', job: 'ninja', tactics: 'aggressive', minLevel: 72,
  look: { body: 0, hair: 1, hairColor: 1, skin: 2, color: 3, style: 'spiky', hcol: 'brown', tone: 'tan', face: 'happy' },
  skills: [],
  gear: { weapon: 'p6_kodai_boomerang', armor: 'p6_kodai_gi', head: 'c7_kingdom_hat' },
};
if (!GUESTS.kai) GUESTS.kai = KAI_GUEST;
// 仲間に なった あとの 酒場の カイ（c7_kai から。A が 台本で NPC_SUPPORTS に ならべる）
export const KAI_SUPPORT = {
  ...GUESTS.kai, id: 'npc_kai', minLevel: 74, unlock: 'c7_kai',
  desc: '千年前の海の小さな島の少年。いつも明るくて、だれよりも身軽。未来のルミナの町で、みんなと旅に出るのを待っている。',
};

// 灯台の 宝箱の 中み（B の data/items-c7s.js の C7S_TREASURE。今は 第1幕の 神殿の ★5 の 品 1つと 素材 1つ）
export const C7S_TREASURE = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, [C7_TREASURE[n]?.[0] || 'star_shard', ['star_shard', 2]]]));

// 時をこえる手紙の ごほうび（B の data/items-c7s.js の C7S_LETTER_REWARDS。今は 種）
// 形は { 1: [[id, こすう], …], 2: …, 3: … }・id の ならび でも よい（data/sidequests-c7s.js の letterReward7s が どれでも 読む）
export const C7S_LETTER_REWARDS = { 1: [['seed_hp', 2]], 2: [['seed_str', 2], ['seed_def', 1]], 3: [['seed_mag', 2], ['seed_agi', 1]] };
