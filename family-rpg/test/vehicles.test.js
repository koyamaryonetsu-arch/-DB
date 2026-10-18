// 第37回 C: 乗り物（乗り物屋・メニューの「乗り物」・走る時だけ 乗る・仲間は かかない・マルチプレイ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction, menuAction } from '../public/js/shared/world/services.js';
import { MAPS, BOARD_NAMES } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { JOBS, ALL_JOBS } from '../public/js/shared/data/jobs.js';
import { upgradeSave, repairChar } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import {
  VEHICLES, VEHICLE_ORDER, vehicleShelf, ownedVehicles, chosenVehicle, buyVehicle, chooseVehicle, cleanVehicles, rideShown, jobsEver,
} from '../public/js/shared/data/vehicles.js';
import { vehicleSnap } from '../public/js/shared/world/vehicles.js';
import { VEHICLE_ART, VIEWS, viewOf, paintVehicle, paintVehicleFx, riderSpot, vehicleFrames, vehicleSize, vehicleRiderFx, RIDER_H } from '../public/js/client/render/vehicle-art.js';
import { Field } from '../public/js/client/field.js';
import { BOARD_KINDS } from '../public/js/client/render/boards.js';
import { T } from '../public/js/shared/tiles.js';
import { Bot, tickN } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const lit = (p) => (p ? p.px.filter(Boolean).length : 0);

async function player(name = 'ハル', job = 'warrior', world = new GameWorld({ offline: true, rng: makeRng(37), rateLimit: false })) {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  return { world, bot, c };
}
const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();

test('乗り物: すべての 職業（117）に、その 系統の 乗り物が 1つ 以上 ある', () => {
  assert.equal(ALL_JOBS.length, Object.keys(JOBS).length);
  for (const j of ALL_JOBS) assert.ok(VEHICLE_ORDER.some((id) => VEHICLES[id].jobs?.includes(j)), `${j}（${JOBS[j].name}）の 乗り物が ない`);
  // 知らない 職業は 書かない・ふつうの 乗り物も いくつか ある
  for (const id of VEHICLE_ORDER) for (const j of VEHICLES[id].jobs || []) assert.ok(JOBS[j], `${id}: ${j}`);
  const generic = VEHICLE_ORDER.filter((id) => !VEHICLES[id].jobs);
  assert.ok(generic.length >= 4, `ふつうの 乗り物 ${generic.length}`);
  assert.ok(VEHICLE_ORDER.length >= 45, `ぜんぶで ${VEHICLE_ORDER.length}`);
  // 例に 出た 乗り物
  assert.ok(VEHICLES.bukujutsu.jobs.includes('saiyan'));
  assert.ok(VEHICLES.white_horse.jobs.includes('abarenbo_shogun'));
  assert.ok(VEHICLES.skateboard.jobs.includes('shonen_tantei'));
  for (const id of VEHICLE_ORDER) {
    const v = VEHICLES[id];
    assert.ok(v.name && v.desc, id);
    assert.ok(Number.isInteger(v.price) && v.price >= 100 && v.price <= 20000, `${id} ${v.price}`);
  }
});

test('乗り物: 職業の 乗り物は、その 職業に 1度でも なった 人の たなに だけ 出る', () => {
  const c = { job: 'warrior', jobs: { warrior: { lv: 1 } } };
  const shelf = vehicleShelf(c);
  for (const id of VEHICLE_ORDER.filter((x) => !VEHICLES[x].jobs)) assert.ok(shelf.includes(id), `ふつうの ${id}`);
  assert.ok(shelf.includes('armor_horse'), '戦士の 系統');
  for (const id of ['bukujutsu', 'white_horse', 'skateboard', 'dark_throne', 'propeller']) assert.ok(!shelf.includes(id), `${id} は まだ 出ない`);
  // 前に なった 職業も 数える（今は ちがう 職業）
  const c2 = { job: 'priest', jobs: { priest: { lv: 3 }, saiyan: { lv: 10 }, shonen_tantei: { lv: 1 } } };
  assert.deepEqual([...jobsEver(c2)].sort(), ['priest', 'saiyan', 'shonen_tantei']);
  const s2 = vehicleShelf(c2);
  for (const id of ['bukujutsu', 'skateboard', 'pegasus']) assert.ok(s2.includes(id), id);
  assert.ok(!s2.includes('armor_horse'));
  // 上の 職業だけ（ss3）でも その 系統の 乗り物は 出る。もう 持っている 物は いつでも 出る
  assert.ok(vehicleShelf({ job: 'ss3', jobs: { ss3: {} } }).includes('bukujutsu'));
  assert.ok(vehicleShelf({ job: 'warrior', jobs: {}, vehicles: ['dark_throne'] }).includes('dark_throne'));
});

