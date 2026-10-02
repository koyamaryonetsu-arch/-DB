// たたかいの けっかの まど: ボタンを おすまで つぎの 行に すすまない・レベルアップの あとは 間を おく
// サーバー: けっかを 読んでいる 人は つぎの たたかいに まきこまれない（ほかの 人は またない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ResultPager, resultKind, levelUpName, RESULT_GAP_MS, LEVEL_GAP_MS } from '../public/js/client/ui/result.js';
import { GameWorld } from '../public/js/shared/world/world.js';
import { battleSessions, readingResult, RESULT_MAX_MS, AFTER_RESULT_MS } from '../public/js/shared/world/battles.js';
import { makeRng } from '../public/js/shared/rng.js';
import { PLACES } from '../public/js/shared/maps/overworld.js';
import { Bot, tickN } from './helpers.js';

test('けっかの 行の しゅるい', () => {
  assert.equal(resultKind('魔物たちをやっつけた！'), 'other');
  assert.equal(resultKind('パパは12ポイントの経験値をかくとく！'), 'exp');
  assert.equal(resultKind('30ゴールドを手に入れた！'), 'gold');
  assert.equal(resultKind('プルリンはやくそうを持っていた！'), 'found');
  assert.equal(resultKind('パパはやくそうを手に入れた！'), 'item');
  assert.equal(resultKind('パパのレベルが5に上がった！'), 'level');
  assert.equal(resultKind('HP+5　力+2'), 'stats');
  assert.equal(resultKind('パパの戦士の職業レベルが3に上がった！'), 'job');
  assert.equal(resultKind('パパはホイミを覚えた！'), 'learn');
  assert.equal(resultKind('★ パパは「大地のいかり」をひらめいた！（これからも使える）'), 'learn');
  assert.equal(resultKind('★ パパはバトルマスターになれるようになった！（ルミナの町の神殿で転職できる）'), 'learn');
  assert.equal(levelUpName('ユイのレベルが7に上がった！'), 'ユイ');
  assert.equal(levelUpName('パパの戦士の職業レベルが3に上がった！'), null);
  assert.equal(levelUpName('30ゴールドを手に入れた！'), null);
});

test('けっかの まど: ボタンを おす たびに 1行ずつ。はやすぎる ボタンは むし。レベルアップの あとは ながく まつ', () => {
  const lines = ['魔物たちをやっつけた！', 'パパは12ポイントの経験値をかくとく！', 'パパのレベルが5に上がった！', 'HP+5　力+2', 'パパはやくそうを手に入れた！'];
  const p = new ResultPager(lines);
  let now = 1000;
  // 1行め（まどを ひらいた とき）
  const first = p.advance(now);
  assert.equal(first.line, lines[0]);
  assert.ok(!p.done);
  // 時間が たっても かってには すすまない（advance を よんだ ときだけ）
  now += 60000;
  assert.equal(p.i, 1);
  // 2行め
  assert.equal(p.advance(now).line, lines[1]);
  // れんだは むし
  assert.equal(p.advance(now + RESULT_GAP_MS - 1), null);
  now += RESULT_GAP_MS;
  const lv = p.advance(now);
  assert.equal(lv.kind, 'level');
  // レベルアップの よいん: ふつうの 間では まだ すすまない
  assert.equal(p.advance(now + RESULT_GAP_MS), null);
  assert.ok(p.waitLeft(now + RESULT_GAP_MS) > 0);
  assert.equal(p.advance(now + LEVEL_GAP_MS - 1), null);
  now += LEVEL_GAP_MS;
  assert.equal(p.waitLeft(now), 0);
  assert.equal(p.advance(now).kind, 'stats');
  now += RESULT_GAP_MS;
  const last = p.advance(now);
  assert.equal(last.kind, 'item', 'アイテムも ボタンを おしてから');
  assert.ok(last.last);
  assert.ok(p.done);
  // さいごの 行の あとも ボタンで とじる（すぐには とじない）
  assert.equal(p.advance(now + 10), null);
  now += RESULT_GAP_MS;
  assert.deepEqual(p.advance(now), { close: true });
});

test('けっかの まど: 行が ない ときは すぐ とじられる', () => {
  const p = new ResultPager([]);
  assert.ok(p.done);
  assert.deepEqual(p.advance(0), { close: true });
});

// ───────────── サーバー ─────────────

