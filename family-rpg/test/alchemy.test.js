// 第32回 C: れん金がま・同じ 武具で きたえる 回数を ふやす・生まれ変わり・ボスの 品は かならず
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SLOTS, ITEM_KANA, baseItemId, sellPrice } from '../public/js/shared/data/items.js';
import { ALCHEMY_ITEMS, ALCHEMY_GEAR, REBORN_GEAR, REBIRTH, REBIRTH_START, ALCHEMY_POT, ALCHEMY_MEMO } from '../public/js/shared/data/items-alchemy.js';
import {
  RECIPES, RECIPE_BY_ID, STARTER_RECIPES, KEEPER_RECIPES, MERGE_RECIPE, CAP_UP_MAX, TIER_FLAG, POT_FLAG,
  matchPot, potSteps, knownRecipes, capUp, pickIngredients, recipeLack, learnableRecipes,
} from '../public/js/shared/data/alchemy.js';
import { upgradeLimit, upgradeId } from '../public/js/shared/data/items-forge.js';
import { maxPlus, forgeTop, canUpgrade, upgradeCost, rebirthOf } from '../public/js/shared/data/forge.js';
import { rareIds, rarityOf, starsOf, bossRareOf, BOSS_RARE_N, REGION_RARE_N, traitText } from '../public/js/shared/data/rare-loot.js';
import { RARE_GEAR } from '../public/js/shared/data/items-rare.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { rollDrops, monsterDrops } from '../public/js/shared/data/loot.js';
import { MAPS } from '../public/js/shared/maps/index.js';
import { T } from '../public/js/shared/tiles.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { alchemySteps, repairAlchemy, mergeAlchemy, alchemyMemoLoot, MEMO_CHEST_RATE } from '../public/js/shared/world/alchemy.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { newCharacter, itemCount, addItem, computeStats, gainExp, expForLevel, hasKeyItem } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

async function solo(seed = 32) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(20) - c.exp);
  c.hp = computeStats(c).maxHp;
  return { world, bot, c };
}
const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const svc = (bot, msg) => {
  bot.send({ t: 'svc', ...msg });
  return lastSvc(bot);
};
const givePot = (c) => {
  addItem(c, ALCHEMY_POT, 1);
  c.flags[POT_FLAG] = true;
};
const toasts = (bot) => bot.msgs.filter((m) => m.t === 'toast').map((m) => m.text);

// ───────────── データ ─────────────
test('れん金: レシピは 30〜50こ。材料と できる 物が あり、組み合わせは かぶらない。章ごとに ふえる', () => {
  assert.ok(RECIPES.length + 1 >= 30 && RECIPES.length + 1 <= 50, `${RECIPES.length + 1}こ`);
  const keys = new Set();
  for (const r of RECIPES) {
    assert.ok(ITEMS[r.out], `${r.id}: ${r.out}`);
    assert.ok(r.ins.length >= 2 && r.ins.length <= 3, r.id);
    for (const id of r.ins) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key' && !ITEMS[id].base, `${r.id}: ${id}`);
    const k = [...r.ins].sort().join('|');
    assert.ok(!keys.has(k), `${r.id}: 組み合わせが かぶる`);
    keys.add(k);
    assert.ok(TIER_FLAG[r.tier] !== undefined, r.id);
    // 同じ 武具 2つ（きたえる 回数）と まちがえない
    assert.ok(!(r.ins.length === 2 && r.ins[0] === r.ins[1] && ['weapon', 'armor', 'shield', 'head'].includes(ITEMS[r.ins[0]].type)), r.id);
  }
  for (let t = 1; t <= 5; t++) assert.ok(RECIPES.filter((r) => r.tier === t).length >= 2, `第${t}章`);
  for (const id of [...STARTER_RECIPES, ...Object.values(KEEPER_RECIPES).flat()]) assert.ok(RECIPE_BY_ID[id], id);
  // 作って 売っても あまり もうからない（材料の ねだんの 1.6倍＋20 まで。★装備と 星の鉄〈材料に 使う 品〉は のぞく）
  for (const r of RECIPES) {
    if (ITEMS[r.out].src === 'alchemy' || r.out === 'star_iron') continue;
    const cost = r.ins.reduce((a, id) => a + Math.max(sellPrice(id), ITEMS[id].price || 0), 0);
    assert.ok(sellPrice(r.out) <= cost * 1.6 + 20, `${r.id}: ${sellPrice(r.out)} / ${cost}`);
  }
});

