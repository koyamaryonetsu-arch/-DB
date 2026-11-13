// 第2部 第7章 第2幕「海の紋章」の 品（B: 品。items.js で まぜる。A が 店・宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch7.md の 4-3・4-4）:
//   C7S_TREASURE … しずむ前の島の灯台 1〜8階の 宝箱の 中み（{ 1: [★5の 装備, 素材か 道具], …, 8: [...] }）
//     第64回 ⑥d（装備が 手に入りすぎない）: 階ごとに ★5 装備 1つ・素材（鉄・銀・星のかけら など）か 道具 1つ
//     素材・道具の 数は C7S_TREASURE_N（同じ ならび。装備は 1）。c7sChest(階, k) → { item, n }
//   C7S_LETTER_REWARDS … 時をこえる手紙の ごほうび（{ 1〜4: [[id, こすう], …] }。A が 手紙ごとに 1つずつ。1つは 灯台の なぞときの 手紙）
//   C7S_SHOP_WEAPONS・C7S_SHOP_ARMOR・C7S_SHOP_TOOLS … カイの 島の 店の ならび（ランク10・★1）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・店（ランク10・★1・レア度 0）: 緑の王国の 店（items-c7.js。かけ算 1.06）より 少し 強い（かけ算 1.10）
// ・宝箱（src: 'c7s'「しずむ前の島の灯台の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C7S_K: 1階 1.63 → 8階 1.70（第1幕の 神殿 8階 1.62 の 少し 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」。第1幕と おなじ）: レア度 4・かけ算 1.64 ＋ 素材
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
import { C7_SHOP_TOOLS } from './items-c7.js?v=b671a0f110f0';

// 強さの めやす（items-c7.js と おなじ。ランク 0〜10）
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
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 店の かけ算・宝箱の 階ごとの かけ算・手紙の ごほうびの かけ算
export const C7S_SHOP_K = 1.1;
export const C7S_K = { 1: 1.63, 2: 1.64, 3: 1.65, 4: 1.66, 5: 1.67, 6: 1.68, 7: 1.69, 8: 1.7 };
export const C7S_LETTER_K = 1.64;
const SK = C7S_SHOP_K, K = C7S_K, LK = C7S_LETTER_K;

// ───── カイの 島の 店（ランク10・★1）─────
const SHOP = {
  c7s_island_sword: { ...W('sword', 0, SK), name: '波の剣', price: 15400, desc: '波のもようがきざまれた剣。島の戦士たちが使う。' },
  c7s_island_spear: { ...W('spear', 0, SK), name: '海の男のやり', price: 14600, desc: '大きな魚をとる、長いやり。' },
  c7s_island_axe: { ...W('axe', 0, SK), name: '船大工のオノ', price: 14800, desc: '島の船大工が、船の木を切るのに使うオノ。' },
  c7s_island_dagger: { ...W('dagger', 0, SK), name: '貝がらの短剣', price: 11800, desc: '大きな貝がらを、うすくけずった短剣。' },
  c7s_island_boomerang: { ...W('boomerang', 0, SK), name: 'ヤシの木のブーメラン', price: 12200, desc: 'ヤシの木をけずったブーメラン。島の子どもたちのたからもの。' },
  c7s_island_staff: { ...W('staff', 0, SK), name: '白しんじゅのつえ', price: 13000, bonus: { mag: 9, heal: 7 }, desc: '先に大きなしんじゅがついたつえ。魔力と回復の力が少し上がる。' },
  c7s_island_fan: { ...W('fan', 0, SK), name: 'ヤシの葉のおうぎ', price: 12200, desc: '大きなヤシの葉のおうぎ。あおぐと、しおの香りの風。' },
  c7s_island_mail: { ...A('heavy', 0, SK), name: '島の戦士のよろい', bonus: { agi: -2 }, price: 16000, desc: 'かたい大きな貝をつないだ、島の戦士のよろい。' },
  c7s_island_robe: { ...A('robe', 0, SK), name: '海風のローブ', bonus: { mag: 7 }, price: 13800, desc: '海風のように、かるいローブ。魔力が少し上がる。' },
  c7s_island_gi: { ...A('gi', 0, SK), name: '島の子の道着', bonus: { agi: 3 }, price: 13400, desc: '島の子どもが、海で遊ぶ時に着る道着。素早さが少し上がる。' },
  c7s_island_shield: { ...S(0, SK), name: '大貝のたて', price: 12000, desc: '大きな二まい貝の、かたいからのたて。' },
  c7s_island_helm: { ...H(true, 0, SK), name: 'サメの歯のかぶと', price: 11400, desc: 'サメの歯でかざった、島の戦士のかぶと。' },
  c7s_island_hat: { ...H(false, 0, SK), name: '大きな麦わらぼうし', price: 9800, desc: 'つばの広い、島の子の麦わらぼうし。お日さまも、へっちゃら。' },
};

