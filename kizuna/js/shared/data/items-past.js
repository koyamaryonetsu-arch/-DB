// 第2部 第6章 Step 1・2 の 品（B: 品。items.js で まぜる。A が 店・宝箱で 使う）
// 名前の 約束（docs/plan-ch6.md の 9）:
//   PAST_SHOP_WEAPONS・PAST_SHOP_ARMOR・PAST_SHOP_TOOLS … 千年前の ホシフルの里の 店の ならび（data/shops-past.js の SHOPS_PAST）
//   PAST_TREASURE … 宝箱の 中み（{ toki_shrine: [...], toki_ruin: [...], overworld_past: [...] }。A が 置く 数に 合わせる。足りない ときは A が 薬草などで うめる）
//
// ・★の きまり（第35回・plan-ch5.md の 16・plan-ch6.md の 8。家族:「★5が MAX。★5の 中で 強いのを 今後 出していく」）:
//   店の 品は いつも ★1（レア度 0・きたえられない）。店では 買えない 品は ランクで ★（ランク10 ＝ ★5。テストの きまりで ランクは 10まで）
// ・里の 店（ランク10）: 武器は 今の 職業の 10しゅるい（剣・オノ・短剣・やり・ツメ・ムチ・つえ・おうぎ・ブーメラン・バット）、
//   防具は よろい（重い）・マント・ローブ・道着・たて・かぶと・ぼうし。強さは ランク10の めやす（ハネノの ランク9の 約1.18倍）
//   千年前は キメラのつばさが 使えないので、道具屋では 売らない（帰りは 時の砂時計で）
// ・宝箱（PAST_TREASURE。src: 'past'「千年前の宝箱でしか手に入らない」）: ぜんぶ ランク10の ★5・オレンジ（レア度 4）。
//   「あとの 品ほど 強い」は 強さの かけ算（PAST_K）で: 時のほこら 1.26〜1.28・千年前の フィールド 1.28〜1.30・時のいせき 1.30（1階）→ 1.36（7階）。
//   影の城（12階 1.27）より 上。時のいせきの 7階の 剣（152）は ソリトゥスの 夜明けの星の剣（150）より 少し 強い
// ・ボスの 品（src: 'pastboss'「時の魔物からしか手に入らない」）: かならず 1人 1つの アクセサリー（レア度 3）と、
//   いちばん めずらしい 色（レア度 5）の 武器（drops.rare の 1回に 1回）。第1部の さいごの ★5（きずなの星・夜明けの星の剣）より 少し 強い。ギアドンの 品が いちばん 強い
// ・素材: 時の砂（時のほこら・千年前の フィールド）・古い歯車（時のいせき）。れん金（PAST_RECIPES）で ★5 を もっと 強い ★5 に
// 強さの めやす（items-earth.js と おなじ。ランク 0〜10）
const SWORD = [0, 6, 12, 20, 30, 40, 50, 61, 72, 85, 100];
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const CAT_K = { sword: 1, axe: 1.1, dagger: 0.72, spear: 0.92, claw: 0.9, whip: 0.85, staff: 0.36, fan: 0.66, boomerang: 0.62, bat: 0.95 };
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
// rarity … レア度（店 0・宝箱 4・ボスの 武器 5）。k … 強さの かけ算
const W = (cat, rarity = 0, k = 1) => ({ type: 'weapon', cat, rank: R, rarity, atk: Math.round(SWORD[R] * CAT_K[cat] * RAR_K[rarity] * k) });
const A = (armorType, rarity = 0, k = 1) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const S = (rarity = 0, k = 1) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const H = (helm, rarity = 0, k = 1) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });
// 宝箱の 場所ごとの 強さの かけ算（あとで 行く 所・深い 階ほど 大きい）
export const PAST_K = {
  toki_shrine: [1.26, 1.26, 1.27, 1.27, 1.28, 1.28],
  overworld_past: [1.28, 1.28, 1.29, 1.29, 1.3, 1.3],
  toki_ruin: { 1: 1.3, 2: 1.31, 3: 1.32, 4: 1.33, 5: 1.34, 6: 1.35, 7: 1.36 },
};
const KS = PAST_K.toki_shrine, KF = PAST_K.overworld_past, KR = PAST_K.toki_ruin;

