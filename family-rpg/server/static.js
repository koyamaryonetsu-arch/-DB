// 家族サーバーの ファイルの くばりかた（はじめの 読みこみを 速く する）
// ・文字の ファイル（js・css・html・json・svg など）は gzip か brotli で ちぢめて 送る。
//   ちぢめた 結果は メモリに とっておき、ファイルが かわったら 作りなおす（Vary: Accept-Encoding）
// ・ETag を つけ、かわって いなければ 304（中みを 送らない）
// ・版つきの 読みこみ: JS の import と index.html に ?v=<版> を つけて 送る（server/stamp.js）。
//   ?v= が 今の 版なら「1年 とっておいて よい」（immutable）。2回目からは モジュールの 通信が 0回
//   ?v= が ちがう 版（更新の 直後に 古い ページが 動いている）なら、今の 中みを 返すが とっておかせない（no-cache）
// ・index.html は 今までどおり 毎回 たしかめる（no-cache）。字の ファイルは 30日
// ・版 ＝ version.json の sha。ない 時（開発中）や、起動の あとに ファイルが かわった 時は、
//   ファイルの ようす（大きさ・時こく）から 作る（ファイルが かわれば 版も かわる）
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { stampImports, stampHtml, stampable, shortVersion, contentHash } from './stamp.js';

export const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};
// ちぢめる ファイル（字の woff2・画像は もう ちぢんで いるので そのまま。ttf は ちぢむ）
const TEXT = new Set(['.html', '.js', '.css', '.json', '.svg', '.txt', '.webmanifest', '.ttf', '.ico']);
export const IMMUTABLE = 'public, max-age=31536000, immutable';
const FONT_CACHE = 'public, max-age=2592000';
const BR = { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } };

// Accept-Encoding から えらぶ（br → gzip → なし）
export function pickEncoding(header) {
  const list = String(header || '').toLowerCase().split(',').map((s) => s.trim());
  const ok = (name) => list.some((s) => {
    const [n, ...ps] = s.split(';').map((x) => x.trim());
    if (n !== name && n !== '*') return false;
    const q = ps.find((p) => p.startsWith('q='));
    return !q || Number(q.slice(2)) > 0;
  });
  if (ok('br')) return 'br';
  if (ok('gzip')) return 'gzip';
  return '';
}

// public の ファイルの ようす（大きさ・時こく）の まとめ（かわったら ちがう 文字に なる）
export function fingerprint(root) {
  const h = crypto.createHash('sha256');
  const walk = (dir, rel) => {
    let list;
    try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    list.sort((a, b) => (a.name < b.name ? -1 : 1));
    for (const e of list) {
      const p = path.join(dir, e.name);
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, r);
      else if (e.isFile()) {
        try {
          const st = fs.statSync(p);
          h.update(`${r}\0${st.size}\0${Math.floor(st.mtimeMs)}\n`);
        } catch { /* */ }
      }
    }
  };
  walk(root, '');
  return h.digest('hex').slice(0, 12);
}

export function createStatic({ root, sha = '', date = '' }) {
  const cache = new Map(); // file → { key, body, etag, hash（もとの 中みの ハッシュ）, enc: { br, gzip } }
  const startFp = fingerprint(root);
  let ver = { v: '', fp: '', at: 0 };
  // いまの 版。index.html の ときは かならず しらべなおす（ほかは 2秒に 1回まで）
  function version(fresh = false) {
    const now = Date.now();
    if (fresh || !ver.v || now - ver.at > 2000) {
      const fp = fingerprint(root);
      const s = shortVersion(sha || '');
      const v = s && fp === startFp ? s : `${s.slice(0, 6) || 'd'}${fp.slice(0, 8)}`;
      ver = { v, fp, at: now };
    }
    return ver.v;
  }

  // 送る 中み（JS は ?v= を つける・index.html は 版を 入れる）
  function entry(file, rel, st, v) {
    const key = `${st.size}:${st.mtimeMs}:${v}`;
    const old = cache.get(file);
    if (old && old.key === key) return old;
    const raw = fs.readFileSync(file);
    let body = raw;
    if (stampable(rel)) body = Buffer.from(stampImports(raw.toString('utf8'), v));
    else if (rel === 'index.html') body = Buffer.from(stampHtml(raw.toString('utf8'), v, date));
    const e = { key, body, etag: `W/"${contentHash(body)}"`, enc: {}, hash: contentHash(raw) };
    cache.set(file, e);
    return e;
  }
  function encoded(e, enc) {
    if (!enc) return e.body;
    if (!e.enc[enc]) e.enc[enc] = enc === 'br' ? zlib.brotliCompressSync(e.body, BR) : zlib.gzipSync(e.body, { level: 6 });
    return e.enc[enc];
  }

  // file: public の 中の ファイル（たしかめ ずみ）・st: その fs.stat・query: ? の あと
  function serve(req, res, file, st, query = '') {
    const rel = path.relative(root, file).split(path.sep).join('/');
    const ext = path.extname(file).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    const isIndex = rel === 'index.html';
    const v = version(isIndex);
    const asked = new URLSearchParams(query).get('v');
    let cacheControl = 'no-cache';
    if (rel.startsWith('fonts/')) cacheControl = FONT_CACHE;
    if (asked !== null && !isIndex) cacheControl = asked === v ? IMMUTABLE : 'no-cache';
    const head = req.method === 'HEAD';
    if (!TEXT.has(ext)) {
      // 字・画像: そのまま 送る（ETag は 大きさと 時こく）
      const etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
      const h = { 'Content-Type': type, 'Cache-Control': cacheControl, ETag: etag, 'X-Content-Type-Options': 'nosniff' };
      if (fresh(req, etag)) return notModified(res, h);
      res.writeHead(200, { ...h, 'Content-Length': st.size });
      if (head) return res.end();
      return fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    }
    const e = entry(file, rel, st, v);
    const h = { 'Content-Type': type, 'Cache-Control': cacheControl, ETag: e.etag, Vary: 'Accept-Encoding', 'X-Content-Type-Options': 'nosniff' };
    if (fresh(req, e.etag)) return notModified(res, h);
    const enc = e.body.length > 512 ? pickEncoding(req.headers['accept-encoding']) : '';
    const out = encoded(e, enc);
    if (enc) h['Content-Encoding'] = enc;
    res.writeHead(200, { ...h, 'Content-Length': out.length });
    res.end(head ? undefined : out);
  }

  // 起動の あと、少しずつ ちぢめて おく（はじめの 人を またせない。ゲームの 動きを とめない ように 1つずつ）
  function warm(done) {
    const files = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (TEXT.has(path.extname(e.name).toLowerCase())) files.push(p);
      }
    };
    try { walk(root); } catch { /* */ }
    const step = () => {
      const file = files.shift();
      if (!file) return done?.();
      try {
        const st = fs.statSync(file);
        const e = entry(file, path.relative(root, file).split(path.sep).join('/'), st, version());
        if (e.body.length > 512) { encoded(e, 'br'); encoded(e, 'gzip'); }
      } catch { /* */ }
      setImmediate(step);
    };
    setImmediate(step);
  }

  return { serve, version, entry, cache, warm };
}

function fresh(req, etag) {
  const inm = String(req.headers['if-none-match'] || '');
  if (!inm) return false;
  const strip = (t) => t.trim().replace(/^W\//, '');
  return inm === '*' || inm.split(',').some((t) => strip(t) === strip(etag));
}
function notModified(res, h) {
  res.writeHead(304, h);
  res.end();
}
