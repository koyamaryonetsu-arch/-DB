// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 通し（第104回: A班〈世界と 物語〉と B班〈戦いと 品〉・F班〈曲〉を つないだ あと）※ ネタバレ注意
// ・第3幕を クリアした セーブ（c11_act3）から c11_act4（第3部の クリア）まで、決まった 戦い（鏡と月の使い・かがやきの女王）を 本当に 戦う（「すぐ 勝たせる」に しない）
//   （tools/sim-ch11.mjs の 装備 CH9_KIT.duo・queen）
// ・人が 動かす キャラ（この テストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。何を 送るかは 知って いる 人の えらび方（decideAlly）
//   「手をつなぐ」「八つの音」も 画面の コマンドと 同じ 形。家族の 仲間は tools/sim-ch9.mjs の 知って いる 手
// ・幕は 開いた（PART3_C11D_OPEN = true）。本体の 台本の まま（まぜなおさない）
// ・塔は 画面と 同じ: 1階 星の 上で 向き（線の マスを しらべる）・2階 戸の 上で しらべる・3階 台の 上で しらべる・4階 台を ふむ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { C11D, C11D_ACT0, C11D_MAP, C11D_BATTLE, C11D_CHEST_IDS, C11D_MAP_IDS, C11D_SONG_ORDER, C11D_CMD_HOLD, C11D_CMD_EIGHT } from '../public/js/shared/maps/c11d-flags.js';
import { TOWER1_POS11D, TOWER2_POS11D, TOWER2_SECTIONS11D, TOWER3_POS11D, TOWER4_POS11D, THRONE_POS11D, SCALE_POS11D, CITY_POS11D, HILL_POS11D, SCENES11D } from '../public/js/shared/maps/c11d-rows.js';
import { C11C_OBJ } from '../public/js/shared/data/story-c11c.js';
import { C11D_OBJ, C11D_EIGHT_SCENE, C11D_END_TITLE } from '../public/js/shared/data/story-c11d.js';
import { solve11a } from '../public/js/shared/data/constellations-c11a.js';
import { solve11b } from '../public/js/shared/world/c11b-steps.js';
import { solve11c, algolPed11c } from '../public/js/shared/world/c11c-steps.js';
import { PART3_C11D_OPEN, act3ClearObjective, CH11_PROGRESS, CH11_OBJECTIVE_TARGETS } from '../public/js/shared/data/story-c11.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { retrySpot } from '../public/js/shared/world/boss-hints.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { C11D_FRONT_ADD } from '../public/js/shared/data/items-c11d.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ch9Party, MODES9 } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch11.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, D4, addPlayer } from './c9a-play.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { SKY_FLAG } from '../public/js/shared/data/sky.js';

const NOTES7 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si', 'note_do'];
const tile = (s) => [Math.floor(s.x), Math.floor(s.y)];
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const HOLD = 'm11_tewotsunagu', EIGHT = 'm11_yatsunone';
const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
function gear(chars, boss, lv) {
  const kit = ch9Party(boss, lv);
  chars.forEach((c, i) => { for (const k of COPY) c[k] = structuredClone(kit[i % kit.length][k]); });
}
async function famIds(world, names) {
  const ids = [];
  for (const name of names) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
    ids.push(b.char.id);
    b.send({ t: 'quit' });
  }
  return ids;
}

