// 第48回 G4（ダイの大冒険 ＋ ロトの勇者 ＋ マリオ ＋ 3年B組）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g4_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g4_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G4 だけが さわる
// ざん（斬る 音）
const zan = (a, d = 0, v = 0.4) => { a.noise(0.1, { vol: v, delay: d, type: 'highpass', from: 2500, to: 7000 }); a.noise(0.18, { vol: v * 0.7, delay: d + 0.06, from: 3200, to: 300 }); };
// ピシャーン（いなずま）
const thunder = (a, T, d = 0, v = 0.55) => { a.noise(0.06, { vol: v, delay: d, type: 'highpass', from: 2600, to: 2600 }); a.noise(0.42, { vol: v * 0.85, delay: d + 0.04, from: 1000, to: 40 }); T(1600, 0.08, { vol: 0.05, type: 'saw', slide: 300, delay: d }); };
// ドーン
const boom = (a, T, d = 0, v = 0.5) => { a.noise(0.36, { vol: v, delay: d, from: 1800, to: 40 }); T(80, 0.34, { vol: 0.22, type: 'triangle', slide: 35, delay: d }); };
const kin = (T, f, d = 0, v = 0.05) => { T(f, 0.3, { vol: v, type: 'sine', delay: d }); T(f * 1.5, 0.24, { vol: v * 0.6, type: 'sine', delay: d + 0.02 }); };
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.1, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));

