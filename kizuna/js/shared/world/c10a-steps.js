// 第3部 第2章 第1幕「赤と緑」（A: 世界と 物語）の しくみ「溶岩に 追われる」（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13-4）
// ・赤の 音を 取ると 始まる（フラグ c10_red_run。世界の もちぬし〈パーティーなら リーダー〉の フラグ）。古い 道 2階 → 1階 → 火口へ かけ上がる
// ・溶岩は 人ごと（s.c10Lava。セーブしない）。階に 入ると 下の はしから 3びょうに 1だん（マップの 行）上がる
//   場面・話して いる 間（s.busy）・メニューを 開いて いる 間（s.c10Hold。画面の { t:'menu', action:'c10Hold' }）・回線が 切れて いる 間は 止まる
// ・追いつかれると その 階の 入口（下り 階段の となり）に もどって やり直し（ダメージも お金も へらない。溶岩も その 階の はじめに もどる）
//   3回 追いつかれると おそく なる（5びょうに 1だん。小さい 子の ため。回数は キャラごと・にげ終わるまで）
// ・家族で 遊ぶと 1人ずつ にげる（追いつかれた 人だけ もどる）。全員が 古い 道から 出て、もちぬしが 火口に いると 終わり（台本 c10r_out）
// ・回線が 切れた 時: その 階の 入口から やり直し（つなぎなおすと 入口へ）
// ・にげて いる 間は 魔物が 出ない（map.symBlock）。みちびきの糸・帰り道の羽は 使えない（map.noEscape）
import { MAPS } from '../maps/index.js?v=068632fa6d51';
import {
  C10A_RED, C10A_MAP, C10A_RED_MAPS, C10A_RUN_MAPS, C10A_LAVA_MS, C10A_LAVA_SLOW_MS, C10A_LAVA_SLOW_AFTER, lavaStageOfGap,
} from '../maps/c10a-flags.js?v=068632fa6d51';
import { C10A_POS, CRATER_STAIRS10A } from '../maps/c10a-rows.js?v=068632fa6d51';
import { partyOf } from './party.js?v=068632fa6d51';
import { runScript } from './scripts.js?v=068632fa6d51';

const RUN = C10A_RED.run;
// 階の 入口（下から 上がって 来た 所。下り 階段の 1つ 上）
export const runEntrance10a = (mapId) => {
  const D = C10A_POS[mapId]?.down;
  return D ? { x: D.x + 0.5, y: D.y - 0.5 } : null;
};
export const isRunMap10a = (mapId) => C10A_RUN_MAPS.includes(mapId);
// その 人が 溶岩に 追われて いる 階に いるか（もちぬしの フラグ c10_red_run）
export const runningHere10a = (world, s) => !!s?.inWorld && isRunMap10a(s.map) && !!world.worldFlags(s)?.[RUN];
const interval10a = (n) => (n >= C10A_LAVA_SLOW_AFTER ? C10A_LAVA_SLOW_MS : C10A_LAVA_MS);
const catchesOf = (world, s) => (world.c10Catches || (world.c10Catches = new Map())).get(s.char?.id) || 0;
const setCatches = (world, s, n) => (world.c10Catches || (world.c10Catches = new Map())).set(s.char?.id, n);
// 溶岩の 上の はしの 行（この 行から 下は 溶岩）と 人の 行の 間の だん（1 いじょうなら まだ 大丈夫）
export const lavaGap10a = (lava, y) => Math.floor(lava) - Math.floor(y);

// 階に 入った（world.js の placeSession）。階段・テレポートで 入った しるし（つなぎなおしと 見分ける）
export function noteC10aMove(world, s, mapId) {
  s.c10Arrive = mapId;
  if (s.c10Lava && s.c10Lava.map !== mapId) s.c10Lava = null;
}
// メニューを 開いて いる 間は 止まる（world.js の onMenu の c10Hold）
export function c10aHold(world, s, on) {
  s.c10Hold = !!on;
}

function newLava(world, s) {
  const m = MAPS[s.map];
  s.c10Lava = { map: s.map, lava: m.h, acc: 0 };
  return s.c10Lava;
}
function toEntrance(world, s) {
  const E = runEntrance10a(s.map);
  if (E) world.placeSession(s, s.map, E.x, E.y, 'up', true);
  s.c10Arrive = s.map;
}

