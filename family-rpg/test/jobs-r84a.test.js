// 第84回 A班（2026年11月）: 幽☆遊☆白書の 系統（一発の 重い 格闘家。docs/plan-jobs-r79.md の 10-1・docs/plan-r84-jobs-a.md）
//   ふりょう（基本職）→ れい界探てい（上級職）→ うら飯ゆう助（超級職）→ 魔界の王の子（伝説。＋ほかの 超級職 1つ）
//  ・なり方・強さ・技・ひらめき技・合体技の タグ・試練・転職の ひとこと・乗り物・文字
//  ・この 系統だけの しくみ（shared/battle-r84a.js）: れい丸の 数（段で 2・4・6・転職の あと 2・はじめは まんたん・足りないと えらべない・
//    ためると もどる・ぜんぶ うつ 技）・1回だけ 立ち上がる（毒・そくしの しかけでは 立たない・全めつの 判定）・仲間のために・オート・
//    キャラに 項目を 足さない
//  ・絵（hero-r84a.js）・乗り物の 絵（vehicle-r84a.js）・えんしゅつ（battlefx-r84a.js）・れい丸の 札と えらべない わけ（client/battle-r84a.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R84A, R84A_ORDERS, R84A_JOBS } from '../public/js/shared/data/jobs-r84a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R84A_ABILITIES } from '../public/js/shared/data/abilities-r84a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R84A_ABILITIES, HIRAMEKI_R84A } from '../public/js/shared/data/hirameki-r84a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { REI_BY_TIER, OTHER_REI, reiMax, reiLeft, reiNeed, reiOk, reiReason, nakamaMult, r84aPlan, r84aRise, riseOf } from '../public/js/shared/battle-r84a.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle, pub } from '../public/js/shared/battle.js';
import { decideAlly, fightWeight, canUse } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R84A_JOBS as LOOK_JOBS, R84A_OUTFIT, R84A_BODY, R84A_HAT, R84A_OLD_LOOK } from '../public/js/client/render/hero-r84a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R84A_ANIMS, R84A_SIGS, R84A_HIT, R84A_SFX, PARTY_ANIMS_R84A, playR84aFx, setReiShots } from '../public/js/client/render/battlefx-r84a.js';
import { r84aMarks, reiBlock, reiTag } from '../public/js/client/battle-r84a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['furyo', 'reikai_tantei', 'yusuke', 'makai_prince'];
// [名前, 段, なり方]
const TREE = {
  furyo: ['ふりょう', 0, undefined],
  reikai_tantei: ['れい界探てい', 1, ['furyo']],
  yusuke: ['うら飯ゆう助', 2, ['reikai_tantei']],
  makai_prince: ['魔界の王の子', 3, ['yusuke']],
};
const SIG_NAMES = { furyo: 'けんか百れつけん', reikai_tantei: 'れい丸・フルパワー', yusuke: 'れい丸・最大出力', makai_prince: '超・れい丸' };
const SUM_RANGE = [[6.05, 7.35], [6.65, 8.0], [7.75, 9.05], [9.3, 10.2]];
const BOY = { body: 0 };
const SCARY = /殺|死ね|ころす|ころし|血だらけ|ぶっころ|しね/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体|ランダム/, group: /同じ種類の敵/, allies: /仲間全員/, ally: /仲間1人/, self: /自分|れい丸/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

