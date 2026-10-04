// 旅の しくみ（サーバー）: 移動の 呪文ルーラ・風の大鳥フウラで 空を とぶ・時間の すず
//
// 空を とぶ きまり（s.flying）
// ・「風の笛」（第2章クリアの あと 風のさいだんで もらう）を もっていれば、フィールド（ミドリナ地方・風の海）で 呼べる
//   町・村・港の 中では 呼べない（大きな 鳥は 町に おりられない）
// ・とんでいる あいだは マップの はし まで どこでも いける（山・海・森の 上も）。まものには 会わない
//   出入り口（洞窟・塔）・イベントの 場所・たてものには 入れない。人とも 話せない
// ・おりられるのは、歩ける 地面（水・たてものの 中・出入り口・人の そば では ない ところ）
// ・ミドリナ地方の 南の はし ⇄ 風の海の 北の はしで、となりの 地方へ とんでいける（「別の地方へ飛ぶ」でも）
// ・第3章: ミドリナ地方の 北の はし ⇄ シロガネ地方の 南の はし（c3_start から）。
//   シロガネ地方は 星の竜が 目覚める（c3_dragon）まで ふぶきで、南の 雪原の 上しか とべない（data/sky.js の box）
// ・星の竜が 目覚めたら 竜に のって とぶ（すこし はやい。data/sky.js の flySpeed）
// ・パーティーで「ついていく」に している なかまは いっしょに のる
// ・サーバーは とんでいない 人が 歩けない ところへ 入るのを みとめない（world.js の onMove）
import { MAPS, isBlocked, onWater, condOk } from '../maps/index.js?v=d725a8c0cda9';
import { PLACES } from '../maps/overworld.js?v=d725a8c0cda9';
import { SEA_PLACES } from '../maps/ch2.js?v=d725a8c0cda9';
import { ABILITIES } from '../data/abilities.js?v=d725a8c0cda9';
import { ITEMS } from '../data/items.js?v=d725a8c0cda9';
import { hasKeyItem, mpCost, removeItem, itemCount } from '../stats.js?v=d725a8c0cda9';
import { SKY_MAPS, FLUTE_ID, regionHop, edgeAt, edgeTarget, regionsFrom, skyBox, inSkyBox, mountOf, flySpeed, edgeLockedText, boxLockedText } from '../data/sky.js?v=d725a8c0cda9';
import { partyOf } from './party.js?v=d725a8c0cda9';
import { warpDest } from './services.js?v=d725a8c0cda9';
import { advanceClock, clockOwner } from './clock.js?v=d725a8c0cda9';

const FOLLOW_RANGE = 12;

// ───────────── ルーラ・帰り道の羽の 行き先 ─────────────
// 行った ことの ある 町・村・港（星見の丘は のぞく）
export function warpPlaces(c) {
  return Object.keys({ ...PLACES, ...SEA_PLACES }).filter((id) => id !== 'shrine' && c?.visited?.[id]);
}

export function placeName(id) {
  return (PLACES[id] || SEA_PLACES[id])?.name || '';
}

// 自分と「ついていく」なかまを いっしょに 動かす（ルーラ・帰り道の羽）
export function warpParty(world, s, to) {
  const fromMap = s.map, fx = s.x, fy = s.y;
  world.placeSession(s, to.map, to.x, to.y, to.dir || 'down', true);
  world.warpFollowers(s, fromMap, fx, fy, to);
  world.broadcastPlayers();
}

// ルーラ（menuAction の 'cast' から）。reply(ok, text)
export function castRura(world, s, caster, id, msg, reply) {
  const a = ABILITIES[id];
  // 洞窟や 塔の 中では 天井に 頭を ぶつける（MPは へらない）
  if (world.mapKind(s.map) !== 'field') return reply(false, `${caster.name}は${a.name}を唱えた！\nしかし天井に頭をぶつけた！\n（洞窟や塔の中では使えない）`);
  const place = typeof msg.place === 'string' ? msg.place : '';
  if (!warpPlaces(s.char).includes(place)) return reply(false, 'どこへ行く？');
  const cost = mpCost(caster, id);
  if (caster.mp < cost) return reply(false, 'MPが足りない！');
  caster.mp -= cost;
  warpParty(world, s, warpDest(place));
  return reply(true, `${caster.name}は${a.name}を唱えた！\n${placeName(place)}へ飛んでいく…！`);
}

// 夜明けのすず・夕焼けのすず（menuAction の 'useItem' から）
export function useTimeBell(world, s, itemId, reply) {
  const it = ITEMS[itemId];
  if (clockOwner(world, s) !== s) return reply(false, '時間を変えられるのは、パーティーのリーダーだけ。');
  if (itemCount(s.char, itemId) < 1) return reply(false, '持っていない');
  removeItem(s.char, itemId, 1);
  const shift = advanceClock(world, s, it.effect.until);
  const p = partyOf(world, s);
  if (p) world.broadcastToParty(p, { t: 'clock', shift });
  return reply(true, it.effect.until === 'night'
    ? `${s.char.name}は${it.name}を鳴らした！\n空があかね色にそまり…夜になった！`
    : `${s.char.name}は${it.name}を鳴らした！\n東の空が明るくなり…朝になった！`);
}

