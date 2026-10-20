// 第38回 B: 超級職からの 職業レベルの 上限と 職業の試練（docs/plan-r38.md の B）
// 上限（Lv10 → 一の試練 15 → 二の試練 20）・Lv11〜 の 強さ（得意な 数値が +1〜2）・しょうごう・試練の番人・修行（技を 使って 勝つ）・
// 師しょうのまぼろし（勝ち・負け・家族も いっしょ）・メニューの とちゅうの 数・古い セーブ・データの 合わせ方
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { SCRIPTS, STORY_SCRIPTS } from '../public/js/shared/data/story.js';
import { FIXED_ENCOUNTERS } from '../public/js/shared/data/encounters.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  JOBS, ALL_JOBS, SUPER_ORDER, LEGEND_ORDER, JOB_ORDER, ADVANCED_ORDER, JOB_MAX_LEVEL, JOB_TOP_LEVEL, jobBattlesForLevel,
} from '../public/js/shared/data/jobs.js';
import {
  TRIALS, trialJob, jobLevelCap, jobCapOf, jobTopCap, jobUpKeys, jobUpStats, titleFor, jobTitle, trialName, trialState,
  acceptTrial, addTrialUses, clearTrial, trialSkills, trialUseCount, repairTrialInfo, mergeTrialInfo, TRIAL_WORDS, trialWords, PHANTOM_NAME,
} from '../public/js/shared/data/job-trials.js';
import { setupTrialPhantom, phantomSkills } from '../public/js/shared/battle-trial.js';
import { mirrorSkillOk } from '../public/js/shared/battle-temple.js';
import {
  newCharacter, computeStats, gainJobBattles, gainExp, expForLevel, jobProgress, jobMastered, jobUnlocked, learnedAbilities, penaltyFor,
  jobPower, masteredJobs, fullHeal,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { repairChar, upgradeSave } from '../public/js/shared/world/save.js';
import { mergeChars } from '../public/js/shared/world/merge.js';
import { startFixedBattle } from '../public/js/shared/world/battles.js';
import { growthSummary } from '../public/js/shared/world/growth.js';
import { jobLevelText, trialRows } from '../public/js/client/ui/job-trials.js';
import { gameFiles, checkFile } from '../tools/kanji-check.mjs';
import { Bot, tickN } from './helpers.js';

const src = (p) => fs.readFileSync(new URL(`../public/${p}`, import.meta.url), 'utf8');
const said = (bot, text, from = 0) => bot.msgs.slice(from).some((m) => m.t === 'script' && JSON.stringify(m.steps).includes(text));
const allText = (bot, from = 0) => JSON.stringify(bot.msgs.slice(from));
const KEEPER = { x: PLACES.town.x + 27, y: PLACES.town.y + 7 };

function heroChar(lv = 10, extra = {}) {
  const c = newCharacter({ id: 'h1', name: 'ソラ', job: 'warrior', look: { body: 0 } });
  c.job = 'hero';
  c.jobs.hero = { lv, b: jobBattlesForLevel(lv, 2), ...extra };
  return c;
}

// 選ぶ じゅんばん（だいほんの choice ごとに 1つ ずつ。なくなったら 0）
function choices(bot, list) {
  const q = [...list];
  Object.defineProperty(bot, 'choice', { configurable: true, get: () => (q.length ? q.shift() : 0), set: () => {} });
}

// 戦いを すすめる（how(ctx) が 'lose' なら 負け・ほかは 勝ち。before(ctx) … 勝つ 前に する こと）。fought … 戦った 記録
async function play(bot, { how = () => 'win', before = () => {}, others = [], max = 20000 } = {}) {
  const world = bot.world;
  const fought = [];
  for (let i = 0; i < max; i++) {
    for (const c2 of world.battles.values()) {
      if (c2.battle.over || c2.battle.pendingEnd || c2.done) continue;
      c2.done = true;
      const b = c2.battle;
      fought.push({ id: c2.opts.fixed, sids: c2.sids.slice(), enemies: b.enemies.map((e) => ({ ...e })), b });
      before(c2);
      if (how(c2) === 'lose') {
        for (const a of b.allies) if (a.alive) b.kill(a);
      } else {
        for (const e of b.enemies) if (e.alive) b.kill(e);
      }
      b.checkEnd();
    }
    for (const x of [bot, ...others]) x.flushQueue();
    await tickN(world, 1);
    for (const x of [bot, ...others]) x.flushQueue();
    const idle = (x) => !x.s.busy && !x.queue.length && !x.inBattle;
    if ([bot, ...others].every(idle) && !world.battles.size) {
      await tickN(world, 2);
      for (const x of [bot, ...others]) x.flushQueue();
      if ([bot, ...others].every(idle) && !world.battles.size) return fought;
    }
  }
  throw new Error('終わらない');
}
const talk = (bot, opts) => { bot.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' }); return play(bot, opts); };

async function setup(seed = 1, { name = 'ソラ', world = null, job = 'hero', lv = 10 } = {}) {
  const w = world || new GameWorld({ offline: true, rng: makeRng(seed), rateLimit: false });
  const bot = new Bot(w, name);
  await bot.login(world ? 'x' : '');
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = w.data.characters[bot.char.id];
  gainExp(c, expForLevel(50) - c.exp);
  c.job = job;
  c.jobs[job] = { lv, b: jobBattlesForLevel(lv, JOBS[job].tier) };
  fullHeal(c);
  c.gold = 5000;
  bot.s.repelUntil = 1e15;
  w.placeSession(bot.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 1.5, 'up', true);
  w.sendSelf(bot.s);
  await bot.settle();
  return { world: w, bot, c };
}

// ───────────── 上限 ─────────────
test('上限: 基本職・上級職は Lv10 のまま。超級職・伝説の職業は 一の試練で 15・二の試練で 20', () => {
  assert.equal(JOB_MAX_LEVEL, 10, 'マスターは Lv10 のまま');
  assert.equal(JOB_TOP_LEVEL, 20);
  assert.deepEqual(TRIALS.map((T) => [T.needLv, T.cap, T.uses, T.lv]), [[10, 15, 30, 50], [15, 20, 60, 58]]);
  for (const j of [...JOB_ORDER, ...ADVANCED_ORDER]) {
    assert.equal(trialJob(j), false, j);
    assert.equal(jobCapOf(j, { lv: 10, tr: 2 }), 10, `${j}: 試練は ない`);
    assert.equal(jobTopCap(j), 10);
  }
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) {
    assert.equal(trialJob(j), true, j);
    assert.deepEqual([0, 1, 2, 3].map((tr) => jobCapOf(j, { tr })), [10, 15, 20, 20], j);
    assert.equal(jobTopCap(j), 20);
  }
});

test('上限: 必要な 戦いの 数は Lv10 までの つづき（少しずつ ふえる）。Lv10 までは 前と おなじ', () => {
  assert.equal(jobBattlesForLevel(10, 2), Math.round(98 * 1.8 * 1.4));
  const steps = [];
  for (let lv = 2; lv <= 20; lv++) steps.push(jobBattlesForLevel(lv, 0) - jobBattlesForLevel(lv - 1, 0));
  for (let i = 1; i < steps.length; i++) assert.ok(steps[i] >= steps[i - 1], `Lv${i + 2} の ふえかた ${steps.join(',')}`);
  assert.equal(jobBattlesForLevel(11, 0), Math.round(122 * 1.4));
  assert.equal(jobBattlesForLevel(20, 0), Math.round(428 * 1.4));
  assert.equal(jobBattlesForLevel(25, 2), jobBattlesForLevel(20, 2), 'Lv20 で 止まる');
  // 超級職の Lv11 は Lv10 から 60回くらい（Lv9→10 の 55回の つづき）
  const d = jobBattlesForLevel(11, 2) - jobBattlesForLevel(10, 2);
  assert.ok(d > 55 && d < 70, `${d}`);
});

test('上限: 試練を こえないと Lv10 で 止まる・こえると つづきから 15 → 20 まで（1撃の 戦いは 半分のまま）', () => {
  const c = heroChar(10);
  assert.equal(jobLevelCap(c), 10);
  assert.deepEqual(gainJobBattles(c, 500), [], 'Lv10 で 止まる');
  assert.equal(c.jobs.hero.lv, 10);
  assert.equal(c.jobs.hero.b, jobBattlesForLevel(10, 2), '止まって いる 間は 修行は たまらない');
  assert.equal(jobProgress(c, 'hero').done, true);
  assert.equal(jobProgress(c, 'hero').master, true);
  c.jobs.hero.tr = 1;
  assert.equal(jobLevelCap(c), 15);
  const pg = jobProgress(c, 'hero');
  assert.equal(pg.done, false);
  assert.equal(pg.cap, 15);
  assert.equal(pg.next, jobBattlesForLevel(11, 2) - jobBattlesForLevel(10, 2));
  const ups = gainJobBattles(c, 9999);
  assert.deepEqual(ups.map((u) => u.lv), [11, 12, 13, 14, 15]);
  for (const u of ups) assert.deepEqual(u.learned, [], `Lv${u.lv}: 新しい 技は ない`);
  assert.equal(jobProgress(c, 'hero').done, true);
  c.jobs.hero.tr = 2;
  assert.deepEqual(gainJobBattles(c, 99999).map((u) => u.lv), [16, 17, 18, 19, 20]);
  assert.deepEqual(gainJobBattles(c, 99999), [], 'Lv20 で 止まる');
  // 基本職は tr が あっても Lv10 まで
  const w = newCharacter({ id: 'w', name: 'w', job: 'warrior', look: {} });
  w.jobs.warrior = { lv: 10, b: 999999, tr: 2 };
  assert.deepEqual(gainJobBattles(w, 9999), []);
});

test('マスター: Lv10 より 上でも「マスター」の あつかい（なる じょうけん・軽い ペナルティ・ひらめき・家族に おくる 職業）', () => {
  const c = heroChar(15, { tr: 1 });
  for (const r of JOBS.hero.req) c.jobs[r] = { lv: 10, b: 999 };
  assert.ok(jobMastered(c, 'hero'));
  assert.ok(masteredJobs(c).includes('hero'));
  // ロトの勇者（勇者＋ほかの超級職2つ）: Lv15・Lv20 の 超級職も マスターに 数える
  c.jobs.god_hand = { lv: 20, b: 9999, tr: 2 };
  c.jobs.daikenja = { lv: 15, b: 9999, tr: 1 };
  assert.ok(jobUnlocked(c, 'loto_hero'));
  // 今の 職業で ない 勇者の 技: マスターなので ペナルティが 軽い
  c.job = 'warrior';
  c.jobs.warrior = { lv: 1, b: 0 };
  assert.match(penaltyFor(c, 'hr_gigadein').label, /マスターしたので軽め/);
});

// ───────────── Lv11〜 の 強さ ─────────────
test('強さ: Lv11〜 は その 職業の 得意な 数値 2つが 1レベル +1〜2 だけ（Lv15 で +8・Lv20 で +15）。ほかは かわらない', () => {
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) {
    const keys = jobUpKeys(j);
    assert.equal(keys.length, 2, j);
    const mods = JOBS[j].mods;
    for (const k of keys) for (const o of ['str', 'def', 'agi', 'mag', 'heal']) if (!keys.includes(o)) assert.ok(mods[k] >= mods[o], `${j}: ${k} は 得意`);
    assert.deepEqual(jobUpStats(j, 10), {});
    let prev = 0;
    for (let lv = 11; lv <= 20; lv++) {
      const sum = Object.values(jobUpStats(j, lv)).reduce((a, x) => a + x, 0);
      assert.ok(sum - prev >= 1 && sum - prev <= 2, `${j} Lv${lv}: +${sum - prev}`);
      prev = sum;
    }
    assert.equal(Object.values(jobUpStats(j, 15)).reduce((a, x) => a + x, 0), 8);
    assert.equal(prev, 15, `${j}: Lv20 で 合計 +15`);
  }
  assert.deepEqual(jobUpKeys('hero'), ['str', 'def']);
  assert.deepEqual(jobUpKeys('daikenja'), ['mag', 'heal']);
  assert.deepEqual(jobUpStats('hero', 20), { str: 10, def: 5 });
  // キャラの 強さ: Lv10 と Lv20 の ちがいは 得意な 数値だけ（威力・ずっと残る ボーナスも Lv10 で 止まる）
  const c = heroChar(10);
  gainExp(c, expForLevel(50));
  const s10 = computeStats(c);
  const p10 = jobPower(c, 'hr_gigadein');
  const skills10 = learnedAbilities(c).sort();
  c.jobs.hero = { lv: 20, b: 99999, tr: 2 };
  const s20 = computeStats(c);
  assert.equal(s20.str - s10.str, 10);
  assert.equal(s20.def - s10.def, 5);
  assert.equal(s20.atk - s10.atk, 10);
  for (const k of ['maxHp', 'maxMp', 'agi', 'mag', 'heal']) assert.equal(s20[k], s10[k], k);
  assert.equal(jobPower(c, 'hr_gigadein'), p10, '技の 威力は ふえない');
  assert.deepEqual(learnedAbilities(c).sort(), skills10, '新しい 技は ない');
  // ほかの 職業に かえると 得意な 数値の ぶんは なくなる（今の 職業の 間だけ）
  c.jobs.warrior = c.jobs.warrior || { lv: 1, b: 0 };
  c.job = 'warrior';
  const w20 = computeStats(c);
  c.jobs.hero.lv = 10;
  delete c.jobs.hero.tr;
  assert.deepEqual(computeStats(c), w20, '勇者 Lv20 の ボーナスは 戦士の 時は つかない');
});

