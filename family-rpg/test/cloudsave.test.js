// クラウドセーブ（claude.ai の アーティファクトの db に 1人ずつ セーブ）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameWorld } from '../public/js/shared/world/world.js';
import { makeRng } from '../public/js/shared/rng.js';
import { gainExp, expForLevel } from '../public/js/shared/stats.js';
import { makeOfflineStorage, attachCloud, cloudStatus } from '../public/js/client/offline.js';
import { openCloud, CloudSave, WRITE_GAP, MOVE_GAP } from '../public/js/client/cloudsave.js';
import { Bot } from './helpers.js';

const clone = (v) => JSON.parse(JSON.stringify(v));

// claude.ai の db の にせもの（ドキュメントは メモリに）
function mockDb(store = new Map(), { failSet } = {}) {
  const ref = (path) => ({
    id: path.split('/').pop(),
    path,
    async get() {
      const v = store.get(path);
      return { id: path.split('/').pop(), exists: !!v, data: () => (v ? clone(v) : undefined) };
    },
    async set(data) {
      const err = failSet?.(path);
      if (err) throw err;
      store.set(path, clone(data));
    },
    async delete() {
      store.delete(path);
    },
  });
  return {
    store,
    writes: 0,
    doc: ref,
    collection(path) {
      const db = this;
      return {
        path,
        doc: (id) => {
          const r = ref(`${path}/${id}`);
          return { ...r, set: async (d) => { db.writes++; return r.set(d); }, delete: async () => { db.writes++; return r.delete(); } };
        },
        async get() {
          const docs = [...store.entries()]
            .filter(([k]) => k.startsWith(path + '/') && !k.slice(path.length + 1).includes('/'))
            .map(([k, v]) => ({ id: k.split('/').pop(), exists: true, data: () => clone(v) }));
          return { docs, size: docs.length, empty: !docs.length };
        },
      };
    },
  };
}

function mockClaude(db, { uid = 'u_papa', perm = 'granted' } = {}) {
  return {
    use: async (name) => {
      if (name === 'db') return db;
      if (name === 'user') return { id: async () => uid };
      if (name === 'permissions') return { state: async () => ({ db: perm, user: 'granted' }), request: async () => ({ db: 'granted', user: 'granted' }) };
      return null;
    },
  };
}

// ブラウザ 1つぶん（localStorage は メモリ）
function memoryBackend(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
}

async function device(db, { backend = memoryBackend(), uid, perm, claude } = {}) {
  const storage = makeOfflineStorage(backend);
  const world = new GameWorld({ storage, offline: true, rng: makeRng(3), rateLimit: false });
  storage.prime(world.data);
  const status = cloudStatus(claude === undefined ? mockClaude(db, { uid, perm }) : claude);
  const cloud = await attachCloud(world, storage, status, claude === undefined ? mockClaude(db, { uid, perm }) : claude);
  return { world, storage, status, cloud, backend };
}

async function playNew(dev, name, job = 'warrior') {
  const bot = new Bot(dev.world, name);
  await bot.login();
  await bot.createAndPlay(job);
  await bot.settle();
  return bot;
}

test('クラウドセーブ: このブラウザの セーブが 消えても、claude.ai から もどってくる', async () => {
  const db = mockDb();
  const a = await device(db);
  assert.equal(a.status.state, 'on');
  const bot = await playNew(a, 'ソラ');
  const c = a.world.data.characters[bot.char.id];
  gainExp(c, expForLevel(12) - c.exp);
  c.gold = 4321;
  a.world.markDirty();
  a.world.saveNow();
  await a.cloud.flush(true);
  assert.ok(db.store.has(`data/users/u_papa/c-${c.id}`), 'キャラ 1人 = 1つの 文書');
  assert.ok(db.store.has('data/users/u_papa/meta'));

  // ブラウザを 閉じた（localStorage が からっぽ）→ 開きなおす
  const b = await device(db);
  const back = b.world.data.characters[c.id];
  assert.ok(back, 'キャラが もどった');
  assert.equal(back.level, 12);
  assert.equal(back.gold, 4321);
  const bot2 = new Bot(b.world, 'ソラ');
  await bot2.login();
  bot2.send({ t: 'play', id: c.id });
  await bot2.settle();
  assert.equal(bot2.char.level, 12);
  // もどった セーブは このブラウザにも 書いてある
  assert.ok(JSON.parse(b.backend.map.get('kizuna_offline_save_v1')).characters[c.id]);
});

