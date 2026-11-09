// 第71回: 階だんを 上り下り したら、行った 先の 階だんの 真上に 立つ（shared/world/stairs.js・world.js の onEnterTile）
//   家族の ねがい「階段の となりの マスから 始まるので、いとせず 階段を 往復して しまう」
//   ・ついた 階だんは 1歩 おりるまで つかわない（2マス はばの 階だんの となりの マスも）
//   ・とびら・洞窟の 入口・フィールドへの 出口は これまで どおり（マップの to は かえない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { stairsAt, stairsPair, stairsGroup, warpLanding, stepsTo } from '../public/js/shared/world/stairs.js';
import { dungeonExit } from '../public/js/shared/world/escape.js';
import { caveInfo, floorMapId } from '../public/js/shared/data/treasure.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

async function solo(seed = 71) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  bot.s.repelUntil = 1e15; // 魔物は よってこない
  return { world, bot, c: world.data.characters[bot.char.id] };
}
// (x, y) の マスへ おく（テレポート）
async function put(world, bot, map, x, y) {
  world.placeSession(bot.s, map, x + 0.5, y + 0.5, 'down');
  await bot.settle();
}
// となりの マスへ 1歩
async function step(world, bot, x, y) {
  bot.x = x + 0.5; bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'down', moving: true, seq: bot.seq });
  await tickN(world, 2);
  await bot.settle();
}
const tile = (bot) => [bot.map, Math.floor(bot.s.x), Math.floor(bot.s.y)];
const warpOf = (map, x, y) => MAPS[map].warps.find((w) => w.x === x && w.y === y);

test('第71回: なげきの洞窟（第1章）: 下りると 下の 階の 上り階だんの 上。1歩 おりて もどると 上の 階の 下り階だんの 上', async () => {
  const { world, bot } = await solo();
  // マップの データ（to）は これまで どおり（となりの マス）
  assert.deepEqual(warpOf('cave_b1', 43, 3).to, { map: 'cave_b2', x: 43.5, y: 32.6, dir: 'down' });
  assert.deepEqual(stairsPair('cave_b1', warpOf('cave_b1', 43, 3)), { x: 43.5, y: 31.5, tx: 43, ty: 31 });
  await put(world, bot, 'cave_b1', 43, 4);
  await step(world, bot, 43, 3);
  assert.deepEqual(tile(bot), ['cave_b2', 43, 31], '下の 階の 上り階だんの 上');
  assert.deepEqual([bot.x, bot.y], [43.5, 31.5], 'クライアントにも 階だんの 上と おしえる（setPos）');
  // そのまま まっても・同じ マスの 中で うごいても もどらない
  bot.send({ t: 'move', x: 43.3, y: 31.7, dir: 'left', moving: true, seq: bot.seq });
  await tickN(world, 5); await bot.settle();
  assert.deepEqual(tile(bot), ['cave_b2', 43, 31]);
  // 1歩 おりる → もどる と 上の 階へ（上の 階の 下り階だんの 上）
  await step(world, bot, 43, 32);
  assert.deepEqual(tile(bot), ['cave_b2', 43, 32], 'おりても まだ 地下2階');
  await step(world, bot, 43, 31);
  assert.deepEqual(tile(bot), ['cave_b1', 43, 3], '上の 階の 下り階だんの 上');
  // また 1歩 おりて もどると 下へ
  await step(world, bot, 43, 4);
  assert.deepEqual(tile(bot), ['cave_b1', 43, 4]);
  await step(world, bot, 43, 3);
  assert.deepEqual(tile(bot), ['cave_b2', 43, 31]);
});

