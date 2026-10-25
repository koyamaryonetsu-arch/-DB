// 第2部 第6章「時の砂時計」Step 5（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c6_kanata → 今の ばあちゃん（星の塔の かね）→ 星の塔 1階の 新しい かべ画 → 千年前の 北の 山で リオンと ミナモ（c6_clock。リオンが ゲスト・星読みの しおり）
// → 止まった時計塔（c6_tower。1〜5階）→ 5階 かねつきのからくり カリヨン（c6_bell）→ 塔の 上で 大時計が 動き出す（c6_heart）
// 戦いの しくみ（カリヨン）と 魔物・品・リオンの 強さは B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { CH6_MAPS, CH6B_MAPS, CH6C_MAPS } from '../public/js/shared/maps/ch6.js';
import { PAST_ID } from '../public/js/shared/maps/past.js';
import { TOWER_OUT } from '../public/js/shared/maps/tower.js';
import {
  C6C, BELL_NEWS, MURAL6, TF, HOUR, TURN3, OPEN5, WAIT5, BM, UNFREEZE, TK_POS, TK_OUT, TK_MEET, TK_FLOORS, TK_MAPS, TK_REST, TK_LINK, TK_BOSS_FLOOR,
  LINK_TOWER, MURAL_NEW_AT, VANE_AT, STOP_STEPS, CLOCKS, handCells, rimCell, hourOf, tkMapId, tkArrive, frozenAt,
} from '../public/js/shared/maps/tokei.js';
import { TK_ROWS } from '../public/js/shared/maps/tokei-rows.js';
import { ORN, ORN_SPOTS, ORN_NEED, TOKINE_SPOT } from '../public/js/shared/maps/ch6c-side.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH6_STEPS, C6_OBJ, OLD_C6_OBJ, CH6_OBJECTIVE_TARGETS, CH6_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch6.js';
import { C6B_OBJ } from '../public/js/shared/data/story-ch6b.js';
import { CH6C_STEPS, C6C_OBJ, CH6C_STORY_SCRIPTS, TK_HINTS, BOOKMARK, endingFromBell } from '../public/js/shared/data/story-ch6c.js';
import { CH6C_SIDE_QUESTS } from '../public/js/shared/data/sidequests-ch6c.js';
import { labDoneQuests, sideQuestHint } from '../public/js/shared/data/sidequests.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
// 時計塔の 宝箱の 中み（B の data/items-tower.js。まとめる 時に そちらから）
import { TOWER_TREASURE_FLOORS } from '../public/js/shared/data/items-tower.js';
import { TIME_GLASS, GLASS_TEXT } from '../public/js/shared/world/time-glass.js';
import { STOP_TEXT } from '../public/js/shared/world/tokei.js';
import { BOOK_TEXT } from '../public/js/shared/world/tokei-use.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { DAY_MS, FIRE_HALF } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const toasted = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => (m.t === 'toast' || m.t === 'menuRes') && String(m.text || '').includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const STEP5 = ['c6_clock', 'c6_tower', 'c6_bell', 'c6_heart'];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで。リオンは c6_clock から ゲスト・星読みの しおりも
async function setup(seed, upto = 'c6_kanata', { extra = [], rion = null, frac = 0.2 } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  const inGuest = rion ?? !!c.flags.c6_clock;
  c.guests = inGuest ? ['rion'] : [];
  if (c.flags.c6_clock) c.keyItems.push(BOOKMARK);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 65);
  world.sendSelf(bot.s);
  bot.s.repelUntil = 1e15;
  return { world, bot, c, clock };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await play(bot);
};
async function stepOn(bot, x, y, opts) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  return play(bot, opts);
}
const talk = (bot, id, opts) => { bot.send({ t: 'interact', kind: 'npc', id }); return play(bot, opts); };
const examine = (bot, x, y, opts) => { bot.send({ t: 'interact', kind: 'tile', x, y }); return play(bot, opts); };
const useGlass = (bot, opts) => { bot.send({ t: 'menu', action: 'timeGlass' }); return play(bot, opts); };
const useBook = (bot, opts) => { bot.send({ t: 'menu', action: 'bookmark' }); return play(bot, opts); };

function finish(ctx2, lose) {
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
async function play(bot, { lose = () => false, fought = null, max = 40000, others = [], stopAt = null, from = 0 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    if (stopAt && said(bot, stopAt, from)) {
      bot.queue = [];
      world.disconnect(bot.s, bot.conn);
      await tickN(world, 2);
      return 'cut';
    }
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
    }
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    for (const o of others) o.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      for (const o of others) o.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
async function reconnect(world, old) {
  const id = old.char.id;
  const bot = new Bot(world, old.name);
  await bot.login();
  bot.send({ t: 'play', id });
  await bot.settle();
  bot.s.repelUntil = 1e15;
  return bot;
}
// その 人の いる マップで (tx, ty) まで 歩く（とびら・宝箱・人を さける。ドッスンは 時計を すすめて 待つ）
async function walkTo(bot, tx, ty, opts = {}) {
  const w = bot.world;
  const s = bot.s;
  const map = MAPS[s.map];
  const has0 = w.hasFlagFn(s);
  const has = (f) => (f === '@fireA' || f === '@fireB' ? false : has0(f));
  const ok = (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has)) return false;
    const k = y * map.w + x;
    if (map.warpAt.has(k) && !(x === tx && y === ty)) return false;
    const ch = map.chestAt.get(k);
    if (ch && condOk(ch.show, has)) return false;
    return !map.npcs.some((n) => n.solid && condOk(n.show, has) && Math.floor(n.x) === x && Math.floor(n.y) === y);
  };
  const sx = Math.floor(s.x), sy = Math.floor(s.y);
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (prev.has(k) || !ok(nx, ny)) continue;
      prev.set(k, [x, y]);
      q.push([nx, ny]);
    }
  }
  assert.ok(prev.has(ty * map.w + tx), `${s.map}: (${sx},${sy}) → (${tx},${ty}) へ 歩いて 行ける`);
  const path = [];
  for (let cur = [tx, ty]; cur; cur = prev.get(cur[1] * map.w + cur[0])) path.unshift(cur);
  for (const [x, y] of path.slice(1)) {
    // ドッスン: 落ちている 石の 前で 待つ（炎の 柱と おなじ 時間で こうたい）
    for (let k = 0; k < 3 && opts.clock && isBlocked(map, x, y, w.hasFlagFn(s)); k++) opts.clock.now += FIRE_HALF;
    await stepOn(bot, x, y, opts);
    if (s.map !== map.id || Math.floor(s.x) !== x || Math.floor(s.y) !== y) break; // ワープ・入口へ もどされた
  }
}
// ふたりで あそぶ（さそう・うける）
async function family(seed, upto = 'c6_clock', extraFlags = []) {
  const clock = { now: at(0.2) };
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false, now: () => clock.now });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO(upto), ...extraFlags]) Pa.char.flags[f] = true;
  Pa.char.keyItems.push(TIME_GLASS);
  if (Pa.char.flags.c6_clock) { Pa.char.guests = ['rion']; Pa.char.keyItems.push(BOOKMARK); }
  boost(Pa.char, 65);
  boost(Y.char, 65);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y, clock };
}

