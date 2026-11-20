// テスト用: 第3部 第1章 第1幕「星ふるえの夜」を 世界で 遊ぶ 手（test/ch9-act1-a.test.js・test/ch9-act1.test.js）
// ・play … だいほん・戦いを すすめる。戦いは ふつうは すぐ 勝たせる（lose で 負けさせる）。real を わたすと 本当に 戦う
//   real(固定の 戦いの id) … 'know'（知っている 人の 動き。tools/sim-ch9.mjs と 同じ）・'auto'（完全オート）・null（すぐ 勝たせる）
// ・place・stepOn・touch・talkTo・walkTo … 立つ・1歩・しらべる・話す・歩く（かべ・宝箱・見えない 穴を よける）
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, canStand } from '../public/js/shared/maps/index.js';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { objectiveFromFlags } from '../public/js/shared/data/progress.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { MODES9 } from '../tools/sim-ch9.mjs';
import { Bot, tickN } from './helpers.js';

export const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
export const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
export const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
export const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  c.jobs[c.job] = { lv: 10, b: 999 };
}
export async function addPlayer(world, name, upto, extra = [], job = 'warrior') {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  boost(c, 96);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { bot, c };
}
// 決まった 時計の 世界（たねと 時計が 同じなら 戦いも 同じ。時計は 1回の tick で dt すすむ。昼の 10時から）
export function fixedWorld(seed, opts = {}) {
  let t = Date.UTC(2026, 10, 20, 1, 0, 0);
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => t, ...opts });
  const tick0 = world.tick.bind(world);
  world.tick = (dt) => { t += dt; return tick0(dt); };
  return world;
}
export async function setup(seed, upto = 'c8_solitus', extra = [], job = 'warrior') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const { bot, c } = await addPlayer(world, 'ソラ', upto, extra, job);
  return { world, bot, c };
}
export function finish(ctx2, lose) {
  const b = ctx2.battle;
  if (lose) {
    for (const a of b.allies) if (a.alive) b.kill(a);
  } else {
    for (let k = 0; k < 20; k++) {
      const alive = b.enemies.filter((e) => e.alive);
      if (!alive.length) break;
      for (const e of alive) b.kill(e);
    }
  }
  b.checkEnd();
}
// 本当の 戦い: 家族の 手で 動かす（mode 'know' … しくみを 知って いる 人・'auto' … 完全オート。ゲストと 星の子は いつもの まま）
export function drive(ctx2, mode) {
  const b = ctx2.battle;
  if (b.over || b.pendingEnd) return;
  const M = MODES9[mode];
  if (M.know) b.knowsCh9 = mode;
  for (const a of b.allies) {
    if (a.kind === 'guest') continue;
    // 人が 動かす キャラ（家族）は オート（b.knowsCh9 が あるので しくみを 知って いる 動き。合体技に 「参加する？」と 聞かれない）
    if (a.controller && a.controller !== 'sim') { a.auto = true; continue; }
    // 家族の 仲間（パーティーに 入れた 家族の キャラ）は tools/sim-ch9.mjs の 手（'sim' の 名前で コマンドを 出す）
    a.auto = !M.know;
    if (!M.know) continue;
    a.controller = 'sim';
    if (!a.ready || !a.alive) continue;
    if (!M.act || !M.act(b, a)) {
      a.ready = false;
      b.enqueue(a, { type: 'ai' });
    }
  }
}
export async function play(bot, { lose = () => false, real = () => null, fought = null, max = 40000, bots = [], onTick = null } = {}) {
  const world = bot.world;
  const all = [bot, ...bots];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd) continue;
      const mode = real(c2.opts.fixed);
      if (!c2.done) {
        c2.done = true;
        if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
        if (!mode) { finish(c2, lose(c2.opts.fixed)); continue; }
      }
      if (mode) drive(c2, mode);
    }
    for (const b of all) b.flushQueue();
    await tickN(world, 1);
    for (const b of all) b.flushQueue();
    if (onTick) await onTick(i);
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (all.every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const b of all) b.flushQueue();
      if (all.every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
export const place = async (bot, map, x, y, dir = 'up', opts) => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await play(bot, opts);
};
export async function stepOn(bot, x, y, opts) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot, opts);
}
export const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
export const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };
// となりに 立って しらべて えらぶ
export async function touch(bot, p, choice = 0, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has));
  assert.ok(side, `${map.id} ${p.x},${p.y} の となりに 立てる`);
  await place(bot, bot.s.map, side[0], side[1], 'up', opts);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}
// 人の となりに 立って 話す
export async function talkTo(bot, mapId, id, choice = 0, opts) {
  const n = MAPS[mapId].npcById[id];
  assert.ok(n, id);
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [Math.floor(n.x) + dx, Math.floor(n.y) + dy]).find(([x, y]) => canStand(MAPS[mapId], x + 0.5, y + 0.5, has));
  assert.ok(side, `${id} の となり`);
  await place(bot, mapId, side[0], side[1], 'up', opts);
  bot.choice = choice;
  await talk(bot, id, opts);
  bot.choice = 0;
}
// 今の 場所から (tx, ty) まで 1歩ずつ 歩く（かべ・宝箱・見えない 穴・出入り口は よける。行き先が 出入り口なら ふむ）
export function pathTo(map, sx, sy, tx, ty, has, avoidHoles = true) {
  const holes = new Set(avoidHoles ? map.c9a?.holes || [] : []);
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (x === tx && y === ty) {
      const out = [];
      for (let k = y * map.w + x; k !== sy * map.w + sx; k = prev.get(k)) out.unshift([k % map.w, Math.floor(k / map.w)]);
      return out;
    }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || prev.has(k)) continue;
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(k) || holes.has(k)) continue;
      if (map.warpAt.has(k) && !(nx === tx && ny === ty)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
export async function walkTo(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) await stepOn(bot, x, y, opts);
}