test('第71回: 洞窟の 入口・フィールドへの 出口は これまで どおり（階だんの 上に のらない）・みちびきの糸の 出口も 同じ', async () => {
  const { world, bot } = await solo();
  // 洞窟の 外へ 出る ワープ（地下1階の 出口）は 階だんでは ない → to の まま
  const out = warpOf('cave_b1', 23, 34);
  assert.equal(stairsPair('cave_b1', out), null);
  assert.equal(warpLanding('cave_b1', out, () => true).stair, false);
  // 階だんから フィールドへ（井戸の 上り階だん・ほこらの 出口）も これまで どおり
  for (const [id, x, y] of [['north_well', 4, 1], ['toki_shrine_1f', 12, 15], ['sd_gate', 4, 1]]) {
    const w = warpOf(id, x, y);
    assert.ok(w && stairsAt(MAPS[id], x, y), id);
    assert.deepEqual(warpLanding(id, w, () => true), { ...w.to, stair: false }, `${id} は 出口`);
  }
  // 階だんで 下りた あとも、みちびきの糸（リレミト）は フィールドの 出口へ
  await put(world, bot, 'cave_b1', 43, 4);
  await step(world, bot, 43, 3);
  assert.equal(bot.map, 'cave_b2');
  const ex = dungeonExit(world, bot.s);
  assert.equal(ex.map, 'overworld', 'フィールドへ 出る');
  assert.ok(!MAPS[ex.map].warpAt.has(Math.floor(ex.y) * MAPS[ex.map].w + Math.floor(ex.x)), '出口の 上では ない');
});

test('第71回: 星の塔（第5章）: 階に 入った ときの ことばは 1回だけ（ついた ときに 出る・おりても もう 出ない）', async () => {
  const { world, bot, c } = await solo();
  const up = MAPS.star_tower_1f.warps.find((w) => w.to.map === 'star_tower_2f');
  const p = stairsPair('star_tower_1f', up);
  assert.ok(p, '2階の 下り階だん');
  assert.ok(!c.flags.c5_ev2);
  await put(world, bot, 'star_tower_1f', up.x, up.y + 1);
  await step(world, bot, up.x, up.y);
  assert.deepEqual(tile(bot), ['star_tower_2f', p.tx, p.ty], '2階の 下り階だんの 上');
  assert.ok(c.flags.c5_ev2, '「2階に 来た」の しかけは ついた ときに うごく');
  const runs = () => bot.msgs.filter((m) => m.t === 'script').length;
  const n0 = runs();
  // 階だんから 下りて これまでの つく マスへ → もう 出ない
  const to = up.to;
  await bot.walkTo(Math.floor(to.x), Math.floor(to.y));
  assert.equal(bot.map, 'star_tower_2f');
  assert.equal(runs(), n0, '2回 出ない');
});

test('第71回: 2マス はばの 階だん（カナトコ鉱山 第3章）: 横の 階だんの マスに 1歩 でも もどらない', async () => {
  const { world, bot } = await solo();
  const down = warpOf('mine2', 21, 2);
  const p = stairsPair('mine2', down);
  assert.deepEqual([p.tx, p.ty], [14, 21]);
  assert.deepEqual(stairsGroup(MAPS.mine3, 14, 21).length, 2, '2マス はば');
  await put(world, bot, 'mine2', 21, 3);
  await step(world, bot, 21, 2);
  assert.deepEqual(tile(bot), ['mine3', 14, 21]);
  await step(world, bot, 15, 21);
  assert.deepEqual(tile(bot), ['mine3', 15, 21], 'となりの 階だんの マスでも もどらない');
  await step(world, bot, 15, 20);
  await step(world, bot, 15, 21);
  assert.deepEqual(tile(bot), ['mine2', 21, 2], 'おりてから ふむと 上へ（上の 階の 下り階だんの 上）');
});

