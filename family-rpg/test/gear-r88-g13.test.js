// 第88回 G13班: ハリー・ポッター・マリオ
//   品の 数・名前・今 ある 品の 作品・全部の 品に 手に入れ方が ある・ふんばる（緑の1UPキノコ・死の 秘宝）・
//   ホグワーツの 4つの 品の しょう号・逆転時計・百味ビーンズ・スーパースター・キャッピー・使う（ぜんぶ 動く）・
//   とびら 2まいと ライバル・ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { GEAR_FX, gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { ITEMS_R88_HARRYPOTTER, DEATHLY_HALLOWS, HOGWARTS4, BEANS } from '../public/js/shared/data/items-r88-harrypotter.js';
import { ITEMS_R88_MARIO } from '../public/js/shared/data/items-r88-mario.js';
import { setTitles, wornSetIds } from '../public/js/shared/gear-r88.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { r88ActEnd } from '../public/js/shared/battle-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN, r88ShopItems } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVALS, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';

const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const newIds = (work) => ids(work).filter((id) => ITEMS[id].src === 'r88');
const MINE = () => [...newIds('harrypotter'), ...newIds('mario')];
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars, seed = 12, opts = {}) {
  const b = new Battle({ rng: makeRng(seed), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies: ['rockman', 'rockman', 'pururin'], canFlee: true, ...opts });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const ev0 = () => ({ lines: [], upd: [] });
const useGear = (b, me, slot) => {
  const ev = ev0();
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};
// たおれる ダメージ
const lethal = (b, t) => {
  const ev = ev0();
  b.damage(b.enemies[0], t, t.hp + 500, ev, {});
  return ev;
};

// ───────────── 品 ─────────────
test('G13: 品の 数（ハリー・ポッター 36・マリオ 34）。今 ある 品にも 作品（強さ・値段・手に入れ方は そのまま）', () => {
  assert.equal(Object.keys(ITEMS_R88_HARRYPOTTER).length, 36);
  assert.equal(Object.keys(ITEMS_R88_MARIO).length, 34);
  assert.equal(newIds('harrypotter').length, 36);
  assert.equal(newIds('mario').length, 34);
  assert.ok(WORKS.harrypotter && WORKS.mario);
  assert.deepEqual(ids('harrypotter').filter((id) => ITEMS[id].src !== 'r88').sort(), ['elder_wand', 'invisible_cloak', 'magic_school_staff', 'nimbus_broom', 'school_robe']);
  assert.deepEqual(ids('mario').filter((id) => ITEMS[id].src !== 'r88'), []);
  assert.equal(ITEMS.elder_wand.src, 'sd');
  assert.equal(ITEMS.elder_wand.atk, 29);
  assert.equal(ITEMS.invisible_cloak.src, 'tm');
  assert.equal(ITEMS.invisible_cloak.def, 29);
  assert.equal(ITEMS.school_robe.price, 380);
  for (const id of ['school_robe', 'elder_wand', 'invisible_cloak', 'nimbus_broom', 'magic_school_staff']) assert.equal(gachaBlock(id), 'grade', id);
  for (const id of MINE()) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set(MINE());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(hp|mr)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(hp|mr)_/.test(id)).map((id) => ABILITIES[id].name);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n), `技 ${n}`);
  // ひげの 職業の 技・今 ある 品と かぶる 名前は かえた
  for (const n of ['スーパーキノコ', '1UPキノコ', 'ファイアフラワー', 'POWブロック', 'ヨッシーのたまご', 'グランドスター', 'フライパン']) assert.ok(!names.includes(n), n);
  assert.equal(ITEMS.r88_mr_pan.name, 'ピーチのフライパン');
  // 伝説
  assert.deepEqual(newIds('harrypotter').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_hp_gsword', 'r88_hp_stone', 'r88_hp_yew']);
  assert.deepEqual(newIds('mario').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_mr_grand', 'r88_mr_star']);
});

test('G13: 全部の 品に 手に入れ方が ある（ガチャ・ライバル・試練の ごほうび・店・宝の洞窟の いちばん おく）', () => {
  const rivalGifts = new Set(RIVALS.flatMap((rv) => rv.reward));
  const shop = new Set(Object.values(r88ShopItems()).flat());
  const pools = new Set([...gachaPool('harrypotter').all, ...gachaPool('mario').all]);
  const trial = new Set([trialGiftOf('harry'), trialGiftOf('mario')]);
  for (const id of MINE()) {
    const ways = [pools.has(id) && 'gacha', rivalGifts.has(id) && 'rival', trial.has(id) && 'trial', shop.has(id) && 'shop', TM_R88_DEN.includes(id) && 'den'].filter(Boolean);
    assert.ok(ways.length >= 1, `${id}: 手に入らない`);
  }
  // ライバルが くれない 伝説（スーパースター）は 宝の洞窟の いちばん おく
  assert.ok(TM_R88_DEN.includes('r88_mr_star'));
  assert.ok(!rivalGifts.has('r88_mr_star'));
  assert.ok(shop.has('r88_mr_overall'));
  assert.equal(ITEMS.r88_mr_overall.grade, 'shop');
});

