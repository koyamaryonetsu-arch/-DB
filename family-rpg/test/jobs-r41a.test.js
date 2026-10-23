// 2026年10月（第41回 A）: 2つの 新しい 伝説の 職業（docs/plan-r41-jobs-a.md）
//   京急の運転士 → 京急の社長 ／ 二刀流スター → 野球界の殿堂入り
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・絵（hero-r41a.js）と えんしゅつ（battlefx-r41a.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R41A_ABILITIES } from '../public/js/shared/data/abilities-r41a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R41A_ABILITIES, HIRAMEKI_R41A } from '../public/js/shared/data/hirameki-r41a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R41A_JOBS, R41A_OUTFIT, R41A_BODY, R41A_HAT, R41A_OLD_LOOK } from '../public/js/client/render/hero-r41a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R41A_ANIMS, R41A_SIGS, PARTY_ANIMS_R41A, R41A_HIT, R41A_SFX, R41A_FINE, playR41aFx } from '../public/js/client/render/battlefx-r41a.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['keikyu_president', 'hall_of_fame'];
const TREE = { keikyu_president: ['京急の社長', 'keikyu_driver'], hall_of_fame: ['野球界の殿堂入り', 'nitoryu'] };
const SIG_NAMES = { keikyu_president: '全線大快特', hall_of_fame: '黄金のサヨナラホームラン' };
const BOY = { body: 0 }, GIRL = { body: 1 };
// 小学校で 習わない 字（ひらがなに した）
const BAD = /[陣振援誇輝稲監督]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/ };
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
test('第41回 A の 職業: 京急の社長（京急の運転士の 上）・野球界の殿堂入り（二刀流スターの 上）。伝説の職業・うわさ・文字・乗り物', () => {
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
    assert.ok(!j.masc, '男の子も 女の子も おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    // 乗り物は もとの 職業と おなじ（赤い電車・リリーフカー）
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && v.jobs.includes(from)), `${id} の 乗り物`);
  }
  assert.ok(LEGEND_ORDER.indexOf('keikyu_president') > LEGEND_ORDER.indexOf('neo_queen'), '第40回の あと');
  assert.equal(LEGEND_ORDER.indexOf('hall_of_fame'), LEGEND_ORDER.indexOf('keikyu_president') + 1);
  assert.equal(jobReqText('keikyu_president'), '京急の運転士Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('hall_of_fame'), '二刀流スターLv10＋ほかの超級職1つLv10');
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('京急の社長') && services.includes('野球界の殿堂入り'), '神殿の 伝説の 一覧');
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
  assert.ok(readme.includes('京急の社長（京急の運転士＋ほかの超級職1つ）') && readme.includes('野球界の殿堂入り（二刀流スター＋ほかの超級職1つ）'), 'README');
});

test('第41回 A の 職業: なれる じゅんばん（もとの 超級職を きわめると うわさ・ほかの 超級職も 1つ きわめると なれる）', () => {
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

test('第41回 A の 職業: 強さは 今の 伝説の職業の はんい（超級職より 上）・もとの 職業より 強い・社長は お金も ふえる', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !NEW.includes(j)).map(sum);
  const sup = SUPER_ORDER.map(sum);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legends) && sum(j) <= Math.max(...legends), `${j}: ${sum(j).toFixed(2)}`);
    assert.ok(sum(j) > sum(TREE[j][1]) + 0.5, `${j}: もとの 職業より 強い`);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.ok(JOBS[j].weapons.length >= 2);
    // もとの 職業の 武器は ぜんぶ 使える
    for (const w of JOBS[TREE[j][1]].weapons) assert.ok(JOBS[j].weapons.includes(w), `${j}: ${w}`);
  }
  // 殿堂入りは 力と 素早さ、社長は 守りと バランス
  assert.ok(JOBS.hall_of_fame.mods.str >= 1.8 && JOBS.hall_of_fame.mods.agi >= 1.55);
  assert.ok(JOBS.keikyu_president.mods.def >= 1.5 && JOBS.keikyu_president.mods.hp >= 1.55);
  // 会社の 売り上げ（戦いで 手に 入る お金。world/battles.js の passive.gold）
  assert.equal(JOBS.keikyu_president.passive.gold, 1.3);
  assert.match(JOBS.keikyu_president.desc, /お金/);
});

// ───────────── 技 ─────────────
test('第41回 A の 技: 6こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
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
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 2, `${j}: 攻撃技 2つ いじょう`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(!a.masc, `${id}: 男の子も おなじ`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && (p.target || a.target) === 'allies') assert.ok(p.mult <= ((p.stats || [p.stat]).length > 1 ? 1.35 : 1.4) + 1e-9, a.name);
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
  assert.deepEqual([...mine].sort(), Object.keys(R41A_ABILITIES).sort(), 'abilities-r41a.js の 技は ぜんぶ どちらかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  assert.ok(has('keikyu_president', (p) => p.type === 'atbSet' && p.add > 0), '社長: ダイヤを 立て直す（みんなの 行動ゲージ）');
  assert.ok(has('keikyu_president', (p) => p.type === 'cure') && has('keikyu_president', (p) => p.type === 'buff' && (p.stats || []).includes('atk')), '社長: 安全点検と 号令');
  assert.ok(JOBS.keikyu_president.learn.filter(([, id]) => ['redtrain', 'r41a_express', 'keikyu_president_sig'].includes(ABILITIES[id].anim)).length >= 3, '社長: 赤い 電車の 技');
  assert.ok(partsOf(ABILITIES.keikyu_president_sig.effect).some((p) => p.type === 'buff' && p.target === 'allies'), '全線大快特: 仲間も 速く');
  assert.ok(has('hall_of_fame', (p) => p.type === 'buff' && (p.stats || []).includes('atk')) && ABILITIES.hof_yokoku.target === 'self', '殿堂入り: 予告ホームラン');
  assert.ok(has('hall_of_fame', (p) => p.type === 'atbSet' && p.sub > 0), '殿堂入り: 三しん');
  assert.ok(has('hall_of_fame', (p) => p.type === 'heal'), '殿堂入り: チームの 円じん');
  assert.ok(ABILITIES.hall_of_fame_sig.effect.ignoreDef > 0 && ABILITIES.hall_of_fame_sig.effect.critBonus > 0);
});

