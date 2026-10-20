// 第5章「空にうかぶ大地」Step 9（A9: てっぺんと エンディング）※ ネタバレ注意（物語の さいごを ためす）
// 影の城 12階（A8）→ てっぺん「星のない広間」（c5_top）→ ノクト（本気。nocto_2 → c5_nocto2）→ 魔王ソリトゥス（solitus → c5_solitus）
// → エンディング（てっぺん → クモイ地方の 空〈c5_end_a〉→ ハネノ〈c5_end_b〉→ ホシフル村の 星祭り・ふりかえり・第1部 完）→ c5_clear
// ノクト（本気）・ソリトゥスの 戦いの しくみと 酒場の ノクトは B9（戦い）。ここでは 戦いは テストの 中で 勝たせる（負けも ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, canStand } from '../public/js/shared/maps/index.js';
import { T, TILE_INFO } from '../public/js/shared/tiles.js';
import {
  TOP, END_A, END_B, FONT_FLAG, TOP_POS, CASTLE_TOP_ID, CASTLE_TOP_ARRIVE, CASTLE_TOP_MAPS, TOP_ROWS,
} from '../public/js/shared/maps/castle-top.js';
import { MEMORY_SHARD_FLAGS } from '../public/js/shared/maps/memory.js';
import { LETTER_FLAG, GATHER, GATHER_FLAG } from '../public/js/shared/maps/earth.js';
import { HANONO_POS, KUMOI_POS } from '../public/js/shared/maps/kumoi.js';
import { FEST_DECO } from '../public/js/shared/maps/tower.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { STORY_STEPS, SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { CH5_STEPS, CH5_OBJECTIVE_TARGETS, CH5_OBJECTIVE_TALK } from '../public/js/shared/data/story-ch5.js';
import { TOP_STEPS, TOP_OBJ, TOP_STORY_SCRIPTS, TOP_TOWN_LINES, PART1_ROLL, NOCTO_SUPPORT, endingFrom } from '../public/js/shared/data/story-castle-top.js';
// castle-top-stub: B9 の data/companions-castle.js・A8 の 影の城の だいほんが 入ったら、そちらから import する
import { NOCTO_COMPANION, CASTLE_STEPS } from '../public/js/shared/data/castle-top-stub.js';
import { NPC_SUPPORTS } from '../public/js/shared/data/shops.js';
import { objectiveFromFlags, KNOWN_OBJECTIVES, repairObjective } from '../public/js/shared/data/progress.js';
import { talkFor } from '../public/js/shared/data/party-talk.js';
import { questMarks } from '../public/js/shared/data/quest-targets.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { tavernInfo, recruitNpc } from '../public/js/shared/world/party.js';
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
const VIL = PLACES.village;
// 影の城の あと（A8）までの フラグ（集まった 7人とも 話した）
const SEAL3 = () => [...UPTO('c5_seal3'), ...GATHER.map(GATHER_FLAG)];

function boost(c, level) {
  gainExp(c, expForLevel(level) - c.exp);
  Object.assign(c.equip, { weapon: 'platinum_sword', armor: 'platinum_mail', shield: 'platinum_shield', head: 'platinum_helm' });
  c.jobs[c.job] = { lv: 10, b: 999 };
}
async function setup(seed, upto = 'c5_seal3', { shards = false, letter = false, extra = [] } = {}) {
  const clock = { now: at(hour(10)) };
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false, now: () => clock.now });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of [...SEAL3(), ...UPTO(upto)]) c.flags[f] = true;
  if (shards) for (const f of MEMORY_SHARD_FLAGS) c.flags[f] = true;
  if (letter) c.flags[LETTER_FLAG] = true;
  for (const f of extra) c.flags[f] = true;
  for (const k of ['wind_flute', 'star_lamp', 'yukina_song', 'hoshifuru_stone']) if (!c.keyItems.includes(k)) c.keyItems.push(k);
  c.objective = objectiveFromFlags(c);
  c.timeShift = 0;
  boost(c, 55);
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
// つなぎなおす（おなじ キャラで もう一度 あそぶ）
async function reconnect(world, old) {
  const id = old.char.id;
  const bot = new Bot(world, old.name);
  await bot.login();
  bot.send({ t: 'play', id });
  await bot.settle();
  bot.s.repelUntil = 1e15;
  return bot;
}
// その マップで 歩いて 行ける マス
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
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => D4.some(([dx, dy]) => r(p.x + dx, p.y + dy));
const arriveCell = () => [Math.floor(CASTLE_TOP_ARRIVE.x), Math.floor(CASTLE_TOP_ARRIVE.y)];
const T9 = TOP_POS.trigger;

// てっぺんに 着いて（c5_top）、大広間へ 入ると ノクト → ソリトゥス → エンディング（ぜんぶ）
async function climbAndFight(bot, opts = {}) {
  const [ax, ay] = arriveCell();
  await place(bot, CASTLE_TOP_ID, ax, ay);
  await stepOn(bot, ax, ay - 1, opts);
  await place(bot, CASTLE_TOP_ID, 12, T9.y + 1);
  return stepOn(bot, 12, T9.y, opts);
}

