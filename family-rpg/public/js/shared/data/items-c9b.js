// 第3部 第1章 第2幕「鉱山の底の先」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3.md の 10-4・plan-ch7.md の 4-4）:
//   C9B_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     大地の下 c9b_u1〜c9b_u6 / ヒカリゴケの里 c9b_v1 / 大王の やしき c9b_h1〜c9b_h3
//     ★5 の 装備は 4つ（u2・u4・h1・h3）。ほかは 素材か 道具
//   c9bChest(id) → { item, n }（ない ときは null）
//   UNDER_RAFT（under_raft）… だいじな 物「いかだ」（使い方は A班。ここは 品の データだけ）
//   C9B_SHOP_WEAPONS・C9B_SHOP_ARMOR … ながれ星のくぼ地の 武具屋の ならび（ランク10・★1・k 2.06〜2.08。A が 店を 作る ときに 使う）
//
// ・宝箱（src: 'c9b'「鉱山の底の先の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。k 2.14〜2.18
// ・ボスの 品（src: 'pastboss'）: デデドン大王が かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   お守り（アクセ）の よい 力の 合計は 287 まで（第1幕と おなじ。伝説の アクセが「いちばんの 8わり」を 下回らない … test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・大王の 大ジャンプ（物理）・からからほのお（炎）に そなえて、炎に 少し 強い 品を 多めに
// id の 先頭: c9bt_（宝箱）・c9bs_（店）・c9bb_（ボス）… 第1幕の ボスの 品が c9b_ を 使って いる ので かさならない ように

