// 第4章 Step 7「砂の底の神殿」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch4.md の 17）。昼と 夜の 区別は ない（神殿は 砂の 下）。
// 入口の ドーム（空気の ドーム）と 最深部（水鏡の広間）は 魔物が 出ない
//   t_b1_wet … 地下1階「水の回廊」の 水が 高い 所（およぐ 水の 魔物）
//   t_b1_dry … 地下1階「水の回廊」の 水が 低い 所（砂の 魔物）
//   t_b2     … 地下2階「鏡の間」（鏡の騎士・まどわしの鏡。水の精＋鏡の騎士は 回復役を 先に）
//   t_b3     … 地下3階「水のろう」
export const ENCOUNTERS_TEMPLE = {
  t_b1_wet: [
    { w: 4, group: [['water_spirit', 1, 2], ['castle_armor', 0, 1]] },
    { w: 3, group: [['water_dragon', 1, 1], ['water_spirit', 0, 1]] },
    { w: 2, group: [['moon_ghost', 1, 2], ['water_spirit', 1, 1]] },
    { w: 2, group: [['water_dragon', 1, 1], ['castle_armor', 1, 1]] },
  ],
  t_b1_dry: [
    { w: 4, group: [['sand_crab', 1, 2], ['sand_worm', 0, 1]] },
    { w: 3, group: [['sand_worm', 1, 1], ['sand_crab', 1, 1]] },
    { w: 2, group: [['dark_scorpion', 1, 2], ['sand_crab', 0, 1]] },
    { w: 2, group: [['sandstone_golem', 1, 1], ['sand_crab', 1, 1]] },
    { w: 1, group: [['gold_beetle', 1, 1]] },
  ],
  t_b2: [
    { w: 4, group: [['mirror_knight', 1, 1], ['trick_mirror', 0, 1]] },
    { w: 3, group: [['trick_mirror', 1, 2], ['moon_ghost', 0, 1]] },
    { w: 3, group: [['mirror_knight', 1, 1], ['water_spirit', 1, 1]] },
    { w: 1, group: [['mirror_knight', 2, 2]] },
  ],
  t_b3: [
    { w: 4, group: [['water_dragon', 1, 1], ['water_spirit', 1, 1]] },
    { w: 3, group: [['water_dragon', 1, 2]] },
    { w: 3, group: [['mirror_knight', 1, 1], ['water_spirit', 1, 2]] },
    { w: 2, group: [['trick_mirror', 1, 1], ['water_dragon', 1, 1]] },
  ],
};

// きまった 戦い（A が 台本で 使う。docs/plan-ch4.md の 17 の 名前の 約束）
//   曲は A が 作る（sand_temple … ダンジョン・番人、morgana … ボス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_TEMPLE = {
  // 鏡の間の 番人: 鏡の騎士 2体（体が 光ったら 呪文を はね返す。光っている 時は 武器で）
  mirror_knights: { group: [['mirror_knight', 2, 2]], bg: 'mirror_hall', bgm: 'sand_temple', canFlee: false },
  // 鏡のうつし身: パーティーの 人数ぶんの「〇〇のうつし身」（battle-temple.js の setupUtsushimi が 1体の しるしを 人数ぶんに かえる）
  utsushimi: { group: [['utsushimi', 1, 1]], bg: 'mirror_hall', bgm: 'sand_temple', canFlee: false },
  // 水のろうの 前の 番人 2体
  prison_guards: { group: [['prison_guard', 2, 2]], bg: 'sand_temple', bgm: 'sand_temple', canFlee: false },
  // 水鏡の広間: モルガナ（3体の うち 1体だけが 本物。のこりは まぼろしの 分身）
  morgana: { group: [['morgana', 3, 3]], bg: 'morgana_hall', bgm: 'morgana', canFlee: false, boss: true },
  // ミラの いのりで 全回復した あと: モルガナ（真の姿）。水の守りの歌は 戦いの はじめに きまる（battle-temple.js）
  morgana_true: { group: [['morgana_true', 1, 1]], bg: 'morgana_hall', bgm: 'morgana', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch4-temple-bg.js）
export const ZONE_BG_TEMPLE = {
  t_b1_wet: 'sand_temple', t_b1_dry: 'sand_temple', t_b2: 'mirror_hall', t_b3: 'sand_temple',
};
