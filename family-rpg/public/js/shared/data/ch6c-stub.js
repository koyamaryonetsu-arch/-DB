// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第6章 Step 5（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・背景・時計塔の 宝箱の 中み・ゲストの リオン）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch6.md の「実装メモ（A … 世界と物語。第6章 Step 5）」の「まとめる時に消すもの」）:
//   ・maps/tokei.js の `import { TOWER_TREASURE_FLOORS } from '../data/ch6c-stub.js';`（'../data/items-tower.js' から）
//   ・data/story-ch6c.js の `import './ch6c-stub.js';`（1行 けす。リオンは B の shops.js の GUESTS.rion）
//   ・test/ch6-step5.test.js の `from '../public/js/shared/data/ch6c-stub.js'`（items-tower.js から）と、漢字の テストの ファイルの 一覧の ch6c-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の ch6c-stub.js
//
// 名前の 約束（docs/plan-ch6.md の 15）:
//   出現表 t6_tower_low（止まった時計塔 1〜5階）/ きまった 戦い carillon（かねつきのからくり カリヨン。5階）/ 背景 tokei
//   宝箱 TOWER_TREASURE_FLOORS（{ 1: [2こ], …, 5: [2こ] }）/ ゲスト RION_GUEST（GUESTS.rion。MINAMO_GUEST と おなじ 形）
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { GUESTS } from './shops.js';
import { ROAD_TREASURE_FLOORS } from './items-road.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 星めぐりの古道の 下の 階の 魔物）
fill(ENCOUNTER_TABLES, {
  t6_tower_low: ENCOUNTER_TABLES.t6_road_low || ENCOUNTER_TABLES.t6_ruin_low || [{ w: 1, group: [['chrono_knight', 1, 1]] }],
});

// 魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 第6章に 数える（仮の 出現表が 第1・2章に まざらない ように）
if (ENCOUNTERS_ROAD && !('t6_tower_low' in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD.t6_tower_low = ENCOUNTER_TABLES.t6_tower_low;

// きまった 戦い（B の カリヨン。今は 古道の 強い 魔物）。曲は A が 作った boss6
fill(FIXED_ENCOUNTERS, {
  carillon: { group: [['dust_drake', 1, 1], ['twin_star', 1, 1]], bg: 'hoshimichi_deep', bgm: 'boss6', canFlee: false, boss: true },
});

// 戦いの 背景（B: tokei。今は ある 背景で）
fill(ZONE_BG, { t6_tower_low: 'hoshimichi_deep' });

// ゲストの リオン（B の RION_GUEST。今は 今 ある 職業・技で）
export const RION_GUEST_STUB = {
  id: 'guest_rion', name: 'リオン', job: 'sword_master', tactics: 'aggressive', minLevel: 64,
  look: { body: 0, hair: 0, hairColor: 2, skin: 1, color: 1, style: 'spiky' },
  skills: ['star_strash'],
  gear: { weapon: 'platinum_sword', armor: 'platinum_mail', head: 'platinum_helm' },
};
if (!GUESTS.rion) GUESTS.rion = RION_GUEST_STUB;

// 宝箱の 中み（B の data/items-tower.js の TOWER_TREASURE_FLOORS。今は 古道の ★5 の 品）
const RT = Object.values(ROAD_TREASURE_FLOORS || {}).flat();
export const TOWER_TREASURE_FLOORS = Object.fromEntries([1, 2, 3, 4, 5].map((n) => [n, [RT[(2 * n + 4) % RT.length], RT[(2 * n + 5) % RT.length]]]));
