// テスト用: サーバーに つながる ロボット
import { MAPS, isBlocked } from '../public/js/shared/maps/index.js';

export const tickN = async (world, n = 1, dt = 50) => {
  for (let i = 0; i < n; i++) {
    world.tick(dt);
    await new Promise((r) => setImmediate(r));
  }
};

export class Bot {
  constructor(world, name = 'ロボ') {
    this.world = world;
    this.name = name;
    this.msgs = [];
    this.queue = [];
    this.choice = 0;
    this.battles = [];
    this.seq = 0;
    this.gateFlags = [];
    this.s = world.connect({ send: (m) => this.onMsg(JSON.parse(JSON.stringify(m))) });
  }

  onMsg(m) {
    this.msgs.push(m);
    switch (m.t) {
      case 'welcome': this.welcome = m; break;
      case 'enter':
        this.char = m.char; this.map = m.map; this.x = m.x; this.y = m.y; this.seq = 0; this.sid = m.sid;
        this.party = m.party;
        break;
      case 'self': this.char = m.char; break;
      case 'party': this.party = m.party; this.gateFlags = m.party.gateFlags || []; break;
      case 'setPos': this.map = m.map; this.x = m.x; this.y = m.y; this.seq = m.seq; break;
      case 'script': {
        for (const st of m.steps) {
          if (st[0] === 'teleport') {
            const mine = st[5].find((e) => e[0] === this.sid);
            if (mine) { this.map = st[1]; this.x = mine[1]; this.y = mine[2]; this.seq = mine[3]; }
          }
        }
        if (!m.spectator) {
          const last = m.steps[m.steps.length - 1];
          const choice = last && last[0] === 'choice' ? this.choice : undefined;
          this.queue.push(() => this.world.handle(this.s, { t: 'ack', runId: m.runId, choice }));
        }
        break;
      }
      case 'battleStart':
        this.inBattle = true;
        for (const id of m.mine) this.queue.push(() => this.world.handle(this.s, { t: 'battle', actor: id, auto: true }));
        break;
      case 'battleEnd': this.inBattle = false; this.battles.push(m); break;
      default:
    }
  }

  flushQueue() {
    const q = this.queue;
    this.queue = [];
    for (const f of q) f();
  }

  send(msg) { this.world.handle(this.s, msg); }

  async login(pw = '') {
    this.send({ t: 'hello', pw });
    return this.welcome;
  }

  async createAndPlay(job = 'warrior') {
    this.send({ t: 'createChar', name: this.name, job, look: { body: 0, hair: 1, hairColor: 2, skin: 0, color: 3 } });
    const created = this.msgs.filter((m) => m.t === 'charCreated').pop();
    this.send({ t: 'play', id: created.id });
    return created.id;
  }

  // すべての しょりを すすめる
  async settle(maxTicks = 4000) {
    for (let i = 0; i < maxTicks; i++) {
      this.flushQueue();
      await tickN(this.world, 1);
      this.flushQueue();
      if (!this.s.busy && !this.queue.length && !this.inBattle) {
        // もう すこし まって 追加の だいほんが こないか みる
        await tickN(this.world, 2);
        this.flushQueue();
        if (!this.s.busy && !this.queue.length) return true;
      }
    }
    return false;
  }

  path(tx, ty) {
    const map = MAPS[this.map];
    const flags = new Set([...Object.keys(this.char.flags || {}), ...this.gateFlags]);
    const has = (f) => flags.has(f);
    const sx = Math.floor(this.x), sy = Math.floor(this.y);
    const prev = new Map();
    const key = (x, y) => y * map.w + x;
    const q = [[sx, sy]];
    prev.set(key(sx, sy), null);
    while (q.length) {
      const [x, y] = q.shift();
      if (x === tx && y === ty) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
        const k = key(nx, ny);
        if (prev.has(k)) continue;
        const target = nx === tx && ny === ty;
        if (!target && (isBlocked(map, nx, ny, has) || map.chestAt.has(k))) continue;
        prev.set(k, [x, y]);
        q.push([nx, ny]);
      }
    }
    if (!prev.has(key(tx, ty))) return null;
    const out = [];
    let cur = [tx, ty];
    while (cur) {
      out.unshift(cur);
      cur = prev.get(key(cur[0], cur[1]));
    }
    return out;
  }

  // あるいて いく（とちゅうで イベントが おきたら まつ）
  async walkTo(tx, ty, { stopBefore = false } = {}) {
    for (let guard = 0; guard < 20; guard++) {
      const p = this.path(tx, ty);
      if (!p) throw new Error(`no path to ${tx},${ty} on ${this.map} from ${this.x},${this.y}`);
      const steps = stopBefore ? p.slice(1, -1) : p.slice(1);
      let interrupted = false;
      const startMap = this.map;
      for (const [x, y] of steps) {
        if (this.s.busy) { await this.settle(); }
        if (this.map !== startMap) { interrupted = true; break; }
        this.x = x + 0.5;
        this.y = y + 0.5;
        this.send({ t: 'move', x: this.x, y: this.y, dir: 'down', moving: true, seq: this.seq });
        await tickN(this.world, 1);
        this.flushQueue();
        if (this.s.busy || this.map !== startMap) { interrupted = true; await this.settle(); break; }
      }
      if (!interrupted) return true;
      if (this.map !== startMap) return true;
    }
    return false;
  }

  async talk(npcId) {
    this.send({ t: 'interact', kind: 'npc', id: npcId });
    return this.settle();
  }

  async examine(x, y) {
    this.send({ t: 'interact', kind: 'tile', x, y });
    return this.settle();
  }

  flag(f) { return !!this.char.flags[f]; }
}
