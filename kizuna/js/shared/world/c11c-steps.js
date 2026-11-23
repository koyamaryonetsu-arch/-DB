// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19-3）
// ■ 相ぼうを 立たせる（はかりの 回ろう c11c_hall1〜3。map.c11c）
// ・アルゴルが 立って いる 台は、その 階に いる パーティーで 同じ（world.c11cSt。パーティーの id と 階 ごと。セーブしない）
//   パーティーの だれも その 階に いなく なると わすれる（入り直すと はじめの 所 ＝ 台に いない）
// ・かげの 台に 立って A … アルゴルが その 台に 来る（同じ 台なら もどって 来る）。立てる 台は 1つ（べつの 台で A → そちらへ うつる）
//   台と 同じ 色の 光の さくを、まわりの 輪の 中だけ 食べる（'@cf<g>'）。はなれると もどる
// ・スピカの 光の 橋（'@lb<g>'）: アルゴルが 近くの 台に いると 食べられて 消える
// ・見はりの カード: 通り道を 行き来する。アルゴルが 食べて いる 間だけ 止まる。動いて いる カードに ふれると 通り道の 入口に もどされる
// ・アルゴルを よびもどす: 台の ない 所で A（アルゴルの となりなら すぐ・はなれて いれば たずねる）。
//   もどると 出られなく なる 所では もどらない（行き止まりを 作らない）。さく・橋の 上では よべない
// ・家族: ほかの 人が 台に 立つと、その 台の 色の さくを おさえる（その 人いがいが 通れる。橋・カードは かわらない）。ひとりでも 必ず とける
//   さくが もどって 立てなく なった 人は、さいごに 立てた マス（だめなら 近くの マス）へ
// ■ 助け（3人組の 声）: 同じ 階で アルゴルの 台が かわらない まま C11C_HELP_STEPS 歩 歩くと、次の 台（か よびもどす・出口）を 光らせる（snap の c11c.h）
// ■ 回線が 切れて もどった 時: 回ろうの 階なら その 階の 入口（アルゴルは その 階に パーティーが のこって いれば そのまま）
// ■ 道さがし（solve11c）: 階の 入口から 出口まで（テスト・助け・よびもどす 時の たしかめ）。人は 1人と して さがす
import { MAPS, isBlocked } from '../maps/index.js?v=28060a38724e';
import { C11C, C11C_HELP_STEPS, C11C_TRIO, C11C_ALGOL_NAME, C11C_FLOOR_FLAGS } from '../maps/c11c-flags.js?v=28060a38724e';
import { c11cMapFlag, pedAt11c, laneAt11c, cardFrozen11c, C11C_COLOR_NAME } from '../maps/c11c.js?v=28060a38724e';
import { nearestFree } from './hazards.js?v=28060a38724e';
import { runSteps } from './scripts.js?v=28060a38724e';

const partyKey = (s) => s?.partyId || s?.id;
const tileOf = (s) => [Math.floor(s.x), Math.floor(s.y)];
const hallOf = (s) => MAPS[s?.map]?.c11c || null;
const AL = C11C_ALGOL_NAME;

