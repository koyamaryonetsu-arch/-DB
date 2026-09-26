// 家族サーバーを 新しい 版に する（GitHub から。起動の たびに しらべる）
//
// ・GitHub の ブランチの いちばん 新しい コミットを しらべて、version.json と くらべる
// ・新しければ tar.gz を ダウンロードして、family-rpg/ の 中みを アプリの フォルダに 上書きする
//   （セーブは ホームの kizuna-save に あるので そのまま。start.bat などの 起動用ファイルは 動いている さいちゅうなので かえない）
// ・上書き まえの アプリは kizuna-save/app-previous に とっておく（新しい 版が すぐ 止まったら もとに もどす）
// ・インターネットに つながらない・git で とってきた フォルダ・config.json の autoUpdate: false の ときは なにも しない
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

export const SOURCE = {
  owner: 'koyamaryonetsu-arch',
  repo: '-DB',
  branch: 'claude/elegant-bell-al2f1w',
  dir: 'family-rpg',
};
const API = 'https://api.github.com';
const CODELOAD = 'https://codeload.github.com';
const KEEP = new Set(['start.bat', 'start.command', 'start.sh', 'version.json']);
const SKIP_TOP = new Set(['data', 'node_modules', '.git']);

export function readVersion(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'version.json'), 'utf8'));
  } catch {
    return null;
  }
}

// git で とってきた フォルダ（開発用）なら 自動では 更新しない
export function isGitCheckout(root) {
  let dir = path.resolve(root);
  for (let i = 0; i < 3; i++) {
    if (fs.existsSync(path.join(dir, '.git'))) return true;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return false;
}

async function fetchWithTimeout(fetchImpl, url, ms, headers) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetchImpl(url, { signal: ctrl.signal, headers: { 'User-Agent': 'kizuna-family-server', ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r;
  } finally {
    clearTimeout(t);
  }
}

// ───── tar（GitHub の tar.gz を 読む。pax の 長い 名前にも たいおう） ─────
function cstr(buf, start, len) {
  const b = buf.subarray(start, start + len);
  const end = b.indexOf(0);
  return b.subarray(0, end < 0 ? b.length : end).toString('utf8');
}

// pax の 記録「<長さ> <キー>=<あたい>\n」（長さは 記録ぜんぶの バイト数）
function parsePax(body) {
  const out = {};
  let off = 0;
  while (off < body.length) {
    const sp = body.indexOf(0x20, off);
    if (sp < 0) break;
    const len = parseInt(body.subarray(off, sp).toString('ascii'), 10);
    if (!len || off + len > body.length) break;
    const rec = body.subarray(sp + 1, off + len).toString('utf8').replace(/\n$/, '');
    const eq = rec.indexOf('=');
    if (eq > 0) out[rec.slice(0, eq)] = rec.slice(eq + 1);
    off += len;
  }
  return out;
}

export function readTar(buf) {
  const files = [];
  let global = {};
  let nextPath = null;
  let off = 0;
  while (off + 512 <= buf.length) {
    const h = buf.subarray(off, off + 512);
    if (h.every((b) => b === 0)) break;
    const size = parseInt(cstr(h, 124, 12).trim() || '0', 8) || 0;
    const type = h[156] ? String.fromCharCode(h[156]) : '0';
    const name = cstr(h, 0, 100);
    const prefix = cstr(h, 345, 155);
    const body = buf.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'g') {
      global = { ...global, ...parsePax(body) };
      continue;
    }
    if (type === 'x') {
      nextPath = parsePax(body).path || null;
      continue;
    }
    const full = nextPath || (prefix ? `${prefix}/${name}` : name);
    nextPath = null;
    if (type === '0' || type === '\0') files.push({ path: full, data: Buffer.from(body) });
  }
  return { files, global };
}

// tar の 中の <repo>-<sha>/family-rpg/… だけを とりだす
function appFiles(tar, dir) {
  const out = new Map();
  for (const f of tar.files) {
    const parts = f.path.split('/');
    if (parts.length < 3 || parts[1] !== dir) continue;
    const rel = parts.slice(2).join('/');
    if (!rel || rel.split('/').some((p) => p === '..' || p === '') || path.isAbsolute(rel)) continue;
    if (SKIP_TOP.has(rel.split('/')[0]) || KEEP.has(rel)) continue;
    out.set(rel, f.data);
  }
  return out;
}

function copyTree(from, to, skipTop = SKIP_TOP) {
  if (!fs.existsSync(from)) return;
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (skipTop.has(e.name) || e.name.startsWith('.update')) continue;
    const a = path.join(from, e.name);
    const b = path.join(to, e.name);
    if (e.isDirectory()) {
      fs.mkdirSync(b, { recursive: true });
      copyTree(a, b, new Set());
    } else if (e.isFile()) {
      fs.mkdirSync(path.dirname(b), { recursive: true });
      fs.copyFileSync(a, b);
    }
  }
}

