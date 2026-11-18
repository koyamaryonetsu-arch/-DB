// 第88回 G11班: るろうに剣心・名探ていコナン・まじっく快と
//   品の 数・名前が かぶらない・今 ある 品に 作品・使う（ぜんぶ 動く）・逆ば刀の 生まれ変わり・そろい・
//   とびら 2まい（コナンと 快とは 1まいに まとめる）と ライバル・ガチャ・試練の ごほうび・はじめの 品
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { ITEMS_R88_KENSHIN } from '../public/js/shared/data/items-r88-kenshin.js';
import { ITEMS_R88_CONAN } from '../public/js/shared/data/items-r88-conan.js';
import { ITEMS_R88_KAITO } from '../public/js/shared/data/items-r88-kaito.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { rebirthOf, upgradeCost, canLimitBreak } from '../public/js/shared/data/forge.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, canEquipChar } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, r88ShopItems, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc, doorWorks } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES, hallLayout } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { workOwned, doorOpen, rivalPaper, rivalTrack } from '../public/js/shared/rivals-r88.js';
import { JOBS } from '../public/js/shared/data/jobs.js';
import { makeRng } from '../public/js/shared/rng.js';

const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base && !ITEMS[id].r88Tag);
const ALL = () => [...ids('kenshin'), ...ids('conan'), ...ids('kaito')];
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

test('G11: 品の 数（るろうに剣心 27・コナン 22・快と 12）。作品・読みがな・入れない 品・名前が かぶらない', () => {
  assert.equal(ids('kenshin').length, 27);
  assert.equal(ids('conan').length, 22);
  assert.equal(ids('kaito').length, 12);
  assert.equal(Object.keys(ITEMS_R88_KENSHIN).length, 27);
  assert.equal(Object.keys(ITEMS_R88_CONAN).length, 22);
  assert.equal(Object.keys(ITEMS_R88_KAITO).length, 12);
  assert.equal(WORKS.kenshin.name, 'るろうに剣心');
  assert.equal(WORKS.conan.name, '名探ていコナン');
  assert.equal(WORKS.kaito.name, 'まじっく快と');
  for (const id of ALL()) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 伝説: るろうに剣心 3（無限じん・飛天の白いマント・ききょうせん冬月）・快と 1（パンドラ）・コナン 0
  assert.deepEqual(ids('kenshin').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_ks_fuyutsuki', 'r88_ks_mantle', 'r88_ks_mugen']);
  assert.deepEqual(ids('kaito').filter((id) => ITEMS[id].grade === 'den'), ['r88_kt_pandora']);
  assert.equal(ids('conan').filter((id) => ITEMS[id].grade === 'den').length, 0);
  // 入れない 品（本物の 銃・大砲・毒）・こわい 名前
  const names = ALL().map((id) => ITEMS[id].name);
  for (const n of ['銃', '砲', '毒', '斬り', '殺', '血']) assert.ok(!names.some((x) => x.includes(n)), n);
  assert.equal(new Set(names).size, names.length);
  // 今 ある 品・技と かぶらない（YAIBA の 竹刀・きく一文字、博士の 発明の 技 など）
  const others = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!it.base && !ALL().includes(id)) others.set(it.name, id);
  const abs = new Set(Object.entries(ABILITIES).filter(([id]) => !id.startsWith('r88u_')).map(([, a]) => a.name));
  for (const n of names) {
    assert.ok(!others.has(n), `${n}: ${others.get(n)}`);
    assert.ok(!abs.has(n), `${n}: 技`);
  }
});

test('G11: 今 ある 品（逆ば刀・名工の逆ば刀・虫めがね・名探ていのステッキ・マジックステッキ など）は 作品の 品として 数える。強さ・手に入れ方は そのまま', () => {
  const want = {
    sakabatou: ['kenshin', 7, 90], master_sakabatou: ['kenshin', 66, 0],
    mushimegane: ['conan', 5, 50], spy_glasses: ['conan', null, 60], detective_cane: ['conan', null, 0], spy_pen: ['conan', null, 0], fq_detective_glass: ['conan', null, 0],
    magic_wand: ['kaito', 5, 50], silk_hat: ['kaito', null, 160], kid_mantle: ['kaito', null, 0],
  };
  for (const [id, [w, atk, price]] of Object.entries(want)) {
    const it = ITEMS[id];
    assert.equal(it.work, w, id);
    assert.ok(it.r88Tag, id);
    assert.ok(!it.grade, id);
    if (atk) assert.equal(it.atk, atk, id);
    if (price) assert.equal(it.price, price, id);
    assert.equal(gachaBlock(id), 'grade', id);
  }
  assert.equal(ITEMS.kid_mantle.src, 'tm');
  assert.equal(ITEMS.master_sakabatou.src, 'tm');
  const c = hero();
  c.items = [{ id: 'sakabatou', n: 1 }, { id: 'master_sakabatou', n: 1 }];
  assert.equal(workOwned(c, 'kenshin'), 2);
  assert.equal(doorOpen(c, 'kenshin'), false);
  c.items.push({ id: 'r88_ks_gyunabe', n: 1 });
  assert.equal(doorOpen(c, 'kenshin'), true);
  assert.ok(r88DetailLines('magic_wand', c).join('\n').includes('作品：まじっく快と'));
  assert.ok(r88DetailLines('mushimegane', c).join('\n').includes('作品：名探ていコナン'));
});

