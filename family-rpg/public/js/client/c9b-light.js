// 第3部 第1章 第2幕「鉱山の底の先」の 明かりを 広げる 探検の 絵（client/field.js の 2D と 2.5D から）
// ※ ネタバレ注意（docs/plan-part3.md の 10-2）
// ・大地の下（map.c9b）: まっ暗。見えるのは スピカの 光の まわり 4マス（自分と 家族）・ともった 水しょうの 柱の まわり 9マス・
//   光って いる こけ（3マス）・村の 小さな 明かり。まだ ともって いない 柱は かすかに 光る（目じるし）
//   大ミミズ（darkOnly の 魔物）は 暗い 所では 目だけ 光って 見える
// ・天じょうから ぶら下がる 今までの ダンジョンの 底（map.c9bDecor）: 鉱山・ピラミッド・神殿・さかさの 町。下の ゆかに かげ
//   たてあなの 空どうにも かざる（おどろきの 場面）
// ・小さな 地図・大きな 地図: 大地の下は「行った 所」を 取らない。柱の 明るさで かく（mapLit9b）
// ・pillarStage（ともした 柱の 数 0〜6）: F班の 曲が もりあがる（field.pillarStage）
// 2D も 2.5D も 同じ 計算（shared/maps/c9b-light.js・shared/maps/c9a-light.js）。こけの 光は サーバーの snap の c9a（パーティーで 同じ）
import { MONSTERS } from '../shared/data/monsters.js';
import { lightCenters } from '../shared/maps/c9a-light.js';
import { LIGHT_SPICA9B, underCenters, flagKey9b, mapCells9b, pillarStage } from '../shared/maps/c9b-light.js';
import { TS } from './render/tiles.js';
import { ctxOf } from './render/pixel.js';
import { Painter } from './render/pixel.js';

const DARK = 'rgba(2, 2, 8, 0.96)';
const has9b = (field) => (f) => field.hasFlag(f);

// 今の 光（中心の ならび。かわらなければ 前の 物）
function stateOf(field) {
  const m = field.map;
  const info = m.c9a;
  const L = field.c9aLight && field.c9aLight.map === m.id ? field.c9aLight : null;
  const lit = L ? L.lit : new Map();
  const has = has9b(field);
  const key = `${m.id}|${L ? L.ver : -1}|${L ? L.n : 0}|${flagKey9b(has)}`;
  if (field.c9bCache?.key !== key) {
    const moss = info ? lightCenters(info, lit, false) : [];
    field.c9bCache = { key, centers: [...underCenters(has), ...moss] };
  }
  return field.c9bCache;
}
// みんなの いる 所（自分・家族・場面の 役者）
function people(field) {
  const out = [];
  if (!field.hideMe) out.push([field.me.x, field.me.y - 0.4]);
  for (const o of field.others.values()) out.push([o.x, o.y - 0.4]);
  for (const a of field.actors.values()) out.push([a.x, a.y - 0.4]);
  return out;
}
const near = (list, x, y, r) => list.some(([px, py]) => (px - x) ** 2 + (py - y) ** 2 <= r * r);
const GLOW = { pillar: ['190, 240, 255', 2.2, 0.55], dim: ['140, 150, 220', 0.9, 0.35], lamp: ['150, 255, 150', 1.2, 0.5], lump: ['170, 255, 160', 2.6, 0.5], moss: ['120, 255, 200', 0.7, 0.55], link: ['120, 255, 200', 0.7, 0.55] };

// 画面へ 出す 状態（F班の 曲。大地の下に いる 間）
export function notePillarStage(field) {
  field.pillarStage = field.map?.c9b ? pillarStage(has9b(field)) : 0;
  return field.pillarStage;
}
// 大地の下の 地図に かく マス（「行った 所」の かわり）
export const mapLit9b = (field, x, y) => mapCells9b(has9b(field)).has(y * field.map.w + x);

