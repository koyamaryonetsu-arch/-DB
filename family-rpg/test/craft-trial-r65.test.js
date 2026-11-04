// 第65回 D1: かじ屋の「作る」ランク6〜10・れん金の 第6章・第7章の レシピ・職業の 三の試練（docs/plan-ch7.md の 6）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, SLOTS, sellPrice, itemKana } from '../public/js/shared/data/items.js';
import { RECIPES as FORGE_RECIPES, RECIPE_OPEN, recipeOpen, openRecipes, maxPlus, upgradeCost } from '../public/js/shared/data/forge.js';
import { salvageOf } from '../public/js/shared/data/salvage.js';
import {
  RECIPES, RECIPE_BY_ID, TIER_FLAG, KEEPER_RECIPES, ALCHEMY_POT, learnableRecipes, matchPot, tierOpen, knownRecipes,
} from '../public/js/shared/data/alchemy.js';
import {
  ITEMS_CRAFT_R65, FORGE_R65_RECIPES, FORGE_R65_OPEN, FORGE_R65_C7, ALCH_R65_RECIPES, ALCH_R65_KEEPER, CRAFT_R65_KANA,
} from '../public/js/shared/data/items-craft-r65.js';
import { itemSources } from '../public/js/shared/item-sources.js';
import { SHOPS, shopItems } from '../public/js/shared/data/shops.js';
import { rareWhereText, traitText } from '../public/js/shared/data/rare-loot.js';
import { starsFor } from '../public/js/shared/data/items-rare.js';
import { alchemyShelf, useAlchemyMemo, forgePotGift } from '../public/js/shared/world/alchemy.js';
import { JOBS, JOB_TOP_LEVEL, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { TRIALS, trialState, jobTopCap, titleFor } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { NEWS } from '../public/js/shared/data/news.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { addItem, itemCount, gainExp, expForLevel, fullHeal, newCharacter } from '../public/js/shared/stats.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const GEAR = ['weapon', 'armor', 'shield', 'head'];
const mainKey = (it) => (it.type === 'weapon' ? 'atk' : 'def');
// 同じ 部位・ランク・しゅるい（武器の 種類・よろいの 種類・かぶとか ぼうしか）
const sameKind = (a, b) => a.type === b.type && a.rank === b.rank && (a.type !== 'weapon' || a.cat === b.cat)
  && (a.type !== 'armor' || a.armorType === b.armorType) && (a.type !== 'head' || !!a.helm === !!b.helm);
const pool = (it) => Object.values(ITEMS).filter((x) => x && !x.base && x !== it && sameKind(x, it));
const shopBest = (it) => Math.max(0, ...pool(it).filter((x) => x.price > 0 && !(x.rarity > 0)).map((x) => x[mainKey(it)] || 0));
const starBest = (it) => Math.max(0, ...pool(it).filter((x) => !(x.price > 0) && !x.forge && x.rarity >= 2).map((x) => x[mainKey(it)] || 0));

// ───────────── かじ屋の「作る」 ─────────────
test('かじ屋: ランク6〜10の レシピ。武器は いろいろな 種類・よろい・たて・頭。店では 売っていない', () => {
  const shopAll = new Set(Object.values(SHOPS).flatMap((sh) => shopItems(sh, () => true)));
  const byRank = new Map();
  for (const r of FORGE_R65_RECIPES) {
    assert.ok(FORGE_RECIPES.includes(r), `${r.id}: data/forge.js に 入っている`);
    const it = ITEMS[r.id];
    assert.ok(it && it === ITEMS_CRAFT_R65[r.id], r.id);
    assert.ok(GEAR.includes(it.type), `${r.id}: 武器・よろい・たて・頭`);
    assert.ok(it.forge && it.rarity === 1 && !(it.price > 0) && !shopAll.has(r.id), `${r.id}: 店では 売っていない`);
    assert.ok(it.rank >= 6 && it.rank <= 10, r.id);
    assert.equal(rareWhereText(r.id), 'ふしぎなかじで作る');
    assert.ok(it.desc && CRAFT_R65_KANA[r.id] && !/[一-龯]/.test(itemKana(r.id)), `${r.id}: せつめい・読み`);
    assert.ok(ITEMS[`${r.id}+1`], `${r.id}: きたえられる`);
    assert.equal(maxPlus(r.id, {}), it.rank >= 7 ? 5 : 4);
    assert.ok(upgradeCost(r.id, {}), r.id);
    if (!byRank.has(it.rank)) byRank.set(it.rank, []);
    byRank.get(it.rank).push(it);
  }
  assert.deepEqual([...byRank.keys()].sort((a, b) => a - b), [6, 7, 8, 9, 10]);
  for (const [rank, list] of byRank) assert.ok(list.length >= 4 && list.some((x) => x.type === 'weapon') && list.some((x) => x.type !== 'weapon'), `ランク${rank}`);
  const cats = new Set(FORGE_R65_RECIPES.map((r) => ITEMS[r.id]).filter((x) => x.type === 'weapon').map((x) => x.cat));
  assert.ok(cats.size >= 8, `武器の 種類 ${[...cats]}`);
  for (const t of ['armor', 'shield', 'head']) assert.ok(FORGE_R65_RECIPES.filter((r) => ITEMS[r.id].type === t).length >= 3, t);
  // ランク10は ★5（ほかの ★5 と おなじ 見え方）
  assert.equal(starsFor(ITEMS.f10k_river_sword), 5);
});

test('かじ屋: 強さは その ころの 店の 品より 少し 上・★の 品（宝箱・ボス）より 上には ならない', () => {
  for (const r of FORGE_R65_RECIPES) {
    const it = ITEMS[r.id];
    const v = it[mainKey(it)];
    const shop = shopBest(it);
    const star = starBest(it);
    assert.ok(shop > 0, `${r.id}: 同じ ランクの 店の 品が ある`);
    assert.ok(v >= shop && (v > shop || it.bonus || it.resist), `${r.id}: ${v} > 店 ${shop}（同じ ときは ボーナスか とくせい）`);
    assert.ok(v <= shop * 1.5, `${r.id}: ${v} は 店 ${shop} の 1.5倍 まで`);
    if (star) assert.ok(v <= star, `${r.id}: ${v} <= ★ ${star}`);
  }
  // 第7章の 品は 第6章の 品より 強い（同じ ランク10）
  assert.ok(ITEMS.f10k_river_sword.atk > ITEMS.f10_sand_dagger.atk / 0.72);
  assert.ok(ITEMS.f10k_river_sword.atk < ITEMS.c7t_temple_sword.atk, '神殿の 宝箱の 剣より 弱い');
});

test('かじ屋: 作って 売っても もうからない・分解は 素材の 半分まで・素材は 魔物が 落とす（入手先が わかる）', () => {
  for (const r of FORGE_R65_RECIPES) {
    const cost = r.gold + r.mats.reduce((a, [m, n]) => a + sellPrice(m) * n, 0);
    assert.ok(sellPrice(r.id) < cost, `${r.id}: 売り値 ${sellPrice(r.id)} < ${cost}`);
    assert.ok(sellPrice(r.id) < r.gold, `${r.id}: ゴールドだけでも 売り値より 高い`);
    const sv = salvageOf(r.id);
    assert.ok(sv && sv.length, r.id);
    for (const [m, n] of sv) {
      const used = r.mats.find(([x]) => x === m)?.[1] || 0;
      if (used) assert.ok(n <= Math.max(1, Math.floor(used / 2)), `${r.id}: ${m} ${n} > ${used}/2`);
    }
    for (const [m, n] of r.mats) {
      assert.ok(ITEMS[m] && n > 0, `${r.id}: ${m}`);
      const src = itemSources(m).filter((s) => s.kind === 'monster' && s.places.length);
      assert.ok(src.length, `${r.id}: ${m} を 落とす 魔物が いる`);
    }
  }
  // その ころの 新しい 素材を 使う（ランク8 雲のわた・大地のかけら / 9 大地の根・光石 / 10 時の砂・古い歯車）
  const uses = (rank, ids) => FORGE_R65_RECIPES.filter((r) => ITEMS[r.id].rank === rank).some((r) => r.mats.some(([m]) => ids.includes(m)));
  assert.ok(uses(6, ['flame_stone', 'ice_crystal']));
  assert.ok(uses(8, ['cloud_cotton', 'land_shard', 'star_sand']));
  assert.ok(uses(9, ['earth_root', 'earth_stone', 'shade_drop']));
  assert.ok(uses(10, ['p6_time_sand', 'p6_old_gear']));
});

test('かじ屋: 物語の しるしで 作れる ように なる（ランク6 第3章クリア 〜 第7章 カリム）', () => {
  assert.deepEqual(FORGE_R65_OPEN, { 6: 'c3_clear', 7: 'c4_duna', 8: 'c4_clear', 9: 'c5_castle', 10: 'c6_past' });
  for (const [rk, f] of Object.entries(FORGE_R65_OPEN)) assert.equal(RECIPE_OPEN[rk], f);
  const ids = (flags) => openRecipes((f) => flags.includes(f)).map((r) => r.id);
  const before = ['c1_treant', 'c2_port', 'c2_clear'];
  assert.ok(!ids(before).some((id) => ITEMS[id].rank >= 6));
  assert.ok(ids([...before, 'c3_clear']).includes('f6_flame_spear'));
  assert.ok(!ids([...before, 'c3_clear']).includes('f7_pearl_fan'));
  const ch6 = [...before, 'c3_clear', 'c4_duna', 'c4_clear', 'c5_castle', 'c6_past'];
  assert.ok(ids(ch6).includes('f10_sand_dagger'));
  assert.ok(!ids(ch6).some((id) => id.startsWith('f10k_')), '第7章の 品は まだ');
  const c7 = FORGE_R65_RECIPES.filter((r) => r.id.startsWith('f10k_'));
  assert.ok(c7.length >= 4 && c7.every((r) => r.open === FORGE_R65_C7));
  assert.ok(c7.every((r) => recipeOpen(r, (f) => f === 'c7_karim')));
});

async function solo(job = 'warrior', seed = 65) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  return { world, bot, c: world.data.characters[bot.char.id] };
}
const lastSvc = (bot) => bot.msgs.filter((m) => m.t === 'svcRes').pop();
const svc = (bot, msg) => {
  bot.send({ t: 'svc', ...msg });
  return lastSvc(bot);
};

