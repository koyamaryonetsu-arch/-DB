// パーティーの 旅: 帰り道の羽・ルーラの 行き先は リーダーと おなじ／リーダーが 大鳥に 乗ると、なかまは「いっしょに 乗る？」を えらぶ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { T } from '../public/js/shared/tiles.js';
import { FLUTE_ID, RIDE_ASK_MS } from '../public/js/shared/data/sky.js';
import { warpOwner, warpPlaces } from '../public/js/shared/world/travel.js';
import { partyState, partyOf } from '../public/js/shared/world/party.js';
import { addItem, gainJobBattles } from '../public/js/shared/stats.js';
import { jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { Bot } from './helpers.js';

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

async function family(clock, ...names) {
  const world = new GameWorld({ offline: false, rng: makeRng(17), checkPassword: () => true, rateLimit: false, now: () => clock.now });
  const bots = [];
  for (const [name, job] of names) {
    const b = new Bot(world, name);
    await b.login('x');
    await b.createAndPlay(job);
    await b.settle();
    bots.push(b);
  }
  return { world, bots };
}
const last = (bot, t) => bot.msgs.filter((m) => m.t === t).pop();

test('帰り道の羽・ルーラ: パーティーでは リーダーが 行った ことの ある 場所へ 行ける（自分の きろくは かわらない）', { timeout: 60000 }, async () => {
  const clock = { now: 1e12 };
  const { world, bots: [papa, kid] } = await family(clock, ['パパ', 'warrior'], ['ユイ', 'mage']);
  const pc = papa.s.char, kc = kid.s.char;
  pc.visited = { village: true, town: true };
  kc.visited = { village: true, port: true };
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(world.hostOf(kid.s), papa.s);
  // 行き先は リーダーの もの
  assert.equal(warpOwner(world, kid.s), pc);
  assert.deepEqual(warpPlaces(warpOwner(world, kid.s)).sort(), ['town', 'village']);
  assert.equal(warpOwner(world, papa.s), pc, 'リーダーは 自分の きろく');
  const st = partyState(world, partyOf(world, kid.s));
  assert.deepEqual(st.worldVisited.sort(), ['town', 'village'], 'クライアントにも リーダーの 行き先を おくる');

  const g = openGrass(MAPS.overworld);
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  addItem(kc, 'return_wing', 3);
  // 自分だけ 行った 港へは 行けない（リーダーの 世界に いる から）
  kid.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'port' });
  assert.equal(last(kid, 'menuRes').ok, false);
  assert.equal(kid.s.map, 'overworld');
  // 自分は 行って いないが、リーダーが 行った 町へは 行ける
  kid.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'town' });
  assert.equal(last(kid, 'menuRes').ok, true, last(kid, 'menuRes').text);
  assert.ok(Math.abs(kid.s.y - (PLACES.town.y + 37)) < 1, 'ルミナの町の 前へ');
  assert.ok(!kc.visited.town, '自分の きろくは かわらない');
  // ルーラも おなじ
  gainJobBattles(kc, jobBattlesForLevel(2));
  kc.mp = 30;
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  kid.send({ t: 'menu', action: 'cast', id: 'rura', place: 'port', who: 'self' });
  assert.equal(last(kid, 'menuRes').ok, false, '港へは 飛べない');
  kid.send({ t: 'menu', action: 'cast', id: 'rura', place: 'town', who: 'self' });
  assert.equal(last(kid, 'menuRes').ok, true, last(kid, 'menuRes').text);
  // リーダーが 新しい 場所に 来ると、なかまの 行き先も ふえる
  const n = kid.msgs.filter((m) => m.t === 'party').length;
  world.placeSession(papa.s, 'overworld', PLACES.town.x + 24, PLACES.town.y + 37, 'up', true);
  delete pc.visited.town;
  world.onEnterTile(papa.s, PLACES.town.x + 2, PLACES.town.y + 2);
  assert.ok(pc.visited.town);
  assert.ok(kid.msgs.filter((m) => m.t === 'party').length > n, 'なかまへ おしらせ');
  assert.ok(last(kid, 'party').party.worldVisited.includes('town'));
  // パーティーを ぬけたら 自分の きろくに もどる
  kid.send({ t: 'party', action: 'leave' });
  assert.equal(world.hostOf(kid.s), null);
  assert.equal(warpOwner(world, kid.s), kc);
});

