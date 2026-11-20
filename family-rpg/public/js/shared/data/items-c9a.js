// 第3部 第1章 第1幕「星ふるえの夜」の 品（B: 品。items.js で まぜる。A が 宝箱・台本で 使う）
// 名前の 約束（docs/plan-part3.md の 9-4・plan-ch7.md の 4-4）:
//   C9A_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     森 c9a_f1・c9a_f2 / 地下道 c9a_b1a・c9a_b1b … c9a_b4a・c9a_b4b / ひみつの 部屋 c9a_s1・c9a_s2 / 音さの れんしゅう c9a_fork1
//     第64回 ⑥d（装備が 手に入りすぎない）: 森と 地下道の 階ごとに ★5 装備 1つ（…a・f1）・素材か 道具 1つ（…b・f2）
//     ひみつの 部屋・音さの れんしゅうは おまけ（素材か 道具）
//   c9aChest(id) → { item, n }（ない ときは null）
//   STAR_FORK（star_fork）… だいじな 物「星の音さ」（使い方は A班。ここは 品の データだけ）
//   店: この 幕では 新しい 店は ない（くぼ地の 道具屋は A班。使う 道具だけ）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'c9a'「星ふるえの夜の宝箱でしか手に入らない」）: 装備は ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C9A_K: 森 2.10 → 地下道 地下1階 2.11 … 地下4階 2.14（第8章 第4幕は 2.03〜2.08。docs/plan-part3.md の 9-3）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
//   スイトール1号 … ホシドロ一味のバッジ・キラジョのおうぎ／ホシモリ … 夜明けのはね・ホシモリのつえ
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・3人組の ビリビリ光線（雷）・ホシモリの やみ（闇）に そなえて、雷・闇に 少し 強い 品を 多めに

// 強さの めやす（items-c8r.js と おなじ。ランク 0〜10）
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

// 宝箱の ★5 の かけ算（森 → 地下道の 深い 階）
export const C9A_K = { forest: 2.10, b1: 2.11, b2: 2.12, b3: 2.13, b4: 2.14 };
const K = C9A_K;

