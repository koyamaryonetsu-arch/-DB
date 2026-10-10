// 設定の「敵の強さ」（ふつう・ハード 1.2倍・ベリーハード 1.5倍・スーパーハード 2倍。data/difficulty.js）
// ・魔物の HP（最大と 今）・MP・攻撃・守り・素早さ・魔力が その 倍（はじめの 魔物・物語の 戦い・ボス・宝の洞窟・とちゅうで 来た 魔物・まぼろしの 分身）
// ・パーティーでは リーダーの 設定。ひとりなら 自分の 設定。サーバーで たしかめる。前の セーブは ふつう
// ・もらえる 経験値・ゴールド・落とす 物は かわらない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Battle, enemyFromSpecies } from '../public/js/shared/battle.js';
import { decideMonster } from '../public/js/shared/ai.js';
import { difficultyOf, normDifficulty, strengthenEnemy, ENEMY_RATES, ENEMY_RATE_NAMES, rewardExp } from '../public/js/shared/data/difficulty.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { scaleEnemy, scaledRewardBonus } from '../public/js/shared/data/treasure.js';
import { startFieldBattle, startFixedBattle, enemyRateFor } from '../public/js/shared/world/battles.js';
import { partyOf } from '../public/js/shared/world/party.js';
import { gainExp, expForLevel, computeStats } from '../public/js/shared/stats.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { makeChar } from '../tools/sim.js';
import { Bot, tickN } from './helpers.js';

const STATS = ['maxHp', 'hp', 'maxMp', 'mp', 'atk', 'dfn', 'agi', 'mag', 'healPow'];
const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };
const PARTY = () => [makeChar('warrior', 30, 10, 'せんし', 23), makeChar('priest', 30, 10, 'そうりょ', 23)];
const battleOf = (enemies, opts = {}) => new Battle({ rng: makeRng(opts.seed ?? 3), allies: PARTY().map((c) => ({ char: c, kind: 'support', auto: true })), enemies, canFlee: false, ...opts });
// base の 強さを rate 倍（四捨五入）に した ものと おなじか
function assertScaled(e, base, rate, label) {
  for (const k of STATS) assert.equal(e[k], Math.round(base[k] * rate), `${label}: ${k} ${base[k]}×${rate}`);
}

test('敵の強さ: 4つの 強さ。前の セーブ（設定が ない・知らない 値）は ふつう', () => {
  assert.deepEqual(ENEMY_RATES, [1, 1.2, 1.5, 2]);
  assert.deepEqual(ENEMY_RATES.map((r) => ENEMY_RATE_NAMES[r]), ['ふつう', 'ハード', 'ベリーハード', 'スーパーハード']);
  assert.equal(difficultyOf({}).enemy, 1, '設定が ない');
  assert.equal(difficultyOf({ difficulty: { exp: 0.5, mainMarks: false } }).enemy, 1, '前の 版の 設定（敵の強さが ない）');
  for (const bad of [3, 1.3, '2', -1, 0, null, true, NaN]) assert.equal(difficultyOf({ difficulty: { enemy: bad } }).enemy, 1, `知らない 値 ${bad}`);
  for (const r of ENEMY_RATES) assert.equal(difficultyOf({ difficulty: { enemy: r } }).enemy, r);
});

test('敵の強さ: 設定を ととのえる（知らない 値は かえない・ぜんぶ ふつうなら のこさない）', () => {
  assert.deepEqual(normDifficulty(undefined, { enemy: 1.5 }), { mainMarks: true, subMarks: true, exp: 1, enemy: 1.5 });
  const d = normDifficulty(undefined, { enemy: 2, exp: 0.75 });
  for (const bad of [3, 1.25, '1.5', -2, { x: 1 }]) assert.deepEqual(normDifficulty(d, { enemy: bad }), d, `知らない 値 ${JSON.stringify(bad)}`);
  assert.deepEqual(normDifficulty(d, { exp: 1 }), { mainMarks: true, subMarks: true, exp: 1, enemy: 2 }, '敵の強さだけ のこる');
  assert.equal(normDifficulty(normDifficulty(d, { exp: 1 }), { enemy: 1 }), undefined, 'ぜんぶ ふつう');
});

