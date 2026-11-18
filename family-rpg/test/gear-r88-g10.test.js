// 第88回 G10班: ナルト・きめつのやいば
//   品の 数・名前が かぶらない・今 ある 品に 作品・使う（ぜんぶ 動く）・刀の 生まれ変わり・そろい・とびら 2まいと ライバル・ガチャ・試練の ごほうび・はじめの 品
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { ITEMS_R88_NARUTO } from '../public/js/shared/data/items-r88-naruto.js';
import { ITEMS_R88_KIMETSU } from '../public/js/shared/data/items-r88-kimetsu.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { rebirthOf, upgradeCost } from '../public/js/shared/data/forge.js';
import { rebirthNeedLack, setTitles } from '../public/js/shared/gear-r88.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, canEquipChar } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, r88ShopItems, TM_R88_DEN, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { workOwned, doorOpen } from '../public/js/shared/rivals-r88.js';
import { makeRng } from '../public/js/shared/rng.js';

const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base && !ITEMS[id].r88Tag);
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

test('G10: 品の 数（ナルト 37・きめつのやいば 33）。作品・読みがな・入れない 品', () => {
  assert.equal(ids('naruto').length, 37);
  assert.equal(ids('kimetsu').length, 33);
  assert.equal(Object.keys(ITEMS_R88_NARUTO).length, 37);
  assert.equal(Object.keys(ITEMS_R88_KIMETSU).length, 33);
  assert.equal(WORKS.naruto.name, 'ナルト');
  assert.equal(WORKS.kimetsu.name, 'きめつのやいば');
  for (const id of [...ids('naruto'), ...ids('kimetsu')]) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 伝説: ナルト 6（飛雷神・しゃくじょう・さめはだ・ばしょうせん・とつか・やた）・きめつ 3（赤く光る・鉄球・始まり）
  assert.equal(ids('naruto').filter((id) => ITEMS[id].grade === 'den').length, 6);
  assert.deepEqual(ids('kimetsu').filter((id) => ITEMS[id].grade === 'den').sort(), ['r88_km_hajimari', 'r88_km_kakuto', 'r88_km_tekkyu']);
  // 入れない 品・こわい 名前
  const names = [...ids('naruto'), ...ids('kimetsu')].map((id) => ITEMS[id].name);
  for (const n of ['首斬', '首切', '斬り', '銃', '血']) assert.ok(!names.some((x) => x.includes(n)), n);
  assert.equal(new Set(names).size, names.length);
  // 今 ある「やたの鏡のたて」と べつ
  assert.notEqual(ITEMS.r88_nr_yata.name, ITEMS.yata_mirror.name);
  assert.ok(!ITEMS.yata_mirror.work);
});

test('G10: 今 ある 品（クナイ・草なぎの剣・日輪刀・炎の羽織）は 作品の 品として 数える。強さ・手に入れ方は そのまま', () => {
  const want = { kunai: ['naruto', 30], kusanagi: ['naruto', null], nichirin: ['kimetsu', 30], flame_haori: ['kimetsu', null] };
  for (const [id, [w, atk]] of Object.entries(want)) {
    const it = ITEMS[id];
    assert.equal(it.work, w, id);
    assert.ok(it.r88Tag, id);
    assert.ok(!it.grade, id);
    if (atk) assert.equal(it.atk, atk, id);
    assert.equal(gachaBlock(id), 'grade', id); // ガチャには 入らない
  }
  assert.equal(ITEMS.nichirin.price, 1300);
  assert.equal(ITEMS.kunai.price, 1700);
  // とびらの 数に 入る（3つで 開く）
  const c = hero();
  c.items = [{ id: 'kunai', n: 1 }, { id: 'kusanagi', n: 1 }];
  assert.equal(workOwned(c, 'naruto'), 2);
  assert.equal(doorOpen(c, 'naruto'), false);
  c.items.push({ id: 'r88_nr_ramen', n: 1 });
  assert.equal(doorOpen(c, 'naruto'), true);
  // せつめいに 作品
  assert.ok(r88DetailLines('nichirin', c).join('\n').includes('作品：きめつのやいば'));
});

