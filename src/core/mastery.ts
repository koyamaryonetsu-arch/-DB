// 職業熟練度: 8段階ランク。弱すぎる敵からは職業経験値が減少/無効化される。

import type { GameData } from './registry';
import type { ClassDefinition, PartyMember } from './types';

export const RANK_NAMES = ['見習い', '初伝', '中伝', '奥伝', '達人', '師範', '宗師', '極星'];

/** ランク n (1..8) に到達するための累計職業経験値 */
export const RANK_THRESHOLDS = [0, 40, 100, 200, 340, 520, 760, 1060];

export function rankForJobExp(jobExp: number): number {
  let rank = 1;
  for (let i = 1; i < RANK_THRESHOLDS.length; i++) {
    if (jobExp >= RANK_THRESHOLDS[i]) rank = i + 1;
  }
  return rank;
}

export function rankName(rank: number): string {
  return RANK_NAMES[Math.min(RANK_NAMES.length, Math.max(1, rank)) - 1];
}

/** 次のランクまでの残り職業経験値（最大ランクなら null） */
export function jobExpToNext(jobExp: number): number | null {
  const rank = rankForJobExp(jobExp);
  if (rank >= 8) return null;
  return RANK_THRESHOLDS[rank] - jobExp;
}

/**
 * 弱い敵補正: レベル差が大きいほど職業経験値が減る。
 * 差 >= 8 → 0 / 差 >= 5 → 50% / それ以外 → 100%
 */
export function jobExpMultiplier(memberLevel: number, maxEnemyLevel: number): number {
  const diff = memberLevel - maxEnemyLevel;
  if (diff >= 8) return 0;
  if (diff >= 5) return 0.5;
  return 1;
}

export interface MasteryGainResult {
  classId: string;
  gained: number;
  fromRank: number;
  toRank: number;
  learnedSkills: string[];
}

/** 戦闘後の職業経験値加算。ランクアップで技を習得する。 */
export function gainJobExp(
  member: PartyMember,
  cls: ClassDefinition,
  baseAmount: number,
  maxEnemyLevel: number,
  data: GameData
): MasteryGainResult {
  const mul = jobExpMultiplier(member.level, maxEnemyLevel);
  const gained = Math.floor(baseAmount * mul);
  const before = member.mastery[cls.id] ?? 0;
  const fromRank = rankForJobExp(before);
  member.mastery[cls.id] = before + gained;
  const toRank = rankForJobExp(member.mastery[cls.id]);

  const learnedSkills: string[] = [];
  if (toRank > fromRank) {
    for (const ls of cls.learnableSkills) {
      if (ls.rank <= toRank && !member.learned.includes(ls.skillId)) {
        member.learned.push(ls.skillId);
        learnedSkills.push(ls.skillId);
        autoSlot(member, ls.skillId, cls, data);
      }
    }
    // パッシブはランク 2/4/6 で解放
    cls.passiveSkills.forEach((pid, i) => {
      const need = (i + 1) * 2;
      if (toRank >= need && !member.learned.includes(pid)) {
        member.learned.push(pid);
        learnedSkills.push(pid);
        if (member.passives.length < 4) member.passives.push(pid);
      }
    });
  }
  return { classId: cls.id, gained, fromRank, toRank, learnedSkills };
}

/** 空きがあれば技セットへ自動装備 */
function autoSlot(member: PartyMember, skillId: string, cls: ClassDefinition, data: GameData): void {
  const def = data.skills.get(skillId);
  if (!def || def.kind === 'passive') return;
  if (member.loadout.length >= 8) return;
  if (!member.loadout.includes(skillId)) member.loadout.push(skillId);
  void cls;
}

/** 指定職業の未習得スキルのうち、現在ランクで習得済みであるべきものを反映（初期加入用） */
export function syncLearnedForClass(member: PartyMember, cls: ClassDefinition, data: GameData): void {
  const rank = rankForJobExp(member.mastery[cls.id] ?? 0);
  for (const ls of cls.learnableSkills) {
    if (ls.rank <= rank && !member.learned.includes(ls.skillId)) {
      member.learned.push(ls.skillId);
      autoSlot(member, ls.skillId, cls, data);
    }
  }
  cls.passiveSkills.forEach((pid, i) => {
    const need = (i + 1) * 2;
    if (rank >= need && !member.learned.includes(pid)) {
      member.learned.push(pid);
      if (member.passives.length < 4) member.passives.push(pid);
    }
  });
}
