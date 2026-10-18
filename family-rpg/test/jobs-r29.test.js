// 2026年10月（第29回）: るろうに剣士 → 人斬りばっ刀さい → ひ村ばっ刀さい → 飛天御剣流けい承者
//  家族の ねがい「キャラクター追加 るろうに剣士→人斬り抜刀斎→緋村抜刀斎→飛天御剣流継承者 技については、今までのルールと同じでお願い」
//  ・「抜・斎・緋・継」は 習わない 字なので ひらがな（技の「龍」は「竜」、天翔龍閃は 読みの「天かける竜のひらめき」）
//  ・職業の 木・ランク・技の 数・攻撃技・看板の 技・ひらめき技・合体技・見た目・エフェクト・文字・はじめの 装備
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_MAX_LEVEL, JOB_HINTS, jobReqText, jobAncestry,
} from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { JOB8_ABILITIES } from '../public/js/shared/data/abilities-jobs8.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R29_ABILITIES, HIRAMEKI_R29 } from '../public/js/shared/data/hirameki-r29.js';
import { DUAL_TECHS, DUAL_ORDER, DUAL_GROUP_NAMES, dualSize, dualRelated } from '../public/js/shared/data/dual.js';
import { ITEMS, ITEM_KANA } from '../public/js/shared/data/items.js';
import { SHOPS } from '../public/js/shared/data/shops.js';
import {
  newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, hiraRelated, partyJobSet, weaponOk,
  STARTER_EQUIP, computeStats,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R29_OUTFIT, R29_BODY, R29_OLD_LOOK } from '../public/js/client/render/hero-r29.js';
import { lookToOpts } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { playJob5Fx } from '../public/js/client/render/battlefx-jobs5.js';
import { playJob6Fx, JOB6_SFX, JOB6_FINE, SIG6 } from '../public/js/client/render/battlefx-jobs6.js';
import { DUAL_FX } from '../public/js/client/render/dualfx.js';
import { SFX_R29 } from '../public/js/client/sfx-r29.js';
import { checkText } from '../tools/kanji-check.mjs';

const tierOf = (j) => JOBS[j].tier || 0;
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const ORDERS = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
// 家族と きめた 職業の 木（id・ゲームで 出る 名前・ランク・なる じょうけん）
const TREE = [
  ['rurouni', 'るろうに剣士', 0],
  ['hitokiri', '人斬りばっ刀さい', 1, ['rurouni']],
  ['himura', 'ひ村ばっ刀さい', 2, ['hitokiri']],
  ['hiten', '飛天御剣流けい承者', 3, ['himura'], 1],
];
const NEW = TREE.map(([id]) => id);
const SIG_NAMES = { rurouni: '竜つい閃', hitokiri: '竜巣閃', himura: '九頭竜閃', hiten: '天かける竜のひらめき' };
const NEW_DUAL = ['dt_sentaku_biyori', 'dt_sanken'];
const NEW_HIRA = Object.keys(HIRA_R29_ABILITIES);
const SCOPE = {
  enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵にランダム/, ally: /仲間1人/, allies: /仲間全員/, self: /自分/, deadAlly: /仲間1人/,
};
const ALL_CAP = [1.15, 1.25, 1.4, 1.4];
const ALL_MULTI_CAP = [1.12, 1.2, 1.3, 1.35];
const ONE_CAP = [1.3, 1.4, 1.5, 1.5];
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'ミナ', job: 'priest' });
  gainExp(mate, expForLevel(lv));
  fullHeal(mate);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  for (const a of b.allies) a.mp = a.maxMp = 999;
  return { b, c, mate, me: b.allies[0], m: b.allies[1] };
}
const readyUp = (b, a) => { for (let i = 0; i < 1200 && !a.ready; i++) b.tick(50); return a.ready; };
const runUntilAct = (b, id) => {
  const evs = [];
  for (let i = 0; i < 400 && !evs.some((e) => e.t === 'act' && e.id === id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === id);
};

// ───────────── 職業の 木 ─────────────
test('第29回の 職業: 職業の 木（id・名前・ランク・なる じょうけん）・神殿の うわさ・文字', () => {
  for (const [id, name, tier, req, reqSuper] of TREE) {
    const j = JOBS[id];
    assert.ok(j, id);
    assert.equal(j.id, id);
    assert.equal(j.name, name, `${id} の 名前`);
    assert.equal(tierOf(id), tier, `${id} の ランク`);
    assert.ok(ORDERS[tier].includes(id), `${id} の ならび`);
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    if (req) assert.deepEqual(j.req, req, `${id} の じょうけん`);
    else assert.equal(j.req, undefined, `${id} は はじめから なれる`);
    assert.equal(j.reqSuper, reqSuper, `${id} の reqSuper`);
    if (tier >= 2) assert.ok(JOB_HINTS[id], `${id} の 神殿の うわさ`);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id] || '']) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    // 習わない 字（抜・斎・緋・継・龍）は 使わない
    assert.ok(!/[抜斎緋継龍]/.test(j.name + j.desc + (JOB_HINTS[id] || '')), id);
  }
  // 基本職は さいごに、伝説は ほかの 伝説と 同じ 形（○○Lv10＋ほかの超級職1つLv10）
  // 第33回: 手品師・れん金術師が さらに あとに ならぶ（るろうに剣士は 第26回の 職業の すぐ あと）
  assert.equal(JOB_ORDER[JOB_ORDER.indexOf('kappa') + 1], 'rurouni');
  assert.match(jobReqText('hitokiri'), /^るろうに剣士Lv10$/);
  assert.match(jobReqText('himura'), /^人斬りばっ刀さいLv10$/);
  assert.match(jobReqText('hiten'), /^ひ村ばっ刀さいLv10＋ほかの超級職1つLv10$/);
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  assert.match(title, /rurouni: '[^']+'/, '作る画面の ひとこと');
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.ok(services.includes('飛天御剣流けい承者'), '神殿の 伝説の 一覧');
});

