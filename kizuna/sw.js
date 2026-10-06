// 家族サーバーの ページを 開いた 時に、家の PC（家族サーバー）が 動いていなかったら、
// ブラウザの「開けません」の かわりに「ひとりで遊ぶサイト」への 案内を 出す。
// ・ページを 開く 時（ナビゲーション）だけ 見る。ほかの 読みこみは そのまま
// ・何も しまっておかない（古い ページが 出る ことは ない）
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
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).then(
    (r) => (r.status >= 502 && r.status <= 504 ? downPage('server') : r),
    () => downPage(onThisPc() ? 'server' : 'pc'),
  ));
});

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
