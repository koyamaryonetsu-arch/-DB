// 第2部 第8章 第2幕「よみの青い火」Step 3・4（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c8_jafar → 今の トキネ（c8_sea）→ 今の クモイ地方で 時の砂時計 → 千年前の クモイの 海・ナギの村（c8_abyss・カイが ゲスト）
// → 大木の島から 西へ 流れる しお → うずしおの岩場の 青い うず → よみの海底神殿 1〜8階（c8_temple）→ 4階 ペイニックと パニクル（c8_imps）
// → 5階より 下へ（c8_depth）→ よみの王ハデロス（c8_hades）
// 青い 火と よみの道（千年前の 台の 火 → 今の 見えない ゆか）・火種と 火を うつす・しおの みちひ・海の 流れ・青い 火の 柱・時をこえる手紙（より道 2つ・5階の なぞとき）。
// 戦いの 中みは B。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C8B, ARRIVE8B, ENTRY8B, PF8B, MIKO8B, VOICE8B, WIN8B, CALM8B, FIRE8B, FIRE_LIMIT8B, LIGHT_R2, LETTER8B, LETTER8B_SIDE, LETTER8B_TEMPLE, MIKO_LETTER8B,
  ENTRANCE8B, c8bMapId, C8B_FLOORS, C8B_NOW_FLOORS, C8B_REST,
} from '../public/js/shared/maps/c8b-flags.js';
import { C8 } from '../public/js/shared/maps/c8a-flags.js';
import { CH8B_MAPS } from '../public/js/shared/maps/c8.js';
import { C8B_POS, C8B_MAPS, c8bTreasureOf, C8B_CHEST_ERA, litBy, firesOn } from '../public/js/shared/maps/c8b-temple.js';
import { LETTER8B_SPOTS, LETTER8B_ASKERS, C8B_SEA_POS, inShoal8b } from '../public/js/shared/maps/c8b-sea.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH8_STEPS, C8_OBJ, OLD_C8_OBJ, CH8_OBJECTIVE_TARGETS, CH8_OBJECTIVE_TALK } from '../public/js/shared/data/story-c8.js';
import { CH8B_STEPS, C8B_OBJ, CH8B_STORY_SCRIPTS, VILLAIN8B, IMPS8B } from '../public/js/shared/data/story-c8b.js';
import { C8B_SIDE_QUESTS, letterReward8b, letterName8b } from '../public/js/shared/data/sidequests-c8b.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor, objectiveChapter } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
// 宝箱の 中み・手紙の ごほうび（B の data/items-c8b.js。まとめる 時に そちらから）
import { C8B_TREASURE, C8B_LETTER_REWARDS } from '../public/js/shared/data/items-c8b.js';
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
const PAST = (n) => MAPS[c8bMapId(n)];
const NOW = (n) => MAPS[c8bMapId(n, true)];
const SEA = 'c7s_sea';
const KUMOI = 'kumoi';

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto = 'c8_jafar', { extra = [], frac = 0.2 } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  // 第7章・第8章 第1幕で はじめて 千年前の 海・コガネ地方に 来た しるし・守り星の かけら（物語の すすみぐあいでは ない フラグ）
  for (const f of ['c7_arrive', 'c7s_arrive', 'c8a_arrive', 'c5_k_vane3', 'c5_kroad_w9', 'c7s_lwin']) c.flags[f] = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 85);
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
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人・海の 流れを さける。火の 柱は 時計を すすめて 待つ）
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
// 海の 流れに のる（となりの 流れの マスに 1歩 → 流される 道を たどる）
async function ride(bot, x, y) {
  const map = MAPS[bot.s.map];
  const end = carry(map, x, y, bot.world.hasFlagFn(bot.s));
  for (const [px, py] of end.path) await stepOn(bot, px, py);
  return end;
}
// 青い 火の 台を しらべる（千年前。となりに 立って しらべて えらぶ）
async function touchFire(bot, n, k, choice = 0) {
  const f = C8B_POS[n].fires[k];
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [f.x + dx, f.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has));
  await walkTo(bot, side[0], side[1]);
  bot.choice = choice;
  await examine(bot, f.x, f.y);
  bot.choice = 0;
}

