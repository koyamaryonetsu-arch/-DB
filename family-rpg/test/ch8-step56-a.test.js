// 第2部 第8章 第3幕「くろがねの空中要塞」Step 5・6（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c8_hades → 今の トキネ（c8_sky）→ 今の ミドリナ地方で 時の砂時計 → 千年前の ミドリナ地方・泉の里（c8_spring・ミナモが さらわれる・リオンが ゲスト）
// → 東の 森の ようさいの いかりの くさり → くろがねの空中ようさい 1〜8階（c8_fortress）→ 4階 マジカメック（c8_kamek）
// → 5階より 上へ（c8_engine）→ 初代大魔王クッパード（c8_bowser）
// ようさいの しかけ（千年前の プロペラ・たいほう・シャッター → 今の 残がいの かたむいた 板・すべる ゆか）・木の 根（今）→ かべの すきま（千年前）・
// ゆげの 通路・時をこえる手紙（より道 2つ・5階の なぞとき）。戦いの 中みは B。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C8C, ARRIVE8C, ENTRY8C, PF8C, POCO8C, VOICE8C, WIN8C, CALM8C, CAGE8C, DEV8C, ROOT8C, LETTER8C, LETTER8C_SIDE, LETTER8C_FORT, POCO_LETTER8C,
  ENTRANCE8C, WRECK8C, c8cMapId, C8C_FLOORS, C8C_NOW_FLOORS, C8C_REST,
} from '../public/js/shared/maps/c8c-flags.js';
import { CH8C_MAPS } from '../public/js/shared/maps/c8.js';
import { C8C_POS, C8C_MAPS, c8cTreasureOf, C8C_CHEST_ERA, linkedBy, linkTile, deviceKind, DEVICE_TILES } from '../public/js/shared/maps/c8c-fort.js';
import { linkOf } from '../public/js/shared/maps/c8c-fort-rows.js';
import { LETTER8C_SPOTS, LETTER8C_ASKERS, C8C_FIELD_POS, FOREST8C } from '../public/js/shared/maps/c8c-field.js';
import { SPRING } from '../public/js/shared/maps/past.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH8_STEPS, OLD_C8_OBJ, CH8_OBJECTIVE_TARGETS, CH8_OBJECTIVE_TALK } from '../public/js/shared/data/story-c8.js';
import { C8B_OBJ } from '../public/js/shared/data/story-c8b.js';
import { CH8C_STEPS, C8C_OBJ, CH8C_STORY_SCRIPTS, VILLAIN8C, KAMEK8C } from '../public/js/shared/data/story-c8c.js';
import { C8C_SIDE_QUESTS, letterReward8c, letterName8c } from '../public/js/shared/data/sidequests-c8c.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor, objectiveChapter } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { GUESTS } from '../public/js/shared/data/shops.js';
// 宝箱の 中み・手紙の ごほうび（B の data/items-c8c.js。まとめる 時に そちらから）
import { C8C_TREASURE, C8C_LETTER_REWARDS } from '../public/js/shared/data/items-c8c.js';
import { TIME_GLASS, glassCheck, timeArea } from '../public/js/shared/world/time-glass.js';
import { stairsPair, warpLanding, stepsTo } from '../public/js/shared/world/stairs.js';
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
const PAST = (n) => MAPS[c8cMapId(n)];
const NOW = (n) => MAPS[c8cMapId(n, true)];
const FIELD = 'overworld_past';
const OW = 'overworld';

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto = 'c8_hades', { extra = [], frac = 0.2 } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  // 第7章・第8章 第1・2幕で はじめて 千年前に 来た しるし・守り星の かけら（物語の すすみぐあいでは ない フラグ）
  for (const f of ['c7_arrive', 'c7s_arrive', 'c8a_arrive', 'c8b_arrive', 'c5_k_vane3', 'c5_kroad_w9', 'c7s_lwin', 'c6_spring_seen']) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 88);
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
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人・すべる ゆかを さける。ゆげは 時計を すすめて 待つ）
async function walkTo(bot, tx, ty, opts = {}) {
  const w = bot.world;
  const s = bot.s;
  const map = MAPS[s.map];
  const has0 = w.hasFlagFn(s);
  const has = (f) => (f === '@fireA' || f === '@fireB' ? false : has0(f));
  const ok = (x, y) => {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has)) return false;
    if (TILE_INFO[effectiveTile(map, x, y, has)]?.flow) return false;
    const k = y * map.w + x;
    if (map.warpAt.has(k) && !(x === tx && y === ty)) return false;
    const ch = map.chestAt.get(k);
    if (ch && condOk(ch.show, has)) return false;
    return !map.npcs.some((n) => n.solid && condOk(n.show, has) && (n.big ? Math.abs(x + 0.5 - (n.x + 0.5)) < 1.5 && y <= Math.floor(n.y) && y >= Math.floor(n.y) - 1 : Math.floor(n.x) === x && Math.floor(n.y) === y));
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
// すべる ゆかに のる（となりの すべる マスに 1歩 → すべる 道を たどる）
async function ride(bot, x, y) {
  const map = MAPS[bot.s.map];
  const end = carry(map, x, y, bot.world.hasFlagFn(bot.s));
  for (const [px, py] of end.path) await stepOn(bot, px, py);
  return end;
}
// しかけ・根・ポストを しらべる（となりに 立って しらべて えらぶ）
async function touch(bot, p, choice = 0) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x));
  await walkTo(bot, side[0], side[1]);
  bot.choice = choice;
  await examine(bot, p.x, p.y);
  bot.choice = 0;
}