test('クラウドセーブ: ほかの 人の セーブは 見えない（1人ずつ べつの 場所）', async () => {
  const db = mockDb();
  const papa = await device(db, { uid: 'u_papa' });
  await playNew(papa, 'パパ');
  papa.world.saveNow();
  await papa.cloud.flush(true);
  const yui = await device(db, { uid: 'u_yui' });
  assert.equal(Object.keys(yui.world.data.characters).length, 0);
  assert.ok([...db.store.keys()].every((k) => k.startsWith('data/users/u_papa/')));
});

test('クラウドセーブ: あとで セーブした ほうを つかう（どちらの 向きでも）', async () => {
  const db = mockDb();
  const a = await device(db);
  const bot = await playNew(a, 'ソラ');
  const id = bot.char.id;
  a.world.saveNow();
  await a.cloud.flush(true);
  const oldLocal = a.backend.map.get('kizuna_offline_save_v1');

  // べつの スマホで 進めた（クラウドが 新しい）
  const b = await device(db);
  b.world.data.characters[id].gold = 9999;
  b.world.markDirty();
  b.world.saveNow();
  await b.cloud.flush(true);

  // 前の ブラウザ（古い セーブが のこっている）で 開くと クラウドの ほうに なる
  const a2 = await device(db, { backend: memoryBackend({ kizuna_offline_save_v1: oldLocal }) });
  assert.equal(a2.world.data.characters[id].gold, 9999);

  // このブラウザの ほうが 新しい → クラウドに 書く
  const newer = JSON.parse(oldLocal);
  newer.characters[id].gold = 7777;
  newer.characters[id].savedAt = Date.now() + 60000;
  const a3 = await device(db, { backend: memoryBackend({ kizuna_offline_save_v1: JSON.stringify(newer) }) });
  assert.equal(a3.world.data.characters[id].gold, 7777);
  await a3.cloud.flush(true);
  assert.equal(db.store.get(`data/users/u_papa/c-${id}`).char.gold, 7777);
});

test('クラウドセーブ: 消した キャラは、ほかの ブラウザの 古い セーブからも もどってこない', async () => {
  const db = mockDb();
  const a = await device(db);
  const bot = await playNew(a, 'ソラ');
  const id = bot.char.id;
  bot.send({ t: 'quit' });
  await bot.settle();
  a.world.saveNow();
  await a.cloud.flush(true);
  const stale = a.backend.map.get('kizuna_offline_save_v1');
  // 消す
  a.world.handle(bot.s, { t: 'deleteChar', id, confirm: 'ソラ' });
  await a.cloud.flush(true);
  assert.ok(!db.store.has(`data/users/u_papa/c-${id}`));
  assert.ok(db.store.get('data/users/u_papa/meta').deleted[id]);
  // 古い セーブの のこった ブラウザで 開いても、もどってこない
  const b = await device(db, { backend: memoryBackend({ kizuna_offline_save_v1: stale }) });
  assert.equal(b.world.data.characters[id], undefined);
  const c = await device(db);
  assert.equal(c.world.data.characters[id], undefined);
});

test('クラウドセーブ: 書く 回数を へらす（かわった ときだけ・間を あける・閉じる ときは すぐ）', async () => {
  const db = mockDb();
  const a = await device(db);
  const bot = await playNew(a, 'ソラ');
  const id = bot.char.id;
  a.world.saveNow();
  await a.cloud.flush(true);
  const w0 = db.writes;
  // なにも かわっていなければ 書かない
  a.world.markDirty();
  a.world.saveNow();
  assert.equal(a.cloud.pendingCount(), 0);
  // いちだけ → ゆっくり、ゴールド → 10びょう あけて
  const c = a.world.data.characters[id];
  const s = [...a.world.sessions.values()].find((x) => x.charId === id);
  const t0 = Date.now();
  s.x += 1; // 歩いた（セーブの とき いちが 書かれる）
  a.world.markDirty();
  a.world.saveNow();
  assert.ok(a.cloud.dirty.get(`c-${id}`) >= t0 + MOVE_GAP - 1000, 'いちだけなら 1分 あける');
  c.gold += 10;
  a.world.markDirty();
  a.world.saveNow();
  const due = a.cloud.dirty.get(`c-${id}`);
  assert.ok(due >= t0 + WRITE_GAP - 1000 && due < t0 + MOVE_GAP - 1000, 'かわったら 10びょう あけて');
  assert.equal(db.writes, w0, 'まだ 書かない');
  // ページを 閉じる とき（flush）は すぐ 書く
  await a.cloud.flush(true);
  assert.equal(db.writes, w0 + 1);
  assert.equal(db.store.get(`data/users/u_papa/c-${id}`).char.gold, c.gold);
});