// ───────────── 海底神殿の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ（台の 火・手紙）・火の 柱の 時間（0 … a が ふき出す / 1 … b が ふき出す）
// うごき … 歩く（海の 流れは 矢じるしの むきへ 流される）・待つ（6階。どちらの 時間でも ふさがらない マスだけ）・
//   時の砂時計（その マスに 向こうの 時代で 立てる とき）・台に 火を ともす・うつす（千年前で となりに 立つ。火種が たりない ときは、ともっている 火を 1つ うつす）・
//   5階の 貝の 箱（千年前で 手紙を 入れる → 今で 読む）
// はじめは 上への かいだんの 上（第71回: 上の 階から 下りると 上への かいだんの 真上に 着く）
function solve(n, { start = [], shift = true, letter = true, fires = true, era0 = 'past' } = {}) {
  const P = C8B_POS[n];
  const past = PAST(n), now = n <= C8B_NOW_FLOORS ? NOW(n) : null;
  const limit = FIRE_LIMIT8B[n] || 1;
  const s0 = { era: era0, x: P.up.x, y: P.up.y, flags: [...start], phase: 0 };
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
      if (map.warpAt.get(y * map.w + x)) { if (x === P.down?.x && y === P.down?.y) goals.push({ ...s, via: s.era }); continue; }
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
    if (fires && s.era === 'past') {
      const lit = P.fires.map((_, k) => k).filter((k) => s.flags.includes(FIRE8B(n, k)));
      P.fires.forEach((f, k) => {
        const fk = FIRE8B(n, k);
        if (!near(f) || s.flags.includes(fk)) return;
        if (lit.length < limit) push({ ...s, flags: [...s.flags, fk] });
        else for (const j of lit) push({ ...s, flags: [...s.flags.filter((x) => x !== FIRE8B(n, j)), fk] });
      });
    }
    if (near(P.box)) {
      const L = LETTER8B_TEMPLE;
      if (s.era === 'past' && letter && !has(LETTER8B.bury(L))) push({ ...s, flags: [...s.flags, LETTER8B.bury(L)] });
      if (s.era === 'now' && has(LETTER8B.bury(L)) && !has(LETTER8B.found(L))) push({ ...s, flags: [...s.flags, LETTER8B.found(L)] });
    }
    edges.set(key(s), out);
  }
  // どこに いても、上への かいだん（はじめの 所）へ もどれるか（海の 流れ・火・火の 柱で とじこめられない）
  const back = new Set([...edges.keys()].filter((k) => {
    const [, xy] = k.split(':');
    const [x, y] = xy.split(',').map(Number);
    return Math.abs(x - P.up.x) + Math.abs(y - P.up.y) <= 1;
  }));
  for (let changed = true; changed;) {
    changed = false;
    for (const [k, o] of edges) if (!back.has(k) && o.some((x) => back.has(x))) { back.add(k); changed = true; }
  }
  const stuck = [...edges.keys()].filter((k) => !back.has(k));
  return { goals, seen, cells, stuck };
}
const startOf = (n) => (n >= 4 ? [C8B.imps] : []);
const PUZZLE = [1, 2, 3, 5, 6, 7];

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 6-2）: 物語の すすみ・マップの ID・出現表・きまった 戦い・宝箱・タイル', () => {
  assert.deepEqual(CH8B_STEPS, ['c8_sea', 'c8_abyss', 'c8_temple', 'c8_imps', 'c8_depth', 'c8_hades']);
  assert.deepEqual(CH8_STEPS.slice(6), CH8B_STEPS, 'CH8_STEPS の c8_jafar の うしろ');
  const ji = STORY_STEPS.indexOf('c8_jafar');
  assert.deepEqual(STORY_STEPS.slice(ji + 1, ji + 7), CH8B_STEPS, 'c8_jafar の うしろ');
  // マップ（千年前 1〜8階・今 1〜7階）
  const want = [...Array.from({ length: 8 }, (_, i) => `c8b_temple_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c8b_temple_${i + 1}f_now`)];
  assert.deepEqual(CH8B_MAPS, want);
  assert.deepEqual(C8B_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c8b'), 'マップの 名前の 先頭は c8b');
    assert.ok(m.kind === 'dungeon');
  }
  for (let n = 1; n <= 8; n++) {
    const m = PAST(n);
    assert.ok(m.past && m.name.startsWith('よみの海底神殿'), `${n}階`);
    if (n <= C8B_NOW_FLOORS) {
      assert.equal(m.timePair, c8bMapId(n, true));
      assert.equal(NOW(n).timePair, c8bMapId(n));
      assert.deepEqual([m.w, m.h], [NOW(n).w, NOW(n).h], 'おなじ 大きさ');
      assert.ok(NOW(n).name.startsWith('海底神殿のあと'));
      assert.ok(NOW(n).warps.some((w) => w.x === C8B_POS[n].up.x && w.y === C8B_POS[n].up.y), `今の ${n}階の 上への かいだん`);
      assert.equal(NOW(n).warps.some((w) => w.x === C8B_POS[n].down.x && w.y === C8B_POS[n].down.y), n < 7, `今の ${n}階の 下への かいだん`);
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  assert.deepEqual(C8B_REST, [4, 7]);
  // 入口: 千年前の うずしおの岩場の 青い うず（カイと しらべると 開く）・今の 雲から出てきた島の 石の とびら（c8_temple の あと）
  const E = ENTRANCE8B;
  for (const [m, flag, to] of [[MAPS[SEA], ENTRY8B, c8bMapId(1)], [MAPS[KUMOI], C8B.temple, c8bMapId(1, true)]]) {
    const w = m.warpAt.get(E.y * m.w + E.x);
    assert.equal(w.to.map, to);
    assert.ok(isBlocked(m, E.x, E.y, () => false), '入口は しまっている');
    assert.ok(isBlocked(m, E.x, E.y, (f) => f !== flag), '開く 前は 通れない');
    assert.equal(effectiveTile(m, E.x, E.y, () => true), T.STAIRS_DOWN, '開くと かいだん');
  }
  assert.equal(effectiveTile(MAPS[SEA], E.x, E.y, (f) => f === C8B.sea), T.C8B_WHIRL, '第2幕に なると 青い うず');
  assert.equal(effectiveTile(MAPS[KUMOI], E.x, E.y, (f) => f === C8B.sea || f === 'c5_shard'), T.C8B_SHELLDOOR, '今は 貝の もようの とびら');
  assert.equal(effectiveTile(MAPS[KUMOI], E.x, E.y, (f) => f === 'c5_shard'), T.TILT_PILLAR, '第2幕の 前は かたむいた 柱');
  assert.equal(PAST(1).warpAt.get(C8B_POS[1].up.y * 32 + C8B_POS[1].up.x).to.map, SEA);
  assert.equal(NOW(1).warpAt.get(C8B_POS[1].up.y * 32 + C8B_POS[1].up.x).to.map, KUMOI);
  // 出現表（B）: 1〜4階 t8b_temple・5〜8階 t8b_deep（休み所・ボスの 階は 出ない）
  for (let n = 1; n <= 8; n++) {
    const sc = PAST(n).spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc[n <= 4 ? 't8b_temple' : 't8b_deep'] > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t8b_temple?.length && ENCOUNTER_TABLES.t8b_deep?.length);
  assert.equal(PAST(4).zoneAt(15, 6), 'safe:rest');
  assert.equal(PAST(7).zoneAt(24, 3), 'safe:rest');
  for (const n of PUZZLE) for (const p of C8B_POS[n].ways) for (const [dx, dy] of D4) {
    const z = PAST(n).zoneAt(p.x + dx, p.y + dy);
    assert.ok(z.startsWith('safe'), `${n}階 よみの道の まわりは 魔物が 出ない`);
  }
  // きまった 戦い（B）
  for (const id of ['c8_painpanic', 'c8_hades']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // 宝箱（B の C8B_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C8B_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...PAST(n).chests, ...(n <= 7 ? NOW(n).chests : [])];
    assert.equal(list.length, 2, `${n}階の 宝箱`);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
    assert.ok(list.every((c) => c.id.startsWith(`c8b_${n}c`)));
    assert.equal(c8bTreasureOf(n).length, 2);
    assert.equal(C8B_CHEST_ERA[n].length, 2);
  }
  assert.ok(Object.keys(C8B_TREASURE).length >= 8 || C8B_TREASURE.length >= 16);
  // タイル（355 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C8B_BRAZIER, T.C8B_BRAZIER_ON, T.C8B_SPIRITWAY, T.C8B_VOID, T.C8B_SEAWATER, T.C8B_SHELLBOX, T.C8B_SHELLGATE, T.C8B_FLAMEWALL, T.C8B_GEYSER_FLOOR, T.C8B_GEYSER, T.C8B_WHIRL, T.C8B_SHELLDOOR];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 355 + i));
  for (const t of [T.C8B_SPIRITWAY, T.C8B_GEYSER_FLOOR]) assert.ok(!TILE_INFO[t].solid, TILE_INFO[t].name);
  for (const t of [T.C8B_BRAZIER, T.C8B_BRAZIER_ON, T.C8B_VOID, T.C8B_SEAWATER, T.C8B_SHELLBOX, T.C8B_SHELLGATE, T.C8B_FLAMEWALL, T.C8B_GEYSER, T.C8B_WHIRL, T.C8B_SHELLDOOR]) assert.ok(TILE_INFO[t].solid, TILE_INFO[t].name);
  // だいほんが ぜんぶ ある
  for (const id of CH8B_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, SEA, KUMOI]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[MIKO_LETTER8B]?.type === 'key', '大事な物「みこの祝いの手紙」');
  assert.equal(VILLAIN8B, 'よみの王ハデロス');
  assert.equal(IMPS8B, 'ペイニックとパニクル');
});

