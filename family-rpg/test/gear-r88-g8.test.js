// 第88回 G8班: らんま1/2・じごく先生ぬ〜べ〜
//   品の 数・名前・使う（ぜんぶ 動く）・呪泉郷の 水と お湯の やかん・そろい・職業の 部位・とびら 2まいと ライバル・ガチャ・試練の ごほうび・はじめの 品
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { ITEMS_R88_RANMA } from '../public/js/shared/data/items-r88-ranma.js';
import { ITEMS_R88_NUBE } from '../public/js/shared/data/items-r88-nube.js';
import { gearFxTotals } from '../public/js/shared/data/gear-fx.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { setTitles } from '../public/js/shared/gear-r88.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, computeStats, canEquipChar } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, r88ShopItems } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc } from '../public/js/shared/data/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { makeRng } from '../public/js/shared/rng.js';

const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
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

test('G8: 品の 数（らんま1/2 34・ぬ〜べ〜 24）。作品・読みがな・入れない 品', () => {
  assert.equal(ids('ranma').length, 34);
  assert.equal(ids('nube').length, 24);
  assert.equal(Object.keys(ITEMS_R88_RANMA).length, 34);
  assert.equal(Object.keys(ITEMS_R88_NUBE).length, 24);
  assert.ok(WORKS.ranma && WORKS.nube);
  for (const id of [...ids('ranma'), ...ids('nube')]) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // らんまは 伝説なし・ぬ〜べ〜は おにの手だけ 伝説（アクセ）
  assert.equal(ids('ranma').filter((id) => ITEMS[id].grade === 'den').length, 0);
  assert.deepEqual(ids('nube').filter((id) => ITEMS[id].grade === 'den'), ['r88_nb_onite']);
  assert.equal(ITEMS.r88_nb_onite.type, 'acc');
  // 入れない 品（のどかの 日本刀・こわい 物）
  const names = [...ids('ranma'), ...ids('nube')].map((id) => ITEMS[id].name);
  for (const n of ['日本刀', '頭の骨', '絶', '口さけ']) assert.ok(!names.some((x) => x.includes(n)), n);
  // 名前が 2つの 作品で かぶらない
  assert.equal(new Set(names).size, names.length);
});

test('G8: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）', () => {
  const list = [...ids('ranma'), ...ids('nube')].filter((id) => ITEMS[id].use);
  assert.equal(list.length, 14);
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
  // おにの手は 敵1体に 大きな ダメージ
  const c = hero('nube');
  c.equip.acc = 'r88_nb_onite';
  const b = fight([c]);
  b.perform(b.allies[0], { type: 'item', id: 'gear:use_acc' }, { lines: [], upd: [] });
  assert.equal(b.enemies.filter((e) => e.hp < e.maxHp).length, 1);
  // えんしゅつ（作品の 顔の 3つ）
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_onite', 'r88_kaen', 'r88_hanabi']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_nb_onite.use.ability].anim, 'r88_onite');
  assert.equal(ABILITIES[ITEMS.r88_rm_kaen.use.ability].anim, 'r88_kaen');
  assert.equal(ABILITIES[ITEMS.r88_rm_happo.use.ability].anim, 'r88_hanabi');
});

test('G8: 呪泉郷の 水（上がる 所と 下がる 所）。お湯の やかんを 持って いると 下がる 所が 消える', () => {
  const c = hero('ranma');
  const base = computeStats(c);
  c.equip.acc = 'r88_rm_nyan';
  const nyan = computeStats(c);
  assert.ok(nyan.agi > base.agi, '素早さが 上がる');
  assert.ok(nyan.str < base.str, '力が 下がる');
  c.items.push({ id: 'r88_rm_yakan', n: 1 });
  const hot = computeStats(c);
  assert.equal(hot.str, base.str, 'やかんで 力が もどる');
  assert.equal(hot.agi, nyan.agi, '上がる 所は そのまま');
  // パンダ・こぶたも
  for (const [id, k] of [['r88_rm_panda', 'agi'], ['r88_rm_buta', 'maxHp']]) {
    const d = hero('ranma');
    const b0 = computeStats(d);
    d.equip.acc = id;
    assert.ok(computeStats(d)[k] < b0[k], `${id}: 下がる`);
    d.items.push({ id: 'r88_rm_yakan', n: 1 });
    assert.equal(computeStats(d)[k], b0[k], `${id}: やかんで もどる`);
  }
  // 説明に そろいの 文
  const lines = r88DetailLines('r88_rm_nyan', c).join('\n');
  assert.ok(lines.includes('呪泉郷の水とお湯のやかん'), lines);
  assert.ok(lines.includes('下がる所が消える'), lines);
  // 4つで しょう号
  c.items.push({ id: 'r88_rm_panda', n: 1 }, { id: 'r88_rm_buta', n: 1 });
  assert.ok(setTitles(c).some((t) => t.title === '水とお湯の格闘家'));
});

