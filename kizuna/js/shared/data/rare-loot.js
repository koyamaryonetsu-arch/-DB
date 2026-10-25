// レア度と、レア装備が 手に入る 所（第31回 C）
//   ・宝の洞窟の 宝箱 … 地図の 名前の ことば（大地・氷・炎 …）に ちなんだ 装備。地図の レベルが 高いほど 強い（data/treasure.js の chestLoot）
//   ・物語の ボス … そのボスに ちなんだ 装備を かならず（第32回。BOSS_RARE_N 回に 1回 ＝ 1。loot.js）。強さは その章の 店と おなじ くらい
//   ・ふつうの 魔物 … その地方に 合った 装備を まれに（REGION_RARE_N 体に 1体。第32回 500。loot.js）
//   ・ひみつのダンジョン … ここだけの ★4〜★5（深いほど 強い。20階から。休み所の ごほうび・魔物・番人。data/secret.js・loot.js）
//   ・店の 品は レア度なし（0）
import { ITEMS, baseItemId } from './items.js?v=521ab50e1f2b';
import { MONSTERS } from './monsters.js?v=521ab50e1f2b';
import { RARITY_OVERRIDE, defaultRarity, starsFor, isShopGear } from './items-rare.js?v=521ab50e1f2b';

export const RARITY_MAX = 5;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EQUIP_TYPES = ['weapon', 'armor', 'shield', 'head', 'acc'];

// その 品の レア度（0〜5。きたえた 装備は もとの 装備。装備で ない 物は 0）
export function rarityOf(id) {
  const bid = baseItemId(id);
  const it = ITEMS[bid];
  if (!it || !EQUIP_TYPES.includes(it.type)) return 0;
  if (Number.isInteger(it.rarity)) return clamp(it.rarity, 0, RARITY_MAX);
  // あとから 足された 品（ほかの 担当の 品など）
  return RARITY_OVERRIDE[bid] ?? defaultRarity(it);
}
// ★の 数（強さ。第35回）: 店の 品 1・店では 買えない 品は ランクで 2〜5（items-rare.js の starsFor）。装備で ない 物は 0
export function starsOf(id) {
  return starsFor(ITEMS[baseItemId(id)]);
}
export const rarityStars = (id) => '★'.repeat(starsOf(id));
// 店で 買える 装備か（★1。きたえられない）
export const isShopItem = (id) => isShopGear(ITEMS[baseItemId(id)]);

// めずらしさの 文（説明に 出す。店の 品は ''）。ネタバレに ならない ように「どこで」だけ
const SRC_TEXT = {
  tm: '宝の洞窟でしか手に入らない', boss: 'ボスからしか手に入らない', region: '魔物がまれに落とす', sd: 'ひみつのダンジョンでしか手に入らない',
  alchemy: 'れん金でしか作れない', reborn: 'ふつうには手に入らない', ruin: '神殿の宝箱でしか手に入らない', memory: '迷宮の宝箱でしか手に入らない',
  // 第5章 Step 6・7（items-earth.js）: 大地の神殿の 宝箱・ボスが まれに 落とす 品（ノクトの紋章）・みんなが くれる 品
  earth: '大地の神殿の宝箱でしか手に入らない', bossrare: 'ボスがまれに落とす', gift: 'たくされた品（ほかでは手に入らない）',
  // 第5章 Step 8（items-castle.js）: 影の城の 宝箱・3人の まぼろしが かならず 落とす 品
  castle: '影の城の宝箱でしか手に入らない', phantom: 'まぼろしからしか手に入らない',
  // 第2部 第6章 Step 1・2（items-past.js）: 千年前の 宝箱・サンドクロックと ギアドンの 品
  past: '千年前の宝箱でしか手に入らない', pastboss: '時の魔物からしか手に入らない',
  // 第2部 第6章 Step 3・4（items-road.js）: 星めぐりの古道の 宝箱
  road: '星めぐりの古道の宝箱でしか手に入らない',
  // 第37回 B: カジノの 景品（宝の地図の 段で ふえる）・すごろくの ゴールや 宝箱
  casino: 'カジノの景品でしか手に入らない', sugoroku: 'すごろくでしか手に入らない',
  // 第37回 A: サファラ闘技場の ごほうび（items-arena.js）
  arena: '闘技場のごほうびでしか手に入らない',
  // 第5章 Step 9（items-final.js）: 魔王ソリトゥスの いちばん 強い ★5
  final: '魔王ソリトゥスからしか手に入らない',
};
export function rareWhereText(id) {
  const it = ITEMS[baseItemId(id)];
  if (!it || !EQUIP_TYPES.includes(it.type) || isShopGear(it)) return '';
  if (SRC_TEXT[it.src]) return SRC_TEXT[it.src];
  if (it.forge) return 'ふしぎなかじで作る';
  return '店では買えない';
}