test('れん金でしか 作れない ★装備: 10〜15こ（★2〜★4）。材料に その章の ボスの 品・地方の 品。ほかでは 手に入らない', () => {
  assert.ok(ALCHEMY_GEAR.length >= 10 && ALCHEMY_GEAR.length <= 15, `${ALCHEMY_GEAR.length}こ`);
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    assert.ok(!names.has(it.name), `名前が かぶる: ${it.name}`);
    names.set(it.name, id);
  }
  for (const id of [...ALCHEMY_GEAR, ...REBORN_GEAR]) {
    const it = ITEMS[id];
    assert.ok(it === ALCHEMY_ITEMS[id], id);
    assert.ok(it.rarity >= 2 && it.rarity <= 4 && rarityOf(id) === it.rarity, id);
    assert.ok(it.desc && ITEM_KANA[id] && it.sell > 0 && !(it.price > 0), id);
    assert.ok(['sword', 'axe', 'dagger', 'spear', 'claw', 'whip', 'staff', 'fan', 'boomerang', 'bat'].includes(it.cat) || it.type !== 'weapon', id);
    assert.ok(ITEMS[upgradeId(id, 1)], `${id}: きたえられる`);
  }
  for (const id of ALCHEMY_GEAR) {
    const rs = RECIPES.filter((r) => r.out === id);
    assert.equal(rs.length, 1, id);
    // 材料に ボスの 品か 地方の 品（★の 品）
    assert.ok(rs[0].ins.some((x) => ['boss', 'region'].includes(ITEMS[x].src)), `${id}: ${rs[0].ins}`);
    assert.ok(traitText(id), `${id}: とくせい`);
  }
  // 宝箱・ドロップ・ひみつのダンジョンの 品には ない
  for (const src of ['tm', 'boss', 'region', 'sd']) for (const id of rareIds(src)) assert.ok(!ALCHEMY_ITEMS[id], id);
  for (const id of Object.keys(SHOPS)) for (const it of shopItems(SHOPS[id], () => true)) assert.ok(!ALCHEMY_ITEMS[it], it);
  // 章が 進むほど 強い（武器の ランク）
  const rankOf = (tier) => Math.max(...RECIPES.filter((r) => r.tier === tier && ITEMS[r.out].src === 'alchemy').map((r) => ITEMS[r.out].rank));
  for (let t = 2; t <= 5; t++) assert.ok(rankOf(t) >= rankOf(t - 1), `第${t}章`);
});

