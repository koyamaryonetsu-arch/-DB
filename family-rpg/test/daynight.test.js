// 昼と夜・ルーラ・風の大鳥フウラ（空の旅）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { PLACES, OW_H } from '../public/js/shared/maps/overworld.js';
import { SEA_POS } from '../public/js/shared/maps/sea.js';
import { T } from '../public/js/shared/tiles.js';
import { DAY_MS, dayFrac, phaseOf, isNightFrac, darkness, restShift, clockShiftOf, isNightFor } from '../public/js/shared/world/clock.js';
import { ENCOUNTER_TABLES, ZONE_BG } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { SKY_FLAG, FLUTE_ID, SKY_HINT_OBJECTIVE } from '../public/js/shared/data/sky.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { landingOk, warpPlaces } from '../public/js/shared/world/travel.js';
import { partyState, partyOf } from '../public/js/shared/world/party.js';
import { learnedAbilities, gainJobBattles, changeJob, addItem } from '../public/js/shared/stats.js';
import { jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { condOk } from '../public/js/shared/maps/index.js';
import { subQuests, questMarks } from '../public/js/shared/data/quest-targets.js';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const DAY = 0.3, NIGHT = 0.8;

async function solo(frac = DAY, job = 'mage', name = 'ソラ') {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(21), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.p_opening = true;
  return { world, bot, c, clock };
}

// 歩ける 草原の マスで、となりが 歩けない（水・山）ところ
function edgeOfWalkable(map) {
  for (let y = 60; y < map.h - 2; y++) {
    for (let x = 40; x < map.w - 2; x++) {
      if (map.zoneAt(x, y) !== 'plains' || map.tiles[y * map.w + x] !== T.GRASS) continue;
      const nb = map.tiles[y * map.w + x + 1];
      if ((nb === T.WATER || nb === T.DEEP || nb === T.MOUNTAIN) && isBlocked(map, x + 1, y, () => false)) return { x, y };
    }
  }
  return null;
}
// まわり 5×5 が ぜんぶ 水の マス
function openWater(map) {
  for (let y = 3; y < map.h - 3; y++) {
    for (let x = 3; x < map.w - 3; x++) {
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (map.tiles[(y + dy) * map.w + x + dx] !== T.DEEP) { ok = false; break; }
      if (ok) return { x, y };
    }
  }
  return null;
}
// 町の 外の ひろい 草原
function openGrass(map) {
  for (let y = 60; y < map.h - 4; y++) {
    for (let x = 40; x < map.w - 4; x++) {
      if (map.zoneAt(x, y) !== 'plains') continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) for (let dx = -2; dx <= 2; dx++) if (map.tiles[(y + dy) * map.w + x + dx] !== T.GRASS) { ok = false; break; }
      if (ok) return { x, y };
    }
  }
  return null;
}

test('時計: 1日の うつりかわり（明け方・昼・夕方・夜）と くらさ', () => {
  assert.equal(DAY_MS, 20 * 60 * 1000, '1日は 20分');
  assert.equal(phaseOf(0.02), 'dawn');
  assert.equal(phaseOf(0.3), 'day');
  assert.equal(phaseOf(0.65), 'dusk');
  assert.equal(phaseOf(0.8), 'night');
  assert.equal(phaseOf(0.97), 'dawn');
  assert.ok(!isNightFrac(0.5) && isNightFrac(0.75) && !isNightFrac(0.96));
  assert.equal(darkness(0.3), 0);
  assert.equal(darkness(0.8), 1);
  assert.ok(darkness(0.65) > 0.3 && darkness(0.65) < 0.7, '夕方は だんだん くらく');
  assert.ok(darkness(0.99) > 0 && darkness(0.99) < 1, '明け方は だんだん あかるく');
  // ずれ: 同じ 時こくでも ずれで 時間が かわる
  const now = at(0.3);
  assert.ok(Math.abs(dayFrac(now, 0) - 0.3) < 1e-6);
  const s1 = restShift(now, 0, 'night');
  assert.ok(Math.abs(dayFrac(now, s1) - 0.72) < 1e-6, '夜まで');
  const s2 = restShift(now, s1, 'morning');
  assert.ok(Math.abs(dayFrac(now, s2) - 0.02) < 1e-6, '朝まで（つぎの 日）');
  assert.ok(s2 >= 0 && s2 < DAY_MS);
});

