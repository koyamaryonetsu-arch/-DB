// 第82回 A班の 技の エフェクト（犬夜叉の 系統: 半ようの少年・鉄さいがの使い手・犬夜しゃ・ばくりゅうはの大よう）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く。
// battlefx.js の play() で battlefx-r66e2.js の あとに よばれる（ここに ない anim なら false を かえす）。
// え は かんたんな かたち（顔・文字は かかない）。自分や 仲間に かける 技は 前から ある えんしゅつ（charge・guard・heal2・warcry）なので、ここは 敵に 出す 物だけ
//
// 看板の技
//  hanyo_boy_sig      あばれんぼうの大づめ … 赤い 光の 中、上から 大きな 5本の つめあとが 2回（✕）・赤い しょうげき
//  tessaiga_user_sig  風のきず           … 刀の 光の 弧 → 地面を 4本の 金色の 風の すじが 走り、敵を まきこんで 上へ はじける
// ばくりゅうは（client/battle-r82a.js が 返した 時に 出す）
//  r82a_bakuryu       … 敵の 力を まきこんだ 金と 青の うずの すじが 何本も、まがりながら 敵へ・大きな しょうげき
// ほかの 技
//  r82a_claw    つめ        … 3本 ならんだ 白と 赤の つめあと（2〜4回）
//  r82a_blade   ひじんけっそう … 赤い 三日月の 刃が 下から 敵へ 飛ぶ
//  r82a_fang    鉄さいがの 一ふり … 太い 白い 弧（大きな 刀）・金の ふち
//  r82a_red     赤い 鉄さいが … 赤い 光の まく（けっかい）が われて、赤い 一ふり
//  r82a_wind    風のきず（小）… 金色の 風の すじが 2本ずつ 敵へ
//  r82a_diamond 金ごうそうは … 光る ダイヤの やりが ななめ上から ふりそそぐ
//  r82a_moon    めいどうざんげつは … 黒い 三日月の 道が ひらいて、すいこむ うず
//  r82a_sniff   鼻がきく    … 敵の 上に 小さな においの うずと 光の わ
// ・どれも 2.2びょう いないで おわる。あたる じかんは R82A_HIT（client/battle.js の HIT_DELAY に まぜる）

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);

export const R82A_SIGS = ['hanyo_boy_sig', 'tessaiga_user_sig'];
export const R82A_MOVES = ['r82a_bakuryu', 'r82a_claw', 'r82a_blade', 'r82a_fang', 'r82a_red', 'r82a_wind', 'r82a_diamond', 'r82a_moon', 'r82a_sniff'];
export const R82A_ANIMS = new Set([...R82A_SIGS, ...R82A_MOVES]);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R82A_HIT = {
  hanyo_boy_sig: 560, tessaiga_user_sig: 720, r82a_bakuryu: 820,
  r82a_claw: 160, r82a_blade: 380, r82a_fang: 260, r82a_red: 420, r82a_wind: 440, r82a_diamond: 520, r82a_moon: 700, r82a_sniff: 300,
};
// たたかいの 音（client/battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js に ある 音）
export const R82A_SFX = {
  hanyo_boy_sig: 'smash', tessaiga_user_sig: 'wind', r82a_bakuryu: 'wind',
  r82a_claw: 'card', r82a_blade: 'card', r82a_fang: 'smash', r82a_red: 'smash', r82a_wind: 'wind', r82a_diamond: 'sparkle', r82a_moon: 'warp', r82a_sniff: 'pu',
};

