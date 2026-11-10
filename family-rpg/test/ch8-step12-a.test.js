// 第2部 第8章 第1幕「月の王宮のうらぎり」Step 1・2（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// c7_clear → 今の トキネ（c8_start）→ 今の コガネ地方で 時の砂時計 → 千年前の 緑の王国（c8_kingdom・カリムが ゲスト）
// → 王の間の 月の 石板 → 月の王宮の地下迷宮 1〜8階（c8_moon）→ 4階 オウムのイアゴン（c8_pet）→ 5階より 下へ（c8_deep）→ 大臣ジャハール（c8_jafar）
// 月の 光と かげ（千年前の 鏡の むき → 今の 光の 橋）・流れる 砂・砂の 滝・時をこえる手紙（より道 2つ・5階の なぞとき）。戦いの 中みは B。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C8, ARRIVE8, ENTRY8, PF8, NADIA4, VOICE7, WIN8, KING8, MIRROR8, LETTER8, LETTER8_SIDE, LETTER8_PALACE, NADIA_LETTER,
  STAIR8, c8aMapId, C8A_FLOORS, C8A_NOW_FLOORS, C8A_REST,
} from '../public/js/shared/maps/c8a-flags.js';
import { CH8A_MAPS } from '../public/js/shared/maps/c8.js';
import { C8A_POS, C8A_MAPS, c8aArrive, c8aTreasureOf, C8A_CHEST_ERA, bridgeOf } from '../public/js/shared/maps/c8a-palace.js';
import { LETTER8_SPOTS, LETTER8_ASKERS, C8A_FIELD_POS } from '../public/js/shared/maps/c8a-field.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { OLD_C7_OBJ } from '../public/js/shared/data/story-c7.js';
import { C7I_OBJ } from '../public/js/shared/data/story-c7i.js';
import { CH8_STEPS, C8_OBJ, CH8_STORY_SCRIPTS, CH8_OBJECTIVE_TARGETS, CH8_OBJECTIVE_TALK, VILLAIN8, PET8 } from '../public/js/shared/data/story-c8.js';
import { C8A_SIDE_QUESTS, letterReward8, letterName8 } from '../public/js/shared/data/sidequests-c8a.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor, objectiveChapter } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
// 宝箱の 中み・手紙の ごほうび（B の data/items-c8a.js。まとめる 時に そちらから）
import { C8A_TREASURE, C8A_LETTER_REWARDS } from '../public/js/shared/data/items-c8a.js';
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
const PAST = (n) => MAPS[c8aMapId(n)];
const NOW = (n) => MAPS[c8aMapId(n, true)];
const FIELD = 'c7_field';

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto = 'c7_clear', { extra = [], frac = 0.2 } = {}) {
  const clock = { now: at(frac) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(upto)) c.flags[f] = true;
  for (const f of extra) c.flags[f] = true;
  // 第7章で はじめて 千年前の コガネ地方に 来た しるし（物語の すすみぐあいでは ない フラグ）
  c.flags.c7_arrive = true;
  if (!c.keyItems.includes(TIME_GLASS)) c.keyItems.push(TIME_GLASS);
  c.guests = [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 82);
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
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人・流れる 砂を さける。砂の 滝は 時計を すすめて 待つ）
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
// 鏡を 回す（千年前。となりに 立って しらべて「回す」）
async function turnMirror(bot, n, k) {
  const m = C8A_POS[n].mirrors[k];
  const map = MAPS[bot.s.map];
  const side = D4.map(([dx, dy]) => [m.x + dx, m.y + dy]).find(([x, y]) => canStand(map, x + 0.5, y + 0.5, () => false));
  await walkTo(bot, side[0], side[1]);
  bot.choice = 0;
  await examine(bot, m.x, m.y);
}

// ───────────── 地下迷宮の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ（鏡の むき・手紙）・砂の 滝の 時間（0 … a が ふる / 1 … b が ふる）
// うごき … 歩く（流れる 砂は 矢じるしの むきへ 流される）・待つ（6階。どちらの 時間でも ふさがらない マスだけ）・
//   時の砂時計（その マスに 向こうの 時代で 立てる とき）・鏡を 回す（千年前で となりに 立つ）・5階の 月の 箱（千年前で 手紙を 入れる → 今で 読む）
// はじめは 上への かいだんの 上（第71回: 上の 階から 下りると 上への かいだんの 真上に 着く）
function solve(n, { start = [], shift = true, letter = true, mirrors = true, era0 = 'past' } = {}) {
  const P = C8A_POS[n];
  const past = PAST(n), now = n <= C8A_NOW_FLOORS ? NOW(n) : null;
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
    if (mirrors && s.era === 'past') {
      P.mirrors.forEach((m, k) => {
        if (!near(m)) return;
        const f = MIRROR8(n, k);
        push({ ...s, flags: s.flags.includes(f) ? s.flags.filter((x) => x !== f) : [...s.flags, f] });
      });
    }
    if (near(P.box)) {
      const L = LETTER8_PALACE;
      if (s.era === 'past' && letter && !has(LETTER8.bury(L))) push({ ...s, flags: [...s.flags, LETTER8.bury(L)] });
      if (s.era === 'now' && has(LETTER8.bury(L)) && !has(LETTER8.found(L))) push({ ...s, flags: [...s.flags, LETTER8.found(L)] });
    }
    edges.set(key(s), out);
  }
  // どこに いても、上への かいだん（はじめの 所）へ もどれるか（流れる 砂・鏡・砂の 滝で とじこめられない）
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
const startOf = (n) => (n === 4 || n >= 5 ? [C8.pet] : []);

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch8.md の 5-2）: 物語の すすみ・マップの ID・出現表・きまった 戦い・宝箱・タイル', () => {
  assert.deepEqual(CH8_STEPS, ['c8_start', 'c8_kingdom', 'c8_moon', 'c8_pet', 'c8_deep', 'c8_jafar']);
  const ci = STORY_STEPS.indexOf('c7_clear');
  assert.deepEqual(STORY_STEPS.slice(ci + 1, ci + 7), CH8_STEPS, 'c7_clear の うしろ');
  // マップ（千年前 1〜8階・今 1〜7階）
  const want = [...Array.from({ length: 8 }, (_, i) => `c8a_palace_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c8a_palace_${i + 1}f_now`)];
  assert.deepEqual(CH8A_MAPS, want);
  assert.deepEqual(C8A_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c8a'), 'マップの 名前の 先頭は c8a');
    assert.ok(m.kind === 'dungeon');
  }
  for (let n = 1; n <= 8; n++) {
    const m = PAST(n);
    assert.ok(m.past && m.name.startsWith('月の王宮の地下迷宮'), `${n}階`);
    if (n <= C8A_NOW_FLOORS) {
      assert.equal(m.timePair, c8aMapId(n, true));
      assert.equal(NOW(n).timePair, c8aMapId(n));
      assert.deepEqual([m.w, m.h], [NOW(n).w, NOW(n).h], 'おなじ 大きさ');
      assert.ok(NOW(n).name.startsWith('サファラの宮殿の地下'));
      // 今の がわにも かいだんが ある（今の 7階の 下は がれき）
      assert.ok(NOW(n).warps.some((w) => w.x === C8A_POS[n].up.x && w.y === C8A_POS[n].up.y), `今の ${n}階の 上への かいだん`);
      assert.equal(NOW(n).warps.some((w) => w.x === C8A_POS[n].down.x && w.y === C8A_POS[n].down.y), n < 7, `今の ${n}階の 下への かいだん`);
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  assert.deepEqual(C8A_REST, [4, 7]);
  // 入口: 千年前の 王の間の 月の 石板（王家の たてで 開く）・今の 宮殿の 王の間の おなじ 所（c8_moon の あと）
  const F = MAPS[FIELD], S = MAPS.south;
  for (const [m, flag, to] of [[F, ENTRY8, c8aMapId(1)], [S, C8.moon, c8aMapId(1, true)]]) {
    const w = m.warpAt.get(STAIR8.y * m.w + STAIR8.x);
    assert.equal(w.to.map, to);
    assert.ok(isBlocked(m, STAIR8.x, STAIR8.y, () => false), '石板は しまっている');
    assert.equal(effectiveTile(m, STAIR8.x, STAIR8.y, (f) => f === flag), T.STAIRS_DOWN, '開くと かいだん');
  }
  assert.equal(PAST(1).warpAt.get(C8A_POS[1].up.y * 32 + C8A_POS[1].up.x).to.map, FIELD);
  assert.equal(NOW(1).warpAt.get(C8A_POS[1].up.y * 32 + C8A_POS[1].up.x).to.map, 'south');
  // 出現表（B）: 1〜4階 t8a_palace・5〜8階 t8a_deep（休み所・ボスの 階は 出ない）
  for (let n = 1; n <= 8; n++) {
    const sc = PAST(n).spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc[n <= 4 ? 't8a_palace' : 't8a_deep'] > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t8a_palace?.length && ENCOUNTER_TABLES.t8a_deep?.length);
  assert.equal(PAST(4).zoneAt(15, 6), 'safe:rest');
  assert.equal(PAST(7).zoneAt(24, 3), 'safe:rest');
  for (const n of [1, 2, 3, 5, 6, 7]) for (const p of C8A_POS[n].bridges) for (const [dx, dy] of D4) {
    const z = PAST(n).zoneAt(p.x + dx, p.y + dy);
    assert.ok(z.startsWith('safe'), `${n}階 光の 橋の まわりは 魔物が 出ない`);
  }
  // きまった 戦い（B）
  for (const id of ['c8_vizier_pet', 'c8_jafar']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // 宝箱（B の C8A_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C8A_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...PAST(n).chests, ...(n <= 7 ? NOW(n).chests : [])];
    assert.equal(list.length, 2, `${n}階の 宝箱`);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
    assert.ok(list.every((c) => c.id.startsWith(`c8a_${n}c`)));
    assert.equal(c8aTreasureOf(n).length, 2);
    assert.equal(C8A_CHEST_ERA[n].length, 2);
  }
  assert.ok(Object.keys(C8A_TREASURE).length >= 8 || C8A_TREASURE.length >= 16);
  // タイル（343 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C8A_MIRROR_A, T.C8A_MIRROR_B, T.C8A_LIGHT, T.C8A_DARKBRIDGE, T.C8A_SANDRIVER, T.C8A_DUNE, T.C8A_MOONBOX, T.C8A_MOONGATE, T.C8A_SHADOWSEAL, T.C8A_FALL_FLOOR, T.C8A_SANDFALL, T.C8A_SLAB];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 343 + i));
  for (const t of [T.C8A_LIGHT, T.C8A_FALL_FLOOR]) assert.ok(!TILE_INFO[t].solid, TILE_INFO[t].name);
  for (const t of [T.C8A_MIRROR_A, T.C8A_MIRROR_B, T.C8A_DARKBRIDGE, T.C8A_SANDRIVER, T.C8A_DUNE, T.C8A_MOONBOX, T.C8A_MOONGATE, T.C8A_SHADOWSEAL, T.C8A_SANDFALL, T.C8A_SLAB]) assert.ok(TILE_INFO[t].solid, TILE_INFO[t].name);
  // だいほんが ぜんぶ ある
  for (const id of CH8_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, FIELD, 'south']) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[NADIA_LETTER]?.type === 'key', '大事な物「王女ナディアの手紙」');
  assert.equal(VILLAIN8, '大臣ジャハール');
  assert.equal(PET8, 'オウムのイアゴン');
});

