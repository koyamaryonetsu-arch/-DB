// 家族サーバーの 自動更新（GitHub の にせものを ローカルに たてて ためす）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readTar, checkAndUpdate, rollback, readVersion, SOURCE } from '../server/update.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ───── tar を つくる（テスト用） ─────
function header(name, size, type) {
  const h = Buffer.alloc(512);
  h.write(name.slice(0, 100), 0, 'utf8');
  h.write('0000644\0', 100);
  h.write('0000000\0', 108);
  h.write('0000000\0', 116);
  h.write(size.toString(8).padStart(11, '0') + '\0', 124);
  h.write('00000000000\0', 136);
  h.write('        ', 148);
  h.write(type, 156);
  h.write('ustar\0', 257);
  h.write('00', 263);
  let sum = 0;
  for (const b of h) sum += b;
  h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return h;
}
const pad = (n) => Buffer.alloc((512 - (n % 512)) % 512);
function entry(name, data, type = '0') {
  return Buffer.concat([header(name, data.length, type), data, pad(data.length)]);
}
function paxBody(obj) {
  return Buffer.concat(Object.entries(obj).map(([k, v]) => {
    const rest = ` ${k}=${v}\n`;
    const n = Buffer.byteLength(rest);
    let len = n + String(n).length;
    if (String(len).length !== String(n).length) len = n + String(len).length;
    return Buffer.from(`${len}${rest}`);
  }));
}
function makeTarGz(sha, files, { longPath } = {}) {
  const top = `-DB-${sha}`;
  const parts = [entry('pax_global_header', paxBody({ comment: sha }), 'g')];
  for (const [rel, data] of Object.entries(files)) {
    const name = `${top}/${rel}`;
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    if (longPath || Buffer.byteLength(name) > 99) parts.push(entry('pax', paxBody({ path: name }), 'x'));
    parts.push(entry(name.slice(0, 99), buf));
  }
  parts.push(Buffer.alloc(1024));
  return zlib.gzipSync(Buffer.concat(parts));
}

