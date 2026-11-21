// 第3部 第2章 第1幕「赤と緑」の 品（B: 品。items.js で まぜる。A が 宝箱・台本・店で 使う）
// 名前の 約束（docs/plan-part3-c10a.md の 13-6・plan-ch7.md の 4-4）:
//   C10A_TREASURE … 宝箱の 中み（{ 宝箱の id: [品, 数] }。宝箱の id は A班が この 名前で 置く）
//     赤 c10r_c1〜c10r_c6 ／ 緑 c10g_c1〜c10g_c6 ／ おまけの 部屋 c10r_bonus（赤の 道。緑の 音で つるが のびる かべの 先）・c10g_bonus（緑の 道。赤の 音で 火の 花が さく 所）
//     ★5 の 装備は 赤 2つ（k 2.26〜2.28）・緑 2つ（k 2.28〜2.30）・おまけに 1つずつ。のこりは 素材か 道具
//   c10aChest(id) → { item, n }（ない ときは null）
//   NOTE_RE（note_re）・NOTE_FA（note_fa）… だいじな 物「星の音（レ）」「星の音（ファ）」（使い方は A班）
//   C10A_SHOP_ADD … ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1・k 2.16〜2.18。4つ。A が 幕の クリアの あとの 店に 足す）
//
// ・宝箱（src: 'c10r'「炎の山の下の古い道の宝箱でしか手に入らない」・'c10g'「根の国の宝箱でしか手に入らない」）: 装備は ランク10の ★5（レア度 4）
//   武器は 作らない（前の 章の「その 種類で いちばん 強い 武器」の テストに まざらない ため）。店の 品も 防具だけ
// ・中ボスの 品（src: 'pastboss'）: かならず 1人 1つの アクセサリー（レア度 3）。よい 力の 合計は 287 まで（test/gear-r88.test.js）
// ・水に 強い 装備は 作らない（第47回の 4つだけの きまり。test/water-r47.test.js）
// ・前の 章の「店の いちばん よい 品」に まざらない ように、items.js の PART3_LATE_ITEMS に 入れる
// id の 先頭: c10rt_・c10gt_（宝箱）・c10as_（店）・c10rb_・c10gb_（中ボス）… 魔物の id（c10r_・c10g_）と かさならない ように

// 強さの めやす（items-c9c.js と おなじ。ランク 0〜10）
const CLOTH = [0, 5, 10, 14, 17, 22, 27, 33, 39, 46, 54];
const ARMOR_K = { cloth: 1, heavy: 1.65, robe: 1.1, gi: 1.2 };
const RAR_K = [1, 1, 1.04, 1.08, 1.12, 1.15];
const SELL = [0, 60, 150, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500];
const R = 10;
// rarity … レア度（店 0・宝箱 4）。k … 強さの かけ算
const A = (armorType, rarity, k) => ({ type: 'armor', armorType, rank: R, rarity, def: Math.round(CLOTH[R] * ARMOR_K[armorType] * RAR_K[rarity] * k) });
const H = (helm, rarity, k) => ({ type: 'head', rank: R, rarity, ...(helm ? { helm: true } : {}), def: Math.round(CLOTH[R] * (helm ? 0.6 : 0.4) * RAR_K[rarity] * k) });
const S = (rarity, k) => ({ type: 'shield', rank: R, rarity, def: Math.round(CLOTH[R] * RAR_K[rarity] * k) });
const C = (rarity = 4) => ({ type: 'acc', rank: R, rarity });

// 宝箱の ★5 の かけ算（赤 2.26〜2.28・緑 2.28〜2.30・おまけ）・店の かけ算
export const C10A_K = { r2: 2.26, r5: 2.28, g3: 2.28, g6: 2.3, rBonus: 2.27, gBonus: 2.29 };
export const C10A_SHOP_K = { lo: 2.16, mid: 2.17, hi: 2.18 };
const K = C10A_K, SK = C10A_SHOP_K;

