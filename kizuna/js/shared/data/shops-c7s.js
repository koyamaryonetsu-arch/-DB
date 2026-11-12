// 第7章 Step 3・4（A: 世界と物語）「ナギの村」の お店（data/story-c7s.js が SHOPS に まぜる。data/shops.js は かえない）
// 品ぞろえは 今 ある いちばん 上の 店の 品（第1幕の 緑の王国の 店の 品。B の data/items-c7.js の C7_SHOP_*）。
// B が 第7章 第2幕の 店の 品を 作ったら、ここの items を かえる。千年前は キメラのつばさが 使えないので 道具屋では 売らない
import { C7_SHOP_WEAPONS, C7_SHOP_ARMOR, C7_SHOP_TOOLS } from './items-c7.js?v=66c9e741ef72';

export const SHOPS_C7S = {
  c7s_weapon: {
    name: 'ナギの村の武器屋',
    kind: 'weapon',
    keeper: '村のかじ屋',
    hello: 'いらっしゃい！\n海の向こうの国から、船で運んできた武器だよ。\n海賊なんかに、負けるんじゃないよ！',
    items: C7_SHOP_WEAPONS,
  },
  c7s_armor: {
    name: 'ナギの村の防具屋',
    kind: 'armor',
    keeper: '村のぬい子',
    hello: 'いらっしゃい。\n貝がらとあみで、じょうぶにぬった防具よ。\n波にぬれても、へっちゃらなんだから。',
    items: C7_SHOP_ARMOR,
  },
  c7s_item: {
    name: 'ナギの村の道具屋',
    kind: 'item',
    keeper: '道具屋のむすめ',
    hello: 'いらっしゃい！\n薬草も、はちみつも、そろってるよ。\n灯台へ行くなら、多めにどうぞ！',
    items: C7_SHOP_TOOLS,
  },
};
