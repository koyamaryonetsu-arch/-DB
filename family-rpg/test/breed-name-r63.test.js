// 第63回: 配合の 名前は 生まれて 姿を 見てから（「名前をつける？」）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { addMonsterCompanion, companionRename } from '../public/js/shared/world/party.js';
import { Bot } from './helpers.js';

async function solo(seed = 63) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(30) - c.exp);
  c.flags.monster_bond = true;
  return { world, bot, c };
}
const lastRes = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();

test('第63回: 配合の へんじに 生まれた 子（key・種族の 名前）。そのあと 名前を かえられる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo();
  const a = addMonsterCompanion(world, bot.s, 'pururin', 20), b = addMonsterCompanion(world, bot.s, 'pururin', 20);
  bot.send({ t: 'svc', kind: 'tavern', action: 'breed', a: a.key, b: b.key, child: 'pururin', name: '' });
  const r = lastRes(bot);
  assert.ok(r.ok, r.text);
  assert.ok(r.born?.key, '生まれた 子の key');
  assert.equal(r.born.species, 'pururin');
  assert.equal(r.born.name, MONSTERS.pururin.name, 'さいしょは 種族の 名前');
  assert.match(r.text, /が生まれた！/);
  bot.send({ t: 'svc', kind: 'tavern', action: 'rename', key: r.born.key, name: 'ぷるぷる' });
  assert.ok(lastRes(bot).ok);
  assert.equal(c.companions.find((e) => e.key === r.born.key).char.name, 'ぷるぷる');
});

test('第63回: あずかり所の 魔物も 名前を かえられる', async () => {
  const { world, bot, c } = await solo();
  c.storage = [{ key: 's1', kind: 'monster', species: 'pururin', char: { name: 'プルリン', level: 3 } }];
  const r = companionRename(world, bot.s, 's1', 'あずき');
  assert.ok(r.ok, r.reason);
  assert.equal(c.storage[0].char.name, 'あずき');
  assert.equal(companionRename(world, bot.s, 'none', 'x').ok, false);
});

test('第63回: クライアント: 配合の 前に 名前を たずねない・生まれた あとに「名前をつける？」', () => {
  const src = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(!src.includes("title: '生まれる子の名前"), '前の 名前の まどは ない');
  assert.match(src, /'名前をつける？'/);
  assert.match(src, /const bornName = async \(r\) =>/);
  const i = src.indexOf("action: 'breed', a, b, child: pv.child");
  const j = src.indexOf("'配合する', 'やめる'");
  assert.ok(j > 0 && i > j, 'たしかめて から 配合');
});
