// 第2部 第8章 第1幕「月の王宮の うらぎり」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch8.md の 5-2・plan-ch7.md の 4-4）:
//   C8A_TREASURE … 月の王宮の 地下迷宮 1〜8階の 宝箱の 中み（{ 1: [★5の 装備, 素材か 道具], …, 8: [...] }）
//     第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材（鉄・銀・星の砂 など）か 道具 1つ
//     素材・道具の 数は C8A_TREASURE_N（同じ ならび。装備は 1）。c8aChest(階, k) → { item, n }
//   C8A_LETTER_REWARDS … 時をこえる手紙の ごほうび（{ 1〜3: [[id, こすう], …] }。A が 手紙ごとに 1つずつ）
//   店: 千年前の 王国（緑の王国）と 今の サファラの 店は 今の まま（第8章 第1幕は 新しい 町が ない）。手下の レアの ドロップは 第7章 第3幕の 雪の 村の 店の 品
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'c8a'「月の王宮の地下迷宮の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C8A_K: 1階 1.79 → 8階 1.86（第7章 第3幕の 氷の竜の城 8階 1.78 の 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   イアゴン … オウムの羽のおうぎ（今までで いちばん 強い おうぎ）・ジャハール … 大臣のへびのつえ（今までで いちばん 強い つえ）
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」。第7章と おなじ）: レア度 4・かけ算 1.80 ＋ 素材
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・ジャハールの さいみんじゅつ（こんらん）に そなえて、こんらんしにくい 品を 少し

