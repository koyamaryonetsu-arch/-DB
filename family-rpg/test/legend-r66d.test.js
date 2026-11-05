// 第66回 D班: 5つの 新しい 伝説の 職業（docs/plan-r66-legend.md の D班）
//   かいとうキッド → 月下のき術師 ／ ドラえもん → のぶドラ ／ はなかっぱ（筋肉ニンニク）→ かっぱの大王 ／
//   はがねのれん金術師 → 真理のとびらをひらく者 ／ ピーチ（マリオ）→ ロゼッタ（男の子は ギャラクシーマリオ）
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・絵（hero-r66d.js）と えんしゅつ（battlefx-r66d.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { LEGEND_R66D_ORDER, LEGEND_R66D_JOBS } from '../public/js/shared/data/jobs-legend-r66d.js';
import { LEGEND_R66A_ORDER } from '../public/js/shared/data/jobs-legend-r66a.js';
import { LEGEND_R66B_ORDER } from '../public/js/shared/data/jobs-legend-r66b.js';
import { LEGEND_R66C_ORDER } from '../public/js/shared/data/jobs-legend-r66c.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66D_ABILITIES } from '../public/js/shared/data/abilities-r66d.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66D_ABILITIES, HIRAMEKI_R66D } from '../public/js/shared/data/hirameki-r66d.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, TRIAL_WORDS_MASC, trialJob, masterName, trialWords } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { POT_FAST_JOBS } from '../public/js/shared/data/alchemy.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { jobLabel, jobHint } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R66D_JOBS, R66D_OUTFIT, R66D_BODY, R66D_HAT, R66D_BODY_HAT, R66D_OLD_LOOK, R66D_MASC } from '../public/js/client/render/hero-r66d.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66D_ANIMS, R66D_SIGS, R66D_HIT, R66D_SFX, R66D_FINE, playR66dFx } from '../public/js/client/render/battlefx-r66d.js';
import { R43J_FINE } from '../public/js/client/render/battlefx-r43j.js';
import { R41A_FINE } from '../public/js/client/render/battlefx-r41a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta'];
const TREE = {
  gekka: ['月下のき術師', 'kaito_kid'], nobu_dora: ['のぶドラ', 'doraemon'], kappa_king: ['かっぱの大王', 'kinniku_kappa'],
  truth_gate: ['真理のとびらをひらく者', 'fullmetal'], rosetta: ['ロゼッタ', 'mario'],
};
const SIG_NAMES = {
  gekka: '月下のロイヤルストレートフラッシュ', nobu_dora: 'ひみつ道具大行進', kappa_king: '大王の大パッカーン',
  truth_gate: '真理のとびら・大れん成', rosetta: '流星群とチコの大行進',
};
// 第66回の ほかの 班の 職業（くらべる 時は 前から ある 伝説だけ）
const R66 = new Set([...LEGEND_R66A_ORDER, ...LEGEND_R66B_ORDER, ...LEGEND_R66C_ORDER, ...LEGEND_R66D_ORDER]);
const BOY = { body: 0 }, GIRL = { body: 1 };
// 小学校で 習わない 字（かなに した）
const BAD = /[扉奇宵郎突避刃砲帆与依]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45, look = null } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  if (look) c.look = { ...c.look, ...look };
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
test('第66回 D班の 職業: 5つの 伝説の職業（もとの 超級職の 上）・うわさ・文字・乗り物', () => {
  assert.deepEqual(LEGEND_R66D_ORDER, NEW);
  assert.deepEqual(Object.keys(LEGEND_R66D_JOBS), NEW);
  for (const id of NEW) {
    const j = JOBS[id], [name, from] = TREE[id];
    assert.equal(j, LEGEND_R66D_JOBS[id]);
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, 3);
    assert.deepEqual(j.req, [from]);
    assert.ok(!j.reqAlt);
    assert.equal(j.reqSuper, 1, 'ほかの 伝説の 職業と おなじ（○○＋ほかの超級職1つ）');
    assert.ok(SUPER_ORDER.includes(from));
    assert.ok(LEGEND_ORDER.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.ok(JOB_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!BAD.test(j.name + j.desc + JOB_HINTS[id]), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.match(j.desc, /ほかの超級職を1つきわめた者だけがなれる/);
    // 乗り物は もとの 職業と おなじ（グライダー・竹とんぼプロペラ・ハスの葉・れん成の石車・ヨッシー）
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && v.jobs.includes(from)), `${id} の 乗り物`);
  }
  // 第66回の 伝説の 職業は 前の 伝説の あと（ならびは 表の まま）
  const at = NEW.map((j) => LEGEND_ORDER.indexOf(j));
  assert.ok(at[0] > LEGEND_ORDER.indexOf('hall_of_fame'));
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
  assert.equal(jobReqText('gekka'), 'かいとうキッドLv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('kappa_king'), 'はなかっぱ（筋肉ニンニク）Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('truth_gate'), 'はがねのれん金術師Lv10＋ほかの超級職1つLv10');
  // ロゼッタは 星の 乗り物（ほうき星）にも 乗れる
  assert.ok(VEHICLES.shooting_star.jobs.includes('rosetta'));
  // 真理のとびらをひらく者も れん金がまが 速い（はがねのれん金術師の 先）
  assert.ok(POT_FAST_JOBS.includes('truth_gate'));
  assert.match(JOBS.truth_gate.desc, /れん金がま/);
});

