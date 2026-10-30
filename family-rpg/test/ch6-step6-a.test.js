// 第2部 第6章「時の砂時計」Step 6（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c6_heart → 5階の おくの とびら → 止まった時計塔の 6〜10階（6階 時の すきまの まわり道・7階 ふりこ × 針の 橋・8階 歯車の 大広間・9階 休み所）
// → 10階 影の時計師ゼンマイ（c6_zenmai。灰色の 森が 動き出す）→ てっぺん（★5の 宝箱・ぜんまい馬）→ 塔の 外で さいごの 場面（c6_clear）
// クリアの あと: 止まった時の間（toki_phantom。1日1回）・泉の里の リオンの 剣の けいこ（3回・1人で）・酒場の ミナモ
// 戦いの しくみ（ゼンマイ・けいこ・時のまぼろし）と 魔物・品・ぜんまい馬は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { CH6C_MAPS, CH6D_MAPS } from '../public/js/shared/maps/ch6.js';
import { PAST_ID, PAST_POS } from '../public/js/shared/maps/past.js';
import { TF, HOUR, BM, UNFREEZE, TK_POS, TK_OUT, CLOCKS, hourOf, tkMapId, frozenAt, MURAL_NEW_AT } from '../public/js/shared/maps/tokei.js';
import {
  C6D, HOLD8, HAVE8, WEIGHT8, LOCK8, ZSEEN, TOP_CHEST, TH_POS, TH_FLOORS, TH_MAPS, TH_LINK, LINK6_TOWER, TOP_ID, STOP9, thArrive,
} from '../public/js/shared/maps/tokei-high.js';
import { TH_ROWS } from '../public/js/shared/maps/tokei-high-rows.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH6_STEPS, OLD_C6_OBJ, CH6_OBJECTIVE_TARGETS, CH6_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch6.js';
import { C6C_OBJ, BOOKMARK } from '../public/js/shared/data/story-ch6c.js';
import { CH6D_STEPS, C6D_OBJ, CH6D_STORY_SCRIPTS, TK6_HINTS, HORSE, MINAMO_SUPPORT, clearWeaponList, tokiDay } from '../public/js/shared/data/story-ch6d.js';
import { RS, SPARS, CH6D_SIDE_QUESTS, sparHintPick, HINT_RATIO } from '../public/js/shared/data/sidequests-ch6d.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
// 6〜10階の 宝箱の 中み・クリアの ★5の 武器（B の data/items-tokei.js。まとめる 時に そちらから）
import { TOKEI_TREASURE_HIGH, C6_CLEAR_WEAPONS } from '../public/js/shared/data/ch6d-stub.js';
import { TIME_GLASS } from '../public/js/shared/world/time-glass.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { DAY_MS, FIRE_HALF } from '../public/js/shared/world/clock.js';
import { gainExp, expForLevel, hiraProgress } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const here = (bot) => [Math.floor(bot.s.x), Math.floor(bot.s.y)];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで。リオンは c6_clock から c6_clear まで ゲスト
async function setup(seed, upto = 'c6_heart', { extra = [], frac = 0.2, job = 'warrior' } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.guests = c.flags.c6_clock && !c.flags.c6_clear ? ['rion'] : [];
  if (c.flags.c6_clock) c.keyItems.push(BOOKMARK);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 67);
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
// fought … 戦った きまった 戦いの id / allies … その 戦いの 味方の 数
async function play(bot, { lose = () => false, fought = null, allies = null, max = 40000, others = [], stopAt = null, from = 0 } = {}) {
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
      if (allies) allies.push(c2.battle.allies.length);
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
  const bot = new Bot(world, old.name);
  await bot.login();
  bot.send({ t: 'play', id: old.char.id });
  await bot.settle();
  bot.s.repelUntil = 1e15;
  return bot;
}
// その 人の いる マップで (tx, ty) まで 歩く（とびら・宝箱・人を さける。ふりこは 時計を すすめて 待つ）
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
// 歯車の ゆかを 流される（client/field.js と おなじ。テストでは 流れの 先へ 1マスずつ 動かす）
async function ride(bot, x, y, opts) {
  const map = MAPS[bot.s.map];
  const r = carry(map, x, y, bot.world.hasFlagFn(bot.s));
  for (const [px, py] of r.path) await stepOn(bot, px, py, opts);
  return r;
}
async function family(seed, upto = 'c6_heart', extraFlags = []) {
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
  Pa.char.keyItems.push(TIME_GLASS, BOOKMARK);
  Pa.char.guests = Pa.char.flags.c6_clear ? [] : ['rion'];
  boost(Pa.char, 67);
  boost(Y.char, 67);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y, clock };
}

