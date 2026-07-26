import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { createBattle, partyUnits, enemyUnits } from '../core/battle/engine';
import { computeDamage, computeHeal, elementMultiplier, fleeChance, buffMul } from '../core/battle/damage';
import { data, strongHero, testState } from './helpers';

function setup(monsters: string[] = ['koketsuno']) {
  const state = testState();
  state.party = [strongHero()];
  const battle = createBattle(
    { party: state.party, monsterIds: monsters, inventory: state.inventory },
    data
  );
  return battle;
}

describe('ダメージ計算', () => {
  it('物理ダメージは攻撃力と威力に比例し、最低1', () => {
    const battle = setup();
    const [hero] = partyUnits(battle);
    const [enemy] = enemyUnits(battle);
    const rng = createRng(1);
    const out = computeDamage({
      attacker: hero,
      defender: enemy,
      power: 100,
      element: 'slash',
      category: 'physical',
      rng,
      state: battle,
      data,
    });
    expect(out.amount).toBeGreaterThan(0);
    const expectedBase = (hero.stats.attack * 100) / 100 - enemy.stats.defense / 2;
    expect(out.amount).toBeGreaterThan(expectedBase * 0.5);
  });

  it('弱点属性はダメージ倍率が上がる', () => {
    const battle = setup(['hanekinoko']); // 光熱1.5倍
    const [hero] = partyUnits(battle);
    const [enemy] = enemyUnits(battle);
    expect(elementMultiplier(enemy, 'lumen')).toBe(1.5);
    expect(elementMultiplier(enemy, 'slash')).toBe(1);
    const rngA = createRng(5);
    const rngB = createRng(5);
    const normal = computeDamage({
      attacker: hero, defender: enemy, power: 100, element: 'slash',
      category: 'physical', rng: rngA, state: battle, data,
    });
    const weak = computeDamage({
      attacker: hero, defender: enemy, power: 100, element: 'lumen',
      category: 'physical', rng: rngB, state: battle, data,
    });
    expect(weak.amount).toBeGreaterThan(normal.amount);
  });

  it('無効属性は0ダメージ', () => {
    const battle = setup(['gearhound']); // psyche 0
    const [hero] = partyUnits(battle);
    const [enemy] = enemyUnits(battle);
    const out = computeDamage({
      attacker: hero, defender: enemy, power: 100, element: 'psyche',
      category: 'magical', rng: createRng(1), state: battle, data,
    });
    expect(out.amount).toBe(0);
    expect(out.mult).toBe(0);
  });

  it('バフ段階は乗数になる', () => {
    const battle = setup();
    const [hero] = partyUnits(battle);
    hero.buffs.attack = 2;
    expect(buffMul(hero, 'attack')).toBe(1.5);
    hero.buffs.attack = -2;
    expect(buffMul(hero, 'attack')).toBe(0.5);
  });

  it('回復量は精神に比例し正の値', () => {
    const battle = setup();
    const [hero] = partyUnits(battle);
    const rng = createRng(3);
    const heal = computeHeal(hero, 45, rng);
    expect(heal).toBeGreaterThanOrEqual(45 * 0.9);
    expect(heal).toBeGreaterThan(0);
  });
});

describe('逃走確率', () => {
  it('素早さ差と試行回数で上がる', () => {
    const base = fleeChance(10, 10, 0, false);
    const faster = fleeChance(30, 10, 0, false);
    const retried = fleeChance(10, 10, 2, false);
    expect(faster).toBeGreaterThan(base);
    expect(retried).toBeGreaterThan(base);
  });

  it('確率は 0.15〜0.95 に収まる', () => {
    expect(fleeChance(1, 99, 0, false)).toBeGreaterThanOrEqual(0.15);
    expect(fleeChance(99, 1, 9, false)).toBeLessThanOrEqual(0.95);
  });

  it('ボス戦では逃げられない', () => {
    expect(fleeChance(99, 1, 5, true)).toBe(0);
  });
});
