import { describe, expect, it } from 'vitest';
import { createRng } from '../core/rng';
import {
  applyBattleResultToParty,
  createBattle,
  enemyUnits,
  partyUnits,
  resolveRound,
} from '../core/battle/engine';
import type { BattleEvent, Command } from '../core/battle/types';
import { data, strongHero, testGald, testHero, testMirea, testState } from './helpers';

function hasEvent(events: BattleEvent[], type: BattleEvent['type']): boolean {
  return events.some((e) => e.type === type);
}

describe('戦闘の基本フロー', () => {
  it('敵を全滅させると勝利し、報酬が計算される', () => {
    const state = testState();
    state.party = [strongHero()];
    const battle = createBattle(
      { party: state.party, monsterIds: ['koketsuno'], inventory: state.inventory },
      data
    );
    const rng = createRng(10);
    const [hero] = partyUnits(battle);
    const [enemy] = enemyUnits(battle);
    let events: BattleEvent[] = [];
    for (let i = 0; i < 5 && !battle.finished; i++) {
      events = resolveRound(
        battle,
        [{ type: 'attack', userUid: hero.uid, target: { kind: 'unit', uid: enemy.uid } }],
        rng,
        data
      );
    }
    expect(battle.finished).toBe('victory');
    expect(hasEvent(events, 'victory')).toBe(true);
    expect(battle.rewards).not.toBeNull();
    expect(battle.rewards!.exp).toBeGreaterThan(0);
    expect(battle.rewards!.jobExp).toBeGreaterThan(0);
    expect(battle.rewards!.maxEnemyLevel).toBe(2);
  });

  it('パーティー全滅で敗北イベント', () => {
    const state = testState();
    const weak = testHero();
    weak.hp = 1;
    state.party = [weak];
    const battle = createBattle(
      { party: state.party, monsterIds: ['gansekimogura'], inventory: state.inventory },
      data
    );
    const rng = createRng(3);
    const [hero] = partyUnits(battle);
    let defeated = false;
    for (let i = 0; i < 10 && !battle.finished; i++) {
      const events = resolveRound(battle, [{ type: 'defend', userUid: hero.uid }], rng, data);
      if (hasEvent(events, 'defeat')) defeated = true;
    }
    expect(battle.finished).toBe('defeat');
    expect(defeated).toBe(true);
  });

  it('戦闘不能になった仲間は行動せず、結果がパーティーへ書き戻される', () => {
    const state = testState();
    const weak = testHero();
    weak.hp = 1;
    state.party = [weak, testGald()];
    const battle = createBattle(
      { party: state.party, monsterIds: ['gansekimogura'], inventory: state.inventory },
      data
    );
    const rng = createRng(3);
    const units = partyUnits(battle);
    for (let i = 0; i < 6 && !battle.finished; i++) {
      resolveRound(
        battle,
        units.filter((u) => u.hp > 0).map((u) => ({ type: 'defend', userUid: u.uid }) as Command),
        rng,
        data
      );
      if (units[0].hp <= 0) break;
    }
    applyBattleResultToParty(battle, state.party);
    expect(state.party[0].hp).toBe(units[0].hp);
  });

  it('逃走は成功するとescapeで終了する', () => {
    const state = testState();
    const fast = strongHero(); // 素早さ50 → ほぼ確実に成功
    state.party = [fast];
    const battle = createBattle(
      { party: state.party, monsterIds: ['koketsuno'], inventory: state.inventory },
      data
    );
    const [hero] = partyUnits(battle);
    const events = resolveRound(battle, [{ type: 'flee', userUid: hero.uid }], createRng(4), data);
    expect(hasEvent(events, 'fleeResult')).toBe(true);
    expect(battle.finished).toBe('escape');
  });

  it('奥義ゲージは攻撃命中で増える（弱点はより多く）', () => {
    const state = testState();
    state.party = [strongHero()];
    const battle = createBattle(
      { party: state.party, monsterIds: ['hanekinoko'], inventory: state.inventory },
      data
    );
    const [hero] = partyUnits(battle);
    const [enemy] = enemyUnits(battle);
    hero.attackElement = 'lumen'; // ハネキノコの弱点
    resolveRound(
      battle,
      [{ type: 'attack', userUid: hero.uid, target: { kind: 'unit', uid: enemy.uid } }],
      createRng(8),
      data
    );
    expect(hero.gauge).toBeGreaterThanOrEqual(5);
  });

  it('奥義: ゲージ最大+HP50%以下で天環終刃が使え、ゲージが0に戻る', () => {
    const state = testState();
    const hero = strongHero();
    state.party = [hero];
    const battle = createBattle(
      { party: state.party, monsterIds: ['koketsuno', 'tsurukage'], inventory: state.inventory },
      data
    );
    const [heroUnit] = partyUnits(battle);
    heroUnit.gauge = 100;
    heroUnit.hp = Math.floor(heroUnit.stats.maxHp * 0.4);
    heroUnit.skills.push('tenkan_shuha');
    const events = resolveRound(
      battle,
      [{ type: 'skill', userUid: heroUnit.uid, skillId: 'tenkan_shuha', target: { kind: 'side', side: 'enemy' } }],
      createRng(11),
      data
    );
    expect(heroUnit.gauge).toBeLessThanOrEqual(20); // 使用で0、その後の被弾増加分のみ
    const dmgEvents = events.filter((e) => e.type === 'damage');
    expect(dmgEvents.length).toBeGreaterThanOrEqual(2); // 全体攻撃
  });

  it('奥義: HPが高いと天環終刃は失敗する', () => {
    const state = testState();
    state.party = [strongHero()];
    const battle = createBattle(
      { party: state.party, monsterIds: ['koketsuno'], inventory: state.inventory },
      data
    );
    const [heroUnit] = partyUnits(battle);
    heroUnit.gauge = 100;
    heroUnit.skills.push('tenkan_shuha');
    const events = resolveRound(
      battle,
      [{ type: 'skill', userUid: heroUnit.uid, skillId: 'tenkan_shuha', target: { kind: 'side', side: 'enemy' } }],
      createRng(12),
      data
    );
    expect(events.some((e) => e.type === 'message' && e.text.includes('引き出せない'))).toBe(true);
  });
});