// まいフレーム（world.js の tick。snap より 前）
export function tickC10a(world, dt) {
  lastWorld = world;
  for (const s of world.sessions.values()) {
    if (!runningHere10a(world, s)) {
      if (s.c10Lava) s.c10Lava = null;
      // にげ終わった（もちぬしの c10_red_run が 消えた）: 追いつかれた 回数を わすれる
      if (world.c10Catches?.has(s.char?.id) && !world.worldFlags(s)?.[RUN]) world.c10Catches.delete(s.char.id);
      continue;
    }
    if (s.away) { s.c10Lost = true; continue; }
    let st = s.c10Lava;
    if (!st || st.map !== s.map) {
      // 回線が 切れて つなぎなおした・ゲームを はじめから 入った → その 階の 入口から
      if (s.c10Arrive !== s.map) toEntrance(world, s);
      st = newLava(world, s);
    } else if (s.c10Lost) {
      toEntrance(world, s);
      st = newLava(world, s);
    }
    s.c10Lost = false;
    // 魔物は 来ない（にげて いる 間）
    if (s.invuln < 400) s.invuln = 400;
    if (s.busy || s.c10Hold) continue;
    const iv = interval10a(catchesOf(world, s));
    st.acc += dt;
    while (st.acc >= iv) { st.acc -= iv; st.lava -= 1; }
    if (lavaGap10a(st.lava, s.y) <= 0) caught(world, s);
  }
  // 終わり: もちぬしが 火口に いて、パーティーの だれも 古い 道に いない
  for (const s of world.sessions.values()) {
    if (!s.inWorld || s.away || s.busy || !s.char?.flags?.[RUN] || s.map !== CRATER_STAIRS10A.map) continue;
    const p = partyOf(world, s);
    const ids = p ? p.members : [s.id];
    const left = ids.map((id) => world.sessions.get(id)).some((m) => m?.inWorld && C10A_RED_MAPS.includes(m.map));
    if (!left) runScript(world, s, 'c10r_out');
  }
}
function caught(world, s) {
  const n = catchesOf(world, s) + 1;
  setCatches(world, s, n);
  toEntrance(world, s);
  newLava(world, s);
  const slow = n === C10A_LAVA_SLOW_AFTER;
  world.send(s, { t: 'toast', text: `あちち！ようがんに、追いつかれた…！\nこの階の、はじめから、もう一度！${slow ? '\n（ようがんの、いきおいが、少し弱まった）' : ''}` });
  world.markDirty();
}

// snap に のせる その 人の 溶岩（にげて いる 時だけ）: { lava … 上の はしの 行, next … 次に 上がるまでの ms, iv … 間, n … 追いつかれた 回数 }
export function c10aSnap(world, s) {
  const st = s.c10Lava;
  if (!st || st.map !== s.map || !runningHere10a(world, s)) return null;
  const n = catchesOf(world, s);
  const iv = interval10a(n);
  return { lava: st.lava, next: Math.max(0, iv - st.acc), iv, n, hold: s.busy || s.c10Hold ? 1 : 0 };
}
// 画面の 状態 lavaStage（0〜3。F班の 曲。client/c10a-view.js も 同じ 計算）
export const lavaStage10a = (lava, y) => lavaStageOfGap(lavaGap10a(lava, y));

// ───── 古い 道: にげて いる 人が いる 階は 魔物が 出ない・みちびきの糸と 帰り道の羽が 使えない ─────
const runningOn = (world, mapId) => { for (const s of world.sessions.values()) if (s.map === mapId && runningHere10a(world, s)) return true; return false; };
let lastWorld = null;
for (const id of C10A_RUN_MAPS) {
  const m = MAPS[id];
  if (!m) continue;
  m.symBlock = (world) => { lastWorld = world; return runningOn(world, id); };
  Object.defineProperty(m, 'noEscape', { configurable: true, get: () => !!lastWorld && runningOn(lastWorld, id) });
  m.noEscapeHint = 'ようがんが、せまっている！\n走って、上へ、にげよう';
}
export { C10A_MAP };
