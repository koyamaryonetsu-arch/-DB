// 第2部 第7章 第3幕「ひとりぼっちの星」Step 5・6（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c7_kai → 今の トキネ（c7_snow）→ 今の シロガネ地方で 時の砂時計 → 千年前の シロガネ地方 → 白雪の里（c7_frost）
// → 城の 前の いばらの魔女マレフィナ（c7_witch）→ 氷の竜の城 1〜8階（c7_icecastle）→ カイの影 → 第7章クリア（c7_clear）
// こおる・とける（時代で 水 ⇔ 氷）・すべる 氷の ゆか・時をこえる手紙（より道 3つ・城 5階の なぞとき）。戦いの 中みは B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand, slidesAt } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { C7S } from '../public/js/shared/maps/c7s-flags.js';
import {
  C7I, ARRIVE7I, CF7, KAI4, SHADOW7, WIN7I, DRAGON7I, LETTER7I, LETTER7I_SIDE, LETTER7I_CASTLE, SPIRIT_LETTER, C7I_SNOW, PRESENT_SNOW,
  VILLAGE7I, CASTLE_DOOR, THORNS, WITCH_ZONE, c7icMapId, C7IC_FLOORS, C7IC_NOW_FLOORS, C7IC_REST,
} from '../public/js/shared/maps/c7i-flags.js';
import { CH7I_MAPS } from '../public/js/shared/maps/c7.js';
import { C7IC_POS, C7IC_MAPS, c7icArrive, c7iTreasureOf, C7IC_CHEST_ERA } from '../public/js/shared/maps/c7i-castle.js';
import { LETTER7I_SPOTS, LETTER7I_ASKERS, C7I_POS } from '../public/js/shared/maps/c7i-snow.js';
import { NORTH_PLACES } from '../public/js/shared/maps/north.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH7_STEPS, OLD_C7_OBJ, CH7_OBJECTIVE_TARGETS, CH7_OBJECTIVE_TALK } from '../public/js/shared/data/story-c7.js';
import { C7S_OBJ } from '../public/js/shared/data/story-c7s.js';
import { CH7I_STEPS, C7I_OBJ, CH7I_STORY_SCRIPTS, VILLAIN7I } from '../public/js/shared/data/story-c7i.js';
import { C7I_SIDE_QUESTS, letterReward7i, letterName7i } from '../public/js/shared/data/sidequests-c7i.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { PAST_PLACES, pastPlaceAt } from '../public/js/shared/data/past-places.js';
import { pastLanding } from '../public/js/shared/world/travel.js';
// 城の 宝箱の 中み・手紙の ごほうび（B の data/items-c7i.js。まとめる 時に そちらから）
import { C7I_TREASURE, C7I_LETTER_REWARDS } from '../public/js/shared/data/items-c7i.js';
import { TIME_GLASS, GLASS_TEXT, glassCheck, timeArea } from '../public/js/shared/world/time-glass.js';
import { DAY_MS, FIRE_HALF } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const here = (bot) => [Math.floor(bot.s.x), Math.floor(bot.s.y)];
const PAST = (n) => MAPS[c7icMapId(n)];
const NOW = (n) => MAPS[c7icMapId(n, true)];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで（第3幕は ゲストが いない）
async function setup(seed, upto = 'c7_kai', { extra = [], frac = 0.2 } = {}) {
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
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 78);
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
async function play(bot, { lose = () => false, fought = null, max = 40000 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      if (fought) fought.push(c2.opts.fixed || c2.opts.symbolId || 'field');
      finish(c2, lose(c2.opts.fixed));
    }
    bot.flushQueue();
    await tickN(world, 1);
    bot.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (idle(bot) && !world.battles.size) {
      await tickN(world, 2);
      bot.flushQueue();
      if (idle(bot) && !world.battles.size) return true;
    }
  }
  return false;
}
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人を さける。すべる 氷は 通らない。つららは 時計を すすめて 待つ）
async function walkTo(bot, tx, ty, opts = {}) {
  const w = bot.world;
  const s = bot.s;
  const map = MAPS[s.map];
  const has0 = w.hasFlagFn(s);
  const has = (f) => (f === '@fireA' || f === '@fireB' ? false : has0(f));
  const ok = (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has)) return false;
    if (slidesAt(map, x, y, has)) return false;
    const k = y * map.w + x;
    if (map.warpAt.has(k) && !(x === tx && y === ty)) return false;
    const ch = map.chestAt.get(k);
    if (ch && condOk(ch.show, has)) return false;
    return !map.npcs.some((n) => n.solid && condOk(n.show, has) && Math.floor(n.x) === x && Math.floor(n.y) === y);
  };
  const [sx, sy] = here(bot);
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
    for (let k = 0; k < 3 && opts.clock && isBlocked(map, x, y, w.hasFlagFn(s)); k++) opts.clock.now += FIRE_HALF;
    await stepOn(bot, x, y, opts);
    if (s.map !== map.id || Math.floor(s.x) !== x || Math.floor(s.y) !== y) break;
  }
}
// すべる（client/field.js の すべる うごきと おなじ: 何かに ぶつかるか、氷が おわるまで 1マスずつ）。着いた マスを かえす
function slideEnd(map, x, y, dx, dy, has) {
  const solid = (cx, cy) => isBlocked(map, cx, cy, has) || map.chestAt.has(cy * map.w + cx);
  let nx = x + dx, ny = y + dy;
  if (solid(nx, ny)) return null;
  while (slidesAt(map, nx, ny, has) && !solid(nx + dx, ny + dy) && !map.warpAt.has(ny * map.w + nx)) { nx += dx; ny += dy; }
  return [nx, ny];
}
async function slide(bot, dx, dy) {
  const map = MAPS[bot.s.map];
  const [x, y] = here(bot);
  const has = bot.world.hasFlagFn(bot.s);
  const solid = (cx, cy) => isBlocked(map, cx, cy, has) || map.chestAt.has(cy * map.w + cx);
  let cx = x + dx, cy = y + dy;
  assert.ok(!solid(cx, cy), `${map.id}: (${x},${y}) から すべれる`);
  await stepOn(bot, cx, cy);
  while (slidesAt(map, cx, cy, has) && !solid(cx + dx, cy + dy) && bot.s.map === map.id) { cx += dx; cy += dy; await stepOn(bot, cx, cy); }
  return here(bot);
}

