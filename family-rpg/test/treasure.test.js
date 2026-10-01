// 宝の地図: 地図を もらう → ほる → 洞窟（毎回 ちがう 形）→ 主 → 新しい 地図
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked, tileAt, condOk, POS } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { T } from '../public/js/shared/tiles.js';
import { STORY_STEPS, SCRIPTS } from '../public/js/shared/data/story.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ENCOUNTER_TABLES } from '../public/js/shared/data/encounters.js';
import {
  caveInfo, floorMapId, parseFloorId, clearedFlag, foundFlag, tmTitle, scaleEnemy, mergeTreasureMaps, repairTreasureMaps,
  TM_MAX, TM_LV_MAX, chestLoot, equipRankOf, mapDropRate,
} from '../public/js/shared/data/treasure.js';
import { grantTreasureMap, pickDigSpot, treasureAfterBattle } from '../public/js/shared/world/treasure.js';
import { enemyFromSpecies } from '../public/js/shared/battle.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { Bot, tickN } from './helpers.js';

const TW = (x, y) => [PLACES.town.x + x, PLACES.town.y + y];
const WALK = (m, x, y) => !isBlocked(m, x, y, () => false);

// マップの 中で 行ける マス（宝箱と 大きな 人は とおれない）
function reachFrom(m, sx, sy, hasFlag = () => false) {
  const block = new Set(m.chests.filter((c) => condOk(c.show, hasFlag)).map((c) => c.y * m.w + c.x));
  for (const n of m.npcs) {
    if (!n.big || !condOk(n.show, hasFlag)) continue;
    for (let y = n.y - 1; y <= n.y; y++) for (let x = n.x - 1; x <= n.x + 1; x++) block.add(y * m.w + x);
  }
  const seen = new Uint8Array(m.w * m.h);
  const q = [[sx, sy]];
  seen[sy * m.w + sx] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = ny * m.w + nx;
      if (seen[k] || block.has(k) || isBlocked(m, nx, ny, hasFlag)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !!seen[y * m.w + x];
}
const nextTo = (reach, x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => reach(x + dx, y + dy));

function strong(c, level = 60) {
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  c.hp = 9999;
  c.mp = 9999;
}

async function hero(seed = 7, name = 'ソラ') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) c.flags[f] = true;
  return { world, bot, c };
}

const sampleMaps = () => {
  const out = [];
  for (let i = 0; i < 36; i++) out.push({ seed: (i * 7919 + 13) * 104729 % 0x7fffffff, lv: 1 + (i % TM_LV_MAX), map: 'overworld', x: 100, y: 60 });
  return out;
};

test('宝の洞窟: おなじ seed なら 別々に つくっても まったく おなじ 形（サーバーと 画面）', async () => {
  const a = await import('../public/js/shared/maps/treasure-cave.js?build=a');
  const b = await import('../public/js/shared/maps/treasure-cave.js?build=b');
  for (const tm of sampleMaps().slice(0, 12)) {
    const info = caveInfo(tm.seed, tm.lv);
    for (let f = 1; f <= info.floors; f++) {
      const id = floorMapId(tm, f);
      const ma = a.buildTreasureFloor(id), mb = b.buildTreasureFloor(id);
      assert.ok(ma && mb, id);
      assert.equal(ma.w, mb.w);
      assert.equal(ma.h, mb.h);
      assert.deepEqual([...ma.tiles], [...mb.tiles], `${id} の タイル`);
      assert.deepEqual(JSON.stringify([ma.chests, ma.warps, ma.triggers, ma.npcs, ma.gates]), JSON.stringify([mb.chests, mb.warps, mb.triggers, mb.npcs, mb.gates]), `${id} の 宝箱・階段`);
    }
  }
  // seed が ちがえば 形も ちがう
  const t1 = MAPS[floorMapId({ seed: 11, lv: 3, map: 'overworld', x: 1, y: 1 }, 1)];
  const t2 = MAPS[floorMapId({ seed: 12, lv: 3, map: 'overworld', x: 1, y: 1 }, 1)];
  assert.notDeepEqual([...t1.tiles], [...t2.tiles]);
  // ID の 形
  const id = floorMapId({ seed: 123456, lv: 4, map: 'sea', x: 40, y: 22 }, 2);
  assert.deepEqual(parseFloorId(id), { seed: 123456, lv: 4, spot: { map: 'sea', x: 40, y: 22 }, floor: 2 });
  assert.equal(parseFloorId('tm_zz_99_o1x1_1'), null, 'レベルが 大きすぎる');
  assert.equal(MAPS['tm_bad'], undefined);
  assert.ok(!Object.keys(MAPS).some((k) => k.startsWith('tm_')), 'Object.keys には 出ない');
});

