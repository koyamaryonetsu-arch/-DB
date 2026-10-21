// Windows の 黒い 画面で 起動できなかった（2026-10-21: QUICK_EDIT_PS を 用意する 前に よんでいた）ことの テスト
// ・簡易編集を 切る しくみは、どんな 時も 例外を 出さない
// ・Windows の ふりを して index.js を 動かしても、起動の はじめで 止まらない
// ・index.js が エラーで 止まった 時、start.bat・start.command は rescue.js で 直った 版を さがす
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { disableQuickEdit, QUICK_EDIT_PS } from '../server/quickedit.js';
import { rescue } from '../server/rescue.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('簡易編集: Windows の 画面だけ PowerShell を よぶ・失敗しても 例外を 出さない', () => {
  const calls = [];
  assert.equal(disableQuickEdit({ platform: 'linux', isTTY: true, spawn: () => calls.push(1) }), false);
  assert.equal(disableQuickEdit({ platform: 'win32', isTTY: false, spawn: () => calls.push(1) }), false);
  assert.equal(calls.length, 0);
  assert.equal(disableQuickEdit({ platform: 'win32', isTTY: true, spawn: (cmd, args) => calls.push([cmd, args]) }), true);
  const [cmd, args] = calls[0];
  assert.equal(cmd, 'powershell.exe');
  assert.equal(Buffer.from(args.at(-1), 'base64').toString('utf16le'), QUICK_EDIT_PS);
  assert.equal(disableQuickEdit({ platform: 'win32', isTTY: true, spawn: () => { throw new Error('no powershell'); } }), false);
});

test('Windows の ふりを して index.js を 動かしても、起動の はじめで 止まらない', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-qe-'));
  // process.platform を win32・画面を TTY に する（PowerShell は ないので spawnSync は 失敗するだけ）
  const pre = path.join(dir, 'win.mjs');
  fs.writeFileSync(pre, "Object.defineProperty(process, 'platform', { value: 'win32' }); Object.defineProperty(process.stdin, 'isTTY', { value: true });\n");
  const child = spawn(process.execPath, ['--import', pre, path.join(ROOT, 'server', 'index.js')], {
    cwd: ROOT, env: { ...process.env, DATA_DIR: dir, KIZUNA_NO_UPDATE: '1', PORT: String(39000 + Math.floor(Math.random() * 900)), FAMILY_PASSWORD: 'x' }, stdio: ['ignore', 'pipe', 'pipe'], detached: true,
  });
  let out = '';
  child.stdout.on('data', (d) => { out += d; });
  child.stderr.on('data', (d) => { out += d; });
  const exited = new Promise((r) => child.on('exit', (code) => r(code)));
  const code = await Promise.race([exited, new Promise((r) => setTimeout(() => r('running'), 4000))]);
  // 見はり役と 本体（main.js）を まとめて 止める
  try { process.kill(-child.pid, 'SIGKILL'); } catch { /* */ }
  await exited;
  child.stdout.destroy(); child.stderr.destroy();
  assert.equal(code, 'running', `起動の はじめで 止まった: ${out.slice(0, 600)}`);
  assert.doesNotMatch(out, /ReferenceError|before initialization/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('たすけ（rescue.js）: 新しい 版を 入れたら 0（もう一度 起動）・なかったら 1・エラーでも 1', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-rs-'));
  const lines = [];
  const log = (t) => lines.push(t);
  assert.equal(await rescue({ root: dir, dataDir: dir, log, update: async () => ({ status: 'updated' }) }), 0);
  assert.equal(await rescue({ root: dir, dataDir: dir, log, update: async () => ({ status: 'offline' }) }), 1);
  assert.equal(await rescue({ root: dir, dataDir: dir, log, update: async () => { throw new Error('x'); } }), 1);
  assert.ok(lines.some((l) => /セーブは 消えていません/.test(l)));
  fs.rmSync(dir, { recursive: true, force: true });
});

test('start.bat・start.command: index.js が エラーで 止まったら rescue.js → もう一度 index.js', () => {
  const bat = fs.readFileSync(path.join(ROOT, 'start.bat'), 'utf8');
  assert.match(bat, /node server\\index\.js\r?\nif errorlevel 1 \(/);
  assert.match(bat, /node server\\rescue\.js\r?\n\s+if not errorlevel 1 node server\\index\.js/);
  const cmd = fs.readFileSync(path.join(ROOT, 'start.command'), 'utf8');
  assert.match(cmd, /if ! node server\/index\.js; then\n[\s\S]*node server\/rescue\.js && node server\/index\.js/);
  // rescue.js は index.js を 通らない（index.js に まちがいが あっても 動く）
  const rs = fs.readFileSync(path.join(ROOT, 'server', 'rescue.js'), 'utf8');
  assert.doesNotMatch(rs, /from '\.\/index\.js'|supervisor|quickedit/);
});
