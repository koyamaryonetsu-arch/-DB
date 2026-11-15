// 第83回 A班（2026年11月）: 封神演義の 系統（軍師。docs/plan-jobs-r79.md の 9-1・docs/plan-r83-jobs-a.md）
//   つりをする道士（基本職）→ せん人界の道士（上級職）→ 太公望（超級職）→ ほう神の大軍師（伝説。＋ほかの 超級職 1つ）
//  ・なり方・強さ・技・ひらめき技・合体技の タグ・試練・転職の ひとこと・乗り物・文字
//  ・この 系統だけの しくみ（shared/battle-r83a.js）: 作戦（ずっと 効く・1つだけ・段で 効き目・軍師が たおれると とぎれる・転職の あと）・
//    強化ふうじ（ボスの しかけは 消さない）・太極図・先読みの策（下げすぎ ふせぎ）・守りの旗・軍師の号令・ほう神・ほう神計画・オート・キャラに 項目を 足さない
//  ・絵（hero-r83a.js）・乗り物の 絵（vehicle-r83a.js）・えんしゅつ（battlefx-r83a.js）・作戦の 札（client/battle-r83a.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R83A, R83A_ORDERS, R83A_JOBS } from '../public/js/shared/data/jobs-r83a.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R83A_ABILITIES } from '../public/js/shared/data/abilities-r83a.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R83A_ABILITIES, HIRAMEKI_R83A } from '../public/js/shared/data/hirameki-r83a.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { SAKUSEN, SAKUSEN_ORDER, SAKUSEN_PCT, OTHER_PCT, CUT_FLOOR, sakusenSet, sakusenPct, activePlan, normalBuffs, r83aDamage, r83aPlan } from '../public/js/shared/battle-r83a.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed, STARTER_EQUIP } from '../public/js/shared/stats.js';
import { Battle, pub, atbRate } from '../public/js/shared/battle.js';
import { decideAlly, fightWeight } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { R83A_JOBS as LOOK_JOBS, R83A_OUTFIT, R83A_BODY, R83A_HAT, R83A_OLD_LOOK } from '../public/js/client/render/hero-r83a.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R83A_ANIMS, R83A_SIGS, R83A_HIT, R83A_SFX, PARTY_ANIMS_R83A, playR83aFx } from '../public/js/client/render/battlefx-r83a.js';
import { r83aMarks } from '../public/js/client/battle-r83a.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['fishing_doshi', 'sennin_doshi', 'taikobo', 'hoshin_gunshi'];
// [名前, 段, なり方]
const TREE = {
  fishing_doshi: ['つりをする道士', 0, undefined],
  sennin_doshi: ['せん人界の道士', 1, ['fishing_doshi']],
  taikobo: ['太公望', 2, ['sennin_doshi']],
  hoshin_gunshi: ['ほう神の大軍師', 3, ['taikobo']],
};
const SIG_NAMES = { fishing_doshi: '大物がつれた！', sennin_doshi: '打神べん・大風', taikobo: '太極図', hoshin_gunshi: 'ほう神計画' };
const SUM_RANGE = [[6.05, 7.35], [6.65, 8.0], [7.75, 9.05], [9.3, 10.2]];
const BOY = { body: 0 };
const SCARY = /殺|死ね|ころす|ころし|血/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, group: /同じ種類の敵/, allies: /仲間全員/, ally: /仲間1人/, self: /自分|作戦|大技/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

// 軍師 1人 ＋ 仲間（mates … 職業）。enemies … 魔物の 種類
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, mates = [], boss = false, hp = 50000 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'fishing_doshi' });
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

