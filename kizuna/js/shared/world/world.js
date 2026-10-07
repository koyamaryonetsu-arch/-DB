// ゲームの せかい（家族サーバー / ひとりモード 共通）
//
// クライアントとは メッセージ（JSON）で やりとりする。
// つなぎかたは なんでも よい（WebSocket でも ブラウザ内の ちょくせつ呼び出しでも）。
import { makeRng } from '../rng.js?v=140b3d4eb1e5';
import { MAPS, isBlocked, effectiveTile, condOk, searchLoot, sparkleLoot, tileAt, POS, SEA_PLACES, standSpot } from '../maps/index.js?v=140b3d4eb1e5';
import { PLACES } from '../maps/overworld.js?v=140b3d4eb1e5';
import { T, TILE_INFO } from '../tiles.js?v=140b3d4eb1e5';
import { ITEMS } from '../data/items.js?v=140b3d4eb1e5';
import { JOBS } from '../data/jobs.js?v=140b3d4eb1e5';
import { newCharacter, computeStats, addItem, fullHeal, migrateJobs, fixBodyJob } from '../stats.js?v=140b3d4eb1e5';
import { mapState, spawnSymbols, moveSymbols, symbolSnapshot, symbolVisible } from './monsters.js?v=140b3d4eb1e5';
import { tickFieldChests, fieldChestSnap, fieldChestNear, openFieldChest } from './fieldchests.js?v=140b3d4eb1e5';
import { chestVanishes } from '../data/fieldchests.js?v=140b3d4eb1e5';
import { startFieldBattle, battleTick, abortBattle, battleCommand, battleLeave, joinBattle, mineOf, resultDone } from './battles.js?v=140b3d4eb1e5';
import { runScript, runSteps } from './scripts.js?v=140b3d4eb1e5';
import { serviceAction, menuAction } from './services.js?v=140b3d4eb1e5';
import { newParty, partyOf, partyState, syncParty, ensureCompanions, companionWait, PARTY_MAX, befriendLevel, rosterFull, nameOfKey, dropMissingFam } from './party.js?v=140b3d4eb1e5';
import { hasWagon, dropGoneFamily } from '../data/wagon.js?v=140b3d4eb1e5';
import { MONSTERS } from '../data/monsters.js?v=140b3d4eb1e5';
import { CH1_CLEAR_OBJECTIVE } from '../data/story.js?v=140b3d4eb1e5';
import { upgradeSave, repairChar } from './save.js?v=140b3d4eb1e5';
import { exportCode, parseCode, importChar } from './transfer.js?v=140b3d4eb1e5';
import { memorySyncStore, buildSyncOut, applySyncIn, encodeSync, decodeSync, syncSummary } from './sync.js?v=140b3d4eb1e5';
import { tryTreasureDig, treasureMenu, fixTreasurePos, normalizeTreasure, pruneTreasureStates } from './treasure.js?v=140b3d4eb1e5';
import { isNightFor, timeFlag, fracFor } from './clock.js?v=140b3d4eb1e5';
import { onFly, setFlying, moveAllowed, ridingAlong, canFlyMap } from './travel.js?v=140b3d4eb1e5';
import { migrateSky } from '../data/sky.js?v=140b3d4eb1e5';
import { migrateCh4 } from '../data/story-ch4.js?v=140b3d4eb1e5';
import { repairObjective } from '../data/progress.js?v=140b3d4eb1e5';
import { wagonLook } from './wagon.js?v=140b3d4eb1e5';
import { medalSearchSteps, medalChestSteps } from './casino.js?v=140b3d4eb1e5';
import { stepHazard } from './hazards.js?v=140b3d4eb1e5';
import { noteDungeonEntry } from './escape.js?v=140b3d4eb1e5';
import { notePyramidMove } from './pyramid.js?v=140b3d4eb1e5';

export const PROTOCOL_VERSION = 1;
const SPARKLE_RESPAWN_MS = 20 * 60 * 1000;
// まいフレーム エラーが この 回数 つづいた たたかいは おわらせる（tick は 1びょうに 20回くらい）
const BATTLE_ERROR_LIMIT = 20;
const START_POS = POS.heroHome;

let sessSeq = 1;

export class GameWorld {
  constructor(opts = {}) {
    this.storage = opts.storage;
    this.rng = opts.rng || makeRng();
    this.offline = !!opts.offline;
    this.checkPassword = opts.checkPassword || (() => true);
    this.familyName = opts.familyName || 'わが家';
    this.now = opts.now || (() => Date.now());
    // 家族サーバーと スマホで キャラを 合わせる ときに おぼえておく 版（sync.js）
    this.syncStore = opts.syncStore || memorySyncStore();
    // むかしの セーブも 読める 形に（save.js）
    const up = upgradeSave(opts.data || this.storage?.load?.() || {});
    this.data = up.data;
    this.saveUpgradedFrom = up.from;
    this.sessions = new Map();
    this.parties = new Map();
    this.battles = new Map();
    this.runs = new Map();
    this.byConn = new Map(); // つなぎ → セッション（つなぎなおしで いれかわる）
    this.mapStates = new Map();
    this.dirty = false;
    this.saveTimer = 0;
    this.snapTimer = 0;
    this.log = opts.log || (() => {});
    this.rateLimit = opts.rateLimit !== false;
    // つうしんが きれても この じかんは パーティー・たたかいに のこしておく（スマホの スリープ たいさく）
    this.awayMs = opts.awayMs ?? 3 * 60 * 1000;
  }

  // ───────────── つなぐ ─────────────
  connect(conn) {
    const s = {
      id: 's' + (sessSeq++) + Math.random().toString(36).slice(2, 6),
      conn, authed: this.offline, charId: null, char: null, inWorld: false,
      map: null, x: 0, y: 0, dir: 'down', moving: false, busy: null, battleId: null, runId: null,
      partyId: null, invuln: 0, repelUntil: 0, lastMove: 0, follow: false, posSeq: 0, msgCount: 0, msgWindow: 0,
      level: 1,
    };
    this.sessions.set(s.id, s);
    if (conn && typeof conn === 'object') this.byConn.set(conn, s);
    return s;
  }

  sessionOf(s, conn) {
    return (conn && this.byConn.get(conn)) || s;
  }

  // conn: きれた つなぎ（べつの つなぎに ひきつがれた あとなら なにも しない）
  disconnect(s0, conn) {
    const s = this.sessionOf(s0, conn);
    if (conn) this.byConn.delete(conn);
    if (!this.sessions.has(s.id)) return;
    if (conn && s.conn !== conn) return;
    if (s.inWorld && !this.offline && this.awayMs > 0) {
      this.goAway(s);
      return;
    }
    this.leaveWorld(s);
    this.sessions.delete(s.id);
  }

  // つうしんが とぎれた: しばらくは そのまま（たたかいは オート）。もどってきたら つづきから
  goAway(s) {
    s.away = true;
    s.awayAt = this.now();
    s.conn = null;
    s.moving = false;
    s.invitedBy = null;
    battleLeave(this, s);
    const p = partyOf(this, s);
    if (p && p.members.length > 1) {
      this.broadcastToParty(p, { t: 'toast', text: `${s.char.name}の通信がとぎれた…\nもどってくるまでオートで戦うよ` });
      this.sendParty(p);
    }
    this.broadcastPlayers();
    this.markDirty();
    this.saveNow();
  }

