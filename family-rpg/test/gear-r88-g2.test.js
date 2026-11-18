// 第88回 G2班: ほう神演義の のこり・スレイヤーズ・烈火の炎
//   品の 数・使う（ぜんぶ 動く）・形を かえる 武器（鋼金暗器）・雷神の HP・そろい・生まれ変わり・今の 入れ物に まざらない
//   （名前が かぶらない・伝説の 強さ・★ は test/gear-r88.test.js が ぜんぶの 品で たしかめる）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { GEAR_SETS } from '../public/js/shared/data/gear-sets.js';
import { ITEMS_R88, topOfKind } from '../public/js/shared/data/items-r88.js';
import { KOUGON_FORMS } from '../public/js/shared/data/items-r88-rekka.js';
import { gearFxTotals, fxListOf } from '../public/js/shared/data/gear-fx.js';
import { setCount, setTitles, shapeForms, shapeTarget, shiftShape, shapeSource, r88Uses } from '../public/js/shared/gear-r88.js';
import { r88DetailLines } from '../public/js/shared/gear-r88-view.js';
import { Battle } from '../public/js/shared/battle.js';
import { equipItem } from '../public/js/shared/world/services.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, removeItem, itemCount, computeStats, canEquipChar } from '../public/js/shared/stats.js';
import { rebirthOf, upgradeCost, canUpgrade } from '../public/js/shared/data/forge.js';
import { upgradeId, lbId, upgradeLimit, CAP_UP_MAX } from '../public/js/shared/data/items-forge.js';
import { rareIds } from '../public/js/shared/data/rare-loot.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { gachaBlock, gachaPool, r88MeiAll, r88TmLoot, trialGiftOf, TM_R88_DEN } from '../public/js/shared/data/gacha-r88.js';
import { trialGiftSteps } from '../public/js/shared/world/gacha-r88.js';
import { RIVALS } from '../public/js/shared/data/rivals-r88.js';
import { chestLoot } from '../public/js/shared/data/treasure.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';

const ids = (work) => Object.keys(ITEMS_R88).filter((id) => ITEMS[id].work === work);
// 形を かえる 品は 1つと 数える
const uniq = (list) => new Set(list.map((id) => (ITEMS[id].shape ? `shape:${ITEMS[id].shape}` : id))).size;

