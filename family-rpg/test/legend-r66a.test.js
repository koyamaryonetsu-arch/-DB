// 第66回 A班（2026年11月）: 4つの 新しい 伝説の 職業（docs/plan-r66-legend.md）
//   ガーディアン＋大神官 → 守りの神 ／ ソードマスター＋魔剣士 → 光と闇の剣神
//   モンスターマスター＋ほかの超級職1つ → ポケモンマスター ／ 大賢者＋ほかの超級職1つ → 千年の大魔法使い
//  ・職業の 木・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・ポケモンマスターの 仲間の 魔物と いっしょの 技（battle-r66a.js の monPal）と、魔物の 力（passive）
//  ・絵（hero-r66a.js）と えんしゅつ（battlefx-r66a.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { LEGEND_R66A_ORDER, LEGEND_R66A_JOBS } from '../public/js/shared/data/jobs-legend-r66a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66A_ABILITIES } from '../public/js/shared/data/abilities-r66a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66A_ABILITIES, HIRAMEKI_R66A } from '../public/js/shared/data/hirameki-r66a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { MONPAL_MAX, monPalsOf, monPalMult } from '../public/js/shared/battle-r66a.js';
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
import { R66A_JOBS, R66A_OUTFIT, R66A_BODY, R66A_HAT, R66A_OLD_LOOK } from '../public/js/client/render/hero-r66a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66A_ANIMS, R66A_SIGS, R66A_HIT, R66A_SFX, R66A_FINE, playR66aFx } from '../public/js/client/render/battlefx-r66a.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['guard_god', 'kenshin', 'poke_master', 'sennen_mage'];
// [名前, もとの 超級職, ほかの 超級職も 1つ いるか]
const TREE = {
  guard_god: ['守りの神', ['guardian', 'high_priest'], false],
  kenshin: ['光と闇の剣神', ['sword_master', 'magic_swordsman'], false],
  poke_master: ['ポケモンマスター', ['monster_master'], true],
  sennen_mage: ['千年の大魔法使い', ['daikenja'], true],
};
const REQ_TEXT = {
  guard_god: 'ガーディアンLv10＋大神官Lv10',
  kenshin: 'ソードマスターLv10＋魔剣士Lv10',
  poke_master: 'モンスターマスターLv10＋ほかの超級職1つLv10',
  sennen_mage: '大賢者Lv10＋ほかの超級職1つLv10',
};
const SIG_NAMES = { guard_god: '守りの神の大結界', kenshin: '光と闇の大剣神斬', poke_master: 'めざせポケモンマスター', sennen_mage: '千年の花の大魔法' };
const BOY = { body: 0 };
// こわい ことば（家族の ねがい）
const SCARY = /殺|死ね|ころす|ころし|血/;
// よみがなに 漢字は 入れない
const KANJI = /[\u4e00-\u9fff]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, deadAllies: /仲間全員/ };
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
test('第66回 A の 職業: 4つの 伝説の職業（tier 3）・ならび・うわさ・文字・乗り物', () => {
  assert.deepEqual(LEGEND_R66A_ORDER, NEW);
  assert.deepEqual(Object.keys(LEGEND_R66A_JOBS).sort(), [...NEW].sort());
  for (const id of NEW) {
    const j = JOBS[id], [name, from, sup] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, 3);
    assert.deepEqual(j.req, from);
    assert.equal(j.reqSuper || 0, sup ? 1 : 0, '1つだけの ときは ほかの 超級職も 1つ（竜魔人と おなじ）');
    assert.ok(!j.reqAlt && j.body === undefined);
    for (const r of from) assert.ok(SUPER_ORDER.includes(r), `${id}: ${r} は 超級職`);
    assert.ok(LEGEND_ORDER.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.equal(jobReqText(id), REQ_TEXT[id]);
    assert.ok(JOB_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc + JOB_HINTS[id]), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc, '男の子も 女の子も おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    // 乗り物は もとの 職業の どれかと おなじ（どの 職業にも 乗り物が いる きまり）
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && from.some((f) => v.jobs.includes(f))), `${id} の 乗り物`);
  }
  // 第41回 A の あと・A班の ならび
  const at = LEGEND_ORDER.indexOf('guard_god');
  assert.ok(at > LEGEND_ORDER.indexOf('hall_of_fame'));
  assert.deepEqual(LEGEND_ORDER.slice(at, at + 4), NEW);
  assert.ok(VEHICLES.pegasus.jobs.includes('guard_god') && VEHICLES.baby_dragon.jobs.includes('kenshin') && VEHICLES.slime.jobs.includes('poke_master') && VEHICLES.book.jobs.includes('sennen_mage'));
  // 新しい ファイルは 漢字の きまりの 中
  const files = gameFiles();
  for (const f of ['jobs-legend-r66a.js', 'abilities-r66a.js', 'hirameki-r66a.js', 'battle-r66a.js', 'battlefx-r66a.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第66回 A の 職業: なれる じゅんばん（もとの 超級職を 1つ きわめると うわさ・ぜんぶ〈と ほかの 超級職 1つ〉で なれる）', () => {
  for (const id of NEW) {
    const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
    const [, from, sup] = TREE[id];
    assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
    master(c, from[0]);
    assert.equal(jobKnown(c, id), true, `${from[0]} を きわめると うわさ`);
    assert.equal(jobUnlocked(c, id), false);
    if (from.length > 1) {
      // 2つの 超級職: ほかの 超級職では かわりに ならない
      master(c, 'god_hand', 'archmage');
      assert.equal(jobUnlocked(c, id), false, 'もう1つの 超級職が いる');
      master(c, from[1]);
    }
    if (sup) master(c, 'archmage');
    assert.equal(jobUnlocked(c, id), true);
    assert.equal(changeJob(c, id).ok, true);
    assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
  }
});

test('第66回 A の 職業: 強さは 今の 伝説の職業の はんい・もとの 職業より 強い・職業の 味', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !NEW.includes(j) && !['new_kawaii', 'smap', 'oogosho', 'five_star_chef', 'souri', 'kaichou', 'hatarakikata', 'ano_kata', 'gekka', 'nobu_dora', 'kappa_king', 'truth_gate', 'rosetta'].includes(j)).map(sum);
  const sup = SUPER_ORDER.map(sum);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legends) && sum(j) <= Math.max(...legends), `${j}: ${sum(j).toFixed(2)}`);
    for (const f of TREE[j][1]) {
      assert.ok(sum(j) > sum(f) + 0.5, `${j}: ${f} より 強い`);
      // もとの 職業の 武器は ぜんぶ 使える
      for (const w of JOBS[f].weapons) assert.ok(JOBS[j].weapons.includes(w), `${j}: ${w}`);
    }
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.ok(JOBS[j].weapons.length >= 2);
  }
  const top = (k) => Math.max(...LEGEND_ORDER.filter((j) => !NEW.includes(j)).map((j) => JOBS[j].mods[k]));
  // 守りの神: いちばん かたい（守備力は 伝説で いちばん）・回復も 高い
  assert.ok(JOBS.guard_god.mods.def > top('def') && JOBS.guard_god.mods.heal >= 1.6);
  // 光と闇の剣神: 力が 高い・魔力も 高め（闇の剣・光の剣）
  assert.ok(JOBS.kenshin.mods.str >= 1.85 && JOBS.kenshin.mods.mag >= 1.4);
  // ポケモンマスター: 魔物が 仲間に なりやすく、仲間の 魔物も モンスターマスターより 強く なる
  assert.ok(JOBS.poke_master.passive.befriend > JOBS.monster_master.passive.befriend);
  assert.ok(JOBS.poke_master.passive.monsterBoost > JOBS.monster_master.passive.monsterBoost);
  assert.ok(JOBS.poke_master.passive.monsterBoost <= 1.25);
  // 千年の大魔法使い: 呪文の 力が とても 高い（魔力は 伝説で いちばん）
  assert.ok(JOBS.sennen_mage.mods.mag > top('mag') && JOBS.sennen_mage.mods.mp >= 1.75);
  assert.match(JOBS.sennen_mage.desc, /エルフ/);
  assert.match(JOBS.sennen_mage.desc, /花畑/);
});

