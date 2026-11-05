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

// ───── 第66回: 主人公 いがいの やりこみの 記録・合体技 ─────
import { Battle } from '../public/js/shared/battle.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { supportInfo } from '../public/js/shared/world/party.js';

test('第66回 幻の書: 合体技も 技の 条件に 数える（参加した みんな。中みで タグ）', () => {
  const b = Object.create(Battle.prototype);
  const a = { side: 'ally', kind: 'player' }, s = { side: 'ally', kind: 'support' }, m = { side: 'ally', kind: 'monster', mon: true };
  b.featDual([a, s, m], DUAL_TECHS.dt_taishoumetsu);
  assert.equal(a.feat.use.attackSpell, 1);
  assert.equal(s.feat.use.attackSpell, 1, '人の 仲間も');
  assert.equal(m.feat, undefined, '魔物は 数えない');
  const heal = Object.entries(DUAL_TECHS).find(([, t]) => t.parts.some((p) => p.type === 'heal'));
  if (heal) {
    const x = { side: 'ally', kind: 'player' };
    b.featDual([x], heal[1]);
    assert.ok(x.feat.use.healSpell || x.feat.use.support, heal[0]);
  }
});

test('第66回 幻の書: 人の 仲間の 記録は 画面にも おくる（神殿・幻の書）。家族の うつしは おくらない', () => {
  const npc = supportInfo({ key: 'npc_gard', kind: 'npc', owner: 'x', char: { name: 'ガルド', job: 'warrior', level: 30, jobs: {}, equip: {}, feats: { use: { gomu: 3 } } } });
  assert.deepEqual(npc.feats, { use: { gomu: 3 } });
  const fam = supportInfo({ key: 'fam:y', kind: 'family', owner: 'x', char: { name: 'ユイ', job: 'mage', level: 30, jobs: {}, equip: {}, feats: { use: { gomu: 3 } } } });
  assert.equal(fam.feats, undefined);
});
