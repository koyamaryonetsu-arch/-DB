// フィールドの 宝箱: ランダムに 出る・開けると きえる・また 出る。地図の フィールドの 宝箱も 開けたら きえる。きらきらは ひろいやすく
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { FIELD_CHEST_COUNT, FIELD_CHEST_RESPAWN_MS, FIELD_CHEST_ZONES, fieldChestLoot, fieldChestLootTable, chestVanishes } from '../public/js/shared/data/fieldchests.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { itemCount } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

test('宝箱の 中みは ちいきごとに あって、ぜんぶ ある 品物', () => {
  const rng = makeRng(1);
  for (const z of FIELD_CHEST_ZONES) {
    for (const e of fieldChestLootTable(z)) if (e.item) assert.ok(ITEMS[e.item], `${z}: ${e.item}`);
    for (let i = 0; i < 50; i++) {
      const l = fieldChestLoot(z, rng);
      assert.ok(l.gold > 0 || (ITEMS[l.item] && l.n >= 1), JSON.stringify(l));
    }
  }
  assert.equal(chestVanishes(MAPS.overworld), true);
  assert.equal(chestVanishes(MAPS.sea), true);
  assert.equal(chestVanishes(MAPS.cave_b1), false, '洞窟の 宝箱は のこる');
});

async function hero(seed = 4) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  for (const ms of world.mapStates.values()) { ms.symbols.clear(); ms.spawnTimer = 1e12; }
  return { world, bot, c: world.data.characters[bot.char.id] };
}

test('フィールドに ランダムな 宝箱が 出る（町の そと・はなれて・歩ける 地面）', async () => {
  const { world } = await hero();
  await tickN(world, 2);
  const ms = mapState(world, 'overworld');
  const list = [...ms.fchests.values()];
  assert.equal(list.length, FIELD_CHEST_COUNT.overworld);
  const map = MAPS.overworld;
  for (const fc of list) {
    assert.ok(!map.zoneAt(fc.x, fc.y).startsWith('safe'), '町の 中では ない');
    assert.ok(!isBlocked(map, fc.x, fc.y, () => false));
    assert.ok(!map.chestAt.has(fc.y * map.w + fc.x));
    for (const o of list) if (o !== fc) assert.ok(Math.abs(o.x - fc.x) + Math.abs(o.y - fc.y) >= 10, 'はなれている');
  }
});

test('ランダムな 宝箱を 開けると きえて、しばらくすると べつの 宝箱が 出る', async () => {
  const { world, bot, c } = await hero();
  await tickN(world, 2);
  const ms = mapState(world, 'overworld');
  const fc = [...ms.fchests.values()][0];
  bot.s.x = fc.x + 0.5;
  bot.s.y = fc.y + 1.5;
  bot.s.dir = 'up';
  const gold0 = c.gold, items0 = JSON.stringify(c.items);
  bot.send({ t: 'interact', kind: 'tile', x: fc.x + 0.5, y: fc.y + 0.5 });
  await bot.settle();
  assert.ok(!ms.fchests.has(fc.id), 'きえた');
  assert.ok(c.gold > gold0 || JSON.stringify(c.items) !== items0, '中みを もらった');
  assert.equal(c.fieldChests, 1);
  // クライアントへの 一覧にも ない
  const snap = bot.msgs.filter((m) => m.t === 'snap' && m.fc).pop();
  assert.ok(!snap.fc.some(([id]) => id === fc.id));
  // 時間が たつと また ふえる
  const n = ms.fchests.size;
  for (let t = 0; t < FIELD_CHEST_RESPAWN_MS + 2000; t += 1000) await tickN(world, 20);
  assert.equal(ms.fchests.size, n + 1, 'また 出た');
});

test('地図に ある フィールドの 宝箱は 開けたら きえる（洞窟の 宝箱は 空っぽで のこる）', async () => {
  const { world, bot, c } = await hero();
  const ow = MAPS.overworld.chests.find((x) => x.id === 'ow_hill');
  bot.s.x = ow.x + 0.5;
  bot.s.y = ow.y + 1.5;
  bot.send({ t: 'interact', kind: 'tile', x: ow.x + 0.5, y: ow.y + 0.5 });
  await bot.settle();
  assert.equal(c.chests.ow_hill, true);
  const said = () => bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps || []).filter((st) => st[0] === 'say').map((st) => st[2]);
  const before = said().length;
  bot.send({ t: 'interact', kind: 'tile', x: ow.x + 0.5, y: ow.y + 0.5 });
  await bot.settle();
  assert.ok(!said().slice(before).some((t) => /空っぽ/.test(t)), 'もう 宝箱は ない（空っぽと 言わない）');
  // 洞窟
  world.placeSession(bot.s, 'cave_b1', 9.5, 14.5, 'up', true);
  await bot.settle();
  bot.send({ t: 'interact', kind: 'tile', x: 9.5, y: 13.5 });
  await bot.settle();
  assert.equal(c.chests.b1_a, true);
  const b2 = said().length;
  bot.send({ t: 'interact', kind: 'tile', x: 9.5, y: 13.5 });
  await bot.settle();
  assert.ok(said().slice(b2).some((t) => /空っぽ/.test(t)), '洞窟の 宝箱は 空っぽで のこる');
});

test('きらきらは 足もとや ななめでも ひろえる（ひろった ものは じゃまに ならない）', async () => {
  const { world, bot, c } = await hero();
  const sps = MAPS.overworld.sparkles.filter((x) => !x.medal);
  const sp = sps[0];
  const n0 = c.items.reduce((s, e) => s + e.n, 0);
  // 自分の 足もと（前を むいて しらべても ひろえる）
  bot.s.x = sp.x + 0.5;
  bot.s.y = sp.y + 0.5;
  bot.send({ t: 'interact', kind: 'tile', x: sp.x + 0.5, y: sp.y - 0.5 });
  await bot.settle();
  assert.ok(c.sparkles?.[sp.id], '足もとの きらきらを ひろった');
  assert.equal(c.items.reduce((s, e) => s + e.n, 0), n0 + 1);
  // ななめ前
  const sp2 = sps[1];
  bot.s.x = sp2.x - 0.5;
  bot.s.y = sp2.y + 1.5;
  bot.send({ t: 'interact', kind: 'tile', x: sp2.x - 0.5, y: sp2.y + 0.5 });
  await bot.settle();
  assert.ok(c.sparkles?.[sp2.id], 'ななめの きらきらも ひろえる');
});
