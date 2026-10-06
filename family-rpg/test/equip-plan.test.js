// さいきょう装備の 見こみ（shared/equip-plan.js）と、装備で 上がる・下がる 強さ（client/ui/info.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { bestEquipPlan, bestTeamOrder, weaponWeights, BEST_SLOTS } from '../public/js/shared/equip-plan.js';
import { statChanges, statChangesHtml, equipDiff, diffText } from '../public/js/client/ui/info.js';
import { Bot } from './helpers.js';

async function hero(job = 'warrior', level = 20) {
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false });
  const bot = new Bot(world, 'テスト');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const s = bot.s;
  gainExp(s.char, expForLevel(level) - s.char.exp);
  return { world, bot, s };
}
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const clone = (x) => JSON.parse(JSON.stringify(x));

test('さいきょう装備の 見こみ: 何が 何に 変わるか・強さの 前と 後（ふくろも 装備も かえない）', async () => {
  const { s } = await hero('warrior');
  const me = s.char;
  Object.assign(me.equip, { weapon: 'wood_sword', armor: 'cloth', shield: null, head: null });
  me.items = [{ id: 'bronze_sword', n: 1 }, { id: 'iron_sword', n: 1 }, { id: 'iron_armor', n: 1 }, { id: 'oak_staff', n: 1 }];
  const bagBefore = clone(me.items);
  const equipBefore = clone(me.equip);
  const plan = bestEquipPlan([{ key: 'self', char: me }], me);
  assert.deepEqual(me.items, bagBefore, 'ふくろは そのまま');
  assert.deepEqual(me.equip, equipBefore, '装備も そのまま');
  assert.equal(plan.length, 1);
  assert.equal(plan[0].key, 'self');
  assert.deepEqual(plan[0].changes, [{ slot: 'weapon', from: 'wood_sword', to: 'iron_sword' }, { slot: 'armor', from: 'cloth', to: 'iron_armor' }]);
  // 強さ: 攻撃力・守備力は 上がり、素早さは 下がる（鉄のよろい）
  const ch = statChanges(plan[0].before, plan[0].after);
  assert.ok(ch.find((x) => x.k === 'atk').d > 0 && ch.find((x) => x.k === 'dfn').d > 0, '上がる 強さ');
  const agi = ch.find((x) => x.k === 'agi');
  assert.ok(agi && agi.d < 0 && agi.a === agi.b + agi.d, '下がる 強さも 前→後で');
  assert.deepEqual(BEST_SLOTS, ['weapon', 'armor', 'shield', 'head'], 'アクセサリーは そのまま');
  // もう 強い ものが ない
  me.items = [{ id: 'bronze_sword', n: 1 }];
  me.equip.weapon = 'iron_sword';
  me.equip.armor = 'iron_armor';
  assert.deepEqual(bestEquipPlan([{ key: 'self', char: me }], me), []);
});

test('さいきょう装備の 見こみ: 1つしか ない 物は 先の 人。はずした 物は 次の 人が 使える', () => {
  const a = { name: 'A', job: 'warrior', level: 20, jobs: {}, equip: { weapon: 'bronze_sword' }, seeds: {} };
  const b = { name: 'B', job: 'warrior', level: 20, jobs: {}, equip: { weapon: 'wood_sword' }, seeds: {} };
  const bag = { items: [{ id: 'iron_sword', n: 1 }] };
  const plan = bestEquipPlan([{ key: 'a', char: a }, { key: 'b', char: b }], bag);
  assert.deepEqual(plan.map((p) => [p.key, p.changes.map((x) => `${x.from}>${x.to}`)]), [['a', ['bronze_sword>iron_sword']], ['b', ['wood_sword>bronze_sword']]]);
  assert.deepEqual(bag.items, [{ id: 'iron_sword', n: 1 }], 'ふくろは かわらない');
});

