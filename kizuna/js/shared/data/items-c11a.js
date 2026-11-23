// 第3部 第3章 第1幕「星の船と、星座の島」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c11a.md の 17-4・17-5）:
//   C11A_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     c11a_c1〜c11a_c8（星の海・とまり木の島・星座の 島 1〜3）。★5 の 装備は 3つ（k 2.42〜2.46）。のこりは 素材か 道具
//     おすすめの 置き場（A班が きめて よい）: c1 星の海の あさせの 先・c2 島1・c3 島1・c4 島2（★5）・c5 星の海の 流れの 先・
//       c6 島3（★5）・c7 とまり木の島・c8 星座の門の 前（★5）
//   c11aChest(id) → { item, n }（ない ときは null）
//   STAR_CHART（star_chart）… だいじな 物「星図」・STAR_SHIP（star_ship）… だいじな 物「星の船」（中みの ない だいじな 物。使い方は A班）
//   C11A_PERCH_ARMS … とまり木の島の 武具屋の ならび（店の ランク16 ＝ ランク10・★1・k 2.32〜2.34。防具 5つ）
//   C11A_PERCH_TOOLS … とまり木の島の 道具屋の ならび（今 ある 道具。第7章からの 道具屋と おなじ）
//
// ・宝箱（src: 'c11a'「星の海の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。前の 幕と おなじ）。店の 品も 防具だけ
// ・k の 上がり方: 前の 幕までの ★5 は 2.34〜2.38（第3幕）→ 2.38〜2.42（第4幕）、店は 2.24〜2.26 → 2.28〜2.30（1幕で ＋0.04）
//   → この 幕は ★5 2.42〜2.46・店 2.32〜2.34
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c11at_（宝箱）・c11as_（店）・c11ab_（ボス）
import { C7_SHOP_TOOLS } from './items-c7.js?v=28060a38724e';

// 強さの めやす（items-c10d.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（2.42〜2.46）・店の かけ算（2.32〜2.34）
export const C11A_K = { c4: 2.42, c6: 2.44, c8: 2.46 };
export const C11A_SHOP_K = { lo: 2.32, mid: 2.33, hi: 2.34 };
const K = C11A_K, SK = C11A_SHOP_K;

// ───── とまり木の島の 武具屋（店の ランク16。ランク10・★1）─────
const SHOP = {
  c11as_mail: { ...A('heavy', 0, SK.lo), name: '星の海のよろい', price: 52400, bonus: { hp: 28 }, desc: '星の海のしずくで、青くそめたよろい。HPが少し上がる。' },
  c11as_robe: { ...A('robe', 0, SK.mid), name: '星の海のローブ', price: 50800, bonus: { mag: 10 }, desc: '星の海の夜空の色の、ローブ。魔力が少し上がる。' },
  c11as_gi: { ...A('gi', 0, SK.mid), name: '星の海の道着', price: 50200, bonus: { agi: 11 }, desc: 'しおかぜのように、かるい道着。素早さが少し上がる。' },
  c11as_shield: { ...S(0, SK.mid), name: 'とまり木のたて', price: 49000, desc: 'とまり木の島の、古い木でできたたて。' },
  c11as_helm: { ...H(true, 0, SK.hi), name: '星の海のかぶと', price: 49600, desc: '星の形のかざりがついた、青いかぶと。' },
};

