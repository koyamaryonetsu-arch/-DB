// 第5章「空にうかぶ大地」Step 6・7（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// 本物の ノクト（c5_nocto）→ 長ソラネ（c5_root）→ 風見の石4・根の島 → 大地の 神殿 8階（c5_etemple。根の道・土の守り手・2つに 分かれる 道・
// 休み所と 近道・ピピ〈c5_pipi_save〉・ゴーレムの 足場・大地の こどう）→ ノクト 1回目（c5_nocto1）→ 影の城（c5_castle）→ みんなが 集まる（c5_gather）
// 根の島と 神殿の 魔物・nocto_1 の 戦いの しくみ・品は B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import { flowReach, carry } from '../public/js/shared/maps/flow.js';
import { KUMOI_VANES, KUMOI_ROADS, KUMOI_WINDS, KUMOI_POS, KUMOI_ISLES, HANONO_POS, CASTLE_CUT } from '../public/js/shared/maps/kumoi.js';
import {
  K7, EF, JAR, GOLEM_LOST, PIT_FLAG, LIFT_FLAG, DROP_FLAG, SWITCH_WAIT, DOOR4_FLAG, LETTER_FLAG, GATHER, GATHER_FLAG, GATHER_POS,
  EARTH_FLOORS, EARTH_MAPS, EARTH_POS, EARTH_GOLEMS, EARTH_OUT, EARTH_REST, EARTH_BOSS, EARTH_SIGHTS, TREMOR_FLOOR, TREMOR_SAFE, LIFT_OUT,
  golemState, golemCellKind, earthMapId, earthArrive, earthTable, earthTheme,
} from '../public/js/shared/maps/earth.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH5_STEPS, OLD_C5_OBJ, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch5.js';
import { HOSHIYOMI_OBJ } from '../public/js/shared/data/story-hoshiyomi.js';
import { EARTH_STEPS, EARTH_OBJ, EARTH_STORY_SCRIPTS } from '../public/js/shared/data/story-earth.js';
// 仮の 品（B の data/items-earth.js が 入ったら、ここも './items-earth.js' に かえる）
import { HANONO9_SHOP_WEAPONS, HANONO9_SHOP_ARMOR, HANONO9_SHOP_TOOLS, EARTH_TREASURE, GATHER_GIFTS } from '../public/js/shared/data/items-earth.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { skyBox } from '../public/js/shared/data/sky.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { rockDamage } from '../public/js/shared/world/tremor.js';
import { gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const at = (frac) => 50 * DAY_MS + Math.round(frac * DAY_MS);
const hour = (h) => (h - 6) / 24;
const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const flagsOf = (...l) => Object.fromEntries(l.map((k) => [k, true]));
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const toast = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'toast' && m.text.includes(text));
const ctx = (flags, extra = {}) => ({ c: { name: 'ソラ' }, name: 'ソラ', night: false, flag: (f) => !!flags[f], has: () => false, count: () => 0, ...extra });
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

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
  for (const k of ['wind_flute', 'star_lamp']) if (!c.keyItems.includes(k)) c.keyItems.push(k);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 50);
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
  const has = typeof flags === 'function' ? flags : (f) => flags.includes(f);
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
  return Object.assign((x, y) => seen.has(y * m.w + x), { seen, w: m.w });
}
const near = (r, p) => D4.some(([dx, dy]) => r(p.x + dx, p.y + dy));
const fromCell = (r, p) => D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => r(x, y));
const arriveCell = (n) => { const a = earthArrive(n); return [Math.floor(a.x), Math.floor(a.y)]; };

