// 第2部 第6章「時の砂時計」Step 1・2（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// 第1部クリア（c5_clear）→ ホシミばあちゃん・6つ目の 星（c6_start）→ 時のほこら（c6_shrine）→ サンドクロック・時の砂時計（c6_glass）
// → はじめて 千年前へ（c6_past）→ ホシヨ・星のしずく・星の木（c6_tree）→ 泉の里・リオン（c6_rion）→ 時のいせき 7階（c6_ruin）
// → ギアドン（c6_gear）→ 泉の里の 時が 動き出す（c6_flow。「第6章の続きはアップデートで！」）
// 戦いの しくみ（サンドクロック・ギアドン）と 魔物・品は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { PLACES, BRIDGE_Y, CAVE_ENTRANCE, riverXAt } from '../public/js/shared/maps/overworld.js';
import { CH6_MAPS } from '../public/js/shared/maps/ch6.js';
import {
  C6, PAST_ID, PAST_POS, HAMLET, SPRING, HOSHIYO_FLAG, DEW_FLAG, PLANT_FLAG, END_A6, CHIEF_FLAG, HAMLET_ROWS,
} from '../public/js/shared/maps/past.js';
import { SHRINE_POS, SHRINE_MAPS, SF, SAND_FLAG, shrineMapId, shrineArrive } from '../public/js/shared/maps/toki-shrine.js';
import {
  RUIN_POS, RUIN_OBJS, RUIN_MAPS, RF, LEVER_FLAG, OPEN7, objIndex, objOn, ruinMapId, RUIN_BOSS_ID, RUIN_FLOORS, RUIN_REST, ruinArrive,
} from '../public/js/shared/maps/toki-ruin.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import {
  CH6_STEPS, C6_OBJ, OLD_C6_OBJ, CH6_OBJECTIVE_TARGETS, CH6_OBJECTIVE_TALK, CH6_STORY_SCRIPTS, CH6_TOWN_LINES, endingFrom6,
} from '../public/js/shared/data/story-ch6.js';
import { TOP_OBJ } from '../public/js/shared/data/story-castle-top.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS, GUESTS } from '../public/js/shared/data/shops.js';
// 作業中の 仮の データ（B の PAST_TREASURE。まとめる 時に '../public/js/shared/data/items-past.js' に かえる）
import { PAST_TREASURE } from '../public/js/shared/data/ch6-stub.js';
import { glassCheck, timeArea, GLASS_TEXT, TIME_GLASS } from '../public/js/shared/world/time-glass.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { canCall } from '../public/js/shared/world/travel.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
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

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto = 'c5_clear', { extra = [], glass = upto !== 'c5_clear' && STORY_STEPS.indexOf(upto) >= STORY_STEPS.indexOf('c6_glass') } = {}) {
  const clock = { now: at(0.2) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  if (glass && !c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 58);
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
// stopAt … その 文が とどいたら、へんじ（ack）を しないで 通信を 切る（とちゅうで 切れた ときの ため）
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
// その マップで 歩いて 行ける マス（has … フラグ）
function reach(id, start, has = () => false) {
  const m = MAPS[id];
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k)) continue;
      if (isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => r(p.x, p.y) || D4.some(([dx, dy]) => r(p.x + dx, p.y + dy));
// ふたりで あそぶ（さそう・うける）
async function family(seed, upto = 'c5_clear', extraFlags = []) {
  const world = new GameWorld({ offline: false, rng: makeRng(seed), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO(upto), ...extraFlags]) Pa.char.flags[f] = true;
  if (STORY_STEPS.indexOf(upto) >= STORY_STEPS.indexOf('c6_glass')) Pa.char.keyItems.push(TIME_GLASS);
  boost(Pa.char, 58);
  boost(Y.char, 58);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束: 物語の すすみ・マップの ID・出現表・きまった 戦い・背景・曲・店・宝箱・ゲスト・大事な物（plan-ch6.md の 9）', async () => {
  assert.deepEqual(CH6_STEPS, ['c6_start', 'c6_shrine', 'c6_glass', 'c6_past', 'c6_tree', 'c6_rion', 'c6_ruin', 'c6_gear', 'c6_flow']);
  const ci = STORY_STEPS.indexOf('c5_clear');
  assert.deepEqual(STORY_STEPS.slice(ci + 1, ci + 1 + CH6_STEPS.length), CH6_STEPS, '第5章の うしろに つづく');
  const want = ['overworld_past', 'toki_shrine_1f', 'toki_shrine_2f', 'toki_shrine_3f',
    ...[1, 2, 3, 4, 5, 6, 7].map((n) => `toki_ruin_${n}f`), ...[1, 2, 3, 4, 5, 6, 7].map((n) => `toki_ruin_${n}f_past`), 'toki_ruin_boss'];
  assert.deepEqual([...CH6_MAPS].sort(), want.sort(), 'マップの ID');
  for (const id of want) assert.ok(MAPS[id], id);
  assert.deepEqual(SHRINE_MAPS, ['toki_shrine_1f', 'toki_shrine_2f', 'toki_shrine_3f']);
  assert.equal(RUIN_MAPS.length, 15);
  // 出現表（B）を マップで 使う
  const zones = new Set();
  for (const id of want) {
    const m = MAPS[id];
    for (const z of Object.keys(m.spawnCounts || {})) zones.add(z);
  }
  for (const z of ['t6_past_field', 't6_shrine', 't6_ruin_up', 't6_ruin_low']) {
    assert.ok(zones.has(z), `出現表 ${z}`);
    assert.ok(ENCOUNTER_TABLES[z]?.length, `出現表 ${z}（B。まだ ない 時は 仮）`);
  }
  for (let n = 1; n <= RUIN_FLOORS; n++) for (const past of [false, true]) {
    const m = MAPS[ruinMapId(n, past)];
    const table = n <= 4 ? 't6_ruin_up' : 't6_ruin_low';
    if (n !== RUIN_REST) assert.ok(m.spawnCounts[table] > 0, `${m.id} の 出現表`);
    else assert.deepEqual(m.spawnCounts, {}, '4階は 休み所');
  }
  // きまった 戦い（B）・曲（A）
  for (const id of ['sand_clock', 'geardon']) {
    const fx = FIXED_ENCOUNTERS[id];
    assert.ok(fx && fx.boss && !fx.canFlee && !fx.loseOk, id);
  }
  const { _TRACKS } = await import('../public/js/client/audio.js');
  for (const id of ['past_field', 'past_village', 'toki_shrine', 'toki_ruin', 'boss6', 'zenmai']) assert.ok(_TRACKS[id], `曲 ${id}`);
  assert.equal(MAPS.overworld_past.bgm, 'past_field');
  assert.equal(MAPS.toki_shrine_1f.bgm, 'toki_shrine');
  assert.equal(MAPS.toki_ruin_3f.bgm, 'toki_ruin');
  // 店（B の SHOPS_PAST。今は 仮）・店の 人
  for (const id of ['past_weapon', 'past_armor', 'past_item']) assert.ok(SHOPS[id]?.items?.length, `店 ${id}`);
  for (const [npcId, shop] of [['p_weapon', 'past_weapon'], ['p_armor', 'past_armor'], ['p_item', 'past_item']]) {
    const n = MAPS.overworld_past.npcById[npcId];
    assert.ok(n, npcId);
    assert.deepEqual(SCRIPTS[n.script](ctx({})), [['shop', shop]]);
  }
  // 宝箱（B の PAST_TREASURE。B と おなじ 数。時のほこら 6・時のいせき 14・千年前の フィールド 6）
  const starChests = (pre) => Object.values(MAPS).flatMap((m) => m.chests || []).filter((c) => c.id.startsWith(pre) && PAST_TREASURE[{ s6_: 'toki_shrine', r6_: 'toki_ruin', p6_: 'overworld_past' }[pre]].includes(c.item));
  assert.equal(starChests('s6_').length, PAST_TREASURE.toki_shrine.length, '時のほこらの ★');
  assert.equal(starChests('r6_').length, PAST_TREASURE.toki_ruin.length, '時のいせきの ★');
  assert.equal(starChests('p6_').length, PAST_TREASURE.overworld_past.length, '千年前の フィールドの ★');
  assert.deepEqual([PAST_TREASURE.toki_shrine.length, PAST_TREASURE.toki_ruin.length, PAST_TREASURE.overworld_past.length], [6, 14, 6]);
  // ゲスト・大事な物
  assert.ok(GUESTS.minamo && GUESTS.minamo.name === 'ミナモ', 'ゲスト minamo');
  for (const id of ['toki_glass', 'star_seedling', 'star_dew']) assert.equal(ITEMS[id]?.type, 'key', id);
  assert.ok(ITEMS.toki_glass.hourglass, 'メニューの 道具から 使う');
  // タイル（256〜265）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  assert.deepEqual([T.SAND_DOOR, T.SAND_DOOR_OPEN, T.SAND_DIAL, T.SAND_DIAL_ON, T.TIME_ALTAR, T.TIME_ALTAR_EMPTY, T.FROZEN_WATER, T.STRAW_WALL, T.TIME_PLATE, T.TIME_PLATE_ON], [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]);
  for (const id of CH6_MAPS) assert.ok(MAPS[id].tiles instanceof Uint16Array, `${id}: 256 いじょうの タイルが 入る ならび`);
  assert.ok(MAPS.overworld.tiles instanceof Uint8Array, '今の フィールドは そのまま');
  // パーティー全員で 見る だいほん
  for (const id of CH6_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  assert.ok(STORY_SCRIPTS.has('elder'));
});

// ───────────── 目標 ─────────────
test('目標: 第1部クリアの 文は ばあちゃんへ（前の 文は なおる）・フラグごとの 目標・仲間会話・地図の しるし', () => {
  assert.equal(TOP_OBJ.clear, C6_OBJ.lead);
  assert.ok(TOP_OBJ.clear.includes('ホシミばあちゃん') && !TOP_OBJ.clear.includes('アップデート'));
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C6_OBJ.clear5), '前の 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c5_clear')), objective: OLD_C6_OBJ.clear5 };
  assert.ok(repairObjective(old));
  assert.equal(old.objective, TOP_OBJ.clear, '前の 版の セーブは ばあちゃんへの 文に なおる');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const table = [
    [['c5_clear'], C6_OBJ.lead], [['c6_start'], C6_OBJ.start], [['c6_shrine'], C6_OBJ.shrine], [['c6_shrine', SF(2)], C6_OBJ.sf2], [['c6_shrine', SF(2), SF(3)], C6_OBJ.sf3],
    [['c6_glass'], C6_OBJ.glass], [['c6_past'], C6_OBJ.past], [['c6_past', CHIEF_FLAG], C6_OBJ.chief], [['c6_past', CHIEF_FLAG, HOSHIYO_FLAG], C6_OBJ.hoshiyo],
    [['c6_past', HOSHIYO_FLAG, DEW_FLAG], C6_OBJ.dew], [['c6_past', HOSHIYO_FLAG, DEW_FLAG, PLANT_FLAG], C6_OBJ.planted], [['c6_tree'], C6_OBJ.tree],
    [['c6_rion'], C6_OBJ.rion], [['c6_ruin'], C6_OBJ.ruin], [['c6_ruin', RF(2)], C6_OBJ.rf2], [['c6_ruin', RF(7)], C6_OBJ.rf7], [['c6_ruin', RF(7), 'c6_rboss'], C6_OBJ.boss],
    [['c6_gear'], C6_OBJ.gear], [['c6_gear', END_A6], C6_OBJ.endA], [['c6_flow'], C6_OBJ.flow],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  assert.equal(C6_OBJ.flow, '第6章の続きはアップデートで！');
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries(C6_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH6_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH6_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  // 目標の 文で「千年前で」「今で」を はっきり
  assert.ok(C6_OBJ.hoshiyo.includes('千年前') && C6_OBJ.planted.includes('今に') && C6_OBJ.rf3.includes('千年前') && C6_OBJ.rf7.includes('今'), '時代を はっきり');
  // 地図の しるし（その 時代の マップの しるし だけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const S = PAST_POS.shrineDoor;
  assert.ok(mark(C6_OBJ.start, 'overworld').some((m) => m.x === S.x && m.y === S.y && !m.via), 'ほこらの 入口');
  assert.ok(mark(TOP_OBJ.clear, 'overworld').some((m) => m.x === MAPS.overworld.npcById.elder.x), 'ばあちゃん');
  assert.ok(mark(C6_OBJ.hoshiyo, PAST_ID).some((m) => m.x === PAST_POS.dew.x && m.y === PAST_POS.dew.y), '千年前の 湖の しずく');
  assert.equal(mark(C6_OBJ.hoshiyo, 'overworld').length, 0, '今の 地図には 千年前の しるしは 出ない');
  assert.ok(mark(C6_OBJ.planted, 'overworld').length, '今の 星の木');
  const L = RUIN_POS[5].levers[1];
  assert.ok(mark(C6_OBJ.rf5, ruinMapId(5, true)).some((m) => m.x === L.x && m.y === L.y), 'レバー（千年前）');
  assert.ok(!mark(C6_OBJ.rf5, ruinMapId(5, true), [LEVER_FLAG(5, 1)]).some((m) => m.x === L.x && m.y === L.y), '引いたら 消える');
  assert.ok(!mark(C6_OBJ.rf5, ruinMapId(5, false)).some((m) => m.x === L.x && m.y === L.y), '今の 階には 出ない');
  const B = RUIN_POS[7].b;
  assert.ok(mark(C6_OBJ.rf7, ruinMapId(7, true)).some((m) => m.x === B.x && m.y === B.y) && !mark(C6_OBJ.rf7, ruinMapId(7, true), [OPEN7]).some((m) => m.x === B.x && m.y === B.y), '7階の ふむ石');
});

