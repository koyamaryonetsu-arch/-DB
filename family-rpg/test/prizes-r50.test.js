// 第50回 D3: 景品を 豪華に（カジノの コイン・小さなメダル・星のかけら）
//   data/prizes-r50.js・data/items-prize-r50.js・data/vehicles-prize.js・data/monsters-prize.js・world/prizes-r50.js
//   すべての 景品が ある・お話の 段で ふえる・種の ねあげ・NEW の しるし・よびぶえ（仲間が いっぱいの 時）・乗り物券・本・漢字
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { openService, serviceAction, menuAction } from '../public/js/shared/world/services.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { MONSTER_FRIENDS, ROSTER_MAX, rankOf, breedCandidates, familyPool, recipeHint } from '../public/js/shared/data/companions.js';
import { PRIZES, MEDAL_REWARDS, prizesFor, medalRewardOpen } from '../public/js/shared/data/casino.js';
import { STAR_TRADES, starTradesFor } from '../public/js/shared/data/shops.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { PRIZES_R50, MEDAL_REWARDS_R50, STAR_TRADES_R50, PRIZE_STAGES, PRIZE_CATS, prizeCatOf } from '../public/js/shared/data/prizes-r50.js';
import { ITEMS_PRIZE_R50 } from '../public/js/shared/data/items-prize-r50.js';
import { PRIZE_VEHICLES } from '../public/js/shared/data/vehicles-prize.js';
import { MONSTERS_PRIZE, FRIENDS_PRIZE } from '../public/js/shared/data/monsters-prize.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { freshIds, markSeen, takeFresh, LEGACY, grantPrizeMonster } from '../public/js/shared/world/prizes-r50.js';
import { STORAGE_MAX, addMonsterEntry, addMonsterCompanion } from '../public/js/shared/world/party.js';
import { starsOf, rareWhereText } from '../public/js/shared/data/rare-loot.js';
import { itemCount, addItem, gainExp, expForLevel, computeStats, newMonsterCompanion } from '../public/js/shared/stats.js';
import { powerScore } from '../public/js/shared/breed-calc.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { VEHICLE_ART, paintVehicle, VIEWS } from '../public/js/client/render/vehicle-art.js';
import { PRIZE_ICON_KINDS, prizeIconRows } from '../public/js/client/render/prize-icons.js';
import { PRIZE_ARMOR_LOOK } from '../public/js/client/render/prize-looks.js';
import { exportCode } from '../public/js/shared/world/transfer.js';
import { checkFile } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const ALL_FLAGS = Object.fromEntries(PRIZE_STAGES.map((f) => [f, true]));
const EQUIP = ['weapon', 'armor', 'shield', 'head', 'acc'];

