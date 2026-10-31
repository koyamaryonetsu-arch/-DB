// 第2部 第7章 第1幕「緑の王国」Step 1・2（A: 世界と物語）※ ネタバレ注意（物語の 中みを ためす）
// 第6章クリア → 今の トキネ（c7_start）→ 今の コガネ地方で 時の砂時計 → 千年前の コガネ地方 → 緑の王国（c7_kingdom。カリムが ゲスト）
// → 神殿の 前の 門番（c7_gate）→ みどりの水の神殿 1〜8階（c7_temple）→ うずの魔女オクタリア → カリムが 酒場の 仲間に（c7_karim）
// 時をこえる手紙（より道 3つ・神殿 5階の なぞとき）。戦いの 中みは B（戦い・品）。ここでは 戦いは テストの 中で 勝たせる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { carry } from '../public/js/shared/maps/flow.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  C7, ARRIVE7, TF7, LEVER3, OPEN6, WAIT6, WIN7, LETTER, LETTER_SIDE, LETTER_TEMPLE, MIKO_LETTER, C7_FIELD, PRESENT_FIELD, KINGDOM, TEMPLE_DOOR, TEMPLE_YARD, GATE_BOSS,
  c7tMapId, C7T_FLOORS, C7T_NOW_FLOORS, C7T_REST,
} from '../public/js/shared/maps/c7-flags.js';
import { CH7_MAPS } from '../public/js/shared/maps/c7.js';
import { C7T_POS, C7T_ROWS, C7T_MAPS, c7tArrive, c7TreasureOf, C7T_CHEST_ERA } from '../public/js/shared/maps/c7-temple.js';
import { LETTER_SPOTS, LETTER_ASKERS, C7_POS, LAKE7 } from '../public/js/shared/maps/c7-field.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH6_STEPS, OLD_C6_OBJ } from '../public/js/shared/data/story-ch6.js';
import { C6D_OBJ } from '../public/js/shared/data/story-ch6d.js';
import { CH7_STEPS, C7_OBJ, CH7_OBJECTIVE_TARGETS, CH7_OBJECTIVE_TALK, CH7_STORY_SCRIPTS, KARIM_SUPPORT, VILLAIN } from '../public/js/shared/data/story-c7.js';
import { C7_SIDE_QUESTS, letterReward, letterName } from '../public/js/shared/data/sidequests-c7.js';
import { labDoneQuests } from '../public/js/shared/data/sidequests.js';
import { subQuestHints } from '../public/js/shared/data/subquest-hints.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks, subQuests } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS, ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { NPC_SUPPORTS, GUESTS, SHOPS } from '../public/js/shared/data/shops.js';
// 宝箱の 中み・手紙の ごほうび（B の data/items-c7.js。まとめる 時に そちらから）
import { C7_TREASURE, C7_LETTER_REWARDS } from '../public/js/shared/data/items-c7.js';
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

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
// upto … その すすみぐあいまで。カリムは c7_kingdom から c7_karim まで ゲスト
async function setup(seed, upto = 'c6_clear', { extra = [], frac = 0.2, karim = true } = {}) {
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
  c.guests = karim && c.flags[C7.kingdom] && !c.flags[C7.karim] ? ['karim'] : [];
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 70);
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
// その 人の いる マップで (tx, ty) まで 歩く（宝箱・人を さける。ふき上げる 水は 時計を すすめて 待つ）
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
async function family(seed, upto = 'c7_kingdom', extraFlags = []) {
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
  Pa.char.guests = Pa.char.flags[C7.kingdom] && !Pa.char.flags[C7.karim] ? ['karim'] : [];
  boost(Pa.char, 70);
  boost(Y.char, 70);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  return { world, papa, yui, Pa, Y, clock };
}

// ───────────── 神殿の とき方（しかけを ぜんぶ ためす さがし）─────────────
// じょうたい … 時代（'past' … 千年前 / 'now' … 今）・場所・フラグ・ふき上げる 水の 時間（0 … a が ふさぐ / 1 … b が ふさぐ）
// うごき … 歩く（流れる 水路は 流される）・待つ（7階。どちらの 時間でも ふさがらない マスだけ）・時の砂時計（その マスに 向こうの 時代で 立てる とき）・
//   3階の レバー（千年前）・5階の 番人（千年前で 手紙を 入れる → 今で 読む）・6階の 水の 石（ひとり … 千年前で カリムに 待ってもらう → 今の 石）
// opts: start … はじめの フラグ / shift … 時の砂時計 / goal … 'down'（下の 階へ）か 'trigger'（8階の 広間）/ family … 6階を 2人で
function solve(n, { start = [], shift = true, from = null, karim = true, family: fam = false } = {}) {
  const P = C7T_POS[n];
  const past = MAPS[c7tMapId(n)], now = n <= C7T_NOW_FLOORS ? MAPS[c7tMapId(n, true)] : null;
  const a = c7tArrive(n);
  const s0 = { era: from?.era || 'past', x: from?.x ?? Math.floor(a.x), y: from?.y ?? Math.floor(a.y), flags: [...start], phase: 0 };
  const key = (s) => `${s.era}:${s.x},${s.y}:${s.phase}:${[...s.flags].sort().join('|')}`;
  const seen = new Set([key(s0)]);
  const q = [s0];
  const goals = [];
  const cells = new Set();
  const spouts = P.spoutA.length + P.spoutB.length > 0;
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
      if (w) { if (s.era === 'past' && P.down && nx === P.down.x && ny === P.down.y) goals.push(s); continue; }
      const r = carry(map, nx, ny, has);
      if (r.pit) continue;
      [nx, ny] = [r.x, r.y];
      push({ ...s, x: nx, y: ny });
    }
    if (spouts) {
      const np = 1 - s.phase;
      const h2 = (f) => (f === '@fireA' ? np === 0 : f === '@fireB' ? np === 1 : s.flags.includes(f));
      if (!isBlocked(map, s.x, s.y, h2)) push({ ...s, phase: np });
    }
    const near = (p) => p && Math.abs(p.x - s.x) + Math.abs(p.y - s.y) <= 1;
    if (shift && now) {
      const other = s.era === 'past' ? now : past;
      if (canStand(other, s.x + 0.5, s.y + 0.5, has)) push({ ...s, era: s.era === 'past' ? 'now' : 'past' });
    }
    if (n === 3 && s.era === 'past' && near(P.lever) && !has(LEVER3)) push({ ...s, flags: [...s.flags, LEVER3] });
    if (n === 5 && near(P.guard)) {
      if (s.era === 'past' && has(LETTER.start(LETTER_TEMPLE)) && !has(LETTER.bury(LETTER_TEMPLE))) push({ ...s, flags: [...s.flags, LETTER.bury(LETTER_TEMPLE)] });
      if (s.era === 'now' && has(LETTER.bury(LETTER_TEMPLE)) && !has(LETTER.found(LETTER_TEMPLE))) push({ ...s, flags: [...s.flags, LETTER.found(LETTER_TEMPLE)] });
    }
    if (n === 6 && !has(OPEN6)) {
      const on1 = s.era === 'now' && s.x === P.plate1.x && s.y === P.plate1.y;
      const on2 = s.era === 'past' && s.x === P.plate2.x && s.y === P.plate2.y;
      if (on2 && karim && !has(WAIT6)) push({ ...s, flags: [...s.flags, WAIT6] });
      if (on1 && (has(WAIT6) || fam)) push({ ...s, flags: [...s.flags.filter((f) => f !== WAIT6), OPEN6] });
    }
  }
  return { goals, seen, cells };
}

