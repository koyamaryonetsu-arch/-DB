// 第88回 G4班: 作品を 思い出す 装備の 手に入れ方（docs/plan-r88-anime-gear.md の 7。設計書の「実装メモ（G4班）」）
//
//   1. 作品の ガチャガチャ … ルミナの町（星の神殿の 東）と 王都サファラ（市場）。ゴールドで 回す（world/gacha-r88.js）
//   2. はじめの 品（格 'shop'）… 作品の 基本職が 始まる ころの 店に ならべる（addR88Shops。shops.js が よぶ）
//   3. 七つの玉 … 世界の 7つの 場所の 宝箱（キャラごとに 1回。maps/gacha-r88.js）→ 竜神の ほこらで 竜神の玉と 引きかえ
//   4. 宝の 入れ物 … ひみつのダンジョンの 深い 階・宝の洞窟の 高い レベルの 宝箱に、名品（★4）が まれに
//   5. 試練の ごほうび … works.js の trialGift（{ 職業の id: 品の id }）。一の試練を こえると もらえる
//
// ガチャに 入る 品は、品の データから 自動で きまる（gachaBlock）。あとの 係が 品を 足すと 自動で 入る
//   入らない 物: 作品の 品で ない・伝説（den）・はじめの 品（shop）・生まれ変わりの 先（REBIRTH の to）・
//   ライバルが くれる 品（7-1。data/rivals-r88.js の RIVALS の reward・addRivalGifts・品の rival: true）・そろいで もらう 品（R88_SET_GIFTS）・
//   七つの玉（ORB_PLACES）・試練の ごほうび（trialGift）・品に gacha: false
import { ITEMS, baseItemId } from './items.js';
import { REBIRTH } from './items-alchemy.js';
import { WORKS } from './works.js';
import { RIVALS } from './rivals-r88.js';

// ───────────── ねだん・わりあい ─────────────
// 1回の ねだん（ゴールド。どの 作品も 同じ）。わけは 設計書の「実装メモ（G4班）」
export const GACHA_PRICE = 20000;
// 名品（★4）が 出る わりあい（のこりは ふつう ★2〜3）
export const GACHA_MEI_RATE = 0.2;
// 名品が 出ない まま この 回数 回すと、次は かならず 名品（キャラごと・作品ごと。c.gacha[作品]）
export const GACHA_PITY = 10;
// 同じ 品が 出た 時に もどる お金（はらった お金の 半分）
export const gachaRefund = (price = GACHA_PRICE) => Math.floor(price / 2);

// ───────────── 入らない 物 ─────────────
// ライバルの まぼろしが くれる 品（7-1）は G3班の data/rivals-r88.js の RIVALS の reward から 読む（rivalGiftIds）。
// ほかに 外したい ライバルの 品が あれば addRivalGifts で 足す（品に rival: true でも よい）
export const R88_RIVAL_GIFTS = new Set();
export const rivalGiftIds = () => new Set([...RIVALS.flatMap((r) => r?.reward || []), ...R88_RIVAL_GIFTS]);
export function addRivalGifts(ids) {
  for (const id of ids || []) if (typeof id === 'string') R88_RIVAL_GIFTS.add(id);
  clearGachaCache();
}
// そろえて もらう 品（七つの玉 → 竜神の玉 など）
export const R88_SET_GIFTS = new Set(['r88_ryujin_orb']);

// ───────────── 七つの玉の 場所（maps/gacha-r88.js が 宝箱を おく。キャラごとに 1回。c.chests の id）─────────────
//   hint … ガチャガチャの 店の 人の うわさ（こたえの 地名は 言わない）
export const ORB_PLACES = [
  { id: 'fire', item: 'r88_orb_fire', map: 'volcano2', x: 34, y: 33, hint: 'ある旅人が言うには、火をふく山の中の、あつい広間で、\n赤くもえる玉を見たそうだよ。' },
  { id: 'water', item: 'r88_orb_water', map: 'overworld', x: 90, y: 81, hint: '鏡みたいにしずかな湖があるだろう？\nその水の中の道の先で、青い玉が光っていたって話さ。' },
  { id: 'ice', item: 'r88_orb_ice', map: 'ice_cave2', x: 12, y: 30, hint: '北の雪の国の、何もかもこおりついたほらあな。\nそのおくで、つめたい玉がねむっているらしい。' },
  { id: 'dark', item: 'r88_orb_dark', map: 'sea_cave', x: 12, y: 21, hint: '波の音がひびく、暗い暗いほらあながあるそうだ。\nそこには、光をすいこむ黒い玉があるとか…。' },
  { id: 'gold', item: 'r88_orb_gold', map: 'overworld', x: 116, y: 17, hint: 'たぬきが化けてすむという、木のしげった森。\nその森の東のおくに、金色の玉がころがっていたそうな。' },
  { id: 'big', item: 'r88_orb_big', map: 'lab_b5', x: 20, y: 14, hint: '砂の国の、地下ふかくの大きな石の像。\nその足もとに、とても大きな玉があるといううわさだよ。' },
  { id: 'tou', item: 'r88_orb_tou', map: 'casino', x: 26, y: 4, hint: '「大当たり！」の声がひびく、にぎやかな所で、\nしゃべる玉を見たって人がいたよ。' },
];
export const orbChestId = (p) => `r88orb_${p.id}`;
export const SEVEN_ORBS = ORB_PLACES.map((p) => p.item);
export const RYUJIN_ORB = 'r88_ryujin_orb';
// 竜神の ほこら（星竜山の 頂上の すみ。maps/gacha-r88.js）
export const HOKORA = { map: 'peak_top', x: 21, y: 3 };

