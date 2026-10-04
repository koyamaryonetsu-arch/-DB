// 預かり所・ふしぎなかじ屋・全滅で お金が 半分に なる きまり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SLOTS, sellPrice, baseItemId, itemKana, sortItemIds } from '../public/js/shared/data/items.js';
import { UPGRADE_MAX, UPGRADE_TYPES, UPGRADE_BY_RANK, upgradeId, upgradeLimit } from '../public/js/shared/data/items-forge.js';
import { RECIPES, RECIPE_OPEN, recipeOpen, upgradeCost, lackOf, canUpgrade, maxPlus } from '../public/js/shared/data/forge.js';
import { BANK_KINDS, BANK_STACK } from '../public/js/shared/data/facilities.js';
import { MAT_DROPS, monsterDrops, rollDrops } from '../public/js/shared/data/loot.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { SCRIPTS } from '../public/js/shared/data/story.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { runSteps } from '../public/js/shared/world/scripts.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { exportCode, parseCode } from '../public/js/shared/world/transfer.js';
import { buildSyncOut, applySyncIn } from '../public/js/shared/world/sync.js';
import { wipeGoldLoss, bankCount, bankGold } from '../public/js/shared/world/bank.js';
import { newCharacter, computeStats, itemCount, addItem, canEquip, canEquipChar, gainExp, expForLevel, ownsItem } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

async function solo(job = 'warrior', seed = 5) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  return { world, bot, c };
}

const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const svc = (bot, msg) => {
  bot.send({ t: 'svc', ...msg });
  return lastSvc(bot);
};

// ───────────── 預かり所 ─────────────
test('預かり所: お金を 預ける・引き出す（持っている 以上は できない）', async () => {
  const { bot, c } = await solo();
  c.gold = 1500;
  assert.equal(svc(bot, { kind: 'bank', action: 'depositGold', amount: 2000 }).ok, false, '持っている 以上は 預けられない');
  assert.equal(svc(bot, { kind: 'bank', action: 'depositGold', amount: 0 }).ok, false);
  assert.equal(svc(bot, { kind: 'bank', action: 'depositGold', amount: -50 }).ok, false);
  assert.equal(svc(bot, { kind: 'bank', action: 'depositGold', amount: 'abc' }).ok, false);
  assert.equal(c.gold, 1500);
  assert.equal(c.bank, undefined, 'はじめて 預けるまで 預かり所は ない');
  const r = svc(bot, { kind: 'bank', action: 'depositGold', amount: 1000 });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /1000ゴールドを預けた/);
  assert.equal(c.gold, 500);
  assert.equal(bankGold(c), 1000);
  assert.equal(bot.char.bank.gold, 1000, 'がめんにも とどく');
  assert.equal(svc(bot, { kind: 'bank', action: 'withdrawGold', amount: 1001 }).ok, false, '預けた 以上は 引き出せない');
  assert.equal(svc(bot, { kind: 'bank', action: 'withdrawGold', amount: 400 }).ok, true);
  assert.equal(c.gold, 900);
  assert.equal(bankGold(c), 600);
  // 全部
  assert.equal(svc(bot, { kind: 'bank', action: 'depositGold', amount: c.gold }).ok, true);
  assert.equal(c.gold, 0);
  assert.equal(bankGold(c), 1500);
});

test('預かり所: 道具を 預ける・引き出す（大事な物は ダメ・数の 上限）', async () => {
  const { bot, c } = await solo();
  c.items = [{ id: 'herb', n: 5 }, { id: 'iron_sword', n: 1 }];
  c.keyItems = ['cave_key'];
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'cave_key' }).ok, false, '大事な物は 預けられない');
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'herb', qty: 6 }).ok, false, '持っている 数まで');
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'nothing' }).ok, false);
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'herb', qty: 3 }).ok, true);
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'iron_sword' }).ok, true, '装備品も 預けられる');
  assert.equal(itemCount(c, 'herb'), 2);
  assert.equal(itemCount(c, 'iron_sword'), 0);
  assert.equal(bankCount(c, 'herb'), 3);
  assert.equal(bankCount(c, 'iron_sword'), 1);
  assert.equal(svc(bot, { kind: 'bank', action: 'withdrawItem', id: 'herb', qty: 4 }).ok, false, '預けた 数まで');
  assert.equal(svc(bot, { kind: 'bank', action: 'withdrawItem', id: 'herb', qty: 3 }).ok, true);
  assert.equal(itemCount(c, 'herb'), 5);
  assert.equal(bankCount(c, 'herb'), 0);
  assert.ok(!c.bank.items.some((e) => e.id === 'herb'), '0個に なったら 消える');
  // ボスの 品は 預けても「持っている」（2つ目は もらえない）
  c.items.push({ id: 'rock_bangle', n: 1 });
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'rock_bangle' }).ok, true);
  assert.ok(ownsItem(c, 'rock_bangle'));
  // ふくろは 1しゅるい 99個まで
  c.items.push({ id: 'antidote', n: 99 });
  c.bank.items.push({ id: 'antidote', n: 5 });
  assert.equal(svc(bot, { kind: 'bank', action: 'withdrawItem', id: 'antidote', qty: 1 }).ok, false, 'ふくろが いっぱい');
  // 預かり所も 1しゅるい 99個まで・60しゅるいまで
  c.bank.items.find((e) => e.id === 'antidote').n = BANK_STACK;
  assert.equal(svc(bot, { kind: 'bank', action: 'depositItem', id: 'antidote', qty: 1 }).ok, false);
  c.bank.items = Object.keys(ITEMS).filter((id) => ITEMS[id].type === 'weapon').slice(0, BANK_KINDS).map((id) => ({ id, n: 1 }));
  assert.equal(c.bank.items.length, BANK_KINDS);
  const full = svc(bot, { kind: 'bank', action: 'depositItem', id: 'herb', qty: 1 });
  assert.equal(full.ok, false, full.text);
  assert.match(full.text, /60種類/);
});