test('第71回: 氷の竜の城（第7章）・時計塔（第6章）: とびらが とじている 時は これまで どおり、ひらくと 階だんの 上', () => {
  // 第7章: 氷の竜の城 1階 → 2階（階だんが すこし はなれている）
  const up = warpOf('c7i_castle_1f', 15, 1);
  const L = warpLanding('c7i_castle_1f', up, () => false);
  assert.equal(L.stair, true);
  assert.deepEqual([Math.floor(L.x), Math.floor(L.y)], [4, 18]);
  assert.ok(stepsTo(MAPS.c7i_castle_2f, 4, 18, Math.floor(up.to.x), Math.floor(up.to.y), () => false) >= 0, 'これまでの つく マスへ 歩ける');
  // 第6章: 時計塔 6階 → 5階（5階の 上り階だんは 時計の とびらが ひらくまで ない）
  const w6 = warpOf('tokei_6f', 8, 22);
  assert.equal(warpLanding('tokei_6f', w6, () => false).stair, false, 'とびらが とじている → これまでの つく マス');
  assert.equal(warpLanding('tokei_6f', w6, () => true).stair, true, 'ひらいた → 階だんの 上');
  // 第5章: 影の城 5階 → 4階（4階の 上り階だんは 封印の とびらの おく。とじこめない）
  const w5 = warpOf('castle_5f', 6, 17);
  assert.equal(warpLanding('castle_5f', w5, () => false).stair, false, '封印が とじている → これまでの つく マス');
  assert.equal(warpLanding('castle_5f', w5, () => true).stair, true);
});

test('第71回: どの 階だんも ついた 階だんから これまでの つく マスへ 歩ける（しかけの マップも とける まま）', () => {
  let pairs = 0;
  const check = (id, w) => {
    const p = stairsPair(id, w);
    if (!p) return;
    pairs++;
    const dm = MAPS[w.to.map];
    for (const has of [() => true, () => false]) {
      const L = warpLanding(id, w, has);
      if (!L.stair) continue;
      assert.ok(!isBlocked(dm, p.tx, p.ty, has), `${id}→${w.to.map} 階だんに 立てる`);
      const n = stepsTo(dm, p.tx, p.ty, Math.floor(w.to.x), Math.floor(w.to.y), has);
      assert.ok(n >= 0 && n <= 4, `${id}(${w.x},${w.y})→${w.to.map} 階だんから これまでの つく マスへ ${n}歩`);
      // 行き先の 階だんは もとの マップへ もどる 階だん（ペア）
      assert.equal(dm.warpAt.get(p.ty * dm.w + p.tx).to.map, id);
    }
  };
  for (const [id, m] of Object.entries(MAPS)) for (const w of m.warps) if (stairsAt(m, w.x, w.y)) check(id, w);
  assert.ok(pairs >= 280, `階だんの ペア ${pairs}`);
  // 宝の洞窟（その場で つくる マップ。どの 階だんも ペア）
  let tm = 0;
  for (const seed of [3, 77, 1234]) {
    const spot = { seed, lv: 5, map: 'overworld', x: 40, y: 40 };
    for (let f = 1; f <= caveInfo(seed, 5).floors; f++) {
      const id = floorMapId(spot, f);
      for (const w of MAPS[id].warps) {
        assert.ok(stairsPair(id, w), `${id} の 階だんに ペア`);
        tm++;
        check(id, w);
      }
    }
  }
  assert.ok(tm >= 4, `宝の洞窟の 階だん ${tm}`);
});

test('第71回: 宝の洞窟: 下りて 上ると 上の 階の 下り階だんの 上', async () => {
  const { world, bot } = await solo();
  const spot = { seed: 77, lv: 5, map: 'overworld', x: 40, y: 40 };
  const id1 = floorMapId(spot, 1);
  const down = MAPS[id1].warps.find((w) => w.to.map === floorMapId(spot, 2));
  const p = stairsPair(id1, down);
  await put(world, bot, id1, down.x, down.y);
  // 階だんの 上に おかれた（テレポート）だけでは つかわない
  assert.equal(bot.map, id1);
  // となりの 歩ける マスへ おりて、もどる
  const nb = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([dx, dy]) => [down.x + dx, down.y + dy])
    .find(([x, y]) => !isBlocked(MAPS[id1], x, y, () => true) && !MAPS[id1].warpAt.has(y * MAPS[id1].w + x));
  await step(world, bot, ...nb);
  await step(world, bot, down.x, down.y);
  assert.deepEqual(tile(bot), [floorMapId(spot, 2), p.tx, p.ty], '地下2階の 上り階だんの 上');
  const back = stairsPair(floorMapId(spot, 2), MAPS[floorMapId(spot, 2)].warpAt.get(p.ty * MAPS[floorMapId(spot, 2)].w + p.tx));
  assert.deepEqual([back.tx, back.ty], [down.x, down.y], 'もどると 地下1階の 下り階だん');
});

