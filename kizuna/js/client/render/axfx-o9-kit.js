// 第51回 C3（o9）: 幻の職業の え の どうぐばこ（つぶ o9〜 と 足しかた）。この ファイルは C3 だけが さわる
// ・o9Sky     … 一しゅんの うすい 空（sun 晴れ・rain 雨・thunder かみなり・space 宇宙・white まっ白・stadium 夜の 球場）。a は 0.35 まで
// ・o9Rain    … 雨の すじ（1つの つぶで たくさん）。x0..x1・y0..y1・n・ang
// ・o9Sun     … 大きな にこにこ 太陽（まわる 光の とげ）。keys・size
// ・o9Cloud   … 雲（white 白・dark 黒い かみなり雲〈おこった 目〉・rain 雨雲）。keys・size
// ・o9Bubble  … さけびの ふきだし（ぎざぎざ）＋ カタカナの 字。keys・size・str
// ・o9Galaxy  … うずまきの 銀河（まわる 星の うで）。x・y・r・spin
// ・o9Erase   … 消しゴムで まっ白に けす（白い おびが のびて、先に 消しゴム）。x・y・w・h・dir
// ・o9Gear    … 作りかえる 装備（sword 剣・shield たて・boot くつ・staff つえ・hat ぼうし・armor よろい）。はじめは 青い 点線（設計図）→ 色が つく
// ・o9Stadium … 球場まるごと（スタンド・観客の 点・ライト・芝生）。x・y・w・h
// ・o9Crowd   … 観客の 頭の ならび（ウェーブ）。x0..x1・y・n・wave
// ・o9Rainbow … にじ（7色の 弧が のびる）。x・y・r
// ・o9Zabuton … ざぶとん（正座）。keys・size
// どれも ふちどり つき。毎フレーム グラデーションを 作らない（softGlow の キャッシュ）
import { softGlow, disc, clamp01, lerp, easeOut, hash } from './axkit.js?v=847e4bcd6ab2';
import { kf, envOf } from './axfx-o4-kit.js?v=847e4bcd6ab2';

const TAU = Math.PI * 2;
const OUT = '#1c1a2a';
const pos = (v, m = 0.01) => (v > m ? v : m);
const ell = (x, cx, cy, rx, ry, rot = 0) => { x.beginPath(); x.ellipse(cx, cy, pos(rx), pos(ry), rot, 0, TAU); };
function fs(x, fill, L, edge = OUT) { x.fillStyle = fill; x.fill(); if (L) { x.lineWidth = L; x.strokeStyle = edge; x.stroke(); } }
function glowAt(x, cx, cy, r, color, a) { const g = x.globalCompositeOperation, ga = x.globalAlpha; x.globalCompositeOperation = 'lighter'; softGlow(x, cx, cy, pos(r, 0.5), color, a); x.globalCompositeOperation = g; x.globalAlpha = ga; }
function poly(x, pts) { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); }
function puffs(x, list, fill, edge, L) {
  x.beginPath();
  for (const [cx, cy, r] of list) { x.moveTo(cx + r, cy); x.arc(cx, cy, pos(r), 0, TAU); }
  x.lineWidth = L * 2; x.strokeStyle = edge; x.stroke();
  x.fillStyle = fill; x.fill();
}
const at = (p) => (p.keys ? kf(p.keys, p.age, p.ease) : [p.x, p.y, 1, p.rot || 0, 1]);