// ───────────── 時計塔の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（3階だけ。'past' … 時計塔 / 'now' … 今の 星の塔 2階）・場所・フラグ・ドッスンの 時間（0 … a が 落ちる / 1 … b が 落ちる）・
//   止まった 部屋の のこりの 歩数（-1 … 部屋の 外）
// うごき … 歩く（止まった 部屋は 歩数で 入口へ）・待つ（ドッスンの 時間。待てるのは どちらの 時間でも ふさがらない マスだけ）・
//   針の スイッチ（1時間 すすめる）・3階の 時の すきま（時の 砂時計）と 今の 星の塔の 風見の石・5階の 歯車の 石（ひとりは リオンに 待ってもらう）
// opts: start … はじめの フラグ / from … はじめの 場所 { era, x, y } / shift … 時の 砂時計 / levers … スイッチ / rion … リオンが いる / water … 止まった 水を 歩く
function tkSolve(n, { start = [], from = null, shift = true, levers = true, rion = true, water = true } = {}) {
  const P = TK_POS[n];
  const past = MAPS[tkMapId(n)], now = n === TK_LINK ? MAPS[LINK_TOWER] : null;
  const a = tkArrive(n);
  const s0 = { era: from?.era || 'past', x: from?.x ?? Math.floor(a.x), y: from?.y ?? Math.floor(a.y), flags: [TF(TK_LINK), ...start], phase: 0, left: -1 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${s.left}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const thud = P.thudA.length + P.thudB.length > 0;
  const room = past.stopRooms?.[0];
  while (q.length) {
    const s = q.shift();
    cells.add(`${s.era}:${s.x},${s.y}`);
    const map = s.era === 'past' ? past : now;
    const has = (f) => (f === '@fireA' ? s.phase === 0 : f === '@fireB' ? s.phase === 1 : s.flags.includes(f));
    const push = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    const npcAt = (x, y) => map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.floor(m.x) === x && Math.floor(m.y) === y);
    for (const [dx, dy] of D4) {
      const nx = s.x + dx, ny = s.y + dy;
      if (isBlocked(map, nx, ny, has) || npcAt(nx, ny) || map.chestAt.has(ny * map.w + nx)) continue;
      const w = map.warpAt.get(ny * map.w + nx);
      if (w) { if (s.era === 'past' && P.up && nx === P.up.x && ny === P.up.y) goals.push(s); continue; }
      if (!water && map === past && TK_ROWS[n][ny][nx] === 'W') continue;
      let left = -1, x = nx, y = ny;
      if (map === past && room?.cells.has(ny * map.w + nx)) {
        if (s.left < 0) left = room.steps - 1;
        else if (s.left === 0) { x = Math.floor(room.back.x); y = Math.floor(room.back.y); left = -1; }
        else left = s.left - 1;
      }
      push({ ...s, x, y, left });
    }
    // 待つ（ドッスンの 時間）
    if (thud) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) === 1;
    // 針の スイッチ
    if (levers && s.era === 'past' && CLOCKS[n] && P.levers.some(near)) {
      const next = (hourOf(n, has) + 1) % 12;
      push({ ...s, flags: [...s.flags.filter((f) => !f.startsWith(`c6_t${n}_h`)), HOUR(n, next)] });
    }
    // 3階: 時の すきま・今の 星の塔の 風見の石
    if (n === TK_LINK) {
      const other = s.era === 'past' ? now : past;
      if (shift && P.gap.some((g) => g.x === s.x && g.y === s.y) && canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
      if (s.era === 'now' && near(VANE_AT) && !has(TURN3)) push({ ...s, flags: [...s.flags, TURN3] });
    }
    // 5階: 2つの 歯車の 石（ひとり … 2の 石で リオンに 待ってもらう → 1の 石）
    if (n === TK_BOSS_FLOOR && !has(OPEN5)) {
      if (rion && s.x === P.plate2.x && s.y === P.plate2.y && !has(WAIT5)) push({ ...s, flags: [...s.flags, WAIT5] });
      if (s.x === P.plate1.x && s.y === P.plate1.y && has(WAIT5)) push({ ...s, flags: [...s.flags.filter((f) => f !== WAIT5), OPEN5] });
    }
    if (n === TK_BOSS_FLOOR && s.y === P.trigger.y && s.x >= P.trigger.x && s.x < P.trigger.x + P.trigger.w) goals.push(s);
  }
  return { goals, seen, cells };
}
// 止まった 部屋の 入口から 出口まで（部屋の 中の マスの 数。water … 止まった 水を 歩く）
// 4階は 部屋の おくの 針の スイッチの 前まで（部屋の 出口は 入口だけ）
function stopPath(n, water = true) {
  const goal = n === 4 ? { x: CLOCKS[4].remote[0], y: CLOCKS[4].remote[1] + 1 } : null;
  const map = MAPS[tkMapId(n)];
  const room = map.stopRooms[0];
  const rows = TK_ROWS[n];
  const entry = [...room.cells].map((k) => ({ x: k % map.w, y: Math.floor(k / map.w) })).find((p) => Math.abs(p.x - room.back.x + 0.5) + Math.abs(p.y - room.back.y + 0.5) === 1);
  const dist = new Map([[entry.y * map.w + entry.x, 1]]);
  const q = [entry];
  let best = Infinity;
  while (q.length) {
    const p = q.shift();
    const d = dist.get(p.y * map.w + p.x);
    if (goal && p.x === goal.x && p.y === goal.y) best = Math.min(best, d);
    for (const [dx, dy] of D4) {
      const nx = p.x + dx, ny = p.y + dy, k = ny * map.w + nx;
      if (isBlocked(map, nx, ny, () => false) || map.chestAt.has(k)) continue;
      if (map.npcs.some((m) => m.solid && Math.floor(m.x) === nx && Math.floor(m.y) === ny)) continue;
      if (!room.cells.has(k)) {
        if (!goal && !(nx === Math.floor(room.back.x) && ny === Math.floor(room.back.y))) best = Math.min(best, d);
        continue;
      }
      if (!water && rows[ny][nx] === 'W') continue;
      if (dist.has(k)) continue;
      dist.set(k, d + 1);
      q.push({ x: nx, y: ny });
    }
  }
  return { best, entry, room };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 15）: 物語の すすみ・マップの ID・出現表・きまった 戦い・曲・宝箱・ゲスト・大事な物・タイル', async () => {
  assert.deepEqual(CH6C_STEPS, STEP5);
  const ki = CH6_STEPS.indexOf('c6_kanata');
  assert.deepEqual(CH6_STEPS.slice(ki + 1), STEP5, 'c6_kanata の うしろ');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c6_kanata') + 1, STORY_STEPS.indexOf('c6_kanata') + 5), STEP5);
  const want = ['tokei_1f', 'tokei_2f', 'tokei_3f', 'tokei_4f', 'tokei_5f'];
  assert.deepEqual(TK_MAPS, want);
  assert.deepEqual(CH6C_MAPS, want);
  assert.ok(!CH6_MAPS.includes('tokei_1f') && !CH6B_MAPS.includes('tokei_1f'), 'Step 1〜4 の 一らんは そのまま');
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.kind === 'dungeon' && !m.indoor && m.past, `${id}: 千年前だけの 塔`);
    assert.ok(m.tiles instanceof Uint16Array, `${id}: 256 いじょうの タイル`);
    assert.ok(m.w >= 40 && m.h >= 22, `${id}: 広め`);
    assert.equal(m.theme, 'tokei');
  }
  assert.equal(MAPS.tokei_3f.w, MAPS[LINK_TOWER].w);
  assert.equal(MAPS.tokei_3f.h, MAPS[LINK_TOWER].h);
  assert.equal(LINK_TOWER, 'star_tower_2f');
  assert.deepEqual([MAPS.tokei_3f.w, MAPS.tokei_3f.h], [42, 22], '3階は 今の 星の塔 2階と おなじ 42×22');
  // 出現表（B）: 1〜5階 t6_tower_low
  for (const id of want) assert.ok(MAPS[id].spawnCounts.t6_tower_low > 0, `${id} の 出現表`);
  assert.ok(ENCOUNTER_TABLES.t6_tower_low?.length);
  // きまった 戦い（B）・曲
  const fx = FIXED_ENCOUNTERS.carillon;
  assert.ok(fx && fx.boss && !fx.canFlee && !fx.loseOk, 'carillon');
  const { _TRACKS } = await import('../public/js/client/audio.js');
  for (const id of ['tokei', 'boss6', 'zenmai']) assert.ok(_TRACKS[id], `曲 ${id}`);
  assert.equal(MAPS.tokei_1f.bgm, 'tokei');
  assert.equal(MAPS.tokei_5f.bgm, 'zenmai');
  // 休み所（3階）
  assert.equal(TK_REST, 3);
  const F = TK_POS[3].font;
  assert.ok(F && MAPS.tokei_3f.actionAt.get(F.y * MAPS.tokei_3f.w + F.x)?.script === 'c6_tfont', '時の いずみ');
  assert.equal(MAPS.tokei_3f.zoneAt(F.x, F.y + 1), 'safe:rest');
  // 宝箱（B の TOWER_TREASURE_FLOORS を 1階ごとに 2つ）
  for (let n = 1; n <= TK_FLOORS; n++) {
    const mine = MAPS[tkMapId(n)].chests.filter((c) => c.id.startsWith(`k6_${n}c`)).map((c) => c.item).sort();
    assert.deepEqual(mine, [...TOWER_TREASURE_FLOORS[n]].sort(), `${n}階の 宝箱`);
  }
  // 5階: カリヨン（大きな 人の え。pendula_npc と おなじ 形）
  const K = MAPS.tokei_5f.npcById.carillon_npc;
  assert.ok(K?.big && K.show?.not?.includes(C6C.bell));
  // ゲスト・大事な物・より道の 品
  assert.ok(GUESTS.rion?.name === 'リオン', 'GUESTS.rion（B の RION_GUEST。まとめる 前は 仮）');
  assert.equal(ITEMS[BOOKMARK]?.type, 'key');
  assert.equal(ITEMS[BOOKMARK].menuUse, 'bookmark');
  assert.ok(ITEM_KANA[BOOKMARK]);
  const br = ITEMS.c6s_orn_brooch;
  assert.ok(br?.type === 'acc' && br.rank === 10 && br.rarity === 4 && br.src === 'gift' && ITEM_KANA.c6s_orn_brooch, '★5 の アクセ');
  // タイル（289 から。266〜279 は あけたまま）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.CLOCK_PIT, T.HAND_BRIDGE, T.CLOCK_HUB, T.HAND_SWITCH, T.CLOCK_PAINT, T.THUD_FLOOR, T.THUD_STONE, T.STOP_FLOOR, T.STOP_WATER,
    T.BIG_GEAR, T.GEAR_FLAT, T.TIME_GAP, T.CLOCK_DOOR, T.BIG_BELL, T.FROZEN_TREE, T.FROZEN_GRASS, T.MURAL_NEW, T.CLOCK_FACE];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 289 + i));
  assert.ok(!ids.some((v) => v >= 266 && v < 280));
  for (const id of mine) assert.ok(TILE_INFO[id], `${id}`);
  // パーティー全員で 見る だいほん
  for (const id of CH6C_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
});

