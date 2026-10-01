// ふしぎなかじ: 作る（レシピ）と きたえる（+1〜+3）の きまり
//
// 作る   … 素材 ＋ ゴールドで、店では 売っていない 装備を 作る。物語が すすむと 作れる 物が ふえる
// きたえる … 武器・よろい・たて・頭の 装備を +1 → +2 → +3 に する（アクセサリーは できない）
//            1回ごとに 攻撃力（守備力）が もとの 1わり（少なくても 1）上がる（items-forge.js の upgradedItem）
//            素材と ゴールドは 回数が すすむほど ふえる。+3 には 星のかけらも いる
// バランス: 作った 物・きたえた 物を 売っても、かかった ゴールドと 素材より 高くは ならない（テストで たしかめる）
import { ITEMS, sellPrice } from './items.js?v=007288b252c5';
import { UPGRADE_MAX, UPGRADE_TYPES, upgradeId, addUpgradeItems } from './items-forge.js?v=007288b252c5';

// ほかの ファイルで あとから 足された 装備にも +1〜+3 を 作る（なんど よんでも おなじ）
addUpgradeItems(ITEMS);

// ランクごとに 作れるように なる 物語の しるし（店の 品ぞろえと おなじ ころ）
export const RECIPE_OPEN = { 2: null, 3: 'c1_treant', 4: 'c2_port', 5: 'c2_clear' };

// レシピ（id … できる 装備 / gold … ゴールド / mats … [素材, 数]）
export const RECIPES = [
  // ランク2（ルミナの町に 着いたら）
  { id: 'fang_spear', gold: 180, mats: [['beast_fang', 4], ['iron_shard', 1]] },
  { id: 'wolf_claw', gold: 150, mats: [['beast_fang', 5]] },
  { id: 'jelly_robe', gold: 150, mats: [['jelly', 6], ['magic_powder', 2]] },
  { id: 'fang_charm', gold: 250, mats: [['beast_fang', 6], ['magic_powder', 1]] },
  // ランク3（森の主を 助けたあと）
  { id: 'flame_sword', gold: 650, mats: [['iron_shard', 5], ['magic_powder', 3]] },
  { id: 'feather_hat', gold: 320, mats: [['wind_feather', 4], ['beast_fang', 2]] },
  { id: 'shell_mail', gold: 520, mats: [['pretty_shell', 5], ['iron_shard', 2]] },
  { id: 'wind_brooch', gold: 450, mats: [['wind_feather', 4], ['magic_powder', 2]] },
  // ランク4（カモメ港に 着いたら）
  { id: 'thunder_staff', gold: 1000, mats: [['magic_powder', 6], ['silver_shard', 2]] },
  { id: 'dragon_shield', gold: 1100, mats: [['dragon_scale', 3], ['silver_shard', 2]] },
  { id: 'shell_necklace', gold: 800, mats: [['pretty_shell', 8], ['silver_shard', 1]] },
  // ランク5（第2章を クリアしたら）
  { id: 'storm_sword', gold: 3200, mats: [['silver_shard', 5], ['iron_shard', 8], ['wind_feather', 5]] },
  { id: 'dragon_mail', gold: 3600, mats: [['dragon_scale', 5], ['silver_shard', 4]] },
];

export function recipeOf(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// その レシピが 作れる ころか（hasFlag: その 世界の フラグ）
export function recipeOpen(recipe, hasFlag = () => false) {
  const flag = RECIPE_OPEN[ITEMS[recipe?.id]?.rank];
  if (flag === undefined) return false;
  return !flag || hasFlag(flag);
}

export function openRecipes(hasFlag = () => false) {
  return RECIPES.filter((r) => ITEMS[r.id] && recipeOpen(r, hasFlag));
}

// ───── きたえる ─────
// 1回ごとの ゴールド（もとの 値段の わりあい）
const UP_GOLD = [0.25, 0.5, 0.8];

// きたえるのに 使う 素材（武器の 種類・よろいの 種類で きまる。upMat が あれば それ）
export function upgradeMat(it) {
  if (it.upMat) return it.upMat;
  switch (it.type) {
    case 'weapon': return { staff: 'magic_powder', whip: 'beast_fang', fan: 'wind_feather' }[it.cat] || 'iron_shard';
    case 'armor': return { heavy: 'iron_shard', robe: 'magic_powder' }[it.armorType] || 'beast_fang';
    case 'head': return it.helm ? 'iron_shard' : it.bonus?.mag > 0 ? 'magic_powder' : 'beast_fang';
    default: return 'iron_shard';
  }
}

// もとの 装備の ねうち（店の 値段。売っていない 物は 売り値から）
function worth(id) {
  const it = ITEMS[id];
  return Math.max(20 * (it.rank || 1), it.price > 0 ? it.price : Math.round(sellPrice(id) * 4 / 3));
}

export function canUpgrade(id) {
  const it = ITEMS[id];
  return !!it && UPGRADE_TYPES.includes(it.type) && (it.plus || 0) < UPGRADE_MAX && !!ITEMS[upgradeId(it.base || id, (it.plus || 0) + 1)];
}

// id を 1回 きたえる ための もの（きたえられない ときは null）
//  { from, to, base, n: きたえたあとの 回数, gold, mats: [[素材, 数], ...] }
export function upgradeCost(id) {
  if (!canUpgrade(id)) return null;
  const it = ITEMS[id];
  const base = it.base || id;
  const b = ITEMS[base];
  const n = (it.plus || 0) + 1;
  const rank = b.rank || 1;
  const gold = Math.max(10 * n * rank, Math.round((worth(base) * UP_GOLD[n - 1]) / 10) * 10);
  const mats = [[upgradeMat(b), n + Math.floor((rank - 1) / 2)]];
  if (rank >= 4) mats.push(['silver_shard', n]);
  if (n >= UPGRADE_MAX) mats.push(['star_shard', rank >= 4 ? 2 : 1]);
  return { from: id, to: upgradeId(base, n), base, n, gold, mats };
}

// 素材と ゴールドが たりるか（ふくろの 中だけ。預かり所の 物は 使えない）
export function lackOf(c, cost) {
  const have = (id) => (c?.items || []).find((e) => e.id === id)?.n || 0;
  const mats = (cost?.mats || []).filter(([id, n]) => have(id) < n).map(([id, n]) => ({ id, need: n, have: have(id) }));
  return { gold: Math.max(0, (cost?.gold || 0) - (c?.gold || 0)), mats, ok: !mats.length && (c?.gold || 0) >= (cost?.gold || 0) };
}
