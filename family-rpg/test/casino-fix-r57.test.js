// 第57回: スロットの 当たりの あとに 画面が 止まる・すごろく場から ついてきた 家族が 出られない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot, tickN } from './helpers.js';
import { SUGOROKU_STAIRS, SUGOROKU_HALL_STAIRS } from '../public/js/shared/maps/casino.js';
import { MAPS } from '../public/js/shared/maps/index.js';

test('第57回: スロットの 当たりは 役の 表から 形を さがす（サーバーの 当たりに line が ない）', () => {
  const js = readFileSync(new URL('../public/js/client/ui/casino.js', import.meta.url), 'utf8');
  assert.ok(!/fx\.pay\.line\.map/.test(js), 'fx.pay.line を そのまま 使わない');
  assert.match(js, /SLOT_PAYS\.find\(\(x\) => x\.id === fx\.pay\.id\)/);
  const srv = readFileSync(new URL('../public/js/shared/world/casino.js', import.meta.url), 'utf8');
  assert.match(srv, /pay: pay \? \{ id: pay\.id, name: pay\.name, mult: pay\.mult \}/, 'サーバーの 形は id・name・mult');
});

test('第57回: リーダーに ついていく 家族は 出入り口の 上に 置かれない（すごろく場から 出られる）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(57), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login(); await yui.login();
  await papa.createAndPlay('warrior'); await yui.createAndPlay('mage');
  await papa.settle(); await yui.settle();
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle(); await yui.settle();
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  world.placeSession(P, 'casino', SUGOROKU_STAIRS.x + 0.5, SUGOROKU_STAIRS.y - 1.5, 'down');
  world.placeSession(Y, 'casino', SUGOROKU_STAIRS.x - 0.5, SUGOROKU_STAIRS.y - 1.5, 'down');
  papa.map = yui.map = 'casino';
  papa.x = SUGOROKU_STAIRS.x + 0.5; papa.y = SUGOROKU_STAIRS.y - 1.5;
  yui.x = SUGOROKU_STAIRS.x - 0.5; yui.y = SUGOROKU_STAIRS.y - 1.5;
  Y.follow = true;
  await papa.walkTo(SUGOROKU_STAIRS.x, SUGOROKU_STAIRS.y);
  await tickN(world, 10); await papa.settle(); await yui.settle();
  assert.equal(Y.map, 'sugoroku_hall', 'ついてきた');
  const onWarp = MAPS.sugoroku_hall.warps.some((w) => w.x === Math.floor(Y.x) && w.y === Math.floor(Y.y));
  assert.ok(!onWarp, `階だんの 上では ない（${Y.x},${Y.y}）`);
  await yui.walkTo(SUGOROKU_HALL_STAIRS.x, SUGOROKU_HALL_STAIRS.y);
  await tickN(world, 10); await yui.settle();
  assert.equal(Y.map, 'casino', 'ユイは 自分で 階だんを 上って 出られる');
});