// ───────────── 技 ─────────────
test('第66回 A の 技: 7こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 7);
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
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
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
  assert.deepEqual([...mine].sort(), Object.keys(R66A_ABILITIES).sort(), 'abilities-r66a.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some(f));
  assert.ok(has('guard_god', (p) => p.type === 'cover' && p.all), '守りの神: 仲間を かばう');
  assert.ok(has('guard_god', (p) => p.type === 'heal') && has('guard_god', (p) => p.type === 'revive'), '守りの神: 回復も する');
  assert.ok(has('guard_god', (p) => p.atkFrom === 'def'), '守りの神: たてで なぐる（守備力で 強く なる）');
  assert.ok(has('kenshin', (p) => p.element === 'light') && has('kenshin', (p) => p.element === 'dark' || p.type === 'drainHp'), '剣神: 光の 剣と 闇の 剣');
  assert.deepEqual(partsOf(ABILITIES.kenshin_sig.effect).map((p) => p.element), ['light', 'dark'], '大剣神斬は 光と 闇');
  assert.ok(JOBS.poke_master.learn.filter(([, id]) => /ボール/.test(ABILITIES[id].name)).length >= 2, 'ポケモンマスター: ボールの 技');
  assert.ok(has('poke_master', (p) => p.monPal > 0) && partsOf(ABILITIES.poke_master_sig.effect).some((p) => p.monPal > 0), 'ポケモンマスター: 魔物との 合体技');
  assert.ok(JOBS.sennen_mage.learn.filter(([, id]) => ABILITIES[id].kind === 'spell').length >= 6, '千年の大魔法使い: ほとんど 呪文');
  assert.ok(JOBS.sennen_mage.learn.some(([, id]) => /花畑/.test(ABILITIES[id].name)), '千年の大魔法使い: 花畑を 出す 魔法');
  assert.ok(partsOf(ABILITIES.sennen_mage_sig.effect).some((p) => p.type === 'magic' && p.element === 'void'));
});

