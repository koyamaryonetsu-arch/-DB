// 第48回 G2（ナルト ＋ ワンピース ＋ 京急 ＋ 野球）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g2_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g2_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G2 だけが さわる
const bon = (a, T, d = 0, vol = 0.4) => { a.noise(0.18, { vol, delay: d, from: 1400, to: 120 }); T(180, 0.12, { vol: 0.14, delay: d, type: 'sine', slide: 70 }); };
const don = (a, T, d = 0, vol = 0.5) => { a.noise(0.35, { vol, delay: d, from: 1600, to: 60 }); T(90, 0.3, { vol: 0.28, delay: d, type: 'triangle', slide: 40 }); };
const whoosh = (a, d = 0, dur = 0.25, vol = 0.3) => a.noise(dur, { vol, delay: d, type: 'bandpass', from: 600, to: 3000, q: 2 });
const kin = (T, d = 0, vol = 0.08) => { T(2637, 0.12, { vol, delay: d, type: 'square' }); T(3951, 0.2, { vol: vol * 0.6, delay: d + 0.02, type: 'triangle' }); };
const kakiin = (a, T, d = 0) => { T(2093, 0.05, { vol: 0.16, delay: d, type: 'square' }); T(3136, 0.35, { vol: 0.1, delay: d + 0.02, type: 'triangle' }); a.noise(0.08, { vol: 0.25, delay: d, from: 6000, to: 2000 }); };
const horn = (T, d = 0, dur = 0.35, vol = 0.07) => { T(659, dur, { vol, delay: d, type: 'square' }); T(880, dur, { vol: vol * 0.8, delay: d, type: 'square' }); };
const gatan = (a, d = 0, n = 4, gap = 0.12) => { for (let i = 0; i < n; i++) a.noise(0.06, { vol: 0.28, delay: d + i * gap, from: 900, to: 200 }); };
const scale = (T, notes, d = 0, gap = 0.06, type = 'pulse', vol = 0.07) => notes.forEach((f, i) => T(f, gap * 1.6, { vol, delay: d + i * gap, type }));
const DOREMI = [523, 587, 659, 698, 784, 880, 988, 1047];