// ───────────── 名前の 約束 ─────────────
test('名前の 約束（plan-ch7.md の 3）: 物語の すすみ・マップの ID・出現表・きまった 戦い・ゲスト・宝箱・タイル・酒場の カリム', () => {
  assert.deepEqual(CH7_STEPS, ['c7_start', 'c7_kingdom', 'c7_gate', 'c7_temple', 'c7_karim']);
  const ci = STORY_STEPS.indexOf('c6_clear');
  assert.deepEqual(STORY_STEPS.slice(ci + 1, ci + 6), CH7_STEPS, 'c6_clear の うしろ');
  assert.equal(CH6_STEPS.at(-1), 'c6_clear', '第6章の 一らんは そのまま');
  // マップ（千年前の コガネ地方・神殿 1〜8階。今の がわ 1〜7階）
  const want = [C7_FIELD, ...Array.from({ length: 8 }, (_, i) => `c7_temple_${i + 1}f`), ...Array.from({ length: 7 }, (_, i) => `c7_temple_${i + 1}f_now`)];
  assert.deepEqual(CH7_MAPS, want);
  for (const id of want) {
    const m = MAPS[id];
    assert.ok(m && m.tiles instanceof Uint16Array, id);
    assert.ok(id.startsWith('c7'), 'ファイル・マップの 名前の 先頭は c7');
  }
  assert.ok(MAPS[C7_FIELD].past && MAPS[C7_FIELD].kind === 'field' && MAPS[C7_FIELD].theme === 'past');
  assert.deepEqual([MAPS[C7_FIELD].w, MAPS[C7_FIELD].h], [MAPS[PRESENT_FIELD].w, MAPS[PRESENT_FIELD].h], '今の コガネ地方と おなじ 大きさ');
  assert.equal(MAPS[C7_FIELD].timePair, PRESENT_FIELD);
  assert.equal(MAPS[PRESENT_FIELD].timePair, C7_FIELD);
  for (let n = 1; n <= 8; n++) {
    const m = MAPS[c7tMapId(n)];
    assert.ok(m.kind === 'dungeon' && m.past, `${n}階`);
    if (n <= C7T_NOW_FLOORS) {
      assert.equal(m.timePair, c7tMapId(n, true));
      assert.equal(MAPS[c7tMapId(n, true)].timePair, c7tMapId(n));
      assert.deepEqual([m.w, m.h], [MAPS[c7tMapId(n, true)].w, MAPS[c7tMapId(n, true)].h], 'おなじ 大きさ');
      assert.ok(!MAPS[c7tMapId(n, true)].warps.length, '今の がわの かいだんは 砂で うまっている');
    } else assert.equal(m.timeBlock, 'boss', '8階は 千年前だけ');
  }
  // 出現表（B）: フィールド t7_kingdom・神殿 t7_temple（休み所・ボスの 階は 出ない）
  assert.ok(MAPS[C7_FIELD].spawnCounts.t7_kingdom > 0 && ENCOUNTER_TABLES.t7_kingdom?.length);
  for (let n = 1; n <= 8; n++) {
    const sc = MAPS[c7tMapId(n)].spawnCounts;
    if (n === 4 || n === 8) assert.deepEqual(sc, {}, `${n}階は 魔物が 出ない`);
    else assert.ok(sc.t7_temple > 0, `${n}階 の 出現表`);
  }
  assert.ok(ENCOUNTER_TABLES.t7_temple?.length);
  assert.equal(MAPS[c7tMapId(4)].zoneAt(17, 9), 'safe:rest');
  assert.equal(MAPS[c7tMapId(7)].zoneAt(27, 3), 'safe:rest');
  // きまった 戦い（B）
  for (const id of ['c7_gate', 'c7_temple']) {
    const f = FIXED_ENCOUNTERS[id];
    assert.ok(f && f.boss && f.canFlee === false && !f.loseOk, id);
  }
  // ゲスト（B）・酒場の カリム（A が 台本で 入れる）
  assert.ok(GUESTS.karim && GUESTS.karim.name === 'カリム');
  const k = NPC_SUPPORTS.find((s) => s.id === 'npc_karim');
  assert.ok(k && k === KARIM_SUPPORT && k.unlock === 'c7_karim' && k.name === 'カリム' && k.desc);
  // 宝箱（B の C7_TREASURE を 1階ごとに 2つ。どちらの 時代に 置くかは C7T_CHEST_ERA）
  for (let n = 1; n <= 8; n++) {
    const list = [...MAPS[c7tMapId(n)].chests, ...(n <= 7 ? MAPS[c7tMapId(n, true)].chests : [])].filter((c) => c.id.startsWith(`c7t_${n}c`)).sort((p, q) => p.id.localeCompare(q.id));
    assert.deepEqual(list.map((c) => c.item), c7TreasureOf(n), `${n}階の 宝箱`);
    assert.equal(list.length, 2);
    assert.ok(list.every((c) => ITEMS[c.item]), '品が ある');
  }
  assert.ok(Object.keys(C7_TREASURE).length >= 8 || C7_TREASURE.length >= 16);
  // 王国の 店（ランク10 の 品）
  for (const id of ['c7_weapon', 'c7_armor', 'c7_item']) assert.ok(SHOPS[id]?.items.length && SHOPS[id].items.every((i) => ITEMS[i]), id);
  // タイル（317 から）
  const ids = Object.values(T);
  assert.equal(new Set(ids).size, ids.length, 'タイルの ID が かさならない');
  const mine = [T.C7_CUR_N, T.C7_CUR_E, T.C7_CUR_S, T.C7_CUR_W, T.C7_LOTUS, T.C7_SAND, T.C7_SPOUT_FLOOR, T.C7_SPOUT, T.C7_GUARD];
  assert.deepEqual(mine, Array.from({ length: mine.length }, (_, i) => 317 + i));
  assert.deepEqual(TILE_INFO[T.C7_CUR_E].flow, [1, 0]);
  assert.ok(!TILE_INFO[T.C7_LOTUS].solid && TILE_INFO[T.C7_SAND].solid && TILE_INFO[T.C7_SPOUT].solid && !TILE_INFO[T.C7_SPOUT_FLOOR].solid);
  // だいほんが ぜんぶ ある
  for (const id of CH7_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of [...want, PRESENT_FIELD]) {
    const m = MAPS[id];
    for (const s of [...m.actions.map((x) => x.script), ...m.triggers.map((x) => x.script), ...m.npcs.map((x) => x.script)]) if (s) assert.ok(SCRIPTS[s], `${id}: ${s}`);
  }
  assert.ok(ITEMS[MIKO_LETTER]?.type === 'key', '大事な物「みこの手紙」');
  assert.equal(VILLAIN, 'うずの魔女オクタリア');
});

