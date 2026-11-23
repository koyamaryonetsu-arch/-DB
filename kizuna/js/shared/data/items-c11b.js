// 第3部 第3章 第2幕「月の都と、名前のランプ」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c11b.md の 18-4・18-5）:
//   C11B_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     c11b_c1〜c11b_c8（うらの 町の 道・名前の 塔の おもて・うら）。★5 の 装備は 3つ（k 2.46〜2.50）。のこりは 素材か 道具
//     おすすめの 置き場（A班が きめて よい）: c1 うらの 町・c2 塔への 道の うら（★5）・c3 塔への 道の おもて・c4 塔 1階・
//       c5 塔 2階の うら（★5）・c6 塔 2階の おもて・c7 塔 3階・c8 塔の 上の テラスの 前（★5）
//   c11bChest(id) → { item, n }（ない ときは null）
//   NAME_LAMP（name_lamp）… だいじな 物「名前のランプ」（スピカの 名前の ランプ。中みの ない だいじな 物。使い方は A班）
//   C11B_FRONT_ARMS … おもての 町の 武具屋の ならび（店の ランク16 ＝ ランク10・★1・k 2.36〜2.38。防具 5つ）
//   C11B_BACK_TOOLS … うらの 町の 道具屋（今 ある 道具）・C11B_BACK_FINDS … うらの 町の ほり出し物（おもての 品と 同じ 強さで、少し 安い 防具 2つ）
//
// ・宝箱（src: 'c11b'「月の都の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。前の 幕と おなじ）。店の 品も 防具だけ
// ・k の 上がり方: 前の 幕の ★5 は 2.42〜2.46・店 2.32〜2.34（1幕で ＋0.04）→ この 幕は ★5 2.46〜2.50・店 2.36〜2.38
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c11bt_（宝箱）・c11bs_（おもての 店）・c11bf_（うらの ほり出し物）・c11bb_（ボス）
import { C7_SHOP_TOOLS } from './items-c7.js?v=dc7c9b067c89';

// 強さの めやす（items-c11a.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（2.46〜2.50）・店の かけ算（2.36〜2.38）
export const C11B_K = { c2: 2.46, c5: 2.48, c8: 2.5 };
export const C11B_SHOP_K = { lo: 2.36, mid: 2.37, hi: 2.38 };
const K = C11B_K, SK = C11B_SHOP_K;

// ───── おもての 町の 武具屋（店の ランク16。ランク10・★1）─────
const SHOP = {
  c11bs_mail: { ...A('heavy', 0, SK.lo), name: '月の都のよろい', price: 54800, bonus: { hp: 30 }, desc: '月の光のように、白くみがかれたよろい。HPが少し上がる。' },
  c11bs_robe: { ...A('robe', 0, SK.mid), name: '月の都のローブ', price: 53200, bonus: { mag: 11 }, desc: '三日月のししゅうが入った、ローブ。魔力が少し上がる。' },
  c11bs_gi: { ...A('gi', 0, SK.mid), name: '月の都の道着', price: 52600, bonus: { agi: 12 }, desc: '月の夜風のように、かるい道着。素早さが少し上がる。' },
  c11bs_shield: { ...S(0, SK.mid), name: '月の都のたて', price: 51400, desc: '三日月の形をした、銀のたて。' },
  c11bs_helm: { ...H(true, 0, SK.hi), name: '月の都のかぶと', price: 52000, desc: '月の形のかざりがついた、白いかぶと。' },
};
// ───── うらの 町の ほり出し物（おもての 品と 同じ 強さ。少し 安い）─────
const FIND = {
  c11bf_coat: { ...A('cloth', 0, SK.mid), name: 'ランプ守のコート', price: 36800, bonus: { hp: 24, heal: 8 }, desc: 'うらの町のランプ守が、むかし着ていたコート。HPと回復の力が少し上がる。' },
  c11bf_hood: { ...H(false, 0, SK.mid), name: 'うら町のずきん', price: 37200, bonus: { agi: 8 }, desc: 'うらの町で人気の、あたたかいずきん。素早さが少し上がる。' },
};