// ───── ながれ星のくぼ地の 武具屋に 足す 品（ランク10・★1。幕の クリアの あと）─────
const SHOP = {
  c10as_mail: { ...A('heavy', 0, SK.lo), name: 'ふた色のよろい', price: 43800, bonus: { hp: 20 }, desc: '赤と緑の、2つの星の音の色にそめた、よろい。HPが少し上がる。' },
  c10as_robe: { ...A('robe', 0, SK.mid), name: 'ふた色のローブ', price: 41600, bonus: { mag: 8 }, desc: '赤と緑の糸で、ていねいにおったローブ。魔力が少し上がる。' },
  c10as_shield: { ...S(0, SK.mid), name: 'ふた色のたて', price: 40800, desc: '赤と緑の、2つの星がならんだ、まるいたて。' },
  c10as_helm: { ...H(true, 0, SK.hi), name: 'ふた色のかぶと', price: 42200, bonus: { def: 6 }, desc: '赤と緑の、はねかざりのついたかぶと。守りが少し上がる。' },
};

const TR = { src: 'c10r' };
const TG = { src: 'c10g' };
const TREASURE = {
  // 赤: 炎の山の 下の 古い 道
  c10rt_lava_mail: { ...A('heavy', 4, K.r2), ...TR, name: 'ようがん石のよろい', bonus: { hp: 56, def: 8 }, resist: { fire: 0.8 }, desc: '冷えたようがんの、黒い石をつないだよろい。HPと守りが上がる。炎に強い。' },
  c10rt_road_helm: { ...H(true, 4, K.r5), ...TR, name: '古道の番人のかぶと', bonus: { hp: 50, str: 12 }, resist: { fire: 0.85 }, desc: '古い道を守っていた番人の、赤いかざりのかぶと。HPと力が上がる。炎に少し強い。' },
  // おまけの 部屋（赤の 道。緑の 音で つるが のびる かべの 先）
  c10rt_vine_gi: { ...A('gi', 4, K.rBonus), ...TR, name: 'つるまきの道着', bonus: { agi: 16, str: 14 }, resist: { fire: 0.85, wind: 0.9 }, desc: '緑のつるが、くるくるまきついた道着。素早さと力が上がる。炎に少し強い。' },
  // 緑: 大地の下の 根の国
  c10gt_root_robe: { ...A('robe', 4, K.g3), ...TG, name: '根の国のローブ', bonus: { mag: 18, heal: 16 }, resist: { poison: 0.7, sleep: 0.8 }, desc: '光るほうしのもようの、やわらかいローブ。魔力と回復の力が上がる。毒とねむりに強い。' },
  c10gt_tree_shield: { ...S(4, K.g6), ...TG, name: '大木のたて', bonus: { hp: 54 }, resist: { wind: 0.85, light: 0.9 }, desc: '根の国の大木の、かたい木の皮でできたたて。HPが上がる。風に少し強い。' },
  // おまけの 部屋（緑の 道。赤の 音で 火の 花が さく 所）
  c10gt_flower_hat: { ...H(false, 4, K.gBonus), ...TG, name: '火の花のぼうし', bonus: { hp: 48, mag: 14, heal: 12 }, resist: { ice: 0.85 }, desc: 'こおったつぼみが、ぱっと開いた火の花のぼうし。HPと魔力が上がる。氷に少し強い。' },
};

// ───── 中ボスの 品（src: 'pastboss'。かならず 1つずつ）─────
const PB = { src: 'pastboss' };
const BOSS = {
  // ドクター・タマゴン: はつめいの ゴーグル
  c10rb_goggles: {
    ...C(3), ...PB, boss: 'c10r_tamagon', unique: true, name: 'はつめいゴーグル', bonus: { hp: 128, str: 34, def: 32, mag: 33, agi: 32, heal: 28 }, resist: { fire: 0.8, blind: 0.6 },
    desc: 'タマゴンが、おとしていった大きなゴーグル。だれでも装備でき、すべての力が大きく上がる。炎に強い。',
  },
  // カビだんしゃく モルド: かため めがね
  c10gb_monocle: {
    ...C(3), ...PB, boss: 'c10g_mold', unique: true, name: 'だんしゃくのかためがね', bonus: { hp: 126, str: 32, def: 34, mag: 35, agi: 30, heal: 30 }, resist: { poison: 0.6, dark: 0.85 },
    desc: 'モルドが、おとしていった金のふちのかためがね。だれでも装備でき、すべての力が大きく上がる。毒に強い。',
  },
};

