// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c11d.md の 20-5・20-6）:
//   C11D_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     c11d_c1〜c11d_c8（かがやきの 塔 1〜4階・玉座の 間の 前）。★5 の 装備は 4つ（k 2.54〜2.58）。のこりは 素材か 道具
//     さいごの 1つ（c8）は 第3部で いちばん 強い 品（k 2.58 … 第3部の どの 防具より 守りが 高い。テストで 見る）
//     おすすめの 置き場（A班が きめて よい）: c1 塔 1階・c2 塔 1階の おく（★5）・c3 塔 2階・c4 塔 2階の うら（★5）・c5 塔 3階・
//       c6 塔 3階の かげの 台の むこう（★5）・c7 塔 4階 音の 間・c8 玉座の 間の 前（★5 … いちばん 強い 品）
//   c11dChest(id) → { item, n }（ない ときは null）
//   C11D_FRONT_ADD … 月の都の おもての 店に、第3部の クリア（c11_act4）で 足す 品 4つ（前の 幕の 店より 1だん 上 … k 2.44〜2.46。A班が 店の ならびに 足す）
//   NOTE_EIGHT（note_eight）… だいじな 物「八つめの音」（中みの ない だいじな 物。使い方は A班）
//
// ・宝箱（src: 'c11d'「かがやきの塔の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。前の 幕と おなじ）。店の 品も 防具だけ
// ・k の 上がり方: 前の 幕の ★5 は 2.50〜2.54・店 2.40〜2.42（1幕で ＋0.04）→ この 幕は ★5 2.54〜2.58・店 2.44〜2.46
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c11dt_（宝箱）・c11ds_（おもての 店）・c11db_（ボス）

// 強さの めやす（items-c11c.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（2.54〜2.58）・店の かけ算（2.44〜2.46）
export const C11D_K = { c2: 2.54, c4: 2.55, c6: 2.56, c8: 2.58 };
export const C11D_SHOP_K = { lo: 2.44, mid: 2.45, hi: 2.46 };
const K = C11D_K, SK = C11D_SHOP_K;

// ───── 月の都の おもての 店（第3部の クリアで ふえる。ランク10・★1）─────
const SHOP = {
  c11ds_mail: { ...A('heavy', 0, SK.lo), name: 'かがやきのよろい', price: 61200, bonus: { hp: 34 }, desc: '塔の白い石のように、かがやくよろい。HPが少し上がる。' },
  c11ds_robe: { ...A('robe', 0, SK.mid), name: '八つ星のローブ', price: 59600, bonus: { mag: 13 }, desc: '8つの星のししゅうが、ぐるりと入ったローブ。魔力が少し上がる。' },
  c11ds_shield: { ...S(0, SK.mid), name: '星の橋のたて', price: 58000, desc: '星の橋のもようを、うちだした、かるいたて。' },
  c11ds_helm: { ...H(true, 0, SK.hi), name: 'ランプのかぶと', price: 58400, desc: '名前のランプのような、あたたかい色のかざりがついたかぶと。' },
};

