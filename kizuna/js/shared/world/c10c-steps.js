// 第3部 第2章 第3幕「紫と、うばわれた音」（A: 世界と 物語）の しくみ（サーバー）。world.js から 読む
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15-2）
// ■ 音の 橋（空の 小島 c10c_isles1・c10c_isles2）
// ・橋は その 階に いる パーティーで 同じ（world.c10cBridge。パーティーの id と 階 ごと。セーブしない）
//   { red: すき間の 番号, yellow: …, … }。同じ 色の 橋は 1本だけ（べつの 石で 同じ 色を 鳴らすと、前の 橋は 消えて 新しい 所に かかる）
// ・とびらの しるし '@br<すき間>:<色>'（world.js の hasFlagFn）で すき間の マスが 光の 橋に なる（maps/c10c.js）
// ・橋の 上に パーティーの だれかが いる 時、その 橋は 消えない（消そうと すると「だれかが わたって いる」）
// ・パーティーの だれも 階に いなく なると わすれる（次は 橋なし）。回線が 切れて もどった 時: 階の 入口
// ■ ベルトと レバー（少年の とりで c10c_fort1・c10c_fort2）
// ・ベルトの 向きは レバーの フラグ（c10c_lv_red・c10c_lv_blue）。台本の ['toggle'] は リーダーの フラグを かえる ＝ パーティーで 同じ・セーブする
// ・ベルトで 運ばれるのは 画面（client/field.js の flow）。サーバーは 歩いた 所を 見るだけ
// ・おし出される 箱（T.C10C_PUSHER）に ふれると 1マス もどされる（ダメージ なし）
import { MAPS, effectiveTile, canStand, standSpot } from '../maps/index.js?v=6a6b763889f6';
import { T, TILE_INFO } from '../tiles.js?v=6a6b763889f6';
import { C10C_BRIDGE_MAPS, C10C_FORT_MAPS, C10C_BRIDGE_COLORS, C10C_MAP } from '../maps/c10c-flags.js?v=6a6b763889f6';
import { ISLES1_POS, ISLES2_POS } from '../maps/c10c-rows.js?v=6a6b763889f6';

const partyKey = (s) => s?.partyId || s?.id;
const isBridgeMap = (id) => C10C_BRIDGE_MAPS.includes(id);
const ENTRY = { [C10C_MAP.isles1]: ISLES1_POS.entry, [C10C_MAP.isles2]: ISLES2_POS.entry };

// ───────────── 音の 橋 ─────────────
const store = (world) => world.c10cBridge || (world.c10cBridge = new Map());
const keyOf = (s, mapId = s.map) => `${partyKey(s)}|${mapId}`;
// その 人の パーティーの 橋（{ 色: すき間の 番号 }）
export function bridgesOf10c(world, s) {
  if (!isBridgeMap(s?.map)) return {};
  return store(world).get(keyOf(s)) || {};
}
// かかって いる 橋の 数（0〜5。画面の 曲 field.bridgeStage と 同じ）
export const bridgeCount10c = (world, s) => Object.keys(bridgesOf10c(world, s)).length;

// '@br<i>:<色>' … その 人の パーティーの 橋（world.js の hasFlagFn。わからない しるしは undefined）
export function c10cFlag(world, s, f) {
  if (!f.startsWith('@br')) return undefined;
  const [i, c] = f.slice(3).split(':');
  return bridgesOf10c(world, s)[c] === Number(i);
}

// 同じ 階に いる 同じ パーティーの 人
const mates = (world, s) => [...world.sessions.values()].filter((m) => m.inWorld && m.map === s.map && partyKey(m) === partyKey(s));
// すき間 i の 上に 立って いる パーティーの 人
function someoneOn(world, s, i) {
  const sp = MAPS[s.map]?.c10cSpans?.[i];
  if (!sp) return null;
  return mates(world, s).find((m) => sp.cells.some((p) => p.x === Math.floor(m.x) && p.y === Math.floor(m.y))) || null;
}

