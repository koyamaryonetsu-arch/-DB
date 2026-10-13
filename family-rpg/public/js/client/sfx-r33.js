// 第33回の 新しい 職業の 技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// 音の ならびは render/battlefx-jobs7.js の あたる じかん（JOB7_HIT）に だいたい あわせて ある
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
// ぽん（けむり・ハトが 出る）
const poof = (a, T, d = 0) => {
  a.noise(0.25, { vol: 0.25, delay: d, type: 'bandpass', from: 1200, to: 300, q: 2 });
  T(520, 0.08, { vol: 0.06, delay: d, type: 'triangle', slide: 900 });
};
// キラッ
const twinkle = (T, d = 0, base = 1568) => [base, base * 1.26, base * 1.5].forEach((f, i) => T(f, 0.1, { vol: 0.05, delay: d + i * 0.04, type: 'triangle' }));
export const SFX_R33 = {
  // トランプ銃: パラパラパラと とんで、さいごに キラッ
  r33_cards: (a, T) => {
    poof(a, T, 0);
    for (let i = 0; i < 9; i++) a.noise(0.03, { vol: 0.18, delay: 0.12 + i * 0.03, type: 'highpass', from: 3000, to: 5000 });
    a.noise(0.18, { vol: 0.3, delay: 0.38, from: 3000, to: 300 });
    a.noise(0.8, { vol: 0.12, delay: 0.55, type: 'bandpass', from: 400, to: 1400, q: 3 });
    twinkle(T, 0.75);
  },
  r33_poof: (a, T) => { poof(a, T, 0); twinkle(T, 0.18, 1319); },
  // まくが おりる ドロロロ… → ジャーン！
  r33_curtain: (a, T) => {
    for (let i = 0; i < 8; i++) T(110 + (i % 2) * 8, 0.05, { vol: 0.1, delay: i * 0.05, type: 'triangle' });
    [523, 659, 784, 1047].forEach((f) => T(f, 0.4, { vol: 0.06, delay: 0.52, type: 'square' }));
    a.noise(0.3, { vol: 0.2, delay: 0.52, type: 'highpass', from: 4000, to: 7000 });
    twinkle(T, 0.7);
  },
  // 赤い 光線: ビシュッ
  r33_ray: (a, T) => {
    T(1800, 0.2, { vol: 0.08, type: 'saw', slide: 400 });
    a.noise(0.2, { vol: 0.3, delay: 0.18, from: 3000, to: 300 });
    twinkle(T, 0.32, 1175);
  },
  // 守護の 光: シャラララと 光が のぼって、ドン
  r33_patronus: (a, T) => {
    [784, 988, 1175, 1568, 1976].forEach((f, i) => T(f, 0.3, { vol: 0.05, delay: i * 0.06, type: 'sine' }));
    a.noise(0.6, { vol: 0.12, delay: 0.05, type: 'highpass', from: 4000, to: 8000 });
    a.noise(0.3, { vol: 0.35, delay: 0.34, from: 2600, to: 200 });
  },
  // チョーク: カツカツ… と 書いて、「コラッ！」の ドン
  r33_chalk: (a, T) => {
    for (let i = 0; i < 6; i++) a.noise(0.03, { vol: 0.2, delay: 0.16 + i * 0.075, type: 'bandpass', from: 2400, to: 2000, q: 6 });
    T(147, 0.3, { vol: 0.16, delay: 0.7, type: 'square', slide: 110 });
    a.noise(0.25, { vol: 0.3, delay: 0.7, from: 1600, to: 200 });
  },
  r33_scold: (a, T) => {
    T(196, 0.18, { vol: 0.14, type: 'square', slide: 147 });
    a.noise(0.2, { vol: 0.25, delay: 0.24, from: 1600, to: 200 });
  },
  // 手を 合わせる パンッ → バチバチ（れん金の 光）→ ゴゴッ（石が つき出る）
  r33_clap: (a, T) => {
    a.noise(0.06, { vol: 0.45, type: 'highpass', from: 2000, to: 2000 });
    for (let i = 0; i < 5; i++) a.noise(0.04, { vol: 0.16, delay: 0.16 + i * 0.05, type: 'highpass', from: 5000, to: 7000 });
    a.noise(0.5, { vol: 0.45, delay: 0.42, from: 900, to: 60 });
    T(70, 0.4, { vol: 0.2, delay: 0.42, slide: 40, type: 'triangle' });
  },
  // 月の 光: キラキラ と ふわっと した 和音
  r33_moon: (a, T) => {
    [659, 784, 988, 1319].forEach((f, i) => T(f, 0.5, { vol: 0.05, delay: i * 0.08, type: 'sine' }));
    twinkle(T, 0.4, 1760);
    a.noise(0.25, { vol: 0.25, delay: 0.6, from: 3000, to: 400 });
  },
};
