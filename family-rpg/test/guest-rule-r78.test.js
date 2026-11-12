// 第78回: ゲストの 強さの きまり（shared/guest-rule.js・docs/plan-r78-guest.md）
// 全部の ゲスト × いくつかの 家族（弱い・ふつう・強い・1人・4人・魔物が まざる）で:
//   力の 割合が きめた はばの 中（はばに とどかない ときは 倍率と レベルが 上限・はばを こえる ときは 床）・床と てんじょう・同じ 入力なら 同じ 結果
// と、サーバー（world/battles.js の makeBattle）で ゲストが きまりの 強さで 戦いに 入り、戦いの あと HP の 割合が もどる こと
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUESTS } from '../public/js/shared/data/shops.js';
import { computeStats, newMonsterCompanion } from '../public/js/shared/stats.js';
import {
  guestPlan, guestForBattle, guestBaseChar, guestLevelCap, charPower, growPower, levelPower, fightPower, scaleGuestActor, guestAfterBattle,
  GUEST_RATIO, GUEST_BAND, GUEST_K, GUEST_LV_SPAN,
} from '../public/js/shared/guest-rule.js';
import { allyFromCharacter } from '../public/js/shared/battle.js';
import { jobChar } from '../tools/sim-jobs.mjs';
import { ch7Party, CH7_LV } from '../tools/sim-ch7.mjs';
import { ch8Party, CH8_LV } from '../tools/sim-ch8.mjs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { partyOf, afterRosterChange } from '../public/js/shared/world/party.js';
import { DAY_MS } from '../public/js/shared/world/clock.js';
import { Bot, tickN } from './helpers.js';

const EPS = 1e-6;
// 第7章・第8章の ゲスト: その ボスの ころの ★装備の 家族（sim-ch7.mjs・sim-ch8.mjs）
const KIT = { karim: [['ch7', 'gate'], ['ch8', 'jafar']], kai: [['ch7', 'light']], kai8: [['ch8', 'hades']], rion8: [['ch8', 'bowser']] };
const kitParty = (ch, boss, d) => (ch === 'ch7' ? ch7Party(boss, CH7_LV[boss] + d) : ch8Party(boss, CH8_LV[boss] + d));
// それより 前の ゲスト: その レベルの 店の いちばん よい 装備の 家族（職業は 第1部の 4つ・上級職）
const R = (lv) => Math.max(1, Math.min(10, Math.ceil(lv / 7)));
const JOBS4 = (lv) => (lv >= 40 ? ['hero', 'sage', 'god_hand', 'high_priest'] : ['warrior', 'priest', 'mage', 'monk']);
const shopParty = (lv) => JOBS4(lv).map((j, i) => jobChar(j, Math.max(1, lv), R(lv), `家族${i}`));

// ゲストごとの 家族（弱い −5・ふつう・強い ＋8・1人〈いちばん 強い 人／いちばん 弱い 人〉・4人）
function families(id) {
  const out = [];
  const kit = KIT[id];
  for (const [ch, boss] of kit || [[null, null]]) {
    for (const [d, label] of [[-5, '弱い'], [0, 'ふつう'], [8, '強い']]) {
      const fam = kit ? kitParty(ch, boss, d) : shopParty((GUESTS[id].minLevel || 1) + 2 + d);
      out.push([`${boss || 'shop'} ${label} 4人`, fam]);
      if (d === 0) {
        const ps = fam.map(charPower);
        out.push([`${boss || 'shop'} 1人（強い 人）`, [fam[ps.indexOf(Math.max(...ps))]]]);
        out.push([`${boss || 'shop'} 1人（弱い 人）`, [fam[ps.indexOf(Math.min(...ps))]]]);
        out.push([`${boss || 'shop'} 2人`, fam.slice(0, 2)]);
      }
    }
  }
  return out;
}