async function player(seed = 50, level = 30) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ハル');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(level) - c.exp);
  c.flags.c2_ship = true;
  return { world, bot, c };
}
// カジノの 景品係の まどを 開いた 人
async function gambler(seed) {
  const p = await player(seed);
  p.world.placeSession(p.bot.s, 'casino', 14, 16.2, 'up', true);
  p.bot.s.busy = 'script';
  p.open = (arg) => openService(p.world, p.bot.s, 'casino', arg);
  p.act = (msg) => {
    serviceAction(p.world, p.bot.s, { kind: 'casino', ...msg });
    return p.bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  return p;
}
const use = (p, id, ref = 'self') => {
  menuAction(p.world, p.bot.s, { action: 'useItem', id, ref });
  return p.bot.msgs.filter((m) => m.t === 'menuRes').pop();
};

// ───────────── データ ─────────────
test('景品: すべての 品が ある（ITEMS・読みがな・せつめい）。乗り物券の 乗り物・よびぶえの 魔物も ある', () => {
  const ids = new Set([...PRIZES.map((p) => p.id), ...MEDAL_REWARDS.flatMap((r) => r.items.map(([i]) => i)), ...STAR_TRADES.map((t) => t.item)]);
  for (const id of ids) {
    const it = ITEMS[id];
    assert.ok(it, id);
    assert.ok(it.desc, `${id}: せつめい`);
    assert.ok(ITEM_KANA[id] || !/[一-龯]/.test(it.name), `${id}: 読みがな`);
    const e = it.effect;
    if (e?.type === 'prizeRide') assert.ok(VEHICLES[e.vehicle] && PRIZE_VEHICLES[e.vehicle], `${id}: ${e.vehicle}`);
    if (e?.type === 'prizeMonster') assert.ok(MONSTERS[e.species] && MONSTER_FRIENDS[e.species], `${id}: ${e.species}`);
  }
  // 景品の 品は どれも どこかの 景品（使われない 品は ない）
  for (const id of Object.keys(ITEMS_PRIZE_R50)) assert.ok(ids.has(id), `${id} は どこかで もらえる`);
  // 名前は かぶらない
  const names = new Map();
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.base) continue;
    if (id.startsWith('pz_')) assert.ok(!names.has(it.name), `${it.name}（${id}・${names.get(it.name)}）`);
    names.set(it.name, id);
  }
  // 1つの 景品は 1回だけ ならぶ（カジノ・星のかけら それぞれ）
  assert.equal(new Set(PRIZES.map((p) => p.id)).size, PRIZES.length);
  assert.equal(new Set(STAR_TRADES.map((t) => t.item)).size, STAR_TRADES.length);
});

test('景品: お話の 段ごとに 3〜6こ ふえる（カジノ）。4つの なかま が そろう', () => {
  const stages = ['', ...PRIZE_STAGES];
  for (const st of stages) {
    const n = PRIZES_R50.filter((p) => (p.need || '') === st && !p.tier).length;
    assert.ok(n >= 3 && n <= 6, `${st || 'はじめ'}: ${n}こ`);
  }
  const cats = new Set([...PRIZES_R50, ...MEDAL_REWARDS_R50.flatMap((r) => r.items.map(([id]) => ({ id }))), ...STAR_TRADES_R50.map((t) => ({ id: t.item }))].map((p) => prizeCatOf(ITEMS[p.id])));
  assert.deepEqual([...cats].sort(), Object.keys(PRIZE_CATS).sort());
  // カジノ・メダル・星のかけら それぞれに 装備・見た目・便利・魔物
  for (const list of [PRIZES_R50.map((p) => p.id), MEDAL_REWARDS_R50.flatMap((r) => r.items.map(([id]) => id)), STAR_TRADES_R50.map((t) => t.item)]) {
    assert.deepEqual([...new Set(list.map((id) => prizeCatOf(ITEMS[id])))].sort(), Object.keys(PRIZE_CATS).sort());
  }
  // なかまの きまり
  assert.equal(prizeCatOf(ITEMS.pz_call_gold_dragon), 'monster');
  assert.equal(prizeCatOf(ITEMS.pz_ride_gold_bike), 'look');
  assert.equal(prizeCatOf(ITEMS.pz_tuxedo), 'look');
  assert.equal(prizeCatOf(ITEMS.pz_lucky_ribbon), 'tool');
  assert.equal(prizeCatOf(ITEMS.pz_job_book), 'tool');
  assert.equal(prizeCatOf(ITEMS.pz_triple7_sword), 'gear');
  assert.equal(prizeCatOf(ITEMS.seed_str), 'tool');
});

