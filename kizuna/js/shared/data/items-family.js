// 家族の 仕事の たのまれごと（第39回 C）の 品（items.js で まぜる）
//
// ・ごほうびの アクセサリー（5こ）: ランク10 の ★5（店では 買えない。src: 'gift' … たのまれごとの 1回だけ）。
//   強さは 第5章の「みんなが くれる 品」（items-earth.js の GATHER_GIFTS）と おなじ くらい。それぞれの 職業に ちなむ
// ・たのまれごとの 大事な物（料理大会の 材料・消えた教会のかね）
// ・乗り物は data/vehicles-family.js

// 売り値（items-rare.js と おなじ 式: ランクと レア度）
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const GIFT = { type: 'acc', rank: 10, rarity: 4, src: 'gift', price: 0 };

export const FAMILY_GIFTS = {
  // 1. 劇場の空調（設備屋の 系統）: 空気と 温度を あやつる 名人の しるし
  fq_air_badge: {
    ...GIFT, name: '空調名人のバッジ', bonus: { hp: 50, def: 12, mag: 12, agi: 8 }, resist: { fire: 0.7, ice: 0.7, wind: 0.7, poison: 0.7 },
    desc: 'サファラ劇場の空調を直したしるしの、青い風のバッジ。だれでも装備でき、HP・守り・魔力が上がり、炎と氷と風と毒に強い。',
  },
  // 2. おみやげ屋（会社員・アルバイトの 系統）: お客さんを よぶ まねきねこ
  fq_maneki: {
    ...GIFT, name: 'はんじょうのまねきねこ', bonus: { hp: 40, agi: 14, mag: 10, str: 6 }, crit: 0.03, resist: { confuse: 0.5, sleep: 0.6 },
    desc: '店にお客さんをよぶ、金色のまねきねこ。だれでも装備でき、素早さが上がって会心が出やすく、混乱とねむりにかかりにくい。',
  },
  // 3. 料理大会（料理人の 系統）: 優勝の 金の おたま
  fq_gold_ladle: {
    ...GIFT, name: '優勝の金のおたま', bonus: { hp: 60, str: 12, heal: 14, def: 6 }, resist: { poison: 0.5, fire: 0.8 },
    desc: 'カナトコの料理大会で優勝したしるしの、金のおたま。だれでも装備でき、HPと力と回復の力が上がり、毒と炎に強い。',
  },
  // 4. 消えた教会のかね（警察官・探ていの 系統）: なぞを 見ぬく 虫めがね
  fq_detective_glass: {
    ...GIFT, name: '名探ていの金の虫めがね', bonus: { agi: 14, mag: 12, hp: 30 }, crit: 0.04, resist: { blind: 0.4, confuse: 0.5, dark: 0.7 },
    desc: '小さな手がかりも見のがさない、金の虫めがね。だれでも装備でき、素早さと魔力が上がって会心が出やすく、目つぶし・混乱・闇に強い。',
  },
  // 5. 鉱山トロッコの線路（鉄道員の 系統）: どこへでも 行ける 金の きっぷ
  fq_gold_ticket: {
    ...GIFT, name: 'まぼろしの金のきっぷ', bonus: { agi: 16, str: 10, hp: 40 }, resist: { paralyze: 0.5, bolt: 0.7, blast: 0.8 },
    desc: '古い鉱山のおくにあった、金のきっぷ。だれでも装備でき、素早さと力とHPが上がり、マヒ・雷・爆発に強い。',
  },
};
for (const it of Object.values(FAMILY_GIFTS)) it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;

// たのまれごとの 大事な物
export const FAMILY_KEYS = {
  fq_mushroom: { name: '雪わりきのこ', type: 'key', desc: '雪の下から顔を出していた、白くて大きなきのこ。いいかおりがする。' },
  fq_salt: { name: '岩しお', type: 'key', desc: 'ほりほりモグラがほり出した、ピンク色の岩しお。料理の味がぐっとよくなる。' },
  fq_milk: { name: 'ヤギのミルク', type: 'key', desc: 'カナトコの牧場でしぼった、こいヤギのミルク。' },
  fq_button: { name: 'ぴかぴかのボタン', type: 'key', desc: '教会のシスターがくれた、金色のボタン。カラスのクロが気に入りそうだ。' },
  fq_bell: { name: '教会の小さなかね', type: 'key', desc: 'ルミナの町の教会の、小さな銀のかね。カラスの巣の中にあった。' },
};

export const FAMILY_ITEMS = { ...FAMILY_GIFTS, ...FAMILY_KEYS };

export const FAMILY_ITEM_KANA = {
  fq_air_badge: 'くうちょうめいじんのばっじ', fq_maneki: 'はんじょうのまねきねこ', fq_gold_ladle: 'ゆうしょうのきんのおたま',
  fq_detective_glass: 'めいたんていのきんのむしめがね', fq_gold_ticket: 'まぼろしのきんのきっぷ',
  fq_mushroom: 'ゆきわりきのこ', fq_salt: 'いわしお', fq_milk: 'やぎのみるく', fq_button: 'ぴかぴかのぼたん', fq_bell: 'きょうかいのちいさなかね',
};
