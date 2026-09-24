// フィールドを うろうろする モンスター（シンボル）
import { ENCOUNTER_TABLES } from '../data/encounters.js';
import { MONSTERS } from '../data/monsters.js';
import { MAPS, isBlocked } from '../maps/index.js';

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

export function spawnSymbols(world, ms, dt, playersOnMap) {
  const map = MAPS[ms.id];
  if (!map.spawnCounts) return;
  ms.spawnTimer -= dt;
  if (ms.spawnTimer > 0) return;
  ms.spawnTimer = 700;
  const zt = zoneTiles(ms);
  const counts = {};
  for (const s of ms.symbols.values()) counts[s.zone] = (counts[s.zone] || 0) + 1;
  for (const [zone, target] of Object.entries(map.spawnCounts)) {
    if ((counts[zone] || 0) >= target) continue;
    const tiles = zt[zone];
    if (!tiles?.length) continue;
    for (let tries = 0; tries < 12; tries++) {
      const [x, y] = world.rng.pick(tiles);
      // プレイヤーの めの まえには でない
      if (playersOnMap.some((p) => Math.hypot(p.x - x, p.y - y) < 9)) continue;
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
      ms.symbols.set(sym.id, sym);
      break;
    }
    break; // 1かいに 1ぴき
  }
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
