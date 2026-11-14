// 第82回 B班（2026年11月）: YAIBA の 系統（docs/plan-jobs-r79.md の 8-2・docs/plan-r82-jobs-b.md）
//   サムライ小ぞう（基本職）→ 雷神けんの剣士（上級職）→ ヤイバ（超級職）→ 竜神けんのサムライ（伝説。＋ほかの 超級職 1つ）
//  ・なり方・強さ・技・ひらめき技・合体技の タグ・試練・転職の ひとこと・乗り物・文字
//  ・この 系統だけの しくみ（shared/battle-r82b.js）: 玉で 属性が かわる・段で 持てる 玉・戦いごとに 雷から・天気で 強い・
//    四つ玉斬り／七つ玉（弱点・効かない 玉・すいこむ 玉）・きょだい化・雷神の守り・オート・キャラに 項目を 足さない
//  ・絵（hero-r82b.js）・乗り物の 絵（vehicle-r82b.js）・えんしゅつ（battlefx-r82b.js）・玉の 札（client/battle-r82b.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R82B, R82B_ORDERS, R82B_JOBS } from '../public/js/shared/data/jobs-r82b.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R82B_ABILITIES, YB_TAMAGAE_ATB } from '../public/js/shared/data/abilities-r82b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R82B_ABILITIES, HIRAMEKI_R82B } from '../public/js/shared/data/hirameki-r82b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { TAMA, TAMA_ORDER, tamaSet, tamaOf, bestTama, KYODAI_SPREAD } from '../public/js/shared/battle-r82b.js';
import { setWeather } from '../public/js/shared/battle-weather.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R82B_JOBS as LOOK_JOBS, R82B_OUTFIT, R82B_BODY, R82B_HAT, R82B_OLD_LOOK } from '../public/js/client/render/hero-r82b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R82B_ANIMS, R82B_SIGS, R82B_HIT, R82B_SFX, PARTY_ANIMS_R82B, playR82bFx } from '../public/js/client/render/battlefx-r82b.js';
import { r82bMarks } from '../public/js/client/battle-r82b.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['samurai_kid', 'raijin_sword', 'yaiba', 'ryujin_samurai'];
// [名前, 段, なり方]
const TREE = {
  samurai_kid: ['サムライ小ぞう', 0, undefined],
  raijin_sword: ['雷神けんの剣士', 1, ['samurai_kid']],
  yaiba: ['ヤイバ', 2, ['raijin_sword']],
  ryujin_samurai: ['竜神けんのサムライ', 3, ['yaiba']],
};
const SIG_NAMES = { samurai_kid: '天下一の素ぶり', raijin_sword: 'かみなり斬り', yaiba: '四つ玉斬り', ryujin_samurai: '竜神けん・七つ玉' };
// 能力の 合計の はんい（段ごと）
const SUM_RANGE = [[6.05, 7.35], [6.65, 8.0], [7.75, 9.05], [9.3, 10.2]];
const BOY = { body: 0 };
const SCARY = /殺|死ね|ころす|ころし|血/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, group: /同じ種類の敵/, allies: /仲間全員/, self: /自分|刀|天気/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

// enemies … 魔物の 種類。resist … 敵の 効きぐあいを かえる
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, resist = null, extra = [] } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'samurai_kid' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job, ...extra);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }], enemies, canFlee: true });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = 50000;
    if (resist) e.resist = { ...resist };
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
const dmgOf = (act) => (act.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);

