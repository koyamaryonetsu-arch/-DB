// 第3部 第1章 第3幕「さかさのピラミッド」の しくみ「さかさの 台」と「たての ふきぬけ」の 計算だけ（サーバー・画面・テストが 同じ 物を 使う）
// ※ ネタバレ注意（docs/plan-part3.md の 11-3）
// ・向きは 人ごと（ふつう … ゆかを 歩く / さかさ … 天じょうを 歩く）。セーブは char.c9cFlip（さかさの 時だけ 1）
//   マップの とびら（gate）の フラグ '@flip' で、その 人の 向きの マスに なる（ゆかの あな ⇄ 天じょう・ぶら下がる 石 ⇄ 下を 通れる・流れる 砂が 逆）
// ・さかさの 台（ふむと 向きが かわる）・ふきぬけ（ふつうは 1つ 下の 階へ・さかさは 1つ 上の 階へ「落ちる」）
// ・階を かわると 向きは ふつうに もどる（着いた 所で もう 一度 落ちない。上へ 行くには、その 階の 台で また さかさに なる）
// ほかの ファイルを ほとんど 読まない（maps・world・client・test の どこからでも 読める）
import { T, TILE_INFO } from '../tiles.js?v=f8927db0fd05';
import { C9C_PYR_MAPS, C9C_MAP } from './c9c-flags.js?v=f8927db0fd05';

export const FLIP_FLAG = '@flip'; // その 人の 向きが さかさ（world.js の hasFlagFn・client/field.js の hasFlag）
export const isPyrC = (mapId) => C9C_PYR_MAPS.includes(mapId);
// その 人の 向き（char）
export const flipOf = (c) => !!c?.c9cFlip;
// 世界の フラグに 向きを まぜる（テスト・とく 道具）
export const withFlip = (has, flip) => (f) => (f === FLIP_FLAG ? !!flip : has(f));

// ふきぬけ（ふつうの 時 C9C_SHAFT・さかさの 時 C9C_SHAFT_UP）・さかさの 台
export const isShaftTile = (t) => t === T.C9C_SHAFT || t === T.C9C_SHAFT_UP;
export const isPadTile = (t) => t === T.C9C_PAD;

// ふきぬけの 行き先（上の 階・下の 階。1階から 下へ 落ちると 岸 … 帰り道）
//   pos … 階の 着く 所（maps/c9c-rows.js の PYR_C_POS）。river … 岸の 着く 所
export function shaftDest(mapId, flip, pos, river) {
  const i = C9C_PYR_MAPS.indexOf(mapId);
  if (i < 0) return null;
  if (flip) {
    const up = C9C_PYR_MAPS[i + 1];
    return up ? { map: up, ...pos[up].up, dir: 'up' } : null;
  }
  const down = C9C_PYR_MAPS[i - 1];
  if (down) return { map: down, ...pos[down].down, dir: 'down' };
  return { map: C9C_MAP.river, ...river, dir: 'left' };
}

// ───── とく 道具（テスト・設計の しらべ）─────
// その 階で 歩いて・流されて 行ける 所（[x, y, 向き] の じょうたい）
//   has … 世界の フラグ / isBlockedFn(map, x, y, has) … maps/index.js の isBlocked / effFn … effectiveTile
//   台に 入ると 向きが かわる。ふきぬけに 入ると そこで おわり（shafts に { x, y, flip }）。流れる 砂は のった 先へ
const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
export function flipReach(map, start, flip0, has, isBlockedFn, effFn) {
  const W = map.w;
  const key = (x, y, f) => (y * W + x) * 2 + (f ? 1 : 0);
  const seen = new Set();
  const stops = [];
  const shafts = [];
  const pits = [];
  const pads = [];
  const q = [];
  const warpAt = (x, y) => map.warpAt?.get(y * W + x);
  // (x, y) に 入った: 台なら 向きが かわる・流れる 砂は 運ばれる
  const enter = (x, y, f) => {
    for (let guard = 0; guard < 200; guard++) {
      const h = withFlip(has, f);
      const t = effFn(map, x, y, h);
      if (isShaftTile(t)) { shafts.push({ x, y, flip: f }); return null; }
      if (warpAt(x, y)) { pits.push({ x, y, flip: f }); return null; }
      if (isPadTile(t)) { pads.push({ x, y, flip: f }); return [x, y, !f]; }
      const d = TILE_INFO[t]?.flow;
      if (!d) return [x, y, f];
      const nx = x + d[0], ny = y + d[1];
      if (isBlockedFn(map, nx, ny, h)) return [x, y, f];
      x = nx; y = ny;
    }
    return [x, y, f];
  };
  const push = (r) => {
    if (!r) return;
    const k = key(r[0], r[1], r[2]);
    if (seen.has(k)) return;
    seen.add(k);
    stops.push(r);
    q.push(r);
  };
  push([start.x, start.y, !!flip0]);
  for (let i = 0; i < q.length; i++) {
    const [x, y, f] = q[i];
    const h = withFlip(has, f);
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || isBlockedFn(map, nx, ny, h)) continue;
      if (map.chestAt?.has(ny * W + nx)) continue;
      if (map.npcs?.some((n) => n.x === nx && n.y === ny && n.solid !== false && (!n.show || false))) continue;
      push(enter(nx, ny, f));
    }
  }
  return { stops, shafts, pits, pads, seen: (x, y, f) => seen.has(key(x, y, f)) };
}