test('景品: お話の フラグで ならぶ（カジノ・メダル王・星のかけら）', () => {
  // はじめは お話の 品は ならばない
  assert.ok(!prizesFor({}).some((p) => p.need));
  assert.ok(prizesFor({}).some((p) => p.id === 'pz_call_coin_rabbit'));
  assert.ok(!prizesFor({ c5_clear: true }).some((p) => p.id === 'pz_king_clock_sword'));
  assert.ok(prizesFor({ c6_heart: true }).some((p) => p.id === 'pz_king_clock_sword'));
  // 段（宝の地図）も いる 品
  assert.ok(!prizesFor(ALL_FLAGS, 3).some((p) => p.id === 'pz_casino_crown'));
  assert.ok(prizesFor(ALL_FLAGS, 4).some((p) => p.id === 'pz_casino_crown'));
  assert.ok(!prizesFor({ c5_clear: true }, 2).some((p) => p.id === 'pz_dealer_ring'));
  assert.ok(prizesFor({ c5_clear: true }, 3).some((p) => p.id === 'pz_dealer_ring'));
  // 先の 段ほど 多い
  let last = prizesFor({}, 4).length;
  const flags = {};
  for (const f of PRIZE_STAGES) {
    flags[f] = true;
    const n = prizesFor(flags, 4).length;
    assert.ok(n > last, `${f}: ${n}`);
    last = n;
  }
  // 星のかけら: 前からの 6つは いつでも。お話で ふえる。種は ない
  assert.equal(starTradesFor({}).length, 6);
  assert.equal(starTradesFor(ALL_FLAGS).length, STAR_TRADES.length);
  for (const t of STAR_TRADES) assert.ok(ITEMS[t.item].effect?.type !== 'seed' && ITEMS[t.item].effect?.type !== 'multi', `${t.item}: 種は 入れない`);
  for (const t of STAR_TRADES_R50) assert.ok(PRIZE_STAGES.includes(t.need), t.item);
  // メダル王: 50枚の 先（100枚まで）。お話の 品は need
  assert.ok(Math.max(...MEDAL_REWARDS.map((r) => r.at)) >= 100);
  assert.deepEqual(MEDAL_REWARDS.map((r) => r.at), [...MEDAL_REWARDS.map((r) => r.at)].sort((a, b) => a - b));
  assert.ok(MEDAL_REWARDS_R50.some((r) => r.need) && MEDAL_REWARDS_R50.some((r) => !r.need));
  assert.equal(medalRewardOpen({}, MEDAL_REWARDS_R50.find((r) => r.at === 85)), false);
  assert.equal(medalRewardOpen({ c5_clear: true }, MEDAL_REWARDS_R50.find((r) => r.at === 85)), true);
});

test('種の ねあげ: ふつうの 種 800・ふしぎな木の実・いやしの種 1000・星の木の実 6000・黄金の木の実 20000（メダル王の 種は そのまま）', () => {
  const price = (id) => PRIZES.find((p) => p.id === id)?.coins;
  for (const id of ['seed_str', 'seed_agi', 'seed_hp', 'seed_def', 'seed_mag']) assert.equal(price(id), 800, id);
  assert.equal(price('seed_mp'), 1000);
  assert.equal(price('seed_heal'), 1000);
  assert.equal(price('star_nut'), 6000);
  assert.equal(price('gold_nut'), 20000);
  assert.deepEqual(MEDAL_REWARDS.find((r) => r.at === 5).items, [['seed_str', 1], ['seed_agi', 1]]);
});