// ───────────── 城の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ・つららの 時間（0 … a が 落ちる / 1 … b が 落ちる）
// うごき … 歩く・すべる（氷の 上は ぶつかるか 氷が おわるまで 止まれない）・待つ（7階。どちらの 時間でも ふさがらない マスだけ）・
//   時の砂時計（その マスに 向こうの 時代で 立てる とき）・5階の 氷の 箱（千年前で 手紙を 入れる → 今で 読む）
// opts: start … はじめの フラグ / shift … 時の砂時計 / letter … 雪の精の 手紙を もっている
function solve(n, { start = [], shift = true, letter = true } = {}) {
  const P = C7IC_POS[n];
  const past = PAST(n), now = n <= C7IC_NOW_FLOORS ? NOW(n) : null;
  const a = c7icArrive(n);
  const s0 = { era: 'past', x: Math.floor(a.x), y: Math.floor(a.y), flags: [...start], phase: 0 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const edges = new Map();
  const waves = P.waveA.length + P.waveB.length > 0;
  while (q.length) {
    const s = q.shift();
    cells.add(`${s.era}:${s.x},${s.y}`);
    if (n === 8 && s.y === P.trigger.y && s.x >= P.trigger.x && s.x < P.trigger.x + P.trigger.w) goals.push(s);
    const map = s.era === 'past' ? past : now;
    const has = (f) => (f === '@fireA' ? s.phase === 0 : f === '@fireB' ? s.phase === 1 : s.flags.includes(f));
    const out = [];
    const push = (ns) => { const k = key(ns); out.push(k); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    const solid = (x, y) => isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x) || map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.abs(x + 0.5 - (m.x + 0.5)) < (m.big ? 1.5 : 0.5) && (m.big ? y <= Math.floor(m.y) && y >= Math.floor(m.y) - 1 : Math.floor(m.y) === y));
    for (const [dx, dy] of D4) {
      let x = s.x + dx, y = s.y + dy;
      if (solid(x, y)) continue;
      let warp = map.warpAt.get(y * map.w + x);
      while (!warp && slidesAt(map, x, y, has) && !solid(x + dx, y + dy)) { x += dx; y += dy; warp = map.warpAt.get(y * map.w + x); }
      if (warp) { if (s.era === 'past' && P.up && x === P.up.x && y === P.up.y) goals.push(s); continue; }
      push({ ...s, x, y });
    }
    if (waves) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    if (shift && now) {
      const other = s.era === 'past' ? now : past;
      if (canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) <= 1;
    if (n === 5 && near(P.box)) {
      const L = LETTER7I_CASTLE;
      if (s.era === 'past' && letter && !has(LETTER7I.bury(L))) push({ ...s, flags: [...s.flags, LETTER7I.bury(L)] });
      if (s.era === 'now' && has(LETTER7I.bury(L)) && !has(LETTER7I.found(L))) push({ ...s, flags: [...s.flags, LETTER7I.found(L)] });
    }
    edges.set(key(s), out);
  }
  // どこで 止まっても、はじめの 所（千年前の 着いた 所）へ もどれるか（すべる 氷に とじこめられない）
  const back = new Set([...edges.keys()].filter((k) => k.startsWith(`past:${s0.x},${s0.y}:`)));
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, o] of edges) if (!back.has(k) && o.some((x) => back.has(x))) { back.add(k); changed = true; }
  }
  const stuck = [...edges.keys()].filter((k) => !back.has(k));
  return { goals, seen, cells, stuck };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 8-2）: 物語の すすみ・マップの ID・出現表・きまった 戦い・宝箱・タイル・千年前の ルーラ', () => {
  assert.deepEqual(CH7I_STEPS, ['c7_snow', 'c7_frost', 'c7_witch', 'c7_icecastle', 'c7_clear']);
  assert.deepEqual(CH7_STEPS.slice(-6), ['c7_kai', ...CH7I_STEPS], 'c7_kai の うしろ');
  const ki = STORY_STEPS.indexOf('c7_kai');
  assert.deepEqual(STORY_STEPS.slice(ki + 1, ki + 6), CH7I_STEPS);
  // マップ（千年前の シロガネ地方・城 1〜8階。今の がわ 1〜7階）
  const want = [C7I_SNOW, ...Array.from({ length: 8 }, (_, i) => `c7i_castle_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c7i_castle_${i + 1}f_now`)];
  assert.deepEqual(CH7I_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c7i'), 'マップの 名前の 先頭は c7i');
  }
  const F = MAPS[C7I_SNOW], K = MAPS[PRESENT_SNOW];
  assert.ok(F.past && F.kind === 'field' && F.theme === 'past');
  assert.deepEqual([F.w, F.h], [K.w, K.h], '今の シロガネ地方と おなじ 大きさ');
  assert.equal(F.timePair, PRESENT_SNOW);
  assert.equal(K.timePair, C7I_SNOW);
  for (let n = 1; n <= 8; n++) {
    const m = PAST(n);
    assert.ok(m.kind === 'dungeon' && m.past, `${n}階`);
    assert.ok(m.name.startsWith('氷の竜の城'));
    if (n <= C7IC_NOW_FLOORS) {
      assert.equal(m.timePair, c7icMapId(n, true));
      assert.equal(NOW(n).timePair, c7icMapId(n));
      assert.deepEqual([m.w, m.h], [NOW(n).w, NOW(n).h], 'おなじ 大きさ');
      assert.ok(!NOW(n).warps.length, '今の がわの かいだんは がれきで うまっている');
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  assert.deepEqual(C7IC_REST, [4, 7]);
  // 出現表（B）: フィールド t7_snow・城 t7_castle（休み所・ボスの 階は 出ない）
  assert.ok(F.spawnCounts.t7_snow > 0 && ENCOUNTER_TABLES.t7_snow?.length);
  assert.equal(F.zoneAt(C7I_POS.villageIn.x, C7I_POS.villageIn.y), 'safe:village', '里の 中は 出ない');
  assert.equal(F.zoneAt(CASTLE_DOOR.x, CASTLE_DOOR.y + 3), 'safe:castle', '城の 前は 出ない');
  assert.equal(F.zoneAt(30, 70), 't7_snow', '雪原は 出る');
  for (let n = 1; n <= 8; n++) {
    const sc = PAST(n).spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc.t7_castle > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t7_castle?.length);
  assert.equal(PAST(4).zoneAt(15, 9), 'safe:rest');
  assert.equal(PAST(7).zoneAt(24, 3), 'safe:rest');
  for (const n of [2, 3, 6]) for (const p of C7IC_POS[n].ice) assert.ok(PAST(n).zoneAt(p.x, p.y).startsWith('safe'), `${n}階 すべる 氷の 上は 魔物が 出ない`);
  // きまった 戦い（B）
  for (const id of ['c7_witch', 'c7_shadow']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // 宝箱（B の C7I_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C7IC_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...PAST(n).chests, ...(n <= 7 ? NOW(n).chests : [])];
    assert.equal(list.length, 2, `${n}階の 宝箱`);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
    assert.ok(list.every((c) => c.id.startsWith(`c7ic_${n}c`)));
    assert.equal(c7iTreasureOf(n).length, 2);
    assert.equal(C7IC_CHEST_ERA[n].length, 2);
  }
  assert.ok(Object.keys(C7I_TREASURE).length >= 8 || C7I_TREASURE.length >= 16);
  // 白雪の里の 店
  for (const id of ['c7i_weapon', 'c7i_armor', 'c7i_item']) assert.ok(SHOPS[id]?.items.length && SHOPS[id].items.every((i) => ITEMS[i]), id);
  // タイル（337 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C7I_THORN, T.C7I_PUDDLE, T.C7I_ICEBOX, T.C7I_DDOOR, T.C7I_ICICLE_FLOOR, T.C7I_ICICLE];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 337 + i));
  assert.ok(!TILE_INFO[T.C7I_PUDDLE].solid && !TILE_INFO[T.C7I_ICICLE_FLOOR].solid && !TILE_INFO[T.C7I_PUDDLE].slide);
  for (const t of [T.C7I_THORN, T.C7I_ICEBOX, T.C7I_DDOOR, T.C7I_ICICLE]) assert.ok(TILE_INFO[t].solid, TILE_INFO[t].name);
  // だいほんが ぜんぶ ある
  for (const id of CH7I_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, PRESENT_SNOW]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[SPIRIT_LETTER]?.type === 'key', '大事な物「雪の精の手紙」');
  assert.equal(VILLAIN7I, 'いばらの魔女マレフィナ');
  // 千年前の ルーラ（白雪の里。c7_frost で おぼえる）
  const p = PAST_PLACES.p_shirayuki;
  assert.ok(p && p.map === C7I_SNOW && p.seen === C7I.frost && p.name === VILLAGE7I.name);
  const to = pastLanding('p_shirayuki');
  assert.ok(to && !isBlocked(F, Math.floor(to.x), Math.floor(to.y), () => true));
  assert.equal(pastPlaceAt(C7I_SNOW, Math.floor(to.x), Math.floor(to.y)), 'p_shirayuki');
});