// ───────────── 職業の 木 ─────────────
test('第82回 B の 職業: 4だん（基本職から 伝説まで）・ならび・うわさ・文字・はじめの 装備', () => {
  assert.deepEqual(R82B_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R82B), NEW);
  const orders = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R82B_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc && j.body === undefined, '男の子も 女の子も なれる・おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    if (tier >= 2) {
      assert.ok(JOB_HINTS[id], id);
      textOk(JOB_HINTS[id], id);
    }
  }
  assert.equal(jobReqText('raijin_sword'), 'サムライ小ぞうLv10');
  assert.equal(jobReqText('ryujin_samurai'), 'ヤイバLv10＋ほかの超級職1つLv10');
  // 基本職は はじめから えらべる（今の 基本職と おなじ 所）・木刀（木の剣）
  assert.equal(JOB_ORDER.at(-1), 'samurai_kid');
  assert.equal(newCharacter({ id: 'a', name: 'a', job: 'samurai_kid' }).job, 'samurai_kid');
  assert.equal(STARTER_EQUIP.samurai_kid.weapon, 'wood_sword');
  assert.deepEqual(JOBS.samurai_kid.weapons, ['sword', 'bat', 'none']);
  for (const id of NEW.slice(1)) assert.deepEqual(JOBS[id].weapons.filter((w) => w !== 'none'), ['sword']);
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  assert.match(title, /samurai_kid: '天下一のサムライになる'/);
  const files = gameFiles();
  for (const f of ['jobs-r82b.js', 'abilities-r82b.js', 'hirameki-r82b.js', 'shared/battle-r82b.js', 'client/battle-r82b.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第82回 B の 職業: なれる じゅんばん（1本道・伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'samurai_kid' });
  assert.equal(jobUnlocked(c, 'raijin_sword'), false);
  master(c, 'samurai_kid');
  assert.equal(jobUnlocked(c, 'raijin_sword'), true);
  assert.equal(jobUnlocked(c, 'yaiba'), false);
  master(c, 'raijin_sword');
  assert.equal(jobUnlocked(c, 'yaiba'), true);
  assert.equal(jobKnown(c, 'ryujin_samurai'), false, '伝説は はじめ ひみつ');
  master(c, 'yaiba');
  assert.equal(jobKnown(c, 'ryujin_samurai'), true, 'ヤイバを きわめると うわさ');
  assert.equal(jobUnlocked(c, 'ryujin_samurai'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'archmage');
  assert.equal(jobUnlocked(c, 'ryujin_samurai'), true);
  assert.equal(changeJob(c, 'ryujin_samurai').ok, true);
  assert.ok(learnedAbilities(c).includes('ry_tachi'));
});

test('第82回 B の 職業: 能力の 合計は 段の はんい・下の 段より 強い・力と 素早さの 剣士', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  NEW.forEach((j, i) => {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    const [lo, hi] = SUM_RANGE[i];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    if (i) assert.ok(sum(j) > sum(NEW[i - 1]) + 0.4, `${j} は 下の 段より 強い`);
    assert.ok(JOBS[j].mods.str >= JOBS[j].mods.agi && JOBS[j].mods.agi > JOBS[j].mods.mag, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3 + 1e-9);
  });
  // 設計の めやす（8-2 の 表）
  assert.deepEqual(NEW.map((j) => [JOBS[j].mods.str, JOBS[j].mods.agi]), [[1.3, 1.25], [1.45, 1.4], [1.65, 1.55], [1.9, 1.75]]);
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [6.45, 6.95, 8.35, 9.65]);
});

