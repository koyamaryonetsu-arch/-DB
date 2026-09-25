import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gameFiles, checkFile, checkText, GRADE4_KANJI, SCHOOL_KANJI } from '../tools/kanji-check.mjs';

test('文字: 学年別漢字配当表は 1〜4年で 642字、1〜6年で 1026字', () => {
  assert.equal(new Set(GRADE4_KANJI).size, 642);
  assert.equal(new Set(SCHOOL_KANJI).size, 1026);
});

test('文字: 画面に出る文字は 使ってよい漢字だけで、ことばの間に スペースがない', () => {
  const bad = [];
  for (const f of gameFiles()) {
    for (const p of checkFile(f)) if (p.kind !== 'kana') bad.push(`${f.split('/public/').pop()}:${p.line} [${p.kind} ${p.detail}] ${p.text}`);
  }
  assert.deepEqual(bad, []);
});

test('文字: チェックの しくみ', () => {
  assert.equal(checkText('ソラはレベル3に上がった！').length, 0);
  assert.ok(checkText('ソラは レベル3に あがった！').some((p) => p.kind === 'space'));
  assert.ok(checkText('鍵をあけた').some((p) => p.kind === 'kanji'), '鍵は小学校で習わない');
  assert.ok(checkText('なかまが くわわった').some((p) => p.kind === 'kana'));
});