// その 職業の 人 1人 ＋ 仲間（mates … 職業）。enemies … 魔物の 種類
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, mates = [], boss = false, hp = 50000 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ユウ', job: 'furyo' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const allies = [{ char: c, controller: 's1' }];
  mates.forEach((mj, i) => {
    const m = newCharacter({ id: `m${i}`, name: ['ソラ', 'ミナ', 'ケン'][i], job: 'warrior' });
    gainExp(m, expForLevel(lv));
    masterChain(m, mj);
    master(m, mj);
    m.job = mj;
    fullHeal(m);
    allies.push({ char: m, controller: `s${i + 2}` });
  });
  const b = new Battle({ rng: makeRng(seed), allies, enemies, canFlee: !boss, boss });
  for (const e of b.enemies) {
    e.actions = [{ w: 1, id: 'm_nothing' }];
    e.hp = e.maxHp = hp;
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
  const tgt = ['ally'].includes(ABILITIES[cmd.id]?.target) ? b.allies.find((x) => x !== me)?.id || me.id : b.enemies.find((e) => e.alive)?.id;
  const r = b.command(me.id, { target: tgt, ...cmd }, 's1');
  assert.equal(r.ok, true, `${cmd.id} ${r.reason || ''}`);
  return runUntilAct(b, me.id);
};
const dmgOf = (act) => (act.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
const ev0 = () => ({ lines: [], upd: [] });
const mineOf = (s) => learnedAbilities(s.c).map((id) => ({ id, a: ABILITIES[id] }));

// ───────────── 職業の 木 ─────────────
test('第84回 A の 職業: 4だん（基本職から 伝説まで）・ならび・うわさ・文字・武器・はじめの 装備', () => {
  assert.deepEqual(R84A_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R84A), NEW);
  const orders = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R84A_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc && j.body === undefined, '男の子も 女の子も なれる・おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    // 素手・つめ（バットは 基本職だけ）
    assert.deepEqual(j.weapons, tier === 0 ? ['claw', 'bat', 'none'] : ['claw', 'none']);
    assert.equal(j.family, 'phys');
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    if (tier >= 2) {
      assert.ok(JOB_HINTS[id], id);
      textOk(JOB_HINTS[id], id);
    }
  }
  assert.equal(jobReqText('reikai_tantei'), 'ふりょうLv10');
  assert.equal(jobReqText('makai_prince'), 'うら飯ゆう助Lv10＋ほかの超級職1つLv10');
  assert.ok(JOB_ORDER.includes('furyo'));
  assert.equal(newCharacter({ id: 'a', name: 'a', job: 'furyo' }).job, 'furyo');
  assert.equal(STARTER_EQUIP.furyo.weapon, null, 'はじめは 素手');
  // ふりょうは 子ども向けに（けんかっ早いが 仲間思い）
  assert.match(JOBS.furyo.desc, /仲間/);
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  assert.match(title, /furyo: 'けんかっ早いが仲間思い'/);
  // 1回だけ 立ち上がる（超級職から）
  assert.deepEqual(NEW.map((j) => !!JOBS[j].passive?.rise), [false, false, true, true]);
  const files = gameFiles();
  for (const f of ['jobs-r84a.js', 'abilities-r84a.js', 'hirameki-r84a.js', 'shared/battle-r84a.js', 'client/battle-r84a.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第84回 A の 職業: なれる じゅんばん（1本道・伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'furyo' });
  assert.equal(jobUnlocked(c, 'reikai_tantei'), false);
  master(c, 'furyo');
  assert.equal(jobUnlocked(c, 'reikai_tantei'), true);
  assert.equal(jobUnlocked(c, 'yusuke'), false);
  master(c, 'reikai_tantei');
  assert.equal(jobUnlocked(c, 'yusuke'), true);
  assert.equal(jobKnown(c, 'makai_prince'), false, '伝説は はじめ ひみつ');
  master(c, 'yusuke');
  assert.equal(jobKnown(c, 'makai_prince'), true, 'ゆう助を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'makai_prince'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'ss2');
  assert.equal(jobUnlocked(c, 'makai_prince'), true);
  assert.equal(changeJob(c, 'makai_prince').ok, true);
  assert.ok(learnedAbilities(c).includes('mk_youga'));
});

test('第84回 A の 職業: 能力の 合計は 段の はんい・下の 段より 強い・力と HP 高め・魔力 低め', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  NEW.forEach((j, i) => {
    const m = JOBS[j].mods;
    assert.deepEqual(Object.keys(m).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    const [lo, hi] = SUM_RANGE[i];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    if (i) assert.ok(sum(j) > sum(NEW[i - 1]) + 0.4, `${j} は 下の 段より 強い`);
    assert.ok(m.str >= Math.max(...Object.values(m)) - 1e-9 && m.mag < m.str && m.hp > m.mp, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
  });
  // 設計の めやす（10-1 の 表）
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [6.5, 7.0, 8.35, 9.6]);
});

// ───────────── 技 ─────────────
test('第84回 A の 技: 6こ（伝説は Lv1・3・5・7・8・10）・Lv10 が いちばん MP の 看板の 技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, j === 'makai_prince' ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 5, 7, 10]);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.ok(R84A_SIGS.includes(ABILITIES[sig].anim));
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.equal(a.kind, 'skill', id);
      assert.ok(!a.weapon && !a.masc, id);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff') assert.ok(p.mult <= (JOBS[j].tier ? 1.3 : 1.25) + 1e-9, a.name);
        if (['status', 'debuff', 'atbSet'].includes(p.type)) assert.ok(p.chance < 1, a.name);
      }
      // れい丸の 技は せつめいに 何発 使うか
      if (reiNeed(a)) assert.match(a.desc, /れい丸を[12]発使う|全部/, id);
    }
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= 2, `${j}: 攻撃技 2つ いじょう`);
  }
  assert.deepEqual([...mine].sort(), Object.keys(R84A_ABILITIES).sort());
  // 設計の 技の 名前（10-1 の 表。かえた 名前は docs/plan-r84-jobs-a.md）
  const nm = (j) => JOBS[j].learn.map(([, id]) => ABILITIES[id].name);
  assert.deepEqual(nm('furyo'), ['けんかパンチ', 'ガンをとばす', 'ずつき', '屋上でひるね', '仲間をかばう', 'けんか百れつけん']);
  assert.deepEqual(nm('reikai_tantei'), ['れい丸', 'れい力をためる', 'れい界の道具', 'ショットガン', 'こんじょう', 'れい丸・フルパワー']);
  assert.deepEqual(nm('yusuke'), ['れい光だん', 'れい光はどうけんの修行', 'れい丸・二連', '仲間のために', 'ばくれつけん', 'れい丸・最大出力']);
  assert.deepEqual(nm('makai_prince'), ['よう丸', '魔族の血', 'れい丸・さんだん', 'とう気をねる', '楽しいけんか', '超・れい丸']);
  // れい丸の 数（使う 数）
  assert.deepEqual(Object.fromEntries(Object.keys(R84A_ABILITIES).filter((id) => reiNeed(ABILITIES[id])).map((id) => [id, reiNeed(ABILITIES[id])])), {
    rt_reigan: 1, rt_shotgun: 1, reikai_tantei_sig: 1, yu_niren: 2, yusuke_sig: 2, mk_youga: 1, mk_sandan: 2, makai_prince_sig: 2,
  });
  // れい光だん は れい丸を 使わない（こぶし）
  assert.equal(reiNeed(ABILITIES.yu_reikou), 0);
});

