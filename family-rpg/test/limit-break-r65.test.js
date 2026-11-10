// 第65回: 限界とっぱ（かじ屋で 限界の石・れん金がまで 上限まで きたえた 同じ 装備 2つ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { upgradeCost, canUpgrade, maxPlus, canLimitBreak, LIMIT_STONE, rebirthOf } from '../public/js/shared/data/forge.js';
import { LB_MAX, lbId, upgradeId, upgradeLimit, CAP_UP_MAX } from '../public/js/shared/data/items-forge.js';
import { matchPot, limitMerge } from '../public/js/shared/data/alchemy.js';
import { fxSlots } from '../public/js/shared/data/gear-fx.js';
import { isShopGear } from '../public/js/shared/data/items-rare.js';
import { itemSources, sourceText } from '../public/js/shared/item-sources.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { sdBigReward } from '../public/js/shared/data/secret.js';
import { ARENA_RANKS } from '../public/js/shared/data/arena.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';

const pick = (pred) => Object.keys(ITEMS).find((k) => !ITEMS[k].base && !isShopGear(ITEMS[k]) && !rebirthOf(k) && pred(ITEMS[k]));
const SWORD = pick((it) => it.type === 'weapon' && (it.rank || 1) >= 5);
const char = (cap = 0) => ({ alchemy: { cap: cap ? { [SWORD]: cap } : {} } });

test('第65回 限界とっぱ: 装備が ある・名前に ★・1回 きたえた ぶん 強い', () => {
  const lim = upgradeLimit(ITEMS[SWORD]);
  for (let k = 1; k <= LB_MAX; k++) {
    const it = ITEMS[lbId(SWORD, lim, k)];
    assert.ok(it, `★${k}`);
    assert.equal(it.name, `${ITEMS[SWORD].name}+${lim}★${k}`);
    assert.equal(it.plus, lim);
    assert.equal(it.lb, k);
    assert.equal(it.atk, ITEMS[upgradeId(SWORD, lim + k)]?.atk ?? it.atk);
    assert.ok(it.atk > ITEMS[upgradeId(SWORD, lim)].atk);
  }
  assert.ok(ITEMS[lbId(SWORD, lim + CAP_UP_MAX, LB_MAX)], '回数を ふやした あとも');
  assert.equal(ITEMS[lbId(SWORD, lim, LB_MAX + 1)], undefined);
  assert.equal(fxSlots({}, upgradeId(SWORD, lim)), 1);
  assert.equal(fxSlots({}, lbId(SWORD, lim, 1)), 2);
});

test('第65回 限界とっぱ: かじ屋（上限まで → 限界の石。★3 まで。★の まま きたえられる）', () => {
  const c = char();
  const lim = maxPlus(SWORD, c);
  assert.ok(lim > 0);
  assert.ok(!upgradeCost(upgradeId(SWORD, lim - 1), c)?.limit, '上限より 下は ふつうに きたえる');
  const top = upgradeId(SWORD, lim);
  assert.ok(canLimitBreak(top, c) && canUpgrade(top, c));
  const k1 = upgradeCost(top, c);
  assert.equal(k1.limit, true);
  assert.equal(k1.to, lbId(SWORD, lim, 1));
  assert.deepEqual(k1.mats[0], [LIMIT_STONE, 1]);
  const k3 = upgradeCost(lbId(SWORD, lim, 2), c);
  assert.equal(k3.to, lbId(SWORD, lim, 3));
  assert.deepEqual(k3.mats[0], [LIMIT_STONE, 3]);
  assert.equal(upgradeCost(lbId(SWORD, lim, 3), c), null, '★3 で おわり');
  // れん金で 回数を ふやした あとは ★の まま +1
  const c1 = char(1);
  const up = upgradeCost(lbId(SWORD, lim, 2), c1);
  assert.equal(up.limit, undefined);
  assert.equal(up.to, lbId(SWORD, lim + 1, 2));
  // 店の 品は できない
  const shop = Object.keys(ITEMS).find((k) => !ITEMS[k].base && ITEMS[k].type === 'weapon' && isShopGear(ITEMS[k]));
  assert.equal(canLimitBreak(shop, c), false);
});

test('第65回 限界とっぱ: れん金がま（回数を ぜんぶ ふやした あと、上限まで きたえた 物 2つ）', () => {
  const lim = upgradeLimit(ITEMS[SWORD]);
  const top = lim + CAP_UP_MAX;
  // 回数を ふやす うちは 今まで どおり
  assert.equal(matchPot([upgradeId(SWORD, lim), SWORD], char(0)).lb, undefined);
  const c = char(CAP_UP_MAX);
  assert.equal(matchPot([upgradeId(SWORD, top), SWORD], c).why, 'capMax', '片方が 上限 でない');
  const m = matchPot([upgradeId(SWORD, top), upgradeId(SWORD, top)], c);
  assert.equal(m.ok, true);
  assert.equal(m.lb, 1);
  assert.equal(m.out, lbId(SWORD, top, 1));
  assert.equal(matchPot([lbId(SWORD, top, 2), upgradeId(SWORD, top)], c).out, lbId(SWORD, top, 3));
  assert.equal(limitMerge([lbId(SWORD, top, 3), upgradeId(SWORD, top)], c).why, 'lbMax');
  // 回数を ふやす ときも ★の 物が のこる
  assert.equal(matchPot([upgradeId(SWORD, lim), lbId(SWORD, lim, 1)], char(0)).out, lbId(SWORD, lim, 1));
});

