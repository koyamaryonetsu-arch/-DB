// 第2部 第6章「千年前のホシフルの里」の お店（data/shops.js で まぜる。名前の 約束 docs/plan-ch6.md の 9）
// 品ぞろえ（ランク10・店の 品なので ★1）は B の data/items-past.js の PAST_SHOP_WEAPONS・PAST_SHOP_ARMOR・PAST_SHOP_TOOLS。
// 店の 人の すがた・置く 場所は A（maps・台本）。千年前は キメラのつばさが 使えないので、道具屋では 売らない
import { PAST_SHOP_WEAPONS, PAST_SHOP_ARMOR, PAST_SHOP_TOOLS } from './items-past.js?v=7c37ebe89b7f';

export const SHOPS_PAST = {
  past_weapon: {
    name: '里の武器屋',
    kind: 'weapon',
    keeper: '里のかじ屋',
    hello: 'おや、見ない顔だね。\n星の鉄を、たき火で打った武器だよ。\nどれにする？',
    items: PAST_SHOP_WEAPONS,
  },
  past_armor: {
    name: '里の防具屋',
    kind: 'armor',
    keeper: '里のぬい子',
    hello: 'いらっしゃい。\n森の草でそめて、つたの糸でぬった防具よ。\nあなたの時代のものより、じょうぶかもね。',
    items: PAST_SHOP_ARMOR,
  },
  past_item: {
    name: '里の道具屋',
    kind: 'item',
    keeper: '里のおばあさん',
    hello: 'いらっしゃい。\n森でとれた薬草と、はちみつがあるよ。\n旅のそなえを、していきな。',
    items: PAST_SHOP_TOOLS,
  },
};