test('クラウドセーブ: 宿屋・教会・「終わる」は 間を あけずに すぐ 書く', async () => {
  const db = mockDb();
  const a = await device(db);
  const bot = await playNew(a, 'ソラ');
  const id = bot.char.id;
  a.world.saveNow();
  await a.cloud.flush(true);
  const c = a.world.data.characters[id];
  c.gold += 5;
  a.world.markDirty();
  a.world.saveNow({ urgent: true });
  assert.ok(a.cloud.dirty.get(`c-${id}`) <= Date.now() + 1000, 'すぐ');
  await a.cloud.flush(true);
  // 教会で 記録
  const w0 = db.writes;
  a.world.handle(bot.s, { t: 'svc', kind: 'church', action: 'record' });
  const due = a.cloud.dirty.get(`c-${id}`);
  assert.ok(due !== undefined && due <= Date.now() + 1000, `教会の 記録で すぐ（${due && due - Date.now()}ms）`);
  // 終わる
  await a.cloud.flush(true);
  bot.send({ t: 'quit' });
  const due2 = a.cloud.dirty.get(`c-${id}`);
  assert.ok(due2 !== undefined && due2 <= Date.now() + 1000, '終わるで すぐ');
  await new Promise((r) => setTimeout(r, 600));
  assert.ok(db.writes > w0, 'タイマーで 書いた');
});

test('クラウドセーブ: 書けない ときも、このブラウザには セーブして 遊べる', async () => {
  // 見るだけの 共有（自分の 場所に 書けない）
  const ro = mockDb(new Map(), { failSet: () => ({ code: 'invalid_argument', message: 'no' }) });
  const a = await device(ro);
  const bot = await playNew(a, 'ソラ');
  a.world.saveNow();
  await a.cloud.flush(true);
  assert.equal(a.status.state, 'readonly');
  assert.ok(JSON.parse(a.backend.map.get('kizuna_offline_save_v1')).characters[bot.char.id]);
  const before = ro.writes;
  a.world.data.characters[bot.char.id].gold += 1;
  a.world.markDirty();
  a.world.saveNow();
  await a.cloud.flush(true);
  assert.equal(ro.writes, before, 'もう 書こうと しない');

  // 一時的に つながらない → あとで もう いちど
  let down = true;
  const flaky = mockDb(new Map(), { failSet: () => (down ? { code: 'unavailable', message: 'x' } : null) });
  const b = await device(flaky);
  const bot2 = await playNew(b, 'ユイ');
  b.world.saveNow();
  for (let i = 0; i < 3; i++) await b.cloud.flush(true);
  assert.equal(b.status.state, 'error');
  assert.ok(b.cloud.pendingCount() > 0, 'あとで もう いちど 書く');
  down = false;
  await b.cloud.flush(true);
  assert.equal(b.status.state, 'on');
  assert.ok(flaky.store.has(`data/users/u_papa/c-${bot2.char.id}`));
});

test('クラウドセーブ: claude.ai の 外や、ことわられた ときは このブラウザだけ', async () => {
  assert.equal(await openCloud(undefined), null);
  assert.equal(await openCloud({ use: async () => null }), null);
  assert.equal(await openCloud(mockClaude(mockDb(), { perm: 'denied' })), null);
  const db = mockDb();
  const a = await device(db, { claude: null });
  assert.equal(a.status.state, 'off');
  const bot = await playNew(a, 'ソラ');
  a.world.saveNow();
  assert.ok(JSON.parse(a.backend.map.get('kizuna_offline_save_v1')).characters[bot.char.id]);
  assert.equal(db.store.size, 0);
  // 「つかって いい？」の 確認が 出る ときは まつ
  let asked = false;
  const cloud = await openCloud({
    use: async (n) => (n === 'db' ? db : n === 'user' ? { id: async () => 'u_x' } : { state: async () => ({ db: 'prompt', user: 'prompt' }), request: async () => ({ db: 'granted', user: 'granted' }) }),
  }, { onWait: () => { asked = true; } });
  assert.ok(asked);
  assert.ok(cloud instanceof CloudSave);
});
