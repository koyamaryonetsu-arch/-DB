// こうどうゲージ（すばやさの 差は すこしだけ）・ムチ（グループ）・ブーメラン（全体）・グループの ねらい
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, ATB, agiFactor, speedMult, fillTime, atbRate, turnSeconds, attackReach, reachFalloff, REACH_FALLOFF } from '../public/js/shared/battle.js';
import { newCharacter, fullHeal, computeStats, canEquip } from '../public/js/shared/stats.js';
import { JOBS, jobBattlesForLevel } from '../public/js/shared/data/jobs.js';
import { ITEMS, WEAPON_CAT_NAMES, ITEM_KANA } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { makeRng } from '../public/js/shared/rng.js';

function char(job, level = 10, id = job, weapon = null) {
  const c = newCharacter({ id, name: id, look: {}, job });
  c.level = level;
  c.jobs[job] = { lv: 5, b: jobBattlesForLevel(5, JOBS[job].tier) };
  if (weapon) c.equip.weapon = weapon;
  fullHeal(c);
  return c;
}

// 敵は うごかない（テストの じゃまを しない）
function battle(c, enemies, seed = 1) {
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }], enemies, canFlee: false });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 9999;
    e.agi = 1;
    e.buffs = {};
  }
  return b;
}

// みかたの こうげきを 1回 する（ev を かえす）
function attack(b, target) {
  const me = b.allies[0];
  const ev = { lines: [], upd: [], results: [] };
  b.perform(me, { type: 'attack', target }, ev);
  return ev;
}

// rng.chance を いじる: あたりは かならず あたる。会心は crits の じゅんに きめる
function fixRolls(b, crits = []) {
  const q = crits.slice();
  const orig = b.rng.chance.bind(b.rng);
  b.rng.chance = (p) => (p > 0.5 ? true : p < 0.1 ? (q.length ? q.shift() : false) : orig(p));
}

// ───────────── こうどうゲージ ─────────────

test('ATB: すばやさ 15 と 45（3ばい）でも たまる はやさは 1.15〜1.25ばい', () => {
  const r = fillTime(15) / fillTime(45);
  assert.ok(r >= 1.15 && r <= 1.25, `ratio ${r}`);
  // ふつうの はんい（5〜120）でも 差は おだやか
  assert.ok(fillTime(5) / fillTime(120) < 1.8, `5 vs 120: ${fillTime(5) / fillTime(120)}`);
  // じゅんばんは かわらない（はやい ほうが すこし はやい）
  for (let a = 2; a < 200; a += 7) assert.ok(fillTime(a + 1) < fillTime(a));
  // すばやさ 30（きじゅん）で ATB.base
  assert.equal(Math.round(fillTime(ATB.ref)), ATB.base);
  assert.equal(agiFactor(0), agiFactor(1), '0 や マイナスでも こわれない');
  assert.ok(Number.isFinite(fillTime(0)));
  // ステータスの まどの めやす（秒）
  assert.ok(Math.abs(turnSeconds(30, 1) - ATB.base / 1000) < 1e-9);
  assert.ok(turnSeconds(30, 2) < turnSeconds(30, 1));
});

test('ATB: ピオリムは やく 1.25ばい、すばやさを 下げられると やく 0.8ばい（すばやさとは べつの 倍率）', () => {
  const piorim = Object.values(ABILITIES).find((a) => a.effect?.type === 'buff' && a.effect.stat === 'agi' && a.effect.mult >= 1.3 && a.target === 'allies');
  assert.ok(piorim, 'ピオリム');
  const base = { agi: 30, buffs: {}, debuffs: {} };
  const up = { agi: 30, buffs: { agi: { mult: piorim.effect.mult, turns: 9 } }, debuffs: {} };
  const down = { agi: 30, buffs: {}, debuffs: { agi: { mult: 0.72, turns: 9 } } };
  const ru = atbRate(up) / atbRate(base);
  const rd = atbRate(down) / atbRate(base);
  assert.ok(ru >= 1.2 && ru <= 1.3, `buff ${ru}`);
  assert.ok(rd >= 0.75 && rd <= 0.85, `debuff ${rd}`);
  // すばやさの 数字ではなく 倍率で かかる（すばやさが ちがっても おなじ 倍率）
  const fast = { agi: 90, buffs: up.buffs, debuffs: {} };
  assert.ok(Math.abs(atbRate(fast) / atbRate({ agi: 90, buffs: {}, debuffs: {} }) - ru) < 1e-9);
  assert.equal(speedMult(base), 1);
});

