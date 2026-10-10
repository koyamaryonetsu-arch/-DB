// 2026年10月（第26回）: 合体技の 作り直し
//  ・40こ → 25こに しぼって 強く した（2人技は 2人が 別々に 動くより はっきり 得。3人技・4人技は もっと）
//  ・3人技・4人技（よやく・先に ゲージが たまった 仲間は まつ・家族には 聞く・オートの 仲間も 入る）
//  ・クスッと 笑える 合体技（早く働きなさい！・せーのでジャンプ・家族会議・全員集合 など）
//  ・けずった 合体技を 使った 記録（dualSeen）は こわれない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, JOB_MAX_LEVEL } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, DUAL_LEGACY, dualOptions, dualRelated, dualKnown, dualSize,
} from '../public/js/shared/data/dual.js';
import { newCharacter, gainExp, expForLevel, fullHeal, weaponOk, partyJobSet } from '../public/js/shared/stats.js';
import { Battle, DUAL_POWER, DUAL_ASK_MS } from '../public/js/shared/battle.js';
import { makeRng } from '../public/js/shared/rng.js';
import { DUAL_FX, cutMs } from '../public/js/client/render/dualfx.js';
import { checkText } from '../tools/kanji-check.mjs';

const master = (c, j) => { c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const chain = (c, j) => {
  for (const r of JOBS[j].req || []) { master(c, r); chain(c, r); }
  if (JOBS[j].reqSuper) master(c, 'god_hand');
};
function mk(job, name, lv = 40) {
  const c = newCharacter({ id: name, name, job: 'warrior' });
  gainExp(c, expForLevel(lv));
  chain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  return c;
}
// jobs[0] … 自分（s1）。humans: { 番号: コントローラー }（家族）・mine: 自分が 動かす 仲間の 番号
function party(jobs, { humans = {}, mine = [], seed = 1, enemies = ['rockman'] } = {}) {
  const allies = jobs.map((j, i) => {
    const char = mk(j, `${JOBS[j].name}${i}`);
    if (i === 0) return { char, controller: 's1' };
    if (humans[i]) return { char, controller: humans[i] };
    if (mine.includes(i)) return { char, kind: 'support', controller: 's1' };
    return { char, kind: 'support', auto: true };
  });
  const b = new Battle({ rng: makeRng(seed), allies, enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 99999;
    e.resist = {};
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return b;
}
const readyUp = (b, a) => {
  for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50);
  return a.ready;
};
// 仲間の ゲージを きめる（ならんでいた 行動は とりけす）
const gauge = (b, p, v) => {
  b.queue = b.queue.filter((q) => q.id !== p.id);
  p.queued = false;
  p.ready = false;
  p.atb = v;
};
const runUntil = (b, pred, ms = 60000) => {
  const evs = [];
  for (let t = 0; t < ms; t += 50) {
    evs.push(...b.tick(50));
    if (evs.some(pred)) break;
  }
  return evs;
};
const isDual = (e) => e.t === 'act' && e.dual;
const cmdOf = (o, target) => ({ type: 'dual', id: o.id, partner: o.partner, partners: o.partners, target });
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/ };
const PART_TYPES = new Set(['power', 'heal', 'revive', 'buff', 'debuff', 'cure', 'atbSet', 'mpHeal', 'bondUp', 'status', 'banish']);

test('第26回の 合体技: 数を しぼった（20〜28こ）・2人技・3人技・4人技・クスッと 笑える 技', () => {
  const ids = DUAL_ORDER;
  assert.ok(ids.length >= 20 && ids.length <= 28, `合体技 ${ids.length}こ`);
  const by = (n) => ids.filter((id) => dualSize(id) === n);
  assert.ok(by(2).length >= 12, `2人技 ${by(2).length}こ`);
  assert.ok(by(3).length >= 4, `3人技 ${by(3).length}こ`);
  assert.ok(by(4).length >= 2, `4人技 ${by(4).length}こ`);
  assert.equal(by(2).length + by(3).length + by(4).length, ids.length);
  const funny = ids.filter((id) => DUAL_TECHS[id].funny);
  assert.ok(funny.length >= 8, `笑える 技 ${funny.length}こ`);
  for (const n of [2, 3, 4]) assert.ok(funny.some((id) => dualSize(id) === n), `${n}人の 笑える 技`);
  for (const id of ['dt_hataraki', 'dt_jump', 'dt_kazoku_kaigi', 'dt_zenin']) assert.ok(DUAL_TECHS[id]?.funny, id);
  // 家族の 例: おかん×ニート「早く働きなさい！」・家族会議・全員集合・せーのでジャンプ
  assert.equal(DUAL_TECHS.dt_hataraki.name, '早く働きなさい！');
  assert.equal(DUAL_TECHS.dt_kazoku_kaigi.name, '家族会議');
  assert.equal(DUAL_TECHS.dt_zenin.name, '全員集合');
  assert.equal(DUAL_TECHS.dt_jump.name, 'せーのでジャンプ');
});

test('合体技の データ・文字・組の 名前・えんしゅつ', () => {
  const names = new Set();
  for (const id of DUAL_ORDER) {
    const t = DUAL_TECHS[id];
    const n = t.need.length;
    assert.ok(n >= 2 && n <= 4, id);
    assert.equal(t.mp.length, n, `${id}: MP`);
    for (const m of t.mp) assert.ok(m > 0 && m <= 20, `${id}: MP ${m}`);
    for (const list of t.need) {
      assert.ok(DUAL_GROUP_NAMES.has(list), `${id}: 組の 名前`);
      assert.ok(list.length > 0);
      for (const k of list) assert.ok(ABILITIES[k], `${id}: ${k}`);
    }
    assert.ok(t.kana && t.desc && t.anim && t.parts.length, id);
    assert.match(t.desc, SCOPE[t.target], `${id}（${t.target}）: ${t.desc}`);
    for (const p of t.parts) {
      assert.ok(PART_TYPES.has(p.type), `${id}: ${p.type}`);
      if (p.type === 'power') assert.ok(p.k > 0 && p.k <= 1.3, `${id}: k ${p.k}`);
      // 敵を 止める・ねむらせる 技は かならずは 効かない
      if (['atbSet', 'status', 'banish'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || t.target)) assert.ok(p.chance > 0 && p.chance < 1, `${t.name}: 効く わりあい`);
      // 補助は 強いが 上限あり（1.5倍まで）
      if (p.type === 'buff') assert.ok(p.mult <= 1.5, `${t.name}: ${p.mult}`);
    }
    for (const s of [t.name, t.desc, ...t.parts.flatMap((p) => [p.say, p.msg, p.failMsg]).filter(Boolean)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(t.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!names.has(t.name), `${t.name} が かぶる`);
    names.add(t.name);
    // えんしゅつ（render/dualfx.js）: 技ごとの 色・とどめ・ことば
    const fx = DUAL_FX[id];
    assert.ok(fx && fx.c.length === 3 && fx.finale, `${id}: えんしゅつ`);
    if (fx.word) assert.deepEqual(checkText(fx.word), [], `${id}: ${fx.word}`);
  }
  for (const [, nm] of DUAL_GROUP_NAMES) assert.deepEqual(checkText(nm), [], nm);
  // 人数が 多いほど 長く 豪華に
  assert.ok(cutMs(2) < cutMs(3) && cutMs(3) < cutMs(4));
  // けずった 技の 行き先は、今 ある 技
  for (const [old, now] of Object.entries(DUAL_LEGACY)) {
    assert.ok(!DUAL_TECHS[old], `${old} は けずった`);
    assert.ok(DUAL_TECHS[now], `${old} → ${now}`);
  }
});

test('どの 職業の 技も、どれかの 合体技に 使える', () => {
  const inDual = new Set();
  for (const t of Object.values(DUAL_TECHS)) for (const list of t.need) for (const k of list) if (ABILITIES[k]?.job) inDual.add(ABILITIES[k].job);
  for (const j of ALL_JOBS) assert.ok(inDual.has(j), `${JOBS[j].name} の 技が 合体技に ない`);
});

test('2人・3人・4人の 出し方: 人数ぶんの 仲間が、それぞれ ちがう 組の 技を 持っている', () => {
  const p = (id, abilities, extra = {}) => ({ id, name: id, alive: true, abilities, mp: 30, ready: true, statuses: [], ...extra });
  const A = p('剣', ['daichi'], { weaponCat: 'sword' });
  const B = p('拳', ['seiken'], { weaponCat: 'claw' });
  const C = p('魔', ['mera']);
  const D = p('僧', ['hoimi', 'bagi']);
  const all = dualOptions(A, [B, C, D], weaponOk);
  const find = (list, id, partners) => list.find((o) => o.id === id && (!partners || (o.partners.length === partners.length && partners.every((x) => o.partners.includes(x)))));
  const fin = find(all, 'dt_finale', ['拳', '魔', '僧']);
  assert.ok(fin, '剣＋こぶし＋呪文＋回復＝グランドフィナーレ（4人技）');
  assert.equal(fin.size, 4);
  assert.deepEqual(fin.mp, [14, 14, 14, 14]);
  assert.deepEqual(fin.skills, ['daichi', 'seiken', 'mera', 'hoimi']);
  assert.equal(fin.mine, 0);
  assert.ok(find(all, 'dt_delta', ['拳', '魔']), '剣＋こぶし＋呪文＝デルタストライク（3人技）');
  const E = p('癒', ['hoimi']);
  assert.ok(!find(dualOptions(A, [B, E], weaponOk), 'dt_delta'), '回復の 技だけでは デルタストライクは 出ない');
  assert.ok(!find(dualOptions(A, [B, C, E], weaponOk), 'dt_zenin'), '全員集合は 4人とも 攻撃の 技が いる');
  assert.ok(find(all, 'dt_cross_break', ['拳']) && find(all, 'dt_cross_mahouken', ['魔']), '2人技も');
  assert.ok(find(all, 'dt_zenin', ['拳', '魔', '僧']), '4人 いれば 全員集合');
  // だれから えらんでも おなじ（自分が どの 組でも よい）
  const fromD = find(dualOptions(D, [A, B, C], weaponOk), 'dt_finale', ['剣', '拳', '魔']);
  assert.ok(fromD && fromD.mine === 3 && fromD.mp.length === 4);
  // 人数が たりない
  assert.ok(!dualOptions(A, [B], weaponOk).some((o) => o.size >= 3), '2人では 3人技は 出ない');
  // MP・ねむり・剣
  assert.ok(!find(dualOptions(A, [B, C, { ...D, mp: 5 }], weaponOk), 'dt_finale'), 'MPが 足りない');
  assert.ok(!find(dualOptions(A, [B, { ...C, statuses: ['sleep'] }, D], weaponOk), 'dt_delta', ['拳', '魔']), 'ねむっている 仲間とは 出せない');
  assert.ok(!find(dualOptions({ ...A, weaponCat: 'staff' }, [B, C, D], weaponOk), 'dt_finale'), '剣が いる');
  // おかん＋大人の仕事＋子ども＋だれでも ＝ 家族会議
  const okan = p('母', ['ok_otama']), papa = p('父', ['sk_tsukin']), kid = p('子', ['es_randoseru']), neet = p('兄', ['ne_makura']);
  assert.ok(find(dualOptions(okan, [papa, kid, neet], weaponOk), 'dt_kazoku_kaigi'));
  assert.ok(find(dualOptions(okan, [neet, kid], weaponOk), 'dt_oosouji'), 'おかん＋ニート＋子ども＝大そうじ大作戦');
  assert.ok(find(dualOptions(okan, [neet], weaponOk), 'dt_hataraki'), 'おかん＋ニート＝早く働きなさい！');
});

test('パーティーに 関係する 合体技だけ メニューに 出す（3人技・4人技も）', () => {
  const hero = partyJobSet([{ job: 'warrior' }, { job: 'priest' }, { job: 'mage' }, { job: 'monk' }]);
  const shown = DUAL_ORDER.filter((id) => dualRelated(id, hero));
  for (const id of ['dt_finale', 'dt_delta', 'dt_zenin', 'dt_cross_break', 'dt_honoo_tatsumaki']) assert.ok(shown.includes(id), id);
  for (const id of ['dt_kazoku_kaigi', 'dt_hataraki', 'dt_uukanpi']) assert.ok(!shown.includes(id), id);
  const home = partyJobSet([{ job: 'okan' }, { job: 'shachiku' }, { job: 'schoolkid' }, { job: 'neet' }]);
  const shown2 = DUAL_ORDER.filter((id) => dualRelated(id, home));
  for (const id of ['dt_kazoku_kaigi', 'dt_oosouji', 'dt_hataraki', 'dt_bentou', 'dt_jugyo_sankan', 'dt_zenin']) assert.ok(shown2.includes(id), id);
  assert.ok(!shown2.includes('dt_finale'));
  assert.ok(shown2.length < DUAL_ORDER.length / 2, `出すのは 少し ${shown2.length}`);
});

test('3人技の よやく: 先に ゲージが たまった 仲間は まって、そろったら いっしょに 出る（別々には 動かない）', () => {
  const b = party(['warrior', 'monk', 'mage']);
  const [me, monk, mage] = b.allies;
  me.weaponCat = 'sword';
  readyUp(b, me);
  gauge(b, monk, 10);
  gauge(b, mage, 45);
  const o = b.dualOptionsFor(me, null, false, true).find((x) => x.id === 'dt_delta');
  assert.ok(o && !o.now, 'よやくなら えらべる');
  const mp = b.allies.map((x) => x.mp);
  const r = b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  assert.equal(r.waiting, true);
  assert.deepEqual(me.waitDual.partners.sort(), [monk.id, mage.id].sort());
  const evs = runUntil(b, isDual);
  assert.ok(evs.some((e) => e.t === 'dualWait' && e.lines[0].includes('力をためている')));
  const hold = evs.find((e) => e.t === 'dualHold');
  assert.equal(hold?.id, mage.id, '先に たまった 仲間は まつ');
  const act = evs.find(isDual);
  assert.equal(act.dual.id, 'dt_delta');
  assert.equal(act.dual.n, 3);
  assert.deepEqual([...act.dual.m].sort(), [me.id, monk.id, mage.id].sort());
  assert.ok(act.lines[0].includes('の合体技！'));
  assert.ok(!evs.some((e) => e.t === 'act' && (e.id === monk.id || e.id === mage.id)), '仲間は 別に 動かない');
  assert.ok(act.results.some((x) => x.dmg > 0));
  assert.equal(monk.atb, 0);
  assert.equal(mage.atb, 0);
  assert.equal(mage.dualHold, false);
  b.allies.forEach((x, i) => assert.equal(x.mp, mp[i] - 8, `${x.name}の MP`));
});

test('3人技の よやく: やめる・仲間が 倒れる → まっていた 仲間は 自分の 番に もどる', () => {
  for (const how of ['cancel', 'down']) {
    const b = party(['warrior', 'monk', 'mage'], { seed: 5 });
    const [me, monk, mage] = b.allies;
    me.weaponCat = 'sword';
    readyUp(b, me);
    gauge(b, monk, 0);
    gauge(b, mage, 80);
    const o = b.dualOptionsFor(me, null, false, true).find((x) => x.id === 'dt_delta');
    b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
    runUntil(b, (e) => e.t === 'dualHold');
    assert.equal(mage.dualHold, true, '魔法使いは まっている');
    assert.equal(mage.ready, false);
    let evs;
    if (how === 'cancel') {
      assert.equal(b.command(me.id, { type: 'dualCancel' }, 's1').ok, true);
      assert.equal(me.ready, true, 'また コマンドを えらべる');
      evs = runUntil(b, (e) => e.t === 'act' && e.id === mage.id, 5000);
    } else {
      monk.alive = false;
      monk.hp = 0;
      evs = runUntil(b, (e) => e.t === 'act' && e.id === mage.id, 5000);
      const end = evs.find((e) => e.t === 'dualWaitEnd');
      assert.ok(end.lines[0].includes('参加できなくなった'), end.lines[0]);
      assert.equal(me.ready, true);
    }
    assert.equal(mage.dualHold, false, `${how}: まつのを やめた`);
    assert.ok(evs.some((e) => e.t === 'act' && e.id === mage.id), `${how}: 魔法使いは 自分で 動く`);
    assert.equal(me.waitDual, null);
  }
});

test('4人技: 自分が 動かす 仲間（めいれいさせろ）も、そろって いれば すぐ・まだ なら まつ', () => {
  // みんな 番が 来ている → すぐ
  let b = party(['warrior', 'monk', 'mage', 'priest'], { mine: [1, 2, 3] });
  let [me, ...ps] = b.allies;
  me.weaponCat = 'sword';
  for (const a of b.allies) readyUp(b, a);
  assert.ok(b.allies.every((a) => a.ready));
  let o = b.dualOptionsFor(me).find((x) => x.id === 'dt_finale');
  assert.ok(o?.now);
  let r = b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  assert.deepEqual(r, { ok: true });
  assert.ok(ps.every((p) => p.queued && !p.ready && p.dualWith === me.id), '3人の 番を おさえた');
  let act = runUntil(b, isDual).find(isDual);
  assert.equal(act.dual.n, 4);
  assert.ok(act.results.some((x) => x.dmg > 0) && act.results.some((x) => x.heal !== undefined), 'ダメージと 回復');
  // まだの 仲間が いる → ゲージが たまった 仲間は（自分が 動かす 仲間でも）コマンドを 出さずに まつ
  b = party(['warrior', 'monk', 'mage', 'priest'], { mine: [1, 2, 3], seed: 9 });
  [me, ...ps] = b.allies;
  me.weaponCat = 'sword';
  readyUp(b, me);
  ps.forEach((p, i) => gauge(b, p, [70, 40, 10][i]));
  o = b.dualOptionsFor(me, null, false, true).find((x) => x.id === 'dt_finale');
  r = b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  assert.equal(r.waiting, true);
  const evs = runUntil(b, isDual);
  assert.ok(!evs.some((e) => e.t === 'ready' && ps.some((p) => p.id === e.id)), '仲間に コマンドは 出ない');
  assert.equal(evs.filter((e) => e.t === 'dualHold').length, 2, '先の 2人が まった');
  assert.ok(evs.some(isDual));
});

test('家族が 入る 3人技: 家族に 聞く（AIの 仲間は 返事を まつ）・参加・ことわる・時間切れ', () => {
  const setup = (seed) => {
    const b = party(['warrior', 'monk', 'mage'], { humans: { 1: 's2' }, seed });
    const [me, monk, mage] = b.allies;
    me.weaponCat = 'sword';
    readyUp(b, me);
    readyUp(b, monk);
    gauge(b, mage, 100);
    const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_delta');
    const r = b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
    assert.equal(r.pending, true);
    const evs = b.tick(10);
    return { b, me, monk, mage, inv: evs.find((e) => e.t === 'dualInvite') };
  };
  // 参加する
  let { b, me, monk, mage, inv } = setup(3);
  assert.equal(inv.to, monk.id);
  assert.equal(inv.fromName, me.name);
  assert.equal(inv.partners.length, 2);
  assert.equal(mage.dualHold, true, 'AIの 仲間は まつ');
  assert.equal(b.command(monk.id, { type: 'dualAnswer', invite: inv.invite, ok: true }, 's1').ok, false, 'ほかの 人は こたえられない');
  assert.equal(b.command(monk.id, { type: 'dualAnswer', invite: inv.invite, ok: true }, 's2').ok, true);
  let evs = runUntil(b, isDual);
  assert.equal(evs.find(isDual).dual.id, 'dt_delta');
  assert.ok(!evs.some((e) => e.t === 'act' && (e.id === monk.id || e.id === mage.id)));
  // ことわる → AIの 仲間は 自分の 番に、さそった 人は また えらべる
  ({ b, me, monk, mage, inv } = setup(4));
  b.command(monk.id, { type: 'dualAnswer', invite: inv.invite, ok: false }, 's2');
  assert.equal(mage.dualHold, false);
  assert.equal(me.ready, true);
  evs = runUntil(b, (e) => e.t === 'act' && e.id === mage.id, 5000);
  assert.ok(evs.some((e) => e.t === 'act' && e.id === mage.id), '魔法使いは 自分で 動く');
  assert.equal(b.command(me.id, { type: 'attack', target: b.enemies[0].id }, 's1').ok, true);
  // 時間切れ
  ({ b, me, monk, mage, inv } = setup(5));
  evs = [];
  for (let t = 0; t < DUAL_ASK_MS + 500; t += 100) evs.push(...b.tick(100));
  const late = evs.find((e) => e.t === 'dualAnswer');
  assert.equal(late.reason, '時間切れ');
  assert.equal(late.to, monk.id);
  assert.equal(b.invites.size, 0);
  assert.ok(!evs.some(isDual));
});

test('家族が 2人: 2人とも 参加すると 出る（1人でも ことわれば 出ない）', () => {
  const setup = (seed) => {
    const b = party(['warrior', 'monk', 'mage'], { humans: { 1: 's2', 2: 's3' }, seed });
    const [me, monk, mage] = b.allies;
    me.weaponCat = 'sword';
    for (const a of b.allies) readyUp(b, a);
    const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_delta');
    b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
    const invs = b.tick(10).filter((e) => e.t === 'dualInvite');
    return { b, me, monk, mage, invs };
  };
  let { b, monk, mage, invs } = setup(6);
  assert.deepEqual(invs.map((e) => e.to).sort(), [monk.id, mage.id].sort(), '2人に 聞く');
  assert.equal(new Set(invs.map((e) => e.invite)).size, 1);
  b.command(monk.id, { type: 'dualAnswer', invite: invs[0].invite, ok: true }, 's2');
  let evs = b.tick(10);
  assert.ok(!evs.some(isDual), 'まだ 出ない');
  assert.equal(monk.dualHold, true, '参加した 人は まつ');
  b.command(mage.id, { type: 'dualAnswer', invite: invs[0].invite, ok: true }, 's3');
  evs = runUntil(b, isDual);
  assert.equal(evs.find(isDual).dual.n, 3);
  // 1人が ことわる
  ({ b, monk, mage, invs } = setup(7));
  b.command(monk.id, { type: 'dualAnswer', invite: invs[0].invite, ok: true }, 's2');
  b.command(mage.id, { type: 'dualAnswer', invite: invs[0].invite, ok: false }, 's3');
  evs = b.tick(10);
  assert.equal(monk.dualHold, false);
  assert.equal(monk.ready, true, '参加した 人も 自分の 番に もどる');
  assert.equal(b.invites.size, 0);
});

test('さそわれた 家族が オートに すると 参加する（オートの 仲間は すぐ 参加）', () => {
  const b = party(['warrior', 'monk'], { humans: { 1: 's2' } });
  const [me, monk] = b.allies;
  me.weaponCat = 'sword';
  readyUp(b, me);
  readyUp(b, monk);
  const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_cross_break');
  assert.equal(b.command(me.id, cmdOf(o, b.enemies[0].id), 's1').pending, true);
  b.setAuto(monk.id, true);
  const evs = runUntil(b, isDual, 5000);
  assert.equal(evs.find(isDual)?.dual.id, 'dt_cross_break');
});

// 敵 1体に、それぞれが ふつうに 出せる いちばん 強い 技の ダメージ（見つもり）
function soloBest(b, m, t) {
  let best = b.calcPhys(m, t, { mult: 1 }, 1, 'phys', true).dmg;
  for (const id of m.abilities) {
    const a = ABILITIES[id];
    if (!a || !weaponOk(a, m.weaponCat)) continue;
    for (const p of a.effect?.type === 'multi' ? a.effect.parts : [a.effect]) {
      if (p?.type === 'phys') best = Math.max(best, b.calcPhys(m, t, { ...p, element: undefined }, 1, 'phys', true).dmg * (p.random ? 1 : p.hits || 1));
      if (p?.type === 'magic' && p.base) best = Math.max(best, b.calcMagic(m, t, { ...p, element: undefined }, 1, true).dmg);
    }
  }
  return best;
}

test('強さ: 別々に 動くより はっきり 得（2人技 1.6倍・3人技 2倍・4人技 2.6倍 いじょう）', () => {
  assert.ok(DUAL_POWER[2] >= 1.6 && DUAL_POWER[3] >= 2.2 && DUAL_POWER[4] >= 3);
  const cases = [['dt_cross_break', ['warrior', 'monk'], 1.6], ['dt_cross_mahouken', ['warrior', 'mage'], 1.5], ['dt_delta', ['warrior', 'monk', 'mage'], 2.0], ['dt_finale', ['warrior', 'monk', 'mage', 'priest'], 2.6],
    ['dt_gomu_kame', ['saiyan', 'rubber'], 1.6], ['dt_taishoumetsu', ['mage', 'archmage'], 1.6]];
  for (const [id, jobs, min] of cases) {
    let dual = 0, solo = 0;
    for (const seed of [1, 2, 3]) {
      const b = party(jobs, { mine: jobs.map((_, i) => i).slice(1), seed });
      const [me] = b.allies;
      me.weaponCat = 'sword';
      for (const a of b.allies) readyUp(b, a);
      const t = b.enemies[0];
      const o = b.dualOptionsFor(me).find((x) => x.id === id);
      assert.ok(o, `${id}: ${jobs.join('・')} で 出せる`);
      solo += o.who.reduce((s, wid) => s + soloBest(b, b.get(wid), t), 0);
      b.command(me.id, cmdOf(o, t.id), 's1');
      const act = runUntil(b, isDual).find(isDual);
      dual += act.results.filter((r) => r.id === t.id && r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
    }
    assert.ok(dual >= solo * min, `${DUAL_TECHS[id].name}: ${dual} は 別々の ${solo} の ${(dual / solo).toFixed(2)}倍（${min}倍 いじょう）`);
  }
  // 全体を ねらう 技も、敵が 3体なら 合計で ずっと 得
  const b = party(['okan', 'neet'], { mine: [1], enemies: ['rockman', 'rockman', 'rockman'] });
  const [me] = b.allies;
  for (const a of b.allies) readyUp(b, a);
  const o = b.dualOptionsFor(me).find((x) => x.id === 'dt_hataraki');
  const solo = o.who.reduce((s, wid) => s + soloBest(b, b.get(wid), b.enemies[0]), 0);
  b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
  const act = runUntil(b, isDual).find(isDual);
  const total = act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
  assert.ok(total >= solo * 3, `早く働きなさい！: 敵3体に ${total}（別々 ${solo}）`);
});

// その 組の 技を 1つ 覚える 職業（武器の いらない 技）
function jobFor(list) {
  for (const k of list) {
    const s = ABILITIES[k];
    if (!s?.job || s.weapon || s.hirameki || !JOBS[s.job]?.learn.some(([, x]) => x === k)) continue;
    return s.job;
  }
  return null;
}

test('どの 合体技も ほんとうの たたかいで 出せる（人数ぶんの MPと 番を 使う・ことばの 文字）', () => {
  let n = 0;
  for (const id of DUAL_ORDER) {
    const t = DUAL_TECHS[id];
    const jobs = t.need.map(jobFor);
    assert.ok(jobs.every(Boolean), `${id}: ${jobs}`);
    const b = party(jobs, { seed: ++n, enemies: ['rockman', 'skeleton'] });
    const [me, ...ps] = b.allies;
    for (const a of b.allies) a.weaponCat = 'sword';
    readyUp(b, me);
    for (const p of ps) gauge(b, p, 100);
    // HPは へらしておく（回復の 技の ため）
    for (const a of b.allies) a.hp = Math.round(a.maxHp / 3);
    const o = b.dualOptionsFor(me).find((x) => x.id === id && x.size === t.need.length);
    assert.ok(o, `${t.name}: ${jobs.map((j) => JOBS[j].name).join('×')} で 出せる`);
    const mp = new Map([me, ...ps].map((x) => [x.id, x.mp]));
    const r = b.command(me.id, cmdOf(o, b.enemies[0].id), 's1');
    assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
    const act = runUntil(b, isDual, 8000).find(isDual);
    assert.equal(act?.dual?.id, id, `${id} が 出た`);
    assert.equal(act.name, t.name);
    assert.equal(act.dual.m.length, t.need.length);
    assert.equal(act.fx.type, 'dual');
    if (!t.parts.some((p) => p.type === 'mpHeal')) {
      const used = [me.id, ...o.partners].map((x, i) => mp.get(x) - b.get(x).mp - o.mp[i]);
      assert.deepEqual(used, used.map(() => 0), `${id}: MP`);
    }
    for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    if (t.parts.some((p) => p.type === 'power')) assert.ok(act.results?.some((x) => x.dmg > 0), `${id}: ダメージ ${act.lines.join(' / ')}`);
    if (t.parts.some((p) => p.type === 'heal')) assert.ok(act.results?.some((x) => x.heal > 0), `${id}: 回復`);
    for (const p of ps) assert.equal(p.atb, 0, `${id}: ${p.name}の 番も 使った`);
  }
});

test('古い データ: けずった 合体技の 記録は のこり、まとめた 先の 技は 効果が わかる', async () => {
  const old = { dualSeen: { dt_blizzard: 1, dt_twin_fist: 1, dt_jikkyou: 1 } };
  assert.equal(dualKnown(old, 'dt_cross_break'), true, 'ツイン百裂拳 → クロスブレイク');
  assert.equal(dualKnown(old, 'dt_dai_collab'), true, 'ゲーム実きょう → 大コラボ配信');
  assert.equal(dualKnown(old, 'dt_honoo_tatsumaki'), false, 'ブリザードは まとめ先 なし');
  assert.ok(!DUAL_ORDER.includes('dt_blizzard'));
  assert.equal(dualRelated('dt_blizzard', partyJobSet([{ job: 'mage' }, { job: 'priest' }])), false, 'メニューには 出ない');
  // けずった 技の コマンド（前の 版の 画面から）は ことわる だけ
  const b = party(['mage', 'priest']);
  const [me, m] = b.allies;
  readyUp(b, me);
  gauge(b, m, 100);
  assert.equal(b.command(me.id, { type: 'dual', id: 'dt_blizzard', partner: m.id, target: b.enemies[0].id }, 's1').ok, false);
  assert.equal(b.command(me.id, { type: 'dual', id: 'dt_honoo_tatsumaki', partner: m.id, target: b.enemies[0].id }, 's1').ok, true, 'ふつうに つづけられる');
  // 世界: 使った 記録に 足される（前の 記録は 消えない）
  const { GameWorld } = await import('../public/js/shared/world/world.js');
  const { recruitNpc, afterRosterChange, partyOf } = await import('../public/js/shared/world/party.js');
  const { startFieldBattle } = await import('../public/js/shared/world/battles.js');
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
  c.dualSeen = { dt_blizzard: 1, dt_twin_fist: 1 };
  recruitNpc(world, bot.s, 'npc_mina', { force: true });
  afterRosterChange(world, bot.s);
  const mina = partyOf(world, bot.s).supports.find((x) => x.key === 'npc_mina').char;
  gainExp(mina, expForLevel(20) - mina.exp);
  mina.jobs.priest = { lv: 6, b: 0 };
  fullHeal(mina);
  bot.s.map = 'overworld';
  const ctx = startFieldBattle(world, bot.s, { id: 'dz', sp: 'kobushi', group: ['kobushi'], zone: 'outskirts', table: 'outskirts', busy: false });
  const wb = ctx.battle;
  for (const e of wb.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 3000; }
  const a = wb.allies.find((x) => x.charId === c.id);
  const mm = wb.allies.find((x) => x !== a);
  for (let i = 0; i < 800 && !a.ready; i++) await tickN(world, 1);
  bot.send({ t: 'battle', actor: a.id, cmd: { type: 'dual', id: 'dt_honoo_tatsumaki', partner: mm.id, partners: [mm.id], target: wb.enemies[0].id } });
  for (let i = 0; i < 3000 && !dualKnown(c, 'dt_honoo_tatsumaki'); i++) await tickN(world, 1);
  assert.equal(dualKnown(c, 'dt_honoo_tatsumaki'), true, '使った 技は わかる');
  assert.equal(c.dualSeen.dt_blizzard, 1, 'けずった 技の 記録は のこる');
  assert.equal(c.dualSeen.dt_twin_fist, 1);
});
