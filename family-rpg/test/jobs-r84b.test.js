// 第84回 B班（2026年11月）: らんま1/2 の 系統（手数と カウンター。docs/plan-jobs-r79.md の 10-2・docs/plan-r84-jobs-b.md）
//   無差別格闘流の門下生（上級職。武闘家 ＋ 遊び人）→ 早おとめ乱馬（超級職）→ 飛竜しょう天はの達人（伝説。＋ほかの 超級職 1つ）
//  ・なり方・強さ・技・ひらめき技・合体技の タグ・試練・転職の ひとこと・乗り物・文字
//  ・この 系統だけの しくみ（shared/battle-r84b.js）: 水と お湯の すがた（メニュー・すばやい・段で 量・ほかの 職業）・勝手に かわる（天気・属性）・
//    乱れ打ち・手数の 技・心の水・飛竜しょう天は（敵の 強化の 数・水の すがた・来なかった 時）・飛竜こうりんだん・かけひき・どげざ・敵前だい逃亡・
//    前ぶれの 大技は よけられない・オート・キャラに 項目を 足さない
//  ・絵（hero-r84b.js）・乗り物の 絵（vehicle-r84b.js）・えんしゅつ（battlefx-r84b.js）・すがたの 札（client/battle-r84b.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JOBS, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, jobReqText } from '../public/js/shared/data/jobs.js';
import { JOBS_R84B, R84B_ORDERS, R84B_JOBS } from '../public/js/shared/data/jobs-r84b.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R84B_ABILITIES, R84B_FORM_ATB } from '../public/js/shared/data/abilities-r84b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R84B_ABILITIES, HIRAMEKI_R84B } from '../public/js/shared/data/hirameki-r84b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { FORMS, FORM_ORDER, FORM_PCT, OTHER_PCT, EVA_CAP, BOOST_CAP, formPct, formOf, boostCount, hiryuMult, r84bEva, r84bSpeed } from '../public/js/shared/battle-r84b.js';
import { setWeather } from '../public/js/shared/battle-weather.js';
import { jobLabel } from '../public/js/shared/job-label.js';
import { newCharacter, changeJob, jobUnlocked, jobKnown, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed } from '../public/js/shared/stats.js';
import { Battle, pub, speedMult } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { R84B_JOBS as LOOK_JOBS, R84B_OUTFIT, R84B_BODY, R84B_OLD_LOOK, AURA84B } from '../public/js/client/render/hero-r84b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { VIEWS, paintVehicle, vehicleFrames, riderSpot } from '../public/js/client/render/vehicle-art.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { R84B_ANIMS, R84B_SIGS, R84B_HIT, R84B_SFX, PARTY_ANIMS_R84B, playR84bFx } from '../public/js/client/render/battlefx-r84b.js';
import { r84bMarks } from '../public/js/client/battle-r84b.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['musabetsu_student', 'ranma', 'hiryu_master'];
// [名前, 段, なり方]
const TREE = {
  musabetsu_student: ['無差別格闘流の門下生', 1, ['monk', 'jester']],
  ranma: ['早おとめ乱馬', 2, ['musabetsu_student']],
  hiryu_master: ['飛竜しょう天はの達人', 3, ['ranma']],
};
const SIG_NAMES = { musabetsu_student: '無差別格闘流・乱れ打ち', ranma: '飛竜しょう天は', hiryu_master: '飛竜こうりんだん' };
const SUM_RANGE = { 1: [6.65, 8.0], 2: [7.75, 9.05], 3: [9.3, 10.2] };
const BOY = { body: 0 };
const SCARY = /殺|死ね|ころす|ころし|血/;
// 男女が 入れかわる 話には しない（画面では「水のすがた」「お湯のすがた」だけ）
const SWAP = /女の子になる|男の子になる|女になる|男になる|女に変身|男に変身|せいべつ/;
const KANJI = /[一-鿿]/;
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, group: /同じ種類の敵/, allies: /仲間全員/, self: /自分|かまえ|すがた/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};

// enemies … 魔物の 種類。act … 敵の 行動（なし ＝ 何もしない）
function setup(job, { seed = 1, enemies = ['rockman'], lv = 45, act = 'm_nothing', extra = [] } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'monk' });
  gainExp(c, expForLevel(lv));
  masterChain(c, job);
  master(c, job, ...extra);
  c.job = job;
  c.equip.weapon = null;
  fullHeal(c);
  const b = new Battle({ rng: makeRng(seed), allies: [{ char: c, controller: 's1' }], enemies, canFlee: true });
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
const dmgOf = (act) => (act.results || []).filter((r) => r.dmg > 0).reduce((s, r) => s + r.dmg, 0);
const hitsOn = (act, id) => (act.results || []).filter((r) => r.id === id && (r.dmg > 0 || r.miss)).length;
// 敵に 1回 行動させる（その 行動の ev）
const foeAct = (b, foe) => {
  const evs = [];
  for (let i = 0; i < 600 && !evs.some((e) => e.t === 'act' && e.id === foe.id); i++) evs.push(...b.tick(50));
  return evs.find((e) => e.t === 'act' && e.id === foe.id);
};

