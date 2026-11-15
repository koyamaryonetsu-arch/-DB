// 第85回 A班: スレイヤーズの 系統（ためて うつ 大砲）のテスト
// 大食いの旅の魔道士（上級職。魔法使い ＋ 料理人）→ 天才美少女魔道士リナ（超級職。男の子は 天才魔道士）→ ドラまた（伝説。リナ ＋ ほかの 超級職 1つ）
// しくみ: となえる → 大砲の 呪文（ドラグ・スレイブ・ラグナ・ブレード・ギガ・スレイブ）・となえた あとの 呪文が 強く なる・早口・
//         ギガ・スレイブ（のこりの MP 全部・上限）・ラグナ・ブレード（ききにくいを むし）・フレア・アロー・とう賊たいじ（お金）・定食（HP と MP）
// （docs/plan-jobs-r79.md の 10-3・docs/plan-r85-jobs-a.md）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R85A, R85A_ORDERS, R85A_JOBS } from '../public/js/shared/data/jobs-r85a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R85A_ABILITIES } from '../public/js/shared/data/abilities-r85a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R85A_ABILITIES, HIRAMEKI_R85A } from '../public/js/shared/data/hirameki-r85a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, TRIAL_WORDS_MASC, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { bigDualMult, CHANT_LEFT, CHANT_BOOST, HAYAKUCHI_ATB, GIGA_PER, GIGA_CAP, GIGA_BOSS, ENEMY_BIG, LOCK_REASON, R85A_AI, isBig, chanting, r85aLocked, gigaCap, r85aPub } from '../public/js/shared/battle-r85a.js';
import { jobLabel, jobFor, jobHint } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, canUse } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R85A_JOBS as LOOK_JOBS, R85A_OUTFIT, R85A_BODY, R85A_HAT, R85A_OLD_LOOK, AURA85A } from '../public/js/client/render/hero-r85a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R85A_ANIMS, R85A_SIGS, R85A_HIT, R85A_SFX, PARTY_ANIMS_R85A, playR85aFx } from '../public/js/client/render/battlefx-r85a.js';
import { r85aMarks, r85aRow, chantReady } from '../public/js/client/battle-r85a.js';
import { r84bMarks } from '../public/js/client/battle-r84b.js';
import { formOf } from '../public/js/shared/battle-r84b.js';
import { reiLeft } from '../public/js/shared/battle-r84a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['tabi_madoshi', 'lina', 'doramata'];
// [名前, 段, なり方]
const TREE = {
  tabi_madoshi: ['大食いの旅の魔道士', 1, ['mage', 'cook']],
  lina: ['天才美少女魔道士リナ', 2, ['tabi_madoshi']],
  doramata: ['ドラまた', 3, ['lina']],
};
const SIG_NAMES = { tabi_madoshi: 'フレア・アロー', lina: 'ドラグ・スレイブ', doramata: 'ギガ・スレイブ' };
const BIGS = ['lina_sig', 'dr_ragna', 'doramata_sig'];
const SUM_RANGE = { 1: [6.65, 8.0], 2: [7.75, 9.05], 3: [9.3, 10.2] };
const BOY = { body: 0 };
const GIRL = { body: 1 };
const SCARY = /殺|死ね|ころす|ころし|血|いじめ/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, group: /同じ種類の敵/, allies: /仲間全員/, ally: /仲間1人/, self: /自分/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'archmage');
};

// enemies … 魔物の 種類。act … 敵の 行動（なし ＝ 何もしない）
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, act = 'm_nothing', extra = [], boss = false, hooks, look = GIRL } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'mage', look });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job, ...extra);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }], enemies, canFlee: true, boss, hooks });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: act }];
    e.hp = e.maxHp = 50000;
  }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