// ───────────── 目標 ─────────────
test('目標: 第6章クリアの セーブは 新しい 目標に なおる・フラグごとの 目標・仲間会話・地図の しるし', () => {
  assert.ok(!KNOWN_OBJECTIVES.has(OLD_C6_OBJ.clear), '前の 版の 第6章クリアの 文は 今は 知らない 文');
  assert.ok(OLD_C6_OBJ.clear.includes('いつかのアップデートで'));
  // 第6章クリアの セーブ（前の 版）→ トキネへの 目標
  const old = { flags: flagsOf(...UPTO('c6_clear')), objective: OLD_C6_OBJ.clear };
  assert.ok(repairObjective(old) && old.objective === C6D_OBJ.clear && C6D_OBJ.clear === C7_OBJ.lead);
  assert.ok(C6D_OBJ.clear.includes('トキネ') && C6D_OBJ.clear.includes('第7章') && !C6D_OBJ.clear.includes('続きはアップデート'));
  const ok = { flags: flagsOf(...UPTO('c6_clear')), objective: C6D_OBJ.clear };
  assert.ok(!repairObjective(ok), 'そのまま');
  const f = (...l) => ({ flags: flagsOf(...UPTO(l[0]), ...l) });
  const L4 = LETTER_TEMPLE;
  const table = [
    [['c6_clear'], C6D_OBJ.clear], [['c7_start'], C7_OBJ.start], [['c7_start', ARRIVE7], C7_OBJ.arrive], [['c7_kingdom'], C7_OBJ.kingdom],
    [['c7_gate'], C7_OBJ.gate], [['c7_temple'], C7_OBJ.temple], [['c7_temple', TF7(2)], C7_OBJ.tf2], [['c7_temple', TF7(3), LEVER3], C7_OBJ.tf3],
    [['c7_temple', TF7(4)], C7_OBJ.tf4], [['c7_temple', TF7(5)], C7_OBJ.tf5], [['c7_temple', TF7(4), LETTER.start(L4)], C7_OBJ.miko],
    [['c7_temple', TF7(5), LETTER.start(L4)], C7_OBJ.miko], [['c7_temple', TF7(5), LETTER.bury(L4)], C7_OBJ.l4bury], [['c7_temple', TF7(5), LETTER.found(L4)], C7_OBJ.l4found],
    [['c7_temple', TF7(6)], C7_OBJ.tf6], [['c7_temple', TF7(6), OPEN6], C7_OBJ.open6], [['c7_temple', TF7(7)], C7_OBJ.tf7], [['c7_temple', TF7(8)], C7_OBJ.tf8],
    [['c7_temple', TF7(8), WIN7], C7_OBJ.win], [['c7_karim'], C7_OBJ.karim],
  ];
  for (const [fl, want] of table) {
    assert.equal(objectiveFromFlags(f(...fl)), want, fl.join(','));
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c) && c.objective === want, `なおる ${fl.join(',')}`);
  }
  for (const [k, t] of Object.entries(C7_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    if (k === 'lead') continue;
    assert.ok(CH7_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH7_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `${k} ${kind}`);
  }
  assert.equal(C7_OBJ.karim, '第7章の続きはアップデートで！');
  // 地図の しるし（その 時代の マップだけ。すんだら 消える）
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  const L = C7T_POS[3].lever;
  assert.ok(mark(C7_OBJ.tf3, c7tMapId(3)).some((m) => m.x === L.x && m.y === L.y), '3階の レバー');
  assert.ok(!mark(C7_OBJ.tf3, c7tMapId(3), [LEVER3]).some((m) => m.x === L.x && m.y === L.y), '引いたら 消える');
  const G = C7T_POS[5].guard;
  assert.ok(mark(C7_OBJ.l4bury, c7tMapId(5, true)).some((m) => m.x === G.x && m.y === G.y), '今の 番人');
  assert.ok(mark(C7_OBJ.start, PRESENT_FIELD).length, '今の コガネ地方');
  assert.ok(mark(C6D_OBJ.clear, 'overworld').length, '今の トキネ');
});

