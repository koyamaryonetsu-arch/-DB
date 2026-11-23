// 第3部 第3章 第1幕「星の船と、星座の島」の 見え方と 入力（client/field.js の 2D と 2.5D・まいフレームから）
// ※ ネタバレ注意（docs/plan-part3-c11a.md の 17-3）
// ・ひとふで書きの 星座（map.c11aCons。snap の c11a … { [星座]: { u: 光った 線, r: やり直した 回数, hs: 光らせる 星, hl: 光らせる 線, d: できた } }）:
//   うすい 点線（まだ 通って いない 線）・光の 線（通った 線）・ながれ星の 線の 矢じるし・ふたご星の 輪・助けの 光・できた 星座の 名前
// ・星の 上で 向きを 入れると、その 向きの 線の マスを しらべる（サーバーが うかんで 進む 台本を 送る。world/c11a-steps.js）
// ・星の海（map.c11aSea）: 雲の すき間に 小さな 地上（2D・2.5D）
// ・曲へ field.conStage（星座の 島で、その 島で できた 星座の 数 0〜2。ほかの マップでは 0）
import { C11A_LENS, C11A_ISLE_CONS, C11A_CON_MAX } from '../shared/maps/c11a-flags.js?v=f8927db0fd05';
import { CON_DIRS, lineFrom11a, fullMask11a } from '../shared/data/constellations-c11a.js?v=f8927db0fd05';
import { T } from '../shared/tiles.js?v=f8927db0fd05';
import { TS } from './render/tiles.js?v=f8927db0fd05';

// ───── サーバーの snap ─────
export function noteC11aSnap(field, d) {
  const prev = field.c11a;
  field.c11a = d ? { ...d, map: field.mapId } : null;
  // 線が ふえた・消えた（光の えんしゅつ）
  if (d && prev && prev.map === field.mapId) {
    for (const [id, o] of Object.entries(d)) {
      const was = prev[id]?.u || 0;
      if (o.u !== was) (field.c11aFlash || (field.c11aFlash = {}))[id] = { at: field.time, more: o.u > was };
    }
  }
}
const stateOf = (field, id) => (field.c11a && field.c11a.map === field.mapId ? field.c11a[id] : null) || null;
// 見えて いる 星座（灯台の レンズの 星座は c11a_lens の 間だけ）
export function consShown11a(field) {
  const m = field.map;
  if (!m?.c11aCons) return [];
  const has = (f) => !!field.hasFlag?.(f);
  // レンズの 星座は サーバーの 知らせ（snap の c11a）が ある 間だけ（できた あと 一しゅん のこらない）
  return m.c11aCons.filter((C) => (C.show ? has(C.show) && !has(C.id) && !!stateOf(field, C.id) : true));
}
// 画面の 状態（まいフレーム。F班の 曲）: field.conStage … その 島で できた 星座の 数（0〜2）
export function noteC11aStage(field) {
  const n = field.map?.c11aIsle;
  field.conStage = n ? Math.min(C11A_CON_MAX, C11A_ISLE_CONS[n].filter((f) => field.hasFlag?.(f)).length) : 0;
}

// ───── 入力（まいフレーム。true … 向きを 使った ＝ 歩かない）─────
export function c11aInput(field, ix, iy, canMove) {
  const m = field.map;
  if (!m?.c11aCons || field.riding || !canMove) { field.c11aLastDir = null; return false; }
  if (Math.abs(ix) < 0.3 && Math.abs(iy) < 0.3) { field.c11aLastDir = null; field.c11aWalkDir = null; return false; }
  const dir = Math.abs(ix) > Math.abs(iy) ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up');
  const me = field.me;
  const tx = Math.floor(me.x), ty = Math.floor(me.y);
  for (const con of consShown11a(field)) {
    const i = con.stars.findIndex(([x, y]) => x === tx && y === ty);
    if (i < 0) continue;
    const L = lineFrom11a(con, i, dir);
    if (!L) return false; // その 向きに 線は ない（地面へ おりる など ふつうに 歩く）
    me.dir = dir;
    // 地面から 歩いて 星に 入った 時は、その 向きを いちど はなすまで とばない（入った 星では 何も おきない）
    if (field.c11aWalkDir === dir) return true;
    field.c11aWalkDir = null;
    const now = field.time;
    // 同じ 向きを おしっぱなしの 時は 少し 待つ（着いて すぐ 次の 線へ とばない）
    if (field.c11aLastDir === dir && now - (field.c11aSentAt || -1e9) < 900) return true;
    field.c11aLastDir = dir;
    field.c11aSentAt = now;
    const [dx, dy] = CON_DIRS[dir];
    field.game.net.send({ t: 'interact', kind: 'tile', x: tx + dx, y: ty + dy });
    return true;
  }
  field.c11aLastDir = null;
  field.c11aWalkDir = dir;
  return false;
}

