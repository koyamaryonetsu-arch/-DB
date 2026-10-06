// Tailscale Funnel（外出先から、スマホに アプリを 入れずに つながる https の アドレス）を しらべる
// ・PC に Tailscale が 入っていて、funnel-on（tailscale funnel --bg 3000）を した ときに アドレスが わかる
import { execFile } from 'node:child_process';
import dns from 'node:dns';

const CANDIDATES = process.platform === 'win32'
  ? ['tailscale', 'C:\\Program Files\\Tailscale\\tailscale.exe']
  : process.platform === 'darwin'
    ? ['tailscale', '/Applications/Tailscale.app/Contents/MacOS/Tailscale', '/opt/homebrew/bin/tailscale', '/usr/local/bin/tailscale']
    : ['tailscale'];

function run(bin, args, ms = 3000) {
  return new Promise((resolve) => {
    try {
      execFile(bin, args, { timeout: ms, windowsHide: true }, (err, stdout) => resolve(err ? null : String(stdout || '')));
    } catch {
      resolve(null);
    }
  });
}

// もどりち: { installed: Tailscale が あるか, url: 'https://…'（Funnel が ON の とき。ほかは ''） }
export async function findFunnelUrl(port, { runImpl = run, candidates = CANDIDATES } = {}) {
  for (const bin of candidates) {
    const out = await runImpl(bin, ['serve', 'status', '--json']);
    if (out === null) continue;
    let j = {};
    try {
      j = JSON.parse(out || '{}') || {};
    } catch {
      j = {};
    }
    for (const [hostPort, on] of Object.entries(j.AllowFunnel || {})) {
      if (!on) continue;
      // この サーバーの ポートへ つないでいる Funnel だけ
      const handlers = Object.values(j.Web?.[hostPort]?.Handlers || {});
      const proxies = handlers.map((h) => String(h?.Proxy || ''));
      if (proxies.length && !proxies.some((p) => new RegExp(`:${port}(/|$)`).test(p))) continue;
      const [host, p] = hostPort.split(':');
      if (!/^[a-z0-9.-]+$/i.test(host)) continue;
      return { installed: true, url: `https://${host}${p && p !== '443' ? `:${p}` : ''}` };
    }
    return { installed: true, url: '' };
  }
  return { installed: false, url: '' };
}

// コマンドの 出力（コマンドが 見つからない ときは notFound）
function runOut(bin, args, ms = 4000) {
  return new Promise((resolve) => {
    try {
      execFile(bin, args, { timeout: ms, windowsHide: true }, (err, stdout) => {
        if (err && err.code === 'ENOENT') resolve({ notFound: true });
        else resolve({ out: String(stdout || ''), failed: !!err });
      });
    } catch {
      resolve({ notFound: true });
    }
  });
}

// Tailscale の ようす（tailscale status --json）
// もどりち: { installed, state: 'Running' | 'NeedsLogin' | 'Stopped' | 'NoDaemon'（動いていない）| …, expiry: ログインの 期限, expired }
export async function tailscaleState({ runImpl = runOut, candidates = CANDIDATES } = {}) {
  for (const bin of candidates) {
    const r = await runImpl(bin, ['status', '--json']);
    if (!r || r.notFound) continue;
    let j = null;
    try {
      j = JSON.parse(r.out || '');
    } catch {
      j = null;
    }
    if (!j || typeof j !== 'object') return { installed: true, state: 'NoDaemon', expiry: '', expired: false, dnsName: '' };
    return {
      installed: true, state: String(j.BackendState || ''), expiry: String(j.Self?.KeyExpiry || ''), expired: !!j.Self?.Expired,
      // 今の PC の 名前（pc.tailxxxx.ts.net。さいごの「.」は とる）
      dnsName: String(j.Self?.DNSName || '').replace(/\.$/, '').toLowerCase(),
    };
  }
  return { installed: false, state: '', expiry: '', expired: false, dnsName: '' };
}

// 外出先用の 設定（funnel-on）の アドレスが、今の PC の 名前と ちがう ときの 文（同じ・わからない ときは []）
// ・Tailscale の 管理画面で PC の 名前（や tailnet の 名前）を かえると、funnel-on の 設定は 古い 名前の まま のこり、
//   古い アドレスは インターネットから 消える（外からは「見つからない」）
export function funnelNameWarning(url, dnsName) {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return [];
  }
  const now = String(dnsName || '').replace(/\.$/, '').toLowerCase();
  if (!host || !now || host === now) return [];
  const short = now.split('.')[0];
  return [
    `★ 外出先用の設定のアドレス（https://${host}）が、今のPCの名前（https://${now}）と合っていません。`,
    '   Tailscale でPCの名前を変えると、外出先用の設定はやり直しが必要です（古いアドレスは外から開けません）。',
    `   funnel-off → funnel-on の順にダブルクリックすると、新しいアドレス https://${now} で開けるようになります。`,
    `   もとのアドレスのままにしたい時は、Tailscale の管理画面でPCの名前を「${host.split('.')[0]}」にもどしてね（今は「${short}」）。`,
  ];
}