// ───────────── 職業の 木 ─────────────
test('第83回 A の 職業: 4だん（基本職から 伝説まで）・ならび・うわさ・文字・はじめの 装備', () => {
  assert.deepEqual(R83A_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R83A), NEW);
  const orders = [JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R83A_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc && j.body === undefined, '男の子も 女の子も なれる・おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.deepEqual(j.weapons, ['staff', 'whip', 'fan', 'none'], 'つえ・むち・おうぎ・素手');
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    if (tier >= 2) {
      assert.ok(JOB_HINTS[id], id);
      textOk(JOB_HINTS[id], id);
    }
  }
  assert.equal(jobReqText('sennin_doshi'), 'つりをする道士Lv10');
  assert.equal(jobReqText('hoshin_gunshi'), '太公望Lv10＋ほかの超級職1つLv10');
  assert.ok(JOB_ORDER.includes('fishing_doshi'));
  assert.equal(newCharacter({ id: 'a', name: 'a', job: 'fishing_doshi' }).job, 'fishing_doshi');
  assert.equal(STARTER_EQUIP.fishing_doshi.weapon, null, 'はじめは 素手（つりざおを 手に もつ 見た目）');
  const title = readFileSync(new URL('../public/js/client/ui/title.js', import.meta.url), 'utf8');
  assert.match(title, /fishing_doshi: 'のんびりつりが大すき'/);
  const files = gameFiles();
  for (const f of ['jobs-r83a.js', 'abilities-r83a.js', 'hirameki-r83a.js', 'shared/battle-r83a.js', 'client/battle-r83a.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第83回 A の 職業: なれる じゅんばん（1本道・伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'fishing_doshi' });
  assert.equal(jobUnlocked(c, 'sennin_doshi'), false);
  master(c, 'fishing_doshi');
  assert.equal(jobUnlocked(c, 'sennin_doshi'), true);
  assert.equal(jobUnlocked(c, 'taikobo'), false);
  master(c, 'sennin_doshi');
  assert.equal(jobUnlocked(c, 'taikobo'), true);
  assert.equal(jobKnown(c, 'hoshin_gunshi'), false, '伝説は はじめ ひみつ');
  master(c, 'taikobo');
  assert.equal(jobKnown(c, 'hoshin_gunshi'), true, '太公望を きわめると うわさ');
  assert.equal(jobUnlocked(c, 'hoshin_gunshi'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'shacho');
  assert.equal(jobUnlocked(c, 'hoshin_gunshi'), true);
  assert.equal(changeJob(c, 'hoshin_gunshi').ok, true);
  assert.ok(learnedAbilities(c).includes('hg_ten'));
});

test('第83回 A の 職業: 能力の 合計は 段の はんい・下の 段より 強い・MP と 魔力と 素早さ 高め・HP 低め', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  NEW.forEach((j, i) => {
    const m = JOBS[j].mods;
    assert.deepEqual(Object.keys(m).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    const [lo, hi] = SUM_RANGE[i];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    if (i) assert.ok(sum(j) > sum(NEW[i - 1]) + 0.4, `${j} は 下の 段より 強い`);
    assert.ok(m.mp > m.hp && m.mag > m.str && m.agi > m.def, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3 + 1e-9);
  });
  // 設計の めやす（9-1 の 表）
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [6.6, 7.2, 8.5, 9.6]);
});

// ───────────── 技 ─────────────
test('第83回 A の 技: 6こ（伝説は Lv1・3・5・7・8・10）・Lv10 が いちばん MP の 看板の 技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, j === 'hoshin_gunshi' ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 5, 7, 10]);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.ok(mps.slice(0, -1).every((m) => m < mps.at(-1)), `${j}: Lv10 の 技が いちばん MPを 使う`);
    const sig = `${j}_sig`;
    assert.equal(job.learn.at(-1)[1], sig);
    assert.equal(ABILITIES[sig].name, SIG_NAMES[j]);
    assert.ok(R83A_SIGS.includes(ABILITIES[sig].anim));
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      mine.add(id);
      assert.equal(a.job, j);
      assert.ok(['skill', 'spell'].includes(a.kind), id);
      assert.ok(!a.weapon && !a.masc, id);
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) {
        if (p.type === 'buff') assert.ok(p.mult <= (JOBS[j].tier ? 1.3 : 1.25) + 1e-9, a.name);
        if (['status', 'debuff'].includes(p.type) || p.status || p.debuff) assert.ok(((p.status || p.debuff || p).chance) < 1, a.name);
      }
    }
    // 太公望は 補助の 軍師（攻撃技は 風のやいば・二れん だけ。設計の 9-1 の とおり）
    assert.ok(job.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'dmg').length >= (j === 'taikobo' ? 1 : 2), `${j}: 攻撃技`);
  }
  // abilities-r83a.js の 技は どれかの 職業で 覚える（大物がつれた！の 中み 3つは 一覧に 出ない）
  const hidden = Object.keys(R83A_ABILITIES).filter((id) => R83A_ABILITIES[id].hidden);
  assert.deepEqual(hidden.sort(), ['fd_catch_boot', 'fd_catch_box', 'fd_catch_fish']);
  assert.deepEqual([...mine, ...hidden].sort(), Object.keys(R83A_ABILITIES).sort());
  // 設計の 技の 名前（9-1 の 表。かえた 名前は docs/plan-r83-jobs-a.md）
  assert.deepEqual(JOBS.fishing_doshi.learn.map(([, id]) => ABILITIES[id].name), ['つりざおアタック', 'のんびりつり', '風のおふだ', 'なまけるふり', 'はったり', '大物がつれた！']);
  assert.deepEqual(JOBS.sennin_doshi.learn.map(([, id]) => ABILITIES[id].name), ['打神べん', '作戦を立てる', '火竜ひょう', 'せん人のもも', '強化ふうじ', '打神べん・大風']);
  assert.deepEqual(JOBS.taikobo.learn.map(([, id]) => ABILITIES[id].name), ['風のやいば・二れん', 'スープーに乗る', '守りの旗', 'はかりごと', 'もものえん', '太極図']);
  assert.deepEqual(JOBS.hoshin_gunshi.learn.map(([, id]) => ABILITIES[id].name), ['打神べん・天', '軍師の号令', '先読みの策', 'せん人の大えん', 'ほう神', 'ほう神計画']);
  assert.deepEqual(ABILITIES.fishing_doshi_sig.effect.options.slice().sort(), ['fd_catch_boot', 'fd_catch_box', 'fd_catch_fish', 'fd_catch_fish']);
});

