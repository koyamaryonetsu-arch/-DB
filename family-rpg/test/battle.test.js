import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, fillTime } from '../public/js/shared/battle.js';
import { newCharacter, learnedAbilities, mpCost, penaltyFor, changeJob, gainExp, computeStats, mahoukenOptions, fullHeal } from '../public/js/shared/stats.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { makeRng } from '../public/js/shared/rng.js';

function char(job, level = 5, jobLv = 5, id = job) {
  const c = newCharacter({ id, name: id, look: {}, job });
  c.level = level;
  c.jobs[job] = { lv: jobLv, b: jobBattlesForLevel(jobLv, JOBS[job].tier) };
  fullHeal(c);
  return c;
}

function run(b, ms, step = 50) {
  const out = [];
  for (let t = 0; t < ms && !b.over; t += step) out.push(...b.tick(step));
  return out;
}

test('すばやさが 高いほど ゲージが はやく たまる', () => {
  assert.ok(fillTime(60) < fillTime(20));
  assert.ok(fillTime(20) < fillTime(5));
  // 武闘家(はやい) と 戦士(おそい) の こうどう回数を くらべる
  const fast = char('monk', 10, 1, 'はやい');
  const slow = char('warrior', 10, 1, 'おそい');
  const b = new Battle({
    rng: makeRng(1),
    allies: [{ char: fast, auto: true, kind: 'support' }, { char: slow, auto: true, kind: 'support' }],
    enemies: ['goldoon'], // HPが おおいので なかなか おわらない
    canFlee: false,
  });
  // ボスの こうげきで しなないように する
  b.enemies[0].atk = 0;
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  const evs = run(b, 60000);
  const count = (id) => evs.filter((e) => e.t === 'act' && e.id === id).length;
  const monkId = b.allies.find((a) => a.name === 'はやい').id;
  const warId = b.allies.find((a) => a.name === 'おそい').id;
  assert.ok(count(monkId) > count(warId) * 1.3, `monk ${count(monkId)} warrior ${count(warId)}`);
});

test('プレイヤーは ゲージが たまると コマンドを えらべる', () => {
  const me = char('warrior', 5, 3, 'me');
  const b = new Battle({ rng: makeRng(2), allies: [{ char: me, controller: 's1' }], enemies: ['pururin'] });
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  let evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'ready'); i++) evs.push(...b.tick(50));
  const ready = evs.find((e) => e.t === 'ready');
  assert.ok(ready, 'ready event');
  // ほかの人の コマンドは うけつけない
  assert.equal(b.command(ready.id, { type: 'attack', target: b.enemies[0].id }, 'someone').ok, false);
  assert.equal(b.command(ready.id, { type: 'attack', target: b.enemies[0].id }, 's1').ok, true);
  evs = run(b, 5000);
  assert.ok(evs.some((e) => e.t === 'act' && e.id === ready.id));
});

test('ウェイトモードでは えらんでいる あいだ 時間が とまる', () => {
  const me = char('warrior', 5, 3, 'me');
  const b = new Battle({ rng: makeRng(3), allies: [{ char: me, controller: 's1' }], enemies: ['pururin'], wait: true });
  for (let i = 0; i < 400 && !b.allies[0].ready; i++) b.tick(50);
  assert.ok(b.allies[0].ready);
  const t0 = b.time;
  run(b, 3000);
  assert.equal(b.time, t0);
});

test('転職すると まえの職業の 呪文は MPが ふえて いりょくが さがる', () => {
  const c = char('mage', 5, 3, 'm');
  assert.equal(mpCost(c, 'mera'), 2);
  changeJob(c, 'warrior');
  assert.ok(learnedAbilities(c).includes('mera'), 'まえの呪文も つかえる');
  const p = penaltyFor(c, 'mera');
  assert.equal(mpCost(c, 'mera'), 3);
  assert.equal(p.powMult, 0.75);
  // おなじ系統（僧侶）なら かるい
  changeJob(c, 'priest');
  assert.equal(penaltyFor(c, 'mera').powMult, 0.9);
  // 旅芸人は きよう
  changeJob(c, 'performer');
  assert.equal(penaltyFor(c, 'mera').powMult, 0.9);
});

test('ちがう職業の 技を おぼえると 掛け合わせ技を ひらめく', () => {
  const c = char('monk', 5, 1, 'x');
  assert.ok(!learnedAbilities(c).includes('senka'));
  changeJob(c, 'priest');
  assert.ok(learnedAbilities(c).includes('senka'), '閃華裂光拳');
  const w = char('warrior', 5, 1, 'w');
  changeJob(w, 'mage');
  changeJob(w, 'warrior');
  assert.ok(learnedAbilities(w).includes('mahouken'));
  const opts = mahoukenOptions(w);
  assert.ok(opts.some((o) => o.name === 'メラ大地斬'));
});

