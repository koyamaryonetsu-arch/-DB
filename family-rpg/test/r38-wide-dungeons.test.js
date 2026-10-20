// 第38回 A1: 第5章の 長い ダンジョン（星の塔・しずみゆく島の古い神殿・ノクトの思い出の迷宮）を 広げた
// ・どの 階も 歩ける 広さが 前の 1.5倍 いじょう（わき道・宝の 小べや・見晴らしの 広間）
// ・前からの しかけ・かいだん・宝箱の 場所は そのまま（しかけの テストは ch5-step12・34・5 が そのまま 通る）
// ・しなくても よい 小さな しかけ: 塔 2階の 2つ目の 上り下りの ゆか・神殿 4階の 重さの てんびん・迷宮 3階の 2つ目の ランプ台
// ・古い セーブで 広げた 階の 中に いた 人は、その 階の 着く 所へ（maps の layoutVer・layoutArrive。world.js の layoutFix）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld, posOf, layoutFix } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { TOWER_POS, TOWER_FLOORS, TOWER_LAYOUT, TOWER_ENTRY, LIFTS, towerMapId } from '../public/js/shared/maps/tower.js';
import { RUIN_POS, RUIN_FLOORS, RUIN_LAYOUT, RUIN_REST, RUIN_OUT, SCALES, TILTS, LADDER_FLAG, ruinMapId } from '../public/js/shared/maps/sink-ruin.js';
import { MEMORY_POS, MEMORY_FLOORS, MEMORY_LAYOUT, MEMORY_REST, LAMP, MSHARD, memoryMapId, memoryArrive } from '../public/js/shared/maps/memory.js';
import { flowReach } from '../public/js/shared/maps/flow.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { KUMOI_OBJECTIVE_TARGETS } from '../public/js/shared/data/story-kumoi.js';
import { Bot } from './helpers.js';

// 前の 形の 歩ける マス（どれかの しかけの じょうたいで 歩ける マス。第38回 A の 前）
const OLD_WALK = {
  star_tower: [328, 291, 289, 243, 311, 259, 320, 336],
  sink_ruin: [305, 281, 256, 350, 275, 395, 316],
  memory: [115, 163, 164, 130, 119, 201],
};
const OLD_SPAWN = {
  star_tower: [5, 5, 5, 3, 5, 5, 5, 3],
  sink_ruin: [4, 5, 5, 0, 6, 6, 0],
  memory: [3, 4, 0, 4, 4, 2],
};
const FLOORS = [
  ...Array.from({ length: TOWER_FLOORS }, (_, i) => ['star_tower', i + 1, towerMapId(i + 1)]),
  ...Array.from({ length: RUIN_FLOORS }, (_, i) => ['sink_ruin', i + 1, ruinMapId(i + 1)]),
  ...Array.from({ length: MEMORY_FLOORS }, (_, i) => ['memory', i + 1, memoryMapId(i + 1)]),
];
const walkable = (m) => {
  let n = 0;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (!isBlocked(m, x, y, () => false) || !isBlocked(m, x, y, () => true)) n++;
  return n;
};
const spawnSum = (m) => Object.values(m.spawnCounts || {}).reduce((a, b) => a + b, 0);
function reach(id, start, flags) {
  const m = MAPS[id];
  const has = (f) => flags.includes(f);
  const seen = new Set([start[1] * m.w + start[0]]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = ny * m.w + nx;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || seen.has(k)) continue;
      if (isBlocked(m, nx, ny, has) && !m.warpAt.has(k)) continue;
      seen.add(k);
      if (!m.warpAt.has(k)) q.push([nx, ny]);
    }
  }
  return (x, y) => seen.has(y * m.w + x);
}
const near = (r, p) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => r(p.x + dx, p.y + dy));
const cell = (p) => [Math.floor(p.x), Math.floor(p.y)];

test('広さ: どの 階も 歩ける マスが 前の 1.5倍 いじょう 2.2倍 いか。魔物の 数は 少し ふえた（休み所・ボスの 階の きまりは そのまま）', () => {
  for (const [kind, n, id] of FLOORS) {
    const m = MAPS[id];
    const now = walkable(m), old = OLD_WALK[kind][n - 1];
    assert.ok(now >= old * 1.5 && now <= old * 2.2, `${id}: ${old} → ${now}`);
    const sp = spawnSum(m), sp0 = OLD_SPAWN[kind][n - 1];
    if (sp0 === 0) assert.equal(sp, 0, `${id}: 魔物の 出ない 階`);
    else assert.ok(sp > sp0 && sp <= sp0 * 2, `${id}: 魔物 ${sp0} → ${sp}`);
    // 2.5D でも 2D でも かける 大きさ（第4章の 大きな マップより 小さい）
    assert.ok(m.w <= 48 && m.h <= 32, `${id}: ${m.w}×${m.h}`);
    assert.equal(m.tiles.length, m.w * m.h);
  }
});

