// 第37回 B: 宝の地図の 段で ふえる カジノの 景品・すごろくの 品（items-casino.js で まぜる）
//
// 段（data/casino-tier.js）が 上がると 景品コーナーに ならぶ（data/casino.js の PRIZES の tier）。
// すごろくの ゴール・宝箱で 手に入る 品は src: 'sugoroku'（すごろくでしか 手に入らない）。景品は src: 'casino'
// ★（強さ）は ランクで きまる（items-rare.js の starsFor）: ランク7 ★3・ランク8 ★4・ランク9〜10 ★5。
// 強さは 宝の洞窟の 品と おなじ 作り方（剣・服の めやす × 種類 × レア度）。あとの 段・上の すごろくほど 少し 強い（k）
const SW = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CL = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CK = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const AK = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RK = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL_R = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const cw = (cat, rank, rarity, k = 1) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SW[rank] * CK[cat] * RK[rarity] * k) });
const ca = (armorType, rank, rarity, k = 1) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CL[rank] * AK[armorType] * RK[rarity] * k) });
const cs = (rank, rarity, k = 1) => ({ type: 'shield', rank, rarity, def: Math.round(CL[rank] * RK[rarity] * k) });
const ch = (rank, rarity, k = 1) => ({ type: 'head', rank, rarity, def: Math.round(CL[rank] * 0.4 * RK[rarity] * k) });
const cc = (rank, rarity) => ({ type: 'acc', rank, rarity });
const CASINO = { src: 'casino' };
const SUGO = { src: 'sugoroku' };
const ALL = ['str', 'def', 'agi', 'mag', 'heal'];