// ───────────── 6〜10階の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（6階だけ。'past' … 時計塔 / 'now' … 今の 星の塔 6階）・場所・フラグ・ふりこの 時間（0 … p が ふさぐ / 1 … q が ふさぐ）・
//   止まった 部屋の のこりの 歩数（-1 … 部屋の 外）
// うごき … 歩く（歯車の ゆかは 流される・止まった 部屋は 歩数で 入口へ）・待つ（ふりこ。待てるのは どちらの 時間でも ふさがらない マスだけ）・
//   針の スイッチ・6階の 時の すきま・8階の おもり（拾う・ハンドルに のせる）と 止める レバー
// opts: start … はじめの フラグ / from … はじめの 場所 / shift … 時の 砂時計 / levers … 針の スイッチ / weight … おもりを 使う / hold … 家族が ハンドルに 立つ
//   lock … 8階の 止める レバー / water … 止まった 水を 歩く / goal … ゴール（'up' … 上の 階へ / 'trigger' … 10階の 広間 / 'upper' … 10階の 大時計の 下の とびら / 'down' … 下の 階へ）
function thSolve(n, { start = [], from = null, shift = true, levers = true, weight = true, lock = true, hold = false, water = true, goal = 'up' } = {}) {
  const P = TH_POS[n];
  const past = MAPS[tkMapId(n)], now = n === TH_LINK ? MAPS[LINK6_TOWER] : null;
  const a = thArrive(n);
  const s0 = { era: from?.era || 'past', x: from?.x ?? Math.floor(a.x), y: from?.y ?? Math.floor(a.y), flags: [TF(TH_LINK), ...start, ...(hold ? [HOLD8] : [])], phase: 0, left: -1 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${s.left}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const pend = P.pendA.length + P.pendB.length > 0;
  const room = past.stopRooms?.[0];
  const goalCell = goal === 'up' ? P.up : goal === 'upper' ? P.upper : goal === 'down' ? P.down : null;
  while (q.length) {
    const s = q.shift();
    cells.add(`${s.era}:${s.x},${s.y}`);
    if (goal === 'trigger' && s.y === P.trigger.y && s.x >= P.trigger.x && s.x < P.trigger.x + P.trigger.w) goals.push(s);
    const map = s.era === 'past' ? past : now;
    const has = (f) => (f === '@fireA' ? s.phase === 0 : f === '@fireB' ? s.phase === 1 : s.flags.includes(f));
    const push = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    const npcAt = (x, y) => map.npcs.some((m) => m.solid && condOk(m.show, has) && Math.floor(m.x) === x && Math.floor(m.y) === y);
    for (const [dx, dy] of D4) {
      let nx = s.x + dx, ny = s.y + dy;
      if (isBlocked(map, nx, ny, has) || npcAt(nx, ny) || map.chestAt.has(ny * map.w + nx)) continue;
      const w = map.warpAt.get(ny * map.w + nx);
      if (w) { if (s.era === 'past' && goalCell && nx === goalCell.x && ny === goalCell.y) goals.push(s); continue; }
      if (!water && map === past && TH_ROWS[n][ny]?.[nx] === 'W') continue;
      // 歯車の ゆか（流される）
      const r = carry(map, nx, ny, has);
      if (r.pit) continue;
      [nx, ny] = [r.x, r.y];
      let left = -1, x = nx, y = ny;
      if (map === past && room?.cells.has(ny * map.w + nx)) {
        if (s.left < 0) left = room.steps - 1;
        else if (s.left === 0) { x = Math.floor(room.back.x); y = Math.floor(room.back.y); left = -1; }
        else left = s.left - 1;
      }
      push({ ...s, x, y, left });
    }
    if (pend) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) <= 1;
    if (levers && s.era === 'past' && CLOCKS[n] && P.levers.some(near)) {
      const next = (hourOf(n, has) + 1) % 12;
      push({ ...s, flags: [...s.flags.filter((f) => !f.startsWith(`c6_t${n}_h`)), HOUR(n, next)] });
    }
    if (n === TH_LINK && shift && P.gap.some((g) => g.x === s.x && g.y === s.y)) {
      const other = s.era === 'past' ? now : past;
      if (canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    if (P.band.length) {
      if (weight && near(P.weight) && !has(HAVE8) && !has(WEIGHT8)) push({ ...s, flags: [...s.flags, HAVE8] });
      if (weight && near(P.crank) && has(HAVE8)) push({ ...s, flags: [...s.flags.filter((f) => f !== HAVE8), WEIGHT8] });
      if (lock && near(P.lock) && !has(LOCK8)) push({ ...s, flags: [...s.flags, LOCK8] });
    }
  }
  return { goals, seen, cells };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch6.md の 17）: 物語の すすみ・マップの ID・出現表・きまった 戦い・宝箱・乗り物・タイル・酒場の ミナモ', () => {
  assert.deepEqual(CH6D_STEPS, ['c6_zenmai', 'c6_clear']);
  const hi = CH6_STEPS.indexOf('c6_heart');
  assert.deepEqual(CH6_STEPS.slice(hi + 1), CH6D_STEPS, 'c6_heart の うしろ');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c6_heart') + 1, STORY_STEPS.indexOf('c6_heart') + 3), CH6D_STEPS);
  assert.equal(UNFREEZE, C6D.zenmai, '灰色の 森は c6_zenmai で 動き出す（Step 5 の 約束）');
  const want = ['tokei_6f', 'tokei_7f', 'tokei_8f', 'tokei_9f', 'tokei_10f', 'tokei_top'];
  assert.deepEqual(TH_MAPS, want);
  assert.deepEqual(CH6D_MAPS, want);
  assert.ok(!CH6C_MAPS.includes('tokei_6f'), 'Step 5 の 一らんは そのまま');
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.kind === 'dungeon' && m.past && m.theme === 'tokei' && m.tiles instanceof Uint16Array, id);
    assert.ok(m.tkFloor >= 6, `${id}: 星読みの しおりの 階`);
  }
  assert.deepEqual([MAPS.tokei_6f.w, MAPS.tokei_6f.h], [MAPS[LINK6_TOWER].w, MAPS[LINK6_TOWER].h], '6階は 今の 星の塔 6階と おなじ 大きさ');
  assert.equal(LINK6_TOWER, 'star_tower_6f');
  // 出現表（B）: 6〜10階 t6_tower_high（てっぺんは 出ない）
  for (const n of TH_FLOORS) assert.ok(MAPS[tkMapId(n)].spawnCounts.t6_tower_high > 0, `${n}階 の 出現表`);
  assert.deepEqual(MAPS[TOP_ID].spawnCounts, {});
  assert.ok(ENCOUNTER_TABLES.t6_tower_high?.length);
  // きまった 戦い（B）
  const z = FIXED_ENCOUNTERS.zenmai;
  assert.ok(z && z.boss && !z.canFlee && !z.loseOk && z.bgm === 'boss6', 'zenmai');
  for (const id of SPARS) assert.ok(FIXED_ENCOUNTERS[id]?.loseOk, id);
  assert.deepEqual(SPARS, ['rion_spar1', 'rion_spar2', 'rion_spar3']);
  assert.ok(FIXED_ENCOUNTERS.toki_phantom, 'toki_phantom');
  // 宝箱（B の TOKEI_TREASURE_HIGH を 1階ごとに 2つ。6階の 3つ目は 星のかけら）・てっぺんの 宝箱（C6_CLEAR_WEAPONS）
  for (const n of TH_FLOORS) {
    const list = MAPS[tkMapId(n)].chests.filter((c) => c.id.startsWith(`k6_${n}c`));
    assert.deepEqual(list.slice(0, 2).map((c) => c.item), TOKEI_TREASURE_HIGH[n], `${n}階の 宝箱`);
    assert.ok(list.slice(2).every((c) => c.item === 'star_shard'), `${n}階の 3つ目から`);
  }
  const top = MAPS[TOP_ID].chests;
  assert.ok(top.length === 1 && top[0].id === TOP_CHEST && top[0].script === 'c6_top_chest', 'てっぺんの 宝箱は えらぶ だいほん');
  assert.ok(C6_CLEAR_WEAPONS && (Array.isArray(C6_CLEAR_WEAPONS) ? C6_CLEAR_WEAPONS : Object.values(C6_CLEAR_WEAPONS).flat()).every((id) => ITEMS[id]));
  // 乗り物（B）
  // 乗り物（B の VEHICLES.zenmai_horse。絵が いるので stub では たさない）
  assert.equal(HORSE, 'zenmai_horse');
  if (VEHICLES[HORSE]) assert.ok(VEHICLES[HORSE].name);
  // 酒場の ミナモ（ノクト・サラと おなじ 形）
  const mm = NPC_SUPPORTS.find((s) => s.id === 'npc_minamo');
  assert.ok(mm && mm === MINAMO_SUPPORT && mm.unlock === 'c6_clear' && mm.name === 'ミナモ' && mm.desc);
  // タイル（307 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.PEND_FLOOR, T.PEND_BLADE, T.GEAR_N, T.GEAR_S, T.GEAR_STILL, T.GEAR_CRANK, T.GEAR_CRANK_ON, T.GEAR_WEIGHT, T.TIME_DOOR, T.FACE_STARS];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 307 + i));
  assert.equal(Math.max(...ids), 316);
  assert.deepEqual(TILE_INFO[T.GEAR_N].flow, [0, -1]);
  assert.deepEqual(TILE_INFO[T.GEAR_S].flow, [0, 1]);
  // パーティー全員で 見る だいほん
  for (const id of CH6D_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of ['c6_tf6', 'c6_tf7', 'c6_tf8', 'c6_tf9', 'c6_tf10', 'c6_thand_7', 'c6_t8crank', 'c6_t8weight', 'c6_t8lock', 'c6_thorse', 'c6_top_chest', 'c6_rion_spar']) assert.ok(SCRIPTS[id], id);
  // マップの だいほんが ぜんぶ ある
  for (const id of [...want, PAST_ID]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
});

