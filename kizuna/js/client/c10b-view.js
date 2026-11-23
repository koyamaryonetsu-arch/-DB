// 第3部 第2章 第2幕「青と白」の 見え方（client/field.js の 2D と 2.5D・game.js の HUD から）
// ※ ネタバレ注意（docs/plan-part3-c10b.md の 14-2）
// ・水の 高さ（snap の c10b.w）: とびらの しるし '@w0'〜'@w2'（field.hasFlag）で マスの すがたが かわる。画面の 上に「水：下／中／上」。
//   かわった 時は 短い えんしゅつ（ザーッ … 青い 波が 画面を 横切る）。曲へ field.waterStage（0〜2）
// ・こっそり（snap の c10b … st 歩数・nz もの音・cg 見つかった 回数・sl 見はりが ねむる・al 見つかった すぐ あと）:
//   見はりの フクロウ（氷の 柱の 上。向きと 目）と 見て いる マス（うすく 光る）・画面の 上に「もの音 ●●○」。
//   曲へ field.alertStage（0 … 見はりが 遠い・1 … 近い・2 … 見つかった）
// ・'@&a&b' … a と b の 両方（夜だけの 光の 階段）
import { TILE_INFO, T } from '../shared/tiles.js?v=31ca07498b9b';
import { effectiveTile } from '../shared/maps/index.js?v=31ca07498b9b';
import { C10B_WATER_NAMES, C10B_WATER_START, C10B_NOISE_MAX, C10B_ALERT_NEAR } from '../shared/maps/c10b-flags.js?v=31ca07498b9b';
import { watchedCells10b, activeOwls10b, owlDir10b } from '../shared/maps/c10b-sneak.js?v=31ca07498b9b';
import { TS } from './render/tiles.js?v=31ca07498b9b';
import { el } from './ui/dom.js?v=31ca07498b9b';

// ───── サーバーの snap ─────
export function noteC10bSnap(field, d) {
  const prev = field.c10b;
  if (!d) { field.c10b = null; return; }
  field.c10b = { ...d, map: field.mapId };
  // 水が かわった（ザーッ）
  if (prev && prev.map === field.mapId && prev.w !== undefined && d.w !== undefined && prev.w !== d.w) {
    field.c10bWave = { at: field.time, up: d.w > prev.w };
    field.game?.audio?.sfx?.('wind');
  }
}
const stateOf = (field) => (field.c10b && field.c10b.map === field.mapId ? field.c10b : null);
// 自分の 水の 高さ（snap が まだ ない 時は 中）
export const waterOf10b = (field) => (field.map?.c10bBlue ? stateOf(field)?.w ?? C10B_WATER_START : C10B_WATER_START);
// とびらの しるし（field.hasFlag。わからない しるしは undefined）
export function c10bFieldFlag(field, f, has) {
  if (f === '@w0' || f === '@w1' || f === '@w2') return waterOf10b(field) === Number(f[2]);
  if (f.startsWith('@&')) return f.slice(2).split('&').every((x) => has(x));
  return undefined;
}

// ───── こっそり ─────
const sneakOf = (field) => (field.map?.c10bSneak ? stateOf(field) || { st: 0, nz: 0, cg: 0 } : null);
export function watched10b(field) {
  const s = sneakOf(field);
  if (!s) return null;
  const key = `${field.mapId}|${s.st}|${s.cg}|${s.sl ? 1 : 0}`;
  if (field.c10bWatchKey !== key) {
    field.c10bWatchKey = key;
    field.c10bWatched = watchedCells10b(field.map, s.st || 0, s.cg || 0, !!s.sl, (f) => field.gateFlag(f));
  }
  return field.c10bWatched;
}
// 画面の 状態（まいフレーム。F班の 曲）
export function noteC10bStage(field) {
  field.waterStage = field.map?.c10bBlue ? waterOf10b(field) : 0;
  const s = sneakOf(field);
  if (!s) { field.alertStage = 0; return; }
  if (s.al) { field.alertStage = 2; return; }
  const w = watched10b(field);
  const mx = Math.floor(field.me.x), my = Math.floor(field.me.y);
  let near = false;
  if (w && !s.sl) for (const k of w) { const [x, y] = k.split(',').map(Number); if (Math.abs(x - mx) + Math.abs(y - my) <= C10B_ALERT_NEAR) { near = true; break; } }
  field.alertStage = near ? 1 : 0;
}