const TD = { src: 'c11d' };
const TREASURE = {
  // 塔 1階の おく
  c11dt_prism_gi: { ...A('gi', 4, K.c2), ...TD, name: 'プリズムの道着', bonus: { agi: 23, str: 15 }, resist: { light: 0.85, blind: 0.7 }, desc: 'にじ色に光る、かるい道着。素早さと力が上がる。光と目つぶしに少し強い。' },
  // 塔 2階の うら
  c11dt_moon_robe: { ...A('robe', 4, K.c4), ...TD, name: '月かげのローブ', bonus: { mag: 26, heal: 16 }, resist: { dark: 0.85, confuse: 0.8 }, desc: '月のかげの色をした、しずかなローブ。魔力と回復の力が上がる。闇に少し強い。' },
  // 塔 3階の かげの 台の むこう
  c11dt_shadow_shield: { ...S(4, K.c6), ...TD, name: 'かげぼしのたて', bonus: { def: 12, hp: 30 }, resist: { light: 0.85, dark: 0.85 }, desc: 'となりにならぶ、かげの星をかたどったたて。守りとHPが上がる。光と闇に少し強い。' },
  // 玉座の 間の 前（第3部で いちばん 強い 品）
  c11dt_eight_mail: { ...A('heavy', 4, K.c8), ...TD, name: '八つの音のよろい', bonus: { hp: 72, def: 14, agi: 10 }, resist: { light: 0.8, sleep: 0.8, confuse: 0.8 }, desc: '8つの音の色が、ひかりの線でつながったよろい。HPと守りと素早さが上がる。光に強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 鏡と月の使い: 鏡と 月の かざりの リボン
  c11db_duo_ribbon: {
    ...C(3), ...PB, boss: 'c11d_mirror', unique: true, name: '鏡と月のリボン', bonus: { hp: 130, str: 33, def: 33, mag: 32, agi: 30, heal: 29 }, resist: { light: 0.85, confuse: 0.6 },
    desc: 'ミラーレとオボロが、引いていくときに、のこしていったリボン。だれでも装備でき、すべての力が大きく上がる。光に強い。',
  },
  // かがやきの女王ポラリス: 北の 星の ティアラ
  c11db_queen_tiara: {
    ...C(3), ...PB, boss: 'c11d_queen', unique: true, name: '北の星のティアラ', bonus: { hp: 131, str: 33, def: 33, mag: 32, agi: 30, heal: 28 }, resist: { light: 0.8, sleep: 0.6 },
    desc: '女王が、手を下ろした時に、そっとわたしてくれた小さなティアラ。だれでも装備でき、すべての力が大きく上がる。光とねむりに強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う。中みの ない だいじな 物）─────
export const NOTE_EIGHT = 'note_eight';
const KEY = {
  [NOTE_EIGHT]: {
    name: '八つめの音', type: 'key',
    desc: 'くぼ地の8つめの台から、のぼってきた、小さな光。耳をすますと、やさしい音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C11D = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C11D_TREASURE = {
  c11d_c1: ['elf_drink', 2],
  c11d_c2: ['c11dt_prism_gi', 1],
  c11d_c3: ['star_sand', 3],
  c11d_c4: ['c11dt_moon_robe', 1],
  c11d_c5: ['jou_herb', 4],
  c11d_c6: ['c11dt_shadow_shield', 1],
  c11d_c7: ['revive_flower', 2],
  c11d_c8: ['c11dt_eight_mail', 1],
};
export const C11D_CHEST_LIST = Object.keys(C11D_TREASURE);
// ★5 の 装備が 入って いる 宝箱（4つ）・いちばん 強い 品
export const C11D_GEAR_CHESTS = ['c11d_c2', 'c11d_c4', 'c11d_c6', 'c11d_c8'];
export const C11D_BEST = 'c11dt_eight_mail';
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c11dChest(id) {
  const e = C11D_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]。中ボスは ミラーレ・オボロの どちらも 同じ 品〈1人 1つ〉）
export const C11D_DROPS = { c11d_mirror: ['c11db_duo_ribbon'], c11d_queen: ['c11db_queen_tiara'] };

// 月の都の おもての 店に、第3部の クリア（c11_act4）で 足す 品（A班が 店の ならびに 足す）
export const C11D_FRONT_ADD = ['c11ds_mail', 'c11ds_robe', 'c11ds_shield', 'c11ds_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C11D_ITEM_KANA = {
  c11ds_mail: 'かがやきのよろい', c11ds_robe: 'やつぼしのろーぶ', c11ds_shield: 'ほしのはしのたて', c11ds_helm: 'らんぷのかぶと',
  c11dt_prism_gi: 'ぷりずむのどうぎ', c11dt_moon_robe: 'つきかげのろーぶ', c11dt_shadow_shield: 'かげぼしのたて', c11dt_eight_mail: 'やっつのおとのよろい',
  c11db_duo_ribbon: 'かがみとつきのりぼん', c11db_queen_tiara: 'きたのほしのてぃあら', note_eight: 'やっつめのおと',
};