test('しょうごう: Lv15「熟練の〇〇」・Lv20「伝説の〇〇」（伝説の職業は「真の〇〇」）。レベルアップの 知らせ', () => {
  assert.equal(titleFor('hero', 14), '');
  assert.equal(titleFor('hero', 15), '熟練の勇者');
  assert.equal(titleFor('hero', 20), '伝説の勇者');
  assert.equal(titleFor('loto_hero', 20), '真のロトの勇者');
  assert.equal(titleFor('warrior', 20), '');
  // 男の子の セーラームーンは タキシード仮面
  assert.equal(titleFor('sailor_moon', 15, { look: { body: 0 } }), '熟練のタキシード仮面');
  const c = heroChar(10, { tr: 1 });
  assert.equal(jobTitle(c), '');
  const ups = gainJobBattles(c, 99999);
  assert.equal(jobTitle(c), '熟練の勇者');
  const g = growthSummary('ソラ', [], ups, c, { self: true });
  assert.ok(g.notes.some((n) => n.includes('しょうごう「熟練の勇者」')), g.notes.join('\n'));
  assert.ok(g.notes.some((n) => n.includes('試練の番人')), '上限に なったら 試練の 知らせ');
  assert.ok(!g.notes.some((n) => n.includes('マスターした')), 'Lv11〜 では マスターの 知らせは 出ない');
  assert.ok(g.lines[0].includes('勇者Lv10→15'));
  // 仲間（自分で ない）には 試練の 知らせは 出さない
  const c2 = heroChar(9);
  const u2 = gainJobBattles(c2, 9999);
  assert.ok(growthSummary('ソラ', [], u2, c2, { self: true }).notes.some((n) => n.includes('マスターした')));
  assert.ok(growthSummary('ソラ', [], u2, c2, { self: true }).notes.some((n) => n.includes('試練の番人')));
  assert.ok(!growthSummary('ルカ', [], u2, c2).notes.some((n) => n.includes('試練の番人')));
});

