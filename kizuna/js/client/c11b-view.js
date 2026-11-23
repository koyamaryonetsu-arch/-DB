// 第3部 第3章 第2幕「月の都と、名前のランプ」の 見え方（client/field.js の 2D と 2.5D・まいフレームから）
// ※ ネタバレ注意（docs/plan-part3-c11b.md の 18-3）
// ・おもてと うら（map.c11b.side … 0 おもて・1 うら）:
//   うら … 画面を 少し 暗く、あたたかい 色に（ちょうちん・井戸・戸・開いた とびらの まわりは 明るい）/ おもて … 白い 光の つぶ
//   画面の すみに「おもて」「うら」の しるし（月の 形。うらは 欠けた 月）
// ・ホタルの 助け（snap の c11b … { h: [x, y, 'door' | 'floor' | 'lamp'] }）: その マスの 上で 小さな 光が くるくる まわる
// ・曲へ field.sideStage（0 おもて・1 うら。この 幕の マップの 外では 0）
import { T } from '../shared/tiles.js?v=f8927db0fd05';
import { effectiveTile } from '../shared/maps/index.js?v=f8927db0fd05';
import { TS } from './render/tiles.js?v=f8927db0fd05';

// ───── サーバーの snap ─────
export function noteC11bSnap(field, d) {
  field.c11b = d ? { ...d, map: field.mapId } : null;
}
// 画面の 状態（まいフレーム。F班の 曲）: field.sideStage
export function noteC11bStage(field) {
  field.sideStage = field.map?.c11b ? field.map.c11b.side : 0;
  sideBadge(field.map?.c11b ? field.map.c11b.side : null);
}
const hintOf = (field) => (field.c11b && field.c11b.map === field.mapId ? field.c11b.h || null : null);

// ───── かどで すべる（第102回 C1班）は、第102回 M1班で みんなの 歩き方（client/walk.js）に うつした ─────
// 左右へ 進む 時も 上下と 同じに・スティックが ななめ 30° くらい まで かどを すりぬける（docs/plan-r102-corner-slide.md）