// ───────────── すすみぐあい・目標・ヒント・しるし ─────────────
test('すすみぐあい: c5_seal3 → c5_top → c5_nocto2 → c5_solitus → c5_clear（名前の 約束）。目標・仲間会話・地図の しるし・目標の なおし', () => {
  assert.deepEqual(TOP_STEPS, ['c5_top', 'c5_nocto2', 'c5_solitus', 'c5_clear'], '名前の 約束（plan-ch5.md の 17）');
  assert.deepEqual(CASTLE_STEPS, ['c5_croad', 'c5_cin', 'c5_seal1', 'c5_seal2', 'c5_seal3'], 'A8 の 名前');
  const si = CH5_STEPS.indexOf('c5_seal3');
  assert.ok(CH5_STEPS.indexOf('c5_gather') < CH5_STEPS.indexOf('c5_croad'), 'c5_gather の うしろに A8');
  assert.deepEqual(CH5_STEPS.slice(si + 1), TOP_STEPS, 'c5_seal3 の うしろに つづく（第5章の さいご）');
  assert.equal(STORY_STEPS.at(-1), 'c5_clear', '第1部の さいごの すすみ');
  assert.deepEqual(CASTLE_TOP_MAPS, ['castle_top'], 'マップの ID の 約束');
  // フラグごとの 目標
  const f = (...l) => ({ flags: flagsOf(...SEAL3(), ...UPTO(l[0]), ...l) });
  assert.equal(objectiveFromFlags(f('c5_top')), TOP_OBJ.top);
  assert.equal(objectiveFromFlags(f('c5_nocto2')), TOP_OBJ.nocto2);
  assert.equal(objectiveFromFlags(f('c5_solitus')), TOP_OBJ.solitus);
  assert.equal(objectiveFromFlags(f('c5_solitus', END_A)), TOP_OBJ.endA);
  assert.equal(objectiveFromFlags(f('c5_solitus', END_A, END_B)), TOP_OBJ.endB);
  assert.equal(objectiveFromFlags(f('c5_clear', END_A, END_B)), TOP_OBJ.clear);
  assert.equal(objectiveFromFlags(f('c5_clear')), TOP_OBJ.clear, 'クリアの しるしが あれば クリア');
  // クリアの 目標: ネタバレなしで「まだ 続く」・酒場の ノクト。「第5章の続きは…」では ない
  assert.ok(TOP_OBJ.clear.includes('第1部クリア') && TOP_OBJ.clear.includes('酒場') && TOP_OBJ.clear.includes('いつかのアップデート'));
  assert.ok(!/ソリトゥス|第2部の|魔王/.test(TOP_OBJ.clear), 'ネタバレなし');
  // 目標の なおし（今の 版に ない 文 → すすみぐあいから）
  for (const [fl, want] of [[['c5_top'], TOP_OBJ.top], [['c5_solitus'], TOP_OBJ.solitus], [['c5_solitus', END_A], TOP_OBJ.endA], [['c5_clear'], TOP_OBJ.clear]]) {
    const c = { ...f(...fl), objective: 'むかしの版の目標の文' };
    assert.ok(repairObjective(c));
    assert.equal(c.objective, want, fl.join(','));
    assert.ok(!repairObjective(c), '知っている 文は そのまま');
  }
  // どの 目標にも 仲間会話と 行き先
  for (const [k, t] of Object.entries(TOP_OBJ)) {
    assert.ok(KNOWN_OBJECTIVES.has(t), k);
    assert.ok(CH5_OBJECTIVE_TARGETS[t]?.length, `行き先 ${k}`);
    assert.ok(CH5_OBJECTIVE_TALK[t], `仲間会話 ${k}`);
    for (const kind of ['self', 'bold', 'kind', 'kid']) assert.ok(talkFor(t, kind) !== `次は「${t.replace(/\n/g, '')}」ですね。`, `仲間会話: ${k} ${kind}`);
  }
  // 地図の しるし
  const mark = (obj, map, extra = []) => questMarks({ flags: flagsOf(...SEAL3(), ...extra), objective: obj }, map).filter((m) => m.kind === 'main');
  assert.ok(mark(TOP_OBJ.top, CASTLE_TOP_ID, ['c5_top']).some((m) => m.x === TOP_POS.font.x && m.y === TOP_POS.font.y), 'いずみ');
  assert.ok(!mark(TOP_OBJ.top, CASTLE_TOP_ID, ['c5_top', FONT_FLAG]).some((m) => m.x === TOP_POS.font.x && m.y === TOP_POS.font.y), '休んだら 消える');
  assert.ok(mark(TOP_OBJ.top, CASTLE_TOP_ID, ['c5_top']).some((m) => m.x === TOP_POS.nocto.x && m.y === TOP_POS.nocto.y), 'ノクト');
  assert.ok(mark(TOP_OBJ.solitus, CASTLE_TOP_ID).some((m) => m.x === TOP_POS.altar.x && m.y === TOP_POS.altar.y), '祭だん');
  assert.equal(TOP_OBJ.endA, TOP_OBJ.solitus, 'エンディングの とちゅうは おなじ 文');
  assert.ok(mark(TOP_OBJ.solitus, 'hanono').some((m) => m.x === HANONO_POS.sorane.x && m.y === HANONO_POS.sorane.y), 'ハネノの 長ソラネ');
  assert.ok(mark(TOP_OBJ.solitus, 'overworld').some((m) => m.x === MAPS.overworld.npcById.elder.x), 'ホシフル村の ばあちゃん');
  assert.ok(mark(TOP_OBJ.clear, 'overworld').length, 'ルミナの 酒場');
  // パーティー全員で 見る だいほん
  for (const id of TOP_STORY_SCRIPTS) assert.ok(STORY_SCRIPTS.has(id) && SCRIPTS[id], id);
  for (const id of ['elder', 'c5_sorane', 'c5_gather_grandma']) assert.ok(STORY_SCRIPTS.has(id), `${id}: エンディングの 続きも 家族と いっしょに`);
});

