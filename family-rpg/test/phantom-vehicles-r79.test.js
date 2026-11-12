// 第79回: 幻の職業の 乗り物（data/vehicles-phantom.js・render/vehicle-phantom.js。docs/plan-r79-phantom-vehicles.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction } from '../public/js/shared/world/services.js';
import { JOBS, PHANTOM_ORDER, LEGEND_ORDER } from '../public/js/shared/data/jobs.js';
import { PHANTOM_VEHICLES } from '../public/js/shared/data/vehicles-phantom.js';
import { VEHICLES, VEHICLE_ORDER, vehicleShelf, buyVehicle, chooseVehicle, chosenVehicle, rideShown } from '../public/js/shared/data/vehicles.js';
import { VEHICLE_ART, VIEWS, paintVehicle, paintVehicleFx, riderSpot, vehicleFrames, vehicleSize, RIDER_H } from '../public/js/client/render/vehicle-art.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { vehicleSnap } from '../public/js/shared/world/vehicles.js';
import { Bot } from './helpers.js';

const IDS = Object.keys(PHANTOM_VEHICLES);
const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
const legendIds = () => VEHICLE_ORDER.filter((id) => !VEHICLES[id].phantom && VEHICLES[id].jobs?.some((j) => LEGEND_ORDER.includes(j)));

test('第79回: 幻の職業の 乗り物は 12こ。幻の職業と 1対1', () => {
  assert.equal(IDS.length, 12);
  assert.equal(PHANTOM_ORDER.length, 12);
  const owner = new Map();
  for (const id of IDS) {
    const v = VEHICLES[id];
    assert.ok(v, `${id} が VEHICLES に まざっている`);
    assert.equal(v.phantom, true, id);
    assert.equal(v.jobs.length, 1, `${id}: 幻の職業 1つだけ`);
    const j = v.jobs[0];
    assert.ok(PHANTOM_ORDER.includes(j) && JOBS[j], `${id}: ${j} は 幻の職業`);
    assert.ok(!owner.has(j), `${j} に 2つ`);
    owner.set(j, id);
    assert.ok(v.name && v.desc && !/\s/.test(v.name) && !/\s/.test(v.desc), `${id} 名前と せつめい（空白なし）`);
    assert.ok(!v.gift, `${id} は 店で 売る`);
  }
  for (const j of PHANTOM_ORDER) assert.ok(owner.has(j), `${j}（${JOBS[j].name}）の 幻の乗り物が ない`);
  // 名前は ほかの 乗り物と かぶらない
  const names = VEHICLE_ORDER.map((id) => VEHICLES[id].name);
  assert.equal(new Set(names).size, names.length);
});

test('第79回: ねだんは 伝説の 乗り物より 上（20000〜30000G）。強さの 数字は 足さない', () => {
  const legendMax = Math.max(...legendIds().map((id) => VEHICLES[id].price));
  assert.ok(legendMax >= 8000 && legendMax < 20000, `伝説の 乗り物の いちばん 高い ${legendMax}`);
  const otherMax = Math.max(...VEHICLE_ORDER.filter((id) => !VEHICLES[id].phantom).map((id) => VEHICLES[id].price));
  for (const id of IDS) {
    const v = VEHICLES[id];
    assert.ok(Number.isInteger(v.price) && v.price >= 20000 && v.price <= 30000, `${id} ${v.price}`);
    assert.ok(v.price >= otherMax, `${id} は 今の いちばん 高い 乗り物（${otherMax}）より 下でない`);
    // 速さなど 強さに かかわる 項目は ない（乗り物は 絵だけ。ほかの 乗り物と おなじ）
    assert.deepEqual(Object.keys(v).sort(), ['desc', 'jobs', 'name', 'phantom', 'price']);
  }
  // 今の 乗り物にも 強さの 項目は ない（くらべる 物さし）
  for (const id of VEHICLE_ORDER) for (const k of ['speed', 'spd', 'atk', 'def', 'agi', 'luck']) assert.ok(!(k in VEHICLES[id]), `${id}.${k}`);
});