// ───────────── 職業の 木 ─────────────
test('第84回 B の 職業: 上級職・超級職・伝説の 3だん（武闘家 ＋ 遊び人から）・ならび・うわさ・文字', () => {
  assert.deepEqual(R84B_JOBS, NEW);
  assert.deepEqual(Object.keys(JOBS_R84B), NEW);
  const orders = [null, ADVANCED_ORDER, SUPER_ORDER, LEGEND_ORDER];
  for (const id of NEW) {
    const j = JOBS[id], [name, tier, req] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, tier);
    assert.deepEqual(j.req, req);
    assert.equal(j.reqSuper || 0, tier === 3 ? 1 : 0);
    assert.ok(orders[tier].includes(id) && ALL_JOBS.filter((x) => x === id).length === 1, id);
    assert.deepEqual(R84B_ORDERS[tier], [id]);
    for (const s of [j.name, j.desc, j.short]) textOk(s, id);
    assert.ok(!KANJI.test(j.kana), `${id} kana`);
    assert.ok(!SCARY.test(j.name + j.desc) && !SWAP.test(j.desc), id);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc && j.body === undefined, '男の子も 女の子も なれる・おなじ 名前');
    assert.equal(jobLabel(id, { job: id, look: BOY }), name);
    assert.deepEqual(j.weapons, ['claw', 'none']);
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id)), `${id} の 乗り物`);
    if (tier >= 2) textOk(JOB_HINTS[id], id);
  }
  assert.deepEqual(R84B_ORDERS[0], [], '基本職は ない（今の 職業から 枝分かれ）');
  assert.equal(jobReqText('musabetsu_student'), '武闘家Lv10＋遊び人Lv10');
  assert.equal(jobReqText('hiryu_master'), '早おとめ乱馬Lv10＋ほかの超級職1つLv10');
  const files = gameFiles();
  for (const f of ['jobs-r84b.js', 'abilities-r84b.js', 'hirameki-r84b.js', 'shared/battle-r84b.js', 'client/battle-r84b.js']) assert.ok(files.some((p) => p.endsWith(f)), f);
});

test('第84回 B の 職業: なれる じゅんばん（武闘家と 遊び人 → 門下生 → 乱馬 → 伝説は ほかの 超級職も 1つ）', () => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'monk' });
  master(c, 'monk');
  assert.equal(jobUnlocked(c, 'musabetsu_student'), false, '遊び人も いる');
  master(c, 'jester');
  assert.equal(jobUnlocked(c, 'musabetsu_student'), true);
  assert.equal(jobUnlocked(c, 'ranma'), false);
  master(c, 'musabetsu_student');
  assert.equal(jobUnlocked(c, 'ranma'), true);
  assert.equal(jobKnown(c, 'hiryu_master'), false, '伝説は はじめ ひみつ');
  master(c, 'ranma');
  assert.equal(jobKnown(c, 'hiryu_master'), true);
  assert.equal(jobUnlocked(c, 'hiryu_master'), false, 'ほかの 超級職も 1つ いる');
  master(c, 'archmage');
  assert.equal(jobUnlocked(c, 'hiryu_master'), true);
  assert.equal(changeJob(c, 'hiryu_master').ok, true);
  assert.ok(learnedAbilities(c).includes('hr_kidan'));
});

test('第84回 B の 職業: 能力の 合計（設計の 7.0・8.3・9.55）・段の はんい・素早さが いちばん 高い', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  NEW.forEach((j, i) => {
    const [lo, hi] = SUM_RANGE[JOBS[j].tier];
    assert.ok(sum(j) >= lo - 1e-9 && sum(j) <= hi + 1e-9, `${j}: ${sum(j).toFixed(2)}`);
    if (i) assert.ok(sum(j) > sum(NEW[i - 1]) + 0.4, `${j} は 下の 段より 強い`);
    const m = JOBS[j].mods;
    assert.ok(m.agi >= Math.max(...Object.values(m)) - 1e-9, `${j}: 手数の 職業（素早さ）`);
    assert.ok(m.str > m.mag, j);
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3 + 1e-9);
  });
  assert.deepEqual(NEW.map((j) => Math.round(sum(j) * 100) / 100), [7.0, 8.3, 9.55]);
});

