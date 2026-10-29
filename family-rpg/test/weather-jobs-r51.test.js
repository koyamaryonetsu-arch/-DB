// 第51回 W: 天気の 職業「気象予報士 → お天気キャスター → 天候をあやつる者」（docs/plan-r51-phantom.md）
//  ・職業の 木（基本職 → 上級職 → 超級職）・なれる じゅんばん・強さ（同じ ランクの はんい）・技（覚える・たたかいで 使える）
//  ・晴れ・雨・かみなりの 技（weather。天候の神の 条件で 数える）が 超級職までに それぞれ 2つ いじょう・超級職だけでも 2つずつ
//  ・強さの つりあい（同じ ランクの 技と くらべる）・ひらめき技・タグ・乗り物・はじめの 装備・文字
//  ・ならびの 場所（何番め）は 見ない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { WEATHER_JOBS } from '../public/js/shared/data/jobs-weather.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { WEATHER_ABILITIES } from '../public/js/shared/data/abilities-weather.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_WEATHER_ABILITIES, HIRAMEKI_WEATHER } from '../public/js/shared/data/hirameki-weather.js';
import { JOB_SAY } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS } from '../public/js/shared/data/job-trials.js';
import { PHANTOM_ADJ } from '../public/js/shared/battle-trial.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';

const NEW = ['kishou', 'otenki_caster', 'tenkou_tsukai'];
const TREE = { kishou: ['気象予報士', 0, undefined], otenki_caster: ['お天気キャスター', 1, ['kishou']], tenkou_tsukai: ['天候をあやつる者', 2, ['otenki_caster']] };
const KINDS = ['sun', 'rain', 'thunder'];
const ELEM = { sun: ['fire', 'light'], rain: ['water'], thunder: ['bolt'] };
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
const learnIds = (j) => JOBS[j].learn.map(([, id]) => id);
// その 職業までに 覚える 技（ひらめき技も）
const upTo = (t) => NEW.slice(0, t + 1).flatMap((j) => [...learnIds(j), ...Object.keys(HIRA_WEATHER_ABILITIES).filter((id) => ABILITIES[id].job === j)]);

