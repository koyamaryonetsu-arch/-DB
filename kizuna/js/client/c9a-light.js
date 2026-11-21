// 第3部 第1章 第1幕「星ふるえの夜」の 光の輪の 絵（client/field.js の 2D と 2.5D から）
// ※ ネタバレ注意（docs/plan-part3.md の 9-2）
// ・見える はんい: 自分（と 家族）の まわり 2マス半。光の みなもと・光って いる こけ・光った 水しょうの まわり。その 外は まっ暗
// ・光る こけ: 光って いる 間は 青みどりに 光る（みなもとに つながると 明るく。つながって いない 間は 小さく またたく）
// ・見えない 穴: こけ・みなもと・水しょうの 光が とどいた 時だけ 見える
// ・くらやみ虫（darkOnly の 魔物）: 暗い 所では 目だけが 光って 見える
// 2D も 2.5D も 同じ 計算（shared/maps/c9a-light.js）。光の ようすは サーバーの snap の c9a（パーティーで 同じ）
// ・ながれ星のくぼ地（明るい マップ）: まん中が しずんだ かげ・光る かけら・星の子の まわりの 光（map.c9aCrater）
import { T } from '../shared/tiles.js?v=36007aad9f1d';
import { MONSTERS } from '../shared/data/monsters.js?v=36007aad9f1d';
import { LIGHT_ME, lightCenters, litCells, unpackLit } from '../shared/maps/c9a-light.js?v=36007aad9f1d';
import { TS, tileCanvas, frameOf, prepareMap } from './render/tiles.js?v=36007aad9f1d';
import { ctxOf } from './render/pixel.js?v=36007aad9f1d';

const DARK = 'rgba(2, 2, 8, 0.97)';

// snap の c9a を おぼえる（field.onSnap から）
export function noteC9aSnap(field, c9a) {
  if (!c9a || c9a.map !== field.mapId) { field.c9aLight = null; return; }
  const old = field.c9aLight;
  if (old && old.map === c9a.map && old.ver === c9a.ver && old.n === c9a.lit.length) return;
  field.c9aLight = { map: c9a.map, ver: c9a.ver, n: c9a.lit.length, lit: unpackLit(c9a.lit) };
}