// ───── だいじな 物（A班が 台本で わたす・使う）─────
export const NOTE_RE = 'note_re';
export const NOTE_FA = 'note_fa';
const KEY = {
  [NOTE_RE]: {
    name: '星の音（レ）', type: 'key',
    desc: '炎の山の下の、熱の間にうかんでいた、赤い光の玉。耳をすますと「レ」の音がする。',
  },
  [NOTE_FA]: {
    name: '星の音（ファ）', type: 'key',
    desc: '根の国の大木の、うろの中にあった、緑の光の玉。耳をすますと「ファ」の音がする。',
  },
};

for (const it of [...Object.values(TREASURE), ...Object.values(BOSS)]) {
  it.price = 0;
  it.sell = Math.round(SELL[Math.min(10, it.rank)] * (0.7 + 0.15 * it.rarity) / 10) * 10;
}
export const ITEMS_C10A = { ...SHOP, ...TREASURE, ...BOSS, ...KEY };

// 宝箱の 中み（{ 宝箱の id: [品, 数] }）
export const C10A_TREASURE = {
  // 赤
  c10r_c1: ['toku_herb', 3],
  c10r_c2: ['c10rt_lava_mail', 1],
  c10r_c3: ['magic_water', 3],
  c10r_c4: ['land_shard', 3],
  c10r_c5: ['c10rt_road_helm', 1],
  c10r_c6: ['elf_drink', 2],
  // 緑
  c10g_c1: ['jou_herb', 4],
  c10g_c2: ['star_sand', 3],
  c10g_c3: ['c10gt_root_robe', 1],
  c10g_c4: ['revive_flower', 2],
  c10g_c5: ['silver_shard', 3],
  c10g_c6: ['c10gt_tree_shield', 1],
  // おまけの 部屋
  c10r_bonus: ['c10rt_vine_gi', 1],
  c10g_bonus: ['c10gt_flower_hat', 1],
};
export const C10A_CHEST_LIST = Object.keys(C10A_TREASURE);
// ★5 の 装備が 入って いる 宝箱（赤 2・緑 2・おまけ 2）
export const C10A_GEAR_CHESTS = { red: ['c10r_c2', 'c10r_c5'], green: ['c10g_c3', 'c10g_c6'], bonus: ['c10r_bonus', 'c10g_bonus'] };
// 宝箱の id → { item, n }（A の マップ用。ない ときは null）
export function c10aChest(id) {
  const e = C10A_TREASURE[id];
  return e ? { item: e[0], n: e[1] || 1 } : null;
}

// 中ボスが かならず 落とす 品（ボスの ID → [1人 1つの アクセサリー]）
export const C10A_DROPS = { c10r_tamagon: ['c10rb_goggles'], c10g_mold: ['c10gb_monocle'] };

// くぼ地の 武具屋に 足す 品（A が 幕の クリアの あとの 店に 足す。防具 4つ）
export const C10A_SHOP_ADD = ['c10as_mail', 'c10as_robe', 'c10as_shield', 'c10as_helm'];

// 読みがな（あいうえお順の ならびかえ）
export const C10A_ITEM_KANA = {
  c10as_mail: 'ふたいろのよろい', c10as_robe: 'ふたいろのろーぶ', c10as_shield: 'ふたいろのたて', c10as_helm: 'ふたいろのかぶと',
  c10rt_lava_mail: 'ようがんせきのよろい', c10rt_road_helm: 'こどうのばんにんのかぶと', c10rt_vine_gi: 'つるまきのどうぎ',
  c10gt_root_robe: 'ねのくにのろーぶ', c10gt_tree_shield: 'たいぼくのたて', c10gt_flower_hat: 'ひのはなのぼうし',
  c10rb_goggles: 'はつめいごーぐる', c10gb_monocle: 'だんしゃくのかためがね',
  [NOTE_RE]: 'ほしのおとれ', [NOTE_FA]: 'ほしのおとふぁ',
};