// ───────────── ふんばる ─────────────
test('G13: ふんばる（緑の1UPキノコ）… たおれる ダメージで HP1 で のこる・2回めは のこらない・次の 戦いで また 使える', () => {
  assert.ok(GEAR_FX.endure && GEAR_FX.endure.name === 'ふんばる');
  assert.ok(ITEMS.r88_mr_1up.fx.some((x) => x.k === 'endure'));
  assert.ok(r88DetailLines('r88_mr_1up').some((l) => l.includes('ふんばる')));
  const c = hero('warrior');
  c.equip.acc = 'r88_mr_1up';
  for (const seed of [12, 13]) {
    const b = fight([c, hero('warrior')], seed);
    const me = b.allies[0];
    const ev = lethal(b, me);
    assert.equal(me.hp, 1, 'HP1 で のこる');
    assert.ok(me.alive);
    assert.ok(ev.lines.some((l) => l.includes(`${me.name}は、ふんばった！`)), ev.lines.join('/'));
    const ev2 = lethal(b, me);
    assert.ok(!me.alive, '2回めは のこらない');
    assert.ok(!ev2.lines.some((l) => l.includes('ふんばった')));
  }
  // つけて いない 人・敵は ふんばらない
  const b = fight([hero('warrior')]);
  lethal(b, b.allies[0]);
  assert.ok(!b.allies[0].alive);
  const foe = b.enemies[0];
  foe.gearFx = [{ kind: 'endure', v: 1 }];
  b.damage(b.allies[0], foe, foe.hp + 10, ev0(), {});
  assert.ok(!foe.alive, '敵は 持たない');
});

test('G13: 死の 秘宝 … 1人で 3つ（武器・よろい・アクセ）つけると ふんばる。2つでは ふんばらない。3つ 持つと しょう号', () => {
  assert.deepEqual(GEAR_SETS.deathly_hallows.items, DEATHLY_HALLOWS);
  for (const id of DEATHLY_HALLOWS) assert.equal(ITEMS[id].set, 'deathly_hallows', id);
  assert.deepEqual(DEATHLY_HALLOWS.map((id) => ITEMS[id].type), ['weapon', 'armor', 'acc'], '部位が かぶらない');
  const c = hero('harry');
  c.equip.weapon = 'elder_wand';
  c.equip.armor = 'invisible_cloak';
  assert.equal(wornSetIds(c, 'deathly_hallows').length, 2);
  assert.ok(!gearFxTotals(c).endure);
  let b = fight([c]);
  lethal(b, b.allies[0]);
  assert.ok(!b.allies[0].alive, '2つでは ふんばらない');
  c.equip.acc = 'r88_hp_stone';
  assert.equal(gearFxTotals(c).endure, 1);
  b = fight([c]);
  const ev = lethal(b, b.allies[0]);
  assert.equal(b.allies[0].hp, 1);
  assert.ok(ev.lines.some((l) => l.includes('ふんばった')));
  lethal(b, b.allies[0]);
  assert.ok(!b.allies[0].alive, '1つの 戦いで 1回');
  // きたえた ニワトコのつえでも 数える
  const plus = Object.keys(ITEMS).find((id) => ITEMS[id].base === 'elder_wand');
  if (plus) {
    c.equip.weapon = plus;
    assert.equal(wornSetIds(c, 'deathly_hallows').length, 3);
  }
  // しょう号（持って いる 数）
  const d = hero();
  for (const id of DEATHLY_HALLOWS.slice(0, 2)) addItem(d, id, 1);
  assert.ok(!setTitles(d).some((t) => t.set === 'deathly_hallows'));
  addItem(d, DEATHLY_HALLOWS[2], 1);
  assert.ok(setTitles(d).some((t) => t.title === '死の秘宝の主'));
});

