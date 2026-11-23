// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 通し（第103回: A班〈世界と 物語〉と B班〈戦いと 品〉・F班〈曲〉を つないだ あと）※ ネタバレ注意
// ・第2幕を クリアした セーブ（c11_act2）から c11_act3 まで、決まった 戦い（バラバラン3号・近衛の隊長エース）を 本当に 戦う（「すぐ 勝たせる」に しない）
//   （tools/sim-ch11.mjs の 装備 CH9_KIT.mecha・ace）
// ・人が 動かす キャラ（この テストの ボット）は **画面と 同じ 形の コマンド**（{ t: 'battle', actor, cmd }）を 送る。
//   「アルゴルにたのむ」は { type: 'ability', id: 'm11_tanomu', choice: カードの 番号 }（画面の コマンドと 同じ）。何を 送るかは 知って いる 人の えらび方（decideAlly）
//   家族の 仲間は tools/sim-ch9.mjs の 知って いる 手
// ・幕は 開いた（PART3_C11C_OPEN = true）。本体の 台本の まま（まぜなおさない）
// ・はかりの 回ろうは 画面と 同じ: 歩く・台の 上で しらべる・台の ない 所で しらべて「よびもどす」（道さがし solve11c の とおり）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/story.js';
import { MAPS, canStand, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { C11C, C11C_ACT0, C11C_MAP, C11C_BATTLE, C11C_CHEST_IDS, C11C_MAP_IDS } from '../public/js/shared/maps/c11c-flags.js';
import { HALL_POS11C, CITY_POS11C, DOOR_POS11C, REST_POS11C } from '../public/js/shared/maps/c11c-rows.js';
import { solve11c, algolPed11c } from '../public/js/shared/world/c11c-steps.js';
import { PART3_C11C_OPEN, act2ClearObjective, CH11_PROGRESS, CH11_OBJECTIVE_TARGETS } from '../public/js/shared/data/story-c11.js';
import { C11B_OBJ } from '../public/js/shared/data/story-c11b.js';
import { C11C_OBJ } from '../public/js/shared/data/story-c11c.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { C11C_BACK_ADD } from '../public/js/shared/data/items-c11c.js';
import { TANOMU } from '../public/js/shared/battle-c11c.js';
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

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const NOTES7 = ['note_re', 'note_mi', 'note_fa', 'note_so', 'note_la', 'note_si', 'note_do'];
const tile = (s) => [Math.floor(s.x), Math.floor(s.y)];
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
async function player(world, name, famNames = []) {
  const ids = famNames.length ? await famIds(world, famNames) : [];
  const { bot, c } = await addPlayer(world, name, C11C_ACT0, [SKY_FLAG]);
  c.keyItems = [...new Set([...(c.keyItems || []), ...NOTES7, 'star_chart', 'star_ship', 'name_lamp'])];
  c.objective = act2ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'mecha', 123);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  bot.fam = fam;
  return { bot, c, fam };
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
// 回ろうの 1階を 道さがしの とおりに（画面と 同じ: 歩く・台の 上で しらべる・台の ない 所で しらべて「よびもどす」）
async function runHall(bot, n, opts) {
  const map = MAPS[C11C_MAP[`hall${n}`]];
  const path = solve11c(map, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, algolPed11c(bot.world, bot.s));
  assert.ok(path, `${map.id}: 出口へ`);
  for (const step of path) {
    const [x, y, a] = step.st;
    if (step.act) {
      bot.choice = 0;
      await look(bot, x, y - 1, opts);
      assert.equal(algolPed11c(bot.world, bot.s), a, `${map.id}: アルゴル ${a}`);
    } else await walk(bot, x, y, opts);
    if (bot.s.map !== map.id) return path;
  }
  return path;
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

// 塔の 前（塔から 出て 来た 所 → 1歩）
const T0 = CITY_POS11C.towerFront;
const towerGo = (bot) => async (o) => {
  await warpTo(bot, 'c11b_front', T0.x, T0.y, o);
  await walk(bot, T0.x, T0.y + 1, o);
};
const doorGo = (bot) => async (o) => {
  await warpTo(bot, C11C_MAP.door, DOOR_POS11C.arrive.x, DOOR_POS11C.arrive.y, o);
  await walk(bot, DOOR_POS11C.arrive.x, DOOR_POS11C.arrive.y - 1, o);
  await walk(bot, DOOR_POS11C.arrive.x, DOOR_POS11C.arrive.y - 2, o);
};
// ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ノクトの ヒント → もう一度）
async function bossUntilWin(bot, which, first, again, { mode0 = 'know', max = 8, fought, bots = [], sent, seen = null } = {}) {
  const res = [];
  const battle = C11C_BATTLE[which];
  const win = which === 'mecha' ? C11C.mecha : C11C.ace;
  gear([bot.s.char, ...(bot.fam || [])], which, which === 'mecha' ? 123 : 124);
  for (const b of bots) gear([b.s.char], which, which === 'mecha' ? 123 : 124);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    healAll([bot, ...bots]);
    const v0 = bot.msgs.length;
    const o = { fought, bots, sent, realMode: (fid) => (fid === battle ? mode : 'know'), onBattle: seen };
    await (k === 0 ? first(o) : again(o));
    assert.ok(fought.filter((f) => f === battle).length >= k + 1, `${battle} を 本当に 戦った（通りぬけない）`);
    const won = !!bot.world.hasFlagFn(bot.s)(win);
    res.push(won ? 'win' : 'lose');
    if (!won && k === 0) { await tickN(bot.world, 40); await playReal(bot, R({ fought, bots, sent })); assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0), 'ノクトの ヒント'); }
    if (won) return res;
  }
  return res;
}
// うらの 町 → 回ろう 1〜3階（ひと休み）→ 大とびらの 前
async function corridor(bot, opts, { fight = false } = {}) {
  const c = bot.s.char;
  await warpTo(bot, 'c11b_back', CITY_POS11C.hallDoorFront.x, CITY_POS11C.hallDoorFront.y, opts);
  await walk(bot, CITY_POS11C.hallDoor.x, CITY_POS11C.hallDoor.y, opts);
  assert.equal(bot.s.map, C11C_MAP.hall1);
  if (fight) {
    await warpTo(bot, C11C_MAP.hall1, 9, 10, opts);
    assert.equal(await fieldFight(bot, opts), 't11c_hall1');
    await warpTo(bot, C11C_MAP.hall1, HALL_POS11C[1].arrive.x, HALL_POS11C[1].arrive.y, opts);
  }
  await walk(bot, HALL_POS11C[1].arrive.x + 1, HALL_POS11C[1].arrive.y, opts);
  assert.ok(said(bot, 'かげの台に、立って、ぼくを、よべ'));
  await runHall(bot, 1, opts);
  assert.equal(bot.s.map, C11C_MAP.hall2);
  await walk(bot, HALL_POS11C[2].arrive.x, HALL_POS11C[2].arrive.y - 1, opts);
  assert.ok(c.flags[C11C.h1]);
  await runHall(bot, 2, opts);
  assert.equal(bot.s.map, C11C_MAP.rest);
  await walk(bot, REST_POS11C.arrive.x, REST_POS11C.arrive.y - 1, opts);
  assert.ok(c.flags[C11C.rest] && said(bot, 'ぼくの光で、はかりの前に、立ちたい'));
  await go(bot, REST_POS11C.up.x, REST_POS11C.up.y, opts);
  assert.equal(bot.s.map, C11C_MAP.hall3);
  await walk(bot, HALL_POS11C[3].arrive.x + 1, HALL_POS11C[3].arrive.y, opts);
  await runHall(bot, 3, opts);
  assert.equal(bot.s.map, C11C_MAP.door);
}

