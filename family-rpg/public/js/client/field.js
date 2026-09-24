// フィールド（あるく・はなす・みる）
import { MAPS, isBlocked, effectiveTile, condOk, tileAt } from '../shared/maps/index.js';
import { T, TILE_INFO } from '../shared/tiles.js';
import { PLACES } from '../shared/maps/overworld.js';
import { TS, tileCanvas, frameOf, prepareMap } from './render/tiles.js';
import { paintHuman, lookToOpts, npcOpts, paintSpecial, CW, CH } from './render/chars.js';
import { monsterCanvas, bigNpcCanvas } from './render/monsters.js';
import { makeCanvas, ctxOf, shade } from './render/pixel.js';
import { chestCanvas as chestCanvas3d } from './render/tex3d.js';
import { el } from './ui/dom.js';

const SPEED = 4.6; // マス/びょう
const DAY_MS = 24 * 60 * 1000;

const spriteCache = new Map();
function charSprite(key, opts, dir, frame) {
  const k = `${key}|${dir}|${frame}`;
  let c = spriteCache.get(k);
  if (!c) {
    c = paintHuman(dir, frame, opts).toCanvas();
    spriteCache.set(k, c);
  }
  return c;
}
function specialSprite(kind, dir, frame) {
  const k = `sp:${kind}|${dir}|${frame}`;
  if (spriteCache.has(k)) return spriteCache.get(k);
  const p = paintSpecial(kind, dir, frame);
  const c = p ? p.toCanvas() : null;
  spriteCache.set(k, c);
  return c;
}
export function playerSprite(look, job, dir, frame) {
  return charSprite(`p:${JSON.stringify(look)}:${job}`, lookToOpts(look, job), dir, frame);
}
export function npcSprite(kind, dir, frame) {
  const o = npcOpts(kind);
  if (o) return charSprite(`n:${kind}`, o, dir, frame);
  return specialSprite(kind, dir, frame);
}

const ROOF = {
  red: ['#b8403a', '#8a2a26', '#d8605a'], blue: ['#3a64b0', '#264a8a', '#5a84d0'], green: ['#3a8a4a', '#276a36', '#5aaa6a'],
  purple: ['#6a4a9a', '#4e3478', '#8a6aba'], white: ['#d8d4e8', '#aaa6c0', '#f4f2ff'], orange: ['#d0782e', '#a45a1e', '#ec9a4e'],
  teal: ['#2a8a8a', '#1e6a6a', '#4aaaaa'], brown: ['#8a5a32', '#6a4222', '#aa7a4e'], pink: ['#d06a9a', '#aa4a7a', '#ec8aba'],
};

export class Field {
  constructor(game) {
    this.game = game;
    this.canvas = document.getElementById('field');
    this.ctx = ctxOf(this.canvas);
    this.labelsEl = document.getElementById('labels');
    this.me = { x: 0, y: 0, dir: 'down', moving: false, trail: [], anim: 0 };
    this.others = new Map();
    this.syms = new Map();
    this.actors = new Map();
    this.npcState = new Map();
    this.labels = new Map();
    this.bubbles = [];
    this.explored = {};
    this.exploredDirty = false;
    this.nightOverride = null;
    this.shakeT = 0;
    this.moveTimer = 0;
    this.lastSent = { x: 0, y: 0 };
    this.touchCooldown = new Map();
    this.hideGuests = false;
    this.scriptHidden = new Set(); // イベント中に けした NPC（マップを かえると もどる）
    this.leaderCrumbs = [];
    this.darkCanvas = makeCanvas(64, 64);
    this.roofCache = new Map();
    this.time = 0;
    this.r3d = null;
    this.view = '2d';
    addEventListener('resize', () => this.resize());
    this.resize();
  }