test('ATB: ボスは とくべつな 速さ（書かなければ 0.7。monsters の speed が あれば そちら）', () => {
  const b = new Battle({ rng: makeRng(4), allies: [{ char: char('warrior'), controller: 's1' }], enemies: ['goldoon'] });
  const boss = b.enemies[0];
  assert.equal(boss.speed, MONSTERS.goldoon.speed || ATB.boss);
  const b2 = new Battle({ rng: makeRng(4), allies: [{ char: char('warrior'), controller: 's1' }], enemies: ['pururin'] });
  assert.equal(b2.enemies[0].speed, 1, 'ふつうの 敵は 1');
  // speed の ない ボスは ATB.boss
  const plain = Object.entries(MONSTERS).find(([, m]) => m.boss && !m.speed);
  if (plain) {
    const b3 = new Battle({ rng: makeRng(4), allies: [{ char: char('warrior'), controller: 's1' }], enemies: [plain[0]] });
    assert.equal(b3.enemies[0].speed, ATB.boss);
  }
  // 倍率は ゲージの はやさに そのまま かかる
  assert.ok(Math.abs(atbRate(boss) / atbRate({ agi: boss.agi, buffs: boss.buffs, debuffs: boss.debuffs }) - boss.speed) < 1e-9);
});

// ───────────── ムチ ─────────────

test('ムチ: えらんだ 敵と おなじ 種類の 敵 みんなに あたり、2体目から 弱くなる（ちがう 種類には あたらない）', () => {
  const c = char('performer', 12, 'ムチ', 'leather_whip');
  assert.equal(computeStats(c).weaponCat, 'whip');
  assert.equal(attackReach('whip'), 'group');
  const b = battle(c, ['pururin', 'koumorin', 'pururin', 'pururin']);
  const me = b.allies[0];
  assert.equal(me.weaponCat, 'whip');
  const [p1, bat, p2, p3] = b.enemies;
  // まんなかの スライムを えらぶ: その 1体が さいしょ、あとは 左から
  const plan = b.attackPlan(me, p2.id);
  assert.deepEqual(plan.map((p) => p.t.id), [p2.id, p1.id, p3.id]);
  assert.deepEqual(plan.map((p) => p.mult), REACH_FALLOFF.whip.slice(0, 3));
  fixRolls(b);
  const ev = attack(b, p2.id);
  assert.equal(ev.lines[0], 'ムチはムチをふるった！');
  assert.deepEqual(ev.fx.targets, [p2.id, p1.id, p3.id]);
  assert.equal(ev.fx.reach, 'group');
  const hit = new Set(ev.results.map((r) => r.id));
  assert.ok(!hit.has(bat.id), 'コウモリには あたらない');
  assert.equal(hit.size, 3);
  for (const r of ev.results) assert.ok(r.dmg > 0, JSON.stringify(r));
  // コウモリを えらぶと コウモリ だけ
  const ev2 = attack(b, bat.id);
  assert.deepEqual(ev2.results.map((r) => r.id), [bat.id]);
});

test('ムチ: ダメージは じゅんに へる（会心は 1体ずつ きまる）', () => {
  const c = char('performer', 12, 'ムチ', 'leather_whip');
  // ばらつきを なくして くらべる
  const sum = [0, 0, 0];
  for (let seed = 1; seed <= 30; seed++) {
    const b = battle(c, ['pururin', 'pururin', 'pururin'], seed);
    for (const e of b.enemies) e.dfn = 0;
    fixRolls(b);
    const ev = attack(b, b.enemies[0].id);
    ev.results.forEach((r, i) => { sum[i] += r.dmg; });
  }
  assert.ok(sum[0] > sum[1] && sum[1] > sum[2], `sums ${sum}`);
  const r1 = sum[1] / sum[0], r2 = sum[2] / sum[0];
  assert.ok(Math.abs(r1 - REACH_FALLOFF.whip[1]) < 0.06, `2体目 ${r1}`);
  assert.ok(Math.abs(r2 - REACH_FALLOFF.whip[2]) < 0.06, `3体目 ${r2}`);

  // 2体目 だけ 会心
  const b = battle(c, ['pururin', 'pururin', 'pururin'], 7);
  fixRolls(b, [false, true, false]);
  const ev = attack(b, b.enemies[0].id);
  assert.deepEqual(ev.results.map((r) => !!r.crit), [false, true, false]);
  assert.equal(ev.lines.filter((l) => l === '会心の一撃！').length, 1);
});