test('第29回の 職業: なれる じゅんばん（るろうに剣士は はじめから → 人斬り → ひ村 → 飛天）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'rurouni' });
  assert.equal(c.job, 'rurouni', 'はじめから えらべる');
  assert.equal(jobUnlocked(c, 'hitokiri'), false);
  master(c, 'rurouni');
  assert.equal(jobUnlocked(c, 'hitokiri'), true);
  assert.equal(jobKnown(c, 'himura'), false, 'ひ村ばっ刀さいは まだ ひみつ');
  master(c, 'hitokiri');
  assert.equal(jobKnown(c, 'himura'), true, '人斬りを きわめると うわさ');
  assert.equal(jobUnlocked(c, 'himura'), true);
  assert.equal(jobKnown(c, 'hiten'), false);
  master(c, 'himura');
  assert.equal(jobKnown(c, 'hiten'), true, 'ひ村を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'hiten'), false, 'ひ村だけでは まだ');
  master(c, 'abarenbo_shogun');
  assert.equal(jobUnlocked(c, 'hiten'), false, '伝説の 職業は 数えない');
  master(c, 'konoha');
  assert.equal(jobUnlocked(c, 'hiten'), true, 'ほかの 超級職 1つで なれる');
  assert.equal(changeJob(c, 'hiten').ok, true);
  assert.ok(learnedAbilities(c).includes('ht_shinsoku'));
  assert.ok(learnedAbilities(c).includes('rurouni_sig'), 'もとの 職業の 技も 使える');
});

test('第29回の 職業: 強さは 同じ ランクの 今の 職業の はんい（伝説は 超級職より 上）', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const OLD = ALL_JOBS.filter((o) => !NEW.includes(o));
  const sup = OLD.filter((o) => tierOf(o) === 2).map(sum);
  const legend = OLD.filter((o) => tierOf(o) === 3).map(sum);
  for (const j of NEW) {
    const t = tierOf(j);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    if (t < 3) {
      const same = OLD.filter((o) => tierOf(o) === t).map(sum);
      assert.ok(sum(j) >= Math.min(...same) && sum(j) <= Math.max(...same), `${j}: ${sum(j).toFixed(2)}`);
    } else {
      assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legend) && sum(j) <= Math.max(...legend), `${j}: ${sum(j).toFixed(2)}`);
    }
    if (t === 2) assert.ok(sum(j) < Math.min(...legend));
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= [1.4, 1.5, 2, 3.5][t] + 1e-9, `${j}: perLv`);
    assert.ok(JOBS[j].weapons.includes('sword') && JOBS[j].armor.includes('cloth'), j);
    assert.equal(JOBS[j].family, 'phys');
    assert.match(JOBS[j].color, /^#[0-9a-f]{6}$/);
  }
  // 素早さの 高い 剣士（人斬りは 守りが うすい）
  assert.ok(JOBS.hitokiri.mods.agi > JOBS.samurai.mods.agi && JOBS.hitokiri.mods.def < JOBS.samurai.mods.def);
});