test('強い装備: その段の いちばん 強い 装備と おなじ くらい（ランク・★・カジノの 品は カジノでしか 手に入らない）', () => {
  // その段で 手に入る 剣の めやす（店・宝箱の いちばん 強い 剣。atk）
  const near = (id, lo, hi) => {
    const v = ITEMS[id].atk ?? ITEMS[id].def;
    assert.ok(v >= lo && v <= hi, `${id}: ${v}（${lo}〜${hi}）`);
  };
  near('pz_seven_sword', 30, 40); // 銀の剣 30・雷の剣 38
  near('pz_ace_sword', 61, 70); // プラチナソード 61・王家の黄金の剣 64
  near('pz_fivecard_sword', 85, 121); // あかつきの剣 85・大地の剣 121
  near('pz_triple7_sword', 140, 152); // 影の城の剣 142・夜明けの星の剣 150
  near('pz_king_clock_sword', 160, 180); // 時計塔の剣 167
  near('pz_milky_sword', 150, 175);
  // あとの 段ほど 強い 剣
  assert.ok(ITEMS.pz_king_clock_sword.atk > ITEMS.pz_triple7_sword.atk && ITEMS.pz_triple7_sword.atk > ITEMS.pz_fivecard_sword.atk);
  // 第6章の 宝箱の いちばん 強い 品と くらべて 大きく こえない（1.1倍まで）
  assert.ok(ITEMS.pz_king_clock_sword.atk <= ITEMS.p6t_tower_sword.atk * 1.1);
  assert.ok(ITEMS.pz_clock_mail.def <= ITEMS.p6t_tower_mail.def * 1.1);
  for (const p of PRIZES_R50) {
    const it = ITEMS[p.id];
    if (!EQUIP.includes(it.type)) continue;
    assert.equal(it.src, 'casino', p.id);
    assert.equal(rareWhereText(p.id), 'カジノの景品でしか手に入らない');
    assert.ok(starsOf(p.id) >= 2, p.id);
    assert.ok(!(it.price > 0) && it.sell < p.coins * 10, p.id);
  }
  // メダル・星のかけらの 品は src なし（店では買えない）
  for (const id of [...MEDAL_REWARDS_R50.flatMap((r) => r.items.map(([x]) => x)), ...STAR_TRADES_R50.map((t) => t.item)]) assert.ok(!ITEMS[id].src, id);
  // おしゃれ着は だれでも 装備できる（服）。見た目の 絵が ある
  for (const id of Object.keys(PRIZE_ARMOR_LOOK)) {
    assert.equal(ITEMS[id].armorType, 'cloth', id);
    assert.equal(prizeCatOf(ITEMS[id]), 'look', id);
  }
});

// ───────────── カジノで こうかん・NEW ─────────────
test('景品コーナー: NEW の しるし（はじめは この回の 品だけ。2回目は ふえた 品だけ）。こうかん できる', async () => {
  const p = await gambler(51);
  const { c, open, act } = p;
  let ui = open('prizes');
  // はじめて 開いた: この回の 品だけ NEW
  const r50 = new Set(PRIZES_R50.map((x) => x.id));
  assert.ok(ui.fresh.length > 0);
  for (const id of ui.fresh) assert.ok(r50.has(id), `${id} は この回の 品`);
  assert.ok(ui.fresh.includes('pz_call_coin_rabbit'));
  assert.ok(!ui.fresh.includes('magic_water'), '前から ある 品は NEW では ない');
  assert.equal(ui.cats.pz_call_coin_rabbit, 'monster');
  // もう 1回 開くと NEW は ない
  ui = open('prizes');
  assert.deepEqual(ui.fresh, []);
  // お話が 進むと、ふえた 品だけ NEW
  c.flags.c2_clear = true;
  ui = open('prizes');
  assert.deepEqual(ui.fresh.sort(), prizesFor({ c2_clear: true }).filter((x) => x.need === 'c2_clear').map((x) => x.id).sort());
  // こうかん
  c.coins = 5000;
  let r = act({ action: 'prize', id: 'pz_call_coin_rabbit' });
  assert.equal(r.ok, true, r.text);
  assert.equal(c.coins, 2000);
  assert.equal(itemCount(c, 'pz_call_coin_rabbit'), 1);
  // まだ ならばない 品は だめ
  c.coins = 99999;
  assert.equal(act({ action: 'prize', id: 'pz_king_clock_sword' }).ok, false);
  // 乗り物券は 1まいだけ（使って 乗り物を 持っていても だめ）
  r = act({ action: 'prize', id: 'pz_ride_gold_bike' });
  assert.equal(r.ok, true);
  assert.equal(act({ action: 'prize', id: 'pz_ride_gold_bike' }).ok, false, '券を 持っている');
  p.bot.s.busy = null;
  assert.equal(use(p, 'pz_ride_gold_bike').ok, true);
  assert.ok(c.vehicles.includes('gold_bicycle'));
  assert.ok(vehicleShelf(c).includes('gold_bicycle'), '持っていれば 乗り物屋の 一らんにも 出る');
  p.bot.s.busy = 'script';
  open('prizes');
  r = act({ action: 'prize', id: 'pz_ride_gold_bike' });
  assert.equal(r.ok, false, 'もう 持っている');
  assert.match(r.text, /もう持っている/);
  ui = open('prizes');
  assert.ok(ui.have.includes('pz_ride_gold_bike'));
});

