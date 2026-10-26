// 第48回 G0: 大技の 時間の 表（shared/ax-time.js）・サーバーの 待ち時間・クライアントと おなじ 数・技の つなぎ（ためしの 表で）
// ・グループの 表（shared/data/ax-time-g1.js 〜 g6.js）は まだ からっぽでも、しくみが うごく ことを ためしの 表で たしかめる
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AX_TIME, AX_SKILLS, AX_GROUPS, AX_GROUP_IDS, AX_TIERS, AX_TIER_CHARGE_MS, AX_KI_CHARGE_MS, AX_CHARGE_KINDS, AX_BUDGET, AX_LOCK_BASE, AX_SLOW, AX_SPREAD_MAX,
  AX_DUAL_CUT_MS, AX_HIRA_PRE_MS, axAddTimes, axSkill, axPlan, axTimes, axTs, axMarkEvent, axTimeOf, axBudget, axChargeMs,
} from '../public/js/shared/ax-time.js';
import { Battle } from '../public/js/shared/battle.js';
import { newCharacter, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { makeRng } from '../public/js/shared/rng.js';
import { CUT_MS } from '../public/js/client/render/dualfx.js';
import { CHARGE_KINDS, TIERS, TIER_CHARGE_MS } from '../public/js/client/render/axcharge.js';
import { useAxGroup, axTiming, axAnimFor, axEventAnim, axEventOpts, axResolve, isAx, playAxFx, registerAx } from '../public/js/client/render/axfx.js';
import { AX_DEMO } from '../public/js/client/render/ax-demo.js';
import { Effects } from '../public/js/client/render/battlefx.js';
import { groupReport, playAx, ONE, ALLY1 } from './ax-check.js';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

// ためしの 表（グループと おなじ 書きかた。テストの 中だけ）
axAddTimes('gt', {
  ax_tfix_beam: { tier: 'legend', charge: { kind: 'ki' }, hit: 150, len: 1100 },
  ax_tfix_heal: { tier: 'advanced', charge: { kind: 'holy', ms: 400 }, hit: 200, len: 700, party: true },
  ax_tfix_slash: { tier: 'super', charge: { kind: 'sword' }, hit: 150, len: (o) => 900 + (o.n - 1) * 40, stagger: 120 },
}, {
  mera: 'ax_tfix_beam',
  'mera@masc': { anim: 'ax_tfix_slash', tier: 'super' },
  merami: { anim: 'ax_tfix_beam', tier: 'super', vars: { gold: true } },
  hoimi: 'ax_tfix_heal',
  dt_bentou: { anim: 'ax_tfix_slash' },
}, { テスト: ['ax_tfix_slash', 'ax_tfix_beam'] });
useAxGroup('gt', {
  ax_tfix_beam: { charge: { color: '#4ab8ff' }, sfx: 'ax_beam', allyFx: 'bolt', play: AX_DEMO.ax_demo_beam.play },
  ax_tfix_heal: { sfx: 'ax_holy', play: AX_DEMO.ax_demo_orb.play },
  ax_tfix_slash: { sfx: 'ax_slash', play: AX_DEMO.ax_demo_slash.play },
});

test('第48回 G0: 表の かたち（段・ためかた・予算・グループ）', () => {
  assert.deepEqual(AX_TIERS, ['basic', 'advanced', 'super', 'legend']);
  assert.equal(TIERS, AX_TIERS, 'クライアントも おなじ 表');
  assert.equal(CHARGE_KINDS, AX_CHARGE_KINDS);
  assert.equal(TIER_CHARGE_MS, AX_TIER_CHARGE_MS);
  assert.equal(CHARGE_KINDS.length, 14);
  for (const t of AX_TIERS) {
    const B = AX_BUDGET[t];
    assert.ok(B.total[0] < B.total[1] && B.charge[0] <= B.charge[1] && B.parts[0] < B.parts[1], t);
    assert.ok(B.totalKi[0] < B.totalKi[1] && B.chargeKi[0] <= B.chargeKi[1] && B.len[0] < B.len[1], t);
    // 第49回: 構えは 300ms まで・気は 0.9びょう まで。上限は 予算の 中
    assert.ok(AX_TIER_CHARGE_MS[t] <= 300 && AX_TIER_CHARGE_MS[t] <= B.charge[1], `${t}: 構えの ため`);
    assert.ok(AX_KI_CHARGE_MS[t] <= 900 && AX_KI_CHARGE_MS[t] <= B.chargeKi[1], `${t}: 気の ため`);
    assert.deepEqual(axBudget(t, 'ki').charge, B.chargeKi);
    assert.deepEqual(axBudget(t, 'sword').charge, B.charge);
  }
  assert.equal(AX_TIER_CHARGE_MS.basic, 200);
  assert.deepEqual(AX_KI_CHARGE_MS, { basic: 300, advanced: 450, super: 650, legend: 900 });
  for (let i = 1; i < AX_TIERS.length; i++) {
    assert.ok(AX_KI_CHARGE_MS[AX_TIERS[i]] > AX_KI_CHARGE_MS[AX_TIERS[i - 1]], '気は 段が 上がるほど 長く');
    assert.ok(AX_TIER_CHARGE_MS[AX_TIERS[i]] >= AX_TIER_CHARGE_MS[AX_TIERS[i - 1]], '構えは 段で へらない');
  }
  // 表の charge.ms は 上限で きる（構えは 300ms まで・気は 段の 長さ まで）。短い ものは そのまま
  assert.equal(axChargeMs({ kind: 'sword', ms: 1400 }, 'legend'), 300);
  assert.equal(axChargeMs({ kind: 'breath', ms: 120 }, 'legend'), 120);
  assert.equal(axChargeMs({ kind: 'ki', ms: 1400 }, 'legend'), 900);
  assert.equal(axChargeMs({ kind: 'ki', ms: 350 }, 'advanced'), 350);
  assert.equal(axChargeMs({ kind: 'ki' }, 'super'), 650);
  assert.equal(axChargeMs({ kind: 'holy' }, 'super'), 300);
  assert.equal(axChargeMs({ ms: 900 }, 'basic'), 200, 'kind なしは generic（構え）');
  assert.deepEqual(AX_GROUP_IDS, ['g1', 'g2', 'g3', 'g4', 'g5', 'g6']);
  for (const g of AX_GROUP_IDS) assert.ok(AX_GROUPS[g], g);
  assert.deepEqual(CUT_MS, AX_DUAL_CUT_MS, '合体技の カットインの 長さは サーバーと おなじ');
  assert.equal(AX_HIRA_PRE_MS, 700);
  // まちがった 表は すぐ わかる
  assert.throws(() => axAddTimes('gx', { kamehameha: { tier: 'basic', hit: 1, len: 2 } }), /ax_/);
  assert.throws(() => axAddTimes('gx', { ax_x1: { tier: 'B', hit: 1, len: 2 } }), /tier/);
  assert.throws(() => axAddTimes('gx', { ax_x2: { tier: 'basic', charge: { kind: 'kame' }, hit: 1, len: 2 } }), /charge\.kind/);
  assert.throws(() => axAddTimes('gx', { ax_x3: { tier: 'basic', hit: 1 } }), /len/);
  assert.throws(() => axAddTimes('gx', { ax_x4: { tier: 'basic', hit: 1, len: 2, color: '#fff' } }), /color/);
  assert.throws(() => axAddTimes('gx', { ax_tfix_beam: { tier: 'basic', hit: 1, len: 2 } }), /もう/);
  assert.throws(() => axAddTimes('gx', {}, { mera: 'ax_tfix_slash' }), /もう/);
  assert.throws(() => axAddTimes('gx', {}, { gira: 'kamehameha' }), /ax_/);
  assert.throws(() => axAddTimes('gx', {}, { gira: { anim: 'ax_tfix_beam', sfx: 'x' } }), /sfx/);
});

test('第48回 G0: 時間（ため・2回目・合体技・おそい 設定・敵全体の ずらし）', () => {
  const P = axPlan('ax_tfix_beam', { key: 'mera' });
  assert.equal(P.tier, 'legend');
  assert.equal(P.kind, 'ki');
  assert.equal(P.charge, AX_KI_CHARGE_MS.legend);
  assert.equal(P.hit, P.charge + 150);
  assert.equal(P.total, P.charge + 1100);
  assert.equal(P.end, P.total);
  assert.equal(P.cutin, false, '第49回: カットインの 帯は ない');
  assert.equal(P.ts, 1);
  assert.equal(P.lockMs, P.total - AX_LOCK_BASE);
  // 技ごとの 段（merami は super）
  const S = axPlan('ax_tfix_beam', { key: 'merami' });
  assert.equal(S.tier, 'super');
  assert.equal(S.charge, AX_KI_CHARGE_MS.super);
  assert.deepEqual(S.vars, { gold: true });
  // 構え（ki の ほか）は みじかい（tfix_slash は sword・super）
  assert.equal(axPlan('ax_tfix_slash').charge, AX_TIER_CHARGE_MS.super);
  assert.ok(axPlan('ax_tfix_slash').charge <= 300);
  // 2回目: ため 半分
  const R = axPlan('ax_tfix_beam', { key: 'mera', repeat: true });
  assert.equal(R.charge, AX_KI_CHARGE_MS.legend / 2);
  assert.equal(R.cutin, false);
  assert.equal(axPlan('ax_tfix_slash', { repeat: true }).charge, AX_TIER_CHARGE_MS.super / 2);
  // 合体技: ため なし
  assert.equal(axPlan('ax_tfix_slash', { key: 'dt_bentou', dual: true }).charge, 0);
  // おそい 設定: 0.6・0.75 でも 0.85 の 速さ。速い 設定は そのまま
  assert.equal(axTs(0.6), AX_SLOW / 0.6);
  assert.equal(axTs(0.85), 1);
  assert.equal(axTs(1.25), 1);
  const real = (sp) => axPlan('ax_tfix_beam', { key: 'mera', speed: sp }).realMs / sp;
  assert.ok(Math.abs(real(0.6) - real(0.85)) < 3);
  assert.ok(Math.abs(real(0.75) - real(0.85)) < 3);
  assert.ok(real(1.25) < real(1));
  assert.ok(real(0.6) <= 3800 + 5, `伝説でも おそい 設定で ${real(0.6)}ms`);
  // 敵全体: ずらしは 300ms まで
  const T3 = axPlan('ax_tfix_slash', { n: 3 });
  assert.equal(T3.stagger, 120);
  assert.equal(T3.spread, 240);
  assert.equal(T3.len, 980);
  assert.equal(axPlan('ax_tfix_slash', { n: 5 }).spread, AX_SPREAD_MAX);
  assert.equal(axPlan('ax_tfix_slash', { n: 5 }).end, axPlan('ax_tfix_slash', { n: 5 }).total + AX_SPREAD_MAX);
  // 合体技・ひらめきは 前に 見せる ぶん（pre）も 待つ
  assert.equal(axPlan('ax_tfix_beam', { key: 'mera', pre: 1000 }).realMs, P.total + 1000);
  // 男の子の 版
  assert.equal(axSkill('mera', { masc: true }).anim, 'ax_tfix_slash');
  assert.equal(axSkill('mera').anim, 'ax_tfix_beam');
  assert.equal(axSkill('hoimi', { masc: true }).anim, 'ax_tfix_heal', '男の子の 版が なければ もとの まま');
  assert.equal(axSkill('nanika'), null);
  // 表に ない anim
  assert.equal(axPlan('kamehameha'), null);
  assert.equal(axTimes(null), null);
});

test('第48回 G0: クライアントの 時間は サーバーと おなじ 表から', () => {
  for (const [key, s] of Object.entries(AX_SKILLS).filter(([, x]) => x.group === 'gt')) {
    for (const o of [{}, { n: 3, crit: true }, { repeat: true }, { dual: true }, { speed: 0.6 }, { speed: 1.25, n: 2 }]) {
      const SP = axPlan(s.anim, { key, ...o });
      const CT = axTiming(s.anim, { ability: key, targets: o.n, crit: o.crit, repeat: o.repeat, dual: o.dual, tempo: o.speed || 1 });
      for (const k of ['tier', 'charge', 'hit', 'len', 'total', 'end', 'cutin']) assert.equal(CT[k], SP[k], `${key} ${JSON.stringify(o)} ${k}`);
      assert.ok(Math.abs(CT.endReal - SP.realMs / (o.speed || 1)) <= 2);
    }
  }
  // え の def には 時間を 書かない（表から まざる）
  assert.equal(axResolve('ax_tfix_beam').def.tier, 'legend');
  assert.equal(axResolve('ax_tfix_beam').charge.kind, 'ki');
  assert.equal(axResolve('ax_tfix_beam').charge.color, '#4ab8ff');
  assert.equal(axResolve('ax_tfix_heal').def.party, true);
  assert.throws(() => { axAddTimes('gx2', { ax_tfix_bad1: { tier: 'basic', hit: 100, len: 500 } }); registerAx('ax_tfix_bad1', { group: 'gx2', tier: 'basic', play() {} }); }, /tier は shared\/data\/ax-time-gx2\.js/);
  axAddTimes('gx2', { ax_tfix_bad2: { tier: 'basic', hit: 100, len: 500 } });
  assert.throws(() => registerAx('ax_tfix_bad2', { group: 'gx2', charge: { ms: 100 }, play() {} }), /charge/);
  assert.throws(() => registerAx('ax_g1_nothing', { group: 'g1', play() {} }), /ax-time-g1/);
  assert.throws(() => useAxGroup('g9', {}, { ax_wrong: () => {} }), /g9/);
  // 技の id → anim（男の子の 版・合体技も）
  assert.equal(axAnimFor('mera'), 'ax_tfix_beam');
  assert.equal(axAnimFor('mera', { masc: true }), 'ax_tfix_slash');
  assert.equal(axAnimFor('dt_bentou'), 'ax_tfix_slash');
  // サーバーが きめた ev.fx.ax が いちばん
  assert.equal(axEventAnim({ t: 'act', ability: 'mera', fx: { type: 'ability', anim: 'fire1', ax: 'ax_tfix_slash', axKey: 'mera@masc' } }), 'ax_tfix_slash');
  assert.equal(axEventAnim({ t: 'act', ability: 'mera', fx: { type: 'ability', anim: 'fire1' } }), 'ax_tfix_beam');
  assert.equal(axEventAnim({ t: 'act', dual: { id: 'dt_bentou' }, fx: { type: 'dual', anim: 'kamehameha' } }), 'ax_tfix_slash');
  assert.equal(axEventAnim({ t: 'act', ability: 'mera', fx: { type: 'attack', anim: 'slash', ax: 'ax_tfix_beam' } }), null);
  assert.deepEqual(axEventOpts({ ability: 'mera', fx: { type: 'ability', axKey: 'mera@masc', axRepeat: 1, targets: ['a', 'b'] } }), { ability: 'mera@masc', repeat: true, dual: false, n: 2 });
  assert.deepEqual(axEventOpts({ dual: { id: 'dt_bentou' }, fx: { type: 'dual', axKey: 'dt_bentou', targets: ['e1'] } }), { ability: 'dt_bentou', repeat: false, dual: true, n: 1 });
});

test('第48回 G0: おそい 設定・2回目・合体技の え（エフェクトの 時計）', () => {
  // 速さ 0.6: 大技の つぶは ts ばい 速く すすむ → ほんとうの 時間は 0.85 と おなじ
  const run = (tempo, o = {}) => {
    const fx = new Effects();
    fx.tempo = tempo;
    let rel = null, t = 0;
    playAxFx(fx, 'ax_tfix_beam', ONE, null, { ability: 'mera', sfx: (id) => { if (id === 'ax_beam') rel = t; }, ...o });
    while (fx.parts.length && t < 8000) { fx.update(16); t += 16; }
    return { rel, t };
  };
  const a = run(0.6), b = run(0.85), c = run(1.25);
  assert.ok(Math.abs(a.rel - b.rel) <= 32, `はなつ 時間 ${a.rel} / ${b.rel}`);
  assert.ok(Math.abs(a.t - b.t) <= 64, `おわる 時間 ${a.t} / ${b.t}`);
  assert.ok(c.rel < b.rel);
  const T = axTiming('ax_tfix_beam', { ability: 'mera', tempo: 0.6 });
  assert.ok(Math.abs(a.rel - T.chargeReal) <= 32);
  // 2回目: ため 半分。合体技: すぐ はなつ
  const r = run(1, { repeat: true });
  assert.ok(Math.abs(r.rel - AX_KI_CHARGE_MS.legend / 2) <= 32, `2回目 ${r.rel}`);
  assert.ok(run(1, { dual: true }).rel <= 16, '合体技は ため なし');
  // 第49回: 1回目も 2回目も カットインの 帯・スローの ひかり・画面の くらさ（ため の あいだ）は ない
  const f1 = new Effects(), f2 = new Effects();
  playAxFx(f1, 'ax_tfix_beam', ONE, null, { ability: 'mera' });
  playAxFx(f2, 'ax_tfix_beam', ONE, null, { ability: 'mera', repeat: true });
  for (const f of [f1, f2]) assert.ok(!f.parts.some((p) => p.kind === 'axBand' || p.kind === 'axFreeze' || p.kind === 'axFigure'));
  // ctx: 技の id・男の子・2回目・合体技・敵→味方
  let ctx = null;
  axAddTimes('gt', { ax_tfix_ctx: { tier: 'basic', charge: false, hit: 100, len: 500 } }, { 'gira@masc': 'ax_tfix_ctx' });
  useAxGroup('gt', { ax_tfix_ctx: { play(fx, c) { ctx = c; } } });
  playAxFx(new Effects(), 'ax_tfix_ctx', ALLY1, null, { ability: 'gira@masc', fromAlly: false, toParty: true, repeat: true });
  assert.equal(ctx.ability, 'gira');
  assert.equal(ctx.masc, true);
  assert.equal(ctx.repeat, true);
  assert.equal(ctx.toParty, true);
  assert.equal(ctx.dir, 'down');
});

// 戦いを 1つ つくる（u0 が mera を おぼえて いる）
function setup(speed = 1) {
  const chars = ['mage', 'priest'].map((j, i) => {
    const c = newCharacter({ id: 'p' + i, name: ['ソラ', 'ミナ'][i], job: j });
    gainExp(c, expForLevel(30));
    fullHeal(c);
    // ソラは 女の子（look.body 1）、ミナは 男の子（男の子の 版 'mera@masc'）
    c.look = { ...(c.look || {}), body: i === 0 ? 1 : 0 };
    return c;
  });
  const b = new Battle({ rng: makeRng(11), allies: chars.map((c) => ({ char: c, controller: 's' + c.id })), enemies: ['rockman'], speed });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.abilities = [...new Set([...a.abilities, 'mera', 'hoimi', 'gira'])]; }
  return b;
}
function act(b, u, cmd) {
  b.queue = [];
  b.enqueue(u, cmd);
  b.executeNext();
  const lock = b.lock;
  b.lock = 0;
  return { ev: b.flush().filter((e) => e.t === 'act').pop(), lock };
}