test('乗り物: 買う・持っている・えらぶ・乗らない（きまり）', () => {
  const c = { job: 'warrior', jobs: { warrior: {} }, gold: 1000 };
  assert.equal(buyVehicle(c, 'nope').ok, false);
  assert.equal(buyVehicle(c, 'skateboard').ok, false, 'たなに ない');
  assert.equal(buyVehicle(c, 'horse').ok, false, 'お金が たりない');
  assert.equal(c.gold, 1000);
  assert.equal(buyVehicle(c, 'bicycle').ok, true);
  assert.equal(c.gold, 1000 - VEHICLES.bicycle.price);
  assert.equal(buyVehicle(c, 'bicycle').ok, false, '2回は 買わない');
  assert.equal(c.gold, 1000 - VEHICLES.bicycle.price);
  assert.deepEqual(ownedVehicles(c), ['bicycle']);
  assert.equal(chosenVehicle(c), null, '買っただけでは 乗らない');
  assert.equal(chooseVehicle(c, 'horse').ok, false, '持っていない');
  assert.equal(chooseVehicle(c, 'bicycle').ok, true);
  assert.equal(chosenVehicle(c), 'bicycle');
  assert.equal(chooseVehicle(c, null).ok, true);
  assert.equal(chosenVehicle(c), null);
});

test('乗り物屋: ルミナの町に 店の人と かんばん。話しかけると たなが 出る', async () => {
  const map = MAPS.overworld;
  const npc = map.npcById.vehicle_keeper;
  assert.ok(npc);
  assert.equal(map.areaName(npc.x, npc.y), 'ルミナの町');
  assert.deepEqual(SCRIPTS[npc.script]({}), [['vehicles']]);
  assert.equal(BOARD_NAMES.vehicle, '乗り物屋');
  assert.ok(BOARD_KINDS.includes('vehicle'));
  const board = map.boards.find((b) => b.kind === 'vehicle');
  assert.ok(board && Math.abs(board.x - npc.x) <= 3 && Math.abs(board.y - npc.y) <= 3, 'かんばんは 店の 前');
  assert.ok(map.roofs.some((r) => npc.x >= r.x && npc.x < r.x + r.w && npc.y >= r.y && npc.y < r.y + r.h), 'やねが ある');
  const { world, bot } = await player();
  world.placeSession(bot.s, 'overworld', npc.x + 0.5, npc.y + 1.5, 'up');
  bot.send({ t: 'interact', kind: 'npc', id: 'vehicle_keeper' });
  await new Promise((r) => setImmediate(r));
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'ui');
  assert.ok(ui && ui[1] === 'vehicles', JSON.stringify(ui));
  assert.equal(ui[2].name, 'ルミナの乗り物屋');
  assert.ok(ui[2].shelf.includes('horse') && ui[2].shelf.includes('armor_horse') && !ui[2].shelf.includes('bukujutsu'));
  await bot.settle();
  // 店の 人の 2マス 下が とびら、その 下は 町の 道
  assert.equal(map.tiles[(npc.y + 2) * map.w + npc.x], T.DOOR);
  assert.equal(map.tiles[(npc.y + 3) * map.w + npc.x], T.STONE_PATH);
});

