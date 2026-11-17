// 第88回 G1班: 作品を 思い出す 装備の しくみ（YAIBA ・ スーパー宝貝 で たしかめる）
//   生まれつきの 効果・とどく 広さ・使う（1戦 1回・MPなし・オートは 使わない）・玉・そろい（wear・own・party）・
//   生まれ変わりの 条件・伝説の 強さ・今の レアの 入れ物に まざらない・名前が かぶらない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SLOTS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_FX, gearFxTotals, gearFxStats, gearUses, fxListOf, fxSlots } from '../public/js/shared/data/gear-fx.js';
import { WORKS } from '../public/js/shared/data/works.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { ITEMS_R88, R88_ITEM_KANA, R88_REBIRTH, topOfKind, legendKey, legendStat } from '../public/js/shared/data/items-r88.js';
import { REBIRTH } from '../public/js/shared/data/items-alchemy.js';
import { innateFx, setCount, setTitles, ownedSetIds, rebirthNeedLack, r88Uses } from '../public/js/shared/gear-r88.js';
import { r88DetailLines, r88Short } from '../public/js/shared/gear-r88-view.js';
import { attackMods } from '../public/js/shared/battle-gearfx.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { rebirthOf, upgradeCost, canUpgrade, canLimitBreak } from '../public/js/shared/data/forge.js';
import { upgradeId } from '../public/js/shared/data/items-forge.js';
import { starsOf, rareIds, pickTmGear, pickSdGear } from '../public/js/shared/data/rare-loot.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { sdBigReward, sdSmallReward } from '../public/js/shared/data/secret.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { salvageBlock } from '../public/js/shared/data/salvage.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';

const R88_IDS = Object.keys(ITEMS_R88);
const isR88 = (id) => !!ITEMS[ITEMS[id]?.base || id]?.work;

function hero(job = 'warrior', lv = 60) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  return c;
}
function fight(chars, enemies = ['rockman'], { lucky = false } = {}) {
  const rng = makeRng(88);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const ev0 = () => ({ lines: [], upd: [] });

// ───────────── データ ─────────────
test('第88回: 品の データ（YAIBA 26・スーパー宝貝 7・作品・効果・使う・そろい・読みがな）', () => {
  const yaiba = R88_IDS.filter((id) => ITEMS[id].work === 'yaiba');
  const houshin = R88_IDS.filter((id) => ITEMS[id].work === 'houshin');
  assert.equal(yaiba.length, 26);
  assert.equal(houshin.filter((id) => ITEMS[id].set === 'super_paopei').length, 7); // G2班が のこりの 宝貝を 足した
  for (const id of R88_IDS) {
    const it = ITEMS[id];
    assert.ok(WORKS[it.work], `${id}: 作品`);
    assert.equal(it.src, 'r88', `${id}: 手に入れ方は まだ`);
    assert.ok(it.name && it.desc && R88_ITEM_KANA[id], id);
    assert.ok(SLOTS.includes(it.type), id);
    for (const x of it.fx || []) assert.ok(GEAR_FX[x.k] && x.v > 0, `${id}: ${x.k}`);
    if (it.use) {
      const a = ABILITIES[it.use.ability];
      assert.ok(a && a.hidden && a.mp === 0 && !a.job, `${id}: かくし技 ${it.use.ability}`);
    }
    if (it.set) assert.ok(GEAR_SETS[it.set].items.includes(id), `${id}: そろい`);
    if (it.reach) assert.ok(['group', 'all'].includes(it.reach), id);
    if (it.orb) assert.ok(it.type === 'acc' && GEAR_FX[`el_${it.orb.el}`], id);
  }
  for (const [sid, s] of Object.entries(GEAR_SETS)) {
    for (const id of s.items) assert.equal(ITEMS[id]?.set, sid, `${sid}: ${id}`);
    for (const t of s.tiers) assert.ok(t.n >= 1 && t.text, sid);
  }
  assert.equal(GEAR_SETS.super_paopei.items.length, 7);
  assert.equal(GEAR_SETS.seven_orbs.items.length, 7);
  // かくし技は 技の 一覧・ひらめき・図鑑に 出ない（hidden）
  for (const [id, a] of Object.entries(ABILITIES)) if (id.startsWith('r88u_')) assert.ok(a.hidden && a.kind === 'skill', id);
});

test('第88回: 名前が 今 ある 品・技と かぶらない', () => {
  const r88 = new Set(R88_IDS);
  const itemNames = new Map();
  for (const [id, it] of Object.entries(ITEMS)) if (!it.base && !r88.has(id)) itemNames.set(it.name, id);
  const abNames = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!id.startsWith('r88u_')) abNames.set(a.name, id);
  const seen = new Set();
  for (const id of R88_IDS) {
    const n = ITEMS[id].name;
    assert.ok(!itemNames.has(n), `${n}: 品 ${itemNames.get(n)}`);
    assert.ok(!abNames.has(n), `${n}: 技 ${abNames.get(n)}`);
    assert.ok(!seen.has(n), `${n}: 2つ`);
    seen.add(n);
  }
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (!id.startsWith('r88u_')) continue;
    assert.ok(!abNames.has(a.name) && !itemNames.has(a.name), a.name);
  }
});

