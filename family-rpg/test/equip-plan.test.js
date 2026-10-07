// さいきょう装備の 見こみ（shared/equip-plan.js）と、装備で 上がる・下がる 強さ（client/ui/info.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel, computeStats, itemCount } from '../public/js/shared/stats.js';
import { recruitNpc } from '../public/js/shared/world/party.js';
import { bestEquipPlan, bestTeamOrder, weaponWeights, BEST_SLOTS, gearChoices, sortGearChoices, gearScore, GEAR_SORTS } from '../public/js/shared/equip-plan.js';
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

// ───── 装備を えらぶ まど（メニューの「装備」→ 部位）: 装備できる 物だけ・入手順／強さ順 ─────
const mkChar = (job, extra = {}) => ({ name: job, job, level: 20, jobs: {}, equip: { weapon: null, armor: 'cloth', shield: null, head: null, acc: null }, seeds: {}, ...extra });

test('装備を えらぶ まど: その 人が 装備できる 物だけ（職業の 武器・よろい・たて・かぶと、魔物の しゅぞく）', () => {
  const bag = { items: [
    { id: 'iron_sword', n: 1 }, { id: 'oak_staff', n: 2 }, { id: 'iron_axe', n: 1 }, { id: 'iron_claw', n: 1 }, { id: 'herb', n: 5 },
    { id: 'iron_armor', n: 1 }, { id: 'wizard_robe', n: 1 }, { id: 'martial_gi', n: 1 }, { id: 'travel_clothes', n: 1 },
    { id: 'iron_shield', n: 1 }, { id: 'iron_helm', n: 1 }, { id: 'leather_hat', n: 1 }, { id: 'power_ring', n: 1 }, { id: 'bronze_sword', n: 0 },
  ] };
  const ids = (ch, slot, others) => gearChoices(ch, slot, bag, others).map((x) => (x.from ? `${x.from}:${x.id}` : x.id));
  const warrior = mkChar('warrior'), mage = mkChar('mage'), monk = mkChar('monk');
  assert.deepEqual(ids(warrior, 'weapon'), ['iron_sword', 'iron_axe'], '戦士: 剣・オノ（0こ の 物は 出さない）');
  assert.deepEqual(ids(mage, 'weapon'), ['oak_staff'], '魔法使い: つえ');
  assert.deepEqual(ids(monk, 'weapon'), ['iron_claw'], '武闘家: ツメ');
  assert.deepEqual(ids(warrior, 'armor'), ['iron_armor', 'martial_gi', 'travel_clothes']);
  assert.deepEqual(ids(mage, 'armor'), ['wizard_robe', 'travel_clothes'], '重いよろいは 出さない');
  assert.deepEqual(ids(monk, 'armor'), ['martial_gi', 'travel_clothes']);
  assert.deepEqual(ids(warrior, 'shield'), ['iron_shield']);
  assert.deepEqual(ids(mage, 'shield'), [], 'たてを 持てない 職業');
  assert.deepEqual(ids(warrior, 'head'), ['iron_helm', 'leather_hat']);
  assert.deepEqual(ids(mage, 'head'), ['leather_hat'], 'かぶとは 出さない');
  assert.deepEqual(ids(monk, 'acc'), ['power_ring'], 'アクセサリーは だれでも');
  // モンスターの 仲間（しゅぞくの きまり）: ぷるりんは 武器・たてを 持てない。服と ぼうしだけ
  const slime = mkChar('warrior', { species: 'pururin' });
  assert.deepEqual(ids(slime, 'weapon'), []);
  assert.deepEqual(ids(slime, 'shield'), []);
  assert.deepEqual(ids(slime, 'armor'), ['travel_clothes']);
  assert.deepEqual(ids(slime, 'head'), ['leather_hat']);
  // 仲間が 装備している 物（入れかえ）も その 人が 装備できる 物だけ。ふくろの 物の あと
  const others = [{ key: 'a', char: mkChar('mage', { equip: { weapon: 'wizard_staff' } }) }, { key: 'b', char: mkChar('warrior', { equip: { weapon: 'silver_sword' } }) }];
  assert.deepEqual(ids(warrior, 'weapon', others), ['iron_sword', 'iron_axe', 'b:silver_sword']);
  assert.deepEqual(ids(mage, 'weapon', others), ['oak_staff', 'a:wizard_staff']);
  assert.deepEqual(ids(slime, 'weapon', others), []);
});