// ───────────── マップ ─────────────
test('星のない広間: 12階から 着く ところ・いずみ・ノクト・祭だんへ 行ける。下りかいだん・糸で 外へ。魔物は 出ない。ソリトゥスの あと 星が もどる', () => {
  const m = MAPS[CASTLE_TOP_ID];
  assert.ok(m && m.kind === 'dungeon' && !m.indoor, 'ダンジョン（糸・リレミトが 使える）');
  assert.equal(m.w, TOP_ROWS[0].length);
  assert.equal(CASTLE_TOP_ARRIVE.map, CASTLE_TOP_ID);
  const [ax, ay] = arriveCell();
  assert.ok(canStand(m, CASTLE_TOP_ARRIVE.x, CASTLE_TOP_ARRIVE.y, () => false), '着く ところに 立てる');
  assert.ok(m.triggers.some((t) => t.script === 'c5_ct_arrive' && ax >= t.x && ax < t.x + t.w && ay - 1 >= t.y && ay - 1 < t.y + t.h), '着いて 1歩で ことば');
  const r = reach(CASTLE_TOP_ID, [ax, ay], []);
  assert.ok(near(r, TOP_POS.font), 'いずみ');
  assert.ok(near(r, TOP_POS.altar), '祭だん');
  assert.ok(near(r, TOP_POS.nocto), 'ノクト');
  for (let x = 0; x < m.w; x++) assert.ok(!r(x, T9.y - 1) || m.triggers.some((t) => t.script === 'c5_ct_nocto' && x >= t.x && x < t.x + t.w), `大広間に 入る トリガーを よけて 通れない（${x}）`);
  const tr = m.triggers.find((t) => t.script === 'c5_ct_nocto');
  assert.deepEqual(tr.show, { all: ['c5_top'], not: ['c5_nocto2'] });
  const n = m.npcs.find((q) => q.id === 'nocto_top');
  assert.ok(n && n.sprite === 'nocto' && n.script === 'c5_ct_nocto' && n.show.not.includes('c5_nocto2'), 'ノクト（たおすと いない）');
  // 下りかいだん（12階へ。12階が まだ ない ときは 影の城の 前の 小島へ）
  const down = m.warps.find((w) => w.x === TOP_POS.down.x && w.y === TOP_POS.down.y);
  assert.ok(down && MAPS[down.to.map], '下りかいだん');
  if (down.to.map === 'kumoi') assert.ok(!isBlocked(MAPS.kumoi, Math.floor(down.to.x), Math.floor(down.to.y), (f) => f === 'c5_castle'), '小島に 立てる');
  else assert.equal(down.to.map, 'castle_12f');
  assert.ok(r(TOP_POS.down.x, TOP_POS.down.y), 'かいだんへ 行ける');
  const ex = dungeonExit(null, { map: CASTLE_TOP_ID, char: {} });
  assert.ok(ex && MAPS[ex.map] && MAPS[ex.map].kind !== 'dungeon', 'みちびきの糸で 外へ');
  // 魔物は 出ない
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) assert.ok(String(m.zoneAt(x, y)).startsWith('safe'), `${x},${y}`);
  // ソリトゥスを たおすと、ゆかに 星（星空の ゆか）・祭だんに 光
  const has = (f) => f === TOP.solitus;
  let floors = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (m.tiles[y * m.w + x] !== T.STARLESS_FLOOR) continue;
    floors++;
    assert.equal(effectiveTile(m, x, y, has), T.SKY_FLOOR, `${x},${y}`);
  }
  assert.ok(floors > 150, '広い 広間');
  assert.equal(effectiveTile(m, TOP_POS.altar.x, TOP_POS.altar.y, () => false), T.STARLESS_ALTAR);
  assert.equal(effectiveTile(m, TOP_POS.altar.x, TOP_POS.altar.y, has), T.SHARD_ALTAR);
  assert.equal(m.bgmAt(1, 1, false, () => false), 'memory', 'ノクトの 思い出の オルゴール');
  assert.equal(m.bgmAt(1, 1, false, has), 'ending5');
  // タイルの ID（A9 は 189・229 だけ）
  assert.equal(T.STARLESS_FLOOR, 189);
  assert.equal(T.STARLESS_ALTAR, 229);
  assert.ok(!TILE_INFO[T.STARLESS_FLOOR].solid && TILE_INFO[T.STARLESS_ALTAR].solid);
});

test('てっぺんに 着く（c5_top）・星の いずみで 回復と 記録', { timeout: 60000 }, async () => {
  const { bot, c } = await setup(9101);
  const [ax, ay] = arriveCell();
  await place(bot, CASTLE_TOP_ID, ax, ay);
  const from = bot.msgs.length;
  await stepOn(bot, ax, ay - 1);
  assert.ok(c.flags.c5_top && said(bot, '星のない広間', from), 'てっぺんに 着いた');
  assert.equal(c.objective, TOP_OBJ.top);
  // 2回目は 何も おきない
  const again = bot.msgs.length;
  await stepOn(bot, ax, ay - 2);
  assert.ok(!said(bot, '星のない広間」', again));
  c.hp = 1;
  const F = TOP_POS.font;
  await place(bot, CASTLE_TOP_ID, F.x + 1, F.y);
  bot.choice = 0;
  const f2 = bot.msgs.length;
  await examine(bot, F.x, F.y);
  assert.ok(said(bot, 'すっかり回復した', f2) && c.flags[FONT_FLAG], 'いずみで 休んだ');
  assert.ok(c.hp > 1);
  assert.ok(bot.msgs.slice(f2).some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'ui' && s[1] === 'church')), '記録（教会の 画面）');
});

