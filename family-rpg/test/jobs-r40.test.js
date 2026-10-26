// 2026年10月（第40回）: 2つの 新しい 伝説の 職業（docs/plan-r40-jobs.md）
//   竜の騎士 → 竜魔人 ／ セーラームーン → ネオ・クイーン・セレニティ（男の子は キング・エンディミオン）
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・文字
//  ・絵（hero-r40.js）と えんしゅつ（battlefx-jobs8.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText, jobAncestry } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { JOB10_ABILITIES } from '../public/js/shared/data/abilities-jobs10.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R40_ABILITIES, HIRAMEKI_R40 } from '../public/js/shared/data/hirameki-r40.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, TRIAL_WORDS_MASC, trialWords, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { jobLabel, jobHint } from '../public/js/shared/job-label.js';
import { abilityFor, abilityLabel } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R40_JOBS, R40_OUTFIT, R40_BODY, R40_OLD_LOOK, R40_MASC } from '../public/js/client/render/hero-r40.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R40_ANIMS, R40_SIGS, PARTY_ANIMS8, JOB8_HIT, JOB8_SFX, JOB8_FINE, playJob8Fx } from '../public/js/client/render/battlefx-jobs8.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['ryumajin', 'neo_queen'];
const TREE = { ryumajin: ['竜魔人', 'dragon_knight'], neo_queen: ['ネオ・クイーン・セレニティ', 'sailor_moon'] };
const SIG_NAMES = { ryumajin: '竜魔の大波動', neo_queen: 'よみがえる月の王国' };
const BOY = { body: 0 }, GIRL = { body: 1 };
const boy = { job: 'neo_queen', look: BOY }, girl = { job: 'neo_queen', look: GIRL };
// 小学校で 習わない 字（ひらがなに した）
const BAD = /[双祈浄輝翼晶跡奇咆哮]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

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
test('第40回の 職業: 竜魔人（竜の騎士の 上）・ネオ・クイーン・セレニティ（セーラームーンの 上）。伝説の職業・うわさ・文字', () => {
  for (const id of NEW) {
    const j = JOBS[id], [name, from] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, 3);
    assert.deepEqual(j.req, [from]);
    assert.equal(j.reqSuper, 1, 'ほかの 伝説の 職業と おなじ（○○＋ほかの超級職1つ）');
    assert.ok(LEGEND_ORDER.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.ok(JOB_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!BAD.test(j.name + j.desc + JOB_HINTS[id]), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
  }
  // 第41回 B から あとに 伝説の 職業が ふえても よい（第40回の 2つが この じゅんで つづく）
  assert.deepEqual(LEGEND_ORDER.slice(LEGEND_ORDER.indexOf(NEW[0]), LEGEND_ORDER.indexOf(NEW[0]) + 2), NEW);
  assert.equal(jobReqText('ryumajin'), '竜の騎士Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('neo_queen'), 'セーラームーンLv10＋ほかの超級職1つLv10');
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('竜魔人') && services.includes('ネオ・クイーン・セレニティ'), '神殿の 伝説の 一覧');
});

test('第40回の 職業: なれる じゅんばん（もとの 超級職を きわめると うわさ・ほかの 超級職も 1つ きわめると なれる）', () => {
  for (const id of NEW) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    const from = TREE[id][1];
    assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
    master(c, from);
    assert.equal(jobKnown(c, id), true, `${from} を きわめると うわさ`);
    assert.equal(jobUnlocked(c, id), false, 'ほかの 超級職も いる');
    master(c, 'archmage');
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
});

test('第40回の 職業: 強さは 今の 伝説の職業の はんい（超級職より 上）・もとの 職業より 強い', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !NEW.includes(j)).map(sum);
  const sup = SUPER_ORDER.map(sum);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legends) && sum(j) <= Math.max(...legends), `${j}: ${sum(j).toFixed(2)}`);
    assert.ok(sum(j) > sum(TREE[j][1]) + 0.5, `${j}: もとの 職業より 強い`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.ok(JOBS[j].weapons.length >= 2);
  }
  // 竜魔人は 力、ネオ・クイーン・セレニティは 魔力と 回復
  assert.ok(JOBS.ryumajin.mods.str >= 1.8);
  assert.ok(JOBS.neo_queen.mods.mag >= 1.55 && JOBS.neo_queen.mods.heal >= 1.6);
});

