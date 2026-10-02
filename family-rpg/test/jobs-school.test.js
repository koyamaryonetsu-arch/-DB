// 学校・公務員・町の みかた・アイドルの 職業（小学生〜高校生／地方公務員〜キャリア組／警察官・消防士／フルーツジッパー・アラシ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, JOB_MAX_LEVEL, JOB_HINTS, jobBattlesForLevel, jobBodyOk, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { HIRAMEKI } from '../public/js/shared/data/hirameki.js';
import { DUAL_TECHS, dualOptions } from '../public/js/shared/data/dual.js';
import {
  newCharacter, changeJob, jobUnlocked, jobKnown, gainJobBattles, jobProgress, learnedAbilities, hiraAllowed, canEquip, fixBodyJob,
  gainExp, expForLevel, fullHeal, weaponOk, STARTER_EQUIP,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { checkText } from '../tools/kanji-check.mjs';
import { Bot } from './helpers.js';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };
const NEW_JOBS = ['schoolkid', 'middleschooler', 'highschooler', 'civil_local', 'civil_national', 'career', 'police', 'firefighter', 'fruit_idol', 'storm_idol'];
const OLD_JOBS = Object.keys(JOBS).filter((j) => !NEW_JOBS.includes(j));

function person(body, job = 'warrior') {
  return newCharacter({ id: `p${body}`, name: body ? 'ユイ' : 'ソラ', job, look: { body } });
}

// その 職業を マスターした つよい キャラと、なにも しない 敵との たたかい
function setup(job, enemies, { body = JOBS[job].body ?? 0, weapon = null, seed = 1, lucky = false } = {}) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior', look: { body } });
  gainExp(c, expForLevel(30));
  master(c, job);
  c.job = job;
  c.equip.weapon = weapon;
  fullHeal(c);
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(20));
  fullHeal(mate);
  const rng = makeRng(seed);
  if (lucky) rng.chance = () => true;
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: true });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return { b, c };
}
function act(b, cmd) {
  const a = b.allies[0];
  for (let i = 0; i < 600 && !a.ready; i++) b.tick(50);
  const r = b.command(a.id, cmd, 's1');
  assert.equal(r.ok, true, r.reason);
  const evs = [];
  for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === a.id); i++) evs.push(...b.tick(50));
  const ev = evs.find((e) => e.t === 'act' && e.id === a.id);
  assert.ok(ev, 'わざが じっこう された');
  return ev;
}

