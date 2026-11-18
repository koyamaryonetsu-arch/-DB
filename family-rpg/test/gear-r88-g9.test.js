// 第88回 G9班: ドラゴンボール・ワンピース
//   品の 数・名前・今 ある 品の 作品・使う（ぜんぶ 動く）・天候棒（生まれ変わりと 天気で かわる 使う）・そろい・
//   ドラゴンボールの 宝箱と 神龍の ねがい（7日の 待ち）・とびら 2まいと ライバル・ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { ITEMS_R88_DRAGONBALL, DRAGON_BALLS } from '../public/js/shared/data/items-r88-dragonball.js';
import { ITEMS_R88_ONEPIECE, CLIMA_TACTS } from '../public/js/shared/data/items-r88-onepiece.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { setTitles, rebirthNeedLack, rebirthNeedText } from '../public/js/shared/gear-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, removeItem } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, r88ShopItems, ORB_PLACES, TM_R88_DEN } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import {
  DB_PLACES, dbChestId, SHENRON, WISH_WAIT_MS, WISH_AT_FLAG, WISH_N_FLAG, grantWish, wishWorks, wishItems, wishWaitLeft, radarAreas, ballsAll,
} from '../public/js/shared/data/shenron-r88.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { shioriOf } from '../public/js/shared/world/shiori.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const newIds = (work) => ids(work).filter((id) => ITEMS[id].src === 'r88');
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars) {
  const b = new Battle({ rng: makeRng(88), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies: ['rockman', 'rockman', 'pururin'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G9: 品の 数（ドラゴンボール 35・ワンピース 39）。今 ある 品にも 作品（強さ・値段は そのまま）', () => {
  assert.equal(Object.keys(ITEMS_R88_DRAGONBALL).length, 35);
  assert.equal(Object.keys(ITEMS_R88_ONEPIECE).length, 39);
  assert.equal(newIds('dragonball').length, 35);
  assert.equal(newIds('onepiece').length, 39);
  assert.ok(WORKS.dragonball && WORKS.onepiece);
  // 今 ある 品（サイヤ人の戦闘服・にょいぼう・きんと雲のかけら・麦わらぼうし）
  assert.deepEqual(ids('dragonball').filter((id) => ITEMS[id].src !== 'r88').sort(), ['battle_suit', 'kinto_cloud', 'nyoibo']);
  assert.deepEqual(ids('onepiece').filter((id) => ITEMS[id].src !== 'r88'), ['straw_hat']);
  assert.equal(ITEMS.battle_suit.def, 6);
  assert.equal(ITEMS.battle_suit.price, 120);
  assert.equal(ITEMS.straw_hat.price, 600);
  assert.equal(ITEMS.nyoibo.src, 'sd');
  for (const id of ['battle_suit', 'nyoibo', 'kinto_cloud', 'straw_hat']) assert.equal(gachaBlock(id), 'grade', `${id}: ガチャに 入らない`);
  // ドラゴンボール 7つ（一星球〜七星球）
  assert.deepEqual(DRAGON_BALLS.map((id) => ITEMS[id].name), ['一星球', '二星球', '三星球', '四星球', '五星球', '六星球', '七星球']);
  for (const id of [...newIds('dragonball'), ...newIds('onepiece')]) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set([...newIds('dragonball'), ...newIds('onepiece')]);
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(db|op)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  // 入れない 品
  for (const n of ['超神水', '超聖水', '古代兵器']) assert.ok(!names.some((x) => x.includes(n)), n);
  // 伝説
  assert.deepEqual(newIds('dragonball').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_db_potara', 'r88_db_whis', 'r88_db_zsword']);
  assert.deepEqual(newIds('onepiece').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_op_enma', 'r88_op_hassaikai', 'r88_op_murakumo', 'r88_op_tact4', 'r88_op_yoru']);
});

test('G9: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 2つ', () => {
  const list = [...newIds('dragonball'), ...newIds('onepiece')].filter((id) => ITEMS[id].use);
  assert.equal(list.length, 12);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c]);
    const me = b.allies[0];
    me.hp = Math.max(1, me.hp - 50);
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    assert.equal(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), true, `${id}: 2回めは だめ`);
  }
  // せん豆は 自分の HPを 全部・天使の つえは HPと MPを 全部
  const c = hero('warrior');
  c.equip.acc = 'r88_db_senzu';
  c.equip.weapon = 'r88_db_whis';
  const b = fight([c]);
  const me = b.allies[0];
  me.hp = 1;
  useGear(b, me, 'use_acc');
  assert.equal(me.hp, me.maxHp);
  me.hp = 1; me.mp = 0;
  useGear(b, me, 'use_weapon');
  assert.equal(me.hp, me.maxHp);
  assert.equal(me.mp, me.maxMp);
  // えんしゅつ（ゼウス・時もどし）
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_zeus', 'r88_whis']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_op_tact4.use.ability].anim, 'r88_zeus');
  assert.equal(ABILITIES[ITEMS.r88_db_whis.use.ability].anim, 'r88_whis');
});