const TK = { src: 'c9a' };
const TREASURE = {
  // 星ふるえの森
  c9at_star_claw: { ...W('claw', 4, K.forest), ...TK, name: '星くずのツメ', bonus: { str: 20, agi: 14 }, resist: { bolt: 0.85 }, desc: 'ながれ星のかけらをとがらせたツメ。力と素早さが上がる。雷に少し強い。' },
  // 地下1階（光ごけ）
  c9at_moss_robe: { ...A('robe', 4, K.b1), ...TK, name: '光ごけのローブ', bonus: { mag: 26, heal: 18 }, resist: { dark: 0.8 }, desc: '光るこけをおりこんだ、うす緑のローブ。魔力と回復の力が上がる。闇に強い。' },
  // 地下2階（星の石）
  c9at_stone_shield: { ...S(4, K.b2), ...TK, name: '星の石のたて', bonus: { hp: 46 }, resist: { bolt: 0.85, dark: 0.85 }, desc: '星の石をけずって作ったたて。雷と闇に少し強い。' },
  // 地下3階（くらやみ）
  c9at_owl_hat: { ...H(false, 4, K.b3), ...TK, name: 'ふくろうの夜ぼうし', bonus: { hp: 48, mag: 13, heal: 11 }, resist: { dark: 0.8 }, desc: 'ふくろうの耳のような、とんがりぼうし。暗やみでも、よく見える気がする。闇に強い。' },
  // 地下4階（ためしの 前）
  c9at_dawn_mail: { ...A('heavy', 4, K.b4), ...TK, name: '夜明けのよろい', bonus: { hp: 48, agi: -2 }, resist: { dark: 0.8, bolt: 0.85 }, desc: '夜明けの光の色をした、かたいよろい。闇に強く、雷に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // スイトール1号（3人組）: 1人 1つの アクセサリー（drops.boss）と、キラジョのおうぎ（drops.rare の 1回に 1回。今までで いちばん 強い おうぎ）
  c9b_trio_badge: {
    ...C(3), ...PB, boss: 'c9a_suitoru', unique: true, name: 'ホシドロ一味のバッジ', bonus: { hp: 128, str: 36, def: 33, mag: 36, agi: 32, heal: 28 }, resist: { bolt: 0.7, fire: 0.85 },
    desc: '3人組が、にげるときに落としていった、星の形のバッジ。だれでも装備でき、すべての力が大きく上がる。雷に強い。',
  },
  c9b_kirajo_fan: {
    ...W('fan', 5, 2.04), ...PB, boss: 'c9a_suitoru', name: 'キラジョのおうぎ', bonus: { mag: 20, agi: 18, heal: 12 }, crit: 0.03, resist: { bolt: 0.85 },
    desc: 'キラジョが、いつも持っているきらきらのおうぎ。今までのどのおうぎよりも強い。会心が出やすい。',
  },
  // ホシモリ（ともしびの ためし）: 1人 1つの アクセサリー（第3部 第1章 第1幕の お守り）と、ホシモリのつえ（今までで いちばん 強い つえ）
  c9b_dawn_feather: {
    ...C(3), ...PB, boss: 'c9a_hoshimori', unique: true, name: '夜明けのはね', bonus: { hp: 132, str: 37, def: 34, mag: 37, agi: 33, heal: 29 }, resist: { dark: 0.7, light: 0.85 },
    desc: 'ホシモリが、うなずいてくれた夜明けに、そっと落ちてきた石のはね。だれでも装備でき、すべての力が大きく上がる。闇に強い。',
  },
  c9b_owl_staff: {
    ...W('staff', 5, 2.02), ...PB, boss: 'c9a_hoshimori', name: 'ホシモリのつえ', bonus: { mag: 48, heal: 36 }, mpRegen: 1, resist: { dark: 0.85 },
    desc: '先に、小さなふくろうの石像がついたつえ。今までのどのつえよりも強い。行動するたびにMPが1もどる。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const STAR_FORK = 'star_fork';
const KEY = {
  [STAR_FORK]: {
    name: '星の音さ', type: 'key',
    desc: '星の石の根で見つけた、ふしぎな音さ。鳴らすと、遠くの星の音がこたえる。かくれた物も光らせる。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C9A = { ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }。…a・f1 は ★5 の 装備・…b・f2 は 素材か 道具。ひみつの 部屋と 音さの れんしゅうは おまけ）
export const C9A_TREASURE = {
  c9a_f1: ['c9at_star_claw', 1],
  c9a_f2: ['star_sand', 4],
  c9a_b1a: ['c9at_moss_robe', 1],
  c9a_b1b: ['toku_herb', 3],
  c9a_b2a: ['c9at_stone_shield', 1],
  c9a_b2b: ['silver_shard', 3],
  c9a_b3a: ['c9at_owl_hat', 1],
  c9a_b3b: ['elf_drink', 2],
  c9a_b4a: ['c9at_dawn_mail', 1],
  c9a_b4b: ['star_iron', 1],
  c9a_s1: ['revive_flower', 2],
  c9a_s2: ['limit_stone', 1],
  c9a_fork1: ['star_shard', 3],
};
export const C9A_CHEST_IDS = Object.keys(C9A_TREASURE);
// ★5 の 装備が 入って いる 宝箱（階ごとに 1つ）
export const C9A_GEAR_CHESTS = ['c9a_f1', 'c9a_b1a', 'c9a_b2a', 'c9a_b3a', 'c9a_b4a'];
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c9aChest(id) {
  const e = C9A_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C9A_DROPS = { c9a_suitoru: ['c9b_trio_badge', 'c9b_kirajo_fan'], c9a_hoshimori: ['c9b_dawn_feather', 'c9b_owl_staff'] };

// 読みがな（あいうえお順の ならびかえ）
export const C9A_ITEM_KANA = {
  c9at_star_claw: 'ほしくずのつめ', c9at_moss_robe: 'ひかりごけのろーぶ', c9at_stone_shield: 'ほしのいしのたて', c9at_owl_hat: 'ふくろうのよぼうし', c9at_dawn_mail: 'よあけのよろい',
  c9b_trio_badge: 'ほしどろいちみのばっじ', c9b_kirajo_fan: 'きらじょのおうぎ', c9b_dawn_feather: 'よあけのはね', c9b_owl_staff: 'ほしもりのつえ',
  [STAR_FORK]: 'ほしのおんさ',
};
