// 第3部 第1章 第4幕「星のはかば」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-part3-c9d.md の 12-4・plan-ch7.md の 4-4）:
//   C9D_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く。c9d_c1〜c9d_c8）
//     ★5 の 装備は 4つ（c2・c4・c6・c8。k 2.22〜2.26）。ほかは 素材か 道具
//   c9dChest(id) → { item, n }（ない ときは null）
//
// ・宝箱（src: 'c9d'「星のはかばへの道の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため。ぼうし・たて・道着・よろい）
// ・ボスの 品（src: 'pastboss'）: あそびたい魔人 ムウが かならず 1人 1つの アクセサリー（レア度 3。第1章の おわりの お守り）
//   お守り（アクセ）の よい 力の 合計は 287 まで（第1幕〜第3幕と おなじ。伝説の アクセが「いちばんの 8わり」を 下回らない … test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c9dt_（宝箱）・c9db_（ボス）… 魔物の id（c9d_）と かさならない ように

// 強さの めやす（items-c9c.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
// rarity … レア度（宝箱 4）。k … 強さの かけ算
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（ふたごの道 1階 → 2階の おく）
export const C9D_K = { c2: 2.22, c4: 2.23, c6: 2.24, c8: 2.26 };
const K = C9D_K;

const TK = { src: 'c9d' };
const TREASURE = {
  // ふたごの道 1階
  c9dt_echo_hat: { ...H(false, 4, K.c2), ...TK, name: 'こだまのぼうし', bonus: { hp: 50, mag: 16, heal: 14 }, resist: { wind: 0.8 }, desc: '耳のところが、ラッパのようにひらいたぼうし。小さな声も、よく聞こえる。風に強い。' },
  c9dt_twin_shield: { ...S(4, K.c4), ...TK, name: 'ふたご星のたて', bonus: { hp: 52 }, resist: { light: 0.85, dark: 0.85 }, desc: 'ならんだ2つの星がかがやく、まるいたて。光と闇に少し強い。' },
  // ふたごの道 2階
  c9dt_valley_gi: { ...A('gi', 4, K.c6), ...TK, name: '谷風の道着', bonus: { agi: 16, str: 12 }, resist: { wind: 0.85 }, desc: '深い谷をふきぬける風のように、かるい道着。素早さと力が上がる。風に少し強い。' },
  c9dt_sleep_mail: { ...A('heavy', 4, K.c8), ...TK, name: 'ねむり星のよろい', bonus: { hp: 56, agi: -2 }, resist: { dark: 0.8, confuse: 0.8 }, desc: '灰色の石のように、しずかに光るよろい。闇に強く、混乱しにくい。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // あそびたい魔人 ムウ: 1人 1つの アクセサリー（第1章の おわりの お守り）
  c9db_star_brooch: {
    ...C(3), ...PB, boss: 'c9d_mu', unique: true, name: 'ねむり星のブローチ', bonus: { hp: 130, str: 33, def: 33, mag: 33, agi: 30, heal: 28 }, resist: { sleep: 0.5, dark: 0.85 },
    desc: 'ムウとムウムウが、おそろいでつけていた、星の形のブローチ。だれでも装備でき、すべての力が大きく上がる。ねむりにくい。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C9D = { ...TREASURE, ...BOSS };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C9D_TREASURE = {
  c9d_c1: ['toku_herb', 3],
  c9d_c2: ['c9dt_echo_hat', 1],
  c9d_c3: ['silver_shard', 3],
  c9d_c4: ['c9dt_twin_shield', 1],
  c9d_c5: ['elf_drink', 2],
  c9d_c6: ['c9dt_valley_gi', 1],
  c9d_c7: ['revive_flower', 2],
  c9d_c8: ['c9dt_sleep_mail', 1],
};
export const C9D_CHEST_LIST = Object.keys(C9D_TREASURE);
// ★5 の 装備が 入って いる 宝箱（4つ）
export const C9D_GEAR_CHESTS = ['c9d_c2', 'c9d_c4', 'c9d_c6', 'c9d_c8'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c9dChest(id) {
  const e = C9D_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C9D_DROPS = { c9d_mu: ['c9db_star_brooch'] };

// 読みがな（あいうえお順の ならびかえ）
export const C9D_ITEM_KANA = {
  c9dt_echo_hat: 'こだまのぼうし', c9dt_twin_shield: 'ふたごぼしのたて', c9dt_valley_gi: 'たにかぜのどうぎ', c9dt_sleep_mail: 'ねむりぼしのよろい',
  c9db_star_brooch: 'ねむりぼしのぶろーち',
};
