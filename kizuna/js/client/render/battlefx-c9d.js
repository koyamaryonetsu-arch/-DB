// 第3部 第1章 第4幕「星のはかば」の 魔物・あそびたい魔人 ムウ・スピカの 星のうた の 技の エフェクト
// （battlefx-c9b.js の playC9bFx の さいごに よばれる。ない anim なら false）
// 色: こだま＝水色と 黄、クモ＝白い 糸、ガ＝星の 光、ヤギ＝金の かね、ネコ＝黒と 黄色い 目、ムウ＝うす紫と ピンクと 星、おかし＝ピンクと クリーム
// 分かれる・起こす・おかしビーム・いっしょに ドーン・星のうた は がめんの まん中に 大きく（client/battle-c9d.js の C9D_SCREEN_ANIMS）
const ECHO = ['#bfe8ff', '#ffe680', '#ffffff'];
const WEB = ['#e8eef8', '#c8d0e0', '#ffffff'];
const STAR = ['#fff4a0', '#bfe8ff', '#ffffff'];
const BELL = ['#ffd040', '#fff0b0', '#c8901a'];
const SHADOW = ['#1c1a2e', '#34304e', '#ffe060'];
const MU = ['#c8b0f0', '#b4ecd8', '#ffe040', '#ffffff'];
const CANDY = ['#ff9ac0', '#fff0c8', '#ffd0e8', '#a8e8ff'];
const SONG = ['#fff6c8', '#bff4ff', '#ffe066', '#ffffff'];

function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d });
  }
  if (opts.stop) fx.hitStop(opts.stop, opts.delay || 0, 1.6);
}
// 音ぷ（星のうた・こだま）
function notes(fx, x, y, n, cols, delay = 0) {
  for (let k = 0; k < n; k++) fx.twinkle(x + (k - n / 2) * 10, y - (k % 2) * 8, { color: cols[k % cols.length], size: 5, life: 900, delay: delay + k * 90, spin: 1 });
}

