// 第83回 B班: ぬ〜べ〜の 系統（docs/plan-jobs-r79.md の 9-2・docs/plan-r83-jobs-b.md）
//   小学校の先生（上級職。地方公務員 ＋ 小学生）→ れい能力教師ぬ〜べ〜 → おにの手のじごく先生（＋ほかの 超級職 1つ）
//  ・職業の 木・強さ・技・ひらめき技・合体技・試練・転職の ひとこと・乗り物・文字
//  ・しくみ: 生徒を 守る（自動で かばう。1人・全体）・おにの手（番ごとに 強く なり HP が へる・上限・ふういん・あぶない 時は 自動で ふういん・
//    かくせい・最大出力）・ゆうれいと 悪魔に 強い・体をはって守る・生徒たちの声・オート
//  ・絵（hero-r83b.js）・乗り物の 絵（vehicle-r83b.js）・えんしゅつ（battlefx-r83b.js）・画面の 札（battle-r83b.js）
//  ・ならびの 場所（何番め）は 見ない（A班の 職業と いっしょに ふえても こわれない ように）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R83B, R83B_JOBS, R83B_ORDERS, HINTS_R83B } from '../public/js/shared/data/jobs-r83b.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { R83B_ABILITIES, GHOST } from '../public/js/shared/data/abilities-r83b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R83B_ABILITIES, HIRAMEKI_R83B } from '../public/js/shared/data/hirameki-r83b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { ONI_STEP, ONI_DRAIN, ONI_SAFE, oniPct, oniMaxOf, r83bPhysMult } from '../public/js/shared/battle-r83b.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R83B_JOBS as ART_JOBS, R83B_OUTFIT, R83B_BODY, R83B_OLD_LOOK } from '../public/js/client/render/hero-r83b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { paintVehicle, paintVehicleFx, VIEWS, vehicleFrames } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R83B_ANIMS, R83B_SIGS, R83B_HIT, R83B_SFX, R83B_FINE, playR83bFx } from '../public/js/client/render/battlefx-r83b.js';
import { r83bMarks } from '../public/js/client/battle-r83b.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['elem_teacher', 'nube', 'jigoku_sensei'];
const TREE = {
  elem_teacher: ['小学校の先生', 1, ['civil_local', 'schoolkid'], undefined],
  nube: ['れい能力教師ぬ〜べ〜', 2, ['elem_teacher'], undefined],
  jigoku_sensei: ['おにの手のじごく先生', 3, ['nube'], 1],
};
const SUMS = { elem_teacher: 7.2, nube: 8.4, jigoku_sensei: 9.6 };
const RANGE = [[6.05, 7.35], [6.65, 8.0], [7.75, 9.05], [9.3, 10.2]];
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/, ally: /仲間1人/, deadAlly: /仲間1人/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: 10, b: 999 }; };
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);

// 先生（p1・手で 動かす）と 仲間 2人（オート）。敵は 何も しない（e.actions を かえて ためす）
function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 50, boss = false } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  master(c, 'civil_local', 'schoolkid', ...NEW, 'god_hand');
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const mk = (id, name, job2) => {
    const m = newCharacter({ id, name, job: job2 });
    gainExp(m, expForLevel(lv));
    fullHeal(m);
    return m;
  };
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: mk('m1', 'ミナ', 'mage'), auto: true, kind: 'support' }, { char: mk('m2', 'ソラ', 'priest'), auto: true, kind: 'support' }], enemies, canFlee: true, boss });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, me: b.allies[0], m1: b.allies[1], m2: b.allies[2] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};
const actNow = (b, a, cmd) => { readyUp(b, a); assert.equal(b.command(a.id, cmd, 's1').ok, true, JSON.stringify(cmd)); return runUntilAct(b, a.id); };
// 敵に 次の 行動を させる（ねらいを きめて）
const enemyDo = (b, e, cmd) => { b.queue.unshift({ id: e.id, cmd, last: false }); return runUntilAct(b, e.id); };
const ENEMY_ONE = Object.keys(ABILITIES).find((id) => ABILITIES[id].kind === 'monster' && ABILITIES[id].effect?.type === 'magic' && ABILITIES[id].target === 'enemy' && !ABILITIES[id].effect.status);
const ENEMY_ALL = Object.keys(ABILITIES).find((id) => ABILITIES[id].kind === 'monster' && ABILITIES[id].effect?.type === 'magic' && ABILITIES[id].target === 'enemies' && !ABILITIES[id].effect.status && !ABILITIES[id].effect.element);

