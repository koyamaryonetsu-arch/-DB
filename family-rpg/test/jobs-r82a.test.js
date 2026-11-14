// 第82回 A班: 犬夜叉の 系統（docs/plan-jobs-r79.md の 8-1・docs/plan-r82-jobs-a.md）
//   半ようの少年（基本職）→ 鉄さいがの使い手 → 犬夜しゃ → ばくりゅうはの大よう（＋ほかの 超級職 1つ）
//  ・職業の 木・強さ・技・ひらめき技・合体技・試練・転職の ひとこと・乗り物・文字
//  ・しくみ: ようかい化（刀で ならない・命令を 聞かない・おすわり！で もどる・半分で もどる）・大よう化・風の技・ばくりゅうは（返す 上限）
//  ・絵（hero-r82a.js）・乗り物の 絵（vehicle-r82a.js）・えんしゅつ（battlefx-r82a.js）
//  ・ならびの 場所（何番め）は 見ない（B班の 職業と いっしょに ふえても こわれない ように）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R82A, BASE_R82A_ORDER, ADV_R82A_ORDER, SUPER_R82A_ORDER, LEGEND_R82A_ORDER, HINTS_R82A } from '../public/js/shared/data/jobs-r82a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R82A_ABILITIES } from '../public/js/shared/data/abilities-r82a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R82A_ABILITIES, HIRAMEKI_R82A } from '../public/js/shared/data/hirameki-r82a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP, battleAbilityOk } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { YOUKAI_AT, youkaiReady, r82aPhysMult, bakuryuDamage } from '../public/js/shared/battle-r82a.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R82A_JOBS, R82A_OUTFIT, R82A_BODY, R82A_OLD_LOOK } from '../public/js/client/render/hero-r82a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { paintVehicle, VIEWS, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R82A_ANIMS, R82A_SIGS, R82A_HIT, R82A_SFX, R82A_FINE, playR82aFx } from '../public/js/client/render/battlefx-r82a.js';
import { r82aMarks, youkaiWaitText } from '../public/js/client/battle-r82a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['hanyo_boy', 'tessaiga_user', 'inuyasha', 'bakuryuha'];
const TREE = {
  hanyo_boy: ['半ようの少年', 0, undefined, undefined],
  tessaiga_user: ['鉄さいがの使い手', 1, ['hanyo_boy'], undefined],
  inuyasha: ['犬夜しゃ', 2, ['tessaiga_user'], undefined],
  bakuryuha: ['ばくりゅうはの大よう', 3, ['inuyasha'], 1],
};
const SUMS = { hanyo_boy: 6.4, tessaiga_user: 6.9, inuyasha: 8.3, bakuryuha: 9.55 };
const RANGE = [[6.05, 7.35], [6.65, 8.0], [7.75, 9.05], [9.3, 10.2]];
const YOUKAI = { hanyo_boy: 1.3, tessaiga_user: 1.4, inuyasha: 1.5, bakuryuha: 1.6 };
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, ally: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: 10, b: 999 }; };
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45, weapon = null, manual = false } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  master(c, ...NEW, 'god_hand');
  c.job = job;
  c.equip.weapon = weapon;
  fullHeal(c);
  const m = newCharacter({ id: 'm0', name: 'ミナ', job: 'priest' });
  gainExp(m, expForLevel(lv));
  fullHeal(m);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1', manual }, { char: m, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const actNow = (b, a, cmd) => { readyUp(b, a); b.command(a.id, cmd, 's1'); return runUntilAct(b, a.id); };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
// 敵の 呪文（モンスターの 技で 1人に あたる magic）と 物理の 技
const SPELL = Object.keys(ABILITIES).find((id) => ABILITIES[id].kind === 'monster' && ABILITIES[id].effect?.type === 'magic' && ABILITIES[id].target === 'enemy' && !ABILITIES[id].effect.status);
const PHYS = Object.keys(ABILITIES).find((id) => ABILITIES[id].kind === 'monster' && ABILITIES[id].effect?.type === 'phys' && ABILITIES[id].target === 'enemy' && !ABILITIES[id].effect.hits);

// ───────────── 職業の 木 ─────────────
test('第82回 A: 犬夜叉の 系統の 4つの 職業（基本職から 伝説まで）・名前・うわさ・文字', () => {
  assert.deepEqual([...BASE_R82A_ORDER, ...ADV_R82A_ORDER, ...SUPER_R82A_ORDER, ...LEGEND_R82A_ORDER], NEW);
  assert.deepEqual(Object.keys(JOBS_R82A), NEW);
  assert.deepEqual(Object.keys(HINTS_R82A).sort(), ['bakuryuha', 'inuyasha']);
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req, sup] = TREE[id];
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, sup);
    assert.ok([JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER][tier].includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    if (tier >= 2) { assert.equal(JOB_HINTS[id], HINTS_R82A[id]); textOk(JOB_HINTS[id], id); }
  }
  assert.equal(jobReqText('tessaiga_user'), '半ようの少年Lv10');
  assert.equal(jobReqText('bakuryuha'), '犬夜しゃLv10＋ほかの超級職1つLv10');
});

