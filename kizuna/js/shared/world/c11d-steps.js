// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20-4）
// ・1〜3階は 前の 幕の しくみの まま（world/c11a-steps.js・c11b-steps.js・c11c-steps.js が マップの c11aCons・c11b・c11c を 見て 動く）
// ■ 音の 間（4階。map.c11dPads）: 7色の 台を ふむと その 音が 鳴る
// ・スピカの 歌の じゅん（maps/c11d-flags.js の C11D_SONG_ORDER）に 7つ 鳴らすと、音の とびらが 開く（台本 c11d_pads_done。c11d_t4）
// ・じゅんは パーティーで 同じ（world.c11dSt。パーティーの id ごと。セーブしない）。家族で 分かれて ふんでも よい
// ・まちがえたら はじめから（ばつ なし）。まちがえた 回数が C11D_PAD_HELP に なると、じゅんが 光る（スピカが 口ずさむ。snap の c11d.h）
// ・パーティーの だれも 音の 間に いなく なると わすれる（入り直すと はじめから。まちがえた 回数も）
// ■ 回線が 切れて もどった 時: 何も しない（音の 間は どこに 立っても よい）
import { MAPS } from '../maps/index.js?v=b63ba00e848c';
import { padAt11d } from '../maps/c11d.js?v=b63ba00e848c';
import { C11D, C11D_PADS, C11D_SONG_ORDER, C11D_PAD_HELP } from '../maps/c11d-flags.js?v=b63ba00e848c';
import { SCRIPTS } from '../data/story.js?v=b63ba00e848c';
import { ScriptRun, scriptCtx } from './scripts.js?v=b63ba00e848c';

const SP = 'スピカ';
const partyKey = (s) => s?.partyId || s?.id;
const store = (world) => world.c11dSt || (world.c11dSt = new Map());
const keyOf = (s) => `${partyKey(s)}|${s.map}`;
const roomOf = (s) => MAPS[s?.map]?.c11dPads || null;
function stateOf(world, s, make = false) {
  if (!roomOf(s)) return null;
  let st = store(world).get(keyOf(s));
  if (!st && make) { st = { n: 0, miss: 0 }; store(world).set(keyOf(s), st); }
  return st || null;
}
// 同じ 音の 間に いる 同じ パーティーの 人
const mates = (world, s) => [...world.sessions.values()].filter((m) => m.inWorld && m.char && m.map === s.map && partyKey(m) === partyKey(s));
// 次に ふむ 台の 番号
export const nextPad11d = (n) => C11D_SONG_ORDER[n] ?? -1;
// テスト・台本: その パーティーの 今（{ n: 鳴らした 数, miss: まちがえた 回数 } か null）
export const padState11d = (world, s) => stateOf(world, s);

function tell(world, s, text, sfx) {
  for (const m of mates(world, s)) world.send(m, { t: 'toast', ...(sfx ? { sfx } : {}), text: m === s ? text : `${s.char.name}が、${text}` });
}
// 7つ そろった: その 階に いる パーティーで 見る 台本
function finish(world, s) {
  const owner = world.hostOf?.(s) || s;
  const fn = SCRIPTS.c11d_pads_done;
  const steps = fn ? fn(scriptCtx(s, owner, world)) : [];
  if (!steps.length) return;
  const parts = [s, ...mates(world, s).filter((m) => m !== s && !m.busy && !m.away)];
  new ScriptRun(world, s, parts, steps, { scriptId: 'c11d_pads_done', owner }).start();
}

// ───── 歩いた（world.js の onEnterTile から）: 音の 台を ふんだ ─────
export function stepC11d(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11dPads) return false;
  const i = padAt11d(map, tx, ty);
  if (i < 0) return false;
  const P = C11D_PADS[i];
  const has = world.hasFlagFn(s);
  if (has(C11D.t4)) {
    world.send(s, { t: 'toast', text: `♪ ${P.note}――\n${P.c}の音の台が、やさしく、鳴った。` });
    return false;
  }
  const st = stateOf(world, s, true);
  if (i === nextPad11d(st.n)) {
    st.n++;
    st.at = world.now?.() ?? Date.now();
    st.last = i;
    if (st.n >= C11D_SONG_ORDER.length) {
      st.n = 0;
      tell(world, s, `♪ ${P.note}――\n7つの音が、ひとつの、歌に、なった！`, 'spell');
      if (!s.busy) finish(world, s);
      return true;
    }
    tell(world, s, `♪ ${P.note}――（${st.n}つめ）\n${P.c}の音の台が、きれいに、鳴った！`);
    world.markDirty?.();
    return false;
  }
  // まちがえた: はじめから（ばつ なし）
  const had = st.n;
  st.n = 0;
  st.last = -1;
  st.miss++;
  const help = st.miss === C11D_PAD_HELP ? `\n${SP}「…ら、ら、ら…♪」\n（${SP}が、口ずさんでいる。台のじゅんが、光った！）` : '';
  tell(world, s, `♪ ${P.note}…？\n${had ? '歌が、とぎれてしまった。はじめから、もう一度。' : '歌の、はじめの音では、ないみたい。'}${help}`, 'buzz');
  return false;
}

// ───── まいフレーム: だれも いなく なった パーティーの 音の 間を わすれる ─────
export function tickC11d(world) {
  if (!world.c11dSt?.size) return;
  const here = new Set();
  for (const s of world.sessions.values()) if (s.inWorld && roomOf(s)) here.add(keyOf(s));
  for (const k of [...world.c11dSt.keys()]) if (!here.has(k)) world.c11dSt.delete(k);
}

// snap に のせる（音の 間に いる 時だけ）: { n: 鳴らした 数, nx: 次の 台, h: 1（じゅんが 光る）, d: 1（とびらが 開いた）}
export function c11dSnap(world, s) {
  if (!roomOf(s)) return null;
  if (world.hasFlagFn(s)(C11D.t4)) return { n: 0, d: 1 };
  const st = stateOf(world, s);
  const n = st?.n || 0;
  return { n, nx: nextPad11d(n), ...(st && st.miss >= C11D_PAD_HELP ? { h: 1 } : {}) };
}

// 台本から つかう（world.c11d。data/story-c11d.js）: 音の 間を はじめに もどす
export const C11D_API = {
  pads: padState11d,
  reset: (world, s) => { const st = stateOf(world, s); if (st) { st.n = 0; st.miss = 0; } },
};