// ───────────── 技 ─────────────
test('第84回 B の 技: 6こ（伝説は Lv1・3・5・7・8・10）・看板の 技・せつめい・文字・名前が かぶらない', () => {
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  const mine = new Set();
  for (const j of NEW) {
    const job = JOBS[j];
    assert.equal(job.learn.length, 6);
    const lvs = job.learn.map(([l]) => l);
    assert.deepEqual(lvs, JOBS[j].tier === 3 ? [1, 3, 5, 7, 8, 10] : [1, 2, 3, 5, 7, 10]);
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
      assert.ok(a.desc && a.cast && a.anim && a.kana, id);
      assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
      for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
      assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
      assert.ok(!SCARY.test(a.name + a.desc + a.cast) && !SWAP.test(a.desc + a.cast), id);
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      for (const p of partsOf(a.effect)) if (p.type === 'buff') assert.ok(p.mult <= 1.3 + 1e-9, a.name);
    }
  }
  assert.deepEqual([...mine].sort(), Object.keys(R84B_ABILITIES).sort());
  // 設計の 技の 名前（10-2 の 表。かえた 名前は docs/plan-r84-jobs-b.md）
  assert.deepEqual(JOBS.musabetsu_student.learn.map(([, id]) => ABILITIES[id].name), ['あまぐりけん', '水をかぶる／お湯をかぶる', 'どげざ', 'かわしてける', 'おさげキック', '無差別格闘流・乱れ打ち']);
  assert.deepEqual(JOBS.ranma.learn.map(([, id]) => ABILITIES[id].name), ['火中あまぐりけん', 'かけひき', '自信の気だん', 'こっそりいただき', 'パンダのおやじ', '飛竜しょう天は']);
  assert.deepEqual(JOBS.hiryu_master.learn.map(([, id]) => ABILITIES[id].name), ['自信の気だん・極', '敵前だい逃亡', '心の水', 'あまぐりけん・千手', 'かけひき・極', '飛竜こうりんだん']);
  // 手数: 5回・7回・12回（水の すがたで ふえる）
  assert.deepEqual(['ms_amaguri', 'rm_kachuu', 'hr_senju'].map((id) => [ABILITIES[id].effect.hits, ABILITIES[id].effect.r84b]), [[5, 'te'], [7, 'te'], [12, 'te']]);
  // かわしてける は 今 ある 反撃の 構え・どげざ は 今 ある 行動ゲージを 下げる しくみ・こっそりいただき は 今 ある ぬすむ
  assert.equal(ABILITIES.ms_kawashi.effect.type, 'stance');
  assert.equal(ABILITIES.ms_dogeza.effect.type, 'atbSet');
  assert.ok(ABILITIES.ms_dogeza.effect.chance < 1);
  assert.ok(ABILITIES.rm_itadaki.effect.steal > 0);
});

test('第84回 B の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me } = setup(j, { seed: ++n, enemies: ['rockman', 'rockman'] });
      const act = use(b, me, { type: 'ability', id, form: 'mizu' });
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない') || l.includes('効果がなかった')), `${id}: ${act?.lines}`);
      for (const l of act.lines) textOk(l, id);
      // 飛竜しょう天はは かまえ（攻撃が 来た ときに やり返す）
      if (abilityRole(ABILITIES[id]) === 'dmg' && id !== 'ranma_sig') assert.ok(dmgOf(act) > 0 || act.results?.some((r) => r.miss), `${id} の ダメージ: ${act.lines}`);
    }
    const s = setup(j, { seed: 7, enemies: ['rockman', 'rockman', 'rockman'] });
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

// ───────────── 水の すがた・お湯の すがた ─────────────
test('第84回 B の すがた: 段で 上がる 量・ほかの 職業に かわった あと・はじめは すがた なし・キャラに 項目を 足さない', () => {
  assert.deepEqual(FORM_ORDER, ['mizu', 'oyu']);
  for (const k of FORM_ORDER) {
    assert.equal(FORMS[k].name, k === 'mizu' ? '水のすがた' : 'お湯のすがた');
    for (const s of [FORMS[k].name, FORMS[k].pour, FORMS[k].desc]) textOk(s, k);
  }
  assert.deepEqual(NEW.map((j) => formPct({ job: j, abilities: [] })), [0.15, 0.2, 0.25]);
  assert.deepEqual(FORM_PCT.slice(1), [0.15, 0.2, 0.25]);
  // ほかの 職業: 水をかぶる を 覚えて いれば 上級職の 量
  assert.equal(formPct({ job: 'warrior', abilities: ['ms_mizu'] }), OTHER_PCT);
  assert.equal(OTHER_PCT, 0.15);
  assert.equal(formPct({ job: 'warrior', abilities: ['ms_amaguri'] }), 0);
  assert.equal(formPct({ job: 'ranma', side: 'enemy', abilities: [] }), 0, '敵は すがたを 持たない');
  const { b, c, me } = setup('ranma');
  assert.equal(formOf(me), null, 'はじめは すがた なし');
  assert.equal(pub(me).r84bForm, '');
  const act = use(b, me, { type: 'ability', id: 'ms_mizu', form: 'mizu' });
  assert.equal(formOf(me), 'mizu');
  assert.equal(pub(me).r84bForm, 'mizu');
  assert.ok(act.lines.some((l) => l.includes('水のすがたになった')));
  // すばやい（次の 番が すぐ 来る）
  assert.equal(me.atb, R84B_FORM_ATB);
  // キャラ（セーブ）には 項目を 足さない
  for (const k of ['r84bForm', 'r84bKokoro', 'r84bIkari', 'r84bDodge', 'r84bWx']) assert.ok(!(k in c), k);
  assert.ok(!JSON.stringify(c).includes('r84b'));
  // メニューで えらばない（オートや 古い コマンド）ときは 入れかえ
  use(b, me, { type: 'ability', id: 'ms_mizu' });
  assert.equal(formOf(me), 'oyu');
  // 新しい 戦いは また すがた なし
  const s2 = setup('ranma', { seed: 2 });
  assert.equal(formOf(s2.me), null);
});