// ───────────── 目標 ─────────────
test('目標: c6_kanata の あとの 目標・フラグごとの 目標・前の 版の「続きはアップデート」は なおる・仲間会話・地図の しるし', () => {
  assert.equal(OLD_C6_OBJ.kanata, '第6章の続きはアップデートで！');
  assert.equal(OLD_C6_OBJ.flow, '第6章の続きはアップデートで！');
  assert.equal(C6C_OBJ.heart, '第6章の続きはアップデートで！', 'さいごは また「続きはアップデート」');
  assert.equal(C6B_OBJ.kanata, C6C_OBJ.kanata);
  assert.notEqual(C6B_OBJ.kanata, OLD_C6_OBJ.kanata);
  // 前の 版で c6_kanata まで 遊んだ セーブは、ばあちゃんへの 目標に なおる（c6_flow までの 人は ミナモへ）
  const old = { flags: flagsOf(...UPTO('c6_kanata')), objective: OLD_C6_OBJ.kanata };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, C6C_OBJ.kanata);
  const older = { flags: flagsOf(...UPTO('c6_flow')), objective: OLD_C6_OBJ.flow };
  assert.ok(repairObjective(older) && older.objective === C6_OBJ.flow);
  const done = { flags: flagsOf(...UPTO('c6_heart')), objective: C6C_OBJ.heart };
  assert.ok(!repairObjective(done), 'c6_heart の あとは そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const table = [
    [['c6_kanata'], C6C_OBJ.kanata], [['c6_kanata', BELL_NEWS], C6C_OBJ.news], [['c6_kanata', BELL_NEWS, MURAL6], C6C_OBJ.mural],
    [['c6_kanata', MURAL6], C6C_OBJ.mural], [['c6_clock'], C6C_OBJ.clock], [['c6_tower'], C6C_OBJ.tower], [['c6_tower', TF(2)], C6C_OBJ.tf2],
    [['c6_tower', TF(3)], C6C_OBJ.tf3], [['c6_tower', TF(3), TURN3], C6C_OBJ.gear], [['c6_tower', TF(4)], C6C_OBJ.tf4], [['c6_tower', TF(5)], C6C_OBJ.tf5],
    [['c6_bell'], C6C_OBJ.bell], [['c6_heart'], C6C_OBJ.heart],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of Object.entries(C6C_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH6_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH6_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  assert.ok(C6C_OBJ.mural.includes('千年前') && C6C_OBJ.tf3.includes('今の星の塔'), '時代を はっきり');
  // 地図の しるし（その 時代の マップの しるし だけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(C6C_OBJ.news, 'star_tower_1f').some((m) => m.x === MURAL_NEW_AT.x && m.y === MURAL_NEW_AT.y), '星の塔 1階の かべ画');
  const D = TK_OUT.door;
  assert.ok(mark(C6C_OBJ.clock, PAST_ID).some((m) => m.x === D.x && m.y === D.y), '千年前の 時計塔の とびら');
  assert.ok(!mark(C6C_OBJ.clock, 'overworld').some((m) => m.x === D.x && m.y === D.y), '今の 星の塔には 出ない');
  assert.ok(mark(C6C_OBJ.tf3, LINK_TOWER).some((m) => m.x === VANE_AT.x && m.y === VANE_AT.y), '今の 星の塔の 風見の石');
  assert.ok(!mark(C6C_OBJ.tf3, LINK_TOWER, [TURN3]).some((m) => m.x === VANE_AT.x && m.y === VANE_AT.y), '回したら 消える');
  const B = MAPS.tokei_5f.npcById.carillon_npc;
  assert.ok(mark(C6C_OBJ.tf5, 'tokei_5f').some((m) => m.x === Math.floor(B.x)), 'カリヨン');
});

// ───────────── 入口・灰色の 森・今の 星の塔 ─────────────
test('千年前の 北の 山の 止まった時計塔（今の 星の塔と おなじ 場所。c6_kanata から 見え、c6_clock で 開く）・灰色の 森・今の 星の塔の かべ画と 時の すきま', () => {
  const past = MAPS[PAST_ID], now = MAPS.overworld;
  const D = TK_OUT.door;
  assert.deepEqual([D.x, D.y], [TOWER_OUT.door.x, TOWER_OUT.door.y], '今の 星の塔の とびらと おなじ 座標');
  const before = (f) => f !== 'c6_kanata' && false;
  const k = (f) => f === 'c6_kanata';
  const open = (f) => f === 'c6_kanata' || f === 'c6_clock';
  assert.notEqual(effectiveTile(past, D.x, D.y, before), T.CLOCK_DOOR, 'c6_kanata の 前は 山の まま');
  assert.equal(effectiveTile(past, D.x, D.y, k), T.CLOCK_DOOR);
  assert.ok(isBlocked(past, D.x, D.y, k) && !isBlocked(past, D.x, D.y, open), 'c6_clock で 開く');
  assert.equal(past.warps.find((w) => w.x === D.x && w.y === D.y).to.map, 'tokei_1f');
  assert.ok(!condOk(past.npcById.clock_tower.show, before) && condOk(past.npcById.clock_tower.show, k), '塔の すがた');
  // 灰色の 森（c6_kanata から。UNFREEZE〈Step 6〉で 元に もどる）
  let gray = 0;
  for (const g of past.gates) {
    if (!g.levels || !g.levels.some(([fl]) => fl === UNFREEZE)) continue;
    gray++;
    assert.ok(frozenAt(g.x, g.y));
    assert.ok([T.FROZEN_TREE, T.FROZEN_GRASS].includes(effectiveTile(past, g.x, g.y, k)));
    assert.equal(effectiveTile(past, g.x, g.y, (f) => f === UNFREEZE || f === 'c6_kanata'), g.closed, '動き出すと 元の 木と 草');
    assert.equal(isBlocked(past, g.x, g.y, k), isBlocked(past, g.x, g.y, () => false), '歩ける ところは かわらない');
  }
  assert.ok(gray > 60, `灰色の 森 ${gray}`);
  // 千年前の ホシフルの里から 歩いて ふもとへ（リオンに 会う 所・とびらの 前）
  const reach = (m, start, has) => {
    const seen = new Set([start[1] * m.w + start[0]]);
    const q = [start];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy, kk = ny * m.w + nx;
        if (seen.has(kk) || isBlocked(m, nx, ny, has)) continue;
        seen.add(kk);
        if (!m.warpAt.has(kk)) q.push([nx, ny]);
      }
    }
    return (x, y) => seen.has(y * m.w + x);
  };
  const rp = reach(past, [27, 104], k);
  assert.ok(rp(D.x, D.y + 1), 'とびらの 前');
  let meet = 0;
  for (let y = TK_MEET.y; y < TK_MEET.y + TK_MEET.h; y++) for (let x = TK_MEET.x; x < TK_MEET.x + TK_MEET.w; x++) if (rp(x, y)) meet++;
  assert.ok(meet >= 5, 'リオンに 会う 所');
  // 今の 星の塔の 前で 時の 砂時計を 使うと、千年前の とびらの 前（ふもと）
  assert.ok(canStand(past, D.x + 0.5, D.y + 1.5, k) && canStand(now, D.x + 0.5, D.y + 1.5, k), '星の塔の 前 ⇔ 時計塔の 前');
  // 泉の里の リオンは、ゲストで いっしょの 間 いない
  assert.ok(!condOk(past.npcById.rion.show, (f) => ['c6_rion', 'c6_clock'].includes(f)) && condOk(past.npcById.rion.show, (f) => f === 'c6_rion'));
  // 塔の 1階から 出ると ふもと（みちびきの糸も）
  for (let n = 1; n <= TK_FLOORS; n++) {
    const ex = dungeonExit(null, { map: tkMapId(n), char: {} });
    assert.ok(ex && ex.map === PAST_ID && Math.abs(ex.x - TK_OUT.arrive.x) < 1, `${n}階: 糸で 千年前の ふもとへ`);
  }
  // 今の 星の塔 1階の 新しい かべ画（c6_kanata から）・2階の 時の すきまと 風見の石（時計塔の 3階に 来てから）
  const f1 = MAPS.star_tower_1f, f2 = MAPS[LINK_TOWER];
  const M = MURAL_NEW_AT;
  assert.equal(effectiveTile(f1, M.x, M.y, () => false), T.CAVE_WALL);
  assert.equal(effectiveTile(f1, M.x, M.y, k), T.MURAL_NEW);
  assert.ok(f1.actionAt.get(M.y * f1.w + M.x)?.script === 'c6_mural_new');
  assert.ok(f1.tiles instanceof Uint8Array && f1.tiles[M.y * f1.w + M.x] < 256, '星の塔の タイルの ならびは かえない（とびらで 見せる）');
  for (const g of TK_POS[TK_LINK].gap) {
    assert.equal(effectiveTile(f2, g.x, g.y, () => false), T.CAVE_FLOOR, 'はじめは ふつうの ゆか');
    assert.equal(effectiveTile(f2, g.x, g.y, (fl) => fl === TF(3)), T.TIME_GAP, '時計塔の 3階に 来たら 光る');
    assert.equal(effectiveTile(MAPS.tokei_3f, g.x, g.y, () => false), T.TIME_GAP);
  }
  assert.equal(effectiveTile(f2, VANE_AT.x, VANE_AT.y, () => false), T.CAVE_FLOOR);
  assert.equal(effectiveTile(f2, VANE_AT.x, VANE_AT.y, (fl) => fl === TF(3)), T.VANE);
  assert.equal(effectiveTile(f2, VANE_AT.x, VANE_AT.y, (fl) => fl === TF(3) || fl === TURN3), T.VANE_ON);
  assert.equal(f2.timePair, 'tokei_3f');
  assert.equal(MAPS.tokei_3f.timePair, LINK_TOWER);
  // 3階の 東の 広間は 星の塔 2階の 東の 広間と おなじ 形
  for (let y = 8; y <= 17; y++) for (let x = 29; x <= 39; x++) {
    const a = isBlocked(f2, x, y, () => false), b = isBlocked(MAPS.tokei_3f, x, y, () => false);
    if (TK_POS[TK_LINK].gap.some((g) => g.x === x && g.y === y)) assert.ok(!a && !b, `時の すきま ${x},${y}`);
  }
  for (const id of ['tokei_1f', 'tokei_2f', 'tokei_4f', 'tokei_5f']) assert.equal(MAPS[id].timeBlock, 'tower');
  assert.ok(GLASS_TEXT.tower && GLASS_TEXT.gap);
});

