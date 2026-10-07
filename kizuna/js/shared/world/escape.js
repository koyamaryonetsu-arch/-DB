// みちびきの糸（サーバーの きまり）: 洞窟・塔の 中から、入ってきた 入り口の 外へ もどる
//   データは data/escape.js
//
// どこへ もどるか（新しい 洞窟でも データを たさずに うごく ように）
// ・宝の洞窟（'tm_…'）… 地図の 場所（ほった 穴の そば）
// ・ほかの 洞窟・塔 … ワープを たどって、フィールドへ 出る 出口を さがす（何階でも）。
//   出口が いくつも ある ときは、入ってきた 場所（c.dungeonFrom）に いちばん 近い 出口
// ・出口が 見つからない（イベントで 入った 場所 など）ときは、入る まえに いた 場所へ
//
//   c.dungeonFrom … フィールドから 洞窟に 入った ときの 外の 場所 { map, x, y, dir, in: 入った 洞窟 }
//                   （placeSession で おぼえる。セーブに のこるので 読みこみなおしても 使える）
import { MAPS } from '../maps/index.js?v=140b3d4eb1e5';
import { ITEMS } from '../data/items.js?v=140b3d4eb1e5';
import { itemCount, removeItem } from '../stats.js?v=140b3d4eb1e5';
import { warpParty } from './travel.js?v=140b3d4eb1e5';
import { treasureExitPoint } from './treasure.js?v=140b3d4eb1e5';

// 糸が 使える マップ（洞窟・塔・宝の洞窟。カジノや お城などの たてものの 中は のぞく）
export function isDungeonMap(m) {
  return !!m && m.kind === 'dungeon' && !m.indoor;
}

// world.placeSession から よぶ: フィールドから 洞窟へ 入った ときの 場所を おぼえる（外に 出たら わすれる）
export function noteDungeonEntry(s, from, toMap) {
  const c = s?.char;
  if (!c || !from || from.map === toMap) return;
  const a = MAPS[from.map], b = MAPS[toMap];
  if (!b) return;
  if (isDungeonMap(b)) {
    if (a && !isDungeonMap(a) && Number.isFinite(from.x) && Number.isFinite(from.y)) {
      c.dungeonFrom = { map: from.map, x: from.x, y: from.y, dir: from.dir || 'down', in: toMap };
    }
  } else if (c.dungeonFrom) delete c.dungeonFrom;
}

// ワープで つながっている 洞窟の 階（今の 階から 近い じゅん）と、フィールドへの 出口
function chainOf(mapId) {
  const floors = [mapId];
  const seen = new Set(floors);
  const exits = [];
  for (let i = 0; i < floors.length && i < 64; i++) {
    for (const w of MAPS[floors[i]]?.warps || []) {
      const to = w?.to;
      const m = to && MAPS[to.map];
      if (!m) continue;
      if (isDungeonMap(m)) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          floors.push(m.id);
        }
      } else if (!exits.some((e) => e.map === to.map && Math.hypot(e.x - to.x, e.y - to.y) < 1.5)) {
        exits.push({ map: to.map, x: to.x, y: to.y, dir: to.dir || 'down' });
      }
    }
  }
  return { floors: seen, exits };
}

// もどる 場所（{ map, x, y, dir }）。わからなければ null
export function dungeonExit(world, s) {
  const m = MAPS[s?.map];
  if (!isDungeonMap(m)) return null;
  // 宝の洞窟: 地図の 場所（world/treasure.js）
  if (m.tm) return treasureExitPoint(m.id);
  const { floors, exits } = chainOf(m.id);
  const from = s.char?.dungeonFrom;
  const fromOk = from && MAPS[from.map] && !isDungeonMap(MAPS[from.map]) && (!from.in || floors.has(from.in));
  if (exits.length) {
    if (fromOk) {
      const near = exits.filter((e) => e.map === from.map).sort((p, q) => Math.hypot(p.x - from.x, p.y - from.y) - Math.hypot(q.x - from.x, q.y - from.y))[0];
      if (near) return near;
    }
    return exits[0];
  }
  return fromOk ? { map: from.map, x: from.x, y: from.y, dir: from.dir || 'down' } : null;
}

// みちびきの糸・帰り道の羽が 使えない 場所（map.noEscape。王家のピラミッド）の ことば
export function noEscapeText(name) {
  return `${name}を使おうとした…。\nしかし、ふしぎな力にはばまれて、使えない！\n（ピラミッドの中では、来た道を歩いてもどろう）`;
}

// メニューの「道具」→「使う」（world/services.js の useItem から）。reply(ok, text)
export function useEscapeItem(world, s, id, reply) {
  const c = s.char;
  const it = ITEMS[id];
  if (itemCount(c, id) < 1) return reply(false, '持っていない');
  const here = MAPS[s.map];
  if (!isDungeonMap(here)) return reply(false, `ここでは使えない。\n（${it.name}は、洞窟や塔の中で使う道具）`);
  // 王家のピラミッド（第4章）: 糸は 使えない（道具は へらない）
  if (here.noEscape) return reply(false, noEscapeText(it.name));
  const to = dungeonExit(world, s);
  if (!to) return reply(false, `${it.name}を使った！\nしかし、糸がどこにもつながっていない…`);
  removeItem(c, id, 1);
  // 「ついていく」なかまも いっしょに（ルーラ・帰り道の羽と おなじ。travel.js）
  warpParty(world, s, to);
  return reply(true, `${c.name}は${it.name}を使った！\n糸をたどって、${here.name.split('　')[0]}の外へもどってきた！`);
}
