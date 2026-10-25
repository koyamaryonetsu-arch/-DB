// 第48回 G1（ドラゴンボール ＋ ドラえもん ＋ はなかっぱ）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g1_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g1_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G1 だけが さわる。はなつ しゅんかんに なる（あたる 音は battle.js が 数と いっしょに ならす）
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた

// ビームの ズオォ（はばが 太い ほど ひくく ながく）
const beam = (a, T, { f = 140, dur = 0.6, vol = 0.45, hi = 2400, delay = 0 } = {}) => {
  a.noise(0.07, { vol: vol * 0.9, type: 'highpass', from: 3000, to: 3000, delay });
  a.noise(dur, { vol, delay: delay + 0.03, from: hi, to: 80 });
  T(f, dur * 0.85, { vol: 0.16, type: 'saw', slide: f * 0.45, delay: delay + 0.02 });
};
// キュイィン（気が たまる）
const whine = (T, f0, f1, dur, vol = 0.06, delay = 0) => T(f0, dur, { vol, type: 'saw', slide: f1, delay, attack: dur * 0.8 });
// ドン（あたる）
const boom = (a, T, { vol = 0.5, delay = 0, dur = 0.5, f = 80 } = {}) => {
  a.noise(dur, { vol, delay, from: 1800, to: 50 });
  T(f, dur * 0.8, { vol: 0.22, type: 'triangle', slide: f * 0.4, delay });
};
// バチバチ（いなずま）
const zap = (a, n, delay = 0, gap = 0.05, vol = 0.22) => { for (let i = 0; i < n; i++) a.noise(0.035, { vol, delay: delay + i * gap, type: 'highpass', from: 4000, to: 4000 }); };
// ポン・ポカッ（コミカル）
const pon = (T, f = 660, delay = 0, vol = 0.12) => { T(f, 0.08, { vol, type: 'square', slide: f * 1.6, delay }); T(f * 2, 0.06, { vol: vol * 0.5, type: 'triangle', delay: delay + 0.04 }); };
// ポロリン（回復）
const chime = (T, notes, delay = 0, gap = 0.06, vol = 0.06, type = 'triangle') => notes.forEach((f, i) => T(f, 0.22, { vol, type, delay: delay + i * gap }));
// ゴォォ（オーラ）
const roar = (a, T, { dur = 0.6, vol = 0.32, f = 90, delay = 0 } = {}) => {
  a.noise(dur, { vol, delay, from: 300, to: 900, type: 'lowpass' });
  T(f, dur, { vol: 0.12, type: 'saw', slide: f * 1.8, delay, attack: dur * 0.4 });
};
// シュッ（風）
const swish = (a, delay = 0, vol = 0.3, from = 900, to = 3200) => a.noise(0.14, { vol, delay, type: 'bandpass', from, to, q: 3 });