// ───────────── 時計塔の とき方 ─────────────
test('時計塔: どの 階も ひとりで とける（針の 橋・ドッスン・止まった 部屋・時の すきま・歯車の 石）。しかけを 使わないと 行けない', () => {
  for (let n = 1; n <= TK_FLOORS; n++) assert.ok(tkSolve(n).goals.length, `${n}階: ひとりで 先へ 行ける`);
  // 1階・4階: 針を 回さないと 行けない（はじめは 12時）
  for (const n of [1, 4]) assert.equal(tkSolve(n, { levers: false }).goals.length, 0, `${n}階: 針を 回さないと 行けない`);
  // 1階・4階: 針を 止めた ままなら、まん中の 台へ わたれるのは 6時（来た がわ）だけ・まん中の 台から 先へ 行けるのは 1階 2時・4階 3時 だけ
  for (const n of [1, 4]) {
    const C = CLOCKS[n];
    const hub = `past:${C.cx},${C.cy + 1}`;
    for (let h = 0; h < 12; h++) {
      const st = [HOUR(n, h)];
      assert.equal(tkSolve(n, { levers: false, start: st }).cells.has(hub), h === C.enter, `${n}階 ${h}時: まん中の 台へ`);
      assert.equal(tkSolve(n, { levers: false, start: st, from: { era: 'past', x: C.cx, y: C.cy + 1 } }).goals.length > 0, h === C.goal, `${n}階 ${h}時: まん中の 台から 先へ`);
    }
  }
  // 2階・4階: 止まった 水を 歩かないと 行けない
  for (const n of [2, 4]) assert.equal(tkSolve(n, { water: false }).goals.length, 0, `${n}階: 止まった 水の 上を 歩く`);
  // 3階: 千年前だけでは 歯車が 回らない（今の 星の塔の 風見の石）。今の 星の塔の 時の すきまから 来ても 行ける
  assert.equal(tkSolve(3, { shift: false }).goals.length, 0, '3階: 時の すきまを 使わないと 行けない');
  assert.ok(tkSolve(3).goals.every((s) => s.flags.includes(TURN3)));
  const g = TK_POS[TK_LINK].gap[0];
  assert.ok(tkSolve(3, { from: { era: 'now', x: g.x, y: g.y } }).goals.length, '3階: 今の 星の塔 2階の 時の すきまから 来ても 行ける');
  assert.ok(tkSolve(3, { start: [TURN3] }).goals.length, '回した あとは 千年前だけで');
  // 5階: 歯車の 石は ひとりなら リオンに 待ってもらう（リオンが いないと ひとりでは 開かない・2人なら 開く〈下の テスト〉）
  assert.equal(tkSolve(5, { rion: false }).goals.length, 0, '5階: リオンが いない ひとりは 開かない');
  assert.ok(tkSolve(5, { start: [OPEN5] }).goals.length);
  // 宝箱は どこかから 行ける（しかけを ぜんぶ 使って）
  for (let n = 1; n <= TK_FLOORS; n++) {
    const cells = tkSolve(n).cells;
    for (const c of MAPS[tkMapId(n)].chests) assert.ok(D4.some(([dx, dy]) => cells.has(`past:${c.x + dx},${c.y + dy}`)), `${n}階 宝箱 ${c.id}`);
  }
  // 上の 階 → 下の 階（もどれる）
  for (let n = 2; n <= TK_FLOORS; n++) {
    const w = MAPS[tkMapId(n)].warps.find((q) => q.x === TK_POS[n].down.x && q.y === TK_POS[n].down.y);
    assert.equal(w.to.map, tkMapId(n - 1));
  }
});

test('ドッスン（落ちてくる 石）: a と b は となりあわない・待てる ゆかが ある・ドッスンの 時間を 待って 通れる（第42回の 炎の 柱の 直し と おなじ きまり）', () => {
  let any = 0;
  for (const [n, rows] of Object.entries(TK_ROWS)) {
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch !== 'a' && ch !== 'b') return;
      any++;
      for (const [dx, dy] of D4) assert.notEqual(rows[y + dy]?.[x + dx], ch === 'a' ? 'b' : 'a', `${n}階 (${x},${y})`);
      // となりに どちらの 時間でも ふさがらない ゆか（待つ マス）
      const map = MAPS[tkMapId(Number(n))];
      const both = (xx, yy) => !isBlocked(map, xx, yy, (f) => f === '@fireA') && !isBlocked(map, xx, yy, (f) => f === '@fireB');
      assert.ok(D4.some(([dx, dy]) => both(x + dx, y + dy)), `${n}階 (${x},${y}): となりに 待てる ゆか`);
    }));
  }
  assert.ok(any >= 20);
  for (const n of [2, 5]) {
    const map = MAPS[tkMapId(n)];
    const a = TK_POS[n].thudA[0], b = TK_POS[n].thudB[0];
    assert.equal(effectiveTile(map, a.x, a.y, (f) => f === '@fireA'), T.THUD_STONE);
    assert.equal(effectiveTile(map, a.x, a.y, (f) => f === '@fireB'), T.THUD_FLOOR);
    assert.equal(effectiveTile(map, b.x, b.y, (f) => f === '@fireB'), T.THUD_STONE);
    // 待たないと（時間が とまって いると）通れない
    assert.ok(tkSolve(n).goals.length);
  }
  // 時間を とめた さがし: ドッスンの 通路は 1つの 時間だけでは ぬけられない
  const frozenPhase = (n) => {
    const map = MAPS[tkMapId(n)];
    const P = TK_POS[n];
    for (const ph of ['@fireA', '@fireB']) {
      const has = (f) => f === ph || f === OPEN5;
      const a = tkArrive(n);
      const seen = new Set([`${Math.floor(a.x)},${Math.floor(a.y)}`]);
      const q = [[Math.floor(a.x), Math.floor(a.y)]];
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy] of D4) {
          const nx = x + dx, ny = y + dy;
          if (seen.has(`${nx},${ny}`) || isBlocked(map, nx, ny, has) || map.warpAt.has(ny * map.w + nx)) continue;
          seen.add(`${nx},${ny}`);
          q.push([nx, ny]);
        }
      }
      const beyond = n === 2 ? TK_POS[2].back : TK_POS[5].plate1;
      assert.ok(!seen.has(`${beyond.x},${beyond.y}`), `${n}階 ${ph}: 待たずには 通れない`);
    }
  };
  frozenPhase(2);
  frozenPhase(5);
});

