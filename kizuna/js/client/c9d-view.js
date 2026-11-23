// 第3部 第1章 第4幕「星のはかば」の 見え方（client/field.js の 2D と 2.5D から）
// ※ ネタバレ注意（docs/plan-part3-c9d.md の 12-2）
// ・ふたごの道（map.c9dLane）: まっ暗。スピカの まわり 5マスが 明るい。スピカから はなれた 人は 自分の まわり 1マス半 だけ
//   光る こけ（snap の c9a）・ランプ（光って いる 間は 明るく・消えて いても かすかに）・ひびきの石（鳴って いる 石は 光の 輪）
// ・スピカが ひびきの石に のこって 歌って いる（snap の c9d.at）: 石の 前に スピカの 絵・光の 輪と 音ぷ。ついて 来る 連れから はずす
// ・画面の 状態: apartStage（0 いっしょ・1 はなれて いる。F班の 曲）・songStage（くぼ地の 台に 置いた 星の音の 数。スピカの歌）
// ・HUD の「スピカをよぶ」ボタン（スピカが 石に のこって いる 間だけ。サーバーの menu c9dCall）
// 2D も 2.5D も 同じ 計算（shared/maps/c9d-lane.js）
import { lightCenters } from '../shared/maps/c9a-light.js?v=31ca07498b9b';
import { songStage9 } from '../shared/maps/c9d-flags.js?v=31ca07498b9b';
import {
  stoneById9d, stoneFront9d, laneCenters9d, apartStage9d, LIGHT_SPICA9D,
} from '../shared/maps/c9d-lane.js?v=31ca07498b9b';
import { TS } from './render/tiles.js?v=31ca07498b9b';
import { ctxOf } from './render/pixel.js?v=31ca07498b9b';
import { el } from './ui/dom.js?v=31ca07498b9b';

const DARK = 'rgba(2, 2, 8, 0.97)';

// ───── サーバーの snap（c9d … { lead, at, ring: [[id, のこり ms]], lamps: [左, 右] }）─────
export function noteC9dSnap(field, d) {
  if (!d) { field.c9d = null; return; }
  const t = field.time;
  field.c9d = {
    lead: d.lead, at: d.at || null,
    ring: new Map((d.ring || []).map(([id, left]) => [id, t + left])),
    lamps: [(d.lamps?.[0] || 0) ? t + d.lamps[0] : 0, (d.lamps?.[1] || 0) ? t + d.lamps[1] : 0],
  };
}
const stateOf = (field) => (field.c9d && field.map?.c9dStones ? field.c9d : null);
// スピカが 石に のこって いるか
export const c9dSpicaLeft = (field) => !!stateOf(field)?.at;
// 石の 前で 歌って いる スピカの 場所（いなければ null）
export function c9dSingingSpica(field) {
  const st = stateOf(field);
  if (!st?.at) return null;
  const s = stoneById9d(field.map, st.at);
  return s ? stoneFront9d(s) : null;
}
// リーダーの いる 所
function leaderPos(field) {
  const st = stateOf(field);
  const sid = st?.lead;
  if (!sid || sid === field.game?.sid) return field.me;
  const o = field.others.get(sid);
  return o || field.me;
}
export function c9dSpicaPos(field) {
  return c9dSingingSpica(field) || leaderPos(field);
}
// 鳴って いる 石
function ringing(field) {
  const st = stateOf(field);
  const out = new Set();
  if (!st) return out;
  if (st.at) out.add(st.at);
  for (const [id, until] of st.ring) if (until > field.time) out.add(id);
  return out;
}
function lampsOn(field) {
  const st = stateOf(field);
  return { L: !!st && st.lamps[0] > field.time, R: !!st && st.lamps[1] > field.time };
}

// 画面の 状態（まいフレーム。F班の 曲）
export function noteC9dStage(field) {
  const m = field.map;
  field.songStage = songStage9((f) => field.hasFlag(f));
  field.apartStage = m?.c9dLane ? apartStage9d(field.me, c9dSpicaPos(field)) : 0;
}

