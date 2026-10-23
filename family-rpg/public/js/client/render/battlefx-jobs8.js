// 第40回の 新しい 伝説の 職業 2つの 技の エフェクト（竜魔人・ネオ・クイーン・セレニティ）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'ryumajin_sig'）。
// battlefx.js の play() で battlefx-jobs7.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（なまえは '<職業の id>_sig'）
//  ryumajin_sig   竜魔人 … 画面が くらく なり、両手の 竜の紋章が 光る → 竜闘気が 手もとに 集まる → 水色と 白の 大きな 光の 波動が 敵を のみこむ → 大爆発
//  neo_queen_sig  ネオ・クイーン・セレニティ … 夜空に 大きな 月 → 銀水しょうが 光る → 下から クリスタルの 城が たち上がる → 銀色の 光が ふりそそぎ、みかたにも 光
// ほかの 技
//  r40_crest       両手の 竜の紋章が かがやく（みかた。自分）
//  r40_magic_sword いなずまが 剣に おちて、そのまま 切りおろす（魔法剣）
//  r40_aura_guard  竜闘気の 水色の わが 仲間を つつむ（みかた）
//  r40_crystal     銀水しょうから まっすぐな 銀色の 光
//  r40_barrier     クリスタルの 六角の かべが 仲間を つつむ（みかた）
//  r40_queen_heal  月の 光と 白い はねが ふりそそぐ（みかた）
// 男の子の ネオ・クイーン・セレニティ（キング・エンディミオン。技の データの masc.anim。shared/ability-label.js）
//  r40_king_sig    大地から 金色の 光 → 黄金の クリスタルが かがやき、金の 光の 柱が 敵に おちる → 赤い バラの 花びら
// ・どれも 2.2びょう いないで おわる。あたる じかんは JOB8_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS8）は、battle.js が がめんの 下の まん中に 出す
// ・三日月（j7moon）・光の すじ（j7shaft）・光線（j7beam）・バラ（j7rose）は battlefx-jobs7.js の つぶを つかう

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R40_SIG_JOBS = ['ryumajin', 'neo_queen'];
export const R40_SIGS = R40_SIG_JOBS.map((j) => `${j}_sig`);
export const R40_MOVES = ['r40_crest', 'r40_magic_sword', 'r40_aura_guard', 'r40_crystal', 'r40_barrier', 'r40_queen_heal', 'r40_king_sig'];
export const R40_ANIMS = new Set([...R40_SIGS, ...R40_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS8 = new Set(['r40_crest', 'r40_aura_guard', 'r40_barrier', 'r40_queen_heal']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const JOB8_HIT = {
  ryumajin_sig: 760, neo_queen_sig: 720, r40_king_sig: 700, r40_magic_sword: 420, r40_crystal: 260,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r33.js に ある 音）
export const JOB8_SFX = {
  ryumajin_sig: 'blast', neo_queen_sig: 'r33_moon', r40_king_sig: 'r33_moon', r40_crest: 'kirari', r40_magic_sword: 'thunder',
  r40_aura_guard: 'buff', r40_crystal: 'sparkle', r40_barrier: 'buff', r40_queen_heal: 'heal',
};

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// 竜の紋章（金の つばさが 上に ひらき、まん中に 赤い 石）。s: 大きさ
function crestShape(x, s) {
  x.beginPath();
  x.moveTo(0, 7 * s);
  x.lineTo(-2.4 * s, 2 * s); x.lineTo(-7 * s, -1 * s); x.lineTo(-8 * s, -7 * s); x.lineTo(-4.2 * s, -2.6 * s);
  x.lineTo(-1.6 * s, -4 * s); x.lineTo(0, -8 * s); x.lineTo(1.6 * s, -4 * s); x.lineTo(4.2 * s, -2.6 * s);
  x.lineTo(8 * s, -7 * s); x.lineTo(7 * s, -1 * s); x.lineTo(2.4 * s, 2 * s);
  x.closePath();
}
// ひし形の クリスタル（上が 長い）
function crystalShape(x, w, h) {
  x.beginPath();
  x.moveTo(0, -h); x.lineTo(w, -h * 0.15); x.lineTo(0, h * 0.6); x.lineTo(-w, -h * 0.15);
  x.closePath();
}

export const JOB8_FINE = {
  // 竜の紋章（ぽんと 出て 光り、ゆっくり きえる）
  j8crest(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.6 + 0.4 * easeOut(clamp01(p.age / 220)));
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, p.x, p.y, 22 * s, 'rgba(255,220,110,0.9)', a * 0.7);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#5a2a08';
    crestShape(x, s * 1.12);
    x.fill();
    x.fillStyle = '#ffd84a';
    crestShape(x, s);
    x.fill();
    x.fillStyle = '#fff6c0';
    x.fillRect(-0.8 * s, -6 * s, 1.6 * s, 6 * s);
    x.fillStyle = '#e8203a';
    x.beginPath(); x.arc(0, 0.5 * s, 1.8 * s, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 竜闘気の 大きな 光の 波動（x0,y0 から x1,y1 へ のびる 太い 光。のびきると ふくらんで きえる）
  j8wave(x, p, t) {
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.travel || 260)));
    const ex = p.x0 + (p.x1 - p.x0) * k, ey = p.y0 + (p.y1 - p.y0) * k;
    const w = (p.w || 26) * (0.5 + 0.5 * k) * (1 + Math.sin(p.age / 40) * 0.08);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.lineCap = 'round';
    for (const [lw, c] of [[w * 1.6, 'rgba(42,112,200,0.55)'], [w, 'rgba(120,210,255,0.85)'], [w * 0.55, 'rgba(220,248,255,0.95)'], [w * 0.22, '#ffffff']]) {
      x.strokeStyle = c;
      x.lineWidth = lw;
      x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    }
    softGlow(x, ex, ey, w * 1.4, 'rgba(200,240,255,0.9)', a * 0.8);
    x.restore();
  },
  // 銀水しょう（回りながら 光る クリスタル）
  j8crystal(x, p, t) {
    const a = fadeOut(t, p.fade ?? 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.s || 1;
    const k = p.travel ? easeOut(clamp01(p.age / p.travel)) : 1;
    const cx = p.x0 !== undefined ? p.x0 + (p.x1 - p.x0) * k : p.x, cy = p.y0 !== undefined ? p.y0 + (p.y1 - p.y0) * k : p.y;
    const sx = Math.cos(p.age / 160) * 0.35 + 0.65;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, 20 * s, p.glowC || 'rgba(220,220,255,0.9)', a * 0.75);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.scale(sx, 1);
    x.fillStyle = p.edge || '#5a54a0';
    crystalShape(x, 5.4 * s, 9 * s);
    x.fill();
    x.fillStyle = p.c || '#e8e8fa';
    crystalShape(x, 4.4 * s, 7.8 * s);
    x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(0, -7 * s); x.lineTo(2 * s, -1.4 * s); x.lineTo(0, 0); x.closePath(); x.fill();
    x.restore();
  },
  // クリスタルの 結界（六角の かべが 下から たち上がる）
  j8dome(x, p, t) {
    const a = fadeOut(t, 0.65);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / 300));
    const r = p.r * k;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.scale(1, 0.8);
    x.fillStyle = 'rgba(200,190,255,0.18)';
    x.beginPath();
    for (let i = 0; i < 6; i++) { const q = -Math.PI / 2 + (i * Math.PI) / 3; x.lineTo(Math.cos(q) * r, Math.sin(q) * r); }
    x.closePath();
    x.fill();
    x.strokeStyle = '#e8e4ff';
    x.lineWidth = 1.6;
    x.stroke();
    // うちがわの 六角の もよう
    x.strokeStyle = 'rgba(232,228,255,0.6)';
    x.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const q = -Math.PI / 2 + (i * Math.PI) / 3;
      x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(q) * r, Math.sin(q) * r); x.stroke();
    }
    x.restore();
  },
  // クリスタルの 城（下から たち上がる すきとおった とう。gold … 金の 城〈キング〉）
  j8palace(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 420));
    const towers = [[-46, 30, 9], [-28, 46, 10], [-12, 58, 11], [0, 72, 13], [12, 58, 11], [28, 46, 10], [46, 30, 9]];
    x.save();
    x.globalAlpha = a * 0.85;
    x.translate(p.x, p.y);
    const s = p.s || 1;
    x.scale(s, s);
    for (const [ox, h, w] of towers) {
      const hh = h * rise;
      const g = x.createLinearGradient(0, -hh, 0, 0);
      g.addColorStop(0, p.gold ? 'rgba(255,240,180,0.95)' : 'rgba(240,240,255,0.95)');
      g.addColorStop(1, p.gold ? 'rgba(214,154,46,0.35)' : 'rgba(150,140,230,0.3)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(ox - w / 2, 0); x.lineTo(ox - w / 2, -hh + w); x.lineTo(ox, -hh - w * 0.6); x.lineTo(ox + w / 2, -hh + w); x.lineTo(ox + w / 2, 0);
      x.closePath();
      x.fill();
      x.strokeStyle = p.gold ? '#fff2b0' : '#ffffff';
      x.lineWidth = 0.8;
      x.stroke();
    }
    x.restore();
  },
  // 白い はね（ゆらゆら おちる）
  j8feather(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = p.age / 1000;
    const cx = p.x + Math.sin(s * 3 + p.ph) * 8, cy = p.y + s * (p.fall || 30);
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.rotate(Math.sin(s * 4 + p.ph) * 0.6);
    x.fillStyle = '#8a86aa';
    x.beginPath(); x.ellipse(0, 0, 2.4, 5.4, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(0, -0.2, 1.8, 4.8, 0, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#c4c2dc';
    x.lineWidth = 0.6;
    x.beginPath(); x.moveTo(0, -4.4); x.lineTo(0, 6); x.stroke();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playJob8Fx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R40_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const tx = targets.reduce((s, t) => s + t.x, 0) / targets.length;
  const ty = targets.reduce((s, t) => s + t.y, 0) / targets.length;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hitMark = (t, d, col, r = 16) => {
    fx.impact(t.x, t.y, { r: (crit ? r + 6 : r) * sz, color: '#ffffff', delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 8 : 14, speed: 150, delay: d, life: 340, len: 7 });
  };
  const fy = Math.min(H - 16, from.y - 18);
  switch (anim) {
    // ───── 看板の技 ─────
    case 'ryumajin_sig': {
      // 1) くらく なって、両手の 竜の紋章が 光る
      fx.tintAt('rgba(6, 12, 30, 0.55)', 1800);
      fx.add({ kind: 'j8crest', x: from.x - 18, y: fy, s: 1.1, life: 900 });
      fx.add({ kind: 'j8crest', x: from.x + 18, y: fy, s: 1.1, life: 900, delay: 80 });
      // 2) 竜闘気が 手もとに 集まる
      for (let k = 0; k < 16; k++) {
        const ang = rnd(0, Math.PI * 2), r = rnd(40, 70);
        fx.puff(from.x + Math.cos(ang) * r, fy + Math.sin(ang) * r * 0.6, { color: '#a8ecff', r0: 3, r1: 1, vx: -Math.cos(ang) * 60, vy: -Math.sin(ang) * 36, life: 420, alpha: 0.7, add: true, delay: 160 + k * 18 });
      }
      fx.glow(from.x, fy, { color: '#e8fbff', r: 26, delay: 320, life: 420 });
      // 3) 大きな 光の 波動
      each((t, i, d) => {
        fx.add({ kind: 'j8wave', x0: from.x, y0: fy, x1: t.x, y1: t.y, x: t.x, y: t.y, w: all ? 22 : 30, travel: 220, life: 760, delay: 560 + d });
        hitMark(t, 760 + d, '#a8ecff', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 56 * sz, color: '#e8fbff', w: 3, delay: 780 + d, life: 420 });
        fx.debris(t.x, t.y + 10, ['#a8ecff', '#ffffff', '#58c0f0'], all ? 6 : 10, 800 + d, 120);
      });
      fx.flashAt(110, '#e8fbff', 760);
      fx.hitStop(crit ? 300 : 240, 760, 2.2);
      for (let k = 0; k < 12; k++) fx.twinkle(rnd(tx - 60, tx + 60), rnd(ty - 40, ty + 20), { color: k % 2 ? '#a8ecff' : '#ffffff', size: rnd(4, 7), delay: 900 + k * 30, life: 500 });
      return true;
    }
    case 'neo_queen_sig': {
      // 1) 夜空に 大きな 月・銀水しょうが 光る
      fx.tintAt('rgba(14, 10, 46, 0.55)', 1900);
      fx.add({ kind: 'j7moon', x: W * 0.5, y: 26, r: 22, life: 1800 });
      for (let k = 0; k < 16; k++) fx.twinkle(rnd(8, W - 8), rnd(4, H * 0.45), { color: k % 2 ? '#e8e4ff' : '#ffffff', size: rnd(3, 6), delay: k * 35, life: 900 });
      fx.add({ kind: 'j8crystal', x: from.x, y: fy - 6, s: 1.5, life: 900 });
      // 2) 下から クリスタルの 城
      fx.add({ kind: 'j8palace', x: W * 0.5, y: H + 2, s: 1.3, life: 1500, delay: 240 });
      // 3) 銀色の 光が ふりそそぐ
      each((t, i, d) => {
        fx.add({ kind: 'j7shaft', x: t.x, y: t.y + 6, w: 22 * sz, life: 760, delay: 520 + d, c: 'rgba(236,232,255,0.95)' });
        hitMark(t, 720 + d, '#e8e4ff', 20);
        fx.shock(t.x, t.y, { r0: 6, r1: 50 * sz, color: '#ffffff', w: 2.5, delay: 720 + d, life: 420 });
      });
      fx.flashAt(90, '#f4f2ff', 720);
      fx.hitStop(crit ? 260 : 200, 720, 1.6);
      // みかたにも 光（仲間の 回復）・白い はね
      fx.glow(from.x, fy, { color: '#f4f2ff', r: 40, delay: 900, life: 600 });
      for (let k = 0; k < 14; k++) fx.add({ kind: 'j8feather', x: rnd(10, W - 10), y: rnd(-12, 10), ph: rnd(0, 6), fall: rnd(25, 45), life: 1000, delay: 880 + k * 30 });
      return true;
    }
    case 'r40_king_sig': {
      // 男の子: 大地から 金色の 光 → 黄金の クリスタル → 金の 光の 柱 → バラの 花びら
      fx.tintAt('rgba(30, 20, 6, 0.45)', 1700);
      fx.add({ kind: 'j8palace', x: W * 0.5, y: H + 2, s: 1.2, gold: true, life: 1400, delay: 120 });
      fx.add({ kind: 'j8crystal', x: from.x, y: fy - 8, s: 1.6, c: '#ffe680', edge: '#8a5a10', glowC: 'rgba(255,220,120,0.9)', life: 900 });
      each((t, i, d) => {
        fx.add({ kind: 'j7shaft', x: t.x, y: t.y + 6, w: 22 * sz, life: 720, delay: 500 + d, c: 'rgba(255,236,160,0.95)' });
        hitMark(t, 700 + d, '#ffe680', 20);
        fx.shock(t.x, t.y, { r0: 6, r1: 48 * sz, color: '#fff2b0', w: 2.5, delay: 700 + d, life: 420 });
      });
      fx.flashAt(90, '#fff6d0', 700);
      fx.hitStop(crit ? 260 : 200, 700, 1.6);
      for (let k = 0; k < 14; k++) fx.petal(rnd(10, W - 10), rnd(-10, 4), { color: k % 2 ? '#e0203a' : '#ffd0d8', vx: rnd(-20, 20), vy: rnd(30, 60), delay: 900 + k * 30, life: 800 });
      return true;
    }
    // ───── 竜魔人 ─────
    case 'r40_crest': {
      // 両手の 竜の紋章が かがやき、水色の 竜闘気が たち上がる（みかた）
      for (const t of targets) {
        fx.add({ kind: 'j8crest', x: t.x - 14, y: t.y - 4, s: 0.8, life: 760 });
        fx.add({ kind: 'j8crest', x: t.x + 14, y: t.y - 4, s: 0.8, life: 760, delay: 90 });
        fx.glow(t.x, t.y, { color: '#a8ecff', r: 30, delay: 200, life: 500 });
        for (let k = 0; k < 10; k++) fx.puff(t.x + rnd(-16, 16), t.y + rnd(0, 14), { color: '#a8ecff', r0: 2, r1: 6, vy: -50, life: 520, alpha: 0.6, add: true, delay: 160 + k * 30 });
        fx.arrows(t.x, t.y, '#ffd84a', true, 3, 360);
      }
      return true;
    }
    case 'r40_magic_sword': {
      // いなずまが 剣に おちて（手もと）、そのまま 敵を 切りおろす
      fx.zap(from.x + rnd(-10, 10), -4, from.x, fy, { color: '#fff6b0', glow: '#9ad8ff', w: 2.4, life: 300, forks: 2 });
      fx.glow(from.x, fy, { color: '#fff6b0', r: 22, delay: 80, life: 300 });
      each((t, i, d) => {
        fx.slash(t.x, t.y, '#fff6b0', 1, { glow: '#9ad8ff', len: 54 * sz, angs: [-0.9], delay: 380 + d, life: 260, w: 4 });
        fx.zap(t.x + rnd(-14, 14), -4, t.x, t.y, { color: '#ffffff', glow: '#9ad8ff', w: 2, delay: 400 + d, life: 280, forks: 1 });
        hitMark(t, 420 + d, '#fff6b0', 20);
      });
      fx.flashAt(70, '#ffffff', 400);
      fx.hitStop(crit ? 220 : 160, 420, 1.6);
      return true;
    }
    case 'r40_aura_guard': {
      // 竜闘気の 水色の わが 仲間を つつむ（みかた）
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 40, r1: 8, color: '#a8ecff', w: 2.5, life: 420 });
        fx.shock(t.x, t.y, { r0: 8, r1: 46, color: '#e8fbff', w: 2, delay: 300, life: 420 });
        fx.glow(t.x, t.y, { color: '#a8ecff', r: 30, delay: 260, life: 520 });
        fx.arrows(t.x, t.y, '#a8ecff', true, 3, 360);
      }
      return true;
    }
    // ───── ネオ・クイーン・セレニティ ─────
    case 'r40_crystal': {
      // 銀水しょうから まっすぐな 銀色の 光
      fx.add({ kind: 'j8crystal', x: from.x, y: fy - 6, s: 1.1, life: 520 });
      each((t, i, d) => {
        fx.add({ kind: 'j7beam', x0: from.x, y0: fy - 6, x1: t.x, y1: t.y, x: t.x, y: t.y, life: 360, delay: 140 + d, c: '#d8d4ff' });
        hitMark(t, 260 + d, '#e8e4ff', 18);
        for (let k = 0; k < 5; k++) fx.twinkle(t.x + rnd(-14, 14), t.y + rnd(-14, 10), { color: '#ffffff', size: 5, delay: 280 + d + k * 40, life: 360 });
      });
      return true;
    }
    case 'r40_barrier': {
      // クリスタルの 六角の かべ（みかた）
      for (const t of targets) {
        fx.add({ kind: 'j8dome', x: t.x, y: t.y, r: 34, life: 900 });
        fx.glow(t.x, t.y, { color: '#e8e4ff', r: 28, delay: 200, life: 500 });
        fx.arrows(t.x, t.y, '#c8c0ff', true, 3, 320);
      }
      for (let k = 0; k < 8; k++) fx.twinkle(rnd(tx - 50, tx + 50), rnd(ty - 30, ty + 10), { color: '#ffffff', size: 5, delay: 160 + k * 40, life: 420 });
      return true;
    }
    case 'r40_queen_heal': {
      // 月の 光と 白い はねが ふりそそぐ（みかた）
      fx.tintAt('rgba(14, 10, 46, 0.3)', 900);
      fx.add({ kind: 'j7moon', x: Math.min(W - 24, tx + 50), y: Math.max(20, ty - 60), r: 12, life: 1100 });
      for (const t of targets) {
        fx.add({ kind: 'j7shaft', x: t.x, y: t.y + 6, w: 22, life: 700, delay: 200, c: 'rgba(240,236,255,0.9)' });
        fx.glow(t.x, t.y, { color: '#f4f2ff', r: 24, delay: 260, life: 420 });
      }
      for (let k = 0; k < 10; k++) fx.add({ kind: 'j8feather', x: rnd(tx - 60, tx + 60), y: rnd(ty - 60, ty - 30), ph: rnd(0, 6), fall: rnd(20, 40), life: 900, delay: 160 + k * 40 });
      return true;
    }
  }
  return false;
}