function check(id, label, fam) {
  const def = GUESTS[id];
  const min = def.minLevel || 1;
  const p = guestPlan(def, fam);
  const tag = `${id}・${label}`;
  // 同じ 入力なら 同じ 結果
  assert.deepEqual(guestPlan(def, fam), p, `${tag}: 同じ 結果`);
  // 床: minLevel・倍率 1 の 力は 下回らない（育ちの 力でも そのままの 力でも）
  const fc = guestBaseChar(def, min);
  assert.ok(p.level >= min, `${tag}: レベル ${p.level} ≧ minLevel ${min}`);
  assert.ok(p.power >= growPower(fc) - 0.5, `${tag}: 床 ${p.power.toFixed(0)} ≧ ${growPower(fc).toFixed(0)}`);
  assert.ok(p.raw >= charPower(fc) - 0.5, `${tag}: 床（そのままの 力）`);
  // 倍率の はば
  assert.ok(p.k >= GUEST_K[0] - EPS && p.k <= GUEST_K[1] + EPS, `${tag}: 倍率 ${p.k}`);
  // てんじょう: レベルの 上限・家族の いちばん 高い レベル・いちばん 強い 人（床の とき いがい）
  const top = Math.max(...fam.map((c) => c.level));
  assert.ok(p.level <= Math.max(min, Math.min(guestLevelCap(def), top)), `${tag}: レベル ${p.level} が 上限より 上`);
  if (!p.floor) {
    assert.ok(p.power <= p.max + 0.5, `${tag}: いちばん 強い 人 ${p.max.toFixed(0)} を こえた ${p.power.toFixed(0)}`);
    assert.ok(p.raw <= Math.max(...fam.map(charPower)) + 0.5, `${tag}: いちばん 強い 人（そのままの 力）を こえた`);
  }
  // 戦いの 中の ゲストの 力（倍率を かけた 人）が plan と 合う
  const a = allyFromCharacter(guestBaseChar(def, p.level), { kind: 'guest' });
  scaleGuestActor(a, p.k);
  assert.ok(Math.abs(fightPower(a) - p.raw) < 3, `${tag}: 戦いの 中の 力 ${fightPower(a).toFixed(0)} ≒ ${p.raw.toFixed(0)}`);
  // 力の 割合（育ちの 力）
  const avg = fam.reduce((s, c) => s + growPower(c), 0) / fam.length;
  assert.ok(Math.abs(p.avg - avg) < EPS && Math.abs(p.ratio - p.power / avg) < EPS, `${tag}: 平均`);
  if (p.ratio > GUEST_BAND[1] + 0.005) assert.ok(p.floor, `${tag}: 割合 ${p.ratio.toFixed(3)} が はばより 上なのは 床の ときだけ`);
  // 床で きまった ときは 床の 強さ ちょうど（床は てんじょうより 先）
  if (p.floor) assert.ok(Math.abs(p.power - growPower(fc)) < 1 || Math.abs(p.raw - charPower(fc)) < 1, `${tag}: 床の 強さ`);
  if (p.ratio < GUEST_BAND[0] - 0.005 && !p.floor) {
    // はばに とどかない ときは、きまりの 中で いちばん 強い（倍率 1.15・レベルは 上限）か、いちばん 強い 人で 止まった
    const lvTop = Math.max(min, Math.min(guestLevelCap(def), top));
    const rawMax = Math.max(...fam.map(charPower));
    assert.ok(p.cap && ((Math.abs(p.k - GUEST_K[1]) < EPS && p.level === lvTop) || Math.abs(p.power - p.max) < 1 || Math.abs(p.raw - rawMax) < 1),`${tag}: 割合 ${p.ratio.toFixed(3)} が はばより 下なのに 上限で ない（Lv${p.level}・倍率${p.k}）`);
  }
  if (!p.floor && !p.cap) assert.ok(p.ratio >= GUEST_BAND[0] - 0.005 && p.ratio <= GUEST_BAND[1] + 0.005, `${tag}: 割合 ${p.ratio.toFixed(3)} が はばの 外`);
  return p;
}

test('物さし: HP÷3 ＋ いちばん 大きい こうげき・魔力・回復 ＋ 守り÷2 ＋ すばやさ÷2・ぜんぶ k 倍で 力も k 倍', () => {
  assert.equal(fightPower({ maxHp: 300, atk: 200, mag: 50, heal: 10, dfn: 100, agi: 40 }), 100 + 200 + 50 + 20);
  assert.equal(fightPower({ maxHp: 300, atk: 20, mag: 250, heal: 10, dfn: 100, agi: 40 }), 100 + 250 + 50 + 20);
  // 戦いの 中の 人（healPow）でも
  assert.equal(fightPower({ maxHp: 300, atk: 20, mag: 50, healPow: 300, dfn: 100, agi: 40 }), 100 + 300 + 50 + 20);
  const a = { maxHp: 1000, hp: 500, atk: 400, dfn: 300, mag: 100, healPow: 100, agi: 150, alive: true };
  const before = fightPower(a);
  scaleGuestActor(a, 1.1);
  assert.ok(Math.abs(fightPower(a) - before * 1.1) < 3, 'k 倍');
  assert.equal(a.hp, 550, 'HP の 割合は そのまま');
  // 育ちの 力: 装備が ない 人は その レベルの ふつうの 力（職業の 得意・不得意を ならす）
  const kaiBare = { ...guestBaseChar(GUESTS.kai8, 86), equip: { weapon: null, armor: null, shield: null, head: null, acc: null } };
  const karimBare = { ...guestBaseChar(GUESTS.karim, 86), equip: { weapon: null, armor: null, shield: null, head: null, acc: null } };
  assert.ok(Math.abs(growPower(kaiBare) - levelPower(86)) < 1e-6 && Math.abs(growPower(karimBare) - levelPower(86)) < 1e-6);
  assert.ok(charPower(kaiBare) < charPower(karimBare), 'そのままの 力は 職業で ちがう');
  assert.ok(levelPower(90) > levelPower(80), 'レベルが 上がると 強い');
  assert.ok(growPower(guestBaseChar(GUESTS.kai8, 86)) > levelPower(86), '装備で 強く なる');
  assert.equal(GUEST_RATIO, 0.94);
  assert.deepEqual(GUEST_BAND, [0.9, 0.97]);
  assert.deepEqual(GUEST_K, [0.85, 1.15]);
  assert.ok(GUEST_LV_SPAN > 0);
});

