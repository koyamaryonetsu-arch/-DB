// 第5章 Step 6・7（A: 世界と物語）の 仮の 品の データ ― B（戦い・品）の data/items-earth.js が 入ったら、この ファイルは 消す
// （この ファイルを import している 所〈data/shops-earth.js・maps/earth.js・data/story-earth.js・test/ch5-step67.test.js〉を './items-earth.js' に かえる）
//
// 名前の 約束（docs/plan-ch5.md の「16」）: B が items-earth.js に 作る
//   HANONO9_SHOP_WEAPONS・HANONO9_SHOP_ARMOR・HANONO9_SHOP_TOOLS … c5_castle の あとの ハネノの 店の ならび（品物の ID の 配列。ランク9・★1）
//   EARTH_TREASURE … 大地の 神殿の 宝箱の 中み（{ 1: [id, …], … 8: [id, …] }。各階 1〜2こ）
//   GATHER_GIFTS … みんなが くれる 装備（{ nefi, sara, barga, mira } それぞれ 装備の ID 1つ。ランク10＝★5）
// 今は、今 ある 品物で 作った 仮の ならび（A の 店・宝箱・台本が B の 前でも 動いて、テストが 通る ように）
export const HANONO9_SHOP_WEAPONS = ['hoshi_sword', 'ryusei_axe', 'stardust_dagger', 'polaris_spear', 'starlight_claw', 'seiza_whip', 'hoshi_staff', 'yozora_fan', 'comet_boomerang', 'tsukiyo_bat'];
export const HANONO9_SHOP_ARMOR = ['hoshi_mail', 'hoshizukiyo_mantle', 'hoshi_robe', 'yokaze_gi', 'star_shield', 'star_helm', 'hoshi_hood'];
export const HANONO9_SHOP_TOOLS = ['herb', 'kumo_wataame', 'antidote', 'moonherb', 'hanebito_salve', 'hoshi_konpeito', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];
export const EARTH_TREASURE = {
  1: ['hanebito_plume'],
  2: ['griffin_claw', 'vane_fan'],
  3: ['icarus_wings'],
  4: ['atlas_shield', 'garuda_spear'],
  5: ['gaia_robe', 'valkyrie_helm'],
  6: ['raiun_staff', 'mem_lamp_shield'],
  7: ['tenku_sword', 'tenku_mail'],
  8: ['mem_lightshadow_sword', 'mem_star_crown'],
};
export const GATHER_GIFTS = { nefi: 'argos_pendant', sara: 'mem_moonlight_mail', barga: 'mem_twilight_spear', mira: 'mem_starmap_robe' };
