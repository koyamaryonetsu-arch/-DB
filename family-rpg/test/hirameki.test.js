// ひらめき（技を 何回も 使うと 新しい 技を 思いつく）と 合体技（2人の 番を 使う 技）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI, hiraChance, hiraRatio } from '../public/js/shared/data/hirameki.js';
import { DUAL_TECHS, dualOptions } from '../public/js/shared/data/dual.js';
import { newCharacter, learnedAbilities, gainExp, expForLevel, fullHeal, changeJob, hiraAllowed, oldComboUnlocks, weaponOk } from '../public/js/shared/stats.js';
import { Battle, DUAL_ASK_MS } from '../public/js/shared/battle.js';
import { upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { makeRng } from '../public/js/shared/rng.js';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };

function mk(job, name, lv = 20, jobLv = 6) {
  const c = newCharacter({ id: name, name, job });
  gainExp(c, expForLevel(lv));
  c.jobs[job].lv = jobLv;
  fullHeal(c);
  return c;
}

// ゲージが たまるまで すすめる
function readyUp(b, a) {
  for (let i = 0; i < 800 && !a.ready; i++) b.tick(50);
  return a.ready;
}

// その 人の 行動が おわるまで
function runUntilAct(b, id, pred = () => true) {
  const evs = [];
  for (let i = 0; i < 400; i++) {
    evs.push(...b.tick(50));
    if (evs.some((e) => e.t === 'act' && e.id === id && pred(e))) break;
  }
  return evs;
}

test('ひらめきの データ: 技と 回数が そろっている', () => {
  for (const [id, h] of Object.entries(HIRAMEKI)) {
    assert.ok(ABILITIES[id], id);
    for (const [k, n] of Object.entries(h.from)) {
      assert.ok(k === '@atk' || ABILITIES[k], `${id} の ${k}`);
      assert.ok(n > 0);
    }
  }
  // 基本職 10こ × 2 と 掛け合わせ技 9こ
  assert.equal(Object.keys(HIRAMEKI).filter((id) => ABILITIES[id].hirameki).length, 20);
  assert.equal(Object.keys(HIRAMEKI).filter((id) => ABILITIES[id].kind === 'combo').length, 9);
  assert.equal(hiraChance(0.99), 0);
  assert.equal(hiraChance(1), 0.2);
  assert.equal(hiraChance(2), 0.6);
  assert.equal(hiraRatio({ daichi: 10 }, { daichi: 20, chikaratame: 6 }), 0);
  assert.equal(hiraRatio({ daichi: 30, chikaratame: 6 }, { daichi: 20, chikaratame: 6 }), 1);
});

test('ひらめける 職業: 職業の 技は その 職業から、掛け合わせ技は 上級職から', () => {
  const c = mk('warrior', 'ガルド');
  assert.equal(hiraAllowed(c, 'hk_daichi_ikari'), true, '戦士は 大地のいかり');
  assert.equal(hiraAllowed(c, 'hk_sandan'), false, '戦士は 三段づき（武闘家）を ひらめかない');
  assert.equal(hiraAllowed(c, 'mahouken'), false, '戦士では 魔法剣は ひらめかない');
  master(c, 'warrior', 'monk', 'mage');
  changeJob(c, 'battlemaster');
  assert.equal(hiraAllowed(c, 'hk_sandan'), true, 'バトルマスターは 武闘家の 技も');
  changeJob(c, 'magic_knight');
  assert.equal(hiraAllowed(c, 'mahouken'), true, '魔法戦士なら 魔法剣');
});

test('技と ふつうの 攻撃の 回数を かぞえて、たりると 使った しゅんかんに ひらめく', () => {
  const w = mk('warrior', 'ガルド');
  w.equip.weapon = 'iron_sword';
  // 回数が たりない: ひらめかない。回数だけ ふえる
  w.skillUse = { daichi: 5 };
  const b0 = new Battle({ rng: makeRng(1), allies: [{ char: w, controller: 's1' }], enemies: ['rockman'] });
  for (const e of b0.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 9999;
  }
  readyUp(b0, b0.allies[0]);
  b0.command(b0.allies[0].id, { type: 'ability', id: 'daichi', target: b0.enemies[0].id }, 's1');
  const e0 = runUntilAct(b0, b0.allies[0].id).find((e) => e.t === 'act' && e.id === b0.allies[0].id);
  assert.ok(!e0.hirameki);
  assert.equal(b0.allies[0].use.daichi, 6);
  readyUp(b0, b0.allies[0]);
  b0.command(b0.allies[0].id, { type: 'attack', target: b0.enemies[0].id }, 's1');
  runUntilAct(b0, b0.allies[0].id);
  assert.equal(b0.allies[0].use['@atk'], 1, 'ふつうの 攻撃も かぞえる');
  // 回数が たりる: いつか ひらめく（はじめの 1回は MP いらず）
  w.skillUse = { daichi: 40, chikaratame: 12 };
  let got = null;
  for (let seed = 1; seed < 60 && !got; seed++) {
    const b = new Battle({ rng: makeRng(seed), allies: [{ char: w, controller: 's1' }], enemies: ['rockman'] });
    for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
    const a = b.allies[0];
    readyUp(b, a);
    const mp0 = a.mp;
    b.command(a.id, { type: 'ability', id: 'daichi', target: b.enemies[0].id }, 's1');
    const ev = runUntilAct(b, a.id).find((e) => e.t === 'act' && e.id === a.id);
    if (ev?.hirameki) got = { ev, a, mp0 };
  }
  assert.ok(got, 'ひらめいた');
  assert.equal(got.ev.hirameki.id, 'hk_daichi_ikari');
  assert.equal(got.ev.name, '大地のいかり');
  assert.ok(got.ev.lines.some((l) => l.includes('ひらめいた')));
  assert.ok(got.a.abilities.includes('hk_daichi_ikari'), 'すぐ 使えるように なる');
  assert.deepEqual(got.a.hiraNew, ['hk_daichi_ikari']);
  assert.equal(got.a.mp, got.mp0, 'はじめの 1回は MP いらず');
});

