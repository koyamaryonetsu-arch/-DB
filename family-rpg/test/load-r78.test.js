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
import { createStatic, pickEncoding, fingerprint, IMMUTABLE } from '../server/static.js';

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
  assert.match(html, /js\/main\.js\?v=V1/);
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
    const v = html.match(/js\/main\.js\?v=([A-Za-z0-9]+)/)?.[1];
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
  } finally {
    await srv.stop();
  }
});