function hero(job = 'warrior', lv = 70) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job });
  c.job = job; // 上の 職業（烈火・太公望）でも
  gainExp(c, expForLevel(lv));
  fullHeal(c);
  c.items = [];
  return c;
}
function fight(chars, enemies = ['rockman', 'rockman', 'pururin']) {
  const b = new Battle({ rng: makeRng(88), allies: chars.map((char, i) => ({ char, controller: `s${i}` })), enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return b;
}
const ev0 = () => ({ lines: [], upd: [] });
const dep = { canEquip: canEquipChar, addItem, removeItem, equip: equipItem };

// ───────────── 品の 数 ─────────────
test('第88回 G2: 品の 数（ほう神演義 7＋38・スレイヤーズ 28・烈火の炎 38〈鋼金暗器は 5つの 形で 1つ〉）', () => {
  assert.equal(ids('houshin').length, 45);
  assert.equal(ids('slayers').length, 28);
  assert.equal(ids('rekka').length, 42);
  assert.equal(uniq(ids('rekka')), 38);
  // 使う 品は ぜんぶ かくし技が ある
  for (const id of [...ids('houshin'), ...ids('slayers'), ...ids('rekka')]) {
    const it = ITEMS[id];
    assert.equal(it.src, 'r88', id);
    if (it.use) assert.ok(ABILITIES[it.use.ability]?.hidden, `${id}: ${it.use.ability}`);
  }
  // 装備に しない 品は 作らない
  const names = new Set(Object.values(ITEMS).map((it) => it.name));
  for (const n of ['天堂地獄', '砲魔神', 'ザナッファー', '縛呪', '血種', '魂吸いの壺']) assert.ok(![...names].some((x) => x.includes(n)), n);
  // 十天君の じんの お札は アクセで 使う 品
  for (const id of GEAR_SETS.jutenkun.items) assert.ok(ITEMS[id].type === 'acc' && ITEMS[id].use, id);
});

test('第88回 G2: 今の 入れ物（宝の洞窟・ひみつのダンジョン・ボス・魔物・店）に まざらない（はじめの 品だけ 店に）', () => {
  const mine = new Set([...ids('houshin'), ...ids('slayers'), ...ids('rekka')].filter((id) => ITEMS[id].set !== 'super_paopei'));
  for (const src of ['tm', 'boss', 'region', 'sd']) for (const id of rareIds(src)) assert.ok(!mine.has(ITEMS[id]?.base || id), `${src}: ${id}`);
  // 店には はじめの 品（格 shop。G4班の きまり）だけ
  for (const s of Object.values(SHOPS)) for (const id of [...(s.items || []), ...(s.more || []).flatMap((m) => m.items || [])]) assert.ok(!mine.has(id) || ITEMS[id].grade === 'shop', `店に ${id}`);
  // ガチャ・宝の 入れ物（名品）は G5班が ライバルを きめて 入れた（下の G5 の テスト）
  // 賢者の石（今 ある 品）は かえない
  assert.equal(ITEMS.philosopher_stone.src, 'sd');
  assert.equal(ITEMS.philosopher_stone.work, 'hagaren'); // G14班: 鋼のれん金術師の 品として 数える（tag。強さ・手に入れ方は かえない）
  assert.ok(ITEMS.philosopher_stone.r88Tag);
});

// ───────────── 使う（ぜんぶ 動く）─────────────
test('第88回 G2: 使う 品は ぜんぶ 戦いで 動く（1回・MPなし）', () => {
  const list = [...ids('houshin'), ...ids('slayers'), ...ids('rekka')].filter((id) => ITEMS[id].use);
  assert.ok(list.length >= 35, `${list.length}`);
  for (const id of list) {
    const it = ITEMS[id];
    const c = hero('warrior');
    c.equip = { weapon: null, armor: null, shield: null, head: null, acc: null };
    c.equip[it.type] = id; // 職業の きまりは みない（戦いの しくみだけ）
    const b = fight([c]);
    const me = b.allies[0];
    const u = me.gearUses.find((x) => x.id === id);
    assert.ok(u, id);
    const mp = me.mp;
    const ev = ev0();
    b.perform(me, { type: 'item', id: `gear:${u.slot}` }, ev);
    assert.equal(me.mp, mp, `${id}: MP`);
    assert.ok(u.used, `${id}: 使った`);
    assert.ok(ev.lines.length >= 2, `${id}: ${ev.lines.join('/')}`);
    assert.equal(b.validate(me, { type: 'item', id: `gear:${u.slot}` }).ok, false, `${id}: 2回め`);
  }
});

test('第88回 G2: 雷神（使うと 敵全体に 雷・HPが 少し へる。HPは 1より 下がらない）', () => {
  const c = hero('rekka');
  c.equip.weapon = 'r88_raijin';
  assert.ok(canEquipChar(c, 'r88_raijin'));
  let b = fight([c]);
  let me = b.allies[0];
  const hp = me.hp;
  const ev = ev0();
  b.perform(me, { type: 'item', id: 'gear:use_weapon' }, ev);
  assert.ok(b.enemies.every((e) => e.hp < e.maxHp), ev.lines.join('/'));
  assert.equal(hp - me.hp, Math.round(me.maxHp * 0.1), ev.lines.join('/'));
  assert.ok(ev.lines.some((l) => l.includes('力を少し使った')));
  // HPが 1 なら へらない（たおれない）
  b = fight([c]);
  me = b.allies[0];
  me.hp = 1;
  b.perform(me, { type: 'item', id: 'gear:use_weapon' }, ev0());
  assert.equal(me.hp, 1);
  assert.ok(me.alive);
  // 風神は HPが へらない
  c.equip.weapon = 'r88_fujin';
  b = fight([c]);
  me = b.allies[0];
  const hp2 = me.hp;
  b.perform(me, { type: 'item', id: 'gear:use_weapon' }, ev0());
  assert.equal(me.hp, hp2);
  assert.ok(r88DetailLines('r88_raijin', c).some((l) => l.includes('HPが少しへる')));
});

// ───────────── 形を かえる 武器 ─────────────
test('第88回 G2: 鋼金暗器の 形がえ（種類が かわる・きたえた 回数と れん金が のこる・持てない 形は えらべない）', () => {
  const forms = shapeForms('r88_kougon_kiba');
  assert.deepEqual(forms, KOUGON_FORMS.map((f) => f.id));
  assert.deepEqual(forms.map((id) => ITEMS[id].cat), ['spear', 'whip', 'dagger', 'boomerang', 'boomerang']);
  // 伝説: 形ごとに その 種類の いちばん
  const top = topOfKind(ITEMS);
  for (const id of forms) assert.equal(ITEMS[id].atk, top[`weapon:${ITEMS[id].cat}`], id);
  // きたえた 回数・★ は そのまま
  assert.equal(shapeTarget(upgradeId('r88_kougon_kiwami', 5), 'r88_kougon_mika'), 'r88_kougon_mika+5');
  assert.equal(shapeTarget(lbId('r88_kougon_kiwami', 5, 1), 'r88_kougon_ryu'), lbId('r88_kougon_ryu', 5, 1));
  assert.equal(shapeTarget('r88_kougon_kiba', 'r88_raijin'), null, 'ほかの 品には ならない');

  // 烈火（短剣・ツメ・ブーメラン）: 装備して いる 極+5 → 三日月+5
  const c = hero('rekka');
  const kiwami5 = upgradeId('r88_kougon_kiwami', 5);
  c.equip.weapon = kiwami5;
  c.gearFx = { r88_kougon_kiwami: [{ k: 'crit', v: 4 }] };
  assert.equal(shapeSource(c, c), kiwami5);
  let r = shiftShape(c, c, 'r88_kougon_mika', dep);
  assert.ok(r.ok, r.text);
  assert.equal(c.equip.weapon, 'r88_kougon_mika+5');
  assert.equal(ITEMS[c.equip.weapon].cat, 'boomerang');
  assert.deepEqual(fxListOf(c, c.equip.weapon), [{ k: 'crit', v: 4 }], 'れん金の 効果が のこる');
  assert.equal(c.gearFx.r88_kougon_kiwami, undefined);
  assert.equal(gearFxTotals(c).chase, 7 + 1, '生まれつきの 追撃（きたえた 分 +1）');
  // 戦いでも ブーメラン（敵全体に とどく）
  let b = fight([c]);
  assert.equal(b.allies[0].weaponCat, 'boomerang');
  assert.equal(b.attackPlan(b.allies[0], b.enemies[0].id).length, 3);
  // 持てない 形（やり・ムチ）は えらべない
  r = shiftShape(c, c, 'r88_kougon_kiba', dep);
  assert.equal(r.ok, false);
  assert.match(r.text, /持てない/);
  assert.equal(c.equip.weapon, 'r88_kougon_mika+5', 'かわらない');
  assert.equal(shiftShape(c, c, 'r88_kougon_ryu', dep).ok, false);
  assert.equal(shiftShape(c, c, 'r88_kougon_mika', dep).ok, false, '同じ 形');
  // 暗（弓・ブーメランと 同じ）→ 極（短剣）
  assert.ok(shiftShape(c, c, 'r88_kougon_an', dep).ok);
  assert.ok(shiftShape(c, c, 'r88_kougon_kiwami', dep).ok);
  assert.equal(c.equip.weapon, kiwami5);
  assert.equal(ITEMS[c.equip.weapon].cat, 'dagger');
  assert.deepEqual(fxListOf(c, c.equip.weapon), [{ k: 'crit', v: 4 }]);

  // ふくろの 品（やりの 形）を、持てる 形に して 装備する
  const d = hero('rekka');
  d.equip.weapon = null;
  addItem(d, upgradeId('r88_kougon_kiba', 3), 1);
  assert.equal(canEquipChar(d, upgradeId('r88_kougon_kiba', 3)), false);
  assert.equal(shiftShape(d, d, 'r88_kougon_ryu', dep).ok, false, 'ムチも 持てない');
  r = shiftShape(d, d, 'r88_kougon_kiwami', dep);
  assert.ok(r.ok, r.text);
  assert.equal(d.equip.weapon, 'r88_kougon_kiwami+3');
  assert.equal(itemCount(d, upgradeId('r88_kougon_kiba', 3)), 0);
  // ムチと やりが 持てる 職業（太公望は ムチ）
  const e = hero('taikobo');
  e.equip.weapon = 'r88_kougon_ryu';
  assert.ok(canEquipChar(e, 'r88_kougon_ryu'));
  assert.equal(shiftShape(e, e, 'r88_kougon_kiwami', dep).ok, false, '太公望は 短剣を 持てない');
  // 説明
  assert.ok(r88DetailLines('r88_kougon_ryu', e).some((l) => l.startsWith('形：二の型・竜')));
});

test('第88回 G2: 形がえは メニューから（サーバーの shapeShift）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(88), rateLimit: false });
  const bot = new Bot(world, 'ヒナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.job = 'rekka';
  gainExp(c, expForLevel(70) - c.exp);
  addItem(c, upgradeId('r88_kougon_kiba', 2), 1);
  const menu = (msg) => {
    bot.send({ t: 'menu', ...msg });
    return bot.msgs.filter((m) => m.t === 'menuRes').pop();
  };
  let res = menu({ action: 'shapeShift', who: 'self', to: 'r88_kougon_kiba' });
  assert.equal(res.ok, false, '烈火は やりを 持てない');
  res = menu({ action: 'shapeShift', who: 'self', to: 'r88_kougon_mika' });
  assert.equal(res.ok, true, res.text);
  assert.equal(c.equip.weapon, 'r88_kougon_mika+2');
  res = menu({ action: 'shapeShift', who: 'self', to: 'r88_kougon_kiwami' });
  assert.equal(res.ok, true, res.text);
  assert.equal(c.equip.weapon, 'r88_kougon_kiwami+2');
  assert.equal(menu({ action: 'shapeShift', who: 'self', to: 'nothing' }).ok, false);
});

// ───────────── そろい ─────────────
test('第88回 G2: そろい（なたの宝貝・黄天化の剣・影界玉と光界玉・えん水と氷魔えん・石ちゅうと鉄丸）', () => {
  for (const sid of ['nataku', 'kotenka', 'jutenkun', 'igai_maou', 'rekka_fujin_raijin', 'eikai_kokai', 'enzui_hyoma', 'sekichu_tetsugan', 'shinryo']) {
    assert.ok(GEAR_SETS[sid], sid);
    for (const id of GEAR_SETS[sid].items) assert.equal(ITEMS[id].set, sid, `${sid}: ${id}`);
  }
  assert.equal(GEAR_SETS.igai_maou.items.length, 5);
  assert.equal(GEAR_SETS.jutenkun.items.length, 6);
  // なたの宝貝: 3つ 持って 1つ つけると 素早さ+12（2つでは まだ）
  const c = hero('taikobo');
  c.equip.acc = 'r88_fukarin';
  const one = computeStats(c);
  c.items = [{ id: 'r88_kontenryo', n: 1 }];
  assert.equal(computeStats(c).agi, one.agi, '2つ');
  c.items.push({ id: 'r88_kinsen', n: 1 });
  assert.equal(setCount(c, 'nataku'), 3);
  assert.equal(computeStats(c).agi, one.agi + 12, '3つ');
  c.equip.acc = null;
  assert.equal(computeStats(c).agi, computeStats({ ...c, items: [] }).agi, 'つけて いなければ つかない');
  // 黄天化の剣: 2つ 持って 1つ つける → 光の力+3
  const k = hero('warrior');
  k.equip.weapon = 'r88_bakuya';
  assert.equal(gearFxTotals(k).el_light, 6);
  k.items = [{ id: 'r88_sanshin', n: 1 }];
  assert.equal(gearFxTotals(k).el_light, 9);
  // 影界玉と光界玉: 2つ 持って どちらかで 闇に強い
  const e = hero('rekka');
  e.equip.acc = 'r88_eikai';
  const r0 = computeStats(e).resist.dark ?? 1;
  e.items = [{ id: 'r88_kokai', n: 1 }];
  assert.ok((computeStats(e).resist.dark ?? 1) < r0);
  // えん水と氷魔えん: 氷の力+3
  const w = hero('warrior');
  w.equip.weapon = 'r88_hyoma';
  w.items = [{ id: 'r88_ensui', n: 1 }];
  assert.equal(gearFxTotals(w).el_ice, 6 + 3);
  // 石ちゅうと鉄丸: 1人が 2つ つけると 守備力+20
  const s = hero('warrior');
  s.equip.armor = 'r88_sekichu';
  const a1 = computeStats(s).dfn;
  s.equip.acc = 'r88_tetsugan';
  assert.equal(computeStats(s).dfn - a1, (ITEMS.r88_tetsugan.bonus.def || 0) + 20);
  // しょう号（十天君・異界の魔王の武器）
  const t = hero();
  t.items = GEAR_SETS.jutenkun.items.map((id) => ({ id, n: 1 }));
  t.bank = { gold: 0, items: GEAR_SETS.igai_maou.items.map((id) => ({ id, n: 1 })) };
  const titles = setTitles(t).map((x) => x.title);
  for (const x of ['じんの使い手', '十天君', '魔王の武器の使い手', '闇を打つ者']) assert.ok(titles.includes(x), x);
});

test('第88回 G2: そろい party（風神＋雷神・神りょしん刀は 2人で 1つずつ）', () => {
  const a = hero('rekka');
  a.equip.weapon = 'r88_fujin';
  const b1 = hero('rekka');
  b1.id = 'p2';
  b1.equip.weapon = null;
  let b = fight([a, b1]);
  assert.ok(!b.allies[0].partySet, '1つでは まだ');
  b1.equip.weapon = 'r88_raijin';
  const st = computeStats(b1);
  b = fight([a, b1]);
  for (const x of b.allies) assert.ok(x.partySet);
  assert.equal(b.allies[1].atk, st.atk + 10);
  assert.equal(b.allies[1].mag, st.mag + 10);
  // 神りょしん刀
  a.equip.weapon = 'r88_shinryo';
  b1.equip.weapon = 'r88_shinryo';
  b = fight([a, b1]);
  assert.ok(b.allies[0].gearFx.some((x) => x.kind === 'chase' && x.v >= 4));
  // しょう号（2つ 持つ）
  a.items = [{ id: 'r88_fujin', n: 1 }, { id: 'r88_raijin', n: 1 }];
  assert.ok(setTitles(a).some((x) => x.title === '風と雷の魔導具使い'));
});

// ───────────── 生まれ変わり ─────────────
test('第88回 G2: 生まれ変わり（風のツメ → 風神・打神べん → 太極の打神べん〈太極図の巻物〉・オリハルコンの像 → 賢者の石）', () => {
  const r1 = rebirthOf('r88_kaze_tsume');
  assert.equal(r1.to, 'r88_fujin');
  assert.equal(r1.at, upgradeLimit(ITEMS.r88_kaze_tsume) + CAP_UP_MAX);
  const c1 = upgradeCost(upgradeId('r88_kaze_tsume', r1.at), null);
  assert.ok(c1.reborn && c1.to === 'r88_fujin');
  const r2 = rebirthOf('r88_dashin');
  assert.equal(r2.to, 'r88_dashin_taikyoku');
  const c2 = upgradeCost(upgradeId('r88_dashin', r2.at), null);
  assert.deepEqual(c2.need, { items: ['r88_taikyoku'] });
  assert.equal(ITEMS.r88_dashin_taikyoku.grade, 'den');
  // アクセ（オリハルコンの像）は 1回で 今 ある 賢者の石に
  assert.ok(canUpgrade('r88_orihalcon', null));
  const c3 = upgradeCost('r88_orihalcon', null);
  assert.ok(c3.reborn && c3.to === 'philosopher_stone', JSON.stringify(c3));
  assert.equal(canUpgrade('philosopher_stone', null), false, '賢者の石は きたえられない まま');
  assert.equal(canUpgrade('r88_demonblood', null), false, 'ほかの アクセも きたえられない まま');
});

test('第88回 G2: かじ屋で オリハルコンの像 → 賢者の石', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(88), rateLimit: false });
  const bot = new Bot(world, 'ヒナ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.gold = 99999;
  addItem(c, 'r88_orihalcon', 1);
  addItem(c, 'star_shard', 10);
  addItem(c, 'magic_powder', 10);
  bot.send({ t: 'svc', kind: 'forge', action: 'upgrade', id: 'r88_orihalcon' });
  const res = bot.msgs.filter((m) => m.t === 'svcRes').pop();
  assert.equal(res.ok, true, res.text);
  assert.ok(res.reborn);
  assert.equal(itemCount(c, 'r88_orihalcon'), 0);
  assert.equal(itemCount(c, 'philosopher_stone'), 1);
});

