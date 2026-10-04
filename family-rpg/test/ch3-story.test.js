// 第3章「星の竜がねむる山」: はじめから さいごまで・むかしの セーブ・マルチプレイの しかけ・空の 旅
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { NORTH_PLACES, NORTH_POS, NORTH_LANDING } from '../public/js/shared/maps/north.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { C3_OBJ } from '../public/js/shared/data/story-ch3.js';
import { SKY_FLAG, SKY_OBJECTIVE, C3_LEAD_OBJECTIVE, C4_LEAD_OBJECTIVE, regionsFrom, skyBox, flySpeed, mountOf, DRAGON_FLY_MULT } from '../public/js/shared/data/sky.js';
import { objectiveFromFlags } from '../public/js/shared/data/progress.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const VIL = NORTH_PLACES.dragon_village, KAN = NORTH_PLACES.kanatoko, YUN = NORTH_PLACES.yunoha;
const OV = (x, y) => [PLACES.village.x + x, PLACES.village.y + y];

// 第2章クリア・風の笛まで すすめた キャラ
function toCh3(bot) {
  const c = bot.world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c2_clear') + 1)) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.keyItems.push('wind_flute');
  c.objective = C3_LEAD_OBJECTIVE;
  return c;
}

// ひとりで ボスまで とおす テスト（レベルと 職業を 上げて、はがねの 装備）
function boost(bot, level) {
  const c = bot.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'steel_sword', armor: 'steel_mail', shield: 'steel_shield', head: 'steel_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
  bot.world.sendSelf(bot.s);
}

// ボス戦は 長い（あたらしい 行動ゲージ）ので、おわるまで たっぷり まつ
const BOSS_TICKS = 20000;

const place = async (bot, map, x, y) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true);
  await bot.settle();
};

// なかまを 3人 つれていく（ひとりでは ボスに 勝てない ので、テストでも パーティーで）
async function party3(world, bot) {
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo']) assert.ok(recruitNpc(world, bot.s, id, { force: true }).ok, id);
  await bot.settle();
}

// みんなの だいほん・たたかいを すすめる（マルチプレイ）
async function settleAll(world, bots, n = 3000) {
  for (let i = 0; i < n; i++) {
    for (const b of bots) b.flushQueue();
    await tickN(world, 1);
    for (const b of bots) b.flushQueue();
    if (bots.every((b) => !b.s.busy && !b.queue.length && !b.inBattle)) {
      await tickN(world, 2);
      for (const b of bots) b.flushQueue();
      if (bots.every((b) => !b.s.busy && !b.queue.length)) return;
    }
  }
}
// 1歩 すすむ
function step(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
}

