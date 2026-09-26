// パーティーでは、さそった 人（リーダー）の ストーリーを いっしょに すすめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { runScript, ScriptRun, setStoryFlag, storyIndex } from '../public/js/shared/world/scripts.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { Bot } from './helpers.js';
import { MAPS } from '../public/js/shared/maps/index.js';

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

test('パーティー: さそわれた 人の ストーリーは かわらない（リーダーだけ すすむ）', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  setStoryFlag(P.char, 'c1_town');
  P.char.objective = '町長に会おう';
  await team(world, papa, yui);
  const Y = sess(world, yui);
  const before = JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective, keyItems: Y.char.keyItems, guests: Y.char.guests, spawn: Y.char.spawn });
  assert.equal(Y.map, P.map);
  runScript(world, P, 'mayor');
  await papa.settle();
  await yui.settle();
  assert.ok(P.char.flags.c1_mayor, 'リーダーの ストーリーは すすむ');
  assert.equal(P.char.objective, '大工のガンテツ（町の南東の家）に会おう');
  assert.equal(JSON.stringify({ flags: Y.char.flags, objective: Y.char.objective, keyItems: Y.char.keyItems, guests: Y.char.guests, spawn: Y.char.spawn }), before, 'ユイの ストーリーは そのまま');
  // 画面には リーダーの 目標が とどく
  assert.equal(yui.party.objective, P.char.objective);
});

test('パーティー: 手伝った 人も ごほうび（ゴールド・ふつうの 道具）は もらえる。大事な物・目標・ゲスト・いのりの場所は リーダーだけ', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  await team(world, papa, yui);
  const Y = sess(world, yui);
  setStoryFlag(Y.char, 'c1_clear');
  Y.char.objective = 'ホシミばあちゃんに話しかけると、第2章が始まるよ';
  Y.char.guests = [];
  Y.char.spawn = { map: 'overworld', x: 10.5, y: 10.5 };
  Y.char.keyItems = [...Y.char.keyItems, 'guardian_stone'];
  const flags = JSON.stringify(Y.char.flags);
  const gold = Y.char.gold;
  const run = new ScriptRun(world, P, [P, Y], [
    ['objective', '町長に会おう'],
    ['guest', 'luca'],
    ['spawn', 'overworld', 50, 50],
    ['takeItem', 'guardian_stone', 1],
    ['item', 'herb', 2],
    ['item', 'spirit_wood', 1],
    ['gold', 30],
    ['flag', 'c1_town'],
    ['questBase', 'wolfBase', 'wolf'],
  ]);
  run.start();
  await papa.settle();
  await yui.settle();
  assert.equal(P.char.objective, '町長に会おう');
  assert.ok(P.char.guests.includes('luca'));
  assert.ok(P.char.flags.c1_town);
  assert.ok(P.char.keyItems.includes('spirit_wood'), 'リーダーは 大事な物を もらう');
  assert.equal(Y.char.objective, 'ホシミばあちゃんに話しかけると、第2章が始まるよ', '手伝った 人の もくひょう');
  assert.deepEqual(Y.char.guests, [], 'ゲストも そのまま');
  assert.deepEqual(Y.char.spawn, { map: 'overworld', x: 10.5, y: 10.5 });
  assert.ok(Y.char.keyItems.includes('guardian_stone'), 'だいじな ものも とられない');
  assert.ok(!Y.char.keyItems.includes('spirit_wood'), 'リーダーの 大事な物は もらわない');
  assert.equal(JSON.stringify(Y.char.flags), flags, 'フラグも そのまま');
  assert.ok(!Y.char.quests?.wolfBase && Y.char.quests?.wolfBase !== 0, 'たのまれごとも そのまま');
  assert.ok(Y.char.items.some((e) => e.id === 'herb'), 'ごほうびの 道具は もらえる');
  assert.equal(Y.char.gold, gold + 30, 'ゴールドも もらえる');
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
  assert.ok(!Y.char.flags.c1_mayor, '話しかけた なかまの ストーリーは そのまま');
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

test('パーティー: ぬけたら 自分の 冒険の 場所へ もどる（ログインしなおしても）', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  const Y = sess(world, yui);
  const home = { map: Y.map, x: Y.x, y: Y.y };
  world.placeSession(P, 'cave_b1', 5.5, 5.5, 'down');
  await team(world, papa, yui);
  assert.equal(Y.map, 'cave_b1', 'リーダーの ところへ');
  assert.deepEqual({ map: Y.char.soloPos.map, x: Y.char.soloPos.x, y: Y.char.soloPos.y }, home, 'もとの 場所を おぼえている');
  // リーダーは ぬけても そのまま（自分の 冒険）
  yui.send({ t: 'party', action: 'leave' });
  await yui.settle();
  assert.equal(Y.map, home.map);
  assert.ok(Math.hypot(Y.x - home.x, Y.y - home.y) < 0.01, 'もとの 場所へ もどった');
  assert.equal(yui.map, home.map, '画面も もどる');
  assert.ok(!Y.char.soloPos);
  assert.equal(P.map, 'cave_b1', 'リーダーは そのまま');
  assert.ok(yui.msgs.some((m) => m.t === 'toast' && m.text.includes('自分の冒険にもどった')));

  // リーダーが おわった ときも もどる
  await team(world, papa, yui);
  assert.equal(Y.map, 'cave_b1');
  papa.send({ t: 'quit' });
  world.leaveWorld(P);
  await yui.settle();
  assert.equal(Y.map, home.map, 'ひとりに なったら もどる');

  // さそわれた まま アプリを おとした → つぎの ログインは 自分の 場所から
  const papa2 = new Bot(world, 'パパ');
  await papa2.login('ほし');
  papa2.send({ t: 'play', id: P.char.id });
  await papa2.settle();
  const P2 = sess(world, papa2);
  papa2.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await yui.settle();
  assert.equal(Y.map, P2.map);
  const id = Y.char.id;
  world.leaveWorld(Y);
  world.sessions.delete(Y.id);
  assert.ok(world.data.characters[id].soloPos, 'おぼえた まま セーブ');
  const yui2 = new Bot(world, 'ユイ');
  await yui2.login('ほし');
  yui2.send({ t: 'play', id });
  await yui2.settle();
  assert.equal(yui2.map, home.map);
  assert.ok(Math.hypot(yui2.x - home.x, yui2.y - home.y) < 0.01, '自分の 冒険の 場所から はじまる');
  assert.ok(!world.data.characters[id].soloPos);
});

