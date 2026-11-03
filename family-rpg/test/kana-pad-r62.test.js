// 第62回: コントローラーだけで 名前を 書く 文字ばん（client/ui/kana-pad.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cycleChar, cycleLast, padKeys, padMove, PAD_PAGES } from '../public/js/client/ui/kana-pad.js';

test('第62回: ゛゜小で さいごの 文字が かわる（ひとまわりで もどる）', () => {
  assert.equal(cycleChar('か'), 'が');
  assert.equal(cycleChar('が'), 'か');
  assert.equal(cycleChar('は'), 'ば');
  assert.equal(cycleChar('ば'), 'ぱ');
  assert.equal(cycleChar('ぱ'), 'は');
  assert.equal(cycleChar('つ'), 'っ');
  assert.equal(cycleChar('っ'), 'づ');
  assert.equal(cycleChar('ハ'), 'バ');
  assert.equal(cycleChar('ヤ'), 'ャ');
  assert.equal(cycleChar('ン'), 'ン', 'かわらない 文字');
  assert.equal(cycleLast('プルフ'), 'プルブ');
  assert.equal(cycleLast(''), '');
});

test('第62回: 文字ばんの キーと 十字キーの 動き', () => {
  const rows = padKeys('hira');
  assert.equal(rows.length, 6);
  assert.equal(rows[0].length, 10);
  assert.deepEqual(rows[5].map((k) => k.label), ['カナ', '英数', '゛゜小', '1字けす', '決定', 'やめる']);
  assert.equal(padKeys('kata')[0][0].ch, 'ア');
  assert.equal(padKeys('abc')[0][0].ch, 'A');
  assert.deepEqual(padKeys('hira', true).at(-1).map((k) => k.act), ['del', 'ok', 'cancel'], '数の 時');
  for (const p of Object.values(PAD_PAGES)) for (const r of p) assert.ok([...r].length === 10 || [...r].length === 5);
  assert.deepEqual(padMove(rows, 0, 0, 'left'), [0, 9], 'はしは 反対へ');
  assert.deepEqual(padMove(rows, 0, 0, 'up'), [5, 0]);
  assert.deepEqual(padMove(rows, 4, 9, 'down'), [5, 5], '道具の 行へ（近い 場所）');
  assert.deepEqual(padMove(rows, 5, 5, 'down'), [0, 9]);
});

test('第62回: askText は コントローラーの 時に 文字ばんを 出す（文字の 入力に しない）', () => {
  const src = readFileSync(new URL('../public/js/client/ui/dom.js', import.meta.url), 'utf8');
  assert.match(src, /const kp = pad \? kanaPad\(field/);
  assert.match(src, /if \(!kp\) setTimeout\(\(\) => field\.focus\(\), 30\);/);
  const kp = readFileSync(new URL('../public/js/client/ui/kana-pad.js', import.meta.url), 'utf8');
  assert.match(kp, /\[ァ-ヶ\]/, 'カタカナの 名前は カタカナの 面から');
});