// 装備の 絵（-1..1 の 大きさ）。blue … 設計図（点線の ふち だけ）
const GEAR = {
  sword(x, blue) {
    poly(x, [[-0.12, 0.45], [-0.12, -0.85], [0, -1.05], [0.12, -0.85], [0.12, 0.45]]);
    blue ? x.stroke() : fs(x, '#eef4ff', 0.07, '#4a5a8a');
    if (!blue) { x.beginPath(); x.moveTo(0, -0.9); x.lineTo(0, 0.4); x.lineWidth = 0.05; x.strokeStyle = '#ffffff'; x.stroke(); }
    poly(x, [[-0.48, 0.42], [0.48, 0.42], [0.48, 0.56], [-0.48, 0.56]]);
    blue ? x.stroke() : fs(x, '#ffd23a', 0.06, '#8a5a0a');
    poly(x, [[-0.09, 0.56], [0.09, 0.56], [0.09, 0.95], [-0.09, 0.95]]);
    blue ? x.stroke() : fs(x, '#8a3a2a', 0.06);
  },
  shield(x, blue) {
    poly(x, [[-0.75, -0.85], [0.75, -0.85], [0.7, 0.1], [0, 0.95], [-0.7, 0.1]]);
    blue ? x.stroke() : fs(x, '#3a8aff', 0.08, '#1a2a6a');
    if (!blue) { poly(x, [[-0.1, -0.55], [0.1, -0.55], [0.1, -0.15], [0.45, -0.15], [0.45, 0.05], [0.1, 0.05], [0.1, 0.5], [-0.1, 0.5], [-0.1, 0.05], [-0.45, 0.05], [-0.45, -0.15], [-0.1, -0.15]]); fs(x, '#ffd23a', 0.04, '#8a5a0a'); }
  },
  boot(x, blue) {
    poly(x, [[-0.45, -0.95], [0.2, -0.95], [0.2, 0.25], [0.95, 0.45], [0.95, 0.85], [-0.45, 0.85]]);
    blue ? x.stroke() : fs(x, '#3ad860', 0.08, '#1a5a2a');
    if (!blue) {
      poly(x, [[-0.45, -0.55], [-0.9, -0.85], [-0.75, -0.35], [-0.45, -0.3]]); fs(x, '#ffffff', 0.05, '#5a8a6a');
      poly(x, [[-0.45, 0.62], [0.95, 0.62], [0.95, 0.85], [-0.45, 0.85]]); fs(x, '#1a5a2a', 0);
    }
  },
  staff(x, blue) {
    poly(x, [[-0.07, -0.55], [0.07, -0.55], [0.07, 1], [-0.07, 1]]);
    blue ? x.stroke() : fs(x, '#a8703a', 0.05, '#5a3a1a');
    ell(x, 0, -0.75, 0.3, 0.3);
    blue ? x.stroke() : fs(x, '#b45aff', 0.07, '#4a1a8a');
    if (!blue) { ell(x, -0.08, -0.84, 0.08, 0.08); fs(x, '#ffffff', 0); }
  },
  hat(x, blue) {
    poly(x, [[-0.95, 0.55], [0.95, 0.55], [0.45, 0.3], [0.1, -0.95], [-0.45, 0.3]]);
    blue ? x.stroke() : fs(x, '#ff8a2a', 0.08, '#8a3a0a');
    if (!blue) { poly(x, [[-0.5, 0.25], [0.5, 0.25], [0.45, 0.42], [-0.5, 0.42]]); fs(x, '#ffd23a', 0.04, '#8a5a0a'); }
  },
  armor(x, blue) {
    poly(x, [[-0.4, -0.9], [0.4, -0.9], [0.85, -0.6], [0.65, -0.1], [0.5, 0.9], [-0.5, 0.9], [-0.65, -0.1], [-0.85, -0.6]]);
    blue ? x.stroke() : fs(x, '#c8d4f0', 0.08, '#3a4a7a');
    if (!blue) { ell(x, 0, -0.1, 0.22, 0.22); fs(x, '#ff4a7a', 0.05, '#8a1a3a'); }
  },
};
export const O9_GEARS = Object.keys(GEAR);

