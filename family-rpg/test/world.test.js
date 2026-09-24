import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, POS } from '../public/js/shared/maps/index.js';
import { PLACES, FOREST_CLEARING, CAVE_ENTRANCE } from '../public/js/shared/maps/overworld.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const V = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];
const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];
const SH = (x, y) => [PLACES.shrine.x + x, PLACES.shrine.y + y];

function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'iron_sword';
  c.equip.armor = 'iron_armor';
  c.hp = 9999;
  c.mp = 9999;
  const st = { hp: 0 };
  bot.world.sendSelf(bot.s);
}

test('ひとりで じょしょう〜1しょうの ボスまで とおして あそべる', { timeout: 240000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(42), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  assert.ok(bot.flag('p_opening'), 'オープニング');

  // ばあちゃんに はなす → 星の花を とりにいく
  await bot.walkTo(...V(24, 18));
  await bot.talk('elder');
  assert.ok(bot.flag('p_start'));
  assert.equal(bot.party.guests.length, 1, 'ルカが ゲストで くわわる');

  await bot.walkTo(...SH(5, 5));
  await bot.talk('star_flower');
  assert.ok(bot.flag('p_flower'));
  assert.ok(bot.char.keyItems.includes('star_flower'));

  // まつり → ザルバ → かげのへいと たたかう
  boost(bot, 6);
  await bot.walkTo(...V(24, 18));
  await bot.talk('elder');
  assert.ok(bot.flag('p_attack'), 'まつりの よるの イベント');
  assert.equal(bot.battles.length, 1);
  assert.equal(bot.battles[0].outcome, 'win');
  assert.equal(bot.party.guests.length, 0, 'ルカは はなれる');

  // 町へ
  await bot.walkTo(...V(15, 1));
  await bot.walkTo(...TW(23, 30));
  assert.ok(bot.flag('c1_town'), '町に ついた');
  await bot.walkTo(...TW(7, 5));
  await bot.talk('mayor');
  assert.ok(bot.flag('c1_mayor'));
  await bot.walkTo(...TW(38, 32));
  await bot.talk('carpenter');
  assert.ok(bot.flag('c1_wood_quest'));

  // 森の ぬし
  boost(bot, 14);
  await bot.walkTo(FOREST_CLEARING.x, FOREST_CLEARING.y + 1);
  await bot.talk('treant');
  assert.ok(bot.flag('c1_treant'), 'ダークトレントを たおした');
  assert.ok(bot.char.keyItems.includes('spirit_wood'));

  await bot.walkTo(...TW(38, 32));
  await bot.talk('carpenter');
  assert.ok(bot.flag('bridge_fixed'), '橋が なおった');

  // どうくつ
  await bot.walkTo(CAVE_ENTRANCE.x, CAVE_ENTRANCE.y);
  assert.equal(bot.map, 'cave_b1');
  await bot.settle();
  assert.ok(bot.flag('c1_cave'));
  await bot.walkTo(43, 3);
  assert.equal(bot.map, 'cave_b2');
  await bot.walkTo(6, 27);
  await bot.examine(6, 26);
  assert.ok(bot.char.keyItems.includes('cave_key'), 'カギ');
  await bot.walkTo(23, 12);
  await bot.examine(23, 11);
  assert.ok(bot.flag('c1_door'), 'とびらが ひらいた');

  // ボス
  boost(bot, 24);
  await bot.walkTo(23, 9);
  await bot.settle();
  assert.ok(bot.flag('c1_boss'), 'ゴルドーンを たおした');
  assert.ok(bot.battles.some((b) => b.outcome === 'win' && b.story), 'ボス戦');
  await bot.walkTo(21, 4);
  await bot.examine(21, 3);
  assert.equal(bot.char.equip.weapon === 'stardust_sword' || bot.char.items.some((i) => i.id === 'stardust_sword'), true);

  // 村へ かえる（きかんのはね）
  bot.world.data.characters[bot.char.id].items.push({ id: 'return_wing', n: 1 });
  await bot.walkTo(43, 31);
  assert.equal(bot.map, 'cave_b1');
  await bot.walkTo(24, 34);
  assert.equal(bot.map, 'overworld');
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'village' });
  await bot.settle();
  await bot.walkTo(...V(24, 18));
  await bot.talk('elder');
  assert.ok(bot.flag('c1_clear'), '1しょう クリア！');
});