// ───────────── 千年前の ミドリナ地方 ─────────────
test('千年前の ミドリナ地方: 今と おなじ 大きさ・今の 地図から 作る（道・村と 町・橋・入口）・里・行ける ところ', () => {
  const now = MAPS.overworld, past = MAPS[PAST_ID];
  assert.equal(past.w, now.w); assert.equal(past.h, now.h);
  assert.equal(past.w, 168); assert.equal(past.h, 128);
  assert.equal(past.timePair, 'overworld'); assert.equal(now.timePair, PAST_ID);
  assert.ok(past.past && past.theme === 'past' && past.kind === 'field');
  const inR = (x, y, r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
  let dirtOutside = 0, treesNow = 0, treesPast = 0;
  for (let y = 0; y < past.h; y++) for (let x = 0; x < past.w; x++) {
    const p = past.tiles[y * past.w + x], n = now.tiles[y * now.w + x];
    if (p === T.DIRT && !inR(x, y, HAMLET) && !inR(x, y, SPRING)) dirtOutside++;
    if ([T.TREE, T.PINE].includes(p)) treesPast++;
    if ([T.TREE, T.PINE].includes(n)) treesNow++;
    assert.ok(![T.BRIDGE_H, T.BRIDGE_V, T.BROKEN_BRIDGE, T.PIER, T.CAVE_ENTRANCE, T.TOWER_DOOR, T.TOWER_GATE].includes(p), `${x},${y}: 千年前には ない ${TILE_INFO[p].name}`);
  }
  assert.equal(dirtOutside, 0, '道は 草原');
  assert.ok(treesPast > treesNow * 1.2, `木が 多い（今 ${treesNow} → 千年前 ${treesPast}）`);
  for (const y of [BRIDGE_Y - 1, BRIDGE_Y, BRIDGE_Y + 1]) assert.ok(TILE_INFO[past.tiles[y * past.w + 131]].water || past.tiles[y * past.w + 131] === T.WATER, '橋は ない');
  assert.equal(past.tiles[CAVE_ENTRANCE.y * past.w + CAVE_ENTRANCE.x], T.MOUNTAIN, 'なげきの洞窟の 入口は ない');
  assert.ok(!past.warps.some((w) => w.to.map === 'cave_b1'), '洞窟へ 行けない');
  // 村と 町の 場所: 今の 家や 石だたみは ない（里の 中を のぞく）
  for (const pl of [PLACES.village, PLACES.town]) {
    for (let y = pl.y; y < pl.y + pl.h; y++) for (let x = pl.x; x < pl.x + pl.w; x++) {
      if (inR(x, y, HAMLET) || inR(x, y, SPRING)) continue;
      const p = past.tiles[y * past.w + x];
      assert.ok(![T.WALL_WOOD, T.WALL_STONE, T.PLAZA, T.FOUNTAIN, T.DOOR].includes(p), `${x},${y}: ${TILE_INFO[p].name}`);
    }
  }
  // ホシフルの里（わらの 家・たき火）・泉の里（止まった 泉）
  assert.equal(HAMLET_ROWS.length, HAMLET.h);
  for (const r of HAMLET_ROWS) assert.equal(r.length, HAMLET.w);
  let straw = 0;
  for (let y = HAMLET.y; y < HAMLET.y + HAMLET.h; y++) for (let x = HAMLET.x; x < HAMLET.x + HAMLET.w; x++) if (past.tiles[y * past.w + x] === T.STRAW_WALL) straw++;
  assert.ok(straw > 60, 'わらの 家');
  assert.equal(effectiveTile(past, PAST_POS.fire.x, PAST_POS.fire.y, () => false), T.REST_FIRE, 'たき火');
  assert.equal(effectiveTile(past, PAST_POS.spring.x, PAST_POS.spring.y, () => false), T.FROZEN_WATER, '止まった 泉');
  assert.equal(effectiveTile(past, PAST_POS.spring.x, PAST_POS.spring.y, (f) => f === C6.flow), T.WATER, 'c6_flow で 動き出す');
  // 里から 歩いて 行ける（大事な 場所・宝箱・人）
  const home = [Math.floor(PAST_POS.hamletIn.x), Math.floor(PAST_POS.hamletIn.y)];
  const r = reach(PAST_ID, home, () => true);
  for (const [name, p] of [['丘の ほこら', { x: PLACES.shrine.x + 5, y: PLACES.shrine.y + 4 }], ['しずく', PAST_POS.dew], ['なえ', PAST_POS.seed], ['泉の里', PAST_POS.rion], ['リオンに 会う 所', { x: PAST_POS.rionMeet.x + 3, y: PAST_POS.rionMeet.y }], ['いせきの 入口', { x: PAST_POS.ruin.door.x, y: PAST_POS.ruin.door.y + 1 }]]) {
    assert.ok(near(r, p), name);
  }
  for (const c of past.chests) assert.ok(near(r, c), `宝箱 ${c.id}`);
  for (const n of past.npcs) assert.ok(near(r, { x: Math.floor(n.x), y: Math.floor(n.y) }) || D4.some(([dx, dy]) => r(Math.floor(n.x) + dx * 2, Math.floor(n.y) + dy * 2)), `人 ${n.id}`);
  for (const n of past.npcs) assert.ok(SCRIPTS[n.script], `${n.id} の だいほん ${n.script}`);
  // 里の 中は 魔物が 出ない・川の 東は 行けない（深い 森）
  assert.ok(past.zoneAt(PAST_POS.hamletIn.x | 0, PAST_POS.hamletIn.y | 0).startsWith('safe'));
  assert.ok(past.zoneAt(PAST_POS.spring.x, PAST_POS.spring.y + 6).startsWith('safe'));
  assert.equal(past.zoneAt(80, 100), 't6_past_field');
  assert.ok(!r(150, 60), '川の 東へは 行けない');
  assert.equal(past.bgmAt(PAST_POS.hamletIn.x | 0, PAST_POS.hamletIn.y | 0, false, () => false), 'past_village');
  // 時のいせきの 入口（今も 千年前も おなじ 場所。c6_rion で 開く）
  const D = PAST_POS.ruin.door;
  for (const m of [now, past]) {
    assert.ok(isBlocked(m, D.x, D.y, () => false) && !isBlocked(m, D.x, D.y, (fl) => fl === C6.rion), `${m.id}: いせきの 入口`);
    const w = m.warps.find((q) => q.x === D.x && q.y === D.y);
    assert.equal(w.to.map, m === now ? 'toki_ruin_1f' : 'toki_ruin_1f_past');
  }
  void riverXAt;
});

test('今の ミドリナ地方: 時のほこらの 入口（c6_start）・勇者の像（c6_start 〜 c6_flow は うすい）・星の木（千年前に 植えると 今に）', () => {
  const now = MAPS.overworld;
  const S = PAST_POS.shrineDoor;
  assert.equal(effectiveTile(now, S.x, S.y, () => false), T.SHRINE_FLOOR, 'c6_start の 前は 星の花の あった ゆか');
  assert.equal(effectiveTile(now, S.x, S.y, (f) => f === C6.start), T.CAVE_ENTRANCE, '地面が われる');
  const tr = now.triggers.find((t) => t.script === 'c6_shrine_go');
  assert.ok(tr && tr.x === S.x && tr.y === S.y && tr.show.all.includes(C6.start));
  const has = (fl) => (f) => fl.includes(f);
  const vis = (id, fl) => condOk(now.npcById[id].show, has(fl));
  assert.ok(vis('hero_statue', []) && !vis('hero_statue_faded', []), 'いつも ある 像');
  assert.ok(!vis('hero_statue', ['c6_start']) && vis('hero_statue_faded', ['c6_start']), 'うすく 消えかける');
  assert.ok(vis('hero_statue_back', ['c6_start', 'c6_flow']) && !vis('hero_statue_faded', ['c6_start', 'c6_flow']), 'もどる');
  assert.ok(!vis('star_tree', []) && vis('star_tree', [PLANT_FLAG]), '星の木は 千年前に 植えると 今に');
  assert.ok(now.npcById.star_tree.big);
  // がけの 上は ふつうには 行けない（星の木を のぼる）
  const r = reach('overworld', [PLACES.village.x + 16, PLACES.village.y + 13], () => true);
  assert.ok(!r(Math.floor(PAST_POS.plateauIn.x), Math.floor(PAST_POS.plateauIn.y)), 'がけの 先');
  assert.ok(canStand(now, PAST_POS.plateauIn.x, PAST_POS.plateauIn.y, () => true), 'がけの 先に 立てる');
  // 町の 人の ことば（像が うすい あいだ・もどった あと）
  for (const id of ['t_lady', 't_oldman', 't_kid']) {
    const fading = JSON.stringify(SCRIPTS[id](ctx(flagsOf(...UPTO('c6_start')))));
    const back = JSON.stringify(SCRIPTS[id](ctx(flagsOf(...UPTO('c6_flow')))));
    const before = JSON.stringify(SCRIPTS[id](ctx(flagsOf(...UPTO('c5_clear')))));
    assert.ok(fading !== before && back !== fading && back !== before, id);
  }
  assert.ok(JSON.stringify(SCRIPTS.t_oldman(ctx(flagsOf(...UPTO('c6_start'))))).includes('思い出せん'));
  for (const id of Object.keys(CH6_TOWN_LINES)) assert.ok(SCRIPTS[id], id);
});

// ───────────── 時の砂時計 ─────────────
test('時の砂時計: おなじ 座標で 今 ⇔ 千年前・歩けない 所・町や 家の 中・ほこら・番人の 間・持っていない・空の 上', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(6101, 'c6_past');
  // 丘で: 千年前へ（おなじ 座標）
  const hx = PLACES.shrine.x + 5, hy = PLACES.shrine.y + 7;
  await place(bot, 'overworld', hx, hy);
  const from = bot.msgs.length;
  await useGlass(bot);
  assert.equal(bot.s.map, PAST_ID, '千年前へ');
  assert.deepEqual([bot.s.x, bot.s.y], [hx + 0.5, hy + 0.5], 'おなじ 座標');
  assert.ok(bot.msgs.slice(from).some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'timeShift' && s[1] === 'in')), '砂の うず');
  assert.equal(bot.map, PAST_ID, 'クライアントにも 知らせる');
  await useGlass(bot);
  assert.equal(bot.s.map, 'overworld', '今へ もどる');
  // 向こうの 時代では 木の 中（今の 東の 平原 → 千年前の 深い 森）
  const ex = [];
  for (let y = 40; y < 90 && !ex.length; y++) for (let x = 140; x < 158; x++) {
    if (canStand(MAPS.overworld, x + 0.5, y + 0.5, () => true) && isBlocked(MAPS[PAST_ID], x, y, () => true)) { ex.push([x, y]); break; }
  }
  assert.ok(ex.length, '例の 場所');
  await place(bot, 'overworld', ...ex[0]);
  const f2 = bot.msgs.length;
  await useGlass(bot);
  assert.equal(bot.s.map, 'overworld', '使えない');
  assert.ok(toasted(bot, '向こうの時代では、かべの中', f2), 'かべの 中の ことば');
  // 町や 家の 中
  await place(bot, 'overworld', PLACES.town.x + 23, PLACES.town.y + 20);
  const f3 = bot.msgs.length;
  await useGlass(bot);
  assert.ok(bot.s.map === 'overworld' && toasted(bot, '町や家の中では使えない', f3), '町の 中');
  await place(bot, PAST_ID, Math.floor(PAST_POS.hamletIn.x), Math.floor(PAST_POS.hamletIn.y));
  assert.equal(glassCheck(world, bot.s).key, 'town', '千年前の 里の 中');
  // 時のほこら・番人の 間・戦いの 中・空の 上
  const A = shrineArrive(1);
  await place(bot, A.map, Math.floor(A.x), Math.floor(A.y));
  assert.equal(glassCheck(world, bot.s).key, 'shrine');
  await place(bot, RUIN_BOSS_ID, 12, 16);
  assert.equal(glassCheck(world, bot.s).key, 'boss');
  bot.s.busy = 'battle';
  assert.equal(glassCheck(world, bot.s).key, 'busy');
  bot.s.busy = null;
  await place(bot, 'overworld', hx, hy);
  bot.s.flying = true;
  assert.equal(glassCheck(world, bot.s).key, 'fly');
  bot.s.flying = false;
  // 持っていない
  c.keyItems = c.keyItems.filter((k) => k !== TIME_GLASS);
  assert.equal(glassCheck(world, bot.s).key, 'none');
  for (const k of ['leader', 'wall', 'far', 'town', 'shrine', 'boss', 'fly', 'busy', 'none']) assert.ok(GLASS_TEXT[k], k);
  // 時のいせきの 階も 組（おなじ 座標）
  for (let n = 1; n <= RUIN_FLOORS; n++) {
    assert.equal(MAPS[ruinMapId(n, false)].timePair, ruinMapId(n, true));
    assert.equal(MAPS[ruinMapId(n, true)].timePair, ruinMapId(n, false));
  }
  assert.ok(!MAPS[RUIN_BOSS_ID].timePair && !MAPS.toki_shrine_2f.timePair);
  // フィールドは 里から 歩いて 行ける 所だけ（とじこめられない）
  const area = timeArea(MAPS[PAST_ID]);
  assert.ok(area && area[PAST_POS.dew.y * MAPS[PAST_ID].w + PAST_POS.dew.x]);
});