test('第84回 A の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'], mates: ['warrior'] });
      const act = use(b, me, { type: 'ability', id });
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった') || l.includes('れい丸がもうない')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(ABILITIES[id]) === 'dmg') assert.ok(dmgOf(act) > 0 || act.results?.some((r) => r.miss), `${id} の ダメージ: ${act.lines}`);
    }
    const s = setup(j, { seed: 7, mates: ['warrior'], boss: true });
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

// ───────────── れい丸の 数 ─────────────
test('第84回 A の れい丸: 段で 2・4・6発（はじめは まんたん）・使うと へる・札・足りないと えらべない（わけ）・キャラに 項目を 足さない', () => {
  assert.deepEqual(REI_BY_TIER, [0, 2, 4, 6]);
  assert.equal(OTHER_REI, 2);
  const maxes = NEW.map((j) => reiMax(setup(j).me));
  assert.deepEqual(maxes, [0, 2, 4, 6]);
  // 転職した あと: れい丸の 技を 覚えて いれば 2発・覚えて いなければ 0
  const o = setup('god_hand');
  assert.equal(reiMax(o.me), 0);
  o.me.abilities = [...o.me.abilities, 'rt_reigan'];
  assert.equal(reiMax(o.me), 2);
  assert.equal(reiLeft(o.me), 2);
  assert.equal(reiMax({ job: 'yusuke', abilities: [], mon: true }), 0, '魔物は もたない');

  const { b, c, me } = setup('yusuke', { mates: ['warrior'] });
  assert.equal(reiLeft(me), 4, 'はじめは まんたん');
  assert.deepEqual(pub(me).r84aRei, { n: 4, max: 4 });
  assert.deepEqual(r84aMarks(pub(me)).map((m) => m.text), ['れい丸4']);
  assert.equal(pub(b.allies[1]).r84aRei, undefined, 'れい丸を もたない 人は 札なし');
  const a1 = use(b, me, { type: 'ability', id: 'rt_reigan' });
  assert.ok(dmgOf(a1) > 0 || a1.results.some((r) => r.miss));
  assert.ok(a1.lines.some((l) => l.includes('のこり3発')), a1.lines.join());
  assert.equal(a1.fx.rei, 1);
  assert.equal(reiLeft(me), 3);
  const a2 = use(b, me, { type: 'ability', id: 'yu_niren' });
  assert.equal(a2.results.filter((r) => r.dmg > 0 || r.miss).length, 2, '2回 当てる');
  assert.equal(reiLeft(me), 1);
  assert.deepEqual(r84aMarks(pub(me)).map((m) => m.text), ['れい丸1']);
  // 2発 いる 技は えらべない（わけ）
  readyUp(b, me);
  const r = b.command(me.id, { type: 'ability', id: 'yusuke_sig', target: b.enemies[0].id }, 's1');
  assert.deepEqual(r, { ok: false, reason: 'れい丸が2発いる（のこり1発）' });
  assert.equal(canUse(b, me, 'yusuke_sig'), false);
  assert.equal(canUse(b, me, 'rt_reigan'), true);
  assert.equal(reiBlock(pub(me), ABILITIES.yusuke_sig), 'れい丸が2発いる（のこり1発）');
  assert.equal(reiBlock(pub(me), ABILITIES.rt_reigan), null);
  assert.equal(reiBlock(pub(me), ABILITIES.yu_reikou), null, 'れい丸を 使わない 技は いつでも');
  // 0発: れい丸の 技は ぜんぶ えらべない
  me.r84aRei = 0;
  assert.equal(reiOk(me, ABILITIES.rt_reigan), false);
  assert.equal(reiReason(me, ABILITIES.rt_reigan), 'れい丸がもうない');
  assert.match(reiBlock(pub(me), ABILITIES.rt_reigan), /^れい丸がもうない/);
  assert.equal(r84aMarks(pub(me))[0].cls, 'rei zero');
  // れい力をためる で 1発・とう気をねる で 2発（上限まで）
  b.command(me.id, { type: 'ability', id: 'rt_tame' }, 's1');
  runUntilAct(b, me.id);
  assert.equal(reiLeft(me), 1);
  for (const l of [reiTag(ABILITIES.rt_reigan), reiTag(ABILITIES.makai_prince_sig)]) assert.match(l, /丸/);
  assert.equal(reiTag(ABILITIES.yu_reikou), '');
  // キャラ（セーブ・引っこしコード）には 項目を 足さない
  assert.ok(!Object.keys(c).some((k) => /r84a|rei/i.test(k)), Object.keys(c).join());
  assert.ok(!JSON.stringify(c).includes('r84a'));
  // 次の 戦いは また まんたん
  const next = new Battle({ rng: makeRng(2), allies: [{ char: c, controller: 's1' }], enemies: ['rockman'] });
  assert.equal(reiLeft(next.allies[0]), 4);

  const m = setup('makai_prince');
  m.me.r84aRei = 5;
  const t = use(m.b, m.me, { type: 'ability', id: 'mk_touki' });
  assert.ok(t.lines.some((l) => l.includes('れい丸が1発もどった')), t.lines.join());
  assert.equal(reiLeft(m.me), 6, '上限まで');
});

