// たたかいの けっかの まど（第31回）: 1画面に ぜんぶ 出して 1回の タップで とじる。レベルアップは 1人 1〜2行の まとめ
// サーバー: けっかを 読んでいる 人は つぎの たたかいに まきこまれない（ほかの 人は またない）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ResultSheet, resultKind, levelUpName, growthParts, OPEN_GUARD_MS } from '../public/js/client/ui/result.js';
import { growthSummary } from '../public/js/shared/world/growth.js';
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
  // 第31回の まとめの 行
  assert.equal(resultKind('ユウ　Lv12→15！　HP+20　力+9　守り+6　素早さ+4'), 'level');
  assert.equal(resultKind('ユウ　Lv12→15　戦士Lv3→4！　力+9'), 'level');
  assert.equal(resultKind('ユウ　戦士Lv3→4！　力+2'), 'job');
  assert.equal(resultKind('ユウ　ブラックきぎょうの星Lv9→10！'), 'job');
  assert.equal(resultKind('覚えた：ホイミ、ベホイミ'), 'learn');
  assert.equal(resultKind('★ パパは「大地のいかり」をひらめいた！（これからも使える）'), 'learn');
  assert.equal(resultKind('★ パパはバトルマスターになれるようになった！（ルミナの町の神殿で転職できる）'), 'learn');
  assert.equal(levelUpName('ユウ　Lv12→15！　力+9'), 'ユウ');
  assert.equal(levelUpName('ユウ　戦士Lv3→4！'), null, '職業レベルだけ');
  assert.equal(levelUpName('30ゴールドを手に入れた！'), null);
  assert.deepEqual(growthParts('ミーナ　Lv1→4　僧侶Lv1→2！　HP+12　回復+5'), { name: 'ミーナ', ups: 'Lv1→4　僧侶Lv1→2', level: true, stats: 'HP+12　回復+5' });
  assert.equal(growthParts('ユウは120ポイントの経験値をかくとく！'), null);
  // まえの 版の 行も わかる
  assert.equal(resultKind('パパのレベルが5に上がった！'), 'level');
  assert.equal(levelUpName('ユイのレベルが7に上がった！'), 'ユイ');
});

test('レベルアップの まとめ: 1回の 戦いで 上がった ぶんを 1人 1〜2行に（合計の 強さ・覚えた 技）', () => {
  const ups = [
    { level: 13, gains: { maxHp: 7, str: 3, def: 2 }, learned: [] },
    { level: 14, gains: { maxHp: 6, str: 3, def: 2, agi: 2 }, learned: ['hoimi'] },
    { level: 15, gains: { maxHp: 7, str: 3, def: 2, agi: 2 }, learned: [] },
  ];
  const jups = [{ job: 'warrior', lv: 4, gains: { str: 1 }, learned: [], unlocked: [], hinted: [] }];
  const g = growthSummary('ユウ', ups, jups);
  assert.deepEqual(g.lines, ['ユウ　Lv12→15　戦士Lv3→4！　HP+20　力+10　守り+6　素早さ+4', '覚えた：ホイミ']);
  assert.deepEqual(g.notes, []);
  assert.deepEqual(growthSummary('ユウ', [], []), { lines: [], notes: [] });
  // 職業だけ・マスター
  const m = growthSummary('ユウ', [], [{ job: 'warrior', lv: 10, gains: {}, learned: [], unlocked: ['paladin'], hinted: [] }]);
  assert.deepEqual(m.lines, ['ユウ　戦士Lv9→10！']);
  assert.ok(m.notes.some((l) => /戦士をマスターした/.test(l)));
  assert.ok(m.notes.some((l) => /パラディンになれるようになった/.test(l)), m.notes.join('/'));
  // サーバーの 行は クライアントで わかる
  assert.equal(resultKind(g.lines[0]), 'level');
  assert.equal(resultKind(g.lines[1]), 'learn');
});

test('けっかの まど: 1画面に ぜんぶ。出て すぐの タップは むし。そのあと 1回の タップで とじる', () => {
  const lines = ['魔物たちをやっつけた！', 'パパは12ポイントの経験値をかくとく！', 'パパ　Lv4→6！　HP+9　力+4', '覚えた：ホイミ', 'ミーナ　Lv2→3！　回復+2', 'パパはやくそうを手に入れた！'];
  const now = 1000;
  const sh = new ResultSheet(lines, now);
  assert.equal(sh.rows.length, lines.length, 'ぜんぶ いっぺんに');
  assert.deepEqual(sh.levelNames, ['パパ', 'ミーナ'], 'レベルの 音は 1回・光らせる 人');
  assert.ok(sh.has('level') && sh.has('item') && !sh.has('job'));
  // うっかり タップ（戦いの さいごの タップ）は むし
  assert.equal(sh.tap(now + 10), null);
  assert.equal(sh.tap(now + OPEN_GUARD_MS - 1), null);
  assert.ok(sh.waitLeft(now) > 0);
  assert.deepEqual(sh.tap(now + OPEN_GUARD_MS), { close: true }, '1回で とじる');
  assert.equal(sh.tap(now + OPEN_GUARD_MS + 10), null, 'もう とじた');
});

test('けっかの まど: 行が ない ときは すぐ とじられる', () => {
  const sh = new ResultSheet([], 0);
  assert.deepEqual(sh.tap(0), { close: true });
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