// ───────────── 技 ─────────────
test('第40回の 技: 6こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
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
    assert.ok(ABILITIES[sig].anim === sig || /^(ax|ox)_/.test(ABILITIES[sig].anim));
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 2, `${j}: 攻撃技 2つ いじょう`);
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
        if (p.type === 'buff' && !p.target && a.target === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? 1.35 : 1.4) + 1e-9, a.name);
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
  assert.deepEqual([...mine].sort(), Object.keys(JOB10_ABILITIES).sort(), 'abilities-jobs10.js の 技は ぜんぶ どちらかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  assert.ok(has('ryumajin', (p) => (p.stats || []).includes('atk') && (p.stats || []).includes('mag')), '竜魔人: 両手の 竜の紋章（攻撃力と 魔力）');
  assert.ok(has('ryumajin', (p) => p.type === 'phys' && p.element === 'bolt'), '竜魔人: いなずまの 魔法剣');
  assert.ok(has('ryumajin', (p) => p.type === 'buff' && p.stat === 'def'), '竜魔人: 竜闘気で 守る');
  assert.equal(ABILITIES.ryumajin_sig.effect.element, 'void', '竜魔の大波動は どんな 敵にも 効く');
  assert.ok(has('neo_queen', (p) => p.type === 'revive' && p.hpRatio === 1), '女王: よみがえり');
  assert.ok(has('neo_queen', (p) => p.type === 'regen') && has('neo_queen', (p) => p.type === 'cure'), '女王: 結界と いやし');
  assert.ok(partsOf(ABILITIES.neo_queen_sig.effect).some((p) => p.type === 'heal' && p.target === 'allies'), '月の 王国: 仲間も 回復');
});

test('第40回の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
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
      if (a.target === 'deadAlly') assert.ok(m.alive && m.hp > m.maxHp * 0.6, `${id}: 元気いっぱいに 生き返る（${m.hp}/${m.maxHp}）`);
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
});

// ───────────── ひらめき技 ─────────────
test('第40回の ひらめき技: 2つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R40_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R40).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R40_ABILITIES[id].job === j).length, 2, j);
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
    assert.ok(oldAnims.has(a.anim) || /^(ax|ox)_/.test(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) {
      assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    }
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = TREE[a.job][1];
    assert.equal(hiraAllowed(c, id), false, 'もとの 超級職では ひらめかない');
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
      b.command(me.id, { type: 'ability', id: key, target: ABILITIES[key].target === 'deadAlly' ? b.allies[1].id : b.enemies[0].id }, 's1');
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技・職業の試練・転職の ひとこと ─────────────
test('第40回の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（まぼろしの 倍率・師しょうの ことば）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 2 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    assert.ok(!phantomSkills(j).includes('nq_fukkatsu'), '生き返らせる 技は 使わない');
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    // 転職の ひとこと
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
  }
  // 男の子の ネオ・クイーン・セレニティ（キング・エンディミオン）
  assert.notEqual(trialWords('neo_queen', boy), trialWords('neo_queen', girl));
  assert.equal(trialWords('neo_queen', boy), TRIAL_WORDS_MASC.neo_queen);
  assert.ok(jobDoneText('ユウ', 'キング・エンディミオン', [], 'neo_queen', true).endsWith(JOB_SAY_MASC.neo_queen));
  textOk(JOB_SAY_MASC.neo_queen, 'masc');
  assert.equal(masterName('neo_queen', boy), 'キング・エンディミオンの師しょう');
});

// ───────────── 男の子の ネオ・クイーン・セレニティ ─────────────
test('男の子の ネオ・クイーン・セレニティは「キング・エンディミオン」（名前・うわさ・技の 名前。強さは おなじ）', () => {
  assert.equal(jobLabel('neo_queen', boy), 'キング・エンディミオン');
  assert.equal(jobLabel('neo_queen', girl), 'ネオ・クイーン・セレニティ');
  assert.equal(jobHint('neo_queen', boy), JOBS.neo_queen.masc.hint);
  assert.ok(jobHint('neo_queen', boy).includes('タキシード仮面'));
  assert.equal(jobHint('neo_queen', girl), JOB_HINTS.neo_queen);
  assert.equal(jobLabel('ryumajin', boy), '竜魔人', '竜魔人は おなじ');
  const masc = Object.keys(ABILITIES).filter((id) => ABILITIES[id].masc && ABILITIES[id].job === 'neo_queen');
  for (const id of ['neo_queen_sig', ...Object.keys(HIRA_R40_ABILITIES).filter((x) => HIRA_R40_ABILITIES[x].job === 'neo_queen')]) assert.ok(masc.includes(id), `${id} は 男の子 むけも ある`);
  for (const id of masc) {
    const a = ABILITIES[id], m = abilityFor(id, boy);
    assert.notEqual(abilityLabel(id, boy), a.name);
    assert.equal(abilityLabel(id, girl), a.name);
    assert.deepEqual(Object.keys(a.masc).filter((k) => !['name', 'kana', 'cast', 'desc', 'anim'].includes(k)), [], id);
    for (const k of Object.keys(a)) if (!['name', 'kana', 'cast', 'desc', 'anim', 'masc'].includes(k)) assert.deepEqual(m[k], a[k], `${id}.${k}`);
    for (const s of [m.name, m.cast, m.desc]) textOk(s, id);
    assert.match(m.kana, /^[ぁ-んー]+$/);
    if (a.masc.anim) assert.ok(R40_ANIMS.has(m.anim) || /^(ax|ox)_/.test(m.anim), `${id}: ${m.anim}`);
  }
  for (const id of JOBS.ryumajin.learn.map(([, x]) => x)) assert.equal(abilityFor(id, boy), ABILITIES[id], '竜魔人の 技は 男の子でも おなじ');
});

