// 第3部 第1章 第3幕「さかさのピラミッド」（A: 世界と 物語）の さかさの 台と ふきぬけ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3.md の 11-3）
// ・向きは 人ごと（char.c9cFlip … さかさの 時だけ 1。world.js の hasFlagFn で '@flip'）。家族の 向きは snap の fp で 画面へ
// ・さかさの 台に 入ると 向きが かわる（その 階で さいごに ふんだ 台を char.c9cPad に おぼえる）
// ・ふきぬけに 入ると: ふつう … 1つ 下の 階へ（1階からは 岸へ）/ さかさ … 1つ 上の 階へ「落ちる」。着いた 所は ふちで、向きは ふつうに もどる
//   いっしょに 歩いて いる 家族（ついて いく 人）も つれて いく（ふきぬけ・台・あなの 上には 置かない）
// ・階を かわると 向きは ふつうに もどる（placeSession。だいほん・全めつ・ワープ でも）
// ・回線が 切れて もどった 時: 場所と 向きが 食いちがったら（その 向きでは 立てない 所）、その 階で さいごに ふんだ 台（なければ 階の 着いた 所）へ
import { MAPS, effectiveTile, isBlocked, canStand } from '../maps/index.js?v=c53292a2af59';
import { T } from '../tiles.js?v=c53292a2af59';
import { PYR_C_POS, RIVER_POS } from '../maps/c9c-rows.js?v=c53292a2af59';
import { isPyrC, isShaftTile, isPadTile, shaftDest, flipOf } from '../maps/c9c-flip.js?v=c53292a2af59';
import { C9C, C9C_MAP } from '../maps/c9c-flags.js?v=c53292a2af59';
import { partyOf } from './party.js?v=c53292a2af59';
import { runScript } from './scripts.js?v=c53292a2af59';

// 着いた 時の 場面（その 階に はじめて 来た）
const ARRIVE = { [C9C_MAP.p2]: [C9C.p2, 'c9c_p2_in'], [C9C_MAP.p3]: [C9C.p3, 'c9c_p3_in'], [C9C_MAP.p4]: [C9C.p4, 'c9c_p4_in'] };

export function setFlip(world, s, flip) {
  const c = s.char;
  if (!c || !!c.c9cFlip === !!flip) return false;
  if (flip) c.c9cFlip = 1;
  else delete c.c9cFlip;
  world.markDirty?.();
  return true;
}

// 階を かわった（placeSession の はじめ）: 向きは ふつうに・おぼえた 台も わすれる
export function noteC9cMove(world, s, mapId) {
  const c = s?.char;
  if (!c || mapId === s.map) return;
  const had = !!c.c9cFlip;
  delete c.c9cFlip;
  delete c.c9cPad;
  if (had) world.sendSelf(s); // 画面の 向きも もどす
}

// 家族を ふちの まわりへ（ふきぬけ・台・あな・ワープの 上には 置かない）
function landingNear(map, x, y, has) {
  const offs = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0], [0, 2], [0, -2]];
  for (const [ox, oy] of offs) {
    const tx = Math.floor(x) + ox, ty = Math.floor(y) + oy;
    if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) continue;
    const t = effectiveTile(map, tx, ty, has);
    if (isShaftTile(t) || isPadTile(t) || t === T.SAND_PIT || map.warpAt?.has(ty * map.w + tx)) continue;
    if (!canStand(map, tx + 0.5, ty + 0.5, has)) continue;
    return { x: tx + 0.5, y: ty + 0.5 };
  }
  return { x, y };
}

// onEnterTile から（true … 場所が かわった）
export function stepC9c(world, s, tx, ty) {
  if (!isPyrC(s.map)) return false;
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  const t = effectiveTile(map, tx, ty, has);
  if (isPadTile(t)) {
    const flip = !flipOf(s.char);
    setFlip(world, s, flip);
    s.char.c9cPad = [tx, ty];
    world.sendSelf(s);
    world.send(s, { t: 'toast', text: flip ? 'くるりん！\n上と下が、ひっくり返った！（さかさ）' : 'くるりん！\nもとの向きにもどった！（ふつう）' });
    return false;
  }
  if (!isShaftTile(t)) return false;
  const flip = flipOf(s.char);
  const dest = shaftDest(s.map, flip, PYR_C_POS, { x: RIVER_POS.gate.x - 1, y: RIVER_POS.gate.y });
  if (!dest) return false;
  const from = s.map, fx = s.x, fy = s.y;
  const land = { map: dest.map, x: dest.x + 0.5, y: dest.y + 0.5, dir: dest.dir };
  world.placeSession(s, land.map, land.x, land.y, land.dir, true);
  setFlip(world, s, false);
  world.sendSelf(s);
  world.send(s, { t: 'toast', text: flip ? 'ザザーッ…！\n砂といっしょに、上の階へ「落ちた」！' : dest.map === C9C_MAP.river ? 'ザザーッ…！\n砂のたきを落ちて、ピラミッドの岸に出た。' : 'ザザーッ…！\n砂のたきを落ちて、下の階へ。' });
  // いっしょに 歩いて いる 家族
  const p = partyOf(world, s);
  if (p && p.leader === s.id) {
    for (const sid of p.members) {
      const m = world.sessions.get(sid);
      if (!m || m === s || !m.follow || m.busy || m.away || !m.inWorld || m.map !== from || Math.hypot(m.x - fx, m.y - fy) > 12) continue;
      const pos = landingNear(MAPS[land.map], land.x + 1, land.y, () => false);
      world.placeSession(m, land.map, pos.x, pos.y, land.dir, true);
      world.sendSelf(m);
    }
  }
  const a = ARRIVE[land.map];
  if (a && !world.worldFlags(s)[a[0]]) runScript(world, s, a[1]);
  return true;
}

// 回線が 切れて もどった（world.js の onPlay。場所は もう 決まって いる）
export function c9cOnPlay(world, s) {
  if (!isPyrC(s.map)) {
    if (s.char?.c9cFlip || s.char?.c9cPad) { delete s.char.c9cFlip; delete s.char.c9cPad; }
    return false;
  }
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  if (canStand(map, s.x, s.y, has) && !isBlocked(map, Math.floor(s.x), Math.floor(s.y), has)) return false;
  const pad = s.char.c9cPad;
  const P = PYR_C_POS[s.map];
  const spot = pad ? { x: pad[0], y: pad[1] } : P.up || P.enter;
  s.x = spot.x + 0.5;
  s.y = spot.y + 0.5;
  return true;
}

// 天じょうの 宝箱は さかさの 時だけ・ゆかの 宝箱は ふつうの 時だけ（world.js の openChest）
export function c9cChestSteps(world, s, chest) {
  if (!chest?.c9cSide) return null;
  const flip = flipOf(s.char);
  if (chest.c9cSide === 'ceil' && !flip) return [['say', null, '天じょうに、さかさまの宝箱が、はりついている。\n手が、とどかない…。（さかさになれば、取れそうだ）']];
  if (chest.c9cSide === 'floor' && flip) return [['say', null, 'ずっと下のゆかに、宝箱が見える。\n手が、とどかない…。（ふつうの向きにもどれば、取れそうだ）']];
  return null;
}

// snap に のせる 家族の 向き（ピラミッドの 中で さかさの 人だけ）
export const c9cFlipSnap = (p) => (isPyrC(p.map) && p.char?.c9cFlip ? 1 : 0);
