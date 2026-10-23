// 第2部 第6章 Step 3・4「星めぐりの古道」の 品（B: 品。items.js で まぜる。A が 宝箱で 使う）
// 名前の 約束（docs/plan-ch6.md の 12-1）:
//   ROAD_TREASURE_FLOORS … 古道の 宝箱の 中み（{ 1: [2つ], …, 8: [2つ] }。今の 階と 千年前の 階の どちらに 置いても よい）
//   ROAD_FIELD_TREASURE  … 千年前の 星読みの社の まわりの 宝箱（3つ）
//   A が 置く 数が ちがう ときは、多い 分は 今の 道具で うめる・少ない ときは うしろ（強い 方）から へらす
//
// ・★の きまり（plan-ch6.md の 8・第35回）: ランク10 ＝ ★5 の まま（店の 品は ★1）。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'road'「星めぐりの古道の宝箱でしか手に入らない」。社の まわりは src: 'past'）: ぜんぶ ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算（ROAD_K）: 社の まわり 1.36・古道 1.37（1階）→ 1.44（8階）。第6章 Step 1・2（時のいせき 7階 1.36）より 少し 上
//   古道 8階の 剣（161）は 時のいせきの 剣（152）・ときをきざむ剣（159）より 少し 強い
// ・ボスの 品（src: 'pastboss'「時の魔物からしか手に入らない」）: かならず 1人 1つの アクセサリー（レア度 3）と、
//   いちばん めずらしい 色（レア度 5）の 武器（drops.rare の 1回に 1回）。ギアドンの 品より 少し 強い。ペンデュラの 品が いちばん 強い
//   アクセの ボーナスの 合計: 大歯車のお守り 146 < 星くい鳥のはねかざり 154 < 時のふりこのお守り 166
// 強さの めやす（items-past.js と おなじ。ランク 0〜10）
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
// 宝箱の 場所ごとの 強さの かけ算（あとで 行く 所・深い 階ほど 大きい）
export const ROAD_K = { field: 1.36, 1: 1.37, 2: 1.38, 3: 1.39, 4: 1.4, 5: 1.41, 6: 1.42, 7: 1.43, 8: 1.44 };
const K = ROAD_K;