// ───────────── え の ぶひん ─────────────
export const R82A_FINE = {
  // つめあと（ならんだ 3〜5本の ななめの すじ。上から 下へ のびる）
  e82Claw(x, p, t) {
    const grow = easeOut(clamp01(p.age / 140));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.55) * 2.2);
    const n = p.n || 3, s = p.s || 1, len = (p.len || 26) * s;
    const ang = p.ang ?? 0.5;
    const dx = Math.sin(ang), dy = Math.cos(ang);
    x.save();
    x.globalAlpha = fade;
    x.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const off = (i - (n - 1) / 2) * 5 * s;
      const sx = p.x + off * dy - (dx * len) / 2, sy = p.y - off * dx * 0.3 - (dy * len) / 2;
      const ex = sx + dx * len * grow, ey = sy + dy * len * grow;
      x.strokeStyle = p.color || '#ff3a4a';
      x.lineWidth = 3.2 * s;
      x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
      x.strokeStyle = '#ffffff';
      x.lineWidth = 1.2 * s;
      x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.stroke();
    }
    x.restore();
  },
  // 風の すじ（x0,y0 → x1,y1 を うねりながら 走る 金色の 線。先が 明るい）
  e82Wind(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || 420)));
    const fade = Math.max(0, 1 - Math.max(0, t - 0.7) * 3.3);
    const steps = 14;
    x.save();
    x.globalAlpha = fade;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    const pt = (u) => {
      const bx = p.x0 + (p.x1 - p.x0) * u, by = p.y0 + (p.y1 - p.y0) * u;
      const nx = -(p.y1 - p.y0), ny = p.x1 - p.x0, nl = Math.hypot(nx, ny) || 1;
      const w = Math.sin(u * Math.PI * (p.waves || 3) + (p.ph || 0) + p.age / 60) * (p.amp ?? 5);
      return [bx + (nx / nl) * w, by + (ny / nl) * w];
    };
    for (const [col, lw] of [[p.color || '#ffd23a', (p.w || 3) + 1.5], ['#fff8d8', (p.w || 3) * 0.45]]) {
      x.strokeStyle = col;
      x.lineWidth = lw;
      x.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = (i / steps) * k;
        const [px, py] = pt(u);
        if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
      }
      x.stroke();
    }
    x.restore();
  },
  // ダイヤの やり（ほそい ひし形。ななめに 落ちる）
  e82Diamond(x, p, t) {
    const k = easeOut(clamp01(p.age / (p.travel || 360)));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y0 + (p.y1 - p.y0) * k;
    const ang = Math.atan2(p.y1 - p.y0, p.x1 - p.x0);
    const s = p.s || 1;
    x.save();
    x.globalAlpha = Math.max(0, 1 - Math.max(0, t - 0.75) * 4);
    x.translate(cx, cy);
    x.rotate(ang);
    x.fillStyle = p.color || '#bff4ff';
    x.beginPath();
    x.moveTo(9 * s, 0); x.lineTo(0, -2.4 * s); x.lineTo(-9 * s, 0); x.lineTo(0, 2.4 * s);
    x.closePath();
    x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath();
    x.moveTo(8 * s, 0); x.lineTo(0, -0.9 * s); x.lineTo(-4 * s, 0); x.lineTo(0, 0.9 * s);
    x.closePath();
    x.fill();
    x.restore();
  },
  // 黒い 三日月の 道（だんだん ひらいて、さいごに とじる）
  e82Moon(x, p, t) {
    const open = Math.sin(clamp01(t) * Math.PI);
    const r = (p.r || 22) * (0.4 + 0.6 * open);
    x.save();
    x.globalAlpha = Math.min(1, open * 1.4);
    x.fillStyle = '#0a0612';
    x.beginPath();
    x.arc(p.x, p.y, r, 0, Math.PI * 2);
    x.arc(p.x + r * 0.45, p.y - r * 0.2, r * 0.85, 0, Math.PI * 2, true);
    x.fill();
    x.strokeStyle = '#b48aff';
    x.lineWidth = 1.4;
    x.beginPath();
    x.arc(p.x, p.y, r, Math.PI * 0.2, Math.PI * 1.75);
    x.stroke();
    x.restore();
  },
};