test('止まった 部屋: 歩数で 止まりが 切れる（止まった 水の 上が 近道・まわり道では 間に 合わない）。止まった 魔物は 通れない', () => {
  for (const n of [2, 4]) {
    const r = stopPath(n);
    const dry = stopPath(n, false);
    assert.ok(r.best <= STOP_STEPS[n], `${n}階: 止まった 水の 上なら 間に 合う（${r.best}/${STOP_STEPS[n]}）`);
    assert.ok(dry.best > STOP_STEPS[n], `${n}階: まわり道では 間に 合わない（${dry.best}）`);
    assert.equal(r.room.steps, STOP_STEPS[n]);
    assert.ok(MAPS[tkMapId(n)].zoneAt(r.entry.x, r.entry.y).startsWith('safe'), '止まった 部屋は 魔物が 出ない');
  }
  // 止まった 魔物（人の え・通れない）
  const mons = MAPS.tokei_2f.npcs.filter((m) => m.id.startsWith('tk2_mon'));
  assert.ok(mons.length >= 3 && mons.every((m) => m.solid));
  assert.ok(STOP_TEXT.start(10).includes('10') && STOP_TEXT.back);
});

// ───────────── 大時計の 針（サーバー）─────────────
test('1階の 大時計（ひとりで）: スイッチで 針を 6時 → まん中の 台 → 2時 → 上の 階へ。針の 上に 人が いる ときは 回らない', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(7101, 'c6_tower');
  const C = CLOCKS[1];
  const [lx, ly] = C.levers[0];
  await place(bot, 'tokei_1f', lx - 1, ly);
  // 6時（3時間 × 2）
  bot.choice = 1;
  await examine(bot, lx, ly);
  await examine(bot, lx, ly);
  assert.equal(hourOf(1, (f) => !!c.flags[f]), 6, '6時');
  assert.ok(said(bot, '6時をさした'));
  // 針の 橋を わたって まん中の 台へ
  const hub = { x: C.cx, y: C.cy + 1 };
  await walkTo(bot, hub.x, hub.y);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [hub.x, hub.y], 'まん中の 台');
  // 2時（+3 +3 +1 +1）
  for (const ch of [1, 1, 0, 0]) { bot.choice = ch; await examine(bot, C.cx, C.cy); }
  assert.equal(hourOf(1, (f) => !!c.flags[f]), 2, '2時');
  const up = TK_POS[1].up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_2f', '2階へ');
  // 針の 上に 人が いる ときは 回らない
  const { bot: b2, c: c2 } = await setup(7102, 'c6_tower', { extra: [HOUR(1, 6)] });
  const cell = handCells(C, 6)[1];
  await place(b2, 'tokei_1f', cell.x, cell.y);
  const ws = b2.world.sessions;
  void ws;
  b2.world.placeSession(b2.s, 'tokei_1f', cell.x + 0.5, cell.y + 0.5, 'up', true);
  // 自分は 針の 上（まん中の スイッチは となりでなくても テストでは 直接 しらべる）
  b2.choice = 0;
  const f0 = b2.msgs.length;
  await examine(b2, C.cx, C.cy);
  assert.ok(said(b2, '針の上に、だれかが立っている', f0) && c2.flags[HOUR(1, 6)], '回らない');
});

// ───────────── 止まった 部屋（サーバー）─────────────
test('2階（ひとりで）: ドッスンを 待って 通る・止まった 部屋は まわり道だと 入口へ もどされる・止まった 水の 上なら ぬけられる', { timeout: 200000 }, async () => {
  const { bot, clock } = await setup(7201, 'c6_tower', { extra: [TF(2)] });
  const a = tkArrive(2);
  await place(bot, 'tokei_2f', Math.floor(a.x), Math.floor(a.y));
  const E = TK_POS[2].back;
  await walkTo(bot, E.x, E.y, { clock });
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [E.x, E.y], 'ドッスンの 通路を ぬけた');
  // まわり道（止まった 水を 通らない）: 東から 回って 北の すきまへ → 入口へ もどされる
  const f0 = bot.msgs.length;
  const route = [[20, 10], [20, 9]];
  for (let x = 21; x <= 31; x++) route.push([x, 9]);
  for (let y = 8; y >= 3; y--) route.push([31, y]);
  for (let x = 30; x >= 12; x--) route.push([x, 3]);
  for (const [x, y] of route) {
    await stepOn(bot, x, y);
    if (Math.floor(bot.s.y) === E.y && Math.floor(bot.s.x) === E.x) break;
  }
  assert.ok(toasted(bot, '止まった部屋だ', f0), 'はじまりの 知らせ');
  assert.ok(toasted(bot, '部屋の入口にもどされて', f0), 'まわり道は 入口へ');
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [E.x, E.y]);
  // 止まった 水の 上を 通る 近道
  const wet = [[20, 10], [20, 9]];
  for (let x = 19; x >= 4; x--) wet.push([x, 9]);
  for (let y = 8; y >= 4; y--) wet.push([4, y]);
  wet.push([3, 4]);
  for (const [x, y] of wet) await stepOn(bot, x, y);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [3, 4], '止まった 部屋を ぬけた');
  const up = TK_POS[2].up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_3f', '3階へ');
});

test('4階（ひとりで）: 止まった 部屋の おくの スイッチで 6時（止まりが 切れて 入口へ）→ 6時の ふち → まん中の 台で 3時 → 上の 階へ', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(7401, 'c6_tower', { extra: [TF(2), TF(3), TURN3, TF(4)] });
  const a = tkArrive(4);
  await place(bot, 'tokei_4f', Math.floor(a.x), Math.floor(a.y));
  const [rx, ry] = CLOCKS[4].remote;
  await walkTo(bot, rx, ry + 1);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [rx, ry + 1], 'おくの スイッチの 前');
  bot.choice = 1;
  await examine(bot, rx, ry);
  await examine(bot, rx, ry);
  assert.equal(hourOf(4, (f) => !!c.flags[f]), 6, '6時');
  // 歩いて もどると 止まりが 切れて 入口へ
  const E = TK_POS[4].back;
  const f0 = bot.msgs.length;
  for (let y = ry + 2; y <= 19; y++) { await stepOn(bot, rx, y); if (Math.floor(bot.s.y) === E.y) break; }
  if (Math.floor(bot.s.y) !== E.y) for (const [x, y] of [[7, 19], [6, 19], [6, 20]]) { await stepOn(bot, x, y); if (Math.floor(bot.s.y) === E.y) break; }
  assert.ok(toasted(bot, '部屋の入口にもどされて', f0) || Math.floor(bot.s.y) >= E.y, '止まった 部屋を 出た');
  const C = CLOCKS[4];
  await walkTo(bot, C.cx, C.cy + 1);
  assert.deepEqual([Math.floor(bot.s.x), Math.floor(bot.s.y)], [C.cx, C.cy + 1], 'まん中の 台');
  for (const ch of [1, 1, 1]) { bot.choice = ch; await examine(bot, C.cx, C.cy); }
  assert.equal(hourOf(4, (f) => !!c.flags[f]), 3, '3時');
  const up = TK_POS[4].up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_5f', '5階へ');
});

