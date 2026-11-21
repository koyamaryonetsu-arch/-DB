// 第3部 第2章 第2幕「青と白」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c10b.md の 14-4）:
//   C10B_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     青 c10b_bc1〜c10b_bc6 ／ 白 c10b_wc1〜c10b_wc6 ／ おまけ c10b_bbonus（青の 階。白の 音で こおる 水面 → 氷の 橋）・c10b_wbonus（白の 道。青の 音で とける 氷の かべ）
//     ★5 の 装備は 青 2つ（k 2.30〜2.32）・白 2つ（k 2.32〜2.34）・おまけに 1つずつ。のこりは 素材か 道具
//   c10bChest(id) → { item, n }（ない ときは null）
//   NOTE_SO（note_so）・NOTE_LA（note_la）… だいじな 物「星の音（ソ）」「星の音（ラ）」（使い方は A班）
//   C10B_SHOP_ADD … ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1・k 2.20〜2.22。4つ。A が 幕の クリアの あとの 店に 足す）
//
// ・宝箱（src: 'c10b'「水鏡のうらの宝箱でしか手に入らない」・'c10w'「氷の下の道の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。第1幕と おなじ）。店の 品も 防具だけ
// ・中ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c10bt_・c10wt_（宝箱）・c10bs_（店）・c10bb_（中ボス）

// 強さの めやす（items-c10a.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（青 2.30〜2.32・白 2.32〜2.34・おまけ）・店の かけ算
export const C10B_K = { b2: 2.3, b5: 2.32, w3: 2.32, w6: 2.34, bBonus: 2.31, wBonus: 2.33 };
export const C10B_SHOP_K = { lo: 2.2, mid: 2.21, hi: 2.22 };
const K = C10B_K, SK = C10B_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1。幕の クリアの あと）─────
const SHOP = {
  c10bs_mail: { ...A('heavy', 0, SK.lo), name: '青と白のよろい', price: 45600, bonus: { hp: 22 }, desc: '青と白の、2つの星の音の色にそめた、よろい。HPが少し上がる。' },
  c10bs_robe: { ...A('robe', 0, SK.mid), name: '青と白のローブ', price: 43400, bonus: { mag: 9 }, desc: '青と白の糸で、ていねいにおったローブ。魔力が少し上がる。' },
  c10bs_shield: { ...S(0, SK.mid), name: '青と白のたて', price: 42600, desc: '青と白の、2つの星がならんだ、まるいたて。' },
  c10bs_helm: { ...H(true, 0, SK.hi), name: '青と白のかぶと', price: 44000, bonus: { def: 7 }, desc: '青と白の、はねかざりのついたかぶと。守りが少し上がる。' },
};

const TB = { src: 'c10b' };
const TW = { src: 'c10w' };
const TREASURE = {
  // 青: 水鏡の うら
  c10bt_mirror_shield: { ...S(4, K.b2), ...TB, name: 'うら水鏡のたて', bonus: { hp: 56, mag: 10 }, resist: { light: 0.85, fire: 0.9 }, desc: '水鏡をうつしたような、ぴかぴかのたて。HPと魔力が上がる。光に少し強い。' },
  c10bt_ripple_robe: { ...A('robe', 4, K.b5), ...TB, name: 'さざなみのローブ', bonus: { mag: 20, heal: 16 }, resist: { fire: 0.85, wind: 0.9 }, desc: 'すそが、さざなみのようにゆれるローブ。魔力と回復の力が上がる。炎に少し強い。' },
  // おまけ（青の 階。白の 音で こおる 水面 → 氷の 橋の 先）
  c10bt_bridge_gi: { ...A('gi', 4, K.bBonus), ...TB, name: '氷の橋の道着', bonus: { agi: 18, str: 14 }, resist: { ice: 0.85 }, desc: 'こおった水面のような、すきとおった道着。素早さと力が上がる。氷に少し強い。' },
  // 白: 氷の 下の 道
  c10wt_moon_mail: { ...A('heavy', 4, K.w3), ...TW, name: '月夜のよろい', bonus: { hp: 60, def: 10 }, resist: { ice: 0.8 }, desc: '月の光を、とじこめたようなよろい。HPと守りが上がる。氷に強い。' },
  c10wt_quiet_helm: { ...H(true, 4, K.w6), ...TW, name: 'しのび足のかぶと', bonus: { hp: 52, agi: 14 }, resist: { ice: 0.85, sleep: 0.8 }, desc: '音をたてない、ふかふかの毛のかぶと。HPと素早さが上がる。氷に少し強い。' },
  // おまけ（白の 道。青の 音で とける 氷の かべの 先）
  c10wt_melt_shield: { ...S(4, K.wBonus), ...TW, name: 'とけ水のたて', bonus: { hp: 58, heal: 12 }, resist: { fire: 0.85, ice: 0.85 }, desc: 'とけた氷の水が、ふちを流れつづけるたて。HPと回復の力が上がる。炎と氷に少し強い。' },
};

