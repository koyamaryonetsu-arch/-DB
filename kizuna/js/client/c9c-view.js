// 第3部 第1章 第3幕「さかさのピラミッド」の 見え方（client/field.js の 2D と 2.5D から）
// ※ ネタバレ注意（docs/plan-part3.md の 11-2・11-3）
// ・地下の川（map.c9cDark）: まっ暗。見えるのは スピカの 光の まわり 4マス（自分と 家族）と さんばしの 明かり・ピラミッドの 先の 光
//   川の 上（流れ・ゆるい 所）では いかだに 乗った 絵（仲間と スピカも 乗る … 連れは かくす）
// ・さかさのピラミッド（map.c9cPyr）: 自分が さかさの 時は
//   ① ゆかの 絵が 天じょうの 絵（テーマ c9c_flip。うす紫の 石）② 砂つぶが 下から 上へ ③ 画面の ふちが うす紫 ④ ゆかの 物（あな・ゆかの 宝箱）は うすく
//   ⑤ 画面の 上に「さかさ」の しるし。主人公の 絵は さかさに しない（見やすさ）
//   ちがう 向きの 家族は うすく 見える（snap の fp）。天じょうの 宝箱は ふつうの 時は うすく 上に 見える
// 2D も 2.5D も 同じ 計算
import { TILE_INFO } from '../shared/tiles.js?v=9315c53e5c23';
import { tileAt } from '../shared/maps/index.js?v=9315c53e5c23';
import { TS } from './render/tiles.js?v=9315c53e5c23';
import { ctxOf } from './render/pixel.js?v=9315c53e5c23';
import { paintRaft } from './render/c9c-npc-art.js?v=9315c53e5c23';
// 第93回 A班: 岸の ひびきの石で 歌って いる スピカの まわりも ふたごの道と 同じ 明かり（client/c9d-view.js）
import { c9dSingingSpica } from './c9d-view.js?v=9315c53e5c23';
import { LIGHT_SPICA9D } from '../shared/maps/c9d-lane.js?v=9315c53e5c23';
import { raftAt10b } from './c10b-view.js?v=9315c53e5c23';

// ───── 向き ─────
export const myFlip9c = (field) => !!field.map?.c9cPyr && !!field.game?.me?.c9cFlip;
// テーマ（ふつう … c9c_pyr / さかさ … c9c_flip）。2.5D は 向きが かわると とびらの しるしが かわって 作りなおす
export function noteC9cTheme(field) {
  const m = field.map;
  // F班の 曲: さかさの 時は 楽器が かわる（画面の 状態 flipStage 0・1。client/audio-scene.js）
  field.flipStage = myFlip9c(field) ? 1 : 0;
  if (!m?.c9cPyr) return;
  const th = myFlip9c(field) ? 'c9c_flip' : 'c9c_pyr';
  if (m.theme !== th) m.theme = th;
}
// ちがう 向きの 家族は うすく
export const c9cOtherAlpha = (field, o) => (field.map?.c9cPyr && !!o?.fp !== myFlip9c(field) ? 0.4 : 1);
// 天じょうの 宝箱（ふつうの 時は うすく）・ゆかの 宝箱（さかさの 時は うすく）
export function c9cChestAlpha(field, ch) {
  if (!ch?.c9cSide) return 1;
  const flip = myFlip9c(field);
  if (ch.c9cSide === 'ceil') return flip ? 1 : 0.5;
  return flip ? 0.4 : 1;
}

// ───── いかだ ─────
export function raftAt9c(field, x, y) {
  const m = field.map;
  // 第95回 A班: 水鏡の うらの 水の 上も いかだ（client/c10b-view.js）
  if (m?.c10bBlue) return raftAt10b(field, x, y);
  if (!m?.c9cRaft) return false;
  return !!TILE_INFO[tileAt(m, Math.floor(x), Math.floor(y))]?.river;
}
const raftCache = [];
export function raftCanvas9c(f) {
  const k = f % 2;
  if (!raftCache[k]) raftCache[k] = paintRaft(k).toCanvas();
  return raftCache[k];
}
export function drawRaft2D(field, x, y, camX, camY) {
  const c = raftCanvas9c(Math.floor(field.time / 420));
  const w = c.width / (c.res || 1), h = c.height / (c.res || 1);
  field.ctx.drawImage(c, Math.round(x * TS - w / 2 - camX), Math.round(y * TS - h + 5 - camY), w, h);
}
export const raftEntity9c = (field, key, x, y) => ({ key, canvas: raftCanvas9c(Math.floor(field.time / 420)), x, y: y + 0.12, anchor: 2, shadow: false });

