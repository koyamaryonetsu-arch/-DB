// 第5章 Step 3・4「クモイ地方」と「しずみゆく島の古い神殿」の てきの くみあわせ（B: 戦い。encounters.js で まぜる）
// 出現表の 名前は A（マップ）との 約束（docs/plan-ch5.md の 13）。昼と 夜の 区別は ない
//   t5_kumoi      … クモイ地方の 島（雲ひつじ・空とびエイ・かみなりぐも・雲海へび。星の塔の 星空の 魔物も 少し）
//   t5_ruin_up    … 神殿 1〜3階（石の守り手・岩もぐら。はにわ兵・石のガーゴイルも）
//   t5_ruin_low   … 神殿 4〜7階（つちくいムカデ・はにわ兵。石の守り手・岩もぐらも）
//   t5_ruin_cloud … 雲が 入った 所（雲間のゆうれい・雷雲ワイバーン・色ちがい。強い・経験値と お金が 多い）
// 4階の 休み所と 7階の ガイアイーターの 広間は 魔物が 出ない（A の マップ）
import { registerVariant } from './variants.js?v=a2abc3298a71';

// 色ちがい（data/variants.js）: 雲の 中の ダーク雲ひつじ・レッドつちくいムカデ
export const KUMOI_VARIANTS = [registerVariant('cloud_sheep', 'dark'), registerVariant('gaia_larva', 'red')];
const [DARK_SHEEP, RED_LARVA] = KUMOI_VARIANTS;

export const ENCOUNTERS_KUMOI = {
  t5_kumoi: [
    { w: 4, group: [['cloud_sheep', 1, 2], ['sky_ray', 0, 1]] },
    { w: 3, group: [['sky_ray', 1, 1], ['thunder_puff', 1, 2]] },
    { w: 3, group: [['sky_serpent', 1, 1], ['cloud_sheep', 0, 1]] },
    { w: 2, group: [['thunder_puff', 2, 3]] },
    { w: 2, group: [['comet_bird', 1, 1], ['sky_ray', 1, 1]] },
    { w: 1, group: [['star_jelly', 1, 1], ['sky_serpent', 1, 1]] },
  ],
  t5_ruin_up: [
    { w: 4, group: [['stone_keeper', 1, 1], ['rock_mole', 1, 2]] },
    { w: 3, group: [['rock_mole', 2, 3]] },
    { w: 3, group: [['stone_keeper', 1, 2]] },
    { w: 2, group: [['haniwa_soldier', 1, 1], ['rock_mole', 1, 1]] },
    { w: 2, group: [['stone_gargoyle', 1, 1], ['stone_keeper', 1, 1]] },
  ],
  t5_ruin_low: [
    { w: 4, group: [['gaia_larva', 1, 2], ['haniwa_soldier', 0, 1]] },
    { w: 3, group: [['haniwa_soldier', 1, 2], ['rock_mole', 0, 1]] },
    { w: 3, group: [['stone_keeper', 1, 1], ['gaia_larva', 1, 1]] },
    { w: 2, group: [['gaia_larva', 2, 3]] },
    { w: 1, group: [['haniwa_soldier', 1, 1], ['stone_keeper', 1, 1], ['rock_mole', 1, 1]] },
  ],
  t5_ruin_cloud: [
    { w: 4, group: [['cloud_wraith', 1, 2], ['thunder_puff', 0, 1]] },
    { w: 3, group: [['cloud_wyvern', 1, 1], ['cloud_wraith', 0, 1]] },
    { w: 3, group: [[DARK_SHEEP, 1, 2], ['cloud_wraith', 1, 1]] },
    { w: 2, group: [['cloud_wyvern', 1, 1], [RED_LARVA, 1, 1]] },
    { w: 2, group: [[RED_LARVA, 1, 2], ['haniwa_soldier', 1, 1]] },
  ],
};

// きまった 戦い（A が 台本で ['battle', 'gaia_eater'] と 使う。docs/plan-ch5.md の 13 の 名前の 約束）
//   左から しっぽ・体・頭（部位の ID は gaia_tail・gaia_body・gaia_eater。battle-gaia.js）
//   曲は A が 作る（gaia … ボス）。まだ ない ときは 音が 鳴らないだけ（client/audio.js の play）
//   負けた ときは、今までの ボスと おなじ（loseOk なし。全滅して もどる）
export const FIXED_KUMOI = {
  gaia_eater: { group: [['gaia_tail', 1, 1], ['gaia_body', 1, 1], ['gaia_eater', 1, 1]], bg: 'sink_ruin_deep', bgm: 'gaia', canFlee: false, boss: true },
};

// 出現表 → 戦いの 背景（render/ch5-kumoi-bg.js）
export const ZONE_BG_KUMOI = { t5_kumoi: 'kumoi', t5_ruin_up: 'sink_ruin', t5_ruin_low: 'sink_ruin_deep', t5_ruin_cloud: 'sink_ruin_deep' };
