// 第3部 第1章 第4幕「星のはかば」の 通し（第93回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第3幕を クリアした セーブから c9_act4 まで、決まった 戦いを 本当に 戦う
//   （家族 4人: 勇者・大賢者・ゴッドハンド・大神官。tools/sim-ch9.mjs の 装備 CH9_KIT.mu。ボスは しくみを 知って いる 人の 動き … know）
// ・魔人に はじめは 完全オートで いどむ（負ければ ノクトの ヒント →「もう一度いどむ」）→ 知って いる 動きで 勝つまで
//   強さの 数字が 少し かわっても 通る ように、勝ち負けの 回数は きめない（さいごに 勝てば よい。6回まで）
// ・ふつうの 戦いは 本当に 戦う（オート）。スピカと はなれて いる 間の 戦いには スピカが 出ない
// ・宝箱 8こ（中みは B班の data/items-c9d.js）
// ・家族 2人: 左右の 石を 2人で 鳴らす・いっしょに 魔人と 戦って 勝つ
// ・回線が 切れた 時: スピカを 石に のこした まま 切れて つなぎなおす → スピカは リーダーの そば・続きから
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand, isBlocked } from '../public/js/shared/maps/index.js';
import { C9D, C9D_MAP, C9D_BATTLE, C9D_CHEST_IDS } from '../public/js/shared/maps/c9d-flags.js';
import { C9D_POS, SHORE_DOOR9D } from '../public/js/shared/maps/c9d-rows.js';
import { stoneFront9d } from '../public/js/shared/maps/c9d-lane.js';
import { stoneSteps9d, spicaLeft9d, spicaAway9d } from '../public/js/shared/world/c9d-steps.js';
import { act3ClearObjective, PART3_ACT4_OPEN } from '../public/js/shared/data/story-c9.js';
import { C9D_OBJ } from '../public/js/shared/data/story-c9d.js';
import { C9D_TREASURE } from '../public/js/shared/data/items-c9d.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { itemCount, fullHeal } from '../public/js/shared/stats.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
function gear(chars, lv = 104) {
  const kit = ch9Party('mu', lv);
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
async function family(seed, upto = 'c9_act3') {
  const world = fixedWorld(seed);
  const ids = await famIds(world, ['パパ', 'ミク', 'ユイ']);
  const { bot, c } = await addPlayer(world, 'ソラ', upto);
  c.objective = act3ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam]);
  for (const id of ids) assert.ok(companionJoin(world, bot.s, `fam:${id}`).ok);
  return { world, bot, c, fam };
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
async function useStone(bot, id, label, opts) {
  const map = MAPS[bot.s.map];
  const s = map.c9dStones.find((q) => q.id === id);
  const f = stoneFront9d(s);
  await go(bot, Math.floor(f.x), Math.floor(f.y), opts);
  const st = stoneSteps9d(bot.world, bot.s, id).find((x) => x[0] === 'choice');
  assert.ok(st, `${id}: えらぶ 物が ある`);
  const idx = st[2].findIndex((l) => l.includes(label));
  assert.ok(idx >= 0, `${id}: 「${label}」（${st[2].join('/')}）`);
  bot.choice = idx;
  bot.send({ t: 'interact', kind: 'tile', x: s.x, y: s.y });
  await play(bot, opts);
  bot.choice = 0;
}
async function openChestNear(bot, ch, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const side = D4.map(([dx, dy]) => [ch.x + dx, ch.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), x, y, has));
  assert.ok(side, `${map.id}: 宝箱 ${ch.id} の となりへ`);
  await go(bot, side[0], side[1], opts);
  await examine(bot, ch.x, ch.y, opts);
}
// 魔物を 1ぴき その 人に ぶつけて 本当に 戦う（オート）。戦いの スピカ（b.c9sp）を かえす
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
  const ctx2 = [...world.battles.values()].find((c2) => c2.sessions?.includes?.(bot.s) || true);
  const sp = ctx2?.battle?.c9sp || null;
  await play(bot, { ...opts, real: () => 'auto' });
  bot.s.repelUntil = 1e15;
  return { sp, table: sym.table };
}
// 魔人に 勝つまで（はじめの 1回は mode0。そのあと 知って いる 動き。負けると ヒント → やり直しの マス → もう一度）
async function muUntilWin(bot, { mode0 = 'auto', max = 6, fought = [], bots = [] } = {}) {
  const res = [];
  const G = C9D_POS.c9d_grave;
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    for (const b of [bot, ...bots]) fullHeal(b.s.char);
    const o = { fought, bots, real: (fid) => (fid === C9D_BATTLE.mu ? mode : fid ? 'know' : 'auto') };
    if (bot.s.map !== C9D_MAP.grave) await place(bot, C9D_MAP.grave, G.mu.x, G.muScene.y + G.muScene.h + 1, 'up', o);
    const M = G.muScene;
    if (Math.floor(bot.s.y) >= M.y && Math.floor(bot.s.y) < M.y + M.h) await go(bot, Math.floor(bot.s.x), M.y + M.h, o);
    await go(bot, G.mu.x, M.y + M.h - 1, o);
    const won = !!bot.s.char.flags[C9D.mu];
    res.push(won ? 'win' : 'lose');
    if (won) return res;
  }
  return res;
}