// ───────────── 技 ─────────────
test('第29回の 技: 5〜6こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    const t = tierOf(j);
    assert.ok(job.learn.length >= 5 && job.learn.length <= 6, `${j}: ${job.learn.length}こ`);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, [...lvs].sort((a, b) => a - b));
    assert.equal(lvs[0], 1);
    assert.equal(lvs[lvs.length - 1], 10);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん MPを 使う`);
    assert.ok(mps.slice(0, -1).every((m) => m < mps[mps.length - 1]));
    // 看板の 技
    const sig = `${j}_sig`;
    assert.equal(job.learn[job.learn.length - 1][1], sig);
    assert.equal(ABILITIES[sig].anim, sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.equal(abilityRole(ABILITIES[sig]), 'dmg', `${sig} は 攻撃技`);
    assert.ok(!ABILITIES[sig].hidden && !ABILITIES[sig].noAuto);
    // 攻撃技
    const atk = job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (t === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}こ`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j, `${id} の job`);
      assert.equal(a.kind, 'skill');
      assert.ok(!a.weapon, `${id}: 武器が なくても 使える`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!/[抜斎緋継龍槌翔刃]/.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      // 補助は ランクの 上限まで・敵を 止める 技は かならずは 効かない
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff' && !p.target && ['allies', 'ally'].includes(a.target)) {
          if (p.stat === 'eva') assert.ok(p.add <= [0.25, 0.3, 0.35, 0.35][t] + 1e-9);
          else {
            const cap = a.target === 'ally' ? ONE_CAP[t] : (p.stats || [p.stat]).length > 1 ? ALL_MULTI_CAP[t] : ALL_CAP[t];
            assert.ok(p.mult <= cap + 1e-9, `${a.name}: ${p.mult}`);
          }
        }
        if (['atbSet', 'status'].includes(p.type) && ['enemy', 'group', 'enemies'].includes(a.target)) assert.ok(p.chance > 0 && p.chance < 1, a.name);
      }
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(JOB8_ABILITIES).sort(), 'abilities-jobs8.js の 技は ぜんぶ どれかの 職業で 覚える');
  // クスッと する 技（おろ？・おせんたくでござる・お茶にするでござる・白いマントをぬぐ）
  for (const n of ['おろ？', 'おせんたくでござる', 'お茶にするでござる', '白いマントをぬぐ']) assert.ok(Object.values(JOB8_ABILITIES).some((a) => a.name === n), n);
});

test('第29回の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      assert.ok(readyUp(b, me));
      const a = ABILITIES[id];
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      if (abilityRole(a) === 'heal') assert.ok(act.results?.some((x) => x.heal >= 0) || act.lines.length, id);
    }
    // オートの 仲間（看板の 技を ふくむ 技を 全部 もつ）
    const s = setup(j, { seed: 7 });
    s.me.abilities = learnedAbilities(s.c);
    let usedSkill = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') { assert.ok(ABILITIES[cmd.id] && !ABILITIES[cmd.id].hidden, cmd.id); usedSkill++; }
    }
    assert.ok(usedSkill > 0, `${j}: オートでも 技を 使う`);
  }
  assert.ok(n >= 24);
});

