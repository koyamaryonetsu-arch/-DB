// 配合の 計算（第35回）: 能力の 受けつぎ・生まれる 前の めやす・血統
// サーバー（world/breed.js）と 酒場の 画面（client/ui/services.js）で 同じ 計算を する
//   親 x は { species, level, plus, bonus, seeds, lineage, name }（サーバーは キャラ、画面は 酒場の 一覧〈world/party.js の companionInfo〉）
import { computeStats, STAT_KEYS, MAX_LEVEL } from './stats.js?v=c9d347298065';
import { MONSTERS } from './data/monsters.js?v=c9d347298065';
import { monsterLevelCap, rankIdx } from './data/companions.js?v=c9d347298065';

// 能力の 受けつぎ: 両親の 今の 能力（装備を はずした もの）の 3/10ずつ（第43回 A で 1/4 → 3/10。くり返しても 2.5倍で 止まる）
export const INHERIT_RATE = 0.3;

// 装備を はずした 魔物の 能力
export function bareStats(x) {
  return computeStats({ species: x.species, level: x.level || 1, plus: x.plus || 0, bonus: x.bonus || undefined, seeds: x.seeds || {}, equip: {} });
}

// 子が 受けつぐ 能力（セーブの ch.bonus に のこす）
export function inheritBonus(A, B) {
  return bonusOf(bareStats(A), bareStats(B));
}
function bonusOf(sa, sb) {
  const bonus = {};
  for (const k of STAT_KEYS) {
    const v = Math.round(((sa[k] || 0) + (sb[k] || 0)) * INHERIT_RATE);
    if (v > 0) bonus[k] = v;
  }
  return bonus;
}

// 強さの めやす（1つの 数。HPと MPは 大きいので わる）
export function powerScore(st) {
  return (st.maxHp || st.hp || 0) / 3 + (st.maxMp || st.mp || 0) / 6 + (st.str || 0) + (st.def || 0) + (st.agi || 0) + (st.mag || 0) + (st.heal || 0);
}

// 生まれる 前の めやす（child: しゅぞく、plus: 子の ＋）
//   born: 生まれた とき（Lv1）の 能力 / grown: 強いほうの 親の レベルまで 育てた ときの 能力（上限まで）/ parent: 強いほうの 親の 今の 能力
//   ratio: grown ÷ parent / trend: 'up'（親より 強く なる）・'same'・'down'（親より 弱く なるかも。ランクが 高いほうの 親より 下がる 子も）
//   lowRank: 子の ランクが 高いほうの 親より 下 / cap: 子の レベルの 上限
export function breedForecast(A, B, child, plus) {
  const sa = bareStats(A), sb = bareStats(B);
  const f = forecastCore(A, B, sa, sb, bonusOf(sa, sb), child, plus);
  const born = bareStats(f.kid);
  return { bonus: f.bonus, born, grown: f.grown, grownLv: f.grownLv, parent: f.strong.st, parentName: f.strong.x.name || '', ratio: f.ratio, trend: f.trend, lowRank: f.lowRank, cap: f.cap };
}

// めやすの 中身（breedForecast と breedTrend で 同じ 計算）
function forecastCore(A, B, sa, sb, bonus, child, plus) {
  const strong = powerScore(sa) >= powerScore(sb) ? { x: A, st: sa } : { x: B, st: sb };
  const kid = { species: child, level: 1, plus, bonus, seeds: {}, ranked: 1 };
  const cap = monsterLevelCap(kid, MONSTERS, MAX_LEVEL);
  const grownLv = Math.max(1, Math.min(cap, Math.max(A.level || 1, B.level || 1)));
  const grown = bareStats({ ...kid, level: grownLv });
  const ratio = powerScore(grown) / Math.max(1, powerScore(strong.st));
  const lowRank = rankIdx(child, MONSTERS) < Math.max(rankIdx(A.species, MONSTERS), rankIdx(B.species, MONSTERS));
  const trend = lowRank || ratio <= 0.95 ? 'down' : ratio >= 1.05 ? 'up' : 'same';
  return { bonus, strong, kid, cap, grownLv, grown, ratio, lowRank, trend };
}

// 第70回: めやすの ↑→↓ だけ（breedForecast と 同じ 計算。たくさんの 組を 見る ときは memo に 親の 能力・受けつぐ 能力を 覚えて おく）
//   memo … breedTrendMemo() で つくる（同じ 親の 中身が かわったら 作りなおす）
export const breedTrendMemo = () => ({ stats: new Map(), bonus: new Map() });
export function breedTrend(A, B, child, plus, memo = breedTrendMemo()) {
  const st = (x) => {
    let v = memo.stats.get(x);
    if (!v) memo.stats.set(x, (v = bareStats(x)));
    return v;
  };
  const sa = st(A), sb = st(B);
  let row = memo.bonus.get(A);
  if (!row) memo.bonus.set(A, (row = new Map()));
  let bonus = row.get(B);
  if (!bonus) row.set(B, (bonus = bonusOf(sa, sb)));
  return forecastCore(A, B, sa, sb, bonus, child, plus).trend;
}

export const TREND_MARK = { up: '↑', same: '→', down: '↓' };

// 子の 血統（両親と 祖父母の しゅぞく）。ch.lineage = { p: [親A, 親B], g: [[祖父母], [祖父母]] }（やせいの 親の 祖父母は null）
export function makeLineage(A, B) {
  const par = (x) => (Array.isArray(x.lineage?.p) ? x.lineage.p.slice(0, 2) : null);
  return { p: [A.species, B.species], g: [par(A), par(B)] };
}