test('第84回 A の れい丸: のこりを ぜんぶ うつ 技（フルパワーは 2発まで・多いほど 強い／超・れい丸は 2発 いじょう・うった 数だけ 当てる）', () => {
  // フルパワー: 2発 こめた 方が 1発より 強い
  const avg = (shots) => {
    let sum = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const { b, me } = setup('reikai_tantei', { seed });
      me.r84aRei = shots;
      const act = use(b, me, { type: 'ability', id: 'reikai_tantei_sig' });
      assert.equal(act.fx.rei, shots);
      assert.equal(reiLeft(me), 0);
      sum += dmgOf(act);
    }
    return sum / 6;
  };
  assert.ok(avg(2) > avg(1) * 1.4, 'こめた れい丸が 多いほど 強い');
  // 上級職より 上の 段でも 2発まで（のこりは とっておく）
  const y = setup('yusuke');
  use(y.b, y.me, { type: 'ability', id: 'reikai_tantei_sig' });
  assert.equal(reiLeft(y.me), 2);
  // 超・れい丸: 2発 いじょう いる・うった 数だけ 当てる
  const s = setup('makai_prince');
  s.me.r84aRei = 1;
  assert.equal(canUse(s.b, s.me, 'makai_prince_sig'), false);
  assert.equal(reiReason(s.me, ABILITIES.makai_prince_sig), 'れい丸が2発いる（のこり1発）');
  s.me.r84aRei = 5;
  const act = use(s.b, s.me, { type: 'ability', id: 'makai_prince_sig' });
  assert.equal(act.results.filter((r) => r.dmg > 0 || r.miss).length, 5, act.lines.join());
  assert.equal(reiLeft(s.me), 0);
  assert.equal(act.fx.rei, 5);
});