test('時計: サーバーが きめて、パーティーの なかまは リーダーの 時間を 見る', { timeout: 60000 }, async () => {
  const clock = { now: at(DAY) };
  const world = new GameWorld({ offline: false, rng: makeRng(5), checkPassword: () => true, rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  const enter = kid.msgs.find((m) => m.t === 'enter');
  assert.equal(enter.serverTime, clock.now, 'はいった ときに サーバーの 時こくを おくる');
  // パパの パーティーは 夜（宿屋で 夜まで 休んだ）、ユイは 昼
  papa.s.char.timeShift = restShift(clock.now, 0, 'night');
  assert.ok(isNightFor(world, papa.s) && !isNightFor(world, kid.s), 'べつべつの パーティーは べつべつの 時計');
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(clockShiftOf(world, kid.s), papa.s.char.timeShift, 'なかまは リーダーの 時計');
  assert.ok(isNightFor(world, kid.s));
  assert.equal(kid.party.clockShift, papa.s.char.timeShift, 'パーティーの じょうほうで おくる');
  assert.equal(partyState(world, partyOf(world, kid.s)).clockShift, papa.s.char.timeShift);
  // ユイ 自分の 時計は そのまま（パーティーを ぬけると もどる）
  assert.ok(!kid.s.char.timeShift);
  kid.send({ t: 'party', action: 'leave' });
  assert.ok(!isNightFor(world, kid.s));
  // 同じ マップでも、夜の 人・昼の 人で 見える まものが ちがう（まものの じょうほうも 人ごと）
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 2.5, g.y + 0.5, 'down', true);
  await tickN(world, 100, 100);
  const ms = mapState(world, 'overworld');
  const tods = (b) => b.msgs.filter((m) => m.t === 'snap').pop().syms.map((x) => ms.symbols.get(x.id)?.tod).filter(Boolean);
  assert.ok(tods(papa).length && tods(papa).every((t) => t === 'night'), 'パパには 夜の まもの');
  assert.ok(tods(kid).length && tods(kid).every((t) => t === 'day'), 'ユイには 昼の まもの');
});

test('夜: フィールドの まものが 夜の 出現表に かわる（昼の まものは 見えない）', { timeout: 60000 }, async () => {
  for (const [zone, table] of Object.entries(NIGHT_ZONES)) {
    assert.ok(ENCOUNTER_TABLES[zone], zone);
    assert.ok(ENCOUNTER_TABLES[table]?.length, table);
    assert.ok(ZONE_BG[table]?.endsWith('_night'), `${table} の はいけい`);
    for (const e of ENCOUNTER_TABLES[table]) for (const [sp] of e.group) assert.ok(MONSTERS[sp], `${table}: ${sp}`);
  }
  const nightOnly = Object.keys(MONSTERS).filter((sp) => MONSTERS[sp].night);
  assert.ok(nightOnly.length >= 4, '夜だけの 魔物');
  for (const sp of nightOnly) {
    const m = MONSTERS[sp];
    assert.ok(m.exp > 0 && m.gold > 0 && m.desc, sp);
  }
  // 夜の 魔物は 同じ 地方の 昼の 魔物より 経験値が 多い
  assert.ok(MONSTERS.moon_pururin.exp > MONSTERS.pururin.exp * 2 && MONSTERS.dark_wolf.exp > MONSTERS.wolf.exp * 2);

  const { world, bot, clock } = await solo(NIGHT);
  const g = openGrass(MAPS.overworld);
  world.placeSession(bot.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  await tickN(world, 120, 100);
  const ms = mapState(world, 'overworld');
  const all = [...ms.symbols.values()];
  const split = all.filter((s) => NIGHT_ZONES[s.zone]);
  assert.ok(split.length > 20, `夜の まもの ${split.length}`);
  assert.ok(split.every((s) => s.tod === 'night' && s.table.endsWith('_night')), '夜の 出現表');
  assert.ok(split.some((s) => MONSTERS[s.sp].night), '夜だけの 魔物も うろうろ');
  // 見える まものだけ おくる
  const snap = bot.msgs.filter((m) => m.t === 'snap').pop();
  assert.ok(snap.syms.every((x) => ms.symbols.get(x.id)?.tod !== 'day'));
  // 朝に なると 夜の まものは いなくなり、昼の まものが 出る
  clock.now = at(DAY);
  await tickN(world, 160, 100);
  const after = [...ms.symbols.values()].filter((s) => NIGHT_ZONES[s.zone]);
  assert.ok(after.filter((s) => s.tod === 'night').length < split.length / 2, '夜の まものが へる');
  assert.ok(after.some((s) => s.tod === 'day'), '昼の まものが 出る');
  // 昼の 人は 夜の まものに ふれても たたかいに ならない
  const nightSym = after.find((s) => s.tod === 'night') || [...ms.symbols.values()].find((s) => s.tod === 'night');
  if (nightSym) {
    bot.s.x = nightSym.x;
    bot.s.y = nightSym.y;
    bot.s.invuln = 0;
    bot.send({ t: 'touch', id: nightSym.id });
    assert.ok(!bot.s.busy, '見えない まものとは たたかわない');
  }
  // どうくつの 中は 昼も 夜も おなじ
  const cave = mapState(world, 'cave_b1');
  clock.now = at(NIGHT);
  world.placeSession(bot.s, 'cave_b1', 24, 30.6, 'up', true);
  await tickN(world, 40, 100);
  assert.ok([...cave.symbols.values()].every((s) => !s.tod), 'どうくつは かわらない');
});

test('夜: 町の 人が かわる（夜の 商人・夜の 門番・ゆうれい）。物語の 人は 夜も いる', { timeout: 60000 }, async () => {
  const { world, bot, c, clock } = await solo(DAY);
  const ow = MAPS.overworld;
  const has = (f) => world.hasFlagFn(bot.s)(f);
  const visible = (id) => condOk(ow.npcById[id].show, has);
  assert.ok(visible('t_kid') && visible('t_guard1') && !visible('night_merchant') && !visible('night_ghost'));
  clock.now = at(NIGHT);
  assert.ok(!visible('t_kid') && !visible('t_guard1'), '子どもは 家に 帰る');
  assert.ok(visible('n_guard1') && visible('night_merchant') && visible('night_ghost'), '夜の 人');
  for (const id of ['mayor', 'elder', 'priestess', 'innkeeper', 'bartender', 'mike_girl', 'weapon_keeper']) assert.ok(visible(id), `${id} は 夜も いる`);
  assert.ok(condOk(MAPS.sea.npcById.harbor_master.show, has) && condOk(MAPS.sea.npcById.n_sailor.show, has));
  // 夜の 商人の 店（夜だけ 話せる）
  const m = ow.npcById.night_merchant;
  world.placeSession(bot.s, 'overworld', m.x + 1.5, m.y + 0.5, 'left', true);
  bot.send({ t: 'interact', kind: 'npc', id: 'night_merchant' });
  await new Promise((r) => setImmediate(r));
  const ui = bot.msgs.filter((x) => x.t === 'script').flatMap((x) => x.steps).find((st) => st[0] === 'ui');
  assert.ok(ui && ui[2].shop === 'night_shop', '夜の 店が ひらく');
  assert.ok(ui[2].items.includes('moon_drop'));
  for (const id of SHOPS.night_shop.items) assert.ok(ITEMS[id].price > 0);
  await bot.settle();
  clock.now = at(DAY);
  const n0 = bot.msgs.length;
  bot.send({ t: 'interact', kind: 'npc', id: 'night_merchant' });
  await new Promise((r) => setImmediate(r));
  assert.ok(!bot.msgs.slice(n0).some((x) => x.t === 'script'), '昼は いない');

  // ゆうれいの 女の子の たのみ（夜だけ）
  clock.now = at(NIGHT);
  const gh = ow.npcById.night_ghost;
  world.placeSession(bot.s, 'overworld', gh.x + 0.5, gh.y - 0.5, 'down', true);
  bot.choice = 0;
  await bot.talk('night_ghost');
  assert.ok(c.flags.q_ghost_start, 'たのまれた');
  const gl = ow.npcById.night_glint;
  assert.ok(condOk(gl.show, has));
  world.placeSession(bot.s, 'overworld', gl.x + 0.5, gl.y - 0.5, 'down', true);
  await bot.talk('night_glint');
  assert.ok(c.keyItems.includes('music_box') && c.flags.q_ghost_found, 'オルゴールを 見つけた');
  world.placeSession(bot.s, 'overworld', gh.x + 0.5, gh.y - 0.5, 'down', true);
  const gold = c.gold;
  await bot.talk('night_ghost');
  assert.ok(c.flags.q_ghost_done && !c.keyItems.includes('music_box'));
  assert.ok(c.items.some((e) => e.id === 'moon_pendant') && c.gold === gold + 300, 'お礼');
  assert.ok(!condOk(gh.show, has), 'ゆうれいは 空へ 帰った');
});

test('宿屋: 昼は「朝まで」「夜まで休む」を えらべて、時間が すすむ。夜は 朝まで', { timeout: 60000 }, async () => {
  const { world, bot, c, clock } = await solo(DAY);
  c.gold = 200;
  const inn = MAPS.overworld.npcById.innkeeper;
  world.placeSession(bot.s, 'overworld', inn.x + 0.5, inn.y + 2.5, 'up', true);
  // 昼: 夜まで 休む
  bot.choice = 2;
  const n0 = bot.msgs.length;
  await bot.talk('innkeeper');
  const choice = bot.msgs.slice(n0).filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'choice');
  assert.deepEqual(choice[2], ['はい（朝まで）', 'いいえ', '夜まで休む']);
  assert.equal(c.gold, 188);
  assert.ok(Math.abs(dayFrac(clock.now, c.timeShift) - 0.72) < 1e-6, '夜に なった');
  assert.ok(isNightFor(world, bot.s));
  const steps = bot.msgs.slice(n0).filter((m) => m.t === 'script').flatMap((m) => m.steps);
  assert.ok(steps.some((st) => st[0] === 'clock' && st[1] === c.timeShift), 'くらく なっている あいだに 時間を かえる');
  assert.ok(steps.some((st) => st[0] === 'say' && /こんばんは/.test(st[2])));
  assert.equal(bot.party.clockShift, c.timeShift, 'パーティーの 時計も かわる');
  // 夜: はい（朝まで）/ いいえ だけ
  const n1 = bot.msgs.length;
  bot.choice = 0;
  await bot.talk('innkeeper');
  const ch2 = bot.msgs.slice(n1).filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'choice');
  assert.deepEqual(ch2[2], ['はい', 'いいえ']);
  assert.ok(Math.abs(dayFrac(clock.now, c.timeShift) - 0.02) < 1e-6, '朝に なった');
  assert.ok(!isNightFor(world, bot.s));
  // 家の ベッドは 時間を かえない
  const shift = c.timeShift;
  const steps0 = SCRIPTS.home_bed({});
  assert.deepEqual(steps0[0][3][0], [['inn', 0]]);
  assert.equal(c.timeShift, shift);
});