test('千年前では ルーラ・帰り道の羽・風の笛は 使えない（やさしい ことば。MP と 道具は へらない）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(6102, 'c6_past', { extra: ['c2_clear', 'c3_dragon'] });
  c.keyItems.push('wind_flute');
  c.visited = { village: true, town: true };
  await place(bot, PAST_ID, PLACES.shrine.x + 5, PLACES.shrine.y + 7);
  c.items.push({ id: 'return_wing', n: 1 });
  const f1 = bot.msgs.length;
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'village' });
  await play(bot);
  assert.equal(bot.s.map, PAST_ID);
  assert.ok(toasted(bot, 'この時代には、まだその町はない', f1), '帰り道の羽');
  assert.equal(c.items.find((i) => i.id === 'return_wing')?.n, 1, '羽は へらない');
  // ルーラ（MP は へらない）
  c.job = 'mage';
  c.jobs.mage = { lv: 10, b: 999 };
  c.learned = [...(c.learned || []), 'rura'];
  c.mp = 200;
  const f2 = bot.msgs.length;
  bot.send({ t: 'menu', action: 'cast', who: 'self', id: 'rura', place: 'village' });
  await play(bot);
  assert.equal(bot.s.map, PAST_ID);
  if (toasted(bot, 'この時代には', f2)) assert.equal(c.mp, 200, 'MP は へらない');
  // 風の笛
  const r = canCall(world, bot.s);
  assert.ok(!r.ok && r.reason.includes('千年前の空には'), '笛');
});

