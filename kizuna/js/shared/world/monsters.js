// フィールドを うろうろする モンスター（シンボル）
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=4deb19092b33';
import { MONSTERS } from '../data/monsters.js?v=4deb19092b33';
import { MAPS, isBlocked } from '../maps/index.js?v=4deb19092b33';

let symSeq = 1;

export function rollGroup(rng, table) {
  const e = rng.weighted(ENCOUNTER_TABLES[table]);
  const list = [];
  for (const [sp, mn, mx] of e.group) {
    const n = rng.int(mn, mx);
    for (let i = 0; i < n; i++) list.push(sp);
  }
  if (!list.length) list.push(e.group[0][0]);
  return list;
}

// マップごとの じょうたい
export function mapState(world, mapId) {
  let ms = world.mapStates.get(mapId);
  if (!ms) {
    ms = { id: mapId, symbols: new Map(), spawnTimer: 0, zoneTiles: null };
    world.mapStates.set(mapId, ms);
  }
  return ms;
}

// ちいきごとに でてこれる マスを さがしておく
function zoneTiles(ms) {
  if (ms.zoneTiles) return ms.zoneTiles;
  const map = MAPS[ms.id];
  const z = {};
  for (let y = 1; y < map.h - 1; y++) {
    for (let x = 1; x < map.w - 1; x++) {
      if (isBlocked(map, x, y, () => false)) continue;
      const zone = map.zoneAt(x, y);
      if (zone.startsWith('safe')) continue;
      (z[zone] = z[zone] || []).push([x, y]);
    }
  }
  ms.zoneTiles = z;
  return z;
}

// ちいきを 12マスの 区画に 分けて、まものが へった 区画から うめる（かたよらない ように）。
// 区画ごとの 数は マスの 広さに あわせる。ちいきごとの 数（spawnCounts）で わざと 多い・少ないは つけられる
const CELL = 12;
function zoneCells(ms) {
  if (ms.zoneCells) return ms.zoneCells;
  const out = {};
  for (const [zone, tiles] of Object.entries(zoneTiles(ms))) {
    const cells = new Map();
    for (const t of tiles) {
      const key = `${Math.floor(t[0] / CELL)},${Math.floor(t[1] / CELL)}`;
      if (!cells.has(key)) cells.set(key, { key, tiles: [] });
      cells.get(key).tiles.push(t);
    }
    // 小さすぎる 区画（はしっこ）は となりに まかせる
    out[zone] = [...cells.values()].filter((c) => c.tiles.length >= 6);
  }
  ms.zoneCells = out;
  return out;
}
const cellKeyOf = (x, y) => `${Math.floor(x / CELL)},${Math.floor(y / CELL)}`;

function cellLoad(ms, zone, cells) {
  const count = new Map(cells.map((c) => [c.key, 0]));
  for (const s of ms.symbols.values()) {
    if (s.zone !== zone) continue;
    const k = cellKeyOf(s.hx, s.hy);
    if (count.has(k)) count.set(k, count.get(k) + 1);
  }
  // 広さ あたりの 数（少ない ほど 先に うめる）
  return cells.map((c) => ({ c, n: count.get(c.key), load: count.get(c.key) / c.tiles.length }));
}

export function spawnSymbols(world, ms, dt, playersOnMap) {
  const map = MAPS[ms.id];
  if (!map.spawnCounts) return;
  ms.spawnTimer -= dt;
  if (ms.spawnTimer > 0) return;
  ms.spawnTimer = 700;
  const zc = zoneCells(ms);
  const counts = {};
  for (const s of ms.symbols.values()) counts[s.zone] = (counts[s.zone] || 0) + 1;
  const near = (x, y, r) => playersOnMap.some((p) => Math.hypot(p.x - x, p.y - y) < r);
  // たりない ちいきの うち、いちばん 少ない ところから 1ぴき
  const need = Object.entries(map.spawnCounts)
    .filter(([zone, target]) => (counts[zone] || 0) < target && zc[zone]?.length)
    .sort((a, b) => (counts[a[0]] || 0) / a[1] - (counts[b[0]] || 0) / b[1]);
  if (!need.length) {
    rebalance(world, ms, zc, near);
    return;
  }
  const zone = need[0][0];
  const loads = cellLoad(ms, zone, zc[zone]).sort((a, b) => a.load - b.load || world.rng.next() - 0.5);
  for (const { c } of loads.slice(0, 2)) {
    for (let tries = 0; tries < 6; tries++) {
      const [x, y] = world.rng.pick(c.tiles);
      // プレイヤーの めの まえには でない
      if (near(x, y, 9)) continue;
      ms.symbols.set(...newSymbol(world, zone, x, y));
      return;
    }
  }
}