test('第82回 A: なれる じゅんばん（さいしょから 半ようの少年 → きわめると 次・伝説は ほかの 超級職も）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'hanyo_boy' });
  assert.equal(c.job, 'hanyo_boy', 'はじめに えらべる 基本職');
  assert.deepEqual(c.equip, { ...STARTER_EQUIP.hanyo_boy });
  assert.equal(c.equip.weapon, null, '素手（つめ）から');
  for (const [from, to] of [['hanyo_boy', 'tessaiga_user'], ['tessaiga_user', 'inuyasha']]) {
    assert.equal(jobUnlocked(c, to), false);
    master(c, from);
    assert.equal(jobUnlocked(c, to), true, to);
    assert.equal(changeJob(c, to).ok, true);
  }
  assert.equal(jobKnown(c, 'bakuryuha'), false);
  master(c, 'inuyasha');
  assert.equal(jobKnown(c, 'bakuryuha'), true, 'うわさ');
  assert.equal(jobUnlocked(c, 'bakuryuha'), false, 'ほかの 超級職も いる');
  master(c, 'archmage');
  assert.equal(jobUnlocked(c, 'bakuryuha'), true);
  assert.equal(changeJob(c, 'bakuryuha').ok, true);
  assert.ok(learnedAbilities(c).includes('bry_ryurin'));
});

test('第82回 A: 強さは 設計の 表の とおり・段の はんい・武器（つめと 刀）・ようかい化の 倍', () => {
  for (const j of NEW) {
    const t = JOBS[j].tier;
    assert.ok(Math.abs(sum(j) - SUMS[j]) < 1e-9, `${j} ${sum(j)}`);
    assert.ok(sum(j) >= RANGE[t][0] && sum(j) <= RANGE[t][1]);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.equal(JOBS[j].passive.youkai, YOUKAI[j]);
    assert.ok(JOBS[j].weapons.includes('claw') && JOBS[j].weapons.includes('none'));
  }
  assert.ok(!JOBS.hanyo_boy.weapons.includes('sword'), '基本職は つめだけ');
  for (const j of NEW.slice(1)) assert.ok(JOBS[j].weapons.includes('sword'), `${j}: 剣と つめ`);
  assert.equal(JOBS.hanyo_boy.mods.str, 1.3);
  assert.equal(JOBS.inuyasha.mods.str, 1.7);
  assert.equal(JOBS.inuyasha.mods.hp, 1.5);
  assert.equal(JOBS.bakuryuha.mods.str, 1.95);
});

// ───────────── 技 ─────────────
test('第82回 A: 技は 6こ（Lv1〜10・看板の 技）・つめの 技と 刀の 技・せつめい・文字・名前が かぶらない', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6, j);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b));
    assert.equal(lvs[0], 1);
    assert.equal(lvs.at(-1), 10);
    assert.equal(job.learn.at(-1)[1], `${j}_sig`);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MP`);
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技`);
    const shape = (a) => `${a.target}|${a.weapon || ''}|${partsOf(a.effect).map((p) => [p.type, p.element || '', p.stat || (p.stats || []).join('+'), p.hits || '', p.dispel ? 'd' : ''].join(':')).join(',')}`;
    const seen = new Set();
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...partsOf(a.effect).flatMap((p) => [p.msg, p.failMsg, p.bossMsg]).filter(Boolean)]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      if (a.weapon === 'fist') assert.match(a.desc, /つめか素手の時に使える/);
      if (a.weapon === 'sword') assert.match(a.desc, /剣の時に使える/);
      assert.ok(!seen.has(shape(a)), `${a.name} の 形が かぶる`);
      seen.add(shape(a));
      for (const p of partsOf(a.effect)) if (p.type === 'buff' && a.target === 'allies') assert.ok(p.mult <= 1.3 + 1e-9, a.name);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R82A_ABILITIES).sort());
  // 武器で 戦い方が かわる: 半ようの少年は つめ、上の 職業は 刀の 技が 多い
  const w = (j, k) => JOBS[j].learn.filter(([, id]) => ABILITIES[id].weapon === k).length;
  assert.ok(w('hanyo_boy', 'fist') >= 4 && w('hanyo_boy', 'sword') === 0);
  for (const j of ['tessaiga_user', 'inuyasha', 'bakuryuha']) assert.ok(w(j, 'sword') >= 3, j);
  // 風の技は 敵全体・強化して いる 敵に 1.3倍
  for (const id of ['tessaiga_user_sig', 'iny_kaze_ren']) {
    assert.equal(ABILITIES[id].target, 'enemies');
    assert.equal(ABILITIES[id].effect.element, 'wind');
    assert.equal(ABILITIES[id].effect.vsBuff, 1.3);
  }
  assert.equal(ABILITIES.inuyasha_sig.effect.type, 'bakuryu');
  assert.ok(!ABILITIES.inuyasha_sig.effect.phys && ABILITIES.bakuryuha_sig.effect.phys, '真・ばくりゅうはは 物理の 大技も');
  assert.ok(ABILITIES.bakuryuha_sig.effect.cap > ABILITIES.inuyasha_sig.effect.cap);
  // つめの 技は 剣を もつと 戦いの 一覧に 出ない（刀の 技は その 反対）
  assert.equal(battleAbilityOk({ job: 'inuyasha', jobs: {} }, 'tsg_sankon', 'sword'), false);
  assert.equal(battleAbilityOk({ job: 'inuyasha', jobs: {} }, 'tsg_sankon', 'claw'), true);
  assert.equal(battleAbilityOk({ job: 'inuyasha', jobs: {} }, 'tessaiga_user_sig', 'claw'), false);
});