test('全部の ゲスト × 家族（弱い・ふつう・強い・1人・2人・4人）: はば・床・てんじょう・同じ 結果', () => {
  const ids = Object.keys(GUESTS);
  assert.ok(ids.length >= 8, 'ゲストが ぜんぶ ある');
  let inBand = 0, n = 0;
  for (const id of ids) {
    for (const [label, fam] of families(id)) {
      const p = check(id, label, fam);
      n++;
      if (!p.floor && !p.cap) inBand++;
    }
  }
  assert.ok(n >= ids.length * 6, `ためした 数 ${n}`);
  assert.ok(inBand > 0, 'はばの 中に きまる 家族も ある');
});

test('ゲストの 力は 家族に 合わせて 動く（家族が 弱いと 床・強いと てんじょうの 中で 強く なる）・はばに 入る ときは 0.94 くらい', () => {
  // 家族と ほぼ 同じ 強さの ゲストを 作って ためす（第8章 第3幕の リオンを 第8章の ころの レベルで）
  const def = { ...GUESTS.rion8, id: 'guest_test', minLevel: 60, maxLevel: 99 };
  for (const d of [-5, 0, 8]) {
    const fam = ch8Party('bowser', CH8_LV.bowser + d);
    const p = guestPlan(def, fam);
    assert.ok(!p.floor && !p.cap, `Lv${CH8_LV.bowser + d}: 床・てんじょうで ない`);
    assert.ok(Math.abs(p.ratio - GUEST_RATIO) < 0.01, `割合 ${p.ratio.toFixed(3)}`);
    assert.ok(Math.abs(p.level - (CH8_LV.bowser + d)) <= 3, `レベル ${p.level} が 家族の 平均の 近く`);
  }
  // 家族が とても 弱い: minLevel と 装備の 強さ（床）
  const weak = shopParty(20);
  const pw = guestPlan(GUESTS.kai8, weak);
  assert.ok(pw.floor && pw.level === GUESTS.kai8.minLevel && pw.k === 1, '床');
  // 家族が とても 強い: レベルは 上限まで・家族の いちばん 強い 人は こえない
  const strong = ch8Party('bowser', 99);
  const ps = guestPlan(GUESTS.kai8, strong);
  assert.ok(ps.level <= guestLevelCap(GUESTS.kai8) && ps.power <= ps.max, 'てんじょう');
});

test('魔物の 仲間が まざっても 人間だけで 数える・人間が 0人なら 床', () => {
  const fam = ch8Party('hades', CH8_LV.hades);
  const mon = newMonsterCompanion({ id: 'm1', species: 'pururin', level: 99 });
  for (const id of ['kai8', 'karim', 'rion8']) {
    const a = guestPlan(GUESTS[id], fam);
    const b = guestPlan(GUESTS[id], [...fam, mon]);
    assert.deepEqual(b, a, `${id}: 魔物は 数えない`);
    const none = guestPlan(GUESTS[id], [mon]);
    assert.ok(none.floor && none.level === GUESTS[id].minLevel && none.k === 1, `${id}: 人間が 0人`);
    assert.ok(guestPlan(GUESTS[id], []).floor, `${id}: だれも いない`);
  }
});

