// 第3部 第2章 第3幕「紫と、うばわれた音」の 見え方（client/field.js の 2D と 2.5D・game.js の HUD から）
// ※ ネタバレ注意（docs/plan-part3-c10c.md の 15-2）
// ・音の 橋（snap の c10c.br … { 色: すき間 }）: とびらの しるし '@br<すき間>:<色>'（field.hasFlag）で すき間の マスが 光の 橋に なる。
//   画面の 上に 今 かかって いる 橋の 色（●●○○○）。曲へ field.bridgeStage（かかって いる 橋の 数 0〜5）
// ・空の 小島: とおくに 影の城の かげと 雲の 海（2D の 上の 光・2.5D の 空の 色）
// ・ベルトの 工場: ベルトの 矢じるしは タイルの コマで 動く（render/tiles-c10c.js）
import { C10C_BRIDGE_COLORS, C10C_BRIDGE_MAX } from '../shared/maps/c10c-flags.js?v=6a7817ffa6c0';
import { el } from './ui/dom.js?v=6a7817ffa6c0';

// ───── サーバーの snap ─────
export function noteC10cSnap(field, d) {
  const prev = field.c10c;
  if (!d) { field.c10c = null; return; }
  field.c10c = { ...d, map: field.mapId };
  // 橋が ふえた（キイィン）
  const n = (x) => Object.keys(x?.br || {}).length;
  if (prev && prev.map === field.mapId && JSON.stringify(prev.br) !== JSON.stringify(d.br)) field.c10cFlash = { at: field.time, more: n(d) >= n(prev) };
}
const stateOf = (field) => (field.c10c && field.c10c.map === field.mapId ? field.c10c : null);
// 自分の パーティーの 橋（{ 色: すき間 }）
export const bridgesOf10c = (field) => (field.map?.c10cSpans ? stateOf(field)?.br || {} : {});
// とびらの しるし（field.hasFlag。わからない しるしは undefined）
export function c10cFieldFlag(field, f) {
  if (!f.startsWith('@br')) return undefined;
  const [i, c] = f.slice(3).split(':');
  return bridgesOf10c(field)[c] === Number(i);
}
// 画面の 状態（まいフレーム。F班の 曲）: field.bridgeStage … かかって いる 橋の 数（0〜5）
export function noteC10cStage(field) {
  field.bridgeStage = field.map?.c10cSpans ? Math.min(C10C_BRIDGE_MAX, Object.keys(bridgesOf10c(field)).length) : 0;
}

// ───── 空の 小島の 2D・2.5D の かざり（とおくの 影の城・橋が かかった 時の 光）─────
export function drawC10cSky(field, ctx) {
  const m = field.map;
  if (!m?.c10cSky) return;
  const W = field.vw, H = field.vh, t = field.time;
  ctx.save();
  // 上の 空の 光
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.3);
  g.addColorStop(0, `rgba(255, 255, 255, ${0.22 + 0.04 * Math.sin(t / 900)})`);
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.3);
  // とおくの 影の城の かげ（右上。うすく）
  const k = Math.max(0.6, Math.min(1.4, W / 900));
  const cx = W - 90 * k, by = 70 * k;
  ctx.fillStyle = 'rgba(40, 36, 70, 0.28)';
  ctx.beginPath();
  ctx.moveTo(cx - 40 * k, by);
  ctx.lineTo(cx - 40 * k, by - 18 * k); ctx.lineTo(cx - 30 * k, by - 18 * k); ctx.lineTo(cx - 30 * k, by - 34 * k); ctx.lineTo(cx - 24 * k, by - 42 * k);
  ctx.lineTo(cx - 18 * k, by - 34 * k); ctx.lineTo(cx - 18 * k, by - 22 * k); ctx.lineTo(cx - 6 * k, by - 22 * k); ctx.lineTo(cx - 6 * k, by - 48 * k);
  ctx.lineTo(cx, by - 58 * k); ctx.lineTo(cx + 6 * k, by - 48 * k); ctx.lineTo(cx + 6 * k, by - 22 * k); ctx.lineTo(cx + 20 * k, by - 22 * k);
  ctx.lineTo(cx + 20 * k, by - 32 * k); ctx.lineTo(cx + 26 * k, by - 38 * k); ctx.lineTo(cx + 32 * k, by - 32 * k); ctx.lineTo(cx + 32 * k, by - 16 * k);
  ctx.lineTo(cx + 40 * k, by - 16 * k); ctx.lineTo(cx + 40 * k, by);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath(); ctx.ellipse(cx, by + 4 * k, 56 * k, 9 * k, 0, 0, Math.PI * 2); ctx.fill();
  // 橋が かかった 時の 光
  const fl = field.c10cFlash;
  if (fl) {
    const q = (t - fl.at) / 700;
    if (q >= 1) field.c10cFlash = null;
    else { ctx.fillStyle = `rgba(255, 250, 220, ${0.25 * (1 - q)})`; ctx.fillRect(0, 0, W, H); }
  }
  ctx.restore();
}

// ───── HUD「橋 ●●○○○」（色の 丸。かかって いる 色だけ 光る）─────
const DOT = { red: '#ff5a5a', yellow: '#ffd83a', green: '#5ad86a', blue: '#4a9aff', white: '#ffffff' };
const CSS = `
.c10c-hud { position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 64px); transform: translateX(-50%); z-index: 30;
  padding: 4px 14px; border-radius: 10px; background: rgba(30, 36, 70, 0.8); border: 2px solid #c8b8ff; color: #f0f0ff;
  font-weight: bold; font-size: 18px; pointer-events: none; white-space: nowrap; text-shadow: 0 1px 2px #000; }
.c10c-hud .d { display: inline-block; width: 16px; height: 16px; margin: 0 3px; border-radius: 50%; vertical-align: -2px;
  border: 2px solid rgba(255, 255, 255, 0.55); background: rgba(255, 255, 255, 0.08); }
.c10c-hud .d.on { border-color: #fff; box-shadow: 0 0 6px rgba(255, 255, 255, 0.8); }
@media (max-width: 600px) { .c10c-hud { top: calc(env(safe-area-inset-top, 0px) + 96px); font-size: 15px; } .c10c-hud .d { width: 13px; height: 13px; } }
`;
// 文字だけの 形（テスト用）: 「橋 ●●○○○」
export const bridgeHudText10c = (br) => `橋 ${C10C_BRIDGE_COLORS.map((c) => (br[c] !== undefined ? '●' : '○')).join('')}`;
export class C10cHud {
  constructor(game) {
    this.game = game;
    if (typeof document === 'undefined') return;
    if (!document.getElementById('c10c-hud-css')) document.head.append(el('style', { id: 'c10c-hud-css', text: CSS }));
    this.box = el('div', { class: 'c10c-hud' });
    this.box.hidden = true;
    document.getElementById('ui')?.append(this.box);
  }
  update() {
    if (!this.box) return;
    const g = this.game;
    const f = g.field;
    const on = g.state === 'field' && !!f?.map?.c10cSpans;
    if (!this.box.isConnected) document.getElementById('ui')?.append(this.box);
    if (!on) { if (!this.box.hidden) this.box.hidden = true; return; }
    const br = bridgesOf10c(f);
    const html = `橋${C10C_BRIDGE_COLORS.map((c) => `<span class="d${br[c] !== undefined ? ' on' : ''}" style="${br[c] !== undefined ? `background:${DOT[c]}` : ''}"></span>`).join('')}`;
    if (this.box.innerHTML !== html) this.box.innerHTML = html;
    if (this.box.hidden) this.box.hidden = false;
  }
}
