// 第41回 B の 新しい 職業 2つの 技の エフェクト（雪の女王・第5のせいれい）
// 技の id では なく「えんしゅつの なまえ（anim）」で ひく。技の データの anim に ここの なまえを 書く（例 anim: 'snow_queen_sig'）。
// battlefx.js の play() で battlefx-jobs8.js の つぎに よばれる（ここに ない anim なら false を かえす）。
//
// 看板の技（なまえは '<職業の id>_sig'）
//  snow_queen_sig   雪の女王 … 画面が 夜の 青に なり 雪が ふる → 下から 氷の 城が たち上がる → 手もとに 大きな 雪の けっしょう →
//                   ふぶきが 敵を つつみ、敵ごとに 大きな 雪の けっしょうが はじける
//  fifth_spirit_sig 第5のせいれい … 4つの せいれいの 光（風の みどり・火の オレンジ・水の 青・大地の 土色）が まわりを 回り →
//                   まん中に 集まって 5つめの しるし（ひし形）が かがやく → 白く 光る 大きな 光の 道が 敵へ → 4色の わが ひろがる
// ほかの 技
//  r41b_snow_shot    雪の けっしょうが くるくる 回って 飛び、はじける
//  r41b_ice_wall     すきとおった 氷の かべが 仲間の 前に つき出す（みかた）
//  r41b_snowman      おしゃべりな 雪だるまが ぴょんぴょん はねる・回復の 光（みかた）
//  r41b_snow_giant   大きな 雪の 大男が 後ろから あらわれ、ずしんと 足ぶみ
//  r41b_song         すきとおった 音符と 雪の けっしょうが 舞う（みかた）
//  r41b_water_heal   水の 馬が しぶきを 上げて 走りぬける（みかた）
//  r41b_spirit_bless 4つの せいれいの 光が 仲間の まわりを 回って 1つに なる（みかた）
// ・どれも 2.2びょう いないで おわる。あたる じかんは R41B_HIT（battle.js の HIT_DELAY に まぜる）
// ・みかたに つかう えんしゅつ（PARTY_ANIMS_R41B）は、battle.js が がめんの 下の まん中に 出す

const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const fadeOut = (t, from = 0.7) => (t < from ? 1 : Math.max(0, 1 - (t - from) / (1 - from)));

export const R41B_SIG_JOBS = ['snow_queen', 'fifth_spirit'];
export const R41B_SIGS = R41B_SIG_JOBS.map((j) => `${j}_sig`);
export const R41B_MOVES = ['r41b_snow_shot', 'r41b_ice_wall', 'r41b_snowman', 'r41b_snow_giant', 'r41b_song', 'r41b_water_heal', 'r41b_spirit_bless'];
export const R41B_ANIMS = new Set([...R41B_SIGS, ...R41B_MOVES]);
// みかたに つかう ことが ある えんしゅつ（敵が いない ときは がめんの 下に 大きく 出す）
export const PARTY_ANIMS_R41B = new Set(['r41b_ice_wall', 'r41b_snowman', 'r41b_song', 'r41b_water_heal', 'r41b_spirit_bless']);
// あたる じかん（ms。ダメージの 数字を この ときに 出す）
export const R41B_HIT = {
  snow_queen_sig: 820, fifth_spirit_sig: 860, r41b_snow_shot: 300, r41b_snow_giant: 540,
};
// たたかいの 音（battle.js の ANIM_SFX に まぜる。audio.js・sfx-r26.js・sfx-r33.js に ある 音）
export const R41B_SFX = {
  snow_queen_sig: 'ice', fifth_spirit_sig: 'void', r41b_snow_shot: 'ice', r41b_ice_wall: 'buff', r41b_snowman: 'pon',
  r41b_snow_giant: 'rumble', r41b_song: 'r33_moon', r41b_water_heal: 'splash', r41b_spirit_bless: 'kirari',
};
// 4つの せいれいの いろ（風・火・水・大地）[まんなか, まわり]
const SPIRIT_COLS = [['#d8ffe0', '#3ac86a'], ['#fff0c0', '#ff7a2a'], ['#e0f4ff', '#3a8ae8'], ['#f6e4c0', '#a8743a']];
const ICE = ['#ffffff', '#cfefff', '#8fd0f2'];

