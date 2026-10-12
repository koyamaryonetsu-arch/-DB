// 第32回 B: ひみつのダンジョンの 見なおし
//   入るたびに 変わる 階（ちょうせんの seed）・回復の泉なし・番人を たおすと 全回復・宿屋と お店の 階（運）・
//   お店だけの 回復薬・強さに 上限なし（数が あふれない）・40階からの 色ちがい（data/variants.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ITEMS } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { ENCOUNTER_TABLES, FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { scaleEnemy, scaledRewardBonus } from '../public/js/shared/data/treasure.js';
import { Battle, enemyFromSpecies } from '../public/js/shared/battle.js';
import { gainExp, expForLevel, computeStats, newCharacter, fullHeal, itemCount, addItem } from '../public/js/shared/stats.js';
import { repairChar } from '../public/js/shared/world/save.js';
import { befriendChance } from '../public/js/shared/world/party.js';
import { monsterDrops } from '../public/js/shared/data/loot.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import {
  SD_GATE, SD_OPEN_FLAG, SD_MAX, sdFloorId, sdFloorOf, sdRunSeedOf, newSdSeed, sdSpecialOf, SD_SPECIAL_RATE, sdInnPrice,
  sdEnemyLv, sdPower, ensureSdTable, sdZone, isRestFloor, isGuardFloor, sdGuardEncounter, repairSecret,
  SD_VARIANT_FROM, sdVariantRate, sdVariantBases, registerSdVariants,
} from '../public/js/shared/data/secret.js';
import { sdShopStock, ensureSdShop, sdShopPrice, sdShopRank } from '../public/js/shared/data/secret-shop.js';
import { SD_POTIONS } from '../public/js/shared/data/items-secret.js';
import { VARIANT_KINDS, makeVariant, registerVariant, variantId, variantOf, baseSpecies } from '../public/js/shared/data/variants.js';
import { GATE_DOWN, SPECIAL_KEEPER, REST_DOWN, REST_ARRIVE } from '../public/js/shared/maps/secret-dungeon.js';
import { MONSTER_ART } from '../public/js/client/render/monsters.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { STORY_STEPS } from '../public/js/shared/data/story.js';
import { Bot, tickN } from './helpers.js';