test('時の砂時計と 家族: リーダーだけ 使える。「みんなで」は おなじ マップの 家族も いっしょ・「ひとりで」は のこる', { timeout: 60000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(6103, 'c6_past');
  const hx = PLACES.shrine.x + 5, hy = PLACES.shrine.y + 7;
  world.placeSession(Pa, 'overworld', hx + 0.5, hy + 0.5, 'up', true);
  world.placeSession(Y, 'overworld', hx + 2.5, hy + 0.5, 'up', true);
  await play(papa, { others: [yui] });
  // ユイ（リーダーでない）は 使えない
  Y.char.keyItems.push(TIME_GLASS);
  const fy = yui.msgs.length;
  yui.send({ t: 'menu', action: 'timeGlass' });
  await play(yui, { others: [papa] });
  assert.equal(Y.map, 'overworld');
  assert.ok(toasted(yui, 'リーダーだけ', fy), 'リーダーだけ');
  // みんなで
  papa.choice = 0;
  await useGlass(papa, { others: [yui] });
  assert.equal(Pa.map, PAST_ID);
  assert.equal(Y.map, PAST_ID, 'ユイも いっしょ');
  assert.deepEqual([Y.x, Y.y], [hx + 2.5, hy + 0.5], 'ユイは 自分の 座標の まま');
  assert.ok(yui.msgs.some((m) => m.t === 'script' && m.spectator && m.steps.some((s) => s[0] === 'timeShift')), 'ユイも うずを 見る');
  // ひとりで（ユイは 千年前に のこる）
  papa.choice = 1;
  await useGlass(papa, { others: [yui] });
  assert.equal(Pa.map, 'overworld');
  assert.equal(Y.map, PAST_ID, 'ユイは のこる');
  // ユイの ものがたりは かわらない
  assert.ok(!Y.char.flags.c6_past);
});

// ───────────── 時のほこら ─────────────
// 砂時計の 台から とびらの 先まで、自分で 歩く 歩数（流される 間は 数えない）
function sandCost(n, k) {
  const m = MAPS[shrineMapId(n)];
  const D = SHRINE_POS[n].doors[k];
  const has = (f) => f === D.flag;
  const start = D4.map(([dx, dy]) => [D.dial.x + dx, D.dial.y + dy]).filter(([x, y]) => !isBlocked(m, x, y, has));
  const beyond = new Set();
  for (const c of D.cells) for (const [dx, dy] of D4) {
    const x = c.x + dx, y = c.y + dy;
    if (!isBlocked(m, x, y, has) && !D.cells.some((q) => q.x === x && q.y === y)) beyond.add(`${x},${y}`);
  }
  const dist = new Map(start.map(([x, y]) => [`${x},${y}`, 0]));
  const q = start.map(([x, y]) => [x, y, 0]);
  let best = Infinity;
  const startSide = reach(m.id, start[0], () => false);
  while (q.length) {
    q.sort((a, b) => a[2] - b[2]);
    const [x, y, d] = q.shift();
    if (d > (dist.get(`${x},${y}`) ?? Infinity)) continue;
    if (beyond.has(`${x},${y}`) && !startSide(x, y)) best = Math.min(best, d);
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (isBlocked(m, nx, ny, has)) continue;
      const r = carry(m, nx, ny, has);
      const k2 = `${r.x},${r.y}`;
      if (d + 1 < (dist.get(k2) ?? Infinity)) { dist.set(k2, d + 1); q.push([r.x, r.y, d + 1]); }
    }
  }
  return best;
}
test('時のほこら: 流れる 砂の ゆか・砂時計の とびら（砂が 落ちきる 前に 通れる。流される 間は 砂が 落ちない）・3階の 台座へ', () => {
  for (let n = 1; n <= 3; n++) {
    const m = MAPS[shrineMapId(n)];
    assert.ok(m.kind === 'dungeon' && !m.indoor && m.timeBlock, `${m.id}: ダンジョン・時の砂時計は 使えない`);
    const ex = dungeonExit(null, { map: m.id, char: {} });
    assert.ok(ex && ex.map === 'overworld', 'みちびきの糸で ほしみの丘へ');
  }
  // どの とびらも、台から 落ちきるまでの 歩数で 通れる
  const doors = Object.values(SHRINE_POS).flatMap((P) => Object.values(P.doors));
  assert.equal(doors.length, 3);
  for (const D of doors) {
    const cost = sandCost(D.n, D.k);
    assert.ok(cost < D.steps, `${D.n}階の とびら${D.k}: ${cost} 歩 < ${D.steps}`);
  }
  // 1階から 3階の 台座まで（とびらを 開けて）
  const flagsAll = (f) => f.startsWith('c6_sd_');
  let r = reach(shrineMapId(1), [Math.floor(shrineArrive(1).x), Math.floor(shrineArrive(1).y)], flagsAll);
  assert.ok(near(r, SHRINE_POS[1].down), '1階の 下りかいだん');
  assert.ok(!near(reach(shrineMapId(1), [Math.floor(shrineArrive(1).x), Math.floor(shrineArrive(1).y)]), SHRINE_POS[1].down), 'とびらが しまっていると 行けない');
  r = reach(shrineMapId(2), [Math.floor(shrineArrive(2).x), Math.floor(shrineArrive(2).y)], flagsAll);
  assert.ok(near(r, SHRINE_POS[2].down), '2階の 下りかいだん');
  r = reach(shrineMapId(3), [Math.floor(shrineArrive(3).x), Math.floor(shrineArrive(3).y)], () => false);
  assert.ok(near(r, SHRINE_POS[3].altarTop) && near(r, SHRINE_POS[3].font), '台座と いずみ');
  for (let n = 1; n <= 3; n++) for (const c of MAPS[shrineMapId(n)].chests) assert.ok(near(reach(shrineMapId(n), [Math.floor(shrineArrive(n).x), Math.floor(shrineArrive(n).y)], flagsAll), c), `宝箱 ${c.id}`);
});