// ───────────── ひらめき技 ─────────────
test('第29回の ひらめき技: 上級職より 上の 3つに 1〜2こ・その 道の 上の 職業でも ひらめける・データと 文字', () => {
  const per = new Map();
  for (const id of NEW_HIRA) per.set(HIRA_R29_ABILITIES[id].job, (per.get(HIRA_R29_ABILITIES[id].job) || 0) + 1);
  for (const j of ['hitokiri', 'himura', 'hiten']) {
    const k = per.get(j) || 0;
    assert.ok(k >= 1 && k <= 2, `${j}: ${k}こ`);
  }
  assert.equal(per.get('rurouni'), undefined, '基本職には 足さない');
  assert.deepEqual(Object.keys(HIRAMEKI_R29).sort(), [...NEW_HIRA].sort());
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !NEW_HIRA.includes(id)).map(([, a]) => a.anim).filter(Boolean));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.ok(!a.weapon);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, n] of Object.entries(HIRAMEKI[id].from)) {
      const s = ABILITIES[k];
      assert.ok(s && n > 0 && JOBS[s.job]?.learn.some(([, x]) => x === k), `${id}: ${k}`);
      assert.ok(jobAncestry(a.job).has(s.job), `${id}: ${k} は その 道の 技`);
    }
    for (const p of partsOf(a.effect)) if (p.type === 'atbSet') assert.ok(p.chance > 0 && p.chance < 1);
    // ひらめける 職業: その 職業と、その 先の 職業
    for (const j of NEW) {
      const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
      c.job = j;
      assert.equal(hiraAllowed(c, id), jobAncestry(j).has(a.job), `${j} で ${a.name}`);
    }
  }
  // パーティーに 関係する ものだけ 一覧に 出る
  assert.ok(hiraRelated('hi_ryutsui_shou', partyJobSet([{ job: 'hitokiri' }])));
  assert.ok(!hiraRelated('hi_shin_kuzu', partyJobSet([{ job: 'warrior' }])));
});