// ───── 本当の 戦い（人の ボットは 画面と 同じ 形の コマンド）─────
function driveReal(ctx2, mode, humans, sent) {
  const b = ctx2.battle;
  if (b.over || b.pendingEnd || mode === 'auto') return;
  b.knowsCh9 = 'know';
  for (const a of b.allies) {
    if (a.kind === 'guest' || !a.alive) continue;
    const h = humans.find((x) => x.s.id === a.controller);
    if (h) {
      if (a.auto) h.send({ t: 'battle', actor: a.id, auto: false });
      if (!a.ready || b.queue.some((q) => q.id === a.id)) continue;
      let cmd = decideAlly(b, a) || { type: 'attack', target: b.aliveEnemies()[0]?.id };
      if (cmd.type === 'ai') cmd = { type: 'attack', target: b.aliveEnemies()[0]?.id };
      const n0 = h.msgs.length;
      h.send({ t: 'battle', actor: a.id, cmd });
      const rej = h.msgs.slice(n0).some((m) => m.t === 'battleRej');
      if (rej) h.send({ t: 'battle', actor: a.id, cmd: { type: 'defend' } });
      else { const k = cmd.type === 'ability' ? cmd.id : cmd.type; sent.set(k, (sent.get(k) || 0) + 1); }
      continue;
    }
    if (a.controller && a.controller !== 'sim') continue;
    a.auto = false;
    a.controller = 'sim';
    if (!a.ready) continue;
    if (!MODES9.know.act(b, a)) { a.ready = false; b.enqueue(a, { type: 'ai' }); }
  }
}
async function playReal(bot, { real = () => 'auto', bots = [], fought = null, sent = new Map(), onBattle = null, max = 80000 } = {}) {
  const world = bot.world;
  for (let i = 0; i < max; i++) {
    const all = [bot, ...bots];
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd) continue;
      if (!c2.done) { c2.done = true; if (fought) fought.push(c2.opts.fixed || 'field'); onBattle?.(c2); }
      driveReal(c2, c2.opts.fixed ? real(c2.opts.fixed) : 'auto', all, sent);
    }
    for (const b of all) b.flushQueue();
    await tickN(world, 1);
    for (const b of all) b.flushQueue();
    const idle = (b) => !b.s.busy && !b.queue.length && !b.inBattle;
    if (all.every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const b of all) b.flushQueue();
      if (all.every(idle) && !world.battles.size) return true;
    }
  }
  return false;
}
const R = (opts) => ({ ...opts, real: (fid) => (fid ? opts.realMode?.(fid) || 'know' : 'auto') });
async function walk(bot, x, y, opts) {
  bot.x = x + 0.5; bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await playReal(bot, R(opts));
}
async function look(bot, x, y, opts) {
  bot.send({ t: 'interact', kind: 'tile', x, y });
  await playReal(bot, R(opts));
}
async function warpTo(bot, map, x, y, opts, dir = 'up') {
  bot.world.placeSession(bot.s, map, x + 0.5, y + 0.5, dir, true);
  await playReal(bot, R(opts));
}
function pathFor(map, sx, sy, tx, ty, has) {
  const prev = new Map([[sy * map.w + sx, null]]);
  const q = [[sx, sy]];
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    if (x === tx && y === ty) {
      const out = [];
      for (let k = y * map.w + x; k !== sy * map.w + sx; k = prev.get(k)) out.unshift([k % map.w, Math.floor(k / map.w)]);
      return out;
    }
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * map.w + nx;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || prev.has(k)) continue;
      if (isBlocked(map, nx, ny, has) || map.chestAt.has(k)) continue;
      if (map.npcs.some((n) => n.solid && Math.floor(n.x) === nx && Math.floor(n.y) === ny && condOk(n.show, has))) continue;
      if (!(nx === tx && ny === ty) && map.warpAt.has(k)) continue;
      prev.set(k, y * map.w + x);
      q.push([nx, ny]);
    }
  }
  return null;
}
async function go(bot, tx, ty, opts) {
  const map = MAPS[bot.s.map];
  const path = pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), tx, ty, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${map.id}: ${tx},${ty} まで 歩ける`);
  for (const [x, y] of path) {
    await walk(bot, x, y, opts);
    if (bot.s.map !== map.id) return;
  }
}
async function talkNpc(bot, mapId, id, opts) {
  const n = MAPS[mapId].npcById[id];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [Math.floor(n.x) + dx, Math.floor(n.y) + dy]).find(([x, y]) => canStand(MAPS[mapId], x + 0.5, y + 0.5, has));
  await warpTo(bot, mapId, side[0], side[1], opts);
  bot.send({ t: 'interact', kind: 'npc', id });
  await playReal(bot, R(opts));
}
// 魔物を 1ぴき その 人に ぶつけて 本当に 戦う（オート）
async function fieldFight(bot, opts) {
  const world = bot.world;
  const ms = mapState(world, bot.s.map);
  for (let i = 0; i < 120 && !ms.symbols.size; i++) { bot.s.repelUntil = 0; await tickN(world, 5); }
  const sym = [...ms.symbols.values()][0];
  assert.ok(sym, `${bot.s.map}: 魔物が 出る`);
  bot.s.repelUntil = 0;
  sym.x = bot.s.x; sym.y = bot.s.y;
  fullHeal(bot.s.char);
  for (const f of bot.fam || []) fullHeal(f);
  startFieldBattle(world, bot.s, sym);
  await playReal(bot, R(opts));
  bot.s.repelUntil = 1e15;
  return sym.table;
}
const healAll = (bots) => { for (const b of bots) { fullHeal(b.s.char); for (const f of b.fam || []) fullHeal(f); } };

async function player(world, name, famNames = []) {
  const ids = famNames.length ? await famIds(world, famNames) : [];
  const { bot, c } = await addPlayer(world, name, C11D_ACT0, [SKY_FLAG]);
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES7, 'star_chart', 'star_ship', 'name_lamp'])];
  c.objective = act3ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'duo', 125);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  bot.fam = fam;
  return { bot, c, fam };
}

// ───── かがやきの 塔（画面と 同じ 動き）─────
const DOOR = { x: 9, y: 5 }; // 大とびらの 前（c11c_door。ここから 2歩で 中へ）
async function enterPalace(bot, o) {
  await warpTo(bot, 'c11c_door', DOOR.x, DOOR.y + 1, o);
  await walk(bot, DOOR.x, DOOR.y, o);
  await walk(bot, DOOR.x, DOOR.y - 1, o);
  if (bot.s.map === 'c11c_door') await walk(bot, DOOR.x, DOOR.y - 2, o);
}
async function tower1(bot, o) {
  await go(bot, SCALE_POS11D.up.x, SCALE_POS11D.up.y, o);
  assert.equal(bot.s.map, C11D_MAP.tower1);
  await walk(bot, TOWER1_POS11D.arrive.x, TOWER1_POS11D.arrive.y - 1, o);
  const con = MAPS[C11D_MAP.tower1].c11aCons[0];
  const sol = solve11a(con, con.entries);
  const [x, y] = con.stars[sol.start];
  const has = bot.world.hasFlagFn(bot.s);
  const g = Object.values(DIRV).map(([dx, dy]) => [x + dx, y + dy]).find(([gx, gy]) => !con.stars.some(([a, b]) => a === gx && b === gy) && !isBlocked(MAPS[C11D_MAP.tower1], gx, gy, has));
  await go(bot, g[0], g[1], o);
  await walk(bot, x, y, o);
  for (const m of sol.path) { const [dx, dy] = DIRV[m.dir]; await look(bot, Math.floor(bot.s.x) + dx, Math.floor(bot.s.y) + dy, o); }
  await go(bot, TOWER1_POS11D.up.x, TOWER1_POS11D.up.y, o);
  assert.equal(bot.s.map, C11D_MAP.tower2);
}
async function tower2(bot, o) {
  await walk(bot, TOWER2_POS11D.arrive.x, TOWER2_POS11D.arrive.y - 1, o);
  const S = TOWER2_SECTIONS11D[0];
  const path = solve11b(S, { side: MAPS[bot.s.map].c11b.side, ...Object.fromEntries([['x', Math.floor(bot.s.x)], ['y', Math.floor(bot.s.y)]]) }, bot.world.hasFlagFn(bot.s));
  assert.ok(path, '2階 とける');
  for (const step of path) {
    const [, x, y] = step.st;
    if (step.act?.kind === 'door') await look(bot, x, y - 1, o);
    else await walk(bot, x, y, o);
  }
  assert.equal(bot.s.map, C11D_MAP.tower3);
}
async function tower3(bot, o) {
  await walk(bot, TOWER3_POS11D.arrive.x, TOWER3_POS11D.arrive.y - 1, o);
  const map = MAPS[C11D_MAP.tower3];
  const path = solve11c(map, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, algolPed11c(bot.world, bot.s));
  for (const step of path) {
    const [x, y] = step.st;
    if (step.act) { bot.choice = 0; await look(bot, x, y - 1, o); } else await walk(bot, x, y, o);
    if (bot.s.map !== map.id) break;
  }
  assert.equal(bot.s.map, C11D_MAP.tower4);
}
async function tower4(bot, o) {
  await walk(bot, TOWER4_POS11D.arrive.x, TOWER4_POS11D.arrive.y - 1, o);
  for (const i of C11D_SONG_ORDER) {
    const P = TOWER4_POS11D.pads[i];
    await go(bot, P.x, P.y + 1, o);
    await walk(bot, P.x, P.y, o);
    await walk(bot, P.x, P.y + 1, o);
  }
  assert.ok(bot.world.hasFlagFn(bot.s)(C11D.t4), '7つの 音');
}
// 中ボス・女王の マスへ（4階の 音の とびらの 下 → 上 ／ 玉座の 間の 入口 → 上）
const duoGo = (bot) => async (o) => {
  await warpTo(bot, C11D_MAP.tower4, 11, 9, o);
  await go(bot, 11, SCENES11D.duo.y + 1, o);
};
const queenGo = (bot) => async (o) => {
  await warpTo(bot, C11D_MAP.throne, THRONE_POS11D.arrive.x, THRONE_POS11D.arrive.y, o);
  await go(bot, 11, SCENES11D.queen.y + 1, o);
};
// ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ノクトの ヒント → もう一度）
async function bossUntilWin(bot, which, first, again, { mode0 = 'know', max = 8, fought, bots = [], sent, seen = null } = {}) {
  const res = [];
  const battle = C11D_BATTLE[which];
  const win = which === 'duo' ? C11D.duo : C11D.queen;
  gear([bot.s.char, ...(bot.fam || [])], which, which === 'duo' ? 125 : 126);
  for (const b of bots) gear([b.s.char], which, which === 'duo' ? 125 : 126);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    healAll([bot, ...bots]);
    const v0 = bot.msgs.length;
    const o = { fought, bots, sent, realMode: (fid) => (fid === battle ? mode : 'know'), onBattle: seen };
    await (k === 0 ? first(o) : again(o));
    assert.ok(fought.filter((f) => f === battle).length >= k + 1, `${battle} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.world.hasFlagFn(bot.s)(win);
    res.push(won ? 'win' : 'lose');
    if (!won && k === 0) {
      await tickN(bot.world, 40);
      await playReal(bot, R({ fought, bots, sent }));
      assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0), 'ノクトの ヒント');
      // やり直しの 場所（中ボス … 4階の 音の 間・女王 … 玉座の 間の 入口）
      const r = retrySpot(battle, which === 'duo' ? C11D_MAP.tower4 : C11D_MAP.throne, bot.world.hasFlagFn(bot.s));
      assert.ok(r && r.map === (which === 'duo' ? C11D_MAP.tower4 : C11D_MAP.throne), `やり直しの 場所 ${JSON.stringify(r)}`);
    }
    if (won) return res;
  }
  return res;
}

