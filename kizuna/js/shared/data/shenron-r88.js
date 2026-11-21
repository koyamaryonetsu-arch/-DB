// 第88回 G9班: ドラゴンボール 7つと 神龍の ねがい（docs/plan-r88-anime-gear.md の 3-1・5-1。設計書の「実装メモ（G9班）」）
//
//   1. 7つの 玉 … 世界の 7つの ダンジョンの 宝箱に 1つずつ（キャラごとに 1回。c.chests の r88db_<n>）。
//      YAIBA の 七つの玉（data/gacha-r88.js の ORB_PLACES）とは べつの 場所
//   2. ドラゴンレーダー（品）を 持って いると、まだ 見つけて いない 玉の ある 地方が、冒険のしおりと さいだんで わかる
//   3. 7つ そろえて 星見の丘の さいだん（SHENRON）へ → 神龍が 出て ねがいを 1つ:
//      作品の 名品（★4。ガチャガチャに 出る 名品）の 中から 好きな 品を 1つ（作品 → 品の じゅんに えらぶ）
//   4. ねがいの あと 7つの 玉は なくなり、宝箱は また 開けられる ように なる。ただし 玉は 石に なって ねむるので、
//      ねがいから 現実の 時間で WISH_WAIT_DAYS 日 たつまで 宝箱は 空っぽ（回しすぎを ふせぐ）
//   セーブ: c.chests.r88db_<n>（ふつうの 宝箱と 同じ）・c.flags.r88_wish_at（さいごに ねがった 時こく。ミリ秒）・c.flags.r88_wish_n（ねがった 回数）。
//   どれも 今の 形の まま 引っこしコードで 運べる（transfer-prime.js は かえない）
//   この ファイルは データと きまりだけ（だいほんは world/shenron-r88.js）
import { ITEMS, SLOTS, baseItemId } from './items.js?v=c53292a2af59';
import { WORKS } from './works.js?v=c53292a2af59';
import { gachaWorks, gachaPool } from './gacha-r88.js?v=c53292a2af59';
import { DRAGON_BALLS } from './items-r88-dragonball.js?v=c53292a2af59';

export { DRAGON_BALLS };
export const DRAGON_RADAR = 'r88_db_radar';
// ねがいの あと、玉の 宝箱が また 開けられる ように なるまでの 日数（現実の 時間）
export const WISH_WAIT_DAYS = 7;
export const WISH_WAIT_MS = WISH_WAIT_DAYS * 24 * 60 * 60 * 1000;
export const WISH_AT_FLAG = 'r88_wish_at';
export const WISH_N_FLAG = 'r88_wish_n';

// 玉の 宝箱（map・x・y … マス / area … ドラゴンレーダーで わかる 地方 / where … しおりの 場所の 名前〈見つけた あと〉）
export const DB_PLACES = [
  { id: '1', item: DRAGON_BALLS[0], map: 'star_tower_4f', x: 20, y: 13, area: 'ミドリナ地方', where: '星の塔' },
  { id: '2', item: DRAGON_BALLS[1], map: 'tower_3f', x: 1, y: 1, area: '風の海', where: '嵐の塔' },
  { id: '3', item: DRAGON_BALLS[2], map: 'mine2', x: 22, y: 2, area: 'シロガネ地方', where: 'カナトコ鉱山' },
  { id: '4', item: DRAGON_BALLS[3], map: 'pyramid3', x: 15, y: 1, area: 'コガネ地方', where: '王家のピラミッド' },
  { id: '5', item: DRAGON_BALLS[4], map: 'earth_3f', x: 18, y: 12, area: 'クモイ地方', where: '大地の神殿' },
  { id: '6', item: DRAGON_BALLS[5], map: 'peak3', x: 23, y: 9, area: 'シロガネ地方', where: '星竜山' },
  { id: '7', item: DRAGON_BALLS[6], map: 'sand_castle2', x: 24, y: 15, area: 'コガネ地方', where: '砂の古城' },
];
export const dbChestId = (p) => `r88db_${p.id}`;
export const dbChestScript = (p) => `r88_dball_${p.id}`;
// 神龍の さいだん（星見の丘。ミドリナ地方の マス）
export const SHENRON = { map: 'overworld', x: 64, y: 79 };

// ───── 玉を 持って いるか（ふくろと 自分の 装備）─────
export function ballHave(c, id) {
  return (c?.items || []).some((e) => e?.id && baseItemId(e.id) === id && e.n > 0) || Object.values(c?.equip || {}).some((x) => x && baseItemId(x) === id);
}
export const ballsHeld = (c) => DRAGON_BALLS.filter((id) => ballHave(c, id)).length;
export const ballsAll = (c) => ballsHeld(c) === DRAGON_BALLS.length;
// 宝箱を 開けた 数（今の ひとめぐり）
export const ballsFound = (c) => DB_PLACES.filter((p) => c?.chests?.[dbChestId(p)]).length;
export const hasRadar = (c) => ballHave(c, DRAGON_RADAR) || (c?.bank?.items || []).some((e) => e?.id && baseItemId(e.id) === DRAGON_RADAR && e.n > 0);
// まだ 見つけて いない 玉の 地方（同じ 地方は 1つに）
export function radarAreas(c) {
  return [...new Set(DB_PLACES.filter((p) => !c?.chests?.[dbChestId(p)]).map((p) => p.area))];
}

// ───── ねがいの あとの 待ち ─────
export function wishWaitLeft(c, now) {
  const at = Number(c?.flags?.[WISH_AT_FLAG]);
  if (!Number.isFinite(at) || at <= 0) return 0;
  return Math.max(0, at + WISH_WAIT_MS - now);
}
export const wishWaitDays = (ms) => Math.max(1, Math.ceil(ms / (24 * 60 * 60 * 1000)));

// ───── ねがいで えらべる 品（ガチャガチャに 出る 名品。作品ごと）─────
export function wishWorks() {
  return gachaWorks().filter((w) => gachaPool(w).mei.length > 0);
}
export function wishItems(work) {
  return WORKS[work] ? [...gachaPool(work).mei] : [];
}
export const canWishItem = (id) => !!ITEMS[id]?.work && wishItems(ITEMS[id].work).includes(id);

// 玉を 1つ 取る（ふくろから。なければ 自分の 装備を はずして）
function takeBall(c, id, removeItem) {
  const e = (c.items || []).find((x) => x?.id && baseItemId(x.id) === id && x.n > 0);
  if (e && removeItem(c, e.id, 1)) return true;
  for (const sl of SLOTS) {
    if (c.equip?.[sl] && baseItemId(c.equip[sl]) === id) {
      c.equip[sl] = null;
      return true;
    }
  }
  return false;
}
// ねがいを かなえる（純粋な しょり。dep … { addItem, removeItem }〈stats.js〉）。できた ときは true
//   7つの 玉が なくなり・えらんだ 品が 1つ ふえ・玉の 宝箱が また 開けられる ように なる（WISH_WAIT_DAYS 日 たってから）
export function grantWish(c, id, now, dep) {
  if (!c || !ballsAll(c) || !canWishItem(id)) return false;
  for (const b of DRAGON_BALLS) takeBall(c, b, dep.removeItem);
  dep.addItem(c, id, 1);
  c.chests = c.chests && typeof c.chests === 'object' ? c.chests : {};
  for (const p of DB_PLACES) delete c.chests[dbChestId(p)];
  c.flags = c.flags || {};
  c.flags[WISH_AT_FLAG] = Math.floor(now);
  c.flags[WISH_N_FLAG] = (Number(c.flags[WISH_N_FLAG]) || 0) + 1;
  return true;
}
