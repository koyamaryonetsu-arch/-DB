// 第2部 第8章 第4幕「時のはざま」の 手下の 魔物・時の門番フリーゾン・心の ためし・ソリトゥス・かけつけ の 技の エフェクト
// （battlefx-c8c.js の playC8cFx の さいごに よばれる。ない anim なら false）
// 色: 時の すな＝こがね、時のたましい＝むらさきの 火、フリーゾン＝白い 光と むらさき、ソリトゥス＝闇と 星の 光、千年の約束＝4つの 紋章の 色
// c8g_orb（時の大玉）は 大きな 光の 玉（とくべつな つぶ c8rorb）が ゆっくり おちて はじける。
// c8s_promise（千年の約束）は 4つの 紋章（とくべつな つぶ c8rcrest）が まわって 1つの 光の 柱に なる。
// 大玉・最終形態・くらい心の あらし・星の なみだ・時の くずれ・千年の約束・大風・影の 大剣は がめんの まん中に 大きく（client/battle-c8r.js の C8R_SCREEN_ANIMS）
const SAND = ['#f0d070', '#fff4c0', '#c89a4a', '#ffffff'];
const SOUL = ['#b06af0', '#e0c0ff', '#6a2aa8', '#ffffff'];
const FZL = ['#fff6a0', '#ffffff', '#d8a8f0', '#9a4ac8'];
const DARK = ['#3a2a60', '#8a4ae0', '#1a1030', '#c8a0ff'];
const STAR = ['#fff4c0', '#ffffff', '#e8c870', '#9ae0ff'];
const GREEN = ['#4a9a5a', '#8ad08a', '#e8e0a0'];
const WIND = ['#9a8ac0', '#d0c8f0', '#5a4a80'];
const CREST = ['#f0d070', '#4ab8ff', '#c8c8d8', '#bfefff'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。battlefx-c8c.js の C8C_FINE から）─────
// c8rorb   … x・y で ふくらむ 光の 玉（size … 大きさ）
// c8rcrest … x・y で 回る 紋章（n … 0〜3 の 色・size）
function c8rorb(x, p, t) {
  const s = (p.size || 20) * Math.min(1, 0.3 + t * 1.4);
  x.save();
  x.globalAlpha = t > 0.85 ? (1 - t) / 0.15 : 0.95;
  const g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, s);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, '#fff6a0');
  g.addColorStop(1, 'rgba(216,168,240,0)');
  x.fillStyle = g;
  x.beginPath();
  x.arc(p.x, p.y, s, 0, Math.PI * 2);
  x.fill();
  x.restore();
}
function c8rcrest(x, p, t) {
  const s = (p.size || 7) * (t < 0.2 ? t / 0.2 : 1);
  x.save();
  x.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
  x.translate(p.x, p.y);
  x.rotate((p.age || 0) / 200);
  x.fillStyle = CREST[(p.n || 0) % 4];
  x.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const r = i % 2 ? s * 0.45 : s;
    x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  x.closePath();
  x.fill();
  x.fillStyle = '#ffffff';
  x.fillRect(-1, -1, 2, 2);
  x.restore();
}
export const C8R_FINE = { c8rorb, c8rcrest };

// 1人ずつの ふつうの 当たり（色・大きさ）
function hitEach(fx, targets, cols, opts = {}) {
  for (const [i, t] of targets.entries()) {
    const d = (opts.delay || 0) + i * (opts.step ?? 50);
    if (opts.from) fx.proj(t.x, t.y - 6, cols, { size: opts.size || 5, travel: opts.travel || 280, delay: d, from: opts.from(t) });
    fx.burst(t.x, t.y - 6, cols, opts.n || 10, opts.spread || 40, { delay: d + (opts.from ? (opts.travel || 280) : 0) });
    fx.impact(t.x, t.y, { r: opts.r || 16, color: cols[1], delay: d + (opts.from ? (opts.travel || 280) : 0) });
  }
  if (opts.stop) fx.hitStop(opts.stop, (opts.delay || 0) + (opts.from ? opts.travel || 280 : 0), 1.6);
}
function buffEach(fx, targets, col, upward = true) {
  for (const t of targets) {
    fx.glow(t.x, t.y - 6, { color: col, r: 20, life: 600, alpha: 0.5 });
    fx.arrows(t.x, t.y - 8, col, upward, 3, 100);
  }
}