test('第88回: 強さ（伝説 ＝ ★5・その 種類の 今 いちばん 強い 品と 同じ／名 ★4／ふ ★2〜3／店 ★1）', () => {
  // ぜんぶの 品を まぜた あとの いちばん（作品の 品と きたえた 品は のぞく）
  const top = topOfKind(ITEMS);
  for (const id of R88_IDS) {
    const it = ITEMS[id];
    const want = { den: 5, mei: 4, fu3: 3, fu2: 2, shop: 1 }[it.grade];
    assert.equal(starsOf(id), want, `${id}: ★`);
    if (it.grade === 'den' && legendKey(it)) assert.equal(it[legendStat(it)], top[legendKey(it)], `${id}: ${legendKey(it)} の いちばんと 同じ`);
    if (it.grade !== 'den' && legendKey(it)) assert.ok(it[legendStat(it)] < top[legendKey(it)], `${id}: いちばんより 下`);
  }
  // 伝説の アクセは 今 いちばん 強い アクセと ならぶ（よい 力の 合計が 8わり〜1.1倍）
  const bsum = (it) => Object.values(it.bonus || {}).reduce((t, v) => t + Math.max(0, v), 0);
  const topAcc = Math.max(...Object.values(ITEMS).filter((it) => it.type === 'acc' && !it.base && !it.work).map(bsum));
  for (const id of R88_IDS) if (ITEMS[id].grade === 'den' && ITEMS[id].type === 'acc') assert.ok(bsum(ITEMS[id]) >= topAcc * 0.8 && bsum(ITEMS[id]) <= topAcc * 1.1, `${id}: ${bsum(ITEMS[id])} / ${topAcc}`);
  // 雷公べんは ムチで いちばん（同じ 数字の 品は あっても 上は ない）
  const whips = Object.values(ITEMS).filter((it) => !it.base && it.type === 'weapon' && it.cat === 'whip');
  assert.equal(Math.max(...whips.map((it) => it.atk)), ITEMS.r88_raikoben.atk);
  // 店の 品（木刀）は 店の 強さ・売っていない
  assert.ok(ITEMS.r88_bokuto.price > 0 && ITEMS.r88_bokuto.rank === 1);
  for (const s of Object.values(SHOPS)) for (const id of [...(s.items || []), ...(s.more || []).flatMap((m) => m.items || [])]) assert.ok(!isR88(id), `店に ${id}`);
  // 売り値・分解（伝説・使う 品は 分解 できない）
  for (const id of R88_IDS) if (ITEMS[id].grade !== 'shop') assert.ok(ITEMS[id].sell > 0, id);
  assert.ok(salvageBlock('r88_raikoben'));
  assert.ok(salvageBlock('r88_maou_sword'));
  assert.equal(salvageBlock('r88_kikuichi'), null, '名品は 分解 できる');
});