test('第84回 B の すがた: 水 ＝ 速い・よけやすい（上限・前ぶれの 大技は よけられない）／お湯 ＝ 物理が 強い・受ける ダメージが へる', () => {
  const { b, me } = setup('hiryu_master');
  const foe = b.enemies[0];
  const sp0 = speedMult(me);
  me.r84bForm = 'mizu';
  assert.ok(Math.abs(speedMult(me) / sp0 - 1.25) < 1e-9, '伝説は 25% 速い');
  assert.ok(Math.abs(r84bSpeed(me) - 1.25) < 1e-9);
  assert.equal(r84bEva(b, foe, me), EVA_CAP, 'よけやすさは 上限まで');
  assert.ok(EVA_CAP <= 0.2);
  b.cur = { big: true };
  assert.equal(r84bEva(b, foe, me), 0, '前ぶれの ある 大技は よけられない');
  b.cur = null;
  assert.equal(r84bEva(b, me, me), 0);
  const hit = (form) => {
    me.r84bForm = form;
    return b.calcPhys(me, foe, { mult: 1 }, 1, 'phys', true).dmg;
  };
  assert.ok(hit('oyu') > hit('mizu') * 1.2, 'お湯は 物理が 強い');
  // お湯の 守り: 受ける ダメージが へる
  const taken = (form) => {
    const s = setup('hiryu_master', { seed: 4 });
    s.me.r84bForm = form;
    const ev = { lines: [], upd: [], results: [] };
    const hp = s.me.hp;
    s.b.damage(s.b.enemies[0], s.me, 100, ev, {});
    return hp - s.me.hp;
  };
  assert.equal(taken('mizu'), 100);
  assert.ok(taken('oyu') < 90 && taken('oyu') >= 80, `${taken('oyu')}`);
});

test('第84回 B の すがた: 勝手に かわる（雨・水の 攻撃 → 水／晴れ・炎の 攻撃 → お湯）・ひとこと・同じ 天気の 間は 1回だけ', () => {
  const { b, me } = setup('ranma');
  const foe = b.enemies[0];
  const ev = { lines: [], upd: [], results: [] };
  b.damage(foe, me, 10, ev, { element: 'water' });
  assert.equal(formOf(me), 'mizu');
  assert.ok(ev.lines.some((l) => l.includes('水のすがたになった')));
  b.damage(foe, me, 10, ev, { element: 'fire' });
  assert.equal(formOf(me), 'oyu');
  assert.ok(ev.lines.some((l) => l.includes('お湯のすがたになった')));
  b.damage(foe, me, 10, ev, { element: 'ice' });
  assert.equal(formOf(me), 'oyu', 'ほかの 属性では かわらない');
  // 水の 攻撃を 受ける 戦い（本物の 敵の 行動）
  const s = setup('ranma', { seed: 3, act: 'm_wave' });
  if (ABILITIES.m_wave?.effect?.element === 'water') {
    const a = foeAct(s.b, s.b.enemies[0]);
    assert.ok(a);
    assert.equal(formOf(s.me), 'mizu');
  }
  // 天気: 雨 → 水（自分の 番の はじめ）。自分で お湯に もどすと、同じ 雨の 間は そのまま
  setWeather(b, 'rain', 20, 'enemy');
  const act = use(b, me, { type: 'ability', id: 'ms_amaguri' });
  assert.equal(formOf(me), 'mizu');
  assert.ok(act.lines.some((l) => l.includes('雨にぬれて')));
  use(b, me, { type: 'ability', id: 'ms_mizu', form: 'oyu' });
  use(b, me, { type: 'ability', id: 'ms_amaguri' });
  assert.equal(formOf(me), 'oyu', '同じ 雨の 間は 1回だけ');
  setWeather(b, 'sun', 20, 'ally');
  me.r84bForm = 'mizu';
  const act2 = use(b, me, { type: 'ability', id: 'ms_amaguri' });
  assert.equal(formOf(me), 'oyu');
  assert.ok(act2.lines.some((l) => l.includes('お日さま')));
  // すがたを 持たない 人は かわらない
  const w = setup('god_hand');
  w.b.damage(w.b.enemies[0], w.me, 10, { lines: [], upd: [], results: [] }, { element: 'water' });
  assert.equal(w.me.r84bForm, undefined);
});

