// 第5章 Step 5（A: 世界と物語）の 仮の 戦いの データ ― B（戦い）の ものが 入ったら、この ファイルは 消す
// （data/story-hoshiyomi.js の import の 1行も いっしょに 消す）
//
// 星読みの里の まわりと ノクトの 思い出の 迷宮の 出現表・きまった 戦い・戦いの 背景は B（戦い）が 作る（docs/plan-ch5.md の「14」の 名前の 約束）。
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js?v=d72794b61b43';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（B: t5_village … 星読みの里の まわり・t5_memory … 迷宮 1〜3階・t5_memory_deep … 4〜6階）
fill(ENCOUNTER_TABLES, {
  t5_village: [{ w: 3, group: [['cloud_sheep', 1, 2]] }, { w: 2, group: [['sky_ray', 1, 1]] }],
  t5_memory: [{ w: 3, group: [['gazer_eye', 1, 2]] }, { w: 2, group: [['star_jelly', 1, 2]] }],
  t5_memory_deep: [{ w: 3, group: [['comet_bird', 1, 1], ['gazer_eye', 1, 1]] }, { w: 2, group: [['star_jelly', 1, 2]] }],
});

// きまった 戦い（B: nocto_shadow … ノクトの影。主人公たちの 職業を まねる）。曲は A が 作った ID（nocto_shadow）
fill(FIXED_ENCOUNTERS, {
  nocto_shadow: { group: [['old_dragon', 1, 1]], bg: 'star_tower_top', bgm: 'nocto_shadow', canFlee: false, boss: true },
});

// 戦いの 背景（B: hoshiyomi・memory・memory_deep。今は ある 背景で）
fill(ZONE_BG, { t5_village: 'kumoi', t5_memory: 'star_tower_top', t5_memory_deep: 'star_tower_top' });
