// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c11c.md の 19-4・19-5）:
//   C11C_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     c11c_c1〜c11c_c8（はかりの 回ろう 1〜3階・ひと休みの 部屋・大とびらの 前）。★5 の 装備は 3つ（k 2.50〜2.54）。のこりは 素材か 道具
//     おすすめの 置き場（A班が きめて よい）: c1 回ろう 1階・c2 回ろう 1階の おく（★5）・c3 回ろう 2階・c4 回ろう 2階・
//       c5 回ろう 2階の みぞの むこう（★5）・c6 ひと休みの 部屋・c7 回ろう 3階・c8 大とびらの 前（★5）
//   c11cChest(id) → { item, n }（ない ときは null）
//   C11C_BACK_ADD … うらの 町の 店に、幕の クリア（c11_act3）で 足す 品 4つ（前の 幕の 店より 1だん 上 … k 2.40〜2.42。A班が 店の ならびに 足す）
//
// ・宝箱（src: 'c11c'「はかりの回ろうの宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。前の 幕と おなじ）。店の 品も 防具だけ
// ・k の 上がり方: 前の 幕の ★5 は 2.46〜2.50・店 2.36〜2.38（1幕で ＋0.04）→ この 幕は ★5 2.50〜2.54・店 2.40〜2.42
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c11ct_（宝箱）・c11cs_（うらの 町の 店）・c11cb_（ボス）

// 強さの めやす（items-c11b.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（2.50〜2.54）・店の かけ算（2.40〜2.42）
export const C11C_K = { c2: 2.5, c5: 2.52, c8: 2.54 };
export const C11C_SHOP_K = { lo: 2.4, mid: 2.41, hi: 2.42 };
const K = C11C_K, SK = C11C_SHOP_K;

// ───── うらの 町の 店（幕の クリアで ふえる。ランク10・★1）─────
const SHOP = {
  c11cs_mail: { ...A('heavy', 0, SK.lo), name: 'はかりの間のよろい', price: 58400, bonus: { hp: 32 }, desc: '光のはかりの形をきざんだ、銀のよろい。HPが少し上がる。' },
  c11cs_robe: { ...A('robe', 0, SK.mid), name: 'ふたつ星のローブ', price: 56800, bonus: { mag: 12 }, desc: 'ならんだ2つの星のししゅうが入った、ローブ。魔力が少し上がる。' },
  c11cs_shield: { ...S(0, SK.mid), name: 'カードのたて', price: 55200, desc: 'かたい紙を、何まいもかさねて作った、ふしぎなたて。' },
  c11cs_helm: { ...H(true, 0, SK.hi), name: 'かいろうのかぶと', price: 55600, desc: '回ろうのランプのような、青白いかざりがついたかぶと。' },
};

const TD = { src: 'c11c' };
const TREASURE = {
  // 回ろう 1階の おく
  c11ct_scale_gi: { ...A('gi', 4, K.c2), ...TD, name: 'はかりの道着', bonus: { agi: 22, str: 14 }, resist: { light: 0.85, sleep: 0.7 }, desc: '光のはかりのように、つりあいのよい道着。素早さと力が上がる。光とねむりに少し強い。' },
  // 回ろう 2階の みぞの むこう
  c11ct_hall_robe: { ...A('robe', 4, K.c5), ...TD, name: 'かいろうのローブ', bonus: { mag: 25, heal: 15 }, resist: { dark: 0.85, light: 0.9 }, desc: '回ろうのかげのような、こい青のローブ。魔力と回復の力が上がる。闇に少し強い。' },
  // 大とびらの 前
  c11ct_door_mail: { ...A('heavy', 4, K.c8), ...TD, name: '大とびらのよろい', bonus: { hp: 66, def: 12 }, resist: { light: 0.85, sleep: 0.8 }, desc: '王宮の大とびらと同じ、白い石の色のよろい。HPと守りが上がる。光に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // バラバラン3号: はぐるまの バッジ
  c11cb_gear_badge: {
    ...C(3), ...PB, boss: 'c11c_mhead', unique: true, name: 'はぐるまバッジ', bonus: { hp: 129, str: 33, def: 32, mag: 32, agi: 31, heal: 30 }, resist: { bolt: 0.85, blast: 0.85 },
    desc: 'ばらばらになったメカから、ころがってきたはぐるま。だれでも装備でき、すべての力が大きく上がる。雷とばくはつに強い。',
  },
  // 近衛の隊長エース: カードもようの マント
  c11cb_ace_cape: {
    ...C(3), ...PB, boss: 'c11c_ace', unique: true, name: '近衛のマント', bonus: { hp: 130, str: 34, def: 32, mag: 31, agi: 31, heal: 29 }, resist: { sleep: 0.6, light: 0.85 },
    desc: '隊長がちらばった時に、のこっていた、カードもようのマント。だれでも装備でき、すべての力が大きく上がる。ねむりに強い。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C11C = { ...SHOP, ...TREASURE, ...BOSS };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C11C_TREASURE = {
  c11c_c1: ['elf_drink', 2],
  c11c_c2: ['c11ct_scale_gi', 1],
  c11c_c3: ['star_sand', 3],
  c11c_c4: ['jou_herb', 4],
  c11c_c5: ['c11ct_hall_robe', 1],
  c11c_c6: ['magic_water', 3],
  c11c_c7: ['revive_flower', 2],
  c11c_c8: ['c11ct_door_mail', 1],
};
export const C11C_CHEST_LIST = Object.keys(C11C_TREASURE);
// ★5 の 装備が 入って いる 宝箱（3つ。回ろう 1階の おく・2階の みぞの むこう・大とびらの 前）
export const C11C_GEAR_CHESTS = ['c11c_c2', 'c11c_c5', 'c11c_c8'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c11cChest(id) {
  const e = C11C_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]。メカは あたま・うで・あし の どれも 同じ 品〈1人 1つ〉）
export const C11C_DROPS = { c11c_mhead: ['c11cb_gear_badge'], c11c_ace: ['c11cb_ace_cape'] };

// うらの 町の 店に、幕の クリア（c11_act3）で 足す 品（A班が 店の ならびに 足す）
export const C11C_BACK_ADD = ['c11cs_mail', 'c11cs_robe', 'c11cs_shield', 'c11cs_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C11C_ITEM_KANA = {
  c11cs_mail: 'はかりのまのよろい', c11cs_robe: 'ふたつぼしのろーぶ', c11cs_shield: 'かーどのたて', c11cs_helm: 'かいろうのかぶと',
  c11ct_scale_gi: 'はかりのどうぎ', c11ct_hall_robe: 'かいろうのろーぶ', c11ct_door_mail: 'おおとびらのよろい',
  c11cb_gear_badge: 'はぐるまばっじ', c11cb_ace_cape: 'このえのまんと',
};
