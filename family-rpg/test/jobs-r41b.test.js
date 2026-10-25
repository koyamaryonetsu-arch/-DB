// 2026年10月（第41回 B）: 雪の女王（超級職）と 第5のせいれい（伝説の職業）（docs/plan-r41-jobs-b.md）
//   賢者＋スーパースター → 雪の女王（男の子は 雪の王）→ 第5のせいれい（雪の女王＋ほかの 超級職 1つ）
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・絵（hero-r41b.js）と えんしゅつ（battlefx-r41b.js）
//  ・ならびの 場所（SUPER_ORDER・LEGEND_ORDER の 何番め）は 見ない（ほかの 回の 職業と いっしょに ふえても こわれない ように）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R41B_ABILITIES } from '../public/js/shared/data/abilities-r41b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R41B_ABILITIES, HIRAMEKI_R41B } from '../public/js/shared/data/hirameki-r41b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, TRIAL_WORDS_MASC, trialWords, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { jobLabel, jobShort, jobHint } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R41B_JOBS, R41B_OUTFIT, R41B_BODY, R41B_OLD_LOOK, R41B_MASC, R41B_HAIR, AURA41B } from '../public/js/client/render/hero-r41b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VEHICLE_ART } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R41B_ANIMS, R41B_SIGS, PARTY_ANIMS_R41B, R41B_HIT, R41B_SFX, R41B_FINE, playR41bFx } from '../public/js/client/render/battlefx-r41b.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['snow_queen', 'fifth_spirit'];
// [名前, ランク, じょうけん, ほかの 超級職の かず]
const TREE = { snow_queen: ['雪の女王', 2, ['sage', 'superstar'], undefined], fifth_spirit: ['第5のせいれい', 3, ['snow_queen'], 1] };
const SIG_NAMES = { snow_queen: '氷の城の大ふぶき', fifth_spirit: 'せいれいをつなぐ光' };
const BOY = { body: 0 }, GIRL = { body: 1 };
const boy = { job: 'snow_queen', look: BOY }, girl = { job: 'snow_queen', look: GIRL };
// 小学校で 習わない 字（ひらがなに した）
const BAD = /[霊巨晶凍姫結晶]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45 } = {}) {
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
test('第41回 B の 職業: 雪の女王（賢者＋スーパースターの 超級職）・第5のせいれい（雪の女王の 上の 伝説の職業）。うわさ・文字', () => {
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req, sup] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, sup);
    assert.equal(j.family, 'magic');
    assert.ok((tier === 2 ? SUPER_ORDER : LEGEND_ORDER).includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    assert.ok(JOB_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!BAD.test(j.name + j.desc + JOB_HINTS[id]), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
  }
  // 賢者＋スーパースターの 超級職は ほかに ない（同じ くみあわせが かぶらない）
  const key = (j) => [...JOBS[j].req].sort().join('+');
  assert.deepEqual(SUPER_ORDER.filter((j) => key(j) === 'sage+superstar'), ['snow_queen']);
  assert.equal(jobReqText('snow_queen'), '賢者Lv10＋スーパースターLv10');
  // 家族が きめた: 賢者と スーパースターの 両方（うわさも そう 言う）
  for (const h of [JOB_HINTS.snow_queen, JOBS.snow_queen.masc.hint]) assert.ok(h.includes('賢者') && h.includes('スーパースター'), h);
  assert.equal(jobReqText('fifth_spirit'), '雪の女王Lv10＋ほかの超級職1つLv10');
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('第5のせいれい'), '神殿の 伝説の 一覧');
});

test('第41回 B の 職業: なれる じゅんばん（賢者 か スーパースターを きわめると うわさ → 両方で 雪の女王 → ほかの 超級職も 1つで 第5のせいれい）', () => {
  for (const first of ['sage', 'superstar']) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    assert.equal(jobKnown(c, 'snow_queen'), false, '雪の女王は はじめ ひみつ');
    master(c, first);
    assert.equal(jobKnown(c, 'snow_queen'), true, `${first} を きわめると うわさ`);
    assert.equal(jobUnlocked(c, 'snow_queen'), false, 'もう1つ いる');
    master(c, first === 'sage' ? 'superstar' : 'sage');
    assert.equal(jobUnlocked(c, 'snow_queen'), true);
    assert.equal(changeJob(c, 'snow_queen').ok, true);
    assert.ok(learnedAbilities(c).includes('sq_tsubute'));
  }
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
  assert.equal(jobKnown(c, 'fifth_spirit'), false, '第5のせいれいは はじめ ひみつ');
  master(c, 'snow_queen');
  assert.equal(jobKnown(c, 'fifth_spirit'), true, '雪の女王を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'fifth_spirit'), false, 'ほかの 超級職も いる');
  master(c, 'archmage');
  assert.equal(jobUnlocked(c, 'fifth_spirit'), true);
  assert.equal(changeJob(c, 'fifth_spirit').ok, true);
  assert.ok(learnedAbilities(c).includes('fs_kaze'));
});