test('宝の洞窟: どの 階も 階段・宝箱・主まで つながっている（2〜6階・3つの しゅるい）', () => {
  const themes = new Set();
  const floorsSeen = new Set();
  for (const tm of sampleMaps()) {
    const info = caveInfo(tm.seed, tm.lv);
    themes.add(info.theme);
    floorsSeen.add(info.floors);
    assert.ok(info.floors >= 2 && info.floors <= 6, `${info.floors}階`);
    assert.ok(MONSTERS[info.boss]?.boss, info.boss);
    for (let f = 1; f <= info.floors; f++) {
      const m = MAPS[floorMapId(tm, f)];
      assert.equal(m.kind, 'dungeon');
      assert.equal(m.tm.floor, f);
      const ax = Math.floor(m.tm.arrive.x), ay = Math.floor(m.tm.arrive.y);
      assert.ok(WALK(m, ax, ay), `${m.id} 入り口`);
      const reach = reachFrom(m, ax, ay);
      // のぼり（1階は 出口）
      const up = f === 1 ? m.triggers.find((t) => t.script === 'tm_exit') : m.warps.find((w) => w.to.map === floorMapId(tm, f - 1));
      assert.ok(up && reach(up.x, up.y), `${m.id} のぼり`);
      assert.equal(tileAt(m, up.x, up.y), T.STAIRS_UP);
      // ワープ先は 歩ける
      for (const w of m.warps) {
        const d = MAPS[w.to.map];
        assert.ok(d && WALK(d, Math.floor(w.to.x), Math.floor(w.to.y)), `${m.id} → ${w.to.map}`);
        assert.ok(reach(w.x, w.y), `${m.id} ワープ ${w.x},${w.y}`);
      }
      // 宝箱は となりに 立てる
      for (const c of m.chests.filter((c) => !c.show)) {
        assert.ok(nextTo(reach, c.x, c.y), `${m.id} 宝箱 ${c.id}`);
        assert.ok(c.gold > 0 || ITEMS[c.item], `${c.id} の なかみ`);
      }
      if (f < info.floors) {
        assert.ok(m.warps.some((w) => w.to.map === floorMapId(tm, f + 1) && tileAt(m, w.x, w.y) === T.STAIRS_DOWN), `${m.id} くだり`);
        assert.ok(m.chests.length >= 2, `${m.id} 宝箱`);
        assert.ok(!m.npcs.length);
      } else {
        const boss = m.npcs.find((n) => n.id === 'tm_boss');
        assert.ok(boss && boss.big && boss.sprite === `mon:${info.boss}`, `${m.id} 主`);
        assert.ok(nextTo(reach, boss.x, boss.y + 1) || reach(boss.x, boss.y + 1), `${m.id} 主に 近づける`);
        const bossChests = m.chests.filter((c) => c.show);
        assert.equal(bossChests.length, 2, '主の 宝箱');
        assert.ok(m.triggers.some((t) => t.script === 'tm_boss'));
        // 主を たおすと: 主は きえ、宝箱と 出口に 行ける
        const flag = clearedFlag(tm.seed);
        const after = reachFrom(m, ax, ay, (x) => x === flag);
        for (const c of bossChests) assert.ok(nextTo(after, c.x, c.y), `${m.id} 主の 宝箱 ${c.id}`);
        const gate = m.gates[0];
        assert.ok(gate && after(gate.x, gate.y), `${m.id} 主の あとの 出口`);
        assert.ok(m.triggers.some((t) => t.script === 'tm_exit' && t.x === gate.x && t.y === gate.y && t.show?.all?.includes(flag)));
        assert.ok(m.zoneAt(boss.x, boss.y + 2).startsWith('safe'), '主の へやには 魔物が 出ない');
      }
      // 魔物
      const zone = Object.keys(m.spawnCounts)[0];
      assert.ok(ENCOUNTER_TABLES[zone]?.length >= 4, `${zone} の 魔物`);
      for (const e of ENCOUNTER_TABLES[zone]) for (const [sp] of e.group) assert.ok(MONSTERS[sp] && !MONSTERS[sp].boss, sp);
    }
  }
  assert.deepEqual([...themes].sort(), ['earth', 'ice', 'lava'], '3つの しゅるい');
  assert.ok(floorsSeen.has(2) && floorsSeen.has(6), `階の 数 ${[...floorsSeen]}`);
});