const ROAD = { src: 'road' };
const TREASURE = {
  // ── 千年前の 星読みの社の まわり（src: 'past'）──
  p6r_shrine_staff: { ...W('staff', 4, K.field), src: 'past', name: '星読みの社のつえ', bonus: { mag: 56, heal: 34 }, mpRegen: 1, resist: { dark: 0.85 }, desc: '星読みの社につたわる、星の形のつえ。行動するたびに、MPが少し回復する。' },
  p6r_star_necklace: { ...C(), src: 'past', name: '星読みのくびかざり', bonus: { mag: 14, heal: 14, hp: 30 }, resist: { confuse: 0.6, dark: 0.85 }, desc: '星読みたちが身につける、小さな星のくびかざり。だれでも装備でき、魔力と回復の力が上がる。混乱しにくい。' },
  p6r_road_mail: { ...A('heavy', 4, K.field), src: 'past', name: '古道の旅のよろい', bonus: { hp: 44, agi: -2 }, resist: { wind: 0.8, blast: 0.85 }, desc: 'むかしの旅人が、星めぐりの古道を歩いたときのよろい。風に強く、爆発に少し強い。' },
  // ── 星めぐりの古道（1階が 上。深い 階ほど 強い）──
  // 1階
  p6r_starlight_ring: { ...C(), ...ROAD, name: '星かげの指輪', bonus: { agi: 14, hp: 40, mag: 10 }, resist: { dark: 0.8, sleep: 0.7 }, desc: '夜空の星のかげをとじこめた指輪。だれでも装備でき、素早さとHPが上がる。闇に強い。' },
  p6r_dust_boomerang: { ...W('boomerang', 4, K[1]), ...ROAD, name: '星くずのブーメラン', bonus: { agi: 8 }, onHit: { status: 'blind', chance: 0.1 }, desc: '星くずをかためた、きらきらのブーメラン。敵全体に当たり、ときどきまぼろしを見せる。' },
  // 2階
  p6r_sunwool_mantle: { ...A('cloth', 4, K[2]), ...ROAD, name: 'ひなたの毛のマント', bonus: { agi: 10, hp: 30 }, resist: { ice: 0.8, dark: 0.85 }, desc: 'ひなたの星ひつじの金の毛でおったマント。だれでも装備でき、氷に強い。' },
  p6r_fang_dagger: { ...W('dagger', 4, K[2]), ...ROAD, name: 'ほしかげのキバ', bonus: { agi: 14 }, onHit: { status: 'paralyze', chance: 0.08 }, desc: 'ほしかげオオカミのキバのような短剣。ときどき敵を動けなくする。' },
  // 3階
  p6r_dust_hat: { ...H(false, 4, K[3]), ...ROAD, name: '星くずのぼうし', bonus: { hp: 22, mag: 10, agi: 6 }, resist: { blind: 0.5 }, desc: '星くずがちりばめられたぼうし。だれでも装備でき、まぼろしにかかりにくい。' },
  p6r_star_fan: { ...W('fan', 4, K[3]), ...ROAD, name: '星座のおうぎ', bonus: { agi: 16, mag: 12 }, resist: { light: 0.8, dark: 0.85 }, desc: '星座の線がえがかれたおうぎ。あおぐと、星がきらりとまう。' },
  // 4階（休み所の 前。中ボスの 前）
  p6r_reader_robe: { ...A('robe', 4, K[4]), ...ROAD, name: '夜空の星読みローブ', bonus: { mag: 22, heal: 22 }, resist: { dark: 0.8, sleep: 0.6 }, desc: '夜空の色にそめた、星読みのローブ。魔力が上がり、闇に強い。' },
  p6r_guide_spear: { ...W('spear', 4, K[4]), ...ROAD, name: 'みちしるべのやり', bonus: { agi: 8, str: 8 }, resist: { dark: 0.85 }, desc: '先に道しるべの星がついたやり。暗い道でも、ぼんやり光る。' },
  // 5階
  p6r_crab_shield: { ...S(4, K[5]), ...ROAD, name: '星座ガニのたて', bonus: { hp: 30 }, resist: { ice: 0.8, bolt: 0.85 }, desc: '星座ガニのこうらでつくったたて。氷に強く、雷に少し強い。' },
  p6r_warp_whip: { ...W('whip', 4, K[5]), ...ROAD, name: 'ゆがみのムチ', bonus: { agi: 10 }, onHit: { status: 'confuse', chance: 0.1 }, desc: 'ぐにゃりとゆがんで見えるムチ。ときどき敵を混乱させる。' },
  // 6階
  p6r_twin_gi: { ...A('gi', 4, K[6]), ...ROAD, name: 'ふたご星の道着', bonus: { agi: 18, str: 8 }, resist: { light: 0.85, dark: 0.85 }, desc: '光と闇の2色の道着。とても動きやすく、光と闇に少し強い。' },
  p6r_drake_axe: { ...W('axe', 4, K[6]), ...ROAD, name: '星くず竜のオノ', bonus: { str: 10, agi: -2 }, resist: { fire: 0.85 }, desc: '星くずドラゴンのうろこでつくった、大きなオノ。炎に少し強い。' },
  // 7階
  p6r_night_helm: { ...H(true, 4, K[7]), ...ROAD, name: 'よぞらのかぶと', bonus: { hp: 30, def: 6 }, resist: { dark: 0.75, sleep: 0.6 }, desc: '夜空のようにこい青のかぶと。闇に強く、ねむりにくい。戦士などが装備できる。' },
  p6r_owl_bat: { ...W('bat', 4, K[7]), ...ROAD, name: '時わすれのバット', bonus: { str: 8, agi: 4 }, crit: 0.05, desc: 'フクロウのはねのもようのバット。会心が出やすい。' },
  // 8階（いちばん おくの 前の 休み所）
  p6r_road_bangle: { ...C(), ...ROAD, name: '星めぐりのうでわ', bonus: { str: 12, hp: 44, def: 8, agi: 8 }, resist: { paralyze: 0.6, dark: 0.85 }, desc: '星めぐりの古道を歩ききった人に、星がおくるといううでわ。だれでも装備でき、力とHPが上がる。' },
  p6r_road_sword: { ...W('sword', 4, K[8]), ...ROAD, name: '星めぐりの剣', bonus: { str: 12, agi: 8 }, resist: { dark: 0.7, light: 0.85 }, desc: '星めぐりの古道のいちばんおくにねむっていた剣。闇に強く、光に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 星くいのよる鳥: 1人 1つの アクセサリー（drops.boss）と、よぞらのツメ（drops.rare の 1回に 1回）
  p6r_eater_plume: {
    ...C(3), ...PB, boss: 'star_eater', unique: true, name: '星くい鳥のはねかざり', bonus: { hp: 74, str: 16, def: 14, mag: 18, agi: 18, heal: 14 }, resist: { dark: 0.6, wind: 0.7, blind: 0.5 },
    desc: '星くいのよる鳥がのこした、夜の色のはね。光にかざすと、食べられた星が中で光る。だれでも装備でき、すべての力が上がる。',
  },
  p6r_night_claw: {
    ...W('claw', 5, 1.42), ...PB, boss: 'star_eater', name: 'よぞらのツメ', bonus: { agi: 12, str: 10 }, crit: 0.04, resist: { dark: 0.7, wind: 0.8 },
    desc: '星くいのよる鳥のかぎづめのようなツメ。今までのどのツメよりも強い。会心が出やすい。',
  },
  // ペンデュラ: 1人 1つの アクセサリーと、さかさ時計のつえ（今までで いちばん 強い つえ）
  p6r_pendulum_charm: {
    ...C(3), ...PB, boss: 'pendula', unique: true, name: '時のふりこのお守り', bonus: { hp: 80, str: 18, def: 18, mag: 18, agi: 18, heal: 14 }, resist: { dark: 0.6, paralyze: 0.5, sleep: 0.5, confuse: 0.6 },
    desc: 'ペンデュラの大きなふりこの先についていた、小さなふりこ。左右にゆれて、持つ人の時を守る。だれでも装備でき、すべての力が大きく上がる。',
  },
  p6r_witch_staff: {
    ...W('staff', 5, 1.44), ...PB, boss: 'pendula', name: 'さかさ時計のつえ', bonus: { mag: 64, heal: 40 }, mpRegen: 2, resist: { dark: 0.7, sleep: 0.6 },
    desc: '先にさかさまの時計がついた魔女のつえ。呪文の力がとても上がり、行動するたびにMPが回復する。今までのどのつえよりも強い。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_ROAD = { ...TREASURE, ...BOSS };

// 古道の 宝箱（階ごとに 2つ。1階から じゅんに 強く なる）
export const ROAD_TREASURE_FLOORS = {
  1: ['p6r_starlight_ring', 'p6r_dust_boomerang'],
  2: ['p6r_sunwool_mantle', 'p6r_fang_dagger'],
  3: ['p6r_dust_hat', 'p6r_star_fan'],
  4: ['p6r_reader_robe', 'p6r_guide_spear'],
  5: ['p6r_crab_shield', 'p6r_warp_whip'],
  6: ['p6r_twin_gi', 'p6r_drake_axe'],
  7: ['p6r_night_helm', 'p6r_owl_bat'],
  8: ['p6r_road_bangle', 'p6r_road_sword'],
};
// 千年前の 星読みの社の まわりの 宝箱（3つ）
export const ROAD_FIELD_TREASURE = ['p6r_shrine_staff', 'p6r_star_necklace', 'p6r_road_mail'];

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const ROAD_DROPS = { star_eater: ['p6r_eater_plume', 'p6r_night_claw'], pendula: ['p6r_pendulum_charm', 'p6r_witch_staff'] };

// 読みがな（あいうえお順の ならびかえ）
export const ROAD_ITEM_KANA = {
  p6r_shrine_staff: 'ほしよみのやしろのつえ', p6r_star_necklace: 'ほしよみのくびかざり', p6r_road_mail: 'ふるみちのたびのよろい',
  p6r_starlight_ring: 'ほしかげのゆびわ', p6r_dust_boomerang: 'ほしくずのぶーめらん', p6r_sunwool_mantle: 'ひなたのけのまんと', p6r_fang_dagger: 'ほしかげのきば',
  p6r_dust_hat: 'ほしくずのぼうし', p6r_star_fan: 'せいざのおうぎ', p6r_reader_robe: 'よぞらのほしよみろーぶ', p6r_guide_spear: 'みちしるべのやり',
  p6r_crab_shield: 'せいざがにのたて', p6r_warp_whip: 'ゆがみのむち', p6r_twin_gi: 'ふたごぼしのどうぎ', p6r_drake_axe: 'ほしくずりゅうのおの',
  p6r_night_helm: 'よぞらのかぶと', p6r_owl_bat: 'ときわすれのばっと', p6r_road_bangle: 'ほしめぐりのうでわ', p6r_road_sword: 'ほしめぐりのけん',
  p6r_eater_plume: 'ほしくいどりのはねかざり', p6r_night_claw: 'よぞらのつめ', p6r_pendulum_charm: 'ときのふりこのおまもり', p6r_witch_staff: 'さかさどけいのつえ',
};