test('第84回 B の 乱れ打ち・手数の 技・心の水・自信の気だん: すがたで かわる', () => {
  const run = (form, id, job = 'ranma', kokoro = false) => {
    const { b, me } = setup(job, { seed: 5 });
    if (form) me.r84bForm = form;
    if (kokoro) me.r84bKokoro = { left: 3 };
    const act = use(b, me, { type: 'ability', id });
    return { act, n: hitsOn(act, b.enemies[0].id), dmg: dmgOf(act) };
  };
  assert.equal(run('mizu', 'musabetsu_student_sig').n, 8);
  assert.equal(run('oyu', 'musabetsu_student_sig').n, 1);
  assert.equal(run(null, 'musabetsu_student_sig').n, 4);
  assert.ok(run('oyu', 'musabetsu_student_sig').dmg > run(null, 'musabetsu_student_sig').dmg / 4 * 3, 'お湯の 1回は 重い');
  // 手数の 技は 水の すがたで ふえる
  assert.equal(run(null, 'ms_amaguri').n, 5);
  assert.equal(run('mizu', 'ms_amaguri').n, 6);
  assert.equal(run('mizu', 'rm_kachuu').n, 8);
  // 心の水: 3回の 行動の 間 水と お湯の 両方（速い ＋ 物理が 強い）
  {
    const { b, me } = setup('hiryu_master', { seed: 6 });
    use(b, me, { type: 'ability', id: 'hr_kokoro' });
    assert.ok(me.r84bKokoro);
    const foe = b.enemies[0];
    assert.ok(r84bSpeed(me) > 1 && r84bEva(b, foe, me) > 0);
    const strong = b.calcPhys(me, foe, { mult: 1 }, 1, 'phys', true).dmg;
    delete me.r84bKokoro;
    assert.ok(strong > b.calcPhys(me, foe, { mult: 1 }, 1, 'phys', true).dmg);
    me.r84bKokoro = { left: 3 };
    for (let i = 0; i < 3; i++) use(b, me, { type: 'ability', id: 'hr_kidan' });
    assert.ok(me.r84bKokoro, '3回 動く まで');
    use(b, me, { type: 'ability', id: 'hr_kidan' });
    assert.ok(!me.r84bKokoro, '4回めの はじめに もどる');
    assert.equal(pub(me).r84bKokoro, 0);
  }
  // 自信の気だん: HP が 多いほど 強い
  const kidan = (ratio) => {
    const { b, me } = setup('ranma', { seed: 8 });
    me.hp = Math.max(1, Math.round(me.maxHp * ratio));
    return dmgOf(use(b, me, { type: 'ability', id: 'rm_kidan' }));
  };
  assert.ok(kidan(1) > kidan(0.1) * 1.4);
});

// ───────────── 飛竜しょう天は・かけひき ─────────────
test('第84回 B の 強化の 数: ふつうの 強化・力ため・かけひき・ボスの ずっと 続く 強化は 1つだけ・上限', () => {
  assert.equal(boostCount({ buffs: {} }), 0);
  assert.equal(boostCount({ buffs: { atk: { mult: 1.3, left: 3 }, def: { mult: 1.3, left: 3 } } }), 2);
  assert.equal(boostCount({ buffs: { atk: { mult: 1.3, left: Infinity }, eva: { add: 0.2, left: Infinity } } }), 1, 'ボスの しかけ（ずっと 続く 強化）は 1つ だけ');
  assert.equal(boostCount({ buffs: {}, charge: 2 }), 1);
  assert.equal(boostCount({ buffs: {}, r84bIkari: { left: 2 } }), 1);
  assert.equal(boostCount({ buffs: { atk: { left: 3 }, def: { left: 3 }, agi: { left: 3 }, mag: { left: 3 } }, charge: 2, r84bIkari: { left: 2 } }), BOOST_CAP);
  assert.equal(BOOST_CAP, 4);
  // 形態・前ぶれ・かまえは 数えない
  assert.equal(boostCount({ buffs: {}, form: 2, telegraph: { id: 'x' }, stance: { kind: 'counter' } }), 0);
  const st = { mult: 1.5, vsBuff: 0.25, water: 1.2 };
  assert.equal(hiryuMult(st, {}, { buffs: {} }), 1.5);
  assert.ok(Math.abs(hiryuMult(st, {}, { buffs: {}, r84bIkari: { left: 1 } }) - 1.875) < 1e-9);
  assert.ok(Math.abs(hiryuMult(st, { job: 'ranma', abilities: [], r84bForm: 'mizu' }, { buffs: {} }) - 1.8) < 1e-9, '水の すがたで さらに 強い');
  assert.ok(hiryuMult(st, { job: 'ranma', abilities: [], r84bForm: 'mizu' }, { buffs: { a: { left: 1 }, b: { left: 1 }, c: { left: 1 }, d: { left: 1 }, e: { left: 1 } } }) <= 1.5 * 2 * 1.2 + 1e-9, '上限');
});

test('第84回 B の 飛竜しょう天は: かまえ → 攻撃を 受けると 風で 敵全体へ・強化した 敵ほど 強い・水で さらに・来なければ 弱い 一ふり', () => {
  const counter = ({ form = null, anger = false, seed = 11 } = {}) => {
    const { b, me } = setup('ranma', { seed, enemies: ['rockman', 'rockman'], act: 'm_attack' });
    if (form) me.r84bForm = form;
    for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
    if (anger) for (const e of b.enemies) e.r84bIkari = { left: 99, atk: 1 };
    const set = use(b, me, { type: 'ability', id: 'ranma_sig' });
    assert.equal(me.stance?.kind, 'hiryu');
    assert.equal(pub(me).stance, 'hiryu');
    assert.ok(set.r84bHiryuSet);
    const foe = b.enemies[0];
    foe.actions = [{ w: 1, id: 'm_attack' }];
    const a = foeAct(b, foe);
    return { a, b, me };
  };
  const plain = counter();
  assert.ok(plain.a.r84bHiryuRet?.length, `やり返した: ${plain.a.lines}`);
  assert.deepEqual(plain.a.r84bHiryuRet[0].targets.sort(), plain.b.enemies.map((e) => e.id).sort(), '敵全体');
  assert.ok(plain.a.lines.some((l) => l.includes('飛竜しょう天は')));
  assert.equal(plain.me.stance, null, 'やり返すのは 1回');
  const sum = (r) => r.a.results.filter((x) => x.dmg > 0 && r.b.get(x.id)?.side === 'enemy').reduce((s, x) => s + x.dmg, 0);
  // 守り下げなしで くらべる（かけひきの 守り下げは べつ）: おこって いる 敵ほど 強い
  const angry = counter({ anger: true });
  assert.ok(sum(angry) > sum(plain) * 1.1, `${sum(angry)} > ${sum(plain)}`);
  const wet = counter({ form: 'mizu' });
  assert.ok(sum(wet) > sum(plain) * 1.05, `水: ${sum(wet)} > ${sum(plain)}`);
  // 攻撃が 来なかった: 次の 自分の 番の はじめに 弱い 風の 一ふり
  const { b, me } = setup('ranma', { seed: 12, enemies: ['rockman', 'rockman'] });
  use(b, me, { type: 'ability', id: 'ranma_sig' });
  const next = use(b, me, { type: 'ability', id: 'ms_dogeza' });
  assert.equal(next.r84bSwing, me.id);
  assert.ok(next.lines.some((l) => l.includes('風の一ふり')));
  assert.equal(me.stance, null);
});