// ───────────── 全滅 ─────────────
async function wipeOut(world, bot) {
  const ms = world.mapStates.get(bot.s.map) || (world.tick(1), world.mapStates.get(bot.s.map));
  const sym = { id: 'wipe' + Math.random(), sp: 'storm_general', group: ['storm_general', 'storm_general'], table: 'plains', zone: 'plains', x: bot.s.x, y: bot.s.y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  startFieldBattle(world, bot.s, sym);
  await bot.settle(20000);
}

test('全滅: 持っている お金だけ 半分に（預けた お金は そのまま）', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo();
  c.gold = 1001;
  c.bank = { gold: 700, items: [] };
  bot.x = bot.s.x = 60.5;
  bot.y = bot.s.y = 60.5;
  await wipeOut(world, bot);
  const end = bot.battles.pop();
  assert.equal(end.outcome, 'lose');
  assert.equal(c.gold, 500, '1001 → 500（はしたは 切りすて）');
  assert.equal(c.bank.gold, 700, '預けた お金は へらない');
  assert.ok(end.lines.some((l) => l.includes('所持金が半分になってしまった')), end.lines.join('/'));
  const toast = bot.msgs.filter((m) => m.t === 'toast').pop();
  assert.match(toast.text, /いのりの場所で目を覚ました/);
  assert.match(toast.text, /所持金が半分/);
  assert.match(toast.text, /預かり所のお金は無事/);
  assert.equal(c.hp, computeStats(c).maxHp, '教会で 目を覚ます');
  // お金が 0 なら なにも 言わない
  c.gold = 0;
  await wipeOut(world, bot);
  const end2 = bot.battles.pop();
  assert.equal(end2.outcome, 'lose');
  assert.ok(!end2.lines.some((l) => l.includes('所持金')));
  assert.deepEqual(wipeGoldLoss({ gold: 7 }), { before: 7, after: 3, lost: 4 });
});

test('全滅: 物語の ボス戦で 負けても 半分に。負けて よい 戦い（loseOk）は へらずに 物語が つづく', { timeout: 60000 }, async () => {
  const { world, bot, c } = await solo();
  // ボス戦（勝つための 戦い）
  c.gold = 800;
  runSteps(world, bot.s, [['battle', 'goldoon'], ['flag', 'test_after_boss']]);
  await bot.settle(20000);
  assert.equal(bot.battles.pop().outcome, 'lose');
  assert.equal(c.gold, 400);
  assert.ok(!c.flags.test_after_boss, '負けたら 物語は とまる');
  // 負けイベント
  FIXED_ENCOUNTERS.test_lose = { group: [['storm_general', 2, 2]], bg: 'plains', bgm: 'boss', canFlee: false, loseOk: true };
  try {
    c.gold = 800;
    const before = { map: bot.s.map, x: bot.s.x, y: bot.s.y };
    runSteps(world, bot.s, [['battle', 'test_lose'], ['flag', 'test_after_lose']]);
    await bot.settle(20000);
    const end = bot.battles.pop();
    assert.equal(end.outcome, 'lose');
    assert.equal(c.gold, 800, '負けイベントでは お金は へらない');
    assert.ok(!end.lines.some((l) => l.includes('所持金')));
    assert.ok(c.flags.test_after_lose, '物語が つづく');
    assert.deepEqual({ map: bot.s.map, x: bot.s.x, y: bot.s.y }, before, '教会へ もどされない');
    assert.ok(c.hp > 0);
  } finally {
    delete FIXED_ENCOUNTERS.test_lose;
  }
});

