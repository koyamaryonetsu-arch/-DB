// 合体技の よやく（仲間の ゲージが たまったら 出る）・はじめは 効果が わからない・強さ、きずなゲージ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { Battle, BOND_GAIN, DUAL_POWER, normBattleSettings, DEFAULT_BATTLE_SPEED, DEFAULT_TEXT_SPEED } from '../public/js/shared/battle.js';
import { DUAL_TECHS } from '../public/js/shared/data/dual.js';
import { makeRng } from '../public/js/shared/rng.js';

function mk(job, name, lv = 20, jobLv = 6) {
  const c = newCharacter({ id: name, name, job });
  gainExp(c, expForLevel(lv));
  c.jobs[job].lv = jobLv;
  fullHeal(c);
  return c;
}

// ヒナ（魔法使い）と ミーナ（僧侶）
function duo({ mateHuman = false, heroAuto = false, autoDual = null, seed = 3 } = {}) {
  const hero = mk('mage', 'ヒナ');
  const mate = mk('priest', 'ミーナ');
  const b = new Battle({
    rng: makeRng(seed),
    allies: [{ char: hero, controller: 's1', auto: heroAuto, autoDual }, mateHuman ? { char: mate, controller: 's2' } : { char: mate, kind: 'support', auto: true }],
    enemies: ['kobushi', 'kobushi'],
  });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 3000;
  }
  return b;
}

function readyUp(b, a) {
  for (let i = 0; i < 800 && !a.ready; i++) b.tick(50);
  return a.ready;
}

function runUntil(b, pred, ms = 40000) {
  const evs = [];
  for (let t = 0; t < ms; t += 50) {
    evs.push(...b.tick(50));
    if (evs.some(pred)) break;
  }
  return evs;
}

