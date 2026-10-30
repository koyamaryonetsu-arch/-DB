// 第2部 第6章 Step 5「止まった時計塔」の 品（B: 品。items.js で まぜる。A が 宝箱で 使う）
// 名前の 約束（docs/plan-ch6.md の 15）: data/items-tower.js の TOWER_TREASURE_FLOORS（ここから 出す。items-tower.js は 第5章の
//   星の塔の 品の ファイルなので、中みは この ファイルに 書いて、items-tower.js から そのまま 出している）
//   TOWER_TREASURE_FLOORS … 時計塔の 宝箱の 中み（{ 1: [2つ], …, 5: [2つ] }。千年前だけ）
//   A が 置く 数が ちがう ときは、多い 分は 今の 道具で うめる・少ない ときは うしろ（強い 方）から へらす
//
// ・★の きまり（plan-ch6.md の 8・第35回）: ランク10 ＝ ★5 の まま（店の 品は ★1）。★5の 中で 強い 物を 少しずつ 出していく
// ・宝箱（src: 'tokei'「時計塔の宝箱でしか手に入らない」）: ぜんぶ ランク10の ★5・オレンジ（レア度 4）。
//   強さの かけ算（TOKEI_K）: 1階 1.45 → 5階 1.49。星めぐりの古道 8階（1.44）より 少し 上（plan-ch6.md の 13-6）
//   5階の 剣（167）は 古道の 星めぐりの剣（161）より 少し 強い
// ・ボスの 品（src: 'pastboss'「時の魔物からしか手に入らない」）: かならず 1人 1つの アクセサリー（レア度 3）と、
//   いちばん めずらしい 色（レア度 5）の 武器（drops.rare の 1回に 1回）。ペンデュラの 品より 少し 強い
//   アクセの ボーナスの 合計: 時のふりこのお守り 166 < 時のかねのお守り 174
// 強さの めやす（items-road.js と おなじ。ランク 0〜10）
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
// 宝箱の 階ごとの 強さの かけ算（上の 階ほど 大きい）
export const TOKEI_K = { 1: 1.45, 2: 1.46, 3: 1.47, 4: 1.48, 5: 1.49 };
const K = TOKEI_K;

const TK = { src: 'tokei' };
const TREASURE = {
  // 1階（入口の 大広間）
  p6t_gear_ring: { ...C(), ...TK, name: '歯車の指輪', bonus: { def: 10, hp: 44, agi: 8 }, resist: { paralyze: 0.6, bolt: 0.85 }, desc: '小さな歯車がくるくる回る指輪。だれでも装備でき、守りとHPが上がる。マヒしにくい。' },
  p6t_hand_boomerang: { ...W('boomerang', 4, K[1]), ...TK, name: '時計の針のブーメラン', bonus: { agi: 10 }, desc: '大時計の長い針を2本くみあわせたブーメラン。敵全体に当たる。' },
  // 2階（止まった 部屋）
  p6t_spring_hat: { ...H(false, 4, K[2]), ...TK, name: 'ぜんまいのぼうし', bonus: { hp: 24, agi: 10, mag: 8 }, resist: { sleep: 0.6 }, desc: 'てっぺんに小さなぜんまいがついたぼうし。だれでも装備でき、ねむりにくい。' },
  p6t_wind_dagger: { ...W('dagger', 4, K[2]), ...TK, name: 'ねじまきの短剣', bonus: { agi: 16 }, onHit: { status: 'paralyze', chance: 0.08 }, desc: 'ねじまきのかぎの形の短剣。ときどき敵の動きを止める。' },
  // 3階（休み所）
  p6t_tower_robe: { ...A('robe', 4, K[3]), ...TK, name: '時計塔のローブ', bonus: { mag: 24, heal: 24 }, resist: { dark: 0.8, confuse: 0.6 }, desc: '時計塔の番人が着ていた、文字ばんのもようのローブ。魔力が上がり、混乱しにくい。' },
  p6t_cog_fan: { ...W('fan', 4, K[3]), ...TK, name: 'からくりのおうぎ', bonus: { agi: 18, mag: 12 }, resist: { bolt: 0.85 }, desc: '歯車のほねのおうぎ。ひらくと、カシャカシャと歯車が回る。' },
  // 4階
  p6t_dial_shield: { ...S(4, K[4]), ...TK, name: '文字ばんのたて', bonus: { hp: 32 }, resist: { bolt: 0.8, dark: 0.85 }, desc: '大時計の文字ばんでつくったたて。雷に強く、闇に少し強い。' },
  p6t_spring_whip: { ...W('whip', 4, K[4]), ...TK, name: 'ばねのムチ', bonus: { agi: 12 }, onHit: { status: 'confuse', chance: 0.1 }, desc: 'びよーんとのびる、ばねのムチ。ときどき敵を混乱させる。' },
  // 5階（中ボスの 間の 前）
  p6t_tower_mail: { ...A('heavy', 4, K[5]), ...TK, name: '時計塔のよろい', bonus: { hp: 50, agi: -2 }, resist: { bolt: 0.8, blast: 0.85 }, desc: '時計塔の歯車の鉄をたたいてつくったよろい。雷に強く、爆発に少し強い。' },
  p6t_tower_sword: { ...W('sword', 4, K[5]), ...TK, name: '時計塔の剣', bonus: { str: 12, agi: 10 }, resist: { dark: 0.7, bolt: 0.85 }, desc: '止まった時計塔にねむっていた、長い針の形の剣。闇に強く、雷に少し強い。' },
};