test('さいきょう装備: 見こみの とおりに 装備される（クライアントに とどく 情報で 計算しても おなじ）', async () => {
  const { world, bot, s } = await hero('warrior');
  recruitNpc(world, s, 'npc_gard', { force: true });
  recruitNpc(world, s, 'npc_mina', { force: true });
  const me = s.char;
  const gard = me.companions.find((e) => e.key === 'npc_gard').char;
  me.equip.weapon = 'wood_sword';
  gard.equip.weapon = 'wood_sword';
  me.items = [{ id: 'bronze_sword', n: 1 }, { id: 'iron_sword', n: 1 }, { id: 'iron_armor', n: 1 }, { id: 'leather_shield', n: 2 }];
  world.sendSelf(s);
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'spell' }); // パーティーの じょうほうを とどける
  // クライアント（menu.js の bestTeam・charOf）と おなじ: 自分の 情報と パーティーの 仲間の 情報から
  const meC = bot.char;
  const sups = (bot.party?.supports || []).filter((x) => x.owner === meC.id && x.kind !== 'family');
  const pos = Math.max(0, Math.min(sups.length, Number.isInteger(meC.selfPos) ? meC.selfPos : 0));
  const asChar = (x) => ({ name: x.name, level: x.level, job: x.job, jobs: x.jobs || {}, equip: x.equip || {}, seeds: x.seeds || {}, species: x.species || undefined, plus: x.plus || 0, bonus: x.bonus || undefined });
  const team = [...sups.slice(0, pos).map((x) => ({ key: x.key, char: asChar(x) })), { key: 'self', char: meC }, ...sups.slice(pos).map((x) => ({ key: x.key, char: asChar(x) }))];
  const plan = bestEquipPlan(team, meC);
  assert.ok(plan.length >= 2, `2人以上 変わる (${plan.length})`);
  bot.send({ t: 'menu', action: 'bestEquip', who: 'all' });
  assert.equal(lastMenu(bot).ok, true, lastMenu(bot).text);
  const real = (key) => (key === 'self' ? me : me.companions.find((e) => e.key === key).char);
  for (const p of plan) {
    for (const x of p.changes) assert.equal(real(p.key).equip[x.slot], x.to, `${p.name}の ${x.slot}`);
    assert.equal(computeStats(real(p.key)).atk, p.after.atk, `${p.name}の 攻撃力`);
  }
  assert.equal(gard.equip.weapon !== 'wood_sword', true, 'ガルドも 変わった');
  assert.equal(itemCount(me, 'iron_sword') + itemCount(me, 'bronze_sword') <= 1, true, '強い 剣は だれかが 装備した');
});

test('みんなさいきょう装備: 馬車の 仲間も 装備する（戦う 仲間が 先。クライアントの 見こみと おなじ）', async () => {
  const { world, bot, s } = await hero('warrior');
  const me = s.char;
  me.wagon = true;
  for (const id of ['npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin', 'npc_tina']) recruitNpc(world, s, id, { force: true });
  assert.deepEqual(me.partyKeys, ['npc_gard', 'npc_mina', 'npc_poporo']);
  assert.deepEqual(me.wagonKeys, ['npc_rin', 'npc_tina'], '5人目からは 馬車');
  const mate = (key) => me.companions.find((e) => e.key === key).char;
  me.equip = { weapon: 'wood_sword', armor: 'cloth', shield: null, head: null, acc: null };
  for (const e of me.companions) e.char.equip = { weapon: null, armor: 'cloth', shield: null, head: null, acc: null };
  // たては 1つだけ（戦う 仲間が 先）。ツメと おうぎは 馬車の 2人だけが 装備できる
  me.items = [{ id: 'iron_shield', n: 1 }, { id: 'iron_claw', n: 1 }, { id: 'feather_fan', n: 1 }, { id: 'leather_whip', n: 1 }];
  world.sendSelf(s);
  bot.send({ t: 'menu', action: 'fullHeal', mode: 'spell' }); // パーティーの じょうほうを とどける
  // クライアント（menu.js の bestTeam・charOf）と おなじ 計算
  const meC = bot.char;
  const asChar = (x) => ({ name: x.name, level: x.level, job: x.job, jobs: x.jobs || {}, equip: x.equip || {}, seeds: x.seeds || {}, species: x.species || undefined, plus: x.plus || 0, bonus: x.bonus || undefined });
  const mine = (list) => (list || []).filter((x) => x.owner === meC.id && x.kind !== 'family').map((x) => ({ key: x.key, char: asChar(x) }));
  assert.equal(mine(bot.party.wagon).length, 2, 'クライアントにも 馬車の 仲間が とどいている');
  const team = bestTeamOrder({ key: 'self', char: meC }, mine(bot.party.supports), mine(bot.party.wagon), meC.selfPos);
  assert.deepEqual(team.map((m) => m.key), ['self', 'npc_gard', 'npc_mina', 'npc_poporo', 'npc_rin', 'npc_tina']);
  const plan = bestEquipPlan(team, meC);
  bot.send({ t: 'menu', action: 'bestEquip', who: 'all' });
  assert.equal(lastMenu(bot).ok, true, lastMenu(bot).text);
  assert.equal(me.equip.shield, 'iron_shield', 'たては 戦う 仲間（自分）が 先');
  assert.equal(mate('npc_rin').equip.weapon, 'iron_claw', '馬車の 武闘家に ツメ');
  assert.ok(['feather_fan', 'leather_whip'].includes(mate('npc_tina').equip.weapon), '馬車の 旅芸人にも 武器');
  for (const p of plan) for (const x of p.changes) assert.equal((p.key === 'self' ? me : mate(p.key)).equip[x.slot], x.to, `${p.name}の ${x.slot}（見こみの とおり）`);
});