test('第66回 D班の 職業: ロゼッタは 男の子だと ギャラクシーマリオ（名前・うわさ・ひとこと・師しょうの ことば・看板の 技）。ほかは 男女 おなじ', () => {
  const R = JOBS.rosetta;
  assert.equal(jobLabel('rosetta', { job: 'rosetta', look: GIRL }), 'ロゼッタ');
  assert.equal(jobLabel('rosetta', { job: 'rosetta', look: BOY }), 'ギャラクシーマリオ');
  for (const s of [R.masc.name, R.masc.short, R.masc.desc, R.masc.hint]) textOk(s, 'rosetta masc');
  assert.deepEqual(checkText(R.masc.kana).filter((p) => p.kind !== 'kana'), []);
  assert.match(R.masc.desc, /マリオと、ほかの超級職を1つきわめた者だけがなれる/);
  assert.equal(jobHint('rosetta', { look: BOY }), R.masc.hint);
  assert.equal(jobHint('rosetta', { look: GIRL }), JOB_HINTS.rosetta);
  assert.match(JOB_HINTS.rosetta, /女の人/);
  assert.match(R.masc.hint, /男の人/);
  // 看板の 技の 名前だけ かわる（強さ・えんしゅつは おなじ）
  const boy = abilityFor('rosetta_sig', { look: BOY }), girl = abilityFor('rosetta_sig', { look: GIRL });
  assert.equal(girl.name, '流星群とチコの大行進');
  assert.equal(boy.name, 'ギャラクシースターラッシュ');
  assert.deepEqual(boy.effect, girl.effect);
  assert.equal(boy.anim, girl.anim);
  for (const s of [boy.name, boy.desc, boy.cast]) textOk(s, 'rosetta_sig masc');
  assert.deepEqual(checkText(boy.kana).filter((p) => p.kind !== 'kana'), []);
  for (const j of NEW.filter((x) => x !== 'rosetta')) {
    assert.ok(!JOBS[j].masc, `${j}: 男の子も おなじ 名前`);
    assert.equal(jobLabel(j, { job: j, look: BOY }), TREE[j][0]);
  }
});