test('家族 ふたりで パーティーを くんで いっしょに たたかえる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(7), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('まちがい');
  assert.ok(papa.msgs.some((m) => m.t === 'helloFail'), '合言葉が ちがうと はいれない');
  await papa.login('ほし');
  await kid.login('ほし');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  // さそう → うける
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  assert.ok(kid.msgs.some((m) => m.t === 'invite'));
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  assert.equal(kid.party.id, papa.party.id);

  // 酒場の かわりに ちょくせつ サポートを やとう（ゆうしゃの ルール どおり リーダーだけ）
  // フィールドへ でて モンスターに ふれる
  await papa.walkTo(...V(15, 3));
  await kid.walkTo(...V(16, 3));
  // 村の そとは みはりが いるので ひがしもんから でる
  await papa.walkTo(PLACES.village.x + 33, PLACES.village.y + 11);
  await kid.walkTo(PLACES.village.x + 33, PLACES.village.y + 12);
  let sym = null;
  for (let i = 0; i < 200 && !sym; i++) {
    await tickN(world, 1);
    const ms = world.mapStates.get('overworld');
    sym = [...ms.symbols.values()].find((s) => !s.busy);
  }
  assert.ok(sym, 'モンスターが でてくる');
  // モンスターの ところへ ワープ（テスト用）
  papa.s.x = sym.x; papa.s.y = sym.y;
  kid.s.x = sym.x + 1; kid.s.y = sym.y;
  papa.send({ t: 'touch', id: sym.id });
  assert.ok(papa.inBattle && kid.inBattle, 'ふたりとも たたかいに はいる');
  const start = papa.msgs.find((m) => m.t === 'battleStart');
  assert.equal(start.snap.combatants.filter((c) => c.side === 'ally').length, 2);
  await papa.settle(6000);
  await kid.settle(100);
  assert.ok(!papa.inBattle && !kid.inBattle);
  assert.ok(papa.battles[0].outcome === 'win' || papa.battles[0].outcome === 'lose');

  // チャット
  kid.send({ t: 'chat', text: 'パパ ありがとう！' });
  assert.ok(papa.msgs.some((m) => m.t === 'chat' && m.text === 'パパ ありがとう！'));
});

test('サポートなかま: 家族の キャラを つれていくと おれいが とどく', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(9), rateLimit: false });
  const a = new Bot(world, 'ママ');
  await a.login();
  await a.createAndPlay('priest');
  await a.settle();
  a.send({ t: 'quit' });
  const b = new Bot(world, 'ケン');
  await b.login();
  await b.createAndPlay('warrior');
  await b.settle();
  const { hireSupport } = await import('../public/js/shared/world/party.js');
  const r = hireSupport(world, b.s, 'fam:' + a.char.id);
  assert.ok(r.ok, r.reason);
  const mamaBefore = world.data.characters[a.char.id].exp;
  // たたかう
  const ms = world.mapStates.get('overworld') || null;
  const { startFieldBattle } = await import('../public/js/shared/world/battles.js');
  const sym = { id: 'test', sp: 'pururin', group: ['pururin', 'pururin'], zone: 'outskirts', table: 'outskirts', busy: false };
  startFieldBattle(world, b.s, sym);
  await b.settle(6000);
  assert.ok(b.battles.length === 1);
  if (b.battles[0].outcome === 'win') {
    assert.ok(world.data.characters[a.char.id].exp > mamaBefore, 'ママの キャラにも けいけんちが はいる');
    assert.ok(world.data.characters[a.char.id].supportLog.length > 0);
  }
});