// ───────────── 1回だけ 立ち上がる・仲間のために ─────────────
test('第84回 A の 立ち上がる: 超級職から 1回だけ（HP 3わり）・伝説は 半分 ＋ 3回 力が 上がる・2回めは たおれる・札', () => {
  assert.equal(riseOf(setup('reikai_tantei').me), null, '上級職は 立ち上がらない');
  const { b, me } = setup('yusuke', { mates: ['warrior'] });
  const foe = b.enemies[0];
  const ev = ev0();
  b.damage(foe, me, me.maxHp * 3, ev, {});
  assert.ok(me.alive, ev.lines.join());
  assert.equal(me.hp, Math.round(me.maxHp * 0.3));
  assert.ok(ev.lines.includes(`${me.name}「まだ、終わってねえ！」`), ev.lines.join());
  for (const l of ev.lines) textOk(l, 'rise');
  assert.ok(ev.results.some((r) => r.id === me.id && r.rise));
  assert.equal(pub(me).r84aRose, true);
  // 2回めは ない
  const ev2 = ev0();
  b.damage(foe, me, me.maxHp * 3, ev2, {});
  assert.equal(me.alive, false, ev2.lines.join());
  // 生き返っても もう 立ち上がらない（その 戦いで 1回だけ）
  me.alive = true;
  me.hp = 10;
  b.damage(foe, me, 999999, ev0(), {});
  assert.equal(me.alive, false);

  // 伝説: HP 半分・3回の 行動の 間 物理の 力 1.3倍（札「本気」）
  const L = setup('makai_prince', { mates: ['warrior'] });
  const ev3 = ev0();
  L.b.damage(L.b.enemies[0], L.me, 999999, ev3, {});
  assert.equal(L.me.hp, Math.round(L.me.maxHp * 0.5));
  assert.deepEqual(L.me.r84aRise, { left: 3, pow: 1.3 });
  assert.ok(r84aMarks(pub(L.me)).some((m) => m.text === '本気3'));
  const base = L.b.calcPhys(L.me, L.b.enemies[0], { mult: 1 }, 1, 'phys', true).dmg;
  delete L.me.r84aRise;
  const plain = L.b.calcPhys(L.me, L.b.enemies[0], { mult: 1 }, 1, 'phys', true).dmg;
  assert.ok(Math.abs(base / plain - 1.3) < 0.02, `${base} / ${plain}`);
  L.me.r84aRise = { left: 3, pow: 1.3 };
  for (let i = 0; i < 3; i++) use(L.b, L.me, { type: 'ability', id: 'yu_reikou' });
  assert.equal(L.me.r84aRise, undefined, '3回で もどる');
});