// ───────────── 時代の 行き来 ─────────────
test('時の砂時計: 今の コガネ地方 ⇔ 千年前（c7_start から）・町の 中は 使えない・おなじ 座標・王国から 歩いて 行ける', async () => {
  const S = MAPS[PRESENT_FIELD], F = MAPS[C7_FIELD];
  assert.equal(S.timeSpot(40, 80, () => false), 'c7wait', 'トキネの 話の 前は 使えない');
  assert.equal(S.timeSpot(40, 80, (f) => f === C7.start), '');
  assert.ok(GLASS_TEXT.c7wait);
  // 町の 中（今の ハミル・王都サファラ・千年前の 緑の王国）
  assert.equal(S.timeNoUse(40, 100), 'town');
  assert.equal(S.timeNoUse(30, 30), 'town');
  assert.equal(F.timeNoUse(40, 100), 'town');
  assert.equal(F.timeNoUse(40, 80), null);
  // 目標の しるしの 場所（王都の 北の 門の 外）は どちらの 時代でも 立てて、王国から 歩いて 行ける
  const has = () => true;
  assert.ok(canStand(S, 40.5, 80.5, has) && canStand(F, 40.5, 80.5, has));
  const area = timeArea(F);
  for (const [x, y] of [[40, 80], [TEMPLE_DOOR.x, TEMPLE_DOOR.y + 1], ...Object.values(LETTER_SPOTS).map((p) => [p.x, p.y]), [24, 42]]) assert.ok(area[y * F.w + x], `千年前: (${x},${y}) は 王国から 歩いて 行ける`);
  const sArea = timeArea(S);
  for (const p of Object.values(LETTER_SPOTS)) assert.ok(sArea[p.y * S.w + p.x], `今: 手紙の 場所 (${p.x},${p.y})`);
  // 千年前は 川と 森・湖（今の 砂ばくの 形を のこす）
  const fTiles = new Set(F.tiles);
  for (const t of [T.WATER, T.TREE, T.BRIDGE_H, T.DIRT, T.MOUNTAIN]) assert.ok(fTiles.has(t), TILE_INFO[t].name);
  assert.ok(!fTiles.has(T.DESERT) && !fTiles.has(T.DUNE) && !fTiles.has(T.SANDSTORM), '砂ばくは ない');
  assert.equal(F.tiles[Math.floor(LAKE7.y) * F.w + Math.floor(LAKE7.x)], T.DEEP, '今の オアシスの 場所は 湖');
  // サーバー: 王都の 北で 使う → 千年前の おなじ 座標 → もどる
  const { world, bot, c } = await setup(7101, 'c6_clear');
  await place(bot, PRESENT_FIELD, 40, 80);
  const f0 = bot.msgs.length;
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_FIELD, 'トキネの 話の 前は 何も おこらない');
  assert.ok(bot.msgs.slice(f0).some((m) => JSON.stringify(m).includes('時をこえる力が足りない')));
  c.flags[C7.start] = true;
  world.sendSelf(bot.s);
  assert.ok(glassCheck(world, bot.s).ok);
  await useGlass(bot);
  assert.equal(bot.s.map, C7_FIELD);
  assert.deepEqual(here(bot), [40, 80], 'おなじ 座標');
  await stepOn(bot, 40, 81);
  assert.ok(c.flags[ARRIVE7], 'はじめて 着いた 場面');
  await useGlass(bot);
  assert.equal(bot.s.map, PRESENT_FIELD, '今へ もどる');
  // 町の 中では 使えない
  await place(bot, C7_FIELD, C7_POS.kingdomIn.x, C7_POS.kingdomIn.y);
  assert.equal(glassCheck(world, bot.s).key, 'town');
});

