// 第3部 第2章 第1幕「赤と緑」の 見え方（client/field.js の 2D と 2.5D・game.js の HUD から）
// ※ ネタバレ注意（docs/plan-part3-c10a.md の 13-4）
// ・溶岩に 追われる（snap の c10 … { lava, next, iv, n, hold }）: 画面の 下から 赤い 光が せまる・ゆれ・音。画面の 上に「ようがんまで あと ○だん」
//   画面の 状態 lavaStage（0〜3。F班の 曲 c10r_run）: 溶岩まで 10だん いじょう → 0・7〜9 → 1・4〜6 → 2・3 いか → 3
// ・メニューを 開いて いる 間は サーバーに 知らせて 溶岩を 止める（{ t:'menu', action:'c10Hold', on }）
// ・見はらし台（台本の ['c10Wide', true]）: 画面を 広く 引く（2D は 1マスを 小さく かく）
import { lavaStageOfGap } from '../shared/maps/c10a-flags.js?v=b3f22aad5877';
import { TS } from './render/tiles.js?v=b3f22aad5877';
import { el } from './ui/dom.js?v=b3f22aad5877';

// ───── サーバーの snap ─────
export function noteC10aSnap(field, d) {
  if (!d) { field.c10 = null; return; }
  field.c10 = { lava: d.lava, at: field.time, next: d.next, iv: d.iv || 3000, n: d.n || 0, hold: !!d.hold, map: field.mapId };
}
const stateOf = (field) => (field.c10 && field.c10.map === field.mapId && field.map?.c10Red ? field.c10 : null);
export const lavaRunning10a = (field) => !!stateOf(field);
// 画面で 見せる 溶岩の 上の はし（なめらかに 上がる。止まって いる 間は 止める）
export function lavaTop10a(field) {
  const st = stateOf(field);
  if (!st) return null;
  if (st.hold) return st.lava;
  const pass = Math.max(0, field.time - st.at);
  const k = Math.min(1, Math.max(0, 1 - (st.next - pass) / st.iv));
  return st.lava - k * 0.85;
}
// 溶岩まで あと 何だん
export function lavaGapOf10a(field) {
  const st = stateOf(field);
  if (!st) return null;
  return Math.floor(st.lava) - Math.floor(field.me.y);
}
// 画面の 状態（まいフレーム。F班の 曲）
export function noteC10aStage(field) {
  const g = lavaGapOf10a(field);
  field.lavaStage = g === null ? 0 : lavaStageOfGap(g);
}

// ───── 2D ─────
export function drawC10aLava2D(field, camX, camY) {
  noteC10aStage(field);
  const top = lavaTop10a(field);
  if (top === null) return;
  const ctx = field.ctx;
  const t = field.time;
  const sy = top * TS - camY;
  if (sy > field.vh + 40) return lavaGlowEdge(field, ctx, field.vh, 0.25 + 0.1 * Math.sin(t / 300));
  const y0 = Math.max(-10, sy);
  // ようがんの 面（ゆらぐ ふち）
  ctx.save();
  ctx.fillStyle = 'rgba(200, 40, 10, 0.82)';
  ctx.beginPath();
  ctx.moveTo(0, field.vh);
  for (let x = 0; x <= field.vw + 8; x += 8) ctx.lineTo(x, y0 + Math.sin(t / 220 + x / 23) * 2.5);
  ctx.lineTo(field.vw, field.vh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 170, 40, 0.55)';
  for (let x = ((t / 40) % 24) - 24; x < field.vw; x += 24) ctx.fillRect(x, y0 + 6 + Math.sin(t / 300 + x) * 3, 10, 2);
  ctx.restore();
  lavaGlowEdge(field, ctx, y0, 0.5);
}
function lavaGlowEdge(field, ctx, y0, a) {
  const h = 70;
  const gr = ctx.createLinearGradient(0, y0 - h, 0, y0);
  gr.addColorStop(0, 'rgba(255, 80, 20, 0)');
  gr.addColorStop(1, `rgba(255, 90, 20, ${a})`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, y0 - h, field.vw, h);
}
// ゆれ（溶岩が 近いほど 大きい。2D の カメラを ずらす 量）
export function lavaShake10a(field) {
  const g = lavaGapOf10a(field);
  if (g === null || g > 6) return 0;
  return Math.sin(field.time / 37) * (g <= 3 ? 1.6 : 0.8);
}

// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC10aLava3D(field, ctx, P) {
  noteC10aStage(field);
  const top = lavaTop10a(field);
  if (top === null) return;
  const t = field.time;
  const xs = [-12, -6, 0, 6, 12].map((dx) => P(field.me.x + dx, top, 0));
  let y0 = Math.min(...xs.map((p) => p.y));
  if (!Number.isFinite(y0)) return;
  if (y0 > field.vh + 40) return lavaGlowEdge(field, ctx, field.vh, 0.25 + 0.1 * Math.sin(t / 300));
  y0 = Math.max(-10, y0);
  ctx.save();
  ctx.fillStyle = 'rgba(200, 40, 10, 0.78)';
  ctx.beginPath();
  ctx.moveTo(0, field.vh);
  for (let x = 0; x <= field.vw + 8; x += 8) ctx.lineTo(x, y0 + Math.sin(t / 220 + x / 23) * 2.5);
  ctx.lineTo(field.vw, field.vh);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  lavaGlowEdge(field, ctx, y0, 0.5);
}