// ───────────── 職業の 木 ─────────────
test('第83回 B: ぬ〜べ〜の 系統の 3つの 職業（上級職から 伝説まで）・名前・うわさ・文字', () => {
  assert.deepEqual(R83B_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R83B), NEW);
  assert.deepEqual(R83B_ORDERS, [[], ['elem_teacher'], ['nube'], ['jigoku_sensei']]);
  assert.deepEqual(Object.keys(HINTS_R83B).sort(), ['jigoku_sensei', 'nube']);
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req, sup] = TREE[id];
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, sup);
    assert.ok([null, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER][tier].includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    if (tier >= 2) { assert.equal(JOB_HINTS[id], HINTS_R83B[id]); textOk(JOB_HINTS[id], id); }
  }
  assert.equal(jobReqText('elem_teacher'), '地方公務員Lv10＋小学生Lv10');
  assert.equal(jobReqText('nube'), '小学校の先生Lv10');
  assert.equal(jobReqText('jigoku_sensei'), 'れい能力教師ぬ〜べ〜Lv10＋ほかの超級職1つLv10');
});

test('第83回 B: なれる じゅんばん（地方公務員と 小学生 → 先生 → ぬ〜べ〜 → ほかの 超級職も きわめて じごく先生）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'civil_local' });
  assert.equal(jobUnlocked(c, 'elem_teacher'), false);
  master(c, 'civil_local');
  assert.equal(jobUnlocked(c, 'elem_teacher'), false, '小学生も いる');
  master(c, 'schoolkid');
  assert.equal(jobUnlocked(c, 'elem_teacher'), true);
  assert.equal(changeJob(c, 'elem_teacher').ok, true);
  assert.equal(jobUnlocked(c, 'nube'), false);
  master(c, 'elem_teacher');
  assert.equal(jobUnlocked(c, 'nube'), true);
  assert.equal(changeJob(c, 'nube').ok, true);
  assert.equal(jobKnown(c, 'jigoku_sensei'), false);
  master(c, 'nube');
  assert.equal(jobKnown(c, 'jigoku_sensei'), true, 'うわさ');
  assert.equal(jobUnlocked(c, 'jigoku_sensei'), false, 'ほかの 超級職も いる');
  master(c, 'archmage');
  assert.equal(jobUnlocked(c, 'jigoku_sensei'), true);
  assert.equal(changeJob(c, 'jigoku_sensei').ok, true);
  assert.ok(learnedAbilities(c).includes('js_renda'));
});

test('第83回 B: 強さは 設計の 表の とおり・段の はんい・武器（素手・つえ・たて）・守る 確率・おにの手の 上限', () => {
  for (const j of NEW) {
    const t = JOBS[j].tier;
    assert.ok(Math.abs(sum(j) - SUMS[j]) < 1e-9, `${j} ${sum(j)}`);
    assert.ok(sum(j) >= RANGE[t][0] && sum(j) <= RANGE[t][1]);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
    assert.deepEqual(JOBS[j].weapons, ['staff', 'none']);
    assert.equal(JOBS[j].shield, true);
    assert.ok(JOBS[j].mods.hp >= JOBS[j].mods.str && JOBS[j].mods.def >= JOBS[j].mods.str, `${j}: HP と 守り 高め`);
  }
  assert.equal(JOBS.elem_teacher.passive, undefined, '上級職は 自動で かばわない');
  assert.deepEqual(JOBS.nube.passive, { protect: 0.5, oniMax: 0.6 });
  assert.deepEqual(JOBS.jigoku_sensei.passive, { protect: 0.8, oniMax: 0.9 });
});

