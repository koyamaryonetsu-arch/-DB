// つながりの きろく（server/connlog.js）: スマホから つながらない ときに、どこで 止まったかを あとから 見る
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createConnLog, maskIp, watchStalls, stallText, CONN_LOG } from '../server/connlog.js';

test('つながりの きろく: ファイルに 時こくつきで 書く。同じ ことは 1分に 1回まで。大きく なったら うつす', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-conn-'));
  let t = Date.UTC(2026, 9, 20, 3, 0, 0);
  const log = createConnLog(dir, { now: () => t, maxBytes: 400 });
  log.note('家族サーバーを起動しました');
  assert.equal(log.noteOnce('page:a', '外出先からページが開かれました'), true);
  assert.equal(log.noteOnce('page:a', '外出先からページが開かれました'), false);
  t += 61000;
  assert.equal(log.noteOnce('page:a', '外出先からページが開かれました'), true);
  const text = fs.readFileSync(path.join(dir, CONN_LOG), 'utf8');
  assert.match(text, /^\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\] 家族サーバーを起動しました/);
  assert.equal(text.match(/ページが開かれました/g).length, 2);
  for (let i = 0; i < 20; i++) log.note('x'.repeat(40));
  assert.ok(fs.existsSync(path.join(dir, 'connection-log.old.txt')));
});

test('つながりの きろく: 外出先の アドレスは 少し かくす', () => {
  assert.equal(maskIp('203.0.113.45'), '203.0.113.x');
  assert.equal(maskIp('2001:db8:1234:5678::1'), '2001:db8:1234:…');
  assert.equal(maskIp(''), '?');
});

test('つながりの きろく: 家族サーバーが 止まっていた 時間を 見つける（PC の スリープ・黒い 画面の 一時停止）', () => {
  let t = 0;
  let tick = null;
  const seen = [];
  watchStalls((sec) => seen.push(sec), { now: () => t, setIntervalImpl: (fn) => { tick = fn; return null; } });
  t += 1000; tick();
  t += 1200; tick();
  assert.deepEqual(seen, [], '少しの おくれは 書かない');
  t += 9000; tick();
  assert.deepEqual(seen, [8]);
  t += 1000 + 600000; tick();
  assert.deepEqual(seen, [8, 600]);
  assert.match(stallText(8), /8秒 動いていませんでした/);
  assert.match(stallText(600), /10分 動いていませんでした/);
});
