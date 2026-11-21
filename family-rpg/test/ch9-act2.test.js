// 第3部 第1章 第2幕「鉱山の底の先」の 通し（第91回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第1幕を クリアした セーブから c9_act2 まで、決まった 戦いを 本当に 戦う
//   （家族 4人: 勇者・大賢者・ゴッドハンド・大神官。大王は しくみを 知って いる 人の 動き … tools/sim-ch9.mjs の know。手下は オート）
// ・大王に はじめは 完全オートで 負ける → ノクトの ヒント →「もう一度いどむ」で とびらの 前から → 勝つ
// ・宝箱 10こ（中みは B班の data/items-c9b.js）が 取れる
// ・家族 2人: 柱を 手分けして ともす・大地の下の ふつうの 戦い（大ミミズ）が ふつうの 長さで 終わり、つぎの 戦いに のこらない・回線が 切れても 続きから
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { C9B, C9B_PILLARS, C9B_BOXES, C9B_MAP, C9B_BATTLE, UNDER_RAFT } from '../public/js/shared/maps/c9b-flags.js';
import { STAR_FORK } from '../public/js/shared/maps/c9a-flags.js';
import { UNDER_POS, HALL_POS, SHAFT_POS } from '../public/js/shared/maps/c9b-rows.js';
import { MINE_STAIRS9B } from '../public/js/shared/maps/c9b.js';
import { lightFor } from '../public/js/shared/world/c9a-steps.js';
import { act1ClearObjective, act2ClearObjective, PART3_ACT2_OPEN } from '../public/js/shared/data/story-c9.js';
import { C9B_OBJ } from '../public/js/shared/data/story-c9b.js';
import { C9B_TREASURE } from '../public/js/shared/data/items-c9b.js';
import { BOSS_HINTS, BOSS_RETRY } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, talkTo, walkTo, pathTo, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
function gear(chars, boss, lv) {
  const kit = ch9Party(boss, lv);
  chars.forEach((c, i) => { for (const k of COPY) c[k] = structuredClone(kit[i][k]); });
}
const giveFork = (c) => { c.keyItems = [...new Set([...(c.keyItems || []), STAR_FORK])]; };
// 家族 4人（ソラ が 遊ぶ。ほかの 3人は ソラの パーティーに 入って いる 家族の キャラ）
async function family(seed) {
  const world = fixedWorld(seed);
  const ids = [];
  for (const name of ['パパ', 'ミク', 'ユイ']) {
    const b = new Bot(world, name);
    await b.login();
    await b.createAndPlay('warrior');
    await b.settle();
    ids.push(b.char.id);
    b.send({ t: 'quit' });
  }
  const { bot, c } = await addPlayer(world, 'ソラ', 'c9_act1');
  giveFork(c);
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'king', 100);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  return { world, bot, c, fam };
}
async function openChest(bot, ch, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [ch.x + dx, ch.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
  assert.ok(side, `${map.id}: 宝箱 ${ch.id} の となりへ 歩ける`);
  await walkTo(bot, side[0], side[1], opts);
  await examine(bot, ch.x, ch.y, opts);
  assert.ok(bot.s.char.chests[ch.id], ch.id);
}
const chestOf = (mapId, id) => MAPS[mapId].chests.find((x) => x.id === id);
async function lightPillar(bot, i, opts) {
  const p = UNDER_POS.pillars[i];
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy]).filter(([x, y]) => canStand(map, x + 0.5, y + 0.5, has))
    .map(([x, y]) => [x, y, pathTo(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has)]).filter((s) => s[2]).sort((a, b) => a[2].length - b[2].length)[0];
  assert.ok(side, `柱 ${i + 1}`);
  await walkTo(bot, side[0], side[1], opts);
  await examine(bot, p.x, p.y, opts);
}
const REAL = (mode) => (id) => (id === C9B_BATTLE.king ? mode : /^c9b_guard/.test(id || '') ? 'auto' : null);

