// 第5章 Step 3・4（A: 世界と物語）の 仮の 品の データ ― B（戦い・品）の data/items-kumoi.js が 入ったら、この ファイルは 消す
// （この ファイルを import している 所〈data/shops-kumoi.js・maps/sink-ruin.js〉を './items-kumoi.js' に かえる）
//
// 名前の 約束（docs/plan-ch5.md の「13」）: B が items-kumoi.js に 作る
//   KUMOI_SHOP_WEAPONS・KUMOI_SHOP_ARMOR・KUMOI_SHOP_TOOLS … ハネノの 店の ならび（品物の ID の 配列。ランク8・★なし）
//   RUIN_TREASURE … しずみゆく島の 古い 神殿の 宝箱の 中み（{ 1: [id, …], … 7: [id, …] }。★2〜★4。各階 1〜2こ）
// 今は、今 ある 品物で 作った 仮の ならび（A の 店と 宝箱が B の 前でも 動いて、テストが 通る ように）
export const KUMOI_SHOP_WEAPONS = ['platinum_sword', 'platinum_axe', 'platinum_dagger', 'harpoon', 'platinum_claw', 'pirate_whip', 'pearl_staff', 'ripple_fan', 'platinum_boomerang', 'anchor_bat'];
export const KUMOI_SHOP_ARMOR = ['platinum_mail', 'water_hagoromo', 'pearl_robe', 'stream_gi', 'platinum_shield', 'platinum_helm', 'pirate_hat'];
export const KUMOI_SHOP_TOOLS = ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];
export const RUIN_TREASURE = {
  1: ['sand_king_helm'],
  2: ['ironwood_shield'],
  3: ['whirl_clothes', 'earth_charm'],
  4: ['star_reader_hat'],
  5: ['sphinx_fan', 'night_claw'],
  6: ['dragon_helm', 'guardian_shield'],
  7: ['scale_sword', 'scale_staff'],
};
