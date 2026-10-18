// 第5章 Step 6・7「根の島」と「大地の神殿」と「みんなが集まる」の 品（B: 品。items.js で まぜる。A が 店・宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch5.md の 16）: HANONO9_SHOP_WEAPONS・HANONO9_SHOP_ARMOR・HANONO9_SHOP_TOOLS（影の城の あとの ハネノの 店の ならび）・
//   EARTH_TREASURE（神殿の 各階の 宝箱）・GATHER_GIFTS（みんなが くれる ★5の 品。{ nefi, sara, barga, mira }）
//
// ・★の きまり（第35回・docs/plan-ch5.md の 16。家族:「★5が MAX。★5の 中で 強いのを 今後 出していく。強さの 上限なし」）:
//   店の 品は いつも ★1。店では 買えない 品は ランクで ★（ランク8 ★4・9〜10 ★5。10より 上も ★5）。めずらしさは 名前の 色（レア度）
// ・ハネノの 店（ランク9）: 店の 品（レア度 0）なので ★1・きたえられない。強さは ランク9の めやす（星読みの里の 店の 約1.09倍）
//   武器は 今の 職業の 10しゅるい（剣・オノ・短剣・やり・ツメ・ムチ・つえ・おうぎ・ブーメラン・バット）を そろえた
// ・神殿の 宝箱（EARTH_TREASURE）: そこだけの 品（根・土の守り手・地下水・大地の こどう・大地の心に ちなむ）。
//   1〜3階 ランク8＝★4・4〜6階 ランク9＝★5・7〜8階 ランク10＝★5。深い 階ほど 強い（名前の 色も 青 → 紫 → オレンジ）。同じ ランクの 店の 品より 強い
// ・ノクト（1回目）: かならず 落とす ★5 2つ（大地のかけらのお守り〈1人 1つ・ボス級「天空のきょ兵」の 配合の 素材〉と、ちなんだ 品の 黒い星のマント〈src: 'boss'〉）と、
//   まれに ノクトの紋章（★5）
// ・みんなが くれる 品（GATHER_GIFTS）: ランク10 の ★5。ノクトの 品より 強い。それぞれの 章（第4章）に ちなむ
// ・れん金（EARTH_RECIPES。data/alchemy.js が まぜる）: この 章の 素材（大地の根・大地の光石）で ★4 → ★5
// 強さの めやす（items-kumoi.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
// k … 強さの 上のせ（宝箱は 深い 階ほど 大きい）
const W = (cat, rank, rarity, k = 1) => ({ type: 'weapon', cat, rank, rarity, atk: Math.round(SWORD[rank] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rank, rarity, k = 1) => ({ type: 'armor', armorType, rank, rarity, def: Math.round(CLOTH[rank] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rank, rarity, k = 1) => ({ type: 'shield', rank, rarity, def: Math.round(CLOTH[rank] * RAR_K[rarity] * k) });
const H = (rank, rarity, helm = false, k = 1) => ({ type: 'head', rank, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[rank] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rank, rarity) => ({ type: 'acc', rank, rarity });

// ───── ハネノの 店（ランク9。影の城が うかんだ あと・★1）─────
const SHOP = {
  // 武器
  akatsuki_sword: { ...W('sword', 9, 0), name: 'あかつきの剣', price: 10600, desc: '夜明けの空の色をした剣。最後の戦いにそなえて、ハネノのかじ屋が打った。' },
  daichi_axe: { ...W('axe', 9, 0), name: '大地わりのオノ', bonus: { agi: -3 }, price: 11200, desc: '大地もわれるという、とても重いオノ。一撃がとても強い。' },
  hoshikaze_dagger: { ...W('dagger', 9, 0), name: '星風の短剣', bonus: { agi: 9 }, price: 7900, desc: '星の風のように軽い短剣。すばやく動ける。' },
  hoshimori_spear: { ...W('spear', 9, 0), name: '星守りのやり', bonus: { agi: 2 }, price: 9800, desc: '守り星を守る人たちのやり。まっすぐで、よくとどく。' },
  hayabusa_claw: { ...W('claw', 9, 0), name: 'はやぶさのツメ', bonus: { agi: 5 }, price: 9600, desc: '空をかけるはやぶさのような、するどいツメ。' },
  kizuna_whip: { ...W('whip', 9, 0), name: 'きずなのムチ', price: 9500, desc: 'ハネビトたちが、思いをこめてあんだ長いムチ。' },
  shiraha_staff: { ...W('staff', 9, 0), name: '白羽のつえ', bonus: { mag: 38, heal: 22 }, price: 9500, desc: 'ハネビトの白い羽をかざったつえ。呪文の力が上がる。' },
  amanoha_fan: { ...W('fan', 9, 0), name: '天の羽のおうぎ', bonus: { agi: 13 }, price: 8700, desc: '空の上の羽でできた、軽いおうぎ。体が軽くなる。' },
  nagaregumo_boomerang: { ...W('boomerang', 9, 0), name: '流れ雲のブーメラン', price: 9500, desc: '流れる雲のように、空をすべって飛ぶブーメラン。敵全体に当たる。' },
  akatsuki_bat: { ...W('bat', 9, 0), name: 'あかつきのバット', bonus: { agi: 2 }, price: 9500, desc: '夜明けの光でみがいた、重いバット。カキーンと、よくひびく。' },
  // 防具
  akatsuki_mail: { ...A('heavy', 9, 0), name: 'あかつきのよろい', bonus: { agi: -2 }, price: 11200, desc: '夜明けの空の色をした、重いよろい。' },
  shiraha_mantle: { ...A('cloth', 9, 0), name: '白羽のマント', bonus: { agi: 4 }, price: 9100, desc: 'ハネビトの白い羽をおりこんだマント。だれでも装備できる。' },
  hoshimori_robe: { ...A('robe', 9, 0), name: '星守りのローブ', bonus: { mag: 13, heal: 11 }, price: 9100, desc: '守り星を守る人たちのローブ。魔力が上がる。' },
  hayabusa_gi: { ...A('gi', 9, 0), name: 'はやぶさの道着', bonus: { agi: 13 }, price: 9100, desc: 'はやぶさのように動ける道着。とても動きやすい。' },
  akatsuki_shield: { ...S(9, 0), name: 'あかつきのたて', price: 8300, desc: '夜明けの光をうつす、まるいたて。' },
  akatsuki_helm: { ...H(9, 0, true), name: 'あかつきのかぶと', price: 6800, desc: '夜明けの色のかざりのついたかぶと。戦士などが装備できる。' },
  shiraha_hat: { ...H(9, 0), name: '白羽のぼうし', bonus: { agi: 3 }, price: 4300, desc: '白い羽のかざりのついたぼうし。だれでも装備できる。' },
};

// ───── 素材（根の島・大地の神殿の 魔物が 落とす。れん金で 使う）─────
//   名前の 約束の earth_shard は もう 大事な物（大地の守り星のかけら。data/sky.js）、「大地のかけら」は land_shard（items-kumoi.js）なので、
//   2つめの 素材は earth_stone（大地の光石）
const MATS = {
  earth_root: { name: '大地の根', type: 'mat', price: 0, sell: 50, desc: '大地の神殿の、大きな木の根の切れはし。根っこのこびとが、だいじに持っている。' },
  earth_stone: { name: '大地の光石', type: 'mat', price: 0, sell: 55, desc: '大地の神殿のおくでとれる、ぼんやり光る石。大地の力がこもっている。' },
};

// ───── 大地の神殿の 宝箱（そこだけの 品）─────
// 1〜3階 ランク8（★4・青 → 紫）/ 4〜6階 ランク9（★5・紫 → オレンジ）/ 7〜8階 ランク10（★5・オレンジ）。k … 深い 階ほど 大きい
const EARTH = { src: 'earth' };
const TREASURE = {
  // 1階（根のげんかん）
  et_root_bangle: { ...C(8, 2), ...EARTH, name: '根のうでわ', bonus: { hp: 24, def: 6, agi: 4 }, resist: { poison: 0.7 }, desc: '木の根をあんで作ったうでわ。だれでも装備でき、HPと守りが上がり、毒にかかりにくい。' },
  // 2階（根の道を 2本 つなぐ）
  et_moss_claw: { ...W('claw', 8, 2, 1.12), ...EARTH, name: 'こけむしたツメ', bonus: { agi: 5 }, resist: { poison: 0.8 }, desc: 'こけにおおわれた、古いけもののツメ。毒にかかりにくい。' },
  et_root_whip: { ...W('whip', 8, 2, 1.12), ...EARTH, name: '根のムチ', bonus: { agi: 3 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: 'しなやかな木の根のムチ。からみついて、ときどき敵を動けなくする。' },
  // 3階（土の守り手）
  et_keeper_shield: { ...S(8, 3, 1.14), ...EARTH, name: '守り手のたて', bonus: { hp: 20 }, resist: { blast: 0.8 }, desc: '土の守り手の、石の手のひらのようなたて。爆発に強い。' },
  et_spring_robe: { ...A('robe', 8, 3, 1.14), ...EARTH, name: '地下水のローブ', bonus: { mag: 14, heal: 14 }, resist: { fire: 0.85, ice: 0.85 }, desc: '地下水のように青くすきとおったローブ。炎と氷に少し強い。' },
  // 4階（2組に 分かれる 道）
  et_keeper_axe: { ...W('axe', 9, 3, 1.06), ...EARTH, name: '守り手のオノ', bonus: { str: 6, agi: -2 }, resist: { blast: 0.85 }, desc: '土の守り手がかかえていた、石の大きなオノ。爆発に少し強い。' },
  et_tree_hat: { ...H(9, 3, false, 1.06), ...EARTH, name: '大樹のぼうし', bonus: { hp: 16, agi: 4 }, resist: { sleep: 0.6 }, desc: '大きな木の葉をあんだぼうし。だれでも装備でき、ねむりにくい。' },
  // 5階（大地のいずみ）
  et_spring_staff: { ...W('staff', 9, 3, 1.08), ...EARTH, name: '大地のいずみのつえ', bonus: { mag: 44, heal: 26 }, mpRegen: 1, desc: '大地のいずみの水をすったつえ。行動するたびに、MPが少し回復する。' },
  et_earth_gi: { ...A('gi', 9, 3, 1.08), ...EARTH, name: '大地の道着', bonus: { agi: 12, str: 4 }, resist: { paralyze: 0.6 }, desc: '大地をふみしめて戦う人の道着。マヒしにくい。' },
  // 6階（根の道 × ゴーレム）
  et_bedrock_mail: { ...A('heavy', 9, 4, 1.1), ...EARTH, name: '岩ばんのよろい', bonus: { hp: 30, agi: -2 }, resist: { blast: 0.8, bolt: 0.85 }, desc: '大地の下の岩ばんをけずって作った、とても重いよろい。爆発と雷に強い。' },
  et_pulse_bat: { ...W('bat', 9, 4, 1.1), ...EARTH, name: 'こどうのバット', bonus: { agi: 3 }, crit: 0.05, desc: '大地のこどうのように、どくんとひびくバット。会心が出やすい。' },
  // 7階（大地のこどう）
  et_heart_spear: { ...W('spear', 10, 4, 1.06), ...EARTH, name: '大地の心のやり', bonus: { agi: 6, str: 4 }, resist: { dark: 0.8 }, desc: '大地の心の、あかね色の光をこめたやり。闇に強い。' },
  et_akane_fan: { ...W('fan', 10, 4, 1.06), ...EARTH, name: 'あかね色のおうぎ', bonus: { agi: 14, mag: 8 }, resist: { fire: 0.8 }, desc: '大地の心の色にそまったおうぎ。炎に強い。' },
  // 8階（大地の守り星の 祭だん）
  et_earth_sword: { ...W('sword', 10, 4, 1.08), ...EARTH, name: '大地の剣', bonus: { str: 8, agi: 4 }, resist: { blast: 0.8, dark: 0.85 }, desc: '大地の守り星の祭だんにねむっていた剣。爆発と闇に強い。' },
  et_earth_crown: { ...H(10, 4, false, 1.08), ...EARTH, name: '大地のかんむり', bonus: { hp: 20, mag: 8, agi: 6 }, resist: { confuse: 0.5, sleep: 0.6 }, desc: '大地の神殿の、古い王のかんむり。だれでも装備でき、混乱とねむりに強い。' },
};

// ───── ノクト（1回目）の 品 ─────
const BOSS = {
  // かならず 落とす（1人 1つの アクセサリー。loot.js の drops.boss。ランク9 なので ★5）。ボス級「天空のきょ兵」の 配合の 素材（data/monsters-boss.js）
  nocto_earth_charm: {
    name: '大地のかけらのお守り', type: 'acc', rank: 9, rarity: 3, unique: true, bonus: { hp: 36, mag: 10, agi: 8 }, resist: { dark: 0.6, blast: 0.8 }, price: 0, sell: 2800,
    desc: 'ノクトとの戦いのあと、祭だんにのこっていた、大地のかけらのお守り。HP・魔力・素早さが上がり、闇と爆発に強い。',
  },
  // ちなんだ 品（第32回の ボスの 品: 店の いちばん よい 品と おなじ 強さ ＋ とくせい 1つ。レア度 2。ランク9 なので ★5）
  nocto_star_cloak: { ...A('cloth', 9, 2), src: 'boss', boss: 'nocto_1', name: '黒い星のマント', bonus: { agi: 6 }, resist: { dark: 0.7 }, desc: 'ノクトの影がしみこんだような、黒い星もようのマント。だれでも装備でき、闇に強い。' },
  // まれに 落とす（ボスの 品とは べつ。monsters-earth.js の drops.rare）。ランク10 の ★5・オレンジ
  nocto_crest: {
    ...C(10, 4), src: 'bossrare', name: 'ノクトの紋章', bonus: { str: 10, mag: 10, agi: 8, hp: 20 }, resist: { dark: 0.6, confuse: 0.6 }, crit: 0.03,
    desc: 'ノクトの手の紋章と同じ形の、黒いブローチ。ふしぎと、あたたかい。力・魔力・素早さが上がり、闇と混乱に強い。',
  },
};

// ───── みんなが くれる 品（GATHER_GIFTS。ランク10 の ★5・ノクトの 品より 強い）─────
const GIFT = { src: 'gift' };
const GIFTS = {
  // 女王ネフィ（第4章・砂の国の 女王。月の鏡で 正気に もどった）: 王家の 守りの お守り
  gift_royal_charm: {
    ...C(10, 4), ...GIFT, name: '王家の守りのお守り', bonus: { hp: 50, def: 12, mag: 12, agi: 10 }, resist: { confuse: 0.5, dark: 0.7, light: 0.7 },
    desc: '砂の国の王家に伝わるお守り。女王ネフィが、友だちのしるしにくれた。だれでも装備でき、HP・守り・魔力・素早さが上がり、混乱と光と闇に強い。',
  },
  // サラ（第4章・砂の海賊の むすめ。すなかぜ号）: すなかぜ号の 旗の マント
  gift_sandwind_cape: {
    ...A('cloth', 10, 4, 1.14), ...GIFT, name: 'すなかぜ号の旗のマント', bonus: { agi: 12, hp: 24 }, resist: { wind: 0.7, fire: 0.8, blind: 0.6 },
    desc: '砂の船すなかぜ号の旗を、サラがマントにぬいなおした。だれでも装備でき、風と炎に強く、まぼろしにかかりにくい。',
  },
  // バルガ（第4章・砂の 海賊の かしら）: かしらの 大オノ
  gift_captain_axe: {
    ...W('axe', 10, 4, 1.14), ...GIFT, name: 'かしらの大オノ', bonus: { str: 12, agi: -2 }, crit: 0.06, resist: { fire: 0.85 },
    desc: '砂の海賊のかしらバルガが、長い間ふるってきた大オノ。会心が出やすく、炎に少し強い。',
  },
  // 水のみこミラ（第4章・サラの 母。いのりで 回復する）: 水のみこの つえ
  gift_miko_staff: {
    ...W('staff', 10, 4, 1.14), ...GIFT, name: '水のみこのつえ', bonus: { mag: 52, heal: 40 }, mpRegen: 2, resist: { ice: 0.8, sleep: 0.6 },
    desc: '水のみこミラが、いのりに使ってきたつえ。回復の力がとても上がり、行動するたびにMPが回復する。氷に強く、ねむりにくい。',
  },
};

// ───── れん金でしか 作れない 品（★4 → ★5。data/alchemy.js の EARTH_RECIPES）─────
const ALCH = {
  et_alch_sword: { ...W('sword', 9, 4, 1.1), src: 'alchemy', name: '大地と光の剣', bonus: { str: 8, agi: 4 }, resist: { light: 0.8, dark: 0.8, blast: 0.85 }, desc: '光と影の剣に、大地の根と光石の力をこめた剣。光と闇と爆発に強い。' },
  et_alch_mail: { ...A('heavy', 9, 4, 1.1), src: 'alchemy', name: '大地の月光よろい', bonus: { hp: 34 }, resist: { ice: 0.8, dark: 0.75, blast: 0.85 }, desc: '月光のよろいを、大地の光石できたえなおしたよろい。氷と闇と爆発に強い。' },
};

for (const it of [...Object.values(TREASURE), BOSS.nocto_star_cloak, BOSS.nocto_crest, ...Object.values(GIFTS), ...Object.values(ALCH)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_EARTH = { ...SHOP, ...MATS, ...TREASURE, ...BOSS, ...GIFTS, ...ALCH };

// ハネノの 店の ならび（ランク9。A が c5_castle の あとの 店で 使う）
export const HANONO9_SHOP_WEAPONS = ['akatsuki_sword', 'daichi_axe', 'hoshikaze_dagger', 'hoshimori_spear', 'hayabusa_claw', 'kizuna_whip', 'shiraha_staff', 'amanoha_fan', 'nagaregumo_boomerang', 'akatsuki_bat'];
export const HANONO9_SHOP_ARMOR = ['akatsuki_mail', 'shiraha_mantle', 'hoshimori_robe', 'hayabusa_gi', 'akatsuki_shield', 'akatsuki_helm', 'shiraha_hat'];
export const HANONO9_SHOP_TOOLS = ['herb', 'kumo_wataame', 'antidote', 'moonherb', 'hanebito_salve', 'moon_drop', 'hoshi_konpeito', 'holy_water', 'return_wing', 'guide_thread', 'smoke_ball'];

// 大地の神殿の 各階の 宝箱の 中み（1階が 上、8階が いちばん 下。A が 宝箱で 使う）
export const EARTH_TREASURE = {
  1: ['et_root_bangle'],
  2: ['et_moss_claw', 'et_root_whip'],
  3: ['et_keeper_shield', 'et_spring_robe'],
  4: ['et_keeper_axe', 'et_tree_hat'],
  5: ['et_spring_staff', 'et_earth_gi'],
  6: ['et_bedrock_mail', 'et_pulse_bat'],
  7: ['et_heart_spear', 'et_akane_fan'],
  8: ['et_earth_sword', 'et_earth_crown'],
};

// みんなが くれる ★5の 品（A が ハネノの「みんなが集まる」で わたす。ルカの 道具・ユキナと ばあちゃんの 大事な物は A）
export const GATHER_GIFTS = { nefi: 'gift_royal_charm', sara: 'gift_sandwind_cape', barga: 'gift_captain_axe', mira: 'gift_miko_staff' };

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5 … 第5章）。★4（迷宮の 宝箱）＋ この 章の 素材 → ★5
export const EARTH_RECIPES = [
  { id: 'r_earth_light_sword', tier: 5, out: 'et_alch_sword', ins: ['mem_lightshadow_sword', 'earth_root', 'earth_stone'] },
  { id: 'r_earth_moon_mail', tier: 5, out: 'et_alch_mail', ins: ['mem_moonlight_mail', 'earth_stone', 'earth_stone'] },
  { id: 'r_root_seed', tier: 5, out: 'seed_agi', ins: ['earth_root', 'earth_root', 'earth_stone'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const EARTH_ITEM_KANA = {
  akatsuki_sword: 'あかつきのけん', daichi_axe: 'だいちわりのおの', hoshikaze_dagger: 'ほしかぜのたんけん', hoshimori_spear: 'ほしもりのやり',
  hayabusa_claw: 'はやぶさのつめ', kizuna_whip: 'きずなのむち', shiraha_staff: 'しらはのつえ', amanoha_fan: 'あまのはのおうぎ',
  nagaregumo_boomerang: 'ながれぐものぶーめらん', akatsuki_bat: 'あかつきのばっと',
  akatsuki_mail: 'あかつきのよろい', shiraha_mantle: 'しらはのまんと', hoshimori_robe: 'ほしもりのろーぶ', hayabusa_gi: 'はやぶさのどうぎ',
  akatsuki_shield: 'あかつきのたて', akatsuki_helm: 'あかつきのかぶと', shiraha_hat: 'しらはのぼうし',
  earth_root: 'だいちのね', earth_stone: 'だいちのひかりいし',
  et_root_bangle: 'ねのうでわ', et_moss_claw: 'こけむしたつめ', et_root_whip: 'ねのむち', et_keeper_shield: 'まもりてのたて', et_spring_robe: 'ちかすいのろーぶ',
  et_keeper_axe: 'まもりてのおの', et_tree_hat: 'たいじゅのぼうし', et_spring_staff: 'だいちのいずみのつえ', et_earth_gi: 'だいちのどうぎ',
  et_bedrock_mail: 'がんばんのよろい', et_pulse_bat: 'こどうのばっと', et_heart_spear: 'だいちのこころのやり', et_akane_fan: 'あかねいろのおうぎ',
  et_earth_sword: 'だいちのけん', et_earth_crown: 'だいちのかんむり',
  nocto_earth_charm: 'だいちのかけらのおまもり', nocto_star_cloak: 'くろいほしのまんと', nocto_crest: 'のくとのもんしょう',
  gift_royal_charm: 'おうけのまもりのおまもり', gift_sandwind_cape: 'すなかぜごうのはたのまんと', gift_captain_axe: 'かしらのおおおの', gift_miko_staff: 'みずのみこのつえ',
  et_alch_sword: 'だいちとひかりのけん', et_alch_mail: 'だいちのげっこうよろい',
};