test('ひらめいた 技は セーブに のこり、ずっと 使える', () => {
  const c = mk('mage', 'ポポロ');
  assert.ok(!learnedAbilities(c).includes('hk_triple_mera'));
  c.hirameki = ['hk_triple_mera', 'unknown_future_skill'];
  assert.ok(learnedAbilities(c).includes('hk_triple_mera'));
  assert.ok(!learnedAbilities(c).includes('unknown_future_skill'), '知らない 技は 出さない（でも けさない）');
  const up = upgradeSave({ version: 3, characters: { [c.id]: c } }).data.characters[c.id];
  assert.deepEqual(up.hirameki, ['hk_triple_mera', 'unknown_future_skill']);
});

test('セーブの ひきつぎ: 今まで 覚えていた 掛け合わせ技は ひらめいた 技として のこる（仲間も）', () => {
  const c = mk('warrior', 'ヒナ');
  changeJob(c, 'mage');
  c.jobs.mage.lv = 5;
  changeJob(c, 'warrior');
  const comp = mk('monk', 'リン');
  changeJob(comp, 'priest');
  c.companions = [{ key: 'rin', kind: 'npc', char: comp }];
  assert.ok(!learnedAbilities(c).includes('mahouken'), '新しい きまりでは まだ')
  const up = upgradeSave({ version: 2, characters: { [c.id]: c } }).data.characters[c.id];
  assert.ok(up.hirameki.includes('mahouken'), '魔法剣');
  assert.ok(learnedAbilities(up).includes('mahouken'));
  assert.ok(up.companions[0].char.hirameki.includes('senka'), '仲間の 閃華裂光拳');
  assert.deepEqual(oldComboUnlocks(newCharacter({ id: 'n', name: 'n', job: 'warrior' })), []);
});

test('家族の データを 合わせる: 使った 回数は ふえた ぶんを たし、ひらめいた 技は 両方', () => {
  const base = mk('warrior', 'ヒナ');
  base.skillUse = { daichi: 10 };
  base.hirameki = [];
  const a = JSON.parse(JSON.stringify(base));
  const t = JSON.parse(JSON.stringify(base));
  a.skillUse = { daichi: 15, '@atk': 3 };
  a.hirameki = ['hk_midaregiri'];
  t.skillUse = { daichi: 18, kaiha: 2 };
  t.hirameki = ['hk_daichi_ikari'];
  t.lastPlayed = a.lastPlayed + 1000;
  const m = mergeChars(base, a, t);
  assert.equal(m.skillUse.daichi, 23, '10 + 5 + 8');
  assert.equal(m.skillUse['@atk'], 3);
  assert.equal(m.skillUse.kaiha, 2);
  assert.deepEqual([...m.hirameki].sort(), ['hk_daichi_ikari', 'hk_midaregiri']);
});

// 合体技の たたかい（ヒナ＝魔法使い・ミーナ＝僧侶）
function duo({ mateHuman = false, seed = 3 } = {}) {
  const hero = mk('mage', 'ヒナ');
  const mate = mk('priest', 'ミーナ');
  const b = new Battle({
    rng: makeRng(seed),
    allies: [{ char: hero, controller: 's1' }, mateHuman ? { char: mate, controller: 's2' } : { char: mate, kind: 'support', auto: true }],
    enemies: ['kobushi', 'kobushi'],
  });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return b;
}