const TK = { src: 'c7s' };
const TREASURE = {
  // 1階（今の しずみゆく島の 遺跡と 重なる 入口）
  c7st_tide_ring: { ...C(), ...TK, name: 'しおさいの指輪', bonus: { mag: 14, heal: 14, agi: 10, hp: 32 }, resist: { fire: 0.8, confuse: 0.6 }, desc: '耳に当てると、波の音がする指輪。だれでも装備でき、魔力と回復の力が上がる。混乱しにくい。' },
  // 2階
  c7st_gull_hat: { ...H(false, 4, K[2]), ...TK, name: 'カモメの羽のぼうし', bonus: { agi: 12, hp: 26 }, resist: { wind: 0.8, sleep: 0.7 }, desc: '白いカモメの羽をさしたぼうし。風に強く、ねむりにくい。' },
  // 3階
  c7st_coral_dagger: { ...W('dagger', 4, K[3]), ...TK, name: 'さんごの短剣', bonus: { agi: 14 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: '赤いさんごをけずった短剣。ときどきマヒさせる。' },
  // 4階（休み所）
  c7st_wave_robe: { ...A('robe', 4, K[4]), ...TK, name: '波もようのローブ', bonus: { mag: 18, heal: 12 }, resist: { fire: 0.8, bolt: 0.85 }, desc: '青い波のもようのローブ。炎に強く、雷に少し強い。' },
  // 5階
  c7st_beam_boomerang: { ...W('boomerang', 4, K[5]), ...TK, name: '灯台の光のブーメラン', bonus: { agi: 14, str: 8 }, resist: { dark: 0.85 }, desc: '灯台の光をあびて、ぴかぴか光るブーメラン。闇に少し強い。' },
  // 6階
  c7st_lens_shield: { ...S(4, K[6]), ...TK, name: '灯台のレンズのたて', bonus: { hp: 34 }, resist: { fire: 0.8, dark: 0.8 }, desc: '灯台の大きなレンズを、はめこんだたて。炎と闇に強い。' },
  // 7階（休み所）
  c7st_lamp_staff: { ...W('staff', 4, K[7]), ...TK, name: '灯台のあかりのつえ', bonus: { mag: 34, heal: 28 }, mpRegen: 1, resist: { dark: 0.8 }, desc: '灯台のあかりの火を、先にともしたつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c7st_beacon_sword: { ...W('sword', 4, K[8]), ...TK, name: '灯台の守りの剣', bonus: { str: 16, agi: 10 }, resist: { fire: 0.8, dark: 0.85 }, desc: '灯台のてっぺんに、千年ねむっていた剣。みどりの神殿の剣より、少し強い。炎に強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 海賊船ジョリーホック号: 1人 1つの アクセサリー（drops.boss）と、大いかりのオノ（drops.rare の 1回に 1回）
  c7r_anchor_charm: {
    ...C(3), ...PB, boss: 'c7_reef', unique: true, name: 'いかりのお守り', bonus: { hp: 98, str: 26, def: 22, mag: 24, agi: 20, heal: 18 }, resist: { fire: 0.7, ice: 0.7, confuse: 0.5 },
    desc: 'ジョリーホック号のいかりの、小さなかざり。だれでも装備でき、すべての力が大きく上がる。炎と氷に強い。',
  },
  c7r_anchor_axe: {
    ...W('axe', 5, 1.68), ...PB, boss: 'c7_reef', name: '大いかりのオノ', bonus: { str: 16, def: 8 }, crit: 0.03, resist: { fire: 0.8 },
    desc: 'ジョリーホック号のいかりから作ったオノ。今までのどのオノよりも強い。会心が出やすい。',
  },
  // ホック船長: 1人 1つの アクセサリーと、金のかぎづめ（今までで いちばん 強い ツメ）
  c7l_hook_charm: {
    ...C(3), ...PB, boss: 'c7_light', unique: true, name: '金のかぎのお守り', bonus: { hp: 100, str: 26, def: 22, mag: 26, agi: 24, heal: 18 }, resist: { fire: 0.7, dark: 0.7, paralyze: 0.6 },
    desc: 'ホック船長のぼうしの、金のかぎのかざり。だれでも装備でき、すべての力が大きく上がる。マヒしにくい。',
  },
  c7l_gold_hook: {
    ...W('claw', 5, 1.72), ...PB, boss: 'c7_light', name: '金のかぎづめ', bonus: { agi: 16, str: 10 }, crit: 0.04, resist: { dark: 0.8 },
    desc: 'ホック船長の右手と同じ形の、金のツメ。今までのどのツメよりも強い。会心が出やすい。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c7sl_shell_ring: { ...C(4), ...LT, name: '千年の貝の指輪', bonus: { hp: 42, str: 12, mag: 12, agi: 14, heal: 10 }, resist: { fire: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった貝の指輪。だれでも装備でき、すべての力が上がる。' },
  c7sl_sail_fan: { ...W('fan', 4, LK), ...LT, name: '船の旗のおうぎ', bonus: { mag: 12, agi: 10 }, resist: { wind: 0.8 }, desc: '千年前の船の旗を、そのままはった大きなおうぎ。風に強い。' },
  c7sl_tide_gi: { ...A('gi', 4, LK), ...LT, name: '満ち潮の道着', bonus: { str: 12, agi: 14, hp: 32 }, resist: { fire: 0.8, sleep: 0.6 }, desc: '満ち潮の時の海の色の道着。力と素早さが上がる。ねむりにくい。' },
  c7sl_lamp_helm: { ...H(true, 4, LK), ...LT, name: '灯台守のかぶと', bonus: { hp: 40, def: 6 }, resist: { dark: 0.8, blind: 0.6 }, desc: '千年前の灯台守が、あらしの夜にかぶっていたかぶと。闇に強く、まぼろしにかかりにくい。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C7S = { ...SHOP, ...TREASURE, ...BOSS, ...LETTER };

// しずむ前の島の灯台 1〜8階の 宝箱（階ごとに 2つ: ★5の 装備 1つ・素材か 道具 1つ。上の 階ほど 強く・めずらしく）
export const C7S_TREASURE = {
  1: ['c7st_tide_ring', 'silver_shard'],
  2: ['c7st_gull_hat', 'toku_herb'],
  3: ['c7st_coral_dagger', 'pretty_shell'],
  4: ['c7st_wave_robe', 'elf_drink'],
  5: ['c7st_beam_boomerang', 'star_shard'],
  6: ['c7st_lens_shield', 'cs_black_pearl'],
  7: ['c7st_lamp_staff', 'revive_flower'],
  8: ['c7st_beacon_sword', 'star_iron'],
};
// 宝箱の 中の 数（C7S_TREASURE と おなじ ならび。装備は 1つ）
export const C7S_TREASURE_N = { 1: [1, 3], 2: [1, 3], 3: [1, 5], 4: [1, 1], 5: [1, 3], 6: [1, 2], 7: [1, 2], 8: [1, 1] };
// 階 n の k ばんめの 宝箱 → { item, n }（A の マップ用。ない ときは null）
export function c7sChest(floor, k) {
  const item = C7S_TREASURE[floor]?.[k];
  return item ? { item, n: C7S_TREASURE_N[floor]?.[k] || 1 } : null;
}

// 時をこえる手紙の ごほうび（{ 手紙の 番号: [[id, こすう], …] }。A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C7S_LETTER_REWARDS = {
  1: [['c7sl_shell_ring', 1], ['pretty_shell', 4]],
  2: [['c7sl_sail_fan', 1], ['cloud_cotton', 3]],
  3: [['c7sl_tide_gi', 1], ['silver_shard', 3]],
  4: [['c7sl_lamp_helm', 1], ['star_shard', 3]],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C7S_DROPS = { c7_reef: ['c7r_anchor_charm', 'c7r_anchor_axe'], c7_light: ['c7l_hook_charm', 'c7l_gold_hook'] };

// カイの 島の 店の ならび（ランク10。A が 店を 作る ときに 使う）。のこりは 緑の王国・千年前の 里の 店の 品
export const C7S_SHOP_WEAPONS = ['c7s_island_sword', 'c7s_island_spear', 'c7s_island_axe', 'c7s_island_dagger', 'c7s_island_boomerang', 'c7s_island_staff', 'c7s_island_fan', 'c7_kingdom_whip', 'p6_kodai_claw', 'p6_kodai_bat'];
export const C7S_SHOP_ARMOR = ['c7s_island_mail', 'p6_kodai_mantle', 'c7s_island_robe', 'c7s_island_gi', 'c7s_island_shield', 'c7s_island_helm', 'c7s_island_hat'];
export const C7S_SHOP_TOOLS = [...C7_SHOP_TOOLS];

// 読みがな（あいうえお順の ならびかえ）
export const C7S_ITEM_KANA = {
  c7s_island_sword: 'なみのけん', c7s_island_spear: 'うみのおとこのやり', c7s_island_axe: 'ふなだいくのおの', c7s_island_dagger: 'かいがらのたんけん',
  c7s_island_boomerang: 'やしのきのぶーめらん', c7s_island_staff: 'しろしんじゅのつえ', c7s_island_fan: 'やしのはのおうぎ', c7s_island_mail: 'しまのせんしのよろい',
  c7s_island_robe: 'うみかぜのろーぶ', c7s_island_gi: 'しまのこのどうぎ', c7s_island_shield: 'おおがいのたて', c7s_island_helm: 'さめのはのかぶと', c7s_island_hat: 'おおきなむぎわらぼうし',
  c7st_tide_ring: 'しおさいのゆびわ', c7st_gull_hat: 'かもめのはねのぼうし', c7st_coral_dagger: 'さんごのたんけん', c7st_wave_robe: 'なみもようのろーぶ',
  c7st_beam_boomerang: 'とうだいのひかりのぶーめらん', c7st_lens_shield: 'とうだいのれんずのたて', c7st_lamp_staff: 'とうだいのあかりのつえ', c7st_beacon_sword: 'とうだいのまもりのけん',
  c7r_anchor_charm: 'いかりのおまもり', c7r_anchor_axe: 'おおいかりのおの', c7l_hook_charm: 'きんのかぎのおまもり', c7l_gold_hook: 'きんのかぎづめ',
  c7sl_shell_ring: 'せんねんのかいのゆびわ', c7sl_sail_fan: 'ふねのはたのおうぎ', c7sl_tide_gi: 'みちしおのどうぎ', c7sl_lamp_helm: 'とうだいもりのかぶと',
};