test('第41回 A の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      // 全線大快特は 仲間全員の 素早さも 上がる
      if (id === 'keikyu_president_sig') assert.ok(me.buffs.agi && m.buffs.agi, '仲間の 素早さ');
      // ダイヤ大改正は 仲間の 行動ゲージが たまる
      if (id === 'kqp_daiya') assert.ok(m.buffs.def, '守備力');
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
test('第41回 A の ひらめき技: 2つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R41A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R41A).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R41A_ABILITIES[id].job === j).length, 2, j);
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
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
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
      b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

// ───────────── 合体技・職業の試練・転職の ひとこと ─────────────
test('第41回 A の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（まぼろしの 倍率・師しょうの ことば）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    for (const t of JOBS[TREE[j][1]].tags.filter((x) => x !== 'work' && x !== 'guard')) assert.ok(JOBS[j].tags.includes(t), `${j}: もとの 職業の タグ ${t}`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 2 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    assert.ok(!BAD.test(TRIAL_WORDS[j]), j);
    // 転職の ひとこと（男の子 むけは ない）
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    for (const [, id] of JOBS[j].learn) assert.equal(abilityFor(id, { job: j, look: BOY }), ABILITIES[id], `${id}: 男の子でも おなじ`);
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

test('第41回 A の 絵: 2つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・もちもの・古い え', () => {
  assert.deepEqual(R41A_JOBS, NEW);
  for (const j of NEW) assert.ok(R41A_OUTFIT[j] && R41A_BODY[j] && R41A_HAT[j] && R41A_OLD_LOOK[j], j);
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
    assert.equal(masc33(job, false), null, '男の子も おなじ すがた');
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 京急の社長: こんの スーツ・赤い ベスト・赤い マント・白い 手ぶくろ・金の 時計の くさり・金の おびの ぼうし・赤い 電車の もけい
  const P = outfitOf(Lk, 'keikyu_president', 'cloth', false);
  assert.equal(P.kind, 'suit');
  assert.ok(P.cape && P.torso.vest && P.glove && P.r41a?.chain);
  assert.equal(P.body.prop, 'train41a');
  const ph = headOf(null, 'keikyu_president', 'cloth', P);
  assert.equal(ph.kind, 'conductor');
  assert.ok(!ph.band, '金の おび');
  // よろいを かえても 電車の もけいは のこる（服の かざりは なくなる）
  const PA = outfitOf(Lk, 'keikyu_president', 'iron_armor', true);
  assert.equal(PA.body.prop, 'train41a');
  assert.ok(!PA.r41a);
  // 野球界の殿堂入り: 金の ふちの 白い ユニフォーム・金の メダル・金の ぼうし・ボール・金の オーラ
  const H = outfitOf(Lk, 'hall_of_fame', 'cloth', true);
  assert.equal(H.kind, 'baseball');
  assert.ok(H.r41a?.medal);
  assert.equal(H.body.aura, 'hof');
  assert.equal(H.body.prop, 'ball41a');
  assert.equal(headOf(null, 'hall_of_fame', 'cloth', H).kind, 'bbcap');
  assert.equal(jobBody('hall_of_fame'), R41A_BODY.hall_of_fame);
  const HA = outfitOf(Lk, 'hall_of_fame', 'iron_armor', false);
  assert.equal(HA.body.aura, 'hof', 'よろいでも 金の オーラ');
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第41回 A の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of [...Object.keys(R41A_ABILITIES), ...Object.keys(HIRA_R41A_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R41A_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R41A_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R41A_SFX).sort(), [...R41A_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R41A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R41A_HIT)) assert.ok(R41A_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R41A) assert.ok(R41A_ANIMS.has(k), k);
  for (const id of Object.keys(R41A_ABILITIES)) {
    const a = ABILITIES[id];
    if (R41A_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS_R41A.has(a.anim), `${id}: みかたの えんしゅつ`);
    if (R41A_ANIMS.has(a.anim) && ['enemy', 'enemies'].includes(a.target)) assert.ok(a.anim in R41A_HIT, `${id}: あたる じかん`);
  }
  for (const k of Object.keys(R41A_FINE)) assert.ok(k.startsWith('r41a') && !(k in JOB7_FINE) && !(k in JOB8_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R41A_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R41A_HIT\)/);
  assert.equal(battle.split('PARTY_ANIMS_R41A.has(anim)').length - 1, 2);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR41aFx\(this, anim/);
  assert.match(src, /R41A_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R41A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR41aFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R41A_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R41A_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
    }
  }
  assert.equal(playR41aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r41a.js', import.meta.url), 'utf8')), '文字は 出さない');
});
