// 第88回 G19班: SPY×FAMILY・オリジナルの 職業
//   品の 数・名前が かぶらない・全部の 品に 手に入れ方が ある・その 職業が 装備 できる・ステラの しょう号・白い剣と 黒い剣・
//   雲の衣で 晴れ・変装のマスク・とびら 2まいと ライバル・ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { ITEMS_R88_SPYFAMILY, STELLA, IMPERIAL_N } from '../public/js/shared/data/items-r88-spyfamily.js';
import { ITEMS_R88_ORIGINAL, KOUAN_SWORDS } from '../public/js/shared/data/items-r88-original.js';
import { setTitles } from '../public/js/shared/gear-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, canEquip } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN } from '../public/js/shared/data/gacha-r88.js';
import { trialGiftSteps } from '../public/js/shared/world/gacha-r88.js';
import { RIVAL_DOORS, rivalsOf, rivalTier, rivalEnc, sigId } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';

const WORKS2 = ['spyfamily', 'original'];
const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const mineAll = () => [...ids('spyfamily'), ...ids('original')];
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
test('G19: 品の 数（SPY×FAMILY 16・オリジナル 24）。名前は 今 ある 品・技と かぶらない。本物の 銃は ない', () => {
  assert.equal(Object.keys(ITEMS_R88_SPYFAMILY).length, 16);
  assert.equal(Object.keys(ITEMS_R88_ORIGINAL).length, 24);
  assert.equal(ids('spyfamily').length, 16);
  assert.equal(ids('original').length, 24);
  assert.equal(WORKS.spyfamily.name, 'SPY×FAMILY');
  assert.equal(WORKS.original.name, 'オリジナル');
  for (const id of mineAll()) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden && ABILITIES[it.use.ability].mp === 0, `${id}: ${it.use.ability}`);
    assert.ok(!/銃|じゅう|ピストル|殺/.test(it.name + it.desc), `${id}: こわい 言い方・銃は 書かない`);
  }
  const mine = new Set(mineAll());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(sf|or)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(sf|or)_/.test(id)).map((id) => ABILITIES[id].name);
  assert.equal(myAb.length, 6);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n) && !abNames.has(n), `技 ${n}`);
  // 伝説
  assert.deepEqual(ids('spyfamily').filter((id) => ITEMS[id].grade === 'den'), ['r88_sf_stiletto']);
  assert.deepEqual(ids('original').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_or_black', 'r88_or_kumo', 'r88_or_white']);
  // 体に ひびく 品: 超人外こっかく（力↑ 素早さ↓）・雷（トニト）（力↑ 守り↓）・禁断のけい約書（魔力↑ HP↓）
  assert.ok(ITEMS.r88_sf_exo.bonus.str > 0 && ITEMS.r88_sf_exo.bonus.agi < 0);
  assert.ok(ITEMS.r88_sf_tonitrus.bonus.str > 0 && ITEMS.r88_sf_tonitrus.bonus.def < 0);
  assert.ok(ITEMS.r88_or_keiyaku.bonus.mag >= 30 && ITEMS.r88_or_keiyaku.bonus.hp < 0);
  assert.ok(ITEMS.r88_sf_penguin.desc.includes('ロイドがぬい直した'));
  assert.equal(ITEMS.r88_sf_stiletto.cat, 'dagger');
  assert.ok(ITEMS.r88_sf_stiletto.fx.some((x) => x.k === 'chase'));
});

test('G19: 手に 入らない 品は ない（ガチャ・ライバル・試練の ごほうび）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  for (const w of WORKS2) {
    const pool = new Set(gachaPool(w).all);
    const rival = new Set(rivalsOf(w).flatMap((rv) => rv.reward));
    for (const id of ids(w)) {
      const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練',
        TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
      assert.ok(how.length, `${id}: 手に入れ方が ない`);
    }
  }
});