describe('連携技: 双星交差', () => {
  function comboSetup() {
    const state = testState();
    const hero = strongHero();
    const mirea = testMirea();
    state.party = [hero, mirea];
    const battle = createBattle(
      { party: state.party, monsterIds: ['tsurukage'], inventory: state.inventory },
      data
    );
    return { battle, units: partyUnits(battle), enemy: enemyUnits(battle)[0] };
  }

  it('主人公の剣技+ミレアの星術で発動する', () => {
    const { battle, units, enemy } = comboSetup();
    const [heroU, mireaU] = units;
    const events = resolveRound(
      battle,
      [
        { type: 'skill', userUid: heroU.uid, skillId: 'kanjin', target: { kind: 'unit', uid: enemy.uid } },
        { type: 'skill', userUid: mireaU.uid, skillId: 'luxia', target: { kind: 'unit', uid: enemy.uid } },
      ],
      createRng(21),
      data
    );
    expect(events.some((e) => e.type === 'combo' && e.name === '双星交差')).toBe(true);
    // 両者のMPが消費されている
    expect(heroU.mp).toBeLessThan(heroU.stats.maxMp);
    expect(mireaU.mp).toBeLessThan(mireaU.stats.maxMp);
  });

  it('対応しない技の組み合わせでは発動しない', () => {
    const { battle, units, enemy } = comboSetup();
    const [heroU, mireaU] = units;
    const events = resolveRound(
      battle,
      [
        { type: 'attack', userUid: heroU.uid, target: { kind: 'unit', uid: enemy.uid } },
        { type: 'skill', userUid: mireaU.uid, skillId: 'luxia', target: { kind: 'unit', uid: enemy.uid } },
      ],
      createRng(22),
      data
    );
    expect(events.some((e) => e.type === 'combo')).toBe(false);
  });

  it('ミレアのMPが足りないと発動しない', () => {
    const { battle, units, enemy } = comboSetup();
    const [heroU, mireaU] = units;
    mireaU.mp = 0;
    const events = resolveRound(
      battle,
      [
        { type: 'skill', userUid: heroU.uid, skillId: 'kanjin', target: { kind: 'unit', uid: enemy.uid } },
        { type: 'skill', userUid: mireaU.uid, skillId: 'luxia', target: { kind: 'unit', uid: enemy.uid } },
      ],
      createRng(23),
      data
    );
    expect(events.some((e) => e.type === 'combo')).toBe(false);
  });
});