test('第82回 A: 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・文字・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const a = ABILITIES[id];
      const { b, me, m } = setup(j, { seed: ++n, weapon: a.weapon === 'sword' ? 'iron_sword' : null });
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act, id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg' && a.effect.type !== 'bakuryu') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
    }
    for (const weapon of [null, 'iron_sword']) {
      if (j === 'hanyo_boy' && weapon) continue;
      const s = setup(j, { seed: 7, weapon });
      let used = 0;
      for (let i = 0; i < 12; i++) {
        const cmd = decideAlly(s.b, s.me);
        assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
        if (cmd.type === 'ability') {
          used++;
          assert.ok(battleAbilityOk(s.me.penChar, cmd.id, s.me.weaponCat), `${j} ${weapon}: ${cmd.id} は 武器が 合う`);
        }
      }
      assert.ok(used > 0, `${j} ${weapon}: オートでも 技を 使う`);
    }
  }
});

// ───────────── ようかい化 ─────────────
test('第82回 A ようかい化: つめで HP が 3わり いかに なると、命令を 聞かずに 力と 素早さが 上がって あばれる', () => {
  for (const j of NEW) {
    const { b, me, m } = setup(j, { seed: 11 });
    m.abilities = []; // 仲間に 回復されない ように
    const atk0 = me.atk, agi0 = me.agi;
    me.hp = Math.floor(me.maxHp * YOUKAI_AT) - 1;
    assert.ok(youkaiReady(me));
    const evs = [];
    for (let i = 0; i < 400; i++) evs.push(...b.tick(50));
    assert.ok(!evs.some((e) => e.t === 'ready' && e.id === me.id), `${j}: 「めいれいさせろ」でも コマンドが 出ない`);
    const acts = evs.filter((e) => e.t === 'act' && e.id === me.id);
    assert.ok(acts.length >= 2, j);
    assert.ok(acts[0].lines.some((l) => l.includes('ようかいの血があばれだした')), j);
    assert.equal(acts[0].youkaiOn, me.id);
    for (const a of acts) {
      assert.ok(a.lines.some((l) => l.includes('ようかいの血のままにあばれている')), j);
      assert.ok(a.name === '攻撃' || ABILITIES[a.ability]?.weapon === 'fist', `${j}: つめで 攻撃 ${a.name}`);
      for (const l of a.lines) textOk(l, j);
    }
    assert.equal(me.youkai, true);
    assert.equal(me.atk, Math.round(atk0 * YOUKAI[j]), `${j}: 力が ${YOUKAI[j]}倍`);
    assert.equal(me.agi, Math.round(agi0 * YOUKAI[j]));
    // みんなの 画面: pub の youkai と 札・コマンドの ところの ことば
    const p = pub(me);
    assert.equal(p.youkai, 1);
    assert.deepEqual(r82aMarks(p).map((x) => x.text), ['ようかい化']);
    assert.match(youkaiWaitText(p), /命令がとどかない/);
    textOk(youkaiWaitText(p), 'wait');
    // HP が 半分より 上に もどると もとに もどる
    me.hp = me.maxHp;
    const back = runUntilAct(b, me.id);
    assert.ok(back.lines.some((l) => l.includes('もとのすがたにもどった')), j);
    assert.equal(!!me.youkai, false);
    assert.equal(me.atk, atk0);
    assert.equal(pub(me).youkai, 0, 'もどった ことも 画面に とどく');
  }
});

