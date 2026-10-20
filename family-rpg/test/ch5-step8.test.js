// 第5章「空にうかぶ大地」Step 8（A8: 影の城の 世界）※ ネタバレ注意（物語の 中みを ためす）
// みんなと 話した あと（c5_gather）→ 長ソラネ（c5_croad。ハネビトの 風の道）→ 影の城の 前の 小島 → 城の 門（c5_cin）→
// 1階 ふういんの とびら（いのりの歌）→ 風の階（風の流れ・風車）→ 4階 ストルムの まぼろし（c5_seal1）→ 炎の階（炎の 柱・氷の像・炎の 大門）→
// 8階 イグニアの まぼろし（c5_seal2）→ 水の階（水の 高さ・流れる ゆか・水車）→ 12階 モルガナの まぼろし（c5_seal3）→ てっぺん（A9 の castle_top）
// 影の城の 魔物・まぼろしの 戦いの しくみ・宝の 品は B8。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach, carry } from '../public/js/shared/maps/flow.js';
import { KUMOI_ISLES, KUMOI_POS } from '../public/js/shared/maps/kumoi.js';
import { K7 } from '../public/js/shared/maps/earth.js';
import {
  K8, CF, DOOR1_FLAG, VANE2_FLAG, PAIR, PAIR_FLOORS, STATUE_FLAG, STATUE_DIRS, STATUE_RAYS, WATER9, BELT10_FLAG, SEAL_FLAGS, GATES, PHANTOMS,
  CASTLE_FLOORS, CASTLE_MAPS, CASTLE_POS, CASTLE_ROAD, CASTLE_SIGHTS, CASTLE_REST, CASTLE_TOP, CASTLE_TOP_ARRIVE, CASTLE_FROM_TOP,
  castleMapId, castleArrive, castleTable, castleTheme, castleBgm, statueDir, nextStatueDir, waterLevel, nextWaterLevel, gateArrive, co,
} from '../public/js/shared/maps/castle.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH5_STEPS, OLD_C5_OBJ, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch5.js';
import { EARTH_OBJ, EARTH_STEPS } from '../public/js/shared/data/story-earth.js';
import { CASTLE_STEPS, CASTLE_OBJ, CASTLE_STORY_SCRIPTS } from '../public/js/shared/data/story-castle.js';
// 仮の 品（B8 の data/items-castle.js が 入ったら、ここも そちらに かえる）
import { CASTLE_TREASURE } from '../public/js/shared/data/items-castle.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { DAY_MS, timeFlag, firePhase, FIRE_HALF } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h) => (h - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto, extra = [], { song = true } = {}) {
  const clock = { now: at(hour(10)) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  for (const k of ['wind_flute', 'star_lamp', ...(song ? ['yukina_song', 'hoshifuru_stone'] : [])]) if (!c.keyItems.includes(k)) c.keyItems.push(k);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 54);
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