// とくせいの 文（「炎に強い・ねむりにくい・会心が出やすい・行動するとMP+1・ときどき毒」）
const EL = { fire: '炎', ice: '氷', wind: '風', blast: '爆発', bolt: '雷', light: '光', dark: '闇', void: '消滅' };
const ST = { sleep: 'ねむり', paralyze: 'マヒ', confuse: '混乱', blind: 'マヌーサ', silence: 'マホトーン', poison: '毒' };
export function traitText(id) {
  const it = ITEMS[id];
  if (!it) return '';
  const out = [];
  const res = Object.entries(it.resist || {});
  const els = res.filter(([k, v]) => EL[k] && v < 1).map(([k]) => EL[k]);
  if (els.length) out.push(`${els.join('・')}に強い`);
  const sts = res.filter(([k, v]) => ST[k] && v < 1).map(([k]) => ST[k]);
  if (sts.length) out.push(`${sts.join('・')}にかかりにくい`);
  if (it.crit > 0) out.push(`会心が出やすい（+${Math.round(it.crit * 100)}%）`);
  if (it.mpRegen > 0) out.push(`行動するたびにMP+${it.mpRegen}`);
  if (it.onHit && ST[it.onHit.status]) out.push(`ときどき敵を${ST[it.onHit.status]}に`);
  return out.join('・');
}

// レア装備（items-rare.js。きたえた 装備は のぞく）
let cache = null;
function lists() {
  if (cache) return cache;
  const all = Object.entries(ITEMS).filter(([, it]) => it && it.src && !it.base && EQUIP_TYPES.includes(it.type));
  cache = {
    tm: all.filter(([, it]) => it.src === 'tm').map(([id]) => id),
    boss: all.filter(([, it]) => it.src === 'boss').map(([id]) => id),
    region: all.filter(([, it]) => it.src === 'region').map(([id]) => id),
    sd: all.filter(([, it]) => it.src === 'sd').map(([id]) => id),
  };
  return cache;
}
export const rareIds = (src) => lists()[src] || [];

// ───────────── 宝の洞窟 ─────────────
// 地図の 名前の ことば（data/treasure.js の TM_THEMES の words）→ 装備の なかま
export const TM_WORD_GROUP = { 大地: 'rock', 岩: 'rock', まぼろし: 'mirage', ねむり: 'sleep', ひみつ: 'secret', 古代: 'ancient' };
// 氷・炎の 洞窟は ことばに かかわらず その なかま
export const TM_THEME_GROUP = { ice: 'ice', lava: 'fire' };
// 土の 洞窟の なかま（ことばの なかまが 足りない ときは 土の なかま 全部から）
export const TM_THEME_GROUPS = { earth: ['rock', 'mirage', 'sleep', 'secret', 'ancient'], ice: ['ice'], lava: ['fire'] };
export function tmGroupOf(theme, word) {
  return TM_THEME_GROUP[theme] || TM_WORD_GROUP[word] || 'rock';
}
// 地図の レベル → 装備の ランク（Lv1 2・Lv4 4・Lv6 5・Lv8 6・Lv10 7・Lv12〜 8）
// 第5章（店は ランク7）で 地図 Lv10〜12 なら、店と おなじ〜1つ 上
export const tmGearRank = (lv) => clamp(2 + Math.floor((lv || 1) / 2), 2, 8);
// レア度の 出やすさ（normal: ふつうの 宝箱 / bossA: 主の 宝箱）
export function tmRarityWeights(lv, kind = 'normal') {
  if (kind === 'bossA') return [{ k: 2, w: 2 }, { k: 3, w: 5 }, { k: 4, w: lv >= 6 ? 3 : 1 }];
  return [{ k: 2, w: 6 }, { k: 3, w: lv >= 4 ? 3 : 1 }, { k: 4, w: lv >= 8 ? 1 : 0 }].filter((x) => x.w > 0);
}
// 宝箱の レア装備を 1つ（cave: { theme, word }。なければ 土の 洞窟）
export function pickTmGear(rng, lv, cave = null, kind = 'normal') {
  const theme = cave?.theme && TM_THEME_GROUPS[cave.theme] ? cave.theme : 'earth';
  const grp = tmGroupOf(theme, cave?.word);
  const R = tmGearRank(lv);
  const weights = tmRarityWeights(lv, kind);
  const rar = rng.weighted(weights).k;
  const top = Math.max(...weights.map((x) => x.k));
  const ids = rareIds('tm');
  const inTheme = (it) => TM_THEME_GROUPS[theme].includes(it.grp);
  const near = (it, d) => it.rank >= R - d && it.rank <= R;
  // おなじ なかま・ランクの 近い 物を いちばんに（レア度は となりまで ゆるめる）。なければ 洞窟の しゅるい ぜんぶから
  const tries = [
    (it) => it.grp === grp && it.rarity === rar && near(it, 1),
    (it) => it.grp === grp && Math.abs(it.rarity - rar) <= 1 && it.rarity <= top && near(it, 1),
    (it) => it.grp === grp && it.rarity <= top && near(it, 2),
    (it) => inTheme(it) && it.rarity <= top && near(it, 1),
    (it) => inTheme(it) && it.rank <= R,
    (it) => it.rank <= R,
  ];
  for (const ok of tries) {
    const list = ids.filter((id) => ok(ITEMS[id]));
    if (list.length) return rng.pick(list);
  }
  return null;
}
// こうふくの靴（B が 作る。まだ ない ときは 出さない）。主の 宝箱で まれに・ふつうの 宝箱で ごくまれに
export const LUCKY_SHOES = 'koufuku_kutsu';
export function luckyShoesRate(lv, kind = 'normal') {
  if (!ITEMS[LUCKY_SHOES]) return 0;
  if (kind === 'bossA') return lv >= 4 ? 0.04 + lv * 0.005 : 0;
  return lv >= 6 ? 0.03 : 0;
}

