// 第41回 A の 新しい 伝説の 職業 2つの 技の エフェクト（京急の社長・野球界の殿堂入り）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'keikyu_president_sig'）。
// battlefx.js の play() で battlefx-jobs8.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（なまえは '<職業の id>_sig'）
//  keikyu_president_sig  京急の社長 … 画面が くらく なり、信号が 赤から 青に → 赤い 電車が 3本 つぎつぎに 走りぬける → 大きな しょうげき・みかたに 金の やじるし
//  hall_of_fame_sig      野球界の殿堂入り … 夜の 球場の ライト → 投げられた 球を カキーン！→ 黄金の 打球が 空へ → 敵の 上で 金の 花火が ひらく
// ほかの 技
//  r41a_signal     信号が 青に かわり、みかたに 青い ひかりと やじるし（みかた）
//  r41a_express    赤い 特急が 1本、ライトを ひからせて 走りぬける
//  r41a_check      みかたの 上に 緑の チェックの しるしと きらきら（みかた）
//  r41a_timetable  時こく表の 板と 時計の はりが くるくる（みかた）
//  r41a_callshot   バットで ゆびさす 金の やじるしが 空へ（みかた。自分）
//  r41a_vanish     投げた 球が とちゅうで ふっと 消えて、敵の 前で あらわれる
//  r41a_huddle     みかたを かこむ 金の わと 声の すじ（みかた）
//  r41a_strikeout  うなる 球が つぎつぎに 敵へ（空ぶりの すじ）
//  r41a_allstar    金色の 名選手の まぼろしが 敵を かけぬける（3回）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R41A_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R41A）は、battle.js が がめんの 下の まん中に 出す

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R41A_SIG_JOBS = ['keikyu_president', 'hall_of_fame'];
export const R41A_SIGS = R41A_SIG_JOBS.map((j) => `${j}_sig`);
export const R41A_MOVES = ['r41a_signal', 'r41a_express', 'r41a_check', 'r41a_timetable', 'r41a_callshot', 'r41a_vanish', 'r41a_huddle', 'r41a_strikeout', 'r41a_allstar'];
export const R41A_ANIMS = new Set([...R41A_SIGS, ...R41A_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R41A = new Set(['r41a_signal', 'r41a_check', 'r41a_timetable', 'r41a_callshot', 'r41a_huddle']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R41A_HIT = {
  keikyu_president_sig: 820, hall_of_fame_sig: 900, r41a_express: 380, r41a_vanish: 520, r41a_strikeout: 420, r41a_allstar: 420,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r33.js に ある 音）
export const R41A_SFX = {
  keikyu_president_sig: 'train', hall_of_fame_sig: 'bat', r41a_signal: 'kirari', r41a_express: 'train', r41a_check: 'heal',
  r41a_timetable: 'buff', r41a_callshot: 'kirari', r41a_vanish: 'wind', r41a_huddle: 'r33_clap', r41a_strikeout: 'crit', r41a_allstar: 'sparkle',
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

export const R41A_FINE = {
  // 信号機（くろい 箱に 3つの ランプ。go より 前は 赤、あとは 青）
  r41aSignal(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 100);
    if (a <= 0) return;
    const s = p.s || 1;
    const go = p.age >= (p.go ?? 300);
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#16161e';
    x.fillRect(-4 * s, -12 * s, 8 * s, 22 * s);
    x.fillStyle = '#3a3a48';
    x.fillRect(-1 * s, 10 * s, 2 * s, 8 * s);
    const lamps = [['#ff3a3a', !go], ['#ffd040', false], ['#3aff8a', go]];
    lamps.forEach(([c, on], i) => {
      const ly = (-8 + i * 6.5) * s;
      x.fillStyle = on ? c : '#2c2c36';
      x.beginPath(); x.arc(0, ly, 2.3 * s, 0, Math.PI * 2); x.fill();
      if (on) {
        x.globalCompositeOperation = 'lighter';
        softGlow(x, 0, ly, 9 * s, c, a * 0.8);
        x.globalCompositeOperation = 'source-over';
        x.globalAlpha = a;
      }
    });
    x.restore();
  },
  // 赤い 電車（白い 線・まど・ライト）。x0 から dir の ほうへ speed（px/びょう）で 走る
  r41aTrain(x, p, t) {
    const a = fadeOut(t, 0.85);
    if (a <= 0) return;
    const s = p.s || 1, dir = p.dir || 1;
    const cx = p.x0 + dir * (p.speed || 700) * (p.age / 1000);
    const L = 96 * s, h = 18 * s, y = p.y;
    x.save();
    x.globalAlpha = a;
    x.translate(cx, y);
    x.scale(dir, 1);
    // しっぽの 風
    x.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 4; i++) x.fillRect(-L - 26 - i * 14, -h + 3 + i * 4, 18, 1);
    // 車体（はなは まえに かたむく）
    x.fillStyle = '#5a0a10';
    x.beginPath(); x.moveTo(-L, 1); x.lineTo(-L, -h - 1); x.lineTo(-6 * s, -h - 1); x.lineTo(7 * s, -3 * s); x.lineTo(7 * s, 1); x.closePath(); x.fill();
    x.fillStyle = '#d8202c';
    x.beginPath(); x.moveTo(-L + 1, 0); x.lineTo(-L + 1, -h); x.lineTo(-6 * s, -h); x.lineTo(6 * s, -3 * s); x.lineTo(6 * s, 0); x.closePath(); x.fill();
    // 白い 線
    x.fillStyle = '#f6f6fa';
    x.fillRect(-L + 1, -7 * s, L + 3 * s, 3 * s);
    // まど
    x.fillStyle = '#26345a';
    for (let i = 0; i < 5; i++) x.fillRect(-L + 8 * s + i * 16 * s, -h + 3 * s, 10 * s, 6 * s);
    x.fillRect(-5 * s, -h + 3 * s, 7 * s, 5 * s);
    // 車りん
    x.fillStyle = '#22222c';
    for (let i = 0; i < 4; i++) x.fillRect(-L + 10 * s + i * 22 * s, 0, 6 * s, 3 * s);
    // ライト
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 5 * s, -2 * s, 14 * s, 'rgba(255,240,150,0.95)', a);
    x.restore();
  },
  // 緑の チェックの しるし（ぽんと 出て、ふわっと 上へ）
  r41aCheck(x, p, t) {
    const a = fadeOut(t, 0.6);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.5 + 0.5 * easeOut(clamp01(p.age / 200)));
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - p.age * 0.02);
    x.lineCap = 'round';
    x.lineJoin = 'round';
    x.strokeStyle = '#0e4a24';
    x.lineWidth = 4.2 * s;
    x.beginPath(); x.moveTo(-5 * s, 0); x.lineTo(-1.5 * s, 4 * s); x.lineTo(6 * s, -5 * s); x.stroke();
    x.strokeStyle = '#4af08a';
    x.lineWidth = 2.4 * s;
    x.stroke();
    x.restore();
  },
  // 時こく表の 板（白い 線の 数字の かわり）と、くるくる 回る 時計
  r41aBoard(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 150);
    if (a <= 0) return;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y);
    x.fillStyle = '#18203a';
    x.fillRect(-30, -16, 44, 32);
    x.strokeStyle = '#f2c14e';
    x.lineWidth = 1;
    x.strokeRect(-30, -16, 44, 32);
    for (let i = 0; i < 5; i++) {
      const on = p.age > 120 + i * 90;
      x.fillStyle = on ? (i % 2 ? '#ffd040' : '#f6f6fa') : '#3a4466';
      x.fillRect(-26, -11 + i * 6, 8, 2);
      x.fillRect(-15, -11 + i * 6, 24, 2);
    }
    // 時計
    const cx = 24, cy = -4;
    x.fillStyle = '#f6f6fa';
    x.beginPath(); x.arc(cx, cy, 9, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#d8202c';
    x.lineWidth = 1.4;
    x.stroke();
    x.strokeStyle = '#18203a';
    x.lineCap = 'round';
    const ang = p.age / 60;
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang) * 7, cy + Math.sin(ang) * 7); x.stroke();
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ang / 12) * 4.5, cy + Math.sin(ang / 12) * 4.5); x.stroke();
    x.restore();
  },
  // 野球の 球（x0,y0 → x1,y1。lift: まがり。vanish: [はじめ, おわり]〈0〜1〉の あいだは 見えない。gold: 黄金の 打球）
  r41aBall(x, p, t) {
    const k = clamp01(p.age / (p.travel || 300));
    if (p.age > (p.travel || 300) + 60) return;
    if (p.vanish && k > p.vanish[0] && k < p.vanish[1]) return;
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * (p.lift || 0);
    const r = (p.r || 3) * (p.grow ? 1 + k * p.grow : 1);
    x.save();
    if (p.gold) {
      x.globalCompositeOperation = 'lighter';
      softGlow(x, cx, cy, r * 5, 'rgba(255,220,110,0.95)', 0.9);
      x.globalCompositeOperation = 'source-over';
    }
    x.globalAlpha = 1;
    x.fillStyle = p.gold ? '#ffe680' : '#ffffff';
    x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
    x.fillStyle = p.gold ? '#b47a1a' : '#e04848';
    x.fillRect(Math.round(cx - r * 0.6), Math.round(cy - 1), 1, 2);
    x.fillRect(Math.round(cx + r * 0.4), Math.round(cy - 1), 1, 2);
    x.restore();
  },
  // 金の 花火（まるく ひらく 光の つぶ）
  r41aFirework(x, p, t) {
    const a = fadeOut(t, 0.45);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / 420));
    const R = (p.r || 30) * k;
    const n = p.n || 16;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const q = (i / n) * Math.PI * 2;
      const px = p.x + Math.cos(q) * R, py = p.y + Math.sin(q) * R + k * k * 6;
      x.fillStyle = i % 2 ? (p.c2 || '#fff6c0') : (p.c || '#ffc830');
      x.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
      x.globalAlpha = a * 0.5;
      x.fillRect(Math.round(p.x + Math.cos(q) * R * 0.7), Math.round(p.y + Math.sin(q) * R * 0.7 + k * k * 4), 1, 1);
      x.globalAlpha = a;
    }
    softGlow(x, p.x, p.y, R * 0.6 + 4, 'rgba(255,230,140,0.8)', a * 0.5 * (1 - k));
    x.restore();
  },
  // 球場の ライト（上の すみから ななめに のびる 光）
  r41aSpot(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 200);
    if (a <= 0) return;
    const sway = Math.sin(p.age / 300 + (p.ph || 0)) * 10;
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a * 0.45;
    const g = x.createLinearGradient(p.x, p.y, p.tx + sway, p.ty);
    g.addColorStop(0, 'rgba(255,250,220,0.95)');
    g.addColorStop(1, 'rgba(255,250,220,0)');
    x.fillStyle = g;
    x.beginPath();
    x.moveTo(p.x, p.y);
    x.lineTo(p.tx + sway - 26, p.ty);
    x.lineTo(p.tx + sway + 26, p.ty);
    x.closePath();
    x.fill();
    x.restore();
  },
  // 金色の 名選手の まぼろし（かんたんな 人の かたち。x0 から x1 へ かけぬける）
  r41aGhost(x, p, t) {
    const a = fadeOut(t, 0.6) * clamp01(p.age / 120) * 0.85;
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.travel || 300)));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y;
    const s = p.s || 1, dir = p.x1 >= p.x0 ? 1 : -1;
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy - 6 * s, 16 * s, 'rgba(255,214,110,0.8)', a * 0.6);
    x.globalAlpha = a;
    x.fillStyle = '#ffe08a';
    x.translate(cx, cy);
    x.scale(dir, 1);
    // あたま（ぼうしの つば）・からだ・あし・バット
    x.beginPath(); x.arc(0, -16 * s, 3.2 * s, 0, Math.PI * 2); x.fill();
    x.fillRect(0, -18 * s, 5 * s, 1.4 * s);
    x.fillRect(-3 * s, -12.5 * s, 6 * s, 9 * s);
    x.fillRect(-3 * s, -3.5 * s, 2.2 * s, 7 * s);
    x.fillRect(1 * s, -3.5 * s, 2.2 * s, 7 * s);
    x.save();
    x.translate(2 * s, -10 * s);
    x.rotate(-0.9 + k * 1.8);
    x.fillRect(0, -1 * s, 12 * s, 2 * s);
    x.restore();
    // かけぬける すじ
    x.globalAlpha = a * 0.5;
    for (let i = 0; i < 3; i++) x.fillRect(-14 * s - i * 6 * s, (-14 + i * 5) * s, 8 * s, 1);
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR41aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R41A_ANIMS.has(anim) || !targets || !targets.length) return false;
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
    case 'keikyu_president_sig': {
      // 1) くらく なって、信号が 赤から 青に
      fx.tintAt('rgba(10, 8, 24, 0.5)', 1800);
      fx.add({ kind: 'r41aSignal', x: Math.min(W - 14, from.x + 30), y: Math.max(30, fy - 26), s: 1.2, go: 300, life: 1300 });
      // 2) 赤い 電車が 3本 つぎつぎに 走りぬける（敵の 足もとの 高さ）
      const yb = Math.min(H - 8, Math.max(...targets.map((t) => t.y)) + 10);
      [[yb, 360, 1.0], [yb - 26, 470, 0.85], [yb - 50, 580, 0.7]].forEach(([y, d, s]) => {
        fx.add({ kind: 'r41aTrain', x0: -20, y, s, speed: 760, life: 760, delay: d });
      });
      // 3) 大きな しょうげき
      each((t, i, d) => {
        fx.speedLines(t.x, t.y, { delay: 560 + d, r1: 96 });
        hitMark(t, 820 + d, '#ff8a8a', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#ffd0d0', w: 3, delay: 840 + d, life: 420 });
        fx.debris(t.x, t.y + 10, ['#d8202c', '#ffffff', '#ffd040'], all ? 6 : 10, 860 + d, 110);
      });
      fx.flashAt(110, '#ffe0e0', 820);
      fx.hitStop(crit ? 300 : 240, 820, 2.0);
      // みかたの 素早さも 上がる（金の やじるし）
      fx.arrows(from.x, fy, '#ffe066', true, 3, 1100);
      return true;
    }
    case 'hall_of_fame_sig': {
      // 1) 夜の 球場の ライト・スタンドの フラッシュ
      fx.tintAt('rgba(6, 10, 30, 0.55)', 2000);
      fx.add({ kind: 'r41aSpot', x: 8, y: 0, tx: tx - 20, ty: H, ph: 0, life: 1900 });
      fx.add({ kind: 'r41aSpot', x: W - 8, y: 0, tx: from.x + 20, ty: H, ph: 2, life: 1900 });
      for (let k = 0; k < 14; k++) fx.twinkle(rnd(6, W - 6), rnd(4, 30), { color: '#ffffff', size: rnd(3, 5), delay: k * 40, life: 300 });
      // 2) 投げられた 球を カキーン！ → 黄金の 打球が 空へ
      fx.add({ kind: 'r41aBall', x0: W / 2, y0: 20, x1: from.x, y1: fy, travel: 260, r: 2.4, life: 340, delay: 140 });
      fx.arc(from.x, fy, { r: 30, a0: Math.PI * 0.95, a1: 0.1, w: 6, glow: '#ffe07a', delay: 400, life: 260 });
      fx.flashAt(70, '#fff6d0', 420);
      fx.add({ kind: 'r41aBall', x0: from.x, y0: fy, x1: tx, y1: -30, lift: 20, travel: 380, r: 3, grow: 0.6, gold: true, life: 460, delay: 420 });
      // 3) 敵の 上で 金の 花火 → ふりそそぐ
      each((t, i, d) => {
        fx.add({ kind: 'r41aFirework', x: t.x, y: t.y - 18, r: 34 * sz, n: 18, life: 900, delay: 780 + d });
        hitMark(t, 900 + d, '#ffe07a', 22);
        fx.shock(t.x, t.y, { r0: 8, r1: 54 * sz, color: '#fff2b0', w: 3, delay: 900 + d, life: 420 });
      });
      fx.flashAt(110, '#fff6d0', 900);
      fx.hitStop(crit ? 300 : 240, 900, 2.0);
      for (let k = 0; k < 16; k++) fx.twinkle(rnd(tx - 70, tx + 70), rnd(ty - 50, ty - 10), { color: k % 2 ? '#ffe07a' : '#ffffff', size: rnd(4, 7), vy: 24, delay: 1000 + k * 30, life: 600 });
      return true;
    }
    // ───── 京急の社長 ─────
    case 'r41a_signal': {
      // 信号が 青に かわり、みかたに 青い ひかりと やじるし（みかた）
      fx.add({ kind: 'r41aSignal', x: tx, y: Math.max(28, ty - 40), s: 1, go: 260, life: 900 });
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#3aff8a', r: 26, delay: 300, life: 460 });
        fx.arrows(t.x, t.y, '#3aff8a', true, 3, 360);
      }
      return true;
    }
    case 'r41a_express': {
      // 赤い 特急が 1本、ライトを ひからせて 走りぬける
      const yb = Math.min(H - 8, Math.max(...targets.map((t) => t.y)) + 10);
      fx.add({ kind: 'r41aTrain', x0: -10, y: yb, s: 1, speed: 900, life: 520 });
      each((t, i, d) => {
        fx.speedLines(t.x, t.y, { delay: 200 + d, r1: 90 });
        hitMark(t, 380 + d, '#ff8a8a', 20);
      });
      fx.hitStop(crit ? 220 : 150, 380, 1.5);
      return true;
    }
    case 'r41a_check': {
      // 緑の チェックの しるしと きらきら（みかた）
      for (const [i, t] of targets.entries()) {
        fx.add({ kind: 'r41aCheck', x: t.x, y: t.y - 16, s: 1, life: 760, delay: i * 70 });
        fx.glow(t.x, t.y, { color: '#c8ffd8', r: 24, delay: 160 + i * 70, life: 420 });
        for (let k = 0; k < 4; k++) fx.twinkle(t.x + rnd(-12, 12), t.y + rnd(-10, 10), { color: '#ffffff', size: 4, delay: 200 + i * 70 + k * 40, life: 320 });
      }
      return true;
    }
    case 'r41a_timetable': {
      // 時こく表の 板と 時計（みかた）。みんなの 行動ゲージが たまる
      fx.add({ kind: 'r41aBoard', x: tx, y: Math.max(22, ty - 42), life: 1000 });
      for (const t of targets) {
        fx.shock(t.x, t.y, { r0: 6, r1: 30, color: '#ffd040', w: 2, delay: 420, life: 360 });
        fx.arrows(t.x, t.y, '#9ad8ff', true, 3, 460);
      }
      return true;
    }
    // ───── 野球界の殿堂入り ─────
    case 'r41a_callshot': {
      // バットで ゆびさす 金の やじるしが 空へ（みかた。自分）
      for (const t of targets) {
        fx.add({ kind: 'r41aBall', x0: t.x, y0: t.y - 10, x1: t.x + 30, y1: -20, travel: 520, r: 2, gold: true, life: 560, delay: 120 });
        fx.glow(t.x, t.y, { color: '#ffe07a', r: 28, delay: 100, life: 460 });
        fx.arrows(t.x, t.y, '#ffd040', true, 3, 320);
        for (let k = 0; k < 6; k++) fx.twinkle(t.x + rnd(-16, 16), t.y + rnd(-20, 6), { color: '#fff6c0', size: 5, delay: 200 + k * 50, life: 320 });
      }
      return true;
    }
    case 'r41a_vanish': {
      // 投げた 球が とちゅうで ふっと 消えて、敵の 前で あらわれる
      each((t, i, d) => {
        fx.add({ kind: 'r41aBall', x0: from.x, y0: fy, x1: t.x, y1: t.y, travel: 500, r: 2.6, vanish: [0.3, 0.8], life: 540, delay: d });
        fx.puff(from.x + (t.x - from.x) * 0.3, fy + (t.y - fy) * 0.3, { color: '#ffffff', r0: 2, r1: 9, life: 300, alpha: 0.6, delay: 150 + d });
        fx.puff(from.x + (t.x - from.x) * 0.8, fy + (t.y - fy) * 0.8, { color: '#ffffff', r0: 9, r1: 2, life: 200, alpha: 0.6, delay: 330 + d });
        hitMark(t, 520 + d, '#ffffff', 20);
      });
      fx.hitStop(crit ? 220 : 150, 520, 1.5);
      return true;
    }
    case 'r41a_huddle': {
      // みかたを かこむ 金の わと 声の すじ（みかた）
      fx.shock(tx, ty, { r0: 10, r1: 70, color: '#ffe07a', w: 3, sy: 0.4, life: 520 });
      fx.shock(tx, ty, { r0: 10, r1: 56, color: '#ffffff', w: 2, sy: 0.4, delay: 200, life: 480 });
      for (const t of targets) {
        fx.speedLines(t.x, t.y - 6, { color: '#fff2b0', n: 8, r0: 10, r1: 26, delay: 160, life: 300 });
        fx.arrows(t.x, t.y, '#ffd040', true, 3, 380);
      }
      return true;
    }
    case 'r41a_strikeout': {
      // うなる 球が つぎつぎに 敵へ（空ぶりの すじ）
      each((t, i, d) => {
        fx.add({ kind: 'r41aBall', x0: from.x, y0: fy, x1: t.x, y1: t.y, travel: 300, r: 2.4, life: 360, delay: 100 + d * 2 });
        fx.arc(t.x + 6, t.y, { r: 18, a0: Math.PI * 1.1, a1: Math.PI * 1.9, w: 2, color: '#ffffff', glow: '#9ad8ff', delay: 380 + d * 2, life: 220 });
        hitMark(t, 420 + d * 2, '#9ad8ff', 16);
      });
      return true;
    }
    case 'r41a_allstar': {
      // 金色の 名選手の まぼろしが 敵を かけぬける（3回）
      fx.tintAt('rgba(30, 20, 6, 0.35)', 1300);
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) {
          const dir = k % 2 ? -1 : 1;
          fx.add({ kind: 'r41aGhost', x0: t.x - dir * 40, x1: t.x + dir * 40, y: t.y + 10, s: 0.9 * sz, travel: 320, life: 520, delay: 160 + k * 170 + d });
          hitMark(t, 420 + k * 170 + d, '#ffe07a', 14);
        }
      });
      return true;
    }
  }
  return false;
}
