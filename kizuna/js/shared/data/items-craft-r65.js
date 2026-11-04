// 第65回 D1: かじ屋の「作る」ランク6〜10・れん金の 第6章（tier 6）・第7章（tier 7）の レシピ（items.js・forge.js・alchemy.js で まぜる）
//
// ・かじ屋で 作る 装備（forge: true・レア度 1）… その ころの 店の 品より 少し 強い（かけ算 FORGE_K）。宝箱や ボスの ★5 よりは 弱い
//   ランク6 … 第3章クリア（砂の国の 店の ころ）/ ランク7 … 水の都ドゥーナ（c4_duna）/ ランク8 … 第4章クリア（雲の上の町の ころ）/
//   ランク9 … 影の城が うかんだ あと（c5_castle）/ ランク10 … 千年前の 里（c6_past）/ ランク10（第7章）… カリムが 仲間に なった あと（c7_karim）
//   素材は その ころに 出る 魔物が 落とす 物（素材の 入手先の 画面〈item-sources.js〉で 出る 場所が わかる）
// ・れん金でしか 作れない 品（src: 'alchemy'）・よく効く 道具 … 第6章（時の砂・古い歯車）・第7章（緑の王国の 店の 品・魔法の聖水・上薬草）
// バランス: 作って すぐ 売っても もうからない（売り値は ★の 品の きまりと おなじ 式。test/craft-trial-r65.test.js）

// 強さの めやす（items-past.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];

// かじ屋の 装備の かけ算（店の 品は 1。第7章の 店は 1.06・第6章の 宝箱は 1.5 くらい・第7章の 宝箱は 1.55〜1.62）
export const FORGE_K = { 6: 1.1, 7: 1.08, 8: 1.1, 9: 1.12, 10: 1.3, c7: 1.42 };
const FW = (rank, cat, k) => ({ type: 'weapon', cat, rank, forge: true, atk: Math.round(SWORD[rank] * CAT_K[cat] * k) });
const FA = (rank, armorType, k) => ({ type: 'armor', armorType, rank, forge: true, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * k) });
const FS = (rank, k) => ({ type: 'shield', rank, forge: true, def: Math.round(CLOTH[rank] * k) });
const FH = (rank, helm, k) => ({ type: 'head', rank, forge: true, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[rank] * (helm ? 0.6 : 0.4) * k) });
const K = FORGE_K;