test('幕が 開いた: もう 第2幕を クリアした 人の セーブ（古い 目標の 文）は ログインで「月の都の、名前の塔の前へ。…」に なおり、塔の 前で 始まる・前の 人は かわらない', async () => {
  assert.equal(PART3_C11C_OPEN, true);
  assert.equal(act2ClearObjective(), C11C_OBJ.start);
  assert.equal(C11B_OBJ.act2, '第3部　第3章　第3幕へ（続きはアップデートで！）');
  assert.ok(!CH11_PROGRESS.some(([, t]) => t === C11B_OBJ.act2) && !(C11B_OBJ.act2 in CH11_OBJECTIVE_TARGETS), '前の 文は 表から ぬけた');
  const world = fixedWorld(11331);
  const done = await addPlayer(world, 'ソラ', C11C_ACT0, [SKY_FLAG]);
  done.c.objective = C11B_OBJ.act2; // 幕を 開ける 前に 第2幕を クリアした 人の セーブ
  const mid = await addPlayer(world, 'ミナ', 'c11b_lamp', [SKY_FLAG]);
  const part2 = await addPlayer(world, 'ポポ', 'c8_solitus', [SKY_FLAG]);
  const keep = [[mid, C11B_OBJ.terrace], [part2, part2.c.objective]];
  const w2 = new GameWorld({ offline: true, rng: makeRng(11332), rateLimit: false, data: JSON.parse(JSON.stringify(world.data)) });
  const enter = async (P) => {
    const b = new Bot(w2, P.c.name);
    await b.login();
    b.send({ t: 'play', id: P.c.id });
    await b.settle();
    return { bot: b, c: w2.data.characters[P.c.id] };
  };
  const A = await enter(done);
  assert.equal(A.c.objective, C11C_OBJ.start, '古い 文は なおる');
  for (const [P, want] of keep) {
    const B = await enter(P);
    assert.equal(B.c.objective, want, `${P.c.name} は かわらない`);
  }
  assert.equal(storyPlace(A.c).label, '第3部 第3章 第2幕', '始まる 前は 第2幕 の まま');
  // 塔の 前（塔から 出て 来た 所）→ アルゴル・題の 画面 → メカ（ここでは 本当に 戦う）
  A.bot.s.repelUntil = 1e15;
  gear([A.c], 'mecha', 123);
  const fought = [];
  await towerGo(A.bot)({ fought, sent: new Map() });
  assert.ok(A.c.flags[C11C.start] && said(A.bot, '第3幕　はかりの回ろうと、ふたつの光'));
  assert.ok(fought.includes(C11C_BATTLE.mecha), 'メカと 本当に 戦った');
  assert.equal(storyPlace(A.c).label, '第3部 第3章 第3幕');
});

