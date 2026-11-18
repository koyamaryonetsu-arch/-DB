// 第88回 G15班: ダイの大冒険・ドラゴンクエスト
//   品の 数・名前が かぶらない・今 ある 品の 作品（天空の剣 など）・全部の 品に 手に入れ方が ある・ダイの剣の 生まれ変わり（は者のかんむり）・
//   そろい 4つ（アバンのしるし・天地魔闘・ロトの装備・天空の装備）・呪文を はね返す（シャハルの鏡・天空のたて）・動けなく する（ボスは だめ）・
//   光魔のつえ・まじんのかなづち・使う 品・とびら 3まいと ライバル（大魔王の城は ダイの大冒険の 品で 開く）・竜王のひ孫の じょうけん・
//   ガチャ・試練の ごほうび・セーブと 引っこし
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { ITEMS_R88_DAI, ABAN_MARKS, DAI_SWORD, HASHA_SWORD, HASHA_CROWN } from '../public/js/shared/data/items-r88-dai.js';
import { ITEMS_R88_DQ, ROTO_GEAR, TENKU_GEAR } from '../public/js/shared/data/items-r88-dq.js';
import { setTitles, rebirthNeedLack, wearSetPower } from '../public/js/shared/gear-r88.js';
import { rebirthOf, upgradeCost } from '../public/js/shared/data/forge.js';
import { upgradeId } from '../public/js/shared/data/items-forge.js';
import { attackMods } from '../public/js/shared/battle-gearfx.js';
import { r88dqAtkMult } from '../public/js/shared/battle-r88-dq.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { gachaBlock, gachaPool, gachaWorks, trialGiftOf, TM_R88_DEN, GACHA_PRICE } from '../public/js/shared/data/gacha-r88.js';
import { RIVAL_DOORS, RIVAL_BY_ID, rivalsOf, rivalTier, rivalEnc, doorWorks, doorOf } from '../public/js/shared/data/rivals-r88.js';
import { workOwned, doorOpen, rivalPaper, rivalButtons, rivalNeedLack, rivalReady, doorGoods, refreshDoorFlags } from '../public/js/shared/rivals-r88.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { ROOM_STYLES } from '../public/js/shared/maps/rivals-r88.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { R88_BOARD_ICONS } from '../public/js/client/render/boards-r88.js';
import { playR88Fx, R88_ANIMS } from '../public/js/client/render/battlefx-r88.js';
import { exportCode, parseCode, splitCode } from '../public/js/shared/world/transfer.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { makeRng } from '../public/js/shared/rng.js';

