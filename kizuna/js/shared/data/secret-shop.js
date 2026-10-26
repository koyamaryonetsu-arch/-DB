// ひみつのダンジョンの お店の 階（運で 出る。data/secret.js の sdSpecialOf）の 品ぞろえ（2026年10月 第32回 B）
//   ・少し レア度の 高い 装備 3つ（★2〜★3。深いほど ランクと ★が 上がる。items-rare.js の 宝の洞窟・ボス・地方の 品から。
//     ひみつのダンジョンだけの ★4〜★5〈src 'sd'〉は 出さない）
//   ・ここでしか 買えない 回復薬（items-secret.js）を 運しだいで 2〜3こ
//   品ぞろえは その ちょうせんの seed と 階で きまる（いっしょに 入った 家族は おなじ 店）
//   店の 画面は ふつうの お店（client/ui/shop.js）。レア装備は 店の ねだんが ない ので prices で わたす（world/services.js）
import { ITEMS } from './items.js?v=4ed9358095f4';
import { SHOPS } from './shops.js?v=4ed9358095f4';
import { rareIds } from './rare-loot.js?v=4ed9358095f4';
import { SD_POTIONS } from './items-secret.js?v=4ed9358095f4';
import { makeRng } from '../rng.js?v=4ed9358095f4';
import { sdFloorSeed } from './secret.js?v=4ed9358095f4';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const SD_SHOP_KEEPER = 'ふしぎな商人';
export const SD_SHOP_GEAR = 3;

// 装備の ランク（6階 2・16階 4・24階 5・32階 6・40階 7・48階から 8）と レア度の 出やすさ（15階まで ★2 が多い・35階から ★3 が多い）
export const sdShopRank = (f) => clamp(2 + Math.floor(f / 8), 2, 8);
export function sdShopRarityWeights(f) {
  if (f < 15) return [{ k: 2, w: 4 }, { k: 3, w: 1 }];
  if (f < 35) return [{ k: 2, w: 1 }, { k: 3, w: 1 }];
  return [{ k: 2, w: 1 }, { k: 3, w: 4 }];
}
// 店の ねだん（売り値の 4倍。10G きざみ）
export const sdShopPrice = (id) => Math.max(200, Math.round(((ITEMS[id]?.sell || 50) * 4) / 10) * 10);

let gearCache = null;
const shopGear = () => (gearCache ||= [...rareIds('tm'), ...rareIds('boss'), ...rareIds('region')].filter((id) => ITEMS[id] && ITEMS[id].rarity >= 1 && ITEMS[id].rarity <= 3));

// その 店の 品ぞろえ { gear: [...], potions: [...] }
export function sdShopStock(f, seed) {
  const r = makeRng((sdFloorSeed(f, seed) ^ 0x5409) >>> 0);
  const R = sdShopRank(f);
  const all = shopGear();
  const gear = [];
  for (let i = 0; i < SD_SHOP_GEAR * 3 && gear.length < SD_SHOP_GEAR; i++) {
    const rar = r.weighted(sdShopRarityWeights(f)).k;
    let list = all.filter((id) => !gear.includes(id) && ITEMS[id].rarity === rar && ITEMS[id].rank <= R && ITEMS[id].rank >= R - 2);
    if (!list.length) list = all.filter((id) => !gear.includes(id) && ITEMS[id].rank <= R && ITEMS[id].rank >= R - 3);
    if (list.length) gear.push(r.pick(list));
  }
  const potions = r.shuffle(Object.keys(SD_POTIONS)).slice(0, r.chance(0.35) ? 3 : 2);
  return { gear, potions };
}

export const sdShopId = (f, seed) => `sdshop_${f}_${(seed >>> 0).toString(36)}`;
// SHOPS に 入れる（開く たびに よぶ。おなじ 店は おなじ 中み。古い 店は わすれる〈また 開くと おなじ 中みで 作る〉）
const made = [];
export function ensureSdShop(f, seed) {
  const id = sdShopId(f, seed);
  if (SHOPS[id]) return id;
  const { gear, potions } = sdShopStock(f, seed);
  const items = [...potions, ...gear];
  const prices = Object.fromEntries(gear.map((x) => [x, sdShopPrice(x)]));
  // 数えない 形で 入れる（Object.keys(SHOPS) の「町の 店」の 一覧には 出ない。SHOPS[id] は ふつうに 引ける）
  Object.defineProperty(SHOPS, id, {
    value: {
      name: `地下${f}階のふしぎな店`, kind: 'general', keeper: SD_SHOP_KEEPER, items, prices,
      hello: 'ひっひっひ…よく来たね。\nここでしか買えない品が、そろっているよ。',
    },
    enumerable: false, configurable: true, writable: true,
  });
  made.push(id);
  if (made.length > 40) delete SHOPS[made.shift()];
  return id;
}