test('ムチ: 力ためは あたった 敵 みんなに のって、そのあと きえる（ぜんぶ よけられたら のこる）', () => {
  const c = char('performer', 12, 'ムチ', 'leather_whip');
  const b = battle(c, ['pururin', 'pururin', 'pururin'], 3);
  for (const e of b.enemies) e.dfn = 0;
  const me = b.allies[0];
  fixRolls(b);
  const normal = attack(b, b.enemies[0].id).results.map((r) => r.dmg);
  me.charge = 2;
  const charged = attack(b, b.enemies[0].id).results.map((r) => r.dmg);
  assert.equal(me.charge, 1, 'つかったら きえる');
  for (let i = 0; i < 3; i++) assert.ok(charged[i] > normal[i] * 1.5, `#${i} ${charged[i]} vs ${normal[i]}`);
  // ぜんぶ よけられた
  me.charge = 2;
  b.rng.chance = () => false;
  const ev = attack(b, b.enemies[0].id);
  assert.ok(ev.results.every((r) => r.miss));
  assert.equal(me.charge, 2, 'あたらなければ のこる');
});

test('ムチ: こんらん している ときと 敵の ムチは 1体だけ', () => {
  const c = char('performer', 12, 'ムチ', 'leather_whip');
  const b = battle(c, ['pururin', 'pururin', 'pururin'], 5);
  const me = b.allies[0];
  fixRolls(b);
  const ev = { lines: [], upd: [], results: [] };
  b.perform(me, { type: 'attack', target: b.enemies[0].id, confused: true }, ev);
  assert.ok(ev.results.length <= 1);
  // 敵が ムチを もっていても みかたの グループには ならない
  const foe = b.enemies[0];
  foe.weaponCat = 'whip';
  assert.equal(b.attackPlan(foe, me.id).length, 1);
});

// ───────────── ブーメラン ─────────────

test('ブーメラン: 敵 全体に あたり、左から じゅんに 弱くなる', () => {
  const c = char('performer', 12, 'ブメ', 'wood_boomerang');
  assert.equal(computeStats(c).weaponCat, 'boomerang');
  assert.equal(attackReach('boomerang'), 'enemies');
  const b = battle(c, ['pururin', 'koumorin', 'tsunousagi', 'pururin', 'goblin']);
  const me = b.allies[0];
  // だれを えらんでも 左から ぜんぶ
  const plan = b.attackPlan(me, b.enemies[2].id);
  assert.deepEqual(plan.map((p) => p.t.id), b.enemies.map((e) => e.id));
  assert.deepEqual(plan.map((p) => p.mult), REACH_FALLOFF.boomerang.slice(0, 5));
  for (let i = 1; i < 5; i++) assert.ok(reachFalloff('boomerang', i) < reachFalloff('boomerang', i - 1));
  assert.equal(reachFalloff('boomerang', 9), REACH_FALLOFF.boomerang.at(-1), '6体目より あとも こわれない');
  fixRolls(b);
  const ev = attack(b, undefined);
  assert.equal(ev.lines[0], 'ブメはブーメランを投げた！');
  assert.equal(ev.fx.reach, 'enemies');
  assert.deepEqual([...new Set(ev.results.map((r) => r.id))], b.enemies.map((e) => e.id));
  // たおれた 敵には あたらない
  b.enemies[1].hp = 0;
  b.enemies[1].alive = false;
  const ev2 = attack(b, undefined);
  assert.ok(!ev2.results.some((r) => r.id === b.enemies[1].id));
  assert.equal(ev2.results.length, 4);
});

test('ブーメラン: 1体あたりは 剣より 弱い（いちばん 前の 敵でも 同じ ランクの 剣より 攻撃力が ひくい）', () => {
  const swords = Object.values(ITEMS).filter((it) => it.type === 'weapon' && it.cat === 'sword' && !it.star);
  for (const [id, it] of Object.entries(ITEMS)) {
    if (it.cat !== 'boomerang') continue;
    const same = swords.filter((s) => s.rank === it.rank);
    if (!same.length) continue;
    const best = Math.max(...same.map((s) => s.atk));
    assert.ok(it.atk < best, `${id} atk ${it.atk} < sword ${best}`);
  }
});