test('敵の強さ: 1体の 強さを ぜんぶ かける（HP・MP・攻撃・守り・素早さ・魔力。レベルと ほうしゅうは そのまま）', () => {
  const base = enemyFromSpecies('shadow_mage');
  for (const r of [1.2, 1.5, 2]) {
    const m = strengthenEnemy(enemyFromSpecies('shadow_mage'), r);
    assertScaled(m, base, r, `影の魔道士 ${r}倍`);
    assert.equal(m.lv, base.lv, 'レベルは そのまま');
    assert.equal(m.rewardK, undefined, 'ほうしゅうの 倍率は つかない');
  }
  assert.deepEqual(strengthenEnemy(enemyFromSpecies('shadow_mage'), 1), base, 'ふつうは かわらない');
  assert.deepEqual(strengthenEnemy(enemyFromSpecies('shadow_mage'), 3), base, '知らない 倍率は かけない');
});

test('敵の強さ: たたかいの はじめの 魔物は みんな その 倍（ボスも）。画面にも 倍率が とどく', () => {
  for (const r of ENEMY_RATES) {
    const b = battleOf(['shadow_mage', 'wolf', 'goldoon'], { enemyRate: r });
    for (const e of b.enemies) assertScaled(e, enemyFromSpecies(e.species), r, `${e.name} ${r}倍`);
    assert.equal(b.snapshot().enemyRate, r);
    const snapE = b.snapshot().combatants.find((c) => c.species === 'goldoon');
    assert.equal(snapE.maxHp, Math.round(MONSTERS.goldoon.hp * r), 'ボスの HP（画面）');
  }
  const plain = new Battle({ rng: makeRng(1), allies: [], enemies: ['wolf'] });
  assert.equal(plain.enemyRate, 1, '何も いわなければ ふつう');
  assert.equal(new Battle({ rng: makeRng(1), allies: [], enemies: ['wolf'], enemyRate: 1.7 }).enemyRate, 1, '知らない 倍率は ふつう');
});

test('敵の強さ: とちゅうで 来た 魔物も おなじ 倍（仲間を呼ぶ・ボスが 呼んだ 手下）', () => {
  // 仲間を呼ぶ（はぐれウルフの 遠ぼえ）
  const b = battleOf(['wolf'], { enemyRate: 1.5 });
  const ev = { lines: [], upd: [] };
  b.callHelp(b.enemies[0], { type: 'callHelp', species: 'wolf', count: 2 }, ev);
  assert.equal(b.enemies.length, 3);
  for (const e of b.enemies) assertScaled(e, enemyFromSpecies('wolf'), 1.5, `${e.name}（仲間を呼ぶ）`);
  // ボスの だんかい（嵐の将軍ストルムが HP 6わりで 嵐の兵を 呼ぶ）
  const b2 = battleOf(['storm_general'], { enemyRate: 2, boss: true });
  const boss = b2.enemies[0];
  assertScaled(boss, enemyFromSpecies('storm_general'), 2, 'ストルム');
  boss.hp = Math.floor(boss.maxHp * 0.5);
  const ev2 = { lines: [], upd: [] };
  b2.checkPhase(boss, ev2);
  const soldiers = b2.enemies.filter((e) => e.species === 'storm_soldier');
  assert.equal(soldiers.length, 2, ev2.postLines?.join('/'));
  for (const s of soldiers) assertScaled(s, enemyFromSpecies('storm_soldier'), 2, `${s.name}（ボスが 呼んだ）`);
  // ふつうの ときは 呼んだ 魔物も ふつう
  const b3 = battleOf(['wolf'], { enemyRate: 1 });
  b3.callHelp(b3.enemies[0], { type: 'callHelp', species: 'wolf', count: 1 }, { lines: [], upd: [] });
  assertScaled(b3.enemies[1], enemyFromSpecies('wolf'), 1, 'ふつう');
});