test('G19: その 職業が 装備 できる（オリジナルの 品は 中二病・ダ天使・剣神・天候の 職業。かぶとは 剣神だけ）', () => {
  const groups = {
    chuuni: ['r88_or_gantai', 'r88_or_houtai', 'r88_or_maken', 'r88_or_kasa', 'r88_or_note', 'r88_or_mantle'],
    datenshi: ['r88_or_hane', 'r88_or_tsubasa', 'r88_or_wa', 'r88_or_pendant', 'r88_or_ochita', 'r88_or_keiyaku'],
    kenshin: ['r88_or_white', 'r88_or_black', 'r88_or_cloak', 'r88_or_kote', 'r88_or_kabuto'],
    weather: ['r88_or_teru', 'r88_or_bigkasa', 'r88_or_kazami', 'r88_or_shibou', 'r88_or_taifu', 'r88_or_niji', 'r88_or_kumo'],
  };
  assert.deepEqual(Object.values(groups).flat().sort(), ids('original').sort());
  const jobsOf = { chuuni: ['chuuni'], datenshi: ['datenshi'], kenshin: ['kenshin'], weather: ['kishou', 'otenki_caster', 'tenkou_tsukai', 'weather_god'] };
  for (const [g, list] of Object.entries(groups)) for (const id of list) for (const j of jobsOf[g]) assert.ok(canEquip(j, id), `${j}: ${id}`);
  // 中二病・ダ天使・天候の 職業は かぶとが だめ（十字のかぶとは 剣神の 品）
  for (const j of ['chuuni', 'datenshi', 'kishou', 'weather_god']) assert.equal(JOBS[j].helm, false, j);
  assert.ok(ITEMS.r88_or_kabuto.helm);
  // SPY×FAMILY: ロイドと ヨルの 品は スパイ・殺し屋が つけられる（ラケット・超人外こっかくは フィオナ・フランキーの 品）
  for (const id of ids('spyfamily').filter((x) => !['r88_sf_racket', 'r88_sf_exo'].includes(x))) {
    assert.ok(canEquip('spy', id) || canEquip('assassin', id), id);
  }
  assert.ok(canEquip('spy', 'r88_sf_stiletto') && canEquip('assassin', 'r88_sf_stiletto'));
});

// ───────────── そろい ─────────────
test('G19: ステラ … 星（ステラ）を 持って いて、SPY×FAMILYの 品を 8つ いじょう 持つと しょう号「こうていの学徒」', () => {
  const set = GEAR_SETS.imperial_scholar;
  assert.deepEqual([...set.items].sort(), ids('spyfamily').sort());
  for (const id of set.items) assert.equal(ITEMS[id].set, 'imperial_scholar', id);
  assert.equal(IMPERIAL_N, 8);
  assert.ok(gachaPool('spyfamily').all.includes(STELLA), '星は ガチャで 出る');
  const has = (c) => setTitles(c).some((t) => t.title === 'こうていの学徒');
  const others = set.items.filter((id) => id !== STELLA);
  // 星 なしで 8つ → まだ
  const c = hero('spy');
  for (const id of others.slice(0, 8)) addItem(c, id, 1);
  assert.ok(!has(c), '星が ないと だめ');
  // 星 ＋ 6つ（7つ）→ まだ
  const d = hero('spy');
  addItem(d, STELLA, 1);
  for (const id of others.slice(0, 6)) addItem(d, id, 1);
  assert.ok(!has(d), '7つでは まだ');
  // 星 ＋ 7つ（8つ。預かり所・装備でも よい）→ しょう号
  d.bank = { gold: 0, items: [{ id: others[6], n: 1 }] };
  assert.ok(has(d), '8つで しょう号');
  d.items = d.items.filter((x) => x.id !== STELLA);
  d.equip.acc = STELLA;
  assert.ok(has(d), '星は 装備して いても よい');
});

test('G19: 夜明けの白い剣と たそがれの黒い剣 … 2本とも 持つと、どちらを つけても 光と 闇（HP吸収）の 両方が のる', () => {
  assert.deepEqual(GEAR_SETS.kouan_ken.items, KOUAN_SWORDS);
  const white = hero('kenshin');
  white.equip.weapon = 'r88_or_white';
  let t = gearFxTotals(white);
  assert.ok(t.el_light > 0 && !t.drain, '1本だけ: 白は 光だけ');
  addItem(white, 'r88_or_black', 1);
  t = gearFxTotals(white);
  assert.ok(t.el_light > 0 && t.drain > 0, `白 ＋ 黒を 持つ: ${JSON.stringify(t)}`);
  const black = hero('kenshin');
  black.equip.weapon = 'r88_or_black';
  t = gearFxTotals(black);
  assert.ok(t.drain > 0 && !t.el_light, '1本だけ: 黒は HP吸収だけ');
  black.bank = { gold: 0, items: [{ id: 'r88_or_white', n: 1 }] };
  t = gearFxTotals(black);
  assert.ok(t.el_light > 0 && t.drain > 0, `黒 ＋ 白を 持つ: ${JSON.stringify(t)}`);
  assert.ok(setTitles(black).some((x) => x.set === 'kouan_ken'));
});

