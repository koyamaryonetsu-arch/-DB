// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第6章 Step 3・4（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・背景・古道の 宝箱の 中み）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch6.md の「実装メモ（A … 世界と物語。第6章 Step 3・4）」の「まとめる時に消すもの」）:
//   ・maps/hoshimichi.js の `import { ROAD_TREASURE_FLOORS, ROAD_FIELD_TREASURE } from '../data/ch6b-stub.js';`（'../data/items-road.js' から）
//   ・test/ch6-step34.test.js の `from '../public/js/shared/data/ch6b-stub.js'`（items-road.js から）と、漢字の テストの ファイルの 一覧の ch6b-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の ch6b-stub.js
//
// 名前の 約束（docs/plan-ch6.md の 12-1）:
//   出現表 t6_road_up（星めぐりの古道 1〜4階）・t6_road_low（5〜8階）/ きまった 戦い star_eater（星くいのよる鳥）・pendula（ふりこの魔女ペンデュラ）
//   背景 hoshimichi・hoshimichi_deep / 宝箱 ROAD_TREASURE_FLOORS（{ 1: [2こ], …, 8: [2こ] }）・ROAD_FIELD_TREASURE（千年前の 社の まわり 3こ）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { PAST_TREASURE } from './items-past.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 時のいせきの 魔物）
fill(ENCOUNTER_TABLES, {
  t6_road_up: ENCOUNTER_TABLES.t6_ruin_up || [{ w: 1, group: [['gear_beetle', 1, 2]] }],
  t6_road_low: ENCOUNTER_TABLES.t6_ruin_low || [{ w: 1, group: [['chrono_knight', 1, 1]] }],
});

// きまった 戦い（B の 星くいのよる鳥・ペンデュラ。今は 時のいせきの 強い 魔物）。曲は A が 作った boss6
fill(FIXED_ENCOUNTERS, {
  star_eater: { group: [['chrono_knight', 1, 1], ['pendulum_bat', 1, 1]], bg: 'toki_ruin', bgm: 'boss6', canFlee: false, boss: true },
  pendula: { group: [['chrono_knight', 1, 1], ['rewind_ghost', 1, 1]], bg: 'toki_ruin_boss', bgm: 'boss6', canFlee: false, boss: true },
});

// 戦いの 背景（B: hoshimichi・hoshimichi_deep。今は ある 背景で）
fill(ZONE_BG, { t6_road_up: 'toki_ruin', t6_road_low: 'toki_ruin' });

// 宝箱の 中み（B の data/items-road.js の ROAD_TREASURE_FLOORS・ROAD_FIELD_TREASURE。今は 第6章 Step 1・2 の ★5 の 品）
const PT = [...(PAST_TREASURE.toki_ruin || []), ...(PAST_TREASURE.overworld_past || [])];
export const ROAD_TREASURE_FLOORS = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8].map((n) => [n, [PT[(2 * n - 2) % PT.length], PT[(2 * n - 1) % PT.length]]]));
export const ROAD_FIELD_TREASURE = (PAST_TREASURE.toki_shrine || []).slice(0, 3);