test('第48回 G0: サーバーは 大技の あいだ つぎの 行動を まつ（2回目は みじかく・おそい 設定でも 長く なりすぎない）', () => {
  for (const speed of [0.6, 0.85, 1, 1.25]) {
    const b = setup(speed);
    const [u] = b.allies;
    const foe = b.enemies[0];
    const first = act(b, u, { type: 'ability', id: 'mera', target: foe.id });
    assert.equal(first.ev.fx.ax, 'ax_tfix_beam', 'サーバーが anim を きめて つたえる');
    assert.equal(first.ev.fx.anim, 'fire1', 'データの anim は そのまま');
    assert.equal(first.ev.fx.axRepeat, undefined);
    const P = axPlan('ax_tfix_beam', { key: 'mera', speed, crit: (first.ev.results || []).some((r) => r.crit) });
    // つぎの 行動は 余韻の さいご 200ms より 前に 始まらない
    assert.ok(first.lock >= P.realMs / speed - 200, `速さ ${speed}: 待ち ${first.lock} / 大技 ${Math.round(P.realMs / speed)}`);
    assert.ok(first.lock <= P.realMs / speed + 900 / speed + 2000, '待ちすぎない');
    assert.equal(first.ev.dur, first.lock);
    // 2回目: ため 半分 → 待ちも みじかい
    const second = act(b, u, { type: 'ability', id: 'mera', target: foe.id });
    assert.equal(second.ev.fx.axRepeat, 1);
    assert.ok(second.lock < first.lock, `2回目 ${second.lock} < ${first.lock}`);
    // ほかの 人の おなじ 技は 1回目。男の子は 男の子の 版
    const other = act(b, b.allies[1], { type: 'ability', id: 'mera', target: foe.id });
    assert.equal(other.ev.fx.axRepeat, undefined);
    assert.equal(other.ev.fx.ax, 'ax_tfix_slash');
    assert.equal(other.ev.fx.axKey, 'mera@masc');
    // 大技で ない 技は 今まで どおり
    const plain = act(b, u, { type: 'defend' });
    assert.equal(plain.ev.fx?.ax, undefined);
    assert.equal(plain.lock, b.pace(450, 380, plain.ev.lines.length, 900));
    // 味方に かける 大技
    const heal = act(b, u, { type: 'ability', id: 'hoimi', target: b.allies[1].id });
    assert.equal(heal.ev.fx.ax, 'ax_tfix_heal');
    assert.ok(heal.lock >= axPlan('ax_tfix_heal', { speed }).realMs / speed - 200);
  }
  // おそい 設定でも 伝説は 4びょう いない（文字の 行の ぶんは べつ）
  const b = setup(0.6);
  const r = act(b, b.allies[0], { type: 'ability', id: 'mera', target: b.enemies[0].id });
  assert.ok(axPlan('ax_tfix_beam', { key: 'mera', speed: 0.6 }).realMs / 0.6 <= 4000);
  assert.ok(r.lock > 0);
});

