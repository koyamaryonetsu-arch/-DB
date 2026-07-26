// 状態異常: 付与判定（耐性 + ボス向け耐性蓄積）と毎ターンの処理

import type { Rng } from '../rng';
import type { GameData } from '../registry';
import type { StatusId } from '../types';
import type { BattleEvent, Combatant } from './types';

/**
 * 状態異常の付与判定。
 * 実効確率 = 基本確率 × (1 - 耐性 - 蓄積)。成功するとボスは耐性が蓄積する。
 */
export function tryApplyStatus(
  target: Combatant,
  statusId: StatusId,
  baseChance: number,
  rng: Rng,
  data: GameData
): boolean {
  const def = data.statuses.get(statusId);
  if (!def) return false;
  if (target.hp <= 0) return false;
  if (target.statuses.some((s) => s.id === statusId)) return false;
  const resist = target.statusResist[statusId] ?? 0;
  if (resist >= 1) return false;
  const accum = target.statusAccum[statusId] ?? 0;
  const chance = baseChance * (1 - Math.min(0.95, resist + accum));
  if (!rng.chance(chance)) return false;

  let [minT, maxT] = def.duration;
  if (target.isBoss) {
    // ボスには完全無効ではなく効果時間短縮 + 耐性蓄積で対応
    minT = Math.max(1, Math.floor(minT / 2));
    maxT = Math.max(1, Math.floor(maxT / 2));
    target.statusAccum[statusId] = accum + 0.35;
  }
  target.statuses.push({ id: statusId, turns: rng.range(minT, maxT) });
  return true;
}

export function removeStatus(target: Combatant, statusId: StatusId): boolean {
  const before = target.statuses.length;
  target.statuses = target.statuses.filter((s) => s.id !== statusId);
  return target.statuses.length < before;
}

export function cureStatuses(target: Combatant, which: StatusId[] | 'all'): StatusId[] {
  const removed: StatusId[] = [];
  if (which === 'all') {
    removed.push(...target.statuses.map((s) => s.id));
    target.statuses = [];
    return removed;
  }
  for (const id of which) {
    if (removeStatus(target, id)) removed.push(id);
  }
  return removed;
}

export function hasStatus(unit: Combatant, id: StatusId): boolean {
  return unit.statuses.some((s) => s.id === id);
}

export interface ActGate {
  canAct: boolean;
  redirectConfusion: boolean;
  events: BattleEvent[];
}

/** 行動直前の状態チェック（睡眠・麻痺・凍結・混乱・恐怖） */
export function checkActGate(unit: Combatant, rng: Rng, data: GameData): ActGate {
  const events: BattleEvent[] = [];
  for (const st of unit.statuses) {
    const def = data.statuses.get(st.id);
    if (!def) continue;
    if (def.blockAct) {
      events.push({ type: 'message', text: `${unit.name}は${def.name}で動けない！` });
      return { canAct: false, redirectConfusion: false, events };
    }
    if (def.blockActChance && rng.chance(def.blockActChance)) {
      events.push({ type: 'message', text: `${unit.name}は${def.name}で体が動かない！` });
      return { canAct: false, redirectConfusion: false, events };
    }
    if (def.confuse && rng.chance(0.6)) {
      return { canAct: true, redirectConfusion: true, events };
    }
  }
  return { canAct: true, redirectConfusion: false, events };
}

/** 被弾時: 睡眠・混乱が解けるか */
export function onDamagedWake(unit: Combatant, rng: Rng, data: GameData): BattleEvent[] {
  const events: BattleEvent[] = [];
  const remaining: typeof unit.statuses = [];
  for (const st of unit.statuses) {
    const def = data.statuses.get(st.id);
    if (def?.wakeOnHitChance && rng.chance(def.wakeOnHitChance)) {
      events.push({ type: 'message', text: `${unit.name}の${def.name}が解けた！` });
    } else {
      remaining.push(st);
    }
  }
  unit.statuses = remaining;
  return events;
}

/** ラウンド終了時: 継続ダメージと持続時間減少 */
export function tickStatuses(unit: Combatant, data: GameData): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (unit.hp <= 0) {
    unit.statuses = [];
    return events;
  }
  const remaining: typeof unit.statuses = [];
  for (const st of unit.statuses) {
    const def = data.statuses.get(st.id);
    if (!def) continue;
    if (def.dotPct) {
      const dmg = Math.max(1, Math.floor(unit.stats.maxHp * def.dotPct));
      unit.hp = Math.max(0, unit.hp - dmg);
      events.push({ type: 'message', text: `${unit.name}は${def.name}のダメージを受けた！` });
      events.push({
        type: 'damage',
        uid: unit.uid,
        amount: dmg,
        crit: false,
        element: 'none',
        hpAfter: unit.hp,
        weak: false,
        resist: false,
      });
      if (unit.hp <= 0) {
        events.push({ type: 'ko', uid: unit.uid });
        unit.statuses = [];
        return events;
      }
    }
    st.turns -= 1;
    if (st.turns <= 0) {
      events.push({ type: 'message', text: `${unit.name}の${def.name}が治った。` });
    } else {
      remaining.push(st);
    }
  }
  unit.statuses = remaining;
  return events;
}