// ───────────── ノクト（本気）・ソリトゥスの 台本 ─────────────
test('台本: showMon nocto_2 → bgm nocto_true → battle nocto_2 → c5_nocto2 → ソリトゥス「この子のさびしさは、わたしのものだ」→ showMon・bgm・battle solitus → c5_solitus', () => {
  for (const [id, bgm] of [['nocto_2', 'nocto_true'], ['solitus', 'solitus']]) {
    const fx = FIXED_ENCOUNTERS[id];
    assert.ok(fx && fx.boss && !fx.canFlee && fx.bgm === bgm && !fx.loseOk, `きまった 戦い ${id}（B9。まだ ない 時は 仮の データ）`);
  }
  const steps = SCRIPTS.c5_ct_nocto(ctx(flagsOf(...SEAL3(), 'c5_top')));
  const idx = (pred) => steps.findIndex(pred);
  const iMon = idx((s) => s[0] === 'showMon' && s[1] === 'nocto_2');
  const iBgm = idx((s) => s[0] === 'bgm' && s[1] === 'nocto_true');
  const iBat = idx((s) => s[0] === 'battle' && s[1] === 'nocto_2');
  const iN2 = idx((s) => s[0] === 'flag' && s[1] === 'c5_nocto2');
  const iSol = idx((s) => s[0] === 'say' && s[2] === 'この子のさびしさは、わたしのものだ。');
  const iBgm2 = idx((s) => s[0] === 'bgm' && s[1] === 'solitus');
  const iBat2 = idx((s) => s[0] === 'battle' && s[1] === 'solitus');
  const iMon2 = steps.slice(0, iBat2).map((s, i) => (s[0] === 'showMon' && s[1] === 'solitus' ? i : -1)).filter((i) => i >= 0).at(-1);
  const iS = idx((s) => s[0] === 'flag' && s[1] === 'c5_solitus');
  const iClear = idx((s) => s[0] === 'flag' && s[1] === 'c5_clear');
  assert.ok(iMon >= 0 && iBgm > iMon && iBat > iBgm && iN2 === iBat + 3, 'showMon → bgm → battle → すぐ c5_nocto2');
  assert.ok(iSol > iN2 && iSol < iMon2 && iBgm2 > iMon2 && iBat2 > iBgm2 && iS > iBat2 && iClear > iS, 'ソリトゥス → エンディング → c5_clear');
  assert.ok(steps.slice(iN2, iBat2).some((s) => s[0] === 'heal'), 'あいだに 回復');
  assert.ok(steps.some((s) => s[0] === 'roll' && s[1] === PART1_ROLL), 'ふりかえり');
  assert.deepEqual(SCRIPTS.c5_ct_nocto(ctx(flagsOf(...SEAL3(), 'c5_nocto2'))), [], 'たおした あとは 何も おきない');
  assert.deepEqual(SCRIPTS.c5_ct_nocto(ctx(flagsOf(...SEAL3()))), [], '着く 前は 何も おきない');
  // ふりかえり（第1章〜第5章・第1部 完）
  const roll = JSON.stringify(PART1_ROLL);
  for (const w of ['第1章「始まりの星」', '第2章「海をわたる風」', '第3章「星の竜がねむる山」', '第4章「砂の海にしずむ星」', '第5章「空にうかぶ大地」', 'ノクト']) assert.ok(roll.includes(w), w);
  assert.equal(PART1_ROLL.end, '第1部　完');
  for (const [k] of PART1_ROLL.lines) assert.ok(['h', 't', 's'].includes(k));
});

test('ことばの かわり: 思い出の かけら 6つ・ピピの 手紙を わたした・どちらも・どちらも ない（4とおりを 通しで。第5章クリアまで）', { timeout: 300000 }, async () => {
  const WANT = {
    shards: ['ぼくの思い出を、全部見たんだろう', '見つけて、くれたんだね'],
    noShards: ['ずっと、わからない'],
    letter: ['ピピの手紙、読んだよ', '「とべなくても、いっしょにいたい」', '字、へただったな'],
    noLetter: ['帰ってきてくれたんだね'],
    both: ['もう、わからない', '帰っても、いいのかな'],
    none: ['ひとりで、いい、はずなのに'],
  };
  for (const [i, [shards, letter]] of [[true, true], [true, false], [false, true], [false, false]].entries()) {
    const { bot, c } = await setup(9200 + i, 'c5_seal3', { shards, letter });
    const fought = [];
    const from = bot.msgs.length;
    await climbAndFight(bot, { fought });
    const has = (k) => WANT[k].every((w) => said(bot, w, from));
    const none = (k) => WANT[k].every((w) => !said(bot, w, from));
    const tag = `かけら${shards ? 6 : 0}・手紙${letter ? 'あり' : 'なし'}`;
    assert.ok(shards ? has('shards') && none('noShards') : has('noShards') && none('shards'), `${tag}: かけら`);
    assert.ok(letter ? has('letter') && none('noLetter') : has('noLetter') && none('letter'), `${tag}: 手紙`);
    assert.ok(shards && letter ? has('both') : none('both'), `${tag}: どちらも`);
    assert.ok(!shards && !letter ? has('none') : none('none'), `${tag}: どちらも ない`);
    // 通しで クリアまで
    assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['nocto_2', 'solitus'], `${tag}: 戦い`);
    for (const f of [...TOP_STEPS, END_A, END_B]) assert.ok(c.flags[f], `${tag}: ${f}`);
    assert.equal(c.objective, TOP_OBJ.clear);
    assert.ok(said(bot, 'この子のさびしさは、わたしのものだ。', from), 'ソリトゥス');
    assert.ok(said(bot, '生まれて初めて、まぶしく、光った', from), 'ノクトの 紋章が 光る');
    assert.ok(said(bot, '帰る場所は、ここにある', from), 'ばあちゃん');
    assert.ok(!c.keyItems.includes('hoshifuru_stone'), '星の 石の かけらは ノクトへ');
    assert.ok(said(bot, 'ピピの小さな羽が、大きく、大きく、広がった', from), 'ピピの 羽');
    assert.ok(said(bot, '5つの守り星が、夜空にならんで', from), '5つの 守り星');
    assert.ok(said(bot, '"roll"', from) && said(bot, '第1部　完', from), 'ふりかえりと 第1部 完');
    assert.equal(bot.s.map, 'overworld', 'ホシフル村で 終わる');
    assert.ok(Math.abs(bot.s.x - (VIL.x + 16.5)) < 3 && Math.abs(bot.s.y - (VIL.y + 14.5)) < 3);
    assert.ok(said(bot, 'ending5', from) && said(bot, 'nocto_true', from) && said(bot, '"solitus"', from), '曲');
  }
});