test('宿屋: さそわれて 手伝っている 人は リーダーの 時計を かえない', { timeout: 60000 }, async () => {
  const clock = { now: at(DAY) };
  const world = new GameWorld({ offline: false, rng: makeRng(7), checkPassword: () => true, rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const inn = MAPS.overworld.npcById.innkeeper;
  world.placeSession(kid.s, 'overworld', inn.x + 0.5, inn.y + 2.5, 'up', true);
  kid.s.char.gold = 100;
  kid.choice = 0;
  const n0 = kid.msgs.length;
  await kid.talk('innkeeper');
  const choice = kid.msgs.slice(n0).filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'choice');
  assert.deepEqual(choice[2], ['はい', 'いいえ'], '夜まで 休むは 出ない');
  assert.equal(kid.s.char.gold, 88, 'とまれる');
  assert.ok(!papa.s.char.timeShift && !kid.s.char.timeShift, '時計は かわらない');
});

test('ルーラ: 魔法使い・賢者が 覚え、行った 町へ 仲間と 飛ぶ。洞窟の 中では 天井に ぶつかる', { timeout: 60000 }, async () => {
  assert.ok(ABILITIES.rura.field && ABILITIES.rura.fieldOnly && ABILITIES.rura.mp <= 2);
  const { world, bot, c } = await solo(DAY, 'mage');
  assert.ok(!learnedAbilities(c).includes('rura'), 'はじめは まだ');
  gainJobBattles(c, jobBattlesForLevel(2));
  assert.ok(learnedAbilities(c).includes('rura'), '魔法使いレベル2で 覚える');
  // 賢者は はじめから
  const { c: c2 } = await solo(DAY, 'priest', 'ミナ');
  for (const j of ['priest', 'mage']) { c2.jobs[j] = { lv: 10, b: 999 }; }
  assert.equal(changeJob(c2, 'sage').ok, true);
  c2.jobs.mage = { lv: 1, b: 0 };
  assert.ok(learnedAbilities(c2).includes('rura'), '賢者レベル1で 覚える');

  c.mp = 30;
  c.visited = { village: true, town: true };
  assert.deepEqual(warpPlaces(c).sort(), ['town', 'village']);
  const g = openGrass(MAPS.overworld);
  world.placeSession(bot.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  // 行った ことの ない 所へは 行けない
  bot.send({ t: 'menu', action: 'cast', id: 'rura', place: 'port' });
  assert.equal(bot.msgs.filter((m) => m.t === 'menuRes').pop().ok, false);
  assert.equal(c.mp, 30);
  bot.send({ t: 'menu', action: 'cast', id: 'rura', place: 'town' });
  const r = bot.msgs.filter((m) => m.t === 'menuRes').pop();
  assert.ok(r.ok, r.text);
  assert.match(r.text, /ルミナの町へ飛んでいく/);
  assert.ok(c.mp < 30, 'MPを 使う');
  const T0 = PLACES.town;
  assert.ok(bot.s.map === 'overworld' && Math.abs(bot.s.y - (T0.y + 37)) < 1 && Math.abs(bot.s.x - (T0.x + 24)) < 1, '町の 前へ');
  // 港に 行ったら 港へも
  c.visited.port = true;
  bot.send({ t: 'menu', action: 'cast', id: 'rura', place: 'port' });
  assert.equal(bot.s.map, 'sea');
  // 洞窟の 中
  world.placeSession(bot.s, 'cave_b1', 24, 30.6, 'up', true);
  const mp = c.mp;
  bot.send({ t: 'menu', action: 'cast', id: 'rura', place: 'town' });
  const r2 = bot.msgs.filter((m) => m.t === 'menuRes').pop();
  assert.equal(r2.ok, false);
  assert.match(r2.text, /天井に頭をぶつけた/);
  assert.equal(c.mp, mp, 'MPは へらない');
  assert.equal(bot.s.map, 'cave_b1');
});

test('ルーラ・帰り道の羽: 「ついていく」なかまも いっしょに 飛ぶ', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(9), checkPassword: () => true, rateLimit: false, now: () => at(DAY) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('mage');
  await kid.createAndPlay('warrior');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const c = papa.s.char;
  gainJobBattles(c, jobBattlesForLevel(2));
  c.mp = 20;
  c.visited.town = true;
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 1.5, 'down', true);
  kid.send({ t: 'move', x: g.x + 0.5, y: g.y + 1.6, dir: 'up', moving: false, seq: kid.seq, follow: true });
  papa.send({ t: 'menu', action: 'cast', id: 'rura', place: 'town' });
  assert.ok(Math.hypot(kid.s.x - papa.s.x, kid.s.y - papa.s.y) < 3, 'ユイも ついてきた');
  // 帰り道の羽も
  addItem(c, 'return_wing', 1);
  papa.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'village' });
  assert.ok(Math.abs(papa.s.y - (PLACES.village.y - 1.5)) < 1);
  assert.ok(Math.hypot(kid.s.x - papa.s.x, kid.s.y - papa.s.y) < 3);
});

