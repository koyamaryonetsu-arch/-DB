// 第4章「砂の海にしずむ星」の 品物と お店（items.js・shops.js で まぜる）
// 装備の ランク6・7は 王都サファラ・砂の港ドゥナ（Step 3・Step 6）で ふえる。ここは オアシスの村ハミルの ぶん
export const ITEMS_CH4 = {
  sand_cloak: {
    name: '砂よけのマント', type: 'acc', rank: 6, bonus: { def: 6 }, resist: { blind: 0.5 }, price: 2200,
    desc: '砂ばくの旅人がはおる、うすいマント。砂かけやマヌーサで、目をくらまされにくくなる。',
  },
};

export const CH4_ITEM_KANA = {
  sand_cloak: 'すなよけのまんと',
};

export const SHOPS_CH4 = {
  // オアシスの村ハミルの よろず屋（水が へって、品物も 少ない）
  hamil: {
    name: 'ハミルのよろず屋',
    kind: 'general',
    keeper: 'よろず屋のおじさん',
    hello: 'いらっしゃい。水がへって、品物も少なくなっちまったが…\n砂ばくの旅のそなえなら、ここでそろうよ。',
    items: ['herb', 'antidote', 'moonherb', 'holy_water', 'return_wing', 'guide_thread', 'sand_cloak'],
  },
};
