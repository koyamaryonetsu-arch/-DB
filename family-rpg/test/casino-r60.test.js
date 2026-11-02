// 第60回: コインを 多く 買える・多く かけられる・お店で 10個ずつ 買える
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { COIN_PRICE, COIN_MAX, COIN_BUY_MAX, COIN_PACKS, SLOT_BETS, POKER_BETS } from '../public/js/shared/data/casino.js';
import { ROULETTE_CHIPS, ROULETTE_MAX_TOTAL, normBets } from '../public/js/shared/data/roulette.js';
import { Bot } from './helpers.js';

async function gambler(seed = 5) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.c2_ship = true;
  world.placeSession(bot.s, 'casino', 14, 16.2, 'up', true);
  bot.s.busy = 'script';
  const open = (arg) => openService(world, bot.s, 'casino', arg);
  const act = (msg) => {
    serviceAction(world, bot.s, { kind: 'casino', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return { c, open, act };
}

test('第60回: コインの 上限は 999万9999枚・1回に 99万9999枚まで 買える', async () => {
  assert.equal(COIN_MAX, 9999999);
  assert.equal(COIN_BUY_MAX, 999999);
  assert.deepEqual(COIN_PACKS, [10, 100, 1000, 10000, 100000]);
  const { c, open, act } = await gambler();
  c.gold = COIN_BUY_MAX * COIN_PRICE + 5;
  const ui = open('coins');
  assert.equal(ui.buyMax, COIN_BUY_MAX);
  assert.equal(ui.coinMax, COIN_MAX);
  assert.equal(act({ action: 'buyCoins', n: COIN_BUY_MAX + 1 }).ok, false, '1回の 上限を こえる');
  const r = act({ action: 'buyCoins', n: COIN_BUY_MAX });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, COIN_BUY_MAX);
  assert.equal(c.gold, 5);
});

test('第60回: スロット・ポーカー・ルーレットで 1000枚 かけられる', async () => {
  assert.deepEqual(SLOT_BETS, [1, 10, 100, 1000]);
  assert.deepEqual(POKER_BETS, [1, 10, 100, 1000]);
  assert.deepEqual(ROULETTE_CHIPS, [1, 10, 100, 1000]);
  assert.equal(ROULETTE_MAX_TOTAL, 30000);
  const { c, open, act } = await gambler(9);
  c.coins = 100000;
  assert.deepEqual(open('slot1').bets, SLOT_BETS);
  let before = c.coins;
  let r = act({ action: 'slot', bet: 1000 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, before - 1000 + r.win);
  assert.equal(act({ action: 'slot', bet: 5000 }).ok, false, '表に ない 数は だめ');
  open('poker');
  before = c.coins;
  r = act({ action: 'pokerDeal', bet: 1000 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, before - 1000);
  // ルーレットは 1回の 合計 3万枚まで
  assert.ok(normBets([{ k: 'red', c: 20000 }, { k: 'num', v: 7, c: 10000 }]));
  assert.equal(normBets([{ k: 'red', c: 20000 }, { k: 'num', v: 7, c: 10001 }]), null);
});

test('第60回: 買う 数の まどに ＋10・－10（10・20・30… に そろう）。お店は 持てる 99個まで', () => {
  const ct = readFileSync(new URL('../public/js/client/ui/counter.js', import.meta.url), 'utf8');
  assert.match(ct, /text: '－10'/);
  assert.match(ct, /text: '＋10'/);
  assert.match(ct, /a === 'up'\) ten\(10\)/);
  // ten の 計算を 取り出して ためす
  const body = ct.match(/const ten = \(d\) => \{ (q = [^;]+;) \}/)[1];
  const ten = (q, d, max) => new Function('q', 'd', 'max', `${body} return q;`)(q, d, max);
  assert.equal(ten(1, 10, 99), 10);
  assert.equal(ten(10, 10, 99), 20);
  assert.equal(ten(15, 10, 99), 20);
  assert.equal(ten(95, 10, 99), 99, 'はしで 止まる');
  assert.equal(ten(20, -10, 99), 10);
  assert.equal(ten(15, -10, 99), 10);
  assert.equal(ten(10, -10, 99), 1);
  assert.equal(ten(1, 10, 7), 7, '買える 数が 少ない 時');
  const shop = readFileSync(new URL('../public/js/client/ui/shop.js', import.meta.url), 'utf8');
  assert.match(shop, /const room = 99 - itemCount\(game\.me, id\);/);
  const cs = readFileSync(new URL('../public/js/client/ui/casino.js', import.meta.url), 'utf8');
  for (const t of ['＋100', '＋1000', '＋1万', '－1万']) assert.ok(cs.includes(`'${t}'`), t);
  assert.ok(!cs.includes('|| 9999,'), 'コインの 上限を 古い 数で 書かない');
});
