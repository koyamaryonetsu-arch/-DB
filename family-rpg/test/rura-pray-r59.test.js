// 第59回: ルーラ・帰り道の羽の 行き先に「最後にいのった場所」（ダンジョンの 泉から 続きが できる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot, tickN } from './helpers.js';
import { castRura, warpPlaces, placeName, PRAY_PLACE } from '../public/js/shared/world/travel.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { addItem } from '../public/js/shared/stats.js';

async function one(seed) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: () => true, rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const s = world.sessions.get(bot.sid);
  return { world, bot, s, c: s.char };
}

// いのりの場所に できる ダンジョン（泉の ある 階）を 1つ さがす
const DUNGEON = Object.values(MAPS).find((m) => m.kind === 'dungeon' && !m.past && m.id === 'tokei_3f') || Object.values(MAPS).find((m) => m.kind === 'dungeon' && !m.past && !/^(tm_|sd_)/.test(m.id));

test('第59回: いのった ことが あれば 行き先の いちばん 上に「最後にいのった場所」', async () => {
  const { c } = await one(59);
  c.visited = { village: true };
  delete c.spawn;
  assert.ok(!warpPlaces(c).includes(PRAY_PLACE), 'いのって いない ときは 出ない');
  c.spawn = { map: DUNGEON.id, x: 5.5, y: 5.5 };
  assert.equal(warpPlaces(c)[0], PRAY_PLACE);
  assert.equal(placeName(PRAY_PLACE), '最後にいのった場所');
  c.spawn = { map: 'tm_1_2', x: 1, y: 1 };
  assert.ok(!warpPlaces(c).includes(PRAY_PLACE), '宝の洞窟は のぞく');
});

test('第59回: ルーラで フィールドから ダンジョンの いのりの場所へ（MPを 使う）', async () => {
  const { world, s, c } = await one(60);
  c.visited = { village: true };
  c.spawn = { map: DUNGEON.id, x: Math.floor(DUNGEON.w / 2) + 0.5, y: Math.floor(DUNGEON.h / 2) + 0.5 };
  world.placeSession(s, 'overworld', PLACES.village.x + 16.5, PLACES.village.y - 1.5, 'down');
  c.mp = 50;
  let res = null;
  castRura(world, s, c, 'rura', { place: PRAY_PLACE }, (ok, text) => { res = { ok, text }; });
  assert.ok(res.ok, res.text);
  assert.equal(s.map, DUNGEON.id);
  assert.ok(c.mp < 50, 'MPを 使った');
});

test('第59回: 帰り道の羽は ダンジョンの 中からも いのりの場所へ', async () => {
  const { world, bot, s, c } = await one(61);
  c.visited = { village: true };
  c.spawn = { map: 'overworld', x: PLACES.village.x + 16.5, y: PLACES.village.y - 1.5 };
  world.placeSession(s, DUNGEON.id, Math.floor(DUNGEON.w / 2) + 0.5, Math.floor(DUNGEON.h / 2) + 0.5, 'down');
  addItem(c, 'return_wing', 1);
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: PRAY_PLACE });
  await tickN(world, 3);
  assert.equal(s.map, 'overworld');
  assert.ok(Math.hypot(s.x - c.spawn.x, s.y - c.spawn.y) < 3, 'いのりの場所の そば');
});