test('負けた とき: ノクトに 負けたら すすまない。ソリトゥスに 負けたら c5_nocto2 の まま → 祭だんを しらべると ソリトゥスから', { timeout: 200000 }, async () => {
  {
    const { bot, c } = await setup(9301);
    const fought = [];
    await climbAndFight(bot, { fought, lose: (id) => id === 'nocto_2' });
    assert.ok(fought.includes('nocto_2') && !c.flags.c5_nocto2, 'ノクトに 負けた');
    assert.ok(condOk(MAPS[CASTLE_TOP_ID].npcById.nocto_top.show, (f) => !!c.flags[f]), 'ノクトは まだ いる');
  }
  const { bot, c } = await setup(9302);
  const fought = [];
  await climbAndFight(bot, { fought, lose: (id) => id === 'solitus' });
  assert.ok(c.flags.c5_nocto2 && !c.flags.c5_solitus, 'ソリトゥスに 負けた（ノクトの 勝ちは のこる）');
  assert.equal(objectiveFromFlags(c), TOP_OBJ.nocto2);
  const A = TOP_POS.altar;
  await place(bot, CASTLE_TOP_ID, A.x, A.y + 1);
  const from = bot.msgs.length;
  const f2 = [];
  await examine(bot, A.x, A.y, { fought: f2 });
  assert.deepEqual(f2.filter((id) => FIXED_ENCOUNTERS[id]), ['solitus'], 'ソリトゥスから');
  assert.ok(said(bot, 'この子のさびしさは、わたしのものだ。', from));
  assert.ok(c.flags.c5_clear, 'そのまま エンディング');
});