test('ボスの 品: かならず 落とす。強さは その章の 店の いちばん よい 品と おなじ くらい ＋ とくせい 1つ（★2）', () => {
  assert.equal(BOSS_RARE_N, 1);
  assert.equal(REGION_RARE_N, 500);
  const shopBest = (it) => {
    const key = it.type === 'weapon' ? 'atk' : 'def';
    const same = Object.values(ITEMS).filter((x) => !x.base && x.price > 0 && x.type === it.type && x.rank === it.rank
      && (it.type !== 'weapon' || x.cat === it.cat) && (it.type !== 'armor' || x.armorType === it.armorType) && (it.type !== 'head' || !!x.helm === !!it.helm));
    return same.length ? Math.max(...same.map((x) => x[key] || 0)) : null;
  };
  const cats = (id) => {
    const it = ITEMS[id];
    const res = Object.keys(it.resist || {});
    return [res.some((k) => ['fire', 'ice', 'wind', 'bolt', 'dark', 'light', 'blast'].includes(k)), res.some((k) => ['sleep', 'paralyze', 'confuse', 'blind', 'poison', 'silence'].includes(k)), it.crit > 0, it.mpRegen > 0, !!it.onHit].filter(Boolean).length;
  };
  for (const id of rareIds('boss')) {
    const it = ITEMS[id];
    assert.equal(it.rarity, 2, id);
    assert.equal(cats(id), 1, `${id}: とくせいは 1つ（${traitText(id)}）`);
    const best = shopBest(it);
    const key = it.type === 'weapon' ? 'atk' : 'def';
    if (best) assert.ok(it[key] <= best * 1.05 + 1, `${id}: ${it[key]} / 店 ${best}`);
    // かならず 落とす
    const sp = it.boss;
    assert.ok(MONSTERS[sp], sp);
    const rng = makeRng(3);
    for (let i = 0; i < 20; i++) assert.ok(rollDrops(sp, rng).includes(id), `${sp}: ${id}`);
    assert.ok(monsterDrops(sp).some((d) => d.kind === 'brare' && d.rate === 1));
  }
  // 第1章の ボスの 品は 店の ランク3、第5章（アルゴス）は ランク7
  assert.equal(ITEMS[bossRareOf('goldoon')].rank, 3);
  assert.equal(ITEMS[bossRareOf('argos')].rank, 7);
});

test('同じ 武具を 2つ: きたえられる 回数が 1 ふえる（3回まで）。レア度は かわらない', () => {
  const c = newCharacter({ id: 'a', name: 'ソラ', job: 'warrior' });
  assert.equal(maxPlus('stardust_sword', c), 3);
  const m = matchPot(['stardust_sword+2', 'stardust_sword'], c);
  assert.ok(m.ok && m.merge === 'stardust_sword' && m.out === 'stardust_sword+2' && m.recipe === MERGE_RECIPE, JSON.stringify(m));
  assert.equal(m.steps, 40);
  assert.ok(!matchPot(['power_ring', 'power_ring'], c).ok, 'アクセサリーは できない');
  assert.ok(!matchPot(['stardust_sword', 'flame_sword'], c).ok);
  c.alchemy = { cap: { stardust_sword: 2 } };
  assert.equal(capUp(c, 'stardust_sword+1'), 2);
  assert.equal(maxPlus('stardust_sword', c), 5);
  assert.equal(maxPlus('stardust_sword', null), 3, 'ほかの 人は かわらない');
  assert.ok(canUpgrade('stardust_sword+3', c) && !canUpgrade('stardust_sword+3', null));
  assert.equal(upgradeCost('stardust_sword+4', c).to, 'stardust_sword+5');
  assert.equal(upgradeCost('stardust_sword+5', c), null);
  assert.equal(rarityOf('stardust_sword+5'), rarityOf('stardust_sword'));
  c.alchemy.cap.stardust_sword = CAP_UP_MAX;
  assert.equal(matchPot(['stardust_sword', 'stardust_sword'], c).why, 'capMax');
  assert.equal(maxPlus('stardust_sword', c), 3 + CAP_UP_MAX);
  // 第35回: 店で 買える 装備（★1）は きたえられない ので、2つ 合わせても ふえない（むかしの 記録が あっても 0）
  assert.equal(matchPot(['iron_sword+2', 'iron_sword'], c).why, 'shop');
  assert.equal(matchPot(['iron_sword', 'iron_sword'], c).ok, false);
  c.alchemy.cap.iron_sword = 2;
  assert.equal(maxPlus('iron_sword', c), 0);
  assert.equal(maxPlus('iron_sword+2', c), 0);
  assert.equal(upgradeCost('iron_sword+2', c), null);
});

test('第35回: 店の 品の 同じ 武具を 2つ 入れると「ふえない」と もどってくる', async () => {
  const { bot, c } = await solo();
  givePot(c);
  c.items = [{ id: 'iron_sword', n: 2 }];
  const r = svc(bot, { kind: 'alchemy', action: 'put', ids: ['iron_sword', 'iron_sword'] });
  assert.equal(r.ok, false);
  assert.match(r.text, /店の品（★1）なので/);
  assert.equal(itemCount(c, 'iron_sword'), 2, 'ふくろに もどる');
});

