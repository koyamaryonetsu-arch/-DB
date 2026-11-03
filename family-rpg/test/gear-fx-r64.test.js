// 第64回 ⑥c: れん金で つけた 装備の 効果（追撃・HP吸収・MP吸収・いやし・反撃・使う）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../public/js/shared/data/items.js';
import { GEAR_FX, fxPower, fxText, fxBlock, gearFxOf, gearUses, repairGearFx, USE_HI_PLUS } from '../public/js/shared/data/gear-fx.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal, addItem, itemCount } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { isShopGear } from '../public/js/shared/data/items-rare.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { Bot } from './helpers.js';
import * as GX from '../public/js/shared/battle-gearfx.js';

const SWORD = Object.keys(ITEMS).find((k) => ITEMS[k].type === 'weapon' && ITEMS[k].cat === 'sword' && !ITEMS[k].base && !isShopGear(ITEMS[k]) && ITEMS[k].rank <= 4);
const ARMOR = Object.keys(ITEMS).find((k) => ITEMS[k].type === 'armor' && !ITEMS[k].base && !isShopGear(ITEMS[k]) && ITEMS[k].rank <= 4);

function setup(fx, { lucky = true, slot = 'weapon', id = SWORD } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(30));
  c.equip = { ...c.equip, [slot]: id };
  c.gearFx = { [id]: fx };
  fullHeal(c);
  const rng = makeRng(3);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }], enemies: ['rockman'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 9999; }
  return { b, c, me: b.allies[0], foe: b.enemies[0] };
}
const ev0 = () => ({ lines: [], upd: [] });

test('第64回: 効果の データ（素材・部位・強さは +で 上がる）', () => {
  for (const [k, f] of Object.entries(GEAR_FX)) {
    assert.ok(f.name && f.desc && f.slots.length && f.mats.length, k);
    for (const [m, n] of f.mats) assert.ok(ITEMS[m] && n > 0, `${k}: ${m}`);
    assert.ok(fxText(k, 0), k);
  }
  assert.ok(fxPower('chase', 6).chance > fxPower('chase', 0).chance);
  assert.ok(fxPower('drain', 6).rate > fxPower('drain', 0).rate);
  assert.equal(fxPower('useIo', 0).use, 'io');
  assert.equal(fxPower('useIo', USE_HI_PLUS).use, 'iora', '+5 から 強い 呪文');
  assert.ok(fxBlock('wood_sword'), '店の 品は できない');
  assert.equal(fxBlock(SWORD, 'chase'), null);
  assert.ok(fxBlock(SWORD, 'regen'), '武器に いやしは つけられない');
  const c = { equip: { weapon: SWORD }, gearFx: { [SWORD]: 'chase', nai: 'chase', [ARMOR]: 'bad' } };
  repairGearFx(c);
  assert.deepEqual(c.gearFx, { [SWORD]: 'chase' }, 'へんな ものは すてる');
  assert.deepEqual(gearFxOf(c).map((x) => x.kind), ['chase']);
  // きたえた +1〜 も 同じ しゅるい
  const plus = Object.keys(ITEMS).find((k) => ITEMS[k].base === SWORD && ITEMS[k].plus === 2);
  if (plus) assert.equal(gearFxOf({ equip: { weapon: plus }, gearFx: { [SWORD]: 'chase' } })[0].plus, 2);
});

test('第64回: 追撃・HP吸収・MP吸収', () => {
  let { b, me, foe } = setup('chase');
  let ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(ev.lines.some((l) => /の追撃！/.test(l)), ev.lines.join('/'));
  ({ b, me, foe } = setup('drain'));
  me.hp = 1;
  ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(me.hp > 1 && ev.lines.some((l) => /HPが\d+回復した/.test(l)), ev.lines.join('/'));
  ({ b, me, foe } = setup('mana'));
  me.mp = 0;
  ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(me.mp > 0, 'MP');
  // 効果の ない 人は なにも おきない
  ({ b, me, foe } = setup('chase'));
  me.gearFx = null;
  ev = ev0();
  b.perform(me, { type: 'attack', target: foe.id }, ev);
  assert.ok(!ev.lines.some((l) => /追撃/.test(l)));
});

test('第64回: いやし（行動の おわり）・反撃（攻撃された 時）', () => {
  let { b, me, foe } = setup('regen', { slot: 'armor', id: ARMOR });
  me.hp = 1;
  let ev = ev0();
  b.perform(me, { type: 'defend' }, ev);
  // perform の あとの 処理（いやし）は 行動の おわり（battle.js）なので、ちょくせつ よぶ
  GX.gearRegen(b, me, ev);
  assert.ok(me.hp > 1);
  ({ b, me, foe } = setup('counter', { slot: 'armor', id: ARMOR }));
  ev = ev0();
  b.perform(foe, { type: 'attack', target: me.id }, ev);
  b.resolveCounters(ev);
  assert.ok(ev.lines.some((l) => l === `${me.name}の反撃！`), ev.lines.join('/'));
});

test('第64回: 道具として 使う（何回でも・MP は いらない）', () => {
  const { b, me } = setup('useIo');
  assert.deepEqual(me.gearUses.map((u) => u.ability), ['io']);
  const mp = me.mp;
  assert.deepEqual(b.validate(me, { type: 'item', id: 'gear:weapon' }), { ok: true });
  assert.equal(b.validate(me, { type: 'item', id: 'gear:armor' }).ok, false);
  for (let i = 0; i < 3; i++) {
    const ev = ev0();
    b.perform(me, { type: 'item', id: 'gear:weapon' }, ev);
    assert.ok(ev.lines.some((l) => /をかかげた！/.test(l)), ev.lines.join('/'));
  }
  assert.equal(me.mp, mp, 'MP は へらない');
  assert.deepEqual(gearUses({ equip: { shield: null }, gearFx: {} }), []);
});

test('第64回: サーバー: れん金がまで 効果を つける（素材を つかう）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(64), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  addItem(c, 'alchemy_pot', 1);
  addItem(c, SWORD, 1);
  c.equip.weapon = SWORD;
  const res = () => bot.msgs.filter((m) => m.t === 'svcRes').pop();
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon', fx: 'chase' });
  assert.equal(res().ok, false, '素材が ない');
  for (const [m, n] of GEAR_FX.chase.mats) addItem(c, m, n);
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon', fx: 'chase' });
  assert.ok(res().ok, res().text);
  assert.equal(c.gearFx[SWORD], 'chase');
  for (const [m] of GEAR_FX.chase.mats) assert.equal(itemCount(c, m), 0, '素材は なくなる');
  bot.send({ t: 'svc', kind: 'alchemy', action: 'enchant', who: 'self', slot: 'weapon', fx: 'regen' });
  assert.equal(res().ok, false, '武器に いやしは だめ');
});
