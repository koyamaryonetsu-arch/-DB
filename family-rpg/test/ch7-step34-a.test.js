// 第2部 第7章 第2幕「海の紋章」Step 3・4（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c7_karim → 今の トキネ（c7_sea）→ 今の クモイ地方で 時の砂時計 → 千年前の クモイの 海 → ナギの村（c7_isle。カイが ゲスト）
// → しずむ前の島の 海賊船（c7_reef）→ しずむ前の島の灯台 1〜8階（c7_lamp）→ かぎ手の船長フックス → カイが 酒場の 仲間に（c7_kai）・4人が そろう
// しおの 満ち引き・時をこえる手紙（より道 3つ・灯台 5階の なぞとき）。戦いの 中みは B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { C7 } from '../public/js/shared/maps/c7-flags.js';
import {
  C7S, ARRIVE7S, LF7, EBB3, OPEN6S, WAIT6S, WIN7S, LETTER7S, LETTER7S_SIDE, LETTER7S_LIGHT, KEEPER_LETTER, C7S_SEA, PRESENT_SEA, VILLAGE, LIGHT_DOOR, REEF_ZONE,
  c7slMapId, C7SL_FLOORS, C7SL_NOW_FLOORS, C7SL_REST,
} from '../public/js/shared/maps/c7s-flags.js';
import { CH7S_MAPS } from '../public/js/shared/maps/c7.js';
import { C7SL_POS, C7SL_ROWS, C7SL_MAPS, c7slArrive, c7sTreasureOf, C7SL_CHEST_ERA } from '../public/js/shared/maps/c7s-light.js';
import { LETTER7S_SPOTS, LETTER7S_ASKERS, C7S_POS } from '../public/js/shared/maps/c7s-sea.js';
import { KUMOI_TOWN } from '../public/js/shared/maps/kumoi.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH7_STEPS, C7_OBJ, OLD_C7_OBJ, CH7_OBJECTIVE_TARGETS, CH7_OBJECTIVE_TALK } from '../public/js/shared/data/story-c7.js';
import { CH7S_STEPS, C7S_OBJ, CH7S_STORY_SCRIPTS, KAI_SUPPORT, VILLAIN7S } from '../public/js/shared/data/story-c7s.js';
import { C7S_SIDE_QUESTS, letterReward7s, letterName7s } from '../public/js/shared/data/sidequests-c7s.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { NPC_SUPPORTS, GUESTS, SHOPS } from '../public/js/shared/data/shops.js';
// 灯台の 宝箱の 中み・手紙の ごほうび（B の data/items-c7s.js。まとめる 時に そちらから）
import { C7S_TREASURE, C7S_LETTER_REWARDS } from '../public/js/shared/data/c7s-stub.js';
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
const PAST = (n) => MAPS[c7slMapId(n)];
const NOW = (n) => MAPS[c7slMapId(n, true)];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで。カイは c7_isle から c7_kai まで ゲスト
async function setup(seed, upto = 'c7_karim', { extra = [], frac = 0.2, kai = true } = {}) {
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
  c.guests = kai && c.flags[C7S.isle] && !c.flags[C7S.kai] ? ['kai'] : [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 74);
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
async function play(bot, { lose = () => false, fought = null, max = 40000, others = [] } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
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
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人を さける。しおの流れは のる 時だけ。大波は 時計を すすめて 待つ）
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
// しおの流れに のる（流される マスを 1つずつ ふむ。client/field.js の 流される うごきと おなじ）
async function ride(bot, x, y, opts) {
  const map = MAPS[bot.s.map];
  const r = carry(map, x, y, bot.world.hasFlagFn(bot.s));
  for (const [px, py] of r.path) await stepOn(bot, px, py, opts);
}
async function family(seed, upto = 'c7_isle', extraFlags = []) {
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
  Pa.char.guests = Pa.char.flags[C7S.isle] && !Pa.char.flags[C7S.kai] ? ['kai'] : [];
  boost(Pa.char, 74);
  boost(Y.char, 74);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y, clock };
}

// ───────────── 灯台の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ・大波の 時間（0 … a が うちよせる / 1 … b が うちよせる）
// うごき … 歩く（しおの流れは 流される）・待つ（7階。どちらの 時間でも ふさがらない マスだけ）・時の砂時計（その マスに 向こうの 時代で 立てる とき）・
//   3階の しおの かね（千年前。鳴らすたびに 引く ⇔ 満ちる）・5階の 戸だな（千年前で 手紙を 入れる → 今で 読む）・
//   6階の ふむ石（ひとり … 千年前で カイに 待ってもらう → 今の 石）
// opts: start … はじめの フラグ / shift … 時の砂時計 / kai … ゲストの カイ / family … 6階を 2人で / bell … 3階の かねを 鳴らせる
function solve(n, { start = [], shift = true, from = null, kai = true, family: fam = false, bell = true } = {}) {
  const P = C7SL_POS[n];
  const past = PAST(n), now = n <= C7SL_NOW_FLOORS ? NOW(n) : null;
  const a = c7slArrive(n);
  const s0 = { era: from?.era || 'past', x: from?.x ?? Math.floor(a.x), y: from?.y ?? Math.floor(a.y), flags: [...start], phase: 0 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const waves = P.waveA.length + P.waveB.length > 0;
  while (q.length) {
    const s = q.shift();
    cells.add(`${s.era}:${s.x},${s.y}`);
    if (n === 8 && s.y === P.trigger.y && s.x >= P.trigger.x && s.x < P.trigger.x + P.trigger.w) goals.push(s);
    const map = s.era === 'past' ? past : now;
    const has = (f) => (f === '@fireA' ? s.phase === 0 : f === '@fireB' ? s.phase === 1 : s.flags.includes(f));
    const push = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    const npcAt = (x, y) => map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.abs(x + 0.5 - (m.x + 0.5)) < (m.big ? 1.5 : 0.5) && (m.big ? y <= Math.floor(m.y) && y >= Math.floor(m.y) - 1 : Math.floor(m.y) === y));
    for (const [dx, dy] of D4) {
      let nx = s.x + dx, ny = s.y + dy;
      if (isBlocked(map, nx, ny, has) || npcAt(nx, ny) || map.chestAt.has(ny * map.w + nx)) continue;
      const w = map.warpAt.get(ny * map.w + nx);
      if (w) { if (s.era === 'past' && P.up && nx === P.up.x && ny === P.up.y) goals.push(s); continue; }
      const r = carry(map, nx, ny, has);
      if (r.pit) continue;
      [nx, ny] = [r.x, r.y];
      push({ ...s, x: nx, y: ny });
    }
    if (waves) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) <= 1;
    if (shift && now) {
      const other = s.era === 'past' ? now : past;
      if (canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    if (n === 3 && bell && s.era === 'past' && near(P.bell)) push({ ...s, flags: has(EBB3) ? s.flags.filter((f) => f !== EBB3) : [...s.flags, EBB3] });
    if (n === 5 && near(P.cabinet)) {
      const L = LETTER7S_LIGHT;
      if (s.era === 'past' && has(LETTER7S.start(L)) && !has(LETTER7S.bury(L))) push({ ...s, flags: [...s.flags, LETTER7S.bury(L)] });
      if (s.era === 'now' && has(LETTER7S.bury(L)) && !has(LETTER7S.found(L))) push({ ...s, flags: [...s.flags, LETTER7S.found(L)] });
    }
    if (n === 6 && !has(OPEN6S)) {
      const on1 = s.era === 'now' && s.x === P.plate1.x && s.y === P.plate1.y;
      const on2 = s.era === 'past' && s.x === P.plate2.x && s.y === P.plate2.y;
      if (on2 && kai && !has(WAIT6S)) push({ ...s, flags: [...s.flags, WAIT6S] });
      if (on1 && (has(WAIT6S) || fam)) push({ ...s, flags: [...s.flags.filter((f) => f !== WAIT6S), OPEN6S] });
    }
  }
  return { goals, seen, cells };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 4-3）: 物語の すすみ・マップの ID・出現表・きまった 戦い・ゲスト・宝箱・タイル・酒場の カイ', () => {
  assert.deepEqual(CH7S_STEPS, ['c7_sea', 'c7_isle', 'c7_reef', 'c7_lamp', 'c7_kai']);
  assert.deepEqual(CH7_STEPS, ['c7_start', 'c7_kingdom', 'c7_gate', 'c7_temple', 'c7_karim', ...CH7S_STEPS], 'c7_karim の うしろ');
  const ki = STORY_STEPS.indexOf('c7_karim');
  assert.deepEqual(STORY_STEPS.slice(ki + 1, ki + 6), CH7S_STEPS);
  // マップ（千年前の クモイの 海・灯台 1〜8階。今の がわ 1〜7階）
  const want = [C7S_SEA, ...Array.from({ length: 8 }, (_, i) => `c7s_light_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c7s_light_${i + 1}f_now`)];
  assert.deepEqual(CH7S_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c7s'), 'マップの 名前の 先頭は c7s');
  }
  const F = MAPS[C7S_SEA], K = MAPS[PRESENT_SEA];
  assert.ok(F.past && F.kind === 'field' && F.theme === 'past');
  assert.deepEqual([F.w, F.h], [K.w, K.h], '今の クモイ地方と おなじ 大きさ');
  assert.equal(F.timePair, PRESENT_SEA);
  assert.equal(K.timePair, C7S_SEA);
  for (let n = 1; n <= 8; n++) {
    const m = PAST(n);
    assert.ok(m.kind === 'dungeon' && m.past, `${n}階`);
    if (n <= C7SL_NOW_FLOORS) {
      assert.equal(m.timePair, c7slMapId(n, true));
      assert.equal(NOW(n).timePair, c7slMapId(n));
      assert.deepEqual([m.w, m.h], [NOW(n).w, NOW(n).h], 'おなじ 大きさ');
      assert.ok(!NOW(n).warps.length, '今の がわの かいだんは がれきで うまっている');
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  // 出現表（B）: フィールド t7_sea・灯台 t7_light（休み所・ボスの 階は 出ない）
  assert.ok(F.spawnCounts.t7_sea > 0 && ENCOUNTER_TABLES.t7_sea?.length);
  assert.equal(F.zoneAt(C7S_POS.villageIn.x, C7S_POS.villageIn.y), 'safe:village', '村の 中は 出ない');
  assert.equal(F.zoneAt(LIGHT_DOOR.x, LIGHT_DOOR.y + 1), 'safe:light', '灯台の 前は 出ない');
  assert.equal(F.zoneAt(34, 30), 't7_sea', '島の 上は 出る');
  for (let n = 1; n <= 8; n++) {
    const sc = PAST(n).spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc.t7_light > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t7_light?.length);
  assert.equal(PAST(4).zoneAt(15, 9), 'safe:rest');
  assert.equal(PAST(7).zoneAt(24, 3), 'safe:rest');
  // きまった 戦い（B）
  for (const id of ['c7_reef', 'c7_light']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // ゲスト（B）・酒場の カイ（A が 台本で 入れる）
  assert.ok(GUESTS.kai && GUESTS.kai.name === 'カイ');
  const k = NPC_SUPPORTS.find((s) => s.id === 'npc_kai');
  assert.ok(k && k === KAI_SUPPORT && k.unlock === 'c7_kai' && k.name === 'カイ' && k.desc);
  // 宝箱（B の C7S_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C7SL_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...PAST(n).chests, ...(n <= 7 ? NOW(n).chests : [])];
    assert.equal(list.length, 2, `${n}階の 宝箱`);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
    assert.equal(c7sTreasureOf(n).length, 2);
    assert.equal(C7SL_CHEST_ERA[n].length, 2);
  }
  assert.ok(Object.keys(C7S_TREASURE).length >= 8 || C7S_TREASURE.length >= 16);
  // ナギの村の 店
  for (const id of ['c7s_weapon', 'c7s_armor', 'c7s_item']) assert.ok(SHOPS[id]?.items.length && SHOPS[id].items.every((i) => ITEMS[i]), id);
  // タイル（326 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C7S_BOARD, T.C7S_WET_SAND, T.C7S_BELL, T.C7S_WAVE_FLOOR, T.C7S_WAVE, T.C7S_KDOOR, T.C7S_CABINET, T.C7S_LAMP, T.C7S_LAMP_ON, T.C7S_DRY, T.C7S_REEF];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 326 + i));
  assert.equal(Math.max(...ids), 336);
  assert.ok(!TILE_INFO[T.C7S_BOARD].solid && !TILE_INFO[T.C7S_WET_SAND].solid && !TILE_INFO[T.C7S_DRY].solid && !TILE_INFO[T.C7S_WAVE_FLOOR].solid);
  for (const t of [T.C7S_BELL, T.C7S_WAVE, T.C7S_KDOOR, T.C7S_CABINET, T.C7S_LAMP, T.C7S_LAMP_ON, T.C7S_REEF]) assert.ok(TILE_INFO[t].solid, TILE_INFO[t].name);
  // だいほんが ぜんぶ ある
  for (const id of CH7S_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, PRESENT_SEA]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[KEEPER_LETTER]?.type === 'key', '大事な物「灯台守の手紙」');
  assert.equal(VILLAIN7S, 'かぎ手の船長フックス');
});

// ───────────── 目標 ─────────────
test('目標: 第1幕クリアの セーブは 新しい 目標に なおる・フラグごとの 目標・仲間会話・地図の しるし', () => {
  assert.equal(OLD_C7_OBJ.karim, '第7章の続きはアップデートで！');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C7_OBJ.karim), '前の 版の 第1幕クリアの 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c7_karim')), objective: OLD_C7_OBJ.karim };
  assert.ok(repairObjective(old) && old.objective === C7_OBJ.karim);
  assert.ok(C7_OBJ.karim.includes('トキネ') && !C7_OBJ.karim.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c7_karim')), objective: C7_OBJ.karim };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L = LETTER7S_LIGHT;
  const table = [
    [['c7_karim'], C7_OBJ.karim], [['c7_sea'], C7S_OBJ.sea], [['c7_sea', ARRIVE7S], C7S_OBJ.arrive], [['c7_isle'], C7S_OBJ.isle],
    [['c7_reef'], C7S_OBJ.reef], [['c7_lamp'], C7S_OBJ.lamp], [['c7_lamp', LF7(2)], C7S_OBJ.lf2], [['c7_lamp', LF7(3), EBB3], C7S_OBJ.lf3],
    [['c7_lamp', LF7(4)], C7S_OBJ.lf4], [['c7_lamp', LF7(5)], C7S_OBJ.lf5], [['c7_lamp', LF7(4), LETTER7S.start(L)], C7S_OBJ.keeper],
    [['c7_lamp', LF7(5), LETTER7S.start(L)], C7S_OBJ.keeper], [['c7_lamp', LF7(5), LETTER7S.bury(L)], C7S_OBJ.l4bury], [['c7_lamp', LF7(5), LETTER7S.found(L)], C7S_OBJ.l4found],
    [['c7_lamp', LF7(6)], C7S_OBJ.lf6], [['c7_lamp', LF7(6), OPEN6S], C7S_OBJ.open6], [['c7_lamp', LF7(7)], C7S_OBJ.lf7], [['c7_lamp', LF7(8)], C7S_OBJ.lf8],
    [['c7_lamp', LF7(8), WIN7S], C7S_OBJ.win], [['c7_kai'], C7S_OBJ.kai],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C7S_OBJ), ['karim', C7_OBJ.karim]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH7_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH7_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  assert.ok(C7S_OBJ.kai.startsWith('第7章の続きはアップデートで！'));
  assert.notEqual(C7S_OBJ.kai, OLD_C7_OBJ.karim, '前の 版の 文と ちがう（なおせる ように）');
  // 地図の しるし（その 時代の マップだけ。すんだら 消える）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const P6 = C7SL_POS[6];
  assert.ok(mark(C7S_OBJ.lf6, c7slMapId(6)).some((m) => m.x === P6.plate2.x && m.y === P6.plate2.y), '6階の 千年前の 石');
  assert.ok(mark(C7S_OBJ.lf6, c7slMapId(6, true)).some((m) => m.x === P6.plate1.x && m.y === P6.plate1.y), '6階の 今の 石');
  assert.ok(!mark(C7S_OBJ.lf6, c7slMapId(6), [OPEN6S]).some((m) => m.x === P6.plate2.x && m.y === P6.plate2.y), '開いたら 消える');
  const Cb = C7SL_POS[5].cabinet;
  assert.ok(mark(C7S_OBJ.l4bury, c7slMapId(5, true)).some((m) => m.x === Cb.x && m.y === Cb.y), '今の 戸だな');
  assert.ok(mark(C7S_OBJ.sea, PRESENT_SEA).length, '今の クモイ地方');
  assert.ok(mark(C7_OBJ.karim, 'overworld').length, '今の トキネ');
});