test('全滅: マルチプレイでは それぞれ 自分の 持っている お金が 半分に', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(3), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('x');
  await kid.login('x');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  const pc = world.data.characters[papa.char.id];
  const kc = world.data.characters[kid.char.id];
  pc.gold = 1000;
  kc.gold = 301;
  kc.bank = { gold: 50, items: [] };
  papa.s.x = kid.s.x = 60.5;
  papa.s.y = 60.5;
  kid.s.y = 61.5;
  kid.s.map = papa.s.map;
  const ms = world.mapStates.get(papa.s.map) || (world.tick(1), world.mapStates.get(papa.s.map));
  const sym = { id: 'wipe2', sp: 'storm_general', group: ['storm_general', 'storm_general'], table: 'plains', zone: 'plains', x: 60.5, y: 60.5, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  startFieldBattle(world, papa.s, sym);
  assert.ok(kid.inBattle, 'ユイも いっしょに たたかう');
  for (let i = 0; i < 3000 && (papa.inBattle || kid.inBattle); i++) {
    papa.flushQueue();
    kid.flushQueue();
    world.tick(50);
    await new Promise((r) => setImmediate(r));
  }
  assert.equal(papa.battles.pop().outcome, 'lose');
  assert.equal(pc.gold, 500);
  assert.equal(kc.gold, 150);
  assert.equal(kc.bank.gold, 50);
});

// ───────────── 作る ─────────────
test('ふしぎなかじ: レシピは ランク2〜5・店では 売っていない・物語で ふえる', () => {
  const ranks = new Set();
  const shopAll = new Set(Object.values(SHOPS).flatMap((sh) => shopItems(sh, () => true)));
  for (const r of RECIPES) {
    const it = ITEMS[r.id];
    assert.ok(it, r.id);
    assert.ok(SLOTS.includes(it.type), `${r.id} は 装備`);
    assert.ok(it.rank >= 2 && it.rank <= 5, `${r.id} の ランク`);
    assert.ok(!(it.price > 0) && !shopAll.has(r.id), `${r.id} は 店で 売っていない`);
    assert.ok(r.gold > 0 && r.mats.length, r.id);
    for (const [m, n] of r.mats) assert.ok(ITEMS[m] && n > 0, `${r.id}: ${m}`);
    // 作って すぐ 売っても もうからない
    const cost = r.gold + r.mats.reduce((a, [m, n]) => a + sellPrice(m) * n, 0);
    assert.ok(sellPrice(r.id) < cost, `${r.id}: 売り値 ${sellPrice(r.id)} < ${cost}`);
    ranks.add(it.rank);
  }
  assert.deepEqual([...ranks].sort(), [2, 3, 4, 5]);
  assert.ok(RECIPES.filter((r) => ITEMS[r.id].type === 'acc').length >= 2, 'アクセサリーも 作れる');
  assert.ok(RECIPES.length >= 10);
  const open = (flags) => RECIPES.filter((r) => recipeOpen(r, (f) => flags.includes(f))).map((r) => ITEMS[r.id].rank);
  assert.ok(open([]).every((rk) => rk === 2));
  assert.ok(open(['c1_treant']).includes(3) && !open(['c1_treant']).includes(4));
  assert.ok(open(['c1_treant', 'c2_port', 'c2_clear']).includes(5));
  assert.deepEqual(Object.keys(RECIPE_OPEN).map(Number), [2, 3, 4, 5]);
});

