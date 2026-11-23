// 第88回 G17班: フリーレンの 品の 戦いの しくみ（docs/plan-r88-anime-gear.md の 4-6・5-1。設計書の「実装メモ（G17班）」）
//   ・服従のてんびん（「使う」。effect { type: 'r88fr', kind: 'tenbin' }）
//       使った 人と 敵1体の 攻撃魔力を くらべる。使った 人の 方が 上なら、てんびんが かたむいて その 敵は 1回 動けない
//       （行動ゲージが 0 に もどる）。同じか 下なら 何も 起きない。ボス（大きな 敵）には 効かない
//   ・そろいの 段の rule 'pair'（鏡れん華の指輪と うでわ）
//       戦いの はじめの 仲間で、組の ちがう 品を べつべつの 2人が つけて いると、つけて いる 2人だけ その 段の 強さ
//       （party は 全員・pair は つけた 人だけ。battle.js の constructor で applyPartySets の あとに よぶ）
//   どれも 戦いの 中だけ（セーブしない）。battle.js は import しない（battle.js から よばれる）
import { GEAR_SETS, tierRule } from './data/gear-sets.js?v=31ca07498b9b';
import { ITEMS, baseItemId } from './data/items.js?v=31ca07498b9b';

// 攻撃魔力（強化・弱化を かけた 今の 数。battle.js の effMag と 同じ 式）
export function magNow(c) {
  let v = c?.mag || 0;
  if (c?.buffs?.mag) v *= c.buffs.mag.mult;
  if (c?.debuffs?.mag) v *= c.debuffs.mag.mult;
  return v;
}

// ───────────── 技の 効果（battle.js の applyAbility の case 'r88fr'）─────────────
export function r88frEffect(b, c, a, eff, ev, targets) {
  if (eff.kind !== 'tenbin') return false;
  for (const t of targets) {
    if (!t?.alive || t.fled) continue;
    if (t.boss) {
      ev.lines.push(`しかし${t.name}は大きすぎて、てんびんにのせられない！`);
      continue;
    }
    const mine = magNow(c), its = magNow(t);
    ev.lines.push(`てんびんに、${c.name}と${t.name}の魔力がのった…！`);
    if (mine > its) {
      if (t.side === 'enemy') {
        b.queue = b.queue.filter((q) => q.id !== t.id);
        t.queued = false;
      }
      t.atb = 0;
      ev.lines.push(`てんびんが${c.name}の方へかたむいた！\n${t.name}は、1回動けない！`);
      if (!ev.upd.includes(t)) ev.upd.push(t);
    } else {
      ev.lines.push(`${t.name}の魔力の方が重い…。てんびんは、ぴくりとも動かない。`);
    }
  }
  return true;
}

// ───────────── そろい rule 'pair'（battle.js の constructor）─────────────
// その 人が つけて いる 組の 品（もとの id。アクセと 武器）
const wornOf = (c, setId) => [c.acc, c.weaponId].filter((id) => id && ITEMS[id] && (ITEMS[baseItemId(id)] || ITEMS[id])?.set === setId).map((id) => baseItemId(id));
export function applyPairSets(b) {
  for (const [sid, set] of Object.entries(GEAR_SETS)) {
    const tiers = set.tiers.filter((t) => tierRule(set, t) === 'pair');
    if (!tiers.length) continue;
    const wear = b.combatants.filter((x) => x.side === 'ally' && !x.species && wornOf(x, sid).length);
    // ちがう 品を つけた 人が 2人 いじょう（同じ 品だけ 2人では 組に ならない）
    const kinds = new Set(wear.flatMap((x) => wornOf(x, sid)));
    if (wear.length < 2 || kinds.size < 2) continue;
    let best = null;
    for (const t of tiers) if (wear.length >= t.n && (!best || t.n >= best.n)) best = t;
    if (!best) continue;
    for (const c of wear) {
      const a = best.bonus || {};
      if (a.str) c.atk += a.str;
      if (a.def) c.dfn += a.def;
      if (a.agi) c.agi += a.agi;
      if (a.mag) c.mag += a.mag;
      if (a.heal) c.healPow += a.heal;
      if (a.hp) { c.maxHp += a.hp; if (c.alive) c.hp += a.hp; }
      if (a.mp) { c.maxMp += a.mp; c.mp += a.mp; }
      c.pairSet = sid;
    }
  }
}
