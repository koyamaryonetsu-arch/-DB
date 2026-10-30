// 第54回: 味方が 5人 そろって いる ときは、ゲストは 戦いに 入らない（6人目は いらない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { partyOf, afterRosterChange, PARTY_MAX } from '../public/js/shared/world/party.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot } from './helpers.js';

async function battleWith(seed, supports) {
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  const c = world.data.characters[ken.char.id];
  c.flags.monster_bond = true;
  c.guests = ['luca'];
  Object.assign(ken.s, { map: 'overworld', x: PLACES.village.x + 40, y: PLACES.village.y + 12 });
  afterRosterChange(world, ken.s);
  const p = partyOf(world, ken.s);
  assert.equal(p.guests.length, 1, 'ゲストが いる');
  // 仲間を 入れる（5人目まで。家族の 5人の かわり）
  const base = p.supports[0] || null;
  p.supports = Array.from({ length: supports }, (_, i) => ({ key: `t${i}`, owner: c.id, kind: 'support', char: { ...(base?.char || c), id: `sup${i}`, name: `なかま${i}` } }));
  startFixedBattle(world, ken.s, [ken.s], 'goldoon');
  const ctx = [...world.battles.values()].pop();
  return ctx.battle.allies;
}

test('第54回: 味方が 5人の ときは ゲストは 入らない・4人までなら 入る', async () => {
  const five = await battleWith(54, PARTY_MAX - 1);
  assert.equal(five.length, PARTY_MAX);
  assert.ok(!five.some((a) => a.kind === 'guest'), '5人そろったら ゲストなし');
  const four = await battleWith(55, PARTY_MAX - 2);
  assert.equal(four.length, PARTY_MAX);
  assert.ok(four.some((a) => a.kind === 'guest'), '4人なら ゲストが 5人目');
});
