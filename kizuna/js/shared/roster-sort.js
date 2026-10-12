// 酒場で 待っている 仲間の ならび（仲間は 40ひきまで。data/companions.js の ROSTER_MAX）
//   got   … 仲間に なった じゅん（今までと 同じ）
//   kind  … 種類じゅん（人の 仲間 → 魔物は 図鑑の じゅん。同じ 種類は レベルの 高い じゅん）
//   level … レベルの 高い じゅん（同じ レベルは 仲間に なった じゅん）
// 画面は client/ui/services.js の 酒場。えらんだ ならびは この 機械に のこす（client/prefs.js の rosterSortPref）
import { MONSTERS } from './data/monsters.js?v=20d81aa120cb';

export const ROSTER_SORTS = [
  ['got', '仲間になった順'],
  ['kind', '種類順'],
  ['level', 'レベル順'],
];
export const rosterSortName = (mode) => (ROSTER_SORTS.find(([k]) => k === mode) || ROSTER_SORTS[0])[1];
export const nextRosterSort = (mode) => {
  const i = ROSTER_SORTS.findIndex(([k]) => k === mode);
  return ROSTER_SORTS[(i + 1) % ROSTER_SORTS.length][0];
};

// 図鑑の じゅん（MONSTERS に 書いた じゅん）
let dexOrder = null;
function dexIndex(sp) {
  if (!dexOrder) dexOrder = new Map(Object.keys(MONSTERS).map((k, i) => [k, i]));
  return dexOrder.has(sp) ? dexOrder.get(sp) : 1e6;
}

// list: [{ key, species?, level, … }]（酒場の じょうほう。もとの じゅんが 仲間に なった じゅん）
export function sortRoster(list, mode = 'got') {
  const rows = list.map((e, i) => ({ e, i }));
  const lv = (e) => Number(e.level) || 0;
  if (mode === 'kind') {
    rows.sort((a, b) => (a.e.species ? 1 : 0) - (b.e.species ? 1 : 0)
      || (a.e.species ? dexIndex(a.e.species) - dexIndex(b.e.species) : 0)
      || lv(b.e) - lv(a.e) || a.i - b.i);
  } else if (mode === 'level') {
    rows.sort((a, b) => lv(b.e) - lv(a.e) || a.i - b.i);
  }
  return rows.map((r) => r.e);
}
