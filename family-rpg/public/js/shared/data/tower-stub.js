// 第5章 Step 1・2（A: 世界と物語）の 仮の データ ― B（戦い）の ものが 入ったら、この ファイルは 消す
// （story-ch5.js の import の 1行も いっしょに 消す）
//
// 星の塔の 出現表・きまった 戦い・戦いの 背景は B（戦い）が 作る（docs/plan-ch5.md の「11」の 名前の 約束）。
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（B: t5_tower_low … 1〜4階・t5_tower_high … 5〜8階）
fill(ENCOUNTER_TABLES, {
  t5_tower_low: [{ w: 3, group: [['castle_armor', 1, 2]] }, { w: 2, group: [['moon_ghost', 1, 2]] }],
  t5_tower_high: [{ w: 3, group: [['mirror_knight', 1, 1], ['moon_ghost', 0, 1]] }, { w: 2, group: [['water_dragon', 1, 1]] }],
});

// きまった 戦い（B: argos … 星の番人アルゴス）。曲は A が 作った ID（argos）
fill(FIXED_ENCOUNTERS, {
  argos: { group: [['old_dragon', 1, 1]], bg: 'cave_boss', bgm: 'argos', canFlee: false, boss: true },
});

// 戦いの 背景（B: star_tower・star_tower_top。今は ある 背景で）
fill(ZONE_BG, { t5_tower_low: 'sand_castle', t5_tower_high: 'cave_boss' });