test('大鳥: 第2章クリアの あと 風のさいだんで 笛を もらうまでは 呼べない', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo(DAY, 'warrior');
  const g = openGrass(MAPS.overworld);
  world.placeSession(bot.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying, '笛が ない');
  // 第2章の とちゅう: さいだんでは まだ 笛は もらえない
  for (const f of ['c1_clear', 'c2_start', 'c2_ship', 'c2_port', 'c2_kraken', 'c2_light', 'c2_tower', 'c2_boss']) c.flags[f] = true;
  c.keyItems.push('wind_star');
  const star = MAPS.sea.npcById.wind_star;
  world.placeSession(bot.s, 'sea', star.x, star.y + 2.5, 'up', true);
  bot.send({ t: 'interact', kind: 'tile', x: Math.floor(star.x), y: Math.floor(star.y) });
  await bot.settle();
  assert.ok(c.flags.c2_clear, '第2章クリア');
  assert.ok(!c.keyItems.includes(FLUTE_ID), 'まだ 笛は ない');
  assert.equal(c.objective, SKY_HINT_OBJECTIVE, 'もう一度 話しかけよう');
  // もう一度 話しかける → 笛
  await bot.talk('wind_star');
  assert.ok(c.keyItems.includes(FLUTE_ID) && c.flags[SKY_FLAG], '風の笛を もらった');
  assert.ok(ITEMS[FLUTE_ID].type === 'key');
  // 町（港）の 中では 呼べない
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying);
  assert.match(bot.msgs.filter((m) => m.t === 'toast').pop().text, /町の中/);
  // 洞窟の 中でも 呼べない
  world.placeSession(bot.s, 'cave_b1', 24, 30.6, 'up', true);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying);
  // フィールドの 町の 外なら 呼べる
  world.placeSession(bot.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, 'とんだ');
  assert.ok(bot.msgs.some((m) => m.t === 'fly' && m.on && m.anim === 'call'));
  assert.equal(c.riding, 'bird', 'セーブにも のこる');
});