// ───────────── 宝の 入れ物（名品が まれに）─────────────
// ひみつのダンジョンの ごほうびの 宝箱（休み所。★4 が 出る 20階から）: 今の ごほうびに 足す（今の 品は へらない）
export const SD_R88_FROM = 20;
export const sdR88Rate = (f) => (f >= 40 ? 0.08 : f >= SD_R88_FROM ? 0.05 : 0);
// 宝の洞窟の 宝箱（地図 Lv26 から ＝ 深い 宝の洞窟）。今の レア装備・装備の 出やすさ（第64回 ⑥d）は かえない
//   ふつうの 宝箱 … 店の 装備（★1）が 出た 時の 6わりを 名品に（宝箱 ぜんたいの 3% ほど。装備が 出る わりあいは かわらない）
//   2つめの 主の 宝箱（bossB。お金・道具）… 8% を 名品に / 主の 宝箱（bossA。レア装備か 限界の石・素材）… かえない
export const TM_R88_LV = 26;
export const tmR88Rate = (lv, kind = 'normal') => ((lv || 0) < TM_R88_LV ? 0 : kind === 'normal' ? 0.6 : kind === 'bossB' ? 0.08 : 0);

// ───────────── はじめの 品の 店 ─────────────
// 作品の 基本職が 始まる ころの 店（ない 作品は R88_SHOP_DEFAULT）。基本職は どれも さいしょから えらべる ので、
// さいしょの 村の よろず屋（武器・防具・アクセを みな 売る 店）にした
export const R88_SHOP_DEFAULT = 'village';
export const R88_SHOP_OF = {};

// ───────────── 作品の 品を 調べる ─────────────
const GRADE_TIER = { mei: 'mei', fu3: 'fu', fu2: 'fu' };
let cache = null;
export function clearGachaCache() {
  cache = null;
}
function build() {
  const rebirthTo = new Set(Object.values(REBIRTH).map((r) => r?.to).filter(Boolean));
  const trial = new Set();
  for (const w of Object.values(WORKS)) for (const id of Object.values(w?.trialGift || {})) trial.add(id);
  const orbs = new Set(SEVEN_ORBS);
  return { rebirthTo, trial, orbs, rivals: rivalGiftIds(), pools: new Map() };
}
const C = () => (cache ||= build());

// ガチャに 入らない わけ（入る 品は null）
export function gachaBlock(id) {
  const it = ITEMS[id];
  if (!it || !it.work || it.base) return 'notWork';
  if (!WORKS[it.work]) return 'noWork';
  if (it.gacha === false) return 'off';
  if (it.grade === 'den') return 'legend';
  if (it.grade === 'shop') return 'shop';
  if (!GRADE_TIER[it.grade]) return 'grade';
  const c = C();
  if (c.rebirthTo.has(id)) return 'rebirth';
  if (it.rival || c.rivals.has(id)) return 'rival';
  if (R88_SET_GIFTS.has(id)) return 'set';
  if (c.orbs.has(id)) return 'orb';
  if (c.trial.has(id)) return 'trial';
  return null;
}
export const gachaTier = (id) => GRADE_TIER[ITEMS[id]?.grade] || null;

// 作品の ガチャの 品（{ fu: [ふつう], mei: [名品], all }）
export function gachaPool(work) {
  const c = C();
  if (c.pools.has(work)) return c.pools.get(work);
  const fu = [], mei = [];
  if (WORKS[work]) {
    for (const [id, it] of Object.entries(ITEMS)) {
      if (it?.work !== work || gachaBlock(id)) continue;
      (gachaTier(id) === 'mei' ? mei : fu).push(id);
    }
  }
  const pool = { fu, mei, all: [...fu, ...mei] };
  c.pools.set(work, pool);
  return pool;
}
// 今 品が ある 作品（works.js の じゅん。作品が ふえたら 自動で ふえる）
export const gachaWorks = () => Object.keys(WORKS).filter((w) => gachaPool(w).all.length > 0);
// 宝の 入れ物に 入る 名品（ぜんぶの 作品の、ガチャに 入る 名品）
export const r88MeiAll = () => gachaWorks().flatMap((w) => gachaPool(w).mei);