// ───────────── ようさいの とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ（しかけ・根・手紙）・ゆげの 時間（0 … a が ふき出す / 1 … b が ふき出す）
// うごき … 歩く（すべる ゆかは 矢じるしの むきへ すべる）・待つ（6階。どちらの 時間でも ふさがらない マスだけ）・
//   時の砂時計（その マスに 向こうの 時代で 立てる とき）・しかけを 動かす・もどす（千年前で となりに 立つ）・
//   木の 根を 見つける（今で となりに 立つ）・5階の 鉄の ポスト（千年前で 手紙を 入れる → 今で 読む）
// はじめは 下への かいだんの 上（第71回: 下の 階から 上ると 下への かいだんの 真上に 着く）。ゴールは 上への かいだん（8階は 広間）
function solve(n, { start = [], shift = true, letter = true, devices = true, roots = true, era0 = 'past' } = {}) {
  const P = C8C_POS[n];
  const past = PAST(n), now = n <= C8C_NOW_FLOORS ? NOW(n) : null;
  const s0 = { era: era0, x: P.down.x, y: P.down.y, flags: [...start], phase: 0 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const edges = new Map();
  while (q.length) {
    const s = q.shift();
    cells.add(`${s.era}:${s.x},${s.y}`);
    const map = s.era === 'past' ? past : now;
    const has = (f) => (f === '@fireA' ? s.phase === 0 : f === '@fireB' ? s.phase === 1 : s.flags.includes(f));
    const out = [];
    const push = (ns) => { const k = key(ns); out.push(k); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    const solid = (x, y) => isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x) || map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.abs(x - m.x) < (m.big ? 1.5 : 0.5) && (m.big ? y <= Math.floor(m.y) && y >= Math.floor(m.y) - 1 : Math.floor(m.y) === y));
    for (const [dx, dy] of D4) {
      const x = s.x + dx, y = s.y + dy;
      if (solid(x, y)) continue;
      if (n === 8 && y === P.trigger.y && x >= P.trigger.x && x < P.trigger.x + P.trigger.w) goals.push(s);
      if (map.warpAt.get(y * map.w + x)) { if (x === P.up?.x && y === P.up?.y) goals.push({ ...s, via: s.era }); continue; }
      const c = carry(map, x, y, has);
      if (c.pit) continue;
      push({ ...s, x: c.x, y: c.y });
    }
    if (P.waveA.length) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    if (shift && now) {
      const other = s.era === 'past' ? now : past;
      if (canStand(other, s.x + 0.5, s.y + 0.5, has) && !other.warpAt.has(s.y * other.w + s.x)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) <= 1;
    if (devices && s.era === 'past') {
      P.devices.forEach((d, k) => {
        if (!near(d)) return;
        const f = DEV8C(n, k);
        push({ ...s, flags: s.flags.includes(f) ? s.flags.filter((x) => x !== f) : [...s.flags, f] });
      });
    }
    if (roots && s.era === 'now') {
      P.roots.forEach((r, k) => {
        const f = ROOT8C(n, k);
        if (near(r) && !s.flags.includes(f)) push({ ...s, flags: [...s.flags, f] });
      });
    }
    if (near(P.box)) {
      const L = LETTER8C_FORT;
      if (s.era === 'past' && letter && !has(LETTER8C.bury(L))) push({ ...s, flags: [...s.flags, LETTER8C.bury(L)] });
      if (s.era === 'now' && has(LETTER8C.bury(L)) && !has(LETTER8C.found(L))) push({ ...s, flags: [...s.flags, LETTER8C.found(L)] });
    }
    edges.set(key(s), out);
  }
  // どこに いても、下への かいだん（はじめの 所）へ もどれるか（すべる ゆか・しかけ・ゆげで とじこめられない）
  const back = new Set([...edges.keys()].filter((k) => {
    const [, xy] = k.split(':');
    const [x, y] = xy.split(',').map(Number);
    return Math.abs(x - P.down.x) + Math.abs(y - P.down.y) <= 1;
  }));
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, o] of edges) if (!back.has(k) && o.some((x) => back.has(x))) { back.add(k); changed = true; }
  }
  const stuck = [...edges.keys()].filter((k) => !back.has(k));
  return { goals, seen, cells, stuck };
}
const startOf = (n) => (n >= 4 ? [C8C.kamek] : []);
const PUZZLE = [1, 2, 3, 5, 6, 7];

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 8-2）: 物語の すすみ・マップの ID・出現表・きまった 戦い・宝箱・タイル・ゲスト', () => {
  assert.deepEqual(CH8C_STEPS, ['c8_sky', 'c8_spring', 'c8_fortress', 'c8_kamek', 'c8_engine', 'c8_bowser']);
  assert.deepEqual(CH8_STEPS.slice(12), CH8C_STEPS, 'CH8_STEPS の c8_hades の うしろ');
  const hi = STORY_STEPS.indexOf('c8_hades');
  assert.deepEqual(STORY_STEPS.slice(hi + 1, hi + 7), CH8C_STEPS, 'c8_hades の うしろ');
  // マップ（千年前 1〜8階・今 1〜7階）
  const want = [...Array.from({ length: 8 }, (_, i) => `c8c_fort_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c8c_fort_${i + 1}f_now`)];
  assert.deepEqual(CH8C_MAPS, want);
  assert.deepEqual(C8C_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c8c'), 'マップの 名前の 先頭は c8c');
    assert.ok(m.kind === 'dungeon');
  }
  for (let n = 1; n <= 8; n++) {
    const m = PAST(n);
    assert.ok(m.past && m.name.startsWith('くろがねの空中ようさい'), `${n}階`);
    if (n <= C8C_NOW_FLOORS) {
      assert.equal(m.timePair, c8cMapId(n, true));
      assert.equal(NOW(n).timePair, c8cMapId(n));
      assert.deepEqual([m.w, m.h], [NOW(n).w, NOW(n).h], 'おなじ 大きさ');
      assert.ok(NOW(n).name.startsWith('空中ようさいの残がい'));
      assert.ok(NOW(n).warps.some((w) => w.x === C8C_POS[n].down.x && w.y === C8C_POS[n].down.y), `今の ${n}階の 下への かいだん`);
      assert.equal(NOW(n).warps.some((w) => w.x === C8C_POS[n].up.x && w.y === C8C_POS[n].up.y), n < 7, `今の ${n}階の 上への かいだん`);
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  assert.deepEqual(C8C_REST, [4, 7]);
  // 入口: 千年前の 森の いかりの くさり（リオンと しらべると のぼれる）・今の 森の 残がいの 出入り口（c8_fortress の あと）
  const E = ENTRANCE8C;
  for (const [m, flag, to] of [[MAPS[FIELD], ENTRY8C, c8cMapId(1)], [MAPS[OW], C8C.fortress, c8cMapId(1, true)]]) {
    const w = m.warpAt.get(E.y * m.w + E.x);
    assert.equal(w.to.map, to);
    assert.ok(isBlocked(m, E.x, E.y, () => false), '入口は しまっている（第3幕の 前は 木）');
    assert.ok(isBlocked(m, E.x, E.y, (f) => f !== flag), '開く 前は 通れない');
    assert.ok(!isBlocked(m, E.x, E.y, () => true), '開くと 通れる');
  }
  assert.equal(effectiveTile(MAPS[FIELD], E.x, E.y, (f) => f === C8C.spring), T.C8C_ANCHOR, '泉の里の 場面の あとは いかり');
  assert.equal(effectiveTile(MAPS[FIELD], E.x, E.y, () => true), T.C8C_CHAIN, 'のぼれる くさり');
  assert.equal(effectiveTile(MAPS[OW], E.x, E.y, (f) => f === C8C.sky), T.C8C_WRECKDOOR, '今は 残がいの 出入り口');
  assert.equal(effectiveTile(MAPS[OW], E.x, E.y, () => true), T.C8C_HATCH);
  for (const [x, y] of WRECK8C) {
    assert.equal(effectiveTile(MAPS[OW], x, y, (f) => f === C8C.sky), T.C8C_WRECK, '残がいの 鉄の 板');
    assert.notEqual(effectiveTile(MAPS[OW], x, y, () => false), T.C8C_WRECK, '第3幕の 前は 森の まま');
  }
  assert.equal(PAST(1).warpAt.get(C8C_POS[1].down.y * 32 + C8C_POS[1].down.x).to.map, FIELD);
  assert.equal(NOW(1).warpAt.get(C8C_POS[1].down.y * 32 + C8C_POS[1].down.x).to.map, OW);
  // 出現表（B）: 1〜4階 t8c_fort・5〜8階 t8c_deep（休み所・ボスの 階は 出ない）
  for (let n = 1; n <= 8; n++) {
    const sc = PAST(n).spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc[n <= 4 ? 't8c_fort' : 't8c_deep'] > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t8c_fort?.length && ENCOUNTER_TABLES.t8c_deep?.length);
  assert.equal(PAST(4).zoneAt(15, 13), 'safe:rest');
  assert.equal(PAST(7).zoneAt(25, 3), 'safe:rest');
  for (const n of PUZZLE) for (const p of [...C8C_POS[n].links, ...C8C_POS[n].devices, ...C8C_POS[n].roots]) for (const [dx, dy] of D4) {
    const z = PAST(n).zoneAt(p.x + dx, p.y + dy);
    assert.ok(z.startsWith('safe'), `${n}階 しかけ・板・根の まわりは 魔物が 出ない`);
  }
  // きまった 戦い（B）
  for (const id of ['c8_kamek', 'c8_bowser']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // ゲスト（B が 強さ）
  assert.ok(GUESTS.rion8?.name === 'リオン', 'GUESTS.rion8');
  // 宝箱（B の C8C_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C8C_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...PAST(n).chests, ...(n <= 7 ? NOW(n).chests : [])];
    assert.equal(list.length, 2, `${n}階の 宝箱`);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
    assert.ok(list.every((c) => c.id.startsWith(`c8c_${n}c`)));
    assert.equal(c8cTreasureOf(n).length, 2);
    assert.equal(C8C_CHEST_ERA[n].length, 2);
  }
  assert.ok(Object.keys(C8C_TREASURE).length >= 8 || C8C_TREASURE.length >= 16);
  // タイル（367 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C8C_SKY, T.C8C_CRUSH, T.C8C_TILT, T.C8C_MOSS, T.C8C_SLIDE_N, T.C8C_SLIDE_E, T.C8C_SLIDE_S, T.C8C_SLIDE_W,
    T.C8C_PROP_ON, T.C8C_PROP_OFF, T.C8C_CANNON_L, T.C8C_CANNON_R, T.C8C_SHUTTER_OPEN, T.C8C_SHUTTER_SHUT,
    T.C8C_ROOTS, T.C8C_PLATE, T.C8C_GAP, T.C8C_MAILBOX, T.C8C_LOCKDOOR, T.C8C_BARRIER, T.C8C_STEAM_FLOOR, T.C8C_STEAM,
    T.C8C_ANCHOR, T.C8C_CHAIN, T.C8C_WRECK, T.C8C_WRECKDOOR, T.C8C_HATCH, T.C8C_CAGEBAR];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 367 + i));
  for (const t of [T.C8C_TILT, T.C8C_MOSS, T.C8C_SLIDE_N, T.C8C_SLIDE_E, T.C8C_SLIDE_S, T.C8C_SLIDE_W, T.C8C_GAP, T.C8C_STEAM_FLOOR, T.C8C_CHAIN, T.C8C_HATCH]) assert.ok(!TILE_INFO[t].solid, TILE_INFO[t].name);
  for (const t of mine.filter((x) => ![T.C8C_TILT, T.C8C_MOSS, T.C8C_SLIDE_N, T.C8C_SLIDE_E, T.C8C_SLIDE_S, T.C8C_SLIDE_W, T.C8C_GAP, T.C8C_STEAM_FLOOR, T.C8C_CHAIN, T.C8C_HATCH].includes(x))) assert.ok(TILE_INFO[t].solid, TILE_INFO[t].name);
  // だいほんが ぜんぶ ある
  for (const id of CH8C_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, FIELD, OW]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[POCO_LETTER8C]?.type === 'key', '大事な物「ポコの手紙」');
  assert.equal(VILLAIN8C, '初代大魔王クッパード');
  assert.equal(KAMEK8C, 'マジカメック');
});