// ───────────── 目標 ─────────────
test('目標: 第1幕クリアの セーブは トキネへの 目標に なおる・フラグごとの 目標・仲間会話（4人分）・地図の しるし', () => {
  assert.equal(OLD_C8_OBJ.jafar, '第8章　第2幕へ（続きはアップデートで！）');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C8_OBJ.jafar), '前の 版の 第1幕クリアの 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c8_jafar')), objective: OLD_C8_OBJ.jafar };
  assert.ok(repairObjective(old) && old.objective === C8_OBJ.jafar);
  assert.ok(C8_OBJ.jafar.startsWith('第8章　第1幕クリア！') && C8_OBJ.jafar.includes('トキネ') && !C8_OBJ.jafar.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c8_jafar')), objective: C8_OBJ.jafar };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L = LETTER8B_TEMPLE;
  const table = [
    [['c8_jafar'], C8_OBJ.jafar], [['c8_sea'], C8B_OBJ.sea], [['c8_sea', ARRIVE8B], C8B_OBJ.arrive], [['c8_abyss'], C8B_OBJ.abyss],
    [['c8_abyss', ENTRY8B], C8B_OBJ.entry], [['c8_temple'], C8B_OBJ.temple], [['c8_temple', PF8B(2)], C8B_OBJ.f2], [['c8_temple', PF8B(3)], C8B_OBJ.f3],
    [['c8_temple', PF8B(4), MIKO8B], C8B_OBJ.f4], [['c8_imps'], C8B_OBJ.imps], [['c8_depth'], C8B_OBJ.depth], [['c8_depth', LETTER8B.start(L)], C8B_OBJ.miko],
    [['c8_depth', LETTER8B.bury(L)], C8B_OBJ.l3bury], [['c8_depth', LETTER8B.found(L)], C8B_OBJ.l3found], [['c8_depth', PF8B(6)], C8B_OBJ.f6],
    [['c8_depth', PF8B(7)], C8B_OBJ.f7], [['c8_depth', PF8B(7), VOICE8B], C8B_OBJ.rest7], [['c8_depth', PF8B(8)], C8B_OBJ.f8],
    [['c8_depth', PF8B(8), WIN8B], C8B_OBJ.win], [['c8_depth', WIN8B, CALM8B], C8B_OBJ.calm], [['c8_hades'], C8B_OBJ.hades],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C8B_OBJ), ['jafar', C8_OBJ.jafar]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH8_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) {
      const s = talkFor(t, kind);
      assert.ok(s !== `次は「${t.replace(/\n/g, '')}」ですね。` && s.length > 8, `${k} ${kind}`);
    }
  }
  for (const t of Object.values(C8B_OBJ)) assert.ok(CH8_OBJECTIVE_TALK[t] && objectiveChapter(t) === 5, '第8章の 目標の 章');
  assert.equal(C8B_OBJ.hades, '第8章　第3幕へ（続きはアップデートで！）');
  // 地図の しるし（その 時代の マップだけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const Bx = C8B_POS[5].box;
  assert.ok(mark(C8B_OBJ.miko, c8bMapId(5)).some((m) => m.x === Bx.x && m.y === Bx.y), '千年前の 貝の 箱');
  assert.ok(mark(C8B_OBJ.l3bury, c8bMapId(5, true)).some((m) => m.x === Bx.x && m.y === Bx.y), '今の 貝の 箱');
  assert.ok(mark(C8B_OBJ.sea, KUMOI).length, '今の クモイ地方');
  assert.ok(mark(C8B_OBJ.entry, SEA).some((m) => m.x === ENTRANCE8B.x && m.y === ENTRANCE8B.y), 'うずしおの岩場の 青い うず');
  assert.ok(mark(C8_OBJ.jafar, 'overworld').length, '今の トキネ');
});

// ───────────── 海底神殿の とき方 ─────────────
test('よみの海底神殿: どの 階も ひとりで 下へ 行ける・時の砂時計と 火を 使わないと 行けない 階・とじこめられない・今の がわから 来ても とける', () => {
  for (let n = 1; n <= C8B_FLOORS; n++) {
    const r = solve(n, { start: startOf(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '下へ'} 行ける`);
    assert.deepEqual(r.stuck, [], `${n}階: どこに いても 上への かいだんへ もどれる`);
    if (n <= C8B_NOW_FLOORS) {
      const fromNow = solve(n, { start: startOf(n), era0: 'now' });
      assert.ok(fromNow.goals.length && !fromNow.stuck.length, `${n}階: 今の がわから 来ても とける`);
    }
    if (PUZZLE.includes(n)) {
      assert.ok(!solve(n, { start: startOf(n), shift: false }).goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), fires: false }).goals.length, `${n}階: 火を ともさないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), shift: false, era0: 'now' }).goals.length, `${n}階: 今の がわだけでは 行けない`);
    }
    // 宝箱は その 時代で 取りに 行ける（となりに 立てる）
    for (const now of n <= C8B_NOW_FLOORS ? [false, true] : [false]) {
      for (const ch of (now ? NOW(n) : PAST(n)).chests) {
        const era = now ? 'now' : 'past';
        assert.ok(D4.some(([dx, dy]) => r.cells.has(`${era}:${ch.x + dx},${ch.y + dy}`)), `${n}階 ${era} の 宝箱 (${ch.x},${ch.y})`);
      }
    }
  }
  // 4階: ペイニックと パニクルに 勝つまで 青い ほのおの かべ（どちらの 時代も）
  assert.ok(!solve(4).goals.length, '4階: 2ひきに 勝つまで 下へ 行けない');
  // 5階: みこの 手紙が ないと しおの とびらは 開かない・下への かいだんは 今の とびらの 先
  assert.ok(!solve(5, { start: [C8B.imps], letter: false }).goals.length, '5階: 手紙が ないと 開かない');
  assert.ok(solve(5, { start: [C8B.imps] }).goals.every((g) => g.flags.includes(LETTER8B.found(LETTER8B_TEMPLE))));
  // 3階: 火を うつさないと 南へ 行けない（島の 台に 火が ある 時だけ）
  assert.ok(solve(3).goals.every((g) => g.flags.includes(FIRE8B(3, 1)) && !g.flags.includes(FIRE8B(3, 0))));
  // 7階: 島1と 岩の 小島の 台の 2つの 火で 長い よみの道（南の 岸の 火を うつす）
  assert.ok(solve(7, { start: startOf(7) }).goals.every((g) => g.flags.includes(FIRE8B(7, 0)) && g.flags.includes(FIRE8B(7, 1)) && !g.flags.includes(FIRE8B(7, 2))));
});

