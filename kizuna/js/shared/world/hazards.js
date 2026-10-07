// あぶない 地面（第3章）
// ・ようがんの 地面（TILE_INFO の hurt）: 1歩ごとに パーティーの HP が すこし へる（1は のこる）。
//   温泉の里で もらう「氷のお守り」（フラグ HEAT_GUARD）が あれば へらない
// ・レバーで 世界が かわって、立っている マスが とおれなく なった 人は、ちかくの とおれる マスへ よける
import { MAPS, isBlocked, effectiveTile } from '../maps/index.js?v=1f8c4e9d1fb7';
import { TILE_INFO } from '../tiles.js?v=1f8c4e9d1fb7';
import { computeStats } from '../stats.js?v=1f8c4e9d1fb7';
import { partyOf } from './party.js?v=1f8c4e9d1fb7';
import { wagonChars } from './wagon.js?v=1f8c4e9d1fb7';

export const HEAT_GUARD = 'c3_heatguard';
// 1歩で へる HP（さいだいHPの わりあい。すくなくても 2）
export const LAVA_HURT = 0.04;

export function lavaDamage(maxHp) {
  return Math.max(2, Math.round(maxHp * LAVA_HURT));
}

// あるいて 入った マスが あぶない 地面なら ダメージ（へった ときは true）
export function stepHazard(world, s, tx, ty) {
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  const tile = effectiveTile(map, tx, ty, has);
  if (!TILE_INFO[tile]?.hurt || has(HEAT_GUARD)) return false;
  const hurtChar = (c) => {
    if (!c || c.hp <= 1) return 0;
    const d = Math.min(c.hp - 1, lavaDamage(computeStats(c).maxHp));
    c.hp -= d;
    return d;
  };
  const dmg = hurtChar(s.char);
  // リーダーと いっしょに 歩く なかま（酒場の なかま・ゲスト）も
  const p = partyOf(world, s);
  if (p && p.leader === s.id) {
    for (const sup of p.supports) hurtChar(sup.char);
    for (const g of p.guests) hurtChar(g.char);
    for (const ch of wagonChars(world, p)) hurtChar(ch);
  }
  world.send(s, { t: 'hurt', kind: 'lava', dmg });
  world.sendSelf(s);
  if (p) world.sendParty(p);
  world.markDirty();
  return true;
}

// (x, y) から いちばん ちかい とおれる マス（なければ null）
export function nearestFree(map, x, y, has, limit = 400) {
  const sx = Math.floor(x), sy = Math.floor(y);
  if (!isBlocked(map, sx, sy, has)) return { x: sx, y: sy };
  const seen = new Set([sy * map.w + sx]);
  const q = [[sx, sy]];
  for (let head = 0; head < q.length && head < limit; head++) {
    const [cx, cy] = q[head];
    for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h) continue;
      const k = ny * map.w + nx;
      if (seen.has(k)) continue;
      seen.add(k);
      if (!isBlocked(map, nx, ny, has) && !map.warpAt?.has(k)) return { x: nx, y: ny };
      q.push([nx, ny]);
    }
  }
  return null;
}

// owner の 世界に いる 人（本人と、さそわれて 手伝っている なかま）で、とおれない マスに いる 人を よける
export function unstickAll(world, owner) {
  for (const s of world.sessions.values()) {
    if (!s.inWorld || s.flying) continue;
    if (s !== owner && world.hostOf?.(s) !== owner) continue;
    const map = MAPS[s.map];
    if (!map) continue;
    const has = world.hasFlagFn(s);
    if (!isBlocked(map, Math.floor(s.x), Math.floor(s.y), has)) continue;
    const to = nearestFree(map, s.x, s.y, has);
    if (to) world.placeSession(s, s.map, to.x + 0.5, to.y + 0.5, s.dir, true);
  }
}