// ───── かく ─────
const TWIN_COLS = ['#ff9ad8', '#7ae8ff'];
function drawCon(field, ctx, con, at, scale) {
  const st = stateOf(field, con.id) || {};
  const done = !!field.hasFlag?.(con.id) || !!st.d;
  const used = done ? fullMask11a(con) : st.u || 0;
  const t = field.time;
  const fl = field.c11aFlash?.[con.id];
  const flash = fl && t - fl.at < 600 ? 1 - (t - fl.at) / 600 : 0;
  const pts = con.stars.map(([x, y]) => at(x + 0.5, y + 0.5));
  ctx.save();
  ctx.lineCap = 'round';
  // 線
  con.lines.forEach(([a, b, one], k) => {
    const p = pts[a], q = pts[b];
    const lit = !!(used & (1 << k));
    const hint = st.hl === k && !lit;
    if (lit) {
      ctx.setLineDash([]);
      ctx.strokeStyle = done ? 'rgba(255, 226, 120, 0.95)' : 'rgba(255, 240, 160, 0.95)';
      ctx.lineWidth = Math.max(2, scale * (done ? 0.16 : 0.13));
      ctx.shadowColor = '#ffe070';
      ctx.shadowBlur = scale * (0.35 + flash * 0.4);
    } else {
      ctx.setLineDash([Math.max(2, scale * 0.12), Math.max(3, scale * 0.16)]);
      ctx.strokeStyle = hint ? `rgba(160, 255, 255, ${0.6 + 0.4 * Math.sin(t / 160)})` : 'rgba(200, 214, 255, 0.6)';
      ctx.lineWidth = Math.max(1.5, scale * (hint ? 0.12 : 0.07));
      ctx.shadowColor = hint ? '#a0ffff' : 'transparent';
      ctx.shadowBlur = hint ? scale * 0.4 : 0;
    }
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    // ながれ星の 線の 矢じるし（a → b）
    if (one) {
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      const ang = Math.atan2(q.y - p.y, q.x - p.x);
      const s = scale * 0.32;
      ctx.fillStyle = lit ? '#fff0a0' : '#ffb0e0';
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(ang) * s, my + Math.sin(ang) * s);
      ctx.lineTo(mx + Math.cos(ang + 2.5) * s, my + Math.sin(ang + 2.5) * s);
      ctx.lineTo(mx + Math.cos(ang - 2.5) * s, my + Math.sin(ang - 2.5) * s);
      ctx.closePath(); ctx.fill();
    }
  });
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  // ふたご星の 輪（同じ 色の 2つ）
  (con.twins || []).forEach(([a, b], n) => {
    ctx.strokeStyle = TWIN_COLS[n % TWIN_COLS.length];
    ctx.lineWidth = Math.max(1.5, scale * 0.08);
    for (const i of [a, b]) {
      const p = pts[i];
      ctx.beginPath(); ctx.ellipse(p.x, p.y, scale * 0.46, scale * 0.34, 0, 0, Math.PI * 2); ctx.stroke();
    }
  });
  // 助け: 始める 星
  if (st.hs !== undefined && !used) {
    const p = pts[st.hs];
    const r = scale * (0.55 + 0.12 * Math.sin(t / 180));
    ctx.strokeStyle = 'rgba(160, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(2, scale * 0.1);
    ctx.shadowColor = '#a0ffff'; ctx.shadowBlur = scale * 0.5;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  // できた 星座: 名前
  if (done) {
    const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, top = Math.min(...ys) - scale * 0.7;
    ctx.font = `bold ${Math.max(11, Math.round(scale * 0.42))}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(20, 24, 60, 0.6)';
    const w = ctx.measureText(con.name).width + 10;
    ctx.fillRect(cx - w / 2, top - scale * 0.42, w, scale * 0.56);
    ctx.fillStyle = '#ffe890';
    ctx.fillText(con.name, cx, top);
  }
  ctx.restore();
}

// 雲の すき間の 小さな 地上（星の海。マスごとに きまった 形）
const LANDS = [{ g: '#5aa04a', l: '#8ad06a' }, { g: '#d8e4f0', l: '#ffffff' }, { g: '#d8b050', l: '#f0d080' }, { g: '#4a8ac8', l: '#7ab0e8' }];
const hash = (x, y) => ((x * 73856093) ^ (y * 19349663)) >>> 0;
function landOf(map, x, y) {
  if (map.tiles[y * map.w + x] !== T.C11A_CLOUD) return null;
  const h = hash(x, y);
  if (h % 13 !== 0) return null;
  return { land: LANDS[(h >>> 4) % LANDS.length], r: 0.3 + ((h >>> 16) % 4) * 0.05 };
}
function drawLand(ctx, x, y, k, L, t) {
  const r = k * L.r;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.08 * Math.sin(t / 1500 + x);
  ctx.fillStyle = 'rgba(30, 40, 90, 0.6)';
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r * 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = L.land.g;
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = L.land.l;
  ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.15, r * 0.4, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ───── 2D ─────
export function drawC11a2D(field, camX, camY) {
  const m = field.map;
  const ctx = field.ctx;
  if (m?.c11aSea) {
    const x0 = Math.max(0, Math.floor(camX / TS) - 1), y0 = Math.max(0, Math.floor(camY / TS) - 1);
    const x1 = Math.min(m.w - 1, Math.ceil((camX + field.vw) / TS) + 1), y1 = Math.min(m.h - 1, Math.ceil((camY + field.vh) / TS) + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const L = landOf(m, x, y);
      if (L) drawLand(ctx, (x + 0.5) * TS - camX, (y + 0.5) * TS - camY, TS, L, field.time);
    }
  }
  for (const con of consShown11a(field)) drawCon(field, ctx, con, (x, y) => ({ x: x * TS - camX, y: y * TS - camY }), TS);
  if (field.riding && m?.c11aCons) drawFloat(field, ctx, field.me.x * TS - camX, (field.me.y + 0.1) * TS - camY, TS);
}
// うかんで 進む 人の 足もとの 光
function drawFloat(field, ctx, x, y, k) {
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, k * 0.6);
  g.addColorStop(0, 'rgba(255, 248, 200, 0.85)');
  g.addColorStop(1, 'rgba(255, 224, 112, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(x, y, k * 0.6, k * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = field.time / 200 + i * 1.6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + Math.cos(a) * k * 0.4, y - k * 0.2 + Math.sin(a) * k * 0.2, Math.max(1, k * 0.06), Math.max(1, k * 0.06));
  }
  ctx.restore();
}
// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC11a3D(field, ctx, P) {
  const m = field.map;
  if (m?.c11aSea) {
    const me = field.me;
    for (let y = Math.max(0, Math.floor(me.y) - 16); y <= Math.min(m.h - 1, Math.floor(me.y) + 12); y++) {
      for (let x = Math.max(0, Math.floor(me.x) - 16); x <= Math.min(m.w - 1, Math.floor(me.x) + 16); x++) {
        const L = landOf(m, x, y);
        if (!L) continue;
        const p = P(x + 0.5, y + 0.5, -0.9);
        drawLand(ctx, p.x, p.y, p.k, L, field.time);
      }
    }
  }
  for (const con of consShown11a(field)) {
    const k = P(con.stars[0][0] + 0.5, con.stars[0][1] + 0.5, 0.05).k;
    drawCon(field, ctx, con, (x, y) => P(x, y, 0.05), k);
  }
  if (field.riding && m?.c11aCons) { const p = P(field.me.x, field.me.y + 0.1, 0.02); drawFloat(field, ctx, p.x, p.y, p.k); }
}