  // 立てなおし: のこった「とちゅう」の しるし（もう ない だいほん・たたかい）を かたづけて、
  // いまの ようす（いち・パーティー・たたかい・まっている だいほん）を つなぎなおしと おなじように おくりなおす
  resync(s) {
    if (!s.inWorld || !s.char) return;
    const now = this.now();
    if (s.lastResync && now - s.lastResync < 1500) return;
    s.lastResync = now;
    if (s.busy === 'script' && !(s.runId && this.runs.get(s.runId))) {
      s.busy = null;
      s.runId = null;
    }
    if (s.busy === 'battle' && !(s.battleId && this.battles.get(s.battleId))) {
      s.busy = null;
      s.battleId = null;
    }
    s.posSeq++;
    const p = partyOf(this, s);
    this.send(s, {
      t: 'enter', sid: s.id, char: s.char, map: s.map, x: s.x, y: s.y, dir: s.dir, posSeq: s.posSeq,
      party: p ? partyState(this, p) : null, board: this.data.board || [], supportLog: [], serverTime: this.now(),
      players: this.playerList(s), resumed: true, rescued: true, fly: !!s.flying,
    });
    const ctx = s.battleId && this.battles.get(s.battleId);
    if (ctx && !ctx.battle.over) {
      this.send(s, { t: 'battleStart', snap: ctx.battle.snapshot(), mine: mineOf(ctx, s.id), boss: !!ctx.opts.boss, story: !!ctx.opts.fixed, resume: true });
    }
    const run = s.runId && this.runs.get(s.runId);
    if (run) run.resend(s);
  }

  // クライアントの エラー: セーブの errorLog に さいきんの 30こ（家族サーバーの 画面にも 出す）
  onClientError(s, msg) {
    const log = Array.isArray(this.data.errorLog) ? this.data.errorLog : (this.data.errorLog = []);
    const str = (v, n) => String(v ?? '').slice(0, n);
    log.push({
      at: this.now(), who: str(s.char?.name, 20), map: str(s.map, 30), state: str(msg.state, 20),
      where: str(msg.where, 40), msg: str(msg.msg, 300), stack: str(msg.stack, 900),
    });
    if (log.length > 30) log.splice(0, log.length - 30);
    if (!this.offline) console.warn('[クライアントのエラー]', s.char?.name || '?', msg.where, msg.msg);
    this.markDirty();
  }

  // おなじ キャラクターで つなぎなおした: まえの セッションを そのまま ひきつぐ
  resumeSession(s, t) {
    const oldConn = t.conn;
    if (oldConn && oldConn !== s.conn) {
      // まえの たんまつ（まだ つながっている）は キャラを えらびなおせるように あたらしい セッションへ
      this.send(t, { t: 'kicked', text: '他のたんまつで同じキャラクターがログインしました' });
      const fresh = this.connect(oldConn);
      fresh.authed = true;
    }
    if (s.inWorld) this.leaveWorld(s);
    t.conn = s.conn;
    if (s.conn && typeof s.conn === 'object') this.byConn.set(s.conn, t);
    t.authed = true;
    t.away = false;
    t.awayAt = 0;
    t.posSeq++;
    this.sessions.delete(s.id);
    const ctx = t.battleId && this.battles.get(t.battleId);
    if (ctx) {
      for (const a of ctx.battle.allies) if (a.controller === t.id) ctx.battle.setAuto(a.id, !!t.char.battleSettings?.auto);
    }
    const p = partyOf(this, t);
    this.send(t, {
      t: 'enter', sid: t.id, char: t.char, map: t.map, x: t.x, y: t.y, dir: t.dir, posSeq: t.posSeq,
      party: p ? partyState(this, p) : null, board: this.data.board || [], supportLog: [], serverTime: this.now(),
      players: this.playerList(t), resumed: true, fly: !!t.flying,
    });
    if (ctx && !ctx.battle.over) {
      // 馬車に もどった 人は のぞく（その 人が うごかす キャラ）
      const mine = mineOf(ctx, t.id);
      this.send(t, { t: 'battleStart', snap: ctx.battle.snapshot(), mine, boss: !!ctx.opts.boss, story: !!ctx.opts.fixed, resume: true });
    }
    const run = t.runId && this.runs.get(t.runId);
    if (run) run.resend(t);
    if (p && p.members.length > 1) {
      for (const sid of p.members) if (sid !== t.id) this.send(this.sessions.get(sid), { t: 'toast', text: `${t.char.name}がもどってきた！` });
      this.sendParty(p);
    }
    this.broadcastPlayers();
  }

  leaveWorld(s) {
    if (!s.inWorld) return;
    battleLeave(this, s);
    for (const run of this.runs.values()) {
      if (run.init.id === s.id) run.abort();
    }
    if (s.char) {
      if (!s.busy || s.busy === 'battle') s.char.pos = { map: s.map, x: s.x, y: s.y, dir: s.dir };
      s.char.lastPlayed = this.now();
    }
    s.inWorld = false;
    s.busy = null;
    this.leaveParty(s, true);
    this.broadcast({ t: 'left', sid: s.id, name: s.char?.name }, s);
    this.broadcastPlayers();
    this.markDirty();
    this.saveNow({ urgent: true });
  }

  send(s, msg) {
    if (!s || !s.conn) return;
    try {
      s.conn.send(msg);
    } catch (e) {
      // きれた
    }
  }

  broadcast(msg, except) {
    for (const s of this.sessions.values()) if (s !== except && s.authed) this.send(s, msg);
  }

  // ───────────── メッセージ ─────────────
  handle(s0, msg, conn) {
    if (!msg || typeof msg.t !== 'string') return;
    const s = this.sessionOf(s0, conn);
    if (conn && s.conn !== conn) return; // ひきつがれた まえの つなぎからは うけつけない
    // あまりに おおい メッセージは むし
    const now = this.now();
    if (now - s.msgWindow > 1000) {
      s.msgWindow = now;
      s.msgCount = 0;
    }
    if (++s.msgCount > 120 && this.rateLimit) return;
    if (!s.authed) {
      if (msg.t === 'hello') return this.onHello(s, msg);
      return;
    }
    switch (msg.t) {
      case 'hello': return this.onHello(s, msg);
      case 'createChar': return this.onCreateChar(s, msg);
      case 'deleteChar': return this.onDeleteChar(s, msg);
      case 'exportChar': return this.onExportChar(s, msg);
      case 'importChar': return this.onImportChar(s, msg);
      case 'syncOut': return this.onSyncOut(s, msg);
      case 'syncIn': return this.onSyncIn(s, msg);
      case 'play': return this.onPlay(s, msg);
      case 'quit': this.leaveWorld(s); return this.send(s, { t: 'chars', chars: this.charList() });
      case 'ping': return this.send(s, { t: 'pong', at: msg.at });
    }
    if (!s.inWorld) return;
    switch (msg.t) {
      case 'move': return this.onMove(s, msg);
      case 'touch': return this.onTouch(s, msg);
      case 'interact': return this.onInteract(s, msg);
      case 'ack': return this.runs.get(msg.runId)?.ack(s, msg);
      case 'svc': return serviceAction(this, s, msg);
      case 'menu': return this.onMenu(s, msg);
      case 'battle': return battleCommand(this, s, msg);
      // たたかいの けっかを 読みおわった（battles.js）
      case 'resultDone': return resultDone(this, s);
      case 'party': return this.onParty(s, msg);
      case 'chat': return this.onChat(s, msg);
      case 'explored': return this.onExplored(s, msg);
      case 'warpTo': return this.onMenu(s, { t: 'menu', action: 'useItem', id: 'return_wing', place: msg.place });
      case 'fly': return onFly(this, s, msg); // 風の大鳥（travel.js）
      // 動けなく なった 人の 立てなおし（client の rescue）
      case 'resync': return this.resync(s);
      // クライアントで おきた エラー（ふぐあいの きろく）
      case 'clientError': return this.onClientError(s, msg);
      case 'joinBattle': {
        const r = joinBattle(this, s, msg.sid);
        if (!r.ok && r.reason) this.send(s, { t: 'toast', text: r.reason });
        return;
      }
    }
  }

