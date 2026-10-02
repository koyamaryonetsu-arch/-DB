// 今の目標: 古い 版の 文や からっぽの 目標は、ストーリーの すすみぐあいから なおす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { objectiveFromFlags, repairObjective, KNOWN_OBJECTIVES } from '../public/js/shared/data/progress.js';
import { OBJECTIVE_TALK } from '../public/js/shared/data/party-talk.js';
import { CH1_CLEAR_OBJECTIVE } from '../public/js/shared/data/story.js';
import { SKY_FLAG, SKY_OBJECTIVE, C3_LEAD_OBJECTIVE } from '../public/js/shared/data/sky.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const flags = (...ks) => Object.fromEntries(ks.map((k) => [k, true]));

test('すすみぐあいの 目標は ぜんぶ 仲間の 会話（はなす）にも ある', () => {
  for (const o of KNOWN_OBJECTIVES) {
    if (/続きはアップデート/.test(o) && o !== SKY_OBJECTIVE) continue;
    assert.ok(OBJECTIVE_TALK[o], `会話が ない: ${o}`);
  }
});

test('フラグから 今の 目標が わかる', () => {
  assert.equal(objectiveFromFlags({ flags: {} }), 'ホシミばあちゃんの家（村の南東）へ行こう');
  assert.equal(objectiveFromFlags({ flags: flags('p_opening', 'p_start', 'p_flower', 'p_attack', 'c1_town', 'c1_mayor') }), '大工のガンテツ（町の南東の家）に会おう');
  assert.equal(objectiveFromFlags({ flags: flags('p_start', 'c1_cave'), chests: { b2_key: true } }), 'カギで、おくのとびらを開けよう');
  assert.equal(objectiveFromFlags({ flags: flags('c1_cave', 'c1_door'), chests: { b2_key: true } }), 'おくの部屋へ進もう（泉で回復してから行こう）');
  assert.equal(objectiveFromFlags({ flags: flags('c1_clear') }), CH1_CLEAR_OBJECTIVE);
  assert.equal(objectiveFromFlags({ flags: flags('c1_clear', 'c2_start', 'c2_ship', 'c2_port_seen', 'c2_port') }), '南の小島の「海鳴りの洞窟」で、光の玉を取りもどそう');
  // 風の笛を もらったら 第3章の 入り口（ホシミばあちゃん）。むかしの 文も 知っている 文の まま
  assert.equal(objectiveFromFlags({ flags: flags('c2_clear', SKY_FLAG) }), C3_LEAD_OBJECTIVE);
  assert.ok(KNOWN_OBJECTIVES.has(SKY_OBJECTIVE));
});

test('古い 文・からっぽの 目標だけ なおす（今の 文は そのまま）', () => {
  const old = { flags: flags('p_start', 'p_flower', 'p_attack', 'c1_town'), objective: 'ちょうちょうの いえを たずねよう' };
  assert.equal(repairObjective(old), true);
  assert.equal(old.objective, '町長の家（町の北西の建物）を訪ねよう');
  const empty = { flags: flags('p_start') };
  repairObjective(empty);
  assert.equal(empty.objective, '星見の丘（村の東門の先）で星の花をつもう');
  const now = { flags: flags('p_start', 'p_flower', 'p_attack', 'c1_town'), objective: '北のルミナの町へ行き、町長に会おう' };
  assert.equal(repairObjective(now), false, '今の 版に ある 文は さわらない');
  assert.equal(now.objective, '北のルミナの町へ行き、町長に会おう');
});

test('セーブを 読みこむと 古い 目標が なおる', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(3), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  const id = await bot.createAndPlay('priest');
  await bot.settle();
  const c = world.data.characters[id];
  c.flags = { ...c.flags, ...flags('p_opening', 'p_start') };
  c.objective = 'ほしみの おかで ほしの はなを つもう';
  bot.send({ t: 'play', id });
  await bot.settle();
  assert.equal(world.data.characters[id].objective, '星見の丘（村の東門の先）で星の花をつもう');
});
