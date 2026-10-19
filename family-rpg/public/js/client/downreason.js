// 家族サーバーに つながらない ときに、どこで 止まっているかを しらべる（public/sw.js と おなじ 考え方）
// ・通信エラー … 家の PC まで とどいていない（PC の 電源・スリープ・Tailscale）。家の Wi-Fi の http では 見分けられない
// ・502〜504 … 家の PC（Tailscale Funnel）には とどいたが、家族サーバー（黒い 画面）が 動いていない
//   （家族サーバーは この 番号を 返さない。Tailscale が「うしろの サーバーに つながらない」ときに 返す）
// ・200 … 家族サーバーは 動いている（つなぎなおせば よい）

// もどりち: 'pc' | 'server' | 'up' | 'unknown'
export async function downReason({ fetchImpl = globalThis.fetch, loc = globalThis.location, timeoutMs = 4000 } = {}) {
  const outside = /^https:$/.test(loc?.protocol || '') && !/^(localhost|127\.|\[::1\])/.test(loc?.hostname || '');
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
    const r = await fetchImpl('api/info', { cache: 'no-store', signal: ctrl?.signal });
    if (t) clearTimeout(t);
    if (r.status >= 502 && r.status <= 504) return 'server';
    return r.ok ? 'up' : 'unknown';
  } catch {
    return outside ? 'pc' : 'unknown';
  }
}

// 画面に 出す 文（さいごの「ひとりで遊ぶサイト」の 文は 出す がわで つける）
export const DOWN_TEXT = {
  pc: '家のPCまで、通信がとどいていません。\n・PCの電源が入っているか、スリープしていないか\n・PCの Tailscale がつながっているか（外からは、このスマホで login.tailscale.com を開くと、PCが「Connected」か見られます）\n・開いているアドレスが、家族サーバーの黒い画面の「★外出先から」のアドレスと同じか（PCの名前を変えると、アドレスも変わります）',
  server: '家のPCにはつながりましたが、家族サーバー（黒い画面）が動いていません。\n・黒い画面が「続行するには…」で止まった時は、閉じて start.bat をもう一度開く\n・黒い画面がない時は、start.bat を開く',
  up: '家族サーバーは動いています。「もう一度つなぐ」をおしてね。',
  unknown: '家のPCの電源と、家族サーバー（黒い画面）が動いているか確かめてください。\n・黒い画面が「続行するには…」で止まった時は、閉じて start.bat をもう一度開く\n・PCがスリープしていないか\n・外出先からの時は、PCの Tailscale がつながっているかも見る',
};