// 外出先から つながらない ようすの ときに 黒い 画面に 出す 文（だいじょうぶな ときは []）
// ・Tailscale の ログインが 切れた・OFF・動いていない
// ・ログインの 期限（ふつうは 180日）が 2週間 いないに 切れる
export function tailscaleWarning(st, now = Date.now()) {
  if (!st?.installed) return [];
  const tail = '   （家のWi-Fiからは、いつも通り遊べます）';
  if (st.state === 'NeedsLogin' || st.expired) {
    return [
      '★ 外出先から遊ぶ時のつながり（Tailscale）のログインが切れています。外出先からは開けません。',
      '   PCのタスクバーの Tailscale のアイコンから、ログインしなおしてね。',
      tail,
    ];
  }
  if (st.state === 'Stopped') {
    return [
      '★ 外出先から遊ぶ時のつながり（Tailscale）が OFF です。外出先からは開けません。',
      '   PCのタスクバーの Tailscale のアイコンから、Connect を選んでね。',
      tail,
    ];
  }
  if (st.state === 'NoDaemon') {
    return [
      '★ 外出先から遊ぶ時のつながり（Tailscale）が動いていないようです。外出先からは開けません。',
      '   スタートメニューなどから Tailscale を起動してね。',
      tail,
    ];
  }
  const end = Date.parse(st.expiry);
  if (st.state === 'Running' && Number.isFinite(end) && end > now && end - now < 14 * 86400000) {
    const d = new Date(end);
    return [
      `★ Tailscale のログインの期限は${d.getMonth() + 1}月${d.getDate()}日までです。切れると、外出先からは開けなくなります。`,
      '   https://login.tailscale.com/admin/machines で、このPCの「…」→「Disable key expiry」を選ぶと、期限がなくなります。',
    ];
  }
  return [];
}

// 外出先の アドレス（Funnel）が、インターネットの DNS に 出ているか
// ・Funnel が Tailscale の がわで ほんとうに 有効なら、（PCの 名前）.….ts.net の 名前は だれからでも 引ける
//   （PC の 中の 設定が「Funnel ON」でも、Tailscale の がわで 許可されていないと 名前が 出ない。外からは「見つからない」）
// ・PC の 中では MagicDNS（Tailscale の 中だけの 名前）で 引けて しまうので、外の DNS（8.8.8.8・1.1.1.1）に じかに 聞く
// もどりち: 'ok'（出ている）/ 'missing'（どちらの DNS も「ない」と 答えた）/ 'unknown'（しらべられない）
export async function funnelPublicDns(host, {
  servers = [['8.8.8.8', '8.8.4.4'], ['1.1.1.1', '1.0.0.1']],
  resolverFactory = () => new dns.promises.Resolver({ timeout: 3000, tries: 2 }),
} = {}) {
  if (!/^[a-z0-9.-]+\.[a-z]+$/i.test(host || '')) return 'unknown';
  let missing = 0;
  for (const list of servers) {
    try {
      const r = resolverFactory();
      r.setServers(list);
      const [a4, a6] = await Promise.allSettled([r.resolve4(host), r.resolve6(host)]);
      if ((a4.status === 'fulfilled' && a4.value.length) || (a6.status === 'fulfilled' && a6.value.length)) return 'ok';
      const codes = [a4, a6].map((x) => x.reason?.code);
      if (codes.every((c) => c === 'ENOTFOUND' || c === 'ENODATA')) missing++;
    } catch { /* しらべられない */ }
  }
  return missing === servers.length ? 'missing' : 'unknown';
}

// 外出先の アドレスが インターネットに 出ていない ときに 黒い 画面に 出す 文（だいじょうぶな ときは []）
export function funnelDnsWarning(url, state) {
  if (state !== 'missing') return [];
  return [
    `★ 外出先からのアドレス（${url}）が、インターネットに公開されていません（Tailscale の Funnel が有効になっていません）。`,
    '   このままでは、外出先のスマホから開けません（スマホの Tailscale アプリをONにした時だけ開けます）。',
    '   funnel-on をもう一度ダブルクリックして、リンクが出たら開いて「Funnel」を許可してね。',
    '   許可したあと、数分で使えるようになります（この画面にも「もどりました」と出ます）。',
  ];
}