// ぜんぶ いる ときは、こみあった 区画の まもの（だれも 見ていない もの）を ときどき 空いた 区画へ うつす
function rebalance(world, ms, zc, near) {
  ms.rebalanceT = (ms.rebalanceT || 0) + 1;
  if (ms.rebalanceT % 2) return;
  for (const [zone, cells] of Object.entries(zc)) {
    if (cells.length < 2) continue;
    const loads = cellLoad(ms, zone, cells).sort((a, b) => a.load - b.load);
    const low = loads[0], high = loads[loads.length - 1];
    if (high.n < 2 || high.load < low.load * 2 + 0.01 || high.n - low.n < 2) continue;
    const mover = [...ms.symbols.values()].find((s) => s.zone === zone && !s.busy && s.state === 'wander' && cellKeyOf(s.hx, s.hy) === high.c.key && !near(s.x, s.y, 16));
    if (!mover) continue;
    for (let tries = 0; tries < 6; tries++) {
      const [x, y] = world.rng.pick(low.c.tiles);
      if (near(x, y, 16)) continue;
      ms.symbols.delete(mover.id);
      ms.symbols.set(...newSymbol(world, zone, x, y));
      return;
    }
  }
}

function newSymbol(world, zone, x, y) {
  let table = zone;
  if ((zone === 'plains' || zone === 'outskirts') && world.rng.chance(0.025)) table = 'rare';
  const group = rollGroup(world.rng, table);
  const lead = group[0];
  const sym = {
    id: 'm' + (symSeq++), sp: lead, group, table, zone,
    x: x + 0.5, y: y + 0.5, hx: x + 0.5, hy: y + 0.5, dir: 'down',
    vx: 0, vy: 0, t: 0, state: 'wander', busy: false, stun: 0,
    speed: lead === 'kirakira' ? 3.6 : 1.4 + Math.min(1.2, (MONSTERS[lead].agi || 10) / 40),
    // よわい まものは おいかけてこない（こどもでも にげられるように）
    aggro: lead !== 'kirakira' && MONSTERS[lead].lv >= 3,
    level: MONSTERS[lead].lv,
  };
  return [sym.id, sym];
}

// うごかす
export function moveSymbols(world, ms, dt, players) {
  const map = MAPS[ms.id];
  const sec = dt / 1000;
  for (const s of ms.symbols.values()) {
    if (s.busy) continue;
    if (s.stun > 0) {
      s.stun -= dt;
      continue;
    }
    s.t -= dt;
    // いちばん ちかい プレイヤー
    let target = null, best = 6;
    for (const p of players) {
      if (p.invuln > 0 || p.busy) continue;
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      if (d < best) {
        best = d;
        target = p;
      }
    }
    const repelled = target && target.repelUntil > world.now() && s.level <= target.level;
    if (s.sp === 'kirakira' && target && best < 4) {
      // きらきらぷるりんは にげる
      s.state = 'flee';
      const d = Math.max(0.01, best);
      s.vx = (s.x - target.x) / d;
      s.vy = (s.y - target.y) / d;
    } else if (target && s.aggro && !repelled && best < 4.5) {
      s.state = 'chase';
      const d = Math.max(0.01, best);
      s.vx = (target.x - s.x) / d;
      s.vy = (target.y - s.y) / d;
    } else if (repelled && best < 4) {
      s.state = 'flee';
      const d = Math.max(0.01, best);
      s.vx = (s.x - target.x) / d;
      s.vy = (s.y - target.y) / d;
    } else if (s.t <= 0) {
      s.state = 'wander';
      s.t = 800 + world.rng.int(0, 2400);
      if (world.rng.chance(0.35)) {
        s.vx = 0;
        s.vy = 0;
      } else {
        // ホームから はなれすぎたら もどる
        const hd = Math.hypot(s.hx - s.x, s.hy - s.y);
        if (hd > 5) {
          s.vx = (s.hx - s.x) / hd;
          s.vy = (s.hy - s.y) / hd;
        } else {
          const a = world.rng.float(0, Math.PI * 2);
          s.vx = Math.cos(a);
          s.vy = Math.sin(a);
        }
      }
    }
    const sp = s.state === 'chase' ? s.speed * 1.55 : s.state === 'flee' ? s.speed * 1.3 : s.speed * 0.6;
    const nx = s.x + s.vx * sp * sec;
    const ny = s.y + s.vy * sp * sec;
    const okX = canStand(map, nx, s.y, s.zone);
    const okY = canStand(map, s.x, ny, s.zone);
    if (okX) s.x = nx; else s.vx = -s.vx * 0.5;
    if (okY) s.y = ny; else s.vy = -s.vy * 0.5;
    if (Math.abs(s.vx) > Math.abs(s.vy)) s.dir = s.vx > 0 ? 'right' : 'left';
    else if (Math.abs(s.vy) > 0.01) s.dir = s.vy > 0 ? 'down' : 'up';
  }
}

function canStand(map, x, y, zone) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (isBlocked(map, tx, ty, () => false)) return false;
  return map.zoneAt(tx, ty) === zone;
}

export function symbolSnapshot(ms) {
  const out = [];
  for (const s of ms.symbols.values()) {
    if (s.busy) continue;
    out.push({ id: s.id, sp: s.sp, x: Math.round(s.x * 100) / 100, y: Math.round(s.y * 100) / 100, dir: s.dir, st: s.state === 'chase' ? 1 : 0 });
  }
  return out;
}
