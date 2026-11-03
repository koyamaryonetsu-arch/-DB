// 第64回 ⑥d: 装備が 手に入りすぎる → 宝の洞窟の 宝箱・ひみつのダンジョンで へらす（そのぶん きたえる 素材）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { SD_DROP_N, SD_GUARD_DROP_N } from '../public/js/shared/data/rare-loot.js';
import { makeRng } from '../public/js/shared/rng.js';

const EQ = ['weapon', 'armor', 'shield', 'head', 'acc'];
const MATS = ['iron_shard', 'beast_fang', 'magic_powder', 'silver_shard', 'star_shard'];

test('第64回: 宝の洞窟の ふつうの 宝箱: 装備は 少なく・素材が 出る', () => {
  for (const lv of [1, 5, 10]) {
    let eq = 0, mat = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const r = chestLoot(makeRng(i * 31 + lv), lv, 'normal');
      if (EQ.includes(ITEMS[r.item]?.type)) eq++;
      if (MATS.includes(r.item)) mat++;
    }
    const before = 0.06 + lv * 0.006 + 0.15;
    assert.ok(eq / N < before * 0.6, `Lv${lv}: 装備 ${eq}/${N}（前は 約${Math.round(before * N)}）`);
    assert.ok(mat / N > 0.07, `Lv${lv}: 素材 ${mat}/${N}`);
  }
});

test('第64回: 主の 宝箱は レアか 素材（店の 装備は 出ない）・ひみつのダンジョンの 数', () => {
  let shop = 0;
  for (let i = 0; i < 600; i++) {
    const r = chestLoot(makeRng(i), 6, 'bossA');
    if (EQ.includes(ITEMS[r.item]?.type) && ITEMS[r.item].src !== 'tm' && r.item !== 'lucky_shoes') shop++;
  }
  assert.ok(shop < 30, `店の 装備 ${shop}/600`);
  assert.equal(SD_DROP_N, 250);
  assert.equal(SD_GUARD_DROP_N, 4);
});