test('第83回 A の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'], mates: ['warrior'] });
      const act = use(b, me, { type: 'ability', id, sakusen: 'seme' });
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(ABILITIES[id]) === 'dmg' && id !== 'fishing_doshi_sig') assert.ok(dmgOf(act) > 0 || act.results?.some((r) => r.miss), `${id} の ダメージ: ${act.lines}`);
    }
    const s = setup(j, { seed: 7, mates: ['warrior'] });
    s.me.abilities = learnedAbilities(s.c);
    let used = 0;
    for (let i = 0; i < 12; i++) {
      const cmd = decideAlly(s.b, s.me);
      assert.ok(cmd?.type, `${j}: ${JSON.stringify(cmd)}`);
      if (cmd.type === 'ability') used++;
    }
    assert.ok(used > 0, `${j}: オートでも 技を 使う`);
  }
  // 大物がつれた！: 魚（敵全体に ダメージ）・長ぐつ（何も 起きない）・宝箱（お金）の どれか
  const got = new Set();
  for (let seed = 1; seed < 40 && got.size < 3; seed++) {
    const { b, me } = setup('fishing_doshi', { seed, enemies: ['rockman', 'rockman'] });
    b.hooks.gainGold = () => 123;
    const act = use(b, me, { type: 'ability', id: 'fishing_doshi_sig' });
    if (act.lines.some((l) => l.includes('長ぐつ'))) got.add('boot');
    if (act.lines.some((l) => l.includes('123ゴールド'))) got.add('box');
    if (dmgOf(act) > 0) got.add('fish');
  }
  assert.deepEqual([...got].sort(), ['boot', 'box', 'fish']);
});

// ───────────── 作戦 ─────────────
test('第83回 A の 作戦: えらんだ 作戦が 仲間全員に ずっと 効く・段で 効き目・札・キャラに 項目を 足さない', () => {
  assert.deepEqual(SAKUSEN_ORDER, ['seme', 'mamori', 'sokkou']);
  assert.deepEqual(SAKUSEN_PCT.slice(1), [0.15, 0.2, 0.25]);
  for (const k of SAKUSEN_ORDER) { textOk(SAKUSEN[k].name, k); textOk(SAKUSEN[k].desc, k); }
  // 段で えらべる 作戦と 効き目
  const cases = { sennin_doshi: [['seme', 'mamori'], 0.15], taikobo: [SAKUSEN_ORDER, 0.2], hoshin_gunshi: [SAKUSEN_ORDER, 0.25] };
  for (const [job, [set, pct]] of Object.entries(cases)) {
    const { me } = setup(job);
    assert.deepEqual(sakusenSet(me), set, job);
    assert.equal(sakusenPct(me), pct, job);
  }
  assert.deepEqual(sakusenSet(setup('fishing_doshi').me), [], 'つりをする道士は まだ 作戦を 立てられない');
  // ほかの 職業に 転職した あと: 覚えて いれば 攻め・守りを 15%
  const o = setup('god_hand', { extra: [] });
  o.me.abilities = [...o.me.abilities, 'sd_sakusen'];
  assert.deepEqual(sakusenSet(o.me), ['seme', 'mamori']);
  assert.equal(sakusenPct(o.me), OTHER_PCT);

  // えらぶと 仲間全員に 効く（時間で 切れない）
  const { b, c, me } = setup('hoshin_gunshi', { mates: ['warrior', 'mage'] });
  const act = use(b, me, { type: 'ability', id: 'sd_sakusen', sakusen: 'seme' });
  assert.ok(act.lines.some((l) => l.includes('攻めの作戦だ！')), act.lines.join());
  const p = activePlan(b);
  assert.deepEqual([p.kind, p.pct, p.by], ['seme', 0.25, me.id]);
  for (const a of b.allies) assert.deepEqual(pub(a).r83aPlan, { kind: 'seme', pct: 25 }, a.name);
  assert.deepEqual(r83aMarks(pub(b.allies[1])).map((m) => m.text), ['攻め25%']);
  assert.equal(pub(b.enemies[0]).r83aPlan, undefined, '敵には 効かない');
  for (let i = 0; i < 400; i++) b.tick(50);
  assert.ok(activePlan(b), '時間で 切れない');
  // 攻め: 与える ダメージ ＋25%（敵 → 仲間は かわらない）
  assert.equal(r83aDamage(b, b.allies[1], b.enemies[0], 100, {}, ev0()), 125);
  assert.equal(r83aDamage(b, b.enemies[0], b.allies[1], 100, {}, ev0()), 100);
  // 作戦を かえる（守り）: 受ける ダメージ −25%・攻めは 消える（1つだけ）
  const act2 = use(b, me, { type: 'ability', id: 'sd_sakusen', sakusen: 'mamori' });
  assert.ok(act2.lines.some((l) => l.includes('作戦をかえた！守りの作戦だ！')), act2.lines.join());
  assert.equal(r83aDamage(b, b.enemies[0], b.allies[1], 100, {}, ev0()), 75);
  assert.equal(r83aDamage(b, b.allies[1], b.enemies[0], 100, {}, ev0()), 100);
  // キャラ（セーブ・引っこしコード）には 項目を 足さない
  assert.ok(!Object.keys(c).some((k) => /r83a|sakusen/i.test(k)), Object.keys(c).join());
  assert.ok(!JSON.stringify(c).includes('r83a'));
});

