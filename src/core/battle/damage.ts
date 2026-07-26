// ダメージ・回復計算

import type { Rng } from '../rng';
import type { GameData } from '../registry';
import type { BuffKey, ElementId } from '../types';
import type { BattleState, Combatant } from './types';

export function buffMul(unit: Combatant, stat: BuffKey): number {
  const stage = Math.max(-3, Math.min(3, unit.buffs[stat] ?? 0));
  return 1 + 0.25 * stage;
}

function statusMul(unit: Combatant, data: GameData, kind: 'atk' | 'agi' | 'acc'): number {
  let m = 1;
  for (const st of unit.statuses) {
    const def = data.statuses.get(st.id);
    if (!def) continue;
    if (kind === 'atk' && def.atkMul) m *= def.atkMul;
    if (kind === 'agi' && def.agiMul) m *= def.agiMul;
    if (kind === 'acc' && def.accMul) m *= def.accMul;
  }
  return m;
}

export function effectiveAttack(unit: Combatant, data: GameData): number {
  let atk = unit.stats.attack * buffMul(unit, 'attack') * statusMul(unit, data, 'atk');
  if (unit.lowHpAttackBonus > 0 && unit.hp <= unit.stats.maxHp * 0.3) {
    atk *= 1 + unit.lowHpAttackBonus;
  }
  return atk;
}

/** ボスの根リンク: 根が生きている間、本体の防御力1.5倍 */
export function effectiveDefense(unit: Combatant, state: BattleState): number {
  let def = unit.stats.defense * buffMul(unit, 'defense');
  if (unit.flags.rootGuard) {
    const rootsAlive = state.combatants.some(
      (c) => c.side === unit.side && c.hp > 0 && c.monsterId === 'balgrow_root'
    );
    if (rootsAlive) def *= 1.5;
  }
  if (unit.flags.defending) def *= 1.6;
  return def;
}

export function effectiveAgility(unit: Combatant, data: GameData): number {
  return unit.stats.agility * buffMul(unit, 'agility') * statusMul(unit, data, 'agi');
}

export function elementMultiplier(defender: Combatant, element: ElementId): number {
  if (element === 'none') return 1;
  return defender.resistances[element] ?? 1;
}

export interface DamageInput {
  attacker: Combatant;
  defender: Combatant;
  power: number;
  element: ElementId;
  category: 'physical' | 'magical';
  defensePierce?: number;
  rng: Rng;
  state: BattleState;
  data: GameData;
}

export interface DamageOutput {
  amount: number;
  crit: boolean;
  mult: number;
  hit: boolean;
}

export function checkHit(input: DamageInput, baseAccuracy: number): boolean {
  const { attacker, defender, rng, data } = input;
  const accStage = buffMul(attacker, 'accuracy');
  const evaStage = buffMul(defender, 'evasion');
  const agiDiff = (effectiveAgility(defender, data) - effectiveAgility(attacker, data)) * 0.15;
  let acc = baseAccuracy * accStage * statusMul(attacker, data, 'acc') - agiDiff;
  acc = acc / Math.max(0.5, evaStage);
  return rng.chance(Math.max(20, Math.min(100, acc)) / 100);
}

export function computeDamage(input: DamageInput): DamageOutput {
  const { attacker, defender, power, element, category, rng, state, data } = input;
  const mult =
    elementMultiplier(defender, element) * (1 + (attacker.elementBoost[element ?? 'none'] ?? 0));
  if (elementMultiplier(defender, element) === 0) {
    return { amount: 0, crit: false, mult: 0, hit: true };
  }

  let base: number;
  let crit = false;
  if (category === 'physical') {
    const atk = effectiveAttack(attacker, data);
    const def = effectiveDefense(defender, state) * (1 - (input.defensePierce ?? 0));
    base = (atk * power) / 100 - def / 2;
    const critRate = 1 / 16 + attacker.critBonus + attacker.stats.luck / 1500;
    if (rng.chance(critRate)) {
      crit = true;
      base = (atk * power) / 100; // 会心は防御無視
      base *= 1.5;
    }
    // 後列補正
    if (attacker.row === 'back') base *= 0.75;
    if (defender.row === 'back') base *= 0.75;
  } else {
    const mag = attacker.stats.magic * buffMul(attacker, 'magic');
    const spi = defender.stats.spirit * buffMul(defender, 'spirit');
    base = (mag * power) / 100 - spi / 4;
    if (defender.flags.defending) base *= 0.7;
  }

  base *= mult;
  const variance = 0.9 + rng.next() * 0.2;
  let amount = Math.floor(base * variance);
  if (amount < 1) amount = 1;
  return { amount, crit, mult, hit: true };
}

export function computeHeal(healer: Combatant, healPower: number, rng: Rng): number {
  const base = healPower * (1 + (healer.stats.spirit * buffMul(healer, 'spirit')) / 200);
  const variance = 0.95 + rng.next() * 0.1;
  return Math.max(1, Math.floor(base * variance));
}

/** 逃走確率: 素早さ差と試行回数で上昇。ボス戦は不可。 */
export function fleeChance(
  userAgility: number,
  maxEnemyAgility: number,
  attempts: number,
  bossBattle: boolean
): number {
  if (bossBattle) return 0;
  const p = 0.5 + (userAgility - maxEnemyAgility) * 0.01 + attempts * 0.15;
  return Math.max(0.15, Math.min(0.95, p));
}