test('第71回: ついていく 家族は 階だんの 上に おかれない・リーダーと いっしょに 来る', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(71), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const yui = new Bot(world, 'ユイ');
  await papa.login(); await yui.login();
  await papa.createAndPlay('warrior'); await yui.createAndPlay('mage');
  await papa.settle(); await yui.settle();
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle(); await yui.settle();
  const P = papa.s, Y = yui.s;
  P.repelUntil = Y.repelUntil = 1e15;
  world.placeSession(P, 'cave_b1', 43.5, 4.5, 'up');
  world.placeSession(Y, 'cave_b1', 43.5, 5.5, 'up');
  await papa.settle(); await yui.settle();
  Y.follow = true;
  await step(world, papa, 43, 3);
  await tickN(world, 4); await yui.settle();
  assert.deepEqual(tile(papa), ['cave_b2', 43, 31], 'リーダーは 階だんの 上');
  assert.equal(Y.map, 'cave_b2', 'ついてきた');
  const m = MAPS.cave_b2;
  assert.ok(!m.warpAt.has(Math.floor(Y.y) * m.w + Math.floor(Y.x)), `家族は 階だんの 上では ない（${Y.x},${Y.y}）`);
  assert.ok(Math.hypot(Y.x - P.x, Y.y - P.y) <= 2.3, 'リーダーの そば');
  // ほかの 人の 画面にも 階だんの 上に 見える（いちの おしらせ）
  await tickN(world, 6);
  const snap = yui.msgs.filter((x) => x.t === 'snap' && x.map === 'cave_b2').pop();
  const me = snap?.players?.find((x) => x.sid === papa.sid);
  assert.ok(me, 'いちの おしらせが とどく');
  assert.deepEqual([Math.floor(me.x), Math.floor(me.y)], [43, 31]);
});

test('第71回: クライアント: ついていく 時は 出入り口を ふまない・漢字と スペース', () => {
  const src = readFileSync(new URL('../public/js/client/field.js', import.meta.url), 'utf8');
  assert.match(src, /if \(this\.followAuto && this\.warpBlocks\(x, y\)\) return false;/);
  assert.match(src, /this\.followAuto = true;/);
  assert.match(src, /solidAt\(nx, ny\) \|\| this\.map\.warpAt\?\.has\(k\)/, 'つまった ときの みちさがしも 出入り口を よける');
  assert.match(src, /!onWarp && \(!last/, '出入り口は パンくずに しない');
  const w = readFileSync(new URL('../public/js/shared/world/world.js', import.meta.url), 'utf8');
  assert.match(w, /warpLanding\(fromMap, warp, this\.hasFlagFn\(s\)\)/);
  assert.match(w, /this\.checkTriggers\(s, Math\.floor\(to\.x\), Math\.floor\(to\.y\)\)/, 'ついた ときの しかけは これまでの マスで');
  for (const f of ['public/js/shared/world/stairs.js', 'public/js/shared/world/world.js', 'public/js/client/field.js']) {
    const res = checkFile(new URL(`../${f}`, import.meta.url).pathname).filter((x) => x.kind !== 'kana');
    assert.deepEqual(res, [], `${f} の 漢字・スペース`);
  }
});