test('大鳥: むかしの セーブ（第2章クリアずみ）は 目標で 笛を 知らせる', async () => {
  const world = new GameWorld({
    offline: true, rng: makeRng(3), rateLimit: false, now: () => at(DAY),
    data: { version: 4, characters: { c1: { id: 'c1', name: 'ソラ', job: 'warrior', level: 20, exp: 0, gold: 0, hp: 50, mp: 5, flags: { p_opening: true, c2_clear: true, c1_clear: true, c2_start: true }, objective: '第2章クリア！自由に冒険しよう（続きはアップデートで！）', items: [], keyItems: [], equip: {}, jobs: { warrior: { lv: 1, b: 0 } } } } },
  });
  const bot = new Bot(world, 'x');
  await bot.login();
  bot.send({ t: 'play', id: 'c1' });
  assert.equal(world.data.characters.c1.objective, SKY_HINT_OBJECTIVE);
});

async function flyer(frac = DAY) {
  const r = await solo(frac, 'warrior');
  const { c } = r;
  c.flags.c2_clear = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  return r;
}

test('大鳥: とべるのは とんでいる ときだけ。空では 出入り口・まもの・人に さわらない', { timeout: 60000 }, async () => {
  const { world, bot } = await flyer();
  const ow = MAPS.overworld;
  const e = edgeOfWalkable(ow);
  assert.ok(e, '水ぎわ');
  world.placeSession(bot.s, 'overworld', e.x + 0.5, e.y + 0.5, 'right', true);
  // 歩いて 水の 上へは 行けない（サーバーが もどす）
  const n0 = bot.msgs.length;
  bot.send({ t: 'move', x: e.x + 1.5, y: e.y + 0.5, dir: 'right', moving: true, seq: bot.seq });
  assert.equal(Math.floor(bot.s.x), e.x, 'みとめない');
  assert.ok(bot.msgs.slice(n0).some((m) => m.t === 'setPos'), 'もとの 場所へ');
  // とんでいれば 行ける
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying);
  bot.send({ t: 'move', x: e.x + 1.5, y: e.y + 0.5, dir: 'right', moving: true, seq: bot.seq });
  assert.equal(Math.floor(bot.s.x), e.x + 1, 'とんで 行ける');
  // とおくへの ワープは みとめない
  bot.send({ t: 'move', x: e.x + 20, y: e.y + 0.5, dir: 'right', moving: true, seq: bot.seq });
  assert.equal(Math.floor(bot.s.x), e.x + 1);
  // 洞窟の 入り口の 上を とんでも 入らない
  const ce = ow.warps[0];
  world.placeSession(bot.s, 'overworld', ce.x + 0.5, ce.y + 1.5, 'up', true, { fly: true });
  bot.send({ t: 'move', x: ce.x + 0.5, y: ce.y + 0.5, dir: 'up', moving: true, seq: bot.seq });
  assert.equal(bot.s.map, 'overworld', '洞窟には 入らない');
  // 町の イベントも おきない・人とも 話せない
  bot.send({ t: 'interact', kind: 'npc', id: 'bridge_worker' });
  assert.ok(!bot.s.busy);
  // まものに ふれても たたかいに ならない
  const ms = mapState(world, 'overworld');
  const sym = { id: 'symT', sp: 'pururin', group: ['pururin'], table: 'outskirts', zone: 'outskirts', x: bot.s.x, y: bot.s.y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.s.invuln = 0;
  bot.send({ t: 'touch', id: sym.id });
  assert.ok(!bot.s.busy, 'たたかわない');
  // セーブして つづきから: 空から はじまる
  bot.send({ t: 'quit' });
  const c = world.data.characters[bot.char.id];
  assert.equal(c.riding, 'bird');
  bot.send({ t: 'play', id: c.id });
  assert.ok(bot.s.flying, '空から つづく');
  assert.ok(bot.msgs.filter((m) => m.t === 'enter').pop().fly);
});

