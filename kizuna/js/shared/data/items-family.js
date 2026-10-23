// お仕事いらい板の たのまれごと（第39回 C・第41回）の 品（items.js で まぜる）
//
// ・ごほうびの アクセサリー（第39回の 5こ・第41回の 6こ）: ランク10 の ★5（店では 買えない。src: 'gift' … たのまれごとの 1回だけ）。
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
  // ───── 第41回（data/sidequests-work.js）─────
  // 6. 歌の ステージ（アイドルの 系統）: 港の 歌姫の マイク
  fq_star_mic: {
    ...GIFT, name: 'きらめきのスターマイク', bonus: { mag: 14, agi: 10, hp: 40 }, resist: { silence: 0.4, sleep: 0.6, confuse: 0.6 },
    desc: '港の歌姫が使っていた、星のついたマイク。だれでも装備でき、魔力と素早さが上がり、声がとまりにくく、ねむりと混乱にも強い。',
  },
  // 7. こわれた 橋（地方公務員の 系統）: 村長さんの お礼の はんこ
  fq_gold_stamp: {
    ...GIFT, name: 'まちづくりの金のはんこ', bonus: { def: 14, hp: 50, mag: 8 }, resist: { paralyze: 0.5, poison: 0.6, blast: 0.8 },
    desc: 'オアシスの村の橋を直したお礼の、金のはんこ。だれでも装備でき、守りとHPが上がり、マヒと毒と爆発に強い。',
  },
  // 8. 子ども野球（プロ野球選手の 系統）: チームの 宝物の ボール
  fq_homerun_ball: {
    ...GIFT, name: '記念のホームランボール', bonus: { str: 14, agi: 10, hp: 40 }, crit: 0.04, resist: { blind: 0.5, paralyze: 0.6 },
    desc: 'カモメキッズの宝物の、ホームランボール。だれでも装備でき、力と素早さが上がって会心が出やすく、目つぶしとマヒに強い。',
  },
  // 9. 名物動画（ユーチューバーの 系統）: 町の みんなからの 金の ボタン
  fq_gold_play: {
    ...GIFT, name: '金の再生ボタン', bonus: { mag: 12, agi: 12, hp: 30 }, crit: 0.03, resist: { confuse: 0.5, dark: 0.7, silence: 0.6 },
    desc: 'ハネノの町のみんながくれた、金色の再生ボタン。だれでも装備でき、魔力と素早さが上がって会心が出やすく、混乱と闇に強い。',
  },
  // 10. 宿の 大そうじ（おかんの 系統）: 大おかみの 金の しゃもじ
  fq_gold_shamoji: {
    ...GIFT, name: 'たよれる金のしゃもじ', bonus: { hp: 70, heal: 14, def: 8 }, resist: { poison: 0.5, ice: 0.7, sleep: 0.6 },
    desc: '湯けむり宿の大おかみがくれた、金のしゃもじ。だれでも装備でき、HPと回復の力が上がり、毒と氷とねむりに強い。',
  },
  // 11. 手品ショー（手品師の 系統）: 王さまからの 金の トランプ
  fq_gold_cards: {
    ...GIFT, name: 'まぼろしの金のトランプ', bonus: { agi: 16, mag: 10, hp: 30 }, crit: 0.04, resist: { confuse: 0.5, blind: 0.5 },
    desc: '王都のお祭りのお礼の、金のトランプ。だれでも装備でき、素早さと魔力が上がって会心が出やすく、混乱と目つぶしに強い。',
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
  // 第41回
  fq_dress: { name: 'ステージの衣装', type: 'key', desc: 'ドゥナの仕立て屋のおばあさんが、ぬい直してくれた衣装。むかし港の歌姫が着ていた。' },
  fq_silk_hat: { name: 'マジーロのシルクハット', type: 'key', desc: '手品師マジーロの、黒いシルクハット。中は、ふしぎな空っぽ。' },
  fq_cards: { name: 'マジーロのトランプ', type: 'key', desc: '手品師マジーロの、手品用のトランプ。' },
  fq_dove: { name: '白いハト', type: 'key', desc: '手品師マジーロのハト。シルクハットの中が大すき。' },
};

export const FAMILY_ITEMS = { ...FAMILY_GIFTS, ...FAMILY_KEYS };

export const FAMILY_ITEM_KANA = {
  fq_air_badge: 'くうちょうめいじんのばっじ', fq_maneki: 'はんじょうのまねきねこ', fq_gold_ladle: 'ゆうしょうのきんのおたま',
  fq_detective_glass: 'めいたんていのきんのむしめがね', fq_gold_ticket: 'まぼろしのきんのきっぷ',
  fq_mushroom: 'ゆきわりきのこ', fq_salt: 'いわしお', fq_milk: 'やぎのみるく', fq_button: 'ぴかぴかのぼたん', fq_bell: 'きょうかいのちいさなかね',
  fq_star_mic: 'きらめきのすたーまいく', fq_gold_stamp: 'まちづくりのきんのはんこ', fq_homerun_ball: 'きねんのほーむらんぼーる',
  fq_gold_play: 'きんのさいせいぼたん', fq_gold_shamoji: 'たよれるきんのしゃもじ', fq_gold_cards: 'まぼろしのきんのとらんぷ',
  fq_dress: 'すてーじのいしょう', fq_silk_hat: 'まじーろのしるくはっと', fq_cards: 'まじーろのとらんぷ', fq_dove: 'しろいはと',
};