test('さいきょう装備の 武器: 呪文の 職業は 魔力の 上がる つえ、戦う 職業は 攻撃力', () => {
  const bag = { items: [{ id: 'iron_spear', n: 1 }, { id: 'healing_staff', n: 1 }] };
  const pick = (job, items) => bestEquipPlan([{ key: 'a', char: { name: 'A', job, level: 20, jobs: {}, equip: {}, seeds: {} } }], { items })[0]?.changes.find((x) => x.slot === 'weapon')?.to;
  assert.equal(pick('priest', bag.items), 'healing_staff', '僧侶は 回復魔力の 上がる つえ（やりの ほうが 攻撃力は 高い）');
  assert.equal(pick('mage', [{ id: 'poison_knife', n: 1 }, { id: 'wizard_staff', n: 1 }]), 'wizard_staff', '魔法使いは 攻撃魔力の つえ');
  assert.equal(pick('paladin', bag.items), 'iron_spear', 'パラディンは 攻撃力');
  assert.equal(pick('hero', [{ id: 'iron_sword', n: 1 }, { id: 'wizard_staff', n: 1 }]), 'iron_sword', '勇者は 剣');
  assert.deepEqual(weaponWeights({ species: 'pururin' }), { atk: 1, mag: 0, heal: 0 }, '魔物は 攻撃力');
});

test('装備で 変わる 強さ: 上がる ものも 下がる ものも 色つきで 出す', () => {
  const ch = statChanges({ atk: 40, dfn: 30, agi: 26, mag: 5, heal: 5, maxHp: 100, maxMp: 10 }, { atk: 40, dfn: 53, agi: 24, mag: 5, heal: 5, maxHp: 100, maxMp: 10 });
  assert.deepEqual(ch.map((x) => [x.k, x.b, x.a, x.d]), [['dfn', 30, 53, 23], ['agi', 26, 24, -2]]);
  const html = statChangesHtml(ch);
  assert.ok(html.includes('<span class="sc up">守備力 30→53↑23</span>'), html);
  assert.ok(html.includes('<span class="sc down">素早さ 26→24↓2</span>'), html);
  assert.ok(statChangesHtml([]).includes('変わらない'));
  // equipDiff（前と 後も）
  const c = { name: 'A', job: 'warrior', level: 20, jobs: {}, equip: { armor: 'cloth' }, seeds: {} };
  const d = equipDiff(c, 'iron_armor');
  assert.ok(d.some((x) => x.k === 'dfn' && x.d > 0) && d.some((x) => x.k === 'agi' && x.d < 0), JSON.stringify(d));
  assert.ok(diffText(d).includes('素早さ-2'), diffText(d));
});
