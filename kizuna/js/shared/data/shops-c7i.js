// 第7章 Step 5・6（A: 世界と物語）「白雪の里」の お店（data/story-c7i.js が SHOPS に まぜる。data/shops.js は かえない）
// 品ぞろえは 今 ある いちばん 上の 店の 品（第2幕の ナギの村の 店の 品。B の data/items-c7s.js の C7S_SHOP_*）。
// B が 第7章 第3幕の 店の 品を 作ったら、ここの items を かえる。千年前は キメラのつばさが 使えないので 道具屋では 売らない
import { C7S_SHOP_WEAPONS, C7S_SHOP_ARMOR, C7S_SHOP_TOOLS } from './items-c7s.js?v=bfc4e5f50af2';

export const SHOPS_C7I = {
  c7i_weapon: {
    name: '白雪の里の武器屋',
    kind: 'weapon',
    keeper: '里のかじ屋',
    hello: 'いらっしゃい。\nこおった手でも、にぎりやすい武器だよ。\n城の前のいばらには、気をつけな。',
    items: C7S_SHOP_WEAPONS,
  },
  c7i_armor: {
    name: '白雪の里の防具屋',
    kind: 'armor',
    keeper: '里のぬい子',
    hello: 'いらっしゃい。\n雪うさぎの毛を、たっぷりぬいこんだ防具よ。\nぽかぽか、あったかいんだから。',
    items: C7S_SHOP_ARMOR,
  },
  c7i_item: {
    name: '白雪の里の道具屋',
    kind: 'item',
    keeper: '道具屋のむすめ',
    hello: 'いらっしゃいませ！\n薬草も、はちみつも、そろってます。\n氷の城は、とっても寒いですよ。',
    items: C7S_SHOP_TOOLS,
  },
};
