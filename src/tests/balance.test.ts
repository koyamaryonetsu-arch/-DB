// バランス検証: 実プレイ相当の行動方針で戦闘をシミュレートし、
// 「ボスが倒せる・かつ即死級に簡単ではない」ことを機械的に確認する。

import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import { createBattle, enemyUnits, partyUnits, resolveRound } from '../core/battle/engine';
import type { BattleState, Command } from '../core/battle/types';
import { gainExp, totalExpForLevel } from '../core/leveling';
import { syncLearnedForClass } from '../core/mastery';
import { createMember } from '../core/newgame';
import { derivedStats } from '../core/stats';
import type { Inventory, PartyMember } from '../core/types';
import { data } from './helpers';

function buildParty(level: number): PartyMember[] {
  const rng = createRng(1000 + level);
  const hero = createMember('hero', data, { name: '勇者' });
  const mirea = createMember('mirea', data);
  const gald = createMember('gald', data);
  const party = [hero, mirea, gald];
  for (const m of party) {
    const actor = data.actors.get(m.actorId)!;
    gainExp(m, actor, totalExpForLevel(level), rng);
    m.mastery[m.classId] = 120; // ランク3相当
    syncLearnedForClass(m, data.classes.get(m.classId)!, data);
  }
  hero.equipment = { weapon: 'kandoki', body: 'kawa_yoroi', shield: 'kiban_tate' };
  mirea.equipment = { weapon: 'minarai_jo', body: 'tabi_fuku' };
  gald.equipment = { weapon: 'heidan_yari', shield: 'tekkan_tate', body: 'kawa_yoroi', head: 'tekkan_kabuto' };
  for (const m of party) {
    const ds = derivedStats(m, data);
    m.hp = ds.maxHp;
    m.mp = ds.maxMp;
  }
  return party;
}

function inventory(): Inventory {
  return { items: { iyashi_ba: 6, iyashi_tsuyu: 4, gedoku_mi: 2 }, equips: {}, gold: 0 };
}

/** 実プレイ相当の行動方針 */
function decideCommands(battle: BattleState, round: number): Command[] {
  const commands: Command[] = [];
  const alive = partyUnits(battle).filter((u) => u.hp > 0);
  const enemies = enemyUnits(battle).filter((e) => e.hp > 0);
  if (enemies.length === 0) return commands;
  // 根 → ボスの順に狙う
  const root = enemies.find((e) => e.monsterId === 'balgrow_root');
  const boss = enemies.find((e) => e.isBoss);
  const target = root ?? boss ?? enemies.reduce((a, b) => (a.hp < b.hp ? a : b));

  for (const unit of alive) {
    // 回復: HP35%未満の味方がいたら道具を使う
    const wounded = alive.find((u) => u.hp < u.stats.maxHp * 0.35);
    const potion = (battle.inventory.items.iyashi_tsuyu ?? 0) > 0
      ? 'iyashi_tsuyu'
      : (battle.inventory.items.iyashi_ba ?? 0) > 0
        ? 'iyashi_ba'
        : null;
    if (wounded && potion && unit.actorId !== 'mirea') {
      commands.push({ type: 'item', userUid: unit.uid, itemId: potion, target: { kind: 'unit', uid: wounded.uid } });
      continue;
    }
    if (unit.actorId === 'gald' && round === 1) {
      commands.push({ type: 'skill', userUid: unit.uid, skillId: 'teppeki_shisei', target: { kind: 'self' } });
      continue;
    }
    if (unit.actorId === 'hero' && unit.skills.includes('kanjin') && unit.mp >= 3) {
      commands.push({ type: 'skill', userUid: unit.uid, skillId: 'kanjin', target: { kind: 'unit', uid: target.uid } });
      continue;
    }
    if (unit.actorId === 'mirea' && unit.skills.includes('luxia') && unit.mp >= 3) {
      commands.push({ type: 'skill', userUid: unit.uid, skillId: 'luxia', target: { kind: 'unit', uid: target.uid } });
      continue;
    }
    commands.push({ type: 'attack', userUid: unit.uid, target: { kind: 'unit', uid: target.uid } });
  }
  return commands;
}

function simulate(
  level: number,
  monsterIds: string[],
  seed: number,
  boss: boolean
): { result: string; rounds: number } {
  const party = buildParty(level);
  const battle = createBattle({ party, monsterIds, inventory: inventory(), bossBattle: boss }, data);
  const rng = createRng(seed);
  let round = 0;
  while (!battle.finished && round < 40) {
    round++;
    resolveRound(battle, decideCommands(battle, round), rng, data);
  }
  return { result: battle.finished ?? 'timeout', rounds: round };
}

describe('バランスシミュレーション', () => {
  it('レベル4パーティーは森の雑魚に安定して勝てる', () => {
    let wins = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { result } = simulate(4, ['tsurukage', 'koketsuno'], 9000 + seed, false);
      if (result === 'victory') wins++;
    }
    console.log('trash lv4 wins:', wins, '/20');
    expect(wins).toBeGreaterThanOrEqual(18);
  });

  it('レベル5（準備不足）ではボスは危険な相手になる', () => {
    let wins = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { result } = simulate(5, ['balgrow_root', 'balgrow', 'balgrow_root'], 6000 + seed, true);
      if (result === 'victory') wins++;
    }
    console.log('boss lv5 wins:', wins, '/20');
    expect(wins).toBeLessThanOrEqual(14);
  });

  it('レベル7パーティーはボスに勝ち得る（勝率30%以上）', () => {
    let wins = 0;
    let totalRounds = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { result, rounds } = simulate(7, ['balgrow_root', 'balgrow', 'balgrow_root'], 7000 + seed, true);
      if (result === 'victory') {
        wins++;
        totalRounds += rounds;
      }
    }
    console.log('boss lv7 wins:', wins, '/20 avg rounds:', wins > 0 ? (totalRounds / wins).toFixed(1) : '-');
    expect(wins).toBeGreaterThanOrEqual(6);
  });

  it('レベル9パーティーならボスに安定して勝てる（勝率70%以上）', () => {
    let wins = 0;
    let totalRounds = 0;
    let winCount = 0;
    for (let seed = 0; seed < 20; seed++) {
      const { result, rounds } = simulate(9, ['balgrow_root', 'balgrow', 'balgrow_root'], 8000 + seed, true);
      if (result === 'victory') {
        wins++;
        totalRounds += rounds;
        winCount++;
      }
    }
    console.log('boss lv9 wins:', wins, '/20 avg rounds:', winCount>0? (totalRounds/winCount).toFixed(1):'-');
    expect(wins).toBeGreaterThanOrEqual(14);
    // ボス戦が一瞬で終わる茶番になっていないこと
    if (winCount > 0) {
      expect(totalRounds / winCount).toBeGreaterThanOrEqual(5);
    }
  });
});
