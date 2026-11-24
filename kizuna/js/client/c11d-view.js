// 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 見え方（client/field.js の 2D と 2.5D・まいフレームから）
// ※ ネタバレ注意（docs/plan-part3-c11d.md の 20-4）
// ・1〜3階の しかけの 見え方は 前の 幕の まま（client/c11a-view.js・c11b-view.js・c11c-view.js が マップの c11aCons・c11b・c11c を 見て かく）
// ・音の 間（map.c11dPads。サーバーの snap の c11d … { n: 鳴らした 数, nx: 次の 台, h: 1（じゅんが 光る）, d: 1（とびらが 開いた）}）:
//   かべの 歌の 絵（7色の 音ぷが 歌の じゅんに ならぶ）・鳴らした 台の 光・じゅんが 光る（台の 上に 1〜7 の 数）・台を ふむと その 音
// ・曲へ field.towerStage（今 いる かがやきの 塔の 階 1〜4。塔の 外では 0。前の 幕の pairStage と 同じ 形）
import { C11D_SONG_ORDER } from '../shared/maps/c11d-flags.js?v=71ec2a6ff6b8';
import { PAD_COLORS11D } from './render/tiles-c11d.js?v=71ec2a6ff6b8';
import { TS } from './render/tiles.js?v=71ec2a6ff6b8';

// 音の 高さ（台の ならび … レ・ド・ミ・ファ・ソ・ラ・シ。ドは 歌の さいごの 音なので 高い ド）
const PAD_HZ = [587.3, 1046.5, 659.3, 698.5, 784.0, 880.0, 987.8];

// ───── サーバーの snap ─────
export function noteC11dSnap(field, d) {
  const prev = field.c11d && field.c11d.map === field.mapId ? field.c11d : null;
  field.c11d = d ? { ...d, map: field.mapId } : null;
  // 台が 鳴った（鳴らした 数が ふえた）: その 音（家族が ふんでも 鳴る）
  if (d && prev && !d.d && d.n > prev.n) {
    const i = C11D_SONG_ORDER[d.n - 1];
    try { field.game?.audio?.tone?.(PAD_HZ[i], 0.6, { vol: 0.12, type: 'sine' }); } catch { /* 音が 出せない 時は 何も しない */ }
    (field.c11dFlash || (field.c11dFlash = {}))[i] = field.time;
  }
}
const stateOf = (field) => (field.map?.c11dPads && field.c11d && field.c11d.map === field.mapId ? field.c11d : null);
// 画面の 状態（まいフレーム。F班の 曲）: field.towerStage
export function noteC11dStage(field) {
  field.towerStage = field.map?.c11dTower || 0;
}

// ───── かく 物 ─────
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
// 鳴らした 台の 光の 輪（x, y … 画面の 台の まん中・k … 1マスの 大きさ）
function padGlow(ctx, x, y, k, col, t, flash) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const r = k * (0.75 + 0.06 * Math.sin(t / 200) + flash * 0.4);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, 0.55 + flash * 0.3));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
// じゅんの 数（スピカが 口ずさむ 時）
function orderNum(ctx, x, y, k, n, next, t) {
  ctx.save();
  const s = Math.max(10, Math.round(k * (next ? 0.6 : 0.46)));
  ctx.font = `bold ${s}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const yy = y - k * 0.75 - (next ? Math.abs(Math.sin(t / 220)) * k * 0.15 : 0);
  ctx.lineWidth = Math.max(2, k * 0.12);
  ctx.strokeStyle = 'rgba(20, 16, 50, 0.85)';
  ctx.strokeText(String(n), x, yy);
  ctx.fillStyle = next ? '#fff080' : '#ffffff';
  ctx.fillText(String(n), x, yy);
  ctx.restore();
}
// かべの 歌の 絵（7色の 音ぷ。歌の じゅんに 左から）
const MURAL_X = [4.5, 6, 7.5, 9, 12.5, 14.5, 16.5];
function muralNote(ctx, x, y, k, col, n) {
  ctx.save();
  ctx.fillStyle = col;
  ctx.strokeStyle = 'rgba(40, 30, 60, 0.8)';
  ctx.lineWidth = Math.max(1, k * 0.05);
  ctx.beginPath(); ctx.ellipse(x - k * 0.12, y + k * 0.12, k * 0.2, k * 0.15, -0.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillRect(x + k * 0.05, y - k * 0.35, Math.max(1.5, k * 0.06), k * 0.45);
  ctx.font = `bold ${Math.max(8, Math.round(k * 0.3))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3a3458';
  ctx.fillText(String(n), x, y + k * 0.45);
  ctx.restore();
}
function drawRoom(field, ctx, at, wallY = 7.45) {
  const m = field.map;
  const st = stateOf(field);
  const t = field.time;
  // かべの 歌の 絵
  C11D_SONG_ORDER.forEach((i, n) => {
    const p = at(MURAL_X[n], wallY, 0.8); // かべの 南の 面
    muralNote(ctx, p.x, p.y, p.k, PAD_COLORS11D[i][0], n + 1);
  });
  if (!st || st.d) return;
  // 鳴らした 台（この 回の 歌）
  for (let n = 0; n < st.n; n++) {
    const i = C11D_SONG_ORDER[n];
    const P = m.c11dPads[i];
    const p = at(P.x + 0.5, P.y + 0.5, 0.05);
    const fl = field.c11dFlash?.[i];
    padGlow(ctx, p.x, p.y, p.k, PAD_COLORS11D[i][1], t, fl != null && t - fl < 500 ? 1 - (t - fl) / 500 : 0);
  }
  // じゅんが 光る（まちがえた 回数が 3回 いじょう）
  if (st.h) {
    C11D_SONG_ORDER.forEach((i, n) => {
      if (n < st.n) return;
      const P = m.c11dPads[i];
      const p = at(P.x + 0.5, P.y + 0.5, 0.5);
      orderNum(ctx, p.x, p.y, p.k, n + 1, n === st.n, t);
    });
  }
}

// ───── 2D（人の 絵の 上）─────
export function drawC11d2D(field, camX, camY) {
  if (!field.map?.c11dPads) return;
  drawRoom(field, field.ctx, (x, y) => ({ x: x * TS - camX, y: y * TS - camY, k: TS }));
}
// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC11d3D(field, ctx, P) {
  if (!field.map?.c11dPads) return;
  drawRoom(field, ctx, (x, y, up) => P(x, y, up), 8.02);
}