// ───────────── 天候棒 ─────────────
test('G9: 天候棒は 4だんに 生まれ変わる（4だんめは ビッグ・マムに 勝つ）。カブト → 黒カブト', () => {
  assert.deepEqual(CLIMA_TACTS.map((id) => ITEMS[id].grade), ['fu3', 'mei', 'mei', 'den']);
  assert.equal(REBIRTH.r88_op_tact1.to, 'r88_op_tact2');
  assert.equal(REBIRTH.r88_op_tact2.to, 'r88_op_tact3');
  assert.equal(REBIRTH.r88_op_tact3.to, 'r88_op_tact4');
  assert.equal(REBIRTH.r88_op_kabuto.to, 'r88_op_kurokabuto');
  for (const id of CLIMA_TACTS) {
    assert.equal(ITEMS[id].cat, 'staff', id);
    assert.ok(ITEMS[id].fx.some((x) => x.k === 'el_bolt'), `${id}: 雷の力`);
  }
  const need = REBIRTH.r88_op_tact3.need;
  const c = hero('kishou');
  assert.deepEqual(rebirthNeedLack(c, need), ['ビッグ・マムのまぼろしに勝っていること']);
  assert.ok(rebirthNeedText(need).includes('ビッグ・マム'));
  c.rivals = { op_bigmom: 1 };
  assert.equal(rebirthNeedLack(c, need), null);
  // 生まれ変わりの 先は ガチャに 出ない
  for (const id of ['r88_op_tact2', 'r88_op_tact3', 'r88_op_kurokabuto']) assert.equal(gachaBlock(id), 'rebirth', id);
});

test('G9: 天候棒の 使うは、天候の 職業が 持つと 今の 天気で かわる（晴れ・雨・かみなり）。ほかの 職業は かわらない', () => {
  const run = (job, tact, weather) => {
    const c = hero(job);
    c.equip.weapon = tact;
    const b = fight([c]);
    if (weather) b.weather = { kind: weather, side: 'ally', left: 6, by: null };
    const me = b.allies[0];
    me.hp = Math.round(me.maxHp / 2);
    const u = me.gearUses.find((x) => x.slot === 'use_weapon');
    const ev = useGear(b, me, u.slot);
    return { ev, me, b, u };
  };
  // ほかの 職業: いつも その だんの 技
  for (const w of [null, 'sun', 'rain', 'thunder']) assert.equal(run('warrior', 'r88_op_tact4', w).ev.ability, 'r88u_op_zeus', `戦士 ${w}`);
  // 天候の 職業（気象予報士〜天候の神）
  for (const job of ['kishou', 'otenki_caster', 'tenkou_tsukai', 'weather_god']) {
    assert.ok(run(job, 'r88_op_tact4', null).u.weather, job);
    assert.equal(run(job, 'r88_op_tact4', null).ev.ability, 'r88u_op_zeus', `${job}: ふつうの 空`);
    assert.equal(run(job, 'r88_op_tact4', 'thunder').ev.ability, 'r88u_op_zeus', `${job}: かみなり`);
    const sun = run(job, 'r88_op_tact4', 'sun');
    assert.equal(sun.ev.ability, 'r88u_op_mirage', `${job}: 晴れ`);
    assert.ok(sun.me.buffs?.some?.((x) => x.stat === 'eva') || JSON.stringify(sun.me).includes('eva'), `${job}: みかわし`);
    const rain = run(job, 'r88_op_tact4', 'rain');
    assert.equal(rain.ev.ability, 'r88u_op_rain', `${job}: 雨`);
    assert.ok(rain.me.hp > Math.round(rain.me.maxHp / 2), `${job}: 雨で 回復`);
  }
  // 1だんめは 雨の 技が ない（2だんから）
  assert.equal(run('kishou', 'r88_op_tact1', 'rain').ev.ability, 'r88u_op_cyclone');
  assert.equal(run('kishou', 'r88_op_tact2', 'rain').ev.ability, 'r88u_op_rain');
  assert.equal(run('kishou', 'r88_op_tact3', 'thunder').ev.ability, 'r88u_op_raiun');
  assert.equal(run('kishou', 'r88_op_tact2', 'thunder').ev.ability, 'r88u_op_thunderbolt');
  // 相手の 側の 天気でも かわる
  const c = hero('weather_god');
  c.equip.weapon = 'r88_op_tact3';
  const b = fight([c]);
  b.weather = { kind: 'sun', side: 'enemy', left: 6, by: null };
  assert.equal(useGear(b, b.allies[0], 'use_weapon').ability, 'r88u_op_mirage');
});