// 光の まん中（ふたごの道）
function centersOf(field) {
  const m = field.map;
  const people = [];
  if (!field.hideMe) people.push({ x: field.me.x, y: field.me.y - 0.3 });
  for (const o of field.others.values()) people.push({ x: o.x, y: o.y - 0.3 });
  const sp = c9dSpicaPos(field);
  const out = laneCenters9d(m, {
    spica: sp ? { x: sp.x, y: sp.y - 0.3 } : null, singing: !!c9dSingingSpica(field), people, lamps: lampsOn(field), ringing: ringing(field),
  });
  // 光る こけ（第1幕の 光の輪の しくみ）
  const info = m.c9a;
  const L = field.c9aLight && field.c9aLight.map === m.id ? field.c9aLight : null;
  if (info && L) for (const c of lightCenters(info, L.lit, false)) out.push(c);
  for (const a of field.actors.values()) out.push([a.x - 0.5, a.y - 0.8, LIGHT_SPICA9D, 'me']);
  return out;
}
const GLOW = {
  song: ['255, 236, 150', 2.4, 0.4], spica: ['255, 240, 190', 1.6, 0.22], lamp: ['255, 200, 120', 1.8, 0.55], lampDim: ['200, 150, 90', 0.6, 0.3],
  ring: ['150, 220, 255', 2.2, 0.6], stone: ['120, 180, 230', 0.9, 0.35], moss: ['120, 255, 200', 0.7, 0.55], link: ['120, 255, 200', 0.7, 0.55],
};

