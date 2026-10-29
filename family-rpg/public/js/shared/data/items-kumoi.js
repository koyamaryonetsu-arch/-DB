// 第5章 Step 3・4「クモイ地方」と「しずみゆく島の古い神殿」の 品（B: 品。items.js で まぜる。A が 店と 宝箱で 使う）
// 名前の 約束（docs/plan-ch5.md の 13）: KUMOI_SHOP_WEAPONS・KUMOI_SHOP_ARMOR・KUMOI_SHOP_TOOLS（ハネノの 店の ならび）・RUIN_TREASURE（神殿の 各階の 宝箱）
//
// ・ランク8「光」: 雲の上の町ハネノの 店（★なし。レア度 0）。武器は 今の 職業の 10しゅるい（剣・オノ・短剣・やり・ツメ・ムチ・つえ・おうぎ・ブーメラン・バット）を そろえた
//   強さは items.js の EQUIP_RANKS（剣 72・服 39）と、ランク7（ドゥナ）の 品の わりあい
// ・神殿の 宝箱（RUIN_TREASURE）: そこだけの ★2〜★4（空・大地・雲。ゲームや 神話から）。深い 階ほど 強い（1〜2階 ★2・3〜5階 ★3・6〜7階 ★4）
// ・ガイアイーター: かならず 落とす アクセサリー（大ムカデのキバのお守り）と、ちなんだ ★2（大ムカデのよろい。第32回の ボスの 品の きまり）
// ・空の レア（region 6）: 雲の上の 魔物が まれに 落とす（500体に 1体。data/rare-loot.js）
// ・れん金（KUMOI_RECIPES。data/alchemy.js が まぜる）: この章の 素材（雲のわた・大地のかけら）を 使う
// 強さの めやす（items-rare.js と おなじ）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const W = (cat, rank, rarity) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SWORD[rank] * CAT_K[cat] * RAR_K[rarity]) });
const A = (armorType, rank, rarity) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * RAR_K[rarity]) });
const S = (rank, rarity) => ({ type: 'shield', rank, rarity, def: Math.round(CLOTH[rank] * RAR_K[rarity]) });
const H = (rank, rarity, helm = false) => ({ type: 'head', rank, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[rank] * (helm ? 0.6 : 0.4) * RAR_K[rarity]) });
const C = (rank, rarity) => ({ type: 'acc', rank, rarity });
const RUIN = { src: 'ruin' };