// ───────────── 目標 ─────────────
test('目標: 第2幕クリアの セーブは 新しい 目標に なおる・フラグごとの 目標・仲間会話・地図の しるし', () => {
  assert.equal(OLD_C7_OBJ.kai, '第7章の続きはアップデートで！（カイは、ルミナの町の酒場で待っている）');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C7_OBJ.kai), '前の 版の 第2幕クリアの 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c7_kai')), objective: OLD_C7_OBJ.kai };
  assert.ok(repairObjective(old) && old.objective === C7S_OBJ.kai);
  assert.ok(C7S_OBJ.kai.includes('トキネ') && !C7S_OBJ.kai.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c7_kai')), objective: C7S_OBJ.kai };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L = LETTER7I_CASTLE;
  const IC = 'c7_icecastle';
  const table = [
    [['c7_kai'], C7S_OBJ.kai], [['c7_snow'], C7I_OBJ.snow], [['c7_snow', ARRIVE7I], C7I_OBJ.arrive], [['c7_frost'], C7I_OBJ.frost],
    [['c7_witch'], C7I_OBJ.witch], [[IC], C7I_OBJ.icecastle], [[IC, CF7(2)], C7I_OBJ.cf2], [[IC, CF7(3)], C7I_OBJ.cf3],
    [[IC, CF7(4), KAI4], C7I_OBJ.cf4], [[IC, CF7(5)], C7I_OBJ.cf5], [[IC, CF7(4), LETTER7I.start(L)], C7I_OBJ.spirit],
    [[IC, CF7(5), LETTER7I.start(L)], C7I_OBJ.spirit], [[IC, CF7(5), LETTER7I.bury(L)], C7I_OBJ.l4bury], [[IC, CF7(5), LETTER7I.found(L)], C7I_OBJ.l4found],
    [[IC, CF7(6)], C7I_OBJ.cf6], [[IC, CF7(7)], C7I_OBJ.cf7], [[IC, CF7(7), SHADOW7], C7I_OBJ.rest7], [[IC, CF7(8)], C7I_OBJ.cf8],
    [[IC, CF7(8), WIN7I], C7I_OBJ.win], [[IC, WIN7I, DRAGON7I], C7I_OBJ.dragon], [['c7_clear'], C7I_OBJ.clear],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C7I_OBJ), ['kai', C7S_OBJ.kai]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH7_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH7_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  // 第8章 第1幕（第73回）から: 第7章クリアの 文は トキネへ（前の 文は OLD_C7_OBJ.clear。test/ch8-step12-a.test.js）
  assert.ok(C7I_OBJ.clear.startsWith('第7章クリア！') && C7I_OBJ.clear.includes('第8章') && C7I_OBJ.clear.includes('トキネ'));
  // 地図の しるし（その 時代の マップだけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const Bx = C7IC_POS[5].box;
  assert.ok(mark(C7I_OBJ.spirit, c7icMapId(5)).some((m) => m.x === Bx.x && m.y === Bx.y), '千年前の 氷の 箱');
  assert.ok(mark(C7I_OBJ.l4bury, c7icMapId(5, true)).some((m) => m.x === Bx.x && m.y === Bx.y), '今の 氷の 箱');
  assert.ok(mark(C7I_OBJ.snow, PRESENT_SNOW).length, '今の シロガネ地方');
  assert.ok(mark(C7S_OBJ.kai, 'overworld').length, '今の トキネ');
});

