// 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 見え方（client/field.js の 2D と 2.5D・まいフレームから）
// ※ ネタバレ注意（docs/plan-part3-c11c.md の 19-3）
// ・サーバーの snap（c11c … { a: アルゴルの 台, hd: [ほかの 家族が 立つ 台], cd: [カードの 場所], h: [x, y, 'ped' | 'recall' | 'goal'] }）
// ・とびらの しるし '@cf<g>'（光の さく）・'@lb<g>'（光の 橋）… field.hasFlag から（あたり判定・地図の 色）
// ・かげの 台の 輪（台の 色。アルゴルが 立つ 台は こく・食べて いる うずまき）・アルゴル（台の 上 ／ いっしょに 歩く）・見はりの カード・3人組の 助けの 光
// ・ミニマップ: アルゴルが 今 いる 台（むらさきの 点）
// ・曲へ field.pairStage（1 … アルゴルが 台に 立って いる。ほかは 0）
import { C11C } from '../shared/maps/c11c-flags.js';
import { C11C_RANGE } from '../shared/maps/c11c-rows.js';
import { c11cMapFlag, cardFrozen11c } from '../shared/maps/c11c.js';
import { TS } from './render/tiles.js';

const PED_COLOR = { a: [90, 138, 255], b: [90, 216, 112], c: [255, 106, 106], d: [255, 216, 74] };
const rgba = ([r, g, b], a) => `rgba(${r}, ${g}, ${b}, ${a})`;

// ───── サーバーの snap ─────
export function noteC11cSnap(field, d) {
  field.c11c = d ? { ...d, map: field.mapId } : null;
}
const stateOf = (field) => (field.map?.c11c && field.c11c && field.c11c.map === field.mapId ? field.c11c : null);
// アルゴルが 立って いる 台（-1 … いない）
export const algolPedOf11c = (field) => stateOf(field)?.a ?? -1;
// とびらの しるし（field.hasFlag。わからない しるしは undefined）
export function c11cFieldFlag(field, f) {
  if (!field.map?.c11c || (!f.startsWith('@cf') && !f.startsWith('@lb'))) return undefined;
  const st = stateOf(field);
  return c11cMapFlag(field.map, st?.a ?? -1, new Set(st?.hd || []), f);
}
// 画面の 状態（まいフレーム。F班の 曲）: field.pairStage
export function noteC11cStage(field) {
  field.pairStage = field.map?.c11c && algolPedOf11c(field) >= 0 ? 1 : 0;
}
// アルゴルが いっしょに 歩くか（回ろう・ひと休みの 部屋・大とびらの 前。台に 立って いる 間は 台の 上）
export function c11cAlgolWalks(field) {
  return !!field.map?.c11cAlgol && !!field.hasFlag?.(C11C.join) && algolPedOf11c(field) < 0;
}
// 台の 上の アルゴル（{ x, y } … 台の 上 ／ null）
export function c11cAlgolOnPed(field) {
  const a = algolPedOf11c(field);
  if (a < 0) return null;
  const P = field.map.c11c.peds[a];
  return P ? { x: P.x + 0.5, y: P.y + 0.62 } : null;
}