// ───────────── ボス・ふつうの 魔物 ─────────────
// ボスが かならず 落とす（第32回。前は 4回に 1回）
export const BOSS_RARE_N = 1;
export function bossRareOf(species) {
  return rareIds('boss').find((id) => ITEMS[id].boss === species) || null;
}
// ふつうの 魔物が まれに 落とす（第32回: 500体に 1体。前は 200体）。地方は 魔物の レベルで（ミドリナ 〜9・海 〜16・シロガネ 〜28・コガネ 〜38・星の塔 39〜）
export const REGION_RARE_N = 500;
export function regionOf(species) {
  const m = MONSTERS[species];
  if (!m || m.boss || m.breedOnly || !(m.exp > 0) || String(species).startsWith('tm_')) return 0;
  // 第5章 Step 3・4: 雲の上の 魔物は 地方 6（空の レア。monsters-kumoi.js の region）
  if (m.region) return m.region;
  const lv = m.lv || 1;
  return lv <= 9 ? 1 : lv <= 16 ? 2 : lv <= 28 ? 3 : lv <= 38 ? 4 : 5;
}
export function regionRareList(species) {
  const r = regionOf(species);
  return r ? rareIds('region').filter((id) => ITEMS[id].region === r) : [];
}

// ───────────── ひみつのダンジョン ─────────────
// 階 → 装備の ランク（20階から。20〜29階 5・30階 6・40階 7・50階 8・60階 9・70階から 10）。20階より 上は 0（出ない）
export const SD_GEAR_FROM = 20;
export const sdGearRank = (f) => (f >= SD_GEAR_FROM ? clamp(5 + Math.floor((f - SD_GEAR_FROM) / 10), 5, 10) : 0);
// レア度: ランク7までは ★4・50階（ランク8）は ★4 か ★5・60階から ★5
export function sdRarityWeights(f) {
  const R = sdGearRank(f);
  if (R <= 7) return [{ k: 4, w: 1 }];
  if (R === 8) return [{ k: 4, w: 3 }, { k: 5, w: 1 }];
  return [{ k: 5, w: 1 }];
}
export function pickSdGear(rng, f) {
  const R = sdGearRank(f);
  if (!R) return null;
  const rar = rng.weighted(sdRarityWeights(f)).k;
  const ids = rareIds('sd');
  const tries = [
    (it) => it.rarity === rar && it.rank >= R - 1 && it.rank <= R,
    (it) => it.rank >= R - 1 && it.rank <= R,
    (it) => it.rank <= R,
  ];
  for (const ok of tries) {
    const list = ids.filter((id) => ok(ITEMS[id]));
    if (list.length) return rng.pick(list);
  }
  return null;
}
// ひみつのダンジョンの 魔物が 落とす（ふつうの 魔物 150体に 1体・番人 3回に 1回）
export const SD_DROP_N = 150;
export const SD_GUARD_DROP_N = 3;