test('第82回 A ようかい化: 刀を もって いる 間は ならない（命令できる まま）', () => {
  for (const j of NEW.slice(1)) {
    const { b, me } = setup(j, { seed: 12, weapon: 'iron_sword' });
    assert.equal(me.weaponCat, 'sword');
    me.hp = Math.floor(me.maxHp * 0.1);
    assert.equal(youkaiReady(me), false);
    assert.ok(readyUp(b, me), `${j}: コマンドが 出る`);
    assert.equal(!!me.youkai, false);
  }
  // ほかの 職業は ようかい化しない
  const { me } = setup('inuyasha', { seed: 1 });
  me.job = 'warrior';
  me.hp = 1;
  assert.equal(youkaiReady(me), false);
});

test('第82回 A おすわり！: ようかい化が おさまって、次の ダメージが 半分・しばらく ようかい化しない', () => {
  const { b, me, m } = setup('hanyo_boy', { seed: 13 });
  m.abilities = [];
  me.hp = Math.floor(me.maxHp * 0.2);
  runUntilAct(b, me.id);
  assert.equal(me.youkai, true);
  // 仲間（同じ 技を 覚えた 人）が「おすわり！」
  m.abilities = [...m.abilities, 'hyb_osuwari'];
  b.queue.unshift({ id: m.id, cmd: { type: 'ability', id: 'hyb_osuwari', target: me.id }, last: false });
  const ev = runUntilAct(b, m.id);
  assert.ok(ev.lines.some((l) => l.includes('地面にめりこんだ')));
  assert.ok(ev.lines.some((l) => l.includes('ようかい化が、おさまった')));
  for (const l of ev.lines) textOk(l, 'osuwari');
  assert.equal(!!me.youkai, false);
  assert.equal(me.osuwari, true);
  assert.ok(me.youkaiCalm > 0);
  assert.deepEqual(r82aMarks(pub(me)).map((x) => x.text), ['おすわり']);
  // 次に 敵から 受ける ダメージが 半分
  const e = b.enemies[0];
  const ev2 = { lines: [], upd: [], results: [] };
  const hp0 = me.hp = me.maxHp;
  b.damage(e, me, 100, ev2, { phys: true });
  assert.equal(hp0 - me.hp, 50);
  assert.equal(me.osuwari, undefined, '1回だけ');
  // しばらく ようかい化しない（HP が 少なくても）
  me.hp = Math.floor(me.maxHp * 0.1);
  const a1 = actNow(b, me, { type: 'attack', target: b.enemies[0].id });
  assert.ok(a1 && !a1.youkaiOn, 'おすわりの すぐ あとは ならない');
});

test('第82回 A 大よう化・せいぎょ: 3回の 行動の 間、命令できる まま ようかい化の 力（1.4倍。刀でも）', () => {
  assert.equal(ABILITIES.bry_daiyou.effect.mult, 1.4);
  const { b, me } = setup('bakuryuha', { seed: 14, weapon: 'iron_sword' });
  const atk0 = me.atk;
  readyUp(b, me);
  b.command(me.id, { type: 'ability', id: 'bry_daiyou' }, 's1');
  runUntilAct(b, me.id);
  assert.equal(me.atk, Math.round(atk0 * ABILITIES.bry_daiyou.effect.mult));
  assert.equal(pub(me).youkai, 2);
  assert.deepEqual(r82aMarks(pub(me)).map((x) => x.text), ['大よう化']);
  for (let k = 0; k < 3; k++) {
    assert.ok(readyUp(b, me), `${k}: 命令できる`);
    b.command(me.id, { type: 'attack', target: b.enemies[0].id }, 's1');
    runUntilAct(b, me.id);
  }
  assert.ok(readyUp(b, me));
  b.command(me.id, { type: 'attack', target: b.enemies[0].id }, 's1');
  const ev = runUntilAct(b, me.id);
  assert.ok(ev.lines.some((l) => l.includes('大ようの力が、おさまった')));
  assert.equal(me.atk, atk0);
  // ようかい化の 間に 強い 技（あばれんぼうの大づめ）
  assert.equal(r82aPhysMult({ youkai: true }, {}, ABILITIES.hanyo_boy_sig.effect), 1.35);
  assert.equal(r82aPhysMult({}, {}, ABILITIES.hanyo_boy_sig.effect), 1);
});

