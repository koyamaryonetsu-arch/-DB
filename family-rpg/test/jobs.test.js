import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, ALL_JOBS, JOB_ORDER, ADVANCED_ORDER, SUPER_ORDER, JOB_MAX_LEVEL, jobBattlesForLevel, jobBases } from '../public/js/shared/data/jobs.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import {
  newCharacter, changeJob, jobUnlocked, gainJobBattles, jobTrainable, migrateJobs, comboAllowed, penaltyFor, learnedAbilities, fullHeal, gainExp, expForLevel,
} from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };

test('職業データ: 上級職は 基本職 2つ、わざは ぜんぶ ある', () => {
  assert.equal(JOB_ORDER.length, 5);
  assert.equal(ADVANCED_ORDER.length, 10);
  assert.ok(SUPER_ORDER.length >= 8);
  // 基本職の くみあわせ 10とおりに 1つずつ 上級職
  const pairs = new Set(ADVANCED_ORDER.map((j) => JOBS[j].req.slice().sort().join('+')));
  assert.equal(pairs.size, 10);
  for (const id of ALL_JOBS) {
    const j = JOBS[id];
    for (const [lv, a] of j.learn) {
      assert.ok(lv >= 1 && lv <= JOB_MAX_LEVEL, `${id} ${a} Lv${lv}`);
      assert.ok(ABILITIES[a], `${id}: ${a}`);
      assert.ok(ABILITIES[a].anim, `${a} anim`);
    }
    for (const r of j.req || []) assert.ok(JOBS[r], `${id} req ${r}`);
  }
  assert.ok(JOBS.dragon_knight && JOBS.archmage && JOBS.hero, '竜の騎士・大魔道士・勇者');
});

test('職業レベルは かった たたかいの かずで あがる（さいだい 10）', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'warrior' });
  assert.equal(c.jobs.warrior.lv, 1);
  const ups = gainJobBattles(c, jobBattlesForLevel(2));
  assert.equal(c.jobs.warrior.lv, 2);
  assert.ok(ups[0].learned.includes('kabau'), 'Lv2で かばう');
  gainJobBattles(c, 999);
  assert.equal(c.jobs.warrior.lv, JOB_MAX_LEVEL);
  assert.equal(gainJobBattles(c, 5).length, 0, 'マスターした あとは あがらない');
});

test('よわすぎる てきとの たたかいは しゅぎょうに ならない', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'monk' });
  gainExp(c, expForLevel(12));
  assert.equal(c.level >= 12, true);
  assert.equal(jobTrainable(c, 1), false, 'ぷるりん（Lv1）は よわすぎる');
  assert.equal(jobTrainable(c, c.level - 4), true, '4つ ひくい くらいなら しゅぎょうに なる');
  assert.equal(jobTrainable(c, c.level + 3), true);
});

test('基本職を 2つ マスターすると 上級職に なれる（どうぐは いらない）', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'warrior' });
  assert.equal(jobUnlocked(c, 'battlemaster'), false);
  assert.equal(changeJob(c, 'battlemaster').locked, true);
  master(c, 'warrior');
  assert.equal(jobUnlocked(c, 'battlemaster'), false, '武闘家も ひつよう');
  // 武闘家を たたかいで マスターすると その ときに おしらせ
  changeJob(c, 'monk');
  const ups = gainJobBattles(c, 999);
  const last = ups[ups.length - 1];
  assert.equal(last.lv, JOB_MAX_LEVEL);
  assert.ok(last.unlocked.includes('battlemaster'), 'バトルマスターに なれるように なった');
  assert.equal(changeJob(c, 'battlemaster').ok, true);
  assert.deepEqual(jobBases('battlemaster'), ['warrior', 'monk']);
  // 超級職: 上級職を マスター
  assert.equal(jobUnlocked(c, 'dragon_knight'), false);
  master(c, 'battlemaster', 'magic_knight');
  assert.equal(jobUnlocked(c, 'dragon_knight'), true, '竜の騎士');
  assert.equal(jobUnlocked(c, 'hero'), false, '勇者は バトルマスター＋賢者＋パラディン');
  master(c, 'sage', 'paladin');
  assert.equal(jobUnlocked(c, 'hero'), true);
});

test('掛け合わせ技は もとの 職業を あわせもつ 上級職いじょう だけ', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'mage' });
  master(c, 'mage', 'priest', 'warrior');
  assert.ok(learnedAbilities(c).includes('medoro'), 'メドロは ひらめく');
  assert.equal(comboAllowed(c, 'medoro'), false, '魔法使いの ままでは つかえない');
  assert.equal(comboAllowed(c, 'kaen_senpu'), false);
  changeJob(c, 'sage');
  assert.equal(comboAllowed(c, 'medoro'), true, '賢者なら メドロ');
  assert.equal(comboAllowed(c, 'kaen_senpu'), true, '賢者なら 火炎旋風（ギラ＋バギ）');
  assert.equal(comboAllowed(c, 'mahouken'), false, '魔法剣は 戦士の 系統も ひつよう');
  changeJob(c, 'magic_knight');
  assert.equal(comboAllowed(c, 'mahouken'), true, '魔法戦士なら 魔法剣');
  assert.equal(comboAllowed(c, 'kaen_senpu'), false, '魔法戦士に 僧侶は ふくまれない');
  // たたかいでも ことわられる
  const m = newCharacter({ id: 'b', name: 'b', job: 'mage' });
  master(m, 'mage');
  fullHeal(m);
  const b = new Battle({ rng: makeRng(2), allies: [{ char: m, controller: 's1' }], enemies: ['pururin'] });
  for (let i = 0; i < 400 && !b.allies[0].ready; i++) b.tick(50);
  assert.equal(b.command(b.allies[0].id, { type: 'ability', id: 'medoro', target: b.enemies[0].id }, 's1').ok, false);
});

