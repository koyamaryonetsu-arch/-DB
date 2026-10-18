// ブラウザで 読む ファイルが ぜんぶ 文法として 正しいか（1つでも まちがうと 画面が 真っ暗に なる）。
// テストで import しない 画面の ファイル（client/ui など）も ここで たしかめる。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'js');
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) out.push(p);
  }
  return out;
}

test('every browser JS file parses', () => {
  const bad = [];
  for (const f of walk(root)) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) bad.push(`${f}\n${(r.stderr || '').split('\n').slice(0, 4).join('\n')}`);
  }
  assert.deepEqual(bad, []);
});
