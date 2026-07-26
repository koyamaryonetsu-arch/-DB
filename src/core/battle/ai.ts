// 敵AI: 完全ランダムではなく、条件ルール（HP・ターン・状態・フェーズ等）+ 重み付き行動表

import type { Rng } from '../rng';
import type { GameData } from '../registry';
import type { AiRule } from '../types';
import type { BattleState, Combatant, Command, TargetRef } from './types';
import { hasStatus } from './status';

export function decideEnemyCommand(
  enemy: Combatant,
  state: BattleState,
  rng: Rng,
  data: GameData
): Command | null {
  if (enemy.hp <= 0) return null;
  const monster = enemy.monsterId ? data.monsters.get(enemy.monsterId) : null;
  const pattern: AiRule[] = monster?.aiPattern ?? [];
  const aiFlags = (enemy.aiFlags ??= {});
  const alliesAlive = state.combatants.filter((c) => c.side === 'enemy' && c.hp > 0).length;
  const partyAlive = state.combatants.filter((c) => c.side === 'party' && c.hp > 0);
  const hpRate = enemy.hp / enemy.stats.maxHp;
  const phase = enemy.flags.phase ?? 1;
  // 難易度: 物語重視では条件ルールの発動率を下げ、素の攻撃が増える
  const ruleChance = state.difficulty === 'story' ? 0.65 : 1;

  const conditionRules = pattern.filter((r) => r.if);
  const weightedRules = pattern.filter((r) => !r.if);

  for (const rule of conditionRules) {
    const c = rule.if!;
    if (c.hpRateLte !== undefined && hpRate > c.hpRateLte) continue;
    if (c.hpRateGte !== undefined && hpRate < c.hpRateGte) continue;
    if (c.turnGte !== undefined && state.turn < c.turnGte) continue;
    if (c.everyTurns !== undefined && state.turn % c.everyTurns !== 0) continue;
    if (c.phaseGte !== undefined && phase < c.phaseGte) continue;
    if (c.alliesAliveLte !== undefined && alliesAlive > c.alliesAliveLte) continue;
    if (c.alliesAliveGte !== undefined && alliesAlive < c.alliesAliveGte) continue;
    if (c.selfHasStatus && !hasStatus(enemy, c.selfHasStatus)) continue;
    if (c.selfMissingStatus && hasStatus(enemy, c.selfMissingStatus)) continue;
    if (c.partyHasBuff && !partyAlive.some((p) => (p.buffs[c.partyHasBuff!] ?? 0) > 0)) continue;
    if (c.flagNotSet && aiFlags[c.flagNotSet]) continue;
    if (c.flagGte && (aiFlags[c.flagGte[0]] ?? 0) < c.flagGte[1]) continue;
    if (c.once) {
      if (aiFlags[c.once]) continue;
    }
    if (!rng.chance(ruleChance)) continue;
    if (c.once) aiFlags[c.once] = 1;
    if (rule.do.setFlag) aiFlags[rule.do.setFlag[0]] = rule.do.setFlag[1];
    return ruleToCommand(enemy, rule, state, rng);
  }

  if (weightedRules.length > 0) {
    const rule = rng.weighted(weightedRules.map((r) => ({ value: r, weight: r.weight ?? 1 })));
    if (rule.do.setFlag) aiFlags[rule.do.setFlag[0]] = rule.do.setFlag[1];
    return ruleToCommand(enemy, rule, state, rng);
  }
  return { type: 'attack', userUid: enemy.uid, target: pickPartyTarget(state, rng) };
}

function ruleToCommand(enemy: Combatant, rule: AiRule, state: BattleState, rng: Rng): Command | null {
  switch (rule.do.action) {
    case 'attack':
      return { type: 'attack', userUid: enemy.uid, target: pickPartyTarget(state, rng) };
    case 'skill':
      return {
        type: 'skill',
        userUid: enemy.uid,
        skillId: rule.do.skillId!,
        target: { kind: 'side', side: 'party' }, // 実対象は実行時に解決
      };
    case 'summon':
      return {
        type: 'skill',
        userUid: enemy.uid,
        skillId: `__summon:${rule.do.summonId}`,
        target: { kind: 'self' },
      };
    case 'wait':
      return { type: 'defend', userUid: enemy.uid };
    default:
      return null;
  }
}

/** 挑発(taunt)されていれば高確率でその対象を狙う */
export function pickPartyTarget(state: BattleState, rng: Rng): TargetRef {
  const alive = state.combatants.filter((c) => c.side === 'party' && c.hp > 0);
  if (alive.length === 0) return { kind: 'side', side: 'party' };
  const taunter = alive.find((c) => c.flags.taunt);
  if (taunter && rng.chance(0.7)) return { kind: 'unit', uid: taunter.uid };
  return { kind: 'unit', uid: rng.pick(alive).uid };
}