// ───────────── 時代の 行き来 ─────────────
test('時の砂時計: 今の クモイ地方 ⇔ 千年前の 海（c7_sea から）・町の 中は 使えない・おなじ 座標・村から 歩いて 行ける', async () => {
  const K = MAPS[PRESENT_SEA], F = MAPS[C7S_SEA];
  const G = C7S_POS.glass;
  assert.equal(K.timeSpot(G.x, G.y, () => false), 'c7swait', 'トキネの 話の 前は 使えない');
  assert.equal(K.timeSpot(G.x, G.y, (fl) => fl === C7S.sea), '');
  assert.ok(GLASS_TEXT.c7swait);
  // 町の 中（今の ハネノの 町の 生けがき・星読みの里・千年前の ナギの村）
  assert.equal(K.timeNoUse(KUMOI_TOWN.x + 3, KUMOI_TOWN.y + 3), 'town');
  assert.equal(K.timeNoUse(6, 25), 'town');
  assert.equal(F.timeNoUse(C7S_POS.villageIn.x, C7S_POS.villageIn.y), 'town');
  assert.equal(F.timeNoUse(G.x, G.y), null);
  // 目標の しるしの 場所は どちらの 時代でも 立てて、村から 歩いて 行ける
  const all = () => true;
  assert.ok(canStand(K, G.x + 0.5, G.y + 0.5, all) && canStand(F, G.x + 0.5, G.y + 0.5, all));
  const area = timeArea(F);
  const spots = [[G.x, G.y], [LIGHT_DOOR.x, LIGHT_DOOR.y + 1], [C7S_POS.landing.x, C7S_POS.landing.y], ...Object.values(LETTER7S_SPOTS).map((p) => [p.x, p.y]), [34, 32], [6, 30]];
  for (const [x, y] of spots) assert.ok(area[y * F.w + x], `千年前: (${x},${y}) は 村から 歩いて 行ける`);
  const kArea = timeArea(K);
  for (const p of Object.values(LETTER7S_SPOTS)) {
    assert.ok(kArea[p.y * K.w + p.x], `今: 手紙の 場所 (${p.x},${p.y})`);
    assert.ok(canStand(K, p.x + 0.5, p.y + 0.5, all) && canStand(F, p.x + 0.5, p.y + 0.5, all), `手紙の 場所は どちらの 時代も 立てる (${p.x},${p.y})`);
  }
  // 千年前は 海と 島（雲は ない）・しおの流れ・灯台
  const fTiles = new Set(F.tiles);
  for (const t of [T.WATER, T.DEEP, T.SAND, T.PALM, T.C7_CUR_W, T.C7_CUR_S, T.C7S_REEF]) assert.ok(fTiles.has(t), TILE_INFO[t].name);
  assert.ok(!fTiles.has(T.CLOUD_SEA) && !fTiles.has(T.CLOUD_RIM) && !fTiles.has(T.SKYWIND_W), '雲と 風の道は ない');
  // 今の 風の道は 千年前の しおの流れ（おなじ 向き）
  assert.equal(F.tiles[29 * F.w + 44], T.C7_CUR_W);
  assert.equal(K.tiles[29 * K.w + 44], T.SKYWIND_W);
  // サーバー: ハネノの島の 西で 使う → 千年前の おなじ 座標 → もどる
  const { world, bot, c } = await setup(7111, 'c7_karim');
  await place(bot, PRESENT_SEA, G.x, G.y);
  const f0 = bot.msgs.length;
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_SEA, 'トキネの 話の 前は 何も おこらない');
  assert.ok(bot.msgs.slice(f0).some((m) => JSON.stringify(m).includes('波の音')));
  c.flags[C7S.sea] = true;
  world.sendSelf(bot.s);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, C7S_SEA);
  assert.deepEqual(here(bot), [G.x, G.y], 'おなじ 座標');
  await stepOn(bot, G.x, G.y + 1);
  assert.ok(c.flags[ARRIVE7S], 'はじめて 着いた 場面');
  assert.ok(said(bot, '海の紋章'), '章の 字');
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_SEA, '今へ もどる');
  // 町の 中では 使えない
  await place(bot, C7S_SEA, C7S_POS.villageIn.x, C7S_POS.villageIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 灯台の とき方 ─────────────
test('しずむ前の島の灯台: どの 階も ひとりで 上へ 行ける・時の砂時計を 使わないと 行けない 階・今の がわから もどれる', () => {
  const start = (n) => (n >= 5 ? [LETTER7S.start(LETTER7S_LIGHT)] : []);
  for (let n = 1; n <= C7SL_FLOORS; n++) {
    const r = solve(n, { start: start(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '上へ'} 行ける`);
    const noShift = solve(n, { start: start(n), shift: false });
    if ([1, 2, 5, 6].includes(n)) assert.ok(!noShift.goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
    else assert.ok(noShift.goals.length, `${n}階: 時の砂時計なしでも 行ける`);
    // 宝箱は その 時代で 取りに 行ける（となりに 立てる）
    for (const now of n <= C7SL_NOW_FLOORS ? [false, true] : [false]) {
      for (const ch of (now ? NOW(n) : PAST(n)).chests) {
        const era = now ? 'now' : 'past';
        assert.ok(D4.some(([dx, dy]) => r.cells.has(`${era}:${ch.x + dx},${ch.y + dy}`)), `${n}階 ${era} の 宝箱 (${ch.x},${ch.y})`);
      }
    }
    // 今の がわの どこに いても、千年前に もどれる 場所まで 歩ける（とじこめられない）
    if (n > C7SL_NOW_FLOORS) continue;
    const now = NOW(n), past = PAST(n);
    const all = () => true;
    for (const cell of r.cells) {
      if (!cell.startsWith('now:')) continue;
      const [x, y] = cell.slice(4).split(',').map(Number);
      const reach = new Set([`${x},${y}`]);
      const q = [[x, y]];
      let back = false;
      while (q.length && !back) {
        const [cx, cy] = q.shift();
        if (canStand(past, cx + 0.5, cy + 0.5, all)) back = true;
        for (const [dx, dy] of D4) {
          const nx = cx + dx, ny = cy + dy;
          if (isBlocked(now, nx, ny, all) || reach.has(`${nx},${ny}`)) continue;
          reach.add(`${nx},${ny}`);
          q.push([nx, ny]);
        }
      }
      assert.ok(back, `${n}階 今の (${x},${y}) から 千年前に もどれる`);
    }
  }
  // 3階: かねを 鳴らさないと 行けない・5階: 手紙が ないと とびらは 開かない・6階: カイが いない ひとりでは 開かない
  assert.ok(!solve(3, { bell: false }).goals.length, '3階は しおの かねを 鳴らさないと 行けない');
  assert.ok(!solve(5, {}).goals.length, '5階: 灯台守の 手紙が ないと からくりの とびらは 開かない');
  assert.ok(solve(5, { start: [LETTER7S.start(LETTER7S_LIGHT)] }).goals.every((g) => g.flags.includes(LETTER7S.found(LETTER7S_LIGHT))));
  assert.ok(!solve(6, { kai: false }).goals.length, '6階: ひとりで カイも いないと 開かない');
  assert.ok(solve(6, { kai: false, family: true }).goals.length, '6階: 家族 2人なら 開く');
  // 1階の 出口は 千年前の 灯台の とびらの 外
  const f1 = PAST(1);
  const out = f1.warpAt.get(C7SL_POS[1].exit.y * f1.w + C7SL_POS[1].exit.x).to;
  assert.equal(out.map, C7S_SEA);
  const F = MAPS[C7S_SEA];
  assert.equal(F.warpAt.get(LIGHT_DOOR.y * F.w + LIGHT_DOOR.x).to.map, c7slMapId(1));
  assert.ok(isBlocked(F, LIGHT_DOOR.x, LIGHT_DOOR.y, () => false) && !isBlocked(F, LIGHT_DOOR.x, LIGHT_DOOR.y, (fl) => fl === C7S.reef), '灯台の とびらは 中ボスを たおすと 開く');
  // 上の 階から 下りると、上への かいだんの となりに 着く（上り下りが つながる）
  for (let n = 2; n <= 8; n++) {
    const D = C7SL_POS[n].down;
    const to = PAST(n).warpAt.get(D.y * PAST(n).w + D.x).to;
    const U = C7SL_POS[n - 1].up;
    assert.ok(to.map === c7slMapId(n - 1) && Math.abs(Math.floor(to.x) - U.x) + Math.abs(Math.floor(to.y) - U.y) === 1, `${n}階 → ${n - 1}階`);
    assert.ok(canStand(PAST(n - 1), to.x, to.y, () => false));
  }
  // 休み所（4階・7階の おく）の いずみ
  for (const n of C7SL_REST) assert.ok(PAST(n).actions.some((a) => a.script === 'c7s_lfont'), `${n}階の いずみ`);
});

test('しおの 満ち引き: 時代を かえると 水の 高さが かわる（千年前 … 満ち潮・今 … 水が ない）・3階の しおの かね（引き潮 ⇔ 満ち潮）', async () => {
  const none = () => false;
  // 1階: 満ち潮の 水（千年前は 通れない・今は かわいた 海の そこ）と うき板（千年前は 歩ける・今は 雲の 海）
  const S1 = C7SL_POS[1].sea[0];
  assert.ok(isBlocked(PAST(1), S1.x, S1.y, none) && !isBlocked(NOW(1), S1.x, S1.y, none));
  assert.equal(NOW(1).tiles[S1.y * 32 + S1.x], T.C7S_DRY);
  const B1 = { x: 5, y: 5 };
  assert.equal(PAST(1).tiles[B1.y * 32 + B1.x], T.C7S_BOARD);
  assert.ok(!isBlocked(PAST(1), B1.x, B1.y, none) && isBlocked(NOW(1), B1.x, B1.y, none));
  assert.equal(NOW(1).tiles[B1.y * 32 + B1.x], T.CLOUD_SEA);
  // 3階: w … 満ち潮は 水・引き潮は ぬれた 砂 / u … 満ち潮は うき板・引き潮は 深い 水（今は どちらも 水が ない・くずれて いる）
  const P3 = C7SL_POS[3];
  const w = P3.ebb[0], u = P3.boards[0];
  const ebb = (f) => f === EBB3;
  assert.ok(isBlocked(PAST(3), w.x, w.y, none) && !isBlocked(PAST(3), w.x, w.y, ebb));
  assert.equal(effectiveTile(PAST(3), w.x, w.y, ebb), T.C7S_WET_SAND);
  assert.ok(!isBlocked(PAST(3), u.x, u.y, none) && isBlocked(PAST(3), u.x, u.y, ebb));
  assert.ok(!isBlocked(NOW(3), w.x, w.y, none) && isBlocked(NOW(3), u.x, u.y, none));
  // 3階の とき方は 満ち潮・引き潮の 両方を 使う（うき板 → かね → ぬれた 砂）
  const r3 = solve(3);
  assert.ok(r3.goals.length && r3.goals.every((g) => g.flags.includes(EBB3)), '引き潮で 上へ');
  assert.ok(!solve(3, { start: [EBB3], bell: false }).goals.length, 'はじめから 引き潮でも かねが ないと 行けない（うき板が しずむ）');
  // サーバー: 千年前の かねを 鳴らすと 引く・もう 1回で 満ちる・今の かねは さびている
  const { bot, c } = await setup(7211, 'c7_lamp', { extra: [LF7(2), LF7(3)] });
  const B = P3.bell;
  await place(bot, c7slMapId(3, true), B.x, B.y + 1);
  await examine(bot, B.x, B.y);
  assert.ok(!c.flags[EBB3], '今の かねは さびている');
  await place(bot, c7slMapId(3), B.x, B.y + 1);
  bot.choice = 0;
  await examine(bot, B.x, B.y);
  assert.ok(c.flags[EBB3], '引き潮');
  assert.ok(!isBlocked(PAST(3), w.x, w.y, (f) => !!c.flags[f]));
  await examine(bot, B.x, B.y);
  assert.ok(!c.flags[EBB3], 'もう 1回で 満ち潮');
});

test('大波（7階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C7SL_POS[7];
  const m = PAST(7);
  assert.ok(P.waveA.length >= 4 && P.waveB.length >= 4);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.waveA.map(k)), B = new Set(P.waveB.map(k));
  for (const p of [...P.waveA, ...P.waveB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の 波が ない`);
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.ok(isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), 'うちよせる 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), 'ひいている 時は 通れる');
  }
  const noWait = (() => {
    const a = c7slArrive(7);
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
    return seen.has(`${P.up.x},${P.up.y}`);
  })();
  assert.ok(!noWait, 'ずっと 同じ 時間では 通れない');
  assert.ok(solve(7).goals.length, '待てば 通れる');
  for (const p of P.waveA) assert.equal(NOW(7).tiles[p.y * 32 + p.x], T.CLOUD_SEA, '今の がわは 通路が くずれている');
});

// ───────────── サーバーで: 5階（時をこえる手紙）・6階 ─────────────
test('サーバー: 5階 灯台守の 手紙を 千年前の 戸だなに → 今の 戸だなで 読むと からくりの とびらが 開く', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(7221, 'c7_lamp', { extra: [LF7(2), LF7(3), LF7(4), LF7(5)] });
  const P5 = C7SL_POS[5];
  const Cb = P5.cabinet, Kd = P5.kdoor;
  // 先に 今の とびら（手紙が ない）
  await place(bot, c7slMapId(5, true), Kd.x - 1, Kd.y);
  let f0 = bot.msgs.length;
  await examine(bot, Kd.x, Kd.y);
  assert.ok(said(bot, '合言葉', f0) && !c.flags[LETTER7S.found(LETTER7S_LIGHT)]);
  // 千年前の 戸だな（手紙が まだ ない）
  await useGlass(bot);
  assert.equal(bot.s.map, c7slMapId(5));
  await examine(bot, Cb.x, Cb.y);
  assert.ok(!c.flags[LETTER7S.bury(LETTER7S_LIGHT)]);
  // 4階の ゲンじい → 手紙
  const G = C7SL_POS[4].keeper;
  await place(bot, c7slMapId(4), G.x, G.y + 1);
  await talk(bot, 'c7s_gen');
  assert.ok(c.flags[LETTER7S.start(LETTER7S_LIGHT)] && c.keyItems.includes(KEEPER_LETTER), '灯台守の 手紙を もらった');
  assert.equal(c.objective, C7S_OBJ.keeper);
  // 今の 戸だなは まだ からっぽ（千年前で 入れる 前）
  await place(bot, c7slMapId(5, true), Cb.x - 1, Cb.y);
  await examine(bot, Cb.x, Cb.y);
  assert.ok(!c.flags[LETTER7S.found(LETTER7S_LIGHT)], '千年前で 入れる 前は 見つからない');
  // 千年前で 入れる → 今で 読む
  await useGlass(bot);
  bot.choice = 0;
  await examine(bot, Cb.x, Cb.y);
  assert.ok(c.flags[LETTER7S.bury(LETTER7S_LIGHT)] && !c.keyItems.includes(KEEPER_LETTER), '戸だなに 入れた');
  await useGlass(bot);
  f0 = bot.msgs.length;
  await examine(bot, Cb.x, Cb.y);
  assert.ok(c.flags[LETTER7S.found(LETTER7S_LIGHT)] && said(bot, 'ひかれ、海の道しるべ', f0), '千年前の 手紙が とどいた');
  assert.ok(!isBlocked(NOW(5), Kd.x, Kd.y, (f) => !!c.flags[f]), 'からくりの とびらが 開いた');
  await walkTo(bot, 26, 9);
  await useGlass(bot);
  assert.equal(bot.s.map, c7slMapId(5));
  await walkTo(bot, P5.up.x, P5.up.y);
  assert.equal(bot.s.map, c7slMapId(6), '6階へ');
  assert.ok(c.flags[LF7(6)], '6階に 来た');
});

test('6階の ふむ石: ひとり（千年前の 石で カイに 待ってもらう）・カイが いない・家族 2人（1人ずつ 別の 時代で。どちらが 先でも）', { timeout: 200000 }, async () => {
  const P = C7SL_POS[6];
  {
    const { bot, c } = await setup(7231, 'c7_lamp', { extra: [LF7(6)] });
    await place(bot, c7slMapId(6, true), P.plate1.x, P.plate1.y - 1);
    const f0 = bot.msgs.length;
    await stepOn(bot, P.plate1.x, P.plate1.y);
    assert.ok(!c.flags[OPEN6S] && said(bot, '千年前の、もう1つの石', f0), 'ひとりでは 開かない');
    await place(bot, c7slMapId(6), P.plate2.x, P.plate2.y - 1);
    bot.choice = 0;
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(c.flags[WAIT6S] && !c.flags[OPEN6S], 'カイが 待つ');
    await useGlass(bot);
    await walkTo(bot, P.plate1.x, P.plate1.y);
    assert.ok(c.flags[OPEN6S] && !c.flags[WAIT6S], 'カイが 千年前の 石を おさえて 開いた');
    for (const now of [false, true]) assert.ok(!isBlocked(MAPS[c7slMapId(6, now)], P.door.x, P.door.y, (f) => !!c.flags[f]), 'どちらの 時代も 開く');
    // 今の がわの 近道を 通って 東の へやで 千年前へ
    await walkTo(bot, P.door.x + 5, P.door.y);
    await useGlass(bot);
    assert.equal(bot.s.map, c7slMapId(6));
    await walkTo(bot, P.up.x, P.up.y);
    assert.equal(bot.s.map, c7slMapId(7), '近道で 7階へ');
  }
  {
    const { bot, c } = await setup(7232, 'c7_lamp', { extra: [LF7(6)], kai: false });
    await place(bot, c7slMapId(6), P.plate2.x, P.plate2.y - 1);
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(!c.flags[WAIT6S], 'カイが いないと 待ってもらえない');
  }
  for (const first of ['yui', 'papa']) {
    const { world, papa, yui, Pa, Y } = await family(first === 'yui' ? 7233 : 7234, 'c7_lamp', [LF7(6)]);
    world.placeSession(Pa, c7slMapId(6), P.plate2.x + 0.5, P.plate2.y - 0.5, 'down', true);
    world.placeSession(Y, c7slMapId(6, true), P.plate1.x + 0.5, P.plate1.y - 0.5, 'down', true);
    await play(papa, { others: [yui] });
    papa.choice = 1; // カイには たのまない
    yui.choice = 1;
    const yFlags = JSON.stringify(Y.char.flags);
    const steps = first === 'yui' ? [[yui, P.plate1], [papa, P.plate2]] : [[papa, P.plate2], [yui, P.plate1]];
    for (const [b, p] of steps) await stepOn(b, p.x, p.y, { others: [b === papa ? yui : papa] });
    assert.ok(Pa.char.flags[OPEN6S] && !Pa.char.flags[WAIT6S], `${first}が 先: 2人で 開いた`);
    assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは かわらない');
  }
});

// ───────────── 通し ─────────────
test('通しで: c7_karim → トキネ → 千年前の クモイの 海 → ナギの村（カイが ゲスト）→ 海賊船 → 灯台 → 船長 → カイが 酒場へ（c7_kai）・4人が そろう', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(7411, 'c7_karim');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C7S.sea] && c.objective === C7S_OBJ.sea, 'c7_sea');
  // 今の クモイ地方の ハネノの島の 西で 砂時計 → 千年前
  const G = C7S_POS.glass;
  await place(bot, PRESENT_SEA, G.x, G.y);
  await useGlass(bot);
  assert.equal(bot.s.map, C7S_SEA);
  await stepOn(bot, G.x, G.y - 1);
  assert.ok(c.flags[ARRIVE7S] && c.objective === C7S_OBJ.arrive);
  // ナギの村（西の はしから 入る）
  await walkTo(bot, VILLAGE.x, VILLAGE.y + 7);
  assert.ok(c.flags[C7S.isle] && c.guests.includes('kai'), 'カイが ゲスト');
  assert.equal(c.objective, C7S_OBJ.isle);
  assert.ok(said(bot, '光らないんだ'), 'カイの 紋章は 光らない');
  // しおの流れで しずむ前の島へ（村の 西の 船着き場 → 西 → 北 → 西 → 南）
  await place(bot, C7S_SEA, 45, 29);
  const fought = [];
  for (const [fx, fy, nx, ny] of [[45, 29, 44, 29], [34, 26, 34, 25], [18, 19, 18, 20]]) {
    await walkTo(bot, fx, fy);
    await ride(bot, nx, ny, { fought });
  }
  assert.deepEqual(here(bot), [18, 37], 'しおの流れで しずむ前の島の 北の はまへ');
  assert.deepEqual(fought, ['c7_reef']);
  assert.ok(c.flags[C7S.reef] && c.objective === C7S_OBJ.reef);
  // 灯台へ
  await walkTo(bot, LIGHT_DOOR.x, LIGHT_DOOR.y);
  assert.equal(bot.s.map, c7slMapId(1));
  await stepOn(bot, Math.floor(c7slArrive(1).x), Math.floor(c7slArrive(1).y) - 1);
  assert.ok(c.flags[C7S.lamp] && c.objective === C7S_OBJ.lamp, 'c7_lamp');
  // 8階（しかけは 上の テストで）
  for (const f of [LF7(2), LF7(3), LF7(4), LF7(5), LF7(6), LF7(7), OPEN6S]) c.flags[f] = true;
  const a8 = c7slArrive(8);
  await place(bot, c7slMapId(8), Math.floor(a8.x), Math.floor(a8.y));
  await stepOn(bot, Math.floor(a8.x), Math.floor(a8.y) - 1);
  assert.ok(c.flags[LF7(8)] && c.objective === C7S_OBJ.lf8);
  const T8 = C7SL_POS[8].trigger;
  const f2 = [];
  await walkTo(bot, 15, T8.y, { fought: f2 });
  assert.deepEqual(f2, ['c7_light']);
  assert.ok(c.flags[WIN7S] && c.flags[C7S.kai], 'c7_kai');
  assert.ok(!c.guests.includes('kai'), 'カイは ゲストから はずれる');
  assert.equal(c.objective, C7S_OBJ.kai);
  assert.ok(said(bot, '第7章の続きはアップデートで！'));
  assert.ok(said(bot, '（カイが、ルミナの町の酒場の仲間になった！）'));
  for (const who of ['リオン', 'ミナモ', 'カリム', 'カイ']) assert.ok(said(bot, `"${who}"`), `4人が そろう 場面: ${who}`);
  assert.equal(bot.s.map, C7S_SEA, 'さいごは ナギの村の はま');
  assert.equal(effectiveTile(PAST(8), C7SL_POS[8].lamp.x, C7SL_POS[8].lamp.y, (f) => !!c.flags[f]), T.C7S_LAMP_ON, '灯台の 火が ともった');
  // 酒場の 仲間（unlock）
  assert.ok(NPC_SUPPORTS.some((s) => s.id === 'npc_kai' && c.flags[s.unlock]));
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  await talk(bot, 'c7s_gen_home');
  assert.ok(!said(bot, 'ルミナの町の酒場の仲間になった', n));
  void world;
});

