// 第5章 Step 5「星読みの里」と「ノクトの思い出の迷宮」の 品（B: 品。items.js で まぜる。A が 店と 宝箱で 使う）
// 名前の 約束（docs/plan-ch5.md の 14）: HOSHIYOMI_SHOP_WEAPONS・HOSHIYOMI_SHOP_ARMOR・HOSHIYOMI_SHOP_TOOLS（里の 店の ならび）・
//   MEMORY_TREASURE（迷宮の 各階の 宝箱）
//
// ・里の 店（ランク8「光」の 上の ほう）: 店の 品（レア度 0）なので ★1・きたえられない（第35回）。強さは ハネノの 店の 約1.08倍
//   武器は 今の 職業の 10しゅるい（剣・オノ・短剣・やり・ツメ・ムチ・つえ・おうぎ・ブーメラン・バット）を そろえた
// ・迷宮の 宝箱（MEMORY_TREASURE）: そこだけの 品（光と影・星読み・思い出に ちなむ）。どれも ランク8 なので ★4（第35回「ランクで ★」）。
//   深い 階ほど 強い（名前の 色＝めずらしさ: 1〜2階 青・3〜4階 紫・5〜6階 オレンジ。強さも レア度で 少しずつ 上がる）。
//   同じ ランクの 店の 品（★1）より 強い
// ・ノクトの影: かならず 落とす アクセサリー（影星のペンダント。ボス級「影の王」の 配合の 素材）と、ちなんだ 品（影のマント）
// ・れん金（HOSHIYOMI_RECIPES。data/alchemy.js が まぜる）: この 章の 素材（星の砂・影のしずく）を 使う
// 強さの めやす（items-kumoi.js と おなじ）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
// ランク8の 上の ほう（ハネノの 店より 少し 強い）
const UP = 1.08;
const W = (cat, rarity) => ({ type: 'weapon', cat, rank: 8, rarity, atk: Math.round(SWORD[8] * CAT_K[cat] * UP * RAR_K[rarity]) });
const A = (armorType, rarity) => ({ type: 'armor', armorType, rank: 8, rarity, def: Math.round(CLOTH[8] * ARMOR_K[armorType] * UP * RAR_K[rarity]) });
const S = (rarity) => ({ type: 'shield', rank: 8, rarity, def: Math.round(CLOTH[8] * UP * RAR_K[rarity]) });
const H = (rarity, helm = false) => ({ type: 'head', rank: 8, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[8] * (helm ? 0.6 : 0.4) * UP * RAR_K[rarity]) });
const C = (rarity) => ({ type: 'acc', rank: 8, rarity });
const MEM = { src: 'memory' };