// ───────────── 使う ─────────────
test('G19: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 2つ', () => {
  const list = mineAll().filter((id) => ITEMS[id].use);
  assert.deepEqual(list.sort(), ['r88_or_bigkasa', 'r88_or_gantai', 'r88_or_kumo', 'r88_or_shibou', 'r88_sf_mask', 'r88_sf_stiletto']);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c, hero('warrior')]);
    const me = b.allies[0];
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    assert.ok(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), `${id}: 2回めは だめ`);
  }
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_ibara', 'r88_kouan']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_sf_stiletto.use.ability].anim, 'r88_ibara');
  assert.equal(ABILITIES[sigId('sf_thorn')].anim, 'r88_ibara');
  assert.equal(ABILITIES[sigId('or_kenshin')].anim, 'r88_kouan');
});

test('G19: 空の神の雲の衣 … 使うと 空が 晴れる（味方の 天気。仲間の 強化は ない）', () => {
  const c = hero('weather_god');
  c.equip.armor = 'r88_or_kumo';
  const b = fight([c, hero('warrior')]);
  const me = b.allies[0];
  assert.ok(!b.weather);
  const ev = useGear(b, me, 'use_armor');
  assert.equal(ev.ability, 'r88u_or_hare');
  assert.equal(b.weather?.kind, 'sun');
  assert.equal(b.weather?.side, 'ally');
  for (const a of b.allies) assert.ok(!a.buffs?.atk && !a.buffs?.mag, '強化は ない');
});

test('G19: 変装のマスク … 使うと、次に 受ける 1回の 物理の 攻撃を かならず かわす（2回めからは ふつう）', () => {
  const c = hero('spy');
  c.equip.head = 'r88_sf_mask';
  const b = fight([c, hero('warrior')]);
  const me = b.allies[0];
  const foe = b.enemies[0];
  foe.str = 999;
  const ev = useGear(b, me, 'use_head');
  assert.equal(ev.ability, 'r88u_sf_hensou');
  assert.equal(me.r88Dodge, 1);
  assert.ok(ev.lines.join('').includes('1回かわす'), ev.lines.join('/'));
  // みつもり（オートの 計算）では へらない
  b.calcPhys(foe, me, { mult: 1 }, 1, 'phys', true);
  assert.equal(me.r88Dodge, 1);
  // 味方からの 物理では へらない
  b.calcPhys(b.allies[1], me, { mult: 1 });
  assert.equal(me.r88Dodge, 1);
  // 敵の 物理: 1回めは かならず かわす
  const hp = me.hp;
  const ev2 = { lines: [], upd: [] };
  assert.equal(b.physHit(foe, me, { mult: 1 }, ev2, 'phys'), 0);
  assert.equal(me.hp, hp);
  assert.ok(ev2.lines.join('').includes('身をかわした'), ev2.lines.join('/'));
  assert.equal(me.r88Dodge, undefined, '1回で 消える');
  // 2回めからは ふつう（当たる ことが ある）
  let hit = false;
  for (let i = 0; i < 20 && !hit; i++) hit = !b.calcPhys(foe, me, { mult: 1 }).miss;
  assert.ok(hit, '2回めからは 当たる');
});

