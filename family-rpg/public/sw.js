// 家族サーバーの ページを 開いた 時に、家の PC（家族サーバー）が 動いていなかったら、
// ブラウザの「開けません」の かわりに「ひとりで遊ぶサイト」への 案内を 出す。
// ・ページを 開く 時（ナビゲーション）は 見るだけで、決して しまわない（古い ページが 出る ことは ない）
// ・版つきの JS・CSS（?v=）だけ、中みの ハッシュで しまって 速く 返す（下の「パック」。加速だけ）
// ・https（Tailscale Funnel）や この PC（localhost）で 開いた 時だけ 動く（ブラウザの きまり）
const DEFAULT_SITE = 'https://koyamaryonetsu-arch.github.io/-DB/kizuna/';

function siteUrl() {
  const s = new URL(self.location.href).searchParams.get('site') || '';
  return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : DEFAULT_SITE;
}

// どこで 止まっているか（client/downreason.js と おなじ 考え方）
// ・通信エラー … 家の PC まで とどいていない（電源・スリープ・Tailscale）。この PC（localhost）では 家族サーバーが 止まっている
// ・502〜504 … 家の PC（Tailscale Funnel）には とどいたが、家族サーバー（黒い 画面）が 動いていない
//   （家族サーバーは この 番号を 返さない。Tailscale が「うしろの サーバーに つながらない」ときに 返す）
const onThisPc = () => /^(localhost|127\.|\[::1\])/.test(self.location.hostname);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
// スマホの 4G などでは、1回 とぎれても すぐ もどる ことが 多い。すぐに「つながりません」に しないで、
// 少し まって 2回 やり直す（家の PC が 本当に とまっている ときは、3回とも だめなので 案内を 出す）
const RETRY_WAIT = 1200;
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
function fetchNav(req, tries) {
  const again = () => wait(RETRY_WAIT).then(() => fetchNav(req, tries - 1));
  return fetch(req).then(
    (r) => (r.status >= 502 && r.status <= 504 && tries > 1 ? again() : r),
    (err) => (tries > 1 ? again() : Promise.reject(err)),
  );
}

// ひとりで遊ぶサイト（sw.js?nav=off）では、家族サーバーの 案内は 出さない
const navOff = () => new URL(self.location.href).searchParams.get('nav') === 'off';

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.mode === 'navigate') {
    if (navOff()) return;
    e.respondWith(fetchNav(req, 3).then(
      (r) => (r.status >= 502 && r.status <= 504 ? downPage('server') : r),
      () => downPage(onThisPc() ? 'server' : 'pc'),
    ));
    return;
  }
  // 版つきの JS・CSS は、しまって ある 中みから 返す（なければ ふつうに ネットへ）
  const rel = packTarget(req);
  if (rel) e.respondWith(fromPack(req, rel).catch(() => fetch(req)));
});

self.addEventListener('message', (e) => {
  const m = e.data || {};
  const port = e.ports && e.ports[0];
  if (!port || (m.t !== 'kz-prepare' && m.t !== 'kz-off')) return;
  const send = (x) => { try { port.postMessage(x); } catch (err) { /* */ } };
  send({ t: 'kz-ack' });
  if (m.t === 'kz-off') {
    // ?nopack: この あと しばらく しまった 中みを 使わない
    pack.off = true;
    send({ t: 'kz-done', ok: true, off: true });
    return;
  }
  pack.off = false;
  // できたら すぐ 返事（そうじは その あと）
  const job = prepare(String(m.v || ''), (done, total) => send({ t: 'kz-progress', done, total }))
    .then((after) => { send({ t: 'kz-done', ok: true }); return after && after(); })
    .catch((err) => send({ t: 'kz-done', ok: false, error: String((err && err.message) || err) }));
  if (e.waitUntil) e.waitUntil(job);
});