// 見て いる マス（うすく 光る）と フクロウ（2D）
export function drawC10bSneak2D(field, camX, camY) {
  const m = field.map;
  const s = sneakOf(field);
  if (!s) return;
  const ctx = field.ctx, t = field.time;
  const w = watched10b(field);
  ctx.save();
  if (w) {
    ctx.fillStyle = `rgba(255, 220, 60, ${0.3 + 0.08 * Math.sin(t / 260)})`;
    ctx.strokeStyle = 'rgba(255, 240, 160, 0.7)';
    ctx.lineWidth = 1;
    for (const k of w) {
      const [x, y] = k.split(',').map(Number);
      ctx.fillRect(x * TS - camX, y * TS - camY, TS, TS);
      ctx.strokeRect(x * TS - camX + 0.5, y * TS - camY + 0.5, TS - 1, TS - 1);
    }
  }
  for (const o of activeOwls10b(m, s.cg || 0)) drawOwl(ctx, o.x * TS + TS / 2 - camX, o.y * TS + 2 - camY, TS / 16, owlDir10b(o, s.st || 0), !!s.sl, t);
  ctx.restore();
}
// 2.5D（P(x, y, up) … 画面の 場所と 1マスの 大きさ）
export function drawC10bSneak3D(field, ctx, P) {
  const m = field.map;
  const s = sneakOf(field);
  if (!s) return;
  const t = field.time;
  const w = watched10b(field);
  ctx.save();
  if (w) {
    ctx.fillStyle = `rgba(255, 220, 60, ${0.28 + 0.08 * Math.sin(t / 260)})`;
    for (const k of w) {
      const [x, y] = k.split(',').map(Number);
      const a = P(x, y, 0.02), b = P(x + 1, y, 0.02), c = P(x + 1, y + 1, 0.02), d = P(x, y + 1, 0.02);
      if (![a, b, c, d].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
    }
  }
  for (const o of activeOwls10b(m, s.cg || 0)) {
    const p = P(o.x + 0.5, o.y + 0.5, 1.7);
    if (!Number.isFinite(p.x)) continue;
    drawOwl(ctx, p.x, p.y, Math.max(1, p.k / 16), owlDir10b(o, s.st || 0), !!s.sl, t);
  }
  ctx.restore();
}
// 見はりの フクロウ（まるい 体・大きな 目。向いて いる 方に 目が よる。ねむって いる 時は 目を とじて「z」）
function drawOwl(ctx, cx, cy, k, dir, asleep, t) {
  const bob = Math.sin(t / 300) * k * 0.5;
  const y = cy + bob;
  ctx.fillStyle = '#c8d0dc';
  ctx.beginPath(); ctx.ellipse(cx, y + 5 * k, 5 * k, 6 * k, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eef2f8';
  ctx.beginPath(); ctx.ellipse(cx, y + 6.5 * k, 3.2 * k, 3.8 * k, 0, 0, Math.PI * 2); ctx.fill();
  // 耳の 羽
  ctx.fillStyle = '#9aa4b4';
  ctx.beginPath(); ctx.moveTo(cx - 4.5 * k, y + 0.5 * k); ctx.lineTo(cx - 2.5 * k, y + 2.5 * k); ctx.lineTo(cx - 5 * k, y + 3 * k); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 4.5 * k, y + 0.5 * k); ctx.lineTo(cx + 2.5 * k, y + 2.5 * k); ctx.lineTo(cx + 5 * k, y + 3 * k); ctx.fill();
  const off = { up: [0, -0.8], down: [0, 0.8], left: [-1, 0], right: [1, 0] }[dir] || [0, 0];
  if (asleep) {
    ctx.strokeStyle = '#3a4050'; ctx.lineWidth = Math.max(1, k * 0.8);
    for (const ex of [-1.8, 1.8]) { ctx.beginPath(); ctx.moveTo(cx + (ex - 1) * k, y + 3.5 * k); ctx.lineTo(cx + (ex + 1) * k, y + 3.5 * k); ctx.stroke(); }
    ctx.fillStyle = '#e8f0ff';
    ctx.font = `bold ${Math.round(5 * k)}px sans-serif`;
    ctx.fillText('z', cx + 5 * k, y - ((t / 40) % (6 * k)));
    return;
  }
  if (dir === 'up') {
    // うしろ向き（せなかの もよう）
    ctx.fillStyle = '#8a94a4';
    ctx.beginPath(); ctx.ellipse(cx, y + 4 * k, 2.6 * k, 1.6 * k, 0, 0, Math.PI * 2); ctx.fill();
    return;
  }
  for (const ex of [-1.8, 1.8]) {
    ctx.fillStyle = '#ffd040';
    ctx.beginPath(); ctx.arc(cx + ex * k, y + 3.4 * k, 1.5 * k, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1420';
    ctx.beginPath(); ctx.arc(cx + (ex + off[0] * 0.7) * k, y + (3.4 + off[1] * 0.7) * k, 0.8 * k, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e0a040';
  ctx.beginPath(); ctx.moveTo(cx - 0.6 * k + off[0] * k, y + 4.6 * k); ctx.lineTo(cx + 0.6 * k + off[0] * k, y + 4.6 * k); ctx.lineTo(cx + off[0] * 1.4 * k, y + 5.8 * k); ctx.fill();
}

// ───── 水が かわる 時の えんしゅつ（ザーッ）・水の ゆらぎ ─────
export function drawC10bWater(field, ctx) {
  const m = field.map;
  if (!m?.c10bBlue) return;
  const W = field.vw, H = field.vh, t = field.time;
  // 天じょうの うらがえしの 水鏡の 光（画面の 上に ゆらぐ 光）
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, 0, 0, H * 0.35);
  g.addColorStop(0, `rgba(80, 160, 255, ${0.16 + 0.04 * Math.sin(t / 700)})`);
  g.addColorStop(1, 'rgba(80, 160, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H * 0.35);
  ctx.restore();
  const wv = field.c10bWave;
  if (!wv) return;
  const k = (t - wv.at) / 900;
  if (k >= 1) { field.c10bWave = null; return; }
  ctx.save();
  ctx.fillStyle = `rgba(60, 140, 230, ${0.35 * (1 - k)})`;
  const y0 = wv.up ? H * (1 - k) : H * k;
  ctx.beginPath();
  ctx.moveTo(0, wv.up ? H : 0);
  for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, y0 + Math.sin(x / 30 + t / 80) * 8);
  ctx.lineTo(W, wv.up ? H : 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ───── いかだ（水の 上の マス）: c9c-view.js の raftAt9c から ─────
export function raftAt10b(field, x, y) {
  const m = field.map;
  if (!m?.c10bBlue) return false;
  return !!TILE_INFO[effectiveTile(m, Math.floor(x), Math.floor(y), (f) => field.gateFlag(f))]?.c10bRaft;
}

// ───── HUD「水：中」・「もの音 ●○○」─────
const CSS = `
.c10b-hud { position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 64px); transform: translateX(-50%); z-index: 30;
  padding: 4px 14px; border-radius: 10px; background: rgba(6, 20, 40, 0.82); border: 2px solid #6ab0ff; color: #e0f0ff;
  font-weight: bold; font-size: 18px; pointer-events: none; white-space: nowrap; text-shadow: 0 1px 2px #000; }
.c10b-hud b { color: #9ad8ff; font-size: 20px; margin: 0 2px; }
.c10b-hud .lv { display: inline-block; margin: 0 3px; padding: 0 6px; border-radius: 6px; opacity: 0.45; }
.c10b-hud .lv.on { opacity: 1; background: #2a7ac0; color: #fff; }
.c10b-hud.sneak { border-color: #d8e8ff; background: rgba(14, 22, 40, 0.82); }
.c10b-hud.alert { border-color: #ffd040; }
@media (max-width: 600px) { .c10b-hud { top: calc(env(safe-area-inset-top, 0px) + 96px); font-size: 15px; } .c10b-hud b { font-size: 17px; } }
`;
export const waterHudText10b = (L) => `水：${C10B_WATER_NAMES[L]}`;
export const noiseHudText10b = (n) => `もの音 ${'●'.repeat(n)}${'○'.repeat(Math.max(0, C10B_NOISE_MAX - n))}`;
export class C10bHud {
  constructor(game) {
    this.game = game;
    if (typeof document === 'undefined') return;
    if (!document.getElementById('c10b-hud-css')) document.head.append(el('style', { id: 'c10b-hud-css', text: CSS }));
    this.box = el('div', { class: 'c10b-hud' });
    this.box.hidden = true;
    document.getElementById('ui')?.append(this.box);
  }
  update() {
    if (!this.box) return;
    const g = this.game;
    const f = g.field;
    const on = g.state === 'field' && !!f?.map && (f.map.c10bBlue || f.map.c10bSneak);
    if (!this.box.isConnected) document.getElementById('ui')?.append(this.box);
    if (!on) { if (!this.box.hidden) this.box.hidden = true; return; }
    let html;
    if (f.map.c10bBlue) {
      const L = waterOf10b(f);
      html = `水：${C10B_WATER_NAMES.map((n, i) => `<span class="lv${i === L ? ' on' : ''}">${n}</span>`).join('')}`;
    } else {
      const s = sneakOf(f) || {};
      html = `${noiseHudText10b(s.nz || 0)}${s.sl ? '　<b>zzz</b>' : ''}`;
    }
    if (this.box.innerHTML !== html) this.box.innerHTML = html;
    this.box.classList.toggle('sneak', !!f.map.c10bSneak);
    this.box.classList.toggle('alert', (f.alertStage || 0) >= 1);
    if (this.box.hidden) this.box.hidden = false;
  }
}
export { T };
