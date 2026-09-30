// 合体技の よやく・オートの 合体技・強さ、きずなゲージ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { Battle, BOND_GAIN, dualPartEffect, normBattleSettings, DEFAULT_BATTLE_SPEED, DEFAULT_TEXT_SPEED } from '../public/js/shared/battle.js';
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

test('合体技の よやく: 仲間の ゲージが まだでも えらべて、半分 たまったら いっしょに 出る', () => {
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
  assert.equal(a.waitDual, null);
  assert.equal(m.atb, 0);
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

test('オートの 合体技: 主人公が えらんで おくと、仲間の ゲージが たまった ときに いっしょに 出る', () => {
  const b = duo({ heroAuto: true, autoDual: 'dt_honoo_tatsumaki' });
  const [a, m] = b.allies;
  assert.equal(a.autoDual, 'dt_honoo_tatsumaki');
  const evs = runUntil(b, (e) => e.t === 'act' && e.dual);
  const act = evs.find((e) => e.t === 'act' && e.dual);
  assert.ok(act, '合体技が 出た');
  assert.equal(act.dual.id, 'dt_honoo_tatsumaki');
  assert.deepEqual([act.dual.a, act.dual.b].sort(), [a.id, m.id].sort());
  // 戦いの 中で かえられる
  assert.equal(b.command(a.id, { type: 'setAutoDual', id: null }, 's1').ok, true);
  assert.equal(a.autoDual, null);
});

test('合体技の 強さ: 2人が 出した 呪文から きまる（はじめから 強すぎない）', () => {
  const t = DUAL_TECHS.dt_taishoumetsu;
  const low = dualPartEffect(t, t.parts[0], ['mera', 'hyado']);
  const high = dualPartEffect(t, t.parts[0], ['merazoma', 'hyadaruko']);
  assert.ok(low.base[1] < t.parts[0].base[0], `メラ＋ヒャドの 対消滅は 前より 弱い ${low.base}`);
  assert.ok(high.base[0] > low.base[1], 'つよい 呪文どうしなら つよい');
  const spread = dualPartEffect(DUAL_TECHS.dt_honoo_tatsumaki, DUAL_TECHS.dt_honoo_tatsumaki.parts[0], ['mera', 'bagi']);
  assert.ok(spread.base[1] < 30, `全体の 合体技は ひかえめ ${spread.base}`);
  const phys = dualPartEffect(DUAL_TECHS.dt_cross_break, DUAL_TECHS.dt_cross_break.parts[0], ['daichi', 'daichi']);
  assert.ok(phys.mult < DUAL_TECHS.dt_cross_break.parts[0].mult);
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