  // ───────────── 2D / 2.5D ─────────────
  static webgl2() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
    } catch {
      return false;
    }
  }

  savedView() {
    let v = null;
    try { v = localStorage.getItem('kizuna_view'); } catch { /* */ }
    if (v === '2d') return '2d';
    return Field.webgl2() ? '3d' : '2d';
  }

  async setView(mode, save = false) {
    if (save) { try { localStorage.setItem('kizuna_view', mode); } catch { /* */ } }
    const cv = document.getElementById('field3d');
    if (mode === '3d' && Field.webgl2() && cv) {
      if (!this.r3d) {
        try {
          const { Field3D } = await import('./render/field3d.js');
          this.r3d = new Field3D(this, cv);
        } catch (e) {
          console.warn('2.5D に できませんでした', e);
          this.r3d = null;
          mode = '2d';
        }
      }
    } else mode = '2d';
    if (mode === '2d' && this.r3d) {
      this.r3d.dispose();
      this.r3d = null;
    }
    this.view = mode;
    if (cv) cv.hidden = mode !== '3d';
    document.body.classList.toggle('view3d', mode === '3d');
    return mode;
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    const minDim = Math.min(w, h);
    this.scale = Math.max(2, Math.floor(minDim / (16 * 13)));
    if (Math.min(w, h) / this.scale < 16 * 9) this.scale = Math.max(1, this.scale - 1);
    this.vw = Math.ceil(w / this.scale);
    this.vh = Math.ceil(h / this.scale);
    this.canvas.width = this.vw;
    this.canvas.height = this.vh;
    this.ctx = ctxOf(this.canvas);
    this.darkCanvas.width = this.vw;
    this.darkCanvas.height = this.vh;
  }

  // ───────────── マップ ─────────────
  setMap(mapId, x, y, dir) {
    const changed = this.mapId !== mapId;
    this.mapId = mapId;
    this.map = MAPS[mapId];
    prepareMap(this.map);
    this.me.x = x;
    this.me.y = y;
    this.me.dir = dir || this.me.dir;
    this.me.trail = [];
    this.leaderCrumbs = [];
    if (changed) {
      this.scriptHidden.clear();
      this.syms.clear();
      this.others.clear();
      this.npcState.clear();
      this.actors.clear();
      for (const n of this.map.npcs) this.npcState.set(n.id, { x: n.x + 0.5, y: n.y + 0.5, dir: n.dir, t: Math.random() * 2000, hx: n.x + 0.5, hy: n.y + 0.5, moving: false });
      this.loadExplored();
    }
    this.lastArea = null;
    this.snapCamera();
  }

  snapCamera() {
    this.cam = this.targetCam();
  }

  targetCam() {
    const mw = this.map.w * TS, mh = this.map.h * TS;
    let cx = this.me.x * TS - this.vw / 2;
    let cy = (this.me.y - 0.5) * TS - this.vh / 2;
    if (mw > this.vw) cx = Math.max(0, Math.min(mw - this.vw, cx)); else cx = (mw - this.vw) / 2;
    if (mh > this.vh) cy = Math.max(0, Math.min(mh - this.vh, cy)); else cy = (mh - this.vh) / 2;
    return { x: cx, y: cy };
  }

  hasFlag(f) {
    const c = this.game.me;
    return !!c?.flags?.[f];
  }

  gateFlag(f) {
    return this.hasFlag(f) || (this.game.party?.gateFlags || []).includes(f);
  }

  npcVisible(n) {
    if (this.scriptHidden.has(n.id)) return false;
    if (!condOk(n.show, (f) => this.hasFlag(f))) return false;
    if (n.sprite === 'starstone') return !this.hasFlag('p_attack') || this.hasFlag('c1_clear');
    return true;
  }

  // ───────────── あたり判定 ─────────────
  solidAt(tx, ty, forNpc = null) {
    if (isBlocked(this.map, tx, ty, (f) => this.gateFlag(f))) return true;
    const key = ty * this.map.w + tx;
    const ch = this.map.chestAt.get(key);
    if (ch && condOk(ch.show, (f) => this.hasFlag(f))) return true;
    for (const n of this.map.npcs) {
      if (!n.solid || n === forNpc || !this.npcVisible(n)) continue;
      const s = this.npcState.get(n.id);
      if (n.big) {
        if (Math.abs(tx + 0.5 - s.x) < 1.5 && ty <= Math.floor(s.y) && ty >= Math.floor(s.y) - 1) return true;
      } else if (Math.floor(s.x) === tx && Math.floor(s.y) === ty) return true;
    }
    return false;
  }

  boxFree(x, y) {
    const hw = 0.28, top = 0.3, bot = 0.08;
    const pts = [[x - hw, y - top], [x + hw, y - top], [x - hw, y + bot], [x + hw, y + bot]];
    return pts.every(([px, py]) => !this.solidAt(Math.floor(px), Math.floor(py)));
  }

  // ───────────── まいフレーム ─────────────
  update(dt, controls) {
    this.time += dt;
    this.lastDt = dt;
    const sec = dt / 1000;
    const me = this.me;
    // じぶんの いどう
    let { x: ix, y: iy } = controls.dir;
    const canMove = controls.canMove;
    if (!canMove) { ix = 0; iy = 0; }
    // ついていく（リーダーの とおった みちを たどる）
    if (canMove && ix === 0 && iy === 0 && this.game.follow) {
      const d = this.followStep(dt);
      if (d) { ix = d.x; iy = d.y; }
    } else this.followStuck = 0;
    const mag = Math.min(1, Math.hypot(ix, iy));
    me.moving = mag > 0.05;
    if (me.moving) {
      if (Math.abs(ix) > Math.abs(iy)) me.dir = ix > 0 ? 'right' : 'left';
      else me.dir = iy > 0 ? 'down' : 'up';
      const sp = SPEED * sec * (mag > 0.4 ? 1 : 0.6);
      const nx = me.x + (ix / (Math.hypot(ix, iy) || 1)) * sp;
      const ny = me.y + (iy / (Math.hypot(ix, iy) || 1)) * sp;
      let moved = false;
      if (this.boxFree(nx, me.y)) { me.x = nx; moved = true; }
      else if (Math.abs(iy) < 0.3) moved = this.nudge('y', me, ix > 0 ? 1 : -1, sp) || moved;
      if (this.boxFree(me.x, ny)) { me.y = ny; moved = true; }
      else if (Math.abs(ix) < 0.3) moved = this.nudge('x', me, iy > 0 ? 1 : -1, sp) || moved;
      if (moved) this.pushTrail(me);
    }
    // しゃしんきの いち
    const tc = this.targetCam();
    this.cam.x += (tc.x - this.cam.x) * Math.min(1, sec * 10);
    this.cam.y += (tc.y - this.cam.y) * Math.min(1, sec * 10);
    if (Math.abs(tc.x - this.cam.x) > 200 || Math.abs(tc.y - this.cam.y) > 200) this.cam = tc;
    // ほかの プレイヤー
    for (const o of this.others.values()) {
      const k = Math.min(1, sec * 10);
      const dx = o.tx - o.x, dy = o.ty - o.y;
      if (Math.hypot(dx, dy) > 4) { o.x = o.tx; o.y = o.ty; }
      else { o.x += dx * k; o.y += dy * k; }
      if (Math.hypot(dx, dy) > 0.02) this.pushTrail(o);
    }
    for (const s of this.syms.values()) {
      const k = Math.min(1, sec * 9);
      s.x += (s.tx - s.x) * k;
      s.y += (s.ty - s.y) * k;
    }
    this.updateNpcs(dt);
    this.updateActors(dt);
    // サーバーへ いちを おくる
    this.moveTimer -= dt;
    const tileChanged = Math.floor(me.x) !== Math.floor(this.lastSent.x) || Math.floor(me.y) !== Math.floor(this.lastSent.y);
    if ((this.moveTimer <= 0 && (Math.abs(me.x - this.lastSent.x) > 0.01 || Math.abs(me.y - this.lastSent.y) > 0.01 || this.lastSent.moving !== me.moving)) || tileChanged) {
      this.moveTimer = 100;
      this.lastSent = { x: me.x, y: me.y, moving: me.moving };
      this.game.net.send({ t: 'move', x: +me.x.toFixed(3), y: +me.y.toFixed(3), dir: me.dir, moving: me.moving, seq: this.game.posSeq, follow: !!this.game.follow });
    }
    // モンスターに ふれた？・たたかっている なかまの ところに きた？
    if (canMove) {
      this.checkJoin();
      this.checkTouch();
    }
    this.reveal();
    if (this.shakeT > 0) this.shakeT -= dt;
  }

  // かどを すりぬけやすくする
  nudge(axis, me, dirSign, sp) {
    if (axis === 'y') {
      const cy = Math.floor(me.y) + 0.6;
      for (const off of [0.2, 0.35]) {
        for (const s of [1, -1]) {
          const ty = me.y + s * off;
          if (this.boxFree(me.x + dirSign * 0.1, ty) && Math.abs(ty - cy) <= Math.abs(me.y - cy) + 0.36) {
            const step = Math.min(sp, off) * s;
            if (this.boxFree(me.x, me.y + step)) { me.y += step; return true; }
          }
        }
      }
    } else {
      for (const off of [0.2, 0.35]) {
        for (const s of [1, -1]) {
          const tx = me.x + s * off;
          if (this.boxFree(tx, me.y + dirSign * 0.1)) {
            const step = Math.min(sp, off) * s;
            if (this.boxFree(me.x + step, me.y)) { me.x += step; return true; }
          }
        }
      }
    }
    return false;
  }

  pushTrail(o) {
    const last = o.trail[0];
    if (!last || Math.hypot(last.x - o.x, last.y - o.y) >= 0.12) {
      o.trail.unshift({ x: o.x, y: o.y, dir: o.dir || 'down' });
      if (o.trail.length > 60) o.trail.pop();
    }
  }

  leaderPos() {
    const p = this.game.party;
    if (!p || p.leader === this.game.sid) return null;
    const o = this.others.get(p.leader);
    return o || null;
  }

  // リーダーの とおった ばしょ（パンくず）を たどって あるく。つまったら みちを さがす
  followStep(dt) {
    const leader = this.leaderPos();
    const tr = this.leaderCrumbs;
    const me = this.me;
    if (!leader) { tr.length = 0; return null; }
    // リーダーが たたかっていても そばへ いく（ちかづけば とちゅうから さんか）
    const dl = Math.hypot(leader.x - me.x, leader.y - me.y);
    if (dl < 1.4) { tr.length = 0; this.followStuck = 0; return null; }
    if (dl > 45) return null;
    // もう とおりすぎた パンくずは すてる
    let k = -1;
    for (let i = tr.length - 1; i >= 0; i--) if (Math.hypot(tr[i].x - me.x, tr[i].y - me.y) < 0.55) { k = i; break; }
    if (k >= 0) tr.splice(0, k + 1);
    // つまっている？
    const moved = this.followLast ? Math.hypot(me.x - this.followLast.x, me.y - this.followLast.y) : 1;
    this.followLast = { x: me.x, y: me.y };
    this.followStuck = moved < 0.01 ? (this.followStuck || 0) + dt : 0;
    if (this.followStuck > 450) {
      this.followStuck = 0;
      const path = this.findPath(Math.floor(me.x), Math.floor(me.y), Math.floor(leader.x), Math.floor(leader.y));
      if (path) tr.splice(0, tr.length, ...path.slice(1).map(([x, y]) => ({ x: x + 0.5, y: y + 0.5 })));
    }
    const t = tr[0] || leader;
    const dx = t.x - me.x, dy = t.y - me.y;
    const d = Math.hypot(dx, dy) || 1;
    return { x: dx / d, y: dy / d };
  }

  // タイルの みちさがし（ちかい ところ だけ）
  findPath(sx, sy, tx, ty, limit = 2500) {
    const w = this.map.w;
    const key = (x, y) => y * w + x;
    const prev = new Map([[key(sx, sy), null]]);
    const q = [[sx, sy]];
    let head = 0;
    while (head < q.length && prev.size < limit) {
      const [x, y] = q[head++];
      if (x === tx && y === ty) {
        const out = [];
        let c = [x, y];
        while (c) { out.unshift(c); c = prev.get(key(c[0], c[1])); }
        return out;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= this.map.h) continue;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        if (!(nx === tx && ny === ty) && this.solidAt(nx, ny)) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    return null;
  }

  // たたかっている なかまに ちかづいたら さんかする
  checkJoin() {
    const myParty = this.game.party?.id;
    if (!myParty) return;
    const now = performance.now();
    if (now < (this.joinCooldown || 0)) return;
    for (const o of this.others.values()) {
      if (!o.battle || o.partyId !== myParty) continue;
      if (Math.hypot(o.x - this.me.x, o.y - this.me.y) < 2.0) {
        this.joinCooldown = now + 1500;
        this.game.net.send({ t: 'joinBattle', sid: o.sid });
        return;
      }
    }
  }

  checkTouch() {
    const me = this.me;
    if (this.game.invulnUntil > performance.now()) return;
    for (const s of this.syms.values()) {
      if (Math.hypot(s.x - me.x, s.y - 0.1 - me.y) < 0.75) {
        const last = this.touchCooldown.get(s.id) || 0;
        if (performance.now() - last < 800) continue;
        this.touchCooldown.set(s.id, performance.now());
        this.game.net.send({ t: 'touch', id: s.id });
      }
    }
  }

  updateNpcs(dt) {
    for (const n of this.map.npcs) {
      const s = this.npcState.get(n.id);
      if (!s) continue;
      s.anim = (s.anim || 0) + dt;
      if (!n.wander || this.game.busy || s.talking) continue;
      s.t -= dt;
      if (s.t <= 0) {
        s.t = 1200 + Math.random() * 2600;
        if (Math.random() < 0.45) { s.moving = false; continue; }
        const dirs = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
        const [d, dx, dy] = dirs[Math.floor(Math.random() * 4)];
        const tx = Math.floor(s.x) + dx, ty = Math.floor(s.y) + dy;
        if (Math.abs(tx + 0.5 - s.hx) > n.wander || Math.abs(ty + 0.5 - s.hy) > n.wander) { s.moving = false; continue; }
        const meT = [Math.floor(this.me.x), Math.floor(this.me.y)];
        if (isBlocked(this.map, tx, ty, () => true) || (meT[0] === tx && meT[1] === ty) || this.map.chestAt.has(ty * this.map.w + tx)) { s.moving = false; continue; }
        s.dir = d;
        s.goal = { x: tx + 0.5, y: ty + 0.5 };
        s.moving = true;
      }
      if (s.moving && s.goal) {
        const sp = 1.6 * dt / 1000;
        const dx = s.goal.x - s.x, dy = s.goal.y - s.y;
        const d = Math.hypot(dx, dy);
        if (d < sp) { s.x = s.goal.x; s.y = s.goal.y; s.moving = false; s.goal = null; }
        else { s.x += dx / d * sp; s.y += dy / d * sp; }
      }
    }
  }

  // ───────────── えんしゅつの ひとたち ─────────────
  spawnActor(id, o) {
    this.actors.set(id, { id, sprite: o.sprite, x: o.x, y: o.y, dir: o.dir || 'down', path: [], moving: false });
  }
  removeActor(id) { this.actors.delete(id); }
  faceActor(id, dir) {
    const a = this.actors.get(id);
    if (a) a.dir = dir;
    else if (id === 'me') this.me.dir = dir;
  }
  moveActor(id, path) {
    const a = this.actors.get(id);
    if (!a) return Promise.resolve();
    return new Promise((resolve) => {
      a.path = path.map(([x, y]) => ({ x, y }));
      a.onDone = resolve;
      a.moving = true;
    });
  }
  updateActors(dt) {
    for (const a of this.actors.values()) {
      if (!a.moving) continue;
      const g = a.path[0];
      if (!g) {
        a.moving = false;
        a.onDone?.();
        continue;
      }
      const sp = 3.2 * dt / 1000;
      const dx = g.x - a.x, dy = g.y - a.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) a.dir = dx > 0 ? 'right' : 'left'; else if (Math.abs(dy) > 0.01) a.dir = dy > 0 ? 'down' : 'up';
      if (d <= sp) { a.x = g.x; a.y = g.y; a.path.shift(); }
      else { a.x += dx / d * sp; a.y += dy / d * sp; }
    }
  }

  // ───────────── サーバーからの じょうほう ─────────────
  onSnap(msg) {
    if (msg.map !== this.mapId) return;
    const seen = new Set();
    for (const p of msg.players) {
      seen.add(p.sid);
      let o = this.others.get(p.sid);
      if (!o) {
        o = { sid: p.sid, x: p.x, y: p.y, trail: [] };
        this.others.set(p.sid, o);
      }
      Object.assign(o, { name: p.name, look: p.look, job: p.job, tx: p.x, ty: p.y, dir: p.dir, moving: !!p.mv, battle: !!p.b, away: !!p.aw, partyId: p.pid, fl: p.fl || [] });
      // リーダーの とおった みちを おぼえる（ついていく ため）
      if (this.game.follow && p.sid === this.game.party?.leader) {
        const tr = this.leaderCrumbs;
        const last = tr[tr.length - 1];
        if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 0.5) {
          tr.push({ x: p.x, y: p.y });
          if (tr.length > 240) tr.shift();
        }
      }
    }
    for (const sid of [...this.others.keys()]) if (!seen.has(sid)) this.others.delete(sid);
    const seenS = new Set();
    for (const s of msg.syms) {
      seenS.add(s.id);
      let o = this.syms.get(s.id);
      if (!o) {
        o = { id: s.id, x: s.x, y: s.y };
        this.syms.set(s.id, o);
      }
      Object.assign(o, { sp: s.sp, tx: s.x, ty: s.y, dir: s.dir, st: s.st });
    }
    for (const id of [...this.syms.keys()]) if (!seenS.has(id)) this.syms.delete(id);
  }

  // ───────────── しらべる ─────────────
  interact() {
    const me = this.me;
    const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[me.dir];
    const fx = me.x + d[0] * 0.75, fy = me.y - 0.12 + d[1] * 0.75;
    const tx = Math.floor(fx), ty = Math.floor(fy);
    // ひと
    const npc = this.npcNear(fx, fy) || (TILE_INFO[tileAt(this.map, tx, ty)]?.talkThrough ? this.npcNear(fx + d[0], fy + d[1]) : null);
    if (npc) {
      const s = this.npcState.get(npc.id);
      if (s && !npc.big && npc.sprite !== 'none' && npc.sprite !== 'flower' && npc.sprite !== 'starstone' && npc.sprite !== 'spring') {
        s.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[me.dir];
        s.moving = false;
        s.goal = null;
      }
      this.game.net.send({ t: 'interact', kind: 'npc', id: npc.id });
      return true;
    }
    this.game.net.send({ t: 'interact', kind: 'tile', x: tx, y: ty });
    return true;
  }

  npcNear(x, y) {
    let best = null, bd = 0.85;
    for (const n of this.map.npcs) {
      if (!this.npcVisible(n)) continue;
      const s = this.npcState.get(n.id);
      const r = n.big ? 1.9 : 0.85;
      const d = Math.hypot(s.x - x, s.y - 0.2 - y);
      if (d < r && d < (n.big ? 1.9 : bd)) {
        best = n;
        bd = d;
      }
    }
    return best;
  }

  // ───────────── きりの マップ（たんさく） ─────────────
  loadExplored() {
    const m = this.map;
    const n = Math.ceil((m.w * m.h) / 8);
    let bits = new Uint8Array(n);
    const saved = this.game.me?.explored?.[m.id];
    if (saved) {
      try {
        const bin = atob(saved);
        for (let i = 0; i < Math.min(n, bin.length); i++) bits[i] = bin.charCodeAt(i);
      } catch { /* */ }
    }
    this.explored[m.id] = bits;
  }

  reveal() {
    const bits = this.explored[this.mapId];
    if (!bits) return;
    const m = this.map;
    const cx = Math.floor(this.me.x), cy = Math.floor(this.me.y);
    if (this.lastReveal && this.lastReveal[0] === cx && this.lastReveal[1] === cy && this.lastReveal[2] === this.mapId) return;
    this.lastReveal = [cx, cy, this.mapId];
    const R = m.kind === 'dungeon' ? 5 : 8;
    for (let y = cy - R; y <= cy + R; y++) {
      for (let x = cx - R; x <= cx + R; x++) {
        if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) continue;
        const i = y * m.w + x;
        if (!(bits[i >> 3] & (1 << (i & 7)))) {
          bits[i >> 3] |= 1 << (i & 7);
          this.exploredDirty = true;
        }
      }
    }
  }

  isExplored(x, y) {
    const bits = this.explored[this.mapId];
    if (!bits) return true;
    const i = y * this.map.w + x;
    return !!(bits[i >> 3] & (1 << (i & 7)));
  }

  exploredB64() {
    const bits = this.explored[this.mapId];
    let s = '';
    for (let i = 0; i < bits.length; i++) s += String.fromCharCode(bits[i]);
    return btoa(s);
  }

  // ───────────── よる ─────────────
  nightAlpha() {
    if (this.nightOverride !== null) return this.nightOverride ? 0.5 : 0;
    if (this.map.kind !== 'field') return 0;
    const t = ((Date.now() + (this.game.timeOffset || 0)) % DAY_MS) / DAY_MS;
    // 0.0〜0.6 ひる、0.6〜0.7 ゆうがた、0.7〜0.95 よる、0.95〜1.0 あさ
    if (t < 0.6) return 0;
    if (t < 0.7) return (t - 0.6) / 0.1 * 0.42;
    if (t < 0.95) return 0.42;
    return (1 - t) / 0.05 * 0.42;
  }

  // ───────────── かく ─────────────
  render() {
    if (this.r3d && this.map) return this.render3d();
    const ctx = this.ctx;
    const m = this.map;
    if (!m) return;
    const t = this.time;
    let camX = Math.round(this.cam.x), camY = Math.round(this.cam.y);
    if (this.shakeT > 0) {
      camX += Math.round((Math.random() - 0.5) * 6);
      camY += Math.round((Math.random() - 0.5) * 6);
    }
    ctx.fillStyle = m.kind === 'dungeon' ? '#0a0806' : '#1c3d6e';
    ctx.fillRect(0, 0, this.vw, this.vh);
    const r = prepareMap(m);
    const x0 = Math.max(0, Math.floor(camX / TS)), y0 = Math.max(0, Math.floor(camY / TS));
    const x1 = Math.min(m.w - 1, Math.floor((camX + this.vw) / TS)), y1 = Math.min(m.h - 1, Math.floor((camY + this.vh) / TS));
    const gate = (f) => this.gateFlag(f);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const i = y * m.w + x;
        const id = m.gates.length ? effectiveTile(m, x, y, gate) : m.tiles[i];
        const c = tileCanvas(id, r.variant[i], frameOf(id, t), r.mask[i]);
        ctx.drawImage(c, x * TS - camX, y * TS - camY);
      }
    }
    // きらきら
    if (m.sparkles) {
      const now = Date.now();
      for (const sp of m.sparkles) {
        if (sp.x < x0 - 1 || sp.x > x1 + 1 || sp.y < y0 - 1 || sp.y > y1 + 1) continue;
        const last = this.game.me?.sparkles?.[sp.id] || 0;
        if (now - last < 20 * 60 * 1000) continue;
        const ph = Math.floor(t / 180 + sp.x) % 6;
        if (ph > 3) continue;
        const px = sp.x * TS + 8 - camX, py = sp.y * TS + 8 - camY;
        ctx.fillStyle = ph % 2 ? '#ffffff' : '#fff6b0';
        ctx.fillRect(px - 1, py - 3 + (ph === 2 ? 1 : 0), 2, 6);
        ctx.fillRect(px - 3, py - 1, 6, 2);
      }
    }
    // ものを y の じゅんに ならべて かく
    const objs = [];
    const hasF = (f) => this.hasFlag(f);
    for (const ch of m.chests) {
      if (!condOk(ch.show, hasF)) continue;
      objs.push({ y: ch.y + 0.95, draw: () => this.drawChest(ch, camX, camY) });
    }
    for (const n of m.npcs) {
      if (!this.npcVisible(n) || n.sprite === 'none') continue;
      const s = this.npcState.get(n.id);
      objs.push({ y: s.y, draw: () => this.drawNpc(n, s, camX, camY) });
    }
    for (const s of this.syms.values()) {
      objs.push({ y: s.y, draw: () => this.drawSym(s, camX, camY) });
    }
    for (const o of this.others.values()) {
      objs.push({ y: o.y, draw: () => this.drawPlayer(o, camX, camY, o.look, o.job) });
      o.fl.forEach((f, i) => {
        if (this.hideGuests && f.guest) return;
        const tp = this.trailPos(o, i + 1);
        if (tp) objs.push({ y: tp.y, draw: () => this.drawAt(playerSprite(f.look, f.job, tp.dir, this.walkFrame(o.moving)), tp.x, tp.y, camX, camY) });
      });
    }
    // じぶんの なかま（サポート・ゲスト）
    const fl = this.myFollowers();
    fl.forEach((f, i) => {
      const tp = this.trailPos(this.me, i + 1);
      if (tp) objs.push({ y: tp.y, draw: () => this.drawAt(playerSprite(f.look, f.job, tp.dir, this.walkFrame(this.me.moving)), tp.x, tp.y, camX, camY) });
    });
    for (const a of this.actors.values()) {
      objs.push({ y: a.y, draw: () => this.drawAt(npcSprite(a.sprite, a.dir, this.walkFrame(true)), a.x, a.y, camX, camY) });
    }
    if (!this.hideMe) objs.push({ y: this.me.y, draw: () => this.drawPlayer(this.me, camX, camY, this.game.me.look, this.game.me.job, true) });
    objs.sort((a, b) => a.y - b.y);
    for (const o of objs) o.draw();
    // やね
    for (const roof of m.roofs || []) this.drawRoof(roof, camX, camY);
    // くらやみ・よる
    if (m.dark) this.drawDark(camX, camY, x0, y0, x1, y1);
    const na = this.nightAlpha();
    if (na > 0) {
      ctx.fillStyle = `rgba(12, 18, 60, ${na})`;
      ctx.fillRect(0, 0, this.vw, this.vh);
      // あかりの まわりは すこし あかるく
      ctx.globalCompositeOperation = 'lighter';
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const id = m.tiles[y * m.w + x];
        if (id === T.LAMP || id === T.FIREPLACE || id === T.STAR_ALTAR) {
          const g = ctx.createRadialGradient(x * TS + 8 - camX, y * TS + 6 - camY, 1, x * TS + 8 - camX, y * TS + 6 - camY, 40);
          g.addColorStop(0, `rgba(255, 200, 110, ${na * 0.55})`);
          g.addColorStop(1, 'rgba(255, 200, 110, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(x * TS - 40 - camX, y * TS - 40 - camY, 96, 96);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    this.renderLabels(camX, camY);
  }

  // ───────────── 2.5D で かく ─────────────
  render3d() {
    const m = this.map;
    this.r3d.render(this.lastDt || 16);
    // うえに かさねる 2D（くらやみ・よる・きらきら・しるし）
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.vw, this.vh);
    const s = innerWidth / this.vw;
    const P = (x, y, up = 0) => {
      const p = this.r3d.project(x, y, up);
      return { x: p.x / s, y: p.y / s, k: this.r3d.tilePx(x, y) / s };
    };
    const t = this.time;
    // きらきら
    if (m.sparkles) {
      const now = Date.now();
      for (const sp of m.sparkles) {
        if (Math.abs(sp.x - this.me.x) > 24 || Math.abs(sp.y - this.me.y) > 24) continue;
        const last = this.game.me?.sparkles?.[sp.id] || 0;
        if (now - last < 20 * 60 * 1000) continue;
        const ph = Math.floor(t / 180 + sp.x) % 6;
        if (ph > 3) continue;
        const p = P(sp.x + 0.5, sp.y + 0.5, 0.25);
        const k = Math.max(1, Math.round(p.k / 16));
        ctx.fillStyle = ph % 2 ? '#ffffff' : '#fff6b0';
        ctx.fillRect(p.x - k, p.y - 3 * k + (ph === 2 ? k : 0), 2 * k, 6 * k);
        ctx.fillRect(p.x - 3 * k, p.y - k, 6 * k, 2 * k);
      }
    }
    // なかまの しるし（たたかいちゅう・つうしんまち）
    const myParty = this.game.party?.id;
    for (const o of this.others.values()) {
      if (o.battle && o.partyId === myParty) {
        const p = P(o.x, o.y);
        const r = (0.8 + Math.sin(t / 160) * 0.12) * p.k;
        ctx.strokeStyle = 'rgba(255, 214, 107, 0.9)';
        ctx.lineWidth = Math.max(1, p.k / 16);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (o.battle || o.away) {
        const p = P(o.x, o.y, 1.55);
        const k = Math.max(1, Math.round(p.k / 16));
        if (o.battle) {
          ctx.fillStyle = '#1b1330';
          ctx.fillRect(p.x - 5 * k, p.y - 5 * k, 11 * k, 11 * k);
          ctx.fillStyle = '#ffd66b';
          for (let i = -3; i <= 3; i++) {
            ctx.fillRect(p.x + i * k, p.y + i * k, k, k);
            ctx.fillRect(p.x - i * k, p.y + i * k, k, k);
          }
        } else {
          const bob = (Math.floor(t / 500) % 2) * k;
          ctx.fillStyle = '#c9d4ff';
          ctx.fillRect(p.x, p.y - bob, 4 * k, k);
          ctx.fillRect(p.x + 2 * k, p.y + k - bob, k, k);
          ctx.fillRect(p.x + k, p.y + 2 * k - bob, k, k);
          ctx.fillRect(p.x, p.y + 3 * k - bob, 4 * k, k);
        }
      }
    }
    // くらやみ（どうくつ）
    if (m.dark) {
      const d = this.darkCanvas;
      const x = ctxOf(d);
      x.globalCompositeOperation = 'source-over';
      x.clearRect(0, 0, d.width, d.height);
      x.fillStyle = 'rgba(4, 2, 10, 0.86)';
      x.fillRect(0, 0, d.width, d.height);
      x.globalCompositeOperation = 'destination-out';
      const light = (p, r, a = 1) => {
        const g = x.createRadialGradient(p.x, p.y, r * 0.25, p.x, p.y, r);
        g.addColorStop(0, `rgba(0,0,0,${a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(p.x - r, p.y - r, r * 2, r * 2);
      };
      const flick = 1 + Math.sin(t / 90) * 0.03;
      const pm = P(this.me.x, this.me.y, 0.5);
      light(pm, 5 * pm.k * flick);
      for (const o of this.others.values()) { const p = P(o.x, o.y, 0.5); light(p, 3.8 * p.k); }
      for (const a of this.actors.values()) { const p = P(a.x, a.y, 0.5); light(p, 3.2 * p.k, 0.8); }
      const x0 = Math.max(0, Math.floor(this.me.x - 16)), x1 = Math.min(m.w - 1, Math.floor(this.me.x + 16));
      const y0 = Math.max(0, Math.floor(this.me.y - 14)), y1 = Math.min(m.h - 1, Math.floor(this.me.y + 18));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const id = tileAt(m, xx, yy);
        if (id === T.TORCH) { const p = P(xx + 0.5, yy + 1.05, 0.9); light(p, 2.8 * p.k * flick, 0.9); }
        else if (id === T.CRYSTAL) { const p = P(xx + 0.5, yy + 0.8, 0.5); light(p, 2 * p.k, 0.7); }
      }
      x.globalCompositeOperation = 'source-over';
      ctx.drawImage(d, 0, 0);
    }
    // よる
    const na = this.nightAlpha();
    if (na > 0) {
      ctx.fillStyle = `rgba(12, 18, 60, ${na})`;
      ctx.fillRect(0, 0, this.vw, this.vh);
      ctx.globalCompositeOperation = 'lighter';
      const x0 = Math.max(0, Math.floor(this.me.x - 18)), x1 = Math.min(m.w - 1, Math.floor(this.me.x + 18));
      const y0 = Math.max(0, Math.floor(this.me.y - 14)), y1 = Math.min(m.h - 1, Math.floor(this.me.y + 20));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const id = m.tiles[yy * m.w + xx];
        if (id === T.LAMP || id === T.FIREPLACE || id === T.STAR_ALTAR) {
          const p = P(xx + 0.5, yy + 0.7, 1);
          const r = 2.6 * p.k;
          const g = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, r);
          g.addColorStop(0, `rgba(255, 200, 110, ${na * 0.55})`);
          g.addColorStop(1, 'rgba(255, 200, 110, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    this.renderLabels(0, 0);
  }

  // 2.5D で たてて かく もの の いちらん
  entities3d() {
    const out = [];
    const m = this.map;
    const hasF = (f) => this.hasFlag(f);
    for (const ch of m.chests) {
      if (!condOk(ch.show, hasF)) continue;
      out.push({ key: 'c:' + ch.id, canvas: chestCanvas3d(!!this.game.me?.chests?.[ch.id]), x: ch.x + 0.5, y: ch.y + 0.8, anchor: 1, shadowScale: 1.3 });
    }
    for (const n of m.npcs) {
      if (!this.npcVisible(n) || n.sprite === 'none') continue;
      const s = this.npcState.get(n.id);
      if (n.big) {
        const c = bigNpcCanvas(n.sprite, Math.floor(this.time / 600) % 2);
        const k = n.sprite === 'goldoon_sleep' ? 0.6 : 0.5;
        out.push({ key: 'n:' + n.id, canvas: c, x: s.x, y: s.y, scale: k, anchor: 6 / k, shadowScale: 3 });
        continue;
      }
      const frame = n.wander ? this.walkFrame(s.moving) : Math.floor(this.time / 500) % 2;
      out.push({ key: 'n:' + n.id, canvas: npcSprite(n.sprite, s.dir, frame), x: s.x, y: s.y, shadow: n.sprite !== 'starstone' });
    }
    for (const s of this.syms.values()) {
      const c = monsterCanvas(s.sp, Math.floor(this.time / 300 + (s.id.length % 2)) % 2, true);
      const fly = s.sp === 'koumorin' || s.sp === 'dark_bat' || s.sp === 'crow';
      out.push({ key: 's:' + s.id, canvas: c, x: s.x, y: s.y, flip: s.dir === 'right', anchor: 2, lift: fly ? 0.35 + Math.sin(this.time / 200) * 0.12 : 0 });
    }
    for (const o of this.others.values()) {
      const mate = o.partyId === this.game.party?.id;
      out.push({ key: 'p:' + o.sid, canvas: playerSprite(o.look, o.job, o.dir || 'down', this.walkFrame(o.moving)), x: o.x, y: o.y, alpha: o.away ? 0.45 : 1, ghost: mate ? '#ffd66b' : null });
      o.fl.forEach((f, i) => {
        if (this.hideGuests && f.guest) return;
        const tp = this.trailPos(o, i + 1);
        if (tp) out.push({ key: `pf:${o.sid}:${i}`, canvas: playerSprite(f.look, f.job, tp.dir, this.walkFrame(o.moving)), x: tp.x, y: tp.y });
      });
    }
    this.myFollowers().forEach((f, i) => {
      const tp = this.trailPos(this.me, i + 1);
      if (tp) out.push({ key: 'mf:' + i, canvas: playerSprite(f.look, f.job, tp.dir, this.walkFrame(this.me.moving)), x: tp.x, y: tp.y });
    });
    for (const a of this.actors.values()) {
      out.push({ key: 'a:' + a.id, canvas: npcSprite(a.sprite, a.dir, this.walkFrame(true)), x: a.x, y: a.y });
    }
    if (!this.hideMe && this.game.me) out.push({ key: 'me', canvas: playerSprite(this.game.me.look, this.game.me.job, this.me.dir || 'down', this.walkFrame(this.me.moving)), x: this.me.x, y: this.me.y, ghost: '#9fd6ff' });
    return out;
  }

  walkFrame(moving) {
    return Math.floor(this.time / (moving ? 170 : 420)) % 2;
  }

  trailPos(o, n) {
    const want = n * 0.95;
    let acc = 0;
    let prev = { x: o.x, y: o.y, dir: o.dir };
    for (const p of o.trail) {
      acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      if (acc >= want) return p;
      prev = p;
    }
    return o.trail.length ? o.trail[o.trail.length - 1] : { x: o.x, y: o.y, dir: o.dir };
  }

  myFollowers() {
    const p = this.game.party;
    if (!p || p.leader !== this.game.sid) return [];
    const out = [];
    for (const s of p.supports || []) out.push({ look: s.look, job: s.job });
    if (!this.hideGuests) for (const g of p.guests || []) out.push({ look: g.look, job: g.job, guest: true });
    return out;
  }

  drawAt(c, x, y, camX, camY) {
    if (!c) return;
    const px = Math.round(x * TS - c.width / 2 - camX);
    const py = Math.round(y * TS - c.height + 3 - camY);
    // かげ
    this.ctx.fillStyle = 'rgba(0,0,0,0.22)';
    this.ctx.fillRect(px + 4, py + c.height - 3, c.width - 8, 2);
    this.ctx.drawImage(c, px, py);
  }

  drawPlayer(o, camX, camY, look, job, mine = false) {
    if (!look) return;
    const c = playerSprite(look, job, o.dir || 'down', this.walkFrame(o.moving));
    const ctx = this.ctx;
    const myParty = this.game.party?.id;
    // なかまが たたかっている: あしもとに ひかる わ（ちかづくと さんか できる）
    if (o.battle && !mine && o.partyId === myParty) {
      const px = o.x * TS - camX, py = o.y * TS - camY;
      const r = 13 + Math.sin(this.time / 160) * 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 214, 107, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(Math.round(px), Math.round(py - 1), r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (o.away) ctx.globalAlpha = 0.45;
    this.drawAt(c, o.x, o.y, camX, camY);
    ctx.globalAlpha = 1;
    if (o.battle) {
      // ⚔ の しるし
      const px = Math.round(o.x * TS - camX), py = Math.round(o.y * TS - 27 - camY);
      ctx.fillStyle = '#1b1330';
      ctx.fillRect(px - 5, py - 5, 11, 11);
      ctx.fillStyle = '#ffd66b';
      for (let i = -3; i <= 3; i++) {
        ctx.fillRect(px + i, py + i, 1, 1);
        ctx.fillRect(px - i, py + i, 1, 1);
      }
      ctx.fillStyle = '#d9534f';
      ctx.fillRect(px - 4, py + 2, 2, 2);
      ctx.fillRect(px + 3, py + 2, 2, 2);
    } else if (o.away) {
      const px = Math.round(o.x * TS - camX), py = Math.round(o.y * TS - 26 - camY);
      const bob = Math.floor(this.time / 500) % 2;
      ctx.fillStyle = '#c9d4ff';
      ctx.fillRect(px + 2, py - bob, 4, 1);
      ctx.fillRect(px + 4, py + 1 - bob, 1, 1);
      ctx.fillRect(px + 3, py + 2 - bob, 1, 1);
      ctx.fillRect(px + 2, py + 3 - bob, 4, 1);
    }
  }

  drawNpc(n, s, camX, camY) {
    if (n.big) {
      const c = bigNpcCanvas(n.sprite, Math.floor(this.time / 600) % 2);
      if (!c) return;
      const k = n.sprite === 'goldoon_sleep' ? 0.6 : 0.5;
      const w = Math.round(c.width * k), h = Math.round(c.height * k);
      this.ctx.drawImage(c, Math.round(s.x * TS - w / 2 - camX), Math.round(s.y * TS - h + 6 - camY), w, h);
      return;
    }
    const frame = n.wander ? this.walkFrame(s.moving) : Math.floor(this.time / 500) % 2;
    this.drawAt(npcSprite(n.sprite, s.dir, frame), s.x, s.y, camX, camY);
  }

  drawSym(s, camX, camY) {
    const c = monsterCanvas(s.sp, Math.floor(this.time / 300 + (s.id.length % 2)) % 2, true);
    const bob = s.sp === 'koumorin' || s.sp === 'dark_bat' || s.sp === 'crow' ? Math.round(Math.sin(this.time / 200) * 2) - 4 : 0;
    const px = Math.round(s.x * TS - c.width / 2 - camX);
    const py = Math.round(s.y * TS - c.height + 2 - camY + bob);
    this.ctx.fillStyle = 'rgba(0,0,0,0.25)';
    this.ctx.fillRect(px + 3, Math.round(s.y * TS - camY), c.width - 6, 2);
    if (s.dir === 'right') {
      this.ctx.save();
      this.ctx.translate(px + c.width, py);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(c, 0, 0);
      this.ctx.restore();
    } else this.ctx.drawImage(c, px, py);
    if (s.st) {
      this.ctx.fillStyle = '#ff5a5a';
      this.ctx.fillRect(px + c.width / 2 - 1, py - 6, 2, 3);
      this.ctx.fillRect(px + c.width / 2 - 1, py - 2, 2, 1);
    }
  }

  drawChest(ch, camX, camY) {
    const opened = !!this.game.me?.chests?.[ch.id];
    const x = ch.x * TS - camX, y = ch.y * TS - camY;
    const c = this.ctx;
    c.fillStyle = '#1b1330';
    c.fillRect(x + 1, y + 4, 14, 11);
    c.fillStyle = opened ? '#6a4220' : '#b8773a';
    c.fillRect(x + 2, y + 5, 12, 9);
    c.fillStyle = opened ? '#3a2410' : '#d8995a';
    c.fillRect(x + 2, y + 5, 12, opened ? 2 : 3);
    c.fillStyle = '#f2c14e';
    c.fillRect(x + 2, y + 8, 12, 1);
    c.fillRect(x + 7, y + 7, 2, 3);
  }

  drawRoof(roof, camX, camY) {
    const me = this.me;
    const inside = me.x >= roof.x + 1 && me.x < roof.x + roof.w - 1 && me.y >= roof.y + 1 && me.y < roof.y + roof.h;
    if (inside) return;
    const key = `${roof.x},${roof.y}`;
    let c = this.roofCache.get(key);
    if (!c) {
      const [base, dark, light] = ROOF[roof.color] || ROOF.red;
      const w = roof.w * TS, h = (roof.h - 1) * TS + 6;
      c = makeCanvas(w, h);
      const x = ctxOf(c);
      x.fillStyle = dark;
      x.fillRect(0, 0, w, h);
      x.fillStyle = base;
      x.fillRect(1, 1, w - 2, h - 3);
      for (let yy = 4; yy < h - 3; yy += 5) {
        x.fillStyle = dark;
        x.fillRect(1, yy, w - 2, 1);
        for (let xx = (yy / 5) % 2 ? 3 : 8; xx < w - 2; xx += 10) x.fillRect(xx, yy - 4, 1, 4);
      }
      x.fillStyle = light;
      x.fillRect(1, 1, w - 2, 2);
      x.fillRect(2, Math.floor(h / 2) - 1, w - 4, 2);
      x.fillStyle = '#1b1330';
      x.fillRect(0, h - 2, w, 2);
      this.roofCache.set(key, c);
    }
    this.ctx.drawImage(c, roof.x * TS - camX, roof.y * TS - camY - 4);
  }

  drawDark(camX, camY, x0, y0, x1, y1) {
    const d = this.darkCanvas;
    const x = ctxOf(d);
    x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(4, 2, 10, 0.88)';
    x.clearRect(0, 0, d.width, d.height);
    x.fillRect(0, 0, d.width, d.height);
    x.globalCompositeOperation = 'destination-out';
    const light = (lx, ly, r, a = 1) => {
      const g = x.createRadialGradient(lx, ly, r * 0.25, lx, ly, r);
      g.addColorStop(0, `rgba(0,0,0,${a})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.fillRect(lx - r, ly - r, r * 2, r * 2);
    };
    const flick = 1 + Math.sin(this.time / 90) * 0.03;
    light(this.me.x * TS - camX, (this.me.y - 0.5) * TS - camY, 78 * flick);
    for (const o of this.others.values()) light(o.x * TS - camX, (o.y - 0.5) * TS - camY, 60);
    const m = this.map;
    for (let yy = y0 - 3; yy <= y1 + 3; yy++) for (let xx = x0 - 3; xx <= x1 + 3; xx++) {
      const id = tileAt(m, xx, yy);
      if (id === T.TORCH) light(xx * TS + 8 - camX, yy * TS + 6 - camY, 44 * flick, 0.9);
      else if (id === T.CRYSTAL) light(xx * TS + 8 - camX, yy * TS + 8 - camY, 30, 0.7);
      else if (id === T.CAVE_WATER && (xx + yy) % 5 === 0) light(xx * TS + 8 - camX, yy * TS + 8 - camY, 14, 0.3);
    }
    for (const a of this.actors.values()) light(a.x * TS - camX, (a.y - 0.5) * TS - camY, 50, 0.8);
    this.ctx.drawImage(d, 0, 0);
  }

  // なまえ・ふきだし（DOM）
  renderLabels(camX, camY) {
    const s = innerWidth / this.vw;
    // あしもとから px ぶん うえの がめんの いち
    const at = this.r3d
      ? (x, y, px) => this.r3d.project(x, y, px / TS)
      : (x, y, px) => ({ x: (x * TS - camX) * s, y: (y * TS - px - camY) * s });
    const alive = new Set();
    const put = (key, text, x, y, cls) => {
      alive.add(key);
      let e = this.labels.get(key);
      if (!e) {
        e = el('div', { class: `plabel ${cls}` });
        this.labelsEl.append(e);
        this.labels.set(key, e);
      }
      if (e.textContent !== text) e.textContent = text;
      e.className = `plabel ${cls}`;
      const p = at(x, y, 22);
      e.style.left = `${p.x}px`;
      e.style.top = `${p.y}px`;
    };
    const myParty = this.game.party?.id;
    for (const o of this.others.values()) {
      const mate = o.partyId === myParty;
      const text = o.away ? `${o.name}（つうしんまち）` : o.battle && mate ? `${o.name}（たたかいちゅう！ちかづくと さんか）` : o.name;
      put('p:' + o.sid, text, o.x, o.y, mate ? 'party' : '');
    }
    for (const [key, e] of this.labels) if (!alive.has(key)) { e.remove(); this.labels.delete(key); }
    // ふきだし
    const now = performance.now();
    this.bubbles = this.bubbles.filter((b) => {
      if (now > b.until) { b.el.remove(); return false; }
      const o = b.sid === this.game.sid ? this.me : this.others.get(b.sid);
      if (!o) { b.el.style.display = 'none'; return true; }
      b.el.style.display = '';
      const p = at(o.x, o.y, 30);
      b.el.style.left = `${p.x}px`;
      b.el.style.top = `${p.y}px`;
      return true;
    });
  }

  bubble(sid, text) {
    const e = el('div', { class: 'bubble', text });
    this.labelsEl.append(e);
    this.bubbles.push({ sid, el: e, until: performance.now() + 4000 });
  }

  clearLabels() {
    for (const e of this.labels.values()) e.remove();
    this.labels.clear();
    for (const b of this.bubbles) b.el.remove();
    this.bubbles = [];
  }

  // どこに いるか
  areaName() {
    return this.map.areaName(Math.floor(this.me.x), Math.floor(this.me.y));
  }

  areaBgm() {
    if (this.map.kind === 'dungeon') return 'cave';
    const name = this.areaName();
    for (const p of Object.values(PLACES)) if (p.name === name) return p.bgm;
    if (name === 'ささやきの森') return 'forest';
    return 'field';
  }
}