test('大鳥: おりられるのは 歩ける 地面だけ（水の上・建物の中は だめ。ちかくなら よせる）', { timeout: 60000 }, async () => {
  const { world, bot } = await flyer();
  const ow = MAPS.overworld;
  const g = openGrass(ow);
  world.placeSession(bot.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  bot.send({ t: 'fly', action: 'call' });
  // 水の 上
  const w = openWater(ow);
  assert.ok(w, 'ひろい 水');
  world.placeSession(bot.s, 'overworld', w.x + 0.5, w.y + 0.5, 'down', true, { fly: true });
  bot.send({ t: 'fly', action: 'land' });
  assert.ok(bot.s.flying, '水の 上には おりられない');
  assert.match(bot.msgs.filter((m) => m.t === 'toast').pop().text, /降りられない/);
  // 建物の 中（やねの 下）
  const roof = ow.roofs[0];
  assert.equal(landingOk(world, bot.s, ow, roof.x + 3.5, roof.y + 2.5), false, '建物の 中');
  // 洞窟の 入り口の 上
  const ce = ow.warps[0];
  assert.equal(landingOk(world, bot.s, ow, ce.x + 0.5, ce.y + 0.5), false, '出入り口');
  // 草原
  assert.equal(landingOk(world, bot.s, ow, g.x + 0.5, g.y + 0.5), true);
  // 水ぎわ（すこし 水に はみでている）→ となりの 地面に よせて おりる
  const e = edgeOfWalkable(ow);
  world.placeSession(bot.s, 'overworld', e.x + 1.4, e.y + 0.5, 'right', true, { fly: true });
  bot.send({ t: 'fly', action: 'land' });
  assert.ok(!bot.s.flying, 'おりた');
  assert.ok(!isBlocked(ow, Math.floor(bot.s.x), Math.floor(bot.s.y), () => false), '歩ける 地面');
  assert.ok(bot.msgs.some((m) => m.t === 'fly' && !m.on && m.anim === 'land'));
  assert.equal(bot.s.char.riding, undefined);
});

test('大鳥: ミドリナ地方の 南の はし ⇄ 風の海の 北の はしで、となりの 地方へ 飛べる。なかまも いっしょ', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(13), checkPassword: () => true, rateLimit: false, now: () => at(DAY) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  const c = papa.s.char;
  c.flags.c2_clear = true;
  c.keyItems.push(FLUTE_ID);
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 1.5, 'up', true);
  kid.send({ t: 'move', x: g.x + 0.5, y: g.y + 1.55, dir: 'up', moving: false, seq: kid.seq, follow: true });
  papa.send({ t: 'fly', action: 'call' });
  assert.ok(papa.s.flying && kid.s.flying, 'ついていく なかまも のる');
  assert.ok(kid.msgs.some((m) => m.t === 'fly' && m.on && m.ride));
  // はしで ない ところでは はしを こえられない
  papa.send({ t: 'fly', action: 'region', edge: true });
  assert.equal(papa.s.map, 'overworld');
  // 南の はしへ
  world.placeSession(papa.s, 'overworld', 60.5, OW_H - 1, 'down', true, { fly: true });
  world.placeSession(kid.s, 'overworld', 60.5, OW_H - 1.8, 'down', true, { fly: true });
  papa.send({ t: 'fly', action: 'region', edge: true });
  assert.equal(papa.s.map, 'sea', '風の海へ');
  assert.ok(papa.s.y < 2 && papa.s.flying, '北の はしの 空');
  assert.equal(kid.s.map, 'sea', 'なかまも');
  assert.ok(kid.s.flying);
  assert.ok(papa.msgs.filter((m) => m.t === 'setPos').pop().fly, 'とんだまま');
  // 「別の地方へ飛ぶ」（どこからでも。さんばしの 上の 空へ）
  world.placeSession(papa.s, 'sea', 50.5, 40.5, 'down', true, { fly: true });
  papa.send({ t: 'fly', action: 'region' });
  assert.equal(papa.s.map, 'overworld');
  assert.ok(Math.abs(papa.s.x - 28) < 1 && papa.s.y > OW_H - 6);
  // おりると なかまも そばに おりる
  world.placeSession(kid.s, 'overworld', papa.s.x, papa.s.y + 1, 'up', true, { fly: true });
  const g2 = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g2.x + 0.5, g2.y + 0.5, 'down', true, { fly: true });
  world.placeSession(kid.s, 'overworld', g2.x + 0.5, g2.y + 1.2, 'down', true, { fly: true });
  papa.send({ t: 'fly', action: 'land' });
  assert.ok(!papa.s.flying && !kid.s.flying, 'みんな おりた');
  assert.ok(Math.hypot(kid.s.x - papa.s.x, kid.s.y - papa.s.y) < 2.5);
  // とんでいない ときは となりの 地方へ 飛べない
  papa.send({ t: 'fly', action: 'region' });
  assert.equal(papa.s.map, 'overworld');
});

