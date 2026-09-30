// 魔物が 落とす 物（ドロップ）のきまり
//
// monsters.js の drops は こう 書く:
//   drops: { common: ['herb', 8], rare: ['iron_claw', 64] }
//     common … よく 落とす 物。8 なら 8回に 1回（書かなければ DROP_N.common）
//     rare   … めったに 落とさない 物。装備か 種（書かなければ DROP_N.rare）
//   drops: { boss: ['rock_bangle'] }
//     boss   … ボスが かならず 落とす 物（1人 1つの 品）
//
// きまり（長い 物語でも おなじ）
//   ・1体から 落ちるのは 1つまで。さきに レア、だめなら よく落とす 物
//   ・レアの 装備は「店で 買えない ★の 品」か「その地方の 店より 少し 先の 品」
//   ・種は その魔物に 合った もの（かたい→守り、はやい→素早さ、呪文→かしこさ、大きい→命、力じまん→力）
//   ・図鑑に 落とす 物が のる（手に入れるまでは ？？？）
import { ITEMS } from './items.js?v=4deb19092b33';
import { MONSTERS } from './monsters.js?v=4deb19092b33';

export const DROP_N = { common: 8, rare: 64 };
// ぬすむ ときは レアが 出やすい（この 倍。でも 半分まで）
export const STEAL_RARE_MULT = 8;

const entry = (kind, v) => {
  const [item, n] = Array.isArray(v) ? v : [v, DROP_N[kind]];
  if (!ITEMS[item]) return null;
  const N = Math.max(1, Number(n) || DROP_N[kind] || 1);
  return { item, kind, n: N, rate: 1 / N };
};

// その魔物が 落とす 物の 一覧 [{ item, kind, n, rate }]（ボス → レア → よく落とす 物 の じゅん）
export function monsterDrops(species) {
  const d = MONSTERS[species]?.drops;
  if (!d || typeof d !== 'object') return [];
  const out = [];
  for (const id of Array.isArray(d.boss) ? d.boss : d.boss ? [d.boss] : []) {
    if (ITEMS[id]) out.push({ item: id, kind: 'boss', n: 1, rate: 1 });
  }
  if (d.rare) out.push(entry('rare', d.rare));
  if (d.common) out.push(entry('common', d.common));
  return out.filter(Boolean);
}

// たおした 1体から 落ちる 物（rng.chance を つかう）
export function rollDrops(species, rng) {
  const list = monsterDrops(species);
  const out = list.filter((x) => x.kind === 'boss').map((x) => x.item);
  const rare = list.find((x) => x.kind === 'rare');
  const common = list.find((x) => x.kind === 'common');
  if (rare && rng.chance(rare.rate)) out.push(rare.item);
  else if (common && rng.chance(common.rate)) out.push(common.item);
  return out;
}

// ぬすむ ときに とれる 物（ボスの 品は とれない）
export function stealPick(species, rng) {
  const list = monsterDrops(species);
  const rare = list.find((x) => x.kind === 'rare');
  const common = list.find((x) => x.kind === 'common');
  if (rare && rng.chance(Math.min(0.5, rare.rate * STEAL_RARE_MULT))) return rare.item;
  return common?.item || rare?.item || null;
}