// ───────────── 試練の きまり ─────────────
test('試練: 名前・ことばは 職業ごと（49の 職業に みじかい ことば）・修行で 数える 技', () => {
  assert.equal(trialName('hero', 1), '勇者の一の試練');
  assert.equal(trialName('daikenja', 2), '大賢者の二の試練');
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) {
    assert.ok(TRIAL_WORDS[j], `${j}: ことば`);
    assert.ok(TRIAL_WORDS[j].length <= 32, `${j}: みじかく`);
    const set = trialSkills(j);
    assert.ok(set.size >= 4, `${j}: 技 ${[...set]}`);
    for (const [, a] of JOBS[j].learn) if (!ABILITIES[a].fieldOnly) assert.ok(set.has(a), `${j}: ${a}`);
  }
  assert.notEqual(trialWords('sailor_moon', { look: { body: 0 } }), trialWords('sailor_moon', { look: { body: 1 } }));
  assert.equal(trialUseCount('hero', { hr_gigadein: 3, mera: 1 }, { hr_gigadein: 7, hr_inori: 2, mera: 9, '@atk': 30 }), 6, '勇者の 技だけ');
  assert.equal(trialUseCount('hero', { hr_gigadein: 3 }, {}), 0);
});

test('試練: 受ける → 修行（今の 職業の 時だけ）→ 師しょうのまぼろしに 勝つ → 上限。二の試練は Lv15 から', () => {
  const c = heroChar(9);
  assert.equal(trialState(c).why, 'lv');
  assert.equal(acceptTrial(c), null);
  c.jobs.hero.lv = 10;
  let st = trialState(c);
  assert.ok(st.canTake);
  assert.equal(st.next.n, 1);
  assert.equal(acceptTrial(c).n, 1);
  assert.deepEqual([c.jobs.hero.tq, c.jobs.hero.tn], [1, 0]);
  assert.equal(clearTrial(c, 'hero'), null, '修行の 前は クリアできない');
  assert.equal(addTrialUses(c, 'hero', 12).to, 12);
  c.job = 'warrior';
  c.jobs.warrior = { lv: 1, b: 0 };
  assert.equal(addTrialUses(c, 'hero', 5), null, 'ほかの 職業の 時は 数えない');
  c.job = 'hero';
  const r = addTrialUses(c, 'hero', 40);
  assert.deepEqual([r.to, r.need, r.done], [30, 30, true]);
  assert.equal(addTrialUses(c, 'hero', 1), null, 'おわったら もう 数えない');
  st = trialState(c);
  assert.ok(st.ready && st.active.n === 1);
  assert.deepEqual(clearTrial(c, 'hero').cap, 15);
  assert.deepEqual(c.jobs.hero, { lv: 10, b: jobBattlesForLevel(9, 2), tr: 1 }, '試練の 項目は tr だけ のこる');
  st = trialState(c);
  assert.equal(st.why, 'lv', '二の試練は Lv15 から');
  c.jobs.hero.lv = 15;
  assert.equal(acceptTrial(c).n, 2);
  addTrialUses(c, 'hero', 60);
  assert.equal(clearTrial(c, 'hero').cap, 20);
  assert.ok(trialState(c).all);
  // 基本職・上級職は 受けられない
  const w = newCharacter({ id: 'w', name: 'w', job: 'warrior', look: {} });
  w.jobs.warrior.lv = 10;
  assert.equal(trialState(w).why, 'tier');
  assert.equal(acceptTrial(w), null);
});