// ───────────── G5班: 手に入れ方（ライバル・ガチャ・試練の ごほうび・宝の洞窟）─────────────
test('第88回 G5: 3作品が ガチャに ならぶ。ライバルの 品・試練の ごほうび・伝説・生まれ変わりの 先・店の 品は 出ない', () => {
  const rivalGift = new Set(RIVALS.flatMap((r) => r.reward));
  const trial = new Set(['r88_dashin', 'r88_lina_mantle']);
  for (const w of ['houshin', 'slayers', 'rekka']) {
    const p = gachaPool(w);
    assert.ok(p.fu.length > 0 && p.mei.length > 0, w);
    for (const id of p.all) {
      const it = ITEMS[id];
      assert.equal(it.work, w, id);
      assert.ok(['mei', 'fu3', 'fu2'].includes(it.grade), `${id}: ${it.grade}`);
      assert.ok(!rivalGift.has(id), `ライバルの 品 ${id}`);
      assert.ok(!trial.has(id), `試練の ごほうび ${id}`);
    }
  }
  // わけ
  for (const id of rivalGift) assert.notEqual(gachaBlock(id), null, id);
  assert.equal(gachaBlock('r88_naga_spike'), 'rival');
  assert.equal(gachaBlock('r88_zangulus'), 'rival');
  assert.equal(gachaBlock('r88_kodama'), 'rival');
  assert.equal(gachaBlock('r88_hyoma'), 'rival');
  assert.equal(gachaBlock('r88_taishaku'), 'rival');
  assert.equal(gachaBlock('r88_dashin'), 'trial');
  assert.equal(gachaBlock('r88_lina_mantle'), 'trial');
  assert.equal(gachaBlock('r88_fujin'), 'rebirth', '風神は 風のツメの 生まれ変わり');
  for (const id of ['r88_kokai', 'r88_raijin', 'r88_gorun', 'r88_kougon_kiba', 'r88_taikyoku']) assert.equal(gachaBlock(id), 'legend', id);
  for (const id of ['r88_tsurizao', 'r88_shortsword', 'r88_jewels']) assert.equal(gachaBlock(id), 'shop', id);
  // 開天じゅ・じんの お札・ばく竜さく は ガチャと 宝の 入れ物から
  for (const id of ['r88_kaitenju', 'r88_jin_kanpyo', 'r88_jin_kinko', 'r88_bakuryu']) assert.equal(gachaBlock(id), null, id);
  assert.ok(r88MeiAll().includes('r88_jin_kinko'));
  assert.ok(r88MeiAll().includes('r88_hyoma') === false, 'ライバルの 名品は 宝の 入れ物にも 入らない');
});