// ───── 2D ─────
export function drawC9bDark2D(field, camX, camY) {
  notePillarStage(field);
  const ctx = field.ctx;
  const st = stateOf(field);
  const t = field.time;
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (px, py, rad) => {
    const gr = g.createRadialGradient(px, py, rad * 0.6, px, py, rad);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) hole(px * TS - camX, py * TS - camY, (LIGHT_SPICA9B + 0.5) * TS * flick);
  for (const [cx, cy, rad] of st.centers) hole((cx + 0.5) * TS - camX, (cy + 0.5) * TS - camY, (rad + 0.5) * TS);
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
  // かがやき
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, , kind] of st.centers) {
    const G = GLOW[kind];
    if (!G) continue;
    const px = (cx + 0.5) * TS - camX, py = (cy + 0.5) * TS - camY;
    if (px < -80 || py < -80 || px > field.vw + 80 || py > field.vh + 80) continue;
    const pulse = 0.75 + Math.sin(t / 260 + cx * 1.7 + cy) * 0.25;
    const rad = G[1] * TS;
    const gr = ctx.createRadialGradient(px, py, 1, px, py, rad);
    gr.addColorStop(0, `rgba(${G[0]}, ${G[2] * pulse})`);
    gr.addColorStop(1, `rgba(${G[0]}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  // 大ミミズの 目（暗い 所だけ）
  const ppl = people(field);
  for (const s of field.syms.values()) {
    if (!MONSTERS[s.sp]?.darkOnly || near(ppl, s.x, s.y - 0.4, LIGHT_SPICA9B)) continue;
    if (Math.floor(t / 900 + s.x) % 7 === 0) continue;
    const ex = s.x * TS - camX, ey = (s.y - 0.5) * TS - camY;
    ctx.fillStyle = '#ffb85a';
    ctx.fillRect(Math.round(ex - 4), Math.round(ey), 3, 2);
    ctx.fillRect(Math.round(ex + 1), Math.round(ey), 3, 2);
  }
}

// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC9bDark3D(field, ctx, P) {
  notePillarStage(field);
  const st = stateOf(field);
  const t = field.time;
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (p, rad) => {
    const gr = g.createRadialGradient(p.x, p.y, rad * 0.6, p.x, p.y, rad);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) { const p = P(px, py + 0.4, 0.5); hole(p, (LIGHT_SPICA9B + 0.5) * p.k * flick); }
  for (const [cx, cy, rad] of st.centers) {
    if (Math.abs(cx - field.me.x) > 30 || Math.abs(cy - field.me.y) > 30) continue;
    const p = P(cx + 0.5, cy + 0.5, 0.3);
    hole(p, (rad + 0.5) * p.k);
  }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, , kind] of st.centers) {
    const G = GLOW[kind];
    if (!G || Math.abs(cx - field.me.x) > 24 || Math.abs(cy - field.me.y) > 24) continue;
    const big = kind === 'pillar' || kind === 'lump' || kind === 'dim';
    const p = P(cx + 0.5, cy + 0.5, big ? 1.1 : 0.05);
    const pulse = 0.75 + Math.sin(t / 260 + cx * 1.7 + cy) * 0.25;
    const rad = G[1] * p.k;
    const gr = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, rad);
    gr.addColorStop(0, `rgba(${G[0]}, ${G[2] * pulse})`);
    gr.addColorStop(1, `rgba(${G[0]}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  const ppl = people(field);
  for (const s of field.syms.values()) {
    if (!MONSTERS[s.sp]?.darkOnly || near(ppl, s.x, s.y - 0.4, LIGHT_SPICA9B)) continue;
    if (Math.floor(t / 900 + s.x) % 7 === 0) continue;
    const p = P(s.x, s.y, 0.45);
    const k = Math.max(1, Math.round(p.k / 16));
    ctx.fillStyle = '#ffb85a';
    ctx.fillRect(Math.round(p.x - 4 * k), Math.round(p.y), 3 * k, 2 * k);
    ctx.fillRect(Math.round(p.x + k), Math.round(p.y), 3 * k, 2 * k);
  }
}

// ───── 天じょうから ぶら下がる ダンジョンの 底（かざりの 絵）─────
// 1マス 8ドット。下の はしが 先（ぶら下がった 先）。上は 天じょうの やみに とける
const DPX = 8;
const decorCache = new Map();
function decorCanvas(kind, w, h) {
  const key = `${kind}|${w}|${h}`;
  if (decorCache.has(key)) return decorCache.get(key);
  const W = w * DPX, H = h * DPX;
  const p = new Painter(W, H);
  const cx = W / 2;
  if (kind === 'mine') {
    // さかさの 岩山（先が 細い）・つき出た 坑道の 木わく・ぶら下がる ランタン
    for (let y = 0; y < H; y++) {
      const half = (W / 2) * Math.pow(1 - y / H, 0.8) * (0.9 + 0.1 * Math.sin(y * 0.7));
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) p.set(x, y, ((x * 3 + y * 5) % 11 < 2) ? '#4a4258' : (x < cx - half * 0.4 ? '#2e2838' : '#3a3448'));
    }
    for (const [bx, by] of [[0.3, 0.25], [0.65, 0.4], [0.45, 0.6]]) {
      const x0 = Math.round(W * bx), y0 = Math.round(H * by);
      p.rect(x0, y0, 7, 2, '#8a6a3a'); p.vline(x0, y0, y0 + 6, '#6a4a2a'); p.vline(x0 + 6, y0, y0 + 6, '#6a4a2a');
    }
    p.vline(Math.round(cx) + 3, H - 10, H - 4, '#8a8a9a'); p.ellipse(cx + 3, H - 3, 2, 2, '#ffc85a');
  } else if (kind === 'pyramid') {
    // さかさの ピラミッド（だんだんの 石・先から 砂が こぼれる）
    for (let y = 0; y < H - 4; y++) {
      const half = (W / 2) * (1 - y / (H - 4));
      const step = Math.floor(y / 4) % 2;
      for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) p.set(x, y, step ? '#8a7448' : '#a08a58');
      p.set(Math.round(cx - half), y, '#c8b078');
    }
    for (let y = H - 5; y < H; y++) if (y % 2 === 0) p.set(Math.round(cx), y, '#e0c88a');
  } else if (kind === 'temple') {
    // さかさの 神殿（上に 土台・下に むかって 柱と 屋根の 三角。水が しずく）
    const base = Math.round(H * 0.28);
    p.rect(Math.round(W * 0.05), 0, Math.round(W * 0.9), base, '#5a6a8a');
    p.hline(Math.round(W * 0.05), Math.round(W * 0.95), base - 1, '#8aa0c8');
    for (let i = 0; i < 5; i++) {
      const x0 = Math.round(W * (0.15 + i * 0.17));
      p.rect(x0, base, 3, Math.round(H * 0.4), '#7a8aa8'); p.vline(x0, base, base + Math.round(H * 0.4), '#a8b8d8');
    }
    const r0 = base + Math.round(H * 0.4);
    for (let y = r0; y < H - 2; y++) {
      const half = (W * 0.45) * (1 - (y - r0) / (H - 2 - r0));
      p.hline(Math.round(cx - half), Math.round(cx + half), y, '#4a5a7a');
    }
    p.set(Math.round(cx), H - 1, '#8ad0ff'); p.set(Math.round(W * 0.3), base + Math.round(H * 0.45), '#8ad0ff');
  } else if (kind === 'town') {
    // さかさの 町（屋根が 下・まどに 明かり）
    const n = Math.max(3, Math.floor(w / 2.5));
    for (let i = 0; i < n; i++) {
      const x0 = Math.round((i + 0.1) * (W / n)), hw = Math.round(W / n * 0.8);
      const hh = Math.round(H * (0.4 + ((i * 37) % 5) * 0.08));
      p.rect(x0, 0, hw, hh, i % 2 ? '#3a3448' : '#443a52');
      for (let y = hh; y < hh + Math.round(hw / 2); y++) { const k = y - hh; p.hline(x0 + k, x0 + hw - 1 - k, y, '#5a3a4a'); }
      p.set(x0 + 2, Math.round(hh * 0.5), '#ffd88a'); p.set(x0 + hw - 3, Math.round(hh * 0.3), '#ffd88a');
    }
  }
  // 上の はしは やみに とける（天じょう）
  for (let y = 0; y < Math.min(6, H); y++) for (let x = 0; x < W; x++) if (p.get(x, y) && (x + y) % (y + 1) === 0) p.set(x, y, '#100c18');
  const c = p.toCanvas(1);
  decorCache.set(key, c);
  return c;
}
// ゆかの かげ（人や 物より 先に）
export function drawC9bShade2D(field, camX, camY) {
  const ctx = field.ctx;
  for (const D of field.map.c9bDecor || []) {
    if (D.far) continue;
    const px = (D.x + 0.5) * TS - camX, py = (D.y + 0.5) * TS - camY;
    const rx = D.w * TS * 0.42, ry = D.h * TS * 0.28;
    const gr = ctx.createRadialGradient(px, py - ry * 0.6, 1, px, py - ry * 0.6, rx);
    gr.addColorStop(0, 'rgba(0, 0, 6, 0.45)');
    gr.addColorStop(1, 'rgba(0, 0, 6, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(px - rx, py - ry * 0.6 - rx, rx * 2, rx * 2);
  }
}
// ぶら下がる 絵（くらやみの あと。暗い 所でも 青白い ふちで うかんで 見える）
export function drawC9bDecor2D(field, camX, camY) {
  const ctx = field.ctx;
  const t = field.time;
  for (const D of field.map.c9bDecor || []) {
    const c = decorCanvas(D.kind, D.w, D.h);
    const sw = D.w * TS, sh = D.h * TS;
    const bob = Math.sin(t / 1400 + D.x) * 2;
    const x = Math.round((D.x + 0.5) * TS - camX - sw / 2), y = Math.round((D.y + 0.5) * TS - camY - sh - TS * 2 + bob);
    if (x > field.vw || y > field.vh || x + sw < 0 || y + sh < 0) continue;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = D.far ? 0.55 : 0.82;
    ctx.drawImage(c, x, y, sw, sh);
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
// 2.5D: 天じょうの 高さに うかべる（P(x, y, up)）
const DECOR_UP = 5.5;
export function drawC9bDecor3D(field, ctx, P) {
  const t = field.time;
  for (const D of field.map.c9bDecor || []) {
    if (Math.abs(D.x - field.me.x) > 40 || Math.abs(D.y - field.me.y) > 40) continue;
    const c = decorCanvas(D.kind, D.w, D.h);
    // かげ（ゆか）
    if (!D.far) {
      const s = P(D.x + 0.5, D.y + 0.5, 0.02);
      const rx = D.w * s.k * 0.42;
      const gr = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, rx);
      gr.addColorStop(0, 'rgba(0, 0, 6, 0.45)');
      gr.addColorStop(1, 'rgba(0, 0, 6, 0)');
      ctx.fillStyle = gr;
      ctx.fillRect(s.x - rx, s.y - rx * 0.5, rx * 2, rx);
    }
    const p = P(D.x + 0.5, D.y + 0.5, DECOR_UP + Math.sin(t / 1400 + D.x) * 0.05);
    const sw = D.w * p.k, sh = D.h * p.k;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = D.far ? 0.55 : 0.85;
    ctx.drawImage(c, Math.round(p.x - sw / 2), Math.round(p.y - sh), sw, sh);
    ctx.restore();
  }
}
