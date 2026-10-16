// 第5章 Step 3・4（A: 世界と物語）の 仮の 戦いの データ ― B（戦い）の ものが 入ったら、この ファイルは 消す
// （data/story-ch5.js の import の 1行も いっしょに 消す）
//
// クモイ地方と しずみゆく島の 古い 神殿の 出現表・きまった 戦い・戦いの 背景は B（戦い）が 作る（docs/plan-ch5.md の「13」の 名前の 約束）。
// A の マップと 台本が B の 前でも 動いて、テストが 通る ように、今 ある 魔物で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js?v=b9571cd5f856';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 出現表（B: t5_kumoi … クモイ地方の 島・t5_ruin_up … 神殿 1〜3階・t5_ruin_low … 4〜7階・t5_ruin_cloud … 雲が 入った 所）
fill(ENCOUNTER_TABLES, {
  t5_kumoi: [{ w: 3, group: [['comet_bird', 1, 2]] }, { w: 2, group: [['tower_wind', 1, 2]] }],
  t5_ruin_up: [{ w: 3, group: [['stone_gargoyle', 1, 2]] }, { w: 2, group: [['clockwork_guard', 1, 1]] }],
  t5_ruin_low: [{ w: 3, group: [['gazer_eye', 1, 2]] }, { w: 2, group: [['star_jelly', 1, 2]] }],
  t5_ruin_cloud: [{ w: 3, group: [['comet_bird', 1, 1], ['star_jelly', 1, 1]] }, { w: 2, group: [['gazer_eye', 1, 2]] }],
});

// きまった 戦い（B: gaia_eater … 島をむしばむ大ムカデ。多部位の 戦い）。曲は A が 作った ID（gaia）
fill(FIXED_ENCOUNTERS, {
  gaia_eater: { group: [['old_dragon', 1, 1]], bg: 'cave_boss', bgm: 'gaia', canFlee: false, boss: true },
});

// 戦いの 背景（B: kumoi・sink_ruin・sink_ruin_deep。今は ある 背景で）
fill(ZONE_BG, { t5_kumoi: 'star_tower_top', t5_ruin_up: 'sand_castle', t5_ruin_low: 'sand_castle', t5_ruin_cloud: 'cave_boss' });