// ───────────── 技 ─────────────
test('第82回 B の 技: 6こ（Lv1〜10）・Lv10 が いちばん MP の 看板の 技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
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
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 3, `${j}: 攻撃技 3つ いじょう`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.equal(a.kind, 'skill');
      assert.ok(!a.weapon && !a.masc, id);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff') assert.ok(p.mult <= (JOBS[j].tier ? 1.3 : 1.25) + 1e-9, a.name);
        if (['status', 'debuff'].includes(p.type) || p.status || p.debuff) assert.ok(((p.status || p.debuff || p).chance) < 1, a.name);
      }
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R82B_ABILITIES).sort(), 'abilities-r82b.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 設計の 技の 名前（8-2 の 表。かえた 名前は docs/plan-r82-jobs-b.md）
  assert.deepEqual(JOBS.samurai_kid.learn.map(([, id]) => ABILITIES[id].name), ['めん！', 'ハラへった', '風車', 'むしゃぶるい', '大かぶと割り', '天下一の素ぶり']);
  assert.deepEqual(JOBS.raijin_sword.learn.map(([, id]) => ABILITIES[id].name), ['雷光斬り', '雷の力をためる', 'いなずま風車', 'しびれ斬り', '雷神の守り', 'かみなり斬り']);
  assert.deepEqual(JOBS.yaiba.learn.map(([, id]) => ABILITIES[id].name), ['玉がえ', '属性斬り', 'せんぷう剣', '十字斬り', 'かみなり雲よ来い', '四つ玉斬り']);
  assert.deepEqual(JOBS.ryujin_samurai.learn.map(([, id]) => ABILITIES[id].name), ['竜神の太刀', '金色の玉・きょだい化', '風の玉・たつまき斬り', 'サムライだましい', '雷神のいかり', '竜神けん・七つ玉']);
  // 伝説の Lv7 は サムライだましい（仲間の 武器に 属性を つける 技は 作らない。8-5）
  assert.equal(JOBS.ryujin_samurai.learn.find(([lv]) => lv === 7)[1], 'ry_tamashii');
  assert.deepEqual(partsOf(ABILITIES.ry_tamashii.effect).map((p) => p.type), ['buff', 'heal']);
  assert.ok(!Object.values(R82B_ABILITIES).some((a) => a.target === 'allies'), '仲間 全員に かける 技は ない');
  // 上級職の 剣の 技は 雷・ヤイバからは 今の 玉
  for (const id of ['rj_raikou', 'rj_inazuma', 'rj_shibire', 'raijin_sword_sig']) assert.equal(ABILITIES[id].effect.element, 'bolt', id);
  for (const id of ['kk_men', 'kk_kazaguruma', 'kk_kabuto', 'samurai_kid_sig', 'yb_zokusei', 'yb_senpu', 'yb_juji']) assert.equal(ABILITIES[id].effect.yb, 'tama', id);
  assert.deepEqual(ABILITIES.yaiba_sig.effect.balls, ['bolt', 'fire', 'water', 'ice']);
  assert.equal(ABILITIES.ryujin_samurai_sig.effect.balls.length, 7);
  assert.equal(ABILITIES.ry_ikari.effect.thunderMult, 1.5);
});

test('第82回 B の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'] });
      const act = use(b, me, { type: 'ability', id, tama: 'fire' });
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(ABILITIES[id]) === 'dmg') assert.ok(dmgOf(act) > 0 || act.results?.some((r) => r.miss), `${id} の ダメージ: ${act.lines}`);
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

// ───────────── 玉がえの しくみ ─────────────
test('第82回 B の 玉: 段で 持てる 玉・ほかの 職業に かわった あと・はじめは 雷', () => {
  assert.deepEqual(TAMA_ORDER, ['bolt', 'fire', 'water', 'ice', 'wind', 'light']);
  for (const el of [...TAMA_ORDER, 'blast']) {
    assert.ok(TAMA[el]?.name && TAMA[el].mark && /^#[0-9a-f]{6}$/.test(TAMA[el].color), el);
    textOk(TAMA[el].name, el);
  }
  assert.deepEqual(tamaSet({ job: 'samurai_kid', abilities: ['kk_men'] }), []);
  assert.deepEqual(tamaSet({ job: 'raijin_sword', abilities: [] }), ['bolt']);
  assert.deepEqual(tamaSet({ job: 'yaiba', abilities: [] }), ['bolt', 'fire', 'water', 'ice']);
  assert.deepEqual(tamaSet({ job: 'ryujin_samurai', abilities: [] }), TAMA_ORDER);
  // ほかの 職業: 玉がえを 覚えて いれば 4つ（竜神けんのサムライの 技も 覚えて いれば 6つ）・覚えて いなければ 雷・この 系統の 技が なければ なし
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: ['yb_tamagae', 'yb_zokusei'] }), ['bolt', 'fire', 'water', 'ice']);
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: ['yb_tamagae', 'ry_tachi'] }), TAMA_ORDER);
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: ['kk_men', 'rj_raikou'] }), ['bolt']);
  assert.deepEqual(tamaSet({ job: 'warrior', abilities: ['kk_men'] }), []);
  assert.deepEqual(tamaSet({ job: 'yaiba', mon: true }), [], '仲間の 魔物は 玉なし');
  assert.equal(tamaOf({ job: 'yaiba', abilities: [] }), 'bolt');
  assert.equal(tamaOf({ job: 'yaiba', abilities: [], tama: 'wind' }), 'bolt', '持てない 玉は 雷');
  assert.equal(tamaOf({ job: 'samurai_kid', abilities: [] }), null);
});

