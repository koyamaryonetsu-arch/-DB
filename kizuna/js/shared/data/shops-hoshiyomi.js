// 第5章 Step 5「星読みの里」の お店（data/shops.js で まぜる）。よろず屋に 武器・防具・道具の 3人
// 品ぞろえは B（戦い・品）の data/items-hoshiyomi.js の HOSHIYOMI_SHOP_WEAPONS・HOSHIYOMI_SHOP_ARMOR・HOSHIYOMI_SHOP_TOOLS（plan-ch5.md の 14）。
// 品の ならびは B の data/items-hoshiyomi.js
import { HOSHIYOMI_SHOP_WEAPONS, HOSHIYOMI_SHOP_ARMOR, HOSHIYOMI_SHOP_TOOLS } from './items-hoshiyomi.js?v=e9f7d3379e55';

export const SHOPS_HOSHIYOMI = {
  hoshiyomi_weapon: {
    name: '星読みの里の武器屋',
    kind: 'weapon',
    keeper: '武器屋の星読み',
    hello: 'いらっしゃい。\nお客さんが来ることは、ゆうべの星が教えてくれましたよ。\nどれにします？',
    items: HOSHIYOMI_SHOP_WEAPONS,
  },
  hoshiyomi_armor: {
    name: '星読みの里の防具屋',
    kind: 'armor',
    keeper: '防具屋の星読み',
    hello: 'いらっしゃいませ。\n星の光をあびせた防具は、心まで守ってくれるそうですよ。\nどれになさいます？',
    items: HOSHIYOMI_SHOP_ARMOR,
  },
  hoshiyomi_item: {
    name: '星読みの里の道具屋',
    kind: 'item',
    keeper: '道具屋のおばあさん',
    hello: 'いらっしゃい。\n長い旅には、そなえが大事じゃよ。\nゆっくり見ていきなされ。',
    items: HOSHIYOMI_SHOP_TOOLS,
  },
};