export const SFX_AX_G2 = {
  // ── ナルト ──
  ax_g2_kunai: (a, T) => { [0, 0.05, 0.1].forEach((d) => a.noise(0.06, { vol: 0.3, delay: d, type: 'highpass', from: 3000, to: 6000 })); kin(T, 0.2); kin(T, 0.26, 0.06); },
  ax_g2_pop: (a, T) => { [0, 0.07, 0.14, 0.21].forEach((d) => bon(a, T, d, 0.32)); },
  ax_g2_rasengan: (a, T) => { T(400, 0.4, { vol: 0.08, type: 'saw', slide: 1600 }); for (let i = 0; i < 4; i++) a.noise(0.1, { vol: 0.2, delay: 0.1 + i * 0.07, type: 'bandpass', from: 1200, to: 2400, q: 5 }); don(a, T, 0.44, 0.55); },
  ax_g2_sennin: (a, T) => { a.noise(0.5, { vol: 0.25, from: 300, to: 80 }); T(1568, 0.3, { vol: 0.06, delay: 0.3, type: 'sine' }); T(2093, 0.3, { vol: 0.05, delay: 0.36, type: 'sine' }); },
  ax_g2_senpuu: (a, T) => { a.noise(0.35, { vol: 0.3, type: 'bandpass', from: 400, to: 2600, q: 3 }); a.noise(0.1, { vol: 0.45, delay: 0.34, from: 3000, to: 400 }); T(200, 0.1, { vol: 0.14, delay: 0.34, slide: 80 }); },
  ax_g2_shuriken: (a, T) => { T(3000, 0.55, { vol: 0.05, type: 'sine', slide: 3600 }); T(3200, 0.55, { vol: 0.04, type: 'sine', slide: 3900 }); a.noise(0.7, { vol: 0.5, delay: 0.58, from: 2800, to: 60 }); },
  ax_g2_kunai_ame: (a, T) => { [0, 0.06, 0.12].forEach((d) => bon(a, T, d, 0.25)); for (let i = 0; i < 8; i++) a.noise(0.04, { vol: 0.25, delay: 0.3 + i * 0.05, type: 'highpass', from: 3500, to: 6000 }); kin(T, 0.48, 0.06); },
  ax_g2_oodama: (a, T) => { T(300, 0.5, { vol: 0.09, type: 'saw', slide: 1200 }); for (let i = 0; i < 4; i++) a.noise(0.12, { vol: 0.2, delay: i * 0.1, type: 'bandpass', from: 800, to: 2000, q: 4 }); a.noise(0.7, { vol: 0.65, delay: 0.55, from: 1800, to: 40 }); T(70, 0.4, { vol: 0.3, delay: 0.55, type: 'triangle', slide: 30 }); },
  ax_g2_kyuubi: (a, T) => { a.noise(0.7, { vol: 0.4, from: 500, to: 2500 }); T(110, 0.6, { vol: 0.12, type: 'saw', slide: 220 }); a.noise(0.3, { vol: 0.2, delay: 0.45, type: 'highpass', from: 3000, to: 6000 }); },
  ax_g2_mamori: (a, T) => { a.noise(0.2, { vol: 0.35, type: 'bandpass', from: 300, to: 1200, q: 1.5 }); T(1319, 0.3, { vol: 0.07, delay: 0.38, type: 'sine' }); T(1760, 0.3, { vol: 0.06, delay: 0.42, type: 'sine' }); },
  ax_g2_bijuu: (a, T) => { T(60, 0.7, { vol: 0.2, type: 'saw', slide: 140 }); T(800, 0.6, { vol: 0.04, type: 'sine', slide: 200 }); a.noise(0.75, { vol: 0.7, delay: 0.05, from: 300, to: 3000 }); },
  ax_g2_ishi: (a, T) => { a.noise(0.15, { vol: 0.3, from: 600, to: 3000 }); a.noise(0.5, { vol: 0.35, delay: 0.3, from: 2400, to: 300 }); T(523, 0.4, { vol: 0.05, delay: 0.35, type: 'triangle' }); },
  ax_g2_tajuu: (a, T) => { for (let i = 0; i < 6; i++) bon(a, T, i * 0.06, 0.24); for (let i = 0; i < 5; i++) a.noise(0.06, { vol: 0.3, delay: 0.42 + i * 0.06, from: 1400, to: 200 }); don(a, T, 0.72, 0.4); },
  ax_g2_tajuu_rasen: (a, T) => { for (let i = 0; i < 4; i++) T(500 + i * 120, 0.25, { vol: 0.05, delay: i * 0.12, type: 'saw', slide: 1500 }); don(a, T, 0.6, 0.55); },
  // ── ワンピース ──
  ax_g2_pistol: (a, T) => { T(300, 0.14, { vol: 0.1, type: 'saw', slide: 900 }); don(a, T, 0.15, 0.5); T(400, 0.3, { vol: 0.08, delay: 0.3, type: 'sine', slide: 150 }); },
  ax_g2_gatling: (a, T) => { for (let i = 0; i < 12; i++) { a.noise(0.05, { vol: 0.34, delay: i * 0.055, from: 1800, to: 200 }); T(140, 0.04, { vol: 0.1, delay: i * 0.055, type: 'triangle' }); } },
  ax_g2_fusen: (a, T) => { a.noise(0.25, { vol: 0.18, type: 'bandpass', from: 1500, to: 600, q: 2 }); T(200, 0.3, { vol: 0.12, delay: 0.25, type: 'sine', slide: 500 }); T(160, 0.2, { vol: 0.14, delay: 0.55, type: 'sine', slide: 300 }); },
  ax_g2_steam: (a) => { a.noise(0.75, { vol: 0.35, type: 'highpass', from: 2500, to: 6000 }); a.noise(0.3, { vol: 0.2, delay: 0.2, type: 'highpass', from: 4000, to: 7000 }); },
  ax_g2_bazooka: (a, T) => { T(200, 0.25, { vol: 0.1, type: 'saw', slide: 700 }); don(a, T, 0.28, 0.65); },
  ax_g2_gigant: (a, T) => { a.noise(0.3, { vol: 0.3, type: 'highpass', from: 2000, to: 5000 }); T(120, 0.35, { vol: 0.12, delay: 0.05, type: 'sine', slide: 60 }); a.noise(0.45, { vol: 0.7, delay: 0.42, from: 1400, to: 40 }); T(55, 0.35, { vol: 0.35, delay: 0.42, type: 'triangle', slide: 30 }); },
  ax_g2_muchi: (a, T) => { T(300, 0.25, { vol: 0.08, type: 'sine', slide: 900 }); a.noise(0.06, { vol: 0.5, delay: 0.28, type: 'highpass', from: 4000, to: 6000 }); a.noise(0.16, { vol: 0.3, delay: 0.3, from: 3000, to: 400 }); },
  ax_g2_bound: (a, T) => { [0, 0.22, 0.44].forEach((d) => { T(120, 0.16, { vol: 0.18, delay: d, type: 'sine', slide: 260 }); a.noise(0.08, { vol: 0.2, delay: d, from: 800, to: 200 }); }); a.noise(0.3, { vol: 0.15, delay: 0.5, type: 'highpass', from: 3000, to: 6000 }); },
  // ドン・ドットット（解放の ドラム）
  ax_g2_drum: (a, T) => { [[0, 1], [0.18, 0.6], [0.26, 0.6], [0.48, 1], [0.66, 0.6], [0.74, 0.6]].forEach(([d, v]) => { T(v > 0.8 ? 80 : 120, 0.14, { vol: 0.32 * v, delay: d, type: 'sine', slide: 50 }); a.noise(0.06, { vol: 0.22 * v, delay: d, from: 900, to: 200 }); }); },
  ax_g2_kaminari: (a, T) => { a.noise(0.08, { vol: 0.6, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.3, { vol: 0.4, delay: 0.06, from: 900, to: 100 }); a.noise(0.4, { vol: 0.5, delay: 0.4, type: 'highpass', from: 1500, to: 3000 }); T(1600, 0.2, { vol: 0.05, delay: 0.4, type: 'saw', slide: 300 }); },
  ax_g2_sunpunch: (a, T) => { T(200, 0.5, { vol: 0.1, type: 'saw', slide: 900 }); a.noise(0.5, { vol: 0.3, type: 'bandpass', from: 400, to: 2000, q: 2 }); don(a, T, 0.6, 0.7); },
  ax_g2_haha: (a, T) => { [0, 0.16, 0.32, 0.48].forEach((d, i) => { T(520 + i * 40, 0.1, { vol: 0.08, delay: d, type: 'pulse', slide: 380 }); a.noise(0.06, { vol: 0.1, delay: d, type: 'bandpass', from: 1200, to: 900, q: 3 }); }); },
  ax_g2_kaihou: (a, T) => { [[0, 1], [0.15, 0.6], [0.22, 0.6]].forEach(([d, v]) => T(90, 0.12, { vol: 0.3 * v, delay: d, type: 'sine', slide: 50 })); T(150, 0.3, { vol: 0.14, delay: 0.32, type: 'sine', slide: 420 }); don(a, T, 0.58, 0.7); },
  ax_g2_manga: (a, T) => { T(300, 0.3, { vol: 0.1, type: 'sine', slide: 1200 }); T(1200, 0.2, { vol: 0.08, delay: 0.3, type: 'sine', slide: 300 }); a.noise(0.3, { vol: 0.55, delay: 0.5, from: 1800, to: 100 }); T(880, 0.1, { vol: 0.08, delay: 0.52, type: 'square' }); },
  // ── 京急 ──
  ax_g2_doremi: (a, T) => { scale(T, DOREMI, 0, 0.075, 'square', 0.06); },
  ax_g2_train: (a, T) => { horn(T, 0, 0.3); gatan(a, 0.1, 3, 0.1); don(a, T, 0.35, 0.55); },
  ax_g2_gashin: (a, T) => { a.noise(0.2, { vol: 0.5, delay: 0.2, from: 2000, to: 300 }); T(220, 0.3, { vol: 0.14, delay: 0.2, type: 'square', slide: 110 }); kin(T, 0.25, 0.05); },
  ax_g2_clock: (a, T) => { T(2093, 0.05, { vol: 0.1, type: 'square' }); for (let i = 0; i < 6; i++) T(1600, 0.03, { vol: 0.07, delay: 0.15 + i * 0.08, type: 'square' }); },
  ax_g2_renketsu: (a, T) => { gatan(a, 0, 2, 0.1); a.noise(0.12, { vol: 0.5, delay: 0.28, from: 3000, to: 600 }); T(400, 0.08, { vol: 0.14, delay: 0.28, type: 'square' }); a.noise(0.4, { vol: 0.4, delay: 0.4, from: 800, to: 120 }); },
  ax_g2_kaitoku: (a, T) => { horn(T, 0, 0.45, 0.08); a.noise(0.8, { vol: 0.45, delay: 0.1, from: 400, to: 1800 }); gatan(a, 0.2, 4, 0.11); },
  ax_g2_airport: (a, T) => { T(1800, 0.45, { vol: 0.03, type: 'sine', slide: 1500 }); a.noise(0.4, { vol: 0.2, type: 'highpass', from: 2000, to: 4000 }); horn(T, 0.3, 0.25); don(a, T, 0.48, 0.45); },
  ax_g2_gourei: (a, T) => { T(1400, 0.08, { vol: 0.12, type: 'square' }); T(1400, 0.08, { vol: 0.12, delay: 0.12, type: 'square' }); scale(T, [523, 659, 784, 1047], 0.3, 0.07, 'triangle', 0.08); },
  ax_g2_tokkyu: (a, T) => { a.noise(0.5, { vol: 0.4, from: 300, to: 1500 }); horn(T, 0.2, 0.35); don(a, T, 0.45, 0.5); },
  ax_g2_kan: (a, T) => { [0, 0.15, 0.3].forEach((d) => { T(2200, 0.18, { vol: 0.1, delay: d + 0.12, type: 'triangle' }); a.noise(0.04, { vol: 0.25, delay: d + 0.12, type: 'highpass', from: 4000, to: 6000 }); }); },
  ax_g2_daiya: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.18, delay: i * 0.06, type: 'highpass', from: 3000, to: 6000 }); a.noise(0.2, { vol: 0.3, delay: 0.4, type: 'bandpass', from: 4000, to: 1000, q: 2 }); },
  ax_g2_12ryou: (a, T) => { horn(T, 0, 0.5, 0.08); a.noise(0.8, { vol: 0.5, delay: 0.05, from: 300, to: 1200 }); gatan(a, 0.1, 6, 0.1); },
  ax_g2_zensen: (a, T) => { horn(T, 0, 0.18); horn(T, 0.2, 0.18); horn(T, 0.4, 0.2); a.noise(0.4, { vol: 0.65, delay: 0.62, from: 2000, to: 50 }); },
  ax_g2_bonus: (a, T) => { scale(T, [523, 659, 784, 1047, 1319], 0, 0.06, 'triangle', 0.09); a.noise(0.4, { vol: 0.2, delay: 0.3, type: 'highpass', from: 5000, to: 8000 }); },
  ax_g2_oikoshi: (a, T) => { a.noise(0.4, { vol: 0.35, from: 300, to: 1400 }); horn(T, 0.25, 0.3); don(a, T, 0.55, 0.5); },
  // ── 野球 ──
  ax_g2_nitoryu: (a, T) => { whoosh(a, 0, 0.15, 0.35); a.noise(0.1, { vol: 0.4, delay: 0.2, from: 2500, to: 300 }); kakiin(a, T, 0.34); },
  ax_g2_5050: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.25, delay: i * 0.07, from: 900, to: 200 }); kakiin(a, T, 0.37); },
  ax_g2_sleep: (a, T) => { T(392, 0.3, { vol: 0.06, type: 'sine', slide: 330 }); T(330, 0.3, { vol: 0.05, delay: 0.35, type: 'sine', slide: 262 }); },
  ax_g2_fanfare: (a, T) => { scale(T, [523, 659, 784], 0, 0.08, 'square', 0.07); T(1047, 0.4, { vol: 0.08, delay: 0.26, type: 'square' }); T(1319, 0.4, { vol: 0.06, delay: 0.26, type: 'triangle' }); },
  ax_g2_real: (a, T) => { whoosh(a, 0, 0.2, 0.35); kakiin(a, T, 0.4); a.noise(0.3, { vol: 0.4, delay: 0.55, from: 2000, to: 200 }); },
  ax_g2_100mile: (a, T) => { a.noise(0.3, { vol: 0.45, type: 'bandpass', from: 500, to: 3000, q: 2 }); don(a, T, 0.3, 0.6); },
  ax_g2_yokoku: (a, T) => { a.noise(0.06, { vol: 0.4, delay: 0.28, type: 'highpass', from: 4000, to: 6000 }); T(1568, 0.3, { vol: 0.06, delay: 0.3, type: 'sine' }); T(2093, 0.4, { vol: 0.05, delay: 0.36, type: 'sine' }); },
  ax_g2_makyu: (a, T) => { whoosh(a, 0, 0.12, 0.3); T(800, 0.2, { vol: 0.04, delay: 0.15, type: 'sine', slide: 2000 }); don(a, T, 0.6, 0.6); },
  ax_g2_oo: (a, T) => { a.noise(0.5, { vol: 0.3, delay: 0.25, type: 'bandpass', from: 500, to: 800, q: 2 }); T(220, 0.45, { vol: 0.08, delay: 0.25, type: 'saw' }); T(277, 0.45, { vol: 0.06, delay: 0.25, type: 'saw' }); },
  ax_g2_sanshin: (a, T) => { [0.4, 0.55, 0.7].forEach((d) => { a.noise(0.06, { vol: 0.4, delay: d - 0.38, type: 'highpass', from: 3000, to: 5000 }); a.noise(0.08, { vol: 0.35, delay: d - 0.2, from: 2000, to: 300 }); }); },
  ax_g2_allstar: (a, T) => { [0.33, 0.36, 0.39, 0.42].forEach((d) => kakiin(a, T, d)); a.noise(0.3, { vol: 0.3, delay: 0.6, type: 'highpass', from: 2000, to: 5000 }); },
  ax_g2_sayonara: (a, T) => { kakiin(a, T, 0.43); T(2637, 0.4, { vol: 0.06, delay: 0.45, type: 'triangle' }); a.noise(0.3, { vol: 0.3, delay: 0.55, type: 'bandpass', from: 500, to: 1500, q: 1 }); },
  ax_g2_3daseki: (a, T) => { [0.24, 0.64].forEach((d) => kakiin(a, T, d)); },
  ax_g2_speech: (a, T) => { T(1000, 0.08, { vol: 0.05, type: 'sine' }); for (let i = 0; i < 10; i++) a.noise(0.03, { vol: 0.18, delay: 0.3 + i * 0.05, type: 'highpass', from: 2000, to: 4000 }); },
};