test('第82回 B の 玉: 玉がえで 剣の 技の 属性が かわる・すばやい・戦いごとに 雷から・キャラに 項目を 足さない', () => {
  // ほのおが 弱点の 敵
  const { b, c, me } = setup('yaiba', { resist: { fire: 1.5, bolt: 1, water: 1, ice: 1 } });
  assert.equal(pub(me).tama, 'bolt', 'はじめは 雷の玉（画面にも 出る）');
  let act = use(b, me, { type: 'ability', id: 'yb_zokusei' });
  assert.equal(act.fx.element, 'bolt');
  assert.ok(!act.lines.includes('弱点をついた！'));
  act = use(b, me, { type: 'ability', id: 'yb_tamagae', tama: 'fire' });
  assert.equal(me.tama, 'fire');
  assert.equal(pub(me).tama, 'fire');
  assert.equal(act.fx.element, 'fire');
  assert.ok(act.lines.includes('ヒナは、刀に火の玉をはめた！'), act.lines.join('/'));
  assert.equal(me.atb, YB_TAMAGAE_ATB, '玉がえは すばやい（すぐ 次の 番）');
  act = use(b, me, { type: 'ability', id: 'yb_zokusei' });
  assert.equal(act.fx.element, 'fire');
  assert.ok(act.lines.includes('弱点をついた！'), act.lines.join('/'));
  // 持てない 玉（ヤイバの 風）は えらべない → いちばん よい 玉か つぎの 玉
  use(b, me, { type: 'ability', id: 'yb_tamagae', tama: 'wind' });
  assert.ok(['bolt', 'fire', 'water', 'ice'].includes(me.tama));
  // キャラには のこらない・つぎの 戦いは また 雷
  assert.ok(!('tama' in c));
  for (const k of Object.keys(c)) assert.ok(!/tama|kyodai|raiGuard/.test(k), k);
  const b2 = new Battle({ rng: makeRng(2), allies: [{ char: c, controller: 's1' }], enemies: ['rockman'], canFlee: true });
  assert.equal(tamaOf(b2.allies[0]), 'bolt');
  assert.equal(pub(b2.allies[0]).tama, 'bolt');
});

test('第82回 B の 玉: 段で ちがう（小ぞうは 属性なし・雷神けんの剣士は 雷・ほかの 職業でも 覚えた 技）', () => {
  {
    const { b, me } = setup('samurai_kid');
    assert.equal(pub(me).tama, undefined, '小ぞうは 玉なし');
    const act = use(b, me, { type: 'ability', id: 'kk_men' });
    assert.equal(act.fx.element, undefined);
  }
  {
    const { b, me } = setup('raijin_sword');
    assert.equal(pub(me).tama, 'bolt');
    const act = use(b, me, { type: 'ability', id: 'kk_men', tama: 'fire' });
    assert.equal(act.fx.element, 'bolt', '雷神けんの剣士の めん！は 雷');
    assert.ok(!me.abilities.includes('yb_tamagae'));
  }
  {
    // ヤイバを きわめて 戦士に: 玉がえを 覚えて いるので 4つの 玉
    const { b, me } = setup('warrior', { extra: ['samurai_kid', 'raijin_sword', 'yaiba'] });
    assert.ok(me.abilities.includes('yb_tamagae'));
    use(b, me, { type: 'ability', id: 'yb_tamagae', tama: 'ice' });
    const act = use(b, me, { type: 'ability', id: 'yb_zokusei' });
    assert.equal(act.fx.element, 'ice');
  }
});

test('第82回 B の 天気: 雷の 技は 味方の 雷の 天気で ×1.3・雷神のいかりは ×1.5・かみなり雲よ来い', () => {
  const ratio = (job, id) => {
    const out = [];
    for (const thunder of [false, true]) {
      let sum = 0;
      for (let seed = 1; seed <= 30; seed++) {
        const { b, me } = setup(job, { seed, resist: {} });
        if (thunder) setWeather(b, 'thunder', 99, 'ally', me.id);
        sum += dmgOf(use(b, me, { type: 'ability', id }));
      }
      out.push(sum);
    }
    return out[1] / out[0];
  };
  const r1 = ratio('raijin_sword', 'raijin_sword_sig');
  assert.ok(r1 > 1.24 && r1 < 1.36, `かみなり斬り ×${r1.toFixed(2)}`);
  const r2 = ratio('ryujin_samurai', 'ry_ikari');
  assert.ok(r2 > 1.43 && r2 < 1.57, `雷神のいかり ×${r2.toFixed(2)}`);
  // かみなり雲よ来い: 味方の 雷の 天気（天気の しくみは 天候の 職業と おなじ）
  const { b, me } = setup('yaiba');
  const act = use(b, me, { type: 'ability', id: 'yb_kaminarigumo' });
  assert.equal(b.weather?.kind, 'thunder');
  assert.equal(b.weather.side, 'ally');
  assert.ok(act.weather?.kind === 'thunder');
});