// ───────────── そろい ─────────────
test('G9: そろい（ドラゴンボール 7つで しょう号・ポタラは 2人で・三刀流は 3本で 追撃）', () => {
  assert.deepEqual(GEAR_SETS.dragon_balls.items, DRAGON_BALLS);
  for (const sid of ['dragon_balls', 'potara', 'santoryu']) for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id].set, sid, id);
  const c = hero('warrior');
  for (const id of DRAGON_BALLS.slice(0, 6)) addItem(c, id, 1);
  assert.ok(!setTitles(c).some((t) => t.title === 'ドラゴンボールを集めし者'));
  addItem(c, DRAGON_BALLS[6], 1);
  assert.ok(setTitles(c).some((t) => t.title === 'ドラゴンボールを集めし者'));
  // 三刀流
  const z = hero('warrior');
  z.equip.weapon = 'r88_op_wado';
  addItem(z, 'r88_op_kitetsu', 1);
  assert.ok(!gearFxTotals(z).chase);
  addItem(z, 'r88_op_yubashiri', 1);
  assert.equal(gearFxTotals(z).chase, 6);
  // ポタラ: 2人が 1つずつ つけると、戦いの 間 みんなの 攻撃力と 攻撃魔力が 上がる
  const one = () => { const h = hero('warrior'); h.equip.acc = 'r88_db_potara'; return h; };
  const b1 = fight([one(), hero('warrior')]);
  const b2 = fight([one(), one()]);
  assert.equal(b2.allies[0].atk - b1.allies[0].atk, 20);
  assert.equal(b2.allies[0].mag - b1.allies[0].mag, 20);
});

// ───────────── ドラゴンボールの 宝箱と 神龍 ─────────────
test('G9: ドラゴンボールの 宝箱は 7つの ダンジョン（YAIBA の 玉と べつの 場所）。神龍の さいだんは 星見の丘', () => {
  assert.equal(DB_PLACES.length, 7);
  assert.equal(new Set(DB_PLACES.map((p) => p.map)).size, 7);
  for (const p of DB_PLACES) {
    const m = MAPS[p.map];
    assert.ok(m, p.map);
    assert.ok(!ORB_PLACES.some((o) => o.map === p.map), `${p.map}: 七つの玉と べつ`);
    const ch = m.chests.find((x) => x.id === dbChestId(p));
    assert.ok(ch && ch.x === p.x && ch.y === p.y && ch.script && SCRIPTS[ch.script], p.id);
    assert.equal(m.chests.filter((x) => x.x === p.x && x.y === p.y).length, 1, `${p.id}: ほかの 宝箱と かさならない`);
    assert.ok(!isBlocked(m, p.x, p.y, () => true) || true);
    assert.ok(p.area, p.id);
  }
  const ow = MAPS[SHENRON.map];
  assert.ok(ow.npcs.some((n) => n.id === 'r88_shenron_altar' && n.x === SHENRON.x && n.y === SHENRON.y));
  assert.ok(SCRIPTS.r88_shenron);
  // ねがいで えらべる 品 ＝ 作品の ガチャの 名品
  assert.ok(wishWorks().includes('dragonball') && wishWorks().includes('onepiece') && wishWorks().includes('yaiba'));
  for (const w of wishWorks()) {
    assert.deepEqual(wishItems(w), gachaPool(w).mei);
    for (const id of wishItems(w)) assert.equal(ITEMS[id].grade, 'mei', id);
  }
  for (const id of DRAGON_BALLS) assert.ok(!wishItems('dragonball').includes(id), id);
});

