// 所持品・装備の操作

import type { GameData } from './registry';
import type { EquipSlot, Inventory, PartyMember } from './types';
import { clampVitals, derivedStats } from './stats';

export function addItem(inv: Inventory, itemId: string, count = 1): void {
  inv.items[itemId] = (inv.items[itemId] ?? 0) + count;
}

export function removeItem(inv: Inventory, itemId: string, count = 1): boolean {
  const cur = inv.items[itemId] ?? 0;
  if (cur < count) return false;
  if (cur === count) delete inv.items[itemId];
  else inv.items[itemId] = cur - count;
  return true;
}

export function addEquip(inv: Inventory, equipId: string, count = 1): void {
  inv.equips[equipId] = (inv.equips[equipId] ?? 0) + count;
}

export function removeEquip(inv: Inventory, equipId: string, count = 1): boolean {
  const cur = inv.equips[equipId] ?? 0;
  if (cur < count) return false;
  if (cur === count) delete inv.equips[equipId];
  else inv.equips[equipId] = cur - count;
  return true;
}

/** 装備できるか（武器種は職業の allowedWeapons で判定） */
export function canEquip(member: PartyMember, equipId: string, data: GameData): boolean {
  const eq = data.equipment.get(equipId);
  if (!eq) return false;
  if (eq.slot === 'weapon') {
    const cls = data.classes.get(member.classId);
    if (!cls || !eq.weaponType) return false;
    return cls.allowedWeapons.includes(eq.weaponType);
  }
  return true;
}

/** 装備変更: 在庫から着け、外した装備は在庫へ戻す */
export function equipFromInventory(
  member: PartyMember,
  slot: EquipSlot,
  equipId: string | null,
  inv: Inventory,
  data: GameData
): boolean {
  if (equipId !== null) {
    if (!canEquip(member, equipId, data)) return false;
    const eq = data.equipment.get(equipId);
    if (!eq || eq.slot !== slot) return false;
    if (!removeEquip(inv, equipId)) return false;
  }
  const prev = member.equipment[slot];
  if (prev) addEquip(inv, prev);
  if (equipId === null) delete member.equipment[slot];
  else member.equipment[slot] = equipId;
  clampVitals(member, data);
  return true;
}

/** アイテムをフィールド/メニューで使用（戦闘中は engine 側で処理） */
export interface ItemUseResult {
  used: boolean;
  message: string;
}

export function useItemOnMember(
  itemId: string,
  member: PartyMember,
  inv: Inventory,
  data: GameData
): ItemUseResult {
  const item = data.items.get(itemId);
  if (!item || !item.effect) return { used: false, message: 'つかえない。' };
  const eff = item.effect;
  const ds = memberMaxes(member, data);
  const dead = member.hp <= 0;

  if (eff.revive) {
    if (!dead) return { used: false, message: `${member.name}は倒れていない。` };
    if (!removeItem(inv, itemId)) return { used: false, message: 'もっていない。' };
    member.hp = Math.max(1, Math.floor(ds.maxHp * eff.revive));
    return { used: true, message: `${member.name}が目を覚ました！` };
  }
  if (dead) return { used: false, message: `${member.name}には届かない…。` };

  let message = '';
  if (eff.healHp) {
    if (member.hp >= ds.maxHp && !eff.healMp && !eff.cureStatus)
      return { used: false, message: 'HPは満タンだ。' };
    const heal = Math.min(eff.healHp, ds.maxHp - member.hp);
    member.hp += heal;
    message = `${member.name}のHPが${heal}回復した。`;
  }
  if (eff.healMp) {
    const heal = Math.min(eff.healMp, ds.maxMp - member.mp);
    member.mp += heal;
    message = message || `${member.name}のMPが${heal}回復した。`;
  }
  if (eff.cureStatus) {
    message = message || `${member.name}の状態が回復した。`;
  }
  if (!message) return { used: false, message: '効果がなかった。' };
  removeItem(inv, itemId);
  return { used: true, message };
}

function memberMaxes(member: PartyMember, data: GameData): { maxHp: number; maxMp: number } {
  const ds = derivedStats(member, data);
  return { maxHp: ds.maxHp, maxMp: ds.maxMp };
}