// ───────────── 3階: 時の すきま（今の 星の塔 2階と 行き来）─────────────
test('3階: 時の すきまの 上だけ 時の砂時計が 使える（今の 星の塔 2階へ）→ 今の 風見の石を 回すと 千年前の 歯車が 回って 道に', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(7301, 'c6_tower', { extra: [TF(2)] });
  const a = tkArrive(3);
  await place(bot, 'tokei_3f', Math.floor(a.x), Math.floor(a.y));
  assert.ok(c.flags[TF(3)] || (await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1), c.flags[TF(3)]), '3階に 来た');
  // 時の すきまの 外では 使えない
  const f0 = bot.msgs.length;
  await useGlass(bot);
  assert.ok(bot.s.map === 'tokei_3f' && toasted(bot, '時のすきま」の上で', f0), 'すきまの 外');
  // 1階・2階では 使えない
  const { bot: b1 } = await setup(7302, 'c6_tower');
  await place(b1, 'tokei_1f', 20, 22);
  const f1 = b1.msgs.length;
  await useGlass(b1);
  assert.ok(b1.s.map === 'tokei_1f' && toasted(b1, 'この塔の中では、時をこえられない', f1));
  // 時の すきま → 今の 星の塔 2階
  const g = TK_POS[TK_LINK].gap[0];
  const G = TK_POS[TK_LINK].gear[1];
  assert.ok(isBlocked(MAPS.tokei_3f, G.x, G.y, (f) => !!c.flags[f]), 'はじめは 歯車が ふさいでいる');
  await walkTo(bot, g.x, g.y);
  await useGlass(bot);
  assert.equal(bot.s.map, LINK_TOWER, '今の 星の塔 2階');
  assert.ok(said(bot, '今の世界にもどってきた'));
  // 星の塔の 中でも、時の すきまの 外では 使えない
  await walkTo(bot, VANE_AT.x, VANE_AT.y + 1);
  const f2 = bot.msgs.length;
  await useGlass(bot);
  assert.ok(bot.s.map === LINK_TOWER && toasted(bot, '時のすきま」の上で', f2));
  bot.choice = 0;
  await examine(bot, VANE_AT.x, VANE_AT.y);
  assert.ok(c.flags[TURN3], '風見の石を 回した');
  assert.ok(!isBlocked(MAPS.tokei_3f, G.x, G.y, (f) => !!c.flags[f]), '千年前の 歯車が 回って 道に');
  await walkTo(bot, g.x, g.y);
  await useGlass(bot);
  assert.equal(bot.s.map, 'tokei_3f');
  const up = TK_POS[3].up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_4f', '4階へ');
  // 3階に 来る 前は 今の 星の塔の すきまは ない（砂時計も 使えない）
  const { bot: b3, c: c3 } = await setup(7303, 'c6_clock');
  delete c3.flags[TF(3)];
  await place(b3, LINK_TOWER, g.x, g.y);
  const f3 = b3.msgs.length;
  await useGlass(b3);
  assert.ok(b3.s.map === LINK_TOWER && toasted(b3, GLASS_TEXT.none.split('\n')[0], f3), '3階に 来る 前');
});

// ───────────── 5階: 2つの 歯車の 石 ─────────────
test('5階の 歯車の 石: ひとり（リオンに 待ってもらう）・家族 2人（1人ずつ。どちらが 先でも。ものがたりは リーダーだけ）', { timeout: 200000 }, async () => {
  const P = TK_POS[5];
  {
    const { bot, c } = await setup(7501, 'c6_tower', { extra: [TF(5)] });
    await place(bot, 'tokei_5f', P.plate1.x + 1, P.plate1.y);
    const f0 = bot.msgs.length;
    await stepOn(bot, P.plate1.x, P.plate1.y);
    assert.ok(!c.flags[OPEN5] && said(bot, 'もう1つの歯車の石も', f0), 'ひとりでは 開かない');
    await place(bot, 'tokei_5f', P.plate2.x + 1, P.plate2.y);
    bot.choice = 0;
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(c.flags[WAIT5] && !c.flags[OPEN5], 'リオンが 待つ');
    await place(bot, 'tokei_5f', P.plate1.x + 1, P.plate1.y);
    await stepOn(bot, P.plate1.x, P.plate1.y);
    assert.ok(c.flags[OPEN5] && !c.flags[WAIT5], 'リオンが 石を おさえて 開いた');
    assert.ok(!isBlocked(MAPS.tokei_5f, P.z.x, P.z.y, (f) => !!c.flags[f]));
  }
  // リオンが いない ひとりは 待ってもらえない
  {
    const { bot, c } = await setup(7502, 'c6_tower', { rion: false, extra: [TF(5)] });
    await place(bot, 'tokei_5f', P.plate2.x + 1, P.plate2.y);
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(!c.flags[WAIT5]);
  }
  // 家族: ユイが 2、パパが 1（リオンには たのまない）
  for (const first of ['yui', 'papa']) {
    const { world, papa, yui, Pa, Y } = await family(first === 'yui' ? 7503 : 7504, 'c6_tower', [TF(5)]);
    world.placeSession(Pa, 'tokei_5f', P.plate1.x + 1.5, P.plate1.y + 0.5, 'left', true);
    world.placeSession(Y, 'tokei_5f', P.plate2.x + 1.5, P.plate2.y + 0.5, 'left', true);
    await play(papa, { others: [yui] });
    papa.choice = 1;
    yui.choice = 1;
    const yFlags = JSON.stringify(Y.char.flags);
    const steps = first === 'yui' ? [[yui, P.plate2], [papa, P.plate1]] : [[papa, P.plate1], [yui, P.plate2]];
    for (const [b, p] of steps) await stepOn(b, p.x, p.y, { others: [b === papa ? yui : papa] });
    assert.ok(Pa.char.flags[OPEN5] && !Pa.char.flags[WAIT5], `${first}が 先: 2人で 開いた`);
    assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは かわらない');
  }
});

test('家族 2人で 時計塔: ユイが 針を 回しても リーダーの 世界で 回る・止まった 部屋は 1人ずつ 数える・2人とも 上の 階へ', { timeout: 200000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(7601, 'c6_tower');
  const C = CLOCKS[1];
  const [lx, ly] = C.levers[0];
  world.placeSession(Pa, 'tokei_1f', lx - 0.5, ly + 1.5, 'up', true);
  world.placeSession(Y, 'tokei_1f', lx - 0.5, ly + 0.5, 'right', true);
  await play(papa, { others: [yui] });
  yui.choice = 1;
  await examine(yui, lx, ly, { others: [papa] });
  await examine(yui, lx, ly, { others: [papa] });
  assert.equal(hourOf(1, (f) => !!Pa.char.flags[f]), 6, 'リーダーの 世界で 6時');
  assert.ok(!Object.keys(Y.char.flags).some((f) => f.startsWith('c6_t1_h')), 'ユイの ものがたりは かわらない');
  // 2人とも まん中の 台へ → パパが 2時に → 2人とも 上の 階へ
  await walkTo(yui, C.cx - 1, C.cy + 1, { others: [papa] });
  await walkTo(papa, C.cx, C.cy + 1, { others: [yui] });
  for (const ch of [1, 1, 0, 0]) { papa.choice = ch; await examine(papa, C.cx, C.cy, { others: [yui] }); }
  assert.equal(hourOf(1, (f) => !!Pa.char.flags[f]), 2);
  const up = TK_POS[1].up;
  await walkTo(yui, up.x, up.y, { others: [papa] });
  await walkTo(papa, up.x, up.y, { others: [yui] });
  assert.ok(Pa.map === 'tokei_2f' && Y.map === 'tokei_2f', '2人とも 2階へ');
  // 止まった 部屋（4階）は 1人ずつ 数える
  world.placeSession(Pa, 'tokei_4f', 6.5, 21.5, 'up', true);
  world.placeSession(Y, 'tokei_4f', 7.5, 22.5, 'up', true);
  await play(papa, { others: [yui] });
  await stepOn(papa, 6, 20, { others: [yui] });
  await stepOn(papa, 6, 19, { others: [yui] });
  assert.ok(Pa.stopRoom && !Y.stopRoom, 'パパだけ 数えている');
  assert.equal(Pa.stopRoom.left, STOP_STEPS[4] - 2);
});

