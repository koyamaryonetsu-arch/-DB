// Tailscale Funnel（外出先から、スマホに アプリを 入れずに つながる https の アドレス）を しらべる
// ・PC に Tailscale が 入っていて、funnel-on（tailscale funnel --bg 3000）を した ときに アドレスが わかる
import { execFile } from 'node:child_process';

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
    if (!j || typeof j !== 'object') return { installed: true, state: 'NoDaemon', expiry: '', expired: false };
    return { installed: true, state: String(j.BackendState || ''), expiry: String(j.Self?.KeyExpiry || ''), expired: !!j.Self?.Expired };
  }
  return { installed: false, state: '', expiry: '', expired: false };
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