test('宝の地図: ほる 場所は ミドリナ地方（島）の 歩ける 地面で、町の 外。村から 行ける', () => {
  const ow = MAPS.overworld;
  for (let s = 1; s < 60; s++) {
    const spot = pickDigSpot(s * 7717, 'overworld');
    assert.equal(spot.map, 'overworld');
    assert.ok(WALK(ow, spot.x, spot.y), `${spot.x},${spot.y}`);
    assert.ok(!ow.zoneAt(spot.x, spot.y).startsWith('safe'), '町・村の 外');
    for (const p of Object.values(PLACES)) assert.ok(!(spot.x >= p.x && spot.y >= p.y && spot.x < p.x + p.w && spot.y < p.y + p.h));
  }
  const sea = MAPS.sea;
  for (let s = 1; s < 30; s++) {
    const spot = pickDigSpot(s * 4447, 'sea');
    const tile = tileAt(sea, spot.x, spot.y);
    assert.ok([T.GRASS, T.FLOWERS, T.SAND, T.HILL, T.TALLGRASS].includes(tile), `島の 地面 ${spot.x},${spot.y}`);
    assert.equal(sea.zoneAt(spot.x, spot.y), 'isle');
  }
  // 地図の 見た目の なまえ
  assert.match(tmTitle({ seed: 5, lv: 3 }), /の宝の地図 Lv3$/);
});

test('宝の地図: 第1章クリアの あと、宝探しのダイゴが 地図を くれる', async () => {
  const { world, bot, c } = await hero(3);
  const n = MAPS.overworld.npcById.tm_hunter;
  assert.ok(SCRIPTS.tm_hunter);
  assert.ok(!condOk(n.show, () => false), 'クリア前は いない');
  assert.ok(condOk(n.show, (f) => !!c.flags[f]));
  world.placeSession(bot.s, 'overworld', n.x + 0.5, n.y + 1.5, 'up');
  bot.map = 'overworld'; bot.x = n.x + 0.5; bot.y = n.y + 1.5;
  await bot.talk('tm_hunter');
  assert.equal(c.treasureMaps.length, 1, '1まい もらった');
  const tm = c.treasureMaps[0];
  assert.equal(tm.lv, 1);
  assert.equal(tm.map, 'overworld');
  assert.ok(c.flags.tm_intro);
  assert.ok(bot.msgs.some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'say' && /宝の地図 Lv1を手に入れた/.test(s[2]))));
  // もう いちど 話しても ふえない（まだ 宝を 見つけていない）
  await bot.talk('tm_hunter');
  assert.equal(c.treasureMaps.length, 1);
  // 村から 歩いて 行ける
  const reach = reachFrom(MAPS.overworld, POS.villagePlaza[0], POS.villagePlaza[1], () => true);
  assert.ok(reach(tm.x, tm.y), 'ほる 場所へ 行ける');
});

