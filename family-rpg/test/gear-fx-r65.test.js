// 第65回: れん金の 効果は ランダム（同じ 素材・レア度で 強さ・同じ 効果は かさなる・いっぱいなら えらぶ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { GEAR_FX, FX_RANGE, FX_MATS, rollFx, mergeFx, fxRange, fxStars, fxBlock, fxSlots, fxListOf, gearFxTotals, gearFxStats, gearUses, repairGearFx, fxText, fxShort, fxPower, FX_VMAX } from '../public/js/shared/data/gear-fx.js';
import { isShopGear } from '../public/js/shared/data/items-rare.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount, computeStats } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';
import * as GX from '../public/js/shared/battle-gearfx.js';

const pick = (pred) => Object.keys(ITEMS).find((k) => !ITEMS[k].base && !isShopGear(ITEMS[k]) && pred(ITEMS[k]));
const SWORD = pick((it) => it.type === 'weapon' && it.cat === 'sword' && it.rank <= 4);
const ARMOR = pick((it) => it.type === 'armor' && it.rank <= 4);

function setup(fx, { lucky = true, slot = 'weapon', id = SWORD } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(30));
  c.equip = { ...c.equip, [slot]: id };
  c.gearFx = { [id]: fx };
  fullHeal(c);
  const rng = makeRng(3);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }], enemies: ['rockman'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  return { b, c, me: b.allies[0], foe: b.enemies[0] };
}
const ev0 = () => ({ lines: [], upd: [] });

test('第65回: 効果の データ・ひく（部位ごと・レア度で 強さの はば）', () => {
  for (const [k, f] of Object.entries(GEAR_FX)) {
    assert.ok(f.name && f.short && f.desc && f.slots.length && f.w > 0, k);
    assert.ok(fxText(k, 5).startsWith(f.name), k);
  }
  for (const [, n] of [...FX_MATS.weapon, ...FX_MATS.armor]) assert.ok(n > 0);
  assert.ok(fxBlock('wood_sword'), '店の 品は できない');
  const rng = makeRng(7);
  const seenK = new Set();
  for (let i = 0; i < 400; i++) {
    const r = rollFx(rng, SWORD);
    assert.ok(GEAR_FX[r.k].slots.includes('weapon'), r.k);
    const [lo, hi] = fxRange(SWORD);
    assert.ok(r.v >= lo && r.v <= hi);
    seenK.add(r.k);
    const a = rollFx(rng, ARMOR);
    assert.ok(GEAR_FX[a.k].slots.includes('armor'), a.k);
  }
  assert.ok(seenK.size >= 10, 'いろいろな 効果が 出る');
  // レア度が 高いほど 強い
  assert.ok(FX_RANGE[5][1] > FX_RANGE[2][1] && FX_RANGE[5][0] > FX_RANGE[2][0]);
  assert.ok(fxStars(SWORD) >= 2);
});

test('第65回: 同じ 効果は 値が 上がる・ちがう 効果は ふえる（限界突破で 2つ）・いっぱいなら えらぶ', () => {
  assert.deepEqual(mergeFx([{ k: 'chase', v: 3 }], { k: 'chase', v: 4 }, 1), { kind: 'up', list: [{ k: 'chase', v: 7 }] });
  assert.equal(mergeFx([{ k: 'chase', v: FX_VMAX }], { k: 'chase', v: 4 }, 1).list[0].v, FX_VMAX, '上限');
  assert.equal(mergeFx([{ k: 'chase', v: 3 }], { k: 'drain', v: 2 }, 1).kind, 'full');
  assert.deepEqual(mergeFx([{ k: 'chase', v: 3 }], { k: 'drain', v: 2 }, 2).list, [{ k: 'chase', v: 3 }, { k: 'drain', v: 2 }]);
  assert.deepEqual(mergeFx([], { k: 'atk', v: 2 }, 1), { kind: 'add', list: [{ k: 'atk', v: 2 }] });
  assert.equal(fxSlots({}, SWORD), 1);
  assert.equal(fxSlots({ limitBreak: { [SWORD]: 1 } }, SWORD), 2);
});

test('第65回: 強さの まどに 足す 効果（攻撃力・HP・守り・会心・属性や 状態に 強い）', () => {
  const c = newCharacter({ id: 'p2', name: 'ユイ', job: 'warrior' });
  c.equip = { ...c.equip, weapon: SWORD, armor: ARMOR };
  const before = computeStats(c);
  c.gearFx = { [SWORD]: [{ k: 'atk', v: 5 }], [ARMOR]: [{ k: 'hp', v: 4 }, { k: 'res_fire', v: 10 }] };
  const after = computeStats(c);
  assert.equal(after.atk - before.atk, 10);
  assert.equal(after.maxHp - before.maxHp, 24);
  assert.ok((after.resist.fire ?? 1) < (before.resist.fire ?? 1));
  assert.deepEqual(gearFxTotals(c), { atk: 5, hp: 4, res_fire: 10 });
  assert.equal(fxShort(fxListOf(c, ARMOR)), 'HP+4・炎守+10');
  assert.ok(gearFxStats(c).add.atk === 10);
});