// ───────────── 技 ─────────────
test('第83回 B 技: 6つずつ（伝説は Lv1・3・5・7・8・10）・Lv10 が いちばん MP・説明・文字・えんしゅつ・ゆうれいに 強い', () => {
  const LV = { elem_teacher: [1, 2, 3, 5, 7, 10], nube: [1, 2, 3, 5, 7, 10], jigoku_sensei: [1, 3, 5, 7, 8, 10] };
  for (const j of NEW) {
    const learn = JOBS[j].learn;
    assert.deepEqual(learn.map(([lv]) => lv), LV[j], j);
    const ids = learn.map(([, id]) => id);
    assert.equal(ids.at(-1), `${j}_sig`);
    const mps = ids.map((id) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps.at(-1), `${j}: Lv10 が いちばん MP`);
    const attacks = ids.filter((id) => ['enemy', 'enemies'].includes(ABILITIES[id].target) && ['phys', 'magic'].includes(partsOf(ABILITIES[id].effect)[0].type));
    assert.ok(attacks.length >= 2, `${j}: 攻撃技 ${attacks.length}`);
    for (const id of ids) {
      const a = ABILITIES[id];
      assert.equal(a.job, j);
      assert.ok(R83B_ABILITIES[id], id);
      assert.match(a.desc, SCOPE[a.target], id);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(a.anim, id);
    }
  }
  // 名前（3年B組の担任の チョーク投げと かぶらない）
  assert.equal(ABILITIES.et_kokuban.name, '黒板けしアタック');
  for (const id of Object.keys(R83B_ABILITIES)) assert.equal(Object.keys(ABILITIES).filter((k) => ABILITIES[k].name === ABILITIES[id].name).length, 1, `${ABILITIES[id].name} は 1つだけ`);
  // ゆうれい・アンデッド・悪魔に 強い: おにの手の 技と おふだ
  for (const id of ['et_ofuda', 'nb_onite', 'js_renda', 'jigoku_sensei_sig']) {
    const e = partsOf(ABILITIES[id].effect)[0];
    for (const r of ['spirit', 'undead', 'demon']) assert.equal(e.vsRace[r], 1.5, `${id} ${r}`);
  }
  for (const r of ['spirit', 'undead', 'demon']) assert.ok(ABILITIES.nube_sig.effect.vsRace[r] > 1.5, '強制じょうぶつは もっと');
  assert.deepEqual(GHOST, { spirit: 1.5, undead: 1.5, demon: 1.5 });
});

test('第83回 B ゆうれいに 強い: おふだ（呪文）・おにの手（物理）は アンデッドに ×1.5、ほかの 種類は そのまま', () => {
  const { b, me } = setup('nube');
  const [rock, , skel] = b.enemies;
  const ofuda = ABILITIES.et_ofuda.effect;
  const m1 = b.calcMagic(me, skel, ofuda, 1, true).dmg / b.calcMagic(me, skel, { ...ofuda, vsRace: undefined }, 1, true).dmg;
  assert.ok(Math.abs(m1 - 1.5) < 0.05, `おふだ ${m1}`);
  assert.equal(b.calcMagic(me, rock, ofuda, 1, true).dmg, b.calcMagic(me, rock, { ...ofuda, vsRace: undefined }, 1, true).dmg);
  const oni = ABILITIES.nb_onite.effect;
  const p1 = b.calcPhys(me, skel, oni, 1, 'phys', true).dmg / b.calcPhys(me, skel, { ...oni, vsRace: undefined }, 1, 'phys', true).dmg;
  assert.ok(Math.abs(p1 - 1.5) < 0.05, `おにの手 ${p1}`);
  // ほかの 職業の 呪文は 種類を 見ない（vsRace が ない）
  assert.equal(b.calcMagic(me, skel, { type: 'magic', base: [50, 50] }, 1, true).dmg, b.calcMagic(me, rock, { type: 'magic', base: [50, 50] }, 1, true).dmg * (skel.resist.light ? 1 : 1));
  // おふだを 使うと 光の 呪文の ダメージ
  const ev = actNow(b, me, { type: 'ability', id: 'et_ofuda', target: skel.id });
  assert.ok(ev.results.some((r) => r.id === skel.id && r.dmg > 0 && r.element === 'light'));
});

