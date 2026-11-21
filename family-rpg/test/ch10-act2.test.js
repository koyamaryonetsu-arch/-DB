// 第3部 第2章 第2幕「青と白」の 通し（第95回: A班〈世界と 物語〉と B班〈戦いと 品〉を つないだ あと）※ ネタバレ注意
// ・第1幕を クリアした セーブ（c10_act1）から c10_act2 まで、決まった 戦いを 本当に 戦う
//   （家族 4人。tools/sim-ch10.mjs の 装備 CH9_KIT.gecko・owl。中ボスは しくみを 知って いる 人の 動き … know）
// ・青 → 白 と 白 → 青 の 両方。中ボスには はじめは 完全オートで いどむ（負ける ことを 見る → ノクトの ヒント → もう一度）→ 知って いる 動きで 勝つまで
//   決まった 戦いは「すぐ 勝たせる」に しない（real で 本当に 戦う。中ボスの 前を 歩いて 通りぬけて しまわない ことも 見る）
// ・ふつうの 戦い（水鏡の うら）・見はりの 戦い（わざと 見つかる）も 本当に 戦う（オート）
// ・宝箱 14こ。くぼ地の 武具屋に 品が ふえる
// ・ひとり（仲間なし）・家族 2人が 青と 白に 分かれて 同時に・家族 2人が 同じ 階で 水を かえ合う・回線が 切れた 時
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPS, canStand, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { C10B, C10B_BLUE, C10B_WHITE, C10B_BONUS, C10B_MAP, C10B_BATTLE, C10B_CHEST_ALL, C10B_OWL_TURN_STEPS } from '../public/js/shared/maps/c10b-flags.js';
import { BLUE1_POS, BLUE2_POS, WHITE1_POS, WHITE2_POS, WHITE3_POS, LAKE_STAIRS10B } from '../public/js/shared/maps/c10b-rows.js';
import { waterOf10b, caughtOf10b, owlView10b, owlDir10b, watchedCells10b, hidden10b } from '../public/js/shared/world/c10b-steps.js';
import { act1ClearObjective, PART3_C10B_OPEN } from '../public/js/shared/data/story-c10.js';
import { C10B_OBJ } from '../public/js/shared/data/story-c10b.js';
import { BOSS_HINTS } from '../public/js/shared/data/boss-hints.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { C10B_SHOP_ADD } from '../public/js/shared/data/items-c10b.js';
import { companionJoin } from '../public/js/shared/world/party.js';
import { storyPlace } from '../public/js/shared/world/shiori.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { mapState } from '../public/js/shared/world/monsters.js';
import { fullHeal } from '../public/js/shared/stats.js';
import { effectiveTile } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { ch9Party } from '../tools/sim-ch9.mjs';
import '../tools/sim-ch10.mjs';
import { Bot, tickN } from './helpers.js';
import { fixedWorld, said, play, place, stepOn, examine, talkTo, D4, addPlayer } from './c9a-play.js';

