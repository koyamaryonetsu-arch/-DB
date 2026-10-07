// ゲームの 難しさ: 目的地の しるし（メイン・たのまれごと）と もらえる 経験値（1・0.75・0.5倍）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { difficultyOf, normDifficulty, scaleExp, visibleMarks, EXP_RATES } from '../public/js/shared/data/difficulty.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { startFieldBattle } from '../public/js/shared/world/battles.js';
import { recruitNpc, afterRosterChange, partyOf } from '../public/js/shared/world/party.js';
import { MONSTERS } from '../public/js/shared/data/monsters.js';
import { Bot, tickN } from './helpers.js';

test('難しさの 初めは ふつう（しるしは 出す・経験値 1倍・敵の強さ 1倍）', () => {
  assert.deepEqual(difficultyOf({}), { mainMarks: true, subMarks: true, exp: 1, enemy: 1 });
  assert.deepEqual(difficultyOf({ difficulty: { exp: 3, mainMarks: 'x' } }), { mainMarks: true, subMarks: true, exp: 1, enemy: 1 }, '知らない 値は ふつう');
  assert.deepEqual(EXP_RATES, [1, 0.75, 0.5]);
});

test('設定を ととのえる: ぜんぶ ふつうに もどすと のこさない', () => {
  const d = normDifficulty(undefined, { exp: 0.5, mainMarks: false });
  assert.deepEqual(d, { mainMarks: false, subMarks: true, exp: 0.5, enemy: 1 });
  assert.deepEqual(normDifficulty(d, { subMarks: false }), { mainMarks: false, subMarks: false, exp: 0.5, enemy: 1 });
  assert.equal(normDifficulty(d, { exp: 1, mainMarks: true }), undefined);
  assert.deepEqual(normDifficulty(d, { exp: 0.33 }), d, '知らない 倍率は かえない');
});

test('経験値の 倍率（0 で なければ 1 いじょう）', () => {
  assert.equal(scaleExp({}, 100), 100);
  assert.equal(scaleExp({ difficulty: { exp: 0.75 } }, 100), 75);
  assert.equal(scaleExp({ difficulty: { exp: 0.5 } }, 101), 51);
  assert.equal(scaleExp({ difficulty: { exp: 0.5 } }, 1), 1);
  assert.equal(scaleExp({ difficulty: { exp: 0.5 } }, 0), 0);
});

test('しるしを しぼる: メインだけ・たのまれごとだけ 出さない', () => {
  const marks = [{ kind: 'main' }, { kind: 'sub' }, { kind: 'subReady' }];
  assert.equal(visibleMarks({}, marks).length, 3);
  assert.deepEqual(visibleMarks({ difficulty: { mainMarks: false } }, marks).map((m) => m.kind), ['sub', 'subReady']);
  assert.deepEqual(visibleMarks({ difficulty: { subMarks: false } }, marks).map((m) => m.kind), ['main']);
  assert.equal(visibleMarks({ difficulty: { mainMarks: false, subMarks: false } }, marks).length, 0);
});

async function battleExp(rate) {
  const world = new GameWorld({ offline: true, rng: makeRng(11), rateLimit: false });
  const bot = new Bot(world, 'ユイ');
  await bot.login();
  await bot.createAndPlay('warrior');
  await bot.settle();
  const c = world.data.characters[bot.char.id];
  if (rate !== 1) bot.send({ t: 'menu', action: 'settings', difficulty: { exp: rate } });
  recruitNpc(world, bot.s, 'npc_gard', { force: true });
  afterRosterChange(world, bot.s);
  const gard = partyOf(world, bot.s).supports.find((x) => x.key === 'npc_gard').char;
  const e0 = c.exp, g0 = gard.exp;
  bot.s.map = 'overworld';
  const ctx = startFieldBattle(world, bot.s, { id: 'xx', sp: 'golem', group: ['golem'], zone: 'outskirts', table: 'outskirts', busy: false });
  for (const e of ctx.battle.enemies) { e.hp = 0; e.alive = false; ctx.battle.killed.push(e.species); }
  ctx.battle.checkEnd();
  for (let i = 0; i < 300 && world.battles.size; i++) await tickN(world, 1);
  return { me: c.exp - e0, gard: gard.exp - g0, diff: c.difficulty };
}

test('戦いの 経験値: 0.5倍に すると 自分も 仲間も 半分', async () => {
  const base = MONSTERS.golem.exp;
  const normal = await battleExp(1);
  assert.equal(normal.me, base);
  assert.equal(normal.gard, base);
  const half = await battleExp(0.5);
  assert.deepEqual(half.diff, { mainMarks: true, subMarks: true, exp: 0.5, enemy: 1 }, 'メニューの 設定で のこる');
  assert.equal(half.me, Math.round(base * 0.5));
  assert.equal(half.gard, Math.round(base * 0.5), '仲間も 半分');
  const q = await battleExp(0.75);
  assert.equal(q.me, Math.round(base * 0.75));
});