// ───────────── アルゴルの 台（パーティーと 階 ごと）─────────────
const store = (world) => world.c11cSt || (world.c11cSt = new Map());
const keyOf = (s, mapId = s.map) => `${partyKey(s)}|${mapId}`;
const cardAxis = (K) => (K.y1 - K.y0 >= K.x1 - K.x0 ? 'y' : 'x');
function stateOf(world, s, make = false) {
  const H = hallOf(s);
  if (!H) return null;
  const k = keyOf(s);
  let st = store(world).get(k);
  if (!st && make) {
    st = { a: -1, cards: H.cards.map((K) => ({ pos: cardAxis(K) === 'y' ? K.y0 : K.x0, dir: 1 })) };
    store(world).set(k, st);
  }
  return st || null;
}
// アルゴルが 立って いる 台（-1 … いない）
export const algolPed11c = (world, s) => stateOf(world, s)?.a ?? -1;
// 同じ 階に いる 同じ パーティーの 人
const mates = (world, s) => [...world.sessions.values()].filter((m) => m.inWorld && m.map === s.map && partyKey(m) === partyKey(s));
// s いがいの 家族が 立って いる 台
export function heldBy11c(world, s) {
  const map = MAPS[s.map];
  const out = new Set();
  if (!map?.c11c) return out;
  for (const m of mates(world, s)) {
    if (m === s || m.flying) continue;
    const p = pedAt11c(map, Math.floor(m.x), Math.floor(m.y));
    if (p >= 0) out.add(p);
  }
  return out;
}
// '@cf<g>'・'@lb<g>' … その 人の パーティーの アルゴルと 家族の 台（world.js の hasFlagFn。わからない しるしは undefined）
//   '@cs<n>' … その 人が この 回の あそびで <n>階の 説明を 見た（説明の 場面が 何度も 出ない ように。セーブしない）
export function c11cFlag(world, s, f) {
  if (f.startsWith('@cs')) return !!s?.c11cSeen?.[f.slice(3)];
  if (!f.startsWith('@cf') && !f.startsWith('@lb')) return undefined;
  const map = MAPS[s?.map];
  if (!map?.c11c) return undefined;
  return c11cMapFlag(map, algolPed11c(world, s), f[2] === 'f' ? heldBy11c(world, s) : null, f);
}
// アルゴルが いっしょに 歩くか（回ろう・ひと休みの 部屋・大とびらの 前。台に 立って いる 間は 台の 上）
export function c11cAlgolFollows(world, s) {
  const map = MAPS[s?.map];
  if (!map?.c11cAlgol || !world.hasFlagFn(s)(C11C.join)) return false;
  return algolPed11c(world, s) < 0;
}

// ───────────── 道さがし（人は 1人。家族の 台は held で わたす）─────────────
const D4 = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const gridCache = new WeakMap();
// a（アルゴルの 台）・held（家族の 台）で 立てる マス（1 … 立てる）。sneak … 動いて いる カードの 通り道も 通れる と みなす
function freeGrid(map, a, held, sneak) {
  const key = `${a}|${held ? [...held].sort().join(',') : ''}|${sneak ? 1 : 0}`;
  let C = gridCache.get(map);
  if (!C) gridCache.set(map, (C = new Map()));
  if (C.has(key)) return C.get(key);
  const has = (f) => c11cMapFlag(map, a, held, f) ?? false;
  const g = new Uint8Array(map.w * map.h);
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const k = y * map.w + x;
    if (isBlocked(map, x, y, has) || map.chestAt?.has(k)) continue;
    const lane = laneAt11c(map, x, y);
    if (lane >= 0 && !sneak && !cardFrozen11c(map, a, lane)) continue;
    g[k] = 1;
  }
  C.set(key, g);
  return g;
}
const goalOf = (map) => map.c11c.up;
// 状態 [x, y, a] から 行ける 次の 状態 [[状態, うごき], …]
//   うごき: null（歩く）・{ kind: 'call', x, y, p }（台で A）・{ kind: 'recall' }（よびもどす）
function stepper(map, held, sneak, guard) {
  const G = goalOf(map);
  return ([x, y, a]) => {
    const out = [];
    const free = freeGrid(map, a, held, sneak);
    for (const [dx, dy] of D4) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || !free[ny * map.w + nx]) continue;
      if (map.warpAt?.has(ny * map.w + nx) && !(nx === G.x && ny === G.y)) continue;
      out.push([[nx, ny, a], null]);
    }
    const p = pedAt11c(map, x, y);
    if (p >= 0) {
      const na = a === p ? -1 : p;
      if (freeGrid(map, na, held, sneak)[y * map.w + x] && (na >= 0 || !guard || guard(x, y))) out.push([[x, y, na], na >= 0 ? { kind: 'call', x, y, p } : { kind: 'recall' }]);
    } else if (a >= 0 && freeGrid(map, -1, held, sneak)[y * map.w + x] && (!guard || guard(x, y))) {
      out.push([[x, y, -1], { kind: 'recall' }]);
    }
    return out;
  };
}
const skey = (st) => st.join(',');
// from … { x, y }・a … アルゴルの 台 → 出口までの うごき（null … とどかない）
export function solve11c(map, from, a = -1, { held = null } = {}) {
  if (!map?.c11c) return null;
  const G = goalOf(map);
  const next = stepper(map, held, false, null);
  const s0 = [from.x, from.y, a];
  const prev = new Map([[skey(s0), null]]);
  const q = [s0];
  for (let h = 0; h < q.length; h++) {
    const st = q[h];
    if (st[0] === G.x && st[1] === G.y) {
      const path = [];
      for (let k = skey(st); prev.get(k); k = prev.get(k).from) path.unshift(prev.get(k));
      return path;
    }
    for (const [n, act] of next(st)) {
      const k = skey(n);
      if (prev.has(k)) continue;
      prev.set(k, { from: skey(st), st: n, act });
      q.push(n);
    }
  }
  return null;
}
// よびもどしても 出口へ 行けるか（ゲームの よびもどす 時の たしかめ）
export const canRecall11c = (map, x, y) => !!solve11c(map, { x, y }, -1);
// 入口（と 入口に いて アルゴルが どの 台に いても）から 行ける 状態（テスト: どの 状態からも 出口へ 行ける ＝ 行き止まりが ない）
//   sneak … 動いて いる カードを よけて 通り道を 通る 人も 入れる（見つかっても 入口に もどされる だけ）
export function reachable11c(map, { sneak = false } = {}) {
  const A = map.c11c.arrive, G = goalOf(map);
  const next = stepper(map, null, sneak, (x, y) => canRecall11c(map, x, y));
  const seen = new Map();
  const q = [];
  for (let a = -1; a < map.c11c.peds.length; a++) {
    const s0 = [A.x, A.y, a];
    seen.set(skey(s0), s0);
    q.push(s0);
  }
  for (let h = 0; h < q.length; h++) {
    if (q[h][0] === G.x && q[h][1] === G.y) continue;
    for (const [n] of next(q[h])) {
      const k = skey(n);
      if (seen.has(k)) continue;
      seen.set(k, n);
      q.push(n);
    }
  }
  return [...seen.values()];
}
// 助け: 次に する こと（はじめの 台・よびもどす。なければ 出口）
export function nextHint11c(map, from, a) {
  const path = solve11c(map, from, a);
  if (!path) return null;
  const act = path.find((p) => p.act)?.act;
  if (act?.kind === 'call') return { kind: 'ped', x: act.x, y: act.y, p: act.p };
  if (act?.kind === 'recall') { const P = map.c11c.peds[a]; return { kind: 'recall', x: P.x, y: P.y }; }
  const G = goalOf(map);
  return { kind: 'goal', x: G.x, y: G.y };
}

