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
import { MONSTERS } from '../shared/data/monsters.js?v=52527b10ae8b';
import { lightCenters } from '../shared/maps/c9a-light.js?v=52527b10ae8b';
import { LIGHT_SPICA9B, underCenters, flagKey9b, mapCells9b, pillarStage } from '../shared/maps/c9b-light.js?v=52527b10ae8b';
import { TS } from './render/tiles.js?v=52527b10ae8b';
import { ctxOf } from './render/pixel.js?v=52527b10ae8b';
import { Painter } from './render/pixel.js?v=52527b10ae8b';

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
// 暗い 色で かき、ふちだけ 青白く 光らせる（やみの 中に うかぶ）。近く（真下）では うすく、遠いほど はっきり
const DPX = 8;
const decorCache = new Map();
// 形（行ごとの [左, 右]）を ぬる: 石の だん・れんがの すじ・左は 光・右は かげ・ふちは 青白い 光
function fillShape(p, rows, C, opt = {}) {
  const brick = opt.brick || 4;
  const y0 = opt.y0 || 0;
  rows.forEach(([a, b], k) => {
    const y = y0 + k;
    if (b < a) return;
    for (let x = a; x <= b; x++) {
      const u = (x - a) / Math.max(1, b - a);
      let c = u < 0.22 ? C.l : u > 0.75 ? C.d : C.b;
      if (y % brick === 0) c = C.d;
      else if ((x + (Math.floor(y / brick) % 2) * 3) % 7 === 0) c = C.d;
      if (opt.speck && (x * 7 + y * 13) % 23 === 0) c = C.hl;
      p.set(x, y, c);
    }
    p.set(a, y, C.rim); p.set(b, y, C.rim2 || C.rim);
  });
}
function decorCanvas(kind, w, h) {
  const key = `${kind}|${w}|${h}`;
  if (decorCache.has(key)) return decorCache.get(key);
  const W = w * DPX, H = h * DPX;
  const p = new Painter(W, H);
  const cx = W / 2;
  const R = (n, fn) => Array.from({ length: n }, (_, y) => fn(y));
  if (kind === 'mine') {
    // さかさの 岩山（先が 細い。ごつごつ）・つき出た 坑道の 木わく・レール・ぶら下がる ランタン
    const C = { d: '#1e1a28', b: '#2c2638', l: '#3c3450', hl: '#5a5276', rim: '#7a8ab8', rim2: '#3a4462' };
    fillShape(p, R(H - 2, (y) => {
      const half = (W / 2 - 1) * Math.pow(1 - y / (H - 2), 0.75) * (0.86 + 0.14 * Math.sin(y * 0.9 + 1));
      return [Math.round(cx - half), Math.round(cx + half * (0.9 + 0.1 * Math.cos(y * 0.6)))];
    }), C, { brick: 5, speck: true });
    for (const [bx, by] of [[0.28, 0.22], [0.6, 0.36], [0.42, 0.55]]) {
      const x0 = Math.round(W * bx), y0 = Math.round(H * by);
      p.rect(x0, y0, 8, 2, '#7a5a32'); p.hline(x0, x0 + 7, y0, '#a8804a'); p.vline(x0, y0, y0 + 7, '#5a4024'); p.vline(x0 + 7, y0, y0 + 7, '#5a4024');
      p.rect(x0 + 1, y0 + 2, 6, 6, '#0a080e');
    }
    p.hline(Math.round(W * 0.2), Math.round(W * 0.55), Math.round(H * 0.45), '#6a6a7a'); // レール
    p.vline(Math.round(cx) + 2, H - 12, H - 4, '#8a8a9a'); p.ellipse(cx + 2, H - 3, 2.2, 2, '#ffc85a'); p.set(Math.round(cx) + 2, H - 3, '#fff4c0');
  } else if (kind === 'pyramid') {
    // さかさの ピラミッド（だんだんの 石・入口の あと・先から 砂が こぼれる）
    const C = { d: '#4a3c22', b: '#6a5634', l: '#8a7246', hl: '#b09660', rim: '#d8c48a', rim2: '#6a5a3a' };
    fillShape(p, R(H - 5, (y) => { const half = (W / 2 - 1) * (1 - y / (H - 5)); const st = Math.floor(y / 3) * 3; const hs = (W / 2 - 1) * (1 - st / (H - 5)); return [Math.round(cx - Math.max(half, hs - 1)), Math.round(cx + Math.max(half, hs - 1))]; }), C, { brick: 3 });
    p.rect(Math.round(cx) - 3, Math.round(H * 0.2), 6, 5, '#1a140a'); p.hline(Math.round(cx) - 4, Math.round(cx) + 3, Math.round(H * 0.2) - 1, C.hl);
    for (let y = H - 6; y < H; y++) if (y % 2 === 0) { p.set(Math.round(cx), y, '#e0c88a'); p.set(Math.round(cx) + (y % 4 ? 1 : -1), y + 1, '#b8a070'); }
  } else if (kind === 'temple') {
    // さかさの 神殿（上に 土台・下へ のびる 柱・さかさの 屋根の 三角。水の しずく）
    const S = { d: '#22283a', b: '#34405a', l: '#4a5a7a', hl: '#6a7a9a', rim: '#9ab8e8', rim2: '#3a4a66' };
    const base = Math.round(H * 0.26);
    fillShape(p, R(base, () => [Math.round(W * 0.04), Math.round(W * 0.96)]), S, { brick: 3 });
    for (let i = 0; i < 5; i++) {
      const x0 = Math.round(W * (0.14 + i * 0.17));
      for (let y = base; y < base + Math.round(H * 0.38); y++) { p.set(x0, y, S.rim); p.set(x0 + 1, y, S.l); p.set(x0 + 2, y, S.b); p.set(x0 + 3, y, S.d); }
    }
    const r0 = base + Math.round(H * 0.38);
    fillShape(p, R(H - 2 - r0, (k) => { const half = (W * 0.47) * (1 - k / (H - 2 - r0)); return [Math.round(cx - half), Math.round(cx + half)]; }), S, { brick: 4, y0: r0 });
    for (const [dx, dy] of [[0, 1], [-0.22, 0.6], [0.25, 0.7]]) p.set(Math.round(cx + dx * W), Math.min(H - 1, Math.round(r0 + dy * (H - r0))), '#8ad0ff');
  } else if (kind === 'town') {
    // さかさの 町（家が 天じょうから さかさに ならぶ。屋根が 下・まどに あたたかい 明かり）
    const n = Math.max(3, Math.floor(w / 2.5));
    for (let i = 0; i < n; i++) {
      const x0 = Math.round((i + 0.08) * (W / n)), hw = Math.round(W / n * 0.84);
      const hh = Math.round(H * (0.38 + ((i * 37) % 5) * 0.07));
      const wall = { d: '#1e1a28', b: i % 2 ? '#2e2838' : '#342c40', l: '#443a52', hl: '#5a4e6a', rim: '#8a7ab0' };
      fillShape(p, R(hh, () => [x0, x0 + hw - 1]), wall, { brick: 4 });
      for (let k = 0; k < Math.round(hw / 2); k++) { p.hline(x0 + k, x0 + hw - 1 - k, hh + k, k % 2 ? '#4a2a3a' : '#5a3446'); p.set(x0 + k, hh + k, '#a87a98'); }
      p.rect(x0 + 2, Math.round(hh * 0.45), 2, 2, '#ffd88a'); p.rect(x0 + hw - 4, Math.round(hh * 0.25), 2, 2, '#ffc86a');
    }
  }
  // 上の はしは やみに とける（天じょう）
  for (let y = 0; y < Math.min(8, H); y++) for (let x = 0; x < W; x++) if (p.get(x, y) && (x * 3 + y * 5) % (y + 2) === 0) p.set(x, y, '#0a0812');
  const c = p.toCanvas(1);
  decorCache.set(key, c);
  return c;
}
// 見る 人との きょりで うすさを かえる（真下は うすく・はなれると はっきり）
const decorAlpha = (D, field) => {
  const d = Math.hypot(D.x - field.me.x, D.y - D.h * 0.5 - field.me.y);
  const a = Math.max(0.22, Math.min(0.78, (d - 2) / 10));
  return D.far ? Math.min(a, 0.5) : a;
};
// ゆかの かげ（人や 物より 先に）
export function drawC9bShade2D(field, camX, camY) {
  const ctx = field.ctx;
  for (const D of field.map.c9bDecor || []) {
    if (D.far) continue;
    const px = (D.x + 0.5) * TS - camX, py = (D.y + 0.5) * TS - camY;
    const rx = D.w * TS * 0.42;
    const gr = ctx.createRadialGradient(px, py, 1, px, py, rx);
    gr.addColorStop(0, 'rgba(0, 0, 6, 0.4)');
    gr.addColorStop(1, 'rgba(0, 0, 6, 0)');
    ctx.fillStyle = gr;
    ctx.fillRect(px - rx, py - rx, rx * 2, rx * 2);
  }
}
// ぶら下がる 絵（くらやみの あと。暗い 所でも ふちが 青白く うかんで 見える）
export function drawC9bDecor2D(field, camX, camY) {
  const ctx = field.ctx;
  const t = field.time;
  for (const D of field.map.c9bDecor || []) {
    const c = decorCanvas(D.kind, D.w, D.h);
    const sw = D.w * TS, sh = D.h * TS;
    const bob = Math.sin(t / 1400 + D.x) * 2;
    const x = Math.round((D.x + 0.5) * TS - camX - sw / 2), y = Math.round((D.y + 0.5) * TS - camY - sh - TS * 3 + bob);
    if (x > field.vw || y > field.vh || x + sw < 0 || y + sh < 0) continue;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = decorAlpha(D, field);
    ctx.drawImage(c, x, y, sw, sh);
    ctx.restore();
  }
}
// 2.5D: 天じょうの 高さに うかべる（P(x, y, up)）。大きさは ゆかの 1マスの 大きさで（近くで 大きく なりすぎない）
const DECOR_UP = 3.2;
export function drawC9bDecor3D(field, ctx, P) {
  const t = field.time;
  for (const D of field.map.c9bDecor || []) {
    if (Math.abs(D.x - field.me.x) > 40 || Math.abs(D.y - field.me.y) > 40) continue;
    const c = decorCanvas(D.kind, D.w, D.h);
    const s = P(D.x + 0.5, D.y + 0.5, 0.02);
    if (!Number.isFinite(s.k) || s.k <= 0 || s.k > 400) continue;
    // かげ（ゆか）
    if (!D.far) {
      const rx = D.w * s.k * 0.42;
      const gr = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, rx);
      gr.addColorStop(0, 'rgba(0, 0, 6, 0.4)');
      gr.addColorStop(1, 'rgba(0, 0, 6, 0)');
      ctx.fillStyle = gr;
      ctx.fillRect(s.x - rx, s.y - rx * 0.5, rx * 2, rx);
    }
    const p = P(D.x + 0.5, D.y + 0.5, DECOR_UP + Math.sin(t / 1400 + D.x) * 0.05);
    const sw = D.w * s.k, sh = D.h * s.k;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = decorAlpha(D, field);
    ctx.drawImage(c, Math.round(p.x - sw / 2), Math.round(p.y - sh), sw, sh);
    ctx.restore();
  }
}
