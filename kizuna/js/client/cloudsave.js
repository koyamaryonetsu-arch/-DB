// クラウドセーブ（claude.ai の アーティファクトで ひとりで 遊ぶ とき）
//
// iPhone の Safari や Claude アプリでは、アーティファクトの 中の ブラウザの ほぞん（localStorage）が
// ブラウザを とじると 消えることが ある。そこで claude.ai の、1人ずつの ひみつの 場所
// （db の data/users/<id>/。持ち主にも 見えない）にも セーブする。
//   data/users/<id>/meta    … { v, createdAt, board, deleted: { キャラID: 消した 時こく }, updatedAt }
//   data/users/<id>/c-<ID>  … { v, savedAt, char }  キャラ 1人 = 1つの 文書（1つ 256KB まで）
// このブラウザと クラウドの 両方に いる キャラは、あとで セーブした ほうを つかう。
import { SAVE_VERSION, upgradeSave } from '../shared/world/save.js?v=cb6fd0fb30e1';

const OPEN_TIMEOUT = 9000;
const LOAD_TIMEOUT = 15000;
export const WRITE_GAP = 10000; // 1つの 文書に 書く あいだ（ms）
export const MOVE_GAP = 60000; // いちが かわった だけの ときは ゆっくり
const DEBOUNCE = 1500;
const URGENT_DEBOUNCE = 300;
const DOC_PREFIX = 'c-';
const TOMBSTONES_MAX = 200;

// キャラの「さいごに セーブした 時こく」
export const charTime = (c) => Math.max(Number(c?.savedAt) || 0, Number(c?.lastPlayed) || 0);

const clone = (v) => JSON.parse(JSON.stringify(v));

function withTimeout(p, ms) {
  let t;
  const late = new Promise((_, rej) => {
    t = setTimeout(() => rej({ code: 'timeout' }), ms);
  });
  return Promise.race([p, late]).finally(() => clearTimeout(t));
}

// claude.ai の 中なら db と user を つかう。つかえない ときは null（このブラウザだけに セーブ）
//  onWait … 「クラウドセーブを つかって いい？」の 確認を まっている あいだ
export async function openCloud(claude = globalThis.window?.claude, { onWait } = {}) {
  if (!claude || typeof claude.use !== 'function') return null;
  try {
    const [db, user, perms] = await withTimeout(Promise.all([claude.use('db'), claude.use('user'), claude.use('permissions')]), OPEN_TIMEOUT);
    if (!db || !user) return null;
    if (perms) {
      const st = await perms.state();
      // つかえない・ことわられた（ない 名前は つかえない あつかい）
      if (!st.db || st.db === 'denied' || st.db === 'unavailable') return null;
      const ask = ['db', 'user'].filter((n) => st[n] === 'prompt');
      if (ask.length) {
        onWait?.();
        const got = await perms.request(ask);
        if (got.db !== 'granted') return null;
      }
    }
    const uid = await withTimeout(user.id(), OPEN_TIMEOUT);
    if (!uid) return null;
    return new CloudSave(db, uid);
  } catch {
    return null;
  }
}