// ───────────── さくが もどった 時 ─────────────
function placeBack(world, m, text) {
  const map = MAPS[m.map];
  const has = world.hasFlagFn(m);
  const L = m.c11cLast;
  let to = L && L.map === m.map && !isBlocked(map, L.x, L.y, has) ? { x: L.x, y: L.y } : null;
  if (!to) to = nearestFree(map, m.x, m.y, has);
  if (!to) return;
  world.placeSession(m, m.map, to.x + 0.5, to.y + 0.5, m.dir, true);
  if (text) world.send(m, { t: 'toast', text });
}
// パーティーの 同じ 階の 人で、立てなく なった 人を よける
function unstick(world, s) {
  const map = MAPS[s.map];
  if (!map?.c11c) return;
  for (const m of mates(world, s)) {
    if (m.flying) continue;
    if (isBlocked(map, Math.floor(m.x), Math.floor(m.y), world.hasFlagFn(m))) placeBack(world, m, '光のさくが、もどって来た！\n（あわてて、とびのいた）');
  }
}

// ───────────── 台で A・よびもどす ─────────────
function tellMates(world, s, text) {
  for (const m of mates(world, s)) if (m !== s) world.send(m, { t: 'toast', text });
}
function callTo(world, s, p) {
  const map = MAPS[s.map];
  const st = stateOf(world, s, true);
  const P = map.c11c.peds[p];
  st.a = p;
  const color = C11C_COLOR_NAME[P.c];
  const more = [P.bridges.length ? '\n（スピカの光の橋が、すうっと、消えた…）' : '', P.cards.length ? '\n（見はりのカードが、ぴたりと、止まった！）' : ''].join('');
  world.send(s, { t: 'toast', sfx: 'dark', text: `${AL}が、${color}の、かげの台に、立った！\n${color}の光のさくを、食べている…${more}` });
  tellMates(world, s, `${s.char.name}が、${AL}を、${color}の台に、よんだ！${more}`);
  unstick(world, s);
  world.markDirty?.();
}
function recallNow(world, s, quiet = false) {
  const map = MAPS[s.map];
  const st = stateOf(world, s);
  if (!st || st.a < 0) return false;
  const [x, y] = tileOf(s);
  if (!canRecall11c(map, x, y)) {
    runSteps(world, s, [['say', AL, '…ここで、ぼくが、もどったら、\nおまえたち、出られなくなるぞ。']]);
    return false;
  }
  st.a = -1;
  if (!quiet) world.send(s, { t: 'toast', sfx: 'cancel', text: `${AL}が、もどって来た。\n光のさくが、もとに、もどった。` });
  tellMates(world, s, `${AL}が、もどって来た。\n光のさくが、もとに、もどった。`);
  unstick(world, s);
  return true;
}
// しらべる（world.js の onInteract から。true … ここで おしまい）
export function c11cInteract(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11c) return false;
  const [mx, my] = tileOf(s);
  const p = pedAt11c(map, mx, my);
  const st = stateOf(world, s, true);
  // 宝箱・出入り口は いつもの とおり
  const key = ty * map.w + tx;
  if (map.chestAt?.has(key) || map.warpAt?.has(key)) return false;
  // 台の 上で A: アルゴルを よぶ（同じ 台なら もどって 来る）
  if (p >= 0) {
    if (st.a === p) recallNow(world, s);
    else callTo(world, s, p);
    return true;
  }
  // アルゴルが 台に いる: よびもどす（となりなら すぐ・はなれて いれば たずねる）
  if (st.a >= 0) {
    const P = map.c11c.peds[st.a];
    if (!freeIfRecalled(map, mx, my)) {
      world.send(s, { t: 'toast', text: '光のさくの、すぐ上では、よびもどせない。\n（一歩、はなれよう）' });
      return true;
    }
    if (tx === P.x && ty === P.y) { recallNow(world, s); return true; }
    runSteps(world, s, [['choice', `${AL}を、よびもどす？`, ['よびもどす', 'やめる'], [[['call', async () => { recallNow(world, s); }]], []]]]);
    return true;
  }
  // さく・みぞを しらべた
  if (map.c11c.fences.some((F) => F.cells.some((q) => q.x === tx && q.y === ty))) {
    const F = map.c11c.fences.find((G) => G.cells.some((q) => q.x === tx && q.y === ty));
    runSteps(world, s, [['say', null, `${C11C_COLOR_NAME[F.c]}く光る、光のさく。\n（${C11C_COLOR_NAME[F.c]}の、かげの台に、${AL}を立たせると、食べてくれる）`]]);
    return true;
  }
  return false;
}
const freeIfRecalled = (map, x, y) => !isBlocked(map, x, y, (f) => c11cMapFlag(map, -1, null, f) ?? false);