describe('ボス: 森喰いのバルグロウ', () => {
  function bossSetup() {
    const state = testState();
    const hero = strongHero();
    state.party = [hero];
    const battle = createBattle(
      {
        party: state.party,
        monsterIds: ['balgrow_root', 'balgrow', 'balgrow_root'],
        inventory: state.inventory,
        bossBattle: true,
      },
      data
    );
    return { battle, hero: partyUnits(battle)[0] };
  }

  it('HP50%以下でフェーズ2へ移行する', () => {
    const { battle, hero } = bossSetup();
    const boss = enemyUnits(battle).find((e) => e.monsterId === 'balgrow')!;
    boss.hp = Math.floor(boss.stats.maxHp * 0.52);
    const rng = createRng(31);
    let phased = false;
    for (let i = 0; i < 12 && !phased && !battle.finished; i++) {
      const events = resolveRound(
        battle,
        [{ type: 'attack', userUid: hero.uid, target: { kind: 'unit', uid: boss.uid } }],
        rng,
        data
      );
      if (events.some((e) => e.type === 'bossPhase' && e.phase === 2)) phased = true;
    }
    expect(phased).toBe(true);
    expect(boss.flags.phase2).toBe(1);
  });

  it('根が生きている間はボスの実効防御が高い', () => {
    const { battle } = bossSetup();
    const boss = enemyUnits(battle).find((e) => e.monsterId === 'balgrow')!;
    expect(boss.flags.rootGuard).toBe(1);
    const roots = enemyUnits(battle).filter((e) => e.monsterId === 'balgrow_root');
    expect(roots.length).toBe(2);
  });

  it('光熱属性を3回当てると暴走する', () => {
    const { battle, hero } = bossSetup();
    const boss = enemyUnits(battle).find((e) => e.monsterId === 'balgrow')!;
    hero.attackElement = 'lumen';
    const rng = createRng(33);
    let rampaged = false;
    for (let i = 0; i < 10 && !rampaged && !battle.finished; i++) {
      const events = resolveRound(
        battle,
        [{ type: 'attack', userUid: hero.uid, target: { kind: 'unit', uid: boss.uid } }],
        rng,
        data
      );
      if (events.some((e) => e.type === 'rampage')) rampaged = true;
    }
    expect(rampaged).toBe(true);
    expect(boss.buffs.attack).toBeGreaterThan(0);
    expect(boss.buffs.defense).toBeLessThan(0);
  });

  it('ボス戦では逃げられない', () => {
    const { battle, hero } = bossSetup();
    const events = resolveRound(battle, [{ type: 'flee', userUid: hero.uid }], createRng(35), data);
    const flee = events.find((e) => e.type === 'fleeResult');
    expect(flee).toBeDefined();
    expect((flee as { success: boolean }).success).toBe(false);
    expect(battle.finished).toBeNull();
  });
});

describe('戦闘中のアイテム使用', () => {
  it('いやし葉でHPが回復し、在庫が減る', () => {
    const state = testState();
    const hero = testHero();
    state.party = [hero];
    const battle = createBattle(
      { party: state.party, monsterIds: ['koketsuno'], inventory: state.inventory },
      data
    );
    const [heroU] = partyUnits(battle);
    heroU.hp = 5;
    const before = battle.inventory.items.iyashi_ba ?? 0;
    expect(before).toBeGreaterThan(0);
    const events = resolveRound(
      battle,
      [{ type: 'item', userUid: heroU.uid, itemId: 'iyashi_ba', target: { kind: 'unit', uid: heroU.uid } }],
      createRng(41),
      data
    );
    expect(events.some((e) => e.type === 'heal' && e.uid === heroU.uid)).toBe(true);
    expect(battle.inventory.items.iyashi_ba ?? 0).toBe(before - 1);
    expect(heroU.hp).toBeGreaterThan(5);
  });
});
