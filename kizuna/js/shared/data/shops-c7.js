// 第7章 Step 1・2（A: 世界と物語）「緑の王国」の お店（data/story-c7.js が SHOPS に まぜる。data/shops.js は かえない）
// 品ぞろえは 今 ある いちばん 上の 店の 品（千年前の ホシフルの里と おなじ ランク10。おすすめ Lv68〜72 の 家族の そなえ）。
// B が 第7章の 店の 品（ランク11 など）を 作ったら、ここの items を かえる。千年前は キメラのつばさが 使えないので 道具屋では 売らない
import { PAST_SHOP_WEAPONS, PAST_SHOP_ARMOR, PAST_SHOP_TOOLS } from './items-past.js?v=7040d8c7ec18';

export const SHOPS_C7 = {
  c7_weapon: {
    name: '王国の武器屋',
    kind: 'weapon',
    keeper: '王国のかじ屋',
    hello: 'いらっしゃい！\n川の水で冷やして、きたえた武器だよ。\n騎士団のみなさんも、うちの品を使っているんだ。',
    items: PAST_SHOP_WEAPONS,
  },
  c7_armor: {
    name: '王国の防具屋',
    kind: 'armor',
    keeper: '王国のぬい子',
    hello: 'いらっしゃいませ。\n森のつたと、湖の貝がらでつくった防具ですわ。\nどうぞ、手に取ってみて。',
    items: PAST_SHOP_ARMOR,
  },
  c7_item: {
    name: '王国の道具屋',
    kind: 'item',
    keeper: '道具屋のむすめ',
    hello: 'いらっしゃい！\n薬草も、はちみつも、全部、森と湖のめぐみよ。\n神殿へ行くなら、多めにどうぞ！',
    items: PAST_SHOP_TOOLS,
  },
};
