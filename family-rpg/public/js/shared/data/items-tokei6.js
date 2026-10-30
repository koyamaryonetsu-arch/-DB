// 第2部 第6章 Step 6「時計塔の心臓」の 品（B: 品。items.js で まぜる。A が 宝箱で 使う）
// 名前の 約束（docs/plan-ch6.md の 17）: data/items-tokei.js の TOKEI_TREASURE_HIGH・C6_CLEAR_WEAPONS（ここから 出す）
//   TOKEI_TREASURE_HIGH … 時計塔 6〜10階の 宝箱の 中み（{ 6: [2つ], …, 10: [2つ] }。千年前だけ）
//     A が 置く 数が ちがう ときは、多い 分は 今の 道具で うめる・少ない ときは うしろ（強い 方）から へらす
//   C6_CLEAR_WEAPONS … てっぺんの 小べやの ★5の 武器（えらぶのは 1つ）。職業の なかまごとの 4しゅ ＋ 幻の職業むけ 1しゅ
//     （剣 … 戦う 職業・ツメ … 素手で 戦う 職業・つえ … 呪文と 回復の 職業・短剣 … わざの 職業・幻の職業 … 幻の職業なら だれでも）
//     c6ClearPick(JOBS[職業]) … その 職業に おすすめの 1つ（装備できる 物。なければ null）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'tokei'）: ぜんぶ ランク10の ★5・オレンジ（レア度 4）。強さの かけ算 TOKEI6_K: 6階 1.50 → 10階 1.54（5階 1.49 の 少し 上）
// ・ボスの 品（src: 'pastboss'）: ゼンマイが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の つえ
// ・第6章クリアの 武器（src: 'clear6'「時計塔のてっぺんでしか手に入らない」）: レア度 5・かけ算 1.58（いちばん 強い）
// ・時のまぼろしの 素材（まぼろしの時の砂。1日1回。world/tokei-phantom.js）と、それで 作る れん金（TOKEI6_RECIPES）
// 強さの めやす（items-tokei.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
const W = (cat, rarity, k) => ({ type: 'weapon', cat, rank: R, rarity, atk: Math.round(SWORD[R] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });
// 宝箱の 階ごとの 強さの かけ算（上の 階ほど 大きい。5階は 1.49）
export const TOKEI6_K = { 6: 1.5, 7: 1.51, 8: 1.52, 9: 1.53, 10: 1.54 };
const K = TOKEI6_K;
// 第6章クリアの 武器の かけ算
export const C6_CLEAR_K = 1.58;

const TK = { src: 'tokei' };
const TREASURE = {
  // 6階（休み所）
  p6z_hand_ring: { ...C(), ...TK, name: '時の針の指輪', bonus: { str: 12, mag: 12, agi: 10, hp: 30 }, resist: { paralyze: 0.6, dark: 0.85 }, desc: '長い針と短い針がかさなった指輪。だれでも装備でき、力と魔力と素早さが上がる。マヒしにくい。' },
  p6z_bell_spear: { ...W('spear', 4, K[6]), ...TK, name: 'かねの音のやり', bonus: { str: 8, agi: 8 }, resist: { confuse: 0.7 }, desc: 'ついた時に、小さくかねの音がするやり。混乱しにくい。' },
  // 7階（ふりこの 通路）
  p6z_pend_mantle: { ...A('cloth', 4, K[7]), ...TK, name: 'ふりこのマント', bonus: { agi: 18, hp: 24 }, resist: { wind: 0.8, paralyze: 0.7 }, desc: 'ふりこのように、ゆらりとゆれるマント。素早さが上がり、風に少し強い。' },
  p6z_cog_bat: { ...W('bat', 4, K[7]), ...TK, name: '歯車のバット', bonus: { str: 12 }, crit: 0.03, desc: '歯車をつみ上げてつくったバット。会心が出やすい。' },
  // 8階（歯車の 大広間）
  p6z_cog_helm: { ...H(true, 4, K[8]), ...TK, name: '大歯車のかぶと', bonus: { hp: 36, def: 6 }, resist: { bolt: 0.8, blast: 0.85 }, desc: '大きな歯車をかたどったかぶと。雷に強く、爆発に少し強い。' },
  p6z_cog_claw: { ...W('claw', 4, K[8]), ...TK, name: '大歯車のツメ', bonus: { agi: 14, str: 6 }, resist: { bolt: 0.85 }, desc: '大歯車の歯をとがらせたツメ。雷に少し強い。' },
  // 9階（休み所・さいごの 宝の 小べや）
  p6z_heart_gi: { ...A('gi', 4, K[9]), ...TK, name: '時の心臓の道着', bonus: { str: 14, agi: 14, hp: 30 }, resist: { dark: 0.8, sleep: 0.6 }, desc: '時計塔の心臓の音がきこえる道着。力と素早さが上がる。ねむりにくい。' },
  p6z_heart_staff: { ...W('staff', 4, K[9]), ...TK, name: '時の心臓のつえ', bonus: { mag: 30, heal: 24 }, mpRegen: 1, resist: { dark: 0.8 }, desc: '先で小さな歯車が回るつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 10階（ボスの 間の 前）
  p6z_time_shield: { ...S(4, K[10]), ...TK, name: '時の守りのたて', bonus: { hp: 40 }, resist: { dark: 0.8, bolt: 0.85, ice: 0.85 }, desc: '止まった時の力で守る、大きなたて。闇に強く、雷と氷に少し強い。' },
  p6z_heart_sword: { ...W('sword', 4, K[10]), ...TK, name: '時の心臓の剣', bonus: { str: 14, agi: 10 }, resist: { dark: 0.7, bolt: 0.85 }, desc: '時計塔の心臓のそばにねむっていた剣。時計塔の剣より、少し強い。闇に強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // ゼンマイ: 1人 1つの アクセサリー（drops.boss）と、影の時計師のつえ（drops.rare の 1回に 1回。今までで いちばん 強い つえ）
  p6z_zenmai_charm: {
    ...C(3), ...PB, boss: 'zenmai', unique: true, name: '影の時計のお守り', bonus: { hp: 90, str: 22, def: 18, mag: 22, agi: 20, heal: 16 }, resist: { dark: 0.55, confuse: 0.5, sleep: 0.5, paralyze: 0.5 },
    desc: 'ゼンマイのむねにあった、小さな影の時計。もう、時をくるわせることはない。だれでも装備でき、すべての力が大きく上がる。',
  },
  p6z_zenmai_staff: {
    ...W('staff', 5, 1.56), ...PB, boss: 'zenmai', name: '影の時計師のつえ', bonus: { mag: 40, heal: 20, agi: 8 }, mpRegen: 1, resist: { dark: 0.6 },
    desc: 'ゼンマイが持っていた、長い針の形のつえ。今までのどのつえよりも強い。行動するたびにMPが1もどる。',
  },
};

// ───── 第6章クリアの ★5の 武器（てっぺんの 小べや。えらぶのは 1つ）─────
const CL = { src: 'clear6' };
const CLEAR = {
  c6w_sword: { ...W('sword', 5, C6_CLEAR_K), ...CL, name: '千年の紋章の剣', bonus: { str: 18, agi: 12, hp: 30 }, resist: { dark: 0.6, bolt: 0.85 }, desc: '最初の紋章の勇者たちの時代の剣。紋章の光が、つかの中でねむっている。戦う職業むけ。闇に強い。' },
  c6w_claw: { ...W('claw', 5, C6_CLEAR_K), ...CL, name: '時の歯車のツメ', bonus: { agi: 22, str: 12 }, crit: 0.04, resist: { dark: 0.75 }, desc: '時計塔の心臓の歯車をといだツメ。素手で戦う職業むけ。会心が出やすい。' },
  c6w_staff: { ...W('staff', 5, C6_CLEAR_K), ...CL, name: '星読みの時のつえ', bonus: { mag: 42, heal: 34 }, mpRegen: 2, resist: { dark: 0.75 }, desc: '星読みのしおりの光を集めたつえ。呪文と回復の職業むけ。行動するたびにMPが2もどる。' },
  c6w_dagger: { ...W('dagger', 5, C6_CLEAR_K), ...CL, name: '秒をきざむ短剣', bonus: { agi: 26, str: 8, mag: 8 }, onHit: { status: 'paralyze', chance: 0.1 }, resist: { paralyze: 0.6 }, desc: '1びょうごとに、かすかに光る短剣。わざの職業むけ。ときどき敵の動きを止める。' },
  // 幻の職業むけ（幻の職業なら、武器の しゅるいに かかわらず 装備できる。stats.js の canEquip の phantomOk）
  c6w_phantom: { ...W('sword', 5, C6_CLEAR_K), ...CL, phantomOk: true, name: '千年の時のつるぎ', bonus: { str: 16, mag: 24, agi: 16, heal: 12 }, resist: { dark: 0.7, light: 0.85 }, desc: '千年の時をこえて、紋章の勇者たちから、幻の力を持つ者へわたされた、つるぎ。幻の職業なら、だれでも装備できる。' },
};

// ───── 時のまぼろしの 素材（1日1回）と、それで 作る れん金の 品 ─────
const MAT = {
  p6z_phantom_sand: { name: 'まぼろしの時の砂', type: 'mat', price: 0, sell: 400, desc: '止まった時の間の、時のまぼろしからもらえる、むらさき色の砂。れん金で、★5の品をもっと強くできる。' },
};
const ALCH = {
  p6z_toki_ring: { ...C(5), src: 'alchemy', name: '時のまぼろしの指輪', bonus: { hp: 60, str: 20, def: 16, mag: 20, agi: 20, heal: 14 }, resist: { dark: 0.7, paralyze: 0.6, sleep: 0.6 }, desc: 'まぼろしの時の砂を、指輪の形にかためたもの。だれでも装備でき、すべての力が上がる。' },
  p6z_toki_charm: { ...C(5), src: 'alchemy', name: 'まぼろしの時計のお守り', bonus: { hp: 100, str: 24, def: 20, mag: 24, agi: 22, heal: 18 }, resist: { dark: 0.5, confuse: 0.5, sleep: 0.5, paralyze: 0.5 }, desc: '影の時計のお守りに、まぼろしの時の砂をこめたもの。だれでも装備でき、すべての力がとても大きく上がる。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(CLEAR), ...Object.values(ALCH)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_TOKEI6 = { ...TREASURE, ...BOSS, ...CLEAR, ...MAT, ...ALCH };

// 時計塔 6〜10階の 宝箱（階ごとに 2つ。6階から じゅんに 強く なる）
export const TOKEI_TREASURE_HIGH = {
  6: ['p6z_hand_ring', 'p6z_bell_spear'],
  7: ['p6z_pend_mantle', 'p6z_cog_bat'],
  8: ['p6z_cog_helm', 'p6z_cog_claw'],
  9: ['p6z_heart_gi', 'p6z_heart_staff'],
  10: ['p6z_time_shield', 'p6z_heart_sword'],
};

// 第6章クリアの ★5の 武器（えらぶ ならび。さいごが 幻の職業むけ）
export const C6_CLEAR_WEAPONS = ['c6w_sword', 'c6w_claw', 'c6w_staff', 'c6w_dagger', 'c6w_phantom'];
// 職業の なかま（jobs.js の family）ごとの えらぶ じゅん。幻の職業（tier 4）は c6w_phantom
const CLEAR_BY_CAT = { sword: 'c6w_sword', claw: 'c6w_claw', staff: 'c6w_staff', dagger: 'c6w_dagger' };
const CLEAR_ORDER = { phys: ['sword', 'claw', 'dagger', 'staff'], magic: ['staff', 'dagger', 'sword', 'claw'], tech: ['dagger', 'staff', 'sword', 'claw'] };
// job … JOBS の 1つ（{ tier, family, weapons }）。その 職業に おすすめの 1つ（装備できる 物。なければ null）
export function c6ClearPick(job) {
  if (!job) return null;
  if ((job.tier || 0) >= 4) return 'c6w_phantom';
  const ws = job.weapons || [];
  // 素手で 戦う 職業（素手と ツメ）は ツメ
  if (job.family === 'phys' && ws.includes('none') && ws.includes('claw')) return 'c6w_claw';
  const cat = (CLEAR_ORDER[job.family] || CLEAR_ORDER.phys).find((k) => ws.includes(k));
  return cat ? CLEAR_BY_CAT[cat] : null;
}

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const TOKEI6_DROPS = { zenmai: ['p6z_zenmai_charm', 'p6z_zenmai_staff'] };
// 時のまぼろしに 勝つと もらえる 素材（world/tokei-phantom.js。1日1回・1人 この 数）
export const TOKI_PHANTOM_REWARD = { id: 'p6z_phantom_sand', n: 2 };

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5）
export const TOKEI6_RECIPES = [
  { id: 'r_toki_ring', tier: 5, out: 'p6z_toki_ring', ins: ['p6z_phantom_sand', 'p6z_phantom_sand', 'p6z_phantom_sand'] },
  { id: 'r_toki_charm', tier: 5, out: 'p6z_toki_charm', ins: ['p6z_zenmai_charm', 'p6z_phantom_sand', 'p6z_phantom_sand'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const TOKEI6_ITEM_KANA = {
  p6z_hand_ring: 'ときのはりのゆびわ', p6z_bell_spear: 'かねのねのやり', p6z_pend_mantle: 'ふりこのまんと', p6z_cog_bat: 'はぐるまのばっと',
  p6z_cog_helm: 'おおはぐるまのかぶと', p6z_cog_claw: 'おおはぐるまのつめ', p6z_heart_gi: 'ときのしんぞうのどうぎ', p6z_heart_staff: 'ときのしんぞうのつえ',
  p6z_time_shield: 'ときのまもりのたて', p6z_heart_sword: 'ときのしんぞうのけん',
  p6z_zenmai_charm: 'かげのとけいのおまもり', p6z_zenmai_staff: 'かげのとけいしのつえ',
  c6w_sword: 'せんねんのもんしょうのけん', c6w_claw: 'ときのはぐるまのつめ', c6w_staff: 'ほしよみのときのつえ', c6w_dagger: 'びょうをきざむたんけん',
  c6w_phantom: 'せんねんのときのつるぎ',
  p6z_phantom_sand: 'まぼろしのときのすな', p6z_toki_ring: 'ときのまぼろしのゆびわ', p6z_toki_charm: 'まぼろしのとけいのおまもり',
};
