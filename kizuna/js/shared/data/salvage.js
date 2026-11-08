// 第64回 ⑥b: 装備の 分解（ふしぎなかじ屋。いらない 装備を 素材に もどす）
//   ・分解できるのは 店で 買えない 装備（★2〜）。店の 品（★1）は 売れば よい ので できない
//   ・ボスの 品（1人 1つ）・ふしぎな 力の ある 品・装備している 物は できない
//   ・もらえる 素材は きたえる ときと 同じ しゅるい（data/forge.js の upgradeMat）。ランク・レア度・+の 数で ふえる
//   ・バランス: 分解で もらえる 素材は、その 装備を 作る（レシピ）・きたえる のに 使う 素材より 少ない（テストで たしかめる）
import { ITEMS } from './items.js?v=20b56185686d';
import { RECIPES, upgradeMat } from './forge.js?v=20b56185686d';
import { isShopGear } from './items-rare.js?v=20b56185686d';

const EQUIP_TYPES = ['weapon', 'armor', 'shield', 'head', 'acc'];
const RECIPE_OF = new Map(RECIPES.map((r) => [r.id, r]));

// 分解できるか（できない ときは わけ）
export function salvageBlock(id) {
  const it = ITEMS[id];
  if (!it || !EQUIP_TYPES.includes(it.type)) return 'それは分解できないな。';
  const base = ITEMS[it.base || id] || it;
  if (isShopGear(base)) return '店の品（★1）は、分解しても素材にならないんだ。\n売ってしまうといい。';
  if (base.unique || base.boss) return 'それは大事な品だ。分解はやめておこう。';
  if (base.perk || base.equipUse) return 'ふしぎな力のある品だ。分解はやめておこう。';
  return null;
}

// 分解で もらえる 素材（[[素材, 数], ...]。できない 物は null）
export function salvageOf(id) {
  if (salvageBlock(id)) return null;
  const it = ITEMS[id];
  const base = ITEMS[it.base || id] || it;
  const rank = base.rank || 1;
  const plus = it.plus || 0;
  const out = new Map();
  const add = (m, n) => { if (n > 0 && ITEMS[m]) out.set(m, (out.get(m) || 0) + n); };
  add(upgradeMat(base), 1 + Math.floor(rank / 3) + Math.floor(plus / 2));
  if (rank >= 5) add('silver_shard', Math.floor(rank / 4));
  if ((base.rarity || 0) >= 3 || plus >= 4) add('star_shard', Math.max(1, Math.floor(plus / 3)));
  // レシピで 作れる 物は、レシピの 素材の 半分より 多くは もどさない
  const r = RECIPE_OF.get(it.base || id);
  if (r) {
    const cap = new Map(r.mats.map(([m, n]) => [m, Math.floor(n / 2)]));
    for (const [m, n] of [...out]) {
      const c = cap.get(m);
      if (c === undefined) continue;
      if (c <= 0) out.delete(m);
      else out.set(m, Math.min(n, c));
    }
    if (!out.size) out.set(upgradeMat(base), 1);
  }
  return [...out];
}