test('乗り物屋: サーバーで 買う → 乗る → メニューで 乗りかえ・乗らない', async () => {
  const { world, bot, c } = await player();
  c.gold = 3000;
  // 店に 入らずに 買おうと しても だめ
  serviceAction(world, bot.s, { kind: 'vehicles', action: 'buy', id: 'horse' });
  assert.equal(lastSvc(bot).ok, false);
  assert.equal(c.gold, 3000);
  openService(world, bot.s, 'vehicles');
  serviceAction(world, bot.s, { kind: 'vehicles', action: 'buy', id: 'horse' });
  let r = lastSvc(bot);
  assert.equal(r.ok, true, r.text);
  assert.equal(c.gold, 3000 - VEHICLES.horse.price);
  assert.deepEqual(r.owned, ['horse']);
  assert.deepEqual(bot.char.vehicles, ['horse'], '自分にも とどく');
  serviceAction(world, bot.s, { kind: 'vehicles', action: 'buy', id: 'bukujutsu' });
  assert.equal(lastSvc(bot).ok, false, 'たなに ない 物は 買えない');
  serviceAction(world, bot.s, { kind: 'vehicles', action: 'buy', id: 'kickboard', ride: true });
  r = lastSvc(bot);
  assert.equal(r.ok, true);
  assert.equal(c.vehicle, 'kickboard', '買って すぐ 乗る');
  serviceAction(world, bot.s, { kind: 'vehicles', action: 'ride', id: 'horse' });
  assert.equal(c.vehicle, 'horse');
  // メニュー
  bot.send({ t: 'menu', action: 'vehicle', id: 'kickboard' });
  assert.equal(lastMenu(bot).ok, true);
  assert.equal(c.vehicle, 'kickboard');
  bot.send({ t: 'menu', action: 'vehicle', id: 'carpet' });
  assert.equal(lastMenu(bot).ok, false, '持っていない');
  assert.equal(c.vehicle, 'kickboard');
  menuAction(world, bot.s, { action: 'vehicle', id: null });
  assert.equal(c.vehicle, null, '乗らない');
  assert.deepEqual(ownedVehicles(c), ['kickboard', 'horse'], '持っている 物は そのまま');
});

test('乗り物: セーブに のこる。むかしの セーブ・おかしな 値も 読める', () => {
  // むかしの セーブ（乗り物の 項目が ない）
  const old = { version: 4, characters: { a: { id: 'a', name: 'ハル', job: 'warrior', jobs: { warrior: { lv: 1, b: 0 } }, level: 3, gold: 10, items: [], equip: {} } } };
  const a = upgradeSave(JSON.parse(JSON.stringify(old))).data.characters.a;
  assert.deepEqual(a.vehicles, []);
  assert.equal(a.vehicle, null);
  // 知らない 乗り物（あとの 版の 物）は けさない。持っていない 物に 乗っている ことには しない
  const b = repairChar({ ...JSON.parse(JSON.stringify(old.characters.a)), vehicles: ['horse', 'future_rocket', 'horse', 5, null], vehicle: 'carpet' });
  assert.deepEqual(b.vehicles, ['horse', 'future_rocket']);
  assert.equal(b.vehicle, null);
  assert.deepEqual(ownedVehicles(b), ['horse'], '一覧には 知っている 物だけ');
  const c = repairChar({ ...JSON.parse(JSON.stringify(old.characters.a)), vehicles: ['horse'], vehicle: 'horse' });
  assert.equal(c.vehicle, 'horse');
  assert.deepEqual(repairChar(JSON.parse(JSON.stringify(c))), c, '何回 読んでも おなじ');
  assert.equal(chosenVehicle({ vehicles: ['future_rocket'], vehicle: 'future_rocket' }), null);
  // 魔物の 仲間には つけない
  const mon = cleanVehicles({ species: 'pururin' });
  assert.equal(mon.vehicles, undefined);
  // スマホと 家族サーバーで べつべつに 買った: 両方 持っている
  const base = { id: 'x', name: 'ハル', vehicles: ['bicycle'], vehicle: 'bicycle', exp: 0 };
  const ours = { ...base, vehicles: ['bicycle', 'horse'], vehicle: 'horse' };
  const theirs = { ...base, vehicles: ['bicycle', 'kickboard'], vehicle: 'bicycle' };
  const m = mergeChars(base, ours, theirs);
  assert.deepEqual([...m.vehicles].sort(), ['bicycle', 'horse', 'kickboard']);
});

