// 第5章 Step 5（A: 世界と物語）の 仮の 品の データ ― B（戦い・品）の data/items-hoshiyomi.js が 入ったら、この ファイルは 消す
// （この ファイルを import している 所〈data/shops-hoshiyomi.js・maps/memory.js〉を items-hoshiyomi.js に かえる）
//
// 名前の 約束（docs/plan-ch5.md の「14」）: B が items-hoshiyomi.js に 作る
//   HOSHIYOMI_SHOP_WEAPONS・HOSHIYOMI_SHOP_ARMOR・HOSHIYOMI_SHOP_TOOLS … 星読みの里の よろず屋の ならび（品物の ID の 配列）
//   MEMORY_TREASURE … ノクトの 思い出の 迷宮の 宝箱の 中み（{ 1: [id, …], … 6: [id, …] }。各階 1〜2こ）
// 今は、今 ある 品物で 作った 仮の ならび（A の 店と 宝箱が B の 前でも 動いて、テストが 通る ように）
export const HOSHIYOMI_SHOP_WEAPONS = ['platinum_sword', 'platinum_axe', 'platinum_dagger', 'harpoon', 'platinum_claw', 'pirate_whip', 'pearl_staff', 'ripple_fan', 'platinum_boomerang', 'anchor_bat'];
export const HOSHIYOMI_SHOP_ARMOR = ['platinum_mail', 'water_hagoromo', 'pearl_robe', 'stream_gi', 'platinum_shield', 'platinum_helm', 'pirate_hat'];
export const HOSHIYOMI_SHOP_TOOLS = ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];
export const MEMORY_TREASURE = {
  1: ['sand_king_helm'],
  2: ['ironwood_shield', 'earth_charm'],
  3: ['whirl_clothes'],
  4: ['sphinx_fan', 'night_claw'],
  5: ['dragon_helm', 'guardian_shield'],
  6: ['scale_sword', 'scale_staff'],
};