test('師しょうのまぼろし: その 職業の 技を 使う 相手（鏡のうつし身の しくみ）。一は Lv50・二は Lv58', () => {
  for (const n of [1, 2]) {
    const enc = FIXED_ENCOUNTERS[TRIALS[n - 1].enc];
    assert.ok(enc && enc.loseOk && enc.canFlee === false && enc.boss, `試練${n}`);
    const sp = enc.group[0][0];
    assert.ok(MONSTERS[sp], sp);
    assert.ok(!Object.keys(MONSTERS).includes(sp), '図鑑・魔物の 数に 入らない');
    assert.equal(MONSTERS[sp].gold, 0);
  }
  for (const j of [...SUPER_ORDER, ...LEGEND_ORDER]) {
    const sk = phantomSkills(j);
    assert.ok(sk.length >= 2, `${j}: ${sk}`);
    for (const id of sk) {
      assert.ok(JOBS[j].learn.some(([, a]) => a === id), `${j}: ${id} は その 職業の 技`);
      assert.ok(mirrorSkillOk(id));
    }
  }
  const c = heroChar(10);
  gainExp(c, expForLevel(50));
  fullHeal(c);
  for (const [n, lv] of [[1, 50], [2, 58]]) {
    const b = new Battle({ rng: makeRng(n), allies: [{ char: c, kind: 'player', controller: 's1', auto: true }], enemies: [FIXED_ENCOUNTERS[TRIALS[n - 1].enc].group[0][0]], boss: true, canFlee: false });
    const m = setupTrialPhantom(b, { job: 'hero', n, who: c });
    assert.equal(m.name, PHANTOM_NAME);
    assert.equal(m.lv, lv);
    assert.equal(m.mirrorOf, 'trial', 'うつし身と おなじく 仲間の AI で 技を えらぶ');
    assert.equal(m.job, 'hero');
    assert.ok(m.dmgRate > 0 && m.dmgRate < 1.5);
    assert.ok(m.abilities.every((id) => JOBS.hero.learn.some(([, a]) => a === id)));
    // 回復の 技は HPが 少ない ときだけ
    assert.ok(!m.abilities.includes('hr_inori'));
    m.hp = Math.floor(m.maxHp * 0.3);
    assert.ok(m.abilities.includes('hr_inori'));
    m.hp = m.maxHp;
    // 戦いが すすむ（こわれない）・まぼろしが 勇者の 技を 使う
    const used = new Set();
    for (let t = 0; t < 120000 && !b.over; t += 50) for (const ev of b.tick(50)) if (ev.t === 'act' && ev.id === m.id && ev.ability) used.add(ev.ability);
    assert.ok([...used].some((id) => JOBS.hero.learn.some(([, a]) => a === id)), `使った 技: ${[...used]}`);
  }
  // 敵の 強さ（ハード）も かかる
  const mk = (rate) => {
    const b = new Battle({ rng: makeRng(9), allies: [{ char: c, kind: 'player', controller: 's1' }], enemies: ['trial_phantom1'], boss: true, enemyRate: rate });
    return setupTrialPhantom(b, { job: 'hero', n: 1, who: c });
  };
  const m1 = mk(1), m2 = mk(1.2);
  assert.ok(Math.abs(m2.maxHp / m1.maxHp - 1.2) < 0.01, `${m1.maxHp} ${m2.maxHp}`);
  // 職業で 強さの かたむきが かわる（大魔道士は 魔力・ゴッドハンドは 攻撃力）
  const a = (job) => {
    const b = new Battle({ rng: makeRng(9), allies: [{ char: c, kind: 'player', controller: 's1' }], enemies: ['trial_phantom1'], boss: true });
    return setupTrialPhantom(b, { job, n: 1, who: c });
  };
  assert.ok(a('archmage').mag > a('god_hand').mag);
  assert.ok(a('god_hand').atk > a('archmage').atk);
});

