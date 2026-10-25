// 第48回 G6（ハリー・ポッター ＋ 鋼の錬金術師 ＋ 怪盗キッド ＋ 名探偵コナン ＋ おしり探偵）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g6_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g6_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G6 だけが さわる。はなつ しゅんかんに 1回 ならす（plan-r48-fx.md 6章の「音」の ふんいき）
// ── 音の ぶひん ──
const zap = (a, d = 0, n = 4, vol = 0.16) => { for (let i = 0; i < n; i++) a.noise(0.035, { vol, delay: d + i * 0.055, type: 'highpass', from: 4200, to: 4200 }); };
const boom = (a, T, d = 0, vol = 0.5, len = 0.6) => { a.noise(len, { vol, delay: d, from: 2000, to: 40 }); T(80, len * 0.7, { vol: vol * 0.4, delay: d, type: 'triangle', slide: 35 }); };
const whoosh = (a, d = 0, dur = 0.3, from = 600, to = 2400, vol = 0.22) => a.noise(dur, { vol, delay: d, type: 'bandpass', from, to, q: 3 });
const chime = (T, notes, d = 0, step = 0.05, type = 'sine', vol = 0.05, dur = 0.25) => notes.forEach((f, i) => T(f, dur, { vol, delay: d + i * step, type }));
const card = (a, d = 0, vol = 0.2) => a.noise(0.04, { vol, delay: d, type: 'highpass', from: 3000, to: 6500 });
const pop = (a, T, d = 0, vol = 0.12) => { T(500, 0.08, { vol, delay: d, type: 'sine', slide: 1200 }); a.noise(0.08, { vol: 0.2, delay: d, from: 2400, to: 500 }); };
const thud = (a, T, d = 0, vol = 0.4) => { a.noise(0.25, { vol, delay: d, from: 900, to: 60 }); T(70, 0.2, { vol: vol * 0.5, delay: d, type: 'triangle', slide: 40 }); };
const flap = (a, d = 0, n = 3, gap = 0.08, vol = 0.14) => { for (let i = 0; i < n; i++) a.noise(0.06, { vol, delay: d + i * gap, type: 'bandpass', from: 900, to: 500, q: 2 }); };
const sparkle = (T, d = 0, vol = 0.04) => chime(T, [2093, 2637, 3136, 3520], d, 0.04, 'sine', vol, 0.2);
const rumble = (a, d = 0, dur = 0.6, vol = 0.35) => a.noise(dur, { vol, delay: d, from: 300, to: 50 });
const snap = (a, T, d = 0) => { a.noise(0.03, { vol: 0.45, delay: d, type: 'highpass', from: 2500, to: 2500 }); T(1800, 0.03, { vol: 0.08, delay: d, type: 'square' }); };
const clap = (a, d = 0) => { a.noise(0.06, { vol: 0.5, delay: d, type: 'bandpass', from: 1500, to: 1200, q: 1 }); a.noise(0.12, { vol: 0.2, delay: d + 0.02, from: 3000, to: 600 }); };
const boing = (T, d = 0) => T(180, 0.35, { vol: 0.1, delay: d, type: 'triangle', slide: 520 });