const TD = { src: 'c11a' };
const TREASURE = {
  // 星座の 島 2
  c11at_isle_mail: { ...A('heavy', 4, K.c4), ...TD, name: '星座の島のよろい', bonus: { hp: 62, def: 12 }, resist: { light: 0.85, ice: 0.9 }, desc: '星座の線のもようが光る、よろい。HPと守りが上がる。光に少し強い。' },
  // 星座の 島 3
  c11at_isle_robe: { ...A('robe', 4, K.c6), ...TD, name: 'ひとふでのローブ', bonus: { mag: 23, heal: 15 }, resist: { light: 0.85, dark: 0.9 }, desc: '1本の光の糸で、ひとふでにおったローブ。魔力と回復の力が上がる。光に少し強い。' },
  // 星座の門の 前
  c11at_gate_shield: { ...S(4, K.c8), ...TD, name: '星座の門のたて', bonus: { hp: 62, def: 10 }, resist: { fire: 0.85, light: 0.9 }, desc: '星座の門のかけらでできた、まるいたて。HPと守りが上がる。炎に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 星座のけもの: 星の くびわ
  c11ab_star_collar: {
    ...C(3), ...PB, boss: 'c11a_beast_head', unique: true, name: '星座のくびわ', bonus: { hp: 126, str: 33, def: 32, mag: 32, agi: 34, heal: 30 }, resist: { light: 0.85, sleep: 0.6 },
    desc: '星座のけものの、首にかかっていた光のわ。だれでも装備でき、すべての力が大きく上がる。光に強い。',
  },
  // いかり船長: いかりの バッジ
  c11ab_anchor_badge: {
    ...C(3), ...PB, boss: 'c11a_captain', unique: true, name: 'いかりのバッジ', bonus: { hp: 128, str: 34, def: 33, mag: 31, agi: 32, heal: 29 }, resist: { fire: 0.85, confuse: 0.6 },
    desc: '船長がにげるときに、落としていったバッジ。だれでも装備でき、すべての力が大きく上がる。炎に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う。中みの ない だいじな 物）─────
export const STAR_CHART = 'star_chart';
export const STAR_SHIP = 'star_ship';
const KEY = {
  [STAR_CHART]: {
    name: '星図', type: 'key',
    desc: '灯台のレンズがうつした、空の海の地図。星座の島の場所が、光の点で書いてある。',
  },
  [STAR_SHIP]: {
    name: '星の船', type: 'key',
    desc: 'くぼ地の職人たちが、星のかけらで作った船。7つの音で、星の海をすすむ。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C11A = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C11A_TREASURE = {
  c11a_c1: ['elf_drink', 2],
  c11a_c2: ['star_sand', 3],
  c11a_c3: ['jou_herb', 4],
  c11a_c4: ['c11at_isle_mail', 1],
  c11a_c5: ['magic_water', 3],
  c11a_c6: ['c11at_isle_robe', 1],
  c11a_c7: ['revive_flower', 2],
  c11a_c8: ['c11at_gate_shield', 1],
};
export const C11A_CHEST_LIST = Object.keys(C11A_TREASURE);
// ★5 の 装備が 入って いる 宝箱（3つ。島 2・島 3・星座の門の 前）
export const C11A_GEAR_CHESTS = ['c11a_c4', 'c11a_c6', 'c11a_c8'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c11aChest(id) {
  const e = C11A_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C11A_DROPS = { c11a_beast_head: ['c11ab_star_collar'], c11a_captain: ['c11ab_anchor_badge'] };

// とまり木の島の 店（A が SHOPS に 作る。武具屋 … 防具 5つ・道具屋 … 今 ある 道具）
export const C11A_PERCH_ARMS = ['c11as_mail', 'c11as_robe', 'c11as_gi', 'c11as_shield', 'c11as_helm'];
export const C11A_PERCH_TOOLS = [...C7_SHOP_TOOLS];

// 読みがな（あいうえお順の ならびかえ）
export const C11A_ITEM_KANA = {
  c11as_mail: 'ほしのうみのよろい', c11as_robe: 'ほしのうみのろーぶ', c11as_gi: 'ほしのうみのどうぎ', c11as_shield: 'とまりぎのたて', c11as_helm: 'ほしのうみのかぶと',
  c11at_isle_mail: 'せいざのしまのよろい', c11at_isle_robe: 'ひとふでのろーぶ', c11at_gate_shield: 'せいざのもんのたて',
  c11ab_star_collar: 'せいざのくびわ', c11ab_anchor_badge: 'いかりのばっじ',
  [STAR_CHART]: 'せいず', [STAR_SHIP]: 'ほしのふね',
};
