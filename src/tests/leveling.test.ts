import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { gainExp, levelForExp, totalExpForLevel, DIFFICULTY_EXP_MUL } from '../core/leveling';
import { data, testHero } from './helpers';

describe('レベルアップ', () => {
  it('経験値曲線は単調増加', () => {
    for (let l = 2; l <= 20; l++) {
      expect(totalExpForLevel(l)).toBeGreaterThan(totalExpForLevel(l - 1));
    }
  });

  it('levelForExp と totalExpForLevel が整合する', () => {
    expect(levelForExp(0)).toBe(1);
    expect(levelForExp(totalExpForLevel(5))).toBe(5);
    expect(levelForExp(totalExpForLevel(5) - 1)).toBe(4);
  });

  it('経験値を得るとレベルアップし能力が成長する', () => {
    const hero = testHero();
    const actor = data.actors.get('hero')!;
    const before = { ...hero.baseStats };
    const result = gainExp(hero, actor, totalExpForLevel(3), createRng(42));
    expect(result).not.toBeNull();
    expect(result!.from).toBe(1);
    expect(result!.to).toBe(3);
    expect(hero.level).toBe(3);
    expect(hero.baseStats.hp).toBeGreaterThan(before.hp);
    expect(hero.baseStats.attack).toBeGreaterThan(before.attack);
  });

  it('成長は決定的（同シードで同結果）', () => {
    const a = testHero();
    const b = testHero();
    const actor = data.actors.get('hero')!;
    gainExp(a, actor, 500, createRng(7));
    gainExp(b, actor, 500, createRng(7));
    expect(a.baseStats).toEqual(b.baseStats);
  });

  it('性格による弱体化は起きない（全成長が正）', () => {
    const hero = testHero();
    hero.personality.ambition = 20;
    const actor = data.actors.get('hero')!;
    const before = { ...hero.baseStats };
    gainExp(hero, actor, totalExpForLevel(10), createRng(9));
    for (const key of Object.keys(before) as (keyof typeof before)[]) {
      expect(hero.baseStats[key]).toBeGreaterThanOrEqual(before[key]);
    }
  });

  it('難易度で経験値補正が変わる', () => {
    expect(DIFFICULTY_EXP_MUL.story).toBeGreaterThan(DIFFICULTY_EXP_MUL.normal);
    expect(DIFFICULTY_EXP_MUL.tactics).toBeLessThan(DIFFICULTY_EXP_MUL.normal);
  });
});
