// 第63回: クライアントの ファイルに 書きまちがい（文法の エラー）が ないか（テストで 読みこまない ファイルも）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = new URL('../public/js/client/', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((n) => {
  const p = path.join(dir, n);
  return statSync(p).isDirectory() ? files(p) : n.endsWith('.js') ? [p] : [];
});

// 1つの node で ぜんぶ たしかめる（vm.SourceTextModule は 文法だけ 読む。import は 動かさない）
const CHECK = `
const vm = require('node:vm'); const fs = require('node:fs');
const bad = [];
for (const f of JSON.parse(process.argv[1])) {
  try { new vm.SourceTextModule(fs.readFileSync(f, 'utf8'), { identifier: f }); }
  catch (e) { bad.push(f + ': ' + String(e && e.message)); }
}
process.stdout.write(JSON.stringify(bad));
`;

test('第63回: client の .js は どれも 文法が 正しい', { timeout: 120000 }, () => {
  const list = files(ROOT);
  assert.ok(list.length > 50);
  const out = execFileSync(process.execPath, ['--experimental-vm-modules', '--no-warnings', '-e', CHECK, JSON.stringify(list)], { encoding: 'utf8', maxBuffer: 1 << 24 });
  const bad = JSON.parse(out).map((x) => path.relative(ROOT, x.split(': ')[0]) + ': ' + x.split(': ').slice(1).join(': '));
  assert.deepEqual(bad, []);
});