test('第82回 A 風の技: 自分を 強くして いる 敵ほど ダメージが 上がる（1.3倍〜1.5倍まで）', () => {
  const eff = ABILITIES.tessaiga_user_sig.effect;
  assert.equal(r82aPhysMult({}, { buffs: {} }, eff), 1);
  assert.equal(r82aPhysMult({}, { buffs: { atk: { mult: 1.3 } } }, eff), 1.3);
  assert.ok(Math.abs(r82aPhysMult({}, { buffs: { atk: { mult: 1.3 }, def: { mult: 1.3 } } }, eff) - 1.4) < 1e-9);
  assert.ok(Math.abs(r82aPhysMult({}, { buffs: { atk: {}, def: {}, agi: {}, mag: {} }, charge: 2 }, eff) - 1.5) < 1e-9);
  assert.equal(r82aPhysMult({}, { buffs: { eva: { add: 0.2 } } }, eff), 1, 'かわしやすさは 数えない');
  const { b, me } = setup('tessaiga_user', { weapon: 'iron_sword' });
  const t = b.enemies[0];
  const d0 = b.calcPhys(me, t, eff, 1, 'wind', true).dmg;
  t.buffs.atk = { mult: 1.3, lv: 1, left: 3 };
  const d1 = b.calcPhys(me, t, eff, 1, 'wind', true).dmg;
  assert.ok(d1 > d0 * 1.25, `${d0} → ${d1}`);
});

// ───────────── ばくりゅうは ─────────────
function bakuryuSetup(job, sig, enemyAct, seed = 21) {
  const s = setup(job, { seed, weapon: 'iron_sword', enemies: ['rockman', 'skeleton'] });
  const { b, me } = s;
  readyUp(b, me);
  assert.equal(b.command(me.id, { type: 'ability', id: sig, target: b.enemies[0].id }, 's1').ok, true);
  const set = runUntilAct(b, me.id);
  assert.equal(me.stance?.kind, 'bakuryu');
  assert.equal(set.bakuryuSet, me.id);
  for (const l of set.lines) textOk(l, sig);
  const e = b.enemies[0];
  e.hp = e.maxHp = 50000;
  b.enemies[1].hp = b.enemies[1].maxHp = 50000;
  b.queue.unshift({ id: e.id, cmd: { ...enemyAct, target: me.id }, last: false });
  return { ...s, e };
}
test('第82回 A ばくりゅうは: 敵の 呪文を 受けると 半分に して、風で 敵全体へ 返す（上限は 自分の 物理の 3倍）', () => {
  assert.ok(SPELL && PHYS, `${SPELL} ${PHYS}`);
  const { b, me, e } = bakuryuSetup('inuyasha', 'inuyasha_sig', { type: 'ability', id: SPELL });
  e.mag = 999; // 強い 呪文
  const hp0 = me.hp;
  const hp1 = b.enemies.map((x) => x.hp);
  const ev = runUntilAct(b, e.id);
  for (const l of ev.lines) textOk(l, 'ret');
  assert.ok(ev.lines.some((l) => l.includes('はね返した')), ev.lines.join('/'));
  assert.equal(ev.bakuryuRet?.length, 1);
  assert.ok(hp0 - me.hp > 0, '自分も 少し 受ける');
  const caps = b.enemies.map((x) => b.calcPhys(me, x, { mult: 3.0 }, 1, 'phys', true).dmg);
  b.enemies.forEach((x, i) => {
    const d = hp1[i] - x.hp;
    assert.ok(d > 0, '敵全体に');
    assert.ok(d <= Math.ceil(caps[i] * (x.resist?.wind ?? 1)) + 1, `上限 ${d} <= ${caps[i]}`);
  });
  assert.equal(me.stance, null, '返したら かまえは おわる');
  // 返したので、次の 番の 風の 一ふりは ない
  const next = actNow(b, me, { type: 'attack', target: b.enemies[0].id });
  assert.ok(next && !next.bakuryuSwing);
});