test('宝の地図: ほる → 洞窟へ → 出口 → また 入る → 主を たおす → 新しい 地図', { timeout: 120000 }, async () => {
  const { world, bot, c } = await hero(11);
  strong(c);
  const tm = grantTreasureMap(world, c, { lv: 2 });
  const info = caveInfo(tm.seed, tm.lv);
  // 場所から はなれて いると 何も ない
  world.placeSession(bot.s, 'overworld', tm.x + 6.5, tm.y + 0.5, 'down');
  Object.assign(bot, { map: 'overworld', x: tm.x + 6.5, y: tm.y + 0.5, seq: bot.s.posSeq });
  bot.send({ t: 'menu', action: 'tmap', op: 'dig', id: tm.id });
  assert.equal(bot.msgs.filter((m) => m.t === 'menuRes').pop().ok, false);
  assert.equal(bot.s.map, 'overworld');
  // 場所で しらべる → 入り口 → 洞窟の 1階
  world.placeSession(bot.s, 'overworld', tm.x + 0.5, tm.y + 1.5, 'up');
  Object.assign(bot, { map: 'overworld', x: tm.x + 0.5, y: tm.y + 1.5, seq: bot.s.posSeq });
  await bot.examine(tm.x, tm.y);
  assert.ok(tm.found, '見つけた');
  assert.ok(c.flags[foundFlag(tm.seed)]);
  assert.equal(bot.s.map, floorMapId(tm, 1), '洞窟の 1階');
  assert.ok(bot.msgs.some((m) => m.t === 'script' && m.steps.some((s) => s[0] === 'shake')));
  const f1 = MAPS[bot.s.map];
  // 1階の 宝箱を 開ける
  const ch = f1.chests[0];
  world.placeSession(bot.s, f1.id, ch.x + 0.5, ch.y + 0.5, 'down');
  const goldBefore = c.gold;
  const itemsBefore = JSON.stringify(c.items);
  await bot.examine(ch.x, ch.y);
  assert.ok(c.chests[ch.id], '宝箱を 開けた');
  assert.ok(c.gold > goldBefore || JSON.stringify(c.items) !== itemsBefore, '中みを もらった');
  // 出口へ 歩く → 地上の 地図の 場所
  Object.assign(bot, { map: f1.id, x: f1.tm.arrive.x, y: f1.tm.arrive.y, seq: bot.s.posSeq });
  world.placeSession(bot.s, f1.id, f1.tm.arrive.x, f1.tm.arrive.y, 'down');
  bot.seq = bot.s.posSeq;
  const exit = f1.triggers.find((t) => t.script === 'tm_exit');
  await bot.walkTo(exit.x, exit.y);
  await bot.settle();
  assert.equal(bot.s.map, 'overworld', '地上に もどった');
  assert.ok(Math.abs(bot.s.x - (tm.x + 0.5)) <= 1.6 && Math.abs(bot.s.y - (tm.y + 0.5)) <= 1.6, '地図の 場所の そば');
  // もう いちど しらべると「入りますか？」→ 入る
  bot.choice = 0;
  Object.assign(bot, { map: 'overworld', x: bot.s.x, y: bot.s.y, seq: bot.s.posSeq });
  await bot.examine(tm.x, tm.y);
  assert.equal(bot.s.map, floorMapId(tm, 1), 'また 入れる');
  // 階段で 下の 階へ
  const down = f1.warps.find((w) => w.to.map === floorMapId(tm, 2));
  world.placeSession(bot.s, f1.id, down.x + 0.5, down.y + 1.5, 'up');
  Object.assign(bot, { map: f1.id, x: down.x + 0.5, y: down.y + 1.5, seq: bot.s.posSeq });
  await bot.walkTo(down.x, down.y);
  assert.equal(bot.s.map, floorMapId(tm, 2), '地下2階');
  // さいごの 階の 主
  const last = MAPS[floorMapId(tm, info.floors)];
  const boss = last.npcById.tm_boss;
  world.placeSession(bot.s, last.id, boss.x + 0.5, boss.y + 2.5, 'up');
  Object.assign(bot, { map: last.id, x: boss.x + 0.5, y: boss.y + 2.5, seq: bot.s.posSeq });
  const before = c.treasureMaps.length;
  bot.send({ t: 'interact', kind: 'npc', id: 'tm_boss' });
  // 主の 戦い（ボスの 2回行動・強さを たしかめてから 早く おわらせる）
  for (let i = 0; i < 400 && !world.battles.size; i++) { bot.flushQueue(); await tickN(world, 1); }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '主と 戦う');
  const e = ctx.battle.enemies[0];
  assert.equal(e.species, info.boss);
  assert.equal(e.turns, 2, '1ターンに 2回');
  assert.ok(ctx.battle.boss && !ctx.battle.canFlee);
  assert.ok(e.maxHp > MONSTERS[info.boss].hp, '地図の レベルで 強くなる');
  for (const x of ctx.battle.enemies) x.hp = 1;
  await bot.settle();
  assert.equal(bot.battles.pop().outcome, 'win');
  assert.ok(c.flags[clearedFlag(tm.seed)], '主を たおした');
  assert.ok(tm.cleared);
  assert.equal(c.treasureMaps.length, before + 1, '新しい 地図');
  const next = c.treasureMaps[c.treasureMaps.length - 1];
  assert.ok(next.lv >= tm.lv && next.lv <= tm.lv + 2, `新しい 地図の レベル ${next.lv}`);
  assert.ok(ITEMS[MONSTERS[info.boss].drops.boss[0]].unique);
  assert.ok(c.items.some((it) => it.id === MONSTERS[info.boss].drops.boss[0]), '主の 品');
  // 主は いない・宝箱と 出口が ある
  const has = (f) => !!c.flags[f];
  assert.ok(!condOk(boss.show, has));
  for (const bc of last.chests.filter((x) => x.show)) assert.ok(condOk(bc.show, has));
  const gate = last.gates[0];
  world.placeSession(bot.s, last.id, gate.x + 0.5, gate.y + 1.5, 'up');
  Object.assign(bot, { map: last.id, x: gate.x + 0.5, y: gate.y + 1.5, seq: bot.s.posSeq });
  await bot.walkTo(gate.x, gate.y);
  await bot.settle();
  assert.equal(bot.s.map, 'overworld', '主の へやの 出口から 地上へ');
  // 帰り道の羽も 使える（洞窟の 中から）
  world.placeSession(bot.s, f1.id, f1.tm.arrive.x, f1.tm.arrive.y, 'down');
  c.items.push({ id: 'return_wing', n: 1 });
  c.visited.town = true;
  bot.send({ t: 'menu', action: 'useItem', id: 'return_wing', place: 'town' });
  assert.equal(bot.s.map, 'overworld', '帰り道の羽');
});