export const SFX_AX_G1 = {
  // ───── サイヤ人 ─────
  ax_g1_kidan: (a, T) => { T(1400, 0.1, { vol: 0.1, type: 'square', slide: 500 }); swish(a, 0, 0.25, 2000, 5000); boom(a, T, { vol: 0.35, delay: 0.16, dur: 0.3, f: 140 }); },
  ax_g1_kiai: (a, T) => { roar(a, T, { dur: 0.45, vol: 0.28 }); a.noise(0.18, { vol: 0.4, delay: 0.42, from: 2000, to: 200 }); T(220, 0.14, { vol: 0.14, type: 'saw', slide: 110, delay: 0.42 }); },
  ax_g1_renzoku: (a, T) => { for (let i = 0; i < 10; i++) { a.noise(0.06, { vol: 0.3, delay: i * 0.045, from: 2400, to: 300 }); T(900 - i * 30, 0.04, { vol: 0.05, type: 'square', delay: i * 0.045 }); } boom(a, T, { vol: 0.35, delay: 0.5, dur: 0.3 }); },
  ax_g1_taiyo: (a, T) => { T(2637, 0.6, { vol: 0.08, type: 'sine', attack: 0.05 }); T(3520, 0.5, { vol: 0.05, type: 'sine', delay: 0.04 }); a.noise(0.5, { vol: 0.2, type: 'highpass', from: 6000, to: 8000 }); },
  ax_g1_kame: (a, T) => { whine(T, 300, 1200, 0.12, 0.06); beam(a, T, { f: 150, dur: 0.5, vol: 0.4, delay: 0.1 }); boom(a, T, { vol: 0.3, delay: 0.27, dur: 0.3 }); },
  ax_g1_bukuu: (a) => { a.noise(0.45, { vol: 0.22, type: 'bandpass', from: 300, to: 1200, q: 2 }); },
  ax_g1_ozaru: (a, T) => { T(110, 0.7, { vol: 0.22, type: 'saw', slide: 70, attack: 0.1 }); T(165, 0.6, { vol: 0.12, type: 'square', slide: 90, delay: 0.05 }); a.noise(0.7, { vol: 0.4, delay: 0.1, from: 800, to: 60 }); },
  ax_g1_rush: (a, T) => { for (let i = 0; i < 10; i++) a.noise(0.05, { vol: 0.32, delay: 0.09 + i * 0.038, from: 2600, to: 400 }); boom(a, T, { vol: 0.42, delay: 0.5, dur: 0.28, f: 120 }); T(1800, 0.06, { vol: 0.08, type: 'square', delay: 0.5 }); },
  ax_g1_bigbang: (a, T) => { T(2000, 0.12, { vol: 0.08, type: 'sine', slide: 900 }); a.noise(0.3, { vol: 0.3, from: 3000, to: 1200, type: 'bandpass' }); boom(a, T, { vol: 0.6, delay: 0.3, dur: 0.5, f: 70 }); },
  ax_g1_kaiouken: (a, T) => { a.noise(0.08, { vol: 0.5, from: 3000, to: 600 }); roar(a, T, { dur: 0.6, vol: 0.4, f: 70 }); T(440, 0.2, { vol: 0.08, type: 'square', slide: 880, delay: 0.2 }); },
  ax_g1_kienzan: (a, T) => { T(600, 0.36, { vol: 0.07, type: 'saw', slide: 1400 }); for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.12, delay: i * 0.05, type: 'bandpass', from: 1500 + i * 200, to: 3000, q: 6 }); a.noise(0.14, { vol: 0.45, delay: 0.33, type: 'highpass', from: 3000, to: 8000 }); },
  // ───── スーパーサイヤ人 ─────
  ax_g1_kame2: (a, T) => { whine(T, 300, 1500, 0.14, 0.07); beam(a, T, { f: 130, dur: 0.62, vol: 0.5, delay: 0.12 }); T(1760, 0.3, { vol: 0.04, type: 'triangle', delay: 0.15 }); boom(a, T, { vol: 0.4, delay: 0.3, dur: 0.4 }); },
  ax_g1_ssj: (a, T) => { boom(a, T, { vol: 0.55, dur: 0.35, f: 90 }); roar(a, T, { dur: 0.55, vol: 0.35, f: 80, delay: 0.15 }); zap(a, 4, 0.15, 0.08, 0.15); },
  ax_g1_kikouha: (a, T) => { a.noise(0.7, { vol: 0.42, from: 600, to: 2400 }); T(180, 0.6, { vol: 0.14, type: 'saw', slide: 100 }); boom(a, T, { vol: 0.35, delay: 0.27, dur: 0.4 }); },
  ax_g1_zanzou: (a) => { [0, 0.12, 0.24].forEach((d) => swish(a, d, 0.3, 1500, 6000)); },
  ax_g1_ikari: (a, T) => { a.noise(0.1, { vol: 0.55, type: 'highpass', from: 2000, to: 2000, delay: 0.04 }); a.noise(0.6, { vol: 0.45, delay: 0.1, from: 900, to: 40 }); roar(a, T, { dur: 0.5, vol: 0.3, delay: 0.25 }); },
  ax_g1_final: (a, T) => { T(500, 0.15, { vol: 0.08, type: 'saw', slide: 1600 }); beam(a, T, { f: 180, dur: 0.6, vol: 0.5, hi: 3000, delay: 0.14 }); zap(a, 5, 0.2, 0.08, 0.12); },
  ax_g1_renzoku2: (a, T) => { for (let i = 0; i < 16; i++) a.noise(0.06, { vol: 0.3, delay: 0.19 + i * (0.04 - i * 0.0012), from: 2600, to: 300 }); boom(a, T, { vol: 0.4, delay: 0.7, dur: 0.1 }); },
  ax_g1_bbkame: (a, T) => { whine(T, 400, 1600, 0.15, 0.06); T(900, 0.15, { vol: 0.05, type: 'triangle', slide: 1800 }); beam(a, T, { f: 120, dur: 0.6, vol: 0.5, delay: 0.14 }); boom(a, T, { vol: 0.35, delay: 0.32, dur: 0.4 }); },
  ax_g1_spark: (a, T) => { zap(a, 6, 0, 0.04, 0.25); boom(a, T, { vol: 0.5, delay: 0.23, dur: 0.35, f: 110 }); zap(a, 5, 0.25, 0.05, 0.2); },
  // ───── 超サイヤ人2 ─────
  ax_g1_kame3: (a, T) => { zap(a, 4, 0, 0.04, 0.2); beam(a, T, { f: 120, dur: 0.62, vol: 0.55, delay: 0.13 }); zap(a, 6, 0.2, 0.06, 0.18); boom(a, T, { vol: 0.45, delay: 0.33, dur: 0.45, f: 70 }); },
  ax_g1_ss2aura: (a, T) => { zap(a, 8, 0, 0.05, 0.22); roar(a, T, { dur: 0.7, vol: 0.38, f: 75 }); },
  ax_g1_rush2: (a, T) => { for (let i = 0; i < 14; i++) a.noise(0.045, { vol: 0.3, delay: 0.16 + i * 0.033, from: 3000, to: 400 }); zap(a, 4, 0.2, 0.12, 0.15); boom(a, T, { vol: 0.55, delay: 0.72, dur: 0.08, f: 100 }); },
  ax_g1_kiaihou: (a, T) => { T(330, 0.12, { vol: 0.12, type: 'square', slide: 160 }); a.noise(0.6, { vol: 0.5, delay: 0.04, type: 'bandpass', from: 200, to: 900, q: 1.5 }); boom(a, T, { vol: 0.35, delay: 0.2, dur: 0.4, f: 60 }); },
  ax_g1_finalkame: (a, T) => { whine(T, 300, 1400, 0.18, 0.07); T(600, 0.18, { vol: 0.05, type: 'square', slide: 1800 }); beam(a, T, { f: 110, dur: 0.58, vol: 0.6, delay: 0.18 }); zap(a, 5, 0.25, 0.07, 0.15); },
  ax_g1_masenkou: (a, T) => { T(3000, 0.1, { vol: 0.08, type: 'sine', slide: 4200 }); a.noise(0.1, { vol: 0.5, delay: 0.02, type: 'highpass', from: 4000, to: 7000 }); a.noise(0.5, { vol: 0.35, delay: 0.08, from: 5000, to: 300 }); T(2093, 0.4, { vol: 0.04, type: 'triangle', delay: 0.1 }); },
  // ───── 超サイヤ人3 ─────
  ax_g1_ryuuken: (a, T) => { a.noise(0.3, { vol: 0.35, from: 400, to: 1600 }); T(220, 0.4, { vol: 0.14, type: 'saw', slide: 660, delay: 0.38 }); a.noise(0.38, { vol: 0.4, delay: 0.4, type: 'bandpass', from: 800, to: 3000, q: 2 }); boom(a, T, { vol: 0.4, delay: 0.42, dur: 0.35 }); },
  ax_g1_kame4: (a, T) => { whine(T, 200, 1800, 0.22, 0.09); beam(a, T, { f: 90, dur: 0.56, vol: 0.65, hi: 2000, delay: 0.2 }); T(60, 0.42, { vol: 0.25, type: 'triangle', slide: 35, delay: 0.36 }); },
  ax_g1_ss3: (a, T) => { a.noise(0.8, { vol: 0.5, from: 200, to: 60 }); roar(a, T, { dur: 0.7, vol: 0.4, f: 60 }); zap(a, 8, 0.05, 0.08, 0.2); },
  ax_g1_shunkan: (a, T) => { T(1760, 0.05, { vol: 0.1, type: 'sine' }); swish(a, 0.12, 0.4, 2000, 8000); swish(a, 0.24, 0.3, 8000, 2000); boom(a, T, { vol: 0.5, delay: 0.38, dur: 0.35, f: 110 }); },
  ax_g1_rengeki: (a, T) => { for (let i = 0; i < 12; i++) swish(a, i * 0.055, 0.22, 1500, 5000); boom(a, T, { vol: 0.55, delay: 0.72, dur: 0.08, f: 70 }); },
  ax_g1_genki: (a, T) => { chime(T, [1047, 1319, 1568, 2093, 2637, 3136], 0, 0.06, 0.05, 'sine'); a.noise(0.5, { vol: 0.35, delay: 0.25, from: 300, to: 900 }); T(80, 0.4, { vol: 0.2, type: 'triangle', slide: 40, delay: 0.4 }); },
  ax_g1_kame10: (a, T) => { whine(T, 200, 1600, 0.22, 0.09); T(150, 0.6, { vol: 0.12, type: 'square', slide: 70, delay: 0.2 }); beam(a, T, { f: 85, dur: 0.54, vol: 0.65, hi: 2000, delay: 0.22 }); },
  // ───── はかい神 ─────
  ax_g1_hakai: (a, T) => { T(1568, 0.4, { vol: 0.04, type: 'sine', delay: 0.1, attack: 0.2 }); T(2093, 0.3, { vol: 0.05, type: 'sine', delay: 0.45 }); a.noise(0.3, { vol: 0.15, delay: 0.48, type: 'highpass', from: 5000, to: 9000 }); },
  ax_g1_kimagure: (a, T) => { pon(T, 520, 0.05); pon(T, 700, 0.14); pon(T, 880, 0.23); T(660, 0.2, { vol: 0.08, type: 'triangle', slide: 990, delay: 0.3 }); },
  ax_g1_hirune: (a, T) => { [523, 392, 330].forEach((f, i) => T(f, 0.26, { vol: 0.06, type: 'sine', delay: i * 0.2 })); },
  ax_g1_kami: (a, T) => { a.noise(0.8, { vol: 0.45, from: 250, to: 60 }); T(70, 0.7, { vol: 0.2, type: 'saw', slide: 45 }); T(105, 0.7, { vol: 0.1, type: 'saw', slide: 66 }); },
  ax_g1_ikari2: (a, T) => { roar(a, T, { dur: 0.75, vol: 0.45, f: 55 }); a.noise(0.5, { vol: 0.35, delay: 0.28, from: 600, to: 50 }); },
  ax_g1_hakaidama: (a, T) => { whine(T, 200, 900, 0.4, 0.08); a.noise(0.4, { vol: 0.35, from: 200, to: 600 }); boom(a, T, { vol: 0.7, delay: 0.7, dur: 0.1, f: 50 }); },
  ax_g1_pudding: (a, T) => { T(300, 0.2, { vol: 0.12, type: 'sine', slide: 120, delay: 0.3 }); a.noise(0.2, { vol: 0.5, delay: 0.44, from: 800, to: 80 }); T(220, 0.25, { vol: 0.1, type: 'sine', slide: 330, delay: 0.55 }); },
  // ───── 合体技 ─────
  ax_g1_gomukame: (a, T) => { T(200, 0.35, { vol: 0.14, type: 'triangle', slide: 700 }); T(240, 0.35, { vol: 0.06, type: 'square', slide: 900 }); beam(a, T, { f: 130, dur: 0.4, vol: 0.5, delay: 0.35 }); },
  // ───── ネコ型ロボット・ドラえもん ─────
  ax_g1_poka: (a, T) => { T(300, 0.12, { vol: 0.12, type: 'triangle', slide: 600 }); a.noise(0.08, { vol: 0.4, delay: 0.18, from: 2000, to: 400 }); pon(T, 880, 0.19, 0.1); },
  ax_g1_pon: (a, T) => { pon(T, 660, 0); chime(T, [784, 988, 1319], 0.22, 0.05); },
  ax_g1_pon2: (a, T) => { pon(T, 660, 0); pon(T, 880, 0.1); chime(T, [784, 988, 1319, 1568], 0.26, 0.05); },
  ax_g1_pocket: (a, T) => { for (let i = 0; i < 4; i++) { a.noise(0.06, { vol: 0.2, delay: i * 0.07, type: 'bandpass', from: 900, to: 1800, q: 2 }); pon(T, 400 + i * 120, i * 0.07 + 0.03, 0.06); } chime(T, [1047, 1319], 0.3, 0.06); },
  ax_g1_suzu: (a, T) => { [0, 0.16, 0.32].forEach((d) => { T(2349, 0.25, { vol: 0.06, type: 'sine', delay: d }); T(3136, 0.2, { vol: 0.04, type: 'sine', delay: d + 0.02 }); }); },
  ax_g1_tackle: (a, T) => { swish(a, 0, 0.3, 600, 2000); boom(a, T, { vol: 0.4, delay: 0.19, dur: 0.25, f: 120 }); pon(T, 500, 0.2, 0.06); },
  ax_g1_fullpower: (a, T) => { T(300, 0.25, { vol: 0.1, type: 'saw', slide: 900 }); boom(a, T, { vol: 0.45, delay: 0.2, dur: 0.3 }); for (let i = 0; i < 4; i++) T(1800 + i * 300, 0.05, { vol: 0.05, type: 'square', delay: 0.22 + i * 0.05 }); },
  ax_g1_gotsun: (a, T) => { T(500, 0.2, { vol: 0.1, type: 'triangle', slide: 200 }); boom(a, T, { vol: 0.5, delay: 0.26, dur: 0.3, f: 160 }); T(1200, 0.3, { vol: 0.05, type: 'sine', slide: 600, delay: 0.3 }); },
  ax_g1_wahn: (a, T) => { T(700, 0.7, { vol: 0.1, type: 'square', slide: 500 }); T(720, 0.7, { vol: 0.06, type: 'square', slide: 480, delay: 0.02 }); a.noise(0.5, { vol: 0.2, delay: 0.2, type: 'bandpass', from: 2400, to: 500, q: 1.5 }); },
  ax_g1_mogu: (a, T) => { for (let i = 0; i < 5; i++) T(260 + (i % 2) * 60, 0.06, { vol: 0.12, type: 'triangle', delay: i * 0.06 }); chime(T, [784, 988, 1319], 0.34, 0.05); },
  ax_g1_shuuri: (a, T) => { for (let i = 0; i < 5; i++) T(1400 + (i % 2) * 400, 0.04, { vol: 0.08, type: 'square', delay: i * 0.06 }); chime(T, [659, 880, 1175], 0.34, 0.05); },
  ax_g1_gyaa: (a, T) => { T(900, 0.4, { vol: 0.12, type: 'square', slide: 1400 }); for (let i = 0; i < 6; i++) a.noise(0.06, { vol: 0.35, delay: 0.42 + i * 0.06, from: 2000, to: 200 }); },
  ax_g1_gorogoro: (a, T) => { a.noise(0.3, { vol: 0.3, from: 300, to: 600, type: 'bandpass', q: 2 }); boom(a, T, { vol: 0.42, delay: 0.26, dur: 0.3, f: 110 }); },
  ax_g1_dokan: (a, T) => { a.noise(0.15, { vol: 0.2, from: 3000, to: 300, type: 'bandpass', q: 2 }); boom(a, T, { vol: 0.65, delay: 0.1, dur: 0.5, f: 70 }); },
  ax_g1_light: (a, T) => { T(1047, 0.4, { vol: 0.06, type: 'sine', slide: 1568 }); T(1200, 0.4, { vol: 0.07, type: 'saw', slide: 300, delay: 0.3 }); },
  ax_g1_copter: (a, T) => { for (let i = 0; i < 12; i++) a.noise(0.04, { vol: 0.18, delay: i * 0.05, type: 'bandpass', from: 300, to: 400, q: 3 }); T(220, 0.6, { vol: 0.05, type: 'saw', slide: 330 }); },
  ax_g1_tetere: (a, T) => { [523, 659, 784, 1047].forEach((f, i) => T(f, i === 3 ? 0.4 : 0.1, { vol: 0.12, type: 'square', delay: i * 0.09 })); T(1568, 0.4, { vol: 0.05, type: 'triangle', delay: 0.27 }); },
  ax_g1_furoshiki: (a, T) => { swish(a, 0, 0.25, 600, 1500); for (let i = 0; i < 4; i++) T(1500, 0.03, { vol: 0.08, type: 'square', delay: 0.25 + i * 0.1 }); chime(T, [1319, 1760, 2093], 0.46, 0.04, 0.06, 'sine'); },
  ax_g1_bakudan: (a, T) => { a.noise(0.5, { vol: 0.15, type: 'highpass', from: 4000, to: 6000 }); boom(a, T, { vol: 0.7, delay: 0.6, dur: 0.2, f: 60 }); },
  ax_g1_biglight: (a, T) => { T(1047, 0.3, { vol: 0.06, type: 'sine', slide: 1568 }); T(300, 0.4, { vol: 0.1, type: 'triangle', slide: 120, delay: 0.35 }); },
  // ───── カッパ・はなかっぱ・筋肉ニンニク ─────
  ax_g1_bashi: (a) => { for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.35, delay: 0.07 + i * 0.07, type: 'highpass', from: 1500, to: 4000 }); },
  ax_g1_pori: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.04, { vol: 0.3, delay: i * 0.07, type: 'bandpass', from: 2500, to: 3500, q: 4 }); chime(T, [784, 1047], 0.28); },
  ax_g1_pyu: (a) => { a.noise(0.25, { vol: 0.3, type: 'bandpass', from: 1500, to: 4000, q: 2 }); a.noise(0.3, { vol: 0.35, delay: 0.25, type: 'bandpass', from: 2400, to: 400, q: 1.5 }); },
  ax_g1_picho: (a, T) => { [0, 0.07, 0.14].forEach((d) => T(1500, 0.08, { vol: 0.08, type: 'sine', slide: 2600, delay: d + 0.1 })); T(2637, 0.2, { vol: 0.05, type: 'triangle', delay: 0.26 }); },
  ax_g1_dosukoi: (a, T) => { T(180, 0.15, { vol: 0.12, type: 'square', slide: 120 }); boom(a, T, { vol: 0.5, delay: 0.2, dur: 0.3, f: 100 }); },
  ax_g1_zabaan: (a) => { a.noise(0.4, { vol: 0.35, from: 400, to: 1800 }); a.noise(0.5, { vol: 0.45, delay: 0.3, type: 'bandpass', from: 2400, to: 300, q: 1.2 }); },
  ax_g1_shushu: (a) => { for (let i = 0; i < 5; i++) swish(a, i * 0.04, 0.22, 3000, 6000); },
  ax_g1_hanabira: (a) => { a.noise(0.3, { vol: 0.2, type: 'bandpass', from: 600, to: 2000, q: 3 }); a.noise(0.12, { vol: 0.4, delay: 0.29, type: 'highpass', from: 3000, to: 7000 }); },
  ax_g1_hakushon: (a, T) => { a.noise(0.3, { vol: 0.12, type: 'bandpass', from: 500, to: 900, q: 2 }); T(500, 0.12, { vol: 0.1, type: 'square', slide: 900, delay: 0.3 }); a.noise(0.2, { vol: 0.5, delay: 0.38, from: 4000, to: 600 }); },
  ax_g1_mitsu: (a, T) => { [0.06, 0.12, 0.18].forEach((d) => T(880, 0.08, { vol: 0.06, type: 'sine', slide: 1320, delay: d })); chime(T, [784, 988, 1319], 0.32, 0.05); },
  ax_g1_pakkaan: (a, T) => { T(400, 0.1, { vol: 0.1, type: 'triangle', slide: 300 }); pon(T, 700, 0.1, 0.14); a.noise(0.3, { vol: 0.35, delay: 0.12, from: 3000, to: 500 }); chime(T, [1047, 1319, 1568], 0.2, 0.04); },
  ax_g1_sake: (a, T) => { T(200, 0.4, { vol: 0.08, type: 'triangle', slide: 700 }); pon(T, 880, 0.42, 0.14); chime(T, [1047, 1319, 1568, 2093], 0.44, 0.04); },
  ax_g1_fubuki: (a) => { a.noise(0.8, { vol: 0.35, type: 'bandpass', from: 500, to: 2500, q: 1.5 }); },
  ax_g1_mukimuki: (a, T) => { a.noise(0.06, { vol: 0.3, from: 2000, to: 600 }); T(110, 0.4, { vol: 0.18, type: 'saw', slide: 220, delay: 0.1 }); T(1760, 0.2, { vol: 0.06, type: 'sine', delay: 0.4 }); T(2637, 0.2, { vol: 0.04, type: 'sine', delay: 0.46 }); },
  ax_g1_dogo: (a, T) => { swish(a, 0, 0.3, 400, 1500); boom(a, T, { vol: 0.6, delay: 0.24, dur: 0.4, f: 90 }); },
  ax_g1_kiran: (a, T) => { [0.1, 0.17, 0.24].forEach((d, i) => T(2093 + i * 400, 0.2, { vol: 0.06, type: 'sine', delay: d })); T(300, 0.3, { vol: 0.06, type: 'triangle', slide: 150, delay: 0.34 }); },
  ax_g1_shaka: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.25, delay: i * 0.06, type: 'highpass', from: 3000, to: 5000 }); a.noise(0.25, { vol: 0.2, delay: 0.5, from: 1200, to: 300 }); },
  ax_g1_dododo: (a, T) => { for (let i = 0; i < 5; i++) boom(a, T, { vol: 0.35, delay: 0.28 + i * 0.09, dur: 0.15, f: 100 }); },
  ax_g1_muscleflower: (a, T) => { T(110, 0.3, { vol: 0.16, type: 'saw', slide: 220 }); pon(T, 700, 0.2, 0.12); boom(a, T, { vol: 0.65, delay: 0.56, dur: 0.22, f: 70 }); },
  ax_g1_bomber: (a, T) => { for (let i = 0; i < 5; i++) boom(a, T, { vol: 0.4, delay: 0.44 + i * 0.04, dur: 0.18, f: 90 }); },
};