test('かじ屋（サーバー）: 千年前の 里の あとで ランク10・カリムの あとで 第7章の 品が 作れる', async () => {
  const { bot, c } = await solo();
  c.gold = 60000;
  for (const [m, n] of [['p6_time_sand', 30], ['silver_shard', 20], ['iron_shard', 30], ['magic_water', 5], ['star_shard', 10]]) addItem(c, m, n);
  let r = svc(bot, { kind: 'forge', action: 'craft', id: 'f10_sand_dagger' });
  assert.equal(r.ok, false, 'まだ 作れない');
  c.flags.c6_past = true;
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'f10_sand_dagger' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, 'f10_sand_dagger'), 1);
  assert.equal(c.gold, 50000);
  assert.equal(itemCount(c, 'p6_time_sand'), 24);
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'f10k_lake_staff' });
  assert.equal(r.ok, false, '第7章の 品は カリムの あと');
  c.flags.c7_karim = true;
  r = svc(bot, { kind: 'forge', action: 'craft', id: 'f10k_lake_staff' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, 'f10k_lake_staff'), 1);
  assert.equal(itemCount(c, 'magic_water'), 3);
  assert.equal(itemCount(c, 'star_shard'), 7);
  // 分解（★5 でも 作った 品は 分解できる）
  r = svc(bot, { kind: 'forge', action: 'salvage', id: 'f10_sand_dagger' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, 'f10_sand_dagger'), 0);
});