// いまの アプリを とっておく
function backupApp(root, dataDir) {
  const dest = path.join(dataDir, 'app-previous');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  copyTree(root, dest);
  const v = path.join(root, 'version.json');
  if (fs.existsSync(v)) fs.copyFileSync(v, path.join(dest, 'version.json'));
  return dest;
}

// 前の 版に もどす（新しい 版が すぐ 止まった とき）
export function rollback({ root, dataDir }) {
  const src = path.join(dataDir, 'app-previous');
  if (!fs.existsSync(path.join(src, 'server', 'index.js'))) return false;
  copyTree(src, root, new Set(['data', 'node_modules', '.git']));
  const v = path.join(src, 'version.json');
  if (fs.existsSync(v)) fs.copyFileSync(v, path.join(root, 'version.json'));
  else fs.rmSync(path.join(root, 'version.json'), { force: true });
  return true;
}

// もどりち: { status: 'updated' | 'latest' | 'skip' | 'offline' | 'error', sha, date, reason }
export async function checkAndUpdate({
  root, dataDir, log = () => {}, fetchImpl = globalThis.fetch, source = SOURCE,
  api = process.env.KIZUNA_UPDATE_API || API, codeload = process.env.KIZUNA_UPDATE_CODELOAD || CODELOAD,
  enabled = true, now = Date.now(),
} = {}) {
  if (!enabled || process.env.KIZUNA_NO_UPDATE) return { status: 'skip', reason: 'off' };
  if (!fetchImpl) return { status: 'skip', reason: 'no fetch' };
  if (isGitCheckout(root) && !process.env.KIZUNA_UPDATE_API) {
    log('  （git でとってきたフォルダなので、自動では新しくしません。git pull で新しくしてね）');
    return { status: 'skip', reason: 'git' };
  }
  let latest;
  try {
    const q = `${api}/repos/${source.owner}/${source.repo}/commits?sha=${encodeURIComponent(source.branch)}&per_page=1`;
    const r = await fetchWithTimeout(fetchImpl, q, 6000, { Accept: 'application/vnd.github+json' });
    const list = await r.json();
    latest = Array.isArray(list) ? list[0] : null;
    if (!latest?.sha) throw new Error('no commit');
  } catch {
    log('  （新しい版を調べられませんでした。今の版で動かします）');
    return { status: 'offline' };
  }
  const cur = readVersion(root);
  const date = latest.commit?.committer?.date || latest.commit?.author?.date || '';
  if (cur?.sha === latest.sha) return { status: 'latest', sha: latest.sha, date };
  try {
    log(`  ★ 新しい版があります（${date.slice(0, 10) || '日付不明'}）。新しくしています…`);
    const r = await fetchWithTimeout(fetchImpl, `${codeload}/${source.owner}/${source.repo}/tar.gz/${latest.sha}`, 120000);
    const gz = Buffer.from(await r.arrayBuffer());
    const tar = readTar(zlib.gunzipSync(gz));
    if (tar.global.comment && tar.global.comment !== latest.sha) throw new Error('sha mismatch');
    const files = appFiles(tar, source.dir);
    if (!files.has('server/index.js') || !files.has('public/index.html')) throw new Error('bad archive');
    // いったん べつの 場所に 書いてから、まとめて 上書き
    const staging = path.join(dataDir, 'app-staging');
    fs.rmSync(staging, { recursive: true, force: true });
    for (const [rel, data] of files) {
      const p = path.join(staging, rel);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      fs.writeFileSync(p, data);
    }
    backupApp(root, dataDir);
    try {
      copyTree(staging, root, new Set());
    } catch (e) {
      // とちゅうで しっぱいしたら 前の 版に もどす
      rollback({ root, dataDir });
      throw e;
    }
    fs.rmSync(staging, { recursive: true, force: true });
    fs.writeFileSync(path.join(root, 'version.json'), JSON.stringify({ sha: latest.sha, date, branch: source.branch, updatedAt: new Date(now).toISOString() }, null, 2));
    log('  ★ 新しい版にしました！（セーブはそのままです）');
    return { status: 'updated', sha: latest.sha, date, prev: cur?.sha || null };
  } catch (e) {
    log(`  （新しくできませんでした: ${e.message}。今の版で動かします）`);
    return { status: 'error', reason: e.message };
  }
}