test('G13: ホグワーツの 4つの 品 … 2つ・4つで しょう号', () => {
  assert.deepEqual(GEAR_SETS.hogwarts4.items, HOGWARTS4);
  for (const id of HOGWARTS4) assert.equal(ITEMS[id].set, 'hogwarts4', id);
  const c = hero();
  addItem(c, HOGWARTS4[0], 1);
  assert.ok(!setTitles(c).some((t) => t.set === 'hogwarts4'));
  addItem(c, HOGWARTS4[1], 1);
  assert.deepEqual(setTitles(c).filter((t) => t.set === 'hogwarts4').map((t) => t.title), ['ホグワーツの品さがし']);
  addItem(c, HOGWARTS4[2], 1);
  c.equip.acc = HOGWARTS4[3];
  assert.deepEqual(setTitles(c).filter((t) => t.set === 'hogwarts4').map((t) => t.title), ['ホグワーツの品さがし', '4つのりょうの友']);
  // こわい 話は 出さない
  for (const id of [...newIds('harrypotter')]) assert.ok(!/分霊|ぶんれい/.test(ITEMS[id].desc), id);
});

// ───────────── 使う ─────────────
test('G13: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 2つ', () => {
  const list = MINE().filter((id) => ITEMS[id].use);
  assert.equal(list.length, 6 + 4);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c, hero('warrior')]);
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
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_superstar', 'r88_timeturner']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_mr_star.use.ability].anim, 'r88_superstar');
  assert.equal(ABILITIES[ITEMS.r88_hp_time.use.ability].anim, 'r88_timeturner');
});

test('G13: 逆転時計 … 使うと すぐに もう1回 動ける（1つの 戦いで 1回）', () => {
  const c = hero('warrior');
  c.equip.acc = 'r88_hp_time';
  const b = fight([c, hero('warrior')]);
  const me = b.allies[0];
  // 使う → 行動の おわりで ゲージが いっぱい（すぐに 次の 番）
  me.ready = true;
  b.enqueue(me, { type: 'item', id: 'gear:use_acc' });
  me.ready = false;
  const evs = [];
  for (let i = 0; i < 40 && !evs.some((e) => e.t === 'act' && e.id === me.id); i++) evs.push(...b.tick(50));
  const act = evs.find((e) => e.t === 'act' && e.id === me.id);
  assert.ok(act && act.lines.some((l) => l.includes('時間がもどった')), act?.lines?.join('/'));
  assert.ok(me.atb >= 100 || me.ready, `すぐに 動ける（atb ${me.atb}）`);
  assert.ok(useGear(b, me, 'use_acc').lines.join('').includes('何も起こらなかった'), '2回めは だめ');
});

test('G13: 百味ビーンズ … 戦いの はじめに 1つぶ。味ごとに ちがう 力が 1つ つき、ひとこと 出る', () => {
  assert.equal(BEANS.length, 6);
  for (const x of BEANS) assert.ok(GEAR_FX[x.k], x.k);
  const seen = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const c = hero('warrior');
    c.equip.acc = 'r88_hp_beans';
    const b = fight([c, hero('warrior')], seed);
    const me = b.allies[0];
    const bean = BEANS.find((x) => x.name === me.r88Bean);
    assert.ok(bean, `seed ${seed}`);
    assert.ok(me.gearFx.some((x) => x.kind === bean.k && x.v >= bean.v), bean.k);
    const msg = b.events.filter((e) => e.t === 'msg').flatMap((e) => e.lines).join('/');
    assert.ok(msg.includes('百味ビーンズ') && msg.includes(bean.name), msg);
    assert.ok(!b.allies[1].r88Bean, 'つけて いない 人には つかない');
    seen.add(bean.name);
  }
  assert.ok(seen.size >= 4, `いろいろな 味が 出る（${[...seen]}）`);
});

test('G13: スーパースター … 3回の 行動の 間 状態異常に ならず 攻撃力が 上がる。キャッピーは ボスに きかない', () => {
  const c = hero('mario');
  c.equip.acc = 'r88_mr_star';
  const b = fight([c]);
  const me = b.allies[0];
  me.status.poison = { turns: 3 };
  const atk = me.buffs.atk;
  const ev = useGear(b, me, 'use_acc');
  assert.ok(!me.status.poison, '治る');
  assert.ok(me.buffs.atk && me.buffs.atk !== atk, '攻撃力が 上がる');
  assert.ok(me.r88Star, ev.lines.join('/'));
  r88ActEnd(b, me, ev0()); // 使った 行動
  for (let i = 0; i < 3; i++) {
    const e = ev0();
    assert.equal(b.tryStatus(b.enemies[0], me, { status: 'sleep', chance: 9 }, e), false, `${i + 1}回め`);
    assert.ok(e.lines.some((l) => l.includes('スター')), e.lines.join('/'));
    r88ActEnd(b, me, ev0());
  }
  assert.ok(!me.r88Star, '3回で きえる');
  assert.equal(b.tryStatus(b.enemies[0], me, { status: 'sleep', chance: 9 }, ev0()), true);
  // キャッピー
  const k = hero('mario');
  k.equip.head = 'r88_mr_cappy';
  const bb = fight([k], 3);
  bb.enemies[0].boss = true;
  const e2 = useGear(bb, bb.allies[0], 'use_head');
  assert.ok(!bb.enemies[0].status.confuse, 'ボスには きかない');
  assert.ok(e2.lines.some((l) => l.includes('のりうつれなかった')), e2.lines.join('/'));
  const k2 = hero('mario');
  k2.equip.head = 'r88_mr_cappy';
  let hit = 0;
  for (let s = 1; s <= 10; s++) {
    const b3 = fight([k2], s, { enemies: ['pururin', 'pururin'] });
    useGear(b3, b3.allies[0], 'use_head');
    if (b3.enemies[0].status.confuse) hit++;
  }
  assert.ok(hit >= 5, `ボスで ない 敵は 混乱（${hit}/10）`);
});

