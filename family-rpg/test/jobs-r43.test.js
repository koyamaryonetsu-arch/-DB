// 2026年10月（第43回）: 配管工 → ひげおやじ → マリオ（女の子は ももの姫 → おてんば姫 → ピーチ）（docs/plan-r43-jobs.md）
//  ・職業の 木（基本職 → 上級職 → 超級職）・名前（データは 女の子・男の子は masc）・強さ・技・ひらめき技・合体技に 入れる・
//    職業の試練・転職の ひとこと・乗り物（ヨッシー）・はじめの 装備・キャラ作りの 名前・文字
//  ・絵（hero-r43j.js）と えんしゅつ（battlefx-r43j.js）・乗り物の 絵（vehicle-r43j.js）
//  ・ならびの 場所（何番め）は 見ない（ほかの 回の 職業と いっしょに ふえても こわれない ように）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R43J_ABILITIES } from '../public/js/shared/data/abilities-r43j.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R43J_ABILITIES, HIRAMEKI_R43J } from '../public/js/shared/data/hirameki-r43j.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, TRIAL_WORDS_MASC, trialWords, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { jobLabel, jobShort, jobHint, jobFor } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R43J_JOBS, R43J_OUTFIT, R43J_BODY, R43J_OLD_LOOK, R43J_MASC, R43J_HAIR, R43J_HAT, AURA43J } from '../public/js/client/render/hero-r43j.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VEHICLE_ART, paintVehicle, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R43J_ANIMS, R43J_SIGS, PARTY_ANIMS_R43J, R43J_HIT, R43J_SFX, R43J_FINE, playR43jFx } from '../public/js/client/render/battlefx-r43j.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { R41A_FINE } from '../public/js/client/render/battlefx-r41a.js';
import { R41B_FINE } from '../public/js/client/render/battlefx-r41b.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['plumber', 'mustache', 'mario'];
// [女の子の 名前（データ）, 男の子の 名前（masc）, ランク, じょうけん]
const TREE = {
  plumber: ['ももの姫', '配管工', 0, undefined],
  mustache: ['おてんば姫', 'ひげおやじ', 1, ['plumber']],
  mario: ['ピーチ', 'マリオ', 2, ['mustache']],
};
const SIG_NAMES = { plumber: '三だんジャンプ', mustache: 'ファイアフラワー', mario: 'スーパースターラッシュ' };
const BOY = { body: 0 }, GIRL = { body: 1 };
const boy = (job = 'plumber') => ({ job, look: BOY }), girl = (job = 'plumber') => ({ job, look: GIRL });
// 小学校で 習わない 字（かなに した）
const BAD = /[桃髭冠恐蹴跳踏甲羅虹]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体|敵にランダム/, allies: /仲間全員/, self: /自分/, ally: /仲間1人/, deadAlly: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => { for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); } };
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 40 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const m = newCharacter({ id: 'm0', name: 'ミナ', job: 'priest' });
  gainExp(m, expForLevel(lv));
  fullHeal(m);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: m, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};