export function playR82aFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R82A_ANIMS.has(anim) || !targets || !targets.length) return false;
  const crit = !!opts.crit;
  const all = targets.length > 1;
  const sz = all ? 0.85 : 1;
  const from = opts.from || { x: W / 2, y: H + 6 };
  const each = (fn) => targets.forEach((t, i) => fn(t, i, i * (all ? 50 : 0)));
  const hit = (t, d, col = '#ffffff', r = 12) => {
    fx.impact(t.x + rnd(-5, 5), t.y + rnd(-5, 4), { r: (crit ? r + 5 : r) * sz, color: col, delay: d });
    fx.sparks(t.x, t.y, { colors: ['#ffffff', col], n: all ? 5 : 8, speed: 130, delay: d, life: 260, len: 6 });
  };
  const claw = (t, d, ang, o = {}) => fx.add({ kind: 'e82Claw', x: t.x, y: t.y - 4, ang, n: o.n || 3, s: (o.s || 1) * sz, len: o.len || 26, color: o.color || '#ff3a4a', life: o.life || 420, delay: d });
  // 地面を 走る 風の すじ（from → 敵）
  const winds = (t, d, n, o = {}) => {
    for (let k = 0; k < n; k++) {
      const x0 = from.x + (k - (n - 1) / 2) * 14, y0 = Math.min(H - 4, from.y - 6);
      fx.add({ kind: 'e82Wind', x0, y0, x1: t.x + rnd(-6, 6), y1: t.y + rnd(-4, 6), travel: o.travel || 420, life: o.life || 760, w: o.w || 3, amp: o.amp ?? 6, waves: 2 + k, ph: k * 1.3, color: o.color || '#ffd23a', delay: d + k * 50 });
    }
  };
  switch (anim) {
    // ───── 看板の技 ─────
    case 'hanyo_boy_sig': {
      fx.tintAt('rgba(60, 0, 10, 0.4)', 1300);
      each((t, i, d) => {
        claw(t, 300 + d, 0.55, { n: 5, s: 1.5, len: 38, life: 700 });
        claw(t, 480 + d, -0.55, { n: 5, s: 1.5, len: 38, life: 640, color: '#ffffff' });
        hit(t, 560 + d, '#ff3a4a', 16);
        fx.shock(t.x, t.y, { r0: 6, r1: 46 * sz, color: '#ff5a5a', w: 3, delay: 560 + d, life: 380 });
      });
      fx.flashAt(90, '#ffd8d8', 560);
      fx.hitStop(crit ? 240 : 180, 560, 1.6);
      return true;
    }
    case 'tessaiga_user_sig': {
      fx.tintAt('rgba(20, 16, 0, 0.35)', 1600);
      fx.cut(from.x, Math.min(H - 12, from.y - 20), { ang: -0.4, len: 70, w: 4, color: '#fff6d0', glow: '#ffd23a', delay: 0, life: 300 });
      each((t, i, d) => {
        winds(t, 180 + d, 4, { travel: 520, life: 900 });
        fx.swirl(t.x, t.y, ['#ffd23a', '#ffffff', '#9ad8ff'], { n: 18, rad: 16 * sz, h: 40, delay: 640 + d, life: 600 });
        hit(t, 720 + d, '#ffd23a', 14);
      });
      fx.flashAt(100, '#fff6d0', 720);
      fx.hitStop(crit ? 260 : 200, 720, 1.8);
      return true;
    }
    case 'r82a_bakuryu': {
      // 敵の 力を まきこんだ うず（金と 青）が 何本も まがりながら
      fx.tintAt('rgba(6, 10, 30, 0.5)', 1800);
      fx.cut(from.x, Math.min(H - 12, from.y - 20), { ang: 0.3, len: 80, w: 5, color: '#ffffff', glow: '#7ad8ff', delay: 0, life: 320 });
      each((t, i, d) => {
        winds(t, 160 + d, 3, { travel: 620, life: 1000, w: 4, amp: 12, color: '#ffd23a' });
        winds(t, 260 + d, 3, { travel: 620, life: 1000, w: 3, amp: 16, color: '#7ad8ff' });
        fx.swirl(t.x, t.y, ['#ffd23a', '#7ad8ff', '#ffffff'], { n: 30, rad: 24 * sz, h: 56, delay: 620 + d, life: 820 });
        fx.shock(t.x, t.y, { r0: 6, r1: 60 * sz, color: '#ffd23a', w: 3, delay: 820 + d, life: 460 });
        hit(t, 820 + d, '#7ad8ff', 18);
      });
      fx.flashAt(120, '#eaf6ff', 820);
      fx.hitStop(crit ? 320 : 260, 820, 2.2);
      return true;
    }
    // ───── ほかの 技 ─────
    case 'r82a_claw': {
      each((t, i, d) => {
        claw(t, d, 0.5);
        claw(t, 140 + d, -0.5, { color: '#ffffff' });
        hit(t, 160 + d, '#ff5a5a', 10);
      });
      fx.hitStop(crit ? 150 : 90, 160, 1.0);
      return true;
    }
    case 'r82a_blade': {
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.cut(t.x + (k - 1) * 8, t.y - 2, { ang: -0.9 + k * 0.2, len: 22 * sz, w: 3, color: '#ffb0b8', glow: '#e8202c', delay: 260 + k * 50 + d, life: 280 });
        hit(t, 380 + d, '#e8202c', 11);
      });
      return true;
    }
    case 'r82a_fang': {
      each((t, i, d) => {
        fx.cut(t.x, t.y, { ang: -0.7, len: 54 * sz, w: 5, color: '#ffffff', glow: '#ffd23a', delay: 120 + d, life: 340 });
        hit(t, 260 + d, '#ffd23a', 15);
      });
      fx.hitStop(crit ? 180 : 120, 260, 1.3);
      return true;
    }
    case 'r82a_red': {
      each((t, i, d) => {
        fx.ring(t.x, t.y, '#ff4a5a', 2, d, 300, 24 * sz);
        fx.sparks(t.x, t.y, { colors: ['#ff4a5a', '#ffd0d4'], n: 12, speed: 160, delay: 300 + d, life: 320, len: 7 });
        fx.cut(t.x, t.y, { ang: 0.8, len: 50 * sz, w: 5, color: '#ffe0e4', glow: '#e8202c', delay: 340 + d, life: 320 });
        hit(t, 420 + d, '#e8202c', 14);
      });
      fx.hitStop(crit ? 200 : 140, 420, 1.4);
      return true;
    }
    case 'r82a_wind': {
      each((t, i, d) => {
        winds(t, d, 2, { travel: 400, life: 700 });
        hit(t, 440 + d, '#ffd23a', 12);
      });
      fx.hitStop(crit ? 180 : 120, 440, 1.2);
      return true;
    }
    case 'r82a_diamond': {
      const n = all ? 3 : 5;
      each((t, i, d) => {
        for (let k = 0; k < n; k++) {
          const x0 = t.x - 60 + rnd(-10, 10), y0 = -10 - k * 6;
          fx.add({ kind: 'e82Diamond', x0, y0, x1: t.x + rnd(-8, 8), y1: t.y + rnd(-6, 6), travel: 360, life: 420, s: rnd(0.9, 1.3), color: k % 2 ? '#bff4ff' : '#e8f8ff', delay: 160 + k * 60 + d });
        }
        hit(t, 520 + d, '#bff4ff', 12);
      });
      return true;
    }
    case 'r82a_moon': {
      fx.tintAt('rgba(10, 4, 20, 0.5)', 1500);
      each((t, i, d) => {
        fx.add({ kind: 'e82Moon', x: t.x, y: t.y - 4, r: 26 * sz, life: 1200, delay: 120 + d });
        fx.swirl(t.x, t.y, ['#b48aff', '#2a1a4a', '#ffffff'], { n: 20, rad: 18 * sz, h: 30, delay: 400 + d, life: 700 });
        hit(t, 700 + d, '#b48aff', 15);
      });
      fx.hitStop(crit ? 240 : 180, 700, 1.6);
      return true;
    }
    case 'r82a_sniff': {
      each((t, i, d) => {
        fx.swirl(t.x, t.y - 8, ['#d8f0c8', '#ffffff'], { n: 10, rad: 10 * sz, h: 16, delay: d, life: 520 });
        fx.ring(t.x, t.y, '#ffd66b', 2, 240 + d, 360, 20);
      });
      return true;
    }
  }
  return false;
}