test('第48回 G0: サーバーの しるし（男の子の 版・合体技・ひらめき・敵が まねた 技）', () => {
  const c = { id: 'p0' };
  // 男の子
  const ev1 = { t: 'act', ability: 'mera', fx: { type: 'ability', anim: 'fire1', targets: ['e1'] }, lines: [] };
  axMarkEvent(ev1, c, { masc: true, used: new Set() });
  assert.equal(ev1.fx.ax, 'ax_tfix_slash');
  assert.equal(ev1.fx.axKey, 'mera@masc');
  // 合体技: ため なし・カットインの ぶん 待つ（今までの extraLock より みじかく しない）
  const ev2 = { t: 'act', dual: { id: 'dt_bentou', n: 2 }, fx: { type: 'dual', anim: 'kamehameha', targets: ['e1'] }, extraLock: 700, lines: [] };
  const P2 = axMarkEvent(ev2, c, { used: new Set() });
  assert.equal(P2.charge, 0);
  assert.equal(ev2.fx.ax, 'ax_tfix_slash');
  assert.equal(ev2.fx.axKey, 'dt_bentou');
  assert.equal(P2.realMs, AX_DUAL_CUT_MS[2] + P2.end);
  assert.equal(ev2.extraLock, Math.max(700, P2.lockMs));
  // ひらめいた しゅんかんは いつも ため フル
  const used = new Set(['p0|mera']);
  const ev3 = { t: 'act', ability: 'mera', hirameki: { id: 'mera' }, fx: { type: 'ability', anim: 'fire1', targets: ['e1'] }, extraLock: 900, lines: [] };
  const P3 = axMarkEvent(ev3, c, { used });
  assert.equal(P3.repeat, false);
  assert.equal(P3.realMs, AX_HIRA_PRE_MS + P3.end);
  // 敵が まねた 技（ノクトの影・鏡のうつし身）: 技の id で おなじ 大技（向きは クライアントが きめる）
  const ev4 = { t: 'act', ability: 'mera', fx: { type: 'ability', anim: 'fire1', targets: ['p0'], side: 'enemy' }, lines: [] };
  axMarkEvent(ev4, { id: 'e1' }, { used: new Set() });
  assert.equal(ev4.fx.ax, 'ax_tfix_beam');
  // こうげき・道具・表に ない 技は なにも しない
  for (const fx of [{ type: 'attack', anim: 'slash' }, { type: 'item', anim: 'heal1' }, { type: 'ability', anim: 'fire1' }]) {
    const ev = { t: 'act', ability: fx.type === 'ability' ? 'hyado' : undefined, fx: { ...fx, targets: [] }, lines: [] };
    assert.equal(axMarkEvent(ev, c, { used: new Set() }), null);
    assert.equal(ev.fx.ax, undefined);
    assert.equal(ev.extraLock, undefined);
  }
  // データの anim が ax_〜（表に ある もの）でも 大技
  const ev5 = { t: 'act', ability: 'hyado', fx: { type: 'ability', anim: 'ax_tfix_beam', targets: ['e1'] }, lines: [] };
  axMarkEvent(ev5, c, {});
  assert.equal(ev5.fx.ax, 'ax_tfix_beam');
});