test('G10: 刀の 生まれ変わり（日輪刀 → 炎のつばの黒い日輪刀 → 赤く光る日輪刀）', () => {
  assert.deepEqual(REBIRTH.nichirin.to, 'r88_km_tsuba');
  assert.equal(REBIRTH.r88_km_tsuba.to, 'r88_km_kakuto');
  // 店の 日輪刀（★1）でも 1回 きたえると 生まれ変わる
  const rb = rebirthOf('nichirin');
  assert.ok(rb && rb.at === 0);
  const cost = upgradeCost('nichirin', hero());
  assert.ok(cost?.reborn);
  assert.equal(cost.to, 'r88_km_tsuba');
  assert.equal(ITEMS.r88_km_tsuba.grade, 'mei');
  assert.equal(ITEMS.r88_km_kakuto.grade, 'den');
  // 赤く光る日輪刀は 柱の 刀を 3本 持って いる こと
  const c = hero('kisatsu');
  const need = REBIRTH.r88_km_tsuba.need;
  assert.ok(rebirthNeedLack(c, need)?.length > 0);
  c.items = ['r88_km_mizu', 'r88_km_honoo', 'r88_km_kaze'].map((id) => ({ id, n: 1 }));
  assert.equal(rebirthNeedLack(c, need), null);
  // 生まれ変わりの 先は ガチャに 出ない
  assert.equal(gachaBlock('r88_km_tsuba'), 'rebirth');
  // きさつ隊・炎柱が 持てる
  for (const job of ['kisatsu', 'enbashira', 'hinokami']) for (const id of ['nichirin', 'r88_km_tsuba', 'r88_km_kakuto']) assert.ok(canEquipChar(hero(job), id), `${job}: ${id}`);
});

test('G10: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。えんしゅつ 2つ', () => {
  const list = [...ids('naruto'), ...ids('kimetsu')].filter((id) => ITEMS[id].use);
  assert.equal(list.length, 8);
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
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
  }
  // 赤く光る日輪刀は 敵1体に 炎の 大きな ダメージ
  const c = hero('enbashira');
  c.equip.weapon = 'r88_km_kakuto';
  const b = fight([c]);
  b.perform(b.allies[0], { type: 'item', id: 'gear:use_weapon' }, { lines: [], upd: [] });
  assert.equal(b.enemies.filter((e) => e.hp < e.maxHp).length, 1);
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_kakuto', 'r88_basho']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_km_kakuto.use.ability].anim, 'r88_kakuto');
  for (const o of ABILITIES[ITEMS.r88_nr_basho.use.ability].effect.options) assert.equal(ABILITIES[o].anim, 'r88_basho');
});

test('G10: そろい（忍刀七人衆・六道せん人の宝具・とつかの剣とやたの鏡・柱の刀）', () => {
  assert.equal(GEAR_SETS.shinobi7.items.length, 7);
  assert.equal(GEAR_SETS.rikudo_hougu.items.length, 5);
  assert.deepEqual(GEAR_SETS.totsuka_yata.items, ['r88_nr_totsuka', 'r88_nr_yata']);
  assert.equal(GEAR_SETS.hashira9.items.length, 9);
  for (const sid of ['shinobi7', 'rikudo_hougu', 'totsuka_yata', 'hashira9']) for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id]?.set, sid, `${sid}: ${id}`);
  // 柱の 刀: 9本 持つと しょう号
  const c = hero('kisatsu');
  c.items = GEAR_SETS.hashira9.items.map((id) => ({ id, n: 1 }));
  assert.ok(setTitles(c).some((t) => t.title === '九人の柱の友'));
  // 忍刀七人衆: 7本で しょう号
  const n = hero('konoha');
  n.items = GEAR_SETS.shinobi7.items.map((id) => ({ id, n: 1 }));
  assert.ok(setTitles(n).some((t) => t.title === '忍刀七人衆'));
  // とつかの剣 ＋ やたの鏡: 1人が 両方 つけると 反撃
  const h = hero('hero');
  h.equip.weapon = 'r88_nr_totsuka';
  assert.ok(!gearFxTotals(h).counter);
  h.equip.shield = 'r88_nr_yata';
  assert.ok(gearFxTotals(h).counter >= 6);
  // 宝具 3つ 持って 1つ つける → マヒの力
  const k = hero('hero');
  k.equip.acc = 'r88_nr_benihyoutan';
  k.items = [{ id: 'r88_nr_kohaku', n: 1 }];
  const p0 = gearFxTotals(k).paralyze || 0;
  k.items.push({ id: 'r88_nr_koukin', n: 1 });
  assert.equal((gearFxTotals(k).paralyze || 0) - p0, 4);
});