// ───── 星読みの里の 店（ランク8の 上の ほう・★1）─────
const SHOP = {
  // 武器
  hoshi_sword: { ...W('sword', 0), name: '星読みの剣', price: 9400, desc: '星読みの里で打たれた剣。刀身に、小さな星座がきざまれている。' },
  ryusei_axe: { ...W('axe', 0), name: '流星のオノ', bonus: { agi: -3 }, price: 9900, desc: '流れ星のように、ふり下ろすと光のすじを引く大きなオノ。' },
  stardust_dagger: { ...W('dagger', 0), name: '星くずの短剣', bonus: { agi: 8 }, price: 7000, desc: '星くずをまぜてきたえた、軽い短剣。' },
  polaris_spear: { ...W('spear', 0), name: '北極星のやり', bonus: { agi: 2 }, price: 8700, desc: '旅人の目じるしの北極星のように、まっすぐのびるやり。' },
  starlight_claw: { ...W('claw', 0), name: '星明かりのツメ', bonus: { agi: 4 }, price: 8500, desc: '星明かりをうけて、青白く光るツメ。' },
  seiza_whip: { ...W('whip', 0), name: '星座のムチ', price: 8400, desc: '星と星をつなぐ線のような、長い銀のムチ。' },
  hoshi_staff: { ...W('staff', 0), name: '星読みのつえ', bonus: { mag: 35, heal: 20 }, price: 8400, desc: '星読みの人たちが使うつえ。先に小さな星がゆれている。' },
  yozora_fan: { ...W('fan', 0), name: '夜空のおうぎ', bonus: { agi: 12 }, price: 7700, desc: '夜空の色にそめたおうぎ。あおぐと、星がまう。' },
  comet_boomerang: { ...W('boomerang', 0), name: 'ほうき星のブーメラン', price: 8400, desc: 'ほうき星のように、光のすじを引いて飛ぶブーメラン。敵全体に当たる。' },
  tsukiyo_bat: { ...W('bat', 0), name: '月夜のバット', bonus: { agi: 2 }, price: 8400, desc: '月の光でみがいたバット。夜の空き地で、よくひびく。' },
  // 防具
  hoshi_mail: { ...A('heavy', 0), name: '星読みのよろい', bonus: { agi: -2 }, price: 9900, desc: '星図のもようがうかぶ、こい青のよろい。' },
  hoshizukiyo_mantle: { ...A('cloth', 0), name: '星月夜のマント', bonus: { agi: 4 }, price: 8100, desc: '星と月の夜空をうつしたマント。だれでも装備できる。' },
  hoshi_robe: { ...A('robe', 0), name: '星読みのローブ', bonus: { mag: 12, heal: 10 }, price: 8100, desc: '星読みの人たちが着るローブ。魔力が上がる。' },
  yokaze_gi: { ...A('gi', 0), name: '夜風の道着', bonus: { agi: 12 }, price: 8100, desc: '夜風のように軽い道着。とても動きやすい。' },
  star_shield: { ...S(0), name: '星のたて', price: 7400, desc: '星の形のかざりがついた、まるいたて。' },
  star_helm: { ...H(0, true), name: '星のかぶと', price: 6000, desc: '星のかざりのついたかぶと。戦士などが装備できる。' },
  hoshi_hood: { ...H(0), name: '星読みのずきん', bonus: { mag: 3 }, price: 3800, desc: '星読みの人たちがかぶるずきん。だれでも装備できる。' },
  // 道具
  hoshi_konpeito: {
    name: '星のこんぺいとう', type: 'use', price: 420, target: 'ally', battle: true, field: true,
    effect: { type: 'mpHeal', base: [26, 34] },
    desc: '星読みの里の、星の形のおかし。MPを30ほど回復する。',
  },
};

// ───── 素材（里の まわり・思い出の 迷宮の 魔物が 落とす。れん金で 使う）─────
const MATS = {
  star_sand: { name: '星の砂', type: 'mat', price: 0, sell: 40, desc: '星読みの里のまわりでとれる、きらきら光る砂。' },
  shade_drop: { name: '影のしずく', type: 'mat', price: 0, sell: 45, desc: '影の魔物からとれる、黒くすきとおったしずく。' },
};