// ───── ランク8「光」: ハネノの 店（★なし）─────
const SHOP = {
  // 武器
  light_sword: { name: '光の剣', type: 'weapon', rank: 8, cat: 'sword', atk: 72, price: 7800, desc: '雲の上の光をうちこんだ剣。まっすぐで、よく切れる。' },
  cloudcut_axe: { name: '雲切りのオノ', type: 'weapon', rank: 8, cat: 'axe', atk: 81, bonus: { agi: -3 }, price: 8300, desc: '雲までまっぷたつにするという、大きなオノ。重いが、一撃がとても強い。' },
  feather_dagger: { name: '羽の短剣', type: 'weapon', rank: 8, cat: 'dagger', atk: 52, bonus: { agi: 7 }, price: 5800, desc: 'ハネビトの羽の形をした短剣。羽のように軽い。' },
  breeze_spear: { name: 'そよ風のやり', type: 'weapon', rank: 8, cat: 'spear', atk: 66, bonus: { agi: 2 }, price: 7200, desc: 'ふると、そよ風がふく白いやり。' },
  light_claw: { name: '光のツメ', type: 'weapon', rank: 8, cat: 'claw', atk: 65, bonus: { agi: 4 }, price: 7100, desc: '光をあびてかがやく、するどいツメ。' },
  rainbow_whip: { name: 'にじのムチ', type: 'weapon', rank: 8, cat: 'whip', atk: 61, price: 7000, desc: '雲の上にかかるにじの色をした、長いムチ。' },
  kumo_staff: { name: '雲のつえ', type: 'weapon', rank: 8, cat: 'staff', atk: 26, bonus: { mag: 32, heal: 18 }, price: 7000, desc: '先に小さな雲がうかぶつえ。呪文の力が上がる。' },
  wingbeat_fan: { name: '羽ばたきのおうぎ', type: 'weapon', rank: 8, cat: 'fan', atk: 47, bonus: { agi: 11 }, price: 6400, desc: 'ハネビトの羽でできたおうぎ。あおぐと体が軽くなる。' },
  light_boomerang: { name: '光のブーメラン', type: 'weapon', rank: 8, cat: 'boomerang', atk: 46, price: 7000, desc: '光のすじをえがいて飛ぶブーメラン。敵全体に当たる。' },
  thunderhead_bat: { name: '雷雲のバット', type: 'weapon', rank: 8, cat: 'bat', atk: 68, bonus: { agi: 2 }, price: 7000, desc: '雷雲の色をした、重いバット。打つとゴロゴロ鳴る。' },
  // 防具
  light_mail: { name: '光のよろい', type: 'armor', rank: 8, armorType: 'heavy', def: 66, bonus: { agi: -2 }, price: 8300, desc: '雲の上の光をうつす、白銀のよろい。' },
  cloud_mantle: { name: '雲のマント', type: 'armor', rank: 8, armorType: 'cloth', def: 39, bonus: { agi: 4 }, price: 6800, desc: '雲のようにふわふわのマント。だれでも装備できる。' },
  hanebito_robe: { name: 'ハネビトのローブ', type: 'armor', rank: 8, armorType: 'robe', def: 43, bonus: { mag: 11, heal: 9 }, price: 6800, desc: 'ハネビトが着る、白い羽もようのローブ。魔力が上がる。' },
  windcut_gi: { name: '風切りの道着', type: 'armor', rank: 8, armorType: 'gi', def: 47, bonus: { agi: 11 }, price: 6800, desc: '風を切って動ける道着。とても動きやすい。' },
  light_shield: { name: '光のたて', type: 'shield', rank: 8, def: 39, price: 6200, desc: '光をはね返す、まるいたて。' },
  light_helm: { name: '光のかぶと', type: 'head', rank: 8, helm: true, def: 24, price: 5000, desc: '光のかざりのついたかぶと。戦士などが装備できる。' },
  hanebito_hat: { name: 'ハネビトのぼうし', type: 'head', rank: 8, def: 16, bonus: { agi: 3 }, price: 3200, desc: '羽のかざりのついたぼうし。だれでも装備できる。' },
  // 道具
  kumo_wataame: {
    name: '雲のわたあめ', type: 'use', price: 60, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [100, 120], fixed: true },
    desc: 'ハネノの名物。雲のようにふわふわのあめ。HPを110ほど回復する。',
  },
  hanebito_salve: {
    name: 'ハネビトのぬり薬', type: 'use', price: 90, target: 'ally', battle: true, field: true,
    effect: { type: 'cure', statuses: ['poison', 'paralyze', 'sleep', 'confuse', 'blind'] },
    desc: 'ハネビトの羽の手当てに使うぬり薬。毒・マヒ・ねむり・混乱・マヌーサを治す。',
  },
};

// ───── 素材（雲の 魔物・神殿の 魔物が 落とす。れん金で 使う）─────
const MATS = {
  cloud_cotton: { name: '雲のわた', type: 'mat', price: 0, sell: 30, desc: '雲の上の魔物からとれる、ふわふわのわた。軽い装備の素材になる。' },
  land_shard: { name: '大地のかけら', type: 'mat', price: 0, sell: 40, desc: 'しずみゆく島の、大地の力がこもった石のかけら。' },
};