test('合体技: 2人の 技が そろい、相手の ゲージが たまっていれば すぐ 出せる', () => {
  const b = duo();
  const [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 60;
  assert.equal(b.dualOptionsFor(a).length, 0, 'ゲージが まだ たまって いない（よやく だけ）');
  m.atb = 100;
  const ids = b.dualOptionsFor(a).map((o) => o.id);
  assert.ok(ids.includes('dt_honoo_tatsumaki'), 'メラ＋バギ＝炎の竜巻');
  assert.ok(ids.includes('dt_blizzard'), 'ヒャド＋バギ＝ブリザード');
  assert.ok(!ids.includes('dt_taishoumetsu'), '僧侶は ヒャドを 覚えていない');
  m.status.sleep = { turns: 2 };
  assert.equal(b.dualOptionsFor(a).length, 0, 'ねむっている 仲間とは 出せない');
});

test('合体技: AIの 仲間なら すぐ 出る（2人の MPと 番を 使う。自動の 合体は なくなった）', () => {
  const b = duo();
  const [a, m] = b.allies;
  readyUp(b, a);
  b.queue = b.queue.filter((q) => q.id !== m.id);
  m.queued = false;
  m.atb = 100;
  const mpA = a.mp, mpM = m.mp;
  const r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.deepEqual(r, { ok: true });
  assert.equal(m.queued, true, '相手の 番を おさえる');
  const act = runUntilAct(b, a.id).find((e) => e.t === 'act' && e.id === a.id);
  assert.equal(act.name, '炎の竜巻');
  assert.equal(act.dual.b, m.id);
  assert.ok(act.lines[0].includes('ヒナとミーナの合体技'));
  assert.ok(act.results.some((x) => x.dmg > 0));
  assert.equal(a.mp, mpA - 4);
  assert.equal(m.mp, mpM - 4);
  assert.equal(m.atb, 0);
  assert.equal(m.queued, false);
  // れんけいで 属性が つながっても、かってに「合体」は おこらない
  assert.ok(!act.team && !act.fx?.team);
});

test('合体技: 家族には「参加する？」と 聞く（OK で 出る・ことわる・時間切れ）', () => {
  // OK
  let b = duo({ mateHuman: true });
  let [a, m] = b.allies;
  readyUp(b, a);
  m.atb = 100;
  let r = b.command(a.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1');
  assert.equal(r.pending, true);
  let evs = b.tick(10);
  const inv = evs.find((e) => e.t === 'dualInvite');
  assert.equal(inv.to, m.id);
  assert.equal(inv.fromName, 'ヒナ');
  assert.equal(b.command(m.id, { type: 'dualAnswer', invite: inv.invite, ok: true }, 's1').ok, false, 'ほかの 人は こたえられない');
  assert.equal(b.command(m.id, { type: 'dualAnswer', invite: inv.invite, ok: true }, 's2').ok, true);
  const act = runUntilAct(b, a.id).find((e) => e.t === 'act' && e.id === a.id);
  assert.equal(act.dual?.id, 'dt_honoo_tatsumaki');
  // ことわる
  b = duo({ mateHuman: true });
  [a, m] = b.allies;
  readyUp(b, a);
  m.atb = 100;
  b.command(a.id, { type: 'dual', id: 'dt_blizzard', partner: m.id, target: b.enemies[0].id }, 's1');
  const inv2 = b.tick(10).find((e) => e.t === 'dualInvite');
  b.command(m.id, { type: 'dualAnswer', invite: inv2.invite, ok: false }, 's2');
  evs = b.tick(10);
  const ans = evs.find((e) => e.t === 'dualAnswer');
  assert.equal(ans.ok, false);
  assert.equal(ans.reason, 'ことわった');
  assert.equal(a.ready, true, 'さそった 人は また コマンドを えらべる');
  assert.equal(b.command(a.id, { type: 'attack', target: b.enemies[0].id }, 's1').ok, true);
  // 時間切れ
  b = duo({ mateHuman: true });
  [a, m] = b.allies;
  readyUp(b, a);
  m.atb = 100;
  b.command(a.id, { type: 'dual', id: 'dt_blizzard', partner: m.id, target: b.enemies[0].id }, 's1');
  evs = [];
  for (let t = 0; t < DUAL_ASK_MS + 500; t += 100) evs.push(...b.tick(100));
  const late = evs.find((e) => e.t === 'dualAnswer');
  assert.equal(late.reason, '時間切れ');
  assert.equal(b.invites.size, 0);
});

test('合体技の データ: 技の 組が そろっていて、出せる 組み合わせが ある', () => {
  for (const [id, t] of Object.entries(DUAL_TECHS)) {
    assert.equal(t.need.length, 2, id);
    assert.equal(t.mp.length, 2, id);
    for (const g of t.need) for (const k of g) assert.ok(ABILITIES[k], `${id}: ${k}`);
    assert.ok(t.parts.length > 0);
  }
  const a = { id: 'a', name: 'A', alive: true, abilities: ['daichi'], mp: 20, atb: 100, ready: true, weaponCat: 'sword' };
  const p = { id: 'b', name: 'B', alive: true, abilities: ['mera'], mp: 20, atb: 100, weaponCat: 'staff' };
  const opts = dualOptions(a, [p], weaponOk);
  const cm = opts.find((o) => o.id === 'dt_cross_mahouken');
  assert.ok(cm, '剣技＋呪文＝クロス魔法剣');
  assert.equal(cm.element, 'fire', 'メラなら 炎の剣');
  assert.equal(dualOptions({ ...a, weaponCat: 'staff' }, [p], weaponOk).some((o) => o.id === 'dt_cross_mahouken'), false, '剣が いる');
});
