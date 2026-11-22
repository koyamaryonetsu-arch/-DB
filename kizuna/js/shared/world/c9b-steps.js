// 第3部 第1章 第2幕「鉱山の底の先」（A: 世界と 物語）の 明かりを 広げる 探検（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3.md の 10-2）
// ・水晶の 柱は フラグ（c9_pillar1〜6。世界の もちぬし〈パーティーなら リーダー〉に 立つ。家族で 手分け できる・明かりは みんなで 同じ）
// ・光る こけは 第1幕の 光の輪の しくみ（world/c9a-steps.js の stepC9a。map.c9a の mossSteps = 40。パーティーで 1つ・セーブしない）
// ・魔物（map.symBlock）: ふつうの 魔物は ともった 柱の 明かりの 中だけ・大ミミズ（MONSTERS[種].darkOnly）は 暗い 所だけ
//   （柱・こけ・村の 明かりの 中に 入らない・出ない・光ったら 消える）。柱を ともすほど 安全
import { MAPS } from '../maps/index.js?v=98a59fb17475';
import { MONSTERS } from '../data/monsters.js?v=98a59fb17475';
import { brightCells9b, mapCells9b, pillarStage } from '../maps/c9b-light.js?v=98a59fb17475';
import { C9B_MAP } from '../maps/c9b-flags.js?v=98a59fb17475';
import { c9aLitAt } from './c9a-steps.js?v=98a59fb17475';

// その マップに いる 人の 世界の フラグ（だれか 1人でも 柱を ともして いれば、その 明かりは ある）
function flagSets(world, mapId) {
  const out = [];
  const seen = new Set();
  for (const s of world.sessions.values()) {
    if (!s.inWorld || s.map !== mapId) continue;
    const owner = world.hostOf?.(s) || s;
    if (seen.has(owner.id)) continue;
    seen.add(owner.id);
    out.push(world.hasFlagFn(s));
  }
  return out;
}
// 柱・村の 明かりで 明るい か（魔物の ための 明るさ）
export function underBrightAt(world, x, y) {
  const k = y * MAPS[C9B_MAP.under].w + x;
  return flagSets(world, C9B_MAP.under).some((has) => brightCells9b(has).has(k));
}
// 大ミミズに とっての 明るさ（柱・村の 明かり・村の 小さな 明かり・光って いる こけ）
export const underLitAt = (world, x, y) => flagSets(world, C9B_MAP.under).some((has) => mapCells9b(has).has(y * MAPS[C9B_MAP.under].w + x)) || c9aLitAt(world, C9B_MAP.under, x, y);

export function underBlocked(world, sym, x, y) {
  const fx = Math.floor(x), fy = Math.floor(y);
  if (MONSTERS[sym?.sp]?.darkOnly) return underLitAt(world, fx, fy);
  return !underBrightAt(world, fx, fy);
}
if (MAPS[C9B_MAP.under]) MAPS[C9B_MAP.under].symBlock = (world, sym, x, y) => underBlocked(world, sym, x, y);


// ともした 柱の 数（0〜6。画面の pillarStage と おなじ）
export const pillarStageOf = (world, s) => pillarStage(world.hasFlagFn(s));