test('第83回 A の 作戦: 速攻は 番が 早い・軍師が 2人でも 1つだけ（新しい 方）・軍師が たおれると とぎれる', () => {
  const { b, me } = setup('taikobo', { mates: ['taikobo', 'warrior'] });
  const [, t2, w] = b.allies;
  const before = atbRate(w);
  use(b, me, { type: 'ability', id: 'sd_sakusen', sakusen: 'sokkou' });
  assert.ok(Math.abs(atbRate(w) / before - 1.2) < 1e-6, `速攻 20%: ${atbRate(w) / before}`);
  // 2人めの 軍師が 守りを 立てると、前の 作戦に かわる（足さない）
  t2.mp = 999;
  assert.ok(readyUp(b, t2));
  assert.equal(b.command(t2.id, { type: 'ability', id: 'sd_sakusen', sakusen: 'mamori' }, 's2').ok, true);
  runUntilAct(b, t2.id);
  const p = activePlan(b);
  assert.deepEqual([p.kind, p.by], ['mamori', t2.id]);
  assert.ok(Math.abs(atbRate(w) / before - 1) < 1e-6, '速攻は 消えた');
  assert.equal(r83aDamage(b, b.enemies[0], w, 100, {}, ev0()), 80, '守り 20%（2人ぶん 足さない）');
  // 立てた 人が たおれると とぎれる
  b.kill(t2);
  assert.equal(activePlan(b), null);
  assert.equal(r83aDamage(b, b.enemies[0], w, 100, {}, ev0()), 100);
  const all = [];
  for (let i = 0; i < 400; i++) for (const e of b.tick(50)) if (e.t === 'act') all.push(...e.lines);
  assert.ok(all.some((l) => l.includes('がたおれて、守りの作戦がとぎれた')), 'とぎれた ことを 知らせる');
  assert.ok(!b.allies.some((a) => pub(a).r83aPlan), '札も 消える');
});