// ───────────── 神殿の とき方 ─────────────
test('みどりの水の神殿: どの 階も ひとりで 下へ 行ける・時の砂時計を 使わないと 行けない 階・今の がわから もどれる', () => {
  const start = (n) => (n >= 5 ? [LETTER.start(LETTER_TEMPLE)] : []);
  for (let n = 1; n <= C7T_FLOORS; n++) {
    const r = solve(n, { start: start(n) });
    assert.ok(r.goals.length, `${n}階: ひとりで ${n === 8 ? '広間へ' : '下へ'} 行ける`);
    const noShift = solve(n, { start: start(n), shift: false });
    if ([1, 2, 3, 5, 6].includes(n)) assert.ok(!noShift.goals.length, `${n}階: 時の砂時計を 使わないと 行けない`);
    else assert.ok(noShift.goals.length, `${n}階: 時の砂時計なしでも 行ける`);
    // 今の がわの どこに いても、千年前に もどれる 場所まで 歩ける（とじこめられない）
    if (n > C7T_NOW_FLOORS) continue;
    const now = MAPS[c7tMapId(n, true)], past = MAPS[c7tMapId(n)];
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
  // 3階: レバーを 引かないと 下の 水路は わたれない・5階: 手紙が ないと 番人は 動かない・6階: カリムが いない ひとりでは 開かない
  assert.ok(!solve(3, {}).goals.length === false);
  const r3 = solve(3, {});
  assert.ok(r3.goals.every((g) => g.flags.includes(LEVER3)), '3階は レバーを 引いてから');
  assert.ok(!solve(5, {}).goals.length, '5階: みこの 手紙が ないと 番人は 動かない');
  assert.ok(solve(5, { start: [LETTER.start(LETTER_TEMPLE)] }).goals.every((g) => g.flags.includes(LETTER.found(LETTER_TEMPLE))));
  assert.ok(!solve(6, { karim: false }).goals.length, '6階: ひとりで カリムも いないと 開かない');
  assert.ok(solve(6, { karim: false, family: true }).goals.length, '6階: 家族 2人なら 開く');
  // 1階の 出口は 千年前の 神殿の とびらの 外
  const f1 = MAPS[c7tMapId(1)];
  const out = f1.warpAt.get(C7T_POS[1].up.y * f1.w + C7T_POS[1].up.x).to;
  assert.equal(out.map, C7_FIELD);
  const F = MAPS[C7_FIELD];
  assert.equal(F.warpAt.get(TEMPLE_DOOR.y * F.w + TEMPLE_DOOR.x).to.map, c7tMapId(1));
  assert.ok(isBlocked(F, TEMPLE_DOOR.x, TEMPLE_DOOR.y, () => false) && !isBlocked(F, TEMPLE_DOOR.x, TEMPLE_DOOR.y, (fl) => fl === C7.gate), '神殿の とびらは 門番を たおすと 開く');
  // 休み所（4階・7階の おく）のいずみ
  for (const n of C7T_REST) assert.ok(MAPS[c7tMapId(n)].actions.some((a) => a.script === 'c7_tfont'), `${n}階の いずみ`);
});

test('ふき上げる 水（7階）: a と b は となりあわない・あいだに どちらの 時間でも ふさがらない 待てる ゆか・待たないと 通れない', () => {
  const P = C7T_POS[7];
  const m = MAPS[c7tMapId(7)];
  assert.ok(P.spoutA.length >= 4 && P.spoutB.length >= 4);
  const k = (p) => `${p.x},${p.y}`;
  const A = new Set(P.spoutA.map(k)), B = new Set(P.spoutB.map(k));
  for (const p of [...P.spoutA, ...P.spoutB]) {
    const other = A.has(k(p)) ? B : A;
    for (const [dx, dy] of D4) assert.ok(!other.has(`${p.x + dx},${p.y + dy}`), `(${p.x},${p.y}) の となりに ちがう 組の 水が ない`);
    // となりに どちらの 時間でも ふさがらない ゆか
    const wait = D4.some(([dx, dy]) => {
      const x = p.x + dx, y = p.y + dy;
      return !isBlocked(m, x, y, (f) => f === '@fireA') && !isBlocked(m, x, y, (f) => f === '@fireB') && !A.has(`${x},${y}`) && !B.has(`${x},${y}`);
    });
    assert.ok(wait, `(${p.x},${p.y}) の となりに 待てる ゆか`);
    assert.ok(isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireA' : '@fireB')), 'ふき上げる 時は 通れない');
    assert.ok(!isBlocked(m, p.x, p.y, (f) => f === (A.has(k(p)) ? '@fireB' : '@fireA')), '休んでいる 時は 通れる');
  }
  // 時間が 止まった まま（待たない）では 通れない
  const noWait = (() => {
    const a = c7tArrive(7);
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
    return seen.has(`${P.down.x},${P.down.y}`);
  })();
  assert.ok(!noWait, 'ずっと 同じ 時間では 通れない');
  assert.ok(solve(7).goals.length, '待てば 通れる');
  // 今の がわは 砂で うまっている（ふき上げる 水は 千年前だけ）
  for (const p of P.spoutA) assert.equal(MAPS[c7tMapId(7, true)].tiles[p.y * 36 + p.x], T.C7_SAND);
});

// ───────────── サーバーで: 3階・5階（時をこえる手紙）・6階 ─────────────
test('サーバー: 3階の 水門の レバー（千年前だけ）・5階 みこの 手紙を 千年前の 番人に → 今の 番人が 道を あける', { timeout: 200000 }, async () => {
  const { bot, c } = await setup(7201, 'c7_temple', { extra: [TF7(2), TF7(3), TF7(4), TF7(5)] });
  // 3階
  const L = C7T_POS[3].lever;
  await place(bot, c7tMapId(3, true), L.x, L.y + 1);
  await examine(bot, L.x, L.y);
  assert.ok(!c.flags[LEVER3], '今の レバーは さびついている');
  await useGlass(bot);
  bot.choice = 0;
  await examine(bot, L.x, L.y);
  assert.ok(c.flags[LEVER3], '千年前で 引いた');
  const W = C7T_POS[3].lower[0];
  assert.ok(!isBlocked(MAPS[c7tMapId(3)], W.x, W.y, (f) => !!c.flags[f]), '下の 水路の 水が ひいた');
  assert.equal(effectiveTile(MAPS[c7tMapId(3, true)], L.x, L.y, (f) => !!c.flags[f]), T.LEVER_ON, '今も 引いた まま');
  // 5階: 先に 今の 番人（手紙が ない）
  const G = C7T_POS[5].guard;
  await place(bot, c7tMapId(5, true), G.x - 1, G.y);
  let f0 = bot.msgs.length;
  await examine(bot, G.x, G.y);
  assert.ok(said(bot, 'ミコ', f0) && !c.flags[LETTER.found(LETTER_TEMPLE)]);
  // 千年前の 番人（手紙が まだ ない）
  await useGlass(bot);
  await examine(bot, G.x, G.y);
  assert.ok(!c.flags[LETTER.bury(LETTER_TEMPLE)]);
  // 4階の みこ → 手紙
  await place(bot, c7tMapId(4), C7T_POS[4].miko.x, C7T_POS[4].miko.y + 1);
  await talk(bot, 'c7_miko');
  assert.ok(c.flags[LETTER.start(LETTER_TEMPLE)] && c.keyItems.includes(MIKO_LETTER), 'みこの 手紙を もらった');
  assert.equal(c.objective, C7_OBJ.miko);
  // 今の 番人は まだ 動かない（千年前で 入れる 前）
  await place(bot, c7tMapId(5, true), G.x - 1, G.y);
  await examine(bot, G.x, G.y);
  assert.ok(!c.flags[LETTER.found(LETTER_TEMPLE)], '千年前で 入れる 前は 見つからない');
  // 千年前で 入れる → 今で 読む
  await useGlass(bot);
  bot.choice = 0;
  await examine(bot, G.x, G.y);
  assert.ok(c.flags[LETTER.bury(LETTER_TEMPLE)] && !c.keyItems.includes(MIKO_LETTER), '番人の 箱に 入れた');
  await useGlass(bot);
  f0 = bot.msgs.length;
  await examine(bot, G.x, G.y);
  assert.ok(c.flags[LETTER.found(LETTER_TEMPLE)] && said(bot, 'サラサ', f0), '千年前の 手紙が とどいた');
  assert.ok(!isBlocked(MAPS[c7tMapId(5, true)], G.x, G.y, (f) => !!c.flags[f]), '番人が 道を あけた');
  await walkTo(bot, 27, 5);
  await useGlass(bot);
  assert.equal(bot.s.map, c7tMapId(5));
  await walkTo(bot, C7T_POS[5].down.x, C7T_POS[5].down.y);
  assert.equal(bot.s.map, c7tMapId(6), '6階へ');
  assert.ok(c.flags[TF7(6)], '6階に 来た');
});

test('6階の 水の 石: ひとり（千年前の 石で カリムに 待ってもらう）・家族 2人（1人ずつ 別の 時代で。どちらが 先でも）', { timeout: 200000 }, async () => {
  const P = C7T_POS[6];
  {
    const { bot, c } = await setup(7301, 'c7_temple', { extra: [TF7(6)] });
    await place(bot, c7tMapId(6, true), P.plate1.x, P.plate1.y - 1);
    const f0 = bot.msgs.length;
    await stepOn(bot, P.plate1.x, P.plate1.y);
    assert.ok(!c.flags[OPEN6] && said(bot, '千年前の、もう1つの水の石', f0), 'ひとりでは 開かない');
    await place(bot, c7tMapId(6), P.plate2.x, P.plate2.y - 1);
    bot.choice = 0;
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(c.flags[WAIT6] && !c.flags[OPEN6], 'カリムが 待つ');
    await useGlass(bot);
    await walkTo(bot, P.plate1.x, P.plate1.y);
    assert.ok(c.flags[OPEN6] && !c.flags[WAIT6], 'カリムが 千年前の 石を おさえて 開いた');
    for (const now of [false, true]) assert.ok(!isBlocked(MAPS[c7tMapId(6, now)], P.door.x, P.door.y, (f) => !!c.flags[f]), 'どちらの 時代も 開く');
    // 今の がわの 近道を 通って 東の へやで 千年前へ
    await walkTo(bot, P.door.x + 10, P.door.y);
    await useGlass(bot);
    assert.equal(bot.s.map, c7tMapId(6));
    await walkTo(bot, P.down.x, P.down.y);
    assert.equal(bot.s.map, c7tMapId(7), '近道で 7階へ');
  }
  {
    const { bot, c } = await setup(7302, 'c7_temple', { extra: [TF7(6)], karim: false });
    await place(bot, c7tMapId(6), P.plate2.x, P.plate2.y - 1);
    await stepOn(bot, P.plate2.x, P.plate2.y);
    assert.ok(!c.flags[WAIT6], 'カリムが いないと 待ってもらえない');
  }
  for (const first of ['yui', 'papa']) {
    const { world, papa, yui, Pa, Y } = await family(first === 'yui' ? 7303 : 7304, 'c7_temple', [TF7(6)]);
    world.placeSession(Pa, c7tMapId(6), P.plate2.x + 0.5, P.plate2.y - 0.5, 'down', true);
    world.placeSession(Y, c7tMapId(6, true), P.plate1.x + 0.5, P.plate1.y - 0.5, 'down', true);
    await play(papa, { others: [yui] });
    papa.choice = 1; // カリムには たのまない
    yui.choice = 1;
    const yFlags = JSON.stringify(Y.char.flags);
    const steps = first === 'yui' ? [[yui, P.plate1], [papa, P.plate2]] : [[papa, P.plate2], [yui, P.plate1]];
    for (const [b, p] of steps) await stepOn(b, p.x, p.y, { others: [b === papa ? yui : papa] });
    assert.ok(Pa.char.flags[OPEN6] && !Pa.char.flags[WAIT6], `${first}が 先: 2人で 開いた`);
    assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは かわらない');
  }
});

// ───────────── 通し ─────────────
test('通しで: c6_clear → トキネ → 千年前の コガネ地方 → 緑の王国（カリムが ゲスト）→ 門番 → 神殿 → オクタリア → カリムが 酒場へ（c7_karim）', { timeout: 300000 }, async () => {
  const { world, bot, c } = await setup(7401, 'c6_clear');
  // 今の ほしみの丘の トキネ
  const tok = MAPS.overworld.npcById.tokine_c6;
  await place(bot, 'overworld', Math.floor(tok.x), Math.floor(tok.y) + 1);
  await talk(bot, 'tokine_c6');
  assert.ok(c.flags[C7.start] && c.objective === C7_OBJ.start, 'c7_start');
  assert.ok(!c.flags.c6_orn_start, 'かざりの より道は そのあと');
  // 今の コガネ地方の 王都の 北で 砂時計 → 千年前
  await place(bot, PRESENT_FIELD, 40, 80);
  await useGlass(bot);
  assert.equal(bot.s.map, C7_FIELD);
  await stepOn(bot, 40, 81);
  assert.ok(c.flags[ARRIVE7] && c.objective === C7_OBJ.arrive);
  // 緑の王国（北の 門から 入る）
  await walkTo(bot, KINGDOM.x + 25, KINGDOM.y + 1);
  assert.ok(c.flags[C7.kingdom] && c.guests.includes('karim'), 'カリムが ゲスト');
  assert.equal(c.objective, C7_OBJ.kingdom);
  assert.equal(bot.s.map, C7_FIELD);
  // 神殿の 前の 門番（c7_gate）
  const fought = [];
  await place(bot, C7_FIELD, GATE_BOSS.x, TEMPLE_YARD.y + TEMPLE_YARD.h + 1);
  await walkTo(bot, GATE_BOSS.x, GATE_BOSS.y + 2, { fought });
  assert.deepEqual(fought, ['c7_gate']);
  assert.ok(c.flags[C7.gate] && c.objective === C7_OBJ.gate);
  // 神殿へ
  await walkTo(bot, TEMPLE_DOOR.x, TEMPLE_DOOR.y);
  assert.equal(bot.s.map, c7tMapId(1));
  await stepOn(bot, Math.floor(c7tArrive(1).x), Math.floor(c7tArrive(1).y) - 1);
  assert.ok(c.flags[C7.temple] && c.objective === C7_OBJ.temple, 'c7_temple');
  // 8階（しかけは 上の テストで）
  for (const f of [TF7(2), TF7(3), TF7(4), TF7(5), TF7(6), TF7(7), LEVER3, OPEN6]) c.flags[f] = true;
  const a8 = c7tArrive(8);
  await place(bot, c7tMapId(8), Math.floor(a8.x), Math.floor(a8.y));
  await stepOn(bot, Math.floor(a8.x), Math.floor(a8.y) - 1);
  assert.ok(c.flags[TF7(8)] && c.objective === C7_OBJ.tf8);
  const T8 = C7T_POS[8].trigger;
  const f2 = [];
  await walkTo(bot, 17, T8.y, { fought: f2 });
  assert.deepEqual(f2, ['c7_temple']);
  assert.ok(c.flags[WIN7] && c.flags[C7.karim], 'c7_karim');
  assert.ok(!c.guests.includes('karim'), 'カリムは ゲストから はずれる');
  assert.equal(c.objective, C7_OBJ.karim);
  assert.ok(said(bot, '第7章の続きはアップデートで！'));
  assert.ok(said(bot, 'ルミナの町の酒場の仲間になった'));
  assert.equal(bot.s.map, C7_FIELD, 'さいごは 緑の城');
  // 酒場の 仲間（unlock）
  assert.ok(NPC_SUPPORTS.some((s) => s.id === 'npc_karim' && c.flags[s.unlock]));
  // もう一度 話しても すすまない
  const n = bot.msgs.length;
  await talk(bot, 'c7_king');
  assert.ok(!said(bot, 'ルミナの町の酒場の仲間になった', n));
  void world;
});

test('負けた 時・とちゅうで 切れた 時: 門番・オクタリアに 負けたら すすまない・さいごの 場面は 台座か 王さまで 続き', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(7501, 'c7_kingdom');
    await place(bot, C7_FIELD, GATE_BOSS.x, TEMPLE_YARD.y + TEMPLE_YARD.h + 1);
    await walkTo(bot, GATE_BOSS.x, GATE_BOSS.y + 2, { lose: () => true });
    assert.ok(!c.flags[C7.gate], '門番に 負けた');
  }
  {
    const { bot, c } = await setup(7502, 'c7_temple', { extra: [TF7(8)] });
    const a8 = c7tArrive(8);
    await place(bot, c7tMapId(8), Math.floor(a8.x), Math.floor(a8.y));
    await walkTo(bot, 17, C7T_POS[8].trigger.y, { lose: () => true });
    assert.ok(!c.flags[WIN7] && !c.flags[C7.karim], 'オクタリアに 負けた');
  }
  {
    // 勝った あと 切れた（WIN7 だけ）→ 王さまに 話すと お城の 場面
    const { bot, c } = await setup(7503, 'c7_temple', { extra: [TF7(8), WIN7] });
    assert.equal(c.objective, C7_OBJ.win);
    await place(bot, C7_FIELD, C7_POS.hall.x, C7_POS.hall.y);
    await talk(bot, 'c7_king');
    assert.ok(c.flags[C7.karim] && !c.guests.includes('karim'));
  }
  {
    const { bot, c } = await setup(7504, 'c7_temple', { extra: [TF7(8), WIN7] });
    const A = C7T_POS[8].altar;
    await place(bot, c7tMapId(8), A.x, A.y + 1);
    await examine(bot, A.x, A.y);
    assert.ok(c.flags[C7.karim], '台座でも 続き');
  }
});

