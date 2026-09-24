import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ほんものの サーバーを うごかして、Node の WebSocket クライアントで つなぐ
test('家族サーバー: 合言葉で ログインして キャラを つくれる', { timeout: 30000 }, async () => {
  if (typeof WebSocket === 'undefined') return; // Node 22 いじょうで テスト
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-'));
  const port = 3900 + Math.floor(Math.random() * 90);
  const proc = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, DATA_DIR: dir, PORT: String(port), FAMILY_PASSWORD: 'ほし123', HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('server did not start')), 8000);
      proc.stdout.on('data', (d) => { if (String(d).includes('うごきました')) { clearTimeout(t); resolve(); } });
      proc.on('exit', (c) => reject(new Error('exit ' + c)));
    });
    const info = await (await fetch(`http://127.0.0.1:${port}/api/info`)).json();
    assert.equal(info.server, true);
    const html = await (await fetch(`http://127.0.0.1:${port}/`)).text();
    assert.ok(html.includes('<canvas') || html.includes('きずな'));
    const bad = await fetch(`http://127.0.0.1:${port}/..%2f..%2fpackage.json`);
    assert.notEqual(bad.status, 200);

    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const inbox = [];
    const waitFor = (pred, ms = 5000) => new Promise((resolve, reject) => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        const m = inbox.find(pred);
        if (m) { clearInterval(iv); resolve(m); }
        else if (Date.now() - t0 > ms) { clearInterval(iv); reject(new Error('timeout')); }
      }, 20);
    });
    ws.onmessage = (e) => inbox.push(JSON.parse(e.data));
    await new Promise((r) => { ws.onopen = r; });
    ws.send(JSON.stringify({ t: 'hello', pw: 'ちがう' }));
    await waitFor((m) => m.t === 'helloFail');
    ws.send(JSON.stringify({ t: 'hello', pw: 'ほし123' }));
    await waitFor((m) => m.t === 'welcome');
    ws.send(JSON.stringify({ t: 'createChar', name: 'テスト', job: 'mage', look: {} }));
    const created = await waitFor((m) => m.t === 'charCreated');
    ws.send(JSON.stringify({ t: 'play', id: created.id }));
    const enter = await waitFor((m) => m.t === 'enter');
    assert.equal(enter.char.name, 'テスト');
    await waitFor((m) => m.t === 'snap');
    // おおきな メッセージも とどく（126バイト いじょうの フレーム）
    ws.send(JSON.stringify({ t: 'chat', text: 'あ'.repeat(70) }));
    await waitFor((m) => m.t === 'chat');
    ws.close();
    await new Promise((r) => setTimeout(r, 300));
  } finally {
    proc.kill('SIGINT');
    await new Promise((r) => proc.on('exit', r));
  }
  assert.ok(fs.existsSync(path.join(dir, 'save.json')), 'セーブされている');
  const save = JSON.parse(fs.readFileSync(path.join(dir, 'save.json'), 'utf8'));
  assert.equal(Object.values(save.characters)[0].name, 'テスト');
});
