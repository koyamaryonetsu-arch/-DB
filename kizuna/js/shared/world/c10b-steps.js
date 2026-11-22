// 第3部 第2章 第2幕「青と白」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14-2）
// ■ 水の 高さ（青。c10b_blue1）
// ・水の 高さ（0 下・1 中・2 上）は その 階に いる パーティーで 同じ（world.c10bWater。パーティーの id ごと。セーブしない）
//   階に 入った 時は 中。パーティーの だれも 階に いなく なると わすれる（次は 中から）
// ・とびらの しるし '@w0'・'@w1'・'@w2'（world.js の hasFlagFn）で マスの すがたが かわる（maps/c10b.js の c10bCell）
// ・音の 鐘（台本 c10b_bell）で 水が かわると、水の 中に なった 所に いた 人は いかだに 乗る（水の マスは 歩ける）。
//   立てなく なった 人（がけに なった ふち）は いちばん 近い 立てる 所へ
// ・回線が 切れて もどった 時: 階の 入口（水は パーティーの だれも いなければ 中）
// ■ こっそり（白。c10b_white1・c10b_white2）
// ・人ごと（s.c10bSn … { map, steps, noise, last }。セーブしない）。自分が 1マス 歩く たびに steps が 1 ふえる
//   見はりの フクロウは 4歩ごとに 向きを かえる（決まった じゅん）。止まって いれば 見はりも 止まる
// ・見はりの 見て いる マス（前の 3マス。扇の 形。かべ・柱の うしろは 見えない）に 入ると 見つかる。
//   雪の 山の 中・すべる 氷の 上は 見つからない（すべって いる 間に 一気に ぬける）
// ・見つかると: 部屋の 入口へ もどって、見はりの 魔物との 戦い（にげられる・お金は へらない。B班の c10b_watch1〜3）
// ・うすい 氷を ふむと もの音（3回で ねむる けものが 目を さまし、部屋の 入口へ）。階を 出ると 0 に
// ・3回 見つかる（か 起こす）と 見はりが 1ぴき へる（その 階ごと。ease の だん）
// ・おくの レバーで、パーティーの みんなの 見はりが ねむる（world.c10bSleep。セーブしない）
// ・回線が 切れて もどった 時: その 部屋の 入口
import { MAPS, effectiveTile, isBlocked, canStand, standSpot } from '../maps/index.js?v=c5f1443d1cb0';
import { T } from '../tiles.js?v=c5f1443d1cb0';
import { C10B_MAP, C10B_SNEAK_MAPS, C10B_WATER_START, C10B_NOISE_MAX, C10B_CAUGHT_EASE, C10B_BATTLE } from '../maps/c10b-flags.js?v=c5f1443d1cb0';
import { owlDir10b, activeOwls10b, owlView10b, watchedCells10b, hidden10b, roomAt10b } from '../maps/c10b-sneak.js?v=c5f1443d1cb0';
import { BLUE1_POS } from '../maps/c10b-rows.js?v=c5f1443d1cb0';
import { FIXED_ENCOUNTERS } from '../data/encounters.js?v=c5f1443d1cb0';
import { runSteps } from './scripts.js?v=c5f1443d1cb0';

const BLUE1 = C10B_MAP.blue1;
const partyKey = (s) => s?.partyId || s?.id;

// ───────────── 水の 高さ ─────────────
const waters = (world) => world.c10bWater || (world.c10bWater = new Map());
export function waterOf10b(world, s) {
  if (s?.map !== BLUE1) return C10B_WATER_START;
  return waters(world).get(partyKey(s)) ?? C10B_WATER_START;
}
// 同じ 階に いる 同じ パーティーの 人
const mates = (world, s) => [...world.sessions.values()].filter((m) => m.inWorld && m.map === s.map && partyKey(m) === partyKey(s));

// '@' で 始まる この 幕の とびらの しるし（world.js の hasFlagFn。わからない しるしは undefined）
//   '@w0'・'@w1'・'@w2' … その 人の パーティーの 水の 高さ / '@&a&b' … a と b の 両方（夜だけの 光の 階段 '@&c10b_start&@night'）
export function c10bFlag(world, s, f, has) {
  if (f === '@w0' || f === '@w1' || f === '@w2') return waterOf10b(world, s) === Number(f[2]);
  if (f.startsWith('@&')) return f.slice(2).split('&').every((x) => has(x));
  return undefined;
}

