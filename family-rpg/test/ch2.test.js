import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, POS, isBlocked, onWater } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { PORT, SEA_POS, ISLETS } from '../public/js/shared/maps/sea.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot } from './helpers.js';

const V = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];
const P = (x, y) => [PORT.x + x, PORT.y + y];

function bfs(map, start, flags = []) {
  const has = (f) => flags.includes(f);
  const seen = new Uint8Array(map.w * map.h);
  const q = [start];
  seen[start[1] * map.w + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen[k] || isBlocked(map, nx, ny, has) || map.chestAt.has(k)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => !!seen[y * map.w + x];
}
const near = (reach, x, y, r = 1) => {
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (reach(x + dx, y + dy)) return true;
  return false;
};

test('第2章: 海は 船で すすめて、嵐の島は 灯台の 光で 道が ひらく', () => {
  const sea = MAPS.sea;
  assert.ok(!isBlocked(sea, 20, 20, () => false), '海の 水の 上は 船で とおれる');
  assert.ok(isBlocked(MAPS.overworld, 30, 125, () => false), 'ミドリナ地方の 海は とおれない');
  assert.ok(onWater(sea, 20.5, 20.5, () => false), '水の 上では 船に なる');
  assert.ok(!onWater(sea, PORT.x + 16.5, PORT.y + 10.5, () => false), '町の 中は 歩き');
  const start = [Math.floor(SEA_POS.arrive.x), Math.floor(SEA_POS.arrive.y)];
  const r0 = bfs(sea, start);
  assert.ok(r0(...P(15, 17)), 'カモメ港へ 行ける');
  assert.ok(near(r0, SEA_POS.caveDoor.x, SEA_POS.caveDoor.y), '海鳴りの洞窟へ 行ける');
  assert.ok(near(r0, SEA_POS.keeper.x, SEA_POS.keeper.y), '灯台守に 会える');
  for (const [x, y] of ISLETS) assert.ok(near(r0, x, y), `小島 ${x},${y}`);
  assert.ok(!r0(SEA_POS.towerDoor.x, SEA_POS.towerDoor.y + 1), '灯台の 前は 嵐で 塔へ 行けない');
  const r1 = bfs(sea, start, ['c2_light']);
  assert.ok(r1(SEA_POS.towerDoor.x, SEA_POS.towerDoor.y + 1), '灯台に 火が ともると 塔へ 行ける');
});

test('第2章: マップの 人・宝箱・かんばん・ワープが ただしい', () => {
  const entry = { sea: [10, 10], sea_cave: [20, 27], tower_1f: [11, 19], tower_2f: [19, 3], tower_3f: [19, 14] };
  const all = ['c2_light', 'c2_boss'];
  for (const [id, start] of Object.entries(entry)) {
    const m = MAPS[id];
    const reach = bfs(m, start, all);
    for (const c of m.chests) {
      assert.ok(!isBlocked(m, c.x, c.y, () => true), `${id} chest ${c.id} on solid`);
      assert.ok(near(reach, c.x, c.y), `${id} chest ${c.id} unreachable`);
      assert.ok(c.gold || ITEMS[c.item], `${id} chest ${c.id} item`);
    }
    for (const n of m.npcs) {
      assert.ok(SCRIPTS[n.script], `${id} npc ${n.id} script ${n.script}`);
      assert.ok(near(reach, Math.floor(n.x), Math.floor(n.y), 2), `${id} npc ${n.id} unreachable`);
    }
    for (const s of m.signs) assert.ok(near(reach, s.x, s.y), `${id} sign`);
    for (const tr of m.triggers) assert.ok(SCRIPTS[tr.script], `${id} trigger ${tr.id}`);
    for (const w of m.warps) assert.ok(near(reach, w.x, w.y), `${id} warp ${w.x},${w.y}`);
  }
  // 出てくる モンスターが ぜんぶ いる
  for (const t of ['sea', 'isle', 'storm', 'seacave', 'tower']) {
    assert.ok(ENCOUNTER_TABLES[t]?.length, t);
    for (const e of ENCOUNTER_TABLES[t]) for (const [sp] of e.group) assert.ok(MONSTERS[sp], `${t}: ${sp}`);
  }
  for (const f of ['giant_squid', 'storm_general']) assert.ok(FIXED_ENCOUNTERS[f], f);
  // 港の 船長・祭壇
  assert.ok(MAPS.overworld.npcById.ship && MAPS.overworld.npcById.captain_pier);
  assert.equal(MAPS.sea.altarScript, 'wind_altar');
});

function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'silver_sword';
  c.equip.armor = 'silver_mail';
  c.equip.shield = 'silver_shield';
  c.hp = 9999;
  c.mp = 9999;
  bot.world.sendSelf(bot.s);
}