// ───────────── 番人と 戦い（サーバーの だいほん） ─────────────
test('試練の番人: 星の神殿（ルミナの町）に いる。ひとりずつ（物語では ない）', () => {
  const n = MAPS.overworld.npcs.find((x) => x.id === 'trial_keeper');
  assert.ok(n);
  assert.equal(n.name, '試練の番人');
  assert.deepEqual([n.x, n.y], [KEEPER.x, KEEPER.y]);
  assert.ok(!isBlocked(MAPS.overworld, KEEPER.x, KEEPER.y + 1, () => true), '前に 立てる');
  assert.ok(SCRIPTS.trial_keeper);
  assert.ok(!STORY_SCRIPTS.has('trial_keeper'));
  assert.ok(src('js/client/render/chars.js').includes('trial_keeper:'), '見た目');
});

test('番人: 基本職では 受けられない・Lv10 前は まだ・Lv10 で 受ける → とちゅうの 数を 話す', async () => {
  const { bot, c } = await setup(2, { job: 'warrior', lv: 10 });
  let from = bot.msgs.length;
  await talk(bot);
  assert.ok(said(bot, '試練の番人', from) && said(bot, '超級職か伝説の職業でないと', from));
  assert.ok(c.flags.trial_seen);
  c.job = 'hero';
  c.jobs.hero = { lv: 9, b: jobBattlesForLevel(9, 2) };
  from = bot.msgs.length;
  await talk(bot);
  assert.ok(said(bot, '勇者の一の試練は、勇者の職業レベルが', from), allText(bot, from).slice(0, 400));
  c.jobs.hero = { lv: 10, b: jobBattlesForLevel(10, 2) };
  from = bot.msgs.length;
  choices(bot, [0]);
  await talk(bot);
  assert.ok(said(bot, '勇者の一の試練を受ける？', from));
  assert.ok(said(bot, '勇者の師しょう', from));
  assert.equal(c.jobs.hero.tq, 1);
  assert.equal(bot.char.jobs.hero.tq, 1, '画面にも とどく');
  from = bot.msgs.length;
  await talk(bot);
  assert.ok(said(bot, 'あと30回', from));
  // 「やめる」
  delete c.jobs.hero.tq;
  choices(bot, [1]);
  await talk(bot);
  assert.equal(c.jobs.hero.tq, undefined);
});