test('生まれ変わり（かくし要素）: 1だん目は れん金がまで「店の 武器＋素材＋星のかけら」。1だん目から 上限＋3 まで きたえて もう1回 → 2だん目', () => {
  // 第35回: 5つの 系統。1だん目は れん金（店の 品は きたえられない）
  assert.equal(REBIRTH_START.length, 5);
  assert.deepEqual(REBIRTH_START.map((x) => x.from).sort(), ['bronze_sword', 'oak_staff', 'wood_bat', 'wood_boomerang', 'wood_sword']);
  const c = newCharacter({ id: 'a', name: 'ソラ', job: 'warrior' });
  for (const x of REBIRTH_START) {
    assert.ok(ITEMS[x.from].price > 0 && rarityOf(x.from) === 0 && starsOf(x.from) === 1, `${x.from}: 店の 品（★1）`);
    assert.equal(maxPlus(x.from, null), 0, `${x.from}: きたえられない`);
    assert.equal(upgradeCost(x.from, null), null);
    assert.equal(ITEMS[x.to].src, 'reborn');
    assert.equal(ITEMS[x.to].cat, ITEMS[x.from].cat);
    assert.equal(starsOf(x.to), 2, `${x.to}: 1だん目は ★2`);
    const m = matchPot([x.from, x.mat, 'star_shard'], c);
    assert.ok(m.ok && m.out === x.to && m.recipe === x.id, JSON.stringify(m));
    // むかし きたえた 店の 武器（+1〜）も 入れられる
    assert.equal(matchPot([upgradeId(x.from, 2), x.mat, 'star_shard'], c).out, x.to);
    assert.ok(RECIPE_BY_ID[x.id].hidden, 'かくし要素');
    // 1だん目 → 2だん目
    assert.ok(REBIRTH[x.to], x.to);
  }
  // 本だな・メモ・親方では わからない
  const all = learnableRecipes({}, () => true);
  assert.ok(!all.some((r) => r.hidden));
  assert.equal(Object.keys(REBIRTH).length, 5);
  for (const [from, rb] of Object.entries(REBIRTH)) {
    const r = rebirthOf(from);
    assert.ok(r && ITEMS[rb.to] && ITEMS[rb.to].cat === ITEMS[from].cat, from);
    assert.equal(r.at, upgradeLimit(ITEMS[from]) + CAP_UP_MAX);
    assert.ok(ITEMS[upgradeId(from, r.at)], `${from}+${r.at}`);
    assert.ok(ITEMS[rb.to].atk > ITEMS[upgradeId(from, r.at)].atk, `${from}: 強く なる`);
    for (const [m] of rb.mats) assert.ok(ITEMS[m], m);
    assert.ok(starsOf(rb.to) > starsOf(from), '2だん目は ★が ふえる');
  }
  // あかがねの剣（ランク4・+3まで）は +6 まで きたえられ、+6 を きたえると 太陽の剣
  assert.equal(maxPlus('akagane_sword', null), 3, '説明には +3 まで（ひみつ）');
  assert.equal(forgeTop('akagane_sword', null), 6);
  const c4 = upgradeCost('akagane_sword+3', null);
  assert.ok(c4 && c4.to === 'akagane_sword+4' && c4.over && !c4.reborn);
  assert.equal(upgradeCost('akagane_sword+6', null).to, 'sun_sword');
  assert.ok(upgradeCost('akagane_sword+6', null).reborn);
  assert.equal(upgradeCost('sun_sword+5', null), null, '2だんめで おしまい');
  // 店の 武器は もう 生まれ変わらない（むかしの とちゅうの +5 も）
  assert.equal(rebirthOf('bronze_sword'), null);
  assert.equal(upgradeCost('bronze_sword+5', null), null);
  assert.equal(upgradeCost('iron_sword+3', null), null);
});