test('乗り物: 走っている 時だけ 乗る。船・大鳥・竜・トロッコの 時は そちらが 先', () => {
  assert.equal(rideShown('horse', { running: true }), 'horse');
  assert.equal(rideShown('horse', { running: false }), null, '歩く・止まる');
  assert.equal(rideShown(null, { running: true }), null, '乗らない');
  assert.equal(rideShown('nope', { running: true }), null);
  for (const k of ['ship', 'air', 'cart', 'hidden']) assert.equal(rideShown('horse', { running: true, [k]: true }), null, k);
  // サーバーの いちの じょうほう
  const p = { moving: true, running: true, char: { vehicles: ['horse'], vehicle: 'horse' } };
  assert.equal(vehicleSnap(p), 'horse');
  assert.equal(vehicleSnap({ ...p, running: false }), null);
  assert.equal(vehicleSnap({ ...p, moving: false }), null);
  assert.equal(vehicleSnap({ ...p, flying: true }), null, '大鳥・竜');
  assert.equal(vehicleSnap({ ...p, busy: 'battle' }), null);
  // 自分（client/field.js）
  const mk = (over = {}) => Object.assign(Object.create(Field.prototype), {
    me: { x: 10.5, y: 10.5, moving: true, running: true }, riding: null, hideMe: false,
    map: { ...MAPS.overworld }, game: { me: { vehicles: ['horse'], vehicle: 'horse' }, sky: { flying: false, anim: null, ridingAlong: () => false } },
    isOnWater: () => false,
  }, over);
  assert.equal(mk().myVehicle(), 'horse');
  assert.equal(mk({ me: { x: 1, y: 1, moving: true, running: false } }).myVehicle(), null, '歩く');
  assert.equal(mk({ me: { x: 1, y: 1, moving: false, running: false } }).myVehicle(), null, '止まる');
  assert.equal(mk({ isOnWater: () => true }).myVehicle(), null, '船');
  assert.equal(mk({ riding: { cart: 1 } }).myVehicle(), null, 'トロッコ');
  assert.equal(mk({ game: { me: { vehicles: ['horse'], vehicle: 'horse' }, sky: { flying: true } } }).myVehicle(), null, '大鳥・竜');
  assert.equal(mk({ hideMe: true }).myVehicle(), null);
  // ほかの 人
  const f = mk();
  assert.equal(f.otherVehicle({ x: 3, y: 3, moving: true, vh: 'horse' }), 'horse');
  assert.equal(f.otherVehicle({ x: 3, y: 3, moving: false, vh: 'horse' }), null);
  assert.equal(f.otherVehicle({ x: 3, y: 3, moving: true, vh: 'horse', air: true }), null);
  assert.equal(f.otherVehicle({ x: 3, y: 3, moving: true, vh: null }), null);
});

test('乗り物: 乗っている 間は 仲間・馬車・ほかの 人の 仲間を かかない（2D と 2.5D）', () => {
  const s = src('js/client/field.js');
  // 2D: 自分の 仲間 / ほかの 人の 仲間
  assert.match(s, /const fl = this\.myVehicle\(\) \? \[\] : this\.myFollowers\(\);/);
  assert.match(s, /if \(tp && !o\.air && !this\.otherVehicle\(o\) && !this\.isOnWater/);
  // 2.5D
  assert.match(s, /\(myVeh \? \[\] : this\.myFollowers\(\)\)\.forEach/);
  assert.match(s, /if \(oVeh\) return;/);
  // 馬車
  const w = src('js/client/render/wagon.js');
  assert.match(w, /field\.myFollowers\(\)\.length, !!field\.myVehicle\?\.\(\)\)/);
  assert.match(w, /!!field\.otherVehicle\?\.\(o\)\)/);
  assert.match(w, /if \(!pos \|\| hide\) return;/);
  // 走っている ことを サーバーに おくる
  assert.match(s, /run: !!me\.running/);
});