test('ふしぎなかじ: 作ると 素材と ゴールドが へり、装備が ふくろに 入る（すぐに 装備も できる）', async () => {
  const { bot, c } = await solo('monk');
  c.gold = 1000;
  c.items = [{ id: 'beast_fang', n: 7 }];
  // 素材が たりない
  let r = svc(bot, { kind: 'forge', action: 'craft', id: 'fang_spear' });
  assert.equal(r.ok, false);
  assert.match(r.text, /鉄のかけらがあと1個/);
  // まだ 作れない レシピ（ランク3）
  addItem(c, 'iron_shard', 5);
  addItem(c, 'magic_powder', 3);
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'flame_sword' });
  assert.equal(r.ok, false, 'ランク3は 森の主を 助けてから');
  assert.equal(c.gold, 1000);
  // 作る
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'wolf_claw' });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /ウルフクローが完成した/);
  assert.equal(c.gold, 850);
  assert.equal(itemCount(c, 'beast_fang'), 2);
  assert.equal(itemCount(c, 'wolf_claw'), 1);
  // 作って すぐ 装備（武闘家は ツメが 使える）
  c.items.find((e) => e.id === 'beast_fang').n = 5;
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'wolf_claw', who: 'self' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.equip.weapon, 'wolf_claw');
  assert.equal(itemCount(c, 'wolf_claw'), 1, '1つは 装備・1つは ふくろ');
  // 装備できない 人
  addItem(c, 'beast_fang', 4);
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'fang_spear', who: 'self' });
  assert.equal(r.ok, false, '武闘家は やりを 装備できない');
  assert.equal(itemCount(c, 'fang_spear'), 0, 'なにも へらない');
  // ゴールドが たりない
  c.gold = 10;
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'fang_spear' });
  assert.equal(r.ok, false);
  assert.equal(itemCount(c, 'beast_fang'), 4);
  // 物語が すすむと 作れる
  c.flags.c1_treant = true;
  c.gold = 1000;
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'flame_sword' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, 'iron_shard'), 0);
});

// ───────────── きたえる ─────────────
test('きたえる: +1〜+3 で 攻撃力（守備力）が もとの 1わりずつ・ボーナスも 少し', () => {
  assert.equal(ITEMS['iron_sword+1'].atk, 22);
  assert.equal(ITEMS['iron_sword+2'].atk, 24);
  assert.equal(ITEMS['iron_sword+3'].atk, 26);
  assert.equal(ITEMS['iron_sword+2'].name, '鉄の剣+2');
  assert.equal(ITEMS['wood_sword+3'].atk, 9, '小さい ものも 1ずつ');
  assert.equal(ITEMS['iron_armor+3'].def, 23 + 2 * 3);
  assert.equal(ITEMS['leather_hat+1'].def, 3);
  assert.equal(ITEMS['wizard_staff+3'].bonus.mag, 13);
  assert.equal(ITEMS['iron_axe+2'].bonus.agi, -3);
  assert.equal(ITEMS['iron_axe+3'].bonus.agi, -2, '+3 で 少し 軽く');
  assert.equal(ITEMS['power_ring+1'], undefined, 'アクセサリーは きたえられない');
  assert.equal(ITEMS['herb+1'], undefined);
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    // ランクで きまる 回数まで（むかしの セーブの ため +3 までは どれにも ある）
    const top = UPGRADE_TYPES.includes(it.type) ? Math.max(3, maxPlus(id)) : UPGRADE_MAX;
    if (UPGRADE_TYPES.includes(it.type)) assert.equal(ITEMS[upgradeId(id, top + 1)], undefined, `${id}+${top + 1} は ない`);
    for (let n = 1; n <= top; n++) {
      const up = ITEMS[upgradeId(id, n)];
      if (!UPGRADE_TYPES.includes(it.type)) { assert.equal(up, undefined); continue; }
      assert.ok(up, `${id}+${n}`);
      assert.equal(up.base, id);
      assert.equal(up.plus, n);
      assert.equal(up.rank, it.rank, 'ランクは おなじ');
      assert.equal(baseItemId(upgradeId(id, n)), id);
      const key = it.type === 'weapon' ? 'atk' : 'def';
      const step = up[key] - (ITEMS[upgradeId(id, n - 1)][key] || 0);
      assert.ok(step >= 1 && step <= Math.max(1, Math.ceil((it[key] || 0) * 0.1)), `${id}+${n}: ${key} +${step}`);
      assert.ok(!(up.price > 0), 'きたえた 装備は 店で 売らない');
      assert.ok(!/[一-龯]/.test(itemKana(upgradeId(id, n))), '読みがな');
    }
  }
});