// ───────────── 空を とぶ ─────────────
export const canFlyMap = (mapId) => !!SKY_MAPS[mapId];
// のりもの（大鳥フウラ か 星の竜アステル）。手伝っている ときは リーダーの 世界の もの
const mountFor = (world, s) => mountOf(world.worldFlags?.(s) || s.char?.flags);
// 空を とぶ はやさ（歩く はやさの ばい）
export const flySpeedFor = (world, s) => flySpeed(world.worldFlags?.(s) || s.char?.flags);

// とんでいる かどうかを きめる（キャラにも のこす: セーブから つづける ため）
export function setFlying(s, on) {
  s.flying = !!on;
  if (!s.char) return;
  if (s.flying) s.char.riding = 'bird';
  else delete s.char.riding;
}

// 町・村・港の 中か
function inTown(mapId, x, y) {
  const inR = (rx, ry, rw, rh) => x >= rx && y >= ry && x < rx + rw && y < ry + rh;
  if (mapId === 'overworld') return Object.entries(PLACES).some(([id, p]) => id !== 'shrine' && inR(p.x, p.y, p.w, p.h));
  return Object.values(SEA_PLACES).some((p) => p.map === mapId && inR(...p.rect));
}

// 笛を ふけるか（{ ok, reason }）
export function canCall(world, s) {
  const own = hasKeyItem(s.char, FLUTE_ID) && s.char.flags?.c2_clear;
  const host = world.hostOf?.(s);
  const hosted = host && hasKeyItem(host.char, FLUTE_ID) && host.char.flags?.c2_clear;
  if (!own && !hosted) return { ok: false, reason: '' };
  if (s.flying) return { ok: false, reason: 'もう空を飛んでいる。' };
  if (s.busy) return { ok: false, reason: '今はできません' };
  const mount = mountFor(world, s);
  if (!canFlyMap(s.map)) return { ok: false, reason: `${ITEMS[FLUTE_ID].name}をふいた！\nしかし何も起こらなかった…\n（洞窟や塔の中では、${mount.btn}は来られない）` };
  if (inTown(s.map, s.x, s.y)) return { ok: false, reason: `${ITEMS[FLUTE_ID].name}をふいた！\nしかし${mount.name}は町の中にはおりられない。\n（町の外でふこう）` };
  // ふぶき・砂嵐の 地方（シロガネ地方は 星の竜が 目覚めるまで・コガネ地方は 砂嵐の あいだ）: とべる 場所でしか よべない
  if (!inSkyBox(skyBox(s.map, world.hasFlagFn(s)), s.x, s.y)) {
    return { ok: false, reason: boxLockedText(s.map, ITEMS[FLUTE_ID].name, mount.name) };
  }
  return { ok: true };
}

// 「ついていく」なかま（同じ マップの ちかく）
function followers(world, s) {
  const p = partyOf(world, s);
  if (!p || p.leader !== s.id) return [];
  return p.members.map((sid) => world.sessions.get(sid)).filter((m) => m && m !== s && m.follow && !m.busy && !m.away && m.inWorld
    && m.map === s.map && Math.hypot(m.x - s.x, m.y - s.y) <= FOLLOW_RANGE);
}

// おりられる ところか（プレイヤーの あしもとの はこが ぜんぶ 歩ける 地面）
export function landingOk(world, s, map, x, y) {
  if (!map || !canFlyMap(map.id)) return false;
  if (x < 0.5 || y < 0.5 || x > map.w - 0.5 || y > map.h - 0.5) return false;
  const has = world.hasFlagFn(s);
  const pts = [[x - 0.28, y - 0.3], [x + 0.28, y - 0.3], [x - 0.28, y + 0.08], [x + 0.28, y + 0.08], [x, y]];
  for (const [px, py] of pts) {
    const tx = Math.floor(px), ty = Math.floor(py);
    if (isBlocked(map, tx, ty, has) || onWater(map, px, py, has)) return false;
    const k = ty * map.w + tx;
    if (map.warpAt?.has(k) || map.chestAt?.has(k)) return false;
  }
  // たてものの 中（やねの 下）
  if ((map.roofs || []).some((r) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h)) return false;
  // 人の そば（人の 上に おりると うごけなく なる）
  if (map.npcs.some((n) => n.solid && condOk(n.show, has) && Math.abs(n.x + 0.5 - x) < 1.1 && Math.abs(n.y + 0.5 - y) < 1.1)) return false;
  return true;
}