// ───────────── 目標 ─────────────
test('目標: 第2幕クリアの セーブは トキネへの 目標に なおる・フラグごとの 目標・仲間会話（4人分）・地図の しるし', () => {
  assert.equal(OLD_C8_OBJ.hades, '第8章　第3幕へ（続きはアップデートで！）');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C8_OBJ.hades), '前の 版の 第2幕クリアの 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c8_hades')), objective: OLD_C8_OBJ.hades };
  assert.ok(repairObjective(old) && old.objective === C8B_OBJ.hades);
  assert.ok(C8B_OBJ.hades.startsWith('第8章　第2幕クリア！') && C8B_OBJ.hades.includes('トキネ') && !C8B_OBJ.hades.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c8_hades')), objective: C8B_OBJ.hades };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L = LETTER8C_FORT;
  const table = [
    [['c8_hades'], C8B_OBJ.hades], [['c8_sky'], C8C_OBJ.sky], [['c8_sky', ARRIVE8C], C8C_OBJ.arrive], [['c8_spring'], C8C_OBJ.spring],
    [['c8_spring', ENTRY8C], C8C_OBJ.entry], [['c8_fortress'], C8C_OBJ.fortress], [['c8_fortress', PF8C(2)], C8C_OBJ.f2], [['c8_fortress', PF8C(3)], C8C_OBJ.f3],
    [['c8_fortress', PF8C(4), POCO8C], C8C_OBJ.f4], [['c8_kamek'], C8C_OBJ.kamek], [['c8_engine'], C8C_OBJ.engine], [['c8_engine', LETTER8C.start(L)], C8C_OBJ.poco],
    [['c8_engine', LETTER8C.bury(L)], C8C_OBJ.l3bury], [['c8_engine', LETTER8C.found(L)], C8C_OBJ.l3found], [['c8_engine', PF8C(6)], C8C_OBJ.f6],
    [['c8_engine', PF8C(7)], C8C_OBJ.f7], [['c8_engine', PF8C(7), VOICE8C], C8C_OBJ.rest7], [['c8_engine', PF8C(8)], C8C_OBJ.f8],
    [['c8_engine', PF8C(8), WIN8C], C8C_OBJ.win], [['c8_engine', WIN8C, CALM8C], C8C_OBJ.calm], [['c8_bowser'], C8C_OBJ.bowser],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C8C_OBJ), ['hades', C8B_OBJ.hades]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH8_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) {
      const s = talkFor(t, kind);
      assert.ok(s !== `次は「${t.replace(/\n/g, '')}」ですね。` && s.length > 8, `${k} ${kind}`);
    }
  }
  for (const t of Object.values(C8C_OBJ)) assert.ok(CH8_OBJECTIVE_TALK[t] && objectiveChapter(t) === 5, '第8章の 目標の 章');
  assert.equal(C8C_OBJ.bowser, '第8章　第4幕へ（続きはアップデートで！）');
  // 地図の しるし（その 時代の マップだけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const Bx = C8C_POS[5].box;
  assert.ok(mark(C8C_OBJ.poco, c8cMapId(5)).some((m) => m.x === Bx.x && m.y === Bx.y), '千年前の 鉄の ポスト');
  assert.ok(mark(C8C_OBJ.l3bury, c8cMapId(5, true)).some((m) => m.x === Bx.x && m.y === Bx.y), '今の 鉄の ポスト');
  assert.ok(mark(C8C_OBJ.sky, OW).length, '今の ミドリナ地方');
  assert.ok(mark(C8C_OBJ.spring, FIELD).some((m) => m.x === ENTRANCE8C.x && m.y === ENTRANCE8C.y), '森の いかり');
  assert.ok(mark(C8B_OBJ.hades, OW).length, '今の トキネ');
});