// ───────────── え の ぶひん ─────────────
function softGlow(x, cx, cy, r, col, a) {
  const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, col);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalAlpha = a;
  x.fillStyle = g;
  x.fillRect(cx - r, cy - r, r * 2, r * 2);
}
// 雪の けっしょう（6本の うで・えだ）。s: 大きさ
function flakeShape(x, s, col, w) {
  x.strokeStyle = col;
  x.lineWidth = w;
  x.beginPath();
  for (let i = 0; i < 6; i++) {
    const q = (i * Math.PI) / 3;
    const cx = Math.cos(q), cy = Math.sin(q);
    x.moveTo(0, 0); x.lineTo(cx * 8 * s, cy * 8 * s);
    // えだ（うでの とちゅうから 2本）
    for (const [at, len] of [[0.45, 2.6], [0.72, 1.8]]) {
      const bx = cx * 8 * s * at, by = cy * 8 * s * at;
      for (const sgn of [-1, 1]) {
        const q2 = q + sgn * 0.75;
        x.moveTo(bx, by); x.lineTo(bx + Math.cos(q2) * len * s, by + Math.sin(q2) * len * s);
      }
    }
  }
  x.stroke();
}
// 第5のせいれいの しるし（まん中の ひし形と、上下左右の 小さな しるし）
function spiritMark(x, s) {
  x.beginPath();
  x.moveTo(0, -7 * s); x.lineTo(4.6 * s, 0); x.lineTo(0, 7 * s); x.lineTo(-4.6 * s, 0);
  x.closePath();
}

