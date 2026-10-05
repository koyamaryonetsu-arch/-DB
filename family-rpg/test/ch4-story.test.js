// 第4章「砂の海にしずむ星」Step 1: 長老ハクゲン → 竜で 南へ → 北の海辺 → ハミル → 村長 → 北の古井戸 → アミを 助ける
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, condOk } from '../public/js/shared/maps/index.js';
import { NORTH_PLACES } from '../public/js/shared/maps/north.js';
import { SEA_W, SEA_H } from '../public/js/shared/maps/sea.js';
import { SOUTH_PLACES, SOUTH_POS, SOUTH_LANDING, SOUTH_ARRIVE, LANDING_BEACH } from '../public/js/shared/maps/south.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { C3_OBJ } from '../public/js/shared/data/story-ch3.js';
import { C4_OBJ, C4_LEAD, CH4_STEPS } from '../public/js/shared/data/story-ch4.js';
import {
  SKY_FLAG, FLUTE_ID, C4_LEAD_OBJECTIVE, regionsFrom, regionHop, skyBox, inSkyBox, edgeLockedText, mountOf,
} from '../public/js/shared/data/sky.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { NIGHT_ZONES } from '../public/js/shared/data/night.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const VIL = NORTH_PLACES.dragon_village, HAM = SOUTH_PLACES.hamil;
const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const DAY = 0.3, NIGHT = 0.8;
const BOSS_TICKS = 20000;

// 第3章クリアまで すすめた キャラ（竜に 乗れる）
function toCh4(bot) {
  const c = bot.world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c3_clear') + 1)) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  c.objective = C4_LEAD;
  return c;
}
function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'steel_sword', armor: 'steel_mail', shield: 'steel_shield', head: 'steel_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
  bot.world.sendSelf(bot.s);
}
async function party3(world, bot) {
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo']) assert.ok(recruitNpc(world, bot.s, id, { force: true }).ok, id);
  await bot.settle();
}
const place = async (bot, map, x, y, opts) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true, opts);
  await bot.settle();
};
const lastToast = (bot) => bot.msgs.filter((m) => m.t === 'toast').pop()?.text || '';

