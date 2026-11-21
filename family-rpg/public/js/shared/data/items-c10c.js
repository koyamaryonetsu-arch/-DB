// 第3部 第2章 第3幕「紫と、うばわれた音」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c10c.md の 15-4）:
//   C10C_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     空 c10c_ic1〜c10c_ic6 ／ とりで c10c_fc1〜c10c_fc6
//     ★5 の 装備は 空 2つ（k 2.34〜2.36）・とりで 2つ（k 2.36〜2.38）。のこりは 素材か 道具
//   c10cChest(id) → { item, n }（ない ときは null）
//   NOTE_SI（note_si）… だいじな 物「星の音（シ）」（使い方は A班）
//   C10C_SHOP_ADD … ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1・k 2.24〜2.26。4つ。A が 幕の クリアの あとの 店に 足す）
//
// ・宝箱（src: 'c10i'「空の小島の宝箱でしか手に入らない」・'c10f'「少年のとりでの宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。第1幕・第2幕と おなじ）。店の 品も 防具だけ
// ・ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c10it_・c10ft_（宝箱）・c10cs_（店）・c10cb_（ボス）

// 強さの めやす（items-c10b.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（空 2.34〜2.36・とりで 2.36〜2.38）・店の かけ算
export const C10C_K = { i2: 2.34, i5: 2.36, f3: 2.36, f6: 2.38 };
export const C10C_SHOP_K = { lo: 2.24, mid: 2.25, hi: 2.26 };
const K = C10C_K, SK = C10C_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1。幕の クリアの あと）─────
const SHOP = {
  c10cs_mail: { ...A('heavy', 0, SK.lo), name: 'むらさきのよろい', price: 47200, bonus: { hp: 24 }, desc: 'むらさきの星の音の色にそめた、よろい。HPが少し上がる。' },
  c10cs_robe: { ...A('robe', 0, SK.mid), name: 'むらさきのローブ', price: 45000, bonus: { mag: 10 }, desc: 'むらさきの糸で、ていねいにおったローブ。魔力が少し上がる。' },
  c10cs_shield: { ...S(0, SK.mid), name: 'むらさきのたて', price: 44200, desc: 'むらさきの星が1つ、まん中にかがやく、まるいたて。' },
  c10cs_helm: { ...H(true, 0, SK.hi), name: 'むらさきのかぶと', price: 45600, bonus: { def: 8 }, desc: 'むらさきのはねかざりのついたかぶと。守りが少し上がる。' },
};

const TI = { src: 'c10i' };
const TF = { src: 'c10f' };
const TREASURE = {
  // 空の 小島
  c10it_cloud_helm: { ...H(true, 4, K.i2), ...TI, name: '雲の上のかぶと', bonus: { hp: 54, agi: 14 }, resist: { wind: 0.85, bolt: 0.9 }, desc: 'ふわふわの雲のかざりがついた、かるいかぶと。HPと素早さが上がる。風に少し強い。' },
  c10it_bridge_gi: { ...A('gi', 4, K.i5), ...TI, name: '音の橋の道着', bonus: { agi: 20, str: 14 }, resist: { bolt: 0.85 }, desc: '5色の光の糸で、ぬいとった道着。素早さと力が上がる。雷に少し強い。' },
  // 少年の とりで
  c10ft_belt_mail: { ...A('heavy', 4, K.f3), ...TF, name: '工場のはがねよろい', bonus: { hp: 62, def: 10 }, resist: { fire: 0.85, blind: 0.8 }, desc: 'ベルトの工場の、はがねでできたよろい。HPと守りが上がる。炎に少し強い。' },
  c10ft_star_shield: { ...S(4, K.f6), ...TF, name: '星あかりのたて', bonus: { hp: 58, heal: 14 }, resist: { dark: 0.85, light: 0.9 }, desc: 'びんの中の星の光を、とじこめたたて。HPと回復の力が上がる。闇に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // たいさムスカリ: 花の しるしの バッジ
  c10cb_badge: {
    ...C(3), ...PB, boss: 'c10c_muscari', unique: true, name: '花のしるしのバッジ', bonus: { hp: 128, str: 34, def: 32, mag: 30, agi: 33, heal: 30 }, resist: { bolt: 0.85, paralyze: 0.6 },
    desc: 'たいさのぼうしについていた、花のしるしのバッジ。だれでも装備でき、すべての力が大きく上がる。雷に強い。',
  },
  // アルゴル: 灰色の 星の かけら
  c10cb_gray_star: {
    ...C(3), ...PB, boss: 'c10c_algol', unique: true, name: '灰色の星のかけら', bonus: { hp: 126, str: 30, def: 32, mag: 36, agi: 33, heal: 30 }, resist: { dark: 0.85, silence: 0.6 },
    desc: '少年のマントから、こぼれおちた小さな星のかけら。だれでも装備でき、すべての力が大きく上がる。闇に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const NOTE_SI = 'note_si';
const KEY = {
  [NOTE_SI]: {
    name: '星の音（シ）', type: 'key',
    desc: '少年のとりでで、取り返した、むらさきの光の玉。耳をすますと「シ」の音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C10C = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C10C_TREASURE = {
  // 空の 小島
  c10c_ic1: ['toku_herb', 3],
  c10c_ic2: ['c10it_cloud_helm', 1],
  c10c_ic3: ['magic_water', 3],
  c10c_ic4: ['star_sand', 3],
  c10c_ic5: ['c10it_bridge_gi', 1],
  c10c_ic6: ['elf_drink', 2],
  // 少年の とりで
  c10c_fc1: ['jou_herb', 4],
  c10c_fc2: ['silver_shard', 3],
  c10c_fc3: ['c10ft_belt_mail', 1],
  c10c_fc4: ['revive_flower', 2],
  c10c_fc5: ['moon_drop', 3],
  c10c_fc6: ['c10ft_star_shield', 1],
};
export const C10C_CHEST_LIST = Object.keys(C10C_TREASURE);
// ★5 の 装備が 入って いる 宝箱（空 2・とりで 2）
export const C10C_GEAR_CHESTS = { isles: ['c10c_ic2', 'c10c_ic5'], fort: ['c10c_fc3', 'c10c_fc6'] };
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c10cChest(id) {
  const e = C10C_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C10C_DROPS = { c10c_muscari: ['c10cb_badge'], c10c_algol: ['c10cb_gray_star'] };

// くぼ地の 武具屋に 足す 品（A が 幕の クリアの あとの 店に 足す。防具 4つ）
export const C10C_SHOP_ADD = ['c10cs_mail', 'c10cs_robe', 'c10cs_shield', 'c10cs_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C10C_ITEM_KANA = {
  c10cs_mail: 'むらさきのよろい', c10cs_robe: 'むらさきのろーぶ', c10cs_shield: 'むらさきのたて', c10cs_helm: 'むらさきのかぶと',
  c10it_cloud_helm: 'くものうえのかぶと', c10it_bridge_gi: 'おとのはしのどうぎ',
  c10ft_belt_mail: 'こうじょうのはがねよろい', c10ft_star_shield: 'ほしあかりのたて',
  c10cb_badge: 'はなのしるしのばっじ', c10cb_gray_star: 'はいいろのほしのかけら',
  [NOTE_SI]: 'ほしのおとし',
};