test('第41回 B の 職業: 強さは 今の 超級職・伝説の職業の はんい・第5のせいれいは 雪の女王より 強い', () => {
  const others = (list) => list.filter((j) => !NEW.includes(j)).map(sum);
  const sup = others(SUPER_ORDER), leg = others(LEGEND_ORDER);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.ok(JOBS[j].weapons.length >= 2);
  }
  const sq = sum('snow_queen'), fs = sum('fifth_spirit');
  assert.ok(sq >= Math.min(...sup) && sq <= Math.max(...sup), `雪の女王 ${sq.toFixed(2)}`);
  assert.ok(fs > Math.max(...sup) && fs >= Math.min(...leg) && fs <= Math.max(...leg), `第5のせいれい ${fs.toFixed(2)}`);
  assert.ok(fs > sq + 0.5, 'もとの 職業より 強い');
  // どちらも 魔力が いちばん 高い（氷の 魔法）
  for (const j of NEW) assert.equal(Object.entries(JOBS[j].mods).sort((a, b) => b[1] - a[1])[0][0], 'mag', j);
});

// ───────────── 技 ─────────────
test('第41回 B の 技: 6こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
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
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 2, `${j}: 攻撃技 2つ いじょう`);
    const multiCap = job.tier === 2 ? 1.3 : 1.35;
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && !p.target && a.target === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? multiCap : 1.4) + 1e-9, a.name);
        if (['atbSet', 'status', 'debuff'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
    // 1つの 職業の 中で 効果の 形が かぶらない
    const shape = (a) => `${a.target}|${partsOf(a.effect).map((p) => [p.type, p.target || '', p.element || '', p.stat || (p.stats || []).join('+'), p.status || '', p.hits ? 'hits' : ''].join(':')).join(',')}`;
    const seen = new Set();
    for (const [, id] of job.learn) {
      const k = shape(ABILITIES[id]);
      assert.ok(!seen.has(k), `${ABILITIES[id].name} の 形が かぶる`);
      seen.add(k);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R41B_ABILITIES).sort(), 'abilities-r41b.js の 技は ぜんぶ どちらかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  assert.ok(has('snow_queen', (p) => p.type === 'magic' && p.element === 'ice'), '雪の女王: 氷の 魔法');
  assert.ok(has('snow_queen', (p) => p.type === 'buff' && p.stat === 'def'), '雪の女王: 氷の かべ');
  assert.ok(has('snow_queen', (p) => p.type === 'heal'), '雪の女王: 雪だるまの 仲間');
  assert.ok(has('snow_queen', (p) => p.type === 'cure') && JOBS.snow_queen.learn.some(([, id]) => ABILITIES[id].name.includes('歌')), '雪の女王: 心を こめた 歌');
  assert.ok(partsOf(ABILITIES.snow_queen_sig.effect).every((p) => !p.element || p.element === 'ice'), '氷の城の大ふぶきは 氷');
  // 第5のせいれい: 風・火・水（いやし）・大地・4つを 1つに
  assert.ok(has('fifth_spirit', (p) => p.element === 'wind') && has('fifth_spirit', (p) => p.element === 'fire'), '風と 火');
  assert.ok(has('fifth_spirit', (p) => p.type === 'heal') && has('fifth_spirit', (p) => p.type === 'regen'), '水の いやし');
  assert.ok(has('fifth_spirit', (p) => p.type === 'magic' && !p.element), '大地');
  assert.ok(has('fifth_spirit', (p) => (p.stats || []).includes('atk') && (p.stats || []).includes('mag')), '4つの せいれいの 心');
  assert.equal(partsOf(ABILITIES.fifth_spirit_sig.effect)[0].element, 'void', 'せいれいをつなぐ光は どんな 敵にも 効く');
  assert.ok(partsOf(ABILITIES.fifth_spirit_sig.effect).some((p) => p.type === 'cure' && p.target === 'allies'), '仲間も 治す');
  // 第5のせいれいは 雪の女王より 強い 看板の 技
  assert.ok(ABILITIES.fifth_spirit_sig.effect.parts[0].base[0] > ABILITIES.snow_queen_sig.effect.parts[0].base[1]);
});

test('第41回 B の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: ['ally', 'deadAlly'].includes(a.target) ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
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
  // せいれいをつなぐ光: 仲間の 悪い じょうたいも 治る
  const { b, me, m } = setup('fifth_spirit', { seed: 3 });
  m.status = { ...m.status, poison: 3 };
  readyUp(b, me);
  b.command(me.id, { type: 'ability', id: 'fifth_spirit_sig', target: b.enemies[0].id }, 's1');
  const act = runUntilAct(b, me.id);
  assert.ok(act.results?.filter((x) => x.dmg > 0).length >= 3, '敵全体');
  assert.ok(!m.status.poison, '毒が 治る');
});