// 橋の 石で 色 c を 鳴らす（すき間 i に かける）。
//   'ok' … かかった / 'same' … もう その 色の 橋が かかって いる / 'busy' … べつの 所の 同じ 色の 橋（か、この すき間の ちがう 色の 橋）の 上に だれかが いる
export function setBridge10c(world, s, i, c) {
  if (!isBridgeMap(s?.map) || !C10C_BRIDGE_COLORS.includes(c)) return 'none';
  const map = MAPS[s.map];
  if (!map.c10cSpans?.[i]) return 'none';
  const cur = { ...bridgesOf10c(world, s) };
  if (cur[c] === i) return 'same';
  // 前の 同じ 色の 橋（べつの すき間）は 消える … その 上に 人が いれば 消さない
  if (cur[c] !== undefined && someoneOn(world, s, cur[c])) return 'busy';
  // この すき間に かかって いた べつの 色は はずれる（橋は かかった まま。色だけ かわる）
  for (const k of Object.keys(cur)) if (cur[k] === i) delete cur[k];
  cur[c] = i;
  store(world).set(keyOf(s), cur);
  // 橋が 消えて 立てなく なった 人は いない はず（上に いる 時は 消さない）。ねんの ため 近くの 立てる 所へ
  for (const m of mates(world, s)) {
    const has = world.hasFlagFn(m);
    if (!canStand(map, m.x, m.y, has)) {
      const p = standSpot(map, m.x, m.y, has);
      world.placeSession(m, m.map, p.x, p.y, m.dir, true);
    }
    if (m !== s) world.send(m, { t: 'toast', text: 'キイィン…♪\n光の橋が、かかった！' });
  }
  world.markDirty?.();
  return 'ok';
}

// ───────────── ベルトの 工場: おし出される 箱 ─────────────
// onEnterTile から（true … 箱に おしもどされた）
export function stepC10c(world, s, tx, ty) {
  if (!C10C_FORT_MAPS.includes(s.map) || s.busy) return false;
  const map = MAPS[s.map];
  const has = world.hasFlagFn(s);
  const t = effectiveTile(map, tx, ty, has);
  if (!TILE_INFO[t]?.c10cPush) {
    s.c10cLast = { map: s.map, x: tx, y: ty };
    return false;
  }
  // 1マス もどす（来た 所。わからない 時は 近くの 立てる 所）
  const L = s.c10cLast && s.c10cLast.map === s.map && Math.abs(s.c10cLast.x - tx) + Math.abs(s.c10cLast.y - ty) === 1 ? s.c10cLast : null;
  let to = L && canStand(map, L.x + 0.5, L.y + 0.5, has) ? { x: L.x + 0.5, y: L.y + 0.5 } : null;
  if (!to) {
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      const nx = tx + dx, ny = ty + dy;
      if (TILE_INFO[effectiveTile(map, nx, ny, has)]?.c10cPush || TILE_INFO[effectiveTile(map, nx, ny, has)]?.flow) continue;
      if (canStand(map, nx + 0.5, ny + 0.5, has)) { to = { x: nx + 0.5, y: ny + 0.5 }; break; }
    }
  }
  if (!to) to = standSpot(map, tx + 0.5, ty + 0.5, has);
  world.placeSession(s, s.map, to.x, to.y, s.dir, true);
  world.send(s, { t: 'toast', text: 'ドン！\n星のかけらの箱に、おしもどされた！' });
  return true;
}

// ───────────── まいフレーム・つなぎなおし・snap ─────────────
export function tickC10c(world) {
  // だれも いなく なった パーティーの 橋は わすれる
  const here = new Set();
  for (const s of world.sessions.values()) if (s.inWorld) here.add(keyOf(s));
  for (const k of [...store(world).keys()]) if (!here.has(k)) store(world).delete(k);
}
// 回線が 切れて もどった（world.js の onPlay・resumeSession。場所は もう 決まって いる）: 空の 小島は 階の 入口
export function c10cOnPlay(world, s) {
  const E = ENTRY[s.map];
  if (!E) return false;
  s.x = E.x + 0.5;
  s.y = E.y + 0.5;
  return true;
}
// snap に のせる その 人の パーティーの 橋（空の 小島に いる 時だけ）: br … { 色: すき間 }
export function c10cSnap(world, s) {
  if (!isBridgeMap(s.map)) return null;
  return { br: bridgesOf10c(world, s) };
}
// 台本から つかう（world.c10c。data/story-c10c.js）
export const C10C_API = { bridgesOf: bridgesOf10c, setBridge: setBridge10c, count: bridgeCount10c };
export { T };