// 1回 引く（rng … 世界の 乱数。pity … 名品が 出ない まま 回した 回数）→ { id, tier }
export function rollGacha(rng, work, pity = 0) {
  const p = gachaPool(work);
  if (!p.all.length) return null;
  let tier;
  if (!p.mei.length) tier = 'fu';
  else if (!p.fu.length) tier = 'mei';
  else if (pity >= GACHA_PITY) tier = 'mei';
  else tier = rng.chance(GACHA_MEI_RATE) ? 'mei' : 'fu';
  return { id: rng.pick(p[tier]), tier };
}

// 宝の洞窟の 宝箱（data/treasure.js の chestLoot）: レア装備で ない 中みを、まれに 名品に かえる
export function r88TmLoot(rng, lv, kind, loot) {
  const rate = tmR88Rate(lv, kind);
  if (!rate || !loot) return loot;
  const it = loot.item ? ITEMS[loot.item] : null;
  const shopGear = !!it && ['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type) && !(it.rarity > 0) && loot.item !== 'koufuku_kutsu';
  // ふつうの 宝箱は 店の 装備だけ・主の 宝箱（bossB）は 装備で ない 物だけ を かえる（レア装備・こうふくの靴・限界の石は そのまま）
  if (kind === 'normal' ? !shopGear : (it && (['weapon', 'armor', 'shield', 'head', 'acc'].includes(it.type) || loot.item === 'limit_stone'))) return loot;
  const list = r88MeiAll();
  if (!list.length || !rng.chance(rate)) return loot;
  return { item: rng.pick(list) };
}
// ひみつのダンジョンの ごほうびの 宝箱（world/secret.js の chestEvent）: 今の ごほうびに 足す（[] か [{ item, n }]）
export function r88SdExtra(f, rng) {
  const rate = sdR88Rate(f);
  const list = rate ? r88MeiAll() : [];
  if (!list.length || !rng.chance(rate)) return [];
  return [{ item: rng.pick(list), n: 1 }];
}

// ───────────── はじめの 品を 店に（data/shops.js が よぶ。何回 よんでも 1回だけ）─────────────
export function r88ShopItems() {
  const out = {};
  for (const [id, it] of Object.entries(ITEMS)) {
    if (!it?.work || it.base || it.grade !== 'shop' || !(it.price > 0)) continue;
    const shop = R88_SHOP_OF[it.work] || R88_SHOP_DEFAULT;
    (out[shop] ||= []).push(id);
  }
  return out;
}
export function addR88Shops(shops) {
  for (const [sid, list] of Object.entries(r88ShopItems())) {
    const shop = shops?.[sid];
    if (!shop || (shop.more || []).some((m) => m.r88)) continue;
    shop.more = [...(shop.more || []), { show: {}, items: [...list], r88: true }];
  }
}

// ───────────── キャラの 記録 ─────────────
// c.gacha … { 作品の id: 名品が 出ない まま 回した 回数 }（セーブ・引っこしコードに そのまま 入る。小さい 数だけ）
export function gachaPity(c, work) {
  const v = c?.gacha?.[work];
  return Number.isFinite(v) ? Math.max(0, Math.min(GACHA_PITY, Math.floor(v))) : 0;
}
// 持って いるか（ふくろ・預かり所・自分と 仲間の 装備。きたえた 品も もとの 品で）
export function ownsR88(c, id) {
  const has = (x) => x && baseItemId(x) === id;
  if ((Array.isArray(c?.items) ? c.items : []).some((e) => e?.n > 0 && has(e.id))) return true;
  if ((Array.isArray(c?.bank?.items) ? c.bank.items : []).some((e) => e?.n > 0 && has(e.id))) return true;
  if (Object.values(c?.equip || {}).some(has)) return true;
  return (Array.isArray(c?.companions) ? c.companions : []).some((e) => Object.values(e?.char?.equip || {}).some(has));
}
// その 作品の 品を いくつ 持って いるか
export function gachaGot(c, work) {
  return gachaPool(work).all.filter((id) => ownsR88(c, id)).length;
}
// ぜんぶ そろったか
export const gachaDone = (c, work) => gachaPool(work).all.every((id) => ownsR88(c, id));

// 試練の ごほうび（works.js の trialGift）: その 職業で もらえる 品（なければ null）
export function trialGiftOf(job) {
  for (const w of Object.values(WORKS)) {
    const id = w?.trialGift?.[job];
    if (id && ITEMS[id]) return id;
  }
  return null;
}
export const trialGiftFlag = (job) => `r88tg_${job}`;

// 七つの玉の 宝箱を 開けた 数（しおり）
export const orbsFound = (c) => ORB_PLACES.filter((p) => c?.chests?.[orbChestId(p)]).length;