// ───────────── ようさいの とき方 ─────────────
test('くろがねの空中ようさい: どの 階も ひとりで 上へ 行ける・時の砂時計と しかけを 使わないと 行けない 階・とじこめられない・今の がわから 来ても とける', () => {
  for (let n = 1; n <= C8C_FLOORS; n++) {
    const r = solve(n, { start: startOf(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '上へ'} 行ける`);
    assert.deepEqual(r.stuck, [], `${n}階: どこに いても 下への かいだんへ もどれる`);
    if (n <= C8C_NOW_FLOORS) {
      const fromNow = solve(n, { start: startOf(n), era0: 'now' });
      assert.ok(fromNow.goals.length && !fromNow.stuck.length, `${n}階: 今の がわから 来ても とける`);
    }
    if (PUZZLE.includes(n)) {
      assert.ok(!solve(n, { start: startOf(n), shift: false }).goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), devices: false }).goals.length, `${n}階: しかけを 動かさないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), shift: false, era0: 'now' }).goals.length, `${n}階: 今の がわだけでは 行けない`);
    }
    // 宝箱は その 時代で 取りに 行ける（となりに 立てる）
    for (const now of n <= C8C_NOW_FLOORS ? [false, true] : [false]) {
      for (const ch of (now ? NOW(n) : PAST(n)).chests) {
        const era = now ? 'now' : 'past';
        assert.ok(D4.some(([dx, dy]) => r.cells.has(`${era}:${ch.x + dx},${ch.y + dy}`)), `${n}階 ${era} の 宝箱 (${ch.x},${ch.y})`);
      }
    }
  }
  // 4階: マジカメックに 勝つまで まほうの かべ（どちらの 時代も）
  assert.ok(!solve(4).goals.length, '4階: マジカメックに 勝つまで 上へ 行けない');
  // 5階: ポコの 手紙が ないと まほうの じょうは 開かない・上への かいだんは 今の とびらの 先
  assert.ok(!solve(5, { start: [C8C.kamek], letter: false }).goals.length, '5階: 手紙が ないと 開かない');
  assert.ok(solve(5, { start: [C8C.kamek] }).goals.every((g) => g.flags.includes(LETTER8C.found(LETTER8C_FORT))));
  // 2階・6階: 今の 木の 根を 見つけないと 千年前の かべの すきまを 通れない
  for (const n of [2, 6]) {
    assert.ok(C8C_POS[n].roots.length, `${n}階の 木の 根`);
    assert.ok(!solve(n, { start: startOf(n), roots: false }).goals.length, `${n}階: 木の 根を 見つけないと 行けない`);
    assert.ok(solve(n, { start: startOf(n) }).goals.every((g) => g.flags.includes(ROOT8C(n, 0))));
  }
  // 3階: 2つの しかけを どちらも 動かす・7階: 3つの しかけを ぜんぶ 動かす（シャッターで すべる むきが かわる）
  assert.ok(solve(3).goals.every((g) => g.flags.includes(DEV8C(3, 0)) && g.flags.includes(DEV8C(3, 1))));
  assert.ok(solve(7, { start: startOf(7) }).goals.every((g) => [0, 1, 2].every((k) => g.flags.includes(DEV8C(7, k)))));
  // 6階: ゆげの 時間が かわるのを 待たないと 通れない（下の テストでも）
});

test('ようさいの しかけと 今の 残がい: 千年前で 動かすと 今の 板・すべる むきが かわる・千年前は 空・木の 根と かべの すきま', () => {
  for (const n of PUZZLE) {
    const P = C8C_POS[n];
    assert.ok(P.devices.length >= 1 && P.links.length >= 1, `${n}階の しかけと 板`);
    // しかけは どちらの 時代も おなじ すがた・千年前で しらべると 動かせる・今は 千年前の すがたの まま
    P.devices.forEach((d, k) => {
      const [off, on] = DEVICE_TILES[deviceKind(n, k)];
      for (const map of [PAST(n), NOW(n)]) {
        assert.equal(effectiveTile(map, d.x, d.y, () => false), off);
        assert.equal(effectiveTile(map, d.x, d.y, (f) => f === DEV8C(n, k)), on);
        assert.ok(isBlocked(map, d.x, d.y, () => false), 'しかけは 通れない');
      }
      assert.ok(PAST(n).actions.some((a) => a.x === d.x && a.y === d.y && a.script === `c8c_dev_${n}_${k}`));
      assert.ok(NOW(n).actions.some((a) => a.x === d.x && a.y === d.y && a.script === 'c8c_dev_now'));
      assert.ok(linkedBy(n, k).length >= 1, `${n}階 しかけ${k} で かわる 今の マスが ある`);
    });
    // 板（1〜6）・すべる ゆか（e）: 千年前は 空・今は しかけで かわる
    for (const c of P.links) {
      const k = linkOf(n, c.ch);
      const f = DEV8C(n, k);
      assert.equal(PAST(n).tiles[c.y * 32 + c.x], T.C8C_SKY, '千年前は 空');
      assert.ok(isBlocked(PAST(n), c.x, c.y, () => true));
      assert.equal(effectiveTile(NOW(n), c.x, c.y, () => false), linkTile(n, c.ch, false));
      assert.equal(effectiveTile(NOW(n), c.x, c.y, (x) => x === f), linkTile(n, c.ch, true));
      if (c.ch === 'e') {
        assert.deepEqual(TILE_INFO[linkTile(n, 'e', true)].flow, [1, 0], 'うごかすと 東へ');
        assert.deepEqual(TILE_INFO[linkTile(n, 'e', false)].flow, [-1, 0], 'うごかさないと 西へ');
      } else {
        const odd = Number(c.ch) % 2 === 1;
        assert.equal(isBlocked(NOW(n), c.x, c.y, () => false), !odd, `${n}階 (${c.x},${c.y}) ${c.ch}: うごかす 前`);
        assert.equal(isBlocked(NOW(n), c.x, c.y, (x) => x === f), odd, `${n}階 (${c.x},${c.y}) ${c.ch}: うごかした あと`);
      }
    }
  }
  // 1階: はじめは 西の 板（北西の 小べや）・プロペラを 止めると 東の 板（上への かいだん）
  assert.equal(deviceKind(1, 0), 'prop');
  assert.ok(C8C_POS[1].links.some((c) => c.ch === '1') && C8C_POS[1].links.some((c) => c.ch === '2'));
  // ゆかの あな（k）: 千年前は 空・今は 森の 土 / c: 千年前は ゆか・今は つぶれた 鉄 / ~: どちらも 通れない
  for (let n = 1; n <= C8C_NOW_FLOORS; n++) {
    for (const p of C8C_POS[n].moss) {
      assert.ok(isBlocked(PAST(n), p.x, p.y, () => true), `${n}階 千年前は 空`);
      assert.equal(NOW(n).tiles[p.y * 32 + p.x], T.C8C_MOSS, `${n}階 今は 森の 土`);
    }
    for (const p of C8C_POS[n].crush) {
      assert.ok(!isBlocked(PAST(n), p.x, p.y, () => false), `${n}階 千年前は ゆか`);
      assert.equal(NOW(n).tiles[p.y * 32 + p.x], T.C8C_CRUSH, `${n}階 今は つぶれた 鉄`);
    }
    // すべる ゆか（> < ^ v）: 千年前は 空・今は すべる
    for (const p of C8C_POS[n].slides) {
      assert.equal(PAST(n).tiles[p.y * 32 + p.x], T.C8C_SKY);
      assert.ok(TILE_INFO[NOW(n).tiles[p.y * 32 + p.x]].flow, '今は すべる');
    }
    // 木の 根: 今は 根（通れない・しらべると 見つける）・千年前は ゆるんだ 鉄の 板 → 見つけると すきま
    C8C_POS[n].roots.forEach((r, k) => {
      assert.equal(effectiveTile(NOW(n), r.x, r.y, () => true), T.C8C_ROOTS);
      assert.ok(isBlocked(NOW(n), r.x, r.y, () => true), '今の 根は 通れない');
      assert.ok(NOW(n).actions.some((a) => a.x === r.x && a.y === r.y && a.script === `c8c_root_${n}_${k}`));
      assert.equal(effectiveTile(PAST(n), r.x, r.y, () => false), T.C8C_PLATE);
      assert.ok(isBlocked(PAST(n), r.x, r.y, () => false), '見つける 前は かべ');
      assert.equal(effectiveTile(PAST(n), r.x, r.y, (f) => f === ROOT8C(n, k)), T.C8C_GAP);
      assert.ok(!isBlocked(PAST(n), r.x, r.y, (f) => f === ROOT8C(n, k)), '見つけた あとは すきま');
    });
  }
  assert.ok(C8C_POS[1].moss.length && C8C_POS[5].moss.length, 'ゆかの あな');
  assert.ok(C8C_POS[3].slides.length && C8C_POS[7].slides.length, 'すべる ゆか');
  // 3階: 島から 南へ すべると 南の 岸に 着く（帰り道）
  const v = C8C_POS[3].slides[0];
  const end = carry(NOW(3), v.x, v.y, () => false);
  assert.ok(!end.pit && end.y > v.y && !isBlocked(PAST(3), end.x, end.y, () => false), '南の 岸（どちらの 時代も ゆか）に 着く');
  // 7階: 島1から 東へ すべる ゆかは シャッターを しめた 時だけ 島2へ
  const e0 = C8C_POS[7].links.find((c) => c.ch === 'e');
  const f2 = DEV8C(7, linkOf(7, 'e'));
  const go = carry(NOW(7), e0.x, e0.y, (f) => f === f2);
  assert.ok(go.x > Math.max(...C8C_POS[7].links.filter((c) => c.ch === 'e').map((c) => c.x)), '島2へ すべる');
  const back = carry(NOW(7), e0.x, e0.y, () => false);
  assert.ok(back.x < e0.x, 'しめないと 島1へ もどされる');
  assert.equal(deviceKind(7, linkOf(7, 'e')), 'shutter');
  // 5階: G … 千年前は 開いた とびら・今は まほうの じょう（手紙で 開く）
  const G = C8C_POS[5].gate;
  assert.ok(!isBlocked(PAST(5), G.x, G.y, () => false) && isBlocked(NOW(5), G.x, G.y, () => false));
  assert.ok(!isBlocked(NOW(5), G.x, G.y, (fl) => fl === LETTER8C.found(LETTER8C_FORT)), '合言葉で 開く');
  assert.ok(isBlocked(PAST(5), G.x + 1, G.y, () => true) && !isBlocked(NOW(5), G.x + 1, G.y, () => false), 'とびらの 先は 千年前は 空・今は 森の 土');
  // 8階: まほうの おり（さいごの 場面で 開く）
  for (const c of C8C_POS[8].cage) {
    assert.ok(isBlocked(PAST(8), c.x, c.y, (f) => f === WIN8C), 'おりは 勝っただけでは まだ');
    assert.ok(!isBlocked(PAST(8), c.x, c.y, (f) => f === CAGE8C), 'おりが 開く');
  }
});

