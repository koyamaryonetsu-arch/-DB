// 第64回 ⑥b: 装備の 分解（ふしぎなかじ屋）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { RECIPES } from '../public/js/shared/data/forge.js';
import { salvageOf, salvageBlock } from '../public/js/shared/data/salvage.js';
import { isShopGear } from '../public/js/shared/data/items-rare.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { addItem, itemCount } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

const EQ = ['weapon', 'armor', 'shield', 'head', 'acc'];

test('第64回: 店の 品・ボスの 品は 分解できない。★2からは 素材に なる', () => {
  assert.ok(salvageBlock('wood_sword'), '店の 品');
  assert.equal(salvageOf('wood_sword'), null);
  const boss = Object.keys(ITEMS).find((k) => EQ.includes(ITEMS[k].type) && (ITEMS[k].unique || ITEMS[k].boss) && !ITEMS[k].base);
  if (boss) assert.ok(salvageBlock(boss));
  const rare = Object.keys(ITEMS).filter((k) => EQ.includes(ITEMS[k].type) && !ITEMS[k].base && !isShopGear(ITEMS[k]) && !salvageBlock(k));
  assert.ok(rare.length > 100);
  for (const id of rare) {
    const m = salvageOf(id);
    assert.ok(m.length >= 1, id);
    for (const [mid, n] of m) assert.ok(ITEMS[mid] && n >= 1, `${id}: ${mid}`);
  }
  assert.equal(salvageOf('herb'), null, '道具は できない');
});

test('第64回: バランス: レシピで 作る・きたえる より 多くの 素材は もどらない', () => {
  const total = (mats) => mats.reduce((a, [, n]) => a + n, 0);
  for (const r of RECIPES) {
    const m = salvageOf(r.id);
    if (!m) continue;
    for (const [mid, n] of m) {
      const used = r.mats.find(([x]) => x === mid)?.[1] || 0;
      if (used) assert.ok(n <= Math.max(1, Math.floor(used / 2)), `${r.id}: ${mid} ${n} > ${used}/2`);
    }
  }
  // +n の 装備: きたえるのに 使った 素材より 少ない
  for (const id of Object.keys(ITEMS).filter((k) => ITEMS[k].plus >= 3).slice(0, 300)) {
    const m = salvageOf(id);
    if (!m) continue;
    // きたえる 素材（data/forge.js の upgradeCost と 同じ 数え方。+1〜+n の 合計の 下限）
    const rank = ITEMS[ITEMS[id].base]?.rank || 1;
    let spent = 0;
    for (let n = 1; n <= ITEMS[id].plus; n++) spent += n + Math.floor((rank - 1) / 2);
    assert.ok(total(m) < spent, `${id}: ${total(m)} >= ${spent}`);
  }
});

test('第64回: サーバー: 分解すると 装備が なくなって 素材が ふえる', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(64), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  const id = Object.keys(ITEMS).find((k) => ITEMS[k].type === 'weapon' && !ITEMS[k].base && !salvageBlock(k));
  addItem(c, id, 1);
  const mats = salvageOf(id);
  const before = mats.map(([m]) => itemCount(c, m));
  const res = () => bot.msgs.filter((m) => m.t === 'svcRes').pop();
  bot.send({ t: 'svc', kind: 'forge', action: 'salvage', id });
  assert.ok(res().ok, res().text);
  assert.equal(itemCount(c, id), 0);
  mats.forEach(([m, n], i) => assert.equal(itemCount(c, m), before[i] + n));
  bot.send({ t: 'svc', kind: 'forge', action: 'salvage', id });
  assert.equal(res().ok, false, 'もう 持っていない');
  addItem(c, 'wood_sword', 1);
  bot.send({ t: 'svc', kind: 'forge', action: 'salvage', id: 'wood_sword' });
  assert.equal(res().ok, false, '店の 品');
});