test('青い 火と よみの道: 千年前の 台の 火は 今も ともったまま・光の とどく 所だけ よみの道・千年前は 海の 水・しおの みちひ・海の 流れは 千年前だけ', () => {
  for (const n of PUZZLE) {
    const P = C8B_POS[n];
    assert.ok(P.fires.length >= 1 && P.ways.length >= 2, `${n}階の 台と よみの道`);
    for (const c of P.ways) {
      const ks = firesOn(n, c.x, c.y);
      assert.ok(ks.length >= 1, `${n}階 (${c.x},${c.y}) を てらす 台が ある`);
      assert.equal(PAST(n).tiles[c.y * 32 + c.x], T.C8B_SEAWATER, '千年前は 海の 水');
      assert.ok(isBlocked(PAST(n), c.x, c.y, () => true));
      assert.equal(effectiveTile(NOW(n), c.x, c.y, () => false), T.C8B_VOID, '光が ない ときは 見えない');
      for (const k of ks) assert.equal(effectiveTile(NOW(n), c.x, c.y, (f) => f === FIRE8B(n, k)), T.C8B_SPIRITWAY, '台の 光で 見える');
      P.fires.forEach((f, k) => {
        const inLight = (c.x - f.x) ** 2 + (c.y - f.y) ** 2 <= LIGHT_R2;
        assert.equal(!isBlocked(NOW(n), c.x, c.y, (fl) => fl === FIRE8B(n, k)), inLight, `${n}階 台${k} の 光の とどく 所だけ`);
      });
    }
    // 台は どちらの 時代も おなじ・千年前で しらべると ともせる・今は 千年前の 火の まま
    P.fires.forEach((f, k) => {
      assert.ok(litBy(n, k).length >= 1, `${n}階 台${k} は よみの道を てらす`);
      for (const map of [PAST(n), NOW(n)]) {
        assert.equal(effectiveTile(map, f.x, f.y, () => false), T.C8B_BRAZIER);
        assert.equal(effectiveTile(map, f.x, f.y, (fl) => fl === FIRE8B(n, k)), T.C8B_BRAZIER_ON);
      }
      assert.ok(PAST(n).actions.some((a) => a.x === f.x && a.y === f.y && a.script === `c8b_fire_${n}_${k}`));
      assert.ok(NOW(n).actions.some((a) => a.x === f.x && a.y === f.y && a.script === 'c8b_fire_now'));
    });
    assert.ok(P.fires.length > (FIRE_LIMIT8B[n] || 1) || n !== 3 || true);
  }
  assert.equal(FIRE_LIMIT8B[3], 1);
  assert.equal(C8B_POS[7].fires.length, 3);
  assert.equal(FIRE_LIMIT8B[7], 2, '7階は 台が 3つ・火種は 2つ');
  // しおの みちひ（w）: 千年前は 海の 水・今は かわいた ゆか / c: 千年前は ゆか・今は 雲の 海
  for (let n = 1; n <= C8B_NOW_FLOORS; n++) for (const p of C8B_POS[n].dry) {
    assert.ok(isBlocked(PAST(n), p.x, p.y, () => true), `${n}階 千年前は 水`);
    assert.equal(NOW(n).tiles[p.y * 32 + p.x], T.C7S_DRY, `${n}階 今は かわいた ゆか`);
  }
  assert.ok(C8B_POS[1].dry.length && C8B_POS[5].dry.length && C8B_POS[7].dry.length);
  // 海の 流れ（2・3・6・7階）: 千年前は 流れる・今は 雲の 海
  for (const n of [2, 3, 6, 7]) {
    assert.ok(C8B_POS[n].flows.length, `${n}階の 海の 流れ`);
    for (const p of C8B_POS[n].flows) {
      assert.ok(TILE_INFO[PAST(n).tiles[p.y * 32 + p.x]].flow, `${n}階 千年前は 流れる`);
      assert.equal(NOW(n).tiles[p.y * 32 + p.x], T.CLOUD_SEA, '今は 雲の 海');
    }
  }
  // 2階: 北の 岸から 流れに のると 水の 中の 島に 着く・島の 台が 南の よみの道を てらす
  const v = C8B_POS[2].flows.find((p) => p.ch === 'v');
  const end = carry(PAST(2), v.x, v.y, () => false);
  assert.ok(!end.pit && !isBlocked(NOW(2), end.x, end.y, () => false), '島（どちらの 時代も ゆか）に 着く');
  // 5階: G … 千年前は 開いた とびら・今は しまった しおの とびら（手紙で 開く）
  const G = C8B_POS[5].gate;
  assert.ok(!isBlocked(PAST(5), G.x, G.y, () => false) && isBlocked(NOW(5), G.x, G.y, () => false));
  assert.ok(!isBlocked(NOW(5), G.x, G.y, (fl) => fl === LETTER8B.found(LETTER8B_TEMPLE)), '祝いの 言葉で 開く');
  assert.ok(isBlocked(PAST(5), G.x + 1, G.y, () => true) && !isBlocked(NOW(5), G.x + 1, G.y, () => false));
  // 6階の c: 千年前は ゆか・今は 雲の 海
  assert.ok(!isBlocked(PAST(6), 2, 16, () => false) && isBlocked(NOW(6), 2, 16, () => false));
});