// ───────────── パック（はじめの 読みこみを 速く する。加速だけ） ─────────────
// ・版ごとに「その 版の 全部の 中み」を 1つに まとめて Cache Storage に しまう（1回で 読める）
// ・中みは ハッシュで 見分ける。版が かわっても、中みが 同じ ファイルは 取りに 行かない
// ・しまうのは ?v= を つける 前の 中み。返す 時に ?v=<版> を つける（家族サーバー・サイトと 同じ つけかた）
// ・ハッシュが 合わない ものは 使わない（ふつうに ネットから 読む）
// ・index.html と ページを 開く 時（ナビゲーション）は 決して しまわない
// ・のこすのは 今の 版と 直前の 版だけ（古い ものは そうじ）
const FILES = 'kizuna-files-v1';
const META = 'kizuna-meta-v1';
const FEW = 40; // 足りないのが これ以下なら 1つずつ、多ければ パック 1本
// mem: ハッシュ → 中み（読みこみの あいだ メモリに おく。しばらく 使わなければ すてる）
const pack = { off: false, manifests: new Map(), mem: new Map(), memTimer: 0, loading: new Map() };
const MEM_KEEP = 60000;
function memKeep() {
  clearTimeout(pack.memTimer);
  pack.memTimer = setTimeout(() => { pack.mem.clear(); pack.loading.clear(); }, MEM_KEEP);
}

// スコープ（sw.js の ある 所）からの パス
function scopeBase() {
  return new URL('./', self.location.href).href;
}
function packTarget(req) {
  if (req.method !== 'GET' || pack.off) return '';
  let u;
  try { u = new URL(req.url); } catch (err) { return ''; }
  if (u.origin !== self.location.origin || !u.searchParams.get('v')) return '';
  if (!/\.(js|css)$/.test(u.pathname)) return '';
  const base = scopeBase();
  const plain = u.origin + u.pathname;
  if (plain.indexOf(base) !== 0) return '';
  const rel = plain.slice(base.length);
  return rel === 'sw.js' ? '' : rel;
}
const bundleKey = (v) => `${scopeBase()}__kizuna/b/${v}`;
const manifestKey = (v) => `${scopeBase()}__kizuna/m/${v}`;
const listKey = () => `${scopeBase()}__kizuna/list`;

