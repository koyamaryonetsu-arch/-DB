// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第7章 Step 1・2（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・ゲストの カリム・宝箱の 中み・時をこえる手紙の ごほうび）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch7.md の「実装メモ（A … 世界と物語。第7章 Step 1・2）」の「まとめる時に消すもの」）:
//   ・maps/c7-temple.js の `import { C7_TREASURE } from '../data/c7-stub.js';`（'../data/items-c7.js' から）
//   ・data/story-c7.js の `import './c7-stub.js';`（行ごと けす）
//   ・data/sidequests-c7.js の `import { C7_LETTER_REWARDS } from './c7-stub.js';`（'./items-c7.js' から）
//   ・test/ch7-step12-a.test.js の `from '../public/js/shared/data/c7-stub.js'`（items-c7.js から）と、漢字の テストの ファイルの 一覧の c7-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c7-stub.js
//
// 名前の 約束（docs/plan-ch7.md の 3）:
//   出現表 t7_kingdom（千年前の コガネの フィールド。Lv68〜70）・t7_temple（神殿。Lv70〜72）
//   きまった 戦い c7_gate（中ボス。Lv70）・c7_temple（神殿の ボス。Lv72）。boss: true・canFlee: false
//   ゲスト KARIM_GUEST（GUESTS.karim）/ 宝箱 C7_TREASURE（神殿の 1〜8階に 2つずつ ★5）/ 時をこえる手紙の ごほうび C7_LETTER_REWARDS
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { GUESTS } from './shops.js';
import { TOKEI_TREASURE_HIGH } from './items-tokei6.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 魔物）
fill(ENCOUNTER_TABLES, { t7_kingdom: ENCOUNTER_TABLES.t6_tower_high, t7_temple: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t7_kingdom: 'past_field', t7_temple: 'toki_ruin' });
// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 第6章に 数える ように、古道の 一らんにも 入れる（stub を けせば 消える。
// B の 出現表は gen-monster-ranks.mjs の CHAPTER_SRC に 第7章として 入れること）
for (const id of ['t7_kingdom', 't7_temple']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];

// きまった 戦い（今は 前の ボス）。曲は boss6
const boss = FIXED_ENCOUNTERS.zenmai?.group || [['geardon', 1, 1]];
fill(FIXED_ENCOUNTERS, {
  c7_gate: { group: FIXED_ENCOUNTERS.carillon?.group || boss, bg: 'past_field', bgm: 'boss6', canFlee: false, boss: true },
  c7_temple: { group: boss, bg: 'toki_ruin', bgm: 'boss6', canFlee: false, boss: true },
});

// ゲストの カリム（千年前の 若い 騎士。たてで みんなを 守る。今は リオンと おなじ 形の 仮）
export const KARIM_GUEST = GUESTS.karim || {
  id: 'guest_karim', name: 'カリム', job: 'paladin', tactics: 'balanced', minLevel: 68,
  look: { body: 0, hair: 0, hairColor: 0, skin: 2, color: 2, style: 'short', hcol: 'black', tone: 'tan', face: 'brave' },
  skills: [],
  gear: { weapon: 'p6_kodai_sword', armor: 'p6_kodai_mail', shield: 'p6_kodai_shield', head: 'p6_kodai_helm' },
};
if (!GUESTS.karim) GUESTS.karim = KARIM_GUEST;

// 宝箱の 中み（B の data/items-c7.js の C7_TREASURE。今は 時計塔 6〜10階の ★5 の 品）
const TT = Object.values(TOKEI_TREASURE_HIGH || {}).flat();
export const C7_TREASURE = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, [TT[(2 * n) % TT.length], TT[(2 * n + 1) % TT.length]]]));

// 時をこえる手紙の ごほうび（B の data/items-c7.js の C7_LETTER_REWARDS。今は 種）
// 形は { 1: [[id, こすう], …], 2: …, 3: … }（data/sidequests-c7.js の letterReward が ならび・{ item, n }・id だけ でも 読む）
export const C7_LETTER_REWARDS = { 1: [['seed_hp', 2]], 2: [['seed_str', 2], ['seed_def', 1]], 3: [['seed_mag', 2], ['seed_agi', 1]] };