// ───── しずみゆく島の 古い神殿の 宝箱（そこだけの ★2〜★4）─────
const RUIN_GEAR = {
  // 1階（★2）
  hanebito_plume: { ...H(8, 2), ...RUIN, name: 'ハネビトの羽かざり', bonus: { agi: 6, mag: 4 }, resist: { wind: 0.8 }, desc: '昔のハネビトの、白い羽の頭かざり。だれでも装備でき、風に強い。' },
  // 2階（★2）
  griffin_claw: { ...W('claw', 8, 2), ...RUIN, name: 'グリフォンのツメ', bonus: { agi: 5 }, crit: 0.03, desc: '空をかけるグリフォンの、大きなツメ。会心が出やすい。' },
  vane_fan: { ...W('fan', 8, 2), ...RUIN, name: '風見どりのおうぎ', bonus: { agi: 8, mag: 4 }, resist: { wind: 0.8 }, desc: '風見どりの羽のおうぎ。風の向きがわかる。風に強い。' },
  // 3階（★3）
  icarus_wings: { ...C(8, 3), ...RUIN, name: 'イカロスのつばさ', bonus: { agi: 16, hp: 10 }, resist: { fire: 1.2, wind: 0.7 }, desc: '太陽まで飛ぼうとした少年のつばさ。とても素早くなり風に強いが、炎に少し弱い。' },
  // 4階（★3）
  atlas_shield: { ...S(8, 3), ...RUIN, name: 'アトラスのたて', bonus: { hp: 25 }, resist: { paralyze: 0.7 }, desc: '天をささえる大男の、大きな石のたて。HPが上がり、マヒしにくい。' },
  // 5階（★3）
  garuda_spear: { ...W('spear', 8, 3), ...RUIN, name: 'ガルーダのやり', bonus: { agi: 6 }, resist: { fire: 0.85 }, desc: '炎のつばさの神鳥ガルーダの、金のやり。炎に強い。' },
  gaia_robe: { ...A('robe', 8, 3), ...RUIN, name: '大地のローブ', bonus: { mag: 12, heal: 12, hp: 15 }, resist: { paralyze: 0.7 }, desc: '大地の女神のもようのローブ。魔力と回復の力が上がり、マヒしにくい。' },
  // 6階（★4）
  valkyrie_helm: { ...H(8, 4, true), ...RUIN, name: 'ワルキューレのかぶと', bonus: { str: 4, agi: 6 }, resist: { dark: 0.8 }, desc: '空をかける戦の女神のかぶと。力と素早さが上がり、闇に強い。' },
  raiun_staff: { ...W('staff', 8, 4), ...RUIN, name: '雷雲のつえ', bonus: { mag: 36, heal: 12 }, resist: { bolt: 0.8 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: '雷雲をよぶつえ。呪文の力がとても上がり、たたくとときどき敵がしびれる。' },
  // 7階（★4。いちばん 下）
  tenku_sword: { ...W('sword', 8, 4), ...RUIN, name: '天空の剣', bonus: { str: 4, agi: 4 }, resist: { dark: 0.8 }, desc: '空の勇者が使ったという、天空の剣。闇に強い。' },
  tenku_mail: { ...A('heavy', 8, 4), ...RUIN, name: '天空のよろい', bonus: { hp: 20 }, resist: { fire: 0.85, ice: 0.85, bolt: 0.85 }, desc: '空の勇者のよろい。炎・氷・雷に強い。' },
};

// ───── ガイアイーターの 品 ─────
const BOSS = {
  // かならず 落とす（1人 1つの アクセサリー。loot.js の drops.boss）
  gaia_fang_charm: {
    name: '大ムカデのキバのお守り', type: 'acc', rank: 8, unique: true, bonus: { atk: 8, def: 6, hp: 30 }, resist: { poison: 0.5, paralyze: 0.7 }, price: 0, sell: 1800,
    desc: 'ガイアイーターの大きなキバのお守り。力と守りとHPが上がり、毒とマヒにかかりにくい。',
  },
  // ちなんだ ★2（第32回の ボスの 品: 店の いちばん よい 品と おなじ 強さ ＋ とくせい 1つ）
  mukade_mail: { type: 'armor', armorType: 'heavy', rank: 8, rarity: 2, def: 66, src: 'boss', boss: 'gaia_eater', name: '大ムカデのよろい', bonus: { hp: 10 }, resist: { poison: 0.6 }, desc: 'ガイアイーターのかたいこうらでできたよろい。毒にかかりにくい。' },
};

// ───── 空の レア（雲の上の 魔物が まれに 落とす。region 6）─────
const SKY_RARE = {
  hayate_sword: { ...W('sword', 8, 3), atk: 72, src: 'region', region: 6, name: 'ハヤテの剣', bonus: { agi: 10 }, crit: 0.03, desc: '雲の上をふきぬける、はやての風の剣。素早さが上がり、会心が出やすい。' },
  nimbus_broom: { ...W('staff', 8, 3), src: 'region', region: 6, name: 'ニンバス2000', bonus: { mag: 30, agi: 12 }, resist: { wind: 0.8 }, desc: '空を飛ぶための、とても速いほうき。つえとして使え、素早さと魔力が上がる。' },
  wing_sandals: { ...C(8, 3), src: 'region', region: 6, name: 'つばさのサンダル', bonus: { agi: 14, def: 4 }, resist: { wind: 0.8 }, desc: '旅の神がはいていた、つばさのついたサンダル。風に強い。' },
};

// ───── れん金でしか 作れない ★（data/alchemy.js の KUMOI_RECIPES）─────
const ALCH = {
  kumo_hagoromo: { ...A('cloth', 8, 3), src: 'alchemy', name: '雲の羽衣', bonus: { agi: 6, mag: 6 }, resist: { wind: 0.8, sleep: 0.6 }, desc: '雲をつむいでおった羽衣。だれでも装備でき、風に強く、ねむりにくい。' },
  gaia_god_mail: { ...A('heavy', 8, 4), src: 'alchemy', name: '大地神のよろい', bonus: { hp: 30, def: 4 }, resist: { poison: 0.5, paralyze: 0.6 }, desc: '大ムカデのこうらを、大地のかけらできたえたよろい。毒とマヒに強い。' },
};

for (const it of [...Object.values(RUIN_GEAR), ...Object.values(SKY_RARE), ...Object.values(ALCH), BOSS.mukade_mail]) {
  it.price = 0;
  it.sell = Math.round(SELL[it.rank] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
for (const it of Object.values(SHOP)) if (['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type)) it.rarity = 0;

export const ITEMS_KUMOI = { ...SHOP, ...MATS, ...RUIN_GEAR, ...BOSS, ...SKY_RARE, ...ALCH };

// ハネノの 店の ならび（A が 店で 使う）
export const KUMOI_SHOP_WEAPONS = ['light_sword', 'cloudcut_axe', 'feather_dagger', 'breeze_spear', 'light_claw', 'rainbow_whip', 'kumo_staff', 'wingbeat_fan', 'light_boomerang', 'thunderhead_bat'];
export const KUMOI_SHOP_ARMOR = ['light_mail', 'cloud_mantle', 'hanebito_robe', 'windcut_gi', 'light_shield', 'light_helm', 'hanebito_hat'];
export const KUMOI_SHOP_TOOLS = ['herb', 'kumo_wataame', 'antidote', 'moonherb', 'hanebito_salve', 'moon_drop', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];

// 神殿の 各階の 宝箱の 中み（1階が 上、7階が いちばん 下。A が 宝箱で 使う）
export const RUIN_TREASURE = {
  1: ['hanebito_plume'],
  2: ['griffin_claw', 'vane_fan'],
  3: ['icarus_wings'],
  4: ['atlas_shield'],
  5: ['garuda_spear', 'gaia_robe'],
  6: ['valkyrie_helm', 'raiun_staff'],
  7: ['tenku_sword', 'tenku_mail'],
};

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5 … 第5章）
export const KUMOI_RECIPES = [
  { id: 'r_kumo_hagoromo', tier: 5, out: 'kumo_hagoromo', ins: ['little_prince_cape', 'cloud_cotton', 'cloud_cotton'] },
  { id: 'r_gaia_god', tier: 5, out: 'gaia_god_mail', ins: ['mukade_mail', 'land_shard', 'land_shard'] },
  // 第50回: 種（強さを 上げる 道具）は れん金で 作れない。おぼえた レシピの ID は そのまま、できる 物を かえた
  { id: 'r_life_seed', tier: 5, out: 'elf_drink', ins: ['land_shard', 'land_shard', 'cloud_cotton'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const KUMOI_ITEM_KANA = {
  light_sword: 'ひかりのけん', cloudcut_axe: 'くもきりのおの', feather_dagger: 'はねのたんけん', breeze_spear: 'そよかぜのやり', light_claw: 'ひかりのつめ',
  rainbow_whip: 'にじのむち', kumo_staff: 'くものつえ', wingbeat_fan: 'はばたきのおうぎ', light_boomerang: 'ひかりのぶーめらん', thunderhead_bat: 'らいうんのばっと',
  light_mail: 'ひかりのよろい', cloud_mantle: 'くものまんと', hanebito_robe: 'はねびとのろーぶ', windcut_gi: 'かぜきりのどうぎ', light_shield: 'ひかりのたて',
  light_helm: 'ひかりのかぶと', hanebito_hat: 'はねびとのぼうし', kumo_wataame: 'くものわたあめ', hanebito_salve: 'はねびとのぬりぐすり',
  cloud_cotton: 'くものわた', land_shard: 'だいちのかけら',
  hanebito_plume: 'はねびとのはねかざり', griffin_claw: 'ぐりふぉんのつめ', vane_fan: 'かざみどりのおうぎ', icarus_wings: 'いかろすのつばさ',
  atlas_shield: 'あとらすのたて', garuda_spear: 'がるーだのやり', gaia_robe: 'だいちのろーぶ', valkyrie_helm: 'わるきゅーれのかぶと',
  raiun_staff: 'らいうんのつえ', tenku_sword: 'てんくうのけん', tenku_mail: 'てんくうのよろい',
  gaia_fang_charm: 'おおむかでのきばのおまもり', mukade_mail: 'おおむかでのよろい',
  hayate_sword: 'はやてのけん', nimbus_broom: 'にんばすにせん', wing_sandals: 'つばさのさんだる',
  kumo_hagoromo: 'くものはごろも', gaia_god_mail: 'だいちしんのよろい',
};