export function playC9dFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── こだまのふたご ──
    case 'c9d_bump': hitEach(fx, targets, ECHO, { r: 16, stop: 100 }); return true;
    case 'c9d_echo': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.35, { r0: 6, r1: 80 + i * 30, color: i % 2 ? '#ffe680' : '#bfe8ff', w: 2, delay: i * 140, life: 700 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 14, color: '#bfe8ff', delay: 300 + i * 60 }); return true;
    case 'c9d_hum': for (const [i, t] of targets.entries()) notes(fx, t.x, t.y - 22, 2, ECHO, i * 70); return true;
    // ── 谷わたりグモ ──
    case 'c9d_bite': for (const t of targets) { fx.proj(t.x, t.y - 6, WEB, { size: 3, travel: 220, from: { x: t.x, y: 6 } }); fx.fang(t.x, t.y - 2, { color: '#ffffff', glow: '#c08a4a', size: 1.1, delay: 220 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 300 }); } fx.hitStop(100, 300, 1.4); return true;
    case 'c9d_web': for (const t of targets) { fx.swirl(t.x, t.y - 4, WEB, { n: 8, rad: 12, h: 14, life: 700, size: 1 }); fx.arrows(t.x, t.y - 8, '#c8d0e0', false, 3, 150); } return true;
    case 'c9d_swing': for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#e8eef8', n: 6, life: 260, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 140 + i * 50 }); } return true;
    // ── 星あかりのガ ──
    case 'c9d_wing': hitEach(fx, targets, STAR, { r: 16, stop: 90 }); return true;
    case 'c9d_dust': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 2) * 6, t.y - 30, { color: STAR[k % 3], vx: (k - 2) * 2, vy: 10, g: 20, size: 2, delay: i * 60 + k * 70, life: 900 }); return true;
    case 'c9d_mlight': fx.flashAt(0, 'rgba(255,246,200,0.35)', 500); for (const [i, t] of targets.entries()) { fx.twinkle(t.x, t.y - 14, { color: '#fff4a0', size: 6, life: 700, delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#bfe8ff', delay: 200 + i * 60 }); } return true;
    // ── つりばしヤギ ──
    case 'c9d_horn': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#ffd040', n: 6, life: 220 }); fx.impact(t.x, t.y, { r: 18, color: '#fff0b0', delay: 120 }); } fx.hitStop(110, 120, 1.5); return true;
    case 'c9d_bell': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.3, { r0: 6, r1: 120, color: BELL[i], w: 2, delay: i * 150, life: 800 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 14, color: '#fff0b0', delay: 300 + i * 60 }); return true;
    case 'c9d_jump': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 24, color: '#e8e0d0', w: 3, sy: 0.4, delay: i * 60 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 60 + i * 60 }); } fx.hitStop(110, 100, 1.5); return true;
    // ── かげぼうしネコ ──
    case 'c9d_kclaw': for (const t of targets) { fx.swirl(t.x, t.y - 4, SHADOW, { n: 6, rad: 10, h: 12, life: 400, size: 2 }); fx.impact(t.x, t.y, { r: 16, color: '#ffe060', delay: 200 }); } fx.hitStop(100, 200, 1.4); return true;
    case 'c9d_shadow': fx.tintAt('rgba(10,8,24,0.4)', 800); for (const t of targets) fx.arrows(t.x, t.y - 8, '#34304e', false, 3, 150); return true;
    case 'c9d_eyes': for (const t of targets) { fx.glow(t.x, t.y - 10, { color: '#ffe060', r: 20, life: 500, alpha: 0.6 }); fx.impact(t.x, t.y, { r: 18, color: '#ffe060', delay: 260 }); } fx.tintAt('rgba(10,8,24,0.35)', 700); return true;

    // ── あそびたい魔人 ムウ・ムウムウ ──
    case 'c9m_pat': for (const t of targets) { fx.proj(t.x, t.y - 6, MU, { size: 6, travel: 240, from: { x: t.x - 50, y: t.y - 30 } }); fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 240 }); } fx.hitStop(130, 240, 1.8); return true;
    case 'c9m_bounce': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#c8b0f0', w: 3, sy: 0.4, delay: i * 70 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 60 + i * 70 }); } fx.hitStop(120, 120, 1.6); return true;
    case 'c9m_yawn': fx.tintAt('rgba(120,100,180,0.25)', 1000); for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) fx.twinkle(t.x + (k - 1) * 8, t.y - 24, { color: k % 2 ? '#e8dcff' : '#ffffff', size: 4, life: 800, delay: i * 60 + k * 90 }); return true;
    case 'c9m_spin': for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.35, { r0: 8, r1: 140, color: MU[i], w: 3, delay: i * 120, life: 800 }); for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 16, color: '#e8dcff', delay: 300 + i * 60 }); fx.hitStop(130, 320, 1.6); return true;
    case 'c9m_split': {
      // ぽんっ！ 2つに 分かれる
      fx.flashAt(0, 'rgba(255,240,255,0.55)', 500);
      const c = first || mid;
      fx.shock(c.x, c.y, { r0: 6, r1: 90, color: '#b4ecd8', w: 3, life: 700 });
      fx.burst(c.x, c.y - 10, MU, 24, 70, { delay: 80 });
      for (let i = 0; i < 6; i++) fx.twinkle(W * (0.25 + i * 0.1), H * 0.25, { color: MU[i % 4], size: 5, life: 800, delay: 150 + i * 60, spin: 1 });
      return true;
    }
    case 'c9m_wake': {
      // おきて、おきて！ ゆさゆさ・星が はじける
      for (const t of targets) {
        fx.glow(t.x, t.y - 10, { color: '#ffe040', r: 30, life: 800, alpha: 0.5 });
        for (let k = 0; k < 5; k++) fx.twinkle(t.x + Math.cos(k * 1.26) * 24, t.y - 20 + Math.sin(k * 1.26) * 10, { color: '#fff4a0', size: 5, life: 800, delay: k * 80, spin: 1 });
        fx.arrows(t.x, t.y - 8, '#ff6a8a', true, 3, 100);
      }
      return true;
    }
    case 'c9m_beamup': for (const t of targets) { fx.glow(t.x, t.y - 30, { color: '#ffe040', r: 16, life: 900, alpha: 0.7 }); fx.twinkle(t.x, t.y - 34, { color: '#ffffff', size: 6, life: 900, spin: 1 }); } return true;
    case 'c9m_beam': {
      // おかしビーム: ピンクの 光の すじ → おかしの つぶ
      for (const t of targets) {
        for (let k = 0; k < 4; k++) fx.proj(t.x, t.y - 6, CANDY, { size: 4, travel: 280, delay: k * 60, from: { x: W * 0.5, y: H * 0.35 } });
        fx.burst(t.x, t.y - 6, CANDY, 18, 40, { delay: 340 });
        fx.glow(t.x, t.y - 6, { color: '#ff9ac0', r: 24, life: 800, alpha: 0.5, delay: 340 });
      }
      return true;
    }
    case 'c9m_doonup': fx.tintAt('rgba(200,120,200,0.25)', 1000); for (const t of targets) fx.glow(t.x, t.y - 8, { color: '#b4ecd8', r: 34, life: 1000, alpha: 0.5 }); return true;
    case 'c9m_doon': {
      fx.flashAt(0, 'rgba(255,240,255,0.7)', 500);
      fx.tintAt('rgba(160,80,180,0.4)', 1400);
      for (let i = 0; i < 4; i++) fx.shock(W * 0.5, H * 0.45, { r0: 10, r1: 170, color: MU[i], w: 4, delay: i * 110, life: 900 });
      for (const [i, t] of targets.entries()) { fx.burst(t.x, t.y - 6, MU, 14, 50, { delay: 220 + i * 60 }); fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 220 + i * 60 }); }
      fx.hitStop(220, 240, 2.4);
      return true;
    }

    // ── スピカの 星のうた: 音ぷと 星の 光が みんなを つつむ ──
    case 'c9d_song': {
      fx.flashAt(0, 'rgba(255,248,220,0.45)', 700);
      fx.tintAt('rgba(255,240,200,0.2)', 1500);
      for (let i = 0; i < 3; i++) fx.shock(W * 0.5, H * 0.6, { r0: 6, r1: 150, color: SONG[i], w: 2, delay: i * 180, life: 1000 });
      for (const [i, t] of targets.entries()) {
        notes(fx, t.x, t.y - 24, 3, SONG, 150 + i * 80);
        fx.glow(t.x, t.y - 6, { color: '#fff6c8', r: 22, life: 900, alpha: 0.5, delay: 200 + i * 80 });
      }
      return true;
    }
    default:
      void element; void opts; void mid;
      return false;
  }
}