test('ゆげの 通路（6階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C8C_POS[6];
  const m = PAST(6);
  assert.ok(P.waveA.length >= 3 && P.waveB.length >= 3);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.waveA.map(k)), B = new Set(P.waveB.map(k));
  for (const p of [...P.waveA, ...P.waveB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の ゆげが ない`);
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.equal(effectiveTile(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), T.C8C_STEAM, 'ふき出している 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), 'ふき出していない 時は 通れる');
    assert.equal(NOW(6).tiles[p.y * 32 + p.x], T.C8C_CRUSH, '今の がわは 通路が つぶれている');
  }
  // 北西の へやから 北東の へやへ、ずっと 同じ 時間では 通れない
  const start = { x: 2, y: 3 };
  const seen = new Set([k(start)]);
  const q = [[start.x, start.y]];
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
  assert.ok(!seen.has(`${P.up.x},${P.up.y + 1}`), 'ずっと 同じ 時間では 通れない');
});

test('かいだん（第71回）: 上ると 上の 階の 下への かいだんの 真上・下りると 下の 階の 上への かいだんの 真上', () => {
  const all = () => true;
  for (let n = 1; n < C8C_FLOORS; n++) {
    for (const now of n + 1 <= C8C_NOW_FLOORS ? [false, true] : [false]) {
      const from = c8cMapId(n, now), to = c8cMapId(n + 1, now);
      const U = C8C_POS[n].up, D = C8C_POS[n + 1].down;
      const wu = MAPS[from].warpAt.get(U.y * 32 + U.x);
      const L = warpLanding(from, wu, all);
      assert.ok(L.stair && L.map === to && Math.floor(L.x) === D.x && Math.floor(L.y) === D.y, `${from} → ${to}: 下への かいだんの 上`);
      const wd = MAPS[to].warpAt.get(D.y * 32 + D.x);
      const L2 = warpLanding(to, wd, all);
      assert.ok(L2.stair && L2.map === from && Math.floor(L2.x) === U.x && Math.floor(L2.y) === U.y, `${to} → ${from}: 上への かいだんの 上`);
      assert.ok(stepsTo(MAPS[to], D.x, D.y, Math.floor(wu.to.x), Math.floor(wu.to.y), all) >= 0, 'これまでの つく マスへ 歩ける');
      assert.ok(stairsPair(from, wu));
    }
  }
  // 入口（千年前の くさり・今の 残がいの 出入り口）⇔ 1階: 森へ 出る ところに 立てる
  const E = ENTRANCE8C;
  for (const [field, now] of [[FIELD, false], [OW, true]]) {
    const D = C8C_POS[1].down;
    const w = MAPS[c8cMapId(1, now)].warpAt.get(D.y * 32 + D.x);
    assert.equal(w.to.map, field);
    assert.deepEqual([Math.floor(w.to.x), Math.floor(w.to.y)], [E.x, E.y + 1], '森の 出入り口の 下');
    assert.ok(canStand(MAPS[field], E.x + 0.5, E.y + 1.5, () => true), `${field}: 出入り口の 下に 立てる`);
    assert.ok(canStand(MAPS[field], E.x + 0.5, E.y + 1.5, () => false), `${field}: 第3幕の 前も 立てる`);
  }
});

test('千年前の ミドリナ地方と 今: 泉の里・森の いかり・残がい・手紙の 場所に 歩いて 行ける（時の砂時計で 来られる）・リオンと ミナモは 第3幕の あいだ 里に いない', () => {
  const F = MAPS[FIELD], O = MAPS[OW];
  const E = ENTRANCE8C;
  for (const m of [F, O]) assert.ok(timeArea(m)[(E.y + 1) * m.w + E.x], `${m.id}: 出入り口の 下に 歩いて 行ける`);
  assert.ok(timeArea(F)[C8C_FIELD_POS.springIn.y * F.w + C8C_FIELD_POS.springIn.x], '泉の里');
  const G = C8C_FIELD_POS.glass;
  assert.ok(!isBlocked(O, G.x, G.y, () => true) && timeArea(F)[G.y * F.w + G.x], '目標の しるしで 砂時計が 使える');
  assert.equal(F.zoneAt(E.x, E.y + 1), 'safe:anchor');
  assert.equal(F.areaName(E.x, E.y + 1), 'いかりの森');
  assert.ok(FOREST8C.x <= E.x && E.x < FOREST8C.x + FOREST8C.w);
  // 第3幕の あいだ（c8_spring 〜 c8_bowser）、泉の里の リオン・ミナモは いない
  const vis = (id, fl) => F.npcs.some((n) => n.id === id && condOk(n.show, (f) => fl.includes(f)));
  const before = [...UPTO('c8_sky')];
  const during = [...UPTO('c8_engine')];
  const after = [...UPTO('c8_bowser')];
  assert.ok(vis('rion_spar', before) && !vis('rion_spar', during) && !vis('c8c_rion_back', during) && vis('c8c_rion_back', after), 'リオン（剣の けいこ）');
  assert.ok(!vis('rion_spar', after), '2人に ならない');
  assert.ok(!vis('c8c_minamo_back', during) && vis('c8c_minamo_back', after), 'ミナモ');
  assert.ok(vis('c8c_minamo_wait', [...during, WIN8C, CALM8C]) && !vis('c8c_minamo_wait', after), 'さいごの 場面の 続きの ミナモ');
  assert.ok(F.triggers.some((t) => t.id === 'c8c_spring_arrive' && t.x >= SPRING.x && t.x + t.w <= SPRING.x + SPRING.w));
});

// ───────────── サーバーで ─────────────
test('サーバー: 1階 千年前の プロペラを 止めて 今の 板を わたる・2階 今の 木の 根 → 千年前の すきま・7階 シャッターで すべる むき', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(8611, 'c8_fortress');
  const P1 = C8C_POS[1];
  await place(bot, c8cMapId(1), P1.arrive.x, P1.arrive.y);
  const l2 = P1.links.find((x) => x.ch === '2');
  assert.ok(isBlocked(NOW(1), l2.x, l2.y, (f) => !!c.flags[f]), 'しかけを 動かす 前は つぶれている');
  await touch(bot, P1.devices[0]);
  assert.ok(c.flags[DEV8C(1, 0)], 'プロペラが 止まった');
  assert.ok(said(bot, 'プロペラが、ゆっくりと止まった'));
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(1, true), '今へ');
  assert.ok(!isBlocked(NOW(1), l2.x, l2.y, (f) => !!c.flags[f]), '今の 板が 通れる');
  await walkTo(bot, P1.up.x, P1.up.y);
  assert.equal(bot.s.map, c8cMapId(2, true), '今の 2階へ（今の かいだん）');
  assert.deepEqual(here(bot), [C8C_POS[2].down.x, C8C_POS[2].down.y], '下への かいだんの 真上に 着く');
  assert.ok(c.flags[PF8C(2)], '2階に 来た');
  // 2階: 今の 木の 根 → 千年前の すきま → 北の シャッター → 今の 板で 北東の へや
  const P2 = C8C_POS[2];
  const r = P2.roots[0];
  await touch(bot, r);
  assert.ok(c.flags[ROOT8C(2, 0)] && said(bot, '木の根'), '根を 見つけた');
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(2));
  await walkTo(bot, r.x, r.y - 1);
  assert.deepEqual(here(bot), [r.x, r.y - 1], '千年前の すきまを 通った');
  await touch(bot, P2.devices[0]);
  assert.ok(c.flags[DEV8C(2, 0)] && said(bot, 'シャッターが、しまった'));
  await useGlass(bot);
  await walkTo(bot, P2.up.x, P2.up.y);
  assert.equal(bot.s.map, c8cMapId(3, true), '今の 3階へ');
  // 7階: 南の 岸の たいほう（島1への 板）・シャッター（東へ すべる）→ 島1の プロペラ → すべって 島2 → 休み所
  const P7 = C8C_POS[7];
  c.flags[C8C.kamek] = true;
  await place(bot, c8cMapId(7), P7.arrive.x, P7.arrive.y);
  await touch(bot, P7.devices[1]);
  await touch(bot, P7.devices[2]);
  assert.ok(c.flags[DEV8C(7, 1)] && c.flags[DEV8C(7, 2)], 'たいほうと シャッター');
  await useGlass(bot);
  const isle1 = P7.links.find((x) => x.ch === '2');
  await walkTo(bot, isle1.x, isle1.y - 3);
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(7), '島1で 千年前へ');
  await touch(bot, P7.devices[0]);
  assert.ok(c.flags[DEV8C(7, 0)], '島1の プロペラ');
  await useGlass(bot);
  const e0 = P7.links.filter((x) => x.ch === 'e').sort((a, b) => a.x - b.x)[0];
  await walkTo(bot, e0.x - 1, e0.y);
  const end = await ride(bot, e0.x, e0.y);
  assert.ok(end.x > e0.x + 4, `島2へ すべった (${end.x},${end.y})`);
  const l4 = P7.links.find((x) => x.ch === '4');
  await walkTo(bot, l4.x, l4.y - 3);
  assert.ok(c.flags[VOICE8C], '休み所の 入口で 声');
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(7));
  await walkTo(bot, P7.up.x, P7.up.y);
  assert.equal(bot.s.map, c8cMapId(8), '8階へ');
});

// ───────────── 通し ─────────────
test('通しで: c8_hades → トキネ → 千年前の 泉の里（ミナモが さらわれる・リオンが ゲスト）→ 森の いかり → ようさい → マジカメック → ポコの 手紙 → クッパード → 第3幕クリア（c8_bowser）', { timeout: 400000 }, async () => {
  const { world, bot, c } = await setup(8711, 'c8_hades');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, OW, Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C8C.sky] && c.objective === C8C_OBJ.sky, 'c8_sky');
  assert.ok(said(bot, 'ミドリナ地方の、空の上から'), 'トキネ: ふるさとの 空');
  assert.ok(isBlocked(MAPS[OW], ENTRANCE8C.x, ENTRANCE8C.y, (f) => !!c.flags[f]), '今の 残がいは まだ しまっている');
  // 今の ルミナの町の 東の 門の 外で 砂時計 → 千年前
  const G = C8C_FIELD_POS.glass;
  await place(bot, OW, G.x, G.y);
  await useGlass(bot);
  assert.equal(bot.s.map, FIELD);
  await stepOn(bot, G.x + 1, G.y);
  assert.ok(c.flags[ARRIVE8C] && c.objective === C8C_OBJ.arrive);
  assert.ok(said(bot, 'くろがねの空中ようさい'), '章の 字');
  // 泉の里へ（ミナモが さらわれる・リオンが ゲスト）
  const S = C8C_FIELD_POS.springIn;
  await place(bot, FIELD, S.x, S.y + 3);
  await walkTo(bot, S.x, S.y);
  assert.ok(c.flags[C8C.spring] && c.objective === C8C_OBJ.spring, 'c8_spring');
  assert.ok(c.guests.includes('rion8'), 'リオンが ゲスト');
  assert.ok(said(bot, '初代大魔王クッパード') && said(bot, 'ひとりじめ') && said(bot, 'ぼくに、できるかな'), '泉の里の 場面');
  // 森の いかり（リオンと しらべる）→ くさりを のぼる
  const E = ENTRANCE8C;
  await place(bot, FIELD, E.x, E.y + 1);
  await examine(bot, E.x, E.y);
  assert.ok(c.flags[ENTRY8C] && c.objective === C8C_OBJ.entry, 'くさりを のぼれる');
  await stepOn(bot, E.x, E.y);
  assert.equal(bot.s.map, c8cMapId(1));
  const A1 = C8C_POS[1].arrive;
  await stepOn(bot, A1.x, A1.y - 1);
  await stepOn(bot, A1.x, A1.y);
  assert.ok(c.flags[C8C.fortress] && c.objective === C8C_OBJ.fortress, 'c8_fortress');
  assert.ok(!isBlocked(MAPS[OW], E.x, E.y, (f) => !!c.flags[f]), '今の 森の 残がいの 出入り口も 開いた');
  // 4階（しかけは 上の テストで）: 休み所で ポコ → 北の 広間で マジカメック
  for (const f of [PF8C(2), PF8C(3)]) c.flags[f] = true;
  const A4 = C8C_POS[4].arrive;
  await place(bot, c8cMapId(4), A4.x, A4.y - 1);
  await stepOn(bot, A4.x, A4.y);
  assert.ok(c.flags[PF8C(4)] && c.objective === C8C_OBJ.f4, '4階');
  await walkTo(bot, 15, 12);
  assert.ok(c.flags[POCO8C] && said(bot, 'たるの中'), '4階の ポコ');
  const fought = [];
  await walkTo(bot, 15, C8C_POS[4].trigger.y, { fought });
  assert.deepEqual(fought.filter((x) => x !== 'field'), ['c8_kamek']);
  assert.ok(c.flags[C8C.kamek] && c.objective === C8C_OBJ.kamek, 'c8_kamek');
  assert.ok(said(bot, '分身の術') && said(bot, 'こわくなかった'));
  const Sx = C8C_POS[4].seal;
  assert.ok(!isBlocked(PAST(4), Sx.x, Sx.y, (f) => !!c.flags[f]), 'まほうの かべが 消えた');
  await walkTo(bot, C8C_POS[4].up.x, C8C_POS[4].up.y);
  assert.equal(bot.s.map, c8cMapId(5));
  assert.ok(c.flags[C8C.engine] && c.objective === C8C_OBJ.engine, 'c8_engine');
  // 5階: 今の とびら（手紙が ない）→ 4階の ポコ → 千年前の 鉄の ポスト → 今の ポスト
  const P5 = C8C_POS[5];
  await place(bot, c8cMapId(5, true), P5.gate.x - 1, P5.gate.y);
  let f0 = bot.msgs.length;
  await examine(bot, P5.gate.x, P5.gate.y);
  assert.ok(said(bot, '合言葉を、言え', f0) && !c.flags[LETTER8C.found(LETTER8C_FORT)]);
  const Pk = C8C_POS[4].poco;
  await place(bot, c8cMapId(4), Pk.x - 1, Pk.y);
  await talk(bot, 'c8c_poco');
  assert.ok(c.flags[LETTER8C.start(LETTER8C_FORT)] && c.keyItems.includes(POCO_LETTER8C), 'ポコの 手紙');
  assert.equal(c.objective, C8C_OBJ.poco);
  const Bx = P5.box;
  await place(bot, c8cMapId(5, true), Bx.x - 1, Bx.y);
  await examine(bot, Bx.x, Bx.y);
  assert.ok(!c.flags[LETTER8C.found(LETTER8C_FORT)], '千年前で 入れる 前は 見つからない');
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(5));
  bot.choice = 0;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8C.bury(LETTER8C_FORT)] && !c.keyItems.includes(POCO_LETTER8C), '鉄の ポストに 入れた');
  await useGlass(bot);
  const [rid, rn] = letterReward8c(LETTER8C_FORT)[0];
  const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
  const before = cnt();
  f0 = bot.msgs.length;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8C.found(LETTER8C_FORT)] && said(bot, '大魔王クッパードさま', f0), '千年前の 手紙が とどいた（合言葉）');
  assert.equal(cnt(), before + rn, '手紙の ごほうび');
  assert.ok(!isBlocked(NOW(5), P5.gate.x, P5.gate.y, (f) => !!c.flags[f]), 'とびらが 開いた');
  await walkTo(bot, P5.up.x, P5.up.y);
  assert.equal(bot.s.map, c8cMapId(6, true), '今の 6階へ');
  // 7階の 休み所の 入口で 大魔王の 声
  for (const f of [PF8C(6), PF8C(7)]) c.flags[f] = true;
  const l4 = C8C_POS[7].links.find((x) => x.ch === '4');
  await place(bot, c8cMapId(7), l4.x, l4.y - 2);
  await stepOn(bot, l4.x, l4.y - 1);
  assert.ok(c.flags[VOICE8C] && c.objective === C8C_OBJ.rest7 && said(bot, '星は、だれかひとりの物じゃない'), '7階の 声');
  // 8階
  const A8 = C8C_POS[8].arrive;
  await place(bot, c8cMapId(8), A8.x, A8.y - 1);
  await stepOn(bot, A8.x, A8.y);
  assert.ok(c.flags[PF8C(8)] && c.objective === C8C_OBJ.f8);
  const f2 = [];
  await walkTo(bot, 15, C8C_POS[8].trigger.y, { fought: f2 });
  assert.deepEqual(f2, ['c8_bowser']);
  assert.ok(c.flags[WIN8C] && c.flags[CAGE8C] && c.flags[CALM8C] && c.flags[C8C.bowser], 'c8_bowser');
  assert.equal(c.objective, C8C_OBJ.bowser);
  for (const t of ['大事な人を守りたい', 'ひとりじめの心', '黒い星のかけら', 'ふういんの日は、あした。', 'かけらは、時のはざまへ', '約束だよ', '第8章　第3幕クリア！', '第8章　第4幕へ（続きはアップデートで！）']) assert.ok(said(bot, t), t);
  assert.ok(!c.guests.includes('rion8'), 'リオンは 泉の里に のこる');
  assert.equal(bot.s.map, FIELD, 'さいごは 泉の里');
  const has = (f) => !!c.flags[f];
  assert.ok(MAPS[FIELD].npcs.some((n) => n.id === 'c8c_minamo_back' && condOk(n.show, has)), 'ミナモが 里に もどった');
  assert.ok(MAPS[FIELD].npcs.some((n) => n.id === 'c8c_rion_back' && condOk(n.show, has)), 'リオンが 里に もどった');
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  const Mb = MAPS[FIELD].npcById.c8c_minamo_back;
  await place(bot, FIELD, Math.floor(Mb.x), Math.floor(Mb.y) + 1);
  await talk(bot, 'c8c_minamo_back');
  assert.ok(!said(bot, '第3幕クリア', n) && said(bot, 'ふういんの日は、あした', n));
  void world;
});

test('負けた 時・とちゅうで 切れた 時: マジカメック・クッパードに 負けたら すすまない・さいごの 場面は 広間・おりの ミナモ・泉の里の ミナモで 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(8811, 'c8_fortress', { extra: [PF8C(4), POCO8C] });
    await place(bot, c8cMapId(4), 15, 10);
    await walkTo(bot, 15, C8C_POS[4].trigger.y, { lose: () => true });
    assert.ok(!c.flags[C8C.kamek], 'マジカメックに 負けた');
    assert.ok(isBlocked(PAST(4), C8C_POS[4].seal.x, C8C_POS[4].seal.y, (f) => !!c.flags[f]), 'かべは そのまま');
  }
  {
    const { bot, c } = await setup(8812, 'c8_engine', { extra: [PF8C(8)] });
    const A8 = C8C_POS[8].arrive;
    await place(bot, c8cMapId(8), A8.x, A8.y);
    await walkTo(bot, 15, C8C_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN8C] && !c.flags[C8C.bowser], 'クッパードに 負けた');
  }
  for (const [seed, how, extra] of [[8813, 'hall', [WIN8C]], [8814, 'cage', [WIN8C]], [8815, 'cage2', [WIN8C, CAGE8C]], [8816, 'spring', [WIN8C, CAGE8C, CALM8C]]]) {
    const { bot, c } = await setup(seed, 'c8_engine', { extra: [PF8C(8), ...extra] });
    if (how === 'spring') {
      const m = MAPS[FIELD].npcById.c8c_minamo_wait;
      await place(bot, FIELD, Math.floor(m.x), Math.floor(m.y) + 1);
      await talk(bot, 'c8c_minamo_wait');
    } else if (how === 'cage' || how === 'cage2') {
      const Mn = C8C_POS[8].minamo;
      await place(bot, c8cMapId(8), Mn.x, Mn.y + 3);
      await talk(bot, 'c8c_minamo_cage');
    } else {
      await place(bot, c8cMapId(8), 15, C8C_POS[8].trigger.y + 1);
      await stepOn(bot, 15, C8C_POS[8].trigger.y);
    }
    assert.ok(c.flags[CALM8C] && c.flags[C8C.bowser], `${how}で 続き`);
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙（千年前の ミドリナ地方）: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const O = MAPS[OW], F = MAPS[FIELD];
  const allF = () => true;
  for (const k of LETTER8C_SIDE) {
    const p = LETTER8C_SPOTS[k];
    const dig = O.npcById[`c8c_dig_${k}`], bury = F.npcById[`c8c_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER8C.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(F.npcById[LETTER8C_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward8c(k).length, `ごほうび ${k}`);
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(O, x + 0.5, y + 0.5, allF) && canStand(F, x + 0.5, y + 0.5, allF));
    assert.ok(near, `${k}: 手紙の 場所の となりに どちらの 時代も 立てる`);
    assert.ok(timeArea(F)[p.y * F.w + p.x] && timeArea(O)[p.y * O.w + p.x], `${k}: 歩いて 行ける`);
  }
  assert.equal(Object.keys(C8C_LETTER_REWARDS).length, 3, '手紙の ごほうびは 3つ');
  const hints = subQuestHints();
  for (const q of C8C_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  for (const k of LETTER8C_SIDE) {
    const { bot, c } = await setup(8910 + k, 'c8_spring');
    const has = (f) => !!c.flags[f];
    const asker = F.npcById[LETTER8C_ASKERS[k]];
    const ax = Math.floor(asker.x), ay = Math.floor(asker.y);
    const side = D4.map(([dx, dy]) => [ax + dx, ay + dy]).find(([x, y]) => canStand(F, x + 0.5, y + 0.5, has));
    await place(bot, FIELD, side[0], side[1]);
    bot.choice = 0;
    await talk(bot, LETTER8C_ASKERS[k]);
    assert.ok(c.flags[LETTER8C.start(k)], `${k}: たのまれた`);
    const q1 = subQuests(c).find((q) => q.name === letterName8c(k));
    assert.ok(q1 && q1.find === `c8c_bury_${k}` && !q1.ready, 'クエストの 画面: うめる 場所');
    const p = LETTER8C_SPOTS[k];
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(O, x + 0.5, y + 0.5, has) && canStand(F, x + 0.5, y + 0.5, has));
    await place(bot, OW, near[0], near[1]);
    await talk(bot, `c8c_dig_${k}`);
    assert.ok(!c.flags[LETTER8C.found(k)], 'うめる 前は 何も ない');
    await place(bot, FIELD, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8c_bury_${k}`);
    assert.ok(c.flags[LETTER8C.bury(k)]);
    const q2 = subQuests(c).find((q) => q.name === letterName8c(k));
    assert.ok(q2 && q2.who === `c8c_dig_${k}` && q2.ready, 'クエストの 画面: 今で さがす');
    const [rid, rn] = letterReward8c(k)[0];
    const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
    const before = cnt();
    await place(bot, OW, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8c_dig_${k}`);
    assert.ok(c.flags[LETTER8C.found(k)] && cnt() === before + rn, `${k}: ごほうび`);
    assert.ok(labDoneQuests(c).includes(letterName8c(k)), 'クリアした たのまれごと');
    await talk(bot, `c8c_dig_${k}`);
    assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
  }
});

