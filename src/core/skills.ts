// 技セット（ロードアウト）の制約:
// - 戦闘持込は最大8個
// - 継承技（現職以外の技）は最大4枠 → 現職の技が最低4枠確保される
// - 職固有奥義 (inheritable: false) は現職でなければ装備不可
// - パッシブは最大4個

import type { GameData } from './registry';
import type { ClassDefinition, PartyMember, SkillDefinition, UnlockCondition } from './types';
import { rankForJobExp } from './mastery';

export const MAX_LOADOUT = 8;
export const MAX_INHERITED = 4;
export const MAX_PASSIVES = 4;

/** その技がどの職業の技か（learnableSkills から逆引き） */
export function classOfSkill(skillId: string, data: GameData): string | null {
  for (const cls of data.classes.values()) {
    if (cls.learnableSkills.some((ls) => ls.skillId === skillId)) return cls.id;
    if (cls.passiveSkills.includes(skillId)) return cls.id;
  }
  return null;
}

export function isInherited(member: PartyMember, skillId: string, data: GameData): boolean {
  const owner = classOfSkill(skillId, data);
  return owner !== null && owner !== member.classId;
}

export interface LoadoutCheck {
  ok: boolean;
  reason?: string;
}

export function canEquipSkill(member: PartyMember, skillId: string, data: GameData): LoadoutCheck {
  const def = data.skills.get(skillId);
  if (!def) return { ok: false, reason: '未定義の技' };
  if (!member.learned.includes(skillId)) return { ok: false, reason: 'まだ習得していない' };
  if (def.kind === 'passive') return { ok: false, reason: 'パッシブは技セットに入らない' };
  if (member.loadout.includes(skillId)) return { ok: false, reason: 'すでにセット済み' };
  if (member.loadout.length >= MAX_LOADOUT) return { ok: false, reason: `技は最大${MAX_LOADOUT}個まで` };
  const inherited = isInherited(member, skillId, data);
  if (inherited) {
    if (!def.inheritable) return { ok: false, reason: '職固有の奥義は継承できない' };
    const inheritedCount = member.loadout.filter((s) => isInherited(member, s, data)).length;
    if (inheritedCount >= MAX_INHERITED) return { ok: false, reason: `継承技は最大${MAX_INHERITED}枠まで` };
  }
  return { ok: true };
}

export function equipSkill(member: PartyMember, skillId: string, data: GameData): LoadoutCheck {
  const check = canEquipSkill(member, skillId, data);
  if (check.ok) member.loadout.push(skillId);
  return check;
}

export function unequipSkill(member: PartyMember, skillId: string): void {
  member.loadout = member.loadout.filter((s) => s !== skillId);
}

export function canEquipPassive(member: PartyMember, skillId: string, data: GameData): LoadoutCheck {
  const def = data.skills.get(skillId);
  if (!def?.passive) return { ok: false, reason: 'パッシブではない' };
  if (!member.learned.includes(skillId)) return { ok: false, reason: 'まだ習得していない' };
  if (member.passives.includes(skillId)) return { ok: false, reason: 'すでに装備済み' };
  if (member.passives.length >= MAX_PASSIVES)
    return { ok: false, reason: `パッシブは最大${MAX_PASSIVES}個まで` };
  return { ok: true };
}

/** 転職後などにロードアウトを制約へ収める */
export function normalizeLoadout(member: PartyMember, data: GameData): void {
  // 継承不可の技（他職の奥義）を除去
  member.loadout = member.loadout.filter((sid) => {
    const def = data.skills.get(sid);
    if (!def) return false;
    if (!member.learned.includes(sid)) return false;
    if (isInherited(member, sid, data) && !def.inheritable) return false;
    return true;
  });
  // 継承枠超過を末尾から除去
  let inherited = member.loadout.filter((s) => isInherited(member, s, data));
  while (inherited.length > MAX_INHERITED) {
    const last = inherited[inherited.length - 1];
    member.loadout = member.loadout.filter((s) => s !== last);
    inherited = member.loadout.filter((s) => isInherited(member, s, data));
  }
  while (member.loadout.length > MAX_LOADOUT) member.loadout.pop();
  member.passives = member.passives.filter((p) => member.learned.includes(p)).slice(0, MAX_PASSIVES);
}

/** 転職条件の判定 */
export function meetsUnlockConditions(
  member: PartyMember,
  cls: ClassDefinition,
  flags: Record<string, number>
): boolean {
  return cls.unlockConditions.every((cond: UnlockCondition) => {
    switch (cond.type) {
      case 'classRank': {
        const exp = member.mastery[cond.classId ?? ''] ?? 0;
        return rankForJobExp(exp) >= (cond.rank ?? 1);
      }
      case 'flag':
        return (flags[cond.flag ?? ''] ?? 0) >= 1;
      case 'actor':
        return member.actorId === cond.actorId;
      default:
        return false;
    }
  });
}

/** 転職: レベル維持・HP/MPは職業補正で変化（呼び出し側で clampVitals する） */
export function changeClass(member: PartyMember, newClassId: string, data: GameData): void {
  const cls = data.classes.get(newClassId);
  if (!cls) throw new Error(`未定義の職業: ${newClassId}`);
  member.classId = newClassId;
  if (member.mastery[newClassId] === undefined) member.mastery[newClassId] = 0;
  // 新職業の現ランクまでの技を反映
  const rank = rankForJobExp(member.mastery[newClassId]);
  for (const ls of cls.learnableSkills) {
    if (ls.rank <= rank && !member.learned.includes(ls.skillId)) member.learned.push(ls.skillId);
  }
  normalizeLoadout(member, data);
  // 現職の技が1つもセットされていなければ自動セット
  const hasOwn = member.loadout.some((s) => !isInherited(member, s, data));
  if (!hasOwn) {
    for (const ls of cls.learnableSkills) {
      if (member.learned.includes(ls.skillId) && !member.loadout.includes(ls.skillId)) {
        member.loadout.unshift(ls.skillId);
        break;
      }
    }
    normalizeLoadout(member, data);
  }
}

export function skillDisplayCost(member: PartyMember, def: SkillDefinition, mpCostMul: number): string {
  if (def.ougi) return `奥義${def.gaugeCost ?? 100}`;
  const cost = Math.ceil(def.mpCost * mpCostMul);
  return `MP${cost}`;
}