// ───────────── 目標 ─────────────
test('目標: 第7章クリアの セーブは トキネへの 目標に なおる・フラグごとの 目標・仲間会話（4人分）・地図の しるし', () => {
  assert.equal(OLD_C7_OBJ.clear, '第7章クリア！第8章「千年の約束」へ（続きはアップデートで！）');
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C7_OBJ.clear), '前の 版の 第7章クリアの 文は 今は 知らない 文');
  const old = { flags: flagsOf(...UPTO('c7_clear')), objective: OLD_C7_OBJ.clear };
  assert.ok(repairObjective(old) && old.objective === C7I_OBJ.clear);
  assert.ok(C7I_OBJ.clear.startsWith('第7章クリア！') && C7I_OBJ.clear.includes('トキネ') && !C7I_OBJ.clear.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c7_clear')), objective: C7I_OBJ.clear };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L = LETTER8_PALACE;
  const table = [
    [['c7_clear'], C7I_OBJ.clear], [['c8_start'], C8_OBJ.start], [['c8_start', ARRIVE8], C8_OBJ.arrive], [['c8_kingdom'], C8_OBJ.kingdom],
    [['c8_kingdom', ENTRY8], C8_OBJ.entry], [['c8_moon'], C8_OBJ.moon], [['c8_moon', PF8(2)], C8_OBJ.f2], [['c8_moon', PF8(3)], C8_OBJ.f3],
    [['c8_moon', PF8(4), NADIA4], C8_OBJ.f4], [['c8_pet'], C8_OBJ.pet], [['c8_deep'], C8_OBJ.deep], [['c8_deep', LETTER8.start(L)], C8_OBJ.nadia],
    [['c8_deep', LETTER8.bury(L)], C8_OBJ.l3bury], [['c8_deep', LETTER8.found(L)], C8_OBJ.l3found], [['c8_deep', PF8(6)], C8_OBJ.f6],
    [['c8_deep', PF8(7)], C8_OBJ.f7], [['c8_deep', PF8(7), VOICE7], C8_OBJ.rest7], [['c8_deep', PF8(8)], C8_OBJ.f8],
    [['c8_deep', PF8(8), WIN8], C8_OBJ.win], [['c8_deep', WIN8, KING8], C8_OBJ.king], [['c8_jafar'], C8_OBJ.jafar],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of [...Object.entries(C8_OBJ), ['clear7', C7I_OBJ.clear]]) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH8_OBJECTIVE_TARGETS[t]?.length || k === 'clear7', `行き先 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) {
      const s = talkFor(t, kind);
      assert.ok(s !== `次は「${t.replace(/\n/g, '')}」ですね。` && s.length > 8, `${k} ${kind}`);
    }
  }
  for (const t of Object.values(C8_OBJ)) assert.ok(CH8_OBJECTIVE_TALK[t] && objectiveChapter(t) === 5, '第8章の 目標の 章');
  assert.equal(C8_OBJ.jafar, '第8章　第2幕へ（続きはアップデートで！）');
  // 地図の しるし（その 時代の マップだけ）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const Bx = C8A_POS[5].box;
  assert.ok(mark(C8_OBJ.nadia, c8aMapId(5)).some((m) => m.x === Bx.x && m.y === Bx.y), '千年前の 月の 箱');
  assert.ok(mark(C8_OBJ.l3bury, c8aMapId(5, true)).some((m) => m.x === Bx.x && m.y === Bx.y), '今の 月の 箱');
  assert.ok(mark(C8_OBJ.start, 'south').length, '今の コガネ地方');
  assert.ok(mark(C8_OBJ.kingdom, FIELD).some((m) => m.x === STAIR8.x && m.y === STAIR8.y), '王の間の 月の 石板');
  assert.ok(mark(C7I_OBJ.clear, 'overworld').length, '今の トキネ');
});

// ───────────── 地下迷宮の とき方 ─────────────
test('月の王宮の地下迷宮: どの 階も ひとりで 下へ 行ける・時の砂時計と 鏡を 使わないと 行けない 階・とじこめられない・今の がわから 来ても とける', () => {
  for (let n = 1; n <= C8A_FLOORS; n++) {
    const r = solve(n, { start: startOf(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '下へ'} 行ける`);
    assert.deepEqual(r.stuck, [], `${n}階: どこに いても 上への かいだんへ もどれる`);
    if (n <= C8A_NOW_FLOORS) {
      const fromNow = solve(n, { start: startOf(n), era0: 'now' });
      assert.ok(fromNow.goals.length && !fromNow.stuck.length, `${n}階: 今の がわから 来ても とける`);
    }
    if ([1, 2, 3, 5, 6, 7].includes(n)) {
      assert.ok(!solve(n, { start: startOf(n), shift: false }).goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), mirrors: false }).goals.length, `${n}階: 鏡を 回さないと 行けない`);
      assert.ok(!solve(n, { start: startOf(n), shift: false, era0: 'now' }).goals.length, `${n}階: 今の がわだけでは 行けない`);
    }
    // 宝箱は その 時代で 取りに 行ける（となりに 立てる）
    for (const now of n <= C8A_NOW_FLOORS ? [false, true] : [false]) {
      for (const ch of (now ? NOW(n) : PAST(n)).chests) {
        const era = now ? 'now' : 'past';
        assert.ok(D4.some(([dx, dy]) => r.cells.has(`${era}:${ch.x + dx},${ch.y + dy}`)), `${n}階 ${era} の 宝箱 (${ch.x},${ch.y})`);
      }
    }
  }
  // 4階: オウムのイアゴンに 勝つまで 黒い 砂の かべ（どちらの 時代も）
  assert.ok(!solve(4).goals.length, '4階: イアゴンに 勝つまで 下へ 行けない');
  // 5階: ナディアの 手紙が ないと 月の 門は 開かない・下への かいだんは 今の 門の 先
  assert.ok(!solve(5, { start: [C8.pet], letter: false }).goals.length, '5階: 手紙が ないと 開かない');
  assert.ok(solve(5, { start: [C8.pet] }).goals.every((g) => g.flags.includes(LETTER8.found(LETTER8_PALACE))));
  // 7階: 3つの 鏡を ぜんぶ ためす（休み所への 橋は 島2の 鏡が「＼」の 時だけ）
  assert.ok(solve(7).goals.every((g) => g.flags.includes(MIRROR8(7, 1))));
});