test('第79回: その 幻の職業に なった ことが ある 人の 店に だけ 出る', () => {
  // まだ なって いない（もとの 伝説の 職業だけ）: 出ない
  const before = { job: 'nika', jobs: { nika: { lv: 10 }, pirate: { lv: 10 }, hakaishin: { lv: 3 } } };
  const s0 = vehicleShelf(before);
  for (const id of IDS) assert.ok(!s0.includes(id), `${id} は まだ 出ない`);
  assert.equal(buyVehicle({ ...before, gold: 99999 }, 'sky_galleon').ok, false, 'たなに ない 物は 買えない');
  for (const j of PHANTOM_ORDER) {
    // 今 その 職業 / 前に なった（今は ちがう）
    for (const c of [{ job: j, jobs: { [j]: { lv: 1 } } }, { job: 'warrior', jobs: { warrior: {}, [j]: { lv: 3 } } }]) {
      const s = vehicleShelf(c);
      const mine = IDS.filter((id) => s.includes(id));
      assert.deepEqual(mine, IDS.filter((id) => VEHICLES[id].jobs.includes(j)), `${j}: 自分の 1つだけ`);
    }
  }
  // 2つの 幻の職業に なった 人は 2つ
  const two = vehicleShelf({ job: 'weather_god', jobs: { weather_god: {}, cosmic_okan: {} } });
  assert.deepEqual(IDS.filter((id) => two.includes(id)).sort(), ['rocket_mamachari', 'typhoon_eye']);
  // 買う・乗る（持ち方は 今の まま。セーブを 読みなおしても のこる）
  const c = { job: 'cosmic_okan', jobs: { cosmic_okan: {} }, gold: 25000 };
  assert.equal(buyVehicle(c, 'rocket_mamachari').ok, true);
  assert.equal(c.gold, 5000);
  assert.equal(chooseVehicle(c, 'rocket_mamachari').ok, true);
  assert.equal(chosenVehicle(c), 'rocket_mamachari');
  assert.equal(rideShown('rocket_mamachari', { running: true }), 'rocket_mamachari');
  const r = repairChar({ id: 'x', name: 'ママ', job: 'okan', jobs: { okan: {} }, level: 1, gold: 0, items: [], equip: {}, vehicles: ['rocket_mamachari'], vehicle: 'rocket_mamachari' });
  assert.deepEqual(r.vehicles, ['rocket_mamachari']);
  assert.equal(r.vehicle, 'rocket_mamachari');
  // ほかの 人の 画面にも とどく（いちの じょうほう vh。絵は 自分と おなじ vehicleCanvas）
  assert.equal(vehicleSnap({ moving: true, running: true, char: c }), 'rocket_mamachari');
  // 持っている 物は 職業を かえても たなに 出る
  assert.ok(vehicleShelf({ job: 'warrior', jobs: { warrior: {} }, vehicles: ['rocket_mamachari'] }).includes('rocket_mamachari'));
});

test('第79回: 乗り物屋（サーバー）: なった 人の たなに 出て 買える・なって いない 人には 名前も とどかない', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(79), rateLimit: false });
  const mk = async (name) => {
    const bot = new Bot(world, name);
    await bot.login();
    await bot.createAndPlay('warrior');
    await bot.settle();
    return { bot, c: world.data.characters[bot.char.id] };
  };
  const a = await mk('アオ');
  const b = await mk('ベニ');
  a.c.jobs.pirate_king = { lv: 1 };
  a.c.gold = 30000;
  b.c.gold = 30000;
  const ia = openService(world, a.bot.s, 'vehicles');
  const ib = openService(world, b.bot.s, 'vehicles');
  const sa = ia?.shelf, sb = ib?.shelf;
  assert.ok(sa?.includes('sky_galleon'), JSON.stringify(sa));
  assert.ok(sb && !sb.includes('sky_galleon'));
  for (const id of IDS) assert.ok(!sb.includes(id), `ベニの たなに ${id}`);
  const raw = JSON.stringify(ib) + JSON.stringify(b.bot.msgs);
  for (const id of IDS) assert.ok(!raw.includes(VEHICLES[id].name), `ベニに ${VEHICLES[id].name} の 名前が とどいた`);
  serviceAction(world, b.bot.s, { kind: 'vehicles', action: 'buy', id: 'sky_galleon' });
  assert.equal(b.c.gold, 30000, '買えない');
  serviceAction(world, a.bot.s, { kind: 'vehicles', action: 'buy', id: 'sky_galleon', ride: true });
  assert.equal(a.c.gold, 30000 - VEHICLES.sky_galleon.price);
  assert.deepEqual(a.c.vehicles, ['sky_galleon']);
  assert.equal(a.c.vehicle, 'sky_galleon');
});