test('時の砂時計: ようさいの 中は おなじ 座標・8階は 使えない・泉の里の 中は 使えない', async () => {
  const { world, bot } = await setup(8511, 'c8_fortress');
  await place(bot, c8cMapId(2), 5, 3);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, c8cMapId(2, true));
  assert.deepEqual(here(bot), [5, 3], 'おなじ 座標');
  await place(bot, c8cMapId(8), 15, 12);
  assert.equal(glassCheck(world, bot.s).key, 'boss');
  await place(bot, FIELD, C8C_FIELD_POS.springIn.x, C8C_FIELD_POS.springIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 文字・絵 ─────────────
test('文字: 第8章 第3幕の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない・第4幕より 先の ことと カイの ひみつは 書かない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c8c.js', 'public/js/shared/data/sidequests-c8c.js',
    'public/js/shared/maps/c8c-field.js', 'public/js/shared/maps/c8c-fort.js', 'public/js/shared/maps/c8c-fort-rows.js', 'public/js/shared/maps/c8c-flags.js',
    'public/js/client/render/c8c-npc-art.js', 'public/js/client/render/tiles-c8c.js', 'public/js/shared/data/story-c8.js', 'public/js/shared/data/story-c8b.js', 'public/js/shared/data/items-c7-key.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c8_engine'), PF8C(6));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c8c_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  const end = JSON.stringify([SCRIPTS.c8c_boss_after(ctx(flagsOf(...UPTO('c8_engine'), WIN8C))), SCRIPTS.c8c_minamo_wait(ctx(flagsOf(...UPTO('c8_engine'), WIN8C, CAGE8C, CALM8C)))]);
  const tok = JSON.stringify(SCRIPTS.c6_tokine(ctx(flagsOf(...UPTO('c8_hades')))));
  for (const s of [all, end, tok]) {
    assert.ok(!/なかま/.test(s), 'なかま → 仲間');
    assert.ok(!/フリーザ|門番|見くだす|回廊|ソリトゥスの本当|第1部の人/.test(s), '第4幕より 先の 中みは 書かない');
    assert.ok(!/カイの心|カイの影|ひそんで.*カイ/.test(s), 'カイの ひみつには ふれない');
  }
  assert.ok(end.includes('ひとりじめの心') && end.includes('ふういんの日は、あした。') && end.includes('かけらは、時のはざまへ') && end.includes('第4幕へ'));
  assert.ok(tok.includes('ミドリナ地方'), '第2幕クリアの あとの トキネ');
});