test('合体技の よやく: 仲間の ゲージが まだでも えらべて、たまったら いっしょに 出る', () => {
  const b = duo();
  const [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 5;
  assert.equal(b.dualOptionsFor(a).length, 0, 'すぐに 出せる ものは ない');
  const opts = b.dualOptionsFor(a, null, false, true);
  assert.ok(opts.some((o) => o.id === 'dt_honoo_tatsumaki' && !o.now), 'よやくなら えらべる');
  const r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.equal(r.ok, true);
  assert.equal(r.waiting, true);
  assert.equal(a.ready, false);
  assert.equal(a.waitDual.partner, m.id);
  const evs = runUntil(b, (e) => e.t === 'act' && e.id === a.id);
  assert.ok(evs.some((e) => e.t === 'dualWait' && e.lines[0].includes('力をためている')));
  const act = evs.find((e) => e.t === 'act' && e.id === a.id);
  assert.equal(act.dual?.id, 'dt_honoo_tatsumaki', '仲間の ゲージが たまったら 出た');
  assert.ok(!evs.some((e) => e.t === 'act' && e.id === m.id), '仲間は べつに 動かない（番は 合体技に 使った）');
  assert.equal(a.waitDual, null);
  assert.equal(m.atb, 0);
});

test('合体技の よやく: 仲間の ゲージが 半分では 出ない（たまるまで まつ）', () => {
  const b = duo();
  const [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 60;
  assert.ok(!b.dualOptionsFor(a, null, false, true).find((o) => o.id === 'dt_honoo_tatsumaki').now, '半分 いじょうでも まだ すぐには 出ない');
  const r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.equal(r.waiting, true);
  const evs = runUntil(b, (e) => e.t === 'act' && e.id === a.id);
  assert.ok(evs.some((e) => e.t === 'act' && e.dual), '出た');
  assert.ok(m.atb < 50, '仲間の ゲージは 使いきった');
});

test('合体技の よやく: 仲間が ほかの 行動を まっていても よやく でき、つぎの 番で 出る（2回 動かない）', () => {
  const b = duo();
  const [a, m] = b.allies;
  readyUp(b, a);
  // 仲間は もう ふつうの 行動を まっている
  if (!m.queued) {
    m.atb = 100;
    b.onReady(m);
  }
  assert.ok(m.queued);
  const o = b.dualOptionsFor(a, null, false, true).find((x) => x.id === 'dt_honoo_tatsumaki');
  assert.ok(o && !o.now, 'よやくなら えらべる');
  assert.equal(b.dualOptionsFor(a).length, 0, 'すぐには 出せない');
  const r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.equal(r.waiting, true);
  const evs = runUntil(b, (e) => e.t === 'act' && e.dual);
  const mActs = evs.filter((e) => e.t === 'act' && e.id === m.id);
  assert.equal(mActs.length, 1, 'まっていた 行動を 1回');
  const dual = evs.find((e) => e.t === 'act' && e.dual);
  assert.ok(dual, '合体技が 出た');
  assert.ok(evs.indexOf(mActs[0]) < evs.indexOf(dual), 'まっていた 行動の あとで 合体技');
});

test('合体技: 自分が うごかす 仲間の 番が 来ていれば すぐ 出る', () => {
  const hero = mk('mage', 'ヒナ');
  const mate = mk('priest', 'ミーナ');
  const b = new Battle({ rng: makeRng(5), allies: [{ char: hero, controller: 's1' }, { char: mate, kind: 'support', controller: 's1' }], enemies: ['kobushi'] });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 3000; }
  const [a, m] = b.allies;
  readyUp(b, a);
  readyUp(b, m);
  assert.ok(a.ready && m.ready);
  const r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.equal(r.ok, true);
  assert.ok(!r.waiting, 'またない');
  assert.equal(m.ready, false, '仲間の 番を 使った');
  assert.equal(m.queued, true);
});

test('合体技の よやく: やめる・仲間が たおれたら 自分の 番に もどる', () => {
  let b = duo();
  let [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 0;
  b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.ok(a.waitDual);
  assert.equal(b.command(a.id, { type: 'dualCancel' }, 's1').ok, true);
  assert.equal(a.waitDual, null);
  assert.equal(a.ready, true, 'また コマンドを えらべる');
  // たおれる
  b = duo();
  [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 0;
  b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  m.alive = false;
  m.hp = 0;
  const evs = [];
  for (let i = 0; i < 4; i++) evs.push(...b.tick(50));
  const end = evs.find((e) => e.t === 'dualWaitEnd');
  assert.ok(end.lines[0].includes('参加できなくなった'));
  assert.equal(a.ready, true);
});

test('オートで ねらう 合体技は もう ない（前の セーブに のこっていても 使わない）', () => {
  const hero = mk('mage', 'ヒナ');
  hero.battleSettings = { autoDual: 'dt_honoo_tatsumaki' };
  const mate = mk('priest', 'ミーナ');
  const b = new Battle({ rng: makeRng(3), allies: [{ char: hero, controller: 's1', auto: true }, { char: mate, kind: 'support', auto: true }], enemies: ['kobushi', 'kobushi'] });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 3000; }
  const evs = runUntil(b, () => false, 20000);
  assert.ok(evs.some((e) => e.t === 'act' && e.id === b.allies[0].id), 'オートで 動いている');
  assert.ok(!evs.some((e) => e.t === 'act' && e.dual), '合体技は 出さない');
  assert.equal(b.command(b.allies[0].id, { type: 'setAutoDual', id: 'dt_honoo_tatsumaki' }, 's1').ok, false, 'えらぶ コマンドも ない');
});

test('合体技の 強さ: 2人が ふつうに 技を 出した ときの 合計より ずっと 強い（人数で 上がる）', () => {
  assert.ok(DUAL_POWER[2] >= 1.6 && DUAL_POWER[2] <= 2, `2人技 ${DUAL_POWER[2]}倍`);
  assert.ok(DUAL_POWER[3] >= 2.1, `3人技 ${DUAL_POWER[3]}倍`);
  assert.ok(DUAL_POWER[4] >= 2.8, `4人技 ${DUAL_POWER[4]}倍`);
  // 炎の竜巻: メラ＋バギの ころより、メラゾーマ＋バギマの ほうが 強い（2人が 強くなるほど 強い）
  const run = (lv) => {
    const b = duo();
    const [a, m] = b.allies;
    for (const x of [a, m]) {
      x.mag = lv;
      x.mp = 999;
    }
    readyUp(b, a);
    b.queue = b.queue.filter((q) => q.id !== m.id);
    m.queued = false;
    m.atb = 100;
    b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
    const act = runUntil(b, (e) => e.t === 'act' && e.dual).find((e) => e.t === 'act' && e.dual);
    return act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
  };
  assert.ok(run(120) > run(20), '魔力が 高いほど 強い');
});

test('きずなゲージは たまりにくい', () => {
  const b = duo();
  b.bond = 0;
  b.addBond(10);
  assert.equal(b.bond, Math.round(10 * BOND_GAIN * 100) / 100);
  assert.ok(BOND_GAIN < 0.5);
  b.addBond(-100);
  assert.equal(b.bond, 0);
});

test('戦いの 速さと 文字の 速さは べつ（前の「ふつう」は 少し ゆっくりに）', () => {
  assert.deepEqual(normBattleSettings({}), { speed: DEFAULT_BATTLE_SPEED, textSpeed: DEFAULT_TEXT_SPEED });
  assert.equal(normBattleSettings({ speed: 1 }).speed, DEFAULT_BATTLE_SPEED, '前の ふつう');
  assert.equal(normBattleSettings({ speed: 0.75 }).speed, 0.75);
  assert.equal(normBattleSettings({ sv: 2, speed: 1, textSpeed: 0.55 }).speed, 1);
  assert.equal(normBattleSettings({ sv: 2, speed: 1, textSpeed: 0.55 }).textSpeed, 0.55);
  // 文字が ゆっくり なら 1つの 行動の じかんも ながく
  const fast = new Battle({ rng: makeRng(1), allies: [{ char: mk('warrior', 'a') }], enemies: ['pururin'], textSpeed: 1.25 });
  const slow = new Battle({ rng: makeRng(1), allies: [{ char: mk('warrior', 'a') }], enemies: ['pururin'], textSpeed: 0.55 });
  assert.ok(slow.pace(450, 380, 3) > fast.pace(450, 380, 3));
});

test('合体技は 一度 使うと 効果が わかる（出した 2人の もちぬしの キャラに のこる）', async () => {
  const { GameWorld } = await import('../public/js/shared/world/world.js');
  const { recruitNpc, afterRosterChange, partyOf } = await import('../public/js/shared/world/party.js');
  const { startFieldBattle } = await import('../public/js/shared/world/battles.js');
  const { dualKnown } = await import('../public/js/shared/data/dual.js');
  const { Bot, tickN } = await import('./helpers.js');
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'ヒナ');
  await bot.login();
  await bot.createAndPlay('mage');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  gainExp(c, expForLevel(20) - c.exp);
  c.jobs.mage.lv = 6;
  fullHeal(c);
  recruitNpc(world, bot.s, 'npc_mina', { force: true });
  afterRosterChange(world, bot.s);
  const mina = partyOf(world, bot.s).supports.find((x) => x.key === 'npc_mina').char;
  gainExp(mina, expForLevel(20) - mina.exp);
  mina.jobs.priest = { lv: 6, b: 0 };
  fullHeal(mina);
  assert.equal(dualKnown(c, 'dt_honoo_tatsumaki'), false, 'はじめは わからない');
  bot.s.map = 'overworld';
  const ctx = startFieldBattle(world, bot.s, { id: 'dz', sp: 'kobushi', group: ['kobushi'], zone: 'outskirts', table: 'outskirts', busy: false });
  const b = ctx.battle;
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 3000; }
  const a = b.allies.find((x) => x.charId === c.id);
  const m = b.allies.find((x) => x !== a);
  for (let i = 0; i < 800 && !a.ready; i++) await tickN(world, 1);
  const o = b.dualOptionsFor(a, null, false, true).find((x) => x.partner === m.id);
  assert.ok(o, `${m.name}と 出せる 合体技が ある`);
  bot.send({ t: 'battle', actor: a.id, cmd: { type: 'dual', id: o.id, partner: m.id, target: b.enemies[0].id } });
  for (let i = 0; i < 3000 && !dualKnown(c, o.id); i++) await tickN(world, 1);
  assert.equal(dualKnown(c, o.id), true, '使った あとは わかる');
  assert.equal(dualKnown(c, DUAL_ORDER_OTHER(o.id)), false, 'ほかの 合体技は まだ わからない');
});

function DUAL_ORDER_OTHER(id) {
  return Object.keys(DUAL_TECHS).find((k) => k !== id);
}