test('第84回 B の かけひき: 攻撃力 少し上・守り 大きく下（足し算に しない）・ボスは ひかえめ・飛竜こうりんだんが 強く なる', () => {
  const { b, me } = setup('hiryu_master', { seed: 21, enemies: ['rockman', 'rockman'] });
  const foe = b.enemies[0];
  let ok = false;
  for (let i = 0; i < 6 && !ok; i++) {
    use(b, me, { type: 'ability', id: 'rm_kakehiki', target: foe.id });
    ok = !!foe.r84bIkari;
  }
  assert.ok(ok, 'おこった');
  assert.equal(foe.debuffs.def.mult, 0.6);
  assert.equal(foe.r84bIkari.atk, 1.1);
  assert.equal(pub(foe).r84bIkari > 0, true);
  // 足し算に しない: もっと 強い 守り下げが ある 時は そのまま（2だんかいめにも ならない）
  foe.debuffs.def = { mult: 0.5, base: 0.5, lv: 1, left: 1 };
  use(b, me, { type: 'ability', id: 'rm_kakehiki', target: foe.id });
  assert.ok(foe.debuffs.def.mult >= 0.5 - 1e-9 && (foe.debuffs.def.lv || 1) === 1);
  // おこった 敵の 攻撃は 少し 強い
  const ev = { lines: [], upd: [], results: [] };
  const hp = me.hp;
  b.damage(foe, me, 100, ev, {});
  assert.equal(hp - me.hp, 110);
  // ボス: 守り下げは 0.8・長さは 2
  const s = setup('hiryu_master', { seed: 22 });
  const boss = s.b.enemies[0];
  boss.boss = true;
  for (let i = 0; i < 10 && !boss.r84bIkari; i++) use(s.b, s.me, { type: 'ability', id: 'rm_kakehiki', target: boss.id });
  assert.ok(boss.r84bIkari);
  assert.equal(boss.debuffs.def.mult, 0.8);
  assert.ok(boss.r84bIkari.left <= 2);
  // かけひき・極は 敵全体
  const t = setup('hiryu_master', { seed: 23, enemies: ['rockman', 'rockman', 'rockman'] });
  use(t.b, t.me, { type: 'ability', id: 'hr_kakehiki' });
  assert.ok(t.b.enemies.filter((e) => e.r84bIkari).length >= 2);
  // 飛竜こうりんだん: 敵の 強化の 数で 強い（かまえ なし）
  const k = (n) => {
    const u = setup('hiryu_master', { seed: 24 });
    const e = u.b.enemies[0];
    e.buffs = Object.fromEntries(['atk', 'agi', 'mag'].slice(0, n).map((st) => [st, { mult: 1, left: 9 }]));
    return u.b.calcPhys(u.me, e, ABILITIES.hiryu_master_sig.effect, 1, 'wind', true).dmg;
  };
  assert.ok(k(3) > k(0) * 1.5, `${k(3)} > ${k(0)}`);
  assert.equal(ABILITIES.hiryu_master_sig.target, 'enemies');
});

test('第84回 B の どげざ・敵前だい逃亡: 敵の 番が おくれる（ボスは 効きにくい）・仲間全員が 1回 よけやすい・自分の 番が 早い・にげない', () => {
  // どげざ
  let late = false;
  for (let seed = 1; seed < 8 && !late; seed++) {
    const { b, me } = setup('ranma', { seed });
    const foe = b.enemies[0];
    readyUp(b, me);
    foe.atb = 80;
    b.command(me.id, { type: 'ability', id: 'ms_dogeza', target: foe.id }, 's1');
    const act = runUntilAct(b, me.id);
    if (act.lines.some((l) => l.includes('手が止まった'))) late = foe.atb <= 20 + 1e-9;
  }
  assert.ok(late);
  // 敵前だい逃亡
  const c1 = newCharacter({ id: 'p2', name: 'ナナ', job: 'warrior' });
  gainExp(c1, expForLevel(40));
  fullHeal(c1);
  const { b, c, me } = setup('hiryu_master', { seed: 31 });
  const b2 = new Battle({ rng: makeRng(31), allies: [{ char: c, controller: 's1' }, { char: c1, controller: 's1' }], enemies: ['rockman'], canFlee: true });
  for (const e of b2.enemies) { e.actions = [{ w: 1, id: 'm_nothing' }]; e.hp = e.maxHp = 50000; }
  const [a, f] = b2.allies;
  a.mp = a.maxMp = 999;
  const act = use(b2, a, { type: 'ability', id: 'hr_toubou' });
  assert.ok(a.r84bDodge && f.r84bDodge, '仲間全員');
  assert.ok(r84bEva(b2, b2.enemies[0], f) >= 0.2 - 1e-9);
  assert.equal(a.atb, 80, '自分の 次の 番が 早い');
  assert.ok(!b2.pendingEnd, '戦いからは にげない');
  assert.ok(act.lines.every((l) => !l.includes('逃げ出した')));
  use(b2, a, { type: 'ability', id: 'hr_kidan' });
  assert.ok(!a.r84bDodge, '1回 動いたら もどる');
  assert.ok(me);
});