test('通し（家族の 仲間 3人）: 第2幕の クリアから → 塔の 前 → バラバラン3号（本当に）→ アルゴルが いっしょ → 回ろう（魔物）1〜3階・ひと休み → 隊長（はじめ 完全オートで 負け → ヒント → アルゴルにたのむ で 勝ち）→ c11_act3', async () => {
  const world = fixedWorld(11301);
  const { bot, c } = await player(world, 'ソラ', ['ミナ', 'リン', 'ガル']);
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  const resM = await bossUntilWin(bot, 'mecha', towerGo(bot), towerGo(bot), { fought, sent, max: 10 });
  assert.equal(resM.at(-1), 'win', `メカ ${resM}`);
  assert.ok(c.flags[C11C.join] && said(bot, 'いっしょに、来ることになった'));
  assert.equal(bot.s.map, 'c11b_back', '古い 戸の 前へ');
  assert.equal(c.objective, C11C_OBJ.hall);
  await talkNpc(bot, 'c11b_back', 'c11c_trio1', opts);
  await corridor(bot, opts, { fight: true });
  let spica = 0, ac = 0;
  const seen = (c2) => { if (c2.opts.fixed === C11C_BATTLE.ace) { ac++; if (c2.battle.c9sp) spica++; } };
  const resA = await bossUntilWin(bot, 'ace', doorGo(bot), doorGo(bot), { mode0: 'auto', fought, sent, max: 10, seen });
  assert.equal(resA[0], 'lose', '完全オートでは 勝てない');
  assert.equal(resA.at(-1), 'win', `隊長 ${resA}`);
  assert.ok(ac >= resA.length && spica === ac, `隊長戦には いつも スピカが いる（${spica}/${ac}）`);
  assert.ok((sent.get(TANOMU) || 0) > 0, `「アルゴルにたのむ」を 画面と 同じ 形で 送った（${sent.get(TANOMU)}）`);
  assert.ok(c.flags[C11C.ace] && c.flags[C11C.act3]);
  assert.ok(said(bot, '……スピカ。') && said(bot, '第3幕　クリア！'));
  assert.equal(c.objective, C11C_OBJ.act3);
  assert.ok(storyPlace(c).cleared);
  // うらの 町の 店に 4つ・宝箱の 中み
  assert.ok(C11C_BACK_ADD.every((i) => shopItems(SHOPS.c11b_back_shop, (f) => !!c.flags[f]).includes(i)));
  for (const id of C11C_CHEST_IDS) assert.ok(C11C_MAP_IDS.some((m) => MAPS[m].chests.some((q) => q.id === id && q.item)), id);
  console.log(`  メカ ${resM.join('→')}・隊長 ${resA.join('→')}・たのむ ${sent.get(TANOMU)}回・戦い ${fought.length}回`);
});

