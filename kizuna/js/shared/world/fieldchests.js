// フィールドの 宝箱（ランダムに あらわれ、開けると きえる。data/fieldchests.js）
// ・マップの じょうたい（monsters.js の mapState）に もつ。サーバーに 1つ（家族で 見る ものは おなじ。先に 開けた 人が もらう）
// ・プレイヤーが その マップに いる ときだけ ふえる。開けられない まま 古く なった ものは べつの 場所へ
// ・クライアントへは snap の fc（かわった ときだけ）
import { MAPS, isBlocked } from '../maps/index.js?v=3285de757165';
import { T } from '../tiles.js?v=3285de757165';
import { ITEMS } from '../data/items.js?v=3285de757165';
import { addItem } from '../stats.js?v=3285de757165';
import { FIELD_CHEST_COUNT, FIELD_CHEST_RESPAWN_MS, FIELD_CHEST_LIFE_MS, fieldChestLoot } from '../data/fieldchests.js?v=3285de757165';

const GROUND = new Set([T.GRASS, T.FLOWERS, T.TALLGRASS, T.FOREST_FLOOR, T.SAND, T.HILL, T.DIRT, T.SNOW, T.DEEP_SNOW, T.ASH, T.DESERT]);
const SPACING = 10; // ほかの 宝箱との あいだ（マス）
const AWAY = 5; // プレイヤーの すぐ 近くには 出さない

// 出られる マス（町・村の そば、出入り口・かんばん・人・きらきらの 上は さける）
function spots(ms) {
  if (ms.fcSpots) return ms.fcSpots;
  const map = MAPS[ms.id];
  const out = [];
  const near = new Set();
  const mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) near.add(`${x + dx},${y + dy}`); };
  for (const w of map.warps) mark(w.x, w.y, 2);
  for (const n of map.npcs) mark(Math.floor(n.x), Math.floor(n.y), 1);
  for (const c of map.chests) mark(c.x, c.y, 1);
  for (const s of map.signs || []) mark(s.x, s.y, 1);
  for (const s of map.sparkles || []) mark(s.x, s.y, 0);
  // fcStart が ある マップは、そこから 歩いて 行ける ところ だけ（山の 中の すきま などに 出さない）
  const reach = map.fcStart ? walkable(map, map.fcStart) : null;
  for (let y = 2; y < map.h - 2; y++) {
    for (let x = 2; x < map.w - 2; x++) {
      if (!GROUND.has(map.tiles[y * map.w + x]) || near.has(`${x},${y}`)) continue;
      if (reach && !reach[y * map.w + x]) continue;
      if (isBlocked(map, x, y, () => true) || isBlocked(map, x, y, () => false)) continue;
      // 町・村の 中と その まわり 2マスは だめ
      let safe = false;
      for (let dy = -2; dy <= 2 && !safe; dy++) for (let dx = -2; dx <= 2 && !safe; dx++) if (String(map.zoneAt(x + dx, y + dy)).startsWith('safe')) safe = true;
      if (safe) continue;
      out.push([x, y]);
    }
  }
  ms.fcSpots = out;
  return out;
}

// start から 歩いて 行ける マス（しかけは ぜんぶ ひらいた として）
function walkable(map, start) {
  const seen = new Uint8Array(map.w * map.h);
  const q = [start];
  seen[start[1] * map.w + start[0]] = 1;
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen[k] || isBlocked(map, nx, ny, () => true)) continue;
      seen[k] = 1;
      q.push([nx, ny]);
    }
  }
  return seen;
}

function chestsOf(ms) {
  if (!ms.fchests) {
    ms.fchests = new Map();
    ms.fcTimer = 0;
    ms.fcVer = 1;
  }
  return ms.fchests;
}

