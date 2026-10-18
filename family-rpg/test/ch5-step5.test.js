// 第5章「空にうかぶ大地」Step 5（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// 守り星の かけら（c5_shard）→ 風見の石3で 風の道 → 星読みの里（c5_village）→ カナタ（c5_kanata）→ ばあちゃん（c5_grandma。星読みの ランプ）
// → 星読みの 水しょう → ノクトの 思い出の 迷宮（c5_memory。6階・光と 影・思い出の かけら）→ ノクトの 影（c5_nshadow）→ 本物の ノクト（c5_nocto）
// 里と 迷宮の 魔物・nocto_shadow の 戦いの しくみ・品は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import { KUMOI_VANES, KUMOI_ROADS, KUMOI_POS, KUMOI_ISLES, STAR_TOWN } from '../public/js/shared/maps/kumoi.js';
import {
  K6, HOSHIYOMI_POS, HOSHIYOMI_TOWNS, HOSHIYOMI_MAPS, PRACTICE_ORDER, PRACTICE_FAKE, PRACTICE_FLAGS, PRACTICE_DONE, PRACTICE_PRIZE,
} from '../public/js/shared/maps/hoshiyomi.js';
import {
  MEMORY_FLOORS, MEMORY_MAPS, MEMORY_POS, MEMORY_REST, MEMORY_BOSS, MEMORY_SIGHTS, MEMORY_OUT, MF, LAMP, MSHARD, MEMORY_SHARD_FLAGS,
  memoryMapId, memoryArrive, memoryTable, memoryTheme, memoryShardsAll,
} from '../public/js/shared/maps/memory.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH5_STEPS, OLD_C5_OBJ, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch5.js';
import { KUMOI_OBJ } from '../public/js/shared/data/story-kumoi.js';
import { HOSHIYOMI_STEPS, HOSHIYOMI_OBJ, HOSHIYOMI_STORY_SCRIPTS } from '../public/js/shared/data/story-hoshiyomi.js';
import { HOSHIYOMI_SHOP_WEAPONS, HOSHIYOMI_SHOP_ARMOR, HOSHIYOMI_SHOP_TOOLS, MEMORY_TREASURE } from '../public/js/shared/data/items-hoshiyomi.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { skyBox, inSkyBox } from '../public/js/shared/data/sky.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { warpPlaces } from '../public/js/shared/world/travel.js';
import { warpDest } from '../public/js/shared/world/services.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h) => (h - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto, extra = [], frac = hour(10)) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  for (const k of ['wind_flute', ...(c.flags.c5_grandma ? ['star_lamp'] : [])]) if (!c.keyItems.includes(k)) c.keyItems.push(k);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 47);
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
// その 世界で 歩いて 行ける マス（ふさがった ワープの マスには 入れない。ワープの 先へは 行かない）
function reach(id, start, flags) {
  const m = MAPS[id];
  const has = (f) => flags.includes(f);
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k)) continue;
      if (isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return Object.assign((x, y) => seen.has(y * m.w + x), { seen, w: m.w });
}
const near = (r, p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r(p.x + dx, p.y + dy));
const arriveCell = (n) => { const a = memoryArrive(n); return [Math.floor(a.x), Math.floor(a.y)]; };
const lampsOf = (n) => Object.entries(MEMORY_POS[n].lamps).map(([k, L]) => ({ k: Number(k), ...L }));