// ───────────── れん金 ─────────────
test('れん金: 第6章（c6_start）・第7章（c7_start）の レシピ。組み合わせは かぶらない・作って 売っても もうからない', () => {
  assert.equal(TIER_FLAG[6], 'c6_start');
  assert.equal(TIER_FLAG[7], 'c7_start');
  for (const t of [6, 7]) {
    const list = RECIPES.filter((r) => r.tier === t);
    assert.ok(list.length >= 5 && list.length <= 8, `第${t}章 ${list.length}こ`);
    assert.ok(list.some((r) => ITEMS[r.out].type === 'use'), `第${t}章: よく効く 道具`);
    assert.ok(list.some((r) => ITEMS[r.out].type === 'acc'), `第${t}章: アクセサリー`);
    assert.ok(list.some((r) => GEAR.includes(ITEMS[r.out].type) && ITEMS[r.out].src === 'alchemy'), `第${t}章: れん金でしか 作れない ★装備`);
  }
  const keys = new Map(RECIPES.map((r) => [[...r.ins].sort().join('|'), r.id]));
  assert.equal(keys.size, RECIPES.length, '組み合わせは かぶらない');
  for (const r of ALCH_R65_RECIPES) {
    assert.equal(RECIPE_BY_ID[r.id], r);
    const out = ITEMS[r.out];
    assert.ok(out && out.desc && CRAFT_R65_KANA[r.out], r.out);
    assert.equal(matchPot(r.ins).recipe, r.id);
    for (const id of r.ins) assert.ok(ITEMS[id] && ITEMS[id].type !== 'key' && !ITEMS[id].base, `${r.id}: ${id}`);
    // 作って 売っても もうからない（★装備も。材料の ねだんの 1.6倍＋20 まで）
    const cost = r.ins.reduce((a, id) => a + Math.max(sellPrice(id), ITEMS[id].price || 0), 0);
    assert.ok(sellPrice(r.out) <= cost * 1.6 + 20, `${r.id}: ${sellPrice(r.out)} / ${cost}`);
    // 材料は 第6章・第7章で 手に入る（店か 魔物）
    for (const id of r.ins) assert.ok(itemSources(id).length || RECIPES.some((x) => x.out === id), `${r.id}: ${id} の 入手先（または れん金で 作れる）`);
  }
});