test('第82回 A ばくりゅうは: ふつうの 攻撃は 返さない・受けなければ 次の 番に 風の 一ふり・物理の 技は 真・ばくりゅうはだけ', () => {
  {
    const { b, me, e } = bakuryuSetup('inuyasha', 'inuyasha_sig', { type: 'attack' }, 22);
    const ev = runUntilAct(b, e.id);
    assert.ok(!ev.bakuryuRet, 'ふつうの 攻撃は 返さない');
    assert.equal(me.stance?.kind, 'bakuryu');
    const hp1 = b.enemies.map((x) => x.hp);
    const mine = actNow(b, me, { type: 'attack', target: b.enemies[1].id });
    assert.equal(mine.bakuryuSwing, me.id);
    assert.ok(mine.lines.some((l) => l.includes('風の一ふり')));
    assert.ok(b.enemies.some((x, i) => x.hp < hp1[i]), '風の 一ふりが 当たる');
  }
  {
    const { b, e } = bakuryuSetup('inuyasha', 'inuyasha_sig', { type: 'ability', id: PHYS }, 23);
    assert.ok(!runUntilAct(b, e.id).bakuryuRet, '物理の 技は 犬夜しゃの ばくりゅうはでは 返さない');
  }
  {
    const { b, e } = bakuryuSetup('bakuryuha', 'bakuryuha_sig', { type: 'ability', id: PHYS }, 24);
    e.atk = 900;
    const ev = runUntilAct(b, e.id);
    assert.ok(ev.bakuryuRet?.length === 1 || ev.results.every((r) => r.miss), '真・ばくりゅうはは 物理の 大技も 返す');
  }
  {
    // ためた 大技（前ぶれの あと）
    const { b, e } = bakuryuSetup('inuyasha', 'inuyasha_sig', { type: 'attack', big: true }, 25);
    e.atk = 900;
    const ev = runUntilAct(b, e.id);
    assert.ok(ev.bakuryuRet?.length === 1 || ev.results.every((r) => r.miss), 'ためた 大技は 返す');
  }
});

test('第82回 A ばくりゅうは: 返す ダメージの 上限（どんなに 大きな 大技でも 自分の 物理の cap 倍まで）', () => {
  const { b, me } = setup('bakuryuha', { weapon: 'iron_sword' });
  const f = b.enemies[0];
  const st = ABILITIES.bakuryuha_sig.effect;
  const cap = b.calcPhys(me, f, { mult: st.cap }, 1, 'phys', true).dmg;
  assert.equal(bakuryuDamage(b, me, f, 999999, st), Math.round(cap * (f.resist?.wind ?? 1)));
  assert.ok(bakuryuDamage(b, me, f, 10, st) <= 10);
});

test('第82回 A オート: 前ぶれに ばくりゅうはの かまえ・敵が 多いと 風の技・つめで HP が へると おすわり', () => {
  let bk = 0, wind = 0, osu = 0;
  for (let s = 1; s <= 20; s++) {
    const a = setup('inuyasha', { seed: s, weapon: 'iron_sword' });
    a.b.enemies[0].telegraph = 'm_nothing';
    if (ABILITIES[decideAlly(a.b, a.me).id]?.effect?.type === 'bakuryu') bk++;
    const w = setup('inuyasha', { seed: s, weapon: 'iron_sword' });
    if (ABILITIES[decideAlly(w.b, w.me).id]?.effect?.vsBuff) wind++;
    const c = setup('hanyo_boy', { seed: s });
    c.me.hp = Math.floor(c.me.maxHp * 0.4);
    const cmd = decideAlly(c.b, c.me);
    if ((cmd.id === 'hyb_osuwari' && cmd.target === c.me.id) || ABILITIES[cmd.id]?.effect?.parts?.some((p) => p.type === 'youkaiCalm')) osu++;
  }
  assert.ok(bk >= 12, `かまえ ${bk}`);
  assert.ok(wind >= 8, `風の技 ${wind}`);
  assert.ok(osu >= 6, `おすわり ${osu}`);
});

// ───────────── ひらめき技 ─────────────
test('第82回 A ひらめき技: 4つの 職業に 1つずつ・文字・その 職業で ひらめく', () => {
  const ids = Object.keys(HIRA_R82A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R82A).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R82A_ABILITIES[id].job === j).length, 1, j);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target]);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    for (const k of Object.keys(HIRAMEKI[id].from)) assert.ok(JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    const { b, c: ch, me } = setup(a.job, { seed: ++n, weapon: a.weapon === 'sword' ? 'iron_sword' : null });
    ch.hirameki = [id];
    me.abilities = [...me.abilities, id];
    readyUp(b, me);
    assert.equal(b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1').ok, true, id);
    const act = runUntilAct(b, me.id);
    assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
  }
});

