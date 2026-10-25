// 第5章 Step 3「雲の上の町ハネノ」の お店（data/shops.js で まぜる）
// 品ぞろえ（ランク8）は B（戦い・品）の data/items-kumoi.js の KUMOI_SHOP_WEAPONS・KUMOI_SHOP_ARMOR・KUMOI_SHOP_TOOLS（plan-ch5.md の 13）。
// （品の ならびは B の data/items-kumoi.js）
import { KUMOI_SHOP_WEAPONS, KUMOI_SHOP_ARMOR, KUMOI_SHOP_TOOLS } from './items-kumoi.js?v=2173b59e8cbd';

export const SHOPS_KUMOI = {
  hanono_weapon: {
    name: 'ハネノの武器屋',
    kind: 'weapon',
    keeper: '武器屋のハネビト',
    hello: 'いらっしゃい！地上のお客さんなんて、何百年ぶりかしら。\n雲の上の武器は、風のように軽いのよ。\nどれにする？',
    items: KUMOI_SHOP_WEAPONS,
  },
  hanono_armor: {
    name: 'ハネノの防具屋',
    kind: 'armor',
    keeper: '防具屋のハネビト',
    hello: 'いらっしゃいませ。\n雲の糸でおった防具は、とてもじょうぶですよ。\nどれになさいます？',
    items: KUMOI_SHOP_ARMOR,
  },
  hanono_item: {
    name: 'ハネノの道具屋',
    kind: 'item',
    keeper: '道具屋のおじいさん',
    hello: 'いらっしゃい。\n島がしずみ始めてから、品物も少なくなってのう…。\nそれでも、旅のそなえなら、ここでそろうよ。',
    items: KUMOI_SHOP_TOOLS,
  },
};
