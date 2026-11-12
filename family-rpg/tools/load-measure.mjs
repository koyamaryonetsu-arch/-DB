// はじめの 読みこみを はかる（家族サーバー ＋ スマホの 回線の まね）
//
// つかいかた:
//   node tools/load-measure.mjs [--net 4g,slow4g] [--cpu 4] [--out 結果.json] [--http] [--nopack] [--keep]
//
// ・この フォルダの public/ と server/ を 一時フォルダに コピーして 家族サーバーを 立てる
//   （自動更新は 切る。version.json は にせの sha）
// ・外出先（Tailscale Funnel）の まね: https ＋ HTTP/2 の 入り口（自分で 作った 証明書）を 前に おき、
//   さらに その 前に「回線の しぼり」を おく（下りの 速さ・おうふくの 時間。TCP の 中みを 遅らせる）
//   ※ ブラウザの CDP の しぼりは ページの 通信だけで、Service Worker の 通信には かからない。
//     前と 後を 同じ 条件で くらべる ため、回線そのものを まねる
//   --http: https を 使わず http/1.1 で（家の Wi-Fi の まね。Service Worker は localhost なので 動く）
// ・3つの 場面: はじめて（キャッシュ 空）→ 2回目（開きなおし）→ 更新の あと（版が かわり、5ファイルだけ 中みが かわる）
// ・はかる もの: 通信の 回数（サーバーに とどいた 数）・送られた バイト（回線の 上の 下り）・
//   タイトル画面（.title-screen）が 出る までの 時間・JS を 動かした 時間（CDP の ScriptDuration）
// ・--cpu 4: CPU を 4倍 おそく（スマホの まね）
// ・Playwright と chromium は 下の PW / CHROME（かんきょう変数 PLAYWRIGHT_MJS / CHROME_PATH で かえられる）
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import http from 'node:http';
import http2 from 'node:http2';
import crypto from 'node:crypto';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PW = process.env.PLAYWRIGHT_MJS || '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';

export const NETS = {
  // 下り・上り（bit/秒）・おうふくの 時間（ms）
  '4g': { label: '4G（下り9Mbps・170ms）', down: 9e6, up: 4e6, rtt: 170 },
  slow4g: { label: 'おそい4G（下り1.6Mbps・300ms）', down: 1.6e6, up: 0.75e6, rtt: 300 },
  lan: { label: '家のWi-Fi（しぼりなし）', down: 0, up: 0, rtt: 0 },
};

// ───── 回線の しぼり（TCP の 中みを 遅らせる。下り・上りは つなぎ全部で 1本の 線を わけあう） ─────
export function createShaper(target, prof) {
  const stats = { down: 0, up: 0 };
  const bucket = { down: 0, up: 0 };
  const half = prof.rtt / 2;
  const reserve = (dir, n) => {
    const bps = prof[dir];
    const now = Date.now();
    if (!bps) return now;
    const start = Math.max(now, bucket[dir]);
    bucket[dir] = start + (n * 8 * 1000) / bps;
    return bucket[dir];
  };
  const pipe = (src, dst, dir) => {
    let last = 0;
    let ended = false;
    const later = (fn, at) => {
      last = Math.max(at, last);
      const ms = last - Date.now();
      if (ms <= 0) fn(); else setTimeout(fn, ms);
    };
    src.on('data', (c) => {
      stats[dir] += c.length;
      later(() => { if (!dst.destroyed) dst.write(c); }, reserve(dir, c.length) + half);
    });
    src.on('end', () => { if (!ended) { ended = true; later(() => dst.end(), Date.now() + half); } });
    src.on('error', () => later(() => dst.destroy(), Date.now() + half));
    src.on('close', () => later(() => dst.destroy(), Date.now() + half));
  };
  const server = net.createServer((client) => {
    const up = net.connect(target, '127.0.0.1');
    pipe(client, up, 'up');
    pipe(up, client, 'down');
  });
  return { server, stats };
}

// ───── https ＋ HTTP/2 の 入り口（Tailscale Funnel の まね） ─────
function makeCert(dir) {
  const key = path.join(dir, 'key.pem');
  const cert = path.join(dir, 'cert.pem');
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '2', '-subj', '/CN=localhost'], { stdio: 'ignore' });
  // 証明書の 公開かぎの ハッシュ（chromium に「この 証明書は 正しい」と 教える。まちがいと 見ると キャッシュしない ため）
  const pub = execFileSync('openssl', ['x509', '-in', cert, '-pubkey', '-noout']);
  const der = execFileSync('openssl', ['pkey', '-pubin', '-outform', 'der'], { input: pub });
  const spki = crypto.createHash('sha256').update(der).digest('base64');
  return { key: fs.readFileSync(key), cert: fs.readFileSync(cert), spki };
}

