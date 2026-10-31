// 第2部 第7章 第1幕「緑の王国」の 手下の 魔物・ウツボきょうだい・オクタリア・ゲストの カリムの 技の エフェクト
// （battlefx-tokei6.js の playTokei6Fx の さいごに よばれる。ない anim なら false）
// 色: ノコノコ＝みどりの こうら、パックンフラワー＝赤い 花と 火の玉、トランプの兵＝白い カードと 赤い ハート、使いのカラス＝黒と みどりの 光、
//     ほうき＝バケツの 水、ゲッソー＝白と すみ、テレサ＝白と ピンクの べろ、水のようま＝青みどりの 水、のろいだま＝むらさきの のろい、
//     ウツボきょうだい＝黄みどりの うずしお、オクタリア＝むらさきの 水と 金の 声の たま・音ぷ、カリム＝みどりと 金の たて
// a7g_swirl（ふたごの大うずしお）は がめんいっぱいの 大きな うず（とくべつな つぶ c7whirl）→ 2ひきの かげが 回る → 大波。
// a7t_chorus（うばった声の大合唱）は 貝が ひらいて 金の 声の たまと 音ぷ（c7note）が がめんいっぱいに → むらさきの 音の わ。
// どちらも がめんの まん中に 大きく（client/battle-c7.js の C7_SCREEN_ANIMS）
const WATER = ['#7ad8e8', '#bff4ff', '#2a8aa8', '#ffffff'];
const EEL = ['#b8d860', '#e8f8a0', '#5a7a2a', '#ffe060'];
const WITCH = ['#8a4ac8', '#c89aff', '#3a1a5a', '#f0d080'];
const VOICE = ['#ffe890', '#fff6c8', '#f0c040', '#ffffff'];
const CARD = ['#ffffff', '#e83a4a', '#1a1a2a', '#f0d080'];
const CURSE = ['#8a3ab8', '#2a0a3a', '#d070ff', '#ff4a8a'];
const ROYAL = ['#5ac870', '#d8ffd0', '#f0d060', '#ffffff'];

// ───── とくべつな つぶ（battlefx.js の FINE に まざる。C7_FINE）─────
// c7whirl … 大きな うずしお（x・y・r。arms … うでの 数・spin … 回る 速さ・color・edge）
// c7note  … とんでいく 音ぷ（size・color。vx・vy で うごく）
function c7whirl(x, p, t) {
  const grow = Math.min(1, t * 3);
  const fade = t > 0.75 ? (1 - t) / 0.25 : 1;
  const r = p.r * (0.4 + 0.6 * grow);
  const rot = (p.age / 1000) * (p.spin || 7);
  const arms = p.arms || 4;
  x.save();
  x.globalCompositeOperation = 'source-over';
  // そこの くらい 水
  x.globalAlpha = 0.45 * fade;
  x.fillStyle = p.deep || '#0a3a4a';
  x.beginPath();
  x.ellipse(p.x, p.y, r, r * (p.sy || 0.45), 0, 0, Math.PI * 2);
  x.fill();
  // うでの すじ（外から 中へ まきこむ）
  x.lineCap = 'round';
  for (let k = 0; k < arms; k++) {
    x.strokeStyle = k % 2 ? p.edge || '#bff4ff' : p.color || '#7ad8e8';
    x.lineWidth = Math.max(1, r * 0.06);
    x.globalAlpha = 0.85 * fade;
    x.beginPath();
    for (let i = 0; i <= 22; i++) {
      const u = i / 22;
      const a = rot + (k / arms) * Math.PI * 2 + u * Math.PI * 2.2;
      const rr = r * (1 - u * 0.92);
      const px = p.x + Math.cos(a) * rr, py = p.y + Math.sin(a) * rr * (p.sy || 0.45);
      if (i) x.lineTo(px, py);
      else x.moveTo(px, py);
    }
    x.stroke();
  }
  // まん中の 白い あわ
  x.globalAlpha = 0.7 * fade;
  x.fillStyle = '#ffffff';
  x.beginPath();
  x.ellipse(p.x, p.y, r * 0.08, r * 0.08 * (p.sy || 0.45), 0, 0, Math.PI * 2);
  x.fill();
  x.restore();
}
function c7note(x, p, t) {
  const s = p.size || 3;
  x.globalAlpha = Math.max(0, 1 - t * t);
  x.fillStyle = p.color;
  x.strokeStyle = p.color;
  x.lineWidth = Math.max(1, s * 0.3);
  // たま
  x.beginPath();
  x.ellipse(p.x, p.y, s, s * 0.75, -0.4, 0, Math.PI * 2);
  x.fill();
  // ぼう と はた
  x.beginPath();
  x.moveTo(p.x + s * 0.9, p.y);
  x.lineTo(p.x + s * 0.9, p.y - s * 3);
  x.lineTo(p.x + s * 2, p.y - s * 2.2);
  x.stroke();
}
export const C7_FINE = { c7whirl, c7note };

