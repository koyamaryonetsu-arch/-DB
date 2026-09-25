import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { recruitNpc, ensureCompanions } from '../public/js/shared/world/party.js';
import { ITEMS, sellPrice } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { itemCount } from '../public/js/shared/stats.js';
import { MAPS, tileAt, BOARD_NAMES } from '../public/js/shared/maps/index.js';
import { TILE_INFO, T } from '../public/js/shared/tiles.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { Bot } from './helpers.js';

async function shopper(shop = 'weapon') {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.gold = 2000;
  openService(world, bot.s, 'shop', shop);
  const act = (msg) => {
    serviceAction(world, bot.s, { kind: 'shop', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return { world, bot, c, act };
}

test('お店: 店の人・あいさつ・かんばんの しゅるいが ある', () => {
  for (const [id, s] of Object.entries(SHOPS)) {
    assert.ok(s.keeper && s.hello && s.kind, id);
    assert.ok(BOARD_NAMES[s.kind], `${id} kind ${s.kind}`);
    for (const it of s.items) assert.ok(ITEMS[it]?.price > 0, `${id}: ${it}`);
  }
});

test('お店: 買って その場で 装備し、今までの 装備を 売れる', async () => {
  const { c, act } = await shopper();
  const old = c.equip.weapon;
  assert.ok(old, 'はじめの 武器');
  const r = act({ action: 'buy', id: 'iron_sword', who: 'self', sellOld: true });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.equip.weapon, 'iron_sword');
  assert.equal(itemCount(c, old), 0, '古い 武器は 売った');
  assert.equal(c.gold, 2000 - ITEMS.iron_sword.price + sellPrice(old));
  assert.match(r.text, /装備した/);
});

test('お店: 装備しないで 買うと ふくろに 入る。売らないと 古い 装備も ふくろへ', async () => {
  const { c, act } = await shopper();
  const old = c.equip.weapon;
  let r = act({ action: 'buy', id: 'bronze_sword' });
  assert.equal(r.ok, true);
  assert.equal(c.equip.weapon, old, '装備は そのまま');
  assert.equal(itemCount(c, 'bronze_sword'), 1);
  r = act({ action: 'buy', id: 'iron_sword', who: 'self', sellOld: false });
  assert.equal(r.ok, true);
  assert.equal(c.equip.weapon, 'iron_sword');
  assert.equal(itemCount(c, old), 1, '古い 武器は ふくろ');
});

test('お店: 仲間に 装備させられる。装備できない 人には 売らない', async () => {
  const { world, bot, c, act } = await shopper();
  recruitNpc(world, bot.s, 'npc_mina', { join: true });
  recruitNpc(world, bot.s, 'npc_gard', { join: true });
  const gard = ensureCompanions(c).companions.find((x) => x.key === 'npc_gard').char;
  let r = act({ action: 'buy', id: 'iron_sword', who: 'npc_gard', sellOld: false });
  assert.equal(r.ok, true, r.text);
  assert.equal(gard.equip.weapon, 'iron_sword');
  const gold = c.gold;
  r = act({ action: 'buy', id: 'iron_sword', who: 'npc_mina' }); // 僧侶は 剣を 装備できない
  assert.equal(r.ok, false);
  assert.equal(c.gold, gold, 'ゴールドは へらない');
  assert.equal(itemCount(c, 'iron_sword'), 0);
});

test('お店: ゴールドが 足りない・店に ない 品物・装備品は 1つずつ', async () => {
  const { c, act } = await shopper();
  c.gold = 10;
  let r = act({ action: 'buy', id: 'iron_sword' });
  assert.equal(r.ok, false);
  assert.match(r.text, /足りない/);
  c.gold = 5000;
  r = act({ action: 'buy', id: 'herb', qty: 3 });
  assert.equal(r.ok, false, '武器屋に 薬草は ない');
  r = act({ action: 'buy', id: 'iron_sword', qty: 5 });
  assert.equal(r.ok, true);
  assert.equal(itemCount(c, 'iron_sword'), 1, '装備品は 1つずつ');
});

test('お店: 道具は まとめて 買える。売ると 買った ねだんの 4分の3', async () => {
  const { c, act } = await shopper('item');
  const have = itemCount(c, 'herb');
  let r = act({ action: 'buy', id: 'herb', qty: 3 });
  assert.equal(r.ok, true);
  assert.equal(itemCount(c, 'herb'), have + 3);
  assert.equal(c.gold, 2000 - ITEMS.herb.price * 3);
  const g = c.gold;
  r = act({ action: 'sell', id: 'herb', qty: 2 });
  assert.equal(r.ok, true);
  assert.equal(c.gold, g + sellPrice('herb') * 2);
  assert.equal(sellPrice('herb'), Math.floor(ITEMS.herb.price * 3 / 4));
  r = act({ action: 'sell', id: 'herb', qty: 99 });
  assert.equal(r.ok, false, '持っている より 多くは 売れない');
});

test('お店: むかしの「買って 装備」も 使える', async () => {
  const { c, act } = await shopper();
  const r = act({ action: 'buy', id: 'bronze_sword', equip: true });
  assert.equal(r.ok, true);
  assert.equal(c.equip.weapon, 'bronze_sword');
});

test('かんばん: お店の 入り口の よこの かべに ある', () => {
  for (const m of Object.values(MAPS)) {
    for (const b of m.boards || []) {
      const t = tileAt(m, b.x, b.y);
      assert.ok(t === T.WALL_WOOD || t === T.WALL_STONE, `${m.id} ${b.kind} ${b.x},${b.y} is ${TILE_INFO[t]?.name}`);
      assert.ok([tileAt(m, b.x - 1, b.y), tileAt(m, b.x + 1, b.y)].includes(T.DOOR), `${m.id} ${b.kind} は 入り口の よこ`);
      assert.ok(b.name, 'なまえ');
    }
  }
  const kinds = (id) => (MAPS[id].boards || []).map((b) => b.kind);
  for (const k of ['general', 'weapon', 'armor', 'item', 'inn', 'church']) assert.ok(kinds('overworld').includes(k), k);
  for (const k of ['item', 'inn', 'arms', 'church']) assert.ok(kinds('sea').includes(k), k);
});

test('宿屋・教会・お店の だいほん', () => {
  const x = { flag: () => false, has: () => false, name: 'ソラ' };
  const inn = SCRIPTS.inn(x);
  assert.equal(inn[0][0], 'say');
  assert.match(inn[0][2], /12ゴールド/);
  assert.equal(inn[1][0], 'choice');
  assert.deepEqual(inn[1][3][0][0], ['inn', 12, '宿屋のおかみ']);
  assert.deepEqual(SCRIPTS.church(x), [['church']]);
  assert.deepEqual(SCRIPTS.shop_weapon(x), [['shop', 'weapon']]);
  assert.deepEqual(SCRIPTS.port_arms(x), [['shop', 'port_arms']]);
});

test('宿屋: とまると ゴールドを はらって 全回復。「いいえ」なら 何も かわらない', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.gold = 100;
  c.hp = 1;
  c.mp = 0;
  const inn = MAPS.overworld.npcById.innkeeper;
  world.placeSession(bot.s, 'overworld', inn.x + 0.5, inn.y + 2.5, 'up', true);
  bot.choice = 1; // いいえ
  await bot.talk('innkeeper');
  assert.equal(c.gold, 100);
  assert.equal(c.hp, 1);
  bot.choice = 0; // はい
  await bot.talk('innkeeper');
  assert.equal(c.gold, 88, '12ゴールド');
  assert.ok(c.hp > 1 && c.mp > 0, '全回復');
  const says = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]);
  assert.ok(says.some((t) => t.includes('おはようございます')));
  assert.ok(says.some((t) => t.includes('いってらっしゃいませ')));
  c.gold = 3;
  await bot.talk('innkeeper');
  assert.equal(c.gold, 3, 'お金が 足りない ときは とまれない');
});