test('第65回: 戦い: 属性の 力・キラー・追撃・吸収・毒の 刃・いやし・反撃・イオ', () => {
  let { b, me, foe } = setup([{ k: 'el_fire', v: 5 }]);
  assert.equal(GX.attackMods(me, foe).element, 'fire');
  ({ b, me, foe } = setup([{ k: `slay_${foe.race}`, v: 5 }]));
  assert.ok(GX.attackMods(me, foe).mult > 1.15, 'キラー');
  ({ b, me, foe } = setup([{ k: 'chase', v: 5 }]));
  let ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(ev.lines.some((l) => /の追撃！/.test(l)), ev.lines.join('/'));
  ({ b, me, foe } = setup([{ k: 'drain', v: 5 }]));
  me.hp = 1;
  ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(me.hp > 1);
  ({ b, me, foe } = setup([{ k: 'poison', v: 10 }]));
  ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(foe.status.poison, '毒');
  ({ b, me, foe } = setup([{ k: 'regen', v: 5 }], { slot: 'armor', id: ARMOR }));
  me.hp = 1;
  GX.gearRegen(b, me, ev0());
  assert.ok(me.hp > 1);
  ({ b, me, foe } = setup([{ k: 'counter', v: 5 }], { slot: 'armor', id: ARMOR }));
  ev = ev0();
  b.perform(foe, { type: 'attack', target: me.id }, ev);
  b.resolveCounters(ev);
  assert.ok(ev.lines.includes(`${me.name}の反撃！`), ev.lines.join('/'));
  ({ b, me } = setup([{ k: 'useIo', v: 3 }]));
  assert.deepEqual(me.gearUses.map((u) => u.ability), ['io']);
  const mp = me.mp;
  ev = ev0();
  b.perform(me, { type: 'item', id: 'gear:weapon' }, ev);
  assert.equal(me.mp, mp, 'MP は へらない');
  assert.equal(gearUses({ equip: { weapon: SWORD }, gearFx: { [SWORD]: [{ k: 'useIo', v: 9 }] } })[0].ability, 'iora');
  assert.ok(fxPower('chase', 10).chance > fxPower('chase', 1).chance);
});

test('第65回: 第64回の 形は 値3で のこる・へんな ものは すてる', () => {
  const c = { gearFx: { [SWORD]: 'chase', [ARMOR]: 'useHoimi', nai: 'chase' } };
  repairGearFx(c);
  assert.deepEqual(c.gearFx, { [SWORD]: [{ k: 'chase', v: 3 }], [ARMOR]: [{ k: 'regen', v: 3 }] });
  const d = { gearFx: { [SWORD]: [{ k: 'bad', v: 3 }, { k: 'atk', v: 999 }] } };
  repairGearFx(d);
  assert.deepEqual(d.gearFx, { [SWORD]: [{ k: 'atk', v: FX_VMAX }] });
});

test('第65回: サーバー: 同じ 素材で ランダムに つく・いっぱいなら 入れかえ／前の まま', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(65), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  addItem(c, 'alchemy_pot', 1);
  addItem(c, SWORD, 1);
  c.equip.weapon = SWORD;
  const res = () => bot.msgs.filter((m) => m.t === 'svcRes').pop();
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon' });
  assert.equal(res().ok, false, '素材が ない');
  const give = () => { for (const [m, n] of FX_MATS.weapon) addItem(c, m, n); };
  give();
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon' });
  assert.ok(res().ok, res().text);
  assert.equal(c.gearFx[SWORD].length, 1);
  for (const [m] of FX_MATS.weapon) assert.equal(itemCount(c, m), 0, '素材は なくなる');
  // いっぱいに なるまで つける（同じ 効果なら 値が 上がる）
  let chose = false;
  for (let i = 0; i < 30 && !chose; i++) {
    give();
    bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon' });
    if (res().fxChoose) chose = true;
  }
  assert.ok(chose, 'ちがう 効果が 出て えらぶ');
  const before = JSON.stringify(c.gearFx[SWORD]);
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchantPick', replace: -1 });
  assert.equal(JSON.stringify(c.gearFx[SWORD]), before, '前の まま');
  // もう一度 いっぱいに して 入れかえる
  for (let i = 0; i < 30; i++) {
    give();
    bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon' });
    if (res().fxChoose) break;
  }
  const roll = res().fxRoll;
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchantPick', replace: 0 });
  assert.deepEqual(c.gearFx[SWORD][0], roll, '入れかえた');
});