test('第79回: 絵: 12こ すべて 4方向 × 3コマ。動く・人が はみ出さない・伝説の 乗り物より こまかい', () => {
  // こまかさの 物さし: 絵の 点の 数（層＋こうか。4方向の 1コマ目）
  const dots = (id) => {
    let n = 0;
    for (const view of VIEWS) n += lit(paintVehicle(id, view, 0, 'back')) + lit(paintVehicle(id, view, 0, 'front')) + lit(paintVehicleFx(id, view, 0));
    return n;
  };
  for (const id of IDS) {
    assert.ok(VEHICLE_ART[id], `${id} の 絵`);
    assert.equal(vehicleFrames(id), 3, `${id}: 3コマ`);
    for (const view of VIEWS) {
      const [w, h] = vehicleSize(id, view);
      assert.ok(w >= 24 && w <= 96 && h >= 40 && h <= 72, `${id} ${view} ${w}x${h}`);
      const seen = new Set();
      for (let f = 0; f < 3; f++) {
        const px = lit(paintVehicle(id, view, f, 'back')) + lit(paintVehicle(id, view, f, 'front'));
        assert.ok(px > 80, `${id} ${view} ${f}: 絵が 少ない ${px}`);
        assert.ok(lit(paintVehicleFx(id, view, f)) > 0, `${id} ${view} ${f}: こうか（光・風・雲）が ない`);
        seen.add([...(paintVehicle(id, view, f, 'front')?.px || [])].join() + [...(paintVehicleFx(id, view, f)?.px || [])].join() + JSON.stringify(riderSpot(id, view, f)));
        const R = riderSpot(id, view, f);
        assert.ok(R && Number.isFinite(R.x) && Number.isFinite(R.y), `${id} ${view} 人の いち`);
        // 馬の かた（天馬・竜）は 人の 頭が 絵の 上に 出る（-11 まで。勇者の天馬と おなじ）
        assert.ok(R.y >= -12, `${id} ${view} ${f}: 人が 上に はみ出す ${R.y}`);
        assert.ok(R.y + Math.min(RIDER_H, R.crop ?? RIDER_H) <= h, `${id} ${view} ${f}: 人が 下に はみ出す`);
        assert.ok(R.x + 16 > 4 && R.x + 16 < w - 4, `${id} ${view}: 人が よこに はみ出す`);
      }
      assert.equal(seen.size, 3, `${id} ${view}: 3コマ とも ちがう 絵`);
    }
    // その 幻の職業が 前から 乗れた 乗り物（もとの 職業の 物。にた 形の 物）より 1だん こまかい
    //   （大きな 車・電車とは 形が ちがうので、いちばん 小さい 物と くらべる。見た目は 画面写真で たしかめた）
    const j = VEHICLES[id].jobs[0];
    const olds = VEHICLE_ORDER.filter((x) => !VEHICLES[x].phantom && VEHICLES[x].jobs?.includes(j));
    assert.ok(olds.length >= 1, `${j} の もとの 乗り物`);
    const best = Math.min(...olds.map(dots));
    assert.ok(dots(id) >= best * 1.1, `${id}（${dots(id)}）が ${olds.join('・')}（${best}）より こまかくない`);
  }
});

test('第79回: 乗り物屋の 一らんで「幻」の しるし・漢字チェックの 対象', () => {
  const ui = fs.readFileSync(new URL('../public/js/client/ui/vehicles.js', import.meta.url), 'utf8');
  assert.match(ui, /VEHICLES\[id\]\?\.phantom \? '<span class="tag veh-phantom">幻<\/span>'/);
  const kc = fs.readFileSync(new URL('../tools/kanji-check.mjs', import.meta.url), 'utf8');
  assert.ok(kc.includes("'public/js/shared/data/vehicles-phantom.js'") && kc.includes("'public/js/client/render/vehicle-phantom.js'"));
});
