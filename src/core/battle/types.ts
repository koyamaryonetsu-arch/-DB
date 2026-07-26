// 戦闘の内部表現とイベント列

import type { BuffKey, ElementId, Inventory, StatusId } from '../types';

export interface CombatStats {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  magic: number;
  spirit: number;
  agility: number;
  luck: number;
}

export interface ActiveStatus {
  id: StatusId;
  turns: number;
}

export interface Combatant {
  uid: string;
  side: 'party' | 'enemy';
  name: string;
  level: number;
  stats: CombatStats;
  hp: number;
  mp: number;
  gauge: number;
  row: 'front' | 'back';
  statuses: ActiveStatus[];
  buffs: Record<BuffKey, number>;
  flags: Record<string, number>;
  resistances: Partial<Record<ElementId, number>>;
  statusResist: Partial<Record<StatusId, number>>;
  /** 同種状態異常の成功で蓄積する追加耐性（ボス調整用） */
  statusAccum: Partial<Record<StatusId, number>>;
  skills: string[];
  critBonus: number;
  elementBoost: Partial<Record<ElementId, number>>;
  mpCostMul: number;
  lowHpAttackBonus: number;
  attackElement: ElementId;
  // party 側
  memberIndex?: number;
  actorId?: string;
  classId?: string;
  // enemy 側
  monsterId?: string;
  group?: string;
  isBoss?: boolean;
  aiFlags?: Record<string, number>;
  stolen?: boolean;
}

export type TargetRef =
  | { kind: 'unit'; uid: string }
  | { kind: 'group'; group: string }
  | { kind: 'side'; side: 'party' | 'enemy' }
  | { kind: 'self' };

export type Command =
  | { type: 'attack'; userUid: string; target: TargetRef }
  | { type: 'skill'; userUid: string; skillId: string; target: TargetRef }
  | { type: 'defend'; userUid: string }
  | { type: 'item'; userUid: string; itemId: string; target: TargetRef }
  | { type: 'equip'; userUid: string; slot: 'weapon' | 'shield'; equipId: string }
  | { type: 'flee'; userUid: string };

export type BattleEvent =
  | { type: 'message'; text: string }
  | { type: 'actStart'; uid: string; label: string }
  | {
      type: 'damage';
      uid: string;
      amount: number;
      crit: boolean;
      element: ElementId;
      hpAfter: number;
      weak: boolean;
      resist: boolean;
    }
  | { type: 'miss'; uid: string }
  | { type: 'heal'; uid: string; amount: number; hpAfter: number }
  | { type: 'healMp'; uid: string; amount: number }
  | { type: 'status'; uid: string; statusId: StatusId; applied: boolean }
  | { type: 'cure'; uid: string; statusId: StatusId }
  | { type: 'buff'; uid: string; stat: BuffKey; stages: number }
  | { type: 'ko'; uid: string }
  | { type: 'revive'; uid: string; hpAfter: number }
  | { type: 'gauge'; uid: string; value: number }
  | { type: 'combo'; name: string }
  | { type: 'summon'; uid: string; name: string; monsterId: string }
  | { type: 'bossPhase'; phase: number }
  | { type: 'rampage'; uid: string }
  | { type: 'itemGain'; itemId: string; name: string }
  | { type: 'fleeResult'; success: boolean }
  | { type: 'victory' }
  | { type: 'defeat' }
  | { type: 'shake' }
  | { type: 'flash' };

export interface BattleRewards {
  exp: number;
  gold: number;
  jobExp: number;
  maxEnemyLevel: number;
  drops: { itemId?: string; equipId?: string }[];
}

export interface BattleState {
  turn: number;
  combatants: Combatant[];
  inventory: Inventory;
  fleeAttempts: number;
  bossBattle: boolean;
  finished: 'victory' | 'defeat' | 'escape' | null;
  rewards: BattleRewards | null;
  lootedItems: string[];
  difficulty: 'story' | 'normal' | 'tactics';
  /** かばう: coverUid が protectUid への単体攻撃を肩代わり */
  covers: { coverUid: string; protectUid: string }[];
  defeatedMonsterIds: string[];
}

export const ZERO_BUFFS: Record<BuffKey, number> = {
  attack: 0,
  defense: 0,
  magic: 0,
  spirit: 0,
  agility: 0,
  accuracy: 0,
  evasion: 0,
};
