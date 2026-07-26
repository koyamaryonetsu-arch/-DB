// レベルアップ: 経験値曲線と成長（性格による小さな成長ボーナス。弱体化は起きない）

import type { Rng } from './rng';
import type { ActorDefinition, PartyMember, PersonalityKey, StatKey } from './types';

export const MAX_LEVEL = 40;

/** レベル l に到達するのに必要な累計経験値 */
export function totalExpForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(6 * Math.pow(level - 1, 2.45));
}

export function levelForExp(exp: number): number {
  let l = 1;
  while (l < MAX_LEVEL && exp >= totalExpForLevel(l + 1)) l++;
  return l;
}

/** 性格 → 対応する成長ボーナス先 */
export const PERSONALITY_STAT: Record<PersonalityKey, StatKey> = {
  courage: 'attack',
  mercy: 'spirit',
  wisdom: 'magic',
  freedom: 'agility',
  order: 'defense',
  ambition: 'luck',
};

export interface LevelUpResult {
  from: number;
  to: number;
  gains: Partial<Record<StatKey, number>>;
}

/** 経験値を加算し、必要ならレベルアップ処理を行う */
export function gainExp(
  member: PartyMember,
  actor: ActorDefinition,
  amount: number,
  rng: Rng
): LevelUpResult | null {
  member.exp += Math.max(0, Math.floor(amount));
  const newLevel = levelForExp(member.exp);
  if (newLevel <= member.level) return null;

  const from = member.level;
  const gains: Partial<Record<StatKey, number>> = {};
  // 性格の最大値（同率なら定義順の先勝ち）
  let topKey: PersonalityKey = 'courage';
  for (const k of Object.keys(member.personality) as PersonalityKey[]) {
    if (member.personality[k] > member.personality[topKey]) topKey = k;
  }
  const bonusStat = PERSONALITY_STAT[topKey];

  for (let l = from; l < newLevel; l++) {
    for (const [k, range] of Object.entries(actor.growth)) {
      const key = k as StatKey;
      let gain = rng.range(range[0], range[1]);
      if (key === bonusStat && rng.chance(0.5)) gain += 1;
      member.baseStats[key] += gain;
      gains[key] = (gains[key] ?? 0) + gain;
    }
  }
  member.level = newLevel;
  return { from, to: newLevel, gains };
}

export const DIFFICULTY_EXP_MUL: Record<string, number> = {
  story: 1.25,
  normal: 1,
  tactics: 0.85,
};
