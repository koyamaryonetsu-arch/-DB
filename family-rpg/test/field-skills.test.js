// メニューの 呪文・技「今使える」タブ（shared/fieldskills.js）と、配合の みほん（breedOutcome）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldUsableAbilities } from '../public/js/shared/fieldskills.js';
import { ABILITIES } from '../public/js/shared/data/abilities.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { breedOutcome } from '../public/js/shared/data/companions.js';
import { newCharacter, gainExp, expForLevel, computeStats, learnedAbilities, mpCost, newMonsterCompanion } from '../public/js/shared/stats.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { Bot } from './helpers.js';

function hero(job, level = 20) {
  const c = newCharacter({ id: 'p', name: 'テスト', look: {}, job });
  gainExp(c, expForLevel(level) - c.exp);
  c.jobs[job] = { lv: 10, b: 999 };
  const st = computeStats(c);
  c.hp = st.maxHp;
  c.mp = st.maxMp;
  return c;
}
const ids = (list) => list.map((x) => x.id);

test('今使える: フィールドで 使える 技だけ（戦いだけの 技は 出ない）', () => {
  const c = hero('priest');
  const list = fieldUsableAbilities(c);
  assert.ok(ids(list).includes('hoimi'), 'ホイミは 出る');
  assert.ok(ids(list).includes('kiarii'), 'キアリーも 出る');
  assert.ok(list.every((x) => ABILITIES[x.id].field), 'field の 技だけ');
  assert.ok(learnedAbilities(c).some((id) => !ABILITIES[id].field), '戦いだけの 技も 覚えている');
  assert.ok(list.every((x) => x.ok && x.why === ''), 'MPが あれば みんな 使える');
  assert.deepEqual(list.map((x) => x.cost), list.map((x) => mpCost(c, x.id)), 'MPは メニューと おなじ 計算');
  // 戦士は フィールドで 使える 技が ない
  assert.deepEqual(fieldUsableAbilities(hero('warrior')), []);
});

test('今使える: MPが 足りない 技・死んでいる ときは 出すが 使えない', () => {
  const c = hero('priest');
  c.mp = 0;
  const list = fieldUsableAbilities(c);
  assert.ok(list.length > 0);
  assert.ok(list.every((x) => !x.ok && x.why === 'mp'), 'MPが 足りない');
  c.mp = 99;
  c.hp = 0;
  assert.ok(fieldUsableAbilities(c).every((x) => !x.ok && x.why === 'dead'), '死んでいる');
});

test('今使える: ルーラは 洞窟や 塔の 中では 出ない', () => {
  const c = hero('mage');
  assert.ok(learnedAbilities(c).includes('rura'));
  assert.ok(ids(fieldUsableAbilities(c, { mapKind: 'field' })).includes('rura'), 'そとでは 出る');
  assert.ok(!ids(fieldUsableAbilities(c, { mapKind: 'dungeon' })).includes('rura'), '洞窟では 出ない');
  assert.ok(!ids(fieldUsableAbilities(c, { mapKind: 'town' })).includes('rura'), 'サーバーと おなじく そと だけ');
});

test('今使える: 掛け合わせ技は 使える 職業の ときだけ', () => {
  const c = hero('warrior');
  c.hirameki = ['iyashi_mai'];
  assert.ok(learnedAbilities(c).includes('iyashi_mai'));
  assert.ok(!ids(fieldUsableAbilities(c)).includes('iyashi_mai'), '戦士では 使えない');
  c.job = 'superstar';
  c.jobs.superstar = { lv: 1, b: 0 };
  c.mp = 99;
  assert.ok(ids(fieldUsableAbilities(c)).includes('iyashi_mai'), 'スーパースターなら 使える');
});

test('今使える: モンスターの 仲間も（覚えた 回復の 技）', () => {
  const healer = Object.keys(MONSTERS).find((sp) => {
    try { return learnedAbilities(newMonsterCompanion({ id: 'x', species: sp, level: 30 })).some((id) => ABILITIES[id]?.field); } catch { return false; }
  });
  if (!healer) return;
  const m = newMonsterCompanion({ id: 'x', species: healer, level: 30 });
  m.mp = 999;
  const list = fieldUsableAbilities(m);
  assert.ok(list.length > 0 && list.every((x) => x.ok), MONSTERS[healer].name);
});

test('配合の みほん: breedOutcome は サーバーの breedPreview と おなじ 子・＋', async () => {
  const { breedPreview } = await import('../public/js/shared/world/breed.js');
  const { addMonsterCompanion } = await import('../public/js/shared/world/party.js');
  const world = new GameWorld({ offline: true, rng: makeRng(7), rateLimit: false });
  const bot = new Bot(world, 'モモ');
  await bot.login();
  await bot.createAndPlay('performer');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  c.flags.monster_bond = true;
  const a = addMonsterCompanion(world, bot.s, 'pururin', 14);
  const b = addMonsterCompanion(world, bot.s, 'koumorin', 12);
  const k = addMonsterCompanion(world, bot.s, 'skeleton', 21);
  c.companions.find((e) => e.key === a.key).char.plus = 3;
  // 酒場の じょうほう（クライアントが もつ もの）で 計算する
  const roster = (await import('../public/js/shared/world/party.js')).tavernInfo(world, bot.s).roster;
  const byKey = (key) => roster.find((e) => e.key === key);
  for (const [x, y] of [[a, b], [b, a], [a, k], [k, b]]) {
    const pv = breedPreview(c, x.key, y.key);
    assert.ok(pv.ok, pv.reason);
    const o = breedOutcome(byKey(x.key), byKey(y.key), MONSTERS);
    assert.equal(o.child, pv.child, `${x.key}＋${y.key}`);
    assert.equal(o.plus, pv.plus);
    assert.equal(o.special, pv.special);
  }
  assert.equal(breedOutcome(byKey(a.key), byKey(b.key), MONSTERS).child, 'fuwari', 'ぷるりん＋そらを とぶ まもの＝ふわりん');
  assert.equal(breedOutcome(byKey(a.key), byKey(k.key), MONSTERS).child, 'pururin_knight');
});