test('NEW の しるし: きまり（きろくが ない 人は 前からの 品を 見た ことに。見た 品は のこる。合言葉には 入れない）', async () => {
  const c = { flags: {} };
  const old = PRIZES.filter((p) => !p.r).map((p) => p.id);
  assert.deepEqual(freshIds(c, 'casino', old), []);
  assert.deepEqual(freshIds(c, 'casino', ['pz_job_book', 'magic_water']), ['pz_job_book']);
  // はじめての きろくは 今 ならんでいる 品だけ（まだ ならんでいない 前からの 品は、ならんだ ときに NEW）
  markSeen(c, 'casino', ['pz_job_book', 'magic_water']);
  assert.deepEqual(freshIds(c, 'casino', ['pz_job_book', 'pz_tuxedo', 'magic_water', 'seed_def']), ['pz_tuxedo', 'seed_def']);
  // 前に 見た 品は 消えない（一らんから いなくなっても）
  markSeen(c, 'casino', ['pz_tuxedo']);
  assert.ok(c.prizeSeen.casino.includes('pz_job_book') && c.prizeSeen.casino.includes('magic_water'));
  assert.deepEqual(takeFresh(c, 'star', ['magic_water', 'pz_star_cape']), ['pz_star_cape']);
  assert.deepEqual(takeFresh(c, 'star', ['magic_water', 'pz_star_cape']), []);
  // メダル王（数の ID）
  assert.deepEqual(takeFresh(c, 'medal', [5, 50, 55]), ['55']);
  assert.ok(LEGACY.medal.has('50') && !LEGACY.medal.has('55'));
  // こわれた きろく
  const bad = { prizeSeen: { casino: 'x', star: [1, null, 'pz_star_cape'] } };
  assert.deepEqual(freshIds(bad, 'casino', ['magic_water', 'pz_job_book']), ['pz_job_book']);
  assert.deepEqual(freshIds(bad, 'star', ['pz_star_cape', 'magic_water']), ['magic_water']);
  // 合言葉（引っこし）には 入れない
  const p = await player(52);
  markSeen(p.c, 'casino', ['pz_job_book']);
  const code = exportCode(p.c);
  assert.ok(!String(code).includes('pz_job_book'));
});

