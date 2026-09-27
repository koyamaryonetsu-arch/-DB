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
