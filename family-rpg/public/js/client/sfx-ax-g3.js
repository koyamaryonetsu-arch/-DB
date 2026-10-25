// 第48回 G3（鬼滅の刃 ＋ るろうに剣心 ＋ 暴れん坊将軍）: 大技の 音（sfx-ax.js が まぜる）。なまえは 'ax_g3_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_g3_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは G3 だけが さわる
// こまかい 音の ぶひん
const zan = (a, T, d = 0, v = 1) => { a.noise(0.1, { vol: 0.42 * v, delay: d, type: 'highpass', from: 2600, to: 7000 }); a.noise(0.18, { vol: 0.28 * v, delay: d + 0.06, from: 3200, to: 300 }); T(1600, 0.08, { vol: 0.04 * v, delay: d, type: 'saw', slide: 500 }); };
const shu = (a, d = 0, v = 1) => a.noise(0.07, { vol: 0.32 * v, delay: d, type: 'highpass', from: 4000, to: 9000 });
const don = (a, T, d = 0, v = 1) => { a.noise(0.5, { vol: 0.5 * v, delay: d, from: 1600, to: 50 }); T(80, 0.35, { vol: 0.22 * v, delay: d, type: 'triangle', slide: 35 }); };
const chin = (T, d = 0, v = 1) => { T(2637, 0.4, { vol: 0.06 * v, delay: d, type: 'sine' }); T(3951, 0.3, { vol: 0.035 * v, delay: d + 0.01, type: 'sine' }); };
const splash = (a, d = 0, v = 1) => { a.noise(0.3, { vol: 0.32 * v, delay: d, type: 'bandpass', from: 2600, to: 500, q: 1.4 }); a.noise(0.25, { vol: 0.2 * v, delay: d + 0.08, from: 1200, to: 300 }); };
const fire = (a, d = 0, v = 1, dur = 0.45) => { a.noise(dur, { vol: 0.34 * v, delay: d, from: 500, to: 2800 }); a.noise(dur, { vol: 0.3 * v, delay: d + dur * 0.4, from: 2600, to: 160 }); };
const wind = (a, d = 0, v = 1, dur = 0.4) => a.noise(dur, { vol: 0.26 * v, delay: d, type: 'bandpass', from: 500, to: 2600, q: 4 });
const bell = (T, notes, step = 0.06, d = 0, v = 1, type = 'sine') => notes.forEach((f, i) => T(f, 0.3, { vol: 0.05 * v, delay: d + i * step, type }));

// 1つの 音は 0.8びょう まで（おそく はじまる 音・ながい 音は みじかく する）
const MAX = 0.8;
const fit = (o, dur) => {
  o = o || {};
  const delay = Math.min(o.delay || 0, MAX - 0.06);
  return [Math.max(0.04, Math.min(dur, MAX - delay)), { ...o, delay }];
};
const clamp = (fn) => (a, T) => fn(
  { noise: (dur, o) => { const [d, oo] = fit(o, dur); return a.noise(d, oo); } },
  (f, dur, o) => { const [d, oo] = fit(o, dur); return T(f, d, oo); },
);