test('魔法剣で こうげきできる（魔法戦士 だけ。戦士の ままでは つかえない）', () => {
  const w = char('warrior', 8, 3, 'w');
  changeJob(w, 'mage');
  changeJob(w, 'warrior');
  w.equip.weapon = 'bronze_sword';
  fullHeal(w);
  const b0 = new Battle({ rng: makeRng(4), allies: [{ char: w, controller: 's1' }], enemies: ['kobushi'] });
  for (let i = 0; i < 400 && !b0.allies[0].ready; i++) b0.tick(50);
  assert.equal(b0.command(b0.allies[0].id, { type: 'mahouken', spell: 'mera', skill: 'daichi', target: b0.enemies[0].id }, 's1').ok, false, '戦士の ままでは つかえない');
  // 戦士と 魔法使いを マスターして 魔法戦士に
  w.jobs.warrior = { lv: 10, b: 999 };
  w.jobs.mage = { lv: 10, b: 999 };
  assert.equal(changeJob(w, 'magic_knight').ok, true);
  fullHeal(w);
  const b = new Battle({ rng: makeRng(4), allies: [{ char: w, controller: 's1' }], enemies: ['kobushi'] });
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  for (let i = 0; i < 400 && !b.allies[0].ready; i++) b.tick(50);
  const r = b.command(b.allies[0].id, { type: 'mahouken', spell: 'mera', skill: 'daichi', target: b.enemies[0].id }, 's1');
  assert.equal(r.ok, true);
  const evs = run(b, 4000);
  const act = evs.find((e) => e.t === 'act' && e.name === 'メラ大地斬');
  assert.ok(act, 'メラ大地斬');
});

test('ボスの ためこみ（いきを すいこむ）の あとは すぐに 大わざが こない', () => {
  const party = ['warrior', 'priest', 'mage', 'monk'].map((j) => char(j, 11, 8, j));
  const b = new Battle({ rng: makeRng(5), allies: party.map((c) => ({ char: c, auto: true, kind: 'support' })), enemies: ['goldoon'], boss: true, canFlee: false });
  const boss = b.enemies[0];
  boss.actions = [{ w: 1, id: 'm_inhale' }];
  let inhaleAt = null;
  let avalancheAt = null;
  for (let t = 0; t < 60000 && !b.over; t += 50) {
    for (const e of b.tick(50)) {
      if (e.t === 'act' && e.id === boss.id && e.name === '息を吸いこむ' && inhaleAt === null) inhaleAt = b.time;
      if (e.t === 'act' && e.id === boss.id && e.name === '岩なだれ' && avalancheAt === null) avalancheAt = b.time;
    }
    if (avalancheAt !== null) break;
  }
  assert.ok(inhaleAt !== null && avalancheAt !== null);
  assert.ok(avalancheAt - inhaleAt > 2000, `猶予 ${avalancheAt - inhaleAt}ms`);
});

test('きずなゲージが まんたんなら ミナデインを つかえる', () => {
  const party = ['warrior', 'priest'].map((j) => char(j, 8, 5, j));
  const b = new Battle({
    rng: makeRng(6),
    allies: [{ char: party[0], controller: 's1' }, { char: party[1], auto: true, kind: 'support' }],
    enemies: ['goblin', 'goblin'],
    bond: 100,
  });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  for (let i = 0; i < 400 && !b.allies[0].ready; i++) b.tick(50);
  const r = b.command(b.allies[0].id, { type: 'bond', target: b.enemies[0].id }, 's1');
  assert.equal(r.ok, true);
  const evs = run(b, 10000);
  assert.ok(evs.some((e) => e.t === 'bondJoin'), 'AIが ちからを あわせた');
  assert.ok(evs.some((e) => e.t === 'act' && e.name === 'ミナデイン'));
  assert.equal(b.bond < 100, true);
});

test('しょうり・ぜんめつの けっか', () => {
  const strong = char('warrior', 20, 10, 'つよい');
  strong.equip.weapon = 'iron_sword';
  let b = new Battle({ rng: makeRng(7), allies: [{ char: strong, auto: true }], enemies: ['pururin'] });
  run(b, 20000);
  assert.equal(b.result.outcome, 'win');
  assert.deepEqual(b.result.killed, ['pururin']);
  const weak = char('mage', 1, 1, 'よわい');
  b = new Battle({ rng: makeRng(8), allies: [{ char: weak, auto: true }], enemies: ['goldoon'], canFlee: false });
  run(b, 60000);
  assert.equal(b.result.outcome, 'lose');
});

test('レベルアップで 呪文を おぼえる', () => {
  const c = newCharacter({ id: 'p', name: 'p', look: {}, job: 'priest' });
  const ups = gainExp(c, 100000);
  assert.ok(c.level > 10);
  assert.ok(ups.length > 5);
  const st = computeStats(c);
  assert.ok(st.maxHp > 60);
});

test('ねむると じゅんばんが とばされ、やがて めを さます', () => {
  const me = char('warrior', 5, 3, 'me');
  const b = new Battle({ rng: makeRng(9), allies: [{ char: me, auto: true }], enemies: ['pururin'] });
  b.allies[0].status.sleep = { turns: 2 };
  b.allies[0].atb = 99;
  b.enemies[0].actions = [{ w: 1, id: 'm_nothing' }];
  b.enemies[0].atk = 0;
  const evs = run(b, 20000);
  const lines = evs.filter((e) => e.t === 'act').flatMap((e) => e.lines);
  assert.ok(lines.some((l) => l.includes('ねむっている')));
  assert.ok(lines.some((l) => l.includes('目を覚ました')));
});
