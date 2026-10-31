// 第2部 第7章 第1幕「緑の王国」の 品（B: 品。items.js で まぜる。A が 店・宝箱・台本で 使う）
// 名前の 約束（docs/plan-ch7.md の 3）:
//   C7_TREASURE … みどりの水の神殿 1〜8階の 宝箱の 中み（{ 1: [2つ], …, 8: [2つ] }。ぜんぶ ★5）
//     A が 置く 数が ちがう ときは、多い 分は 今の 道具で うめる・少ない ときは うしろ（強い 方）から へらす
//   C7_LETTER_REWARDS … 時をこえる手紙の ごほうび（4つ。A が 手紙ごとに 1つずつ わたす。1つは 神殿の なぞときの 手紙なら、のこりの 3つを より道に）
//   C7_SHOP_WEAPONS・C7_SHOP_ARMOR・C7_SHOP_TOOLS … 緑の王国の 店の ならび（A が 店を 作る ときに 使う。ランク10・★1）
//
// ・★の きまり（plan-ch6.md の 8）: ランク10 ＝ ★5 の まま。★5の 中で 強い 物を 少しずつ 出していく
// ・店（ランク10・★1・レア度 0）: 千年前の 里の 店（items-past.js）より 少し 強い（かけ算 1.06）。剣・やり・短剣・ムチ・つえ・おうぎ・よろい・ローブ・たて・かぶと・ぼうしは 新しく、
//   のこりは 里の 店の 品を ならべる
// ・宝箱（src: 'c7'「みどりの水の神殿の宝箱でしか手に入らない」）: ぜんぶ ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算 C7_K: 1階 1.55 → 8階 1.62（第6章の 時計塔 10階 1.54・第6章クリアの 武器 1.58 の 少し 上）
// ・ボスの 品（src: 'pastboss'）: ボスが かならず 1人 1つの アクセサリー（レア度 3）と、いちばん めずらしい 色（レア度 5）の 武器
// ・時をこえる手紙の ごほうび（src: 'letter7'「時をこえる手紙でしか手に入らない」）: レア度 4・かけ算 1.58
import { PAST_SHOP_TOOLS } from './items-past.js';

// 強さの めやす（items-tokei6.js と おなじ。ランク 0〜10）
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
export const C7_SHOP_K = 1.06;
export const C7_K = { 1: 1.55, 2: 1.56, 3: 1.57, 4: 1.58, 5: 1.59, 6: 1.6, 7: 1.61, 8: 1.62 };
export const C7_LETTER_K = 1.58;
const SK = C7_SHOP_K, K = C7_K, LK = C7_LETTER_K;

// ───── 緑の王国の 店（ランク10・★1）─────
const SHOP = {
  c7_kingdom_sword: { ...W('sword', 0, SK), name: '王国の騎士の剣', price: 14600, desc: '緑の王国の騎士たちの剣。つかに、川と森の紋章がほってある。' },
  c7_kingdom_spear: { ...W('spear', 0, SK), name: '王国の騎士のやり', price: 13800, desc: '緑の王国の騎士たちのやり。長くて、まっすぐ。' },
  c7_kingdom_dagger: { ...W('dagger', 0, SK), name: '川石の短剣', price: 11200, desc: '川の青い石をみがいた短剣。水にぬれると、きらきら光る。' },
  c7_kingdom_whip: { ...W('whip', 0, SK), name: 'つたあみのムチ', price: 11800, desc: '森のつたを、何本もあんだムチ。' },
  c7_kingdom_staff: { ...W('staff', 0, SK), name: '川やなぎのつえ', price: 12400, bonus: { mag: 8, heal: 6 }, desc: '川べのやなぎの木のつえ。魔力と回復の力が少し上がる。' },
  c7_kingdom_fan: { ...W('fan', 0, SK), name: 'はすの葉のおうぎ', price: 11600, desc: '大きなはすの葉でつくったおうぎ。あおぐと、すずしい風。' },
  c7_kingdom_mail: { ...A('heavy', 0, SK), name: '王国の騎士のよろい', bonus: { agi: -2 }, price: 15200, desc: '緑の王国の騎士たちのよろい。むねに、川と森の紋章。' },
  c7_river_robe: { ...A('robe', 0, SK), name: '川べのローブ', bonus: { mag: 6 }, price: 13200, desc: '川の水の色にそめたローブ。魔力が少し上がる。' },
  c7_kingdom_shield: { ...S(0, SK), name: '王国の騎士のたて', price: 11400, desc: '緑の王国の騎士たちの、みどり色のたて。' },
  c7_kingdom_helm: { ...H(true, 0, SK), name: '王国の騎士のかぶと', price: 10800, desc: '緑の王国の騎士たちのかぶと。てっぺんに、みどりの羽かざり。' },
  c7_kingdom_hat: { ...H(false, 0, SK), name: 'はすのぼうし', price: 9400, desc: 'はすの葉の形のぼうし。雨の日も、へいき。' },
};