test('絵と 音: ようさいの タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・人の え・クッパードと マジカメックの 大きな すがた・曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 367; id <= 394; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const t of [T.C8C_SKY, T.C8C_SLIDE_N, T.C8C_SLIDE_E, T.C8C_SLIDE_S, T.C8C_SLIDE_W, T.C8C_PROP_ON, T.C8C_LOCKDOOR, T.C8C_BARRIER, T.C8C_STEAM, T.C8C_CAGEBAR]) {
    assert.ok(isAnimated(t), TILE_INFO[t].name);
    assert.notEqual(paintTile(t, 0, 0, 0).px.join(), paintTile(t, 0, 1, 0).px.join(), `${TILE_INFO[t].name}が 動く`);
  }
  for (const id of [T.C8C_PROP_ON, T.C8C_PROP_OFF, T.C8C_CANNON_L, T.C8C_CANNON_R, T.C8C_SHUTTER_OPEN, T.C8C_SHUTTER_SHUT, T.C8C_MAILBOX, T.C8C_LOCKDOOR, T.C8C_BARRIER, T.C8C_STEAM, T.C8C_ANCHOR, T.C8C_WRECKDOOR, T.C8C_CAGEBAR]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(CH6_THEMES.c8c_iron && CH6_THEMES.c8c_wreck, 'テーマ');
  for (const id of [...C8C_MAPS, FIELD, OW]) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c8c_bowser_npc', 'c8c_kamek_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
    assert.notEqual(paintSpecial(k, 'down', 0).px.join(), paintSpecial(k, 'down', 1).px.join(), `${k} が 動く`);
  }
  const sprites = new Set(['rion', 'minamo', 'chibi_astel', 'past_woman', 'c8c_bowser', 'c8c_kamek', 'c8c_poco']);
  for (const id of [FIELD, OW, ...C8C_MAPS]) for (const n of MAPS[id].npcs) if (/^c8c_/.test(n.id) && !n.big && !/^capsule/.test(n.sprite)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  for (const s of sprites) { const o = npcOpts(s); if (o) assert.ok(/^#/.test(o.skin) && /^#/.test(o.hair), `人の え ${s} の 色`); }
  assert.ok(CH6_TRACKS.c8c_fort?.ch?.length, '曲 c8c_fort');
  for (const id of C8C_MAPS) assert.ok(['c8c_fort', 'toki_ruin', 'boss6'].includes(MAPS[id].bgm), id);
});