test('第83回 A の ほう神計画・軍師の号令: 作戦の 効き目が 2倍（3回）・仲間が すぐ 動ける・自分には かけない', () => {
  const { b, me } = setup('hoshin_gunshi', { mates: ['warrior', 'mage'], boss: true });
  const [, w, m] = b.allies;
  use(b, me, { type: 'ability', id: 'sd_sakusen', sakusen: 'seme' });
  w.atb = 10;
  m.atb = 5;
  const act = use(b, me, { type: 'ability', id: 'hoshin_gunshi_sig' });
  assert.ok(act.lines.some((l) => l.includes('2倍')), act.lines.join());
  assert.equal(activePlan(b).boost, 3);
  assert.equal(r83aDamage(b, w, b.enemies[0], 100, {}, ev0()), 150, '25% × 2');
  assert.deepEqual(pub(w).r83aPlan, { kind: 'seme', pct: 50 });
  assert.ok(w.atb >= 99 || w.ready || w.queued, 'すぐ 動ける');
  // 3回 行動すると 元に もどる
  for (let k = 0; k < 3; k++) {
    readyUp(b, me);
    b.command(me.id, { type: 'defend' }, 's1');
    for (let i = 0; i < 20; i++) b.tick(50);
  }
  for (let i = 0; i < 400 && activePlan(b).boost > 0; i++) b.tick(50);
  assert.equal(activePlan(b).boost, 0);
  assert.equal(r83aDamage(b, w, b.enemies[0], 100, {}, ev0()), 125);
  // 作戦が ない 時は 攻めから 始める
  const s = setup('hoshin_gunshi', { mates: ['warrior'] });
  use(s.b, s.me, { type: 'ability', id: 'hoshin_gunshi_sig' });
  assert.equal(activePlan(s.b).kind, 'seme');
  // 軍師の号令: 仲間 1人が すぐ 動ける・自分には かけられない
  const g = setup('hoshin_gunshi', { mates: ['warrior', 'mage'] });
  const [, gw, gm] = g.b.allies;
  readyUp(g.b, g.me);
  gw.atb = 0;
  gm.atb = 0;
  gw.ready = gw.queued = false;
  assert.equal(g.b.command(g.me.id, { type: 'ability', id: 'hg_gorei', target: gw.id }, 's1').ok, true);
  const ga = runUntilAct(g.b, g.me.id);
  assert.ok(ga.lines.some((l) => l.includes(`${gw.name}は、すぐに動けそうだ`)), ga.lines.join());
  assert.ok(gw.atb >= 99 || gw.ready || gw.queued);
  assert.ok(gm.atb < 50, '号令は 1人だけ');
  readyUp(g.b, g.me);
  g.b.command(g.me.id, { type: 'ability', id: 'hg_gorei', target: g.me.id }, 's1');
  assert.ok(runUntilAct(g.b, g.me.id).lines.some((l) => l.includes('自分に号令をかけることはできない')));
});

// ───────────── 強化ふうじ・太極図 ─────────────
test('第83回 A の 強化ふうじ・太極図: ふつうの 強化を 消して しばらく 強化できない・ボスの しかけ（ずっと つづく 強化）は 消さない', () => {
  const { b, me } = setup('taikobo', { enemies: ['rockman', 'rockman'], mates: ['warrior'] });
  const [e1, e2] = b.enemies;
  e1.buffs.atk = { mult: 1.3, base: 1.3, lv: 1, left: 3 };
  e1.buffs.def = { mult: 1.5, base: 1.5, lv: 1, left: Infinity }; // 台本の しかけ（おこった・形態 など）
  e1.buffs.eva = { add: 0.1, left: Infinity }; // 空を とぶ かいひ
  e1.charge = 2;
  e1.telegraph = 'm_nothing';
  e1.stance = { kind: 'counter', mult: 1.3 };
  assert.equal(normalBuffs(e1), 2);
  const act = use(b, me, { type: 'ability', id: 'sd_fuuji', target: e1.id });
  assert.ok(act.lines.some((l) => l.includes('強くなっていた力が消えた')), act.lines.join());
  assert.equal(e1.buffs.atk, undefined);
  assert.equal(e1.charge, 1);
  assert.ok(e1.buffs.def && e1.buffs.eva, 'ずっと つづく 強化は のこす');
  assert.ok(e1.telegraph && e1.stance, '前ぶれ・かまえは のこす');
  assert.equal(e1.r83aSeal.left, 3);
  assert.deepEqual(r83aMarks(pub(e1)).map((m) => m.text), ['ふうじ3']);
  // ふうじの 間は 強化できない（バフ・力ため）
  const ev = { lines: [], upd: [] };
  b.applyBuff(e1, e1, { type: 'buff', stat: 'atk', mult: 1.3 }, ev);
  assert.equal(e1.buffs.atk, undefined);
  assert.ok(ev.lines.some((l) => l.includes('強化をふうじられている')));
  b.applyAbility(e1, { name: 'ため', effect: { type: 'charge', mult: 2 }, target: 'self' }, {}, ev, 1, [e1]);
  assert.equal(e1.charge, 1);
  // 3回 行動すると とける
  for (let k = 0; k < 3; k++) { const e = ev0(); b.applyAbility(e1, ABILITIES.attack || { effect: { type: 'nothing' }, target: 'self' }, {}, e, 1, [e1]); }
  e1.r83aSeal.left = 1;
  e1.actions = [{ w: 1, id: 'm_nothing' }];
  e1.telegraph = null;
  for (let i = 0; i < 400 && e1.r83aSeal; i++) b.tick(50);
  assert.equal(e1.r83aSeal, undefined);
  b.applyBuff(e1, e1, { type: 'buff', stat: 'atk', mult: 1.3 }, ev0());
  assert.ok(e1.buffs.atk, 'とけたら 強化できる');
  // 太極図: 敵全体に ふうじ ＋ 仲間全員の 弱体と 状態異常を 治す（水のろうなど ボスの しかけの 状態は のこす）
  const w = b.allies[1];
  e2.buffs.agi = { mult: 1.3, base: 1.3, lv: 1, left: 3 };
  w.debuffs.atk = { mult: 0.75, lv: 1, left: 3 };
  w.status.poison = { turns: 3 };
  w.status.confuse = { turns: 3 };
  me.status.silence = { turns: 3 };
  w.status.prison = { turns: 2 };
  const t = use(b, me, { type: 'ability', id: 'taikobo_sig' });
  assert.ok(t, 'マホトーンでも 太極図は 特技');
  assert.ok(e1.r83aSeal && e2.r83aSeal && !e2.buffs.agi);
  assert.deepEqual(w.debuffs, {});
  assert.ok(!w.status.poison && !w.status.confuse && !me.status.silence);
  assert.ok(w.status.prison, 'ボスの しかけの 状態は のこす');
});