// ───────────── 歩いた（world.js の onEnterTile から）: 家族の 台・カード・助けの 歩数 ─────────────
function caught(world, m, K) {
  world.placeSession(m, m.map, K.back.x + 0.5, K.back.y + 0.5, 'down', true);
  world.send(m, { t: 'toast', sfx: 'cancel', text: '見はりのカードに、見つかった！\n（通り道の、入口に、もどされた…）' });
}
function cardCheck(world, m, st) {
  const map = MAPS[m.map];
  if (!map?.c11c || m.busy || m.flying) return false;
  const [x, y] = tileOf(m);
  const k = laneAt11c(map, x, y);
  if (k < 0 || cardFrozen11c(map, st.a, k)) return false;
  const K = map.c11c.cards[k];
  const c = st.cards[k];
  const me = cardAxis(K) === 'y' ? m.y : m.x;
  if (Math.abs(me - (c.pos + 0.5)) >= 0.8) return false;
  caught(world, m, K);
  return true;
}
export function stepC11c(world, s, tx, ty) {
  const map = MAPS[s.map];
  if (!map?.c11c) { s.c11cHelp = null; return false; }
  const has = world.hasFlagFn(s);
  if (!isBlocked(map, tx, ty, has)) s.c11cLast = { map: s.map, x: tx, y: ty };
  const st = stateOf(world, s, true);
  // 家族の 台が かわった かもしれない（ほかの 人の さく）
  unstick(world, s);
  if (cardCheck(world, s, st)) return true;
  // 助け（その 階を まだ 通って いない 時）
  // 第104回 A班: 第4幕の かげの 間は map.c11c.passFlag（3階を 通った しるし）
  const passed = has(map.c11c.passFlag || C11C_FLOOR_FLAGS[map.c11c.floor]);
  if (passed) { s.c11cHelp = null; return false; }
  const key = `${s.map}|${st.a}`;
  if (!s.c11cHelp || s.c11cHelp.key !== key) s.c11cHelp = { key, n: 0, hint: null };
  const H = s.c11cHelp;
  H.n++;
  if (H.n >= C11C_HELP_STEPS) {
    const was = H.hint;
    H.hint = nextHint11c(map, { x: tx, y: ty }, st.a);
    if (H.hint && !was) world.send(s, { t: 'toast', text: helpText(map, tx, ty, H.hint) });
  }
  return false;
}
// 3人組の 声（遠くから）
function helpText(map, x, y, h) {
  const dx = h.x - x, dy = h.y - y;
  const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? '右' : '左') : (dy < 0 ? 'おく' : '手前');
  const BO = C11C_TRIO.mecha;
  const say = h.kind === 'ped' ? `アルゴルさま〜！\n次は、${dir}の、${C11C_COLOR_NAME[map.c11c.peds[h.p].c]}の台で、まんねん〜！`
    : h.kind === 'recall' ? 'アルゴルさま〜！\nいっぺん、もどって来るのが、ええでまんねん〜！'
      : `アルゴルさま〜！\nそのまま、${dir}の、階段へ、まっすぐでまんねん〜！`;
  return `${BO}の声「${say}」\n（遠くから、声が、聞こえる…）`;
}