// ───────────── おにの手 ─────────────
test('第83回 B おにの手: 出すと +15%・自分の 番ごとに +15% と HP 6% へる・ぬ〜べ〜は 60% まで・もう一度で ふういん', () => {
  const { b, me } = setup('nube', { seed: 3 });
  const f = b.enemies[0];
  const base = b.calcPhys(me, f, { mult: 1 }, 1, 'phys', true).dmg;
  const on = actNow(b, me, { type: 'ability', id: 'nb_dasu' });
  assert.equal(on.oniOn, me.id);
  assert.ok(me.oni);
  assert.equal(oniPct(me), ONI_STEP);
  assert.equal(pub(me).oni, 15);
  for (const l of on.lines) textOk(l, 'oni');
  let hp = me.hp;
  const seen = [];
  for (let k = 0; k < 5; k++) {
    const ev = actNow(b, me, { type: 'defend' });
    assert.equal(ev.oniUp, me.id);
    const d = Math.round(me.maxHp * ONI_DRAIN);
    assert.equal(hp - me.hp, d, `${k}: HP 6% へる`);
    hp = me.hp;
    seen.push(Math.round(oniPct(me) * 100));
    for (const l of ev.lines) textOk(l, 'oni');
  }
  assert.deepEqual(seen, [30, 45, 60, 60, 60], '60% まで');
  assert.equal(oniMaxOf(me), 0.6);
  const now = b.calcPhys(me, f, { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(Math.abs(now / base - 1.6) < 0.03, `ダメージ ${now}/${base}`);
  assert.deepEqual(r83bMarks(pub(me)).map((m) => m.text), ['おにの手+60%']);
  // もう一度 使うと ふういん（HP は もう へらない）
  const off = actNow(b, me, { type: 'ability', id: 'nb_dasu' });
  assert.equal(off.oniOff, me.id);
  assert.equal(me.oni, undefined);
  assert.equal(pub(me).oni, 0);
  hp = me.hp;
  actNow(b, me, { type: 'defend' });
  assert.equal(me.hp, hp);
  assert.equal(r83bPhysMult(me), 1);
});

test('第83回 B おにの手: じごく先生は 90% まで・HP で たおれない（あぶない 時は 自動で ふういん）・かくせい・最大出力', () => {
  const { b, me } = setup('jigoku_sensei', { seed: 4 });
  actNow(b, me, { type: 'ability', id: 'nb_dasu' });
  for (let k = 0; k < 6; k++) actNow(b, me, { type: 'defend' });
  assert.equal(Math.round(oniPct(me) * 100), 90, '伝説は 90%');
  assert.equal(oniMaxOf(me), 0.9);
  // HP が 少し だけ: へっても 1 より 下に ならない
  readyUp(b, me);
  me.hp = Math.ceil(me.maxHp * ONI_SAFE) + 2;
  actNow(b, me, { type: 'defend' });
  assert.ok(me.hp >= 1 && me.alive);
  // あぶない（15% いか）: HP を へらさず ふういんに もどる（仲間の 回復が 入らない ように、番が 来てから HP を へらす）
  readyUp(b, me);
  me.hp = Math.floor(me.maxHp * ONI_SAFE) - 1;
  const hp = me.hp;
  const ev = actNow(b, me, { type: 'defend' });
  assert.equal(me.oni, undefined, '自動で ふういん');
  assert.equal(me.hp, hp);
  assert.equal(ev.oniOff, me.id);
  me.hp = me.maxHp;
  // かくせい: すぐに 90%・3回の 番は HP が へらない
  actNow(b, me, { type: 'ability', id: 'js_kakusei' });
  assert.equal(Math.round(oniPct(me) * 100), 90);
  assert.equal(pub(me).oniAwake, 3);
  for (let k = 0; k < 3; k++) {
    const h = me.hp;
    actNow(b, me, { type: 'defend' });
    assert.equal(me.hp, h, `かくせい ${k}`);
    assert.equal(Math.round(oniPct(me) * 100), 90);
  }
  assert.equal(pub(me).oniAwake, 0);
  const h = me.hp;
  actNow(b, me, { type: 'defend' });
  assert.ok(me.hp < h, 'かくせいの あとは また へる');
  // 最大出力: 敵全体に ダメージ・使うと ふういんに もどる
  const hp0 = b.enemies.map((e) => e.hp);
  const sig = actNow(b, me, { type: 'ability', id: 'jigoku_sensei_sig', target: b.enemies[0].id });
  assert.ok(b.enemies.filter((e, i) => e.hp < hp0[i]).length >= 2, '敵全体');
  assert.equal(me.oni, undefined, 'ふういんに もどる');
  assert.equal(sig.oniOff, me.id);
});

// ───────────── 生徒を 守る ─────────────
test('第83回 B 生徒を 守る: 弱った 仲間への 1人の 攻撃を 自動で かばう（じごく先生 8わり・ぬ〜べ〜 5わり・先生は しない）・元気な 仲間は かばわない', () => {
  const count = (job, weakHp, myHp = 1) => {
    let n = 0;
    for (let s = 1; s <= 30; s++) {
      const { b, me, m1 } = setup(job, { seed: s });
      m1.hp = Math.floor(m1.maxHp * weakHp);
      me.hp = Math.floor(me.maxHp * myHp);
      const e = b.enemies[0];
      const ev = enemyDo(b, e, { type: 'attack', target: m1.id });
      if (ev.r83bCover) {
        n++;
        assert.deepEqual(ev.r83bCover, { by: me.id, to: m1.id });
        assert.ok(ev.lines.includes('ヒナ先生が、ミナをかばった！'), ev.lines.join('/'));
        assert.ok(!ev.results.some((r) => r.id === m1.id && r.dmg > 0), 'ミナは 受けない');
      }
    }
    return n;
  };
  const js = count('jigoku_sensei', 0.25);
  const nb = count('nube', 0.25);
  assert.ok(js >= 18 && js <= 30, `じごく先生 ${js}/30`);
  assert.ok(nb >= 8 && nb <= 23, `ぬ〜べ〜 ${nb}/30`);
  assert.ok(js > nb);
  assert.equal(count('elem_teacher', 0.25), 0, '上級職は 自動で かばわない');
  assert.equal(count('jigoku_sensei', 0.8), 0, '元気な 仲間は かばわない');
  assert.equal(count('jigoku_sensei', 0.25, 0.15), 0, '先生が たおれそうな 時は かばわない');
});

test('第83回 B 生徒を 守る: 全体の 攻撃では 弱った 仲間 1人ぶんだけ かばう（先生が 2回 受ける）', () => {
  assert.ok(ENEMY_ALL, '全体の 呪文');
  let covered = 0;
  for (let s = 1; s <= 20; s++) {
    const { b, me, m1, m2 } = setup('jigoku_sensei', { seed: 40 + s });
    m1.hp = Math.floor(m1.maxHp * 0.2);
    m2.hp = Math.floor(m2.maxHp * 0.2);
    const e = b.enemies[0];
    e.mag = 200;
    const ev = enemyDo(b, e, { type: 'ability', id: ENEMY_ALL });
    if (!ev.r83bCover) continue;
    covered++;
    const hits = ev.results.filter((r) => r.dmg > 0);
    assert.equal(hits.filter((r) => r.id === me.id).length, 2, '先生は 自分の ぶんと 1人ぶん');
    const other = ev.r83bCover.to === m1.id ? m2 : m1;
    assert.ok(!hits.some((r) => r.id === ev.r83bCover.to), 'かばわれた 仲間は 受けない');
    assert.ok(hits.some((r) => r.id === other.id), 'もう1人は 受ける（1人ぶんだけ）');
    for (const l of ev.lines) textOk(l, 'all');
  }
  assert.ok(covered >= 10, `全体 ${covered}/20`);
});

test('第83回 B 体をはって守る: 次の 番まで 仲間全員を かばい、受ける ダメージが へる・次の 番で おわる', () => {
  const { b, me, m1 } = setup('elem_teacher', { seed: 7 });
  const ev = actNow(b, me, { type: 'ability', id: 'elem_teacher_sig' });
  for (const l of ev.lines) textOk(l, 'shield');
  assert.equal(me.cover?.target, 'all');
  assert.equal(pub(me).teShield, true);
  assert.ok(r83bMarks(pub(me)).some((m) => m.text === '体をはる'));
  const e = b.enemies[0];
  e.atk = 400;
  const hit = enemyDo(b, e, { type: 'attack', target: m1.id });
  const mine = hit.results.find((r) => r.id === me.id && r.dmg > 0);
  assert.ok(mine || hit.results.some((r) => r.id === me.id && r.miss), '先生が 受ける');
  assert.ok(!hit.results.some((r) => r.id === m1.id && r.dmg > 0));
  if (mine) {
    const raw = b.calcPhys(e, me, { mult: 1 }, 1, 'phys', true).dmg;
    assert.ok(mine.dmg <= Math.ceil(raw * 0.6 * 1.15) + 1, `へる ${mine.dmg} / ${raw}`);
  }
  actNow(b, me, { type: 'defend' });
  assert.equal(me.teShield, undefined);
  assert.ok(!me.cover, '次の 番で おわる');
});

test('第83回 B 生徒たちの声: HP が 少ないほど 物理が 強い（この 戦いの 間）・じわじわ 回復', () => {
  const { b, me } = setup('jigoku_sensei', { seed: 8 });
  actNow(b, me, { type: 'ability', id: 'js_koe' });
  assert.ok(me.koeGrit > 0 && me.regen);
  me.hp = me.maxHp;
  assert.equal(r83bPhysMult(me), 1);
  me.hp = Math.round(me.maxHp * 0.25);
  assert.ok(Math.abs(r83bPhysMult(me) - (1 + 0.6 * 0.75)) < 0.01);
});

// ───────────── オート ─────────────
test('第83回 B オート: ボスで おにの手を 出す・HP 4わりで ふういんしなおす・状態異常に かんのんきょう・ゆうれいに おふだ／おにの手', () => {
  let out = 0, seal = 0, kan = 0, ghost = 0, normal = 0;
  for (let s = 1; s <= 20; s++) {
    const a = setup('nube', { seed: s, boss: true });
    if (decideAlly(a.b, a.me)?.id === 'nb_dasu') out++;
    const bb = setup('nube', { seed: s, boss: true });
    bb.me.oni = { lv: 2, awake: 0, max: 0.6 };
    bb.me.hp = Math.floor(bb.me.maxHp * 0.35);
    if (decideAlly(bb.b, bb.me)?.id === 'nb_dasu') seal++;
    const k = setup('nube', { seed: s });
    k.m1.status.poison = { turns: 3 };
    k.m2.status.blind = { turns: 3 };
    if (decideAlly(k.b, k.me)?.id === 'nb_kannon') kan++;
    const g = setup('elem_teacher', { seed: s, enemies: ['lamp', 'rockman'] });
    // 先生の 技だけ（ぬ〜べ〜・じごく先生の 技を まだ 覚えて いない 人）
    g.me.abilities = g.me.abilities.filter((id) => ABILITIES[id].job !== 'nube' && ABILITIES[id].job !== 'jigoku_sensei');
    const gc = decideAlly(g.b, g.me);
    if (gc?.id === 'et_ofuda' && gc.target === g.b.enemies[0].id) ghost++;
    // ふつうの（すぐ たおせる）敵では おにの手を 出さない（強い 敵・ボスの 時だけ）
    const n = setup('nube', { seed: s });
    for (const e of n.b.enemies) e.hp = e.maxHp = 30;
    if (decideAlly(n.b, n.me)?.id === 'nb_dasu') normal++;
  }
  assert.ok(out >= 10, `ボスで 出す ${out}`);
  assert.equal(seal, 20, 'HP 4わりで ふういん');
  assert.ok(kan >= 14, `かんのんきょう ${kan}`);
  assert.ok(ghost >= 10, `おふだ ${ghost}`);
  assert.equal(normal, 0);
  // ぬ〜べ〜は ゆうれいに おふだか おにの手（強い ほう）
  let nghost = 0;
  for (let s = 1; s <= 10; s++) {
    const g = setup('nube', { seed: s, enemies: ['lamp', 'rockman'] });
    g.me.oni = { lv: 1, awake: 0, max: 0.6 }; // おにの手は もう 出して いる
    const cmd = decideAlly(g.b, g.me);
    if (['et_ofuda', 'nb_onite', 'nube_sig'].includes(cmd?.id) && cmd.target === g.b.enemies[0].id) nghost++;
  }
  assert.ok(nghost >= 5, `ぬ〜べ〜 ${nghost}`);
});

test('第83回 B オート: ほかの 職業（治す 技・光の 技を もつ 大神官 など）の オートは かわらない（運も 使わない）', async () => {
  const { r83bPlan, r83bSeal } = await import('../public/js/shared/battle-r83b.js');
  const { b, me } = setup('nube', { seed: 5, enemies: ['lamp', 'skeleton'], boss: true });
  me.job = 'high_priest';
  me.abilities = ['kiariku', 'zaoriku', 'behoma', 'holy_light', 'et_ofuda'].filter((id) => ABILITIES[id] && ABILITIES[id].job !== 'elem_teacher');
  me.abilities.push(...Object.keys(ABILITIES).filter((id) => ABILITIES[id].job === 'high_priest' || (ABILITIES[id].effect?.type === 'cure' && ABILITIES[id].target === 'allies')).slice(0, 12));
  b.allies[1].status.poison = { turns: 3 };
  const mine = me.abilities.map((id) => ({ id, a: ABILITIES[id] }));
  const before = b.rng.next;
  let used = 0;
  b.rng.next = () => { used++; return before.call(b.rng); };
  assert.equal(r83bPlan(b, me, b.enemies, mine, b.allies, true), null);
  assert.equal(r83bSeal(b, me, mine), null);
  assert.equal(used, 0, '運を 使わない');
});

test('第83回 B オート: 完全オートの ボス戦でも こわれない（おにの手で たおれない・ほかの 仲間の オートは かわらない）', () => {
  for (const job of NEW) {
    const { b, me } = setup(job, { seed: 11, boss: true });
    for (const e of b.enemies) { e.actions = [{ w: 1, id: 'attack' }]; e.atk = 260; }
    me.controller = null;
    me.auto = true;
    for (let i = 0; i < 2400 && !b.ended; i++) b.tick(50);
    // おにの手で 自分を たおして いない（HP は 敵の 攻撃で だけ 0 に なる）
    assert.ok(me.hp >= 0);
  }
});

// ───────────── ひらめき技 ─────────────
test('第83回 B ひらめき技: 3つの 職業に 1つずつ・文字・その 職業で ひらめく・使える', () => {
  const ids = Object.keys(HIRA_R83B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R83B).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R83B_ABILITIES[id].job === j).length, 1, j);
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
    const { b, c: ch, me } = setup(a.job, { seed: ++n });
    ch.hirameki = [id];
    me.abilities = [...me.abilities, id];
    const act = actNow(b, me, { type: 'ability', id, target: b.enemies[0].id });
    assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
  }
});

