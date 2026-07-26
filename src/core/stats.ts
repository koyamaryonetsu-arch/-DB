// 能力値算出: 基礎値 × 職業補正% + 装備 + パッシブ

import type { GameData } from './registry';
import type { DerivedStats, ElementId, PartyMember, StatKey, StatusId } from './types';

const STAT_KEYS: StatKey[] = ['hp', 'mp', 'attack', 'defense', 'magic', 'spirit', 'agility', 'luck'];

export function derivedStats(member: PartyMember, data: GameData): DerivedStats {
  const cls = data.classes.get(member.classId);
  if (!cls) throw new Error(`未定義の職業: ${member.classId}`);
  const raw: Record<StatKey, number> = { ...member.baseStats };
  const out: Record<StatKey, number> = { ...member.baseStats };
  for (const k of STAT_KEYS) {
    out[k] = Math.max(1, Math.floor((raw[k] * (cls.statModifiers[k] ?? 100)) / 100));
  }

  const result: DerivedStats = {
    maxHp: out.hp,
    maxMp: out.mp,
    attack: out.attack,
    defense: out.defense,
    magic: out.magic,
    spirit: out.spirit,
    agility: out.agility,
    luck: out.luck,
    critBonus: 0,
    elementBoost: {},
    elementResist: {},
    statusResist: {},
    mpCostMul: 1,
    lowHpAttackBonus: 0,
    attackElement: 'slash',
    battleStartBuffs: [],
  };

  for (const equipId of Object.values(member.equipment)) {
    if (!equipId) continue;
    const eq = data.equipment.get(equipId);
    if (!eq) continue;
    for (const [k, v] of Object.entries(eq.stats)) {
      const key = k as StatKey;
      if (key === 'hp') result.maxHp += v;
      else if (key === 'mp') result.maxMp += v;
      else result[key] += v;
    }
    if (eq.attackElement) result.attackElement = eq.attackElement;
    if (eq.elementBoost) {
      for (const [el, v] of Object.entries(eq.elementBoost)) {
        result.elementBoost[el as ElementId] = (result.elementBoost[el as ElementId] ?? 0) + v;
      }
    }
    if (eq.elementResist) {
      for (const [el, v] of Object.entries(eq.elementResist)) {
        const cur = result.elementResist[el as ElementId] ?? 1;
        result.elementResist[el as ElementId] = cur * v;
      }
    }
    if (eq.statusResist) {
      for (const [st, v] of Object.entries(eq.statusResist)) {
        const cur = result.statusResist[st as StatusId] ?? 0;
        result.statusResist[st as StatusId] = Math.min(1, cur + v);
      }
    }
    if (eq.mpCostMul) result.mpCostMul *= eq.mpCostMul;
    if (eq.lowHpAttackBonus) result.lowHpAttackBonus += eq.lowHpAttackBonus;
    if (eq.battleStartBuffs) result.battleStartBuffs.push(...eq.battleStartBuffs);
  }

  for (const pid of member.passives) {
    const p = data.skills.get(pid);
    if (!p?.passive) continue;
    if (p.passive.statMul) {
      for (const [k, mul] of Object.entries(p.passive.statMul)) {
        const key = k as StatKey;
        if (key === 'hp') result.maxHp = Math.floor(result.maxHp * mul);
        else if (key === 'mp') result.maxMp = Math.floor(result.maxMp * mul);
        else result[key] = Math.floor(result[key] * mul);
      }
    }
    if (p.passive.critBonus) result.critBonus += p.passive.critBonus;
    if (p.passive.elementBoost) {
      for (const [el, v] of Object.entries(p.passive.elementBoost)) {
        result.elementBoost[el as ElementId] = (result.elementBoost[el as ElementId] ?? 0) + v;
      }
    }
  }

  return result;
}

/** 転職・装備変更後に HP/MP を新しい最大値へクランプする */
export function clampVitals(member: PartyMember, data: GameData): void {
  const ds = derivedStats(member, data);
  member.hp = Math.min(member.hp, ds.maxHp);
  member.mp = Math.min(member.mp, ds.maxMp);
}