test('砂時計の とびら（サーバー）: 台を しらべると 開く → 歩くと 砂が 落ちて しまる。流される 間は 数えない。のこった フラグは 消える', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(6104, 'c6_shrine');
  const D = SHRINE_POS[1].doors[1];
  const map = shrineMapId(1);
  await place(bot, map, D.dial.x + 1, D.dial.y);
  bot.choice = 0;
  await examine(bot, D.dial.x, D.dial.y);
  assert.ok(c.flags[D.flag], 'とびらが 開いた');
  assert.equal(bot.s.sand.left, D.steps);
  // 流れる 砂に のる まで 4歩・流されて 東の はしまで（数えない）
  const cx = D.dial.x + 1;
  for (const y of [13, 12, 11, 10]) await stepOn(bot, cx, y);
  assert.equal(bot.s.sand.left, D.steps - 4);
  const m = MAPS[map];
  const end = carry(m, cx, 10, (f) => !!c.flags[f]);
  for (const [x, y] of end.path.slice(1)) await stepOn(bot, x, y);
  assert.equal(bot.s.sand.left, D.steps - 4, '流される 間は 砂が 落ちない');
  // とびらを くぐる
  const door = D.cells[0];
  for (let y = end.y - 1; y >= door.y - 1; y--) await stepOn(bot, end.x, y);
  assert.ok(c.flags[D.flag], 'まだ 開いている');
  // 歩きつづけると 砂が 落ちきって しまる
  const f = bot.msgs.length;
  for (let i = 0; i < D.steps; i++) await stepOn(bot, end.x + (i % 2 ? 0 : 1), door.y - 2);
  assert.ok(!c.flags[D.flag], 'しまった');
  assert.ok(toasted(bot, '砂が落ちきって', f));
  // のこった フラグ（切れた など）は、だれも 砂を 落としていなければ 歩くと 消える
  c.flags[D.flag] = true;
  bot.s.sand = null;
  await stepOn(bot, end.x, door.y - 3);
  assert.ok(!c.flags[D.flag], 'のこった フラグは 消える');
});