test('生まれ変わり: れん金がまで 1だん目 → かじ屋で きたえると「〇〇は△△に生まれ変わった！」（装備していても）', async () => {
  const { world, bot, c } = await solo();
  givePot(c);
  c.gold = 99999;
  c.items = [{ id: 'bronze_sword+2', n: 1 }, { id: 'iron_shard', n: 99 }, { id: 'star_shard', n: 40 }, { id: 'silver_shard', n: 30 }, { id: 'star_iron', n: 1 }, { id: 'flame_stone', n: 3 }];
  // かじ屋では きたえられない（店の 品）
  const no = svc(bot, { kind: 'forge', action: 'upgrade', id: 'bronze_sword+2' });
  assert.equal(no.ok, false);
  assert.match(no.text, /店の品（★1）は、きたえられない/);
  // れん金がま（知らない レシピ → 当たり）
  const put = svc(bot, { kind: 'alchemy', action: 'put', ids: ['bronze_sword+2', 'silver_shard', 'star_shard'] });
  assert.equal(put.ok, true, put.text);
  assert.match(put.text, /うまくいきそうだ/);
  alchemySteps(world, bot.s, 99);
  assert.equal(itemCount(c, 'akagane_sword'), 1);
  assert.ok(knownRecipes(c).includes('r_reborn_sword'));
  let id = 'akagane_sword';
  for (let n = 1; n <= 6; n++) {
    const r = svc(bot, { kind: 'forge', action: 'upgrade', id });
    assert.equal(r.ok, true, r.text);
    id = r.upgraded;
  }
  assert.equal(id, 'akagane_sword+6');
  c.equip.weapon = id;
  c.items = c.items.filter((e) => e.id !== id);
  const r = svc(bot, { kind: 'forge', action: 'upgrade', id, who: 'self' });
  assert.equal(r.ok, true, r.text);
  assert.equal(r.reborn, true);
  assert.match(r.text, /あかがねの剣\+6は、太陽の剣に生まれ変わった！/);
  assert.equal(c.equip.weapon, 'sun_sword');
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'sun_sword', who: 'self' }).ok, true, 'また きたえられる');
});

// ───────────── かま ─────────────
test('れん金がま: カモメ港に 着いたら かじ屋で もらえる。もう 持っていれば 親方が レシピを 1つ 教えて くれる', async () => {
  const { world, bot, c } = await solo();
  const open = async () => {
    const smith = MAPS.sea.npcById.port_smith;
    world.placeSession(bot.s, 'sea', smith.x + 0.5, smith.y + 2.5, 'up');
    bot.send({ t: 'interact', kind: 'npc', id: 'port_smith' });
    await new Promise((r) => setImmediate(r));
    return bot.msgs.filter((m) => m.t === 'script').flatMap((m) => m.steps).filter((st) => st[0] === 'ui').pop()[2];
  };
  let ui = await open();
  assert.ok(!ui.gift && !hasKeyItem(c, ALCHEMY_POT), 'カモメ港に 着く 前は もらえない');
  await bot.settle();
  c.flags[POT_FLAG] = true;
  ui = await open();
  assert.match(ui.gift, /れん金がま/);
  assert.ok(hasKeyItem(c, ALCHEMY_POT));
  assert.deepEqual(knownRecipes(c).sort(), [...STARTER_RECIPES].sort());
  await bot.settle();
  ui = await open();
  assert.ok(!ui.gift);
  assert.match(ui.tip, /れん金のコツ/);
  assert.equal(knownRecipes(c).length, STARTER_RECIPES.length + 1);
  assert.ok(KEEPER_RECIPES.port.includes(knownRecipes(c).at(-1)));
  await bot.settle();
});

