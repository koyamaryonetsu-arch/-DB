// 第51回 C3（o9）: 幻の職業の 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o9_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o9_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは C3 だけが さわる
// ドン
const don = (a, T, d = 0, v = 0.45) => { a.noise(0.3, { vol: v, delay: d, from: 1600, to: 50 }); T(85, 0.28, { vol: 0.2, type: 'triangle', slide: 40, delay: d }); };
// ゴロゴロ・ピシャーン（雷）
const pishan = (a, T, d = 0, v = 0.5) => { a.noise(0.06, { vol: v, delay: d, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.4, { vol: v * 0.8, delay: d + 0.05, from: 900, to: 30 }); T(1600, 0.08, { vol: 0.05, type: 'saw', slide: 300, delay: d }); };
const goro = (a, d = 0, dur = 0.5, v = 0.3) => a.noise(dur, { vol: v, delay: d, type: 'bandpass', from: 120, to: 60, q: 0.8 });
// キラーン
const kira = (T, d = 0, v = 0.05) => [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.18, { vol: v, type: 'sine', delay: d + i * 0.05 }));
// シャララーン（回復）
const shara = (T, d = 0, v = 0.05) => [1047, 1319, 1568, 2093, 2637].forEach((f, i) => T(f, 0.18, { vol: v, type: 'sine', delay: d + i * 0.05 }));
// ガタン
const gatan = (a, d = 0, v = 0.3) => { a.noise(0.07, { vol: v, delay: d, from: 900, to: 200 }); a.noise(0.07, { vol: v * 0.8, delay: d + 0.11, from: 800, to: 150 }); };
// ゴォォ（はしる 風）
const gou = (a, dur = 0.5, d = 0, v = 0.35) => a.noise(dur, { vol: v, delay: d, type: 'bandpass', from: 300, to: 1400, q: 0.7 });
// ワー（観客）
const waa = (a, d = 0, dur = 0.6, v = 0.25) => { a.noise(dur, { vol: v, delay: d, type: 'bandpass', from: 700, to: 1100, q: 1.2 }); a.noise(dur * 0.8, { vol: v * 0.6, delay: d + 0.05, type: 'bandpass', from: 1500, to: 1900, q: 1.5 }); };
// ズバン（ミット）
const zuban = (a, d = 0) => { a.noise(0.06, { vol: 0.45, delay: d, type: 'highpass', from: 1500, to: 1500 }); a.noise(0.18, { vol: 0.35, delay: d + 0.02, from: 1200, to: 100 }); };
// ザー（雨）
const zaa = (a, dur = 0.6, d = 0, v = 0.3) => a.noise(dur, { vol: v, delay: d, type: 'highpass', from: 3000, to: 4500 });
// シューン（消える）
const shuun = (T, d = 0, v = 0.07) => T(2400, 0.4, { vol: v, type: 'sine', slide: 300, delay: d });
// カン（金づち）
const kan = (T, d = 0, v = 0.08) => { T(2637, 0.12, { vol: v, type: 'square', delay: d }); T(3951, 0.08, { vol: v * 0.5, type: 'sine', delay: d }); };
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.12, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));