test('第83回 A の 強化ふうじ: 第6〜8章の ボスの しかけ（形態・ずっと つづく 強化）は そのまま', async () => {
  // 第5章 Step 6・7 の おこった 攻撃力（battle-earth.js。left: Infinity）・第6章 Step 3・4 の 時の 強化（battle-road.js。left: Infinity）と おなじ 形
  const { b, me } = setup('sennin_doshi', { enemies: ['rockman'] });
  const e = b.enemies[0];
  e.buffs.atk = { mult: 1.4, base: 1.4, lv: 1, left: Infinity };
  e.c7mal = { form: 2 };
  use(b, me, { type: 'ability', id: 'sd_fuuji', target: e.id });
  assert.equal(e.buffs.atk.mult, 1.4);
  assert.deepEqual(e.c7mal, { form: 2 });
  // オートは ずっと つづく 強化しか ない 敵には 強化ふうじを 使わない
  const mine = learnedAbilities(b.allies[0].penChar || {}).map((id) => ({ id, a: ABILITIES[id] }));
  delete e.r83aSeal;
  const cmd = r83aPlan(b, me, [e], mine.filter(({ a }) => a), b.aliveAllies(), { hard: false, rounds: 1 });
  assert.ok(!cmd || cmd.id !== 'sd_fuuji', JSON.stringify(cmd));
});

// ───────────── 先読みの策・守りの旗 ─────────────
test('第83回 A の 先読みの策: 前ぶれの ある 大技だけ 仲間全員 半分・身を 守ると 合わせても 下げすぎない・次の 番で 消える', () => {
  const { b, me } = setup('hoshin_gunshi', { mates: ['warrior'] });
  const w = b.allies[1];
  const act = use(b, me, { type: 'ability', id: 'hg_sakiyomi' });
  assert.ok(act.lines.some((l) => l.includes('大技を読んでいる')));
  assert.ok(me.r83aSaki);
  assert.deepEqual(r83aMarks(pub(me)).map((m) => m.text), ['先読み']);
  const e = b.enemies[0];
  assert.equal(r83aDamage(b, e, w, 100, {}, { lines: [], upd: [], big: true }), 50, '前ぶれの 大技は 半分');
  assert.equal(r83aDamage(b, e, w, 100, {}, ev0()), 100, 'ふつうの 攻撃は そのまま');
  w.defending = true;
  assert.equal(r83aDamage(b, e, w, 100, {}, { lines: [], upd: [], big: true }), Math.round(100 * CUT_FLOOR.defending), '身を 守って いる 人は 下げすぎない');
  w.defending = false;
  // 守りの 作戦と 合わせても 0.45倍まで
  b.r83aPlan = { side: 'ally', by: me.id, kind: 'mamori', pct: 0.25, boost: 3, boostBy: me.id };
  assert.equal(r83aDamage(b, e, w, 100, {}, { lines: [], upd: [], big: true }), Math.round(100 * CUT_FLOOR.normal));
  delete b.r83aPlan;
  // 次の 自分の 番で 消える
  readyUp(b, me);
  b.command(me.id, { type: 'attack', target: e.id }, 's1');
  runUntilAct(b, me.id);
  assert.ok(!me.r83aSaki);
  assert.equal(r83aDamage(b, e, w, 100, {}, { lines: [], upd: [], big: true }), 100);
  // 守りの旗: 仲間全員、次の 1回だけ 半分
  const h = setup('taikobo', { mates: ['warrior'] });
  use(h.b, h.me, { type: 'ability', id: 'tk_hata' });
  const hw = h.b.allies[1];
  assert.ok(hw.r83aHata && h.me.r83aHata);
  assert.equal(r83aDamage(h.b, h.b.enemies[0], hw, 100, {}, ev0()), 50);
  assert.equal(r83aDamage(h.b, h.b.enemies[0], hw, 100, {}, ev0()), 100, '1回だけ');
});

