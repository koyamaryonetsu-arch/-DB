// きずなの紋章 ― 家族サーバー（本体）
// 起動は node server/index.js（新しい 版の チェックを してから、ここを 動かす）
// おなじ Wi-Fi の スマホ・タブレット・PC から ブラウザで つなげる
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { acceptUpgrade } from './ws.js';
import { FileStorage } from './storage.js';
import { fileSyncStore } from './syncstore.js';
import { clientAddress, isFromInternet, strongEnough, LoginGuard } from './guard.js';
import { findFunnelUrl } from './funnel.js';
import { defaultDataDir, handOverOldSaves } from './savedir.js';
import { readVersion } from './update.js';
import { GameWorld } from '../public/js/shared/world/world.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
// セーブは アプリの フォルダの 外（ホームの kizuna-save）。アプリを 入れかえても のこる
const CUSTOM_DIR = !!process.env.DATA_DIR;
const DATA_DIR = path.resolve(process.env.DATA_DIR || defaultDataDir());

fs.mkdirSync(DATA_DIR, { recursive: true });

// むかしの 版の セーブ（アプリの フォルダの 中の data）を ひっこす
let handOver = { moved: [], from: [], config: false };
if (!CUSTOM_DIR) {
  try {
    handOver = handOverOldSaves({ root: ROOT, dataDir: DATA_DIR });
  } catch (e) {
    console.error('むかしのセーブの引っこしに失敗しました:', e.message);
  }
}

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
  // スマホと キャラを 合わせる ときの 版（kizuna-save/sync/）
  syncStore: fileSyncStore(path.join(DATA_DIR, 'sync')),
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

// ひとりで遊ぶサイト（GitHub Pages）から「家族サーバーは動いている？」を 見られる ように する
const DEFAULT_SITE_ORIGIN = 'https://koyamaryonetsu-arch.github.io';
function siteOrigins() {
  const out = new Set([DEFAULT_SITE_ORIGIN]);
  try {
    if (config.siteUrl) out.add(new URL(config.siteUrl).origin);
  } catch { /* */ }
  return out;
}

