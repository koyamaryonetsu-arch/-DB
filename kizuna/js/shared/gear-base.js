// 第76回: 装備の「もとの 強さ」（家族の ねがい: きたえると、もともとの 武器の 強さが わからなくなる）
//
// きたえた 装備（'sword+3'）・限界とっぱ（'sword+5_lb2' ★2）・れん金の 効果（char.gearFx[もとの id]）を
// ぬいた「きたえる 前の その 装備」（もとの 装備）の 強さを 出す。装備を えらぶ まど（client/ui/menu.js の pickGear）で
// 「今の 強さ」と「もとの 強さ」を ならべて、きたえた 武具と きたえていない 武具を くらべられるように する。
//
//   gearBaseId(id)       … もとの 装備の id（'sword+5_lb2' → 'sword'）
//   forgeLevel(id)       … きたえた 回数（★も 1回に 数える。+5★2 は 7。強さは +7 と 同じ。items-forge.js の lbItem）
//   forgeLabel(id)       … 「+5★2」（きたえていない ときは ''）
//   gearBaseStats(id)    … もとの 装備の 数字（{ id, name, atk, def, bonus }）
//   gearOwn(char, slot, id)      … その 装備 そのものの 強さ（外した 時との 差。[{ k, n, v }]）
//   gearOwnBase(char, slot, id)  … もとの 装備の 強さ（きたえ・★・れん金 なし）
//   sameForgeId(id, level, char) … もとの 装備を level 回 きたえた ときの id（きたえられる 回数で 止める）
//   gearCompare(char, slot, curId, candId) … くらべる まどの 数字（今・もと・同じだけ きたえると）
//   baseStronger(char, slot, curId, candId) … もとの 装備どうしで くらべて 強いか（「もとが強い」の しるし）
import { ITEMS, baseItemId } from './data/items.js?v=3b960a0fc297';
import { UPGRADE_TYPES, upgradeId, lbId, LB_MAX } from './data/items-forge.js?v=3b960a0fc297';
import { maxPlus, rebirthOf } from './data/forge.js?v=3b960a0fc297';
import { computeStats } from './stats.js?v=3b960a0fc297';
import { gearScore } from './equip-plan.js?v=3b960a0fc297';

// 装備で 変わる 強さ（お店の くらべ counter.js・装備の まどと おなじ ならび）
export const GEAR_STAT_LABELS = [['atk', '攻撃力'], ['dfn', '守備力'], ['agi', '素早さ'], ['mag', '攻撃魔力'], ['heal', '回復魔力'], ['maxHp', '最大HP'], ['maxMp', '最大MP']];

// もとの 装備の id（items.js の baseItemId〈items-forge.js の base〉。表に ない ときは id の 形から: 'x+3' 'x+5_lb1'）
export function gearBaseId(id) {
  if (!id) return null;
  if (ITEMS[id]) return baseItemId(id);
  const m = /^(.+?)\+\d+(?:_lb\d+)?$/.exec(String(id));
  return m && ITEMS[m[1]] ? m[1] : id;
}
export const forgeLevel = (id) => (ITEMS[id]?.plus || 0) + (ITEMS[id]?.lb || 0);
export function forgeLabel(id) {
  const it = ITEMS[id];
  if (!it?.plus && !it?.lb) return '';
  return `+${it.plus || 0}${it.lb ? `★${it.lb}` : ''}`;
}
// きたえた・★・れん金の どれかで、もとの 強さと ちがう 物か
export function hasBoost(char, id) {
  if (!id) return false;
  return gearBaseId(id) !== id || !!(char?.gearFx?.[gearBaseId(id)]?.length);
}

// もとの 装備の 数字（その まま。キャラの 強さに した ものは gearOwnBase）
export function gearBaseStats(id) {
  const b = gearBaseId(id);
  const it = ITEMS[b];
  if (!it) return null;
  return { id: b, name: it.name, atk: it.atk || 0, def: it.def || 0, bonus: { ...(it.bonus || {}) } };
}

// れん金の 効果を ぬいた キャラ（ids の もとの 装備の ぶんだけ。ほかの 部位の 効果は のこす）
export function withoutFx(char, ...ids) {
  if (!char?.gearFx) return char;
  const fx = { ...char.gearFx };
  for (const id of ids) if (id) delete fx[gearBaseId(id)];
  return { ...char, gearFx: fx };
}