function darkPass(field, holes) {
  const d = field.darkCanvas;
  const g = ctxOf(d);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, d.width, d.height);
  g.fillStyle = DARK;
  g.fillRect(0, 0, d.width, d.height);
  g.globalCompositeOperation = 'destination-out';
  for (const [px, py, rad] of holes) {
    if (rad <= 0) continue;
    const gr = g.createRadialGradient(px, py, rad * 0.55, px, py, rad);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr;
    g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  g.globalCompositeOperation = 'source-over';
  return d;
}
function glowPass(field, ctx, items) {
  const t = field.time;
  ctx.globalCompositeOperation = 'lighter';
  for (const [px, py, k, kind, cx, cy] of items) {
    const G = GLOW[kind];
    if (!G) continue;
    if (px < -80 || py < -80 || px > field.vw + 80 || py > field.vh + 80) continue;
    const pulse = 0.75 + Math.sin(t / 260 + cx * 1.7 + cy) * 0.25;
    const rad = G[1] * k;
    const gr = ctx.createRadialGradient(px, py, 1, px, py, rad);
    gr.addColorStop(0, `rgba(${G[0]}, ${G[2] * pulse})`);
    gr.addColorStop(1, `rgba(${G[0]}, 0)`);
    ctx.fillStyle = gr;
    ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}
// 歌って いる スピカの 光の 輪と 音ぷ・鳴って いる 石の 輪
function notes(field, ctx, items) {
  const t = field.time;
  ctx.save();
  for (const [px, py, k, kind] of items) {
    if (kind === 'song') {
      const r = (0.9 + 0.12 * Math.sin(t / 300)) * k;
      ctx.strokeStyle = 'rgba(255, 236, 160, 0.75)';
      ctx.lineWidth = Math.max(1, k / 12);
      ctx.beginPath(); ctx.ellipse(px, py + k * 0.35, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255, 246, 200, 0.95)';
      ctx.font = `bold ${Math.round(k * 0.7)}px sans-serif`;
      ctx.textAlign = 'center';
      for (let i = 0; i < 3; i++) {
        const ph = ((t / 1400 + i / 3) % 1);
        ctx.globalAlpha = 1 - ph;
        ctx.fillText(i % 2 ? '♫' : '♪', px + Math.sin(t / 500 + i * 2) * k * 0.6 + (i - 1) * k * 0.4, py - k * 0.6 - ph * k * 1.4);
      }
      ctx.globalAlpha = 1;
    } else if (kind === 'ring') {
      const ph = (t / 900) % 1;
      ctx.strokeStyle = `rgba(170, 230, 255, ${0.8 * (1 - ph)})`;
      ctx.lineWidth = Math.max(1, k / 14);
      ctx.beginPath(); ctx.ellipse(px, py, k * (0.4 + ph * 1.2), k * (0.2 + ph * 0.6), 0, 0, Math.PI * 2); ctx.stroke();
    }
  }
  ctx.restore();
}

// ───── 2D ─────
export function drawC9dDark2D(field, camX, camY) {
  noteC9dStage(field);
  const ctx = field.ctx;
  const cs = centersOf(field);
  const holes = cs.map(([cx, cy, r]) => [(cx + 0.5) * TS - camX, (cy + 0.5) * TS - camY, (r + 0.5) * TS]);
  ctx.drawImage(darkPass(field, holes), 0, 0);
  const items = cs.map(([cx, cy, , kind]) => [(cx + 0.5) * TS - camX, (cy + 0.5) * TS - camY, TS, kind, cx, cy]);
  glowPass(field, ctx, items);
  notes(field, ctx, items);
}
// 石の ある 明るい マップ（ピラミッドの 岸）でも 歌って いる スピカと 鳴って いる 石の 輪を かく
export function drawC9dRing2D(field, camX, camY) {
  noteC9dStage(field);
  if (field.map?.c9dLane || !stateOf(field)) return;
  const items = [];
  const sp = c9dSingingSpica(field);
  if (sp) items.push([sp.x * TS - camX, (sp.y - 0.3) * TS - camY, TS, 'song', sp.x, sp.y]);
  for (const id of ringing(field)) {
    const s = stoneById9d(field.map, id);
    if (s) items.push([(s.x + 0.5) * TS - camX, (s.y + 0.5) * TS - camY, TS, 'ring', s.x, s.y]);
  }
  glowPass(field, field.ctx, items);
  notes(field, field.ctx, items);
}

// ───── 2.5D（render3d の 上に かさねる 2D。P(x, y, up) … 画面の 場所と 1マスの 大きさ）─────
export function drawC9dDark3D(field, ctx, P) {
  noteC9dStage(field);
  const cs = centersOf(field).filter(([cx, cy]) => Math.abs(cx - field.me.x) < 30 && Math.abs(cy - field.me.y) < 30);
  const pts = cs.map(([cx, cy, r, kind]) => { const p = P(cx + 0.5, cy + 0.5, kind === 'stone' || kind === 'ring' ? 0.6 : 0.3); return [p.x, p.y, (r + 0.5) * p.k, kind, cx, cy, p.k]; });
  ctx.drawImage(darkPass(field, pts.map(([x, y, r]) => [x, y, r])), 0, 0);
  const items = pts.map(([x, y, , kind, cx, cy, k]) => [x, y, k, kind, cx, cy]);
  glowPass(field, ctx, items);
  notes(field, ctx, items);
}
export function drawC9dRing3D(field, ctx, P) {
  noteC9dStage(field);
  if (field.map?.c9dLane || !stateOf(field)) return;
  const items = [];
  const sp = c9dSingingSpica(field);
  if (sp) { const p = P(sp.x, sp.y, 0.6); items.push([p.x, p.y, p.k, 'song', sp.x, sp.y]); }
  for (const id of ringing(field)) {
    const s = stoneById9d(field.map, id);
    if (s) { const p = P(s.x + 0.5, s.y + 0.5, 0.6); items.push([p.x, p.y, p.k, 'ring', s.x, s.y]); }
  }
  glowPass(field, ctx, items);
  notes(field, ctx, items);
}

// ───── HUD の「スピカをよぶ」ボタン ─────
const CSS = `
.hud-btn.hud-c9d-call { color: #fff6c8; border-color: #e8c860; }
`;
export const c9dCallShown = (g) => g.state === 'field' && !!g.field && c9dSpicaLeft(g.field);
export class C9dCallButton {
  constructor(game) {
    this.game = game;
    if (typeof document === 'undefined' || !game.hud?.btns) return;
    if (!document.getElementById('c9d-call-css')) document.head.append(el('style', { id: 'c9d-call-css', text: CSS }));
    this.btn = el('button', { class: 'win hud-btn hud-c9d-call', text: '♪スピカをよぶ', onclick: () => this.call() });
    this.btn.hidden = true;
    game.hud.btns.append(this.btn);
  }
  update() {
    if (!this.btn) return;
    const show = c9dCallShown(this.game);
    if (this.btn.hidden === show) this.btn.hidden = !show;
  }
  call() {
    const g = this.game;
    if (!c9dCallShown(g) || g.busy || g.menuOpen) return;
    g.audio?.sfx?.('confirm');
    g.net.send({ t: 'menu', action: 'c9dCall' });
  }
}