const use = (b, me, cmd) => {
  assert.ok(readyUp(b, me));
  const r = b.command(me.id, { target: b.enemies.find((e) => e.alive)?.id, ...cmd }, 's1');
  assert.equal(r.ok, true, `${cmd.id} ${r.reason || ''}`);
  return runUntilAct(b, me.id);
};
const defend = (b, me) => {
  assert.ok(readyUp(b, me));
  assert.equal(b.command(me.id, { type: 'defend' }, 's1').ok, true);
};
const dmgOf = (act) => (act.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
const avg = (xs) => xs.reduce((a, x) => a + x, 0) / xs.length;

// ───────────── 職業の 木 ─────────────
test('第85回 A の 職業: 上級職・超級職・伝説の 3だん（魔法使い ＋ 料理人から）・ならび・うわさ・文字', () => {
  assert.deepEqual(R85A_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R85A), NEW);
  const orders = [null, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R85A_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.equal(j.family, 'magic');
    assert.deepEqual(j.weapons, ['staff', 'dagger']);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    if (tier >= 2) textOk(JOB_HINTS[id], id);
  }
  assert.deepEqual(R85A_ORDERS[0], [], '基本職は ない（今の 職業から 枝分かれ）');
  assert.equal(jobReqText('tabi_madoshi'), '魔法使いLv10＋料理人Lv10');
  assert.equal(jobReqText('doramata'), '天才美少女魔道士リナLv10＋ほかの超級職1つLv10');
  const files = gameFiles();
  for (const f of ['jobs-r85a.js', 'abilities-r85a.js', 'hirameki-r85a.js', 'shared/battle-r85a.js', 'client/battle-r85a.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第85回 A の 職業: 男の子の リナは「天才魔道士」（ももの姫 ／ 配管工 と おなじ やり方）・ほかの 2つは おなじ 名前', () => {
  assert.equal(jobLabel('lina', { job: 'lina', look: GIRL }), '天才美少女魔道士リナ');
  assert.equal(jobLabel('lina', { job: 'lina', look: BOY }), '天才魔道士');
  const m = jobFor('lina', { look: BOY });
  assert.ok(m.desc.includes('男の子') && !m.desc.includes('女の子'));
  assert.ok(jobHint('lina', { look: BOY }).includes('男の子'));
  assert.equal(jobHint('lina', { look: GIRL }), JOB_HINTS.lina);
  for (const s of [m.name, m.short, m.desc, JOBS.lina.masc.hint]) textOk(s, 'masc');
  for (const id of ['tabi_madoshi', 'doramata']) {
    assert.ok(!JOBS[id].masc, id);
    assert.equal(jobLabel(id, { job: id, look: BOY }), JOBS[id].name);
  }
  // 男の子の ひとこと・試練の ことば・技の セリフ（あたし → おれ など）
  for (const id of NEW) textOk(JOB_SAY_MASC[id], id);
  assert.ok(JOB_SAY_MASC.lina.includes('天才魔道士') && !JOB_SAY_MASC.lina.includes('美少女'));
  textOk(TRIAL_WORDS_MASC.doramata, 'doramata');
  for (const id of ['tm_touzoku', 'dr_tokumori', 'dr_matagu']) {
    const a = ABILITIES[id];
    assert.ok(a.masc?.cast, id);
    textOk(a.masc.cast, id);
    assert.notEqual(abilityFor(id, { look: BOY }).cast, a.cast);
    assert.equal(abilityFor(id, { look: GIRL }).cast, a.cast);
  }
});

test('第85回 A の 職業: なれる じゅんばん（魔法使いと 料理人 → 旅の魔道士 → リナ → 伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'mage' });
  master(c, 'mage');
  assert.equal(jobUnlocked(c, 'tabi_madoshi'), false, '料理人も いる');
  master(c, 'cook');
  assert.equal(jobUnlocked(c, 'tabi_madoshi'), true);
  assert.equal(jobUnlocked(c, 'lina'), false);
  master(c, 'tabi_madoshi');
  assert.equal(jobUnlocked(c, 'lina'), true);
  assert.equal(jobKnown(c, 'doramata'), false, '伝説は はじめ ひみつ');
  master(c, 'lina');
  assert.equal(jobKnown(c, 'doramata'), true);
  assert.equal(jobUnlocked(c, 'doramata'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'god_hand');
  assert.equal(jobUnlocked(c, 'doramata'), true);
  assert.equal(changeJob(c, 'doramata').ok, true);
  assert.ok(learnedAbilities(c).includes('dr_zelas'));
});

test('第85回 A の 職業: 能力の 合計（設計の 7.3・8.4・9.7）・段の はんい・魔力が いちばん 高い・伝説の 上限を こえない・お金と 早口', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  NEW.forEach((j, i) => {
    const [lo, hi] = SUM_RANGE[JOBS[j].tier];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    if (i) assert.ok(sum(j) > sum(NEW[i - 1]) + 0.4, `${j} は 下の 段より 強い`);
    const m = JOBS[j].mods;
    assert.ok(m.mag >= Math.max(...Object.values(m)) - 1e-9, `${j}: 魔法の 職業（魔力）`);
    assert.ok(m.mag > m.str, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3 + 1e-9);
  });
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [7.3, 8.4, 9.7]);
  // 伝説の 魔力・MP・素早さは 今の いちばん（千年の大魔法使い・月下のき術師）を こえない
  const legends = LEGEND_ORDER.filter((j) => j !== 'doramata');
  for (const k of ['mag', 'mp', 'agi']) assert.ok(JOBS.doramata.mods[k] <= Math.max(...legends.map((j) => JOBS[j].mods[k])), k);
  assert.ok(JOBS.doramata.mods.mag < JOBS.sennen_mage.mods.mag);
  // 早口（伝説だけ）・お金が ふえる（今 ある 職業と おなじ くらい。足し算に ならない ＝ world/battles.js は いちばん 大きい 倍率）
  assert.equal(JOBS.doramata.passive.hayakuchi, 0.25);
  assert.equal(JOBS.doramata.passive.gold, 1.2);
  assert.ok(!JOBS.lina.passive && !JOBS.tabi_madoshi.passive);
  const battles = readFileSync(new URL('../public/js/shared/world/battles.js', import.meta.url), 'utf8');
  assert.match(battles, /Math\.max\(1, \.\.\.Object\.values\(ctx\.actorMap\)\.map\(\(w\) => JOBS\[w\?\.char\?\.job\]\?\.passive\?\.gold/);
});

// ───────────── 技 ─────────────
test('第85回 A の 技: 6こ（伝説は Lv1・3・5・7・8・10）・看板の 技・せつめい・文字・名前が かぶらない', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    assert.deepEqual(job.learn.map(([l]) => l), JOBS[j].tier === 3 ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 5, 7, 10]);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg');
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技 3つ いじょう`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['spell', 'skill'].includes(a.kind), id);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) if (p.type === 'buff' && p.mult) assert.ok(p.mult <= 1.3 + 1e-9, a.name);
      // 攻撃の 呪文は 呪文（呪文ふうじで うてない）
      if (partsOf(a.effect).some((p) => p.type === 'magic')) assert.equal(a.kind, 'spell', id);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R85A_ABILITIES).sort());
  // 設計の 技の 名前（10-3 の 表。かえた 名前は docs/plan-r85-jobs-a.md）
  assert.deepEqual(JOBS.tabi_madoshi.learn.map(([, id]) => ABILITIES[id].name), ['ファイアーボール', '大もり定食', 'ライティング', 'ディグ・ボルト', 'とう賊たいじ', 'フレア・アロー']);
  assert.deepEqual(JOBS.lina.learn.map(([, id]) => ABILITIES[id].name), ['エルメキア・ランス', 'となえる', 'ブラム・ブレイザー', 'レイ・ウイング', 'リカバリィ', 'ドラグ・スレイブ']);
  assert.deepEqual(JOBS.doramata.learn.map(([, id]) => ABILITIES[id].name), ['ゼラス・ブリッド', 'ぞうふくの石', 'ラグナ・ブレード', '特もり定食', 'ドラゴンもまたいで通る', 'ギガ・スレイブ']);
  // 大砲の 呪文（となえて から）は 3つ。今の どの 呪文より 強い（ギガ・スレイブは MP しだい）
  assert.deepEqual(Object.keys(R85A_ABILITIES).filter((id) => isBig(ABILITIES[id])).sort(), [...BIGS].sort());
  const mid = (a) => (a.effect.base[0] + a.effect.base[1]) / 2;
  // （幻の職業〈tier 4〉の 呪文も ふくめて）
  const others = Object.entries(ABILITIES).filter(([id, a]) => a.effect?.type === 'magic' && a.job && !isBig(a) && JOBS[a.job] && !a.monster);
  for (const id of ['lina_sig', 'dr_ragna']) {
    const a = ABILITIES[id];
    const same = others.filter(([, o]) => (a.target === 'enemy' ? o.target === 'enemy' : o.target !== 'enemy'));
    assert.ok(mid(a) > Math.max(...same.map(([, o]) => mid(o))), `${a.name} は 今の どの 呪文より 強い`);
  }
  // 「盗ぞくいじめ」は やさしい 名前（いじめる と 言わない）
  assert.equal(ABILITIES.tm_touzoku.name, 'とう賊たいじ');
  // 定食は MP が いらない（大もり）か 少し（特もり）・オートの ふつうの 回復には 入れない
  assert.equal(ABILITIES.tm_oomori.mp, 0);
  for (const id of ['tm_oomori', 'dr_tokumori']) {
    const ps = partsOf(ABILITIES[id].effect);
    assert.ok(ps.some((p) => p.type === 'heal') && ps.some((p) => p.type === 'mpHeal') && ABILITIES[id].noAuto, id);
  }
});

test('第85回 A の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'] });
      if (isBig(ABILITIES[id])) use(b, me, { type: 'ability', id: 'ln_tonaeru' });
      const act = use(b, me, { type: 'ability', id, target: ABILITIES[id].target === 'ally' ? me.id : undefined });
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった') || l.includes('形にならなかった')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(ABILITIES[id]) === 'dmg') assert.ok(dmgOf(act) > 0, `${id} の ダメージ: ${act.lines}`);
    }
    const s = setup(j, { seed: 7, enemies: ['rockman', 'rockman', 'rockman'], boss: true });
    s.me.abilities = learnedAbilities(s.c);
    let used = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      assert.ok(!(cmd.type === 'ability' && isBig(ABILITIES[cmd.id])), `${j}: となえて いないのに 大砲を えらんだ`);
      if (cmd.type === 'ability') used++;
    }
    assert.ok(used > 0, `${j}: オートでも 技を 使う`);
  }
});

// ───────────── となえる ─────────────
test('第85回 A の となえる: となえて いないと 大砲は えらべない（理由・オート・画面で うすく）→ となえると うてて、うつと 消える', () => {
  const { b, me } = setup('lina', { enemies: ['rockman', 'rockman'] });
  assert.ok(readyUp(b, me));
  const r = b.command(me.id, { type: 'ability', id: 'lina_sig' }, 's1');
  assert.equal(r.ok, false);
  assert.equal(r.reason, LOCK_REASON);
  textOk(LOCK_REASON, 'reason');
  assert.equal(canUse(b, me, 'lina_sig'), false, 'オートも えらばない');
  assert.equal(r85aLocked(me, ABILITIES.lina_sig), true);
  assert.deepEqual(r85aRow(ABILITIES.lina_sig, pub(me)), { off: true, tag: '<span class="tag muted">となえてから</span>' });
  assert.deepEqual(r85aRow(ABILITIES.ln_elmekia, pub(me)), { off: false, tag: '' }, 'ふつうの 呪文は そのまま');
  assert.equal(pub(me).r85aChant, 0);
  // となえる → 札・うてる
  const ch = use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  assert.equal(ch.r85aChant, me.id);
  for (const l of ch.lines) textOk(l, 'chant');
  assert.ok(chanting(me));
  assert.equal(pub(me).r85aChant, CHANT_LEFT);
  assert.deepEqual(r85aMarks(pub(me)).map((m) => m.text), [`となえ${CHANT_LEFT}`]);
  assert.equal(chantReady(pub(me)), true);
  assert.deepEqual(r85aRow(ABILITIES.lina_sig, pub(me)), { off: false, tag: '' });
  assert.equal(canUse(b, me, 'lina_sig'), true);
  const big = use(b, me, { type: 'ability', id: 'lina_sig' });
  assert.ok(dmgOf(big) > 0 && big.results.filter((x) => x.dmg > 0).length === 2, '敵全体');
  assert.equal(big.r85aChantEnd, me.id);
  assert.ok(!me.r85aChant && !chanting(me), 'うつと 消える');
  assert.equal(pub(me).r85aChant, 0);
  assert.deepEqual(r85aMarks(pub(me)), []);
  assert.equal(b.command(me.id, { type: 'ability', id: 'lina_sig' }, 's1').ok, false);
  // 敵には 札は 出ない（r85aPub は 仲間だけ）
  assert.deepEqual(r85aPub(b.enemies[0]), {});
});

test('第85回 A の となえる: ふつうの 呪文を うつと その 呪文が 強く なって 消える・呪文で ない 行動では 消えない・3回 動くと 消える', () => {
  const plain = [], boosted = [];
  for (let seed = 1; seed <= 16; seed++) {
    const s = setup('lina', { seed });
    plain.push(dmgOf(use(s.b, s.me, { type: 'ability', id: 'ln_elmekia' })));
    const t = setup('lina', { seed });
    use(t.b, t.me, { type: 'ability', id: 'ln_tonaeru' });
    const act = use(t.b, t.me, { type: 'ability', id: 'ln_elmekia' });
    assert.ok(act.lines.some((l) => l.includes('呪文が強くなった')));
    assert.ok(!t.me.r85aChant, 'ふつうの 呪文でも 消える');
    boosted.push(dmgOf(act));
  }
  const ratio = avg(boosted) / avg(plain);
  assert.ok(Math.abs(ratio - CHANT_BOOST) < 0.15, `となえた あとの 呪文 ${ratio.toFixed(2)}倍`);
  // 呪文で ない 行動（特技・身を 守る・回復）では 消えない。3回 動くと 消える
  const { b, me } = setup('lina');
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  use(b, me, { type: 'ability', id: 'ln_raywing' });
  assert.equal(me.r85aChant?.left, 2);
  defend(b, me);
  assert.equal(me.r85aChant?.left, 1, '身を 守るのも 1回の 行動');
  const third = use(b, me, { type: 'ability', id: 'ln_recovery', target: me.id });
  assert.ok(!me.r85aChant, '3回 動いたら 消える');
  assert.ok(third.lines.some((l) => l.includes('となえた力が、消えてしまった')));
  assert.equal(b.command(me.id, { type: 'ability', id: 'lina_sig' }, 's1').ok, false);
  // もう一度 となえると のこりが もどる
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  use(b, me, { type: 'ability', id: 'ln_raywing' });
  const again = use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  assert.ok(again.lines.some((l) => l.includes('となえなおした')));
  assert.equal(me.r85aChant.left, CHANT_LEFT);
});

test('第85回 A の となえる: ねむり・マヒ・呪文ふうじ・たおれると 消える（その 間は 大砲も えらべない）', () => {
  for (const st of ['sleep', 'paralyze', 'silence']) {
    const { b, me } = setup('lina');
    use(b, me, { type: 'ability', id: 'ln_tonaeru' });
    me.status[st] = { turns: 2 };
    assert.equal(chanting(me), false, `${st} の 間は うてない`);
    assert.equal(canUse(b, me, 'lina_sig'), false);
    assert.equal(chantReady(pub(me)), false);
    const ev = runUntilAct(b, me.id) || (readyUp(b, me) && use(b, me, { type: 'attack' }));
    assert.ok(!me.r85aChant, `${st}: 自分の 番で 消える`);
    assert.ok(ev.lines.some((l) => l.includes('となえていた呪文が、消えてしまった')), `${st}: ${ev.lines}`);
  }
  // たおれる
  const { b, me } = setup('lina', { act: 'attack' });
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  me.hp = 1;
  const foe = b.enemies[0];
  foe.atk = 9999;
  for (let i = 0; i < 400 && me.alive; i++) b.tick(50);
  assert.equal(me.alive, false);
  assert.ok(!me.r85aChant, 'たおれると 消える');
});

test('第85回 A の となえる: ほかの 職業に 転職した あとも、となえると 大砲の 呪文を 覚えて いれば 使える', () => {
  const { b, me, c } = setup('archmage', { extra: ['tabi_madoshi', 'lina', 'mage', 'cook'] });
  me.abilities = learnedAbilities(c);
  assert.ok(me.abilities.includes('ln_tonaeru') && me.abilities.includes('lina_sig'));
  assert.ok(readyUp(b, me));
  assert.equal(b.command(me.id, { type: 'ability', id: 'lina_sig' }, 's1').ok, false);
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  const act = use(b, me, { type: 'ability', id: 'lina_sig' });
  assert.ok(dmgOf(act) > 0);
  assert.ok(!me.r85aChant);
  // 敵の がわ（職業の試練の まぼろし・鏡の うつし身）は となえずに うつ（力は ENEMY_BIG 倍）
  const s = setup('lina', { enemies: ['rockman'] });
  const m = s.b.enemies[0];
  m.abilities = ['lina_sig'];
  assert.equal(r85aLocked(m, ABILITIES.lina_sig), false);
  assert.ok(ENEMY_BIG > 0 && ENEMY_BIG < 1);
  // まぼろしは となえるを 使わない（大砲は 半分の 力で うつ）
  for (const j of ['lina', 'doramata']) for (const id of phantomSkills(j)) assert.notEqual(ABILITIES[id].effect.type, 'r85aChant', `${j}: ${id}`);
});

test('第85回 A の 早口: ドラまたは ときどき（25%）となえた ターンに すぐ 動ける・リナは ない', () => {
  let haya = 0;
  const N = 160;
  for (let seed = 1; seed <= N; seed++) {
    const { b, me } = setup('doramata', { seed });
    const ev = use(b, me, { type: 'ability', id: 'ln_tonaeru' });
    if (ev.r85aHaya) {
      haya++;
      assert.equal(me.atb, HAYAKUCHI_ATB, 'すぐに 次の 番');
      assert.ok(ev.lines.some((l) => l.includes('早口')));
    }
  }
  assert.ok(haya / N > 0.15 && haya / N < 0.36, `早口 ${haya}/${N}`);
  for (let seed = 1; seed <= 30; seed++) {
    const { b, me } = setup('lina', { seed });
    assert.ok(!use(b, me, { type: 'ability', id: 'ln_tonaeru' }).r85aHaya);
  }
});

// ───────────── 大砲の 呪文 ─────────────
test('第85回 A の ギガ・スレイブ: のこりの MP を 全部 使う・MP が 多いほど 強い・上限（MP 999 でも ボスを 1発で たおせない）・MP 0 → 定食で 回復', () => {
  const shot = (mp, seed = 3) => {
    const { b, me } = setup('doramata', { seed, enemies: ['rockman', 'rockman'] });
    for (const e of b.enemies) { e.hp = e.maxHp = 999999; }
    me.mp = mp;
    use(b, me, { type: 'ability', id: 'ln_tonaeru' });
    const act = use(b, me, { type: 'ability', id: 'doramata_sig' });
    assert.equal(me.mp, 0, 'MP は 0');
    assert.ok(act.r85aGiga && act.r85aGiga.used >= mp - 10);
    return { act, me, b, d: Math.max(...act.results.filter((r) => r.dmg > 0).map((r) => r.dmg)) };
  };
  const lo = shot(80), hi = shot(300);
  assert.ok(hi.d > lo.d * 2, `MP が 多いほど 強い ${lo.d} → ${hi.d}`);
  assert.equal(lo.act.results.filter((r) => r.dmg > 0).length, 2, '敵全体');
  const max = shot(999);
  assert.ok(max.d <= GIGA_CAP, `上限 ${max.d}`);
  assert.equal(gigaCap({ boss: false }), GIGA_CAP);
  // ボス: 最大HP の GIGA_BOSS まで（MP 999 でも 1発で たおせない）
  const { b, me } = setup('doramata', { boss: true, enemies: ['rockman'] });
  const boss = b.enemies[0];
  boss.boss = true;
  boss.hp = boss.maxHp = 6000;
  me.mp = me.maxMp = 999;
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  const act = use(b, me, { type: 'ability', id: 'doramata_sig' });
  assert.ok(boss.alive && boss.hp >= boss.maxHp * (1 - GIGA_BOSS) - 1, `ボスは のこる ${boss.hp}`);
  assert.ok(dmgOf(act) <= boss.maxHp * GIGA_BOSS + 1);
  assert.ok(GIGA_PER > 0 && GIGA_BOSS < 0.5);
  // MP 0 → 大もり定食（MP いらない）で HP と MP
  me.hp = Math.round(me.maxHp / 2);
  const eat = use(b, me, { type: 'ability', id: 'tm_oomori' });
  assert.ok(me.mp >= 12 && me.mp <= 18, `大もり定食の MP ${me.mp}`);
  assert.ok(eat.results.some((r) => r.id === me.id && r.heal > 0));
  // 特もり定食: 仲間全員の HP と MP を 少し（大砲を うち続けられる ほどは もどらない）
  const before = me.mp;
  use(b, me, { type: 'ability', id: 'dr_tokumori' });
  assert.ok(me.mp - before <= 10 - ABILITIES.dr_tokumori.mp + 1);
  const per = (id) => partsOf(ABILITIES[id].effect).find((p) => p.type === 'mpHeal').base[1];
  assert.ok(per('tm_oomori') < ABILITIES.ln_tonaeru.mp + ABILITIES.lina_sig.mp, '1回で 大砲 1発ぶんは もどらない');
  assert.ok(per('dr_tokumori') < ABILITIES.dr_ragna.mp);
});

test('第85回 A の ラグナ・ブレード: 敵1体に 特大・ききにくい 属性と 身を 守るを むしする（効かない 属性と ボスの しかけは そのまま）', () => {
  const hit = (resist, defending = false) => {
    const { b, me } = setup('doramata', { seed: 5 });
    const t = b.enemies[0];
    t.resist = { ...t.resist, dark: resist };
    t.defending = defending;
    use(b, me, { type: 'ability', id: 'ln_tonaeru' });
    return use(b, me, { type: 'ability', id: 'dr_ragna' });
  };
  const base = dmgOf(hit(1));
  const half = hit(0.5);
  assert.ok(Math.abs(dmgOf(half) - base) / base < 0.15, `ききにくい 敵にも ${dmgOf(half)} / ${base}`);
  assert.ok(half.lines.some((l) => l.includes('守りを切りさいた')));
  assert.ok(Math.abs(dmgOf(hit(1, true)) - base) / base < 0.15, '身を 守っても');
  assert.equal(dmgOf(hit(0)), 0, '効かない 属性は 効かない');
  // ボスの しかけ（前ぶれ・形態）は こわさない（敵は 動かない ように 行動ゲージを ずっと 0 に）
  const { b, me } = setup('doramata', { seed: 6 });
  const t = b.enemies[0];
  use(b, me, { type: 'ability', id: 'ln_tonaeru' });
  t.telegraph = { name: '大技', left: 2 };
  t.form = 'x';
  t.atb = -1e9;
  use(b, me, { type: 'ability', id: 'dr_ragna' });
  assert.deepEqual(t.telegraph, { name: '大技', left: 2 });
  assert.equal(t.form, 'x');
});

test('第85回 A の フレア・アロー・とう賊たいじ・ドラゴンもまたいで通る', () => {
  // フレア・アロー: ばらばらの 敵に 4本
  const { b, me } = setup('tabi_madoshi', { enemies: ['rockman', 'rockman', 'rockman'] });
  const fa = use(b, me, { type: 'ability', id: 'tabi_madoshi_sig' });
  assert.equal(fa.results.filter((r) => r.dmg > 0 || r.miss).length, 4);
  // とう賊たいじ: 当てた 敵の お金（hooks.gainGold。たおさなくても）
  const got = [];
  const s = setup('tabi_madoshi', { enemies: ['rockman', 'rockman'], hooks: { gainGold: (c, sp, m) => { got.push([sp, m]); return 10; } } });
  const tz = use(s.b, s.me, { type: 'ability', id: 'tm_touzoku' });
  assert.deepEqual(got, [['rockman', 0.5], ['rockman', 0.5]]);
  assert.ok(tz.lines.some((l) => l.includes('20ゴールドいただいた')));
  for (const l of tz.lines) textOk(l, 'touzoku');
  // フック なし（試練・テスト）でも こわれない
  const s2 = setup('tabi_madoshi');
  assert.ok(dmgOf(use(s2.b, s2.me, { type: 'ability', id: 'tm_touzoku' })) > 0);
  // ドラゴンもまたいで通る: 攻撃力が 下がり、ときどき 番が おくれる
  let down = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const t = setup('doramata', { seed, enemies: ['rockman', 'rockman'] });
    use(t.b, t.me, { type: 'ability', id: 'dr_matagu' });
    down += t.b.enemies.filter((e) => e.debuffs?.atk).length;
  }
  assert.ok(down >= 8, `攻撃力が 下がった ${down}`);
});

// ───────────── オート ─────────────
test('第85回 A の オート: ボスには となえる → 大砲・ざこには ふつうの 呪文・前ぶれの 時は となえない・MP が 少ないと 定食・ほかの 職業は かわらない', () => {
  const pick = (job, o = {}, fn = () => {}) => {
    const s = setup(job, { seed: 11, ...o });
    s.me.abilities = learnedAbilities(s.c);
    fn(s);
    const out = [];
    for (let i = 0; i < 20; i++) out.push(decideAlly(s.b, s.me));
    return { s, out };
  };
  // ボス: となえる
  const boss = pick('lina', { boss: true, enemies: ['rockman'] }, (s) => { s.b.enemies[0].boss = true; });
  assert.ok(boss.out.some((c) => c.id === 'ln_tonaeru'), 'ボスには となえる');
  // となえて いれば 大砲（1体 → ラグナ・ブレード・2体 → ドラグ・スレイブ）
  const one = pick('doramata', { boss: true }, (s) => { s.b.enemies[0].boss = true; s.me.r85aChant = { left: 3 }; s.me.mp = 300; });
  assert.ok(one.out.every((c) => c.id === 'dr_ragna'), JSON.stringify(one.out[0]));
  const two = pick('lina', { boss: true, enemies: ['rockman', 'rockman'] }, (s) => { s.me.r85aChant = { left: 3 }; });
  assert.ok(two.out.every((c) => c.id === 'lina_sig'));
  // ギガ・スレイブ: ボスに とどめが させる 時
  const fin = pick('doramata', { boss: true }, (s) => { const e = s.b.enemies[0]; e.boss = true; e.hp = 300; s.me.r85aChant = { left: 3 }; s.me.mp = 400; });
  assert.ok(fin.out.every((c) => c.id === 'doramata_sig'));
  // ざこ（こわくない 敵）には となえない
  const weak = pick('lina', { enemies: ['rockman', 'rockman', 'rockman'] }, (s) => { for (const e of s.b.enemies) e.hp = e.maxHp = 30; });
  assert.ok(weak.out.every((c) => c.id !== 'ln_tonaeru'), 'ざこには ふつうの 呪文');
  // 前ぶれが 見えて いる 時は となえない（今の きまり: 身を 守る）
  const tele = pick('lina', { boss: true }, (s) => { s.b.enemies[0].boss = true; s.b.enemies[0].telegraph = { name: '大技' }; });
  assert.ok(tele.out.every((c) => c.id !== 'ln_tonaeru'));
  // MP が 少ない: 定食（オートの ふつうの 回復には 入れない）
  const hungry = pick('doramata', { boss: true }, (s) => { s.b.enemies[0].boss = true; s.me.mp = 10; });
  assert.ok(hungry.out.some((c) => c.id === 'tm_oomori' || c.id === 'dr_tokumori'), 'MP が 少ないと 定食');
  const full = pick('doramata', { boss: true }, (s) => { s.b.enemies[0].boss = true; s.me.hp = Math.round(s.me.maxHp * 0.6); });
  assert.ok(full.out.every((c) => c.id !== 'dr_tokumori' && c.id !== 'tm_oomori'), 'MP も HP も ある 時は 食べない');
  assert.ok(R85A_AI.chant > 0 && R85A_AI.chant <= 1);
  // ほかの 職業の オートは かわらない（この 系統の 技を 持たない 人は 運も 使わない）
  for (const job of ['archmage', 'sennen_mage', 'hiryu_master']) {
    const a = setup(job, { seed: 9, boss: true });
    const b2 = setup(job, { seed: 9, boss: true });
    a.me.abilities = learnedAbilities(a.c);
    b2.me.abilities = learnedAbilities(b2.c);
    const x = decideAlly(a.b, a.me);
    assert.deepEqual(x, decideAlly(b2.b, b2.me));
    assert.ok(!(x.type === 'ability' && isBig(ABILITIES[x.id])));
  }
});

// ───────────── ひらめき・合体技・試練・ひとこと・乗り物 ─────────────
test('第85回 A の ひらめき技: 3つの 職業に 1つずつ・データ・文字・使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R85A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R85A).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R85A_ABILITIES[id].job === j).length), [1, 1, 1]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R85A_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    assert.ok(!isBig(a), 'ひらめき技は となえずに うてる');
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R85A_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'mage' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = 'warrior';
    assert.equal(hiraAllowed(c, id), false);
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

test('第85回 A の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・ごちそうの荷車', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('magic'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
  }
  // 合体技の 相手の 案: ハリーポッター（魔法）・大魔道士（魔法・炎）・料理人（料理）。新しい タグは 作らない
  assert.ok(JOBS.harry.tags.includes('magic') && JOBS.archmage.tags.includes('fire') && JOBS.cook.tags.includes('cook'));
  assert.ok(JOBS.tabi_madoshi.tags.includes('cook') && JOBS.lina.tags.includes('cook'));
  for (const j of ['lina', 'doramata']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 3, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
  }
  // 乗り物: ごちそうの荷車（3つの 職業）
  const v = VEHICLES.feast_cart;
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'feast_cart');
  textOk(v.desc, 'feast_cart');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('feast_cart'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('feast_cart', view, f, 'back')) + lit(paintVehicle('feast_cart', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('feast_cart', view, f));
      frames.add([...(paintVehicle('feast_cart', view, f, 'front')?.px || [])].join() + [...(paintVehicle('feast_cart', view, f, 'back')?.px || [])].join());
    }
    assert.ok(frames.size >= 2, `${view}: うごく`);
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

test('第85回 A の 絵: 3つの 職業（男女・4方向・はみ出さない・段ごとに ちがう・魔法使いと ちがう）・黒い マント・黄色い かたあて・はちまき・赤い オーラ', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R85A_OUTFIT[j] && R85A_BODY[j] && R85A_HAT[j] && R85A_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'mage', 'archmage', 'cook']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, 'travel');
    assert.ok(O.cape && O.pauldron, 'マントと かたあて');
    assert.equal(R85A_HAT[job].kind, 'headband');
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.ok(['lina', 'doramata'].every((j) => /^#1/.test(R85A_OUTFIT[j].cloak)), '黒い マント');
  assert.equal(jobBody('doramata').aura, 'red85');
  assert.ok(AURA85A.red85);
  assert.ok(!jobBody('lina').aura);
});

// ───────────── えんしゅつ・札 ─────────────
test('第85回 A の えんしゅつ: 看板の 技・大事な 技（光の 輪・赤い 大ばくはつ・黒い やいば）・音・こわれない・となえる 札', () => {
  const used = new Set([...Object.keys(R85A_ABILITIES), ...Object.keys(HIRA_R85A_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const anim of R85A_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R85A_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R85A_SFX).sort(), [...R85A_ANIMS].sort());
  assert.deepEqual(Object.keys(R85A_HIT).sort(), [...R85A_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R85A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const a of PARTY_ANIMS_R85A) assert.ok(PARTY_ANIMS.has(a), a);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R85A_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R85A_HIT\)/);
  assert.match(battle, /disabled: noMp \|\| sil \|\| [^\n]*r85\.off/);
  assert.match(battle, /r85aPresent\(this, ev\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR85aFx\(this, anim/);
  for (const anim of R85A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const el of [null, 'fire', 'dark']) {
        const fx = new Effects();
        assert.equal(playR85aFx(fx, anim, targets, el, { crit: el === 'fire' }, BW, BH), true, anim);
        fx.play(anim, targets, el, {});
        assert.ok(fx.parts.length > 0, anim);
        let t = 0;
        while (fx.parts.length && t < 5000) { fx.update(16); t += 16; }
        assert.ok(t <= 2400, `${anim}: ${t}ms`);
      }
    }
  }
  assert.equal(playR85aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR85aFx(new Effects(), 'lina_sig', []), false);
  // ドラグ・スレイブ（赤）・ギガ・スレイブ（黒と むらさき）・ラグナ・ブレード（黒い やいば）
  const cols = (anim) => {
    const fx = new Effects();
    playR85aFx(fx, anim, [{ x: 128, y: 70 }], null, {}, BW, BH);
    return JSON.stringify(fx.parts.map((p) => p.color || p.colors || p.glow));
  };
  assert.match(cols('lina_sig'), /#ff3a1a/);
  assert.match(cols('doramata_sig'), /#7a3aa8/);
  assert.match(cols('r85a_ragna'), /#140a1e/);
  assert.match(cols('r85a_chant'), /#ffd36a/);
  // 札（家族 みんなに 見える）
  assert.deepEqual(r85aMarks({ alive: true, r85aChant: 2 }).map((m) => m.text), ['となえ2']);
  assert.deepEqual(r85aMarks({ alive: true, r85aChant: 0 }), []);
  assert.deepEqual(r85aMarks({ alive: false, r85aChant: 3 }), []);
  textOk(r85aMarks({ alive: true, r85aChant: 3 })[0].text, 'mark');
});

// ───────────── 新しい 系統どうしが 同じ パーティー（第83回 A班 軍師・第84回 A班 幽☆遊☆白書・第84回 B班 らんま・第85回 A班） ─────────────
test('第85回 A の まぜた パーティー: 軍師の 作戦・号令・れい丸・らんまの すがたと、となえる・大砲が おたがいを こわさない', () => {
  const mk = (id, job) => {
    const c = newCharacter({ id, name: id, job: 'mage' });
    gainExp(c, expForLevel(60));
    masterChain(c, job);
    master(c, job);
    c.job = job;
    c.equip.weapon = null;
    fullHeal(c);
    return c;
  };
  // 第85回 B班の 烈火も（オートで 火竜を よんでも こわれない）
  const chars = [mk('dr', 'doramata'), mk('gu', 'hoshin_gunshi'), mk('ra', 'hiryu_master'), mk('yu', 'yusuke'), mk('re', 'rekka')];
  const b = new Battle({ rng: makeRng(85), allies: chars.map((char) => ({ char, controller: 's1' })), enemies: ['rockman', 'rockman'], canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) { a.mp = a.maxMp = 999; a.maxHp = a.hp = 3000; }
  const [dr, gu, ra, yu] = b.allies;
  assert.equal(formOf(dr), null, 'ドラまたは すがたを 持たない');
  assert.equal(formOf(ra), 'oyu');
  // 軍師の 攻めの 作戦（ずっと）
  use(b, gu, { type: 'ability', id: 'sd_sakusen', sakusen: 'seme' });
  assert.equal(b.r83aPlan?.kind, 'seme');
  // となえる → 軍師の号令で すぐ 動ける（となえは のこる）→ 大砲（作戦も のる）
  use(b, dr, { type: 'ability', id: 'ln_tonaeru' });
  assert.ok(dr.r85aChant);
  use(b, gu, { type: 'ability', id: 'hg_gorei', target: dr.id });
  assert.ok(dr.r85aChant, '号令で 動いても となえは 消えない');
  const p = pub(dr);
  assert.ok(p.r83aPlan && p.r85aChant > 0);
  assert.deepEqual(r85aMarks(p).map((m) => m.text), [`となえ${dr.r85aChant.left}`]);
  assert.deepEqual(r84bMarks(p), [], 'すがたの 札は 出ない');
  const big = use(b, dr, { type: 'ability', id: 'lina_sig' });
  assert.ok(dmgOf(big) > 0 && !dr.r85aChant);
  assert.equal(b.r83aPlan?.kind, 'seme', '大砲を うっても 作戦は のこる');
  // れい丸（第84回 A班）: となえて いる 間に 仲間が れい丸を うっても、となえは のこる・れい丸の 数と となえの 札は べつ
  use(b, dr, { type: 'ability', id: 'ln_tonaeru' });
  const rei0 = reiLeft(yu);
  const shotEv = use(b, yu, { type: 'ability', id: 'rt_reigan' });
  assert.ok(dmgOf(shotEv) > 0);
  assert.equal(reiLeft(yu), rei0 - 1);
  assert.ok(dr.r85aChant, 'ほかの 人の 技では となえは 消えない');
  assert.equal(pub(yu).r85aChant, 0);
  assert.ok(pub(yu).r84aRei && !pub(dr).r84aRei, 'れい丸の 数は ゆう助だけ');
  assert.ok(dmgOf(use(b, dr, { type: 'ability', id: 'dr_ragna' })) > 0);
  // らんまの すがたは かわらない・らんまは となえる 札を 持たない
  use(b, ra, { type: 'ability', id: 'ms_mizu', form: 'mizu' });
  assert.equal(formOf(ra), 'mizu');
  assert.equal(pub(ra).r85aChant, 0);
  // 合体技の 強さに 数える 大砲の 倍（battle-dual.js の memberPower。ボスの しらべで そのまま〈1〉に した。docs/plan-r85-jobs-a.md）
  assert.ok(bigDualMult(ABILITIES.lina_sig) > 0 && bigDualMult(ABILITIES.lina_sig) <= 1);
  assert.equal(bigDualMult(ABILITIES.ln_elmekia), 1);
  // オート: みんな こわれない
  b.allies.forEach((x, i) => { x.abilities = learnedAbilities(chars[i]); });
  for (const x of b.allies) for (let i = 0; i < 6; i++) assert.ok(decideAlly(b, x)?.type);
  for (const x of b.allies) x.controller = null;
  for (let i = 0; i < 600; i++) b.tick(50);
  assert.ok(b.allies.every((x) => x.alive));
});