// ───────────── 合体技・試練・ひとこと・乗り物 ─────────────
test('第82回 A: タグで 合体技に 入れる（3つ いじょう）・職業の試練・転職の ひとこと・乗り物（二またの大ねこ）', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(VEHICLES.twin_cat.jobs.includes(j));
  }
  for (const j of NEW.slice(1)) assert.ok(JOBS[j].tags.includes('sword') && JOBS[j].tags.includes('wind') && JOBS[j].tags.includes('monster'), j);
  for (const j of ['inuyasha', 'bakuryuha']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    const sk = phantomSkills(j);
    assert.ok(sk.length >= 3, j);
    assert.ok(!sk.some((id) => ['osuwari', 'youkaiCalm', 'daiyoukai', 'bakuryu'].includes(ABILITIES[id].effect.type)), 'まぼろしは かまえ などを 使わない');
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
  }
  const v = VEHICLES.twin_cat;
  textOk(v.name, 'v');
  textOk(v.desc, 'v');
  assert.ok(vehicleShelf({ job: 'hanyo_boy', jobs: { hanyo_boy: { lv: 1 } } }).includes('twin_cat'));
  assert.ok(!vehicleShelf({ job: 'warrior', jobs: { warrior: { lv: 1 } } }).includes('twin_cat'));
  for (const view of VIEWS) for (let f = 0; f < vehicleFrames('twin_cat'); f++) for (const layer of ['back', 'front']) {
    const p = paintVehicle('twin_cat', view, f, layer);
    assert.ok(p && p.px.filter(Boolean).length > 20, `${view} ${f} ${layer}`);
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
test('第82回 A 絵: 4つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・銀の かみと 犬の 耳・古い え', () => {
  assert.deepEqual(R82A_JOBS, NEW);
  for (const j of NEW) {
    assert.ok(R82A_OUTFIT[j] && R82A_BODY[j] && R82A_OLD_LOOK[j], j);
    assert.equal(jobBody(j).hair, 'inu82');
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, j, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${j} ${body} ${dir} ${res}`);
          assert.ok(!r.edge, `${j} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of JOBS[j].req || []) assert.notEqual(key(paintHero({ body, style: 'short' }, j, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${j} は ${from} と ちがう え`);
      }
      const o = lookToOpts({ body }, j, ',cloth,,');
      assert.ok(o.outfit, j);
      assert.ok(paintHuman('down', 0, o), j);
    }
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  for (const j of NEW) assert.equal(outfitOf(Lk, j, 'cloth', false).kind, 'hakama');
  assert.ok(!outfitOf(Lk, 'hanyo_boy', 'cloth', false).sheath, '半ようの少年は 刀を もたない');
  for (const j of NEW.slice(1)) assert.ok(outfitOf(Lk, j, 'cloth', false).sheath, `${j}: こしに 鉄さいが`);
  assert.ok(outfitOf(Lk, 'bakuryuha', 'cloth', false).cape, '伝説は 白い 毛皮の マント');
  // 犬の 耳: 銀の かみの 上に 耳の 分だけ 高く なる（いつもの ロングと くらべる）
  const top = (img) => { for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.rgba[(y * img.w + x) * 4 + 3]) return y; return img.h; };
  assert.ok(top(paintHero({ body: 0, style: 'long' }, 'hanyo_boy', undefined, 'down', 0, 8)) < top(paintHero({ body: 0, style: 'long' }, 'warrior', undefined, 'down', 0, 8)), '耳が 見える');
});

// ───────────── えんしゅつ・画面 ─────────────
test('第82回 A えんしゅつ: 看板の 技・技の えんしゅつ・ばくりゅうはで 返す えんしゅつ・音・つなぎ・こわれない', () => {
  const used = new Set(Object.keys(R82A_ABILITIES).map((id) => ABILITIES[id].anim));
  for (const anim of R82A_ANIMS) if (anim !== 'r82a_bakuryu') assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  for (const id of Object.keys(R82A_ABILITIES)) {
    const a = ABILITIES[id];
    if (['enemy', 'enemies'].includes(a.target) && !['bakuryu'].includes(a.effect.type)) assert.ok(R82A_ANIMS.has(a.anim), `${id}: ${a.anim}`);
  }
  assert.deepEqual([...R82A_SIGS].sort(), ['hanyo_boy_sig', 'tessaiga_user_sig']);
  assert.deepEqual(Object.keys(R82A_SFX).sort(), [...R82A_ANIMS].sort());
  assert.deepEqual(Object.keys(R82A_HIT).sort(), [...R82A_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R82A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R82A_FINE)) assert.ok(k.startsWith('e82'), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R82A_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R82A_HIT\)/);
  assert.match(battle, /r82aPresent\(this, ev, hitDelay\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR82aFx\(this, anim/);
  assert.match(src, /Object\.assign\(FINE, R82A_FINE\)/);
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R82A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR82aFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R82A_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R82A_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      for (let i = 0; i < 60; i++) fx.update(40);
      assert.equal(fx.parts.length, 0, `${anim} が おわらない`);
    }
  }
  assert.equal(playR82aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.deepEqual(r82aMarks({ side: 'ally', youkai: 0, osuwari: false, stance: 'bakuryu' }).map((x) => x.text), ['かまえ']);
  assert.deepEqual(r82aMarks({ side: 'enemy', youkai: 1 }), []);
  for (const m of [{ youkai: 1 }, { youkai: 2 }, { osuwari: true }]) for (const x of r82aMarks({ side: 'ally', ...m })) textOk(x.text, 'mark');
  const files = gameFiles();
  for (const f of ['jobs-r82a.js', 'abilities-r82a.js', 'hirameki-r82a.js', 'battle-r82a.js', 'battlefx-r82a.js', 'client/battle-r82a.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

// ───────────── 2つの 系統が 同じ パーティー（第82回 A・B） ─────────────
test('第82回 A と B: 犬夜しゃの 系統と YAIBA の 系統が 同じ 戦いに いても、ようかい化・ばくりゅうは・玉がえ・四つ玉斬りが おたがいを こわさない', () => {
  const mk = (id, name, job, weapon) => {
    const c = newCharacter({ id, name, job: 'warrior' });
    gainExp(c, expForLevel(50));
    master(c, ...NEW, 'samurai_kid', 'raijin_sword', 'yaiba', 'ryujin_samurai', 'god_hand');
    c.job = job;
    c.equip.weapon = weapon;
    fullHeal(c);
    return c;
  };
  const run = (inuJob, inuWeapon, seed) => {
    const inu = mk('p1', 'ソラ', inuJob, inuWeapon);
    const yb = mk('p2', 'ミナ', 'yaiba', 'iron_sword');
    const b = new Battle({ rng: makeRng(seed), allies: [{ char: inu, controller: 's1' }, { char: yb, controller: 's2' }], enemies: ['rockman', 'skeleton'], canFlee: true });
    for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
    for (const a of b.allies) a.mp = a.maxMp = 999;
    return { b, inu: b.allies[0], yb: b.allies[1] };
  };
  const cmdOf = (b, a, cmd, who) => {
    for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50);
    assert.equal(b.command(a.id, cmd, who).ok, true, JSON.stringify(cmd));
    return runUntilAct(b, a.id);
  };
  // 1) つめの 半ようの少年が ようかい化して あばれる 間も、ヤイバは 命令できて 玉がえ・四つ玉斬りが 出る
  {
    const { b, inu, yb } = run('hanyo_boy', null, 31);
    inu.hp = Math.floor(inu.maxHp * 0.2);
    const tg = cmdOf(b, yb, { type: 'ability', id: 'yb_tamagae', tama: 'fire' }, 's2');
    assert.equal(yb.tama, 'fire');
    for (const l of tg.lines) textOk(l, 'tamagae');
    const evs = [];
    for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === inu.id); i++) evs.push(...b.tick(50));
    assert.equal(inu.youkai, true, 'ようかい化');
    assert.ok(!evs.some((e) => e.t === 'ready' && e.id === inu.id), '犬夜しゃの 系統には コマンドが 出ない');
    assert.equal(!!yb.youkai, false, 'ヤイバは ようかい化しない');
    const sig = cmdOf(b, yb, { type: 'ability', id: 'yaiba_sig', target: b.enemies[0].id }, 's2');
    assert.ok(sig.results.filter((r) => r.dmg > 0).length >= 3, '四つ玉斬り');
    assert.equal(yb.tama, 'fire', '玉は のこる');
    assert.equal(pub(yb).youkai, 0);
    assert.equal(pub(inu).youkai, 1);
  }
  // 2) 刀の 犬夜しゃが ばくりゅうはの かまえ → 敵の 呪文を 返す。ヤイバの 玉・剣の 技は そのまま
  {
    const { b, inu, yb } = run('inuyasha', 'iron_sword', 32);
    cmdOf(b, yb, { type: 'ability', id: 'yb_tamagae', tama: 'ice' }, 's2');
    cmdOf(b, inu, { type: 'ability', id: 'inuyasha_sig', target: b.enemies[0].id }, 's1');
    assert.equal(inu.stance?.kind, 'bakuryu');
    const e = b.enemies[0];
    e.mag = 999;
    b.queue.unshift({ id: e.id, cmd: { type: 'ability', id: SPELL, target: inu.id }, last: false });
    const ret = runUntilAct(b, e.id);
    assert.equal(ret.bakuryuRet?.length, 1, 'ばくりゅうはで 返す');
    const z = cmdOf(b, yb, { type: 'ability', id: 'yb_zokusei', target: b.enemies[1].id }, 's2');
    assert.ok(z.results.some((r) => r.dmg > 0 && r.element === 'ice'), '玉の 属性の まま');
    assert.ok(yb.stance?.kind !== 'bakuryu', 'ヤイバに かまえは うつらない');
    // オートでも 両方 こわれない
    for (let i = 0; i < 8; i++) {
      assert.ok(decideAlly(b, inu)?.type);
      assert.ok(decideAlly(b, yb)?.type);
    }
  }
});