// ちかくで おりられる ところ（まんなかから じゅんに さがす）
export function findLanding(world, s, map, x, y, r = 1.5) {
  if (landingOk(world, s, map, x, y)) return { x, y };
  let best = null;
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
    for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
      const cx = Math.floor(x) + dx + 0.5, cy = Math.floor(y) + dy + 0.5;
      const d = Math.hypot(cx - x, cy - y);
      if (d > r + 0.01 || (best && d >= best.d)) continue;
      if (landingOk(world, s, map, cx, cy)) best = { x: cx, y: cy, d };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

// 笛を ふく → 大鳥が おりてきて のる
export function callBird(world, s) {
  const r = canCall(world, s);
  if (!r.ok) {
    if (r.reason) world.send(s, { t: 'toast', text: r.reason });
    return false;
  }
  setFlying(s, true);
  s.moving = false;
  world.send(s, { t: 'fly', on: true, anim: 'call' });
  for (const m of followers(world, s)) {
    setFlying(m, true);
    world.send(m, { t: 'fly', on: true, ride: true });
  }
  world.markDirty();
  return true;
}

// おりる（x, y … おりたい ところ。ないときは 今の ところ）
export function landBird(world, s) {
  if (!s.flying) return false;
  const map = MAPS[s.map];
  const spot = findLanding(world, s, map, s.x, s.y);
  if (!spot) {
    world.send(s, { t: 'fly', on: true, refuse: true });
    world.send(s, { t: 'toast', text: 'ここには降りられない…\n（歩ける地面の上でおりよう。町や建物の中、水の上はだめ）' });
    return false;
  }
  const riders = followers(world, s).filter((m) => m.flying);
  setFlying(s, false);
  world.placeSession(s, s.map, spot.x, spot.y, s.dir, true);
  world.send(s, { t: 'fly', on: false, anim: 'land' });
  // いっしょに のっていた なかまも そばに おりる
  const offs = [[0, 1], [-1, 0], [1, 0], [0, -1], [-1, 1], [1, 1]];
  let i = 0;
  for (const m of riders) {
    let at = null;
    for (let k = 0; k < offs.length && !at; k++) {
      const [ox, oy] = offs[(i + k) % offs.length];
      if (landingOk(world, m, map, spot.x + ox, spot.y + oy)) at = { x: spot.x + ox, y: spot.y + oy };
    }
    i++;
    at = at || spot;
    world.placeSession(m, s.map, at.x, at.y, s.dir, true);
    world.send(m, { t: 'fly', on: false, anim: 'land', ride: true });
  }
  world.markDirty();
  return true;
}

// となりの 地方へ（edge: マップの はしを こえた / dest: 「別の地方へ飛ぶ」で えらんだ 地方）
export function flyRegion(world, s, edge, dest = null) {
  if (!s.flying || s.busy) return false;
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  let to;
  if (edge) {
    const e = edgeAt(s.map, s.y, map.h);
    if (!e) return false;
    if (!edgeTarget(s.map, e, has)) {
      world.send(s, { t: 'toast', text: edgeLockedText(s.map, e, has) });
      return false;
    }
    to = regionHop(s.map, s.x, s.y, e, null, has);
  } else {
    const list = regionsFrom(s.map, has);
    const pick = typeof dest === 'string' && list.includes(dest) ? dest : list[0];
    if (!pick) return false;
    to = regionHop(s.map, s.x, s.y, null, pick, has);
  }
  if (!to || !MAPS[to.map]) return false;
  const riders = followers(world, s).filter((m) => m.flying);
  world.placeSession(s, to.map, to.x, to.y, to.dir, true, { fly: true });
  riders.forEach((m, i) => world.placeSession(m, to.map, to.x + (i % 2 ? 1 : -1) * (1 + (i >> 1)) * 0.8, to.y, to.dir, true, { fly: true }));
  world.send(s, { t: 'toast', text: `${mountFor(world, s).name}は${MAPS[to.map].name}へ飛んでいく！` });
  world.broadcastPlayers();
  return true;
}

// なかまの 大鳥に いっしょに のっている（すがたを 出さない）
export function ridingAlong(world, s) {
  if (!s.flying || !s.follow) return false;
  const p = partyOf(world, s);
  const l = p && p.leader !== s.id ? world.sessions.get(p.leader) : null;
  return !!(l && l.flying && l.map === s.map && Math.hypot(l.x - s.x, l.y - s.y) < 3);
}

// クライアントからの { t: 'fly', action } を うける
export function onFly(world, s, msg) {
  switch (msg.action) {
    case 'call': return callBird(world, s);
    case 'land': return landBird(world, s);
    case 'region': return flyRegion(world, s, !!msg.edge, msg.to);
    default: return false;
  }
}

// とんでいない 人は、歩けない ところへ 入れない（とんでいる 人は とべる マップの 中なら どこでも）
export function moveAllowed(world, s, map, x, y) {
  // とんでいる 人は とべる マップの 中（ふぶきの 地方は とべる 場所の 中）なら どこでも
  if (s.flying) {
    if (!canFlyMap(map.id)) return false;
    const box = skyBox(map.id, world.hasFlagFn(s));
    // 外に いる ときは とじこめない（外へ 出る 動きだけ だめ）
    return inSkyBox(box, x, y) || !inSkyBox(box, s.x, s.y);
  }
  const tx = Math.floor(x), ty = Math.floor(y);
  const ox = Math.floor(s.x), oy = Math.floor(s.y);
  if (tx === ox && ty === oy) return true;
  const has = world.hasFlagFn(s);
  if (!isBlocked(map, tx, ty, has)) return true;
  // もう 歩けない ところに いる（むかしの セーブ など）ときは 出ていける
  return isBlocked(map, ox, oy, has);
}