test('わき道の 宝箱: 階ごとに 1〜3こ ふえた。id は かさならない・ゆかの 上・しかけを といた 世界で 手が とどく', () => {
  const ids = new Set();
  for (const [kind, n, id] of FLOORS) {
    const m = MAPS[id];
    for (const ch of m.chests) {
      assert.ok(!ids.has(ch.id), `${ch.id} かさならない`);
      ids.add(ch.id);
      assert.ok(!isBlocked(m, ch.x, ch.y, () => false), `${ch.id}: ゆかの 上`);
      assert.ok(ch.gold > 0 || ch.item, ch.id);
    }
    const added = m.chests.filter((ch) => /^t5_\dc|^t5_\dd|^t5_\de|^[rm]5_\dx[1-9]/.test(ch.id)).length;
    assert.ok(added >= 1 && added <= 3, `${id}: わき道の 宝箱 ${added}`);
    void kind;
    void n;
  }
});

test('形の 版と 着く 所: 広げた 階は layoutVer 38（大地の神殿・影の城と おなじ しくみ）・着く 所は 歩ける マスで、かいだん・入口から 着く 所と おなじ', () => {
  assert.equal(TOWER_LAYOUT, 38);
  assert.equal(RUIN_LAYOUT, 38);
  assert.equal(MEMORY_LAYOUT, 38);
  for (const [, , id] of FLOORS) {
    const m = MAPS[id];
    const A = m.layoutArrive;
    assert.equal(m.layoutVer, 38, id);
    assert.ok(A && ['up', 'down', 'left', 'right'].includes(A.dir), id);
    assert.ok(!isBlocked(m, ...cell(A), () => false), `${id}: 着く 所は ゆか`);
    assert.ok(!m.warpAt.has(cell(A)[1] * m.w + cell(A)[0]), `${id}: ワープの 上では ない`);
  }
  // てっぺんは そのまま
  assert.ok(!MAPS.star_tower_top.layoutVer);
  // 塔: 1階は フィールドの とびらから、ほかは 下の 階の 上りかいだんから 着く 所
  assert.deepEqual(cell(MAPS[towerMapId(1)].layoutArrive), cell(TOWER_ENTRY));
  const ow = MAPS.overworld.warps.find((w) => w.to.map === towerMapId(1));
  assert.deepEqual(cell(ow.to), cell(MAPS[towerMapId(1)].layoutArrive));
  for (let n = 2; n <= TOWER_FLOORS; n++) {
    const w = MAPS[towerMapId(n - 1)].warps.find((x) => x.x === TOWER_POS[n - 1].up.x && x.y === TOWER_POS[n - 1].up.y);
    assert.deepEqual(cell(w.to), cell(MAPS[towerMapId(n)].layoutArrive), `塔 ${n}階`);
  }
  // 神殿: 1階は 外からの 入口、ほかは 上の 階の 下りかいだんから
  assert.deepEqual(cell(MAPS[ruinMapId(1)].layoutArrive), cell(RUIN_OUT.inside));
  for (let n = 2; n <= RUIN_FLOORS; n++) {
    const w = MAPS[ruinMapId(n - 1)].warps.find((x) => x.x === RUIN_POS[n - 1].down.x && x.y === RUIN_POS[n - 1].down.y);
    assert.deepEqual(cell(w.to), cell(MAPS[ruinMapId(n)].layoutArrive), `神殿 ${n}階`);
  }
  // 迷宮: memoryArrive
  for (let n = 1; n <= MEMORY_FLOORS; n++) assert.deepEqual(cell(MAPS[memoryMapId(n)].layoutArrive), cell(memoryArrive(n)), `迷宮 ${n}階`);
});

test('古い セーブ（版 lv の ない 場所）: 広げた 階の 中なら その 階の 着く 所へ。新しい セーブ・ほかの 場所は そのまま（world.js の posOf・layoutFix）', () => {
  for (const [, , id] of FLOORS) {
    const m = MAPS[id], A = m.layoutArrive;
    // 前の 形の かべの 中（0,0）でも、まん中でも、着く 所へ
    for (const [x, y] of [[0.5, 0.5], [m.w / 2, m.h / 2]]) {
      const p = layoutFix({ map: id, x, y, dir: 'left' });
      assert.deepEqual({ x: p.x, y: p.y, lv: p.lv }, { x: A.x, y: A.y, lv: 38 }, id);
      assert.ok(!isBlocked(m, Math.floor(p.x), Math.floor(p.y), () => false), id);
    }
    // いまの 版で のこした 場所は そのまま
    const s = { map: id, x: 30.5, y: 9.5, dir: 'up' };
    const saved = posOf(s);
    assert.equal(saved.lv, 38);
    assert.equal(layoutFix(saved), saved, `${id}: 新しい セーブ`);
  }
  for (const map of ['overworld', 'star_tower_top', 'kumoi', 'hoshiyomi']) {
    const p = { map, x: 5.5, y: 6.5, dir: 'left' };
    assert.equal(layoutFix(p), p, map);
    assert.ok(!('lv' in posOf(p)), map);
  }
});