test('第66回 D班の 職業: なれる じゅんばん（もとの 超級職を きわめると うわさ・ほかの 超級職も 1つ きわめると なれる）', () => {
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

test('第66回 D班の 職業: 強さは 今の 伝説の職業の はんい（超級職より 上）・もとの 職業より 強い・職業の 味', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !R66.has(j)).map(sum);
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
  const mx = (k) => Math.max(...LEGEND_ORDER.filter((j) => !R66.has(j)).map((j) => JOBS[j].mods[k]));
  // き術師は いちばん 素早い・大王は いちばん 力が 強い（家族の ねがい「力が とても 高い」）
  assert.ok(JOBS.gekka.mods.agi >= mx('agi'));
  assert.ok(JOBS.kappa_king.mods.str >= mx('str'));
  // のぶドラは ドラえもんと おなじ どの 職業の 技も 使いやすい
  assert.equal(JOBS.nobu_dora.versatile, true);
});

// ───────────── 技 ─────────────
test('第66回 D班の 技: 7つ（Lv1〜10）・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 7);
    assert.deepEqual(job.learn.map(([l]) => l), [1, 2, 3, 5, 7, 8, 10]);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.equal(ABILITIES[sig].target, 'enemies', '看板の 技は 敵全体');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技 3つ いじょう`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a, R66D_ABILITIES[id]);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind));
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(!a.masc || id === 'rosetta_sig', `${id}: 男の子も おなじ`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!BAD.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && (p.target || a.target) === 'allies') assert.ok((p.mult ?? 1) <= ((p.stats || [p.stat]).length > 1 ? 1.35 : 1.4) + 1e-9, a.name);
        if (p.type === 'buff' && p.stat === 'eva') assert.ok(p.add > 0 && p.add <= 0.45, a.name);
        if (['atbSet', 'status', 'debuff'].includes(p.type) && ['enemy', 'enemies'].includes(p.target || a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
        if (p.status) assert.ok(p.status.chance > 0 && p.status.chance < 1, a.name);
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
  // かっぱの大王の 看板の 技は 運しだい（4つの 花。どれも 敵全体に 大ダメージ）
  const kk = ABILITIES.kappa_king_sig;
  assert.equal(kk.effect.type, 'random');
  assert.ok(kk.autoRandom);
  assert.equal(kk.effect.options.length, 4);
  for (const o of kk.effect.options) {
    const a = ABILITIES[o];
    mine.add(o);
    assert.ok(a.hidden && a.job === 'kappa_king' && a.target === 'enemies' && a.mp === 0, o);
    assert.equal(partsOf(a.effect)[0].type, 'phys');
    assert.ok(partsOf(a.effect)[0].mult >= 2.2, o);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, o);
  }
  assert.deepEqual([...mine].sort(), Object.keys(R66D_ABILITIES).sort(), 'abilities-r66d.js の 技は ぜんぶ どれかの 職業で 使う');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  const evaSelf = (j) => JOBS[j].learn.some(([, id]) => ABILITIES[id].target === 'self' && partsOf(ABILITIES[id].effect).some((p) => p.stat === 'eva'));
  assert.ok(evaSelf('gekka'), 'き術師: すがたを 消して かわす');
  assert.ok(JOBS.gekka.learn.filter(([, id]) => /トランプ/.test(ABILITIES[id].name + ABILITIES[id].desc)).length >= 3, 'き術師: トランプの 技');
  assert.ok(JOBS.nobu_dora.learn.every(([, id]) => /〜！|ひみつ道具/.test(ABILITIES[id].cast + ABILITIES[id].desc)), 'のぶドラ: ひみつ道具を 出す');
  assert.ok(has('kappa_king', (p) => p.type === 'phys' && p.mult >= 3.2), '大王: 大きな はり手');
  assert.ok(JOBS.kappa_king.learn.filter(([, id]) => /花/.test(ABILITIES[id].name + ABILITIES[id].cast)).length >= 3, '大王: 頭の 花');
  assert.ok(JOBS.truth_gate.learn.filter(([, id]) => /れん成|手を合わせ/.test(ABILITIES[id].name + ABILITIES[id].desc + ABILITIES[id].cast)).length >= 5, '真理: 手を 合わせて 作りかえる');
  assert.ok(has('truth_gate', (p) => p.type === 'barrier'), '真理: とりでの かべ');
  assert.ok(JOBS.rosetta.learn.filter(([, id]) => /チコ|流れ星|星/.test(ABILITIES[id].name + ABILITIES[id].desc)).length >= 5, 'ロゼッタ: 流れ星と チコ');
});

test('第66回 D班の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
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
      if (id === 'nobu_dora_sig') assert.ok(me.buffs.atk && m.buffs.def, '仲間の 攻撃力と 守備力');
      if (id === 'rosetta_sig') assert.ok(me.buffs.agi && m.buffs.agi, '仲間の 素早さ');
      if (id === 'truth_gate_sig' || id === 'tg_toride') assert.ok(me.barrier > 0 && m.barrier > 0, `${id}: 光の かべ`);
      if (id === 'gx_kieru') assert.ok(me.buffs.eva?.add > 0, 'すがたを 消す');
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
test('第66回 D班の ひらめき技: 5つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66D_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66D).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66D_ABILITIES[id].job === j).length, 2, j);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id) && !(id in R66D_ABILITIES)).map(([, a]) => a.anim));
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
test('第66回 D班の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（まぼろしの 倍率・師しょうの ことば）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    const fromTags = JOBS[TREE[j][1]].tags.filter((x) => x !== 'work' && x !== 'guard');
    // もとの 職業の タグを のこす（ロゼッタは べつの 人なので 師しょう だけ）
    assert.ok(fromTags.filter((t) => JOBS[j].tags.includes(t)).length >= (j === 'rosetta' ? 1 : 2), `${j}: もとの 職業の タグ`);
    assert.ok(JOBS[j].tags.includes('master') || j === 'gekka', `${j}: 師しょう`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練（一・二・三の試練の 倍率）
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
    assert.ok(!BAD.test(TRIAL_WORDS[j]), j);
    // 転職の ひとこと
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.equal(j in JOB_SAY_MASC, j === 'rosetta');
    for (const [, id] of JOBS[j].learn) if (id !== 'rosetta_sig') assert.equal(abilityFor(id, { job: j, look: BOY }), ABILITIES[id], `${id}: 男の子でも おなじ`);
  }
  // ギャラクシーマリオの ひとこと・師しょうの ことば
  textOk(JOB_SAY_MASC.rosetta, 'rosetta masc');
  assert.ok(JOB_SAY_MASC.rosetta.length <= 24);
  assert.ok(jobDoneText('ケン', 'ギャラクシーマリオ', [], 'rosetta', true).endsWith(JOB_SAY_MASC.rosetta));
  textOk(TRIAL_WORDS_MASC.rosetta, 'rosetta masc');
  assert.equal(trialWords('rosetta', { look: BOY }), TRIAL_WORDS_MASC.rosetta);
  assert.equal(trialWords('rosetta', { look: GIRL }), TRIAL_WORDS.rosetta);
  assert.equal(masterName('rosetta', { job: 'rosetta', look: BOY }), 'ギャラクシーマリオの師しょう');
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

test('第66回 D班の 絵: 5つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・もちもの・古い え・ギャラクシーマリオ', () => {
  assert.deepEqual(R66D_JOBS, NEW);
  for (const j of NEW) assert.ok(R66D_OUTFIT[j] && R66D_BODY[j] && R66D_OLD_LOOK[j] && (R66D_HAT[j] || R66D_BODY_HAT[j] || j === 'truth_gate'), j);
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
    // オーラ（もとの 超級職より 上の ランク）
    assert.ok(jobBody(job).aura || R66D_BODY[job].aura, job);
    assert.equal(masc33(job, false), job === 'rosetta' ? R66D_MASC.rosetta : null);
    assert.equal(masc33(job, true), null);
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 月下のき術師: 白い スーツ・夜空いろの マントの うら・シルクハット・トランプじゅう
  const G = outfitOf(Lk, 'gekka', 'cloth', false);
  assert.equal(G.kind, 'suit');
  assert.ok(G.cape);
  assert.equal(G.body.prop, 'cardgun33');
  assert.equal(headOf(null, 'gekka', 'cloth', G).kind, 'silk33');
  // のぶドラ・かっぱの大王: よろいでも のこる フード・頭の 花
  assert.equal(headOf(null, 'nobu_dora', 'iron_armor', outfitOf(Lk, 'nobu_dora', 'iron_armor', false)).kind, 'robohood26');
  assert.equal(headOf(null, 'kappa_king', 'iron_armor', outfitOf(Lk, 'kappa_king', 'iron_armor', false)).kind, 'flower26');
  assert.ok(outfitOf(Lk, 'kappa_king', 'cloth', false).cape, '大王の マント');
  // 真理のとびらをひらく者: はがねの うで（よろいでも のこる）
  assert.ok(outfitOf(Lk, 'truth_gate', 'iron_armor', false).body.mech33);
  // ロゼッタ: 水色の ドレス・王冠・星の つえ。男の子は 赤い ぼうしと 夜空いろの マント
  const R = outfitOf(Lk, 'rosetta', 'cloth', true);
  assert.equal(R.kind, 'dress');
  assert.equal(R.body.prop, 'scepter40');
  assert.equal(headOf(null, 'rosetta', 'cloth', R).kind, 'crown43j');
  const M = outfitOf(Lk, 'rosetta', 'cloth', false);
  assert.equal(M.kind, 'shirt');
  assert.ok(M.cape);
  assert.equal(headOf(null, 'rosetta', 'cloth', M).kind, 'cap43j');
  for (const dir of DIRS) {
    assert.notEqual(key(paintHero({ body: 0, style: 'short' }, 'rosetta', undefined, dir, 0, 4)), key(paintHero({ body: 1, style: 'short' }, 'rosetta', undefined, dir, 0, 4)), '男女で ちがう え');
    assert.notEqual(key(paintHero({ body: 0, style: 'short' }, 'rosetta', undefined, dir, 0, 4)), key(paintHero({ body: 0, style: 'short' }, 'mario', undefined, dir, 0, 4)), 'マリオと ちがう え');
  }
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第66回 D班の えんしゅつ: 看板の 技・大事な 技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of [...Object.keys(R66D_ABILITIES), ...Object.keys(HIRA_R66D_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R66D_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R66D_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R66D_SFX).sort(), [...R66D_ANIMS].sort());
  assert.deepEqual(Object.keys(R66D_HIT).sort(), [...R66D_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66D_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  // みかたに かける 技は 前から ある えんしゅつ（この ファイルの えんしゅつは 敵に あたる 技だけ）
  for (const id of Object.keys(R66D_ABILITIES)) {
    const a = ABILITIES[id];
    if (R66D_ANIMS.has(a.anim)) assert.ok(['enemy', 'enemies'].includes(a.target), `${id}: 敵に あたる 技`);
  }
  // 職業ごとに 看板の 技の ほかに 大事な 技の えんしゅつが 2つ いじょう
  for (const j of NEW) assert.ok(JOBS[j].learn.filter(([, id]) => R66D_ANIMS.has(ABILITIES[id].anim) && id !== `${j}_sig`).length >= 2, j);
  for (const k of Object.keys(R66D_FINE)) assert.ok(k.startsWith('r66d') && !(k in R43J_FINE) && !(k in R41A_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R66D_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66D_HIT\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66dFx\(this, anim/);
  assert.match(src, /Object\.assign\(FINE, R66D_FINE\)/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66D_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR66dFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R66D_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200, 2400]) R66D_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      // 2.4びょう いないで おわる
      for (const p of fx.parts) assert.ok((p.delay || 0) + (p.life || 600) <= 2400, `${anim}: ${p.kind} ${(p.delay || 0) + p.life}`);
    }
  }
  assert.equal(playR66dFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r66d.js', import.meta.url), 'utf8')), '文字は 出さない');
});