test('通し（本当の 戦い）: 黄の 台 → ひびきの とびら → ふたごの道（ふつうの 戦い・スピカと はなれた 戦い）→ はかば → 魔人（負ければ ヒント → もう一度）→ 大きな くぼみ → くぼ地（c9_act4）。宝箱 8こ', { timeout: 1500000 }, async () => {
  assert.equal(PART3_ACT4_OPEN, true, '幕は 開いた');
  const { world, bot, c } = await family(9391);
  assert.equal(c.objective, C9D_OBJ.start);
  const fought = [];
  const opts = { fought, real: (id) => (id ? 'know' : 'auto') };
  // 1 くぼ地の 黄の 台
  await place(bot, 'c9a_crater', 12, 9, 'up', opts);
  await stepOn(bot, 12, 8, opts);
  await stepOn(bot, 12, 7, opts);
  assert.ok(c.flags[C9D.song1]);
  assert.equal(c.objective, C9D_OBJ.song1);
  // 2 岸の とびら
  await place(bot, 'c9c_river', 86, 7, 'up', opts);
  await go(bot, 86, 5, opts);
  await useStone(bot, 'sh_l', 'ここで歌ってもらう', opts);
  await useStone(bot, 'sh_r', '星の音さを鳴らす', opts);
  assert.ok(c.flags[C9D.door]);
  await go(bot, SHORE_DOOR9D.x, SHORE_DOOR9D.y, opts);
  assert.equal(bot.s.map, C9D_MAP.g1);
  // 3 1階: スピカと いっしょの ふつうの 戦い（スピカが 出る）
  await go(bot, 15, 35, opts);
  await go(bot, 4, 24, opts);
  const f1 = await fieldFight(bot, opts);
  assert.ok(['t9d_lane'].includes(f1.table), `1階の 表 ${f1.table}`);
  assert.ok(f1.sp, 'スピカと いっしょの 戦いには スピカが 出る');
  // スピカを 左の 石に のこして 右の 道へ … はなれた 戦い（スピカは 出ない）
  await useStone(bot, 'g1a', 'ここで歌ってもらう', opts);
  await go(bot, 26, 27, opts);
  assert.ok(spicaAway9d(world, bot.s));
  const f2 = await fieldFight(bot, opts);
  assert.ok(!f2.sp, 'スピカと はなれた 戦いには スピカ（ほのかな光・てらす・星のうた）が 出ない');
  assert.ok(spicaLeft9d(world, bot.s), '戦いの あとも スピカは 石で 歌って いる');
  await useStone(bot, 'g1b', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo2);
  await useStone(bot, 'g1c', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g1d', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo3);
  for (const ch of MAPS.c9d_g1.chests) await openChestNear(bot, ch, opts);
  const S1 = C9D_POS.c9d_g1.stairs;
  await go(bot, S1.x, S1.y, opts);
  assert.equal(bot.s.map, C9D_MAP.g2);
  // 4 2階
  await go(bot, 15, 29, opts);
  assert.ok(c.flags[C9D.g2]);
  await useStone(bot, 'g2a', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g2b', '星の音さを鳴らす', opts);
  await useStone(bot, 'g2c', 'ここで歌ってもらう', opts);
  await useStone(bot, 'g2d', '星の音さを鳴らす', opts);
  await useStone(bot, 'g2e', '星の音さを鳴らす', opts);
  assert.ok(c.flags.c9_echo4 && c.flags.c9_echo5, 'こだま');
  for (const ch of MAPS.c9d_g2.chests) await openChestNear(bot, ch, opts);
  const X = C9D_POS.c9d_g2.exit;
  await go(bot, X.x, X.y, opts);
  assert.equal(bot.s.map, C9D_MAP.grave);
  // 5 はかば（宝箱 2つ）
  await go(bot, 15, 20, opts);
  assert.ok(c.flags[C9D.grave]);
  for (const ch of MAPS.c9d_grave.chests) await openChestNear(bot, ch, opts);
  // 6・7 魔人（はじめは 完全オート）
  const v0 = bot.msgs.length;
  const r = await muUntilWin(bot, { mode0: 'auto', fought });
  console.log('# mu tries', r.join(','));
  assert.equal(r.at(-1), 'win', `魔人に 勝つ（${r.join(',')}）`);
  if (r[0] === 'lose') assert.ok(said(bot, BOSS_HINTS.c9d_mu[0].slice(0, 8), v0), 'ノクトの ヒント');
  assert.ok(said(bot, 'みんな、おきてたの'));
  assert.equal(c.objective, C9D_OBJ.mu);
  // 8・9 大きな くぼみ → くぼ地
  await go(bot, 15, 7, opts);
  assert.ok(c.flags[C9D.hollow] && c.flags[C9D.act4]);
  assert.equal(bot.s.map, 'c9a_crater');
  assert.equal(c.objective, C9D_OBJ.act4);
  assert.ok(storyPlace(c).cleared);
  // 宝箱 8こ・中みは B班の 表
  assert.deepEqual(C9D_CHEST_IDS.filter((id) => c.chests[id]), [...C9D_CHEST_IDS], '宝箱 8こ');
  for (const id of C9D_CHEST_IDS) {
    const [it] = C9D_TREASURE[id];
    assert.ok(itemCount(c, it) >= 1 || Object.values(c.equip || {}).includes(it), `${id} → ${it}`);
  }
  assert.ok(fought.includes(C9D_BATTLE.mu));
});

test('家族 2人: 左右の 石を 2人で 鳴らす・いっしょに 魔人と 戦って 勝つ', { timeout: 900000 }, async () => {
  const world = fixedWorld(9392);
  const ids = await famIds(world, ['パパ', 'ユイ']);
  const A = await addPlayer(world, 'ソラ', 'c9_door');
  const B = await addPlayer(world, 'ミク', 'c9_door');
  const fam = ids.map((id) => world.data.characters[id]);
  gear([A.c, fam[0], fam[1], B.c]);
  for (const id of ids) assert.ok(companionJoin(world, A.bot.s, `fam:${id}`).ok);
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  B.bot.send({ t: 'party', action: 'accept' });
  await play(A.bot, { bots: [B.bot] });
  const o = (other) => ({ bots: [other], real: (id) => (id ? 'know' : 'auto') });
  await place(A.bot, C9D_MAP.g1, 4, 23, 'up', o(B.bot));
  await place(B.bot, C9D_MAP.g1, 26, 23, 'up', o(A.bot));
  await useStone(A.bot, 'g1a', '星の音さを鳴らす', o(B.bot));
  await useStone(B.bot, 'g1b', '星の音さを鳴らす', o(A.bot));
  assert.ok(A.c.flags.c9_echo2, '2人で 橋を かけた（リーダーの 世界）');
  // はかばで いっしょに 魔人
  for (const f of ['c9_g2', 'c9_grave']) A.c.flags[f] = true;
  world.placeSession(B.bot.s, C9D_MAP.grave, 14.5, 18.5, 'up', true);
  const r = await muUntilWin(A.bot, { mode0: 'know', bots: [B.bot] });
  console.log('# mu 2 people', r.join(','));
  assert.ok(A.c.flags[C9D.mu], `ふたりで 魔人に 勝つ（${r.join(',')}）`);
  assert.ok(B.bot.battles.length >= 1, 'ミクも 戦った');
});

test('回線が 切れた 時: スピカを 石に のこした まま 切れる → つなぎなおすと スピカは そば → 続きから 橋を かけられる', { timeout: 300000 }, async () => {
  const world = fixedWorld(9393, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c9_door');
  await place(A.bot, C9D_MAP.g1, 4, 23, 'up', {});
  await useStone(A.bot, 'g1a', 'ここで歌ってもらう', {});
  assert.ok(spicaLeft9d(world, A.bot.s));
  const where = [A.bot.s.map, Math.floor(A.bot.s.x), Math.floor(A.bot.s.y)];
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 30);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  assert.ok(A2.resumed);
  assert.deepEqual([A2.s.map, Math.floor(A2.s.x), Math.floor(A2.s.y)], where, '同じ 場所');
  assert.ok(!spicaLeft9d(world, A2.s), 'スピカは リーダーの そばに もどって いる');
  assert.ok(world.followerLooks(A2.s).some((f) => f.spica));
  await useStone(A2, 'g1a', 'ここで歌ってもらう', {});
  await useStone(A2, 'g1b', '星の音さを鳴らす', {});
  assert.ok(A.c.flags.c9_echo2, '続きから 橋を かけた');
});