const UPTO = (f) => STORY_STEPS.slice(0, STORY_STEPS.indexOf(f) + 1);
const sayTexts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.filter((s) => s[0] === 'say').map((s) => s[2]));
const toasts = (bot, from = 0) => bot.msgs.slice(from).filter((m) => m.t === 'toast').map((m) => m.text);
function answers(bot, list) {
  const q = list.slice();
  Object.defineProperty(bot, 'choice', { get: () => (q.length ? q.shift() : 0), set: () => {}, configurable: true });
}
async function hero(seed = 7, { level = 60, name = 'ソラ' } = {}) {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, name);
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  for (const f of UPTO(SD_OPEN_FLAG)) c.flags[f] = true;
  gainExp(c, expForLevel(level) - c.exp);
  c.equip.weapon = 'thunder_sword';
  c.equip.armor = 'silver_mail';
  c.jobs[c.job] = { lv: 10, b: 999 };
  fullHeal(c);
  return { world, bot, c };
}
const place = async (bot, map, x, y, dir = 'up') => {
  bot.world.placeSession(bot.s, map, x, y, dir, true);
  await bot.settle();
};
async function stepOn(bot, x, y) {
  bot.x = x + 0.5;
  bot.y = y + 0.5;
  bot.send({ t: 'move', x: bot.x, y: bot.y, dir: 'up', moving: true, seq: bot.seq });
  await tickN(bot.world, 1);
  await bot.settle();
}
// ちょうせん中に して その 階（seed つき）へ
async function onFloor(bot, f, seed) {
  const m = MAPS[sdFloorId(f, seed)];
  await place(bot, m.id, m.sd.arrive.x, m.sd.arrive.y);
  const c = bot.world.data.characters[bot.char.id];
  c.sd = { ...(c.sd || { best: 0, got: [], tries: 1 }), run: { f, took: [], seed } };
  return m;
}
async function talkTo(bot, id) {
  const m = MAPS[bot.map];
  const n = m.npcs.find((x) => x.id === id);
  await place(bot, m.id, n.x + 0.5, n.y + (n.big ? 2.5 : 1.5));
  return bot.talk(id);
}
async function goDown(bot) {
  const m = MAPS[bot.map];
  const d = m.sd.down || REST_DOWN;
  await place(bot, m.id, d.x + 0.5, d.y + 1.5);
  await stepOn(bot, d.x, d.y);
}
// その しゅるいの 階が ある seed と 階
function findSpecial(kind, from = 6) {
  for (let seed = 1; seed < 5000; seed++) for (let f = from; f < from + 40; f++) if (sdSpecialOf(f, seed) === kind) return { seed, f };
  throw new Error('not found');
}
function reachFrom(m, sx, sy) {
  const block = new Set();
  for (const n of m.npcs) if (n.solid !== false) block.add(Math.floor(n.y) * m.w + Math.floor(n.x));
  const seen = new Uint8Array(m.w * m.h);
  const q = [[sx, sy]];
  seen[sy * m.w + sx] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
      const k = ny * m.w + nx;
      if (seen[k] || block.has(k) || isBlocked(m, nx, ny, () => false)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !!seen[y * m.w + x];
}

// ───────────── 入るたびに 変わる 階 ─────────────
test('階の 形: ちょうせんごとの seed で かわる。ID に seed が 入る（おなじ ID なら いつも おなじ 形）。前の 版の ID も 読める', async () => {
  const seed = 123456789;
  const id = sdFloorId(7, seed);
  assert.match(id, /^sd_7_[0-9a-z]+$/);
  assert.equal(sdFloorOf(id), 7);
  assert.equal(sdRunSeedOf(id), seed);
  assert.equal(sdFloorId(7), 'sd_7', 'seed が なければ 前の 版の ID');
  assert.equal(sdRunSeedOf('sd_7'), 0);
  for (const bad of ['sd_7_', 'sd_7_zzzzzzz', 'sd_7_ZZ', 'sd_0_abc', 'sd_7_abc_1', 'sd_gate']) assert.equal(sdFloorOf(bad), 0, bad);
  assert.equal(sdFloorOf(sdFloorId(999, 0x7fffffff)), 999);
  // おなじ ID は、べつの 読みこみ（サーバーと 画面）でも おなじ 形
  const a = await import('../public/js/shared/maps/secret-dungeon.js?r32=a');
  const b = await import('../public/js/shared/maps/secret-dungeon.js?r32=b');
  let differ = 0;
  for (const f of [1, 2, 3, 4, 7, 8, 12, 13, 21, 33, 47, 88, 101]) {
    const x = a.buildSecretFloor(sdFloorId(f, seed)), y = b.buildSecretFloor(sdFloorId(f, seed));
    assert.deepEqual([...x.tiles], [...y.tiles], `${f}階: おなじ 形`);
    assert.deepEqual(x.sd, y.sd);
    assert.equal(x.sd.seed, seed);
    const z = a.buildSecretFloor(sdFloorId(f, seed + 1));
    if (x.sd.kind || z.sd.kind) continue;
    if ([...x.tiles].join() !== [...z.tiles].join()) differ++;
  }
  assert.ok(differ >= 8, `ちがう seed は ちがう 形（${differ}）`);
  // どの 階も 着いた 所から 下り階段へ 行ける（seed つき）
  for (const s of [1, 77, 99999]) {
    for (let f = 1; f <= 60; f++) {
      const m = MAPS[sdFloorId(f, s)];
      assert.ok(m && m.noEscape && m.noBefriend, `${f}階`);
      const reach = reachFrom(m, Math.floor(m.sd.arrive.x), Math.floor(m.sd.arrive.y));
      const d = m.sd.down;
      if (isGuardFloor(f)) continue; // 番人が ふさぐ（secret-dungeon.test.js）
      assert.ok(reach(d.x, d.y + 1), `${s}:${f}階 下り階段`);
    }
  }
  // seed は 1〜SD_SEED_MAX
  const rng = makeRng(3);
  for (let i = 0; i < 500; i++) {
    const v = newSdSeed(rng);
    assert.ok(Number.isInteger(v) && v >= 1 && v <= 0x7fffffff);
    assert.equal(sdRunSeedOf(sdFloorId(3, v)), v);
  }
});

test('ちょうせんの seed: 入るたびに 新しい・いっしょに 下りても 同じ・ログインしなおしても 同じ 形・セーブで のこる', async () => {
  const { world, bot, c } = await hero(5);
  const enter = async () => {
    await place(bot, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5);
    answers(bot, [0]);
    await stepOn(bot, GATE_DOWN.x, GATE_DOWN.y);
    return c.sd.run.seed;
  };
  const s1 = await enter();
  assert.ok(s1 > 0);
  assert.equal(bot.map, sdFloorId(1, s1));
  await goDown(bot);
  assert.equal(bot.map, sdFloorId(2, s1), '下りても おなじ ちょうせんの seed');
  assert.equal(c.sd.run.f, 2);
  assert.equal(c.sd.run.seed, s1);
  assert.equal(c.sd.best, 2);
  // ログインしなおし: おなじ 階・おなじ 形・ちょうせんも つづく
  const tiles = [...MAPS[bot.map].tiles].join('');
  const mapId = bot.map;
  const id = c.id;
  world.leaveWorld(world.sessions.get(bot.sid));
  assert.equal(c.pos.map, mapId);
  bot.send({ t: 'play', id });
  await bot.settle();
  assert.equal(bot.map, mapId);
  assert.equal([...MAPS[bot.map].tiles].join(''), tiles);
  assert.equal(c.sd.run.seed, s1);
  await goDown(bot);
  assert.equal(c.sd.best, 3, 'ログインしなおしても 記録が のびる');
  // 地上へ 出て また 入ると 新しい seed（ちがう 形）
  await place(bot, SD_GATE, 4.5, 3.5);
  assert.equal(c.sd.run, undefined);
  const s2 = await enter();
  assert.notEqual(s2, s1);
  assert.equal(bot.map, sdFloorId(1, s2));
  // セーブの 形（seed は のこる。こわれた seed は すてる）
  const x = { sd: { best: 3, got: [], tries: 1, run: { f: 2, took: [], seed: 42 } } };
  repairSecret(x);
  assert.equal(x.sd.run.seed, 42);
  for (const bad of [0, -1, 1.5, 'x', 2 ** 31]) {
    const y = { sd: { best: 3, got: [], tries: 1, run: { f: 2, took: [], seed: bad } } };
    repairSecret(y);
    assert.equal(y.sd.run.seed, undefined, String(bad));
  }
  const z = { id: 'z', name: 'z', level: 3, flags: {}, items: [], equip: {}, sd: { best: 3, got: [], tries: 1, run: { f: 2, took: [], seed: 42 } } };
  repairChar(z);
  assert.equal(z.sd.run.seed, 42);
  // 前の 版の 階（'sd_4'）に いた 人: そのまま 遊べて、次の 階から 新しい seed
  const m4 = MAPS.sd_4;
  await place(bot, 'sd_4', m4.sd.arrive.x, m4.sd.arrive.y);
  c.sd.run = { f: 4, took: [] };
  await goDown(bot);
  assert.equal(sdFloorOf(bot.map), 5);
  assert.ok(sdRunSeedOf(bot.map) > 0);
  assert.equal(c.sd.run.seed, sdRunSeedOf(bot.map));
  assert.equal(c.sd.best, 5, '記録の 数えかたは そのまま');
});

test('家族: いっしょに 入った パーティーは おなじ seed（おなじ 形の 階）', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(9), checkPassword: () => true, rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const mama = new Bot(world, 'ママ');
  for (const b of [papa, mama]) { await b.login('x'); await b.createAndPlay('warrior'); await b.settle(); }
  const P = world.sessions.get(papa.sid), M = world.sessions.get(mama.sid);
  for (const f of UPTO(SD_OPEN_FLAG)) P.char.flags[f] = true;
  papa.send({ t: 'party', action: 'invite', sid: mama.s.id });
  mama.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await mama.settle();
  world.placeSession(P, SD_GATE, GATE_DOWN.x + 0.5, GATE_DOWN.y + 1.5, 'up');
  world.placeSession(M, SD_GATE, 10.5, 9.5, 'up');
  await mama.settle();
  answers(papa, [0]);
  await stepOn(papa, GATE_DOWN.x, GATE_DOWN.y);
  await mama.settle();
  assert.equal(sdFloorOf(papa.map), 1);
  assert.equal(mama.map, papa.map, 'おなじ ID の 階（おなじ 形）');
  assert.equal(P.char.sd.run.seed, M.char.sd.run.seed);
  assert.ok(!P.char.sd.run.mid && !M.char.sd.run.mid, 'ふたりとも 記録に なる');
});

