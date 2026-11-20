// 第3部 第1章 第3幕「さかさのピラミッド」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3.md の 11-5・plan-ch7.md の 4-4）:
//   C9C_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     地下の川 c9c_r1〜c9c_r3 / さかさのピラミッド c9c_q1〜c9c_q8
//     ★5 の 装備は 4つ（r2・q3・q6・q8。k 2.18〜2.22）。ほかは 素材か 道具
//   c9cChest(id) → { item, n }（ない ときは null）
//   NOTE_MI（note_mi）… だいじな 物「星の音（ミ）」（使い方は A班。ここは 品の データだけ）
//   C9C_SHOP_ADD … ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1・k 2.10〜2.12。4つ。A が 店に 足す）
//
// ・宝箱（src: 'c9c'「さかさのピラミッドの宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）
// ・ボスの 品（src: 'pastboss'）: ナゾカケ・ヒックリカエール2号が かならず 1人 1つの アクセサリー（レア度 3）と、
//   いちばん めずらしい 色（レア度 5）の 武器（ブーメラン・短剣 … 今までで いちばん 強い）
//   お守り（アクセ）の よい 力の 合計は 287 まで（第1幕・第2幕と おなじ。伝説の アクセが「いちばんの 8わり」を 下回らない … test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・店の 品は 前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
//   （第2幕で tools/sim-jobs.mjs の SHOP_GEAR・test/craft-trial-r65・test/ch5-castle-battle が こわれた ため）
// id の 先頭: c9ct_（宝箱）・c9cs_（店）・c9cb_（ボス）… 魔物の id（c9c_）と かさならない ように

// 強さの めやす（items-c9b.js と おなじ。ランク 0〜10）
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
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（川 → ピラミッドの おく）・店の かけ算
export const C9C_K = { r2: 2.18, q3: 2.19, q6: 2.2, q8: 2.22 };
export const C9C_SHOP_K = { lo: 2.1, mid: 2.11, hi: 2.12 };
const K = C9C_K, SK = C9C_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1。星の音を 手に 入れた あと）─────
const SHOP = {
  c9cs_dagger: { ...W('dagger', 0, SK.lo), name: 'ながれ星の短剣', price: 36800, bonus: { agi: 8 }, desc: 'ながれ星の鉄をうすくきたえた短剣。素早さが少し上がる。' },
  c9cs_boomerang: { ...W('boomerang', 0, SK.mid), name: 'ながれ星のブーメラン', price: 37600, desc: 'ながれ星の鉄の、よくもどってくるブーメラン。' },
  c9cs_gi: { ...A('gi', 0, SK.mid), name: 'ながれ星の道着', price: 39400, bonus: { agi: 6 }, desc: 'ながれ星の糸でぬった、動きやすい道着。素早さが少し上がる。' },
  c9cs_hat: { ...H(false, 0, SK.hi), name: 'ながれ星のぼうし', price: 34600, bonus: { mag: 8 }, desc: 'ながれ星の形のかざりがついた、ぼうし。魔力が少し上がる。' },
};

