// 新しい 職業・技の しくみ（ヒント・べつの 道・行動ゲージ・おいだす・お金・ぬすむ・にげる・みね打ち・遊び人・弱点）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JOBS, JOB_MAX_LEVEL, jobBattlesForLevel, jobReqText } from '../public/js/shared/data/jobs.js';
import { ABILITIES, abilityRole, abilityTypeText } from '../public/js/shared/data/abilities.js';
import { newCharacter, jobUnlocked, jobKnown, gainJobBattles, gainExp, expForLevel, fullHeal } from '../public/js/shared/stats.js';
import { Battle } from '../public/js/shared/battle.js';
import { noteTried } from '../public/js/shared/world/party.js';
import { makeRng } from '../public/js/shared/rng.js';

const master = (c, ...jobs) => { for (const j of jobs) c.jobs[j] = { lv: JOB_MAX_LEVEL, b: 999 }; };

// その 職業を マスターした つよい キャラ
function hero(job, weapon = null, lv = 30) {
  const c = newCharacter({ id: 'p1', name: 'ヒナ', job: 'warrior' });
  gainExp(c, expForLevel(lv));
  master(c, job);
  c.job = job;
  c.equip.weapon = weapon;
  c.gold = 5000;
  fullHeal(c);
  return c;
}

// たたかいを つくる（敵は なにも しない）
function battle(c, enemies, opts = {}) {
  const rng = makeRng(opts.seed || 1);
  if (opts.lucky) rng.chance = () => true;
  const mate = newCharacter({ id: 'm1', name: 'なかま', job: 'priest' });
  gainExp(mate, expForLevel(20));
  fullHeal(mate);
  const b = new Battle({ rng, allies: [{ char: c, controller: 's1' }, { char: mate, auto: true, kind: 'support' }], enemies, canFlee: opts.canFlee !== false, hooks: opts.hooks || {} });
  for (const e of b.enemies) e.actions = [{ w: 1, id: 'm_nothing' }];
  return b;
}

// 1回 わざを つかって、その 行動を かえす
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

test('職業レベルは はじめの 版の 1.4倍 たたかう ひつようが ある（上がりにくく した）', () => {
  assert.equal(jobBattlesForLevel(10, 0), Math.round(98 * 1.4));
  assert.equal(jobBattlesForLevel(10, 1), Math.round(98 * 1.4 * 1.4));
  assert.equal(jobBattlesForLevel(10, 2), Math.round(98 * 1.8 * 1.4));
  assert.equal(jobBattlesForLevel(2, 0), 4, 'Lv2 でも 4回は たたかう');
  assert.equal(jobBattlesForLevel(1, 0), 0);
});

test('神殿: 超級職は じょうけんの 職業を マスターすると ヒントが 出る（ほかは ？？？？）', () => {
  const c = newCharacter({ id: 'a', name: 'ユイ', job: 'warrior' });
  assert.equal(jobKnown(c, 'battlemaster'), true, '上級職は はじめから 見える');
  assert.equal(jobKnown(c, 'dragon_knight'), false, '超級職は ひみつ');
  master(c, 'warrior', 'monk', 'battlemaster');
  assert.equal(jobKnown(c, 'dragon_knight'), true);
  assert.equal(jobKnown(c, 'god_hand'), true);
  assert.equal(jobKnown(c, 'sword_master'), false, 'サムライを マスターするまで ひみつ');
  assert.equal(jobUnlocked(c, 'dragon_knight'), false);
  const hide = (r) => (c.jobs[r]?.lv >= JOB_MAX_LEVEL ? JOBS[r].name : '？？？？');
  assert.equal(jobReqText('dragon_knight', hide), 'バトルマスターLv10＋？？？？Lv10');
  // マスターした ときに ヒントが 出る
  const d = newCharacter({ id: 'b', name: 'ソラ', job: 'warrior' });
  master(d, 'salaryman');
  d.jobs.bucho = { lv: 9, b: jobBattlesForLevel(10, 1) - 1 };
  d.job = 'bucho';
  const ups = gainJobBattles(d, 1);
  assert.equal(ups[0].lv, 10);
  assert.deepEqual(ups[0].unlocked, ['shacho'], '部長を マスターすると すぐ 社長');
  const e = newCharacter({ id: 'c', name: 'リク', job: 'warrior' });
  master(e, 'warrior', 'monk');
  e.jobs.samurai = { lv: 9, b: jobBattlesForLevel(10, 1) - 1 };
  e.job = 'samurai';
  const up2 = gainJobBattles(e, 1);
  assert.ok(up2[0].hinted.includes('sword_master') && up2[0].hinted.includes('shogun'), `ヒント: ${up2[0].hinted}`);
});