const MY = ['dai', 'dq'];
const ids = (work) => Object.keys(ITEMS).filter((id) => ITEMS[id].work === work && !ITEMS[id].base);
const newIds = (work) => ids(work).filter((id) => ITEMS[id].src === 'r88');
const mineAll = () => [...newIds('dai'), ...newIds('dq')];
function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job;
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
  return c;
}
function fight(chars, enemies = ['rockman', 'rockman', 'pururin']) {
  const b = new Battle({ rng: makeRng(12), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const useGear = (b, me, slot) => {
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'item', id: `gear:${slot}` }, ev);
  return ev;
};

// ───────────── 品 ─────────────
test('G15: 品の 数（ダイの大冒険 31・ドラゴンクエスト 28）。今 ある 品にも 作品（天空の剣 など。強さ・値段は そのまま）', () => {
  assert.equal(Object.keys(ITEMS_R88_DAI).length, 31);
  assert.equal(Object.keys(ITEMS_R88_DQ).length, 28);
  assert.equal(newIds('dai').length, 31);
  assert.equal(newIds('dq').length, 28);
  assert.equal(WORKS.dai.name, 'ダイの大冒険');
  assert.equal(WORKS.dq.name, 'ドラゴンクエスト');
  assert.deepEqual(ids('dai').filter((id) => ITEMS[id].src !== 'r88'), []);
  assert.deepEqual(ids('dq').filter((id) => ITEMS[id].src !== 'r88').sort(), ['dragon_slayer', 'hayabusa_sword', 'tenku_mail', 'tenku_sword']);
  for (const id of ['dragon_slayer', 'hayabusa_sword', 'tenku_mail', 'tenku_sword']) {
    assert.ok(ITEMS[id].r88Tag, id);
    assert.equal(gachaBlock(id), 'grade', id);
  }
  assert.equal(ITEMS.tenku_sword.atk, 81);
  assert.equal(ITEMS.tenku_sword.src, 'ruin');
  assert.equal(ITEMS.tenku_sword.set, 'tenku');
  assert.equal(ITEMS.tenku_mail.set, 'tenku');
  for (const id of mineAll()) {
    const it = ITEMS[id];
    assert.ok(it.name && it.desc, id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 名前が かぶらない（今 ある 品・技とも。2作品の 中でも）
  const mine = new Set(mineAll());
  const others = new Set(Object.entries(ITEMS).filter(([id, it]) => !it.base && !mine.has(id)).map(([, it]) => it.name));
  const abNames = new Set(Object.entries(ABILITIES).filter(([id]) => !/^r88u_(da|dq)_/.test(id)).map(([, a]) => a.name));
  const names = [...mine].map((id) => ITEMS[id].name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.ok(!others.has(n) && !abNames.has(n), n);
  const myAb = Object.keys(ABILITIES).filter((id) => /^r88u_(da|dq)_/.test(id)).map((id) => ABILITIES[id].name);
  assert.equal(myAb.length, 13);
  for (const n of myAb) assert.ok(!others.has(n) && !names.includes(n) && !abNames.has(n), `技 ${n}`);
  // 名前の 重なりを さけた 品（ロトの光の玉・いなずまのつるぎ・ロトの聖なる守り・ミストバーンの闇の衣）
  assert.equal(ITEMS.r88_dq_hikaritama.name, 'ロトの光の玉');
  assert.equal(ITEMS.r88_dq_inazuma.name, 'いなずまのつるぎ');
  assert.equal(ITEMS.r88_dq_roto_mark.name, 'ロトの聖なる守り');
  assert.equal(ITEMS.r88_da_yami.name, 'ミストバーンの闇の衣');
  // 伝説
  assert.deepEqual(newIds('dai').filter((id) => ITEMS[id].grade === 'den').sort(),
    ['r88_da_daisword', 'r88_da_kigan', 'r88_da_kouma', 'r88_da_namida', 'r88_da_seiou', 'r88_da_shahal', 'r88_da_shinma']);
  assert.equal(newIds('dq').filter((id) => ITEMS[id].grade === 'den').length, 10);
  // 黒の核しょう・本物の 銃は ない（魔だんじゅうは 呪文を こめる 道具）
  for (const id of mineAll()) assert.ok(!/核|銃|ピストル|ばくだん/.test(ITEMS[id].name), id);
  assert.ok(ITEMS.r88_da_madan.desc.includes('呪文'));
  // はかいの鉄球は 敵全体・グリンガムのムチは 1グループ。グリンガムは 伝説の ムチ（雷公べんと ならぶ）
  assert.equal(ITEMS.r88_dq_tekkyu.reach, 'all');
  assert.equal(ITEMS.r88_dq_gringham.reach, 'group');
  assert.equal(ITEMS.r88_dq_gringham.atk, ITEMS.r88_raikoben.atk);
});

test('G15: 手に 入らない 品は ない（店・ガチャ・ライバル・試練・生まれ変わり・宝の洞窟の いちばん おく）', () => {
  const shop = new Set(Object.values(SHOPS).flatMap((s) => shopItems(s, () => true)));
  const trial = new Set(Object.values(WORKS).flatMap((w) => Object.values(w.trialGift || {})));
  const rival = new Set(RIVAL_DOORS.filter((d) => doorWorks(d.work).some((w) => MY.includes(w))).flatMap((d) => rivalsOf(d.work).flatMap((rv) => rv.reward)));
  for (const w of MY) {
    const pool = new Set(gachaPool(w).all);
    for (const id of newIds(w)) {
      const how = [shop.has(id) && '店', pool.has(id) && 'ガチャ', rival.has(id) && 'ライバル', trial.has(id) && '試練',
        TM_R88_DEN.includes(id) && '宝', Object.values(REBIRTH).some((r) => r.to === id) && '生まれ変わり'].filter(Boolean);
      assert.ok(how.length, `${id}: 手に入れ方が ない`);
      // 伝説は ライバル・宝の洞窟・生まれ変わり の どれか
      if (ITEMS[id].grade === 'den') assert.ok(how.some((h) => ['ライバル', '宝', '生まれ変わり'].includes(h)), `${id}: ${how}`);
    }
  }
  for (const id of ['r88_da_seiou', 'r88_da_namida', 'r88_dq_roto_armor', 'r88_dq_roto_shield', 'r88_dq_tekkyu', 'r88_dq_gringham', 'r88_dq_mk_sword', 'r88_dq_tenku_helm', 'r88_dq_rubiss']) {
    assert.ok(TM_R88_DEN.includes(id), `${id}: 宝の洞窟の いちばん おく`);
  }
  assert.ok(shop.has('r88_da_papnica') && shop.has('r88_da_booster'), 'はじめの 品は 店に');
});

// ───────────── ダイの剣 ─────────────
test('G15: ダイの剣 … は者の剣を、は者のかんむりを 持って いる 時に 上限の あと きたえると 生まれ変わる（かんむりは のこる）', () => {
  const rb = rebirthOf(HASHA_SWORD);
  assert.equal(rb.to, DAI_SWORD);
  assert.deepEqual(rb.need, { items: [HASHA_CROWN] });
  const cost = upgradeCost(upgradeId(HASHA_SWORD, rb.at), null);
  assert.ok(cost.reborn && cost.need);
  assert.equal(ITEMS[cost.to].base || cost.to, DAI_SWORD);
  const c = hero('dragon_knight');
  assert.deepEqual(rebirthNeedLack(c, cost.need), ['は者のかんむりを持っていること']);
  c.bank = { gold: 0, items: [{ id: HASHA_CROWN, n: 1 }] }; // 預かり所でも よい
  assert.equal(rebirthNeedLack(c, cost.need), null);
  // は者の剣は ハドラーの ごほうび・かんむりは ガチャ・ダイの剣は 伝説（ガチャに 出ない）
  assert.ok(RIVAL_BY_ID.da_hadlar.reward.includes(HASHA_SWORD));
  assert.ok(gachaPool('dai').all.includes(HASHA_CROWN));
  assert.equal(gachaBlock(DAI_SWORD), 'legend');
  assert.equal(ITEMS[DAI_SWORD].use.ability, 'r88u_da_saya');
});

// ───────────── そろい ─────────────
test('G15: そろい 4つ（アバンのしるし party・天地魔闘 wear・ロトの装備・天空の装備）', () => {
  for (const sid of ['aban_mark', 'tenchi_matou', 'roto', 'tenku']) for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id].set, sid, `${sid}: ${id}`);
  assert.deepEqual(GEAR_SETS.aban_mark.items, ABAN_MARKS);
  assert.deepEqual(GEAR_SETS.roto.items, ROTO_GEAR);
  assert.deepEqual(GEAR_SETS.tenku.items, TENKU_GEAR);
  // アバンのしるし: パーティーで つけた 数だけ、みんなが 状態異常に かかりにくい
  const a = hero('warrior');
  const b1 = hero('warrior');
  b1.id = 'p2';
  const base = fight([a, b1]).allies[1].resist.sleep ?? 1;
  a.equip.acc = ABAN_MARKS[1];
  const one = fight([a, b1]).allies[1].resist.sleep;
  b1.equip.acc = ABAN_MARKS[2];
  const two = fight([a, b1]);
  assert.ok(one < base, '1つで 少し');
  assert.ok(two.allies[1].resist.sleep < one, '2つで もっと');
  for (const x of two.allies) assert.ok(x.partySet && x.resist.paralyze < 1 && x.resist.confuse < 1);
  // 天地魔闘: 1人が 3つで 反撃
  const m = hero('maou', 90);
  m.equip.weapon = 'r88_da_kouma';
  m.equip.acc = 'r88_da_kigan';
  assert.ok(!wearSetPower(m).fx.some((x) => x.k === 'counter'), '2つでは まだ');
  m.equip.armor = 'r88_da_yami';
  assert.ok(wearSetPower(m).fx.some((x) => x.k === 'counter' && x.v >= 8), '3つで 反撃');
  // ロトの装備: 1人が 3つで 力・5つ 持つと しょう号
  const r = hero('loto_hero', 90);
  r.equip.weapon = 'r88_dq_roto_sword';
  r.equip.armor = 'r88_dq_roto_armor';
  const st2 = computeStats(r);
  r.equip.shield = 'r88_dq_roto_shield';
  assert.deepEqual(wearSetPower(r).add, { str: 10, mag: 10 });
  assert.ok(computeStats(r).mag >= st2.mag + 10);
  assert.ok(!setTitles(r).some((t) => t.set === 'roto'));
  for (const id of ['r88_dq_roto_helm', 'r88_dq_roto_mark']) addItem(r, id, 1);
  assert.ok(setTitles(r).some((t) => t.title === 'ロトの血をひく者'));
  // 天空の装備: 今 ある 剣・よろい ＋ たて・かぶと。1人が 4つで 炎・氷に 強い・しょう号
  const t = hero('hero', 90);
  t.equip.weapon = 'tenku_sword';
  t.equip.armor = 'tenku_mail';
  t.equip.shield = 'r88_dq_tenku_shield';
  assert.ok(!wearSetPower(t).resist.fire);
  t.equip.head = 'r88_dq_tenku_helm';
  assert.ok(wearSetPower(t).resist.fire <= 0.8 && wearSetPower(t).resist.ice <= 0.8);
  assert.ok(setTitles(t).some((x) => x.title === '天空の勇者'));
});

// ───────────── 使う・呪文を はね返す・動けなく する ─────────────
test('G15: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）。顔の えんしゅつ 3つ', () => {
  const list = mineAll().filter((id) => ITEMS[id].use);
  assert.deepEqual(list.sort(), ['r88_da_daisword', 'r88_da_gold', 'r88_da_kigan', 'r88_da_madan', 'r88_da_namida', 'r88_da_shahal',
    'r88_dq_hikaritama', 'r88_dq_inazuma', 'r88_dq_inori', 'r88_dq_raijin', 'r88_dq_roto_sword', 'r88_dq_sabaki', 'r88_dq_tenku_shield'].sort());
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip[it.type] = id;
    const b = fight([c, hero('warrior')]);
    const me = b.allies[0];
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    me.mp = Math.max(0, me.mp - 50);
    const mp = me.mp;
    const ev = useGear(b, me, u.slot);
    assert.ok(me.mp >= mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    assert.ok(useGear(b, me, u.slot).lines.join('').includes('何も起こらなかった'), `${id}: 2回めは だめ`);
  }
  // 神のなみだ: 仲間全員を 全回復
  const c = hero('warrior');
  c.equip.acc = 'r88_da_namida';
  const b = fight([c, hero('warrior')]);
  for (const x of b.allies) x.hp = 10;
  useGear(b, b.allies[0], 'use_acc');
  for (const x of b.allies) assert.equal(x.hp, x.maxHp);
  // ダイの剣: さやに おさめて 次の 攻撃が 強く なる
  const d = hero('dragon_knight', 90);
  d.equip.weapon = DAI_SWORD;
  const bd = fight([d]);
  useGear(bd, bd.allies[0], 'use_weapon');
  assert.ok(bd.allies[0].charge >= 2.5);
  // いのりの指輪: 自分の MPが もどる
  const p = hero('mage');
  p.equip.acc = 'r88_dq_inori';
  const bp = fight([p]);
  bp.allies[0].mp = 0;
  useGear(bp, bp.allies[0], 'use_acc');
  assert.ok(bp.allies[0].mp > 0);
  const fake = new Proxy({}, { get: () => () => undefined });
  for (const a of ['r88_saya', 'r88_namida', 'r88_mirror']) {
    assert.ok(R88_ANIMS.has(a), a);
    assert.equal(playR88Fx(fake, a, [{ x: 100, y: 60 }, { x: 150, y: 70 }], null, {}, 256, 144), true, a);
  }
  assert.equal(ABILITIES[ITEMS.r88_da_shahal.use.ability].anim, 'r88_mirror');
  assert.equal(ABILITIES[ITEMS.r88_dq_tenku_shield.use.ability].anim, 'r88_mirror');
  assert.equal(ABILITIES[ITEMS.r88_da_namida.use.ability].anim, 'r88_namida');
});

test('G15: シャハルの鏡・天空のたて … 次に 受ける 呪文 1回を はね返す（同じ 作り。2回めは とどく）', () => {
  for (const shieldId of ['r88_da_shahal', 'r88_dq_tenku_shield']) {
    assert.deepEqual(ABILITIES[ITEMS[shieldId].use.ability].effect, { type: 'r88dq', kind: 'mirror' });
    const c = hero('warrior');
    c.equip.shield = shieldId;
    const b = fight([c]);
    const me = b.allies[0];
    const foe = b.enemies[0];
    foe.mp = foe.maxMp = 999;
    useGear(b, me, 'use_shield');
    assert.ok(me.r88Mirror, `${shieldId}: 光の かべ`);
    const hp = me.hp;
    const fhp = foe.hp;
    const ev = { lines: [], upd: [] };
    b.perform(foe, { type: 'ability', id: 'merazoma', target: me.id }, ev);
    assert.equal(me.hp, hp, `${shieldId}: はね返した 人は ダメージを 受けない`);
    assert.ok(foe.hp < fhp, `${shieldId}: となえた 敵に 当たる`);
    assert.ok(ev.lines.join('').includes('はね返した'), ev.lines.join('/'));
    assert.equal(ev.fx.reflect, me.id);
    assert.ok(!me.r88Mirror, '1回で 消える');
    // 2回めは とどく
    const ev2 = { lines: [], upd: [] };
    b.perform(foe, { type: 'ability', id: 'merazoma', target: me.id }, ev2);
    assert.ok(me.hp < hp, '2回めは とどく');
  }
  // 物理の 攻撃は はね返さない（光の かべは のこる）
  const c = hero('warrior');
  c.equip.shield = 'r88_dq_tenku_shield';
  const b = fight([c]);
  useGear(b, b.allies[0], 'use_shield');
  b.perform(b.enemies[0], { type: 'attack', target: b.allies[0].id }, { lines: [], upd: [] });
  assert.ok(b.allies[0].r88Mirror);
});

test('G15: ゴールドフェザー・き眼の力 … 敵1体を 動けなく する（ボスには 効かない）', () => {
  for (const [slot, id] of [['acc', 'r88_da_gold'], ['acc', 'r88_da_kigan']]) {
    // ふつうの 敵（何回か ためして 1回は 動けなく なる）
    let ok = false;
    for (let s = 0; s < 6 && !ok; s++) {
      const c = hero('warrior');
      c.equip[slot] = id;
      const b = new Battle({ rng: makeRng(40 + s), allies: [{ char: c, controller: 's0' }], enemies: ['rockman'], canFlee: true });
      useGear(b, b.allies[0], `use_${slot}`);
      ok = !!b.enemies[0].status.paralyze;
    }
    assert.ok(ok, `${id}: ふつうの 敵は 動けなく なる`);
    // ボス
    const c = hero('warrior');
    c.equip[slot] = id;
    const b = fight([c]);
    b.enemies[0].boss = true;
    const ev = useGear(b, b.allies[0], `use_${slot}`);
    assert.ok(!b.enemies[0].status.paralyze, `${id}: ボスには 効かない`);
    assert.ok(ev.lines.join('').includes('動きを止められない'), ev.lines.join('/'));
  }
});

test('G15: 光魔のつえ（MPが 多いほど 強い・攻撃で MPが へる）・ブラックロッド（魔力）・まじんのかなづち（会心）', () => {
  const m = hero('maou', 90);
  m.equip.weapon = 'r88_da_kouma';
  const b = fight([m]);
  const me = b.allies[0];
  me.mp = 300;
  const hi = r88dqAtkMult(me);
  me.mp = 0;
  assert.equal(r88dqAtkMult(me), 1, 'MPが なければ ふつう');
  assert.ok(hi > 1.5, `MPが 多いと 強い（${hi}）`);
  me.mp = 300;
  assert.ok(attackMods(me, b.enemies[0]).mult > 1.5);
  const ev = { lines: [], upd: [] };
  b.perform(me, { type: 'attack', target: b.enemies[0].id }, ev);
  assert.ok(me.mp < 300, '攻撃の たびに MPが へる');
  assert.ok(ev.lines.join('').includes('すいとった'));
  // ブラックロッド: 攻撃魔力が 高いほど
  const p = hero('archmage', 90);
  p.equip.weapon = 'r88_da_blackrod';
  const bp = fight([p]);
  const pm = bp.allies[0];
  const k1 = r88dqAtkMult(pm);
  pm.mag += 200;
  assert.ok(r88dqAtkMult(pm) > k1 && r88dqAtkMult(pm) <= 1.5);
  // まじんのかなづち: 会心が とても 出やすい（外れやすい）
  const h = hero('warrior');
  h.equip.weapon = 'r88_dq_majin';
  assert.ok(computeStats(h).crit >= 0.3);
  assert.ok(ITEMS.r88_dq_majin.atkAcc < 1);
});

// ───────────── とびらと ライバル ─────────────
test('G15: とびら 3まい（ダイの大冒険・大魔王の城・ドラゴンクエスト）と ライバル（弱い 順・さいごは Lv100）', () => {
  const dd = doorOf('dai'), dm = doorOf('dai_maou'), dq = doorOf('dq');
  assert.ok(dd && dm && dq);
  assert.equal(new Set(RIVAL_DOORS.map((d) => d.work)).size, RIVAL_DOORS.length, 'とびらは 2重に ならない');
  assert.deepEqual(doorWorks('dai_maou'), ['dai'], '大魔王の城は ダイの大冒険の 品');
  assert.ok(!WORKS.dai_maou, '作品は ふえない');
  assert.equal(gachaWorks().filter((w) => w.startsWith('dai')).length, 1, 'ガチャの 作品は 1つ');
  assert.equal(doorGoods('dai_maou'), 'ダイの大冒険');
  for (const d of [dd, dm, dq]) {
    assert.ok(R88_BOARD_ICONS[d.mark], d.mark);
    assert.ok(ROOM_STYLES[d.room], d.room);
    assert.ok(MAPS[`rival_room_${d.work}`], d.work);
  }
  assert.deepEqual(rivalsOf('dai').map((x) => x.id), ['da_crocodine', 'da_hyunckel', 'da_laharl', 'da_baran']);
  assert.deepEqual(rivalsOf('dai').map((x) => x.reward), [['r88_da_shinku'], ['r88_da_makenarmor'], ['r88_da_masou'], ['r88_da_shinma']]);
  assert.deepEqual(rivalsOf('dai_maou').map((x) => x.id), ['da_killvearn', 'da_sigma', 'da_hadlar', 'da_mist', 'da_vearn']);
  assert.deepEqual(rivalsOf('dai_maou').map((x) => x.reward), [['r88_da_fue'], ['r88_da_shahal'], ['r88_da_hellclaw', 'r88_da_hasha'], ['r88_da_yami'], ['r88_da_kouma', 'r88_da_kigan']]);
  assert.deepEqual(rivalsOf('dq').map((x) => x.id), ['dq_ryuou', 'dq_psaro', 'dq_zoma', 'dq_hiko']);
  assert.deepEqual(rivalsOf('dq').map((x) => x.reward), [['r88_dq_hikaritama'], ['r88_dq_tenku_shield'], ['r88_dq_roto_sword'], ['r88_dq_ryuken']]);
  for (const w of ['dai', 'dai_maou', 'dq']) {
    const list = rivalsOf(w);
    assert.ok(list.length <= 5);
    for (let i = 1; i < list.length; i++) assert.ok(list[i].lv >= list[i - 1].lv);
    assert.equal(list[list.length - 1].lv, 100);
    for (const rv of list) {
      const den = rv.reward.some((id) => ITEMS[id].grade === 'den');
      const tier = rivalTier(rv.lv);
      assert.ok(tier === 100 || tier === (den ? 80 : 60) || (tier === 80 && rv.n > 1), `${rv.id}: Lv${rv.lv}`);
      assert.ok(rv.tune?.hp > 0 && rv.sig?.charge && rv.sig?.cast, rv.id);
      assert.ok(rv.words.length <= 40, `${rv.id}: ひとことは みじかく`);
      assert.ok(FIXED_ENCOUNTERS[rivalEnc(rv.id)], rv.id);
      assert.ok(ABILITIES[`r88r_${rv.id}`], rv.id);
      for (const id of rv.reward) assert.equal(ITEMS[id].work, w === 'dq' ? 'dq' : 'dai', id);
    }
  }
  assert.equal(RIVAL_BY_ID.da_vearn.job, 'maou', '大魔王バーンは 魔王の 技');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('da_vearn')].bg, 'castle_fire');
  assert.equal(FIXED_ENCOUNTERS[rivalEnc('da_mist')].bg, 'palace_night');
});

