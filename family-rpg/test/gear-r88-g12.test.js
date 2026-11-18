// 第88回 G12班: ドラえもん・セーラームーン
//   品の 数・名前・今 ある 品の 作品・使う（ぜんぶ 動く）・もしもボックス（天気を えらぶ）・スティックと 変身の 品の 生まれ変わり・
//   そろい（変身ペン・タリスマン）と 聖はいの 水しょうの台・とびら 2まいと ライバル・ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { ITEMS_R88_DORAEMON, MOSHIMO_PICKS } from '../public/js/shared/data/items-r88-doraemon.js';
import { ITEMS_R88_SAILORMOON, MOON_STICKS, MOON_BROOCHES, TALISMANS, HOLY_GRAIL, GRAIL_ALTAR } from '../public/js/shared/data/items-r88-sailormoon.js';
import { rebirthOf, canUpgrade } from '../public/js/shared/data/forge.js';
import { setTitles } from '../public/js/shared/gear-r88.js';
import { grailState, grantGrail } from '../public/js/shared/world/grail-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { paintGachaSpecial } from '../public/js/client/render/gacha-art.js';
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
  const b = new Battle({ rng: makeRng(12), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies: ['rockman', 'rockman', 'pururin'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G12: 品の 数（ドラえもん 32・セーラームーン 38）。今 ある 品にも 作品（強さ・値段は そのまま）', () => {
  assert.equal(Object.keys(ITEMS_R88_DORAEMON).length, 32);
  assert.equal(Object.keys(ITEMS_R88_SAILORMOON).length, 38);
  assert.equal(newIds('doraemon').length, 32);
  assert.equal(newIds('sailormoon').length, 38);
  assert.ok(WORKS.doraemon && WORKS.sailormoon);
  assert.deepEqual(ids('doraemon').filter((id) => ITEMS[id].src !== 'r88').sort(), ['magic_pocket', 'neko_suzu', 'takecopter']);
  assert.deepEqual(ids('sailormoon').filter((id) => ITEMS[id].src !== 'r88').sort(), ['silver_crystal', 'tiara_boomerang']);
  assert.equal(ITEMS.takecopter.price, 1900);
  assert.equal(ITEMS.neko_suzu.price, 80);
  assert.equal(ITEMS.silver_crystal.src, 'sd');
  for (const id of ['takecopter', 'neko_suzu', 'magic_pocket', 'tiara_boomerang', 'silver_crystal']) assert.equal(gachaBlock(id), 'grade', id);
  for (const id of [...newIds('doraemon'), ...newIds('sailormoon')]) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set([...newIds('doraemon'), ...newIds('sailormoon')]);
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(dr|sm)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(dr|sm)_/.test(id)).map((id) => ABILITIES[id].name);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n), `技 ${n}`);
  // 伝説
  assert.deepEqual(newIds('doraemon').filter((id) => ITEMS[id].grade === 'den'), ['r88_dr_moshimo']);
  assert.deepEqual(newIds('sailormoon').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_sm_glaive', 'r88_sm_grail', 'r88_sm_stick5']);
});

test('G12: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 3つ', () => {
  const list = [...newIds('doraemon'), ...newIds('sailormoon')].filter((id) => ITEMS[id].use);
  assert.equal(list.length, 16 + 6);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c, hero('warrior')]);
    const me = b.allies[0];
    me.hp = Math.max(1, me.hp - 50);
    me.status.poison = { turns: 3 };
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    if (b.pendingEnd) continue; // どこでもドア（にげた）
    assert.equal(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), true, `${id}: 2回めは だめ`);
  }
  // スティックは 仲間全員の 状態異常を 治す・エターナルティアルは 回復も
  const c = hero('warrior');
  c.equip.weapon = 'r88_sm_stick5';
  const b = fight([c, hero('warrior')]);
  for (const a of b.allies) { a.status.poison = { turns: 3 }; a.status.confuse = { turns: 3 }; a.hp = 100; }
  useGear(b, b.allies[0], 'use_weapon');
  for (const a of b.allies) {
    assert.ok(!a.status.poison && !a.status.confuse, '治る');
    assert.ok(a.hp > 100, '回復');
  }
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_dokan', 'r88_moshimo', 'r88_moonheal']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_dr_kuuki.use.ability].anim, 'r88_dokan');
  assert.equal(ABILITIES[ITEMS.r88_sm_stick1.use.ability].anim, 'r88_moonheal');
});

// ───────────── もしもボックス ─────────────
test('G12: もしもボックスは 晴れ・雨・かみなりの 3つが ならび、えらんだ 天気に かわる。1つ 使うと 3つとも 使った', () => {
  assert.equal(ITEMS.r88_dr_moshimo.grade, 'den');
  for (const [i, kind] of ['sun', 'rain', 'thunder'].entries()) {
    const c = hero('warrior');
    c.equip.acc = 'r88_dr_moshimo';
    const b = fight([c]);
    const me = b.allies[0];
    const list = me.gearUses.filter((x) => x.id === 'r88_dr_moshimo');
    assert.deepEqual(list.map((x) => x.ability), MOSHIMO_PICKS);
    assert.equal(new Set(list.map((x) => x.slot)).size, 3);
    const ev = useGear(b, me, list[i].slot);
    assert.equal(b.weather?.kind, kind, kind);
    assert.equal(b.weather.side, 'ally');
    assert.ok(list.every((x) => x.used), '3つとも 使った');
    for (const x of list) assert.ok(useGear(b, me, x.slot).lines.join('').includes('何も起こらなかった'));
    assert.ok(ev.lines.join('').length > 0);
  }
});