const COPY = ['level', 'exp', 'job', 'jobs', 'jobSys', 'skillUse', 'hirameki', 'equip', 'hp', 'mp', 'status'];
const ACT1 = ['c10_note_re', 'c10_note_fa', 'c10_r_stairs', 'c10_r_boss', 'c10_g_root', 'c10_g_boss', 'c9_river'];
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
  const { bot, c } = await addPlayer(world, name, 'c10_act1', ACT1);
  c.keyItems = [...new Set([...(c.keyItems || []), 'note_mi', 'note_re', 'note_fa'])];
  c.objective = act1ClearObjective();
  const fam = ids.map((id) => world.data.characters[id]);
  gear([c, ...fam], 'gecko', 111);
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
    await stepOn(bot, x, y, opts);
    if (bot.s.map !== map.id) return;
  }
}
async function goExamine(bot, p, choice, opts) {
  const map = MAPS[bot.s.map];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const side = D4.map(([dx, dy]) => [p.x + dx, p.y + dy])
    .find(([x, y]) => canStand(map, x + 0.5, y + 0.5, has) && !map.warpAt.has(y * map.w + x) && ((x === sx && y === sy) || pathFor(map, sx, sy, x, y, has)));
  assert.ok(side, `${map.id}: ${p.x},${p.y} の となりへ`);
  if (side[0] !== sx || side[1] !== sy) await go(bot, side[0], side[1], opts);
  bot.choice = choice;
  await examine(bot, p.x, p.y, opts);
  bot.choice = 0;
}
async function openChests(bot, mapId, opts) {
  for (const ch of MAPS[mapId].chests) {
    if (bot.s.char.chests[ch.id] || bot.s.map !== mapId) continue;
    const has = bot.world.hasFlagFn(bot.s);
    const map = MAPS[mapId];
    const ok = D4.some(([dx, dy]) => canStand(map, ch.x + dx + 0.5, ch.y + dy + 0.5, has) && pathFor(map, Math.floor(bot.s.x), Math.floor(bot.s.y), ch.x + dx, ch.y + dy, has));
    if (!ok) continue;
    await goExamine(bot, ch, 0, opts);
  }
}
// 鐘（L … 0 下・1 中・2 上）
async function ring(bot, L, opts) {
  const map = MAPS[C10B_MAP.blue1];
  const has = bot.world.hasFlagFn(bot.s);
  const sx = Math.floor(bot.s.x), sy = Math.floor(bot.s.y);
  const bell = BLUE1_POS.bells.find((b) => D4.some(([dx, dy]) => (b.x + dx === sx && b.y + dy === sy) || (!isBlocked(map, b.x + dx, b.y + dy, has) && pathFor(map, sx, sy, b.x + dx, b.y + dy, has))));
  assert.ok(bell, 'とどく 鐘');
  await goExamine(bot, bell, L, opts);
  assert.equal(waterOf10b(bot.world, bot.s), L, `水：${L}`);
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
// 氷の 下で 見はりを よけて 歩く（test/ch10-act2-a.test.js と 同じ さがし方）
function sneakPath(mapId, start, goal, n = 0, st0 = 0, has = () => false) {
  const map = MAPS[mapId];
  const CY = C10B_OWL_TURN_STEPS * 4;
  const blocked = (x, y) => x < 0 || y < 0 || x >= map.w || y >= map.h || isBlocked(map, x, y, has) || map.chestAt.has(y * map.w + x)
    || map.npcs.some((p) => p.solid && Math.floor(p.x) === x && Math.floor(p.y) === y);
  const seenAt = (x, y, st) => !hidden10b(effectiveTile(map, x, y, has)) && watchedCells10b(map, st, n, false, has).has(`${x},${y}`);
  const k0 = `${start.x},${start.y},${st0 % CY}`;
  const prev = new Map([[k0, null]]);
  const q = [[start.x, start.y, st0]];
  for (let h = 0; h < q.length; h++) {
    const [x, y, st] = q[h];
    const key = `${x},${y},${st % CY}`;
    if (goal(x, y)) {
      const out = [];
      for (let k = key; prev.get(k); k = prev.get(k).from) out.unshift(...prev.get(k).cells);
      return out;
    }
    for (const [dx, dy] of D4) {
      let cx = x + dx, cy = y + dy;
      if (blocked(cx, cy)) continue;
      const isWarp = map.warpAt.has(cy * map.w + cx);
      if (isWarp && !goal(cx, cy)) continue;
      if (effectiveTile(map, cx, cy, has) === T.C10B_THIN) continue;
      const cells = [[cx, cy]];
      let s2 = st + 1, ok = true;
      while (!isWarp && effectiveTile(map, cx, cy, has) === T.C10B_SLIDE && !blocked(cx + dx, cy + dy)) {
        cx += dx; cy += dy; s2 += 1; cells.push([cx, cy]);
        if (effectiveTile(map, cx, cy, has) === T.C10B_THIN) { ok = false; break; }
      }
      if (!ok || (!isWarp && map.warpAt.has(cy * map.w + cx) && !goal(cx, cy)) || (!isWarp && seenAt(cx, cy, s2))) continue;
      const k = `${cx},${cy},${s2 % CY}`;
      if (prev.has(k)) continue;
      prev.set(k, { from: key, cells });
      q.push([cx, cy, s2]);
    }
  }
  return null;
}
const at = (p) => (x, y) => x === p.x && y === p.y;
const adj = (p) => (x, y) => Math.abs(x - p.x) + Math.abs(y - p.y) === 1;
async function sneakTo(bot, goal, opts) {
  const n0 = caughtOf10b(bot.world, bot.s);
  const sn = bot.s.c10bSn && bot.s.c10bSn.map === bot.s.map ? bot.s.c10bSn : null;
  const path = sneakPath(bot.s.map, { x: Math.floor(bot.s.x), y: Math.floor(bot.s.y) }, goal, n0, sn?.steps || 0, bot.world.hasFlagFn(bot.s));
  assert.ok(path, `${bot.s.map}: 見つからずに 行ける`);
  const m0 = bot.s.map;
  for (const [x, y] of path) {
    await stepOn(bot, x, y, opts);
    assert.equal(caughtOf10b(bot.world, bot.s, m0), n0, `${m0} ${x},${y} で 見つからない`);
    if (bot.s.map !== m0) return;
  }
}
// わざと 見つかって 見はりの 戦い（本当に 戦う）→ 部屋の 入口
async function getCaught(bot, opts) {
  const map = MAPS[bot.s.map];
  const st = bot.s.c10bSn?.steps || 0;
  const n = caughtOf10b(bot.world, bot.s);
  const cells = [...watchedCells10b(map, st + 1, n, false, () => false)].map((k) => k.split(',').map(Number)).filter(([x, y]) => !hidden10b(map.tiles[y * map.w + x]));
  assert.ok(cells.length);
  const [x, y] = cells[0];
  bot.s.c10bSn = { map: map.id, steps: st, noise: 0, last: [x, y + 1] };
  fullHeal(bot.s.char);
  for (const f of bot.fam || []) fullHeal(f);
  await stepOn(bot, x, y, opts);
  assert.equal(caughtOf10b(bot.world, bot.s), n + 1, '見つかった');
}
// 中ボスに 勝つまで（はじめの 1回は mode0。その あと 知って いる 動き。負けると ヒント → もう一度）
async function bossUntilWin(bot, color, { mode0 = 'auto', max = 6, fought = [], bots = [] } = {}) {
  const res = [];
  const blue = color === 'blue';
  const battle = blue ? C10B_BATTLE.blue : C10B_BATTLE.white;
  const win = blue ? C10B_BLUE.boss : C10B_WHITE.boss;
  const party = [bot.s.char, ...(bot.fam || [])];
  gear(party, blue ? 'gecko' : 'owl', blue ? 111 : 113);
  for (let k = 0; k < max; k++) {
    const mode = k === 0 ? mode0 : 'know';
    for (const b of [bot, ...bots]) fullHeal(b.s.char);
    for (const ch of party) fullHeal(ch);
    const v0 = bot.msgs.length;
    const o = { fought, bots, real: (fid) => (fid === battle ? mode : fid ? 'know' : 'auto') };
    if (blue) {
      await place(bot, C10B_MAP.blue2, 13, 4, 'down', o);
      await stepOn(bot, 13, 5, o);
      await stepOn(bot, 13, 6, o);
    } else {
      await place(bot, C10B_MAP.white3, 13, 14, 'up', o);
      await stepOn(bot, 13, 13, o);
      await stepOn(bot, 13, 12, o);
    }
    const won = !!bot.s.char.flags[win];
    res.push(won ? 'win' : 'lose');
    if (!won) assert.ok(said(bot, BOSS_HINTS[battle][0].slice(0, 6), v0) || k > 0, 'ノクトの ヒント');
    if (won) return res;
  }
  return res;
}
// 青の 道
async function blueRoad(bot, opts, log, { boss = true } = {}) {
  const c = bot.s.char;
  await talkTo(bot, 'c9c_river', 'c9c_post2', 2, opts);
  assert.equal(bot.s.map, C10B_MAP.blue1, '青い流れ');
  assert.equal(waterOf10b(bot.world, bot.s), 1);
  log.push(await fieldFight(bot, opts));
  // 中: 流れで 東の ほら穴
  await go(bot, 38, 27, opts);
  await stepOn(bot, 39, 27, opts);
  await go(bot, 42, 27, opts);
  await openChests(bot, C10B_MAP.blue1, opts);
  await go(bot, 42, 24, opts);
  await stepOn(bot, 41, 24, opts);
  await go(bot, 38, 24, opts);
  // 下: 湖の 底の かぎの 石
  await ring(bot, 0, opts);
  await goExamine(bot, BLUE1_POS.key, 0, opts);
  assert.ok(c.flags[C10B_BLUE.key], 'かぎの 石');
  await openChests(bot, C10B_MAP.blue1, opts);
  // 上: 高い 岸の 宝箱・とびら
  await ring(bot, 2, opts);
  await openChests(bot, C10B_MAP.blue1, opts);
  await go(bot, BLUE1_POS.down.x, BLUE1_POS.down.y, opts);
  assert.equal(bot.s.map, C10B_MAP.blue2);
  assert.ok(!c.flags[C10B_BLUE.boss], 'まだ 砂の しんしと 戦って いない');
  if (!boss) return;
  const r = await bossUntilWin(bot, 'blue', opts);
  log.push(`gecko:${r.join(',')}`);
  assert.equal(r[0], 'lose', '完全オートでは 砂の しんしに 勝てない');
  assert.ok(c.flags[C10B_BLUE.boss], `砂の しんしに 勝つ（${r.join(',')}）`);
  assert.ok(c.flags[C10B_BLUE.note] && (c.keyItems || []).includes('note_so'));
  assert.equal(bot.s.map, 'temple_hall', 'わき水から 水鏡の 広間へ');
  await place(bot, C10B_MAP.blue2, 13, 10, 'up', opts);
  await openChests(bot, C10B_MAP.blue2, opts);
}
// 白の 道
async function whiteRoad(bot, opts, log, { boss = true } = {}) {
  const c = bot.s.char;
  bot.world.c10bNight(bot.s);
  await place(bot, 'north', 27, 60, 'left', opts);
  await stepOn(bot, 26, 60, opts);
  await stepOn(bot, 25, 60, opts);
  await stepOn(bot, 25, 61, opts);
  await stepOn(bot, LAKE_STAIRS10B.x, LAKE_STAIRS10B.y, opts);
  assert.equal(bot.s.map, C10B_MAP.white1, '夜の 湖から 氷の 下へ');
  assert.ok(c.flags[C10B_WHITE.in]);
  // 見はりに わざと 1回 見つかる（見はりの 戦い・部屋の 入口）
  await getCaught(bot, opts);
  log.push('watch1');
  await sneakTo(bot, adj(MAPS[C10B_MAP.white1].chests[0]), opts);
  await openChests(bot, C10B_MAP.white1, opts);
  const R = MAPS[C10B_MAP.white1].c10bRooms.find((r) => r.y0 <= Math.floor(bot.s.y) && Math.floor(bot.s.y) <= r.y1);
  await place(bot, C10B_MAP.white1, R.ent.x, R.ent.y, 'up', opts);
  bot.s.c10bSn = null;
  await sneakTo(bot, at(WHITE1_POS.down), opts);
  assert.equal(bot.s.map, C10B_MAP.white2);
  await sneakTo(bot, at(WHITE2_POS.down), opts);
  assert.equal(bot.s.map, C10B_MAP.white3, '月の 間');
  if (!boss) return;
  const r = await bossUntilWin(bot, 'white', opts);
  log.push(`owl:${r.join(',')}`);
  assert.equal(r[0], 'lose', '完全オートでは かいとうに 勝てない');
  assert.ok(c.flags[C10B_WHITE.boss], `かいとうに 勝つ（${r.join(',')}）`);
  assert.ok(c.flags[C10B_WHITE.note] && (c.keyItems || []).includes('note_la'));
  await openChests(bot, C10B_MAP.white3, opts);
}
async function bonusAndEnd(bot, opts) {
  const c = bot.s.char;
  await place(bot, C10B_MAP.blue1, BLUE1_POS.freeze.x, BLUE1_POS.freeze.y + 1, 'up', opts);
  bot.choice = 0;
  await examine(bot, BLUE1_POS.freeze.x, BLUE1_POS.freeze.y, opts);
  assert.ok(c.flags[C10B_BONUS.blue]);
  await openChests(bot, C10B_MAP.blue1, opts);
  for (const id of [C10B_MAP.white1, C10B_MAP.white2]) {
    for (const ch of MAPS[id].chests) {
      if (c.chests[ch.id]) continue;
      await place(bot, id, MAPS[id].c10bRooms[0].ent.x, MAPS[id].c10bRooms[0].ent.y, 'up', opts);
      bot.s.c10bSn = null;
      if (ch.id === 'c10b_wbonus') {
        await sneakTo(bot, adj(WHITE1_POS.melt), opts);
        await examine(bot, WHITE1_POS.melt.x, WHITE1_POS.melt.y, opts);
        assert.ok(c.flags[C10B_BONUS.white]);
      }
      await sneakTo(bot, adj(ch), opts);
      await examine(bot, ch.x, ch.y, opts);
    }
  }
  for (const id of C10B_CHEST_ALL) assert.ok(c.chests[id], `宝箱 ${id}`);
  await talkTo(bot, 'c9a_crater', 'c9c_ped5', 0, opts);
  await talkTo(bot, 'c9a_crater', 'c9c_ped6', 0, opts);
  assert.ok(c.flags[C10B.act2], '幕の クリア');
  assert.equal(c.objective, C10B_OBJ.act2);
  assert.equal(storyPlace(c).label, '第3部 第2章 第2幕');
  assert.ok(storyPlace(c).cleared);
  assert.ok(C10B_SHOP_ADD.every((id) => SHOPS.c10b_crater.items.includes(id)), 'くぼ地の 武具屋に 品が ふえた');
}
function nightFor(world) {
  world.c10bNight = (s) => {
    const D = 20 * 60 * 1000;
    const cur = ((world.now() % D) + D) % D / D;
    s.char.timeShift = Math.round(((((0.8 - cur) % 1) + 1) % 1) * D);
  };
}

test('幕が 開いて いる（PART3_C10B_OPEN）: 第1幕 クリアの 目標は 第2幕の はじまり', () => {
  assert.equal(PART3_C10B_OPEN, true);
  assert.equal(act1ClearObjective(), C10B_OBJ.start);
});

for (const order of ['blue', 'white']) {
  test(`通し（本当の 戦い・${order === 'blue' ? '青 → 白' : '白 → 青'}）: くぼ地 → ${order === 'blue' ? '青 → 白' : '白 → 青'} → おまけ → 台（c10_act2）。宝箱 14こ`, { timeout: 1500000 }, async () => {
    const world = fixedWorld(order === 'blue' ? 9521 : 9522);
    nightFor(world);
    const { bot, c } = await family(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
    const fought = [];
    const log = [];
    const opts = { fought };
    await place(bot, 'c9a_crater', 12, 9, 'up', opts);
    await stepOn(bot, 12, 8, opts);
    await stepOn(bot, 12, 7, opts);
    assert.ok(c.flags[C10B.start]);
    if (order === 'blue') { await blueRoad(bot, opts, log); await whiteRoad(bot, opts, log); } else { await whiteRoad(bot, opts, log); await blueRoad(bot, opts, log); }
    console.log(`# ${order}`, log.join(' '));
    assert.ok(fought.includes(C10B_BATTLE.blue) && fought.includes(C10B_BATTLE.white) && fought.includes(C10B_BATTLE.watch[0]));
    await bonusAndEnd(bot, opts);
  });
}

test('ひとり（仲間なし）: 青と 白の 中ボスに 知って いる 動きで いどむ（何度でも やり直せる）・こっそりは ひとりで とける', { timeout: 1500000 }, async () => {
  const world = fixedWorld(9523);
  nightFor(world);
  const { bot, c } = await addPlayer(world, 'ソラ', 'c10_act1', [...ACT1, 'c10b_start']);
  gear([c], 'gecko', 111);
  c.keyItems = [...new Set([...(c.keyItems || []), 'note_mi', 'note_re', 'note_fa'])];
  const fought = [];
  const opts = { fought };
  const log = [];
  await blueRoad(bot, opts, log, { boss: false });
  await whiteRoad(bot, opts, log, { boss: false });
  for (const color of ['blue', 'white']) {
    const r = await bossUntilWin(bot, color, { ...opts, mode0: 'know', max: 10 });
    log.push(`${color}:${r.join(',')}`);
    assert.ok(c.flags[color === 'blue' ? C10B_BLUE.boss : C10B_WHITE.boss], `ひとりでも 勝てる（${r.join(',')}）`);
  }
  console.log('# solo', log.join(' '));
});

test('家族 2人が 青と 白に 分かれて 同時に（それぞれ 自分の 物語・本当の 戦い）', { timeout: 1500000 }, async () => {
  const world = fixedWorld(9524);
  nightFor(world);
  const A = await family(world, 'ソラ', ['パパ', 'ミク', 'ユイ']);
  const B = await family(world, 'ナギ', ['ママ', 'リン', 'ケン']);
  for (const P of [A, B]) P.c.flags.c10b_start = true;
  const logA = [], logB = [];
  const oA = { bots: [B.bot] }, oB = { bots: [A.bot] };
  await blueRoad(A.bot, oA, logA);
  await whiteRoad(B.bot, oB, logB);
  console.log('# split', logA.join(' '), '/', logB.join(' '));
  assert.ok(A.c.flags.c10_note_so && !A.c.flags.c10b_white_in, 'ソラは 青だけ');
  assert.ok(B.c.flags.c10_note_la && !B.c.flags.c10b_blue_in, 'ナギは 白だけ');
  assert.equal(A.c.objective, C10B_OBJ.white0);
  assert.equal(B.c.objective, C10B_OBJ.blue0);
});

test('家族 2人が 同じ 階で 水を かえ合う（パーティーで 同じ 水）・回線が 切れた 時（水鏡の うら → 階の 入口・水は 中／氷の 下 → 部屋の 入口）', { timeout: 300000 }, async () => {
  const world = fixedWorld(9525, { offline: false, checkPassword: () => true });
  const A = await addPlayer(world, 'ソラ', 'c10_act1', [...ACT1, 'c10b_start', 'c10b_blue_in', 'c10b_white_in']);
  const B = await addPlayer(world, 'ミナ', 'c10_act1', [...ACT1, 'c10b_start', 'c10b_blue_in'], 'mage');
  for (const P of [A, B]) P.c.keyItems = [...new Set([...(P.c.keyItems || []), 'note_mi', 'note_re', 'note_fa'])];
  A.bot.send({ t: 'party', action: 'invite', sid: B.bot.s.id });
  await tickN(world, 2);
  B.bot.send({ t: 'party', action: 'accept', from: A.bot.s.id });
  await tickN(world, 2);
  await play(A.bot, { bots: [B.bot] });
  const E = BLUE1_POS.entry;
  await place(A.bot, C10B_MAP.blue1, E.x, E.y, 'up', { bots: [B.bot] });
  await place(B.bot, C10B_MAP.blue1, 26, 34, 'up', { bots: [A.bot] });
  // ソラが 上げる → ミナにも 上 / ミナが 下げる → ソラにも 下
  await ring(A.bot, 2, { bots: [B.bot] });
  assert.equal(waterOf10b(world, B.bot.s), 2, 'ミナにも 上');
  await ring(B.bot, 0, { bots: [A.bot] });
  assert.equal(waterOf10b(world, A.bot.s), 0, 'ソラにも 下');
  // 回線が 切れた（水鏡の うらの おく）→ もどると 階の 入口
  await place(A.bot, C10B_MAP.blue1, 26, 23, 'up', { bots: [B.bot] });
  world.disconnect(A.bot.s, A.bot.conn);
  await tickN(world, 30);
  const A2 = new Bot(world, 'ソラ');
  await A2.login();
  A2.send({ t: 'play', id: A.c.id });
  await A2.settle();
  await tickN(world, 2);
  assert.equal(A2.s.map, C10B_MAP.blue1);
  assert.deepEqual([Math.floor(A2.s.x), Math.floor(A2.s.y)], [E.x, E.y], '階の 入口');
  assert.equal(waterOf10b(world, A2.s), waterOf10b(world, B.bot.s), '水は 家族と 同じ まま（ミナは まだ 階に いる）');
  // パーティーの だれも 階に いなく なると 水は わすれる（次は 中から）
  await place(A2, 'c9a_crater', 12, 9, 'up', { bots: [B.bot] });
  await place(B.bot, 'c9a_crater', 13, 9, 'up', { bots: [A2] });
  await tickN(world, 3);
  await place(A2, C10B_MAP.blue1, E.x, E.y, 'up', { bots: [B.bot] });
  assert.equal(waterOf10b(world, A2.s), 1, '水は 中から');
  // 氷の 下の 部屋の まん中で 切れる → その 部屋の 入口（パーティーを はなれて ひとりで）
  A2.send({ t: 'party', action: 'leave' });
  await tickN(world, 3);
  const map = MAPS[C10B_MAP.white1];
  const R = map.c10bRooms[1];
  await place(A2, C10B_MAP.white1, 20, 16, 'up', {});
  world.disconnect(A2.s, A2.conn);
  await tickN(world, 30);
  const A3 = new Bot(world, 'ソラ');
  await A3.login();
  A3.send({ t: 'play', id: A.c.id });
  await A3.settle();
  assert.equal(A3.s.map, C10B_MAP.white1);
  assert.deepEqual([Math.floor(A3.s.x), Math.floor(A3.s.y)], [R.ent.x, R.ent.y], '部屋の 入口');
  assert.ok(owlView10b(map, map.c10bOwls[0], owlDir10b(map.c10bOwls[0], 0)).length > 0);
});