test('第82回 B の 四つ玉斬り・七つ玉: 玉ごとに 1回・弱点は 大きい・効かない 玉と すいこむ 玉は 使わない', () => {
  // 弱点が 1つ（氷）の 敵
  const { b, me } = setup('yaiba', { resist: { ice: 1.5 } });
  let act = use(b, me, { type: 'ability', id: 'yaiba_sig' });
  const hits = act.results.filter((r) => r.dmg > 0 || r.miss);
  assert.equal(hits.length, 4);
  assert.deepEqual(act.results.filter((r) => r.dmg > 0).map((r) => r.element).sort(), act.results.filter((r) => r.dmg > 0).map((r) => r.element).sort());
  assert.ok(act.lines.some((l) => l === '弱点に1回当たった！'), act.lines.join('/'));
  const ice = act.results.find((r) => r.element === 'ice' && r.dmg > 0);
  const bolt = act.results.find((r) => r.element === 'bolt' && r.dmg > 0);
  if (ice && bolt && !ice.crit && !bolt.crit) assert.ok(ice.dmg > bolt.dmg * 1.4, `弱点 ${ice.dmg} / ${bolt.dmg}`);
  // 七つ玉: 7回（弱点が ある 敵なら どれかが 当たる）
  {
    const s = setup('ryujin_samurai', { resist: { dark: 1.5, wind: 1.5 } });
    act = use(s.b, s.me, { type: 'ability', id: 'ryujin_samurai_sig' });
    assert.equal(act.results.filter((r) => r.dmg > 0 || r.miss).length, 7);
    assert.ok(act.lines.includes('弱点に1回当たった！'), act.lines.join('/'));
    assert.deepEqual(new Set(act.results.map((r) => r.element)), new Set(['bolt', 'fire', 'water', 'ice', 'wind', 'blast', 'light']));
  }
  // 効かない 玉（0倍）は 使わない
  {
    const s = setup('yaiba', { resist: { fire: 0 } });
    act = use(s.b, s.me, { type: 'ability', id: 'yaiba_sig' });
    assert.equal(act.results.filter((r) => r.dmg > 0 || r.miss).length, 3);
    assert.ok(!act.results.some((r) => r.element === 'fire'));
    assert.ok(act.lines.some((l) => l.includes('火の玉は、効かないので使わなかった')), act.lines.join('/'));
  }
  // すいこむ よろい（闘技場の 王者）と おなじ 属性の 玉は 使わない（回復させない）
  {
    const s = setup('yaiba', { resist: {} });
    s.b.enemies[0].arArmor = 'water';
    act = use(s.b, s.me, { type: 'ability', id: 'yaiba_sig' });
    assert.ok(!act.results.some((r) => r.element === 'water'));
    assert.ok(!act.results.some((r) => r.heal > 0));
  }
});

