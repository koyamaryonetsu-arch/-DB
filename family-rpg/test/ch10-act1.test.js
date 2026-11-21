// 第3部 第2章 第1幕「赤と緑」の 通し（第94回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第1章を クリアした セーブ（c9_act4）から c10_act1 まで、決まった 戦いを 本当に 戦う
//   （家族 4人: 勇者・大賢者・ゴッドハンド・大神官。tools/sim-ch10.mjs の 装備 CH9_KIT.tamagon・mold。中ボスは しくみを 知って いる 人の 動き … know）
// ・赤 → 緑 と 緑 → 赤 の 両方。中ボスには はじめは 完全オートで いどむ（負ければ ノクトの ヒント →「もう一度いどむ」）→ 知って いる 動きで 勝つまで
//   強さの 数字が 少し かわっても 通る ように、勝ち負けの 回数は きめない（さいごに 勝てば よい。6回まで）
// ・ふつうの 戦いは 本当に 戦う（オート）。溶岩から にげて いる 間は 魔物が 出ない
// ・宝箱 14こ（中みは B班の data/items-c10a.js）。くぼ地の 武具屋に 品が ふえる
// ・家族 2人が 赤と 緑に 分かれて 同時に（それぞれ 自分の 物語・本当の 戦い）
// ・回線が 切れた 時（溶岩から にげて いる とちゅう・根の国）: つなぎなおすと 続きから（にげて いる 時は その 階の 入口から）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand, isBlocked } from '../public/js/shared/maps/index.js';
import { C10A, C10A_RED, C10A_GREEN, C10A_MAP, C10A_BATTLE, C10A_CHEST_ALL, C10A_LAVA_MS } from '../public/js/shared/maps/c10a-flags.js';
import { C10A_POS, CRATER_STAIRS10A, UNDER_ROOT10A } from '../public/js/shared/maps/c10a-rows.js';
import { runEntrance10a, c10aSnap } from '../public/js/shared/world/c10a-steps.js';
import { act4ClearObjective, PART3_ACT4_OPEN } from '../public/js/shared/data/story-c9.js';
import { PART3_C10A_OPEN } from '../public/js/shared/data/story-c10.js';
import { C10A_OBJ } from '../public/js/shared/data/story-c10a.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10A_SHOP_ADD } from '../public/js/shared/data/items-c10a.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch10.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, talkTo, D4, addPlayer } from './c9a-play.js';

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
async function family(world, name, famNames) {
  const ids = await famIds(world, famNames);
  const { bot, c } = await addPlayer(world, name, 'c9_act4');
  c.objective = act4ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'tamagon', 107);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  bot.fam = fam;
  return { bot, c, fam };
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
    await stepOn(bot, x, y, opts);
    if (bot.s.map !== map.id) return;
  }
}
async function goExamine(bot, p, choice, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x) && pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
  assert.ok(side, `${map.id}: ${p.x},${p.y} の となりへ`);
  await go(bot, side[0], side[1], opts);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}
