// 第50回: レベル99より 上は、1つ 上がるのに いる 経験値が 2.5倍
import test from 'node:test';
import assert from 'node:assert/strict';
import { expForLevel, HIGH_LEVEL, HIGH_EXP_MULT, EXP_RATE, newCharacter, gainExp } from '../public/js/shared/stats.js';

const old = (lv) => (lv <= 1 ? 0 : Math.round((6 * Math.pow(lv - 1, 2.5) + 6 * (lv - 1)) * EXP_RATE));

test('第50回: 99までは 前の まま・100から 1レベルぶんが 約2.5倍', () => {
  assert.equal(HIGH_LEVEL, 99);
  assert.equal(HIGH_EXP_MULT, 2.5);
  for (const lv of [1, 2, 10, 50, 98, 99]) assert.equal(expForLevel(lv), old(lv));
  for (const lv of [100, 101, 120, 150]) {
    const step = expForLevel(lv) - expForLevel(lv - 1);
    const was = old(lv) - old(lv - 1);
    assert.ok(Math.abs(step / was - 2.5) < 0.001, `Lv${lv}: ${step} / ${was}`);
  }
  for (let lv = 2; lv <= 150; lv++) assert.ok(expForLevel(lv) > expForLevel(lv - 1));
});

test('第50回: 前の きまりで 99より 上だった キャラは レベルが 下がらない', () => {
  const c = newCharacter({ name: 'テスト', job: 'warrior' });
  c.level = 110;
  c.exp = old(110);
  gainExp(c, 10);
  assert.equal(c.level, 110);
});