// ───────────── 生まれつきの 効果 ─────────────
test('第88回: 生まれつきの 効果（れん金と 同じ 計算・わくを へらさない・消えない・どの 部位でも）', () => {
  const c = hero();
  c.equip.weapon = 'r88_raijin_sword';
  assert.equal(gearFxTotals(c).el_bolt, 5);
  assert.deepEqual(fxListOf(c, 'r88_raijin_sword'), [], 'れん金の わくは 空の まま');
  assert.equal(fxSlots(c, 'r88_raijin_sword'), 1);
  // れん金の 効果と いっしょに 効く（同じ 効果は 足す）
  c.gearFx = { r88_raijin_sword: [{ k: 'el_bolt', v: 3 }, { k: 'chase', v: 2 }].slice(0, 1) };
  assert.equal(gearFxTotals(c).el_bolt, 8);
  c.gearFx = { r88_raijin_sword: [{ k: 'chase', v: 4 }] };
  assert.equal(gearFxTotals(c).el_bolt, 5);
  assert.equal(gearFxTotals(c).chase, 4);
  // きたえると +3 ごとに 1
  c.equip.weapon = upgradeId('r88_raijin_sword', 3);
  assert.equal(gearFxTotals(c).el_bolt, 6);
  assert.deepEqual(innateFx(upgradeId('r88_raijin_sword', 6)), [{ k: 'el_bolt', v: 7 }]);
  // アクセ（金の玉 みかわし・水の玉 炎に強い）・たて（鉄のかさ 守備力）
  const d = hero();
  d.equip.acc = 'r88_orb_water';
  const base = computeStats({ ...d, equip: { ...d.equip, acc: null } });
  assert.ok(gearFxStats(d).resist.fire < 1, '炎に 強い');
  assert.ok(computeStats(d).resist.fire < (base.resist.fire ?? 1));
  d.equip.acc = 'r88_orb_gold';
  assert.equal(gearFxTotals(d).evade, 6);
  d.equip.shield = 'r88_iron_kasa';
  const noKasa = computeStats({ ...d, equip: { ...d.equip, shield: null } });
  assert.equal(computeStats(d).dfn - noKasa.dfn, ITEMS.r88_iron_kasa.def + 8, '守備力アップ+4 は 守備力+8');
  // 戦いでも 効く（雷神剣の ふつうの 攻撃は 雷）
  const b = fight([c]);
  assert.equal(attackMods(b.allies[0], b.enemies[0]).element, 'bolt');
  // 説明
  assert.ok(r88DetailLines('r88_raijin_sword', c).some((l) => l.startsWith('作品の力：雷の力+5')));
  assert.ok(r88DetailLines('r88_raijin_sword', c).some((l) => l.startsWith('作品：YAIBA')));
  assert.equal(r88Short('r88_raikoben'), '雷+8・使う');
});