// 今の 光（中心の ならびと 光る マス。かわらなければ 前の 物）
function stateOf(field) {
  const m = field.map;
  const info = m.c9a;
  const L = field.c9aLight && field.c9aLight.map === m.id ? field.c9aLight : null;
  const lit = L ? L.lit : new Map();
  const opened = !!(m.c9aDoorFlag && field.hasFlag(m.c9aDoorFlag));
  const key = `${m.id}|${L ? L.ver : -1}|${L ? L.n : 0}|${opened}`;
  if (field.c9aCache?.key !== key) {
    field.c9aCache = { key, centers: lightCenters(info, lit, opened), cells: litCells(info, lit, opened), lit };
  }
  return field.c9aCache;
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

// ───── 2D ─────
export function drawC9aDark2D(field, camX, camY, x0, y0, x1, y1) {
  const m = field.map;
  const info = m.c9a;
  const ctx = field.ctx;
  const st = stateOf(field);
  const t = field.time;
  // 光の 中の 見えない 穴
  const r = prepareMap(m);
  for (const k of info.holes) {
    const x = k % info.w, y = Math.floor(k / info.w);
    if (x < x0 - 1 || x > x1 + 1 || y < y0 - 1 || y > y1 + 1 || !st.cells.has(k)) continue;
    ctx.drawImage(tileCanvas(T.C9A_HOLE, r.variant[k], frameOf(T.C9A_HOLE, t), r.mask[k], m.theme), x * TS - camX, y * TS - camY);
  }
  // まっ暗（光の 所だけ ぬく）
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (px, py, rad, a = 1) => {
    const gr = g.createRadialGradient(px, py, rad * 0.55, px, py, rad);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) hole(px * TS - camX, py * TS - camY, (LIGHT_ME + 0.5) * TS * flick);
  for (const [cx, cy, rad] of st.centers) hole((cx + 0.5) * TS - camX, (cy + 0.5) * TS - camY, (rad + 0.5) * TS);
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
  // 光る こけ・みなもと・水しょうの かがやき
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, , kind] of st.centers) {
    if (kind === 'torch') continue;
    const px = (cx + 0.5) * TS - camX, py = (cy + 0.5) * TS - camY;
    const big = kind === 'source' || kind === 'crystal';
    const pulse = 0.75 + Math.sin(t / 260 + cx * 1.7 + cy) * 0.25;
    const rad = big ? 16 : kind === 'link' ? 12 : 10;
    const col = kind === 'moss' ? '120, 255, 200' : kind === 'link' ? '110, 230, 255' : '170, 235, 255';
    const gr = ctx.createRadialGradient(px, py, 1, px, py, rad);
    gr.addColorStop(0, `rgba(${col}, ${(big ? 0.65 : kind === 'link' ? 0.8 : 0.6) * pulse})`);
    gr.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    // 光って いる こけの マスは うすく 色が つく（つながると 青く）
    if (!big) {
      ctx.fillStyle = `rgba(${col}, ${0.16 * pulse})`;
      ctx.fillRect(px - TS / 2, py - TS / 2, TS, TS);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  // くらやみ虫の 目（暗い 所だけ）
  const ppl = people(field);
  for (const s of field.syms.values()) {
    if (!MONSTERS[s.sp]?.darkOnly) continue;
    if (near(ppl, s.x, s.y - 0.4, LIGHT_ME)) continue;
    const ex = s.x * TS - camX, ey = (s.y - 0.5) * TS - camY;
    const blink = Math.floor(t / 900 + s.x) % 7 === 0;
    if (blink) continue;
    ctx.fillStyle = '#ffe85a';
    ctx.fillRect(Math.round(ex - 3), Math.round(ey), 2, 2);
    ctx.fillRect(Math.round(ex + 1), Math.round(ey), 2, 2);
  }
}

// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC9aDark3D(field, ctx, P) {
  const m = field.map;
  const info = m.c9a;
  const st = stateOf(field);
  const t = field.time;
  const d = field.darkCanvas;
  const g = ctxOf(d);
  // 光の 中の 見えない 穴（ゆかの 上に くろい あな）
  for (const k of info.holes) {
    if (!st.cells.has(k)) continue;
    const x = k % info.w, y = Math.floor(k / info.w);
    if (Math.abs(x - field.me.x) > 18 || Math.abs(y - field.me.y) > 18) continue;
    const p = P(x + 0.5, y + 0.5, 0.01);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.k * 0.42, p.k * 0.24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(120, 120, 170, 0.8)';
    ctx.lineWidth = Math.max(1, p.k / 16);
    ctx.stroke();
  }
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  const hole = (p, rad, a = 1) => {
    const gr = g.createRadialGradient(p.x, p.y, rad * 0.55, p.x, p.y, rad);
    gr.addColorStop(0, `rgba(0,0,0,${a})`);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  };
  const flick = 1 + Math.sin(t / 110) * 0.03;
  for (const [px, py] of people(field)) { const p = P(px, py + 0.4, 0.5); hole(p, (LIGHT_ME + 0.5) * p.k * flick); }
  for (const [cx, cy, rad] of st.centers) { const p = P(cx + 0.5, cy + 0.5, 0.3); hole(p, (rad + 0.5) * p.k); }
  g.globalCompositeOperation = 'source-over';
  ctx.drawImage(d, 0, 0);
  ctx.globalCompositeOperation = 'lighter';
  for (const [cx, cy, , kind] of st.centers) {
    if (kind === 'torch') continue;
    const big = kind === 'source' || kind === 'crystal';
    const p = P(cx + 0.5, cy + 0.5, big ? 0.8 : 0.05);
    const pulse = 0.75 + Math.sin(t / 260 + cx * 1.7 + cy) * 0.25;
    const rad = (big ? 1 : kind === 'link' ? 0.8 : 0.65) * p.k;
    const col = kind === 'moss' ? '120, 255, 200' : kind === 'link' ? '110, 230, 255' : '170, 235, 255';
    const gr = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, rad);
    gr.addColorStop(0, `rgba(${col}, ${(big ? 0.65 : kind === 'link' ? 0.8 : 0.6) * pulse})`);
    gr.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  const ppl = people(field);
  for (const s of field.syms.values()) {
    if (!MONSTERS[s.sp]?.darkOnly || near(ppl, s.x, s.y - 0.4, LIGHT_ME)) continue;
    if (Math.floor(t / 900 + s.x) % 7 === 0) continue;
    const p = P(s.x, s.y, 0.55);
    const k = Math.max(1, Math.round(p.k / 16));
    ctx.fillStyle = '#ffe85a';
    ctx.fillRect(Math.round(p.x - 3 * k), Math.round(p.y), 2 * k, 2 * k);
    ctx.fillRect(Math.round(p.x + k), Math.round(p.y), 2 * k, 2 * k);
  }
}

