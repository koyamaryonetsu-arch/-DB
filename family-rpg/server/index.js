// きずなの紋章 ― 家族サーバー
// つかいかた: node server/index.js   （Node.js 18 いじょう）
// おなじ Wi-Fi の スマホ・タブレット・PC から ブラウザで つなげる
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { acceptUpgrade } from './ws.js';
import { FileStorage } from './storage.js';
import { GameWorld } from '../public/js/shared/world/world.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));

fs.mkdirSync(DATA_DIR, { recursive: true });

// ───────────── せってい ─────────────
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
let config = {};
try {
  if (fs.existsSync(CONFIG_FILE)) config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.error('config.json の読みこみに失敗しました:', e.message);
}
let changed = false;
if (!config.password) {
  config.password = String(crypto.randomInt(100000, 999999));
  changed = true;
}
if (!config.port) { config.port = 3000; changed = true; }
if (!config.familyName) { config.familyName = 'わが家'; changed = true; }
if (changed) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({
    ...config,
    _memo: 'password = 家族の合言葉（好きな言葉に変えてOK）。port = ポート番号。変えたらサーバーを再起動してね。',
  }, null, 2));
}
const PASSWORD = String(process.env.FAMILY_PASSWORD || config.password);
const PORT = Number(process.env.PORT || config.port || 3000);
const HOST = process.env.HOST || '0.0.0.0';

// ───────────── せかい ─────────────
const storage = new FileStorage(DATA_DIR);
const world = new GameWorld({
  storage,
  offline: false,
  familyName: config.familyName,
  checkPassword: (pw) => safeEqual(pw.normalize('NFKC').trim(), PASSWORD.normalize('NFKC').trim()),
  log: (...a) => console.log(...a),
});

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  const dt = Math.max(0, Math.min(200, now - last));
  last = now;
  try {
    world.tick(dt);
  } catch (e) {
    console.error('tick error', e);
  }
}, 50);

// ───────────── ファイルを くばる ─────────────
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ app: 'kizuna', server: true, family: config.familyName }));
    return;
  }
  let p;
  try {
    p = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('見つかりません');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': st.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });
});

// ───────────── WebSocket ─────────────
const failures = new Map(); // IP → {count, until}
const sockets = new Set();

server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'http://localhost').pathname !== '/ws') {
    socket.destroy();
    return;
  }
  acceptUpgrade(req, socket, head, (ws) => {
    sockets.add(ws);
    const ip = ws.remote || '?';
    const conn = {
      send: (msg) => {
        if (msg.t === 'helloFail') {
          const f = failures.get(ip) || { count: 0, until: 0 };
          f.count++;
          if (f.count >= 8) {
            f.until = Date.now() + 60 * 1000;
            f.count = 0;
          }
          failures.set(ip, f);
        }
        ws.send(JSON.stringify(msg));
      },
    };
    const session = world.connect(conn);
    ws.on('message', (text) => {
      let msg;
      try {
        msg = JSON.parse(text);
      } catch {
        return;
      }
      if (msg?.t === 'hello') {
        const f = failures.get(ip);
        if (f && f.until > Date.now()) {
          ws.send(JSON.stringify({ t: 'helloFail', reason: 'まちがいが多いので1分待ってね' }));
          return;
        }
      }
      try {
        world.handle(session, msg, conn);
      } catch (e) {
        console.error('message error', e);
      }
    });
    ws.on('close', () => {
      sockets.delete(ws);
      world.disconnect(session, conn);
    });
  });
});

// きれた つなぎを かたづける（スマホが スリープしたとき など）
setInterval(() => {
  const now = Date.now();
  for (const ws of sockets) {
    if (now - ws.lastSeen > 65000) ws.close(1001);
    else ws.ping();
  }
}, 20000);

server.listen(PORT, HOST, () => {
  const urls = lanAddresses().map((a) => `http://${a}:${PORT}`);
  console.log('');
  console.log('  ★☆★ 「きずなの紋章」家族サーバーが動きました ★☆★');
  console.log('');
  console.log(`  このPCで遊ぶ:  http://localhost:${PORT}`);
  if (urls.length) {
    console.log('  同じ Wi-Fi のスマホ・タブレットから:');
    for (const u of urls) console.log(`     ${u}`);
  }
  console.log('');
  console.log(`  家族の合言葉:  ${PASSWORD}`);
  console.log(`  （変えるときは ${path.relative(process.cwd(), CONFIG_FILE) || CONFIG_FILE} の password を編集）`);
  console.log('');
  console.log('  終わるときはこの画面で Ctrl + C をおしてね（自動でセーブされます）');
  console.log('');
});

function lanAddresses() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

function shutdown() {
  console.log('\n  セーブして終わります…');
  world.markDirty();
  world.saveNow();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
