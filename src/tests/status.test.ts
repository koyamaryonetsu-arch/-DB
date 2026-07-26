import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { createBattle, enemyUnits, partyUnits } from '../core/battle/engine';
import { tryApplyStatus, tickStatuses, checkActGate, cureStatuses } from '../core/battle/status';
import { data, strongHero, testState } from './helpers';

function battleWith(monsters: string[]) {
  const state = testState();
  state.party = [strongHero()];
  return createBattle({ party: state.party, monsterIds: monsters, inventory: state.inventory }, data);
}

describe('状態異常', () => {
  it('確率1.0なら必ず付与される', () => {
    const battle = battleWith(['koketsuno']);
    const [enemy] = enemyUnits(battle);
    const ok = tryApplyStatus(enemy, 'poison', 1, createRng(1), data);
    expect(ok).toBe(true);
    expect(enemy.statuses.some((s) => s.id === 'poison')).toBe(true);
  });

  it('耐性1.0（無効）なら付与されない', () => {
    const battle = battleWith(['gearhound']); // sleep 1
    const [enemy] = enemyUnits(battle);
    const ok = tryApplyStatus(enemy, 'sleep', 1, createRng(1), data);
    expect(ok).toBe(false);
  });

  it('耐性0.5なら成功率が半減する', () => {
    let success = 0;
    const trials = 2000;
    const rng = createRng(77);
    for (let i = 0; i < trials; i++) {
      const battle = battleWith(['rinneko']); // confusion 0.5
      const [enemy] = enemyUnits(battle);
      if (tryApplyStatus(enemy, 'confusion', 0.8, rng, data)) success++;
    }
    const rate = success / trials;
    expect(rate).toBeGreaterThan(0.3);
    expect(rate).toBeLessThan(0.5);
  });

  it('ボスは成功のたびに耐性が蓄積し、持続が短くなる', () => {
    const battle = battleWith(['balgrow']);
    const [boss] = enemyUnits(battle);
    // ボスは毒耐性0.5を持つため、確定付与になる基本確率で蓄積メカニズムを検証する
    const ok = tryApplyStatus(boss, 'poison', 2, createRng(2), data);
    expect(ok).toBe(true);
    expect(boss.statusAccum.poison).toBeCloseTo(0.35);
    const st = boss.statuses.find((s) => s.id === 'poison')!;
    // 通常 4〜6 ターン → ボスは半減で 2〜3 ターン
    expect(st.turns).toBeLessThanOrEqual(3);
  });

  it('毒はターン終了時に最大HP割合ダメージ', () => {
    const battle = battleWith(['koketsuno']);
    const [enemy] = enemyUnits(battle);
    tryApplyStatus(enemy, 'poison', 1, createRng(1), data);
    const before = enemy.hp;
    const events = tickStatuses(enemy, data);
    expect(enemy.hp).toBeLessThan(before);
    expect(events.some((e) => e.type === 'damage')).toBe(true);
  });

  it('睡眠中は行動不能', () => {
    const battle = battleWith(['koketsuno']);
    const [hero] = partyUnits(battle);
    hero.statuses.push({ id: 'sleep', turns: 2 });
    const gate = checkActGate(hero, createRng(1), data);
    expect(gate.canAct).toBe(false);
  });

  it('治療で状態異常が消える', () => {
    const battle = battleWith(['koketsuno']);
    const [hero] = partyUnits(battle);
    hero.statuses.push({ id: 'poison', turns: 3 });
    hero.statuses.push({ id: 'blind', turns: 3 });
    const removed = cureStatuses(hero, ['poison']);
    expect(removed).toEqual(['poison']);
    expect(hero.statuses.length).toBe(1);
    const removedAll = cureStatuses(hero, 'all');
    expect(removedAll).toEqual(['blind']);
    expect(hero.statuses.length).toBe(0);
  });
});