// 鐘で 水の 高さを かえる（台本 c10b_bell の ['call', …]）。かわったら true
export function setWater10b(world, s, L) {
  if (s?.map !== BLUE1) return false;
  const old = waterOf10b(world, s);
  if (old === L) return false;
  waters(world).set(partyKey(s), L);
  const map = MAPS[BLUE1];
  for (const m of mates(world, s)) {
    const has = world.hasFlagFn(m);
    // 立てなく なった 人（がけに なった ふち）は 近くの 立てる 所へ
    if (!canStand(map, m.x, m.y, has) || isBlocked(map, Math.floor(m.x), Math.floor(m.y), has)) {
      const p = standSpot(map, m.x, m.y, has);
      world.placeSession(m, BLUE1, p.x, p.y, m.dir, true);
    }
    if (m !== s) world.send(m, { t: 'toast', text: L > old ? 'ザーッ…！\n水が、上がってきた！' : 'ザーッ…！\n水が、ひいていく！' });
  }
  world.markDirty?.();
  return true;
}

// ───────────── こっそり ─────────────
const isSneak = (mapId) => C10B_SNEAK_MAPS.includes(mapId);
const caughtMap = (world) => world.c10bCaught || (world.c10bCaught = new Map());
const sleepSet = (world) => world.c10bSleep || (world.c10bSleep = new Set());
export const caughtOf10b = (world, s, mapId = s.map) => caughtMap(world).get(`${s.char?.id}|${mapId}`) || 0;
export const sleeping10b = (world, s, mapId = s.map) => sleepSet(world).has(`${partyKey(s)}|${mapId}`);
// 見はりの きまり（maps/c10b-sneak.js。画面と 同じ 計算）
export { owlDir10b, activeOwls10b, owlView10b, watchedCells10b, hidden10b, roomAt10b };

function sneakState(s) {
  if (!s.c10bSn || s.c10bSn.map !== s.map) s.c10bSn = { map: s.map, steps: 0, noise: 0, last: null };
  return s.c10bSn;
}

// 階を かわった（placeSession の はじめ）
export function noteC10bMove(world, s, mapId) {
  if (s.c10bSn && s.c10bSn.map !== mapId) s.c10bSn = null;
  // 同じ 階の 中で 動かされた（見つかって 入口へ・だいほん）: 次の 1歩は 1
  else if (s.c10bSn) s.c10bSn.last = null;
}

// onEnterTile から（true … 見つかって もどされた）
export function stepC10b(world, s, tx, ty) {
  if (!isSneak(s.map) || s.busy) return false;
  const map = MAPS[s.map];
  const st = sneakState(s);
  // 階に 来て はじめの 1歩は 1（来た 所は 知らない）
  const d = st.last ? Math.abs(tx - st.last[0]) + Math.abs(ty - st.last[1]) : 1;
  st.last = [tx, ty];
  if (!d) return false;
  st.steps += Math.min(d, 3);
  const has = world.hasFlagFn(s);
  const t = effectiveTile(map, tx, ty, has);
  if (t === T.C10B_THIN) {
    st.noise += 1;
    if (st.noise >= C10B_NOISE_MAX) return caught10b(world, s, 'beast');
    world.send(s, { t: 'toast', text: `ピシッ…！\nうすい氷が、大きな音を立てた！（もの音 ${'●'.repeat(st.noise)}${'○'.repeat(C10B_NOISE_MAX - st.noise)}）` });
    return false;
  }
  if (hidden10b(t)) return false;
  const seen = watchedCells10b(map, st.steps, caughtOf10b(world, s), sleeping10b(world, s), has);
  if (seen.has(`${tx},${ty}`)) return caught10b(world, s, 'owl');
  return false;
}

