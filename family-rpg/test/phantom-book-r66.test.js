// 第66回: 幻の書で パーティーの みんなの ぶんも 見る（家族が ねがった。world/phantom.js の phantomPeople）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { phantomPeople } from '../public/js/shared/world/phantom.js';
import { JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();

test('第66回 幻の書: 自分・いっしょの 家族の ぶんを サーバーから もらえる（家族の 記録は その 人の もの）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(66), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login('x');
  await yui.login('x');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Y = world.data.characters[yui.char.id];
  // ユイは ニカを きわめた（海賊王の 条件が 見える）
  Y.jobs.nika = { lv: JOB_MAX_LEVEL, b: 0 };
  Y.feats = { ...(Y.feats || {}) };
  // ひとりの ときは 自分だけ
  papa.send({ t: 'svc', kind: 'phantomBook' });
  let r = lastSvc(papa);
  assert.equal(r.ok, true);
  assert.deepEqual(r.people.map((p) => p.tag), ['自分']);
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  papa.send({ t: 'svc', kind: 'phantomBook' });
  r = lastSvc(papa);
  assert.deepEqual(r.people.map((p) => [p.name, p.tag]), [['パパ', '自分'], ['ユイ', '家族']]);
  const yuiRows = r.people[1].rows;
  assert.equal(yuiRows.find((x) => x.id === 'pirate_king').known, true, 'ユイの 記録で 見える');
  assert.equal(r.people[0].rows.find((x) => x.id === 'pirate_king').known, false, 'パパは まだ');
  assert.equal(r.people[1].jobs.nika.lv, JOB_MAX_LEVEL);
  // 見るだけ（記録は かわらない）
  assert.deepEqual(world.data.characters[yui.char.id].jobs.nika, { lv: JOB_MAX_LEVEL, b: 0 });
});

test('第66回 幻の書: つれている 人の 仲間も 入る・魔物は 入らない', () => {
  const me = { name: 'ソラ', jobs: {}, partyKeys: ['npc_a', 'mon_1'], companions: [
    { key: 'npc_a', kind: 'npc', char: { name: 'ガルド', jobs: { warrior: { lv: 10 } } } },
    { key: 'mon_1', kind: 'monster', char: { name: 'ぷるりん', species: 'slime', jobs: {} } },
  ] };
  const people = phantomPeople({ parties: new Map(), sessions: new Map(), data: { characters: {} } }, { char: me, partyId: null });
  assert.deepEqual(people.map((p) => [p.name, p.tag]), [['ソラ', '自分'], ['ガルド', '仲間']]);
  assert.equal(people[1].rows.length, people[0].rows.length);
});