// ───────────── 通しで ─────────────
async function fullRun(bot, c, fought, clock) {
  const opts = { fought };
  // 今の ばあちゃん（星の塔の かね）
  const E = MAPS.overworld.npcById.elder;
  await place(bot, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
  await talk(bot, 'elder', opts);
  assert.ok(c.flags[BELL_NEWS] && c.objective === C6C_OBJ.news, 'かねの 話');
  // 星の塔 1階の 新しい かべ画
  const M = MURAL_NEW_AT;
  await place(bot, 'star_tower_1f', M.x, M.y + 1);
  await examine(bot, M.x, M.y, opts);
  assert.ok(c.flags[MURAL6] && c.objective === C6C_OBJ.mural, 'かべ画');
  // 今の 星の塔の 前で 時の 砂時計 → 千年前の 北の 山 → ふもとで リオンと ミナモ（c6_clock）
  const D = TK_OUT.door;
  await place(bot, 'overworld', D.x, D.y + 3);
  await useGlass(bot, opts);
  assert.equal(bot.s.map, PAST_ID, '千年前へ');
  await stepOn(bot, D.x, D.y + 2, opts);
  if (!c.flags.c6_clock) await stepOn(bot, D.x, D.y + 1, opts);
  assert.ok(c.flags.c6_clock && c.guests.includes('rion') && c.keyItems.includes(BOOKMARK), 'c6_clock・リオン・しおり');
  // 時計塔の 1階（c6_tower）
  await stepOn(bot, D.x, D.y, opts);
  assert.equal(bot.s.map, 'tokei_1f');
  const a1 = tkArrive(1);
  await stepOn(bot, Math.floor(a1.x), Math.floor(a1.y) - 1, opts);
  assert.ok(c.flags.c6_tower, 'c6_tower');
  // 星読みの しおり
  const fb = bot.msgs.length;
  await useBook(bot, opts);
  assert.ok(c.flags[BM(1)] && said(bot, TK_HINTS[1].full[1].slice(0, 10), fb), 'しおり');
  // 5階: 歯車の 石は 開けた ことに して、カリヨン（c6_bell）→ 大時計が 動き出す（c6_heart）
  c.flags[OPEN5] = true;
  const T5 = TK_POS[5].trigger;
  await place(bot, 'tokei_5f', 20, T5.y + 2);
  await stepOn(bot, 20, T5.y + 1, opts);
  await stepOn(bot, 20, T5.y, opts);
  void clock;
}
test('通しで: c6_kanata → ばあちゃん → 星の塔の かべ画 → 千年前の 北の 山（リオン・ミナモ）→ 時計塔 → カリヨン → 大時計が 動き出す（c6_heart）', { timeout: 300000 }, async () => {
  const { bot, c, clock } = await setup(7701, 'c6_kanata', { rion: false });
  assert.equal(c.objective, C6C_OBJ.kanata);
  const fought = [];
  const from = bot.msgs.length;
  await fullRun(bot, c, fought, clock);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['carillon'], '戦い');
  for (const f of STEP5) assert.ok(c.flags[f], f);
  assert.equal(c.objective, C6C_OBJ.heart);
  assert.equal(c.objective, '第6章の続きはアップデートで！');
  assert.ok(c.guests.includes('rion'), 'リオンは Step 6 まで いっしょ');
  for (const w of ['ひとりでに鳴ったんじゃ', '大きな時計の前に、4人の子どもが', 'ぼくがやらなきゃ。…勇者なんだから。', 'リオンが仲間に加わった',
    '星読みのしおり', 'かねつきのからくりカリヨン', '時計塔の心臓は、もう動き出した', '第6章の続きはアップデートで！']) {
    assert.ok(said(bot, w, from), w);
  }
  for (const id of ['zenmai', 'boss6', 'tokei']) assert.ok(said(bot, `"${id}"`, from), `曲 ${id}`);
  assert.ok(said(bot, '"showMon","carillon"', from), 'showMon');
  assert.ok(said(bot, '"guest","rion"', from) || c.guests.includes('rion'));
  // クリアの あと
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('がんばっておる音'));
  assert.ok(!condOk(MAPS[PAST_ID].npcById.rion.show, (f) => !!c.flags[f]), '泉の里の リオンは いない（いっしょ）');
});

test('負けた とき: カリヨンに 負けたら すすまない（カリヨンは まだ いる）', { timeout: 120000 }, async () => {
  const { bot, c } = await setup(7702, 'c6_tower', { extra: [OPEN5] });
  const T5 = TK_POS[5].trigger;
  await place(bot, 'tokei_5f', 20, T5.y + 1);
  const fought = [];
  await stepOn(bot, 20, T5.y, { fought, lose: () => true });
  assert.ok(fought.includes('carillon') && !c.flags.c6_bell);
  assert.ok(condOk(MAPS.tokei_5f.npcById.carillon_npc.show, (f) => !!c.flags[f]), 'カリヨンは まだ いる');
});