const HOP = new Set(['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection', 'http2-settings', 'te', 'host']);
export function createFront(backend, { tls } = {}) {
  const log = { requests: 0, paths: [], inflight: 0, lastAt: 0 };
  const handler = (req, res) => {
    log.requests++;
    log.inflight++;
    log.paths.push(req.url);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) if (!k.startsWith(':') && !HOP.has(k)) headers[k] = v;
    headers.host = `127.0.0.1:${backend}`;
    const done = () => { log.inflight--; log.lastAt = Date.now(); };
    const p = http.request({ host: '127.0.0.1', port: backend, method: req.method, path: req.url, headers }, (r) => {
      const h = {};
      for (const [k, v] of Object.entries(r.headers)) if (!HOP.has(k)) h[k] = v;
      res.writeHead(r.statusCode, h);
      r.pipe(res);
      r.on('end', done);
      r.on('error', done);
    });
    p.on('error', () => { done(); try { res.writeHead(502); res.end(); } catch { /* */ } });
    req.pipe(p);
  };
  const server = tls ? http2.createSecureServer({ key: tls.key, cert: tls.cert, allowHTTP1: true }, handler) : http.createServer(handler);
  // WebSocket（HTTP/1.1 の upgrade）は そのまま つなぐ
  server.on('upgrade', (req, socket, head) => {
    const b = net.connect(backend, '127.0.0.1', () => {
      const lines = [`${req.method} ${req.url} HTTP/1.1`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
      b.write(lines.join('\r\n') + '\r\n\r\n');
      if (head?.length) b.write(head);
      socket.pipe(b).pipe(socket);
    });
    b.on('error', () => socket.destroy());
    socket.on('error', () => b.destroy());
  });
  return { server, log };
}

const listen = (srv) => new Promise((ok) => srv.listen(0, '127.0.0.1', () => ok(srv.address().port)));
async function freePort() {
  const s = net.createServer();
  const p = await listen(s);
  await new Promise((ok) => s.close(ok));
  return p;
}