// ───── かく 物 ─────
// かげの 台の 輪（x, y … 画面の 台の まん中・k … 1マスの 大きさ・sy … たての ちぢみ）
function ring(ctx, x, y, k, sy, col, strong, t) {
  const R = (C11C_RANGE + 0.5) * k;
  ctx.save();
  ctx.lineWidth = Math.max(1.5, k * (strong ? 0.12 : 0.06));
  ctx.setLineDash(strong ? [] : [k * 0.3, k * 0.25]);
  ctx.lineDashOffset = -t / 60;
  ctx.strokeStyle = rgba(col, strong ? 0.75 : 0.32);
  ctx.beginPath(); ctx.ellipse(x, y, R, R * sy, 0, 0, Math.PI * 2); ctx.stroke();
  if (strong) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, 'rgba(60, 20, 90, 0.28)');
    g.addColorStop(1, 'rgba(60, 20, 90, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, R, R * sy, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// アルゴルが 光を 食べて いる うずまき
function swirl(ctx, x, y, k, t) {
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const a = t / 300 + (i * Math.PI) / 3;
    const r = k * (0.45 + 0.12 * Math.sin(t / 200 + i));
    ctx.fillStyle = `rgba(${150 + i * 10}, 90, 220, ${0.55 - i * 0.05})`;
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y - k * 0.4 + Math.sin(a) * r * 0.5, Math.max(1.5, k * 0.08), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// 見はりの カード（x, y … 画面の 左上・w, h … 大きさ）
function card(ctx, x, y, w, h, frozen, t) {
  ctx.save();
  const bob = frozen ? 0 : Math.sin(t / 120) * h * 0.04;
  ctx.shadowColor = frozen ? '#9a7aff' : '#ffffff';
  ctx.shadowBlur = w * 0.15;
  ctx.fillStyle = frozen ? '#c8c0e0' : '#fffaf0';
  ctx.fillRect(x, y + bob, w, h);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#3a2a6a';
  ctx.lineWidth = Math.max(1, w * 0.04);
  ctx.strokeRect(x + w * 0.06, y + bob + h * 0.08, w * 0.88, h * 0.84);
  // まん中の しるし（星）と 目
  const cx = x + w / 2, cy = y + bob + h / 2;
  ctx.fillStyle = frozen ? '#7a6aa8' : '#d83a3a';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = (i % 2 ? 0.18 : 0.4) * Math.min(w, h) * 0.6;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath(); ctx.fill();
  if (!frozen) {
    ctx.fillStyle = '#2a1a4a';
    ctx.fillRect(cx - w * 0.2, y + bob + h * 0.2, w * 0.08, h * 0.08);
    ctx.fillRect(cx + w * 0.12, y + bob + h * 0.2, w * 0.08, h * 0.08);
  }
  ctx.restore();
}
// 3人組の 助けの 光
function hintGlow(ctx, x, y, k, t) {
  ctx.save();
  const r = k * (0.6 + 0.1 * Math.sin(t / 180));
  ctx.strokeStyle = 'rgba(255, 230, 120, 0.9)';
  ctx.lineWidth = Math.max(2, k * 0.1);
  ctx.shadowColor = '#fff080';
  ctx.shadowBlur = k * 0.6;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255, 240, 160, 0.9)';
  const a = t / 220;
  for (let i = 0; i < 3; i++) {
    const b = a + (i * Math.PI * 2) / 3;
    ctx.fillRect(x + Math.cos(b) * r - 1.5, y + Math.sin(b) * r - 1.5, 3, 3);
  }
  ctx.restore();
}
const hintOf = (field) => stateOf(field)?.h || null;
// カードの 場所（左上の マス。cd … 通り道の 向きの 場所）
function cardRects(field) {
  const st = stateOf(field);
  const H = field.map.c11c;
  return H.cards.map((K, k) => {
    const pos = st?.cd?.[k] ?? (K.y1 - K.y0 >= K.x1 - K.x0 ? K.y0 : K.x0);
    const vert = K.y1 - K.y0 >= K.x1 - K.x0;
    return vert ? { x: K.x0, y: pos, w: K.x1 - K.x0 + 1, h: 1, frozen: cardFrozen11c(field.map, st?.a ?? -1, k) }
      : { x: pos, y: K.y0, w: 1, h: K.y1 - K.y0 + 1, frozen: cardFrozen11c(field.map, st?.a ?? -1, k) };
  });
}

// ───── 2D ─────
// ゆか（人の 絵の 下）: 台の 輪
export function drawC11cFloor2D(field, camX, camY) {
  const m = field.map;
  if (!m?.c11c) return;
  const ctx = field.ctx, t = field.time, a = algolPedOf11c(field);
  m.c11c.peds.forEach((P, i) => ring(ctx, (P.x + 0.5) * TS - camX, (P.y + 0.5) * TS - camY, TS, 1, PED_COLOR[P.c], i === a, t));
}
// 上（人の 絵の 上）: カード・アルゴルの うずまき・助けの 光
export function drawC11c2D(field, camX, camY) {
  const m = field.map;
  if (!m?.c11c) return;
  const ctx = field.ctx, t = field.time;
  for (const R of cardRects(field)) card(ctx, R.x * TS - camX + 1, R.y * TS - camY - TS * 0.35, R.w * TS - 2, R.h * TS * 1.25, R.frozen, t);
  const al = c11cAlgolOnPed(field);
  if (al) swirl(ctx, al.x * TS - camX, al.y * TS - camY, TS, t);
  const h = hintOf(field);
  if (h) hintGlow(ctx, (h[0] + 0.5) * TS - camX, (h[1] + 0.5) * TS - camY, TS, t);
}
// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC11c3D(field, ctx, P) {
  const m = field.map;
  if (!m?.c11c) return;
  const t = field.time, a = algolPedOf11c(field);
  m.c11c.peds.forEach((Q, i) => {
    const c = P(Q.x + 0.5, Q.y + 0.5, 0.02);
    const e = P(Q.x + 0.5, Q.y + 0.5 + C11C_RANGE, 0.02);
    const sy = Math.max(0.3, Math.min(1, Math.abs(e.y - c.y) / Math.max(1, (C11C_RANGE + 0.5) * c.k)));
    ring(ctx, c.x, c.y, c.k, sy, PED_COLOR[Q.c], i === a, t);
  });
  for (const R of cardRects(field)) {
    const p = P(R.x + R.w / 2, R.y + R.h / 2 + 0.3, 0.9);
    card(ctx, p.x - (R.w * p.k) / 2, p.y - p.k * 0.6, R.w * p.k, R.h * p.k * 1.2, R.frozen, t);
  }
  const al = c11cAlgolOnPed(field);
  if (al) { const p = P(al.x, al.y, 0.4); swirl(ctx, p.x, p.y, p.k, t); }
  const h = hintOf(field);
  if (h) { const p = P(h[0] + 0.5, h[1] + 0.5, 0.4); hintGlow(ctx, p.x, p.y, p.k, t); }
}

// ───── ミニマップ（ui/menu.js の renderMiniMap から）: アルゴルが 今 いる 台 ─────
export function drawC11cMini(game, ctx, x0, y0, pxPer, full) {
  const field = game.field;
  const al = c11cAlgolOnPed(field);
  if (!al) return;
  const r = full ? Math.max(3, pxPer * 1.2) : 3;
  const x = (al.x - x0) * pxPer, y = (al.y - 0.12 - y0) * pxPer;
  ctx.fillStyle = '#000';
  ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);
  ctx.fillStyle = Math.floor(performance.now() / 400) % 2 ? '#b070ff' : '#e0c0ff';
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