// ───────────── とどく 広さ ─────────────
test('第88回: とどく 広さ（物ほしざお ＝ 1グループ・禁べん ＝ 敵全体。2体めから 少し 弱い）', () => {
  const c = hero('warrior');
  c.equip.weapon = 'r88_monohoshi';
  let b = fight([c], ['rockman', 'rockman', 'rockman', 'pururin']);
  let me = b.allies[0];
  assert.equal(me.gearReach, 'group');
  let plan = b.attackPlan(me, b.enemies[0].id);
  assert.equal(plan.length, 3, '同じ 種類の 3体');
  assert.ok(plan[1].mult < 1);
  let ev = ev0();
  b.perform(me, { type: 'attack', target: b.enemies[0].id }, ev);
  assert.equal(b.enemies.filter((e) => e.hp < e.maxHp).length, 3, ev.lines.join('/'));
  assert.ok(ev.lines.some((l) => l.includes('遠くまでとどいた')));
  // 禁べん（ムチは もともと グループ → 敵全体）
  const d = hero('taikobo');
  d.equip.weapon = 'r88_kinben';
  b = fight([d], ['rockman', 'rockman', 'pururin']);
  me = b.allies[0];
  assert.equal(me.gearReach, 'enemies');
  plan = b.attackPlan(me, b.enemies[0].id);
  assert.equal(plan.length, 3, '敵全体');
  // ふつうの 剣は 1体
  const e = hero();
  e.equip.weapon = 'r88_kikuichi';
  b = fight([e], ['rockman', 'rockman']);
  assert.equal(b.attackPlan(b.allies[0], b.enemies[0].id).length, 1);
});

// ───────────── 使う ─────────────
test('第88回: 使う（雷公べん: 1つの 戦いで 1回・MPなし・道具に 出る・オートと 仲間の AI は 使わない）', () => {
  const c = hero('taikobo', 70);
  c.equip.weapon = 'r88_raikoben';
  c.equip.acc = 'r88_taikyoku';
  assert.deepEqual(r88Uses(c).map((u) => [u.slot, u.ability, u.once]), [['use_weapon', 'r88u_raikou', true], ['use_acc', 'r88u_taikyoku', true]]);
  assert.equal(gearUses(c).length, 2);
  const b = fight([c], ['rockman', 'rockman', 'pururin']);
  const me = b.allies[0];
  const mp = me.mp;
  assert.ok(b.validate(me, { type: 'item', id: 'gear:use_weapon' }).ok);
  const ev = ev0();
  b.perform(me, { type: 'item', id: 'gear:use_weapon' }, ev);
  assert.equal(me.mp, mp, 'MP は へらない');
  assert.ok(b.enemies.every((e) => e.hp < e.maxHp), `敵全体に 雷: ${ev.lines.join('/')}`);
  assert.ok(me.gearUses.find((u) => u.slot === 'use_weapon').used, '使った しるし');
  // 2回めは 使えない（ほかの 品は 使える）
  const v = b.validate(me, { type: 'item', id: 'gear:use_weapon' });
  assert.equal(v.ok, false);
  assert.match(v.reason, /もう使った/);
  assert.ok(b.validate(me, { type: 'item', id: 'gear:use_acc' }).ok);
  const ev2 = ev0();
  const hp = b.enemies.map((e) => e.hp);
  b.perform(me, { type: 'item', id: 'gear:use_weapon' }, ev2);
  assert.deepEqual(b.enemies.map((e) => e.hp), hp, '2回めは 何も 起きない');
  // つぎの 戦いでは また 使える（セーブしない）
  const b2 = fight([c]);
  assert.ok(b2.validate(b2.allies[0], { type: 'item', id: 'gear:use_weapon' }).ok);
  assert.equal(c.gearUsed, undefined);
  // オート・仲間の AI は 使わない
  const b3 = fight([c], ['rockman', 'rockman']);
  const a3 = b3.allies[0];
  a3.auto = true;
  for (let i = 0; i < 200; i++) {
    const cmd = decideAlly(b3, a3);
    assert.ok(!(cmd?.type === 'item' && String(cmd.id).startsWith('gear:')), JSON.stringify(cmd));
  }
  // 魔王剣（YAIBA の 使う）: 敵全体に 闇
  const d = hero('warrior', 70);
  d.equip.weapon = 'r88_maou_sword';
  const b4 = fight([d], ['rockman', 'rockman']);
  b4.perform(b4.allies[0], { type: 'item', id: 'gear:use_weapon' }, ev0());
  assert.ok(b4.enemies.every((e) => e.hp < e.maxHp));
  // 説明
  assert.ok(r88DetailLines('r88_raikoben', c).some((l) => l.startsWith('使う：雷公べん・大いかずち（1つの戦いで1回')));
});