// 見つかった・けものが 目を さました → 部屋の 入口へ（見はりの 時は 戦い）
export function caught10b(world, s, why) {
  const map = MAPS[s.map];
  const room = roomAt10b(map, Math.floor(s.x), Math.floor(s.y));
  const k = `${s.char?.id}|${s.map}`;
  const n = (caughtMap(world).get(k) || 0) + 1;
  caughtMap(world).set(k, n);
  const st = sneakState(s);
  st.steps = 0;
  st.noise = 0;
  const E = room?.ent || { x: Math.floor(s.x), y: Math.floor(s.y) };
  st.last = [E.x, E.y];
  const ease = (map.c10bOwls || []).some((o) => o.ease && n === C10B_CAUGHT_EASE * o.ease);
  const bid = C10B_BATTLE.watch[room?.battle ?? map.c10bBattle ?? 0];
  const fight = why === 'owl' && FIXED_ENCOUNTERS[bid];
  s.c10bAlert = world.now?.() || Date.now();
  runSteps(world, s, [
    ['sfx', why === 'owl' ? 'encounter' : 'rumble'],
    ...(why === 'owl'
      ? [['say', null, 'ホーッ！ホーッ！\n見はりのフクロウに、見つかった！']]
      : [['shake'], ['say', null, 'グルル…！\nねむっていたけものが、目をさました！\n（あわてて、部屋の入口まで、にげた）']]),
    ['fade', 'out'],
    ['teleport', s.map, E.x + 0.5, E.y + 0.5, 'up'],
    ['fade', 'in'],
    ...(fight ? [['battle', bid]] : []),
    ...(ease ? [['say', null, '（見はりが、1ぴき、どこかへ、とんでいった…）']] : []),
  ]);
  return true;
}

// レバー（台本 c10b_lever の ['call', …]）: パーティーの みんなの 見はりが ねむる
export function sleepOwls10b(world, s) {
  if (!isSneak(s.map)) return false;
  const k = `${partyKey(s)}|${s.map}`;
  if (sleepSet(world).has(k)) return false;
  sleepSet(world).add(k);
  return true;
}

// ───────────── まいフレーム・つなぎなおし・snap ─────────────
export function tickC10b(world) {
  // だれも いなく なった パーティーの 水・ねむった 見はりは わすれる
  const here = new Set();
  for (const s of world.sessions.values()) if (s.inWorld) here.add(`${partyKey(s)}|${s.map}`);
  for (const k of [...waters(world).keys()]) if (!here.has(`${k}|${BLUE1}`)) waters(world).delete(k);
  for (const k of [...sleepSet(world)]) if (!here.has(k)) sleepSet(world).delete(k);
}
// 回線が 切れて もどった（world.js の onPlay。場所は もう 決まって いる）
export function c10bOnPlay(world, s) {
  if (s.map === BLUE1) {
    const E = BLUE1_POS.entry;
    s.x = E.x + 0.5;
    s.y = E.y + 0.5;
    return true;
  }
  if (isSneak(s.map)) {
    const map = MAPS[s.map];
    const r = roomAt10b(map, Math.floor(s.x), Math.floor(s.y));
    if (r) { s.x = r.ent.x + 0.5; s.y = r.ent.y + 0.5; }
    s.c10bSn = null;
    return true;
  }
  return false;
}
// snap に のせる その 人の 水・こっそり（この 幕の 階に いる 時だけ）
//   w … 水の 高さ / st … 歩数 / nz … もの音 / cg … 見つかった 回数 / sl … 見はりが ねむって いる / al … 見つかった すぐ あと
export function c10bSnap(world, s) {
  if (s.map === BLUE1) return { w: waterOf10b(world, s) };
  if (!isSneak(s.map)) return null;
  const st = s.c10bSn && s.c10bSn.map === s.map ? s.c10bSn : { steps: 0, noise: 0 };
  const now = world.now?.() || Date.now();
  return { st: st.steps, nz: st.noise, cg: caughtOf10b(world, s), ...(sleeping10b(world, s) ? { sl: 1 } : {}), ...(s.c10bAlert && now - s.c10bAlert < 4000 ? { al: 1 } : {}) };
}
// 台本から つかう（world.c10b。data/story-c10b.js）
export const C10B_API = { waterOf: waterOf10b, setWater: setWater10b, sleepOwls: sleepOwls10b };
export { C10B_MAP };