test('第3章を はじめから さいごまで とおして あそべる', { timeout: 300000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(303), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = toCh3(bot);
  boost(bot, 60);
  await party3(world, bot);
  // 魔物は よってこない（このテストは 物語だけ）
  bot.s.repelUntil = 1e15;

  // まだ 北へは 飛べない
  assert.deepEqual(regionsFrom('overworld', (f) => !!c.flags[f]), ['sea']);
  // ホシミばあちゃん → 第3章
  await bot.walkTo(...OV(24, 18));
  await bot.talk('elder');
  assert.ok(bot.flag('c3_start'), '第3章が はじまる');
  assert.equal(c.objective, C3_OBJ.start);
  assert.deepEqual(regionsFrom('overworld', (f) => !!c.flags[f]), ['sea', 'north'], '北へ 飛べる');

  // シロガネ地方の 雪原の広場に おりる
  await place(bot, 'north', 64, 97);
  await bot.walkTo(64, 95);
  assert.ok(bot.flag('c3_arrive'));
  assert.equal(c.objective, C3_OBJ.arrive);

  // 竜守りの村 → 長老ハクゲン
  await bot.walkTo(63, 64);
  assert.ok(bot.flag('c3_village'), '村に 着いた');
  await bot.walkTo(VIL.x + 6, VIL.y + 6);
  await bot.talk('c3_elder');
  assert.ok(bot.flag('c3_elder'));
  assert.deepEqual(c.guests, ['yukina'], 'ユキナが 仲間に なる');
  assert.ok(c.visited.dragon_village, 'ルーラで 来られる');

  // 氷の洞窟 → ブリザマンモス
  await bot.walkTo(NORTH_POS.icecave.x, NORTH_POS.icecave.y);
  assert.equal(bot.map, 'ice_cave1');
  await bot.settle();
  assert.ok(bot.flag('c3_icecave'));
  await bot.walkTo(17, 2);
  assert.equal(bot.map, 'ice_cave2');
  await bot.walkTo(20, 8);
  await bot.settle(BOSS_TICKS);
  assert.ok(bot.flag('c3_mammoth'), 'マンモスを しずめた');
  assert.deepEqual(c.guests, [], 'ユキナは 村へ 帰る');
  assert.ok(c.items.some((i) => i.id === 'ice_fang_charm'), 'ボスの アクセサリー');
  // クリスタルで 入り口へ
  await bot.walkTo(14, 3);
  await bot.examine(14, 2);
  assert.equal(bot.map, 'ice_cave1');
  await bot.walkTo(6, 33);
  assert.equal(bot.map, 'north');

  // 鉱山の町カナトコ → 親方ドンガ
  await bot.walkTo(KAN.x + 16, KAN.y + 12);
  assert.ok(bot.flag('c3_kanatoko'));
  await bot.walkTo(KAN.x + 6, KAN.y + 5);
  await bot.talk('donga');
  assert.ok(bot.flag('c3_miners'));

  // 鉱山: レバーと トロッコ
  await bot.walkTo(NORTH_POS.mine.x, NORTH_POS.mine.y);
  assert.equal(bot.map, 'mine1');
  await bot.walkTo(21, 21);
  await bot.examine(21, 20);
  assert.ok(bot.flag('c3_m1_lever'), 'レバーで 東の 島へ');
  await bot.walkTo(19, 21);
  await bot.talk('m1_cart_camp');
  assert.deepEqual([Math.floor(bot.x), Math.floor(bot.y)], [29, 6], 'トロッコで 東の 島へ');
  await bot.walkTo(35, 2);
  assert.equal(bot.map, 'mine2');
  await bot.walkTo(21, 28);
  await bot.talk('m2_cart_hub');
  assert.deepEqual([Math.floor(bot.x), Math.floor(bot.y)], [10, 20], '西の 島へ');
  await bot.walkTo(7, 17);
  await bot.examine(7, 16);
  await bot.walkTo(10, 20);
  await bot.talk('m2_cart_a');
  assert.deepEqual([Math.floor(bot.x), Math.floor(bot.y)], [13, 5], '北の 島へ');
  await bot.walkTo(21, 2);
  assert.equal(bot.map, 'mine3');
  await bot.walkTo(15, 12);
  await bot.settle(BOSS_TICKS);
  assert.ok(bot.flag('c3_mine'), 'マグマゴーレムを たおした');
  assert.equal(bot.map, 'north', '町へ もどる');

  // 温泉の里ユノハ → 湯守りのおばば（万年氷で 氷のお守り）
  await bot.walkTo(YUN.x + 12, YUN.y + 10);
  assert.ok(bot.flag('c3_yunoha'));
  c.keyItems.push('eternal_ice');
  await bot.walkTo(YUN.x + 6, YUN.y + 4);
  await bot.talk('obaba');
  assert.ok(bot.flag('c3_onsen'));
  assert.ok(bot.flag('c3_heatguard'), '氷のお守り');
  assert.ok(c.keyItems.includes('ice_charm'));

  // 炎の山: レバーで ようがんの 流れを かえる
  await bot.walkTo(NORTH_POS.volcano.x, NORTH_POS.volcano.y);
  assert.equal(bot.map, 'volcano1');
  await bot.settle();
  await bot.walkTo(24, 25);
  await bot.examine(24, 24);
  await bot.walkTo(20, 2);
  assert.equal(bot.map, 'volcano2');
  await bot.walkTo(36, 23);
  await bot.examine(36, 22);
  await bot.walkTo(26, 32);
  await bot.examine(26, 31);
  await bot.walkTo(12, 3);
  assert.equal(bot.map, 'volcano3');
  await bot.walkTo(14, 14);
  await bot.settle(BOSS_TICKS);
  assert.ok(bot.flag('c3_flare'), 'フレアードを たおした');
  assert.equal(c.objective, C3_OBJ.flare);

  // 竜の試練の神殿
  await bot.walkTo(NORTH_POS.temple.x, NORTH_POS.temple.y);
  assert.equal(bot.map, 'dragon_temple');
  await bot.settle();
  assert.ok(bot.flag('c3_temple'));
  // 勇気
  await bot.walkTo(14, 0);
  assert.equal(bot.map, 'trial_courage');
  await bot.walkTo(10, 11);
  await bot.settle(BOSS_TICKS);
  assert.ok(bot.flag('c3_courage'), '勇気の試練');
  await bot.walkTo(10, 26);
  // ちえ（まちがえると 消える → 東 南 西 北）
  await bot.walkTo(0, 11);
  assert.equal(bot.map, 'trial_wisdom');
  await bot.walkTo(11, 5);
  await bot.examine(11, 4);
  assert.ok(!bot.flag('c3_wz_n'), 'さいしょに 北は まちがい');
  await bot.walkTo(17, 10);
  await bot.examine(17, 9);
  await bot.walkTo(11, 15);
  await bot.examine(11, 14);
  await bot.walkTo(11, 5);
  await bot.examine(11, 4);
  assert.ok(!bot.flag('c3_wz_e') && !bot.flag('c3_wz_s'), 'じゅんばんを まちがえると ぜんぶ 消える');
  for (const [sx, sy, bx, by] of [[17, 10, 17, 9], [11, 15, 11, 14], [5, 10, 5, 9], [11, 5, 11, 4]]) {
    await bot.walkTo(sx, sy);
    await bot.examine(bx, by);
  }
  assert.ok(bot.flag('c3_wisdom'), 'ちえの試練');
  await bot.walkTo(11, 20);
  // きずな（つれている 仲間が のこりの スイッチに 乗ってくれる）
  await bot.walkTo(28, 11);
  assert.equal(bot.map, 'trial_bond');
  await bot.walkTo(11, 5);
  await bot.settle();
  assert.ok(bot.flag('c3_bond'), 'きずなの試練');
  assert.ok(bot.flag('c3_gate'), '竜の門が ひらく');
  assert.equal(bot.map, 'north');
  assert.ok(c.guests.includes('yukina'), 'ユキナが また 仲間に');

  // 星竜山
  boost(bot, 70);
  await bot.walkTo(NORTH_POS.peak.x, NORTH_POS.peak.y);
  assert.equal(bot.map, 'peak1');
  await bot.settle();
  assert.ok(bot.flag('c3_peak'));
  await bot.walkTo(17, 1);
  assert.equal(bot.map, 'peak2');
  await bot.walkTo(15, 1);
  assert.equal(bot.map, 'peak3');
  await bot.walkTo(17, 25);
  assert.ok(bot.flag('c3_hut'), '山小屋');
  // 山小屋で 休む（仲間も 全回復）
  const g0 = c.gold;
  await bot.walkTo(11, 12);
  await bot.talk('hut_keeper');
  assert.equal(c.gold, g0 - 60, '山小屋の 宿代');
  assert.ok(bot.party.supports.every((x) => x.hp === x.maxHp), '仲間も 回復');
  await bot.walkTo(26, 1);
  assert.equal(bot.map, 'peak4');
  await bot.walkTo(24, 1);
  assert.equal(bot.map, 'peak5');
  await bot.walkTo(14, 1);
  assert.equal(bot.map, 'peak_top');
  await bot.settle(BOSS_TICKS * 2);
  assert.ok(bot.flag('c3_ignia'), 'イグニアを たおした');
  assert.ok(bot.flag('c3_dragon'), '星の竜が 目覚めた');
  assert.ok(bot.flag('c3_clear'), '第3章 クリア！');
  // 第4章の 入り口（長老ハクゲンに もう一度 話す。story-ch4.js）
  assert.equal(c.objective, C4_LEAD_OBJECTIVE);
  assert.deepEqual(c.guests, [], 'ユキナは 村に のこる');
  assert.ok(!c.keyItems.includes('fire_star'), '炎の守り星は ほこらへ');
  assert.ok(c.items.some((i) => i.id === 'witch_ring'), 'イグニアの 指輪');
  assert.equal(bot.map, 'north');
  // 竜に のって 速く・どこでも 飛べる
  assert.equal(mountOf(c.flags).name, 'アステル');
  assert.equal(flySpeed(c.flags), DRAGON_FLY_MULT);
  assert.equal(skyBox('north', (f) => !!c.flags[f]), null);
  // 目標・仲間会話・地図の しるしが どの 目標にも ある
  for (const t of Object.values(C3_OBJ)) {
    assert.equal(objectiveFromFlags({ flags: {} }) !== t, true);
    assert.ok(talkFor(t, 'kind') !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${t}`);
  }
});

test('第3章: 目標から 地図の しるしが 出る', () => {
  for (const [k, t] of Object.entries(C3_OBJ)) {
    if (k === 'clear') continue;
    const c = { flags: {}, objective: t };
    const marks = ['overworld', 'north'].flatMap((m) => questMarks(c, m));
    assert.ok(marks.some((m) => m.kind === 'main'), `しるし: ${t}`);
  }
});

test('むかしの セーブ: 笛を もらって「続きはアップデートで！」の 人は 第3章の 入り口へ', () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'ミウ');
  bot.login();
  bot.createAndPlay('mage');
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c2_clear') + 1)) c.flags[f] = true;
  c.flags[SKY_FLAG] = true;
  c.objective = SKY_OBJECTIVE;
  const w2 = new GameWorld({ offline: true, rng: makeRng(6), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const c2 = w2.data.characters[c.id];
  w2.normalizeChar?.(c2);
  const b2 = new Bot(w2, 'ミウ');
  b2.login();
  b2.send({ t: 'play', id: c.id });
  assert.equal(w2.data.characters[c.id].objective, C3_LEAD_OBJECTIVE);
  // 第3章の とちゅうの セーブは そのまま
  assert.equal(objectiveFromFlags({ flags: { c3_mine: true } }), C3_OBJ.mine);
  // 第3章クリアの あとは 第4章の 入り口へ（story-ch4.js）
  assert.equal(objectiveFromFlags({ flags: { c3_clear: true } }), C4_LEAD_OBJECTIVE);
});

test('きずなの間: 家族 3人で 3つの スイッチに 乗ると ひらく。レバーは リーダーの 世界を かえる', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(31), checkPassword: () => true, rateLimit: false });
  const bots = [new Bot(world, 'パパ'), new Bot(world, 'ママ'), new Bot(world, 'ユイ')];
  for (const b of bots) {
    await b.login('x');
    await b.createAndPlay('warrior');
    await b.settle();
  }
  const [papa, mama, kid] = bots;
  const pc = world.data.characters[papa.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c3_temple') + 1)) pc.flags[f] = true;
  for (const b of [mama, kid]) {
    papa.send({ t: 'party', action: 'invite', sid: b.s.id });
    b.send({ t: 'party', action: 'accept' });
  }
  assert.equal(papa.party.members.length, 3);
  for (const b of bots) b.s.repelUntil = 1e15;
  // ママと ユイが 先に スイッチに 乗る（2人では まだ ひらかない）
  const plates = [[11, 5], [6, 13], [16, 13]];
  for (const [i, b] of bots.entries()) await place(b, 'trial_bond', plates[i][0], plates[i][1] + 1);
  step(mama, 6, 13);
  await settleAll(world, bots);
  step(kid, 16, 13);
  await settleAll(world, bots);
  assert.ok(!pc.flags.c3_bond, '2人では ひらかない');
  step(papa, 11, 5);
  await settleAll(world, bots);
  assert.ok(pc.flags.c3_bond, '3人 そろうと ひらく');
  assert.ok(!world.data.characters[kid.char.id].flags.c3_bond, '手伝った 人の 物語は かわらない');

  // 炎の山の レバー: 手伝いの ユイが 引くと、リーダーの 世界の 流れが かわる
  for (const f of ['c3_mammoth', 'c3_mine', 'c3_onsen']) pc.flags[f] = true;
  await settleAll(world, bots);
  await place(papa, 'volcano1', 20, 27);
  await place(kid, 'volcano1', 24, 25);
  kid.send({ t: 'interact', kind: 'tile', x: 24, y: 24 });
  await settleAll(world, bots);
  assert.ok(pc.flags.c3_v1, 'リーダーの フラグが かわる');
  assert.ok(!world.data.characters[kid.char.id].flags.c3_v1);
});

test('炎の山: 赤い 地面は 氷のお守りが ないと やけどする（HPは 1 のこる）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(41), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  bot.s.repelUntil = 1e15;
  await place(bot, 'volcano1', 20, 27);
  const hp0 = c.hp;
  await bot.walkTo(20, 21);
  assert.ok(c.hp < hp0, 'やけどした');
  assert.ok(bot.msgs.some((m) => m.t === 'hurt'));
  c.hp = 1;
  await bot.walkTo(16, 21);
  assert.equal(c.hp, 1, 'たおれは しない');
  c.flags.c3_heatguard = true;
  c.hp = computeStats(c).maxHp;
  const hp1 = c.hp;
  await bot.walkTo(10, 21);
  assert.equal(c.hp, hp1, 'お守りが あれば へいき');
  await tickN(world, 2);
});

test('シロガネ地方: 星の竜が 目覚めるまで 空は 雪原の広場だけ。ルーラで 3つの 町へ', () => {
  const box = skyBox('north', () => false);
  assert.deepEqual([box.x, box.y, box.w, box.h], [NORTH_LANDING.x, NORTH_LANDING.y, NORTH_LANDING.w, NORTH_LANDING.h]);
  assert.equal(skyBox('north', (f) => f === 'c3_dragon'), null);
  for (const id of ['dragon_village', 'kanatoko', 'yunoha']) assert.ok(MAPS.north && id, id);
});