test('G10: とびら 2まいと ライバル（5人ずつ・弱い 順・さいごは Lv100）', () => {
  const dn = RIVAL_DOORS.find((d) => d.work === 'naruto');
  const dk = RIVAL_DOORS.find((d) => d.work === 'kimetsu');
  assert.ok(dn && dk);
  assert.equal(RIVAL_DOORS.filter((d) => d.work === 'naruto' || d.work === 'kimetsu').length, 2);
  assert.deepEqual(dn.jobs, ['konoha', 'hokage']);
  assert.deepEqual(dk.jobs, ['kisatsu', 'enbashira', 'hinokami']);
  for (const d of [dn, dk]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
  }
  const n = rivalsOf('naruto');
  assert.deepEqual(n.map((x) => x.id), ['nr_zabuza', 'nr_kisame', 'nr_kinkaku', 'nr_minato', 'nr_itachi']);
  assert.deepEqual(n.map((x) => x.reward), [['r88_nr_kubikiri'], ['r88_nr_samehada'], ['r88_nr_basho', 'r88_nr_benihyoutan'], ['r88_nr_hiraishin'], ['r88_nr_totsuka', 'r88_nr_yata']]);
  const k = rivalsOf('kimetsu');
  assert.deepEqual(k.map((x) => x.id), ['km_giyu', 'km_rengoku', 'km_tengen', 'km_himejima', 'km_yoriichi']);
  assert.deepEqual(k.map((x) => x.reward), [['r88_km_mizu'], ['r88_km_honoo'], ['r88_km_oto'], ['r88_km_tekkyu'], ['r88_km_hajimari']]);
  for (const list of [n, k]) {
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
  assert.equal(RIVAL_BY_ID.km_yoriichi.job, 'enbashira');
  assert.equal(RIVAL_BY_ID.km_rengoku.job, 'enbashira');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('km_giyu')].bg, 'village_night');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('nr_minato')].bg, 'forest');
});

test('G10: ガチャガチャ（2作品が ならぶ。ライバル・伝説・生まれ変わりの 先・店の 品・試練の ごほうびは 出ない）', () => {
  assert.ok(gachaWorks().includes('naruto') && gachaWorks().includes('kimetsu'));
  const pn = gachaPool('naruto'), pk = gachaPool('kimetsu');
  assert.equal(pn.all.length, 27);
  assert.equal(pk.all.length, 25);
  for (const [w, p] of [['naruto', pn], ['kimetsu', pk]]) {
    const all = new Set(p.all);
    for (const id of ids(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || Object.values(REBIRTH).some((r) => r.to === id) || trialGiftOf('konoha') === id || trialGiftOf('enbashira') === id;
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  // そろえる お金（品の 数 × 20000G）
  assert.equal(pn.all.length * GACHA_PRICE, 540000);
  assert.equal(pk.all.length * GACHA_PRICE, 500000);
  // 宝の洞窟の いちばん おくに 六道せん人のしゃくじょう
  assert.ok(TM_R88_DEN.includes('r88_nr_shakujo'));
});

test('G10: 試練の ごほうび（木の葉の忍び → 初代火影の首かざり・炎柱 → 日の耳かざり）と はじめの 品（木の葉の手裏剣）', () => {
  assert.equal(trialGiftOf('konoha'), 'r88_nr_kubikazari');
  assert.equal(trialGiftOf('enbashira'), 'r88_km_mimikazari');
  assert.equal(gachaBlock('r88_nr_kubikazari'), 'trial');
  assert.equal(gachaBlock('r88_km_mimikazari'), 'trial');
  assert.equal(ITEMS.r88_nr_kubikazari.grade, 'mei');
  assert.equal(ITEMS.r88_km_mimikazari.grade, 'mei');
  assert.equal(ITEMS.r88_nr_shuriken.grade, 'shop');
  assert.ok(r88ShopItems().village.includes('r88_nr_shuriken'));
  assert.ok(!r88ShopItems().village.includes('nichirin'));
});
