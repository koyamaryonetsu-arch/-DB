// アクセスされた アドレスの パスを、こわれた アドレスでも 落ちずに 読む
// ・外出先の アドレス（Tailscale Funnel）は インターネットに 公開されるので、見まわりの ツールが
//   「//a:b」「/index.php%00.txt」の ような へんな アドレスを 送ってくる。
//   前は new URL() や fs.stat() が エラーに なって、家族サーバーが 止まって いた

// リクエストの パス（? より まえ。%xx は そのまま）。読めない ときは null
export function requestPath(rawUrl) {
  const raw = String(rawUrl ?? '');
  if (raw.startsWith('/')) {
    const cut = raw.search(/[?#]/);
    return cut >= 0 ? raw.slice(0, cut) : raw;
  }
  // 「http://…/」の 形（プロキシの 形）
  if (/^https?:\/\//i.test(raw)) {
    try {
      return new URL(raw).pathname;
    } catch {
      return null;
    }
  }
  return null;
}

// ファイルを さがす ための パス（%xx を もどす）。読めない・NUL（%00）が ある ときは null
export function decodePath(p) {
  if (typeof p !== 'string') return null;
  let d;
  try {
    d = decodeURIComponent(p);
  } catch {
    return null;
  }
  return d.includes('\0') ? null : d;
}