// ───────────── 生まれ変わり ─────────────
test('G12: うさぎの スティックは 5だん（さいごは 伝説）・変身の 品は 3だん', () => {
  assert.deepEqual(MOON_STICKS.map((id) => ITEMS[id].grade), ['mei', 'mei', 'mei', 'mei', 'den']);
  for (let i = 0; i < 4; i++) assert.equal(REBIRTH[MOON_STICKS[i]].to, MOON_STICKS[i + 1]);
  for (const id of MOON_STICKS) {
    assert.equal(ITEMS[id].cat, 'staff', id);
    assert.ok(ITEMS[id].fx.some((x) => x.k === 'el_light'), `${id}: 光の力`);
    assert.ok(ITEMS[id].use, id);
  }
  assert.equal(REBIRTH.r88_sm_stick4.keep, true);
  assert.ok(REBIRTH.r88_sm_stick4.mats.some(([m]) => m === 'limit_stone'));
  assert.equal(REBIRTH[MOON_BROOCHES[0]].to, MOON_BROOCHES[1]);
  assert.equal(REBIRTH[MOON_BROOCHES[1]].to, MOON_BROOCHES[2]);
  for (const id of MOON_BROOCHES.slice(0, 2)) {
    assert.equal(rebirthOf(id).at, 0);
    assert.ok(canUpgrade(id, hero()), `${id}: かじ屋で きたえられる`);
  }
  for (const id of [...MOON_STICKS.slice(1, 4), ...MOON_BROOCHES.slice(1)]) assert.equal(gachaBlock(id), 'rebirth', id);
  assert.equal(gachaBlock('r88_sm_stick5'), 'legend');
});

// ───────────── そろいと 聖はい ─────────────
test('G12: 変身ペンは 4人で 1本ずつ つけると みんなの 攻撃魔力+12。タリスマンは 3つで しょう号', () => {
  const pens = GEAR_SETS.henshin_pen.items;
  assert.equal(pens.length, 4);
  for (const sid of ['henshin_pen', 'talisman']) for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id].set, sid, id);
  const mk = (pen) => { const h = hero('warrior'); h.equip.acc = pen; return h; };
  const b3 = fight([mk(pens[0]), mk(pens[1]), mk(pens[2]), hero('warrior')]);
  const b4 = fight(pens.map(mk));
  assert.equal(b4.allies[0].mag - b3.allies[0].mag, 12);
  assert.deepEqual(GEAR_SETS.talisman.items, TALISMANS);
  const c = hero('warrior');
  addItem(c, TALISMANS[0], 1);
  addItem(c, TALISMANS[1], 1);
  assert.ok(!setTitles(c).some((t) => t.set === 'talisman'));
  c.equip.acc = TALISMANS[2];
  assert.ok(setTitles(c).some((t) => t.title === 'タリスマンの守り手'));
});

