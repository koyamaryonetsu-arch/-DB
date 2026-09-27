// 外出先から 開ける とき（Tailscale Funnel）の まもり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import crypto from 'node:crypto';
import path from 'node:path';
import { clientAddress, isPublicAddress, isFromInternet, inCidr, strongEnough, LoginGuard } from '../server/guard.js';
import { findFunnelUrl } from '../server/funnel.js';
import { siteServerAddress } from '../public/js/client/links.js';

test('まもり: だれから の アクセスか（Funnel を 通った ときだけ X-Forwarded-For を 信じる）', () => {
  const req = (remote, xff) => ({ socket: { remoteAddress: remote }, headers: xff ? { 'x-forwarded-for': xff } : {} });
  assert.equal(clientAddress(req('127.0.0.1', '203.0.113.9, 10.0.0.1')), '203.0.113.9');
  assert.equal(clientAddress(req('::ffff:127.0.0.1', '198.51.100.7')), '198.51.100.7');
  assert.equal(clientAddress(req('192.168.1.20', '8.8.8.8')), '192.168.1.20', '家の Wi-Fi からの うそは 信じない');
  assert.equal(clientAddress(req('::ffff:192.168.1.20')), '192.168.1.20');
  for (const ip of ['192.168.1.2', '10.1.2.3', '172.20.0.5', '127.0.0.1', '100.101.102.103', '::1', 'fd7a:115c:a1e0::1', 'fe80::1']) assert.equal(isPublicAddress(ip), false, ip);
  for (const ip of ['203.0.113.9', '8.8.8.8', '172.40.0.1', '2001:db8::1']) assert.equal(isPublicAddress(ip), true, ip);
});

test('まもり: 家の ネットワーク（この PC と おなじ）からは 外あつかいに しない', () => {
  const ifaces = {
    eth0: [{ address: '203.0.113.5', family: 'IPv4', cidr: '203.0.113.5/24' }],
    wlan0: [{ address: '2001:db8:1:2::10', family: 'IPv6', cidr: '2001:db8:1:2::10/64' }, { address: 'fe80::1', family: 'IPv6', cidr: 'fe80::1/64', scopeid: 3 }],
  };
  assert.equal(inCidr('192.168.1.20', '192.168.1.0/24'), true);
  assert.equal(inCidr('192.168.2.20', '192.168.1.0/24'), false);
  assert.equal(inCidr('10.1.2.3', '10.0.0.0/8'), true);
  assert.equal(inCidr('172.20.10.3', '172.20.10.1/28'), true);
  assert.equal(inCidr('172.20.10.30', '172.20.10.1/28'), false);
  assert.equal(inCidr('2001:db8:1:2:abcd::1', '2001:db8:1:2::10/64'), true);
  assert.equal(inCidr('2001:db8:1:3::1', '2001:db8:1:2::10/64'), false);
  assert.equal(inCidr('::ffff:192.168.1.9', '192.168.1.0/24'), true);
  assert.equal(inCidr('1.2.3.4', '2001:db8::/32'), false);
  assert.equal(inCidr('fe80::abcd%en0', 'fe80::1/64'), true);
  const req = (remote, xff) => ({ socket: { remoteAddress: remote }, headers: xff ? { 'x-forwarded-for': xff } : {} });
  assert.equal(isFromInternet(req('192.168.1.20'), ifaces), false);
  assert.equal(isFromInternet(req('203.0.113.77'), ifaces), false, 'めずらしい アドレスの 家の Wi-Fi');
  assert.equal(isFromInternet(req('2001:db8:1:2::99'), ifaces), false, 'IPv6 で 家の Wi-Fi から');
  assert.equal(isFromInternet(req('198.51.100.7'), ifaces), true, 'ルーターの ポートを 開けて じかに');
  assert.equal(isFromInternet(req('2001:db8:9::1'), ifaces), true);
  assert.equal(isFromInternet(req('127.0.0.1', '203.0.113.77'), ifaces), true, 'Funnel を 通ったら 外');
  assert.equal(isFromInternet(req('127.0.0.1', '192.168.1.20'), ifaces), false);
  assert.equal(isFromInternet(req('127.0.0.1'), ifaces), false, 'この PC');
});

test('まもり: 外出先から 入れる 合言葉の 長さ', () => {
  assert.equal(strongEnough('482915'), false, '6けたの 数字');
  assert.equal(strongEnough('12345678'), false, '数字だけ 8けた');
  assert.equal(strongEnough('ほしぞら'), false);
  assert.equal(strongEnough('ほしぞらのきずな'), true, 'ひらがな 8文字');
  assert.equal(strongEnough('kizuna-2026'), true);
  assert.equal(strongEnough('123456789012'), true, '12けた いじょう');
});