test('G15: ダイの大冒険の 品 3つで 2まいとも 開く（品は 2重に 数えない）', () => {
  const c = hero('warrior');
  for (const id of ['r88_da_crown', 'r88_da_mieru']) addItem(c, id, 1);
  assert.equal(workOwned(c, 'dai'), 2);
  assert.equal(workOwned(c, 'dai_maou'), 2);
  assert.ok(!doorOpen(c, 'dai') && !doorOpen(c, 'dai_maou'));
  addItem(c, 'r88_da_silver', 1);
  assert.ok(doorOpen(c, 'dai') && doorOpen(c, 'dai_maou'));
  assert.equal(workOwned(c, 'dq'), 0);
  refreshDoorFlags(c);
  assert.ok(c.flags.r88door_dai && c.flags.r88door_dai_maou && !c.flags.r88door_dq);
  const p = rivalPaper(c, 'dai_maou');
  assert.equal(p.workName, '大魔王の城');
  assert.equal(p.goodsName, 'ダイの大冒険');
  assert.equal(p.own, 3);
});

test('G15: 竜王のひ孫 … ロトの装備を 5つ 持って いる 人だけ ちょうせん できる（まどに じょうけんが 出る）', () => {
  const hiko = RIVAL_BY_ID.dq_hiko;
  assert.deepEqual(hiko.needSet && { set: hiko.needSet.set, n: hiko.needSet.n }, { set: 'roto', n: 5 });
  const c = hero('loto_hero', 90);
  for (const id of ['r88_dq_raijin', 'r88_dq_kiseki', 'r88_dq_inochi']) addItem(c, id, 1);
  c.rivals = { dq_ryuou: 1, dq_psaro: 1, dq_zoma: 1 };
  addItem(c, 'r88_dq_roto_sword', 1);
  assert.equal(rivalNeedLack(c, hiko), 4);
  assert.ok(!rivalReady(c, hiko));
  let p = rivalPaper(c, 'dq');
  const row = p.rivals.find((r) => r.id === 'dq_hiko');
  assert.equal(row.state, 'need');
  assert.ok(row.need.includes('ロトの装備を5つそろえると、ちょうせんできる') && row.need.includes('1/5'), row.need);
  assert.ok(!rivalButtons(p).some((x) => x.id === 'dq_hiko'), 'ボタンは 出ない');
  // 前の 人に 勝って いない 時も じょうけんの 行は 出る（名前は ？？？）
  const d = hero('hero');
  for (const id of ['r88_dq_raijin', 'r88_dq_kiseki', 'r88_dq_inochi']) addItem(d, id, 1);
  assert.equal(rivalPaper(d, 'dq').rivals.find((r) => r.id === 'dq_hiko').state, 'lock');
  assert.ok(rivalPaper(d, 'dq').rivals.find((r) => r.id === 'dq_hiko').need);
  // 5つ そろうと（預かり所・装備でも よい）ちょうせん できる
  for (const id of ['r88_dq_roto_armor', 'r88_dq_roto_shield']) addItem(c, id, 1);
  c.bank = { gold: 0, items: [{ id: 'r88_dq_roto_helm', n: 1 }] };
  c.equip.acc = 'r88_dq_roto_mark';
  assert.equal(rivalNeedLack(c, hiko), 0);
  assert.ok(rivalReady(c, hiko));
  p = rivalPaper(c, 'dq');
  assert.equal(p.rivals.find((r) => r.id === 'dq_hiko').state, 'next');
  assert.ok(rivalButtons(p).some((x) => x.id === 'dq_hiko'));
  // ほかの ライバルには じょうけんが ない
  for (const rv of rivalsOf('dq').filter((r) => r.id !== 'dq_hiko')) assert.equal(rivalNeedLack(d, rv), 0, rv.id);
});