// ───────────── メダル王 ─────────────
test('メダル王: 55〜100枚の ごほうび。お話の 品は フラグが つくまで のこる（あとで もらえる）', async () => {
  const p = await player(53);
  const { world, bot, c } = p;
  world.placeSession(bot.s, 'medal_castle', 8, 3.5, 'up', true);
  bot.s.busy = 'script';
  const give = () => {
    serviceAction(world, bot.s, { kind: 'medal', action: 'give' });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let ui = openService(world, bot.s, 'medalKing');
  assert.ok(ui.fresh.includes('55') && !ui.fresh.includes('85'), 'NEW: もらえる ごほうびの うち この回の もの');
  assert.ok(ui.rewards.find((r) => r.at === 85).locked);
  assert.ok(!ui.rewards.find((r) => r.at === 55).locked);
  // 闘技場などで 90枚
  c.medalSpots = Object.fromEntries(Array.from({ length: 90 }, (_, i) => [`arena_rep_${i + 1}`, 1]));
  let r = give();
  assert.equal(r.ok, true, r.text);
  const ats = r.got.map((g) => g.at);
  for (const at of [5, 50, 55, 60, 70, 90]) assert.ok(ats.includes(at), `${at}`);
  for (const at of [65, 75, 80, 85]) assert.ok(!ats.includes(at), `${at} は お話が 進むと`);
  assert.equal(itemCount(c, 'pz_job_book2'), 2);
  assert.equal(itemCount(c, 'pz_medal_mantle'), 1);
  // お話が 進んだら、メダルが なくても もらえる
  c.flags.c2_clear = true;
  c.flags.c4_clear = true;
  ui = openService(world, bot.s, 'medalKing');
  assert.ok(ui.fresh.includes('65') && ui.fresh.includes('75') && ui.fresh.includes('80'));
  r = give();
  assert.equal(r.ok, true, r.text);
  assert.deepEqual(r.got.map((g) => g.at), [65, 75, 80]);
  assert.equal(itemCount(c, 'pz_call_medal_king'), 1);
  assert.equal(itemCount(c, 'pz_ride_medal_carpet'), 1);
  // もう もらう 物は ない
  assert.equal(give().ok, false);
});

// ───────────── 星のかけら ─────────────
test('星のかけら: お話で ふえる こうかん（品の ID で）。NEW。足りない・まだ ない 品は だめ', async () => {
  const p = await player(54);
  const { world, bot, c } = p;
  let ui = openService(world, bot.s, 'starTrade');
  assert.equal(ui.trades.length, 6);
  assert.equal(ui.more, true);
  assert.deepEqual(ui.fresh, []);
  addItem(c, 'star_shard', 60);
  const trade = (msg) => {
    serviceAction(world, bot.s, { kind: 'starTrade', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  assert.equal(trade({ item: 'pz_star_cape' }).ok, false, 'まだ ならんでいない');
  c.flags.c2_clear = true;
  ui = openService(world, bot.s, 'starTrade');
  assert.deepEqual(ui.fresh.sort(), ['pz_job_book', 'pz_star_cape']);
  let r = trade({ item: 'pz_star_cape' });
  assert.equal(r.ok, true, r.text);
  assert.equal(itemCount(c, 'star_shard'), 42);
  assert.equal(itemCount(c, 'pz_star_cape'), 1);
  // 前の 画面（一らんの 何番め）
  r = trade({ index: 0 });
  assert.equal(r.ok, true);
  assert.equal(itemCount(c, 'magic_water'), 1);
  // 足りない
  c.flags.c6_heart = true;
  assert.equal(trade({ item: 'pz_star_crown' }).ok, false);
});

// ───────────── 景品の 道具を 使う ─────────────
test('よびぶえ: 仲間に なる（パーティー → 酒場）。仲間が いっぱい なら あずかり所。どちらも いっぱいなら 使えない（へらない）', async () => {
  const p = await player(55);
  const { c } = p;
  addItem(c, 'pz_call_gold_dragon', 4);
  let r = use(p, 'pz_call_gold_dragon');
  assert.equal(r.ok, true, r.text);
  const e = c.companions.find((x) => x.species === 'gold_dragon');
  assert.ok(e, '仲間に なった');
  assert.equal(e.char.level, 1);
  assert.equal(e.char.catchUp, Math.floor(0.75 * c.level), '追いつき');
  assert.ok(c.partyKeys.includes(e.key) || c.companions.length, 'パーティーか 酒場');
  assert.equal(c.bestiary.gold_dragon.friend, 1);
  assert.equal(itemCount(c, 'pz_call_gold_dragon'), 3);
  // 仲間が いっぱい（40）→ あずかり所へ
  while (c.companions.length < ROSTER_MAX) assert.ok(addMonsterEntry(c, 'pururin', 1).ok);
  r = use(p, 'pz_call_gold_dragon');
  assert.equal(r.ok, true, r.text);
  assert.match(r.text, /あずかり所/);
  assert.equal(c.companions.length, ROSTER_MAX);
  assert.ok(c.storage.some((x) => x.species === 'gold_dragon'));
  const keys = [...c.companions, ...c.storage].map((x) => x.key);
  assert.equal(new Set(keys).size, keys.length, '番号は かさならない');
  // あずかり所も いっぱい → 使えない・へらない
  while (c.storage.length < STORAGE_MAX) c.storage.push({ key: `zz${c.storage.length}`, kind: 'monster', species: 'pururin', char: newMonsterCompanion({ id: 'x', species: 'pururin', level: 1 }) });
  const before = itemCount(c, 'pz_call_gold_dragon');
  r = use(p, 'pz_call_gold_dragon');
  assert.equal(r.ok, false);
  assert.equal(itemCount(c, 'pz_call_gold_dragon'), before);
  // grantPrizeMonster: 知らない 魔物は だめ
  assert.equal(grantPrizeMonster(p.world, p.bot.s, 'nope').ok, false);
});

test('修行の書・経験の書: 職業の 修行・経験値（上限では 使えない・へらない）。乗り物券は 1回', async () => {
  const p = await player(56, 10);
  const { c } = p;
  addItem(c, 'pz_job_book2', 2);
  addItem(c, 'pz_exp_book2', 2);
  const b0 = c.jobs[c.job].b || 0;
  let r = use(p, 'pz_job_book2');
  assert.equal(r.ok, true, r.text);
  assert.ok((c.jobs[c.job].b || 0) >= b0 + 15 || c.jobs[c.job].lv > 1, '修行が すすむ');
  // 経験の大書: 次の レベルまで
  const lv = c.level;
  r = use(p, 'pz_exp_book2');
  assert.equal(r.ok, true, r.text);
  assert.equal(c.level, lv + 1);
  // 魔物の 仲間にも（パーティーの 仲間）
  const m = addMonsterCompanion(p.world, p.bot.s, 'pururin', 5);
  assert.ok(m.ok && m.joined, m.reason);
  const mc = c.companions.find((x) => x.key === m.key).char;
  r = use(p, 'pz_exp_book2', `sup:${m.key}`);
  assert.equal(r.ok, true, r.text);
  assert.equal(mc.level, 6);
  assert.equal(itemCount(c, 'pz_exp_book2'), 0);
  // 職業の 上限
  c.jobs[c.job].lv = 99;
  r = use(p, 'pz_job_book2');
  assert.equal(r.ok, false);
  assert.equal(itemCount(c, 'pz_job_book2'), 1, 'へらない');
  c.jobs[c.job].lv = 1;
  // しあわせのリボン（アクセサリー）: しあわせのぼうしと おなじ 力
  assert.equal(ITEMS.pz_lucky_ribbon.perk, 'expHat');
  assert.equal(ITEMS.pz_lucky_ribbon.type, 'acc');
  // 乗り物券
  addItem(c, 'pz_ride_galaxy_pegasus', 2);
  assert.equal(use(p, 'pz_ride_galaxy_pegasus').ok, true);
  assert.ok(c.vehicles.includes('galaxy_pegasus'));
  r = use(p, 'pz_ride_galaxy_pegasus');
  assert.equal(r.ok, false, 'もう 持っている');
  assert.equal(itemCount(c, 'pz_ride_galaxy_pegasus'), 1);
});

// ───────────── めずらしい 魔物 ─────────────
test('めずらしい 魔物 6しゅ: 景品だけ（やせい・配合では 生まれない）。配合の 親に なれる。絵は 今の 魔物の 色がえ', () => {
  const ids = Object.keys(MONSTERS_PRIZE);
  assert.equal(ids.length, 6);
  const calls = new Set(Object.values(ITEMS).filter((it) => it.effect?.type === 'prizeMonster').map((it) => it.effect.species));
  const want = { coin_rabbit: 'C', roulette_slime: 'B', joker_devil: 'B', medal_king: 'A', star_pegasus: 'A', gold_dragon: 'S' };
  const power = (sp) => powerScore(computeStats({ species: sp, level: 60, plus: 10, ranked: 1, seeds: {}, equip: {} }));
  for (const sp of ids) {
    const m = MONSTERS[sp], f = MONSTER_FRIENDS[sp];
    assert.equal(m, MONSTERS_PRIZE[sp]);
    assert.equal(f, FRIENDS_PRIZE[sp]);
    assert.ok(calls.has(sp), `${sp}: よびぶえ`);
    assert.ok(m.breedOnly && f.breedOnly && f.recipeOnly && f.rate === 0, sp);
    assert.equal(rankOf(sp, MONSTERS), want[sp], sp);
    assert.ok(MONSTER_ART[m.art] && m.tint, `${sp}: 絵 ${m.art}`);
    assert.ok(recipeHint(sp, MONSTERS).includes('よびぶえ'), sp);
    for (const [, a] of f.learn) assert.ok(ABILITIES[a], `${sp}: ${a}`);
    for (const a of m.actions) assert.ok(a.id === 'attack' || ABILITIES[a.id], `${sp}: ${a.id}`);
    // 系統配合では 生まれない
    assert.ok(!familyPool(m.race, MONSTERS).includes(sp), sp);
    // のびかた（DQ ふうの 魔物と おなじ ものさし）
    assert.ok(Object.values(f.growth).reduce((x, y) => x + y, 0) <= 8.2, sp);
    const pw = power(sp);
    assert.ok(pw > 900 && pw < 1300, `${sp}: ${Math.round(pw)}`);
  }
  // 配合の 親に なれる（同じ しゅぞく 2ひき → 同じ しゅぞく）
  const lv = (species, level = 30) => ({ species, level, plus: 0 });
  assert.ok(breedCandidates(lv('gold_dragon'), lv('gold_dragon'), MONSTERS).list.includes('gold_dragon'));
  const kids = breedCandidates(lv('gold_dragon'), lv('great_dragon'), MONSTERS).list;
  assert.ok(kids.length > 0);
  // ほかの 配合からは 生まれない
  for (const a of ['pururin', 'wolf', 'great_dragon', 'king_pururin']) {
    for (const b of ['ice_pururin', 'pegasus', 'koakuma']) {
      const l = breedCandidates(lv(a, 60), lv(b, 60), MONSTERS).list;
      for (const sp of ids) assert.ok(!l.includes(sp), `${a}＋${b} → ${sp}`);
    }
  }
});

// ───────────── 絵・漢字 ─────────────
test('絵: 景品の 乗り物（4方向・コマ）・なかまの 絵（12×12）・おしゃれ着', () => {
  for (const id of Object.keys(PRIZE_VEHICLES)) {
    assert.ok(VEHICLE_ART[id], `${id}: 絵`);
    const v = VEHICLES[id];
    assert.ok(v.gift && Array.isArray(v.jobs) && !v.jobs.length, id);
    assert.ok(v.price >= 100 && v.price <= 20000, id);
    for (const view of VIEWS) assert.ok(paintVehicle(id, view, 0, 'front'), `${id} ${view}`);
  }
  for (const k of PRIZE_ICON_KINDS) {
    const rows = prizeIconRows(k);
    assert.equal(rows.length, 12, k);
    for (const r of rows) assert.equal(r.length, 12, `${k}: ${r}`);
  }
  for (const cat of Object.values(PRIZE_CATS)) assert.ok(PRIZE_ICON_KINDS.includes(cat.cls), cat.cls);
});

test('漢字: 景品の 文は 小学校の 漢字（tools/kanji-check.mjs）', () => {
  const files = [
    'public/js/shared/data/prizes-r50.js', 'public/js/shared/data/items-prize-r50.js', 'public/js/shared/data/vehicles-prize.js',
    'public/js/shared/data/monsters-prize.js', 'public/js/shared/world/prizes-r50.js', 'public/js/client/ui/prizes.js',
  ];
  for (const f of files) {
    const bad = checkFile(new URL(`../${f}`, import.meta.url).pathname);
    assert.deepEqual(bad.map((b) => `${b.line}: ${b.text}`), [], f);
  }
});