test('月の 光と かげ: 千年前の 鏡の むきで 今の 光の 橋が かわる・千年前は 砂の 川・流れる 砂は 千年前だけ（今は 砂山）', () => {
  for (const n of [1, 2, 3, 5, 6, 7]) {
    const P = C8A_POS[n];
    assert.ok(P.mirrors.length >= 1 && P.bridges.length >= 2, `${n}階の 鏡と 橋`);
    for (const b of P.bridges) {
      const { k, on } = bridgeOf(b.ch);
      const f = MIRROR8(n, k);
      assert.ok(k < P.mirrors.length, `${n}階 (${b.x},${b.y}) の 鏡が ある`);
      assert.ok(isBlocked(PAST(n), b.x, b.y, () => true) && isBlocked(PAST(n), b.x, b.y, () => false), '千年前は 砂の 川');
      assert.equal(PAST(n).tiles[b.y * 32 + b.x], T.C8A_SANDRIVER);
      assert.equal(effectiveTile(NOW(n), b.x, b.y, (fl) => fl === f), on ? T.C8A_LIGHT : T.C8A_DARKBRIDGE, '鏡が「＼」');
      assert.equal(effectiveTile(NOW(n), b.x, b.y, () => false), on ? T.C8A_DARKBRIDGE : T.C8A_LIGHT, '鏡が「／」');
    }
    // 鏡は どちらの 時代も おなじ むき・千年前で しらべると 回せる
    P.mirrors.forEach((m, k) => {
      for (const map of [PAST(n), NOW(n)]) {
        assert.equal(effectiveTile(map, m.x, m.y, () => false), T.C8A_MIRROR_A);
        assert.equal(effectiveTile(map, m.x, m.y, (fl) => fl === MIRROR8(n, k)), T.C8A_MIRROR_B);
      }
      assert.ok(PAST(n).actions.some((a) => a.x === m.x && a.y === m.y && a.script === `c8a_mirror_${n}_${k}`));
      assert.ok(NOW(n).actions.some((a) => a.x === m.x && a.y === m.y && a.script === 'c8a_mirror_now'));
    });
  }
  // 流れる 砂（2階・6階）: 千年前は 流れる・今は 砂山
  for (const n of [2, 6]) {
    for (const p of C8A_POS[n].flows) {
      assert.ok(TILE_INFO[PAST(n).tiles[p.y * 32 + p.x]].flow, `${n}階 千年前は 流れる 砂`);
      assert.equal(NOW(n).tiles[p.y * 32 + p.x], T.C8A_DUNE, '今は 砂山');
    }
  }
  // 2階: 北の 岸から 流れる 砂に のると 川の 中の 島に 着く
  const v = C8A_POS[2].flows.find((p) => p.ch === 'v');
  const end = carry(PAST(2), v.x, v.y, () => false);
  assert.ok(!end.pit && !isBlocked(NOW(2), end.x, end.y, () => false), '島（どちらの 時代も ゆか）に 着く');
  // 3階: c … 千年前は ゆか・今は くずれた 谷
  assert.ok(!isBlocked(PAST(3), 5, 15, () => false) && isBlocked(NOW(3), 5, 15, () => false));
  // 5階: G … 千年前は 開いた 門・今は しまった 月の 門（手紙で 開く）/ r … 千年前は 砂の 川・今は かれた 川の そこ
  const G = C8A_POS[5].gate;
  assert.ok(!isBlocked(PAST(5), G.x, G.y, () => false) && isBlocked(NOW(5), G.x, G.y, () => false));
  assert.ok(!isBlocked(NOW(5), G.x, G.y, (fl) => fl === LETTER8.found(LETTER8_PALACE)), '王家の 言葉で 開く');
  assert.ok(isBlocked(PAST(5), G.x + 1, G.y, () => true) && !isBlocked(NOW(5), G.x + 1, G.y, () => false));
});

