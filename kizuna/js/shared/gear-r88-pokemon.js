// 第88回 G16班: ポケモンの 品の しくみ（戦いの 外。docs/plan-r88-anime-gear.md の 4-5。データは data/items-r88-pokemon.js）
//   ・しんかのきせき（品の pkEvo）… 基本職・上級職（tier 0・1）の 人が つけると 守備力・HPが 上がる（data/gear-fx.js の gearFxStats が 足す。強さの まどにも 出る）
//   ・がくしゅうそうち（品の pkExp）・おまもりこばん（品の pkGold）… つけた 人が 戦いで もらう 経験値・お金が ふえる（world/battles.js）。
//     いちばん 大きい 1つ分だけ（重ねても ふえない）
//   ・ボール（武器の befriend）… 戦いの あと、たおした 魔物が 仲間に なりたがる わりあいに かける（world/battles.js。職業の 力に かけ合わせる）
//     いっしょに 戦った 人の うち いちばん 大きい ボール 1つ分
import { ITEMS, SLOTS, baseItemId } from './data/items.js?v=34af8e641519';
import { JOBS } from './data/jobs.js?v=34af8e641519';

const worn = (char) => SLOTS.map((sl) => ITEMS[baseItemId(char?.equip?.[sl])]).filter(Boolean);
// 進化の まえ（基本職・上級職）。魔物の 仲間は 職業が ないので 効かない
export const PK_EVO_TIERS = new Set([0, 1]);
export const pkEvoOk = (char) => !char?.species && PK_EVO_TIERS.has(JOBS[char?.job]?.tier);

// しんかのきせきの 強さ（{ def, hp } か {}）
export function pkWearAdd(char) {
  if (!pkEvoOk(char)) return {};
  const out = {};
  for (const it of worn(char)) for (const [k, v] of Object.entries(it.pkEvo || {})) out[k] = (out[k] || 0) + v;
  return out;
}

// 経験値・お金の 倍率（つけて いる 品の いちばん 大きい もの。ない 時は 1）
const topOf = (char, key) => Math.max(1, ...worn(char).map((it) => Number(it[key]) || 1));
export const pkExpMult = (char) => (char?.species ? 1 : topOf(char, 'pkExp'));
export const pkGoldMult = (char) => (char?.species ? 1 : topOf(char, 'pkGold'));

// ボールの 仲間に なりやすさ（戦いの 味方の 武器。いちばん 大きい 1つ）
export function ballBefriendMult(allies) {
  return Math.max(1, ...(allies || []).map((a) => Number(ITEMS[baseItemId(a?.weaponId)]?.befriend) || 1));
}
