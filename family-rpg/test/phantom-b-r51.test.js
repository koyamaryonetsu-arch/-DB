// 第51回 C2: 幻の職業（tier 4）の 4つ: 名探てい王・銀河の女王・大魔導王・天下むそうの剣聖（docs/plan-r51-phantom.md）
//  ・職業の 形（tier 4・req 2つ・8つの 技・看板の 技）・強さは 伝説の 職業より 1〜2わり 上・技は もとの 職業より 強い
//  ・新しい こうか（shared/battle-r51b.js）: 先読み（yomi）・バリア（barrier）・二重呪文（twinCast）・剣気（passive.critStack・kenki）
//  ・文字（小学校の 漢字・分かち書きなし）
//  ・ならびの 表（PHANTOM_ORDER・ALL_JOBS）は F 班が 足すので ここでは 見ない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { PHANTOM_JOBS_B, PHANTOM_HINTS_B } from '../public/js/shared/data/jobs-phantom-b.js';
import { PHANTOM_ABILITIES_B } from '../public/js/shared/data/abilities-phantom-b.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { JOB_TAGS } from '../public/js/shared/data/job-tags.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, gainExp, expForLevel, fullHeal, jobAbilities } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { kenkiMult, kenkiCrit, critStackOf, barrierDamage } from '../public/js/shared/battle-r51b.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = { detective_king: ['meitantei', 'oshiri_tantei'], galaxy_queen: ['neo_queen', 'fifth_spirit'], grand_magus: ['archmage', 'harry'], sword_saint: ['hiten', 'abarenbo_shogun'] };
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const BOY = { body: 0 }, GIRL = { body: 1 };

// ───────────── 職業 ─────────────
test('第51回 C2: 4つの 幻の職業（tier 4・きわめる 職業 2つ・reqSuper なし・タグ・うわさ・試練の ことば）', () => {
  assert.deepEqual(Object.keys(PHANTOM_JOBS_B).sort(), Object.keys(NEW).sort());
  for (const [id, req] of Object.entries(NEW)) {
    const j = JOBS[id];
    assert.equal(j, PHANTOM_JOBS_B[id], `${id} は JOBS に まざる`);
    assert.equal(j.id, id);
    assert.equal(j.tier, 4, id);
    assert.deepEqual(j.req, req, id);
    for (const r of req) assert.ok(JOBS[r] && JOBS[r].tier < 4, `${id}: ${r}`);
    assert.equal(j.reqSuper, undefined, id);
    assert.ok(j.name && j.kana && j.short && j.desc && j.color && j.family, id);
    assert.ok(Array.isArray(j.weapons) && j.weapons.length && Array.isArray(j.armor), id);
    assert.ok(JOB_TAGS[id].length >= 2 && JOB_TAGS[id].length <= 4 && j.tags === JOB_TAGS[id], id);
    for (const s of [j.name, j.desc, PHANTOM_HINTS_B[id], TRIAL_WORDS[id]]) textOk(s, id);
    assert.ok(TRIAL_WORDS[id].length <= 32, id);
  }
  assert.equal(JOBS.sword_saint.name, '天下むそうの剣聖', '「双」は 習わない 字');
  // 男の子の 銀河の女王は 銀河の王
  assert.equal(jobLabel('galaxy_queen', { look: BOY }), '銀河の王');
  assert.equal(jobLabel('galaxy_queen', { look: GIRL }), '銀河の女王');
  textOk(JOBS.galaxy_queen.masc.desc, 'masc');
});

test('第51回 C2: 強さは 伝説の 職業より 1〜2わり 上（もとの 伝説の 職業より 強い）', () => {
  const legend = Object.values(JOBS).filter((j) => j.tier === 3);
  const avg = legend.reduce((s, j) => s + sum(j.id), 0) / legend.length;
  for (const [id, req] of Object.entries(NEW)) {
    const r = sum(id) / avg;
    assert.ok(r >= 1.08 && r <= 1.2, `${id}: 伝説の へいきんの ${r.toFixed(2)}倍`);
    for (const q of req) assert.ok(sum(id) > sum(q), `${id} > ${q}`);
    // 得意な 数値は もとの 職業の いちばん 高い ほうより 上
    const best = Object.entries(JOBS[id].mods).sort((a, b) => b[1] - a[1])[0][0];
    assert.ok(JOBS[id].mods[best] > Math.max(...req.map((q) => JOBS[q].mods[best])), `${id}: ${best}`);
  }
  assert.ok(JOBS.sword_saint.passive.critStack.cap > 0);
});