// ───────────── ガチャ・試練の ごほうび ─────────────
test('G15: ガチャガチャ（2作品が ならぶ。ライバル・伝説・店・生まれ変わりの 先・試練の ごほうびは 出ない）', () => {
  assert.ok(gachaWorks().includes('dai') && gachaWorks().includes('dq'));
  const pd = gachaPool('dai'), pq = gachaPool('dq');
  assert.equal(pd.all.length, 13);
  assert.equal(pq.all.length, 16);
  assert.equal(pd.all.length * GACHA_PRICE, 260000);
  assert.equal(pq.all.length * GACHA_PRICE, 320000);
  const trial = [trialGiftOf('dragon_knight'), trialGiftOf('maou'), trialGiftOf('loto_hero')];
  for (const [w, p] of [['dai', pd], ['dq', pq]]) {
    const all = new Set(p.all);
    const rivals = RIVAL_DOORS.filter((d) => doorWorks(d.work).includes(w)).flatMap((d) => rivalsOf(d.work).flatMap((rv) => rv.reward));
    for (const id of newIds(w)) {
      const it = ITEMS[id];
      const out = it.grade === 'den' || it.grade === 'shop' || rivals.includes(id) || trial.includes(id) || Object.values(REBIRTH).some((x) => x.to === id);
      assert.equal(all.has(id), !out, `${id}: ${gachaBlock(id)}`);
    }
  }
  for (const id of ABAN_MARKS.slice(1)) assert.ok(pd.all.includes(id), id);
  assert.ok(pq.all.includes('r88_dq_roto_helm'));
});