// ───────────── とちゅうで 切れた とき ─────────────
test('とちゅうで 切れても だいじょうぶ: カリヨンの あとの 場面（かね・広間で 続き）・ふもとの 場面（もう一度 ふもとへ）', { timeout: 300000 }, async () => {
  for (const [seed, where] of [[7801, 'bell'], [7802, 'hall']]) {
    const { world, bot } = await setup(seed, 'c6_tower', { extra: [OPEN5, TF(5)] });
    const T5 = TK_POS[5].trigger;
    await place(bot, 'tokei_5f', 20, T5.y + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = 20.5; bot.y = T5.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: '時計塔の心臓は、もう動き出した', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags.c6_bell && !c.flags.c6_heart, `${where}: カリヨンの あと・場面の とちゅう`);
    assert.equal(c.objective, C6C_OBJ.bell);
    const f2 = b2.msgs.length;
    const fought = [];
    if (where === 'bell') {
      const B = TK_POS[5].bell;
      await place(b2, 'tokei_5f', B.x, B.y + 1);
      await examine(b2, B.x, B.y, { fought });
    } else {
      await place(b2, 'tokei_5f', 20, 12);
      await stepOn(b2, 20, 11, { fought });
      if (!c.flags.c6_heart) await stepOn(b2, 20, 10, { fought });
    }
    assert.equal(fought.length, 0, 'もう 戦わない');
    assert.ok(said(b2, '時計塔の心臓は、もう動き出した', f2), `${where}: 続き`);
    assert.ok(c.flags.c6_heart && c.objective === C6C_OBJ.heart);
  }
  // ふもとの 場面の とちゅう（リオンが 加わる 前）
  {
    const { world, bot } = await setup(7803, 'c6_kanata', { rion: false });
    const D = TK_OUT.door;
    await place(bot, PAST_ID, D.x, D.y + 4);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = D.x + 0.5; bot.y = D.y + 3.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    await tickN(world, 1);
    if (!said(bot, 'ぼくがやらなきゃ', from)) { bot.y = D.y + 2.5; bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq }); }
    assert.equal(await play(bot, { stopAt: 'ぼくがやらなきゃ', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(!c.flags.c6_clock && !c.guests.includes('rion'), 'まだ c6_clock の 前');
    await place(b2, PAST_ID, D.x, D.y + 4);
    await stepOn(b2, D.x, D.y + 3);
    if (!c.flags.c6_clock) await stepOn(b2, D.x, D.y + 2);
    assert.ok(c.flags.c6_clock && c.guests.includes('rion') && c.keyItems.includes(BOOKMARK), 'もう一度 ふもとへ 行くと 続き');
  }
  // どこからでも おなじ 続き
  const x = ctx(flagsOf(...UPTO('c6_bell')));
  const want = JSON.stringify(endingFromBell(x));
  assert.ok(want.length > 20);
  for (const id of ['c6_tbell', 'c6_tbell_hall']) assert.ok(JSON.stringify(SCRIPTS[id](x)).includes(want.slice(1, -1)), id);
  assert.deepEqual(endingFromBell(ctx(flagsOf(...UPTO('c6_heart')))), []);
});

test('家族で: ふもとの 場面・カリヨンの 戦いは いっしょに。ものがたりは リーダーだけ すすむ', { timeout: 200000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(7901, 'c6_kanata');
  const yFlags = JSON.stringify(Y.char.flags);
  const D = TK_OUT.door;
  world.placeSession(Pa, PAST_ID, D.x + 0.5, D.y + 4.5, 'up', true);
  world.placeSession(Y, PAST_ID, D.x + 1.5, D.y + 4.5, 'up', true);
  await play(papa, { others: [yui] });
  const fy = yui.msgs.length;
  await stepOn(yui, D.x + 1, D.y + 3, { others: [papa] });
  if (!Pa.char.flags.c6_clock) await stepOn(yui, D.x + 1, D.y + 2, { others: [papa] });
  assert.ok(Pa.char.flags.c6_clock && Pa.char.guests.includes('rion') && !Y.char.flags.c6_clock, 'リーダーの ものがたり');
  assert.ok(yui.msgs.slice(fy).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('勇者なんだから')), 'ユイも 見た');
  // 5階の カリヨン: いっしょに 戦う
  Pa.char.flags.c6_tower = true; Pa.char.flags[OPEN5] = true;
  const T5 = TK_POS[5].trigger;
  world.placeSession(Pa, 'tokei_5f', 20.5, T5.y + 1.5, 'up', true);
  world.placeSession(Y, 'tokei_5f', 21.5, T5.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fought = [];
  await stepOn(papa, 20, T5.y, { others: [yui], fought });
  assert.ok(fought.includes('carillon') && yui.battles.length >= 1 && Pa.char.flags.c6_bell && Pa.char.flags.c6_heart, 'いっしょに 戦った');
  assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは そのまま');
});

// ───────────── 星読みの しおり ─────────────
test('星読みの しおり: 時計塔の 中で その 階の ヒント（1回ずつ。2回目は 短い ことば）・外では 使えない', { timeout: 120000 }, async () => {
  const { bot, c } = await setup(7951, 'c6_tower');
  await place(bot, PAST_ID, TK_OUT.door.x, TK_OUT.door.y + 2);
  const f0 = bot.msgs.length;
  await useBook(bot);
  assert.ok(toasted(bot, BOOK_TEXT.outside.split('\n')[0], f0) && !Object.keys(c.flags).some((f) => f.startsWith('c6_bm')), '外では 使えない');
  for (let n = 1; n <= TK_FLOORS; n++) {
    const a = tkArrive(n);
    await place(bot, tkMapId(n), Math.floor(a.x), Math.floor(a.y));
    const f1 = bot.msgs.length;
    await useBook(bot);
    assert.ok(c.flags[BM(n)] && said(bot, TK_HINTS[n].full[0].slice(0, 8), f1), `${n}階: はじめて`);
    const f2 = bot.msgs.length;
    await useBook(bot);
    assert.ok(said(bot, TK_HINTS[n].short, f2) && !said(bot, TK_HINTS[n].full[0].slice(0, 8), f2), `${n}階: 2回目`);
  }
});

// ───────────── より道 ─────────────
test('より道「トキネの砂時計のかざり」: c6_kanata の あとから。12こ（しるしは つぎの 1つ）・6こで ★5・12こで 砂時計が きれいに', { timeout: 300000 }, async () => {
  assert.equal(ORN_SPOTS.length, 12);
  assert.equal(ORN_NEED, 6);
  // 場所: どれも その マップで 歩ける 所。今と 千年前の 両方に ある
  const eras = new Set();
  for (const p of ORN_SPOTS) {
    const m = MAPS[p.map];
    assert.ok(m && !isBlocked(m, p.x, p.y, () => true), `${p.map} (${p.x},${p.y})`);
    eras.add(m.past ? 'past' : 'now');
  }
  assert.deepEqual([...eras].sort(), ['now', 'past']);
  const { world, bot, c } = await setup(7961, 'c6_kanata');
  const items = (id) => (c.items || []).filter((i) => i.id === id).reduce((s, i) => s + i.n, 0);
  // c6_kanata の 前は トキネは いない
  assert.ok(!condOk(MAPS.overworld.npcById.tokine_c6.show, (f) => f === 'c6_flow'));
  await place(bot, 'overworld', TOKINE_SPOT.x, TOKINE_SPOT.y + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[ORN.start], 'たのまれた');
  for (let i = 1; i <= ORN_SPOTS.length; i++) {
    const q = subQuests(c).find((x) => x.name === 'トキネの砂時計のかざり');
    assert.equal(q.find, `orn_${i}`, `しるしは つぎの かざり ${i}`);
    const p = ORN_SPOTS[i - 1];
    assert.ok(questMarks(c, p.map).some((m) => m.x === p.x && m.y === p.y && m.kind === 'sub'), `${i}: 地図の しるし`);
    await place(bot, p.map, p.x, p.y + (isBlocked(MAPS[p.map], p.x, p.y + 1, () => true) ? -1 : 1));
    await talk(bot, `orn_${i}`);
    assert.ok(c.flags[ORN.got(i)], `かざり ${i}`);
    if (i === ORN_NEED) assert.ok(c.flags[ORN.half] && items('c6s_orn_brooch') === 1, '6こで ★5');
  }
  assert.ok(c.flags[ORN.done] && items('seed_str') >= 2, '12こで 砂時計が きれいに・種');
  for (const q of CH6C_SIDE_QUESTS) assert.ok(labDoneQuests(c).includes(q.name), q.name);
  assert.ok(!subQuests(c).some((q) => q.name === 'トキネの砂時計のかざり'), 'クエストの 画面から 消える');
  await place(bot, 'overworld', TOKINE_SPOT.x, TOKINE_SPOT.y + 1);
  const f0 = bot.msgs.length;
  await talk(bot, 'tokine_c6');
  assert.ok(said(bot, 'きらきらでしょう', f0));
  void world;
  // 「はなす」の ヒント
  const half = { flags: flagsOf(...UPTO('c6_kanata'), ORN.start, ORN.got(1)), items: [], keyItems: [] };
  assert.ok(sideQuestHint(half)?.includes('砂時計のかざり'));
});

test('より道は 家族でも: ユイが 拾っても リーダーの 世界で すすむ', { timeout: 120000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(7962, 'c6_kanata', [ORN.start]);
  const p = ORN_SPOTS[0];
  world.placeSession(Pa, p.map, p.x + 0.5, p.y + 1.5, 'up', true);
  world.placeSession(Y, p.map, p.x + 1.5, p.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  await talk(yui, 'orn_1', { others: [papa] });
  assert.ok(Pa.char.flags[ORN.got(1)] && !Y.char.flags[ORN.got(1)]);
});

// ───────────── 文字・絵・音 ─────────────
test('文字: 第6章 Step 5 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-ch6c.js', 'public/js/shared/data/sidequests-ch6c.js', 'public/js/shared/data/items-ch6c.js',
    'public/js/shared/maps/tokei.js', 'public/js/shared/maps/tokei-rows.js', 'public/js/shared/maps/ch6c-side.js', 'public/js/shared/world/tokei.js', 'public/js/shared/world/tokei-use.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => k.startsWith('c6_t') || k.startsWith('c6_orn') || k.startsWith('c6_c')).map(([, fn]) => { try { return fn(ctx(flagsOf(...UPTO('c6_bell')))); } catch { return []; } }));
  assert.ok(!/\d+さい|\d+年生/.test(all), '年を 言わない');
  assert.ok(!/[鐘扉押渡祈]/.test(all), '使えない 漢字');
});

test('絵と 音: 時計塔の タイル（2D は 16×16 を ぬる・2.5D）・テーマ・人の え・時計塔の 曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec, CH6_FLOOR_H } = await import('../public/js/client/render/tiles-ch6.js');
  const { TK_PAINTERS } = await import('../public/js/client/render/tiles-tokei.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const mine = Object.keys(TK_PAINTERS).map(Number).sort((a, b) => a - b);
  assert.deepEqual(mine, Array.from({ length: 18 }, (_, i) => 289 + i));
  for (const id of mine) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id) && TILE_INFO[id], `${id}`);
    assert.equal(partOfTile(id), 'none', '色を かえない');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  assert.ok(isAnimated(T.TIME_GAP));
  assert.notEqual(paintTile(T.TIME_GAP, 0, 0, 0).px.join(), paintTile(T.TIME_GAP, 0, 1, 0).px.join(), '時の すきまが 動く');
  for (const id of [T.HAND_SWITCH, T.THUD_STONE, T.BIG_BELL, T.FROZEN_TREE]) assert.ok(CH6_PROPS[id] && PROP_TILES.has(id), `2.5D の ${TILE_INFO[id].name}`);
  for (const id of [T.CLOCK_PAINT, T.CLOCK_DOOR, T.BIG_GEAR, T.MURAL_NEW, T.CLOCK_FACE]) assert.ok(ch6BlockSpec(id, 0)?.h > 0.5, `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(CH6_FLOOR_H[T.CLOCK_PIT] < -0.5, '文字ばんの あなは ふかい');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...TK_MAPS, PAST_ID, 'overworld', 'star_tower_1f', LINK_TOWER]) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  assert.notDeepEqual(themeRgb(0x80, 0x80, 0x80, 'tokei', 'wall'), [0x80, 0x80, 0x80], 'tokei');
  // 人の え
  for (const k of ['clock_tower', 'carillon_npc', 'stop_mon_a', 'stop_mon_b', 'toki_orn']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  assert.notEqual(paintSpecial('carillon_npc', 'down', 0).px.join(), paintSpecial('carillon_npc', 'down', 1).px.join(), 'ハンマーが 動く');
  const sprites = new Set();
  for (const id of [...TK_MAPS, PAST_ID, 'overworld', ...new Set(ORN_SPOTS.map((p) => p.map))]) for (const n of MAPS[id].npcs) if (/^(tk\d|carillon|clock_tower|orn_|tokine_c6)/.test(n.id)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  // 曲
  const tr = _TRACKS.tokei;
  assert.ok(tr && tr.ch.length >= 3 && tr.ch.length <= 4);
  const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
  assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${lens}`);
  for (const ch of tr.ch) {
    if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum));
    else assert.ok(_parse(ch.n).every((n) => n.f === 0 || n.f > 20));
  }
  const mel = Object.values(_TRACKS).map((t) => t.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  void rimCell; void PLACES;
});