test('新しい 職業: じょうけんと 順番（小学生→中学生→高校生、地方公務員→国家公務員→キャリア組）', () => {
  assert.ok(JOB_ORDER.includes('schoolkid') && JOB_ORDER.includes('civil_local'), '基本職');
  for (const j of ['middleschooler', 'civil_national', 'police', 'firefighter']) assert.ok(ADVANCED_ORDER.includes(j), j);
  for (const j of ['highschooler', 'career', 'fruit_idol', 'storm_idol']) assert.ok(SUPER_ORDER.includes(j), j);
  assert.deepEqual(JOBS.middleschooler.req, ['schoolkid']);
  assert.deepEqual(JOBS.highschooler.req, ['middleschooler']);
  assert.deepEqual(JOBS.civil_national.req, ['civil_local']);
  assert.deepEqual(JOBS.career.req, ['civil_national']);
  assert.deepEqual(JOBS.police.req, ['civil_local', 'warrior']);
  assert.deepEqual(JOBS.firefighter.req, ['civil_local', 'priest']);
  assert.deepEqual(JOBS.fruit_idol.req, ['superstar']);
  assert.deepEqual(JOBS.storm_idol.req, ['superstar']);
  for (const [j, t] of Object.entries({ schoolkid: 0, middleschooler: 1, highschooler: 2, civil_local: 0, civil_national: 1, career: 2, police: 1, firefighter: 1, fruit_idol: 2, storm_idol: 2 })) {
    assert.equal(JOBS[j].tier || 0, t, j);
  }
  // 最初から えらべる（キャラを 作る ときも）
  const kid = newCharacter({ id: 'k', name: 'キッズ', job: 'schoolkid' });
  assert.equal(kid.job, 'schoolkid');
  assert.equal(kid.equip.weapon, STARTER_EQUIP.schoolkid.weapon);
  assert.ok(canEquip('schoolkid', kid.equip.weapon), 'はじめの 武器を そうびできる');
  const clerk = newCharacter({ id: 'c', name: 'ヤクバ', job: 'civil_local' });
  assert.equal(clerk.job, 'civil_local');
  assert.ok(canEquip('civil_local', clerk.equip.weapon));

  // 順番に マスターして すすむ
  const c = person(0, 'schoolkid');
  assert.equal(jobUnlocked(c, 'middleschooler'), false);
  assert.equal(jobKnown(c, 'highschooler'), false, '高校生は はじめは ひみつ');
  c.jobs.schoolkid = { lv: 9, b: jobBattlesForLevel(10, 0) - 1 };
  const ups = gainJobBattles(c, 1);
  assert.deepEqual(ups[0].unlocked, ['middleschooler'], '小学生を マスターすると 中学生');
  assert.equal(changeJob(c, 'highschooler').locked, true, 'まだ 高校生には なれない');
  assert.equal(changeJob(c, 'middleschooler').ok, true);
  c.jobs.middleschooler = { lv: 9, b: jobBattlesForLevel(10, 1) - 1 };
  const up2 = gainJobBattles(c, 1);
  assert.ok(up2[0].unlocked.includes('highschooler'), '中学生を マスターすると 高校生');
  assert.equal(jobKnown(c, 'highschooler'), true);
  assert.equal(changeJob(c, 'highschooler').ok, true);

  const g = person(1, 'civil_local');
  assert.equal(jobUnlocked(g, 'civil_national'), false);
  master(g, 'civil_local');
  assert.equal(jobUnlocked(g, 'civil_national'), true);
  assert.equal(jobUnlocked(g, 'police'), false, '警察官は 戦士も いる');
  assert.equal(jobUnlocked(g, 'career'), false);
  master(g, 'warrior');
  assert.equal(jobUnlocked(g, 'police'), true);
  assert.equal(jobUnlocked(g, 'firefighter'), false, '消防士は 僧侶も いる');
  master(g, 'priest');
  assert.equal(jobUnlocked(g, 'firefighter'), true);
  master(g, 'civil_national');
  assert.equal(jobUnlocked(g, 'career'), true);
  assert.equal(jobReqText('career'), '国家公務員Lv10');
});

test('のびざかり: 学校の 職業は 勝った たたかい 1回が 1.25回ぶん（はやく マスターできる）', () => {
  const c = person(0, 'schoolkid');
  gainJobBattles(c, 1);
  assert.equal(c.jobs.schoolkid.b, 1.25);
  gainJobBattles(c, 3); // ボスは 3回ぶん
  assert.equal(c.jobs.schoolkid.b, 5);
  assert.equal(c.jobs.schoolkid.lv, 2);
  const pg = jobProgress(c, 'schoolkid');
  assert.equal(pg.next, Math.ceil((jobBattlesForLevel(3, 0) - 5) / 1.25), `あと ${pg.next}回`);
  // マスターまで 何回 勝てば よいか
  const wins = (job) => {
    const x = person(0, 'warrior');
    x.job = job;
    x.jobs = { [job]: { lv: 1, b: 0 } };
    let n = 0;
    while (x.jobs[job].lv < JOB_MAX_LEVEL && n < 9999) { gainJobBattles(x, 1); n++; }
    return n;
  };
  assert.equal(wins('warrior'), jobBattlesForLevel(10, 0));
  assert.equal(wins('schoolkid'), Math.ceil(jobBattlesForLevel(10, 0) / 1.25));
  assert.equal(wins('highschooler'), Math.ceil(jobBattlesForLevel(10, 2) / 1.25));
  assert.equal(wins('civil_local'), jobBattlesForLevel(10, 0), '公務員は ふつう');
  // とちゅうの 数でも 前の 職業に もどれば ふつうに すすむ
  const y = person(0, 'schoolkid');
  gainJobBattles(y, 1);
  changeJob(y, 'warrior');
  gainJobBattles(y, 1);
  assert.equal(y.jobs.warrior.b, 1);
});