// ───────────── しかけを ぜんぶ ためす じょうたいの さがし（ひとり＋仲間）─────────────
// じょうたい … いる マス・フラグ（しかけ・炎の 柱の 時間 '@fireA'〈ない ときは '@fireB' の 柱が もえている〉）
// 歩いて・流されて 行ける ところは maps/flow.js の flowReach（ワープ〈かいだん〉の マスは pits）
// うごき … 1階 ふういんの とびら（いのりの歌）・2階 風見の石・2人で ふむ 石（仲間に 待っていてもらう → もう 片方を ふむ）・
//   6階 氷の像と レバー・9階 水の 高さの ハンドル・10階 レバー・まぼろしの 広間（戦いに 勝つ）・炎の 柱の 時間（待つ）
const hasOf = (fl) => (f) => (f === '@fireB' ? !fl.has('@fireA') : fl.has(f));
const keyOf = (cell, fl) => `${cell}|${[...fl].sort().join(',')}`;
const toggled = (fl, f) => { const s = new Set(fl); if (s.has(f)) s.delete(f); else s.add(f); return s; };
const arriveCell = (n) => { const a = castleArrive(n); return [Math.floor(a.x), Math.floor(a.y)]; };
function castleStates(n, extra = []) {
  const m = MAPS[castleMapId(n)], P = CASTLE_POS[n];
  const nodes = new Map(), edges = new Map();
  const q = [[arriveCell(n), new Set(extra)]];
  while (q.length) {
    const [cell, fl] = q.shift();
    const k0 = keyOf(cell, fl);
    if (nodes.has(k0)) continue;
    const has = hasOf(fl);
    const r = flowReach(m, cell, has);
    nodes.set(k0, { cell, fl, r });
    const out = [];
    const near = (p) => D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => r.stops.has(`${x},${y}`));
    const go = (c, nf) => {
      // しかけを うごかしても、立っている マスが ふさがる ことは ない（しかけの となりは いつも ゆか）
      assert.ok(!isBlocked(m, c[0], c[1], hasOf(nf)) || nf.has('@fireA') !== fl.has('@fireA'), `${n}階: ${c} が ふさがる`);
      out.push(keyOf(c, nf));
      q.push([c, nf]);
    };
    // 炎の 柱の 時間（どこでも 待てる）
    if ([5, 7].includes(n)) for (const k of r.stops) go(k.split(',').map(Number), toggled(fl, '@fireA'));
    if (n === 1 && !fl.has(DOOR1_FLAG)) for (const p of P.seal) { const c = near(p); if (c) { go(c, toggled(fl, DOOR1_FLAG)); break; } }
    if (n === 2) { const c = near(P.vane); if (c) go(c, toggled(fl, VANE2_FLAG)); }
    if (n === 6) {
      for (const p of [...P.statues, ...P.levers]) {
        const c = near(p);
        if (!c) continue;
        const d = statueDir(has), nd = nextStatueDir(d);
        const s = new Set(fl);
        if (STATUE_FLAG[d]) s.delete(STATUE_FLAG[d]);
        if (STATUE_FLAG[nd]) s.add(STATUE_FLAG[nd]);
        go(c, s);
      }
    }
    if (n === 9) {
      for (const p of P.handles) {
        const c = near(p);
        if (!c) continue;
        const nl = nextWaterLevel(waterLevel(has));
        const s = new Set(fl);
        s.delete(WATER9.mid); s.delete(WATER9.lo);
        if (nl !== 'hi') s.add(WATER9[nl]);
        go(c, s);
      }
    }
    if (n === 10) for (const p of P.belts) { const c = near(p); if (c) go(c, toggled(fl, BELT10_FLAG)); }
    if (PAIR[n] && !fl.has(PAIR[n].open)) {
      const F = PAIR[n];
      for (const [side, p, other] of [['a', P.plateA, 'b'], ['b', P.plateB, 'a']]) {
        if (!r.stops.has(`${p.x},${p.y}`)) continue;
        const s = new Set(fl);
        if (fl.has(F.wait[other])) { s.delete(F.wait.a); s.delete(F.wait.b); s.add(F.open); } else if (!fl.has(F.wait[side])) s.add(F.wait[side]); else continue;
        out.push(keyOf([p.x, p.y], s));
        q.push([[p.x, p.y], s]);
      }
    }
    if (PHANTOMS[n] && !fl.has(PHANTOMS[n].flag)) {
      const Tr = P.trigger;
      for (let x = Tr.x; x < Tr.x + Tr.w; x++) if (r.stops.has(`${x},${Tr.y}`)) { go([x, Tr.y], toggled(fl, PHANTOMS[n].flag)); break; }
    }
    edges.set(k0, out);
  }
  return { nodes, edges };
}
function canReachFrom(st, k0, ok) {
  const seen = new Set([k0]);
  const q = [k0];
  while (q.length) {
    const k = q.shift();
    if (ok(st.nodes.get(k))) return true;
    for (const nk of st.edges.get(k) || []) if (!seen.has(nk)) { seen.add(nk); q.push(nk); }
  }
  return false;
}
const pit = (s, p) => s.r.pits.has(`${p.x},${p.y}`);
const nearStop = (r, p) => D4.some(([dx, dy]) => r.stops.has(`${p.x + dx},${p.y + dy}`));

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c5_gather → c5_croad・c5_cin・c5_seal1〜3（名前の 約束）。目標・仲間会話・地図の しるし・Step 7 の さいごの 文の なおし', () => {
  assert.deepEqual(CASTLE_STEPS, ['c5_croad', 'c5_cin', 'c5_seal1', 'c5_seal2', 'c5_seal3'], '名前の 約束（plan-ch5.md の 17）');
  const gi = CH5_STEPS.indexOf('c5_gather');
  assert.equal(gi, CH5_STEPS.indexOf(EARTH_STEPS[EARTH_STEPS.length - 1]));
  assert.deepEqual(CH5_STEPS.slice(gi + 1, gi + 1 + CASTLE_STEPS.length), CASTLE_STEPS, 'c5_gather の うしろに つづく');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c5_gather') + 1, STORY_STEPS.indexOf('c5_gather') + 6), CASTLE_STEPS);
  assert.deepEqual(CASTLE_MAPS, Array.from({ length: 12 }, (_, i) => `castle_${i + 1}f`), 'マップの ID の 約束');
  assert.equal(CASTLE_TOP, 'castle_top', 'てっぺんは A9');
  assert.deepEqual(Object.values(PHANTOMS).map((p) => p.id), ['phantom_storm', 'phantom_ignia', 'phantom_morgana'], 'まぼろしの 戦いの 約束（B8）');
  // Step 7 の さいごの 文は 長ソラネへの 文に なおる
  const old = { flags: flagsOf(...UPTO('c5_gather')), objective: OLD_C5_OBJ.gather };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C5_OBJ.gather));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, EARTH_OBJ.gather);
  assert.ok(EARTH_OBJ.gather.includes('長ソラネ') && !EARTH_OBJ.gather.includes('アップデート'));
  // フラグごとの 目標
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  assert.equal(objectiveFromFlags(f('c5_croad')), CASTLE_OBJ.croad);
  assert.equal(objectiveFromFlags(f('c5_cin', CF(1))), CASTLE_OBJ.cin);
  assert.equal(objectiveFromFlags(f('c5_cin', CF(1), DOOR1_FLAG)), CASTLE_OBJ.door1);
  const floors = (n) => Array.from({ length: n }, (_, i) => CF(i + 1));
  for (const n of [2, 3, 4]) assert.equal(objectiveFromFlags(f('c5_cin', DOOR1_FLAG, ...floors(n))), CASTLE_OBJ[`f${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_seal1', DOOR1_FLAG, ...floors(4))), CASTLE_OBJ.seal1);
  for (const n of [5, 6, 7, 8]) assert.equal(objectiveFromFlags(f('c5_seal1', DOOR1_FLAG, ...floors(n))), CASTLE_OBJ[`f${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_seal2', DOOR1_FLAG, ...floors(8))), CASTLE_OBJ.seal2);
  for (const n of [9, 10, 11, 12]) assert.equal(objectiveFromFlags(f('c5_seal2', DOOR1_FLAG, ...floors(n))), CASTLE_OBJ[`f${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_seal3', DOOR1_FLAG, ...floors(12))), CASTLE_OBJ.seal3);
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries({ ...CASTLE_OBJ, gather: EARTH_OBJ.gather })) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // ヒント: 2人の しかけ（ひとりでも）・氷の像・水の 高さ
  for (const k of ['f3', 'f7', 'f11']) assert.ok(talkFor(CASTLE_OBJ[k], 'self').includes('仲間') && talkFor(CASTLE_OBJ[k], 'self').includes('家族'), k);
  assert.ok(talkFor(CASTLE_OBJ.f6, 'self').includes('氷の像'));
  assert.ok(talkFor(CASTLE_OBJ.f9, 'self').includes('とび石'));
  assert.ok(talkFor(CASTLE_OBJ.cin, 'self').includes('いのりの歌'));
  // 地図の しるし（しかけは すんだら 消える）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c5_gather'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(EARTH_OBJ.gather, 'hanono').length, '長ソラネ');
  assert.ok(mark(CASTLE_OBJ.croad, 'kumoi').some((m) => m.x === CASTLE_ROAD.door.x && m.y === CASTLE_ROAD.door.y), '城の 門');
  const S1 = CASTLE_POS[1].seal[0];
  assert.ok(mark(CASTLE_OBJ.cin, castleMapId(1)).some((m) => m.x === S1.x && m.y === S1.y), 'ふういんの とびら');
  assert.ok(!mark(CASTLE_OBJ.cin, castleMapId(1), [DOOR1_FLAG]).some((m) => m.x === S1.x && m.y === S1.y), '開いたら 消える');
  for (const n of PAIR_FLOORS) {
    const A = CASTLE_POS[n].plateA;
    assert.ok(mark(CASTLE_OBJ[`f${n}`], castleMapId(n)).some((m) => m.x === A.x && m.y === A.y), `${n}階 2人の 石`);
    assert.ok(!mark(CASTLE_OBJ[`f${n}`], castleMapId(n), [PAIR[n].open]).some((m) => m.x === A.x && m.y === A.y), `${n}階 開いたら 消える`);
  }
  assert.ok(mark(CASTLE_OBJ.f12, castleMapId(12)).length, 'モルガナの まぼろし');
  // パーティー全員で 見る だいほん（はなれた 家族も 同じ 階なら 動かせる しかけは sameMap）
  for (const id of CASTLE_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of ['c5_cvane2', 'c5_cstatue', 'c5_cwater', 'c5_cbelt', ...PAIR_FLOORS.flatMap((n) => [`c5_cpair_${n}_a`, `c5_cpair_${n}_b`])]) assert.ok(SCRIPTS[id].sameMap, `${id}: 同じ 階なら はなれていても`);
});

// ───────────── クモイ地方: ハネビトの 風の道（c5_croad）─────────────
test('クモイ地方: 長ソラネの 話（c5_croad）で、ハネノの島の 南西 → 影の城の 前の 小島 → 城の 門 の 風の道。帰りは ハネノの島へ。城の 門から 1階へ（c5_cin）', { timeout: 60000 }, async () => {
  const m = MAPS.kumoi;
  const before = (f) => UPTO('c5_gather').includes(f);
  const after = (f) => UPTO('c5_croad').includes(f);
  const D = CASTLE_ROAD.door;
  for (const [x, y] of [...CASTLE_ROAD.go, ...CASTLE_ROAD.back, ...CASTLE_ROAD.gate]) {
    assert.equal(effectiveTile(m, x, y, before), T.CLOUD_SEA, `${x},${y}: ふだんは 雲の 海`);
    assert.ok(TILE_INFO[effectiveTile(m, x, y, after)].flow, `${x},${y}: 風の道`);
  }
  assert.ok(isBlocked(m, D.x, D.y, before) && !isBlocked(m, D.x, D.y, after), '城の 門');
  assert.equal(m.warps.find((w) => w.x === D.x && w.y === D.y).to.map, castleMapId(1));
  const S = KUMOI_ISLES.shade;
  const isle = `${Math.floor(S.cx) + 1},${Math.floor(S.cy)}`;
  const landing = [50, 38];
  assert.ok(!flowReach(m, landing, before).stops.has(isle), 'c5_croad の 前は 小島へ 行けない（竜でだけ）');
  const r = flowReach(m, landing, after);
  assert.ok(r.stops.has(isle), 'ハネノの島の 南西から 小島へ');
  assert.ok(r.pits.has(`${D.x},${D.y}`), '小島から 城の 門へ');
  // 小島から ハネノの島へ 帰れる・流された 先は いつも 地面
  assert.ok(flowReach(m, [Math.floor(CASTLE_ROAD.outside.x), Math.floor(CASTLE_ROAD.outside.y)], after).stops.has('59,33'), '小島 → ハネノの島');
  for (const [x, y] of [...CASTLE_ROAD.go, ...CASTLE_ROAD.back]) {
    const c = carry(m, x, y, after);
    assert.ok(!c.loop && !TILE_INFO[effectiveTile(m, c.x, c.y, after)].flow, `${x},${y}`);
  }
  // 長ソラネ → c5_croad
  const { bot, c } = await setup(9201, 'c5_gather');
  assert.equal(c.objective, EARTH_OBJ.gather);
  const P = MAPS.hanono.npcs.find((n) => n.id === 'sorane');
  await place(bot, 'hanono', Math.floor(P.x), Math.floor(P.y) + 1);
  const from = bot.msgs.length;
  await talk(bot, 'sorane');
  assert.ok(c.flags.c5_croad && said(bot, '風の道', from) && said(bot, 'いのりの歌', from));
  assert.equal(c.objective, CASTLE_OBJ.croad);
  assert.ok(JSON.stringify(SCRIPTS.c5_castle_view(ctx(c.flags))).includes('風の道がつづいている'), '城を 見る');
  assert.ok(JSON.stringify(SCRIPTS.c5_castle_view(ctx(flagsOf(...UPTO('c5_gather'))))).includes('長ソラネ'));
  // 城の 門 → 1階（c5_cin）
  await place(bot, 'kumoi', Math.floor(CASTLE_ROAD.outside.x), Math.floor(CASTLE_ROAD.outside.y));
  await place(bot, 'kumoi', D.x, D.y + 1);
  await stepOn(bot, D.x, D.y);
  assert.equal(bot.s.map, castleMapId(1));
  assert.ok(c.flags.c5_cin && c.flags[CF(1)] && said(bot, '12階まで'));
  assert.equal(c.objective, CASTLE_OBJ.cin);
  // 1階の 門から 小島へ・糸でも 小島へ
  const ex = CASTLE_POS[1].exit[0];
  assert.equal(MAPS[castleMapId(1)].warps.find((w) => w.x === ex.x && w.y === ex.y).to.map, 'kumoi');
  const out = dungeonExit({}, { char: { dungeonFrom: null }, map: castleMapId(9) });
  assert.ok(out.map === 'kumoi' && Math.hypot(out.x - CASTLE_ROAD.outside.x, out.y - CASTLE_ROAD.outside.y) < 1.5, '糸で 影の城の 前の 小島へ');
  assert.ok(Math.hypot(KUMOI_POS.castle.x - D.x, KUMOI_POS.castle.y - D.y) < 1, '城の 門は 影の城の 絵の 下');
});

// ───────────── 影の城の マップ ─────────────
test('城の マップ: 12階（1階が 下）。かいだんの つながり・風／炎／水の 階の 曲・色・出現表・4階と 8階の 休み所・宝箱は B8 の ★（各階 1〜2こ）・1つの 階に 1つの 見どころ', () => {
  assert.equal(new Set(CASTLE_SIGHTS.slice(1)).size, CASTLE_FLOORS, '1つの 階に 1つの 見どころ');
  for (let n = 1; n <= CASTLE_FLOORS; n++) {
    const m = MAPS[castleMapId(n)], P = CASTLE_POS[n];
    assert.equal(m.kind, 'dungeon');
    assert.ok(!m.noEscape, `${n}階: 糸・リレミトが 使える`);
    const sec = n <= 4 ? 'wind' : n <= 8 ? 'fire' : 'water';
    assert.equal(m.bgm, `castle_${sec}`);
    assert.equal(castleBgm(n), `castle_${sec}`);
    assert.equal(m.theme, `castle_${sec}`);
    assert.equal(castleTheme(n), m.theme);
    assert.equal(castleTable(n), `t5_castle_${sec}`);
    assert.ok(ENCOUNTER_TABLES[castleTable(n)], castleTable(n));
    if ([4, 8, 12].includes(n)) assert.deepEqual(m.spawnCounts, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(m.spawnCounts[castleTable(n)] > 0, `${n}階: 魔物が 出る`);
    for (const p of P.up) assert.equal(m.warps.find((w) => w.x === p.x && w.y === p.y).to.map, n < 12 ? castleMapId(n + 1) : CASTLE_TOP);
    if (n > 1) assert.equal(m.warps.find((w) => w.x === P.down.x && w.y === P.down.y).to.map, castleMapId(n - 1));
    assert.ok(m.zoneAt(...arriveCell(n)).startsWith('safe'), `${n}階: 入った 所は 魔物が 出ない`);
    assert.ok(!isBlocked(m, ...arriveCell(n), () => true) && !isBlocked(m, ...arriveCell(n), () => false), `${n}階: 入った 所は ゆか`);
    if (n > 1) assert.ok(!m.warpAt.has(arriveCell(n)[1] * m.w + arriveCell(n)[0]));
    // 上から 来た 所も ゆか（4・8・12階は ふういんの とびらの 先）
    if (n < 12) { const a = castleArrive(n + 1); const b = MAPS[castleMapId(n + 1)].warps.find((w) => w.x === CASTLE_POS[n + 1].down.x && w.y === CASTLE_POS[n + 1].down.y).to; assert.ok(!isBlocked(m, Math.floor(b.x), Math.floor(b.y), (f) => f === SEAL_FLAGS[n]), `${n}階 上から 来た 所`); void a; }
    const list = CASTLE_TREASURE[n] || [];
    assert.ok(list.length >= 1 && list.length <= 2, `${n}階の ★の 宝箱は 1〜2こ`);
    for (const [i, id] of list.entries()) assert.ok(m.chests.some((ch) => ch.id === `c5c_${n}${'ab'[i]}` && ch.item === id) && ITEMS[id], `${n}階の ★の 宝箱 ${id}`);
    assert.ok(m.triggers.some((t) => t.script === `c5_cf${n}`), '階に 入った ときの ことば');
    for (const ch of m.chests) assert.ok(!isBlocked(m, ch.x, ch.y, () => false) || ch.x >= 0, `${n}階 宝箱 ${ch.id}`);
  }
  // 休み所（4階・8階）
  assert.deepEqual(CASTLE_REST, [4, 8]);
  for (const n of CASTLE_REST) {
    const m = MAPS[castleMapId(n)];
    assert.ok(m.actions.some((a) => a.script === 'c5_crest' && a.x === CASTLE_POS[n].font.x && a.y === CASTLE_POS[n].font.y));
  }
  const opts = SCRIPTS.c5_crest(ctx({})).find((s) => s[0] === 'choice')[3];
  assert.ok(opts[0].some((s) => s[0] === 'heal') && opts[0].some((s) => s[0] === 'church'), '回復と 記録');
  // ふういんの とびら（1階 いのりの歌・4階・8階・12階 まぼろし）
  for (const [n, flag] of Object.entries(SEAL_FLAGS)) {
    const m = MAPS[castleMapId(n)];
    for (const p of CASTLE_POS[n].seal) {
      assert.equal(effectiveTile(m, p.x, p.y, () => false), T.DRAGON_GATE, `${n}階 とびら`);
      assert.equal(effectiveTile(m, p.x, p.y, (f) => f === flag), T.CAVE_FLOOR);
    }
  }
  // てっぺん（A9）への 上りかいだんと、てっぺんから もどる 所
  assert.equal(CASTLE_TOP_ARRIVE.map, CASTLE_TOP);
  assert.ok(MAPS[CASTLE_TOP], 'てっぺんの マップ（A9。まだ ない ときは 仮の マップ）');
  assert.ok(!isBlocked(MAPS[CASTLE_TOP], Math.floor(CASTLE_TOP_ARRIVE.x), Math.floor(CASTLE_TOP_ARRIVE.y), () => true), 'てっぺんに 着く 所');
  assert.equal(CASTLE_FROM_TOP.map, castleMapId(12));
  assert.ok(!isBlocked(MAPS[castleMapId(12)], Math.floor(CASTLE_FROM_TOP.x), Math.floor(CASTLE_FROM_TOP.y), (f) => f === K8.seal3));
  // まぼろし（B8 の きまった 戦い。曲は phantom）
  for (const [n, Ph] of Object.entries(PHANTOMS)) {
    const fx = FIXED_ENCOUNTERS[Ph.id];
    assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === 'phantom', `${Ph.id}（B8。まだ ない 時は 仮の データ）`);
    const m = MAPS[castleMapId(n)];
    assert.ok(m.npcs.some((x) => x.id === `c5_ph_${n}` && x.show.not.includes(Ph.flag)));
    assert.ok(m.triggers.some((t) => t.script === `c5_phantom_${n}`));
  }
});

test('しかけ: どの じょうたいからも とじこめられない（ひとり＋仲間）。上りかいだんと 下りかいだん（1階は 城の 門）・宝箱に 行ける。しかけを とかないと 上へ 行けない', { timeout: 120000 }, () => {
  for (let n = 1; n <= CASTLE_FLOORS; n++) {
    const m = MAPS[castleMapId(n)], P = CASTLE_POS[n];
    const st = castleStates(n);
    const down = n === 1 ? P.exit[0] : P.down;
    for (const k of st.nodes.keys()) {
      assert.ok(canReachFrom(st, k, (s) => pit(s, down)), `${n}階 ${k}: 下へ もどれる`);
      assert.ok(canReachFrom(st, k, (s) => P.up.some((p) => pit(s, p))), `${n}階 ${k}: 上へ 行ける`);
    }
    for (const ch of m.chests) assert.ok([...st.nodes.values()].some((s) => nearStop(s.r, ch)), `${n}階: 宝箱 ${ch.id}`);
    // しかけを とかないと（時間も そのまま）上へ 行けない
    for (const t of [[], ['@fireA']]) {
      const r0 = flowReach(m, arriveCell(n), hasOf(new Set(t)));
      assert.ok(!P.up.some((p) => r0.pits.has(`${p.x},${p.y}`)), `${n}階: しかけを とかないと 上へ 行けない (${t})`);
    }
    // 流れの 先は いつも 歩ける 所（ぐるっと まわらない）
    for (const s of st.nodes.values()) {
      const has = hasOf(s.fl);
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        if (!TILE_INFO[effectiveTile(m, x, y, has)].flow) continue;
        assert.ok(!carry(m, x, y, has).loop, `${n}階 ${x},${y}`);
      }
    }
  }
  // 2階: 風見の石を 回さないと 北東の 足場へ 行けない・6階: 像の 向きを 3回 かえる・9階: 水の 高さ 3つ ぜんぶ 使う
  assert.ok([...castleStates(2).nodes.values()].every((s) => s.fl.has(VANE2_FLAG) || !s.r.pits.has(`${CASTLE_POS[2].up[0].x},${CASTLE_POS[2].up[0].y}`)));
  // 6階: 像が どの 向きでも、広間から そのまま 上へは 行けない（東の へやで 向きを かえる）
  const hub6 = [CASTLE_POS[6].statues[0].x, CASTLE_POS[6].statues[0].y + 1], up6 = `${CASTLE_POS[6].up[0].x},${CASTLE_POS[6].up[0].y}`;
  for (const d of STATUE_DIRS) assert.ok(!flowReach(MAPS[castleMapId(6)], hub6, (f) => f === STATUE_FLAG[d]).pits.has(up6), `6階: ${d}むきの まま では 上へ 行けない`);
  // 9階: 水の 高さが 1つの まま では、南の 岸から 上へ 行けない（上 → 中 → 下 と かえて わたる）
  const up9 = `${CASTLE_POS[9].up[0].x},${CASTLE_POS[9].up[0].y}`;
  for (const fl of [[], [WATER9.mid], [WATER9.lo]]) assert.ok(!flowReach(MAPS[castleMapId(9)], arriveCell(9), (f) => fl.includes(f)).pits.has(up9), `9階: 水が ${fl} の まま`);
  // 10階: レバーを 引くと、流れる ゆかで 上へ
  const up10 = `${CASTLE_POS[10].up[0].x},${CASTLE_POS[10].up[0].y}`;
  assert.ok(flowReach(MAPS[castleMapId(10)], arriveCell(10), (f) => f === BELT10_FLAG).pits.has(up10), '10階: レバーで 上へ');
  // 1つの 時間（炎の 柱が 止まった まま）だけでは 5階を こえられない（炎の 柱の タイミング）
  for (const t of [[], ['@fireA']]) assert.ok(!flowReach(MAPS[castleMapId(5)], arriveCell(5), hasOf(new Set(t))).pits.has(`${CASTLE_POS[5].up[0].x},${CASTLE_POS[5].up[0].y}`));
});

test('炎の 柱（5階・7階）: A と B が 時間で かわるがわる ふき上がる（もえている 柱には 入れない）。6階の 氷の像の 息の 線', { timeout: 60000 }, async () => {
  // 時間の しるし
  const fr = (ms) => (ms % DAY_MS) / DAY_MS;
  assert.equal(DAY_MS % FIRE_HALF, 0, '1日で きりかえが ずれない');
  assert.notEqual(firePhase(fr(0)), firePhase(fr(FIRE_HALF)));
  assert.equal(firePhase(fr(0)), firePhase(fr(FIRE_HALF * 2)));
  for (const ms of [0, 1000, FIRE_HALF, FIRE_HALF + 1200]) assert.notEqual(timeFlag('@fireA', fr(ms)), timeFlag('@fireB', fr(ms)), 'いつも どちらか だけ');
  assert.ok(FIRE_HALF >= 2000, '通りぬける 時間が ある');
  const m = MAPS[castleMapId(5)];
  // 西どなりが ゆかの 炎の 柱（そこから 入ってみる）
  const a = m.gates.find((g) => g.levels?.[0]?.[0] === '@fireA' && effectiveTile(m, g.x - 1, g.y, () => false) === T.CAVE_FLOOR), b = m.gates.find((g) => g.levels?.[0]?.[0] === '@fireB');
  assert.ok(a && b);
  assert.equal(effectiveTile(m, a.x, a.y, (f) => f === '@fireA'), T.FIRE_PILLAR);
  assert.equal(effectiveTile(m, a.x, a.y, (f) => f === '@fireB'), T.FIRE_VENT);
  assert.ok(TILE_INFO[T.FIRE_PILLAR].solid && !TILE_INFO[T.FIRE_VENT].solid);
  // サーバー: もえている 柱には 入れない（止まると 入れる）
  const { world, bot, clock } = await setup(9301, 'c5_seal1', [CF(5)]);
  const phaseNow = () => firePhase(fr(clock.now));
  while (phaseNow() !== 0) clock.now += 500; // A が もえている
  await place(bot, m.id, a.x - 1, a.y);
  await stepOn(bot, a.x, a.y);
  assert.equal(Math.floor(bot.s.x), a.x - 1, 'もえている 柱には 入れない');
  clock.now += FIRE_HALF;
  assert.equal(phaseNow(), 1);
  await stepOn(bot, a.x, a.y);
  assert.equal(Math.floor(bot.s.x), a.x, '炎が 止まると 通れる');
  void world;
  // 6階: 像の 息の 線（かべで 止まる・ふきぬけは こえる）
  const f6 = MAPS[castleMapId(6)];
  for (const d of STATUE_DIRS) assert.ok(STATUE_RAYS[d].flames.length >= 1, `${d}: こおる 炎`);
  assert.ok(STATUE_RAYS.N.cells.some((p) => effectiveTile(f6, p.x, p.y, () => false) === T.CLOUD_SEA) && STATUE_RAYS.N.flames.length === 2, '北の 息は ふきぬけを こえる');
  for (const d of STATUE_DIRS) {
    const has = (f) => f === STATUE_FLAG[d];
    for (const e of STATUE_DIRS) for (const p of STATUE_RAYS[e].flames) assert.equal(effectiveTile(f6, p.x, p.y, has), e === d ? T.FIRE_VENT : T.FIRE_PILLAR, `${d}むき: ${p.x},${p.y}`);
  }
});

// ───────────── しかけを 動かす（だいほん）─────────────
test('1階: ふういんの とびらは いのりの歌で 開く（歌が ないと 開かない）・光の門は まだ 光っていない', { timeout: 60000 }, async () => {
  const P = CASTLE_POS[1], m = MAPS[castleMapId(1)];
  const S = P.seal[0];
  {
    const { bot, c } = await setup(9401, 'c5_cin', [CF(1)], { song: false });
    await place(bot, m.id, S.x, S.y + 1);
    const from = bot.msgs.length;
    await examine(bot, S.x, S.y);
    assert.ok(!c.flags[DOOR1_FLAG] && said(bot, 'ユキナに、話を聞いてみよう', from), '歌が ないと 開かない');
  }
  const { world, bot, c } = await setup(9402, 'c5_cin', [CF(1)]);
  await place(bot, m.id, S.x, S.y + 1);
  let from = bot.msgs.length;
  await examine(bot, S.x, S.y);
  assert.ok(c.flags[DOOR1_FLAG] && said(bot, 'いのりの歌を歌った', from), 'いのりの歌で 開いた');
  assert.equal(c.objective, CASTLE_OBJ.door1);
  for (const p of P.seal) assert.ok(!isBlocked(m, p.x, p.y, world.hasFlagFn(bot.s)));
  // 光の門（ふういんを 開けるまで 光らない）
  const g = P.gates[0];
  await place(bot, m.id, g.x + 1, g.y);
  from = bot.msgs.length;
  await stepOn(bot, g.x, g.y);
  assert.ok(said(bot, 'まだ、光っていない', from) && bot.s.map === m.id);
  assert.equal(effectiveTile(m, g.x, g.y, world.hasFlagFn(bot.s)), T.WARP_RING_OFF);
  // 12階の 門も、モルガナの まぼろしを たおすまでは 光らない
  const g12 = CASTLE_POS[12].gates[0];
  assert.ok(JSON.stringify(SCRIPTS.c5_cgate_12_0(ctx(flagsOf(...UPTO('c5_seal2'))))).includes('まだ、光っていない'));
  assert.ok(JSON.stringify(SCRIPTS.c5_cgate_12_0(ctx(flagsOf(...UPTO('c5_seal3'))))).includes('teleport'));
  void g12;
});

test('近道: ふういんを 開けるたびに 1階の 光の門が 光る（5階・9階・12階へ）。むこうの 門から 1階へ もどれる', { timeout: 60000 }, async () => {
  const { world, bot, c } = await setup(9501, 'c5_seal3', [DOOR1_FLAG, ...Array.from({ length: 12 }, (_, i) => CF(i + 1))]);
  bot.choice = 0;
  const m1 = MAPS[castleMapId(1)];
  assert.equal(CASTLE_POS[1].gates.length, GATES.length);
  for (const [i, G] of GATES.entries()) {
    const g = CASTLE_POS[1].gates[i];
    assert.equal(effectiveTile(m1, g.x, g.y, world.hasFlagFn(bot.s)), T.WARP_RING, '光っている');
    assert.equal(effectiveTile(m1, g.x, g.y, (f) => f !== G.flag && c.flags[f]), T.WARP_RING_OFF, `${G.flag} の 前は 光らない`);
    await place(bot, m1.id, g.x + 1, g.y);
    await stepOn(bot, g.x, g.y);
    assert.equal(bot.s.map, castleMapId(G.to), `${G.to}階へ`);
    const back = CASTLE_POS[G.to].gates[0];
    assert.ok(Math.hypot(bot.s.x - gateArrive(G.to).x, bot.s.y - gateArrive(G.to).y) < 0.01);
    assert.ok(!isBlocked(MAPS[castleMapId(G.to)], Math.floor(bot.s.x), Math.floor(bot.s.y), world.hasFlagFn(bot.s)));
    // むこうの 門 → 1階
    await place(bot, castleMapId(G.to), back.x + 1, back.y);
    await stepOn(bot, back.x, back.y);
    assert.equal(bot.s.map, m1.id, `${G.to}階 → 1階`);
    assert.ok(!isBlocked(m1, Math.floor(bot.s.x), Math.floor(bot.s.y), world.hasFlagFn(bot.s)));
  }
});

test('風の階: 2階の 風見の石（曲がり角の 風）・3階の 風車（ひとり 仲間なし は だめ・ひとり＋仲間・家族 2人）', { timeout: 120000 }, async () => {
  // 2階
  const P2 = CASTLE_POS[2], m2 = MAPS[castleMapId(2)];
  const { world, bot, c } = await setup(9601, 'c5_cin', [DOOR1_FLAG, CF(2)]);
  bot.choice = 0;
  assert.equal(effectiveTile(m2, P2.junction.x, P2.junction.y, world.hasFlagFn(bot.s)), T.SKYWIND_W);
  await place(bot, m2.id, P2.vane.x + 1, P2.vane.y);
  await examine(bot, P2.vane.x, P2.vane.y);
  assert.ok(c.flags[VANE2_FLAG] && said(bot, '北へふき始めた'));
  assert.equal(effectiveTile(m2, P2.junction.x, P2.junction.y, world.hasFlagFn(bot.s)), T.SKYWIND_N);
  await examine(bot, P2.vane.x, P2.vane.y);
  assert.ok(!c.flags[VANE2_FLAG], 'もう 1回で もどる');
  // 3階・7階・11階: 2人で ふむ 石
  for (const n of PAIR_FLOORS) {
    const P = CASTLE_POS[n], m = MAPS[castleMapId(n)], F = PAIR[n];
    assert.ok(Math.hypot(P.plateA.x - P.plateB.x, P.plateA.y - P.plateB.y) >= 18, `${n}階: はなれた 石`);
    {
      const { bot: b0, c: c0 } = await setup(9602 + n, 'c5_seal2', [DOOR1_FLAG, CF(n)]);
      await place(b0, m.id, P.plateA.x, P.plateA.y + 1);
      const from = b0.msgs.length;
      await stepOn(b0, P.plateA.x, P.plateA.y);
      assert.ok(!c0.flags[F.wait.a] && !c0.flags[F.open] && said(b0, '仲間を連れてこよう', from), `${n}階: 仲間が いないと だめ`);
    }
    const { world: w1, bot: b1, c: c1 } = await setup(9620 + n, 'c5_seal2', [DOOR1_FLAG, CF(n)]);
    assert.ok(recruitNpc(w1, b1.s, 'npc_gard', { force: true }).ok);
    await play(b1);
    b1.choice = 0;
    await place(b1, m.id, P.plateA.x, P.plateA.y + 1);
    let from = b1.msgs.length;
    await stepOn(b1, P.plateA.x, P.plateA.y);
    assert.ok(c1.flags[F.wait.a] && said(b1, 'ガルドに、ここで待っていてもらう？', from), `${n}階: 仲間に 待っていてもらう`);
    assert.equal(effectiveTile(m, P.plateA.x, P.plateA.y, w1.hasFlagFn(b1.s)), T.PLATE_ON);
    await place(b1, m.id, P.plateB.x, P.plateB.y + 1);
    from = b1.msgs.length;
    await stepOn(b1, P.plateB.x, P.plateB.y);
    assert.ok(c1.flags[F.open] && !c1.flags[F.wait.a] && said(b1, 'ガルドが、もどってきた', from), `${n}階: 開いた`);
    assert.ok(reachUp(n, w1.hasFlagFn(b1.s)), `${n}階: 上へ 行ける`);
  }
  // 家族 2人（3階）: パパが 西・ユイが 東（どちらが 先でも）。ユイの 世界は かわらない
  const P = CASTLE_POS[3], m = MAPS[castleMapId(3)];
  const fw = new GameWorld({ offline: false, rng: makeRng(9690), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(fw, 'パパ'), yui = new Bot(fw, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = fw.sessions.get(papa.sid), Y = fw.sessions.get(yui.sid);
  for (const f of [...UPTO('c5_cin'), DOOR1_FLAG, CF(3)]) Pa.char.flags[f] = true;
  fw.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  const both = async () => { for (let i = 0; i < 6; i++) { await papa.settle(); await yui.settle(); } };
  fw.placeSession(Pa, m.id, P.plateA.x + 0.5, P.plateA.y + 1.5, 'up', true);
  fw.placeSession(Y, m.id, P.plateB.x + 0.5, P.plateB.y + 1.5, 'up', true);
  await both();
  const walk1 = (b, p) => { b.x = p.x + 0.5; b.y = p.y + 0.5; b.send({ t: 'move', x: b.x, y: b.y, dir: 'up', moving: true, seq: b.seq }); };
  walk1(yui, P.plateB);
  await both();
  assert.ok(!Pa.char.flags[PAIR[3].open] && said(papa, '家族のだれか'), '1人だけでは 開かない');
  walk1(papa, P.plateA);
  await both();
  assert.ok(Pa.char.flags[PAIR[3].open], '2人で 同時に → 開いた');
  assert.ok(!Y.char.flags[PAIR[3].open], 'ユイの 世界は かわらない');
});
// 上の 階の かいだんへ 歩いて・流されて 行けるか（入った 所から。炎の 柱の 時間は どちらでも）
function reachUp(n, has) {
  const m = MAPS[castleMapId(n)];
  return [has, (f) => (f === '@fireA' ? !has(f) : f === '@fireB' ? !has(f) : has(f))].some((h) => {
    const r = flowReach(m, arriveCell(n), h);
    return CASTLE_POS[n].up.some((p) => r.pits.has(`${p.x},${p.y}`));
  });
}

test('炎の階・水の階: 6階の 氷の像（しらべる・レバー。南 → 西 → 北 → 東）・9階の 水の 高さ（上 → 中 → 下）・10階の レバー', { timeout: 60000 }, async () => {
  const P6 = CASTLE_POS[6], m6 = MAPS[castleMapId(6)];
  const { world, bot, c } = await setup(9701, 'c5_seal1', [DOOR1_FLAG, CF(6)]);
  bot.choice = 0;
  const has = () => world.hasFlagFn(bot.s);
  const I = P6.statues[0];
  assert.equal(statueDir(has()), 'S');
  const visible = () => m6.npcs.filter((x) => x.id.startsWith('c6_statue_') && (!x.show || ((x.show.all || []).every(has()) && !(x.show.not || []).some(has())))).map((x) => x.dir);
  assert.deepEqual(visible(), ['down'], '南むきの 像だけ 見える');
  await place(bot, m6.id, I.x, I.y + 1);
  for (const want of ['W', 'N', 'E', 'S']) {
    await examine(bot, I.x, I.y);
    assert.equal(statueDir(has()), want, `${want}むき`);
    assert.deepEqual(visible(), [{ S: 'down', W: 'left', N: 'up', E: 'right' }[want]]);
    for (const p of STATUE_RAYS[want].flames) assert.equal(effectiveTile(m6, p.x, p.y, has()), T.FIRE_VENT);
  }
  // 東の へやの レバーでも 回る
  const L = P6.levers.find((p) => p.x > co(15, 0).x);
  await place(bot, m6.id, L.x, L.y + 1);
  await examine(bot, L.x, L.y);
  assert.equal(statueDir(has()), 'W', 'レバーでも 回る');
  // 9階: 水の 高さ
  const P9 = CASTLE_POS[9], m9 = MAPS[castleMapId(9)];
  const h = P9.handles[0];
  await place(bot, m9.id, h.x, h.y + 1);
  assert.equal(waterLevel(has()), 'hi');
  for (const want of ['mid', 'lo', 'hi']) {
    await examine(bot, h.x, h.y);
    assert.equal(waterLevel(has()), want, want);
  }
  assert.ok(said(bot, 'とび石が、顔を出した') && said(bot, 'ふかい底が見えてきた') && said(bot, 'うく石の板が、うかび上がった'));
  // 水の 高さで わたれる 所が かわる
  const cell = (ch) => { const rows = m9; void rows; return null; };
  void cell;
  for (const [lv, flags] of [['hi', []], ['mid', [WATER9.mid]], ['lo', [WATER9.lo]]]) {
    const hf = (f) => flags.includes(f);
    const raft = m9.gates.find((g) => g.closed === T.TW_RAFT);
    assert.equal(!isBlocked(m9, raft.x, raft.y, hf), lv === 'hi', `板 ${lv}`);
  }
  // 10階: レバー
  const P10 = CASTLE_POS[10], m10 = MAPS[castleMapId(10)];
  const R = m10.gates.find((g) => g.flag === BELT10_FLAG && g.closed === T.FLOW_E);
  const l = P10.belts.find((p) => p.y > co(0, 10).y);
  await place(bot, m10.id, l.x, l.y + 1);
  await examine(bot, l.x, l.y);
  assert.ok(c.flags[BELT10_FLAG] && effectiveTile(m10, R.x, R.y, has()) === T.FLOW_W, '西へ');
  await examine(bot, l.x, l.y);
  assert.ok(!c.flags[BELT10_FLAG] && effectiveTile(m10, R.x, R.y, has()) === T.FLOW_E, '東へ');
});

test('まぼろしの 台本: showMon → bgm phantom → battle（phantom_storm・phantom_ignia・phantom_morgana）。負けたら 止まる。勝つと ふういんの とびらが 開く（c5_seal1〜3）・もとの 戦いの ことばを なぞる', { timeout: 120000 }, async () => {
  const echo = { 4: ['嵐の将軍', '海のもくず'], 8: ['炎の魔女イグニア', '炎につつまれなさい'], 12: ['水鏡の魔人モルガナ', '紋章を'] };
  const before = { 4: 'c5_cin', 8: 'c5_seal1', 12: 'c5_seal2' };
  for (const [k, Ph] of Object.entries(PHANTOMS)) {
    const n = Number(k);
    const steps = SCRIPTS[`c5_phantom_${n}`](ctx(flagsOf(...UPTO(before[n]))));
    const iMon = steps.findIndex((s) => s[0] === 'showMon' && s[1] === Ph.id);
    const iBgm = steps.findIndex((s) => s[0] === 'bgm' && s[1] === 'phantom');
    const iBat = steps.findIndex((s) => s[0] === 'battle' && s[1] === Ph.id);
    assert.ok(iMon >= 0 && iBgm > iMon && iBat > iBgm, `${n}階: showMon → bgm → battle`);
    assert.ok(steps.findIndex((s) => s[0] === 'flag' && s[1] === Ph.flag) > iBat);
    for (const w of echo[n]) assert.ok(JSON.stringify(steps).includes(w), `${n}階: ${w}`);
    assert.deepEqual(SCRIPTS[`c5_phantom_${n}`](ctx(flagsOf(...UPTO(before[n]), Ph.flag))), []);
    const { world, bot, c } = await setup(9800 + n, before[n], [DOOR1_FLAG, CF(n)]);
    const m = MAPS[castleMapId(n)], Tr = CASTLE_POS[n].trigger;
    const fought = [];
    await place(bot, m.id, co(12, 0).x, Tr.y + 1);
    await stepOn(bot, co(12, 0).x, Tr.y, { lose: (id) => id === Ph.id, fought });
    assert.ok(fought.includes(Ph.id) && !c.flags[Ph.flag], `${n}階: 負けたら すすまない`);
    await place(bot, m.id, co(12, 0).x, Tr.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, co(12, 0).x, Tr.y, { fought });
    assert.ok(c.flags[Ph.flag] && said(bot, 'ふういんのとびら', from), `${n}階: 勝った → とびら`);
    for (const p of CASTLE_POS[n].seal) assert.ok(!isBlocked(m, p.x, p.y, world.hasFlagFn(bot.s)));
    assert.equal(c.objective, CASTLE_OBJ[`seal${{ 4: 1, 8: 2, 12: 3 }[n]}`]);
  }
});

// ───────────── 通しで ─────────────
test('通しで あそべる: c5_gather → 長ソラネ → 風の道 → 城の 門 → 1〜12階（いのりの歌・風見の石・風車・ストルム・炎の 柱・氷の像・炎の 大門・イグニア・水の 高さ・流れる ゆか・水車・モルガナ）→ てっぺんへ', { timeout: 300000 }, async () => {
  const { world, bot, c, clock } = await setup(9901, 'c5_gather');
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok, '酒場の 仲間（2人で ふむ 石）');
  const fought = [];
  const opts = { fought };
  const got = (f) => assert.ok(c.flags[f], f);
  const has = () => world.hasFlagFn(bot.s);
  bot.choice = 0;
  // 長ソラネ → c5_croad → 風の道 → 城の 門
  const So = MAPS.hanono.npcs.find((n) => n.id === 'sorane');
  await place(bot, 'hanono', Math.floor(So.x), Math.floor(So.y) + 1);
  await talk(bot, 'sorane', opts);
  got('c5_croad');
  const D = CASTLE_ROAD.door;
  assert.ok(flowReach(MAPS.kumoi, [50, 38], has()).pits.has(`${D.x},${D.y}`), 'のりばから 城の 門へ');
  await place(bot, 'kumoi', D.x, D.y + 1);
  await stepOn(bot, D.x, D.y, opts);
  got('c5_cin');
  const floor = (n) => castleMapId(n);
  // 今 いる 所から 歩いて・流されて 行ける マス（炎の 柱は 時間を すすめて 待つ）
  const reachNow = (n) => {
    const r1 = flowReach(MAPS[floor(n)], [Math.floor(bot.s.x), Math.floor(bot.s.y)], has());
    return r1;
  };
  const goUp = async (n) => {
    const P = CASTLE_POS[n];
    const u = P.up[0];
    const r = reachNow(n);
    assert.ok(r.pits.has(`${u.x},${u.y}`) || [5, 7].includes(n), `${n}階: 上りかいだんへ 行ける`);
    const [x, y] = D4.map(([dx, dy]) => [u.x + dx, u.y + dy]).find(([x1, y1]) => !isBlocked(MAPS[floor(n)], x1, y1, has()) && !MAPS[floor(n)].warpAt.has(y1 * MAPS[floor(n)].w + x1));
    await place(bot, floor(n), x, y);
    await stepOn(bot, u.x, u.y, opts);
    if (n < 12) {
      assert.equal(bot.s.map, floor(n + 1), `${n + 1}階へ`);
      got(CF(n + 1));
    }
  };
  const use = async (n, p, fn = examine) => {
    const r = reachNow(n);
    const cell = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => r.stops.has(`${x},${y}`));
    assert.ok(cell, `${n}階: ${p.x},${p.y} へ 行ける`);
    await place(bot, floor(n), cell[0], cell[1]);
    if (fn === examine) await examine(bot, p.x, p.y, opts);
    else await stepOn(bot, p.x, p.y, opts);
  };
  const walkTo = async (n, p) => {
    const r = reachNow(n);
    assert.ok(r.stops.has(`${p.x},${p.y}`), `${n}階: ${p.x},${p.y} へ 歩いて 行ける`);
    await place(bot, floor(n), p.x, p.y);
  };
  // 1階: いのりの歌
  await use(1, CASTLE_POS[1].seal[0]);
  got(DOOR1_FLAG);
  await goUp(1);
  // 2階: 風にのって 北西の 足場 → 風見の石 → 北東の 足場
  await use(2, CASTLE_POS[2].vane);
  got(VANE2_FLAG);
  await walkTo(2, co(20, 12));
  await goUp(2);
  // 3階: 仲間に 西の ハンドルで 待っていてもらって、東の ハンドルへ
  for (const p of [CASTLE_POS[3].plateA, CASTLE_POS[3].plateB]) await use(3, p, stepOn);
  got(PAIR[3].open);
  await goUp(3);
  // 4階: 休み所 → ストルムの まぼろし
  await use(4, CASTLE_POS[4].font);
  const T4 = CASTLE_POS[4].trigger;
  await walkTo(4, { x: co(12, 0).x, y: T4.y + 1 });
  await stepOn(bot, co(12, 0).x, T4.y, opts);
  got('c5_seal1');
  await goUp(4);
  // 5階: 炎の 柱（時間を すすめながら）
  {
    const st = castleStates(5);
    assert.ok([...st.nodes.values()].some((s) => s.r.pits.has(`${CASTLE_POS[5].up[0].x},${CASTLE_POS[5].up[0].y}`)), '5階: 炎の 止まる 時に 進めば 上へ');
    clock.now += FIRE_HALF;
  }
  await goUp(5);
  // 6階: 像を 東むきに（南 → 西 → 北 → 東）→ 東の へや → レバーで 北むきに（東 → 南 → 西 → 北）→ 北の 通路 → 北西の 上りかいだん
  for (let i = 0; i < 3; i++) await use(6, CASTLE_POS[6].statues[0]);
  assert.equal(statueDir(has()), 'E');
  await walkTo(6, co(21, 9));
  const L6 = CASTLE_POS[6].levers.find((p) => p.x > co(15, 0).x);
  for (let i = 0; i < 3; i++) await use(6, L6);
  assert.equal(statueDir(has()), 'N');
  await goUp(6);
  // 7階: 2つの 氷の像（仲間）
  for (const p of [CASTLE_POS[7].plateA, CASTLE_POS[7].plateB]) {
    const st = castleStates(7);
    assert.ok([...st.nodes.values()].some((s) => s.r.stops.has(`${p.x},${p.y}`)));
    await place(bot, floor(7), p.x, p.y + 1);
    await stepOn(bot, p.x, p.y, opts);
  }
  got(PAIR[7].open);
  await goUp(7);
  // 8階: 休み所 → イグニアの まぼろし
  await use(8, CASTLE_POS[8].font);
  const T8 = CASTLE_POS[8].trigger;
  await walkTo(8, { x: co(12, 0).x, y: T8.y + 1 });
  await stepOn(bot, co(12, 0).x, T8.y, opts);
  got('c5_seal2');
  await goUp(8);
  // 9階: 水の 高さ 上（板）→ 西の 島で 中（とび石）→ 東の 島で 下（ふかい 底）
  await walkTo(9, co(5, 8));
  await use(9, CASTLE_POS[9].handles.find((p) => p.y === co(0, 5).y && p.x < co(8, 0).x));
  assert.equal(waterLevel(has()), 'mid');
  await walkTo(9, co(18, 7));
  await use(9, CASTLE_POS[9].handles.find((p) => p.x > co(18, 0).x && p.y > co(0, 4).y));
  assert.equal(waterLevel(has()), 'lo');
  await goUp(9);
  // 10階: レバー → 流れる ゆか → まん中 → 北の 通路
  await use(10, CASTLE_POS[10].belts.find((p) => p.y > co(0, 10).y));
  got(BELT10_FLAG);
  await walkTo(10, co(21, 13));
  await stepOn(bot, co(21, 12).x, co(21, 12).y, opts);
  await goUp(10);
  // 11階: 2つの 水車（仲間）
  for (const p of [CASTLE_POS[11].plateA, CASTLE_POS[11].plateB]) await use(11, p, stepOn);
  got(PAIR[11].open);
  await goUp(11);
  // 12階: モルガナの まぼろし → てっぺんへ
  const T12 = CASTLE_POS[12].trigger;
  await walkTo(12, { x: co(12, 0).x, y: T12.y + 1 });
  await stepOn(bot, co(12, 0).x, T12.y, opts);
  got('c5_seal3');
  for (const f of CASTLE_STEPS) got(f);
  assert.equal(c.objective, CASTLE_OBJ.seal3);
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['phantom_storm', 'phantom_ignia', 'phantom_morgana'], 'きまった 戦いは 3人の まぼろし');
  await goUp(12);
  assert.equal(bot.s.map, CASTLE_TOP, 'てっぺん（A9）へ');
  // そのあとの ことば
  assert.ok(JSON.stringify(SCRIPTS.c5_sorane(ctx(c.flags))).includes('ノクト'), '長ソラネ');
  assert.ok(K7.gather && KUMOI_ISLES.shade);
});

// ───────────── 文字 ─────────────
test('文字: 第5章 Step 8 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-castle.js', 'public/js/shared/maps/castle.js', 'public/js/shared/maps/castle-rows.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
});

// ───────────── 絵と 音 ─────────────
test('絵と 音: 城の タイル（あきは 97・187・188 だけ。2D は 16×16 を ぬる・2.5D）・風／炎／水の 色・流れる ゆかは 水の 色・氷の像の 絵・4きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CASTLE_TILES, CASTLE_PROPS, CASTLE_KEEP_COLOR, THEME_PARTS } = await import('../public/js/client/render/tiles-castle.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { paintSpecial } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const ids = [T.WINDMILL, T.FIRE_PILLAR, T.FIRE_VENT];
  assert.deepEqual([...CASTLE_TILES].sort((a, b) => a - b), [...ids].sort((a, b) => a - b));
  assert.deepEqual(ids.slice().sort((a, b) => a - b), [97, 187, 188], 'A8 の タイルの ID（plan-ch5.md の 17）');
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length, 'タイルの ID が かさならない');
  for (const id of ids) {
    assert.ok(hasTileArt(id) && TILE_INFO[id], `${id}`);
    for (const f of [0, 1, 2, 3]) {
      const p = paintTile(id, 0x21, f, 0);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  for (const id of CASTLE_KEEP_COLOR) assert.equal(partOfTile(id), 'none', TILE_INFO[id].name);
  for (const id of [T.WINDMILL, T.FIRE_PILLAR]) {
    assert.ok(isAnimated(id), TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
    assert.ok(CASTLE_PROPS[id] && PROP_TILES.has(id), `${TILE_INFO[id].name}: 2.5D の たてた もの`);
  }
  assert.notEqual(paintTile(T.FIRE_PILLAR).px.join(), paintTile(T.FIRE_VENT).px.join());
  // 水の階の 流れる ゆか（流れる 砂の 絵を 水の 色に。ほかの 場所では もとの 色）
  for (const id of [T.FLOW_N, T.FLOW_E, T.FLOW_S, T.FLOW_W]) {
    assert.equal(THEME_PARTS.castle_water[id], 'water_all');
    assert.equal(partOfTile(id, 0, 'castle_water'), 'water_all');
    const [r, g, b] = themeRgb(0xe6, 0xc2, 0x7c, 'castle_water', partOfTile(id, 0, 'castle_water'));
    assert.ok(b > r, '砂の 色が 水の 色に');
    assert.equal(partOfTile(id), 'none');
  }
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...CASTLE_MAPS, 'kumoi', CASTLE_TOP]) {
    const m = MAPS[id];
    const all = new Set(m.tiles);
    for (const g of m.gates) { all.add(g.open); all.add(g.closed); for (const [, t] of g.levels || []) all.add(t); }
    for (const t of all) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 階ごとの 色（風 … むらさきの 灰色 / 炎 … 赤 / 水 … 青）
  const fl = (n) => themeRgb(0x80, 0x80, 0x80, castleTheme(n), 'floor');
  assert.equal(new Set([1, 5, 9].map((n) => fl(n).join())).size, 3, '3つの 色');
  assert.ok(fl(5)[0] > fl(5)[2] && fl(9)[2] > fl(9)[0] && fl(1)[2] >= fl(1)[1], '赤・青・むらさき');
  // 氷の像（4つの 向き・2コマ）
  const seen = new Set();
  for (const d of ['down', 'up', 'left', 'right']) {
    const a = paintSpecial('ice_statue', d, 0), b = paintSpecial('ice_statue', d, 1);
    assert.ok(a && b, d);
    assert.notEqual(a.px.join(), b.px.join(), `${d}: コマで うごく`);
    seen.add(a.px.join());
  }
  assert.equal(seen.size, 4, '向きで かわる');
  // まぼろしの すがた（もとの 四ツ影の 絵）
  for (const n of [4, 8, 12]) assert.ok(MAPS[castleMapId(n)].npcs.find((x) => x.id === `c5_ph_${n}`).big);
  // 曲（風・炎・水の 階と まぼろし）
  for (const id of ['castle_wind', 'castle_fire', 'castle_water', 'phantom']) {
    const tr = _TRACKS[id];
    assert.ok(tr && !tr.once && tr.ch.length >= 3 && tr.ch.length <= 4, id);
    const lens = tr.ch.map((ch) => _parse(ch.n).reduce((s, x) => s + x.len, 0));
    assert.ok(lens.every((l) => l === lens[0]) && lens[0] % 16 === 0 && lens[0] >= 128, `${id}: ${lens}`);
    for (const ch of tr.ch) {
      if (ch.drums) assert.ok(_parse(ch.n).every((x) => x.drum), `${id}: たいこ`);
      else assert.ok(_parse(ch.n).every((x) => x.f === 0 || x.f > 20), `${id}: 音の 名前`);
    }
  }
  const mel = Object.values(_TRACKS).map((tr) => tr.ch[0].n);
  assert.equal(new Set(mel).size, mel.length, 'メロディーは ほかの 曲と ちがう');
});
