// 第4章 Step 7（A: 世界と物語）の 仮の データ ― B（戦い）の ものが 入ったら、この ファイルは 消す
// （story-ch4-temple.js の import の 1行も いっしょに 消す）
//
// 砂の底の神殿の 出現表・きまった 戦い・戦いの 背景は B（戦い）が 作る（docs/plan-ch4.md の「17」の 名前の 約束）。
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 第4章の 魔物で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（B: t_b1_wet・t_b1_dry・t_b2・t_b3）
fill(ENCOUNTER_TABLES, {
  t_b1_wet: [{ w: 3, group: [['sand_shark', 1, 2]] }, { w: 2, group: [['lamp_genie', 1, 1], ['sand_shark', 0, 1]] }],
  t_b1_dry: [{ w: 3, group: [['dark_scorpion', 1, 2]] }, { w: 2, group: [['sand_worm', 1, 1], ['sandstone_golem', 0, 1]] }],
  t_b2: [{ w: 3, group: [['castle_armor', 1, 2]] }, { w: 2, group: [['lamp_genie', 1, 1], ['moon_ghost', 1, 1]] }],
  t_b3: [{ w: 3, group: [['sand_shark', 1, 2], ['moon_ghost', 0, 1]] }, { w: 2, group: [['castle_armor', 1, 1], ['lamp_genie', 1, 1]] }],
});

// きまった 戦い（B: mirror_knights・utsushimi・prison_guards・morgana・morgana_true）。曲は A が 作った ID
fill(FIXED_ENCOUNTERS, {
  mirror_knights: { group: [['castle_armor', 2, 2]], bg: 'sand_castle', bgm: 'boss', canFlee: false },
  utsushimi: { group: [['lamp_genie', 2, 2]], bg: 'sand_castle', bgm: 'boss', canFlee: false },
  prison_guards: { group: [['castle_armor', 2, 2]], bg: 'canal', bgm: 'boss', canFlee: false },
  morgana: { group: [['zaid_demon', 1, 1]], bg: 'palace_night', bgm: 'morgana', canFlee: false, boss: true },
  morgana_true: { group: [['sand_whale', 1, 1]], bg: 'palace_night', bgm: 'morgana', canFlee: false, boss: true },
});

// 戦いの 背景（B: sand_temple・mirror_hall・morgana_hall。今は ある 背景で）
fill(ZONE_BG, { t_b1_wet: 'canal', t_b1_dry: 'canal', t_b2: 'sand_castle', t_b3: 'canal' });