// ───── ノクトの思い出の迷宮の 宝箱（そこだけの 品。光と影・星読み・思い出）─────
const MEM_GEAR = {
  // 1階（青）
  mem_scarf: { ...C(2), ...MEM, name: 'ほしぞらのマフラー', bonus: { agi: 8, hp: 12 }, resist: { ice: 0.8 }, desc: '星空のもようをあんだ、あったかいマフラー。だれでも装備でき、氷に強い。' },
  // 2階（青）
  mem_moon_claw: { ...W('claw', 2), ...MEM, name: '月かげのツメ', bonus: { agi: 5 }, resist: { dark: 0.85 }, desc: '月の光と影を集めたツメ。闇に少し強い。' },
  mem_shadow_fan: { ...W('fan', 2), ...MEM, name: '光と影のおうぎ', bonus: { agi: 8, mag: 6 }, resist: { light: 0.85, dark: 0.85 }, desc: '表は光、うらは影のおうぎ。光と闇に少し強い。' },
  // 3階（紫）
  mem_starmap_robe: { ...A('robe', 3), ...MEM, name: '星図のローブ', bonus: { mag: 14, heal: 12 }, resist: { confuse: 0.6 }, desc: '星読みの星図をししゅうしたローブ。魔力と回復の力が上がり、混乱しにくい。' },
  mem_venus_staff: { ...W('staff', 3), ...MEM, name: '明けの明星のつえ', bonus: { mag: 38, heal: 14 }, mpRegen: 1, desc: '夜明け前にいちばん光る星をかたどったつえ。行動するたびに、MPが少し回復する。' },
  // 4階（紫）
  mem_shadowsew_dagger: { ...W('dagger', 3), ...MEM, name: '影ぬいの短剣', bonus: { agi: 8 }, onHit: { status: 'paralyze', chance: 0.12 }, desc: '影をぬいとめるという短剣。たたくと、ときどき敵が動けなくなる。' },
  mem_lamp_shield: { ...S(3), ...MEM, name: 'ともしびのたて', bonus: { hp: 20 }, resist: { dark: 0.8 }, desc: '小さなともしびがともる、あったかいたて。HPが上がり、闇に強い。' },
  // 5階（オレンジ）
  mem_twilight_spear: { ...W('spear', 4), ...MEM, name: 'たそがれのやり', bonus: { agi: 6 }, resist: { light: 0.85, dark: 0.85 }, desc: '昼と夜のさかいめの色をしたやり。光と闇に少し強い。' },
  mem_moonlight_mail: { ...A('heavy', 4), ...MEM, name: '月光のよろい', bonus: { hp: 20 }, resist: { ice: 0.85, dark: 0.8 }, desc: '月の光でできたような、青白いよろい。氷と闇に強い。' },
  // 6階（オレンジ。いちばん 下）
  mem_lightshadow_sword: { ...W('sword', 4), ...MEM, name: '光と影の剣', bonus: { str: 6, agi: 4 }, resist: { light: 0.8, dark: 0.8 }, desc: '光と影の両方をうつす剣。光と闇に強い。' },
  mem_star_crown: { ...H(4), ...MEM, name: '星読みのかんむり', bonus: { mag: 6, agi: 6, heal: 6 }, resist: { confuse: 0.5, sleep: 0.7 }, desc: '星読みの長がかぶったという、星のかんむり。だれでも装備でき、混乱とねむりに強い。' },
};

// ───── ノクトの影の 品 ─────
const BOSS = {
  // かならず 落とす（1人 1つの アクセサリー。loot.js の drops.boss）。ボス級「影の王」の 配合の 素材（data/monsters-boss.js）
  shade_pendant: {
    name: '影星のペンダント', type: 'acc', rank: 8, unique: true, bonus: { mag: 10, agi: 6, hp: 30 }, resist: { dark: 0.6, confuse: 0.6 }, price: 0, sell: 2000,
    desc: 'ノクトの影がのこした、黒い星のペンダント。魔力と素早さとHPが上がり、闇と混乱に強い。',
  },
  // ちなんだ 品（第32回の ボスの 品: 店の いちばん よい 品と おなじ 強さ ＋ とくせい 1つ）
  shade_cloak: { ...A('cloth', 2), src: 'boss', boss: 'nocto_shadow', name: '影のマント', bonus: { agi: 6 }, resist: { dark: 0.7 }, desc: 'ノクトの影をおりこんだような、黒いマント。だれでも装備でき、闇に強い。' },
};

// ───── れん金でしか 作れない 品（data/alchemy.js の HOSHIYOMI_RECIPES）─────
const ALCH = {
  dawn_cloak: { ...A('cloth', 3), src: 'alchemy', name: '夜明けのマント', bonus: { agi: 8, mag: 6 }, resist: { dark: 0.7, light: 0.8 }, desc: '影のマントに、夜明けの光をおりこんだマント。だれでも装備でき、光と闇に強い。' },
  hoshi_great_staff: { ...W('staff', 3), src: 'alchemy', name: '星読みの大づえ', bonus: { mag: 42, heal: 18 }, resist: { confuse: 0.7 }, desc: '星読みのつえに、星の砂の力をこめた大きなつえ。混乱しにくい。' },
};

