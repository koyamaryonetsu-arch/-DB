// お仕事いらい板の たのまれごとの テストの どうぐ（test/family-quests.test.js・test/work-quests.test.js）
// 第1部クリアの キャラを 作る・NPC の となりへ 行って 話す（選たくしを じゅんに えらぶ）・戦いは すぐ 勝たせる
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

export const CLEAR = ['c5_clear', 'c4_clear', 'c3_clear', 'c2_clear', 'c1_clear', 'c3_onsen'];

export async function setup(seed = 39, { job = 'warrior', flags = CLEAR } = {}) {
  // 時計は 昼から（おみやげ屋は 夜に にぎわう）
  const t0 = Date.now();
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => 50 * DAY_MS + Math.round(0.3 * DAY_MS) + (Date.now() - t0) });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of flags) c.flags[f] = true;
  gainExp(c, expForLevel(56) - c.exp);
  c.hp = computeStats(c).maxHp;
  c.gold = 1000;
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c };
}
// 戦いは すぐ 勝つ
export async function play(bot, max = 30000) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.done) continue;
      c2.done = true;
      for (let k = 0; k < 20; k++) {
        const alive = c2.battle.enemies.filter((e) => e.alive);
        if (!alive.length) break;
        for (const e of alive) c2.battle.kill(e);
      }
      c2.battle.checkEnd();
    }
    bot.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    if (!bot.s.busy && !bot.queue.length && !bot.inBattle && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      if (!bot.s.busy && !bot.queue.length && !world.battles.size) return true;
    }
  }
  return false;
}
export const place = async (bot, map, x, y) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'up', true);
  await play(bot);
};
export const npcAnywhere = (id) => {
  for (const m of Object.values(MAPS)) {
    const n = m.npcs.find((x) => x.id === id);
    if (n) return { map: m.id, n };
  }
  return null;
};
// NPC の となりへ 行って 話す。choices … 選たくしが 来るたびに 1つずつ（たりない 時は 0）
export async function talkTo(bot, id, choices = []) {
  const list = [...choices];
  const orig = bot.onMsg;
  bot.onMsg = (m) => {
    if (m.t === 'script' && !m.spectator) {
      const last = m.steps[m.steps.length - 1];
      if (last?.[0] === 'choice') bot.choice = list.length ? list.shift() : 0;
    }
    orig.call(bot, m);
  };
  const { map, n } = npcAnywhere(id);
  const m = MAPS[map];
  const nx = Math.floor(n.x), ny = Math.floor(n.y);
  const has = () => true;
  let spot = null;
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [2, 0], [-2, 0], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = nx + dx, y = ny + dy;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    if (!isBlocked(m, x, y, has) && !m.warpAt.has(y * m.w + x) && !m.npcs.some((o) => o !== n && o.solid && Math.floor(o.x) === x && Math.floor(o.y) === y)) { spot = [x, y]; break; }
  }
  assert.ok(spot, `${id} の となりに 立てる`);
  await place(bot, map, spot[0], spot[1]);
  const before = bot.msgs.length;
  bot.send({ t: 'interact', kind: 'npc', id });
  await play(bot);
  bot.onMsg = orig;
  bot.choice = 0;
  return bot.msgs.slice(before);
}
// 話の 中の ことば
export const said = (msgs, re) => msgs.some((m) => m.t === 'script' && m.steps.some((st) => (st[0] === 'say' || st[0] === 'choice') && re.test(String(st[0] === 'say' ? st[2] : st[1]))));
export const spoke = (msgs, who) => msgs.some((m) => m.t === 'script' && m.steps.some((st) => st[0] === 'say' && st[1] === who));
export const battled = (msgs, id) => msgs.some((m) => m.t === 'battleStart' || (m.t === 'script' && m.steps.some((st) => st[0] === 'battle' && st[1] === id)));