test('第84回 A の 立ち上がる: 毒・そくしの しかけでは 立たない・全めつの 判定（立ち上がった 人が いれば つづく）・敵は 立たない', () => {
  // 毒では 立ち上がらない
  const p = setup('yusuke', { mates: ['warrior'] });
  p.me.status.poison = { left: 99 };
  p.me.hp = 1;
  for (let i = 0; i < 200 && p.me.alive; i++) p.b.tick(50);
  assert.equal(p.me.alive, false, '毒');
  assert.ok(!p.me.r84aRose);
  // そくしの しかけ（kill を 直接）では 立ち上がらない
  const k = setup('yusuke');
  k.me.hp = 0;
  k.b.kill(k.me, 'dark', ev0());
  assert.equal(k.me.alive, false);
  assert.equal(r84aRise(k.b, k.me, ev0()), false);
  // 全めつの 判定: のこりの 1人が 立ち上がれば 戦いは つづく
  const w = setup('yusuke', { mates: ['warrior'] });
  w.b.damage(w.b.enemies[0], w.b.allies[1], 999999, ev0(), {});
  w.b.damage(w.b.enemies[0], w.me, 999999, ev0(), {});
  w.b.checkEnd();
  assert.equal(w.b.pendingEnd, null);
  w.b.damage(w.b.enemies[0], w.me, 999999, ev0(), {});
  w.b.checkEnd();
  assert.equal(w.b.pendingEnd?.outcome, 'lose');
  // 敵（職業の試練の まぼろし など）は 立ち上がらない
  assert.equal(riseOf({ side: 'enemy', job: 'yusuke' }), null);
});

test('第84回 A の 仲間のために: たおれた 仲間が いるほど 力が 上がる（上限）・3回で もどる', () => {
  const { b, me } = setup('yusuke', { mates: ['warrior', 'mage', 'priest'] });
  const act = use(b, me, { type: 'ability', id: 'yu_nakama' });
  assert.ok(act.lines.some((l) => l.includes('力が上がった')), act.lines.join());
  assert.ok(Math.abs(nakamaMult(b, me) - 1.1) < 1e-9);
  b.allies[1].alive = false;
  assert.ok(Math.abs(nakamaMult(b, me) - 1.3) < 1e-9);
  b.allies[2].alive = false;
  b.allies[3].alive = false;
  assert.ok(Math.abs(nakamaMult(b, me) - 1.7) < 1e-9, '上限 1.7');
  assert.ok(r84aMarks(pub(me)).some((m) => /^仲間\d$/.test(m.text)));
  for (let i = 0; i < 3; i++) use(b, me, { type: 'ability', id: 'yu_reikou' });
  assert.equal(nakamaMult(b, me), 1, '3回で もどる');
});

// ───────────── オート ─────────────
test('第84回 A の オート: 強い 敵には れい丸・ざこには 使わない・0 なら ためる・ぜんぶ うつ 技は まんたんの 時・仲間のために', () => {
  const rei = (cmd) => cmd?.type === 'ability' && reiNeed(ABILITIES[cmd.id]) > 0;
  const count = (s, n = 30) => {
    let r = 0;
    for (let i = 0; i < n; i++) if (rei(decideAlly(s.b, s.me))) r++;
    return r;
  };
  // ボス: れい丸の 技を 使う
  const boss = setup('makai_prince', { boss: true });
  assert.ok(count(boss) >= 8, 'ボスには れい丸');
  // まんたん（6発）なら ぜんぶ うつ 超・れい丸 も えらぶ・へって いると えらばない
  const picks = new Set();
  for (let i = 0; i < 30; i++) picks.add(decideAlly(boss.b, boss.me).id);
  assert.ok(picks.has('makai_prince_sig'), [...picks].join());
  boss.me.r84aRei = 4;
  let sig = 0;
  for (let i = 0; i < 40; i++) if (decideAlly(boss.b, boss.me).id === 'makai_prince_sig') sig++;
  assert.ok(sig <= 4, `へって いる 時は ほとんど 使わない: ${sig}`);
  // ざこ（すぐ たおせる 敵）: れい丸を むだに しない
  const weak = setup('yusuke', { enemies: ['rockman', 'rockman'], hp: 30 });
  assert.equal(fightWeight(weak.b).hard, false);
  assert.equal(count(weak), 0, 'ざこには 使わない');
  // 0発・強い 敵: れい力をためる（とう気をねる）か こぶしの 技
  const z = setup('yusuke', { boss: true });
  z.me.r84aRei = 0;
  const got = new Set();
  for (let i = 0; i < 40; i++) {
    const cmd = decideAlly(z.b, z.me);
    assert.ok(!rei(cmd), JSON.stringify(cmd));
    got.add(cmd.id || cmd.type);
  }
  assert.ok(got.has('rt_tame'), [...got].join());
  // 仲間のために: たおれた 仲間が いる 時
  const n = setup('yusuke', { boss: true, mates: ['warrior'] });
  n.b.allies[1].alive = false;
  let nk = 0;
  for (let i = 0; i < 30; i++) if (r84aPlan(n.b, n.me, n.b.aliveEnemies(), mineOf(n), n.b.aliveAllies(), fightWeight(n.b))?.id === 'yu_nakama') nk++;
  assert.ok(nk >= 10, `${nk}`);
  // ほかの 職業の オートは かわらない（技を 持たない 人は 何も しない）
  const o = setup('god_hand', { mates: ['warrior'] });
  assert.equal(r84aPlan(o.b, o.me, o.b.aliveEnemies(), mineOf(o), o.b.aliveAllies(), fightWeight(o.b)), null);
});

