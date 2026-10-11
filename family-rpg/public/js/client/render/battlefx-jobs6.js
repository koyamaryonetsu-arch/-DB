// 第29回の 新しい 職業（るろうに剣士の 道）の 看板の技の エフェクト
// anim の なまえは 技の id と おなじ（'rurouni_sig' など）。
// battlefx.js の play() で battlefx-jobs5.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
//  rurouni_sig  竜つい閃 … 空の 上から 光の 太刀すじが まっすぐ 落ちて、地面が われる
//  hitokiri_sig 竜巣閃   … 暗い 夜の いろの 中、赤と 白の 太刀すじが 何本も はしる（ランダムで 6回）
//  himura_sig   九頭竜閃 … 9つの 方向から 光の すじが いっせいに あつまって、まん中で ドン
//  hiten_sig    天かける竜のひらめき … ばっ刀の 白い 光 → まわりの 空気が すいこまれる → 竜の 形の 風が 空へ のぼる → ✕ の 二の太刀
// ・どれも 1.8びょう いないで おわる。あたる しゅんかんは すぐ（ダメージの 数字と ずれない）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const SIG6 = new Set(['rurouni_sig', 'hitokiri_sig', 'himura_sig', 'hiten_sig']);
// たたかいの 音（client/battle.js の ANIM_SFX に まぜる。sfx-r29.js の 音）
export const JOB6_SFX = { rurouni_sig: 'r29_tsui', hitokiri_sig: 'r29_sou', himura_sig: 'r29_kuzu', hiten_sig: 'r29_amakakeru' };