// ───────────── 回復の泉なし・番人で 全回復 ─────────────
test('休み所に 回復の泉は ない。10階ごとの 番人を たおすと、みんなの HPと MPが 全回復', async () => {
  for (let f = 5; f <= 200; f += 5) {
    const m = MAPS[sdFloorId(f, 31337)];
    assert.ok(m.sd.rest && !m.npcs.some((n) => n.id === 'sd_spring'), `${f}階`);
    assert.equal(!!m.npcs.find((n) => n.id === 'sd_guard'), isGuardFloor(f));
  }
  const { bot, c } = await hero(15);
  const seed = 4242;
  await onFloor(bot, 10, seed);
  c.mp = 0;
  const from = bot.msgs.length;
  await talkTo(bot, 'sd_guard');
  assert.ok(bot.battles.some((b) => b.outcome === 'win'));
  const st = computeStats(c);
  assert.equal(c.hp, st.maxHp);
  assert.equal(c.mp, st.maxMp, 'MPも 全回復');
  const said = sayTexts(bot, from).join('\n');
  assert.match(said, /番人の.+をたおした/);
  assert.match(said, /HPとMPがすっかり回復した/);
  const steps = bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps.map((s) => s[0]));
  assert.ok(steps.includes('flash'), '光る 演出');
  assert.equal(bot.map, sdFloorId(11, seed), '11階へ（おなじ seed）');
  assert.equal(c.sd.best, 11);
  // 番人の 強さの 数は そのまま（担当A の 数式を 呼ぶ 所）
  const g = FIXED_ENCOUNTERS[sdGuardEncounter(10)];
  assert.equal(g.enemyLv, sdEnemyLv(10) + 2);
  assert.equal(g.enemyPow, sdPower(10));
});