test('修行: 勝った 戦いで 今の 職業の 技を 使った 回数を 数える（負け・ほかの 技は 数えない）。とちゅうの 数が けっかに 出る', async () => {
  const { world, bot, c } = await setup(3);
  acceptTrial(c, 'hero');
  // 戦い 1回（だいほんの 外で きまった 戦いを はじめて、技を 使った 回数を たしてから 勝つ・負ける）
  const fight = async (how, add) => {
    let done = false;
    startFixedBattle(world, bot.s, [bot.s], 'ar1_1').then(() => { done = true; });
    for (let i = 0; i < 2000 && !done; i++) {
      for (const ctx of world.battles.values()) {
        if (ctx.done) continue;
        ctx.done = true;
        const b = ctx.battle;
        const me = b.allies.find((a) => a.controller === bot.s.id);
        for (const [k, v] of Object.entries(add)) me.use[k] = (me.use[k] || 0) + v;
        for (const x of how === 'lose' ? b.allies : b.enemies) if (x.alive) b.kill(x);
        b.checkEnd();
      }
      bot.flushQueue();
      await tickN(world, 1);
    }
    assert.ok(done);
    bot.s.busy = null;
    bot.flushQueue();
  };
  let from = bot.msgs.length;
  await fight('win', { hr_gigadein: 4, hr_gigaslash: 3, mera: 5, '@atk': 9 });
  assert.equal(c.jobs.hero.tn, 7);
  const end = bot.msgs.slice(from).filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end.lines.some((l) => l.includes('勇者の一の試練：修行 7/30回')), end.lines.join('\n'));
  await fight('lose', { hr_gigadein: 10 });
  assert.equal(c.jobs.hero.tn, 7, '負けた 戦いは 数えない');
  fullHeal(c);
  from = bot.msgs.length;
  await fight('win', { hr_gigadein: 40 });
  assert.equal(c.jobs.hero.tn, 30);
  const end2 = bot.msgs.slice(from).filter((m) => m.t === 'battleEnd').pop();
  assert.ok(end2.lines.some((l) => l.includes('修行をやりとげた')), end2.lines.join('\n'));
  // メニューの「強さ」・「クエスト」の 行（client/ui/job-trials.js）
  const rows = trialRows(c);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, '勇者の一の試練');
  assert.ok(rows[0].ready && rows[0].text.includes(PHANTOM_NAME));
});

test('メニュー: 職業レベルの 字・試練の とちゅう（強さ と クエスト）', () => {
  const c = heroChar(10);
  assert.deepEqual(jobLevelText(c, 'hero'), { text: 'Lv10 ★マスター', cls: 'gold' });
  assert.equal(trialRows(c)[0].text, '受けられる（星の神殿の試練の番人）');
  acceptTrial(c);
  addTrialUses(c, 'hero', 12);
  assert.equal(trialRows(c)[0].text, '修行 12/30回');
  c.jobs.hero = { lv: 12, b: jobBattlesForLevel(12, 2), tr: 1 };
  assert.match(jobLevelText(c, 'hero').text, /^Lv12\/15（あと\d+回）$/);
  c.jobs.hero.lv = 15;
  assert.equal(jobLevelText(c, 'hero').text, 'Lv15 ★上限');
  c.jobs.hero = { lv: 20, b: 0, tr: 2 };
  assert.equal(jobLevelText(c, 'hero').text, 'Lv20 ★きわめた');
  assert.deepEqual(trialRows(c), []);
  const w = newCharacter({ id: 'w', name: 'w', job: 'warrior', look: {} });
  w.jobs.warrior = { lv: 7, b: jobBattlesForLevel(7, 0) };
  assert.match(jobLevelText(w, 'warrior').text, /^Lv7（あと\d+回）$/);
  // 受けている 試練は ほかの 職業の 時も 出る
  const h = heroChar(10);
  acceptTrial(h);
  h.job = 'warrior';
  h.jobs.warrior = { lv: 3, b: 0 };
  assert.equal(trialRows(h)[0].text, '修行 0/30回（勇者の時だけ）');
  // menu.js・services.js が 使っている（JOB_MAX_LEVEL の「Lv10 ★マスター」を そのまま 出さない）
  const menu = src('js/client/ui/menu.js');
  assert.ok(menu.includes('jobLevelText(c, j)') && menu.includes('trialStatusBox(c') && menu.includes('trialQuestBox(c)'));
  assert.ok(!menu.includes('`Lv${JOB_MAX_LEVEL} ★マスター`'));
  assert.ok(src('js/client/ui/services.js').includes('★Lv${lv}'));
});

test('師しょうのまぼろし: 負けても お金は へらない・その場で 立ち上がる → 勝つと 上限が 15 に', async () => {
  const { world, bot, c } = await setup(4);
  acceptTrial(c, 'hero');
  addTrialUses(c, 'hero', 30);
  const gold = c.gold;
  let from = bot.msgs.length;
  choices(bot, [0]);
  let fought = await talk(bot, { how: () => 'lose' });
  assert.equal(fought.length, 1);
  assert.equal(fought[0].id, 'job_trial_1');
  const ph = fought[0].enemies[0];
  assert.equal(ph.name, PHANTOM_NAME);
  assert.equal(ph.job, 'hero');
  assert.equal(ph.mirrorOf, 'trial');
  assert.equal(c.gold, gold, 'お金は へらない');
  assert.ok(c.hp > 0, 'その場で 立ち上がる');
  assert.equal(bot.s.map, 'overworld');
  assert.ok(Math.hypot(bot.s.x - (KEEPER.x + 0.5), bot.s.y - (KEEPER.y + 1.5)) < 1, '神殿に いる まま');
  assert.equal(c.jobs.hero.tr, undefined);
  assert.equal(trialState(c).ready, true, 'もう一度 戦える');
  assert.ok(said(bot, 'お金はへっていない', from));
  // 勝つ
  from = bot.msgs.length;
  choices(bot, [0]);
  fought = await talk(bot);
  assert.equal(fought.length, 1);
  assert.equal(c.jobs.hero.tr, 1);
  assert.equal(c.jobs.hero.tq, undefined);
  assert.equal(jobLevelCap(c), 15);
  assert.ok(said(bot, '勇者の一の試練をこえた', from));
  assert.ok(said(bot, '上限が、Lv15になった', from));
  assert.ok(!bot.s.busy);
  // その あとの 戦いで Lv11 へ
  const ups = gainJobBattles(c, jobBattlesForLevel(11, 2) - c.jobs.hero.b);
  assert.deepEqual(ups.map((u) => u.lv), [11]);
});