async function openChests(bot, mapId, opts) {
  for (const ch of MAPS[mapId].chests) {
    if (bot.s.char.chests[ch.id]) continue;
    if (bot.s.map !== mapId) continue;
    const has = bot.world.hasFlagFn(bot.s);
    const map = MAPS[mapId];
    const ok = D4.some(([dx, dy]) => canStand(map, ch.x + dx + 0.5, ch.y + dy + 0.5, has) && pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), ch.x + dx, ch.y + dy, has));
    if (!ok) continue;
    await goExamine(bot, ch, 0, opts);
  }
}
// 魔物を 1ぴき その 人に ぶつけて 本当に 戦う（オート）
async function fieldFight(bot, opts) {
  const world = bot.world;
  const ms = mapState(world, bot.s.map);
  for (let i = 0; i < 60 && !ms.symbols.size; i++) { bot.s.repelUntil = 0; await tickN(world, 5); }
  const sym = [...ms.symbols.values()][0];
  assert.ok(sym, `${bot.s.map}: 魔物が 出る`);
  bot.s.repelUntil = 0;
  sym.x = bot.s.x; sym.y = bot.s.y;
  fullHeal(bot.s.char);
  startFieldBattle(world, bot.s, sym);
  await play(bot, { ...opts, real: () => 'auto' });
  bot.s.repelUntil = 1e15;
  return sym.table;
}
// 中ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ヒント → もう一度）
async function bossUntilWin(bot, color, { mode0 = 'auto', max = 6, fought = [], bots = [] } = {}) {
  const res = [];
  const red = color === 'red';
  const battle = red ? C10A_BATTLE.red : C10A_BATTLE.green;
  const win = red ? C10A_RED.boss : C10A_GREEN.boss;
  const party = [bot.s.char, ...(bot.fam || [])];
  gear(party, red ? 'tamagon' : 'mold', red ? 107 : 108);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    for (const b of [bot, ...bots]) fullHeal(b.s.char);
    for (const ch of party) fullHeal(ch);
    const v0 = bot.msgs.length;
    const o = { fought, bots, real: (fid) => (fid === battle ? mode : fid ? 'know' : 'auto') };
    if (red) {
      await place(bot, C10A_MAP.r3, 13, 12, 'up', o);
      await stepOn(bot, 13, 10, o);
    } else {
      await place(bot, C10A_MAP.g2, 20, 10, 'down', o);
      await stepOn(bot, 20, 11, o);
    }
    const won = !!bot.s.char.flags[win];
    res.push(won ? 'win' : 'lose');
    if (!won) assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0) || k > 0, 'ノクトの ヒント');
    if (won) return res;
  }
  return res;
}
// 赤の 道（レバーを 引く・ふつうの 戦い・宝箱・中ボス・溶岩から にげる）
async function redRoad(bot, opts, log) {
  const c = bot.s.char;
  await place(bot, 'volcano3', 14, 21, 'up', opts);
  await stepOn(bot, 14, 20, opts);
  assert.ok(c.flags[C10A_RED.stairs]);
  await go(bot, CRATER_STAIRS10A.x, CRATER_STAIRS10A.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r1);
  log.push(await fieldFight(bot, opts));
  await goExamine(bot, C10A_POS.c10r_1.levers[0], 0, opts);
  await openChests(bot, C10A_MAP.r1, opts);
  await go(bot, C10A_POS.c10r_1.down.x, C10A_POS.c10r_1.down.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r2);
  log.push(await fieldFight(bot, opts));
  for (const L of C10A_POS.c10r_2.levers) await goExamine(bot, L, 0, opts);
  await openChests(bot, C10A_MAP.r2, opts);
  await go(bot, C10A_POS.c10r_2.down.x, C10A_POS.c10r_2.down.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r3);
  await openChests(bot, C10A_MAP.r3, opts);
  const r = await bossUntilWin(bot, 'red', opts);
  log.push(`tamagon:${r.join(',')}`);
  assert.ok(c.flags[C10A_RED.boss], `科学者に 勝つ（${r.join(',')}）`);
  assert.ok(c.flags[C10A_RED.run] && (c.keyItems || []).includes('note_re'));
  // かけ上がる（溶岩。魔物は 出ない）
  await go(bot, C10A_POS.c10r_3.up.x, C10A_POS.c10r_3.up.y, opts);
  assert.equal(bot.s.map, C10A_MAP.r2);
  assert.ok(c10aSnap(bot.world, bot.s), '溶岩');
  assert.ok(MAPS.c10r_2.symBlock(bot.world, {}), '魔物は 出ない');
  await go(bot, C10A_POS.c10r_2.up.x, C10A_POS.c10r_2.up.y, opts);
  await go(bot, C10A_POS.c10r_1.up.x, C10A_POS.c10r_1.up.y, opts);
  assert.equal(bot.s.map, 'volcano3');
  await tickN(bot.world, 3);
  await play(bot, opts);
  assert.ok(c.flags[C10A_RED.note] && !c.flags[C10A_RED.run], 'にげ終わった');
}
// 緑の 道（根・つぼみ・ふつうの 戦い・宝箱・中ボス・緑の 音）
async function greenRoad(bot, opts, log) {
  const c = bot.s.char;
  await place(bot, UNDER_ROOT10A.map, UNDER_ROOT10A.x + 1, UNDER_ROOT10A.y, 'left', opts);
  bot.choice = 0;
  await examine(bot, UNDER_ROOT10A.x, UNDER_ROOT10A.y, opts);
  assert.equal(bot.s.map, C10A_MAP.g1);
  log.push(await fieldFight(bot, opts));
  for (const b of C10A_POS.c10g_1.buds) await goExamine(bot, b, 0, opts);
  await openChests(bot, C10A_MAP.g1, opts);
  await go(bot, C10A_POS.c10g_1.north.x, C10A_POS.c10g_1.north.y, opts);
  assert.equal(bot.s.map, C10A_MAP.g2);
  log.push(await fieldFight(bot, opts));
  for (const b of C10A_POS.c10g_2.buds) await goExamine(bot, b, 0, opts);
  await openChests(bot, C10A_MAP.g2, opts);
  const r = await bossUntilWin(bot, 'green', opts);
  log.push(`mold:${r.join(',')}`);
  assert.ok(c.flags[C10A_GREEN.boss], `だんしゃくに 勝つ（${r.join(',')}）`);
  const H = C10A_POS.c10g_2.hollow[0];
  await go(bot, H.x, H.y, opts);
  assert.ok(c.flags[C10A_GREEN.note] && (c.keyItems || []).includes('note_fa'));
}
async function bonusAndEnd(bot, opts) {
  const c = bot.s.char;
  await place(bot, C10A_MAP.g1, 40, 30, 'right', opts);
  bot.choice = 0;
  await examine(bot, C10A_POS.c10g_1.iceBud.x, C10A_POS.c10g_1.iceBud.y, opts);
  await openChests(bot, C10A_MAP.g1, opts);
  const W = C10A_POS.c10r_2.vineWall;
  await place(bot, C10A_MAP.r2, W.x + 1, W.y, 'left', opts);
  await examine(bot, W.x, W.y, opts);
  await openChests(bot, C10A_MAP.r2, opts);
  // 高い 台の 宝箱（きのこで はねて 行く）
  for (const id of [C10A_MAP.g1, C10A_MAP.g2]) {
    const s = C10A_POS[id].shrooms[0];
    await place(bot, id, s.x, s.y + 1, 'up', opts);
    await go(bot, s.x, s.y, opts);
    assert.equal(Math.floor(bot.s.y), s.to.y, `${id}: きのこで はねた`);
    await openChests(bot, id, opts);
  }
  for (const id of C10A_CHEST_ALL) assert.ok(c.chests[id], `宝箱 ${id}`);
  await talkTo(bot, 'c9a_crater', 'c9c_ped1', 0, opts);
  await talkTo(bot, 'c9a_crater', 'c9c_ped4', 0, opts);
  assert.ok(c.flags[C10A.act1], '幕の クリア');
  assert.equal(c.objective, C10A_OBJ.act1);
  assert.equal(storyPlace(c).label, '第3部 第2章 第1幕');
  assert.ok(storyPlace(c).cleared);
  assert.ok(C10A_SHOP_ADD.every((id) => SHOPS.c10a_crater.items.includes(id)), 'くぼ地の 武具屋に 品が ふえた');
}