// 強さの めやす（items-c9a.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
// rarity … レア度（店 0・宝箱 4・ボスの 武器 5）。k … 強さの かけ算
const W = (cat, rarity, k) => ({ type: 'weapon', cat, rank: R, rarity, atk: Math.round(SWORD[R] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（大地の下 → やしきの おく）・店の かけ算
export const C9B_K = { u2: 2.14, u4: 2.15, h1: 2.17, h3: 2.18 };
export const C9B_SHOP_K = { lo: 2.06, mid: 2.07, hi: 2.08 };
const K = C9B_K, SK = C9B_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋（ランク10・★1）─────
const SHOP = {
  c9bs_sword: { ...W('sword', 0, SK.hi), name: '星くずの鉄の剣', price: 41600, desc: 'ながれ星の鉄をきたえた剣。くぼ地の武具屋の、いちばんのじまん。' },
  c9bs_spear: { ...W('spear', 0, SK.mid), name: '星くずの鉄のやり', price: 39800, desc: 'ながれ星の鉄の、長いやり。' },
  c9bs_axe: { ...W('axe', 0, SK.mid), name: '星くずの鉄のオノ', price: 40400, desc: 'ながれ星の鉄の、大きなオノ。' },
  c9bs_staff: { ...W('staff', 0, SK.lo), name: '星くずのつえ', price: 36000, bonus: { mag: 12, heal: 10 }, desc: '先に、小さなながれ星のかけらがついたつえ。魔力と回復の力が少し上がる。' },
  c9bs_mail: { ...A('heavy', 0, SK.hi), name: '星くずの鉄のよろい', bonus: { agi: -2 }, price: 43600, desc: 'ながれ星の鉄の板をつないだ、じょうぶなよろい。' },
  c9bs_robe: { ...A('robe', 0, SK.mid), name: '星くずのローブ', bonus: { mag: 9 }, price: 38200, desc: '星くずをおりこんだ、ローブ。魔力が少し上がる。' },
  c9bs_shield: { ...S(0, SK.mid), name: '星くずの鉄のたて', price: 35400, desc: 'ながれ星の鉄の、まるいたて。' },
  c9bs_helm: { ...H(true, 0, SK.lo), name: '星くずの鉄のかぶと', price: 33800, desc: 'ながれ星の鉄の、かたいかぶと。' },
};

const TK = { src: 'c9b' };
const TREASURE = {
  // 大地の下（水晶の 野原）
  c9bt_crystal_spear: { ...W('spear', 4, K.u2), ...TK, name: '水晶のやり', bonus: { str: 18, agi: 12 }, resist: { ice: 0.85 }, desc: '大地の下の水晶をけずって作った、すきとおったやり。力と素早さが上がる。氷に少し強い。' },
  // 大地の下（光る こけの 原）
  c9bt_moss_hat: { ...H(false, 4, K.u4), ...TK, name: 'ヒカリゴケのぼうし', bonus: { hp: 48, mag: 14, heal: 12 }, resist: { dark: 0.8 }, desc: '光るこけを、ふんわりあんだぼうし。魔力と回復の力が上がる。闇に強い。' },
  // 大王の やしき（食料庫）
  c9bt_mole_axe: { ...W('axe', 4, K.h1), ...TK, name: 'もぐらの大オノ', bonus: { str: 22 }, resist: { fire: 0.85 }, desc: 'もぐらの兵隊が、トンネルをほるのに使う大きなオノ。力が上がる。炎に少し強い。' },
  // 大王の やしき（ごちそうの 間の 前）
  c9bt_table_shield: { ...S(4, K.h3), ...TK, name: 'ごちそうの大皿のたて', bonus: { hp: 50 }, resist: { fire: 0.8, dark: 0.85 }, desc: '大王のテーブルの、いちばん大きな金の皿。たてにぴったり。炎に強く、闇に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // デデドン大王: 1人 1つの アクセサリー（第3部 第1章 第2幕の お守り）と、大王の木づち（今までで いちばん 強い こんぼう）
  c9bb_king_bib: {
    ...C(3), ...PB, boss: 'c9b_dededon', unique: true, name: '大王のナプキン', bonus: { hp: 128, str: 35, def: 33, mag: 35, agi: 30, heal: 26 }, resist: { fire: 0.7, dark: 0.85 },
    desc: '大王が、ごちそうの時に首にまいていた大きなナプキン。だれでも装備でき、すべての力が大きく上がる。炎に強い。',
  },
  c9bb_king_mallet: {
    ...W('bat', 5, 2.04), ...PB, boss: 'c9b_dededon', name: '大王の木づち', bonus: { str: 24, def: 12 }, crit: 0.03, resist: { fire: 0.85 },
    desc: '大王の、木でできた大きなつち。今までのどのこんぼうよりも強い。会心が出やすい。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const UNDER_RAFT = 'under_raft';
const KEY = {
  [UNDER_RAFT]: {
    name: 'いかだ', type: 'key',
    desc: 'ヒカリゴケの里の村長にもらった、じょうぶないかだ。大地の下の川を、下っていける。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C9B = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C9B_TREASURE = {
  c9b_u1: ['star_sand', 4],
  c9b_u2: ['c9bt_crystal_spear', 1],
  c9b_u3: ['toku_herb', 3],
  c9b_u4: ['c9bt_moss_hat', 1],
  c9b_u5: ['silver_shard', 3],
  c9b_u6: ['elf_drink', 2],
  c9b_v1: ['land_shard', 3],
  c9b_h1: ['c9bt_mole_axe', 1],
  c9b_h2: ['revive_flower', 2],
  c9b_h3: ['c9bt_table_shield', 1],
};
export const C9B_CHEST_IDS = Object.keys(C9B_TREASURE);
// ★5 の 装備が 入って いる 宝箱（4つ）
export const C9B_GEAR_CHESTS = ['c9b_u2', 'c9b_u4', 'c9b_h1', 'c9b_h3'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c9bChest(id) {
  const e = C9B_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C9B_DROPS = { c9b_dededon: ['c9bb_king_bib', 'c9bb_king_mallet'] };

// 店の ならび（A が ながれ星のくぼ地の 武具屋を 作る ときに 使う）
export const C9B_SHOP_WEAPONS = ['c9bs_sword', 'c9bs_spear', 'c9bs_axe', 'c9bs_staff'];
export const C9B_SHOP_ARMOR = ['c9bs_mail', 'c9bs_robe', 'c9bs_shield', 'c9bs_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C9B_ITEM_KANA = {
  c9bs_sword: 'ほしくずのてつのけん', c9bs_spear: 'ほしくずのてつのやり', c9bs_axe: 'ほしくずのてつのおの', c9bs_staff: 'ほしくずのつえ',
  c9bs_mail: 'ほしくずのてつのよろい', c9bs_robe: 'ほしくずのろーぶ', c9bs_shield: 'ほしくずのてつのたて', c9bs_helm: 'ほしくずのてつのかぶと',
  c9bt_crystal_spear: 'すいしょうのやり', c9bt_moss_hat: 'ひかりごけのぼうし', c9bt_mole_axe: 'もぐらのおおおの', c9bt_table_shield: 'ごちそうのおおざらのたて',
  c9bb_king_bib: 'だいおうのなぷきん', c9bb_king_mallet: 'だいおうのきづち',
  [UNDER_RAFT]: 'いかだ',
};