test('第66回 A の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      if (a.target === 'deadAllies') { m.hp = 0; m.alive = false; }
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (id === 'guard_god_sig') assert.ok(me.buffs.def && m.buffs.def, '大結界: 仲間の 守備力');
      if (id === 'gg_kabau') assert.equal(me.cover?.target, 'all', 'みんなを かばう');
      if (id === 'gg_inochi') assert.ok(m.alive && m.hp > 0, '命のいのり: 生き返る');
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

test('第66回 A: 仲間の 魔物と いっしょの 技（monPal）は 仲間の 魔物が 多いほど 強い（3体まで）', () => {
  const dmgOf = (mons, id = 'pk_issho', seed = 3) => {
    const { b, me, m } = setup('poke_master', { seed, enemies: ['rockman'] });
    // もう1人の 仲間を 魔物に する（mons: 0 か 1）
    m.mon = mons ? 'slime' : null;
    b.enemies[0].dfn = 0;
    readyUp(b, me);
    b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1');
    const act = runUntilAct(b, me.id);
    return { dmg: act.results.filter((x) => x.dmg > 0).reduce((s, x) => s + x.dmg, 0), act, b, me };
  };
  let w0 = 0, w1 = 0;
  for (let s = 1; s <= 6; s++) { w0 += dmgOf(0, 'pk_issho', s).dmg; w1 += dmgOf(1, 'pk_issho', s).dmg; }
  assert.ok(w1 > w0 * 1.12, `魔物 1体で 強く なる ${w0} → ${w1}`);
  const one = dmgOf(1);
  assert.ok(one.act.lines.some((l) => l.includes('仲間の魔物1体も、いっしょに攻撃！')));
  for (const l of one.act.lines) textOk(l, 'monPal');
  assert.ok(!dmgOf(0).act.lines.some((l) => l.includes('仲間の魔物')), '魔物が いない ときは ふつう');
  // 数の しき（自分は 数えない・たおれた 魔物は 数えない・3体まで）
  const { b, me, m } = setup('poke_master');
  m.mon = 'slime';
  assert.equal(monPalsOf(b, me), 1);
  assert.equal(monPalsOf(b, m), 0, '自分は 数えない');
  m.alive = false;
  assert.equal(monPalsOf(b, me), 0);
  assert.equal(monPalMult(b, me, 0.25), 1);
  m.alive = true;
  assert.equal(monPalMult(b, me, 0.25), 1.25);
  assert.equal(MONPAL_MAX, 3);
  assert.equal(monPalsOf(null, me), 0);
  // 看板の 技も 魔物と いっしょ
  assert.ok(dmgOf(1, 'poke_master_sig').act.lines.some((l) => l.includes('いっしょに攻撃')));
  // battle.js の つなぎ（足すだけ）
  const src = readFileSync(new URL('../public/js/shared/battle.js', import.meta.url), 'utf8');
  assert.match(src, /if \(eff\.monPal\) \{ r66aMonPal\(this, c, a, cmd, ev, powMult, targets\); break; \}/);
});

// ───────────── ひらめき技 ─────────────
test('第66回 A の ひらめき技: 4つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66A).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66A_ABILITIES[id].job === j).length, 2, j);
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
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) {
      assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    }
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = TREE[a.job][1][0];
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
test('第66回 A の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（まぼろしの 倍率 3つ・師しょうの ことば）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    // もとの 超級職の タグを どれも 1つは うけつぐ
    for (const f of TREE[j][1]) assert.ok(JOBS[f].tags.some((t) => JOBS[j].tags.includes(t)), `${j}: ${f} の タグ`);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練（三の試練まで）
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32, `${j}: みじかく`);
    textOk(masterName(j), j);
    assert.ok(!SCARY.test(TRIAL_WORDS[j]), j);
    // 転職の ひとこと（男の子 むけは ない）
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    for (const [, id] of JOBS[j].learn) assert.equal(abilityFor(id, { job: j, look: BOY }), ABILITIES[id], `${id}: 男の子でも おなじ`);
  }
  assert.ok(JOBS.poke_master.tags.includes('monster') && JOBS.kenshin.tags.includes('light') && JOBS.kenshin.tags.includes('dark'));
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