// うらで 明るい マス（あたたかい 光）
const WARM = new Set([T.C11B_B_LANTERN, T.C11B_LANTERNWELL, T.C11B_DOOR, T.C11B_OPENDOOR, T.C11B_T_STAIRS_B, T.C11B_SHADOWBRIDGE]);
const WARM_R = { [T.C11B_B_LANTERN]: 3.2, [T.C11B_LANTERNWELL]: 3.6, [T.C11B_DOOR]: 1.8, [T.C11B_OPENDOOR]: 1.6, [T.C11B_T_STAIRS_B]: 1.6, [T.C11B_SHADOWBRIDGE]: 1.0 };
function warmTiles(field, x0, y0, x1, y1) {
  const m = field.map;
  const out = [];
  for (let y = Math.max(0, y0); y <= Math.min(m.h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(m.w - 1, x1); x++) {
    const id = effectiveTile(m, x, y, (f) => field.gateFlag(f));
    if (WARM.has(id)) out.push([x, y, WARM_R[id]]);
  }
  return out;
}
// うらの 色（全体を 暗く あたたかく → 光の まわりを あける）
function backTint(field, ctx, lights) {
  const W = field.vw, H = field.vh;
  ctx.save();
  ctx.fillStyle = 'rgba(26, 10, 22, 0.34)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const fl = 1 + Math.sin(field.time / 160) * 0.05;
  for (const { x, y, r } of lights) {
    const R = r * fl;
    const g = ctx.createRadialGradient(x, y, 1, x, y, R);
    g.addColorStop(0, 'rgba(255, 170, 90, 0.34)');
    g.addColorStop(1, 'rgba(255, 150, 70, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - R, y - R, R * 2, R * 2);
  }
  ctx.restore();
}
// おもての 光の つぶ（ゆっくり 上る）
function frontMotes(field, ctx) {
  const W = field.vw, H = field.vh, t = field.time;
  ctx.save();
  for (let i = 0; i < 14; i++) {
    const x = ((i * 97.3 + t / 90) % (W + 20)) - 10;
    const y = H - (((i * 61.7 + t / 40) % (H + 20)) - 10);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.25 + 0.2 * Math.sin(t / 300 + i)})`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.restore();
}
// ホタルの 助け（x, y … 画面の 場所・k … 1マスの 大きさ）
function drawHint(field, ctx, x, y, k) {
  const t = field.time;
  ctx.save();
  const r = k * (0.55 + 0.08 * Math.sin(t / 200));
  ctx.strokeStyle = 'rgba(255, 240, 140, 0.85)';
  ctx.lineWidth = Math.max(2, k * 0.08);
  ctx.shadowColor = '#fff080';
  ctx.shadowBlur = k * 0.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  const a = t / 260;
  const fx = x + Math.cos(a) * k * 0.45, fy = y - k * 0.3 + Math.sin(a * 1.3) * k * 0.25;
  const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, k * 0.35);
  g.addColorStop(0, 'rgba(255, 255, 220, 1)');
  g.addColorStop(1, 'rgba(255, 230, 100, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(fx - k * 0.35, fy - k * 0.35, k * 0.7, k * 0.7);
  ctx.restore();
}
// 画面の すみの しるし（ミニマップの 右下に かさねる。おもて ＝ まるい 月・うら ＝ 欠けた 月）。DOM なので 2D・2.5D・スマホで 同じ 大きさ
let badge = null, badgeSide = null;
function sideBadge(side) {
  if (typeof document === 'undefined') return;
  const host = document.querySelector('#hud .hud-map');
  if (side === null || !host) {
    if (badge) badge.hidden = true;
    badgeSide = null;
    return;
  }
  if (!badge || !badge.isConnected) {
    badge = document.createElement('div');
    badge.className = 'hud-side';
    Object.assign(badge.style, {
      position: 'absolute', right: '-6px', bottom: '-10px', padding: '2px 9px 2px 6px', borderRadius: '999px', lineHeight: '1.25',
      fontSize: 'clamp(11px, 1.8vmin + 4px, 15px)', fontWeight: 'bold', pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.6)',
    });
    host.appendChild(badge);
    badgeSide = null;
  }
  badge.hidden = false;
  if (badgeSide === side) return;
  badgeSide = side;
  const back = side === 1;
  Object.assign(badge.style, back
    ? { color: '#ffe0b0', background: 'rgba(70, 30, 22, 0.92)', border: '2px solid #ffb060' }
    : { color: '#2a2a60', background: 'rgba(236, 240, 255, 0.94)', border: '2px solid #8a96d8' });
  // 月の しるし（おもて ＝ まるい 月・うら ＝ 欠けた 月）と 字
  const moon = back
    ? 'display:inline-block;width:0.8em;height:0.8em;border-radius:50%;margin-right:0.3em;vertical-align:-0.05em;box-shadow:inset 0.22em -0.08em 0 0 #ffb060'
    : 'display:inline-block;width:0.8em;height:0.8em;border-radius:50%;margin-right:0.3em;vertical-align:-0.05em;background:#ffd860;box-shadow:0 0 4px #fff0a0';
  badge.innerHTML = `<i style="${moon}"></i>${back ? 'うら' : 'おもて'}`;
}

// ───── 2D ─────
export function drawC11b2D(field, camX, camY) {
  const m = field.map;
  const ctx = field.ctx;
  const side = m.c11b.side;
  if (side) {
    const x0 = Math.floor(camX / TS) - 3, y0 = Math.floor(camY / TS) - 3;
    const x1 = Math.ceil((camX + field.vw) / TS) + 3, y1 = Math.ceil((camY + field.vh) / TS) + 3;
    const lights = warmTiles(field, x0, y0, x1, y1).map(([x, y, r]) => ({ x: (x + 0.5) * TS - camX, y: (y + 0.5) * TS - camY, r: r * TS }));
    backTint(field, ctx, lights);
  } else frontMotes(field, ctx);
  const h = hintOf(field);
  if (h) drawHint(field, ctx, (h[0] + 0.5) * TS - camX, (h[1] + 0.5) * TS - camY, TS);
}
// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC11b3D(field, ctx, P) {
  const m = field.map;
  const side = m.c11b.side;
  if (side) {
    const me = field.me;
    const lights = warmTiles(field, Math.floor(me.x) - 14, Math.floor(me.y) - 14, Math.floor(me.x) + 14, Math.floor(me.y) + 10)
      .map(([x, y, r]) => { const p = P(x + 0.5, y + 0.5, 0.3); return { x: p.x, y: p.y, r: r * p.k }; });
    backTint(field, ctx, lights);
  } else frontMotes(field, ctx);
  const h = hintOf(field);
  if (h) { const p = P(h[0] + 0.5, h[1] + 0.5, 0.4); drawHint(field, ctx, p.x, p.y, p.k); }
}
