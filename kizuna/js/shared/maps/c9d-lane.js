// 第3部 第1章 第4幕「星のはかば」の しくみ「スピカと ふた手に」（A: 世界と 物語）の 計算だけ（サーバー・画面・テストが 同じ 物を 使う）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12-2）
// ・明かりは スピカ（まわり 5マス）。スピカから はなれた 人は 自分の まわり 1マス半 しか 見えない
// ・ひびきの石（2つ〈こだまは 3つ〉で 1組）: 組の 石が ぜんぶ 同時に 鳴って いると 橋（とびら）が 開く。開くと 開いた まま（フラグ c9_echo1〜5）
//   鳴らし方 … スピカに 歌って もらう（スピカが そこに のこって いる 間 鳴りつづける）/ 星の音さを 鳴らす（20秒）
// ・スピカと いっしょの 人が 石を 鳴らすと、向こうの 道の ランプが しばらく 光る（LAMP_MS）
// ・スピカの いる 所: 石に のこって いれば その 石の 前・いなければ リーダーの そば
// ほかの ファイルを ほとんど 読まない（maps・world・client・test の どこからでも 読める）
import { C9D_SPICA_LIGHT, C9D_APART_LIGHT, C9D_FORK_SECONDS } from './c9d-flags.js?v=6a6b763889f6';

export const FORK_MS9D = C9D_FORK_SECONDS * 1000; // 音さで 鳴らした 石が 鳴る 時間
export const LAMP_MS9D = 30000; // 向こうの 道の ランプが 光る 時間
export const LIGHT_SPICA9D = C9D_SPICA_LIGHT; // 5マス
export const LIGHT_APART9D = C9D_APART_LIGHT; // 1マス半
export const LIGHT_LAMP9D = 2.5; // 光った ランプ
export const LIGHT_LAMP_DIM9D = 0.6; // 消えて いる ランプ（目じるし）
export const LIGHT_STONE9D = 1.2; // 鳴って いない ひびきの石（かすかに 光る。目じるし）
export const LIGHT_RING9D = 2.2; // 鳴って いる ひびきの石

export const stonesOf9d = (map) => map?.c9dStones || [];
export const stoneById9d = (map, id) => stonesOf9d(map).find((s) => s.id === id) || null;
// 組の 石（同じ echo の 番号）
export const groupOf9d = (map, echo) => stonesOf9d(map).filter((s) => s.echo === echo);
// 石の 前の 立つ 所（スピカが 歌う 所。石の 南が 立てれば 南）
export const stoneFront9d = (s) => ({ x: s.x + 0.5, y: s.y + 1.4 });
export const otherLane9d = (lane) => (lane === 'L' ? 'R' : 'L');

// 今 鳴って いる 石の id（st … { spica: { map, id } | null, forks: { id: 鳴りおわる 時 } }）
export function ringingIds9d(st, mapId, now) {
  const out = new Set();
  if (st?.spica && st.spica.map === mapId) out.add(st.spica.id);
  for (const [id, until] of Object.entries(st?.forks || {})) if (until > now) out.add(id);
  return out;
}
// 組の 石が ぜんぶ 鳴って いるか
export function groupRinging9d(map, echo, ringing) {
  const g = groupOf9d(map, echo);
  return g.length >= 2 && g.every((s) => ringing.has(s.id));
}

// スピカの いる 所（石に のこって いれば その 前。いなければ leader の そば）
export function spicaPos9d(map, spicaAt, leader) {
  if (spicaAt && spicaAt.map === map?.id) {
    const s = stoneById9d(map, spicaAt.id);
    if (s) return stoneFront9d(s);
  }
  return leader ? { x: leader.x, y: leader.y } : null;
}
// その 人が スピカと いっしょか（スピカの 明かりの 中）
export const withSpica9d = (p, sp) => !!(p && sp && Math.hypot(p.x - sp.x, p.y - sp.y) <= LIGHT_SPICA9D);

// 光の まん中と はんい（[x, y, r, しゅるい]。画面の くらやみ・魔物の 明るさ）
//   o … { spica: {x,y} | null, singing: bool, people: [{x,y}], lamps: { L: 光って いるか, R }, ringing: Set }
export function laneCenters9d(map, o) {
  const out = [];
  const L = map?.c9dLane;
  if (!L) return out;
  if (o.spica) out.push([o.spica.x - 0.5, o.spica.y - 0.5, LIGHT_SPICA9D, o.singing ? 'song' : 'spica']);
  for (const p of o.people || []) out.push([p.x - 0.5, p.y - 0.5, LIGHT_APART9D, 'me']);
  for (const lane of ['L', 'R']) {
    const on = !!o.lamps?.[lane];
    for (const q of L.lamps[lane] || []) out.push([q.x, q.y, on ? LIGHT_LAMP9D : LIGHT_LAMP_DIM9D, on ? 'lamp' : 'lampDim']);
  }
  for (const s of stonesOf9d(map)) {
    const r = o.ringing?.has(s.id);
    out.push([s.x, s.y, r ? LIGHT_RING9D : LIGHT_STONE9D, r ? 'ring' : 'stone']);
  }
  return out;
}

// 魔物（暗い 所だけを 歩く しるしの 魔物）に とっての 明るさ: スピカ・光った ランプ（人の 1マス半と 目じるしは 入れない）
export function laneBright9d(map, o, x, y) {
  const cx = x + 0.5, cy = y + 0.5;
  if (o.spica && Math.hypot(cx - o.spica.x, cy - o.spica.y) <= LIGHT_SPICA9D) return true;
  const L = map?.c9dLane;
  for (const lane of ['L', 'R']) {
    if (!o.lamps?.[lane]) continue;
    for (const q of L?.lamps[lane] || []) if (Math.hypot(cx - (q.x + 0.5), cy - (q.y + 0.5)) <= LIGHT_LAMP9D) return true;
  }
  return false;
}

// 画面へ 出す 状態 apartStage（F班の 曲。0 スピカと いっしょ・1 はなれて いる）
export const apartStage9d = (me, sp) => (me && sp && !withSpica9d(me, sp) ? 1 : 0);