test('第84回 B の オート: はじめに すがた（ボス ＝ お湯・ざこ ＝ 水）・前ぶれや 強化に 飛竜しょう天は・敵が 多い 時は 手数', () => {
  const auto = (job, { boss = false, n = 3, tele = false, buffs = false, form = null, seed = 1 } = {}) => {
    const { b, c, me } = setup(job, { seed, enemies: Array(n).fill('rockman') });
    me.abilities = learnedAbilities(c);
    if (boss) { b.boss = true; b.enemies[0].boss = true; }
    if (tele) b.enemies[0].telegraph = { id: 'x' };
    if (buffs) b.enemies[0].buffs = { atk: { mult: 1.3, left: 3 }, def: { mult: 1.3, left: 3 } };
    if (form) me.r84bForm = form;
    return decideAlly(b, me);
  };
  const boss = auto('ranma', { boss: true, n: 1 });
  assert.equal(boss.id, 'ms_mizu');
  assert.equal(boss.form, 'oyu');
  const mob = auto('ranma', { n: 3 });
  assert.equal(mob.id, 'ms_mizu');
  assert.equal(mob.form, 'mizu');
  let hiryu = 0, te = 0;
  for (let s = 1; s <= 20; s++) {
    if (auto('ranma', { n: 1, tele: true, form: 'oyu', seed: s, boss: true }).id === 'ranma_sig') hiryu++;
    if (auto('hiryu_master', { n: 4, form: 'mizu', seed: s }).id === 'hr_senju') te++;
  }
  assert.ok(hiryu >= 6, `前ぶれに 飛竜しょう天は ${hiryu}`);
  assert.ok(te >= 4, `敵が 多い 時は 手数 ${te}`);
  let buffed = 0;
  for (let s = 1; s <= 20; s++) if (auto('ranma', { n: 1, buffs: true, form: 'oyu', seed: s }).id === 'ranma_sig') buffed++;
  assert.ok(buffed >= 5, `強化した 敵に 飛竜しょう天は ${buffed}`);
  // この 系統の 技を 持たない 職業の オートは かわらない（運を 使わない）
  const a = setup('god_hand', { seed: 9 });
  const b = setup('god_hand', { seed: 9 });
  assert.deepEqual(decideAlly(a.b, a.me), decideAlly(b.b, b.me));
});

// ───────────── ひらめき・合体技・試練・ひとこと・乗り物 ─────────────
test('第84回 B の ひらめき技: 3つの 職業に 1つずつ・データ・文字・使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R84B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R84B).sort(), [...ids].sort());
  assert.deepEqual(NEW.map((j) => ids.filter((id) => HIRA_R84B_ABILITIES[id].job === j).length), [1, 1, 1]);
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) textOk(s, id);
    assert.ok(!KANJI.test(a.kana), `${id} kana: ${a.kana}`);
    assert.ok(R84B_ANIMS.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, cnt] of Object.entries(HIRAMEKI[id].from)) assert.ok(cnt > 0 && R84B_ABILITIES[k], `${id}: ${k}`);
    const c = newCharacter({ id: 'x', name: 'x', job: 'monk' });
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