// ───── ながれ星のくぼ地（明るい マップ。map.c9aCrater）─────
// まん中が しずんで 見える かげ・ちらばった 光る かけら・ながれ星の 石と 星の子の まわりの やさしい 光
function craterGlowAt(field) {
  const out = [];
  const n = field.map.npcById?.c9a_spica_npc;
  if (n && field.npcVisible(n)) { const s = field.npcState.get(n.id); if (s) out.push([s.x, s.y - 0.4]); }
  for (const a of field.actors.values()) if (a.sprite === 'c9a_spica') out.push([a.x, a.y - 0.4]);
  return out;
}
// 2D: ゆかの 上（人や 物より 先）
export function drawC9aCraterFloor2D(field, camX, camY) {
  const c = field.map.c9aCrater;
  const ctx = field.ctx;
  const t = field.time;
  const px = c.cx * TS - camX, py = c.cy * TS - camY, R = c.r * TS;
  const gr = ctx.createRadialGradient(px, py, TS * 1.2, px, py, R);
  gr.addColorStop(0, 'rgba(8, 4, 0, 0.42)');
  gr.addColorStop(0.7, 'rgba(8, 4, 0, 0.18)');
  gr.addColorStop(1, 'rgba(8, 4, 0, 0)');
  ctx.fillStyle = gr;
  ctx.fillRect(px - R, py - R, R * 2, R * 2);
  // 石から 外へ のびる こげた すじ
  ctx.strokeStyle = 'rgba(16, 8, 2, 0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i++) {
    const a = i * 0.63 + 0.2;
    ctx.beginPath();
    ctx.moveTo(px + Math.cos(a) * TS * 1.1, py + Math.sin(a) * TS * 0.9);
    ctx.lineTo(px + Math.cos(a) * TS * (4 + (i % 3)), py + Math.sin(a) * TS * (3.2 + (i % 2)));
    ctx.stroke();
  }
  // 光る かけら
  for (const [x, y] of c.glints) {
    const on = (Math.floor(t / 300 + x * 3 + y) % 5) !== 0;
    const gx = Math.round(x * TS - camX + 4 + ((x * 5) % 8)), gy = Math.round(y * TS - camY + 4 + ((y * 3) % 8));
    ctx.fillStyle = '#e0b040';
    ctx.fillRect(gx, gy, 2, 3);
    if (on) { ctx.fillStyle = '#fffcf0'; ctx.fillRect(gx, gy, 1, 1); }
  }
}
// 2D: 人や 物の あと（光を かさねる）
export function drawC9aCraterGlow2D(field, camX, camY) {
  const c = field.map.c9aCrater;
  const ctx = field.ctx;
  const t = field.time;
  const glow = (x, y, rad, col, a) => {
    const gr = ctx.createRadialGradient(x, y, 1, x, y, rad);
    gr.addColorStop(0, `rgba(${col}, ${a})`);
    gr.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.8 + Math.sin(t / 420) * 0.2;
  glow((c.rock.x + 0.5) * TS - camX, (c.rock.y + 0.4) * TS - camY, TS * 1.6, '255, 220, 140', 0.28 * pulse);
  for (const [x, y] of craterGlowAt(field)) glow(x * TS - camX, y * TS - camY, TS * 2.2, '200, 235, 255', 0.42 * pulse);
  for (const [x, y] of c.glints) glow((x + 0.5) * TS - camX, (y + 0.5) * TS - camY, 7, '255, 230, 150', 0.35 * pulse);
  ctx.globalCompositeOperation = 'source-over';
}
// 2.5D（render3d の 上に かさねる）
export function drawC9aCrater3D(field, ctx, P) {
  const c = field.map.c9aCrater;
  const t = field.time;
  const glow = (p, rad, col, a) => {
    const gr = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, rad);
    gr.addColorStop(0, `rgba(${col}, ${a})`);
    gr.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  };
  const pulse = 0.8 + Math.sin(t / 420) * 0.2;
  ctx.globalCompositeOperation = 'lighter';
  { const p = P(c.rock.x + 0.5, c.rock.y + 0.5, 0.5); glow(p, p.k * 1.6, '255, 220, 140', 0.3 * pulse); }
  for (const [x, y] of craterGlowAt(field)) { const p = P(x, y + 0.4, 0.6); glow(p, p.k * 2, '200, 235, 255', 0.42 * pulse); }
  for (const [x, y] of c.glints) {
    const p = P(x + 0.5, y + 0.5, -0.14);
    const k = Math.max(1, Math.round(p.k / 16));
    glow(p, p.k * 0.45, '255, 230, 150', 0.4 * pulse);
    ctx.fillStyle = (Math.floor(t / 300 + x * 3 + y) % 5) ? '#fffcf0' : '#e0b040';
    ctx.fillRect(Math.round(p.x - k), Math.round(p.y - k), 2 * k, 2 * k);
  }
  ctx.globalCompositeOperation = 'source-over';
}
