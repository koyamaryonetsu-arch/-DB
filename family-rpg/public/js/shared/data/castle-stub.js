// ※※ 仮の ファイル（まとめる 時に 消す）※※ 第5章 Step 8（A8: 影の城の 世界）の 仮の データ
// B8（影の城の 戦い・品）の data/items-castle.js と 戦いの データ、A9（てっぺんと エンディング）の castle_top が 入ったら、この ファイルは 消す。
// 消す 時に かえる 所（docs/plan-ch5.md の 17 の「実装メモ（A8 … 影の城）」）:
//   ・maps/castle.js の `from '../data/castle-stub.js'`（CASTLE_TREASURE は '../data/items-castle.js' から。stubCastleTop の 1行も 消す）
//   ・data/story-castle.js の `import './castle-stub.js';`（戦いの 仮の データ）
//   ・test/ch5-step8.test.js の `from '../public/js/shared/data/castle-stub.js'`
//
// 名前の 約束（docs/plan-ch5.md の「17」）:
//   B8 … CASTLE_TREASURE（{ 1: [id, …], … 12: [id, …] }。各階 1〜2こ）・出現表 t5_castle_wind（1〜4階）・t5_castle_fire（5〜8階）・
//        t5_castle_water（9〜12階）・きまった 戦い phantom_storm・phantom_ignia・phantom_morgana・背景 castle_wind・castle_fire・castle_water
//   A9 … てっぺん「星のない広間」castle_top（12階の 上りかいだんの 先）
// A8 の マップと 台本が B8・A9 の 前でも 動いて、テストが 通る ように、今 ある 魔物・品で 作った いちばん 小さな ものを、
// まだ ない ときだけ たす（B8・A9 の ものが あれば、そちらが つかわれる。上がきは しない）
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS, ZONE_BG } from './encounters.js';
import { T, parseRows } from '../tiles.js';

const fill = (to, add) => {
  for (const [k, v] of Object.entries(add)) if (!(k in to)) to[k] = v;
};

// 宝箱の 中み（B8 の CASTLE_TREASURE。今は 大地の 神殿の ★5 の 品を ならべただけ）
export const CASTLE_TREASURE = {
  1: ['et_root_bangle'],
  2: ['et_moss_claw', 'et_root_whip'],
  3: ['et_keeper_shield'],
  4: ['et_spring_robe', 'et_keeper_axe'],
  5: ['et_tree_hat'],
  6: ['et_spring_staff', 'et_earth_gi'],
  7: ['et_bedrock_mail', 'et_pulse_bat'],
  8: ['et_heart_spear'],
  9: ['et_akane_fan', 'et_earth_crown'],
  10: ['gift_royal_charm'],
  11: ['et_earth_sword', 'gift_sandwind_cape'],
  12: ['gift_captain_axe', 'gift_miko_staff'],
};

// 出現表（B8: 1〜4階 風・5〜8階 炎・9〜12階 水。今は 大地の 神殿の 魔物）
fill(ENCOUNTER_TABLES, {
  t5_castle_wind: [{ w: 3, group: [['sky_guard', 1, 2]] }, { w: 2, group: [['root_sprite', 1, 2]] }],
  t5_castle_fire: [{ w: 3, group: [['earth_pillbug', 1, 2]] }, { w: 2, group: [['sky_guard', 1, 1]] }],
  t5_castle_water: [{ w: 3, group: [['faceless_shade', 1, 2]] }, { w: 2, group: [['earth_pillbug', 1, 1]] }],
});

// きまった 戦い（B8: 3人の まぼろし）。曲は A8 が 作った ID（phantom）
fill(FIXED_ENCOUNTERS, {
  phantom_storm: { group: [['storm_general', 1, 1]], bg: 'earth_temple_deep', bgm: 'phantom', canFlee: false, boss: true },
  phantom_ignia: { group: [['flame_witch_true', 1, 1]], bg: 'earth_temple_deep', bgm: 'phantom', canFlee: false, boss: true },
  phantom_morgana: { group: [['morgana_true', 1, 1]], bg: 'earth_temple_deep', bgm: 'phantom', canFlee: false, boss: true },
});

// 戦いの 背景（B8: castle_wind・castle_fire・castle_water。今は ある 背景で）
fill(ZONE_BG, { t5_castle_wind: 'kumoi', t5_castle_fire: 'earth_temple_deep', t5_castle_water: 'sink_ruin_deep' });

// てっぺん「星のない広間」の 仮の マップ（A9 の castle_top が ない ときだけ。maps/castle.js の attachCastle）
// 12階の 上りかいだんから 来た 所（maps/castle.js の CASTLE_TOP_ARRIVE）と、12階へ もどる 下りかいだん だけ
export function stubCastleTop(from12) {
  const rows = [];
  for (let y = 0; y < 18; y++) rows.push([...Array(26)].map((_, x) => (x === 0 || y === 0 || x === 25 || y === 17 ? '#' : '.')).join(''));
  const t = parseRows(rows, { '#': T.CAVE_WALL, '.': T.CAVE_FLOOR });
  t.tiles[16 * 26 + 12] = T.STAIRS_DOWN;
  return {
    id: 'castle_top', name: '影の城　てっぺん', kind: 'dungeon', bgm: 'castle_water', dark: false, theme: 'castle_water',
    w: t.w, h: t.h, tiles: t.tiles, gates: [],
    npcs: [], chests: [], signs: [], warps: [{ x: 12, y: 16, to: from12 }], triggers: [], actions: [], sparkles: [], roofs: [], links: [],
    areaName: () => '影の城　てっぺん',
    zoneAt: () => 'safe:top',
    spawnCounts: {},
  };
}
