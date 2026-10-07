// フィールドを うろうろする モンスター（シンボル）
import { ENCOUNTER_TABLES } from '../data/encounters.js?v=92b7832d9909';
import { MONSTERS } from '../data/monsters.js?v=92b7832d9909';
import { MAPS, isBlocked } from '../maps/index.js?v=92b7832d9909';
import { NIGHT_ZONES, NIGHT_MORE } from '../data/night.js?v=92b7832d9909';
import { cursedOn, CURSE_SPAWN, CURSE_SPAWN_MS, CURSE_CHASE } from './pyramid.js?v=92b7832d9909';

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

function cellLoad(ms, zone, cells, tod = null) {
  const count = new Map(cells.map((c) => [c.key, 0]));
  for (const s of ms.symbols.values()) {
    if (s.zone !== zone || (s.tod || null) !== tod) continue;
    const k = cellKeyOf(s.hx, s.hy);
    if (count.has(k)) count.set(k, count.get(k) + 1);
  }
  // 広さ あたりの 数（少ない ほど 先に うめる）
  return cells.map((c) => ({ c, n: count.get(c.key), load: count.get(c.key) / c.tiles.length }));
}

// 昼と 夜で 出る まものが かわる ちいきか（フィールドだけ。どうくつ・塔の 中は かわらない）
export function hasNightSplit(map, zone) {
  return map.kind === 'field' && !!NIGHT_ZONES[zone];
}

// その まものが 見えるか（night: 見る 人の 時計が 夜か）。tod の ない まものは いつでも
export function symbolVisible(sym, night) {
  return !sym.tod || sym.tod === (night ? 'night' : 'day');
}

// playersOnMap の p.night … その 人の 時計が 夜か（world.js の tick が きめる）
export function spawnSymbols(world, ms, dt, playersOnMap) {
  const map = MAPS[ms.id];
  if (!map.spawnCounts) return;
  ms.spawnTimer -= dt;
  if (ms.spawnTimer > 0) return;
  // のろいの宝（王家のピラミッド）: のろわれた 人が いると 魔物が ふえる（world/pyramid.js）
  const curse = cursedOn(ms.id, playersOnMap);
  ms.spawnTimer = curse ? CURSE_SPAWN_MS : 700;
  const zc = zoneCells(ms);
  const key = (zone, tod) => `${zone}|${tod || ''}`;
  // 昼の 人・夜の 人が いるか（だれも 見ない ほうの まものは すこしずつ いなくなる）
  const wantDay = playersOnMap.some((p) => !p.night), wantNight = playersOnMap.some((p) => p.night);
  if (!wantDay || !wantNight) {
    let n = 0;
    for (const s of [...ms.symbols.values()]) {
      if (n >= 3) break;
      if (s.tod && !s.busy && (s.tod === 'day' ? !wantDay : !wantNight)) { ms.symbols.delete(s.id); n++; }
    }
  }
  const counts = {};
  for (const s of ms.symbols.values()) counts[key(s.zone, s.tod)] = (counts[key(s.zone, s.tod)] || 0) + 1;
  const near = (x, y, r) => playersOnMap.some((p) => Math.hypot(p.x - x, p.y - y) < r);
  // たりない ちいきの うち、いちばん 少ない ところから（夜が 来た すぐ あとは 3びきずつ）
  const pools = [];
  for (const [zone, base] of Object.entries(map.spawnCounts)) {
    const target = curse ? Math.round(base * CURSE_SPAWN) : base;
    if (!zc[zone]?.length) continue;
    if (!hasNightSplit(map, zone)) pools.push([zone, null, target]);
    else {
      if (wantDay) pools.push([zone, 'day', target]);
      if (wantNight) pools.push([zone, 'night', Math.round(target * NIGHT_MORE)]);
    }
  }
  const need = pools.filter(([zone, tod, target]) => (counts[key(zone, tod)] || 0) < target)
    .sort((a, b) => (counts[key(a[0], a[1])] || 0) / a[2] - (counts[key(b[0], b[1])] || 0) / b[2]);
  if (!need.length) {
    rebalance(world, ms, zc, near);
    return;
  }
  const [zone, tod, target] = need[0];
  const burst = (counts[key(zone, tod)] || 0) < target / 2 ? 3 : 1;
  for (let k = 0; k < burst; k++) {
    const loads = cellLoad(ms, zone, zc[zone], tod).sort((a, b) => a.load - b.load || world.rng.next() - 0.5);
    spawnIn(world, ms, zone, tod, loads, near);
  }
}