// ───────────── 目標 ─────────────
test('目標: c6_heart の あとの 目標・フラグごとの 目標・前の 版の「続きはアップデート」は なおる・仲間会話・地図の しるし', () => {
  assert.equal(OLD_C6_OBJ.heart, '第6章の続きはアップデートで！');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C6_OBJ.heart), '今は 知らない 文');
  // 前の 版で c6_heart まで 遊んだ セーブは、5階の とびらへの 目標に なおる
  const old = { flags: flagsOf(...UPTO('c6_heart')), objective: OLD_C6_OBJ.heart };
  assert.ok(repairObjective(old) && old.objective === C6C_OBJ.heart);
  const older = { flags: flagsOf(...UPTO('c6_kanata')), objective: OLD_C6_OBJ.kanata };
  assert.ok(repairObjective(older) && older.objective === C6C_OBJ.kanata);
  const done = { flags: flagsOf(...UPTO('c6_clear')), objective: C6D_OBJ.clear };
  assert.ok(!repairObjective(done), 'c6_clear の あとは そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const table = [
    [['c6_heart'], C6C_OBJ.heart], [['c6_heart', TF(6)], C6D_OBJ.tf6], [['c6_heart', TF(7)], C6D_OBJ.tf7], [['c6_heart', TF(8)], C6D_OBJ.tf8],
    [['c6_heart', TF(8), LOCK8], C6D_OBJ.gear8], [['c6_heart', TF(9)], C6D_OBJ.tf9], [['c6_heart', TF(10)], C6D_OBJ.tf10],
    [['c6_zenmai'], C6D_OBJ.zenmai], [['c6_clear'], C6D_OBJ.clear],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C6D_OBJ), ['heart', C6C_OBJ.heart]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH6_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH6_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  assert.ok(!C6D_OBJ.clear.includes('続きはアップデート') && C6D_OBJ.clear.includes('第7章'));
  // 地図の しるし
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const D = TK_POS[5].upper;
  assert.ok(mark(C6C_OBJ.heart, 'tokei_5f').some((m) => m.x === D.x && m.y === D.y), '5階の とびら');
  const gB = TH_POS[6].gapB[0];
  assert.ok(mark(C6D_OBJ.tf6, LINK6_TOWER).some((m) => m.x === gB.x && m.y === gB.y), '今の 星の塔 6階の 時の すきま');
  const Wt = TH_POS[8].weight;
  assert.ok(mark(C6D_OBJ.tf8, 'tokei_8f').some((m) => m.x === Wt.x && m.y === Wt.y), 'おもり');
  assert.ok(!mark(C6D_OBJ.tf8, 'tokei_8f', [HAVE8]).some((m) => m.x === Wt.x && m.y === Wt.y), '拾ったら 消える');
});

// ───────────── とびら・今の 星の塔 6階 ─────────────
test('とびら: 5階の おく（c6_heart）・10階の 大時計の 下（c6_zenmai）・9階の 止まった時の間（c6_clear）。今の 星の塔 6階の 時の すきま・灰色の 森', () => {
  const D = TK_POS[5].upper;
  const f5 = MAPS.tokei_5f;
  assert.ok(isBlocked(f5, D.x, D.y, (f) => f === 'c6_bell'), '5階: c6_heart の 前は しまっている');
  assert.ok(!isBlocked(f5, D.x, D.y, (f) => f === 'c6_heart'));
  assert.equal(f5.warpAt.get(D.y * f5.w + D.x).to.map, 'tokei_6f');
  const t10 = MAPS.tokei_10f, U = TH_POS[10].upper;
  assert.ok(isBlocked(t10, U.x, U.y, () => false) && !isBlocked(t10, U.x, U.y, (f) => f === C6D.zenmai), '10階: ゼンマイの あと');
  assert.equal(t10.warpAt.get(U.y * t10.w + U.x).to.map, TOP_ID);
  for (const p of TH_POS[10].face) assert.equal(effectiveTile(t10, p.x, p.y, (f) => f === C6D.zenmai), T.FACE_STARS, '大時計は 星の 光に');
  const t9 = MAPS.tokei_9f, Dr = TH_POS[9].door;
  assert.ok(isBlocked(t9, Dr.x, Dr.y, (f) => f === C6D.zenmai), '9階: クリアの 前は 開かない');
  assert.ok(!isBlocked(t9, Dr.x, Dr.y, (f) => f === C6D.clear));
  assert.ok(!condOk(t9.npcById.toki_mirror.show, () => false) && condOk(t9.npcById.toki_mirror.show, (f) => f === C6D.clear));
  // 今の 星の塔 6階: 時計塔の 6階に 来た あと 時の すきまが 光る
  const s6 = MAPS[LINK6_TOWER];
  assert.ok(s6.tiles instanceof Uint8Array, '星の塔の タイルの ならびは かえない（とびらで 見せる）');
  for (const g of TH_POS[6].gap) {
    assert.notEqual(effectiveTile(s6, g.x, g.y, () => false), T.TIME_GAP);
    assert.equal(effectiveTile(s6, g.x, g.y, (fl) => fl === TF(6)), T.TIME_GAP);
    assert.ok(!isBlocked(s6, g.x, g.y, () => false), '今の 星の塔でも 歩ける');
    assert.equal(effectiveTile(MAPS.tokei_6f, g.x, g.y, () => false), T.TIME_GAP);
  }
  assert.equal(s6.timePair, 'tokei_6f');
  assert.equal(MAPS.tokei_6f.timePair, LINK6_TOWER);
  assert.equal(s6.timeSpot(TH_POS[6].gap[0].x, TH_POS[6].gap[0].y, () => false), 'none', '6階に 来る 前は 使えない');
  assert.equal(s6.timeSpot(TH_POS[6].gap[0].x, TH_POS[6].gap[0].y, (f) => f === TF(6)), '');
  for (const id of ['tokei_7f', 'tokei_8f', 'tokei_9f', 'tokei_10f', TOP_ID]) assert.equal(MAPS[id].timeBlock, 'tower');
  // 止まった 歯車の かべ: 千年前は ふさがり、今の 星の塔の おなじ 所は 歩ける
  const Q = TH_POS[6].wall;
  assert.ok(isBlocked(MAPS.tokei_6f, Q.x, Q.y, () => true) && !isBlocked(s6, Q.x, Q.y, () => false));
  // 灰色の 森は c6_zenmai で 元に もどる
  let gray = 0;
  for (const g of MAPS[PAST_ID].gates) {
    if (!g.levels?.some(([fl]) => fl === UNFREEZE)) continue;
    gray++;
    assert.ok(frozenAt(g.x, g.y));
    assert.equal(effectiveTile(MAPS[PAST_ID], g.x, g.y, (fl) => fl === 'c6_kanata' || fl === C6D.zenmai), g.closed);
  }
  assert.ok(gray > 60);
  // 今の 星の塔 1階の かべ画: クリアの あとは はっきり
  const f1 = MAPS.star_tower_1f, M = MURAL_NEW_AT;
  assert.equal(effectiveTile(f1, M.x, M.y, (fl) => fl === 'c6_kanata'), T.MURAL_NEW);
  assert.equal(effectiveTile(f1, M.x, M.y, (fl) => fl === 'c6_kanata' || fl === C6D.clear), T.TOWER_MURAL);
  // 泉の里: リオン（けいこ）は クリアの あと・ミナモは 酒場へ
  const past = MAPS[PAST_ID];
  assert.ok(condOk(past.npcById.rion_spar.show, (fl) => fl === C6D.clear) && !condOk(past.npcById.rion_spar.show, (fl) => fl === C6D.zenmai));
  assert.equal(Math.floor(past.npcById.rion_spar.x), Math.floor(PAST_POS.rion.x));
  assert.ok(!condOk(past.npcById.minamo_back.show, (fl) => fl === 'c6_kanata' || fl === C6D.clear), 'ミナモは 酒場');
  // みちびきの糸は 千年前の ふもとへ
  for (const id of TH_MAPS) {
    const ex = dungeonExit(null, { map: id, char: {} });
    assert.ok(ex && ex.map === PAST_ID && Math.abs(ex.x - TK_OUT.arrive.x) < 1, `${id}: 糸で ふもとへ`);
  }
});