test('第65回 限界の石: 入手先（宝の地図 Lv30〜・闘技場 9・10・ひみつのダンジョン 30階〜・第7章の ボス）', () => {
  assert.equal(ITEMS[LIMIT_STONE].type, 'mat');
  let got = 0;
  for (let i = 0; i < 400; i++) if (chestLoot(makeRng(i + 1), 32, 'bossA').item === LIMIT_STONE) got++;
  assert.ok(got > 60 && got < 200, `主の 宝箱 ${got}/400`);
  for (let i = 0; i < 200; i++) assert.notEqual(chestLoot(makeRng(i + 1), 25, 'bossA').item, LIMIT_STONE, 'Lv25 までは 出ない');
  assert.ok(sdBigReward(30).some((e) => e.item === LIMIT_STONE));
  assert.ok(!sdBigReward(25).some((e) => e.item === LIMIT_STONE));
  const ranks = ARENA_RANKS.filter((r) => r.first?.mats?.some(([id]) => id === LIMIT_STONE));
  assert.equal(ranks.length, 4); // 第68回 C: ランク11 も・第74回 C: ランク12 も
  const withStone = Object.keys(MONSTERS).filter((sp) => monsterDrops(sp).some((d) => d.item === LIMIT_STONE && d.kind === 'bonus'));
  assert.ok(withStone.length >= 4, withStone.join(','));
  const src = itemSources(LIMIT_STONE);
  assert.ok(src.some((s) => s.kind === 'note'));
  assert.ok(src.some((s) => s.kind === 'monster' && s.boss));
  for (const s of src) assert.ok(sourceText(s).length > 0);
});

test('第65回 限界とっぱ: 漢字の きまり', () => {
  for (const f of gameFiles().filter((x) => /forge|alchemy|gear-fx|item-sources|items-forge/.test(x))) {
    const bad = checkFile(f).filter((p) => p.kind === 'kanji' || p.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
});

// ───── サーバーの うごき（かじ屋・れん金がま）─────
import { GameWorld } from '../public/js/shared/world/world.js';
import { alchemySteps } from '../public/js/shared/world/alchemy.js';
import { ALCHEMY_POT, POT_FLAG } from '../public/js/shared/data/alchemy.js';
import { addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

async function solo() {
  const world = new GameWorld({ offline: true, rng: makeRng(65), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  return { world, bot, c: world.data.characters[bot.char.id] };
}
const svc = (bot, msg) => {
  bot.send({ t: 'svc', ...msg });
  return bot.msgs.filter((m) => m.t === 'svcRes').pop();
};

test('第65回 限界とっぱ: かじ屋で 装備している 物を ★1 に（強く なる・効果 2つ）', async () => {
  const { bot, c } = await solo();
  const lim = upgradeLimit(ITEMS.flame_sword);
  const top = upgradeId('flame_sword', lim);
  c.equip.weapon = top;
  c.gold = 99999;
  c.items = [{ id: LIMIT_STONE, n: 1 }, { id: 'star_shard', n: 3 }];
  const atk0 = computeStats(c).atk;
  const r = svc(bot, { kind: 'forge', action: 'upgrade', id: top, who: 'self' });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /限界をこえて/);
  assert.equal(c.equip.weapon, lbId('flame_sword', lim, 1));
  assert.ok(computeStats(c).atk > atk0);
  assert.equal(itemCount(c, LIMIT_STONE), 0);
  assert.equal(fxSlots(c, c.equip.weapon), 2);
  // 石が ない
  const no = svc(bot, { kind: 'forge', action: 'upgrade', id: c.equip.weapon, who: 'self' });
  assert.equal(no.ok, false);
  assert.match(no.text, /素材が足りない/);
});

test('第65回 限界とっぱ: れん金がまで 上限まで きたえた 同じ 物 2つ → ★1', async () => {
  const { world, bot, c } = await solo();
  addItem(c, ALCHEMY_POT, 1);
  c.flags[POT_FLAG] = true;
  const top = upgradeLimit(ITEMS.flame_sword) + CAP_UP_MAX;
  c.alchemy = { ...(c.alchemy || {}), cap: { flame_sword: CAP_UP_MAX } };
  c.items.push({ id: upgradeId('flame_sword', top), n: 2 });
  const put = svc(bot, { kind: 'alchemy', action: 'put', ids: [upgradeId('flame_sword', top), upgradeId('flame_sword', top)] });
  assert.equal(put.ok, true, put.text);
  assert.match(put.text, /限界とっぱ/);
  alchemySteps(world, bot.s, 99);
  assert.equal(itemCount(c, lbId('flame_sword', top, 1)), 1);
  assert.equal(itemCount(c, upgradeId('flame_sword', top)), 0);
});
