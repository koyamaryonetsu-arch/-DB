// 家族サーバーが へんな アクセスで 止まらない こと（外出先の アドレスは インターネットに 公開される）
// 前は「//a:b」「/index.php%00.txt」の ような アドレスが 1回 来るだけで、サーバーが 止まって いた
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { freePort } from './helpers.js';
import { requestPath, decodePath } from '../server/reqpath.js';

test('アドレスの パス: へんな 形でも エラーに ならず、読めない ときは null', () => {
  assert.equal(requestPath('/api/info'), '/api/info');
  assert.equal(requestPath('/api/info?x=1#y'), '/api/info');
  assert.equal(requestPath('/'), '/');
  assert.equal(requestPath('//a:b'), '//a:b');
  assert.equal(requestPath('http://example.com/ws?x'), '/ws');
  assert.equal(requestPath('http://[x'), null);
  assert.equal(requestPath('*'), null);
  assert.equal(requestPath(''), null);
  assert.equal(requestPath(undefined), null);
  assert.equal(decodePath('/a%20b.js'), '/a b.js');
  assert.equal(decodePath('/index.php%00.txt'), null, '%00 は だめ');
  assert.equal(decodePath('/%'), null);
  assert.equal(decodePath('/%E3%81%82'), '/あ');
});

function rawRequest(port, lines) {
  return new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1', () => s.write(lines.join('\r\n') + '\r\n\r\n'));
    let got = '';
    s.on('data', (d) => { got += d; });
    s.on('close', () => resolve(got.split('\r\n')[0] || ''));
    s.on('error', () => resolve(''));
    setTimeout(() => s.destroy(), 1000);
  });
}

test('家族サーバー: インターネットの 見まわりツールの へんな アクセスでも 止まらない', { timeout: 60000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-hard-'));
  const port = await freePort();
  const proc = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, DATA_DIR: dir, PORT: String(port), FAMILY_PASSWORD: 'ほしのきずな12', HOST: '127.0.0.1', KIZUNA_NO_UPDATE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  proc.stdout.on('data', (d) => { out += String(d); });
  proc.stderr.on('data', (d) => { out += String(d); });
  try {
    for (let i = 0; i < 100 && !out.includes('動きました'); i++) await new Promise((r) => setTimeout(r, 100));
    assert.ok(out.includes('動きました'), out);
    const targets = [
      '//a:b', '/index.php%00.txt', '/%00', '//..%2f..%2fetc/passwd', '//%c0%ae%c0%ae/', '//a%20b/', '//127.0.0.1:99999/',
      '//admin:admin@', '//%00/', 'http://[x', '/%', '*', '/..%2f..%2fpackage.json', '/js/%2e%2e/%2e%2e/package.json',
    ];
    for (const t of targets) {
      const status = await rawRequest(port, [`GET ${t} HTTP/1.1`, 'Host: kizuna.example.ts.net']);
      assert.ok(!/ 200 /.test(status) || t === '//a:b', `${t} → ${status}`);
    }
    // WebSocket の つなぎかたで へんな アドレス
    for (const t of ['//a:b', '/ws%00', '//%c0%ae']) {
      await rawRequest(port, [`GET ${t} HTTP/1.1`, 'Host: x', 'Upgrade: websocket', 'Connection: Upgrade', 'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==', 'Sec-WebSocket-Version: 13']);
    }
    // こわれた リクエスト・とちゅうで 切れる WebSocket
    await rawRequest(port, ['GARBAGE \x00\x01 HTTP/9.9']);
    await rawRequest(port, ['GET /ws HTTP/1.1', 'Host: x', 'Upgrade: websocket', 'Connection: Upgrade']);
    // まだ 動いている（もう一度 動かしても いない）
    const info = await (await fetch(`http://127.0.0.1:${port}/api/info`)).json();
    assert.equal(info.server, true);
    const html = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(html.status, 200);
    assert.ok(!out.includes('自動でもう一度動かします'), out);
    assert.ok(!out.includes('思いがけないエラー'), out);
    // ふつうの WebSocket も つながる
    if (typeof WebSocket !== 'undefined') {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
      const got = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('ws timeout')), 5000);
        ws.onopen = () => ws.send(JSON.stringify({ t: 'hello', pw: 'ちがう' }));
        ws.onmessage = (e) => { clearTimeout(t); resolve(JSON.parse(e.data)); };
      });
      assert.equal(got.t, 'helloFail');
      ws.close();
    }
  } finally {
    proc.kill('SIGINT');
    await new Promise((r) => proc.on('exit', r));
  }
});