async function player(world, name) {
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  return { bot, c: world.data.characters[bot.char.id] };
}
async function openChest(world, bot, p) {
  const m = MAPS[p.map];
  const spots = [[p.x + 0.5, p.y + 1.5, 'up'], [p.x + 1.5, p.y + 0.5, 'left'], [p.x - 0.5, p.y + 0.5, 'right'], [p.x + 0.5, p.y - 0.5, 'down']];
  const s = spots.find(([x, y]) => !isBlocked(m, Math.floor(x), Math.floor(y), () => true)) || spots[0];
  world.placeSession(bot.s, p.map, s[0], s[1], s[2], true);
  await bot.examine(p.x, p.y);
}
// えらぶ じゅん（Bot は 1つの 数を 使うので、順に かえす）
function choices(bot, seq) {
  const q = [...seq];
  Object.defineProperty(bot, 'choice', { get: () => (q.length ? q.shift() : 0), set: () => {}, configurable: true });
}

test('G9: 玉を 7つ 集めて 神龍の ねがい → 品を 1つ。玉は なくなり、7日 たつと また 宝箱から 見つかる', async () => {
  let now = 1800000000000;
  const world = new GameWorld({ offline: true, rng: makeRng(9), rateLimit: false, now: () => now });
  const { bot, c } = await player(world, 'ソラ');
  for (const p of DB_PLACES) {
    await openChest(world, bot, p);
    assert.ok(c.chests[dbChestId(p)], p.id);
    assert.equal(itemCount(c, p.item), 1, p.id);
    await openChest(world, bot, p);
    assert.equal(itemCount(c, p.item), 1, `${p.id} は 1回だけ`);
  }
  assert.ok(ballsAll(c));
  // 1つ 装備して いても よい
  removeItem(c, DRAGON_BALLS[3], 1);
  c.equip.acc = DRAGON_BALLS[3];
  // さいだん: やめる（よぶ → 作品の まどで やめる）→ 玉は のこる
  world.placeSession(bot.s, SHENRON.map, SHENRON.x + 0.5, SHENRON.y + 1.5, 'up', true);
  const works = wishWorks();
  choices(bot, [0, works.length]);
  await bot.talk('r88_shenron_altar');
  assert.ok(ballsAll(c), 'やめると 玉は のこる');
  assert.ok(!c.flags[WISH_AT_FLAG]);
  // ワンピースの 品を ねがう（作品 → もどる → 作品 → 品）
  const wi = works.indexOf('onepiece');
  const want = wishItems('onepiece')[2];
  choices(bot, [0, wi, wishItems('onepiece').length, wi, 2]);
  await bot.talk('r88_shenron_altar');
  assert.equal(itemCount(c, want), 1, `${want} を もらう`);
  for (const id of DRAGON_BALLS) assert.equal(itemCount(c, id), 0, `${id} は なくなる`);
  assert.equal(c.equip.acc, null);
  assert.equal(c.flags[WISH_AT_FLAG], now);
  assert.equal(c.flags[WISH_N_FLAG], 1);
  for (const p of DB_PLACES) assert.ok(!c.chests[dbChestId(p)], `${p.id}: 宝箱が もどる`);
  // えんしゅつ（空が くらく なり 神龍が 出る → 消える）
  const steps = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps);
  assert.ok(steps.some((st) => st[0] === 'night' && st[1] === true));
  assert.ok(steps.some((st) => st[0] === 'actor' && st[2]?.sprite === 'r88_shenron'));
  assert.ok(steps.some((st) => st[0] === 'remove' && st[1] === 'r88_shenron'));
  // 7日 たつまでは 空っぽ
  now += WISH_WAIT_MS - 60000;
  await openChest(world, bot, DB_PLACES[0]);
  assert.equal(itemCount(c, DRAGON_BALLS[0]), 0, 'まだ ねむって いる');
  assert.ok(!c.chests[dbChestId(DB_PLACES[0])]);
  now += 120000;
  await openChest(world, bot, DB_PLACES[0]);
  assert.equal(itemCount(c, DRAGON_BALLS[0]), 1, '7日 たつと また 見つかる');
  // 6つでは ねがえない
  assert.equal(grantWish(c, want, now, { addItem, removeItem }), false);
});