// ───────────── こまかい つぶ（battlefx.js の FINE に まぜる。なまえは j6 で はじまる） ─────────────
export const JOB6_FINE = {
  // 上から 落ちる 光の 太刀すじ（y0 → y）
  j6fall(x, p, t) {
    const k = clamp01(p.age / p.travel);
    const y1 = p.y0 + (p.y - p.y0) * k;
    const a = fadeOut(t, 0.5);
    if (a <= 0) return;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    const g = x.createLinearGradient(p.x, p.y0, p.x, y1);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, p.glow || '#ffb0a0');
    x.fillStyle = g;
    x.fillRect(p.x - 4, p.y0, 8, Math.max(1, y1 - p.y0));
    x.fillStyle = '#ffffff';
    x.fillRect(p.x - 1, p.y0, 2, Math.max(1, y1 - p.y0));
    x.restore();
  },
  // 外から まん中へ はしる 光の すじ（九頭竜閃）
  j6ray(x, p, t) {
    const k = clamp01(p.age / p.travel);
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const r0 = p.r * (1 - k * 0.92), r1 = p.r * Math.max(0, 1 - k * 1.25);
    const c = Math.cos(p.ang), s = Math.sin(p.ang);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.lineCap = 'round';
    x.strokeStyle = p.glow || '#9ac8ff';
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(p.x + c * (r0 + 14), p.y + s * (r0 + 14));
    x.lineTo(p.x + c * r1, p.y + s * r1);
    x.stroke();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1.6;
    x.stroke();
    x.restore();
  },
  // 竜の 形の 風（太い 体が うねりながら のぼる。あたまに つのと あご、せなかに とげ）
  j6dragon(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const k = clamp01(p.age / p.travel);
    const n = 22, s = p.s || 1;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const u = k * 1.2 - i * 0.032;
      if (u < 0) break;
      const v = Math.min(1, u);
      pts.push([p.x0 + (p.x1 - p.x0) * v + Math.sin(u * 8 + p.ph) * p.amp, p.y0 + (p.y1 - p.y0) * v, (7 - i * 0.26) * s]);
    }
    if (pts.length < 2) return;
    x.save();
    x.lineCap = 'round';
    // 体（しっぽ → あたま の じゅんに ふとく）。ふち → 体 → 光
    for (const [lw, col, al] of [[2.0, p.c0 || '#1a4a9a', 0.75], [1.6, p.c1 || '#5ab8ff', 0.9], [0.8, p.c2 || '#e6fbff', 0.95]]) {
      x.strokeStyle = col;
      for (let i = pts.length - 1; i > 0; i--) {
        x.globalAlpha = a * al * (0.4 + 0.6 * (1 - i / n));
        x.lineWidth = Math.max(0.6, pts[i][2] * lw);
        x.beginPath();
        x.moveTo(pts[i][0], pts[i][1]);
        x.lineTo(pts[i - 1][0], pts[i - 1][1]);
        x.stroke();
      }
    }
    // せなかの とげ
    x.fillStyle = p.c2 || '#e6fbff';
    for (let i = 2; i < pts.length - 1; i += 3) {
      const [ax, ay, r] = pts[i], [bx, by] = pts[i - 1];
      const ang = Math.atan2(by - ay, bx - ax) - Math.PI / 2;
      x.globalAlpha = a * 0.7;
      x.beginPath();
      x.moveTo(ax + Math.cos(ang) * r * 0.6, ay + Math.sin(ang) * r * 0.6);
      x.lineTo(ax + Math.cos(ang) * r * 1.5, ay + Math.sin(ang) * r * 1.5);
      x.lineTo(bx + Math.cos(ang) * r * 0.6, by + Math.sin(ang) * r * 0.6);
      x.fill();
    }
    // あたま（つの・あご・目）
    const [hx, hy] = pts[0], [px, py] = pts[1];
    const ang = Math.atan2(hy - py, hx - px);
    const c = Math.cos(ang), sn = Math.sin(ang);
    x.globalAlpha = a;
    x.fillStyle = p.c2 || '#e6fbff';
    x.beginPath();
    x.moveTo(hx + c * 10 * s, hy + sn * 10 * s);
    x.lineTo(hx - sn * 6 * s, hy + c * 6 * s);
    x.lineTo(hx + sn * 6 * s, hy - c * 6 * s);
    x.fill();
    x.strokeStyle = '#ffffff';
    x.lineWidth = 1.4;
    for (const d of [-1, 1]) {
      x.beginPath();
      x.moveTo(hx + d * sn * 3 * s, hy - d * c * 3 * s);
      x.lineTo(hx - c * 9 * s + d * sn * 7 * s, hy - sn * 9 * s - d * c * 7 * s);
      x.stroke();
    }
    x.fillStyle = '#ffe060';
    x.fillRect(Math.round(hx + c * 3 * s - 1), Math.round(hy + sn * 3 * s - 1), 2, 2);
    x.restore();
  },
  // よこ 一もんじの ばっ刀の 光（画面の はしから はしへ）
  j6draw(x, p, t) {
    const a = fadeOut(t, 0.3);
    if (a <= 0) return;
    const k = clamp01(p.age / (p.travel || 90));
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    const w = p.w || 256;
    x.fillStyle = p.glow || '#ffd0d8';
    x.fillRect(0, p.y - 3, w * k, 6);
    x.fillStyle = '#ffffff';
    x.fillRect(0, p.y - 1, w * k, 2);
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playJob6Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!SIG6.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  switch (anim) {
    case 'rurouni_sig': {
      // 竜つい閃: 上から 光が 落ちて ドン（地面が われ、石が とぶ）
      targets.forEach((t, ti) => {
        const d = ti * 70;
        fx.add({ kind: 'j6fall', x: t.x, y0: Math.max(-8, t.y - 70), y: t.y, travel: 60, life: 360, delay: d, glow: '#ff9a8a' });
        fx.bigCut(t.x, t.y, { ang: 1.45, color: '#ffffff', glow: '#ff8a7a', w: 3, delay: d + 40, life: 300 });
        fx.impact(t.x, t.y, { r: (crit ? 22 : 18) * sz, color: '#fff2e8', delay: d + 50 });
        fx.shock(t.x, t.y + 8, { r0: 4, r1: 46 * sz, color: '#ffd0b0', w: 2.5, delay: d + 60, life: 380, sy: 0.4 });
        fx.crack(t.x, t.y + 10, { n: 5, len: 24 * sz, delay: d + 60, life: 700 });
        fx.debris(t.x, t.y + 8, ['#8a6a4a', '#c8a878', '#5a4a3a'], all ? 6 : 10, d + 70, 110);
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ffb0a0', '#ffd66b'], n: all ? 10 : 16, speed: 160, delay: d + 60, life: 360, len: 8 });
        if (ti === 0) {
          fx.flashAt(60, '#ffffff', d + 40);
          fx.hitStop(crit ? 240 : 180, d + 60, 1.8);
        }
      });
      return true;
    }
    case 'hitokiri_sig': {
      // 竜巣閃: 夜の いろ → 赤と 白の 太刀すじが 何本も
      fx.tintAt('rgba(20, 8, 24, 0.45)', 1000);
      const n = all ? 14 : 12;
      for (let i = 0; i < n; i++) {
        const t = targets[i % targets.length];
        const d = 20 + i * 55;
        const ang = rnd(-1.4, 1.4);
        fx.cut(t.x + rnd(-6, 6), t.y + rnd(-6, 6), { ang, len: rnd(30, 42), w: 2, color: '#ffffff', glow: i % 2 ? '#ff4a5a' : '#c8b0ff', delay: d, life: 220, speed: 80 });
        fx.impact(t.x + rnd(-4, 4), t.y + rnd(-4, 4), { r: 9 * sz, color: i % 2 ? '#ffd0d8' : '#ffffff', delay: d + 10 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff4a5a'], n: 4, speed: 130, delay: d + 10, life: 260, len: 6 });
      }
      fx.flashAt(50, '#ffffff', 20);
      fx.hitStop(crit ? 220 : 160, 30, 1.2);
      // さいごに 赤い 十字
      for (const t of targets) {
        fx.bigCut(t.x, t.y, { ang: 0.78, color: '#ffffff', glow: '#ff3a4a', w: 2.5, delay: 20 + n * 55, life: 280 });
        fx.bigCut(t.x, t.y, { ang: -0.78, color: '#ffffff', glow: '#ff3a4a', w: 2.5, delay: 40 + n * 55, life: 280 });
      }
      return true;
    }
    case 'himura_sig': {
      // 九頭竜閃: 9つの 方向から いっせいに（上・下・左・右・ななめ 4つ・まん中の つき）
      fx.tintAt('rgba(30, 6, 14, 0.38)', 900);
      targets.forEach((t, ti) => {
        const d = ti * 60;
        for (let k = 0; k < 8; k++) {
          const ang = (k / 8) * Math.PI * 2 - Math.PI / 2;
          fx.add({ kind: 'j6ray', x: t.x, y: t.y, r: 56 * sz, ang, travel: 110, life: 320, delay: d, glow: k % 2 ? '#ff6a6a' : '#9ac8ff' });
        }
        fx.impact(t.x, t.y, { r: 10 * sz, color: '#ffffff', delay: d + 20 });
        fx.converge(t.x, t.y, { colors: ['#ffffff', '#ffb0b0'], n: 10, r: 40 * sz, delay: d, life: 120 });
        // あつまった ところで まん中の つき（9つめ）
        fx.impact(t.x, t.y, { r: (crit ? 26 : 22) * sz, color: '#fff0f0', delay: d + 120 });
        fx.shock(t.x, t.y, { r0: 6, r1: 50 * sz, color: '#ffc0c8', w: 3, delay: d + 120, life: 420 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#ff6a6a', '#9ac8ff'], n: 22, speed: 190, spread: Math.PI * 2, delay: d + 120, life: 420, len: 9 });
        for (let k = 0; k < 4; k++) fx.bigCut(t.x, t.y, { ang: (k * Math.PI) / 4, color: '#ffffff', glow: k % 2 ? '#ff6a6a' : '#9ac8ff', w: 2, delay: d + 130 + k * 25, life: 260 });
        if (ti === 0) {
          fx.flashAt(90, '#ffffff', d + 120);
          fx.hitStop(crit ? 300 : 240, d + 120, 2);
        }
      });
      return true;
    }
    case 'hiten_sig': {
      // 天かける竜のひらめき
      const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
      const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
      // 1) ばっ刀の 光（よこ 一もんじ）と 一の太刀
      fx.add({ kind: 'j6draw', x: 0, y: ty, w: W, travel: 70, life: 420, glow: '#ffd0e0' });
      fx.flashAt(80, '#ffffff', 0);
      targets.forEach((t, ti) => {
        fx.bigCut(t.x, t.y, { ang: 0.05, color: '#ffffff', glow: '#ffe0a0', w: 3, delay: 20 + ti * 20, life: 300 });
        fx.impact(t.x, t.y, { r: 16 * sz, color: '#ffffff', delay: 30 + ti * 20 });
      });
      // 2) まわりの 空気が すいこまれる（真空）
      for (const t of targets) fx.converge(t.x, t.y, { colors: ['#e6fbff', '#9ad8ff'], n: 14, r: 46 * sz, delay: 180, life: 320 });
      fx.gust(Math.max(0, tx - 70), ty, { len: 140, amp: 5, color: '#e6fbff', w: 1.4, delay: 160, life: 380 });
      // 3) 竜の 形の 風が 下から 空へ
      fx.add({ kind: 'j6dragon', x: tx, y: ty, x0: Math.max(20, tx - 60), y0: Math.min(H - 6, ty + 40), x1: Math.min(W - 20, tx + 50), y1: 14, amp: 18, ph: 0, travel: 700, life: 1100, delay: 300, s: 1.1 });
      fx.add({ kind: 'j6dragon', x: tx, y: ty, x0: Math.min(W - 20, tx + 60), y0: Math.min(H - 6, ty + 44), x1: Math.max(20, tx - 40), y1: 20, amp: 14, ph: 2, travel: 700, life: 1100, delay: 380, s: 0.8, c0: '#9a2a4a', c1: '#ff9ab8', c2: '#ffffff' });
      // 4) 二の太刀（大きな ✕）
      targets.forEach((t, ti) => {
        const d = 520 + ti * 40;
        fx.bigCut(t.x, t.y, { ang: 0.8, color: '#ffffff', glow: '#9ad8ff', w: 3.5, delay: d, life: 320 });
        fx.bigCut(t.x, t.y, { ang: -0.8, color: '#ffffff', glow: '#ffd040', w: 3.5, delay: d + 80, life: 320 });
        fx.impact(t.x, t.y, { r: (crit ? 26 : 22) * sz, color: '#f0f8ff', delay: d + 80 });
        fx.shock(t.x, t.y, { r0: 6, r1: 54 * sz, color: '#cfe8ff', w: 3, delay: d + 80, life: 420 });
        fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ad8ff', '#ffd040'], n: all ? 12 : 20, speed: 200, spread: Math.PI * 2, delay: d + 80, life: 420, len: 10 });
      });
      fx.flashAt(120, '#ffffff', 600);
      fx.hitStop(crit ? 320 : 260, 600, 2.2);
      for (let k = 0; k < 10; k++) fx.petal(rnd(10, W - 10), rnd(-10, 4), { color: k % 2 ? '#ffffff' : '#9ad8ff', vx: rnd(-20, 20), vy: rnd(30, 60), delay: 640 + k * 30, life: 800 });
      return true;
    }
  }
  return false;
}