test('宝の地図: 洞窟の 中で ログインしなおしても 洞窟から 続けられる（わからない ときは 地上へ）', async () => {
  const { world, bot, c } = await hero(5);
  const tm = grantTreasureMap(world, c, { lv: 3 });
  tm.found = true;
  const f2 = MAPS[floorMapId(tm, 2)];
  // 2階の 歩ける ところで やめる
  let spot = null;
  for (let y = 0; y < f2.h && !spot; y++) for (let x = 0; x < f2.w && !spot; x++) if (WALK(f2, x, y) && tileAt(f2, x, y) === T.CAVE_FLOOR) spot = [x + 0.5, y + 0.5];
  world.placeSession(bot.s, f2.id, spot[0], spot[1], 'left');
  bot.send({ t: 'quit' });
  // セーブを 書いて 読みなおす（新しい サーバー）
  const saved = JSON.parse(JSON.stringify(world.data));
  const world2 = new GameWorld({ offline: true, rng: makeRng(9), rateLimit: false, data: saved });
  const bot2 = new Bot(world2, 'ソラ');
  await bot2.login();
  bot2.send({ t: 'play', id: c.id });
  await bot2.settle();
  assert.equal(bot2.map, f2.id, '洞窟の 2階から');
  assert.equal(bot2.x, spot[0]);
  assert.equal(world2.data.characters[c.id].treasureMaps.length, 1);
  // かべの 中に なって いたら 階の 入り口へ
  const c2 = world2.data.characters[c.id];
  bot2.send({ t: 'quit' });
  c2.pos = { map: f2.id, x: 0.5, y: 0.5, dir: 'down' };
  bot2.send({ t: 'play', id: c.id });
  assert.equal(bot2.map, f2.id);
  assert.deepEqual([bot2.x, bot2.y], [f2.tm.arrive.x, f2.tm.arrive.y], '入り口へ');
  // ない 階（あとで 形が かわった など）は 地上の 地図の 場所へ
  bot2.send({ t: 'quit' });
  c2.pos = { map: `${floorMapId(tm, 1).slice(0, -2)}_9`, x: 3.5, y: 3.5, dir: 'down' };
  bot2.send({ t: 'play', id: c.id });
  assert.equal(bot2.map, tm.map);
  assert.ok(Math.abs(bot2.x - tm.x) <= 2 && Math.abs(bot2.y - tm.y) <= 2, '地上の 地図の 場所');
  // こわれた ID は はじまりの 場所へ
  bot2.send({ t: 'quit' });
  c2.pos = { map: 'tm_??', x: 3.5, y: 3.5, dir: 'down' };
  bot2.send({ t: 'play', id: c.id });
  assert.equal(bot2.map, 'overworld');
});