const FORGE_GEAR = {
  // ───── ランク6（第3章クリア。炎の石・氷のかけら）─────
  f6_flame_spear: { ...FW(6, 'spear', 1.08), name: '火炎のやり', bonus: { str: 3 }, resist: { fire: 0.85 }, desc: '炎の石をとかして、やりの先にまぜた。炎に少し強い。' },
  f6_frost_claw: { ...FW(6, 'claw', K[6]), name: '氷河のツメ', bonus: { agi: 5 }, resist: { ice: 0.85 }, desc: '氷のかけらをきたえこんだツメ。ひんやり光る。氷に少し強い。' },
  f6_magma_mail: { ...FA(6, 'heavy', K[6]), name: 'マグマのよろい', bonus: { agi: -1 }, resist: { fire: 0.8 }, desc: '炎の石と鉄をかさねた、赤黒いよろい。炎に強い。' },
  f6_snow_shield: { ...FS(6, 1), name: '雪の花のたて', bonus: { hp: 8 }, resist: { ice: 0.8 }, desc: '氷のかけらで、雪の花のもようをえがいたたて。HPが少し上がる。氷に強い。' },
  // ───── ランク7（水の都ドゥーナ。貝がら・竜のうろこ）─────
  f7_pearl_fan: { ...FW(7, 'fan', K[7]), name: 'しんじゅのおうぎ', bonus: { agi: 4, mag: 4 }, desc: '白い貝がらをみがいて、ならべたおうぎ。' },
  f7_coral_staff: { ...FW(7, 'staff', K[7]), name: 'さんごのつえ', bonus: { mag: 29, heal: 16 }, desc: 'きれいな貝がらと魔法の粉で作った、ピンク色のつえ。' },
  f7_scale_gi: { ...FA(7, 'gi', K[7]), name: '竜うろこの道着', bonus: { agi: 4 }, resist: { fire: 0.85 }, upMat: 'dragon_scale', desc: '竜のうろこを、えりとそでにぬいつけた道着。炎に少し強い。' },
  f7_tide_helm: { ...FH(7, true, 1.1), name: 'しおさいのかぶと', bonus: { hp: 10 }, resist: { ice: 0.85 }, desc: '貝がらでかざったかぶと。耳をすますと、波の音がする。' },
  // ───── ランク8（第4章クリア。雲のわた・大地のかけら・星の砂）─────
  f8_cloud_sword: { ...FW(8, 'sword', K[8]), name: '雲切りの剣', bonus: { agi: 4 }, desc: '雲のわたでみがいた、うすくて軽い剣。' },
  f8_land_axe: { ...FW(8, 'axe', 1.11), name: '大地のかけらのオノ', bonus: { str: 4 }, desc: '大地のかけらをオノの先にした、ずっしり重いオノ。' },
  f8_cloud_robe: { ...FA(8, 'robe', K[8]), name: '雲のわたのローブ', bonus: { mag: 8, heal: 4 }, desc: '雲のわたをつむいだ、ふわふわのローブ。' },
  f8_star_hat: { ...FH(8, false, 1.16), name: '星の砂のぼうし', bonus: { mag: 6, agi: 4 }, resist: { confuse: 0.8 }, desc: '星の砂をちりばめたぼうし。混乱しにくい。' },
  // ───── ランク9（影の城が うかんだ あと。大地の根・大地の光石・影のしずく）─────
  f9_root_spear: { ...FW(9, 'spear', K[9]), name: '大地の根のやり', bonus: { str: 4, hp: 10 }, desc: '大地の根を持つ所にまきつけた、しなやかなやり。' },
  f9_shade_whip: { ...FW(9, 'whip', K[9]), name: '影のしずくのムチ', bonus: { agi: 6 }, resist: { dark: 0.85 }, desc: '影のしずくをしみこませた、黒いムチ。闇に少し強い。' },
  f9_stone_mail: { ...FA(9, 'heavy', K[9]), name: '大地の光石のよろい', bonus: { hp: 15, agi: -2 }, resist: { bolt: 0.85 }, desc: '大地の光石をうめこんだよろい。雷に少し強い。' },
  f9_root_shield: { ...FS(9, K[9]), name: '大地の根のたて', bonus: { hp: 10 }, desc: '大地の根をあんで、光石でとめたたて。' },
  // ───── ランク10（千年前の 里。時の砂・古い歯車）─────
  f10_sand_dagger: { ...FW(10, 'dagger', K[10]), name: '時の砂の短剣', bonus: { agi: 8 }, desc: '時の砂をまぜてきたえた短剣。ふると、砂がさらさら光る。' },
  f10_gear_boomerang: { ...FW(10, 'boomerang', K[10]), name: '歯車のブーメラン', bonus: { agi: 6, str: 4 }, desc: '古い歯車を組み合わせたブーメラン。くるくる回ってもどってくる。' },
  f10_sand_mantle: { ...FA(10, 'cloth', K[10]), name: '砂時計のマント', bonus: { agi: 8, hp: 15 }, desc: '時の砂の色にそめたマント。だれでも装備できる。' },
  f10_gear_helm: { ...FH(10, true, K[10]), name: '歯車のかぶと', bonus: { hp: 15 }, desc: '古い歯車をならべて作ったかぶと。' },
  // ───── ランク10・第7章（カリムが 仲間に なった あと。古い歯車・時の砂・竜のうろこ・魔法の聖水）─────
  f10k_river_sword: { ...FW(10, 'sword', K.c7), name: '川波の剣', bonus: { str: 8, agi: 6 }, resist: { ice: 0.85 }, desc: '緑の王国の川の水で冷やしてきたえた剣。剣に波のもようがうかぶ。氷に少し強い。' },
  f10k_lake_staff: { ...FW(10, 'staff', K.c7), name: '湖のしずくのつえ', bonus: { mag: 28, heal: 18 }, resist: { ice: 0.85 }, desc: '魔法の聖水をとじこめた、青いつえ。氷に少し強い。' },
  f10k_wind_gi: { ...FA(10, 'gi', K.c7), name: 'みどりの風の道着', bonus: { str: 6, agi: 8 }, desc: '森の風のように軽い道着。時の砂の糸でぬってある。' },
  f10k_river_mail: { ...FA(10, 'heavy', K.c7), name: '川の守りのよろい', bonus: { hp: 20, agi: -2 }, resist: { ice: 0.85 }, upMat: 'dragon_scale', desc: '竜のうろこと古い歯車で作った、王国の水門の守り手のよろい。氷に少し強い。' },
  f10k_river_shield: { ...FS(10, K.c7), name: '川石のたて', bonus: { hp: 20 }, resist: { ice: 0.85, bolt: 0.9 }, desc: '川の青い石と黒しんじゅをはめこんだたて。氷に少し強い。' },
};
// 売り値（★の 品と おなじ 式。レア度 1）・店では 売っていない
for (const it of Object.values(FORGE_GEAR)) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * 0.85 / 10) * 10;
}