test('夜明けのすず・夕焼けのすず: リーダーが 鳴らすと 時間が かわる', { timeout: 60000 }, async () => {
  const { world, bot, c, clock } = await solo(DAY);
  addItem(c, 'dusk_bell', 1);
  addItem(c, 'dawn_bell', 1);
  bot.send({ t: 'menu', action: 'useItem', id: 'dusk_bell', ref: 'self' });
  assert.ok(isNightFor(world, bot.s), '夜に なった');
  assert.ok(bot.msgs.some((m) => m.t === 'clock' && m.shift === c.timeShift));
  bot.send({ t: 'menu', action: 'useItem', id: 'dawn_bell', ref: 'self' });
  assert.ok(!isNightFor(world, bot.s));
  assert.ok(Math.abs(dayFrac(clock.now, c.timeShift) - 0.02) < 1e-6);
  assert.ok(!c.items.some((e) => e.id === 'dawn_bell' || e.id === 'dusk_bell'), '使うと なくなる');
});

test('大鳥: 空を とんでいる なかまは 地上の たたかいに まきこまれない', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(17), checkPassword: () => true, rateLimit: false, now: () => at(DAY) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  kid.s.char.flags.c2_clear = true;
  kid.s.char.keyItems.push(FLUTE_ID);
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 2.5, g.y + 0.5, 'down', true);
  kid.send({ t: 'fly', action: 'call' });
  assert.ok(kid.s.flying, '自分の 笛で とぶ');
  const ms = mapState(world, 'overworld');
  const sym = { id: 'symB', sp: 'pururin', group: ['pururin'], table: 'plains', zone: 'plains', tod: 'day', x: papa.s.x, y: papa.s.y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  papa.s.invuln = 0;
  papa.send({ t: 'touch', id: sym.id });
  assert.ok(papa.inBattle, 'パパは たたかう');
  assert.ok(!kid.inBattle && kid.s.busy !== 'battle', '空の ユイは まきこまれない');
  kid.s.x = papa.s.x + 1;
  kid.send({ t: 'joinBattle', sid: papa.s.id });
  assert.ok(!kid.inBattle, '空からは さんか できない');
  await papa.settle(6000);
});

test('夜の たのまれごと・笛の 目標は 地図の しるしに 出る', () => {
  const q = subQuests({ flags: { q_ghost_start: 1 }, keyItems: [], items: [] });
  assert.equal(q[0].who, 'night_ghost');
  assert.equal(q[0].find, 'night_glint', 'さがす 場所');
  const r = subQuests({ flags: { q_ghost_start: 1 }, keyItems: ['music_box'], items: [] });
  assert.ok(r[0].ready, 'オルゴールを 見つけたら 報告');
  assert.equal(subQuests({ flags: { q_ghost_start: 1, q_ghost_done: 1 }, keyItems: [], items: [] }).length, 0);
  const marks = questMarks({ flags: { c2_clear: 1 } }, 'sea', SKY_HINT_OBJECTIVE);
  assert.ok(marks.some((m) => m.kind === 'main'), '風のさいだんに しるし');
});