// ───────────── 技 ─────────────
test('第51回 C2: 技は 8つ（Lv1〜10）・job つき・Lv10 の 看板の 技が いちばん MP・せつめいと 文字', () => {
  for (const id of Object.keys(NEW)) {
    const learn = JOBS[id].learn;
    assert.equal(learn.length, 8, id);
    assert.deepEqual(learn.map(([l]) => l), [1, 2, 3, 4, 5, 7, 8, 10], id);
    const sig = `${id}_sig`;
    assert.equal(learn[7][1], sig);
    assert.equal(ABILITIES[sig].anim, `ox_${sig}`);
    const mps = learn.map(([, a]) => ABILITIES[a].mp);
    assert.equal(Math.max(...mps), ABILITIES[sig].mp, `${id}: 看板が いちばん MP`);
    assert.ok(learn.filter(([, a]) => abilityRole(ABILITIES[a]) === 'dmg').length >= 3, `${id}: 攻撃の 技`);
    const names = new Set();
    for (const [, a] of learn) {
      const ab = ABILITIES[a];
      assert.equal(ab, PHANTOM_ABILITIES_B[a], a);
      assert.equal(ab.job, id, a);
      assert.ok(ab.kana && ab.desc && ab.cast && /^ox_/.test(ab.anim), a);
      for (const s of [ab.name, ab.desc, ab.cast]) textOk(s, a);
      assert.ok(!names.has(ab.name), a);
      names.add(ab.name);
      // みんなに かける 補助の 上限（1つ 1.4倍・いくつも 1.35倍まで）
      for (const p of partsOf(ab.effect)) {
        if (p.type !== 'buff' || !p.mult) continue;
        const cap = ab.target === 'allies' ? ((p.stats || [p.stat]).length > 1 ? 1.35 : 1.4) : 1.55;
        assert.ok(p.mult <= cap, `${a}: ${p.mult}`);
      }
    }
  }
  // 技は ほかの 技と 名前が かぶらない
  const other = Object.entries(ABILITIES).filter(([id]) => !PHANTOM_ABILITIES_B[id]).map(([, a]) => a.name);
  for (const a of Object.values(PHANTOM_ABILITIES_B)) assert.ok(!other.includes(a.name), a.name);
});

test('第51回 C2: 技を 覚えられる（職業レベルで じゅんに）', () => {
  for (const id of Object.keys(NEW)) {
    const c = newCharacter({ id: 'p', name: 'ヒナ', job: 'warrior' });
    c.jobs[id] = { lv: 1, b: 0 };
    assert.deepEqual(jobAbilities(c, id), [JOBS[id].learn[0][1]], id);
    c.jobs[id] = { lv: JOB_MAX_LEVEL, b: 999 };
    assert.deepEqual(jobAbilities(c, id), JOBS[id].learn.map(([, a]) => a), id);
  }
});

test('第51回 C2: 技は もとの 職業の 技より 強い', () => {
  const magicMax = (id) => partsOf(ABILITIES[id].effect).filter((p) => p.type === 'magic' || p.type === 'deduce').reduce((s, p) => s + p.base[1], 0);
  const physPow = (id) => { const e = ABILITIES[id].effect; return (e.mult || 0) * (e.hits || 1); };
  assert.ok(magicMax('detective_king_sig') > magicMax('meitantei_sig'));
  assert.ok(magicMax('tk_suiri') > magicMax('os_suiri'));
  assert.ok(magicMax('galaxy_queen_sig') > magicMax('neo_queen_sig'));
  assert.ok(magicMax('galaxy_queen_sig') > magicMax('fifth_spirit_sig'));
  assert.ok(magicMax('gq_hoshi') > magicMax('nq_hikari'));
  assert.ok(partsOf(ABILITIES.gq_iyashi.effect)[0].base[1] > partsOf(ABILITIES.nq_iyashi.effect)[0].base[1]);
  assert.ok(magicMax('gm_medroa') > magicMax('am_medroa'));
  assert.ok(magicMax('grand_magus_sig') > magicMax('fifth_spirit_sig'));
  assert.ok(physPow('sword_saint_sig') > physPow('hiten_sig') && physPow('sword_saint_sig') > physPow('abarenbo_shogun_sig'));
  assert.ok(physPow('ks_issen') > physPow('ht_shinsoku'));
});

