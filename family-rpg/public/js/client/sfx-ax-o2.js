// 第49回 O2（こぶし・守り・魔物・闇）: もとからの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o2_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o2_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは O2 だけが さわる。はなつ しゅんかんに 1回 ならす（plan-r49-fx.md 5章の「音」の ふんいき）
// ── 音の ぶひん ──
const hit = (a, T, d = 0, v = 0.4) => { a.noise(0.14, { vol: v, delay: d, from: 2200, to: 200 }); T(110, 0.12, { vol: v * 0.35, delay: d, type: 'triangle', slide: 55 }); };
const boom = (a, T, d = 0, v = 0.5, len = 0.5) => { a.noise(len, { vol: v, delay: d, from: 1800, to: 40 }); T(75, len * 0.7, { vol: v * 0.45, delay: d, type: 'triangle', slide: 32 }); };
const swish = (a, d = 0, v = 0.25, from = 800, to = 3200, dur = 0.16) => a.noise(dur, { vol: v, delay: d, type: 'bandpass', from, to, q: 2 });
const snap = (a, T, d = 0, v = 0.45) => { a.noise(0.04, { vol: v, delay: d, type: 'highpass', from: 2600, to: 2600 }); a.noise(0.1, { vol: v * 0.5, delay: d + 0.02, from: 4000, to: 900 }); T(1900, 0.03, { vol: 0.06, delay: d, type: 'square' }); };
const chime = (T, notes, d = 0, step = 0.06, type = 'sine', vol = 0.05, dur = 0.25) => notes.forEach((f, i) => T(f, dur, { vol, delay: d + i * step, type }));
const sparkle = (T, d = 0, vol = 0.04) => chime(T, [2093, 2637, 3136, 3520], d, 0.045, 'sine', vol, 0.2);
const zan = (a, d = 0, v = 0.4) => { a.noise(0.1, { vol: v, delay: d, type: 'highpass', from: 2500, to: 7000 }); a.noise(0.18, { vol: v * 0.7, delay: d + 0.06, from: 3200, to: 300 }); };
const zap = (a, d = 0, n = 4, vol = 0.18) => { for (let i = 0; i < n; i++) a.noise(0.035, { vol, delay: d + i * 0.05, type: 'highpass', from: 4200, to: 4200 }); };
const thunder = (a, T, d = 0, v = 0.5) => { a.noise(0.06, { vol: v, delay: d, type: 'highpass', from: 2600, to: 2600 }); a.noise(0.4, { vol: v * 0.85, delay: d + 0.04, from: 1000, to: 40 }); T(1600, 0.08, { vol: 0.05, type: 'saw', slide: 300, delay: d }); };
const roar = (a, T, d = 0, v = 0.3, f = 150, dur = 0.5) => { T(f, dur, { vol: v * 0.6, delay: d, type: 'saw', slide: f * 0.55 }); T(f * 1.5, dur * 0.9, { vol: v * 0.35, delay: d + 0.03, type: 'square', slide: f * 0.7 }); a.noise(dur, { vol: v, delay: d, from: 900, to: 160 }); };
const howl = (T, d = 0, v = 0.08, f = 420) => { T(f, 0.25, { vol: v, delay: d, type: 'triangle', slide: f * 1.6, attack: 0.15 }); T(f * 1.6, 0.45, { vol: v, delay: d + 0.25, type: 'triangle', slide: f * 1.1 }); };
const flap = (a, d = 0, n = 2, gap = 0.1, vol = 0.22) => { for (let i = 0; i < n; i++) a.noise(0.1, { vol, delay: d + i * gap, type: 'bandpass', from: 1200, to: 400, q: 1.5 }); };
const kin = (T, f, d = 0, v = 0.05) => { T(f, 0.3, { vol: v, type: 'sine', delay: d }); T(f * 1.5, 0.24, { vol: v * 0.6, type: 'sine', delay: d + 0.02 }); };
const wobble = (T, d = 0, v = 0.06, f = 300) => { for (let i = 0; i < 4; i++) T(f + (i % 2) * 80, 0.1, { vol: v, delay: d + i * 0.08, type: 'sine', slide: f + 160 }); };
const pop = (a, T, d = 0, v = 0.12) => { T(500, 0.08, { vol: v, delay: d, type: 'sine', slide: 1200 }); a.noise(0.06, { vol: 0.15, delay: d, from: 2400, to: 500 }); };
const rumble = (a, d = 0, dur = 0.6, vol = 0.35) => a.noise(dur, { vol, delay: d, from: 300, to: 50 });
const clang = (T, d = 0, v = 0.06) => { T(1320, 0.18, { vol: v, delay: d, type: 'square' }); T(2640, 0.14, { vol: v * 0.6, delay: d, type: 'triangle' }); };
const splash = (a, d = 0, v = 0.3) => { a.noise(0.3, { vol: v, delay: d, type: 'bandpass', from: 1400, to: 500, q: 0.8 }); a.noise(0.2, { vol: v * 0.5, delay: d + 0.08, type: 'highpass', from: 3000, to: 5000 }); };
const fanfare = (T, d = 0) => [523, 659, 784, 1047].forEach((f, i) => T(f, i === 3 ? 0.3 : 0.1, { vol: 0.07, delay: d + i * 0.09, type: 'square' }));