test('G15: 試練の ごほうび（竜の騎士 → アバンのしるし・青・魔王 → 大魔王の白い衣・ロトの勇者 → ロトの聖なる守り）', () => {
  assert.equal(trialGiftOf('dragon_knight'), 'r88_da_mark_blue');
  assert.equal(trialGiftOf('maou'), 'r88_da_white');
  assert.equal(trialGiftOf('loto_hero'), 'r88_dq_roto_mark');
  for (const id of ['r88_da_mark_blue', 'r88_da_white', 'r88_dq_roto_mark']) {
    assert.equal(ITEMS[id].grade, 'mei', id);
    assert.equal(gachaBlock(id), 'trial', id);
  }
});

// ───────────── セーブと 引っこし ─────────────
test('G15: セーブと 引っこしコード（ライバル・品）', () => {
  const c = hero('loto_hero', 90);
  c.rivals = { da_vearn: 1, dq_hiko: 1 };
  for (const id of [...ROTO_GEAR, 'r88_dq_ryuken', 'r88_da_kouma', 'r88_da_kigan']) addItem(c, id, 1);
  c.equip.shield = 'r88_dq_tenku_shield';
  const code = exportCode(c, 1794488401253);
  const r = parseCode(code);
  assert.equal(r.ok, true, r.reason);
  const back = repairChar(r.char);
  assert.deepEqual(back.rivals, { da_vearn: 1, dq_hiko: 1 });
  assert.equal(back.equip.shield, 'r88_dq_tenku_shield');
  assert.equal(itemCount(back, 'r88_dq_ryuken'), 1);
  assert.ok(splitCode(code).length <= 1, 'ふつうの セーブは 1通');
});