test('第48回 G0: クライアントの つなぎ（ax が いちばん さき・合体技・味方に かける・敵が 味方に）', () => {
  const b = src('../public/js/client/battle.js');
  assert.match(b, /const anim = ev\.axAnim \|\| sigAnim\(ev\.ability\) \|\| r27Anim\(ev\.ability\) \|\| fx\.anim/, 'ax が 看板の 技・作り直しの 上書き・データの anim より さき');
  assert.match(b, /ev\.axOpts = ev\.axAnim \? axEventOpts\(ev\) : null;/);
  assert.match(b, /if \(fx\.type === 'dual' && anim && !enemyPts\.length && !axT\)/, '味方に かける 合体技の 大技は 大技の 道で');
  assert.match(b, /else if \(fromAlly && axT && !enemyPts\.length\)/, '味方に かける 大技');
  assert.match(b, /\.\.\.axOpts, toParty: true \}/, '敵が 味方に（ノクトの影・鏡のうつし身）');
  assert.match(b, /hitDelay = axT\.hitAt;/);
  assert.match(b, /AX_HIRA_PRE_MS : 0\) \/ this\.fxSpeed/);
  const fx = src('../public/js/client/render/battlefx.js');
  assert.match(fx, /const dt = p\.ts \? dt1 \* p\.ts : dt1;/, 'おそい 設定の しぼり（つぶごと）');
  const sh = src('../public/js/shared/battle.js');
  assert.match(sh, /import \{ axMarkEvent \} from '\.\/ax-time\.js';/);
  assert.match(sh, /this\.axMark\(c, ev\);\n\s+this\.lock = this\.pace\(450, 380, ev\.lines\.length, 900\) \+ \(ev\.extraLock \|\| 0\) \/ this\.speed;/);
  // 時間の 表は canvas・DOM を つかわない（サーバーが 読む）
  const t = src('../public/js/shared/ax-time.js');
  assert.ok(!/document|canvas|window\./.test(t.replace(/\/\/.*$/gm, '')));
  for (const g of AX_GROUP_IDS) {
    const d = src(`../public/js/shared/data/ax-time-${g}.js`);
    assert.match(d, new RegExp(`export const AX_TIME_${g.toUpperCase()} =`));
    assert.match(d, new RegExp(`export const AX_SKILLS_${g.toUpperCase()} =`));
    assert.match(d, new RegExp(`export const AX_FAMILIES_${g.toUpperCase()} =`));
    assert.ok(!/import /.test(d.replace(/\/\/.*$/gm, '')), `${g}: 表の ファイルは ほかを import しない`);
  }
  assert.ok(isAx('ax_tfix_beam'));
  assert.ok(axTimeOf('ax_tfix_beam'));
});

