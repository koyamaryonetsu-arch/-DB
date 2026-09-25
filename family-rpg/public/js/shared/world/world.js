// ゲームの せかい（家族サーバー / ひとりモード 共通）
//
// クライアントとは メッセージ（JSON）で やりとりする。
// つなぎかたは なんでも よい（WebSocket でも ブラウザ内の ちょくせつ呼び出しでも）。
import { makeRng } from '../rng.js';
import { MAPS, isBlocked, effectiveTile, condOk, searchLoot, sparkleLoot, tileAt, POS } from '../maps/index.js';
import { PLACES } from '../maps/overworld.js';
import { T, TILE_INFO } from '../tiles.js';
import { ITEMS } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { newCharacter, computeStats, addItem, fullHeal } from '../stats.js';
import { mapState, spawnSymbols, moveSymbols, symbolSnapshot } from './monsters.js';
import { startFieldBattle, battleTick, battleCommand, battleLeave, joinBattle } from './battles.js';
import { runScript, runSteps } from './scripts.js';
import { serviceAction, menuAction } from './services.js';
import { newParty, partyOf, partyState, syncParty, ensureCompanions, companionWait, PARTY_MAX } from './party.js';
import { MONSTERS } from '../data/monsters.js';
import { COMPANION_SLOTS } from '../data/companions.js';