test('れん金がま: 入れる → 歩くと 完成（知らせ・ふくろ）。知らない 組み合わせは 当たれば 新しい レシピ。はずれは 入れられない', async () => {
  const { world, bot, c } = await solo();
  assert.equal(svc(bot, { kind: 'alchemy', action: 'status' }).ok, false, 'かまが ない');
  givePot(c);
  c.items = [{ id: 'herb', n: 5 }, { id: 'antidote', n: 2 }, { id: 'iron_shard', n: 3 }, { id: 'jelly', n: 1 }];
  // はずれ（入れた 物は もどる）
  let r = svc(bot, { kind: 'alchemy', action: 'put', ids: ['herb', 'iron_shard'] });
  assert.equal(r.ok, false);
  assert.match(r.text, /うまくいきそうにない/);
  assert.equal(itemCount(c, 'herb'), 5);
  assert.equal(svc(bot, { kind: 'alchemy', action: 'put', ids: ['herb'] }).ok, false, '1つでは だめ');
  assert.equal(svc(bot, { kind: 'alchemy', action: 'put', ids: ['herb', 'herb', 'herb', 'herb'] }).ok, false, '4つは だめ');
  assert.equal(svc(bot, { kind: 'alchemy', action: 'put', ids: ['jelly', 'jelly'] }).ok, false, '持っていない 数');
  // 知らない レシピ（毒消し草×2 → 満月草）
  assert.ok(!knownRecipes(c).includes('r_moonherb'));
  r = svc(bot, { kind: 'alchemy', action: 'put', ids: ['antidote', 'antidote'] });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /うまくいきそうだ/);
  assert.equal(r.pot.known, false);
  assert.equal(itemCount(c, 'antidote'), 0);
  assert.equal(c.alchemy.pot.left, potSteps('moonherb'));
  assert.equal(svc(bot, { kind: 'alchemy', action: 'put', ids: ['herb', 'herb'] }).ok, false, '1回ずつ');
  // 歩く（空を 飛んでいる 間は 数えない）
  bot.s.flying = true;
  alchemySteps(world, bot.s, 10);
  assert.equal(c.alchemy.pot.left, 30);
  bot.s.flying = false;
  alchemySteps(world, bot.s, 29);
  assert.equal(itemCount(c, 'moonherb'), 0);
  assert.equal(svc(bot, { kind: 'alchemy', action: 'status' }).pot.left, 1);
  alchemySteps(world, bot.s, 1);
  assert.equal(itemCount(c, 'moonherb'), 1);
  assert.equal(c.alchemy.pot, undefined);
  assert.ok(knownRecipes(c).includes('r_moonherb'), '新しい レシピ');
  const t = toasts(bot).pop();
  assert.match(t, /満月草が完成した！/);
  assert.match(t, /新しいレシピを覚えた/);
});

test('れん金がま: レシピの 材料・同じ 武具・サーバーの 移動で 数える', async () => {
  const { world, bot, c } = await solo();
  givePot(c);
  c.alchemy = { known: ['r_jou_herb'] };
  c.items = [{ id: 'herb', n: 1 }, { id: 'stardust_sword+2', n: 1 }, { id: 'stardust_sword', n: 1 }];
  assert.deepEqual(recipeLack(c, 'r_jou_herb'), [{ id: 'herb', need: 2, have: 1 }]);
  addItem(c, 'herb', 1);
  assert.deepEqual(pickIngredients(c, 'r_jou_herb'), ['herb', 'herb']);
  // 同じ 武具: きたえた 回数が 多い ほうが のこる
  const r = svc(bot, { kind: 'alchemy', action: 'put', ids: ['stardust_sword+2', 'stardust_sword'] });
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /星くずの剣のきたえられる回数がふえる/);
  // サーバーの 移動で 数える（マスが かわった ときだけ）
  const s = bot.s;
  const left = c.alchemy.pot.left;
  const field = MAPS.overworld;
  let x = Math.floor(s.x), y = Math.floor(s.y);
  world.placeSession(s, 'overworld', x + 0.5, y + 0.5, 'down');
  let moved = 0;
  for (let i = 0; i < 6; i++) {
    const nx = x + (i % 2 ? -1 : 1);
    if (field.tiles[y * field.w + nx] === undefined) break;
    bot.send({ t: 'move', x: nx + 0.5, y: y + 0.5, dir: 'right', moving: true, seq: s.posSeq });
    if (Math.floor(s.x) === nx) { moved++; x = nx; }
  }
  assert.ok(moved > 0, 'マスを うごいた');
  assert.equal(c.alchemy.pot.left, left - moved);
  alchemySteps(world, s, 99);
  assert.equal(c.alchemy.cap.stardust_sword, 1);
  assert.equal(itemCount(c, 'stardust_sword+2'), 1);
  assert.equal(itemCount(c, 'stardust_sword'), 0);
  assert.match(toasts(bot).pop(), /きたえられる回数が1ふえた/);
  assert.equal(maxPlus('stardust_sword', c), 4);
  // かじ屋で +4 まで
  c.gold = 99999;
  c.items.push({ id: 'iron_shard', n: 50 }, { id: 'star_shard', n: 20 });
  let f = svc(bot, { kind: 'forge', action: 'upgrade', id: 'stardust_sword+2' });
  assert.equal(f.ok, true, f.text);
  f = svc(bot, { kind: 'forge', action: 'upgrade', id: 'stardust_sword+3' });
  assert.equal(f.ok, true, f.text);
  assert.equal(f.upgraded, 'stardust_sword+4');
  assert.equal(svc(bot, { kind: 'forge', action: 'upgrade', id: 'stardust_sword+4' }).ok, false);
});

