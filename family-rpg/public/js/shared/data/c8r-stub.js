// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第8章 第4幕 Step 7・8（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・宝箱の 中み・ゲスト 4人）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch8.md の「実装メモ（A … 世界と物語。第8章 第4幕）」の「まとめる時に消すもの」）:
//   ・maps/c8r-wings.js の `import * as ITEMS8R from '../data/c8r-stub.js';`（'../data/items-c8r.js' から。C8R_TREASURE を 読む）
//   ・data/story-c8r.js の `import './c8r-stub.js';`（行ごと けす）
//   ・test/ch8-step78-a.test.js の `'../public/js/shared/data/c8r-stub.js'`（B の items-c8r.js から）と、漢字の テストの ファイルの 一覧の c8r-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の c8r-stub.js
//
// 名前の 約束（docs/plan-ch8.md の 9-2）:
//   出現表 t8r_wing（つばさ。Lv89〜91）・t8r_last（回廊。Lv92〜94）
//   きまった 戦い c8_gate1・c8_gate2（門番。とちゅうで 終わる）・c8_gatekeeper（Lv92）・c8_trial_guard（守りぬく）・c8_trial_duel（一騎うち）・c8_solitus（Lv95。3だん）
//   宝箱 C8R_TREASURE（{ 階の 名前: [★5 装備, 素材か 道具] }。階の 名前は moon1・moon2・fire1・fire2・iron1・iron2・ice1・ice2・last1・last2・last3）
//   ゲスト GUESTS.karim8r・kai8・minamo8・rion8（data/shops.js）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { C8C_TREASURE, C8C_TREASURE_N } from './items-c8c.js';
import { GUESTS } from './shops.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時計塔 6〜10階の 表。第3幕の stub と おなじ。第8章の 魔物の 表を 使うと 魔物の 章わけが かわるので 使わない）
fill(ENCOUNTER_TABLES, { t8r_wing: ENCOUNTER_TABLES.t6_tower_high, t8r_last: ENCOUNTER_TABLES.t6_tower_high });
fill(ZONE_BG, { t8r_wing: 'tower', t8r_last: 'tower' });
for (const id of ['t8r_wing', 't8r_last']) if (ENCOUNTERS_ROAD && !(id in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD[id] = ENCOUNTER_TABLES[id];
// きまった 戦い（今は 第8章 第3幕の ボス）。曲は boss6
const boss = (from) => ({ group: FIXED_ENCOUNTERS[from]?.group || [['geardon', 1, 1]], bg: 'tower', bgm: 'boss6', canFlee: false, boss: true });
fill(FIXED_ENCOUNTERS, {
  c8_gate1: boss('c8_kamek'),
  c8_gate2: boss('c8_kamek'),
  c8_gatekeeper: boss('c8_bowser'),
  c8_trial_guard: boss('c8_kamek'),
  c8_trial_duel: boss('c8_kamek'),
  c8_solitus: boss('c8_bowser'),
});
// ゲスト（今は 第7章・第6章の すがたの まま。B が 第8章 第4幕の 装備で 作る）
if (!GUESTS.karim8r && GUESTS.karim) GUESTS.karim8r = { ...GUESTS.karim, id: 'guest_karim8r', minLevel: 89, maxLevel: 97 };
if (!GUESTS.minamo8 && GUESTS.minamo) GUESTS.minamo8 = { ...GUESTS.minamo, id: 'guest_minamo8', minLevel: 89, maxLevel: 97 };
if (!GUESTS.kai8 && GUESTS.kai) GUESTS.kai8 = { ...GUESTS.kai, id: 'guest_kai8', minLevel: 89 };
if (!GUESTS.rion8 && GUESTS.rion) GUESTS.rion8 = { ...GUESTS.rion, id: 'guest_rion8', minLevel: 89 };

// 宝箱の 中み（B の data/items-c8r.js の C8R_TREASURE。今は 第3幕の 品）
const pick = (n) => C8C_TREASURE[n].map((id, k) => (k === 0 ? id : [id, C8C_TREASURE_N[n]?.[k] || 1]));
export const C8R_TREASURE = {
  moon1: pick(1), moon2: pick(2), fire1: pick(3), fire2: pick(4), iron1: pick(5), iron2: pick(6), ice1: pick(7), ice2: pick(8),
  last1: pick(5), last2: pick(6), last3: pick(7),
};