test('第2章を はじめから さいごまで とおして あそべる', { timeout: 240000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(2024), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  // 第1章 クリアまで すすめておく
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) c.flags[f] = true;
  c.objective = '第1章クリア！自由に冒険しよう（続きはアップデートで！）';
  boost(bot, 34);

  // ばあちゃん → 第2章
  await bot.walkTo(...V(24, 18));
  await bot.talk('elder');
  assert.ok(bot.flag('c2_start'), '第2章が はじまる');

  // さんばしの 船長 → 船に のる
  await bot.walkTo(28, 122);
  await bot.talk('captain_pier');
  assert.ok(bot.flag('c2_ship'), 'しおかぜ号を かりた');
  await bot.walkTo(28, 123);
  await bot.talk('ship');
  assert.equal(bot.map, 'sea', '海へ 出た');

  // カモメ港
  await bot.walkTo(...P(15, 17));
  await bot.settle();
  assert.ok(bot.flag('c2_port_seen'), '港に ついた');
  assert.ok(c.visited.port, '帰り道の羽で 来られる');
  await bot.walkTo(...P(16, 15));
  await bot.talk('harbor_master');
  assert.ok(bot.flag('c2_port'), '港長の 話');

  // びんの 手紙（小島の 宝箱）→ ミナ
  await bot.walkTo(ISLETS[0][0], ISLETS[0][1], { stopBefore: true });
  await bot.examine(ISLETS[0][0], ISLETS[0][1]);
  assert.ok(bot.char.keyItems.includes('bottle_letter'), 'びんの手紙');
  await bot.walkTo(...P(18, 8));
  await bot.talk('mina');
  assert.ok(bot.flag('q_bottle_done'), 'ミナに 手紙を わたした');
  assert.ok(bot.char.items.some((i) => i.id === 'sea_charm'), '海のお守り');

  // 海鳴りの洞窟 → 大王イカ
  await bot.walkTo(SEA_POS.caveDoor.x, SEA_POS.caveDoor.y);
  assert.equal(bot.map, 'sea_cave');
  await bot.settle();
  await bot.walkTo(19, 6);
  await bot.settle();
  assert.ok(bot.flag('c2_kraken'), '大王イカを たおした');
  assert.ok(bot.char.keyItems.includes('light_orb'), '光の玉');
  assert.ok(bot.battles.some((b) => b.outcome === 'win' && b.story), 'ボス戦に かった');

  // 灯台
  await bot.walkTo(20, 29);
  assert.equal(bot.map, 'sea');
  await bot.walkTo(SEA_POS.keeper.x, SEA_POS.keeper.y, { stopBefore: true });
  await bot.talk('lh_keeper');
  assert.ok(bot.flag('c2_light'), '灯台に 火が ともった');
  assert.ok(!bot.char.keyItems.includes('light_orb'));

  // 嵐の塔
  c.hp = 9999; c.mp = 9999;
  await bot.walkTo(SEA_POS.towerDoor.x, SEA_POS.towerDoor.y);
  assert.equal(bot.map, 'tower_1f');
  await bot.settle();
  assert.ok(bot.flag('c2_tower'));
  await bot.walkTo(19, 2);
  assert.equal(bot.map, 'tower_2f');
  await bot.walkTo(2, 2);
  assert.equal(bot.map, 'tower_3f');
  boost(bot, 60);
  await bot.walkTo(19, 10);
  await bot.settle();
  assert.ok(bot.flag('c2_boss'), '嵐の将軍を たおした');
  assert.ok(bot.char.keyItems.includes('wind_star'), '風の守り星');

  // 帰り道の羽で 港へ → 風のさいだん
  c.items.push({ id: 'return_wing', n: 1 });
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'port' });
  await bot.settle();
  assert.equal(bot.map, 'sea', '港へ 飛んだ');
  const gold = c.gold;
  await bot.walkTo(...P(15, 3));
  await bot.examine(...P(15, 2));
  assert.ok(bot.flag('c2_clear'), '第2章 クリア！');
  assert.ok(c.gold >= gold + 1000, 'お礼の ゴールド');
  assert.ok(!bot.char.keyItems.includes('wind_star'));

  // 村に もどる さんばし
  await bot.walkTo(SEA_POS.homePier.x, 3);
  await bot.walkTo(SEA_POS.homePier.x, 2);
  await bot.settle();
  assert.equal(bot.map, 'overworld', 'ミドリナへ 帰れる');
  assert.equal(Math.floor(bot.y), Math.floor(POS.pierEnd[1]));
});

test('第1章クリアの セーブは 新しい もくひょうに かわる', () => {
  const world = new GameWorld({ offline: true, rng: makeRng(1), rateLimit: false });
  const bot = new Bot(world, 'ミウ');
  bot.send({ t: 'hello', pw: '' });
  bot.send({ t: 'createChar', name: 'ミウ', job: 'mage', look: {} });
  const id = bot.msgs.filter((m) => m.t === 'charCreated').pop().id;
  const c = world.data.characters[id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) c.flags[f] = true;
  c.objective = '第1章クリア！自由に冒険しよう（続きはアップデートで！）';
  bot.send({ t: 'play', id });
  assert.match(world.data.characters[id].objective, /第2章/);
});
