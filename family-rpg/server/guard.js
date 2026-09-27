// 合言葉の まもり（家族サーバーを インターネットから 開ける ように した とき の ため）
//
// ・だれから のアクセスか: Tailscale Funnel などを 通った アクセスは PC の 中（127.0.0.1）から くるので、
//   その 時だけ X-Forwarded-For に 書かれた 本当の アドレスを 見る（家の Wi-Fi から 書きかえられても 信じない）
// ・インターネットからの アクセスは、合言葉が じゅうぶん 長い 時だけ 入れる（6けたの 数字 などは だめ）
//   家の Wi-Fi（この PC と おなじ ネットワーク）から じかに 来た アクセスは、いつもの 合言葉で 入れる
// ・外からは、合言葉を 5回 まちがえた アドレスは 1分 待ち。そのあとも まちがえるたびに 待ちが 2倍（さいだい 1時間）
//   家の Wi-Fi からは、8回 まちがえたら 1分 待つ だけ（子どもの 打ちまちがい）
import os from 'node:os';

const LOOPBACK = /^(127\.|::1$|::ffff:127\.)/;

function stripV4Mapped(ip) {
  return String(ip || '').replace(/^::ffff:/, '').trim();
}

// アクセスして きた 人の アドレス
export function clientAddress(req) {
  const direct = stripV4Mapped(req?.socket?.remoteAddress);
  if (LOOPBACK.test(direct) || direct === '::1') {
    const xff = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0];
    const ip = stripV4Mapped(xff);
    if (ip) return ip;
  }
  return direct;
}

// 家の 中（LAN）・この PC・Tailscale の 中 ではない（＝インターネットから）
export function isPublicAddress(ip) {
  const a = stripV4Mapped(ip).toLowerCase();
  if (!a) return false;
  const m = a.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const [x, y] = [Number(m[1]), Number(m[2])];
    if (x === 10 || x === 127 || (x === 192 && y === 168) || (x === 172 && y >= 16 && y <= 31) || (x === 169 && y === 254) || (x === 100 && y >= 64 && y <= 127)) return false;
    return true;
  }
  if (a === '::1' || a.startsWith('fe80:') || /^f[cd][0-9a-f]{2}:/.test(a) || a.startsWith('fd7a:115c:a1e0:')) return false;
  return true;
}

// Funnel などの 中つぎ（この PC の 中）を 通って 来たか
function viaProxy(req) {
  const direct = stripV4Mapped(req?.socket?.remoteAddress);
  const xff = String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return (LOOPBACK.test(direct) || direct === '::1') && !!xff;
}

function v4bytes(a) {
  const m = a.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  const b = m.slice(1).map(Number);
  return b.every((x) => x <= 255) ? b : null;
}

function v6bytes(addr) {
  let a = addr.split('%')[0].toLowerCase();
  if (!a.includes(':')) return null;
  const tail = a.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (tail) {
    const b = v4bytes(tail[1]);
    if (!b) return null;
    a = a.slice(0, -tail[1].length) + `${((b[0] << 8) | b[1]).toString(16)}:${((b[2] << 8) | b[3]).toString(16)}`;
  }
  const halves = a.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const rest = halves.length === 2 ? (halves[1] ? halves[1].split(':') : []) : null;
  const parts = rest ? [...head, ...Array(Math.max(0, 8 - head.length - rest.length)).fill('0'), ...rest] : head;
  if (parts.length !== 8 || parts.some((x) => !/^[0-9a-f]{1,4}$/.test(x))) return null;
  const out = [];
  for (const x of parts) {
    const w = parseInt(x, 16);
    out.push(w >> 8, w & 255);
  }
  return out;
}

// ip が cidr（'192.168.1.0/24' など）の 中か
export function inCidr(ip, cidr) {
  const [base, bitsText] = String(cidr || '').split('/');
  const a = stripV4Mapped(ip);
  const x = v4bytes(a) || v6bytes(a);
  const y = v4bytes(base) || v6bytes(base || '');
  const bits = Number(bitsText);
  if (!x || !y || x.length !== y.length || !(bits >= 0)) return false;
  let left = bits;
  for (let i = 0; i < x.length && left > 0; i++, left -= 8) {
    const mask = left >= 8 ? 0xff : (0xff << (8 - left)) & 0xff;
    if ((x[i] & mask) !== (y[i] & mask)) return false;
  }
  return true;
}

// この PC と おなじ ネットワーク（家の Wi-Fi など）の アドレスか
export function isSameNetwork(ip, ifaces = os.networkInterfaces()) {
  for (const list of Object.values(ifaces || {})) {
    for (const f of list || []) {
      if (f?.cidr && inCidr(ip, f.cidr)) return true;
    }
  }
  return false;
}

// インターネットから（Funnel を 通って、または 家の ネットワークの 外から）の アクセスか
export function isFromInternet(req, ifaces) {
  const ip = clientAddress(req);
  if (!isPublicAddress(ip)) return false;
  if (viaProxy(req)) return true;
  return !isSameNetwork(ip, ifaces);
}

// インターネットから 入れても よい 合言葉か（8文字以上で 数字だけ でない、または 12文字以上）
export function strongEnough(pw) {
  const s = String(pw || '').normalize('NFKC').trim();
  const n = [...s].length;
  return n >= 12 || (n >= 8 && !/^\d+$/.test(s));
}

export class LoginGuard {
  constructor({ tries = 5, baseMs = 60 * 1000, maxMs = 60 * 60 * 1000, escalate = true } = {}) {
    this.tries = tries;
    this.baseMs = baseMs;
    this.maxMs = maxMs;
    this.escalate = escalate; // まちがえ 続けると 待ちが のびる
    this.map = new Map(); // アドレス → { count, until, level, at }
  }

  // 入って よいか。だめなら wait（ミリ秒）
  check(ip, now = Date.now()) {
    const e = this.map.get(ip);
    if (!e || e.until <= now) return { ok: true, wait: 0 };
    return { ok: false, wait: e.until - now };
  }

  fail(ip, now = Date.now()) {
    let e = this.map.get(ip);
    // 1日 なにも なければ わすれる
    if (!e || now - e.at > 24 * 60 * 60 * 1000) e = { count: 0, until: 0, level: 0, at: now };
    e.at = now;
    e.count++;
    if (e.count >= this.tries || (this.escalate && e.level > 0)) {
      e.until = now + Math.min(this.maxMs, this.baseMs * 2 ** (this.escalate ? e.level : 0));
      if (this.escalate) e.level++;
      e.count = 0;
    }
    this.map.set(ip, e);
    if (this.map.size > 5000) {
      for (const [k, v] of this.map) if (now - v.at > 60 * 60 * 1000) this.map.delete(k);
    }
    return e;
  }

  success(ip) {
    this.map.delete(ip);
  }
}
