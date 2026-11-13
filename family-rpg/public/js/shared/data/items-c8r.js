// 第2部 第8章 第4幕「時のはざま」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch8.md の 9-2・plan-ch7.md の 4-4）:
//   C8R_TREASURE … 時のはざまの 宝箱の 中み（{ 'moon_1': [★5の 装備, 素材か 道具], …, 'last_3': [...] }。キーは マップ c8r_〜 の 名前から c8r_ を とった もの）
//     4つの つばさ（各 2階）と 最後の 回廊（3階）。第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材か 道具 1つ
//     素材・道具の 数は C8R_TREASURE_N（同じ ならび。装備は 1）。c8rChest(階, k) → { item, n }（階 … 'moon_1' か 'c8r_moon_1'。_now も よい）
//   店: 時のはざまには 店が ない（今の まま）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'c8r'「時のはざまの宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C8R_K: つばさ 2.03〜2.05 → 最後の 回廊 2.06〜2.08（第8章 第3幕の 空中ようさい 8階 2.02 の 上。大きく こえない）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   時の門番フリーゾン … 門番のしっぽのムチ（今までで いちばん 強い ムチ）・ソリトゥス … 千年の約束の紋章（第2部の さいごの お守り）と 星のなみだの剣
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・フリーゾンの 光（ゆびさきビーム・時の大玉）と ソリトゥスの 闇に そなえて、光・闇に 少し 強い 品を 多めに

// 強さの めやす（items-c8c.js と おなじ。ランク 0〜10）
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

// 宝箱の 階ごとの かけ算（つばさ → 最後の 回廊）
export const C8R_K = {
  moon_1: 2.03, moon_2: 2.04, fire_1: 2.03, fire_2: 2.04, iron_1: 2.04, iron_2: 2.05, ice_1: 2.04, ice_2: 2.05,
  last_1: 2.06, last_2: 2.07, last_3: 2.08,
};
const K = C8R_K;