test('レシピが わかる: 本だな（1つの 本だなで 1回）・れん金のメモ・フィールドの 宝箱の メモ', async () => {
  const { world, bot, c } = await solo();
  const s = bot.s;
  // 本だなの 場所
  const m = MAPS.overworld;
  let shelf = null;
  for (let i = 0; i < m.tiles.length && !shelf; i++) if (m.tiles[i] === T.BOOKSHELF) shelf = { x: i % m.w, y: Math.floor(i / m.w) };
  assert.ok(shelf);
  world.placeSession(s, 'overworld', shelf.x + 0.5, shelf.y + 1.5, 'up');
  const before = bot.msgs.length;
  world.searchTile(s, shelf.x, shelf.y, T.BOOKSHELF);
  await bot.settle();
  assert.ok(!bot.msgs.slice(before).some((x) => JSON.stringify(x).includes('れん金の本')), 'かまが ない 時は ふつうの 本だな');
  givePot(c);
  c.searched = {};
  const n0 = knownRecipes(c).length;
  world.searchTile(s, shelf.x, shelf.y, T.BOOKSHELF);
  await bot.settle();
  assert.ok(bot.msgs.some((x) => JSON.stringify(x).includes('れん金の本があった')));
  assert.equal(knownRecipes(c).length, n0 + 1);
  assert.equal(RECIPE_BY_ID[knownRecipes(c).at(-1)].tier, 1, 'はじめは 第1章の レシピ');
  world.searchTile(s, shelf.x, shelf.y, T.BOOKSHELF);
  await bot.settle();
  assert.equal(knownRecipes(c).length, n0 + 1, '同じ 本だなは 1回');
  // 第3章の レシピは 第3章に 入ってから
  assert.ok(!learnableRecipes(c, (f) => !!c.flags[f]).some((r) => r.tier >= 3));
  c.flags.c3_start = true;
  assert.ok(learnableRecipes(c, (f) => !!c.flags[f]).some((r) => r.tier === 3));
  // メモ
  addItem(c, ALCHEMY_MEMO, 2);
  const res = () => bot.msgs.filter((x) => x.t === 'menuRes').pop();
  bot.send({ t: 'menu', action: 'useItem', id: ALCHEMY_MEMO, ref: 'self' });
  assert.equal(res().ok, true, res().text);
  assert.match(res().text, /新しいレシピを覚えた/);
  assert.equal(itemCount(c, ALCHEMY_MEMO), 1);
  // わかる レシピが ない ときは へらない
  c.alchemy.known = RECIPES.map((r) => r.id);
  bot.send({ t: 'menu', action: 'useItem', id: ALCHEMY_MEMO, ref: 'self' });
  assert.equal(res().ok, false);
  assert.equal(itemCount(c, ALCHEMY_MEMO), 1);
  assert.equal(alchemyMemoLoot(c, makeRng(1)), null, 'もう わかる レシピが ない');
  c.alchemy.known = [];
  const rng = makeRng(5);
  let got = 0;
  for (let i = 0; i < 6000; i++) if (alchemyMemoLoot(c, rng)) got++;
  assert.ok(Math.abs(got / 6000 - MEMO_CHEST_RATE) < 0.02, `${got}`);
  assert.equal(alchemyMemoLoot(newCharacter({ id: 'z', name: 'ゼロ', job: 'mage' }), rng), null, 'かまが ない 人は 出ない');
});