// にせの GitHub（api と codeload）
async function fakeGitHub(state) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === `/repos/${SOURCE.owner}/${SOURCE.repo}/commits`) {
      if (state.down) { res.writeHead(503); res.end(); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ sha: state.sha, commit: { committer: { date: state.date || '2026-09-26T09:00:00Z' } } }]));
      return;
    }
    if (u.pathname === `/${SOURCE.owner}/${SOURCE.repo}/tar.gz/${state.sha}`) {
      state.downloads = (state.downloads || 0) + 1;
      res.writeHead(200, { 'Content-Type': 'application/gzip' });
      res.end(state.tar);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${srv.address().port}`;
  return { srv, base, close: () => new Promise((r) => srv.close(r)) };
}

function tmpApp(files) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-up-'));
  const root = path.join(home, 'Downloads', '-DB-claude-elegant-bell-al2f1w', 'family-rpg');
  for (const [rel, data] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), data);
  }
  const dataDir = path.join(home, 'kizuna-save');
  fs.mkdirSync(dataDir, { recursive: true });
  return { home, root, dataDir };
}

test('自動更新: GitHub の tar.gz を 読める（長い 名前も）', () => {
  const long = 'family-rpg/public/js/shared/data/とても長いなまえのファイル-'.padEnd(120, 'a') + '.js';
  const gz = makeTarGz('abc123', { 'family-rpg/server/index.js': 'x', [long]: 'long' }, { longPath: true });
  const tar = readTar(zlib.gunzipSync(gz));
  assert.equal(tar.global.comment, 'abc123');
  assert.ok(tar.files.some((f) => f.path.endsWith('.js') && f.data.toString() === 'long' && f.path.includes('とても長い')));
});

test('自動更新: 新しい 版を 入れる。セーブ・起動用ファイルは さわらない。2回めは なにも しない', async () => {
  const { root, dataDir } = tmpApp({
    'server/index.js': 'old-index', 'public/index.html': 'old-html', 'public/old-only.js': 'stays',
    'start.bat': 'OLD START', 'data/save.json': '{"characters":{}}',
  });
  fs.writeFileSync(path.join(dataDir, 'save.json'), 'SAVE');
  const state = { sha: 'sha-new-1', tar: makeTarGz('sha-new-1', {
    'family-rpg/server/index.js': 'new-index', 'family-rpg/public/index.html': 'new-html', 'family-rpg/public/js/new.js': 'new',
    'family-rpg/start.bat': 'NEW START', 'family-rpg/data/save.json': 'BAD', '.claude/x.md': 'other',
  }) };
  const gh = await fakeGitHub(state);
  try {
    const logs = [];
    const r = await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base, log: (t) => logs.push(t) });
    assert.equal(r.status, 'updated');
    assert.equal(fs.readFileSync(path.join(root, 'server/index.js'), 'utf8'), 'new-index');
    assert.equal(fs.readFileSync(path.join(root, 'public/js/new.js'), 'utf8'), 'new');
    assert.equal(fs.readFileSync(path.join(root, 'public/old-only.js'), 'utf8'), 'stays');
    assert.equal(fs.readFileSync(path.join(root, 'start.bat'), 'utf8'), 'OLD START', '動いている start.bat は かえない');
    assert.equal(fs.readFileSync(path.join(root, 'data/save.json'), 'utf8'), '{"characters":{}}', 'data は さわらない');
    assert.equal(fs.readFileSync(path.join(dataDir, 'save.json'), 'utf8'), 'SAVE', 'セーブは そのまま');
    assert.ok(!fs.existsSync(path.join(root, '.claude')), 'ゲーム いがいの ファイルは 入れない');
    assert.equal(readVersion(root).sha, 'sha-new-1');
    assert.equal(fs.readFileSync(path.join(dataDir, 'app-previous', 'server/index.js'), 'utf8'), 'old-index', '前の 版を とっておく');
    assert.ok(logs.some((t) => t.includes('新しい版にしました')));
    // 2回め
    const r2 = await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base });
    assert.equal(r2.status, 'latest');
    assert.equal(state.downloads, 1);
    // 前の 版に もどす
    assert.equal(rollback({ root, dataDir }), true);
    assert.equal(fs.readFileSync(path.join(root, 'server/index.js'), 'utf8'), 'old-index');
    assert.equal(readVersion(root), null);
  } finally {
    await gh.close();
  }
});

test('自動更新: インターネットに つながらない・こわれた ファイル・git の フォルダでは なにも かえない', async () => {
  const { root, dataDir } = tmpApp({ 'server/index.js': 'old', 'public/index.html': 'old' });
  const state = { sha: 's2', down: true, tar: makeTarGz('s2', { 'family-rpg/public/index.html': 'x' }) };
  const gh = await fakeGitHub(state);
  try {
    assert.equal((await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base })).status, 'offline');
    state.down = false;
    const r = await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base });
    assert.equal(r.status, 'error', 'server/index.js が ない ファイルは つかわない');
    assert.equal(fs.readFileSync(path.join(root, 'server/index.js'), 'utf8'), 'old');
    // sha が ちがう（とちゅうで すりかわった）
    state.tar = makeTarGz('other', { 'family-rpg/server/index.js': 'x', 'family-rpg/public/index.html': 'x' });
    assert.equal((await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base })).status, 'error');
    assert.equal(fs.readFileSync(path.join(root, 'server/index.js'), 'utf8'), 'old');
    // config で とめる
    assert.equal((await checkAndUpdate({ root, dataDir, api: gh.base, codeload: gh.base, enabled: false })).status, 'skip');
  } finally {
    await gh.close();
  }
  // この リポジトリ（git）では 自動更新しない
  const git = await checkAndUpdate({ root: APP, dataDir: os.tmpdir(), api: 'http://127.0.0.1:9' });
  assert.equal(git.status, 'skip');
  assert.equal(git.reason, 'git');
});

// 本物の アプリを コピーして、起動 → 更新 → 新しい 版で 起動（こわれていたら 前の 版で 起動）
function copyApp(dest) {
  for (const d of ['server', 'public']) fs.cpSync(path.join(APP, d), path.join(dest, d), { recursive: true });
  fs.copyFileSync(path.join(APP, 'package.json'), path.join(dest, 'package.json'));
}
function appTar(sha, root, patch) {
  const files = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files[`family-rpg/${path.relative(root, p).split(path.sep).join('/')}`] = fs.readFileSync(p);
    }
  };
  walk(root);
  Object.assign(files, patch);
  return makeTarGz(sha, files);
}
async function launch(root, home, gh, port) {
  const env = { ...process.env, HOME: home, USERPROFILE: home, PORT: String(port), HOST: '127.0.0.1', KIZUNA_UPDATE_API: gh.base, KIZUNA_UPDATE_CODELOAD: gh.base };
  delete env.DATA_DIR;
  delete env.KIZUNA_NO_UPDATE;
  const proc = spawn(process.execPath, [path.join(root, 'server', 'index.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  proc.stdout.on('data', (d) => { out += String(d); });
  proc.stderr.on('data', (d) => { out += String(d); });
  for (let i = 0; i < 150 && !out.includes('終わるときは'); i++) await new Promise((r) => setTimeout(r, 100));
  proc.kill('SIGINT');
  await new Promise((r) => proc.on('exit', r));
  return out;
}

test('自動更新: 起動すると 新しい 版に なって そのまま 動く。こわれた 版なら 前の 版に もどして 動く', { timeout: 60000 }, async () => {
  const { home, root } = tmpApp({});
  copyApp(root);
  const state = { sha: 'good-1', tar: appTar('good-1', root, { 'family-rpg/public/NEW.txt': 'new version' }) };
  const gh = await fakeGitHub(state);
  try {
    const out = await launch(root, home, gh, 3990 + Math.floor(Math.random() * 9));
    assert.ok(out.includes('新しい版にしました'), out);
    assert.ok(out.includes('終わるときは'), '新しい 版で 起動した');
    assert.ok(fs.existsSync(path.join(root, 'public/NEW.txt')));
    assert.ok(out.includes('アプリの版'), out);
    // こわれた 版（main.js が 動かない）
    state.sha = 'bad-2';
    state.tar = appTar('bad-2', root, { 'family-rpg/server/main.js': 'throw new Error("broken")' });
    const out2 = await launch(root, home, gh, 3990 + Math.floor(Math.random() * 9));
    assert.ok(out2.includes('前の版にもどします'), out2);
    assert.ok(out2.includes('終わるときは'), '前の 版で 起動した');
    assert.ok(!fs.readFileSync(path.join(root, 'server/main.js'), 'utf8').includes('broken'));
    assert.equal(readVersion(root).sha, 'good-1');
  } finally {
    await gh.close();
  }
});