// ───────────── ひらめき技 ─────────────
test('第84回 A の ひらめき技: 4つの 職業に 1つずつ・データ・文字・その 道の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R84A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R84A).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R84A_ABILITIES[id].job === j).length), [1, 1, 1, 1]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R84A_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    assert.equal(reiNeed(a), 0, 'ひらめき技は れい丸を 使わない');
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R84A_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'furyo' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = 'warrior';
    assert.equal(hiraAllowed(c, id), false);
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
test('第84回 A の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・青いれい界の鳥', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('fist'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
  }
  // 合体技の 相手の 案: サイヤ人（こぶし）・名探てい（推理）・武闘家（こぶし）
  assert.ok(JOBS.saiyan.tags.includes('fist') && JOBS.monk.tags.includes('fist') && JOBS.meitantei.tags.includes('detective'));
  assert.ok(JOBS.reikai_tantei.tags.includes('detective'));
  for (const j of ['yusuke', 'makai_prince']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 3, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
  }
  const v = VEHICLES.rei_bird;
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'rei_bird');
  textOk(v.desc, 'rei_bird');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('rei_bird'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('rei_bird', view, f, 'back')) + lit(paintVehicle('rei_bird', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('rei_bird', view, f));
      frames.add([...(paintVehicle('rei_bird', view, f, 'front')?.px || [])].join() + [...(paintVehicle('rei_bird', view, f, 'back')?.px || [])].join());
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

test('第84回 A の 絵: 4つの 職業（男女・4方向・はみ出さない・段ごとに ちがう・ほかの 格闘家と ちがう）・服の 形・かみがた・古い え', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R84A_OUTFIT[j] && R84A_BODY[j] && R84A_OLD_LOOK[j], j);
  const KIND = { furyo: 'gakuran', reikai_tantei: 'suit', yusuke: 'gi', makai_prince: 'gi' };
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'monk', 'middleschooler', 'saiyan', 'god_hand']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, KIND[job], job);
    assert.ok(!jobBody(job).hcol, 'かみの 色は その 人の まま');
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.equal(headOf(null, 'reikai_tantei', 'cloth', outfitOf({ cloth: '#3f7fd0', skin: 0 }, 'reikai_tantei', 'cloth', false)).kind, 'fedora26');
  assert.deepEqual(NEW.map((j) => jobBody(j).hair), ['slick', 'slick', 'slick', 'long']);
  assert.equal(jobBody('makai_prince').aura, 'ryuma');
});