test('負けた 時・とちゅうで 切れた 時: 海賊船・船長に 負けたら すすまない・さいごの 場面は 大ランプか ゲンじい・村長で 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(7511, 'c7_isle');
    await place(bot, C7S_SEA, REEF_ZONE.x + 4, REEF_ZONE.y + 3);
    await walkTo(bot, REEF_ZONE.x + 4, REEF_ZONE.y + 1, { lose: () => true });
    assert.ok(!c.flags[C7S.reef], '海賊船に 負けた');
  }
  {
    const { bot, c } = await setup(7512, 'c7_lamp', { extra: [LF7(8)] });
    const a8 = c7slArrive(8);
    await place(bot, c7slMapId(8), Math.floor(a8.x), Math.floor(a8.y));
    await walkTo(bot, 15, C7SL_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN7S] && !c.flags[C7S.kai], '船長に 負けた');
  }
  for (const [seed, how] of [[7513, 'gen'], [7514, 'lamp'], [7515, 'elder']]) {
    // 勝った あと 切れた（WIN7S だけ）→ 続き
    const { bot, c } = await setup(seed, 'c7_lamp', { extra: [LF7(8), WIN7S] });
    assert.equal(c.objective, C7S_OBJ.win);
    if (how === 'gen') {
      await place(bot, C7S_SEA, C7S_POS.kaiHome.x - 1, C7S_POS.kaiHome.y);
      await talk(bot, 'c7s_gen_home');
    } else if (how === 'elder') {
      await place(bot, C7S_SEA, C7S_POS.elder.x + 1, C7S_POS.elder.y);
      await talk(bot, 'c7s_elder');
    } else {
      const L = C7SL_POS[8].lamp;
      await place(bot, c7slMapId(8), L.x, L.y + 1);
      await examine(bot, L.x, L.y);
    }
    assert.ok(c.flags[C7S.kai] && !c.guests.includes('kai'), `${how}で 続き`);
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙（海の 地方）: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const K = MAPS[PRESENT_SEA], F = MAPS[C7S_SEA];
  for (const k of LETTER7S_SIDE) {
    const p = LETTER7S_SPOTS[k];
    const dig = K.npcById[`c7s_dig_${k}`], bury = F.npcById[`c7s_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER7S.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(condOk(dig.show, (f) => f === LETTER7S.bury(k)) && !condOk(dig.show, (f) => f === LETTER7S.bury(k) || f === LETTER7S.found(k)), 'うめた あと・見つける まで');
    assert.ok(F.npcById[LETTER7S_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward7s(k).length, `ごほうび ${k}`);
  }
  assert.ok(C7S_LETTER_REWARDS);
  const hints = subQuestHints();
  for (const q of C7S_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  // サーバー: 2（貝がらの小島の 漁師）
  const { bot, c } = await setup(7611, 'c7_isle');
  const fisher = F.npcById.c7s_fisher;
  await place(bot, C7S_SEA, Math.floor(fisher.x), Math.floor(fisher.y) - 1);
  bot.choice = 0;
  await talk(bot, 'c7s_fisher');
  assert.ok(c.flags[LETTER7S.start(2)]);
  const q1 = subQuests(c).find((q) => q.name === letterName7s(2));
  assert.ok(q1 && q1.find === 'c7s_bury_2' && !q1.ready, 'クエストの 画面: うめる 場所');
  const p = LETTER7S_SPOTS[2];
  await place(bot, PRESENT_SEA, p.x, p.y + 1);
  await talk(bot, 'c7s_dig_2');
  assert.ok(!c.flags[LETTER7S.found(2)], 'うめる 前は 何も ない');
  await place(bot, C7S_SEA, p.x, p.y + 1);
  bot.choice = 0;
  await talk(bot, 'c7s_bury_2');
  assert.ok(c.flags[LETTER7S.bury(2)]);
  const q2 = subQuests(c).find((q) => q.name === letterName7s(2));
  assert.ok(q2 && q2.who === 'c7s_dig_2' && q2.ready, 'クエストの 画面: 今で さがす');
  const [rid, rn] = letterReward7s(2)[0];
  const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
  const before = cnt();
  await place(bot, PRESENT_SEA, p.x, p.y + 1);
  bot.choice = 0;
  await talk(bot, 'c7s_dig_2');
  assert.ok(c.flags[LETTER7S.found(2)] && cnt() === before + rn, 'ごほうび');
  assert.ok(labDoneQuests(c).includes(letterName7s(2)), 'クリアした たのまれごと');
  await talk(bot, 'c7s_dig_2');
  assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
});

// ───────────── 文字・絵 ─────────────
test('文字: 第7章 Step 3・4 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない・カイの ひみつは 書かない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c7s.js', 'public/js/shared/data/sidequests-c7s.js', 'public/js/shared/data/shops-c7s.js', 'public/js/shared/data/c7s-stub.js',
    'public/js/shared/maps/c7s-sea.js', 'public/js/shared/maps/c7s-village-rows.js', 'public/js/shared/maps/c7s-light.js', 'public/js/shared/maps/c7s-light-rows.js', 'public/js/shared/maps/c7s-flags.js',
    'public/js/shared/data/items-c7-key.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c7_lamp'), LF7(5));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c7s_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
  assert.ok(!/ソリトゥス|かけら/.test(all), 'カイの ひみつ（第3幕）は まだ 書かない');
});

test('絵と 音: 灯台の タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・人の え・船長の 大きな すがた・曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 326; id <= 336; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const id of [T.C7S_WAVE, T.C7S_BOARD, T.C7S_LAMP_ON, T.C7S_REEF]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name} が 動く`);
  }
  for (const id of [T.C7S_WAVE, T.C7S_BELL, T.C7S_LAMP, T.C7S_LAMP_ON]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(ch6BlockSpec(T.C7S_KDOOR, 0)?.h > 0.8 && ch6BlockSpec(T.C7S_CABINET, 0)?.h > 0.8);
  assert.ok(CH6_THEMES.c7s_light, 'テーマ');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...C7SL_MAPS, C7S_SEA]) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c7s_captain_npc', 'c7s_ship_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set(['kai', 'c7s_captain', 'c7s_keeper', 'c7s_oldwoman', 'rion', 'minamo', 'karim']);
  for (const id of [C7S_SEA, ...C7SL_MAPS]) for (const n of MAPS[id].npcs) if (/^c7s_/.test(n.id) && !n.big && !/^capsule/.test(n.sprite)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  for (const t of ['c7s_sea', 'c7s_light']) assert.ok(CH6_TRACKS[t]?.ch?.length, `曲 ${t}`);
  for (const id of C7SL_MAPS) assert.ok(['c7s_light', 'sink_ruin', 'boss6'].includes(MAPS[id].bgm), id);
  assert.equal(MAPS[C7S_SEA].bgm, 'c7s_sea');
  void C7SL_ROWS;
});