// './x.js' の 読みこみに ?v= を つける（server/stamp.js の stampImports と 同じ）
function stampImports(src, v) {
  const tag = (spec) => `${spec}?v=${v}`;
  return src
    .replace(/(\bfrom\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`)
    .replace(/(\bimport\s+)(['"])(\.{1,2}\/[^'"?\n]+?\.js)\2/g, (m, a, q, spec) => `${a}${q}${tag(spec)}${q}`);
}
const stampable = (rel) => /\.js$/.test(rel) && rel.split('/').indexOf('vendor') < 0 && rel !== 'sw.js';
// ネットから とった ?v= つきの 中みを、つける 前に もどす
const unstamp = (text, v) => text.split(`?v=${v}`).join('');
const typeOf = (rel) => (/\.css$/.test(rel) ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8');

// 中みの ハッシュ（sha256 の 16進 先の 20文字。server/stamp.js の contentHash と 同じ）
async function sha(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < 10; i++) s += (b[i] < 16 ? '0' : '') + b[i].toString(16);
  return s;
}

function filesCache() {
  if (!pack.files) pack.files = caches.open(FILES).catch((err) => { pack.files = null; throw err; });
  return pack.files;
}

// しまって ある 版の 目録（全部 しまえた 版だけ ある）
async function readManifest(v) {
  if (pack.manifests.has(v)) return pack.manifests.get(v);
  const meta = await caches.open(META);
  const r = await meta.match(manifestKey(v));
  if (!r) return null;
  const m = await r.json();
  remember(v, m);
  return m;
}
function remember(v, m) {
  pack.manifests.set(v, m);
  if (pack.manifests.size > 3) pack.manifests.delete(pack.manifests.keys().next().value);
}

// 版 v の まとめを メモリへ（1回だけ 読む）
function loadBundle(v) {
  if (!pack.loading.has(v)) {
    pack.loading.set(v, (async () => {
      const files = await filesCache();
      const r = await files.match(bundleKey(v));
      if (!r) return false;
      const b = await r.json();
      for (const h in b) if (!pack.mem.has(h)) pack.mem.set(h, b[h]);
      memKeep();
      return true;
    })().catch(() => { pack.loading.delete(v); return false; }));
  }
  return pack.loading.get(v);
}

async function fromPack(req, rel) {
  const v = new URL(req.url).searchParams.get('v');
  const m = pack.manifests.get(v) || await readManifest(v);
  const h = m && m.files && m.files[rel];
  if (!h) return fetch(req);
  let text = pack.mem.get(h);
  if (text === undefined && await loadBundle(v)) text = pack.mem.get(h);
  if (text === undefined) return fetch(req);
  memKeep();
  return new Response(stampable(rel) ? stampImports(text, v) : text, {
    status: 200,
    headers: { 'Content-Type': typeOf(rel), 'X-Kizuna-Pack': '1' },
  });
}

async function readList(meta) {
  try {
    const r = await meta.match(listKey());
    const list = r ? await r.json() : [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    return [];
  }
}

// 版 v を 用意する（持っていない ファイルだけ 取りに 行く）。
// もどりち: 返事の あとに する こと（しまう・そうじ）か null
async function prepare(v, progress) {
  if (!/^[A-Za-z0-9]{1,40}$/.test(v)) throw new Error('bad version');
  // もう 用意してある 版: まとめを メモリに 読むだけ
  if (await readManifest(v)) {
    if (await loadBundle(v)) return null;
    pack.manifests.delete(v);
  }
  const base = scopeBase();
  const res = await fetch(`${base}pack-manifest.json?v=${v}`);
  if (!res.ok) throw new Error(`manifest ${res.status}`);
  const m = await res.json();
  if (!m || m.v !== v || !m.files) throw new Error('manifest version');
  // 前の 版の まとめが あれば メモリへ（中みが 同じ ファイルは 取りに 行かない）
  const meta = await caches.open(META);
  const list = await readList(meta);
  const prev = list.filter((x) => x !== v).pop();
  if (prev) await loadBundle(prev);
  const need = Object.keys(m.files).filter((rel) => !pack.mem.has(m.files[rel]));
  // ハッシュが 合う ものだけ 使う
  const take = async (rel, text) => {
    if ((await sha(text)) !== m.files[rel]) return false;
    pack.mem.set(m.files[rel], text);
    return true;
  };
  if (need.length && need.length <= FEW) {
    let done = 0;
    progress(0, need.length);
    await pool(need, 8, async (rel) => {
      const r = await fetch(`${base}${rel}?v=${v}`);
      if (!r.ok) throw new Error(`${rel} ${r.status}`);
      await take(rel, unstamp(await r.text(), v));
      progress(++done, need.length);
    });
  } else if (need.length) {
    const r = await fetch(`${base}pack.json?v=${v}`);
    if (!r.ok) throw new Error(`pack ${r.status}`);
    const total = m.size || 1;
    let text;
    if (r.body && r.body.getReader) {
      // 進みぐあいを 知らせながら 読む
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      const parts = [];
      let got = 0;
      let last = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        got += value.length;
        parts.push(dec.decode(value, { stream: true }));
        if (Date.now() - last > 150) { last = Date.now(); progress(Math.min(got, total), total); }
      }
      parts.push(dec.decode());
      text = parts.join('');
    } else {
      text = await r.text();
    }
    progress(total, total);
    const p = JSON.parse(text);
    if (!p || p.v !== v || !p.files) throw new Error('pack version');
    // たしかめる あいだも「動いている」と 知らせる（ページは 返事が 止まると あきらめる）
    let checked = 0;
    await pool(need, 16, async (rel) => {
      const it = p.files[rel];
      if (it && it[0] === m.files[rel]) await take(rel, it[1]);
      if (++checked % 100 === 0) progress(total, total);
    });
    progress(total, total);
  }
  remember(v, m);
  memKeep();
  // ここで ページに「できた」と 返す。
  // 返事の あと: この 版の まとめを しまい、目録を 書き（全部 しまえた しるし）、古い ものを そうじ
  return async () => {
    const b = {};
    for (const rel in m.files) {
      const h = m.files[rel];
      if (!pack.mem.has(h)) return; // とちゅうで メモリが すてられた: しまわない（次の 時に もう一度）
      b[h] = pack.mem.get(h);
    }
    const files = await filesCache();
    await files.put(bundleKey(v), new Response(JSON.stringify(b), { headers: { 'Content-Type': 'application/json' } }));
    pack.loading.set(v, Promise.resolve(true));
    await meta.put(manifestKey(v), new Response(JSON.stringify(m), { headers: { 'Content-Type': 'application/json' } }));
    await cleanup(v, files, meta);
  };
}

// n こずつ ならべて 動かす
async function pool(list, n, fn) {
  let i = 0;
  const run = async () => { while (i < list.length) await fn(list[i++]); };
  const runs = [];
  for (let k = 0; k < Math.min(n, list.length); k++) runs.push(run());
  await Promise.all(runs);
}

// 古い ものの そうじ: 今の 版と 直前の 版 いがいの まとめ・目録を 消す
async function cleanup(v, files, meta) {
  const keep = keepVersions(await readList(meta), v);
  await meta.put(listKey(), new Response(JSON.stringify(keep)));
  const old = (url) => {
    const mm = url.match(/__kizuna\/[bm]\/([A-Za-z0-9]+)$/);
    return mm && keep.indexOf(mm[1]) < 0 ? mm[1] : '';
  };
  for (const r of await files.keys()) if (old(r.url)) await files.delete(r);
  for (const r of await meta.keys()) {
    const ov = old(r.url);
    if (ov) { await meta.delete(r); pack.manifests.delete(ov); pack.loading.delete(ov); }
  }
}
// のこす 版（直前の 版と 今の 版）
function keepVersions(list, v) {
  const prev = list.filter((x) => x !== v);
  return prev.length ? [prev[prev.length - 1], v] : [v];
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// kind: 'pc'（家の PC まで とどかない）/ 'server'（PC には とどくが 家族サーバーが 動いていない）
function downPage(kind = 'pc') {
  const site = esc(siteUrl());
  const what = kind === 'server'
    ? `<div class="gold">家族サーバーが動いていません</div>
  <p>家のPCにはつながりましたが、家族サーバー（黒い画面）が動いていません。</p>
  <p class="small">・黒い画面が「続行するには…」で止まった時は、閉じて start.bat をもう一度開く<br>・黒い画面がない時は、start.bat を開く</p>`
    : `<div class="gold">家族サーバーにつながりません</div>
  <p>家のPCまで、通信がとどいていません。</p>
  <p class="small">・PCの電源が入っているか、スリープしていないか<br>・PCの Tailscale がつながっているか（外からは、このスマホで <a href="https://login.tailscale.com/admin/machines">login.tailscale.com</a> を開くと、PCが「Connected」か見られます）<br>・このページのアドレス（${esc(self.location.host)}）が、家族サーバーの黒い画面の「★外出先から」のアドレスと同じか（PCの名前を変えると、アドレスも変わります）</p>`;
  const html = `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0b0a24">
<title>きずなの紋章</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    background: linear-gradient(#0b0a24, #2a2360); color: #f4f2ff;
    font-family: -apple-system, "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    display: flex; align-items: center; justify-content: center;
    padding: max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom));
    box-sizing: border-box;
  }
  .win {
    width: min(100%, 460px); background: #07071a; border: 3px solid #f4f2ff; border-radius: 12px;
    box-shadow: 0 0 0 3px #07071a; padding: 20px; display: flex; flex-direction: column; gap: 12px;
  }
  .logo { font-size: 1.5em; font-weight: bold; letter-spacing: 0.1em; text-align: center; }
  .gold { color: #ffd66b; font-weight: bold; font-size: 1.1em; }
  p { margin: 0; line-height: 1.6; }
  .row { display: flex; gap: 10px; flex-wrap: wrap; }
  .btn {
    flex: 1 1 auto; text-align: center; padding: 12px 14px; border-radius: 10px; font-size: 1em;
    border: 3px solid #f4f2ff; background: #16163a; color: #f4f2ff; text-decoration: none; font-family: inherit;
  }
  .btn.primary { border-color: #ffd66b; color: #ffd66b; }
  .small { font-size: 0.8em; color: #a9a6c9; word-break: break-all; }
  .small a { color: #ffd66b; }
</style>
</head>
<body>
<div class="win">
  <div class="logo">きずなの紋章</div>
  ${what}
  <p>PCが使えない時は、ひとりで遊ぶサイトで遊べます（あとで家族サーバーに合わせられます）。</p>
  <div class="row">
    <a class="btn primary" href="${site}">📱 ひとりで遊ぶサイトへ</a>
    <button class="btn" onclick="location.reload()">もう一度つなぐ</button>
  </div>
  <div class="small" id="note">家族サーバーが動いたら、自動でつながります</div>
  <div class="small">${site}</div>
</div>
<script>
  // 家族サーバーが動いたら、ゲームのページにもどる
  setInterval(function () {
    fetch('api/info', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.app === 'kizuna') location.reload();
    }).catch(function () {});
  }, 6000);
</script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}