export const ITEMS_CASINO_R37 = {
  // ───── めずらしい 種・木の実 ─────
  seed_mp: {
    name: 'ふしぎな木の実', type: 'use', price: 0, sell: 40, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'mp', amount: [3, 5] }, desc: '食べると最大MPが上がる。',
  },
  seed_heal: {
    name: 'いやしの種', type: 'use', price: 0, sell: 40, target: 'ally', battle: false, field: true,
    effect: { type: 'seed', stat: 'heal', amount: [1, 2] }, desc: '食べると回復魔力が少し上がる。',
  },
  star_nut: {
    name: '星の木の実', type: 'use', price: 0, sell: 80, target: 'ally', battle: false, field: true,
    effect: { type: 'multi', parts: [...ALL.map((stat) => ({ type: 'seed', stat, amount: [1, 1] })), { type: 'seed', stat: 'hp', amount: [2, 3] }, { type: 'seed', stat: 'mp', amount: [2, 3] }] },
    desc: '星の光をあびて実った木の実。食べると全ての強さが少しずつ上がる。',
  },
  gold_nut: {
    name: '黄金の木の実', type: 'use', price: 0, sell: 150, target: 'ally', battle: false, field: true,
    effect: { type: 'multi', parts: [...ALL.map((stat) => ({ type: 'seed', stat, amount: [2, 3] })), { type: 'seed', stat: 'hp', amount: [5, 7] }, { type: 'seed', stat: 'mp', amount: [4, 6] }] },
    desc: '金色にかがやく、まぼろしの木の実。食べると全ての強さが上がる。',
  },
  // すごろく券（すごろく場で あそぶ。コインか 小さなメダルで 買う）
  sugoroku_ticket: {
    name: 'すごろく券', type: 'use', price: 0, sell: 0, target: 'self', battle: false, field: false,
    desc: 'カジノのすごろく場で使う券。大きなすごろくほど、たくさん使う。',
  },

  // ───── 景品コーナー: 段1（★3）─────
  roulette_shield: { ...cs(7, 3), ...CASINO, name: 'ルーレットのたて', resist: { confuse: 0.7 }, desc: '赤と黒のもようがくるくる回るたて。混乱しにくい。' },
  lucky_clover: { ...cc(7, 3), ...CASINO, name: '四つ葉のクローバー', bonus: { agi: 6, hp: 15 }, crit: 0.03, desc: '見つけるとしあわせになれる葉っぱのブローチ。会心が出やすい。' },
  // ───── 段2（★4）─────
  joker_sword: { ...cw('sword', 8, 4), ...CASINO, name: 'ジョーカーの剣', bonus: { agi: 4 }, onHit: { status: 'confuse', chance: 0.12 }, desc: 'どんなカードにもなるジョーカーの剣。ときどき敵を混乱させる。' },
  bunny_band: { ...ch(8, 4), ...CASINO, name: 'バニーのカチューシャ', bonus: { agi: 10, mag: 4 }, desc: 'うさぎの耳がついたカチューシャ。だれでも装備できる。とても素早くなる。' },
  coin_mail: { ...ca('heavy', 8, 4), ...CASINO, name: '金貨のよろい', bonus: { hp: 20 }, resist: { paralyze: 0.8 }, desc: 'カジノの金貨をうろこのようにならべた、ぴかぴかのよろい。' },
  // ───── 段3（★4〜★5）─────
  gambler_hat: { ...ch(8, 4, 1.05), ...CASINO, name: '勝負師のぼうし', bonus: { str: 5, agi: 5 }, crit: 0.05, desc: 'ここ一番で勝負する人のぼうし。会心がとても出やすい。' },
  royal_fan: { ...cw('fan', 9, 5), ...CASINO, name: 'ロイヤルストレートのおうぎ', bonus: { mag: 10, agi: 8 }, desc: '最強の手札をえがいたおうぎ。魔力と素早さが上がる。' },
  jackpot_shield: { ...cs(9, 5), ...CASINO, name: '大当たりのたて', resist: { fire: 0.85, ice: 0.85, bolt: 0.85 }, desc: '7が3つそろった大当たりのたて。炎・氷・雷に強い。' },
  dealer_vest: { ...ca('cloth', 9, 5), ...CASINO, name: 'ディーラーのベスト', bonus: { agi: 8, mag: 6 }, resist: { blind: 0.6 }, desc: 'カジノのディーラーのベスト。だれでも装備でき、マヌーサにかかりにくい。' },
  // ───── 段4（★5）─────
  casino_king_sword: { ...cw('sword', 10, 5), ...CASINO, name: 'カジノ王の剣', bonus: { str: 6, agi: 6 }, crit: 0.03, desc: 'カジノの王さまがかざっていた金と赤の剣。' },
  fortune_cape: { ...ca('cloth', 10, 5), ...CASINO, name: '大金持ちのマント', bonus: { agi: 10, mag: 8, hp: 20 }, resist: { sleep: 0.6 }, desc: 'ふちに金の糸をぬいこんだマント。だれでも装備できる。' },
  seven_ring: { ...cc(10, 5), ...CASINO, name: '777のゆびわ', bonus: { str: 10, agi: 10, mag: 10 }, crit: 0.04, mpRegen: 2, desc: '7が3つならんだゆびわ。行動するたびにMPが2回復する。' },

  // ───── すごろくでしか 手に入らない 品 ─────
  // はじめて ゴールした ごほうび
  lucky_dice: { ...cc(4, 2), ...SUGO, name: '幸運のさいころ', bonus: { agi: 4, hp: 8 }, crit: 0.02, desc: 'はじまりのすごろくのゴールでもらった、小さなさいころのお守り。' },
  sand_turban: { ...ch(7, 3), ...SUGO, name: '砂ばくのターバン', bonus: { hp: 15 }, resist: { fire: 0.85 }, desc: '砂ばくのすごろくをわたりきった人のターバン。炎に少し強い。' },
  cloud_boots: { ...cc(8, 4), ...SUGO, name: '雲の上のくつ', bonus: { agi: 15, mp: 10 }, desc: '空のすごろくのごほうび。雲の上を歩くように体が軽くなる。' },
  gold_dice: { ...cc(9, 5), ...SUGO, name: '黄金のさいころ', bonus: { str: 8, agi: 8, mag: 8, hp: 15 }, crit: 0.03, desc: '黄金のすごろくのゴールにかざられていたさいころ。全ての強さが上がる。' },
  sugoroku_crown: { ...ch(10, 5, 1.06), ...SUGO, name: 'すごろく王のかんむり', bonus: { str: 6, def: 6, agi: 6, mag: 6, heal: 6, hp: 20, mp: 10 }, desc: '伝説のすごろくを、初めてゴールした人だけのかんむり。' },
  // ゴールの 品（何回でも。上の すごろくほど 強い）
  oasis_ring: { ...cc(7, 3), ...SUGO, name: 'オアシスの指輪', bonus: { mp: 15, heal: 6 }, mpRegen: 1, desc: '砂ばくのオアシスの水色の指輪。行動するたびにMPが1回復する。' },
  desert_wind_claw: { ...cw('claw', 7, 3), ...SUGO, name: '砂じんのツメ', bonus: { agi: 5 }, resist: { wind: 0.85 }, desc: '砂あらしのようにすばやく切りさくツメ。' },
  sky_dice_staff: { ...cw('staff', 8, 4), ...SUGO, name: '天空のつえ', bonus: { mag: 22, heal: 10 }, resist: { bolt: 0.85 }, desc: '雲の上の神殿でまつられていたつえ。呪文の力がとても上がる。' },
  wind_cutter: { ...cw('boomerang', 8, 4), ...SUGO, name: '風きりのブーメラン', bonus: { agi: 6 }, crit: 0.03, desc: '空をきりさいて飛ぶブーメラン。敵全体に当たる。' },
  sky_robe: { ...ca('robe', 8, 4), ...SUGO, name: '天空のローブ', bonus: { mag: 8, mp: 15 }, resist: { wind: 0.7, bolt: 0.85 }, desc: '空の色をしたローブ。風と雷に強い。' },
  midas_axe: { ...cw('axe', 9, 5), ...SUGO, name: 'ミダス王のオノ', bonus: { str: 6 }, desc: 'さわった物が金になる王さまの、金色のオノ。' },
  golden_whip: { ...cw('whip', 9, 5), ...SUGO, name: '黄金のムチ', bonus: { agi: 6 }, onHit: { status: 'paralyze', chance: 0.12 }, desc: '金のくさりのようなムチ。ときどき敵をマヒさせる。' },
  golden_gi: { ...ca('gi', 9, 5), ...SUGO, name: '黄金の道着', bonus: { str: 6, agi: 4 }, desc: '金の糸でぬった道着。力と素早さが上がる。' },
  heaven_dice_sword: { ...cw('sword', 10, 5, 1.06), ...SUGO, name: '天のさいころの剣', bonus: { str: 8, agi: 8 }, crit: 0.04, desc: '伝説のすごろくのゴールでねむっていた剣。会心が出やすい。' },
  star_road_mail: { ...ca('heavy', 10, 5, 1.06), ...SUGO, name: '星の道のよろい', bonus: { hp: 30 }, resist: { fire: 0.8, ice: 0.8, bolt: 0.8 }, desc: '星の道をこえてきた勇者のよろい。炎・氷・雷に強い。' },
  goal_flag_spear: { ...cw('spear', 10, 5, 1.06), ...SUGO, name: 'ゴールの旗のやり', bonus: { agi: 6, hp: 15 }, desc: 'ゴールに立っていた旗のやり。持つと、元気がわいてくる。' },
  lucky_star_staff: { ...cw('staff', 10, 5, 1.06), ...SUGO, name: '幸運の星のつえ', bonus: { mag: 48, heal: 16 }, mpRegen: 2, desc: '流れ星をとじこめたつえ。呪文の力がとても上がり、MPも回復する。' },
  rainbow_dice_shield: { ...cs(10, 5, 1.06), ...SUGO, name: 'にじのさいころのたて', resist: { fire: 0.8, ice: 0.8, bolt: 0.8, dark: 0.8 }, desc: 'にじ色のさいころをかたどったたて。炎・氷・雷・闇に強い。' },
};
// 店では 買えない（売り値は ランクと レア度で）
for (const it of Object.values(ITEMS_CASINO_R37)) {
  if (it.rarity === undefined) continue;
  it.price = 0;
  it.sell = Math.round(SELL_R[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const CASINO_R37_KANA = {
  seed_mp: 'ふしぎなきのみ', seed_heal: 'いやしのたね', star_nut: 'ほしのきのみ', gold_nut: 'おうごんのきのみ', sugoroku_ticket: 'すごろくけん',
  roulette_shield: 'るーれっとのたて', lucky_clover: 'よつばのくろーばー', joker_sword: 'じょーかーのけん', bunny_band: 'ばにーのかちゅーしゃ',
  coin_mail: 'きんかのよろい', gambler_hat: 'しょうぶしのぼうし', royal_fan: 'ろいやるすとれーとのおうぎ', jackpot_shield: 'おおあたりのたて',
  dealer_vest: 'でぃーらーのべすと', casino_king_sword: 'かじのおうのけん', fortune_cape: 'おおがねもちのまんと', seven_ring: 'すりーせぶんのゆびわ',
  lucky_dice: 'こううんのさいころ', sand_turban: 'さばくのたーばん', cloud_boots: 'くものうえのくつ', gold_dice: 'おうごんのさいころ',
  sugoroku_crown: 'すごろくおうのかんむり', oasis_ring: 'おあしすのゆびわ', desert_wind_claw: 'さじんのつめ', sky_dice_staff: 'てんくうのつえ',
  wind_cutter: 'かぜきりのぶーめらん', sky_robe: 'てんくうのろーぶ', midas_axe: 'みだすおうのおの', golden_whip: 'おうごんのむち', golden_gi: 'おうごんのどうぎ',
  heaven_dice_sword: 'てんのさいころのけん', star_road_mail: 'ほしのみちのよろい', goal_flag_spear: 'ごーるのはたのやり', lucky_star_staff: 'こううんのほしのつえ',
  rainbow_dice_shield: 'にじのさいころのたて',
};