const TK = { src: 'c7' };
const TREASURE = {
  // 1階（今の かれた 水路と 重なる 入口）
  c7t_ripple_ring: { ...C(), ...TK, name: '水の輪の指輪', bonus: { mag: 14, heal: 12, agi: 10, hp: 30 }, resist: { ice: 0.8, silence: 0.6 }, desc: '水面にひろがる輪の形の指輪。だれでも装備でき、魔力と回復の力が上がる。マホトーンにかかりにくい。' },
  c7t_reed_boomerang: { ...W('boomerang', 4, K[1]), ...TK, name: 'アシのブーメラン', bonus: { agi: 10 }, resist: { ice: 0.85 }, desc: '川べのかたいアシをたばねたブーメラン。氷に少し強い。' },
  // 2階
  c7t_lotus_hat: { ...H(false, 4, K[2]), ...TK, name: 'はすの花のぼうし', bonus: { mag: 12, hp: 24 }, resist: { ice: 0.8, confuse: 0.7 }, desc: 'ピンクのはすの花のぼうし。氷に強く、混乱しにくい。' },
  c7t_fang_dagger: { ...W('dagger', 4, K[2]), ...TK, name: 'ウツボのキバの短剣', bonus: { agi: 12 }, onHit: { status: 'poison', chance: 0.15 }, desc: '大ウツボのキバの短剣。ときどき毒にする。' },
  // 3階
  c7t_fall_robe: { ...A('robe', 4, K[3]), ...TK, name: '滝のローブ', bonus: { mag: 16, heal: 10 }, resist: { ice: 0.75, fire: 0.85 }, desc: '流れ落ちる滝のように、すそがゆれるローブ。氷に強く、炎に少し強い。' },
  c7t_shell_fan: { ...W('fan', 4, K[3]), ...TK, name: '貝がらのおうぎ', bonus: { mag: 10, agi: 8 }, resist: { ice: 0.85 }, desc: 'にじ色の貝がらをならべたおうぎ。氷に少し強い。' },
  // 4階
  c7t_jade_shield: { ...S(4, K[4]), ...TK, name: 'ひすいのたて', bonus: { hp: 30 }, resist: { ice: 0.8, bolt: 0.85 }, desc: 'みどりのひすいをはめこんだたて。氷に強く、雷に少し強い。' },
  c7t_current_whip: { ...W('whip', 4, K[4]), ...TK, name: '水流のムチ', bonus: { str: 8, agi: 8 }, resist: { ice: 0.85 }, desc: '水の流れのように、しなるムチ。氷に少し強い。' },
  // 5階（休み所）
  c7t_temple_gi: { ...A('gi', 4, K[5]), ...TK, name: '水の神殿の道着', bonus: { str: 12, agi: 14, hp: 30 }, resist: { ice: 0.8, sleep: 0.6 }, desc: '神殿の守り手が着ていた道着。力と素早さが上がる。ねむりにくい。' },
  c7t_whirl_axe: { ...W('axe', 4, K[5]), ...TK, name: '大うずのオノ', bonus: { str: 14 }, crit: 0.03, desc: 'オノの先に、うずまきのもようがあるオノ。会心が出やすい。' },
  // 6階
  c7t_coral_helm: { ...H(true, 4, K[6]), ...TK, name: 'さんごのかぶと', bonus: { hp: 36, def: 6 }, resist: { ice: 0.8, dark: 0.85 }, desc: '赤いさんごでかざったかぶと。氷に強く、闇に少し強い。' },
  c7t_tide_claw: { ...W('claw', 4, K[6]), ...TK, name: 'しおのツメ', bonus: { agi: 14, str: 6 }, resist: { ice: 0.85 }, desc: 'しおが満ちる時に、するどく光るツメ。氷に少し強い。' },
  // 7階（休み所）
  c7t_jade_mail: { ...A('heavy', 4, K[7]), ...TK, name: 'ひすいのよろい', bonus: { hp: 40 }, resist: { ice: 0.75, bolt: 0.85 }, desc: 'みどりのひすいの板をつないだよろい。氷に強く、雷に少し強い。' },
  c7t_spring_staff: { ...W('staff', 4, K[7]), ...TK, name: 'いずみのつえ', bonus: { mag: 32, heal: 26 }, mpRegen: 1, resist: { ice: 0.8 }, desc: '先から、きれいな水がわき出るつえ。魔力と回復の力が上がる。行動するたびにMPが1もどる。' },
  // 8階（ボスの 間の 前）
  c7t_star_mantle: { ...A('cloth', 4, K[8]), ...TK, name: '水の守り星のマント', bonus: { agi: 18, mag: 8, hp: 30 }, resist: { ice: 0.75, silence: 0.5 }, desc: '水の守り星の光をおった、青いマント。マホトーンにかかりにくい。' },
  c7t_temple_sword: { ...W('sword', 4, K[8]), ...TK, name: 'みどりの神殿の剣', bonus: { str: 14, agi: 10 }, resist: { ice: 0.75, dark: 0.85 }, desc: '神殿のいちばんおくに、ねむっていた剣。千年の紋章の剣より、少し強い。氷に強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // 水門の ウツボきょうだい: 1人 1つの アクセサリー（drops.boss）と、ウツボのムチ（drops.rare の 1回に 1回）
  c7g_twin_charm: {
    ...C(3), ...PB, boss: 'c7_gate', unique: true, name: 'ふたごのお守り', bonus: { hp: 92, str: 22, def: 20, mag: 22, agi: 20, heal: 16 }, resist: { ice: 0.7, bolt: 0.8, confuse: 0.5 },
    desc: 'ウツボのきょうだいが、2ひきで守っていた、2つの玉のお守り。だれでも装備でき、すべての力が大きく上がる。',
  },
  c7g_eel_whip: {
    ...W('whip', 5, 1.6), ...PB, boss: 'c7_gate', name: 'ウツボのムチ', bonus: { str: 12, agi: 12 }, onHit: { status: 'paralyze', chance: 0.1 }, resist: { bolt: 0.75 },
    desc: 'ウツボのきょうだいのしっぽのような、長いムチ。今までのどのムチよりも強い。ときどきビリッとしびれさせる。',
  },
  // うずの魔女オクタリア: 1人 1つの アクセサリーと、三つまたのほこ（今までで いちばん 強い やり）
  c7t_witch_charm: {
    ...C(3), ...PB, boss: 'c7_temple', unique: true, name: '声の貝のお守り', bonus: { hp: 96, str: 24, def: 20, mag: 24, agi: 20, heal: 18 }, resist: { ice: 0.6, silence: 0.4, dark: 0.7, confuse: 0.5 },
    desc: 'オクタリアの声の貝の、小さなかけら。もう、だれの声もうばわない。だれでも装備でき、すべての力が大きく上がる。マホトーンにかかりにくい。',
  },
  c7t_trident: {
    ...W('spear', 5, 1.64), ...PB, boss: 'c7_temple', name: '三つまたのほこ', bonus: { str: 16, mag: 12, agi: 8 }, resist: { ice: 0.6, bolt: 0.8 },
    desc: 'オクタリアが持っていた、三つまたのほこ。今までのどのやりよりも強い。氷に強い。',
  },
};

// ───── 時をこえる手紙の ごほうび（src: 'letter7'。千年前で うめた 物が、今の その 場所で 見つかる）─────
const LT = { src: 'letter7' };
const LETTER = {
  c7l_letter_ring: { ...C(4), ...LT, name: '千年の手紙の指輪', bonus: { hp: 40, str: 12, mag: 12, agi: 12, heal: 10 }, resist: { dark: 0.85 }, desc: '千年前の手紙といっしょに、うめてあった指輪。だれでも装備でき、すべての力が上がる。' },
  c7l_oasis_staff: { ...W('staff', 4, LK), ...LT, name: 'オアシスの木のつえ', bonus: { mag: 30, heal: 30 }, mpRegen: 1, resist: { fire: 0.8 }, desc: '千年前にうめた木の実が、今のオアシスの木になった。その木のえだのつえ。行動するたびにMPが1もどる。' },
  c7l_river_boomerang: { ...W('boomerang', 4, LK), ...LT, name: '千年の川のブーメラン', bonus: { agi: 14, str: 6 }, resist: { ice: 0.8 }, desc: '千年前の川の石でつくったブーメラン。今は砂の中から出てきた。氷に強い。' },
  c7l_kingdom_crown: { ...H(false, 4, LK), ...LT, name: '緑の王国のかんむり', bonus: { hp: 40, mag: 10, heal: 10 }, resist: { ice: 0.8, confuse: 0.6 }, desc: '千年前の王国の、小さなかんむり。いつか、だれかに見つけてほしくて、うめてあった。' },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS), ...Object.values(LETTER)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_C7 = { ...SHOP, ...TREASURE, ...BOSS, ...LETTER };

// みどりの水の神殿 1〜8階の 宝箱（階ごとに 2つ。1階から じゅんに 強く なる）
export const C7_TREASURE = {
  1: ['c7t_ripple_ring', 'c7t_reed_boomerang'],
  2: ['c7t_lotus_hat', 'c7t_fang_dagger'],
  3: ['c7t_fall_robe', 'c7t_shell_fan'],
  4: ['c7t_jade_shield', 'c7t_current_whip'],
  5: ['c7t_temple_gi', 'c7t_whirl_axe'],
  6: ['c7t_coral_helm', 'c7t_tide_claw'],
  7: ['c7t_jade_mail', 'c7t_spring_staff'],
  8: ['c7t_star_mantle', 'c7t_temple_sword'],
};

// 時をこえる手紙の ごほうび（A が 手紙ごとに 1つ。じゅんばんは 自由）
export const C7_LETTER_REWARDS = ['c7l_letter_ring', 'c7l_oasis_staff', 'c7l_river_boomerang', 'c7l_kingdom_crown'];

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const C7_DROPS = { c7_gate: ['c7g_twin_charm', 'c7g_eel_whip'], c7_temple: ['c7t_witch_charm', 'c7t_trident'] };

// 緑の王国の 店の ならび（ランク10。A が 店を 作る ときに 使う）。のこりは 千年前の 里の 店の 品
export const C7_SHOP_WEAPONS = ['c7_kingdom_sword', 'c7_kingdom_spear', 'c7_kingdom_dagger', 'c7_kingdom_whip', 'c7_kingdom_staff', 'c7_kingdom_fan', 'p6_kodai_axe', 'p6_kodai_claw', 'p6_kodai_boomerang', 'p6_kodai_bat'];
export const C7_SHOP_ARMOR = ['c7_kingdom_mail', 'p6_kodai_mantle', 'c7_river_robe', 'p6_kodai_gi', 'c7_kingdom_shield', 'c7_kingdom_helm', 'c7_kingdom_hat'];
export const C7_SHOP_TOOLS = [...PAST_SHOP_TOOLS];

// 読みがな（あいうえお順の ならびかえ）
export const C7_ITEM_KANA = {
  c7_kingdom_sword: 'おうこくのきしのけん', c7_kingdom_spear: 'おうこくのきしのやり', c7_kingdom_dagger: 'かわいしのたんけん', c7_kingdom_whip: 'つたあみのむち',
  c7_kingdom_staff: 'かわやなぎのつえ', c7_kingdom_fan: 'はすのはのおうぎ', c7_kingdom_mail: 'おうこくのきしのよろい', c7_river_robe: 'かわべのろーぶ',
  c7_kingdom_shield: 'おうこくのきしのたて', c7_kingdom_helm: 'おうこくのきしのかぶと', c7_kingdom_hat: 'はすのぼうし',
  c7t_ripple_ring: 'みずのわのゆびわ', c7t_reed_boomerang: 'あしのぶーめらん', c7t_lotus_hat: 'はすのはなのぼうし', c7t_fang_dagger: 'うつぼのきばのたんけん',
  c7t_fall_robe: 'たきのろーぶ', c7t_shell_fan: 'かいがらのおうぎ', c7t_jade_shield: 'ひすいのたて', c7t_current_whip: 'すいりゅうのむち',
  c7t_temple_gi: 'みずのしんでんのどうぎ', c7t_whirl_axe: 'おおうずのおの', c7t_coral_helm: 'さんごのかぶと', c7t_tide_claw: 'しおのつめ',
  c7t_jade_mail: 'ひすいのよろい', c7t_spring_staff: 'いずみのつえ', c7t_star_mantle: 'みずのまもりぼしのまんと', c7t_temple_sword: 'みどりのしんでんのけん',
  c7g_twin_charm: 'ふたごのおまもり', c7g_eel_whip: 'うつぼのむち', c7t_witch_charm: 'こえのかいのおまもり', c7t_trident: 'みつまたのほこ',
  c7l_letter_ring: 'せんねんのてがみのゆびわ', c7l_oasis_staff: 'おあしすのきのつえ', c7l_river_boomerang: 'せんねんのかわのぶーめらん', c7l_kingdom_crown: 'みどりのおうこくのかんむり',
};