// ───── ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // カリヨン: 1人 1つの アクセサリー（drops.boss）と、かねつきの大オノ（drops.rare の 1回に 1回。今までで いちばん 強い オノ）
  p6t_bell_charm: {
    ...C(3), ...PB, boss: 'carillon', unique: true, name: '時のかねのお守り', bonus: { hp: 84, str: 20, def: 18, mag: 18, agi: 18, heal: 16 }, resist: { dark: 0.6, confuse: 0.5, sleep: 0.5, paralyze: 0.6 },
    desc: 'カリヨンの小さなかねでつくったお守り。ふると、時のかねの音がする。だれでも装備でき、すべての力が大きく上がる。',
  },
  p6t_bell_axe: {
    ...W('axe', 5, 1.46), ...PB, boss: 'carillon', name: 'かねつきの大オノ', bonus: { str: 14, agi: -2 }, crit: 0.04, resist: { dark: 0.7, bolt: 0.8 },
    desc: 'カリヨンのかねつきハンマーをきたえなおした大オノ。今までのどのオノよりも強い。会心が出やすい。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}

export const ITEMS_TOKEI = { ...TREASURE, ...BOSS };

// 時計塔の 宝箱（階ごとに 2つ。1階から じゅんに 強く なる）
export const TOWER_TREASURE_FLOORS = {
  1: ['p6t_gear_ring', 'p6t_hand_boomerang'],
  2: ['p6t_spring_hat', 'p6t_wind_dagger'],
  3: ['p6t_tower_robe', 'p6t_cog_fan'],
  4: ['p6t_dial_shield', 'p6t_spring_whip'],
  5: ['p6t_tower_mail', 'p6t_tower_sword'],
};

// ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー, 武器]）
export const TOKEI_DROPS = { carillon: ['p6t_bell_charm', 'p6t_bell_axe'] };

// 第2部 第6章 Step 6: 時計塔 6〜10階の 宝箱・第6章クリアの 武器（名前の 約束 docs/plan-ch6.md の 17）。中みは items-tokei6.js
export { TOKEI_TREASURE_HIGH, C6_CLEAR_WEAPONS, c6ClearPick, TOKEI6_DROPS } from './items-tokei6.js?v=cc4d7c14aec3';

// 読みがな（あいうえお順の ならびかえ）
export const TOKEI_ITEM_KANA = {
  p6t_gear_ring: 'はぐるまのゆびわ', p6t_hand_boomerang: 'とけいのはりのぶーめらん', p6t_spring_hat: 'ぜんまいのぼうし', p6t_wind_dagger: 'ねじまきのたんけん',
  p6t_tower_robe: 'とけいとうのろーぶ', p6t_cog_fan: 'からくりのおうぎ', p6t_dial_shield: 'もじばんのたて', p6t_spring_whip: 'ばねのむち',
  p6t_tower_mail: 'とけいとうのよろい', p6t_tower_sword: 'とけいとうのけん', p6t_bell_charm: 'ときのかねのおまもり', p6t_bell_axe: 'かねつきのおおおの',
};