test('第48回 G0: グループの しらべかた（ax-check.js）は まちがいを 見つける', () => {
  // よい 表: 時間・クライアントと サーバー・うごきの こわれ は ない
  const good = groupReport('gt', { kanji: false });
  const hard = good.problems.filter((p) => /エラー|NaN|マイナス|ちがう|待ち時間|データに ない|とうろく/.test(p));
  assert.deepEqual(hard, []);
  assert.ok(good.skills.includes('mera'));
  // わるい 表
  axAddTimes('gbad', {
    ax_tbad_long: { tier: 'basic', charge: { kind: 'ki', ms: 900 }, hit: 2000, len: 2100 },
    ax_tbad_norm: { tier: 'basic', charge: { kind: 'ki' }, hit: 100, len: 500 },
  }, { no_such_skill: 'ax_tbad_long', gira: 'ax_tbad_norm', io: 'ax_tbad_norm' });
  useAxGroup('gbad', {
    ax_tbad_long: { sfx: 'ax_nai_oto', play() { throw new Error('わざと'); } },
    ax_tbad_norm: { sfx: 'ax_beam', play(fx, c) { c.k.impact(NaN, 3); } },
  });
  const bad = groupReport('gbad', { kanji: false }).problems.join('\n');
  assert.match(bad, /no_such_skill: その 技/);
  // 第49回: 表の ため 900ms は 気の basic の 上限（300ms）で きられる → 予算の そとには ならない。len・合計は 見つける
  assert.doesNotMatch(bad, /ため（気）900ms/);
  assert.equal(axPlan('ax_tbad_long').charge, AX_KI_CHARGE_MS.basic);
  assert.match(bad, /len \d+ms が basic の 予算/);
  assert.match(bad, /合計 \d+ms が basic の 予算/);
  assert.match(bad, /音 ax_nai_oto が ない/);
  assert.match(bad, /エラー/);
  assert.match(bad, /io: gira と おなじ ax_tbad_norm/);
  assert.match(bad, /同時の つぶ \d+こ が basic の 下限/);
  // 画面の 文字の 漢字
  const k = (s) => groupReportKanji(s);
  assert.equal(k("k.text('ドン！')").length, 0);
  assert.equal(k("k.text('人')").length, 0);
  assert.equal(k("// 気を ためる\nconst a = 1;").length, 0);
  assert.equal(k("k.text('必殺')").length, 1);
});
import { kanjiProblems as groupReportKanji0 } from './ax-check.js';
const groupReportKanji = (s) => groupReportKanji0(s, 'x.js');

test('第48回 G0: 見る どうぐ（技の id・グループ）', () => {
  const tool = src('../tools/fx-preview.mjs');
  assert.match(tool, /--group/);
  assert.match(tool, /--ability/);
  assert.match(tool, /fx-out', a\.group|fx-out\/<group>|path\.join\(ROOT, 'fx-out', a\.group\)/);
  void playAx;
});