// かじ屋の レシピ（data/forge.js の RECIPES に まぜる。ランク10 の 第7章の 品は open で 作れる ころを きめる）
export const FORGE_R65_OPEN = { 6: 'c3_clear', 7: 'c4_duna', 8: 'c4_clear', 9: 'c5_castle', 10: 'c6_past' };
export const FORGE_R65_C7 = 'c7_karim';
export const FORGE_R65_RECIPES = [
  // ランク6
  { id: 'f6_flame_spear', gold: 2800, mats: [['flame_stone', 5], ['iron_shard', 6], ['silver_shard', 2]] },
  { id: 'f6_frost_claw', gold: 2600, mats: [['ice_crystal', 5], ['beast_fang', 8], ['silver_shard', 2]] },
  { id: 'f6_magma_mail', gold: 3200, mats: [['flame_stone', 6], ['iron_shard', 8], ['silver_shard', 3]] },
  { id: 'f6_snow_shield', gold: 2400, mats: [['ice_crystal', 6], ['silver_shard', 2]] },
  // ランク7
  { id: 'f7_pearl_fan', gold: 4200, mats: [['pretty_shell', 8], ['wind_feather', 6], ['silver_shard', 2]] },
  { id: 'f7_coral_staff', gold: 4600, mats: [['pretty_shell', 6], ['magic_powder', 8], ['silver_shard', 2]] },
  { id: 'f7_scale_gi', gold: 4400, mats: [['dragon_scale', 4], ['beast_fang', 8], ['silver_shard', 2]] },
  { id: 'f7_tide_helm', gold: 3600, mats: [['pretty_shell', 5], ['iron_shard', 6], ['dragon_scale', 2]] },
  // ランク8
  { id: 'f8_cloud_sword', gold: 6000, mats: [['cloud_cotton', 6], ['silver_shard', 4], ['iron_shard', 8]] },
  { id: 'f8_land_axe', gold: 6400, mats: [['land_shard', 6], ['iron_shard', 8], ['silver_shard', 3]] },
  { id: 'f8_cloud_robe', gold: 5600, mats: [['cloud_cotton', 8], ['magic_powder', 6], ['star_sand', 2]] },
  { id: 'f8_star_hat', gold: 4200, mats: [['star_sand', 5], ['cloud_cotton', 3]] },
  // ランク9
  { id: 'f9_root_spear', gold: 8000, mats: [['earth_root', 5], ['silver_shard', 4], ['iron_shard', 8]] },
  { id: 'f9_shade_whip', gold: 7600, mats: [['shade_drop', 6], ['beast_fang', 10], ['silver_shard', 3]] },
  { id: 'f9_stone_mail', gold: 8800, mats: [['earth_stone', 6], ['iron_shard', 10], ['silver_shard', 4]] },
  { id: 'f9_root_shield', gold: 7000, mats: [['earth_root', 4], ['earth_stone', 3], ['silver_shard', 2]] },
  // ランク10（第6章）
  { id: 'f10_sand_dagger', gold: 10000, mats: [['p6_time_sand', 6], ['silver_shard', 4], ['iron_shard', 8]] },
  { id: 'f10_gear_boomerang', gold: 9600, mats: [['p6_old_gear', 6], ['wind_feather', 8], ['silver_shard', 3]] },
  { id: 'f10_sand_mantle', gold: 9400, mats: [['p6_time_sand', 5], ['wind_feather', 6], ['star_shard', 2]] },
  { id: 'f10_gear_helm', gold: 8800, mats: [['p6_old_gear', 5], ['iron_shard', 10], ['silver_shard', 3]] },
  // ランク10（第7章）
  { id: 'f10k_river_sword', gold: 14000, mats: [['p6_old_gear', 8], ['p6_time_sand', 4], ['dragon_scale', 4], ['star_shard', 3]], open: FORGE_R65_C7 },
  { id: 'f10k_lake_staff', gold: 13000, mats: [['p6_time_sand', 8], ['magic_water', 2], ['star_shard', 3]], open: FORGE_R65_C7 },
  { id: 'f10k_wind_gi', gold: 12500, mats: [['p6_time_sand', 6], ['beast_fang', 12], ['star_shard', 2]], open: FORGE_R65_C7 },
  { id: 'f10k_river_mail', gold: 14500, mats: [['p6_old_gear', 8], ['iron_shard', 12], ['dragon_scale', 4]], open: FORGE_R65_C7 },
  { id: 'f10k_river_shield', gold: 12000, mats: [['p6_old_gear', 6], ['cs_black_pearl', 3], ['silver_shard', 4]], open: FORGE_R65_C7 },
];

