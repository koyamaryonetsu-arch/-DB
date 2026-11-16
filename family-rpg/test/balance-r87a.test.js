// 第87回 A班: 呪文と 回復の 頭打ち（docs/plan-balance-r87.md の 3-A）
//   味方は 頭打ちの あとも 3分の 1 の 速さで のびる（足す 分は ＋1.0 まで）。scaleCap の 技・敵の 側は 今の まま
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle } from '../public/js/shared/battle.js';
import { powScaleOf, powScaleFor, growsAfterCap } from '../public/js/shared/pow-scale.js';
import { powScale, partPower } from '../public/js/shared/skill-power.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ''} ${a} ≒ ${b}`);
// 前の 式（第86回まで）
const oldScale = (pow, e) => 1 + Math.max(0, Math.min(e.scaleCap ?? 1, ((pow || 0) - (e.thr ?? 20)) / 150));

function setup() {
  const c = newCharacter({ id: 'p0', name: 'ミナ', job: 'mage' });
  gainExp(c, expForLevel(30));
  fullHeal(c);
  const rng = makeRng(5);
  const b = new Battle({ rng, allies: [{ char: c, controller: 's0' }], enemies: ['rockman'], canFlee: true });
  const me = b.allies[0], foe = b.enemies[0];
  foe.resist = {};
  foe.defending = false;
  return { b, me, foe };
}

test('式: 頭打ちの 前は 前と 同じ・こえた 分は 3分の 1・＋1.0 まで', () => {
  const e = { thr: 90 };
  for (const pow of [0, 50, 90, 120, 180, 239, 240]) near(powScaleOf(pow, e, true), oldScale(pow, e), `魔力 ${pow}`);
  // 文書の 例: 魔力 255 → 2.03倍・349 → 2.24倍・437 → 2.44倍
  near(powScaleOf(255, e, true), 2 + 15 / 450);
  assert.equal(powScaleOf(255, e, true).toFixed(2), '2.03');
  assert.equal(powScaleOf(349, e, true).toFixed(2), '2.24');
  assert.equal(powScaleOf(437, e, true).toFixed(2), '2.44');
  // ＋1.0 まで（めやす ＋600 で 3倍。その 先は のびない）
  near(powScaleOf(90 + 600, e, true), 3);
  near(powScaleOf(90 + 2000, e, true), 3);
  // thr が ない 技は 20
  near(powScaleOf(20 + 300, {}, true), 2 + 1 / 3);
});

test('scaleCap の 技・敵の 側は 今の まま', () => {
  const e = { thr: 10, scaleCap: 1.6 };
  for (const pow of [100, 250, 400, 900]) near(powScaleOf(pow, e, true), oldScale(pow, e), `scaleCap 魔力 ${pow}`);
  for (const pow of [100, 250, 400, 900]) near(powScaleOf(pow, { thr: 90 }, false), oldScale(pow, { thr: 90 }), `敵 魔力 ${pow}`);
  assert.equal(growsAfterCap({ side: 'ally' }), true);
  assert.equal(growsAfterCap({ side: 'enemy' }), false);
  assert.equal(growsAfterCap({ side: 'ally', flip: true }), false, 'かけの 魔物は 敵と おなじ');
  assert.equal(growsAfterCap(null), false);
  near(powScaleFor({ side: 'enemy' }, 437, { thr: 90 }), 2);
  near(powScaleFor({ side: 'ally' }, 437, { thr: 90 }), 2 + (437 - 240) / 450);
});

test('呪文（calcMagic）: 味方は のびる・敵は 前と 同じ 数字', () => {
  const { b, me, foe } = setup();
  const eff = { type: 'magic', base: [300, 300], thr: 90 };
  me.mag = 437; me.buffs = {};
  const ally = b.calcMagic(me, foe, eff, 1, true).dmg;
  me.mag = 240;
  const allyCap = b.calcMagic(me, foe, eff, 1, true).dmg;
  assert.equal(allyCap, 600, '頭打ちの 所は 前と 同じ 2倍');
  assert.ok(Math.abs(ally - Math.round(300 * (2 + 197 / 450))) <= 1, `${ally}`);
  // 敵の 側: 前の 式と おなじ（頭打ち）
  const save = { mag: foe.mag, buffs: foe.buffs };
  foe.buffs = {};
  me.defending = false;
  foe.mag = 437;
  const hi = b.calcMagic(foe, me, eff, 1, true).dmg;
  foe.mag = 240;
  const lo = b.calcMagic(foe, me, eff, 1, true).dmg;
  assert.equal(hi, lo, '敵は 頭打ちの まま');
  Object.assign(foe, save);
  // scaleCap の 技は 味方でも 頭打ちの まま
  me.mag = 437;
  const capped = b.calcMagic(me, foe, { ...eff, scaleCap: 1 }, 1, true).dmg;
  assert.equal(capped, 600);
});

test('回復（heal・healAmountOf）も 同じ 形・fixed は そのまま', () => {
  const { b, me, foe } = setup();
  const eff = { type: 'heal', base: [100, 100], thr: 90 };
  me.healPow = 437;
  assert.equal(b.healAmountOf(me, eff), Math.round(100 * (2 + 197 / 450)));
  assert.equal(b.healAmountOf(me, { ...eff, fixed: true }), 100);
  me.healPow = 200;
  assert.equal(b.healAmountOf(me, eff), Math.round(100 * oldScale(200, eff)), '頭打ちの 前は 前と 同じ');
  foe.healPow = 437;
  assert.equal(b.healAmountOf(foe, eff), b.healAmountOf({ ...foe, healPow: 240 }, eff), '敵の 回復は 頭打ちの まま');
  // heal（戦いの 中で 本当に 回復する 所）
  me.healPow = 437;
  me.hp = 1; me.maxHp = 9999;
  const ev = { lines: [], upd: [], results: [] };
  b.heal(me, me, eff, ev, 1);
  assert.equal(me.hp - 1, Math.round(100 * (2 + 197 / 450)));
});

test('技の せつめい（skill-power）も 同じ 式', () => {
  const e = { type: 'magic', base: [100, 120], thr: 90 };
  near(powScale(437, e), powScaleOf(437, e, true));
  const p = partPower(e, 1, { mag: 437, heal: 0 });
  const k = powScaleOf(437, e, true);
  assert.equal(p.min, Math.round(100 * k));
  assert.equal(p.max, Math.round(120 * k));
  const h = partPower({ type: 'heal', base: [100, 100], thr: 90 }, 1, { mag: 0, heal: 437 });
  assert.equal(h.min, Math.round(100 * k));
});