// ───────────── 時代の 行き来 ─────────────
test('時の砂時計: 今の シロガネ地方 ⇔ 千年前（c7_snow から）・町の 中は 使えない・おなじ 座標・里から 歩いて 行ける', async () => {
  const K = MAPS[PRESENT_SNOW], F = MAPS[C7I_SNOW];
  const G = C7I_POS.glass;
  assert.equal(K.timeSpot(G.x, G.y, () => false), 'c7iwait', 'トキネの 話の 前は 使えない');
  assert.equal(K.timeSpot(G.x, G.y, (fl) => fl === C7I.snow), '');
  assert.ok(GLASS_TEXT.c7iwait);
  // 町の 中（今の 竜守りの村・カナトコ・ユノハ・千年前の 白雪の里）
  for (const p of Object.values(NORTH_PLACES)) assert.equal(K.timeNoUse(p.x + 3, p.y + 3), 'town', p.name);
  assert.equal(F.timeNoUse(C7I_POS.villageIn.x, C7I_POS.villageIn.y), 'town');
  assert.equal(F.timeNoUse(G.x, G.y), null);
  assert.equal(K.timeNoUse(G.x, G.y), null);
  // 目標の しるしの 場所は どちらの 時代でも 立てて、里から 歩いて 行ける
  const all = () => true;
  assert.ok(canStand(K, G.x + 0.5, G.y + 0.5, all) && canStand(F, G.x + 0.5, G.y + 0.5, all));
  const area = timeArea(F);
  const spots = [[G.x, G.y], [CASTLE_DOOR.x, CASTLE_DOOR.y + 1], [C7I_POS.gate.x, C7I_POS.gate.y], ...Object.values(LETTER7I_SPOTS).map((p) => [p.x, p.y])];
  for (const [x, y] of spots) assert.ok(area[y * F.w + x], `千年前: (${x},${y}) は 里から 歩いて 行ける`);
  const kArea = timeArea(K);
  for (const p of Object.values(LETTER7I_SPOTS)) {
    assert.ok(kArea[p.y * K.w + p.x], `今: 手紙の 場所 (${p.x},${p.y})`);
    assert.ok(canStand(K, p.x + 0.5, p.y + 0.5, all) && canStand(F, p.x + 0.5, p.y + 0.5, all), `手紙の 場所は どちらの 時代も 立てる (${p.x},${p.y})`);
  }
  // 千年前は 町が ない（カナトコ・ユノハの たてものは ない）・竜の門は ない・城と いばら
  const fTiles = new Set(F.tiles);
  for (const t of [T.SNOW, T.SNOW_PINE, T.ICE, T.ICE_WALL, T.C7I_THORN, T.RUIN_DOOR]) assert.ok(fTiles.has(t), TILE_INFO[t].name);
  for (const t of [T.DRAGON_GATE, T.RAIL, T.MINE_BEAM, T.CAVE_ENTRANCE, T.FLAME_WALL]) assert.ok(!fTiles.has(t), `${TILE_INFO[t].name} は まだ ない`);
  const KAN = NORTH_PLACES.kanatoko;
  for (let y = KAN.y; y < KAN.y + KAN.h; y++) for (let x = KAN.x; x < KAN.x + KAN.w; x++) assert.ok(![T.WALL_WOOD, T.WALL_STONE].includes(F.tiles[y * F.w + x]), 'カナトコは まだ ない');
  // 城の とびらは いばら（中ボスに 勝つと 消える）の 先
  for (let x = THORNS.x[0]; x <= THORNS.x[1]; x++) {
    assert.ok(isBlocked(F, x, THORNS.y, () => false) && !isBlocked(F, x, THORNS.y, (fl) => fl === C7I.witch), `いばら ${x}`);
  }
  assert.equal(F.warpAt.get(CASTLE_DOOR.y * F.w + CASTLE_DOOR.x).to.map, c7icMapId(1));
  // サーバー: 村の 南の 道で 使う → 千年前の おなじ 座標 → もどる
  const { world, bot, c } = await setup(7111, 'c7_kai');
  await place(bot, PRESENT_SNOW, G.x, G.y);
  const f0 = bot.msgs.length;
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_SNOW, 'トキネの 話の 前は 何も おこらない');
  assert.ok(bot.msgs.slice(f0).some((m) => JSON.stringify(m).includes('雪のふる音')));
  c.flags[C7I.snow] = true;
  world.sendSelf(bot.s);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, C7I_SNOW);
  assert.deepEqual(here(bot), [G.x, G.y], 'おなじ 座標');
  await stepOn(bot, G.x, G.y - 1);
  assert.ok(c.flags[ARRIVE7I], 'はじめて 着いた 場面');
  assert.ok(said(bot, 'ひとりぼっちの星'), '章の 字');
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_SNOW, '今へ もどる');
  // 里の 中では 使えない
  await place(bot, C7I_SNOW, C7I_POS.villageIn.x, C7I_POS.villageIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 城の とき方 ─────────────
test('氷の竜の城: どの 階も ひとりで 上へ 行ける・時の砂時計を 使わないと 行けない 階・すべる 氷に とじこめられない・今の がわから もどれる', () => {
  const start = (n) => (n >= 5 ? [LETTER7I.start(LETTER7I_CASTLE)] : []);
  for (let n = 1; n <= C7IC_FLOORS; n++) {
    const r = solve(n, { start: start(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '上へ'} 行ける`);
    assert.deepEqual(r.stuck, [], `${n}階: どこで 止まっても 着いた 所へ もどれる`);
    const noShift = solve(n, { start: start(n), shift: false });
    if ([1, 3, 5, 6].includes(n)) assert.ok(!noShift.goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
    else assert.ok(noShift.goals.length, `${n}階: 時の砂時計なしでも 行ける`);
    // 宝箱は その 時代で 取りに 行ける（となりに 立てる）
    for (const now of n <= C7IC_NOW_FLOORS ? [false, true] : [false]) {
      for (const ch of (now ? NOW(n) : PAST(n)).chests) {
        const era = now ? 'now' : 'past';
        assert.ok(D4.some(([dx, dy]) => r.cells.has(`${era}:${ch.x + dx},${ch.y + dy}`)), `${n}階 ${era} の 宝箱 (${ch.x},${ch.y})`);
      }
    }
  }
  // 5階: 雪の精の 手紙が ないと 竜の とびらは 開かない
  assert.ok(!solve(5, { letter: false }).goals.length, '5階: 雪の精の 手紙が ないと 開かない');
  assert.ok(solve(5, { start: [LETTER7I.start(LETTER7I_CASTLE)] }).goals.every((g) => g.flags.includes(LETTER7I.found(LETTER7I_CASTLE))));
  // 1階の 出口は 千年前の 城の とびらの 外・上の 階から 下りると、上への かいだんの となりに 着く
  const f1 = PAST(1);
  assert.equal(f1.warpAt.get(C7IC_POS[1].exit.y * f1.w + C7IC_POS[1].exit.x).to.map, C7I_SNOW);
  for (let n = 2; n <= 8; n++) {
    const D = C7IC_POS[n].down;
    const to = PAST(n).warpAt.get(D.y * PAST(n).w + D.x).to;
    const U = C7IC_POS[n - 1].up;
    assert.ok(to.map === c7icMapId(n - 1) && Math.abs(Math.floor(to.x) - U.x) + Math.abs(Math.floor(to.y) - U.y) === 1, `${n}階 → ${n - 1}階`);
    assert.ok(canStand(PAST(n - 1), to.x, to.y, () => false));
    assert.ok(!slidesAt(PAST(n - 1), to.x, to.y, () => false), '下りてきた 所は 氷では ない');
  }
  // かいだん・出口の となりは すべる 氷では ない（すべって かいだんに とびこまない）
  for (let n = 1; n <= 8; n++) for (const p of [C7IC_POS[n].up, C7IC_POS[n].down, C7IC_POS[n].exit]) {
    if (!p) continue;
    for (const [dx, dy] of D4) assert.ok(!slidesAt(PAST(n), p.x + dx, p.y + dy, () => false), `${n}階 かいだんの となり`);
  }
  // 休み所（4階・7階の おく）の いずみ
  for (const n of C7IC_REST) assert.ok(PAST(n).actions.some((a) => a.script === 'c7i_cfont'), `${n}階の いずみ`);
});

test('こおる・とける: 時代を かえると 水が 氷に・氷が 水に（千年前 … 竜の 氷 / 今 … いずみの 氷）・氷の かたまりは 今は 水たまり', () => {
  const none = () => false;
  const rows = (n) => C7IC_POS[n];
  // 1階: f … 千年前は すべる 氷・今は とけた 水 / g … 千年前は いずみの 水・今は すべる 氷
  const f = { x: 5, y: 5 }, g = { x: 5, y: 11 };
  assert.ok(slidesAt(PAST(1), f.x, f.y, none) && isBlocked(NOW(1), f.x, f.y, none));
  assert.equal(NOW(1).tiles[f.y * 32 + f.x], T.CAVE_WATER);
  assert.ok(isBlocked(PAST(1), g.x, g.y, none) && slidesAt(NOW(1), g.x, g.y, none));
  // 6階: r … 千年前は 氷の かたまり（その 手前で 止まる）・今は 水たまり（その 上で 止まる）
  const r6 = rows(6).blocks[0];
  assert.equal(PAST(6).tiles[r6.y * 32 + r6.x], T.ICE_BLOCK);
  assert.equal(NOW(6).tiles[r6.y * 32 + r6.x], T.C7I_PUDDLE);
  assert.deepEqual(slideEndOf(6, false, r6.x - 3, r6.y, 1, 0), [r6.x - 1, r6.y], '千年前は かたまりの 手前で 止まる');
  assert.deepEqual(slideEndOf(6, true, r6.x - 3, r6.y, 1, 0), [r6.x, r6.y], '今は 水たまりの 上で 止まる');
  // 5階: w … 千年前は あつい 氷の かべ・今は 水たまり / K … 千年前は 開いた とびら・今は しまった 竜の とびら
  const P5 = rows(5);
  assert.ok(isBlocked(PAST(5), P5.iceWall[0].x, P5.iceWall[0].y, none) && !isBlocked(NOW(5), P5.iceWall[0].x, P5.iceWall[0].y, none));
  assert.ok(!isBlocked(PAST(5), P5.door.x, P5.door.y, none) && isBlocked(NOW(5), P5.door.x, P5.door.y, none));
  assert.ok(!isBlocked(NOW(5), P5.door.x, P5.door.y, (fl) => fl === LETTER7I.found(LETTER7I_CASTLE)), '竜の 名前で 開く');
  // 2階は 千年前の すべる 氷の 大広間（今は ぜんぶ とけた 水）。まっすぐ 北へ すべっても すきまに 入れない
  const P2 = rows(2);
  for (const p of P2.ice) assert.ok(isBlocked(NOW(2), p.x, p.y, none), '今は とけた 水');
  const gapX = P2.up.x;
  assert.notDeepEqual(slideEndOf(2, false, gapX, 16, 0, -1), [gapX, 3], 'すきまの 列は まっすぐ すべっても 北へ ぬけられない');
  assert.ok(solve(2).goals.length);
});
function slideEndOf(n, now, x, y, dx, dy) {
  const m = now ? NOW(n) : PAST(n);
  return slideEnd(m, x, y, dx, dy, () => false);
}

test('つらら（7階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C7IC_POS[7];
  const m = PAST(7);
  assert.ok(P.waveA.length >= 4 && P.waveB.length >= 4);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.waveA.map(k)), B = new Set(P.waveB.map(k));
  for (const p of [...P.waveA, ...P.waveB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の つららが ない`);
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.equal(effectiveTile(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), T.C7I_ICICLE, '落ちてくる 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), '落ちていない 時は 通れる');
    assert.equal(NOW(7).tiles[p.y * 32 + p.x], T.CHASM, '今の がわは 通路が くずれている');
  }
  const a = c7icArrive(7);
  const seen = new Set([`${Math.floor(a.x)},${Math.floor(a.y)}`]);
  const q = [[Math.floor(a.x), Math.floor(a.y)]];
  const has = (f) => f === '@fireA';
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (isBlocked(m, nx, ny, has) || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      q.push([nx, ny]);
    }
  }
  assert.ok(!seen.has(`${P.up.x},${P.up.y}`), 'ずっと 同じ 時間では 通れない');
  assert.ok(solve(7).goals.length, '待てば 通れる');
});

// ───────────── サーバーで: すべる・5階（時をこえる手紙）─────────────
test('サーバー: 1階・3階を すべって 時代を かえながら 上へ・5階 雪の精の 手紙を 千年前の 氷の 箱に → 今の 箱で 読むと 竜の とびらが 開く', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(7221, 'c7_icecastle');
  // 1階: 千年前は 南の いずみの 水 → 今で 氷を すべる → 北の とけた 水は 千年前で 氷を すべる
  const a1 = c7icArrive(1);
  await place(bot, c7icMapId(1), Math.floor(a1.x), Math.floor(a1.y));
  await walkTo(bot, 15, 13);
  await useGlass(bot);
  assert.equal(bot.s.map, c7icMapId(1, true));
  assert.deepEqual(await slide(bot, 0, -1), [15, 10], '今: いずみの 氷を すべって わたる');
  await useGlass(bot);
  assert.equal(bot.s.map, c7icMapId(1));
  await walkTo(bot, 15, 7);
  assert.deepEqual(await slide(bot, 0, -1), [15, 4], '千年前: 竜の 氷を すべって わたる');
  await walkTo(bot, C7IC_POS[1].up.x, C7IC_POS[1].up.y);
  assert.equal(bot.s.map, c7icMapId(2), '2階へ');
  assert.ok(c.flags[CF7(2)]);
  // 5階
  for (const fl of [CF7(3), CF7(4), CF7(5), KAI4]) c.flags[fl] = true;
  const P5 = C7IC_POS[5];
  const Bx = P5.box, Dr = P5.door;
  // 先に 今の とびら（手紙が ない）
  await place(bot, c7icMapId(5, true), Dr.x - 1, Dr.y);
  let f0 = bot.msgs.length;
  await examine(bot, Dr.x, Dr.y);
  assert.ok(said(bot, 'ほんとうの名', f0) && !c.flags[LETTER7I.found(LETTER7I_CASTLE)]);
  // 4階の 雪の精 → 手紙
  const Sp = C7IC_POS[4].spirit;
  await place(bot, c7icMapId(4), Sp.x - 1, Sp.y);
  await talk(bot, 'c7i_spirit');
  assert.ok(c.flags[LETTER7I.start(LETTER7I_CASTLE)] && c.keyItems.includes(SPIRIT_LETTER), '雪の精の 手紙を もらった');
  assert.equal(c.objective, C7I_OBJ.spirit);
  // 今の 箱は まだ からっぽ（千年前で 入れる 前）
  await place(bot, c7icMapId(5, true), Bx.x - 1, Bx.y);
  await examine(bot, Bx.x, Bx.y);
  assert.ok(!c.flags[LETTER7I.found(LETTER7I_CASTLE)], '千年前で 入れる 前は 見つからない');
  // 千年前で 入れる → 今で 読む
  await useGlass(bot);
  bot.choice = 0;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER7I.bury(LETTER7I_CASTLE)] && !c.keyItems.includes(SPIRIT_LETTER), '氷の 箱に 入れた');
  await useGlass(bot);
  f0 = bot.msgs.length;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER7I.found(LETTER7I_CASTLE)] && said(bot, 'ゆきあかりのシラネ', f0), '千年前の 手紙が とどいた');
  assert.ok(!isBlocked(NOW(5), Dr.x, Dr.y, (fl) => !!c.flags[fl]), '竜の とびらが 開いた');
  await walkTo(bot, 26, 9);
  await useGlass(bot);
  assert.equal(bot.s.map, c7icMapId(5));
  await walkTo(bot, P5.up.x, P5.up.y);
  assert.equal(bot.s.map, c7icMapId(6), '6階へ');
  assert.ok(c.flags[CF7(6)], '6階に 来た');
});