function spawnIn(world, ms, zone, tod, loads, near) {
  for (const { c } of loads.slice(0, 2)) {
    for (let tries = 0; tries < 6; tries++) {
      const [x, y] = world.rng.pick(c.tiles);
      // プレイヤーの めの まえには でない
      if (near(x, y, 9)) continue;
      ms.symbols.set(...newSymbol(world, zone, x, y, tod));
      return true;
    }
  }
  return false;
}

// ぜんぶ いる ときは、こみあった 区画の まもの（だれも 見ていない もの）を ときどき 空いた 区画へ うつす
function rebalance(world, ms, zc, near) {
  ms.rebalanceT = (ms.rebalanceT || 0) + 1;
  if (ms.rebalanceT % 2) return;
  for (const [zone, cells] of Object.entries(zc)) {
    if (cells.length < 2) continue;
    const tod = hasNightSplit(MAPS[ms.id], zone) ? (ms.rebalanceT % 4 ? 'night' : 'day') : null;
    const loads = cellLoad(ms, zone, cells, tod).sort((a, b) => a.load - b.load);
    const low = loads[0], high = loads[loads.length - 1];
    if (high.n < 2 || high.load < low.load * 2 + 0.01 || high.n - low.n < 2) continue;
    const mover = [...ms.symbols.values()].find((s) => s.zone === zone && (s.tod || null) === tod && !s.busy && s.state === 'wander' && cellKeyOf(s.hx, s.hy) === high.c.key && !near(s.x, s.y, 16));
    if (!mover) continue;
    for (let tries = 0; tries < 6; tries++) {
      const [x, y] = world.rng.pick(low.c.tiles);
      if (near(x, y, 16)) continue;
      ms.symbols.delete(mover.id);
      ms.symbols.set(...newSymbol(world, zone, x, y, mover.tod || null));
      return;
    }
  }
}

// tod: 'day' / 'night'（昼と 夜で かわる ちいき）/ null（いつでも）
function newSymbol(world, zone, x, y, tod = null) {
  let table = tod === 'night' ? NIGHT_ZONES[zone] || zone : zone;
  if (tod !== 'night' && (zone === 'plains' || zone === 'outskirts') && world.rng.chance(0.025)) table = 'rare';
  const group = rollGroup(world.rng, table);
  const lead = group[0];
  const sym = {
    id: 'm' + (symSeq++), sp: lead, group, table, zone, tod: tod || undefined,
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
    // いちばん ちかい プレイヤー（のろわれた 人は 遠くからでも 見つかる。world/pyramid.js）
    let target = null, best = 6, near = 6;
    for (const p of players) {
      // 空の 上の 人・その まものが 見えない（昼と 夜が ちがう）人は おいかけない
      if (p.invuln > 0 || p.busy || p.flying || !symbolVisible(s, p.night)) continue;
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      const reach = cursedPlayer(map, p) ? CURSE_CHASE + 1.5 : 6;
      if (d < reach && d - reach < best - near) {
        best = d;
        near = reach;
        target = p;
      }
    }
    const chaseR = target && cursedPlayer(map, target) ? CURSE_CHASE : 4.5;
    const repelled = target && target.repelUntil > world.now() && s.level <= target.level;
    if (s.sp === 'kirakira' && target && best < 4) {
      // きらきらぷるりんは にげる
      s.state = 'flee';
      const d = Math.max(0.01, best);
      s.vx = (s.x - target.x) / d;
      s.vy = (s.y - target.y) / d;
    } else if (target && s.aggro && !repelled && best < chaseR) {
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

// のろわれた 人（王家のピラミッドの 中だけ）
const cursedPlayer = (map, p) => !!map.pyramid && !!p.char?.pyrCurse;

function canStand(map, x, y, zone) {
  const tx = Math.floor(x), ty = Math.floor(y);
  if (isBlocked(map, tx, ty, () => false)) return false;
  return map.zoneAt(tx, ty) === zone;
}

// night: 見る 人の 時計が 夜か（昼の まもの・夜の まものの どちらを 見せるか）
export function symbolSnapshot(ms, night = false) {
  const out = [];
  for (const s of ms.symbols.values()) {
    if (s.busy || !symbolVisible(s, night)) continue;
    out.push({ id: s.id, sp: s.sp, x: Math.round(s.x * 100) / 100, y: Math.round(s.y * 100) / 100, dir: s.dir, st: s.state === 'chase' ? 1 : 0 });
  }
  return out;
}