const TK = { src: 'c8r' };
const TREASURE = {
  // 月のつばさ（鏡）
  c8rt_moon_pendant: { ...C(), ...TK, name: '月のつばさのペンダント', bonus: { mag: 19, heal: 19, agi: 12, hp: 42 }, resist: { light: 0.85, dark: 0.85 }, desc: '月の鏡のかけらがうかぶペンダント。だれでも装備でき、魔力と回復の力が上がる。' },
  c8rt_moon_helm: { ...H(true, 4, K.moon_2), ...TK, name: '月かげのかぶと', bonus: { hp: 38, str: 7 }, resist: { light: 0.85, dark: 0.85 }, desc: '鏡のように光る、銀色のかぶと。光と闇に少し強い。' },
  // 青火のつばさ（見えない 道）
  c8rt_fire_boomerang: { ...W('boomerang', 4, 1.98), ...TK, name: '青火のブーメラン', bonus: { agi: 15, str: 10 }, resist: { fire: 0.85 }, desc: '青い火のようにゆらめくブーメラン。投げると、見えない道もてらす。炎に少し強い。' },
  c8rt_fire_gi: { ...A('gi', 4, K.fire_2), ...TK, name: '青火の道着', bonus: { str: 17, agi: 16, hp: 40 }, resist: { fire: 0.85, dark: 0.85 }, desc: '青い火のもようの道着。力と素早さが上がる。炎と闇に少し強い。' },
  // くろがねのつばさ（しかけと 残がい）
  c8rt_iron_shield: { ...S(4, K.iron_1), ...TK, name: '星のくろがねのたて', bonus: { hp: 44 }, resist: { light: 0.8, fire: 0.85 }, desc: 'くろがねに、星のもようをきざんだたて。光に強く、炎に少し強い。' },
  c8rt_star_robe: { ...A('robe', 4, K.iron_2), ...TK, name: '星読みの時のローブ', bonus: { mag: 25, heal: 16 }, resist: { light: 0.85, dark: 0.8 }, desc: '星の地図がぬいこまれたローブ。闇に強く、光に少し強い。' },
  // 氷のつばさ（すべる 氷）
  c8rt_ice_spear: { ...W('spear', 4, K.ice_1), ...TK, name: '氷のつばさのやり', bonus: { str: 18, agi: 10 }, resist: { ice: 0.85 }, desc: 'とけない氷でできた、すきとおったやり。氷に少し強い。' },
  c8rt_ice_mail: { ...A('heavy', 4, K.ice_2), ...TK, name: '氷のつばさのよろい', bonus: { hp: 44, agi: -2 }, resist: { ice: 0.85, light: 0.85 }, desc: '氷のつばさの、白くかがやくよろい。氷と光に少し強い。' },
  // 最後の 回廊
  c8rt_last_hat: { ...H(false, 4, K.last_1), ...TK, name: '時のろうかのぼうし', bonus: { hp: 46, mag: 12, heal: 10 }, resist: { dark: 0.8, light: 0.85 }, desc: '小さな時計のついた、とんがりぼうし。闇に強く、光に少し強い。' },
  c8rt_sand_staff: { ...W('staff', 4, 2.0), ...TK, name: '時のすなのつえ', bonus: { mag: 41, heal: 35 }, mpRegen: 1, resist: { dark: 0.85 }, desc: '先に、小さなすなどけいがついたつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  c8rt_last_sword: { ...W('sword', 4, 2.0), ...TK, name: '時のろうかの剣', bonus: { str: 20, agi: 10 }, resist: { dark: 0.85 }, desc: '千年前と今の、2つの時代の光をあわせた剣。闇に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 時の門番フリーゾン: 1人 1つの アクセサリー（drops.boss）と、門番のしっぽのムチ（drops.rare の 1回に 1回。今までで いちばん 強い ムチ）
  c8g_gate_charm: {
    ...C(3), ...PB, boss: 'c8_gatekeeper', unique: true, name: '時の門番のゆびわ', bonus: { hp: 120, str: 34, def: 31, mag: 34, agi: 30, heal: 25 }, resist: { light: 0.7, dark: 0.85 },
    desc: 'フリーゾンが落としていった、時の門のかぎのゆびわ。だれでも装備でき、すべての力が大きく上がる。光に強い。',
  },
  c8g_gate_whip: {
    ...W('whip', 5, 1.93), ...PB, boss: 'c8_gatekeeper', name: '門番のしっぽのムチ', bonus: { str: 18, agi: 16 }, crit: 0.03, resist: { light: 0.85 },
    desc: 'フリーゾンの、長いしっぽのようなムチ。今までのどのムチよりも強い。会心が出やすい。',
  },
  // ソリトゥス: 1人 1つの アクセサリー（第2部の さいごの お守り）と、星のなみだの剣（今までで いちばん 強い 剣）
  c8s_promise_crest: {
    ...C(3), ...PB, boss: 'c8_solitus', unique: true, name: '千年の約束の紋章', bonus: { hp: 126, str: 35, def: 32, mag: 35, agi: 31, heal: 27 }, resist: { dark: 0.7, light: 0.85 },
    desc: '千年前と今の、みんなの紋章がかさなった、小さなかざり。だれでも装備でき、すべての力が大きく上がる。闇に強い。',
  },
  c8s_star_sword: {
    ...W('sword', 5, 1.98), ...PB, boss: 'c8_solitus', name: '星のなみだの剣', bonus: { str: 22, agi: 12 }, crit: 0.03, resist: { dark: 0.8 },
    desc: 'ひとりぼっちの星が、さいごにこぼしたなみだでできた剣。今までのどの剣よりも強い。闇に強い。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C8R = { ...TREASURE, ...BOSS };

// 時のはざまの 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。回廊の 奥ほど 強く・めずらしく）
export const C8R_TREASURE = {
  moon_1: ['c8rt_moon_pendant', 'star_sand'],
  moon_2: ['c8rt_moon_helm', 'toku_herb'],
  fire_1: ['c8rt_fire_boomerang', 'magic_powder'],
  fire_2: ['c8rt_fire_gi', 'elf_drink'],
  iron_1: ['c8rt_iron_shield', 'iron_shard'],
  iron_2: ['c8rt_star_robe', 'star_shard'],
  ice_1: ['c8rt_ice_spear', 'silver_shard'],
  ice_2: ['c8rt_ice_mail', 'revive_flower'],
  last_1: ['c8rt_last_hat', 'star_sand'],
  last_2: ['c8rt_sand_staff', 'elf_drink'],
  last_3: ['c8rt_last_sword', 'star_iron'],
};
// 宝箱の 中の 数（C8R_TREASURE と おなじ ならび。装備は 1つ）
export const C8R_TREASURE_N = {
  moon_1: [1, 3], moon_2: [1, 3], fire_1: [1, 3], fire_2: [1, 1], iron_1: [1, 4], iron_2: [1, 3], ice_1: [1, 3], ice_2: [1, 2],
  last_1: [1, 4], last_2: [1, 2], last_3: [1, 1],
};
// 階 → { item, n }（A の マップ用。'c8r_moon_1'・'c8r_moon_1_now'・'moon_1' の どれでも よい。ない ときは null）
export function c8rChest(floor, k) {
  const key = String(floor).replace(/^c8r_/, '').replace(/_now$/, '');
  const item = C8R_TREASURE[key]?.[k];
  return item ? { item, n: C8R_TREASURE_N[key]?.[k] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C8R_DROPS = { c8_gatekeeper: ['c8g_gate_charm', 'c8g_gate_whip'], c8_solitus: ['c8s_promise_crest', 'c8s_star_sword'] };

// 読みがな（あいうえお順の ならびかえ）
export const C8R_ITEM_KANA = {
  c8rt_moon_pendant: 'つきのつばさのぺんだんと', c8rt_moon_helm: 'つきかげのかぶと', c8rt_fire_boomerang: 'あおびのぶーめらん', c8rt_fire_gi: 'あおびのどうぎ',
  c8rt_iron_shield: 'ほしのくろがねのたて', c8rt_star_robe: 'ほしよみのときのろーぶ', c8rt_ice_spear: 'こおりのつばさのやり', c8rt_ice_mail: 'こおりのつばさのよろい',
  c8rt_last_hat: 'ときのろうかのぼうし', c8rt_sand_staff: 'ときのすなのつえ', c8rt_last_sword: 'ときのろうかのけん',
  c8g_gate_charm: 'ときのもんばんのゆびわ', c8g_gate_whip: 'もんばんのしっぽのむち', c8s_promise_crest: 'せんねんのやくそくのもんしょう', c8s_star_sword: 'ほしのなみだのけん',
};