test('第29回の ひらめき技は たたかいで 使えて、元の 技を 使いこむと ひらめく', () => {
  let n = 0;
  for (const id of NEW_HIRA) {
    const a = ABILITIES[id];
    {
      const { b, c, me } = setup(a.job, { seed: ++n });
      c.hirameki = [id];
      me.abilities = [...me.abilities, id];
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act?.results?.some((x) => x.dmg > 0), `${id}: ダメージ`);
      for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    }
    const from = HIRAMEKI[id].from;
    const key = Object.keys(from)[0];
    let got = null;
    for (let seed = 1; seed < 80 && !got; seed++) {
      const { b, c, me } = setup(a.job, { seed });
      c.skillUse = Object.fromEntries(Object.entries(from).map(([k, v]) => [k, v * 2]));
      me.use = { ...c.skillUse };
      readyUp(b, me);
      const r = b.command(me.id, { type: 'ability', id: key, target: b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id}: ${key}`);
      const act = runUntilAct(b, me.id);
      if (act?.hirameki) { assert.equal(act.hirameki.id, id); got = act; }
    }
    assert.ok(got, `${a.name} を ひらめいた`);
  }
});

test('ひらめき技: tier1 いじょうの どの 職業にも ひらめき技が ある（第29回の 3つも）', () => {
  for (const j of ALL_JOBS.filter((x) => tierOf(x) >= 1)) {
    const own = Object.keys(HIRAMEKI).filter((id) => {
      const a = ABILITIES[id];
      if (a.kind === 'combo') return tierOf(j) === 1 && hiraAllowed({ job: j, jobs: {} }, id);
      return a.job === j;
    });
    assert.ok(own.length >= 1, `${JOBS[j].name} の ひらめき技`);
  }
});

// ───────────── 合体技 ─────────────
const jobsOf = (id, g) => new Set(DUAL_TECHS[id].need[g].map((k) => ABILITIES[k]?.job).filter(Boolean));

test('第29回の 合体技: 4つの 職業の 技が 今の 組（剣・回復・守り）に 入る・新しい 合体技 2こ（ぜんぶで 37こ いない）', () => {
  // 今の 組（「攻撃の技（どの職業でも）」いがい）に 入っている
  const ATTACK_NAME = '攻撃の技（どの職業でも）';
  const groups = [...DUAL_GROUP_NAMES].filter(([, nm]) => nm !== ATTACK_NAME);
  const byName = new Map(groups.map(([list, nm]) => [nm, list]));
  for (const j of NEW) {
    const inGroup = groups.some(([list]) => list.some((k) => ABILITIES[k]?.job === j));
    assert.ok(inGroup, `${JOBS[j].name} の 技が 合体技の 組に ない`);
    const inDual = Object.values(DUAL_TECHS).some((t) => t.need.some((list) => list.some((k) => ABILITIES[k]?.job === j)));
    assert.ok(inDual, `${JOBS[j].name} の 技が 合体技に ない`);
  }
  // 第35回: 組は タグ（剣）
  const sword = byName.get('剣');
  for (const id of ['rurouni_sig', 'hitokiri_sig', 'himura_sig', 'hiten_sig', 'rr_battou', 'htk_ryusho', 'hm_hiryu', 'ht_shinsoku']) assert.ok(sword.includes(id), `剣の技に ${id}`);
  assert.ok(byName.get('飛天御剣流の技').includes('rr_sentaku'));
  assert.ok(byName.get('飛天御剣流の技'), '飛天御剣流の 組');
  // 数
  // 第31回: ミナデインで 38こ。第32回: 魔物使いの 3こで 41こ
  // 第33回: 11の 職業の 5こで 46こ（test/jobs-r33.test.js）。第35回: タグの 技で 59こ
  assert.ok(DUAL_ORDER.length <= 62, `${DUAL_ORDER.length}こ`);
  for (const id of NEW_DUAL) assert.ok(DUAL_TECHS[id], id);
  assert.equal(dualSize('dt_sentaku_biyori'), 2);
  assert.equal(dualSize('dt_sanken'), 3);
  assert.ok(DUAL_TECHS.dt_sentaku_biyori.funny, 'クスッと する 2人技');
  const ord = DUAL_ORDER.map(dualSize);
  assert.deepEqual(ord, [...ord].sort((a, b) => a - b));
  const pair = (id, a) => DUAL_TECHS[id].need.some((_, g) => jobsOf(id, g).has(a));
  assert.ok(pair('dt_sanken', 'hiten') && pair('dt_sanken', 'abarenbo_shogun') && pair('dt_sanken', 'samurai'), '飛天×暴れんぼう将軍×サムライ');
  assert.ok(pair('dt_sentaku_biyori', 'rurouni') && pair('dt_sentaku_biyori', 'okan'), 'るろうに剣士×おかん');
  assert.ok(dualRelated('dt_sanken', partyJobSet([{ job: 'hiten' }, { job: 'abarenbo_shogun' }, { job: 'samurai' }])));
  assert.ok(!dualRelated('dt_sanken', partyJobSet([{ job: 'warrior' }, { job: 'priest' }])));
  for (const id of NEW_DUAL) {
    const t = DUAL_TECHS[id];
    for (const s of [t.name, t.desc, ...t.parts.flatMap((p) => [p.say, p.msg, p.failMsg]).filter(Boolean)]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    for (const list of t.need) assert.deepEqual(checkText(DUAL_GROUP_NAMES.get(list)), []);
    assert.ok(DUAL_FX[id]?.finale && DUAL_FX[id].word, id);
    assert.deepEqual(checkText(DUAL_FX[id].word), []);
  }
});

test('第29回の 合体技は 今の 合体技より 弱くない（k）・出せて 強い・回復の 技', () => {
  const OLD = DUAL_ORDER.filter((id) => !NEW_DUAL.includes(id));
  const kOf = (id) => Math.max(0, ...DUAL_TECHS[id].parts.filter((p) => p.type === 'power' && !p.target).map((p) => p.k));
  const t = DUAL_TECHS.dt_sanken;
  const same = OLD.filter((o) => DUAL_TECHS[o].target === t.target && DUAL_TECHS[o].parts.some((p) => p.type === 'power' && !p.target));
  assert.ok(kOf('dt_sanken') >= Math.max(...same.map(kOf)) * 0.9, `k ${kOf('dt_sanken')}`);
  // 回復の 2人技: 今の 2人の 回復の 合体技と 同じ くらい
  const heal = (id) => DUAL_TECHS[id].parts.find((p) => p.type === 'heal');
  assert.ok(heal('dt_sentaku_biyori').pct >= heal('dt_bentou').pct && heal('dt_sentaku_biyori').k >= heal('dt_bentou').k);

  function party(jobs, enemies) {
    const allies = jobs.map((j, i) => {
      const c = newCharacter({ id: `a${i}`, name: `${JOBS[j].short}${i}`, job: 'warrior' });
      gainExp(c, expForLevel(40));
      masterChain(c, j);
      master(c, j);
      c.job = j;
      c.equip.weapon = null;
      fullHeal(c);
      return i === 0 ? { char: c, controller: 's1' } : { char: c, kind: 'support', controller: 's1' };
    });
    const b = new Battle({ rng: makeRng(3), allies, enemies, canFlee: true });
    for (const e of b.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 99999; e.resist = {}; }
    for (const a of b.allies) { a.mp = a.maxMp = 999; a.weaponCat = 'sword'; }
    return b;
  }
  function fire(b, id) {
    const [me] = b.allies;
    for (const a of b.allies) readyUp(b, a);
    const o = b.dualOptionsFor(me).find((x) => x.id === id);
    assert.ok(o, `${id} が 出せる`);
    const r = b.command(me.id, { type: 'dual', id, partner: o.partner, partners: o.partners, target: b.enemies[0].id }, 's1');
    assert.equal(r.ok, true, `${id}: ${r.reason || ''}`);
    const evs = [];
    for (let k = 0; k < 600 && !evs.some((e) => e.t === 'act' && e.dual); k++) evs.push(...b.tick(50));
    const act = evs.find((e) => e.t === 'act' && e.dual);
    assert.equal(act?.dual?.id, id);
    for (const l of act.lines) assert.deepEqual(checkText(l), [], `${id}: ${l}`);
    return act;
  }
  // 天下無敵の三剣士: 敵 3体に、別々に 動いた 1体ぶんの 3倍 いじょう
  const b = party(['hiten', 'abarenbo_shogun', 'samurai'], ['rockman', 'rockman', 'rockman']);
  const solo = b.allies.reduce((s, m) => {
    let best = b.calcPhys(m, b.enemies[0], { mult: 1 }, 1, 'phys', true).dmg;
    for (const id of m.abilities) {
      const a = ABILITIES[id];
      if (!a || !weaponOk(a, m.weaponCat)) continue;
      for (const p of partsOf(a.effect || {})) if (p?.type === 'phys') best = Math.max(best, b.calcPhys(m, b.enemies[0], { ...p, element: undefined }, 1, 'phys', true).dmg * (p.random ? 1 : p.hits || 1));
    }
    return s + best;
  }, 0);
  const act = fire(b, 'dt_sanken');
  const total = act.results.filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
  assert.ok(total >= solo * 3, `敵3体に ${total}（別々 ${solo}）`);
  // せんたく日和でござる: 回復
  const bh = party(['rurouni', 'okan'], ['rockman']);
  for (const a of bh.allies) a.hp = Math.round(a.maxHp / 3);
  const ah = fire(bh, 'dt_sentaku_biyori');
  assert.ok(ah.results.some((x) => x.heal > 0));
});

// ───────────── 見た目 ─────────────
const OUTLINE = 0x1b1330;
function inspect(img) {
  const { w, h, rgba } = img;
  let n = 0, semi = 0, edge = false, rim = 0, rimOut = 0;
  const cols = new Set();
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && rgba[(y * w + x) * 4 + 3] === 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = rgba[i + 3];
      if (a === 0) continue;
      n++;
      if (y === 0 || x === 0 || x === w - 1) edge = true;
      if (a < 255) { semi++; continue; }
      const c = (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
      cols.add(c);
      if (!solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1)) { rim++; if (c === OUTLINE) rimOut++; }
    }
  }
  return { n, semi, edge, colors: cols.size, rimOut: rim ? rimOut / rim : 0 };
}
const key = (img) => Buffer.from(img.rgba).toString('base64');
function checkImg(img, what) {
  const r = inspect(img);
  assert.ok(r.n > img.w * img.h * 0.12, `${what} が かけている`);
  assert.ok(!r.edge, `${what} が ふちに さわる`);
  assert.ok(r.colors <= 120, `${what} の いろ ${r.colors}`);
  assert.ok(r.rimOut >= 0.45, `${what} の りんかく ${r.rimOut.toFixed(2)}`);
  assert.equal(r.semi, 0, `${what} に すける ピクセル`);
}
const DIRS = ['down', 'left', 'up', 'right'];

test('第29回の みため: 着物と はかま・こしの 刀・長い 赤毛・十字の きず・飛天は 白い マント', () => {
  assert.deepEqual(Object.keys(R29_OUTFIT).sort(), [...NEW].sort());
  assert.deepEqual(Object.keys(R29_OLD_LOOK).sort(), [...NEW].sort());
  const look = { body: 0, style: 'short', hcol: 'black', tone: 'light', color: 0 };
  for (const j of NEW) {
    const O = outfitOf({ ...look, cloth: '#888888' }, j, 'cloth', false);
    assert.equal(O.kind, 'hakama', j);
    assert.ok(O.sheath, `${j}: こしの 刀`);
    const B = jobBody(j);
    assert.equal(B.hair, 'rurouni');
    assert.equal(B.hcol, 'rurouni');
    assert.ok(B.cross, `${j}: 十字の きず`);
    assert.equal(lookToOpts(look, j, { weapon: null, armor: 'cloth', shield: null, head: null, acc: null }).outfit, 'hakama');
  }
  assert.ok(outfitOf({ ...look, cloth: '#888888' }, 'hiten', 'cloth', false).mantle29, '飛天の マント');
  assert.ok(!outfitOf({ ...look, cloth: '#888888' }, 'rurouni', 'cloth', false).mantle29);
  // 着物の いろ: るろうに=赤・人斬り=暗い・ひ村=こい 赤
  const lum = (c) => { const n = parseInt(c.slice(1), 16); return ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11; };
  assert.ok(lum(R29_OUTFIT.hitokiri.main) < lum(R29_OUTFIT.rurouni.main) && lum(R29_OUTFIT.himura.main) < lum(R29_OUTFIT.rurouni.main));
  // 4つの 職業 × 4つの むきが ぜんぶ ちがい、サムライとも ちがう
  const seen = new Set();
  for (const j of [...NEW, 'samurai']) {
    for (const dir of DIRS) {
      const img = paintHero(look, j, undefined, dir, 0, 4);
      const k = key(img);
      assert.ok(!seen.has(k), `${j} ${dir} が ほかと おなじ`);
      seen.add(k);
    }
  }
  // よろいを きても かみと きずは のこる（マントは よろいの とき なし。今の きまりと おなじ）
  const armored = outfitOf({ ...look, cloth: '#888888' }, 'hiten', 'iron_armor', false);
  assert.notEqual(armored.kind, 'hakama');
  assert.ok(!armored.mantle29);
  assert.ok(jobBody('hiten').cross);
});

test('第29回の みため: 男女・4方向・2コマ・2つの 大きさ・そうびを かえても はみ出さない（パレットの きまり）', () => {
  const EQS = [undefined, 'iron_sword,cloth,,', 'iron_sword,iron_armor,iron_shield,iron_helm', ',chain_mail,,leather_hat', 'sakabatou,cloth,,'];
  for (const j of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const [style, f, tone] of [['short', 0, 'light'], ['twin', 1, 'deep']]) {
          for (const res of [4, 8]) checkImg(paintHero({ body, style, hcol: 'brown', tone }, j, undefined, dir, f, res), `${j} ${body} ${dir} ${style} res${res}`);
        }
        for (const eq of EQS) checkImg(paintHero({ body, style: 'long', hcol: 'black' }, j, eq, dir, body, 4), `${j} ${eq} ${body} ${dir}`);
      }
    }
  }
});

// ───────────── 看板の 技の エフェクト ─────────────
function fakeCtx() {
  const log = { calls: 0, nan: [], neg: [] };
  let ctx;
  const fn = (name) => (...args) => {
    log.calls++;
    if (args.some((a) => typeof a === 'number' && !Number.isFinite(a))) log.nan.push(name);
    if ((name === 'arc' && args[2] < 0) || (name === 'ellipse' && (args[2] < 0 || args[3] < 0))) log.neg.push(name);
    return ctx;
  };
  ctx = new Proxy({}, {
    get: (o, k) => (k in o ? o[k] : typeof k === 'string' ? fn(k) : undefined),
    set: (o, k, v) => { if (typeof v === 'number' && !Number.isFinite(v)) log.nan.push(String(k)); o[k] = v; return true; },
  });
  return { ctx, log };
}

test('第29回の 看板の技の エフェクト: 4つ・単体と 全体で 出て、すぐ あたり、1.8びょうで おわる・音', () => {
  assert.deepEqual([...SIG6].sort(), NEW.map((j) => `${j}_sig`).sort());
  const fake = new Proxy({}, { get: () => () => undefined });
  assert.equal(playJob6Fx(fake, 'fire1', [{ x: 1, y: 1 }], null, {}), false);
  assert.equal(playJob6Fx(fake, 'hiten_sig', [], null, {}), false);
  assert.equal(playJob5Fx(fake, 'hiten_sig', [{ x: 1, y: 1 }], null, {}), false, 'jobs5 とは べつ');
  assert.ok(Object.keys(JOB6_FINE).every((k) => k.startsWith('j6')));
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  assert.match(audio, /SFX_R29\[id\]\(this, T\)/);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.JOB6_SFX/);
  for (const anim of SIG6) {
    const s = JOB6_SFX[anim];
    assert.ok(SFX_R29[s], `${anim} の 音`);
    assert.ok(!audio.includes(`case '${s}':`), `${s} が ほかの 音と かさなる`);
    // 音を ならしても こわれない
    const calls = [];
    const a = { tone: (...x) => calls.push(x), noise: (...x) => calls.push(x) };
    SFX_R29[s](a, a.tone);
    assert.ok(calls.length >= 4);
    for (const ts of [[{ x: 128, y: 70 }], [{ x: 60, y: 70 }, { x: 128, y: 88 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      fx.play(anim, ts, null, { crit: ts.length > 1, fromAlly: true });
      assert.ok(fx.parts.some((p) => String(p.kind).startsWith('j6')) || anim === 'hitokiri_sig', `${anim}: 自分の つぶ`);
      let hit = Infinity;
      for (const p of fx.parts) if (typeof p.x === 'number' && Math.hypot(p.x - ts[0].x, p.y - ts[0].y) < 24) hit = Math.min(hit, p.delay || 0);
      assert.ok(hit <= 120, `${anim}: あたるのが おそい ${hit}`);
      for (const p of fx.parts) {
        if (typeof p.x !== 'number' || p.kind === 'flash' || p.kind === 'shake') continue;
        assert.ok(p.x > -60 && p.x < BW + 60 && p.y > -60 && p.y < BH + 60, `${anim}: ${p.kind} (${p.x},${p.y})`);
      }
      const { ctx, log } = fakeCtx();
      let t = 0;
      while (fx.parts.length && t < 4000) { fx.update(16); t += 16; if (t % 48 === 0) fx.draw(ctx); }
      assert.ok(t <= 1800, `${anim}: ながい ${t}`);
      assert.ok(log.calls > 100, anim);
      assert.deepEqual(log.nan, [], anim);
      assert.deepEqual(log.neg, [], anim);
    }
  }
});

// ───────────── はじめの 装備 ─────────────
test('はじめの 装備: るろうに剣士は 逆ば刀（村で 買える・きたえられる・ランク1の 剣）', () => {
  assert.equal(STARTER_EQUIP.rurouni.weapon, 'sakabatou');
  const c = newCharacter({ id: 'r', name: 'ケン', job: 'rurouni' });
  assert.equal(c.equip.weapon, 'sakabatou');
  assert.equal(c.equip.armor, 'cloth');
  const it = ITEMS.sakabatou;
  assert.equal(it.cat, 'sword');
  assert.ok(JOBS.rurouni.weapons.includes(it.cat));
  assert.equal(it.rank, 1);
  assert.ok(it.atk <= ITEMS.bronze_sword.atk && it.atk >= ITEMS.wood_sword.atk);
  assert.ok(ITEMS['sakabatou+1'], 'きたえられる');
  assert.equal(ITEM_KANA.sakabatou, 'さかばとう');
  for (const s of [it.name, it.desc]) assert.deepEqual(checkText(s), [], s);
  assert.ok(SHOPS.village.items.includes('sakabatou'), '村の よろず屋で 買える');
  const st = computeStats(c);
  assert.ok(st.atk > 0 && st.dfn > 0);
});