test('第82回 B の きょだい化・雷神の守り: 剣の 技が 敵全体に・のこりの 回数で もどる・雷を すいこむ', () => {
  const { b, me } = setup('ryujin_samurai', { enemies: ['rockman', 'rockman', 'skeleton'], resist: {} });
  let act = use(b, me, { type: 'ability', id: 'ry_kyodai' });
  assert.ok(me.kyodai && me.buffs.atk && me.buffs.def);
  assert.equal(pub(me).kyodai, 4);
  act = use(b, me, { type: 'ability', id: 'yb_zokusei' });
  assert.equal(new Set(act.results.filter((r) => r.dmg > 0 || r.miss).map((r) => r.id)).size, 3, '1体の 技が 敵全体に');
  assert.ok(act.lines.includes('きょだい化した大きな刀が、敵全体にとどいた！'));
  assert.ok(KYODAI_SPREAD < 1);
  act = use(b, me, { type: 'ability', id: 'ryujin_samurai_sig' });
  assert.equal(act.results.filter((r) => r.dmg > 0 || r.miss).length, 21, '七つ玉も 敵全体（3体×7）');
  act = use(b, me, { type: 'ability', id: 'ry_tamashii' });
  act = use(b, me, { type: 'ability', id: 'yb_zokusei' });
  assert.ok(!me.kyodai && act.lines.some((l) => l.includes('元の大きさにもどった')), `${me.kyodai?.left} ${act.lines}`);
  assert.equal(new Set(act.results.map((r) => r.id)).size, 1);
  // 雷神の守り: 敵の 雷の 攻撃で 回復
  const s = setup('raijin_sword');
  use(s.b, s.me, { type: 'ability', id: 'rj_mamori' });
  assert.ok(s.me.raiGuard && s.me.buffs.def);
  s.me.hp = 100;
  const e = s.b.enemies[0];
  const ev = { lines: [], upd: [], results: [] };
  s.b.damage(e, s.me, 80, ev, { element: 'bolt' });
  assert.equal(s.me.hp, 140, '雷の ダメージの 半分 回復');
  s.b.damage(e, s.me, 80, ev, { element: 'fire' });
  assert.equal(s.me.hp, 60, 'ほかの 属性は ふつう');
});

test('第82回 B の オート: 弱点が 分かって いれば その 玉・分からなければ 雷の まま・雷の 天気なら 雷', () => {
  const { b, me } = setup('yaiba', { resist: { fire: 1.5, bolt: 1, water: 1, ice: 1 } });
  me.abilities = learnedAbilities(me.penChar);
  // 分からない（ためして いない）: 玉を かえない
  assert.equal(bestTama(b, me), null);
  for (let i = 0; i < 20; i++) assert.ok(decideAlly(b, me).id !== 'yb_tamagae');
  // 炎が 弱点と 分かった（この 戦いで ためした）
  b.tried.add(`${b.enemies[0].species}|fire`);
  assert.equal(bestTama(b, me), 'fire');
  const cmd = decideAlly(b, me);
  assert.deepEqual([cmd.id, cmd.tama], ['yb_tamagae', 'fire']);
  // 雷の 天気: 少しの 弱点（1.2）より 雷（1.3）
  const s = setup('yaiba', { resist: { fire: 1.2 } });
  s.b.tried.add(`${s.b.enemies[0].species}|fire`);
  assert.equal(bestTama(s.b, s.me), 'fire');
  setWeather(s.b, 'thunder', 99, 'ally', s.me.id);
  assert.equal(bestTama(s.b, s.me), null, '雷の 天気なら 雷の まま');
  // 雷が 効かないと 分かれば、分からない 玉に かえて ためす
  const t = setup('yaiba', { resist: { bolt: 0.5 } });
  t.b.tried.add(`${t.b.enemies[0].species}|bolt`);
  assert.ok(['fire', 'water', 'ice'].includes(bestTama(t.b, t.me)));
});

// ───────────── ひらめき技 ─────────────
test('第82回 B の ひらめき技: 上級職 1・超級職 1・伝説 2・データ・文字・その 道の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R82B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R82B).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R82B_ABILITIES[id].job === j).length), [0, 1, 1, 2]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R82B_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R82B_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'samurai_kid' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = 'warrior';
    assert.equal(hiraAllowed(c, id), false);
    // 使える・ひらめく
    {
      const { b, c: ch, me } = setup(a.job, { seed: ++n });
      ch.hirameki = [id];
      me.abilities = [...me.abilities, id];
      const act = use(b, me, { type: 'ability', id });
      assert.ok(dmgOf(act) > 0, `${id}: ダメージ`);
    }
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
test('第82回 B の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・大きなトラ', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('sword'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
  }
  // 合体技の 相手の 案: 天候の 職業（雷）・サムライ（剣）・忍者
  assert.ok(JOBS.yaiba.tags.includes('bolt') && JOBS.tenkou_tsukai.tags.includes('bolt'));
  for (const j of ['yaiba', 'ryujin_samurai']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 36);
    textOk(masterName(j), j);
  }
  // 乗り物: 大きなトラ（4つの 職業）
  const v = VEHICLES.big_tiger;
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'big_tiger');
  textOk(v.desc, 'big_tiger');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('big_tiger'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('big_tiger', view, f, 'back')) + lit(paintVehicle('big_tiger', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('big_tiger', view, f));
      frames.add([...(paintVehicle('big_tiger', view, f, 'front')?.px || [])].join());
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

test('第82回 B の 絵: 4つの 職業（男女・4方向・はみ出さない・段ごとに ちがう・るろうにと ちがう）・はちまき・からだ・古い え', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R82B_OUTFIT[j] && R82B_BODY[j] && R82B_HAT[j] && R82B_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'rurouni', 'samurai']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, 'hakama');
    assert.equal(headOf(null, job, 'cloth', O).kind, 'headband');
    assert.equal(jobBody(job).hair, 'spiky', 'つんつん 頭（かみの 色は その 人の まま）');
    assert.ok(!jobBody(job).hcol);
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.equal(jobBody('ryujin_samurai').aura, 'gold');
  assert.ok(jobBody('yaiba').spark && !jobBody('samurai_kid').spark);
});