// 音ぷを n こ（x・y から ふわっと 上へ・まわりへ）
function notes(fx, x, y, n, { colors = VOICE, speed = 50, delay = 0, life = 900, size = [2, 3.4], up = 30 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.8);
    fx.add({ kind: 'c7note', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up, color: colors[i % colors.length], size: size[0] + Math.random() * (size[1] - size[0]), life: life * (0.7 + Math.random() * 0.5), delay: delay + i * 25, add: true });
  }
}
// 水しぶき
function splash(fx, t, delay = 0, colors = WATER, n = 8) {
  for (let i = 0; i < n; i++) fx.drop(t.x + (Math.random() - 0.5) * 10, t.y - 4, { color: colors[i % colors.length], vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 60, size: 1.6, delay, life: 600 });
}

export function playC7Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  switch (anim) {
    // ── ノコノコ ──
    case 'a7_shell':
      for (const t of targets) {
        fx.speedLines(t.x, t.y, { color: '#7ad860', n: 10, life: 240 });
        fx.swirl(t.x, t.y - 6, ['#5ac850', '#f8f0d0', '#2a7a2a'], { n: 10, rad: 9, h: 10, life: 360 });
        fx.impact(t.x, t.y, { r: 20, color: '#d8ffb0', delay: 140 });
      }
      fx.hitStop(110, 140, 1.3);
      return true;
    // ── パックンフラワー ──
    case 'a7_chomp':
      for (const t of targets) {
        fx.fang(t.x, t.y - 4, { color: '#ffffff', glow: '#e83a3a', size: 1.2 });
        fx.impact(t.x, t.y, { r: 18, color: '#ffd0d0', delay: 160 });
      }
      fx.hitStop(110, 160, 1.3);
      return true;
    case 'a7_fireball':
      for (const t of targets) {
        fx.proj(t.x, t.y - 6, ['#ff8a2a', '#ffe060', '#ff4a2a'], { size: 4, travel: 260 });
        fx.burst(t.x, t.y - 6, ['#ff8a2a', '#ffe060', '#ff4a2a'], 14, 60, { delay: 260 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffd080', delay: 260 });
      }
      return true;
    // ── トランプの兵 ──
    case 'a7_spear':
      for (const t of targets) {
        fx.spear(t.x, t.y, { color: '#f0f0f0' });
        fx.twinkle(t.x, t.y - 10, { color: '#e83a4a', size: 6, delay: 120 });
        fx.impact(t.x, t.y, { r: 16, color: '#ffffff', delay: 120 });
      }
      return true;
    case 'a7_cards':
      for (const [i, t] of targets.entries()) {
        fx.speedLines(t.x, t.y, { color: '#ffffff', n: 8, life: 220, delay: i * 70 });
        fx.debris(t.x, t.y, CARD, 6, i * 70 + 80, 50);
        fx.impact(t.x, t.y, { r: 14, color: '#ffffff', delay: i * 70 + 80 });
      }
      return true;
    // ── 使いのカラス ──
    case 'a7_peck':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#1a1a2a', 2, { angs: [0.9, 2.2], len: 18, w: 2, glow: '#6ae080' });
        fx.impact(t.x, t.y, { r: 12, color: '#d0ffd8', delay: 120 });
        fx.impact(t.x, t.y, { r: 12, color: '#d0ffd8', delay: 240 });
      }
      return true;
    case 'a7_hex':
      for (const t of targets) {
        fx.glow(t.x, t.y - 4, { color: '#4ae070', r: 22, life: 560, alpha: 0.5 });
        fx.converge(t.x, t.y - 4, { colors: ['#6ae080', '#1a1a2a'], n: 12, r: 26, life: 380 });
        fx.impact(t.x, t.y, { r: 18, color: '#b0ffc0', delay: 380 });
      }
      return true;
    case 'a7_caw':
      fx.tintAt('rgba(20,30,20,0.25)', 700);
      for (const t of targets) {
        fx.swirl(t.x, t.y - 14, ['#1a1a2a', '#6ae080'], { n: 8, rad: 10, h: 12, life: 600 });
        fx.twinkle(t.x, t.y - 18, { color: '#6ae080', size: 5, life: 500 });
      }
      return true;
    // ── 行進のほうき ──
    case 'a7_bucket':
      for (const t of targets) {
        for (let i = 0; i < 10; i++) fx.drop(t.x - 14 + i * 3, t.y - 30, { color: WATER[i % 4], vx: 20, vy: 40, size: 2, delay: i * 15, life: 500 });
        fx.impact(t.x, t.y, { r: 20, color: '#bff4ff', delay: 260 });
        splash(fx, t, 280);
      }
      return true;
    case 'a7_sweep':
      for (const [i, t] of targets.entries()) {
        fx.gust(t.x - 30, t.y + 6, { len: 60, color: '#e8d8a8', w: 2, delay: i * 60 });
        fx.debris(t.x, t.y, ['#c8a060', '#8a6a3a', '#e8d8a8'], 5, i * 60 + 100, 40);
      }
      return true;
    // ── ゲッソー・オクタリアの すみ ──
    case 'a7_ink':
      fx.tintAt('rgba(10,10,20,0.35)', 800);
      for (const t of targets) {
        fx.puff(t.x, t.y - 4, { color: 'rgba(20,16,30,0.85)', r0: 4, r1: 22, life: 800 });
        fx.burst(t.x, t.y - 4, ['#1a1a2a', '#3a2a4a', '#000000'], 10, 40);
      }
      return true;
    // ── テレサ ──
    case 'a7_boo':
      for (const t of targets) {
        fx.flashAt(90, 'rgba(255,255,255,0.4)');
        fx.glow(t.x + 8, t.y - 8, { color: '#ffffff', r: 20, life: 400, alpha: 0.6 });
        fx.impact(t.x, t.y, { r: 22, color: '#ffffff', delay: 160 });
      }
      fx.hitStop(110, 160, 1.4);
      return true;
    case 'a7_tongue':
      for (const t of targets) {
        fx.lash?.(t.x - 20, t.y - 6, t.x, t.y, { color: '#ff7aa8' });
        fx.swirl(t.x, t.y - 12, ['#ff9ac0', '#ffffff'], { n: 8, rad: 8, h: 12, life: 500 });
      }
      return true;
    // ── 水のようま ──
    case 'a7_drain':
      for (const t of targets) {
        fx.converge(t.x, t.y - 6, { colors: ['#7ae8d8', '#ffffff'], n: 12, r: 20, life: 420 });
        fx.glow(t.x, t.y, { color: '#2ab8a8', r: 18, life: 500, alpha: 0.45 });
      }
      return true;
    case 'a7_mist':
      fx.tintAt('rgba(180,230,240,0.25)', 900);
      for (const t of targets) fx.puff(t.x, t.y - 4, { color: 'rgba(220,245,255,0.7)', r0: 6, r1: 24, life: 900 });
      return true;
    // ── のろいだま ──
    case 'a7_hands':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#d070ff', 3, { angs: [0.5, 2.6, 1.6], len: 20, w: 2, glow: '#2a0a3a' });
        for (let i = 0; i < 3; i++) fx.impact(t.x + (i - 1) * 6, t.y, { r: 12, color: '#e8c0ff', delay: 100 + i * 110 });
      }
      return true;
    case 'a7_eye':
      for (const t of targets) {
        fx.glow(t.x, t.y - 6, { color: '#ff4a8a', r: 16, life: 600, alpha: 0.6 });
        fx.twinkle(t.x, t.y - 10, { color: '#ff4a8a', size: 6, life: 500 });
      }
      return true;
    case 'a7_curse':
      fx.tintAt('rgba(40,10,60,0.35)', 900);
      for (const [i, t] of targets.entries()) {
        fx.swirl(t.x, t.y - 4, CURSE, { n: 14, rad: 12, h: 30, life: 700, delay: i * 50 });
        fx.impact(t.x, t.y, { r: 16, color: '#d070ff', delay: 300 + i * 50 });
      }
      return true;

    // ── ウツボきょうだい ──
    case 'a7g_spark':
      for (const t of targets) {
        fx.zap(t.x - 30, t.y - 40, t.x, t.y, { color: '#fff6b0', glow: '#b8d860', forks: 2 });
        fx.impact(t.x, t.y, { r: 22, color: '#f8ffb0', delay: 160 });
        fx.sparks(t.x, t.y, { colors: EEL, n: 10, delay: 160 });
      }
      fx.hitStop(110, 160, 1.4);
      return true;
    // ふたごの大うずしお: がめんいっぱいの うず → 大波
    case 'a7g_swirl': {
      const cx = W / 2, cy = H * 0.6;
      fx.tintAt('rgba(10,50,60,0.45)', 1700);
      fx.vignette?.('#2a8aa8', 1400, 0.5);
      fx.add({ kind: 'c7whirl', x: cx, y: cy, r: 110, arms: 5, spin: 8, color: '#7ad8e8', edge: '#e8f8a0', deep: '#06303a', sy: 0.42, life: 1500 });
      fx.swirl(cx, cy - 10, [...WATER, ...EEL], { n: 40, rad: 70, h: 30, life: 1100, size: 2 });
      for (let i = 0; i < 16; i++) fx.bubble(cx + (Math.random() - 0.5) * 180, cy + 10, { color: '#bff4ff', size: 1.5 + Math.random() * 2, vy: -50, delay: i * 40, life: 900 });
      fx.flashAt(140, 'rgba(200,255,255,0.5)', 900);
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 30, color: '#bff4ff', delay: 950 + i * 40 });
        splash(fx, t, 950 + i * 40, WATER, 10);
      }
      fx.hitStop(240, 950, 2.4);
      return true;
    }
    case 'a7g_call':
      for (const t of targets) {
        fx.pillar(t.x, t.y, '#7ad8e8', { w: 16, h: 70, life: 700, edge: '#e8f8a0' });
        for (let i = 0; i < 12; i++) fx.bubble(t.x + (Math.random() - 0.5) * 30, t.y + 6, { color: '#bff4ff', size: 2, vy: -60, delay: i * 30 });
        fx.burst(t.x, t.y - 10, EEL, 14, 50, { delay: 300 });
      }
      return true;

    // ── うずの魔女オクタリア ──
    case 'a7t_arms':
      for (const t of targets) {
        fx.slash(t.x, t.y, '#8a4ac8', 3, { angs: [0.4, 2.5, 1.4], len: 26, w: 3, glow: '#c89aff' });
        for (let i = 0; i < 3; i++) fx.impact(t.x + (i - 1) * 6, t.y, { r: 14, color: '#e8d0ff', delay: 100 + i * 110 });
      }
      fx.hitStop(110, 320, 1.4);
      return true;
    case 'a7t_contract':
      for (const t of targets) {
        fx.rune?.(t.x, t.y - 6, { color: '#f0d080' });
        fx.swirl(t.x, t.y - 2, ['#f0d080', '#fff6c8'], { n: 14, rad: 12, h: 26, life: 800 });
        fx.arrows(t.x, t.y - 8, '#c89aff', false, 3, 300);
      }
      return true;
    case 'a7t_trident':
      fx.flashAt(120, 'rgba(255,250,200,0.6)');
      for (const t of targets) {
        for (const dx of [-8, 0, 8]) fx.zap(t.x + dx, 0, t.x + dx / 2, t.y, { color: '#fff6b0', glow: '#c89aff', w: 1.6, forks: 1 });
        fx.impact(t.x, t.y, { r: 28, color: '#fff6c8', delay: 140 });
        fx.sparks(t.x, t.y, { colors: ['#fff6b0', '#c89aff', '#ffffff'], n: 14, delay: 140 });
      }
      fx.hitStop(160, 150, 2);
      return true;
    // 声うばいの歌: 音ぷが ねらわれた 人へ → 金の 声の たまが 魔女の 首へ（opts.from … 魔女・opts.shell … 貝）
    case 'a7t_steal': {
      fx.tintAt('rgba(60,20,80,0.3)', 1200);
      const to = opts.shell || opts.from || { x: W * 0.72, y: H * 0.35 };
      for (const t of targets) {
        notes(fx, t.x, t.y - 20, 8, { colors: WITCH, speed: 30, life: 700 });
        fx.glow(t.x, t.y - 8, { color: '#ffe890', r: 14, life: 500, alpha: 0.7, delay: 400 });
        fx.proj(to.x, to.y, VOICE, { size: 4, travel: 420, delay: 500, from: { x: t.x, y: t.y - 8 } });
        fx.twinkle(to.x, to.y, { color: '#ffe890', size: 8, delay: 920, life: 500 });
      }
      return true;
    }
    // うばった声の大合唱: 貝が ひらく → 金の 声と 音ぷが がめんいっぱい → むらさきの 音の わ
    case 'a7t_chorus': {
      const from = opts.shell || opts.from || { x: W * 0.7, y: H * 0.38 };
      fx.tintAt('rgba(50,10,70,0.5)', 1900);
      fx.vignette?.('#c89aff', 1500, 0.55);
      fx.glow(from.x, from.y, { color: '#ffe890', r: 30, life: 900, alpha: 0.8 });
      notes(fx, from.x, from.y, 26, { colors: [...VOICE, ...WITCH], speed: 120, life: 1300, size: [2.5, 4.5], up: 10 });
      for (let i = 0; i < 4; i++) fx.shock(W / 2, H * 0.45, { r0: 8, r1: 90 + i * 20, color: i % 2 ? '#ffe890' : '#c89aff', w: 2, delay: 600 + i * 150, life: 600 });
      fx.flashAt(160, 'rgba(255,240,200,0.55)', 900);
      for (const [i, t] of targets.entries()) {
        fx.impact(t.x, t.y, { r: 30, color: '#fff6c8', delay: 950 + i * 40 });
        notes(fx, t.x, t.y - 10, 5, { colors: WITCH, speed: 60, delay: 950 + i * 40, life: 600 });
      }
      fx.hitStop(240, 950, 2.4);
      return true;
    }

    // ── ゲストの カリム: 王家のたて ──
    case 'a7k_shield':
      for (const [i, t] of targets.entries()) {
        fx.glow(t.x, t.y - 4, { color: '#5ac870', r: 22, life: 700, alpha: 0.5, delay: i * 50 });
        fx.shock(t.x, t.y - 4, { r0: 4, r1: 22, color: '#f0d060', w: 2, delay: 120 + i * 50, life: 500 });
        fx.twinkle(t.x, t.y - 16, { color: '#f0d060', size: 6, delay: 200 + i * 50, life: 500 });
      }
      return true;
    default:
      return false;
  }
}