// 強さの めやす（items-c7i.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
// rarity … レア度（宝箱 4・ボスの 武器 5）。k … 強さの かけ算
const W = (cat, rarity, k) => ({ type: 'weapon', cat, rank: R, rarity, atk: Math.round(SWORD[R] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の 階ごとの かけ算・手紙の ごほうびの かけ算
export const C8A_K = { 1: 1.79, 2: 1.80, 3: 1.81, 4: 1.82, 5: 1.83, 6: 1.84, 7: 1.85, 8: 1.86 };
export const C8A_LETTER_K = 1.80;
const K = C8A_K, LK = C8A_LETTER_K;

const TK = { src: 'c8a' };
const TREASURE = {
  // 1階（入口）
  c8at_crescent_ring: { ...C(), ...TK, name: '三日月の指輪', bonus: { mag: 16, heal: 16, agi: 11, hp: 36 }, resist: { confuse: 0.6, dark: 0.85 }, desc: '細い三日月の形をした、銀の指輪。だれでも装備でき、魔力と回復の力が上がる。こんらんしにくい。' },
  // 2階
  c8at_palace_turban: { ...H(false, 4, K[2]), ...TK, name: '王宮のターバン', bonus: { agi: 11, hp: 32 }, resist: { confuse: 0.7, fire: 0.85 }, desc: '王宮の人がまく、白と金のターバン。炎に少し強く、こんらんしにくい。' },
  // 3階
  c8at_moon_whip: { ...W('whip', 4, K[3]), ...TK, name: '月光のムチ', bonus: { agi: 12, str: 9 }, onHit: { status: 'blind', chance: 0.12 }, desc: '月の光をよりあわせたような、銀色のムチ。ときどき相手の目をくらませる。' },
  // 4階（休み所）
  c8at_night_robe: { ...A('robe', 4, K[4]), ...TK, name: '星空のローブ', bonus: { mag: 22, heal: 13 }, resist: { dark: 0.8, confuse: 0.7 }, desc: '夜空の星を、ししゅうしたローブ。闇に強く、こんらんしにくい。' },
  // 5階
  c8at_gold_mail: { ...A('heavy', 4, K[5]), ...TK, name: '王宮の金のよろい', bonus: { hp: 38, agi: -2 }, resist: { fire: 0.85, dark: 0.85 }, desc: '王宮の近衛兵がつけていた、金色のよろい。炎と闇に少し強い。' },
  // 6階
  c8at_crescent_shield: { ...S(4, K[6]), ...TK, name: '月夜の王宮のたて', bonus: { hp: 38 }, resist: { dark: 0.8, wind: 0.85 }, desc: '三日月のもようがえがかれた、大きなたて。闇に強く、風に少し強い。' },
  // 7階（休み所）
  c8at_moon_staff: { ...W('staff', 4, K[7]), ...TK, name: '月のしずくのつえ', bonus: { mag: 38, heal: 32 }, mpRegen: 1, resist: { dark: 0.8 }, desc: '先に、月のしずくをとじこめたつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c8at_palace_sword: { ...W('sword', 4, K[8]), ...TK, name: '月の王宮の剣', bonus: { str: 19, agi: 10 }, resist: { dark: 0.8, confuse: 0.8 }, desc: '月の王宮のおくで、千年ねむっていた王家の剣。氷の竜の剣より、少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // オウムのイアゴン: 1人 1つの アクセサリー（drops.boss）と、オウムの羽のおうぎ（drops.rare の 1回に 1回。今までで いちばん 強い おうぎ）
  c8p_feather_charm: {
    ...C(3), ...PB, boss: 'c8_vizier_pet', unique: true, name: 'オウムの羽かざり', bonus: { hp: 106, str: 28, def: 26, mag: 28, agi: 28, heal: 20 }, resist: { wind: 0.7, confuse: 0.6, bolt: 0.85 },
    desc: 'イアゴンが落とした、赤と黄色の大きな羽のかざり。だれでも装備でき、すべての力が大きく上がる。こんらんしにくい。',
  },
  c8p_parrot_fan: {
    ...W('fan', 5, 1.88), ...PB, boss: 'c8_vizier_pet', name: 'オウムの羽のおうぎ', bonus: { agi: 18, mag: 14 }, crit: 0.03, resist: { wind: 0.8 },
    desc: 'イアゴンのあざやかな羽を集めたおうぎ。今までのどのおうぎよりも強い。会心が出やすい。',
  },
  // 大臣ジャハール: 1人 1つの アクセサリーと、大臣のへびのつえ（今までで いちばん 強い つえ）
  c8j_ruby_charm: {
    ...C(3), ...PB, boss: 'c8_jafar', unique: true, name: '月のルビーのお守り', bonus: { hp: 108, str: 30, def: 26, mag: 30, agi: 26, heal: 22 }, resist: { dark: 0.6, confuse: 0.5, fire: 0.85 },
    desc: 'へびのつえの目にはまっていた、ルビーのかけら。だれでも装備でき、すべての力が大きく上がる。闇に強く、こんらんしにくい。',
  },
  c8j_snake_staff: {
    ...W('staff', 5, 1.9), ...PB, boss: 'c8_jafar', name: '大臣のへびのつえ', bonus: { mag: 44, heal: 30 }, mpRegen: 1, resist: { dark: 0.8, confuse: 0.7 },
    desc: 'ジャハールのへびのつえ。今は、人をあやつる力はない。今までのどのつえよりも強い。行動するたびにMPが1もどる。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c8al_oasis_necklace: { ...C(4), ...LT, name: 'オアシスの首かざり', bonus: { hp: 46, str: 14, mag: 14, agi: 14, heal: 12 }, resist: { fire: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった首かざり。だれでも装備でき、すべての力が上がる。' },
  c8al_carpet_gi: { ...A('gi', 4, LK), ...LT, name: '魔法のじゅうたんの道着', bonus: { str: 14, agi: 15, hp: 34 }, resist: { wind: 0.8, confuse: 0.7 }, desc: '空とぶじゅうたんと同じ、もようの道着。力と素早さが上がる。こんらんしにくい。' },
  c8al_sultan_crown: { ...H(true, 4, LK), ...LT, name: '王さまのかんむり', bonus: { hp: 44, def: 6, mag: 6 }, resist: { dark: 0.8, confuse: 0.6 }, desc: '千年前の王さまが、むすこのためにうめたかんむり。闇に強く、こんらんしにくい。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C8A = { ...TREASURE, ...BOSS, ...LETTER };

// 月の王宮の 地下迷宮 1〜8階の 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。上の 階ほど 強く・めずらしく）
export const C8A_TREASURE = {
  1: ['c8at_crescent_ring', 'star_sand'],
  2: ['c8at_palace_turban', 'toku_herb'],
  3: ['c8at_moon_whip', 'moon_drop'],
  4: ['c8at_night_robe', 'elf_drink'],
  5: ['c8at_gold_mail', 'silver_shard'],
  6: ['c8at_crescent_shield', 'magic_powder'],
  7: ['c8at_moon_staff', 'revive_flower'],
  8: ['c8at_palace_sword', 'star_iron'],
};
// 宝箱の 中の 数（C8A_TREASURE と おなじ ならび。装備は 1つ）
export const C8A_TREASURE_N = { 1: [1, 3], 2: [1, 3], 3: [1, 2], 4: [1, 1], 5: [1, 3], 6: [1, 3], 7: [1, 2], 8: [1, 1] };
// 階 n の k ばんめの 宝箱 → { item, n }（A の マップ用。ない ときは null）
export function c8aChest(floor, k) {
  const item = C8A_TREASURE[floor]?.[k];
  return item ? { item, n: C8A_TREASURE_N[floor]?.[k] || 1 } : null;
}

// 時をこえる手紙の ごほうび（{ 手紙の 番号: [[id, こすう], …] }。A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C8A_LETTER_REWARDS = {
  1: [['c8al_oasis_necklace', 1], ['star_sand', 3]],
  2: [['c8al_carpet_gi', 1], ['magic_powder', 3]],
  3: [['c8al_sultan_crown', 1], ['star_shard', 3]],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C8A_DROPS = { c8_vizier_pet: ['c8p_feather_charm', 'c8p_parrot_fan'], c8_jafar: ['c8j_ruby_charm', 'c8j_snake_staff'] };

// 読みがな（あいうえお順の ならびかえ）
export const C8A_ITEM_KANA = {
  c8at_crescent_ring: 'みかづきのゆびわ', c8at_palace_turban: 'おうきゅうのたーばん', c8at_moon_whip: 'げっこうのむち', c8at_night_robe: 'ほしぞらのろーぶ',
  c8at_gold_mail: 'おうきゅうのきんのよろい', c8at_crescent_shield: 'つきよのおうきゅうのたて', c8at_moon_staff: 'つきのしずくのつえ', c8at_palace_sword: 'つきのおうきゅうのけん',
  c8p_feather_charm: 'おうむのはねかざり', c8p_parrot_fan: 'おうむのはねのおうぎ', c8j_ruby_charm: 'つきのるびーのおまもり', c8j_snake_staff: 'だいじんのへびのつえ',
  c8al_oasis_necklace: 'おあしすのくびかざり', c8al_carpet_gi: 'まほうのじゅうたんのどうぎ', c8al_sultan_crown: 'おうさまのかんむり',
};
