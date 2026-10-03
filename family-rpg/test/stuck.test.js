// 動けなく ならない ための しくみ（サーバーがわ）: 立てなおし（resync）と 不具合の 記録（clientError）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { Bot } from './helpers.js';

async function solo(seed = 5) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'コウ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  return { world, bot };
}
const last = (bot, t) => bot.msgs.filter((m) => m.t === t).pop();

test('立てなおし: もう ない だいほん・たたかいの「とちゅう」の しるしを かたづけて、いまの ようすを おくりなおす', async () => {
  const { world, bot } = await solo();
  const s = bot.s;
  // だいほんが おわって いるのに「だいほん中」の まま（うごけない）
  s.busy = 'script';
  s.runId = 'r-gone';
  const x0 = s.x;
  bot.send({ t: 'move', x: s.x + 0.5, y: s.y, dir: 'right', moving: true, seq: s.posSeq });
  assert.equal(s.x, x0, '「だいほん中」は うごきを うけつけない（さいげん）');
  const n = bot.msgs.length;
  bot.send({ t: 'resync' });
  assert.equal(s.busy, null);
  assert.equal(s.runId, null);
  const enter = bot.msgs.slice(n).find((m) => m.t === 'enter');
  assert.ok(enter && enter.rescued && enter.resumed, 'いまの ようすが とどく');
  bot.send({ t: 'move', x: s.x + 0.5, y: s.y, dir: 'right', moving: true, seq: enter.posSeq });
  assert.ok(s.x > x0, '立てなおしの あとは うごける');
  // たたかいが ないのに「たたかい中」
  s.busy = 'battle';
  s.battleId = 'b-gone';
  s.lastResync = 0;
  bot.send({ t: 'resync' });
  assert.equal(s.busy, null);
});

test('立てなおし: まっている だいほんは そこから もう一度 とどく（すすめると さいごまで いく）', async () => {
  const { world, bot } = await solo(6);
  const s = bot.s;
  // へんじを かえさない（クライアントが とちゅうで とまった）
  bot.queue = [];
  runSteps(world, s, [['say', null, 'まっている 会話'], ['flag', 'stuck_test_done']]);
  await new Promise((r) => setImmediate(r));
  bot.queue = [];
  assert.equal(s.busy, 'script');
  const n = bot.msgs.length;
  bot.send({ t: 'resync' });
  const again = bot.msgs.slice(n).find((m) => m.t === 'script');
  assert.ok(again && again.steps.some((st) => st[0] === 'say' && st[2] === 'まっている 会話'), 'まっている ところを もう一度 おくる');
  await bot.settle();
  assert.equal(s.busy, null, 'へんじを すれば さいごまで すすむ');
  assert.equal(s.char.flags.stuck_test_done, true);
});

test('不具合の 記録: さいきんの 30こ・長い 文は きる', async () => {
  const { world, bot } = await solo(7);
  for (let i = 0; i < 35; i++) bot.send({ t: 'clientError', where: `w${i}`, msg: 'x'.repeat(500), stack: 'y'.repeat(2000), state: 'field' });
  const log = world.data.errorLog;
  assert.equal(log.length, 30);
  assert.equal(log[0].where, 'w5');
  assert.equal(log[29].who, 'コウ');
  assert.equal(log[29].msg.length, 300);
  assert.equal(log[29].stack.length, 900);
  assert.equal(last(bot, 'clientError'), undefined);
});

test('こわれた たたかい: まいフレーム エラーでも 世界は とまらず、しばらく すると にげた ことに して フィールドへ もどる', async () => {
  const { world, bot } = await solo(8);
  const s = bot.s;
  bot.keepResult = true;
  const ctx = startFieldBattle(world, s, { id: 'brk', sp: 'pururin', group: ['pururin'], zone: 'outskirts', table: 'outskirts', busy: false });
  assert.equal(s.busy, 'battle');
  ctx.battle.tick = () => { throw new Error('こわれた'); };
  const err = console.error;
  const logged = [];
  console.error = (...a) => logged.push(a);
  try {
    for (let i = 0; i < 25; i++) world.tick(50);
  } finally {
    console.error = err;
  }
  assert.equal(logged.length, 1, 'おなじ エラーで ログを うめない');
  assert.equal(world.battles.has(ctx.id), false, 'たたかいは おわる');
  assert.equal(s.busy, null);
  assert.equal(s.battleId, null);
  const end = last(bot, 'battleEnd');
  assert.ok(end && end.outcome === 'flee' && end.id === ctx.id);
});

test('こわれた 物語の たたかい: だいほんは そこで おわり、うごける（もう一度 やりなおせる）', async () => {
  const { world, bot } = await solo(9);
  const s = bot.s;
  runSteps(world, s, [['battle', 'shadow_attack'], ['flag', 'stuck_battle_after']]);
  for (let i = 0; i < 10 && !world.battles.size; i++) {
    bot.flushQueue();
    await new Promise((r) => setImmediate(r));
  }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '物語の たたかいが はじまる');
  ctx.battle.tick = () => { throw new Error('こわれた'); };
  const err = console.error;
  console.error = () => {};
  try {
    for (let i = 0; i < 25; i++) world.tick(50);
  } finally {
    console.error = err;
  }
  await bot.settle();
  assert.equal(s.busy, null);
  assert.equal(s.runId, null);
  assert.equal(s.char.flags.stuck_battle_after, undefined, 'たたかいの あとの 物語には すすまない');
});
