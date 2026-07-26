import { loadGameData } from '../core/dataload';
import { createMember, buildNewGame } from '../core/newgame';
import type { PartyMember, RunState } from '../core/types';
import { derivedStats } from '../core/stats';

export const data = loadGameData();

export function testHero(overrides?: Partial<PartyMember>): PartyMember {
  const m = createMember('hero', data, { name: 'テスト', gender: 'a', appearance: 0 });
  Object.assign(m, overrides);
  const ds = derivedStats(m, data);
  m.hp = Math.min(m.hp, ds.maxHp);
  m.mp = Math.min(m.mp, ds.maxMp);
  return m;
}

export function strongHero(): PartyMember {
  const m = createMember('hero', data, { name: 'ツヨシ', gender: 'a', appearance: 0 });
  m.baseStats = { hp: 500, mp: 100, attack: 60, defense: 40, magic: 40, spirit: 30, agility: 50, luck: 10 };
  const ds = derivedStats(m, data);
  m.hp = ds.maxHp;
  m.mp = ds.maxMp;
  return m;
}

export function testState(): RunState {
  return buildNewGame({ name: 'テスト', gender: 'a', appearance: 0, seed: 12345 }, data);
}

export function testMirea(): PartyMember {
  return createMember('mirea', data);
}

export function testGald(): PartyMember {
  return createMember('gald', data);
}