test('第83回 A の ほう神: 敵の HP が 少ないほど 大きい・たおすと 仲間全員の MP が 回復', () => {
  const dmgAt = (ratio) => {
    const { b, me } = setup('hoshin_gunshi', { seed: 5 });
    b.enemies[0].hp = Math.round(b.enemies[0].maxHp * ratio);
    return dmgOf(use(b, me, { type: 'ability', id: 'hg_hoshin' }));
  };
  assert.ok(dmgAt(0.1) > dmgAt(1) * 1.6, `${dmgAt(0.1)} / ${dmgAt(1)}`);
  const { b, me } = setup('hoshin_gunshi', { mates: ['warrior'], hp: 50 });
  b.allies[1].mp = 10;
  const act = use(b, me, { type: 'ability', id: 'hg_hoshin' });
  assert.ok(!b.enemies[0].alive);
  assert.ok(act.lines.some((l) => l.includes('仲間全員のMPが回復した')), act.lines.join());
  assert.ok(b.allies[1].mp > 10);
});

// ───────────── オート ─────────────
test('第83回 A の オート: 作戦（ボスは 守り・ふつうは 攻め）・前ぶれに 先読みの策・敵の 強化に 太極図や 強化ふうじ', () => {
  const plan = (s) => r83aPlan(s.b, s.me, s.b.aliveEnemies(), learnedAbilities(s.c).map((id) => ({ id, a: ABILITIES[id] })), s.b.aliveAllies(), fightWeight(s.b));
  const boss = setup('hoshin_gunshi', { boss: true, mates: ['warrior'] });
  assert.deepEqual(plan(boss), { type: 'ability', id: 'sd_sakusen', sakusen: 'mamori' });
  const normal = setup('taikobo', { mates: ['warrior'] });
  assert.deepEqual(plan(normal), { type: 'ability', id: 'sd_sakusen', sakusen: 'seme' });
  // 前ぶれ → 先読みの策
  boss.b.enemies[0].telegraph = 'm_nothing';
  assert.equal(plan(boss).id, 'hg_sakiyomi');
  boss.me.r83aSaki = true;
  assert.notEqual(plan(boss)?.id, 'hg_sakiyomi', 'もう 読んで いる');
  // 作戦が ある・敵が 強化 → 強化ふうじ（1体）・太極図（2体）
  const s = setup('taikobo', { enemies: ['rockman', 'rockman'], mates: ['warrior'] });
  s.b.r83aPlan = { side: 'ally', by: s.me.id, kind: 'seme', pct: 0.2, boost: 0 };
  s.b.enemies[0].buffs.atk = { mult: 1.3, lv: 1, left: 3 };
  assert.deepEqual(plan(s), { type: 'ability', id: 'sd_fuuji', target: s.b.enemies[0].id });
  s.b.enemies[1].buffs.def = { mult: 1.3, lv: 1, left: 3 };
  assert.equal(plan(s).id, 'taikobo_sig');
  // ほかの 職業の オートは かわらない（技を 持たない 人は 何も しない）
  const o = setup('god_hand', { mates: ['warrior'] });
  assert.equal(plan(o), null);
});