test('まもり: 5回 まちがえると 1分、その あとも まちがえるたびに 2倍（さいだい 1時間）', () => {
  const g = new LoginGuard();
  const t0 = 1_000_000;
  for (let i = 0; i < 4; i++) g.fail('A', t0);
  assert.equal(g.check('A', t0).ok, true);
  g.fail('A', t0);
  assert.equal(g.check('A', t0).ok, false);
  assert.equal(g.check('A', t0 + 61 * 1000).ok, true, '1分で とける');
  g.fail('A', t0 + 61 * 1000);
  const w = g.check('A', t0 + 61 * 1000).wait;
  assert.ok(w > 110 * 1000 && w <= 120 * 1000, `2回め は 2分: ${w}`);
  assert.equal(g.check('B', t0).ok, true, 'ほかの 人は 入れる');
  g.success('A');
  assert.equal(g.check('A', t0 + 62 * 1000).ok, true, '入れたら わすれる');
  let e;
  for (let i = 0; i < 40; i++) e = g.fail('C', t0);
  assert.ok(e.until - t0 <= 60 * 60 * 1000);
  // 家の Wi-Fi: 8回で 1分。1分 たてば また 8回 ためせる（のびない）
  const h = new LoginGuard({ tries: 8, escalate: false });
  for (let i = 0; i < 7; i++) h.fail('K', t0);
  assert.equal(h.check('K', t0).ok, true);
  h.fail('K', t0);
  assert.equal(h.check('K', t0).ok, false);
  const t1 = t0 + 61 * 1000;
  assert.equal(h.check('K', t1).ok, true);
  h.fail('K', t1);
  assert.equal(h.check('K', t1).ok, true, '1回 まちがえた だけでは 待たない');
  for (let i = 0; i < 7; i++) h.fail('K', t1);
  assert.ok(h.check('K', t1).wait <= 60 * 1000, 'また 1分');
});

test('まもり: Tailscale Funnel の アドレスを しらべる', async () => {
  const conf = {
    TCP: { 443: { HTTPS: true } },
    Web: { 'my-pc.tail1234.ts.net:443': { Handlers: { '/': { Proxy: 'http://127.0.0.1:3000' } } } },
    AllowFunnel: { 'my-pc.tail1234.ts.net:443': true },
  };
  const found = await findFunnelUrl(3000, { runImpl: async () => JSON.stringify(conf), candidates: ['tailscale'] });
  assert.deepEqual(found, { installed: true, url: 'https://my-pc.tail1234.ts.net' });
  const other = await findFunnelUrl(4000, { runImpl: async () => JSON.stringify(conf), candidates: ['tailscale'] });
  assert.equal(other.url, '', 'ちがう ポートの Funnel は つかわない');
  const off = await findFunnelUrl(3000, { runImpl: async () => '{}', candidates: ['tailscale'] });
  assert.deepEqual(off, { installed: true, url: '' });
  const none = await findFunnelUrl(3000, { runImpl: async () => null, candidates: ['tailscale', 'x'] });
  assert.deepEqual(none, { installed: false, url: '' });
});

// WebSocket（X-Forwarded-For を つけられる 小さな クライアント）
function rawWs(port, headers = {}) {
  return new Promise((resolve, reject) => {
    const sock = net.connect(port, '127.0.0.1');
    const key = crypto.randomBytes(16).toString('base64');
    let buf = Buffer.alloc(0);
    let open = false;
    const inbox = [];
    const api = {
      inbox,
      send(obj) {
        const data = Buffer.from(JSON.stringify(obj));
        const mask = crypto.randomBytes(4);
        let head;
        if (data.length < 126) head = Buffer.from([0x81, 0x80 | data.length]);
        else {
          head = Buffer.alloc(4);
          head[0] = 0x81;
          head[1] = 0x80 | 126;
          head.writeUInt16BE(data.length, 2);
        }
        sock.write(Buffer.concat([head, mask, Buffer.from(data.map((b, i) => b ^ mask[i % 4]))]));
      },
      wait(pred, ms = 4000) {
        return new Promise((ok, ng) => {
          const t0 = Date.now();
          const iv = setInterval(() => {
            const m = inbox.find(pred);
            if (m) {
              clearInterval(iv);
              inbox.splice(inbox.indexOf(m), 1);
              ok(m);
            } else if (Date.now() - t0 > ms) {
              clearInterval(iv);
              ng(new Error('timeout'));
            }
          }, 15);
        });
      },
      close: () => sock.destroy(),
    };
    sock.on('connect', () => {
      const extra = Object.entries(headers).map(([k, v]) => `${k}: ${v}\r\n`).join('');
      sock.write(`GET /ws HTTP/1.1\r\nHost: 127.0.0.1:${port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n${extra}\r\n`);
    });
    sock.on('data', (d) => {
      buf = Buffer.concat([buf, d]);
      if (!open) {
        const i = buf.indexOf('\r\n\r\n');
        if (i < 0) return;
        open = true;
        buf = buf.subarray(i + 4);
        resolve(api);
      }
      while (buf.length >= 2) {
        let len = buf[1] & 127;
        let off = 2;
        if (len === 126) {
          if (buf.length < 4) return;
          len = buf.readUInt16BE(2);
          off = 4;
        } else if (len === 127) {
          if (buf.length < 10) return;
          len = Number(buf.readBigUInt64BE(2));
          off = 10;
        }
        if (buf.length < off + len) return;
        const op = buf[0] & 15;
        const payload = buf.subarray(off, off + len);
        buf = buf.subarray(off + len);
        if (op === 1) inbox.push(JSON.parse(payload.toString()));
      }
    });
    sock.on('error', reject);
  });
}