// ───── れん金 ─────
const R10 = 10;
const AW = (cat, k) => ({ type: 'weapon', cat, rank: R10, rarity: 4, src: 'alchemy', atk: Math.round(SWORD[R10] * CAT_K[cat] * RAR_K[4] * k) });
const AA = (armorType, k) => ({ type: 'armor', armorType, rank: R10, rarity: 4, src: 'alchemy', def: Math.round(CLOTH[R10] * ARMOR_K[armorType] * RAR_K[4] * k) });
const AC = () => ({ type: 'acc', rank: R10, rarity: 4, src: 'alchemy' });
const ALCH_GEAR = {
  // 第6章: 千年前の 里の 店の おうぎ ＋ 古い歯車 ＋ 時の砂（第6章の 宝箱の おうぎより 少し 弱い。風に 強い）
  a6_wind_fan: { ...AW('fan', 1.44), name: '時の風のおうぎ', bonus: { agi: 12, mag: 10 }, resist: { wind: 0.8, sleep: 0.7 }, desc: '千年前のおうぎに、時の砂の風をとじこめた。あおぐと、時がゆっくり流れる気がする。風に強く、ねむりにくい。' },
  a6_sand_charm: { ...AC(), name: '砂時計のお守り', bonus: { hp: 36, agi: 12, mag: 8 }, resist: { sleep: 0.6, paralyze: 0.7 }, desc: '小さな砂時計のお守り。だれでも装備できる。ねむり・マヒにかかりにくい。' },
  // 第7章: 緑の王国の 店の 品 ＋ 古い歯車 ＋ 魔法の聖水（第7章の 宝箱より 少し 弱い。とくせい つき）
  a7_crest_dagger: { ...AW('dagger', 1.55), name: '水の紋章の短剣', bonus: { agi: 14, str: 6 }, onHit: { status: 'sleep', chance: 0.12 }, desc: '川石の短剣に、王国の水の紋章をきざんだ。ときどき敵をねむらせる。' },
  a7_gate_mail: { ...AA('heavy', 1.57), name: '水門の守りのよろい', bonus: { hp: 40, agi: -2 }, resist: { ice: 0.75, bolt: 0.8 }, desc: '王国の騎士のよろいを、古い歯車で強くした。水門を守る騎士の、いちばんのよろい。氷に強く、雷に少し強い。' },
  a7_lotus_brooch: { ...AC(), name: 'はすの花のブローチ', bonus: { hp: 40, mag: 12, heal: 12, agi: 6 }, resist: { silence: 0.6, ice: 0.85 }, desc: '湖にさく、はすの花の形のブローチ。だれでも装備できる。マホトーンにかかりにくい。' },
};
for (const it of Object.values(ALCH_GEAR)) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
// 素材だけで 作る アクセサリーは 安く しか 売れない（作って 売ると もうかる のを ふせぐ。材料の 売り値の 1.6倍 まで）
ALCH_GEAR.a6_sand_charm.sell = 240;
ALCH_GEAR.a7_lotus_brooch.sell = 250;
// よく効く 道具（れん金でしか 作れない。店では 売っていない）
const ALCH_USE = {
  a6_time_potion: {
    name: '時の秘薬', type: 'use', price: 0, sell: 300, target: 'ally', battle: true, field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [300, 330], fixed: true }, { type: 'mpHeal', base: [60, 70] }] },
    desc: '時の砂をとかした、ひみつの薬。1人のHPを300ほど、MPを60ほど回復する。',
  },
  a6_gear_bell: {
    name: '歯車のいやしのかね', type: 'use', price: 0, sell: 330, target: 'allies', battle: true, field: false,
    effect: { type: 'heal', base: [200, 220], fixed: true },
    desc: '古い歯車でできた、小さなかね。戦いの中で鳴らすと、全員のHPを200ほど回復する。',
  },
  a6_rewind_flower: {
    name: '時もどしの花', type: 'use', price: 0, sell: 420, target: 'deadAlly', battle: true, field: true,
    effect: { type: 'revive', hpRatio: 1 },
    desc: '時の砂をあびた、よみがえりの花。死んでしまった仲間を、HPまんたんで生き返らせる。',
  },
  a7_lake_drop: {
    name: '森と湖のしずく', type: 'use', price: 0, sell: 250, target: 'ally', battle: true, field: true,
    effect: { type: 'multi', parts: [{ type: 'heal', base: [450, 480], fixed: true }, { type: 'mpHeal', base: [100, 110] }] },
    desc: '緑の王国の森と湖のめぐみを、1つぶにした。1人のHPを450ほど、MPを100ほど回復する。',
  },
  a7_temple_bell: {
    name: '水の神殿のすず', type: 'use', price: 0, sell: 150, target: 'allies', battle: true, field: false,
    effect: { type: 'heal', base: [320, 350], fixed: true },
    desc: '水の神殿でつかわれていた、すんだ音のすず。戦いの中で鳴らすと、全員のHPを320ほど回復する。',
  },
};

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 6 … 第6章〈c6_start〉・tier 7 … 第7章〈c7_start〉）
export const ALCH_R65_TIER_FLAG = { 6: 'c6_start', 7: 'c7_start' };
export const ALCH_R65_RECIPES = [
  // ── 第6章 ──
  { id: 'r_c6_time_potion', tier: 6, out: 'a6_time_potion', ins: ['toku_herb', 'elf_drink', 'p6_time_sand'] },
  { id: 'r_c6_gear_bell', tier: 6, out: 'a6_gear_bell', ins: ['p6_honey', 'p6_old_gear', 'p6_old_gear'] },
  { id: 'r_c6_rewind_flower', tier: 6, out: 'a6_rewind_flower', ins: ['revive_flower', 'p6_time_sand', 'p6_time_sand'] },
  { id: 'r_c6_sand_charm', tier: 6, out: 'a6_sand_charm', ins: ['p6_time_sand', 'p6_old_gear', 'star_shard'] },
  { id: 'r_c6_wind_fan', tier: 6, out: 'a6_wind_fan', ins: ['p6_kodai_fan', 'p6_old_gear', 'p6_time_sand'] },
  // ── 第7章 ──
  { id: 'r_c7_lake_drop', tier: 7, out: 'a7_lake_drop', ins: ['magic_water', 'magic_water', 'toku_herb'] },
  { id: 'r_c7_temple_bell', tier: 7, out: 'a7_temple_bell', ins: ['jou_herb', 'jou_herb', 'magic_water'] },
  { id: 'r_c7_crest_dagger', tier: 7, out: 'a7_crest_dagger', ins: ['c7_kingdom_dagger', 'p6_old_gear', 'magic_water'] },
  { id: 'r_c7_gate_mail', tier: 7, out: 'a7_gate_mail', ins: ['c7_kingdom_mail', 'p6_old_gear', 'p6_old_gear'] },
  { id: 'r_c7_lotus_brooch', tier: 7, out: 'a7_lotus_brooch', ins: ['p6_time_sand', 'magic_water', 'jou_herb'] },
];
// かじ屋の 親方が 教えて くれる（ルミナの町の 親方。data/alchemy.js の KEEPER_RECIPES.town に たす）
export const ALCH_R65_KEEPER = ['r_c6_time_potion', 'r_c6_wind_fan', 'r_c7_lake_drop', 'r_c7_crest_dagger'];