const TK = { src: 'c9c' };
const TREASURE = {
  // 地下の川（わき道の 小さな 岸）
  c9ct_river_whip: { ...W('whip', 4, K.r2), ...TK, name: '地下の川のムチ', bonus: { str: 16, agi: 16 }, resist: { bolt: 0.85 }, desc: '地下の川の、長い水草をよりあわせて作ったムチ。力と素早さが上がる。雷に少し強い。' },
  // さかさのピラミッド 2階（天じょうの 宝箱）
  c9ct_scarab_gi: { ...A('gi', 4, K.q3), ...TK, name: 'こがねスカラベの道着', bonus: { agi: 14, str: 10 }, resist: { dark: 0.85 }, desc: '金色の虫のはねのように、きらきら光る道着。素早さと力が上がる。闇に少し強い。' },
  // さかさのピラミッド 3階
  c9ct_upside_helm: { ...H(true, 4, K.q6), ...TK, name: 'さかさ王のかぶと', bonus: { hp: 52, def: 10 }, resist: { wind: 0.85 }, desc: '天じょうにさかさにかざられていた、王さまのかぶと。HPと守りが上がる。風に少し強い。' },
  // さかさのピラミッド 4階（さかさの 大広間）
  c9ct_star_robe: { ...A('robe', 4, K.q8), ...TK, name: 'さかさの星のローブ', bonus: { mag: 18, heal: 14 }, resist: { light: 0.8, dark: 0.85 }, desc: '夜空の星が、下から上へ流れるもようのローブ。魔力と回復の力が上がる。光に強く、闇に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // なぞの番人 ナゾカケ: 1人 1つの アクセサリーと、なぞなぞブーメラン（今までで いちばん 強い ブーメラン）
  c9cb_riddle_charm: {
    ...C(3), ...PB, boss: 'c9c_nazokake', unique: true, name: 'なぞの番人のくびかざり', bonus: { hp: 124, str: 33, def: 35, mag: 37, agi: 30, heal: 28 }, resist: { wind: 0.8, confuse: 0.6 },
    desc: 'ナゾカケが、くびにさげていた石のくびかざり。だれでも装備でき、すべての力が大きく上がる。混乱しにくい。',
  },
  c9cb_riddle_boomerang: {
    ...W('boomerang', 5, 2.06), ...PB, boss: 'c9c_nazokake', name: 'なぞなぞブーメラン', bonus: { agi: 18, mag: 10 }, crit: 0.02, resist: { wind: 0.85 },
    desc: 'ナゾカケの、さかさの三角のブーメラン。今までのどのブーメランよりも強い。',
  },
  // ヒックリカエール2号: 1人 1つの アクセサリーと、すなどけいの短剣（今までで いちばん 強い 短剣）
  c9cb_trio_goggles: {
    ...C(3), ...PB, boss: 'c9c_hikkuri', unique: true, name: 'ホシドロ一味のゴーグル', bonus: { hp: 130, str: 36, def: 32, mag: 33, agi: 32, heal: 24 }, resist: { bolt: 0.75, blind: 0.6 },
    desc: 'ホシドロ一味が、メカの中でかけていたゴーグル。だれでも装備でき、すべての力が大きく上がる。雷に強い。',
  },
  c9cb_sand_dagger: {
    ...W('dagger', 5, 2.08), ...PB, boss: 'c9c_hikkuri', name: 'すなどけいの短剣', bonus: { agi: 20, str: 12 }, crit: 0.03,
    desc: 'メカの砂時計の、かけらでできた短剣。今までのどの短剣よりも強い。会心が出やすい。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const NOTE_MI = 'note_mi';
const KEY = {
  [NOTE_MI]: {
    name: '星の音（ミ）', type: 'key',
    desc: 'さかさのピラミッドの、音の間にうかんでいた、黄色い光の玉。耳をすますと「ミ」の音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C9C = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C9C_TREASURE = {
  c9c_r1: ['toku_herb', 3],
  c9c_r2: ['c9ct_river_whip', 1],
  c9c_r3: ['magic_powder', 3],
  c9c_q1: ['elf_drink', 2],
  c9c_q2: ['silver_shard', 3],
  c9c_q3: ['c9ct_scarab_gi', 1],
  c9c_q4: ['revive_flower', 2],
  c9c_q5: ['star_sand', 4],
  c9c_q6: ['c9ct_upside_helm', 1],
  c9c_q7: ['land_shard', 3],
  c9c_q8: ['c9ct_star_robe', 1],
};
export const C9C_CHEST_LIST = Object.keys(C9C_TREASURE);
// ★5 の 装備が 入って いる 宝箱（4つ）
export const C9C_GEAR_CHESTS = ['c9c_r2', 'c9c_q3', 'c9c_q6', 'c9c_q8'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c9cChest(id) {
  const e = C9C_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C9C_DROPS = { c9c_nazokake: ['c9cb_riddle_charm', 'c9cb_riddle_boomerang'], c9c_hikkuri: ['c9cb_trio_goggles', 'c9cb_sand_dagger'] };

// くぼ地の 武具屋に 足す 品（A が 星の音の あとの 店に 足す。武器 2・防具 2）
export const C9C_SHOP_WEAPONS = ['c9cs_dagger', 'c9cs_boomerang'];
export const C9C_SHOP_ARMOR = ['c9cs_gi', 'c9cs_hat'];
export const C9C_SHOP_ADD = [...C9C_SHOP_WEAPONS, ...C9C_SHOP_ARMOR];

// 読みがな（あいうえお順の ならびかえ）
export const C9C_ITEM_KANA = {
  c9cs_dagger: 'ながれぼしのたんけん', c9cs_boomerang: 'ながれぼしのぶーめらん', c9cs_gi: 'ながれぼしのどうぎ', c9cs_hat: 'ながれぼしのぼうし',
  c9ct_river_whip: 'ちかのかわのむち', c9ct_scarab_gi: 'こがねすからべのどうぎ', c9ct_upside_helm: 'さかさおうのかぶと', c9ct_star_robe: 'さかさのほしのろーぶ',
  c9cb_riddle_charm: 'なぞのばんにんのくびかざり', c9cb_riddle_boomerang: 'なぞなぞぶーめらん', c9cb_trio_goggles: 'ほしどろいちみのごーぐる', c9cb_sand_dagger: 'すなどけいのたんけん',
  [NOTE_MI]: 'ほしのおとみ',
};