// ───────────── ひらめき技 ─────────────
test('第83回 A の ひらめき技: 4つの 職業に 1つずつ・データ・文字・その 道の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R83A_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R83A).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R83A_ABILITIES[id].job === j).length), [1, 1, 1, 1]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R83A_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R83A_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'fishing_doshi' });
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
test('第83回 A の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・空飛ぶカバ', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 3 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('wind') && JOBS[j].tags.includes('magic'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
  }
  // 合体技の 相手の 案: 占い師（魔法）・社長（空）・忍者（風）
  assert.ok(JOBS.fortune.tags.includes('magic') && JOBS.shacho.tags.includes('sky') && JOBS.ninja.tags.includes('wind'));
  assert.ok(JOBS.taikobo.tags.includes('sky'));
  for (const j of ['taikobo', 'hoshin_gunshi']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 3, `${j}: まぼろしの 技`);
    assert.ok(!phantomSkills(j).some((id) => ['sd_sakusen', 'hg_gorei', 'hg_sakiyomi', 'tk_hata', 'hoshin_gunshi_sig'].includes(id)), 'まぼろしは 仲間の しくみを 使わない');
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 32);
    textOk(masterName(j), j);
  }
  const v = VEHICLES.sky_hippo;
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'sky_hippo');
  textOk(v.desc, 'sky_hippo');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('sky_hippo'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('sky_hippo', view, f, 'back')) + lit(paintVehicle('sky_hippo', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('sky_hippo', view, f));
      frames.add([...(paintVehicle('sky_hippo', view, f, 'front')?.px || [])].join());
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

test('第83回 A の 絵: 4つの 職業（男女・4方向・はみ出さない・段ごとに ちがう・ほかの 道士と ちがう）・ぼうし・つりざお と 打神べん・古い え', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R83A_OUTFIT[j] && R83A_BODY[j] && R83A_HAT[j] && R83A_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'sage', 'fortune', 'summoner']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, 'robe', '道士の ゆったりした 服');
    assert.equal(headOf(null, job, 'cloth', O).kind, R83A_HAT[job].kind);
    assert.ok(['rod83', 'whip83'].includes(jobBody(job).prop));
    assert.ok(!jobBody(job).hcol, 'かみの 色は その 人の まま');
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.equal(headOf(null, 'fishing_doshi', 'cloth', outfitOf({ cloth: '#3f7fd0', skin: 0 }, 'fishing_doshi', 'cloth', false)).kind, 'straw');
  assert.equal(jobBody('fishing_doshi').prop, 'rod83');
  assert.equal(jobBody('taikobo').prop, 'whip83');
  assert.equal(jobBody('hoshin_gunshi').aura, 'cloud');
  // 手に もつ もの（たてを もつと 見えない）: つりざおの ある 絵と ない 絵は ちがう
  const withProp = key(paintHero({ body: 0, style: 'short' }, 'fishing_doshi', undefined, 'down', 0, 4));
  const saved = R83A_BODY.fishing_doshi.prop;
  R83A_BODY.fishing_doshi.prop = null;
  const noProp = key(paintHero({ body: 0, style: 'short' }, 'fishing_doshi', undefined, 'down', 0, 4));
  R83A_BODY.fishing_doshi.prop = saved;
  assert.notEqual(withProp, noProp, 'つりざおが かかれる');
});

// ───────────── えんしゅつ・作戦の 札 ─────────────
test('第83回 A の えんしゅつ: 看板の 技・大事な 技・音・つなぎ・こわれない・作戦の 札', () => {
  const used = new Set([...Object.keys(R83A_ABILITIES), ...Object.keys(HIRA_R83A_ABILITIES)].map((id) => ABILITIES[id].anim));
  for (const anim of R83A_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R83A_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R83A_SFX).sort(), [...R83A_ANIMS].sort());
  assert.deepEqual(Object.keys(R83A_HIT).sort(), [...R83A_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R83A_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const a of PARTY_ANIMS_R83A) assert.ok(PARTY_ANIMS.has(a), a);
  for (const id of Object.keys(R83A_ABILITIES)) {
    const a = ABILITIES[id];
    if (['self', 'allies', 'ally'].includes(a.target) && R83A_ANIMS.has(a.anim)) assert.ok(PARTY_ANIMS_R83A.has(a.anim), id);
    if (['enemy', 'enemies', 'group'].includes(a.target) && R83A_ANIMS.has(a.anim)) assert.ok(!PARTY_ANIMS_R83A.has(a.anim), `${id}: 敵に あたる えんしゅつ`);
  }
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R83A_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R83A_HIT\)/);
  assert.match(battle, /ab\.effect\.type === 'r83aSakusen'\) return sakusenMenu/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR83aFx\(this, anim/);
  for (const anim of R83A_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      const fx = new Effects();
      assert.equal(playR83aFx(fx, anim, targets, 'wind', { crit: true }, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      let t = 0;
      while (fx.parts.length && t < 4000) { fx.update(16); t += 16; }
      assert.ok(t <= 2200, `${anim}: ${t}ms`);
    }
  }
  assert.equal(playR83aFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR83aFx(new Effects(), 'taikobo_sig', []), false);
  // 仲間の まどの 札（家族 みんなに 見える）
  assert.deepEqual(r83aMarks({ alive: true, r83aPlan: { kind: 'mamori', pct: 20 }, r83aSaki: true, r83aHata: true }).map((m) => m.text), ['守り20%', '先読み', '旗']);
  assert.deepEqual(r83aMarks({ alive: true, r83aPlan: { kind: 'sokkou', pct: 50 } }).map((m) => m.text), ['速攻50%']);
  assert.deepEqual(r83aMarks({ alive: true }), []);
  assert.deepEqual(r83aMarks({ alive: false, r83aSeal: 2 }), []);
  for (const k of SAKUSEN_ORDER) textOk(r83aMarks({ alive: true, r83aPlan: { kind: k, pct: 25 } })[0].text, k);
});