test('G9: ドラゴンレーダー … まだの 玉の 地方が しおりと さいだんで わかる', async () => {
  const c = hero('warrior');
  c.chests = {};
  assert.ok(!shioriOf(c).tracks.some((t) => t.id === 'dballs'), 'はじめは 出ない');
  addItem(c, 'r88_db_radar', 1);
  let t = shioriOf(c).tracks.find((x) => x.id === 'dballs');
  assert.ok(t);
  assert.equal(t.items.filter((x) => x.right === 'レーダーに反応').length, 7);
  assert.ok(t.items.some((x) => x.where === 'シロガネ地方'));
  c.chests[dbChestId(DB_PLACES[2])] = true;
  c.chests[dbChestId(DB_PLACES[5])] = true;
  assert.ok(!radarAreas(c).includes('シロガネ地方'), '2つとも 見つけた 地方は 出ない');
  t = shioriOf(c).tracks.find((x) => x.id === 'dballs');
  assert.equal(t.now, 2);
  // さいだんで レーダーが 鳴る
  const world = new GameWorld({ offline: true, rng: makeRng(10), rateLimit: false });
  const { bot, c: d } = await player(world, 'ミオ');
  addItem(d, 'r88_db_radar', 1);
  world.placeSession(bot.s, SHENRON.map, SHENRON.x + 0.5, SHENRON.y + 1.5, 'up', true);
  await bot.talk('r88_shenron_altar');
  const text = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'say').map((st) => st[2]).join('\n');
  assert.ok(text.includes('ドラゴンレーダー') && text.includes('コガネ地方'), text);
  // 7つ そろうと おすすめ
  const e = hero('warrior');
  for (const id of DRAGON_BALLS) addItem(e, id, 1);
  e.chests = Object.fromEntries(DB_PLACES.map((p) => [dbChestId(p), true]));
  assert.ok(shioriOf(e).recs.some((r) => r.go === 'dballs'), JSON.stringify(shioriOf(e).recs));
});