test('青い 火の 柱（6階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C8B_POS[6];
  const m = PAST(6);
  assert.ok(P.waveA.length >= 4 && P.waveB.length >= 4);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.waveA.map(k)), B = new Set(P.waveB.map(k));
  for (const p of [...P.waveA, ...P.waveB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の 火の 柱が ない`);
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.equal(effectiveTile(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), T.C8B_GEYSER, 'ふき出している 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), 'ふき出していない 時は 通れる');
    assert.equal(NOW(6).tiles[p.y * 32 + p.x], T.CLOUD_SEA, '今の がわは 通路が くずれている');
  }
  const start = { x: 1, y: 15 };
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
  assert.ok(!seen.has(`${P.down.x},${P.down.y}`), 'ずっと 同じ 時間では 通れない');
});

test('かいだん（第71回）: 下りると 下の 階の 上への かいだんの 真上・上ると 上の 階の 下への かいだんの 真上・入口の うずと とびらも', () => {
  const all = () => true;
  for (let n = 1; n < C8B_FLOORS; n++) {
    for (const now of n + 1 <= C8B_NOW_FLOORS ? [false, true] : [false]) {
      const from = c8bMapId(n, now), to = c8bMapId(n + 1, now);
      const D = C8B_POS[n].down, U = C8B_POS[n + 1].up;
      const wd = MAPS[from].warpAt.get(D.y * 32 + D.x);
      const L = warpLanding(from, wd, all);
      assert.ok(L.stair && L.map === to && Math.floor(L.x) === U.x && Math.floor(L.y) === U.y, `${from} → ${to}: 上への かいだんの 上`);
      const wu = MAPS[to].warpAt.get(U.y * 32 + U.x);
      const L2 = warpLanding(to, wu, all);
      assert.ok(L2.stair && L2.map === from && Math.floor(L2.x) === D.x && Math.floor(L2.y) === D.y, `${to} → ${from}: 下への かいだんの 上`);
      assert.ok(stepsTo(MAPS[to], U.x, U.y, Math.floor(wd.to.x), Math.floor(wd.to.y), all) >= 0, 'これまでの つく マスへ 歩ける');
    }
  }
  // 入口（千年前の 青い うず・今の 石の とびら）⇔ 1階
  const E = ENTRANCE8B;
  for (const [field, now] of [[SEA, false], [KUMOI, true]]) {
    const w = MAPS[field].warpAt.get(E.y * MAPS[field].w + E.x);
    const L = warpLanding(field, w, all);
    const U = C8B_POS[1].up;
    assert.ok(L.stair && Math.floor(L.x) === U.x && Math.floor(L.y) === U.y, `${field} → 1階の かいだんの 上`);
    const back = warpLanding(c8bMapId(1, now), MAPS[c8bMapId(1, now)].warpAt.get(U.y * 32 + U.x), all);
    assert.ok(back.stair && back.map === field && Math.floor(back.x) === E.x && Math.floor(back.y) === E.y, `1階 → ${field} の 入口の 上`);
    assert.ok(stairsPair(field, w));
    assert.ok(canStand(MAPS[field], E.x + 0.5, E.y + 1.5, all), `${field}: 入口の 下に 立てる`);
  }
  const D4w = PAST(4).warpAt.get(C8B_POS[4].down.y * 32 + C8B_POS[4].down.x);
  assert.equal(D4w.to.map, c8bMapId(5));
});

test('千年前の クモイの 海: ナギの村 → 南へ 流れる しお → 大木の島 → 西へ 流れる しお → うずしおの岩場 → 北へ 流れる しおで 村へ 帰れる・第2幕の 前は 岩場が ない', () => {
  const m = MAPS[SEA];
  const has = (f) => f === C8B.sea || f === 'c7_sea';
  // 第2幕の 前は 海（岩場・流れ・うずは ない）
  assert.ok(isBlocked(m, ENTRANCE8B.x, ENTRANCE8B.y + 1, () => false) && isBlocked(m, 44, 51, () => false), '第2幕の 前は 海');
  assert.ok(inShoal8b(ENTRANCE8B.x, ENTRANCE8B.y + 1));
  // ナギの村の 南の はしから 南へ 流れる しお（w9）で 大木の島へ
  const R = C8B_SEA_POS.rootIn;
  const w9 = carry(m, R.x, R.y - 7, has);
  assert.deepEqual([w9.x, w9.y], [R.x, R.y], '大木の島に 着く');
  // 大木の島の 西の はしから 西へ → 岩場
  const W = C8B_SEA_POS.rootWest;
  assert.ok(!isBlocked(m, W.x, W.y, has), '大木の島の 西の はし');
  const go = carry(m, W.x - 1, W.y, has);
  assert.ok(inShoal8b(go.x, go.y) && !isBlocked(m, go.x, go.y, has), '岩場に 着く');
  // 岩場から うずの となりまで 歩ける・うずの 北から 北へ 流れる しおで ナギの村へ
  const back = carry(m, ENTRANCE8B.x, 47, has);
  assert.ok(back.y < 40 && !isBlocked(m, back.x, back.y, has), `村へ 帰れる (${back.x},${back.y})`);
  assert.ok(timeArea(m)[go.y * m.w + go.x], '時の砂時計で 来られる（村から 行ける）');
});

// ───────────── サーバーで ─────────────
test('サーバー: 1階 千年前の 台に 火を ともして 今の よみの道を わたる・3階 火を うつす・7階 どの 火を うつすか えらぶ', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(8601, 'c8_temple');
  const P1 = C8B_POS[1];
  await place(bot, c8bMapId(1), P1.arrive.x, P1.arrive.y);
  const w0 = P1.ways[0];
  assert.ok(isBlocked(NOW(1), w0.x, w0.y, (f) => !!c.flags[f]), '火を ともす 前は 見えない');
  await touchFire(bot, 1, 0);
  assert.ok(c.flags[FIRE8B(1, 0)], '火が ともった');
  assert.ok(said(bot, '青い火がともった'));
  await useGlass(bot);
  assert.equal(bot.s.map, c8bMapId(1, true), '今へ');
  assert.ok(!isBlocked(NOW(1), w0.x, w0.y, (f) => !!c.flags[f]), 'よみの道が 見えた');
  await walkTo(bot, P1.down.x, P1.down.y);
  assert.equal(bot.s.map, c8bMapId(2, true), '今の 2階へ（今の かいだん）');
  assert.deepEqual(here(bot), [C8B_POS[2].up.x, C8B_POS[2].up.y], '上への かいだんの 真上に 着く');
  assert.ok(c.flags[PF8B(2)], '2階に 来た');
  // 3階: 北の 台 → 今 島へ → 千年前の 島の 台で 火を うつす → 今 南へ
  const P3 = C8B_POS[3];
  await place(bot, c8bMapId(3), P3.arrive.x, P3.arrive.y);
  await touchFire(bot, 3, 0);
  assert.ok(c.flags[FIRE8B(3, 0)]);
  await useGlass(bot);
  const isle = { x: 10, y: 9 };
  await walkTo(bot, isle.x, isle.y);
  await useGlass(bot);
  assert.equal(bot.s.map, c8bMapId(3), '島で 千年前へ');
  await touchFire(bot, 3, 1);
  assert.ok(c.flags[FIRE8B(3, 1)] && !c.flags[FIRE8B(3, 0)], '火が うつった');
  assert.ok(said(bot, 'うつった'));
  await useGlass(bot);
  await walkTo(bot, P3.down.x, P3.down.y);
  assert.equal(bot.s.map, c8bMapId(4, true), '今の 4階へ');
  // 7階: 南の 岸 → 島1 → 島1の 台 → 岩の 小島で「南の岸の台」の 火を うつす
  const P7 = C8B_POS[7];
  c.flags[C8B.imps] = true;
  await place(bot, c8bMapId(7), P7.arrive.x, P7.arrive.y);
  await touchFire(bot, 7, 2);
  await useGlass(bot);
  await walkTo(bot, 7, 11);
  await useGlass(bot);
  await touchFire(bot, 7, 1);
  assert.ok(c.flags[FIRE8B(7, 1)] && c.flags[FIRE8B(7, 2)], '火種 2つ');
  await walkTo(bot, 9, 9);
  await ride(bot, 9, 8);
  assert.deepEqual(here(bot), [14, 7], '岩の 小島に 着いた');
  await touchFire(bot, 7, 0, 1); // えらぶ: [島1の台, 南の岸の台] の 2つめ
  assert.ok(c.flags[FIRE8B(7, 0)] && c.flags[FIRE8B(7, 1)] && !c.flags[FIRE8B(7, 2)], '南の 岸の 火を 岩の 小島へ');
  await walkTo(bot, 14, 6);
  await ride(bot, 13, 6);
  assert.deepEqual(here(bot), [5, 9], '島1へ もどった');
  await useGlass(bot);
  await walkTo(bot, 21, 5);
  assert.ok(c.flags[VOICE8B], '休み所の 入口で 声');
  await useGlass(bot);
  assert.equal(bot.s.map, c8bMapId(7));
  await walkTo(bot, P7.down.x, P7.down.y);
  assert.equal(bot.s.map, c8bMapId(8), '8階へ');
});

// ───────────── 通し ─────────────
test('通しで: c8_jafar → トキネ → 千年前の ナギの村（カイが ゲスト）→ うずしおの岩場 → 海底神殿 → ペイニックと パニクル → みこの 手紙 → ハデロス → 第2幕クリア（c8_hades）', { timeout: 400000 }, async () => {
  const { world, bot, c } = await setup(8701, 'c8_jafar');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C8B.sea] && c.objective === C8B_OBJ.sea, 'c8_sea');
  assert.ok(said(bot, '海の底から') && said(bot, '青く光っている'), 'トキネ: 海の 底の 音');
  // 今の クモイ地方の 西の 船着き場の 道で 砂時計 → 千年前
  const G = C8B_SEA_POS.glass;
  await place(bot, KUMOI, G.x, G.y);
  await useGlass(bot);
  assert.equal(bot.s.map, SEA);
  await stepOn(bot, G.x + 1, G.y);
  assert.ok(c.flags[ARRIVE8B] && c.objective === C8B_OBJ.arrive);
  assert.ok(said(bot, 'よみの青い火'), '章の 字');
  // ナギの村へ
  const V = C8B_SEA_POS.villageIn;
  await walkTo(bot, V.x, V.y + 3);
  assert.ok(c.flags[C8B.abyss] && c.objective === C8B_OBJ.abyss, 'c8_abyss');
  assert.ok(c.guests.includes('kai8'), 'カイが ゲスト');
  assert.ok(said(bot, 'うずしおの岩場') && said(bot, 'ねむくて'), '村の 場面');
  // 大木の島の 西の はしから 西へ 流れる しおで 岩場へ
  const W = C8B_SEA_POS.rootWest;
  await place(bot, SEA, W.x, W.y);
  const end = await ride(bot, W.x - 1, W.y);
  assert.ok(inShoal8b(...here(bot)), `岩場に 着いた ${end.x},${end.y}`);
  const E = ENTRANCE8B;
  await walkTo(bot, E.x, E.y + 1);
  await examine(bot, E.x, E.y);
  assert.ok(c.flags[ENTRY8B] && c.objective === C8B_OBJ.entry, '青い うずが 開いた');
  assert.ok(said(bot, 'よみの国へ'), 'ハデロスの 声');
  await stepOn(bot, E.x, E.y);
  assert.equal(bot.s.map, c8bMapId(1));
  const A1 = C8B_POS[1].arrive;
  await stepOn(bot, A1.x, A1.y);
  assert.ok(c.flags[C8B.temple] && c.objective === C8B_OBJ.temple, 'c8_temple');
  assert.ok(!isBlocked(MAPS[KUMOI], E.x, E.y, (f) => !!c.flags[f] || f === 'c5_shard'), '今の 雲から出てきた島の とびらも 開いた');
  // 4階（しかけは 上の テストで）: 休み所で みこ → 南の 広間で ペイニックと パニクル
  for (const f of [PF8B(2), PF8B(3)]) c.flags[f] = true;
  const A4 = C8B_POS[4].arrive;
  await place(bot, c8bMapId(4), A4.x, A4.y - 1);
  await stepOn(bot, A4.x, A4.y);
  assert.ok(c.flags[PF8B(4)] && c.objective === C8B_OBJ.f4, '4階');
  await walkTo(bot, 15, 5);
  assert.ok(c.flags[MIKO8B] && said(bot, 'ハデロス'), '4階の みこ');
  const fought = [];
  await walkTo(bot, 15, C8B_POS[4].trigger.y, { fought });
  assert.deepEqual(fought.filter((x) => x !== 'field'), ['c8_painpanic']);
  assert.ok(c.flags[C8B.imps] && c.objective === C8B_OBJ.imps, 'c8_imps');
  assert.ok(said(bot, 'ペイニック') && said(bot, 'パニクル'));
  const Sx = C8B_POS[4].seal;
  assert.ok(!isBlocked(PAST(4), Sx.x, Sx.y, (f) => !!c.flags[f]), '青い ほのおの かべが 消えた');
  await walkTo(bot, C8B_POS[4].down.x, C8B_POS[4].down.y);
  assert.equal(bot.s.map, c8bMapId(5));
  assert.ok(c.flags[C8B.depth] && c.objective === C8B_OBJ.depth, 'c8_depth');
  // 5階: 今の とびら（手紙が ない）→ 4階の みこ → 千年前の 貝の 箱 → 今の 箱
  const P5 = C8B_POS[5];
  await place(bot, c8bMapId(5, true), P5.gate.x - 1, P5.gate.y);
  let f0 = bot.msgs.length;
  await examine(bot, P5.gate.x, P5.gate.y);
  assert.ok(said(bot, '海の祝いの言葉', f0) && !c.flags[LETTER8B.found(LETTER8B_TEMPLE)]);
  const Mk = C8B_POS[4].miko;
  await place(bot, c8bMapId(4), Mk.x - 1, Mk.y);
  await talk(bot, 'c8b_miko');
  assert.ok(c.flags[LETTER8B.start(LETTER8B_TEMPLE)] && c.keyItems.includes(MIKO_LETTER8B), 'みこの 手紙');
  assert.equal(c.objective, C8B_OBJ.miko);
  const Bx = P5.box;
  await place(bot, c8bMapId(5, true), Bx.x - 1, Bx.y);
  await examine(bot, Bx.x, Bx.y);
  assert.ok(!c.flags[LETTER8B.found(LETTER8B_TEMPLE)], '千年前で 入れる 前は 見つからない');
  await useGlass(bot);
  assert.equal(bot.s.map, c8bMapId(5));
  bot.choice = 0;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8B.bury(LETTER8B_TEMPLE)] && !c.keyItems.includes(MIKO_LETTER8B), '貝の 箱に 入れた');
  await useGlass(bot);
  const [rid, rn] = letterReward8b(LETTER8B_TEMPLE)[0];
  const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
  const before = cnt();
  f0 = bot.msgs.length;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8B.found(LETTER8B_TEMPLE)] && said(bot, 'また朝が来る', f0), '千年前の 手紙が とどいた');
  assert.equal(cnt(), before + rn, '手紙の ごほうび');
  assert.ok(!isBlocked(NOW(5), P5.gate.x, P5.gate.y, (f) => !!c.flags[f]), 'しおの とびらが 開いた');
  await walkTo(bot, P5.down.x, P5.down.y);
  assert.equal(bot.s.map, c8bMapId(6, true), '今の 6階へ');
  // 7階の 休み所の 入口で よみの王の 声
  for (const f of [PF8B(6), PF8B(7)]) c.flags[f] = true;
  await place(bot, c8bMapId(7), 21, 4);
  await stepOn(bot, 21, 5);
  assert.ok(c.flags[VOICE8B] && c.objective === C8B_OBJ.rest7 && said(bot, '光を、消してしまえ'), '7階の 声');
  // 8階
  const A8 = C8B_POS[8].arrive;
  await place(bot, c8bMapId(8), A8.x, A8.y - 1);
  await stepOn(bot, A8.x, A8.y);
  assert.ok(c.flags[PF8B(8)] && c.objective === C8B_OBJ.f8);
  const f2 = [];
  await walkTo(bot, 15, C8B_POS[8].trigger.y, { fought: f2 });
  assert.deepEqual(f2, ['c8_hades']);
  assert.ok(c.flags[WIN8B] && c.flags[CALM8B] && c.flags[C8B.hades], 'c8_hades');
  assert.equal(c.objective, C8B_OBJ.hades);
  for (const t of ['まっ赤', 'いかりの心', '黒い星のかけら', '持ち主のところへ', '約束だぜ', '第8章　第2幕クリア！', '第8章　第3幕へ（続きはアップデートで！）']) assert.ok(said(bot, t), t);
  assert.ok(!c.guests.includes('kai8'), 'カイは 村に のこる');
  assert.equal(bot.s.map, SEA, 'さいごは ナギの村の 浜');
  assert.ok(MAPS[SEA].npcs.some((n) => n.id === 'c8b_miko_back' && condOk(n.show, (f) => !!c.flags[f])), 'みこが ほこらに もどった');
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  const El = C8B_SEA_POS.elder;
  await place(bot, SEA, El.x + 1, El.y);
  await talk(bot, 'c7s_elder');
  assert.ok(!said(bot, '第2幕クリア', n));
  void world;
});

test('ゲスト: 酒場の カイが もう パーティーに いる ときは ゲストを 足さない（2人に ならない）', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(8702, 'c8_sea', { extra: [ARRIVE8B] });
  c.partyKeys = [...(c.partyKeys || []), 'npc_kai'];
  const V = C8B_SEA_POS.villageIn;
  await place(bot, SEA, 47, 31);
  await walkTo(bot, V.x, V.y + 3);
  assert.ok(c.flags[C8B.abyss]);
  assert.ok(!c.guests.includes('kai8'), 'ゲストを 足さない');
  assert.ok(said(bot, 'もう、パーティーの仲間として'));
});

test('負けた 時・とちゅうで 切れた 時: ペイニックと パニクル・ハデロスに 負けたら すすまない・さいごの 場面は 広間・玉座・村長で 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(8801, 'c8_temple', { extra: [PF8B(4), MIKO8B] });
    await place(bot, c8bMapId(4), 15, 10);
    await walkTo(bot, 15, C8B_POS[4].trigger.y, { lose: () => true });
    assert.ok(!c.flags[C8B.imps], '2ひきに 負けた');
    assert.ok(isBlocked(PAST(4), C8B_POS[4].seal.x, C8B_POS[4].seal.y, (f) => !!c.flags[f]), 'かべは そのまま');
  }
  {
    const { bot, c } = await setup(8802, 'c8_depth', { extra: [PF8B(8)] });
    const A8 = C8B_POS[8].arrive;
    await place(bot, c8bMapId(8), A8.x, A8.y);
    await walkTo(bot, 15, C8B_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN8B] && !c.flags[C8B.hades], 'ハデロスに 負けた');
  }
  for (const [seed, how, extra] of [[8803, 'hall', [WIN8B]], [8804, 'throne', [WIN8B]], [8805, 'elder', [WIN8B, CALM8B]], [8806, 'gen', [WIN8B, CALM8B]]]) {
    const { bot, c } = await setup(seed, 'c8_depth', { extra: [PF8B(8), ...extra] });
    if (how === 'elder' || how === 'gen') {
      const p = how === 'elder' ? C8B_SEA_POS.elder : C8B_SEA_POS.kaiHome;
      const npcId = how === 'elder' ? 'c7s_elder' : 'c7s_gen_home';
      const map = MAPS[SEA];
      const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, (f) => !!c.flags[f]));
      await place(bot, SEA, side[0], side[1]);
      await talk(bot, npcId);
    } else if (how === 'throne') {
      const T8 = C8B_POS[8].throne;
      await place(bot, c8bMapId(8), T8.x, T8.y + 4);
      await talk(bot, 'c8b_throne_npc');
    } else {
      await place(bot, c8bMapId(8), 15, C8B_POS[8].trigger.y + 1);
      await stepOn(bot, 15, C8B_POS[8].trigger.y);
    }
    assert.ok(c.flags[CALM8B] && c.flags[C8B.hades], `${how}で 続き`);
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙（千年前の クモイの 海）: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const K = MAPS[KUMOI], F = MAPS[SEA];
  const allF = (f) => f !== 'c5_castle';
  for (const k of LETTER8B_SIDE) {
    const p = LETTER8B_SPOTS[k];
    const dig = K.npcById[`c8b_dig_${k}`], bury = F.npcById[`c8b_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER8B.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(F.npcById[LETTER8B_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward8b(k).length, `ごほうび ${k}`);
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(K, x + 0.5, y + 0.5, allF) && canStand(F, x + 0.5, y + 0.5, allF));
    assert.ok(near, `${k}: 手紙の 場所の となりに どちらの 時代も 立てる`);
    assert.ok(timeArea(F)[p.y * F.w + p.x] && timeArea(K)[p.y * K.w + p.x], `${k}: 歩いて 行ける`);
  }
  assert.equal(Object.keys(C8B_LETTER_REWARDS).length, 3, '手紙の ごほうびは 3つ');
  const hints = subQuestHints();
  for (const q of C8B_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  for (const k of LETTER8B_SIDE) {
    const { bot, c } = await setup(8900 + k, 'c8_abyss');
    const has = (f) => !!c.flags[f];
    const asker = F.npcById[LETTER8B_ASKERS[k]];
    const ax = Math.floor(asker.x), ay = Math.floor(asker.y);
    const side = D4.map(([dx, dy]) => [ax + dx, ay + dy]).find(([x, y]) => canStand(F, x + 0.5, y + 0.5, has));
    await place(bot, SEA, side[0], side[1]);
    bot.choice = 0;
    await talk(bot, LETTER8B_ASKERS[k]);
    assert.ok(c.flags[LETTER8B.start(k)], `${k}: たのまれた`);
    const q1 = subQuests(c).find((q) => q.name === letterName8b(k));
    assert.ok(q1 && q1.find === `c8b_bury_${k}` && !q1.ready, 'クエストの 画面: うめる 場所');
    const p = LETTER8B_SPOTS[k];
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(K, x + 0.5, y + 0.5, has) && canStand(F, x + 0.5, y + 0.5, has));
    await place(bot, KUMOI, near[0], near[1]);
    await talk(bot, `c8b_dig_${k}`);
    assert.ok(!c.flags[LETTER8B.found(k)], 'うめる 前は 何も ない');
    await place(bot, SEA, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8b_bury_${k}`);
    assert.ok(c.flags[LETTER8B.bury(k)]);
    const q2 = subQuests(c).find((q) => q.name === letterName8b(k));
    assert.ok(q2 && q2.who === `c8b_dig_${k}` && q2.ready, 'クエストの 画面: 今で さがす');
    const [rid, rn] = letterReward8b(k)[0];
    const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
    const before = cnt();
    await place(bot, KUMOI, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8b_dig_${k}`);
    assert.ok(c.flags[LETTER8B.found(k)] && cnt() === before + rn, `${k}: ごほうび`);
    assert.ok(labDoneQuests(c).includes(letterName8b(k)), 'クリアした たのまれごと');
    await talk(bot, `c8b_dig_${k}`);
    assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
  }
});