test('通し（本当の 戦い）: 第1幕 クリア → くぼ地 → 鉱山 → たてあな → 大地の下（柱 6本）→ 村 → やしき（手下）→ 大王（負けて ヒント → もう一度）→ 同じ テーブル → 船着き場。宝箱 10こ', { timeout: 900000 }, async () => {
  assert.equal(PART3_ACT2_OPEN, true, '幕は 開いた');
  const { world, bot, c } = await family(9191);
  assert.equal(c.objective, act1ClearObjective(), '第1幕 クリアの 目標は 第2幕の はじまり');
  assert.equal(c.objective, C9B_OBJ.start);
  const fought = [];
  // 1 くぼ地で 音さ（武具屋の 品は B班の 品）
  await place(bot, 'c9a_crater', 12, 15);
  await walkTo(bot, 12, 10);
  assert.ok(c.flags[C9B.ring2]);
  assert.equal(c.objective, C9B_OBJ.ring2);
  assert.ok(SHOPS.c9b_crater.items.every((id) => /^c9bs_/.test(id)) && SHOPS.c9b_crater.items.length === 8);
  // 2 鉱山 → 3 たてあな → 4 大地の下
  await place(bot, 'mine3', 14, 19);
  await stepOn(bot, 14, 18);
  assert.equal(c.objective, C9B_OBJ.mine);
  await walkTo(bot, MINE_STAIRS9B.x, MINE_STAIRS9B.y);
  await walkTo(bot, SHAFT_POS.exit.x, SHAFT_POS.exit.y);
  assert.equal(bot.s.map, C9B_MAP.under);
  await stepOn(bot, UNDER_POS.arrive.x, UNDER_POS.arrive.y + 1);
  assert.equal(c.objective, C9B_OBJ.under);
  // 柱（1〜4）と かくれた 宝箱（その 柱で 見える）
  for (const i of [0, 1, 2, 3]) {
    await lightPillar(bot, i);
    await openChest(bot, chestOf(C9B_MAP.under, `c9b_u${i + 1}`));
  }
  // 5 村（4本めの 柱で もう 着いて いる）
  assert.ok(c.flags[C9B.village]);
  await openChest(bot, chestOf(C9B_MAP.under, 'c9b_v1'));
  for (const i of [4, 5]) {
    await lightPillar(bot, i);
    await openChest(bot, chestOf(C9B_MAP.under, `c9b_u${i + 1}`));
  }
  assert.ok(c.flags[C9B.gate]);
  assert.equal(c.objective, C9B_OBJ.gate);
  // 6 やしき（手下とは 本当に 戦う・はこ 3つ・宝箱 3つ）
  await walkTo(bot, UNDER_POS.gate.x, UNDER_POS.gate.y);
  assert.equal(bot.s.map, C9B_MAP.hall);
  const H = MAPS.c9b_hall;
  const boxes = [];
  for (let y = 0; y < H.h; y++) for (let x = 0; x < H.w; x++) if (H.tiles[y * H.w + x] === T.C9B_BOX) boxes.push({ x, y });
  for (const id of ['c9b_h2', 'c9b_h3']) await openChest(bot, chestOf(C9B_MAP.hall, id), { fought, real: REAL('know') });
  for (const b of boxes) {
    const has = world.hasFlagFn(bot.s);
    const side = D4.map(([dx, dy]) => [b.x + dx, b.y + dy]).find(([x, y]) => canStand(H, x + 0.5, y + 0.5, has) && pathTo(H, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
    await walkTo(bot, side[0], side[1], { fought, real: REAL('know') });
    await examine(bot, b.x, b.y);
  }
  assert.ok(C9B_BOXES.every((f) => c.flags[f]), 'はこ 3つ');
  assert.ok(fought.some((f) => /^c9b_guard/.test(f)), '手下と 戦った');
  assert.ok(bot.battles.every((r) => r.outcome === 'win'), '手下には 勝つ');
  // 7 大王: はじめは 完全オートで 負ける → ノクトの ヒント → とびらの 前
  const v0 = bot.msgs.length;
  await place(bot, C9B_MAP.hall, HALL_POS.door.x, HALL_POS.door.y + 2);
  await walkTo(bot, HALL_POS.door.x, HALL_POS.door.y, { fought, real: REAL('auto') });
  assert.equal(fought.at(-1), C9B_BATTLE.king);
  assert.equal(bot.battles.at(-1)?.outcome, 'lose', '完全オートは 皿を ねらわないので 負ける');
  assert.ok(!c.flags[C9B.king]);
  assert.equal(c.bossLoss?.c9b_king, 1);
  assert.ok(said(bot, BOSS_HINTS.c9b_king[0].slice(0, 8), v0), 'ノクトの ヒント');
  assert.equal(BOSS_RETRY.c9b_king, 'c9b_king_event');
  assert.equal(bot.s.map, C9B_MAP.hall);
  assert.ok(Math.floor(bot.s.y) > HALL_POS.door.y, 'とびらの 前へ');
  assert.ok(C9B_BOXES.every((f) => c.flags[f]), '取り返した はこは のこる');
  // もう一度（しくみを 知って 戦う）
  await walkTo(bot, HALL_POS.door.x, HALL_POS.door.y, { fought, real: REAL('know') });
  assert.equal(bot.battles.at(-1)?.outcome, 'win', '本当の 戦いで 大王に 勝つ');
  assert.ok(c.flags[C9B.king] && c.flags[C9B.raft]);
  assert.ok(c.keyItems.includes(UNDER_RAFT));
  assert.ok(!C9B_BOXES.some((f) => c.flags[f]), 'はこの フラグは 消える');
  for (const t of ['すわりこんだ', 'こわかった', '同じテーブル']) assert.ok(said(bot, t), t);
  assert.equal(c.objective, C9B_OBJ.raft);
  // ごちそうの 間の 宝箱（大王の あと。手下も もう いない）
  await place(bot, C9B_MAP.hall, HALL_POS.door.x, HALL_POS.door.y + 1);
  await openChest(bot, chestOf(C9B_MAP.hall, 'c9b_h1'));
  await place(bot, C9B_MAP.under, UNDER_POS.dock.x, UNDER_POS.dock.y - 4);
  // 8・9 船着き場
  await walkTo(bot, UNDER_POS.dockScene.x + 2, UNDER_POS.dockScene.y);
  assert.ok(c.flags[C9B.act2]);
  assert.equal(c.objective, act2ClearObjective()); // 第92回 A班: 第3幕が 開いた
  assert.ok(storyPlace(c).cleared);
  // 宝箱 10こ 全部・中みは B班の 表
  const ids = Object.keys(C9B_TREASURE);
  assert.equal(ids.length, 10);
  for (const id of ids) assert.ok(c.chests[id], `宝箱 ${id}`);
  const want = {};
  for (const [it, n] of Object.values(C9B_TREASURE)) want[it] = (want[it] || 0) + n;
  for (const [it, n] of Object.entries(want)) assert.ok(itemCount(c, it) >= n, `${it} × ${n}`);
  assert.ok(itemCount(c, 'c9bb_king_mallet') + itemCount(c, 'c9bb_king_bib') >= 1, '大王の 品');
});

test('家族 2人: 柱を 手分け・大地の下の ふつうの 戦い（大ミミズ）は ふつうの 長さで 終わる・つぎの 戦いに 前の 魔物が のこらない', { timeout: 600000 }, async () => {
  const world = fixedWorld(9192);
  const A = await addPlayer(world, 'ソラ', 'c9_under', ['c9_shaft']);
  const B = await addPlayer(world, 'ミク', 'c9_under', ['c9_shaft']);
  giveFork(A.c); giveFork(B.c);
  gear([A.c, B.c], 'king', 100);
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  world.placeSession(A.bot.s, C9B_MAP.under, UNDER_POS.arrive.x + 0.5, UNDER_POS.arrive.y + 0.5, 'down', true);
  world.placeSession(B.bot.s, C9B_MAP.under, UNDER_POS.arrive.x + 1.5, UNDER_POS.arrive.y + 0.5, 'down', true);
  await play(A.bot, { bots: [B.bot] });
  // 手分け: ソラ 1・3、ミク 2
  await lightPillar(A.bot, 0, { bots: [B.bot] });
  await lightPillar(B.bot, 1, { bots: [A.bot] });
  await lightPillar(A.bot, 2, { bots: [B.bot] });
  for (const i of [0, 1, 2]) assert.ok(A.c.flags[C9B_PILLARS[i]], `柱 ${i + 1} は リーダーの 世界`);
  // 大ミミズと 本当に 戦う（オート）
  const sp = 'c9b_mimizu';
  assert.equal(MONSTERS[sp].darkOnly, true);
  const ms = mapState(world, C9B_MAP.under);
  // ふたり いっしょに 戦う（そばに いる）
  world.placeSession(B.bot.s, C9B_MAP.under, A.bot.s.x + 1, A.bot.s.y, 'down', true);
  await play(A.bot, { bots: [B.bot] });
  const fight = async (group) => {
    fullHeal(A.c); fullHeal(B.c);
    const id = `t_${group.join('_')}_${ms.symbols.size}`;
    const sym = { id, sp: group[0], group, table: 't9b_light', zone: 't9b_light', x: A.bot.s.x, y: A.bot.s.y, hx: A.bot.s.x, hy: A.bot.s.y, vx: 0, vy: 0, t: 0, state: 'wander', busy: false, stun: 0, speed: 1, aggro: true, level: MONSTERS[group[0]].lv };
    ms.symbols.set(id, sym);
    A.bot.s.repelUntil = 0;
    startFieldBattle(world, A.bot.s, sym);
    const ctx = world.battles.get(A.bot.s.battleId);
    assert.ok(ctx, '戦いが 始まる');
    const species = ctx.battle.enemies.map((e) => e.species);
    assert.ok(ctx.sids.includes(B.bot.s.id), 'ミクも いっしょ');
    let ms0 = 0;
    for (let i = 0; i < 4000 && world.battles.has(ctx.id); i++) {
      for (const a of ctx.battle.allies) a.auto = true;
      A.bot.flushQueue(); B.bot.flushQueue();
      await tickN(world, 1);
      ms0 += 50;
    }
    await play(A.bot, { bots: [B.bot] });
    return { species, sec: ms0 / 1000, outcome: A.bot.battles.at(-1)?.outcome, n: ctx.battle.enemies.length };
  };
  const r1 = await fight([sp]);
  assert.deepEqual(r1.species, [sp]);
  assert.equal(r1.outcome, 'win');
  assert.ok(r1.sec <= 150, `大ミミズの 戦いは ${r1.sec}秒（4人なら 40秒 くらい）`);
  const r2 = await fight(['c9b_crab', 'c9b_kinoko']);
  assert.ok(!r2.species.includes(sp), `つぎの 戦いに 大ミミズは のこらない（${r2.species.join(',')}）`);
  assert.equal(r2.outcome, 'win');
  assert.ok(r2.sec <= 150, `ふつうの 戦いは ${r2.sec}秒（${r2.n}ひき）`);
});

test('回線が 切れた 時の つづき: 大地の下で 切れて つなぎなおす → 同じ 場所・柱・こけの 光', { timeout: 300000 }, async () => {
  const world = fixedWorld(9193, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c9_under', ['c9_shaft']);
  const B = await addPlayer(world, 'ミク', 'c9_under', ['c9_shaft']);
  giveFork(A.c);
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  await place(A.bot, C9B_MAP.under, UNDER_POS.arrive.x, UNDER_POS.arrive.y, 'down', { bots: [B.bot] });
  await lightPillar(A.bot, 0, { bots: [B.bot] });
  const U = MAPS.c9b_under;
  const k = U.c9a.moss[0];
  await walkTo(A.bot, k % U.w, Math.floor(k / U.w), { bots: [B.bot] });
  const lit0 = lightFor(world, A.bot.s).lit.size;
  assert.ok(lit0 >= 1);
  const where = [A.bot.s.map, Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)];
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 5);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  assert.ok(A2.resumed);
  assert.deepEqual([A2.s.map, Math.floor(A2.s.x), Math.floor(A2.s.y)], where);
  assert.ok(A2.s.char.flags[C9B_PILLARS[0]], '柱は のこる');
  assert.equal(lightFor(world, A2.s).lit.size, lit0, 'こけの 光は のこる');
  await lightPillar(A2, 1, { bots: [B.bot] });
  assert.ok(A2.s.char.flags[C9B_PILLARS[1]]);
});