export function playC8rFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  const first = targets[0];
  const mid = { x: W / 2, y: H * 0.4 };
  switch (anim) {
    // ── 時のたましい ──
    case 'c8rn_flame': hitEach(fx, targets, SOUL, { from: (t) => ({ x: t.x + 30, y: t.y - 30 }), r: 18, stop: 100 }); return true;
    case 'c8rn_slow': for (const t of targets) { fx.swirl(t.x, t.y - 6, SOUL, { n: 8, rad: 12, h: 20, life: 700, size: 1.4 }); fx.arrows(t.x, t.y - 8, '#b06af0', false, 3, 120); } return true;
    case 'c8rn_drain': for (const t of targets) { fx.burst(t.x, t.y - 6, SOUL, 10, 30); fx.converge(t.x, t.y - 30, { colors: SOUL, n: 10, r: 24, life: 500, delay: 200 }); } return true;
    // ── 時かげスカラベ ──
    case 'c8rn_bite': for (const t of targets) { for (let i = 0; i < 2; i++) fx.fang(t.x + (i ? 4 : -4), t.y - 4, { color: '#f0d070', glow: '#c89a4a', size: 1, delay: i * 120 }); fx.impact(t.x, t.y, { r: 16, color: '#fff4c0', delay: 240 }); } fx.hitStop(110, 240, 1.4); return true;
    case 'c8rn_sand': fx.tintAt('rgba(120,90,30,0.3)', 900); for (const [i, t] of targets.entries()) fx.debris(t.x, t.y - 4, SAND, 6, 40, 20 + i * 40); return true;
    case 'c8rn_rewind': for (const t of targets) { fx.swirl(t.x, t.y - 8, SAND, { n: 12, rad: 16, h: 24, life: 800, size: 1.6 }); fx.glow(t.x, t.y - 6, { color: '#8ad08a', r: 20, life: 700, alpha: 0.5 }); } return true;
    // ── 時くいガ ──
    case 'c8rn_powder': for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.twinkle(t.x + (k - 1.5) * 6, t.y - 20, { color: '#ffe8a0', size: 4, life: 800, delay: i * 60 + k * 70, spin: 1 }); return true;
    case 'c8rn_gnaw': hitEach(fx, targets, SAND, { r: 14, stop: 90 }); return true;
    case 'c8rn_flutter': fx.tintAt('rgba(150,130,200,0.25)', 700); for (const [i, t] of targets.entries()) { fx.speedLines(t.x, t.y, { color: '#d0c8f0', n: 8, life: 300, delay: i * 50 }); fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: 200 + i * 50 }); } return true;
    // ── チクタクワニ ──
    case 'c8rn_chomp': for (const t of targets) { for (let i = 0; i < 3; i++) fx.fang(t.x + (i - 1) * 5, t.y - 4, { color: '#ffffff', glow: '#4a9a5a', size: 1.1, delay: i * 90 }); fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 280 }); } fx.hitStop(150, 280, 2); return true;
    case 'c8rn_tick': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#f0d070', r: 22, life: 700, alpha: 0.5 }); for (let i = 0; i < 2; i++) fx.twinkle(t.x + (i ? 10 : -10), t.y - 30, { color: '#f0d070', size: 5, life: 600, delay: i * 250 }); } return true;
    case 'c8rn_tail': for (const [i, t] of targets.entries()) { fx.shock(t.x, t.y + 4, { r0: 4, r1: 26, color: '#8ad08a', w: 2, sy: 0.4, delay: i * 60 }); fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 60 + i * 60 }); } return true;
    // ── すなどけいの騎士 ──
    case 'c8rn_slash': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#f0d070', n: 6, life: 260 }); fx.debris(t.x, t.y, SAND, 6, 30, 120); fx.impact(t.x, t.y, { r: 22, color: '#fff4c0', delay: 120 }); } fx.hitStop(140, 120, 1.8); return true;
    case 'c8rn_flow': fx.tintAt('rgba(100,70,20,0.35)', 1000); for (const [i, t] of targets.entries()) for (let k = 0; k < 4; k++) fx.drop(t.x + (k - 1.5) * 5, t.y - 40, { color: SAND[k % 3], vy: 50, g: 200, size: 2, delay: i * 60 + k * 40, life: 600 }); return true;
    case 'c8rn_turn': buffEach(fx, targets, '#f0d070'); return true;

    // ── 時の門番フリーゾン ──
    case 'c8g_finger': {
      const from = opts.from || { x: W * 0.62, y: H * 0.28 };
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, FZL, { size: 3, travel: 160, from });
        fx.pillar(t.x, t.y + 6, '#fff6a0', { w: 6, h: 40, life: 400, delay: 160, edge: '#ffffff' });
        fx.impact(t.x, t.y, { r: 18, color: '#ffffff', delay: 170 });
      }
      fx.hitStop(120, 170, 1.6);
      return true;
    }
    case 'c8g_tail': hitEach(fx, targets, ['#f4f0f8', '#ffffff', '#c8c0d8'], { r: 18, stop: 110 }); return true;
    case 'c8g_horn': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#f4f0f8', n: 10, life: 300 }); fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 200 }); } fx.hitStop(150, 200, 2); return true;
    case 'c8g_glare': fx.tintAt('rgba(90,30,120,0.3)', 800); for (const t of targets) fx.arrows(t.x, t.y - 8, '#d8a8f0', false, 3, 150); return true;
    case 'c8g_barrage': {
      fx.tintAt('rgba(255,250,200,0.25)', 900);
      for (const [i, t] of targets.entries()) for (let k = 0; k < 3; k++) {
        fx.proj(t.x + (k - 1) * 4, t.y - 4, FZL, { size: 2, travel: 220, delay: i * 50 + k * 60, from: { x: W * 0.6, y: H * 0.25 } });
        fx.impact(t.x, t.y, { r: 10, color: '#ffffff', delay: 220 + i * 50 + k * 60 });
      }
      return true;
    }
    // 時の大玉: 指先で ふくらんだ 光の 玉が ゆっくり おちて はじける
    case 'c8g_orb': {
      fx.tintAt('rgba(40,10,60,0.6)', 2400);
      fx.vignette?.('#9a4ac8', 1800, 0.55);
      fx.converge(mid.x, mid.y - 30, { colors: FZL, n: 26, r: 60, life: 700 });
      fx.add({ kind: 'c8rorb', x: mid.x, y: mid.y - 30, size: 34, life: 1300 });
      fx.proj(mid.x, H * 0.8, FZL, { size: 22, travel: 700, delay: 700, from: { x: mid.x, y: mid.y - 30 } });
      fx.shock(mid.x, H * 0.8, { r0: 10, r1: 190, color: '#fff6a0', w: 5, sy: 0.35, delay: 1400, life: 800 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 30, color: '#ffffff', delay: 1420 + i * 50 });
      fx.flashAt(1400, 'rgba(255,250,220,0.75)', 700);
      fx.hitStop(300, 1420, 3.2);
      return true;
    }
    case 'c8g_orbfail': {
      const c = first || mid;
      for (let i = 0; i < 10; i++) fx.drop(c.x, c.y - 40, { color: FZL[i % 3], vx: (i - 5) * 12, vy: -20, g: 140, size: 2, delay: i * 30, life: 700 });
      fx.glow(c.x, c.y - 40, { color: '#fff6a0', r: 26, life: 600, alpha: 0.5 });
      return true;
    }
    // さいごの すがた: まぶしい 光の 柱と 白い しんじゅの つぶ
    case 'c8g_final': {
      const c = first || mid;
      fx.tintAt('rgba(30,0,50,0.65)', 2200);
      fx.vignette?.('#d8a8f0', 1700, 0.5);
      fx.converge(c.x, c.y - 10, { colors: FZL, n: 30, r: 70, life: 800 });
      fx.pillar(c.x, c.y + 20, '#f4f0f8', { w: 56, h: 150, life: 1200, delay: 700, edge: '#d8a8f0' });
      fx.burst(c.x, c.y - 20, FZL, 34, 130, { delay: 1000 });
      fx.flashAt(240, 'rgba(255,255,255,0.75)', 1000);
      fx.hitStop(260, 1000, 3);
      return true;
    }
    case 'c8g_leave': {
      const c = first || mid;
      fx.swirl(c.x, c.y - 10, ['#d8a8f0', '#ffffff', '#9a4ac8'], { n: 18, rad: 30, h: 50, life: 1000, size: 2 });
      fx.glow(c.x, c.y - 10, { color: '#c8a8ff', r: 40, life: 900, alpha: 0.5 });
      return true;
    }

    // ── 守りぬく ──
    case 'c8t_breeze': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#d0c8f0', n: 8, life: 300 }); fx.impact(t.x, t.y, { r: 12, color: '#d0c8f0', delay: 160 }); } return true;
    case 'c8t_gust': {
      fx.tintAt('rgba(40,30,80,0.55)', 1600);
      for (let i = 0; i < 18; i++) fx.drop(0, H * (0.2 + (i % 6) * 0.1), { color: WIND[i % 3], vx: 260, vy: 0, g: 0, size: 2, delay: i * 40, life: 900 });
      for (const t of targets) { fx.swirl(t.x, t.y - 8, WIND, { n: 14, rad: 18, h: 28, life: 900, size: 2, delay: 400 }); fx.impact(t.x, t.y, { r: 22, color: '#d0c8f0', delay: 700 }); }
      fx.hitStop(200, 700, 2.2);
      return true;
    }
    case 'c8t_puff': for (const t of targets) { fx.puff(t.x, t.y - 20, { color: 'rgba(200,190,240,0.7)', r0: 4, r1: 18, life: 600 }); fx.impact(t.x, t.y, { r: 12, color: '#ffffff', delay: 300 }); } return true;
    case 'c8t_dawn': fx.flashAt(0, 'rgba(255,240,200,0.6)', 1400); fx.tintAt('rgba(255,210,140,0.35)', 1600); return true;

    // ── 一騎うち ──
    case 'c8d_slash': for (const t of targets) { fx.speedLines(t.x, t.y, { color: '#5a4a7a', n: 8, life: 300 }); fx.impact(t.x, t.y, { r: 20, color: '#c8b8e8', delay: 160 }); } fx.hitStop(130, 160, 1.6); return true;
    case 'c8d_big': {
      fx.tintAt('rgba(20,10,40,0.55)', 1300);
      for (const t of targets) { fx.pillar(t.x, t.y + 6, '#3a2a60', { w: 20, h: 90, life: 600, delay: 400, edge: '#c8a0ff' }); fx.impact(t.x, t.y, { r: 30, color: '#ffffff', delay: 450 }); }
      fx.hitStop(240, 450, 2.6);
      return true;
    }
    case 'c8d_mock': fx.tintAt('rgba(30,20,50,0.35)', 700); for (const t of targets) fx.arrows(t.x, t.y - 8, '#8a6ab0', false, 3, 150); return true;
    case 'c8d_cheer': for (const t of targets) { for (let i = 0; i < 4; i++) fx.twinkle(t.x + (i - 1.5) * 8, t.y - 24, { color: CREST[i], size: 4, life: 700, delay: i * 80 }); fx.glow(t.x, t.y - 6, { color: '#ffe06a', r: 22, life: 600, alpha: 0.45 }); } return true;

    // ── ソリトゥス ──
    case 'c8s_greed': fx.tintAt('rgba(20,60,30,0.4)', 900); for (const [i, t] of targets.entries()) fx.swirl(t.x, t.y - 6, ['#6ad0a0', '#2a6a4a', '#c8ffe0'], { n: 8, rad: 12, h: 20, life: 700, size: 1.4, delay: i * 60 }); return true;
    case 'c8s_anger': fx.tintAt('rgba(0,30,90,0.45)', 1000); for (const [i, t] of targets.entries()) fx.pillar(t.x, t.y + 6, '#4ab8ff', { w: 14, h: 50, life: 600, delay: 200 + i * 50, edge: '#bfefff' }); return true;
    case 'c8s_hoard': {
      fx.proj(W * 0.5, H * 0.5, ['#ffb040', '#3a8a3a', '#ffffff'], { size: 16, travel: 450, from: { x: W * 0.5, y: -20 } });
      fx.shock(W / 2, H * 0.82, { r0: 10, r1: 160, color: '#ffb040', w: 4, sy: 0.3, delay: 450, life: 700 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 470 + i * 50 });
      fx.hitStop(220, 470, 2.4);
      return true;
    }
    case 'c8s_scorn': case 'c8s_comet': {
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, anim === 'c8s_comet' ? STAR : FZL, { size: 6, travel: 400, from: { x: t.x - 60, y: -10 } });
        fx.pillar(t.x, t.y + 6, anim === 'c8s_comet' ? '#fff4c0' : '#fff6a0', { w: 12, h: 60, life: 500, delay: 400, edge: '#ffffff' });
        fx.impact(t.x, t.y, { r: 24, color: '#ffffff', delay: 420 });
      }
      fx.hitStop(160, 420, 2);
      return true;
    }
    case 'c8s_claw': hitEach(fx, targets, DARK, { r: 20, stop: 120 }); return true;
    case 'c8s_big': case 'c8s_harden': {
      fx.tintAt('rgba(10,0,30,0.65)', 2000);
      fx.vignette?.('#3a2a60', 1600, 0.6);
      const cols = ['#6ad0a0', '#ff6a5a', '#ffb040', '#a0a0ff'];
      for (let i = 0; i < 4; i++) fx.swirl(mid.x + (i - 1.5) * 30, mid.y, [cols[i], '#ffffff', '#1a1030'], { n: 10, rad: 18, h: 30, life: 1000, size: 2, delay: i * 120 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 26, color: '#c8a0ff', delay: 900 + i * 60 });
      fx.flashAt(900, 'rgba(160,120,255,0.5)', 600);
      fx.hitStop(240, 920, 2.6);
      return true;
    }
    case 'c8s_shell': for (const t of targets) { fx.shock(t.x, t.y, { r0: 6, r1: 40, color: '#8ad08a', w: 3, life: 500 }); fx.glow(t.x, t.y - 6, { color: '#3a8a3a', r: 30, life: 600, alpha: 0.5 }); } return true;
    case 'c8s_bound': for (const t of targets) fx.swirl(t.x, t.y - 10, ['#6ad0a0', '#2a6a4a', '#f0d070'], { n: 14, rad: 26, h: 50, life: 900, size: 2 }); return true;
    case 'c8s_alone': {
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#1a1030', r: 30, life: 1000, alpha: 0.7 });
        fx.converge(t.x, t.y - 6, { colors: DARK, n: 16, r: 36, life: 700 });
      }
      return true;
    }
    case 'c8s_tear': {
      fx.tintAt('rgba(0,20,60,0.6)', 2000);
      fx.vignette?.('#9ae0ff', 1600, 0.5);
      for (let i = 0; i < 22; i++) fx.drop(W * (i / 22), -4, { color: i % 2 ? '#9ae0ff' : '#ffffff', vy: 110, g: 160, size: 2.2, delay: 400 + i * 30, life: 900 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 24, color: '#9ae0ff', delay: 1100 + i * 50 });
      fx.hitStop(240, 1100, 2.6);
      return true;
    }
    case 'c8s_crack': {
      fx.tintAt('rgba(20,0,30,0.6)', 2000);
      fx.vignette?.('#c8a0ff', 1600, 0.6);
      for (let i = 0; i < 16; i++) fx.drop(W * (0.1 + (i % 8) * 0.11), -6, { color: DARK[i % 4], vx: (i % 3 - 1) * 20, vy: 80, g: 260, size: 3, delay: 300 + i * 40, life: 900 });
      fx.shock(W / 2, H * 0.6, { r0: 10, r1: 170, color: '#c8a0ff', w: 4, delay: 800, life: 700 });
      for (const [i, t] of targets.entries()) fx.impact(t.x, t.y, { r: 26, color: '#ffffff', delay: 900 + i * 60 });
      fx.hitStop(260, 920, 3);
      return true;
    }
    case 'c8s_call': {
      const c = first || mid;
      for (let i = 0; i < 3; i++) fx.shock(c.x, c.y - 10, { r0: 6, r1: 50 + i * 12, color: '#fff4c0', w: 2, delay: i * 180, life: 600 });
      fx.burst(c.x, c.y - 10, STAR, 16, 60, { delay: 500 });
      return true;
    }
    // 千年の約束: 4つの 紋章が まわって、1つの 光の 柱に
    case 'c8s_promise': {
      const c = first || mid;
      fx.tintAt('rgba(255,240,200,0.25)', 2600);
      fx.vignette?.('#fff4c0', 2200, 0.4);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        fx.add({ kind: 'c8rcrest', x: c.x + Math.cos(a) * 46, y: c.y - 10 + Math.sin(a) * 22, n: i, size: 9, life: 1600 });
      }
      fx.converge(c.x, c.y - 10, { colors: CREST, n: 40, r: 80, life: 900, delay: 600 });
      fx.pillar(c.x, c.y + 20, '#fff4c0', { w: 70, h: 160, life: 1400, delay: 1300, edge: '#ffffff' });
      fx.burst(c.x, c.y - 20, STAR, 50, 160, { delay: 1500 });
      fx.flashAt(1400, 'rgba(255,255,240,0.85)', 900);
      fx.hitStop(320, 1500, 3.4);
      return true;
    }
    // ── かけつけ ──
    case 'c8r_help_guard': buffEach(fx, targets, '#c8c8d8'); return true;
    case 'c8r_help_power': buffEach(fx, targets, '#ff8a4a'); return true;
    case 'c8r_help_heal': for (const t of targets) { fx.glow(t.x, t.y - 6, { color: '#8ad08a', r: 20, life: 700, alpha: 0.5 }); fx.twinkle(t.x, t.y - 26, { color: '#bfefff', size: 5, life: 700 }); } return true;
    case 'c8r_help_mp': for (const t of targets) fx.glow(t.x, t.y - 6, { color: '#6ab8ff', r: 20, life: 700, alpha: 0.5 }); return true;
    case 'c8r_help_hit': hitEach(fx, targets, CREST, { from: (t) => ({ x: t.x - 70, y: t.y + 10 }), r: 26, n: 16, stop: 160 }); return true;
    default:
      void element; void GREEN; void SAND;
      return false;
  }
}