test('G12: 聖はい … タリスマン 3つを 持って 水しょうの台へ（タリスマンは のこる。持って いる 間は もう もらえない）', async () => {
  const m = MAPS[GRAIL_ALTAR.map];
  const n = m.npcs.find((x) => x.id === 'r88_grail_altar');
  assert.ok(n && n.x === GRAIL_ALTAR.x && n.y === GRAIL_ALTAR.y);
  assert.ok(SCRIPTS.r88_grail);
  assert.ok(paintGachaSpecial('r88_grail_altar', 'down', 0));
  assert.equal(m.npcs.filter((x) => x.x === n.x && x.y === n.y).length, 1);
  assert.equal(gachaBlock(HOLY_GRAIL), 'legend');
  const c = hero();
  assert.equal(grailState(c), 'lack');
  assert.equal(grantGrail(c), false);
  // 台の 前で 話す（2つ → 3つ）
  const world = new GameWorld({ offline: true, rng: makeRng(12), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const d = world.data.characters[bot.char.id];
  const spots = [[0, 1, 'up'], [1, 0, 'left'], [-1, 0, 'right'], [0, -1, 'down']];
  const s = spots.find(([dx, dy]) => !isBlocked(m, n.x + dx, n.y + dy, () => true));
  assert.ok(s, '台の まわりに 立てる');
  world.placeSession(bot.s, GRAIL_ALTAR.map, n.x + s[0] + 0.5, n.y + s[1] + 0.5, s[2], true);
  addItem(d, TALISMANS[0], 1);
  addItem(d, TALISMANS[1], 1);
  await bot.talk('r88_grail_altar');
  assert.equal(itemCount(d, HOLY_GRAIL), 0);
  d.equip.acc = TALISMANS[2]; // 装備して いても よい
  await bot.talk('r88_grail_altar');
  assert.equal(itemCount(d, HOLY_GRAIL), 1, '聖はいが もらえる');
  assert.equal(itemCount(d, TALISMANS[0]), 1, 'タリスマンは のこる');
  assert.equal(d.equip.acc, TALISMANS[2]);
  await bot.talk('r88_grail_altar');
  assert.equal(itemCount(d, HOLY_GRAIL), 1, '持って いる 間は ふえない');
  const text = bot.msgs.filter((x) => x.t === 'script').flatMap((x) => x.steps).filter((st) => st[0] === 'say').map((st) => st[2]).join('\n');
  assert.ok(text.includes('2/3') && text.includes('聖はいを手に入れた'), text);
});

// ───────────── とびらと ライバル ─────────────
test('G12: とびら 2まいと ライバル（5人ずつ・弱い 順・さいごは Lv100）', () => {
  const dd = RIVAL_DOORS.find((d) => d.work === 'doraemon');
  const ds = RIVAL_DOORS.find((d) => d.work === 'sailormoon');
  assert.ok(dd && ds);
  assert.equal(RIVAL_DOORS.filter((d) => d.work === 'doraemon' || d.work === 'sailormoon').length, 2);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  for (const d of [dd, ds]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  const r = rivalsOf('doraemon');
  assert.deepEqual(r.map((x) => x.id), ['dr_nobita', 'dr_gian', 'dr_suneo', 'dr_dorami', 'dr_dora']);
  assert.deepEqual(r.map((x) => x.reward), [['r88_dr_shock'], ['r88_dr_mic', 'r88_dr_bat'], ['r88_dr_houdai'], ['r88_dr_ribbon', 'r88_dr_melonpan'], ['r88_dr_moshimo']]);
  const s = rivalsOf('sailormoon');
  assert.deepEqual(s.map((x) => x.id), ['sm_beryl', 'sm_sisters', 'sm_outer', 'sm_saturn', 'sm_galaxia']);
  assert.deepEqual(s.map((x) => x.reward), [['r88_sm_beryl'], ['r88_sm_pierce'], TALISMANS, ['r88_sm_glaive'], ['r88_sm_bracelet']]);
  for (const list of [r, s]) {
    assert.equal(list.length, 5);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(list[list.length - 1].lv, 100);
    for (const rv of list) {
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      const last = rv === list[list.length - 1];
      assert.equal(rivalTier(rv.lv), last ? 100 : den ? 80 : 60, `${rv.id}: Lv${rv.lv}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, rv.work, id);
    }
  }
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('dr_gian')].bg, 'grass');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('dr_dora')].bg, 'kumoi');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('sm_beryl')].bg, 'palace_night');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('sm_galaxia')].bg, 'rift_moon');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G12: ガチャガチャ（2作品が ならぶ。ライバル・伝説・生まれ変わり・試練の ごほうび・聖はいは 出ない）', () => {
  assert.ok(gachaWorks().includes('doraemon') && gachaWorks().includes('sailormoon'));
  const pd = gachaPool('doraemon'), ps = gachaPool('sailormoon');
  assert.equal(pd.all.length, 24);
  assert.equal(ps.all.length, 23);
  for (const [w, p] of [['doraemon', pd], ['sailormoon', ps]]) {
    const all = new Set(p.all);
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || [trialGiftOf('doraemon'), trialGiftOf('sailor_moon')].includes(id)
        || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  assert.ok(!ps.all.includes(HOLY_GRAIL));
  for (const id of TALISMANS) assert.equal(gachaBlock(id), 'rival', id);
  // 変身ペン・変身ブローチは ガチャから
  for (const id of [...GEAR_SETS.henshin_pen.items, 'r88_sm_brooch']) assert.ok(ps.all.includes(id), id);
});

test('G12: 試練の ごほうび（ドラえもん → ひらりマント・セーラームーン → うさぎのムーンスティック）', () => {
  assert.equal(trialGiftOf('doraemon'), 'r88_dr_hirari');
  assert.equal(trialGiftOf('sailor_moon'), 'r88_sm_stick1');
  for (const id of ['r88_dr_hirari', 'r88_sm_stick1']) {
    assert.equal(ITEMS[id].grade, 'mei', id);
    assert.equal(gachaBlock(id), 'trial', id);
  }
});

// ───────────── セーブと 引っこし ─────────────
test('G12: セーブと 引っこしコード（ライバル・品・きたえた スティック）', () => {
  const c = hero('sailor_moon');
  c.rivals = { sm_outer: 1, dr_dora: 1 };
  for (const id of [...TALISMANS, HOLY_GRAIL, 'r88_dr_moshimo']) addItem(c, id, 1);
  c.equip.weapon = 'r88_sm_stick3';
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { sm_outer: 1, dr_dora: 1 });
  assert.equal(itemCount(back, HOLY_GRAIL), 1);
  assert.equal(itemCount(back, 'r88_dr_moshimo'), 1);
  assert.equal(back.equip.weapon, 'r88_sm_stick3');
  assert.equal(grailState(back), 'have');
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