  onHello(s, msg) {
    if (!this.offline && !this.checkPassword(String(msg.pw || ''))) {
      this.send(s, { t: 'helloFail', reason: '合言葉がちがいます' });
      return;
    }
    s.authed = true;
    this.send(s, {
      t: 'welcome', v: PROTOCOL_VERSION, offline: this.offline, family: this.familyName,
      chars: this.charList(), board: this.data.board || [], serverTime: this.now(),
    });
  }

  // 「だれで遊ぶ？」の 一覧。いつ 遊んだか・今 遊んでいるかは 入れない（その 画面には 出さない）
  charList() {
    return Object.values(this.data.characters)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map((c) => ({ id: c.id, name: c.name, job: c.job, level: c.level, look: c.look, equip: c.equip, objective: c.objective }));
  }

  onCreateChar(s, msg) {
    const name = String(msg.name || '').replace(/[<>&"'\s]/g, '').slice(0, 8);
    if (!name) return this.send(s, { t: 'error', text: '名前を入れてね' });
    if (Object.keys(this.data.characters).length >= 12) return this.send(s, { t: 'error', text: 'キャラクターは12人までです' });
    if (Object.values(this.data.characters).some((c) => c.name === name)) return this.send(s, { t: 'error', text: '同じ名前のキャラクターがいます' });
    const id = 'c' + this.now().toString(36) + Math.floor(this.rng.next() * 1e6).toString(36);
    const c = newCharacter({ id, name, look: msg.look, job: msg.job });
    c.pos = { map: 'overworld', x: START_POS[0] + 0.5, y: START_POS[1] + 0.5, dir: 'down' };
    c.spawn = { map: 'overworld', x: POS.villageChurch[0] + 0.5, y: POS.villageChurch[1] + 0.5 };
    this.data.characters[id] = c;
    this.markDirty();
    this.saveNow({ urgent: true });
    this.send(s, { t: 'charCreated', id });
    this.broadcast({ t: 'chars', chars: this.charList() });
  }

  // 引っこしコード（transfer.js）
  onExportChar(s, msg) {
    const c = this.data.characters[msg.id];
    if (!c) return this.send(s, { t: 'exportCode', ok: false, text: '見つかりません' });
    // 遊んでいる とちゅうなら 今の いちも 入れる
    for (const x of this.sessions.values()) {
      if (x.inWorld && x.charId === c.id && !x.busy) c.pos = { map: x.map, x: x.x, y: x.y, dir: x.dir };
    }
    this.send(s, { t: 'exportCode', ok: true, id: c.id, name: c.name, code: exportCode(c, this.now()) });
  }

  onImportChar(s, msg) {
    const r = parseCode(msg.code);
    if (!r.ok) return this.send(s, { t: 'importResult', ok: false, text: r.reason });
    const before = JSON.stringify(this.data);
    const res = importChar(this.data, r.char, { online: (id) => [...this.sessions.values()].some((x) => x.inWorld && x.charId === id) });
    if (!res.ok) return this.send(s, { t: 'importResult', ok: false, text: res.reason });
    const text = {
      new: `${res.name}がやってきた！\n「だれで遊ぶ？」から選んでね。`,
      updated: `${res.name}を、引っこしコードの新しいデータにしました。`,
      kept: `${res.name}は、こちらのデータが同じか新しいので、そのままにしました。`,
    }[res.mode];
    if (res.mode !== 'kept') {
      // 入れかえる まえの セーブを とっておく
      if (res.mode === 'updated') this.storage?.backup?.('before-import', before);
      this.markDirty();
      this.saveNow({ urgent: true });
      this.broadcast({ t: 'chars', chars: this.charList() });
    }
    this.send(s, { t: 'importResult', ok: true, mode: res.mode, name: res.name, text });
  }

  // 家族サーバー ⇄ スマホ: キャラを 送る（ids が なければ ぜんぶ）
  onSyncOut(s, msg) {
    const ids = Array.isArray(msg.ids) ? msg.ids.map(String).slice(0, 24) : null;
    // 遊んでいる とちゅうなら 今の いちも 入れる
    for (const x of this.sessions.values()) {
      if (x.inWorld && x.char && (!ids || ids.includes(x.charId)) && !x.busy) x.char.pos = { map: x.map, x: x.x, y: x.y, dir: x.dir };
    }
    const out = buildSyncOut(this, { ids, onlyChanged: !!msg.onlyChanged, from: this.offline ? 'site' : 'server', now: this.now() });
    this.markDirty();
    this.send(s, { t: 'syncPayload', text: out.data.chars.length ? encodeSync(out.data) : '', names: out.names, ids: out.data.chars.map((e) => e.char.id) });
  }

  // 家族サーバー ⇄ スマホ: とどいた キャラと 合わせる
  onSyncIn(s, msg) {
    const r = decodeSync(msg.text);
    if (!r.ok) return this.send(s, { t: 'syncResult', ok: false, text: r.reason, results: [] });
    // 通信が とぎれた ままの キャラは おわらせてから
    for (const x of [...this.sessions.values()]) {
      if (x.away && x.inWorld && r.data.chars.some((e) => e?.char?.id === x.charId)) {
        this.leaveWorld(x);
        this.sessions.delete(x.id);
      }
    }
    const before = JSON.stringify(this.data);
    const results = applySyncIn(this, r.data, { online: (id) => [...this.sessions.values()].some((x) => x.inWorld && x.charId === id), now: this.now() });
    const changed = results.some((x) => ['new', 'updated', 'merged'].includes(x.mode));
    if (changed) {
      // 入れかえる まえの セーブを とっておく
      this.storage?.backup?.('before-sync', before);
      this.markDirty();
      this.saveNow({ urgent: true });
      this.broadcast({ t: 'chars', chars: this.charList() });
    }
    const place = this.offline ? 'このスマホ' : '家族サーバー';
    this.send(s, { t: 'syncResult', ok: true, changed, results, lines: syncSummary(results, place) });
  }

  onDeleteChar(s, msg) {
    const c = this.data.characters[msg.id];
    if (!c) return;
    if ([...this.sessions.values()].some((x) => x.charId === c.id && x.inWorld)) return this.send(s, { t: 'error', text: '今遊んでいるキャラクターは消せません' });
    if (msg.confirm !== c.name) return this.send(s, { t: 'error', text: '名前がちがいます' });
    delete this.data.characters[msg.id];
    // 消した しるし（スマホから おなじ キャラが もどってこない ように）
    this.data.deleted = this.data.deleted || {};
    this.data.deleted[msg.id] = this.now();
    // ほかの 人の パーティー・馬車に いた この 人の うつしも はずす（data/wagon.js）
    for (const other of Object.values(this.data.characters)) dropGoneFamily(other, this.data.characters);
    for (const p of this.parties.values()) {
      syncParty(this, p);
      this.sendParty(p);
    }
    this.markDirty();
    this.saveNow({ urgent: true });
    this.broadcast({ t: 'chars', chars: this.charList() });
  }

  onPlay(s, msg) {
    const c = this.data.characters[msg.id];
    if (!c) return this.send(s, { t: 'error', text: 'キャラクターが見つかりません' });
    // つなぎなおし（スマホの スリープの あと など）: パーティーも たたかいも そのまま つづける
    if (!this.offline) {
      const prev = [...this.sessions.values()].find((o) => o !== s && o.charId === c.id && o.inWorld);
      if (prev) return this.resumeSession(s, prev);
    }
    // ほかの たんまつで つかっていたら そちらを おわらせる
    for (const other of this.sessions.values()) {
      if (other !== s && other.charId === c.id && other.inWorld) {
        this.send(other, { t: 'kicked', text: '他のたんまつで同じキャラクターがログインしました' });
        this.leaveWorld(other);
      }
    }
    if (s.inWorld) this.leaveWorld(s);
    s.charId = c.id;
    s.char = c;
    normalizeChar(c);
    // ほかの 人の 冒険を 手伝っていた ときは、自分の 冒険の 場所から。
    // 知らない マップ・マップの 外なら はじまりの 場所から
    const home = validPos(c.soloPos);
    delete c.soloPos;
    const pos = home || validPos(c.pos) || { map: 'overworld', x: START_POS[0] + 0.5, y: START_POS[1] + 0.5, dir: 'down' };
    s.map = pos.map;
    s.x = pos.x;
    s.y = pos.y;
    s.dir = pos.dir || 'down';
    s.inWorld = true;
    s.busy = null;
    s.level = c.level;
    // 大鳥に のったまま 終わった ときは 空から つづける
    setFlying(s, canFlyMap(pos.map) && (home ? !!home.fly : pos === c.pos && !!c.riding));
    const p = newParty(this, s.id);
    s.partyId = p.id;
    syncParty(this, p);
    if (c.hp <= 0) c.hp = 1;
    const supportLog = c.supportLog || [];
    c.supportLog = [];
    this.send(s, {
      t: 'enter', sid: s.id, char: c, map: s.map, x: s.x, y: s.y, dir: s.dir, posSeq: s.posSeq,
      party: partyState(this, p), board: this.data.board || [], supportLog, serverTime: this.now(),
      players: this.playerList(s), fly: !!s.flying,
    });
    this.broadcast({ t: 'joined', sid: s.id, name: c.name }, s);
    this.broadcast({ t: 'chars', chars: this.charList() });
    this.broadcastPlayers();
    this.markDirty();
    // はじめての ときは オープニング
    if (!c.flags.p_opening) runScript(this, s, 'opening');
    // まえの バージョンで 森の ぬしを たおしていた 人は、ゆめの なかで 紋章の ちからに めざめる
    else if (c.flags.c1_treant && !c.flags.monster_bond) runScript(this, s, 'bond_dream');
  }

  // たおした まものが なかまに なりたがっている（レベルは いつも 1。party.js の befriendLevel）
  //   パーティーが あいていれば パーティー、いっぱいなら あいている 馬車、どちらも いっぱいの ときだけ だれが 酒場へ もどるか えらぶ
  offerBefriend(s, species, level = befriendLevel()) {
    const m = MONSTERS[species];
    if (!m || s.busy) return;
    const c = s.char;
    ensureCompanions(c);
    dropMissingFam(this, c);
    const id = 'o' + (++this.offerSeq || (this.offerSeq = 1)) + Math.floor(this.rng.next() * 1e6).toString(36);
    s.befriendOffer = { id, species, level };
    const p = partyOf(this, s);
    let yes;
    if (!rosterFull(c)) {
      yes = [['befriend', id, null]];
    } else {
      const wagon = hasWagon(c) ? c.wagonKeys : [];
      const name = (k) => nameOfKey(this, c, k) || '？';
      const keys = [...c.partyKeys, ...wagon];
      yes = [
        ['say', null, wagon.length ? 'パーティーも馬車もいっぱいだ。\nだれかに酒場で待っていてもらおう。' : 'パーティーがいっぱいだ。\nだれかに酒場で待っていてもらおう。'],
        ['choice', 'だれが酒場へもどる？', [...c.partyKeys.map((k) => (wagon.length ? `${name(k)}（パーティー）` : name(k))), ...wagon.map((k) => `${name(k)}（馬車）`), `${m.name}が酒場で待つ`],
          [...keys.map((k) => [['befriend', id, k]]), [['befriend', id, '__tavern']]]],
      ];
    }
    runSteps(this, s, [
      ['showMon', species],
      ['sfx', 'sparkle'],
      ['say', null, `なんと${m.name}が起き上がり\n仲間になりたそうにこちらを見ている！`],
      ['choice', `${m.name}を仲間にしてあげますか？`, ['はい', 'いいえ'], [
        yes,
        [['say', null, `${m.name}はさびしそうに去っていった…`], ['befriend', id, false]],
      ]],
      ['showMon', null],
    ]);
    if (p && p.members.length > 1) this.broadcastToParty(p, { t: 'toast', text: `${m.name}が${c.name}の仲間になりたそうにしている！` });
  }

  broadcastPlayers() {
    const list = this.playerList(null);
    for (const s of this.sessions.values()) if (s.inWorld) this.send(s, { t: 'players', players: list });
  }

  playerList(except) {
    return [...this.sessions.values()].filter((x) => x.inWorld && x !== except).map((x) => ({ sid: x.id, name: x.char.name, level: x.char.level, job: x.char.job, map: x.map, partyId: x.partyId, away: !!x.away }));
  }

  // ───────────── いどう ─────────────
  onMove(s, msg) {
    if (s.busy) return;
    if (msg.seq !== undefined && msg.seq !== s.posSeq) return; // テレポートより まえの いち
    const x = Number(msg.x), y = Number(msg.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const map = MAPS[s.map];
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) return;
    // あまりに とおくへの いどうは みとめない（ワープ いがい）。
    // 歩けない ところ（山・海 など）は 大鳥で とんでいる ときだけ（travel.js）
    if (Math.hypot(x - s.x, y - s.y) > 6 || !moveAllowed(this, s, map, x, y)) {
      this.send(s, { t: 'setPos', map: s.map, x: s.x, y: s.y, dir: s.dir, seq: s.posSeq });
      return;
    }
    const oldTx = Math.floor(s.x), oldTy = Math.floor(s.y);
    s.x = x;
    s.y = y;
    s.dir = ['up', 'down', 'left', 'right'].includes(msg.dir) ? msg.dir : s.dir;
    s.moving = !!msg.moving;
    s.follow = !!msg.follow;
    const tx = Math.floor(x), ty = Math.floor(y);
    if (tx !== oldTx || ty !== oldTy) this.onEnterTile(s, tx, ty);
  }

  // 世界の フラグ（橋・とびら・人・イベントの 場所）。さそわれて 手伝っている ときは リーダーの ものがたりの 世界
  worldFlags(s) {
    return (this.hostOf(s) || s).char?.flags || {};
  }

  // '@night' … 夜の あいだ（夜だけ 出る 人・夜は 家に 帰る 人。パーティーの 時計で）
  // '@noon'・'@am'・'@pm' … お日さまの むき（第4章の オベリスクの 影。clock.js の timeFlag）
  hasFlagFn(s) {
    const flags = this.worldFlags(s);
    return (f) => (f[0] === '@' ? timeFlag(f, fracFor(this, s)) : !!flags[f]);
  }

  onEnterTile(s, tx, ty) {
    // 空の 上: 出入り口・イベント・ばしょの きろくは なし
    if (s.flying) return;
    const map = MAPS[s.map];
    const warp = map.warpAt.get(ty * map.w + tx);
    if (warp) {
      const to = warp.to;
      const fromMap = s.map, fx = s.x, fy = s.y;
      this.placeSession(s, to.map, to.x, to.y, to.dir, true);
      this.warpFollowers(s, fromMap, fx, fy, to);
      this.checkTriggers(s, Math.floor(to.x), Math.floor(to.y));
      return;
    }
    if (this.checkTriggers(s, tx, ty)) return;
    // ようがんの 地面（第3章。world/hazards.js）
    stepHazard(this, s, tx, ty);
    // ばしょの きろく（きかんのはね）。リーダーの 冒険を 手伝っている あいだは 自分の きろくに しない
    if (this.hostOf(s)) return;
    let found = false;
    for (const [id, p] of Object.entries(PLACES)) {
      if (s.map === 'overworld' && tx >= p.x && ty >= p.y && tx < p.x + p.w && ty < p.y + p.h && !s.char.visited?.[id]) {
        s.char.visited = s.char.visited || {};
        s.char.visited[id] = true;
        found = true;
      }
    }
    for (const [id, p] of Object.entries(SEA_PLACES)) {
      const [rx, ry, rw, rh] = p.rect;
      if (s.map === p.map && tx >= rx && ty >= ry && tx < rx + rw && ty < ry + rh && !s.char.visited?.[id]) {
        s.char.visited = s.char.visited || {};
        s.char.visited[id] = true;
        found = true;
      }
    }
    // リーダーが 新しい 場所に 来たら、なかまの 行き先（帰り道の羽・ルーラ）も ふえる
    const party = found && partyOf(this, s);
    if (party && party.members.length > 1) this.sendParty(party);
  }

  // リーダーに「ついていく」に している なかまは、でいりぐちも いっしょに とおる
  warpFollowers(s, fromMap, fx, fy, to) {
    const p = partyOf(this, s);
    if (!p || p.leader !== s.id) return;
    const offs = [[0, 1], [-1, 1], [1, 1], [0, 2]];
    let i = 0;
    for (const sid of p.members) {
      const m = this.sessions.get(sid);
      if (!m || m === s || !m.follow || m.busy || m.away || !m.inWorld || m.map !== fromMap) continue;
      if (Math.hypot(m.x - fx, m.y - fy) > 12) continue;
      const [ox, oy] = offs[i++ % offs.length];
      const map = MAPS[to.map];
      let x = to.x + ox, y = to.y + oy;
      if (isBlocked(map, Math.floor(x), Math.floor(y), () => false)) { x = to.x; y = to.y; }
      this.placeSession(m, to.map, x, y, to.dir, true);
    }
  }

  checkTriggers(s, tx, ty) {
    const map = MAPS[s.map];
    for (const tr of map.triggers) {
      if (tx >= tr.x && ty >= tr.y && tx < tr.x + tr.w && ty < tr.y + tr.h) {
        if (!condOk(tr.show, this.hasFlagFn(s))) continue;
        if (runScript(this, s, tr.script)) return true;
      }
    }
    return false;
  }

  // サーバーが いちを きめる（テレポート・ワープ）。opts.fly … 大鳥に のったまま（ほかは おりる）
  placeSession(s, mapId, x, y, dir, notify = true, opts = {}) {
    // 洞窟に 入った 場所を おぼえる（みちびきの糸。escape.js）
    noteDungeonEntry(s, { map: s.map, x: s.x, y: s.y, dir: s.dir }, mapId);
    // のろいの宝の のろいは ピラミッドの 外に 出ると とける（world/pyramid.js）
    notePyramidMove(this, s, mapId);
    s.map = mapId;
    s.x = x;
    s.y = y;
    s.dir = dir || s.dir;
    s.posSeq++;
    s.invuln = 1500;
    setFlying(s, !!opts.fly && canFlyMap(mapId));
    if (notify) this.send(s, { t: 'setPos', map: mapId, x, y, dir: s.dir, seq: s.posSeq, fly: !!s.flying });
    this.markDirty();
  }

  // さそわれて リーダーの 冒険を 手伝っている ときは、その リーダー（ほかは null）
  hostOf(s) {
    const p = partyOf(this, s);
    if (!p || p.members.length < 2 || p.leader === s.id) return null;
    const leader = this.sessions.get(p.leader);
    return leader?.char ? leader : null;
  }

  // パーティーが おわって ひとりに なった: 自分の 冒険の 場所へ もどる
  returnHome(s) {
    const pos = validPos(s.char.soloPos);
    delete s.char.soloPos;
    this.markDirty();
    if (!pos || (pos.map === s.map && Math.hypot(pos.x - s.x, pos.y - s.y) < 1)) return;
    this.placeSession(s, pos.map, pos.x, pos.y, pos.dir || s.dir, true, { fly: !!pos.fly });
    this.send(s, { t: 'toast', text: `${s.char.name}は自分の冒険にもどった！\n（パーティーに入る前の場所へ）` });
    this.broadcastPlayers();
  }

  // note: 目を覚ました ときの おしらせに 足す ことば（全滅で お金が へった など）
  respawn(s, note = '') {
    // さそわれて 来ている 人は リーダーの いのりの場所で（みんな いっしょに 目を覚ます）
    const own = this.hostOf(s)?.char.spawn || s.char.spawn;
    const sp = own && MAPS[own.map] ? own : { map: 'overworld', x: POS.villageChurch[0] + 0.5, y: POS.villageChurch[1] + 0.5 };
    // 教会の 人・かべ・宝箱と 重ならない、いちばん ちかい ところで 目を覚ます（重なると 動けなく なる）
    const at = standSpot(MAPS[sp.map], sp.x, sp.y, this.hasFlagFn(s));
    fullHeal(s.char);
    this.placeSession(s, sp.map, at.x, at.y, 'down', true);
    this.send(s, { t: 'toast', text: `${s.char.name}はいのりの場所で目を覚ました。\n「無理はいけませんよ」${note ? `\n${note}` : ''}`, afterBattle: true });
  }

  mapKind(id) { return MAPS[id]?.kind; }

  // ───────────── モンスターに ふれた ─────────────
  onTouch(s, msg) {
    if (s.busy || s.invuln > 0 || s.flying) return;
    const ms = this.mapStates.get(s.map);
    const sym = ms?.symbols.get(msg.id);
    if (!sym || sym.busy || sym.stun > 0) return;
    // 昼の 人には 夜の まものは 見えない（その ぎゃくも）
    if (!symbolVisible(sym, isNightFor(this, s))) return;
    if (Math.hypot(sym.x - s.x, sym.y - s.y) > 2.5) return;
    const zone = MAPS[s.map].zoneAt(Math.floor(s.x), Math.floor(s.y));
    if (zone.startsWith('safe')) return;
    startFieldBattle(this, s, sym);
  }

  // ───────────── しらべる・はなす ─────────────
  onInteract(s, msg) {
    if (s.busy || s.flying) return;
    const map = MAPS[s.map];
    // 人・宝箱が 出ているかは 世界の フラグで（手伝っている ときは リーダーの 世界）
    const hasFlag = this.hasFlagFn(s);
    if (msg.kind === 'npc') {
      const n = map.npcById[msg.id];
      if (!n || !condOk(n.show, hasFlag)) return;
      const reach = (n.wander || 0) + (n.big ? 3.5 : 2.6);
      if (Math.hypot(n.x + 0.5 - s.x, n.y + 0.5 - s.y) > reach + 1.5) return;
      runScript(this, s, n.script);
      return;
    }
    if (msg.kind !== 'tile') return;
    const tx = Math.floor(msg.x), ty = Math.floor(msg.y);
    if (Math.hypot(tx + 0.5 - s.x, ty + 0.5 - s.y) > 3) return;
    const key = ty * map.w + tx;
    // たからばこ（フィールドの 宝箱は 開けると きえる）
    const chest = map.chestAt.get(key);
    if (chest && condOk(chest.show, hasFlag) && !(chestVanishes(map) && s.char.chests[chest.id])) return this.openChest(s, chest);
    // フィールドに ランダムに 出る 宝箱（fieldchests.js）
    const fc = fieldChestNear(this.mapStates.get(s.map), s, tx, ty);
    if (fc) return runSteps(this, s, openFieldChest(this, s, mapState(this, s.map), fc));
    // 小さなメダル（つぼ・井戸・光る 場所 など。casino.js）
    const medal = medalSearchSteps(this, s, tx, ty);
    if (medal) return runSteps(this, s, medal);
    // きらきら（むいている マスの まわりと 自分の 足もとの、光っている もの）
    const sp = this.sparkleNear(s, map, tx, ty);
    if (sp?.medal) {
      const st = medalSearchSteps(this, s, sp.x, sp.y);
      if (st) return runSteps(this, s, st);
    } else if (sp) return this.pickSparkle(s, sp);
    // 宝の地図の 場所（ほる）
    if (tryTreasureDig(this, s, tx, ty)) return;
    // しかけの マス（レバー・かがり火・温泉 など。第3章）
    const act = map.actionAt?.get(key);
    if (act && condOk(act.show, hasFlag)) return runScript(this, s, act.script);
    const tile = effectiveTile(map, tx, ty, this.hasFlagFn(s));
    // かんばん
    if (tile === T.SIGN) {
      const sign = map.signAt.get(key);
      if (sign) return runSteps(this, s, [['say', null, sign.text]]);
      // 町の でんごんばん
      return runScript(this, s, 'board');
    }
    if (tile === T.BED && s.map === 'overworld' && tx >= PLACES.village.x + 3 && tx < PLACES.village.x + 10 && ty >= PLACES.village.y + 2 && ty < PLACES.village.y + 7) {
      return runScript(this, s, 'home_bed');
    }
    if (tile === T.LOCKED_DOOR) return runScript(this, s, 'locked_door');
    if (TILE_INFO[tile]?.search) return this.searchTile(s, tx, ty, tile);
    if (tile === T.STAR_ALTAR) return runScript(this, s, map.altarScript || 'star_stone');
    if (tile === T.ALTAR && s.map === 'overworld' && Math.abs(tx - POS.shrineAltar[0]) <= 1 && Math.abs(ty - POS.shrineAltar[1]) <= 1) {
      return runScript(this, s, 'star_flower');
    }
    if (tile === T.WELL) return runSteps(this, s, [['say', null, '井戸をのぞきこんだ。\n深くて底が見えない…']]);
    if (tile === T.FOUNTAIN) return runSteps(this, s, [['say', null, 'きれいなふんすいだ。\n水がきらきら光っている。']]);
    if (tile === T.STATUE) return runSteps(this, s, [['say', null, '勇者の像だ。\n「きずなは星のようにかがやく」と刻まれている。']]);
  }

  openChest(s, chest) {
    const c = s.char;
    if (c.chests[chest.id]) return runSteps(this, s, [['say', null, '宝箱は空っぽだ。']]);
    if (chest.medal) return runSteps(this, s, medalChestSteps(this, s, chest));
    // 手伝いに 来ている ときは、ものがたりの 大事な物は とらない（自分の 冒険で）
    if (!chest.gold && ITEMS[chest.item]?.type === 'key' && this.hostOf(s)) {
      return runSteps(this, s, [['say', null, '宝箱には、大切な物が入っているみたいだ。\n自分の冒険のときに開けよう。']]);
    }
    c.chests[chest.id] = true;
    const steps = [['sfx', 'chest'], ['chestOpen', chest.id]];
    if (chest.gold) {
      c.gold += chest.gold;
      steps.push(['say', null, `${c.name}は宝箱を開けた！\n${chest.gold}ゴールドを手に入れた！`]);
    } else {
      const n = chest.n || 1;
      addItem(c, chest.item, n);
      steps.push(['say', null, `${c.name}は宝箱を開けた！\n${ITEMS[chest.item].name}${n > 1 ? `を${n}個` : 'を'}手に入れた！`]);
      if (chest.item === 'cave_key') {
        c.objective = 'カギで、おくのとびらを開けよう';
        steps.push(['objective', c.objective]);
      }
    }
    this.markDirty();
    runSteps(this, s, steps);
  }

  // ひろえる きらきら（もう ひろって 光っていない ものは のぞく）。近い ものから
  sparkleNear(s, map, tx, ty) {
    const now = this.now();
    let best = null, bd = Infinity;
    for (const sp of map.sparkles || []) {
      if (Math.abs(sp.x - tx) > 2 || Math.abs(sp.y - ty) > 2) continue;
      if (now - (s.char.sparkles?.[sp.id] || 0) < SPARKLE_RESPAWN_MS) continue;
      const dFace = Math.hypot(sp.x - tx, sp.y - ty);
      const dMe = Math.hypot(sp.x + 0.5 - s.x, sp.y + 0.5 - s.y);
      if (dFace > 1.01 && dMe > 1.6) continue;
      const d = Math.min(dFace, dMe);
      if (d < bd) {
        bd = d;
        best = sp;
      }
    }
    return best;
  }

  pickSparkle(s, sp) {
    const c = s.char;
    c.sparkles = c.sparkles || {};
    const last = c.sparkles[sp.id] || 0;
    if (this.now() - last < SPARKLE_RESPAWN_MS) return runSteps(this, s, [['say', null, '何もない。\n（しばらくするとまた光るかも）']]);
    c.sparkles[sp.id] = this.now();
    const id = sparkleLoot(sp.zone, this.rng.next());
    addItem(c, id, 1);
    this.markDirty();
    runSteps(this, s, [['sfx', 'item'], ['say', null, `${c.name}は${ITEMS[id].name}を拾った！`]]);
  }

  searchTile(s, tx, ty, tile) {
    const c = s.char;
    c.searched = c.searched || {};
    const key = `${s.map}:${tx}:${ty}`;
    const names = { [T.POT]: 'つぼ', [T.BARREL]: 'たる', [T.SHELF]: 'たな', [T.BOOKSHELF]: '本だな', [T.CRATE]: '箱' };
    const nm = names[tile] || 'それ';
    if (c.searched[key]) return runSteps(this, s, [['say', null, `${nm}を調べた。\nしかし何も見つからなかった。`]]);
    c.searched[key] = true;
    const loot = searchLoot(s.map, tx, ty);
    this.markDirty();
    if (!loot) {
      if (tile === T.BOOKSHELF) return runSteps(this, s, [['say', null, 'むずかしそうな本が並んでいる…\n「魔法剣の基本」「星の歌」…']]);
      return runSteps(this, s, [['say', null, `${nm}を調べた。\nしかし何も見つからなかった。`]]);
    }
    if (loot.gold) {
      c.gold += loot.gold;
      return runSteps(this, s, [['sfx', 'item'], ['say', null, `${nm}を調べた。\n${loot.gold}ゴールドを見つけた！`]]);
    }
    addItem(c, loot.item, 1);
    runSteps(this, s, [['sfx', 'item'], ['say', null, `${nm}を調べた。\n${ITEMS[loot.item].name}を見つけた！`]]);
  }

  // ───────────── メニュー ─────────────
  onMenu(s, msg) {
    if (msg.action === 'tmap') return treasureMenu(this, s, msg);
    menuAction(this, s, msg);
  }

  // ───────────── パーティー ─────────────
  onParty(s, msg) {
    const p = partyOf(this, s);
    switch (msg.action) {
      case 'invite': {
        const t = this.sessions.get(msg.sid);
        if (!t || !t.inWorld || t === s) return;
        if (p.leader !== s.id) return this.send(s, { t: 'toast', text: 'さそえるのはリーダーだけです' });
        if (p.members.length >= PARTY_MAX) return this.send(s, { t: 'toast', text: `パーティーがいっぱいです（${PARTY_MAX}人まで）` });
        t.invitedBy = { sid: s.id, partyId: p.id, at: this.now() };
        this.send(t, { t: 'invite', from: s.char.name, sid: s.id });
        this.send(s, { t: 'toast', text: `${t.char.name}をパーティーにさそった！` });
        return;
      }
      case 'accept': {
        const inv = s.invitedBy;
        s.invitedBy = null;
        if (!inv) return;
        const target = this.parties.get(inv.partyId);
        const inviter = this.sessions.get(inv.sid);
        if (!target || !inviter) return this.send(s, { t: 'toast', text: 'さそいが切れてしまった…' });
        if (s.busy) return this.send(s, { t: 'toast', text: '今はパーティーに入れません' });
        if (target.members.length >= PARTY_MAX) return this.send(s, { t: 'toast', text: `パーティーがいっぱいです（${PARTY_MAX}人まで）` });
        // じぶんの パーティーを ぬける
        this.leaveParty(s, true);
        // 自分の 冒険の 場所を おぼえておく（パーティーが おわったら ここへ もどる）
        if (!s.char.soloPos) s.char.soloPos = { map: s.map, x: s.x, y: s.y, dir: s.dir, ...(s.flying ? { fly: true } : {}) };
        const own = this.parties.get(s.partyId);
        if (own) this.parties.delete(own.id);
        target.members.push(s.id);
        s.partyId = target.id;
        // にんげんが ふえたので はいりきらない なかまは いったん まつ
        syncParty(this, target);
        this.sendParty(target);
        this.broadcastToParty(target, { t: 'toast', text: `${s.char.name}がパーティーに加わった！` });
        // さそってくれた リーダーの ところへ（ひとりで きたえた キャラも すぐ いっしょに 冒険できる）
        const leader = this.sessions.get(target.leader);
        if (leader && leader !== s && leader.inWorld && (leader.map !== s.map || Math.hypot(leader.x - s.x, leader.y - s.y) > 6)) {
          this.placeSession(s, leader.map, leader.x, leader.y, leader.dir, true, { fly: !!leader.flying });
          this.send(s, { t: 'toast', text: `${leader.char.name}のところへ移動した！` });
          this.broadcastPlayers();
        }
        return;
      }
      case 'decline': {
        const inv = s.invitedBy;
        s.invitedBy = null;
        const inviter = inv && this.sessions.get(inv.sid);
        if (inviter) this.send(inviter, { t: 'toast', text: `${s.char.name}は今はむずかしいようだ…` });
        return;
      }
      case 'leave': {
        if (p.members.length <= 1) return;
        this.leaveParty(s, false);
        return;
      }
      case 'kick': {
        if (p.leader !== s.id) return;
        const t = this.sessions.get(msg.sid);
        if (!t || !p.members.includes(t.id)) return;
        this.leaveParty(t, false);
        return;
      }
      case 'leader': {
        if (p.leader !== s.id || !p.members.includes(msg.sid)) return;
        p.leader = msg.sid;
        syncParty(this, p);
        this.sendParty(p);
        return;
      }
      case 'dismiss': {
        // なかまに 酒場で まっていて もらう
        if (p.leader !== s.id || s.busy) return;
        const r = companionWait(this, s, String(msg.key || ''));
        if (r.ok) this.send(s, { t: 'toast', text: `${r.name}は酒場へもどった。${r.stowed?.length ? `\n（装備はふくろにしまった）` : ''}\n（ルミナの町の酒場でまた連れていけるよ）` });
        return;
      }
      default:
    }
  }

  leaveParty(s, silent) {
    const p = this.parties.get(s.partyId);
    if (!p) return;
    p.members = p.members.filter((x) => x !== s.id);
    if (!p.members.length) {
      this.parties.delete(p.id);
    } else {
      if (p.leader === s.id) {
        p.leader = p.members[0];
      }
      syncParty(this, p);
      this.sendParty(p);
      if (!silent) this.broadcastToParty(p, { t: 'toast', text: `${s.char.name}がパーティーからはなれた。` });
    }
    if (s.inWorld) {
      const np = newParty(this, s.id);
      s.partyId = np.id;
      syncParty(this, np);
      this.sendParty(np);
    } else {
      s.partyId = null;
    }
  }

  sendParty(p) {
    if (!p) return;
    const st = partyState(this, p);
    for (const sid of p.members) this.send(this.sessions.get(sid), { t: 'party', party: st });
    clearTimeout(this.playersTimer);
    this.playersTimer = setTimeout(() => {
      try {
        this.broadcastPlayers();
      } catch (e) {
        console.error('players error', e);
      }
    }, 50);
  }

  broadcastToParty(p, msg) {
    for (const sid of p.members) this.send(this.sessions.get(sid), msg);
  }

  sendSelf(s) {
    if (!s?.char) return;
    s.level = s.char.level;
    this.send(s, { t: 'self', char: s.char });
  }

  // ───────────── チャット ─────────────
  onChat(s, msg) {
    const text = String(msg.text || '').replace(/[<>]/g, '').slice(0, 80).trim();
    const stamp = msg.stamp ? String(msg.stamp).slice(0, 12) : null;
    if (!text && !stamp) return;
    this.broadcast({ t: 'chat', from: s.char.name, sid: s.id, text, stamp });
  }

  onExplored(s, msg) {
    if (!MAPS[msg.map] || typeof msg.data !== 'string' || msg.data.length > 20000) return;
    s.char.explored = s.char.explored || {};
    s.char.explored[msg.map] = msg.data;
    this.markDirty();
  }

  // ───────────── まいフレーム ─────────────
  tick(dt) {
    // バトル
    for (const ctx of [...this.battles.values()]) {
      try {
        battleTick(this, ctx, dt);
        ctx.errors = 0;
      } catch (e) {
        // 1つの たたかいが こわれても 世界は とめない。なんども こわれる ときは おわらせて フィールドへ
        ctx.errors = (ctx.errors || 0) + 1;
        if (ctx.errors === 1) console.error('battle error', e);
        if (ctx.errors >= BATTLE_ERROR_LIMIT && this.battles.get(ctx.id) === ctx) abortBattle(this, ctx);
      }
    }
    // つうしんが とぎれた まま もどってこない人
    const now = this.now();
    for (const s of [...this.sessions.values()]) {
      if (s.away && now - s.awayAt > this.awayMs) {
        this.leaveWorld(s);
        this.sessions.delete(s.id);
      }
    }
    // プレイヤーの むてき時間
    const byMap = new Map();
    for (const s of this.sessions.values()) {
      if (!s.inWorld) continue;
      if (s.invuln > 0) s.invuln -= dt;
      // 夜か（パーティーの 時計。夜の まものが 見える）
      s.night = isNightFor(this, s);
      // さそわれて 来ていた 人が ひとりに なった → 自分の 冒険の 場所へ
      if (s.char?.soloPos && !s.busy && !s.away && (partyOf(this, s)?.members.length || 1) < 2) this.returnHome(s);
      if (!byMap.has(s.map)) byMap.set(s.map, []);
      byMap.get(s.map).push(s);
    }
    // モンスター（とぎれている 人は おいかけない）
    for (const [mapId, players] of byMap) {
      const ms = mapState(this, mapId);
      spawnSymbols(this, ms, dt, players);
      moveSymbols(this, ms, dt, players.filter((p) => !p.away));
      // フィールドの ランダムな 宝箱（fieldchests.js）
      tickFieldChests(this, ms, dt, players);
    }
    pruneTreasureStates(this, byMap);
    // いちを おくる（10かい/びょう）
    this.snapTimer += dt;
    if (this.snapTimer >= 100) {
      this.snapTimer = 0;
      for (const [mapId, players] of byMap) {
        const ms = mapState(this, mapId);
        // 昼の 人・夜の 人で 見える まものが ちがう
        const syms = { day: symbolSnapshot(ms, false), night: symbolSnapshot(ms, true) };
        const ps = players.map((p) => ({
          sid: p.id, name: p.char.name, look: p.char.look, job: p.char.job, eq: equipLook(p.char), x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100,
          dir: p.dir, mv: p.moving ? 1 : 0, b: p.busy === 'battle' ? 1 : 0, pid: p.partyId, aw: p.away ? 1 : 0,
          fl: this.followerLooks(p), wg: wagonLook(this, p),
          // 大鳥で とんでいる / なかまの 大鳥に いっしょに のっている
          ...(p.flying ? { air: 1, ride: ridingAlong(this, p) ? 1 : 0 } : {}),
          // 星の竜に のって とんでいる（第3章の あと。client/sky.js が 竜の え に する）
          ...(p.flying && p.char.flags?.c3_dragon ? { mt: 'dragon' } : {}),
        }));
        for (const p of players) {
          const fc = fieldChestSnap(p, ms);
          this.send(p, { t: 'snap', map: mapId, players: ps.filter((x) => x.sid !== p.id), syms: p.night ? syms.night : syms.day, ...(fc ? { fc } : {}) });
        }
      }
    }
    // セーブ
    if (this.dirty) {
      this.saveTimer += dt;
      if (this.saveTimer > 3000) this.saveNow();
    }
  }

  followerLooks(s) {
    const p = partyOf(this, s);
    if (!p || p.leader !== s.id) return [];
    return [
      ...p.supports.map((x) => ({ look: x.char.look, job: x.char.job, eq: equipLook(x.char), mon: x.char.species || undefined, name: x.char.name })),
      ...p.guests.map((g) => ({ look: g.char.look, job: g.char.job, eq: equipLook(g.char), name: g.char.name, guest: g.id })),
    ];
  }

  markDirty() {
    this.dirty = true;
  }

  // opts.urgent … 宿屋・教会・終わる など、すぐに 書いて ほしい とき（クラウドセーブ用）
  saveNow(opts) {
    this.saveTimer = 0;
    if (!this.dirty) return;
    this.dirty = false;
    // ログイン中の いちも きろく
    for (const s of this.sessions.values()) {
      if (s.inWorld && s.char && !s.busy) s.char.pos = { map: s.map, x: s.x, y: s.y, dir: s.dir };
    }
    try {
      this.storage?.save?.(this.data, opts);
    } catch (e) {
      this.log('save error', e);
    }
  }
}

// みための ための そうび（ぶき・よろい・たて・あたま）
export function equipLook(c) {
  const e = c.equip || {};
  return [e.weapon || '', e.armor || '', e.shield || '', e.head || ''].join(',');
}

// セーブの 場所が つかえるか（知らない マップ・マップの 外なら null）
function validPos(pos) {
  if (typeof pos?.map === 'string' && pos.map.startsWith('tm_')) return fixTreasurePos(pos); // 宝の洞窟
  const pm = pos && typeof pos.map === 'string' && Object.prototype.hasOwnProperty.call(MAPS, pos.map) ? MAPS[pos.map] : null;
  const inside = pm && Number.isFinite(pos.x) && Number.isFinite(pos.y) && pos.x >= 0 && pos.y >= 0 && pos.x < pm.w && pos.y < pm.h;
  return inside ? pos : null;
}

function normalizeChar(c) {
  repairChar(c);
  c.flags = c.flags || {};
  c.chests = c.chests || {};
  c.items = c.items || [];
  c.keyItems = c.keyItems || [];
  c.kills = c.kills || {};
  c.quests = c.quests || {};
  c.visited = c.visited || { village: true };
  c.seeds = c.seeds || {};
  c.status = c.status || {};
  c.jobs = c.jobs || { [c.job]: { lv: 1, b: 0 } };
  migrateJobs(c);
  if (!JOBS[c.job]) c.job = 'warrior';
  if (!c.jobs[c.job]) c.jobs[c.job] = { lv: 1, b: 0 };
  c.battleSettings = c.battleSettings || { speed: 1, wait: false, auto: false };
  // オートで ねらう 合体技は なくなった（合体技は 戦いの 中で えらんで よやく する）
  delete c.battleSettings.autoDual;
  // 第1章クリアの あとの もくひょう（第2章が できた ので あんない を かえる）
  if (c.flags.c1_clear && !c.flags.c2_start && /続きはアップデート/.test(c.objective || '')) c.objective = CH1_CLEAR_OBJECTIVE;
  // 第2章クリアずみで 風の笛を まだ もらっていない 人に 知らせる（sky.js）
  migrateSky(c);
  // 第3章クリアで「続きはアップデートで！」の ままの 人は、第4章の 入り口へ（story-ch4.js）
  migrateCh4(c);
  // 目標の 文が 古い 版の まま・からっぽ なら、ストーリーの すすみぐあいから なおす（progress.js）
  repairObjective(c);
  ensureCompanions(c);
  // 体で なれない 職業（フルーツジッパー・アラシ）に なっていたら もとに もどす（stats.js）
  fixBodyJob(c);
  for (const e of c.companions || []) fixBodyJob(e?.char);
  normalizeTreasure(c);
}