test('体で なれる 職業: フルーツジッパーは 女性だけ、アラシは 男性だけ（体が ない 人は 男性）', () => {
  assert.equal(JOBS.fruit_idol.body, 1);
  assert.equal(JOBS.storm_idol.body, 0);
  assert.equal(jobBodyOk('fruit_idol', { body: 1 }), true);
  assert.equal(jobBodyOk('fruit_idol', { body: 0 }), false);
  assert.equal(jobBodyOk('storm_idol', { body: 0 }), true);
  assert.equal(jobBodyOk('storm_idol', { body: 1 }), false);
  assert.equal(jobBodyOk('storm_idol', undefined), true, 'look が ない 人は 男性 あつかい');
  assert.equal(jobBodyOk('fruit_idol', {}), false);
  assert.equal(jobBodyOk('fruit_idol', null), false);
  assert.equal(jobBodyOk('superstar', { body: 1 }), true, 'ほかの 職業は だれでも');

  for (const body of [0, 1]) {
    const mine = body ? 'fruit_idol' : 'storm_idol';
    const other = body ? 'storm_idol' : 'fruit_idol';
    const c = person(body, 'idol');
    assert.equal(jobKnown(c, mine), false, 'はじめは ひみつ');
    assert.equal(jobKnown(c, other), false);
    // アイドルを マスター → スーパースター → マスター
    c.jobs.idol = { lv: JOB_MAX_LEVEL, b: 999 };
    changeJob(c, 'superstar');
    c.jobs.superstar = { lv: 9, b: jobBattlesForLevel(10, 1) - 1 };
    const ups = gainJobBattles(c, 1);
    assert.ok(ups[0].unlocked.includes(mine), `${mine} に なれる`);
    assert.ok(!ups[0].unlocked.includes(other), `${other} には なれない`);
    assert.ok(!ups[0].hinted.includes(other), `${other} の ヒントも 出ない`);
    assert.equal(jobKnown(c, mine), true);
    assert.equal(jobKnown(c, other), false, '神殿にも 出ない');
    assert.equal(jobUnlocked(c, other), false);
    const no = changeJob(c, other);
    assert.equal(no.ok, false);
    assert.equal(no.body, 1 - body);
    assert.equal(c.job, 'superstar');
    assert.equal(changeJob(c, mine).ok, true);
  }
});

test('体で なれる 職業: サーバーでも ことわる（自分・酒場の 仲間）', async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(3), rateLimit: false });
  const svc = (bot, msg) => {
    bot.send({ t: 'svc', kind: 'jobChange', ...msg });
    return bot.msgs.filter((m) => m.t === 'svcRes').pop();
  };
  // 男性
  const boy = new Bot(world, 'ソラ');
  await boy.login();
  await boy.createAndPlay('idol');
  await boy.settle();
  const bc = world.data.characters[boy.char.id];
  assert.equal(bc.look.body, 0);
  master(bc, 'idol', 'superstar');
  let r = svc(boy, { job: 'fruit_idol' });
  assert.equal(r.ok, false);
  assert.ok(r.text.includes('女性しかなれない'), r.text);
  assert.notEqual(bc.job, 'fruit_idol');
  r = svc(boy, { job: 'storm_idol' });
  assert.equal(r.ok, true, r.text);
  assert.equal(bc.job, 'storm_idol');
  // 女性
  const girl = new Bot(world, 'ユイ');
  await girl.login();
  girl.send({ t: 'createChar', name: 'ユイ', job: 'idol', look: { body: 1, hair: 1 } });
  girl.send({ t: 'play', id: girl.msgs.filter((m) => m.t === 'charCreated').pop().id });
  await girl.settle();
  const gc = world.data.characters[girl.char.id];
  assert.equal(gc.look.body, 1);
  master(gc, 'idol', 'superstar');
  r = svc(girl, { job: 'storm_idol' });
  assert.equal(r.ok, false);
  assert.ok(r.text.includes('男性しかなれない'), r.text);
  r = svc(girl, { job: 'fruit_idol' });
  assert.equal(r.ok, true, r.text);
  assert.equal(gc.job, 'fruit_idol');
  // 酒場の 仲間（ミーナは 女性）
  boy.send({ t: 'svc', kind: 'tavern', action: 'recruit', key: 'npc_mina' });
  const mina = bc.companions.find((e) => e.key === 'npc_mina');
  assert.ok(mina, 'ミーナが 仲間に なった');
  master(mina.char, 'idol', 'superstar');
  r = svc(boy, { job: 'storm_idol', who: 'npc_mina' });
  assert.equal(r.ok, false, 'ミーナは アラシに なれない');
  assert.ok(r.text.includes('男性しかなれない'));
  r = svc(boy, { job: 'fruit_idol', who: 'npc_mina' });
  assert.equal(r.ok, true, r.text);
  assert.equal(mina.char.job, 'fruit_idol');
});