const RAW = {
  // ───── 鬼滅の刃 ─────
  ax_g3_water: (a, T) => { a.noise(0.2, { vol: 0.16, type: 'bandpass', from: 900, to: 400, q: 2 }); zan(a, T, 0.16); splash(a, 0.24); },
  ax_g3_breath: (a, T) => { a.noise(0.55, { vol: 0.22, type: 'bandpass', from: 700, to: 300, q: 2.5 }); T(220, 0.5, { vol: 0.04, type: 'sine', slide: 330, attack: 0.3 }); splash(a, 0.4, 0.5); },
  ax_g3_pop: (a, T) => { a.noise(0.3, { vol: 0.18, type: 'bandpass', from: 600, to: 900, q: 2 }); a.noise(0.08, { vol: 0.6, delay: 0.38, from: 5000, to: 500 }); T(900, 0.06, { vol: 0.1, delay: 0.38, type: 'square', slide: 200 }); bell(T, [1319, 1568, 2093], 0.06, 0.48, 0.8); },
  ax_g3_water3: (a, T) => { [0.18, 0.28, 0.38].forEach((d, i) => { zan(a, T, d, 0.8 + i * 0.1); splash(a, d + 0.04, 0.5); }); },
  ax_g3_whirl: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.14, { vol: 0.2, delay: i * 0.08, type: 'bandpass', from: 500 + i * 250, to: 2000, q: 4 }); splash(a, 0.34, 1.2); },
  ax_g3_wdragon: (a, T) => { T(120, 0.5, { vol: 0.12, type: 'saw', slide: 240, attack: 0.3 }); a.noise(0.45, { vol: 0.24, type: 'bandpass', from: 600, to: 2400, q: 2 }); a.noise(0.35, { vol: 0.5, delay: 0.5, from: 1800, to: 100 }); splash(a, 0.52, 1.3); },
  ax_g3_flow: (a, T) => { a.noise(0.4, { vol: 0.18, type: 'highpass', from: 2000, to: 5000 }); zan(a, T, 0.22, 0.8); zan(a, T, 0.34, 0.8); splash(a, 0.4, 0.6); },
  ax_g3_fire: (a, T) => { fire(a, 0, 0.8, 0.3); zan(a, T, 0.24); },
  ax_g3_umai: (a, T) => { [523, 659, 784, 1047].forEach((f, i) => T(f, 0.12, { vol: 0.08, delay: i * 0.07, type: 'pulse' })); [784, 1047].forEach((f, i) => T(f, 0.14, { vol: 0.08, delay: 0.42 + i * 0.09, type: 'pulse' })); fire(a, 0.1, 0.4, 0.3); },
  ax_g3_fireup: (a, T) => { fire(a, 0, 1, 0.35); zan(a, T, 0.26, 1.1); a.noise(0.4, { vol: 0.25, delay: 0.32, from: 400, to: 4000 }); },
  ax_g3_firewhirl: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.2, { vol: 0.24, delay: i * 0.1, from: 400 + i * 300, to: 2600 }); fire(a, 0.38, 1.1, 0.35); },
  ax_g3_kokoro: (a, T) => { T(110, 0.1, { vol: 0.2, type: 'sine', slide: 70 }); fire(a, 0.15, 1, 0.4); bell(T, [523, 659, 784, 1047], 0.07, 0.4, 1, 'triangle'); },
  ax_g3_rengoku: (a, T) => { T(90, 0.6, { vol: 0.16, type: 'saw', slide: 50, attack: 0.2 }); fire(a, 0, 1.2, 0.4); zan(a, T, 0.56, 1.3); don(a, T, 0.58, 1.2); },
  ax_g3_enko: (a, T) => { T(160, 0.35, { vol: 0.14, type: 'saw', slide: 90 }); a.noise(0.3, { vol: 0.3, type: 'bandpass', from: 400, to: 1200, q: 2 }); fire(a, 0.45, 1.1, 0.3); },
  ax_g3_kasha: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.09, { vol: 0.2, delay: i * 0.09, from: 800, to: 2600 }); zan(a, T, 0.42, 1.2); fire(a, 0.46, 0.7, 0.3); },
  ax_g3_clear: (a, T) => { T(1760, 0.7, { vol: 0.03, type: 'sine' }); chin(T, 0.45, 1.3); T(5274, 0.3, { vol: 0.02, delay: 0.5, type: 'sine' }); },
  ax_g3_koukyou: (a, T) => { zan(a, T, 0.28); zan(a, T, 0.52); fire(a, 0.55, 0.7, 0.25); },
  ax_g3_hirin: (a, T) => { T(440, 0.55, { vol: 0.04, type: 'sine', slide: 460 }); T(452, 0.55, { vol: 0.04, type: 'sine', slide: 430 }); zan(a, T, 0.6, 1.2); },
  ax_g3_aza: (a, T) => { fire(a, 0, 0.7, 0.4); T(196, 0.6, { vol: 0.08, type: 'triangle', slide: 392, attack: 0.4 }); bell(T, [784, 988, 1175], 0.08, 0.4); },
  ax_g3_kagura: (a, T) => { [0.06, 0.26, 0.46, 0.64].forEach((d) => { a.noise(0.14, { vol: 0.28, delay: d, from: 600, to: 2600 }); shu(a, d + 0.1, 0.7); }); },
  ax_g3_enbu: (a, T) => { a.noise(0.4, { vol: 0.22, from: 500, to: 2400 }); zan(a, T, 0.3, 1); fire(a, 0.5, 1, 0.3); },
  // ───── るろうに剣心 ─────
  ax_g3_battou: (a, T) => { T(2400, 0.03, { vol: 0.1, type: 'square' }); shu(a, 0.06, 1.3); zan(a, T, 0.08); },
  ax_g3_oro: (a, T) => { T(660, 0.18, { vol: 0.07, type: 'triangle', slide: 440 }); T(500, 0.3, { vol: 0.07, delay: 0.18, type: 'triangle', slide: 760 }); T(1200, 0.05, { vol: 0.04, delay: 0.4, type: 'sine' }); },
  ax_g3_doryu: (a, T) => { don(a, T, 0, 0.8); for (let i = 0; i < 5; i++) a.noise(0.06, { vol: 0.22, delay: 0.2 + i * 0.07, from: 2400, to: 600 }); },
  ax_g3_ryukan: (a, T) => { wind(a, 0, 1, 0.25); zan(a, T, 0.24); },
  ax_g3_wash: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.09, { vol: 0.2, delay: i * 0.1, type: 'bandpass', from: 1200, to: 800, q: 3 }); bell(T, [1568, 2093, 2637], 0.05, 0.42); },
  ax_g3_ryutsui: (a, T) => { T(400, 0.25, { vol: 0.06, type: 'sine', slide: 1400 }); shu(a, 0.28); don(a, T, 0.32); },
  ax_g3_ryusho: (a, T) => { shu(a, 0.05); zan(a, T, 0.18, 1.1); T(800, 0.2, { vol: 0.04, delay: 0.2, type: 'sine', slide: 1600 }); },
  ax_g3_kenki: (a, T) => { T(70, 0.6, { vol: 0.16, type: 'saw', slide: 55, attack: 0.2 }); T(3520, 0.25, { vol: 0.03, delay: 0.3, type: 'sine' }); a.noise(0.4, { vol: 0.1, delay: 0.1, type: 'highpass', from: 6000, to: 8000 }); },
  ax_g3_souryu: (a, T) => { zan(a, T, 0.1); T(220, 0.12, { vol: 0.2, delay: 0.32, type: 'square', slide: 110 }); a.noise(0.12, { vol: 0.45, delay: 0.32, from: 2000, to: 200 }); },
  ax_g3_yamiyo: (a, T) => { T(110, 0.4, { vol: 0.06, type: 'sine' }); shu(a, 0.36, 1.2); zan(a, T, 0.38, 0.8); },
  ax_g3_ryumei: (a, T) => { T(2400, 0.04, { vol: 0.12, type: 'square' }); [2637, 2794, 3136, 2960].forEach((f, i) => T(f, 0.5, { vol: 0.05, delay: 0.25 + i * 0.03, type: 'sine', slide: f * 0.97 })); },
  ax_g3_ryusou: (a, T) => { for (let i = 0; i < 8; i++) shu(a, 0.04 + i * 0.05, 0.9); zan(a, T, 0.46, 1.1); },
  ax_g3_ryutsuishou: (a, T) => { shu(a, 0.1); don(a, T, 0.26, 0.9); zan(a, T, 0.5, 1.1); },
  ax_g3_hiryu: (a, T) => { T(1800, 0.03, { vol: 0.1, type: 'square' }); wind(a, 0.06, 0.8, 0.25); T(330, 0.1, { vol: 0.2, delay: 0.34, type: 'square', slide: 160 }); a.noise(0.1, { vol: 0.4, delay: 0.34, from: 3000, to: 300 }); },
  ax_g3_fusatsu: (a, T) => { chin(T, 0, 1.2); bell(T, [1047, 1319, 1568], 0.08, 0.35); },
  ax_g3_arashi: (a, T) => { for (let i = 0; i < 4; i++) wind(a, i * 0.12, 0.9, 0.3); zan(a, T, 0.52, 1.1); },
  ax_g3_tea: (a, T) => { a.noise(0.25, { vol: 0.14, type: 'bandpass', from: 1500, to: 900, q: 2 }); T(392, 0.4, { vol: 0.05, delay: 0.35, type: 'sine', slide: 330 }); bell(T, [1047, 1319], 0.1, 0.45, 0.8); },
  ax_g3_tsumuji: (a, T) => { wind(a, 0, 1, 0.3); [0.3, 0.42, 0.54].forEach((d) => zan(a, T, d, 0.8)); },
  ax_g3_kuzu: (a, T) => { shu(a, 0, 1.2); for (let i = 0; i < 9; i++) a.noise(0.05, { vol: 0.28, delay: 0.28 + i * 0.012, type: 'highpass', from: 3000, to: 8000 }); don(a, T, 0.34, 1.2); },
  ax_g3_kogarashi: (a, T) => { a.noise(0.5, { vol: 0.24, type: 'bandpass', from: 2200, to: 700, q: 5 }); zan(a, T, 0.48, 1); T(2093, 0.3, { vol: 0.03, delay: 0.5, type: 'sine' }); },
  ax_g3_shinsoku: (a, T) => { T(60, 0.25, { vol: 0.05, type: 'sine' }); shu(a, 0.28, 1.5); zan(a, T, 0.3, 1.2); },
  ax_g3_mantle: (a, T) => { a.noise(0.3, { vol: 0.4, type: 'bandpass', from: 400, to: 1600, q: 1.2 }); don(a, T, 0.5, 1.1); },
  ax_g3_ootatsu: (a, T) => { a.noise(0.8, { vol: 0.4, type: 'bandpass', from: 300, to: 1600, q: 2 }); T(70, 0.7, { vol: 0.12, type: 'saw', slide: 110 }); },
  ax_g3_ikiyou: (a, T) => { T(80, 0.12, { vol: 0.2, type: 'sine', slide: 55 }); T(80, 0.12, { vol: 0.16, delay: 0.22, type: 'sine', slide: 55 }); bell(T, [1319, 1760, 2093, 2637], 0.06, 0.45); },
  ax_g3_yomi: (a, T) => { T(3136, 0.3, { vol: 0.05, type: 'sine' }); a.noise(0.3, { vol: 0.14, delay: 0.3, type: 'highpass', from: 3000, to: 6000 }); T(660, 0.25, { vol: 0.05, delay: 0.5, type: 'triangle', slide: 330 }); },
  ax_g3_amakakeru: (a, T) => { T(2600, 0.04, { vol: 0.12, type: 'square' }); a.noise(0.35, { vol: 0.5, delay: 0.05, type: 'highpass', from: 2000, to: 8000 }); wind(a, 0.4, 1.2, 0.35); zan(a, T, 0.74, 1.4); don(a, T, 0.76, 1.2); },
  ax_g3_shinkuzu: (a, T) => { shu(a, 0, 1.2); for (let i = 0; i < 9; i++) a.noise(0.06, { vol: 0.3, delay: 0.4 + i * 0.015, type: 'highpass', from: 2500, to: 8000 }); don(a, T, 0.56, 1.5); },
  ax_g3_daidoryu: (a, T) => { don(a, T, 0, 1); for (let i = 0; i < 6; i++) don(a, T, 0.12 + i * 0.1, 0.6); },
  // ───── 暴れん坊将軍 ─────
  ax_g3_mineuchi: (a, T) => { T(1800, 0.05, { vol: 0.06, type: 'sine', slide: 2400 }); a.noise(0.12, { vol: 0.5, delay: 0.36, from: 2400, to: 300 }); T(300, 0.12, { vol: 0.2, delay: 0.36, type: 'square', slide: 120 }); bell(T, [1568, 1760, 1568], 0.08, 0.5, 0.8, 'triangle'); },
  ax_g3_kao: (a, T) => { T(130, 0.5, { vol: 0.12, type: 'saw', slide: 98 }); [392, 523, 659].forEach((f) => T(f, 0.5, { vol: 0.05, delay: 0.35, type: 'triangle' })); don(a, T, 0.62, 0.9); },
  ax_g3_horse: (a, T) => { for (let i = 0; i < 6; i++) { a.noise(0.05, { vol: 0.3, delay: i * 0.1, from: 1400, to: 300 }); T(180, 0.04, { vol: 0.08, delay: i * 0.1 + 0.03, type: 'triangle' }); } T(800, 0.25, { vol: 0.05, delay: 0.55, type: 'saw', slide: 1300 }); },
  ax_g3_meyasu: (a, T) => { T(300, 0.08, { vol: 0.15, type: 'triangle' }); a.noise(0.5, { vol: 0.12, delay: 0.1, type: 'highpass', from: 3000, to: 5000 }); bell(T, [784, 988, 1175, 1568], 0.08, 0.5); },
  ax_g3_onari: (a, T) => { don(a, T, 0, 0.8); don(a, T, 0.18, 1); a.noise(0.4, { vol: 0.15, delay: 0.25, type: 'bandpass', from: 600, to: 1200, q: 2 }); bell(T, [523, 659, 784, 1047], 0.07, 0.4, 1, 'triangle'); },
  ax_g3_seibai: (a, T) => { T(2400, 0.03, { vol: 0.1, type: 'square' }); [0.18, 0.32, 0.46, 0.6].forEach((d) => { a.noise(0.1, { vol: 0.4, delay: d, from: 2400, to: 300 }); T(260, 0.08, { vol: 0.14, delay: d, type: 'square', slide: 120 }); }); },
  ax_g3_oniwaban: (a, T) => { a.noise(0.08, { vol: 0.3, from: 1600, to: 400 }); for (let i = 0; i < 5; i++) shu(a, 0.25 + i * 0.07, 0.9); a.noise(0.3, { vol: 0.2, delay: 0.6, from: 1200, to: 200 }); },
  ax_g3_tenka: (a, T) => { for (let i = 0; i < 6; i++) zan(a, T, 0.05 + i * 0.08, 0.7); don(a, T, 0.62, 1.2); },
  ax_g3_sentaku: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.1, { vol: 0.2, delay: i * 0.12, type: 'bandpass', from: 1200, to: 800, q: 3 }); [0.42, 0.52].forEach((d) => a.noise(0.05, { vol: 0.3, delay: d, from: 2600, to: 900 })); bell(T, [1047, 1319, 1568, 2093], 0.06, 0.55); },
  ax_g3_sanken: (a, T) => { [0.3, 0.42, 0.54].forEach((d, i) => zan(a, T, d, 0.9 + i * 0.1)); chin(T, 0.66, 1.4); },
  ax_g3_megumi: (a, T) => { [0, 0.16].forEach((d) => { T(330, 0.1, { vol: 0.08, delay: d, type: 'pulse' }); T(392, 0.1, { vol: 0.08, delay: d + 0.08, type: 'pulse' }); }); zan(a, T, 0.58, 1.1); don(a, T, 0.6, 0.8); },
};

export const SFX_AX_G3 = Object.fromEntries(Object.entries(RAW).map(([id, fn]) => [id, clamp(fn)]));