// ───────────── 玉 ─────────────
test('第88回: 玉（つけた 人の 武器の ふつうの 攻撃に 属性。武器に 属性が あれば そちらが 先）', () => {
  const c = hero();
  c.equip.weapon = 'r88_kikuichi';
  c.equip.acc = 'r88_orb_fire';
  let b = fight([c]);
  let m = attackMods(b.allies[0], b.enemies[0]);
  assert.equal(m.element, 'fire');
  assert.ok(m.mult > 1);
  // ふつうの 攻撃が 炎で 当たる（炎に 弱い 敵）
  const ev = ev0();
  b.enemies[0].resist = { fire: 2 };
  const hp = b.enemies[0].hp;
  b.perform(b.allies[0], { type: 'attack', target: b.enemies[0].id }, ev);
  assert.ok(b.enemies[0].hp < hp);
  // 武器に 属性（雷神剣の 雷）が ある 時は 武器が 先
  c.equip.weapon = 'r88_raijin_sword';
  b = fight([c]);
  assert.equal(attackMods(b.allies[0], b.enemies[0]).element, 'bolt');
  // れん金の 属性も 先
  c.equip.weapon = 'r88_kikuichi';
  c.gearFx = { r88_kikuichi: [{ k: 'el_ice', v: 3 }] };
  b = fight([c]);
  assert.equal(attackMods(b.allies[0], b.enemies[0]).element, 'ice');
  assert.ok(r88DetailLines('r88_orb_ice', c).some((l) => l.startsWith('玉：')));
});

// ───────────── そろい ─────────────
test('第88回: そろい wear（1人が つけた 数）・own（持って いる 数で しょう号）', () => {
  const c = hero('taikobo', 70);
  c.items = [];
  const base = computeStats(c);
  c.equip.weapon = 'r88_raikoben';
  const one = computeStats(c);
  c.equip.acc = 'r88_taikyoku';
  assert.equal(setCount(c, 'super_paopei', 'wear'), 2);
  const two = computeStats({ ...c, equip: { ...c.equip } });
  const accOnly = computeStats({ ...c, equip: { ...c.equip, weapon: null } });
  // 2つ: 攻撃魔力+10・最大MP+20（品の bonus の ほかに）
  assert.equal(two.mag - base.mag, (ITEMS.r88_raikoben.bonus.mag || 0) + ITEMS.r88_taikyoku.bonus.mag + 10);
  assert.equal(two.maxMp - base.maxMp, ITEMS.r88_taikyoku.bonus.mp + 20);
  assert.ok(one.mag < two.mag && accOnly.mag < two.mag);
  c.equip.armor = 'r88_keisei';
  const three = computeStats(c);
  assert.equal(three.maxMp - base.maxMp, ITEMS.r88_taikyoku.bonus.mp + 40, '3つ: 上の 段だけ（足し算 しない）');
  // own: ふくろ・預かり所・装備
  assert.equal(setCount(c, 'super_paopei', 'own'), 3);
  assert.deepEqual(setTitles(c).map((t) => t.title), ['宝貝の使い手']);
  c.items = [{ id: 'r88_kinben', n: 1 }, { id: 'r88_kinkosen', n: 1 }];
  c.bank = { gold: 0, items: [{ id: 'r88_rokkon', n: 1 }, { id: 'r88_banko', n: 1 }] };
  assert.equal(ownedSetIds(c, 'super_paopei').length, 7);
  assert.deepEqual(setTitles(c).map((t) => t.title).sort(), ['スーパー宝貝の主', '宝貝の使い手'].sort());
  // 七つの玉 3/7
  const d = hero();
  d.items = [{ id: 'r88_orb_fire', n: 1 }, { id: 'r88_orb_ice', n: 2 }];
  d.equip.acc = 'r88_orb_dark';
  assert.equal(setCount(d, 'seven_orbs'), 3);
  assert.ok(r88DetailLines('r88_orb_fire', d).includes('そろい：七つの玉 3/7'));
  for (const id of GEAR_SETS.seven_orbs.items) addItem(d, id, 1);
  assert.ok(setTitles(d).some((t) => t.title === '七つの玉の主'));
});