test('第66回 A の 絵: 4つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・からだ・古い え', () => {
  assert.deepEqual(R66A_JOBS, NEW);
  for (const j of NEW) assert.ok(R66A_OUTFIT[j] && R66A_BODY[j] && R66A_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of TREE[job][1]) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
        }
      }
    }
    assert.equal(masc33(job, false), null, '男の子も おなじ すがた');
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // 守りの神: 白金の よろい・白い マント・白い はね・金の きらきら・金の つばさの かぶと
  const G = outfitOf(Lk, 'guard_god', 'cloth', false);
  assert.equal(G.kind, 'plate');
  assert.ok(G.cape && G.wings, 'マントと はね');
  assert.equal(G.body.aura, 'hof');
  assert.equal(headOf(null, 'guard_god', 'cloth', G).kind, 'winged');
  assert.ok(outfitOf(Lk, 'guard_god', 'iron_armor', true).wings, 'よろいでも はね');
  // 光と闇の剣神: むらさきの よろい・金の オーラ・サークレット
  const K = outfitOf(Lk, 'kenshin', 'cloth', true);
  assert.equal(K.kind, 'plate');
  assert.equal(K.body.aura, 'gold');
  assert.equal(headOf(null, 'kenshin', 'cloth', K).kind, 'circlet');
  // ポケモンマスター: 青い ベスト・赤い 野球ぼう・いなずま
  const P = outfitOf(Lk, 'poke_master', 'cloth', false);
  assert.equal(P.kind, 'vest');
  assert.equal(headOf(null, 'poke_master', 'cloth', P).kind, 'bbcap');
  assert.equal(jobBody('poke_master').spark, true);
  // 千年の大魔法使い: 白い ローブ・白い ツインテール（ぼうしは なし）
  const S = outfitOf(Lk, 'sennen_mage', 'cloth', true);
  assert.equal(S.kind, 'robe');
  assert.deepEqual([S.body.hair, S.body.hcol], ['twin', 'nikawhite']);
  assert.ok(!R66A_HAT.sennen_mage);
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
});

// ───────────── えんしゅつ ─────────────
test('第66回 A の えんしゅつ: 看板の 技・大事な 技の えんしゅつ・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of [...Object.keys(R66A_ABILITIES), ...Object.keys(HIRA_R66A_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R66A_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R66A_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R66A_SFX).sort(), [...R66A_ANIMS].sort());
  assert.deepEqual(Object.keys(R66A_HIT).sort(), [...R66A_ANIMS].sort(), 'ぜんぶ 敵に あたる えんしゅつ');
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  // みかたに かける 技は 前から ある えんしゅつ（battle.js の PARTY_ANIMS は さわらない）
  for (const id of Object.keys(R66A_ABILITIES)) {
    const a = ABILITIES[id];
    if (['self', 'allies', 'deadAllies'].includes(a.target)) assert.ok(!R66A_ANIMS.has(a.anim), `${id}: みかたの えんしゅつ`);
    if (['enemy', 'enemies'].includes(a.target)) assert.ok(R66A_ANIMS.has(a.anim), `${id}: 敵に あたる えんしゅつ`);
  }
  for (const k of Object.keys(R66A_FINE)) assert.ok(k.startsWith('r66a') && !(k in JOB7_FINE) && !(k in JOB8_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R66A_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66A_HIT\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66aFx\(this, anim/);
  assert.match(src, /Object\.assign\(FINE, R66A_FINE\)/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const crit of [false, true]) {
        const fx = new Effects();
        assert.equal(playR66aFx(fx, anim, targets, null, { crit }, BW, BH), true, anim);
        fx.play(anim, targets, null, { crit });
        assert.ok(fx.parts.length > 0, anim);
        for (const p of fx.parts) {
          if (!R66A_FINE[p.kind]) continue;
          for (const age of [0, 200, 600, 1200]) R66A_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
        }
        // 2.2びょう いないに おわる
        let t = 0;
        while (fx.parts.length && t < 4000) { fx.update(16); t += 16; }
        assert.ok(t <= 2200, `${anim}: ${t}ms`);
      }
    }
  }
  assert.equal(playR66aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR66aFx(new Effects(), 'kenshin_sig', []), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r66a.js', import.meta.url), 'utf8')), '文字は 出さない');
});