export class CloudSave {
  constructor(db, uid, { now = () => Date.now(), timers = globalThis } = {}) {
    this.db = db;
    this.uid = uid;
    this.now = now;
    this.timers = timers;
    this.col = db.collection(`data/users/${uid}`);
    this.cloudTimes = new Map(); // キャラID → クラウドに ある ぶんの 時こく
    this.dirty = new Map(); // 文書ID → 書く 予定の 時こく
    this.lastWrite = new Map(); // 文書ID → さいごに 書いた 時こく
    this.remove = new Set(); // 消す 文書ID
    this.deleted = {}; // キャラID → 消した 時こく
    this.remoteMeta = ''; // クラウドに ある meta（かわっていなければ 書かない）
    // on … セーブできる / error … しっぱいが つづいている / readonly … 見るだけの 共有などで 書けない / off … つかえない
    this.state = 'on';
    this.failures = 0;
    this.listeners = new Set();
    this.source = null; // () => いまの セーブ（world.data）
    this.timer = null;
    this.writing = null;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setState(s) {
    if (this.state === s) return;
    this.state = s;
    if (this.stopped) {
      this.dirty.clear();
      if (this.timer) {
        this.timers.clearTimeout(this.timer);
        this.timer = null;
      }
    }
    for (const fn of this.listeners) {
      try {
        fn(s);
      } catch { /* */ }
    }
  }

  // クラウドの セーブを 読む → { characters, board, createdAt, deleted }
  async load() {
    const snap = await withTimeout(this.col.get(), LOAD_TIMEOUT);
    const out = { characters: {}, board: [], createdAt: 0, deleted: {} };
    for (const d of snap.docs) {
      if (!d.exists) continue;
      const body = clone(d.data() || {});
      if (d.id === 'meta') {
        out.board = Array.isArray(body.board) ? body.board : [];
        out.createdAt = Number(body.createdAt) || 0;
        out.deleted = body.deleted && typeof body.deleted === 'object' ? body.deleted : {};
      } else if (d.id.startsWith(DOC_PREFIX) && body.char && typeof body.char === 'object' && typeof body.char.id === 'string') {
        const up = upgradeSave({ version: Number(body.v) || SAVE_VERSION, characters: { [body.char.id]: body.char } }).data.characters[body.char.id];
        if (!up) continue;
        up.savedAt = Math.max(Number(body.savedAt) || 0, Number(up.savedAt) || 0);
        out.characters[up.id] = up;
        this.cloudTimes.set(up.id, charTime(up));
      }
    }
    this.deleted = { ...out.deleted };
    this.remoteMeta = metaSig(out);
    return out;
  }

  get stopped() {
    return this.state === 'off' || this.state === 'readonly';
  }

  // 読みこんだ あとで: このブラウザの ほうが 新しい キャラ・クラウドに ない キャラを 書く
  prime(data) {
    for (const [id, t] of Object.entries(data.deleted || {})) this.deleted[id] = Math.max(t, this.deleted[id] || 0);
    for (const c of Object.values(data.characters || {})) {
      const t = this.cloudTimes.get(c.id);
      if (t === undefined || charTime(c) > t) this.mark(DOC_PREFIX + c.id, 0);
    }
    for (const id of this.cloudTimes.keys()) if (!data.characters?.[id]) this.markRemove(id);
    if (metaSig({ ...data, deleted: this.deleted }) !== this.remoteMeta) this.mark('meta', 0);
  }

  // セーブ（このブラウザ）の たびに よばれる
  //  urgent … 宿屋・教会・終わる など。間を あけずに すぐ 書く
  noteChanges({ changes = [], gone = [], boardChanged = false, urgent = false } = {}) {
    if (this.stopped) return;
    for (const ch of changes) {
      if (urgent) this.mark(DOC_PREFIX + ch.id, 0, URGENT_DEBOUNCE);
      else this.mark(DOC_PREFIX + ch.id, ch.posOnly ? MOVE_GAP : WRITE_GAP);
    }
    for (const id of gone) {
      this.deleted[id] = this.now();
      this.markRemove(id);
    }
    if (gone.length || boardChanged) this.mark('meta', urgent ? 0 : WRITE_GAP);
  }

  markRemove(id) {
    this.remove.add(DOC_PREFIX + id);
    this.mark(DOC_PREFIX + id, 0);
    this.mark('meta', 0);
  }

  mark(docId, gap, debounce = DEBOUNCE) {
    const now = this.now();
    const due = Math.max(now + debounce, (this.lastWrite.get(docId) || 0) + gap);
    const cur = this.dirty.get(docId);
    this.dirty.set(docId, cur === undefined ? due : Math.min(cur, due));
    this.arm();
  }

  arm() {
    if (this.stopped) {
      // もう 書かない（のこりも すてる。タイマーを 回しつづけない）
      this.dirty.clear();
      return;
    }
    if (this.writing || !this.dirty.size || !this.source) return;
    const next = Math.min(...this.dirty.values());
    if (this.timer) this.timers.clearTimeout(this.timer);
    this.timer = this.timers.setTimeout(() => {
      this.timer = null;
      this.flush(false);
    }, Math.max(0, next - this.now()));
  }

  pendingCount() {
    return this.dirty.size;
  }

  // all = true … ページを とじる とき など、待たずに 全部 書く
  async flush(all = true) {
    if (this.writing) {
      await this.writing;
      if (!all || !this.dirty.size) return;
    }
    if (this.timer) {
      this.timers.clearTimeout(this.timer);
      this.timer = null;
    }
    this.writing = this.writeDue(all);
    try {
      await this.writing;
    } finally {
      this.writing = null;
      this.arm();
    }
  }

  async writeDue(all) {
    const data = this.source?.();
    if (!data || this.stopped) return;
    const now = this.now();
    const ids = [...this.dirty].filter(([, due]) => all || due <= now).map(([id]) => id);
    // キャラを 先に、meta を あとに
    ids.sort((a, b) => (a === 'meta') - (b === 'meta'));
    for (const id of ids) {
      if (this.stopped) return;
      this.dirty.delete(id);
      try {
        await this.writeDoc(id, data);
        this.lastWrite.set(id, this.now());
        this.failures = 0;
        if (this.state !== 'readonly') this.setState('on');
      } catch (e) {
        this.onWriteError(id, e);
      }
    }
  }

  async writeDoc(id, data) {
    const ref = this.col.doc(id);
    if (id === 'meta') {
      const deleted = Object.entries(this.deleted).sort((a, b) => b[1] - a[1]).slice(0, TOMBSTONES_MAX);
      this.deleted = Object.fromEntries(deleted);
      const body = { v: SAVE_VERSION, createdAt: data.createdAt || this.now(), board: (data.board || []).slice(0, 40), deleted: this.deleted, updatedAt: this.now() };
      await withTimeout(ref.set(clone(body)), LOAD_TIMEOUT);
      this.remoteMeta = metaSig(body);
      return;
    }
    const charId = id.slice(DOC_PREFIX.length);
    const c = data.characters?.[charId];
    if (!c) {
      if (this.remove.has(id)) {
        await withTimeout(ref.delete(), LOAD_TIMEOUT);
        this.remove.delete(id);
        this.cloudTimes.delete(charId);
      }
      return;
    }
    this.remove.delete(id);
    await withTimeout(ref.set(clone({ v: SAVE_VERSION, savedAt: charTime(c), char: c })), LOAD_TIMEOUT);
    this.cloudTimes.set(charId, charTime(c));
  }

  onWriteError(id, e) {
    const code = e?.code || 'unavailable';
    if (['not_granted', 'revoked', 'capability_disabled', 'capability_removed'].includes(code)) {
      this.setState('off');
      return;
    }
    if (code === 'invalid_argument' || code === 'transform_error') {
      // 自分の 場所に 書けない（見るだけの 人）・大きすぎる など。もう 書かない
      this.setState('readonly');
      return;
    }
    // quota_exceeded・resource_exhausted・unavailable・timeout … しばらく まって もう いちど
    this.failures++;
    if (this.failures >= 3) this.setState('error');
    const wait = code === 'resource_exhausted' ? 30000 : 5000 * Math.min(this.failures, 6);
    const due = this.now() + wait;
    const cur = this.dirty.get(id);
    this.dirty.set(id, cur === undefined ? due : Math.max(cur, due));
  }
}

function metaSig(m) {
  return JSON.stringify([m.createdAt || 0, (m.board || []).slice(0, 40), Object.entries(m.deleted || {}).sort()]);
}

// クラウドの セーブを いまの せかいに まぜる（遊んでいる キャラは そのまま）
//  もどりち: かわったか
export function adoptCloud(world, remote) {
  const data = world.data;
  const online = (id) => [...world.sessions.values()].some((x) => x.inWorld && x.charId === id);
  const localDeleted = data.deleted || {};
  let changed = false;
  // 別の 場所で 消した キャラ
  for (const [id, t] of Object.entries(remote.deleted || {})) {
    const mine = data.characters[id];
    if (mine && !online(id) && charTime(mine) <= t) {
      delete data.characters[id];
      changed = true;
    }
  }
  for (const c of Object.values(remote.characters || {})) {
    if ((localDeleted[c.id] || 0) >= charTime(c)) continue; // このブラウザで 消した あとの もの
    const mine = data.characters[c.id];
    if (!mine || (!online(c.id) && charTime(c) > charTime(mine))) {
      data.characters[c.id] = c;
      changed = true;
    }
  }
  data.deleted = { ...localDeleted };
  for (const [id, t] of Object.entries(remote.deleted || {})) data.deleted[id] = Math.max(Number(t) || 0, localDeleted[id] || 0);
  const board = new Map((data.board || []).map((b) => [`${b.from}|${b.time}|${b.text}`, b]));
  const before = board.size;
  for (const b of remote.board || []) board.set(`${b.from}|${b.time}|${b.text}`, b);
  if (board.size !== before) {
    data.board = [...board.values()].sort((a, b) => (b.time || 0) - (a.time || 0)).slice(0, 40);
    changed = true;
  }
  if (remote.createdAt && (!data.createdAt || remote.createdAt < data.createdAt)) data.createdAt = remote.createdAt;
  return changed;
}