test('第88回: そろい party（パーティーで つけた 数。全員に。戦いの 中だけ）', () => {
  // テストの ための 組（あとの 係が 使う 形）
  GEAR_SETS.test_party = { name: 'テストの組', items: ['r88_orb_fire', 'r88_orb_ice'], rule: 'party', tiers: [{ n: 2, bonus: { str: 30, hp: 50 }, resist: { fire: 0.5 }, fx: [{ k: 'chase', v: 5 }], text: 'test' }] };
  const keep = { fire: ITEMS.r88_orb_fire.set, ice: ITEMS.r88_orb_ice.set };
  ITEMS.r88_orb_fire.set = 'test_party';
  ITEMS.r88_orb_ice.set = 'test_party';
  try {
    const a = hero();
    a.equip.acc = 'r88_orb_fire';
    const b1 = hero();
    b1.id = 'p2';
    const solo = fight([a, b1]);
    assert.ok(!solo.allies[0].partySet, '1つでは まだ');
    b1.equip.acc = 'r88_orb_ice';
    const st = computeStats(b1);
    const b = fight([a, b1]);
    for (const x of b.allies) assert.ok(x.partySet, '全員に');
    const me = b.allies[1];
    assert.equal(me.atk, st.atk + 30);
    assert.equal(me.maxHp, st.maxHp + 50);
    assert.ok(me.resist.fire <= 0.5);
    assert.ok(me.gearFx.some((x) => x.kind === 'chase' && x.v >= 5));
    assert.equal(computeStats(b1).atk, st.atk, '強さの まどは かわらない（戦いの 中だけ）');
  } finally {
    ITEMS.r88_orb_fire.set = keep.fire;
    ITEMS.r88_orb_ice.set = keep.ice;
    delete GEAR_SETS.test_party;
  }
});

// ───────────── 生まれ変わり ─────────────
test('第88回: 生まれ変わり（木刀 → 雷神剣 → 竜神剣〈竜神の玉〉 → は王剣〈風神剣・きたえた 回数を うけつぐ〉）', () => {
  assert.ok(REBIRTH.r88_raijin_sword && R88_REBIRTH.r88_ryujin_sword);
  // 木刀（店の 品）は 1回 きたえると 雷神剣
  const r0 = rebirthOf('r88_bokuto');
  assert.ok(r0 && r0.at === 0 && r0.to === 'r88_raijin_sword');
  assert.ok(canUpgrade('r88_bokuto', null));
  assert.equal(upgradeCost('r88_bokuto', null).to, 'r88_raijin_sword');
  assert.ok(upgradeCost('r88_bokuto', null).reborn);
  // 雷神剣は +8 まで きたえて もう1回 → 竜神剣（条件: 竜神の玉）
  const r1 = rebirthOf('r88_raijin_sword');
  assert.equal(r1.at, 8);
  const c1 = upgradeCost(upgradeId('r88_raijin_sword', 8), null);
  assert.ok(c1.reborn && c1.to === 'r88_ryujin_sword' && c1.need);
  const c = hero();
  c.items = [];
  assert.deepEqual(rebirthNeedLack(c, c1.need), ['竜神の玉を持っていること']);
  c.items = [{ id: 'r88_ryujin_orb', n: 1 }];
  assert.equal(rebirthNeedLack(c, c1.need), null);
  // 竜神剣 +8 → は王剣 +8（伝説 → 伝説は きたえた 回数を うけつぐ）
  const c2 = upgradeCost(upgradeId('r88_ryujin_sword', 8), null);
  assert.equal(c2.to, upgradeId('r88_haou_sword', 8));
  assert.deepEqual(c2.need, { items: ['r88_fujin_sword'] });
  assert.ok(ITEMS[c2.to].atk > ITEMS.r88_haou_sword.atk);
  // 生まれ変わる 武器は 限界とっぱ しない（今の きまり）
  assert.equal(canLimitBreak(upgradeId('r88_ryujin_sword', 8), null), false);
  // 説明
  assert.ok(r88DetailLines('r88_raijin_sword', c).some((l) => l === '生まれ変わる条件：竜神の玉を持っていること'));
});

