import { describe, expect, it } from 'vitest';
import { addEquip, equipFromInventory, useItemOnMember } from '../core/inventory';
import { scoutChance } from '../core/scout';
import { derivedStats } from '../core/stats';
import { advanceSteps, restToMorning, STEPS_PER_SEGMENT } from '../core/daynight';
import { data, testState } from './helpers';

describe('アイテム使用（フィールド）', () => {
  it('回復アイテムでHPが回復し在庫が減る', () => {
    const state = testState();
    const hero = state.party[0];
    hero.hp = 5;
    const before = state.inventory.items.iyashi_ba;
    const result = useItemOnMember('iyashi_ba', hero, state.inventory, data);
    expect(result.used).toBe(true);
    expect(hero.hp).toBeGreaterThan(5);
    expect(state.inventory.items.iyashi_ba).toBe(before - 1);
  });

  it('HP満タンでは消費されない', () => {
    const state = testState();
    const hero = state.party[0];
    const before = state.inventory.items.iyashi_ba;
    const result = useItemOnMember('iyashi_ba', hero, state.inventory, data);
    expect(result.used).toBe(false);
    expect(state.inventory.items.iyashi_ba).toBe(before);
  });

  it('蘇生アイテムは倒れた仲間にのみ使える', () => {
    const state = testState();
    const hero = state.party[0];
    state.inventory.items.inochi_shizuku = 1;
    const aliveResult = useItemOnMember('inochi_shizuku', hero, state.inventory, data);
    expect(aliveResult.used).toBe(false);
    hero.hp = 0;
    const deadResult = useItemOnMember('inochi_shizuku', hero, state.inventory, data);
    expect(deadResult.used).toBe(true);
    expect(hero.hp).toBeGreaterThan(0);
  });
});

describe('装備変更', () => {
  it('装備すると能力が変わり、外した装備は在庫へ戻る', () => {
    const state = testState();
    const hero = state.party[0];
    addEquip(state.inventory, 'douka_ken');
    const before = derivedStats(hero, data).attack;
    const ok = equipFromInventory(hero, 'weapon', 'douka_ken', state.inventory, data);
    expect(ok).toBe(true);
    const after = derivedStats(hero, data).attack;
    expect(after).toBeGreaterThan(before);
    expect(state.inventory.equips.renshu_ken).toBe(1); // 元の木剣が在庫へ
  });

  it('職業が扱えない武器種は装備できない', () => {
    const state = testState();
    const hero = state.party[0]; // 環剣士: 剣/大剣のみ
    addEquip(state.inventory, 'minarai_jo');
    const ok = equipFromInventory(hero, 'weapon', 'minarai_jo', state.inventory, data);
    expect(ok).toBe(false);
  });
});

describe('仲間モンスターのスカウト率', () => {
  const koketsuno = data.monsters.get('koketsuno')!;
  const balgrow = data.monsters.get('balgrow')!;

  it('基本確率から獣奏士と好物で上がる', () => {
    const base = scoutChance(koketsuno, {
      beastCallerInParty: false, favoriteUsed: false, killedByStatus: false,
    });
    const withBeast = scoutChance(koketsuno, {
      beastCallerInParty: true, favoriteUsed: false, killedByStatus: false,
    });
    const withTreat = scoutChance(koketsuno, {
      beastCallerInParty: true, favoriteUsed: true, killedByStatus: false,
    });
    expect(base).toBeCloseTo(0.25);
    expect(withBeast).toBeCloseTo(0.375);
    expect(withTreat).toBeCloseTo(0.6);
  });

  it('状態異常で倒すと確率が下がる', () => {
    const lowered = scoutChance(koketsuno, {
      beastCallerInParty: false, favoriteUsed: false, killedByStatus: true,
    });
    expect(lowered).toBeCloseTo(0.125);
  });

  it('ボスはスカウト不可', () => {
    expect(
      scoutChance(balgrow, { beastCallerInParty: true, favoriteUsed: true, killedByStatus: false })
    ).toBe(0);
  });
});

describe('昼夜サイクル', () => {
  it('歩数で時間帯が進む', () => {
    const state = testState();
    expect(state.timeIndex).toBe(0);
    const changed = advanceSteps(state, STEPS_PER_SEGMENT);
    expect(changed).toBe(1);
    expect(state.timeIndex).toBe(1);
  });

  it('宿に泊まると朝になる', () => {
    const state = testState();
    advanceSteps(state, STEPS_PER_SEGMENT * 3); // 夜
    expect(state.timeIndex).toBe(3);
    restToMorning(state);
    expect(state.timeIndex).toBe(0);
  });
});