// ───────────── とき方（ひとりで）─────────────
test('時計塔 6〜10階: どの 階も ひとりで とける。しかけを 使わないと 行けない（時の すきま・針・ふりこ・歯車の おもり）', () => {
  for (const n of [6, 7, 8, 9]) assert.ok(thSolve(n).goals.length, `${n}階: ひとりで 上へ`);
  assert.ok(thSolve(10, { goal: 'trigger' }).goals.length, '10階: ゼンマイの 広間へ');
  assert.ok(thSolve(10, { goal: 'upper', start: [C6D.zenmai] }).goals.length, '10階: ゼンマイの あと てっぺんへ');
  assert.equal(thSolve(10, { goal: 'upper' }).goals.length, 0, '10階: ゼンマイの 前は てっぺんへ 行けない');
  // 6階: 時の すきまを 使わないと 行けない（今の 星の塔を 通る まわり道）。今の 星の塔 6階の すきまから 来ても 行ける
  assert.equal(thSolve(6, { shift: false }).goals.length, 0, '6階: 時の すきま');
  assert.ok(thSolve(6).goals.some((s) => s.era === 'past'));
  const gB = TH_POS[6].gapB[0];
  assert.ok(thSolve(6, { from: { era: 'now', x: gB.x, y: gB.y } }).goals.length, '今の 星の塔 6階の はなれから');
  // 6階: はなれ → 休み所に もどれる（下の 階へ）
  const up = TH_POS[6].up;
  assert.ok(thSolve(6, { from: { era: 'past', x: up.x, y: up.y + 1 }, goal: 'down' }).goals.length, '6階: 上から 来ても 下へ もどれる');
  // 7階: 針を 回さないと 行けない・止めた 時間では ふりこを ぬけられない
  assert.equal(thSolve(7, { levers: false }).goals.length, 0, '7階: 針');
  const C = CLOCKS[7];
  for (let h = 0; h < 12; h++) {
    const st = [HOUR(7, h)];
    assert.equal(thSolve(7, { levers: false, start: st, from: { era: 'past', x: C.cx, y: C.cy + 1 } }).goals.length > 0, h === C.goal, `7階 ${h}時: まん中の 台から 先へ`);
  }
  // 8階: ひとりで おもりを 使わないと わたれない・家族が ハンドルに 立てば わたれる・止めれば 行き来できる
  assert.equal(thSolve(8, { weight: false }).goals.length, 0, '8階: ひとりで おもり なし');
  const solo = thSolve(8);
  assert.ok(solo.goals.length && solo.goals.every((s) => s.flags.includes(WEIGHT8)), '8階: ひとりは おもりで');
  assert.ok(thSolve(8, { weight: false, hold: true }).goals.length, '8階: 家族が ハンドルに 立つ');
  const north = { era: 'past', x: TH_POS[8].up.x, y: TH_POS[8].up.y + 1 };
  assert.equal(thSolve(8, { from: north, goal: 'down', start: [WEIGHT8], weight: false, lock: false }).goals.length, 0, 'おもりで 北へ 流れる 間は 南へ もどれない');
  assert.ok(thSolve(8, { from: north, goal: 'down', start: [WEIGHT8] }).goals.length, '北の レバーで 止めれば もどれる');
  assert.ok(thSolve(8, { from: north, goal: 'down', weight: false }).goals.length, 'ふだんは 南へ 流れて もどれる');
  // 9階: 止まった 部屋の おくの 宝は 止まった 水の 上を 通れば 間に 合う
  const map9 = MAPS.tokei_9f;
  assert.equal(map9.stopRooms[0].steps, STOP9);
  const chest9 = map9.chests.find((c) => TH_ROWS[9][c.y][c.x] === '$' && map9.stopRooms[0].cells.has((c.y) * map9.w + c.x + 1));
  assert.ok(chest9, '9階: 止まった 部屋の 中の 宝箱');
  const besideChest = (r) => [...r.cells].some((k) => D4.some(([dx, dy]) => k === `past:${chest9.x + dx},${chest9.y + dy}`));
  assert.ok(besideChest(thSolve(9)), '止まった 水の 上なら とどく');
  assert.ok(!besideChest(thSolve(9, { water: false })), 'まわり道では 止まりが 切れる');
  // 宝箱は どこかから 行ける（しかけを ぜんぶ 使って）
  for (const n of TH_FLOORS) {
    const cells = new Set([...thSolve(n, n === 10 ? { start: [C6D.zenmai], goal: 'upper' } : {}).cells, ...thSolve(n, { start: [LOCK8, C6D.zenmai] }).cells]);
    for (const c of MAPS[tkMapId(n)].chests) assert.ok(D4.some(([dx, dy]) => cells.has(`past:${c.x + dx},${c.y + dy}`)), `${n}階 宝箱 ${c.id}`);
  }
  // 上の 階 → 下の 階（もどれる）
  for (const n of TH_FLOORS) {
    const P = TH_POS[n];
    const w = MAPS[tkMapId(n)].warps.find((q) => q.x === P.down.x && q.y === P.down.y);
    assert.equal(w.to.map, n === 6 ? 'tokei_5f' : tkMapId(n - 1));
  }
  // 休み所（6階・9階）
  for (const n of [6, 9]) {
    const F = TH_POS[n].font, m = MAPS[tkMapId(n)];
    assert.equal(m.actionAt.get(F.y * m.w + F.x)?.script, 'c6_tfont');
    assert.equal(m.zoneAt(F.x, F.y + 1), 'safe:rest');
  }
  assert.ok(MAPS.tokei_10f.zoneAt(20, 6).startsWith('safe'), 'ボスの 広間は 魔物が 出ない');
});

