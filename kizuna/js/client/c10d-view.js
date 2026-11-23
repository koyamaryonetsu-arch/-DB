// 第3部 第2章 第4幕「金の音と、星の橋」の 見え方（client/field.js の 2D と 2.5D から）
// ※ ネタバレ注意（docs/plan-part3-c10d.md の 16-2）
// ・星の 階段・いただき（map.c10dSky）: 雲の すき間に 小さな 世界（ミドリナの 緑・シロガネの 白・コガネの 金・クモイの 雲の 島）が 見える。
//   上の 空には 星。曲へ field.gateStage（開けた 門の 数 0〜4。ほかの マップでは 0）
import { C10D_GATES } from '../shared/maps/c10d-flags.js?v=9315c53e5c23';
import { T } from '../shared/tiles.js?v=9315c53e5c23';
import { TS } from './render/tiles.js?v=9315c53e5c23';

// 画面の 状態（まいフレーム。F班の 曲）: field.gateStage … 開けた 門の 数（0〜4）
export function noteC10dStage(field) {
  const m = field.map;
  field.gateStage = m?.c10dSky ? C10D_GATES.filter((f) => field.hasFlag?.(f)).length : 0;
}

// 雲の すき間の 小さな 世界（マスごとに きまった 形。11マスに 1つ くらい）
const LANDS = [
  { g: '#5aa04a', l: '#8ad06a', dot: '#f0e0b0' }, // ミドリナ（緑の 野原と 村）
  { g: '#d8e4f0', l: '#ffffff', dot: '#8aa0c0' }, // シロガネ（雪の 山）
  { g: '#d8b050', l: '#f0d080', dot: '#a06a30' }, // コガネ（砂の 国）
  { g: '#b8c8e8', l: '#e8f0ff', dot: '#9a8ad0' }, // クモイ（雲の 上の 島）
];
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
// h は 0 いじょう（>>> 0）。ずらす のも >>>（>> だと 2^31 いじょうで マイナスに なり、配列の 外を 読む）
export function landOf(map, x, y) {
  if (map.tiles[y * map.w + x] !== T.CLOUD_SEA) return null;
  const h = hash(x, y);
  if (h % 11 !== 0) return null;
  return { land: LANDS[(h >>> 4) % LANDS.length], ox: ((h >>> 8) % 5) / 10, oy: ((h >>> 12) % 5) / 10, r: 0.32 + ((h >>> 16) % 4) * 0.06 };
}
function drawLand(ctx, x, y, k, L, t) {
  const r = k * L.r;
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.08 * Math.sin(t / 1400 + x);
  // 雲の すき間（うすい あい色の ふち）
  ctx.fillStyle = 'rgba(70, 90, 140, 0.55)';
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.25, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
  // 小さな 土地
  ctx.fillStyle = L.land.g;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = L.land.l;
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.15, r * 0.45, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  // 町の 点
  ctx.fillStyle = L.land.dot;
  const d = Math.max(1, k * 0.06);
  ctx.fillRect(x + r * 0.2, y + r * 0.05, d, d);
  ctx.fillRect(x - r * 0.35, y + r * 0.15, d, d);
  ctx.restore();
}
// 上の 空の 星（画面の 上の ほう）
function drawStars(field, ctx) {
  const W = field.vw, H = field.vh, t = field.time;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.28);
  g.addColorStop(0, 'rgba(20, 24, 70, 0.35)');
  g.addColorStop(1, 'rgba(20, 24, 70, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.28);
  for (let i = 0; i < 28; i++) {
    const h = hash(i * 7 + 3, i * 13 + 1);
    const x = (h % 1000) / 1000 * W, y = ((h >>> 10) % 1000) / 1000 * H * 0.24;
    const a = 0.35 + 0.35 * Math.sin(t / 600 + i);
    ctx.fillStyle = `rgba(255, 248, 210, ${a})`;
    ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }
  ctx.restore();
}

// ───── 2D ─────
export function drawC10dSky2D(field, camX, camY) {
  const m = field.map;
  if (!m?.c10dSky) return;
  const ctx = field.ctx;
  const x0 = Math.max(0, Math.floor(camX / TS) - 1), y0 = Math.max(0, Math.floor(camY / TS) - 1);
  const x1 = Math.min(m.w - 1, Math.ceil((camX + field.vw) / TS) + 1), y1 = Math.min(m.h - 1, Math.ceil((camY + field.vh) / TS) + 1);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const L = landOf(m, x, y);
    if (L) drawLand(ctx, (x + 0.5 + L.ox - 0.2) * TS - camX, (y + 0.5 + L.oy - 0.2) * TS - camY, TS, L, field.time);
  }
  drawStars(field, ctx);
}
// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC10dSky3D(field, ctx, P) {
  const m = field.map;
  if (!m?.c10dSky) return;
  const me = field.me;
  for (let y = Math.max(0, Math.floor(me.y) - 16); y <= Math.min(m.h - 1, Math.floor(me.y) + 12); y++) {
    for (let x = Math.max(0, Math.floor(me.x) - 16); x <= Math.min(m.w - 1, Math.floor(me.x) + 16); x++) {
      const L = landOf(m, x, y);
      if (!L) continue;
      const p = P(x + 0.5 + L.ox - 0.2, y + 0.5 + L.oy - 0.2, -1.3);
      drawLand(ctx, p.x, p.y, p.k, L, field.time);
    }
  }
  drawStars(field, ctx);
}