test('G11: 逆ば刀（店の 品）→ 1回 きたえると 名工の逆ば刀。名工の逆ば刀は 今の まま 限界とっぱ できる', () => {
  assert.equal(REBIRTH.sakabatou.to, 'master_sakabatou');
  const rb = rebirthOf('sakabatou');
  assert.ok(rb && rb.at === 0);
  const cost = upgradeCost('sakabatou', hero('rurouni'));
  assert.ok(cost?.reborn);
  assert.equal(cost.to, 'master_sakabatou');
  // 名工の逆ば刀は 生まれ変わりの 先でも 限界とっぱ できる（lbOk。前から ある 品の きまりの まま）
  let id = 'master_sakabatou';
  const c = hero('himura');
  while (upgradeCost(id, c) && !upgradeCost(id, c).limit) id = upgradeCost(id, c).to;
  assert.ok(canLimitBreak(id, c), id);
  // 売っても もうからない（90G ＋ 6000G より 売り値が 下）
  assert.ok(ITEMS.master_sakabatou.sell < ITEMS.sakabatou.price + REBIRTH.sakabatou.gold);
  for (const job of ['rurouni', 'hitokiri', 'himura', 'hiten']) for (const x of ['sakabatou', 'master_sakabatou', 'r88_ks_fuyutsuki', 'r88_ks_mugen']) assert.ok(canEquipChar(hero(job), x), `${job}: ${x}`);
});

test('G11: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。えんしゅつ 3つ', () => {
  const list = ALL().filter((id) => ITEMS[id].use);
  assert.deepEqual(list.sort(), ['r88_cn_henseiki', 'r88_cn_masui', 'r88_ks_mugen', 'r88_kt_dummy', 'r88_kt_glider', 'r88_kt_spray']);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c]);
    const me = b.allies[0];
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = { lines: [], upd: [] };
    b.perform(me, { type: 'item', id: `gear:${u.slot}` }, ev);
    assert.equal(me.mp, mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 1, `${id}: ${ev.lines.join('/')}`);
  }
  // 腕時計型ますいじゅうは 作品どおり 1発（ねむり・敵1体）
  const a = ABILITIES[ITEMS.r88_cn_masui.use.ability];
  assert.equal(a.target, 'enemy');
  assert.equal(a.effect.status, 'sleep');
  // 無限じんは 敵1体に 炎
  const c = hero('himura');
  c.equip.weapon = 'r88_ks_mugen';
  const b = fight([c]);
  b.perform(b.allies[0], { type: 'item', id: 'gear:use_weapon' }, { lines: [], upd: [] });
  assert.equal(b.enemies.filter((e) => e.hp < e.maxHp).length, 1);
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const an of ['r88_guren', 'r88_masui', 'r88_kid']) {
    assert.ok(R88_ANIMS.has(an), an);
    assert.equal(playR88Fx(fake, an, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, an);
  }
  assert.equal(ABILITIES.r88u_ks_guren.anim, 'r88_guren');
  assert.equal(ABILITIES.r88u_kt_glider.anim, 'r88_kid');
});

test('G11: そろい（ティンベーとローチン・シューズとボール射出ベルト）', () => {
  assert.deepEqual(GEAR_SETS.tinbe_rochin.items, ['r88_ks_tinbe', 'r88_ks_rochin']);
  assert.deepEqual(GEAR_SETS.conan_kick.items, ['r88_cn_shoes', 'r88_cn_belt']);
  for (const sid of ['tinbe_rochin', 'conan_kick']) for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id]?.set, sid);
  const h = hero('hero');
  h.equip.shield = 'r88_ks_tinbe';
  const c0 = gearFxTotals(h).counter || 0;
  h.equip.weapon = 'r88_ks_rochin';
  assert.equal((gearFxTotals(h).counter || 0) - c0, 6);
  const m = hero('meitantei');
  m.equip.weapon = 'r88_cn_belt';
  const k0 = gearFxTotals(m).chase || 0;
  m.equip.acc = 'r88_cn_shoes';
  assert.equal((gearFxTotals(m).chase || 0) - k0, 6);
  assert.ok(canEquipChar(m, 'r88_cn_belt'));
});

