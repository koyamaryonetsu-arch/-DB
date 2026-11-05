// 2026年11月（第66回 B班）: 4つの 新しい 伝説の 職業（docs/plan-r66-legend.md の B班）
//   星の歌姫 か フルーツジッパー → ニューカワイイ（女性だけ）／ 星の歌姫 か アラシ → SMAP（男性だけ）
//   M-1王者 → 大御所 ／ 三ツ星シェフ → 五つ星シェフ（どちらも ＋ほかの 超級職 1つ）
//  ・職業の 木（reqAlt と body の くみあわせ）・神殿の うわさ・強さ・技・ひらめき技・合体技に 入れる・職業の試練・転職の ひとこと・乗り物・文字
//  ・絵（hero-r66b.js）と えんしゅつ（battlefx-r66b.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  JOBS, SUPER_ORDER, LEGEND_ORDER, ALL_JOBS, JOB_HINTS, JOB_MAX_LEVEL, BODY_NAMES, jobReqText, jobReqSets, jobBodyOk, jobAncestry, jobBases,
} from '../public/js/shared/data/jobs.js';
import { LEGEND_R66B_ORDER, LEGEND_R66B_JOBS, LEGEND_R66B_HINTS } from '../public/js/shared/data/jobs-legend-r66b.js';
import { ABILITIES, abilityRole } from '../public/js/shared/data/abilities.js';
import { R66B_ABILITIES } from '../public/js/shared/data/abilities-r66b.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { HIRA_R66B_ABILITIES, HIRAMEKI_R66B } from '../public/js/shared/data/hirameki-r66b.js';
import { DUAL_TECHS, ANY_GROUPS, groupJobs } from '../public/js/shared/data/dual.js';
import { JOB_SAY, JOB_SAY_MASC, jobDoneText } from '../public/js/shared/data/job-talk.js';
import { TRIAL_WORDS, trialJob, masterName } from '../public/js/shared/data/job-trials.js';
import { VEHICLES, vehicleShelf } from '../public/js/shared/data/vehicles.js';
import { PHANTOM_ADJ, phantomSkills } from '../public/js/shared/battle-trial.js';
import { jobLabel, jobHint } from '../public/js/shared/job-label.js';
import { abilityFor } from '../public/js/shared/ability-label.js';
import {
  newCharacter, changeJob, jobUnlocked, jobKnown, fixBodyJob, gainExp, expForLevel, fullHeal, learnedAbilities, hiraAllowed,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { decideAlly } from '../public/js/shared/ai.js';
import { makeRng } from '../public/js/shared/rng.js';
import { paintHero } from '../public/js/client/render/hero.js';
import { outfitOf, jobBody } from '../public/js/client/render/hero-outfit.js';
import { headOf } from '../public/js/client/render/hero-gear.js';
import { masc33 } from '../public/js/client/render/hero-r33.js';
import { R66B_JOBS, R66B_OUTFIT, R66B_BODY, R66B_HAT, R66B_OLD_LOOK } from '../public/js/client/render/hero-r66b.js';
import { lookToOpts, paintHuman } from '../public/js/client/render/chars.js';
import { Effects, BW, BH } from '../public/js/client/render/battlefx.js';
import { R66B_ANIMS, R66B_SIGS, PARTY_ANIMS_R66B, R66B_HIT, R66B_SFX, R66B_FINE, playR66bFx } from '../public/js/client/render/battlefx-r66b.js';
import { JOB7_FINE } from '../public/js/client/render/battlefx-jobs7.js';
import { PARTY_ANIMS } from '../public/js/client/render/battlefx-jobs2.js';
import { JOB8_FINE } from '../public/js/client/render/battlefx-jobs8.js';
import { SFX_R26 } from '../public/js/client/sfx-r26.js';
import { SFX_R33 } from '../public/js/client/sfx-r33.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';

const NEW = ['new_kawaii', 'smap', 'oogosho', 'five_star_chef'];
// [名前, もとの 超級職（req）, べつの 道（reqAlt）, 体]
const TREE = {
  new_kawaii: ['ニューカワイイ', 'star_diva', 'fruit_idol', 1],
  smap: ['SMAP', 'star_diva', 'storm_idol', 0],
  oogosho: ['大御所', 'm1_champion', null, undefined],
  five_star_chef: ['五つ星シェフ', 'star_chef', null, undefined],
};
const SIG_NAMES = { new_kawaii: '世界一かわいいライブ', smap: '世界に一つだけの花', oogosho: '日本中が大爆笑', five_star_chef: '五つ星のフルコース' };
const BOY = { body: 0 }, GIRL = { body: 1 };
const lookFor = (j) => (TREE[j][3] === 1 ? GIRL : BOY);
const SCOPE = { enemy: /敵1体/, enemies: /敵全体/, allies: /仲間全員/, self: /自分/ };
const partsOf = (e) => (e.type === 'multi' ? e.parts : [e]);
const lines = (e) => partsOf(e).flatMap((p) => [p.msg, p.failMsg]).filter(Boolean);
const textOk = (s, what) => assert.deepEqual(checkText(s), [], `${what}: ${s}`);
const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const masterChain = (c, jid) => {
  for (const r of JOBS[jid].req || []) { master(c, r); masterChain(c, r); }
  if (JOBS[jid].reqSuper) master(c, 'god_hand');
};
const person = (look) => {
  const c = newCharacter({ id: 'k', name: 'ケン', job: 'warrior' });
  c.look = { ...(c.look || {}), ...look };
  return c;
};

function setup(job, { seed = 1, enemies = ['rockman', 'rockman', 'skeleton'], lv = 45 } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  c.look = { ...(c.look || {}), ...lookFor(job) };
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
test('第66回 B の 職業: 伝説の職業・名前・なり方（reqAlt・body・reqSuper）・うわさ・文字・乗り物', () => {
  assert.deepEqual(LEGEND_R66B_ORDER, NEW);
  assert.deepEqual(Object.keys(LEGEND_R66B_JOBS), NEW);
  assert.deepEqual(Object.keys(LEGEND_R66B_HINTS).sort(), [...NEW].sort());
  for (const id of NEW) {
    const j = JOBS[id], [name, from, alt, body] = TREE[id];
    assert.equal(j.id, id);
    assert.equal(j.name, name);
    assert.equal(j.tier, 3);
    assert.deepEqual(j.req, [from]);
    if (alt) {
      assert.deepEqual(j.reqAlt, [[alt]], `${id}: ${from} か ${alt}`);
      assert.equal(j.reqSuper, undefined, 'どちらか 1つを きわめれば なれる');
      assert.equal(j.body, body);
      // べつの 道の 職業も おなじ 体（フルーツジッパーは 女性・アラシは 男性）
      assert.equal(JOBS[alt].body, body);
    } else {
      assert.equal(j.reqAlt, undefined);
      assert.equal(j.reqSuper, 1, '竜魔人と おなじ（○○＋ほかの超級職1つ）');
      assert.equal(j.body, undefined, '男女 どちらも なれる');
    }
    assert.ok(LEGEND_ORDER.includes(id) && ALL_JOBS.filter((x) => x === id).length === 1);
    assert.equal(JOB_HINTS[id], LEGEND_R66B_HINTS[id]);
    for (const s of [j.name, j.desc, j.short, JOB_HINTS[id]]) textOk(s, id);
    assert.deepEqual(checkText(j.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
    assert.match(j.color, /^#[0-9a-f]{6}$/);
    assert.ok(!j.masc, '名前は 1つ');
    assert.equal(jobLabel(id, { job: id, look: lookFor(id) }), name);
    // 乗り物は もとの 職業と おなじ（オープンカー・スワンボート・屋台）
    assert.ok(Object.values(VEHICLES).some((v) => v.jobs?.includes(id) && v.jobs.some((x) => jobReqSets(id).flat().includes(x))), `${id} の 乗り物`);
  }
  // ならびは 第41回 A の あと・B班の じゅん
  const at = NEW.map((id) => LEGEND_ORDER.indexOf(id));
  assert.ok(at[0] > LEGEND_ORDER.indexOf('hall_of_fame'));
  assert.deepEqual(at, [...at].sort((a, b) => a - b));
  assert.equal(jobReqText('new_kawaii'), '星の歌姫Lv10 または フルーツジッパーLv10');
  assert.equal(jobReqText('smap'), '星の歌姫Lv10 または アラシLv10');
  assert.equal(jobReqText('oogosho'), 'M-1王者Lv10＋ほかの超級職1つLv10');
  assert.equal(jobReqText('five_star_chef'), '三ツ星シェフLv10＋ほかの超級職1つLv10');
  // 系統（どちらの 道の 職業も もとに なる）
  assert.ok(jobAncestry('new_kawaii').has('fruit_idol') && jobAncestry('new_kawaii').has('star_diva') && jobAncestry('new_kawaii').has('idol'));
  assert.ok(jobAncestry('smap').has('storm_idol') && jobAncestry('smap').has('fortune'));
  assert.ok(jobBases('smap').length >= 2);
  // 文字の きまりの 対象の ファイル
  const files = gameFiles().map((f) => f.replace(/\\/g, '/'));
  for (const f of ['jobs-legend-r66b.js', 'abilities-r66b.js', 'hirameki-r66b.js', 'battlefx-r66b.js']) assert.ok(files.some((x) => x.endsWith(`/${f}`)), f);
});

test('第66回 B の 職業: ニューカワイイ・SMAP は 体で わかれる（星の歌姫 か もう1つ。神殿の 一覧・うわさ・転職）', () => {
  // 女の子: 星の歌姫を きわめると ニューカワイイ（SMAP は 見えない）
  {
    const c = person(GIRL);
    assert.equal(jobKnown(c, 'new_kawaii'), false, 'はじめは ひみつ');
    master(c, 'star_diva');
    assert.equal(jobKnown(c, 'new_kawaii'), true);
    assert.equal(jobUnlocked(c, 'new_kawaii'), true, 'ほかの 超級職は いらない');
    assert.equal(jobKnown(c, 'smap'), false, '男性だけの 職業は 見えない');
    assert.equal(jobUnlocked(c, 'smap'), false);
    assert.equal(jobBodyOk('smap', c.look), false);
    const r = changeJob(c, 'smap');
    assert.equal(r.ok, false);
    assert.equal(r.body, 0);
    assert.equal(changeJob(c, 'new_kawaii').ok, true);
    assert.ok(learnedAbilities(c).includes('nk_ichiban'));
  }
  // 女の子: フルーツジッパーの 道でも なれる
  {
    const c = person(GIRL);
    c.jobs.fruit_idol = { lv: 3, b: 0 };
    // 神殿の うわさ（services.js の jobUI と おなじ えらび方）: もとの 職業を はじめると、名前を ださずに
    const rumors = (who) => [...SUPER_ORDER, ...LEGEND_ORDER].filter((s) => jobHint(s, who) && jobBodyOk(s, who.look) && !jobKnown(who, s)
      && jobReqSets(s).some((set) => set.some((r) => who.jobs?.[r])));
    assert.ok(rumors(c).includes('new_kawaii'));
    assert.ok(!rumors(c).includes('smap'));
    assert.equal(jobHint('new_kawaii', c), LEGEND_R66B_HINTS.new_kawaii);
    master(c, 'fruit_idol');
    assert.equal(jobKnown(c, 'new_kawaii'), true);
    assert.equal(jobUnlocked(c, 'new_kawaii'), true);
    assert.equal(changeJob(c, 'new_kawaii').ok, true);
  }
  // 男の子: 星の歌姫 か アラシで SMAP（ニューカワイイは 見えない）
  for (const from of ['star_diva', 'storm_idol']) {
    const c = person(BOY);
    master(c, from);
    assert.equal(jobKnown(c, 'smap'), true, from);
    assert.equal(jobUnlocked(c, 'smap'), true, from);
    assert.equal(jobKnown(c, 'new_kawaii'), false);
    assert.equal(jobUnlocked(c, 'new_kawaii'), false);
    assert.equal(changeJob(c, 'new_kawaii').ok, false);
    assert.equal(changeJob(c, 'smap').ok, true);
    assert.ok(learnedAbilities(c).includes('sm_smile'));
  }
  // 体が ない 人は 男性 あつかい（looks.js と おなじ）
  assert.equal(jobBodyOk('smap', undefined), true);
  assert.equal(jobBodyOk('new_kawaii', undefined), false);
  // 神殿の まどの「（女性だけがなれる職業）」
  assert.equal(BODY_NAMES[JOBS.new_kawaii.body], '女性');
  assert.equal(BODY_NAMES[JOBS.smap.body], '男性');
  // 見た目を かえて 体が ちがう 職業に なっていたら、もとの 職業（星の歌姫）に もどす
  {
    const c = person(BOY);
    master(c, 'star_diva');
    changeJob(c, 'smap');
    c.look.body = 1;
    assert.equal(fixBodyJob(c), true);
    assert.equal(c.job, 'star_diva');
  }
  // 神殿の 一覧の じゅんばん（体で なれない 職業は ださない）
  const services = readFileSync(new URL('../public/js/client/ui/services.js', import.meta.url), 'utf8');
  assert.match(services, /all\.filter\(\(j\) => jobBodyOk\(j, c\.look\)\)/);
  assert.match(services, /BODY_NAMES\[job\.body\]/);
  // 乗り物屋の たな（なった ことの ある 職業の 乗り物）
  const g = person(GIRL);
  g.jobs.new_kawaii = { lv: 1, b: 0 };
  assert.ok(vehicleShelf(g).includes('open_car'));
});

test('第66回 B の 職業: 大御所・五つ星シェフは もとの 超級職 ＋ ほかの 超級職 1つ（男女 どちらも）', () => {
  for (const id of ['oogosho', 'five_star_chef']) {
    for (const look of [BOY, GIRL]) {
      const c = person(look);
      const from = TREE[id][1];
      assert.equal(jobKnown(c, id), false, `${id} は はじめ ひみつ`);
      master(c, from);
      assert.equal(jobKnown(c, id), true, `${from} を きわめると うわさ`);
      assert.equal(jobUnlocked(c, id), false, 'ほかの 超級職も いる');
      master(c, 'archmage');
      assert.equal(jobUnlocked(c, id), true);
      assert.equal(changeJob(c, id).ok, true);
      assert.ok(learnedAbilities(c).includes(JOBS[id].learn[0][1]));
    }
  }
});

test('第66回 B の 職業: 強さは 今の 伝説の職業の はんい（超級職より 上）・もとの 職業より 強い・武器', () => {
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  const legends = LEGEND_ORDER.filter((j) => !NEW.includes(j) && JOBS[j].tier === 3).map(sum);
  const sup = SUPER_ORDER.map(sum);
  for (const j of NEW) {
    assert.deepEqual(Object.keys(JOBS[j].mods).sort(), ['agi', 'def', 'heal', 'hp', 'mag', 'mp', 'str']);
    assert.ok(sum(j) > Math.max(...sup) && sum(j) >= Math.min(...legends) && sum(j) <= Math.max(...legends), `${j}: ${sum(j).toFixed(2)}`);
    for (const from of jobReqSets(j).flat()) {
      assert.ok(sum(j) > sum(from) + 0.5, `${j}: ${from} より 強い`);
      // もとの 職業の 武器は ぜんぶ 使える
      for (const w of JOBS[from].weapons) assert.ok(JOBS[j].weapons.includes(w), `${j}: ${w}`);
    }
    assert.ok(Object.values(JOBS[j].perLv).reduce((a, b) => a + b, 0) <= 3.5 + 1e-9);
  }
  // ニューカワイイは 魔力と 回復、SMAP は バランス、大御所は 素早さと 魔力、五つ星シェフは HPと 回復
  assert.ok(JOBS.new_kawaii.mods.heal >= 1.55 && JOBS.new_kawaii.mods.mag >= 1.45);
  assert.ok(JOBS.oogosho.mods.agi >= 1.5 && JOBS.oogosho.mods.mag >= 1.5);
  assert.ok(JOBS.five_star_chef.mods.hp >= 1.55 && JOBS.five_star_chef.mods.heal >= 1.5);
});

// ───────────── 技 ─────────────
test('第66回 B の 技: 7こ・Lv10 が いちばん MP・看板の 技・攻撃技・せつめい・文字・名前が かぶらない・補助の 上限', () => {
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
      assert.equal(names.get(a.name).length, 1, `${a.name} が かぶる`);
      assert.ok(a.name.length <= 12, `${a.name}: 名前は みじかく`);
      // 回復や 補助だけの multi は role を つける（multi は ダメージ あつかいに なるので）
      if (a.effect.type === 'multi' && !partsOf(a.effect).some((p) => ['phys', 'magic'].includes(p.type))) assert.ok(a.role, `${id}: role`);
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
  assert.deepEqual([...mine].sort(), Object.keys(R66B_ABILITIES).sort(), 'abilities-r66b.js の 技は ぜんぶ どれかの 職業で 覚える');
  // 職業の 味（家族の ねがい）
  const has = (j, f) => JOBS[j].learn.some(([, id]) => partsOf(ABILITIES[id].effect).some((p) => f(p, ABILITIES[id])));
  const allyBuff = (p, a) => p.type === 'buff' && (p.target || a.target) === 'allies';
  // 歌で 全員を 強く する（アイドルの 2つ）: 仲間全員の 強化が 3つ いじょう（看板の 技も）
  for (const j of ['new_kawaii', 'smap']) {
    assert.ok(JOBS[j].learn.filter(([, id]) => partsOf(ABILITIES[id].effect).some((p) => allyBuff(p, ABILITIES[id]))).length >= 3, `${j}: 歌で 強く`);
    assert.ok(partsOf(ABILITIES[`${j}_sig`].effect).some((p) => p.type === 'buff' && p.target === 'allies'), `${j}: 看板の 技で 仲間も`);
  }
  // 大御所: 笑わせて 動けなく する・こんらん
  assert.ok(JOBS.oogosho.learn.filter(([, id]) => partsOf(ABILITIES[id].effect).some((p) => p.type === 'atbSet' && p.sub > 0)).length >= 3, '大御所: 笑って 止まる');
  assert.ok(has('oogosho', (p) => p.type === 'status' && p.status === 'confuse'), '大御所: こんらん');
  // 五つ星シェフ: 料理で 回復して 強く する
  assert.ok(JOBS.five_star_chef.learn.filter(([, id]) => abilityRole(ABILITIES[id]) === 'heal').length >= 3, '五つ星シェフ: 回復の 料理');
  assert.ok(has('five_star_chef', (p, a) => p.type === 'heal' && (p.target || a.target) === 'allies') && has('five_star_chef', allyBuff), '五つ星シェフ: 回復と 強化');
  assert.ok(partsOf(ABILITIES.five_star_chef_sig.effect).some((p) => p.type === 'heal' && p.target === 'allies'), 'フルコースで 仲間も 回復');
});

test('第66回 B の 技は ぜんぶ たたかいで 使えて、攻撃技は ダメージ・オートでも こわれない', () => {
  let n = 0;
  for (const j of NEW) {
    for (const [, id] of JOBS[j].learn) {
      const { b, me, m } = setup(j, { seed: ++n });
      const a = ABILITIES[id];
      assert.ok(readyUp(b, me));
      const r = b.command(me.id, { type: 'ability', id, target: a.target === 'ally' ? m.id : b.enemies[0].id }, 's1');
      assert.equal(r.ok, true, `${id} ${r.reason || ''}`);
      const act = runUntilAct(b, me.id);
      assert.ok(act && !act.lines.some((l) => l.includes('MPが足りない')), id);
      for (const l of act.lines) textOk(l, id);
      if (abilityRole(a) === 'dmg') assert.ok(act.results?.some((x) => x.dmg > 0), `${id} の ダメージ`);
      // 看板の 技で 仲間も 強く なる
      if (id === 'smap_sig') assert.ok(me.buffs.atk && m.buffs.def && m.buffs.agi, 'SMAP: 仲間の 攻撃力・守備力・素早さ');
      if (id === 'new_kawaii_sig') assert.ok(m.buffs.atk && m.buffs.mag, 'ニューカワイイ: 仲間の 攻撃力と 魔力');
      if (id === 'five_star_chef_sig') assert.ok(m.buffs.atk, '五つ星シェフ: 仲間の 攻撃力');
      if (id === 'nk_ichiban') assert.ok(m.buffs.atk && m.buffs.mag);
      if (id === 'fc_dessert') assert.ok(m.buffs.agi);
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

// ───────────── ひらめき技 ─────────────
test('第66回 B の ひらめき技: 4つの 職業に 2つずつ・データ・文字・その 職業の 技を 使いこむと ひらめく', () => {
  const ids = Object.keys(HIRA_R66B_ABILITIES);
  assert.deepEqual(Object.keys(HIRAMEKI_R66B).sort(), [...ids].sort());
  for (const j of NEW) assert.equal(ids.filter((id) => HIRA_R66B_ABILITIES[id].job === j).length, 2, j);
  const oldAnims = new Set(Object.entries(ABILITIES).filter(([id]) => !ids.includes(id)).map(([, a]) => a.anim));
  const names = new Map();
  for (const [id, a] of Object.entries(ABILITIES)) if (!a.hidden) names.set(a.name, [...(names.get(a.name) || []), id]);
  let n = 0;
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(a && a.hirameki && HIRAMEKI[id] && id.startsWith('hi_'), id);
    assert.match(a.desc, SCOPE[a.target], `${id}: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast, ...lines(a.effect)]) textOk(s, id);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(oldAnims.has(a.anim), `${id}: ${a.anim}`);
    assert.equal(names.get(a.name).length, 1, a.name);
    for (const [k, c] of Object.entries(HIRAMEKI[id].from)) {
      assert.ok(c > 0 && JOBS[a.job].learn.some(([, x]) => x === k), `${id}: ${k}`);
    }
    const c = newCharacter({ id: 'x', name: 'x', job: 'warrior' });
    c.job = a.job;
    assert.equal(hiraAllowed(c, id), true);
    c.job = TREE[a.job][1];
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
test('第66回 B の 職業: タグで 合体技に 入れる（3つ いじょう）・職業の試練（三の試練まで）・転職の ひとこと', () => {
  for (const j of NEW) {
    assert.ok(JOBS[j].tags.length >= 2 && JOBS[j].tags.length <= 4, j);
    assert.ok(JOBS[j].tags.includes('master'), `${j}: その 道を きわめた`);
    // もとの 職業（req）の タグ（歌とおどりは 13職業の 上限〈test/dual-r31.test.js〉なので のぞく）
    for (const t of JOBS[TREE[j][1]].tags.filter((x) => !['work', 'guard', 'stage'].includes(x))) assert.ok(JOBS[j].tags.includes(t), `${j}: もとの 職業の タグ ${t}`);
    assert.ok(!JOBS[j].tags.includes('stage'));
    const n = Object.values(DUAL_TECHS).filter((t) => t.need.some((list) => !ANY_GROUPS.has(list) && groupJobs(list).has(j))).length;
    assert.ok(n >= 3, `${JOBS[j].name} の 合体技 ${n}こ`);
    // 職業の試練（一・二・三）
    assert.ok(trialJob(j));
    const adj = PHANTOM_ADJ[j];
    assert.ok(Array.isArray(adj) && adj.length === 3 && adj.every((v) => v >= 0.3 && v <= 4), `${j}: ${adj}`);
    assert.ok(phantomSkills(j).length >= 4, `${j}: まぼろしの 技`);
    textOk(TRIAL_WORDS[j], j);
    textOk(masterName(j), j);
    // 転職の ひとこと（男の子 むけは ない）
    const s = JOB_SAY[j];
    textOk(s, j);
    assert.ok(s.length <= 24 && s.startsWith('「') && s.endsWith('」'), s);
    assert.ok(jobDoneText('ナナ', JOBS[j].name, [], j).endsWith(s));
    assert.ok(!(j in JOB_SAY_MASC));
    for (const [, id] of JOBS[j].learn) assert.equal(abilityFor(id, { job: j, look: lookFor(j) }), ABILITIES[id], `${id}: そのまま`);
  }
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

test('第66回 B の 絵: 4つの 職業（男女・4方向・はみ出さない・もとの 職業と ちがう）・ぼうし・もちもの・古い え', () => {
  assert.deepEqual(R66B_JOBS, NEW);
  for (const j of NEW) assert.ok(R66B_OUTFIT[j] && R66B_BODY[j] && R66B_OLD_LOOK[j], j);
  for (const job of NEW) {
    for (const body of [0, 1]) {
      for (const dir of DIRS) {
        for (const res of [4, 8]) {
          const img = paintHero({ body, style: 'short', hcol: 'black' }, job, undefined, dir, 1, res);
          const r = inspect(img);
          assert.ok(r.n > img.w * img.h * 0.12, `${job} ${body} ${dir} ${res} が かけている`);
          assert.ok(!r.edge, `${job} ${body} ${dir} ${res} が ふちに さわる`);
        }
        for (const from of jobReqSets(job).flat()) {
          assert.notEqual(key(paintHero({ body, style: 'short' }, job, undefined, dir, 0, 4)), key(paintHero({ body, style: 'short' }, from, undefined, dir, 0, 4)), `${job} は ${from} と ちがう え`);
        }
      }
    }
    assert.equal(masc33(job, false), null, '男女 おなじ すがた');
  }
  const Lk = { cloth: '#3f7fd0', skin: 0 };
  // ニューカワイイ: パステルの 3だんの フリルの ドレス・ハートの ブローチ・ピンクの リボン・ハートの マイク
  const K = outfitOf(Lk, 'new_kawaii', 'cloth', true);
  assert.equal(K.kind, 'dress');
  assert.equal(K.skirt.kind, 'tiers');
  assert.ok(K.r66b?.heart);
  assert.equal(K.body.prop, 'mic66b');
  assert.equal(headOf(null, 'new_kawaii', 'cloth', K).kind, 'ribbon');
  // SMAP: 白い ステージ衣装・銀の ヘッドセット・銀の マイク
  const S = outfitOf(Lk, 'smap', 'cloth', false);
  assert.equal(S.kind, 'stage');
  assert.equal(headOf(null, 'smap', 'cloth', S).kind, 'headset');
  assert.equal(jobBody('smap').prop, 'mic66b');
  // 大御所: はかまと 羽織・せんす
  const O = outfitOf(Lk, 'oogosho', 'cloth', false);
  assert.equal(O.kind, 'hakama');
  assert.equal(O.body.prop, 'sensu');
  // 五つ星シェフ: 金の ボタンの コックの 上着・エプロンに 金の 星 5つ・金の 星の 高い コック帽・おたま
  const C = outfitOf(Lk, 'five_star_chef', 'cloth', false);
  assert.equal(C.kind, 'chef');
  assert.equal(C.r66b?.stars, 5);
  const ch = headOf(null, 'five_star_chef', 'cloth', C);
  assert.equal(ch.kind, 'toque');
  assert.ok(ch.stars > 0 && ch.h === 2);
  // よろいを かえても もちものは のこる（服の かざりは なくなる）
  const CA = outfitOf(Lk, 'five_star_chef', 'iron_armor', false);
  assert.equal(CA.body.prop, 'ladle66b');
  assert.ok(!CA.r66b);
  // 古い 小さな え
  for (const job of NEW) for (const body of [0, 1]) {
    const o = lookToOpts({ body }, job, ',cloth,,');
    assert.ok(o.outfit, job);
    assert.ok(paintHuman('down', 0, o), job);
  }
  void R66B_HAT;
});

// ───────────── えんしゅつ ─────────────
test('第66回 B の えんしゅつ: 看板の 技・技の えんしゅつは ぜんぶ ある・音・つなぎ・こわれない・文字', () => {
  const used = new Set();
  for (const id of [...Object.keys(R66B_ABILITIES), ...Object.keys(HIRA_R66B_ABILITIES)]) used.add(ABILITIES[id].anim);
  for (const anim of R66B_ANIMS) assert.ok(used.has(anim), `${anim} は どれかの 技で 使う`);
  assert.deepEqual(R66B_SIGS, NEW.map((j) => `${j}_sig`));
  assert.deepEqual(Object.keys(R66B_SFX).sort(), [...R66B_ANIMS].sort());
  const audio = readFileSync(new URL('../public/js/client/audio.js', import.meta.url), 'utf8');
  for (const [anim, s] of Object.entries(R66B_SFX)) assert.ok(audio.includes(`case '${s}':`) || typeof SFX_R26[s] === 'function' || typeof SFX_R33[s] === 'function', `${anim} の 音 ${s}`);
  for (const k of Object.keys(R66B_HIT)) assert.ok(R66B_ANIMS.has(k), k);
  for (const k of PARTY_ANIMS_R66B) assert.ok(R66B_ANIMS.has(k), k);
  for (const id of Object.keys(R66B_ABILITIES)) {
    const a = ABILITIES[id];
    if (R66B_ANIMS.has(a.anim) && ['self', 'allies'].includes(a.target)) assert.ok(PARTY_ANIMS_R66B.has(a.anim), `${id}: みかたの えんしゅつ`);
    if (R66B_ANIMS.has(a.anim) && ['enemy', 'enemies'].includes(a.target)) assert.ok(a.anim in R66B_HIT, `${id}: あたる じかん`);
  }
  for (const k of Object.keys(R66B_FINE)) assert.ok(k.startsWith('r66b') && !(k in JOB7_FINE) && !(k in JOB8_FINE), k);
  const battle = readFileSync(new URL('../public/js/client/battle.js', import.meta.url), 'utf8');
  assert.match(battle, /\.\.\.R66B_SFX/);
  assert.match(battle, /Object\.assign\(HIT_DELAY, R66B_HIT\)/);
  for (const a of PARTY_ANIMS_R66B) assert.ok(PARTY_ANIMS.has(a), `${a}: battle.js の みかたの えんしゅつ`);
  const src = readFileSync(new URL('../public/js/client/render/battlefx.js', import.meta.url), 'utf8');
  assert.match(src, /playR66bFx\(this, anim/);
  assert.match(src, /R66B_FINE/);
  // じっさいに 出して、つぶを かいても こわれない（canvas の かわり）
  const ctx = new Proxy({}, { get: (_, k) => (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}), set: () => true });
  for (const anim of R66B_ANIMS) {
    for (const targets of [[{ x: 128, y: 66 }], [{ x: 60, y: 70 }, { x: 128, y: 82 }, { x: 196, y: 70 }], [{ x: BW / 2, y: BH - 22 }]]) {
      const fx = new Effects();
      assert.equal(playR66bFx(fx, anim, targets, null, {}, BW, BH), true, anim);
      fx.play(anim, targets, null, {});
      assert.ok(fx.parts.length > 0, anim);
      for (const p of fx.parts) {
        if (!R66B_FINE[p.kind]) continue;
        for (const age of [0, 200, 600, 1200]) R66B_FINE[p.kind](ctx, { ...p, age }, Math.min(1, age / (p.life || 600)));
      }
    }
  }
  assert.equal(playR66bFx(new Effects(), 'fire1', [{ x: 1, y: 1 }]), false);
  assert.ok(!/text: '/.test(readFileSync(new URL('../public/js/client/render/battlefx-r66b.js', import.meta.url), 'utf8')), '文字は 出さない');
});