// ───────────── セーブ ─────────────
test('セーブ: こわれた 形を なおす・もう たおした ボスの 品を わたす（1回だけ）・データ合わせ', () => {
  const c = newCharacter({ id: 'o', name: 'オト', job: 'mage' });
  c.kills = { goldoon: 1, giant_squid: 2, wolf: 30 };
  c.items.push({ id: 'kraken_whip', n: 1 });
  c.alchemy = { known: ['r_jou_herb', 'nope', 3, 'r_jou_herb'], shelves: 'x', cap: { iron_sword: 9, nope: 1, wood_sword: -1 }, pot: { out: 'nope', left: 3, recipe: 'r_jou_herb' } };
  const up = upgradeSave({ version: 4, characters: { o: c } }).data.characters.o;
  assert.deepEqual(up.alchemy.known, ['r_jou_herb']);
  assert.deepEqual(up.alchemy.shelves, []);
  assert.deepEqual(up.alchemy.cap, { iron_sword: CAP_UP_MAX });
  assert.equal(up.alchemy.pot, undefined);
  assert.equal(itemCount(up, 'goldoon_fist'), 1, 'たおした ボスの 品');
  assert.equal(itemCount(up, 'kraken_whip'), 1, 'もう 持っている 物は ふえない');
  assert.equal(up.bestiary.goldoon.drop_goldoon_fist, 1);
  const again = upgradeSave({ version: 4, characters: { o: up } }).data.characters.o;
  assert.equal(itemCount(again, 'goldoon_fist'), 1, '2回めは わたさない');
  // データ合わせ: レシピ・本だなは 両方、回数は 多い ほう
  const m = mergeAlchemy({ known: ['a'] }, { known: ['r_jou_herb'], cap: { iron_sword: 1 } }, { known: ['r_panacea'], cap: { iron_sword: 2 }, shelves: ['k'] }, true);
  assert.deepEqual(m.known.sort(), ['r_jou_herb', 'r_panacea']);
  assert.equal(m.cap.iron_sword, 2);
  assert.deepEqual(m.shelves, ['k']);
  const A = { ...newCharacter({ id: 'a', name: 'ア', job: 'mage' }), alchemy: { known: ['r_jou_herb'] }, savedAt: 1 };
  const B = { ...newCharacter({ id: 'a', name: 'ア', job: 'mage' }), alchemy: { known: ['r_panacea'] }, savedAt: 2 };
  const merged = mergeChars(newCharacter({ id: 'a', name: 'ア', job: 'mage' }), A, B);
  assert.deepEqual([...merged.alchemy.known].sort(), ['r_jou_herb', 'r_panacea']);
});

test('文字の きまり（れん金がま・生まれ変わり）', () => {
  for (const f of ['public/js/shared/data/items-alchemy.js', 'public/js/shared/data/alchemy.js', 'public/js/shared/world/alchemy.js', 'public/js/client/ui/alchemy.js', 'public/js/client/ui/forge.js']) {
    assert.deepEqual(checkFile(f), [], f);
  }
  for (const id of Object.keys(ALCHEMY_ITEMS)) assert.ok(!/ /.test(ITEMS[id].name + ITEMS[id].desc), id);
  assert.equal(baseItemId('akagane_sword+2'), 'akagane_sword');
  assert.ok(SLOTS.includes(ITEMS.dragon_slayer.type));
});