// ───────────── 宿屋と お店の 階 ─────────────
test('宿屋・お店の 階: 6階から 運で（4階に 1つまで・5の 倍数と 番人の 階には 出ない）', () => {
  let blocks = 0, hit = 0, inn = 0, shop = 0;
  for (let seed = 1; seed <= 400; seed++) {
    assert.equal(sdSpecialOf(7, 0), null, 'seed なし（前の 版）は 出ない');
    for (let b = 1; b < 30; b++) {
      const got = [];
      for (let f = b * 5 + 1; f < b * 5 + 5; f++) {
        const k = sdSpecialOf(f, seed);
        if (k) got.push(k);
      }
      assert.ok(got.length <= 1);
      blocks++;
      if (got.length) hit++;
      if (got[0] === 'inn') inn++;
      if (got[0] === 'shop') shop++;
    }
    for (let f = 0; f <= 150; f += 5) assert.equal(sdSpecialOf(f, seed), null, `${f}階`);
    for (let f = 1; f <= 5; f++) assert.equal(sdSpecialOf(f, seed), null, `${f}階`);
  }
  const rate = hit / blocks;
  assert.ok(Math.abs(rate - SD_SPECIAL_RATE) < 0.05, `4階ごとに ${rate}`);
  assert.ok(Math.abs(inn / hit - 0.5) < 0.06, `宿屋 ${inn}・お店 ${shop}`);
  // マップ: 魔物は 出ない・主人に 話せる・下り階段へ 行ける
  for (const kind of ['inn', 'shop']) {
    const { seed, f } = findSpecial(kind);
    const m = MAPS[sdFloorId(f, seed)];
    assert.equal(m.sd.kind, kind);
    assert.equal(m.spawnCounts, undefined);
    assert.equal(m.zoneAt(5, 5), 'safe:sd');
    const reach = reachFrom(m, Math.floor(REST_ARRIVE.x), Math.floor(REST_ARRIVE.y));
    assert.ok(reach(SPECIAL_KEEPER.x, SPECIAL_KEEPER.y + 1), '主人の 前');
    assert.ok(reach(REST_DOWN.x, REST_DOWN.y + 1), '下り階段');
    assert.ok(m.triggers.some((t) => t.script === 'sd_down'));
    assert.ok(m.npcs.some((n) => n.script === (kind === 'inn' ? 'sd_inn' : 'sd_shop')));
  }
  assert.ok(sdInnPrice(7) <= 60 && sdInnPrice(60) <= 400 && sdInnPrice(7) < sdInnPrice(60), 'すこしの ゴールド');
});

