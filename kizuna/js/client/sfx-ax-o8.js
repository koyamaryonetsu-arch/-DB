// 第51回 C2（o8）: 幻の職業 4つの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o8_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o8_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは C2 だけが さわる
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur ?? 0.16, { vol: o.vol ?? 0.05, delay: (o.delay || 0) + i * gap, type: o.type || 'sine', slide: o.slide }));
const sparkle = (T, delay = 0, vol = 0.04) => arp(T, [2637, 3136, 3520, 4186], 0.04, { delay, vol, dur: 0.12 });
const boom = (a, T, delay = 0, vol = 0.45) => { a.noise(0.5, { vol, delay, from: 1800, to: 60 }); T(110, 0.4, { vol: 0.14, delay, type: 'saw', slide: 45 }); };
const swish = (a, delay = 0, vol = 0.35) => a.noise(0.1, { vol, delay, type: 'highpass', from: 2500, to: 7000 });
const ring = (T, f, delay = 0, vol = 0.05, dur = 0.5) => { T(f, dur, { vol, delay, type: 'sine' }); T(f * 1.5, dur * 0.8, { vol: vol * 0.6, delay: delay + 0.02, type: 'sine' }); };

export const SFX_AX_O8 = {
  // ── 名探てい王 ──
  // ピコーン！（ひらめき）→ ズバッ
  ax_o8_pikon: (a, T) => { T(1319, 0.07, { vol: 0.07, type: 'square' }); T(1976, 0.22, { vol: 0.07, delay: 0.07, type: 'square' }); swish(a, 0.36, 0.4); T(220, 0.2, { vol: 0.1, delay: 0.38, type: 'saw', slide: 90 }); },
  // カチッ…チクタク（先読みの 時計）→ ドン
  ax_o8_tiktak: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.22, delay: i * 0.1, type: 'bandpass', from: i % 2 ? 2600 : 3400, to: 3000, q: 6 }); boom(a, T, 0.45, 0.35); sparkle(T, 0.5, 0.03); },
  // じっと見る（虫めがねの キラン）
  ax_o8_kiran: (a, T) => { T(880, 0.4, { vol: 0.04, type: 'triangle', slide: 1760 }); ring(T, 2637, 0.35, 0.05, 0.35); sparkle(T, 0.4); },
  // バーン！（トリックを あばく）
  ax_o8_ban: (a, T) => { a.noise(0.06, { vol: 0.5, type: 'highpass', from: 2000, to: 5000 }); [523, 659, 784, 1047].forEach((f) => T(f, 0.35, { vol: 0.05, delay: 0.05, type: 'saw' })); a.noise(0.4, { vol: 0.25, delay: 0.1, from: 2400, to: 300 }); },
  // ヒュン → ドカン（シュート）
  ax_o8_shoot: (a, T) => { T(400, 0.3, { vol: 0.08, type: 'saw', slide: 1600 }); a.noise(0.3, { vol: 0.2, type: 'bandpass', from: 800, to: 3000, q: 2 }); boom(a, T, 0.32, 0.55); },
  // ジャジャーン（推理ショー）
  ax_o8_jajan: (a, T) => { [392, 494, 587].forEach((f) => T(f, 0.18, { vol: 0.05, type: 'saw' })); [523, 659, 784, 1047].forEach((f) => T(f, 0.45, { vol: 0.05, delay: 0.2, type: 'saw' })); sparkle(T, 0.4); },
  // ── 銀河の女王 ──
  // キラキラ…シャラーン（星）
  ax_o8_kirari: (a, T) => { arp(T, [1568, 2093, 2637, 3136, 3520], 0.06, { vol: 0.045 }); a.noise(0.5, { vol: 0.18, delay: 0.25, type: 'highpass', from: 4000, to: 8000 }); },
  // ふわぁ…（いやし）
  ax_o8_iyashi: (a, T) => { [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.6, { vol: 0.035, delay: i * 0.06, type: 'sine', attack: 0.2 })); sparkle(T, 0.4, 0.03); },
  // ブゥン…キィン（バリア）
  ax_o8_barrier: (a, T) => { T(220, 0.5, { vol: 0.07, type: 'triangle', slide: 440, attack: 0.3 }); ring(T, 1760, 0.3, 0.05, 0.45); ring(T, 2349, 0.42, 0.04, 0.35); },
  // ヒュルル…ドドド（流れ星）
  ax_o8_ryusei: (a, T) => { for (let i = 0; i < 4; i++) T(2400 - i * 200, 0.2, { vol: 0.04, delay: i * 0.08, type: 'sine', slide: 900 }); for (let i = 0; i < 4; i++) a.noise(0.15, { vol: 0.3, delay: 0.3 + i * 0.08, from: 1800, to: 200 }); },
  // ── 大魔導王 ──
  // ポロロン×2（2つの まほうじん）→ ドォン
  ax_o8_niju: (a, T) => { arp(T, [523, 659, 784, 988], 0.05, { vol: 0.045, type: 'triangle' }); arp(T, [659, 784, 988, 1319], 0.05, { vol: 0.045, type: 'triangle', delay: 0.18 }); boom(a, T, 0.42, 0.4); },
  // ゴォォ（炎）＋ キィン（氷）
  ax_o8_hyouka: (a, T) => { a.noise(0.5, { vol: 0.35, from: 500, to: 2800 }); a.noise(0.08, { vol: 0.35, delay: 0.3, type: 'highpass', from: 5000, to: 7000 }); [2349, 2637, 3136].forEach((f, i) => T(f, 0.25, { vol: 0.04, delay: 0.32 + i * 0.05, type: 'triangle' })); },
  // バチバチ・ゴウッ（いなずまと 大風）
  ax_o8_raifuu: (a, T) => { a.noise(0.08, { vol: 0.5, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.6, { vol: 0.35, delay: 0.06, type: 'bandpass', from: 300, to: 1500, q: 1 }); a.noise(0.4, { vol: 0.4, delay: 0.3, from: 900, to: 40 }); },
  // キュイィン → シュバァ（光の 弓）
  ax_o8_medroa: (a, T) => { T(300, 0.35, { vol: 0.07, type: 'saw', slide: 1800 }); T(450, 0.35, { vol: 0.05, type: 'saw', slide: 2400 }); a.noise(0.08, { vol: 0.45, delay: 0.38, type: 'highpass', from: 3000, to: 3000 }); a.noise(0.4, { vol: 0.4, delay: 0.42, from: 2400, to: 80 }); },
  // ── 天下むそうの剣聖 ──
  // チャキ → ズバァッ
  ax_o8_zan: (a, T) => { T(2400, 0.04, { vol: 0.08, type: 'square' }); swish(a, 0.12, 0.5); a.noise(0.25, { vol: 0.35, delay: 0.18, from: 3200, to: 300 }); ring(T, 3136, 0.2, 0.03, 0.4); },
  // ズバ・ズバッ（2回）
  ax_o8_zanzan: (a, T) => { swish(a, 0, 0.45); swish(a, 0.16, 0.5); a.noise(0.2, { vol: 0.3, delay: 0.2, from: 3000, to: 400 }); T(1800, 0.1, { vol: 0.05, delay: 0.16, type: 'saw', slide: 400 }); },
  // スゥ…キィン（心を しずめる）
  ax_o8_seijaku: (a, T) => { a.noise(0.45, { vol: 0.14, type: 'bandpass', from: 1500, to: 500, q: 2 }); ring(T, 1568, 0.35, 0.05, 0.45); },
  // ゴゴゴ → ザザザン（たくさん 切る）
  ax_o8_ranbu: (a, T) => { a.noise(0.3, { vol: 0.25, from: 260, to: 60 }); for (let i = 0; i < 5; i++) swish(a, 0.2 + i * 0.07, 0.35); ring(T, 2637, 0.55, 0.03, 0.25); },
};