// ───────────── ひらめき技 ─────────────
test('第41回 B の ひらめき技: 雪の女王 1つ・第5のせいれい 2つ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R41B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R41B).sort(), [...ids].sort());
  assert.equal(ids.filter((id) => HIRA_R41B_ABILITIES[id].job === 'snow_queen').length, 1);
  assert.equal(ids.filter((id) => HIRA_R41B_ABILITIES[id].job === 'fifth_spirit').length, 2);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id)).map(([, a]) => a.anim));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
    assert.ok(oldAnims.has(a.anim) || /^ax_/.test(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) {
      assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    }
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = JOBS[a.job].req[0];
    assert.equal(hiraAllowed(c, id), false, 'もとの 職業では ひらめかない');
    // 使える
    {
      const { b, c: ch, me } = setup(a.job, { seed: ++n });
      ch.hirameki = [id];
      me.abilities = [...me.abilities, id];
      readyUp(b, me);
      assert.equal(b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1').ok, true, id);
      const act = runUntilAct(b, me.id);
      if (abilityRole(a) === 'dmg') assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      for (const l of act.lines) textOk(l, id);
    }
    // ひらめく
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from)[0];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c: ch, me } = setup(a.job, { seed });
      ch.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...ch.skillUse };
      readyUp(b, me);
      b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技・職業の試練・転職の ひとこと・乗り物 ─────────────
test('第41回 B の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練・転職の ひとこと・乗り物（水の馬）', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('ice'), `${j}: 氷`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練（超級職も 伝説も ある）
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 2 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    // 転職の ひとこと
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
  }
  assert.ok(JOBS.snow_queen.tags.includes('guard'), '雪の女王は 氷の かべで 守る');
  for (const t of ['wind', 'fire']) assert.ok(JOBS.fifth_spirit.tags.includes(t), `第5のせいれい: ${t}`);
  // 男の子の 雪の女王（雪の王）
  assert.notEqual(trialWords('snow_queen', boy), trialWords('snow_queen', girl));
  assert.equal(trialWords('snow_queen', boy), TRIAL_WORDS_MASC.snow_queen);
  assert.ok(jobDoneText('ユウ', '雪の王', [], 'snow_queen', true).endsWith(JOB_SAY_MASC.snow_queen));
  textOk(JOB_SAY_MASC.snow_queen, 'masc');
  textOk(TRIAL_WORDS_MASC.snow_queen, 'masc');
  assert.equal(masterName('snow_queen', boy), '雪の王の師しょう');
  // 乗り物: 水の馬（絵も ある）
  const v = VEHICLES.water_horse;
  assert.ok(v && v.name === '水の馬');
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'vehicle');
  textOk(v.desc, 'vehicle');
  assert.ok(VEHICLE_ART.water_horse || VEHICLE_ART.has?.('water_horse'), '水の馬の 絵');
});

// ───────────── 男の子の 雪の女王 ─────────────
test('男の子の 雪の女王は「雪の王」（名前・みじかい 名前・うわさ。強さ・技は おなじ）・第5のせいれいは 名前も おなじ', () => {
  assert.equal(jobLabel('snow_queen', boy), '雪の王');
  assert.equal(jobLabel('snow_queen', girl), '雪の女王');
  assert.equal(jobShort('snow_queen', boy), '雪の王');
  assert.equal(jobHint('snow_queen', boy), JOBS.snow_queen.masc.hint);
  assert.equal(jobHint('snow_queen', girl), JOB_HINTS.snow_queen);
  for (const s of [JOBS.snow_queen.masc.name, JOBS.snow_queen.masc.desc, JOBS.snow_queen.masc.hint]) textOk(s, 'masc');
  assert.equal(jobLabel('fifth_spirit', boy), '第5のせいれい');
  assert.equal(JOBS.fifth_spirit.masc, undefined, '第5のせいれいの 名前は 男の子も おなじ');
  assert.ok(!JOB_HINTS.fifth_spirit.includes('女王') && !JOBS.fifth_spirit.desc.includes('女王'), 'うわさ・説明は 男の子が 読んでも おかしくない');
  for (const id of [...Object.keys(R41B_ABILITIES), ...Object.keys(HIRA_R41B_ABILITIES)]) {
    assert.equal(ABILITIES[id].masc, undefined, `${id}: 技の 名前は どちらも おなじ`);
    assert.equal(abilityFor(id, boy), ABILITIES[id]);
  }
});