// ───── 中ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // サー・ゲッコー: 砂時計の ブローチ
  c10bb_hourglass: {
    ...C(3), ...PB, boss: 'c10b_gecko', unique: true, name: 'しんしの砂時計', bonus: { hp: 130, str: 33, def: 33, mag: 32, agi: 31, heal: 28 }, resist: { wind: 0.85, blind: 0.6 },
    desc: 'ゲッコーが、おとしていった小さな砂時計。だれでも装備でき、すべての力が大きく上がる。風に強い。',
  },
  // かいとう シロフクロウ: 白い 羽かざり
  c10bb_owl_plume: {
    ...C(3), ...PB, boss: 'c10b_owl', unique: true, name: 'かいとうの白い羽', bonus: { hp: 124, str: 31, def: 31, mag: 34, agi: 36, heal: 30 }, resist: { light: 0.85, confuse: 0.6 },
    desc: 'シロフクロウが、のこしていった白い羽かざり。だれでも装備でき、すべての力が大きく上がる。混乱に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const NOTE_SO = 'note_so';
export const NOTE_LA = 'note_la';
const KEY = {
  [NOTE_SO]: {
    name: '星の音（ソ）', type: 'key',
    desc: '水鏡のうらの、かれた間にあった、青い光の玉。耳をすますと「ソ」の音がする。',
  },
  [NOTE_LA]: {
    name: '星の音（ラ）', type: 'key',
    desc: '白銀の湖の下の、月の間にあった、白い光の玉。耳をすますと「ラ」の音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C10B = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C10B_TREASURE = {
  // 青
  c10b_bc1: ['jou_herb', 4],
  c10b_bc2: ['c10bt_mirror_shield', 1],
  c10b_bc3: ['magic_water', 3],
  c10b_bc4: ['star_sand', 3],
  c10b_bc5: ['c10bt_ripple_robe', 1],
  c10b_bc6: ['elf_drink', 2],
  // 白
  c10b_wc1: ['toku_herb', 3],
  c10b_wc2: ['silver_shard', 3],
  c10b_wc3: ['c10wt_moon_mail', 1],
  c10b_wc4: ['revive_flower', 2],
  c10b_wc5: ['moon_drop', 3],
  c10b_wc6: ['c10wt_quiet_helm', 1],
  // おまけ
  c10b_bbonus: ['c10bt_bridge_gi', 1],
  c10b_wbonus: ['c10wt_melt_shield', 1],
};
export const C10B_CHEST_LIST = Object.keys(C10B_TREASURE);
// ★5 の 装備が 入って いる 宝箱（青 2・白 2・おまけ 2）
export const C10B_GEAR_CHESTS = { blue: ['c10b_bc2', 'c10b_bc5'], white: ['c10b_wc3', 'c10b_wc6'], bonus: ['c10b_bbonus', 'c10b_wbonus'] };
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c10bChest(id) {
  const e = C10B_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// 中ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C10B_DROPS = { c10b_gecko: ['c10bb_hourglass'], c10b_owl: ['c10bb_owl_plume'] };

// くぼ地の 武具屋に 足す 品（A が 幕の クリアの あとの 店に 足す。防具 4つ）
export const C10B_SHOP_ADD = ['c10bs_mail', 'c10bs_robe', 'c10bs_shield', 'c10bs_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C10B_ITEM_KANA = {
  c10bs_mail: 'あおとしろのよろい', c10bs_robe: 'あおとしろのろーぶ', c10bs_shield: 'あおとしろのたて', c10bs_helm: 'あおとしろのかぶと',
  c10bt_mirror_shield: 'うらみずかがみのたて', c10bt_ripple_robe: 'さざなみのろーぶ', c10bt_bridge_gi: 'こおりのはしのどうぎ',
  c10wt_moon_mail: 'つきよのよろい', c10wt_quiet_helm: 'しのびあしのかぶと', c10wt_melt_shield: 'とけみずのたて',
  c10bb_hourglass: 'しんしのすなどけい', c10bb_owl_plume: 'かいとうのしろいはね',
  [NOTE_SO]: 'ほしのおとそ', [NOTE_LA]: 'ほしのおとら',
};