// ───────────── 職業の 木 ─────────────
test('第43回の 職業: ももの姫（基本職）→ おてんば姫（上級職）→ ピーチ（超級職）。うわさ・文字', () => {
  for (const id of NEW) {
    const j = JOBS[id], [name, , tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, undefined);
    assert.equal(j.family, 'phys');
    assert.ok([JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER][tier].includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    for (const s of [j.name, j.desc, j.short, ...(JOB_HINTS[id] ? [JOB_HINTS[id]] : [])]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!BAD.test(j.name + j.desc + (JOB_HINTS[id] || '')), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
  }
  // 超級職だけ 神殿の うわさ（男の子は masc.hint）
  assert.ok(JOB_HINTS.mario && JOBS.mario.masc.hint);
  assert.ok(JOB_HINTS.mario.includes('おてんば姫') && JOBS.mario.masc.hint.includes('ひげおやじ'));
  assert.equal(jobReqText('mustache'), 'ももの姫Lv10');
  assert.equal(jobReqText('mario'), 'おてんば姫Lv10');
  assert.equal(jobReqText('mario', (r) => jobLabel(r, boy())), 'ひげおやじLv10');
  // 今の 系統（小学生 → 中学生 → 高校生 など）と おなじ: 上級職は 基本職を きわめる・超級職は 上級職を きわめる
  assert.deepEqual(JOBS.middleschooler.req, ['schoolkid']);
  assert.deepEqual(JOBS.highschooler.req, ['middleschooler']);
});

test('第43回の 職業: なれる じゅんばん（はじめから えらべる → きわめて おてんば姫 → きわめて うわさ → ピーチ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'plumber', look: GIRL });
  assert.equal(c.job, 'plumber', 'はじめに えらべる 基本職');
  assert.deepEqual(c.equip, { ...STARTER_EQUIP.plumber });
  assert.ok(learnedAbilities(c).includes('pl_jump'));
  assert.equal(jobUnlocked(c, 'mustache'), false);
  master(c, 'plumber');
  assert.equal(jobUnlocked(c, 'mustache'), true);
  assert.equal(changeJob(c, 'mustache').ok, true);
  assert.ok(learnedAbilities(c).includes('mu_fire'));
  assert.equal(jobKnown(c, 'mario'), false, 'ピーチは はじめ ひみつ');
  master(c, 'mustache');
  assert.equal(jobKnown(c, 'mario'), true, 'おてんば姫を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'mario'), true);
  assert.equal(changeJob(c, 'mario').ok, true);
  assert.ok(learnedAbilities(c).includes('mr_hip'));
  // キャラ作りで 体に あわせた 名前（title.js）
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  assert.ok(title.includes("jobLabel(j, { look })") && title.includes('jobFor(j, { look }).desc') && title.includes("plumber: 'ジャンプが得意'"));
});

test('第43回の 職業: 強さは 今の 同じ ランクの はんい・力と 素早さ・上の ランクほど 強い', () => {
  const others = (list) => list.filter((j) => !NEW.includes(j)).map(sum);
  NEW.forEach((j, t) => {
    const list = others([JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER][t]);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) >= Math.min(...list) && sum(j) <= Math.max(...list), `${j} ${sum(j).toFixed(2)}`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    // 力と 素早さが いちばん 高い 2つ
    const top2 = Object.entries(JOBS[j].mods).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k).sort();
    assert.deepEqual(top2, ['agi', 'str'], j);
    assert.ok(JOBS[j].weapons.includes('none'));
  });
  assert.ok(sum('plumber') < sum('mustache') && sum('mustache') < sum('mario'));
});

// ───────────── 名前（男の子は masc） ─────────────
test('男の子は 配管工・ひげおやじ・マリオ（名前・みじかい 名前・説明・うわさ）、女の子は ももの姫・おてんば姫・ピーチ。強さ・技は おなじ', () => {
  for (const id of NEW) {
    const [f, m] = TREE[id];
    assert.equal(jobLabel(id, boy(id)), m);
    assert.equal(jobLabel(id, girl(id)), f);
    assert.notEqual(jobShort(id, boy(id)), jobShort(id, girl(id)));
    const J = jobFor(id, boy(id));
    for (const k of ['mods', 'learn', 'req', 'tier', 'weapons', 'perLv']) assert.deepEqual(J[k], JOBS[id][k], `${id}.${k}`);
    for (const s of [JOBS[id].masc.name, JOBS[id].masc.short, JOBS[id].masc.desc]) textOk(s, 'masc');
    assert.ok(!BAD.test(JOBS[id].masc.desc), id);
    // 上級職の 説明は、男の子は 配管工・女の子は ももの姫から つながる
    if (TREE[id][2] === 1) {
      assert.ok(J.desc.includes(TREE[TREE[id][3][0]][1]), `${id}: ${J.desc}`);
      assert.ok(JOBS[id].desc.includes(TREE[TREE[id][3][0]][0]), `${id}: ${JOBS[id].desc}`);
    }
  }
  assert.equal(jobHint('mario', boy('mario')), JOBS.mario.masc.hint);
  assert.equal(jobHint('mario', girl('mario')), JOB_HINTS.mario);
  for (const id of [...Object.keys(R43J_ABILITIES), ...Object.keys(HIRA_R43J_ABILITIES)]) {
    assert.equal(ABILITIES[id].masc, undefined, `${id}: 技の 名前は どちらも おなじ`);
    assert.equal(abilityFor(id, boy()), ABILITIES[id]);
  }
});