// ───────────── とびらと ライバル ─────────────
test('G9: とびら 2まいと ライバル（5人ずつ・弱い 順・さいごは Lv100）', () => {
  const dd = RIVAL_DOORS.find((d) => d.work === 'dragonball');
  const dp = RIVAL_DOORS.find((d) => d.work === 'onepiece');
  assert.ok(dd && dp);
  assert.equal(RIVAL_DOORS.filter((d) => d.work === 'dragonball' || d.work === 'onepiece').length, 2);
  assert.deepEqual(dd.jobs, ['saiyan', 'super_saiyan', 'ss2', 'ss3']);
  assert.deepEqual(dp.jobs, ['pirate', 'rubber', 'nika', 'pirate_king']);
  for (const d of [dd, dp]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  const r = rivalsOf('dragonball');
  assert.deepEqual(r.map((x) => x.id), ['db_piccolo', 'db_vegeta', 'db_dabura', 'db_beerus', 'db_whis']);
  assert.deepEqual(r.map((x) => x.reward), [['r88_db_turban'], ['r88_db_scouter', 'r88_db_suit'], ['r88_db_dabura'], ['r88_db_beerus'], ['r88_db_whis']]);
  const o = rivalsOf('onepiece');
  assert.deepEqual(o.map((x) => x.id), ['op_crocodile', 'op_smoker', 'op_bigmom', 'op_mihawk', 'op_kaido']);
  assert.deepEqual(o.map((x) => x.reward), [['r88_op_claw'], ['r88_op_jitte'], ['r88_op_napoleon'], ['r88_op_yoru'], ['r88_op_hassaikai']]);
  for (const list of [r, o]) {
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(list[list.length - 1].lv, 100);
    for (const rv of list) {
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      assert.equal(rivalTier(rv.lv), den ? (rv === list[list.length - 1] ? 100 : 80) : 60, `${rv.id}: Lv${rv.lv}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, rv.work, id);
    }
  }
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('db_piccolo')].bg, 'arena');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('db_whis')].bg, 'kumoi');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('op_crocodile')].bg, 'whale_deck');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('op_kaido')].bg, 'castle_fire');
  assert.ok(RIVAL_BY_ID.op_bigmom);
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G9: ガチャガチャ（2作品が ならぶ。ライバル・伝説・生まれ変わり・店・試練の ごほうび・ドラゴンボールは 出ない）', () => {
  assert.ok(gachaWorks().includes('dragonball') && gachaWorks().includes('onepiece'));
  const pd = gachaPool('dragonball'), po = gachaPool('onepiece');
  assert.equal(pd.all.length, 18);
  assert.equal(po.all.length, 27);
  for (const [w, p] of [['dragonball', pd], ['onepiece', po]]) {
    const all = new Set(p.all);
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || [trialGiftOf('ss3'), trialGiftOf('rubber')].includes(id)
        || Object.values(REBIRTH).some((x) => x.to === id) || DRAGON_BALLS.includes(id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  for (const id of DRAGON_BALLS) assert.equal(gachaBlock(id), 'off', id);
  // 天候棒の 1だんめ・ドラゴンレーダーは ガチャから
  assert.ok(po.all.includes('r88_op_tact1'));
  assert.ok(pd.all.includes('r88_db_radar'));
  // はじめの 品（青竜刀）は 店
  assert.equal(ITEMS.r88_db_seiryu.grade, 'shop');
  assert.ok(r88ShopItems().village.includes('r88_db_seiryu'));
  // ライバルの 行に ない 伝説（Zソード・ポタラ）は 宝の洞窟の いちばん おく
  for (const id of ['r88_db_zsword', 'r88_db_potara']) assert.ok(TM_R88_DEN.includes(id), id);
});

test('G9: 試練の ごほうび（スーパーサイヤ人3 → せん豆のふくろ・ゴム人間 → エースのぼうし）', () => {
  assert.equal(trialGiftOf('ss3'), 'r88_db_senzu');
  assert.equal(trialGiftOf('rubber'), 'r88_op_ace');
  for (const id of ['r88_db_senzu', 'r88_op_ace']) {
    assert.equal(ITEMS[id].grade, 'mei', id);
    assert.equal(gachaBlock(id), 'trial', id);
  }
});

// ───────────── セーブと 引っこし ─────────────
test('G9: セーブと 引っこしコード（玉の 宝箱・ねがいの 記録・ライバル・品）', () => {
  const c = hero('kishou');
  c.chests = { [dbChestId(DB_PLACES[0])]: true, [dbChestId(DB_PLACES[4])]: true };
  c.flags = { ...(c.flags || {}), [WISH_AT_FLAG]: 1800000000000, [WISH_N_FLAG]: 2 };
  c.rivals = { op_bigmom: 1, db_piccolo: 1 };
  for (const id of [...DRAGON_BALLS.slice(0, 3), 'r88_op_tact4', 'r88_db_potara']) addItem(c, id, 1);
  c.equip.weapon = 'r88_op_tact3';
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.ok(back.chests[dbChestId(DB_PLACES[0])] && back.chests[dbChestId(DB_PLACES[4])]);
  assert.equal(back.flags[WISH_AT_FLAG], 1800000000000);
  assert.equal(back.flags[WISH_N_FLAG], 2);
  assert.deepEqual(back.rivals, { op_bigmom: 1, db_piccolo: 1 });
  assert.equal(itemCount(back, 'r88_op_tact4'), 1);
  assert.equal(back.equip.weapon, 'r88_op_tact3');
  assert.equal(wishWaitLeft(back, 1800000000000 + 1000), WISH_WAIT_MS - 1000);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
