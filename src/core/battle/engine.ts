// 戦闘エンジン: コマンド列 → イベント列（決定的・Phaser非依存）

import type { Rng } from '../rng';
import type { GameData } from '../registry';
import type { ElementId, Inventory, PartyMember, SkillDefinition } from '../types';
import { derivedStats } from '../stats';
import { decideEnemyCommand } from './ai';
import { checkHit, computeDamage, computeHeal, effectiveAgility, fleeChance } from './damage';
import { checkActGate, cureStatuses, hasStatus, onDamagedWake, tickStatuses, tryApplyStatus } from './status';
import type {
  BattleEvent,
  BattleRewards,
  BattleState,
  Combatant,
  Command,
  TargetRef,
} from './types';
import { ZERO_BUFFS } from './types';

let uidCounter = 0;
function nextUid(prefix: string): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}`;
}

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export interface BattleSetup {
  party: PartyMember[];
  monsterIds: string[];
  inventory: Inventory;
  bossBattle?: boolean;
  difficulty?: 'story' | 'normal' | 'tactics';
}

export function memberToCombatant(member: PartyMember, index: number, data: GameData): Combatant {
  const ds = derivedStats(member, data);
  const unit: Combatant = {
    uid: nextUid('p'),
    side: 'party',
    name: member.name,
    level: member.level,
    stats: {
      maxHp: ds.maxHp,
      maxMp: ds.maxMp,
      attack: ds.attack,
      defense: ds.defense,
      magic: ds.magic,
      spirit: ds.spirit,
      agility: ds.agility,
      luck: ds.luck,
    },
    hp: Math.min(member.hp, ds.maxHp),
    mp: Math.min(member.mp, ds.maxMp),
    gauge: 0,
    row: member.row,
    statuses: [],
    buffs: { ...ZERO_BUFFS },
    flags: {},
    resistances: { ...ds.elementResist },
    statusResist: { ...ds.statusResist },
    statusAccum: {},
    skills: [...member.loadout],
    critBonus: ds.critBonus,
    elementBoost: { ...ds.elementBoost },
    mpCostMul: ds.mpCostMul,
    lowHpAttackBonus: ds.lowHpAttackBonus,
    attackElement: ds.attackElement,
    memberIndex: index,
    actorId: member.actorId,
    classId: member.classId,
  };
  for (const b of ds.battleStartBuffs) {
    unit.buffs[b.stat] = Math.max(-3, Math.min(3, (unit.buffs[b.stat] ?? 0) + b.stages));
  }
  return unit;
}

export function monsterToCombatant(
  monsterId: string,
  group: string,
  data: GameData,
  difficulty: 'story' | 'normal' | 'tactics'
): Combatant {
  const def = data.monsters.get(monsterId);
  if (!def) throw new Error(`未定義のモンスター: ${monsterId}`);
  const mul = difficulty === 'story' ? 0.85 : difficulty === 'tactics' ? 1.15 : 1;
  const stats = { ...def.stats };
  const unit: Combatant = {
    uid: nextUid('e'),
    side: 'enemy',
    name: def.name,
    level: def.level,
    stats: {
      maxHp: Math.floor(stats.hp * mul),
      maxMp: stats.mp,
      attack: Math.floor(stats.attack * mul),
      defense: Math.floor(stats.defense * (difficulty === 'tactics' ? 1.1 : 1)),
      magic: Math.floor(stats.magic * mul),
      spirit: stats.spirit,
      agility: stats.agility,
      luck: stats.luck,
    },
    hp: Math.floor(stats.hp * mul),
    mp: stats.mp,
    gauge: 0,
    row: 'front',
    statuses: [],
    buffs: { ...ZERO_BUFFS },
    flags: def.boss ? { rootGuard: monsterId === 'balgrow' ? 1 : 0, phase: 1 } : {},
    resistances: { ...def.resistances },
    statusResist: { ...def.statusResist },
    statusAccum: {},
    skills: [...def.skills],
    critBonus: 0,
    elementBoost: {},
    mpCostMul: 1,
    lowHpAttackBonus: 0,
    attackElement: 'slash',
    monsterId,
    group,
    isBoss: def.boss,
    aiFlags: {},
  };
  return unit;
}

export function createBattle(setup: BattleSetup, data: GameData): BattleState {
  const state: BattleState = {
    turn: 0,
    combatants: [],
    inventory: setup.inventory,
    fleeAttempts: 0,
    bossBattle: setup.bossBattle ?? false,
    finished: null,
    rewards: null,
    lootedItems: [],
    difficulty: setup.difficulty ?? 'normal',
    covers: [],
    defeatedMonsterIds: [],
  };
  setup.party.forEach((m, i) => {
    state.combatants.push(memberToCombatant(m, i, data));
  });
  // 同種モンスターはグループ化（例: コケツノA・コケツノB は同グループ）
  const groupByMonster = new Map<string, string>();
  let g = 0;
  for (const mid of setup.monsterIds) {
    if (!groupByMonster.has(mid)) {
      groupByMonster.set(mid, GROUP_LETTERS[g] ?? 'Z');
      g++;
    }
  }
  const counts = new Map<string, number>();
  for (const mid of setup.monsterIds) {
    const unit = monsterToCombatant(mid, groupByMonster.get(mid)!, data, state.difficulty);
    const n = (counts.get(mid) ?? 0) + 1;
    counts.set(mid, n);
    const total = setup.monsterIds.filter((x) => x === mid).length;
    if (total > 1) unit.name = `${unit.name}${GROUP_LETTERS[n - 1] ?? n}`;
    state.combatants.push(unit);
  }
  return state;
}

export function partyUnits(state: BattleState): Combatant[] {
  return state.combatants.filter((c) => c.side === 'party');
}

export function enemyUnits(state: BattleState): Combatant[] {
  return state.combatants.filter((c) => c.side === 'enemy');
}

export function aliveUnits(state: BattleState, side: 'party' | 'enemy'): Combatant[] {
  return state.combatants.filter((c) => c.side === side && c.hp > 0);
}

export function findUnit(state: BattleState, uid: string): Combatant | undefined {
  return state.combatants.find((c) => c.uid === uid);
}

// ---- ラウンド解決 ----

interface PlannedAction {
  cmd: Command;
  user: Combatant;
  priority: number;
  agility: number;
  tiebreak: number;
  comboWith?: { partner: Combatant; partnerSkill: SkillDefinition; comboDef: SkillDefinition };
}

export function resolveRound(
  state: BattleState,
  partyCommands: Command[],
  rng: Rng,
  data: GameData
): BattleEvent[] {
  const events: BattleEvent[] = [];
  if (state.finished) return events;
  state.turn += 1;
  state.covers = [];
  for (const c of state.combatants) {
    delete c.flags.defending;
    if (c.flags.taunt) {
      c.flags.taunt -= 1;
      if (c.flags.taunt <= 0) delete c.flags.taunt;
    }
  }

  const commands: Command[] = [...partyCommands];
  for (const enemy of aliveUnits(state, 'enemy')) {
    const cmd = decideEnemyCommand(enemy, state, rng, data);
    if (cmd) commands.push(cmd);
  }

  let planned: PlannedAction[] = [];
  for (const cmd of commands) {
    const user = findUnit(state, cmd.userUid);
    if (!user || user.hp <= 0) continue;
    let priority = 0;
    if (cmd.type === 'defend') priority = 100;
    if (cmd.type === 'item' || cmd.type === 'equip') priority = 50;
    if (cmd.type === 'flee') priority = 90;
    if (cmd.type === 'skill') {
      const def = data.skills.get(cmd.skillId);
      if (def?.cover || def?.taunt) priority = 80;
      if (def?.priority) priority = def.priority;
    }
    planned.push({
      cmd,
      user,
      priority,
      agility: effectiveAgility(user, data),
      tiebreak: rng.next(),
    });
  }

  planned = detectCombos(planned, state, rng, data, events);

  planned.sort((a, b) => b.priority - a.priority || b.agility - a.agility || b.tiebreak - a.tiebreak);

  for (const action of planned) {
    if (state.finished) break;
    if (action.user.hp <= 0) continue;
    executeAction(state, action, rng, data, events);
    checkBattleEnd(state, data, rng, events);
  }

  if (!state.finished) {
    for (const unit of state.combatants) {
      if (unit.hp <= 0) continue;
      const tickEvents = tickStatuses(unit, data);
      events.push(...tickEvents);
      if (tickEvents.some((e) => e.type === 'ko') && unit.side === 'party') {
        gaugeOnAllyKo(state, events);
      }
    }
    checkBattleEnd(state, data, rng, events);
  }
  return events;
}

/** 連携技: 対応するタグの技を同じターンに選ぶと融合する */
function detectCombos(
  planned: PlannedAction[],
  state: BattleState,
  _rng: Rng,
  data: GameData,
  _events: BattleEvent[]
): PlannedAction[] {
  const comboDefs = [...data.skills.values()].filter((s) => s.kind === 'combo' && s.comboParts);
  for (const combo of comboDefs) {
    const parts = combo.comboParts!;
    if (parts.length !== 2) continue;
    const found: { action: PlannedAction; skill: SkillDefinition }[] = [];
    for (const part of parts) {
      const action = planned.find((a) => {
        if (a.cmd.type !== 'skill' || a.user.actorId !== part.actorId || a.user.hp <= 0) return false;
        const def = data.skills.get(a.cmd.skillId);
        return !!def && (def.tags ?? []).includes(part.tag) && def.power > 0;
      });
      if (!action) break;
      const skill = data.skills.get((action.cmd as Extract<Command, { type: 'skill' }>).skillId);
      if (!skill) break;
      found.push({ action, skill });
    }
    if (found.length !== 2) continue;
    const [lead, follow] = found;
    // MP が両者とも足りている場合のみ発動
    const leadCost = Math.ceil(lead.skill.mpCost * lead.action.user.mpCostMul);
    const followCost = Math.ceil(follow.skill.mpCost * follow.action.user.mpCostMul);
    if (lead.action.user.mp < leadCost || follow.action.user.mp < followCost) continue;
    lead.action.comboWith = {
      partner: follow.action.user,
      partnerSkill: follow.skill,
      comboDef: combo,
    };
    planned = planned.filter((a) => a !== follow.action);
    void state;
  }
  return planned;
}

function executeAction(
  state: BattleState,
  action: PlannedAction,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  const user = action.user;
  const cmd = action.cmd;

  const gate = checkActGate(user, rng, data);
  events.push(...gate.events);
  if (!gate.canAct) return;

  if (gate.redirectConfusion) {
    const candidates = state.combatants.filter((c) => c.hp > 0 && c.uid !== user.uid);
    if (candidates.length > 0) {
      const target = rng.pick(candidates);
      events.push({ type: 'message', text: `${user.name}は混乱している！` });
      performAttack(state, user, target, rng, data, events);
    }
    return;
  }

  switch (cmd.type) {
    case 'attack': {
      const target = resolveSingleTarget(state, cmd.target, user, rng);
      if (!target) return;
      events.push({ type: 'actStart', uid: user.uid, label: `${user.name}の攻撃！` });
      performAttack(state, user, target, rng, data, events);
      return;
    }
    case 'defend':
      user.flags.defending = 1;
      events.push({ type: 'message', text: `${user.name}は身を固めた。` });
      return;
    case 'flee': {
      state.fleeAttempts += 1;
      const maxEnemyAgi = Math.max(...aliveUnits(state, 'enemy').map((e) => effectiveAgility(e, data)), 0);
      const p = fleeChance(effectiveAgility(user, data), maxEnemyAgi, state.fleeAttempts - 1, state.bossBattle);
      events.push({ type: 'message', text: `${user.name}たちは逃げ出した！` });
      if (rng.chance(p)) {
        state.finished = 'escape';
        events.push({ type: 'fleeResult', success: true });
      } else {
        events.push({ type: 'fleeResult', success: false });
        events.push({ type: 'message', text: 'しかし回り込まれてしまった！' });
      }
      return;
    }
    case 'item':
      executeItem(state, user, cmd.itemId, cmd.target, rng, data, events);
      return;
    case 'equip':
      events.push({ type: 'message', text: `${user.name}は装備を持ち替えた。` });
      return;
    case 'skill':
      executeSkill(state, action, rng, data, events);
      return;
  }
}

function performAttack(
  state: BattleState,
  user: Combatant,
  targetIn: Combatant,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  const target = applyCover(state, user, targetIn, events);
  const element = user.attackElement;
  const input = {
    attacker: user,
    defender: target,
    power: 100,
    element,
    category: 'physical' as const,
    rng,
    state,
    data,
  };
  if (!checkHit(input, 95)) {
    events.push({ type: 'miss', uid: target.uid });
    events.push({ type: 'message', text: `ミス！ ${target.name}にかわされた！` });
    return;
  }
  const result = computeDamage(input);
  applyDamage(state, user, target, result.amount, element, result.crit, result.mult, rng, data, events);
}

function executeSkill(
  state: BattleState,
  action: PlannedAction,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  const user = action.user;
  const cmd = action.cmd as Extract<Command, { type: 'skill' }>;

  // 召喚（AI専用の擬似スキル）
  if (cmd.skillId.startsWith('__summon:')) {
    const monsterId = cmd.skillId.slice('__summon:'.length);
    if (aliveUnits(state, 'enemy').length >= 6) return;
    const def = data.monsters.get(monsterId);
    if (!def) return;
    const unit = monsterToCombatant(monsterId, 'S', data, state.difficulty);
    state.combatants.push(unit);
    events.push({ type: 'message', text: `${user.name}は仲間を呼んだ！` });
    events.push({ type: 'summon', uid: unit.uid, name: unit.name, monsterId });
    return;
  }

  const def = data.skills.get(cmd.skillId);
  if (!def) return;

  // 連携技へ差し替え
  if (action.comboWith) {
    executeCombo(state, action, def, rng, data, events);
    return;
  }

  if (def.kind === 'spell' && hasStatus(user, 'silence')) {
    events.push({ type: 'message', text: `${user.name}は沈黙していて術式を唱えられない！` });
    return;
  }

  // コスト
  if (def.ougi) {
    const cost = def.gaugeCost ?? 100;
    if (user.gauge < cost) {
      events.push({ type: 'message', text: `${user.name}の奥義ゲージが足りない！` });
      return;
    }
    if (def.requiresHpRateLte && user.hp > user.stats.maxHp * def.requiresHpRateLte) {
      events.push({ type: 'message', text: `${user.name}はまだ力を引き出せない！` });
      return;
    }
    user.gauge = 0;
    events.push({ type: 'gauge', uid: user.uid, value: 0 });
  } else {
    const cost = Math.ceil(def.mpCost * user.mpCostMul);
    if (user.mp < cost) {
      events.push({ type: 'message', text: `${user.name}のMPが足りない！` });
      return;
    }
    user.mp -= cost;
  }

  const label = def.kind === 'spell' ? `${user.name}は${def.name}を唱えた！` : `${user.name}の${def.name}！`;
  events.push({ type: 'actStart', uid: user.uid, label });

  // 自己・味方向け効果
  if (def.taunt) {
    user.flags.taunt = 3;
    events.push({ type: 'message', text: `${user.name}は敵の注意を引き付けた！` });
  }
  if (def.cover) {
    const allies = aliveUnits(state, user.side).filter((c) => c.uid !== user.uid);
    if (allies.length > 0) {
      const weakest = allies.reduce((a, b) => (a.hp / a.stats.maxHp < b.hp / b.stats.maxHp ? a : b));
      state.covers.push({ coverUid: user.uid, protectUid: weakest.uid });
      events.push({ type: 'message', text: `${user.name}は${weakest.name}をかばっている！` });
    }
  }

  const targets = expandTargets(state, user, cmd.target, def, rng);
  if (targets.length === 0 && def.power > 0) {
    events.push({ type: 'message', text: 'しかし対象がいなかった。' });
    return;
  }

  // 蘇生
  if (def.revive) {
    for (const t of targets) {
      if (t.hp > 0) continue;
      t.hp = Math.max(1, Math.floor(t.stats.maxHp * def.revive));
      t.statuses = [];
      events.push({ type: 'revive', uid: t.uid, hpAfter: t.hp });
      events.push({ type: 'message', text: `${t.name}が立ち上がった！` });
    }
    return;
  }

  for (const t of targets) {
    if (t.hp <= 0) continue;
    // 強化解除
    if (def.dispel) {
      const keys = Object.entries(t.buffs).filter(([, v]) => v > 0);
      if (keys.length > 0) {
        const [k] = keys[0];
        t.buffs[k as keyof typeof t.buffs] = 0;
        events.push({ type: 'message', text: `${t.name}の強化が打ち消された！` });
      }
    }
    // ダメージ
    if (def.power > 0) {
      const hits = def.hits ?? 1;
      for (let h = 0; h < hits; h++) {
        if (t.hp <= 0) break;
        const category = def.category === 'magical' ? 'magical' : 'physical';
        const input = {
          attacker: user,
          defender: applyCover(state, user, t, events),
          power: def.power,
          element: def.element,
          category: category as 'physical' | 'magical',
          defensePierce: def.defensePierce,
          rng,
          state,
          data,
        };
        if (!checkHit(input, def.accuracy ?? 95)) {
          events.push({ type: 'miss', uid: input.defender.uid });
          events.push({ type: 'message', text: `ミス！ ${input.defender.name}にかわされた！` });
          continue;
        }
        const result = computeDamage(input);
        applyDamage(
          state,
          user,
          input.defender,
          result.amount,
          def.element,
          result.crit,
          result.mult,
          rng,
          data,
          events
        );
        if (def.drainHp && result.amount > 0) {
          const heal = Math.min(Math.floor(result.amount * def.drainHp), user.stats.maxHp - user.hp);
          if (heal > 0) {
            user.hp += heal;
            events.push({ type: 'heal', uid: user.uid, amount: heal, hpAfter: user.hp });
          }
        }
        if (def.drainMp) {
          const steal = Math.min(def.drainMp, input.defender.mp);
          if (steal > 0) {
            input.defender.mp -= steal;
            user.mp = Math.min(user.stats.maxMp, user.mp + steal);
            events.push({ type: 'message', text: `${user.name}はMPを${steal}吸い取った！` });
          }
        }
        // 使用後の自己デバフ（天環終刃）
        if (def.selfAfterBuffs && h === hits - 1) {
          for (const b of def.selfAfterBuffs) {
            user.buffs[b.stat] = Math.max(-3, Math.min(3, user.buffs[b.stat] + b.stages));
            events.push({ type: 'buff', uid: user.uid, stat: b.stat, stages: b.stages });
          }
        }
      }
    }
    // 回復
    if (def.healPower) {
      const amount = Math.min(computeHeal(user, def.healPower, rng), t.stats.maxHp - t.hp);
      if (amount > 0) {
        t.hp += amount;
        events.push({ type: 'heal', uid: t.uid, amount, hpAfter: t.hp });
        gaugeGain(state, user, Math.max(1, Math.min(8, Math.ceil(amount / 20))), events, data);
      } else {
        events.push({ type: 'message', text: `${t.name}のHPは満タンだ。` });
      }
    }
    if (def.healMp) {
      const amount = Math.min(def.healMp, t.stats.maxMp - t.mp);
      if (amount > 0) {
        t.mp += amount;
        events.push({ type: 'healMp', uid: t.uid, amount });
      }
    }
    // 状態回復
    if (def.cureStatus) {
      const removed = cureStatuses(t, def.cureStatus);
      for (const st of removed) {
        events.push({ type: 'cure', uid: t.uid, statusId: st });
        const stDef = data.statuses.get(st);
        events.push({ type: 'message', text: `${t.name}の${stDef?.name ?? st}が治った！` });
      }
      if (removed.length === 0 && def.power === 0 && !def.healPower) {
        events.push({ type: 'message', text: 'しかし何も起こらなかった。' });
      }
    }
    // 状態異常付与
    if (def.addStatus && t.hp > 0) {
      for (const st of def.addStatus) {
        const applied = tryApplyStatus(t, st.id, st.chance, rng, data);
        const stDef = data.statuses.get(st.id);
        if (applied) {
          events.push({ type: 'status', uid: t.uid, statusId: st.id, applied: true });
          events.push({ type: 'message', text: `${t.name}は${stDef?.name ?? st.id}状態になった！` });
        } else if (def.power === 0 && !def.buffs) {
          events.push({ type: 'message', text: `${t.name}には効かなかった！` });
        }
      }
    }
    // バフ・デバフ
    if (def.buffs && t.hp > 0) {
      for (const b of def.buffs) {
        const before = t.buffs[b.stat];
        t.buffs[b.stat] = Math.max(-3, Math.min(3, before + b.stages));
        if (t.buffs[b.stat] !== before) {
          events.push({ type: 'buff', uid: t.uid, stat: b.stat, stages: b.stages });
          const dir = b.stages > 0 ? '上がった' : '下がった';
          events.push({ type: 'message', text: `${t.name}の${buffName(b.stat)}が${dir}！` });
        } else {
          events.push({ type: 'message', text: `${t.name}には効かなかった。` });
        }
      }
    }
    // 盗む
    if (def.steal && t.side === 'enemy' && !t.stolen) {
      const chance = 0.4 + user.stats.luck / 500;
      if (rng.chance(chance)) {
        t.stolen = true;
        const monster = t.monsterId ? data.monsters.get(t.monsterId) : null;
        const itemId = monster?.drops.find((d) => d.itemId)?.itemId ?? 'iyashi_ba';
        state.lootedItems.push(itemId);
        state.inventory.items[itemId] = (state.inventory.items[itemId] ?? 0) + 1;
        const item = data.items.get(itemId);
        events.push({ type: 'itemGain', itemId, name: item?.name ?? itemId });
        events.push({ type: 'message', text: `${user.name}は${item?.name ?? itemId}を盗んだ！` });
      } else {
        events.push({ type: 'message', text: '盗めなかった！' });
      }
    }
  }
}

function executeCombo(
  state: BattleState,
  action: PlannedAction,
  leadSkill: SkillDefinition,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  const user = action.user;
  const { partner, partnerSkill, comboDef } = action.comboWith!;
  if (partner.hp <= 0) {
    // 相方が倒れていたら通常発動へ
    action.comboWith = undefined;
    executeSkill(state, action, rng, data, events);
    return;
  }
  const leadCost = Math.ceil(leadSkill.mpCost * user.mpCostMul);
  const followCost = Math.ceil(partnerSkill.mpCost * partner.mpCostMul);
  user.mp -= Math.min(user.mp, leadCost);
  partner.mp -= Math.min(partner.mp, followCost);

  events.push({ type: 'combo', name: comboDef.name });
  events.push({ type: 'message', text: `連携技！ ${user.name}と${partner.name}の${comboDef.name}！` });

  const cmd = action.cmd as Extract<Command, { type: 'skill' }>;
  const target = resolveSingleTarget(state, cmd.target, user, rng);
  if (!target) return;

  // 物理パート（先導者）+ 魔法パート（相方）の複合ダメージ
  const physInput = {
    attacker: user,
    defender: target,
    power: Math.floor(leadSkill.power * 0.9),
    element: comboDef.element,
    category: 'physical' as const,
    rng,
    state,
    data,
  };
  const phys = computeDamage(physInput);
  const magInput = {
    attacker: partner,
    defender: target,
    power: Math.floor(partnerSkill.power * 0.9),
    element: comboDef.element,
    category: 'magical' as const,
    rng,
    state,
    data,
  };
  const mag = computeDamage(magInput);
  const total = phys.amount + mag.amount;
  applyDamage(state, user, target, total, comboDef.element, phys.crit, phys.mult, rng, data, events);
}

function executeItem(
  state: BattleState,
  user: Combatant,
  itemId: string,
  targetRef: TargetRef,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  const item = data.items.get(itemId);
  if (!item?.effect) return;
  if ((state.inventory.items[itemId] ?? 0) <= 0) {
    events.push({ type: 'message', text: `${item.name}を持っていない！` });
    return;
  }
  const target = resolveItemTarget(state, targetRef, user, item.target, rng);
  if (!target) {
    events.push({ type: 'message', text: 'しかし対象がいなかった。' });
    return;
  }
  events.push({ type: 'actStart', uid: user.uid, label: `${user.name}は${item.name}を使った！` });
  const eff = item.effect;
  let used = false;
  if (eff.revive && target.hp <= 0) {
    target.hp = Math.max(1, Math.floor(target.stats.maxHp * eff.revive));
    target.statuses = [];
    events.push({ type: 'revive', uid: target.uid, hpAfter: target.hp });
    events.push({ type: 'message', text: `${target.name}が立ち上がった！` });
    used = true;
  } else if (target.hp > 0) {
    if (eff.healHp) {
      const amount = Math.min(eff.healHp, target.stats.maxHp - target.hp);
      if (amount > 0) {
        target.hp += amount;
        events.push({ type: 'heal', uid: target.uid, amount, hpAfter: target.hp });
        used = true;
      }
    }
    if (eff.healMp) {
      const amount = Math.min(eff.healMp, target.stats.maxMp - target.mp);
      if (amount > 0) {
        target.mp += amount;
        events.push({ type: 'healMp', uid: target.uid, amount });
        used = true;
      }
    }
    if (eff.cureStatus) {
      const removed = cureStatuses(target, eff.cureStatus);
      for (const st of removed) {
        events.push({ type: 'cure', uid: target.uid, statusId: st });
        const stDef = data.statuses.get(st);
        events.push({ type: 'message', text: `${target.name}の${stDef?.name ?? st}が治った！` });
        used = true;
      }
    }
  }
  if (used) {
    const cur = state.inventory.items[itemId] ?? 0;
    if (cur <= 1) delete state.inventory.items[itemId];
    else state.inventory.items[itemId] = cur - 1;
  } else {
    events.push({ type: 'message', text: 'しかし何も起こらなかった。' });
  }
}

// ---- ダメージ適用と共通処理 ----

function applyCover(
  state: BattleState,
  attacker: Combatant,
  target: Combatant,
  events: BattleEvent[]
): Combatant {
  if (attacker.side === target.side) return target;
  const cover = state.covers.find((c) => c.protectUid === target.uid);
  if (!cover) return target;
  const coverUnit = findUnit(state, cover.coverUid);
  if (!coverUnit || coverUnit.hp <= 0) return target;
  events.push({ type: 'message', text: `${coverUnit.name}が${target.name}をかばった！` });
  return coverUnit;
}

function applyDamage(
  state: BattleState,
  attacker: Combatant,
  target: Combatant,
  amount: number,
  element: ElementId,
  crit: boolean,
  mult: number,
  rng: Rng,
  data: GameData,
  events: BattleEvent[]
): void {
  if (mult === 0) {
    events.push({ type: 'message', text: `${target.name}には効かなかった！` });
    return;
  }
  target.hp = Math.max(0, target.hp - amount);
  if (crit) events.push({ type: 'message', text: '会心の一撃！' });
  events.push({
    type: 'damage',
    uid: target.uid,
    amount,
    crit,
    element,
    hpAfter: target.hp,
    weak: mult >= 1.25,
    resist: mult > 0 && mult <= 0.75,
  });

  // 奥義ゲージ: 攻撃側（命中 +3 / 弱点 +5）・被弾側（割合に応じ 1〜10）
  if (attacker.side === 'party') {
    gaugeGain(state, attacker, mult >= 1.25 ? 5 : 3, events, data);
  }
  if (target.side === 'party' && target.hp > 0) {
    const rate = amount / target.stats.maxHp;
    gaugeGain(state, target, Math.max(1, Math.min(10, Math.ceil(rate * 10))), events, data);
  }

  // 被弾で目覚める
  if (target.hp > 0) {
    events.push(...onDamagedWake(target, rng, data));
  }

  // バルグロウ: 光熱属性を受けすぎると暴走
  if (target.monsterId === 'balgrow' && element === 'lumen' && amount > 0 && !target.flags.rampage) {
    target.flags.lumenHits = (target.flags.lumenHits ?? 0) + 1;
    if (target.flags.lumenHits >= 3) {
      target.flags.rampage = 1;
      target.buffs.attack = Math.min(3, target.buffs.attack + 2);
      target.buffs.defense = Math.max(-3, target.buffs.defense - 1);
      events.push({ type: 'rampage', uid: target.uid });
      events.push({
        type: 'message',
        text: `${target.name}は熱に灼かれ、暴走を始めた！ 攻撃が苛烈になるが、守りが緩んでいる！`,
      });
    }
  }

  if (target.hp <= 0) {
    events.push({ type: 'ko', uid: target.uid });
    events.push({ type: 'message', text: `${target.name}を倒した！` });
    if (target.side === 'enemy' && target.monsterId) {
      state.defeatedMonsterIds.push(target.monsterId);
      // 根がすべて枯れたらボスの守りが緩む
      if (target.monsterId === 'balgrow_root') {
        const rootsAlive = state.combatants.some((c) => c.hp > 0 && c.monsterId === 'balgrow_root');
        if (!rootsAlive) {
          events.push({
            type: 'message',
            text: '縛りの根が枯れ落ちた！ バルグロウの守りが弱まっている！',
          });
        }
      }
    }
    if (target.side === 'party') {
      gaugeOnAllyKo(state, events);
    }
  } else if (target.isBoss && !target.flags.phase2 && target.hp <= target.stats.maxHp * 0.5) {
    target.flags.phase2 = 1;
    target.flags.phase = 2;
    events.push({ type: 'bossPhase', phase: 2 });
    events.push({
      type: 'message',
      text: `${target.name}の腹の奥で、空洞の森がざわめき出した…！`,
    });
  }
}

function gaugeGain(
  state: BattleState,
  unit: Combatant,
  amount: number,
  events: BattleEvent[],
  data: GameData
): void {
  if (unit.side !== 'party') return;
  if (unit.statuses.some((s) => data.statuses.get(s.id)?.gaugeBlock)) return;
  const before = unit.gauge;
  unit.gauge = Math.max(0, Math.min(100, unit.gauge + amount));
  if (unit.gauge !== before) {
    events.push({ type: 'gauge', uid: unit.uid, value: unit.gauge });
  }
  void state;
}

function gaugeOnAllyKo(state: BattleState, events: BattleEvent[]): void {
  for (const ally of aliveUnits(state, 'party')) {
    const before = ally.gauge;
    ally.gauge = Math.min(100, ally.gauge + 15);
    if (ally.gauge !== before) events.push({ type: 'gauge', uid: ally.uid, value: ally.gauge });
  }
}

// ---- 対象解決 ----

function resolveSingleTarget(
  state: BattleState,
  ref: TargetRef,
  user: Combatant,
  rng: Rng
): Combatant | null {
  if (ref.kind === 'self') return user;
  if (ref.kind === 'unit') {
    const t = findUnit(state, ref.uid);
    if (t && t.hp > 0) return t;
    // 対象が倒れていたら同じ側の別対象へ
    const side = t?.side ?? (user.side === 'party' ? 'enemy' : 'party');
    const alive = aliveUnits(state, side);
    return alive.length > 0 ? rng.pick(alive) : null;
  }
  const side = ref.kind === 'side' ? ref.side : 'enemy';
  const alive = aliveUnits(state, side);
  return alive.length > 0 ? rng.pick(alive) : null;
}

function resolveItemTarget(
  state: BattleState,
  ref: TargetRef,
  user: Combatant,
  itemTarget: string,
  rng: Rng
): Combatant | null {
  if (itemTarget === 'allyDead') {
    if (ref.kind === 'unit') {
      const t = findUnit(state, ref.uid);
      if (t && t.hp <= 0) return t;
    }
    const dead = state.combatants.filter((c) => c.side === user.side && c.hp <= 0);
    return dead[0] ?? null;
  }
  if (ref.kind === 'unit') {
    const t = findUnit(state, ref.uid);
    if (t && t.hp > 0) return t;
  }
  return resolveSingleTarget(state, ref, user, rng);
}

function expandTargets(
  state: BattleState,
  user: Combatant,
  ref: TargetRef,
  def: SkillDefinition,
  rng: Rng
): Combatant[] {
  const oppSide = user.side === 'party' ? 'enemy' : 'party';
  switch (def.target) {
    case 'self':
      return [user];
    case 'allyAll':
      return aliveUnits(state, user.side);
    case 'allySingle': {
      if (ref.kind === 'unit') {
        const t = findUnit(state, ref.uid);
        if (t && t.hp > 0 && t.side === user.side) return [t];
      }
      // AI: 最もHP割合が低い味方
      const allies = aliveUnits(state, user.side);
      if (allies.length === 0) return [];
      return [allies.reduce((a, b) => (a.hp / a.stats.maxHp < b.hp / b.stats.maxHp ? a : b))];
    }
    case 'allyDead': {
      if (ref.kind === 'unit') {
        const t = findUnit(state, ref.uid);
        if (t && t.hp <= 0 && t.side === user.side) return [t];
      }
      const dead = state.combatants.filter((c) => c.side === user.side && c.hp <= 0);
      return dead.length > 0 ? [dead[0]] : [];
    }
    case 'enemyAll':
      return aliveUnits(state, oppSide);
    case 'enemyGroup': {
      if (ref.kind === 'group') {
        const g = aliveUnits(state, oppSide).filter((c) => c.group === ref.group);
        if (g.length > 0) return g;
      }
      if (ref.kind === 'unit') {
        const t = findUnit(state, ref.uid);
        if (t && t.side === oppSide) {
          const g = aliveUnits(state, oppSide).filter((c) => c.group === t.group);
          if (g.length > 0) return g;
        }
      }
      // フォールバック: ランダムなグループ
      const alive = aliveUnits(state, oppSide);
      if (alive.length === 0) return [];
      const g = rng.pick(alive).group;
      return alive.filter((c) => c.group === g);
    }
    case 'enemySingle':
    default: {
      const t = resolveSingleTarget(state, ref.kind === 'self' ? { kind: 'side', side: oppSide } : ref, user, rng);
      return t && t.side !== user.side ? [t] : t ? [t] : [];
    }
  }
}

// ---- 勝敗と報酬 ----

function checkBattleEnd(state: BattleState, data: GameData, rng: Rng, events: BattleEvent[]): void {
  if (state.finished) return;
  if (aliveUnits(state, 'party').length === 0) {
    state.finished = 'defeat';
    events.push({ type: 'defeat' });
    return;
  }
  if (aliveUnits(state, 'enemy').length === 0) {
    state.finished = 'victory';
    state.rewards = computeRewards(state, data, rng);
    events.push({ type: 'victory' });
  }
}

export function computeRewards(state: BattleState, data: GameData, rng: Rng): BattleRewards {
  let exp = 0;
  let gold = 0;
  let jobExp = 0;
  let maxEnemyLevel = 1;
  const drops: { itemId?: string; equipId?: string }[] = [];
  for (const mid of state.defeatedMonsterIds) {
    const def = data.monsters.get(mid);
    if (!def) continue;
    exp += def.exp;
    gold += def.gold;
    jobExp += def.jobExp;
    maxEnemyLevel = Math.max(maxEnemyLevel, def.level);
    for (const drop of def.drops) {
      if (rng.chance(drop.chance)) drops.push({ itemId: drop.itemId, equipId: drop.equipId });
    }
  }
  return { exp, gold, jobExp, maxEnemyLevel, drops };
}

/** 戦闘結果をパーティーへ書き戻す（状態異常は戦闘終了で解除） */
export function applyBattleResultToParty(state: BattleState, party: PartyMember[]): void {
  for (const unit of state.combatants) {
    if (unit.side !== 'party' || unit.memberIndex === undefined) continue;
    const member = party[unit.memberIndex];
    if (!member) continue;
    member.hp = unit.hp;
    member.mp = unit.mp;
    member.gauge = unit.gauge;
  }
}

export function buffName(stat: string): string {
  switch (stat) {
    case 'attack':
      return '攻撃力';
    case 'defense':
      return '守備力';
    case 'magic':
      return '魔力';
    case 'spirit':
      return '精神';
    case 'agility':
      return '素早さ';
    case 'accuracy':
      return '命中';
    case 'evasion':
      return '回避';
    default:
      return stat;
  }
}