// 光と 影の なぞを ぜんぶ ためす: 光る ランプ台（0 … どれも 光っていない）と かけらを 拾ったかで 歩ける 所が かわる。
// ひとりで あそぶ とき、どの じょうたいからも 下りかいだん・上りかいだん（1階は 出口）へ 行けるか（とじこめられないか）
function memoryStates(n) {
  const m = MAPS[memoryMapId(n)];
  const P = MEMORY_POS[n];
  const lamps = lampsOf(n);
  const flagsFor = (lit, shard) => [...(lit ? [LAMP(n, lit)] : []), ...(shard ? [MSHARD(n)] : [])];
  const nodes = new Map();
  const key = (cell, lit, shard) => `${cell[0]},${cell[1]}|${lit}|${shard ? 1 : 0}`;
  const q = [[arriveCell(n), 0, false]];
  const edges = new Map();
  while (q.length) {
    const [cell, lit, shard] = q.shift();
    const k0 = key(cell, lit, shard);
    if (nodes.has(k0)) continue;
    const r = reach(m.id, cell, flagsFor(lit, shard));
    nodes.set(k0, { cell, lit, shard, r });
    const out = [];
    for (const L of lamps) {
      if (L.k === lit || !near(r, L)) continue;
      const from = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [L.x + dx, L.y + dy]).find(([x, y]) => r(x, y));
      // 光を うつすと、立っている マスが ふさがる ことは ない（ランプ台の となりは いつも ゆか）
      assert.ok(!isBlocked(m, from[0], from[1], (f) => flagsFor(L.k, shard).includes(f)), `${n}階: ランプ台${L.k} の となり`);
      out.push(key(from, L.k, shard));
      q.push([from, L.k, shard]);
    }
    if (P.shard && !shard && near(r, P.shard)) {
      const from = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [P.shard.x + dx, P.shard.y + dy]).find(([x, y]) => r(x, y));
      out.push(key(from, lit, true));
      q.push([from, lit, true]);
    }
    edges.set(k0, out);
  }
  return { nodes, edges };
}
function canReachFrom(states, k0, test) {
  const seen = new Set([k0]);
  const q = [k0];
  while (q.length) {
    const k = q.shift();
    if (test(states.nodes.get(k))) return true;
    for (const nk of states.edges.get(k) || []) if (!seen.has(nk)) { seen.add(nk); q.push(nk); }
  }
  return false;
}

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c5_shard → c5_village … c5_nocto（名前の 約束）。目標・仲間会話・地図の しるし・Step 4 の さいごの 文の なおし', () => {
  assert.deepEqual(HOSHIYOMI_STEPS, ['c5_village', 'c5_kanata', 'c5_grandma', 'c5_memory', 'c5_nshadow', 'c5_nocto'], '名前の 約束（plan-ch5.md の 14）');
  const si = CH5_STEPS.indexOf('c5_shard');
  assert.deepEqual(CH5_STEPS.slice(si + 1), HOSHIYOMI_STEPS, 'c5_shard の うしろに つづく');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c5_shard') + 1, STORY_STEPS.indexOf('c5_shard') + 7), HOSHIYOMI_STEPS);
  assert.deepEqual(HOSHIYOMI_MAPS, ['hoshiyomi']);
  assert.deepEqual(MEMORY_MAPS, ['memory_1f', 'memory_2f', 'memory_3f', 'memory_4f', 'memory_5f', 'memory_6f'], 'マップの ID の 約束');
  // Step 4 の さいごの 文は 星読みの里への 文に なおる
  const old = { flags: flagsOf(...UPTO('c5_shard')), objective: OLD_C5_OBJ.shard };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C5_OBJ.shard));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, KUMOI_OBJ.shard);
  // フラグごとの 目標
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  assert.equal(objectiveFromFlags(f('c5_village')), HOSHIYOMI_OBJ.village);
  assert.equal(objectiveFromFlags(f('c5_kanata')), HOSHIYOMI_OBJ.kanata);
  assert.equal(objectiveFromFlags(f('c5_grandma')), HOSHIYOMI_OBJ.grandma);
  assert.equal(objectiveFromFlags(f('c5_memory', MF(1))), HOSHIYOMI_OBJ.memory);
  for (let n = 2; n <= 6; n++) assert.equal(objectiveFromFlags(f('c5_memory', ...[1, 2, 3, 4, 5, 6].filter((k) => k <= n).map(MF))), HOSHIYOMI_OBJ[`m${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_nshadow', MF(6))), HOSHIYOMI_OBJ.nshadow);
  assert.equal(objectiveFromFlags(f('c5_nocto')), HOSHIYOMI_OBJ.nocto);
  assert.ok(HOSHIYOMI_OBJ.nocto.startsWith('第5章の続きはアップデートで！'), 'Step 5 の さいご');
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries({ ...HOSHIYOMI_OBJ, shard: KUMOI_OBJ.shard })) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // ヒント: 風見の石・ランプ台と 影・4階の 回る 影
  assert.ok(talkFor(KUMOI_OBJ.shard, 'self').includes('風見の石'));
  assert.ok(talkFor(HOSHIYOMI_OBJ.memory, 'self').includes('ランプ台') && talkFor(HOSHIYOMI_OBJ.memory, 'self').includes('影'));
  assert.ok(talkFor(HOSHIYOMI_OBJ.m4, 'kind').includes('西のランプ台'));
  // 地図の しるし
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c5_shard'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const V3 = KUMOI_POS.vane3;
  assert.ok(mark(KUMOI_OBJ.shard, 'kumoi').some((m) => m.x === V3.x && m.y === V3.y), '風見の石3');
  assert.ok(!mark(KUMOI_OBJ.shard, 'kumoi', [KUMOI_VANES.v3]).some((m) => m.x === V3.x && m.y === V3.y), '回したら 消える');
  assert.ok(mark(KUMOI_OBJ.shard, ruinMapId1()).length, '神殿の 中からも');
  assert.ok(mark(HOSHIYOMI_OBJ.village, 'hoshiyomi').some((m) => m.x === HOSHIYOMI_POS.kanata.x), 'カナタ');
  assert.ok(mark(HOSHIYOMI_OBJ.grandma, 'hoshiyomi').some((m) => m.x === HOSHIYOMI_POS.crystal.x && m.y === HOSHIYOMI_POS.crystal.y), '水しょう');
  const L11 = MEMORY_POS[1].lamps[1];
  assert.ok(mark(HOSHIYOMI_OBJ.memory, memoryMapId(1)).some((m) => m.x === L11.x && m.y === L11.y), 'ランプ台');
  assert.ok(!mark(HOSHIYOMI_OBJ.memory, memoryMapId(1), [LAMP(1, 1)]).some((m) => m.x === L11.x && m.y === L11.y), '光らせたら 消える');
  assert.ok(mark(HOSHIYOMI_OBJ.m6, memoryMapId(6)).length, 'ノクトの影');
  // パーティー全員で 見る だいほん
  for (const id of HOSHIYOMI_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
});
const ruinMapId1 = () => 'sink_ruin_1f';

// ───────────── クモイ地方: 星読みの里の 島と 風の道 ─────────────
test('クモイ地方: 西の 小島「星読みの里」。かけらの あと 風見の石3で 北へ 風の道が 開く。里の 島から 東へ 帰れる。竜は 里に 着くまで 里の 島の 上を 飛べない', { timeout: 60000 }, async () => {
  const m = MAPS.kumoi;
  const I = KUMOI_ISLES.star;
  assert.ok(!TILE_INFO[m.tiles[Math.floor(I.cy) * m.w + Math.floor(I.cx)]].solid || m.tiles[Math.floor(I.cy) * m.w + Math.floor(I.cx)] === T.WALL_WOOD, '島が ある');
  assert.equal(m.zoneAt(2, 29), 't5_village', '里の まわりの 魔物（B の t5_village）');
  assert.ok(m.spawnCounts.t5_village > 0 && ENCOUNTER_TABLES.t5_village);
  assert.ok(m.zoneAt(KUMOI_POS.starGate[0].x, KUMOI_POS.starGate[0].y + 1).startsWith('safe'));
  for (const g of KUMOI_POS.starGate) {
    const w = m.warps.find((w) => w.x === g.x && w.y === g.y);
    assert.equal(w.to.map, 'hoshiyomi');
    assert.deepEqual([w.to.x, w.to.y], [HOSHIYOMI_POS.arrive.x, HOSHIYOMI_POS.arrive.y], '里の 中の 着く 所と おなじ');
  }
  // 風の道 w7 は ふだん 雲の 海（風見の石3で 開く）
  const R = KUMOI_ROADS.w7;
  for (const [x, y] of R.cells) {
    assert.equal(effectiveTile(m, x, y, () => false), T.CLOUD_SEA);
    assert.equal(effectiveTile(m, x, y, (f) => f === R.flag), T.SKYWIND_N);
  }
  const gate = `${KUMOI_POS.starGate[0].x},${KUMOI_POS.starGate[0].y}`;
  const stops = (flags, start) => flowReach(m, start, (f) => flags.includes(f));
  const sinkDoor = [16, 46];
  assert.ok(!stops([], sinkDoor).pits.has(gate), '石3を 回すまで 里へ 行けない');
  assert.ok(stops([R.flag], sinkDoor).pits.has(gate), '石3を 回すと しずみゆく島から 里の 門へ');
  // 里の 島から、風見の石が どの 向きでも ハネノの島へ 帰れる
  const all = Object.values(KUMOI_VANES);
  for (const fl of [[], [KUMOI_VANES.v1], [KUMOI_VANES.v2], all, [R.flag]]) {
    const r = stops(fl, [7, 29]);
    assert.ok(r.stops.has('59,33'), `里の 島から ハネノの島へ (${fl})`);
  }
  // 竜: かけらの あとも 里の 島の 上は だめ。里に 着くと どこでも
  const b1 = skyBox('kumoi', (f) => f === 'c5_shard');
  assert.ok(!inSkyBox(b1, I.cx, I.cy) && inSkyBox(b1, KUMOI_ISLES.far.cx, KUMOI_ISLES.far.cy));
  assert.equal(skyBox('kumoi', (f) => ['c5_shard', 'c5_village'].includes(f)), null);
  // 風見の石3: かけらの 前は 回らない・あとは 回す（もう 1回で もどる）
  const V = KUMOI_POS.vane3;
  {
    const { bot, c } = await setup(7101, 'c5_gaia');
    await place(bot, 'kumoi', V.x - 1, V.y);
    await examine(bot, V.x, V.y);
    assert.ok(!c.flags[R.flag] && said(bot, '石が止まらない'), 'かけらの 前');
  }
  const { world, bot, c } = await setup(7102, 'c5_shard');
  await place(bot, 'kumoi', V.x - 1, V.y);
  await examine(bot, V.x, V.y);
  assert.ok(c.flags[R.flag] && said(bot, '風の道が開いた'));
  assert.equal(effectiveTile(m, V.x, V.y, world.hasFlagFn(bot.s)), T.VANE_ON);
  await examine(bot, V.x, V.y);
  assert.ok(!c.flags[R.flag], 'もう 1回で とじる');
  // 竜で 里の 島の 上には 来られない（里に 着くと 来られる）
  await place(bot, 'kumoi', 7, 29);
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(!bot.s.flying, '里に 着く 前');
  c.flags.c5_village = true;
  bot.send({ t: 'fly', action: 'call' });
  assert.ok(bot.s.flying, '里に 着いた あと');
  assert.ok(STAR_TOWN.w > 0);
});

// ───────────── 星読みの里 ─────────────
test('星読みの里: 町の マップ・宿屋・教会・よろず屋（B の ならび）・ルーラ・南の 門。弟子 → カナタ（c5_kanata）→ ばあちゃん（c5_grandma・星読みの ランプ）→ 水しょう', { timeout: 60000 }, async () => {
  const m = MAPS.hoshiyomi;
  assert.equal(m.kind, 'field');
  assert.equal(m.bgm, 'hoshiyomi');
  assert.equal(m.outside, 'cloud');
  assert.deepEqual(SHOPS.hoshiyomi_weapon.items, HOSHIYOMI_SHOP_WEAPONS);
  assert.deepEqual(SHOPS.hoshiyomi_armor.items, HOSHIYOMI_SHOP_ARMOR);
  assert.deepEqual(SHOPS.hoshiyomi_item.items, HOSHIYOMI_SHOP_TOOLS);
  for (const k of ['hoshiyomi_weapon', 'hoshiyomi_armor', 'hoshiyomi_item']) for (const id of shopItems(SHOPS[k])) assert.ok(ITEMS[id]?.price > 0, `${k}: ${id}`);
  assert.deepEqual(SCRIPTS.c5_shop_yw(ctx({})), [['shop', 'hoshiyomi_weapon']]);
  assert.ok(JSON.stringify(SCRIPTS.c5_inn_hoshiyomi(ctx({}))).includes('"inn"'));
  for (const kind of ['inn', 'church', 'general']) assert.ok(m.boards.some((b) => b.kind === kind), kind);
  assert.ok(m.npcs.some((n) => n.script === 'church'));
  assert.ok(HOSHIYOMI_TOWNS.hoshiyomi && warpPlaces({ visited: { hoshiyomi: true } }).includes('hoshiyomi'));
  const d = warpDest('hoshiyomi');
  assert.ok(d.map === 'hoshiyomi' && !isBlocked(m, Math.floor(d.x), Math.floor(d.y), () => true));
  for (const e of HOSHIYOMI_POS.exit) assert.equal(m.warps.find((w) => w.x === e.x && w.y === e.y).to.map, 'kumoi');
  // 里の 中は どこへでも 歩いて 行ける（門・カナタの 家・水しょうの 前・星見の 広場・宿屋・教会・よろず屋）
  const r = reach('hoshiyomi', [20, 26], []);
  // カウンターの 向こうの 人は、カウンターの 前まで
  const behind = ['c5_y_inn', 'c5_y_weapon', 'c5_y_armor', 'c5_y_item'];
  for (const p of [HOSHIYOMI_POS.crystalFront, { x: 20, y: 11 }, { x: 28, y: 21 }, ...m.npcs.filter((n) => !n.show)]) {
    const [x, y] = [Math.floor(p.x), Math.floor(p.y) + (behind.includes(p.id) ? 2 : 0)];
    assert.ok(r(x, y) || near(r, { x, y }), `${p.id || ''} ${x},${y}`);
  }
  for (const ch of m.chests) assert.ok(near(r, ch), ch.id);

  const { world, bot, c } = await setup(7201, 'c5_shard');
  await place(bot, 'kumoi', KUMOI_POS.starGate[0].x, KUMOI_POS.starGate[0].y + 1);
  await stepOn(bot, KUMOI_POS.starGate[0].x, KUMOI_POS.starGate[0].y);
  assert.equal(bot.s.map, 'hoshiyomi', '里に 入った');
  await stepOn(bot, 20, 25);
  assert.ok(c.flags.c5_village && said(bot, 'カナタさま'), '弟子の あいさつ（c5_village）');
  assert.equal(c.objective, HOSHIYOMI_OBJ.village);
  // カナタ: 昔の 星読み → 本当は「ひとりは、選ぶ」→ ノクト
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.kanata.x, HOSHIYOMI_POS.kanata.y + 1);
  const f1 = bot.msgs.length;
  await talk(bot, 'kanata');
  assert.ok(c.flags.c5_kanata);
  assert.ok(said(bot, 'ひとりは選ばれ、ひとりは選ばれぬ', f1) && said(bot, 'ひとりは、選ぶ', f1) && said(bot, 'ノクト', f1));
  assert.equal(c.objective, HOSHIYOMI_OBJ.kanata);
  // 水しょうは まだ 入れない
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.crystalFront.x - 0.5, HOSHIYOMI_POS.crystalFront.y - 0.5);
  await examine(bot, HOSHIYOMI_POS.crystal.x, HOSHIYOMI_POS.crystal.y);
  assert.equal(bot.s.map, 'hoshiyomi');
  // 家の 外へ 出ると、ばあちゃんが 竜で 来る
  await place(bot, 'hoshiyomi', 20, 10, 'down');
  const f2 = bot.msgs.length;
  await stepOn(bot, 20, 11);
  assert.ok(c.flags.c5_grandma, 'ばあちゃんの 話（c5_grandma）');
  assert.ok(said(bot, '紋章のぎしき', f2) && said(bot, 'わしが、あの子をひとりにしたんじゃ', f2));
  assert.ok(said(bot, 'star_dragon', f2), '竜で 来る');
  assert.ok(c.keyItems.includes('star_lamp'), '星読みのランプ');
  assert.equal(c.objective, HOSHIYOMI_OBJ.grandma);
  assert.ok(m.npcs.find((n) => n.id === 'elder_hy').show.all.includes('c5_grandma'));
  // 水しょう → 思い出の 迷宮 1階
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.crystalFront.x - 0.5, HOSHIYOMI_POS.crystalFront.y - 0.5);
  bot.choice = 0;
  await examine(bot, HOSHIYOMI_POS.crystal.x, HOSHIYOMI_POS.crystal.y);
  assert.equal(bot.s.map, memoryMapId(1), '思い出の 中へ');
  // ばあちゃん（ホシフル村）の ことばも かわる
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('ノクト'));
  void world;
});

test('星読みの 練習: 里の 子どもの 星座の なぞ（上 → 右 → 下 → 左）。じゅんばんちがい・にせの 星で やり直し。できると 里の 宝（1回だけ）', { timeout: 60000 }, async () => {
  const m = MAPS.hoshiyomi;
  // 夜は 本物の 星だけ 光る・昼は おなじ え
  for (const [x, y] of PRACTICE_ORDER) {
    assert.equal(effectiveTile(m, x, y, () => false), T.STAR_DIM);
    assert.equal(effectiveTile(m, x, y, (f) => f === '@night'), T.STAR_GLOW);
  }
  for (const [x, y] of PRACTICE_FAKE) assert.equal(effectiveTile(m, x, y, (f) => f === '@night'), T.STAR_DIM);
  assert.ok(m.actions.some((a) => a.script === 'c5_y_chart'), '子どもの 絵（昼の ヒント）');
  assert.ok(JSON.stringify(SCRIPTS.c5_y_chart(ctx({}))).includes('時計回り'));
  const { world, bot, c } = await setup(7301, 'c5_village');
  const [s1, s2, s3, s4] = PRACTICE_ORDER;
  // 星の となり（星でも にせの 星でも ない マス）から ふむ
  const stars = [...PRACTICE_ORDER, ...PRACTICE_FAKE].map(([x, y]) => `${x},${y}`);
  const stepStar = async ([x, y]) => {
    const [ax, ay] = [[0, -1], [-1, 0], [1, 0], [0, 1]].map(([dx, dy]) => [x + dx, y + dy]).find(([a, b]) => !stars.includes(`${a},${b}`) && !isBlocked(m, a, b, () => false));
    await place(bot, 'hoshiyomi', ax, ay);
    await stepOn(bot, x, y);
  };
  await stepStar(s2);
  assert.ok(!c.flags[PRACTICE_FLAGS[1]] && said(bot, 'じゅんばんが、ちがう'), 'じゅんばんちがい');
  await stepStar(s1);
  assert.ok(c.flags[PRACTICE_FLAGS[0]]);
  await stepStar(PRACTICE_FAKE[0]);
  assert.ok(!c.flags[PRACTICE_FLAGS[0]], 'にせの 星で 消える');
  for (const p of [s1, s2, s3, s4]) await stepStar(p);
  assert.ok(c.flags[PRACTICE_DONE] && said(bot, '羽の形'), '星座が つながった');
  assert.equal(effectiveTile(m, s1[0], s1[1], world.hasFlagFn(bot.s)), T.STAR_LIT);
  const n0 = (id) => c.items.find((i) => i.id === id)?.n || 0;
  const [hp, mg] = [n0('seed_hp'), n0('seed_mag')];
  const kid = m.npcs.find((n) => n.id === 'c5_y_kid3');
  await place(bot, 'hoshiyomi', kid.x - 1, kid.y);
  await talk(bot, 'c5_y_kid3');
  assert.ok(c.flags[PRACTICE_PRIZE] && n0('seed_hp') === hp + 1 && n0('seed_mag') === mg + 1, '里の 宝');
  await talk(bot, 'c5_y_kid3');
  assert.equal(n0('seed_hp'), hp + 1, '1回だけ');
});

// ───────────── 思い出の 迷宮 ─────────────
test('迷宮の マップ: 6階（5さい〜今）。かいだんの つながり・3階の 休み所・1階の 出口と 糸は 星読みの里へ・各階に かけら・宝箱は B の ★', () => {
  assert.equal(new Set(MEMORY_SIGHTS.slice(1)).size, MEMORY_FLOORS, '1つの 階に 1つの 見どころ');
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    const m = MAPS[memoryMapId(n)];
    assert.equal(m.kind, 'dungeon');
    assert.ok(!m.noEscape, `${n}階: 糸・リレミトが 使える`);
    assert.equal(m.bgm, 'memory');
    assert.equal(m.theme, memoryTheme(n));
    const table = memoryTable(n);
    assert.equal(table, n <= 3 ? 't5_memory' : 't5_memory_deep');
    assert.ok(ENCOUNTER_TABLES[table], table);
    if (n === MEMORY_REST) assert.deepEqual(m.spawnCounts, {}, '休み所の 階は 魔物が 出ない');
    else assert.ok(m.spawnCounts[table] > 0, `${n}階: 魔物が 出る`);
    const P = MEMORY_POS[n];
    assert.ok(P.shard, `${n}階: 思い出の かけら`);
    assert.ok(Object.keys(P.lamps).length >= 1, `${n}階: ランプ台`);
    if (P.down) assert.equal(m.warps.find((w) => w.x === P.down.x && w.y === P.down.y).to.map, memoryMapId(n + 1));
    if (n > 1) assert.equal(m.warps.find((w) => w.x === P.up.x && w.y === P.up.y).to.map, memoryMapId(n - 1));
    assert.ok(m.zoneAt(...arriveCell(n)).startsWith('safe'), `${n}階: 入った 所は 魔物が 出ない`);
    // 影の 道・もやの 上は 魔物が 出ない
    for (const L of Object.values(P.lamps)) for (const p of L.path) assert.ok(m.zoneAt(p.x, p.y).startsWith('safe'), `${n}階 影の道 ${p.x},${p.y}`);
    for (const [i, id] of (MEMORY_TREASURE[n] || []).entries()) assert.ok(m.chests.some((ch) => ch.id === `m5_${n}${'ab'[i]}` && ch.item === id), `${n}階の ★の 宝箱 ${id}`);
  }
  assert.equal(MEMORY_POS[6].down, null, '6階が いちばん 下');
  const f1 = MAPS[memoryMapId(1)];
  for (const p of MEMORY_POS[1].exit) assert.equal(f1.warps.find((w) => w.x === p.x && w.y === p.y).to.map, 'hoshiyomi');
  const out = dungeonExit({}, { char: { dungeonFrom: null }, map: memoryMapId(5) });
  assert.equal(out.map, 'hoshiyomi');
  assert.ok(Math.abs(out.x - MEMORY_OUT.x) < 1 && Math.abs(out.y - MEMORY_OUT.y) < 1, '糸で 水しょうの 前へ');
  // 3階の 休み所
  const f3 = MAPS[memoryMapId(MEMORY_REST)];
  assert.ok(f3.actions.some((a) => a.script === 'c5_m_rest'));
  const opts = SCRIPTS.c5_m_rest(ctx({})).find((s) => s[0] === 'choice')[3];
  assert.ok(opts[0].some((s) => s[0] === 'heal') && opts[0].some((s) => s[0] === 'church'), '回復と 記録');
  // 6階: ノクトの 影
  const f6 = MAPS[memoryMapId(MEMORY_BOSS)];
  assert.ok(f6.npcs.some((n) => n.id === 'nocto_shade' && n.script === 'c5_nshadow_event'));
});

test('光と 影: どの じょうたいからも とじこめられない。下りかいだん・かけら・宝箱に 行ける。影は 柱の うしろに のびる', () => {
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    const m = MAPS[memoryMapId(n)];
    const P = MEMORY_POS[n];
    const st = memoryStates(n);
    const goalDown = (s) => (P.down ? s.r(P.down.x, P.down.y) : near(s.r, P.boss) || s.r(P.boss.x, P.boss.y));
    const goalUp = (s) => (n === 1 ? s.r(P.exit[0].x, P.exit[0].y) : s.r(P.up.x, P.up.y));
    for (const k of st.nodes.keys()) {
      assert.ok(canReachFrom(st, k, goalDown), `${n}階 ${k}: 下へ 行ける`);
      assert.ok(canReachFrom(st, k, goalUp), `${n}階 ${k}: 上へ もどれる`);
    }
    // かけら・宝箱は どこかの じょうたいで 行ける
    const any = (p) => [...st.nodes.values()].some((s) => near(s.r, p));
    assert.ok(any(P.shard), `${n}階: かけら`);
    for (const ch of m.chests) assert.ok(any(ch), `${n}階: 宝箱 ${ch.id}`);
    // ランプ台を 光らせないと 下へ 行けない（1つの 階に 1つの 見どころ。3階の 休み所は べつ）
    if (n !== MEMORY_REST) assert.ok(!goalDown({ r: reach(m.id, arriveCell(n), []) }), `${n}階: 光の なぞ`);
    // 影の 道は 柱の うしろ（ランプ台 → 柱 → 影の 道が ほぼ 一直線）
    for (const L of Object.values(P.lamps)) {
      if (!L.path.length) continue;
      const first = L.path.reduce((a, b) => (Math.hypot(a.x - L.x, a.y - L.y) < Math.hypot(b.x - L.x, b.y - L.y) ? a : b));
      const pil = P.pillars.find((o) => Math.abs(o.x - first.x) + Math.abs(o.y - first.y) <= 4 && Math.sign(o.x - L.x) === Math.sign(first.x - o.x) && Math.sign(o.y - L.y) === Math.sign(first.y - o.y));
      assert.ok(pil, `${n}階 ランプ台 ${L.x},${L.y}: 影の 道の 前に 柱`);
      for (const p of L.path) {
        assert.equal(effectiveTile(m, p.x, p.y, () => false), T.MEM_VOID);
        assert.equal(effectiveTile(m, p.x, p.y, (f) => f === L.flag), T.SHADOW_PATH);
      }
    }
  }
});

test('光と 影の だいほん: ランプ台を しらべると 光が うつる（1つの 階に 1つ）。影の 道が できる。かけらで その 年の 場面・かけらの 道は 消えなくなる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(7401, 'c5_memory', [MF(1)]);
  const m = MAPS[memoryMapId(1)];
  const [L1, L2] = [MEMORY_POS[1].lamps[1], MEMORY_POS[1].lamps[2]];
  await place(bot, m.id, L1.x - 1, L1.y);
  await examine(bot, L1.x, L1.y);
  assert.ok(c.flags[L1.flag] && said(bot, '影が、すうっとのびていく'));
  assert.equal(effectiveTile(m, L1.x, L1.y, world.hasFlagFn(bot.s)), T.LAMP_LIT);
  assert.equal(effectiveTile(m, L1.path[0].x, L1.path[0].y, world.hasFlagFn(bot.s)), T.SHADOW_PATH);
  // 2つ目の ランプ台: 前の 光は 消える
  await place(bot, m.id, L2.x - 1, L2.y);
  await examine(bot, L2.x, L2.y);
  assert.ok(c.flags[L2.flag] && !c.flags[L1.flag], '光る ランプ台は 1つ');
  assert.equal(effectiveTile(m, L1.path[0].x, L1.path[0].y, world.hasFlagFn(bot.s)), T.MEM_VOID);
  // かけら（東の へや）→ 5さいの 場面 → 影の 道が 消えなくなる
  const S = MEMORY_POS[1].shard;
  await place(bot, m.id, S.x - 1, S.y);
  const f0 = bot.msgs.length;
  await examine(bot, S.x, S.y);
  assert.ok(c.flags[MSHARD(1)] && said(bot, '…どうして、ぼくだけ…。', f0) && said(bot, '（1/6）', f0));
  assert.ok(said(bot, '{name}の紋章が、やさしく光った', f0), '主人公の 思い出も');
  assert.equal(effectiveTile(m, S.x, S.y, world.hasFlagFn(bot.s)), T.CAVE_FLOOR);
  await place(bot, m.id, L1.x - 1, L1.y);
  await examine(bot, L1.x, L1.y);
  assert.equal(effectiveTile(m, L2.path[0].x, L2.path[0].y, world.hasFlagFn(bot.s)), T.SHADOW_PATH, 'かけらへの 影の 道は 消えない');
  assert.deepEqual(SCRIPTS.c5_mshard1(ctx(c.flags)), [], '2回目は ない');
  // どの 階の かけらにも 年の 場面と 主人公の 思い出（入った ときの ことば）
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    assert.ok(SCRIPTS[`c5_mshard${n}`](ctx({})).length > 6, `${n}階の 場面`);
    assert.ok(JSON.stringify(SCRIPTS[`c5_mf${n}`](ctx({}))).includes('{name}'), `${n}階: 主人公の 思い出`);
  }
});

test('家族 2人: 1人が 遠くの ランプ台を 光らせて、もう 1人が 影の 道を わたれる（同じ 階なら はなれていても。リーダーの 世界）', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(7501), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO('c5_memory'), MF(1), MF(2)]) Pa.char.flags[f] = true;
  Pa.char.keyItems.push('star_lamp');
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  const L = MEMORY_POS[2].lamps[1];
  world.placeSession(Pa, memoryMapId(2), 5.5, 15.5, 'up', true);
  world.placeSession(Y, memoryMapId(2), L.x - 0.5, L.y + 0.5, 'up', true);
  for (let i = 0; i < 4; i++) { await papa.settle(); await yui.settle(); }
  Pa.x = 3.5; Pa.y = 13.5;
  yui.send({ t: 'interact', kind: 'tile', x: L.x, y: L.y });
  for (let i = 0; i < 8; i++) { await papa.settle(); await yui.settle(); }
  assert.ok(Pa.char.flags[L.flag], 'ユイが 光らせた ランプ台は リーダーの 世界');
  assert.ok(!Y.char.flags[L.flag]);
});

// ───────────── ノクトの 影・本物の ノクト ─────────────
test('ノクトの影の 台本: showMon → battle（nocto_shadow）。負けたら 止まり やり直せる。勝つと c5_nshadow → 水しょうの 前 → 本物の ノクト（c5_nocto）。かけら 6つで ことばが かわる', { timeout: 90000 }, async () => {
  const fx = FIXED_ENCOUNTERS.nocto_shadow;
  assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === 'nocto_shadow', 'きまった 戦い nocto_shadow（B。まだ ない 時は 仮の データ）');
  const steps = SCRIPTS.c5_nshadow_event(ctx(flagsOf(...UPTO('c5_memory'))));
  const iMon = steps.findIndex((s) => s[0] === 'showMon' && s[1] === 'nocto_shadow');
  const iBat = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'nocto_shadow');
  assert.ok(iMon >= 0 && iBat > iMon, 'showMon → battle');
  assert.ok(steps.findIndex((s) => s[0] === 'flag' && s[1] === 'c5_nshadow') > iBat);
  assert.ok(steps.some((s) => s[0] === 'bgm' && s[1] === 'nocto_shadow'));
  assert.deepEqual(SCRIPTS.c5_nshadow_event(ctx(flagsOf(...UPTO('c5_nshadow')))), []);
  const T6 = MEMORY_POS[6].trigger;
  for (const allShards of [false, true]) {
    const { bot, c } = await setup(allShards ? 7602 : 7601, 'c5_memory', [MF(6), ...(allShards ? MEMORY_SHARD_FLAGS : [])]);
    const fought = [];
    await place(bot, memoryMapId(6), T6.x - 1, 13);
    if (!allShards) {
      await stepOn(bot, T6.x, 13, { lose: (id) => id === 'nocto_shadow', fought });
      assert.ok(fought.includes('nocto_shadow'));
      assert.ok(!c.flags.c5_nshadow, '負けたら すすまない');
      await place(bot, memoryMapId(6), T6.x - 1, 13);
    }
    const from = bot.msgs.length;
    await stepOn(bot, T6.x, 13, { fought });
    assert.ok(c.flags.c5_nshadow && c.flags.c5_nocto, '勝った → 本物の ノクト');
    assert.equal(bot.s.map, 'hoshiyomi', '水しょうの 前へ');
    assert.ok(said(bot, '…見たのか、ぼくの思い出を。', from) && said(bot, '同情なんかいらない', from));
    assert.ok(said(bot, '大地の神殿', from) && said(bot, '第5章の続きはアップデートで！', from));
    assert.equal(c.objective, HOSHIYOMI_OBJ.nocto);
    assert.equal(said(bot, 'ピピは、元気か', from), allShards, 'かけら 6つで ノクトの ことばが かわる');
    assert.equal(said(bot, 'だれかに、見つけてほしかったんだ', from), allShards, 'かけら 6つで さいごの 場面が かわる');
    assert.equal(memoryShardsAll((f) => !!c.flags[f]), allShards);
  }
});

// ───────────── 通しで ─────────────
test('通しで あそべる: c5_shard → 風見の石3 → 星読みの里 → カナタ → ばあちゃん → 思い出の 迷宮 1〜6階（ランプ台と かけら）→ ノクトの影 → 本物の ノクト（c5_nocto）', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(7701, 'c5_shard');
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
  const fought = [];
  const opts = { fought };
  const got = (f) => assert.ok(c.flags[f], f);
  // しずみゆく島の 北西の 風見の石3 → 風の道 → 里の 島 → 里の 門
  const V = KUMOI_POS.vane3;
  await place(bot, 'kumoi', V.x - 1, V.y);
  await examine(bot, V.x, V.y, opts);
  got(KUMOI_VANES.v3);
  assert.ok(flowReach(MAPS.kumoi, [16, 46], world.hasFlagFn(bot.s)).pits.has(`${KUMOI_POS.starGate[0].x},${KUMOI_POS.starGate[0].y}`), '風の道で 里の 門へ');
  await place(bot, 'kumoi', KUMOI_POS.starGate[0].x, KUMOI_POS.starGate[0].y + 1);
  await stepOn(bot, KUMOI_POS.starGate[0].x, KUMOI_POS.starGate[0].y, opts);
  await stepOn(bot, 20, 25, opts);
  got('c5_village');
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.kanata.x, HOSHIYOMI_POS.kanata.y + 1);
  await talk(bot, 'kanata', opts);
  got('c5_kanata');
  await place(bot, 'hoshiyomi', 20, 10, 'down');
  await stepOn(bot, 20, 11, opts);
  got('c5_grandma');
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.crystalFront.x - 0.5, HOSHIYOMI_POS.crystalFront.y - 0.5);
  bot.choice = 0;
  await examine(bot, HOSHIYOMI_POS.crystal.x, HOSHIYOMI_POS.crystal.y, opts);
  assert.equal(bot.s.map, memoryMapId(1));
  await stepOn(bot, 9, 14, opts);
  got('c5_memory');
  got(MF(1));
  // 各階: ランプ台を 光らせて かけらを 拾い、下りかいだんへ（どの ランプ台を 使うかは テストの 中で さがす）
  const light = async (n, k) => {
    const L = MEMORY_POS[n].lamps[k];
    const from = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [L.x + dx, L.y + dy]).find(([x, y]) => !isBlocked(MAPS[memoryMapId(n)], x, y, world.hasFlagFn(bot.s)));
    await place(bot, memoryMapId(n), from[0], from[1]);
    await examine(bot, L.x, L.y, opts);
    got(L.flag);
  };
  const SHARD_LAMP = { 1: 2, 2: 4, 3: 1, 4: 1, 5: 3, 6: 2 };
  const DOWN_LAMP = { 1: 1, 2: 2, 3: null, 4: 2, 5: 2, 6: 1 };
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    const P = MEMORY_POS[n];
    assert.equal(c.objective, HOSHIYOMI_OBJ[n === 1 ? 'memory' : `m${n}`], `${n}階の 目標`);
    if (n === MEMORY_REST) {
      await place(bot, memoryMapId(n), P.font.x, P.font.y + 1);
      bot.choice = 0;
      await examine(bot, P.font.x, P.font.y, opts);
    }
    // かけら（影の 道を わたって）
    await light(n, SHARD_LAMP[n]);
    const S = P.shard;
    const r = reach(memoryMapId(n), [Math.floor(bot.s.x), Math.floor(bot.s.y)], Object.keys(c.flags).filter((f) => c.flags[f]));
    assert.ok(near(r, S), `${n}階: かけらへ 歩いて 行ける`);
    const sFrom = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [S.x + dx, S.y + dy]).find(([x, y]) => r(x, y));
    await place(bot, memoryMapId(n), sFrom[0], sFrom[1]);
    await examine(bot, S.x, S.y, opts);
    got(MSHARD(n));
    if (n === MEMORY_BOSS) break;
    if (DOWN_LAMP[n]) await light(n, DOWN_LAMP[n]);
    const D = P.down;
    await place(bot, memoryMapId(n), D.x, D.y + (MAPS[memoryMapId(n)].tiles[(D.y + 1) * MAPS[memoryMapId(n)].w + D.x] === T.CAVE_FLOOR ? 1 : -1));
    await stepOn(bot, D.x, D.y, opts);
    assert.equal(bot.s.map, memoryMapId(n + 1), `${n + 1}階へ`);
    const A = arriveCell(n + 1);
    await stepOn(bot, A[0], A[1], opts);
    got(MF(n + 1));
  }
  // 6階: 大広間へ（影の 道 → ノクトの 影）
  await light(6, 1);
  const T6 = MEMORY_POS[6].trigger;
  await place(bot, memoryMapId(6), T6.x - 1, 13);
  await stepOn(bot, T6.x, 13, opts);
  for (const f of HOSHIYOMI_STEPS) got(f);
  for (const f of MEMORY_SHARD_FLAGS) got(f);
  assert.equal(c.objective, HOSHIYOMI_OBJ.nocto);
  assert.equal(bot.s.map, 'hoshiyomi');
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['nocto_shadow'], 'きまった 戦いは ノクトの影だけ');
  assert.ok(said(bot, 'ピピは、元気か'), '6つ 集めた ことば');
  // 長ソラネ・ピピ・カナタ・ばあちゃんの ことば
  assert.ok(JSON.stringify(SCRIPTS.c5_pipi(ctx(c.flags))).includes('会ったの'));
  assert.ok(JSON.stringify(SCRIPTS.c5_kanata(ctx(c.flags))).includes('ぜんぶ見た') || JSON.stringify(SCRIPTS.c5_kanata(ctx(c.flags))).includes('全部見た'));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('帰る場所'));
  // あとからも 水しょうで 思い出の 中へ 入れる
  await place(bot, 'hoshiyomi', HOSHIYOMI_POS.crystalFront.x - 0.5, HOSHIYOMI_POS.crystalFront.y - 0.5);
  bot.choice = 0;
  await examine(bot, HOSHIYOMI_POS.crystal.x, HOSHIYOMI_POS.crystal.y, opts);
  assert.equal(bot.s.map, memoryMapId(1));
});

// ───────────── 文字 ─────────────
test('文字: 第5章 Step 5 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-hoshiyomi.js', 'public/js/shared/maps/hoshiyomi.js', 'public/js/shared/maps/memory.js', 'public/js/shared/maps/memory-rows.js', 'public/js/shared/data/shops-hoshiyomi.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  // ノクトの 名前は カナタの 話から（里の 人は その前に 名前を 言わない）
  const before = flagsOf(...UPTO('c5_village'));
  for (const id of ['c5_y_deshi', 'c5_y_old', 'c5_y_man', 'c5_y_woman']) assert.ok(!JSON.stringify(SCRIPTS[id](ctx(before))).includes('ノクト'), id);
});

// ───────────── 絵と 音 ─────────────
test('絵と 音: 迷宮と 里の タイル（2D は 16×16 を ぬる・2.5D）・年ごとの 色・人の 絵（カナタ・里の 人・ノクト・ノクトの影）・3きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { MEMORY_TILES, MEMORY_PROPS, MEMORY_LIQUIDS, MEMORY_KEEP_COLOR } = await import('../public/js/client/render/tiles-memory.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { npcOpts, paintHuman } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const ids = [T.MEM_VOID, T.SHADOW_PATH, T.SHADOW_FLOOR, T.LAMP_STAND, T.LAMP_LIT, T.MEM_SHARD, T.MEM_PILLAR, T.MEM_EXIT, T.STAR_CRYSTAL, T.STAR_SCOPE];
  assert.deepEqual([...MEMORY_TILES].sort((a, b) => a - b), [...ids].sort((a, b) => a - b));
  for (const id of ids) {
    assert.ok(hasTileArt(id) && TILE_INFO[id], `${id}`);
    for (const f of [0, 1, 2, 3]) {
      const p = paintTile(id, 0x21, f, 0);
      assert.equal(p.px.filter((c) => !c).length, 0, `${TILE_INFO[id].name} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((c) => HEX.test(c)), TILE_INFO[id].name);
    }
  }
  for (const id of MEMORY_KEEP_COLOR) assert.equal(partOfTile(id), 'none', TILE_INFO[id].name);
  for (const id of [T.MEM_VOID, T.SHADOW_PATH, T.LAMP_LIT, T.MEM_SHARD, T.STAR_CRYSTAL]) {
    assert.ok(isAnimated(id), TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
  }
  for (const [a, b] of [[T.LAMP_STAND, T.LAMP_LIT], [T.MEM_VOID, T.SHADOW_PATH], [T.MEM_SHARD, T.MEM_PILLAR]]) assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join());
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...HOSHIYOMI_MAPS, ...MEMORY_MAPS, 'kumoi']) {
    const m = MAPS[id];
    const all = new Set(m.tiles);
    for (const g of m.gates) { all.add(g.open); all.add(g.closed); for (const [, t] of g.levels || []) all.add(t); }
    for (const t of all) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 2.5D: もやは ずっと 下・たてた もの
  assert.ok(MEMORY_LIQUIDS[T.MEM_VOID].y < -1);
  for (const id of [T.LAMP_STAND, T.LAMP_LIT, T.MEM_SHARD, T.MEM_PILLAR, T.STAR_CRYSTAL, T.STAR_SCOPE]) assert.ok(MEMORY_PROPS[id] && PROP_TILES.has(id), TILE_INFO[id].name);
  // 年ごとの 色（5さいは あたたかい・13さいは 空色・今は くらい）
  const fl = (n) => themeRgb(0x80, 0x80, 0x80, memoryTheme(n), 'floor');
  assert.ok(fl(1)[0] > fl(1)[2] && fl(5)[2] > fl(5)[0], '5さいは あたたかい・13さいは 空色');
  assert.ok(fl(6).reduce((a, b) => a + b) < fl(3).reduce((a, b) => a + b), '今は くらい');
  assert.equal(new Set([1, 2, 3, 4, 5, 6].map((n) => fl(n).join())).size, 6, '6つの 年で ちがう 色');
  // 人の 絵
  for (const n of [...MAPS.hoshiyomi.npcs, ...MAPS[memoryMapId(6)].npcs]) assert.ok(npcOpts(n.sprite), n.id);
  for (const kind of ['kanata', 'nocto', 'nocto_shade']) assert.ok(npcOpts(kind), kind);
  assert.notEqual(paintHuman('down', 0, npcOpts('nocto')).px.join(), paintHuman('down', 0, npcOpts('hood_kid')).px.join(), 'フードを はずした ノクト');
  assert.notEqual(paintHuman('down', 0, npcOpts('nocto_shade')).px.join(), paintHuman('down', 0, npcOpts('hood_kid')).px.join(), 'まっくろな 影');
  // 曲（里・迷宮・ボス）
  for (const id of ['hoshiyomi', 'memory', 'nocto_shadow']) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, n) => s + n.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) {
      if (ch.drums) assert.ok(_parse(ch.n).every((n) => n.drum), `${id}: たいこ`);
      else assert.ok(_parse(ch.n).every((n) => n.f === 0 || n.f > 20), `${id}: 音の 名前`);
    }
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
  assert.equal(MAPS.hoshiyomi.bgm, 'hoshiyomi');
});
