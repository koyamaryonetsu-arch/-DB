// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第6章 Step 6（A: 世界と物語）の 仮の データ
// B（戦い・品）の データ（出現表・きまった 戦い・宝箱の 中み・クリアの ★5の 武器）が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch6.md の「実装メモ（A … 世界と物語。第6章 Step 6）」の「まとめる時に消すもの」）:
//   ・maps/tokei-high.js の `import { TOKEI_TREASURE_HIGH } from '../data/ch6d-stub.js';`（'../data/items-tokei.js' から）
//   ・data/story-ch6d.js の `import { C6_CLEAR_WEAPONS } from './ch6d-stub.js';`（'./items-tokei.js' から）
//   ・test/ch6-step6-a.test.js の `from '../public/js/shared/data/ch6d-stub.js'`（items-tokei.js から）と、漢字の テストの ファイルの 一覧の ch6d-stub.js
//   ・tools/kanji-check.mjs の gameFiles() の ch6d-stub.js
//
// 名前の 約束（docs/plan-ch6.md の 17）:
//   出現表 t6_tower_high（6〜10階）/ きまった 戦い zenmai（ボス）・rion_spar1〜3（リオンの けいこ。loseOk）・toki_phantom（止まった時の間）
//   宝箱 TOKEI_TREASURE_HIGH（{ 6: [2こ], …, 10: [2こ] }）/ C6_CLEAR_WEAPONS（てっぺんの 小べや）/ 乗り物 zenmai_horse
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { ENCOUNTERS_ROAD } from './encounters-road.js';
import { TOWER_TREASURE_FLOORS } from './items-tower.js';
import * as TOKEI from './items-tokei.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（今は 1〜5階の 魔物）。魔物の ランクの 章わけ（tools/gen-monster-ranks.mjs の CHAPTER_SRC）で 第6章に 数える
fill(ENCOUNTER_TABLES, { t6_tower_high: ENCOUNTER_TABLES.t6_tower_low });
// （B の encounters-tokei.js の 一らんは かえない ように、古道の 一らんに 入れる。stub を けせば 消える）
if (ENCOUNTERS_ROAD && !('t6_tower_high' in ENCOUNTERS_ROAD)) ENCOUNTERS_ROAD.t6_tower_high = ENCOUNTER_TABLES.t6_tower_high;
fill(ZONE_BG, { t6_tower_high: 'tokei' });

// きまった 戦い（今は 前の ボス）。曲は boss6
const boss = FIXED_ENCOUNTERS.carillon?.group || [['geardon', 1, 1]];
fill(FIXED_ENCOUNTERS, {
  zenmai: { group: boss, bg: 'tokei', bgm: 'boss6', canFlee: false, boss: true },
  rion_spar1: { group: [['chrono_knight', 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, loseOk: true },
  rion_spar2: { group: [['chrono_knight', 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, loseOk: true },
  rion_spar3: { group: [['chrono_knight', 1, 1]], bg: 'tokei', bgm: 'boss6', canFlee: false, loseOk: true },
  toki_phantom: { group: boss, bg: 'tokei', bgm: 'boss6', canFlee: false, boss: true },
});

// 乗り物（B の ぜんまい馬）は 仮に たさない（乗り物には 絵が いるので。B の 物が 入るまでは c.vehicles に 知らない id として のこる）

// 宝箱の 中み（B の data/items-tokei.js の TOKEI_TREASURE_HIGH。今は 1〜5階の ★5 の 品）
const TT = Object.values(TOWER_TREASURE_FLOORS || {}).flat();
export const TOKEI_TREASURE_HIGH = TOKEI.TOKEI_TREASURE_HIGH
  || Object.fromEntries([6, 7, 8, 9, 10].map((n) => [n, [TT[(2 * n) % TT.length], TT[(2 * n + 1) % TT.length]]]));
// クリアの ★5の 武器（B の data/items-tokei.js の C6_CLEAR_WEAPONS。今は 今 ある 武器）
export const C6_CLEAR_WEAPONS = TOKEI.C6_CLEAR_WEAPONS || ['p6t_tower_sword', 'p6t_hand_boomerang', 'p6t_wind_dagger', 'p6t_spring_whip'];