test('第84回 B の 職業: タグで 合体技（3つ いじょう）・職業の試練・転職の ひとこと・パンダ', () => {
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
  // 合体技の 相手の 案: 武闘家（こぶし）・遊び人（笑い）・天気の 職業〈雨〉（氷・水）
  assert.ok(JOBS.monk.tags.includes('fist') && JOBS.jester.tags.includes('laugh') && JOBS.tenkou_tsukai.tags.includes('ice'));
  assert.ok(JOBS.musabetsu_student.tags.includes('laugh') && JOBS.musabetsu_student.tags.includes('ice'));
  for (const j of ['ranma', 'hiryu_master']) {
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 3, `${j}: まぼろしの 技`);
    for (const id of phantomSkills(j)) assert.ok(!/^r84b/.test(ABILITIES[id].effect.type), `${id}: まぼろしは すがた・かまえ・かけひきを 使わない`);
    textOk(TRIAL_WORDS[j], j);
    assert.ok(TRIAL_WORDS[j].length <= 36);
    textOk(masterName(j), j);
  }
  // 乗り物: パンダ（3つの 職業）
  const v = VEHICLES.panda;
  assert.deepEqual(v.jobs, NEW);
  textOk(v.name, 'panda');
  textOk(v.desc, 'panda');
  assert.ok(v.price > 0 && v.price <= 10000);
  for (const view of VIEWS) {
    const frames = new Set();
    for (let f = 0; f < vehicleFrames('panda'); f++) {
      const lit = (p) => (p ? p.px.filter(Boolean).length : 0);
      assert.ok(lit(paintVehicle('panda', view, f, 'back')) + lit(paintVehicle('panda', view, f, 'front')) > 60, `${view} ${f}`);
      assert.ok(riderSpot('panda', view, f));
      frames.add([...(paintVehicle('panda', view, f, 'front')?.px || [])].join());
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

test('第84回 B の 絵: 3つの 職業（男女・4方向・はみ出さない・段ごとに ちがう・武闘家と ちがう）・おさげ・竜巻の オーラ・古い え', () => {
  assert.deepEqual(LOOK_JOBS, NEW);
  for (const j of NEW) assert.ok(R84B_OUTFIT[j] && R84B_BODY[j] && R84B_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const other of [...NEW.filter((x) => x !== job), 'monk', 'battlemaster']) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, other, undefined, dir, 0, 4)), `${job} は ${other} と ちがう え`);
        }
      }
    }
    const O = outfitOf({ cloth: '#3f7fd0', skin: 0 }, job, 'cloth', false);
    assert.equal(O.kind, 'gi');
    assert.equal(jobBody(job).hair, 'braid', 'おさげ（かみの 色は その 人の まま）');
    assert.ok(!jobBody(job).hcol);
    for (const body of [0, 1]) {
      const o = lookToOpts({ body }, job, ',cloth,,');
      assert.ok(o.outfit, job);
      assert.ok(paintHuman('down', 0, o), job);
    }
  }
  assert.equal(jobBody('hiryu_master').aura, 'tatsu84');
  assert.ok(AURA84B.tatsu84);
  assert.ok(!jobBody('ranma').aura);
});

// ───────────── えんしゅつ・札 ─────────────
test('第84回 B の えんしゅつ: 看板の 技・大事な 技（竜巻・水しぶき・ゆげ・パンダ）・音・こわれない・すがたの 札', () => {
  const used = new Set([...Object.keys(R84B_ABILITIES), ...Object.keys(HIRA_R84B_ABILITIES)].map((id) => ABILITIES[id].anim));
  const shown = new Set(['r84b_hiryu', 'r84b_wind']); // client/battle-r84b.js の r84bPresent が 出す
  for (const anim of R84B_ANIMS) assert.ok(used.has(anim) || shown.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R84B_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R84B_SFX).sort(), [...R84B_ANIMS].sort());
  assert.deepEqual(Object.keys(R84B_HIT).sort(), [...R84B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R84B_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const a of PARTY_ANIMS_R84B) assert.ok(PARTY_ANIMS.has(a), a);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /Object\.assign\(ANIM_SFX, R84B_SFX\)/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R84B_HIT\)/);
  assert.match(battle, /ab\.effect\.type === 'r84bForm'\) return formMenu/);
  assert.match(battle, /r84bPresent\(this, ev, hitDelay\)/);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR84bFx\(this, anim/);
  // 水を かぶる（水しぶき）と お湯を かぶる（ゆげ）は ちがう えんしゅつ
  const colors = (el) => {
    const fx = new Effects();
    playR84bFx(fx, 'r84b_form', [{ x: 128, y: 120 }], el, {}, BW, BH);
    return JSON.stringify(fx.parts.map((p) => p.color || p.colors));
  };
  assert.notEqual(colors('water'), colors('fire'));
  for (const anim of R84B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }]]) {
      for (const el of [null, 'water', 'fire', 'wind']) {
        const fx = new Effects();
        assert.equal(playR84bFx(fx, anim, targets, el, { crit: el === 'fire' }, BW, BH), true, anim);
        fx.play(anim, targets, el, {});
        assert.ok(fx.parts.length > 0, anim);
        let t = 0;
        while (fx.parts.length && t < 4000) { fx.update(16); t += 16; }
        assert.ok(t <= 2200, `${anim}: ${t}ms`);
      }
    }
  }
  assert.equal(playR84bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.equal(playR84bFx(new Effects(), 'ranma_sig', []), false);
  // 仲間の まどの 札（家族 みんなに 見える）
  assert.deepEqual(r84bMarks({ alive: true, r84bForm: 'mizu' }).map((m) => m.text), ['水のすがた']);
  assert.deepEqual(r84bMarks({ alive: true, r84bForm: 'oyu', r84bKokoro: 2, stance: 'hiryu' }).map((m) => m.text), ['お湯のすがた', '心の水2', 'かまえ']);
  assert.deepEqual(r84bMarks({ alive: true, r84bIkari: 2 }).map((m) => m.text), ['いかり2']);
  assert.deepEqual(r84bMarks({ alive: true, r84bForm: '' }), []);
  assert.deepEqual(r84bMarks({ alive: false, r84bForm: 'mizu' }), []);
  for (const k of FORM_ORDER) textOk(r84bMarks({ alive: true, r84bForm: k })[0].text, k);
});