test('きたえる: きたえられる 回数は ランクで きまる（ランク1 +1・2 +2・3〜4 +3・5〜6 +4・7〜 +5）', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((r) => upgradeLimit({ rank: r })), [1, 2, 3, 3, 4, 4, 5, 5, 5, 5]);
  assert.equal(UPGRADE_MAX, 5);
  assert.equal(upgradeLimit({}), 1, 'ランクが ない 物は ランク1');
  assert.ok(UPGRADE_BY_RANK.every((v, i) => !i || v >= UPGRADE_BY_RANK[i - 1]), 'ランクが 高いほど 多い');
  // 木の剣（ランク1）は +1 まで
  assert.equal(ITEMS.wood_sword.rank, 1);
  assert.equal(maxPlus('wood_sword'), 1);
  assert.ok(canUpgrade('wood_sword'));
  assert.ok(!canUpgrade('wood_sword+1'), '+1 で おしまい');
  assert.equal(upgradeCost('wood_sword+1'), null);
  // むかしの セーブで +3 に して あった 木の剣も きえない（使えるが、これ以上は きたえられない）
  assert.equal(ITEMS['wood_sword+3'].atk, 9);
  assert.ok(!canUpgrade('wood_sword+2') && !canUpgrade('wood_sword+3'));
  // 鉄（ランク3）は +3、はがね（ランク5）は +4
  assert.equal(maxPlus('iron_sword'), 3);
  assert.equal(maxPlus('iron_sword+2'), 3, 'きたえた 物は もとの ランクで');
  const r5 = Object.keys(ITEMS).find((id) => ITEMS[id].type === 'weapon' && ITEMS[id].rank === 5 && !ITEMS[id].base);
  assert.equal(maxPlus(r5), 4);
  assert.ok(ITEMS[upgradeId(r5, 4)], `${r5}+4`);
  assert.equal(ITEMS[upgradeId(r5, 5)], undefined);
  const c4 = upgradeCost(upgradeId(r5, 3));
  assert.equal(c4.to, upgradeId(r5, 4));
  assert.ok(c4.gold > upgradeCost(upgradeId(r5, 2)).gold, '+4 は もっと 高い');
  assert.deepEqual(c4.mats.find(([m]) => m === 'star_shard'), ['star_shard', 3], '+4 には 星のかけら 3個（ランク4から 1個 ふえる）');
  assert.equal(upgradeCost(upgradeId(r5, 4)), null, '+4 で おしまい');
  // ランク7の 物が あれば +5 まで
  const r7 = { name: 'テストの剣', type: 'weapon', rank: 7, cat: 'sword', atk: 61, price: 9000 };
  assert.equal(upgradeLimit(r7), 5);
  // アクセサリーは 0
  assert.equal(maxPlus('power_ring'), 0);
});

test('きたえる: 素材と ゴールドは 回数が すすむほど ふえる・+3 には 星のかけら・売っても もうからない', () => {
  const c1 = upgradeCost('iron_sword');
  const c2 = upgradeCost('iron_sword+1');
  const c3 = upgradeCost('iron_sword+2');
  assert.equal(upgradeCost('iron_sword+3'), null, '+3 で おしまい');
  assert.equal(c1.to, 'iron_sword+1');
  assert.equal(c3.to, 'iron_sword+3');
  assert.ok(c1.gold < c2.gold && c2.gold < c3.gold, `${c1.gold} < ${c2.gold} < ${c3.gold}`);
  assert.deepEqual(c1.mats, [['iron_shard', 2]]);
  assert.deepEqual(c2.mats, [['iron_shard', 3]]);
  assert.deepEqual(c3.mats, [['iron_shard', 4], ['star_shard', 1]]);
  assert.equal(upgradeCost('wizard_staff').mats[0][0], 'magic_powder', 'つえは 魔法の粉');
  assert.equal(upgradeCost('feather_fan').mats[0][0], 'wind_feather', 'おうぎは 風の羽');
  assert.ok(upgradeCost('silver_sword+1').mats.some(([m]) => m === 'silver_shard'), 'ランク4からは 銀のかけらも');
  assert.equal(upgradeCost('power_ring'), null);
  // どの 装備でも: きたえて 売っても かかった ぶんより 高く ならない
  for (const id of Object.keys(ITEMS)) {
    if (!canUpgrade(id)) continue;
    const cost = upgradeCost(id);
    const spent = cost.gold + cost.mats.reduce((a, [m, n]) => a + sellPrice(m) * n, 0);
    assert.ok(sellPrice(cost.to) - sellPrice(id) < spent, `${id}: 売り値 ${sellPrice(id)}→${sellPrice(cost.to)} / ${spent}`);
    const prev = upgradeCost(cost.to);
    if (prev) assert.ok(prev.gold >= cost.gold, `${cost.to}: ゴールドは へらない`);
  }
});