test('れん金: ★装備・アクセサリーは その章の 宝箱より 少し 弱い（とくせい つき）', () => {
  for (const r of ALCH_R65_RECIPES) {
    const it = ITEMS[r.out];
    if (it.type === 'use') {
      assert.ok(it.effect && (it.battle || it.field), r.out);
      continue;
    }
    assert.equal(it.src, 'alchemy');
    assert.equal(it.rarity, 4);
    assert.ok(traitText(r.out), `${r.out}: とくせい`);
    if (it.type === 'acc') continue;
    const best = Math.max(...Object.values(ITEMS).filter((x) => !x.base && sameKind(x, it) && ['c7', 'tokei', 'clear6', 'pastboss'].includes(x.src)).map((x) => x[mainKey(it)] || 0));
    assert.ok(it[mainKey(it)] < best, `${r.out}: ${it[mainKey(it)]} < ${best}`);
    assert.ok(it[mainKey(it)] > shopBest(it), `${r.out}: 店の 品より 強い`);
  }
});

test('れん金: 新しい 章の レシピは その章まで 進んだ 人だけ。本だな・メモ・親方で わかる（早い 章から）', () => {
  const c = newCharacter({ id: 'a1', name: 'ソラ', job: 'warrior', look: {} });
  c.keyItems = [ALCHEMY_POT];
  const flags = (c2) => (f) => !!c2.flags?.[f];
  c.flags = { c3_start: true, c4_start: true, c4_clear: true };
  assert.ok(!learnableRecipes(c, flags(c)).some((r) => r.tier >= 6), '第6章の 前は わからない');
  assert.ok(!tierOpen(6, flags(c)));
  c.flags.c6_start = true;
  assert.ok(tierOpen(6, flags(c)) && !tierOpen(7, flags(c)));
  assert.ok(learnableRecipes(c, flags(c)).some((r) => r.tier === 6));
  assert.ok(!learnableRecipes(c, flags(c)).some((r) => r.tier === 7));
  c.flags.c7_start = true;
  // 第5章までの レシピを ぜんぶ 知っている 人
  c.alchemy = { known: RECIPES.filter((r) => r.tier <= 5).map((r) => r.id) };
  const world = { rng: makeRng(3), sendSelf() {}, markDirty() {} };
  const s = { char: c };
  const steps = alchemyShelf(world, s, 'c7:1:1');
  assert.ok(steps, '本だなで わかる');
  const got = knownRecipes(c).at(-1);
  assert.equal(RECIPE_BY_ID[got].tier, 6, '早い 章（第6章）から');
  assert.equal(alchemyShelf(world, s, 'c7:1:1'), null, '同じ 本だなは 1回');
  // メモ
  addItem(c, 'alchemy_memo', 1);
  let res = null;
  useAlchemyMemo(world, s, 'alchemy_memo', (ok, text) => { res = { ok, text }; });
  assert.ok(res.ok, res.text);
  // 親方（ルミナの町）: 第6章・第7章の レシピも 教える
  for (const id of ALCH_R65_KEEPER) assert.ok(KEEPER_RECIPES.town.includes(id), id);
  c.alchemy.known = RECIPES.filter((r) => r.tier <= 5 || r.reborn).map((r) => r.id);
  const w2 = { ...world, rng: makeRng(4) };
  const tip = forgePotGift(w2, s, 'town');
  assert.ok(tip.tip && /れん金のコツ/.test(tip.tip), JSON.stringify(tip));
  assert.ok(ALCH_R65_KEEPER.includes(knownRecipes(c).at(-1)));
  // ぜんぶ 知ると もう わからない
  c.alchemy.known = RECIPES.map((r) => r.id);
  assert.equal(learnableRecipes(c, flags(c)).length, 0);
});