export const SFX_AX_G6 = {
  // ── ハリー・ポッター ──
  ax_g6_lumos: (a, T) => { T(392, 0.3, { vol: 0.06, type: 'sine', slide: 784 }); sparkle(T, 0.35, 0.05); },
  ax_g6_fuwa: (a, T) => { T(330, 0.45, { vol: 0.06, type: 'sine', slide: 660 }); whoosh(a, 0, 0.4, 400, 1200, 0.12); thud(a, T, 0.52, 0.4); },
  ax_g6_kachi: (a, T) => { T(1800, 0.05, { vol: 0.1, type: 'square' }); chime(T, [2637, 3136, 2349], 0.25, 0.05, 'triangle', 0.06, 0.3); a.noise(0.2, { vol: 0.25, delay: 0.25, type: 'highpass', from: 5000, to: 7000 }); },
  ax_g6_houki: (a) => { whoosh(a, 0, 0.6, 400, 1600, 0.2); whoosh(a, 0.25, 0.4, 1600, 600, 0.14); },
  ax_g6_incendio: (a, T) => { a.noise(0.6, { vol: 0.45, from: 600, to: 3000 }); a.noise(0.3, { vol: 0.3, delay: 0.3, from: 2400, to: 200 }); T(120, 0.4, { vol: 0.08, type: 'saw', slide: 60 }); },
  ax_g6_stupefy: (a, T) => { a.noise(0.08, { vol: 0.35, type: 'highpass', from: 3500, to: 6000 }); T(1400, 0.2, { vol: 0.08, type: 'saw', slide: 500 }); boom(a, T, 0.24, 0.4, 0.4); },
  ax_g6_leviosa: (a, T) => { whoosh(a, 0, 0.15, 800, 3000, 0.25); T(660, 0.12, { vol: 0.07, delay: 0.15, type: 'triangle', slide: 990 }); T(440, 0.4, { vol: 0.05, delay: 0.25, type: 'sine', slide: 880 }); thud(a, T, 0.56, 0.45); },
  ax_g6_expelli: (a, T) => { a.noise(0.08, { vol: 0.45, type: 'highpass', from: 3000, to: 6000 }); T(900, 0.25, { vol: 0.08, type: 'saw', slide: 300 }); boom(a, T, 0.22, 0.45, 0.35); [0.5, 0.62, 0.7].forEach((d) => T(1568 + d * 400, 0.06, { vol: 0.06, delay: d, type: 'square' })); },
  ax_g6_kyuujou: (a, T) => { whoosh(a, 0, 0.5, 300, 3200, 0.3); T(300, 0.5, { vol: 0.06, type: 'triangle', slide: 1500 }); sparkle(T, 0.45); },
  ax_g6_quidditch: (a, T) => { for (let i = 0; i < 6; i++) T(900 + (i % 2) * 300, 0.05, { vol: 0.04, delay: i * 0.06, type: 'square' }); whoosh(a, 0.3, 0.35, 3000, 500, 0.3); boom(a, T, 0.62, 0.45, 0.3); },
  ax_g6_kizu: (a, T) => { T(220, 0.12, { vol: 0.12, type: 'saw', slide: 110 }); a.noise(0.08, { vol: 0.6, delay: 0.28, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.5, { vol: 0.5, delay: 0.32, from: 1200, to: 40 }); },
  ax_g6_gundan: (a, T) => { [0, 0.09, 0.18, 0.27].forEach((d, i) => T([1319, 1568, 1760, 2093][i], 0.3, { vol: 0.06, delay: d, type: 'triangle' })); chime(T, [523, 659, 784, 1047], 0.45, 0.04, 'sine', 0.06, 0.3); },
  ax_g6_patronus: (a, T) => { a.noise(0.7, { vol: 0.25, type: 'highpass', from: 4000, to: 8000 }); chime(T, [784, 988, 1175, 1568, 1976, 2349], 0, 0.07, 'sine', 0.06, 0.35); T(196, 0.7, { vol: 0.06, type: 'triangle', slide: 392 }); },
  ax_g6_gryffindor: (a, T) => { T(2093, 0.35, { vol: 0.07, type: 'sine' }); T(3136, 0.3, { vol: 0.04, delay: 0.05, type: 'sine' }); a.noise(0.12, { vol: 0.45, delay: 0.55, type: 'highpass', from: 2500, to: 7000 }); a.noise(0.2, { vol: 0.3, delay: 0.62, from: 3000, to: 300 }); },
  // ── 怪盗キッド ──
  ax_g6_card: (a) => { card(a, 0); card(a, 0.05); card(a, 0.1); card(a, 0.22, 0.25); },
  ax_g6_hato: (a, T) => { pop(a, T, 0); flap(a, 0.08, 5, 0.06, 0.16); },
  ax_g6_bako: (a, T) => { a.noise(0.05, { vol: 0.3, from: 1500, to: 600 }); boing(T, 0.1); T(1047, 0.1, { vol: 0.06, delay: 0.26, type: 'square' }); },
  ax_g6_joshu: (a, T) => { chime(T, [523, 659, 784, 1047], 0, 0.06, 'pulse', 0.06, 0.2); for (let i = 0; i < 5; i++) a.noise(0.03, { vol: 0.15, delay: 0.3 + i * 0.07, type: 'bandpass', from: 2000, to: 1500, q: 2 }); },
  ax_g6_fuyuu: (a, T) => { T(330, 0.35, { vol: 0.05, type: 'sine', slide: 660 }); whoosh(a, 0, 0.3, 500, 1500, 0.12); thud(a, T, 0.42, 0.45); },
  ax_g6_illusion: (a, T) => { whoosh(a, 0, 0.2, 400, 1200, 0.2); chime(T, [392, 523, 659, 784], 0.25, 0.05, 'triangle', 0.08, 0.3); sparkle(T, 0.45, 0.05); flap(a, 0.4, 3); },
  ax_g6_cardgun: (a) => { for (let i = 0; i < 6; i++) { a.noise(0.05, { vol: 0.3, delay: i * 0.055, type: 'bandpass', from: 1800, to: 900, q: 2 }); card(a, i * 0.055 + 0.2, 0.15); } },
  ax_g6_yokoku: (a, T) => { whoosh(a, 0, 0.4, 600, 900, 0.1); T(988, 0.3, { vol: 0.05, delay: 0.3, type: 'sine', slide: 494 }); },
  ax_g6_surikae: (a, T) => { a.noise(0.3, { vol: 0.35, from: 1800, to: 200 }); sparkle(T, 0.3, 0.06); },
  ax_g6_hensou: (a) => { for (let i = 0; i < 3; i++) a.noise(0.18, { vol: 0.3, delay: i * 0.11, from: 1600, to: 200 }); },
  ax_g6_glider: (a) => { a.noise(0.08, { vol: 0.3, type: 'bandpass', from: 900, to: 600, q: 2 }); whoosh(a, 0.08, 0.6, 1800, 500, 0.2); },
  ax_g6_itadaki: (a, T) => { a.noise(0.3, { vol: 0.35, delay: 0.1, from: 1800, to: 200 }); chime(T, [1568, 2093, 2637], 0.38, 0.06, 'sine', 0.06, 0.35); },
  ax_g6_joker: (a, T) => { for (let i = 0; i < 4; i++) card(a, i * 0.08, 0.15); boom(a, T, 0.42, 0.5, 0.35); },
  ax_g6_taigun: (a, T) => { pop(a, T, 0, 0.14); flap(a, 0.05, 9, 0.06, 0.18); boom(a, T, 0.42, 0.25, 0.3); },
  ax_g6_kemuri: (a, T) => { a.noise(0.6, { vol: 0.4, from: 1400, to: 120 }); chime(T, [1319, 1760], 0.3, 0.1, 'sine', 0.04, 0.25); },
  ax_g6_poker: (a, T) => { for (let i = 0; i < 5; i++) card(a, i * 0.04, 0.12); T(2637, 0.4, { vol: 0.06, delay: 0.3, type: 'sine' }); T(3520, 0.3, { vol: 0.04, delay: 0.33, type: 'sine' }); },
  ax_g6_diamond: (a, T) => { chime(T, [1760, 2093, 2349, 2637, 3136, 3520], 0, 0.05, 'sine', 0.05, 0.3); a.noise(0.4, { vol: 0.25, delay: 0.45, type: 'highpass', from: 3000, to: 6000 }); },
  ax_g6_tsukiyo: (a, T) => { whoosh(a, 0, 0.5, 600, 2400, 0.22); flap(a, 0.5, 2, 0.06, 0.2); boom(a, T, 0.64, 0.4, 0.16); },
  ax_g6_arashi: (a, T) => { for (let i = 0; i < 10; i++) a.noise(0.04, { vol: 0.25, delay: i * 0.045, type: 'bandpass', from: 2000, to: 1000, q: 2 }); boom(a, T, 0.5, 0.4, 0.3); },
  ax_g6_gekka: (a, T) => { chime(T, [392, 523, 659, 784, 1047], 0, 0.06, 'triangle', 0.07, 0.3); flap(a, 0.2, 3); sparkle(T, 0.5, 0.05); a.noise(0.25, { vol: 0.2, delay: 0.55, type: 'highpass', from: 3000, to: 6000 }); },
  // ── 鋼の錬金術師 ──
  ax_g6_toge: (a, T) => { clap(a, 0); zap(a, 0.06, 4); thud(a, T, 0.28, 0.45); },
  ax_g6_kabe: (a, T) => { zap(a, 0, 4); rumble(a, 0.15, 0.5, 0.4); },
  ax_g6_bunkai: (a) => { zap(a, 0, 5); for (let i = 0; i < 6; i++) a.noise(0.03, { vol: 0.12, delay: 0.3 + i * 0.05, type: 'highpass', from: 2500, to: 4000 }); },
  ax_g6_hannou: (a, T) => { zap(a, 0, 5, 0.2); boom(a, T, 0.3, 0.5, 0.4); },
  ax_g6_kusuri: (a, T) => { zap(a, 0, 2); pop(a, T, 0.3, 0.1); chime(T, [784, 1047, 1319], 0.35, 0.05, 'sine', 0.05, 0.25); },
  ax_g6_ootoko: (a, T) => { zap(a, 0, 3); rumble(a, 0.05, 0.4, 0.4); thud(a, T, 0.38, 0.6); },
  ax_g6_oonami: (a) => { rumble(a, 0, 0.5, 0.45); a.noise(0.4, { vol: 0.35, delay: 0.35, type: 'bandpass', from: 1200, to: 300, q: 1.5 }); },
  ax_g6_gindokei: (a, T) => { T(2400, 0.03, { vol: 0.1, type: 'square' }); a.noise(0.03, { vol: 0.2, from: 4000, to: 2000 }); T(2637, 0.4, { vol: 0.06, delay: 0.25, type: 'sine' }); T(3520, 0.3, { vol: 0.04, delay: 0.28, type: 'sine' }); },
  ax_g6_pacchin: (a, T) => { snap(a, T, 0.08); a.noise(0.1, { vol: 0.2, delay: 0.12, type: 'highpass', from: 4000, to: 6000 }); boom(a, T, 0.3, 0.6, 0.5); },
  ax_g6_toride: (a, T) => { zap(a, 0, 3); rumble(a, 0.1, 0.35, 0.4); thud(a, T, 0.36, 0.45); },
  ax_g6_hashira: (a, T) => { zap(a, 0, 4); boom(a, T, 0.26, 0.55, 0.35); },
  ax_g6_daibaku: (a, T) => { zap(a, 0, 7, 0.2); boom(a, T, 0.42, 0.65, 0.38); },
  ax_g6_ouzu: (a, T) => { snap(a, T, 0.08); a.noise(0.7, { vol: 0.4, delay: 0.1, type: 'bandpass', from: 300, to: 1500, q: 1 }); },
  ax_g6_ude: (a, T) => { a.noise(0.05, { vol: 0.25, type: 'highpass', from: 3000, to: 5000 }); T(1200, 0.1, { vol: 0.08, delay: 0.3, type: 'square', slide: 600 }); boom(a, T, 0.3, 0.5, 0.3); },
  ax_g6_yaiba: (a, T) => { clap(a, 0); zap(a, 0.12, 4); T(3136, 0.35, { vol: 0.06, delay: 0.36, type: 'sine' }); a.noise(0.06, { vol: 0.25, delay: 0.34, type: 'highpass', from: 5000, to: 7000 }); },
  ax_g6_hagane: (a, T) => { zap(a, 0, 4); T(600, 0.2, { vol: 0.08, delay: 0.36, type: 'square', slide: 300 }); a.noise(0.3, { vol: 0.35, delay: 0.36, type: 'highpass', from: 1500, to: 4000 }); },
  ax_g6_touka: (a, T) => { zap(a, 0, 2); T(1200, 0.05, { vol: 0.08, delay: 0.45, type: 'square' }); chime(T, [880, 1175], 0.5, 0.08, 'triangle', 0.05, 0.25); },
  ax_g6_mori: (a, T) => { zap(a, 0, 4); for (let i = 0; i < 6; i++) thud(a, T, 0.25 + i * 0.07, 0.3); },
  ax_g6_yari: (a, T) => { clap(a, 0); zap(a, 0.15, 6, 0.2); for (let i = 0; i < 4; i++) thud(a, T, 0.42 + i * 0.07, 0.4); },
  ax_g6_ryoute: (a, T) => { clap(a, 0); clap(a, 0.02); rumble(a, 0.2, 0.35, 0.4); boom(a, T, 0.55, 0.6, 0.25); },
  // ── 名探偵コナン ──
  ax_g6_ball: (a, T) => { T(260, 0.06, { vol: 0.15, type: 'sine', slide: 520 }); boing(T, 0.3); },
  ax_g6_kiki: (a, T) => { T(660, 0.1, { vol: 0.05, type: 'triangle' }); T(587, 0.1, { vol: 0.05, delay: 0.14, type: 'triangle' }); T(880, 0.12, { vol: 0.05, delay: 0.3, type: 'triangle', slide: 1100 }); },
  ax_g6_suiri: (a, T) => { chime(T, [1047, 1319, 1568, 2093], 0.2, 0.04, 'square', 0.04, 0.14); T(2093, 0.3, { vol: 0.05, delay: 0.38, type: 'sine' }); },
  ax_g6_badge: (a, T) => { T(1760, 0.06, { vol: 0.06, type: 'square' }); T(1760, 0.06, { vol: 0.06, delay: 0.1, type: 'square' }); chime(T, [1047, 1319], 0.25, 0.06, 'sine', 0.04, 0.2); },
  ax_g6_jitensha: (a, T) => { T(2637, 0.08, { vol: 0.05, type: 'sine' }); T(2637, 0.08, { vol: 0.05, delay: 0.12, type: 'sine' }); whoosh(a, 0.15, 0.4, 2000, 600, 0.2); },
  ax_g6_shutsudou: (a, T) => { chime(T, [523, 659, 784, 1047], 0, 0.06, 'pulse', 0.06, 0.14); for (let i = 0; i < 5; i++) a.noise(0.05, { vol: 0.15, delay: 0.1 + i * 0.07, from: 900, to: 300 }); thud(a, T, 0.3, 0.3); },
  ax_g6_shoot: (a, T) => { T(1568, 0.06, { vol: 0.06, type: 'square' }); a.noise(0.1, { vol: 0.3, delay: 0.14, from: 2000, to: 400 }); boom(a, T, 0.32, 0.5, 0.3); },
  ax_g6_fukiya: (a, T) => { T(1400, 0.03, { vol: 0.1, type: 'square' }); a.noise(0.06, { vol: 0.25, delay: 0.2, type: 'highpass', from: 3000, to: 6000 }); [0.38, 0.5, 0.62].forEach((d, i) => T(330 - i * 40, 0.1, { vol: 0.04, delay: d, type: 'triangle' })); },
  ax_g6_kick: (a, T) => { zap(a, 0, 4, 0.18); T(200, 0.06, { vol: 0.15, delay: 0.08, type: 'sine', slide: 600 }); boom(a, T, 0.26, 0.6, 0.45); },
  ax_g6_henseiki: (a, T) => { T(220, 0.2, { vol: 0.06, type: 'saw', slide: 440 }); T(440, 0.2, { vol: 0.05, delay: 0.2, type: 'square', slide: 220 }); T(660, 0.2, { vol: 0.04, delay: 0.4, type: 'triangle', slide: 330 }); },
  ax_g6_hannin: (a, T) => { a.noise(0.06, { vol: 0.4, delay: 0.32, type: 'highpass', from: 3000, to: 3000 }); T(1760, 0.25, { vol: 0.07, delay: 0.32, type: 'saw', slide: 880 }); },
  ax_g6_skate: (a, T) => { T(90, 0.5, { vol: 0.1, type: 'saw', slide: 140 }); for (let i = 0; i < 4; i++) a.noise(0.06, { vol: 0.2, delay: i * 0.08, from: 800, to: 300 }); whoosh(a, 0.3, 0.4, 2400, 800, 0.2); },
  ax_g6_shinjitsu: (a, T) => { T(2637, 0.3, { vol: 0.06, type: 'sine' }); T(3520, 0.25, { vol: 0.04, delay: 0.04, type: 'sine' }); a.noise(0.08, { vol: 0.5, delay: 0.36, type: 'highpass', from: 3000, to: 3000 }); T(2093, 0.3, { vol: 0.07, delay: 0.38, type: 'saw', slide: 3136 }); },
  ax_g6_belt: (a, T) => { a.noise(0.15, { vol: 0.25, from: 4000, to: 1500 }); T(300, 0.15, { vol: 0.08, type: 'sine', slide: 600 }); boom(a, T, 0.42, 0.5, 0.3); },
  ax_g6_yami: (a, T) => { T(110, 0.3, { vol: 0.1, type: 'saw', slide: 80 }); a.noise(0.12, { vol: 0.4, delay: 0.3, type: 'highpass', from: 2500, to: 6000 }); a.noise(0.25, { vol: 0.3, delay: 0.36, from: 2000, to: 150 }); },
  ax_g6_torihiki: (a, T) => { T(1200, 0.03, { vol: 0.1, type: 'square' }); T(900, 0.03, { vol: 0.08, delay: 0.05, type: 'square' }); whoosh(a, 0.3, 0.45, 2400, 400, 0.22); },
  ax_g6_codename: (a, T) => { T(2349, 0.4, { vol: 0.05, delay: 0.1, type: 'sine' }); T(2793, 0.35, { vol: 0.04, delay: 0.14, type: 'sine' }); T(110, 0.5, { vol: 0.08, type: 'triangle', slide: 82 }); },
  ax_g6_kuruma: (a, T) => { T(70, 0.5, { vol: 0.14, type: 'saw', slide: 110 }); a.noise(0.2, { vol: 0.25, delay: 0.25, type: 'bandpass', from: 2500, to: 2000, q: 8 }); thud(a, T, 0.42, 0.5); },
  ax_g6_aptx: (a, T) => { T(1319, 0.06, { vol: 0.06, type: 'triangle' }); T(55, 0.15, { vol: 0.25, delay: 0.48, type: 'sine', slide: 45 }); a.noise(0.3, { vol: 0.25, delay: 0.55, type: 'highpass', from: 2000, to: 5000 }); },
  ax_g6_meirei: (a, T) => { [0, 0.18].forEach((d) => { T(700, 0.12, { vol: 0.06, delay: d, type: 'saw', slide: 500 }); a.noise(0.1, { vol: 0.12, delay: d, type: 'bandpass', from: 1200, to: 900, q: 3 }); }); a.noise(0.15, { vol: 0.45, delay: 0.46, type: 'highpass', from: 2500, to: 7000 }); boom(a, T, 0.52, 0.35, 0.25); },
  ax_g6_sogeki: (a, T) => { T(2400, 0.05, { vol: 0.06, type: 'square' }); T(2400, 0.05, { vol: 0.06, delay: 0.1, type: 'square' }); a.noise(0.06, { vol: 0.6, delay: 0.5, type: 'highpass', from: 2000, to: 2000 }); boom(a, T, 0.52, 0.4, 0.26); },
  // ── おしり探偵 ──
  ax_g6_oshiri_suiri: (a, T) => { T(392, 0.15, { vol: 0.05, type: 'triangle' }); T(330, 0.2, { vol: 0.05, delay: 0.18, type: 'triangle' }); T(1568, 0.25, { vol: 0.05, delay: 0.42, type: 'sine', slide: 2093 }); },
  ax_g6_kunkun: (a) => { for (let i = 0; i < 4; i++) a.noise(0.07, { vol: 0.2, delay: i * 0.12, type: 'bandpass', from: 2200, to: 1800, q: 4 }); },
  ax_g6_pupu: (a, T) => { T(180, 0.08, { vol: 0.12, type: 'square', slide: 140 }); T(200, 0.08, { vol: 0.1, delay: 0.14, type: 'square', slide: 150 }); sparkle(T, 0.26, 0.04); },
  ax_g6_brown: (a, T) => { T(600, 0.07, { vol: 0.1, type: 'saw', slide: 420 }); T(640, 0.08, { vol: 0.1, delay: 0.1, type: 'saw', slide: 440 }); for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.12, delay: 0.15 + i * 0.05, from: 1200, to: 500 }); thud(a, T, 0.34, 0.3); },
  ax_g6_oyatsu: (a, T) => { chime(T, [784, 988, 784, 1175], 0, 0.1, 'triangle', 0.05, 0.12); chime(T, [1047, 1319, 1568], 0.4, 0.05, 'sine', 0.05, 0.25); },
  ax_g6_shitsurei: (a, T) => { T(90, 0.12, { vol: 0.2, type: 'square', slide: 70 }); T(150, 0.5, { vol: 0.1, delay: 0.1, type: 'saw', slide: 90 }); a.noise(0.55, { vol: 0.3, delay: 0.1, type: 'bandpass', from: 300, to: 900, q: 1.5 }); },
  ax_g6_tsuiseki: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.06, { vol: 0.18, delay: i * 0.1, type: 'bandpass', from: 2200, to: 1800, q: 4 }); chime(T, [1568, 2093, 2637], 0.46, 0.05, 'sine', 0.05, 0.25); },
  // ── 合体技 ──
  ax_g6_kakehiki: (a, T) => { for (let i = 0; i < 4; i++) card(a, 0.1 + i * 0.05); chime(T, [1568, 2093, 2637, 3136], 0.5, 0.05, 'sine', 0.06, 0.25); boom(a, T, 0.6, 0.3, 0.2); },
  ax_g6_hippo: (a, T) => { flap(a, 0, 4, 0.12, 0.22); whoosh(a, 0.45, 0.3, 2400, 600, 0.25); T(1100, 0.2, { vol: 0.05, delay: 0.1, type: 'saw', slide: 1500 }); },
};