test('敵の強さ: まぼろしの 分身も 本物と おなじ HP（ダメージの あとも・作りなおしても）。分身の 攻撃は 本物より 弱い まま', () => {
  const evOf = (c) => ({ t: 'act', id: c.id, lines: [], upd: [], fx: null });
  for (const r of [1.2, 1.5, 2]) {
    const b = new Battle({ rng: makeRng(13), allies: PARTY().map((c) => ({ char: c, kind: 'support', auto: true })), enemies: ['zaid_minister', 'zaid_minister', 'zaid_minister'], boss: true, canFlee: false, enemyRate: r });
    const real = b.enemies.find((e) => e.shade);
    const clones = b.enemies.filter((e) => e.clone);
    assert.equal(clones.length, 2);
    const base = enemyFromSpecies('zaid_minister');
    assertScaled(real, base, r, `本物 ${r}倍`);
    for (const x of clones) {
      assert.equal(x.maxHp, real.maxHp, '分身の 最大HPも おなじ');
      assert.equal(x.hp, real.hp, '分身の HPも おなじ');
      for (const k of ['maxMp', 'dfn', 'agi', 'mag']) assert.equal(x[k], real[k], `分身の ${k}`);
      assert.equal(x.atk, Math.round(real.atk * MONSTERS.zaid_minister.mirage.cloneAtk), '分身の 攻撃は 本物の 強さから');
      assert.ok(x.atk < real.atk);
    }
    // 本物に ダメージ → 分身の HPも おなじに 見える
    b.damage(b.allies[0], real, 1234, evOf(b.allies[0]));
    assert.equal(real.hp, real.maxHp - 1234);
    for (const x of clones) assert.equal(x.hp, real.hp, 'ダメージの あとも おなじ HP');
    // 分身を 消して、本物が まぼろしを 作りなおす
    for (const x of clones) b.perform(b.allies[0], { type: 'attack', target: x.id }, evOf(b.allies[0]));
    assert.ok(clones.every((x) => !x.alive));
    let made = false;
    for (let i = 0; i < 4 && !made; i++) {
      const ev = evOf(real);
      b.cur = ev;
      const cmd = decideMonster(b, real);
      b.perform(real, cmd, ev);
      b.cur = null;
      made = cmd.id === MONSTERS.zaid_minister.mirage.remake;
    }
    assert.ok(made, 'まぼろしを 作りなおした');
    for (const x of clones) {
      assert.ok(x.alive);
      assert.equal(x.hp, real.hp, '作りなおした 分身も 本物と おなじ HP');
      assert.equal(x.maxHp, real.maxHp);
    }
  }
});

test('敵の強さ: 宝の洞窟の 強さ（地図の レベル）の 上に かける。レベルと ほうしゅうの 倍率（rewardK）は そのまま', () => {
  const mod = (m) => scaleEnemy(m, 20);
  const base = scaleEnemy(enemyFromSpecies('skeleton'), 20);
  assert.ok(base.maxHp > MONSTERS.skeleton.hp, '地図の レベルで 強く なっている');
  // 強くした ぶんの ほうしゅう（宝の洞窟。たおした 魔物）
  const bonusOf = (r) => {
    const b = battleOf(['skeleton', 'skeleton'], { enemyMod: mod, enemyRate: r });
    for (const e of b.enemies) { e.alive = false; e.hp = 0; }
    return scaledRewardBonus(b);
  };
  assert.ok(bonusOf(1).exp > 0 && bonusOf(1).gold > 0);
  for (const r of ENEMY_RATES) {
    const b = battleOf(['skeleton', 'skeleton'], { enemyMod: mod, enemyRate: r });
    for (const e of b.enemies) {
      assertScaled(e, base, r, `がいこつ剣士（宝の洞窟）${r}倍`);
      assert.equal(e.lv, 20);
      assert.equal(e.rewardK, base.rewardK, 'ほうしゅうの 倍率は 地図の レベルだけ');
    }
    assert.deepEqual(bonusOf(r), bonusOf(1), `${r}倍でも 宝の洞窟の ほうしゅうは おなじ`);
  }
});