// ───────────── 絵 ─────────────
const DIRS = ['down', 'left', 'up', 'right'];
const key = (img) => Buffer.from(img.rgba).toString('base64');
function inspect(img) {
  let n = 0, edge = false;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const a = img.rgba[(y * img.w + x) * 4 + 3];
    if (!a) continue;
    n++;
    if (y === 0 || x === 0 || x === img.w - 1) edge = true;
  }
  return { n, edge };
}

test('第41回 B の 絵: 2つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・雪の王・古い え', () => {
  assert.deepEqual(R41B_JOBS, NEW);
  for (const j of NEW) assert.ok(R41B_OUTFIT[j] && R41B_BODY[j] && R41B_OLD_LOOK[j] && R41B_MASC[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of JOBS[job].req) assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
      }
    }
    for (const dir of DIRS) assert.notEqual(key(paintHero(BOY, job, undefined, dir, 0, 4)), key(paintHero(GIRL, job, undefined, dir, 0, 4)), `${job} ${dir}`);
  }
  assert.notEqual(key(paintHero(GIRL, 'snow_queen', undefined, 'down', 0, 4)), key(paintHero(GIRL, 'fifth_spirit', undefined, 'down', 0, 4)));
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 雪の女王（女の子）: 足もとまでの 水色の ドレス・すける マント・白っぽい 金の かた三つ編み・雪の けっしょう
  const Q = outfitOf(Lk, 'snow_queen', 'cloth', true);
  assert.equal(Q.kind, 'dress');
  assert.ok(Q.skirt.y1 >= 39, '足もとまでの ドレス');
  assert.ok(Q.cape && Q.cape.len >= 38, '長い マント');
  assert.equal(Q.body.hair, 'braid');
  assert.equal(Q.body.hcol, 'r41bplat');
  assert.ok(R41B_HAIR.r41bplat);
  assert.equal(Q.body.aura, 'snow41b');
  assert.equal(jobBody('snow_queen'), R41B_BODY.snow_queen);
  // よろいを かえても かみと オーラは のこる
  const QA = outfitOf(Lk, 'snow_queen', 'iron_armor', true);
  assert.ok(QA.body.hair === 'braid' && QA.body.aura === 'snow41b');
  // 第5のせいれい（女の子）: 白い ドレス・おろした 長い かみ・4つの せいれいの 光
  const F = outfitOf(Lk, 'fifth_spirit', 'cloth', true);
  assert.equal(F.kind, 'dress');
  assert.ok(F.skirt.y1 >= 39 && F.cape);
  assert.equal(F.body.hair, 'long');
  assert.equal(F.body.aura, 'spirit41b');
  for (const a of ['snow41b', 'spirit41b']) assert.ok(AURA41B[a], a);
  // 男の子: 雪の王（王子の 服・マント）・第5のせいれい（白い ローブ・マント）。ドレスでは ない・かみがたは その 人の まま
  for (const j of NEW) {
    assert.equal(masc33(j, false), R41B_MASC[j]);
    assert.equal(masc33(j, true), null);
    const M = outfitOf(Lk, j, 'cloth', false);
    assert.notEqual(M.kind, 'dress', j);
    assert.ok(M.cape && !M.body.hair && M.body.hcol === 'r41bplat', j);
    assert.equal(headOf(null, j, 'cloth', M), null, `${j}: ぼうしは ない`);
  }
  assert.equal(outfitOf(Lk, 'snow_queen', 'cloth', false).kind, 'uniform');
  assert.equal(outfitOf(Lk, 'fifth_spirit', 'cloth', false).kind, 'robe');
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第41回 B の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない', () => {
  const used = new Set();
  for (const id of [...Object.keys(R41B_ABILITIES), ...Object.keys(HIRA_R41B_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R41B_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R41B_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R41B_SFX).sort(), [...R41B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R41B_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R41B_HIT)) assert.ok(R41B_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R41B) assert.ok(R41B_ANIMS.has(k), k);
  for (const id of Object.keys(R41B_ABILITIES)) {
    const a = ABILITIES[id];
    if (R41B_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS_R41B.has(a.anim), `${id}: みかたの えんしゅつ`);
  }
  for (const k of Object.keys(R41B_FINE)) assert.ok(k.startsWith('j41b') && !(k in JOB7_FINE) && !(k in JOB8_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R41B_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R41B_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS_R41B.has(anim)').length - 1, 2);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR41bFx\(this, anim/);
  assert.match(src, /R41B_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R41B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR41bFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R41B_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R41B_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      // 2.2びょう いないで おわる
      for (let i = 0; i < 60; i++) fx.update(40);
      assert.equal(fx.parts.length, 0, `${anim} が おわらない`);
    }
  }
  assert.equal(playR41bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  // 文字の チェックに 入っている
  const files = gameFiles();
  for (const f of ['public/js/shared/data/abilities-r41b.js', 'public/js/shared/data/hirameki-r41b.js', 'public/js/client/render/battlefx-r41b.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});