test('幕が 開いて いる（PART3_C10A_OPEN）: 第1章 クリアの 目標は 第2章の はじまり', () => {
  assert.equal(PART3_ACT4_OPEN, true);
  assert.equal(PART3_C10A_OPEN, true);
  assert.equal(act4ClearObjective(), C10A_OBJ.start);
});

for (const order of ['red', 'green']) {
  test(`通し（本当の 戦い・${order === 'red' ? '赤 → 緑' : '緑 → 赤'}）: くぼ地 → ${order === 'red' ? '赤 → 緑' : '緑 → 赤'} → おまけ → 台（c10_act1）。宝箱 14こ`, { timeout: 1500000 }, async () => {
    const world = fixedWorld(order === 'red' ? 9421 : 9422);
    const { bot, c } = await family(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
    const fought = [];
    const log = [];
    const opts = { fought };
    await place(bot, 'c9a_crater', 12, 9, 'up', opts);
    await stepOn(bot, 12, 8, opts);
    await stepOn(bot, 12, 7, opts);
    assert.ok(c.flags[C10A.start]);
    if (order === 'red') { await redRoad(bot, opts, log); await greenRoad(bot, opts, log); } else { await greenRoad(bot, opts, log); await redRoad(bot, opts, log); }
    console.log(`# ${order}`, log.join(' '));
    assert.ok(fought.includes(C10A_BATTLE.red) && fought.includes(C10A_BATTLE.green));
    await bonusAndEnd(bot, opts);
  });
}

test('家族 2人が 赤と 緑に 分かれて 同時に（それぞれ 自分の 物語・本当の 戦い）', { timeout: 1500000 }, async () => {
  const world = fixedWorld(9423);
  const A = await family(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
  const B = await family(world, 'ナギ', ['ママ', 'リン', 'ケン']);
  for (const P of [A, B]) P.c.flags.c10_start = true;
  const logA = [], logB = [];
  // 1歩ずつ かわりばんこに 進めたい ところだが、テストでは 片方の 区切りごとに 入れかえる（同じ 世界・同じ 時計）
  const oA = { bots: [B.bot] }, oB = { bots: [A.bot] };
  await place(A.bot, 'volcano3', 14, 21, 'up', oA);
  await place(B.bot, UNDER_ROOT10A.map, UNDER_ROOT10A.x + 1, UNDER_ROOT10A.y, 'left', oB);
  await redRoad(A.bot, oA, logA);
  await greenRoad(B.bot, oB, logB);
  console.log('# split', logA.join(' '), '/', logB.join(' '));
  assert.ok(A.c.flags.c10_note_re && !A.c.flags.c10_g_root, 'ソラは 赤だけ');
  assert.ok(B.c.flags.c10_note_fa && !B.c.flags.c10_r_stairs, 'ナギは 緑だけ');
  assert.equal(A.c.objective, C10A_OBJ.green0);
  assert.equal(B.c.objective, C10A_OBJ.red0);
});

test('回線が 切れた 時: 溶岩から にげて いる とちゅう → つなぎなおすと その 階の 入口から・根の国は 同じ 場所から', { timeout: 300000 }, async () => {
  const world = fixedWorld(9424, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c9_act4');
  for (const f of ['c10_start', 'c10_r_stairs', 'c10_r_boss', 'c10_red_run']) A.c.flags[f] = true;
  const E = runEntrance10a(C10A_MAP.r2);
  await place(A.bot, C10A_MAP.r2, Math.floor(E.x), Math.floor(E.y), 'up', {});
  await go(A.bot, 15, 33, {});
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 2 * C10A_LAVA_MS / 50);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.ok(A2.resumed);
  assert.equal(A2.s.map, C10A_MAP.r2);
  assert.equal(Math.floor(A2.s.y), Math.floor(E.y), 'その 階の 入口から');
  const sn = c10aSnap(world, A2.s);
  assert.ok(sn && sn.lava === MAPS.c10r_2.h, '溶岩も はじめから');
  // ゲームを 終えて 入りなおした（セーブの 場所が 古い 道）: 入口から
  A2.s.c10Arrive = null; A2.s.c10Lava = null; A2.s.y = E.y - 6;
  await tickN(world, 2);
  assert.equal(Math.floor(A2.s.y), Math.floor(E.y));
  // 根の国: 同じ 場所から 続き（つぼみの フラグは のこる）
  for (const f of ['c10_g_root', 'c10_bud1']) A.c.flags[f] = true;
  delete A.c.flags.c10_red_run;
  await place(A2, C10A_MAP.g1, 21, 26, 'up', {});
  const where = [A2.s.map, Math.floor(A2.s.x), Math.floor(A2.s.y)];
  world.disconnect(A2.s, A2.conn);
  await tickN(world, 30);
  const A3 = new Bot(world, 'ソラ');
  await A3.login();
  A3.send({ t: 'play', id: A.c.id });
  await A3.settle();
  assert.deepEqual([A3.s.map, Math.floor(A3.s.x), Math.floor(A3.s.y)], where, '同じ 場所');
  assert.ok(!isBlocked(MAPS.c10g_1, 21, 23, A3.world.hasFlagFn(A3.s)), '葉の 橋は のびた まま');
});
