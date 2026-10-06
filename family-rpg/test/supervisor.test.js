// 家族サーバーの 見はり役（server/supervisor.js）: 本体が 止まったら もう一度 動かす・ふつうの 終わりでは 動かさない
// 本物の プロセスで ためす（本体の かわりに 小さな スクリプトを 動かす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SUPERVISOR = pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server', 'supervisor.js')).href;

// 本体の かわり: count.txt に 起動した 回数を 書く。mode で うごきを かえる
const CHILD = `
import fs from 'node:fs';
const dir = process.env.T_DIR;
const n = Number(fs.existsSync(dir + '/count.txt') ? fs.readFileSync(dir + '/count.txt', 'utf8') : 0) + 1;
fs.writeFileSync(dir + '/count.txt', String(n));
const mode = fs.readFileSync(dir + '/mode.txt', 'utf8').trim();
const ready = () => process.send?.({ t: 'ready' });
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
if (mode === 'crash-twice') {
  ready();
  if (n <= 2) setTimeout(() => { throw new Error('boom ' + n); }, 150);
  setInterval(() => {}, 1000);
} else if (mode === 'exit0') {
  ready();
  setTimeout(() => process.exit(0), 100);
} else if (mode === 'port') {
  process.exit(3);
} else if (mode === 'broken') {
  process.exit(1);
} else if (mode === 'exit7') {
  process.exit(7);
} else {
  ready();
  setInterval(() => {}, 1000);
}
`;

// 見はり役を 動かす スクリプト（オプションは 環境変数の JSON）
const RUNNER = `
import fs from 'node:fs';
import { supervise } from ${JSON.stringify(SUPERVISOR)};
const dir = process.env.T_DIR;
const opts = JSON.parse(process.env.T_OPTS || '{}');
supervise({
  script: dir + '/child.mjs',
  restartMs: 100,
  justUpdated: !!opts.justUpdated,
  rollback: opts.rollback ? () => { fs.writeFileSync(dir + '/mode.txt', 'ok'); return true; } : null,
  note: (t) => fs.appendFileSync(dir + '/notes.txt', t + '\\n'),
});
`;

function setup(mode, opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-sup-'));
  fs.writeFileSync(path.join(dir, 'child.mjs'), CHILD);
  fs.writeFileSync(path.join(dir, 'runner.mjs'), RUNNER);
  fs.writeFileSync(path.join(dir, 'mode.txt'), mode);
  const proc = spawn(process.execPath, [path.join(dir, 'runner.mjs')], {
    env: { ...process.env, T_DIR: dir, T_OPTS: JSON.stringify(opts) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  proc.stdout.on('data', (d) => { out += String(d); });
  proc.stderr.on('data', (d) => { out += String(d); });
  const exited = new Promise((r) => proc.on('exit', (code) => r(code)));
  const count = () => Number(fs.existsSync(path.join(dir, 'count.txt')) ? fs.readFileSync(path.join(dir, 'count.txt'), 'utf8') : 0);
  const notes = () => (fs.existsSync(path.join(dir, 'notes.txt')) ? fs.readFileSync(path.join(dir, 'notes.txt'), 'utf8') : '');
  const until = async (fn, ms = 10000) => {
    for (let t = 0; t < ms && !fn(); t += 50) await new Promise((r) => setTimeout(r, 50));
    assert.ok(fn(), out);
  };
  return { proc, exited, count, notes, until, out: () => out };
}

test('見はり役: 本体が エラーで 止まったら もう一度 動かす。Ctrl + C では 動かさずに 終わる', { timeout: 30000 }, async () => {
  const r = setup('crash-twice');
  await r.until(() => r.count() >= 3);
  await new Promise((res) => setTimeout(res, 400));
  assert.equal(r.count(), 3, '2回 止まって 3回目で 動きつづける');
  assert.match(r.out(), /自動でもう一度動かします（2回目）/);
  assert.match(r.notes(), /家族サーバーが止まりました（code 1）。もう一度動かします（1回目）/);
  r.proc.kill('SIGINT');
  assert.equal(await r.exited, 0);
  assert.equal(r.count(), 3, 'Ctrl + C の あとは 動かさない');
});

test('見はり役: ふつうに 終わった（0）・ポートの 取りあい（3）では もう一度 動かさない', { timeout: 30000 }, async () => {
  const a = setup('exit0');
  assert.equal(await a.exited, 0);
  assert.equal(a.count(), 1);
  const b = setup('port');
  assert.equal(await b.exited, 3);
  assert.equal(b.count(), 1);
});

test('見はり役: 起動の とちゅうで 3回 続けて 止まったら あきらめて 理由を 出す', { timeout: 30000 }, async () => {
  const r = setup('broken');
  assert.equal(await r.exited, 1);
  assert.equal(r.count(), 3);
  assert.match(r.out(), /家族サーバーを動かせませんでした/);
});

test('見はり役: 入れた ばかりの 新しい 版が 起動できない → 前の 版に もどして 動かす', { timeout: 30000 }, async () => {
  const r = setup('broken', { justUpdated: true, rollback: true });
  await r.until(() => r.count() >= 2);
  await new Promise((res) => setTimeout(res, 300));
  assert.equal(r.count(), 2, 'もどした 版で 動きつづける');
  assert.match(r.out(), /前の版にもどします/);
  r.proc.kill('SIGINT');
  assert.equal(await r.exited, 0);
});

test('見はり役: 前の 版の 見はり役から 動かされた 新しい 版が 起動できない → 止まった コードで 終わる（前の 版が もどす）', { timeout: 30000 }, async () => {
  const r = setup('exit7', { justUpdated: true });
  assert.equal(await r.exited, 7);
  assert.equal(r.count(), 1);
});