export const SFX_AX_G4 = {
  // ── ダイの大冒険
  ax_g4_kaiha: (a, T) => { a.noise(0.08, { vol: 0.45, type: 'highpass', from: 4000, to: 8000 }); a.noise(0.35, { vol: 0.3, delay: 0.12, type: 'bandpass', from: 2400, to: 500, q: 1.4 }); },
  ax_g4_daichi: (a, T) => { zan(a, 0, 0.45); boom(a, T, 0.15, 0.45); },
  ax_g4_kuuretsu: (a, T) => { kin(T, 2637, 0, 0.06); zan(a, 0.2, 0.35); },
  ax_g4_strash: (a, T) => { T(2400, 0.05, { vol: 0.08, type: 'square' }); kin(T, 3136, 0.04, 0.05); zan(a, 0.22, 0.5); a.noise(0.4, { vol: 0.3, delay: 0.3, from: 2600, to: 200 }); },
  ax_g4_ryutouki: (a, T) => { kin(T, 1760, 0, 0.06); T(110, 0.7, { vol: 0.14, type: 'saw', slide: 220, attack: 0.3 }); a.noise(0.6, { vol: 0.25, delay: 0.1, from: 500, to: 1500 }); },
  ax_g4_gigabreak: (a, T) => { a.noise(0.25, { vol: 0.25, from: 300, to: 80 }); thunder(a, T, 0.08); zan(a, 0.42, 0.5); },
  ax_g4_crest: (a, T) => { kin(T, 1568, 0, 0.06); kin(T, 2093, 0.1, 0.05); a.noise(0.4, { vol: 0.15, delay: 0.25, type: 'bandpass', from: 1200, to: 600, q: 2 }); },
  ax_g4_dragonfire: (a, T) => { T(90, 0.5, { vol: 0.2, type: 'saw', slide: 60 }); a.noise(0.7, { vol: 0.45, delay: 0.1, from: 600, to: 2600 }); },
  ax_g4_doruora: (a, T) => { T(400, 0.25, { vol: 0.07, type: 'saw', slide: 1600 }); a.noise(0.08, { vol: 0.5, delay: 0.2, type: 'highpass', from: 3000, to: 3000 }); a.noise(0.5, { vol: 0.55, delay: 0.24, from: 2400, to: 60 }); T(70, 0.5, { vol: 0.25, type: 'triangle', slide: 30, delay: 0.28 }); },
  ax_g4_dive: (a, T) => { T(1800, 0.4, { vol: 0.05, type: 'sine', slide: 300 }); a.noise(0.4, { vol: 0.2, type: 'bandpass', from: 3000, to: 600, q: 2 }); boom(a, T, 0.42, 0.55); },
  ax_g4_monshou3: (a, T) => { kin(T, 1568, 0); kin(T, 1976, 0.11); kin(T, 2349, 0.22); T(90, 0.5, { vol: 0.16, type: 'saw', slide: 180, delay: 0.3 }); },
  ax_g4_mahouken: (a, T) => { thunder(a, T, 0, 0.5); zan(a, 0.38, 0.45); },
  ax_g4_roar: (a, T) => { T(120, 0.7, { vol: 0.2, type: 'saw', slide: 70 }); T(180, 0.6, { vol: 0.12, type: 'square', slide: 90, delay: 0.05 }); a.noise(0.7, { vol: 0.4, from: 700, to: 120 }); },
  ax_g4_guard: (a, T) => { kin(T, 2093, 0, 0.06); a.noise(0.3, { vol: 0.12, delay: 0.1, type: 'highpass', from: 4000, to: 6000 }); },
  ax_g4_cross: (a, T) => { zan(a, 0, 0.45); zan(a, 0.16, 0.45); thunder(a, T, 0.3, 0.5); },
  ax_g4_wing: (a, T) => { a.noise(0.25, { vol: 0.4, type: 'bandpass', from: 400, to: 1400, q: 1 }); a.noise(0.45, { vol: 0.45, delay: 0.28, type: 'bandpass', from: 1600, to: 300, q: 0.8 }); },
  ax_g4_daihadou: (a, T) => { T(300, 0.3, { vol: 0.07, type: 'saw', slide: 1400 }); a.noise(0.55, { vol: 0.6, delay: 0.22, from: 2000, to: 40 }); T(60, 0.45, { vol: 0.28, type: 'triangle', slide: 28, delay: 0.3 }); },
  ax_g4_medroa: (a, T) => { a.noise(0.15, { vol: 0.25, from: 600, to: 2000 }); kin(T, 2637, 0.12, 0.05); T(800, 0.2, { vol: 0.05, type: 'sine', slide: 2400, delay: 0.25 }); T(1200, 0.25, { vol: 0.04, type: 'sine', slide: 300, delay: 0.55 }); },
  ax_g4_mera5: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.12, { vol: 0.3, delay: i * 0.06, from: 600, to: 2400 }); boom(a, T, 0.42, 0.5); },
  ax_g4_phoenix: (a, T) => { a.noise(0.1, { vol: 0.3, from: 800, to: 2000 }); a.noise(0.5, { vol: 0.45, delay: 0.15, from: 400, to: 2600 }); boom(a, T, 0.42, 0.55); },
  // ── 勇者・ロトの勇者
  ax_g4_gigaslash: (a, T) => { thunder(a, T, 0, 0.45); a.noise(0.4, { vol: 0.5, delay: 0.25, type: 'highpass', from: 1500, to: 6000 }); },
  ax_g4_kizuna: (a, T) => { arp(T, [784, 988, 1175, 1568], 0.07, { type: 'triangle', dur: 0.25, vol: 0.06 }); kin(T, 2349, 0.32, 0.04); },
  ax_g4_inori: (a, T) => { arp(T, [1319, 1568, 1976, 2349, 2637], 0.08, { type: 'sine', dur: 0.3, vol: 0.05 }); a.noise(0.5, { vol: 0.1, delay: 0.1, type: 'highpass', from: 5000, to: 7000 }); },
  ax_g4_gigadein: (a, T) => { a.noise(0.25, { vol: 0.25, from: 260, to: 60 }); thunder(a, T, 0.2, 0.65); },
  ax_g4_kizunaken: (a, T) => { [1319, 1568, 1760, 2093].forEach((f, i) => kin(T, f, i * 0.07, 0.04)); zan(a, 0.38, 0.5); },
  ax_g4_jigodein: (a, T) => { T(70, 0.4, { vol: 0.2, type: 'saw', slide: 50 }); thunder(a, T, 0.22, 0.65); for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.3, delay: 0.4 + i * 0.07, type: 'highpass', from: 3000, to: 3000 }); },
  ax_g4_lotoken: (a, T) => { kin(T, 2093, 0, 0.06); zan(a, 0.28, 0.5); },
  ax_g4_shirushi: (a, T) => { arp(T, [1047, 1319, 1568, 2093], 0.09, { type: 'sine', dur: 0.4, vol: 0.06 }); },
  ax_g4_gigacross: (a, T) => { thunder(a, T, 0, 0.5); zan(a, 0.2, 0.45); boom(a, T, 0.32, 0.5); },
  ax_g4_ultima: (a, T) => { T(800, 0.5, { vol: 0.05, type: 'sine', slide: 3200, attack: 0.3 }); zan(a, 0.36, 0.5); boom(a, T, 0.42, 0.55); },
  ax_g4_hikari: (a, T) => { kin(T, 1760, 0, 0.06); kin(T, 2637, 0.15, 0.05); a.noise(0.5, { vol: 0.3, delay: 0.3, type: 'highpass', from: 2000, to: 7000 }); },
  ax_g4_teradein: (a, T) => { a.noise(0.25, { vol: 0.3, from: 220, to: 50 }); thunder(a, T, 0.22, 0.7); boom(a, T, 0.3, 0.55); },
  ax_g4_minadein: (a, T) => { [1047, 1319, 1568, 2093].forEach((f, i) => kin(T, f, i * 0.12, 0.05)); T(400, 0.3, { vol: 0.05, type: 'saw', slide: 1600, delay: 0.48 }); },
  // ── マリオ
  ax_g4_jump: (a, T) => { T(330, 0.16, { vol: 0.08, type: 'square', slide: 990 }); T(220, 0.08, { vol: 0.1, type: 'square', slide: 110, delay: 0.3 }); },
  ax_g4_spanner: (a, T) => { [0, 0.12, 0.24].forEach((d) => { T(1760, 0.05, { vol: 0.07, type: 'square', delay: d }); a.noise(0.04, { vol: 0.15, delay: d, type: 'highpass', from: 4000, to: 4000 }); }); arp(T, [784, 1047, 1319], 0.06, { delay: 0.32, type: 'triangle' }); },
  ax_g4_pipe: (a, T) => { for (let i = 0; i < 4; i++) T(700 - i * 120, 0.09, { vol: 0.07, type: 'square', slide: 500 - i * 100, delay: i * 0.1 }); },
  ax_g4_dash: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.05, { vol: 0.18, delay: i * 0.07, type: 'bandpass', from: 1400, to: 900, q: 3 }); T(400, 0.3, { vol: 0.05, type: 'square', slide: 900 }); },
  ax_g4_hammer: (a, T) => { [0, 0.08].forEach((d) => a.noise(0.08, { vol: 0.15, delay: d, type: 'bandpass', from: 1200, to: 2400, q: 2 })); T(180, 0.16, { vol: 0.18, type: 'square', slide: 90, delay: 0.32 }); },
  ax_g4_sandan: (a, T) => { T(330, 0.1, { vol: 0.07, type: 'square', slide: 660 }); T(392, 0.1, { vol: 0.07, type: 'square', slide: 784, delay: 0.13 }); T(523, 0.16, { vol: 0.08, type: 'square', slide: 1568, delay: 0.27 }); boom(a, T, 0.44, 0.4); },
  ax_g4_fireball: (a, T) => { for (let i = 0; i < 3; i++) T(880, 0.05, { vol: 0.08, type: 'square', slide: 440, delay: i * 0.12 }); a.noise(0.25, { vol: 0.25, delay: 0.4, from: 800, to: 2400 }); },
  ax_g4_powerup: (a, T) => { arp(T, [523, 659, 784, 659, 784, 1047], 0.07, { type: 'square', vol: 0.05, dur: 0.09 }); },
  ax_g4_shell: (a, T) => { T(1200, 0.04, { vol: 0.1, type: 'square' }); a.noise(0.3, { vol: 0.15, delay: 0.05, type: 'bandpass', from: 2000, to: 1200, q: 3 }); [0.3, 0.42].forEach((d) => T(200, 0.08, { vol: 0.14, type: 'square', slide: 100, delay: d })); },
  ax_g4_pow: (a, T) => { boom(a, T, 0.22, 0.6); T(90, 0.3, { vol: 0.2, type: 'square', slide: 40, delay: 0.22 }); },
  ax_g4_1up: (a, T) => { arp(T, [1319, 1568, 2637, 2093, 2349, 3136], 0.07, { type: 'square', vol: 0.05, dur: 0.08 }); },
  ax_g4_flower: (a, T) => { arp(T, [1047, 1319, 1568, 2093], 0.05, { type: 'square', vol: 0.05 }); for (let i = 0; i < 4; i++) T(880, 0.04, { vol: 0.07, type: 'square', slide: 440, delay: 0.3 + i * 0.08 }); },
  ax_g4_redshell: (a, T) => { a.noise(0.4, { vol: 0.15, type: 'bandpass', from: 1500, to: 2500, q: 3 }); boom(a, T, 0.44, 0.45); },
  ax_g4_hip: (a, T) => { T(600, 0.2, { vol: 0.06, type: 'square', slide: 1200 }); T(1200, 0.18, { vol: 0.06, type: 'square', slide: 300, delay: 0.25 }); boom(a, T, 0.44, 0.5); },
  ax_g4_star: (a, T) => { arp(T, [1047, 1047, 1047, 880, 1047, 1175, 1319], 0.08, { type: 'square', vol: 0.05, dur: 0.07 }); },
  ax_g4_egg: (a, T) => { [0, 0.1].forEach((d) => T(500, 0.06, { vol: 0.07, type: 'triangle', slide: 800, delay: d })); a.noise(0.1, { vol: 0.3, delay: 0.42, type: 'highpass', from: 3000, to: 5000 }); T(1400, 0.08, { vol: 0.05, type: 'square', delay: 0.45 }); },
  ax_g4_kinoko: (a, T) => { arp(T, [784, 1047, 1319, 1568, 2093], 0.06, { type: 'triangle', vol: 0.06, dur: 0.12 }); },
  ax_g4_kart: (a, T) => { T(90, 0.6, { vol: 0.12, type: 'saw', slide: 260 }); a.noise(0.3, { vol: 0.3, delay: 0.38, type: 'highpass', from: 2000, to: 5000 }); },
  ax_g4_rush: (a, T) => { arp(T, [1047, 1175, 1319, 1568], 0.06, { type: 'square', vol: 0.05 }); for (let i = 0; i < 4; i++) a.noise(0.08, { vol: 0.35, delay: 0.32 + i * 0.09, from: 1600, to: 200 }); },
  ax_g4_mega: (a, T) => { boom(a, T, 0.42, 0.65); T(60, 0.3, { vol: 0.25, type: 'square', slide: 30, delay: 0.42 }); },
  // ── 3年B組
  ax_g4_hito: (a, T) => { arp(T, [523, 659, 784, 1047], 0.12, { type: 'triangle', dur: 0.35, vol: 0.06 }); kin(T, 2093, 0.48, 0.05); },
  ax_g4_hai: (a, T) => { [0, 0.12, 0.24].forEach((d, i) => { T(880 + i * 110, 0.06, { vol: 0.07, type: 'square', delay: d }); T(1175 + i * 110, 0.06, { vol: 0.06, type: 'square', delay: d + 0.05 }); }); },
  ax_g4_chalk: (a, T) => { a.noise(0.18, { vol: 0.2, type: 'bandpass', from: 2000, to: 4000, q: 2 }); T(2800, 0.05, { vol: 0.1, type: 'square', delay: 0.2 }); a.noise(0.12, { vol: 0.4, delay: 0.2, type: 'highpass', from: 3000, to: 6000 }); },
  ax_g4_pinpon: (a, T) => { T(784, 0.45, { vol: 0.08, type: 'sine' }); T(622, 0.5, { vol: 0.08, type: 'sine', delay: 0.28 }); },
  ax_g4_whistle: (a, T) => { T(2600, 0.4, { vol: 0.06, type: 'square', slide: 2500 }); for (let i = 0; i < 4; i++) a.noise(0.06, { vol: 0.16, delay: 0.45 + i * 0.08, type: 'bandpass', from: 900, to: 600, q: 2 }); },
  ax_g4_kora: (a, T) => { T(330, 0.25, { vol: 0.1, type: 'saw', slide: 220 }); boom(a, T, 0.3, 0.4); arp(T, [523, 659, 784], 0.08, { type: 'sine', delay: 0.36, vol: 0.05, dur: 0.26 }); },
  ax_g4_sakura: (a, T) => { arp(T, [659, 784, 880, 1047, 880, 784], 0.11, { type: 'triangle', vol: 0.05, dur: 0.22 }); },
  ax_g4_run: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.2, delay: i * 0.07, type: 'bandpass', from: 700, to: 400, q: 2 }); boom(a, T, 0.42, 0.4); },
  ax_g4_tabidachi: (a, T) => { arp(T, [523, 659, 784, 1047, 988, 784], 0.1, { type: 'sine', vol: 0.06, dur: 0.25 }); },
};
