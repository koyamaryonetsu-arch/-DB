// 第78回: はじめの 読みこみを 速く する
// ・家族サーバー: 圧縮（gzip・brotli）・ETag／304・版つきの 読みこみ（?v=）と 1年の キャッシュ
// ・版が ちがう 要求には 今の 中みを 返すが とっておかせない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import zlib from 'node:zlib';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stampImports, stampHtml, stampable } from '../server/stamp.js';
import { createStatic, pickEncoding, fingerprint, IMMUTABLE, buildPack, listPackFiles } from '../server/static.js';
import { contentHash } from '../server/stamp.js';
import { kizunaBoot } from '../server/boot-loader.js';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function freePort() {
  return new Promise((ok) => {
    const s = net.createServer();
    s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => ok(p)); });
  });
}

// 家族サーバーを 立てる（自動更新は 切る）
async function startServer() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-r78-'));
  const port = await freePort();
  const proc = spawn(process.execPath, ['server/index.js'], {
    cwd: ROOT,
    env: { ...process.env, DATA_DIR: dir, PORT: String(port), FAMILY_PASSWORD: 'ほしのきずな12', HOST: '127.0.0.1', KIZUNA_NO_UPDATE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let out = '';
  proc.stdout.on('data', (d) => { out += String(d); });
  proc.stderr.on('data', (d) => { out += String(d); });
  for (let i = 0; i < 150 && !out.includes('動きました'); i++) await new Promise((r) => setTimeout(r, 100));
  assert.ok(out.includes('動きました'), out);
  const stop = () => new Promise((ok) => { proc.once('exit', ok); proc.kill('SIGTERM'); setTimeout(ok, 3000); });
  return { base: `http://127.0.0.1:${port}`, stop, dir };
}

// 生の へんじ（fetch は ちぢめた 中みを 自動で もどすので、http で 見る）
import http from 'node:http';
function raw(url, headers = {}) {
  return new Promise((ok, ng) => {
    http.get(url, { headers }, (res) => {
      const bufs = [];
      res.on('data', (d) => bufs.push(d));
      res.on('end', () => ok({ status: res.statusCode, headers: res.headers, body: Buffer.concat(bufs) }));
    }).on('error', ng);
  });
}
const unzip = (r) => {
  const enc = r.headers['content-encoding'];
  if (enc === 'br') return zlib.brotliDecompressSync(r.body).toString('utf8');
  if (enc === 'gzip') return zlib.gunzipSync(r.body).toString('utf8');
  return r.body.toString('utf8');
};

test('stampImports: from・import()・import \'…\' の 相対パスに ?v= を つける（ほかは さわらない）', () => {
  const src = [
    "import { a } from './a.js';",
    'import b from "../b/c.js";',
    "import './side.js';",
    "const m = await import('./lazy.js');",
    "const n = await import( '../x/y.js' );",
    "import t from '../../vendor/three.min.js';",
    "import z from 'zlib';",
    "const s = 'not ./a.js';",
    "import q from './q.js?v=old';",
  ].join('\n');
  const out = stampImports(src, 'V1');
  assert.match(out, /from '\.\/a\.js\?v=V1'/);
  assert.match(out, /from "\.\.\/b\/c\.js\?v=V1"/);
  assert.match(out, /import '\.\/side\.js\?v=V1'/);
  assert.match(out, /import\('\.\/lazy\.js\?v=V1'\)/);
  assert.match(out, /import\( '\.\.\/x\/y\.js\?v=V1' \)/);
  assert.match(out, /three\.min\.js\?v=V1/);
  assert.match(out, /from 'zlib'/);
  assert.match(out, /'not \.\/a\.js'/);
  assert.match(out, /'\.\/q\.js\?v=old'/, 'もう ついている ものは そのまま');
  // ?v= を とれば もとに もどる（中みは かえない）
  assert.equal(out.replaceAll('?v=V1', ''), src);
  assert.equal(stampable('js/main.js'), true);
  assert.equal(stampable('vendor/three.min.js'), false);
  assert.equal(stampable('sw.js'), false);
  assert.equal(stampable('css/style.css'), false);
  const html = stampHtml(fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8'), 'V1', '2026-01-01');
  assert.match(html, /'js\/main\.js\?v=' \+ c\.v/);
  assert.match(html, /"v":"V1"/);
  assert.doesNotMatch(html, /<script type="module" src="js\/main\.js">/);
  assert.match(html, /css\/style\.css\?v=V1/);
  assert.match(html, /css\/fonts\.css\?v=V1/);
});

test('client の 中に、文書からの 相対パスで JS を 読む 所が ない（?v= が つかない 読みこみが ない）', () => {
  const files = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith('.js')) files.push(p);
    }
  };
  walk(path.join(ROOT, 'public', 'js'));
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    // import() は './' か '../' で はじまる 文字だけ（変数・文書からの パスは だめ）
    for (const m of src.matchAll(/\bimport\s*\(\s*([^)]*)\)/g)) {
      assert.match(m[1], /^['"]\.{1,2}\//, `${path.relative(ROOT, f)}: import(${m[1]})`);
    }
    assert.doesNotMatch(src, /fetch\(\s*['"`]js\//, path.relative(ROOT, f));
    assert.doesNotMatch(src, /new (Shared)?Worker\(/, path.relative(ROOT, f));
  }
});

test('pickEncoding: br → gzip → なし（q=0 は 使わない）', () => {
  assert.equal(pickEncoding('gzip, deflate, br'), 'br');
  assert.equal(pickEncoding('gzip'), 'gzip');
  assert.equal(pickEncoding('br;q=0, gzip'), 'gzip');
  assert.equal(pickEncoding(''), '');
  assert.equal(pickEncoding(undefined), '');
  assert.equal(pickEncoding('identity'), '');
});

test('版: version.json の sha。開発中や ファイルが かわった 時は ファイルの ようすから 作る（かわれば 版も かわる）', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kizuna-r78v-'));
  fs.mkdirSync(path.join(dir, 'js'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<script type="module" src="js/main.js"></script>');
  fs.writeFileSync(path.join(dir, 'js', 'main.js'), "import './a.js';\n");
  fs.writeFileSync(path.join(dir, 'js', 'a.js'), 'export const a = 1;\n');
  const withSha = createStatic({ root: dir, sha: 'abcdef1234567890abcd' });
  assert.equal(withSha.version(true), 'abcdef123456');
  const dev = createStatic({ root: dir });
  const v1 = dev.version(true);
  assert.match(v1, /^d[0-9a-f]{8}$/);
  assert.equal(fingerprint(dir), fingerprint(dir));
  // ファイルが かわる → 版が かわる（sha が あっても）
  const t = new Date(Date.now() + 5000);
  fs.writeFileSync(path.join(dir, 'js', 'a.js'), 'export const a = 22;\n');
  fs.utimesSync(path.join(dir, 'js', 'a.js'), t, t);
  const v2 = dev.version(true);
  assert.notEqual(v2, v1);
  const s2 = withSha.version(true);
  assert.notEqual(s2, 'abcdef123456');
  assert.ok(s2.startsWith('abcdef'), s2);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('家族サーバー: 圧縮・ETag／304・版つきの キャッシュ・版が ちがう 時', { timeout: 60000 }, async () => {
  const srv = await startServer();
  try {
    const br = { 'Accept-Encoding': 'gzip, deflate, br' };
    // index.html: 毎回 たしかめる・版つきの 読みこみ・ちぢめる
    const idx = await raw(`${srv.base}/`, br);
    assert.equal(idx.status, 200);
    assert.equal(idx.headers['cache-control'], 'no-cache');
    assert.equal(idx.headers['content-encoding'], 'br');
    assert.match(idx.headers.vary, /Accept-Encoding/);
    const html = unzip(idx);
    const v = html.match(/KIZUNA_VERSION = \{"v":"([A-Za-z0-9]+)"/)?.[1];
    assert.ok(v, html);
    assert.match(html, new RegExp(`css/style\\.css\\?v=${v}`));
    // ETag → 304
    const again = await raw(`${srv.base}/`, { ...br, 'If-None-Match': idx.headers.etag });
    assert.equal(again.status, 304);
    assert.equal(again.body.length, 0);
    // ?v= が 今の 版: 1年 とっておける・import にも ?v=
    const main = await raw(`${srv.base}/js/main.js?v=${v}`, { 'Accept-Encoding': 'gzip' });
    assert.equal(main.headers['cache-control'], IMMUTABLE);
    assert.equal(main.headers['content-encoding'], 'gzip');
    const mainSrc = unzip(main);
    assert.match(mainSrc, new RegExp(`from '\\./client/net\\.js\\?v=${v}'`));
    // 中みは もとの ファイルに ?v= を つけた だけ
    assert.equal(mainSrc.replaceAll(`?v=${v}`, ''), fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8'));
    // ?v= が ちがう 版（更新の 直後の 古い ページ）: 今の 中みを 返すが とっておかせない
    const old = await raw(`${srv.base}/js/main.js?v=oldversion1`, br);
    assert.equal(old.status, 200);
    assert.equal(old.headers['cache-control'], 'no-cache');
    assert.equal(unzip(old), mainSrc);
    // ?v= なし: 毎回 たしかめる
    const plain = await raw(`${srv.base}/js/main.js`);
    assert.equal(plain.headers['cache-control'], 'no-cache');
    assert.equal(plain.headers['content-encoding'], undefined, 'Accept-Encoding が なければ ちぢめない');
    assert.equal(plain.body.toString('utf8'), mainSrc);
    // CSS も ?v= で 1年
    const css = await raw(`${srv.base}/css/style.css?v=${v}`, br);
    assert.equal(css.headers['cache-control'], IMMUTABLE);
    assert.equal(css.headers['content-encoding'], 'br');
    const css304 = await raw(`${srv.base}/css/style.css?v=${v}`, { ...br, 'If-None-Match': css.headers.etag });
    assert.equal(css304.status, 304);
    // vendor の 中は ?v= を つけない（外の ライブラリ）
    const three = unzip(await raw(`${srv.base}/vendor/three.min.js?v=${v}`, br));
    assert.equal(three, fs.readFileSync(path.join(ROOT, 'public', 'vendor', 'three.min.js'), 'utf8'));
    // 字（woff2）・画像は ちぢめない。字は 30日
    const font = await raw(`${srv.base}/fonts/round/r5-0.woff2`, br);
    assert.equal(font.status, 200);
    assert.equal(font.headers['content-encoding'], undefined);
    assert.match(font.headers['cache-control'], /max-age=2592000/);
    assert.ok(font.headers.etag);
    assert.equal((await raw(`${srv.base}/fonts/round/r5-0.woff2`, { 'If-None-Match': font.headers.etag })).status, 304);
    const png = await raw(`${srv.base}/icons/icon-192.png`, br);
    assert.equal(png.headers['content-encoding'], undefined);
    assert.equal(png.headers['content-type'], 'image/png');
    // 見つからない・こわれた アドレスは 今までどおり
    assert.equal((await raw(`${srv.base}/nai.js`)).status, 404);
    assert.equal((await raw(`${srv.base}/api/info`)).status, 200);
    // パック: 目録と 1本に まとめた もの（ちぢめて 送る・今の 版なら 1年）
    const man = await raw(`${srv.base}/pack-manifest.json?v=${v}`, br);
    assert.equal(man.status, 200);
    assert.equal(man.headers['cache-control'], IMMUTABLE);
    assert.equal(man.headers['content-encoding'], 'br');
    const m = JSON.parse(unzip(man));
    assert.equal(m.v, v);
    assert.equal(m.files['js/main.js'], contentHash(fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'))));
    const pk = await raw(`${srv.base}/pack.json?v=${v}`, br);
    assert.equal(pk.status, 200);
    assert.match(pk.headers['content-encoding'], /^(br|gzip)$/, 'br が まだ なら gzip');
    assert.ok(pk.body.length < 6e6, `ちぢんだ パック ${pk.body.length}`);
    const p = JSON.parse(unzip(pk));
    assert.equal(p.v, v);
    assert.deepEqual(Object.keys(p.files), Object.keys(m.files));
    assert.equal(p.files['js/main.js'][1], fs.readFileSync(path.join(ROOT, 'public', 'js', 'main.js'), 'utf8'));
    assert.equal((await raw(`${srv.base}/pack.json?v=${v}`, { ...br, 'If-None-Match': pk.headers.etag })).status, 304);
    // ちがう 版を たのむ → 今の 版の 目録（とっておかせない）。SW は v が ちがうので 使わない
    const manOld = await raw(`${srv.base}/pack-manifest.json?v=old1`, br);
    assert.equal(manOld.headers['cache-control'], 'no-cache');
    assert.equal(JSON.parse(unzip(manOld)).v, v);
    // ちぢめない 時も 読める
    assert.equal(JSON.parse((await raw(`${srv.base}/pack.json?v=${v}`)).body.toString('utf8')).v, v);
  } finally {
    await srv.stop();
  }
});

// ───────────── 3だんめ: パック ＋ Service Worker の 加速 ─────────────

// にせの Cache Storage
function fakeCaches() {
  const stores = new Map();
  const key = (k) => String(k?.url || k);
  const open = async (name) => {
    if (!stores.has(name)) {
      const m = new Map();
      stores.set(name, {
        m,
        match: async (k) => (m.has(key(k)) ? new Response(m.get(key(k)).body, { headers: m.get(key(k)).headers }) : undefined),
        put: async (k, r) => { m.set(key(k), { body: await r.text(), headers: Object.fromEntries(r.headers) }); },
        keys: async () => [...m.keys()].map((url) => ({ url })),
        delete: async (k) => m.delete(key(k)),
      });
    }
    return stores.get(name);
  };
  return { open, stores };
}

// sw.js を にせの サービスワーカーの 中で 動かす
function loadSw({ origin = 'https://kizuna.example.ts.net', fetchImpl, query = '', caches = fakeCaches() } = {}) {
  const handlers = {};
  const sandbox = {
    self: {
      location: new URL(`${origin}/sw.js${query}`),
      addEventListener: (ev, fn) => { handlers[ev] = fn; },
      skipWaiting() {},
      clients: { claim: () => Promise.resolve() },
    },
    caches,
    crypto: webcrypto,
    fetch: (r) => fetchImpl(r),
    // メモリの 中みを すてる タイマーで テストが 終わらなく ならない ように
    setTimeout: (f, ms) => { const t = setTimeout(f, ms); t.unref?.(); return t; },
    clearTimeout, Response, URL, TextEncoder, TextDecoder,
  };
  vm.runInNewContext(`${fs.readFileSync(path.join(ROOT, 'public', 'sw.js'), 'utf8')}
;self.__t = { stampImports, sha, packTarget, unstamp, keepVersions, fromPack, prepare, pack, loadBundle };`, sandbox);
  return { handlers, caches, t: sandbox.self.__t };
}

// にせの サーバー（public/ から パック・ファイルを 返す。?v= つきの JS は ?v= を つけて 返す）
function fakeServer(root, v, { files = null } = {}) {
  const calls = [];
  const { manifest, pack } = buildPack(root, v);
  for (const [rel, text] of Object.entries(files || {})) {
    manifest.files[rel] = contentHash(Buffer.from(text));
    pack.files[rel] = [manifest.files[rel], text];
  }
  const fetchImpl = async (req) => {
    const url = new URL(req.url || req);
    calls.push(url.pathname + url.search);
    const rel = url.pathname.slice(1);
    if (rel === 'pack-manifest.json') return new Response(JSON.stringify(manifest));
    if (rel === 'pack.json') return new Response(JSON.stringify(pack));
    const text = files?.[rel] ?? fs.readFileSync(path.join(root, rel), 'utf8');
    return new Response(stampable(rel) ? stampImports(text, url.searchParams.get('v')) : text);
  };
  return { fetchImpl, calls, manifest, pack };
}
const PUB = path.join(ROOT, 'public');
const at = (rel, v) => ({ url: `https://kizuna.example.ts.net/${rel}?v=${v}`, method: 'GET', mode: 'cors' });
const readPub = (rel) => fs.readFileSync(path.join(PUB, rel), 'utf8');

test('sw.js の 中の stampImports・ハッシュは 家族サーバー（server/stamp.js）と 同じ', async () => {
  const { t } = loadSw({ fetchImpl: () => Promise.reject(new Error('no')) });
  const files = listPackFiles(PUB).filter((r) => r.endsWith('.js'));
  assert.ok(files.length > 500, String(files.length));
  for (const rel of files) {
    const src = readPub(rel);
    assert.equal(t.stampImports(src, 'abc123'), stampImports(src, 'abc123'), rel);
    assert.equal(t.unstamp(stampImports(src, 'abc123'), 'abc123'), src, rel);
  }
  for (const rel of files.slice(0, 20)) {
    const buf = fs.readFileSync(path.join(PUB, rel));
    assert.equal(await t.sha(buf.toString('utf8')), contentHash(buf), rel);
  }
  assert.ok(!files.includes('sw.js'), 'sw.js は パックに 入れない');
  assert.ok(listPackFiles(PUB).includes('css/style.css'));
  assert.ok(listPackFiles(PUB).includes('css/fonts.css'));
});

test('パック: 目録の ハッシュと 中みが 合う・全部の JS と CSS が 入る', () => {
  const { manifest, pack } = buildPack(PUB, 'v1');
  assert.equal(manifest.v, 'v1');
  assert.equal(pack.v, 'v1');
  const rels = Object.keys(manifest.files);
  assert.deepEqual(rels, listPackFiles(PUB));
  let size = 0;
  for (const rel of rels) {
    const buf = fs.readFileSync(path.join(PUB, rel));
    size += buf.length;
    assert.equal(manifest.files[rel], contentHash(buf), rel);
    assert.equal(pack.files[rel][0], manifest.files[rel]);
    assert.equal(pack.files[rel][1], buf.toString('utf8'), 'パックの 中みは ?v= を つける 前');
  }
  assert.equal(manifest.size, size);
});

test('sw.js: 版つきの 同じ オリジンの JS・CSS だけ あつかう（ナビゲーション・ほかは さわらない）', () => {
  const { t } = loadSw({ fetchImpl: () => Promise.reject(new Error('no')) });
  const req = (url, method = 'GET') => ({ url, method, mode: 'cors' });
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/js/main.js?v=abc')), 'js/main.js');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/css/style.css?v=abc')), 'css/style.css');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/js/main.js')), '', '?v= なし');
  assert.equal(t.packTarget(req('https://other.example.com/js/main.js?v=abc')), '', 'ほかの オリジン');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/index.html?v=abc')), '');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/api/info?v=abc')), '');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/sw.js?v=abc')), '');
  assert.equal(t.packTarget(req('https://kizuna.example.ts.net/js/main.js?v=abc', 'POST')), '');
  // ひとりで遊ぶサイト（/-DB/kizuna/ の 下）でも、スコープからの パスで
  const site = loadSw({ origin: 'https://example.github.io', fetchImpl: () => Promise.reject(new Error('no')) });
  void site;
  const kv = (l, v) => JSON.stringify(t.keepVersions(l, v));
  assert.equal(kv([], 'b'), '["b"]');
  assert.equal(kv(['a', 'b'], 'c'), '["b","c"]');
  assert.equal(kv(['a', 'b'], 'b'), '["a","b"]');
});

test('sw.js: はじめは パック 1本 → 2回目は 通信なし → 更新の あとは かわった ファイルだけ 1つずつ → 古い ものを そうじ', async () => {
  const s1 = fakeServer(PUB, 'v1');
  let cur = s1;
  const fetchImpl = (r) => cur.fetchImpl(r);
  const sw = loadSw({ fetchImpl });
  const prog = [];
  const after = await sw.t.prepare('v1', (d, n) => prog.push([d, n]));
  assert.deepEqual(s1.calls, ['/pack-manifest.json?v=v1', '/pack.json?v=v1']);
  assert.ok(prog.length >= 1 && prog.at(-1)[0] === prog.at(-1)[1], JSON.stringify(prog.slice(-2)));
  // 返事の 前から メモリで 返せる
  const r0 = await sw.t.fromPack(at('js/main.js', 'v1'), 'js/main.js');
  assert.equal(r0.headers.get('X-Kizuna-Pack'), '1');
  await after();
  const filesStore = await sw.caches.open('kizuna-files-v1');
  const metaStore = await sw.caches.open('kizuna-meta-v1');
  const keysOf = async (c) => (await c.keys()).map((k) => k.url.replace(/^.*__kizuna\//, ''));
  assert.deepEqual(await keysOf(filesStore), ['b/v1']);
  assert.ok((await keysOf(metaStore)).includes('m/v1'));
  // しまった 中みから 返す（?v= を つけて）。サーバーが 送る ものと 同じ
  const r = await sw.t.fromPack(at('js/main.js', 'v1'), 'js/main.js');
  assert.equal(await r.text(), stampImports(readPub('js/main.js'), 'v1'));
  assert.match(r.headers.get('Content-Type'), /javascript/);
  const css = await sw.t.fromPack(at('css/style.css', 'v1'), 'css/style.css');
  assert.match(css.headers.get('Content-Type'), /css/);
  assert.equal(await css.text(), readPub('css/style.css'));
  // 2回目（SW が 一度 止まって 動きなおした）: 通信なし・まとめを 1回 読むだけ
  s1.calls.length = 0;
  const sw2 = loadSw({ fetchImpl, caches: sw.caches });
  assert.equal(await sw2.t.prepare('v1', () => {}), null);
  assert.deepEqual(s1.calls, []);
  assert.equal(await (await sw2.t.fromPack(at('js/main.js', 'v1'), 'js/main.js')).text(), stampImports(readPub('js/main.js'), 'v1'));
  // 2回目で prepare を 待たずに 読まれても（返事が おくれた）しまった 中みから
  const sw2b = loadSw({ fetchImpl, caches: sw.caches });
  assert.equal((await sw2b.t.fromPack(at('js/client/net.js', 'v1'), 'js/client/net.js')).headers.get('X-Kizuna-Pack'), '1');
  assert.deepEqual(s1.calls, []);
  // 更新の あと（SW は 動きなおし）: 3つの ファイルだけ かわった
  const changed = {
    'js/main.js': `${readPub('js/main.js')}\n// new\n`,
    'js/client/net.js': `${readPub('js/client/net.js')}\n// new\n`,
    'css/style.css': `${readPub('css/style.css')}\n/* new */\n`,
  };
  cur = fakeServer(PUB, 'v2', { files: changed });
  const sw3 = loadSw({ fetchImpl, caches: sw.caches });
  await (await sw3.t.prepare('v2', () => {}))();
  assert.deepEqual(cur.calls.sort(), ['/css/style.css?v=v2', '/js/client/net.js?v=v2', '/js/main.js?v=v2', '/pack-manifest.json?v=v2'].sort());
  const r2 = await sw3.t.fromPack(at('js/main.js', 'v2'), 'js/main.js');
  assert.equal(await r2.text(), stampImports(changed['js/main.js'], 'v2'));
  // 直前の 版（v1）は のこる
  assert.deepEqual((await keysOf(filesStore)).sort(), ['b/v1', 'b/v2']);
  // さらに 更新（v3）→ v1 は 消える
  cur = fakeServer(PUB, 'v3', { files: { ...changed, 'js/main.js': `${changed['js/main.js']}// v3\n` } });
  await (await sw3.t.prepare('v3', () => {}))();
  assert.deepEqual((await keysOf(filesStore)).sort(), ['b/v2', 'b/v3']);
  assert.ok(!(await keysOf(metaStore)).includes('m/v1'));
  assert.deepEqual(cur.calls.filter((c) => !c.startsWith('/pack-manifest')), ['/js/main.js?v=v3']);
  // 知らない 版は ネットへ
  cur.calls.length = 0;
  await sw3.t.fromPack(at('js/main.js', 'zzz'), 'js/main.js');
  assert.deepEqual(cur.calls, ['/js/main.js?v=zzz']);
});

test('sw.js: ハッシュが 合わない 中みは しまわない（ネットから 読む）・版の ちがう 目録は 使わない', async () => {
  const s = fakeServer(PUB, 'v1');
  s.pack.files['js/main.js'][1] += '// こわれた\n';
  const sw = loadSw({ fetchImpl: s.fetchImpl });
  await (await sw.t.prepare('v1', () => {}))();
  s.calls.length = 0;
  const r = await sw.t.fromPack(at('js/main.js', 'v1'), 'js/main.js');
  assert.equal(r.headers.get('X-Kizuna-Pack'), null);
  assert.deepEqual(s.calls, ['/js/main.js?v=v1'], 'ネットから');
  // サーバーが もう 新しい 版（目録の v が ちがう）→ しっぱい（ページは ふつうに 読む）
  const s2 = fakeServer(PUB, 'v9');
  const sw2 = loadSw({ fetchImpl: s2.fetchImpl });
  await assert.rejects(sw2.t.prepare('v8', () => {}), /manifest version/);
  await assert.rejects(sw2.t.prepare('../x', () => {}), /bad version/);
});

test('sw.js: メッセージ（kz-prepare → ack・progress・done ／ kz-off で 止める ／ しっぱい）', async () => {
  const s = fakeServer(PUB, 'v1');
  const sw = loadSw({ fetchImpl: s.fetchImpl });
  const got = [];
  let waited;
  sw.handlers.message({ data: { t: 'kz-prepare', v: 'v1' }, ports: [{ postMessage: (m) => got.push(m) }], waitUntil: (p) => { waited = p; } });
  await waited;
  assert.equal(got[0].t, 'kz-ack');
  assert.ok(got.some((m) => m.t === 'kz-progress'));
  assert.equal(JSON.stringify(got.at(-1)), '{"t":"kz-done","ok":true}');
  // fetch: 版つきの JS は しまった 中みから
  let resp = null;
  sw.handlers.fetch({ request: at('js/main.js', 'v1'), respondWith: (p) => { resp = p; } });
  assert.equal((await resp).headers.get('X-Kizuna-Pack'), '1');
  // ?nopack: 止める
  const got2 = [];
  sw.handlers.message({ data: { t: 'kz-off' }, ports: [{ postMessage: (m) => got2.push(m) }] });
  assert.deepEqual(got2.map((m) => m.t), ['kz-ack', 'kz-done']);
  resp = null;
  sw.handlers.fetch({ request: at('js/main.js', 'v1'), respondWith: (p) => { resp = p; } });
  assert.equal(resp, null, '止めた あとは さわらない');
  // しっぱい → ok: false（ページは ふつうに 読む）
  const bad = loadSw({ fetchImpl: () => Promise.reject(new TypeError('Load failed')) });
  const got3 = [];
  bad.handlers.message({ data: { t: 'kz-prepare', v: 'v1' }, ports: [{ postMessage: (m) => got3.push(m) }], waitUntil: (p) => { waited = p; } });
  await waited;
  assert.equal(got3.at(-1).t, 'kz-done');
  assert.equal(got3.at(-1).ok, false);
  // ほかの メッセージは むし
  sw.handlers.message({ data: { t: 'other' }, ports: [] });
});

test('sw.js: しまう 場所が たりない（古い iPhone など）→ 次からは パックを 使わない', async () => {
  const s = fakeServer(PUB, 'v1');
  const caches = fakeCaches();
  const files = await caches.open('kizuna-files-v1');
  files.put = async () => { throw new Error('QuotaExceededError'); };
  const sw = loadSw({ fetchImpl: s.fetchImpl, caches });
  const after = await sw.t.prepare('v1', () => {});
  // この 回は メモリから 返せる
  assert.equal((await sw.t.fromPack(at('js/main.js', 'v1'), 'js/main.js')).headers.get('X-Kizuna-Pack'), '1');
  await assert.rejects(after(), /Quota/);
  const sw2 = loadSw({ fetchImpl: s.fetchImpl, caches });
  s.calls.length = 0;
  await assert.rejects(sw2.t.prepare('v1', () => {}), /storage full/);
  assert.deepEqual(s.calls, [], 'パックを 取りに 行かない');
});

test('sw.js: ひとりで遊ぶサイト（sw.js?nav=off）では ナビゲーションに さわらない', () => {
  const sw = loadSw({ origin: 'https://example.github.io', query: '?nav=off', fetchImpl: () => Promise.reject(new Error('no')) });
  let resp = null;
  sw.handlers.fetch({ request: { url: 'https://example.github.io/-DB/kizuna/', method: 'GET', mode: 'navigate' }, respondWith: (p) => { resp = p; } });
  assert.equal(resp, null);
});

// 起動の しくみ（index.html に うめこむ）を にせの ページで 動かす
function runBoot({ secure = true, controller = null, search = '', nopackLS = false, cfg = {}, register } = {}) {
  const appended = [];
  const listeners = {};
  const channels = [];
  const box = { textContent: '読みこみ中…' };
  const win = {
    isSecureContext: secure,
    MessageChannel: class { constructor() { this.port1 = {}; this.port2 = {}; channels.push(this); } },
    caches: {},
  };
  const sw = {
    controller,
    addEventListener: (ev, fn) => { listeners[ev] = fn; },
    register: register || (() => new Promise(() => {})),
  };
  const sandbox = {
    window: win,
    document: {
      getElementById: (id) => (id === 'boot' ? box : null),
      createElement: () => ({}),
      body: { appendChild: (s) => appended.push(s) },
    },
    navigator: { serviceWorker: secure ? sw : undefined },
    location: { search },
    localStorage: { getItem: (k) => (k === 'kizuna_nopack' && nopackLS ? '1' : null) },
    performance: { now: () => 0 },
    setTimeout, clearTimeout,
  };
  vm.runInNewContext(`(${kizunaBoot})(${JSON.stringify({ v: 'V1', sw: 'sw.js', pack: true, ack: 30, idle: 60, claim: 60, ...cfg })})`, sandbox);
  const reply = (m) => channels.at(-1).port1.onmessage({ data: m });
  return { appended, box, listeners, sw, win, reply, mark: win.__kzBoot };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

test('起動の しくみ: http・SW なし → すぐ ふつうに 読む。返事が ない → すぐ あきらめる', async () => {
  const a = runBoot({ secure: false });
  assert.equal(a.appended.length, 1);
  assert.equal(a.appended[0].src, 'js/main.js?v=V1');
  assert.equal(a.appended[0].type, 'module');
  // 古い SW（返事しない）
  const posted = [];
  const b = runBoot({ controller: { postMessage: (m) => posted.push(m) } });
  assert.equal(b.appended.length, 0);
  assert.equal(posted[0].t, 'kz-prepare');
  assert.equal(posted[0].v, 'V1');
  await tick(80);
  assert.equal(b.appended.length, 1, 'ack が 来ないので ふつうに 読んだ');
  // パックを 使わない 設定
  assert.equal(runBoot({ cfg: { pack: false }, controller: { postMessage() {} } }).appended.length, 1);
});

test('起動の しくみ: 進みぐあいを 出し、できたら 1回だけ 読む・とちゅうで 止まったら あきらめる', async () => {
  const c = runBoot({ controller: { postMessage() {} } });
  c.reply({ t: 'kz-ack' });
  await tick(45);
  assert.equal(c.appended.length, 0, 'ack の あとは 長めに まつ');
  c.reply({ t: 'kz-progress', done: 42, total: 100 });
  assert.equal(c.box.textContent, '読みこみ中（42%）');
  c.reply({ t: 'kz-done', ok: true });
  assert.equal(c.appended.length, 1);
  assert.equal(c.mark.how, 'pack');
  c.reply({ t: 'kz-done', ok: true });
  await tick(100);
  assert.equal(c.appended.length, 1, '2回 読まない');
  // とちゅうで 返事が 止まった
  const d = runBoot({ controller: { postMessage() {} } });
  d.reply({ t: 'kz-ack' });
  d.reply({ t: 'kz-progress', done: 1, total: 100 });
  await tick(120);
  assert.equal(d.appended.length, 1);
  // しっぱいの 返事 → すぐ ふつうに
  const e = runBoot({ controller: { postMessage() {} } });
  e.reply({ t: 'kz-done', ok: false });
  assert.equal(e.appended.length, 1);
  assert.equal(e.mark.how, 'fail');
});

test('起動の しくみ: ?nopack・localStorage.kizuna_nopack で 止める。はじめての 訪問は 登録して まつ', async () => {
  for (const opt of [{ search: '?nopack' }, { search: '?a=1&nopack' }, { nopackLS: true }]) {
    const posted = [];
    const n = runBoot({ ...opt, controller: { postMessage: (m) => posted.push(m) } });
    assert.equal(posted[0].t, 'kz-off', JSON.stringify(opt));
    n.reply({ t: 'kz-done', ok: true });
    assert.equal(n.appended.length, 1);
  }
  // SW なしで ?nopack → 登録も しないで すぐ
  let reg = 0;
  const q = runBoot({ search: '?nopack', register: () => { reg++; return new Promise(() => {}); } });
  assert.equal(q.appended.length, 1);
  assert.equal(reg, 0);
  // はじめての 訪問: 登録 → 動きだしたら たのむ
  const posted = [];
  const f = runBoot({ register: (url) => { assert.equal(url, 'sw.js'); return new Promise(() => {}); } });
  assert.equal(f.appended.length, 0);
  f.sw.controller = { postMessage: (m) => posted.push(m) };
  f.listeners.controllerchange();
  assert.equal(posted[0].t, 'kz-prepare');
  f.reply({ t: 'kz-done', ok: true });
  assert.equal(f.appended.length, 1);
  // 登録が うまく いかない → すぐ ふつうに
  const g = runBoot({ register: () => Promise.reject(new Error('no')) });
  await tick(5);
  assert.equal(g.appended.length, 1);
  // SW が 動かない まま → 少し まって ふつうに
  const h = runBoot({});
  await tick(100);
  assert.equal(h.appended.length, 1);
  // もう 動いているのに この ページを 見ていない（強い 読みこみ直し）→ すぐ
  const k = runBoot({ register: () => Promise.resolve({ active: {}, installing: null, waiting: null }) });
  await tick(5);
  assert.equal(k.appended.length, 1);
});