test('きたえる: ふくろの 装備・装備している 装備を きたえる', async () => {
  const { bot, c } = await solo('warrior');
  c.gold = 5000;
  c.items = [{ id: 'iron_sword', n: 2 }, { id: 'iron_shard', n: 20 }, { id: 'star_shard', n: 1 }];
  // ふくろの 1本を +1 に
  let r = svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword' });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /鉄の剣は、鉄の剣\+1になった/);
  assert.equal(itemCount(c, 'iron_sword'), 1);
  assert.equal(itemCount(c, 'iron_sword+1'), 1);
  assert.equal(itemCount(c, 'iron_shard'), 18);
  assert.equal(c.gold, 5000 - upgradeCost('iron_sword').gold);
  // 装備している 物を +1 → +2 → +3
  c.equip.weapon = 'iron_sword+1';
  removeOne(c, 'iron_sword+1');
  const atk0 = computeStats(c).atk;
  r = svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword+1', who: 'self' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.equip.weapon, 'iron_sword+2');
  assert.equal(computeStats(c).atk, atk0 + 2);
  // 持っていない・装備していない
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword+1', who: 'self' }).ok, false);
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'katana' }).ok, false);
  // +3 には 星のかけら
  c.items = c.items.filter((e) => e.id !== 'star_shard');
  r = svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword+2', who: 'self' });
  assert.equal(r.ok, false);
  assert.match(r.text, /星のかけら/);
  addItem(c, 'star_shard', 1);
  r = svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword+2', who: 'self' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.equip.weapon, 'iron_sword+3');
  assert.equal(computeStats(c).atk, atk0 + 4);
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'iron_sword+3', who: 'self' }).ok, false, '+3 で おしまい');
  // アクセサリーは きたえられない
  addItem(c, 'power_ring', 1);
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'power_ring' }).ok, false);
  assert.ok(lackOf(c, upgradeCost('iron_sword')).ok);
});

function removeOne(c, id) {
  const e = c.items.find((x) => x.id === id);
  e.n -= 1;
  if (!e.n) c.items = c.items.filter((x) => x !== e);
}

test('きたえた 装備: もとの 装備の 項目を ぜんぶ もつ（だれが 装備できるかも もとと おなじ）', () => {
  const people = [
    ...['warrior', 'monk', 'priest', 'mage', 'performer', 'railman', 'ballplayer', 'hero'].map((job) => ({ job, jobs: {} })),
    { species: 'pururin' }, { species: 'golem' },
  ];
  const keep = ['type', 'cat', 'armorType', 'helm', 'rank', 'star', 'forge', 'onHit', 'resist', 'upMat', 'unique'];
  for (const [uid, up] of Object.entries(ITEMS)) {
    if (!up.base) continue;
    const base = ITEMS[up.base];
    for (const k of keep) assert.deepEqual(up[k], base[k], `${uid}.${k}`);
    for (const p of people) assert.equal(canEquipChar(p, uid), canEquipChar(p, up.base), `${uid}: ${p.job || p.species}`);
  }
  // 仲間の まものが 装備した ときも 強さが 計算できる
  const mon = { species: 'golem', level: 10, equip: { weapon: 'iron_sword+3', armor: null, shield: null, head: null, acc: null }, seeds: {} };
  const a = computeStats(mon).atk;
  mon.equip.weapon = 'iron_sword';
  assert.equal(a - computeStats(mon).atk, 6);
});

test('きたえた 装備: 装備・はずす・売る・職業・セーブ・ならべかえ', async () => {
  const { bot, c } = await solo('warrior');
  c.items = [{ id: 'iron_sword+2', n: 1 }, { id: 'iron_armor+1', n: 1 }];
  const before = computeStats(c);
  bot.send({ t: 'menu', action: 'equip', id: 'iron_sword+2' });
  assert.equal(c.equip.weapon, 'iron_sword+2');
  assert.equal(itemCount(c, 'wood_sword'), 1, 'まえの 武器は ふくろへ');
  assert.equal(computeStats(c).atk, before.atk - ITEMS.wood_sword.atk + 24);
  bot.send({ t: 'menu', action: 'equip', id: 'iron_armor+1' });
  assert.equal(c.equip.armor, 'iron_armor+1');
  bot.send({ t: 'menu', action: 'unequip', slot: 'weapon' });
  assert.equal(c.equip.weapon, null);
  assert.equal(itemCount(c, 'iron_sword+2'), 1);
  // 職業: もとの 装備と おなじ
  assert.ok(canEquip('warrior', 'iron_sword+2'));
  assert.ok(!canEquip('mage', 'iron_sword+2'));
  assert.ok(!canEquip('mage', 'iron_armor+3'));
  assert.ok(canEquipChar(c, 'iron_helm+1'));
  // 売る（ねだんは もとより 高い）
  assert.ok(sellPrice('iron_sword+2') > sellPrice('iron_sword'));
  const g = c.gold;
  const r = svc(bot, { kind: 'shop', action: 'sell', id: 'iron_sword+2', qty: 1 });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.gold, g + sellPrice('iron_sword+2'));
  assert.equal(itemCount(c, 'iron_sword+2'), 0);
  // セーブを 読みなおしても そのまま
  c.items.push({ id: 'katana+3', n: 1 });
  const up = upgradeSave({ version: 4, characters: { [c.id]: JSON.parse(JSON.stringify(c)) } }).data.characters[c.id];
  assert.equal(up.equip.armor, 'iron_armor+1');
  assert.equal(itemCount(up, 'katana+3'), 1);
  assert.ok(!up.stash, 'しまわれない');
  // ならべかえ: もとの 装備の すぐ うしろ
  assert.deepEqual(sortItemIds(['katana', 'iron_sword+1', 'herb', 'iron_sword'], 'type'), ['herb', 'iron_sword', 'iron_sword+1', 'katana']);
  assert.equal(itemKana('iron_sword+1'), 'てつのけん+1');
});