test('第51回 W: 職業の 木（気象予報士 → お天気キャスター → 天候をあやつる者）・うわさ・文字', () => {
  assert.deepEqual(Object.keys(WEATHER_JOBS), NEW);
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j, WEATHER_JOBS[id], 'jobs.js に まざる');
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper, undefined);
    assert.ok([JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER][tier].includes(id));
    assert.equal(ALL_JOBS.filter((x) => x === id).length, 1);
    for (const s of [j.name, j.desc, j.short, ...(JOB_HINTS[id] ? [JOB_HINTS[id]] : [])]) textOk(s, id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(j.tags.length >= 2 && j.tags.length <= 4, `${id} タグ`);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} 乗り物`);
    textOk(JOB_SAY[id], `${id} ひとこと`);
  }
  assert.ok(JOB_HINTS.tenkou_tsukai, '超級職の うわさ');
  assert.ok(TRIAL_WORDS.tenkou_tsukai && PHANTOM_ADJ.tenkou_tsukai, '職業の試練');
  assert.equal(jobReqText('otenki_caster'), '気象予報士Lv10');
  assert.equal(jobReqText('tenkou_tsukai'), 'お天気キャスターLv10');
});

test('第51回 W: なれる じゅんばん（はじめから えらべる → きわめて お天気キャスター → きわめて うわさ → 天候をあやつる者）', () => {
  const c = newCharacter({ id: 'k', name: 'ソラ', job: 'kishou' });
  assert.equal(c.job, 'kishou', 'はじめに えらべる 基本職');
  assert.deepEqual(c.equip, { ...STARTER_EQUIP.kishou });
  assert.ok(learnedAbilities(c).includes('ks_kaminari'));
  assert.equal(jobUnlocked(c, 'otenki_caster'), false);
  master(c, 'kishou');
  assert.equal(jobUnlocked(c, 'otenki_caster'), true);
  assert.equal(changeJob(c, 'otenki_caster').ok, true);
  assert.ok(learnedAbilities(c).includes('oc_kaminari'));
  assert.equal(jobKnown(c, 'tenkou_tsukai'), false, 'はじめ ひみつ');
  assert.equal(jobUnlocked(c, 'tenkou_tsukai'), false);
  master(c, 'otenki_caster');
  assert.equal(jobKnown(c, 'tenkou_tsukai'), true);
  assert.equal(jobUnlocked(c, 'tenkou_tsukai'), true);
  assert.equal(changeJob(c, 'tenkou_tsukai').ok, true);
  assert.ok(learnedAbilities(c).includes('tt_rakurai'));
  // 天候の神（C3）の じょうけんの 1つ
  assert.ok(SUPER_ORDER.includes('tenkou_tsukai'));
});

test('第51回 W: 強さは 同じ ランクの はんい・魔力が 高く 力は ひくめ・上の ランクほど 強い', () => {
  NEW.forEach((j, t) => {
    const list = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER][t].filter((x) => !NEW.includes(x)).map(sum);
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) >= Math.min(...list) && sum(j) <= Math.max(...list), `${j} ${sum(j).toFixed(2)}`);
    assert.ok(JOBS[j].mods.mag > JOBS[j].mods.str, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
  });
  assert.ok(sum('kishou') < sum('otenki_caster') && sum('otenki_caster') < sum('tenkou_tsukai'));
});

test('第51回 W: 技の データ（その 職業の 技・Lv10 の 看板の 技が いちばん MP・攻撃技の かず・文字）', () => {
  assert.deepEqual(Object.keys(WEATHER_ABILITIES).sort(), NEW.flatMap(learnIds).sort(), '技は ぜんぶ どれかの 職業で 覚える');
  for (const j of NEW) {
    const ids = learnIds(j);
    const lv = JOBS[j].learn.map(([l]) => l);
    assert.deepEqual(lv, [...lv].sort((a, b) => a - b));
    assert.equal(JOBS[j].learn.at(-1)[0], 10);
    assert.equal(JOBS[j].learn.at(-1)[1], `${j}_sig`);
    const want = [[6, 7], [6, 8], [7, 8]][JOBS[j].tier];
    assert.ok(ids.length >= want[0] && ids.length <= want[1], `${j}: 技 ${ids.length}こ`);
    const maxMp = Math.max(...ids.map((id) => ABILITIES[id].mp));
    assert.equal(ABILITIES[`${j}_sig`].mp, maxMp, `${j}: 看板の 技が いちばん MP`);
    const atk = ids.filter((id) => abilityRole(ABILITIES[id]) === 'dmg').length;
    assert.ok(atk >= (JOBS[j].tier === 0 ? 3 : 2), `${j}: 攻撃技 ${atk}`);
    for (const id of ids) {
      const a = ABILITIES[id];
      assert.equal(a.job, j, id);
      assert.ok(a.kana && a.cast && a.anim, id);
      for (const s of [a.name, a.desc, a.cast.replaceAll('{a}', 'ソラ').replaceAll('{t}', 'ミナ')]) textOk(s, id);
      for (const p of partsOf(a.effect)) for (const s of [p.msg, p.failMsg].filter(Boolean)) textOk(s.replaceAll('{t}', 'スライム'), id);
    }
  }
});

test('第51回 W: 晴れ・雨・かみなりの 技（weather）… どの 職業でも 1つずつ・超級職までで 2つ いじょう・超級職だけでも 2つずつ・属性が あう', () => {
  const all = { ...WEATHER_ABILITIES, ...HIRA_WEATHER_ABILITIES };
  for (const [id, a] of Object.entries(all)) {
    if (a.weather === undefined) continue;
    assert.ok(KINDS.includes(a.weather), `${id}: ${a.weather}`);
    // 攻撃の 技は その 天気の 属性を ふくむ
    const els = partsOf(a.effect).map((p) => p.element).filter(Boolean);
    if (els.length) assert.ok(els.some((e) => ELEM[a.weather].includes(e)), `${id}: ${a.weather} と ${els}`);
    if (a.setWeather !== undefined) assert.equal(a.setWeather, a.weather, `${id}: setWeather`);
  }
  const count = (ids, k) => ids.filter((id) => ABILITIES[id].weather === k).length;
  for (const k of KINDS) {
    for (const j of NEW) assert.ok(count(learnIds(j), k) >= 1, `${j}: ${k}`);
    assert.ok(count(upTo(2), k) >= 2, `超級職まで: ${k}`);
    assert.ok(count(learnIds('tenkou_tsukai'), k) >= 2, `天候をあやつる者だけで: ${k}`);
    // いつも 使える（MP が 軽い）技が ある
    assert.ok(upTo(2).some((id) => ABILITIES[id].weather === k && ABILITIES[id].mp <= 8), `${k}: 軽い 技`);
  }
});

test('第51回 W: 強さの つりあい（同じ ランクの 技と くらべる）', () => {
  // 1MP あたりの 呪文ダメージ（base の まん中 × 的の かず の めやす）が 同じ ランクの 技の はんい
  const per = (a) => {
    const t = a.target === 'enemy' ? 1 : a.target === 'group' ? 1.6 : 2;
    const dmg = partsOf(a.effect).filter((p) => p.type === 'magic').reduce((s, p) => s + (p.base[0] + p.base[1]) / 2, 0);
    return (dmg * t) / Math.max(1, a.mp);
  };
  const tierOf = (id) => JOBS[ABILITIES[id].job]?.tier;
  for (const tier of [0, 1, 2]) {
    const others = Object.entries(ABILITIES).filter(([id, a]) => !WEATHER_ABILITIES[id] && !a.hirameki && a.job && tierOf(id) === tier && a.kind !== 'combo' && a.effect?.type === 'magic' && a.mp >= 2).map(([, a]) => per(a));
    const hi = Math.max(...others) * 1.05;
    for (const j of NEW.filter((x) => JOBS[x].tier === tier)) {
      for (const id of learnIds(j)) {
        const a = ABILITIES[id];
        if (!partsOf(a.effect).some((p) => p.type === 'magic')) continue;
        assert.ok(per(a) <= hi, `${id}: 1MP ${per(a).toFixed(1)} > ${hi.toFixed(1)}`);
      }
    }
  }
  // 補助の 上限（みんな: 1.15・1.25・1.4、いくつもの 強さは 1.12・1.2・1.3。1人: 1.3・1.4）
  for (const j of NEW) {
    const t = JOBS[j].tier;
    for (const id of learnIds(j)) {
      const a = ABILITIES[id];
      for (const p of partsOf(a.effect).filter((x) => x.type === 'buff')) {
        const multi = (p.stats || [p.stat]).length > 1;
        if (a.target === 'allies') assert.ok(p.mult <= (multi ? [1.12, 1.2, 1.3] : [1.15, 1.25, 1.4])[t] + 1e-9, id);
        if (a.target === 'ally') assert.ok(p.mult <= [1.3, 1.4, 1.5][t] + 1e-9, id);
      }
    }
  }
});

test('第51回 W: ひらめき技（お天気キャスターに 1つ・天候をあやつる者に 1つ）', () => {
  assert.deepEqual(Object.keys(HIRAMEKI_WEATHER).sort(), Object.keys(HIRA_WEATHER_ABILITIES).sort());
  const jobs = Object.values(HIRA_WEATHER_ABILITIES).map((a) => a.job).sort();
  assert.deepEqual(jobs, ['otenki_caster', 'tenkou_tsukai']);
  for (const [id, h] of Object.entries(HIRAMEKI_WEATHER)) {
    assert.equal(HIRAMEKI[id], h);
    const a = ABILITIES[id];
    assert.ok(a.hirameki && a.weather);
    for (const k of Object.keys(h.from)) assert.equal(ABILITIES[k].job, a.job, `${id}: ${k}`);
    assert.equal(hiraAllowed({ job: a.job, jobs: {} }, id), true);
    assert.equal(hiraAllowed({ job: 'warrior', jobs: {} }, id), false);
    for (const s of [a.name, a.desc]) textOk(s, id);
  }
});

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 40 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ソラ', job: 'kishou' });
  gainExp(c, expForLevel(lv));
  master(c, 'kishou', 'otenki_caster', 'tenkou_tsukai');
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

test('第51回 W: 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・回復と 補助も 効く・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const id of learnIds(j)) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      assert.ok(readyUp(b, me));
      if (a.role === 'heal') m.hp = Math.max(1, Math.floor(m.maxHp / 3));
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      // えんしゅつは o10 の 大技（ox_w_〜）
      assert.match(act.fx?.ax || '', /^ox_w_/, `${id} の えんしゅつ`);
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
  // めぐみの雨: 回復の あと じわじわ 回復
  const { b, me, m } = setup('tenkou_tsukai', { seed: 3 });
  readyUp(b, me);
  m.hp = 10;
  b.command(me.id, { type: 'ability', id: 'tt_megumi' }, 's1');
  runUntilAct(b, me.id);
  assert.ok(m.hp > 10 && m.regen?.amt > 0, 'めぐみの雨');
});

// 第51回（まとめ役）: 天候をあやつる者の 技は 戦いの 天気も かえる（battle-weather.js の skillWeather）
import { skillWeather, SKILL_WEATHER_TURNS } from '../public/js/shared/battle-weather.js';
test('第51回: setWeather の ある 技は 使った 側の 天気に する', () => {
  for (const [id, kind] of [['tt_manatsu', 'sun'], ['tt_gouu', 'rain'], ['tt_sanrenpatsu', 'thunder']]) {
    const a = ABILITIES[id];
    assert.equal(a?.setWeather, kind, id);
    const b = { weather: null };
    const ev = { lines: [] };
    skillWeather(b, { side: 'ally', id: 'p1', alive: true }, a, ev);
    assert.deepEqual([b.weather.kind, b.weather.side, b.weather.left], [kind, 'ally', SKILL_WEATHER_TURNS]);
    assert.ok(ev.lines.length >= 2 && ev.weather);
  }
  const b = { weather: null };
  skillWeather(b, { side: 'ally', alive: true }, ABILITIES.tt_ikazuchi || { setWeather: undefined }, { lines: [] });
  assert.equal(b.weather, null);
});