// ───────────── 三の試練 ─────────────
test('三の試練: Lv20 → 25・まぼろし Lv70・第6章クリアの あと。倍率は どの 職業にも ある', () => {
  assert.equal(JOB_TOP_LEVEL, 25);
  const T = TRIALS[2];
  assert.deepEqual([T.n, T.name, T.needLv, T.cap, T.lv, T.flag], [3, '三の試練', 20, 25, 70, 'c6_clear']);
  const enc = FIXED_ENCOUNTERS[T.enc];
  assert.ok(enc && enc.loseOk && enc.trial && enc.canFlee === false);
  const m = MONSTERS[enc.group[0][0]];
  assert.ok(m && m.lv === 70 && m.hp > MONSTERS.trial_phantom2.hp && m.gold === 0);
  for (const id of Object.keys(JOBS).filter((j) => (JOBS[j].tier || 0) >= 2)) {
    assert.equal(jobTopCap(id), 25, id);
    const adj = PHANTOM_ADJ[id];
    assert.ok(adj && adj.length === 3 && adj[2] > 0 && adj[2] <= 4, `${id}: ${adj}`);
  }
  assert.ok(jobBattlesForLevel(25, 2) > jobBattlesForLevel(20, 2));
  assert.equal(titleFor('daikenja', 25), '至高の大賢者');
});

// 試練の番人（job-trials.test.js と おなじ すすめ方）
const KEEPER = { x: PLACES.town.x + 27, y: PLACES.town.y + 7 };
function choices(bot, list) {
  const q = [...list];
  Object.defineProperty(bot, 'choice', { configurable: true, get: () => (q.length ? q.shift() : 0), set: () => {} });
}
async function settleTalk(bot) {
  bot.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  for (let i = 0; i < 4000; i++) {
    bot.flushQueue();
    await tickN(bot.world, 1);
    bot.flushQueue();
    if (!bot.s.busy && !bot.queue.length && !bot.inBattle && !bot.world.battles.size) {
      await tickN(bot.world, 2);
      bot.flushQueue();
      if (!bot.s.busy && !bot.queue.length) return;
    }
  }
  throw new Error('終わらない');
}
const said = (bot, text, from) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));

test('三の試練（番人）: 第6章クリアの 前は 受けられない → クリアの あとで 受ける', async () => {
  const w = new GameWorld({ offline: true, rng: makeRng(65), rateLimit: false });
  const bot = new Bot(w, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = w.data.characters[bot.char.id];
  gainExp(c, expForLevel(72) - c.exp);
  c.job = 'hero';
  c.jobs.hero = { lv: 20, b: jobBattlesForLevel(20, 2), tr: 2 };
  c.flags.trial_seen = true;
  fullHeal(c);
  bot.s.repelUntil = 1e15;
  w.placeSession(bot.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 1.5, 'up', true);
  w.sendSelf(bot.s);
  await bot.settle();
  assert.equal(trialState(c).why, 'story');
  let from = bot.msgs.length;
  await settleTalk(bot);
  assert.ok(said(bot, '勇者の三の試練の相手は', from), JSON.stringify(bot.msgs.slice(from)).slice(0, 400));
  assert.ok(said(bot, '第6章のたびを終えてから', from));
  assert.equal(c.jobs.hero.tq, undefined);
  c.flags.c6_clear = true;
  from = bot.msgs.length;
  choices(bot, [0]);
  await settleTalk(bot);
  assert.ok(said(bot, '勇者の三の試練を受ける？', from));
  assert.ok(said(bot, 'Lv25', from));
  assert.equal(c.jobs.hero.tq, 3);
  assert.equal(c.jobs.hero.tn, 0);
});

// ───────────── 文 ─────────────
test('第65回 D1: 新しい 文は 使えない漢字なし・お知らせ', () => {
  const files = gameFiles().filter((f) => /items-craft-r65|job-trials|monsters-trial|news/.test(f));
  assert.ok(files.some((f) => f.endsWith('items-craft-r65.js')), 'kanji-check の gameFiles に 入っている');
  for (const f of files) {
    const bad = checkFile(f).filter((p) => p.kind === 'kanji' || p.kind === 'space');
    assert.deepEqual(bad, [], f);
  }
  const n = NEWS[0];
  assert.equal(n.id, 'r65-craft-trial');
  assert.ok(n.title.length <= 14 && n.text.length <= 170);
});