// ───────────── 時のいせき ─────────────
const DV = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
// 階の しかけを ぜんぶ ためす さがし（時代・場所・フラグ）。shift … 時の砂時計を 使えるか
function ruinSolve(n, startPast, { shift = true } = {}) {
  const P = RUIN_POS[n];
  const objs = RUIN_OBJS[n] || [];
  const a = ruinArrive(n, startPast);
  const start = { past: startPast, x: Math.floor(a.x), y: Math.floor(a.y), flags: [] };
  const key = (s) => `${s.past ? 1 : 0}:${s.x},${s.y}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(start)]);
  const q = [start];
  const goals = [];
  while (q.length) {
    const s = q.shift();
    const has = (f) => s.flags.includes(f);
    const map = MAPS[ruinMapId(n, s.past)];
    const push = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.add(k); q.push(ns); } };
    for (const [dx, dy] of D4) {
      const nx = s.x + dx, ny = s.y + dy;
      if (isBlocked(map, nx, ny, has)) continue;
      const w = map.warpAt.get(ny * map.w + nx);
      if (w) { if (P.down && nx === P.down.x && ny === P.down.y) goals.push(s.past); continue; }
      push({ ...s, x: nx, y: ny });
    }
    const other = MAPS[ruinMapId(n, !s.past)];
    if (shift && canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, past: !s.past });
    if (s.past) {
      for (const k of [1, 2]) {
        const L = P.levers[k];
        if (L && Math.abs(L.x - s.x) + Math.abs(L.y - s.y) === 1 && !has(LEVER_FLAG(n, k))) push({ ...s, flags: [...s.flags, LEVER_FLAG(n, k)] });
      }
      for (const o of objs) {
        const i = objIndex(o, has);
        const c = o.track[i];
        const [dx, dy] = DV[o.dir];
        if (s.x === c.x - dx && s.y === c.y - dy && o.track[i + 1]) push({ ...s, flags: [...s.flags.filter((f) => !o.flags.includes(f)), o.flags[i + 1]] });
      }
      if (P.undo && Math.abs(P.undo.x - s.x) + Math.abs(P.undo.y - s.y) === 1) push({ ...s, flags: s.flags.filter((f) => !objs.some((o) => o.flags.includes(f))) });
      if (P.b && s.x === P.b.x && s.y === P.b.y && objOn(n, 'a', has) && !has(OPEN7)) push({ ...s, flags: [...s.flags, OPEN7] });
    }
  }
  return { goals, states: seen.size, seen };
}
test('時のいせき: どの 階も 今と 千年前で おなじ 形。どちらの 時代から 入っても 下へ 行ける・時の砂時計を 使わないと 行けない（4階 いがい）', () => {
  for (let n = 1; n <= RUIN_FLOORS; n++) {
    const now = MAPS[ruinMapId(n, false)], past = MAPS[ruinMapId(n, true)];
    assert.ok(now.w === past.w && now.h === past.h && now.w >= 34 && now.h >= 26, `${n}階: おなじ 大きさ（広め）`);
    for (const m of [now, past]) {
      assert.ok(m.kind === 'dungeon' && !m.indoor);
      const ex = dungeonExit(null, { map: m.id, char: {} });
      assert.ok(ex && ex.map === (m.past ? PAST_ID : 'overworld'), `${m.id}: みちびきの糸で その 時代の 外へ`);
    }
    let same = 0, diff = 0;
    for (let i = 0; i < now.tiles.length; i++) (now.tiles[i] === past.tiles[i] ? same++ : diff++);
    assert.ok(same > diff * 4 && diff > 0, `${n}階: かべの 形は おなじ・しかけは ちがう`);
    for (const past0 of [false, true]) {
      const r = ruinSolve(n, past0);
      if (n < RUIN_FLOORS) assert.ok(r.goals.length, `${n}階（${past0 ? '千年前' : '今'}から）: 下りかいだんへ 行ける`);
      else assert.ok(r.goals.includes(true), '7階: 千年前の 下りかいだん（番人の 間）へ');
      if (n !== RUIN_REST) assert.equal(ruinSolve(n, past0, { shift: false }).goals.length, 0, `${n}階（${past0 ? '千年前' : '今'}）: 時を こえないと 行けない`);
    }
  }
  // 7階の 今の 下りかいだんは くずれている・番人の 間は 千年前だけ
  assert.ok(isBlocked(MAPS.toki_ruin_7f, RUIN_POS[7].down.x, RUIN_POS[7].down.y, () => true));
  assert.equal(MAPS.toki_ruin_7f_past.warps.find((w) => w.x === RUIN_POS[7].down.x && w.y === RUIN_POS[7].down.y).to.map, RUIN_BOSS_ID);
  // 宝箱は その 時代の どこかから 行ける
  for (let n = 1; n <= RUIN_FLOORS; n++) for (const past of [false, true]) {
    const r = ruinSolve(n, past);
    const cells = new Set([...r.seen].map((k) => k.split(':').slice(0, 2).join(':')));
    for (const c of MAPS[ruinMapId(n, past)].chests) assert.ok(D4.some(([dx, dy]) => cells.has(`${past ? 1 : 0}:${c.x + dx},${c.y + dy}`)), `${n}階 ${past ? '千年前' : '今'} 宝箱 ${c.id}`);
  }
});

test('過去で したことが 今に のこる: 千年前の レバーの とびら・石像の 場所・7階の 重りの 石（どちらの 時代も おなじ フラグ）', () => {
  const P5 = RUIN_POS[5];
  const A = P5.doorsA[0];
  for (const past of [false, true]) {
    const m = MAPS[ruinMapId(5, past)];
    assert.ok(isBlocked(m, A.x, A.y, () => false), 'とびらは しまっている');
    assert.ok(!isBlocked(m, A.x, A.y, (f) => f === LEVER_FLAG(5, 1)), `千年前で レバーを 引くと ${past ? '千年前' : '今'}も 開く`);
  }
  assert.ok(isBlocked(MAPS.toki_ruin_5f, P5.levers[1].x, P5.levers[1].y, () => false) && MAPS.toki_ruin_5f.actionAt.get(P5.levers[1].y * MAPS.toki_ruin_5f.w + P5.levers[1].x)?.script === 'c6_rlever_now', '今の レバーは こわれている');
  // 3階の 石像
  const o = RUIN_OBJS[3][0];
  const plate = o.track.findIndex((c) => c.ch === 'P');
  assert.ok(plate > 0);
  const has = (f) => f === o.flags[plate];
  for (const past of [false, true]) {
    const m = MAPS[ruinMapId(3, past)];
    assert.equal(effectiveTile(m, o.track[0].x, o.track[0].y, () => false), T.STATUE, 'はじめは ここ');
    assert.equal(effectiveTile(m, o.track[plate].x, o.track[plate].y, has), T.STATUE, `${past ? '千年前' : '今'}も おした 場所に`);
    assert.notEqual(effectiveTile(m, o.track[0].x, o.track[0].y, has), T.STATUE);
  }
  const G = RUIN_POS[3].gateG;
  assert.ok(isBlocked(MAPS.toki_ruin_3f, G.x, G.y, () => false) && !isBlocked(MAPS.toki_ruin_3f, G.x, G.y, has), '今の 重りの ゆかで 今の とびらが 開く');
  assert.ok(isBlocked(MAPS.toki_ruin_3f_past, G.x, G.y, has), '千年前の とびらは しまった まま');
  // 7階: 重りの 石が 今の ふむ石の 上に のる
  const w = RUIN_OBJS[7][0];
  const ai = w.track.findIndex((c) => c.ch === 'a');
  assert.ok(ai > 0 && objOn(7, 'a', (f) => f === w.flags[ai]));
  assert.equal(effectiveTile(MAPS.toki_ruin_7f, RUIN_POS[7].a.x, RUIN_POS[7].a.y, () => false), T.TIME_PLATE);
  assert.equal(effectiveTile(MAPS.toki_ruin_7f, RUIN_POS[7].a.x, RUIN_POS[7].a.y, (f) => f === w.flags[ai]), T.BOULDER, '今にも 重りの 石');
  // 今の 根の 道・あな・根の かべ（千年前は ちがう）
  const cell = (n, ch) => { const rows = MAPS[ruinMapId(n, false)]; for (let y = 0; y < rows.h; y++) for (let x = 0; x < rows.w; x++) if (MAPS[ruinMapId(n, false)].tiles[y * rows.w + x] === ch) return [x, y]; return null; };
  const [rx, ry] = cell(2, T.ROOT_BRIDGE);
  assert.ok(!isBlocked(MAPS.toki_ruin_2f, rx, ry, () => false) && isBlocked(MAPS.toki_ruin_2f_past, rx, ry, () => false), '今の 根の 道は 千年前には ない');
  const [hx, hy] = cell(1, T.EARTH_PIT);
  assert.ok(isBlocked(MAPS.toki_ruin_1f, hx, hy, () => false) && !isBlocked(MAPS.toki_ruin_1f_past, hx, hy, () => false), '今の あなは 千年前は ゆか');
  const [dx, dy] = cell(1, T.RUBBLE);
  assert.ok(!isBlocked(MAPS.toki_ruin_1f, dx, dy, () => false) && isBlocked(MAPS.toki_ruin_1f_past, dx, dy, () => false), '千年前の とびらは 今は くずれて 通れる');
});

test('石像を おす（サーバー）: 千年前で うしろから しらべると 1マス・今は 動かない・もとに もどす 石板', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(6105, 'c6_ruin', { glass: true });
  const o = RUIN_OBJS[3][0];
  const s0 = o.track[0];
  await place(bot, ruinMapId(3, false), s0.x - 1, s0.y);
  const f0 = bot.msgs.length;
  await examine(bot, s0.x, s0.y);
  assert.ok(said(bot, 'びくともしない', f0) && !o.flags.some((f) => f && c.flags[f]), '今は 動かない');
  await place(bot, ruinMapId(3, true), s0.x - 1, s0.y, 'right');
  for (let i = 1; i <= 4; i++) {
    const cur = o.track[i - 1];
    await place(bot, ruinMapId(3, true), cur.x - 1, cur.y, 'right');
    await examine(bot, cur.x, cur.y);
    assert.ok(c.flags[o.flags[i]], `${i}マス`);
  }
  assert.ok(objOn(3, 'P', (f) => !!c.flags[f]), '重りの ゆかの 場所');
  // 横から しらべても 動かない
  const cur = o.track[4];
  await place(bot, ruinMapId(3, true), cur.x, cur.y - 1, 'down');
  const f1 = bot.msgs.length;
  await examine(bot, cur.x, cur.y);
  assert.ok(said(bot, 'がわから、おせそうだ', f1) && c.flags[o.flags[4]]);
  // もとに もどす
  const U = RUIN_POS[3].undo;
  await place(bot, ruinMapId(3, true), U.x + 1, U.y, 'left');
  bot.choice = 0;
  await examine(bot, U.x, U.y);
  assert.ok(!o.flags.some((f) => f && c.flags[f]), 'はじめの 場所へ');
});

test('7階の 2つの 時代の ふむ石: ひとり（千年前で 重りの 石）・家族 2人（1人ずつ 別の 時代で。ものがたりは リーダーだけ）', { timeout: 90000 }, async () => {
  // ひとり
  {
    const { bot, c } = await setup(6106, 'c6_ruin', { glass: true });
    const P = RUIN_POS[7];
    await place(bot, ruinMapId(7, true), P.b.x, P.b.y - 1);
    const f0 = bot.msgs.length;
    await stepOn(bot, P.b.x, P.b.y);
    assert.ok(!c.flags[OPEN7] && said(bot, '今の時代のふむ石は、だれもふんでいない', f0), 'ひとりでは 開かない');
    const w = RUIN_OBJS[7][0];
    const ai = w.track.findIndex((q) => q.ch === 'a');
    for (const f of w.flags) if (f) delete c.flags[f];
    c.flags[w.flags[ai]] = true;
    await place(bot, ruinMapId(7, true), P.b.x, P.b.y - 1);
    await stepOn(bot, P.b.x, P.b.y);
    assert.ok(c.flags[OPEN7], '千年前の 重りの 石が 今の ふむ石を おさえる');
    assert.ok(!isBlocked(MAPS.toki_ruin_7f, P.z.x, P.z.y, (f) => !!c.flags[f]) && !isBlocked(MAPS.toki_ruin_7f_past, P.z.x, P.z.y, (f) => !!c.flags[f]), 'どちらの 時代も 開く');
  }
  // 家族: ユイが 今の a、パパが 千年前の b（どちらが 先でも）
  for (const first of ['yui', 'papa']) {
    const { world, papa, yui, Pa, Y } = await family(first === 'yui' ? 6107 : 6108, 'c6_ruin');
    const P = RUIN_POS[7];
    world.placeSession(Pa, ruinMapId(7, true), P.b.x + 0.5, P.b.y - 0.5, 'down', true);
    world.placeSession(Y, ruinMapId(7, false), P.a.x + 0.5, P.a.y - 0.5, 'down', true);
    await play(papa, { others: [yui] });
    const yFlags = JSON.stringify(Y.char.flags);
    const steps = first === 'yui' ? [[yui, P.a], [papa, P.b]] : [[papa, P.b], [yui, P.a]];
    for (const [b, p] of steps) await stepOn(b, p.x, p.y, { others: [b === papa ? yui : papa] });
    assert.ok(Pa.char.flags[OPEN7], `${first}が 先: とびらが 開く`);
    assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは かわらない');
  }
});

// ───────────── 通しで ─────────────
async function fullRun(bot, c, fought) {
  const opts = { fought };
  // 第1部クリアの あと: ばあちゃん → 6つ目の 星（夜）
  const E = MAPS.overworld.npcById.elder;
  await place(bot, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
  await talk(bot, 'elder', opts);
  assert.ok(c.flags.c6_start, 'c6_start');
  // ほしみの丘の 入口 → 時のほこら
  const S = PAST_POS.shrineDoor;
  await place(bot, 'overworld', S.x, S.y + 1);
  await stepOn(bot, S.x, S.y, opts);
  assert.ok(c.flags.c6_shrine && bot.s.map === shrineMapId(1), 'c6_shrine');
  // 3階の 台座の 広間へ（サンドクロック）
  const T3 = SHRINE_POS[3].trigger;
  await place(bot, shrineMapId(3), 12, T3.y + 1);
  await stepOn(bot, 12, T3.y, opts);
  assert.ok(c.flags.c6_glass && c.keyItems.includes(TIME_GLASS), 'c6_glass・時の砂時計');
  // 丘で はじめて 使う → 千年前（c6_past）
  await place(bot, 'overworld', PLACES.shrine.x + 5, PLACES.shrine.y + 5);
  await stepOn(bot, PLACES.shrine.x + 5, PLACES.shrine.y + 6, opts);
  assert.ok(c.flags.c6_past && bot.s.map === PAST_ID, 'c6_past');
  // 里の 長・ホシヨ・しずく・なえを 植える
  for (const id of ['p_chief', 'hoshiyo']) {
    const n = MAPS[PAST_ID].npcById[id];
    await place(bot, PAST_ID, Math.floor(n.x), Math.floor(n.y) + 1);
    await talk(bot, id, opts);
  }
  assert.ok(c.flags[HOSHIYO_FLAG] && c.keyItems.includes('star_seedling'));
  await place(bot, PAST_ID, PAST_POS.dew.x, PAST_POS.dew.y - 1);
  await talk(bot, 'star_dew_spot', opts);
  assert.ok(c.keyItems.includes('star_dew'));
  await place(bot, PAST_ID, PAST_POS.seed.x, PAST_POS.seed.y + 1);
  bot.choice = 0;
  await talk(bot, 'seed_spot', opts);
  assert.ok(c.flags[PLANT_FLAG] && !c.keyItems.includes('star_seedling') && !c.keyItems.includes('star_dew'), 'なえを 植えた');
  // 今へ もどって 星の木を のぼる（c6_tree）
  await useGlass(bot, opts);
  assert.equal(bot.s.map, 'overworld');
  await talk(bot, 'star_tree', opts);
  assert.ok(c.flags.c6_tree, 'c6_tree');
  assert.ok(Math.abs(bot.s.y - PAST_POS.plateauIn.y) < 1.5, 'がけの 先');
  // つたで おりる
  bot.choice = 0;
  await examine(bot, PAST_POS.vine.x, PAST_POS.vine.y, opts);
  assert.ok(bot.s.y > PAST_POS.vine.y + 1, 'おりた');
  // 千年前へ → 泉の里 → リオン（c6_rion。ミナモが 加わる）
  await place(bot, 'overworld', PLACES.shrine.x + 5, PLACES.shrine.y + 7);
  await useGlass(bot, opts);
  const R = PAST_POS.rionMeet;
  await place(bot, PAST_ID, R.x + 5, R.y + 3);
  await stepOn(bot, R.x + 5, R.y + 1, opts);
  assert.ok(c.flags.c6_rion && c.guests.includes('minamo'), 'c6_rion・ミナモ');
  // 時のいせき（千年前の 時の神殿）に 入る（c6_ruin）
  const D = PAST_POS.ruin.door;
  await place(bot, PAST_ID, D.x, D.y + 1);
  await stepOn(bot, D.x, D.y, opts);
  assert.equal(bot.s.map, ruinMapId(1, true));
  const a1 = ruinArrive(1, true);
  await stepOn(bot, Math.floor(a1.x), Math.floor(a1.y) - 1, opts);
  assert.ok(c.flags.c6_ruin, 'c6_ruin');
  // 番人の 間（ギアドン）→ エンディング → c6_flow
  const B = RUIN_POS.boss.trigger;
  await place(bot, RUIN_BOSS_ID, 12, B.y + 1);
  await stepOn(bot, 12, B.y, opts);
}
test('通しで: c5_clear → 6つ目の 星 → 時のほこら → サンドクロック → 千年前 → 星の木 → リオン → 時のいせき → ギアドン → c6_flow', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(6201, 'c5_clear');
  const fought = [];
  const from = bot.msgs.length;
  await fullRun(bot, c, fought);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['sand_clock', 'geardon'], '戦い');
  for (const f of CH6_STEPS) assert.ok(c.flags[f], f);
  assert.equal(c.objective, C6_OBJ.flow);
  assert.ok(!c.guests.includes('minamo'), 'ミナモは はなれる');
  assert.ok(c.flags[END_A6]);
  // 台本の ならび・ことば
  for (const w of ['夜空に、見たことのない星', '第2部　第6章', 'わたしはトキネ', '影の時計師ゼンマイ', 'さあ、千年前へ', 'なえを植えて', '過去でしたことは、今にのこるの', 'きみの手にも…紋章？',
    'ミナモが仲間に加わった', 'ゼンマイの番兵ギアドン', '泉の水が、きらきらと光りながら', 'ぼくは、ほんとうに勇者になれるのかな', 'はじまりの勇者　リオン', '第6章の続きはアップデートで！']) {
    assert.ok(said(bot, w, from), w);
  }
  for (const id of ['zenmai', 'boss6', 'past_field', 'past_village']) assert.ok(said(bot, `"${id}"`, from), `曲 ${id}`);
  assert.ok(said(bot, '"showMon","sand_clock"', from) && said(bot, '"showMon","geardon"', from), 'showMon');
  assert.equal(bot.s.map, 'overworld', 'さいごは 今の ルミナの町');
  // クリアの あと: 像は もどった・泉の里は 動き出した・ばあちゃん
  const has = (f) => !!c.flags[f];
  assert.ok(condOk(MAPS.overworld.npcById.hero_statue_back.show, has) && !condOk(MAPS.overworld.npcById.hero_statue_faded.show, has));
  assert.ok(!condOk(MAPS[PAST_ID].npcById.f_m1.show, has) && condOk(MAPS[PAST_ID].npcById.s_m1.show, has));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('勇者の像が、元にもどった'));
});

test('負けた とき: サンドクロック・ギアドンに 負けたら すすまない（もう一度 最初から）', { timeout: 120000 }, async () => {
  {
    const { bot, c } = await setup(6202, 'c6_shrine');
    const T3 = SHRINE_POS[3].trigger;
    await place(bot, shrineMapId(3), 12, T3.y + 1);
    const fought = [];
    await stepOn(bot, 12, T3.y, { fought, lose: () => true });
    assert.ok(fought.includes('sand_clock') && !c.flags.c6_glass && !c.keyItems.includes(TIME_GLASS));
  }
  const { bot, c } = await setup(6203, 'c6_ruin', { glass: true });
  const B = RUIN_POS.boss.trigger;
  await place(bot, RUIN_BOSS_ID, 12, B.y + 1);
  const fought = [];
  await stepOn(bot, 12, B.y, { fought, lose: () => true });
  assert.ok(fought.includes('geardon') && !c.flags.c6_gear);
  assert.ok(condOk(MAPS[RUIN_BOSS_ID].npcById.geardon_npc.show, (f) => !!c.flags[f]), 'ギアドンは まだ いる');
});

// ───────────── とちゅうで 切れた とき ─────────────
test('とちゅうで 切れても だいじょうぶ: ギアドンの あとの 場面の とちゅうで 切れても、時の台座・ばあちゃん・勇者の像から 続きが 見られる', { timeout: 300000 }, async () => {
  // 1) 泉の里の 場面の とちゅう（c6_gear の あと）→ 時の台座
  {
    const { world, bot } = await setup(6301, 'c6_ruin', { glass: true });
    const B = RUIN_POS.boss.trigger;
    await place(bot, RUIN_BOSS_ID, 12, B.y + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = 12.5; bot.y = B.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: '泉の水が、きらきらと光りながら', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags.c6_gear && !c.flags[END_A6], 'ギアドンの あと・場面の はじめ');
    assert.equal(c.objective, C6_OBJ.gear);
    const K = RUIN_POS.boss.core;
    await place(b2, RUIN_BOSS_ID, K.x, K.y + 1);
    const f2 = b2.msgs.length;
    const fought = [];
    await examine(b2, K.x, K.y, { fought });
    assert.equal(fought.length, 0, 'もう 戦わない');
    assert.ok(said(b2, '泉の水が、きらきらと光りながら', f2) && said(b2, 'はじまりの勇者　リオン', f2), '泉の里から');
    assert.ok(c.flags.c6_flow && c.objective === C6_OBJ.flow && !c.guests.includes('minamo'));
  }
  // 2) 勇者の像の 場面の とちゅう（c6_end_a の あと）→ ホシフル村の ばあちゃん / 勇者の像
  for (const [seed, who] of [[6302, 'elder'], [6303, 'statue']]) {
    const { world, bot } = await setup(seed, 'c6_ruin', { glass: true });
    const B = RUIN_POS.boss.trigger;
    await place(bot, RUIN_BOSS_ID, 12, B.y + 1);
    world.markDirty();
    world.saveNow();
    const from = bot.msgs.length;
    bot.x = 12.5; bot.y = B.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: 'うすくなっていた勇者の像に', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags[END_A6] && !c.flags.c6_flow, `${who}: 泉の里まで 見た`);
    assert.equal(c.objective, C6_OBJ.endA);
    const f2 = b2.msgs.length;
    if (who === 'elder') {
      const E = MAPS.overworld.npcById.elder;
      await place(b2, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
      await talk(b2, 'elder');
    } else {
      const S = PAST_POS.statue;
      await place(b2, 'overworld', Math.floor(S.x), Math.floor(S.y) + 2);
      await talk(b2, 'hero_statue_faded');
    }
    assert.ok(!said(b2, '泉の水が、きらきらと光りながら', f2) && said(b2, 'はじまりの勇者　リオン', f2), `${who}: 像の 場面から`);
    assert.ok(c.flags.c6_flow && !c.guests.includes('minamo'));
  }
  // どこからでも おなじ 続き
  for (const stage of [['c6_gear'], ['c6_gear', END_A6]]) {
    const x = ctx(flagsOf(...UPTO('c6_gear'), ...stage));
    const want = JSON.stringify(endingFrom6(x));
    assert.ok(want.length > 20);
    for (const id of ['elder', 'c6_time_core', 'c6_statue']) assert.ok(JSON.stringify(SCRIPTS[id](x)).includes(want.slice(1, -1)), `${stage.join(',')}: ${id}`);
  }
  assert.deepEqual(endingFrom6(ctx(flagsOf(...UPTO('c6_flow')))), []);
});

// ───────────── 家族で ─────────────
test('家族で: 6つ目の 星・時のほこらの 戦い・千年前への 場面は いっしょに 見る。ものがたりは リーダーだけ すすむ', { timeout: 200000 }, async () => {
  const { world, papa, yui, Pa, Y } = await family(6401, 'c5_clear');
  const yFlags = JSON.stringify(Y.char.flags);
  const E = MAPS.overworld.npcById.elder;
  world.placeSession(Pa, 'overworld', E.x + 0.5, E.y + 1.5, 'up', true);
  world.placeSession(Y, 'overworld', E.x + 1.5, E.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fy = yui.msgs.length;
  await talk(papa, 'elder', { others: [yui] });
  assert.ok(Pa.char.flags.c6_start, 'リーダーの ものがたり');
  assert.ok(yui.msgs.slice(fy).some((m) => m.t === 'script' && m.spectator && JSON.stringify(m.steps).includes('第2部　第6章')), 'ユイも 見た');
  // ほこらの 3階: いっしょに 戦う
  const T3 = SHRINE_POS[3].trigger;
  world.placeSession(Pa, shrineMapId(3), 12.5, T3.y + 1.5, 'up', true);
  world.placeSession(Y, shrineMapId(3), 13.5, T3.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fought = [];
  await stepOn(papa, 12, T3.y, { others: [yui], fought });
  assert.ok(fought.includes('sand_clock') && yui.battles.length >= 1, 'ユイも いっしょに 戦った');
  assert.ok(Pa.char.flags.c6_glass && Pa.char.keyItems.includes(TIME_GLASS), 'リーダーが 時の砂時計');
  assert.ok(!Y.char.keyItems.includes(TIME_GLASS), '大事な物は リーダーだけ');
  // 丘で 千年前へ（いっしょに）
  world.placeSession(Pa, 'overworld', PLACES.shrine.x + 5.5, PLACES.shrine.y + 5.5, 'down', true);
  world.placeSession(Y, 'overworld', PLACES.shrine.x + 6.5, PLACES.shrine.y + 5.5, 'down', true);
  await play(papa, { others: [yui] });
  await stepOn(papa, PLACES.shrine.x + 5, PLACES.shrine.y + 6, { others: [yui] });
  assert.ok(Pa.char.flags.c6_past && Pa.map === PAST_ID && Y.map === PAST_ID, 'ふたりとも 千年前へ');
  assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは そのまま');
  // ユイが 千年前の ホシヨに 話しかけても、リーダーの ものがたり
  const n = MAPS[PAST_ID].npcById.hoshiyo;
  world.placeSession(Pa, PAST_ID, n.x + 0.5, n.y + 1.5, 'up', true);
  world.placeSession(Y, PAST_ID, n.x + 1.5, n.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  await talk(yui, 'hoshiyo', { others: [papa] });
  assert.ok(Pa.char.flags[HOSHIYO_FLAG] && !Y.char.flags[HOSHIYO_FLAG], 'リーダーの 世界で すすむ');
  assert.ok(Pa.char.keyItems.includes('star_seedling') && !Y.char.keyItems.includes('star_seedling'));
});

// ───────────── 文字・絵・音 ─────────────
test('文字: 第6章の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない。主人公の 年を 言わない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-ch6.js', 'public/js/shared/data/items-ch6-key.js', 'public/js/shared/maps/past.js', 'public/js/shared/maps/toki-shrine.js',
    'public/js/shared/maps/toki-ruin.js', 'public/js/shared/maps/toki-ruin-rows.js', 'public/js/shared/world/time-glass.js', 'public/js/shared/world/time-glass-use.js', 'public/js/shared/data/ch6-stub.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => k.startsWith('c6_')).map(([, fn]) => { try { return fn(ctx(flagsOf(...UPTO('c6_rion')))); } catch { return []; } }));
  assert.ok(!/\d+さい|\d+年生/.test(all), '年を 言わない');
  assert.ok(!/[祠跡苗扉]/.test(all), '使えない 漢字（ほこら・いせき・なえ・とびら）');
});

test('絵と 音: 第6章の タイル（2D は 16×16 を ぬる・2.5D）・テーマ（2D も 2.5D も）・人の え・6きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, CH6_KEEP_COLOR, ch6BlockSpec } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { blockSpec, FLOOR_H } = await import('../public/js/client/render/field3d.js').catch(() => ({}));
  const { paintHuman, npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_NPC_LOOKS, CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  assert.deepEqual([...CH6_TILES].sort((a, b) => a - b), [256, 257, 258, 259, 260, 261, 262, 263, 264, 265]);
  for (const id of CH6_TILES) {
    assert.ok(hasTileArt(id) && TILE_INFO[id], `${id}`);
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  for (const id of CH6_KEEP_COLOR) assert.equal(partOfTile(id), 'none');
  for (const id of [T.SAND_DOOR_OPEN, T.SAND_DIAL_ON, T.TIME_ALTAR]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name} が 動く`);
  }
  for (const id of [T.SAND_DIAL, T.SAND_DIAL_ON, T.TIME_ALTAR, T.TIME_ALTAR_EMPTY]) assert.ok(CH6_PROPS[id] && PROP_TILES.has(id), `2.5D の ${TILE_INFO[id].name}`);
  for (const id of [T.SAND_DOOR, T.STRAW_WALL]) assert.ok(ch6BlockSpec(id, 0)?.h > 1, `2.5D の かべ ${TILE_INFO[id].name}`);
  if (blockSpec) {
    assert.ok(blockSpec(T.SAND_DOOR, 0, 0) && blockSpec(T.STRAW_WALL, 0, 0), 'field3d の かべ');
    assert.ok(FLOOR_H[T.FROZEN_WATER] < 0, '泉は ひくい');
  }
  // マップの タイルは ぜんぶ 絵が ある（2D・2.5D 共通の え）
  for (const id of CH6_MAPS) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // テーマ（千年前は セピアを まぜる。緑は のこる）
  const g = themeRgb(0x5b, 0xab, 0x4b, 'past', 'floor');
  assert.ok(g[1] > g[2] && g[1] > g[0] && g[0] > 0x5b, `草の 緑が のこり、少し セピア ${g}`);
  for (const th of ['toki_shrine', 'toki_ruin', 'toki_ruin_past']) assert.notDeepEqual(themeRgb(0x80, 0x80, 0x80, th, 'wall'), [0x80, 0x80, 0x80], th);
  assert.ok(MAPS[PAST_ID].dusk && !MAPS[PAST_ID].dusk.flag, 'うすい セピアの まく（2D・2.5D の 上）');
  // 人の え
  for (const k of ['tokine', 'rion', 'minamo', 'hoshiyo', 'past_elder', 'frozen_man', 'spring_man']) {
    assert.ok(CH6_NPC_LOOKS[k] && npcOpts(k), k);
    for (const dir of ['down', 'up', 'left']) assert.ok(paintHuman(dir, 0, npcOpts(k)).px.some(Boolean), `${k} ${dir}`);
  }
  assert.notEqual(paintHuman('down', 0, npcOpts('frozen_man')).px.join(), paintHuman('down', 0, npcOpts('spring_man')).px.join(), '止まった 人は 灰色');
  for (const k of CH6_SPECIALS) for (const f of [0, 1]) { const p = paintSpecial(k, 'down', f); assert.ok(p && p.px.some(Boolean), `${k} f${f}`); }
  assert.notEqual(paintSpecial('hero_statue', 'down', 0).px.join(), paintSpecial('hero_statue_faded', 'down', 0).px.join(), '像が うすく なる');
  // 使う 人の え が ある
  const sprites = new Set();
  for (const id of [...CH6_MAPS, 'overworld']) for (const n of MAPS[id].npcs) if (/^(c6|p_|f_|s_|tent|rion|chibi|minamo|hoshiyo|star_|seed|hero|geardon)/.test(n.id)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  // 曲
  for (const id of ['past_field', 'past_village', 'toki_shrine', 'toki_ruin', 'boss6', 'zenmai']) {
    const tr = _TRACKS[id];
    assert.ok(tr && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) {
      if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこ`);
      else assert.ok(_parse(ch.n).every((n) => n.f === 0 || n.f > 20), `${id}: 音の 名前`);
    }
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  assert.ok(_TRACKS.boss6.bpm > _TRACKS.past_village.bpm);
});