// ───────────── とちゅうで 切れた とき ─────────────
test('とちゅうで 切れても だいじょうぶ: てっぺん・ハネノ・ホシフル村・ふりかえりの とちゅうで 切れても、見ていない ところから 続きが 見られる', { timeout: 300000 }, async () => {
  // 1) てっぺんの 場面の とちゅう（c5_solitus の あと）→ 祭だん
  {
    const { world, bot } = await setup(9401);
    const from = bot.msgs.length;
    const [ax, ay] = arriveCell();
    await place(bot, CASTLE_TOP_ID, ax, ay);
    await stepOn(bot, ax, ay - 1);
    await place(bot, CASTLE_TOP_ID, 12, T9.y + 1);
    // ふだんの きろく（歩いている 間は いちも セーブに のこる。だいほんの 間は のこらない）
    world.markDirty();
    world.saveNow();
    bot.x = 12.5; bot.y = T9.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: 'なぜ…ひとりに、ならぬ', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags.c5_solitus && !c.flags[END_A], 'ソリトゥスの あと・エンディングの はじめ');
    assert.equal(c.objective, TOP_OBJ.solitus);
    assert.equal(b2.s.map, CASTLE_TOP_ID, '星のない広間に もどる');
    const A = TOP_POS.altar;
    await place(b2, CASTLE_TOP_ID, A.x, A.y + 1);
    const f2 = b2.msgs.length;
    const fought = [];
    await examine(b2, A.x, A.y, { fought });
    assert.equal(fought.length, 0, 'もう 戦わない');
    assert.ok(said(b2, 'なぜ…ひとりに、ならぬ', f2) && said(b2, '5つの守り星', f2), 'てっぺんの 場面から');
    assert.ok(c.flags.c5_clear && c.objective === TOP_OBJ.clear);
  }
  // 2) ハネノの 場面の とちゅう（c5_end_a の あと）→ ハネノの 長ソラネ
  {
    const { world, bot } = await setup(9402);
    const from = bot.msgs.length;
    const [ax, ay] = arriveCell();
    await place(bot, CASTLE_TOP_ID, ax, ay);
    await stepOn(bot, ax, ay - 1);
    await place(bot, CASTLE_TOP_ID, 12, T9.y + 1);
    // ふだんの きろく（歩いている 間は いちも セーブに のこる。だいほんの 間は のこらない）
    world.markDirty();
    world.saveNow();
    bot.x = 12.5; bot.y = T9.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: 'ノクト兄ちゃーん', from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags[END_A] && !c.flags[END_B], 'クモイの 空まで 見た');
    assert.equal(c.objective, TOP_OBJ.endA);
    assert.equal(b2.s.map, CASTLE_TOP_ID, 'つなぎなおすと、さいごに 歩いていた 星のない広間に もどる');
    const P = HANONO_POS.sorane;
    await place(b2, 'hanono', P.x, P.y + 1);
    const f2 = b2.msgs.length;
    await talk(b2, 'sorane');
    assert.ok(!said(b2, 'なぜ…ひとりに、ならぬ', f2), 'てっぺんの 場面は もう 見た');
    assert.ok(said(b2, '帰る場所は、ここにある', f2) && said(b2, '5つの守り星', f2), 'ハネノの 場面から');
    assert.ok(c.flags.c5_clear);
  }
  // 3) ホシフル村の 場面の とちゅう（c5_end_b の あと）→ ホシミばあちゃん。4) ふりかえりの とちゅう → もう一度
  for (const [seed, cut] of [[9403, '5つの守り星が、夜空にならんで'], [9404, '第1部　完']]) {
    const { world, bot } = await setup(seed);
    const from = bot.msgs.length;
    const [ax, ay] = arriveCell();
    await place(bot, CASTLE_TOP_ID, ax, ay);
    await stepOn(bot, ax, ay - 1);
    await place(bot, CASTLE_TOP_ID, 12, T9.y + 1);
    // ふだんの きろく（歩いている 間は いちも セーブに のこる。だいほんの 間は のこらない）
    world.markDirty();
    world.saveNow();
    bot.x = 12.5; bot.y = T9.y + 0.5;
    bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
    assert.equal(await play(bot, { stopAt: cut, from }), 'cut');
    const b2 = await reconnect(world, bot);
    const c = world.data.characters[b2.char.id];
    assert.ok(c.flags[END_B] && !c.flags.c5_clear, `${cut}: ハネノまで 見た・クリアは まだ`);
    assert.equal(c.objective, TOP_OBJ.endB);
    assert.equal(b2.s.map, CASTLE_TOP_ID);
    // ふりかえりの とちゅうは 祭だんで（ホシフル村の 場面から）
    if (cut === '第1部　完') {
      const A = TOP_POS.altar;
      await place(b2, CASTLE_TOP_ID, A.x, A.y + 1);
      const fa = b2.msgs.length;
      await examine(b2, A.x, A.y);
      assert.ok(!said(b2, '帰る場所は、ここにある', fa) && said(b2, '第1部　完', fa) && c.flags.c5_clear, '祭だんで ホシフル村から');
      continue;
    }
    const E = MAPS.overworld.npcById.elder;
    await place(b2, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
    const f2 = b2.msgs.length;
    await talk(b2, 'elder');
    assert.ok(!said(b2, '帰る場所は、ここにある', f2) && said(b2, '5つの守り星', f2) && said(b2, '第1部　完', f2), `${cut}: ホシフル村の 場面から`);
    assert.ok(c.flags.c5_clear && c.objective === TOP_OBJ.clear);
    // クリアの あとは ふつうの ことば
    await place(b2, 'overworld', Math.floor(E.x), Math.floor(E.y) + 1);
    const f3 = b2.msgs.length;
    await talk(b2, 'elder');
    assert.ok(said(b2, 'ルミナの町の酒場', f3) && !said(b2, '第1部　完', f3));
  }
  // どこからでも 同じ 続き（ハネノの ばあちゃん・ソラネ・ホシフル村の ばあちゃん・祭だん）
  for (const stage of [[TOP.nocto2], [TOP.nocto2, TOP.solitus], [TOP.nocto2, TOP.solitus, END_A], [TOP.nocto2, TOP.solitus, END_A, END_B]]) {
    const x = ctx(flagsOf(...SEAL3(), ...UPTO(stage.at(-1) === END_A || stage.at(-1) === END_B ? 'c5_solitus' : stage.at(-1)), ...stage));
    const want = JSON.stringify(endingFrom(x));
    assert.ok(want.length > 20, stage.join(','));
    for (const id of ['c5_sorane', 'c5_gather_grandma', 'elder', 'c5_ct_altar']) {
      const got = JSON.stringify(SCRIPTS[id](x));
      assert.ok(got.includes(want.slice(1, -1)), `${stage.join(',')}: ${id}`);
    }
  }
});

