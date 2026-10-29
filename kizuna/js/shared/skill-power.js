// 技・呪文の 威力の 目安（第50回 N1。メニューの「呪文・技」・オートで 使う 技・戦いの せつめいで 使う）
//   物理: ふつうの 攻撃の 何倍か（「威力×1.8」「威力×0.6×4回」。転職の ペナルティ・職業レベルの 威力も かける）
//   魔力で 強く なる 呪文・技: 今の 魔力で どれくらいの ダメージか（相手の 耐性・守りは 考えない）
//   回復: 今の 回復魔力で どれくらい 回復するか
// しきは shared/battle.js の calcPhys・calcMagic・heal・healAmountOf と おなじ（ふりはばは 両はし、会心・耐性は 入れない）
import { abilityFor } from './ability-label.js?v=99ee8fb62a40';
import { computeStats, penaltyFor } from './stats.js?v=99ee8fb62a40';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// 倍率の 数（1.0・1.8 の ように 小数 1けた。1より 小さい ときは 0.55 の ように 2けたまで）
export const fmtMult = (x) => (x < 0.995 ? (Math.round(x * 100) / 100).toString() : (Math.round(x * 10) / 10).toFixed(1));
const pair = (b) => (Array.isArray(b) ? [b[0] || 0, b[1] ?? b[0] ?? 0] : [b || 0, b || 0]);
const rangeText = (mn, mx) => (mn === mx ? `${mn}` : `${mn}〜${mx}`);

// 今の 魔力・回復魔力（{ mag, heal }。わからない ときは null）
//   戦いの 中: pub の pow（バフも 入った 今の 魔力）を pc.pow に 入れて わたす
//   メニュー: セーブの キャラ（レベル・職業・装備）から computeStats
export function powStats(char) {
  if (!char) return null;
  if (char.pow && Number.isFinite(char.pow.mag)) return { mag: char.pow.mag, heal: char.pow.heal || 0 };
  if (!char.level || !(char.job || char.species)) return null;
  try {
    const st = computeStats(char);
    return { mag: st.mag || 0, heal: st.heal || 0 };
  } catch {
    return null;
  }
}

// 魔力の 伸び（calcMagic・heal と おなじ）
export function powScale(pow, e) {
  return 1 + clamp(((pow || 0) - (e.thr ?? 20)) / 150, 0, e.scaleCap ?? 1);
}

// 1つの 効果の 威力（{ type, ... }。威力の ない 効果は null）
//   pm: 転職の ペナルティ・職業レベルを かけた 威力の 倍率 / base: ペナルティ なしの 倍率 / st: 今の 魔力（なければ 目安だけ）
export function partPower(e, pm = 1, st = null, base = pm) {
  if (!e) return null;
  switch (e.type) {
    case 'phys':
    case 'drainHp': {
      const m = (e.mult ?? 1) * pm;
      return { type: 'phys', mult: m, full: (e.mult ?? 1) * base, hits: e.type === 'phys' && e.hits > 1 ? e.hits : 1, random: !!e.random };
    }
    case 'magic':
    case 'deduce':
    case 'gather': {
      if (!e.base) return null;
      const [a, b] = pair(e.base);
      const stat = e.stat === 'heal' ? 'heal' : 'mag';
      const k = (st ? powScale(st[stat], e) : 1) * pm;
      return { type: 'magic', stat, min: Math.round(a * k), max: Math.round(b * k), now: !!st, more: e.type === 'gather' };
    }
    case 'heal':
    case 'regen': {
      if (!e.base) return null;
      const [a, b] = pair(e.base);
      const scale = !e.fixed && st ? powScale(st.heal, e) : 1;
      // じわじわ 回復は 1回で 1より 少なく ならない（healAmountOf）
      const lo = Math.round(a * scale * pm), hi = Math.round(b * scale * pm);
      return { type: e.type, min: e.type === 'regen' ? Math.max(1, lo) : lo, max: e.type === 'regen' ? Math.max(1, hi) : hi, now: !e.fixed && !!st };
    }
    default: return null;
  }
}

// 威力の みじかい 文（リストの 2行め よう）。威力の ない 効果は ''
export function partPowerText(p) {
  if (!p) return '';
  if (p.type === 'phys') {
    const hits = p.hits > 1 ? `×${p.hits}回${p.random ? '（ランダム）' : ''}` : '';
    // 本職で ない 技は、本来の 倍率も（「威力×1.0（本来×1.5）」）
    const full = p.full - p.mult > 0.005 ? `（本来×${fmtMult(p.full)}）` : '';
    return `威力×${fmtMult(p.mult)}${hits}${full}`;
  }
  if (p.type === 'magic') return `${p.now ? (p.stat === 'heal' ? '今の回復魔力で' : '今の魔力で') : ''}ダメージ約${rangeText(p.min, p.max)}${p.more ? '（仲間がいると上がる）' : ''}`;
  if (p.type === 'heal') return `${p.now ? '今の回復魔力で' : ''}約${rangeText(p.min, p.max)}回復`;
  if (p.type === 'regen') return `${p.now ? '今の回復魔力で' : ''}毎ターン約${rangeText(p.min, p.max)}回復`;
  return '';
}

// 効果の 中の 威力を ぜんぶ（multi は 中の 効果を じゅんに）
export function effectPowers(e, pm = 1, st = null, base = pm) {
  if (!e) return [];
  if (e.type === 'multi') return (e.parts || []).flatMap((p) => effectPowers(p, pm, st, base));
  const p = partPower(e, pm, st, base);
  return p ? [p] : [];
}

// 転職の ペナルティ（pm: かける 倍率・base: ペナルティ なしの 倍率〈職業レベルの 威力は 入れる〉）
export function powMults(char, id) {
  let pen = { powMult: 1 };
  try {
    if (char) pen = penaltyFor(char, id);
  } catch {
    pen = { powMult: 1 };
  }
  const pm = pen.powMult || 1;
  return { pm, base: pen.penalized ? (pen.jobPow || 1) : pm, penalized: !!pen.penalized };
}

// 技の 威力の 目安（char: 使う 人〈セーブの キャラ か 戦いの pc〉。who: 名前・見た目を きめる 人）
//   { parts: [...], text: '威力×1.8' など（威力の ない 技は ''）, pm, penalized }
export function skillPower(id, char, { who = char, st = undefined } = {}) {
  const a = abilityFor(id, who);
  const { pm, base, penalized } = powMults(char, id);
  if (!a || !a.effect) return { parts: [], text: '', pm, penalized };
  const stats = st === undefined ? powStats(char) : st;
  const parts = effectPowers(a.effect, pm, stats, base);
  return { parts, text: parts.map(partPowerText).filter(Boolean).join('＋'), pm, penalized };
}