// ───── 家族サーバー（一時フォルダの コピー） ─────
function copyApp(dir) {
  for (const d of ['public', 'server']) fs.cpSync(path.join(ROOT, d), path.join(dir, d), { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'package.json'), path.join(dir, 'package.json'));
}
function writeVersion(dir, sha) {
  fs.writeFileSync(path.join(dir, 'version.json'), JSON.stringify({ sha, date: new Date().toISOString(), branch: 'measure' }));
}
async function startServer(app, data, port) {
  const env = { ...process.env, DATA_DIR: data, PORT: String(port), HOST: '127.0.0.1', KIZUNA_NO_UPDATE: '1', FAMILY_PASSWORD: 'はかるためのあいことば' };
  const proc = spawn(process.execPath, [path.join(app, 'server', 'index.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let out = '';
  proc.stdout.on('data', (d) => { out += d; });
  proc.stderr.on('data', (d) => { out += d; });
  for (let i = 0; i < 300 && !out.includes('動きました'); i++) await new Promise((r) => setTimeout(r, 100));
  if (!out.includes('動きました')) throw new Error(`サーバーが動きません:\n${out}`);
  return proc;
}
const stopServer = (proc) => new Promise((ok) => { proc.once('exit', ok); proc.kill('SIGTERM'); setTimeout(ok, 5000); });

// 更新の あと: 5つの ファイルの 中みを かえる（ゲームの データ・画面の 部品など、読みこみの 深い 所）
export const CHANGED = [
  'public/js/client/ui/title.js', 'public/js/client/battle.js', 'public/js/shared/data/items.js',
  'public/js/shared/data/monsters.js', 'public/js/shared/world/world.js',
];
function changeFiles(app, tag) {
  for (const f of CHANGED) fs.appendFileSync(path.join(app, f), `\n// measure ${tag}\n`);
}

// ───── 1回 はかる ─────
const TITLE_WATCH = `(() => {
  const mark = () => {
    if (window.__titleAt == null && document.querySelector('.title-screen')) { window.__titleAt = performance.now(); obs.disconnect(); }
  };
  const obs = new MutationObserver(mark);
  obs.observe(document, { childList: true, subtree: true });
})();`;

async function quiet(log, ms = 1500, max = 120000) {
  const t0 = Date.now();
  while (Date.now() - t0 < max) {
    if (log.inflight === 0 && Date.now() - log.lastAt > ms) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

async function visit(context, url, front, shaper, { cpu = 1 } = {}) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const fontPaths = () => front.log.paths.filter((p) => p.includes('/fonts/')).length;
  front.log.requests = 0;
  front.log.paths = [];
  const b0 = { ...shaper.stats };
  await page.goto(url, { waitUntil: 'commit', timeout: 600000 });
  await page.waitForFunction(() => window.__titleAt != null, null, { timeout: 600000, polling: 100 });
  const titleMs = await page.evaluate(() => window.__titleAt);
  const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((x) => [x.name, x.value]));
  const atTitle = { requests: front.log.requests, bytes: shaper.stats.down - b0.down };
  await quiet(front.log);
  const r = {
    titleMs: Math.round(titleMs),
    requests: front.log.requests,
    bytes: shaper.stats.down - b0.down,
    upBytes: shaper.stats.up - b0.up,
    atTitle,
    fontRequests: fontPaths(),
    scriptMs: Math.round((m.ScriptDuration || 0) * 1000),
    taskMs: Math.round((m.TaskDuration || 0) * 1000),
    sw: await page.evaluate(() => !!navigator.serviceWorker?.controller).catch(() => false),
    errors,
  };
  await page.close();
  return r;
}

export async function measure({ nets = ['4g', 'slow4g'], cpu = 1, useHttp = false, nopack = false, keep = false, log = console.log } = {}) {
  const { chromium } = await import(pathToFileURL(PW).href);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-measure-'));
  const tls = useHttp ? null : makeCert(tmp);
  const browser = await chromium.launch({ executablePath: CHROME, args: tls ? [`--ignore-certificate-errors-spki-list=${tls.spki}`] : [] });
  const results = {};
  try {
    for (const name of nets) {
      const prof = NETS[name];
      const app = path.join(tmp, `app-${name}`);
      const data = path.join(tmp, `data-${name}`);
      copyApp(app);
      writeVersion(app, `measure0000000000000000000000000000${name}`.slice(-40));
      const srvPort = await freePort();
      let proc = await startServer(app, data, srvPort);
      const front = createFront(srvPort, { tls });
      const frontPort = await listen(front.server);
      const shaper = createShaper(frontPort, prof);
      const shapePort = await listen(shaper.server);
      const url = `${tls ? 'https' : 'http'}://localhost:${shapePort}/${nopack ? '?nopack' : ''}`;
      const context = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
      await context.addInitScript(TITLE_WATCH);
      const row = {};
      log(`-- ${prof.label} ${url}`);
      row.first = await visit(context, url, front, shaper, { cpu });
      log('  はじめて', JSON.stringify(row.first));
      row.second = await visit(context, url, front, shaper, { cpu });
      log('  2回目  ', JSON.stringify(row.second));
      await stopServer(proc);
      changeFiles(app, name);
      writeVersion(app, `measure1111111111111111111111111111${name}`.slice(-40));
      proc = await startServer(app, data, srvPort);
      row.update = await visit(context, url, front, shaper, { cpu });
      log('  更新あと', JSON.stringify(row.update));
      await context.close();
      await stopServer(proc);
      shaper.server.close();
      front.server.close();
      results[name] = row;
    }
  } finally {
    await browser.close();
    if (!keep) fs.rmSync(tmp, { recursive: true, force: true });
  }
  return results;
}

// ───── 表に する ─────
const mb = (n) => `${(n / 1048576).toFixed(2)}MB`;
const sec = (ms) => `${(ms / 1000).toFixed(1)}秒`;
export function table(results) {
  const lines = ['| 回線 | 場面 | 通信の回数 | 送られたバイト | タイトルまで | JSの時間 |', '|---|---|---:|---:|---:|---:|'];
  const names = { first: 'はじめて', second: '2回目', update: '更新のあと' };
  for (const [n, row] of Object.entries(results)) {
    for (const k of ['first', 'second', 'update']) {
      const r = row[k];
      if (!r) continue;
      lines.push(`| ${NETS[n].label} | ${names[k]} | ${r.requests} | ${mb(r.bytes)} | ${sec(r.titleMs)} | ${sec(r.scriptMs)} |`);
    }
  }
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
  const nets = String(opt('--net', '4g,slow4g')).split(',').filter((n) => NETS[n]);
  const res = await measure({ nets, cpu: Number(opt('--cpu', 1)), useHttp: args.includes('--http'), nopack: args.includes('--nopack'), keep: args.includes('--keep') });
  console.log('\n' + table(res));
  const out = opt('--out', '');
  if (out) fs.writeFileSync(out, JSON.stringify(res, null, 2));
}
