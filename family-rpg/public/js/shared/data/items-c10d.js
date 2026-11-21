// 第3部 第2章 第4幕「金の音と、星の橋」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c10d.md の 16-4）:
//   C10D_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     c10d_c1〜c10d_c6（星の 階段の おどり場の わきと いただき）。★5 の 装備は 3つ（k 2.38〜2.42）。のこりは 素材か 道具
//   c10dChest(id) → { item, n }（ない ときは null）
//   NOTE_DO（note_do）… だいじな 物「星の音（ド）」（使い方は A班）
//   C10D_SHOP_ADD … ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1・k 2.28〜2.30。4つ。A が 幕の クリアの あとの 店に 足す）
//
// ・宝箱（src: 'c10d'「星の階段の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。前の 幕と おなじ）。店の 品も 防具だけ
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c10dt_（宝箱）・c10ds_（店）・c10db_（ボス）

// 強さの めやす（items-c10c.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（2.38〜2.42）・店の かけ算（2.28〜2.30）
export const C10D_K = { c2: 2.38, c4: 2.4, c6: 2.42 };
export const C10D_SHOP_K = { lo: 2.28, mid: 2.29, hi: 2.3 };
const K = C10D_K, SK = C10D_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1。幕の クリアの あと）─────
const SHOP = {
  c10ds_mail: { ...A('heavy', 0, SK.lo), name: '金の音のよろい', price: 49800, bonus: { hp: 26 }, desc: '金色の星の音の色にそめた、よろい。HPが少し上がる。' },
  c10ds_gi: { ...A('gi', 0, SK.mid), name: '金の音の道着', price: 47400, bonus: { agi: 10 }, desc: '金の糸で、ていねいにぬった道着。素早さが少し上がる。' },
  c10ds_shield: { ...S(0, SK.mid), name: '金の音のたて', price: 46600, desc: '7つの小さな星が、まるくならんだたて。' },
  c10ds_hat: { ...H(false, 0, SK.hi), name: '金の音のぼうし', price: 47000, bonus: { mag: 9 }, desc: '金色のリボンの、ぼうし。魔力が少し上がる。' },
};

const TD = { src: 'c10d' };
const TREASURE = {
  c10dt_stair_mail: { ...A('heavy', 4, K.c2), ...TD, name: '星の階段のよろい', bonus: { hp: 60, def: 12 }, resist: { light: 0.85, bolt: 0.9 }, desc: '光の階段の石でできた、かがやくよろい。HPと守りが上がる。光に少し強い。' },
  c10dt_cloud_robe: { ...A('robe', 4, K.c4), ...TD, name: '雲の上のローブ', bonus: { mag: 22, heal: 14 }, resist: { light: 0.85, wind: 0.9 }, desc: '星の階段の雲を、ふんわりおったローブ。魔力と回復の力が上がる。光に少し強い。' },
  c10dt_summit_shield: { ...S(4, K.c6), ...TD, name: 'いただきの金のたて', bonus: { hp: 60, def: 10 }, resist: { light: 0.85, dark: 0.9 }, desc: '星の階段のいただきで見つけた、金色のたて。HPと守りが上がる。光に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // ミラーレ: 金の ふちの 手鏡
  c10db_hand_mirror: {
    ...C(3), ...PB, boss: 'c10d_mirare', unique: true, name: '金のふちの手鏡', bonus: { hp: 126, str: 32, def: 33, mag: 32, agi: 33, heal: 30 }, resist: { light: 0.85, confuse: 0.6 },
    desc: 'ミラーレのまわりにうかんでいた、小さな手鏡。だれでも装備でき、すべての力が大きく上がる。光に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const NOTE_DO = 'note_do';
const KEY = {
  [NOTE_DO]: {
    name: '星の音（ド）', type: 'key',
    desc: '星の階段のいただきで手に入れた、金色の光の玉。耳をすますと「ド」の音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C10D = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C10D_TREASURE = {
  c10d_c1: ['elf_drink', 2],
  c10d_c2: ['c10dt_stair_mail', 1],
  c10d_c3: ['magic_water', 3],
  c10d_c4: ['c10dt_cloud_robe', 1],
  c10d_c5: ['revive_flower', 2],
  c10d_c6: ['c10dt_summit_shield', 1],
};
export const C10D_CHEST_LIST = Object.keys(C10D_TREASURE);
// ★5 の 装備が 入って いる 宝箱（3つ。おどり場の わき 2つと いただき）
export const C10D_GEAR_CHESTS = ['c10d_c2', 'c10d_c4', 'c10d_c6'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c10dChest(id) {
  const e = C10D_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C10D_DROPS = { c10d_mirare: ['c10db_hand_mirror'] };

// くぼ地の 武具屋に 足す 品（A が 幕の クリアの あとの 店に 足す。防具 4つ）
export const C10D_SHOP_ADD = ['c10ds_mail', 'c10ds_gi', 'c10ds_shield', 'c10ds_hat'];

// 読みがな（あいうえお順の ならびかえ）
export const C10D_ITEM_KANA = {
  c10ds_mail: 'きんのおとのよろい', c10ds_gi: 'きんのおとのどうぎ', c10ds_shield: 'きんのおとのたて', c10ds_hat: 'きんのおとのぼうし',
  c10dt_stair_mail: 'ほしのかいだんのよろい', c10dt_cloud_robe: 'くものうえのろーぶ', c10dt_summit_shield: 'いただきのきんのたて',
  c10db_hand_mirror: 'きんのふちのてかがみ',
  [NOTE_DO]: 'ほしのおとど',
};