// ───────────── 技 ─────────────
test('第43回の 技: 6こ・Lv10 が いちばん MP・看板の 技・プランの 技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b));
    assert.equal(lvs[0], 1);
    assert.equal(lvs.at(-1), 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.ok(ABILITIES[sig].anim === sig || /^ax_/.test(ABILITIES[sig].anim));
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (job.tier === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}`);
    const allCap = [1.15, 1.25, 1.4][job.tier], oneCap = [1.3, 1.4, 1.6][job.tier];
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.equal(a.kind, 'skill');
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && p.mult && a.target === 'allies') assert.ok(p.mult <= allCap + 1e-9, a.name);
        if (p.type === 'buff' && p.mult && a.target === 'self') assert.ok(p.mult <= oneCap + 1e-9, a.name);
        if (['atbSet', 'status', 'debuff'].includes(p.type)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R43J_ABILITIES).sort(), 'abilities-r43j.js の 技は ぜんぶ どれかの 職業で 覚える');
  // プランの 技（家族の ねがい）
  const learnName = (j) => JOBS[j].learn.map(([, id]) => ABILITIES[id].name);
  for (const n of ['ジャンプふみつけ', 'スパナで配管なおし', '土管ワープ']) assert.ok(learnName('plumber').includes(n), n);
  for (const n of ['ファイアボール', 'スーパーキノコ', 'こうらなげ']) assert.ok(learnName('mustache').includes(n), n);
  for (const n of ['スター', 'ヒップドロップ', 'スーパースターラッシュ']) assert.ok(learnName('mario').includes(n), n);
  const A = (id) => ABILITIES[id];
  assert.equal(A('pl_spanner').effect.type, 'heal');
  assert.equal(A('pl_spanner').target, 'ally');
  assert.equal(A('pl_dokan').effect.type, 'escape');
  assert.equal(A('mu_fire').effect.element, 'fire');
  assert.ok(partsOf(A('mu_kinoko').effect).some((p) => p.type === 'buff' && p.stat === 'atk') && partsOf(A('mu_kinoko').effect).some((p) => p.type === 'heal'));
  assert.equal(A('mu_koura').target, 'enemies');
  assert.ok(partsOf(A('mr_star').effect).some((p) => p.type === 'buff' && p.stat === 'def' && p.mult >= 1.5), 'スター: とても 強い 守り');
  assert.ok(partsOf(A('mr_hip').effect).some((p) => p.type === 'atbSet'), 'ヒップドロップ: ときどき 気ぜつ');
  assert.ok(A('mario_sig').effect.hits >= 3 && !A('mario_sig').effect.random, 'スーパースターラッシュ: 敵全体に 連続ジャンプ');
});

test('第43回の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・土管ワープで にげる・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      if (a.target === 'deadAlly') { m.alive = false; m.hp = 0; }
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: ['ally', 'deadAlly'].includes(a.target) ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (id === 'pl_dokan') assert.equal(b.pendingEnd?.outcome, 'flee', '土管ワープで にげた');
      if (id === 'mu_1up') assert.ok(m.alive, '1UPキノコで 生き返る');
    }
    const s = setup(j, { seed: 7 });
    s.me.abilities = learnedAbilities(s.c);
    let used = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') used++;
    }
    assert.ok(used > 0, `${j}: オートでも 技を 使う`);
  }
  // スーパースターラッシュ: 敵全体に 3回ずつ
  const { b, me } = setup('mario', { seed: 3 });
  readyUp(b, me);
  b.command(me.id, { type: 'ability', id: 'mario_sig', target: b.enemies[0].id }, 's1');
  const act = runUntilAct(b, me.id);
  assert.ok(act.results.filter((x) => x.dmg > 0).length >= 6, '敵全体に 何回も');
  assert.equal(new Set(act.results.filter((x) => x.dmg > 0).map((x) => x.id)).size, 3, '3体 ぜんぶ');
});

// ───────────── ひらめき技 ─────────────
test('第43回の ひらめき技: ひげおやじ 1つ・マリオ 1つ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R43J_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R43J).sort(), [...ids].sort());
  assert.deepEqual(ids.map((id) => HIRA_R43J_ABILITIES[id].job).sort(), ['mario', 'mustache']);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id)).map(([, a]) => a.anim));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
    assert.ok(oldAnims.has(a.anim) || /^ax_/.test(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = JOBS[a.job].req[0];
    assert.equal(hiraAllowed(c, id), false, 'もとの 職業では ひらめかない');
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from)[0];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c: ch, me } = setup(a.job, { seed: seed + n * 100 });
      ch.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...ch.skillUse };
      readyUp(b, me);
      b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    n++;
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技・職業の試練・転職の ひとこと・乗り物 ─────────────
test('第43回の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（ピーチ）・転職の ひとこと（男女）・乗り物（ヨッシー）', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('fist'), `${j}: ジャンプと ふみつけ`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 転職の ひとこと（女の子・男の子）
    for (const s of [JOB_SAY[j], JOB_SAY_MASC[j]]) {
      textOk(s, j);
      assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    }
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(JOB_SAY[j]));
    assert.ok(jobDoneText('ユウ', JOBS[j].masc.name, [], j, true).endsWith(JOB_SAY_MASC[j]));
  }
  assert.ok(JOBS.mustache.tags.includes('fire') && JOBS.mario.tags.includes('ride'));
  // 職業の試練は 超級職の ピーチ（マリオ）だけ
  assert.equal(trialJob('plumber'), false);
  assert.equal(trialJob('mustache'), false);
  assert.ok(trialJob('mario'));
  const adj = PHANTOM_ADJ.mario;
  assert.ok(Array.isArray(adj) && adj.length === 2 && adj.every((v) => v >= 0.3 && v <= 3), `${adj}`);
  assert.ok(phantomSkills('mario').length >= 4);
  textOk(TRIAL_WORDS.mario, 'trial');
  textOk(TRIAL_WORDS_MASC.mario, 'trial');
  assert.equal(trialWords('mario', boy('mario')), TRIAL_WORDS_MASC.mario);
  assert.equal(trialWords('mario', girl('mario')), TRIAL_WORDS.mario);
  assert.equal(masterName('mario', boy('mario')), 'マリオの師しょう');
  assert.equal(masterName('mario', girl('mario')), 'ピーチの師しょう');
  // 乗り物: ヨッシー（超級職で。絵も ある）
  const v = VEHICLES.yoshi;
  assert.ok(v && v.name === 'ヨッシー' && v.price > 0);
  assert.deepEqual(v.jobs, ['mario']);
  textOk(v.name, 'vehicle');
  textOk(v.desc, 'vehicle');
  assert.ok(!BAD.test(v.desc));
  assert.ok(VEHICLE_ART.yoshi, 'ヨッシーの 絵');
  for (const view of ['side', 'front', 'back']) for (let f = 0; f < 3; f++) {
    for (const layer of ['back', 'front']) assert.ok(paintVehicle('yoshi', view, f, layer).px.some(Boolean), `${view} ${f} ${layer}`);
    assert.ok(riderSpot('yoshi', view, f));
  }
});

// ───────────── 絵 ─────────────
const DIRS = ['down', 'left', 'up', 'right'];
const key = (img) => Buffer.from(img.rgba).toString('base64');
function inspect(img) {
  let n = 0, edge = false;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (!img.rgba[(y * img.w + x) * 4 + 3]) continue;
    n++;
    if (y === 0 || x === 0 || x === img.w - 1) edge = true;
  }
  return { n, edge };
}

test('第43回の 絵: 3つの 職業（男女・4方向・はみ出さない・ランクで ちがう）・男の子の つなぎと ぼうしと ひげ・女の子の ドレスと 王冠・古い え', () => {
  assert.deepEqual(R43J_JOBS, NEW);
  for (const j of NEW) assert.ok(R43J_OUTFIT[j] && R43J_BODY[j] && R43J_OLD_LOOK[j] && R43J_MASC[j] && R43J_HAT[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
      }
    }
    for (const dir of DIRS) assert.notEqual(key(paintHero(BOY, job, undefined, dir, 0, 4)), key(paintHero(GIRL, job, undefined, dir, 0, 4)), `${job} ${dir}`);
  }
  // ランクごとに ちがう え（男女とも）
  for (const L of [BOY, GIRL]) for (const [a, b] of [['plumber', 'mustache'], ['mustache', 'mario']]) assert.notEqual(key(paintHero(L, a, undefined, 'down', 0, 4)), key(paintHero(L, b, undefined, 'down', 0, 4)), `${a} ${b}`);
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 男の子: 赤い シャツ・青い つなぎ・赤い ぼうし（しるし）。ひげは ひげおやじから・白い 手ぶくろ・マリオは マント
  for (const j of NEW) {
    assert.equal(masc33(j, false), R43J_MASC[j]);
    assert.equal(masc33(j, true), null);
    const M = outfitOf(Lk, j, 'cloth', false);
    assert.ok(M.r43j?.overall, `${j}: つなぎ`);
    assert.equal(M.kind, 'shirt');
    const H = headOf(null, j, 'cloth', M);
    assert.equal(H.kind, 'cap43j');
    assert.equal(H.c, '#d8202c');
    assert.equal(!!jobBody(j, false).stache43j, j !== 'plumber', `${j}: ひげ`);
    assert.equal(!!M.glove, j !== 'plumber', `${j}: 白い 手ぶくろ`);
  }
  assert.ok(outfitOf(Lk, 'mario', 'cloth', false).cape, 'マリオの マント');
  assert.equal(jobBody('mario', false).aura, 'star43j');
  assert.equal(jobBody('plumber', false).prop, 'wrench43j');
  assert.deepEqual([0, 1, 2], NEW.map((j) => R43J_MASC[j].hat.mark), 'しるしの かざりが ふえる');
  // 女の子: ピンクの ドレス・金の 長い かみ・ティアラ → 王冠。ピーチは 足もとまで
  for (const j of NEW) {
    const F = outfitOf(Lk, j, 'cloth', true);
    assert.equal(F.kind, 'dress');
    assert.equal(F.body.hair, 'long');
    assert.equal(F.body.hcol, 'r43jblond');
    assert.ok(R43J_HAIR.r43jblond);
    assert.ok(!F.r43j?.overall);
  }
  assert.ok(outfitOf(Lk, 'mario', 'cloth', true).skirt.y1 >= 39, 'ピーチは 足もとまでの ドレス');
  assert.ok(outfitOf(Lk, 'mario', 'cloth', true).skirt.y1 > outfitOf(Lk, 'plumber', 'cloth', true).skirt.y1);
  assert.equal(headOf(null, 'mario', 'cloth', outfitOf(Lk, 'mario', 'cloth', true)).kind, 'crown43j');
  assert.equal(headOf(null, 'plumber', 'cloth', outfitOf(Lk, 'plumber', 'cloth', true)).kind, 'tiara');
  assert.ok(outfitOf(Lk, 'mustache', 'cloth', true).glove && outfitOf(Lk, 'mustache', 'cloth', true).r43j.brooch);
  assert.equal(jobBody('mario', true).aura, 'peach43j');
  for (const a of ['peach43j', 'star43j']) assert.ok(AURA43J[a], a);
  // よろいを かえても かみと オーラは のこる
  assert.ok(outfitOf(Lk, 'mario', 'iron_armor', true).body.aura === 'peach43j');
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第43回の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない', () => {
  const used = new Set();
  for (const id of [...Object.keys(R43J_ABILITIES), ...Object.keys(HIRA_R43J_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R43J_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R43J_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R43J_SFX).sort(), [...R43J_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R43J_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R43J_HIT)) assert.ok(R43J_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R43J) assert.ok(R43J_ANIMS.has(k), k);
  for (const id of Object.keys(R43J_ABILITIES)) {
    const a = ABILITIES[id];
    if (R43J_ANIMS.has(a.anim) && ['self', 'allies', 'ally'].includes(a.target)) assert.ok(PARTY_ANIMS_R43J.has(a.anim), `${id}: みかたの えんしゅつ`);
  }
  for (const k of Object.keys(R43J_FINE)) assert.ok(k.startsWith('j43j') && !(k in JOB7_FINE) && !(k in JOB8_FINE) && !(k in R41A_FINE) && !(k in R41B_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R43J_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R43J_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS_R43J.has(anim)').length - 1, 2);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR43jFx\(this, anim/);
  assert.match(src, /R43J_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R43J_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR43jFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R43J_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R43J_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      // 2.4びょう いないで おわる
      for (let i = 0; i < 60; i++) fx.update(40);
      assert.equal(fx.parts.length, 0, `${anim} が おわらない`);
    }
  }
  assert.equal(playR43jFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  // 文字の チェックに 入っている
  const files = gameFiles();
  for (const f of ['public/js/shared/data/abilities-r43j.js', 'public/js/shared/data/hirameki-r43j.js', 'public/js/client/render/battlefx-r43j.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});
