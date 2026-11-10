// 第2部 第8章 第2幕「よみの 青い火」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch8.md の 6-2・plan-ch7.md の 4-4）:
//   C8B_TREASURE … よみの 海底神殿 1〜8階の 宝箱の 中み（{ 1: [★5の 装備, 素材か 道具], …, 8: [...] }）
//     第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材（しんじゅ・銀・星の砂 など）か 道具 1つ
//     素材・道具の 数は C8B_TREASURE_N（同じ ならび。装備は 1）。c8bChest(階, k) → { item, n }
//   C8B_LETTER_REWARDS … 時をこえる手紙の ごほうび（{ 1〜3: [[id, こすう], …] }。A が 手紙ごとに 1つずつ）
//   店: 千年前の 海（ナギの村）と 今の 店は 今の まま（第8章 第2幕は 新しい 町が ない）。手下の レアの ドロップは 第7章 第3幕の 雪の 村の 店の 品
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'c8b'「よみの海底神殿の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C8B_K: 1階 1.87 → 8階 1.94（第8章 第1幕の 月の王宮の 地下迷宮 8階 1.86 の 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   ペイニックと パニクル … 小おにのばけばけこんぼう（今までで いちばん 強い こんぼう）・ハデロス … よみの王の二またのやり（今までで いちばん 強い やり）
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」。第7章と おなじ）: レア度 4・かけ算 1.88 ＋ 素材
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・ハデロスの 炎（よみの大ふん火）と ドクロの けむり（闇）に そなえて、炎・闇に 少し 強い 品を 多めに

// 強さの めやす（items-c8a.js と おなじ。ランク 0〜10）
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
export const C8B_K = { 1: 1.87, 2: 1.88, 3: 1.89, 4: 1.90, 5: 1.91, 6: 1.92, 7: 1.93, 8: 1.94 };
export const C8B_LETTER_K = 1.88;
const K = C8B_K, LK = C8B_LETTER_K;