test('宿屋の 階: すこしの ゴールドで HPと MPが 全回復（足りなければ 休めない）。着いた 時は ひとことだけ', async () => {
  const { seed, f } = findSpecial('inn', 11);
  const { bot, c } = await hero(25);
  // ひとつ 上の 階から 下りて 着く（知らせは ひとこと）
  await onFloor(bot, f - 1, seed);
  let from = bot.msgs.length;
  await goDown(bot);
  assert.equal(bot.map, sdFloorId(f, seed));
  assert.ok(toasts(bot, from).some((t) => t.includes('ふしぎな宿屋がある')));
  assert.equal(sayTexts(bot, from).length, 0, '会話の まどは 出ない');
  const st = computeStats(c);
  c.hp = 1;
  c.mp = 0;
  c.gold = sdInnPrice(f) - 1;
  answers(bot, [0]);
  from = bot.msgs.length;
  await talkTo(bot, 'sd_inn');
  assert.equal(c.hp, 1, 'お金が 足りない');
  assert.ok(sayTexts(bot, from).some((t) => t.includes('足りない')));
  c.gold = 1000;
  answers(bot, [0]);
  from = bot.msgs.length;
  await talkTo(bot, 'sd_inn');
  assert.equal(c.hp, st.maxHp);
  assert.equal(c.mp, st.maxMp);
  assert.equal(c.gold, 1000 - sdInnPrice(f));
  assert.ok(sayTexts(bot, from).some((t) => t.includes('すっかり回復')));
  // やめる
  c.hp = 1;
  answers(bot, [1]);
  await talkTo(bot, 'sd_inn');
  assert.equal(c.hp, 1);
  assert.equal(c.gold, 1000 - sdInnPrice(f));
});