test('上級職は もとの 基本職の わざを ペナルティなしで つかえる', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'warrior' });
  master(c, 'warrior', 'monk');
  changeJob(c, 'battlemaster');
  assert.equal(penaltyFor(c, 'daichi').penalized, false, '大地斬');
  assert.equal(penaltyFor(c, 'seiken').penalized, false, 'せいけんづき');
  master(c, 'mage');
  assert.equal(penaltyFor(c, 'mera').penalized, true, 'メラは ほかの 系統');
});

test('まえの バージョンの 職業レベル（1〜20）を 1〜10に なおす', () => {
  const c = newCharacter({ id: 'a', name: 'a', job: 'warrior' });
  c.jobs = { warrior: { lv: 20, exp: 5000 }, mage: { lv: 7, exp: 300 }, priest: { lv: 1, exp: 0 } };
  delete c.jobSys;
  migrateJobs(c);
  assert.deepEqual(Object.fromEntries(Object.entries(c.jobs).map(([k, v]) => [k, v.lv])), { warrior: 10, mage: 4, priest: 1 });
  assert.equal(c.jobs.mage.b, jobBattlesForLevel(4));
  migrateJobs(c);
  assert.equal(c.jobs.mage.lv, 4, '2かい なおしても かわらない');
});

test('ワールド: ログインしていない 家族の キャラも よみこみの ときに なおす', () => {
  const old = newCharacter({ id: 'fam1', name: 'パパ', job: 'mage' });
  old.jobs = { mage: { lv: 16, exp: 2000 } };
  delete old.jobSys;
  const world = new GameWorld({ offline: true, rng: makeRng(5), rateLimit: false, data: { characters: { fam1: old } } });
  assert.deepEqual(world.data.characters.fam1.jobs.mage, { lv: 8, b: jobBattlesForLevel(8) });
});

test('ワールド: かった たたかいで 職業レベルが すすみ、よわい てきでは すすまない', { timeout: 60000 }, async () => {
  const world = new GameWorld({ offline: true, rng: makeRng(21), rateLimit: false });
  const bot = new Bot(world, 'ソラ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.guests = [];
  gainExp(c, expForLevel(4) - c.exp);
  fullHeal(c);
  const fight = async (group) => {
    startFieldBattle(world, bot.s, { id: 't' + Math.random(), sp: group[0], group, zone: 'outskirts', table: 'outskirts', busy: false });
    await bot.settle(8000);
    return bot.battles[bot.battles.length - 1];
  };
  const b0 = c.jobs.warrior.b;
  const r1 = await fight(['tsunousagi']); // Lv2 は Lv4 から みて しゅぎょうに なる
  assert.equal(r1.outcome, 'win');
  assert.equal(c.jobs.warrior.b, b0 + 1);
  gainExp(c, expForLevel(10) - c.exp);
  fullHeal(c);
  const r2 = await fight(['pururin']);
  assert.equal(r2.outcome, 'win');
  assert.equal(c.jobs.warrior.b, b0 + 1, 'Lv10 で ぷるりんは しゅぎょうに ならない');
  assert.ok(r2.lines.some((l) => l.includes('しゅぎょうに ならなかった')));
});

test('上級職・超級職の わざは ぜんぶ たたかいで つかえる（エラーが でない）', () => {
  const ids = [...ADVANCED_ORDER, ...SUPER_ORDER];
  let used = 0;
  for (const jid of ids) {
    const c = newCharacter({ id: jid, name: jid, job: 'warrior' });
    gainExp(c, expForLevel(40));
    for (const r of [...(JOBS[jid].req || [])]) master(c, r);
    for (const r of JOBS[jid].req || []) for (const rr of JOBS[r].req || []) master(c, rr);
    master(c, jid);
    assert.equal(changeJob(c, jid).ok, true, jid);
    const wcat = JOBS[jid].weapons.find((w) => w !== 'none');
    c.equip.weapon = { sword: 'iron_sword', axe: 'iron_axe', dagger: 'bronze_knife', spear: 'iron_spear', claw: 'iron_claw', staff: 'oak_staff', fan: 'feather_fan', whip: 'leather_whip' }[wcat] || null;
    fullHeal(c);
    const mate = newCharacter({ id: 'mate', name: 'mate', job: 'priest' });
    gainExp(mate, expForLevel(30));
    fullHeal(mate);
    mate.hp = 0; // ザオリクなどの ため
    for (const [, aid] of JOBS[jid].learn) {
      const b = new Battle({ rng: makeRng(used + 1), allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies: ['rockman', 'rockman', 'skeleton'], canFlee: false });
      for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
      for (let i = 0; i < 600 && !b.allies[0].ready; i++) b.tick(50);
      const a = ABILITIES[aid];
      const target = ['ally', 'deadAlly'].includes(a.target) ? (a.target === 'deadAlly' ? b.allies[1].id : b.allies[0].id) : b.enemies[0].id;
      const r = b.command(b.allies[0].id, a.effect.type === 'mahouken' ? { type: 'mahouken', spell: 'mera', skill: 'daichi', target } : { type: 'ability', id: aid, target }, 's1');
      assert.equal(r.ok, true, `${jid}: ${aid} ${r.reason || ''}`);
      const evs = [];
      for (let i = 0; i < 200 && !evs.some((e) => e.t === 'act' && e.id === b.allies[0].id); i++) evs.push(...b.tick(50));
      assert.ok(evs.some((e) => e.t === 'act' && e.id === b.allies[0].id), `${aid} が じっこう された`);
      used++;
    }
  }
  assert.ok(used >= 90, `つかった わざ ${used}`);
});