test('古い セーブで ログイン: 神殿 5階・塔 3階・迷宮 4階の 中から はじまる 人は その 階の 着く 所から（家族サーバー・ひとりで遊ぶサイト どちらも）', async () => {
  for (const offline of [false, true]) {
    const world = new GameWorld({ offline, rng: makeRng(3801), rateLimit: false, checkPassword: () => true });
    const bot = new Bot(world, 'ソラ');
    await bot.login('ほし');
    const id = await bot.createAndPlay('warrior');
    await bot.settle();
    world.leaveWorld(bot.s);
    const c = world.data.characters[id];
    for (const [map, x, y] of [[ruinMapId(5), 27.5, 5.5], [towerMapId(3), 10.5, 9.5], [memoryMapId(4), 3.5, 8.5]]) {
      // 第38回 A の 前の セーブ（lv が ない）
      c.pos = { map, x, y, dir: 'right' };
      const b = new Bot(world, 'ソラ');
      await b.login('ほし');
      b.send({ t: 'play', id });
      await b.settle();
      const A = MAPS[map].layoutArrive;
      assert.equal(b.map, map, `offline=${offline}`);
      assert.ok(Math.abs(b.x - A.x) < 0.01 && Math.abs(b.y - A.y) < 0.01, `${map}: 着く 所へ ${b.x},${b.y}`);
      world.leaveWorld(b.s);
      assert.equal(c.pos.lv, 38, 'つぎの セーブは 新しい 版');
    }
  }
});