export const SFX_AX_O9 = {
  // ── 宇宙一のおかん
  ax_o9_kora: (a, T) => { T(330, 0.35, { vol: 0.12, type: 'saw', slide: 520 }); T(660, 0.3, { vol: 0.06, type: 'square', slide: 990 }); pishan(a, T, 0.35, 0.45); },
  ax_o9_gohan: (a, T) => { T(784, 0.12, { vol: 0.06, type: 'triangle' }); T(1047, 0.2, { vol: 0.06, type: 'triangle', delay: 0.12 }); shara(T, 0.3); },
  ax_o9_hansei: (a, T) => { a.noise(0.15, { vol: 0.3, from: 600, to: 120 }); T(220, 0.4, { vol: 0.08, type: 'triangle', slide: 160, delay: 0.2 }); T(196, 0.3, { vol: 0.06, type: 'triangle', slide: 140, delay: 0.5 }); },
  ax_o9_slipper: (a, T) => { a.noise(0.25, { vol: 0.3, type: 'bandpass', from: 1500, to: 4500, q: 1.5 }); kira(T, 0.05, 0.04); a.noise(0.08, { vol: 0.6, delay: 0.3, type: 'highpass', from: 2000, to: 2000 }); don(a, T, 0.32, 0.35); },
  ax_o9_bentou: (a, T) => { T(1319, 0.08, { vol: 0.05, type: 'square' }); T(1568, 0.12, { vol: 0.05, type: 'square', delay: 0.08 }); shara(T, 0.25, 0.045); },
  ax_o9_ai: (a, T) => { T(110, 0.25, { vol: 0.2, type: 'sine', slide: 80 }); T(110, 0.25, { vol: 0.2, type: 'sine', slide: 80, delay: 0.3 }); arp(T, [1047, 1319, 1568, 2093], 0.07, { type: 'sine', vol: 0.05, delay: 0.35, dur: 0.22 }); },
  ax_o9_kaji: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.06, { vol: 0.2, delay: i * 0.07, type: 'bandpass', from: 1800, to: 3200, q: 2 }); kira(T, 0.45); },
  ax_o9_kaminari: (a, T) => { T(220, 0.4, { vol: 0.12, type: 'saw', slide: 440 }); goro(a, 0.1, 0.4, 0.3); pishan(a, T, 0.3, 0.55); pishan(a, T, 0.35, 0.35); },
  // ── はかいと創造の神
  ax_o9_massara: (a, T) => { T(1800, 0.3, { vol: 0.05, type: 'sine', slide: 2600 }); a.noise(0.4, { vol: 0.3, delay: 0.25, type: 'highpass', from: 4000, to: 6000 }); shuun(T, 0.35); },
  ax_o9_tsukurikae: (a, T) => { kan(T, 0); kan(T, 0.16); kan(T, 0.32); kira(T, 0.45); },
  ax_o9_kowashite: (a, T) => { a.noise(0.4, { vol: 0.5, from: 2000, to: 80 }); gatan(a, 0.1, 0.3); kan(T, 0.4); kira(T, 0.45, 0.04); },
  ax_o9_mu: (a, T) => { T(2093, 0.6, { vol: 0.06, type: 'sine' }); T(3136, 0.5, { vol: 0.04, type: 'sine', delay: 0.05 }); a.noise(0.6, { vol: 0.25, delay: 0.15, type: 'highpass', from: 5000, to: 7000 }); shuun(T, 0.3); },
  ax_o9_sagyoudai: (a, T) => { kan(T, 0); kan(T, 0.12, 0.06); kan(T, 0.3); shara(T, 0.36, 0.04); },
  ax_o9_dama: (a, T) => { T(150, 0.4, { vol: 0.12, type: 'saw', slide: 600 }); a.noise(0.3, { vol: 0.2, type: 'bandpass', from: 600, to: 2000, q: 3 }); a.noise(0.45, { vol: 0.55, delay: 0.35, from: 2200, to: 40 }); },
  ax_o9_rule: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.05, { vol: 0.18, delay: i * 0.06, type: 'bandpass', from: 2400, to: 3600, q: 3 }); T(392, 0.15, { vol: 0.08, type: 'square', delay: 0.35 }); T(262, 0.25, { vol: 0.08, type: 'square', delay: 0.5 }); },
  ax_o9_bigbang: (a, T) => { T(80, 0.3, { vol: 0.15, type: 'sine', slide: 40 }); a.noise(0.06, { vol: 0.6, delay: 0.28, type: 'highpass', from: 2000, to: 2000 }); a.noise(0.5, { vol: 0.7, delay: 0.3, from: 2600, to: 30 }); kira(T, 0.45, 0.05); },
  // ── 夢のスタジアム鉄道
  ax_o9_densha: (a, T) => { T(1100, 0.25, { vol: 0.08, type: 'square' }); T(880, 0.25, { vol: 0.08, type: 'square', delay: 0.25 }); gatan(a, 0.1); gatan(a, 0.35); waa(a, 0.2, 0.55); },
  ax_o9_yell: (a, T) => { waa(a, 0, 0.7, 0.3); arp(T, [784, 784, 880, 988], 0.12, { vol: 0.05 }); },
  ax_o9_straight: (a, T) => { a.noise(0.2, { vol: 0.35, type: 'bandpass', from: 1500, to: 4500, q: 1.5 }); zuban(a, 0.25); waa(a, 0.35, 0.4, 0.18); },
  ax_o9_wave: (a, T) => { waa(a, 0, 0.75, 0.28); shara(T, 0.35, 0.04); },
  ax_o9_tokkyu: (a, T) => { T(1100, 0.2, { vol: 0.08, type: 'square' }); T(880, 0.2, { vol: 0.08, type: 'square', delay: 0.2 }); gou(a, 0.6, 0.1); gatan(a, 0.3); gatan(a, 0.55); },
  ax_o9_makyu: (a, T) => { gou(a, 0.4, 0); T(1568, 0.1, { vol: 0.05, type: 'square', delay: 0.35 }); T(1175, 0.15, { vol: 0.05, type: 'square', delay: 0.45 }); zuban(a, 0.6); },
  ax_o9_lucky7: (a, T) => { arp(T, [523, 659, 784, 1047, 784, 1047, 1319], 0.08, { vol: 0.05, type: 'triangle' }); waa(a, 0.3, 0.45, 0.2); },
  ax_o9_onrei: (a, T) => { T(1100, 0.2, { vol: 0.08, type: 'square' }); gou(a, 0.5, 0, 0.4); waa(a, 0.1, 0.6, 0.3); don(a, T, 0.5, 0.55); },
  // ── 天候の神
  ax_o9_hare: (a, T) => { arp(T, [523, 659, 784, 1047], 0.08, { vol: 0.05, type: 'sine', dur: 0.3 }); kira(T, 0.35); },
  ax_o9_ame: (a, T) => { zaa(a, 0.7, 0, 0.18); shara(T, 0.25, 0.04); },
  ax_o9_kaminari_sora: (a, T) => { goro(a, 0, 0.4, 0.35); pishan(a, T, 0.35, 0.5); },
  ax_o9_manatsu: (a, T) => { T(440, 0.4, { vol: 0.06, type: 'sine', slide: 880 }); a.noise(0.5, { vol: 0.35, delay: 0.2, from: 500, to: 3000 }); a.noise(0.3, { vol: 0.3, delay: 0.5, from: 2800, to: 200 }); },
  ax_o9_gouu: (a, T) => { zaa(a, 0.75, 0, 0.35); a.noise(0.4, { vol: 0.35, delay: 0.35, type: 'bandpass', from: 2400, to: 400, q: 1.5 }); },
  ax_o9_raitei: (a, T) => { goro(a, 0, 0.3, 0.3); pishan(a, T, 0.28, 0.65); don(a, T, 0.32, 0.4); },
  ax_o9_niji: (a, T) => { arp(T, [523, 587, 659, 698, 784, 880, 988], 0.06, { vol: 0.045, type: 'sine', dur: 0.35 }); },
  ax_o9_hanten: (a, T) => { arp(T, [784, 1047], 0.08, { vol: 0.05, type: 'sine' }); zaa(a, 0.25, 0.2, 0.2); goro(a, 0.3, 0.2, 0.3); pishan(a, T, 0.35, 0.5); },
};