// ───────────── 時をこえる手紙（より道）─────────────
test('時をこえる手紙: 千年前で うめる 前は 今に 何も ない・うめると 今の おなじ 場所で 見つかる・ごほうびは 1回だけ・クエストの 画面と ヒント', { timeout: 300000 }, async () => {
  const S = MAPS[PRESENT_FIELD], F = MAPS[C7_FIELD];
  for (const k of LETTER_SIDE) {
    const p = LETTER_SPOTS[k];
    const dig = S.npcById[`c7_dig_${k}`], bury = F.npcById[`c7_bury_${k}`];
    assert.ok(dig && bury && dig.x === bury.x && dig.y === bury.y && dig.x === p.x, `${k}: おなじ 座標`);
    assert.ok(!condOk(dig.show, (f) => f === LETTER.start(k)), 'うめる 前は 今に 何も ない');
    assert.ok(condOk(dig.show, (f) => f === LETTER.bury(k)) && !condOk(dig.show, (f) => f === LETTER.bury(k) || f === LETTER.found(k)), 'うめた あと・見つける まで');
    assert.ok(F.npcById[LETTER_ASKERS[k]], 'たのむ 人');
    assert.ok(letterReward(k).length, `ごほうび ${k}`);
  }
  assert.ok(C7_LETTER_REWARDS);
  // ヒントの 一らん（たのまれごと ぜんぶに ヒント）
  const hints = subQuestHints();
  for (const q of C7_SIDE_QUESTS) assert.ok(hints.some((h) => h.name === q.name && h.hint && h.npc), q.name);
  // サーバー: 1（王国の 子ども）
  const { world, bot, c } = await setup(7601, 'c7_kingdom');
  const kid = F.npcById.c7_kid;
  await place(bot, C7_FIELD, Math.floor(kid.x), Math.floor(kid.y) + 1);
  bot.choice = 0;
  await talk(bot, 'c7_kid');
  assert.ok(c.flags[LETTER.start(1)]);
  const q1 = subQuests(c).find((q) => q.name === letterName(1));
  assert.ok(q1 && q1.find === 'c7_bury_1' && !q1.ready, 'クエストの 画面: うめる 場所');
  // うめる 前に 今の 同じ 場所を しらべても 何も ない
  const p = LETTER_SPOTS[1];
  await place(bot, PRESENT_FIELD, p.x, p.y + 1);
  await talk(bot, 'c7_dig_1');
  assert.ok(!c.flags[LETTER.found(1)]);
  // 千年前で うめる
  await place(bot, C7_FIELD, p.x, p.y + 1);
  bot.choice = 0;
  await talk(bot, 'c7_bury_1');
  assert.ok(c.flags[LETTER.bury(1)]);
  const q2 = subQuests(c).find((q) => q.name === letterName(1));
  assert.ok(q2 && q2.who === 'c7_dig_1' && q2.ready, 'クエストの 画面: 今で さがす');
  // 今で 見つける（ごほうび）
  const [rid, rn] = letterReward(1)[0];
  const cnt = () => (c.items || []).filter((e) => e.id === rid).reduce((s, e) => s + e.n, 0);
  const before = cnt();
  await place(bot, PRESENT_FIELD, p.x, p.y + 1);
  bot.choice = 0;
  await talk(bot, 'c7_dig_1');
  assert.ok(c.flags[LETTER.found(1)] && cnt() === before + rn, 'ごほうび');
  assert.ok(labDoneQuests(c).includes(letterName(1)), 'クリアした たのまれごと');
  // 2回目は 何も ない
  await talk(bot, 'c7_dig_1');
  assert.equal(cnt(), before + rn, 'ごほうびは 1回だけ');
  void world;
});