test('G8: そろい（止水おけ ＋ 開水つぼ・ぬ〜べ〜の 3つ）', () => {
  assert.deepEqual(GEAR_SETS.shisui_kaisui.items, ['r88_rm_shisui', 'r88_rm_kaisui']);
  assert.deepEqual(GEAR_SETS.nube_three.items, ['r88_nb_kannon', 'r88_nb_suisho', 'r88_nb_nenju']);
  for (const [sid, set] of Object.entries(GEAR_SETS)) for (const id of set.items) assert.equal(ITEMS[id]?.set, sid, `${sid}: ${id}`);
  const c = hero('ranma');
  c.equip.acc = 'r88_rm_shisui';
  assert.ok(!gearFxTotals(c).guard_paralyze);
  c.items.push({ id: 'r88_rm_kaisui', n: 1 });
  assert.ok(gearFxTotals(c).guard_paralyze >= 4);
  const n = hero('nube');
  n.equip.weapon = 'r88_nb_kannon';
  n.items.push({ id: 'r88_nb_suisho', n: 1 });
  assert.ok(!gearFxTotals(n).slay_spirit);
  n.items.push({ id: 'r88_nb_nenju', n: 1 });
  assert.equal(gearFxTotals(n).slay_spirit, 5);
});

test('G8: 職業の 部位（ぬ〜べ〜は つえ・たて・ローブ。ツメは 持てない。乱馬は ツメと 道着）', () => {
  const n = hero('nube');
  for (const id of ['r88_nb_kannon', 'r88_nb_monosashi', 'r88_nb_shusseki', 'r88_nb_randoseru', 'r88_nb_kimono', 'r88_nb_onite', 'r88_nb_yoroi']) assert.ok(canEquipChar(n, id), id);
  const r = hero('ranma');
  for (const id of ['r88_rm_china', 'r88_rm_akane_gi']) assert.ok(canEquipChar(r, id), id);
  assert.equal(ITEMS.r88_rm_china.armorType, 'gi');
});

test('G8: とびら 2まいと ライバル（5人ずつ・弱い 順・らんまの さいごは 名品で Lv80・ぬ〜べ〜の さいごは Lv100）', () => {
  const dr = RIVAL_DOORS.find((d) => d.work === 'ranma');
  const dn = RIVAL_DOORS.find((d) => d.work === 'nube');
  assert.ok(dr && dn);
  // 第98回 K4班: きずなの職業「おてんき格闘流の師はん」は 新しい 系統の 方の 作品（らんま1/2）
  assert.deepEqual(dr.jobs, ['musabetsu_student', 'ranma', 'hiryu_master', 'otenki_shihan']);
  assert.deepEqual(dn.jobs, ['elem_teacher', 'nube', 'jigoku_sensei']);
  for (const d of [dr, dn]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
  }
  const r = rivalsOf('ranma');
  assert.deepEqual(r.map((x) => x.id), ['rm_kuno', 'rm_shampoo', 'rm_ryoga', 'rm_happosai', 'rm_cologne']);
  assert.deepEqual(r.map((x) => x.reward), [['r88_rm_bokuto'], ['r88_rm_sosui'], ['r88_rm_bangasa'], ['r88_rm_happo', 'r88_rm_nanban'], ['r88_rm_kaen', 'r88_rm_hanten']]);
  const n = rivalsOf('nube');
  assert.deepEqual(n.map((x) => x.id), ['nb_izuna', 'nb_yukime', 'nb_tamamo', 'nb_minki', 'nb_haki']);
  assert.deepEqual(n.map((x) => x.reward), [['r88_nb_kuda'], ['r88_nb_kimono'], ['r88_nb_sasumata', 'r88_nb_karin'], ['r88_nb_yoroi'], ['r88_nb_onite']]);
  for (const list of [r, n]) {
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    for (const rv of list) {
      const last = rv === list[list.length - 1];
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      assert.equal(rivalTier(rv.lv), den ? 100 : last ? 80 : 60, `${rv.id}: Lv${rv.lv}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
    }
  }
  assert.equal(RIVAL_BY_ID.rm_cologne.job, 'daikenja');
  assert.equal(RIVAL_BY_ID.nb_haki.job, 'jigoku_sensei');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('nb_izuna')].bg, 'village_night');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('rm_kuno')].bg, 'grass');
});

test('G8: ガチャガチャ（2作品が ならぶ。ライバル・伝説・試練の ごほうび・店の 品は 出ない）', () => {
  assert.ok(gachaWorks().includes('ranma') && gachaWorks().includes('nube'));
  const pr = gachaPool('ranma'), pn = gachaPool('nube');
  assert.equal(pr.all.length, 26);
  assert.equal(pn.all.length, 16);
  for (const [w, p] of [['ranma', pr], ['nube', pn]]) {
    const all = new Set(p.all);
    for (const id of ids(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivalsOf(w).some((rv) => rv.reward.includes(id)) || trialGiftOf('ranma') === id || trialGiftOf('nube') === id;
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  // 呪泉郷の 水・やかん・止水おけ と 開水つぼは ガチャから
  for (const id of ['r88_rm_nyan', 'r88_rm_panda', 'r88_rm_buta', 'r88_rm_yakan', 'r88_rm_shisui', 'r88_rm_kaisui', 'r88_nb_suisho', 'r88_nb_nenju']) assert.ok(gachaPool(ITEMS[id].work).all.includes(id), id);
});

test('G8: 試練の ごほうび（乱馬 → 赤い中国服・ぬ〜べ〜 → 白衣観音経）と はじめの 品（竹のものさし）', () => {
  assert.equal(trialGiftOf('ranma'), 'r88_rm_china');
  assert.equal(trialGiftOf('nube'), 'r88_nb_kannon');
  assert.equal(gachaBlock('r88_rm_china'), 'trial');
  assert.equal(gachaBlock('r88_nb_kannon'), 'trial');
  assert.equal(ITEMS.r88_nb_monosashi.grade, 'shop');
  assert.ok(r88ShopItems().village.includes('r88_nb_monosashi'));
  assert.ok(Object.values(SHOPS).length > 0);
});