// ───────────── とびらと ライバル ─────────────
test('G19: とびら 2まいと ライバル（SPY×FAMILY 5人・オリジナル 4人。弱い 順・さいごは Lv100）', () => {
  const ds = RIVAL_DOORS.find((d) => d.work === 'spyfamily');
  const dor = RIVAL_DOORS.find((d) => d.work === 'original');
  assert.ok(ds && dor);
  assert.equal(RIVAL_DOORS.filter((d) => WORKS2.includes(d.work)).length, 2);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  for (const d of [ds, dor]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
    for (const j of d.jobs) assert.ok(JOBS[j], j);
  }
  assert.deepEqual(ds.jobs, ['spy', 'assassin']);
  for (const j of ['chuuni', 'datenshi', 'kenshin', 'kishou', 'otenki_caster', 'tenkou_tsukai', 'weather_god']) assert.ok(dor.jobs.includes(j), j);
  const s = rivalsOf('spyfamily');
  assert.deepEqual(s.map((x) => x.id), ['sf_franky', 'sf_yuri', 'sf_fiona', 'sf_twilight', 'sf_thorn']);
  assert.deepEqual(s.map((x) => x.reward), [['r88_sf_exo'], ['r88_sf_cap'], ['r88_sf_racket'], ['r88_sf_mask'], ['r88_sf_stiletto']]);
  assert.deepEqual(s.map((x) => x.lv), [60, 64, 70, 90, 100]);
  const o = rivalsOf('original');
  assert.deepEqual(o.map((x) => x.id), ['or_chuuni', 'or_datenshi', 'or_soranokami', 'or_kenshin']);
  assert.deepEqual(o.map((x) => x.reward), [['r88_or_maken'], ['r88_or_keiyaku'], ['r88_or_kumo'], ['r88_or_white', 'r88_or_black']]);
  assert.deepEqual(o.map((x) => x.lv), [60, 80, 100, 100]);
  for (const list of [s, o]) {
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(rivalTier(list[list.length - 1].lv), 100);
    for (const rv of list) {
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[sigId(rv.id)], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, rv.work, id);
      assert.ok(!/銃|じゅう|殺/.test(rv.name + rv.words + rv.sig.charge + rv.sig.cast), `${rv.id}: こわく しない`);
    }
  }
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('sf_franky')].bg, 'village_night');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('sf_fiona')].bg, 'arena');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('or_datenshi')].bg, 'rift_moon');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('or_soranokami')].bg, 'kumoi');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G19: ガチャガチャ（2作品が ならぶ。ライバル・伝説・試練の ごほうびは 出ない。星は 出る）', () => {
  assert.ok(gachaWorks().includes('spyfamily') && gachaWorks().includes('original'));
  const ps = gachaPool('spyfamily'), po = gachaPool('original');
  assert.equal(ps.all.length, 11);
  assert.equal(po.all.length, 16);
  for (const [w, p] of [['spyfamily', ps], ['original', po]]) {
    const all = new Set(p.all);
    for (const id of ids(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id))
        || Object.values(WORKS.original.trialGift).includes(id) || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  assert.ok(ps.all.includes(STELLA));
  // 試練の ない 職業（スパイ・殺し屋・中二病）の 品は ガチャから
  for (const id of ['r88_sf_order', 'r88_sf_hairpin', 'r88_or_houtai']) assert.ok(ps.all.includes(id) || po.all.includes(id), id);
});

test('G19: 試練の ごほうび（ダ天使 → われた天使の輪・剣神 → 十字のかぶと・天候をあやつる者と 天候の神 → てるてるぼうず）', () => {
  assert.equal(trialGiftOf('datenshi'), 'r88_or_wa');
  assert.equal(trialGiftOf('kenshin'), 'r88_or_kabuto');
  assert.equal(trialGiftOf('tenkou_tsukai'), 'r88_or_teru');
  assert.equal(trialGiftOf('weather_god'), 'r88_or_teru');
  // 試練の ある 職業（超級職から 上）だけ
  for (const j of Object.keys(WORKS.original.trialGift)) assert.ok(JOBS[j].tier >= 2, j);
  for (const id of ['r88_or_wa', 'r88_or_kabuto', 'r88_or_teru']) assert.equal(gachaBlock(id), 'trial', id);
  // 一の試練を こえた 人が 番人から 1回 もらう
  const c = hero('datenshi');
  c.jobs = { datenshi: { lv: 15, tr: 1 } };
  c.flags = {};
  const steps = trialGiftSteps(c, '番人');
  assert.ok(steps.length > 0);
  assert.equal(itemCount(c, 'r88_or_wa'), 1);
  assert.deepEqual(trialGiftSteps(c, '番人'), [], '2回めは ない');
});

// ───────────── セーブと 引っこし ─────────────
test('G19: セーブと 引っこしコード（ライバル・品）', () => {
  const c = hero('spy');
  c.rivals = { sf_thorn: 1, or_kenshin: 1 };
  for (const id of ['r88_sf_stiletto', 'r88_or_white', 'r88_or_black', STELLA]) addItem(c, id, 1);
  c.equip.head = 'r88_sf_mask';
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { sf_thorn: 1, or_kenshin: 1 });
  assert.equal(back.equip.head, 'r88_sf_mask');
  for (const id of ['r88_sf_stiletto', 'r88_or_white', 'r88_or_black', STELLA]) assert.equal(itemCount(back, id), 1, id);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