// ───────────── 通し ─────────────
test('通しで: c7_kai → トキネ → 千年前の シロガネ → 白雪の里 → いばらの魔女 → 氷の竜の城 → カイの影 → 第7章クリア（c7_clear）', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(7411, 'c7_kai');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C7I.snow] && c.objective === C7I_OBJ.snow, 'c7_snow');
  assert.ok(said(bot, 'ひとつの紋章が、ひとりぼっちの星になる'));
  // 今の シロガネ地方の 村の 南で 砂時計 → 千年前
  const G = C7I_POS.glass;
  await place(bot, PRESENT_SNOW, G.x, G.y);
  await useGlass(bot);
  assert.equal(bot.s.map, C7I_SNOW);
  await stepOn(bot, G.x, G.y - 1);
  assert.ok(c.flags[ARRIVE7I] && c.objective === C7I_OBJ.arrive);
  // 白雪の里（南の 道から 入る）
  await walkTo(bot, VILLAGE7I.x + 10, VILLAGE7I.y + VILLAGE7I.h - 1);
  assert.ok(c.flags[C7I.frost] && c.objective === C7I_OBJ.frost, 'c7_frost');
  assert.ok(said(bot, '光らないや'), 'カイの 紋章は 光らない');
  assert.ok(c.visited?.p_shirayuki || c.flags[C7I.frost], '千年前の ルーラ（白雪の里）');
  assert.ok(MAPS[C7I_SNOW].npcById.c7i_kai, '里で カイが 待っている');
  // 城の 前の いばらの魔女（中ボス）
  const fought = [];
  await walkTo(bot, C7I_POS.gate.x, WITCH_ZONE.y + WITCH_ZONE.h, { fought });
  await walkTo(bot, C7I_POS.gate.x, WITCH_ZONE.y + 1, { fought });
  assert.deepEqual(fought.filter((f) => f !== 'field'), ['c7_witch']);
  assert.ok(c.flags[C7I.witch] && c.objective === C7I_OBJ.witch, 'c7_witch');
  assert.ok(said(bot, 'えらばれなかった子') && said(bot, 'ひとりぼっちの星'), '魔女の ことば');
  // 城へ
  await walkTo(bot, CASTLE_DOOR.x, CASTLE_DOOR.y);
  assert.equal(bot.s.map, c7icMapId(1));
  await stepOn(bot, Math.floor(c7icArrive(1).x), Math.floor(c7icArrive(1).y) - 1);
  assert.ok(c.flags[C7I.icecastle] && c.objective === C7I_OBJ.icecastle, 'c7_icecastle');
  // 4階で カイに 追いつく
  for (const f of [CF7(2), CF7(3)]) c.flags[f] = true;
  const a4 = c7icArrive(4);
  await place(bot, c7icMapId(4), Math.floor(a4.x), Math.floor(a4.y));
  await stepOn(bot, Math.floor(a4.x), Math.floor(a4.y) - 1);
  assert.ok(c.flags[CF7(4)] && c.flags[KAI4] && said(bot, 'えらばれなかったのかな'), '4階の カイ');
  // 7階の 休み所で カイの 影の 声
  for (const f of [CF7(5), CF7(6), LETTER7I.start(4), LETTER7I.bury(4), LETTER7I.found(4)]) c.flags[f] = true;
  const R7 = C7IC_POS[7].restIn;
  await place(bot, c7icMapId(7), R7.x, R7.y + 1);
  await stepOn(bot, R7.x, R7.y);
  assert.ok(c.flags[SHADOW7] && c.objective === C7I_OBJ.rest7, '7階の カイの 影');
  // 8階（しかけは 上の テストで）
  c.flags[CF7(7)] = true;
  const a8 = c7icArrive(8);
  await place(bot, c7icMapId(8), Math.floor(a8.x), Math.floor(a8.y));
  await stepOn(bot, Math.floor(a8.x), Math.floor(a8.y) - 1);
  assert.ok(c.flags[CF7(8)] && c.objective === C7I_OBJ.cf8);
  const T8 = C7IC_POS[8].trigger;
  const f2 = [];
  await walkTo(bot, 15, T8.y, { fought: f2 });
  assert.deepEqual(f2, ['c7_shadow']);
  assert.ok(c.flags[WIN7I] && c.flags[DRAGON7I] && c.flags[C7I.clear], 'c7_clear');
  assert.equal(c.objective, C7I_OBJ.clear);
  for (const t of ['ノクト', 'ひとりじゃない', 'ソリトゥスのかけら', '竜守りの里', '第7章クリア！', '第8章「千年の約束」へ　つづく', '今のほしみの丘で、待っているわね']) assert.ok(said(bot, t), t);
  for (const who of ['リオン', 'ミナモ', 'カリム', 'カイ']) assert.ok(said(bot, `"${who}"`), `4人が そろう 場面: ${who}`);
  assert.equal(bot.s.map, C7I_SNOW, 'さいごは 白雪の里');
  assert.ok((c.items || []).some((e) => e.id === 'dragon_scale'), '氷の竜の うろこ');
  for (const t of C7IC_POS[8].thorns) assert.ok(!isBlocked(PAST(8), t.x, t.y, (f) => !!c.flags[f]), '竜を つつむ いばらが 消えた');
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  await place(bot, C7I_SNOW, C7I_POS.elder.x + 1, C7I_POS.elder.y);
  await talk(bot, 'c7i_elder');
  assert.ok(!said(bot, '第7章クリア！', n));
  void world;
});