test('宝の地図: 洞窟の 魔物は 地図の レベルで 強くなり、経験値も ふえる', async () => {
  const { world, bot, c } = await hero(13);
  strong(c, 30);
  const tm = grantTreasureMap(world, c, { lv: 6 });
  const f1 = MAPS[floorMapId(tm, 1)];
  world.placeSession(bot.s, f1.id, f1.tm.arrive.x, f1.tm.arrive.y, 'down');
  bot.map = f1.id;
  for (let i = 0; i < 200; i++) await tickN(world, 1, 200);
  const ms = world.mapStates.get(f1.id);
  assert.ok(ms.symbols.size > 0, '魔物が いる');
  const sym = [...ms.symbols.values()][0];
  world.placeSession(bot.s, f1.id, sym.x, sym.y, 'down');
  bot.s.invuln = 0;
  bot.send({ t: 'touch', id: sym.id });
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx, '戦い');
  const e = ctx.battle.enemies[0];
  const base = MONSTERS[e.species];
  assert.equal(e.lv, Math.round(f1.enemyLv));
  assert.ok(e.lv > base.lv && e.maxHp > base.hp && e.atk > base.str, `${e.species} が 強くなる`);
  const exp0 = c.exp;
  for (const x of ctx.battle.enemies) x.hp = 1;
  await bot.settle();
  const gained = c.exp - exp0;
  const baseExp = ctx.battle.result.killed.reduce((s, sp) => s + MONSTERS[sp].exp, 0);
  assert.ok(gained > baseExp, `経験値 ${gained} > ${baseExp}`);
  // 強さの きまり
  const m = scaleEnemy(enemyFromSpecies('skeleton'), 20);
  assert.equal(m.lv, 20);
  assert.ok(m.maxHp > 44 && m.atk > 35);
});

test('宝の地図: 戦いの あとで ときどき 拾う（第1章クリアの あと・強い 魔物ほど）', async () => {
  const { world, bot, c } = await hero(17);
  const s = bot.s;
  const fake = (fixed, enemyLv) => ({
    battle: { result: { outcome: 'win' }, boss: !!fixed, combatants: [{ side: 'enemy', lv: enemyLv, species: 'wolf' }] },
    opts: { fixed }, map: 'overworld',
  });
  world.rng = { ...world.rng, chance: () => true, next: () => 0.5 };
  const per = { [s.id]: { lines: [] } };
  treasureAfterBattle(world, fake(null, 14), [s], per);
  assert.equal(c.treasureMaps.length, 1);
  assert.ok(per[s.id].lines.some((l) => /宝の地図を拾った/.test(l)));
  assert.equal(c.treasureMaps[0].lv, 3, '魔物の 強さで レベルが きまる');
  // 第1章を クリアしていないと 拾わない
  delete c.flags.c1_clear;
  treasureAfterBattle(world, fake(null, 14), [s], { [s.id]: { lines: [] } });
  assert.equal(c.treasureMaps.length, 1);
  // 確率: 洞窟 > 強い 魔物 > ふつう。物語の ボスは 半分
  assert.ok(mapDropRate({ inCave: true }) > mapDropRate({ maxEnemyLv: 14, playerLv: 14 }));
  assert.ok(mapDropRate({ maxEnemyLv: 14, playerLv: 14 }) > mapDropRate({ maxEnemyLv: 5, playerLv: 20 }));
  assert.equal(mapDropRate({ fixed: true, boss: true }), 0.5);
  assert.ok(mapDropRate({ maxEnemyLv: 5, playerLv: 20 }) <= 1 / 150, 'ふつうは めったに 出ない');
});