export const PROTOCOL_VERSION = 1;
const SPARKLE_RESPAWN_MS = 20 * 60 * 1000;
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
    this.data = normalizeData(opts.data || this.storage?.load?.() || {});
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
      this.broadcastToParty(p, { t: 'toast', text: `${s.char.name}の つうしんが とぎれた…\nもどってくるまで オートで たたかうよ` });
      this.sendParty(p);
    }
    this.broadcastPlayers();
    this.markDirty();
    this.saveNow();
  }

  // おなじ キャラクターで つなぎなおした: まえの セッションを そのまま ひきつぐ
  resumeSession(s, t) {
    const oldConn = t.conn;
    if (oldConn && oldConn !== s.conn) {
      // まえの たんまつ（まだ つながっている）は キャラを えらびなおせるように あたらしい セッションへ
      this.send(t, { t: 'kicked', text: 'ほかの たんまつで おなじ キャラクターが ログインしました' });
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
      players: this.playerList(t), resumed: true,
    });
    if (ctx && !ctx.battle.over) {
      const mine = Object.entries(ctx.actorMap).filter(([, v]) => v.type === 'human' && v.sid === t.id).map(([k]) => k);
      this.send(t, { t: 'battleStart', snap: ctx.battle.snapshot(), mine, boss: !!ctx.opts.boss, story: !!ctx.opts.fixed, resume: true });
    }
    const run = t.runId && this.runs.get(t.runId);
    if (run) run.resend(t);
    if (p && p.members.length > 1) {
      for (const sid of p.members) if (sid !== t.id) this.send(this.sessions.get(sid), { t: 'toast', text: `${t.char.name}が もどってきた！` });
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
    this.saveNow();
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
      case 'party': return this.onParty(s, msg);
      case 'chat': return this.onChat(s, msg);
      case 'explored': return this.onExplored(s, msg);
      case 'warpTo': return this.onMenu(s, { t: 'menu', action: 'useItem', id: 'return_wing', place: msg.place });
      case 'joinBattle': {
        const r = joinBattle(this, s, msg.sid);
        if (!r.ok && r.reason) this.send(s, { t: 'toast', text: r.reason });
        return;
      }
    }
  }

  onHello(s, msg) {
    if (!this.offline && !this.checkPassword(String(msg.pw || ''))) {
      this.send(s, { t: 'helloFail', reason: 'あいことばが ちがいます' });
      return;
    }
    s.authed = true;
    this.send(s, {
      t: 'welcome', v: PROTOCOL_VERSION, offline: this.offline, family: this.familyName,
      chars: this.charList(), board: this.data.board || [], serverTime: this.now(),
    });
  }

  charList() {
    const online = new Set([...this.sessions.values()].filter((x) => x.inWorld).map((x) => x.charId));
    return Object.values(this.data.characters)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      .map((c) => ({ id: c.id, name: c.name, job: c.job, level: c.level, look: c.look, equip: c.equip, online: online.has(c.id), objective: c.objective, lastPlayed: c.lastPlayed }));
  }

  onCreateChar(s, msg) {
    const name = String(msg.name || '').replace(/[<>&"'\s]/g, '').slice(0, 8);
    if (!name) return this.send(s, { t: 'error', text: 'なまえを いれてね' });
    if (Object.keys(this.data.characters).length >= 12) return this.send(s, { t: 'error', text: 'キャラクターは 12人まで です' });
    if (Object.values(this.data.characters).some((c) => c.name === name)) return this.send(s, { t: 'error', text: 'おなじ なまえの キャラクターが います' });
    const id = 'c' + this.now().toString(36) + Math.floor(this.rng.next() * 1e6).toString(36);
    const c = newCharacter({ id, name, look: msg.look, job: msg.job });
    c.pos = { map: 'overworld', x: START_POS[0] + 0.5, y: START_POS[1] + 0.5, dir: 'down' };
    c.spawn = { map: 'overworld', x: POS.villageChurch[0] + 0.5, y: POS.villageChurch[1] + 0.5 };
    this.data.characters[id] = c;
    this.markDirty();
    this.saveNow();
    this.send(s, { t: 'charCreated', id });
    this.broadcast({ t: 'chars', chars: this.charList() });
  }

  onDeleteChar(s, msg) {
    const c = this.data.characters[msg.id];
    if (!c) return;
    if ([...this.sessions.values()].some((x) => x.charId === c.id && x.inWorld)) return this.send(s, { t: 'error', text: 'いま あそんでいる キャラクターは けせません' });
    if (msg.confirm !== c.name) return this.send(s, { t: 'error', text: 'なまえが ちがいます' });
    delete this.data.characters[msg.id];
    this.markDirty();
    this.saveNow();
    this.broadcast({ t: 'chars', chars: this.charList() });
  }

  onPlay(s, msg) {
    const c = this.data.characters[msg.id];
    if (!c) return this.send(s, { t: 'error', text: 'キャラクターが みつかりません' });
    // つなぎなおし（スマホの スリープの あと など）: パーティーも たたかいも そのまま つづける
    if (!this.offline) {
      const prev = [...this.sessions.values()].find((o) => o !== s && o.charId === c.id && o.inWorld);
      if (prev) return this.resumeSession(s, prev);
    }
    // ほかの たんまつで つかっていたら そちらを おわらせる
    for (const other of this.sessions.values()) {
      if (other !== s && other.charId === c.id && other.inWorld) {
        this.send(other, { t: 'kicked', text: 'ほかの たんまつで おなじ キャラクターが ログインしました' });
        this.leaveWorld(other);
      }
    }
    if (s.inWorld) this.leaveWorld(s);
    s.charId = c.id;
    s.char = c;
    normalizeChar(c);
    const pos = c.pos && MAPS[c.pos.map] ? c.pos : { map: 'overworld', x: START_POS[0] + 0.5, y: START_POS[1] + 0.5, dir: 'down' };
    s.map = pos.map;
    s.x = pos.x;
    s.y = pos.y;
    s.dir = pos.dir || 'down';
    s.inWorld = true;
    s.busy = null;
    s.level = c.level;
    const p = newParty(this, s.id);
    s.partyId = p.id;
    syncParty(this, p);
    if (c.hp <= 0) c.hp = 1;
    const supportLog = c.supportLog || [];
    c.supportLog = [];
    this.send(s, {
      t: 'enter', sid: s.id, char: c, map: s.map, x: s.x, y: s.y, dir: s.dir, posSeq: s.posSeq,
      party: partyState(this, p), board: this.data.board || [], supportLog, serverTime: this.now(),
      players: this.playerList(s),
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

  // たおした まものが なかまに なりたがっている
  offerBefriend(s, species, level) {
    const m = MONSTERS[species];
    if (!m || s.busy) return;
    const c = s.char;
    ensureCompanions(c);
    const id = 'o' + (++this.offerSeq || (this.offerSeq = 1)) + Math.floor(this.rng.next() * 1e6).toString(36);
    s.befriendOffer = { id, species, level };
    const p = partyOf(this, s);
    const slotsFree = c.partyKeys.length < COMPANION_SLOTS;
    let yes;
    if (slotsFree) {
      yes = [['befriend', id, null]];
    } else {
      const names = c.partyKeys.map((k) => (k.startsWith('fam:') ? this.data.characters[k.slice(4)]?.name : c.companions.find((e) => e.key === k)?.char.name) || '？');
      yes = [
        ['say', null, 'パーティーが いっぱいだ。\nだれかに 酒場で まっていて もらおう。'],
        ['choice', 'だれが 酒場へ もどる？', [...names, `${m.name}が 酒場で まつ`],
          [...c.partyKeys.map((k) => [['befriend', id, k]]), [['befriend', id, '__tavern']]]],
      ];
    }
    runSteps(this, s, [
      ['showMon', species],
      ['sfx', 'sparkle'],
      ['say', null, `なんと ${m.name}が おきあがり\nなかまに なりたそうに こちらを みている！`],
      ['choice', `${m.name}を なかまに してあげますか？`, ['はい', 'いいえ'], [
        yes,
        [['say', null, `${m.name}は さびしそうに さっていった…`], ['befriend', id, false]],
      ]],
      ['showMon', null],
    ]);
    if (p && p.members.length > 1) this.broadcastToParty(p, { t: 'toast', text: `${m.name}が ${c.name}の なかまに なりたそうに している！` });
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
    // あまりに とおくへの いどうは みとめない（ワープ いがい）
    if (Math.hypot(x - s.x, y - s.y) > 6) {
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

  hasFlagFn(s) {
    // 橋や とびらは パーティーの だれかが あけていれば とおれる
    const p = partyOf(this, s);
    const chars = (p?.members || [s.id]).map((sid) => this.sessions.get(sid)?.char).filter(Boolean);
    return (f) => chars.some((c) => c.flags[f]);
  }

  onEnterTile(s, tx, ty) {
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
    // ばしょの きろく（きかんのはね）
    for (const [id, p] of Object.entries(PLACES)) {
      if (s.map === 'overworld' && tx >= p.x && ty >= p.y && tx < p.x + p.w && ty < p.y + p.h && !s.char.visited?.[id]) {
        s.char.visited = s.char.visited || {};
        s.char.visited[id] = true;
      }
    }
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
        if (!condOk(tr.show, (f) => !!s.char.flags[f])) continue;
        if (runScript(this, s, tr.script)) return true;
      }
    }
    return false;
  }

  // サーバーが いちを きめる（テレポート・ワープ）
  placeSession(s, mapId, x, y, dir, notify = true) {
    s.map = mapId;
    s.x = x;
    s.y = y;
    s.dir = dir || s.dir;
    s.posSeq++;
    s.invuln = 1500;
    if (notify) this.send(s, { t: 'setPos', map: mapId, x, y, dir: s.dir, seq: s.posSeq });
    this.markDirty();
  }

  respawn(s) {
    const sp = s.char.spawn && MAPS[s.char.spawn.map] ? s.char.spawn : { map: 'overworld', x: POS.villageChurch[0] + 0.5, y: POS.villageChurch[1] + 0.5 };
    fullHeal(s.char);
    this.placeSession(s, sp.map, sp.x, sp.y, 'down', true);
    this.send(s, { t: 'toast', text: `${s.char.name}は いのりの ばしょで めを さました。\n「むりは いけませんよ」` });
  }

  mapKind(id) { return MAPS[id]?.kind; }

  // ───────────── モンスターに ふれた ─────────────
  onTouch(s, msg) {
    if (s.busy || s.invuln > 0) return;
    const ms = this.mapStates.get(s.map);
    const sym = ms?.symbols.get(msg.id);
    if (!sym || sym.busy || sym.stun > 0) return;
    if (Math.hypot(sym.x - s.x, sym.y - s.y) > 2.5) return;
    const zone = MAPS[s.map].zoneAt(Math.floor(s.x), Math.floor(s.y));
    if (zone.startsWith('safe')) return;
    startFieldBattle(this, s, sym);
  }

  // ───────────── しらべる・はなす ─────────────
  onInteract(s, msg) {
    if (s.busy) return;
    const map = MAPS[s.map];
    const hasFlag = (f) => !!s.char.flags[f];
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
    // たからばこ
    const chest = map.chestAt.get(key);
    if (chest && condOk(chest.show, hasFlag)) return this.openChest(s, chest);
    // きらきら
    const sp = map.sparkles?.find((k) => k.x === tx && k.y === ty);
    if (sp) return this.pickSparkle(s, sp);
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
    if (tile === T.STAR_ALTAR) return runScript(this, s, 'star_stone');
    if (tile === T.ALTAR && s.map === 'overworld' && Math.abs(tx - POS.shrineAltar[0]) <= 1 && Math.abs(ty - POS.shrineAltar[1]) <= 1) {
      return runScript(this, s, 'star_flower');
    }
    if (tile === T.WELL) return runSteps(this, s, [['say', null, 'いどを のぞきこんだ。\nふかくて そこが みえない…']]);
    if (tile === T.FOUNTAIN) return runSteps(this, s, [['say', null, 'きれいな ふんすいだ。\nみずが きらきら ひかっている。']]);
    if (tile === T.STATUE) return runSteps(this, s, [['say', null, 'ゆうしゃの ぞうだ。\n「きずなは ほしのように かがやく」と きざまれている。']]);
  }

  openChest(s, chest) {
    const c = s.char;
    if (c.chests[chest.id]) return runSteps(this, s, [['say', null, 'たからばこは からっぽだ。']]);
    c.chests[chest.id] = true;
    const steps = [['sfx', 'chest'], ['chestOpen', chest.id]];
    if (chest.gold) {
      c.gold += chest.gold;
      steps.push(['say', null, `${c.name}は たからばこを あけた！\n${chest.gold}ゴールドを てにいれた！`]);
    } else {
      const n = chest.n || 1;
      addItem(c, chest.item, n);
      steps.push(['say', null, `${c.name}は たからばこを あけた！\n${ITEMS[chest.item].name}${n > 1 ? `を ${n}こ` : 'を'} てにいれた！`]);
      if (chest.item === 'cave_key') {
        c.objective = 'カギで おくの とびらを あけよう';
        steps.push(['objective', c.objective]);
      }
    }
    this.markDirty();
    runSteps(this, s, steps);
  }

  pickSparkle(s, sp) {
    const c = s.char;
    c.sparkles = c.sparkles || {};
    const last = c.sparkles[sp.id] || 0;
    if (this.now() - last < SPARKLE_RESPAWN_MS) return runSteps(this, s, [['say', null, 'なにも ない。\n（しばらく すると また ひかるかも）']]);
    c.sparkles[sp.id] = this.now();
    const id = sparkleLoot(sp.zone, this.rng.next());
    addItem(c, id, 1);
    this.markDirty();
    runSteps(this, s, [['sfx', 'item'], ['say', null, `${c.name}は ${ITEMS[id].name}を ひろった！`]]);
  }

  searchTile(s, tx, ty, tile) {
    const c = s.char;
    c.searched = c.searched || {};
    const key = `${s.map}:${tx}:${ty}`;
    const names = { [T.POT]: 'つぼ', [T.BARREL]: 'たる', [T.SHELF]: 'たな', [T.BOOKSHELF]: 'ほんだな', [T.CRATE]: 'はこ' };
    const nm = names[tile] || 'それ';
    if (c.searched[key]) return runSteps(this, s, [['say', null, `${nm}を しらべた。\nしかし なにも みつからなかった。`]]);
    c.searched[key] = true;
    const loot = searchLoot(s.map, tx, ty);
    this.markDirty();
    if (!loot) {
      if (tile === T.BOOKSHELF) return runSteps(this, s, [['say', null, 'むずかしそうな ほんが ならんでいる…\n「まほうけんの きほん」「ほしの うた」…']]);
      return runSteps(this, s, [['say', null, `${nm}を しらべた。\nしかし なにも みつからなかった。`]]);
    }
    if (loot.gold) {
      c.gold += loot.gold;
      return runSteps(this, s, [['sfx', 'item'], ['say', null, `${nm}を しらべた。\n${loot.gold}ゴールドを みつけた！`]]);
    }
    addItem(c, loot.item, 1);
    runSteps(this, s, [['sfx', 'item'], ['say', null, `${nm}を しらべた。\n${ITEMS[loot.item].name}を みつけた！`]]);
  }

  // ───────────── メニュー ─────────────
  onMenu(s, msg) {
    menuAction(this, s, msg);
  }

  // ───────────── パーティー ─────────────
  onParty(s, msg) {
    const p = partyOf(this, s);
    switch (msg.action) {
      case 'invite': {
        const t = this.sessions.get(msg.sid);
        if (!t || !t.inWorld || t === s) return;
        if (p.leader !== s.id) return this.send(s, { t: 'toast', text: 'さそえるのは リーダー だけです' });
        if (p.members.length + p.supports.length >= PARTY_MAX && !p.supports.length) return this.send(s, { t: 'toast', text: 'パーティーが いっぱいです' });
        t.invitedBy = { sid: s.id, partyId: p.id, at: this.now() };
        this.send(t, { t: 'invite', from: s.char.name, sid: s.id });
        this.send(s, { t: 'toast', text: `${t.char.name}を パーティーに さそった！` });
        return;
      }
      case 'accept': {
        const inv = s.invitedBy;
        s.invitedBy = null;
        if (!inv) return;
        const target = this.parties.get(inv.partyId);
        const inviter = this.sessions.get(inv.sid);
        if (!target || !inviter) return this.send(s, { t: 'toast', text: 'さそいが きれてしまった…' });
        if (s.busy) return this.send(s, { t: 'toast', text: 'いまは パーティーに はいれません' });
        // じぶんの パーティーを ぬける
        this.leaveParty(s, true);
        if (target.members.length >= PARTY_MAX) return this.send(s, { t: 'toast', text: 'パーティーが いっぱいです' });
        const own = this.parties.get(s.partyId);
        if (own) this.parties.delete(own.id);
        target.members.push(s.id);
        s.partyId = target.id;
        // にんげんが ふえたので はいりきらない なかまは いったん まつ
        syncParty(this, target);
        this.sendParty(target);
        this.broadcastToParty(target, { t: 'toast', text: `${s.char.name}が パーティーに くわわった！` });
        return;
      }
      case 'decline': {
        const inv = s.invitedBy;
        s.invitedBy = null;
        const inviter = inv && this.sessions.get(inv.sid);
        if (inviter) this.send(inviter, { t: 'toast', text: `${s.char.name}は いまは むずかしいようだ…` });
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
        if (r.ok) this.send(s, { t: 'toast', text: `${r.name}は 酒場へ もどった。\n（ルミナの町の 酒場で また つれていけるよ）` });
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
      if (!silent) this.broadcastToParty(p, { t: 'toast', text: `${s.char.name}が パーティーから はなれた。` });
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
    this.playersTimer = setTimeout(() => this.broadcastPlayers(), 50);
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
    for (const ctx of [...this.battles.values()]) battleTick(this, ctx, dt);
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
      if (!byMap.has(s.map)) byMap.set(s.map, []);
      byMap.get(s.map).push(s);
    }
    // モンスター（とぎれている 人は おいかけない）
    for (const [mapId, players] of byMap) {
      const ms = mapState(this, mapId);
      spawnSymbols(this, ms, dt, players);
      moveSymbols(this, ms, dt, players.filter((p) => !p.away));
    }
    // いちを おくる（10かい/びょう）
    this.snapTimer += dt;
    if (this.snapTimer >= 100) {
      this.snapTimer = 0;
      for (const [mapId, players] of byMap) {
        const ms = mapState(this, mapId);
        const syms = symbolSnapshot(ms);
        const ps = players.map((p) => ({
          sid: p.id, name: p.char.name, look: p.char.look, job: p.char.job, eq: equipLook(p.char), x: Math.round(p.x * 100) / 100, y: Math.round(p.y * 100) / 100,
          dir: p.dir, mv: p.moving ? 1 : 0, b: p.busy === 'battle' ? 1 : 0, pid: p.partyId, aw: p.away ? 1 : 0,
          fl: this.followerLooks(p),
        }));
        for (const p of players) this.send(p, { t: 'snap', map: mapId, players: ps.filter((x) => x.sid !== p.id), syms });
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

  saveNow() {
    this.saveTimer = 0;
    if (!this.dirty) return;
    this.dirty = false;
    // ログイン中の いちも きろく
    for (const s of this.sessions.values()) {
      if (s.inWorld && s.char && !s.busy) s.char.pos = { map: s.map, x: s.x, y: s.y, dir: s.dir };
    }
    try {
      this.storage?.save?.(this.data);
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

function normalizeData(d) {
  return {
    version: 1,
    characters: d.characters || {},
    board: d.board || [],
    createdAt: d.createdAt || Date.now(),
  };
}

function normalizeChar(c) {
  c.flags = c.flags || {};
  c.chests = c.chests || {};
  c.items = c.items || [];
  c.keyItems = c.keyItems || [];
  c.kills = c.kills || {};
  c.quests = c.quests || {};
  c.visited = c.visited || { village: true };
  c.seeds = c.seeds || {};
  c.status = c.status || {};
  c.jobs = c.jobs || { [c.job]: { lv: 1, exp: 0 } };
  if (!c.jobs[c.job]) c.jobs[c.job] = { lv: 1, exp: 0 };
  c.battleSettings = c.battleSettings || { speed: 1, wait: false, auto: false };
  ensureCompanions(c);
}