// ───────────── 家族で ─────────────
test('家族で: さそわれた 家族も いっしょに 戦って、いっしょに エンディングを 見る（ものがたりは リーダーだけ すすむ・ごほうびは みんな）', { timeout: 200000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(9501), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ'), yui = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await yui.login('ほし');
  await papa.createAndPlay('warrior');
  await yui.createAndPlay('mage');
  await papa.settle();
  await yui.settle();
  const Pa = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const f of SEAL3()) Pa.char.flags[f] = true;
  Pa.char.keyItems.push('hoshifuru_stone');
  boost(Pa.char, 55);
  boost(Y.char, 55);
  world.sendSelf(Pa);
  papa.send({ t: 'party', action: 'invite', sid: Y.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  for (const b of [papa, yui]) b.s.repelUntil = 1e15;
  const yFlags = JSON.stringify(Y.char.flags);
  const yGold = Y.char.gold;
  const [ax, ay] = arriveCell();
  world.placeSession(Pa, CASTLE_TOP_ID, ax + 0.5, ay + 0.5, 'up', true);
  world.placeSession(Y, CASTLE_TOP_ID, ax - 0.5, ay + 0.5, 'up', true);
  await play(papa, { others: [yui] });
  await stepOn(papa, ax, ay - 1, { others: [yui] });
  assert.ok(Pa.char.flags.c5_top);
  world.placeSession(Pa, CASTLE_TOP_ID, 12.5, T9.y + 1.5, 'up', true);
  world.placeSession(Y, CASTLE_TOP_ID, 13.5, T9.y + 1.5, 'up', true);
  await play(papa, { others: [yui] });
  const fromY = yui.msgs.length;
  const fought = [];
  await stepOn(papa, 12, T9.y, { others: [yui], fought });
  assert.deepEqual(fought.filter((id) => FIXED_ENCOUNTERS[id]), ['nocto_2', 'solitus']);
  assert.ok(yui.battles.length >= 2, 'ユイも いっしょに 戦った');
  assert.ok(Pa.char.flags.c5_clear, 'リーダーの ものがたりは すすむ');
  assert.equal(JSON.stringify(Y.char.flags), yFlags, 'ユイの ものがたりは そのまま');
  assert.ok(Y.char.gold > yGold, 'ごほうびの ゴールドは みんな');
  assert.ok(yui.msgs.slice(fromY).some((m) => m.t === 'script' && m.spectator && JSON.stringify(m.steps).includes('第1部　完')), 'ユイも エンディングを 見た');
  assert.equal(Y.map, 'overworld', 'ユイも ホシフル村へ');
});

// ───────────── クリアの あと ─────────────
test('クリアの あと: ノクトが 酒場で 仲間に・町の 人の ことば（ホシフル村・クモイ地方・ハネノ・星読みの里）・集まった 人は 帰る・ピピが 飛ぶ・夕ぐれが 晴れる', { timeout: 60000 }, async () => {
  // 酒場の ノクト（B9 の NOCTO_COMPANION に unlock c5_clear）
  assert.ok(NPC_SUPPORTS.some((n) => n.id === NOCTO_COMPANION.id && n.unlock === 'c5_clear'), '酒場に ならぶ しるし');
  assert.equal(NOCTO_SUPPORT.name, 'ノクト');
  const { world, bot, c } = await setup(9601, 'c5_solitus', { extra: [END_A, END_B] });
  assert.ok(!tavernInfo(world, bot.s).recruits.some((r) => r.key === NOCTO_COMPANION.id), 'クリアの 前は まだ');
  assert.ok(!recruitNpc(world, bot.s, NOCTO_COMPANION.id).ok);
  c.flags.c5_clear = true;
  assert.ok(tavernInfo(world, bot.s).recruits.some((r) => r.key === NOCTO_COMPANION.id), '酒場に ならぶ');
  const r = recruitNpc(world, bot.s, NOCTO_COMPANION.id);
  assert.ok(r.ok && r.name === 'ノクト');
  // 町の 人の ことば（クリアの 前と ちがう）
  const before = ctx(flagsOf(...SEAL3()));
  const after = ctx(flagsOf(...SEAL3(), ...UPTO('c5_clear'), END_A, END_B));
  for (const id of Object.keys(TOP_TOWN_LINES)) {
    if (id === 'c5_gather_grandma') continue;
    const a = JSON.stringify(SCRIPTS[id](after)), b = JSON.stringify(SCRIPTS[id](before));
    assert.notEqual(a, b, `${id}: クリアの あとは ことばが かわる`);
  }
  for (const [id, w] of [['c5_pipi', '飛べるようになった'], ['c5_h_old', '風がもどってきた'], ['c5_k_guard', 'しずみが、すっかり止まりました'], ['c5_kanata', 'ひとりは選ぶ'],
    ['star_stone', '5つの守り星'], ['luca_after', '3人で丘'], ['elder', 'ルミナの町の酒場'], ['c5_y_deshi', 'まだ名前のない星'], ['c5_h_wind', '知らない風']]) {
    assert.ok(JSON.stringify(SCRIPTS[id](after)).includes(w), `${id}: ${w}`);
  }
  // 「まだ 続く」の ヒントは ネタバレなし
  for (const id of Object.keys(TOP_TOWN_LINES)) assert.ok(!/第2部|ソリトゥス/.test(JSON.stringify(SCRIPTS[id](after))), id);
  // ハネノ: 集まった 人は 帰る・ピピは 見晴らし台で 飛んでいる
  const hn = MAPS.hanono;
  const has = (fl) => (f) => !!fl[f];
  const cl = flagsOf(...SEAL3(), ...UPTO('c5_clear'));
  const mid = flagsOf(...SEAL3(), ...UPTO('c5_solitus'));
  for (const k of GATHER) {
    const n = hn.npcById[`g_${k}`];
    assert.ok(condOk(n.show, has(mid)) && !condOk(n.show, has(cl)), `${k}: クリアの あとは 帰る`);
  }
  assert.ok(condOk(hn.npcById.pipi_home.show, has(mid)) && !condOk(hn.npcById.pipi_home.show, has(cl)));
  const sky = hn.npcById.pipi_sky;
  assert.ok(sky && sky.sprite === 'pipi_fly' && condOk(sky.show, has(cl)) && !condOk(sky.show, has(mid)), '飛んでいる ピピ');
  // ホシフル村: 3回目の 星祭りの かざり
  for (const [id] of FEST_DECO) {
    const n = MAPS.overworld.npcById[`${id}_end`];
    assert.ok(n && condOk(n.show, has(cl)) && !condOk(n.show, has(mid)), id);
  }
  // クモイ地方と ハネノの 夕ぐれが 晴れる・曲が もとに
  const castle = flagsOf(...SEAL3());
  for (const id of ['kumoi', 'hanono']) assert.equal(MAPS[id].dusk.until, 'c5_solitus', id);
  assert.equal(MAPS.kumoi.bgmAt(10, 10, false, has(castle)), 'kumoi_dusk');
  assert.equal(MAPS.kumoi.bgmAt(10, 10, false, has(mid)), 'kumoi');
  // クリアの あとの てっぺん: ノクトは いない・祭だんの ことば
  assert.ok(!condOk(MAPS[CASTLE_TOP_ID].npcById.nocto_top.show, has(cl)));
  assert.ok(JSON.stringify(SCRIPTS.c5_ct_altar(ctx(cl))).includes('星のない空は、もうどこにもない'));
  assert.deepEqual(endingFrom(ctx(cl)), []);
});

// ───────────── 文字・絵・音 ─────────────
test('文字: Step 9 の ファイルは 文字の ルールの チェックに 入っていて、使えない 漢字・スペースが ない。主人公の 年を 言わない', () => {
  const files = gameFiles().map((f) => f.split('/family-rpg/').pop());
  const mine = ['public/js/shared/data/story-castle-top.js', 'public/js/shared/maps/castle-top.js', 'public/js/shared/data/castle-top-stub.js'];
  for (const f of mine) assert.ok(files.includes(f), f);
  for (const f of gameFiles().filter((g) => mine.some((x) => g.endsWith(x)))) assert.deepEqual(checkFile(f), [], f);
  const all = SCRIPTS.c5_ct_nocto(ctx(flagsOf(...SEAL3(), 'c5_top')));
  for (const st of all) if (st[0] === 'say') assert.ok(!/\d+さい|\d+つの年|\d+年/.test(st[2]), st[2]);
});

test('絵と 音: 広間の タイル（2D は 16×16 を ぬる・2.5D）・広間の 色・エンディングの ノクトと 飛ぶ ピピ・3きょく', async () => {
  const { paintTile, hasTileArt, isAnimated } = await import('../public/js/client/render/tiles.js');
  const { TOP_TILES, TOP_PROPS, TOP_KEEP_COLOR } = await import('../public/js/client/render/tiles-top.js');
  const { partOfTile, themeRgb } = await import('../public/js/client/render/themes.js');
  const { PROP_TILES } = await import('../public/js/client/render/tex3d.js');
  const { paintHuman, npcOpts } = await import('../public/js/client/render/chars.js');
  const { TOP_NPC_LOOKS } = await import('../public/js/client/render/ch5-top-art.js');
  const { _TRACKS, _parse } = await import('../public/js/client/audio.js');
  const HEX = /^#[0-9a-f]{6}$/i;
  assert.deepEqual([...TOP_TILES].sort((a, b) => a - b), [189, 229], 'A9 は 189・229 だけ');
  assert.equal(new Set(Object.values(T)).size, Object.values(T).length, 'タイルの ID が かさならない');
  const names = Object.values(TILE_INFO).map((t) => t.name);
  assert.equal(new Set(names).size, names.length, 'タイルの 名前が かさならない（ほかの タイルを うわがきしない）');
  assert.equal(TILE_INFO[215].name, 'top_floor', '星の塔の てっぺんの ゆかは そのまま');
  for (const id of TOP_TILES) {
    assert.ok(hasTileArt(id) && TILE_INFO[id], `${id}`);
    for (const f of [0, 1, 2]) {
      const p = paintTile(id, 0x21, f, 0);
      assert.equal(p.px.filter((cc) => !cc).length, 0, `${TILE_INFO[id].name} f${f}: ぬられていない ドット`);
      assert.ok(p.px.every((cc) => HEX.test(cc)), TILE_INFO[id].name);
    }
  }
  for (const id of TOP_KEEP_COLOR) assert.equal(partOfTile(id), 'none');
  assert.ok(isAnimated(T.STARLESS_ALTAR));
  assert.notEqual(paintTile(T.STARLESS_ALTAR, 0, 0, 0).px.join(), paintTile(T.STARLESS_ALTAR, 0, 1, 0).px.join(), '祭だんの もやが ゆれる');
  assert.ok(TOP_PROPS[T.STARLESS_ALTAR] && PROP_TILES.has(T.STARLESS_ALTAR), '2.5D の 祭だん');
  // マップの タイルは ぜんぶ 絵が ある
  const m = MAPS[CASTLE_TOP_ID];
  const tiles = new Set(m.tiles);
  for (const g of m.gates) { tiles.add(g.open); tiles.add(g.closed); }
  for (const t of tiles) assert.ok(hasTileArt(t), TILE_INFO[t]?.name ?? t);
  // 広間の 色（くらい むらさき）
  const fl = themeRgb(0x80, 0x80, 0x80, 'ctop', 'wall');
  assert.ok(fl[2] >= fl[1] && fl[0] < 120, `くらい むらさき ${fl}`);
  // 人の え
  for (const k of ['nocto_star', 'pipi_fly']) assert.ok(TOP_NPC_LOOKS[k] && npcOpts(k), k);
  assert.notEqual(TOP_NPC_LOOKS.pipi_fly.wingSize, 'small', 'ピピの 羽が 開く');
  assert.ok(!TOP_NPC_LOOKS.nocto_star.hat, 'フードを はずした ノクト');
  for (const [a, b] of [['nocto_star', 'nocto'], ['pipi_fly', 'pipi']]) {
    for (const dir of ['down', 'up', 'left']) {
      const p = paintHuman(dir, 0, npcOpts(a));
      assert.ok(p.px.some(Boolean), `${a} ${dir}`);
      assert.notEqual(p.px.join(), paintHuman(dir, 0, npcOpts(b)).px.join(), `${a} と ${b} は ちがう え（${dir}）`);
    }
  }
  // 曲
  for (const id of ['nocto_true', 'solitus', 'ending5']) {
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
  assert.ok(_TRACKS.nocto_true.bpm > _TRACKS.ending5.bpm);
  void KUMOI_POS;
});
