// サーバーとの つうしん
// ・家族サーバーが あれば WebSocket で つなぐ
// ・なければ ブラウザの なかで サーバーを うごかす（ひとりモード）

export class Net {
  constructor() {
    this.handlers = new Set();
    this.mode = 'offline';
    this.status = 'connecting';
    this.statusHandlers = new Set();
  }

  static async create() {
    const net = new Net();
    const server = await detectServer();
    if (server) {
      net.mode = 'server';
      net.family = server.family;
      net.urls = Array.isArray(server.urls) ? server.urls : [];
      net.site = server.site || '';
      net.version = server.version || '';
      net.connectWS();
      // iPhone: アプリに もどってきたら すぐに つなぎなおす（きれた つなぎが のこっている ことも ある）
      document.addEventListener('visibilitychange', () => net.onVisible());
      addEventListener('pageshow', () => net.onVisible());
    } else {
      net.mode = 'offline';
      const { startOffline } = await import('./offline.js?v=cb6fd0fb30e1');
      net.local = startOffline((msg) => net.deliver(msg));
      net.setStatus('ok');
    }
    return net;
  }

  on(fn) {
    this.handlers.add(fn);
    return () => this.handlers.delete(fn);
  }

  onStatus(fn) {
    this.statusHandlers.add(fn);
  }

  setStatus(s) {
    this.status = s;
    for (const fn of this.statusHandlers) fn(s);
  }

  deliver(msg) {
    for (const fn of [...this.handlers]) {
      try {
        fn(msg);
      } catch (e) {
        console.error('handler error', msg.t, e);
      }
    }
  }

  send(msg) {
    if (this.mode === 'offline') {
      this.local?.send(msg);
      return;
    }
    if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(msg));
  }

  connectWS() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${location.host}/ws`);
    this.ws = ws;
    this.setStatus('connecting');
    ws.onopen = () => {
      this.retry = 0;
      this.setStatus('ok');
      this.deliver({ t: '_open' });
    };
    ws.onmessage = (e) => {
      this.lastMsgAt = Date.now();
      let msg;
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      this.deliver(msg);
    };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.setStatus('lost');
      this.deliver({ t: '_close' });
      const wait = Math.min(8000, 800 * 2 ** (this.retry || 0));
      this.retry = (this.retry || 0) + 1;
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => this.connectWS(), wait);
    };
    ws.onerror = () => {};
    // こまめに ping（スマホの スリープ たいさく）
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => this.send({ t: 'ping', at: Date.now() }), 10000);
  }

  onVisible() {
    if (document.hidden || this.mode !== 'server') return;
    const ws = this.ws;
    if (!ws || ws.readyState >= 2) {
      clearTimeout(this.retryTimer);
      this.retry = 0;
      this.connectWS();
      return;
    }
    if (ws.readyState !== 1) return;
    // へんじが なければ きれている → すぐ つなぎなおす
    const at = Date.now();
    this.send({ t: 'ping', at });
    setTimeout(() => {
      if (this.ws !== ws || (this.lastMsgAt || 0) >= at) return;
      this.ws = null;
      try { ws.close(); } catch { /* */ }
      this.setStatus('lost');
      this.deliver({ t: '_close' });
      this.retry = 0;
      this.connectWS();
    }, 3500);
  }
}

async function detectServer() {
  if (!/^https?:$/.test(location.protocol)) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch('api/info', { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.app === 'kizuna' && j.server ? j : null;
  } catch {
    return null;
  }
}
