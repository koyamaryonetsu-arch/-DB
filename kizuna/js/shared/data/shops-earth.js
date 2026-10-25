// 第5章 Step 7「影の城がうかんだあとのハネノ」の お店（data/shops.js で まぜる）。c5_castle の あと、ハネノの 武器と防具の店・道具屋の 品が かわる
// （data/story-kumoi.js の c5_shop_hw・c5_shop_ha・c5_shop_hi が フラグで こちらの 店を ひらく）
// 品ぞろえ（ランク9・店の 品なので ★1）は B（戦い・品）の data/items-earth.js の HANONO9_SHOP_WEAPONS・HANONO9_SHOP_ARMOR・HANONO9_SHOP_TOOLS（plan-ch5.md の 16）。
import { HANONO9_SHOP_WEAPONS, HANONO9_SHOP_ARMOR, HANONO9_SHOP_TOOLS } from './items-earth.js?v=f2f4be342cfa';

export const SHOPS_EARTH = {
  hanono9_weapon: {
    name: 'ハネノの武器屋',
    kind: 'weapon',
    keeper: '武器屋のハネビト',
    hello: 'いらっしゃい…！\n影の城がうかんでから、町じゅうのかじ屋が、夜もねずに打った武器よ。\nどれにする？',
    items: HANONO9_SHOP_WEAPONS,
  },
  hanono9_armor: {
    name: 'ハネノの防具屋',
    kind: 'armor',
    keeper: '防具屋のハネビト',
    hello: 'いらっしゃいませ。\nハネビトの長い羽を、雲の糸でおりこんだ防具です。\n最後の戦いのそなえに、どうぞ。',
    items: HANONO9_SHOP_ARMOR,
  },
  hanono9_item: {
    name: 'ハネノの道具屋',
    kind: 'item',
    keeper: '道具屋のおじいさん',
    hello: 'いらっしゃい。\n地上の人たちが、たくさん品物を持ってきてくれてのう。\n旅のそなえなら、ここでそろうよ。',
    items: HANONO9_SHOP_TOOLS,
  },
};