// 大地の 神殿の しかけを ぜんぶ ためす（ひとりで あそぶ とき。仲間が 1人 いる）。
// じょうたい … 水がめの フラグ・ゴーレムの 場所（落ちた・やくめを はたした）・4階の 仲間の 待つ ふむ石と とびら・5階の ピピ
// うごき … 水がめ・守り手の 石板・もとに もどす 石板・ふむ石（仲間に 待っていてもらう → もう 片方を ふむ）・ピピを 助ける
// （だいほんと おなじ きまり: maps/earth.js の golemState・golemCellKind）
function earthStates(n, extra = []) {
  const m = MAPS[earthMapId(n)], P = EARTH_POS[n], G = EARTH_GOLEMS[n];
  const key = (cell, fl) => `${cell}|${[...fl].sort().join(',')}`;
  const nodes = new Map(), edges = new Map();
  const q = [[arriveCell(n), new Set(extra)]];
  while (q.length) {
    const [cell, fl] = q.shift();
    const k0 = key(cell, fl);
    if (nodes.has(k0)) continue;
    const has = (f) => fl.has(f);
    const r = reach(m.id, cell, has);
    nodes.set(k0, { cell, fl, r });
    const out = [];
    const go = (p, nf) => {
      const c = fromCell(r, p);
      // しかけを うごかしても、立っている マスが ふさがる ことは ない（水がめ・石板の となりは いつも ゆか）
      assert.ok(!isBlocked(m, c[0], c[1], (f) => nf.has(f)), `${n}階: ${p.x},${p.y} の となり`);
      out.push(key(c, nf));
      q.push([c, nf]);
    };
    // 同じ 水がめが いくつも ある 階は、どの 水がめから でも（立っている 場所が ちがう）
    for (const J of Object.values(P.jars)) for (const p of J.cells.filter((c) => near(r, c))) {
      const nf = new Set(fl);
      if (nf.has(J.flag)) nf.delete(J.flag); else nf.add(J.flag);
      if (G) {
        const st = golemState(n, has);
        if (!st.gone && st.i > 0) {
          const kind = golemCellKind(n, st.i, (f) => nf.has(f));
          if (kind === 'drop' || kind === 'gap') { nf.delete(G.flags[st.i]); nf.add(kind === 'drop' ? DROP_FLAG : GOLEM_LOST(n)); }
        }
      }
      go(p, nf);
    }
    if (G && near(r, P.slab)) {
      const st = golemState(n, has);
      const nx = st.i + 1;
      const kind = golemCellKind(n, nx, has);
      if (!st.done && !st.lost && kind !== 'wall') {
        const nf = new Set(fl);
        if (st.i) nf.delete(G.flags[st.i]);
        if (kind === 'floor' || kind === 'plate') nf.add(G.flags[nx]);
        if (kind === 'plate') nf.add(LIFT_FLAG);
        if (kind === 'pit') nf.add(PIT_FLAG);
        if (kind === 'drop') nf.add(DROP_FLAG);
        if (kind === 'gap') nf.add(GOLEM_LOST(n));
        go(P.slab, nf);
      }
    }
    if (G && P.undo && near(r, P.undo)) {
      const st = golemState(n, has);
      if (!st.done && (st.lost || st.i)) {
        const nf = new Set(fl);
        for (const f of G.flags) if (f) nf.delete(f);
        nf.delete(GOLEM_LOST(n));
        go(P.undo, nf);
      }
    }
    if (n === 4 && !fl.has(DOOR4_FLAG)) {
      for (const [side, p, other] of [['a', P.switchA, 'b'], ['b', P.switchB, 'a']]) {
        if (!r(p.x, p.y)) continue;
        const nf = new Set(fl);
        if (fl.has(SWITCH_WAIT[other])) { nf.delete(SWITCH_WAIT.a); nf.delete(SWITCH_WAIT.b); nf.add(DOOR4_FLAG); } else if (!fl.has(SWITCH_WAIT[side])) nf.add(SWITCH_WAIT[side]); else continue;
        out.push(key([p.x, p.y], nf));
        q.push([[p.x, p.y], nf]);
      }
    }
    if (n === EARTH_REST && !fl.has(K7.pipi) && near(r, P.pipi)) {
      const nf = new Set(fl);
      nf.add(K7.pipi);
      go(P.pipi, nf);
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
const kumoiStops = (fl, start) => flowReach(MAPS.kumoi, start, (f) => fl.includes(f)).stops;

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c5_nocto → c5_root … c5_gather（名前の 約束）。目標・仲間会話・地図の しるし・Step 5 の さいごの 文の なおし', () => {
  assert.deepEqual(EARTH_STEPS, ['c5_root', 'c5_etemple', 'c5_pipi_save', 'c5_nocto1', 'c5_castle', 'c5_gather'], '名前の 約束（plan-ch5.md の 16）');
  const si = CH5_STEPS.indexOf('c5_nocto');
  assert.deepEqual(CH5_STEPS.slice(si + 1), EARTH_STEPS, 'c5_nocto の うしろに つづく');
  assert.deepEqual(STORY_STEPS.slice(STORY_STEPS.indexOf('c5_nocto') + 1, STORY_STEPS.indexOf('c5_nocto') + 7), EARTH_STEPS);
  assert.deepEqual(EARTH_MAPS, ['earth_1f', 'earth_2f', 'earth_3f', 'earth_4f', 'earth_5f', 'earth_6f', 'earth_7f', 'earth_8f'], 'マップの ID の 約束');
  assert.ok(KUMOI_ISLES.root && KUMOI_ROADS.w9 && KUMOI_VANES.v4 === 'c5_kroad_w9', '根の島・風の道 w9・風見の石4 c5_kroad_w9');
  // Step 5 の さいごの 文は ハネノの 長ソラネへの 文に なおる
  const old = { flags: flagsOf(...UPTO('c5_nocto')), objective: OLD_C5_OBJ.nocto };
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C5_OBJ.nocto));
  assert.ok(repairObjective(old));
  assert.equal(old.objective, HOSHIYOMI_OBJ.nocto);
  // フラグごとの 目標
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  assert.equal(objectiveFromFlags(f('c5_root')), EARTH_OBJ.root);
  assert.equal(objectiveFromFlags(f('c5_etemple', EF(1))), EARTH_OBJ.etemple);
  for (const n of [2, 3, 4, 5]) assert.equal(objectiveFromFlags(f('c5_etemple', ...[1, 2, 3, 4, 5].filter((k) => k <= n).map(EF))), EARTH_OBJ[`e${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_pipi_save', EF(5))), EARTH_OBJ.pipi);
  for (const n of [6, 7, 8]) assert.equal(objectiveFromFlags(f('c5_pipi_save', ...[1, 2, 3, 4, 5, 6, 7, 8].filter((k) => k <= n).map(EF))), EARTH_OBJ[`e${n}`], `${n}階`);
  assert.equal(objectiveFromFlags(f('c5_nocto1', EF(8))), EARTH_OBJ.nocto1);
  assert.equal(objectiveFromFlags(f('c5_castle')), EARTH_OBJ.castle);
  assert.equal(objectiveFromFlags(f('c5_gather')), EARTH_OBJ.gather);
  assert.equal(EARTH_OBJ.gather, '第5章の続きはアップデートで！（影の城の入口で、風がまっている…）', 'Step 7 の さいご');
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries({ ...EARTH_OBJ, nocto: HOSHIYOMI_OBJ.nocto })) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // ヒント: 水がめ・守り手・ふむ石（ひとりでも）・こどう
  assert.ok(talkFor(EARTH_OBJ.etemple, 'self').includes('水がめ'));
  assert.ok(talkFor(EARTH_OBJ.e3, 'self').includes('もとにもどす石板'));
  assert.ok(talkFor(EARTH_OBJ.e4, 'self').includes('仲間') && talkFor(EARTH_OBJ.e4, 'self').includes('家族'));
  assert.ok(talkFor(EARTH_OBJ.e7, 'self').includes('立ち止まる'));
  // 地図の しるし（しかけは すんだら 消える）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...UPTO('c5_nocto'), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(HOSHIYOMI_OBJ.nocto, 'hanono').some((m) => m.x === HANONO_POS.sorane.x), '長ソラネ');
  const V4 = KUMOI_POS.vane4;
  assert.ok(mark(EARTH_OBJ.root, 'kumoi').some((m) => m.x === V4.x && m.y === V4.y), '風見の石4');
  assert.ok(!mark(EARTH_OBJ.root, 'kumoi', [KUMOI_VANES.v4]).some((m) => m.x === V4.x && m.y === V4.y), '回したら 消える');
  assert.ok(mark(EARTH_OBJ.root, 'kumoi').some((m) => m.x === EARTH_OUT.door.x && m.y === EARTH_OUT.door.y), '神殿の 入口');
  const S3 = EARTH_POS[3].slab;
  assert.ok(mark(EARTH_OBJ.e3, earthMapId(3)).some((m) => m.x === S3.x && m.y === S3.y), '石板');
  assert.ok(!mark(EARTH_OBJ.e3, earthMapId(3), [PIT_FLAG]).some((m) => m.x === S3.x && m.y === S3.y), 'あなを うめたら 消える');
  const A4 = EARTH_POS[4].switchA;
  assert.ok(mark(EARTH_OBJ.e4, earthMapId(4)).some((m) => m.x === A4.x && m.y === A4.y), 'ふむ石');
  assert.ok(!mark(EARTH_OBJ.e4, earthMapId(4), [DOOR4_FLAG]).some((m) => m.x === A4.x && m.y === A4.y), 'とびらが 開いたら 消える');
  assert.ok(mark(EARTH_OBJ.e5, earthMapId(5), ['c5_root']).length, 'ピピ・いずみ');
  assert.ok(mark(EARTH_OBJ.e8, earthMapId(8)).length, 'ノクト');
  assert.equal(mark(EARTH_OBJ.castle, 'hanono').length, GATHER.length, '集まった 7人');
  assert.equal(mark(EARTH_OBJ.castle, 'hanono', [GATHER_FLAG('nefi')]).length, GATHER.length - 1, '話したら 消える');
  // パーティー全員で 見る だいほん（はなれた 家族も 同じ 階なら 動かせる しかけは sameMap）
  for (const id of EARTH_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of ['c5_ejar_2_1', 'c5_eslab_3', 'c5_eundo_3', 'c5_eswitch_a', 'c5_eswitch_b']) assert.ok(SCRIPTS[id].sameMap, `${id}: 同じ 階なら はなれていても`);
});

// ───────────── クモイ地方: 根の島・風見の石4・影の城 ─────────────
test('クモイ地方: ハネノの 南の「根の島」。風見の石4で 南へ 風の道（長ソラネの 話の あと）・北へ 帰れる・竜でも 行ける。神殿の 入口の 根は c5_root で ほどける', { timeout: 60000 }, async () => {
  const m = MAPS.kumoi;
  const I = KUMOI_ISLES.root;
  assert.ok(!TILE_INFO[m.tiles[(I.cy + 3) * m.w + I.cx]].solid, '根の島が ある');
  assert.equal(m.zoneAt(I.cx + 4, I.cy + 1), 't5_root', '根の島の 魔物（B の t5_root）');
  assert.ok(m.spawnCounts.t5_root > 0 && ENCOUNTER_TABLES.t5_root);
  assert.ok(m.zoneAt(EARTH_OUT.door.x, EARTH_OUT.door.y + 1).startsWith('safe'), '神殿の 入口の まわりは 出ない');
  // 入口: 根が からみついている（c5_root で ほどける）→ 1階
  const D = EARTH_OUT.door;
  assert.ok(isBlocked(m, D.x, D.y, () => false));
  assert.equal(effectiveTile(m, D.x, D.y, (f) => f === K7.root), T.ROOT_GATE);
  assert.ok(!isBlocked(m, D.x, D.y, (f) => f === K7.root));
  const w = m.warps.find((p) => p.x === D.x && p.y === D.y);
  assert.equal(w.to.map, earthMapId(1));
  // 風の道 w9 は ふだん 雲の 海（風見の石4で 開く）・w10 で 帰る
  for (const [x, y] of KUMOI_ROADS.w9.cells) assert.equal(effectiveTile(m, x, y, () => false), T.CLOUD_SEA);
  const door = `${D.x},${D.y + 1}`;
  const V4 = KUMOI_POS.vane4;
  const hanonoSouth = [V4.x + 2, V4.y];
  assert.ok(!kumoiStops([], hanonoSouth).has(door), '石4を 回すまで 根の島へ 行けない');
  assert.ok(kumoiStops([KUMOI_VANES.v4], hanonoSouth).has(door), '石4で 根の島の 神殿の 前へ');
  for (const fl of [[], Object.values(KUMOI_VANES)]) assert.ok(kumoiStops(fl, [D.x, D.y + 1]).has('59,33'), `根の島から ハネノの島へ 帰れる (${fl})`);
  // 竜でも 行ける（星読みの里に 着いた あとは どこでも）
  assert.equal(skyBox('kumoi', (f) => UPTO('c5_nocto').includes(f)), null);
  // 風見の石4: 長ソラネの 話の 前は 回らない・あとは 回す（もう 1回で とじる）
  {
    const { bot, c } = await setup(8101, 'c5_nocto');
    await place(bot, 'kumoi', V4.x, V4.y - 1);
    await examine(bot, V4.x, V4.y);
    assert.ok(!c.flags[KUMOI_VANES.v4] && said(bot, 'ぴくりとも動かない'), 'c5_root の 前');
  }
  const { world, bot, c } = await setup(8102, 'c5_root');
  await place(bot, 'kumoi', V4.x, V4.y - 1);
  await examine(bot, V4.x, V4.y);
  assert.ok(c.flags[KUMOI_VANES.v4] && said(bot, '根の島'));
  assert.equal(effectiveTile(m, V4.x, V4.y, world.hasFlagFn(bot.s)), T.VANE_ON);
  await examine(bot, V4.x, V4.y);
  assert.ok(!c.flags[KUMOI_VANES.v4], 'もう 1回で とじる');
  // 入口から 神殿の 1階へ（入ると c5_etemple）
  await place(bot, 'kumoi', D.x, D.y + 1);
  await stepOn(bot, D.x, D.y);
  assert.equal(bot.s.map, earthMapId(1));
  assert.ok(c.flags.c5_etemple && c.flags[EF(1)] && said(bot, '8階まで'));
  assert.equal(c.objective, EARTH_OBJ.etemple);
});

test('影の城が うかぶと（c5_castle）: クモイ地方の まん中に 城（まだ 入れない）・西の 風の道が とぎれる・小島が 出てくる・夕ぐれの 色・曲 kumoi_dusk。どこからでも ハネノの島へ 帰れる', () => {
  const m = MAPS.kumoi;
  const has = (f) => f === K7.castle;
  const cs = m.npcs.find((n) => n.id === 'shadow_castle');
  assert.ok(cs && cs.show.all.includes(K7.castle) && cs.sprite === 'shadow_castle' && cs.script === 'c5_castle_view');
  assert.ok(isBlocked(m, KUMOI_POS.castle.x, KUMOI_POS.castle.y, has), '城は 雲の 海の 上（歩いて 入れない）');
  assert.ok(JSON.stringify(SCRIPTS.c5_castle_view(ctx(flagsOf(...UPTO('c5_castle'))))).includes('近づけそうにない'));
  // 風の道が 1本 とぎれる（帰りの w2 は のこる）
  for (const [x, y] of KUMOI_WINDS[CASTLE_CUT]) {
    assert.ok(TILE_INFO[effectiveTile(m, x, y, () => false)].flow);
    assert.equal(effectiveTile(m, x, y, has), T.CLOUD_SEA);
  }
  for (const [x, y] of KUMOI_WINDS.w2) assert.ok(TILE_INFO[effectiveTile(m, x, y, has)].flow, 'w2 は のこる');
  // しずんでいた 小島が 出てくる（宝箱）
  const S = KUMOI_ISLES.shade;
  assert.equal(effectiveTile(m, Math.floor(S.cx), Math.floor(S.cy), () => false), T.CLOUD_SEA);
  assert.ok(!isBlocked(m, Math.floor(S.cx), Math.floor(S.cy), has), '城の 前の 小島');
  assert.ok(m.chests.some((ch) => ch.id === 'k5_shade' && ch.show.all.includes(K7.castle)));
  const reachTalk = 2.6 + 1.5; // world.js の onInteract（NPC の まん中から）
  const isleCells = [];
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (((x + 0.5 - S.cx) / S.rx) ** 2 + ((y + 0.5 - S.cy) / S.ry) ** 2 < 1 && !isBlocked(m, x, y, has)) isleCells.push([x, y]);
  assert.ok(isleCells.some(([x, y]) => Math.hypot(KUMOI_POS.castle.x + 0.5 - (x + 0.5), KUMOI_POS.castle.y + 0.5 - (y + 0.5)) <= reachTalk), '小島から 城に 話しかけられる');
  // 夕ぐれの 色・曲
  for (const id of ['kumoi', 'hanono']) assert.equal(MAPS[id].dusk.flag, K7.castle, id);
  assert.equal(m.bgmAt(10, 10, false, () => false), 'kumoi');
  assert.equal(m.bgmAt(10, 10, false, has), 'kumoi_dusk');
  // どこへ 流されても（どの 石の 向きでも）ハネノの島へ 帰れる
  const ALL = Object.values(KUMOI_VANES);
  const flagSets = [[], [KUMOI_VANES.v1], [KUMOI_VANES.v2], ALL].map((l) => [...l, K7.castle]);
  const stops = new Set();
  for (const fl of flagSets) for (const k of kumoiStops(fl, [59, 33])) stops.add(k);
  for (const fl of flagSets) for (const k of kumoiStops(fl, [7, 29])) stops.add(k);
  for (const k of stops) {
    const [x, y] = k.split(',').map(Number);
    assert.ok(flagSets.some((g) => kumoiStops(g, [x, y]).has('59,33')), `${k} から 帰れる`);
  }
  // 流された 先は いつも 島の 地面
  for (const fl of flagSets) {
    const h = (f) => fl.includes(f);
    for (const cells of [...Object.values(KUMOI_WINDS), KUMOI_ROADS.w9.cells]) for (const [x, y] of cells) {
      if (!TILE_INFO[effectiveTile(m, x, y, h)].flow) continue;
      const r = carry(m, x, y, h);
      assert.ok(!r.loop && !TILE_INFO[effectiveTile(m, r.x, r.y, h)].flow, `${x},${y}`);
    }
  }
});

test('長ソラネ（c5_nocto の あと）: 大地の 神殿の 話・ピピ「ぼくも行く！」→ 止める・入口の 根を ほどく（c5_root）。町の 人と ばあちゃんの ことば', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(8201, 'c5_nocto');
  assert.equal(c.objective, HOSHIYOMI_OBJ.nocto);
  await place(bot, 'hanono', HANONO_POS.sorane.x, HANONO_POS.sorane.y + 1);
  const from = bot.msgs.length;
  await talk(bot, 'sorane');
  assert.ok(c.flags.c5_root, 'c5_root');
  assert.ok(said(bot, '根の島', from) && said(bot, 'ぼくも行く', from) && said(bot, 'なりません、ピピ', from));
  assert.equal(c.objective, EARTH_OBJ.root);
  // ピピは 町に いない（こっそり 神殿へ）。助けた あとは 見晴らし台に もどる
  const pipi = MAPS.hanono.npcs.find((n) => n.id === 'pipi'), home = MAPS.hanono.npcs.find((n) => n.id === 'pipi_home');
  assert.ok(pipi.show.not.includes(K7.root) && home.show.all.includes(K7.pipi));
  assert.ok(JSON.stringify(SCRIPTS.c5_h_woman(ctx(c.flags))).includes('ピピを、見なかった'));
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('大地の神殿'), 'ホシフル村の ばあちゃん');
  assert.ok(MAPS.earth_5f.npcs.find((n) => n.id === 'pipi_e5').show.all.includes(K7.root));
});

// ───────────── 大地の 神殿 ─────────────
test('神殿の マップ: 8階。かいだんの つながり・5階の 休み所・1階の 入口と 糸は 根の島へ・宝箱は B の ★（各階 1〜2こ）・1つの 階に 1つの 見どころ', () => {
  assert.equal(new Set(EARTH_SIGHTS.slice(1)).size, EARTH_FLOORS, '1つの 階に 1つの 見どころ');
  for (let n = 1; n <= EARTH_FLOORS; n++) {
    const m = MAPS[earthMapId(n)];
    assert.equal(m.kind, 'dungeon');
    assert.ok(!m.noEscape, `${n}階: 糸・リレミトが 使える`);
    assert.equal(m.bgm, 'earth_temple');
    assert.equal(m.theme, earthTheme(n));
    const table = earthTable(n);
    assert.equal(table, n <= 4 ? 't5_earth_up' : 't5_earth_low');
    assert.ok(ENCOUNTER_TABLES[table], table);
    if (n === EARTH_REST || n === EARTH_BOSS) assert.deepEqual(m.spawnCounts, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(m.spawnCounts[table] > 0, `${n}階: 魔物が 出る`);
    const P = EARTH_POS[n];
    if (P.down) assert.equal(m.warps.find((w) => w.x === P.down.x && w.y === P.down.y).to.map, earthMapId(n + 1));
    if (n > 1) assert.equal(m.warps.find((w) => w.x === P.up.x && w.y === P.up.y).to.map, earthMapId(n - 1));
    assert.ok(m.zoneAt(...arriveCell(n)).startsWith('safe'), `${n}階: 入った 所は 魔物が 出ない`);
    const list = EARTH_TREASURE[n] || [];
    assert.ok(list.length >= 1 && list.length <= 2, `${n}階の ★の 宝箱は 1〜2こ`);
    for (const [i, id] of list.entries()) assert.ok(m.chests.some((ch) => ch.id === `e5_${n}${'ab'[i]}` && ch.item === id) && ITEMS[id], `${n}階の ★の 宝箱 ${id}`);
    // 階に 入った ときの ことば（入った 所の トリガー）
    assert.ok(m.triggers.some((t) => t.script === `c5_ef${n}`));
  }
  assert.equal(EARTH_POS[EARTH_BOSS].down, null, '8階が いちばん 下');
  const f1 = MAPS[earthMapId(1)];
  for (const p of EARTH_POS[1].exit) assert.equal(f1.warps.find((w) => w.x === p.x && w.y === p.y).to.map, 'kumoi');
  const out = dungeonExit({}, { char: { dungeonFrom: null }, map: earthMapId(6) });
  assert.equal(out.map, 'kumoi');
  assert.ok(Math.abs(out.x - EARTH_OUT.outside.x) < 1.5 && Math.abs(out.y - EARTH_OUT.outside.y) < 1.5, '糸で 根の島の 神殿の 前へ');
  // 5階の 休み所
  const f5 = MAPS[earthMapId(EARTH_REST)];
  assert.ok(f5.actions.some((a) => a.script === 'c5_e_rest'));
  const opts = SCRIPTS.c5_e_rest(ctx({})).find((s) => s[0] === 'choice')[3];
  assert.ok(opts[0].some((s) => s[0] === 'heal') && opts[0].some((s) => s[0] === 'church'), '回復と 記録');
  // 根の 橋・谷の 上は 魔物が 出ない
  for (let n = 1; n <= EARTH_FLOORS; n++) {
    const m = MAPS[earthMapId(n)];
    for (const J of Object.values(EARTH_POS[n].jars)) for (const p of [...J.short, ...J.long]) assert.ok(m.zoneAt(p.x, p.y).startsWith('safe'), `${n}階 根 ${p.x},${p.y}`);
  }
});

test('しかけ: どの じょうたいからも とじこめられない（ひとり＋仲間）。下りかいだん・上りかいだん（1階は 入口）・宝箱に 行ける。しかけを とかないと 下へ 行けない', () => {
  for (let n = 1; n <= EARTH_FLOORS; n++) {
    const m = MAPS[earthMapId(n)];
    const P = EARTH_POS[n];
    // 7階は 6階で ゴーレムを 落とした あと（落とす 前は 足場が ない）
    const st = earthStates(n, n === TREMOR_FLOOR ? [DROP_FLAG] : []);
    const goalDown = (s) => (P.down ? s.r(P.down.x, P.down.y) : near(s.r, P.nocto));
    const goalUp = (s) => (n === 1 ? s.r(P.exit[0].x, P.exit[0].y) : s.r(P.up.x, P.up.y));
    for (const k of st.nodes.keys()) {
      assert.ok(canReachFrom(st, k, goalDown), `${n}階 ${k}: 下へ 行ける`);
      assert.ok(canReachFrom(st, k, goalUp), `${n}階 ${k}: 上へ もどれる`);
    }
    const any = (p) => [...st.nodes.values()].some((s) => near(s.r, p));
    for (const ch of m.chests) assert.ok(any(ch), `${n}階: 宝箱 ${ch.id}`);
    if (n !== EARTH_BOSS) assert.ok(!goalDown({ r: reach(m.id, arriveCell(n), []) }), `${n}階: しかけを とかないと 下へ 行けない`);
  }
  // 7階: 6階で 落とす 前は 谷を わたれない（上へは もどれる）
  const st7 = earthStates(TREMOR_FLOOR, []);
  const P7 = EARTH_POS[TREMOR_FLOOR];
  for (const k of st7.nodes.keys()) {
    assert.ok(!canReachFrom(st7, k, (s) => s.r(P7.down.x, P7.down.y)), '足場が ないと わたれない');
    assert.ok(canReachFrom(st7, k, (s) => s.r(P7.up.x, P7.up.y)));
  }
  // 6階: ゴーレムを 下の 階へ 落とせる じょうたいが ある
  assert.ok([...earthStates(6).nodes.values()].some((s) => s.fl.has(DROP_FLAG)), '6階で 落とせる');
  // 5階: 上り下りの ゆかを 直せる・ピピを 助けないと 下へ 行けない
  const st5 = earthStates(5);
  assert.ok([...st5.nodes.values()].some((s) => s.fl.has(LIFT_FLAG)));
  assert.ok([...st5.nodes.values()].every((s) => s.fl.has(K7.pipi) || !s.r(EARTH_POS[5].down.x, EARTH_POS[5].down.y)), 'ピピを 助けると 根の かべが ほどける');
});

test('根の道: 水がめを しらべると 根が のびる（2階は 片方が のびると 片方が ちぢむ）。もう 1回で もどる', { timeout: 60000 }, async () => {
  const m2 = MAPS[earthMapId(2)];
  const J = EARTH_POS[2].jars[1];
  assert.equal(J.cells.length, 3, '2階の 水がめ1は 3つの 島に');
  const [A] = J.long, [a] = J.short;
  assert.equal(effectiveTile(m2, A.x, A.y, () => false), T.ROOT_BRIDGE);
  assert.equal(effectiveTile(m2, a.x, a.y, () => false), T.ROOT_GAP);
  const { world, bot, c } = await setup(8301, 'c5_etemple', [EF(2)]);
  const p = J.cells[1];
  await place(bot, m2.id, p.x, p.y + 1);
  const from = bot.msgs.length;
  await examine(bot, p.x, p.y);
  const has = world.hasFlagFn(bot.s);
  assert.ok(c.flags[J.flag] && said(bot, '橋がかかった', from) && said(bot, 'ちぢんでいった', from));
  assert.equal(effectiveTile(m2, A.x, A.y, has), T.ROOT_GAP);
  assert.equal(effectiveTile(m2, a.x, a.y, has), T.ROOT_BRIDGE);
  assert.equal(effectiveTile(m2, p.x, p.y, has), T.WATER_JAR_ON);
  await examine(bot, p.x, p.y);
  assert.ok(!c.flags[J.flag], 'もう 1回で もどる');
  // 1階: 入口の 広間の 水がめで 谷に 根の 橋
  const m1 = MAPS[earthMapId(1)];
  assert.ok(!reach(m1.id, arriveCell(1), [])(EARTH_POS[1].down.x, EARTH_POS[1].down.y));
  assert.ok(reach(m1.id, arriveCell(1), [JAR(1, 1)])(EARTH_POS[1].down.x, EARTH_POS[1].down.y));
  void world;
});

test('土の守り手: 石板で 1歩ずつ 歩く・根が ちぢむと 谷へ 落ちる → もとに もどす 石板・あなに 落ちて うめる（3階）・前に 人が いると 歩かない', { timeout: 60000 }, async () => {
  const G = EARTH_GOLEMS[3];
  const m = MAPS[G.map];
  const P = EARTH_POS[3];
  assert.equal(G.dir, 'S');
  assert.equal(effectiveTile(m, G.track[0].x, G.track[0].y, () => false), T.GOLEM_S);
  const { world, bot, c } = await setup(8401, 'c5_etemple', [EF(3)]);
  const has = () => world.hasFlagFn(bot.s);
  await place(bot, m.id, P.slab.x - 1, P.slab.y);
  const press = () => examine(bot, P.slab.x, P.slab.y);
  await press();
  assert.equal(golemState(3, has()).i, 1, '1歩');
  assert.equal(effectiveTile(m, G.track[1].x, G.track[1].y, has()), T.GOLEM_S);
  assert.equal(effectiveTile(m, G.track[0].x, G.track[0].y, has()), T.CAVE_FLOOR);
  // 根の 上で 水がめ → 谷へ 落ちる
  const jar = P.jars[1].cells[0];
  await place(bot, m.id, jar.x, jar.y - 1);
  await examine(bot, jar.x, jar.y);
  assert.ok(c.flags[GOLEM_LOST(3)] && said(bot, '谷の底へ落ちてしまった'), '谷へ 落ちた');
  await examine(bot, jar.x, jar.y);
  await place(bot, m.id, P.slab.x - 1, P.slab.y);
  await press();
  assert.ok(said(bot, 'もとにもどす石板を調べよう'), '落ちたら 石板は 動かない');
  // もとに もどす 石板
  bot.choice = 0;
  await place(bot, m.id, P.undo.x + 1, P.undo.y);
  await examine(bot, P.undo.x, P.undo.y);
  assert.ok(!c.flags[GOLEM_LOST(3)] && golemState(3, has()).i === 0, 'はじめの 場所へ');
  assert.equal(effectiveTile(m, G.track[0].x, G.track[0].y, has()), T.GOLEM_S);
  // 4歩 → 5歩目で あなに 落ちて うめる
  await place(bot, m.id, P.slab.x - 1, P.slab.y);
  for (let i = 0; i < 4; i++) await press();
  assert.equal(golemState(3, has()).i, 4);
  await press();
  assert.ok(c.flags[PIT_FLAG] && said(bot, 'あなをうめた'), 'あなを うめた');
  assert.equal(effectiveTile(m, P.pit.x, P.pit.y, has()), T.GOLEM_FILL);
  assert.ok(golemState(3, has()).gone);
  assert.ok(reach(m.id, arriveCell(3), has())(P.down.x, P.down.y), '石の 道が つながった');
  await press();
  assert.ok(said(bot, 'しずかにねむっている'));
  // 前に 人が 立っていると 歩かない（5階: 守り手の すぐ 前に 立って 石板を しらべる）
  const G5 = EARTH_GOLEMS[5], P5 = EARTH_POS[5];
  const { world: w5, bot: b5, c: c5 } = await setup(8403, 'c5_etemple', [EF(5)]);
  await place(b5, G5.map, G5.track[1].x, G5.track[1].y);
  await examine(b5, P5.slab.x, P5.slab.y);
  assert.ok(said(b5, '前に立っている') && golemState(5, w5.hasFlagFn(b5.s)).i === 0 && !c5.flags[LIFT_FLAG], '前に 人が いると 歩かない');
});

test('近道: 5階の 守り手を 重りの ゆかに のせると 上り下りの ゆかが 直る（1階 ⇔ 5階）。6階の 守り手を 根の すきまから 落とすと 7階の 足場', { timeout: 60000 }, async () => {
  const P5 = EARTH_POS[5], P1 = EARTH_POS[1];
  const m1 = MAPS[earthMapId(1)], m5 = MAPS[earthMapId(5)];
  assert.ok(isBlocked(m1, P1.lift.x, P1.lift.y, () => false) && isBlocked(m5, P5.lift.x, P5.lift.y, () => false), 'こわれている 間は のれない');
  assert.equal(m1.warps.find((w) => w.x === P1.lift.x && w.y === P1.lift.y).to.map, m5.id);
  assert.equal(m5.warps.find((w) => w.x === P5.lift.x && w.y === P5.lift.y).to.map, m1.id);
  const { world, bot, c } = await setup(8501, 'c5_etemple', [EF(5)]);
  await place(bot, m5.id, P5.slab.x, P5.slab.y + 1);
  for (let i = 0; i < 3; i++) await examine(bot, P5.slab.x, P5.slab.y);
  assert.ok(c.flags[LIFT_FLAG] && said(bot, '上り下りのゆかが、動き出した'), '直った');
  assert.equal(effectiveTile(m5, P5.plate.x, P5.plate.y, world.hasFlagFn(bot.s)), T.GOLEM_E, '守り手は 重りの ゆかの 上');
  await examine(bot, P5.slab.x, P5.slab.y);
  assert.ok(said(bot, '重りのゆかの上で、じっとしている') && golemState(5, world.hasFlagFn(bot.s)).i === 3, 'そのまま 動かない');
  await place(bot, m5.id, LIFT_OUT[5].x - 0.5, LIFT_OUT[5].y - 0.5);
  await stepOn(bot, P5.lift.x, P5.lift.y);
  assert.equal(bot.s.map, m1.id, '1階へ');
  await place(bot, m1.id, LIFT_OUT[1].x - 0.5, LIFT_OUT[1].y - 0.5);
  await stepOn(bot, P1.lift.x, P1.lift.y);
  assert.equal(bot.s.map, m5.id, '5階へ');
  // 6階: 水がめで 1本目の 根を のばし、守り手を 9歩 → 2本目の 根の すきまから 下の 階へ
  const G6 = EARTH_GOLEMS[6], P6 = EARTH_POS[6];
  const m6 = MAPS[G6.map], m7 = MAPS[earthMapId(7)];
  const g = EARTH_POS[7].foothold;
  assert.equal(effectiveTile(m7, g.x, g.y, () => false), T.ROOT_GAP);
  assert.equal(effectiveTile(m7, g.x, g.y, (f) => f === DROP_FLAG), T.GOLEM_FILL);
  const { world: w6, bot: b6, c: c6 } = await setup(8502, 'c5_pipi_save', [EF(6)]);
  // 水がめを 使わずに おすと、1本目の 根の すきまで 谷へ 落ちる（まちがい）
  await place(b6, m6.id, P6.slab.x, P6.slab.y + 1);
  for (let i = 0; i < 2; i++) await examine(b6, P6.slab.x, P6.slab.y);
  assert.ok(c6.flags[GOLEM_LOST(6)] && !c6.flags[DROP_FLAG], 'まちがえると 谷の 底へ');
  b6.choice = 0;
  await place(b6, m6.id, P6.undo.x, P6.undo.y + 1);
  await examine(b6, P6.undo.x, P6.undo.y);
  const jar = P6.jars[1].cells[0];
  await place(b6, m6.id, jar.x, jar.y - 1);
  await examine(b6, jar.x, jar.y);
  await place(b6, m6.id, P6.slab.x, P6.slab.y + 1);
  for (let i = 0; i < 9; i++) await examine(b6, P6.slab.x, P6.slab.y);
  assert.ok(c6.flags[DROP_FLAG] && said(b6, '下の階へ落ちていった'), '下の 階へ');
  assert.ok(!isBlocked(m7, g.x, g.y, w6.hasFlagFn(b6.s)), '7階の 足場');
});

test('2つに 分かれる 道（4階）: ひとり（仲間なし）は 開かない・ひとり＋仲間は「ここで待っていて」で 片方を おさえて もう 片方 ・家族 2人は 1人ずつ（リーダーの 世界）', { timeout: 120000 }, async () => {
  const P = EARTH_POS[4];
  const m = MAPS[earthMapId(4)];
  assert.ok(Math.hypot(P.switchA.x - P.switchB.x, P.switchA.y - P.switchB.y) >= 18, 'はなれた ふむ石');
  const r0 = reach(m.id, arriveCell(4), []);
  assert.ok(r0(P.switchA.x, P.switchA.y) && r0(P.switchB.x, P.switchB.y) && !r0(P.down.x, P.down.y), '左右の 道の おく・とびらの 先は まだ');
  assert.ok(reach(m.id, arriveCell(4), [DOOR4_FLAG])(P.down.x, P.down.y));
  {
    const { bot, c } = await setup(8601, 'c5_etemple', [EF(4)]);
    await place(bot, m.id, P.switchA.x, P.switchA.y + 1);
    const from = bot.msgs.length;
    await stepOn(bot, P.switchA.x, P.switchA.y);
    assert.ok(!c.flags[SWITCH_WAIT.a] && !c.flags[DOOR4_FLAG] && said(bot, '仲間を連れてこよう', from), '仲間が いないと だめ');
  }
  {
    const { world, bot, c } = await setup(8602, 'c5_etemple', [EF(4)]);
    assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
    await play(bot);
    bot.choice = 0;
    await place(bot, m.id, P.switchA.x, P.switchA.y + 1);
    let from = bot.msgs.length;
    await stepOn(bot, P.switchA.x, P.switchA.y);
    assert.ok(c.flags[SWITCH_WAIT.a] && said(bot, 'ガルドに、ここで待っていてもらう？', from), '仲間に 待っていてもらう');
    assert.equal(effectiveTile(m, P.switchA.x, P.switchA.y, world.hasFlagFn(bot.s)), T.PLATE_ON, 'ふむ石が しずんでいる');
    assert.ok(!c.flags[DOOR4_FLAG]);
    // もう 1度 のっても そのまま（えらぶと もどってもらえる）
    await place(bot, m.id, P.switchA.x, P.switchA.y + 1);
    from = bot.msgs.length;
    await stepOn(bot, P.switchA.x, P.switchA.y);
    assert.ok(c.flags[SWITCH_WAIT.a] && said(bot, 'ガルドが、ふむ石の上で待っている', from));
    // 東の ふむ石へ（西で 仲間が 待っている）→ とびらが 開く
    await place(bot, m.id, P.switchB.x, P.switchB.y + 1);
    from = bot.msgs.length;
    await stepOn(bot, P.switchB.x, P.switchB.y);
    assert.ok(c.flags[DOOR4_FLAG] && !c.flags[SWITCH_WAIT.a] && said(bot, 'ガルドが、ふむ石からもどってきた', from), 'とびらが 開いた');
    for (const p of P.door) assert.equal(effectiveTile(m, p.x, p.y, world.hasFlagFn(bot.s)), T.CAVE_FLOOR);
  }
  // 家族 2人: パパが 西・ユイが 東（どちらが 先でも）
  const world = new GameWorld({ offline: false, rng: makeRng(8603), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of [...UPTO('c5_etemple'), EF(4)]) Pa.char.flags[f] = true;
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  const both = async () => { for (let i = 0; i < 6; i++) { await papa.settle(); await yui.settle(); } };
  world.placeSession(Pa, m.id, P.switchA.x + 0.5, P.switchA.y + 1.5, 'up', true);
  world.placeSession(Y, m.id, P.switchB.x + 0.5, P.switchB.y + 1.5, 'up', true);
  await both();
  const walk1 = (b, p) => { b.x = p.x + 0.5; b.y = p.y + 0.5; b.send({ t: 'move', x: b.x, y: b.y, dir: 'up', moving: true, seq: b.seq }); };
  walk1(yui, P.switchB);
  await both();
  assert.ok(!Pa.char.flags[DOOR4_FLAG] && said(papa, '家族のだれか'), '1人だけでは 開かない');
  walk1(papa, P.switchA);
  await both();
  assert.ok(Pa.char.flags[DOOR4_FLAG], '2人で 同時に → 開いた');
  assert.ok(!Y.char.flags[DOOR4_FLAG], 'ユイの 世界は かわらない');
});

test('5階: 根に はさまれた ピピを 助ける → ピピの 手紙（大事な物）→ 根の かべが ほどける（c5_pipi_save）', { timeout: 60000 }, async () => {
  const P = EARTH_POS[EARTH_REST];
  const m = MAPS[earthMapId(EARTH_REST)];
  for (const p of P.rootWall) assert.ok(isBlocked(m, p.x, p.y, () => false) && !isBlocked(m, p.x, p.y, (f) => f === K7.pipi));
  const { world, bot, c } = await setup(8701, 'c5_etemple', [EF(5)]);
  assert.equal(c.objective, EARTH_OBJ.e5);
  await place(bot, m.id, P.pipi.x, P.pipi.y + 1);
  const from = bot.msgs.length;
  await talk(bot, 'pipi_e5');
  assert.ok(c.flags.c5_pipi_save && c.keyItems.includes('pipi_letter'), 'ピピの 手紙');
  assert.ok(said(bot, 'こっそり、ついてきちゃった', from) && said(bot, '星の竜アステル', from));
  assert.equal(c.objective, EARTH_OBJ.pipi);
  assert.ok(reach(m.id, arriveCell(5), world.hasFlagFn(bot.s))(P.down.x, P.down.y));
  assert.deepEqual(SCRIPTS.c5_pipi_e5(ctx(c.flags)), [], '2回目は ない');
  assert.ok(ITEMS.pipi_letter?.type === 'key' && ITEMS.yukina_song?.type === 'key' && ITEMS.hoshifuru_stone?.type === 'key', '大事な物（A）');
  assert.ok(JSON.stringify(SCRIPTS.c5_pipi(ctx(c.flags))).includes('手紙'), 'ハネノの ピピ');
});

test('大地の こどう（7階）: 歩くと ときどき 地面が ふるえる → 数歩 歩くと 落石（HPが へる・1は のこる）・立ち止まると 当たらない・はじめの へやと かいだんの まわりは ふるえない', { timeout: 60000 }, async () => {
  const m = MAPS[earthMapId(TREMOR_FLOOR)];
  const T7 = m.tremor;
  assert.ok(T7 && T7.every >= 6 && T7.grace >= 2 && T7.window > 1000);
  assert.ok(rockDamage(500, T7.hurt) >= 5 && rockDamage(500, T7.hurt) < 500 / 4, '大きすぎない');
  const { bot, c, clock } = await setup(8801, 'c5_pipi_save', [EF(6), EF(7), DROP_FLAG]);
  // 長い 通路（y = 15）を 東へ
  const row = Array.from({ length: 10 }, (_, i) => ({ x: 8 + i, y: 15 }));
  const col = Array.from({ length: 9 }, (_, i) => ({ x: 17, y: 14 - i }));
  const path = [...row, ...col];
  for (const p of path) assert.ok(!isBlocked(m, p.x, p.y, () => true) && !TREMOR_SAFE.some(([x0, y0, x1, y1]) => p.x >= x0 && p.y >= y0 && p.x <= x1 && p.y <= y1), `${p.x},${p.y}`);
  await place(bot, m.id, 7, 15);
  let i = 0;
  const hp0 = c.hp;
  let from = bot.msgs.length;
  for (; i < T7.every; i++) await stepOn(bot, path[i].x, path[i].y);
  assert.ok(toast(bot, '地面が、ふるえ始めた', from), `${T7.every}歩で 前ぶれ`);
  assert.equal(c.hp, hp0);
  // そのまま 歩きつづけると 落石
  from = bot.msgs.length;
  for (let k = 0; k < T7.grace; k++, i++) await stepOn(bot, path[i].x, path[i].y);
  assert.ok(toast(bot, '石が落ちてきた', from) && bot.msgs.slice(from).some((x) => x.t === 'hurt' && x.kind === 'rock'), '落石');
  assert.ok(c.hp < hp0 && c.hp >= 1, 'HPが へった');
  // もう 一度 ふるえたら、立ち止まる（ふるえが おさまるまで 待つ）→ 当たらない
  const back = [...path].reverse();
  let j = 0;
  from = bot.msgs.length;
  while (!toast(bot, '地面が、ふるえ始めた', from)) await stepOn(bot, back[j % back.length].x, back[j++ % back.length].y);
  const hp1 = c.hp;
  clock.now += T7.window + 500;
  from = bot.msgs.length;
  await stepOn(bot, back[j % back.length].x, back[j++ % back.length].y);
  assert.ok(toast(bot, '落石に当たらなかった', from) && c.hp === hp1, '立ち止まると 当たらない');
  // はじめの へやの 中は ふるえない
  await place(bot, m.id, 3, 14);
  from = bot.msgs.length;
  for (let k = 0; k < 30; k++) await stepOn(bot, 3 + (k % 2), 14 + ((k >> 1) % 2));
  assert.ok(!toast(bot, '地面が、ふるえ始めた', from), 'はじめの へやは ふるえない');
  // ほかの 階では おきない
  assert.ok(!MAPS[earthMapId(6)].tremor && !MAPS.kumoi.tremor);
});

test('ノクト（1回目）の 台本: showMon → bgm → battle（nocto_1）。負けたら 止まる。勝つと c5_nocto1 → ピピの 手紙で ことばが かわる → 影の城が うかぶ（c5_castle）→ 根の島へ', { timeout: 120000 }, async () => {
  const fx = FIXED_ENCOUNTERS.nocto_1;
  assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === 'nocto_1', 'きまった 戦い nocto_1（B。まだ ない 時は 仮の データ）');
  const steps = SCRIPTS.c5_nocto1_event(ctx(flagsOf(...UPTO('c5_pipi_save'))));
  const iMon = steps.findIndex((s) => s[0] === 'showMon' && s[1] === 'nocto_1');
  const iBgm = steps.findIndex((s) => s[0] === 'bgm' && s[1] === 'nocto_1');
  const iBat = steps.findIndex((s) => s[0] === 'battle' && s[1] === 'nocto_1');
  assert.ok(iMon >= 0 && iBgm > iMon && iBat > iBgm, 'showMon → bgm → battle');
  assert.ok(steps.findIndex((s) => s[0] === 'flag' && s[1] === 'c5_nocto1') > iBat);
  assert.deepEqual(SCRIPTS.c5_nocto1_event(ctx(flagsOf(...UPTO('c5_nocto1')))), []);
  const T8 = EARTH_POS[EARTH_BOSS].trigger;
  for (const letter of [true, false]) {
    const { bot, c } = await setup(letter ? 8902 : 8901, 'c5_pipi_save', [EF(8)]);
    if (letter) c.keyItems.push('pipi_letter');
    const fought = [];
    await place(bot, earthMapId(8), 13, T8.y + 1);
    if (!letter) {
      await stepOn(bot, 13, T8.y, { lose: (id) => id === 'nocto_1', fought });
      assert.ok(fought.includes('nocto_1') && !c.flags.c5_nocto1, '負けたら すすまない');
      await place(bot, earthMapId(8), 13, T8.y + 1);
    }
    const from = bot.msgs.length;
    await stepOn(bot, 13, T8.y, { fought });
    assert.ok(c.flags.c5_nocto1 && c.flags.c5_castle, '勝った → 影の城');
    assert.equal(said(bot, '…ピピの、字だ…。', from), letter, '手紙の ことば');
    assert.equal(said(bot, 'ほんの小手調べだ', from), !letter, '手紙が ない ときの ことば');
    assert.equal(c.keyItems.includes('pipi_letter'), false, '手紙は ノクトへ');
    assert.equal(!!c.flags[LETTER_FLAG], letter, 'わたした しるし（第6幕で 使う）');
    assert.equal(bot.s.map, 'kumoi', '神殿の 外へ');
    assert.ok(Math.abs(bot.s.x - EARTH_OUT.outside.x) < 2 && Math.abs(bot.s.y - EARTH_OUT.outside.y) < 2);
    assert.ok(said(bot, '黒い城が、ゆっくりと、うかび上がってくる', from) && said(bot, 'kumoi_dusk', from));
    assert.equal(c.objective, EARTH_OBJ.castle);
  }
  // とちゅうで 切れた とき（c5_nocto1 の あと、城が うかぶ 前）は 祭だんで 城の 場面から
  const { bot, c } = await setup(8903, 'c5_nocto1', [EF(8)]);
  const A = EARTH_POS[8].altar[0];
  await place(bot, earthMapId(8), A.x, A.y + 1);
  await examine(bot, A.x, A.y);
  assert.ok(c.flags.c5_castle && bot.s.map === 'kumoi');
});

test('みんなが 集まる（ハネノ）: 7人と 話すと 1人ずつ 力を くれる（B の 装備・ルカの 道具・いのりの歌・星の石の かけら）→ c5_gather。店は ランク9・宿屋は やすく', { timeout: 120000 }, async () => {
  const m = MAPS.hanono;
  for (const k of GATHER) {
    const n = m.npcs.find((x) => x.id === `g_${k}`);
    assert.ok(n && n.show.all.includes(K7.castle) && n.script === `c5_gather_${k}`, k);
    assert.ok(!isBlocked(m, GATHER_POS[k].x, GATHER_POS[k].y + 1, () => true) || !isBlocked(m, GATHER_POS[k].x + 1, GATHER_POS[k].y, () => true), `${k} に 話しかけられる`);
  }
  assert.deepEqual(Object.keys(GATHER_GIFTS).sort(), ['barga', 'mira', 'nefi', 'sara'], '名前の 約束（B の GATHER_GIFTS）');
  for (const id of Object.values(GATHER_GIFTS)) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key', id);
  // 店（c5_castle の あとは ランク9）
  assert.deepEqual(SHOPS.hanono9_weapon.items, HANONO9_SHOP_WEAPONS);
  assert.deepEqual(SHOPS.hanono9_armor.items, HANONO9_SHOP_ARMOR);
  assert.deepEqual(SHOPS.hanono9_item.items, HANONO9_SHOP_TOOLS);
  for (const k of ['hanono9_weapon', 'hanono9_armor', 'hanono9_item']) for (const id of shopItems(SHOPS[k])) assert.ok(ITEMS[id]?.price > 0, `${k}: ${id}`);
  const after = flagsOf(...UPTO('c5_castle'));
  assert.deepEqual(SCRIPTS.c5_shop_hw(ctx(after)), [['shop', 'hanono9_weapon']]);
  assert.deepEqual(SCRIPTS.c5_shop_ha(ctx(after)), [['shop', 'hanono9_armor']]);
  assert.deepEqual(SCRIPTS.c5_shop_hi(ctx(after)), [['shop', 'hanono9_item']]);
  assert.deepEqual(SCRIPTS.c5_shop_hw(ctx(flagsOf(...UPTO('c5_nocto1')))), [['shop', 'hanono_weapon']]);
  assert.ok(JSON.stringify(SCRIPTS.c5_inn_hanono(ctx(after))).includes('ひと晩60ゴールド'), '宿屋が やすく');
  // 7人と 話す
  const { bot, c } = await setup(9001, 'c5_castle');
  const n0 = (id) => c.items.filter((i) => i.id === id).reduce((s, i) => s + (i.n || 0), 0);
  const before = { wata: n0('kumo_wataame'), rev: n0('revive_flower') };
  for (const [i, k] of GATHER.entries()) {
    const p = GATHER_POS[k];
    const spot = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => !isBlocked(m, x, y, () => true) && !m.npcs.some((q) => q.x === x && q.y === y));
    await place(bot, 'hanono', spot[0], spot[1]);
    const from = bot.msgs.length;
    await talk(bot, `g_${k}`);
    assert.ok(c.flags[GATHER_FLAG(k)], `${k} と 話した`);
    if (i < GATHER.length - 1) {
      assert.ok(said(bot, `（集まった人たちと話した：${i + 1}/${GATHER.length}）`, from), `${k}: ${i + 1}/7`);
      assert.ok(!c.flags.c5_gather);
    }
    const again = bot.msgs.length;
    await talk(bot, `g_${k}`);
    assert.ok(!said(bot, '手に入れた', again), `${k}: 2回目は もらえない`);
  }
  assert.ok(c.flags.c5_gather, '7人 ぜんぶ → c5_gather');
  assert.equal(c.objective, EARTH_OBJ.gather);
  assert.ok(said(bot, 'ハネビトみんなで、風の道をつくります') && said(bot, '第5章の続きはアップデートで！'));
  for (const id of Object.values(GATHER_GIFTS)) assert.ok(n0(id) >= 1 || Object.values(c.equip).includes(id), `もらった ${id}`);
  assert.ok(n0('kumo_wataame') > before.wata && n0('revive_flower') > before.rev, 'ルカの 道具');
  assert.ok(c.keyItems.includes('yukina_song') && c.keyItems.includes('hoshifuru_stone'), 'いのりの歌・星の石の かけら');
  assert.ok(said(bot, '帰る場所は、ここにある'));
  // ばあちゃんは 主人公の 年を 言わない
  for (const k of GATHER) for (const st of SCRIPTS[`c5_gather_${k}`](ctx({}))) if (st[0] === 'say') assert.ok(!/\d+さい|\d+つの年|\d+年/.test(st[2]), `${k}: ${st[2]}`);
  // 星読みの里の ばあちゃんは ハネノへ
  assert.ok(MAPS.hoshiyomi.npcs.find((n) => n.id === 'elder_hy').show.not.includes(K7.castle));
});

// ───────────── 通しで ─────────────
test('通しで あそべる: c5_nocto → 長ソラネ → 風見の石4 → 根の島 → 大地の 神殿 1〜8階（水がめ・守り手・ふむ石・ピピ・足場）→ ノクト → 影の城 → ハネノで 7人 → c5_gather', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(9101, 'c5_nocto');
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok, '酒場の 仲間（4階の ふむ石）');
  const fought = [];
  const opts = { fought };
  const got = (f) => assert.ok(c.flags[f], f);
  const has = () => world.hasFlagFn(bot.s);
  bot.choice = 0;
  // 長ソラネ → c5_root
  await place(bot, 'hanono', HANONO_POS.sorane.x, HANONO_POS.sorane.y + 1);
  await talk(bot, 'sorane', opts);
  got('c5_root');
  // 風見の石4 → 風の道 → 根の島の 神殿の 前
  const V4 = KUMOI_POS.vane4, D = EARTH_OUT.door;
  await place(bot, 'kumoi', V4.x, V4.y - 1);
  await examine(bot, V4.x, V4.y, opts);
  got(KUMOI_VANES.v4);
  assert.ok(flowReach(MAPS.kumoi, [V4.x + 2, V4.y], has()).stops.has(`${D.x},${D.y + 1}`), '風の道で 根の島へ');
  await place(bot, 'kumoi', D.x, D.y + 1);
  await stepOn(bot, D.x, D.y, opts);
  got('c5_etemple');
  const floor = (n) => earthMapId(n);
  const goDown = async (n) => {
    const P = EARTH_POS[n];
    const r = reach(floor(n), [Math.floor(bot.s.x), Math.floor(bot.s.y)], has());
    assert.ok(near(r, P.down) || r(P.down.x, P.down.y), `${n}階: 下りかいだんへ 歩いて 行ける`);
    const [x, y] = fromCell(r, P.down);
    await place(bot, floor(n), x, y);
    await stepOn(bot, P.down.x, P.down.y, opts);
    assert.equal(bot.s.map, floor(n + 1), `${n + 1}階へ`);
    got(EF(n + 1));
    assert.equal(c.objective, EARTH_OBJ[`e${n + 1}`] || EARTH_OBJ.pipi, `${n + 1}階の 目標`);
  };
  const use = async (n, p) => {
    const r = reach(floor(n), [Math.floor(bot.s.x), Math.floor(bot.s.y)], has());
    assert.ok(near(r, p), `${n}階: ${p.x},${p.y} へ 歩いて 行ける`);
    const [x, y] = fromCell(r, p);
    await place(bot, floor(n), x, y);
    await examine(bot, p.x, p.y, opts);
  };
  // 1階: 水がめで 根の 橋
  await use(1, EARTH_POS[1].jars[1].cells.find((p) => p.y > 12));
  got(JAR(1, 1));
  await goDown(1);
  // 2階: 西の 根で まん中の 島へ → まん中の 水がめで 東の 根
  await use(2, EARTH_POS[2].jars[1].cells.find((p) => p.x > 10 && p.x < 17));
  await goDown(2);
  // 3階: 守り手を 5歩（あなを うめる）
  for (let i = 0; i < 5; i++) await use(3, EARTH_POS[3].slab);
  got(PIT_FLAG);
  await goDown(3);
  // 4階: 仲間に 西の ふむ石で 待っていてもらって、東の ふむ石へ
  for (const p of [EARTH_POS[4].switchA, EARTH_POS[4].switchB]) {
    await place(bot, floor(4), p.x, p.y + 1);
    await stepOn(bot, p.x, p.y, opts);
  }
  got(DOOR4_FLAG);
  await goDown(4);
  // 5階: 休み所・守り手で 上り下りの ゆか・ピピ
  await use(5, EARTH_POS[5].font);
  for (let i = 0; i < 3; i++) await use(5, EARTH_POS[5].slab);
  got(LIFT_FLAG);
  await place(bot, floor(5), EARTH_POS[5].pipi.x, EARTH_POS[5].pipi.y + 1);
  await talk(bot, 'pipi_e5', opts);
  got('c5_pipi_save');
  assert.ok(c.keyItems.includes('pipi_letter'));
  await goDown(5);
  // 6階: 水がめ → 守り手を 9歩（根の すきまから 下の 階へ）→ まん中の 島の 水がめで 東へ
  await use(6, EARTH_POS[6].jars[1].cells[0]);
  for (let i = 0; i < 9; i++) await use(6, EARTH_POS[6].slab);
  got(DROP_FLAG);
  await place(bot, floor(6), 11, 10);
  await use(6, EARTH_POS[6].jars[1].cells.find((p) => p.x > 9 && p.x < 15));
  await goDown(6);
  // 7階: 足場を わたって
  await goDown(7);
  // 8階: ノクト → 影の城
  const T8 = EARTH_POS[8].trigger;
  await place(bot, floor(8), 13, T8.y + 1);
  await stepOn(bot, 13, T8.y, opts);
  for (const f of ['c5_nocto1', 'c5_castle', LETTER_FLAG]) got(f);
  assert.equal(bot.s.map, 'kumoi');
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['nocto_1'], 'きまった 戦いは ノクトだけ');
  // ハネノで 7人
  for (const k of GATHER) {
    const p = GATHER_POS[k];
    const spot = [[0, 1], [1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => !isBlocked(MAPS.hanono, x, y, () => true) && !MAPS.hanono.npcs.some((q) => q.x === x && q.y === y));
    await place(bot, 'hanono', spot[0], spot[1]);
    await talk(bot, `g_${k}`, opts);
  }
  for (const f of EARTH_STEPS) got(f);
  assert.equal(c.objective, EARTH_OBJ.gather);
  // そのあとの ことば
  assert.ok(JSON.stringify(SCRIPTS.c5_sorane(ctx(c.flags))).includes('風の道を'), '長ソラネ');
  assert.ok(JSON.stringify(SCRIPTS.c5_pipi(ctx(c.flags))).includes('手紙'), 'ピピ');
  assert.ok(JSON.stringify(SCRIPTS.elder(ctx(c.flags))).includes('星の石のかけら'), 'ばあちゃん');
});

// ───────────── 文字 ─────────────
test('文字: 第5章 Step 6・7 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない。魔物の 名前の 約束（そのままの 名前を 使わない）', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-earth.js', 'public/js/shared/maps/earth.js', 'public/js/shared/maps/earth-rows.js', 'public/js/shared/data/shops-earth.js', 'public/js/shared/world/tremor.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  // 物語の 文に、アニメの そのままの 名前を 使わない（plan-ch5.md の 16）
  const all = JSON.stringify(Object.keys(SCRIPTS).filter((k) => k.startsWith('c5_e') || k.startsWith('c5_gather') || k.startsWith('c5_nocto1')).map((k) => SCRIPTS[k](ctx({}))));
  for (const w of ['ロボット兵', 'ラピュタ', 'オーム', '王蟲', 'カオナシ', 'コダマ', 'こだま']) assert.ok(!all.includes(w), w);
});

// ───────────── 絵と 音 ─────────────
test('絵と 音: 神殿の タイル（2D は 16×16 を ぬる・2.5D）・階ごとの 色・影の城の 絵・3きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { EARTH_TILES, EARTH_PROPS, EARTH_LIQUIDS, EARTH_KEEP_COLOR, EARTH_FLOOR_H } = await import('../public/js/client/render/tiles-earth.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { blockSpec, FLOOR_H } = await import('../public/js/client/render/field3d.js');
  const { paintSpecial } = await import('../public/js/client/render/chars.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  const ids = [T.ROOT_BRIDGE, T.ROOT_GAP, T.WATER_JAR, T.WATER_JAR_ON, T.GOLEM_S, T.GOLEM_E, T.GOLEM_SLAB, T.UNDO_SLAB, T.EARTH_PIT, T.GOLEM_FILL, T.EARTH_DOOR, T.LIFT_BROKEN, T.EARTH_LIFT, T.EARTH_ALTAR, T.ROOT_GATE];
  assert.deepEqual([...EARTH_TILES].sort((a, b) => a - b), [...ids].sort((a, b) => a - b));
  // タイルの ID は あいていた ものだけ（plan-ch5.md の 16。Uint8Array なので 255 まで）
  const FREE = [20, 23, 24, 25, 26, 27, 28, 29, 54, 58, 85, 86, 87, 88, 89, 97, 187, 188, 189, 229];
  for (const id of ids) assert.ok(FREE.includes(id), `${TILE_INFO[id].name}: ${id}`);
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length, 'タイルの ID が かさならない');
  for (const id of ids) {
    assert.ok(hasTileArt(id) && TILE_INFO[id], `${id}`);
    for (const f of [0, 1, 2, 3]) {
      const p = paintTile(id, 0x21, f, 0);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  for (const id of EARTH_KEEP_COLOR) assert.equal(partOfTile(id), 'none', TILE_INFO[id].name);
  for (const id of [T.ROOT_GAP, T.WATER_JAR_ON, T.EARTH_ALTAR]) {
    assert.ok(isAnimated(id), TILE_INFO[id].name);
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name}: コマで うごく`);
  }
  for (const [a, b] of [[T.WATER_JAR, T.WATER_JAR_ON], [T.ROOT_GAP, T.ROOT_BRIDGE], [T.GOLEM_S, T.GOLEM_E], [T.GOLEM_SLAB, T.UNDO_SLAB], [T.EARTH_PIT, T.GOLEM_FILL], [T.LIFT_BROKEN, T.EARTH_LIFT]]) assert.notEqual(paintTile(a).px.join(), paintTile(b).px.join(), `${TILE_INFO[a].name} / ${TILE_INFO[b].name}`);
  // 歩ける・歩けない
  for (const id of [T.ROOT_BRIDGE, T.GOLEM_FILL, T.EARTH_LIFT, T.ROOT_GATE]) assert.ok(!TILE_INFO[id].solid, TILE_INFO[id].name);
  for (const id of [T.ROOT_GAP, T.WATER_JAR, T.GOLEM_S, T.GOLEM_E, T.GOLEM_SLAB, T.UNDO_SLAB, T.EARTH_PIT, T.EARTH_DOOR, T.LIFT_BROKEN, T.EARTH_ALTAR]) assert.ok(TILE_INFO[id].solid, TILE_INFO[id].name);
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...EARTH_MAPS, 'kumoi', 'hanono']) {
    const m = MAPS[id];
    const all = new Set(m.tiles);
    for (const g of m.gates) { all.add(g.open); all.add(g.closed); for (const [, t] of g.levels || []) all.add(t); }
    for (const t of all) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  // 2.5D: 谷は ずっと 下・あなは ふかい・根の とびらは かべ・たてた もの
  assert.ok(EARTH_LIQUIDS[T.ROOT_GAP].y < -1);
  assert.ok(FLOOR_H[T.EARTH_PIT] < -0.5 && FLOOR_H[T.ROOT_BRIDGE] === EARTH_FLOOR_H[T.ROOT_BRIDGE]);
  assert.ok(blockSpec(T.EARTH_DOOR, 0, 0)?.h >= 1.5, '根の とびらは かべの 高さ');
  for (const id of [T.WATER_JAR, T.WATER_JAR_ON, T.GOLEM_S, T.GOLEM_E, T.GOLEM_SLAB, T.UNDO_SLAB, T.EARTH_ALTAR]) assert.ok(EARTH_PROPS[id] && PROP_TILES.has(id), TILE_INFO[id].name);
  // 階ごとの 色（土の こげ茶 → 根の みどり → 地下水の 青 → あかね色）
  const fl = (n) => themeRgb(0x80, 0x80, 0x80, earthTheme(n), 'floor');
  assert.equal(new Set([1, 3, 5, 7].map((n) => fl(n).join())).size, 4, '4つの 色');
  assert.ok(fl(3)[1] > fl(3)[2] && fl(5)[2] > fl(5)[0] && fl(7)[0] > fl(7)[2], 'みどり・青・あかね色');
  // 影の城の 絵（とくべつな 絵。2コマ）
  const c0 = paintSpecial('shadow_castle', 'down', 0), c1 = paintSpecial('shadow_castle', 'down', 1);
  assert.ok(c0 && c1 && c0.w >= 64 && c0.h >= 64, '大きな 絵');
  assert.notEqual(c0.px.join(), c1.px.join(), 'コマで うごく');
  // 曲（神殿・ボス・夕ぐれの クモイ地方）
  for (const id of ['earth_temple', 'nocto_1', 'kumoi_dusk']) {
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
  assert.equal(MAPS.earth_1f.bgm, 'earth_temple');
  // コンピューターの はやさ（タイルの 数）
  void computeStats;
});
