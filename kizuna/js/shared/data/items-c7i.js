// 第2部 第7章 第3幕「ひとりぼっちの星」の 品（B: 品。items.js で まぜる。A が 店・宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch7.md の 8-2・4-4）:
//   C7I_TREASURE … 氷の竜の城 1〜8階の 宝箱の 中み（{ 1: [★5の 装備, 素材か 道具], …, 8: [...] }）
//     第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材（鉄・銀・星のかけら など）か 道具 1つ
//     素材・道具の 数は C7I_TREASURE_N（同じ ならび。装備は 1）。c7iChest(階, k) → { item, n }
//   C7I_LETTER_REWARDS … 時をこえる手紙の ごほうび（{ 1〜4: [[id, こすう], …] }。A が 手紙ごとに 1つずつ）
//   C7I_SHOP_WEAPONS・C7I_SHOP_ARMOR・C7I_SHOP_TOOLS … 千年前の シロガネの 村の 店の ならび（ランク10・★1。A が 店を 作る ときに 使う）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・店（ランク10・★1・レア度 0）: カイの 島の 店（items-c7s.js。かけ算 1.10）より 少し 強い（かけ算 1.14）
// ・宝箱（src: 'c7i'「氷の竜の城の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C7I_K: 1階 1.71 → 8階 1.78（第2幕の 灯台 8階 1.70 の 少し 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」。第1幕・第2幕と おなじ）: レア度 4・かけ算 1.72 ＋ 素材
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
import { C7_SHOP_TOOLS } from './items-c7.js?v=ff7f831793ea';

// 強さの めやす（items-c7s.js と おなじ。ランク 0〜10）
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

// 店の かけ算・宝箱の 階ごとの かけ算・手紙の ごほうびの かけ算
export const C7I_SHOP_K = 1.14;
export const C7I_K = { 1: 1.71, 2: 1.72, 3: 1.73, 4: 1.74, 5: 1.75, 6: 1.76, 7: 1.77, 8: 1.78 };
export const C7I_LETTER_K = 1.72;
const SK = C7I_SHOP_K, K = C7I_K, LK = C7I_LETTER_K;

// ───── 千年前の シロガネの 村の 店（ランク10・★1）─────
const SHOP = {
  c7i_snow_sword: { ...W('sword', 0, SK), name: '白銀の剣', price: 16600, desc: '雪のように白くかがやく剣。竜守りの村の戦士たちが使う。' },
  c7i_snow_spear: { ...W('spear', 0, SK), name: '雪山のやり', price: 15800, desc: '雪山の氷をくだいて進む、長いやり。' },
  c7i_snow_axe: { ...W('axe', 0, SK), name: '氷わりのオノ', price: 16000, desc: 'あつい氷も、まっ二つにわる大きなオノ。' },
  c7i_snow_dagger: { ...W('dagger', 0, SK), name: '雪原の短剣', price: 12800, desc: '雪原の氷をけずった、とても細い短剣。' },
  c7i_snow_boomerang: { ...W('boomerang', 0, SK), name: '雪風のブーメラン', price: 13200, desc: '雪の上を、風にのってすべるように飛ぶブーメラン。' },
  c7i_snow_staff: { ...W('staff', 0, SK), name: '氷の花のつえ', price: 14000, bonus: { mag: 10, heal: 8 }, desc: '先に、とけない氷の花がさいたつえ。魔力と回復の力が少し上がる。' },
  c7i_snow_fan: { ...W('fan', 0, SK), name: '雪の羽のおうぎ', price: 13200, desc: '白い鳥の羽を、たくさん集めたおうぎ。' },
  c7i_snow_mail: { ...A('heavy', 0, SK), name: '白銀のよろい', bonus: { agi: -2 }, price: 17400, desc: '白銀の板をつないだ、竜守りの村のよろい。' },
  c7i_snow_robe: { ...A('robe', 0, SK), name: '粉雪のローブ', bonus: { mag: 8 }, price: 15000, desc: '雪のようにかるくて、あったかいローブ。魔力が少し上がる。' },
  c7i_snow_gi: { ...A('gi', 0, SK), name: '毛皮の道着', bonus: { agi: 3 }, price: 14600, desc: 'えりに毛皮のついた、あったかい道着。素早さが少し上がる。' },
  c7i_snow_shield: { ...S(0, SK), name: '白い氷のたて', price: 13000, desc: '雪山の、とけない氷をけずったたて。' },
  c7i_snow_helm: { ...H(true, 0, SK), name: '雪山のかぶと', price: 12400, desc: '竜の角の形のかざりがついた、村の戦士のかぶと。' },
  c7i_snow_hat: { ...H(false, 0, SK), name: '毛糸のぼうし', price: 10600, desc: 'ぽんぽんのついた、あったかい毛糸のぼうし。' },
};