test('体で なれない 職業に なっていたら、読みこみの ときに もとの 職業に もどす', () => {
  const c = person(1, 'idol');
  master(c, 'idol', 'superstar');
  c.job = 'storm_idol';
  c.jobs.storm_idol = { lv: 3, b: 10 };
  c.equip.weapon = 'penlight'; // スーパースターは つえを そうびできない
  assert.equal(fixBodyJob(c), true);
  assert.equal(c.job, 'superstar');
  assert.equal(c.equip.weapon, null);
  assert.ok(c.items.some((e) => e.id === 'penlight'), 'ふくろへ');
  assert.equal(c.jobs.storm_idol.lv, 3, '職業レベルは のこる');
  assert.equal(fixBodyJob(c), false, '2かい めは なにも しない');
  // ワールドの 読みこみ
  const d = person(0, 'idol');
  d.id = 'fam9';
  master(d, 'idol', 'superstar');
  d.job = 'fruit_idol';
  d.jobs.fruit_idol = { lv: 1, b: 0 };
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, data: { characters: { fam9: d } } });
  assert.equal(world.data.characters.fam9.job, 'superstar');
  // ふつうの キャラは そのまま
  const e = person(1, 'idol');
  master(e, 'idol', 'superstar');
  changeJob(e, 'fruit_idol');
  assert.equal(fixBodyJob(e), false);
  assert.equal(e.job, 'fruit_idol');
});

test('覚える技: 数・レベル・強さが ほかの 同じ ランクの 職業と そろっている', () => {
  const tierOf = (j) => JOBS[j].tier || 0;
  const sum = (j) => Object.values(JOBS[j].mods).reduce((a, b) => a + b, 0);
  for (const j of NEW_JOBS) {
    const job = JOBS[j];
    const t = tierOf(j);
    const lvs = job.learn.map(([l]) => l);
    if (t === 0) assert.deepEqual(lvs, [1, 2, 3, 4, 5, 6, 7, 8, 10], `${j}: 基本職は 9こ`);
    else assert.deepEqual(lvs, [1, 3, 5, 7, 10], `${j}: 上級職・超級職は 5こ`);
    const mps = job.learn.map(([, id]) => ABILITIES[id].mp);
    assert.equal(Math.max(...mps), mps[mps.length - 1], `${j}: Lv10 の 技が いちばん 大きい`);
    for (const [, id] of job.learn) {
      const a = ABILITIES[id];
      assert.ok(a, `${j}: ${id}`);
      assert.equal(a.job, j, `${id} の job`);
      assert.ok(['skill', 'spell'].includes(a.kind), id);
      assert.ok(Number.isFinite(a.mp) && a.mp >= 0, `${id} mp`);
      assert.ok(a.desc && a.cast && a.anim && a.kana, `${id} の 文`);
    }
    // つよさの 倍率の 合計が、同じ ランクの 前からの 職業の はんいに 入る
    const same = OLD_JOBS.filter((o) => tierOf(o) === t).map(sum);
    assert.ok(sum(j) >= Math.min(...same) - 1e-9 && sum(j) <= Math.max(...same) + 1e-9, `${j}: 倍率の 合計 ${sum(j).toFixed(2)}`);
    // 武器と よろい（ブーメランは 戦いの 方で ふえる 種類）
    assert.ok(job.weapons.length >= 2 && job.armor.includes('cloth'), j);
  }
  // 超級職の 大技は 超級職の 強さ（ほかの 超級職の Lv10 と おなじ くらいの MP）
  const superMp = SUPER_ORDER.filter((j) => !NEW_JOBS.includes(j)).map((j) => ABILITIES[JOBS[j].learn[JOBS[j].learn.length - 1][1]].mp);
  for (const j of ['highschooler', 'career', 'fruit_idol', 'storm_idol']) {
    const mp = ABILITIES[JOBS[j].learn[4][1]].mp;
    assert.ok(mp >= Math.min(...superMp) && mp <= Math.max(...superMp), `${j} Lv10 MP ${mp}`);
  }
  // フルーツジッパーと アラシは おなじ くらいの 強さ（どちらの 子も くらべっこで こまらない）
  const total = (j) => JOBS[j].learn.reduce((s, [, id]) => s + ABILITIES[id].mp, 0);
  assert.ok(Math.abs(total('fruit_idol') - total('storm_idol')) <= 6);
  assert.ok(Math.abs(sum('fruit_idol') - sum('storm_idol')) <= 0.2);
  // 神殿の うわさ: 超級職 ぜんぶに ある
  for (const j of SUPER_ORDER) assert.ok(JOB_HINTS[j], `${j} の うわさ`);
});