test('ふりこの やいば（7階）: p と q は となりあわない・待てる ゆかが ある・時間を 止めると ぬけられない（第42回の 炎の 柱の 直し と おなじ きまり）', () => {
  const rows = TH_ROWS[7];
  const map = MAPS.tokei_7f;
  let any = 0;
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== 'p' && ch !== 'q') return;
    any++;
    for (const [dx, dy] of D4) assert.notEqual(rows[y + dy]?.[x + dx], ch === 'p' ? 'q' : 'p', `(${x},${y})`);
    const both = (xx, yy) => !isBlocked(map, xx, yy, (f) => f === '@fireA') && !isBlocked(map, xx, yy, (f) => f === '@fireB');
    assert.ok(D4.some(([dx, dy]) => both(x + dx, y + dy)), `(${x},${y}): となりに 待てる ゆか`);
  }));
  assert.ok(any >= 20);
  // ほかの 階には ない
  for (const n of [6, 8, 9, 10]) assert.ok(!TH_ROWS[n].some((r) => /[pq]/.test(r)), `${n}階`);
  const a = TH_POS[7].pendA[0], b = TH_POS[7].pendB[0];
  assert.equal(effectiveTile(map, a.x, a.y, (f) => f === '@fireA'), T.PEND_BLADE);
  assert.equal(effectiveTile(map, a.x, a.y, (f) => f === '@fireB'), T.PEND_FLOOR);
  assert.equal(effectiveTile(map, b.x, b.y, (f) => f === '@fireB'), T.PEND_BLADE);
  // 1つの 時間だけでは（待たないと）通路の 先へ 行けない
  //   南の 通路（入口 → 6時の ふち）・西の 通路（9時の ふち → 北西の へやの かいだんの 前）
  const C = CLOCKS[7], up = TH_POS[7].up;
  const reach = (from, ph) => {
    const has = (f) => f === ph;
    const seen = new Set([`${from[0]},${from[1]}`]);
    const q = [from];
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy] of D4) {
        const nx = x + dx, ny = y + dy;
        if (seen.has(`${nx},${ny}`) || isBlocked(map, nx, ny, has) || map.warpAt.has(ny * map.w + nx)) continue;
        seen.add(`${nx},${ny}`);
        q.push([nx, ny]);
      }
    }
    return (x, y) => seen.has(`${x},${y}`);
  };
  const a7 = thArrive(7);
  for (const ph of ['@fireA', '@fireB']) {
    assert.ok(!reach([Math.floor(a7.x), Math.floor(a7.y)], ph)(C.cx, C.cy + C.R + 1), `${ph}: 南の 通路は 待たずには 通れない`);
    assert.ok(!reach([C.cx - C.R - 2, C.cy], ph)(up.x, up.y + 1), `${ph}: 西の 通路は 待たずには 通れない`);
  }
});

// ───────────── サーバー: 6階 時の すきまの まわり道 ─────────────
test('6階（ひとりで）: 島の 時の すきま → 今の 星の塔 6階 → はなれの 時の すきま → 千年前の はなれ → 上へ', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(8601, 'c6_heart');
  const D = TK_POS[5].upper;
  await place(bot, 'tokei_5f', D.x, D.y + 1);
  await stepOn(bot, D.x, D.y);
  assert.equal(bot.s.map, 'tokei_6f', '5階の おくの とびらから 6階へ');
  const a = thArrive(6);
  await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1);
  assert.ok(c.flags[TF(6)] && c.objective === C6D_OBJ.tf6, '6階に 来た');
  // 休み所の いずみ
  const F = TH_POS[6].font;
  await walkTo(bot, F.x, F.y + 1);
  bot.choice = 0;
  await examine(bot, F.x, F.y);
  assert.ok(said(bot, 'すっかり回復した'), 'いずみ');
  // 島の 時の すきま → 今の 星の塔 6階
  const gA = TH_POS[6].gapA[0], gB = TH_POS[6].gapB[0];
  await walkTo(bot, gA.x, gA.y);
  await useGlass(bot);
  assert.equal(bot.s.map, LINK6_TOWER, '今の 星の塔 6階');
  await walkTo(bot, gB.x, gB.y);
  await useGlass(bot);
  assert.equal(bot.s.map, 'tokei_6f', '千年前の はなれ');
  const up = TH_POS[6].up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_7f', '7階へ');
});

// ───────────── サーバー: 7階 ─────────────
test('7階（ひとりで）: ふりこを 待って 通る → 針を 6時 → まん中の 台で 9時 → 西の ふりこ → 上へ', { timeout: 200000 }, async () => {
  const { bot, c, clock } = await setup(8701, 'c6_heart', { extra: [TF(6)] });
  const a = thArrive(7);
  await place(bot, 'tokei_7f', Math.floor(a.x), Math.floor(a.y));
  assert.ok(c.flags[TF(7)] || (await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1), c.flags[TF(7)]));
  const C = CLOCKS[7];
  const rim = { x: C.cx, y: C.cy + C.R + 1 };
  await walkTo(bot, rim.x, rim.y, { clock });
  assert.deepEqual(here(bot), [rim.x, rim.y], 'ふりこの 通路を ぬけた');
  const [lx, ly] = C.levers[0];
  bot.choice = 1;
  await examine(bot, lx, ly);
  await examine(bot, lx, ly);
  assert.equal(hourOf(7, (f) => !!c.flags[f]), 6);
  await walkTo(bot, C.cx, C.cy + 1);
  bot.choice = 1;
  await examine(bot, C.cx, C.cy);
  assert.equal(hourOf(7, (f) => !!c.flags[f]), 9, '9時');
  const up = TH_POS[7].up;
  await walkTo(bot, up.x, up.y, { clock });
  assert.equal(bot.s.map, 'tokei_8f', '8階へ');
});

// ───────────── サーバー: 8階 歯車の 大広間 ─────────────
test('8階（ひとりで）: 歯車の ゆかは 南へ もどされる → おもりを 拾って ハンドルに のせる → 北へ わたる → レバーで 止める', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(8801, 'c6_heart', { extra: [TF(6), TF(7)] });
  const P = TH_POS[8];
  const a = thArrive(8);
  await place(bot, 'tokei_8f', Math.floor(a.x), Math.floor(a.y));
  assert.ok(c.flags[TF(8)] || (await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1), c.flags[TF(8)]));
  const bx = 20, south = P.band.reduce((m, p) => Math.max(m, p.y), 0) + 1, northY = P.band.reduce((m, p) => Math.min(m, p.y), 99) - 1;
  await walkTo(bot, bx, south);
  let r = await ride(bot, bx, south - 1);
  assert.equal(r.y, south, 'ふだんは 南へ もどされる');
  // ハンドルの 上に 立っても ひとりでは わたれない（おりると 消える）
  await walkTo(bot, P.crank.x, P.crank.y);
  assert.ok(c.flags[HOLD8], 'ハンドルに 立つと 北へ');
  await stepOn(bot, P.crank.x + 1, P.crank.y);
  assert.ok(!c.flags[HOLD8], 'おりると もとに もどる');
  // おもり
  await walkTo(bot, P.weight.x, P.weight.y + 1);
  bot.choice = 0;
  await examine(bot, P.weight.x, P.weight.y);
  assert.ok(c.flags[HAVE8] && !isBlocked(MAPS.tokei_8f, P.weight.x, P.weight.y, (f) => !!c.flags[f]), 'おもりを 持った');
  await walkTo(bot, P.crank.x + 1, P.crank.y);
  bot.choice = 0;
  await examine(bot, P.crank.x, P.crank.y);
  assert.ok(c.flags[WEIGHT8] && !c.flags[HAVE8], 'ハンドルに のせた');
  assert.equal(effectiveTile(MAPS.tokei_8f, bx, south - 1, (f) => !!c.flags[f]), T.GEAR_N);
  await walkTo(bot, bx, south);
  r = await ride(bot, bx, south - 1);
  assert.equal(r.y, northY, '北の 岸へ 運ばれた');
  assert.deepEqual(here(bot), [bx, northY]);
  // 止める レバー
  await walkTo(bot, P.lock.x, P.lock.y + 1);
  bot.choice = 0;
  await examine(bot, P.lock.x, P.lock.y);
  assert.ok(c.flags[LOCK8] && c.objective === C6D_OBJ.gear8, '止めた');
  assert.equal(effectiveTile(MAPS.tokei_8f, bx, south - 1, (f) => !!c.flags[f]), T.GEAR_STILL);
  await walkTo(bot, bx, south);
  assert.deepEqual(here(bot), [bx, south], '歩いて もどれる');
  const up = P.up;
  await walkTo(bot, up.x, up.y);
  assert.equal(bot.s.map, 'tokei_9f', '9階へ');
});