test('宝の地図: いっぱい（20まい）・捨てる・セーブの 手直し・家族サーバーと 合わせる', async () => {
  const { world, bot, c } = await hero(19);
  for (let i = 0; i < TM_MAX; i++) assert.ok(grantTreasureMap(world, c, { lv: 1 }));
  assert.equal(grantTreasureMap(world, c, { lv: 1 }), null, 'いっぱい');
  c.treasureMaps[0].cleared = true;
  assert.ok(grantTreasureMap(world, c, { lv: 2 }), '主を たおした 地図と 入れかえ');
  assert.equal(c.treasureMaps.length, TM_MAX);
  // 捨てる（その 洞窟の 宝箱・フラグも わすれる）
  const tm = c.treasureMaps[1];
  c.chests[`tm_${tm.id}_1_0`] = true;
  c.flags[clearedFlag(tm.seed)] = true;
  c.chests.b1_a = true;
  bot.send({ t: 'menu', action: 'tmap', op: 'discard', id: tm.id });
  assert.ok(!c.treasureMaps.some((t) => t.id === tm.id));
  assert.ok(!c.chests[`tm_${tm.id}_1_0`] && !c.flags[clearedFlag(tm.seed)]);
  assert.ok(c.chests.b1_a, 'ほかの 宝箱は そのまま');
  // セーブの 手直し（こわれた 地図は すてる。前の 版の セーブは そのまま）
  const x = { treasureMaps: [{ seed: 5, lv: 99, map: 'overworld', x: 3, y: 4 }, { seed: 5, lv: 1, map: 'overworld', x: 1, y: 1 }, { seed: -1 }, null, { seed: 8, map: 'moon', x: 1, y: 1 }] };
  repairTreasureMaps(x);
  assert.deepEqual(x.treasureMaps, [{ id: '5', seed: 5, lv: TM_LV_MAX, map: 'overworld', x: 3, y: 4, found: false, cleared: false }]);
  const old = { characters: { a: { id: 'a', name: 'むかし', level: 3, flags: {}, items: [], equip: {} } } };
  const up = upgradeSave(old);
  assert.equal(up.data.characters.a.treasureMaps, undefined, '地図の ない セーブも 読める');
  // 合わせる: 両方で ふえた 地図は 両方、片方で 捨てた 地図は 捨てる、見つけた・たおしたは 合わせる
  const base = [{ id: 'a', seed: 10, lv: 1, map: 'overworld', x: 1, y: 1, found: false, cleared: false }, { id: 'b', seed: 11, lv: 1, map: 'overworld', x: 1, y: 1, found: false, cleared: false }];
  const ours = [{ ...base[0], found: true }, base[1], { id: 'c', seed: 12, lv: 2, map: 'overworld', x: 1, y: 1, found: false, cleared: false }];
  const theirs = [{ ...base[0], cleared: true }, { id: 'd', seed: 13, lv: 3, map: 'sea', x: 1, y: 1, found: false, cleared: false }];
  const merged = mergeTreasureMaps(base, ours, theirs);
  assert.deepEqual(merged.map((t) => t.id), ['a', 'c', 'd']);
  assert.ok(merged[0].found && merged[0].cleared);
  const cb = { id: 'z', name: 'Z', level: 5, exp: 100, gold: 0, flags: {}, items: [], equip: {}, treasureMaps: base };
  const r = mergeChars(cb, { ...cb, treasureMaps: ours, lastPlayed: 2 }, { ...cb, treasureMaps: theirs, lastPlayed: 1 });
  assert.deepEqual(r.treasureMaps.map((t) => t.id), ['a', 'c', 'd']);
});

