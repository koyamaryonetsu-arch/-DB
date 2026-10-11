// 第5章 Step 2「星の塔」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch5.md の 11）。昼と 夜の 区別は ない（塔の 中）
//   t5_tower_low  … 1〜4階（石の 塔: 石のガーゴイル・からくりの守り手・塔のつむじ風。古城のよろい・鏡の騎士も）
//   t5_tower_high … 5〜8階（星空: 星くらげ・ほうき星の鳥・星見の目玉。まどわしの鏡・月のゆうれいも）
// 4階の 休み所と 8階の てっぺん（アルゴスの 広間）は 魔物が 出ない（A の マップ）
export const ENCOUNTERS_CH5 = {
  t5_tower_low: [
    { w: 4, group: [['stone_gargoyle', 1, 2], ['tower_wind', 0, 1]] },
    { w: 3, group: [['clockwork_guard', 1, 1], ['tower_wind', 0, 1]] },
    { w: 3, group: [['tower_wind', 1, 2], ['stone_gargoyle', 0, 1]] },
    { w: 2, group: [['clockwork_guard', 1, 1], ['castle_armor', 1, 1]] },
    { w: 2, group: [['stone_gargoyle', 1, 1], ['mirror_knight', 1, 1]] },
  ],
  t5_tower_high: [
    { w: 4, group: [['star_jelly', 1, 1], ['comet_bird', 1, 1]] },
    { w: 3, group: [['comet_bird', 1, 2], ['gazer_eye', 0, 1]] },
    { w: 3, group: [['gazer_eye', 1, 2], ['star_jelly', 0, 1]] },
    { w: 2, group: [['star_jelly', 1, 1], ['trick_mirror', 1, 1], ['moon_ghost', 0, 1]] },
    { w: 2, group: [['clockwork_guard', 1, 1], ['gazer_eye', 1, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['battle', 'argos'] と 使う。docs/plan-ch5.md の 11 の 名前の 約束）
//   曲は A が 作る（argos … ボス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_CH5 = {
  argos: { group: [['argos', 1, 1]], bg: 'star_tower_top', bgm: 'argos', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch5-tower-bg.js）
export const ZONE_BG_CH5 = { t5_tower_low: 'star_tower', t5_tower_high: 'star_tower_top' };
