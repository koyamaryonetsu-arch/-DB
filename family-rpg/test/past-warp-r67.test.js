// 第67回: 千年前に いる 時は、ルーラ・帰り道の羽の 行き先が 千年前の 町だけ（data/past-places.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { PAST_PLACES, pastVisited, pastWarpTowns, pastPlaceAt } from '../public/js/shared/data/past-places.js';
import { warpPlaces, pastLanding, placeName } from '../public/js/shared/world/travel.js';
import { PAST_ID } from '../public/js/shared/maps/past.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

test('第67回 千年前の 町: 4つ・おりる 所は 町の 中の 歩ける マス・名前', () => {
  assert.deepEqual(Object.keys(PAST_PLACES), ['p_hamlet', 'p_spring', 'p_kingdom', 'p_nagi']);
  for (const id of Object.keys(PAST_PLACES)) {
    const p = PAST_PLACES[id];
    assert.ok(MAPS[p.map]?.past, `${id}: 千年前の マップ`);
    const to = pastLanding(id);
    assert.ok(to, id);
    assert.equal(to.map, p.map);
    assert.equal(isBlocked(MAPS[p.map], Math.floor(to.x), Math.floor(to.y), () => true), false, `${id}: 歩ける`);
    assert.equal(pastPlaceAt(p.map, Math.floor(to.x), Math.floor(to.y)), id, `${id}: 町の 中`);
    assert.equal(placeName(id), p.name);
  }
});

test('第67回 千年前の 町: 千年前では 千年前の 町だけ・今では 今の 町だけ。前の 版の 人は 物語の しるしで', () => {
  const c = { visited: { village: true, town: true }, flags: {} };
  assert.deepEqual(warpPlaces(c, true), []);
  assert.deepEqual(warpPlaces(c, false), ['village', 'town']);
  c.flags.c6_past = true; // もう 千年前の ホシフルの里に 行った
  assert.equal(pastVisited(c, 'p_hamlet'), true);
  c.visited.p_kingdom = true;
  assert.deepEqual(pastWarpTowns(c), ['p_hamlet', 'p_kingdom']);
  assert.deepEqual(warpPlaces(c, true), ['p_hamlet', 'p_kingdom']);
  assert.deepEqual(warpPlaces(c, false), ['village', 'town'], '今の 時代には 出さない');
});

async function solo() {
  const world = new GameWorld({ offline: true, rng: makeRng(67), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  return { world, bot, c: world.data.characters[bot.char.id] };
}

test('第67回 千年前の 町: 帰り道の羽・ルーラで 千年前の 町へ とぶ。行った ことの ない 町・今の 町へは とばない', async () => {
  const { world, bot, c } = await solo();
  c.flags.c6_past = true;
  c.visited = { village: true };
  const sp = PAST_PLACES.p_spring;
  world.placeSession(bot.s, PAST_ID, sp.rect[0] + sp.rect[2] + 6.5, sp.rect[1] + sp.rect[3] + 6.5, 'down', true);
  await bot.settle();
  c.items.push({ id: 'return_wing', n: 3 });
  // 行った ことの ない 泉の里へは とばない
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'p_spring' });
  await bot.settle();
  assert.notEqual(world.data.characters[c.id].visited.p_spring, true);
  assert.equal(c.items.find((i) => i.id === 'return_wing').n, 3);
  // 今の 町へも とばない（千年前に いる 時）
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'village' });
  await bot.settle();
  assert.equal(bot.s.map, PAST_ID);
  // ホシフルの里へ
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'p_hamlet' });
  await bot.settle();
  const to = pastLanding('p_hamlet');
  assert.equal(bot.s.map, PAST_ID);
  assert.ok(Math.abs(bot.s.x - to.x) < 1 && Math.abs(bot.s.y - to.y) < 1, `${bot.s.x},${bot.s.y}`);
  assert.equal(c.items.find((i) => i.id === 'return_wing').n, 2);
  // 歩いて 泉の里に 入ると おぼえる → ルーラで とべる
  world.placeSession(bot.s, PAST_ID, sp.rect[0] + 3.5, sp.rect[1] + sp.rect[3] - 2.5, 'down', true);
  await bot.settle();
  bot.x = sp.rect[0] + 4.5;
  bot.y = sp.rect[1] + sp.rect[3] - 2.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'right', moving: true, seq: bot.seq });
  await bot.settle();
  assert.equal(c.visited.p_spring, true, '入ると おぼえる');
  world.placeSession(bot.s, PAST_ID, to.x, to.y, 'down', true);
  await bot.settle();
  c.jobs.mage = { lv: 10, b: 999 };
  c.learned = [...(c.learned || []), 'rura'];
  c.mp = 200;
  bot.send({ t: 'menu', action: 'cast', who: 'self', id: 'rura', place: 'p_spring' });
  await bot.settle();
  const ts = pastLanding('p_spring');
  assert.ok(Math.abs(bot.s.x - ts.x) < 1 && Math.abs(bot.s.y - ts.y) < 1, `ルーラ ${bot.s.x},${bot.s.y}`);
  assert.ok(c.mp < 200, 'MP を 使う');
});