export const SFX_AX_O2 = {
  // ── 武闘家
  ax_o2_punch: (a, T) => { swish(a, 0, 0.2, 600, 2000, 0.12); hit(a, T, 0.18, 0.5); },
  ax_o2_swish: (a) => { swish(a, 0, 0.22, 1000, 3600, 0.12); swish(a, 0.14, 0.22, 3600, 1000, 0.12); },
  ax_o2_rapid4: (a, T) => { for (let i = 0; i < 4; i++) hit(a, T, 0.15 + i * 0.1, 0.35); boom(a, T, 0.5, 0.25, 0.25); },
  ax_o2_kiai: (a, T) => { a.noise(0.12, { vol: 0.3, from: 400, to: 1400 }); T(60, 0.2, { vol: 0.25, delay: 0.22, type: 'sine', slide: 45 }); T(60, 0.2, { vol: 0.2, delay: 0.4, type: 'sine', slide: 45 }); },
  ax_o2_tiger: (a, T) => { roar(a, T, 0, 0.35, 180, 0.3); hit(a, T, 0.26, 0.55); a.noise(0.25, { vol: 0.25, delay: 0.3, from: 1200, to: 100 }); },
  ax_o2_kick: (a, T) => { swish(a, 0, 0.3, 500, 2600, 0.22); hit(a, T, 0.22, 0.4); hit(a, T, 0.28, 0.3); },
  ax_o2_issen: (a, T) => { T(3136, 0.15, { vol: 0.03, type: 'sine' }); a.noise(0.06, { vol: 0.5, delay: 0.2, type: 'highpass', from: 3000, to: 6000 }); boom(a, T, 0.26, 0.5, 0.35); },
  ax_o2_rapid6: (a, T) => { for (let i = 0; i < 6; i++) hit(a, T, 0.14 + i * 0.06, 0.28); boom(a, T, 0.52, 0.5, 0.25); },
  ax_o2_sandan: (a, T) => { for (let i = 0; i < 3; i++) { swish(a, 0.06 + i * 0.13, 0.15, 800, 2400, 0.08); hit(a, T, 0.16 + i * 0.13, 0.4); } },
  ax_o2_senpuu: (a) => { a.noise(0.5, { vol: 0.3, type: 'bandpass', from: 400, to: 2400, q: 1.2 }); a.noise(0.3, { vol: 0.25, delay: 0.3, type: 'bandpass', from: 2400, to: 700, q: 1 }); },
  // ── 聖拳士
  ax_o2_holyfist: (a, T) => { T(880, 0.15, { vol: 0.05, type: 'sine', slide: 1760 }); hit(a, T, 0.2, 0.45); sparkle(T, 0.24); },
  ax_o2_meisou: (a, T) => { T(392, 0.6, { vol: 0.07, type: 'sine' }); T(588, 0.5, { vol: 0.04, delay: 0.1, type: 'sine' }); sparkle(T, 0.35, 0.03); },
  ax_o2_mikiri: (a, T) => { kin(T, 2637, 0, 0.06); T(600, 0.4, { vol: 0.04, delay: 0.15, type: 'sine', slide: 300 }); },
  ax_o2_tenshou: (a, T) => { a.noise(0.6, { vol: 0.3, from: 300, to: 2400 }); chime(T, [1047, 1319, 1568, 2093], 0.25, 0.06, 'sine', 0.05); },
  ax_o2_holyrapid: (a, T) => { for (let i = 0; i < 7; i++) T(1568 + i * 60, 0.05, { vol: 0.04, delay: 0.16 + i * 0.075, type: 'square' }); boom(a, T, 0.62, 0.35, 0.16); },
  // ── ゴッドハンド
  ax_o2_shinsoku: (a, T) => { swish(a, 0, 0.35, 3000, 6000, 0.1); hit(a, T, 0.16, 0.55); hit(a, T, 0.27, 0.45); swish(a, 0.72, 0.18, 4000, 1500, 0.12); },
  ax_o2_tenchi: (a, T) => { T(110, 0.6, { vol: 0.12, type: 'triangle' }); kin(T, 1568, 0.42, 0.06); rumble(a, 0, 0.4, 0.2); },
  ax_o2_musou: (a, T) => { for (let i = 0; i < 4; i++) hit(a, T, 0.2 + i * 0.09, 0.38); boom(a, T, 0.58, 0.55, 0.25); },
  ax_o2_ikazuchi: (a, T) => { hit(a, T, 0.12, 0.5); zap(a, 0.15, 3, 0.15); thunder(a, T, 0.32, 0.55); },
  ax_o2_godhand: (a, T) => { a.noise(0.4, { vol: 0.25, from: 200, to: 900 }); chime(T, [784, 988, 1175], 0, 0.08, 'triangle', 0.05, 0.3); boom(a, T, 0.46, 0.6, 0.34); },
  ax_o2_kudaki: (a, T) => { boom(a, T, 0.14, 0.55, 0.3); rumble(a, 0.3, 0.5, 0.4); },
  // ── ガーディアン
  ax_o2_wall: (a, T) => { rumble(a, 0, 0.36, 0.3); clang(T, 0.36, 0.06); },
  ax_o2_youzai: (a, T) => { rumble(a, 0, 0.3, 0.25); boom(a, T, 0.42, 0.6, 0.38); },
  ax_o2_shieldbash: (a, T) => { swish(a, 0, 0.25, 600, 1800, 0.25); clang(T, 0.32, 0.08); hit(a, T, 0.32, 0.45); zap(a, 0.45, 3, 0.12); },
  ax_o2_protect: (a, T) => { for (let i = 0; i < 4; i++) clang(T, i * 0.09, 0.04); kin(T, 2093, 0.42, 0.06); },
  ax_o2_daichi: (a, T) => { clang(T, 0.14, 0.06); boom(a, T, 0.14, 0.45, 0.3); rumble(a, 0.3, 0.45, 0.35); },
  ax_o2_fortress: (a, T) => { rumble(a, 0, 0.45, 0.35); kin(T, 1760, 0.46, 0.06); kin(T, 2349, 0.56, 0.05); },
  ax_o2_shieldthrow: (a, T) => { T(400, 0.42, { vol: 0.06, type: 'saw', slide: 900 }); clang(T, 0.42, 0.08); T(900, 0.3, { vol: 0.05, delay: 0.46, type: 'saw', slide: 400 }); },
  // ── 海賊
  ax_o2_kaizoku: (a) => { zan(a, 0.1, 0.45); zan(a, 0.22, 0.4); },
  ax_o2_flag: (a) => { flap(a, 0, 3, 0.1, 0.3); a.noise(0.4, { vol: 0.15, delay: 0.3, type: 'bandpass', from: 600, to: 300, q: 1 }); },
  ax_o2_uzushio: (a) => { a.noise(0.5, { vol: 0.25, type: 'bandpass', from: 300, to: 900, q: 1 }); splash(a, 0.3, 0.3); },
  ax_o2_ikari: (a, T) => { for (let i = 0; i < 4; i++) clang(T, i * 0.06, 0.03); boom(a, T, 0.36, 0.6, 0.35); },
  ax_o2_utage: (a, T) => { [392, 523, 392, 659, 784].forEach((f, i) => T(f, 0.14, { vol: 0.07, delay: i * 0.1, type: 'square' })); },
  ax_o2_takara: (a, T) => { sparkle(T, 0.3, 0.05); [0.45, 0.55, 0.65].forEach((d) => clang(T, d, 0.03)); },
  ax_o2_cannon: (a, T) => { a.noise(0.25, { vol: 0.12, type: 'highpass', from: 3000, to: 5000 }); boom(a, T, 0.02, 0.5, 0.3); boom(a, T, 0.42, 0.55, 0.36); },
  // ── 魔物使い
  ax_o2_whip: (a, T) => { swish(a, 0, 0.18, 400, 2000, 0.2); snap(a, T, 0.26, 0.5); },
  ax_o2_beast: (a, T) => { roar(a, T, 0, 0.25, 110, 0.25); roar(a, T, 0.22, 0.35, 170, 0.35); },
  ax_o2_ranbu: (a, T) => { for (let i = 0; i < 3; i++) snap(a, T, 0.2 + i * 0.17, 0.42); },
  ax_o2_kemono: (a, T) => { roar(a, T, 0, 0.25, 130, 0.6); howl(T, 0.05, 0.06, 260); },
  ax_o2_kizuna: (a, T) => { howl(T, 0, 0.07, 500); sparkle(T, 0.4, 0.04); },
  ax_o2_majuu: (a, T) => { zan(a, 0.24, 0.5); a.noise(0.08, { vol: 0.4, delay: 0.54, type: 'bandpass', from: 1500, to: 600, q: 1 }); hit(a, T, 0.7, 0.45); },
  // ── モンスターマスター
  ax_o2_mmwhip: (a, T) => { swish(a, 0, 0.2, 500, 2500, 0.12); swish(a, 0.14, 0.2, 500, 2500, 0.12); snap(a, T, 0.3, 0.55); },
  ax_o2_iyashi: (a, T) => { for (let i = 0; i < 3; i++) T(300 + i * 60, 0.12, { vol: 0.08, delay: i * 0.13, type: 'sine', slide: 600 + i * 60 }); chime(T, [1047, 1319, 1568], 0.42, 0.06); },
  ax_o2_howl: (a, T) => { howl(T, 0, 0.09, 380); howl(T, 0.05, 0.05, 570); rumble(a, 0.1, 0.4, 0.15); },
  ax_o2_mmkizuna: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.04, { vol: 0.15, delay: i * 0.055, from: 1200, to: 400 }); chime(T, [1319, 1568, 1976, 2637], 0.42, 0.05); },
  ax_o2_parade: (a, T) => { for (let i = 0; i < 9; i++) hit(a, T, i * 0.085, 0.22); },
  ax_o2_king: (a, T) => { roar(a, T, 0, 0.4, 140, 0.45); zan(a, 0.46, 0.5); },
  ax_o2_shingeki: (a, T) => { for (let i = 0; i < 5; i++) { a.noise(0.06, { vol: 0.3, delay: 0.3 + i * 0.09, type: 'bandpass', from: 1500, to: 600, q: 1 }); hit(a, T, 0.3 + i * 0.09, 0.25); } },
  // ── 中二病
  ax_o2_migite: (a, T) => { a.noise(0.3, { vol: 0.15, type: 'highpass', from: 2000, to: 5000 }); T(200, 0.2, { vol: 0.08, delay: 0.1, type: 'saw', slide: 80 }); boom(a, T, 0.3, 0.45, 0.3); },
  ax_o2_jakigan: (a, T) => { a.noise(0.05, { vol: 0.3, delay: 0.1, type: 'highpass', from: 3000, to: 3000 }); T(1800, 0.35, { vol: 0.06, delay: 0.2, type: 'saw', slide: 1600 }); wobble(T, 0.45, 0.05, 500); },
  ax_o2_note: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.04, { vol: 0.14, delay: i * 0.05, type: 'highpass', from: 3000, to: 6000 }); pop(a, T, 0.3, 0.12); },
  ax_o2_kurorekishi: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.08, { vol: 0.1, delay: i * 0.1, type: 'highpass', from: 2500, to: 5000 }); T(300, 0.4, { vol: 0.08, delay: 0.36, type: 'square', slide: 120 }); },
  ax_o2_wagana: (a, T) => { a.noise(0.08, { vol: 0.3, type: 'bandpass', from: 1200, to: 400, q: 1 }); chime(T, [1568, 2093, 3136], 0.3, 0.05, 'triangle', 0.06); },
  ax_o2_judgment: (a, T) => { T(80, 0.4, { vol: 0.12, type: 'saw', slide: 60 }); for (let i = 0; i < 4; i++) hit(a, T, 0.34 + i * 0.06, 0.35); boom(a, T, 0.6, 0.35, 0.2); },
  // ── 超能力者
  ax_o2_spoon: (a, T) => { wobble(T, 0, 0.05, 260); T(800, 0.3, { vol: 0.05, delay: 0.3, type: 'sine', slide: 300 }); },
  ax_o2_nenriki: (a, T) => { T(600, 0.3, { vol: 0.06, type: 'sine', slide: 150 }); a.noise(0.25, { vol: 0.2, from: 1500, to: 200 }); pop(a, T, 0.42, 0.14); },
  ax_o2_yochi: (a, T) => { kin(T, 2349, 0.3, 0.06); T(500, 0.4, { vol: 0.04, type: 'sine', slide: 1000 }); },
  ax_o2_teleport: (a, T) => { T(300, 0.25, { vol: 0.06, type: 'sine', slide: 1400 }); T(2000, 0.12, { vol: 0.05, delay: 0.26, type: 'square', slide: 4000 }); },
  ax_o2_psycho: (a, T) => { T(220, 0.4, { vol: 0.06, type: 'sine', slide: 440 }); boom(a, T, 0.42, 0.55, 0.3); },
  ax_o2_spoonstorm: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.1, { vol: 0.12, delay: i * 0.08, type: 'bandpass', from: 1500, to: 3500, q: 4 }); for (let i = 0; i < 4; i++) clang(T, 0.42 + i * 0.07, 0.04); },
  // ── ダ天使
  ax_o2_hohoemi: (a, T) => { a.noise(0.5, { vol: 0.08, type: 'bandpass', from: 2000, to: 800, q: 2 }); chime(T, [1319, 1568, 2093, 2637], 0.4, 0.07, 'sine', 0.05, 0.3); },
  ax_o2_keiyaku: (a, T) => { T(90, 0.4, { vol: 0.12, type: 'saw', slide: 70 }); pop(a, T, 0.38, 0.15); kin(T, 1175, 0.42, 0.05); },
  ax_o2_tsubasa: (a) => { flap(a, 0.1, 3, 0.1, 0.3); a.noise(0.3, { vol: 0.12, delay: 0.38, type: 'highpass', from: 3000, to: 5000 }); },
  ax_o2_darkangel: (a, T) => { flap(a, 0, 2, 0.12, 0.3); for (let i = 0; i < 6; i++) swish(a, 0.3 + i * 0.04, 0.12, 2000, 5000, 0.06); boom(a, T, 0.58, 0.5, 0.3); },
  ax_o2_lucifer: (a, T) => { flap(a, 0, 3, 0.08, 0.3); T(1200, 0.25, { vol: 0.05, delay: 0.2, type: 'saw', slide: 300 }); boom(a, T, 0.46, 0.6, 0.34); },
  // ── 魔王
  ax_o2_hadou: (a, T) => { T(140, 0.5, { vol: 0.12, type: 'saw', slide: 90 }); a.noise(0.4, { vol: 0.2, type: 'bandpass', from: 600, to: 1600, q: 2 }); [2637, 3136, 2349].forEach((f, i) => T(f, 0.15, { vol: 0.05, delay: 0.52 + i * 0.05, type: 'square' })); a.noise(0.2, { vol: 0.3, delay: 0.52, type: 'highpass', from: 4000, to: 7000 }); },
  ax_o2_tsume: (a, T) => { a.noise(0.25, { vol: 0.5, delay: 0.22, type: 'highpass', from: 1500, to: 6000 }); boom(a, T, 0.32, 0.45, 0.4); },
  ax_o2_iatsu: (a, T) => { rumble(a, 0, 0.8, 0.4); T(60, 0.7, { vol: 0.15, type: 'saw', slide: 50 }); },
  ax_o2_koromo: (a, T) => { a.noise(0.7, { vol: 0.2, type: 'bandpass', from: 300, to: 700, q: 1.5 }); T(100, 0.6, { vol: 0.1, type: 'saw', slide: 140 }); },
  ax_o2_hametsu: (a, T) => { T(400, 0.45, { vol: 0.07, type: 'saw', slide: 2000 }); boom(a, T, 0.56, 0.65, 0.22); zap(a, 0.6, 3, 0.2); },
  ax_o2_yamisekai: (a, T) => { a.noise(0.8, { vol: 0.35, from: 200, to: 900 }); T(70, 0.75, { vol: 0.14, type: 'saw', slide: 45 }); },
  // ── 合体技
  ax_o2_hakaidama: (a, T) => { T(200, 0.6, { vol: 0.08, type: 'saw', slide: 800 }); a.noise(0.4, { vol: 0.25, from: 400, to: 1600 }); boom(a, T, 0.72, 0.6, 0.08); },
  ax_o2_meteor: (a, T) => { hit(a, T, 0.2, 0.4); T(300, 0.3, { vol: 0.05, delay: 0.3, type: 'sine', slide: 500 }); for (let i = 0; i < 3; i++) hit(a, T, 0.62 + i * 0.03, 0.35); },
  ax_o2_beastcross: (a, T) => { snap(a, T, 0.24, 0.5); a.noise(0.1, { vol: 0.45, delay: 0.38, type: 'bandpass', from: 1500, to: 500, q: 1 }); hit(a, T, 0.4, 0.4); },
  ax_o2_circus: (a, T) => fanfare(T, 0),
  ax_o2_oozora: (a) => { a.noise(0.6, { vol: 0.25, type: 'bandpass', from: 1500, to: 400, q: 1 }); swish(a, 0.6, 0.3, 500, 2000, 0.2); },
  ax_o2_shitei: (a, T) => { zan(a, 0.2, 0.45); kin(T, 2637, 0.32, 0.05); hit(a, T, 0.46, 0.5); },
  ax_o2_oodate: (a, T) => { clang(T, 0.1, 0.07); kin(T, 1760, 0.12, 0.05); chime(T, [1568, 1976, 2349, 2637], 0.5, 0.05, 'sine', 0.05); },
  ax_o2_wildrush: (a, T) => { snap(a, T, 0.3, 0.45); a.noise(0.08, { vol: 0.4, delay: 0.62, type: 'bandpass', from: 1500, to: 600, q: 1 }); boom(a, T, 0.78, 0.35, 0.02); },
  ax_o2_henshin: (a, T) => { for (let i = 0; i < 3; i++) boom(a, T, i * 0.12, 0.3, 0.2); kin(T, 2093, 0.68, 0.06); },
};