test('8階（家族で）: ユイが ハンドルに 立つ 間だけ 北へ（リーダーの 世界）→ パパが わたる → ユイが おりると もどる', { timeout: 200000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(8802, 'c6_heart', [TF(6), TF(7), TF(8)]);
  const P = TH_POS[8];
  const south = P.band.reduce((m, p) => Math.max(m, p.y), 0) + 1, northY = P.band.reduce((m, p) => Math.min(m, p.y), 99) - 1;
  world.placeSession(Pa, 'tokei_8f', 20.5, south + 0.5, 'up', true);
  world.placeSession(Y, 'tokei_8f', P.crank.x + 1.5, P.crank.y + 0.5, 'left', true);
  await play(papa, { others: [yui] });
  await stepOn(yui, P.crank.x, P.crank.y, { others: [papa] });
  assert.ok(Pa.char.flags[HOLD8] && !Y.char.flags[HOLD8], 'リーダーの 世界で ハンドルが 回る');
  assert.ok(papa.msgs.some((m) => m.t === 'self' || m.t === 'party'), 'パパにも とどく');
  const r = await ride(papa, 20, south - 1, { others: [yui] });
  assert.equal(r.y, northY, 'パパが わたった');
  await stepOn(yui, P.crank.x + 1, P.crank.y, { others: [papa] });
  assert.ok(!Pa.char.flags[HOLD8], 'ユイが おりると もどる');
  // ユイが ほかの 階へ 行っても 消える（立っていた ままの セーブでも 1歩で なおる）
  Pa.char.flags[HOLD8] = true;
  await stepOn(papa, 21, northY, { others: [yui] });
  assert.ok(!Pa.char.flags[HOLD8], 'だれも 立っていなければ 消える');
});

// ───────────── サーバー: 9階 止まった 部屋 ─────────────
test('9階: 休み所・止まった 部屋の おくの 宝（止まった 水の 上を まっすぐ）・止まった時の間の とびら', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(8901, 'c6_heart', { extra: [TF(6), TF(7), TF(8), LOCK8] });
  const a = thArrive(9);
  await place(bot, 'tokei_9f', Math.floor(a.x), Math.floor(a.y));
  assert.ok(c.flags[TF(9)] || (await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1), c.flags[TF(9)]));
  const E = TH_POS[9].back;
  await walkTo(bot, E.x, E.y);
  // 止まった 水の 上を まっすぐ（入口 → 西 → 北 → 宝箱の となり）
  const route = [[11, 22], [10, 22], [9, 22], [8, 22], [7, 22], [6, 22], [5, 22]];
  for (let y = 21; y >= 4; y--) route.push([5, y]);
  route.push([4, 4]);
  for (const [x, y] of route) await stepOn(bot, x, y);
  assert.deepEqual(here(bot), [4, 4], '宝箱の となりまで 間に 合った');
  const ch = MAPS.tokei_9f.chests.find((q) => q.x === 3 && q.y === 4);
  await examine(bot, ch.x, ch.y);
  assert.ok(c.chests[ch.id], '最後の 宝');
  // 止まった時の間の とびらは クリアの 前は 開かない
  const Dr = TH_POS[9].door;
  await place(bot, 'tokei_9f', Dr.x - 1, Dr.y);
  const f0 = bot.msgs.length;
  await examine(bot, Dr.x, Dr.y);
  assert.ok(said(bot, '今は、開かない', f0));
});

// ───────────── 通しで ─────────────
async function bossRun(bot, c, fought) {
  const opts = { fought };
  const T10 = TH_POS[10].trigger;
  await place(bot, 'tokei_10f', 20, T10.y + 2);
  await stepOn(bot, 20, T10.y + 1, opts);
  await stepOn(bot, 20, T10.y, opts);
  void c;
}
test('通しで: 10階 ゼンマイ（c6_zenmai）→ 大時計が 星の 光に → てっぺん（宝箱・ぜんまい馬）→ 塔の 外で さいごの 場面（c6_clear）', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(9001, 'c6_heart', { extra: [TF(6), TF(7), TF(8), LOCK8, TF(9)] });
  const from = bot.msgs.length;
  const fought = [];
  // 10階に 来た
  const a = thArrive(10);
  await place(bot, 'tokei_10f', Math.floor(a.x), Math.floor(a.y));
  await stepOn(bot, Math.floor(a.x), Math.floor(a.y) - 1);
  assert.ok(c.flags[TF(10)] && c.objective === C6D_OBJ.tf10);
  await bossRun(bot, c, fought);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['zenmai'], 'ゼンマイと 戦った');
  assert.ok(c.flags[C6D.zenmai] && c.flags[ZSEEN] && c.objective === C6D_OBJ.zenmai);
  assert.ok(said(bot, '"showMon","zenmai"', from) && said(bot, 'ある者の心の中に', from) && said(bot, '星の光になって', from));
  assert.ok(!condOk(MAPS.tokei_10f.npcById.zenmai_npc.show, (f) => !!c.flags[f]), 'ゼンマイは いない');
  assert.ok(c.guests.includes('rion'), 'リオンは まだ いっしょ');
  // 大時計の 下の とびら → てっぺん
  const U = TH_POS[10].upper;
  await walkTo(bot, U.x, U.y);
  assert.equal(bot.s.map, TOP_ID, 'てっぺんへ');
  const at0 = thArrive('top');
  await stepOn(bot, Math.floor(at0.x), Math.floor(at0.y) - 1);
  assert.ok(said(bot, '1人1つずつ'), 'てっぺんに 来た');
  // 宝箱を 開ける 前に 馬を しらべると、宝箱を すすめられる
  const H = TH_POS.top.horse;
  await walkTo(bot, H.x + 1, H.y + 1);
  const f1 = bot.msgs.length;
  await talk(bot, 'zenmai_horse_npc');
  assert.ok(said(bot, 'まん中の宝箱を開けてみて', f1) && !c.flags[C6D.clear], '宝箱が 先');
  // 宝箱（職業で 使える ★5 から 1つ）
  const list = clearWeaponList(c);
  assert.ok(list.length >= 1 && list.length <= 6);
  const ch = TH_POS.top.chests[0];
  await walkTo(bot, ch.x, ch.y + 1);
  bot.choice = 0;
  await examine(bot, ch.x, ch.y);
  const has = (id) => (c.items || []).some((i) => i.id === id && i.n > 0) || Object.values(c.equip).includes(id);
  assert.ok(c.chests[TOP_CHEST] && has(list[0]), `★5 の 武器 ${list[0]}`);
  const f2 = bot.msgs.length;
  await examine(bot, ch.x, ch.y);
  assert.ok(said(bot, '空っぽ', f2) && (c.items || []).filter((i) => i.id === list[0]).reduce((s, i) => s + i.n, 0) === 1, '1回だけ');
  // からくりの 馬 → 塔の 外 → さいごの 場面
  await walkTo(bot, H.x + 1, H.y + 1);
  await talk(bot, 'zenmai_horse_npc');
  assert.ok(c.flags[C6D.clear], 'c6_clear');
  assert.ok(c.vehicles.includes(HORSE) && c.vehicles.filter((v) => v === HORSE).length === 1, 'ぜんまい馬');
  assert.ok(!c.guests.includes('rion'), 'リオンは 泉の里へ');
  assert.equal(c.objective, C6D_OBJ.clear);
  assert.equal(bot.s.map, PAST_ID, '塔の 外');
  for (const w of ['ぜんまい馬', 'はじまりの星', 'ひとりじゃない', '未来のルミナの町の酒場で', 'ほかの地方の、千年前にも', '第2部　第7章へ　つづく', 'ミナモが、ルミナの町の酒場の仲間になった']) assert.ok(said(bot, w, from), w);
  // 灰色の 森が 動き出した・ミナモは 酒場で 仲間に できる
  const g = MAPS[PAST_ID].gates.find((q) => q.levels?.some(([fl]) => fl === UNFREEZE));
  assert.equal(effectiveTile(MAPS[PAST_ID], g.x, g.y, (f) => !!c.flags[f]), g.closed);
  const rec = recruitNpc(world, bot.s, 'npc_minamo');
  assert.ok(rec.ok, `ミナモ ${rec.reason || ''}`);
  // もう 馬は いない・もう一度 しらべても 何も おきない
  assert.ok(!condOk(MAPS[TOP_ID].npcById.zenmai_horse_npc.show, (f) => !!c.flags[f]));
  assert.deepEqual(SCRIPTS.c6_thorse(ctx(c.flags)), []);
  // ばあちゃん
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('見たことのない星'));
});