// ───── 見はらし台（画面を 広く 引く）─────
export function setWide10a(field, on) {
  if (!field) return;
  field.wide10a = !!on;
  field.resize?.();
}
// field.resize の 中で よぶ（2D の 1マスの 大きさを 小さく する）
export const wideScale10a = (field, scale) => (field.wide10a ? Math.max(1, Math.round(scale * 0.55)) : scale);

// ───── HUD「ようがんまで あと ○だん」・メニューで 止める・2行の 目標（すきな じゅんの 幕）を 行で 分けて 見せる（.hud-obj の pre-line）─────
const CSS = `
.c10-lava { position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 64px); transform: translateX(-50%); z-index: 30;
  padding: 4px 14px; border-radius: 10px; background: rgba(40, 6, 2, 0.82); border: 2px solid #ff7a3a; color: #ffe0c0;
  font-weight: bold; font-size: 18px; pointer-events: none; white-space: nowrap; text-shadow: 0 1px 2px #000; }
.c10-lava.near { color: #fff; border-color: #ffd040; background: rgba(120, 16, 4, 0.9); }
.c10-lava b { color: #ffd060; font-size: 22px; margin: 0 2px; }
.hud-obj { white-space: pre-line; }
@media (max-width: 600px) { .c10-lava { top: calc(env(safe-area-inset-top, 0px) + 96px); font-size: 15px; } .c10-lava b { font-size: 18px; } }
`;
export const lavaHudText10a = (gap) => `ようがんまで、あと${Math.max(0, gap)}だん`;
export class C10aLavaHud {
  constructor(game) {
    this.game = game;
    this.held = false;
    this.rumbleAt = 0;
    if (typeof document === 'undefined') return;
    if (!document.getElementById('c10-lava-css')) document.head.append(el('style', { id: 'c10-lava-css', text: CSS }));
    this.box = el('div', { class: 'c10-lava' });
    this.box.hidden = true;
    document.getElementById('ui')?.append(this.box);
  }
  update() {
    const g = this.game;
    const f = g.field;
    const run = g.state === 'field' && !!f && lavaRunning10a(f);
    // メニュー（と 戦いの けっか・道具の まど）を 開いて いる 間は サーバーの 溶岩を 止める
    const hold = run && !!g.menuOpen;
    if (hold !== this.held) {
      this.held = hold;
      g.net?.send?.({ t: 'menu', action: 'c10Hold', on: hold });
    }
    if (!this.box) return;
    if (!this.box.isConnected) document.getElementById('ui')?.append(this.box);
    if (!run) { if (!this.box.hidden) this.box.hidden = true; return; }
    const gap = lavaGapOf10a(f);
    const near = gap <= 3;
    const html = `ようがんまで、あと<b>${Math.max(0, gap)}</b>だん`;
    if (this.box.innerHTML !== html) this.box.innerHTML = html;
    this.box.classList.toggle('near', near);
    if (this.box.hidden) this.box.hidden = false;
    // 近い 時は ときどき 地ひびき
    if (gap <= 4 && f.time - this.rumbleAt > 2600 && !g.busy) {
      this.rumbleAt = f.time;
      g.audio?.sfx?.('rumble');
    }
  }
}

// ───── 根の国（map.c10Green）: ふわふわ 上がる 光る ほうし・まわりの やみ（2D と 2.5D の 上に かさねる。画面の 場所で かく）─────
export function drawC10aSpores(field, ctx) {
  const t = field.time / 1000;
  const W = field.vw, H = field.vh;
  // まわりの やみ（ここは 大地の下。上も 下も 根と やみ）
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(4, 10, 14, 0)');
  vg.addColorStop(1, 'rgba(4, 10, 14, 0.55)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const n = Math.round((W * H) / 9000) + 18;
  for (let i = 0; i < n; i++) {
    const a = (i * 0.618034) % 1, b = (i * 0.414214) % 1;
    const sp = 10 + b * 16;
    const y = H + 10 - ((t * sp + a * (H + 20)) % (H + 20));
    const x = (a * W + Math.sin(t * (0.6 + b) + i) * 14 + W) % W;
    const r = 1 + (i % 3) * 0.6;
    const k = 0.45 + 0.35 * Math.sin(t * 2 + i);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, `rgba(170, 255, 220, ${k})`);
    g.addColorStop(1, 'rgba(120, 255, 200, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  }
  ctx.restore();
}