test('ひとり（仲間なし）: メカ・隊長とも 勝つまで（知って いる 動き。アルゴルにたのむ）', async () => {
  const world = fixedWorld(11302);
  const { bot, c } = await player(world, 'ソラ');
  bot.s.repelUntil = 1e15;
  const fought = [], sent = new Map();
  const opts = { fought, sent };
  const resM = await bossUntilWin(bot, 'mecha', towerGo(bot), towerGo(bot), { fought, sent, max: 12 });
  assert.equal(resM.at(-1), 'win', `メカ ${resM}`);
  await corridor(bot, opts);
  const resA = await bossUntilWin(bot, 'ace', doorGo(bot), doorGo(bot), { fought, sent, max: 12 });
  assert.equal(resA.at(-1), 'win', `隊長 ${resA}`);
  assert.ok((sent.get(TANOMU) || 0) > 0);
  assert.ok(c.flags[C11C.act3]);
  console.log(`  ひとり: メカ ${resM.join('→')}・隊長 ${resA.join('→')}・たのむ ${sent.get(TANOMU)}回`);
});

test('家族 2人（＋仲間 2人）: 3階で 1人が 黄の 台で さくを おさえて 近道 → 2人で 隊長（2人とも 画面の 形で たのむ）', async () => {
  const world = fixedWorld(11303);
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
  await warpTo(B.bot, 'c11b_front', T0.x + 1, T0.y + 2, oB);
  const resM = await bossUntilWin(A.bot, 'mecha', towerGo(A.bot), towerGo(A.bot), { fought, sent, bots: [B.bot], max: 10 });
  assert.equal(resM.at(-1), 'win', `メカ ${resM}`);
  assert.ok(A.c.flags[C11C.join] && said(B.bot, 'いっしょに、来ることになった'), 'B も 場面を 見た');
  // 3階まで（フラグは リーダー）
  for (const f of [C11C.h1, C11C.h2, C11C.rest]) A.c.flags[f] = true;
  const m3 = MAPS[C11C_MAP.hall3], C3 = m3.c11c;
  const D = C3.peds.findIndex((P) => P.c === 'd');
  const cell = C3.fences.find((F) => F.c === 'd').cells[0];
  await warpTo(A.bot, C11C_MAP.hall3, C3.peds[D].x, C3.peds[D].y, oA);
  await warpTo(B.bot, C11C_MAP.hall3, cell.x, cell.y + 1, oB);
  // A が 黄の 台に 立つ → B は さく → 東の 光の 橋 → 北の 広間 → 緑の 台で アルゴル → 出口
  for (let y = cell.y; y >= 5; y--) await walk(B.bot, cell.x, y, oB);
  assert.deepEqual(tile(B.bot.s), [cell.x, 5], 'B は 近道で 北の 広間へ');
  await runHall(B.bot, 3, oB);
  assert.equal(B.bot.s.map, C11C_MAP.door);
  await warpTo(A.bot, C11C_MAP.door, DOOR_POS11C.arrive.x + 1, DOOR_POS11C.arrive.y, oA);
  const humans = new Set();
  const resA = await bossUntilWin(A.bot, 'ace', async (o) => {
    await warpTo(B.bot, C11C_MAP.door, DOOR_POS11C.arrive.x - 1, DOOR_POS11C.arrive.y - 2, oB);
    await doorGo(A.bot)(o);
  }, async (o) => {
    await warpTo(B.bot, C11C_MAP.door, DOOR_POS11C.arrive.x - 1, DOOR_POS11C.arrive.y - 2, oB);
    await doorGo(A.bot)(o);
  }, { fought, sent, bots: [B.bot], max: 10, seen: (c2) => { for (const a of c2.battle.allies) if (a.controller === A.bot.s.id || a.controller === B.bot.s.id) humans.add(a.controller); } });
  assert.equal(resA.at(-1), 'win', `隊長 ${resA}`);
  assert.equal(humans.size, 2, '2人とも 隊長戦に いる');
  assert.ok((sent.get(TANOMU) || 0) > 0);
  assert.ok(A.c.flags[C11C.act3]);
  assert.ok(said(B.bot, '……スピカ。'), 'なかまも おわりの 場面を 見た');
  console.log(`  2人: メカ ${resM.join('→')}・隊長 ${resA.join('→')}`);
});