test('ミナモは クリアの 前は 酒場で 仲間に できない', async () => {
  const { world, bot } = await setup(9002, 'c6_zenmai');
  assert.ok(!recruitNpc(world, bot.s, 'npc_minamo').ok);
});

test('負けた とき・とちゅうで 切れた とき: ゼンマイに 負けたら すすまない／ゼンマイの あとの 場面は 広間で 続き', { timeout: 300000 }, async () => {
  {
    const { bot, c } = await setup(9101, 'c6_heart', { extra: [TF(10)] });
    const T10 = TH_POS[10].trigger;
    await place(bot, 'tokei_10f', 20, T10.y + 1);
    const fought = [];
    await stepOn(bot, 20, T10.y, { fought, lose: () => true });
    assert.ok(fought.includes('zenmai') && !c.flags[C6D.zenmai]);
    assert.ok(condOk(MAPS.tokei_10f.npcById.zenmai_npc.show, (f) => !!c.flags[f]), 'ゼンマイは まだ いる');
  }
  {
    const { world, bot } = await setup(9102, 'c6_heart', { extra: [TF(10)] });
    const T10 = TH_POS[10].trigger;
    await place(bot, 'tokei_10f', 20, T10.y + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = 20.5; bot.y = T10.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: 'ある者の心の中に', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags[C6D.zenmai] && !c.flags[ZSEEN] && c.objective === C6D_OBJ.zenmai, '場面の とちゅう');
    const f2 = b2.msgs.length;
    const fought = [];
    await place(b2, 'tokei_10f', 20, 13);
    await stepOn(b2, 20, 12, { fought });
    if (!c.flags[ZSEEN]) await stepOn(b2, 20, 11, { fought });
    assert.equal(fought.length, 0, 'もう 戦わない');
    assert.ok(said(b2, '星の光になって', f2) && c.flags[ZSEEN], '続き');
  }
});