test('しなくても よい しかけ（神殿 4階）: 重さの てんびんで 宝物庫。休み所の 階は 魔物が 出ない まま・下りかいだんは いらない', async () => {
  const S = SCALES.f4, m = MAPS[S.map];
  assert.ok(S.optional && S.map === ruinMapId(RUIN_REST));
  assert.deepEqual(Object.keys(SCALES).filter((k) => SCALES[k].optional), ['f4']);
  const start = [RUIN_POS[4].up.x, RUIN_POS[4].up.y + 1];
  const vault = m.chests.filter((ch) => ch.y >= 15 && ch.x >= 32);
  assert.equal(vault.length, 2, '宝物庫の 宝箱');
  const r0 = reach(m.id, start, []);
  assert.ok(r0(RUIN_POS[4].down.x, RUIN_POS[4].down.y), 'てんびん なしで 下りかいだん');
  assert.ok(r0(S.a.x, S.a.y) && r0(S.b.x, S.b.y), '皿へ 行ける');
  for (const ch of vault) assert.ok(!near(r0, ch), `とびらの 先 ${ch.id}`);
  const r1 = reach(m.id, start, [S.flag]);
  for (const ch of vault) assert.ok(near(r1, ch), `つりあうと ${ch.id}`);
  assert.ok(Math.hypot(S.a.x - S.b.x, S.a.y - S.b.y) >= 6, 'ひとりでは 同時に のれない');
  assert.deepEqual(m.spawnCounts, {});
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) assert.ok(m.zoneAt(x, y).startsWith('safe'), `休み所 ${x},${y}`);
  assert.ok(SCRIPTS.c5_pan_f4 && SCRIPTS.c5_sdoor_f4);
  for (const list of Object.values(KUMOI_OBJECTIVE_TARGETS)) assert.ok(!list.some((p) => p.map === S.map && p.x === S.a.x && p.y === S.a.y), '目標の しるしに ならない');
  // 仲間に のってもらうと 開く（ひとりで あそぶ とき）
  const { recruitNpc } = await import('../public/js/shared/world/party.js');
  const world = new GameWorld({ offline: true, rng: makeRng(3802), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  assert.ok(recruitNpc(world, bot.s, 'npc_gard', { force: true }).ok);
  await bot.settle();
  world.placeSession(bot.s, S.map, S.b.x + 0.5, S.b.y + 1.5, 'up', true);
  await bot.settle();
  bot.choice = 0;
  bot.x = S.b.x + 0.5;
  bot.y = S.b.y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await bot.settle();
  assert.ok(c.flags[S.flag], 'つりあって 宝物庫の とびらが 開いた');
});

test('しなくても よい しかけ（迷宮 3階）: 2つ目の ランプ台で 南の 雪の 広場へ。光を うつしても いずみ・下りかいだん・かけらへ もどれる', () => {
  const P = MEMORY_POS[MEMORY_REST], id = memoryMapId(MEMORY_REST), m = MAPS[id];
  const L2 = P.lamps[2];
  assert.ok(L2 && L2.path.length === 3 && !L2.keep);
  const plaza = m.chests.find((ch) => ch.x === 17 && ch.y === 18);
  assert.ok(plaza);
  const start = cell(memoryArrive(MEMORY_REST));
  const r0 = reach(id, start, []);
  assert.ok(!near(r0, plaza), 'ランプ台2 が 光るまで 行けない');
  assert.ok(near(r0, P.font) && r0(P.down.x, P.down.y), 'いずみと 下りかいだんは いつでも');
  const r2 = reach(id, start, [LAMP(3, 2)]);
  assert.ok(near(r2, plaza), '影の 道で 雪の 広場へ');
  assert.ok(!near(r2, P.shard), 'ランプ台2 の 時は かけらの 道は ない');
  assert.ok(SCRIPTS.c5_mlamp_3_2);
});

test('わき道は しかけを こえない: 新しい へやを 通っても、しかけを とく 前に 先へ 行けない（塔・神殿・迷宮）', () => {
  // 塔: しかけの ある 階は、しかけを といて いない 世界では 上りかいだんへ 行けない（2つ目の ゆかを 上げても かわらない）
  const optional = Object.values(LIFTS).filter((L) => L.optional).map((L) => L.flag);
  for (const n of [2, 5, 7, 8]) {
    const P = TOWER_POS[n];
    assert.ok(!reach(towerMapId(n), [P.down.x, P.down.y - 1], optional)(P.up.x, P.up.y), `塔 ${n}階: しかけの 前`);
  }
  // 風の 窓（3階・6階）: 風に 流される ことも 考えて、風見の石を 回す 前は 上りかいだんの 手前で 止まれない
  for (const n of [3, 6]) {
    const P = TOWER_POS[n];
    const stops = flowReach(MAPS[towerMapId(n)], [P.down.x, P.down.y - 1], () => false).stops;
    assert.ok(!stops.has(`${P.up.x},${P.up.y + 1}`), `塔 ${n}階: 風の 前`);
  }
  // 神殿: 2階・5階は かたむき、3階・6階は てんびん（4階の てんびんを といても かわらない）
  const extra = [SCALES.f4.flag];
  for (const n of [2, 3, 5, 6]) {
    const start = [RUIN_POS[n].up.x, RUIN_POS[n].up.y + 1];
    assert.ok(!reach(ruinMapId(n), start, extra)(RUIN_POS[n].down.x, RUIN_POS[n].down.y), `神殿 ${n}階: しかけの 前`);
  }
  // 神殿 2階: 東の 古い 宝物庫は 西に かたむいている 時だけ（岩が ころがると ふさがる）
  const m2 = ruinMapId(2), s2 = [RUIN_POS[2].up.x, RUIN_POS[2].up.y + 1];
  const vault2 = MAPS[m2].chests.find((ch) => ch.id === 'r5_2x1');
  assert.ok(near(reach(m2, s2, []), vault2) && !near(reach(m2, s2, [TILTS.f2.flag]), vault2));
  // 神殿 5階: 雲の 小べやは 東の 水路が かわいている 時だけ
  const m5 = ruinMapId(5), s5 = [RUIN_POS[5].up.x, RUIN_POS[5].up.y + 1];
  const cloud5 = MAPS[m5].chests.find((ch) => ch.id === 'r5_5x2');
  assert.ok(near(reach(m5, s5, []), cloud5) && !near(reach(m5, s5, [TILTS.f5.flag]), cloud5));
  // 縄ばしごの 近道は 前の まま（2階の 下の へや ⇔ 5階）
  assert.ok(reach(m2, s2, [TILTS.f2.flag, LADDER_FLAG])(RUIN_POS[2].shaft.x, RUIN_POS[2].shaft.y));
  // 迷宮: ランプ台を 光らせないと 下りかいだん・ノクトの 影へ 行けない（3階の 休み所を のぞく）
  for (let n = 1; n <= MEMORY_FLOORS; n++) {
    if (n === MEMORY_REST) continue;
    const P = MEMORY_POS[n];
    const r = reach(memoryMapId(n), cell(memoryArrive(n)), []);
    if (P.down) assert.ok(!r(P.down.x, P.down.y), `迷宮 ${n}階`);
    else assert.ok(!near(r, { x: Math.floor(P.boss.x), y: Math.floor(P.boss.y) }), '迷宮 6階: ノクトの 影');
  }
});