test('G11: とびら 2まい（るろうに剣心・コナンと快と〈2作品の 品の 合計で 開く〉）と ライバル（5人ずつ・弱い 順・さいごは Lv100）', () => {
  const dk = RIVAL_DOORS.find((d) => d.work === 'kenshin');
  const dc = RIVAL_DOORS.find((d) => d.work === 'conan');
  assert.ok(dk && dc);
  assert.ok(!RIVAL_DOORS.some((d) => d.work === 'kaito'), '快とは コナンの とびらに まとめる');
  assert.equal(RIVAL_DOORS.filter((d) => d.work === 'kenshin' || d.work === 'conan').length, 2);
  assert.deepEqual(doorWorks('conan'), ['conan', 'kaito']);
  assert.deepEqual(doorWorks('kenshin'), ['kenshin']);
  for (const d of [dk, dc]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
    for (const j of d.jobs) assert.ok(JOBS[j], j);
  }
  // 回ろうに ならぶ・かんばんの 名前
  const L = hallLayout();
  assert.ok(L.doors.some((d) => d.work === 'conan') && L.doors.some((d) => d.work === 'kenshin'));
  assert.ok(MAPS.rival_hall.boards.some((b) => b.name === 'コナン・快とのとびら'));
  // 2作品の 品の 合計で 開く（コナン 1 ＋ 快と 2 ＝ 3）
  const c = hero();
  c.items = [{ id: 'r88_cn_unaju', n: 1 }, { id: 'r88_kt_hato', n: 1 }];
  assert.equal(workOwned(c, 'conan'), 2);
  assert.equal(doorOpen(c, 'conan'), false);
  c.items.push({ id: 'silk_hat', n: 1 });
  assert.equal(workOwned(c, 'conan'), 3);
  assert.equal(doorOpen(c, 'conan'), true);
  const paper = rivalPaper(c, 'conan');
  assert.equal(paper.workName, 'コナン・快と');
  assert.equal(paper.own, 3);
  assert.ok(rivalTrack(c).items.some((x) => x.name === 'コナン・快とのとびら'));
  // ライバル
  const k = rivalsOf('kenshin');
  assert.deepEqual(k.map((x) => x.id), ['ks_aoshi', 'ks_sojiro', 'ks_enishi', 'ks_shishio', 'ks_hiko']);
  assert.deepEqual(k.map((x) => x.reward), [['r88_ks_kodachi'], ['r88_ks_kikuichi'], ['r88_ks_wato'], ['r88_ks_mugen'], ['r88_ks_mantle', 'r88_ks_fuyutsuki']]);
  const n = rivalsOf('conan');
  assert.deepEqual(n.map((x) => x.id), ['cn_kyogoku', 'kt_hakuba', 'cn_akai', 'kt_kid', 'kt_kidmoon']);
  assert.deepEqual(n.map((x) => x.reward), [['r88_cn_kyogoku'], ['r88_kt_watch'], ['r88_cn_knit'], ['r88_kt_card', 'r88_kt_suit'], ['r88_kt_pandora']]);
  assert.equal(rivalsOf('kaito').length, 0);
  for (const list of [k, n]) {
    assert.ok(list.length <= 5);
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
      for (const id of rv.reward) assert.ok(doorWorks(rv.work).includes(ITEMS[id].work), id);
    }
  }
  assert.equal(RIVAL_BY_ID.kt_kidmoon.reward[0], 'r88_kt_pandora');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('ks_shishio')].bg, 'castle_fire');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('cn_kyogoku')].bg, 'village_night');
});

test('G11: ガチャガチャ（3作品が ならぶ。ライバル・伝説・生まれ変わりの 先・店の 品・試練の ごほうびは 出ない）', () => {
  for (const w of ['kenshin', 'conan', 'kaito']) assert.ok(gachaWorks().includes(w), w);
  const want = { kenshin: 19, conan: 19, kaito: 7 };
  for (const [w, n] of Object.entries(want)) {
    const p = gachaPool(w);
    assert.equal(p.all.length, n, w);
    assert.equal(p.all.length * GACHA_PRICE, n * 20000);
    const all = new Set(p.all);
    const rivals = rivalsOf(w === 'kaito' ? 'conan' : w);
    for (const id of ids(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivals.some((rv) => rv.reward.includes(id)) || Object.values(REBIRTH).some((r) => r.to === id)
        || ['himura', 'meitantei', 'kaito_kid'].some((j) => trialGiftOf(j) === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  // 紅子の魔法の鏡・黒ずくめの服（7-1 の 行から 外した 人の 品）は ガチャの 名品
  assert.ok(gachaPool('kaito').mei.includes('r88_kt_mirror'));
  assert.ok(gachaPool('conan').mei.includes('r88_cn_kuro'));
});

test('G11: 試練の ごほうび（ひ村ばっ刀さい → 赤い着物・名探てい → うで時計型ますいじゅう・かいとうキッド → モノクル）と はじめの 品（神谷道場の竹刀）', () => {
  assert.equal(trialGiftOf('himura'), 'r88_ks_kimono');
  assert.equal(trialGiftOf('meitantei'), 'r88_cn_masui');
  assert.equal(trialGiftOf('kaito_kid'), 'r88_kt_monocle');
  for (const id of ['r88_ks_kimono', 'r88_cn_masui', 'r88_kt_monocle']) assert.equal(gachaBlock(id), 'trial', id);
  assert.ok(canEquipChar(hero('himura'), 'r88_ks_kimono'));
  assert.equal(ITEMS.r88_ks_shinai.grade, 'shop');
  assert.ok(r88ShopItems().village.includes('r88_ks_shinai'));
  assert.ok(!r88ShopItems().village.includes('sakabatou'));
});