// ───── 千年前の ホシフルの里の 店（ランク10・★1）─────
const SHOP = {
  // 武器
  p6_kodai_sword: { ...W('sword'), name: 'いにしえの剣', price: 12800, desc: '千年前の里のかじ屋が、星の鉄を打ってつくった剣。まっすぐで、ずしりと重い。' },
  p6_kodai_axe: { ...W('axe'), name: '大木わりのオノ', bonus: { agi: -3 }, price: 13500, desc: '千年前の森の大木も、ひとふりでわるオノ。一撃がとても強い。' },
  p6_kodai_dagger: { ...W('dagger'), name: 'こはくの短剣', bonus: { agi: 10 }, price: 9500, desc: 'こはく色のつかの、軽い短剣。すばやく動ける。' },
  p6_kodai_spear: { ...W('spear'), name: 'ときわのやり', bonus: { agi: 2 }, price: 11800, desc: '一年中みどりの木でつくった、長いやり。よくとどく。' },
  p6_kodai_claw: { ...W('claw'), name: '森ぬしのツメ', bonus: { agi: 6 }, price: 11600, desc: '森のぬしのツメのように、太くてするどいツメ。' },
  p6_kodai_whip: { ...W('whip'), name: 'いにしえのつたムチ', price: 11400, desc: '千年前の森のつたをあんだ、じょうぶなムチ。' },
  p6_kodai_staff: { ...W('staff'), name: '星見の古木のつえ', bonus: { mag: 44, heal: 26 }, price: 11400, desc: '星を見る丘の、古い木のえだでつくったつえ。呪文の力が上がる。' },
  p6_kodai_fan: { ...W('fan'), name: 'みどりの大葉のおうぎ', bonus: { agi: 15 }, price: 10400, desc: '千年前の森の、大きな葉でつくったおうぎ。体が軽くなる。' },
  p6_kodai_boomerang: { ...W('boomerang'), name: 'いにしえのブーメラン', price: 11400, desc: '千年前のかりの道具。森の中を、ぐるりと回ってもどってくる。敵全体に当たる。' },
  p6_kodai_bat: { ...W('bat'), name: '古木のバット', bonus: { agi: 2 }, price: 11400, desc: 'たおれた古い木からけずりだした、重いバット。ゴツンとひびく。' },
  // 防具
  p6_kodai_mail: { ...A('heavy'), name: 'いにしえのよろい', bonus: { agi: -2 }, price: 13500, desc: '千年前の戦士たちのよろい。星の鉄をたたいてつくった。' },
  p6_kodai_mantle: { ...A('cloth'), name: '森のマント', bonus: { agi: 5 }, price: 10900, desc: '森の草の色にそめたマント。だれでも装備できる。' },
  p6_kodai_robe: { ...A('robe'), name: 'いにしえのローブ', bonus: { mag: 15, heal: 13 }, price: 10900, desc: '千年前の星読みたちのローブ。魔力が上がる。' },
  p6_kodai_gi: { ...A('gi'), name: '森の道着', bonus: { agi: 15 }, price: 10900, desc: '森をかけまわる人の道着。とても動きやすい。' },
  p6_kodai_shield: { ...S(), name: 'いにしえのたて', price: 9900, desc: '千年前の戦士たちの、木と鉄のまるいたて。' },
  p6_kodai_helm: { ...H(true), name: 'いにしえのかぶと', price: 8200, desc: '星の鉄のかぶと。戦士などが装備できる。' },
  p6_kodai_hat: { ...H(false), name: '葉っぱのぼうし', bonus: { agi: 3 }, price: 5200, desc: '大きな葉をあんだぼうし。だれでも装備できる。' },
  // 道具（新しい 道具）
  p6_honey: {
    name: '森のはちみつ', type: 'use', price: 140, target: 'ally', battle: true, field: true,
    effect: { type: 'heal', base: [140, 160], fixed: true },
    desc: '千年前の森の、とろりとあまいはちみつ。HPを150ほど回復する。',
  },
};

// ───── 素材（れん金で 使う）─────
const MATS = {
  p6_time_sand: { name: '時の砂', type: 'mat', price: 0, sell: 70, desc: '時のほこらや千年前の森でとれる、金色の砂。手の上で、ゆっくり下から上へ流れる。' },
  p6_old_gear: { name: '古い歯車', type: 'mat', price: 0, sell: 75, desc: '時のいせきのからくりからとれる、小さな歯車。千年たっても、さびていない。' },
};