// ───────────── 素材 ─────────────
test('素材: 魔物が 落とす・売れる・図鑑に のる・1体から 1つまで', () => {
  const mats = Object.entries(ITEMS).filter(([, it]) => it.type === 'mat');
  assert.ok(mats.length >= 5);
  for (const [id, it] of mats) {
    assert.ok(sellPrice(id) > 0, `${id} は 売れる`);
    assert.ok(!(it.price > 0), `${id} は 店で 売らない`);
    assert.ok(!/[一-龯]/.test(itemKana(id)), `${id} の 読み`);
    assert.ok(Object.values(MAT_DROPS).some(([m]) => m === id), `${id} を 落とす 魔物が いる`);
  }
  for (const [sp, [m, n]] of Object.entries(MAT_DROPS)) {
    assert.ok(MONSTERS[sp], sp);
    assert.equal(ITEMS[m]?.type, 'mat', `${sp}: ${m}`);
    assert.ok(n >= 2 && n <= 16);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'mat' && d.item === m), '図鑑に のる');
    // もとの 落とす 物は そのまま
    const d = MONSTERS[sp].drops;
    if (d.common) assert.ok(monsterDrops(sp).some((x) => x.kind === 'common'));
    if (d.rare) assert.ok(monsterDrops(sp).some((x) => x.kind === 'rare'));
  }
  const rng = makeRng(7);
  let fang = 0;
  for (let i = 0; i < 6000; i++) {
    const got = rollDrops('wolf', rng);
    assert.ok(got.length <= 1);
    if (got[0] === 'beast_fang') fang++;
  }
  assert.ok(fang > 6000 * 0.12 && fang < 6000 * 0.2, `キバ ${fang}`);
  // 宝箱にも ある
  const chests = Object.values(MAPS).flatMap((m) => m.chests);
  assert.ok(chests.filter((ch) => ITEMS[ch.item]?.type === 'mat').length >= 4);
});

// ───────────── 家族の データを 合わせる・引っこし ─────────────
test('合わせる: 両方で 預けた お金と 道具が 足される', () => {
  const base = newCharacter({ id: 'hina', name: 'ヒナ', job: 'warrior' });
  base.bank = { gold: 100, items: [{ id: 'herb', n: 2 }] };
  const a = JSON.parse(JSON.stringify(base));
  const t = JSON.parse(JSON.stringify(base));
  a.bank.gold += 500; // こちらで 500 預けた
  a.bank.items.push({ id: 'iron_sword', n: 1 });
  t.bank.gold -= 40; // むこうで 40 引き出した
  t.bank.items[0].n = 5;
  t.bank.items.push({ id: 'beast_fang', n: 3 });
  t.lastPlayed = (a.lastPlayed || 0) + 1000;
  const m = mergeChars(base, a, t);
  assert.equal(m.bank.gold, 560);
  assert.equal(bankCount(m, 'herb'), 5);
  assert.equal(bankCount(m, 'iron_sword'), 1);
  assert.equal(bankCount(m, 'beast_fang'), 3);
  // 片方だけ 預かり所を つかった
  const b2 = newCharacter({ id: 'hina', name: 'ヒナ', job: 'warrior' });
  const a2 = JSON.parse(JSON.stringify(b2));
  const t2 = JSON.parse(JSON.stringify(b2));
  t2.bank = { gold: 300, items: [{ id: 'herb', n: 1 }] };
  const m2 = mergeChars(b2, a2, t2);
  assert.equal(m2.bank.gold, 300);
  assert.equal(bankCount(m2, 'herb'), 1);
  // きたえた 装備も 数える
  a2.items.push({ id: 'iron_sword+2', n: 1 });
  const m3 = mergeChars(b2, a2, t2);
  assert.equal(itemCount(m3, 'iron_sword+2'), 1);
});