export const ITEMS_CRAFT_R65 = { ...FORGE_GEAR, ...ALCH_GEAR, ...ALCH_USE };

// 読みがな（あいうえお順の ならびかえ）
export const CRAFT_R65_KANA = {
  f6_flame_spear: 'かえんのやり', f6_frost_claw: 'ひょうがのつめ', f6_magma_mail: 'まぐまのよろい', f6_snow_shield: 'ゆきのはなのたて',
  f7_pearl_fan: 'しんじゅのおうぎ', f7_coral_staff: 'さんごのつえ', f7_scale_gi: 'りゅううろこのどうぎ', f7_tide_helm: 'しおさいのかぶと',
  f8_cloud_sword: 'くもきりのけん', f8_land_axe: 'だいちのかけらのおの', f8_cloud_robe: 'くものわたのろーぶ', f8_star_hat: 'ほしのすなのぼうし',
  f9_root_spear: 'だいちのねのやり', f9_shade_whip: 'かげのしずくのむち', f9_stone_mail: 'だいちのこうせきのよろい', f9_root_shield: 'だいちのねのたて',
  f10_sand_dagger: 'ときのすなのたんけん', f10_gear_boomerang: 'はぐるまのぶーめらん', f10_sand_mantle: 'すなどけいのまんと', f10_gear_helm: 'はぐるまのかぶと',
  f10k_river_sword: 'かわなみのけん', f10k_lake_staff: 'みずうみのしずくのつえ', f10k_wind_gi: 'みどりのかぜのどうぎ', f10k_river_mail: 'かわのまもりのよろい',
  f10k_river_shield: 'かわいしのたて',
  a6_wind_fan: 'ときのかぜのおうぎ', a6_sand_charm: 'すなどけいのおまもり', a7_crest_dagger: 'みずのもんしょうのたんけん', a7_gate_mail: 'すいもんのまもりのよろい',
  a7_lotus_brooch: 'はすのはなのぶろーち',
  a6_time_potion: 'ときのひやく', a6_gear_bell: 'はぐるまのいやしのかね', a6_rewind_flower: 'ときもどしのはな', a7_lake_drop: 'もりとみずうみのしずく',
  a7_temple_bell: 'みずのしんでんのすず',
};
