// 第38回 A（A2）: 大地の神殿（8階）と 影の城（12階）の 階を ひろげた ※ ネタバレ注意（第5章の ダンジョン）
// ・歩ける 広さが もとの 1.5〜2倍くらい（わき道・行き止まりの 宝部屋・見晴らしの 広間・小さな しかけの 部屋）
// ・ふえた しかけの 部屋（水がめの 根・守り手と あな・風の 流れ・炎の 柱・水の 高さ・流れる ゆか）の 宝箱は、しかけを とくと 行ける
//   （今の しかけの 答えは かわらない。どの じょうたいからも 上下に 行ける ことは ch5-step67・ch5-step8 の テスト）
// ・古い セーブ: 広げた 階の 中に いた 人・いのりの場所は、その 階の 着く ところへ（maps の layoutVer・world/world.js の layoutFix）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld, posOf, layoutFix } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import {
  EARTH_FLOORS, EARTH_POS, EARTH_GOLEMS, EARTH_LAYOUT_VER, JAR, PIT_FLAG, PIT4_FLAG, eo, earthArrive, earthMapId, golemState,
} from '../public/js/shared/maps/earth.js';
import { CASTLE_FLOORS, CASTLE_LAYOUT_VER, STATUE_RAYS, WATER9, co, castleArrive, castleMapId } from '../public/js/shared/maps/castle.js';
import { EARTH_W, EARTH_H } from '../public/js/shared/maps/earth-rows.js';
import { CASTLE_W, CASTLE_H } from '../public/js/shared/maps/castle-rows.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { Bot } from './helpers.js';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// 歩いて 行ける マス（ワープの マスには 入れるが その 先へは 行かない）
function reach(id, start, flags) {
  const m = MAPS[id];
  const has = (f) => flags.includes(f);
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k) || isBlocked(m, nx, ny, has)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => D4.some(([dx, dy]) => r(p.x + dx, p.y + dy));
const nearStop = (fr, p) => D4.some(([dx, dy]) => fr.stops.has(`${p.x + dx},${p.y + dy}`));
const cell = (p) => [p.x, p.y];
const chest = (map, id) => { const c = MAPS[map].chests.find((ch) => ch.id === id); assert.ok(c, `${map} ${id}`); return c; };
// 歩ける 広さ（どれかの じょうたいで 歩ける マス）
function area(m) {
  let n = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (!isBlocked(m, x, y, () => true) || !isBlocked(m, x, y, () => false)) n++;
  return n;
}
// ひろげる 前の 歩ける 広さ（第37回までの レイアウトで 数えた）
const OLD_EARTH = [144, 121, 124, 168, 169, 117, 126, 215];
const OLD_CASTLE = [235, 161, 224, 200, 160, 140, 178, 228, 177, 200, 187, 182];

test('広さ: どの 階も 歩ける 広さが もとの 1.5〜2倍くらい。紙の 大きさ・わき道の 宝箱は 今の 宝の 表の 品（★は ふやさない）', () => {
  for (let n = 1; n <= EARTH_FLOORS; n++) {
    const m = MAPS[earthMapId(n)];
    assert.equal(m.w, EARTH_W);
    assert.equal(m.h, EARTH_H);
    const k = area(m) / OLD_EARTH[n - 1];
    assert.ok(k >= 1.5 && k <= 2.2, `神殿 ${n}階: ${area(m)} / ${OLD_EARTH[n - 1]} = ${k.toFixed(2)}`);
  }
  for (let n = 1; n <= CASTLE_FLOORS; n++) {
    const m = MAPS[castleMapId(n)];
    assert.equal(m.w, CASTLE_W);
    assert.equal(m.h, CASTLE_H);
    const k = area(m) / OLD_CASTLE[n - 1];
    assert.ok(k >= 1.5 && k <= 2.2, `城 ${n}階: ${area(m)} / ${OLD_CASTLE[n - 1]} = ${k.toFixed(2)}`);
  }
  // わき道の 宝箱（神殿 e5_<階>x… の うしろの ほう・城 c5c_<階>s…）: ★の 品では ない・id は 1つだけ
  const ids = new Set();
  for (const [N, mid] of [[EARTH_FLOORS, earthMapId], [CASTLE_FLOORS, castleMapId]]) {
    for (let n = 1; n <= N; n++) {
      const m = MAPS[mid(n)];
      for (const ch of m.chests) {
        assert.ok(!ids.has(ch.id), `${ch.id} は 1つだけ`);
        ids.add(ch.id);
        if (/x\d|s\d/.test(ch.id)) assert.ok(ch.gold || (ITEMS[ch.item] && !ITEMS[ch.item].rank), `${ch.id}: ${ch.item}`);
      }
    }
  }
  // 魔物は 少し ふえた（休み所・ボスの 階は 出ない まま）
  assert.equal(MAPS.earth_4f.spawnCounts.t5_earth_up, 7);
  assert.deepEqual(MAPS.earth_5f.spawnCounts, {});
  assert.equal(MAPS.castle_11f.spawnCounts.t5_castle_water, 7);
  assert.deepEqual(MAPS.castle_8f.spawnCounts, {});
});