// ───────────── 文字・絵 ─────────────
test('文字: 第7章 Step 1・2 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない', () => {
  const files = gameFiles().map((f) => f.replace(/\\/g, '/').replace(/^.*?family-rpg\//, ''));
  const mine = ['public/js/shared/data/story-c7.js', 'public/js/shared/data/sidequests-c7.js', 'public/js/shared/data/items-c7-key.js', 'public/js/shared/data/shops-c7.js',
    'public/js/shared/maps/c7.js', 'public/js/shared/maps/c7-field.js', 'public/js/shared/maps/c7-kingdom-rows.js',
    'public/js/shared/maps/c7-temple.js', 'public/js/shared/maps/c7-temple-rows.js', 'public/js/shared/maps/c7-flags.js'];
  for (const f of mine) assert.ok(files.some((g) => g.endsWith(f)), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.replace(/\\/g, '/').endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const flags = flagsOf(...UPTO('c7_temple'), TF7(5));
  const all = JSON.stringify(Object.entries(SCRIPTS).filter(([k]) => /^c7_/.test(k)).map(([, fn]) => { try { return fn(ctx(flags)); } catch { return []; } }));
  assert.ok(!/なかま/.test(all), 'なかま → 仲間');
});

test('絵と 音: 神殿の タイル（2D は 16×16 を ぬる・流れる 水路は 動く・2.5D）・テーマ・人の え・神殿の 曲', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { CH6_TILES, CH6_PROPS, ch6BlockSpec, CH6_THEMES } = await import('../public/js/client/render/tiles-ch6.js');
  const { partOfTile } = await import('../public/js/client/render/themes.js');
  const { npcOpts, paintSpecial } = await import('../public/js/client/render/chars.js');
  const { CH6_SPECIALS } = await import('../public/js/client/render/ch6-art.js');
  const { CH6_TRACKS } = await import('../public/js/client/audio-ch6.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  for (let id = 317; id <= 325; id++) {
    assert.ok(CH6_TILES.includes(id) && hasTileArt(id), `${id}`);
    assert.equal(partOfTile(id), 'none');
    for (const f of [0, 1, 2]) for (const m of [0, 1, 15]) {
      const p = paintTile(id, 0x21, f, m);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f} m${m}`);
      assert.ok(p.px.every((cc) => HEX.test(cc)));
    }
  }
  for (const id of [T.C7_CUR_E, T.C7_SPOUT]) {
    assert.ok(isAnimated(id));
    assert.notEqual(paintTile(id, 0, 0, 0).px.join(), paintTile(id, 0, 1, 0).px.join(), `${TILE_INFO[id].name} が 動く`);
  }
  assert.notEqual(paintTile(T.C7_CUR_E, 0, 0, 0).px.join(), paintTile(T.C7_CUR_W, 0, 0, 0).px.join(), '東と 西は ちがう 絵');
  for (const id of [T.C7_SPOUT, T.C7_GUARD]) assert.ok(CH6_PROPS[id], `2.5D の ${TILE_INFO[id].name}`);
  assert.ok(ch6BlockSpec(T.C7_SAND, 0)?.h > 0.3);
  assert.ok(CH6_THEMES.c7_temple, 'テーマ');
  // マップの タイルは ぜんぶ 絵が ある
  for (const id of [...C7T_MAPS, C7_FIELD]) {
    const m = MAPS[id];
    const tiles = new Set(m.tiles);
    for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); for (const [, t] of g.levels || []) tiles.add(t); }
    for (const t of tiles) if (t !== undefined) assert.ok(hasTileArt(t), `${id}: ${TILE_INFO[t]?.name ?? t}`);
  }
  for (const k of ['c7_witch_npc', 'c7_gate_npc']) {
    assert.ok(CH6_SPECIALS.includes(k), k);
    for (const f of [0, 1]) assert.ok(paintSpecial(k, 'down', f)?.px.some(Boolean), `${k} f${f}`);
  }
  const sprites = new Set(['karim', 'c7_witch', 'c7_miko', 'c7_princess']);
  for (const id of [C7_FIELD, ...C7T_MAPS]) for (const n of MAPS[id].npcs) if (/^c7_/.test(n.id)) sprites.add(n.sprite);
  for (const s of sprites) assert.ok(npcOpts(s) || paintSpecial(s, 'down', 0), `人の え ${s}`);
  assert.ok(CH6_TRACKS.c7_temple?.ch?.length, '神殿の 曲');
  for (const id of C7T_MAPS) assert.ok(['c7_temple', 'canal', 'boss6'].includes(MAPS[id].bgm), id);
  void C7T_CHEST_ERA;
  void C7T_ROWS;
});