test('負けた 時・とちゅうで 切れた 時: 魔女・カイの影に 負けたら すすまない・さいごの 場面は 竜・広間・里長で 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(7511, 'c7_frost');
    await place(bot, C7I_SNOW, C7I_POS.gate.x, WITCH_ZONE.y + WITCH_ZONE.h + 1);
    await walkTo(bot, C7I_POS.gate.x, WITCH_ZONE.y + 1, { lose: () => true });
    assert.ok(!c.flags[C7I.witch], '魔女に 負けた');
    assert.ok(isBlocked(MAPS[C7I_SNOW], THORNS.x[0] + 2, THORNS.y, (f) => !!c.flags[f]), 'いばらは そのまま');
  }
  {
    const { bot, c } = await setup(7512, 'c7_icecastle', { extra: [CF7(8)] });
    const a8 = c7icArrive(8);
    await place(bot, c7icMapId(8), Math.floor(a8.x), Math.floor(a8.y));
    await walkTo(bot, 15, C7IC_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN7I] && !c.flags[C7I.clear], 'カイの影に 負けた');
  }
  for (const [seed, how, extra] of [[7513, 'hall', [WIN7I]], [7514, 'dragon', [WIN7I]], [7515, 'elder', [WIN7I]], [7516, 'elder', [WIN7I, DRAGON7I]]]) {
    // 勝った あと 切れた → 続き
    const { bot, c } = await setup(seed, 'c7_icecastle', { extra: [CF7(8), ...extra] });
    if (how === 'elder') {
      await place(bot, C7I_SNOW, C7I_POS.elder.x + 1, C7I_POS.elder.y);
      await talk(bot, 'c7i_elder');
      if (!extra.includes(DRAGON7I)) {
        assert.ok(!c.flags[C7I.clear], '竜の 場面の 前は 里長では すすまない');
        continue;
      }
    } else if (how === 'dragon') {
      const B = C7IC_POS[8].dragon;
      await place(bot, c7icMapId(8), B.x, B.y + 3);
      await talk(bot, 'c7i_dragon_npc');
    } else {
      await place(bot, c7icMapId(8), 15, C7IC_POS[8].trigger.y + 1);
      await stepOn(bot, 15, C7IC_POS[8].trigger.y);
    }
    assert.ok(c.flags[DRAGON7I] && c.flags[C7I.clear], `${how}で 続き`);
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙（雪の 地方）: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const K = MAPS[PRESENT_SNOW], F = MAPS[C7I_SNOW];
  for (const k of LETTER7I_SIDE) {
    const p = LETTER7I_SPOTS[k];
    const dig = K.npcById[`c7i_dig_${k}`], bury = F.npcById[`c7i_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER7I.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(condOk(dig.show, (f) => f === LETTER7I.bury(k)) && !condOk(dig.show, (f) => f === LETTER7I.bury(k) || f === LETTER7I.found(k)), 'うめた あと・見つける まで');
    assert.ok(F.npcById[LETTER7I_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward7i(k).length, `ごほうび ${k}`);
  }
  assert.ok(C7I_LETTER_REWARDS);
  const hints = subQuestHints();
  for (const q of C7I_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  for (const k of LETTER7I_SIDE) {
    // サーバー: たのまれる → うめる 前に 今で ほる → 千年前で うめる → 今で 見つける
    const { bot, c } = await setup(7610 + k, 'c7_frost');
    const asker = F.npcById[LETTER7I_ASKERS[k]];
    const ax = Math.floor(asker.x), ay = Math.floor(asker.y);
    const side = D4.map(([dx, dy]) => [ax + dx, ay + dy]).find(([x, y]) => canStand(F, x + 0.5, y + 0.5, () => false));
    await place(bot, C7I_SNOW, side[0], side[1]);
    bot.choice = 0;
    await talk(bot, LETTER7I_ASKERS[k]);
    assert.ok(c.flags[LETTER7I.start(k)], `${k}: たのまれた`);
    const q1 = subQuests(c).find((q) => q.name === letterName7i(k));
    assert.ok(q1 && q1.find === `c7i_bury_${k}` && !q1.ready, 'クエストの 画面: うめる 場所');
    const p = LETTER7I_SPOTS[k];
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(K, x + 0.5, y + 0.5, () => false) && canStand(F, x + 0.5, y + 0.5, () => false));
    await place(bot, PRESENT_SNOW, near[0], near[1]);
    await talk(bot, `c7i_dig_${k}`);
    assert.ok(!c.flags[LETTER7I.found(k)], 'うめる 前は 何も ない');
    await place(bot, C7I_SNOW, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c7i_bury_${k}`);
    assert.ok(c.flags[LETTER7I.bury(k)]);
    const q2 = subQuests(c).find((q) => q.name === letterName7i(k));
    assert.ok(q2 && q2.who === `c7i_dig_${k}` && q2.ready, 'クエストの 画面: 今で さがす');
    const [rid, rn] = letterReward7i(k)[0];
    const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
    const before = cnt();
    await place(bot, PRESENT_SNOW, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c7i_dig_${k}`);
    assert.ok(c.flags[LETTER7I.found(k)] && cnt() === before + rn, `${k}: ごほうび`);
    assert.ok(labDoneQuests(c).includes(letterName7i(k)), 'クリアした たのまれごと');
    await talk(bot, `c7i_dig_${k}`);
    assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
  }
});

// ───────────── 文字・絵 ─────────────
test('文字: 第7章 Step 5・6 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない・第8章の ことは 書かない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c7i.js', 'public/js/shared/data/sidequests-c7i.js', 'public/js/shared/data/shops-c7i.js',
    'public/js/shared/maps/c7i-snow.js', 'public/js/shared/maps/c7i-village-rows.js', 'public/js/shared/maps/c7i-castle.js', 'public/js/shared/maps/c7i-castle-rows.js', 'public/js/shared/maps/c7i-flags.js',
    'public/js/shared/data/items-c7-key.js', 'public/js/shared/data/story-c7s.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c7_icecastle'), CF7(5));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c7i_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
  assert.ok(!/ふういんの日|過去組|今組/.test(all), '第8章の 中みは 書かない');
});

test('絵と 音: 城の タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・人の え・魔女と 竜の 大きな すがた・曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 337; id <= 342; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  assert.ok(isAnimated(T.C7I_ICICLE));
  assert.notEqual(paintTile(T.C7I_ICICLE, 0, 0, 0).px.join(), paintTile(T.C7I_ICICLE, 0, 1, 0).px.join(), 'つららが 動く');
  for (const id of [T.C7I_THORN, T.C7I_ICEBOX, T.C7I_ICICLE]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(ch6BlockSpec(T.C7I_DDOOR, 0)?.h > 0.8);
  assert.ok(CH6_THEMES.c7i_castle, 'テーマ');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...C7IC_MAPS, C7I_SNOW]) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c7i_witch_npc', 'c7i_dragon_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set(['kai', 'kai_shadow', 'nocto', 'dragon_elder', 'yukina', 'rion', 'minamo', 'karim', 'c7i_spirit']);
  for (const id of [C7I_SNOW, ...C7IC_MAPS]) for (const n of MAPS[id].npcs) if (/^c7i_/.test(n.id) && !n.big && !/^capsule/.test(n.sprite)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  for (const t of ['c7i_snow', 'c7i_castle']) assert.ok(CH6_TRACKS[t]?.ch?.length, `曲 ${t}`);
  for (const id of C7IC_MAPS) assert.ok(['c7i_castle', 'cave', 'boss6'].includes(MAPS[id].bgm), id);
  assert.equal(MAPS[C7I_SNOW].bgm, 'c7i_snow');
});
