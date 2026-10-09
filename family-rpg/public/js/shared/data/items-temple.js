// 第4章 Step 7「砂の底の神殿とモルガナ」の ボスが 落とす 品（B: 戦い。items.js で まぜる）
// ボスは かならず、1人 1つの アクセサリーを 落とす（loot.js の きまり。大臣ザイードと 砂の魔神ザイードと おなじく 2つの すがたで 1つずつ）
export const ITEMS_TEMPLE = {
  // モルガナ（第1段階）が 落とす: まどわしの歌（混乱）に 強く なる
  tide_earring: {
    name: 'しずくのイヤリング', type: 'acc', rank: 7, unique: true, bonus: { mag: 10, heal: 8 }, resist: { confuse: 0.5 }, price: 0, sell: 1200,
    desc: 'モルガナが耳につけていた、水のしずくの形のイヤリング。魔力と回復の力が上がり、混乱しにくくなる。',
  },
  // モルガナ（真の姿）が 落とす: 水鏡の かんむり
  mizukagami_crown: {
    name: '水鏡のかんむり', type: 'acc', rank: 7, unique: true, bonus: { def: 12, mag: 12, hp: 20 }, resist: { confuse: 0.6, paralyze: 0.6, sleep: 0.6 }, price: 0, sell: 1500,
    desc: '水鏡の魔人モルガナがのこした、鏡のようにすんだ水のかんむり。守りと魔力とHPが上がり、混乱・マヒ・ねむりにかかりにくくなる。',
  },
};

export const TEMPLE_ITEM_KANA = {
  tide_earring: 'しずくのいやりんぐ',
  mizukagami_crown: 'みずかがみのかんむり',
};