// ───── 宝箱（千年前の 宝箱でしか 手に 入らない。ぜんぶ ランク10＝★5・オレンジ）─────
const PAST = { src: 'past' };
const TREASURE = {
  // ── 時のほこら（3階。砂と 砂時計）──
  p6_sandglass_ring: { ...C(), ...PAST, name: '砂時計の指輪', bonus: { agi: 14, hp: 36, mag: 8 }, resist: { blind: 0.6, wind: 0.8 }, desc: '小さな砂時計のついた指輪。だれでも装備でき、素早さとHPが上がる。まぼろしにかかりにくい。' },
  p6_sand_dagger: { ...W('dagger', 4, KS[1]), ...PAST, name: '砂つぶの短剣', bonus: { agi: 12 }, onHit: { status: 'blind', chance: 0.12 }, desc: '金色の砂がきらきら光る短剣。ときどき敵にまぼろしを見せる。' },
  p6_sand_robe: { ...A('robe', 4, KS[2]), ...PAST, name: '砂の精のローブ', bonus: { mag: 18, heal: 16 }, resist: { wind: 0.8, blind: 0.7 }, desc: '砂の精がおったという、うすいローブ。魔力が上がり、風に少し強い。' },
  p6_scorpion_claw: { ...W('claw', 4, KS[3]), ...PAST, name: 'サソリのツメ', bonus: { agi: 6, str: 4 }, onHit: { status: 'poison', chance: 0.15 }, desc: '砂時計サソリのはさみのようなツメ。ときどき敵を毒にする。' },
  p6_hourglass_shield: { ...S(4, KS[4]), ...PAST, name: '砂時計のたて', bonus: { hp: 24 }, resist: { wind: 0.8, blast: 0.85 }, desc: '砂時計の形のもようのたて。風と爆発に少し強い。' },
  p6_quicksand_whip: { ...W('whip', 4, KS[5]), ...PAST, name: '流れ砂のムチ', bonus: { agi: 8 }, desc: '流れる砂のように、するするとのびるムチ。' },
  // ── 千年前の ミドリナ地方（古い 森）──
  p6_antler_spear: { ...W('spear', 4, KF[0]), ...PAST, name: 'ツノジカのやり', bonus: { agi: 6, str: 6 }, resist: { poison: 0.7 }, desc: 'こけむしツノジカのツノのように、先が分かれたやり。毒に少し強い。' },
  p6_amber_fan: { ...W('fan', 4, KF[1]), ...PAST, name: 'こはくのおうぎ', bonus: { agi: 15, mag: 10 }, resist: { light: 0.8 }, desc: 'こはくをうすくけずって作ったおうぎ。光に少し強い。' },
  p6_moss_mail: { ...A('heavy', 4, KF[2]), ...PAST, name: 'こけむしのよろい', bonus: { hp: 40, agi: -2 }, resist: { poison: 0.6, blast: 0.85 }, desc: '千年前の戦士がのこした、こけむしたよろい。毒に強く、爆発に少し強い。' },
  p6_leaf_hat: { ...H(false, 4, KF[3]), ...PAST, name: '千年の葉のぼうし', bonus: { hp: 20, agi: 6 }, resist: { sleep: 0.6 }, desc: '千年の木の葉をあんだぼうし。だれでも装備でき、ねむりにくい。' },
  p6_hare_boots: { ...C(), ...PAST, name: 'ときうさぎのくつ', bonus: { agi: 20, str: 4, hp: 16 }, desc: 'ときうさぎの足のように、ぴょんぴょんはねるくつ。だれでも装備でき、素早さがとても上がる。' },
  p6_oldwood_bat: { ...W('bat', 4, KF[5]), ...PAST, name: '千年の木のバット', bonus: { str: 6, agi: 2 }, crit: 0.05, desc: '千年生きた木の、いちばんかたい所のバット。会心が出やすい。' },
  // ── 時のいせき（1階が 上。深い 階ほど 強い）──
  // 1階
  p6_cog_bangle: { ...C(), ...PAST, name: '歯車のうでわ', bonus: { str: 10, hp: 30, def: 6 }, resist: { paralyze: 0.6 }, desc: '小さな歯車がかみあったうでわ。だれでも装備でき、力とHPが上がる。マヒしにくい。' },
  p6_gear_boomerang: { ...W('boomerang', 4, KR[1]), ...PAST, name: '大歯車のブーメラン', bonus: { agi: 6 }, desc: '大きな歯車の形のブーメラン。ぶんぶん回って、敵全体に当たる。' },
  // 2階
  p6_ruin_helm: { ...H(true, 4, KR[2]), ...PAST, name: '番兵の石かぶと', bonus: { hp: 26 }, resist: { blast: 0.8, confuse: 0.7 }, desc: 'いにしえの番兵のかぶとをまねた、石のかぶと。爆発に強く、混乱しにくい。戦士などが装備できる。' },
  p6_bell_staff: { ...W('staff', 4, KR[2]), ...PAST, name: '時のかねのつえ', bonus: { mag: 52, heal: 30 }, mpRegen: 1, resist: { sleep: 0.7 }, desc: '先に小さなかねのついたつえ。行動するたびに、MPが少し回復する。' },
  // 3階
  p6_pendulum_whip: { ...W('whip', 4, KR[3]), ...PAST, name: 'ふりこのムチ', bonus: { agi: 8 }, onHit: { status: 'confuse', chance: 0.1 }, desc: 'ふりこのように、ゆらゆらゆれるムチ。ときどき敵を混乱させる。' },
  p6_ruin_gi: { ...A('gi', 4, KR[3]), ...PAST, name: '時の神殿の道着', bonus: { agi: 16, str: 6 }, resist: { paralyze: 0.6 }, desc: '時の神殿の守り手たちの道着。とても動きやすく、マヒしにくい。' },
  // 4階（時の いずみの 休み所）
  p6_spring_robe: { ...A('robe', 4, KR[4]), ...PAST, name: '時のいずみのローブ', bonus: { mag: 20, heal: 20 }, resist: { ice: 0.8, sleep: 0.6 }, desc: '時のいずみの水のように、すきとおったローブ。氷に強く、ねむりにくい。' },
  p6_beetle_axe: { ...W('axe', 4, KR[4]), ...PAST, name: '歯車カブトのオノ', bonus: { str: 8, agi: -2 }, resist: { bolt: 0.85 }, desc: '歯車カブトのツノの形をした、大きなオノ。雷に少し強い。' },
  // 5階
  p6_second_dagger: { ...W('dagger', 4, KR[5]), ...PAST, name: '秒針の短剣', bonus: { agi: 12 }, onHit: { status: 'paralyze', chance: 0.1 }, desc: '時計の秒針のように細い短剣。ときどき敵を動けなくする。' },
  p6_chrono_mantle: { ...A('cloth', 4, KR[5]), ...PAST, name: 'ときのマント', bonus: { agi: 12, hp: 24 }, resist: { dark: 0.8, paralyze: 0.7 }, desc: '時の流れのような、銀色のマント。だれでも装備でき、闇に強い。' },
  // 6階
  p6_chrono_mail: { ...A('heavy', 4, KR[6]), ...PAST, name: 'ときの守り手のよろい', bonus: { hp: 44, agi: -2 }, resist: { bolt: 0.8, dark: 0.8 }, desc: 'ときの守り手のよろいと同じ、銀の歯車のよろい。雷と闇に強い。' },
  p6_minute_spear: { ...W('spear', 4, KR[6]), ...PAST, name: '長針のやり', bonus: { agi: 8, str: 6 }, resist: { dark: 0.85 }, desc: '時計の長い針の形をしたやり。闇に少し強い。' },
  // 7階（番人の間の 前）
  p6_clock_crown: { ...H(false, 4, KR[7]), ...PAST, name: '時計の王のかんむり', bonus: { hp: 28, mag: 12, agi: 8 }, resist: { confuse: 0.5, sleep: 0.6 }, desc: 'むかしの時の王がかぶっていた、時計のかざりのかんむり。だれでも装備でき、混乱とねむりに強い。' },
  p6_ruin_sword: { ...W('sword', 4, KR[7]), ...PAST, name: '時のいせきの剣', bonus: { str: 10, agi: 8 }, resist: { dark: 0.75, bolt: 0.85 }, desc: '時のいせきのいちばんおくにねむっていた剣。闇に強く、雷に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // サンドクロック: 1人 1つの アクセサリー（drops.boss）と、砂時計の つえ（drops.rare の 1回に 1回）
  p6_sand_pendant: {
    ...C(3), ...PB, boss: 'sand_clock', unique: true, name: '砂時計のペンダント', bonus: { hp: 64, mag: 16, agi: 16, def: 12, str: 12, heal: 16 }, resist: { wind: 0.7, blind: 0.5, ice: 0.8 },
    desc: 'サンドクロックがくだけたあとに、のこっていた小さな砂時計。中の砂が、ゆっくり流れている。だれでも装備でき、すべての力が上がる。',
  },
  p6_sand_staff: {
    ...W('staff', 5, 1.32), ...PB, boss: 'sand_clock', name: '砂時計のつえ', bonus: { mag: 58, heal: 36 }, mpRegen: 2, resist: { wind: 0.8, sleep: 0.6 },
    desc: '先に砂時計のついたつえ。呪文の力がとても上がり、行動するたびにMPが回復する。',
  },
  // ギアドン: 1人 1つの アクセサリーと、ときをきざむ剣（今までで いちばん 強い ★5）
  p6_gear_charm: {
    ...C(3), ...PB, boss: 'geardon', unique: true, name: '大歯車のお守り', bonus: { hp: 72, str: 16, def: 16, mag: 16, agi: 14, heal: 12 }, resist: { bolt: 0.6, dark: 0.6, paralyze: 0.5, confuse: 0.6 },
    desc: 'ギアドンのむねの大歯車の、まん中のかけら。チク、タクと小さく鳴っている。だれでも装備でき、すべての力が大きく上がる。',
  },
  p6_tick_sword: {
    ...W('sword', 5, 1.38), ...PB, boss: 'geardon', name: 'ときをきざむ剣', bonus: { str: 16, agi: 10, mag: 8 }, crit: 0.05, resist: { dark: 0.6, bolt: 0.8 },
    desc: '時をきざむ時計の針で作られたという剣。今までのどの剣よりも強い。会心が出やすく、闇に強い。',
  },
};

// ───── れん金でしか 作れない 品（★5 → もっと 強い ★5。data/alchemy.js の PAST_RECIPES）─────
const ALCH = {
  p6_alch_sword: { ...W('sword', 4, 1.34), src: 'alchemy', name: '時の砂の剣', bonus: { str: 12, agi: 8 }, resist: { dark: 0.7, wind: 0.8, fire: 0.8 }, desc: '影の城の剣に、時の砂と古い歯車の力をこめた剣。闇に強く、風と炎に少し強い。' },
  p6_alch_mail: { ...A('heavy', 4, 1.33), src: 'alchemy', name: '時の歯車のよろい', bonus: { hp: 46, agi: -2 }, resist: { fire: 0.7, bolt: 0.8, blast: 0.85 }, desc: '黒炎のよろいを、古い歯車できたえなおしたよろい。炎に強く、雷に少し強い。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(ALCH)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_PAST = { ...SHOP, ...MATS, ...TREASURE, ...BOSS, ...ALCH };

// 千年前の ホシフルの里の 店の ならび（ランク10。data/shops-past.js の SHOPS_PAST が 使う）
export const PAST_SHOP_WEAPONS = ['p6_kodai_sword', 'p6_kodai_axe', 'p6_kodai_dagger', 'p6_kodai_spear', 'p6_kodai_claw', 'p6_kodai_whip', 'p6_kodai_staff', 'p6_kodai_fan', 'p6_kodai_boomerang', 'p6_kodai_bat'];
export const PAST_SHOP_ARMOR = ['p6_kodai_mail', 'p6_kodai_mantle', 'p6_kodai_robe', 'p6_kodai_gi', 'p6_kodai_shield', 'p6_kodai_helm', 'p6_kodai_hat'];
export const PAST_SHOP_TOOLS = ['herb', 'p6_honey', 'kumo_wataame', 'antidote', 'moonherb', 'hanebito_salve', 'moon_drop', 'hoshi_konpeito', 'holy_water', 'guide_thread', 'smoke_ball'];

// 宝箱の 中み（A が 置く）。時のほこら 6・時のいせき 14（1階から じゅんに 2つずつ）・千年前の フィールド 6
export const PAST_TREASURE = {
  toki_shrine: ['p6_sandglass_ring', 'p6_sand_dagger', 'p6_sand_robe', 'p6_scorpion_claw', 'p6_hourglass_shield', 'p6_quicksand_whip'],
  toki_ruin: [
    'p6_cog_bangle', 'p6_gear_boomerang', 'p6_ruin_helm', 'p6_bell_staff', 'p6_pendulum_whip', 'p6_ruin_gi', 'p6_spring_robe',
    'p6_beetle_axe', 'p6_second_dagger', 'p6_chrono_mantle', 'p6_chrono_mail', 'p6_minute_spear', 'p6_clock_crown', 'p6_ruin_sword',
  ],
  overworld_past: ['p6_antler_spear', 'p6_amber_fan', 'p6_moss_mail', 'p6_leaf_hat', 'p6_hare_boots', 'p6_oldwood_bat'],
};
// 時のいせきの 階ごとの 宝（A が 階ごとに 置く ときの めやす。PAST_TREASURE.toki_ruin を 2つずつ）
export const PAST_RUIN_FLOORS = { 1: PAST_TREASURE.toki_ruin.slice(0, 2), 2: PAST_TREASURE.toki_ruin.slice(2, 4), 3: PAST_TREASURE.toki_ruin.slice(4, 6), 4: PAST_TREASURE.toki_ruin.slice(6, 8), 5: PAST_TREASURE.toki_ruin.slice(8, 10), 6: PAST_TREASURE.toki_ruin.slice(10, 12), 7: PAST_TREASURE.toki_ruin.slice(12, 14) };

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const PAST_DROPS = { sand_clock: ['p6_sand_pendant', 'p6_sand_staff'], geardon: ['p6_gear_charm', 'p6_tick_sword'] };

// れん金の レシピ（data/alchemy.js の RECIPES に まぜる。tier 5 … 第5章〜）。★5 ＋ この 章の 素材 → もっと 強い ★5
export const PAST_RECIPES = [
  { id: 'r_past_sand_sword', tier: 5, out: 'p6_alch_sword', ins: ['cs_castle_sword', 'p6_time_sand', 'p6_old_gear'] },
  { id: 'r_past_gear_mail', tier: 5, out: 'p6_alch_mail', ins: ['cs_blackfire_mail', 'p6_old_gear', 'p6_old_gear'] },
  { id: 'r_past_sand_seed', tier: 5, out: 'seed_agi', ins: ['p6_time_sand', 'p6_time_sand', 'p6_old_gear'] },
];

// 読みがな（あいうえお順の ならびかえ）
export const PAST_ITEM_KANA = {
  p6_kodai_sword: 'いにしえのけん', p6_kodai_axe: 'たいぼくわりのおの', p6_kodai_dagger: 'こはくのたんけん', p6_kodai_spear: 'ときわのやり',
  p6_kodai_claw: 'もりぬしのつめ', p6_kodai_whip: 'いにしえのつたむち', p6_kodai_staff: 'ほしみのこぼくのつえ', p6_kodai_fan: 'みどりのおおばのおうぎ',
  p6_kodai_boomerang: 'いにしえのぶーめらん', p6_kodai_bat: 'こぼくのばっと',
  p6_kodai_mail: 'いにしえのよろい', p6_kodai_mantle: 'もりのまんと', p6_kodai_robe: 'いにしえのろーぶ', p6_kodai_gi: 'もりのどうぎ',
  p6_kodai_shield: 'いにしえのたて', p6_kodai_helm: 'いにしえのかぶと', p6_kodai_hat: 'はっぱのぼうし', p6_honey: 'もりのはちみつ',
  p6_time_sand: 'ときのすな', p6_old_gear: 'ふるいはぐるま',
  p6_sandglass_ring: 'すなどけいのゆびわ', p6_sand_dagger: 'すなつぶのたんけん', p6_sand_robe: 'すなのせいのろーぶ', p6_scorpion_claw: 'さそりのつめ',
  p6_hourglass_shield: 'すなどけいのたて', p6_quicksand_whip: 'ながれずなのむち',
  p6_antler_spear: 'つのじかのやり', p6_amber_fan: 'こはくのおうぎ', p6_moss_mail: 'こけむしのよろい', p6_leaf_hat: 'せんねんのはのぼうし',
  p6_hare_boots: 'ときうさぎのくつ', p6_oldwood_bat: 'せんねんのきのばっと',
  p6_cog_bangle: 'はぐるまのうでわ', p6_gear_boomerang: 'おおはぐるまのぶーめらん', p6_ruin_helm: 'ばんぺいのいしかぶと', p6_bell_staff: 'ときのかねのつえ',
  p6_pendulum_whip: 'ふりこのむち', p6_ruin_gi: 'ときのしんでんのどうぎ', p6_spring_robe: 'ときのいずみのろーぶ', p6_beetle_axe: 'はぐるまかぶとのおの',
  p6_second_dagger: 'びょうしんのたんけん', p6_chrono_mantle: 'ときのまんと', p6_chrono_mail: 'ときのまもりてのよろい', p6_minute_spear: 'ちょうしんのやり',
  p6_clock_crown: 'とけいのおうのかんむり', p6_ruin_sword: 'ときのいせきのけん',
  p6_sand_pendant: 'すなどけいのぺんだんと', p6_sand_staff: 'すなどけいのつえ', p6_gear_charm: 'おおはぐるまのおまもり', p6_tick_sword: 'ときをきざむけん',
  p6_alch_sword: 'ときのすなのけん', p6_alch_mail: 'ときのはぐるまのよろい',
};