async function startServer(password, config = null) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-guard-'));
  if (config) fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(config));
  const port = 3700 + Math.floor(Math.random() * 90);
  const proc = spawn(process.execPath, ['server/index.js'], {
    env: { ...process.env, DATA_DIR: dir, PORT: String(port), FAMILY_PASSWORD: password, HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 8000);
    proc.stdout.on('data', (d) => {
      out += String(d);
      if (out.includes('動きました')) {
        clearTimeout(t);
        resolve();
      }
    });
    proc.on('exit', (c) => reject(new Error('exit ' + c)));
  });
  return {
    port,
    out: () => out,
    stop: async () => {
      proc.kill('SIGINT');
      await new Promise((r) => proc.on('exit', r));
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

test('まもり: 外出先からは 合言葉が 短いと 入れない（家の Wi-Fi からは 入れる）', { timeout: 30000 }, async () => {
  const srv = await startServer('ほし123');
  try {
    const far = await rawWs(srv.port, { 'X-Forwarded-For': '203.0.113.9' });
    far.send({ t: 'hello', pw: 'ほし123' });
    const m = await far.wait((x) => x.t === 'helloFail' || x.t === 'welcome');
    assert.equal(m.t, 'helloFail');
    assert.equal(m.code, 'weak');
    far.close();
    const home = await rawWs(srv.port);
    home.send({ t: 'hello', pw: 'ほし123' });
    assert.equal((await home.wait((x) => x.t === 'helloFail' || x.t === 'welcome')).t, 'welcome');
    home.close();
    // 外からは 家の 中の アドレスを 見せない。ひとりで遊ぶサイトからは 動いているか 見られる
    const info = await fetch(`http://127.0.0.1:${srv.port}/api/info`, { headers: { 'X-Forwarded-For': '203.0.113.9', Origin: 'https://koyamaryonetsu-arch.github.io' } });
    assert.equal(info.headers.get('access-control-allow-origin'), 'https://koyamaryonetsu-arch.github.io');
    assert.deepEqual((await info.json()).urls, []);
    const evil = await fetch(`http://127.0.0.1:${srv.port}/api/info`, { headers: { Origin: 'https://evil.example.com' } });
    assert.equal(evil.headers.get('access-control-allow-origin'), null);
  } finally {
    await srv.stop();
  }
});

test('まもり: まちがいが 続いた アドレスは 待ってもらう（ほかの 人は 入れる）', { timeout: 30000 }, async () => {
  const srv = await startServer('ほしぞらのきずな');
  try {
    const bad = await rawWs(srv.port, { 'X-Forwarded-For': '198.51.100.7' });
    for (let i = 0; i < 5; i++) {
      bad.send({ t: 'hello', pw: `ちがう${i}` });
      const m = await bad.wait((x) => x.t === 'helloFail');
      assert.ok(!m.code, 'まちがい');
    }
    bad.send({ t: 'hello', pw: 'ほしぞらのきずな' });
    const locked = await bad.wait((x) => x.t === 'helloFail' || x.t === 'welcome');
    assert.equal(locked.t, 'helloFail');
    assert.equal(locked.code, 'wait', '正しい 合言葉でも しばらくは 入れない');
    bad.close();
    const family = await rawWs(srv.port, { 'X-Forwarded-For': '198.51.100.8' });
    family.send({ t: 'hello', pw: 'ほしぞらのきずな' });
    assert.equal((await family.wait((x) => x.t === 'helloFail' || x.t === 'welcome')).t, 'welcome', '家族は 入れる');
    family.close();
  } finally {
    await srv.stop();
  }
});

test('まもり: 外出先からの アドレス（https）は 合言葉が じゅうぶん 長い 時だけ サイトに 教える', { timeout: 30000 }, async () => {
  const FUN = 'https://my-pc.tail1234.ts.net';
  for (const [pw, want] of [['ほし123', ''], ['ほしぞらのきずな', FUN]]) {
    const srv = await startServer(pw, { publicUrl: FUN });
    try {
      const info = await (await fetch(`http://127.0.0.1:${srv.port}/api/info`)).json();
      assert.equal(info.public, want, pw);
    } finally {
      await srv.stop();
    }
  }
  // サイトに 覚えてもらう アドレス: https の アドレスが あれば そちら、なければ 家の アドレス
  const home = { origin: 'http://192.168.1.23:3000' };
  assert.equal(siteServerAddress({ public: FUN, urls: ['http://192.168.1.23:3000'] }, home), FUN);
  assert.equal(siteServerAddress({ public: '', urls: ['http://192.168.1.23:3000'] }, home), 'http://192.168.1.23:3000');
  assert.equal(siteServerAddress({ public: '', urls: ['http://192.168.1.23:3000'] }, { origin: 'http://localhost:3000' }), 'http://192.168.1.23:3000');
});
