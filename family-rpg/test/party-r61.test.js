// 第61回: マルチプレイ（パーティー）の なおし
//  ・たたかいの けっかの まどは、リーダーが とじた 時に 仲間の まども とじる
//  ・さそわれた 人は 1人だけで 入る（ゲストは 自分の パーティーの 時だけ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { partyOf } from '../public/js/shared/world/party.js';
import { Bot } from './helpers.js';

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

function fightAt(world, bot, x, y) {
  const ms = world.mapStates.get('overworld') || (world.tick(1), world.mapStates.get('overworld'));
  const sym = { id: 'sym' + Math.random(), sp: 'pururin', group: ['pururin'], table: 'outskirts', zone: 'outskirts', x, y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.s.x = x;
  bot.s.y = y;
  bot.send({ t: 'touch', id: sym.id });
}

async function family() {
  const world = new GameWorld({ offline: false, rng: makeRng(61), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await kid.login('ほし');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  for (const b of [papa, kid]) world.sessions.get(b.s.id).char.level = 30;
  return { world, papa, kid };
}

test('第61回: けっかの まどは リーダーが とじると 仲間も いっしょに とじる', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(partyOf(world, kid.s)?.leader, papa.s.id);
  papa.keepResult = true;
  kid.keepResult = true;
  kid.s.x = FIELD.x + 1;
  kid.s.y = FIELD.y;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle && kid.inBattle, 'いっしょに たたかう');
  for (let i = 0; i < 400 && (papa.inBattle || kid.inBattle); i++) { world.tick(50); papa.flushQueue?.(); kid.flushQueue?.(); await new Promise((r) => setImmediate(r)); }
  const pe = papa.battles.at(-1), ke = kid.battles.at(-1);
  assert.ok(pe?.lines.length && ke?.lines.length, 'どちらも けっかの 行が ある');
  assert.equal(pe.followLeader, undefined, 'リーダーは 自分で とじる');
  assert.equal(ke.followLeader, 'パパ', '仲間は リーダーを まつ');
  assert.ok(kid.s.reading);
  const closes = () => kid.msgs.filter((m) => m.t === 'resultClose');
  assert.equal(closes().length, 0);
  // 仲間が 先に とじても リーダーには 何も 送らない
  papa.send({ t: 'resultDone' });
  assert.equal(closes().length, 1, 'リーダーが とじた → 仲間へ 知らせ');
  assert.equal(closes()[0].id, ke.id, 'その たたかいの けっか');
  assert.ok(!papa.msgs.some((m) => m.t === 'resultClose'));
  kid.send({ t: 'resultDone' });
  assert.ok(!kid.s.reading);
  papa.send({ t: 'resultDone' });
  assert.equal(closes().length, 1, '2回 とじても 1回だけ');
});

test('第61回: ひとりで たたかった 時は リーダーを またない', { timeout: 60000 }, async () => {
  const { world, papa } = await family();
  papa.keepResult = true;
  fightAt(world, papa, FIELD.x, FIELD.y);
  for (let i = 0; i < 400 && papa.inBattle; i++) { world.tick(50); papa.flushQueue?.(); await new Promise((r) => setImmediate(r)); }
  assert.equal(papa.battles.at(-1)?.followLeader, undefined);
});

test('第61回: さそわれた 人の ゲストは パーティーに 入らない（リーダーの ゲストだけ）', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  const kc = world.sessions.get(kid.s.id).char;
  kc.guests = ['luca'];
  world.sessions.get(papa.s.id).char.guests = [];
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const p = partyOf(world, kid.s);
  assert.equal(p.leader, papa.s.id);
  assert.deepEqual(p.guests.map((g) => g.id), [], 'ユイの ゲストは 入らない');
  assert.deepEqual(kc.guests, ['luca'], 'ユイの ゲストは 消えない（自分の パーティーに もどると いる）');
  // リーダーの ゲストは 入る
  world.sessions.get(papa.s.id).char.guests = ['luca'];
  kid.send({ t: 'party', action: 'leave' });
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.deepEqual(partyOf(world, kid.s).guests.map((g) => g.id), ['luca']);
});

test('第61回: クライアント: 仲間の けっかの まどは「〜が閉じると、いっしょに閉じます」', () => {
  const src = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(src, /が閉じると、いっしょに閉じます/);
  assert.match(src, /leaderClose\(\) \{/);
  const game = readFileSync(new URL('../public/js/client/game.js', import.meta.url), 'utf8');
  assert.match(game, /case 'resultClose':/);
});