test('戦いの キャラ: 職業・技・装備（minLevel の もの）は かわらない・HP と MP の 割合を うつす', () => {
  const fam = ch8Party('hades', CH8_LV.hades + 8);
  const base = guestBaseChar(GUESTS.kai8, GUESTS.kai8.minLevel);
  const party = guestBaseChar(GUESTS.kai8, GUESTS.kai8.minLevel);
  const st = computeStats(party);
  party.hp = Math.round(st.maxHp / 2);
  party.mp = 0;
  const { char, plan } = guestForBattle(GUESTS.kai8, fam, party);
  assert.ok(plan.level > GUESTS.kai8.minLevel, '強い 家族では レベルが 上がる');
  assert.equal(char.level, plan.level);
  assert.equal(char.job, base.job);
  assert.deepEqual(char.equip, base.equip, '装備は minLevel の もの');
  assert.deepEqual(char.hirameki, GUESTS.kai8.skills, '技');
  const cs = computeStats(char);
  assert.ok(Math.abs(char.hp / cs.maxHp - 0.5) < 0.01, 'HP の 割合');
  assert.equal(char.mp, 0);
  // たおれて いる ゲストは たおれた まま
  party.hp = 0;
  assert.equal(guestForBattle(GUESTS.kai8, fam, party).char.hp, 0);
  // 戦いの あと: 割合を もどす
  guestAfterBattle(party, { alive: true, hp: 300, maxHp: 1200, mp: 10, maxMp: 100 });
  assert.equal(party.hp, Math.round(st.maxHp / 4));
  guestAfterBattle(party, { alive: false, hp: 0, maxHp: 1200, mp: 10, maxMp: 100 });
  assert.equal(party.hp, 0);
});

async function battleWithGuest(offline, level) {
  const t0 = Date.now();
  const world = new GameWorld({ offline, rng: makeRng(78), checkPassword: () => true, rateLimit: false, now: () => 0.3 * DAY_MS + (Date.now() - t0) });
  const ken = new Bot(world, 'ケン');
  await ken.login();
  await ken.createAndPlay('warrior');
  await ken.settle();
  const c = world.data.characters[ken.char.id];
  c.level = level;
  c.hp = computeStats(c).maxHp;
  c.guests = ['kai8'];
  Object.assign(ken.s, { map: 'overworld', x: PLACES.village.x + 40, y: PLACES.village.y + 12 });
  afterRosterChange(world, ken.s);
  const p = partyOf(world, ken.s);
  p.supports = [];
  const g = p.guests[0];
  const joinLv = g.char.level;
  const gst = computeStats(g.char);
  g.char.hp = Math.round(gst.maxHp * 0.6);
  startFixedBattle(world, ken.s, [ken.s], 'goldoon');
  const ctx = [...world.battles.values()].pop();
  return { world, ken, c, g, ctx, joinLv };
}

test('サーバーと ひとりモード: ゲストは きまりの 強さで 戦いに 入る（同じ 結果）・戦いの あと HP の 割合が もどる', { timeout: 60000 }, async () => {
  const out = [];
  for (const offline of [false, true]) {
    const { world, ken, c, g, ctx, joinLv } = await battleWithGuest(offline, 95);
    const a = ctx.battle.allies.find((x) => x.kind === 'guest');
    assert.ok(a, 'ゲストが いる');
    const plan = guestPlan(GUESTS.kai8, [c]);
    assert.equal(a.lv, plan.level, 'レベル');
    const bst = computeStats(guestBaseChar(GUESTS.kai8, plan.level));
    assert.equal(a.maxHp, Math.round(bst.maxHp * plan.k), '最大HP に 倍率');
    assert.equal(a.atk, Math.round(bst.atk * plan.k), 'こうげきに 倍率');
    assert.ok(Math.abs(a.hp / a.maxHp - 0.6) < 0.01, 'HP の 割合');
    out.push({ lv: a.lv, maxHp: a.maxHp, atk: a.atk, dfn: a.dfn, agi: a.agi, k: a.guestK });
    // 勝つ（ゲージを すすめて おわらせる）
    a.hp = Math.round(a.maxHp * 0.25);
    ctx.battle.allyActs = 2;
    for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
    ctx.battle.checkEnd();
    for (let i = 0; i < 200 && !ctx.battle.over; i++) await tickN(world, 1);
    await tickN(world, 2);
    ken.flushQueue();
    assert.ok(!world.battles.has(ctx.id), '戦いが おわった');
    const st = computeStats(g.char);
    assert.ok(Math.abs(g.char.hp / st.maxHp - 0.25) < 0.01, `戦いの あとの HP ${g.char.hp}/${st.maxHp}`);
    assert.equal(g.char.level, joinLv, 'パーティーの ゲストの レベルは そのまま');
  }
  assert.deepEqual(out[0], out[1], 'サーバーと ひとりモードで 同じ');
});