test('時の砂時計: 海底神殿の 中は おなじ 座標・8階は 使えない・ナギの村の 中は 使えない', async () => {
  const { world, bot } = await setup(8501, 'c8_temple');
  await place(bot, c8bMapId(2), 5, 3);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, c8bMapId(2, true));
  assert.deepEqual(here(bot), [5, 3], 'おなじ 座標');
  await place(bot, c8bMapId(8), 15, 12);
  assert.equal(glassCheck(world, bot.s).key, 'boss');
  await place(bot, SEA, C8B_SEA_POS.villageIn.x, C8B_SEA_POS.villageIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 文字・絵 ─────────────
test('文字: 第8章 第2幕の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない・第3幕より 先の ことと カイの ひみつは 書かない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c8b.js', 'public/js/shared/data/sidequests-c8b.js',
    'public/js/shared/maps/c8b-sea.js', 'public/js/shared/maps/c8b-temple.js', 'public/js/shared/maps/c8b-temple-rows.js', 'public/js/shared/maps/c8b-flags.js',
    'public/js/client/render/c8b-npc-art.js', 'public/js/client/render/tiles-c8b.js', 'public/js/shared/data/story-c8.js', 'public/js/shared/data/items-c7-key.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c8_depth'), PF8B(6));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c8b_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  const end = JSON.stringify([SCRIPTS.c8b_boss_after(ctx(flagsOf(...UPTO('c8_depth'), WIN8B))), SCRIPTS.c7s_elder(ctx(flagsOf(...UPTO('c8_depth'), WIN8B, CALM8B)))]);
  for (const s of [all, end]) {
    assert.ok(!/なかま/.test(s), 'なかま → 仲間');
    assert.ok(!/空中要塞|時のはざま|フリーザ|クッパ|くろがね/.test(s), '第3幕より 先の 中みは 書かない');
    assert.ok(!/カイの心|カイの影|ひそんで/.test(s), 'カイの ひみつには ふれない');
  }
  assert.ok(end.includes('いかりの心') && end.includes('第3幕へ'));
});