test('砂の 滝（6階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C8A_POS[6];
  const m = PAST(6);
  assert.ok(P.waveA.length >= 4 && P.waveB.length >= 4);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.waveA.map(k)), B = new Set(P.waveB.map(k));
  for (const p of [...P.waveA, ...P.waveB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の 砂の 滝が ない`);
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.equal(effectiveTile(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), T.C8A_SANDFALL, 'ふっている 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), 'ふっていない 時は 通れる');
    assert.equal(NOW(6).tiles[p.y * 32 + p.x], T.CHASM, '今の がわは 通路が くずれている');
  }
  // ずっと 同じ 時間では 下への かいだんへ 行けない（千年前・鏡と 橋は 通った あと）
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

test('かいだん（第71回）: 下りると 下の 階の 上への かいだんの 真上・上ると 上の 階の 下への かいだんの 真上・王の間の 石板も', () => {
  const all = () => true;
  for (let n = 1; n < C8A_FLOORS; n++) {
    for (const now of n + 1 <= C8A_NOW_FLOORS ? [false, true] : [false]) {
      const from = c8aMapId(n, now), to = c8aMapId(n + 1, now);
      const D = C8A_POS[n].down, U = C8A_POS[n + 1].up;
      const wd = MAPS[from].warpAt.get(D.y * 32 + D.x);
      const L = warpLanding(from, wd, all);
      assert.ok(L.stair && L.map === to && Math.floor(L.x) === U.x && Math.floor(L.y) === U.y, `${from} → ${to}: 上への かいだんの 上`);
      const wu = MAPS[to].warpAt.get(U.y * 32 + U.x);
      const L2 = warpLanding(to, wu, all);
      assert.ok(L2.stair && L2.map === from && Math.floor(L2.x) === D.x && Math.floor(L2.y) === D.y, `${to} → ${from}: 下への かいだんの 上`);
      assert.ok(stepsTo(MAPS[to], U.x, U.y, Math.floor(wd.to.x), Math.floor(wd.to.y), all) >= 0, 'これまでの つく マスへ 歩ける');
    }
  }
  // 王の間の 月の 石板 ⇔ 1階（千年前・今）
  for (const [field, now] of [[FIELD, false], ['south', true]]) {
    const w = MAPS[field].warpAt.get(STAIR8.y * MAPS[field].w + STAIR8.x);
    const L = warpLanding(field, w, all);
    const U = C8A_POS[1].up;
    assert.ok(L.stair && Math.floor(L.x) === U.x && Math.floor(L.y) === U.y, `${field} → 1階の かいだんの 上`);
    const back = warpLanding(c8aMapId(1, now), MAPS[c8aMapId(1, now)].warpAt.get(U.y * 32 + U.x), all);
    assert.ok(back.stair && back.map === field && Math.floor(back.x) === STAIR8.x && Math.floor(back.y) === STAIR8.y, `1階 → ${field} の 石板の 上`);
    assert.ok(stairsPair(field, w));
  }
  // 4階 → 5階は イアゴンに 勝つまで 黒い 砂の かべの 先
  const D4w = PAST(4).warpAt.get(C8A_POS[4].down.y * 32 + C8A_POS[4].down.x);
  assert.equal(D4w.to.map, c8aMapId(5));
});

// ───────────── サーバーで: 鏡・光の 橋・流れる 砂 ─────────────
test('サーバー: 1階 千年前の 鏡を 回して 今の 光の 橋を わたる・かいだんの 真上に 着く・2階 流れる 砂で 島へ', { timeout: 300000 }, async () => {
  const { bot, c } = await setup(8101, 'c8_moon');
  const P1 = C8A_POS[1];
  await place(bot, c8aMapId(1), P1.arrive.x, P1.arrive.y);
  // 鏡を 回す 前は 今の 東の 橋は 暗い
  const b2 = P1.bridges.find((b) => b.ch === '2');
  assert.ok(isBlocked(NOW(1), b2.x, b2.y, (f) => !!c.flags[f]));
  await turnMirror(bot, 1, 0);
  assert.ok(c.flags[MIRROR8(1, 0)], '鏡が 回った');
  assert.ok(said(bot, '向きがかわったわ'));
  await useGlass(bot);
  assert.equal(bot.s.map, c8aMapId(1, true), '今へ');
  assert.ok(!isBlocked(NOW(1), b2.x, b2.y, (f) => !!c.flags[f]), '光の 橋が うかんだ');
  await walkTo(bot, P1.down.x, P1.down.y);
  assert.equal(bot.s.map, c8aMapId(2, true), '今の 2階へ（今の かいだん）');
  assert.deepEqual(here(bot), [C8A_POS[2].up.x, C8A_POS[2].up.y], '上への かいだんの 真上に 着く');
  assert.ok(c.flags[PF8(2)], '2階に 来た');
  // 今の 鏡は 回せない
  await useGlass(bot);
  assert.equal(bot.s.map, c8aMapId(2));
  // 2階: 千年前の 流れる 砂に のって 島へ
  const v = C8A_POS[2].flows.find((p) => p.ch === 'v');
  await walkTo(bot, v.x, v.y - 1);
  const end = carry(PAST(2), v.x, v.y, () => false);
  for (const [x, y] of end.path) await stepOn(bot, x, y);
  assert.deepEqual(here(bot), [end.x, end.y], '島に 着いた');
});

// ───────────── 通し ─────────────
test('通しで: c7_clear → トキネ → 千年前の 緑の王国（カリムが ゲスト）→ 月の 石板 → 地下迷宮 → イアゴン → ナディアの 手紙 → ジャハール → 第1幕クリア（c8_jafar）', { timeout: 400000 }, async () => {
  const { world, bot, c } = await setup(8201, 'c7_clear');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C8.start] && c.objective === C8_OBJ.start, 'c8_start');
  assert.ok(said(bot, 'ふういんの日') && said(bot, '集めている'), 'トキネ: かけらが 何かを 集めている');
  // 今の コガネ地方の 王都の 北の 門の 外で 砂時計 → 千年前
  await place(bot, 'south', 40, 80);
  await useGlass(bot);
  assert.equal(bot.s.map, FIELD);
  await stepOn(bot, 40, 81);
  assert.ok(c.flags[ARRIVE8] && c.objective === C8_OBJ.arrive);
  assert.ok(said(bot, '月の王宮のうらぎり'), '章の 字');
  // 緑の王国へ（北の 門から 入る）
  await walkTo(bot, 40, 86);
  assert.ok(c.flags[C8.kingdom] && c.objective === C8_OBJ.kingdom, 'c8_kingdom');
  assert.ok(c.guests.includes('karim'), 'カリムが ゲスト');
  assert.ok(said(bot, VILLAIN8) && said(bot, 'ジャハールの…言うとおりに'), '王の間の 場面');
  // 月の 石板（王家の たて）
  await place(bot, FIELD, STAIR8.x - 1, STAIR8.y);
  await examine(bot, STAIR8.x, STAIR8.y);
  assert.ok(c.flags[ENTRY8] && c.objective === C8_OBJ.entry, '石板が 開いた');
  await stepOn(bot, STAIR8.x, STAIR8.y);
  assert.equal(bot.s.map, c8aMapId(1));
  const A1 = C8A_POS[1].arrive;
  await stepOn(bot, A1.x, A1.y);
  assert.ok(c.flags[C8.moon] && c.objective === C8_OBJ.moon, 'c8_moon');
  assert.ok(!isBlocked(MAPS.south, STAIR8.x, STAIR8.y, (f) => !!c.flags[f]), '今の 宮殿の 石板も 開いた');
  // 4階（しかけは 上の テストで）: 休み所で ナディア → 南の 広間で イアゴン
  for (const f of [PF8(2), PF8(3)]) c.flags[f] = true;
  const A4 = C8A_POS[4].arrive;
  await place(bot, c8aMapId(4), A4.x, A4.y - 1);
  await stepOn(bot, A4.x, A4.y);
  assert.ok(c.flags[PF8(4)] && c.objective === C8_OBJ.f4, '4階');
  await walkTo(bot, 15, 5);
  assert.ok(c.flags[NADIA4] && said(bot, 'ねがいのランプ'), '4階の ナディア');
  const fought = [];
  await walkTo(bot, 15, C8A_POS[4].trigger.y, { fought });
  assert.deepEqual(fought.filter((x) => x !== 'field'), ['c8_vizier_pet']);
  assert.ok(c.flags[C8.pet] && c.objective === C8_OBJ.pet, 'c8_pet');
  assert.ok(said(bot, PET8) && said(bot, 'ひとつつき'));
  const Sx = C8A_POS[4].seal;
  assert.ok(!isBlocked(PAST(4), Sx.x, Sx.y, (f) => !!c.flags[f]), '黒い 砂の かべが 消えた');
  await walkTo(bot, C8A_POS[4].down.x, C8A_POS[4].down.y);
  assert.equal(bot.s.map, c8aMapId(5));
  assert.ok(c.flags[C8.deep] && c.objective === C8_OBJ.deep, 'c8_deep');
  // 5階: 今の 門（手紙が ない）→ 4階の ナディア → 千年前の 月の 箱 → 今の 箱
  const P5 = C8A_POS[5];
  await place(bot, c8aMapId(5, true), P5.gate.x - 1, P5.gate.y);
  let f0 = bot.msgs.length;
  await examine(bot, P5.gate.x, P5.gate.y);
  assert.ok(said(bot, '王家の言葉', f0) && !c.flags[LETTER8.found(LETTER8_PALACE)]);
  const Nd = C8A_POS[4].nadia;
  await place(bot, c8aMapId(4), Nd.x - 1, Nd.y);
  await talk(bot, 'c8a_nadia');
  assert.ok(c.flags[LETTER8.start(LETTER8_PALACE)] && c.keyItems.includes(NADIA_LETTER), 'ナディアの 手紙');
  assert.equal(c.objective, C8_OBJ.nadia);
  const Bx = P5.box;
  await place(bot, c8aMapId(5, true), Bx.x - 1, Bx.y);
  await examine(bot, Bx.x, Bx.y);
  assert.ok(!c.flags[LETTER8.found(LETTER8_PALACE)], '千年前で 入れる 前は 見つからない');
  await useGlass(bot);
  assert.equal(bot.s.map, c8aMapId(5));
  bot.choice = 0;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8.bury(LETTER8_PALACE)] && !c.keyItems.includes(NADIA_LETTER), '月の 箱に 入れた');
  await useGlass(bot);
  const [rid, rn] = letterReward8(LETTER8_PALACE)[0];
  const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
  const before = cnt();
  f0 = bot.msgs.length;
  await examine(bot, Bx.x, Bx.y);
  assert.ok(c.flags[LETTER8.found(LETTER8_PALACE)] && said(bot, 'ねむる子を', f0), '千年前の 手紙が とどいた');
  assert.equal(cnt(), before + rn, '手紙の ごほうび');
  assert.ok(!isBlocked(NOW(5), P5.gate.x, P5.gate.y, (f) => !!c.flags[f]), '月の 門が 開いた');
  await walkTo(bot, P5.down.x, P5.down.y);
  assert.equal(bot.s.map, c8aMapId(6, true), '今の 6階へ');
  // 7階の 休み所の 入口で 大臣の 声
  for (const f of [PF8(6)]) c.flags[f] = true;
  const R7 = C8A_POS[7].restIn;
  await place(bot, c8aMapId(7), R7.x, R7.y + 1);
  c.flags[PF8(7)] = true;
  await stepOn(bot, R7.x, R7.y);
  assert.ok(c.flags[VOICE7] && c.objective === C8_OBJ.rest7 && said(bot, 'よくばれ'), '7階の 声');
  // 8階
  const A8 = C8A_POS[8].arrive;
  await place(bot, c8aMapId(8), A8.x, A8.y - 1);
  await stepOn(bot, A8.x, A8.y);
  assert.ok(c.flags[PF8(8)] && c.objective === C8_OBJ.f8);
  const f2 = [];
  await walkTo(bot, 15, C8A_POS[8].trigger.y, { fought: f2 });
  assert.deepEqual(f2, ['c8_jafar']);
  assert.ok(c.flags[WIN8] && c.flags[KING8] && c.flags[C8.jafar], 'c8_jafar');
  assert.equal(c.objective, C8_OBJ.jafar);
  for (const t of ['ランプの中へ', 'くらい心を', 'ソリトゥス', '約束だ', '第8章　第1幕クリア！', '第8章　第2幕へ（続きはアップデートで！）']) assert.ok(said(bot, t), t);
  assert.ok(!c.guests.includes('karim'), 'カリムは 王国に のこる');
  assert.equal(bot.s.map, FIELD, 'さいごは 緑の城の 王の間');
  assert.ok(MAPS[FIELD].npcs.some((n) => n.id === 'c8a_king_back' && condOk(n.show, (f) => !!c.flags[f])), '王さまが お城に もどった');
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  await place(bot, FIELD, C8A_FIELD_POS.hall.x, C8A_FIELD_POS.hall.y);
  await talk(bot, 'c8a_king_back');
  assert.ok(!said(bot, '第1幕クリア', n));
  void world;
});

test('負けた 時・とちゅうで 切れた 時: イアゴン・ジャハールに 負けたら すすまない・さいごの 場面は 広間・ランプ・王さまで 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(8301, 'c8_moon', { extra: [PF8(4), NADIA4] });
    await place(bot, c8aMapId(4), 15, 10);
    await walkTo(bot, 15, C8A_POS[4].trigger.y, { lose: () => true });
    assert.ok(!c.flags[C8.pet], 'イアゴンに 負けた');
    assert.ok(isBlocked(PAST(4), C8A_POS[4].seal.x, C8A_POS[4].seal.y, (f) => !!c.flags[f]), 'かべは そのまま');
  }
  {
    const { bot, c } = await setup(8302, 'c8_deep', { extra: [PF8(8)] });
    const A8 = C8A_POS[8].arrive;
    await place(bot, c8aMapId(8), A8.x, A8.y);
    await walkTo(bot, 15, C8A_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN8] && !c.flags[C8.jafar], 'ジャハールに 負けた');
  }
  for (const [seed, how, extra] of [[8303, 'hall', [WIN8]], [8304, 'lamp', [WIN8]], [8305, 'king', [WIN8, KING8]]]) {
    const { bot, c } = await setup(seed, 'c8_deep', { extra: [PF8(8), ...extra] });
    if (how === 'king') {
      await place(bot, FIELD, C8A_FIELD_POS.hall.x, C8A_FIELD_POS.hall.y);
      await talk(bot, 'c8a_king_back');
    } else if (how === 'lamp') {
      const L = C8A_POS[8].lamp;
      await place(bot, c8aMapId(8), L.x, L.y + 2);
      await talk(bot, 'c8a_lamp_npc');
    } else {
      await place(bot, c8aMapId(8), 15, C8A_POS[8].trigger.y + 1);
      await stepOn(bot, 15, C8A_POS[8].trigger.y);
    }
    assert.ok(c.flags[KING8] && c.flags[C8.jafar], `${how}で 続き`);
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙（緑の王国の まわり）: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const K = MAPS.south, F = MAPS[FIELD];
  for (const k of LETTER8_SIDE) {
    const p = LETTER8_SPOTS[k];
    const dig = K.npcById[`c8a_dig_${k}`], bury = F.npcById[`c8a_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER8.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(F.npcById[LETTER8_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward8(k).length, `ごほうび ${k}`);
    // どちらの 時代も 立てて、町から 歩いて 行ける
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(K, x + 0.5, y + 0.5, () => false) && canStand(F, x + 0.5, y + 0.5, () => false));
    assert.ok(near, `${k}: 手紙の 場所の となりに どちらの 時代も 立てる`);
    assert.ok(timeArea(F)[p.y * F.w + p.x] && timeArea(K)[p.y * K.w + p.x], `${k}: 歩いて 行ける`);
  }
  assert.equal(Object.keys(C8A_LETTER_REWARDS).length, 3, '手紙の ごほうびは 3つ');
  const hints = subQuestHints();
  for (const q of C8A_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  for (const k of LETTER8_SIDE) {
    const { bot, c } = await setup(8400 + k, 'c8_kingdom');
    const asker = F.npcById[LETTER8_ASKERS[k]];
    const ax = Math.floor(asker.x), ay = Math.floor(asker.y);
    const side = D4.map(([dx, dy]) => [ax + dx, ay + dy]).find(([x, y]) => canStand(F, x + 0.5, y + 0.5, () => false));
    await place(bot, FIELD, side[0], side[1]);
    bot.choice = 0;
    await talk(bot, LETTER8_ASKERS[k]);
    assert.ok(c.flags[LETTER8.start(k)], `${k}: たのまれた`);
    const q1 = subQuests(c).find((q) => q.name === letterName8(k));
    assert.ok(q1 && q1.find === `c8a_bury_${k}` && !q1.ready, 'クエストの 画面: うめる 場所');
    const p = LETTER8_SPOTS[k];
    const near = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).find(([x, y]) => canStand(K, x + 0.5, y + 0.5, () => false) && canStand(F, x + 0.5, y + 0.5, () => false));
    await place(bot, 'south', near[0], near[1]);
    await talk(bot, `c8a_dig_${k}`);
    assert.ok(!c.flags[LETTER8.found(k)], 'うめる 前は 何も ない');
    await place(bot, FIELD, near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8a_bury_${k}`);
    assert.ok(c.flags[LETTER8.bury(k)]);
    const q2 = subQuests(c).find((q) => q.name === letterName8(k));
    assert.ok(q2 && q2.who === `c8a_dig_${k}` && q2.ready, 'クエストの 画面: 今で さがす');
    const [rid, rn] = letterReward8(k)[0];
    const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
    const before = cnt();
    await place(bot, 'south', near[0], near[1]);
    bot.choice = 0;
    await talk(bot, `c8a_dig_${k}`);
    assert.ok(c.flags[LETTER8.found(k)] && cnt() === before + rn, `${k}: ごほうび`);
    assert.ok(labDoneQuests(c).includes(letterName8(k)), 'クリアした たのまれごと');
    await talk(bot, `c8a_dig_${k}`);
    assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
  }
});

test('時の砂時計: 第7章クリアの あと 今の コガネ地方 ⇔ 千年前（王国の 中は 使えない）・地下迷宮の 中は おなじ 座標・8階は 使えない', async () => {
  const { world, bot } = await setup(8501, 'c8_moon');
  await place(bot, c8aMapId(2), 5, 3);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, c8aMapId(2, true));
  assert.deepEqual(here(bot), [5, 3], 'おなじ 座標');
  await place(bot, c8aMapId(8), 15, 12);
  assert.equal(glassCheck(world, bot.s).key, 'boss');
  await place(bot, FIELD, C8A_FIELD_POS.kingdomIn.x, C8A_FIELD_POS.kingdomIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 文字・絵 ─────────────
test('文字: 第8章 第1幕の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない・第2幕より 先の ことは 書かない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c8.js', 'public/js/shared/data/sidequests-c8a.js',
    'public/js/shared/maps/c8.js', 'public/js/shared/maps/c8a-field.js', 'public/js/shared/maps/c8a-palace.js', 'public/js/shared/maps/c8a-palace-rows.js', 'public/js/shared/maps/c8a-flags.js',
    'public/js/client/render/c8a-npc-art.js', 'public/js/client/render/tiles-c8a.js', 'public/js/shared/data/items-c7-key.js', 'public/js/shared/data/story-c7i.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c8_deep'), PF8(6));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c8a_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
  assert.ok(!/ハデス|よみの|海底神殿|空中要塞|時のはざま|フリーザ|クッパ/.test(all), '第2幕より 先の 中みは 書かない');
});

test('絵と 音: 地下迷宮の タイル（2D は 16×16 を ぬる・動く・2.5D）・テーマ・人の え・イアゴンと ランプの 大きな すがた・曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 343; id <= 354; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const t of [T.C8A_LIGHT, T.C8A_SANDRIVER, T.C8A_SANDFALL]) {
    assert.ok(isAnimated(t));
    assert.notEqual(paintTile(t, 0, 0, 0).px.join(), paintTile(t, 0, 1, 0).px.join(), `${TILE_INFO[t].name}が 動く`);
  }
  for (const id of [T.C8A_MIRROR_A, T.C8A_MIRROR_B, T.C8A_MOONBOX, T.C8A_SANDFALL, T.C8A_SHADOWSEAL]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(CH6_PROPS[T.C8A_MOONGATE], '月の 門は たてた もの');
  assert.ok(CH6_THEMES.c8a_moon, 'テーマ');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of C8A_MAPS) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c8a_parrot_npc', 'c8a_lamp_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set(['karim', 'c8a_jahar', 'c8a_king', 'c7_king', 'c7_minister', 'c7_princess']);
  for (const id of [FIELD, ...C8A_MAPS]) for (const n of MAPS[id].npcs) if (/^c8a_/.test(n.id) && !n.big && !/^capsule/.test(n.sprite)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  assert.ok(CH6_TRACKS.c8a_palace?.ch?.length, '曲 c8a_palace');
  for (const id of C8A_MAPS) assert.ok(['c8a_palace', 'cave', 'boss6'].includes(MAPS[id].bgm), id);
});