// ───────────── 世界（サーバー）の 中で ─────────────
async function solo(seed = 21, job = 'warrior') {
  const world = new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(15) - c.exp);
  c.hp = computeStats(c).maxHp;
  Object.assign(bot.s, { map: 'overworld', x: FIELD.x, y: FIELD.y });
  return { world, bot, c };
}
const lastMenu = (bot) => bot.msgs.filter((m) => m.t === 'menuRes').pop();
const sym = (group) => ({ id: 'x' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false });

test('敵の強さ: メニューの 設定で のこり、サーバーが たしかめる（知らない 値は ことわる）', async () => {
  const { bot, c } = await solo();
  bot.send({ t: 'menu', action: 'settings', difficulty: { enemy: 1.5 } });
  assert.equal(lastMenu(bot).ok, true);
  assert.equal(c.difficulty.enemy, 1.5);
  assert.equal(bot.char.difficulty.enemy, 1.5, 'クライアントにも とどく');
  for (const bad of [3, '2', 1.1, -1, null]) {
    bot.send({ t: 'menu', action: 'settings', difficulty: { enemy: bad } });
    assert.equal(c.difficulty.enemy, 1.5, `知らない 値 ${bad} では かわらない`);
  }
  // ほかの 設定を かえても のこる
  bot.send({ t: 'menu', action: 'settings', difficulty: { exp: 0.5 } });
  assert.deepEqual(c.difficulty, { mainMarks: true, subMarks: true, exp: 0.5, enemy: 1.5 });
  bot.send({ t: 'menu', action: 'settings', difficulty: { exp: 1, enemy: 1 } });
  assert.equal(c.difficulty, undefined, 'ぜんぶ ふつうに もどすと のこさない');
});

test('敵の強さ: フィールドの 戦いと 物語の 戦い（ボス）。戦いの はじまりの 知らせにも 倍率', async () => {
  const { world, bot, c } = await solo(22);
  bot.send({ t: 'menu', action: 'settings', difficulty: { enemy: 2 } });
  const ctx = startFieldBattle(world, bot.s, sym(['shadow_mage', 'shadow_mage']));
  for (const e of ctx.battle.enemies) assertScaled(e, enemyFromSpecies('shadow_mage'), 2, 'フィールド');
  const start = bot.msgs.filter((m) => m.t === 'battleStart').pop();
  assert.equal(start.snap.enemyRate, 2, '画面の しるし');
  world.battles.clear();
  bot.s.busy = null;
  // 物語の 戦い（ボス）
  bot.send({ t: 'menu', action: 'settings', difficulty: { enemy: 1.2 } });
  void startFixedBattle(world, bot.s, [bot.s], 'goldoon');
  const fx = [...world.battles.values()].pop();
  assert.equal(fx.opts.fixed, 'goldoon');
  assertScaled(fx.battle.enemies[0], enemyFromSpecies('goldoon'), 1.2, 'ゴルドーン（物語の ボス）');
  assert.equal(bot.msgs.filter((m) => m.t === 'battleStart').pop().snap.enemyRate, 1.2);
  // 前の セーブ（設定が ない）は ふつう
  world.battles.clear();
  bot.s.busy = null;
  delete c.difficulty;
  const ctx3 = startFieldBattle(world, bot.s, sym(['wolf']));
  assertScaled(ctx3.battle.enemies[0], enemyFromSpecies('wolf'), 1, 'ふつう');
  assert.equal(ctx3.battle.snapshot().enemyRate, 1);
});

