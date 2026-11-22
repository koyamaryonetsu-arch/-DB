// 第101回 R1班: 第3部の ボスに 負けた 時、ヒントの あとに 足す ひとこと（world/boss-hints.js の partyNote・data/boss-hints.js の PARTY_NOTE）
//   ① 味方（ゲストを のぞく）が 3人 いかで 自動の 仲間が いない → 4人で いどもう
//   ② 自動の 仲間に Lv95 いじょうで 基本職の 人 → 転職と 装備
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../public/js/shared/data/encounters.js';
import { BOSS_HINTS, PARTY_NOTE, BASIC_JOB_LV } from '../public/js/shared/data/boss-hints.js';
import { partyNote, bossHintAfter, bossHintSteps } from '../public/js/shared/world/boss-hints.js';
import { checkFile, gameFiles } from '../tools/kanji-check.mjs';

const P = (name = 'ソラ') => ({ kind: 'player', name, job: 'hero', lv: 104 });
const S = (name, job, lv) => ({ kind: 'support', name, job, lv });
const M = (name = 'スラりん') => ({ kind: 'monster', name, job: null, lv: 104 });
const G = { kind: 'guest', name: 'スピカ', job: null, lv: 104 };

test('ひとこと ①: 第3部の ボスで、味方が 3人 いかで 自動の 仲間が いない 時だけ', () => {
  assert.equal(partyNote('c9a_trio', [P()]), PARTY_NOTE.few, 'ひとりだけ');
  assert.equal(partyNote('c9b_king', [P(), P('ミナ')]), PARTY_NOTE.few, '2人だけ');
  assert.equal(partyNote('c10c_colonel', [P(), P('ミナ'), P('ハル'), G]), PARTY_NOTE.few, '3人だけ（ゲストは 数えない）');
  assert.equal(partyNote('c11a_pirate', [P(), P('ミナ'), P('ハル')]), PARTY_NOTE.few, '第3章も');
  assert.equal(partyNote('c9a_trio', [P(), P('ミナ'), P('ハル'), P('ユイ')]), '', '4人');
  assert.equal(partyNote('c9a_trio', [P(), M()]), '', '魔物の 仲間が いる');
  assert.equal(partyNote('c9a_trio', [P(), S('リン', 'godhand', 103)]), '', '転職ずみの 仲間');
  // 第3部で ない 戦いは 出ない
  assert.equal(partyNote('c8_bowser', [P()]), '');
  assert.equal(partyNote('sand_clock', [P()]), '');
  assert.equal(partyNote('', [P()]), '');
});

test('ひとこと ②: 自動の 仲間（酒場・家族の 仲間）に Lv95 いじょうで はじめの 職業の 人が いる', () => {
  assert.equal(BASIC_JOB_LV, 95);
  const al = [P(), S('ポポロ', 'mage', 103), S('リン', 'monk', 103), S('ミーナ', 'sage', 103)];
  assert.equal(partyNote('c9c_trio2', al), PARTY_NOTE.basic(['ポポロ', 'リン']));
  assert.ok(partyNote('c9c_trio2', al).startsWith('ポポロとリンは、まだ初めの職業のままだ。'));
  assert.equal(partyNote('c10a_x', [P(), S('ポポロ', 'priest', 95)]), PARTY_NOTE.basic(['ポポロ']), 'Lv95 ちょうど');
  assert.equal(partyNote('c10a_x', [P(), S('ポポロ', 'priest', 94)]), '', 'Lv94 は 出ない');
  assert.equal(partyNote('c10a_x', [P(), S('ポポロ', 'sage', 105)]), '', '上級職');
  assert.equal(partyNote('c10a_x', [P(), M(), S('ポポロ', 'mage', 105)]), PARTY_NOTE.basic(['ポポロ']), '魔物が いても');
  assert.equal(partyNote('c8_bowser', [P(), S('ポポロ', 'mage', 105)]), '', '第3部で ない');
});

test('負けた 時: ヒントの あとに ひとことを 1行（あてはまらない 時は なし）', () => {
  assert.ok(BOSS_HINTS.c9a_trio?.length, '第3部の ヒントが まざって いる');
  const lose = (allies) => {
    const s = { id: 's1', char: { name: 'ソラ' } };
    const world = { parties: new Map([['p1', { leader: 's1' }]]) };
    const ctx = { opts: { fixed: 'c9a_trio', boss: true }, partyId: 'p1', map: 'c9a_crater', actorMap: {}, battle: { allies } };
    bossHintAfter(world, ctx, [s], 'lose');
    return s.bossHint;
  };
  const h1 = lose([P(), P('ミナ')]);
  assert.equal(h1.note, PARTY_NOTE.few);
  const steps = bossHintSteps(h1, null);
  assert.deepEqual(steps.map((x) => x[2]).slice(-2), [BOSS_HINTS.c9a_trio[0], PARTY_NOTE.few]);
  assert.equal(steps[steps.length - 1][1], h1.who, '同じ 人が 言う');
  const h4 = lose([P(), P('ミナ'), P('ハル'), P('ユイ')]);
  assert.equal(h4.note, undefined);
  assert.equal(bossHintSteps(h4, null).length, 2, 'ヒントだけ');
});

test('ひとことの 文: 子どもが 読める（漢字の きまり・40文字 くらい）', () => {
  for (const s of [PARTY_NOTE.few, PARTY_NOTE.basic(['ポポロ'])]) {
    assert.ok(s.length <= 45, s);
    assert.ok(!/[ 　]/.test(s), s);
  }
  const files = gameFiles();
  for (const f of ['public/js/shared/data/boss-hints.js', 'public/js/shared/world/boss-hints.js']) {
    const full = files.find((y) => y.endsWith(f));
    assert.ok(full, f);
    assert.deepEqual(checkFile(full), [], f);
  }
});