test('家族で: ゼンマイの 戦い・さいごの 場面は いっしょに。ものがたりは リーダーだけ・ぜんまい馬は みんな', { timeout: 300000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(9201, 'c6_heart', [TF(6), TF(7), TF(8), LOCK8, TF(9), TF(10)]);
  const yFlags = JSON.stringify(Y.char.flags);
  const T10 = TH_POS[10].trigger;
  world.placeSession(Pa, 'tokei_10f', 20.5, T10.y + 1.5, 'up', true);
  world.placeSession(Y, 'tokei_10f', 21.5, T10.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fought = [];
  await stepOn(papa, 20, T10.y, { others: [yui], fought });
  assert.ok(fought.includes('zenmai') && yui.battles.length >= 1 && Pa.char.flags[C6D.zenmai], 'いっしょに 戦った');
  // てっぺん: ユイも 自分の 宝箱を 開けられる
  Pa.char.chests[TOP_CHEST] = true;
  const ch = TH_POS.top.chests[0], H = TH_POS.top.horse;
  world.placeSession(Pa, TOP_ID, H.x + 1.5, H.y + 1.5, 'up', true);
  world.placeSession(Y, TOP_ID, ch.x + 0.5, ch.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  yui.choice = 0;
  await examine(yui, ch.x, ch.y, { others: [papa] });
  assert.ok(Y.char.chests[TOP_CHEST], 'ユイも ★5 を えらべる');
  await talk(papa, 'zenmai_horse_npc', { others: [yui] });
  assert.ok(Pa.char.flags[C6D.clear] && !Y.char.flags[C6D.clear], 'リーダーの ものがたり');
  assert.ok(Pa.char.vehicles.includes(HORSE) && Y.char.vehicles?.includes(HORSE), 'ぜんまい馬は みんな');
  assert.ok(yui.msgs.some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('はじまりの星')), 'ユイも 見た');
  const yNow = JSON.parse(JSON.stringify(Y.char.flags));
  assert.deepEqual(Object.keys(yNow).filter((k) => !(k in JSON.parse(yFlags))), [], 'ユイの ものがたりは そのまま');
});

// ───────────── クリアの あと: 止まった時の間 ─────────────
test('止まった時の間（クリアの あと）: 時の かがみで 時のまぼろしと 戦う（勝つと その日は もう 出ない）', { timeout: 200000 }, async () => {
  const { bot, c, clock } = await setup(9301, 'c6_clear');
  const Dr = TH_POS[9].door;
  await place(bot, 'tokei_9f', Dr.x - 1, Dr.y);
  await walkTo(bot, Dr.x + 1, Dr.y);
  assert.ok(said(bot, '止まった時の間'), '入った');
  const R = TH_POS[9].mirror;
  await walkTo(bot, R.x, R.y + 1);
  const fought = [];
  bot.choice = 1;
  await talk(bot, 'toki_mirror', { fought });
  assert.equal(fought.length, 0, 'やめる');
  bot.choice = 0;
  await talk(bot, 'toki_mirror', { fought });
  assert.deepEqual(fought, ['toki_phantom']);
  assert.equal(c.tokiDay, tokiDay(clock.now));
  const f1 = bot.msgs.length;
  await talk(bot, 'toki_mirror', { fought });
  assert.ok(fought.length === 1 && said(bot, '今日は、もう', f1), 'その日は もう 出ない');
  clock.now += 24 * 3600 * 1000; // 日本の 1日（ゲームの 1日 DAY_MS では ない）
  await talk(bot, 'toki_mirror', { fought });
  assert.equal(fought.length, 2, 'つぎの 日は また');
  // 負けた 日は もう一度 できる
  const { bot: b2, c: c2 } = await setup(9302, 'c6_clear');
  await place(b2, 'tokei_9f', R.x, R.y + 1);
  b2.choice = 0;
  const f2 = [];
  await talk(b2, 'toki_mirror', { fought: f2, lose: () => true });
  assert.ok(f2.length === 1 && !c2.tokiDay, '負けたら その日も もう一度');
});

// ───────────── より道: リオンの剣のけいこ ─────────────
test('より道「リオンの剣のけいこ」: クリアの あと 泉の里で。1人で 3回・勝つと ひらめき技の ヒント（けいじ板）・負けても よい', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(9401, 'c6_clear');
  const R = MAPS[PAST_ID].npcById.rion_spar;
  // 仲間を 1人 つれていても、けいこは 1人
  recruitNpc(world, bot.s, 'npc_minamo');
  await place(bot, PAST_ID, Math.floor(R.x), Math.floor(R.y) + 1);
  const fought = [], allies = [];
  bot.choice = 1;
  await talk(bot, 'rion_spar', { fought, allies });
  assert.ok(c.flags[RS.start] && fought.length === 0, 'たのまれた（またこんど）');
  assert.ok(subQuests(c).some((q) => q.name === 'リオンの剣のけいこ' && q.who === 'rion_spar'), 'クエストの 画面');
  // 負け
  bot.choice = 0;
  await talk(bot, 'rion_spar', { fought, allies, lose: () => true });
  assert.ok(fought[0] === 'rion_spar1' && !c.flags[RS.win(1)], '負けても すすまない');
  assert.ok(c.hp > 0, 'HPは もどる');
  // 3回 勝つ
  const before = world.data.familyBoard?.length || 0;
  for (let k = 1; k <= 3; k++) {
    const id = sparHintPick(c);
    await talk(bot, 'rion_spar', { fought, allies });
    assert.ok(c.flags[RS.win(k)], `${k}回目 勝った`);
    assert.equal(fought.at(-1), `rion_spar${k}`);
    if (id) assert.ok(hiraProgress(c, id) >= 1, `ひらめきの ヒント ${id}`);
  }
  assert.ok(allies.every((n) => n === 1), `1人で 戦う ${allies}`);
  assert.ok(c.flags[RS.done] && labDoneQuests(c).includes('リオンの剣のけいこ'));
  assert.ok(!subQuests(c).some((q) => q.name === 'リオンの剣のけいこ'), 'クエストの 画面から 消える');
  const posts = (world.data.familyBoard || []).slice(before);
  assert.ok(posts.length >= 1 && posts.every((e) => e.kind === 'hirameki' && e.charId === c.id && e.title.includes('リオン')), 'けいじ板');
  const f0 = bot.msgs.length;
  await talk(bot, 'rion_spar', { fought });
  assert.ok(fought.length === 4 && said(bot, '毎日、剣のけいこ', f0), '3回の あとは 話だけ');
  // ヒントの えらびかた: まだ 覚えていない その 職業の ひらめき技・使った 回数を ふやす
  const ch = { job: 'warrior', jobs: { warrior: { lv: 10 } }, skillUse: {}, hirameki: [], flags: {} };
  const pick = sparHintPick(ch);
  assert.ok(pick && HIRAMEKI[pick]);
  ch.hirameki = Object.keys(HIRAMEKI);
  assert.equal(sparHintPick(ch), null, 'ぜんぶ 覚えて いれば なし');
  assert.ok(HINT_RATIO > 1);
  // 一らん（困っている人）
  const h = subQuestHints().find((q) => q.id === 'rion_spar');
  assert.ok(h && h.npc === 'rion_spar' && h.open.includes('c6_clear') && h.start === RS.start && h.done === RS.done);
  for (const q of CH6D_SIDE_QUESTS) assert.ok(subQuestHints().some((x) => x.name === q.name), q.name);
});

// ───────────── 星読みの しおり ─────────────
test('星読みの しおり: 6〜10階と てっぺんで その 階の ヒント（1回ずつ。2回目は 短い ことば）', { timeout: 120000 }, async () => {
  const { bot, c } = await setup(9501, 'c6_heart');
  for (const n of TH_FLOORS) {
    const a = thArrive(n);
    await place(bot, tkMapId(n), Math.floor(a.x), Math.floor(a.y));
    const f1 = bot.msgs.length;
    await useBook(bot);
    assert.ok(c.flags[BM(n)] && said(bot, TK6_HINTS[n].full[0].slice(0, 8), f1), `${n}階: はじめて`);
    const f2 = bot.msgs.length;
    await useBook(bot);
    assert.ok(said(bot, TK6_HINTS[n].short, f2), `${n}階: 2回目`);
  }
  const at0 = thArrive('top');
  await place(bot, TOP_ID, Math.floor(at0.x), Math.floor(at0.y));
  const f3 = bot.msgs.length;
  await useBook(bot);
  assert.ok(said(bot, TK6_HINTS[10].short, f3), 'てっぺんは 10階の ページ');
});

// ───────────── 文字・絵 ─────────────
test('文字: 第6章 Step 6 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-ch6d.js', 'public/js/shared/data/sidequests-ch6d.js', 'public/js/shared/data/ch6d-stub.js',
    'public/js/shared/maps/tokei-high.js', 'public/js/shared/maps/tokei-high-rows.js', 'public/js/shared/world/tokei-gear.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
  const flags = flagsOf(...UPTO('c6_zenmai'), TF(6), TF(7), TF(8), TF(9), TF(10));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c6_(t|zenmai|rion_spar|toki)/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  assert.ok(!/[鐘扉押渡祈刃錘]/.test(all), '使えない 漢字');
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
});

test('絵: 6〜10階の タイル（2D は 16×16 を ぬる・歯車の ゆかは 動く・2.5D）・人の え（からくりの 馬・時の かがみ・ゼンマイ）', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 307; id <= 316; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const id of [T.GEAR_N, T.GEAR_S]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), '歯車の ゆかが 動く');
  }
  assert.notEqual(paintTile(T.GEAR_N, 0, 0, 0).px.join(), paintTile(T.GEAR_S, 0, 0, 0).px.join(), '北と 南は ちがう 絵');
  for (const id of [T.PEND_BLADE, T.GEAR_WEIGHT]) assert.ok(CH6_PROPS[id] && PROP_TILES.has(id), `2.5D の ${TILE_INFO[id].name}`);
  for (const id of [T.TIME_DOOR, T.FACE_STARS]) assert.ok(ch6BlockSpec(id, 0)?.h > 0.5, `2.5D の ${TILE_INFO[id].name}`);
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...TH_MAPS, LINK6_TOWER, 'tokei_5f', 'star_tower_1f']) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['zenmai_horse_npc', 'toki_mirror']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set();
  for (const id of [...TH_MAPS, PAST_ID]) for (const n of MAPS[id].npcs) if (/^(tk\d|zenmai|toki_mirror|rion_spar)/.test(n.id)) sprites.add(n.sprite);
  assert.ok(sprites.size >= 5);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
});
