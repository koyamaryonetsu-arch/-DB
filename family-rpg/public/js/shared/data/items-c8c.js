// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch8.md の 8-2・plan-ch7.md の 4-4）:
//   C8C_TREASURE … くろがねの 空中ようさい 1〜8階の 宝箱の 中み（{ 1: [★5の 装備, 素材か 道具], …, 8: [...] }）
//     第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材（鉄・銀・星の砂 など）か 道具 1つ
//     素材・道具の 数は C8C_TREASURE_N（同じ ならび。装備は 1）。c8cChest(階, k) → { item, n }
//   C8C_LETTER_REWARDS … 時をこえる手紙の ごほうび（{ 1〜3: [[id, こすう], …] }。A が 手紙ごとに 1つずつ）
//   店: 千年前の ミドリナ（泉の里・ホシフルの里）と 今の 店は 今の まま。手下の レアの ドロップは 第7章 第3幕の 雪の 村の 店の 品
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'c8c'「くろがねの空中ようさいの宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C8C_K: 1階 1.95 → 8階 2.02（第8章 第2幕の よみの 海底神殿 8階 1.94 の 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   マジカメック … マジカメックの魔法のつえ（今までで いちばん 強い つえ）・クッパード … 大魔王のツメ（今までで いちばん 強い ツメ）
//   宝箱の 8階 … くろがねの大オノ（今までで いちばん 強い オノ）
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」。第7章と おなじ）: レア度 4・かけ算 1.96 ＋ 素材
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・クッパードの 炎（大魔王のほのお・ギガほのお）と マジカメックの 雷（ふしぎな形の魔法）に そなえて、炎・雷に 少し 強い 品を 多めに

// 強さの めやす（items-c8b.js と おなじ。ランク 0〜10）
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
export const C8C_K = { 1: 1.95, 2: 1.96, 3: 1.97, 4: 1.98, 5: 1.99, 6: 2.0, 7: 2.01, 8: 2.02 };
export const C8C_LETTER_K = 1.96;
const K = C8C_K, LK = C8C_LETTER_K;