test('お店の 階: ★2〜★3 の レア装備（深いほど 強い。ひみつのダンジョンだけの ★4〜★5 は 出ない）と ここだけの 回復薬', async () => {
  const pots = Object.keys(SD_POTIONS);
  assert.ok(pots.length >= 2 && pots.length <= 4);
  for (const id of pots) {
    const it = ITEMS[id];
    assert.ok(it && it.type === 'use' && it.battle && it.price > 0 && it.name && it.desc, id);
    // ほかの 店には ない
    for (const [sid, s] of Object.entries(SHOPS)) assert.ok(!s.items.includes(id) && !(s.more || []).some((x) => x.items.includes(id)), `${sid}: ${id}`);
  }
  const counts = {};
  let rank6 = 0, rank40 = 0, r3low = 0, r3high = 0, n6 = 0, n40 = 0;
  for (let seed = 1; seed <= 300; seed++) {
    for (const f of [7, 18, 33, 47, 120]) {
      const st = sdShopStock(f, seed);
      assert.deepEqual(st, sdShopStock(f, seed), 'おなじ seed と 階は おなじ 品ぞろえ');
      assert.equal(st.gear.length, 3);
      assert.ok(st.potions.length >= 2 && st.potions.length <= 3);
      for (const id of st.gear) {
        const it = ITEMS[id];
        assert.ok(it.rarity >= 1 && it.rarity <= 3, `${id} ★${it.rarity}`);
        assert.notEqual(it.src, 'sd');
        assert.ok(it.rank <= sdShopRank(f));
        assert.ok(sdShopPrice(id) >= 200);
      }
      for (const id of st.potions) counts[id] = (counts[id] || 0) + 1;
      if (f === 7) { n6 += 3; rank6 += st.gear.reduce((t, id) => t + ITEMS[id].rank, 0); r3low += st.gear.filter((id) => ITEMS[id].rarity === 3).length; }
      if (f === 47) { n40 += 3; rank40 += st.gear.reduce((t, id) => t + ITEMS[id].rank, 0); r3high += st.gear.filter((id) => ITEMS[id].rarity === 3).length; }
    }
  }
  assert.ok(rank40 / n40 > rank6 / n6 + 3, `深いほど ランクが 高い ${rank6 / n6} → ${rank40 / n40}`);
  assert.ok(r3high / n40 > r3low / n6 + 0.3, `深いほど ★3 ${r3low / n6} → ${r3high / n40}`);
  for (const id of pots) assert.ok(counts[id] > 200, `運しだいで ならぶ ${id} ${counts[id]}`);
  // 買う（店の 画面は ふつうの お店。レア装備の ねだんは その 店だけ）
  const { seed, f } = findSpecial('shop', 30);
  const { bot, c } = await hero(35);
  await onFloor(bot, f, seed);
  c.gold = 100000;
  const from = bot.msgs.length;
  await talkTo(bot, 'sd_shop');
  const ui = bot.msgs.slice(from).filter((m) => m.t === 'script').flatMap((m) => m.steps).find((s) => s[0] === 'ui' && s[1] === 'shop');
  assert.ok(ui, '店の まど');
  const data = ui[2];
  assert.equal(data.shop, ensureSdShop(f, seed));
  assert.equal(data.items.length, sdShopStock(f, seed).gear.length + sdShopStock(f, seed).potions.length);
  const gear = sdShopStock(f, seed).gear[0];
  assert.equal(data.prices[gear], sdShopPrice(gear));
  const buy = (id, qty = 1) => {
    bot.send({ t: 'svc', kind: 'shop', action: 'buy', id, qty });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  let g0 = c.gold;
  assert.equal(buy(gear).ok, true);
  assert.equal(c.gold, g0 - sdShopPrice(gear));
  assert.equal(itemCount(c, gear), 1);
  const pot = sdShopStock(f, seed).potions[0];
  g0 = c.gold;
  assert.equal(buy(pot, 2).ok, true);
  assert.equal(c.gold, g0 - ITEMS[pot].price * 2);
  assert.equal(itemCount(c, pot), 2);
  // 店に ない 品は 買えない
  const other = Object.keys(ITEMS).find((id) => ITEMS[id].src === 'sd');
  g0 = c.gold;
  assert.equal(buy(other).ok, false);
  assert.equal(c.gold, g0);
});

test('お店だけの 回復薬: フィールドでも 戦いでも 効く（HPと MP・全員・生き返り）', async () => {
  const { bot, c } = await hero(45);
  const st = computeStats(c);
  addItem(c, 'sd_deep_water', 1);
  c.hp = 10;
  c.mp = 0;
  bot.send({ t: 'menu', action: 'useItem', id: 'sd_deep_water', ref: 'self' });
  await bot.settle();
  assert.ok(c.hp >= Math.min(st.maxHp, 410) && c.mp >= Math.min(st.maxMp, 80), `${c.hp} ${c.mp}`);
  assert.equal(itemCount(c, 'sd_deep_water'), 0);
  // 戦い
  const mk = (id, job) => {
    const ch = newCharacter({ id, name: id, look: {}, job });
    ch.level = 40;
    ch.jobs[job] = { lv: 10, b: jobBattlesForLevel(10, JOBS[job].tier) };
    fullHeal(ch);
    return ch;
  };
  const me = mk('me', 'warrior'), pal = mk('pal', 'warrior'), dead = mk('dead', 'mage'); // 生き返りの 呪文を 使わない 2人
  const b = new Battle({ rng: makeRng(4), allies: [{ char: me, controller: 's1' }, { char: pal, auto: true, kind: 'support' }, { char: dead, auto: true, kind: 'support' }], enemies: ['pururin'], canFlee: false });
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  b.enemies[0].maxHp = b.enemies[0].hp = 1e7; // 戦いが 終わらない ように
  const [A, B, D] = b.allies;
  for (const x of b.allies) x.actions = undefined;
  const use = (id, target) => {
    for (let i = 0; i < 600 && !(A.ready && !A.queued); i++) b.tick(50);
    assert.ok(A.ready, 'ready');
    assert.equal(b.command(A.id, { type: 'item', id, target }, 's1').ok, true);
    for (let i = 0; i < 40; i++) b.tick(50);
  };
  A.hp = 5; A.mp = 0; B.hp = 5;
  use('sd_deep_water', A.id);
  assert.ok(A.hp > 300 || A.hp === A.maxHp, `HP ${A.hp}`);
  assert.ok(A.mp >= Math.min(A.maxMp, 80), `MP ${A.mp}`);
  A.hp = 5; B.hp = 5;
  use('sd_heal_bell');
  assert.ok(A.hp > 200 || A.hp === A.maxHp, '全員');
  assert.ok(B.hp > 200 || B.hp === B.maxHp, '全員');
  D.hp = 0; D.alive = false;
  use('sd_phoenix', D.id);
  assert.ok(D.alive && D.hp === D.maxHp, '生き返って HPまんたん');
});

// ───────────── 強さ（上限なし）─────────────
test('強さ: 上限なし（50階 Lv50前後・90階 Lv90前後・200階 Lv200前後）。999階まで 数が あふれない・NaN に ならない', () => {
  assert.ok(Math.abs(sdEnemyLv(50) - 50) <= 5);
  assert.ok(Math.abs(sdEnemyLv(90) - 90) <= 5);
  assert.ok(sdEnemyLv(200) >= 195);
  for (let f = 1; f < SD_MAX; f++) {
    assert.ok(sdEnemyLv(f + 1) > sdEnemyLv(f), `${f}階`);
    assert.ok(sdPower(f + 1) >= sdPower(f));
    assert.ok(Number.isFinite(sdPower(f)) && Number.isFinite(sdEnemyLv(f)));
  }
  const NUM = ['maxHp', 'hp', 'maxMp', 'mp', 'atk', 'dfn', 'agi', 'mag', 'healPow', 'lv', 'rewardK'];
  let prevHp = 0;
  for (const f of [1, 30, 50, 90, 150, 200, 500, SD_MAX]) {
    const zone = ensureSdTable(f);
    const list = [...new Set(ENCOUNTER_TABLES[zone].flatMap((e) => e.group.map((g) => g[0])))];
    let hp = 0;
    for (const sp of list) {
      const m = scaleEnemy(enemyFromSpecies(sp), sdEnemyLv(f), sdPower(f));
      for (const k of NUM) {
        if (k === 'rewardK' && m.rewardK === undefined) continue;
        assert.ok(Number.isFinite(m[k]) && m[k] >= 0 && m[k] < 1e12, `${f}階 ${sp} ${k}=${m[k]}`);
      }
      assert.ok(m.maxHp >= 1);
      assert.equal(m.lv, sdEnemyLv(f));
      hp += m.maxHp;
      // もらえる 経験値・お金も あふれない
      const bonus = scaledRewardBonus({ combatants: [{ ...m, side: 'enemy', alive: false, species: sp }] });
      assert.ok(Number.isFinite(bonus.exp) && Number.isFinite(bonus.gold) && bonus.exp < 1e12, `${f}階 ${sp} exp`);
    }
    hp /= list.length;
    assert.ok(hp > prevHp, `${f}階 HP ${hp}`);
    prevHp = hp;
    // 番人も（数は 担当A の 数式。ここでは あふれない ことだけ）
    const g = FIXED_ENCOUNTERS[sdGuardEncounter(Math.max(10, Math.floor(f / 10) * 10))];
    const gm = scaleEnemy(enemyFromSpecies(g.group[0][0]), g.enemyLv, g.enemyPow);
    for (const k of NUM) if (gm[k] !== undefined) assert.ok(Number.isFinite(gm[k]), `番人 ${f}階 ${k}`);
  }
});

// ───────────── 色ちがい ─────────────
test('色ちがい: makeVariant・registerVariant（図鑑の 数・Object.keys には 出ない）。絵は もとの 魔物の 絵に 色', () => {
  const n0 = Object.keys(MONSTERS).length;
  const id = registerVariant('frost_wolf', 'dark');
  assert.equal(id, variantId('frost_wolf', 'dark'));
  assert.equal(registerVariant('frost_wolf', 'dark'), id, '何回 よんでも おなじ');
  assert.equal(Object.keys(MONSTERS).length, n0, '数えない');
  assert.ok(id in MONSTERS && MONSTERS[id]);
  const base = MONSTERS.frost_wolf, v = MONSTERS[id];
  assert.equal(v.name, `ダーク${base.name}`);
  assert.ok(v.hp > base.hp && v.str > base.str && v.exp > base.exp && v.gold >= base.gold);
  assert.equal(v.lv, base.lv);
  assert.deepEqual(variantOf(id), { base: 'frost_wolf', kind: 'dark' });
  assert.equal(baseSpecies(id), 'frost_wolf');
  assert.equal(baseSpecies('frost_wolf'), 'frost_wolf');
  assert.equal(v.tint.hueTo, VARIANT_KINDS.dark.tint.hueTo);
  assert.ok(MONSTER_ART[v.art], '絵は もとの 魔物の 絵');
  assert.equal(makeVariant('no_such', 'dark'), null);
  assert.equal(makeVariant('frost_wolf', 'no_kind'), null);
  assert.equal(makeVariant(id, 'gold'), null, '色ちがいの 色ちがいは 作らない');
  // 戦い・落とす 物・仲間
  const e = enemyFromSpecies(id);
  assert.equal(e.name, v.name);
  assert.ok(e.maxHp > enemyFromSpecies('frost_wolf').maxHp);
  const kinds = (sp) => monsterDrops(sp).filter((x) => x.kind !== 'mat').map((x) => `${x.kind}:${x.item}`);
  assert.deepEqual(kinds(id), kinds('frost_wolf'), '落とす 物は もとと おなじ（素材のぞく）');
  assert.equal(befriendChance({ companions: [] }, id), 0, '仲間に ならない');
  assert.equal(v.noBefriend, true);
  // 宝の洞窟の 主の ような 色がえの 絵の 魔物でも（色を かさねる）
  const t = makeVariant('tm_golem', 'gold');
  assert.equal(t.art, MONSTERS.tm_golem.art);
  assert.equal(t.tint.hueTo, VARIANT_KINDS.gold.tint.hueTo);
  for (const [k, kv] of Object.entries(VARIANT_KINDS)) {
    assert.ok(kv.prefix && kv.desc && kv.exp > 1 && kv.k.hp >= 1, k);
  }
});

test('色ちがい: 40階から まざる（深いほど 多い・強い しゅるいも）。とうろく ずみ・絵が ある・強い', () => {
  assert.equal(SD_VARIANT_FROM, 40);
  const vShare = (f) => {
    const t = ENCOUNTER_TABLES[ensureSdTable(f)];
    const W = t.reduce((s, e) => s + e.w, 0);
    return t.filter((e) => e.group.some((g) => variantOf(g[0]))).reduce((s, e) => s + e.w, 0) / W;
  };
  for (let f = 1; f < 40; f++) if (!isRestFloor(f)) assert.equal(vShare(f), 0, `${f}階`);
  for (const f of [41, 52, 66, 93, 140, 400]) {
    assert.ok(Math.abs(vShare(f) - sdVariantRate(f)) < 0.01, `${f}階 ${vShare(f)}`);
  }
  assert.ok(sdVariantRate(90) > sdVariantRate(41));
  const seen = new Set();
  for (let f = 40; f <= 300; f++) {
    if (isRestFloor(f)) continue;
    for (const e of ENCOUNTER_TABLES[ensureSdTable(f)]) {
      for (const [sp] of e.group) {
        assert.ok(MONSTERS[sp], `${f}階 ${sp}`);
        const vo = variantOf(sp);
        if (!vo) continue;
        seen.add(vo.kind);
        assert.ok(MONSTER_ART[MONSTERS[sp].art] || MONSTER_ART[MONSTERS[MONSTERS[sp].art]?.art], `${sp} の 絵`);
        assert.ok(!MONSTERS[sp].boss && !MONSTERS[sp].name.startsWith(`${VARIANT_KINDS[vo.kind].prefix}${VARIANT_KINDS[vo.kind].prefix}`));
        if (f < 50) assert.ok(['dark', 'gold'].includes(vo.kind), `${f}階 ${vo.kind}`);
        // 強い（おなじ 階の もとの 魔物より）
        const a = scaleEnemy(enemyFromSpecies(sp), sdEnemyLv(f), sdPower(f));
        const b = scaleEnemy(enemyFromSpecies(vo.base), sdEnemyLv(f), sdPower(f));
        assert.ok(a.maxHp > b.maxHp && MONSTERS[sp].exp > MONSTERS[vo.base].exp, sp);
      }
    }
  }
  assert.deepEqual([...seen].sort(), ['dark', 'gold', 'red', 'shadow']);
  // とうろくは 読みこんだ ときに すんでいる（画面でも 引ける）。もう一度 よんでも ふえない
  const ids = registerSdVariants();
  assert.ok(ids.length >= sdVariantBases().length * 3, `${ids.length}`);
  for (const id of ids) assert.ok(Object.getOwnPropertyDescriptor(MONSTERS, id)?.enumerable === false, id);
});

// ───────────── 文字 ─────────────
test('文字: 新しい ファイルも 漢字の きまり（使えない 漢字・スペース なし）', () => {
  const files = gameFiles();
  for (const f of ['data/secret-shop.js', 'data/items-secret.js', 'data/variants.js', 'data/secret.js', 'world/secret.js', 'maps/secret-dungeon.js']) {
    const file = files.find((x) => x.endsWith(f));
    assert.ok(file, `${f} が gameFiles に ある`);
    assert.deepEqual(checkFile(file).filter((p) => p.kind !== 'kana'), [], f);
  }
  for (const id of Object.keys(SD_POTIONS)) assert.ok(!/ /.test(ITEMS[id].name + ITEMS[id].desc));
  for (const id of registerSdVariants()) assert.ok(!/[ 　]/.test(MONSTERS[id].name), id);
});
