// ひとりモード: ブラウザの なかで サーバーを うごかす
// セーブは このブラウザ（localStorage）と、claude.ai の アーティファクトの 中なら クラウド（cloudsave.js）の 両方に
import { GameWorld } from '../shared/world/world.js';
import { pruneEntries } from '../shared/world/sync.js';
import { openCloud, adoptCloud } from './cloudsave.js';

const KEY = 'kizuna_offline_save_v1';
const SYNC_KEY = 'kizuna_sync_v1';

// 家族サーバーと キャラを 合わせる ときに おぼえておく 版（sync.js）。この ブラウザに
export function localSyncStore(backend, max = 5) {
  const ls = () => backend || globalThis.localStorage;
  let all = null;
  const load = () => {
    if (all) return all;
    try {
      all = JSON.parse(ls().getItem(SYNC_KEY) || '{}');
    } catch {
      all = {};
    }
    if (!all || typeof all !== 'object' || Array.isArray(all)) all = {};
    return all;
  };
  return {
    entries(id) {
      const l = load()[id];
      return Array.isArray(l) ? l : [];
    },
    add(id, entry) {
      const a = load();
      a[id] = pruneEntries([entry, ...this.entries(id)], max);
      try {
        ls().setItem(SYNC_KEY, JSON.stringify(a));
      } catch {
        // いっぱいの ときは 古い 版を へらして もう一度
        for (const k of Object.keys(a)) a[k] = a[k].slice(0, 2);
        try {
          ls().setItem(SYNC_KEY, JSON.stringify(a));
        } catch { /* */ }
      }
    },
  };
}

// キャラの しるし（savedAt は のぞく。いちだけ かわったかも 見る）
function sig(c) {
  const { savedAt, pos, ...rest } = c;
  const noPos = JSON.stringify(rest);
  return { noPos, full: noPos + JSON.stringify(pos || null) };
}

// backend … localStorage と おなじ 形（テストでは メモリ）。さわるのは try の 中だけ
//（アーティファクトの 中では localStorage に さわるだけで エラーに なることが ある）
export function makeOfflineStorage(backend) {
  const ls = () => backend || globalThis.localStorage;
  return {
    ok: true,
    cloud: null,
    seen: new Map(),
    boardSeen: '',
    load() {
      try {
        const s = ls().getItem(KEY);
        return s ? JSON.parse(s) : {};
      } catch {
        this.ok = false;
        return {};
      }
    },
    write(data) {
      try {
        ls().setItem(KEY, JSON.stringify(data));
        this.ok = true;
      } catch {
        this.ok = false;
      }
    },
    // いまの セーブを「セーブずみ」として おぼえる（時こくは つけない）
    prime(data) {
      this.seen = new Map(Object.values(data.characters || {}).map((c) => [c.id, sig(c)]));
      this.boardSeen = JSON.stringify(data.board || []);
    },
    save(data, opts) {
      const now = Date.now();
      // かわった キャラに セーブした 時こくを つける（クラウドと くらべる ため）
      const changes = [];
      for (const c of Object.values(data.characters || {})) {
        const s = sig(c);
        const prev = this.seen.get(c.id);
        if (prev && prev.full === s.full) continue;
        changes.push({ id: c.id, posOnly: !!prev && prev.noPos === s.noPos });
        c.savedAt = now;
        this.seen.set(c.id, s);
      }
      // 消した キャラは しるしを のこす（ほかの 場所の セーブから もどってこない ように）
      const gone = [...this.seen.keys()].filter((id) => !data.characters?.[id]);
      if (gone.length) {
        data.deleted = data.deleted || {};
        for (const id of gone) {
          this.seen.delete(id);
          data.deleted[id] = now;
        }
      }
      const board = JSON.stringify(data.board || []);
      const boardChanged = board !== this.boardSeen;
      this.boardSeen = board;
      this.write(data);
      this.cloud?.noteChanges({ changes, gone, boardChanged, urgent: !!opts?.urgent });
    },
    exportText() {
      try {
        return ls().getItem(KEY) || '';
      } catch {
        return '';
      }
    },
  };
}

export const offlineStorage = makeOfflineStorage();

// クラウドセーブの ようす（画面に 出す）
//  loading … 読みこみ中 / asking … つかって いいか 確認中 / on … クラウドに セーブ
//  error … セーブできない 状態が つづいている / readonly … 見るだけの 共有などで 書けない / off … つかえない
export function cloudStatus(claude = globalThis.window?.claude) {
  const listeners = new Set();
  return {
    state: 'loading',
    inViewer: !!claude,
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    set(s) {
      if (this.state === s) return;
      this.state = s;
      for (const fn of listeners) {
        try {
          fn(s);
        } catch { /* */ }
      }
    },
  };
}

// クラウドの セーブを 読んで せかいに まぜ、そのあとの セーブを クラウドにも 書く ように する
export async function attachCloud(world, storage, status, claude) {
  try {
    const cloud = await openCloud(claude, { onWait: () => status.set('asking') });
    if (!cloud) {
      status.set('off');
      return null;
    }
    let remote;
    try {
      remote = await cloud.load();
    } catch {
      status.set('off');
      return null;
    }
    adoptCloud(world, remote);
    storage.prime(world.data);
    storage.write(world.data);
    cloud.source = () => world.data;
    cloud.prime(world.data);
    storage.cloud = cloud;
    cloud.onChange((s) => status.set(s));
    status.cloud = cloud;
    status.set(cloud.state);
    return cloud;
  } catch (e) {
    // なにが あっても このブラウザの セーブで 遊べる ように
    console.error('cloud save', e);
    status.set('off');
    return null;
  }
}

export function startOffline(deliver) {
  const world = new GameWorld({ storage: offlineStorage, syncStore: localSyncStore(), offline: true, familyName: 'このブラウザ' });
  offlineStorage.prime(world.data);
  const status = cloudStatus();
  // クラウドの セーブを 読みおわるまで、遊ぶ ための メッセージは まつ
  // （古い セーブで 遊びはじめて、新しい セーブを 上書きしない ように）
  const ready = attachCloud(world, offlineStorage, status, globalThis.window?.claude);
  // ひとりで遊ぶサイトでは、ブラウザに「このサイトの データを 消さないで」と たのむ
  if (!status.inViewer) {
    try {
      navigator.storage?.persist?.().catch(() => {});
    } catch { /* */ }
  }
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
  // タブを とじる・ほかの アプリに うつる まえに セーブ（クラウドにも すぐ 書く）
  const flush = () => {
    world.markDirty();
    world.saveNow();
    offlineStorage.cloud?.flush(true);
  };
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
  return {
    world,
    ready,
    cloud: status,
    send(msg) {
      const copy = JSON.parse(JSON.stringify(msg));
      ready.then(() => world.handle(session, copy));
    },
    storage: offlineStorage,
  };
}