const TK = { src: 'c7i' };
const TREASURE = {
  // 1階（入口）
  c7it_snow_ring: { ...C(), ...TK, name: '雪の花の指輪', bonus: { mag: 15, heal: 15, agi: 10, hp: 34 }, resist: { ice: 0.8, sleep: 0.6 }, desc: '雪の花の形をした、小さな指輪。だれでも装備でき、魔力と回復の力が上がる。ねむりにくい。' },
  // 2階
  c7it_bear_hat: { ...H(false, 4, K[2]), ...TK, name: '白くまの毛皮のぼうし', bonus: { agi: 10, hp: 30 }, resist: { ice: 0.8, sleep: 0.7 }, desc: '白くまの毛皮でできた、ふかふかのぼうし。氷に強く、ねむりにくい。' },
  // 3階
  c7it_icicle_whip: { ...W('whip', 4, K[3]), ...TK, name: 'つららのムチ', bonus: { agi: 12, str: 8 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: '細いつららを、たくさんつないだムチ。ときどきマヒさせる。' },
  // 4階（休み所）
  c7it_queen_robe: { ...A('robe', 4, K[4]), ...TK, name: '雪の女王のローブ', bonus: { mag: 20, heal: 12 }, resist: { ice: 0.8, fire: 0.85 }, desc: '雪の女王が着ていたという、青白いローブ。氷に強く、炎に少し強い。' },
  // 5階
  c7it_scale_mail: { ...A('heavy', 4, K[5]), ...TK, name: '氷竜のうろこのよろい', bonus: { hp: 36, agi: -2 }, resist: { fire: 0.8, ice: 0.85 }, desc: '氷の竜のうろこを、かさねて作ったよろい。炎に強く、氷に少し強い。' },
  // 6階
  c7it_dragon_shield: { ...S(4, K[6]), ...TK, name: '氷の竜のたて', bonus: { hp: 36 }, resist: { ice: 0.8, dark: 0.8 }, desc: '氷の竜の顔がほられた、大きなたて。氷と闇に強い。' },
  // 7階（休み所）
  c7it_north_staff: { ...W('staff', 4, K[7]), ...TK, name: '北の星のつえ', bonus: { mag: 36, heal: 30 }, mpRegen: 1, resist: { dark: 0.8 }, desc: '北の空の星の光を、先にとじこめたつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c7it_ice_sword: { ...W('sword', 4, K[8]), ...TK, name: '氷の竜の剣', bonus: { str: 18, agi: 10 }, resist: { ice: 0.8, dark: 0.85 }, desc: '氷の竜の城のおくで、千年ねむっていた剣。灯台の守りの剣より、少し強い。氷に強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // いばらの魔女マレフィナ: 1人 1つの アクセサリー（drops.boss）と、黒竜のやり（drops.rare の 1回に 1回。今までで いちばん 強い やり）
  c7w_thorn_charm: {
    ...C(3), ...PB, boss: 'c7_witch', unique: true, name: 'いばらのお守り', bonus: { hp: 102, str: 28, def: 24, mag: 26, agi: 22, heal: 20 }, resist: { fire: 0.7, sleep: 0.5, dark: 0.8 },
    desc: 'マレフィナのいばらに、さいていた小さな花のかざり。だれでも装備でき、すべての力が大きく上がる。ねむりにくい。',
  },
  c7w_dragon_spear: {
    ...W('spear', 5, 1.78), ...PB, boss: 'c7_witch', name: '黒竜のやり', bonus: { str: 16, agi: 10 }, crit: 0.03, resist: { fire: 0.8 },
    desc: '黒い竜のつのから作ったやり。今までのどのやりよりも強い。会心が出やすい。',
  },
  // カイの影: 1人 1つの アクセサリーと、影のブーメラン（今までで いちばん 強い ブーメラン）
  c7h_shadow_charm: {
    ...C(3), ...PB, boss: 'c7_shadow', unique: true, name: '星かげのお守り', bonus: { hp: 104, str: 28, def: 24, mag: 28, agi: 26, heal: 20 }, resist: { dark: 0.6, paralyze: 0.6, fire: 0.8 },
    desc: 'カイの影が消えたあとに、のこっていた星のかけら。だれでも装備でき、すべての力が大きく上がる。闇に強く、マヒしにくい。',
  },
  c7h_shadow_boomerang: {
    ...W('boomerang', 5, 1.82), ...PB, boss: 'c7_shadow', name: '影のブーメラン', bonus: { agi: 18, str: 10 }, crit: 0.04, resist: { dark: 0.8 },
    desc: 'カイの影が投げていた、黒いブーメラン。今までのどのブーメランよりも強い。会心が出やすい。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c7il_snow_necklace: { ...C(4), ...LT, name: '千年の雪の首かざり', bonus: { hp: 44, str: 13, mag: 13, agi: 14, heal: 11 }, resist: { ice: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった首かざり。だれでも装備でき、すべての力が上がる。' },
  c7il_keeper_boomerang: { ...W('boomerang', 4, LK), ...LT, name: '竜守りのブーメラン', bonus: { agi: 12, str: 8 }, resist: { ice: 0.8 }, desc: '竜守りの村の子どもが、千年前に作ったブーメラン。氷に強い。' },
  c7il_peak_gi: { ...A('gi', 4, LK), ...LT, name: '雪山の道着', bonus: { str: 13, agi: 14, hp: 34 }, resist: { ice: 0.8, paralyze: 0.6 }, desc: '雪山で、けいこをする人の道着。力と素早さが上がる。マヒしにくい。' },
  c7il_keeper_helm: { ...H(true, 4, LK), ...LT, name: '竜守りのかぶと', bonus: { hp: 42, def: 6 }, resist: { fire: 0.8, sleep: 0.6 }, desc: '千年前の竜守りが、かぶっていたかぶと。炎に強く、ねむりにくい。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C7I = { ...SHOP, ...TREASURE, ...BOSS, ...LETTER };

// 氷の竜の城 1〜8階の 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。上の 階ほど 強く・めずらしく）
export const C7I_TREASURE = {
  1: ['c7it_snow_ring', 'ice_crystal'],
  2: ['c7it_bear_hat', 'toku_herb'],
  3: ['c7it_icicle_whip', 'white_snowball'],
  4: ['c7it_queen_robe', 'elf_drink'],
  5: ['c7it_scale_mail', 'star_shard'],
  6: ['c7it_dragon_shield', 'dragon_scale'],
  7: ['c7it_north_staff', 'revive_flower'],
  8: ['c7it_ice_sword', 'star_iron'],
};
// 宝箱の 中の 数（C7I_TREASURE と おなじ ならび。装備は 1つ）
export const C7I_TREASURE_N = { 1: [1, 3], 2: [1, 3], 3: [1, 4], 4: [1, 1], 5: [1, 3], 6: [1, 2], 7: [1, 2], 8: [1, 1] };
// 階 n の k ばんめの 宝箱 → { item, n }（A の マップ用。ない ときは null）
export function c7iChest(floor, k) {
  const item = C7I_TREASURE[floor]?.[k];
  return item ? { item, n: C7I_TREASURE_N[floor]?.[k] || 1 } : null;
}

// 時をこえる手紙の ごほうび（{ 手紙の 番号: [[id, こすう], …] }。A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C7I_LETTER_REWARDS = {
  1: [['c7il_snow_necklace', 1], ['white_snowball', 4]],
  2: [['c7il_keeper_boomerang', 1], ['ice_crystal', 3]],
  3: [['c7il_peak_gi', 1], ['silver_shard', 3]],
  4: [['c7il_keeper_helm', 1], ['star_shard', 3]],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C7I_DROPS = { c7_witch: ['c7w_thorn_charm', 'c7w_dragon_spear'], c7_shadow: ['c7h_shadow_charm', 'c7h_shadow_boomerang'] };

// 村の 店の ならび（ランク10。A が 店を 作る ときに 使う）。のこりは 島の 店・緑の王国の 店の 品
export const C7I_SHOP_WEAPONS = ['c7i_snow_sword', 'c7i_snow_spear', 'c7i_snow_axe', 'c7i_snow_dagger', 'c7i_snow_boomerang', 'c7i_snow_staff', 'c7i_snow_fan', 'c7_kingdom_whip', 'p6_kodai_claw', 'p6_kodai_bat'];
export const C7I_SHOP_ARMOR = ['c7i_snow_mail', 'p6_kodai_mantle', 'c7i_snow_robe', 'c7i_snow_gi', 'c7i_snow_shield', 'c7i_snow_helm', 'c7i_snow_hat'];
export const C7I_SHOP_TOOLS = [...C7_SHOP_TOOLS];

// 読みがな（あいうえお順の ならびかえ）
export const C7I_ITEM_KANA = {
  c7i_snow_sword: 'はくぎんのけん', c7i_snow_spear: 'ゆきやまのやり', c7i_snow_axe: 'こおりわりのおの', c7i_snow_dagger: 'せつげんのたんけん',
  c7i_snow_boomerang: 'ゆきかぜのぶーめらん', c7i_snow_staff: 'こおりのはなのつえ', c7i_snow_fan: 'ゆきのはねのおうぎ', c7i_snow_mail: 'はくぎんのよろい',
  c7i_snow_robe: 'こなゆきのろーぶ', c7i_snow_gi: 'けがわのどうぎ', c7i_snow_shield: 'しろいこおりのたて', c7i_snow_helm: 'ゆきやまのかぶと', c7i_snow_hat: 'けいとのぼうし',
  c7it_snow_ring: 'ゆきのはなのゆびわ', c7it_bear_hat: 'しろくまのけがわのぼうし', c7it_icicle_whip: 'つららのむち', c7it_queen_robe: 'ゆきのじょおうのろーぶ',
  c7it_scale_mail: 'ひょうりゅうのうろこのよろい', c7it_dragon_shield: 'こおりのりゅうのたて', c7it_north_staff: 'きたのほしのつえ', c7it_ice_sword: 'こおりのりゅうのけん',
  c7w_thorn_charm: 'いばらのおまもり', c7w_dragon_spear: 'こくりゅうのやり', c7h_shadow_charm: 'ほしかげのおまもり', c7h_shadow_boomerang: 'かげのぶーめらん',
  c7il_snow_necklace: 'せんねんのゆきのくびかざり', c7il_keeper_boomerang: 'りゅうもりのぶーめらん', c7il_peak_gi: 'ゆきやまのどうぎ', c7il_keeper_helm: 'りゅうもりのかぶと',
};
