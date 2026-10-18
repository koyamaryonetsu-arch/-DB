// 第5章 Step 6・7（A: 世界と物語）の 仮の 戦いの データ ― B（戦い）の ものが 入ったら、この ファイルは 消す
// （data/story-earth.js の import の 1行も いっしょに 消す）
//
// 根の島と 大地の 神殿の 出現表・きまった 戦い・戦いの 背景は B（戦い）が 作る（docs/plan-ch5.md の「16」の 名前の 約束）。
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（B: t5_root … 根の島・t5_earth_up … 神殿 1〜4階・t5_earth_low … 5〜8階）
fill(ENCOUNTER_TABLES, {
  t5_root: [{ w: 3, group: [['rock_mole', 1, 2]] }, { w: 2, group: [['stone_keeper', 1, 1]] }],
  t5_earth_up: [{ w: 3, group: [['stone_keeper', 1, 2]] }, { w: 2, group: [['haniwa_soldier', 1, 2]] }],
  t5_earth_low: [{ w: 3, group: [['gaia_larva', 1, 2]] }, { w: 2, group: [['soul_eater', 1, 1]] }],
});

// きまった 戦い（B: nocto_1 … ノクト 1回目。HPが 半分で 勝ちで おわる）。曲は A が 作った ID（nocto_1）
fill(FIXED_ENCOUNTERS, {
  nocto_1: { group: [['old_dragon', 1, 1]], bg: 'memory_deep', bgm: 'nocto_1', canFlee: false, boss: true },
});

// 戦いの 背景（B: root_isle・earth_temple・earth_temple_deep。今は ある 背景で）
fill(ZONE_BG, { t5_root: 'kumoi', t5_earth_up: 'sink_ruin', t5_earth_low: 'sink_ruin_deep' });