test('宝の地図: 家族パーティーで いっしょに 洞窟へ 入り、主を たおすと みんなに 地図', { timeout: 120000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(23), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  for (const b of [papa, yui]) { await b.login('x'); await b.createAndPlay('warrior'); await b.settle(); }
  const P = world.sessions.get(papa.sid), Y = world.sessions.get(yui.sid);
  for (const s of [P, Y]) {
    for (const f of STORY_STEPS.slice(0, STORY_STEPS.indexOf('c1_clear') + 1)) s.char.flags[f] = true;
    strong(s.char);
  }
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  const tm = grantTreasureMap(world, P.char, { lv: 1 });
  world.placeSession(P, 'overworld', tm.x + 0.5, tm.y + 1.5, 'up');
  world.placeSession(Y, 'overworld', tm.x + 0.5, tm.y + 2.5, 'up');
  Y.follow = true;
  await papa.examine(tm.x, tm.y);
  await yui.settle();
  assert.equal(P.map, floorMapId(tm, 1));
  assert.equal(Y.map, P.map, 'ついてきた なかまも 洞窟へ');
  // 手伝いの ユイが 地上で しらべても、パパの 地図の 洞窟に 入れる
  world.placeSession(Y, 'overworld', tm.x + 0.5, tm.y + 1.5, 'up');
  yui.choice = 0;
  await yui.examine(tm.x, tm.y);
  assert.equal(Y.map, floorMapId(tm, 1), 'リーダーの 地図の 洞窟');
  // 主の へやで いっしょに 戦う
  const info = caveInfo(tm.seed, tm.lv);
  const last = MAPS[floorMapId(tm, info.floors)];
  const boss = last.npcById.tm_boss;
  world.placeSession(P, last.id, boss.x + 0.5, boss.y + 2.5, 'up');
  world.placeSession(Y, last.id, boss.x + 1.5, boss.y + 2.5, 'up');
  Y.follow = false;
  papa.send({ t: 'interact', kind: 'npc', id: 'tm_boss' });
  for (let i = 0; i < 400 && !world.battles.size; i++) { papa.flushQueue(); yui.flushQueue(); await tickN(world, 1); }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx && ctx.sids.includes(P.id) && ctx.sids.includes(Y.id), '2人で 戦う');
  for (const x of ctx.battle.enemies) x.hp = 1;
  for (let i = 0; i < 20; i++) { await papa.settle(); await yui.settle(); }
  assert.ok(P.char.flags[clearedFlag(tm.seed)]);
  assert.equal(P.char.treasureMaps.length, 2, 'パパに 新しい 地図');
  assert.equal(Y.char.treasureMaps.length, 1, 'ユイにも 地図');
  assert.ok(!Y.char.flags[clearedFlag(tm.seed)], 'ユイの ものがたりは かわらない');
});

test('宝の地図: 宝箱の 中みは 地図の レベルに あわせる（強すぎない 装備）', () => {
  const rng = makeRng(99);
  let rank = 0, gold = 0, n = 0;
  for (let i = 0; i < 3000; i++) {
    const lv = 1 + (i % TM_LV_MAX);
    const r = chestLoot(rng, lv, i % 3 === 0 ? 'bossA' : 'normal');
    n++;
    if (r.gold) { gold++; continue; }
    const it = ITEMS[r.item];
    assert.ok(it, r.item);
    assert.ok(!it.unique && it.type !== 'key', r.item);
    if (it.rank) {
      assert.ok(it.rank <= equipRankOf(lv), `${r.item} ランク${it.rank} (Lv${lv})`);
      rank = Math.max(rank, it.rank);
    }
  }
  assert.ok(gold > 0 && rank >= 3);
  assert.ok(n > 0);
});