test('幕が 開いた: もう 第3幕を クリアした 人の セーブ（古い 目標の 文）は ログインで「王宮の大とびらの中へ。…」に なおり、大とびらの 中で 始まる・前の 人は かわらない', async () => {
  assert.equal(PART3_C11D_OPEN, true);
  assert.equal(act3ClearObjective(), C11D_OBJ.start);
  assert.equal(C11C_OBJ.act3, '第3部　第3章　第4幕へ（続きはアップデートで！）');
  assert.ok(!CH11_PROGRESS.some(([, t]) => t === C11C_OBJ.act3) && !(C11C_OBJ.act3 in CH11_OBJECTIVE_TARGETS), '前の 文は 表から ぬけた');
  const world = fixedWorld(11441);
  const done = await addPlayer(world, 'ソラ', C11D_ACT0, [SKY_FLAG]);
  done.c.objective = C11C_OBJ.act3; // 幕を 開ける 前に 第3幕を クリアした 人の セーブ
  const mid = await addPlayer(world, 'ミナ', 'c11c_ace', [SKY_FLAG]);
  const keep = [[mid, C11C_OBJ.door]];
  const w2 = new GameWorld({ offline: true, rng: makeRng(11442), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const enter = async (P) => {
    const b = new Bot(w2, P.c.name);
    await b.login();
    b.send({ t: 'play', id: P.c.id });
    await b.settle();
    return { bot: b, c: w2.data.characters[P.c.id] };
  };
  const A = await enter(done);
  assert.equal(A.c.objective, C11D_OBJ.start, '古い 文は なおる');
  for (const [P, want] of keep) { const B = await enter(P); assert.equal(B.c.objective, want, `${P.c.name} は かわらない`); }
  assert.equal(storyPlace(A.c).label, '第3部 第3章 第3幕', '始まる 前は 第3幕 の まま');
  A.bot.s.repelUntil = 1e15;
  await enterPalace(A.bot, { fought: [], sent: new Map() });
  assert.ok(A.c.flags[C11D.start] && said(A.bot, '第4幕　かがやきの女王と、八つめの音'));
  assert.equal(A.bot.s.map, C11D_MAP.scale);
  assert.equal(storyPlace(A.c).label, '第3部 第3章 第4幕');
  assert.equal(A.c.objective, C11D_OBJ.tower1);
});

test('通し（家族の 仲間 3人）: 第3幕の クリアから → 大とびら → 塔 1〜4階（魔物）→ 中ボス（はじめ 完全オートで 負け → ヒント → 勝ち）→ 女王（手をつなぐ・八つめの 音の 場面・八つの音）→ エンディング → c11_act4 → クリアの あと', async () => {
  const world = fixedWorld(11401);
  const { bot, c } = await player(world, 'ソラ', ['ミナ', 'リン', 'ガル']);
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  await enterPalace(bot, opts);
  assert.equal(bot.s.map, C11D_MAP.scale);
  // 塔 1階で 魔物と 1回（本当に）
  await go(bot, SCALE_POS11D.up.x, SCALE_POS11D.up.y, opts);
  await warpTo(bot, C11D_MAP.tower1, 4, 9, opts);
  assert.equal(await fieldFight(bot, opts), 't11d_tower1');
  await warpTo(bot, C11D_MAP.scale, SCALE_POS11D.back.x, SCALE_POS11D.back.y + 1, opts);
  await tower1(bot, opts);
  assert.ok(c.flags[C11D.t1] && said(bot, 'ほしのてんびん'));
  await tower2(bot, opts);
  await tower3(bot, opts);
  assert.ok(c.flags[C11D.t2], "2階を 通った");
  await tower4(bot, opts);
  assert.ok(c.flags[C11D.t3] && c.flags[C11D.t4]);
  assert.equal(c.objective, C11D_OBJ.duo);
  const resD = await bossUntilWin(bot, 'duo', duoGo(bot), duoGo(bot), { mode0: 'auto', fought, sent, max: 10 });
  assert.equal(resD[0], 'lose', '中ボスは 完全オートでは 勝てない');
  assert.equal(resD.at(-1), 'win', `中ボス ${resD}`);
  assert.equal(c.objective, C11D_OBJ.throne);
  // 女王（知って いる 動き。八つめの 音の 場面は 戦いの 中）
  let scene = 0, q = 0;
  const seen = (c2) => { if (c2.opts.fixed === C11D_BATTLE.queen) q++; };
  const watch = (c2) => { seen(c2); };
  const resQ = await bossUntilWin(bot, 'queen', queenGo(bot), queenGo(bot), { fought, sent, max: 10, seen: watch });
  assert.equal(resQ.at(-1), 'win', `女王 ${resQ}`);
  scene = bot.msgs.filter((m) => JSON.stringify(m).includes('……おまえ、なのか')).length;
  assert.ok(scene > 0, '戦いの 中で 八つめの 音の 場面が 出た（A班の 台本の 文）');
  assert.ok((sent.get(HOLD) || 0) >= 1, `「手をつなぐ」を 画面と 同じ 形で 送った（${sent.get(HOLD)}）`);
  assert.ok((sent.get(EIGHT) || 0) >= 1, `「八つの音」を 画面と 同じ 形で 送った（${sent.get(EIGHT)}）`);
  for (const f of [C11D.queen, C11D.lamp, C11D.bridge, C11D.act4]) assert.ok(c.flags[f], f);
  for (const w of ['……おかえりなさい。', '名前のランプを、ともす日', '千年後の空も、きっと、にぎやかね。', '橋の、番人に、なる', C11D_END_TITLE]) assert.ok(said(bot, w), w);
  assert.ok(c.keyItems.includes('note_eight'), '八つめの 音（だいじな 物）');
  assert.equal(c.objective, C11D_OBJ.act4);
  assert.equal(bot.s.map, 'overworld');
  assert.ok(storyPlace(c).partClear);
  // クリアの あと: 星の橋で 月の都へ → 店に 4つ → 星の橋の はし → 星見の丘
  await warpTo(bot, 'overworld', HILL_POS11D.bridge.x - 1, HILL_POS11D.bridge.y, opts);
  await walk(bot, HILL_POS11D.bridge.x, HILL_POS11D.bridge.y, opts);
  assert.equal(bot.s.map, 'c11b_front');
  assert.ok(C11D_FRONT_ADD.every((i) => shopItems(SHOPS.c11b_arms, (f) => !!c.flags[f]).includes(i)));
  await walk(bot, CITY_POS11D.bridgeEnd.x, CITY_POS11D.bridgeEnd.y, opts);
  assert.equal(bot.s.map, 'overworld');
  for (const id of C11D_CHEST_IDS) assert.ok(C11D_MAP_IDS.some((m) => MAPS[m].chests.some((x) => x.id === id && x.item)), id);
  console.log(`  中ボス ${resD.join('→')}・女王 ${resQ.join('→')}（${q}回）・手をつなぐ ${sent.get(HOLD)}回・八つの音 ${sent.get(EIGHT)}回・戦い ${fought.length}回`);
});

test('ひとり（仲間なし）: 中ボス・女王とも 勝つまで（知って いる 動き。手をつなぐ … スピカ・アルゴル）', async () => {
  const world = fixedWorld(11402);
  const { bot, c } = await player(world, 'ソラ');
  bot.s.repelUntil = 1e15;
  const fought = [], sent = new Map();
  for (const f of [C11D.start, C11D.t1, C11D.t2, C11D.t3, C11D.t4]) c.flags[f] = true;
  const resD = await bossUntilWin(bot, 'duo', duoGo(bot), duoGo(bot), { fought, sent, max: 12 });
  assert.equal(resD.at(-1), 'win', `中ボス ${resD}`);
  const resQ = await bossUntilWin(bot, 'queen', queenGo(bot), queenGo(bot), { fought, sent, max: 12 });
  assert.equal(resQ.at(-1), 'win', `女王 ${resQ}`);
  assert.ok((sent.get(HOLD) || 0) >= 1);
  assert.ok(c.flags[C11D.act4]);
  console.log(`  ひとり: 中ボス ${resD.join('→')}・女王 ${resQ.join('→')}・手をつなぐ ${sent.get(HOLD)}回・八つの音 ${sent.get(EIGHT) || 0}回`);
});

test('家族 2人（＋仲間 2人）: 音の 間を 2人で 分けて ふむ → 2人で 女王（2人とも 画面の 形で 手を つなぐ）→ 2人とも エンディングを 見る', async () => {
  const world = fixedWorld(11403);
  const A = await player(world, 'ソラ', ['リン', 'ガル']);
  const B = await player(world, 'ミナ');
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  B.bot.s.follow = false;
  const fought = [], sent = new Map();
  const oA = { fought, sent, bots: [B.bot] }, oB = { fought, sent, bots: [A.bot] };
  await playReal(A.bot, oA);
  for (const f of [C11D.start, C11D.t1, C11D.t2, C11D.t3]) A.c.flags[f] = true;
  await warpTo(A.bot, C11D_MAP.tower4, 4, 12, oA);
  await warpTo(B.bot, C11D_MAP.tower4, 18, 12, oB);
  for (const [n, i] of C11D_SONG_ORDER.entries()) {
    const [bot, o] = n % 2 ? [B.bot, oB] : [A.bot, oA];
    const P = TOWER4_POS11D.pads[i];
    await go(bot, P.x, P.y + 1, o);
    await walk(bot, P.x, P.y, o);
    await walk(bot, P.x, P.y + 1, o);
  }
  assert.ok(A.c.flags[C11D.t4], '2人で 分けて ふんだ');
  A.c.flags[C11D.duo] = true;
  const humans = new Set();
  const goQ = async (o) => {
    await warpTo(B.bot, C11D_MAP.throne, THRONE_POS11D.arrive.x - 1, THRONE_POS11D.arrive.y, oB);
    await queenGo(A.bot)(o);
  };
  const resQ = await bossUntilWin(A.bot, 'queen', goQ, goQ, { fought, sent, bots: [B.bot], max: 10, seen: (c2) => { for (const a of c2.battle.allies) if (a.controller === A.bot.s.id || a.controller === B.bot.s.id) humans.add(a.controller); } });
  assert.equal(resQ.at(-1), 'win', `女王 ${resQ}`);
  assert.equal(humans.size, 2, '2人とも 女王戦に いる');
  assert.ok((sent.get(HOLD) || 0) >= 2);
  assert.ok(A.c.flags[C11D.act4]);
  assert.ok(said(B.bot, C11D_END_TITLE), 'なかまも 第3部 完 を 見た');
  console.log(`  2人: 女王 ${resQ.join('→')}・手をつなぐ ${sent.get(HOLD)}回・八つの音 ${sent.get(EIGHT) || 0}回`);
});