// 外出先から つながる アドレス（config.json の publicUrl、または Tailscale Funnel）
let funnel = { installed: false, url: '' };
const publicUrl = () => String(config.publicUrl || funnel.url || '').replace(/\/+$/, '');

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/info') {
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    const origin = String(req.headers.origin || '');
    if (siteOrigins().has(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers.Vary = 'Origin';
    }
    // インターネットからは 家の 中の アドレスを 見せない
    const outside = isFromInternet(req);
    const urls = outside ? [] : [...lanAddresses(), ...tailnetAddresses()].map((a) => `http://${a}:${PORT}`);
    res.writeHead(200, headers);
    res.end(JSON.stringify({ app: 'kizuna', server: true, family: config.familyName, urls, public: strongEnough(PASSWORD) ? publicUrl() : '', site: config.siteUrl || '', version: readVersion(ROOT)?.date || '' }));
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
// 合言葉の まちがいが 続いたら 待ってもらう（server/guard.js）。外からは きびしく、家の Wi-Fi からは やさしく
const guardNet = new LoginGuard();
const guardHome = new LoginGuard({ tries: 8, escalate: false });
const sockets = new Set();
let publicSeen = false;

server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'http://localhost').pathname !== '/ws') {
    socket.destroy();
    return;
  }
  acceptUpgrade(req, socket, head, (ws) => {
    sockets.add(ws);
    // Tailscale Funnel などを 通って きた ときは、本当の アドレスで 見る
    const ip = clientAddress(req) || ws.remote || '?';
    const fromInternet = isFromInternet(req);
    const guard = fromInternet ? guardNet : guardHome;
    const conn = {
      send: (msg) => {
        if (msg.t === 'helloFail' && !msg.code) guard.fail(ip);
        if (msg.t === 'welcome') guard.success(ip);
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
        const g = guard.check(ip);
        if (!g.ok) {
          ws.send(JSON.stringify({ t: 'helloFail', code: 'wait', reason: `合言葉のまちがいが多いので、${Math.ceil(g.wait / 60000)}分待ってからもう一度入れてね` }));
          return;
        }
        // インターネットから（外出先から）は、合言葉が じゅうぶん 長い 時だけ
        if (fromInternet && !strongEnough(PASSWORD)) {
          if (!publicSeen) {
            publicSeen = true;
            console.log('\n  ★ 外出先からアクセスがありましたが、合言葉が短いので入れませんでした。');
            console.log(`    ${CONFIG_FILE} の password を、8文字以上（数字だけはだめ）に変えてサーバーを再起動してね。\n`);
          }
          ws.send(JSON.stringify({ t: 'helloFail', code: 'weak', reason: '外出先から遊ぶには、家のPCで合言葉を8文字以上（数字だけはだめ）に変えてもらってね' }));
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

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n  ポート${PORT}は、ほかのアプリが使っています。`);
    console.error('  家族サーバーがもう動いていないか、たしかめてね（2つめの画面が開いていないか）。');
    console.error(`  ポートを変えるときは ${CONFIG_FILE} の port を編集してね。\n`);
    // 3 … 新しい 版の せいでは ない（前の 版に もどさない）
    process.exit(3);
  }
  throw e;
});

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
  // Tailscale（家族だけの つながり）が あれば、外出先からも つながる
  const far = tailnetAddresses().map((a) => `http://${a}:${PORT}`);
  if (far.length) {
    console.log('  外出先から（スマホの Tailscale をONにして）:');
    for (const u of far) console.log(`     ${u}`);
  }
  console.log('');
  console.log(`  家族の合言葉:  ${PASSWORD}`);
  console.log(`  （変えるときは ${CONFIG_FILE} の password を編集）`);
  console.log('');
  const ver = readVersion(ROOT);
  if (ver?.date) console.log(`  アプリの版:    ${ver.date.slice(0, 10)}（起動のたびに新しい版を調べて、自動で新しくします）`);
  console.log(`  セーブの場所:  ${DATA_DIR}`);
  console.log('  （アプリを新しくしても、ここのセーブはそのまま使えます）');
  if (handOver.moved.length) {
    console.log(`  ★ 前の版のセーブを引っこしました: ${handOver.moved.join('、')}`);
    for (const d of handOver.from) console.log(`     （${d} から。前のセーブも消さずに残してあります）`);
  }
  console.log('');
  console.log('  終わるときはこの画面で Ctrl + C をおしてね（自動でセーブされます）');
  console.log('');
  // 外出先から（スマホに アプリなしで）つながるか: Tailscale Funnel を しらべる
  checkFunnel(true);
});

async function checkFunnel(print) {
  try {
    funnel = await findFunnelUrl(PORT);
  } catch {
    funnel = { installed: false, url: '' };
  }
  if (!print) return;
  const pub = publicUrl();
  if (pub) {
    console.log('  ★ 外出先から（スマホにアプリはいりません）:');
    console.log(`     ${pub}`);
    if (!strongEnough(PASSWORD)) {
      console.log('     ※ いまの合言葉は短いので、外出先からは入れません。');
      console.log(`       ${CONFIG_FILE} の password を 8文字以上（数字だけはだめ）に変えて、サーバーを再起動してね。`);
    }
    console.log('');
  } else if (funnel.installed) {
    console.log('  （外出先からも遊ぶ時は、funnel-on をダブルクリック → サーバーを再起動）');
    console.log('');
  }
}
// あとから Funnel を ON に した ときも わかる ように
setInterval(() => checkFunnel(false), 5 * 60 * 1000).unref();

// Tailscale の アドレス（100.64.0.0/10）
const isTailnet = (ip) => {
  const [a, b] = ip.split('.').map(Number);
  return a === 100 && b >= 64 && b <= 127;
};

function ipv4s() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family === 'IPv4' && !a.internal) out.push(a.address);
    }
  }
  return out;
}

// 家の Wi-Fi の アドレス
function lanAddresses() {
  return ipv4s().filter((ip) => !isTailnet(ip));
}

// 外出先から つながる アドレス（Tailscale）
function tailnetAddresses() {
  return ipv4s().filter(isTailnet);
}

function shutdown() {
  console.log('\n  セーブして終わります…');
  world.markDirty();
  world.saveNow();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