test('べつの 道: 遊び人だけで 賢者、アイドルだけで スーパースター', () => {
  const c = newCharacter({ id: 'a', name: 'ユイ', job: 'jester' });
  assert.equal(jobUnlocked(c, 'sage'), false);
  master(c, 'priest');
  assert.equal(jobUnlocked(c, 'sage'), false, '僧侶だけでは なれない');
  master(c, 'jester');
  assert.equal(jobUnlocked(c, 'sage'), true, '遊び人を マスター');
  master(c, 'idol');
  assert.equal(jobUnlocked(c, 'superstar'), true);
  assert.equal(jobReqText('sage'), '僧侶Lv10＋魔法使いLv10 または 遊び人Lv10');
  assert.equal(jobUnlocked(c, 'bucho'), false);
  master(c, 'salaryman');
  assert.equal(jobUnlocked(c, 'bucho'), true);
});

test('技の 種類と 属性の 見出し', () => {
  assert.equal(abilityRole(ABILITIES.mera), 'dmg');
  assert.equal(abilityRole(ABILITIES.hoimi), 'heal');
  assert.equal(abilityRole(ABILITIES.baikiruto), 'sup');
  assert.equal(abilityTypeText(ABILITIES.mera), '炎属性のダメージの呪文');
  assert.equal(abilityTypeText(ABILITIES.hoimi), '回復の呪文');
  assert.equal(abilityTypeText(ABILITIES.sm_teiji), '補助の特技');
});

test('非常ブレーキ・ツルの一声: 行動ゲージを かえる', () => {
  const b = battle(hero('railman', 'signal_flag'), ['rockman', 'rockman']);
  for (const e of b.enemies) e.atb = 90;
  const ev = act(b, { type: 'ability', id: 'rw_brake', target: b.enemies[0].id });
  assert.ok(ev.lines.some((l) => l.includes('急に止まった')), ev.lines.join(' / '));
  for (const e of b.enemies) assert.ok(e.atb < 30, `敵の ゲージ ${e.atb}`);
  const b2 = battle(hero('shacho', 'ballpen'), ['rockman']);
  b2.allies[1].atb = 5;
  const ev2 = act(b2, { type: 'ability', id: 'sh_tsuru' });
  assert.ok(ev2.lines.some((l) => l.includes('すぐに動ける')));
  assert.ok(b2.allies[1].atb >= 100 || b2.allies[1].queued || b2.allies[1].ready, 'なかまが すぐ 動く');
});

test('回送電車: 敵を おいだす（ボスには 効かない）', () => {
  const b = battle(hero('railman', 'signal_flag'), ['rockman', 'skeleton'], { lucky: true });
  const rock = b.enemies[0];
  const ev = act(b, { type: 'ability', id: 'rw_kaisou', target: rock.id });
  assert.ok(ev.lines.some((l) => l.includes('回送電車に乗せられて')), ev.lines.join(' / '));
  assert.equal(rock.fled, true);
  assert.equal(b.enemies.length, 1);
  const boss = battle(hero('railman', 'signal_flag'), ['goldoon'], { lucky: true });
  const ev2 = act(boss, { type: 'ability', id: 'rw_kaisou', target: boss.enemies[0].id });
  assert.ok(ev2.lines.some((l) => l.includes('電車に乗らなかった')), ev2.lines.join(' / '));
  assert.ok(!boss.enemies[0].fled, 'ボスは のこる');
});