test('第88回: かじ屋で 生まれ変わる（条件が なければ できない・あれば できる）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(88), rateLimit: false });
  const bot = new Bot(world, 'ヒナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(60) - c.exp);
  c.gold = 999999;
  const id = upgradeId('r88_raijin_sword', 8);
  addItem(c, id, 1);
  addItem(c, 'star_shard', 40);
  addItem(c, 'limit_stone', 5);
  const svc = (msg) => {
    bot.send({ t: 'svc', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  const no = svc({ kind: 'forge', action: 'upgrade', id });
  assert.equal(no.ok, false);
  assert.match(no.text, /竜神の玉を持っていること/);
  assert.equal(itemCount(c, id), 1, 'そのまま');
  addItem(c, 'r88_ryujin_orb', 1);
  const yes = svc({ kind: 'forge', action: 'upgrade', id });
  assert.equal(yes.ok, true, yes.text);
  assert.ok(yes.reborn);
  assert.equal(itemCount(c, 'r88_ryujin_sword'), 1);
  assert.equal(itemCount(c, 'r88_ryujin_orb'), 1, '玉は なくならない');
  // 木刀 → 雷神剣（店の 品でも）
  addItem(c, 'r88_bokuto', 1);
  addItem(c, 'thunder_stone', 1);
  const bk = svc({ kind: 'forge', action: 'upgrade', id: 'r88_bokuto' });
  assert.equal(bk.ok, true, bk.text);
  assert.equal(itemCount(c, 'r88_raijin_sword'), 1);
});

// ───────────── 入れ物に まざらない ─────────────
test('第88回: 今の レアの 入れ物（宝の洞窟・ひみつのダンジョン・ボス・魔物・店）に まざらない', () => {
  for (const src of ['tm', 'boss', 'region', 'sd']) for (const id of rareIds(src)) assert.ok(!isR88(id), `${src}: ${id}`);
  const rng = makeRng(8801);
  for (let lv = 1; lv <= 50; lv++) {
    for (const kind of ['normal', 'bossA', 'bossB']) {
      for (let i = 0; i < 12; i++) {
        for (const theme of ['earth', 'ice', 'lava']) {
          const out = chestLoot(rng, lv, kind, { theme, word: '大地' });
          for (const x of [].concat(out || [])) if (x?.item) assert.ok(!isR88(x.item), `宝の洞窟 Lv${lv}: ${x.item}`);
        }
      }
    }
    for (let i = 0; i < 5; i++) {
      const t = pickTmGear(rng, lv, { theme: 'earth', word: '古代' }, 'bossA');
      if (t) assert.ok(!isR88(t));
    }
  }
  for (let f = 1; f <= 120; f++) {
    for (const x of sdBigReward(f)) if (x.item) assert.ok(!isR88(x.item), `ひみつのダンジョン ${f}階: ${x.item}`);
    for (let i = 0; i < 6; i++) {
      for (const x of [].concat(sdSmallReward(f, rng) || [])) if (x?.item) assert.ok(!isR88(x.item), `${f}階: ${x.item}`);
      const g = pickSdGear(rng, f);
      if (g) assert.ok(!isR88(g));
    }
  }
});