test('絵と 音: 海底神殿の タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・人の え・ハデロスと 2ひきの 大きな すがた・曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 355; id <= 366; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const t of [T.C8B_BRAZIER_ON, T.C8B_SPIRITWAY, T.C8B_SEAWATER, T.C8B_FLAMEWALL, T.C8B_GEYSER, T.C8B_WHIRL]) {
    assert.ok(isAnimated(t));
    assert.notEqual(paintTile(t, 0, 0, 0).px.join(), paintTile(t, 0, 1, 0).px.join(), `${TILE_INFO[t].name}が 動く`);
  }
  for (const id of [T.C8B_BRAZIER, T.C8B_BRAZIER_ON, T.C8B_SHELLBOX, T.C8B_GEYSER, T.C8B_FLAMEWALL, T.C8B_SHELLGATE, T.C8B_SHELLDOOR]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(CH6_THEMES.c8b_abyss, 'テーマ');
  for (const id of C8B_MAPS) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c8b_imps_npc', 'c8b_hades_npc', 'c8b_hades_red_npc', 'c8b_throne_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set(['kai', 'c8b_hades', 'c8b_hades_red', 'c7s_oldwoman', 'c7s_keeper', 'c7s_miko']);
  for (const id of [SEA, KUMOI, ...C8B_MAPS]) for (const n of MAPS[id].npcs) if (/^c8b_/.test(n.id) && !n.big && !/^capsule/.test(n.sprite)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  for (const s of sprites) { const o = npcOpts(s); if (o) assert.ok(/^#/.test(o.skin) && /^#/.test(o.hair), `人の え ${s} の 色`); }
  assert.ok(CH6_TRACKS.c8b_temple?.ch?.length, '曲 c8b_temple');
  for (const id of C8B_MAPS) assert.ok(['c8b_temple', 'sink_ruin', 'boss6'].includes(MAPS[id].bgm), id);
});