test('引っこしコード・家族サーバーと スマホ: 預かり所も いっしょに', () => {
  const c = newCharacter({ id: 'sora', name: 'ソラ', job: 'warrior' });
  c.bank = { gold: 1234, items: [{ id: 'iron_sword+3', n: 1 }, { id: 'unknown_future_item', n: 2 }] };
  c.equip.weapon = 'iron_sword+2';
  const r = parseCode(exportCode(c));
  assert.equal(r.ok, true);
  assert.equal(r.char.bank.gold, 1234);
  assert.equal(bankCount(r.char, 'iron_sword+3'), 1);
  assert.equal(bankCount(r.char, 'unknown_future_item'), 2, '知らない 品物も けさない');
  assert.equal(r.char.equip.weapon, 'iron_sword+2');
  // 家族サーバー → スマホ → それぞれで 預けて 合わせる
  const server = new GameWorld({ offline: false, rng: makeRng(1), data: { version: 4, characters: { sora: JSON.parse(JSON.stringify(c)) } } });
  const phone = new GameWorld({ offline: true, rng: makeRng(2) });
  const out = buildSyncOut(server, { from: 'server' });
  applySyncIn(phone, out.data);
  phone.data.characters.sora.bank.gold += 100;
  phone.data.characters.sora.lastPlayed = Date.now() + 1000;
  server.data.characters.sora.bank.gold += 10;
  server.data.characters.sora.lastPlayed = Date.now() + 500;
  const back = buildSyncOut(phone, { from: 'site' });
  const res = applySyncIn(server, back.data);
  assert.equal(res[0].mode, 'merged');
  assert.equal(server.data.characters.sora.bank.gold, 1344);
  // むかしの セーブ（預かり所が ない）も 読める
  const old = newCharacter({ id: 'o', name: 'オト', job: 'mage' });
  const up = upgradeSave({ version: 4, characters: { o: old } }).data.characters.o;
  assert.equal(up.bank, undefined);
  const bad = upgradeSave({ version: 4, characters: { o: { ...old, bank: { gold: -5, items: [{ id: 'herb', n: 0 }, null, { id: 'herb', n: 3.7 }] } } } }).data.characters.o;
  assert.deepEqual(bad.bank, { gold: 0, items: [{ id: 'herb', n: 3 }] });
});

// ───────────── 町と 港 ─────────────
test('預かり所・かじ屋: ルミナの町と カモメ港に いて、話しかけると カウンターが ひらく', async () => {
  const ids = MAPS.overworld.npcs.map((n) => n.id).concat(MAPS.sea.npcs.map((n) => n.id));
  for (const id of ['town_banker', 'town_smith', 'port_banker', 'port_smith']) assert.ok(ids.includes(id), id);
  for (const n of [...MAPS.overworld.npcs, ...MAPS.sea.npcs]) assert.ok(SCRIPTS[n.script], n.script);
  const kinds = [...MAPS.overworld.boards, ...MAPS.sea.boards].map((b) => b.kind);
  assert.equal(kinds.filter((k) => k === 'bank').length, 2);
  assert.equal(kinds.filter((k) => k === 'smith').length, 2);
  const { world, bot } = await solo();
  const banker = MAPS.overworld.npcById.town_banker;
  world.placeSession(bot.s, 'overworld', banker.x + 0.5, banker.y + 2.5, 'up');
  bot.send({ t: 'interact', kind: 'npc', id: 'town_banker' });
  await new Promise((r) => setImmediate(r));
  const ui = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).find((st) => st[0] === 'ui');
  assert.ok(ui && ui[1] === 'bank', JSON.stringify(ui));
  assert.equal(ui[2].name, 'ルミナの預かり所');
  await bot.settle();
  const smith = MAPS.sea.npcById.port_smith;
  world.placeSession(bot.s, 'sea', smith.x + 0.5, smith.y + 2.5, 'up');
  bot.send({ t: 'interact', kind: 'npc', id: 'port_smith' });
  await new Promise((r) => setImmediate(r));
  const ui2 = bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui').pop();
  assert.equal(ui2[1], 'forge');
  assert.ok(ui2[2].recipes.includes('wolf_claw'));
  assert.ok(ui2[2].locked > 0, 'まだ ひみつの レシピ');
  await bot.settle();
});

test('レベルが 上がっても 装備で 強く なる: +3 は 1ランク上の 店の 品に 近い', () => {
  // 鉄の剣+3（26）は 銀の剣（30）より 弱く、刀（24）くらい
  assert.ok(ITEMS['iron_sword+3'].atk < ITEMS.silver_sword.atk);
  assert.ok(ITEMS['silver_sword+3'].atk < ITEMS.storm_sword.atk + 5);
  const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
  gainExp(c, expForLevel(10));
  c.equip.weapon = 'iron_sword';
  const a0 = computeStats(c).atk;
  c.equip.weapon = 'iron_sword+3';
  assert.equal(computeStats(c).atk - a0, 6);
});