function spawnOne(world, ms, players) {
  const list = spots(ms);
  if (!list.length) return null;
  const map = MAPS[ms.id];
  const have = [...chestsOf(ms).values()];
  for (let i = 0; i < 60; i++) {
    const [x, y] = list[Math.floor(world.rng.next() * list.length)];
    if (have.some((c) => Math.abs(c.x - x) + Math.abs(c.y - y) < SPACING)) continue;
    if (players.some((p) => Math.hypot(p.x - (x + 0.5), p.y - (y + 0.5)) < AWAY)) continue;
    world.fcSeq = (world.fcSeq || 0) + 1;
    const fc = { id: `fc${world.fcSeq}`, x, y, zone: map.zoneAt(x, y), born: world.now() };
    ms.fchests.set(fc.id, fc);
    ms.fcVer++;
    return fc;
  }
  return null;
}

// 毎 tick（world.js）。はじめて 来た マップは いっぺんに ならべる
export function tickFieldChests(world, ms, dt, players) {
  const want = FIELD_CHEST_COUNT[ms.id];
  if (!want || !players.length) return;
  const fresh = !ms.fchests;
  const chests = chestsOf(ms);
  if (fresh) {
    for (let i = 0; i < want; i++) spawnOne(world, ms, players);
    return;
  }
  // 古い ものは きえる（だれも 近くに いない とき）
  const now = world.now();
  for (const fc of [...chests.values()]) {
    if (now - fc.born < FIELD_CHEST_LIFE_MS) continue;
    if (players.some((p) => Math.hypot(p.x - (fc.x + 0.5), p.y - (fc.y + 0.5)) < 14)) continue;
    chests.delete(fc.id);
    ms.fcVer++;
  }
  if (chests.size >= want) {
    ms.fcTimer = 0;
    return;
  }
  ms.fcTimer += dt;
  if (ms.fcTimer >= FIELD_CHEST_RESPAWN_MS) {
    ms.fcTimer = 0;
    spawnOne(world, ms, players);
  }
}

// クライアントへ おくる 一覧（かわった ときだけ: s.fcSeen と くらべる）
export function fieldChestSnap(s, ms) {
  if (!ms.fchests) return undefined;
  // 3びょうに 1かいは かならず おくる（マップを うつった・つなぎなおした とき も 見えるように）
  const seen = s.fcSeen;
  const now = Date.now();
  if (seen && seen.map === ms.id && seen.ver === ms.fcVer && now - seen.at < 3000) return undefined;
  s.fcSeen = { map: ms.id, ver: ms.fcVer, at: now };
  return [...ms.fchests.values()].map((c) => [c.id, c.x, c.y]);
}

// しらべた ところの 近くの 宝箱（むいている マスか、自分の まわり）
export function fieldChestNear(ms, s, tx, ty) {
  if (!ms?.fchests?.size) return null;
  let best = null, bd = Infinity;
  for (const fc of ms.fchests.values()) {
    const dFace = Math.hypot(fc.x - tx, fc.y - ty);
    const dMe = Math.hypot(fc.x + 0.5 - s.x, fc.y + 0.5 - s.y);
    if (dFace > 1.01 && dMe > 1.5) continue;
    const d = Math.min(dFace, dMe);
    if (d < bd) { bd = d; best = fc; }
  }
  return best;
}

// 開ける（中みを もらって、宝箱は きえる）。runSteps に わたす steps を かえす
export function openFieldChest(world, s, ms, fc) {
  const c = s.char;
  ms.fchests.delete(fc.id);
  ms.fcVer++;
  ms.fcTimer = 0;
  const loot = fieldChestLoot(fc.zone, world.rng);
  c.fieldChests = (c.fieldChests || 0) + 1;
  world.markDirty();
  const steps = [['sfx', 'chest']];
  if (loot.gold) {
    c.gold = Math.min(9999999, c.gold + loot.gold);
    steps.push(['say', null, `${c.name}は宝箱を開けた！\n${loot.gold}ゴールドを手に入れた！`]);
  } else {
    addItem(c, loot.item, loot.n);
    steps.push(['say', null, `${c.name}は宝箱を開けた！\n${ITEMS[loot.item].name}${loot.n > 1 ? `を${loot.n}個` : 'を'}手に入れた！`]);
  }
  return steps;
}
