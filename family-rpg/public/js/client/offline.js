// ひとりモード: ブラウザの なかで サーバーを うごかす
import { GameWorld } from '../shared/world/world.js';

const KEY = 'kizuna_offline_save_v1';

export const offlineStorage = {
  ok: true,
  load() {
    try {
      const s = localStorage.getItem(KEY);
      return s ? JSON.parse(s) : {};
    } catch {
      this.ok = false;
      return {};
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      this.ok = true;
    } catch {
      this.ok = false;
    }
  },
  exportText() {
    try {
      return localStorage.getItem(KEY) || '';
    } catch {
      return '';
    }
  },
};

export function startOffline(deliver) {
  const world = new GameWorld({ storage: offlineStorage, offline: true, familyName: 'このブラウザ' });
  const conn = {
    send: (msg) => {
      const copy = JSON.parse(JSON.stringify(msg));
      queueMicrotask(() => deliver(copy));
    },
  };
  const session = world.connect(conn);
  let last = performance.now();
  setInterval(() => {
    const now = performance.now();
    const dt = Math.max(0, Math.min(200, now - last));
    last = now;
    try {
      world.tick(dt);
    } catch (e) {
      console.error(e);
    }
  }, 50);
  // タブを とじる まえに セーブ
  const flush = () => { world.markDirty(); world.saveNow(); };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  return {
    world,
    send(msg) {
      const copy = JSON.parse(JSON.stringify(msg));
      queueMicrotask(() => world.handle(session, copy));
    },
    storage: offlineStorage,
  };
}