const TK = { src: 'c8c' };
const TREASURE = {
  // 1階（入口）
  c8ct_gear_pendant: { ...C(), ...TK, name: '金の歯車のペンダント', bonus: { mag: 18, heal: 18, agi: 12, hp: 40 }, resist: { bolt: 0.85, fire: 0.85 }, desc: '小さな金の歯車が、カチコチ回るペンダント。だれでも装備でき、魔力と回復の力が上がる。' },
  // 2階
  c8ct_iron_helm: { ...H(true, 4, K[2]), ...TK, name: 'くろがねのかぶと', bonus: { hp: 36, str: 7 }, resist: { fire: 0.85, bolt: 0.85 }, desc: '空中ようさいの兵士の、黒い鉄のかぶと。炎と雷に少し強い。' },
  // 3階
  c8ct_propeller_fan: { ...W('fan', 4, 1.9), ...TK, name: 'プロペラのおうぎ', bonus: { agi: 14, mag: 10 }, resist: { wind: 0.85 }, desc: 'ようさいのプロペラの羽で作ったおうぎ。あおぐと、くるくる回る。風に少し強い。' },
  // 4階（休み所）
  c8ct_sky_robe: { ...A('robe', 4, K[4]), ...TK, name: '空中ようさいのローブ', bonus: { mag: 24, heal: 15 }, resist: { bolt: 0.8, fire: 0.85 }, desc: 'ようさいの魔法使いたちのローブ。雷に強く、炎に少し強い。' },
  // 5階
  c8ct_iron_shield: { ...S(4, K[5]), ...TK, name: 'くろがねのたて', bonus: { hp: 42 }, resist: { fire: 0.8, bolt: 0.85 }, desc: 'ようさいの大ほうのふたで作った、黒い鉄のたて。炎に強く、雷に少し強い。' },
  // 6階
  c8ct_iron_mail: { ...A('heavy', 4, K[6]), ...TK, name: 'くろがねのよろい', bonus: { hp: 42, agi: -2 }, resist: { fire: 0.8, bolt: 0.85 }, desc: '空中ようさいの番兵の、黒い鉄のよろい。炎に強く、雷に少し強い。' },
  // 7階（休み所）
  c8ct_star_staff: { ...W('staff', 4, 1.95), ...TK, name: '星読みの空のつえ', bonus: { mag: 40, heal: 34 }, mpRegen: 1, resist: { bolt: 0.85 }, desc: '先に、小さな星の石がかがやくつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c8ct_iron_axe: { ...W('axe', 4, K[8]), ...TK, name: 'くろがねの大オノ', bonus: { str: 18, hp: 30 }, crit: 0.03, resist: { fire: 0.85 }, desc: '空中ようさいの大橋をささえていたのと同じ、大きな黒い鉄のオノ。今までのどのオノよりも強い。会心が出やすい。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // マジカメック: 1人 1つの アクセサリー（drops.boss）と、マジカメックの魔法のつえ（drops.rare の 1回に 1回。今までで いちばん 強い つえ）
  c8k_magic_charm: {
    ...C(3), ...PB, boss: 'c8_kamek', unique: true, name: '魔法使いのめがね', bonus: { hp: 114, str: 30, def: 30, mag: 34, agi: 30, heal: 24 }, resist: { bolt: 0.7, confuse: 0.6 },
    desc: 'マジカメックが落としていった、まるいめがね。だれでも装備でき、すべての力が大きく上がる。雷に強く、こんらんしにくい。',
  },
  c8k_magic_staff: {
    ...W('staff', 5, 1.98), ...PB, boss: 'c8_kamek', name: 'マジカメックの魔法のつえ', bonus: { mag: 46, heal: 32 }, mpRegen: 1, resist: { bolt: 0.8 },
    desc: 'マジカメックの、先に赤い玉のついたつえ。今までのどのつえよりも強い。行動するたびにMPが1もどる。',
  },
  // 初代大魔王クッパード: 1人 1つの アクセサリーと、大魔王のツメ（今までで いちばん 強い ツメ）
  c8w_king_charm: {
    ...C(3), ...PB, boss: 'c8_bowser', unique: true, name: '大魔王のトゲのうでわ', bonus: { hp: 118, str: 34, def: 30, mag: 30, agi: 28, heal: 24 }, resist: { fire: 0.6, blast: 0.8 },
    desc: 'クッパードのうでにはまっていた、トゲトゲのうでわ。だれでも装備でき、すべての力が大きく上がる。炎に強い。',
  },
  c8w_king_claw: {
    ...W('claw', 5, 2.0), ...PB, boss: 'c8_bowser', name: '大魔王のツメ', bonus: { str: 22, agi: 14 }, crit: 0.04, resist: { fire: 0.8 },
    desc: 'クッパードの、大きくするどいツメ。今までのどのツメよりも強い。会心が出やすい。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c8cl_spring_necklace: { ...C(4), ...LT, name: '泉のしずくの首かざり', bonus: { hp: 50, str: 15, mag: 16, agi: 15, heal: 14 }, resist: { fire: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった首かざり。泉の水の色をしている。だれでも装備でき、すべての力が上がる。' },
  c8cl_wind_gi: { ...A('gi', 4, LK), ...LT, name: '里の風の道着', bonus: { str: 16, agi: 16, hp: 38 }, resist: { bolt: 0.85, paralyze: 0.7 }, desc: 'ミドリナの里の、風のもようの道着。力と素早さが上がる。しびれにくい。' },
  c8cl_star_hat: { ...H(false, 4, LK), ...LT, name: '星見のとんがりぼうし', bonus: { hp: 44, mag: 11, heal: 9 }, resist: { bolt: 0.8, fire: 0.85 }, desc: '千年前の星読みの家に、つたわっていたぼうし。雷に強く、炎に少し強い。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C8C = { ...TREASURE, ...BOSS, ...LETTER };

// くろがねの 空中ようさい 1〜8階の 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。上の 階ほど 強く・めずらしく）
export const C8C_TREASURE = {
  1: ['c8ct_gear_pendant', 'star_sand'],
  2: ['c8ct_iron_helm', 'toku_herb'],
  3: ['c8ct_propeller_fan', 'iron_shard'],
  4: ['c8ct_sky_robe', 'elf_drink'],
  5: ['c8ct_iron_shield', 'silver_shard'],
  6: ['c8ct_iron_mail', 'magic_powder'],
  7: ['c8ct_star_staff', 'revive_flower'],
  8: ['c8ct_iron_axe', 'star_iron'],
};
// 宝箱の 中の 数（C8C_TREASURE と おなじ ならび。装備は 1つ）
export const C8C_TREASURE_N = { 1: [1, 3], 2: [1, 3], 3: [1, 4], 4: [1, 1], 5: [1, 3], 6: [1, 3], 7: [1, 2], 8: [1, 1] };
// 階 n の k ばんめの 宝箱 → { item, n }（A の マップ用。ない ときは null）
export function c8cChest(floor, k) {
  const item = C8C_TREASURE[floor]?.[k];
  return item ? { item, n: C8C_TREASURE_N[floor]?.[k] || 1 } : null;
}

// 時をこえる手紙の ごほうび（{ 手紙の 番号: [[id, こすう], …] }。A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C8C_LETTER_REWARDS = {
  1: [['c8cl_spring_necklace', 1], ['star_sand', 3]],
  2: [['c8cl_wind_gi', 1], ['magic_powder', 3]],
  3: [['c8cl_star_hat', 1], ['star_shard', 3]],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C8C_DROPS = { c8_kamek: ['c8k_magic_charm', 'c8k_magic_staff'], c8_bowser: ['c8w_king_charm', 'c8w_king_claw'] };

// 読みがな（あいうえお順の ならびかえ）
export const C8C_ITEM_KANA = {
  c8ct_gear_pendant: 'きんのはぐるまのぺんだんと', c8ct_iron_helm: 'くろがねのかぶと', c8ct_propeller_fan: 'ぷろぺらのおうぎ', c8ct_sky_robe: 'くうちゅうようさいのろーぶ',
  c8ct_iron_shield: 'くろがねのたて', c8ct_iron_mail: 'くろがねのよろい', c8ct_star_staff: 'ほしよみのそらのつえ', c8ct_iron_axe: 'くろがねのおおおの',
  c8k_magic_charm: 'まほうつかいのめがね', c8k_magic_staff: 'まじかめっくのまほうのつえ', c8w_king_charm: 'だいまおうのとげのうでわ', c8w_king_claw: 'だいまおうのつめ',
  c8cl_spring_necklace: 'いずみのしずくのくびかざり', c8cl_wind_gi: 'さとのかぜのどうぎ', c8cl_star_hat: 'ほしみのとんがりぼうし',
};