const FIELD = { x: PLACES.village.x + 40, y: PLACES.village.y + 12 };

function fightAt(world, bot, x, y) {
  const ms = world.mapStates.get('overworld') || (world.tick(1), world.mapStates.get('overworld'));
  const sym = { id: 'sym' + Math.random(), sp: 'pururin', group: ['pururin'], table: 'outskirts', zone: 'outskirts', x, y, busy: false, stun: 0, state: 'wander' };
  ms.symbols.set(sym.id, sym);
  bot.s.x = x;
  bot.s.y = y;
  bot.send({ t: 'touch', id: sym.id });
  return sym;
}

async function family() {
  const world = new GameWorld({ offline: false, rng: makeRng(21), checkPassword: (pw) => pw === 'ほし', rateLimit: false });
  const papa = new Bot(world, 'パパ');
  const kid = new Bot(world, 'ユイ');
  await papa.login('ほし');
  await kid.login('ほし');
  await papa.createAndPlay('warrior');
  await kid.createAndPlay('mage');
  await papa.settle();
  await kid.settle();
  papa.send({ t: 'party', action: 'invite', sid: kid.s.id });
  kid.send({ t: 'party', action: 'accept' });
  // つよく して すぐ おわらせる
  for (const b of [papa, kid]) {
    const c = world.sessions.get(b.s.id).char;
    c.level = 30;
  }
  return { world, papa, kid };
}

test('サーバー: けっかを 読んでいる あいだは まきこまれない。読みおわると すこし だけ むてき', { timeout: 60000 }, async () => {
  const { world, papa, kid } = await family();
  kid.keepResult = true;
  kid.s.x = FIELD.x + 1;
  kid.s.y = FIELD.y;
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle && kid.inBattle, 'いっしょに たたかう');
  await papa.settle(8000);
  assert.ok(!kid.inBattle);
  const end = kid.battles.at(-1);
  assert.ok(end && end.lines.length > 0, 'けっかの 行が ある');
  // ユイは まだ まどを とじていない
  assert.ok(kid.s.reading && readingResult(kid.s));
  assert.ok(kid.s.invuln > 3000, 'ふつうの 3秒より ながく まもられる');
  // しばらく たっても まもられている（サーバーは まつ けど、パパは あそべる）
  await tickN(world, 100, 50);
  assert.ok(readingResult(kid.s));
  assert.ok(kid.s.invuln <= RESULT_MAX_MS);
  assert.ok(!papa.s.reading, 'パパは もう とじた');
  // パパが つぎの たたかいを はじめても ユイは まきこまれない
  papa.s.invuln = 0;
  assert.ok(!battleSessions(world, papa.s).includes(kid.s));
  fightAt(world, papa, FIELD.x, FIELD.y);
  assert.ok(papa.inBattle, 'パパは またずに つぎの たたかいへ');
  assert.ok(!kid.inBattle, 'ユイは まだ けっかを 読んでいる');
  await papa.settle(8000);
  // ユイが とじる → のこりは すこしだけ
  kid.send({ t: 'resultDone' });
  assert.ok(!kid.s.reading);
  assert.ok(kid.s.invuln <= AFTER_RESULT_MS);
  // 2かい おくっても こわれない
  kid.send({ t: 'resultDone' });
  assert.ok(kid.s.invuln <= AFTER_RESULT_MS);
  await tickN(world, Math.ceil(AFTER_RESULT_MS / 50) + 2, 50);
  assert.ok(kid.s.invuln <= 0);
  papa.s.invuln = 0;
  kid.s.x = FIELD.x + 1;
  kid.s.y = FIELD.y;
  papa.s.x = FIELD.x;
  papa.s.y = FIELD.y;
  assert.ok(battleSessions(world, papa.s).includes(kid.s), 'とじた あとは また いっしょに たたかえる');
});

test('サーバー: まどを とじない ままでも ずっとは まもられない（いちばん ながくて RESULT_MAX_MS）', { timeout: 60000 }, async () => {
  const { world, papa } = await family();
  papa.keepResult = true;
  fightAt(world, papa, FIELD.x, FIELD.y);
  await papa.settle(8000);
  assert.ok(papa.s.reading);
  assert.ok(papa.s.invuln <= RESULT_MAX_MS);
  await tickN(world, Math.ceil(RESULT_MAX_MS / 1000) + 2, 1000);
  assert.ok(!readingResult(papa.s), 'じかんぎれ');
});