export const AX_O9_KIT_FINE = {
  // 一しゅんの うすい 空（a … 0.35 まで）
  o9Sky(x, p) {
    const a = envOf(p, 120, 240) * Math.min(0.35, p.a ?? 0.3);
    if (a <= 0.005) return;
    const W = 256, H = 144;
    x.save();
    const base = { sun: '#ffc84a', rain: '#3a5a8a', thunder: '#2a1a4a', space: '#0a0a2a', white: '#ffffff', stadium: '#0a1a38', rainbow: '#bfeaff' }[p.v] || '#ffffff';
    x.globalAlpha = a; x.fillStyle = base; x.fillRect(-8, -8, W + 16, H + 16);
    if (p.v === 'sun') {
      // 左上から 光の すじ
      x.globalCompositeOperation = 'lighter';
      x.globalAlpha = Math.min(1, a * 0.75); x.fillStyle = '#fff6c8';
      for (let i = 0; i < 6; i++) { const an = 0.25 + i * 0.22 + Math.sin(p.age / 400 + i) * 0.02; poly(x, [[0, 0], [Math.cos(an - 0.05) * 320, Math.sin(an - 0.05) * 320], [Math.cos(an + 0.05) * 320, Math.sin(an + 0.05) * 320]]); x.fill(); }
    } else if (p.v === 'space' || p.v === 'stadium') {
      x.globalAlpha = Math.min(1, a * 2.6);
      for (let i = 0; i < 30; i++) { x.fillStyle = i % 5 ? '#ffffff' : '#ffe08a'; const sx = hash(i * 3.3) * W, sy = hash(i * 5.9) * H * (p.v === 'stadium' ? 0.45 : 1); const tw = 0.6 + 0.6 * Math.sin(p.age / 110 + i); x.fillRect(sx, sy, tw + 0.4, tw + 0.4); }
    } else if (p.v === 'thunder') {
      const fl = Math.sin(p.age / 37) > 0.7 ? 1 : 0;
      if (fl) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = Math.min(1, a * 0.8); x.fillStyle = '#e8e0ff'; x.fillRect(-8, -8, W + 16, H + 16); }
    }
    x.restore();
  },
  // 雨の すじ
  o9Rain(x, p) {
    const a = envOf(p, 80, 200) * (p.alpha ?? 0.85);
    if (a <= 0.01) return;
    const n = p.n || 40, ang = p.ang ?? 0.25, len = p.len || 12;
    const x0 = p.x0 ?? 0, x1 = p.x1 ?? 256, y0 = p.y0 ?? -10, y1 = p.y1 ?? 144, span = Math.max(1, y1 - y0);
    const sp = p.speed || 0.5;
    x.save();
    x.lineCap = 'round';
    x.globalAlpha = a;
    x.strokeStyle = p.color || '#bfe0ff'; x.lineWidth = p.w || 1.2;
    x.beginPath();
    for (let i = 0; i < n; i++) {
      const bx = x0 + hash(i * 1.7 + (p.seed || 0)) * (x1 - x0);
      const yy = y0 + ((hash(i * 2.3 + (p.seed || 0)) * span + p.age * sp) % span);
      const xx = bx + (yy - y0) * Math.sin(ang) * 0.4;
      x.moveTo(xx, yy); x.lineTo(xx - Math.sin(ang) * len, yy - Math.cos(ang) * len);
    }
    x.stroke();
    x.restore();
  },
  // 大きな にこにこ 太陽
  o9Sun(x, p) {
    const [cx, cy, s, , ka] = at(p);
    const a = envOf(p, 100, 220) * ka;
    if (a <= 0.01) return;
    const r = pos((p.size || 18) * s, 0.5);
    x.save();
    x.translate(cx, cy);
    glowAt(x, 0, 0, r * 2.6, '#ffe08a', a * 0.9);
    x.globalAlpha = a;
    x.rotate(p.age / 700);
    for (let i = 0; i < 12; i++) {
      x.save(); x.rotate((i / 12) * TAU);
      const l = 1.45 + 0.12 * Math.sin(p.age / 80 + i);
      poly(x, [[-r * 0.2, -r * 0.92], [0, -r * l], [r * 0.2, -r * 0.92]]); fs(x, i % 2 ? '#ffb020' : '#ff8a1a', Math.max(0.6, r * 0.05), '#a05a0a');
      x.restore();
    }
    x.rotate(-p.age / 700);
    ell(x, 0, 0, r, r); fs(x, '#ffd83a', Math.max(0.8, r * 0.07), '#c87a10');
    if (p.face !== false) {
      // にこにこ顔
      x.fillStyle = '#5a2a0a';
      ell(x, -r * 0.33, -r * 0.15, r * 0.09, r * 0.14); x.fill();
      ell(x, r * 0.33, -r * 0.15, r * 0.09, r * 0.14); x.fill();
      x.beginPath(); x.arc(0, r * 0.08, r * 0.42, 0.2, Math.PI - 0.2); x.lineWidth = Math.max(0.8, r * 0.09); x.strokeStyle = '#5a2a0a'; x.stroke();
      ell(x, -r * 0.58, r * 0.22, r * 0.14, r * 0.09); fs(x, 'rgba(255,110,90,0.6)', 0);
      ell(x, r * 0.58, r * 0.22, r * 0.14, r * 0.09); fs(x, 'rgba(255,110,90,0.6)', 0);
    }
    x.restore();
  },
  // 雲（v: white・dark・rain）
  o9Cloud(x, p) {
    const [cx, cy, s, , ka] = at(p);
    const a = envOf(p, 90, 200) * ka;
    if (a <= 0.01) return;
    const r = pos((p.size || 16) * s, 0.5);
    const C = { white: ['#ffffff', '#8a9ab8'], dark: ['#4a4a6a', '#1a1a2a'], rain: ['#8a9ab8', '#3a4a6a'] }[p.v || 'white'];
    x.save();
    x.translate(cx, cy);
    x.globalAlpha = a;
    const bob = Math.sin(p.age / 160 + (p.seed || 0)) * r * 0.04;
    puffs(x, [[-r * 0.85, bob + r * 0.15, r * 0.5], [-r * 0.3, bob - r * 0.25, r * 0.62], [r * 0.35, bob - r * 0.15, r * 0.55], [r * 0.9, bob + r * 0.18, r * 0.45], [0, bob + r * 0.3, r * 0.5]], C[0], C[1], Math.max(0.6, r * 0.06));
    if (p.v === 'dark') {
      // おこった 目（こわく ない ぷんぷん顔）
      x.strokeStyle = '#ffe040'; x.lineWidth = Math.max(0.8, r * 0.08); x.lineCap = 'round';
      x.beginPath(); x.moveTo(-r * 0.45, -r * 0.05); x.lineTo(-r * 0.15, r * 0.08); x.moveTo(r * 0.45, -r * 0.05); x.lineTo(r * 0.15, r * 0.08); x.stroke();
      x.fillStyle = '#ffe040'; ell(x, -r * 0.28, r * 0.2, r * 0.07, r * 0.07); x.fill(); ell(x, r * 0.28, r * 0.2, r * 0.07, r * 0.07); x.fill();
    } else if (p.face) {
      x.fillStyle = '#3a3a5a'; ell(x, -r * 0.25, r * 0.05, r * 0.06, r * 0.09); x.fill(); ell(x, r * 0.25, r * 0.05, r * 0.06, r * 0.09); x.fill();
    }
    x.restore();
  },
  // さけびの ふきだし（ぎざぎざ）
  o9Bubble(x, p) {
    const [cx, cy, s, , ka] = at(p);
    const a = envOf(p, 40, 160) * ka;
    if (a <= 0.01) return;
    const pop = 1 + 0.5 * Math.exp(-p.age / 80) * Math.cos(p.age / 30);
    const r = pos((p.size || 22) * s * Math.max(0.3, pop), 0.5);
    x.save();
    x.translate(cx, cy);
    x.globalAlpha = a;
    const n = 14;
    // 字の 長さに あわせて よこに のばす（字が ふきだしから はみ出さない）
    const sz = Math.max(4, r * (p.fsize || 0.62));
    const rx = Math.max(r * 1.35, (String(p.str || '').length * sz * 0.92) / 2 / 0.78 + 4);
    x.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const an = (i / (n * 2)) * TAU, k = i % 2 ? 0.78 : 1 + hash(i + (p.seed || 0)) * 0.18;
      const px = Math.cos(an) * rx * k, py = Math.sin(an) * r * 0.75 * k;
      i ? x.lineTo(px, py) : x.moveTo(px, py);
    }
    x.closePath();
    fs(x, p.fill || '#ffffff', Math.max(1, r * 0.07), p.edge || '#c81a2a');
    if (p.str) {
      x.font = `bold ${sz.toFixed(1)}px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
      x.lineWidth = Math.max(1.5, sz * 0.22); x.strokeStyle = '#ffffff'; x.strokeText(p.str, 0, 1);
      x.fillStyle = p.color || '#e01a2a'; x.fillText(p.str, 0, 1);
    }
    x.restore();
  },
  // うずまきの 銀河
  o9Galaxy(x, p) {
    const a = envOf(p, 160, 260) * (p.alpha ?? 1);
    if (a <= 0.01) return;
    const g = easeOut(clamp01(p.age / (p.grow || 300)));
    const r = pos((p.r || 40) * g, 0.5);
    x.save();
    x.translate(p.x, p.y);
    x.scale(1, p.sy ?? 0.5);
    glowAt(x, 0, 0, r * 0.6, p.core || '#ffe8c8', a);
    x.rotate(p.age / 1000 * (p.spin ?? 2));
    const cols = p.colors || ['#ffffff', '#c8b0ff', '#8ac8ff', '#ffb0e0'];
    for (let arm = 0; arm < 3; arm++) {
      for (let i = 0; i < 18; i++) {
        const u = i / 18, an = arm * (TAU / 3) + u * 3.2, rad = r * (0.12 + u * 0.9);
        const sx = Math.cos(an) * rad, sy = Math.sin(an) * rad;
        x.globalAlpha = a * (1 - u * 0.6);
        x.fillStyle = cols[(i + arm) % cols.length];
        const sz = Math.max(1, (2.8 - u * 1.4) * (r / 40));
        x.fillRect(sx - sz / 2, sy - sz / 2, sz, sz);
      }
    }
    x.restore();
  },
  // 消しゴムで まっ白に けす（dir: 1 … 左から 右へ）
  o9Erase(x, p) {
    const a = envOf(p, 30, 260);
    if (a <= 0.01) return;
    const u = easeOut(clamp01(p.age / (p.wipe || 300)));
    const w = p.w || 50, h = p.h || 44, dir = p.dir || 1;
    const x0 = p.x - (w / 2) * dir, cur = w * u;
    x.save();
    x.globalAlpha = a * 0.92;
    x.fillStyle = '#ffffff';
    const rx = dir > 0 ? x0 : x0 - cur;
    // 角の まるい 白い おび（ふちは やわらかく）
    if (cur > 0.5) {
      const r0 = Math.min(8, cur / 2, h / 2);
      x.beginPath();
      x.moveTo(rx + r0, p.y - h / 2); x.lineTo(rx + cur - r0, p.y - h / 2); x.quadraticCurveTo(rx + cur, p.y - h / 2, rx + cur, p.y - h / 2 + r0);
      x.lineTo(rx + cur, p.y + h / 2 - r0); x.quadraticCurveTo(rx + cur, p.y + h / 2, rx + cur - r0, p.y + h / 2);
      x.lineTo(rx + r0, p.y + h / 2); x.quadraticCurveTo(rx, p.y + h / 2, rx, p.y + h / 2 - r0);
      x.lineTo(rx, p.y - h / 2 + r0); x.quadraticCurveTo(rx, p.y - h / 2, rx + r0, p.y - h / 2);
      x.fill();
      x.globalAlpha = a * 0.5; x.lineWidth = 3; x.strokeStyle = '#e8d8ff'; x.stroke();
    }
    glowAt(x, p.x, p.y, Math.max(w, h) * 0.8, '#ffffff', a * u * 0.8);
    // 消しゴム（先っぽ）
    if (u < 0.999 || p.age < (p.wipe || 300) + 120) {
      const ex = x0 + cur * dir;
      x.globalAlpha = a;
      x.save();
      x.translate(ex, p.y + Math.sin(p.age / 22) * 3);
      x.rotate(-0.35 * dir);
      poly(x, [[-6, -h * 0.32], [6, -h * 0.32], [6, h * 0.32], [-6, h * 0.32]]); fs(x, '#ff9ab8', 1, '#8a2a4a');
      poly(x, [[-6.5, -h * 0.05], [6.5, -h * 0.05], [6.5, h * 0.12], [-6.5, h * 0.12]]); fs(x, '#3a8aff', 0.8, '#1a2a6a');
      x.restore();
    }
    x.restore();
  },
  // 作りかえる 装備（item）。drawAt … 点線から 色に かわる ms
  o9Gear(x, p) {
    const [cx, cy, s, r0, ka] = at(p);
    const a = envOf(p, 60, 180) * ka;
    const f = GEAR[p.item];
    if (a <= 0.01 || !f) return;
    const size = pos((p.size || 10) * s, 0.3);
    const fill = clamp01((p.age - (p.drawAt ?? 220)) / 160);
    x.save();
    x.translate(cx, cy);
    x.rotate(r0 || 0);
    if (fill > 0) glowAt(x, 0, 0, size * 2, p.glow || '#fff6b0', a * fill * 0.8);
    x.scale(size, size);
    x.lineJoin = 'round'; x.lineCap = 'round';
    if (fill < 1) {
      x.globalAlpha = a * (1 - fill);
      x.setLineDash([0.18, 0.12]); x.lineDashOffset = -p.age / 400;
      x.lineWidth = 0.09; x.strokeStyle = '#5ac8ff';
      f(x, true);
      x.setLineDash([]);
    }
    if (fill > 0) {
      x.globalAlpha = a * fill;
      f(x, false);
      // きらり
      const sh = clamp01((p.age - (p.drawAt ?? 220) - 120) / 260);
      if (sh > 0 && sh < 1) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = a * (1 - sh); x.fillStyle = '#ffffff'; poly(x, [[-1 + sh * 2.4, -1.1], [-0.7 + sh * 2.4, -1.1], [-1.2 + sh * 2.4, 1.1], [-1.5 + sh * 2.4, 1.1]]); x.fill(); }
    }
    x.restore();
  },
  // 球場まるごと（x,y … グラウンドの まん中、w・h … 大きさ）
  o9Stadium(x, p) {
    const [cx, cy, s, , ka] = at(p);
    const a = envOf(p, 140, 260) * ka;
    if (a <= 0.01) return;
    const w = pos((p.w || 200) * s, 1), h = pos((p.h || 60) * s, 1);
    x.save();
    x.translate(cx, cy);
    x.globalAlpha = a;
    // スタンド（外の 輪）
    ell(x, 0, 0, w / 2, h / 2); fs(x, '#3a3a5a', 1.4, '#14142a');
    // 観客の 点（ゆれる）
    const cols = ['#ff5a5a', '#ffffff', '#ffd23a', '#5ab8ff', '#7dffb0', '#ff9ad8'];
    for (let i = 0; i < 70; i++) {
      const an = (i / 70) * TAU, k = 0.78 + hash(i * 3.1) * 0.18;
      const jump = Math.max(0, Math.sin(p.age / 90 - an * 2)) * 1.6 * (p.cheer ?? 1);
      x.fillStyle = cols[i % cols.length];
      x.fillRect(Math.cos(an) * (w / 2) * k - 1, Math.sin(an) * (h / 2) * k - 1 - jump, 2, 2);
    }
    // 芝生と ダイヤモンド
    ell(x, 0, h * 0.06, w * 0.34, h * 0.3); fs(x, '#3aa84a', 1, '#1a5a2a');
    poly(x, [[0, -h * 0.12], [w * 0.1, h * 0.06], [0, h * 0.24], [-w * 0.1, h * 0.06]]); fs(x, '#d8a060', 0.8, '#8a5a2a');
    // ライト
    for (const sx of [-1, 1]) {
      const lx = sx * w * 0.48, ly = -h * 0.55;
      x.fillStyle = '#5a5a7a'; x.fillRect(lx - 1, ly, 2, h * 0.4);
      x.fillStyle = '#fff6c8'; x.fillRect(lx - 5, ly - 4, 10, 5);
      glowAt(x, lx, ly - 2, 26, '#fff6c8', a * (0.7 + 0.3 * Math.sin(p.age / 60)));
    }
    x.restore();
  },
  // 観客の 頭の ならび（wave … 波が 1しゅう する ms）
  o9Crowd(x, p) {
    const a = envOf(p, 100, 200);
    if (a <= 0.01) return;
    const n = p.n || 24, x0 = p.x0 ?? 0, x1 = p.x1 ?? 256, y = p.y;
    const cols = p.colors || ['#ff5a5a', '#ffd23a', '#5ab8ff', '#7dffb0', '#ff9ad8', '#ffffff'];
    x.save();
    x.globalAlpha = a;
    for (let row = 0; row < (p.rows || 2); row++) {
      for (let i = 0; i < n; i++) {
        const u = i / Math.max(1, n - 1);
        const hx = lerp(x0, x1, u) + (row % 2) * 4;
        const ph = p.wave ? (p.age / p.wave - u) * TAU : p.age / 120 + i;
        const up = p.wave ? Math.max(0, Math.sin(ph)) * 7 : Math.abs(Math.sin(ph)) * 2;
        const hy = y + row * 7 - up;
        x.fillStyle = cols[(i + row * 3) % cols.length];
        x.fillRect(hx - 3, hy + 3, 6, 6);
        ell(x, hx, hy, 2.6, 2.6); fs(x, '#ffd8b0', 0.6);
        if (up > 4) { x.strokeStyle = '#ffd8b0'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(hx - 3, hy + 4); x.lineTo(hx - 5, hy - 3); x.moveTo(hx + 3, hy + 4); x.lineTo(hx + 5, hy - 3); x.stroke(); }
      }
    }
    x.restore();
  },
  // にじ
  o9Rainbow(x, p) {
    const a = envOf(p, 80, 240) * (p.alpha ?? 0.9);
    if (a <= 0.01) return;
    const g = easeOut(clamp01(p.age / (p.grow || 400)));
    const cols = ['#ff4a4a', '#ff9a2a', '#ffe040', '#5ad84a', '#3aa8ff', '#3a5ad8', '#a85ad8'];
    x.save();
    x.lineCap = 'round';
    x.globalAlpha = a;
    const r = p.r || 70, bw = p.bw || 3.2;
    cols.forEach((c, i) => {
      x.beginPath(); x.arc(p.x, p.y, pos(r - i * bw, 1), Math.PI, Math.PI + Math.PI * g);
      x.strokeStyle = c; x.lineWidth = bw + 0.4; x.stroke();
    });
    x.restore();
  },
  // ざぶとん
  o9Zabuton(x, p) {
    const [cx, cy, s, , ka] = at(p);
    const a = envOf(p, 80, 160) * ka;
    if (a <= 0.01) return;
    const r = pos((p.size || 14) * s, 0.5);
    x.save();
    x.translate(cx, cy);
    x.globalAlpha = a;
    x.beginPath();
    x.moveTo(-r, 0); x.quadraticCurveTo(-r * 1.05, -r * 0.42, -r * 0.4, -r * 0.4); x.lineTo(r * 0.4, -r * 0.4); x.quadraticCurveTo(r * 1.05, -r * 0.42, r, 0);
    x.quadraticCurveTo(r * 1.05, r * 0.42, r * 0.4, r * 0.4); x.lineTo(-r * 0.4, r * 0.4); x.quadraticCurveTo(-r * 1.05, r * 0.42, -r, 0); x.closePath();
    fs(x, p.color || '#a83a8a', Math.max(0.8, r * 0.07), '#4a0a3a');
    for (const [dx, dy] of [[-0.5, -0.2], [0.5, -0.2], [0, 0.2]]) { ell(x, dx * r, dy * r, r * 0.08, r * 0.05); fs(x, '#ffd23a', 0); }
    x.restore();
  },
};

// ───────────── 足しかた（c … play の 2ばんめ） ─────────────
function put(c, kind, o) {
  const k = o.keys;
  const L = k ? k[k.length - 1] : null;
  const x = o.x ?? (L ? L[1] : o.x0 ?? 128), y = o.y ?? (L ? L[2] : o.y0 ?? 72);
  c.fx.add({ life: 600, delay: 0, seed: Math.random() * 100, ...o, kind, x, y });
}
// 一しゅんの 空（0.6s まで・うすく）
export const sky = (c, v, o = {}) => put(c, 'o9Sky', { v, x: 128, y: 72, life: Math.min(600, o.life ?? 560), ...o, a: Math.min(0.35, o.a ?? 0.3) });
export const rain = (c, o = {}) => put(c, 'o9Rain', { x: ((o.x0 ?? 0) + (o.x1 ?? 256)) / 2, y: ((o.y0 ?? 0) + (o.y1 ?? 144)) / 2, ...o });
export const sun = (c, o) => put(c, 'o9Sun', o);
export const cloud = (c, v, o) => put(c, 'o9Cloud', { v, ...o });
export const bubble = (c, str, o) => put(c, 'o9Bubble', { str, ...o });
export const galaxy = (c, x, y, o = {}) => put(c, 'o9Galaxy', { x, y, ...o });
export const erase = (c, t, o = {}) => put(c, 'o9Erase', { x: t.x, y: t.y, ...o });
export const gear = (c, item, o) => put(c, 'o9Gear', { item, ...o });
export const stadium = (c, o) => put(c, 'o9Stadium', o);
export const crowd = (c, o) => put(c, 'o9Crowd', { x: ((o.x0 ?? 0) + (o.x1 ?? 256)) / 2, ...o });
export const rainbow = (c, x, y, o = {}) => put(c, 'o9Rainbow', { x, y, ...o });
export const zabuton = (c, o) => put(c, 'o9Zabuton', o);
// 味方 ぜんいん（味方に かける 技・看板の 技の さいご）
export const party = (c) => (c.dir === 'down' || !c.fromAlly ? [] : [0, 1, 2, 3].map((i) => ({ x: c.W / 2 + (i - 1.5) * 58, y: c.H - 22 })));
// 下向き（敵が 味方に つかう）なら 上下を かえる 高さ（味方の 上は 画面の 上の ほう）
export const skyY = (c, y = 26) => (c.dir === 'down' ? Math.max(14, Math.min(...c.targets.map((t) => t.y)) - 40) : y);
export { disc };
