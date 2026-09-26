// パーティーでは、さそった 人（リーダー）の ストーリーを いっしょに すすめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { runScript, ScriptRun, setStoryFlag, storyIndex } from '../public/js/shared/world/scripts.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { Bot } from './helpers.js';

async function family() {
  const world = new GameWorld({ offline: false, rng: makeRng(21), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  return { world, papa, yui };
}

const sess = (world, bot) => world.sessions.get(bot.sid);

async function team(world, papa, yui) {
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  assert.equal(papa.party.members.length, 2);
}

test('パーティー: おくれている 人も、リーダーの ストーリーを いっしょに クリアして 追いつく', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  setStoryFlag(P.char, 'c1_town');
  P.char.objective = '町長に会おう';
  await team(world, papa, yui);
  const Y = sess(world, yui);
  assert.equal(Y.map, P.map);
  assert.ok(!Y.char.flags.c1_mayor);
  runScript(world, P, 'mayor');
  await papa.settle();
  await yui.settle();
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_mayor') + 1)) assert.ok(Y.char.flags[f], `ユイも ${f}`);
  assert.equal(Y.char.objective, P.char.objective, 'もくひょうも リーダーと おなじ');
  assert.equal(P.char.objective, '大工のガンテツ（町の南東の家）に会おう');
});

test('パーティー: 先に すすんでいる 人の もくひょう・ゲスト・いのりの場所は かわらない', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  await team(world, papa, yui);
  const Y = sess(world, yui);
  setStoryFlag(Y.char, 'c1_clear');
  Y.char.objective = 'ホシミばあちゃんに話しかけると、第2章が始まるよ';
  Y.char.guests = [];
  Y.char.spawn = { map: 'overworld', x: 10.5, y: 10.5 };
  Y.char.keyItems = [...Y.char.keyItems, 'guardian_stone'];
  const run = new ScriptRun(world, P, [P, Y], [
    ['objective', '町長に会おう'],
    ['guest', 'luca'],
    ['spawn', 'overworld', 50, 50],
    ['takeItem', 'guardian_stone', 1],
    ['item', 'herb', 2],
    ['flag', 'c1_town'],
  ]);
  run.start();
  await papa.settle();
  await yui.settle();
  assert.equal(P.char.objective, '町長に会おう');
  assert.ok(P.char.guests.includes('luca'));
  assert.equal(Y.char.objective, 'ホシミばあちゃんに話しかけると、第2章が始まるよ', '先に すすんだ 人の もくひょう');
  assert.deepEqual(Y.char.guests, [], 'ゲストも そのまま');
  assert.deepEqual(Y.char.spawn, { map: 'overworld', x: 10.5, y: 10.5 });
  assert.ok(Y.char.keyItems.includes('guardian_stone'), 'だいじな ものも とられない');
  assert.ok(Y.char.items.some((e) => e.id === 'herb'), 'ごほうびは もらえる');
  assert.ok(storyIndex(Y.char) >= STORY_STEPS.indexOf('c1_clear'), 'すすみぐあいは もどらない');
  // 画面の もくひょうも 自分の もの（イベントの あとの self）
  const self = yui.msgs.filter((m) => m.t === 'self').pop();
  assert.equal(self.char.objective, 'ホシミばあちゃんに話しかけると、第2章が始まるよ');
});

test('パーティー: なかまが 話しかけても、リーダーの ストーリーで すすむ（リーダーが いない ときは まつ）', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  setStoryFlag(P.char, 'c1_town');
  await team(world, papa, yui);
  const Y = sess(world, yui);
  // リーダーが はなれた 場所に いる → すすめない
  world.placeSession(P, 'cave_b1', 5.5, 5.5, 'down');
  assert.equal(runScript(world, Y, 'mayor'), false);
  assert.ok(!Y.char.flags.c1_mayor && !P.char.flags.c1_mayor);
  assert.ok(yui.msgs.some((m) => m.t === 'toast' && m.text.includes('リーダーのパパといっしょに')));
  // リーダーが 近くに いる → リーダーの ストーリー（町長の イベント）を みんなで
  world.placeSession(P, Y.map, Y.x + 1, Y.y, 'down');
  assert.equal(runScript(world, Y, 'mayor'), true);
  await papa.settle();
  await yui.settle();
  assert.ok(P.char.flags.c1_mayor, 'リーダーの ストーリーが すすむ');
  assert.ok(Y.char.flags.c1_mayor, 'なかまも いっしょに');
});

test('パーティー: さそいを うけると リーダーの ところへ 行く', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  const Y = sess(world, yui);
  world.placeSession(P, 'cave_b1', 5.5, 5.5, 'down');
  await papa.settle();
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await yui.settle();
  assert.equal(Y.map, 'cave_b1');
  assert.ok(Math.hypot(Y.x - P.x, Y.y - P.y) < 1);
  assert.equal(yui.map, 'cave_b1', '画面も うつる');
});