test('装備を えらぶ まど: 入手順は ふくろの じゅん、強さ順は みんなさいきょう装備と おなじ くらべかた（いちばん 上が さいきょう装備の 物）', () => {
  assert.deepEqual(GEAR_SORTS, { got: '入手順', power: '強さ順' });
  // 戦士の 武器: 攻撃力の 高い じゅん
  const w = mkChar('warrior', { equip: { weapon: 'wood_sword', armor: 'cloth' } });
  const bag = { items: [{ id: 'bronze_sword', n: 1 }, { id: 'stone_axe', n: 1 }, { id: 'silver_sword', n: 1 }, { id: 'iron_sword', n: 2 }, { id: 'iron_axe', n: 1 }] };
  const list = gearChoices(w, 'weapon', bag);
  assert.deepEqual(sortGearChoices(list, 'got').map((x) => x.id), bag.items.map((e) => e.id), '入手順');
  const power = sortGearChoices(list, 'power').map((x) => x.id);
  assert.deepEqual(power, ['silver_sword', 'iron_axe', 'iron_sword', 'stone_axe', 'bronze_sword'], '強さ順');
  assert.equal(bestEquipPlan([{ key: 'w', char: w }], bag)[0].changes.find((x) => x.slot === 'weapon').to, power[0], 'いちばん 上は さいきょう装備と おなじ');
  const atk = (id) => computeStats({ ...w, equip: { ...w.equip, weapon: id } }).atk;
  for (let i = 1; i < power.length; i++) assert.ok(atk(power[i - 1]) >= atk(power[i]), `${power[i - 1]} の 攻撃力 >= ${power[i]}`);
  assert.deepEqual(list.map((x) => x.id), bag.items.map((e) => e.id), 'もとの ならびは かえない');
  // 呪文の 職業は 魔力の 上がる つえが 上（みんなさいきょう装備と おなじ）
  const mage = mkChar('mage');
  const bag2 = { items: [{ id: 'bronze_knife', n: 1 }, { id: 'oak_staff', n: 1 }, { id: 'wizard_staff', n: 1 }] };
  const top = sortGearChoices(gearChoices(mage, 'weapon', bag2), 'power')[0].id;
  assert.equal(top, 'wizard_staff');
  assert.equal(top, bestEquipPlan([{ key: 'm', char: mage }], bag2)[0].changes[0].to);
  // 大事な 強さ（守備力）が おなじ なら 強さの 合計が 多い 物が 上（みんなさいきょう装備と おなじ）
  const bag3 = { items: [{ id: 'captain_hat', n: 1 }, { id: 'feather_hat', n: 1 }, { id: 'mystic_hat', n: 1 }] };
  const hats = sortGearChoices(gearChoices(mage, 'head', bag3), 'power').map((x) => x.id);
  assert.deepEqual(hats, ['mystic_hat', 'feather_hat', 'captain_hat']);
  assert.equal(bestEquipPlan([{ key: 'm', char: mage }], bag3)[0].changes[0].to, hats[0]);
  assert.ok(gearScore(mage, 'head', 'mystic_hat') > gearScore(mage, 'head', 'captain_hat'));
  // まったく おなじ 強さなら 入手順のまま
  const bag4 = { items: [{ id: 'flame_shield', n: 1 }, { id: 'ice_shield', n: 1 }] };
  const sh = gearChoices(w, 'shield', bag4);
  if (sh[0].score === sh[1].score) assert.deepEqual(sortGearChoices(sh, 'power').map((x) => x.id), ['flame_shield', 'ice_shield']);
  // 仲間が 装備している 物は、強さ順でも ふくろの 物の あと（その 中も 強い じゅん）
  const others = [{ key: 'a', char: mkChar('warrior', { equip: { weapon: 'bronze_sword' } }) }, { key: 'b', char: mkChar('warrior', { equip: { weapon: 'steel_sword' } }) }];
  const mixed = sortGearChoices(gearChoices(w, 'weapon', bag, others), 'power').map((x) => (x.from ? `${x.from}:${x.id}` : x.id));
  assert.deepEqual(mixed, [...power, 'b:steel_sword', 'a:bronze_sword']);
});