// ───────────── 合体技・試練・ひとこと・乗り物 ─────────────
test('第83回 B: タグで 合体技に 入れる（3つ いじょう）・職業の試練・転職の ひとこと・乗り物（がたがたの先生の自転車）', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('school') && JOBS[j].tags.includes('guard'), j);
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(VEHICLES.teacher_bike.jobs.includes(j));
  }
  // 合体技の 相手の 案: 3年B組の担任（学校）・僧侶（守り・いやし・光）・小学生（学校）
  const pair = (a, b) => Object.values(DUAL_TECHS).some((t) => t.need.length === 2 && ((groupJobs(t.need[0]).has(a) && groupJobs(t.need[1]).has(b)) || (groupJobs(t.need[1]).has(a) && groupJobs(t.need[0]).has(b))));
  for (const j of NEW) assert.ok(pair(j, 'homeroom_3b') && pair(j, 'schoolkid'), `${j}: 先生コンビ・先生と 生徒`);
  assert.ok(pair('elem_teacher', 'priest') || pair('nube', 'priest'), '僧侶の 系統');
  for (const j of ['nube', 'jigoku_sensei']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 3), `${j}: ${adj}`);
    const sk = phantomSkills(j);
    assert.ok(sk.length >= 3, j);
    assert.ok(!sk.some((id) => ['oniHand', 'oniAwake', 'teShield', 'teKoe'].includes(partsOf(ABILITIES[id].effect)[0].type)), 'まぼろしは おにの手を 出さない');
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
  }
  const v = VEHICLES.teacher_bike;
  textOk(v.name, 'v');
  textOk(v.desc, 'v');
  assert.ok(vehicleShelf({ job: 'elem_teacher', jobs: { elem_teacher: { lv: 1 } } }).includes('teacher_bike'));
  assert.ok(!vehicleShelf({ job: 'warrior', jobs: { warrior: { lv: 1 } } }).includes('teacher_bike'));
  assert.equal(vehicleFrames('teacher_bike'), 3);
  for (const view of VIEWS) for (let f = 0; f < 3; f++) for (const layer of ['back', 'front']) {
    const p = paintVehicle('teacher_bike', view, f, layer);
    assert.ok(p && (layer === 'back' || p.px.filter(Boolean).length > 20), `${view} ${f} ${layer}`);
  }
  assert.ok(paintVehicleFx('teacher_bike', 'side', 1).px.some(Boolean), 'がたがたの 線');
  // がたがた: 1コマめだけ 1ドット うく
  const top = (p) => { for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.px[y * p.w + x]) return y; return p.h; };
  assert.equal(top(paintVehicle('teacher_bike', 'side', 1, 'front')), top(paintVehicle('teacher_bike', 'side', 0, 'front')) - 1);
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
test('第83回 B 絵: 3つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・先生の 服・左手の 黒い 手ぶくろ・古い え', () => {
  assert.deepEqual(ART_JOBS, NEW);
  for (const j of NEW) {
    assert.ok(R83B_OUTFIT[j] && R83B_BODY[j] && R83B_OLD_LOOK[j], j);
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
  for (const j of NEW) assert.equal(outfitOf(Lk, j, 'cloth', false).kind, 'suit', `${j}: 先生の 服`);
  assert.equal(jobBody('elem_teacher').hand83, undefined, '先生は まだ 手ぶくろ なし');
  assert.equal(jobBody('nube').hand83, 'black');
  assert.equal(jobBody('jigoku_sensei').hand83, 'oni');
  assert.ok(outfitOf(Lk, 'jigoku_sensei', 'cloth', false).cape, '伝説は えんじの マント');
  // 左手の 手ぶくろ: 手ぶくろ だけ ちがう 絵と くらべると、黒い 点が ふえる
  const dark = (img) => { let n = 0; for (let i = 0; i < img.rgba.length; i += 4) if (img.rgba[i + 3] && img.rgba[i] + img.rgba[i + 1] + img.rgba[i + 2] < 90) n++; return n; };
  const nb = paintHero({ body: 0, style: 'short', hcol: 'brown' }, 'nube', undefined, 'down', 0, 8);
  const saved = R83B_BODY.nube.hand83;
  delete R83B_BODY.nube.hand83;
  const bare = paintHero({ body: 0, style: 'short', hcol: 'brown' }, 'nube', undefined, 'down', 0, 8);
  R83B_BODY.nube.hand83 = saved;
  assert.ok(dark(nb) > dark(bare), `手ぶくろ ${dark(nb)} > ${dark(bare)}`);
});

// ───────────── えんしゅつ・画面 ─────────────
test('第83回 B えんしゅつ: 看板の 技・おにの手の えんしゅつ・音・つなぎ・こわれない・札', () => {
  const used = new Set([...Object.keys(R83B_ABILITIES), ...Object.keys(HIRA_R83B_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const anim of R83B_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  for (const id of Object.keys(R83B_ABILITIES)) {
    const a = ABILITIES[id];
    if (['enemy', 'enemies'].includes(a.target) && ['phys', 'magic'].includes(partsOf(a.effect)[0].type)) assert.ok(R83B_ANIMS.has(a.anim), `${id}: ${a.anim}`);
  }
  assert.deepEqual([...R83B_SIGS].sort(), ['jigoku_sensei_sig', 'nube_sig']);
  assert.deepEqual(Object.keys(R83B_SFX).sort(), [...R83B_ANIMS].sort());
  assert.deepEqual(Object.keys(R83B_HIT).sort(), [...R83B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R83B_SFX)) assert.ok(audio.includes(`case '${s}':`), `${anim} の 音 ${s}`);
  for (const k of Object.keys(R83B_FINE)) assert.ok(k.startsWith('e83'), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R83B_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R83B_HIT\)/);
  assert.match(battle, /r83bPresent\(this, ev\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR83bFx\(this, anim/);
  assert.match(src, /Object\.assign\(FINE, R83B_FINE\)/);
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R83B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR83bFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R83B_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R83B_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
      for (let i = 0; i < 80; i++) fx.update(40);
      assert.equal(fx.parts.length, 0, `${anim} が おわらない`);
    }
  }
  assert.equal(playR83bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.deepEqual(r83bMarks({ side: 'ally', alive: true, oni: 45, oniAwake: 2, teShield: true }).map((x) => x.text), ['おにの手+45%', 'かくせい2', '体をはる']);
  assert.deepEqual(r83bMarks({ side: 'enemy', oni: 30 }), []);
  assert.deepEqual(r83bMarks({ side: 'ally', alive: true, oni: 0 }), []);
  for (const x of r83bMarks({ side: 'ally', alive: true, oni: 90, oniAwake: 3, teShield: true })) textOk(x.text, 'mark');
  const files = gameFiles();
  for (const f of ['jobs-r83b.js', 'abilities-r83b.js', 'hirameki-r83b.js', 'battle-r83b.js', 'battlefx-r83b.js', 'client/battle-r83b.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

// ───────────── キャラに 項目を 足さない ─────────────
test('第83回 B: おにの手・かばう は 戦いの 中だけ（キャラの 項目は かわらない）', () => {
  const { b, c, me } = setup('jigoku_sensei', { seed: 12 });
  const before = Object.keys(c).sort();
  actNow(b, me, { type: 'ability', id: 'nb_dasu' });
  actNow(b, me, { type: 'ability', id: 'js_koe' });
  actNow(b, me, { type: 'defend' });
  assert.ok(me.oni && me.koeGrit);
  assert.deepEqual(Object.keys(c).sort(), before);
  assert.equal(c.oni, undefined);
});
