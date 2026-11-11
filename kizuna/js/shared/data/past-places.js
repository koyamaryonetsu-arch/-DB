// 第67回: 千年前の 時代の ルーラ・帰り道の羽の 行き先（家族が 決めた: 千年前に いる 時は 千年前の 町だけ）
//   ・行った ことの ある 千年前の 町・村・里（入ると おぼえる。world.js の onMove。c.visited[id]）
//   ・前の 版で もう 行った 人は、物語の しるし（seen）で 行った ことに する
//   ・今の 時代に いる 時は 出さない（今の 町だけ。world/travel.js の warpPlaces）
import { PAST_ID, HAMLET, SPRING, C6 } from '../maps/past.js?v=d89f0f9d101a';
import { C7_FIELD, KINGDOM, C7 } from '../maps/c7-flags.js?v=d89f0f9d101a';
import { C7S_SEA, VILLAGE, C7S } from '../maps/c7s-flags.js?v=d89f0f9d101a';
import { C7I_SNOW, VILLAGE7I, C7I } from '../maps/c7i-flags.js?v=d89f0f9d101a';

const R = (p) => [p.x, p.y, p.w, p.h];
export const PAST_PLACES = {
  p_hamlet: { name: HAMLET.name, map: PAST_ID, rect: R(HAMLET), seen: C6.past },
  p_spring: { name: SPRING.name, map: PAST_ID, rect: R(SPRING), seen: C6.flow },
  p_kingdom: { name: KINGDOM.name, map: C7_FIELD, rect: R(KINGDOM), seen: C7.kingdom },
  p_nagi: { name: VILLAGE.name, map: C7S_SEA, rect: R(VILLAGE), seen: C7S.isle },
  // 第7章 第3幕: 千年前の シロガネ地方の 白雪の里（竜守りの村の はじまり）
  p_shirayuki: { name: VILLAGE7I.name, map: C7I_SNOW, rect: R(VILLAGE7I), seen: C7I.frost },
};

export const pastVisited = (c, id) => !!PAST_PLACES[id] && (!!c?.visited?.[id] || !!c?.flags?.[PAST_PLACES[id].seen]);
// 行った ことの ある 千年前の 町（ならびは 上の じゅん）
export const pastWarpTowns = (c) => Object.keys(PAST_PLACES).filter((id) => pastVisited(c, id));
// その マスの 千年前の 町（ない ときは null）
export function pastPlaceAt(mapId, x, y) {
  for (const [id, p] of Object.entries(PAST_PLACES)) {
    const [rx, ry, rw, rh] = p.rect;
    if (p.map === mapId && x >= rx && y >= ry && x < rx + rw && y < ry + rh) return id;
  }
  return null;
}