test('大鳥: リーダーが 乗ると、なかまは「いっしょに 乗る／乗らない」を えらぶ。乗った なかまは いっしょに 飛んで、いっしょに おりる', { timeout: 60000 }, async () => {
  const clock = { now: 1e12 };
  const { world, bots: [papa, kid, mama] } = await family(clock, ['パパ', 'warrior'], ['ユイ', 'mage'], ['ママ', 'priest']);
  const pc = papa.s.char;
  pc.flags.c2_clear = true;
  pc.keyItems.push(FLUTE_ID);
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  papa.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  assert.equal(partyOf(world, papa.s).members.length, 3);
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  // ユイは ちょっと はなれた ところ（ついていく に して いない）、ママは 「ついていく」
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 2.5, 'up', true);
  world.placeSession(mama.s, 'overworld', g.x + 1.5, g.y + 0.5, 'left', true);
  mama.send({ t: 'move', x: g.x + 1.5, y: g.y + 0.55, dir: 'left', moving: false, seq: mama.s.posSeq, follow: true });
  assert.ok(mama.s.follow);

  papa.send({ t: 'fly', action: 'call' });
  assert.ok(papa.s.flying, 'リーダーは 乗った');
  assert.ok(!kid.s.flying && !mama.s.flying, 'なかまは まだ（きかれるだけ）');
  const ak = last(kid, 'flyAsk'), am = last(mama, 'flyAsk');
  assert.ok(ak && am, 'みんなに きく');
  assert.equal(ak.name, 'パパ');
  assert.equal(ak.mount, 'フウラ');
  assert.ok(!last(papa, 'flyAsk'), 'リーダーには きかない');
  // ほかの 人の こたえ・ちがう id は うけつけない
  kid.send({ t: 'fly', action: 'ride', id: 'bad', yes: true });
  assert.ok(!kid.s.flying);
  // ユイは 乗る → リーダーの そばの 空へ。「ついていく」に なる
  kid.send({ t: 'fly', action: 'ride', id: ak.id, yes: true });
  assert.ok(kid.s.flying, 'ユイも 乗った');
  assert.ok(kid.s.follow);
  assert.ok(Math.hypot(kid.s.x - papa.s.x, kid.s.y - papa.s.y) < 2, 'リーダーの そば');
  assert.ok(kid.msgs.some((m) => m.t === 'fly' && m.on && m.ride));
  assert.ok(papa.msgs.some((m) => m.t === 'toast' && /ユイもフウラに乗った/.test(m.text)));
  // 2かい めは むこう
  kid.send({ t: 'fly', action: 'ride', id: ak.id, yes: true });
  // ママは 乗らない → 地上に のこる。「ついていく」も やめる
  mama.send({ t: 'fly', action: 'ride', id: am.id, yes: false });
  assert.ok(!mama.s.flying);
  assert.ok(!mama.s.follow, '空の リーダーを 追いかけない');
  assert.ok(papa.msgs.some((m) => m.t === 'toast' && /ママは乗らずに/.test(m.text)));

  // いっしょに 空を いどう → いっしょに おりる
  const g2 = { x: g.x + 1, y: g.y - 1 };
  world.placeSession(papa.s, 'overworld', g2.x + 0.5, g2.y + 0.5, 'down', true, { fly: true });
  world.placeSession(kid.s, 'overworld', g2.x + 0.5, g2.y + 1.1, 'down', true, { fly: true });
  papa.send({ t: 'fly', action: 'land' });
  assert.ok(!papa.s.flying && !kid.s.flying, 'いっしょに おりた');
  assert.ok(Math.hypot(kid.s.x - papa.s.x, kid.s.y - papa.s.y) < 2.5);
  assert.ok(!mama.s.flying);
});

test('大鳥: こたえる 前に リーダーが おりたら、きいた ことは とりけし（あとで 乗ると 答えても 乗らない）', { timeout: 60000 }, async () => {
  const clock = { now: 1e12 };
  const { world, bots: [papa, kid] } = await family(clock, ['パパ', 'warrior'], ['ユイ', 'mage']);
  const pc = papa.s.char;
  pc.flags.c2_clear = true;
  pc.keyItems.push(FLUTE_ID);
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const g = openGrass(MAPS.overworld);
  world.placeSession(papa.s, 'overworld', g.x + 0.5, g.y + 0.5, 'down', true);
  world.placeSession(kid.s, 'overworld', g.x + 0.5, g.y + 2.5, 'up', true);
  papa.send({ t: 'fly', action: 'call' });
  const ak = last(kid, 'flyAsk');
  papa.send({ t: 'fly', action: 'land' });
  assert.ok(!papa.s.flying);
  assert.equal(last(kid, 'flyAskEnd')?.id, ak.id, 'まどを とじる おしらせ');
  kid.send({ t: 'fly', action: 'ride', id: ak.id, yes: true });
  assert.ok(!kid.s.flying);
  // じかんぎれ
  papa.send({ t: 'fly', action: 'call' });
  const ak2 = last(kid, 'flyAsk');
  assert.notEqual(ak2.id, ak.id);
  clock.now += RIDE_ASK_MS + 1000;
  kid.send({ t: 'fly', action: 'ride', id: ak2.id, yes: true });
  assert.ok(!kid.s.flying, 'じかんぎれ');
  assert.ok(kid.msgs.some((m) => m.t === 'toast' && /もう行ってしまった/.test(m.text)));
  // ひとりの ときは だれにも きかない
  const { bots: [solo] } = await family(clock, ['ソロ', 'warrior']);
  solo.s.char.flags.c2_clear = true;
  solo.s.char.keyItems.push(FLUTE_ID);
  assert.ok(solo.msgs.every((m) => m.t !== 'flyAsk'));
});