test('第4章 Step 1 を はじめから アミを 助けるまで とおして あそべる', { timeout: 300000 }, async () => {
  const clock = { now: at(DAY) };
  const world = new GameWorld({ offline: true, rng: makeRng(404), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = toCh4(bot);
  boost(bot, 34);
  await party3(world, bot);
  bot.s.repelUntil = 1e15;
  const has = (f) => !!c.flags[f];

  // まだ 南へは 飛べない（砂嵐。第3章クリアの 人には ヒント）
  assert.ok(!regionsFrom('sea', has).includes('south'));
  assert.match(edgeLockedText('sea', 'south', has), /砂嵐で進めない[\s\S]*ハクゲン/);
  assert.doesNotMatch(edgeLockedText('sea', 'south', () => false), /ハクゲン/, '第3章の 前は ヒントなし');

  // 竜守りの村の 長老ハクゲン → 第4章
  await place(bot, 'north', VIL.x + 6, VIL.y + 6);
  await bot.talk('c3_elder');
  assert.ok(bot.flag('c4_start'), '第4章が はじまる');
  assert.equal(c.objective, C4_OBJ.start);
  assert.ok(regionsFrom('sea', has).includes('south') && regionsFrom('north', has).includes('south'), '南へ 飛べる');
  assert.equal(mountOf(c.flags).name, 'アステル');

  // 竜を よんで 風の海へ、南の はしを こえて コガネ地方へ
  await place(bot, 'north', 64, 75);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, '竜に 乗った');
  bot.send({ t: 'fly', action: 'region', to: 'sea' });
  assert.equal(bot.s.map, 'sea');
  world.placeSession(bot.s, 'sea', SEA_W / 2 + 0.5, SEA_H - 1, 'down', true, { fly: true });
  bot.send({ t: 'fly', action: 'region', edge: true });
  assert.equal(bot.s.map, 'south', 'コガネ地方へ 着いた');
  assert.ok(inSkyBox(SOUTH_LANDING, bot.s.x, bot.s.y), '北の海辺の 上の 空');
  // 砂嵐: 海辺の 上より 先へは 飛べない
  const [fx, fy] = [bot.s.x, bot.s.y];
  bot.send({ t: 'move', x: fx, y: SOUTH_LANDING.y + SOUTH_LANDING.h + 0.5, dir: 'down', moving: true, seq: bot.seq });
  assert.ok(inSkyBox(SOUTH_LANDING, bot.s.x, bot.s.y), '砂嵐の 中へは 入れない');
  // 海辺に おりる → 到着
  world.placeSession(bot.s, 'south', SOUTH_ARRIVE.x, SOUTH_ARRIVE.y, 'down', true, { fly: true });
  bot.send({ t: 'fly', action: 'land' });
  assert.ok(!bot.s.flying, 'おりた');
  await bot.walkTo(Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y) + 2);
  assert.ok(bot.flag('c4_arrive'), '北の海辺に 着いた');
  assert.equal(c.objective, C4_OBJ.arrive);

  // 砂ばくの 中では 竜を よべない（北の海辺で よぶ）
  await place(bot, 'south', 60, 28);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying);
  assert.match(lastToast(bot), /砂嵐[\s\S]*北の海辺/);

  // オアシスの村ハミル
  await bot.walkTo(HAM.x + 25, HAM.y + 9);
  assert.ok(bot.flag('c4_hamil'), 'ハミルに 着いた');
  assert.equal(c.objective, C4_OBJ.hamil);
  assert.ok(c.visited.hamil, 'ルーラで 来られる');
  assert.equal(bot.s.map, 'south');
  // まだ 竜を 呼べない（村の 中）
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying);

  // 村長ナディム → アミが いない
  await bot.walkTo(HAM.x + 6, HAM.y + 5);
  await bot.talk('nadim');
  assert.ok(bot.flag('c4_nadim'));
  assert.equal(c.objective, C4_OBJ.nadim);

  // 北の古井戸
  await bot.walkTo(SOUTH_POS.well.x, SOUTH_POS.well.y);
  assert.equal(bot.map, 'north_well');
  await bot.settle();
  assert.ok(bot.flag('c4_well'));
  assert.equal(c.objective, C4_OBJ.well);
  const goldBefore = c.gold;
  const shards = () => c.items.filter((i) => i.id === 'star_shard').reduce((s, i) => s + i.n, 0);
  const shardsBefore = shards();

  // おくの へやで アミを かこむ 魔物と たたかう → 村へ
  await bot.walkTo(28, 18);
  await bot.settle(BOSS_TICKS);
  assert.ok(bot.battles.some((b) => b.result === 'win' || b.win || b.outcome === 'win') || bot.flag('c4_ami'), '井戸の おくの 戦いに 勝った');
  assert.ok(bot.flag('c4_ami'), 'アミを 助けた');
  assert.equal(bot.map, 'south', '村へ 帰った');
  assert.ok(bot.s.x >= HAM.x && bot.s.x < HAM.x + HAM.w && bot.s.y >= HAM.y && bot.s.y < HAM.y + HAM.h, 'ハミルの 中');
  assert.equal(c.objective, C4_OBJ.ami);
  assert.ok(c.gold >= goldBefore + 1500, 'お礼の ゴールド');
  assert.ok(shards() >= shardsBefore + 3, 'アミから 星のかけら');
  // アミと お母さんは 家に いる。井戸の 魔物は いない
  const hasNow = (f) => !!c.flags[f];
  assert.ok(condOk(MAPS.south.npcById.ami.show, hasNow));
  assert.ok(condOk(MAPS.south.npcById.ami_mom.show, hasNow));
  assert.ok(!condOk(MAPS.south.npcById.ami_mom_gate.show, hasNow));
  for (const id of ['ami_well', 'well_scorp1', 'well_scorp2', 'well_slime']) assert.ok(!condOk(MAPS.north_well.npcById[id].show, hasNow), id);
  // Step 1 の 物語の すすみぐあいの フラグが ぜんぶ たっている（Step 2 は test/ch4-canal.test.js）
  for (const f of CH4_STEPS.slice(0, CH4_STEPS.indexOf('c4_ami') + 1)) assert.ok(c.flags[f], f);
  assert.ok(!c.flags.c4_canal, 'つぎは 村長の たのみ');
});