test('パーティー: 手伝っている 人は 全滅したら リーダーと いっしょに 目を覚ます。いのりの場所・大事な物の 宝箱は 自分の 冒険で', async () => {
  const { world, papa, yui } = await family();
  const P = sess(world, papa);
  const Y = sess(world, yui);
  P.char.spawn = { map: 'overworld', x: 60.5, y: 40.5 };
  Y.char.spawn = { map: 'overworld', x: 10.5, y: 10.5 };
  await team(world, papa, yui);
  world.respawn(P);
  world.respawn(Y);
  assert.equal(Y.map, 'overworld');
  assert.equal(Y.x, 60.5, 'リーダーの いのりの場所で');
  assert.deepEqual(Y.char.spawn, { map: 'overworld', x: 10.5, y: 10.5 }, '自分の いのりの場所は そのまま');
  // 教会で 記録しても 自分の いのりの場所は かわらない
  yui.send({ t: 'svc', kind: 'church', action: 'record' });
  assert.deepEqual(Y.char.spawn, { map: 'overworld', x: 10.5, y: 10.5 });
  // 大事な物の 宝箱は あけない
  const chest = Object.values(MAPS).flatMap((m) => m.chests).find((c) => c.item === 'cave_key');
  world.openChest(Y, chest);
  await yui.settle();
  assert.ok(!Y.char.chests[chest.id] && !Y.char.keyItems.includes('cave_key'));
  // ひとりなら あけられる
  yui.send({ t: 'party', action: 'leave' });
  await yui.settle();
  world.openChest(Y, chest);
  await yui.settle();
  assert.ok(Y.char.chests[chest.id]);
});
