// 第3部 第1章 第1幕「星ふるえの夜」の 星の石の地下道（光の輪）の とき方を さがす（テストと 階を 作る ときに 使う。ゲームでは 使わない）
// じょうたい … 場所・光って いる こけ（のこりの 歩数。つながると ずっと）・とびらが 開いたか
// うごき … 歩く（1歩で 光の 計算 maps/c9a-light.js の stepLight。サーバーと 同じ）・見えない 穴に 落ちると その 階の 入口へ
// ひとりで あそぶ（こけを ふむのは 自分だけ）
import { MAPS, isBlocked, condOk } from '../public/js/shared/maps/index.js';
import { newLight, stepLight, doorOpen, MOSS_STEPS } from '../public/js/shared/maps/c9a-light.js';

const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ME = 'me';

// mapId … c9a_b1〜c9a_b4・start … { x, y }・goal(x, y) … ゴールの マス（入る 前に 見る）
// flags0 … はじめから ある フラグ・mossSteps … こけが 消えるまでの 歩数（わざと 短く して ためす）
// strict … つながって いない こけは すぐ 消える ものと して さがす（きびしい 見方。これで とければ 本当の ゲームでも 必ず とける。
//   つながって いない こけが 光って いても じゃまには ならない ため）。じょうたいが 少なく なるので 広い 階も さがしきれる
// noLight … こけが 光らない（光を つながないと とびらが 開かない ことを たしかめる）
export function solveCave({ mapId, start, goal, flags0 = [], mossSteps = MOSS_STEPS, maxStates = 300000, noLight = false, strict = false }) {
  const map = MAPS[mapId];
  const info = map.c9a;
  const doorFlag = map.c9aDoorFlag;
  const entry = { x: Math.floor(map.c9aEntry.x), y: Math.floor(map.c9aEntry.y) };
  const holes = new Set(info.holes);
  const litStr = (lit) => [...lit].map(([k, e]) => `${k}:${e.left === Infinity ? 'i' : e.left}`).sort().join(',');
  const s0 = { x: start.x, y: start.y, open: false, lit: new Map() };
  const key = (s) => `${s.x},${s.y}|${s.open ? 1 : 0}|${litStr(s.lit)}`;
  const seen = new Map([[key(s0), null]]);
  const q = [s0];
  let goalHit = null, opened = false, fell = 0, truncated = false;
  while (q.length) {
    if (seen.size > maxStates) { truncated = true; break; }
    const s = q.shift();
    const has = (f) => flags0.includes(f) || (s.open && f === doorFlag);
    for (const [dx, dy] of D4) {
      let x = s.x + dx, y = s.y + dy;
      if (isBlocked(map, x, y, has)) continue;
      if (map.chestAt.has(y * map.w + x)) continue;
      if (map.npcs.some((n) => n.solid && condOk(n.show, has) && Math.floor(n.x) === x && Math.floor(n.y) === y)) continue;
      if (goal(x, y, s)) { goalHit = { ...s, gx: x, gy: y }; break; }
      if (map.warpAt.has(y * map.w + x)) continue;
      const st = { lit: new Map([...s.lit].map(([k, e]) => [k, { ...e }])), ver: 0 };
      if (!noLight) {
        stepLight(info, st, x, y, ME);
        if (mossSteps !== MOSS_STEPS) for (const e of st.lit.values()) if (e.left !== Infinity && e.left > mossSteps) e.left = mossSteps;
        if (strict) for (const [k, e] of st.lit) if (e.left !== Infinity) st.lit.delete(k);
      }
      let open = s.open;
      if (!open && doorFlag && doorOpen(info, st.lit)) { open = true; opened = true; }
      if (holes.has(y * map.w + x)) { fell++; x = entry.x; y = entry.y; }
      const ns = { x, y, open, lit: st.lit };
      const k = key(ns);
      if (seen.has(k)) continue;
      seen.set(k, s);
      q.push(ns);
    }
    if (goalHit) break;
  }
  return { goal: goalHit, opened, fell, truncated, states: seen.size };
}

// ゴール: 下り 階段・ためしの 台本の マス
export const downGoal = (P) => (x, y) => P.down && x === P.down.x && y === P.down.y;
export const rectGoal = (r) => (x, y) => x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h;