test('技の ねらいと 文字: ねらいの しゅるいが はっきりしていて、使ってよい 漢字だけ', () => {
  const SCOPE = {
    enemy: /敵1体/, group: /同じ種類の敵/, enemies: /敵全体|敵に(ランダム|3回)/, ally: /仲間1人/, allies: /仲間全員/, self: /自分|仲間全員への|起こる|運しだい/, deadAlly: /仲間1人/,
  };
  const ids = [...new Set(NEW_JOBS.flatMap((j) => JOBS[j].learn.map(([, id]) => id)))];
  ids.push('hk_randoseru_rocket', 'hk_radio_taiso', 'hk_yukigassen', 'hk_kairanban');
  for (const id of ids) {
    const a = ABILITIES[id];
    assert.ok(SCOPE[a.target], `${id}: ねらい ${a.target}`);
    assert.match(a.desc, SCOPE[a.target], `${id}（${a.target}）の せつめい: ${a.desc}`);
    for (const s of [a.name, a.desc, a.cast]) assert.deepEqual(checkText(s), [], `${id}: ${s}`);
    assert.deepEqual(checkText(a.kana).filter((p) => p.kind !== 'kana'), [], `${id} kana`);
  }
  // じゃんけん・将来の夢の 中身（おぼえない 技）
  for (const id of [...ABILITIES.es_janken.effect.options, ...ABILITIES.es_yume.effect.options]) {
    assert.ok(ABILITIES[id]?.hidden, id);
    assert.ok(!ABILITIES[id].cast.includes('{t}'), `${id}: ランダムの 技は {t} を 使わない`);
    assert.deepEqual(checkText(ABILITIES[id].cast), []);
  }
  for (const j of NEW_JOBS) {
    for (const s of [JOBS[j].name, JOBS[j].desc, JOB_HINTS[j] || '']) assert.deepEqual(checkText(s), [], `${j}: ${s}`);
  }
  assert.deepEqual(checkText(DUAL_TECHS.dt_jugyo_sankan.desc), []);
});

test('ひらめきと 合体技: 小学生・地方公務員の ひらめき技、子どもと 大人の「授業参観」', () => {
  for (const id of ['hk_randoseru_rocket', 'hk_radio_taiso', 'hk_yukigassen', 'hk_kairanban']) {
    assert.ok(HIRAMEKI[id] && ABILITIES[id].hirameki, id);
    for (const k of Object.keys(HIRAMEKI[id].from)) assert.ok(ABILITIES[k], `${id} の ${k}`);
  }
  const c = person(0, 'schoolkid');
  assert.equal(hiraAllowed(c, 'hk_randoseru_rocket'), true, '小学生は ランドセルロケット');
  assert.equal(hiraAllowed(c, 'hk_yukigassen'), false);
  master(c, 'schoolkid');
  changeJob(c, 'middleschooler');
  assert.equal(hiraAllowed(c, 'hk_randoseru_rocket'), true, '中学生でも ひらめく');
  // 授業参観: 学校の 技 ＋ お仕事の 技
  const kid = { id: 'a', name: 'キッズ', alive: true, abilities: ['es_randoseru'], mp: 20, ready: true, statuses: [], weaponCat: 'sword' };
  const papa = { id: 'b', name: 'パパ', alive: true, abilities: ['sm_meishi'], mp: 20, ready: true, statuses: [], weaponCat: 'dagger' };
  const clerk = { ...papa, id: 'c', abilities: ['lc_madoguchi'] };
  const stranger = { ...papa, id: 'd', abilities: ['daichi'] };
  const ids = (opts) => opts.map((o) => o.id);
  assert.ok(ids(dualOptions(kid, [papa], weaponOk)).includes('dt_jugyo_sankan'));
  assert.ok(ids(dualOptions(papa, [kid], weaponOk)).includes('dt_jugyo_sankan'), 'どちらから でも');
  assert.ok(ids(dualOptions(kid, [clerk], weaponOk)).includes('dt_jugyo_sankan'), '公務員の 技でも');
  assert.ok(!ids(dualOptions(kid, [stranger], weaponOk)).includes('dt_jugyo_sankan'));
  // 新しい 技も 前からの 合体技に まざる（リコーダー＋おどり → ステージショー）
  const flute = { ...kid, abilities: ['es_recorder'] };
  const dancer = { ...papa, abilities: ['hustle'] };
  assert.ok(ids(dualOptions(flute, [dancer], weaponOk)).includes('dt_stage'));
});