const TD = { src: 'c11b' };
const TREASURE = {
  // 塔への 道の うら
  c11bt_back_robe: { ...A('robe', 4, K.c2), ...TD, name: 'うら町のローブ', bonus: { mag: 24, heal: 15 }, resist: { dark: 0.85, ice: 0.9 }, desc: 'うらの町の、あたたかい明かりの色のローブ。魔力と回復の力が上がる。闇に少し強い。' },
  // 塔 2階の うら
  c11bt_tower_mail: { ...A('heavy', 4, K.c5), ...TD, name: '名前の塔のよろい', bonus: { hp: 64, def: 12 }, resist: { light: 0.85, ice: 0.9 }, desc: 'たくさんの名前がほられた、よろい。HPと守りが上がる。光に少し強い。' },
  // 塔の 上の テラスの 前
  c11bt_moon_shield: { ...S(4, K.c8), ...TD, name: '月かげのたて', bonus: { hp: 64, def: 10 }, resist: { dark: 0.85, light: 0.9 }, desc: '月の光と、かげの両方をうつす、ふしぎなたて。HPと守りが上がる。闇に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // ランプの番人: ランプの くさり
  c11bb_lamp_chain: {
    ...C(3), ...PB, boss: 'c11b_keeper', unique: true, name: 'ランプ守りのくさり', bonus: { hp: 128, str: 33, def: 32, mag: 32, agi: 32, heal: 30 }, resist: { light: 0.85, dark: 0.85 },
    desc: '番人が、大きなランプをつるしていたくさり。だれでも装備でき、すべての力が大きく上がる。光と闇に強い。',
  },
  // 月のむかえ オボロ: 雲の おび
  c11bb_oboro_sash: {
    ...C(3), ...PB, boss: 'c11b_oboro', unique: true, name: 'おぼろ月のおび', bonus: { hp: 130, str: 33, def: 33, mag: 32, agi: 30, heal: 29 }, resist: { ice: 0.85, confuse: 0.6 },
    desc: 'オボロが引いていくときに、のこしていった雲のおび。だれでも装備でき、すべての力が大きく上がる。氷に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う。中みの ない だいじな 物）─────
export const NAME_LAMP = 'name_lamp';
const KEY = {
  [NAME_LAMP]: {
    name: '名前のランプ', type: 'key',
    desc: '名前の塔にしまわれていた、スピカの名前のランプ。小さな火が、あたたかくともっている。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C11B = { ...SHOP, ...FIND, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C11B_TREASURE = {
  c11b_c1: ['elf_drink', 2],
  c11b_c2: ['c11bt_back_robe', 1],
  c11b_c3: ['star_sand', 3],
  c11b_c4: ['jou_herb', 4],
  c11b_c5: ['c11bt_tower_mail', 1],
  c11b_c6: ['magic_water', 3],
  c11b_c7: ['revive_flower', 2],
  c11b_c8: ['c11bt_moon_shield', 1],
};
export const C11B_CHEST_LIST = Object.keys(C11B_TREASURE);
// ★5 の 装備が 入って いる 宝箱（3つ。塔への 道の うら・塔 2階の うら・テラスの 前）
export const C11B_GEAR_CHESTS = ['c11b_c2', 'c11b_c5', 'c11b_c8'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c11bChest(id) {
  const e = C11B_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C11B_DROPS = { c11b_keeper: ['c11bb_lamp_chain'], c11b_oboro: ['c11bb_oboro_sash'] };

// おもての 町の 店（A が SHOPS に 作る。武具屋 … 防具 5つ）・うらの 町の 店（道具屋 … 今 ある 道具 ＋ ほり出し物 2つ）
export const C11B_FRONT_ARMS = ['c11bs_mail', 'c11bs_robe', 'c11bs_gi', 'c11bs_shield', 'c11bs_helm'];
export const C11B_BACK_TOOLS = [...C7_SHOP_TOOLS];
export const C11B_BACK_FINDS = ['c11bf_coat', 'c11bf_hood'];

// 読みがな（あいうえお順の ならびかえ）
export const C11B_ITEM_KANA = {
  c11bs_mail: 'つきのみやこのよろい', c11bs_robe: 'つきのみやこのろーぶ', c11bs_gi: 'つきのみやこのどうぎ', c11bs_shield: 'つきのみやこのたて', c11bs_helm: 'つきのみやこのかぶと',
  c11bf_coat: 'らんぷもりのこーと', c11bf_hood: 'うらまちのずきん',
  c11bt_back_robe: 'うらまちのろーぶ', c11bt_tower_mail: 'なまえのとうのよろい', c11bt_moon_shield: 'つきかげのたて',
  c11bb_lamp_chain: 'らんぷもりのくさり', c11bb_oboro_sash: 'おぼろづきのおび',
  [NAME_LAMP]: 'なまえのらんぷ',
};