// ───────────── 絵 ─────────────
const DIRS = ['down', 'left', 'up', 'right'];
const key = (img) => Buffer.from(img.rgba).toString('base64');
function inspect(img) {
  let n = 0, edge = false, semi = 0;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const a = img.rgba[(y * img.w + x) * 4 + 3];
    if (!a) continue;
    n++;
    if (a < 255) semi++;
    if (y === 0 || x === 0 || x === img.w - 1) edge = true;
  }
  return { n, edge, semi };
}

test('第40回の 絵: 2つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・キング・エンディミオン・古い え', () => {
  assert.deepEqual(R40_JOBS, NEW);
  for (const j of NEW) assert.ok(R40_OUTFIT[j] && R40_BODY[j] && R40_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        const from = TREE[job][1];
        assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
      }
    }
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 竜魔人: 竜の うろこの よろい・マント・竜闘気の オーラ・ひたいと 両手の 紋章
  const R = outfitOf(Lk, 'ryumajin', 'cloth', false);
  assert.equal(R.kind, 'plate');
  assert.ok(R.cape && R.pauldron.spike);
  assert.equal(R.body.aura, 'ryuma');
  assert.ok(R.body.crest40 && R.handCrest40);
  // よろいを かえても 紋章と オーラは のこる
  const RA = outfitOf(Lk, 'ryumajin', 'iron_armor', true);
  assert.ok(RA.body.crest40 && RA.handCrest40 && RA.body.aura === 'ryuma');
  // ネオ・クイーン・セレニティ（女の子）: 足もとまでの 白い ドレス・銀の おだんご・三日月・はね・つえ
  const Q = outfitOf(Lk, 'neo_queen', 'cloth', true);
  assert.equal(Q.kind, 'dress');
  assert.ok(Q.skirt.y1 >= 39, '足もとまでの ドレス');
  assert.ok(Q.wings && Q.body.crescent40 && Q.body.prop === 'scepter40');
  assert.equal(Q.body.hair, 'moon33');
  assert.equal(jobBody('neo_queen'), R40_BODY.neo_queen);
  // 男の子: キング・エンディミオン（よろいと 黒い マント・光る バラ・三日月。ドレス・おだんご・はねは ない）
  assert.equal(masc33('neo_queen', false), R40_MASC.neo_queen);
  assert.equal(masc33('neo_queen', true), null);
  assert.equal(masc33('ryumajin', false), null);
  const K = outfitOf(Lk, 'neo_queen', 'cloth', false);
  assert.equal(K.kind, 'plate');
  assert.ok(K.cape && !K.wings && K.body.crescent40 && K.body.prop === 'rose33' && !K.body.hair);
  assert.equal(headOf(null, 'neo_queen', 'cloth', K), null, 'ぼうしは ない');
  for (const dir of DIRS) assert.notEqual(key(paintHero(BOY, 'neo_queen', undefined, dir, 0, 4)), key(paintHero(GIRL, 'neo_queen', undefined, dir, 0, 4)), dir);
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第40回の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  // 技の データの anim（男の子の masc.anim も）は ここの えんしゅつ か 前から ある もの
  const used = new Set();
  for (const id of [...Object.keys(JOB10_ABILITIES), ...Object.keys(HIRA_R40_ABILITIES)]) {
    const a = ABILITIES[id];
    used.add(a.anim);
    if (a.masc?.anim) used.add(a.masc.anim);
  }
  for (const anim of R40_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R40_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(JOB8_SFX).sort(), [...R40_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(JOB8_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(JOB8_HIT)) assert.ok(R40_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS8) assert.ok(R40_ANIMS.has(k), k);
  for (const id of Object.keys(JOB10_ABILITIES)) {
    const a = ABILITIES[id];
    if (R40_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS8.has(a.anim), `${id}: みかたの えんしゅつ`);
  }
  for (const k of Object.keys(JOB8_FINE)) assert.ok(k.startsWith('j8') && !(k in JOB7_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.JOB8_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, JOB8_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS8.has(anim)').length - 1, 2);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playJob8Fx\(this, anim/);
  assert.match(src, /JOB8_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R40_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playJob8Fx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!JOB8_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) JOB8_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
    }
  }
  assert.equal(playJob8Fx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  textOk(readFileSync(new URL('../public/js/client/render/battlefx-jobs8.js', import.meta.url), 'utf8').match(/text: '([^']*)'/)?.[1] || '', 'fx');
});
