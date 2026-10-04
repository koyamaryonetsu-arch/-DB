// 第4章「砂の海にしずむ星」の 品物と お店（items.js・shops.js で まぜる）
// 装備の ランク6・7は 王都サファラ・砂の港ドゥナ（Step 3・Step 6）で ふえる。ここは オアシスの村ハミルの ぶん
export const ITEMS_CH4 = {
  sand_cloak: {
    name: '砂よけのマント', type: 'acc', rank: 6, bonus: { def: 6 }, resist: { blind: 0.5 }, price: 2200,
    desc: '砂ばくの旅人がはおる、うすいマント。砂かけやマヌーサで、目をくらまされにくくなる。',
  },
  // よろい大サソリが 落とす（Step 2）
  scorpion_brooch: {
    name: 'サソリのブローチ', type: 'acc', rank: 6, unique: true, bonus: { def: 8, hp: 20 }, resist: { poison: 0 }, price: 0, sell: 700,
    desc: 'よろい大サソリのこうらで作られたブローチ。毒を受けなくなり、守りとHPが上がる。',
  },
};

export const CH4_ITEM_KANA = {
  sand_cloak: 'すなよけのまんと',
  scorpion_brooch: 'さそりのぶろーち',
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
