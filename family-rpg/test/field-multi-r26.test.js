// 第26回: 回復と 治すが いっしょの 技（ごはんおかわり など）が フィールドでも 使える
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { computeStats } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

test('ごはんおかわり（回復＋治す）を フィールドで 使える', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ミナ');
  await bot.login();
  await bot.createAndPlay('okan');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.job = 'saikyo_okan';
  c.jobs.saikyo_okan = { lv: 10, b: 999 };
  const st = computeStats(c);
  c.mp = st.maxMp + 50;
  c.hp = 1;
  bot.send({ t: 'menu', action: 'cast', id: 'so_okawari', who: 'self' });
  await bot.settle();
  const res = bot.msgs.filter((m) => m.t === 'menuRes').pop();
  assert.ok(res?.ok, res?.text);
  assert.ok(c.hp > 1, 'HPが 回復した');
  // 元気な 時は 使えない（MPは へらない）
  c.hp = computeStats(c).maxHp; c.status = {};
  const mp = c.mp;
  bot.send({ t: 'menu', action: 'cast', id: 'so_okawari', who: 'self' });
  await bot.settle();
  assert.equal(bot.msgs.filter((m) => m.t === 'menuRes').pop().ok, false);
  assert.equal(c.mp, mp);
});