// ───────────── まいフレーム ─────────────
export function tickC11c(world, dt) {
  const st0 = store(world);
  if (!st0.size) return;
  const here = new Map();
  for (const s of world.sessions.values()) if (s.inWorld && MAPS[s.map]?.c11c) {
    const k = keyOf(s);
    if (!here.has(k)) here.set(k, []);
    here.get(k).push(s);
  }
  for (const [k, st] of [...st0]) {
    const people = here.get(k);
    if (!people) { st0.delete(k); continue; }
    const map = MAPS[people[0].map];
    // カード
    map.c11c.cards.forEach((K, i) => {
      if (cardFrozen11c(map, st.a, i)) return;
      const c = st.cards[i];
      const [lo, hi] = cardAxis(K) === 'y' ? [K.y0, K.y1] : [K.x0, K.x1];
      c.pos += c.dir * (K.speed * dt) / 1000;
      if (c.pos >= hi) { c.pos = hi; c.dir = -1; }
      if (c.pos <= lo) { c.pos = lo; c.dir = 1; }
    });
    for (const m of people) cardCheck(world, m, st);
    // 家族が 台を おりた・回ろうを 出た（さくが もどった）
    unstick(world, people[0]);
  }
}

// 回線が 切れて もどった（world.js の onPlay・resumeSession。場所は もう 決まって いる）: 回ろうの 階は その 階の 入口
export function c11cOnPlay(world, s) {
  const H = hallOf(s);
  s.c11cHelp = null;
  if (!H) return false;
  s.x = H.arrive.x + 0.5;
  s.y = H.arrive.y + 0.5;
  return true;
}
// snap に のせる（回ろうの 階に いる 時だけ）: { a: アルゴルの 台, hd: [ほかの 家族が 立つ 台], cd: [カードの 場所], h: [x, y, 'ped' | 'recall' | 'goal'] }
export function c11cSnap(world, s) {
  if (!hallOf(s)) return null;
  const st = stateOf(world, s, true);
  const H = s.c11cHelp?.hint;
  return {
    a: st.a,
    hd: [...heldBy11c(world, s)],
    cd: st.cards.map((c) => Math.round(c.pos * 100) / 100),
    ...(H ? { h: [H.x, H.y, H.kind] } : {}),
  };
}
// 台本から つかう（world.c11c。data/story-c11c.js）: その 階の アルゴルを もどす（場面の 前など）
export const C11C_API = {
  pedOf: algolPed11c,
  reset: (world, s) => { const st = stateOf(world, s); if (st) st.a = -1; },
};