test('たたかい: 新しい 技の 効き目（窓口対応・予算会議・じゃんけん・放水・バナナのかわ・救助）', () => {
  // 窓口対応: 敵の ゲージが 0に
  let { b } = setup('civil_local', ['rockman']);
  b.enemies[0].atb = 90;
  let ev = act(b, { type: 'ability', id: 'lc_madoguchi', target: b.enemies[0].id });
  assert.ok(ev.lines.some((l) => l.includes('番号札')), ev.lines.join(' / '));
  assert.ok(b.enemies[0].atb < 20);
  // 予算会議: 仲間全員の MP
  ({ b } = setup('civil_national', ['rockman']));
  for (const a of b.allies) a.mp = 0;
  ev = act(b, { type: 'ability', id: 'nc_yosan' });
  for (const a of b.allies) assert.ok(a.mp >= 6, `${a.name} MP ${a.mp}`);
  // じゃんけん: グー・チョキ・パーの どれか
  const seen = new Set();
  for (let seed = 1; seed < 40 && seen.size < 3; seed++) {
    ({ b } = setup('schoolkid', ['rockman', 'rockman'], { seed, weapon: 'wood_sword' }));
    ev = act(b, { type: 'ability', id: 'es_janken' });
    seen.add(ev.sub);
  }
  assert.deepEqual([...seen].sort(), ['グー', 'チョキ', 'パー'].sort());
  // 放水: 炎の 敵（炎に 強い ランプの精）に よく 効く（vsElement）
  ({ b } = setup('firefighter', ['lamp'], { lucky: true }));
  const lamp = b.enemies[0];
  assert.ok((lamp.resist.fire ?? 1) < 1, 'ランプの精は 炎に 強い');
  const eff = ABILITIES.ff_housui.effect;
  const withV = b.calcPhys(b.allies[0], lamp, eff, 1, 'ice', true).dmg;
  const plain = b.calcPhys(b.allies[0], lamp, { ...eff, vsElement: undefined }, 1, 'ice', true).dmg;
  assert.ok(withV >= plain * 1.4, `炎の 敵に ${withV} / ふつう ${plain}`);
  lamp.hp = lamp.maxHp = 99999;
  act(b, { type: 'ability', id: 'ff_housui', target: lamp.id });
  assert.ok(lamp.hp < 99999, '水びたし');
  // バナナのかわ: 敵全体の ゲージが 0
  ({ b } = setup('fruit_idol', ['rockman', 'skeleton']));
  for (const e of b.enemies) e.atb = 95;
  ev = act(b, { type: 'ability', id: 'fz_banana' });
  assert.ok(ev.lines.some((l) => l.includes('すってんころりん')));
  for (const e of b.enemies) assert.ok(e.atb < 20);
  // 救助: 死んだ 仲間を 生き返らせる
  ({ b } = setup('firefighter', ['rockman']));
  const mate = b.allies[1];
  mate.alive = false;
  mate.hp = 0;
  ev = act(b, { type: 'ability', id: 'ff_kyujo', target: mate.id });
  assert.equal(mate.alive, true);
  assert.ok(mate.hp >= Math.floor(mate.maxHp * 0.3));
  // 防災訓練: ブレスの ダメージが 半分（buffs.breath）
  ({ b } = setup('civil_local', ['rockman']));
  act(b, { type: 'ability', id: 'lc_bousai' });
  assert.ok(b.allies.every((a) => a.buffs.breath && a.buffs.def), 'ブレスと 守備力');
  // 覚えた 技に 入る
  const c = person(1, 'schoolkid');
  c.jobs.schoolkid.lv = 3;
  assert.deepEqual(learnedAbilities(c).filter((id) => id.startsWith('es_')).sort(), ['es_aisatsu', 'es_randoseru', 'es_recorder'].sort());
});