// ───────────── とびらと ライバル ─────────────
test('G13: とびら 2まいと ライバル（5人ずつ・弱い 順・さいごは Lv100）', () => {
  const dh = RIVAL_DOORS.find((d) => d.work === 'harrypotter');
  const dm = RIVAL_DOORS.find((d) => d.work === 'mario');
  assert.ok(dh && dm);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  for (const d of [dh, dm]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  assert.ok(dh.jobs.includes('harry') && dm.jobs.includes('mario'));
  const h = rivalsOf('harrypotter');
  assert.deepEqual(h.map((x) => x.id), ['hp_draco', 'hp_twins', 'hp_snape', 'hp_basilisk', 'hp_voldemort']);
  assert.deepEqual(h.map((x) => x.reward), [['r88_hp_hawthorn'], ['r88_hp_club'], ['r88_hp_book'], ['r88_hp_gsword'], ['r88_hp_yew', 'r88_hp_stone']]);
  const m = rivalsOf('mario');
  assert.deepEqual(m.map((x) => x.id), ['mr_noko', 'mr_wario', 'mr_kingboo', 'mr_bowser', 'mr_gbowser']);
  assert.deepEqual(m.map((x) => x.reward), [['r88_mr_spiny'], ['r88_mr_garlic'], ['r88_mr_poltergust'], ['r88_mr_bshell'], ['r88_mr_grand']]);
  for (const list of [h, m]) {
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
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('hp_draco')].bg, 'tower');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('hp_voldemort')].bg, 'castle_top');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('mr_noko')].bg, 'grass');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('mr_bowser')].bg, 'castle_fire');
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G13: ガチャガチャ（2作品が ならぶ。ライバル・伝説・店・試練の ごほうびは 出ない）', () => {
  assert.ok(gachaWorks().includes('harrypotter') && gachaWorks().includes('mario'));
  const ph = gachaPool('harrypotter'), pm = gachaPool('mario');
  assert.equal(ph.all.length, 29);
  assert.equal(pm.all.length, 26);
  for (const [w, p] of [['harrypotter', ph], ['mario', pm]]) {
    const all = new Set(p.all);
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || [trialGiftOf('harry'), trialGiftOf('mario')].includes(id)
        || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  // ホグワーツの 3つの 品・逆転時計・緑の1UPキノコ は ガチャから
  for (const id of [...HOGWARTS4.slice(1), 'r88_hp_time', 'r88_mr_1up', 'r88_hp_beans']) assert.ok(ph.all.includes(id) || pm.all.includes(id), id);
});

test('G13: 試練の ごほうび（ハリーポッター → ひいらぎのつえ・マリオ → マリオのぼうし）', () => {
  assert.equal(trialGiftOf('harry'), 'r88_hp_holly');
  assert.equal(trialGiftOf('mario'), 'r88_mr_cap');
  for (const id of ['r88_hp_holly', 'r88_mr_cap']) assert.equal(gachaBlock(id), 'trial', id);
});

// ───────────── セーブと 引っこし ─────────────
test('G13: セーブと 引っこしコード（ライバル・品・死の 秘宝）', () => {
  const c = hero('harry');
  c.rivals = { hp_voldemort: 1, mr_gbowser: 1 };
  for (const id of ['r88_hp_yew', 'r88_mr_grand', 'r88_mr_1up', ...HOGWARTS4]) addItem(c, id, 1);
  c.equip.weapon = 'elder_wand';
  c.equip.armor = 'invisible_cloak';
  c.equip.acc = 'r88_hp_stone';
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { hp_voldemort: 1, mr_gbowser: 1 });
  assert.equal(itemCount(back, 'r88_mr_1up'), 1);
  assert.equal(back.equip.acc, 'r88_hp_stone');
  assert.equal(gearFxTotals(back).endure, 1);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