const TK = { src: 'c8b' };
const TREASURE = {
  // 1階（入口）
  c8bt_blue_pendant: { ...C(), ...TK, name: '青火のペンダント', bonus: { mag: 17, heal: 17, agi: 11, hp: 38 }, resist: { fire: 0.85, dark: 0.85 }, desc: '小さな青い火を、ガラスの中にとじこめたペンダント。だれでも装備でき、魔力と回復の力が上がる。' },
  // 2階
  c8bt_temple_helm: { ...H(true, 4, K[2]), ...TK, name: '海底神殿のかぶと', bonus: { hp: 34, str: 6 }, resist: { fire: 0.85, paralyze: 0.7 }, desc: '海の底の神殿を守っていた兵士のかぶと。炎に少し強く、しびれにくい。' },
  // 3階
  c8bt_pearl_fan: { ...W('fan', 4, K[3]), ...TK, name: '白しんじゅのおうぎ', bonus: { agi: 13, mag: 10 }, resist: { dark: 0.85 }, desc: '大きな白いしんじゅを、たくさんならべたおうぎ。闇に少し強い。' },
  // 4階（休み所）
  c8bt_soul_robe: { ...A('robe', 4, K[4]), ...TK, name: 'よみの青火のローブ', bonus: { mag: 23, heal: 14 }, resist: { fire: 0.8, dark: 0.85 }, desc: '青い火のもようが、ゆらゆらうかぶローブ。炎に強く、闇に少し強い。' },
  // 5階
  c8bt_flame_shield: { ...S(4, K[5]), ...TK, name: '青い炎のたて', bonus: { hp: 40 }, resist: { fire: 0.8, dark: 0.85 }, desc: 'ふちに、消えない青い炎がともったたて。炎に強く、闇に少し強い。' },
  // 6階
  c8bt_temple_mail: { ...A('heavy', 4, K[6]), ...TK, name: '海底神殿のよろい', bonus: { hp: 40, agi: -2 }, resist: { fire: 0.85, dark: 0.8 }, desc: '海の底の神殿の、番兵のよろい。闇に強く、炎に少し強い。' },
  // 7階（休み所）
  c8bt_lantern_staff: { ...W('staff', 4, K[7]), ...TK, name: 'たましいのランタンのつえ', bonus: { mag: 39, heal: 33 }, mpRegen: 1, resist: { dark: 0.8 }, desc: '先に、青いランタンをさげたつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c8bt_yomi_dagger: { ...W('dagger', 4, K[8]), ...TK, name: 'よみの青火の短剣', bonus: { agi: 16, str: 10 }, crit: 0.03, resist: { fire: 0.85 }, desc: '青い火のように、すき通った刀身の短剣。今までのどの短剣よりも強い。会心が出やすい。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // ペイニックと パニクル: 1人 1つの アクセサリー（drops.boss）と、小おにのばけばけこんぼう（drops.rare の 1回に 1回。今までで いちばん 強い こんぼう）
  c8i_imp_charm: {
    ...C(3), ...PB, boss: 'c8_painpanic', unique: true, name: '小おにのつのかざり', bonus: { hp: 110, str: 30, def: 28, mag: 28, agi: 30, heal: 22 }, resist: { fire: 0.8, paralyze: 0.6, confuse: 0.7 },
    desc: 'ペイニックとパニクルが、おとしていった小さなつののかざり。だれでも装備でき、すべての力が大きく上がる。しびれにくい。',
  },
  c8i_imp_club: {
    ...W('bat', 5, 1.92), ...PB, boss: 'c8_painpanic', name: '小おにのばけばけこんぼう', bonus: { str: 16, agi: 12 }, crit: 0.03, resist: { fire: 0.85 },
    desc: '小おにたちが、ばけるときにふり回していたこんぼう。今までのどのこんぼうよりも強い。会心が出やすい。',
  },
  // よみの王ハデロス: 1人 1つの アクセサリーと、よみの王の二またのやり（今までで いちばん 強い やり）
  c8h_flame_charm: {
    ...C(3), ...PB, boss: 'c8_hades', unique: true, name: 'よみの王の青い炎', bonus: { hp: 112, str: 31, def: 28, mag: 32, agi: 28, heal: 24 }, resist: { fire: 0.6, dark: 0.6 },
    desc: 'ハデロスのかみの毛からこぼれた、小さな青い炎。もう、あつくない。だれでも装備でき、すべての力が大きく上がる。炎と闇に強い。',
  },
  c8h_bident: {
    ...W('spear', 5, 1.94), ...PB, boss: 'c8_hades', name: 'よみの王の二またのやり', bonus: { str: 20, mag: 14 }, resist: { fire: 0.8, dark: 0.8 },
    desc: 'ハデロスの、先が2つにわかれたやり。今までのどのやりよりも強い。炎と闇に少し強い。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c8bl_coral_necklace: { ...C(4), ...LT, name: '赤さんごの首かざり', bonus: { hp: 48, str: 14, mag: 15, agi: 14, heal: 13 }, resist: { fire: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった赤いさんごの首かざり。だれでも装備でき、すべての力が上がる。' },
  c8bl_tide_gi: { ...A('gi', 4, LK), ...LT, name: 'しおさいの道着', bonus: { str: 15, agi: 15, hp: 36 }, resist: { bolt: 0.85, paralyze: 0.7 }, desc: '波の音のような、青いもようの道着。力と素早さが上がる。しびれにくい。' },
  c8bl_shell_crown: { ...H(false, 4, LK), ...LT, name: '大貝のかんむり', bonus: { hp: 42, mag: 10, heal: 8 }, resist: { fire: 0.85, dark: 0.8 }, desc: '千年前の海の、村長の家につたわるかんむり。闇に強く、炎に少し強い。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C8B = { ...TREASURE, ...BOSS, ...LETTER };

// よみの 海底神殿 1〜8階の 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。上の 階ほど 強く・めずらしく）
export const C8B_TREASURE = {
  1: ['c8bt_blue_pendant', 'star_sand'],
  2: ['c8bt_temple_helm', 'toku_herb'],
  3: ['c8bt_pearl_fan', 'pretty_shell'],
  4: ['c8bt_soul_robe', 'elf_drink'],
  5: ['c8bt_flame_shield', 'cs_black_pearl'],
  6: ['c8bt_temple_mail', 'magic_powder'],
  7: ['c8bt_lantern_staff', 'revive_flower'],
  8: ['c8bt_yomi_dagger', 'star_iron'],
};
// 宝箱の 中の 数（C8B_TREASURE と おなじ ならび。装備は 1つ）
export const C8B_TREASURE_N = { 1: [1, 3], 2: [1, 3], 3: [1, 4], 4: [1, 1], 5: [1, 3], 6: [1, 3], 7: [1, 2], 8: [1, 1] };
// 階 n の k ばんめの 宝箱 → { item, n }（A の マップ用。ない ときは null）
export function c8bChest(floor, k) {
  const item = C8B_TREASURE[floor]?.[k];
  return item ? { item, n: C8B_TREASURE_N[floor]?.[k] || 1 } : null;
}

// 時をこえる手紙の ごほうび（{ 手紙の 番号: [[id, こすう], …] }。A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C8B_LETTER_REWARDS = {
  1: [['c8bl_coral_necklace', 1], ['cs_black_pearl', 3]],
  2: [['c8bl_tide_gi', 1], ['magic_powder', 3]],
  3: [['c8bl_shell_crown', 1], ['star_shard', 3]],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C8B_DROPS = { c8_painpanic: ['c8i_imp_charm', 'c8i_imp_club'], c8_hades: ['c8h_flame_charm', 'c8h_bident'] };

// 読みがな（あいうえお順の ならびかえ）
export const C8B_ITEM_KANA = {
  c8bt_blue_pendant: 'あおびのぺんだんと', c8bt_temple_helm: 'かいていしんでんのかぶと', c8bt_pearl_fan: 'しろしんじゅのおうぎ', c8bt_soul_robe: 'よみのあおびのろーぶ',
  c8bt_flame_shield: 'あおいほのおのたて', c8bt_temple_mail: 'かいていしんでんのよろい', c8bt_lantern_staff: 'たましいのらんたんのつえ', c8bt_yomi_dagger: 'よみのあおびのたんけん',
  c8i_imp_charm: 'こおにのつのかざり', c8i_imp_club: 'こおにのばけばけこんぼう', c8h_flame_charm: 'よみのおうのあおいほのお', c8h_bident: 'よみのおうのふたまたのやり',
  c8bl_coral_necklace: 'あかさんごのくびかざり', c8bl_tide_gi: 'しおさいのどうぎ', c8bl_shell_crown: 'おおがいのかんむり',
};