test('敵の強さ: もらえる 経験値・ゴールド・落とす 物は おなじ', async () => {
  const run = async (rate) => {
    const { world, bot, c } = await solo(31);
    if (rate !== 1) bot.send({ t: 'menu', action: 'settings', difficulty: { enemy: rate } });
    const exp0 = c.exp, gold0 = c.gold;
    const bag0 = JSON.stringify(c.items);
    const ctx = startFieldBattle(world, bot.s, sym(['shadow_mage', 'wolf', 'wolf', 'shadow_mage']));
    assert.equal(ctx.battle.enemyRate, rate);
    for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
    ctx.battle.checkEnd();
    for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
    const end = bot.msgs.filter((m) => m.t === 'battleEnd').pop();
    return { exp: c.exp - exp0, gold: c.gold - gold0, bagChanged: JSON.stringify(c.items) !== bag0, items: JSON.stringify(c.items), lines: end.lines };
  };
  const normal = await run(1);
  assert.equal(normal.exp, rewardExp(28 * 2 + 14 * 2), '経験値（ふつう。きほんの 倍率 0.6）');
  for (const r of [1.2, 1.5, 2]) {
    const hard = await run(r);
    assert.equal(hard.exp, normal.exp, `${r}倍でも 経験値は おなじ`);
    assert.equal(hard.gold, normal.gold, `${r}倍でも ゴールドは おなじ`);
    assert.equal(hard.items, normal.items, `${r}倍でも 落とす 物は おなじ`);
    assert.deepEqual(hard.lines, normal.lines, 'けっかの まども おなじ');
  }
});

test('敵の強さ: パーティーでは リーダーの 設定（さそわれた 人が 魔物に ふれても）。ぬけると 自分の 設定', { timeout: 60000 }, async () => {
  const t0 = Date.now();
  const world = new GameWorld({ offline: false, rng: makeRng(41), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login();
  await kid.login();
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  assert.equal(papa.party.members.length, 2);
  // 戦いを かたづけて（メニューの 設定は 戦いの 中では かえられない）2人を おなじ 場所に
  const place = () => {
    world.battles.clear();
    for (const x of [papa, kid]) Object.assign(x.s, { map: 'overworld', x: FIELD.x, y: FIELD.y, busy: null, battleId: null });
  };
  const fight = (bot) => {
    place();
    return startFieldBattle(world, bot.s, sym(['wolf', 'wolf']));
  };
  // リーダー（パパ）が スーパーハード、ユイは ふつう → ユイが ふれても 2倍
  papa.send({ t: 'menu', action: 'settings', difficulty: { enemy: 2 } });
  assert.equal(kid.party.enemyRate, 2, 'さそわれた 人の 画面にも リーダーの 設定が とどく');
  let ctx = fight(kid);
  assert.equal(ctx.battle.enemyRate, 2);
  for (const e of ctx.battle.enemies) assertScaled(e, enemyFromSpecies('wolf'), 2, 'ユイが ふれた 戦い');
  assert.deepEqual(ctx.sids.sort(), [papa.s.id, kid.s.id].sort(), '2人とも 戦う');
  for (const b of [papa, kid]) assert.equal(b.msgs.filter((m) => m.t === 'battleStart').pop().snap.enemyRate, 2, `${b.name}の 画面`);
  // リーダーが ふつう、ユイが ベリーハード → ふつう
  place();
  papa.send({ t: 'menu', action: 'settings', difficulty: { enemy: 1 } });
  kid.send({ t: 'menu', action: 'settings', difficulty: { enemy: 1.5 } });
  assert.equal(kid.party.enemyRate, 1);
  ctx = fight(kid);
  assert.equal(ctx.battle.enemyRate, 1, 'リーダーの 設定');
  assert.equal(enemyRateFor(world, partyOf(world, kid.s), [kid.s]), 1);
  ctx = fight(papa);
  assert.equal(ctx.battle.enemyRate, 1);
  // ぬけると 自分の 設定
  place();
  kid.send({ t: 'party', action: 'leave' });
  assert.notEqual(kid.s.partyId, papa.s.partyId);
  place();
  ctx = startFieldBattle(world, kid.s, sym(['wolf']));
  assert.equal(ctx.battle.enemyRate, 1.5, 'ひとりに なったら 自分の 設定');
  assertScaled(ctx.battle.enemies[0], enemyFromSpecies('wolf'), 1.5, 'ひとりの ユイ');
});
