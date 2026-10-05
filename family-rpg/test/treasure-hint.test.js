// 宝の地図の ヒント（目じるしからの 方角と 歩数・まわりの 地形・今いる 場所から）と、手伝っている なかまの 画面の 光
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dirName, stepsText, landmarks, nearMarks, treasureHintLines, fromHereLine, terrainAround } from '../public/js/shared/data/treasure-hint.js';
import { pickDigSpot, grantTreasureMap } from '../public/js/shared/world/treasure.js';
import { partyState, partyOf } from '../public/js/shared/world/party.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

test('宝の地図の ヒント: 8つの 方角と 歩数', () => {
  assert.equal(dirName(1, 0), '東');
  assert.equal(dirName(0, 1), '南');
  assert.equal(dirName(-1, 0), '西');
  assert.equal(dirName(0, -1), '北');
  assert.equal(dirName(1, -1), '北東');
  assert.equal(dirName(-1, 1), '南西');
  assert.equal(stepsText(3.2), 'およそ3歩');
  assert.equal(stepsText(43), 'およそ45歩');
});

test('宝の地図の ヒント: 目じるし（村・町・洞窟・湖・島）から 方角と 歩数で 場所が わかる', () => {
  const ow = landmarks('overworld').map((o) => o.name);
  for (const n of ['ホシフル村', 'ルミナの町', 'なげきの洞窟の入り口', '鏡の湖']) assert.ok(ow.includes(n), n);
  assert.ok(!ow.includes('ミドリナ平原'), '地方の ほとんどを しめる 場所は 目じるしに しない');
  const sea = landmarks('sea').map((o) => o.name);
  for (const n of ['カモメ港', '灯台島', '風の島']) assert.ok(sea.includes(n), n);
  assert.ok(!sea.includes('嵐の海') && !sea.includes('風の海'), '海は 目じるしに しない');
  for (let seed = 1; seed < 60; seed++) {
    for (const map of ['overworld', 'sea']) {
      const spot = pickDigSpot(seed * 7919, map, []);
      const lines = treasureHintLines({ ...spot });
      assert.ok(lines.length >= 2, `${map} ${spot.x},${spot.y}`);
      const marks = nearMarks(map, spot.x, spot.y, 2);
      assert.ok(lines[0].includes(marks[0].name), lines[0]);
      assert.match(lines.join(''), /(北|南|東|西)へおよそ\d+歩|まん中あたり|すぐそば/);
      assert.match(lines[lines.length - 1], /宝がねむっているようだ/);
      for (const l of lines) assert.deepEqual(checkText(l), [], l);
      // 目じるしは 遠すぎない（いちばん 近い ものは 70歩より 近い）
      assert.ok(marks[0].d < 70, `${map} ${spot.x},${spot.y}: ${marks[0].name} ${marks[0].d.toFixed(0)}`);
    }
  }
  // ルミナの町の 西の 場所 → 「ルミナの町から西へ」
  const lines = treasureHintLines({ map: 'overworld', x: 24, y: 40 });
  assert.match(lines[0], /ルミナの町から西へおよそ30歩/);
  // 森の 中は「ささやきの森の中」
  assert.match(treasureHintLines({ map: 'overworld', x: 92, y: 40 })[0], /ささやきの森の中。まん中から(北|南|東|西)+へ/);
  const tr = terrainAround('overworld', 24, 40);
  assert.ok(typeof tr.ground === 'string');
});

test('宝の地図の ヒント: 今いる 場所からの 方角と 歩数・近くでは「足もと」', () => {
  const tm = { map: 'overworld', x: 50, y: 50, found: false };
  assert.match(fromHereLine(tm, 'overworld', 50.5, 80.5), /今いる場所から北へおよそ30歩/);
  assert.match(fromHereLine(tm, 'overworld', 45.5, 50.5), /この近くのようだ…！（東へおよそ5歩）/);
  assert.match(fromHereLine(tm, 'overworld', 50.6, 50.9), /足もとがあやしい/);
  assert.equal(fromHereLine(tm, 'sea', 50, 50), '', 'ちがう マップでは 出さない');
  assert.equal(fromHereLine({ ...tm, found: true }, 'overworld', 50, 80), '', '見つけた 地図は 出さない');
  for (const s of [fromHereLine(tm, 'overworld', 50.5, 80.5), fromHereLine(tm, 'overworld', 45.5, 50.5)]) assert.deepEqual(checkText(s), [], s);
});

test('宝の地図: 手伝っている なかまの 画面にも リーダーの 地図の 場所（まだ ほっていない ものだけ）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(7), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  const a = grantTreasureMap(world, papa.s.char, { lv: 2, map: 'overworld' });
  const b = grantTreasureMap(world, papa.s.char, { lv: 3, map: 'overworld' });
  b.found = true;
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const st = partyState(world, partyOf(world, kid.s));
  assert.deepEqual(st.worldTreasure, [{ map: a.map, x: a.x, y: a.y }]);
});