test('第4章: 目標・仲間会話・地図の しるしが どの 目標にも ある', () => {
  for (const [k, t] of Object.entries({ lead: C4_LEAD, ...C4_OBJ })) {
    assert.ok(KNOWN_OBJECTIVES.has(t), `しっている 目標: ${k}`);
    assert.ok(talkFor(t, 'kind') !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k}`);
    if (k === 'ami') continue;
    const marks = ['north', 'sea', 'south', 'north_well', 'palace_canal'].flatMap((m) => questMarks({ flags: {}, objective: t }, m));
    assert.ok(marks.some((m) => m.kind === 'main'), `しるし: ${k}`);
  }
  // 南の はしの しるしは 風の海の いちばん 下
  const seaMark = questMarks({ flags: {}, objective: C4_OBJ.start }, 'sea').find((m) => m.kind === 'main');
  assert.ok(seaMark && seaMark.y >= SEA_H - 3, '風の海の 南の はし');
  // すすみぐあいから 目標を きめる
  assert.equal(objectiveFromFlags({ flags: { c3_clear: true } }), C4_LEAD);
  assert.equal(objectiveFromFlags({ flags: { c4_start: true } }), C4_OBJ.start);
  assert.equal(objectiveFromFlags({ flags: { c4_nadim: true } }), C4_OBJ.nadim);
  assert.equal(objectiveFromFlags({ flags: { c4_ami: true } }), C4_OBJ.ami);
  assert.equal(C4_LEAD, C4_LEAD_OBJECTIVE);
});

test('むかしの セーブ: 第3章クリアで「続きはアップデートで！」の 人は 第4章の 入り口へ', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(41), rateLimit: false });
  const bot = new Bot(world, 'ミウ');
  await bot.login();
  await bot.createAndPlay('mage');
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c3_clear') + 1)) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  c.objective = C3_OBJ.clear;
  const w2 = new GameWorld({ offline: true, rng: makeRng(42), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const b2 = new Bot(w2, 'ミウ');
  await b2.login();
  b2.send({ t: 'play', id: c.id });
  assert.equal(w2.data.characters[c.id].objective, C4_LEAD);
  // 第4章を はじめた 人は そのまま
  const w3data = JSON.parse(JSON.stringify(world.data));
  w3data.characters[c.id].flags.c4_start = true;
  w3data.characters[c.id].objective = C4_OBJ.start;
  const w3 = new GameWorld({ offline: true, rng: makeRng(43), rateLimit: false, data: w3data });
  const b3 = new Bot(w3, 'ミウ');
  await b3.login();
  b3.send({ t: 'play', id: c.id });
  assert.equal(w3.data.characters[c.id].objective, C4_OBJ.start);
});

test('空の旅: 風の海の 南の はし ⇄ コガネ地方の 北の はし。砂嵐の あいだは 北の海辺の 上だけ', () => {
  const has = (flags) => (f) => flags.includes(f);
  const f4 = ['c3_start', 'c3_clear', 'c3_dragon', 'c4_start'];
  // 南の はしを こえると、北の海辺の 上の 空へ
  const to = regionHop('sea', SEA_W - 2, SEA_H - 0.5, 'south', null, has(f4));
  assert.equal(to.map, 'south');
  assert.ok(inSkyBox(SOUTH_LANDING, to.x, to.y), '砂嵐の 外へは 出ない');
  // 北の はしを こえると 風の海の 南の はしへ
  const back = regionHop('south', 72, 1, 'north', null, has(f4));
  assert.equal(back.map, 'sea');
  assert.ok(back.y > SEA_H - 2);
  // 「別の地方へ飛ぶ」でも 北の海辺へ
  const arrive = regionHop('north', 64, 50, null, 'south', has(f4));
  assert.deepEqual([arrive.map, arrive.x, arrive.y], ['south', SOUTH_ARRIVE.x, SOUTH_ARRIVE.y]);
  assert.ok(inSkyBox(LANDING_BEACH, arrive.x, arrive.y), '海辺の 上');
  // 砂嵐の あいだは 北の海辺の 上だけ。大臣ザイード（Step 5）を たおすと 広がる
  const box = skyBox('south', has(f4));
  assert.ok(box);
  assert.ok(!inSkyBox(box, HAM.x + 10, HAM.y + 10), '村の 上は 飛べない');
  assert.equal(skyBox('south', has([...f4, 'c4_zaid'])), null);
  // 行ける 地方の じゅんばん
  assert.deepEqual(regionsFrom('south', has(f4)), ['sea', 'overworld', 'north']);
  assert.deepEqual(regionsFrom('overworld', has(['c3_start'])), ['sea', 'north'], '第4章の 前は 南へ 行けない');
});

test('砂ばくの 夜: 夜は 月のゆうれいが うろうろ。昼は いない', { timeout: 120000 }, async () => {
  const clock = { now: at(NIGHT) };
  const world = new GameWorld({ offline: true, rng: makeRng(44), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c4_arrive') + 1)) c.flags[f] = true;
  bot.s.repelUntil = 1e15;
  world.placeSession(bot.s, 'south', 80.5, 30.5, 'down', true);
  await tickN(world, 160, 100);
  const ms = mapState(world, 'south');
  const night = [...ms.symbols.values()].filter((s) => NIGHT_ZONES[s.zone]);
  assert.ok(night.length > 10, `夜の 魔物 ${night.length}`);
  assert.ok(night.every((s) => s.tod === 'night' && s.table.endsWith('_night')), '夜の 出現表');
  assert.ok(night.some((s) => s.group.includes('moon_ghost')), '月のゆうれいが 出る');
  // 朝に なると 昼の 魔物に かわる（月のゆうれいは 出ない）
  clock.now = at(DAY);
  await tickN(world, 240, 100);
  const day = [...ms.symbols.values()].filter((s) => s.tod === 'day');
  assert.ok(day.length > 5, `昼の 魔物 ${day.length}`);
  assert.ok(day.every((s) => !s.group.includes('moon_ghost')), '昼は 月のゆうれいが いない');
  assert.ok(day.every((s) => !MONSTERS[s.sp].night));
});

test('家族で: リーダーの 世界で 南へ 飛べて、いっしょに 乗った なかまも いっしょ（なかまの 物語は そのまま）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(45), checkPassword: () => true, rateLimit: false, now: () => at(DAY) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  const c = papa.s.char;
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c4_start') + 1)) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push(FLUTE_ID);
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  world.placeSession(papa.s, 'north', 64.5, 75.5, 'down', true);
  world.placeSession(kid.s, 'north', 64.5, 76.5, 'up', true);
  kid.send({ t: 'move', x: 64.5, y: 76.55, dir: 'up', moving: false, seq: kid.seq, follow: true });
  papa.send({ t: 'fly', action: 'call' });
  // ユイは「いっしょに 乗る」を えらぶ
  const ask = kid.msgs.filter((m) => m.t === 'flyAsk').pop();
  assert.equal(ask?.mount, 'アステル', '星の竜に 乗るか きかれる');
  kid.send({ t: 'fly', action: 'ride', id: ask.id, yes: true });
  assert.ok(papa.s.flying && kid.s.flying, '竜に みんなで 乗った');
  papa.send({ t: 'fly', action: 'region', to: 'south' });
  assert.equal(papa.s.map, 'south');
  assert.equal(kid.s.map, 'south', 'ユイも いっしょに 砂の国へ');
  assert.ok(inSkyBox(SOUTH_LANDING, papa.s.x, papa.s.y));
  // ユイの 物語は すすまない（リーダーの 世界で 手伝っている）
  assert.ok(!kid.s.char.flags.c4_start && !kid.s.char.flags.c3_clear, 'ユイの フラグは そのまま');
  // おりると、北の海辺に 着いた イベント（リーダーの 物語）
  world.placeSession(papa.s, 'south', SOUTH_ARRIVE.x, SOUTH_ARRIVE.y, 'down', true, { fly: true });
  world.placeSession(kid.s, 'south', SOUTH_ARRIVE.x, SOUTH_ARRIVE.y + 1, 'down', true, { fly: true });
  papa.send({ t: 'fly', action: 'land' });
  assert.ok(!papa.s.flying && !kid.s.flying, 'みんな おりた');
  await papa.walkTo(Math.floor(SOUTH_ARRIVE.x), Math.floor(SOUTH_ARRIVE.y) + 2);
  await papa.settle();
  await kid.settle();
  assert.ok(c.flags.c4_arrive, 'パパの 物語が すすむ');
  assert.ok(!kid.s.char.flags.c4_arrive);
  // 手伝っている ユイが 砂ばくで 竜を 呼んでも、リーダーの 世界の 砂嵐で 来られない
  world.placeSession(kid.s, 'south', 60.5, 28.5, 'down', true);
  kid.send({ t: 'fly', action: 'call' });
  assert.ok(!kid.s.flying);
  assert.match(kid.msgs.filter((m) => m.t === 'toast').pop()?.text || '', /砂嵐/);
});