// その 装備 そのものの 強さ（その 部位を 外した 時と くらべて 上がる 分。[{ k, n, v }]）。id が null なら []
export function gearOwn(char, slot, id) {
  if (!id) return [];
  const off = computeStats({ ...char, equip: { ...(char?.equip || {}), [slot]: null } });
  const on = computeStats({ ...char, equip: { ...(char?.equip || {}), [slot]: id } });
  return GEAR_STAT_LABELS.map(([k, n]) => ({ k, n, v: (on?.[k] ?? 0) - (off?.[k] ?? 0) })).filter((x) => x.v);
}
// もとの 装備の 強さ（きたえ・★・れん金 なし）
export function gearOwnBase(char, slot, id) {
  if (!id) return [];
  return gearOwn(withoutFx(char, id), slot, gearBaseId(id));
}

// もとの 装備を level 回 きたえた ときの id（★も 1回。きたえられる 回数〈れん金で ふやした 分・★〉で 止める）
// かえす もの: { id, level: ほんとうの 回数, capped: とどかない, none: きたえられない（店の 品・アクセサリー）}
export function sameForgeId(id, level, char = null) {
  const b = gearBaseId(id);
  const it = ITEMS[b];
  const want = Math.max(0, level | 0);
  if (!it) return null;
  if (!UPGRADE_TYPES.includes(it.type) || !maxPlus(b, char)) return { id: b, level: 0, capped: want > 0, none: true };
  const rb = rebirthOf(b);
  let out = b;
  if (rb) {
    // 生まれ変わる 武器は ★なし。上限を こえて rb.at まで
    const n = Math.min(want, rb.at);
    if (n > 0 && ITEMS[upgradeId(b, n)]) out = upgradeId(b, n);
  } else {
    const top = maxPlus(b, char);
    if (want <= top) out = upgradeId(b, want);
    else {
      const k = Math.min(LB_MAX, want - top);
      out = ITEMS[lbId(b, top, k)] ? lbId(b, top, k) : upgradeId(b, top);
    }
    if (!ITEMS[out]) out = b;
  }
  const got = forgeLevel(out);
  return { id: out, level: got, capped: got < want, none: false };
}

const toMap = (list) => new Map((list || []).map((x) => [x.k, x.v]));

// くらべる まどの 数字。cur … 今の 装備（null は なし）・cand … えらんでいる 物（null は 外す）
//  { cur: { id, base, level, label }, cand: { …, same: { id, level, label, capped, none } | null },
//    rows: [{ k, n, curNow, curBase, candNow, candBase, candSame, dNow, dBase, dSame }] }
//  same … えらんでいる 物を 今の 装備と 同じ 回数 きたえた とき（今の 装備が きたえて あって、えらんでいる 物の ほうが 少ない 時だけ）
export function gearCompare(char, slot, curId, candId) {
  const side = (id) => (id ? { id, base: gearBaseId(id), level: forgeLevel(id), label: forgeLabel(id), boosted: hasBoost(char, id) } : null);
  const cur = side(curId);
  const cand = side(candId);
  const curNow = toMap(gearOwn(char, slot, curId));
  const curBase = toMap(gearOwnBase(char, slot, curId));
  const candNow = toMap(gearOwn(char, slot, candId));
  const candBase = toMap(gearOwnBase(char, slot, candId));
  let sameMap = null;
  if (cand && cur && cur.level > cand.level) {
    const s = sameForgeId(candId, cur.level, char);
    if (s) {
      cand.same = { ...s, label: forgeLabel(s.id) };
      // れん金の 効果は その 人の その 装備の しゅるいに のこるので、きたえても いっしょ（gear-fx.js）
      if (!s.none) sameMap = toMap(gearOwn(char, slot, s.id));
    }
  }
  if (cand && !cand.same) cand.same = null;
  const rows = [];
  for (const [k, n] of GEAR_STAT_LABELS) {
    const r = { k, n, curNow: curNow.get(k) || 0, curBase: curBase.get(k) || 0, candNow: candNow.get(k) || 0, candBase: candBase.get(k) || 0, candSame: sameMap ? sameMap.get(k) || 0 : null };
    if (!r.curNow && !r.curBase && !r.candNow && !r.candBase && !r.candSame) continue;
    r.dNow = r.candNow - r.curNow;
    r.dBase = r.candBase - r.curBase;
    r.dSame = sameMap ? r.candSame - r.curNow : null;
    rows.push(r);
  }
  return { slot, cur, cand, rows };
}

// もとの 装備どうしで くらべて、えらんでいる 物の ほうが 強いか（gearScore と おなじ くらべかた。れん金も ぬく）
export function baseScore(char, slot, id) {
  if (!id) return gearScore(char, slot, null);
  return gearScore(withoutFx(char, id), slot, gearBaseId(id));
}
export function baseStronger(char, slot, curId, candId) {
  if (!candId || gearBaseId(candId) === gearBaseId(curId)) return false;
  return baseScore(char, slot, candId) > baseScore(char, slot, curId);
}