test('ブーメラン: 道具・お店・職業・名前', () => {
  for (const id of ['wood_boomerang', 'iron_boomerang', 'silver_boomerang', 'steel_boomerang', 'gale_boomerang']) {
    const it = ITEMS[id];
    assert.ok(it, id);
    assert.equal(it.cat, 'boomerang');
    assert.ok(ITEM_KANA[id], `${id} kana`);
  }
  assert.equal(WEAPON_CAT_NAMES.boomerang, 'ブーメラン');
  assert.equal(ITEMS.wood_boomerang.rank, 1);
  assert.equal(ITEMS.iron_boomerang.rank, 3);
  assert.equal(ITEMS.silver_boomerang.rank, 4);
  assert.equal(ITEMS.steel_boomerang.rank, 5);
  // お店の しなもの（ぜんぶの リストを たどる）
  const sold = new Set();
  const walk = (v) => {
    if (typeof v === 'string') sold.add(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(SHOPS);
  assert.ok(sold.has('wood_boomerang'), '木の ブーメランは 最初の 町で 買える');
  assert.ok(sold.has('iron_boomerang'));
  assert.ok(sold.has('steel_boomerang'), 'はがねの ブーメランは 第3章の 鉱山の町で 買える');
  assert.ok(!sold.has('gale_boomerang'), 'はやての ブーメランは まれな おとしもの');
  // 旅芸人・遊び人・忍者などは もてる。戦士は もてない
  const who = (job) => canEquip(job, 'wood_boomerang');
  assert.ok(who('performer'));
  assert.ok(!who('warrior'));
  assert.ok(Object.values(MONSTERS).some((m) => m.drops?.rare?.[0] === 'gale_boomerang'), 'まれな おとしもの');
});

// ───────────── グループの ねらい ─────────────

test('グループ呪文: えらんだ 敵が さいしょ、あとは おなじ 種類の 敵（ほかの 種類は ふくまない）', () => {
  const c = char('mage', 12, 'まほう');
  const b = battle(c, ['pururin', 'koumorin', 'pururin', 'koumorin']);
  const me = b.allies[0];
  const gira = ABILITIES.gira;
  assert.equal(gira.target, 'group');
  const [p1, b1, p2, b2] = b.enemies;
  assert.deepEqual(b.targetsFor(me, gira, { target: p2.id }).map((t) => t.id), [p2.id, p1.id]);
  assert.deepEqual(b.targetsFor(me, gira, { target: b1.id }).map((t) => t.id), [b1.id, b2.id]);
  // たおれた 敵は ふくまない
  p1.alive = false;
  assert.deepEqual(b.targetsFor(me, gira, { target: p2.id }).map((t) => t.id), [p2.id]);
  // えらんだ 敵が もう いない ときは のこっている 敵から
  b1.alive = false;
  const t = b.targetsFor(me, gira, { target: b1.id });
  assert.ok(t.length >= 1 && t.every((x) => x.alive));
  assert.ok(t.every((x) => x.species === t[0].species));
});

test('呪文・技の 対象: せつめいと 対象が あっている', () => {
  for (const [id, a] of Object.entries(ABILITIES)) {
    const d = a.desc || '';
    if (!d || a.kind === 'monster') continue;
    if (a.target === 'group') assert.ok(!d.includes('敵全体'), `${id} は グループ なのに「敵全体」: ${d}`);
    if (d.includes('同じ種類の敵')) assert.equal(a.target, 'group', `${id}: ${d}`);
    if (a.target === 'enemy' && !a.effect?.random) assert.ok(!d.includes('敵全体'), `${id} は 1体 なのに「敵全体」: ${d}`);
  }
  // 見なおした 技
  for (const id of ['am_begiragon', 'hp_bagimuta', 'nj_fuujin']) assert.equal(ABILITIES[id].target, 'group', id);
});

test('呪文・技の 対象: おなじ 職業・おなじ くらいの 技なら 全体・グループの ほうが 1体あたり 弱い', () => {
  // 物理技は 倍率、呪文は きほんの ダメージで くらべる（物理と 呪文は べつべつ）
  const per = (a) => (a.effect.type === 'phys' ? (a.effect.mult ?? 1) : (a.effect.base[0] + a.effect.base[1]) / 2) * (a.effect.hits || 1);
  const byJob = {};
  for (const [id, a] of Object.entries(ABILITIES)) {
    if (!['phys', 'magic'].includes(a.effect?.type) || a.kind === 'monster' || !a.job || a.effect.random) continue;
    (byJob[`${a.job}/${a.effect.type}`] ||= []).push([id, a]);
  }
  let checked = 0;
  for (const [job, list] of Object.entries(byJob)) {
    for (const [id, a] of list) {
      if (a.target !== 'group' && a.target !== 'enemies') continue;
      // おなじ くらいの 技 = MP が 半分〜2ばい（その 職業の いちばん 上の 技などは くらべる 相手が いない）
      const mp = Math.max(1, a.mp || 0);
      const peers = list.filter(([, s]) => s.target === 'enemy' && (s.mp || 0) >= mp / 2 && (s.mp || 0) <= mp * 2);
      if (!peers.length) continue;
      const strongest = Math.max(...peers.map(([, s]) => per(s)));
      assert.ok(per(a) < strongest, `${job}/${id} ${per(a)} >= ${strongest}`);
      checked++;
    }
  }
  assert.ok(checked >= 10, `checked ${checked}`);
});
