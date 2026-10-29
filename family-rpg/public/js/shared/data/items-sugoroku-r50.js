// 第50回 D2: すごろくでしか 手に入らない 装備（items-casino.js で まぜる）
//
// すごろくの ゴール・宝箱・宝部屋・すごろく商人で 手に入る（data/sugoroku.js）。src: 'sugoroku'
// 強さは items-casino-r37.js の すごろくの 品と おなじ 作り方（段ごとの ランク: 段0 4・段1 7・段2 8・段3 9・段4 10）
//   段0 は はじまりの すごろく（第2章の カモメ港の 品くらい）。上の 段ほど その段の 物語の 店の 品より 少し 強い
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
const SUGO = { src: 'sugoroku' };

export const ITEMS_SUGOROKU_R50 = {
  // ───── 段0「はじまりのすごろく」（★2）─────
  sg_koma_hat: { ...ch(4, 2), ...SUGO, name: 'こまのぼうし', bonus: { agi: 3, hp: 6 }, desc: 'すごろくのこまの形をした、まるいぼうし。少し素早くなる。' },
  sg_dice_dagger: { ...cw('dagger', 4, 2), ...SUGO, name: 'さいころのナイフ', bonus: { agi: 3 }, crit: 0.03, desc: 'つかにさいころがついたナイフ。会心が出やすい。' },
  sg_start_vest: { ...ca('cloth', 4, 2), ...SUGO, name: 'スタートのはっぴ', bonus: { agi: 2, hp: 8 }, desc: 'すごろくのスタートで着る、元気な色のはっぴ。' },
  // ───── 段1「砂ばくのすごろく」（★3）─────
  sg_dune_axe: { ...cw('axe', 7, 3), ...SUGO, name: '砂山のオノ', bonus: { str: 4 }, resist: { fire: 0.9 }, desc: '砂山をひとふりでくずす、大きなオノ。炎に少し強い。' },
  sg_sandglass_shield: { ...cs(7, 3), ...SUGO, name: '砂丘のたて', resist: { sleep: 0.7 }, desc: '砂丘の砂をかためて、砂時計をうめこんだたて。ねむりにかかりにくい。' },
  sg_scarab_charm: { ...cc(7, 3), ...SUGO, name: '黄金虫のお守り', bonus: { def: 6, hp: 15 }, desc: '砂ばくの黄金虫をかたどったお守り。体がじょうぶになる。' },
  // ───── 段2「空のすごろく」（★4）─────
  sg_rainbow_fan: { ...cw('fan', 8, 4), ...SUGO, name: 'にじ雲のおうぎ', bonus: { mag: 8, agi: 4 }, desc: 'あおぐと、にじ色の雲がわき出るおうぎ。魔力と素早さが上がる。' },
  sg_cloud_shield: { ...cs(8, 4), ...SUGO, name: '雲のたて', resist: { wind: 0.8, bolt: 0.85 }, desc: 'ふわふわの雲をかためたたて。風と雷に強い。' },
  sg_thunder_band: { ...ch(8, 4), ...SUGO, name: 'いなずまのはちまき', bonus: { str: 6, agi: 6 }, desc: 'いなずまのもようのはちまき。力と素早さが上がる。' },
  // ───── 段3「黄金のすごろく」（★5）─────
  sg_jackpot_bat: { ...cw('bat', 9, 5), ...SUGO, name: '大当たりのバット', bonus: { str: 5 }, crit: 0.05, desc: '金ぴかの大当たりのバット。会心がとても出やすい。' },
  sg_golden_robe: { ...ca('robe', 9, 5), ...SUGO, name: '黄金のローブ', bonus: { mag: 10, heal: 6, mp: 15 }, desc: '金の糸でおったローブ。呪文の力とMPが上がる。' },
  sg_lucky_cat: { ...cc(9, 5), ...SUGO, name: 'まねきねこのお守り', bonus: { str: 6, agi: 6, mag: 6, hp: 20 }, crit: 0.02, desc: '手をふる金のねこのお守り。全ての強さが上がる。' },
  // ───── 段4「伝説のすごろく」（★5）─────
  sg_dragon_dice_claw: { ...cw('claw', 10, 5, 1.06), ...SUGO, name: '竜のさいころのツメ', bonus: { str: 6, agi: 10 }, crit: 0.04, desc: '竜のツメにさいころの目がきざまれている。会心が出やすい。' },
  sg_comet_boomerang: { ...cw('boomerang', 10, 5, 1.06), ...SUGO, name: 'さいころ星のブーメラン', bonus: { agi: 8, mag: 6 }, resist: { light: 0.85 }, desc: 'さいころの形の星のように光って飛ぶブーメラン。敵全体に当たる。' },
  sg_legend_cape: { ...ca('cloth', 10, 5, 1.06), ...SUGO, name: '伝説のすごろくマント', bonus: { agi: 10, mag: 6, hp: 25 }, resist: { fire: 0.85, ice: 0.85 }, desc: '伝説のすごろくを走りぬけた人のマント。炎と氷に強い。' },
};
// 店では 買えない（売り値は ランクと レア度で）
for (const it of Object.values(ITEMS_SUGOROKU_R50)) {
  it.price = 0;
  it.sell = Math.round(SELL_R[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const SUGOROKU_R50_KANA = {
  sg_koma_hat: 'こまのぼうし', sg_dice_dagger: 'さいころのないふ', sg_start_vest: 'すたーとのはっぴ',
  sg_dune_axe: 'すなやまのおの', sg_sandglass_shield: 'さきゅうのたて', sg_scarab_charm: 'こがねむしのおまもり',
  sg_rainbow_fan: 'にじぐものおうぎ', sg_cloud_shield: 'くものたて', sg_thunder_band: 'いなずまのはちまき',
  sg_jackpot_bat: 'おおあたりのばっと', sg_golden_robe: 'おうごんのろーぶ', sg_lucky_cat: 'まねきねこのおまもり',
  sg_dragon_dice_claw: 'りゅうのさいころのつめ', sg_comet_boomerang: 'さいころぼしのぶーめらん', sg_legend_cape: 'でんせつのすごろくまんと',
};