test('第88回 G5: 試練の ごほうび（太公望 → 太公望の打神べん・リナ → 黒いマントと大ガメのかたあて）', () => {
  assert.equal(trialGiftOf('taikobo'), 'r88_dashin');
  assert.equal(trialGiftOf('lina'), 'r88_lina_mantle');
  assert.equal(trialGiftOf('enjutsushi'), null, '烈火 本人の 品は ない');
  const c = hero('lina', 40);
  c.jobs.lina = { lv: 10, tr: 1 };
  c.jobs.taikobo = { lv: 10, tr: 1 };
  const steps = trialGiftSteps(c, '番人');
  assert.equal(itemCount(c, 'r88_dashin'), 1);
  assert.equal(itemCount(c, 'r88_lina_mantle'), 1);
  assert.ok(steps.some((st) => st[0] === 'say' && /打神べん/.test(st[2])));
  assert.deepEqual(trialGiftSteps(c, '番人'), [], '2回めは ない');
});

test('第88回 G5: 宝の洞窟の いちばん おく（Lv46 から）の 2つめの 主の 宝箱に 光界玉など 伝説が ごく まれに', () => {
  const yes = { chance: () => true, pick: (a) => a[0], next: () => 0.5 };
  const gold = { gold: 500 };
  assert.deepEqual(r88TmLoot(yes, 46, 'bossB', gold), { item: 'r88_kokai' });
  assert.notEqual(r88TmLoot(yes, 45, 'bossB', gold).item, 'r88_kokai', 'Lv45 までは 出ない');
  assert.notEqual(r88TmLoot(yes, 50, 'bossA', { item: 'limit_stone', n: 1 }).item, 'r88_kokai', '主の 宝箱は かえない');
  assert.notEqual(r88TmLoot(yes, 50, 'normal', gold).item, 'r88_kokai', 'ふつうの 宝箱は かえない');
  assert.deepEqual(TM_R88_DEN.slice(0, 4), ['r88_kokai', 'r88_galvaira', 'r88_ragud', 'r88_zanyo'], 'G6班: 斬よう剣も（G7班から あとの 伝説は うしろに 足す）');
  for (const id of TM_R88_DEN) assert.equal(ITEMS[id].grade, 'den', id);
  // 本当の 宝箱: Lv48 の 2つめの 主の 宝箱で 伝説は 2〜6%
  let den = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) if (TM_R88_DEN.includes(chestLoot(makeRng(500 + i), 48, 'bossB').item)) den++;
  assert.ok(den / N > 0.02 && den / N < 0.06, `伝説 ${(den / N).toFixed(3)}`);
  for (let i = 0; i < 2000; i++) assert.ok(!TM_R88_DEN.includes(chestLoot(makeRng(900 + i), 40, 'bossB').item));
});

