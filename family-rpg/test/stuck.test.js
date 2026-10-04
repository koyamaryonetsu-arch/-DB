// 動けなく ならない ための しくみ（サーバーがわ）: 立てなおし（resync）と 不具合の 記録（clientError）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { MAPS, POS, canStand, standSpot, bodyPoints, npcCovers } from '../public/js/shared/maps/index.js';
import { SCRIPTS, STORY_STEPS } from '../public/js/shared/data/story.js';
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

// ───────────── 全滅して 教会で 目を覚ます とき、教会の 人と 重ならない ─────────────
const PRIESTS = [['overworld', 'v_priest'], ['overworld', 't_priest'], ['sea', 'port_priest'], ['north', 'c3_priest'], ['north', 'c3_k_priest'], ['south', 'c4_h_priest']];
const overlapsNpc = (map, x, y, n) => bodyPoints(x, y).some(([px, py]) => npcCovers(n, n.x + 0.5, n.y + 0.5, Math.floor(px), Math.floor(py)));

test('全滅: いのりの場所が 教会の 人に かかって いても、重ならない ところで 目を覚ます', async () => {
  const { world, bot } = await solo(7);
  const s = bot.s;
  const has = world.hasFlagFn(s);
  const map = MAPS.overworld;
  const pri = map.npcById.v_priest;
  // 序章の おわりの 記録（マスの かど）: 体の 上が 村の 教会の 人に かかって 動けなかった
  s.char.spawn = { map: 'overworld', x: POS.villageChurch[0], y: POS.villageChurch[1] };
  assert.ok(overlapsNpc(map, s.char.spawn.x, s.char.spawn.y, pri), '（さいげん）そのままでは 教会の 人に 重なる');
  world.respawn(s);
  assert.equal(s.map, 'overworld');
  assert.ok(canStand(map, s.x, s.y, has), `立てる ところ（${s.x}, ${s.y}）`);
  assert.ok(!overlapsNpc(map, s.x, s.y, pri), '教会の 人と 重ならない');
  assert.deepEqual([s.x, s.y], [pri.x + 0.5, pri.y + 1.5], '教会の 人の 前で');
  const pos = bot.msgs.filter((m) => m.t === 'setPos').pop();
  assert.deepEqual([pos.x, pos.y], [s.x, s.y], 'がめんにも おなじ いちが とどく');
  // 記録の ばしょ（自分の いのりの場所）は そのまま
  assert.deepEqual(s.char.spawn, { map: 'overworld', x: POS.villageChurch[0], y: POS.villageChurch[1] });
});

test('全滅: どの 教会でも、教会の 人の マスに 記録が あっても となりの 空いた マスで 目を覚ます', async () => {
  const { world, bot } = await solo(8);
  const s = bot.s;
  // 物語を さいごまで すすめた ことに する（どの 地方にも 人が いる）
  for (const f of STORY_STEPS) s.char.flags[f] = true;
  const has = world.hasFlagFn(s);
  for (const [mapId, id] of PRIESTS) {
    const map = MAPS[mapId];
    const pri = map.npcById[id];
    assert.ok(pri && pri.solid, `${mapId}/${id}`);
    // 教会の 人の 前で 記録した ときは、その ままの ばしょで 目を覚ます
    s.char.spawn = { map: mapId, x: pri.x + 0.5, y: pri.y + 1.6 };
    world.respawn(s);
    assert.deepEqual([s.map, s.x, s.y], [mapId, pri.x + 0.5, pri.y + 1.6], `${id}: 記録した ばしょ`);
    // 教会の 人の 真上に 記録が ある（こわれた 記録）
    s.char.spawn = { map: mapId, x: pri.x + 0.5, y: pri.y + 0.5 };
    world.respawn(s);
    assert.equal(s.map, mapId);
    assert.ok(canStand(map, s.x, s.y, has), `${id}: 立てる ところ（${s.x}, ${s.y}）`);
    assert.ok(!overlapsNpc(map, s.x, s.y, pri), `${id}: 重ならない`);
    assert.ok(Math.hypot(s.x - (pri.x + 0.5), s.y - (pri.y + 0.5)) <= 1.01, `${id}: となりの マス（${s.x}, ${s.y}）`);
  }
});

test('立てる ところ: かべの 中なら いちばん ちかい 空いた マス、空いて いれば そのまま', () => {
  const map = MAPS.south;
  const no = () => false;
  const pri = map.npcById.c4_h_priest;
  assert.deepEqual(standSpot(map, pri.x + 0.5, pri.y + 1.5, no), { x: pri.x + 0.5, y: pri.y + 1.5 });
  const at = standSpot(map, pri.x + 0.5, pri.y + 0.5, no);
  assert.deepEqual(at, { x: pri.x + 0.5, y: pri.y + 1.5 }, '下が 空いて いれば 下へ');
  // かべの 中（教会の 人の 上の かべ）
  const wall = standSpot(map, pri.x + 0.5, pri.y - 0.5, no);
  assert.ok(canStand(map, wall.x, wall.y, no), `${wall.x}, ${wall.y}`);
});

test('物語の 場面移動・いのりの場所の 記録は、かべ・人・宝箱に 体が かからない ところ', () => {
  // いろいろな すすみぐあいで 台本を つくって、teleport と spawn の ばしょを あつめる
  const spots = new Map();
  const walk = (v, name, depth = 0) => {
    if (depth > 12 || !v || typeof v !== 'object') return;
    if (Array.isArray(v) && (v[0] === 'teleport' || v[0] === 'spawn') && typeof v[1] === 'string') spots.set(`${v[1]}:${v[2]}:${v[3]}`, [name, ...v.slice(0, 4)]);
    for (const x of Array.isArray(v) ? v : Object.values(v)) walk(x, name, depth + 1);
  };
  for (let upto = 0; upto <= STORY_STEPS.length; upto++) {
    const flags = Object.fromEntries(STORY_STEPS.slice(0, upto).map((f) => [f, true]));
    for (const night of [false, true]) {
      const c = { name: 'X', flags, items: [], keyItems: [], quests: {}, kills: {}, level: 30, job: 'warrior' };
      const ctx = { c, name: 'X', night, helper: false, flag: (f) => !!flags[f], has: () => true, count: () => 1, kills: () => 0, quest: () => undefined };
      for (const [k, fn] of Object.entries(SCRIPTS)) {
        try { walk(fn(ctx), k); } catch { /* この すすみぐあいでは つくれない 台本 */ }
      }
    }
  }
  assert.ok(spots.size >= 10, `あつまった ばしょ ${spots.size}`);
  for (const [name, op, mapId, x, y] of spots.values()) {
    const map = MAPS[mapId];
    assert.ok(map, `${name}: ${mapId}`);
    for (const has of [() => false, () => true]) {
      assert.ok(canStand(map, x, y, has), `${name} ${op} ${mapId} (${x}, ${y})`);
    }
  }
});