// ───── 地下の川の くらやみ ─────
const DARK = 'rgba(2, 2, 10, 0.95)';
const GLOW = { lamp: ['255, 210, 140', 1.4, 0.55], gold: ['255, 220, 120', 2.4, 0.45], moss: ['120, 255, 200', 1, 0.45] };
function people(field) {
  const out = [];
  if (!field.hideMe) out.push([field.me.x, field.me.y - 0.4]);
  for (const o of field.others.values()) out.push([o.x, o.y - 0.4]);
  for (const a of field.actors.values()) out.push([a.x, a.y - 0.4]);
  return out;
}
export function drawC9cDark2D(field, camX, camY) {
  const m = field.map, D = m.c9cDark;
  const ctx = field.ctx, t = field.time;
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (px, py, rad) => {
    const gr = g.createRadialGradient(px, py, rad * 0.55, px, py, rad);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) hole(px * TS - camX, py * TS - camY, (D.spica + 0.5) * TS * flick);
  const sing = c9dSingingSpica(field);
  if (sing) hole(sing.x * TS - camX, (sing.y - 0.4) * TS - camY, (LIGHT_SPICA9D + 0.5) * TS * flick);
  for (const [cx, cy, r] of D.lights) hole((cx + 0.5) * TS - camX, (cy + 0.5) * TS - camY, (r + 0.5) * TS);
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, , kind] of D.lights) {
    const G = GLOW[kind];
    if (!G) continue;
    const px = (cx + 0.5) * TS - camX, py = (cy + 0.5) * TS - camY;
    if (px < -80 || py < -80 || px > field.vw + 80 || py > field.vh + 80) continue;
    const rad = G[1] * TS, pulse = 0.8 + Math.sin(t / 300 + cx) * 0.2;
    const gr = ctx.createRadialGradient(px, py, 1, px, py, rad);
    gr.addColorStop(0, `rgba(${G[0]}, ${G[2] * pulse})`);
    gr.addColorStop(1, `rgba(${G[0]}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
export function drawC9cDark3D(field, ctx, P) {
  const m = field.map, D = m.c9cDark, t = field.time;
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (p, rad) => {
    const gr = g.createRadialGradient(p.x, p.y, rad * 0.55, p.x, p.y, rad);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) { const p = P(px, py + 0.4, 0.5); hole(p, (D.spica + 0.5) * p.k * flick); }
  const sing = c9dSingingSpica(field);
  if (sing) { const p = P(sing.x, sing.y, 0.5); hole(p, (LIGHT_SPICA9D + 0.5) * p.k * flick); }
  for (const [cx, cy, r] of D.lights) {
    if (Math.abs(cx - field.me.x) > 30 || Math.abs(cy - field.me.y) > 30) continue;
    const p = P(cx + 0.5, cy + 0.5, 0.3);
    hole(p, (r + 0.5) * p.k);
  }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
}

// ───── さかさの 時の 画面（ふちの うす紫・砂つぶが 上へ・「さかさ」の しるし）─────
function flipOverlay(field, ctx, W, H) {
  if (!myFlip9c(field)) return;
  const t = field.time;
  // ふちの うす紫
  const gr = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.72);
  gr.addColorStop(0, 'rgba(170, 130, 230, 0)');
  gr.addColorStop(1, 'rgba(170, 130, 230, 0.42)');
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, W, H);
  // 砂つぶ（下から 上へ）
  ctx.fillStyle = 'rgba(255, 236, 190, 0.75)';
  for (let i = 0; i < 46; i++) {
    const sx = ((i * 97) % 1000) / 1000 * W;
    const sp = 0.04 + (i % 5) * 0.012;
    const sy = H - ((t * sp + i * 131) % (H + 20));
    const s = i % 3 === 0 ? 2 : 1;
    ctx.fillRect(Math.round(sx + Math.sin(t / 400 + i) * 3), Math.round(sy), s, s * 2);
  }
  // 「さかさ」の しるし（画面の 上）
  const label = 'さかさ';
  ctx.save();
  ctx.font = 'bold 14px sans-serif';
  const w = ctx.measureText(label).width + 28;
  const x = Math.round(W / 2 - w / 2), y = 6;
  ctx.fillStyle = 'rgba(40, 20, 70, 0.82)';
  ctx.fillRect(x, y, w, 22);
  ctx.strokeStyle = 'rgba(220, 190, 255, 0.95)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 21);
  ctx.fillStyle = '#f4e8ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const bob = Math.sin(t / 300) * 1.5;
  ctx.fillText('↕', x + 10, y + 11 + bob);
  ctx.fillText(label, W / 2 + 6, y + 12);
  ctx.restore();
}
export const drawC9cFlip2D = (field) => flipOverlay(field, field.ctx, field.vw, field.vh);
export const drawC9cFlip3D = (field, ctx) => flipOverlay(field, ctx, field.vw, field.vh);