test('大地の神殿: ふえた しかけの 部屋（水がめの 根・4階の 守り手と あな）は しかけを とくと 宝箱へ。今の しかけを とばす 近道には ならない', async () => {
  const A = (n) => cell(earthArrive(n)).map(Math.floor);
  // 1階: 西の 小べやの 水がめ2 → 北西の 根の 物見（下りかいだんへは 行けない まま）
  {
    const id = earthMapId(1), c = chest(id, 'e5_1x1'), D = EARTH_POS[1].down;
    assert.ok(!near(reach(id, A(1), []), c));
    const r = reach(id, A(1), [JAR(1, 2)]);
    assert.ok(near(r, c) && !r(D.x, D.y), '水がめ2で 物見へ。下りかいだんは 水がめ1');
  }
  // 2階: 水がめ3（北の 島）→ 水がめ4（北東の 小島）。東の 小島は「水がめ1で ちぢむ 根」なので、東の 島で 水を ぬく
  {
    const id = earthMapId(2), c = chest(id, 'e5_2x1'), D = EARTH_POS[2].down;
    assert.ok(!near(reach(id, A(2), [JAR(2, 3)]), c));
    const r = reach(id, A(2), [JAR(2, 3), JAR(2, 4)]);
    assert.ok(near(r, c) && !r(D.x, D.y), '北東の 小島から 下へは 行けない');
    const isle = chest(id, 'e5_2x2'), east = cell(eo(23, 10));
    assert.ok(near(reach(id, east, []), isle) && !near(reach(id, east, [JAR(2, 1)]), isle), '東の 小島');
  }
  // 3階: 南の 小べやの 水がめ2 → 根の 下の 小島
  {
    const id = earthMapId(3), c = chest(id, 'e5_3x1');
    assert.ok(!near(reach(id, A(3), [JAR(3, 1)]), c) && near(reach(id, A(3), [JAR(3, 1), JAR(3, 2)]), c));
    assert.ok(!reach(id, A(3), [JAR(3, 1), JAR(3, 2)])(EARTH_POS[3].down.x, EARTH_POS[3].down.y), 'あなは 3階の 守り手で');
  }
  // 6階: まん中の 島の 水がめ2 → 北の 島
  {
    const id = earthMapId(6), c = chest(id, 'e5_6x1'), mid = cell(eo(12, 10));
    assert.ok(!near(reach(id, mid, [JAR(6, 1)]), c) && near(reach(id, mid, [JAR(6, 1), JAR(6, 2)]), c));
  }
  // 4階: 東の 道の わきの 守り手の 小べや。石板で 歩かせて あなを うめると、おくの 宝箱へ（3階の あなとは べつの フラグ）
  const G = EARTH_GOLEMS[4], P = EARTH_POS[4], id4 = earthMapId(4);
  assert.equal(G.dir, 'S');
  assert.equal(G.done, PIT4_FLAG);
  assert.notEqual(PIT4_FLAG, PIT_FLAG);
  const nook = chest(id4, 'e5_4x2');
  assert.ok(!near(reach(id4, A(4), []), nook) && near(reach(id4, A(4), [PIT4_FLAG]), nook));
  assert.ok(near(reach(id4, A(4), []), P.slab), '石板は ふむ石の 前に 行ける');
  const world = new GameWorld({ offline: true, rng: makeRng(3801), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  const cid = await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[cid];
  for (const f of ['c5_etemple', 'c5_ef4']) c.flags[f] = true;
  bot.s.repelUntil = 1e15;
  world.placeSession(bot.s, id4, P.slab.x + 0.5, P.slab.y + 1.5, 'up', true);
  await bot.settle();
  const steps = G.track.findIndex((t) => t.ch === 'o');
  for (let i = 0; i < steps; i++) {
    bot.send({ t: 'interact', kind: 'tile', x: P.slab.x, y: P.slab.y });
    await bot.settle();
  }
  assert.ok(c.flags[PIT4_FLAG] && !c.flags[PIT_FLAG], `${steps}歩で あなを うめた`);
  assert.ok(golemState(4, world.hasFlagFn(bot.s)).gone);
  assert.ok(bot.msgs.some((m) => m.t === 'script' && JSON.stringify(m.steps).includes('あなをうめた')));
});

test('影の城: ふえた 部屋（風の 流れの 小島・炎の 柱の 先・水の 高さ・流れる ゆかの 倉庫）の 宝箱。6階の 像の 息の 線は かわらない', () => {
  const st = (n, start, has) => flowReach(MAPS[castleMapId(n)], start, has);
  const A = (n) => cell(castleArrive(n)).map(Math.floor);
  // 2階: 南西の 足場から 風に のって 南の 小島・東の 雲の 小島（どちらも 風で 南東の 足場へ もどれる）
  {
    const r = st(2, A(2), () => false);
    for (const id of ['c5c_2s0', 'c5c_2s1']) assert.ok(nearStop(r, chest('castle_2f', id)), id);
    const se = `${co(20, 13).x},${co(20, 13).y}`;
    assert.ok(st(2, cell(co(12, 18)), () => false).stops.has(se) && st(2, cell(co(27, 12)), () => false).stops.has(se), '小島から もどれる');
  }
  // 5階: 炎の 柱の 列の むこうの 宝箱（炎が 止まっている 時だけ）
  {
    const nw = chest('castle_5f', 'c5c_5s0'), ea = chest('castle_5f', 'c5c_5s1');
    const fireA = (f) => f === '@fireA', fireB = (f) => f === '@fireB';
    assert.ok(!nearStop(st(5, cell(co(1, 5)), fireA), nw) && nearStop(st(5, cell(co(1, 5)), fireB), nw), '北西の 炎の へや');
    assert.ok(!nearStop(st(5, cell(co(25, 12)), fireB), ea) && nearStop(st(5, cell(co(25, 12)), fireA), ea), '東の 炎の 見晴らし');
  }
  // 9階: しずんだ 庭は 水が「下」・東の 小島は「上」（うく 石の 板）
  {
    const garden = chest('castle_9f', 'c5c_9s1'), isle = chest('castle_9f', 'c5c_9s0');
    const lv = (l) => (f) => (l === 'lo' ? f === WATER9.lo : l === 'mid' ? f === WATER9.mid : false);
    for (const l of ['hi', 'mid', 'lo']) {
      assert.equal(nearStop(st(9, cell(co(10, 15)), lv(l)), garden), l === 'lo', `庭 ${l}`);
      assert.equal(nearStop(st(9, cell(co(20, 6)), lv(l)), isle), l === 'hi', `小島 ${l}`);
    }
  }
  // 10階: 南東の へや → 流れる ゆか → 南西の 倉庫（宝箱）→ 流れる ゆかで 南西の へやへ
  {
    const box = chest('castle_10f', 'c5c_10s1');
    assert.ok(nearStop(st(10, cell(co(21, 15)), () => false), box));
    assert.ok(st(10, cell(co(7, 19)), () => false).stops.has(`${co(3, 15).x},${co(3, 15).y}`), '倉庫から もどれる');
  }
  // 6階: 像の 息の 線（南・西・北・東）は ひろげる 前と おなじ 長さ・おなじ 炎の 数
  assert.deepEqual(['S', 'W', 'N', 'E'].map((d) => STATUE_RAYS[d].cells.length), [7, 11, 7, 11]);
  assert.deepEqual(['S', 'W', 'N', 'E'].map((d) => STATUE_RAYS[d].flames.length), [1, 1, 2, 1]);
});

test('古い セーブ: 広げた 階の 中に いた 人・いのりの場所は、その 階の 着く ところへ（レイアウトの 版 lv）。ほかの マップは そのまま', async () => {
  assert.equal(EARTH_LAYOUT_VER, 38);
  assert.equal(CASTLE_LAYOUT_VER, 38);
  for (let n = 1; n <= EARTH_FLOORS; n++) assert.equal(MAPS[earthMapId(n)].layoutVer, EARTH_LAYOUT_VER);
  for (let n = 1; n <= CASTLE_FLOORS; n++) assert.equal(MAPS[castleMapId(n)].layoutVer, CASTLE_LAYOUT_VER);
  // posOf … 版を いっしょに のこす / layoutFix … 版が ちがえば 着く ところへ
  assert.deepEqual(posOf({ map: 'earth_3f', x: 9.5, y: 9.5, dir: 'up' }), { map: 'earth_3f', x: 9.5, y: 9.5, dir: 'up', lv: 38 });
  assert.deepEqual(posOf({ map: 'overworld', x: 9.5, y: 9.5, dir: 'up' }), { map: 'overworld', x: 9.5, y: 9.5, dir: 'up' });
  const a3 = earthArrive(3);
  assert.deepEqual(layoutFix({ map: 'earth_3f', x: 9.5, y: 9.5, dir: 'up' }), { map: 'earth_3f', x: a3.x, y: a3.y, dir: a3.dir, lv: 38 });
  const same = { map: 'earth_3f', x: 9.5, y: 9.5, dir: 'up', lv: 38 };
  assert.equal(layoutFix(same), same);
  const ow = { map: 'overworld', x: 9.5, y: 9.5, dir: 'up' };
  assert.equal(layoutFix(ow), ow);
  // どの 階も 着く ところは ゆか
  for (let n = 1; n <= EARTH_FLOORS; n++) { const m = MAPS[earthMapId(n)]; assert.ok(!isBlocked(m, Math.floor(m.layoutArrive.x), Math.floor(m.layoutArrive.y), () => false), `神殿 ${n}階`); }
  for (let n = 1; n <= CASTLE_FLOORS; n++) { const m = MAPS[castleMapId(n)]; assert.ok(!isBlocked(m, Math.floor(m.layoutArrive.x), Math.floor(m.layoutArrive.y), () => false), `城 ${n}階`); }
  // ログイン: 前の 版で のこした 場所（lv なし）→ 着く ところ。のこしなおすと lv が つく → つぎは そのまま
  const world = new GameWorld({ offline: true, rng: makeRng(3802), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  const id = await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[id];
  const relog = async () => { bot.send({ t: 'play', id }); await bot.settle(); };
  world.leaveWorld(world.sessions.get(bot.sid));
  c.pos = { map: 'castle_7f', x: 3.5, y: 4.5, dir: 'up' };
  await relog();
  const a7 = castleArrive(7);
  assert.deepEqual([bot.map, bot.x, bot.y], ['castle_7f', a7.x, a7.y], '城 7階の 着く ところ');
  world.placeSession(bot.s, 'castle_7f', a7.x, a7.y - 1, 'up', true);
  world.leaveWorld(world.sessions.get(bot.sid));
  assert.equal(c.pos.lv, CASTLE_LAYOUT_VER, 'のこした 場所に 版');
  await relog();
  assert.deepEqual([bot.map, bot.x, bot.y], ['castle_7f', a7.x, a7.y - 1], '今の 版なら そのまま');
  world.leaveWorld(world.sessions.get(bot.sid));
  c.pos = { map: 'earth_6f', x: 40.5, y: 40.5, dir: 'up' }; // 前の 版で マップの 外（今は 38×28 より 外）
  await relog();
  assert.deepEqual([bot.map, bot.x, bot.y], ['earth_6f', earthArrive(6).x, earthArrive(6).y]);
  // ほかの マップの 古い 場所は そのまま
  world.leaveWorld(world.sessions.get(bot.sid));
  c.pos = { map: 'overworld', x: 30.5, y: 30.5, dir: 'up' };
  await relog();
  assert.deepEqual([bot.map, bot.x, bot.y], ['overworld', 30.5, 30.5]);
  // いのりの場所（休み所の いずみで 記録）: 前の 版なら その 階の 着く ところの そばで 目を覚ます
  c.spawn = { map: 'castle_4f', x: 16.5, y: 13.5 };
  world.respawn(bot.s);
  await bot.settle();
  const a4 = castleArrive(4);
  assert.equal(bot.s.map, 'castle_4f');
  assert.ok(Math.hypot(bot.s.x - a4.x, bot.s.y - a4.y) < 2, `${bot.s.x},${bot.s.y}`);
  c.spawn = { map: 'castle_4f', x: a4.x + 2, y: a4.y - 1, lv: CASTLE_LAYOUT_VER };
  world.respawn(bot.s);
  await bot.settle();
  assert.ok(Math.hypot(bot.s.x - (a4.x + 2), bot.s.y - (a4.y - 1)) < 1.5, '今の 版なら そのまま');
});
