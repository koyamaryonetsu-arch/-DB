// 第48回 G5（セーラームーン ＋ アナと雪の女王 ＋ アイドル）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g5_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g5_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G5 だけが さわる
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur ?? 0.18, { vol: o.vol ?? 0.06, delay: (o.delay || 0) + i * gap, type: o.type || 'sine', slide: o.slide }));
const sparkle = (T, delay = 0, vol = 0.04) => arp(T, [2637, 3136, 3520, 4186], 0.04, { delay, vol, dur: 0.14 });
const cheer = (a, dur = 0.6, vol = 0.22, delay = 0) => { for (let i = 0; i < 4; i++) a.noise(dur - i * 0.08, { vol: vol * (1 - i * 0.15), delay: delay + i * 0.05, type: 'bandpass', from: 900 + i * 400, to: 1400 + i * 300, q: 1.2 }); };
const crack = (a, T, delay = 0, vol = 0.35) => { a.noise(0.06, { vol, delay, type: 'highpass', from: 5000, to: 8000 }); T(2794, 0.12, { vol: 0.05, delay: delay + 0.02, type: 'triangle' }); a.noise(0.25, { vol: vol * 0.6, delay: delay + 0.04, from: 6000, to: 1200 }); };

export const SFX_AX_G5 = {
  // ── アイドル ──
  ax_g5_chu: (a, T) => { a.noise(0.05, { vol: 0.2, type: 'bandpass', from: 2400, to: 3600, q: 6 }); T(1568, 0.1, { vol: 0.06, type: 'sine', slide: 2093, delay: 0.04 }); arp(T, [1319, 1760, 2093], 0.06, { delay: 0.14, vol: 0.05 }); },
  ax_g5_kya: (a, T) => { cheer(a, 0.45, 0.16); arp(T, [1047, 1319, 1568, 2093], 0.05, { vol: 0.05, type: 'triangle' }); },
  ax_g5_kirarin: (a, T) => { T(880, 0.25, { vol: 0.06, type: 'triangle', slide: 3520 }); sparkle(T, 0.12, 0.05); a.noise(0.3, { vol: 0.12, delay: 0.05, type: 'highpass', from: 5000, to: 8000 }); },
  ax_g5_pachi: (a, T) => { T(2093, 0.04, { vol: 0.08, type: 'square' }); T(3136, 0.25, { vol: 0.05, delay: 0.05, type: 'sine' }); sparkle(T, 0.1, 0.035); },
  ax_g5_pan: (a, T) => { [0, 0.16, 0.32].forEach((d, i) => { a.noise(0.06, { vol: 0.32, delay: d, from: 3500, to: 900 }); T(784 + i * 196, 0.12, { vol: 0.05, delay: d + 0.02, type: 'triangle' }); }); },
  ax_g5_jan: (a, T) => { [523, 659, 784, 1047].forEach((f) => T(f, 0.55, { vol: 0.05, type: 'saw' })); a.noise(0.5, { vol: 0.2, type: 'highpass', from: 4000, to: 8000 }); },
  ax_g5_waa: (a, T) => { cheer(a, 0.7, 0.22); arp(T, [784, 988, 1175], 0.08, { vol: 0.04, type: 'triangle', delay: 0.1 }); },
  ax_g5_heart: (a, T) => { arp(T, [1568, 1319, 1760, 1568, 2093, 1760], 0.07, { vol: 0.05, dur: 0.15 }); },
  ax_g5_encore: (a, T) => { [0, 0.22].forEach((d) => cheer(a, 0.2, 0.2, d)); arp(T, [659, 784, 988, 1319], 0.07, { vol: 0.05, type: 'pulse', delay: 0.35 }); },
  ax_g5_kiran: (a, T) => { T(2637, 0.5, { vol: 0.07, type: 'sine' }); T(3951, 0.4, { vol: 0.04, delay: 0.04, type: 'sine' }); arp(T, [1047, 1319, 1568], 0.05, { vol: 0.04, delay: 0.15 }); },
  ax_g5_dome: (a, T) => { cheer(a, 0.75, 0.28); [392, 523, 659, 784].forEach((f) => T(f, 0.7, { vol: 0.04, type: 'saw', delay: 0.05 })); },
  ax_g5_drumroll: (a, T) => { for (let i = 0; i < 9; i++) a.noise(0.04, { vol: 0.16 + i * 0.015, delay: i * 0.04, type: 'bandpass', from: 1800, to: 1800, q: 2 }); a.noise(0.3, { vol: 0.35, delay: 0.4, type: 'highpass', from: 3000, to: 7000 }); [523, 659, 784, 1047].forEach((f) => T(f, 0.35, { vol: 0.05, delay: 0.4, type: 'triangle' })); },
  ax_g5_lovely: (a, T) => { T(523, 0.3, { vol: 0.07, type: 'triangle', slide: 1047 }); arp(T, [1319, 1568, 2093, 2637], 0.05, { vol: 0.05, delay: 0.2 }); a.noise(0.5, { vol: 0.18, delay: 0.15, from: 3000, to: 400 }); },
  ax_g5_ganbare: (a, T) => { [0, 0.25, 0.5].forEach((d) => cheer(a, 0.2, 0.2, d)); arp(T, [784, 1047, 1319], 0.12, { vol: 0.04, type: 'triangle', delay: 0.05 }); },
  // ── セーラームーン・タキシード仮面ふう ──
  ax_g5_kick: (a, T) => { a.noise(0.15, { vol: 0.3, type: 'bandpass', from: 600, to: 3000, q: 2 }); a.noise(0.12, { vol: 0.45, delay: 0.16, from: 3000, to: 300 }); sparkle(T, 0.2, 0.04); },
  ax_g5_cape: (a, T) => { a.noise(0.3, { vol: 0.3, type: 'bandpass', from: 300, to: 1500, q: 1.5 }); T(3136, 0.3, { vol: 0.04, delay: 0.3, type: 'sine' }); T(4186, 0.25, { vol: 0.03, delay: 0.33, type: 'sine' }); },
  ax_g5_makeup: (a, T) => { arp(T, [784, 988, 1175, 1568, 1976, 2349, 3136], 0.06, { vol: 0.05, dur: 0.22 }); T(2637, 0.4, { vol: 0.06, delay: 0.48, type: 'sine' }); },
  ax_g5_ribbon: (a, T) => { arp(T, [1175, 1568, 1319, 1760, 1568, 2093], 0.06, { vol: 0.045, dur: 0.2 }); a.noise(0.4, { vol: 0.08, type: 'highpass', from: 5000, to: 8000 }); },
  ax_g5_shabon: (a, T) => { a.noise(0.6, { vol: 0.25, type: 'highpass', from: 2500, to: 6000 }); for (let i = 0; i < 5; i++) T(1500 + i * 220, 0.06, { vol: 0.04, delay: 0.1 + i * 0.08, type: 'sine', slide: 2400 + i * 200 }); },
  ax_g5_tiara: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.12, { vol: 0.16, delay: i * 0.08, type: 'bandpass', from: 1200 + i * 300, to: 2600, q: 5 }); T(2093, 0.4, { vol: 0.06, delay: 0.36, type: 'sine' }); sparkle(T, 0.4, 0.05); },
  ax_g5_rose: (a, T) => { a.noise(0.18, { vol: 0.25, type: 'bandpass', from: 1500, to: 4000, q: 3 }); a.noise(0.08, { vol: 0.4, delay: 0.22, from: 2400, to: 400 }); T(196, 0.12, { vol: 0.1, delay: 0.22, type: 'triangle', slide: 120 }); },
  ax_g5_aqua: (a, T) => { a.noise(0.45, { vol: 0.32, from: 500, to: 2000 }); crack(a, T, 0.4, 0.3); },
  ax_g5_wand: (a, T) => { arp(T, [1568, 2093, 2637, 3136, 2637, 3136, 3520], 0.05, { vol: 0.045, dur: 0.16 }); a.noise(0.5, { vol: 0.2, delay: 0.25, type: 'highpass', from: 3000, to: 6000 }); },
  ax_g5_heal: (a, T) => { [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.55, { vol: 0.045, delay: i * 0.06, type: 'sine' })); sparkle(T, 0.3, 0.035); },
  ax_g5_crystal: (a, T) => { T(3520, 0.7, { vol: 0.05, type: 'sine' }); T(2637, 0.7, { vol: 0.04, delay: 0.03, type: 'sine' }); a.noise(0.5, { vol: 0.25, delay: 0.25, type: 'highpass', from: 2000, to: 7000 }); },
  ax_g5_halation: (a, T) => { [659, 784, 988, 1319].forEach((f, i) => T(f, 0.7, { vol: 0.05, delay: i * 0.03, type: 'triangle' })); a.noise(0.7, { vol: 0.35, delay: 0.05, type: 'highpass', from: 1500, to: 6000 }); sparkle(T, 0.25, 0.05); },
  ax_g5_smasher: (a, T) => { [0, 0.12, 0.24].forEach((d) => a.noise(0.12, { vol: 0.35, delay: d, type: 'highpass', from: 2500, to: 6000 })); a.noise(0.45, { vol: 0.4, delay: 0.32, from: 3000, to: 200 }); },
  ax_g5_spiral: (a, T) => { T(400, 0.35, { vol: 0.06, type: 'triangle', slide: 1600 }); for (let i = 0; i < 4; i++) T(1319 + i * 262, 0.08, { vol: 0.04, delay: 0.05 + i * 0.07, type: 'sine' }); a.noise(0.45, { vol: 0.35, delay: 0.35, from: 2500, to: 200 }); },
  ax_g5_kingdom: (a, T) => { [262, 392, 523, 659, 784].forEach((f, i) => T(f, 0.6, { vol: 0.05, delay: i * 0.04, type: 'saw' })); a.noise(0.65, { vol: 0.35, delay: 0.1, type: 'highpass', from: 1200, to: 6000 }); sparkle(T, 0.4, 0.05); },
  ax_g5_golden: (a, T) => { a.noise(0.5, { vol: 0.3, from: 300, to: 60 }); [392, 494, 587, 784].forEach((f, i) => T(f, 0.55, { vol: 0.05, delay: 0.15 + i * 0.03, type: 'saw' })); a.noise(0.5, { vol: 0.35, delay: 0.3, from: 2500, to: 300 }); },
  ax_g5_sword: (a, T) => { T(2794, 0.4, { vol: 0.06, type: 'sine' }); a.noise(0.12, { vol: 0.4, delay: 0.2, type: 'highpass', from: 3000, to: 7000 }); a.noise(0.45, { vol: 0.4, delay: 0.28, from: 3000, to: 150 }); },
  ax_g5_dawn: (a, T) => { [392, 494, 587, 784, 988].forEach((f, i) => T(f, 0.6, { vol: 0.045, delay: i * 0.09, type: 'triangle' })); },
  ax_g5_luna: (a, T) => { T(700, 0.22, { vol: 0.06, type: 'triangle', slide: 1000 }); T(1000, 0.2, { vol: 0.05, delay: 0.18, type: 'triangle', slide: 760 }); sparkle(T, 0.35, 0.04); },
  ax_g5_sleep: (a, T) => { [784, 659, 523, 392].forEach((f, i) => T(f, 0.4, { vol: 0.04, delay: i * 0.13, type: 'sine' })); a.noise(0.7, { vol: 0.1, type: 'highpass', from: 4000, to: 7000 }); },
  // ── フルーツ ──
  ax_g5_mixer: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.06, { vol: 0.2, delay: i * 0.06, type: 'bandpass', from: 600, to: 900, q: 3 }); a.noise(0.3, { vol: 0.2, delay: 0.42, type: 'highpass', from: 3000, to: 7000 }); T(1568, 0.2, { vol: 0.05, delay: 0.45, type: 'sine' }); },
  ax_g5_bomb: (a, T) => { T(600, 0.15, { vol: 0.06, type: 'triangle', slide: 900 }); a.noise(0.5, { vol: 0.5, delay: 0.2, from: 2500, to: 60 }); T(90, 0.3, { vol: 0.2, delay: 0.2, type: 'triangle', slide: 40 }); },
  ax_g5_slip: (a, T) => { T(1200, 0.25, { vol: 0.07, type: 'sine', slide: 2400 }); T(400, 0.2, { vol: 0.1, delay: 0.3, type: 'triangle', slide: 120 }); a.noise(0.15, { vol: 0.35, delay: 0.42, from: 1500, to: 200 }); },
  ax_g5_pop: (a, T) => { for (let i = 0; i < 6; i++) T(600 + (i % 3) * 300, 0.06, { vol: 0.07, delay: i * 0.07, type: 'square', slide: 1400 }); cheer(a, 0.3, 0.12, 0.3); },
  ax_g5_tropical: (a, T) => { arp(T, [659, 784, 988, 784, 1175, 988], 0.08, { vol: 0.05, type: 'triangle', dur: 0.14 }); a.noise(0.3, { vol: 0.1, delay: 0.1, type: 'highpass', from: 5000, to: 8000 }); },
  ax_g5_roll: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.08, { vol: 0.2, delay: i * 0.07, from: 700, to: 200 }); a.noise(0.45, { vol: 0.5, delay: 0.38, from: 2000, to: 50 }); },
  ax_g5_meteor: (a, T) => { for (let i = 0; i < 4; i++) T(2400 - i * 200, 0.12, { vol: 0.04, delay: i * 0.08, type: 'sine', slide: 600 }); [0.35, 0.45, 0.55, 0.65].forEach((d) => a.noise(0.15, { vol: 0.35, delay: d, from: 2000, to: 120 })); },
  // ── アラシ ──
  ax_g5_step: (a, T) => { [0, 0.1, 0.2, 0.3].forEach((d) => a.noise(0.04, { vol: 0.25, delay: d, type: 'highpass', from: 3000, to: 5000 })); a.noise(0.45, { vol: 0.3, delay: 0.3, type: 'bandpass', from: 400, to: 2400, q: 3 }); },
  ax_g5_cool: (a, T) => { T(3136, 0.4, { vol: 0.05, type: 'sine' }); T(1568, 0.5, { vol: 0.04, delay: 0.05, type: 'triangle' }); a.noise(0.3, { vol: 0.12, delay: 0.1, type: 'highpass', from: 6000, to: 8000 }); },
  ax_g5_chord: (a, T) => { [[523, 659, 784], [587, 740, 880], [659, 831, 988]].forEach((ch, i) => ch.forEach((f) => T(f, 0.3, { vol: 0.035, delay: i * 0.2, type: 'triangle' }))); },
  ax_g5_thunder: (a, T) => { a.noise(0.08, { vol: 0.6, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.7, { vol: 0.45, delay: 0.06, from: 900, to: 40 }); [392, 523, 659, 784].forEach((f) => T(f, 0.6, { vol: 0.04, delay: 0.1, type: 'saw' })); },
  ax_g5_storm: (a, T) => { a.noise(0.7, { vol: 0.35, type: 'bandpass', from: 300, to: 1800, q: 2 }); arp(T, [523, 659, 784, 1047], 0.1, { vol: 0.04, type: 'triangle', delay: 0.2 }); },
  // ── 雪と 氷 ──
  ax_g5_crack: (a, T) => { sparkle(T, 0, 0.04); crack(a, T, 0.25, 0.35); },
  ax_g5_wall: (a, T) => { [0, 0.1, 0.2, 0.3].forEach((d) => crack(a, T, d, 0.22)); },
  ax_g5_snowman: (a, T) => { arp(T, [784, 988, 1175, 988, 1319], 0.09, { vol: 0.05, type: 'triangle', dur: 0.14 }); a.noise(0.2, { vol: 0.12, delay: 0.4, from: 1200, to: 300 }); },
  ax_g5_giant: (a, T) => { a.noise(0.4, { vol: 0.3, from: 300, to: 60 }); T(80, 0.4, { vol: 0.2, type: 'triangle', slide: 40, delay: 0.1 }); a.noise(0.35, { vol: 0.55, delay: 0.42, from: 1500, to: 50 }); },
  ax_g5_song: (a, T) => { arp(T, [523, 587, 659, 784, 880, 1047], 0.1, { vol: 0.05, type: 'triangle', dur: 0.22 }); a.noise(0.6, { vol: 0.1, type: 'highpass', from: 5000, to: 8000 }); },
  ax_g5_castle: (a, T) => { [0, 0.08, 0.16, 0.24].forEach((d) => crack(a, T, d, 0.18)); a.noise(0.5, { vol: 0.3, delay: 0.3, type: 'bandpass', from: 2000, to: 500, q: 1.5 }); T(2093, 0.4, { vol: 0.04, delay: 0.35, type: 'sine' }); },
  ax_g5_icicle: (a, T) => { T(3136, 0.2, { vol: 0.04, type: 'sine' }); [0.2, 0.28, 0.36, 0.44, 0.52].forEach((d) => a.noise(0.06, { vol: 0.3, delay: d, type: 'highpass', from: 3000, to: 6000 })); },
  ax_g5_wind: (a, T) => { a.noise(0.7, { vol: 0.28, type: 'bandpass', from: 500, to: 2600, q: 4 }); arp(T, [1175, 1568, 1319, 1760], 0.1, { vol: 0.035, delay: 0.1 }); },
  ax_g5_bluefire: (a, T) => { [0, 0.07, 0.14, 0.21].forEach((d) => T(1800, 0.04, { vol: 0.04, delay: d, type: 'square' })); a.noise(0.5, { vol: 0.4, delay: 0.25, from: 600, to: 3000 }); },
  ax_g5_horse: (a, T) => { a.noise(0.5, { vol: 0.3, from: 400, to: 1800 }); [0.1, 0.22, 0.34, 0.46].forEach((d) => a.noise(0.05, { vol: 0.2, delay: d, from: 1200, to: 300 })); T(880, 0.25, { vol: 0.05, delay: 0.45, type: 'triangle', slide: 1320 }); },
  ax_g5_stomp: (a, T) => { [0, 0.35].forEach((d) => { a.noise(0.35, { vol: 0.55, delay: d, from: 900, to: 40 }); T(60, 0.3, { vol: 0.25, delay: d, type: 'triangle', slide: 30 }); }); },
  ax_g5_spirit4: (a, T) => { [1568, 1760, 2093, 2349].forEach((f, i) => T(f, 0.25, { vol: 0.05, delay: i * 0.12, type: 'sine' })); T(3136, 0.3, { vol: 0.05, delay: 0.5, type: 'sine' }); },
  ax_g5_tsunagu: (a, T) => { [1568, 1760, 2093, 2349].forEach((f, i) => T(f, 0.2, { vol: 0.045, delay: i * 0.08, type: 'sine' })); a.noise(0.5, { vol: 0.35, delay: 0.3, type: 'highpass', from: 1500, to: 6000 }); [523, 784, 1047].forEach((f) => T(f, 0.45, { vol: 0.04, delay: 0.32, type: 'triangle' })); },
  ax_g5_bigwave: (a, T) => { a.noise(0.5, { vol: 0.4, from: 300, to: 1500 }); crack(a, T, 0.45, 0.3); a.noise(0.2, { vol: 0.35, delay: 0.6, type: 'highpass', from: 3000, to: 6000 }); },
  // ── 合体技 ──
  ax_g5_moonlight: (a, T) => { [523, 659, 784, 1047].forEach((f, i) => T(f, 0.5, { vol: 0.045, delay: i * 0.08, type: 'triangle' })); cheer(a, 0.5, 0.15, 0.2); sparkle(T, 0.4, 0.05); },
};