test('乗り物: マルチプレイ: ひとりずつ 自分の 乗り物が ほかの 人に とどく', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const a = await player('アオ', 'warrior', world);
  const b = await player('ベニ', 'priest', world);
  a.c.vehicles = ['horse']; a.c.vehicle = 'horse';
  b.c.vehicles = ['pegasus', 'bicycle']; b.c.vehicle = 'bicycle';
  world.placeSession(a.bot.s, 'overworld', 60.5, 70.5, 'down');
  world.placeSession(b.bot.s, 'overworld', 62.5, 70.5, 'down');
  await tickN(world, 2);
  const snapOf = (bot, sid) => bot.msgs.filter((m) => m.t === 'snap').pop()?.players.find((p) => p.sid === sid);
  const move = (bot, x, run) => bot.send({ t: 'move', x, y: 70.5, dir: 'right', moving: true, run, seq: bot.s.posSeq });
  move(a.bot, 60.6, true);
  move(b.bot, 62.6, true);
  await tickN(world, 3, 50);
  assert.equal(snapOf(b.bot, a.bot.s.id)?.vh, 'horse', 'アオは 馬');
  assert.equal(snapOf(a.bot, b.bot.s.id)?.vh, 'bicycle', 'ベニは 自転車');
  // 歩くと 乗らない
  move(a.bot, 60.7, false);
  await tickN(world, 3, 50);
  assert.equal(snapOf(b.bot, a.bot.s.id)?.vh, undefined);
  // 止まると 乗らない
  a.bot.send({ t: 'move', x: 60.7, y: 70.5, dir: 'right', moving: false, run: true, seq: a.bot.s.posSeq });
  await tickN(world, 3, 50);
  assert.equal(snapOf(b.bot, a.bot.s.id)?.vh, undefined);
  // 乗らない に したら とどかない
  move(b.bot, 62.7, true);
  b.bot.send({ t: 'menu', action: 'vehicle', id: null });
  await tickN(world, 3, 50);
  assert.equal(snapOf(a.bot, b.bot.s.id)?.vh, undefined);
});

test('乗り物の 絵: すべての 乗り物に 4方向（よこは はんてん）× 2〜3コマの 絵と、乗る 人の いちが ある', () => {
  assert.deepEqual(['down', 'left', 'up', 'right'].map(viewOf), ['front', 'side', 'back', 'side']);
  for (const id of VEHICLE_ORDER) {
    assert.ok(VEHICLE_ART[id], `${id} の 絵`);
    const n = vehicleFrames(id);
    assert.ok(n >= 2 && n <= 3, `${id} コマ ${n}`);
    for (const view of VIEWS) {
      const [w, h] = vehicleSize(id, view);
      assert.ok(w >= 24 && w <= 96 && h >= 40 && h <= 72, `${id} ${view} ${w}x${h}`);
      const frames = [];
      for (let f = 0; f < n; f++) {
        const px = lit(paintVehicle(id, view, f, 'back')) + lit(paintVehicle(id, view, f, 'front')) + lit(paintVehicleFx(id, view, f));
        assert.ok(px > 0 || vehicleRiderFx(id), `${id} ${view} ${f}: 絵が ない`);
        assert.ok(px > 0 || paintVehicleFx(id, view, f) || vehicleRiderFx(id), `${id} ${view} ${f}`);
        frames.push([...(paintVehicle(id, view, f, 'front')?.px || [])].join() + [...(paintVehicleFx(id, view, f)?.px || [])].join() + JSON.stringify(riderSpot(id, view, f)));
        const R = riderSpot(id, view, f);
        assert.ok(R && Number.isFinite(R.x) && Number.isFinite(R.y), `${id} ${view} 人の いち`);
        // 人は 絵の 中（足もとより 下に はみ出さない・よこは まんなか あたり）
        const bottom = R.y + Math.min(RIDER_H, R.crop ?? RIDER_H);
        assert.ok(bottom <= h, `${id} ${view} ${f}: 人が 下に はみ出す ${bottom} > ${h}`);
        assert.ok(R.x + 16 > 0 && R.x + 16 < w, `${id} ${view}: 人が よこに はみ出す`);
      }
      // うごき: コマで 絵が かわる
      assert.ok(new Set(frames).size >= 2, `${id} ${view}: コマが みな おなじ`);
    }
  }
});