// ───────────── えんしゅつ・れい丸の 札 ─────────────
test('第84回 A の えんしゅつ: 看板の 技・大事な 技（指先から 青い 光の 玉）・音・つなぎ・こわれない・札', () => {
  const used = new Set([...Object.keys(R84A_ABILITIES), ...Object.keys(HIRA_R84A_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const anim of R84A_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R84A_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R84A_SFX).sort(), [...R84A_ANIMS].sort());
  assert.deepEqual(Object.keys(R84A_HIT).sort(), [...R84A_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R84A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const a of PARTY_ANIMS_R84A) assert.ok(PARTY_ANIMS.has(a), a);
  for (const id of Object.keys(R84A_ABILITIES)) {
    const a = ABILITIES[id];
    if (['self', 'allies', 'ally'].includes(a.target) && R84A_ANIMS.has(a.anim)) assert.ok(PARTY_ANIMS_R84A.has(a.anim), id);
    if (['enemy', 'enemies', 'group'].includes(a.target) && R84A_ANIMS.has(a.anim)) assert.ok(!PARTY_ANIMS_R84A.has(a.anim), `${id}: 敵に あたる えんしゅつ`);
  }
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R84A_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R84A_HIT\)/);
  assert.match(battle, /disabled: noMp \|\| sil \|\| noRei/);
  assert.match(battle, /setReiShots\(fx\.rei\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR84aFx\(this, anim/);
  for (const anim of R84A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const shots of [1, 6]) {
        setReiShots(shots);
        const fx = new Effects();
        assert.equal(playR84aFx(fx, anim, targets, null, { crit: true }, BW, BH), true, anim);
        fx.play(anim, targets, null, {});
        assert.ok(fx.parts.length > 0, anim);
        let t = 0;
        while (fx.parts.length && t < 4000) { fx.update(16); t += 16; }
        assert.ok(t <= 2200, `${anim}: ${t}ms`);
      }
    }
  }
  setReiShots(null);
  assert.equal(playR84aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR84aFx(new Effects(), 'yusuke_sig', []), false);
  // 仲間の まどの 札（家族 みんなに 見える）
  assert.deepEqual(r84aMarks({ alive: true, r84aRei: { n: 3, max: 4 }, r84aNakama: 2, r84aRise: 1 }).map((m) => m.text), ['れい丸3', '仲間2', '本気1']);
  assert.deepEqual(r84aMarks({ alive: true }), []);
  assert.deepEqual(r84aMarks({ alive: false, r84aRei: { n: 3, max: 4 } }), []);
  for (const m of r84aMarks({ alive: true, r84aRei: { n: 0, max: 6 }, r84aNakama: 3, r84aRise: 3 })) textOk(m.text, m.cls);
});

// ───────────── ほかの 新しい 系統と 同じ パーティー ─────────────
test('第84回 A: 封神演義（作戦）・ぬ〜べ〜（鬼の手・自動で かばう）と 同じ パーティーでも、れい丸・立ち上がりと おたがいを こわさない', () => {
  const { b, me } = setup('yusuke', { mates: ['hoshin_gunshi', 'jigoku_sensei'], boss: true });
  const gunshi = b.allies[1];
  // 軍師が 攻めの 作戦 → れい丸の 技も ふつうに うてる（れい丸の 数は かわらない）
  readyUp(b, gunshi);
  assert.equal(b.command(gunshi.id, { type: 'ability', id: 'sd_sakusen', sakusen: 'seme' }, 's2').ok, true);
  runUntilAct(b, gunshi.id);
  assert.equal(b.r83aPlan?.kind, 'seme');
  assert.equal(reiLeft(me), 4);
  const act = use(b, me, { type: 'ability', id: 'rt_reigan' });
  assert.ok(dmgOf(act) > 0 || act.results.some((r) => r.miss));
  assert.equal(reiLeft(me), 3);
  assert.deepEqual(r84aMarks(pub(me)).map((m) => m.text).filter((t) => t.startsWith('れい丸')), ['れい丸3']);
  assert.ok(pub(me).r83aPlan, '作戦の 札も ならぶ');
  // 守りの 作戦で へらしても たおれる ダメージなら 立ち上がる（作戦は のこる）
  b.r83aPlan = { ...b.r83aPlan, kind: 'mamori' };
  const ev = ev0();
  b.damage(b.enemies[0], me, 999999, ev, {});
  assert.ok(me.alive && me.r84aRose, ev.lines.join());
  assert.ok(b.r83aPlan);
  // みんな オートで しばらく 戦っても こわれない（れい丸は 0〜4・作戦・鬼の手・自動で かばうも そのまま 動く）
  for (const a of b.allies) a.auto = true;
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'attack' }];
  for (let i = 0; i < 1500 && !b.over; i++) b.tick(50);
  assert.ok(reiLeft(me) >= 0 && reiLeft(me) <= 4);
  assert.ok(!('r84aRei' in me) || Number.isFinite(me.r84aRei));
});