// ───────────── えんしゅつ・玉の 札 ─────────────
test('第82回 B の えんしゅつ: 看板の 技・大事な 技・玉の 色で 剣の 光が かわる・音・つなぎ・こわれない', () => {
  const used = new Set([...Object.keys(R82B_ABILITIES), ...Object.keys(HIRA_R82B_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const anim of R82B_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R82B_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R82B_SFX).sort(), [...R82B_ANIMS].sort());
  assert.deepEqual(Object.keys(R82B_HIT).sort(), [...R82B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R82B_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  // みかたに かける えんしゅつは PARTY_ANIMS に まざる（がめんの 下の まん中）
  for (const a of PARTY_ANIMS_R82B) assert.ok(PARTY_ANIMS.has(a), a);
  for (const id of Object.keys(R82B_ABILITIES)) {
    const a = ABILITIES[id];
    if (a.target === 'self' && R82B_ANIMS.has(a.anim)) assert.ok(PARTY_ANIMS_R82B.has(a.anim), id);
    if (['enemy', 'enemies', 'group'].includes(a.target)) assert.ok(R82B_ANIMS.has(a.anim) && !PARTY_ANIMS_R82B.has(a.anim), `${id}: 敵に あたる えんしゅつ`);
  }
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R82B_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R82B_HIT\)/);
  assert.match(battle, /ab\.effect\.type === 'tamagae'\) return tamaMenu/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR82bFx\(this, anim/);
  // 玉の 色で 剣の 光が かわる（つぶの 色が ちがう）
  const colors = (el) => {
    const fx = new Effects();
    playR82bFx(fx, 'r82b_slash', [{ x: 128, y: 66 }], el, {}, BW, BH);
    return JSON.stringify(fx.parts.map((p) => p.color || p.glow || p.colors));
  };
  assert.notEqual(colors('fire'), colors('ice'));
  assert.notEqual(colors('bolt'), colors(null));
  for (const anim of R82B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const el of [null, 'bolt', 'fire', 'water', 'ice', 'wind', 'light']) {
        const fx = new Effects();
        assert.equal(playR82bFx(fx, anim, targets, el, { crit: el === 'fire' }, BW, BH), true, anim);
        fx.play(anim, targets, el, {});
        assert.ok(fx.parts.length > 0, anim);
        let t = 0;
        while (fx.parts.length && t < 4000) { fx.update(16); t += 16; }
        assert.ok(t <= 2200, `${anim}: ${t}ms`);
      }
    }
  }
  assert.equal(playR82bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR82bFx(new Effects(), 'yaiba_sig', []), false);
  // 仲間の まどの 札（家族 みんなに 見える）
  assert.deepEqual(r82bMarks({ alive: true, tama: 'fire', kyodai: 3 }).map((m) => m.text), ['火玉', 'きょだい3']);
  assert.deepEqual(r82bMarks({ alive: true }), []);
  assert.deepEqual(r82bMarks({ alive: false, tama: 'bolt' }), []);
  for (const el of [...TAMA_ORDER]) textOk(r82bMarks({ alive: true, tama: el })[0].text, el);
});
