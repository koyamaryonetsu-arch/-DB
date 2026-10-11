// 第27回の 新しい 職業「暴れんぼう将軍」の 看板の技「成敗！」の エフェクト
// anim の なまえは 技の id と おなじ（'abarenbo_shogun_sig'）。
// battlefx.js の play() で battlefx-jobs4.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 1) 白い 馬が 海辺の 波しぶきを あげて、がめんの 下を かけぬける
// 2) 夜の ような こい 青に なって、まとに 大きな ✕ の 太刀すじ（2回斬り）
// 3) 赤い はんこの 上に「成敗」の 大きな 文字。白と 赤の 紙ふぶき
// ・1.8びょう いないで おわる。あたる しゅんかんは すぐ（ダメージの 数字と ずれない）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const SIG5 = new Set(['abarenbo_shogun_sig']);
// たたかいの 音（client/battle.js の ANIM_SFX に まぜる）
export const JOB5_SFX = { abarenbo_shogun_sig: 'crit' };

// ───────────── こまかい つぶ（battlefx.js の FINE に まぜる。なまえは j5 で はじまる） ─────────────
export const JOB5_FINE = {
  // 白い 馬（ドットの かたまり。足が かわりばんこに 動く）。x0 → x1 へ はしる
  j5horse(x, p, t) {
    const k = clamp01(p.age / p.travel);
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y + Math.sin(p.age / 45) * 1.2;
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const s = p.s || 1, d = p.x1 > p.x0 ? 1 : -1;
    const R = (rx, ry, w, h, c) => { x.fillStyle = c; x.fillRect(Math.round(cx + d * rx * s - (d < 0 ? w * s : 0)), Math.round(cy + ry * s), Math.ceil(w * s), Math.ceil(h * s)); };
    x.save();
    x.globalAlpha = a;
    const ol = '#3a3a52', wh = '#f6f6fa', sh = '#c8c8da';
    const ph = Math.floor(p.age / 60) % 2;
    // 足（4本。ふたつずつ 前後に）
    for (const [lx, f] of [[-7, ph], [-4, 1 - ph], [4, ph], [7, 1 - ph]]) {
      R(lx - 0.5 + (f ? 1.5 : -1.5), 3, 2.6, 7, ol);
      R(lx + (f ? 1.5 : -1.5), 3, 1.6, 6.2, wh);
    }
    // どう
    R(-10, -4, 20, 9, ol);
    R(-9, -3, 18, 7, wh);
    R(-9, 2, 18, 2, sh);
    // くびと あたま
    R(7, -10, 6, 9, ol);
    R(8, -9, 4, 8, wh);
    R(9, -12, 8, 5, ol);
    R(10, -11, 6.5, 3.4, wh);
    x.fillStyle = '#1a1a26';
    x.fillRect(Math.round(cx + d * 13 * s), Math.round(cy - 10.6 * s), Math.ceil(s), Math.ceil(s));
    // たてがみと しっぽ（白っぽい 銀）
    R(6, -11, 2.4, 8, sh);
    R(-13, -3 + ph, 4, 2, sh);
    R(-14, -1 + ph, 2.6, 4, sh);
    // くら（赤）と 金の ふさ
    R(-4, -6, 8, 3, '#c8202c');
    R(-1, -3, 2, 3, '#f6d26c');
    x.restore();
  },
  // 赤い はんこの 上の「成敗」の 文字（ぽんと 大きく なって、ゆれる）
  j5seibai(x, p, t) {
    const a = fadeOut(t, 0.78);
    if (a <= 0) return;
    const sc = easeBack(clamp01(p.age / 180)) * (p.s || 1);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y + Math.sin(p.age / 120) * 1);
    x.rotate(-0.06);
    x.scale(sc, sc);
    // はんこ（赤い しかく・ふちは すこし かける）
    x.fillStyle = '#5a0a10';
    x.fillRect(-27, -16, 54, 32);
    x.fillStyle = '#d0202c';
    x.fillRect(-25, -14, 50, 28);
    x.fillStyle = '#5a0a10';
    x.fillRect(-25, -14, 3, 2);
    x.fillRect(20, 11, 5, 3);
    // 文字（ゲームの 字。ふちどり → 白）
    x.font = 'bold 22px KizunaRound, "Hiragino Maru Gothic ProN", sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.lineWidth = 4;
    x.strokeStyle = '#3a0408';
    x.strokeText('成敗', 0, 1);
    x.fillStyle = '#fff6e0';
    x.fillText('成敗', 0, 1);
    x.restore();
  },
  // 波しぶき（馬の あし元）
  j5splash(x, p, t) {
    const a = fadeOut(t, 0.4);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a * 0.9;
    x.fillStyle = p.c || '#e6fbff';
    const r = (p.r || 3) * (0.6 + 0.6 * t);
    x.beginPath();
    x.arc(p.x + (p.dx || 0) * t, p.y - Math.sin(t * Math.PI) * (p.h || 8), r, 0, Math.PI * 2);
    x.fill();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playJob5Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!SIG5.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  // 1) 白い 馬が 左から 右へ（波しぶき。太刀すじと いっしょに）
  const hy = H - 22;
  fx.add({ kind: 'j5horse', x0: -30, x1: W + 30, y: hy, x: 0, travel: 560, s: 1.8, life: 600 });
  for (let k = 0; k < 14; k++) {
    const sx = (k / 13) * W;
    fx.add({ kind: 'j5splash', x: sx, y: hy + 10, dx: rnd(-10, 10), h: rnd(6, 14), r: rnd(2, 3.6), c: k % 3 ? '#e6fbff' : '#9ad8ff', life: 420, delay: k * 36 });
  }
  fx.gust(-20, hy + 4, { len: W + 40, amp: 3, color: '#e6fbff', w: 1.2, delay: 60, life: 520 });
  // 2) こい 青の 夜の いろ → ✕ の 太刀すじ（2回斬り）
  fx.tintAt('rgba(10, 16, 48, 0.42)', 1100);
  const d0 = 40;
  targets.forEach((t, ti) => {
    const d = d0 + ti * (all ? 60 : 0);
    fx.bigCut(t.x, t.y, { ang: 0.75, color: '#ffffff', glow: '#9ac8ff', w: 3, delay: d, life: 300 });
    fx.bigCut(t.x, t.y, { ang: -0.75, color: '#ffffff', glow: '#ffd040', w: 3, delay: d + 170, life: 300 });
    fx.impact(t.x, t.y, { r: (crit ? 22 : 17) * sz, color: '#f0f6ff', delay: d + 10 });
    fx.impact(t.x, t.y, { r: (crit ? 22 : 17) * sz, color: '#fff6c0', delay: d + 180 });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', '#9ac8ff', '#ffd040'], n: all ? 12 : 18, speed: 170, delay: d + 180, life: 380, len: 9 });
    fx.shock(t.x, t.y, { r0: 6, r1: 44 * sz, color: '#cfe4ff', w: 2.5, delay: d + 180, life: 380 });
    if (ti === 0) {
      fx.flashAt(70, '#ffffff', d);
      fx.hitStop(crit ? 260 : 200, d + 180, 1.6);
    }
  });
  // 3) 「成敗」の はんこ と 紙ふぶき
  const ty = Math.max(24, Math.min(...targets.map((t) => t.y)) - 34);
  const tx = Math.min(W - 34, Math.max(34, targets.reduce((s, t) => s + t.x, 0) / targets.length));
  fx.add({ kind: 'j5seibai', x: tx, y: ty, s: 1, life: 1100, delay: d0 + 300 });
  for (let k = 0; k < 18; k++) fx.petal(rnd(0, W), rnd(-16, -2), { color: k % 2 ? '#ffffff' : '#e8303a', vx: rnd(-20, 20), vy: rnd(30, 60), delay: d0 + 340 + k * 22, life: 900 });
  return true;
}