for (const it of [...Object.values(MEM_GEAR), ...Object.values(ALCH), BOSS.shade_cloak]) {
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_HOSHIYOMI = { ...SHOP, ...MATS, ...MEM_GEAR, ...BOSS, ...ALCH };

// 星読みの里の 店の ならび（A が 店で 使う）
export const HOSHIYOMI_SHOP_WEAPONS = ['hoshi_sword', 'ryusei_axe', 'stardust_dagger', 'polaris_spear', 'starlight_claw', 'seiza_whip', 'hoshi_staff', 'yozora_fan', 'comet_boomerang', 'tsukiyo_bat'];
export const HOSHIYOMI_SHOP_ARMOR = ['hoshi_mail', 'hoshizukiyo_mantle', 'hoshi_robe', 'yokaze_gi', 'star_shield', 'star_helm', 'hoshi_hood'];
export const HOSHIYOMI_SHOP_TOOLS = ['herb', 'kumo_wataame', 'antidote', 'moonherb', 'hanebito_salve', 'hoshi_konpeito', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];

// 思い出の 迷宮の 各階の 宝箱の 中み（1階〈5さい〉… 6階〈今〉。A が 宝箱で 使う）
export const MEMORY_TREASURE = {
  1: ['mem_scarf'],
  2: ['mem_moon_claw', 'mem_shadow_fan'],
  3: ['mem_starmap_robe', 'mem_venus_staff'],
  4: ['mem_shadowsew_dagger', 'mem_lamp_shield'],
  5: ['mem_twilight_spear', 'mem_moonlight_mail'],
  6: ['mem_lightshadow_sword', 'mem_star_crown'],
};

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5 … 第5章）
export const HOSHIYOMI_RECIPES = [
  { id: 'r_dawn_cloak', tier: 5, out: 'dawn_cloak', ins: ['shade_cloak', 'shade_drop', 'star_sand'] },
  { id: 'r_hoshi_great_staff', tier: 5, out: 'hoshi_great_staff', ins: ['hoshi_staff', 'star_sand', 'star_sand'] },
  // 第50回: 種（強さを 上げる 道具）は れん金で 作れない。おぼえた レシピの ID は そのまま、できる 物を かえた
  { id: 'r_wise_seed', tier: 5, out: 'elf_drink', ins: ['star_sand', 'star_sand', 'shade_drop'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const HOSHIYOMI_ITEM_KANA = {
  hoshi_sword: 'ほしよみのけん', ryusei_axe: 'りゅうせいのおの', stardust_dagger: 'ほしくずのたんけん', polaris_spear: 'ほっきょくせいのやり',
  starlight_claw: 'ほしあかりのつめ', seiza_whip: 'せいざのむち', hoshi_staff: 'ほしよみのつえ', yozora_fan: 'よぞらのおうぎ',
  comet_boomerang: 'ほうきぼしのぶーめらん', tsukiyo_bat: 'つきよのばっと',
  hoshi_mail: 'ほしよみのよろい', hoshizukiyo_mantle: 'ほしづきよのまんと', hoshi_robe: 'ほしよみのろーぶ', yokaze_gi: 'よかぜのどうぎ',
  star_shield: 'ほしのたて', star_helm: 'ほしのかぶと', hoshi_hood: 'ほしよみのずきん', hoshi_konpeito: 'ほしのこんぺいとう',
  star_sand: 'ほしのすな', shade_drop: 'かげのしずく',
  mem_scarf: 'ほしぞらのまふらー', mem_moon_claw: 'つきかげのつめ', mem_shadow_fan: 'ひかりとかげのおうぎ', mem_starmap_robe: 'せいずのろーぶ',
  mem_venus_staff: 'あけのみょうじょうのつえ', mem_shadowsew_dagger: 'かげぬいのたんけん', mem_lamp_shield: 'ともしびのたて',
  mem_twilight_spear: 'たそがれのやり', mem_moonlight_mail: 'げっこうのよろい', mem_lightshadow_sword: 'ひかりとかげのけん', mem_star_crown: 'ほしよみのかんむり',
  shade_pendant: 'かげぼしのぺんだんと', shade_cloak: 'かげのまんと', dawn_cloak: 'よあけのまんと', hoshi_great_staff: 'ほしよみのおおづえ',
};