test('ぜに投げ: お金を 使って 敵全体に ダメージ（お金が ないと だめ）', () => {
  let paid = 0;
  const hooks = { spendGold: (actor, want) => { paid = want; return want; } };
  const b = battle(hero('samurai', 'katana'), ['rockman', 'skeleton'], { hooks });
  const hp = b.enemies.map((e) => e.hp);
  const ev = act(b, { type: 'ability', id: 'sa_zeni', target: b.enemies[0].id });
  assert.ok(paid > 0 && ev.lines.some((l) => l.includes(`${paid}ゴールドを投げつけた`)), ev.lines.join(' / '));
  b.enemies.forEach((e, i) => assert.ok(e.hp < hp[i], '敵全体に ダメージ'));
  const poor = battle(hero('samurai', 'katana'), ['rockman'], { hooks: { spendGold: () => 0 } });
  const ev2 = act(poor, { type: 'ability', id: 'sa_zeni', target: poor.enemies[0].id });
  assert.ok(ev2.lines.includes('しかしお金が足りない！'));
});

test('とうるい: 敵の 持ち物を ぬすむ（1体に 1回）', () => {
  const hooks = { steal: () => '薬草' };
  const b = battle(hero('ballplayer', 'wood_bat'), ['pururin', 'pururin'], { hooks, lucky: true });
  const t = b.enemies[0];
  const ev = act(b, { type: 'ability', id: 'bb_tourui', target: t.id });
  assert.ok(ev.lines.includes('ヒナは薬草をぬすんだ！'), ev.lines.join(' / '));
  const ev2 = act(b, { type: 'ability', id: 'bb_tourui', target: t.id });
  assert.ok(ev2.lines.some((l) => l.includes('もう何も持っていない')), ev2.lines.join(' / '));
});

test('定時ダッシュ: かならず 逃げられる（逃げられない 戦いは だめ）', () => {
  const b = battle(hero('salaryman', 'ballpen'), ['rockman']);
  act(b, { type: 'ability', id: 'sm_teiji' });
  assert.equal(b.pendingEnd?.outcome || b.result?.outcome, 'flee');
  const b2 = battle(hero('salaryman', 'ballpen'), ['rockman'], { canFlee: false });
  const ev = act(b2, { type: 'ability', id: 'sm_teiji' });
  assert.ok(ev.lines.includes('しかし逃げられない！'));
});

test('みね打ち: たおさずに HP を 1 のこす', () => {
  const b = battle(hero('samurai', 'katana', 40), ['pururin'], { lucky: true });
  const t = b.enemies[0];
  act(b, { type: 'ability', id: 'sa_mineuchi', target: t.id });
  assert.equal(t.alive, true);
  assert.equal(t.hp, 1);
});

test('遊び人は ときどき 勝手に 遊び出す', () => {
  const b = battle(hero('jester', 'harisen'), ['rockman'], { lucky: true });
  const ev = act(b, { type: 'attack', target: b.enemies[0].id });
  assert.ok(ev.lines.includes('ヒナは遊んでいる！'), ev.lines.join(' / '));
});

test('弱点を つくと 知らせて、ためした 属性を おぼえる', () => {
  const c = hero('mage', 'oak_staff');
  const b = battle(c, ['kobushi', 'kobushi']);
  const ev = act(b, { type: 'ability', id: 'mera', target: b.enemies[0].id });
  assert.ok(ev.lines.includes('弱点をついた！'), ev.lines.join(' / '));
  assert.ok(b.tried.has('kobushi|fire'));
  const r = (ev.results || []).find((x) => x.id === b.enemies[0].id);
  assert.equal(r?.aff, 'weak');
  const b2 = battle(hero('mage', 'oak_staff'), ['lamp']);
  const ev2 = act(b2, { type: 'ability', id: 'mera', target: b2.enemies[0].id });
  assert.ok(ev2.lines.some((l) => l.includes('あまり効いていない')), ev2.lines.join(' / '));
  // 図鑑に のこる（2回め いこうも 1の まま）
  noteTried(c, b.tried);
  noteTried(c, b.tried);
  assert.equal(c.bestiary.kobushi.el_fire, 1);
});