// ───────────── たたかい ─────────────
function setup(job, { seed = 3, enemies = ['rockman', 'rockman', 'skeleton'], boss = false } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(45));
  for (const r of NEW[job]) c.jobs[r] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.jobs[job] = { lv: JOB_MAX_LEVEL, b: 999 };
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }], enemies, canFlee: true });
  const me = b.allies[0];
  me.mp = me.maxMp = 999;
  // 幻の職業の 技（PHANTOM_ORDER は F 班が 足すので ここで 持たせる）
  for (const [, id] of JOBS[job].learn) if (!me.abilities.includes(id)) me.abilities.push(id);
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; if (boss) e.boss = true; }
  return { b, me };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntil = (b, id) => {
  const evs = [];
  for (let i = 0; i < 600 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.filter((e) => e.t === 'act');
};
const use = (b, me, id, target) => {
  assert.ok(readyUp(b, me));
  b.command(me.id, { type: 'ability', id, target }, 's1');
  return runUntil(b, me.id).find((e) => e.id === me.id);
};

test('第51回 C2: 先読み（名探てい王）: 読まれた 敵は 次の 行動を つぶされ、反撃を うける', () => {
  const { b, me } = setup('detective_king');
  const e = b.enemies[0];
  const ev = use(b, me, 'tk_yomi', e.id);
  assert.ok(ev.lines.some((l) => l.includes('次の行動を読んだ')), ev.lines.join('/'));
  assert.equal(e.yomi.by, me.id);
  assert.equal(pub(e).yomi, true);
  const hp0 = e.hp;
  const act = runUntil(b, e.id).find((x) => x.id === e.id);
  assert.ok(act.yomiHit && act.yomiHit.stop, act.lines.join('/'));
  assert.ok(act.lines.some((l) => l.includes('動きをつぶされた')));
  assert.ok(e.hp < hp0, '反撃の ダメージ');
  assert.equal(e.yomi, undefined, '読みは 1回で 消える');
  assert.equal(act.fx.anim, 'ox_tk_yomi_hit');
  // 敵全体を 読む 看板の 技
  const { b: b2, me: me2 } = setup('detective_king');
  use(b2, me2, 'detective_king_sig', b2.enemies[0].id);
  assert.ok(b2.enemies.every((x) => x.yomi), '敵全体');
});

test('第51回 C2: 先読み: ボスは つぶせない ことも ある（反撃は する）・読んだ 人が ねむっていると 消える', () => {
  let stop = 0, n = 0;
  for (let seed = 1; seed <= 24; seed++) {
    const { b, me } = setup('detective_king', { seed, boss: true });
    const e = b.enemies[0];
    use(b, me, 'tk_yomi', e.id);
    if (!e.yomi) continue;
    const act = runUntil(b, e.id).find((x) => x.id === e.id);
    if (!act?.yomiHit) continue;
    n++;
    if (act.yomiHit.stop) stop++;
  }
  assert.ok(n >= 10 && stop > 0 && stop < n, `${stop}/${n}`);
  const { b, me } = setup('detective_king');
  const e = b.enemies[0];
  use(b, me, 'tk_yomi', e.id);
  me.status.sleep = { turns: 3 };
  const act = runUntil(b, e.id).find((x) => x.id === e.id);
  assert.ok(!act.yomiHit, 'ねむっていると 反撃しない');
});

test('第51回 C2: バリア（銀河の女王）: ダメージを すいとって、0 に なると われる', () => {
  const { b, me } = setup('galaxy_queen');
  const ev = use(b, me, 'gq_amanogawa');
  assert.ok(me.barrier > 50, `バリア ${me.barrier}`);
  assert.ok(ev.lines.some((l) => l.includes('星くずのバリア')));
  assert.equal(pub(me).barrier, Math.round(me.barrier));
  // ちょくせつ: 小さな ダメージは ぜんぶ すいとる・大きな ダメージは のこりが とおる
  const e = b.enemies[0];
  const hp0 = me.hp;
  const bar = me.barrier;
  const ev2 = { lines: [], upd: [], results: [] };
  b.damage(e, me, 10, ev2, {});
  assert.equal(me.hp, hp0);
  assert.equal(me.barrier, bar - 10);
  const ev3 = { lines: [], upd: [], results: [] };
  b.damage(e, me, bar + 5, ev3, {});
  assert.equal(me.barrier, undefined, 'われた');
  assert.equal(me.hp, hp0 - 15);
  assert.ok(ev3.lines.some((l) => l.includes('バリアがわれた')));
  // 味方どうし（自分の 技）では へらない
  me.barrier = 30;
  assert.equal(barrierDamage(b, me, me, 20, { lines: [], upd: [] }), 20);
  assert.equal(me.barrier, 30);
  // かさならない（強い ほうが のこる）
  use(b, me, 'gq_barrier');
  const big = me.barrier;
  use(b, me, 'gq_barrier');
  assert.ok(me.barrier <= Math.max(big, 140));
});

test('第51回 C2: 二重呪文（大魔導王）: 構えの あと 攻撃の 呪文が もう1度 出る（2回まで）', () => {
  const { b, me } = setup('grand_magus');
  const e = b.enemies[0];
  const plain = use(b, me, 'gm_hyouka', e.id);
  assert.equal(plain.results.filter((r) => r.id === e.id && r.dmg > 0).length, 2, '炎と 氷の 2つ');
  use(b, me, 'gm_niju');
  assert.equal(me.twinCast.left, 2);
  assert.equal(pub(me).twin, 2);
  const ev = use(b, me, 'gm_hyouka', e.id);
  assert.ok(ev.twin && ev.lines.some((l) => l.startsWith('二重呪文！')), ev.lines.join('/'));
  assert.equal(ev.results.filter((r) => r.id === e.id && r.dmg > 0).length, 4, 'もう1度 出た');
  assert.equal(me.twinCast.left, 1);
  // 補助の 呪文では 使わない
  const sh = use(b, me, 'gm_shugo');
  assert.ok(!sh.twin);
  assert.equal(me.twinCast.left, 1);
  use(b, me, 'gm_hyouka', e.id);
  assert.equal(me.twinCast, undefined, '2回で おわり');
  const last = use(b, me, 'gm_hyouka', e.id);
  assert.ok(!last.twin);
});

test('第51回 C2: 剣気（天下むそうの剣聖）: 会心が 出るたびに 強く なる（上限まで）。ほかの 職業は かわらない', () => {
  const { b, me } = setup('sword_saint');
  const cs = critStackOf(me);
  assert.ok(cs && cs.per > 0 && cs.cap >= 5);
  assert.equal(kenkiMult(me), 1);
  // 剣気の 技
  use(b, me, 'ks_kenki');
  assert.equal(me.kenki, 3);
  assert.equal(pub(me).kenki, 3);
  assert.ok(kenkiMult(me) > 1 && kenkiCrit(me) > 0);
  assert.ok(kenkiMult(me, ABILITIES.ks_kiwami.effect) > kenkiMult(me), 'critScale の 技は もっと');
  // 会心で 上がる（上限まで）
  let crits = 0;
  for (let i = 0; i < 14; i++) {
    const ev = use(b, me, 'ks_kiwami', b.enemies.find((x) => x.alive).id);
    crits += ev.results.filter((r) => r.crit).length;
  }
  assert.ok(crits > 0);
  assert.equal(me.kenki, Math.min(cs.cap, 3 + crits));
  // ダメージの みつもりも 上がる
  const e = b.enemies.find((x) => x.alive);
  const k = me.kenki;
  const hi = b.calcPhys(me, e, { mult: 1 }, 1, 'phys', true).dmg;
  me.kenki = 0;
  const lo = b.calcPhys(me, e, { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(hi > lo, `${lo} → ${hi}`);
  me.kenki = k;
  // ほかの 職業は 剣気が ない
  const { me: other } = setup('galaxy_queen');
  other.kenki = 5;
  assert.equal(kenkiMult(other), 1);
  assert.equal(critStackOf(other), null);
});

test('第51回 C2: オートの 仲間も 新しい 技を つかえる（こわれない）', () => {
  for (const job of Object.keys(NEW)) {
    const { b, me } = setup(job, { seed: 9 });
    me.auto = true;
    me.controller = null;
    let acts = 0;
    for (let i = 0; i < 2400 && acts < 8; i++) for (const e of b.tick(50)) if (e.t === 'act' && e.id === me.id) acts++;
    assert.ok(acts >= 4, `${job}: ${acts}`);
  }
});