test('家族: 試練は ひとりずつ（自分の 職業）。師しょうのまぼろしには そばの 家族も 入る（上限が 上がるのは 受けた 人だけ）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(41), checkPassword: () => true, rateLimit: false });
  const a = await setup(0, { name: 'パパ', world });
  const y = await setup(0, { name: 'ユイ', world, job: 'daikenja', lv: 10 });
  const papa = a.bot, yui = y.bot, P = a.c, Y = y.c;
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  world.placeSession(papa.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 1.5, 'up', true);
  world.placeSession(yui.s, 'overworld', KEEPER.x - 0.5, KEEPER.y + 1.5, 'up', true);
  await papa.settle();
  await yui.settle();
  // ユイは 自分の 試練（大賢者）を 受けている。パパの 試練とは べつ
  acceptTrial(Y, 'daikenja');
  acceptTrial(P, 'hero');
  addTrialUses(P, 'hero', 30);
  const yExp = Y.exp;
  const from = yui.msgs.length;
  choices(papa, [0]);
  papa.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  const fought = await play(papa, { others: [yui] });
  assert.equal(fought.length, 1);
  assert.ok(fought[0].sids.includes(yui.s.id), 'ユイも いっしょに 戦う');
  assert.equal(fought[0].enemies[0].job, 'hero', 'まぼろしは パパの 職業');
  assert.equal(P.jobs.hero.tr, 1);
  assert.equal(Y.jobs.daikenja.tr, undefined, 'ユイの 上限は かわらない');
  assert.equal(Y.jobs.daikenja.tq, 1);
  assert.ok(Y.exp > yExp, 'ユイも 経験値は もらえる');
  assert.ok(said(yui, 'いっしょに戦ってくれる', from) || said(papa, 'いっしょに戦ってくれる'));
  assert.ok(!yui.s.busy && !papa.s.busy, '2人とも うごける');
  // ユイが 話すと ユイの 試練（大賢者）の 話
  const f2 = yui.msgs.length;
  yui.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  await play(yui, { others: [papa] });
  assert.ok(said(yui, '大賢者の一の試練の、修行のとちゅう', f2));
});

test('家族: とちゅうから かけつけた 家族も 入れる（戦いの あと うごける）', async () => {
  const world = new GameWorld({ offline: false, rng: makeRng(43), checkPassword: () => true, rateLimit: false });
  const a = await setup(0, { name: 'パパ', world });
  const y = await setup(0, { name: 'ユイ', world, job: 'mage', lv: 5 });
  const papa = a.bot, yui = y.bot, P = a.c;
  papa.send({ t: 'party', action: 'invite', sid: yui.s.id });
  yui.send({ t: 'party', action: 'accept' });
  await papa.settle();
  await yui.settle();
  world.placeSession(papa.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 1.5, 'up', true);
  // ユイは とおくに いる
  world.placeSession(yui.s, 'overworld', KEEPER.x + 0.5, KEEPER.y + 14.5, 'up', true);
  await papa.settle();
  await yui.settle();
  acceptTrial(P, 'hero');
  addTrialUses(P, 'hero', 30);
  choices(papa, [0]);
  papa.send({ t: 'interact', kind: 'npc', id: 'trial_keeper' });
  for (let i = 0; i < 400 && !world.battles.size; i++) {
    papa.flushQueue();
    await tickN(world, 1);
  }
  const ctx = [...world.battles.values()][0];
  assert.ok(ctx && !ctx.sids.includes(yui.s.id), 'はじめは パパだけ');
  // そばへ 来て 入る
  world.placeSession(yui.s, 'overworld', papa.s.x - 1, papa.s.y, 'up', true);
  yui.send({ t: 'joinBattle', sid: papa.s.id });
  await tickN(world, 1);
  assert.ok(ctx.sids.includes(yui.s.id), 'とちゅうから 入れた');
  await play(papa, { others: [yui] });
  assert.equal(P.jobs.hero.tr, 1);
  assert.ok(!yui.s.busy && !papa.s.busy);
});