export const R41B_FINE = {
  // 雪の けっしょう（回りながら。x0→x1 へ 飛ぶ・grow で 大きく なって きえる・vy で ふる）
  j41bflake(x, p, t) {
    const a = fadeOut(t, p.fade ?? 0.65) * clamp01(p.age / 90);
    if (a <= 0) return;
    const k = p.travel ? easeOut(clamp01(p.age / p.travel)) : 1;
    const cx = p.x0 !== undefined ? p.x0 + (p.x1 - p.x0) * k : p.x, cy = p.y0 !== undefined ? p.y0 + (p.y1 - p.y0) * k : p.y;
    const s = (p.s || 1) * (p.grow ? 0.4 + p.grow * easeOut(t) : 1);
    x.save();
    x.translate(cx, cy);
    x.rotate((p.spin || 2) * (p.age / 1000) + (p.ph || 0));
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 12 * s, 'rgba(160,220,255,0.8)', a * 0.6);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.lineCap = 'round';
    flakeShape(x, s, '#5ab0e0', Math.max(1, 2.2 * s));
    flakeShape(x, s, '#ffffff', Math.max(0.6, 1.1 * s));
    x.restore();
  },
  // 氷の 城（下から たち上がる すきとおった 水色の とう。まん中が いちばん 高い）
  j41bpalace(x, p, t) {
    const a = fadeOut(t, 0.72);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 480));
    const towers = [[-54, 26, 9], [-36, 42, 10], [-18, 56, 11], [0, 80, 14], [18, 56, 11], [36, 42, 10], [54, 26, 9]];
    x.save();
    x.globalAlpha = a * 0.88;
    x.translate(p.x, p.y);
    const s = p.s || 1;
    x.scale(s, s);
    for (const [ox, h, w] of towers) {
      const hh = h * rise;
      const g = x.createLinearGradient(0, -hh, 0, 0);
      g.addColorStop(0, 'rgba(240,252,255,0.95)');
      g.addColorStop(1, 'rgba(90,176,224,0.35)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(ox - w / 2, 0); x.lineTo(ox - w / 2, -hh + w * 0.8); x.lineTo(ox, -hh - w * 0.9); x.lineTo(ox + w / 2, -hh + w * 0.8); x.lineTo(ox + w / 2, 0);
      x.closePath();
      x.fill();
      x.strokeStyle = '#ffffff';
      x.lineWidth = 0.8;
      x.stroke();
      // まん中の すじ（氷の かがやき）
      x.strokeStyle = 'rgba(255,255,255,0.7)';
      x.beginPath(); x.moveTo(ox, -hh - w * 0.6); x.lineTo(ox, -hh * 0.2); x.stroke();
    }
    x.restore();
  },
  // 氷の かべ（とがった 氷の 柱が 3本 ならんで つき出す）
  j41bwall(x, p, t) {
    const a = fadeOut(t, 0.7);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 260));
    x.save();
    x.globalAlpha = a * 0.9;
    x.translate(p.x, p.y);
    for (const [ox, h, w] of [[-9, 22, 7], [0, 32, 9], [9, 24, 7]]) {
      const hh = h * rise * (p.s || 1);
      const g = x.createLinearGradient(0, -hh, 0, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(120,196,240,0.45)');
      x.fillStyle = g;
      x.beginPath();
      x.moveTo(ox - w / 2, 0); x.lineTo(ox - w * 0.35, -hh * 0.75); x.lineTo(ox, -hh); x.lineTo(ox + w * 0.35, -hh * 0.75); x.lineTo(ox + w / 2, 0);
      x.closePath();
      x.fill();
      x.strokeStyle = '#e8f8ff';
      x.lineWidth = 0.8;
      x.stroke();
    }
    x.restore();
  },
  // ゆかいな 雪だるま（ぴょんぴょん はねる。2つの 雪玉・木の えだの うで・オレンジの 鼻）
  j41bsnowman(x, p, t) {
    const a = fadeOut(t, 0.75) * clamp01(p.age / 120);
    if (a <= 0) return;
    const hop = Math.abs(Math.sin(p.age / 160)) * 6;
    x.save();
    x.globalAlpha = a;
    x.translate(p.x, p.y - hop);
    const s = p.s || 1;
    x.scale(s, s);
    x.fillStyle = '#c8e4f4';
    x.beginPath(); x.ellipse(0, 0, 8.4, 7.2, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(0, -11, 6, 5.6, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(-0.8, -0.6, 7.6, 6.4, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(-0.6, -11.4, 5.2, 4.8, 0, 0, Math.PI * 2); x.fill();
    // 目・ボタン・鼻
    x.fillStyle = '#1e1a26';
    for (const [ex, ey] of [[-2, -12.6], [1.8, -12.6], [0, -2], [0, 1.6]]) { x.beginPath(); x.arc(ex, ey, 0.8, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = '#ff8a2a';
    x.beginPath(); x.moveTo(0, -11); x.lineTo(5, -10.4); x.lineTo(0, -9.8); x.closePath(); x.fill();
    // 木の えだの うで（手を ふる）
    const wave = Math.sin(p.age / 90) * 0.4;
    x.strokeStyle = '#6a4024';
    x.lineWidth = 1.1;
    x.beginPath();
    x.moveTo(-7, -3); x.lineTo(-13, -8 + wave * 6);
    x.moveTo(7, -3); x.lineTo(13, -8 - wave * 6);
    x.stroke();
    // 頭の 上の えだ
    x.beginPath(); x.moveTo(0, -16); x.lineTo(0, -19.5); x.moveTo(0, -18); x.lineTo(1.8, -20); x.stroke();
    x.restore();
  },
  // 雪の 大男（後ろから のびあがる 白い 大きな かげ・とがった 氷の かた・光る 目）
  j41bgiant(x, p, t) {
    const a = fadeOut(t, 0.72);
    if (a <= 0) return;
    const rise = easeOut(clamp01(p.age / 380));
    const stomp = p.age > 400 && p.age < 560 ? Math.sin(((p.age - 400) / 160) * Math.PI) * 4 : 0;
    x.save();
    x.globalAlpha = a * 0.85;
    x.translate(p.x, p.y + (1 - rise) * 60 + stomp);
    const s = p.s || 1;
    x.scale(s, s);
    const g = x.createLinearGradient(0, -70, 0, 10);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(150,206,240,0.55)');
    x.fillStyle = g;
    // からだ（大きな 雪の かたまり）・あたま・うで
    x.beginPath(); x.ellipse(0, -18, 30, 26, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(0, -52, 15, 13, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(-34, -14, 9, 18, 0.3, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(34, -14, 9, 18, -0.3, 0, Math.PI * 2); x.fill();
    // かたと 頭の 氷の とげ
    x.fillStyle = 'rgba(200,236,255,0.95)';
    for (const [ox, oy, h] of [[-22, -38, 14], [-12, -44, 10], [12, -44, 10], [22, -38, 14], [-6, -64, 9], [6, -64, 9]]) {
      x.beginPath(); x.moveTo(ox - 3, oy); x.lineTo(ox, oy - h); x.lineTo(ox + 3, oy); x.closePath(); x.fill();
    }
    // 光る 目
    x.fillStyle = '#5ab0f0';
    for (const ex of [-5, 5]) { x.beginPath(); x.ellipse(ex, -53, 2.4, 1.4, 0, 0, Math.PI * 2); x.fill(); }
    x.restore();
  },
  // すきとおった 音符（ゆらゆら 上る）
  j41bnote(x, p, t) {
    const a = fadeOut(t, 0.6) * clamp01(p.age / 120);
    if (a <= 0) return;
    const s = p.age / 1000;
    const cx = p.x + Math.sin(s * 5 + (p.ph || 0)) * 5, cy = p.y - s * (p.rise || 34);
    x.save();
    x.globalAlpha = a;
    x.translate(cx, cy);
    x.fillStyle = p.c || '#cfefff';
    x.strokeStyle = p.c || '#cfefff';
    x.lineWidth = 1.2;
    x.beginPath(); x.ellipse(0, 0, 2.6, 2, -0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(2.2, -0.6); x.lineTo(2.2, -9); x.quadraticCurveTo(5.2, -7, 5, -4.6); x.stroke();
    x.restore();
  },
  // せいれいの 光の たま（cx,cy の まわりを 回る。shrink で 半径が 小さく なって まん中へ）
  j41borb(x, p, t) {
    const a = fadeOut(t, 0.8) * clamp01(p.age / 120);
    if (a <= 0) return;
    const q = p.shrink ? clamp01(p.age / p.shrink) : 0;
    const r = p.r * (1 - q * q);
    const ang = (p.ph || 0) + (p.age / 1000) * (p.spd || 5);
    const cx = p.cx + Math.cos(ang) * r, cy = p.cy + Math.sin(ang) * r * 0.55;
    const [hi, col] = SPIRIT_COLS[p.n || 0];
    x.save();
    x.globalCompositeOperation = 'lighter';
    softGlow(x, cx, cy, 11, col, a * 0.8);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    x.fillStyle = col;
    x.beginPath(); x.arc(cx, cy, 3.2, 0, Math.PI * 2); x.fill();
    x.fillStyle = hi;
    x.beginPath(); x.arc(cx, cy, 2, 0, Math.PI * 2); x.fill();
    x.restore();
  },
  // 5つめの しるし（まん中の 白い ひし形と、上下左右に 4色の 小さな ひし形。大きく なって きえる）
  j41bmark(x, p, t) {
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const s = (p.s || 1) * (0.5 + 0.7 * easeOut(clamp01(p.age / 360)));
    x.save();
    x.translate(p.x, p.y);
    x.globalCompositeOperation = 'lighter';
    softGlow(x, 0, 0, 26 * s, 'rgba(220,244,255,0.95)', a * 0.8);
    x.globalCompositeOperation = 'source-over';
    x.globalAlpha = a;
    SPIRIT_COLS.forEach(([hi, col], i) => {
      const q = -Math.PI / 2 + (i * Math.PI) / 2;
      x.save();
      x.translate(Math.cos(q) * 14 * s, Math.sin(q) * 14 * s);
      x.fillStyle = col;
      spiritMark(x, s * 0.42);
      x.fill();
      x.restore();
    });
    x.fillStyle = '#8fd0f2';
    spiritMark(x, s * 1.12);
    x.fill();
    x.fillStyle = '#ffffff';
    spiritMark(x, s);
    x.fill();
    x.restore();
  },
  // 白く 光る 光の 道（x0,y0 から x1,y1 へ のびる）
  j41bbeam(x, p, t) {
    const a = fadeOut(t, 0.55);
    if (a <= 0) return;
    const k = easeOut(clamp01(p.age / (p.travel || 240)));
    const ex = p.x0 + (p.x1 - p.x0) * k, ey = p.y0 + (p.y1 - p.y0) * k;
    const w = (p.w || 24) * (0.55 + 0.45 * k);
    x.save();
    x.globalCompositeOperation = 'lighter';
    x.globalAlpha = a;
    x.lineCap = 'round';
    for (const [lw, c] of [[w * 1.5, 'rgba(90,150,230,0.5)'], [w, 'rgba(160,220,255,0.85)'], [w * 0.5, 'rgba(236,250,255,0.95)'], [w * 0.2, '#ffffff']]) {
      x.strokeStyle = c;
      x.lineWidth = lw;
      x.beginPath(); x.moveTo(p.x0, p.y0); x.lineTo(ex, ey); x.stroke();
    }
    softGlow(x, ex, ey, w * 1.3, 'rgba(230,248,255,0.9)', a * 0.8);
    x.restore();
  },
  // 水の 馬（すきとおった 青い 馬が しぶきを 上げて x0 → x1 へ 走る）
  j41bhorse(x, p, t) {
    const a = fadeOut(t, 0.7) * clamp01(p.age / 120);
    if (a <= 0) return;
    const k = clamp01(p.age / (p.travel || 700));
    const cx = p.x0 + (p.x1 - p.x0) * k, cy = p.y - Math.abs(Math.sin(p.age / 90)) * 3;
    const d = p.x1 >= p.x0 ? 1 : -1;
    x.save();
    x.globalAlpha = a * 0.8;
    x.translate(cx, cy);
    x.scale(d * (p.s || 1), p.s || 1);
    const g = x.createLinearGradient(0, -24, 0, 8);
    g.addColorStop(0, 'rgba(230,250,255,0.95)');
    g.addColorStop(1, 'rgba(58,138,232,0.55)');
    x.fillStyle = g;
    // からだ・くび・あたま・足（かけている 形）
    x.beginPath(); x.ellipse(0, -6, 14, 6.4, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.moveTo(8, -8); x.lineTo(15, -20); x.lineTo(20, -18); x.lineTo(14, -5); x.closePath(); x.fill();
    x.beginPath(); x.ellipse(20, -19, 5.4, 3, 0.35, 0, Math.PI * 2); x.fill();
    const sw = Math.sin(p.age / 70) * 4;
    x.strokeStyle = 'rgba(120,196,240,0.85)';
    x.lineWidth = 2.6;
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(9, -2); x.lineTo(13 + sw, 7);
    x.moveTo(5, -2); x.lineTo(2 - sw, 7);
    x.moveTo(-8, -2); x.lineTo(-4 + sw, 7);
    x.moveTo(-11, -2); x.lineTo(-15 - sw, 7);
    x.stroke();
    // たてがみと しっぽ（白い しぶき）
    x.strokeStyle = 'rgba(255,255,255,0.9)';
    x.lineWidth = 1.6;
    x.beginPath();
    x.moveTo(15, -21); x.quadraticCurveTo(9, -16, 7, -10);
    x.moveTo(-13, -7); x.quadraticCurveTo(-20, -6, -24, 0);
    x.stroke();
    x.restore();
  },
};

// ───────────── エフェクト ─────────────
// fx: Effects（battlefx.js）  targets: [{ x, y }]  W・H: がめんの 大きさ
export function playR41bFx(fx, anim, targets, element, opts = {}, W = 256, H = 144) {
  if (!R41B_ANIMS.has(anim) || !targets || !targets.length) return false;
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
    case 'snow_queen_sig': {
      // 1) 夜の 青・雪が ふる
      fx.tintAt('rgba(8, 20, 48, 0.55)', 1900);
      for (let k = 0; k < 18; k++) fx.add({ kind: 'j41bflake', x: rnd(6, W - 6), y: rnd(-10, H * 0.4), vy: rnd(14, 26), vx: rnd(-6, 6), s: rnd(0.35, 0.6), spin: rnd(-3, 3), ph: rnd(0, 6), life: 1700, delay: k * 30 });
      // 2) 下から 氷の 城
      fx.add({ kind: 'j41bpalace', x: W * 0.5, y: H + 2, s: 1.25, life: 1600, delay: 150 });
      // 3) 手もとに 大きな 雪の けっしょう
      fx.add({ kind: 'j41bflake', x: from.x, y: fy - 8, s: 1.6, grow: 0.8, spin: 3, life: 760, delay: 200 });
      fx.glow(from.x, fy - 8, { color: '#cfefff', r: 30, delay: 300, life: 460 });
      // 4) ふぶきが 敵を つつむ
      for (let k = 0; k < 6; k++) fx.gust(tx - 70, ty - 24 + k * 9, { len: 110, amp: 5, color: k % 2 ? '#ffffff' : '#cfefff', w: 1.4, dir: 1, delay: 460 + k * 50, life: 420 });
      each((t, i, d) => {
        for (let k = 0; k < 3; k++) fx.add({ kind: 'j41bflake', x0: from.x + rnd(-20, 20), y0: fy - 10, x1: t.x + rnd(-10, 10), y1: t.y + rnd(-10, 6), x: t.x, y: t.y, s: 0.7, spin: 6, travel: 300, life: 460, delay: 480 + d + k * 40 });
        // 5) 敵ごとに 大きな 雪の けっしょうが はじける
        fx.add({ kind: 'j41bflake', x: t.x, y: t.y, s: 1.4 * sz, grow: 1, spin: 1.5, fade: 0.5, life: 700, delay: 800 + d });
        hitMark(t, 820 + d, '#8fd0f2', 22);
        fx.shock(t.x, t.y, { r0: 6, r1: 54 * sz, color: '#e8f8ff', w: 2.5, delay: 820 + d, life: 420 });
        fx.debris(t.x, t.y + 10, ICE, all ? 6 : 10, 840 + d, 110);
      });
      fx.flashAt(100, '#e8f8ff', 820);
      fx.hitStop(crit ? 280 : 220, 820, 1.8);
      return true;
    }
    case 'fifth_spirit_sig': {
      // 1) 4つの せいれいの 光が まわりを 回る
      fx.tintAt('rgba(6, 10, 34, 0.6)', 2000);
      for (let n = 0; n < 4; n++) fx.add({ kind: 'j41borb', cx: from.x, cy: fy - 6, x: from.x, y: fy, r: 34, n, ph: (n * Math.PI) / 2, spd: 6, shrink: 560, life: 640 });
      for (let k = 0; k < 14; k++) fx.twinkle(rnd(8, W - 8), rnd(4, H * 0.5), { color: k % 2 ? '#cfefff' : '#ffffff', size: rnd(3, 6), delay: k * 40, life: 800 });
      // 2) まん中に 集まって 5つめの しるし
      fx.add({ kind: 'j41bmark', x: from.x, y: fy - 8, s: 1.3, life: 900, delay: 520 });
      fx.flashAt(70, '#ffffff', 560);
      // 3) 白く 光る 光の 道
      each((t, i, d) => {
        fx.add({ kind: 'j41bbeam', x0: from.x, y0: fy - 8, x1: t.x, y1: t.y, x: t.x, y: t.y, w: all ? 20 : 28, travel: 220, life: 720, delay: 640 + d });
        // 4) 4色の わ
        hitMark(t, 860 + d, '#cfefff', 22);
        SPIRIT_COLS.forEach(([, col], n) => fx.shock(t.x, t.y, { r0: 6, r1: (34 + n * 8) * sz, color: col, w: 2, delay: 860 + d + n * 50, life: 420 }));
        fx.sparks(t.x, t.y, { colors: SPIRIT_COLS.map(([, c]) => c), n: all ? 8 : 14, speed: 170, delay: 880 + d, life: 420, len: 8 });
      });
      fx.flashAt(110, '#f0faff', 860);
      fx.hitStop(crit ? 300 : 240, 860, 2.2);
      // みかたにも 光（悪い じょうたいを 治す）
      fx.glow(from.x, fy, { color: '#e8f8ff', r: 40, delay: 1000, life: 600 });
      return true;
    }
    // ───── 雪の女王 ─────
    case 'r41b_snow_shot': {
      // 雪の けっしょうが くるくる 回って 飛び、はじける
      each((t, i, d) => {
        fx.add({ kind: 'j41bflake', x0: from.x, y0: fy - 6, x1: t.x, y1: t.y, x: t.x, y: t.y, s: 0.9, spin: 9, travel: 280, fade: 0.8, life: 320, delay: d });
        fx.add({ kind: 'j41bflake', x: t.x, y: t.y, s: 1.1, grow: 0.9, spin: 2, fade: 0.4, life: 420, delay: 290 + d });
        hitMark(t, 300 + d, '#8fd0f2', 16);
        for (let k = 0; k < 5; k++) fx.twinkle(t.x + rnd(-14, 14), t.y + rnd(-14, 10), { color: '#ffffff', size: 5, delay: 320 + d + k * 40, life: 340 });
      });
      return true;
    }
    case 'r41b_ice_wall': {
      // すきとおった 氷の かべが つき出す（みかた）
      for (const t of targets) {
        fx.add({ kind: 'j41bwall', x: t.x, y: t.y + 12, s: 1, life: 900 });
        fx.glow(t.x, t.y, { color: '#cfefff', r: 26, delay: 160, life: 460 });
        fx.debris(t.x, t.y + 10, ICE, 5, 80, 60);
        fx.arrows(t.x, t.y, '#8fd0f2', true, 3, 300);
      }
      return true;
    }
    case 'r41b_snowman': {
      // ゆかいな 雪だるまが はねて、みんなに 回復の 光（みかた）
      fx.add({ kind: 'j41bsnowman', x: Math.min(W - 20, tx + 34), y: Math.min(H - 10, ty + 14), s: 1, life: 1300 });
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#e8f8ff', r: 22, delay: 360, life: 420 });
        for (let k = 0; k < 4; k++) fx.add({ kind: 'j41bflake', x: t.x + rnd(-12, 12), y: t.y - rnd(6, 20), vy: 12, s: 0.35, spin: 4, life: 700, delay: 300 + k * 60 });
      }
      return true;
    }
    case 'r41b_snow_giant': {
      // 雪の 大男が 後ろから あらわれて、ずしんと 足ぶみ
      fx.tintAt('rgba(10, 24, 48, 0.4)', 1300);
      fx.add({ kind: 'j41bgiant', x: tx, y: Math.min(H, ty + 26), s: all ? 1 : 0.85, life: 1200 });
      each((t, i, d) => {
        hitMark(t, 540 + d, '#8fd0f2', 18);
        fx.debris(t.x, t.y + 10, ICE, all ? 6 : 9, 540 + d, 120);
      });
      for (let k = 0; k < 10; k++) fx.puff(tx + rnd(-60, 60), Math.min(H - 6, ty + 20), { color: '#ffffff', r0: 3, r1: 10, vy: -20, life: 520, alpha: 0.7, delay: 520 + k * 20 });
      fx.hitStop(crit ? 220 : 180, 540, 2);
      return true;
    }
    case 'r41b_song': {
      // すきとおった 音符と 雪の けっしょうが 舞う（みかた）
      fx.tintAt('rgba(20, 50, 90, 0.25)', 1000);
      for (const t of targets) {
        for (let k = 0; k < 4; k++) fx.add({ kind: 'j41bnote', x: t.x + rnd(-14, 14), y: t.y + rnd(-2, 8), ph: rnd(0, 6), rise: rnd(26, 40), c: k % 2 ? '#ffffff' : '#cfefff', life: 900, delay: k * 90 });
        fx.add({ kind: 'j41bflake', x: t.x, y: t.y - 6, s: 0.8, spin: 2.5, life: 800, delay: 120 });
        fx.arrows(t.x, t.y, '#cfefff', true, 3, 320);
      }
      fx.swirl(tx, ty + 10, ICE, { n: 18, rad: 30, h: 46, life: 900 });
      return true;
    }
    // ───── 第5のせいれい ─────
    case 'r41b_water_heal': {
      // 水の 馬が しぶきを 上げて 走りぬける（みかた）
      const y = Math.min(H - 8, ty + 14);
      fx.add({ kind: 'j41bhorse', x0: -20, x1: W + 20, x: tx, y, s: 1.1, travel: 800, life: 860 });
      for (let k = 0; k < 12; k++) fx.drop(rnd(10, W - 10), y - rnd(0, 6), { color: k % 2 ? '#8fd0f2' : '#e8f8ff', vx: rnd(-30, 30), vy: -rnd(40, 80), g: 200, size: 1.6, delay: 100 + k * 50, life: 600 });
      for (const t of targets) {
        fx.glow(t.x, t.y, { color: '#a8dcf6', r: 24, delay: 320, life: 460 });
        fx.shock(t.x, t.y + 8, { r0: 4, r1: 24, color: '#cfefff', w: 1.4, delay: 340, life: 420, sy: 0.4 });
      }
      return true;
    }
    case 'r41b_spirit_bless': {
      // 4つの せいれいの 光が 仲間の まわりを 回って 1つに なる（みかた）
      for (const t of targets) {
        for (let n = 0; n < 4; n++) fx.add({ kind: 'j41borb', cx: t.x, cy: t.y, x: t.x, y: t.y, r: 20, n, ph: (n * Math.PI) / 2, spd: 7, shrink: 700, life: 760 });
        fx.glow(t.x, t.y, { color: '#ffffff', r: 26, delay: 640, life: 420 });
        fx.arrows(t.x, t.y, '#ffffff', true, 3, 620);
      }
      return true;
    }
  }
  return false;
}