// ───────────── セーブ・合わせる ─────────────
test('古い セーブ: 試練の 項目が ない・へんな 数でも 読める（レベルは へらさない）', () => {
  const c = heroChar(10);
  c.jobs.hero = { lv: 10, b: 247, tq: 1, tn: 999 };
  c.jobs.warrior = { lv: 12, b: 999, tr: 2, tq: 1 };
  c.jobs.daikenja = { lv: 13, b: 999 };
  c.jobs.god_hand = { lv: 10, b: 99, tq: 2, tn: 5 };
  c.jobs.maou = { lv: 25, b: 1, tr: 'x' };
  repairChar(c, 'h1');
  assert.deepEqual(c.jobs.hero, { lv: 10, b: 247, tq: 1, tn: 30 });
  assert.deepEqual(c.jobs.warrior, { lv: 10, b: 999 }, '基本職は Lv10 まで・試練の 項目は ない');
  assert.deepEqual(c.jobs.daikenja, { lv: 13, b: 999, tr: 1 }, 'Lv10 より 上なら 一の試練は こえた ことに');
  assert.deepEqual(c.jobs.god_hand, { lv: 10, b: 99 }, '受けられない 試練は けす');
  assert.deepEqual(c.jobs.maou, { lv: 20, b: 1, tr: 2 });
  // 何回 よんでも おなじ
  const snap = JSON.stringify(c.jobs);
  repairChar(c, 'h1');
  assert.equal(JSON.stringify(c.jobs), snap);
  // 前の 版の セーブ（試練の 項目なし）は そのまま
  const old = { version: 4, characters: { a: { ...heroChar(10), id: 'a' } } };
  old.characters.a.jobs = { hero: { lv: 10, b: 247 }, warrior: { lv: 10, b: 247 } };
  const { data } = upgradeSave(old);
  assert.deepEqual(data.characters.a.jobs.hero, { lv: 10, b: 247 });
  assert.equal(jobLevelCap(data.characters.a, 'hero'), 10);
  // とても 古い しくみ（職業レベル 1〜20）は 今まで どおり 1〜10 へ
  const older = { version: 1, characters: { b: { id: 'b', name: 'b', level: 5, exp: 0, job: 'hero', jobs: { hero: { lv: 20, exp: 0 } } } } };
  const r2 = upgradeSave(older).data.characters.b;
  assert.equal(r2.jobs.hero.lv, 10);
  assert.equal(r2.jobs.hero.tr, undefined);
  // repairTrialInfo は 職業の ない ものも こわさない
  assert.equal(repairTrialInfo('hero', null), null);
});

test('合わせる: クリアした 試練は 多い ほう・修行は 多い ほう・レベルは 上限まで（ひとりで遊ぶサイトと 家族サーバー）', () => {
  assert.deepEqual(mergeTrialInfo('hero', { tr: 1 }, { tq: 1, tn: 20 }), { tr: 1 }, 'クリアした ほうが 勝つ');
  assert.deepEqual(mergeTrialInfo('hero', { tq: 1, tn: 12 }, { tq: 1, tn: 20 }), { tq: 1, tn: 20 });
  assert.deepEqual(mergeTrialInfo('hero', { tq: 1, tn: 12 }, {}), { tq: 1, tn: 12 });
  assert.deepEqual(mergeTrialInfo('warrior', { tr: 1 }, {}), {});
  const base = heroChar(10);
  base.lastPlayed = 1;
  const ours = JSON.parse(JSON.stringify(base));
  const theirs = JSON.parse(JSON.stringify(base));
  // こちら（家族サーバー）: 試練を こえて Lv11 まで
  ours.jobs.hero = { lv: 11, b: jobBattlesForLevel(11, 2), tr: 1 };
  ours.lastPlayed = 10;
  // とどいた ほう（ひとりで遊ぶサイト）: Lv10 の まま 戦って 勝った 数は 止まって いる
  theirs.jobs.hero = { lv: 10, b: jobBattlesForLevel(10, 2), tq: 1, tn: 25 };
  theirs.lastPlayed = 20;
  const m = mergeChars(base, ours, theirs);
  assert.equal(m.jobs.hero.tr, 1);
  assert.equal(m.jobs.hero.lv, 11);
  assert.equal(m.jobs.hero.tq, undefined);
  // 両方で 戦った 数を たすと Lv12 に なれる（上限 15 の 中）
  const o2 = JSON.parse(JSON.stringify(ours));
  const t2 = JSON.parse(JSON.stringify(ours));
  const d = jobBattlesForLevel(12, 2) - jobBattlesForLevel(11, 2);
  o2.jobs.hero.b += Math.ceil(d / 2);
  t2.jobs.hero.b += Math.ceil(d / 2);
  t2.lastPlayed = 30;
  const m2 = mergeChars(ours, o2, t2);
  assert.equal(m2.jobs.hero.lv, 12);
  // 上限を こえる 数でも Lv15 で 止まる
  t2.jobs.hero.b = 999999;
  assert.equal(mergeChars(ours, o2, t2).jobs.hero.lv, 15);
  // 試練を こえていない ときは Lv10 で 止まる
  const b3 = heroChar(10), o3 = heroChar(10), t3 = heroChar(10);
  t3.jobs.hero.b = 999999;
  t3.lastPlayed = 5;
  assert.equal(mergeChars(b3, o3, t3).jobs.hero.lv, 10);
});

// ───────────── ことば・ファイル ─────────────
test('試練の ことば: 新しい ファイルも 使えない漢字なし（kanji-check の gameFiles に 入っている）', () => {
  const files = gameFiles().filter((f) => /job-trials|story-trials|monsters-trial|battle-trial/.test(f));
  assert.equal(files.length, 6, files.join('\n'));
  for (const f of files) assert.deepEqual(checkFile(f).filter((r) => r.kind !== 'kana'), [], f);
  // Lv10 を 前提に した ところ: 「マスター」は Lv10 に なった 時だけ（Lv11〜 で 何回も 出ない）
  assert.ok(src('js/shared/world/growth.js').includes('u.lv === JOB_MAX_LEVEL'));
  // 職業の 上限の チェックは 試練の 上限で（battles.js）
  assert.ok(src('js/shared/world/battles.js').includes('jobLevelCap(c, c.job)'));
  assert.ok(ALL_JOBS.length >= 49);
});
