// 第27回: 作り直した 呪文・特技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// なまえは 'r7_<なかま><段階 1〜4>'（例 r7_fire1 … メラ、r7_fire4 … メラガイアー）。段階が 上がるほど 大きく・長く。
// 音の ならびは render/battlefx-r27.js の あたる じかん（r27Hit）に だいたい あわせて ある
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
const FAMILY = {
  // 炎: ボッと とんで、ゴウッと もえる
  fire: (a, T, t) => {
    const hit = [0, 0.3, 0.33, 0.4, 0.64][t];
    if (t >= 4) T(180, 0.36, { vol: 0.08, slide: 520, type: 'saw' });
    a.noise(0.25, { vol: 0.18 + 0.03 * t, delay: hit - 0.25, type: 'bandpass', from: 500, to: 1800, q: 1.5 });
    a.noise(0.35 + 0.15 * t, { vol: 0.3 + 0.06 * t, delay: hit, from: 2400, to: 160 });
    for (let i = 0; i < 2 + t; i++) a.noise(0.04, { vol: 0.12, delay: hit + 0.06 + i * 0.07, type: 'highpass', from: 3000, to: 5000 });
    if (t >= 3) T(70, 0.5 + 0.1 * t, { vol: 0.14 + 0.03 * t, delay: hit, slide: 35, type: 'triangle' });
  },
  // 氷: キラキラと 音が して、パキーンと くだける
  ice: (a, T, t) => {
    const hit = [0, 0.26, 0.23, 0.3, 0.42][t];
    [1760, 2093, 2349, 2637, 3136].slice(0, 2 + t).forEach((f, i) => T(f, 0.12, { vol: 0.05, delay: i * 0.04, type: 'triangle' }));
    a.noise(0.12 + 0.03 * t, { vol: 0.3 + 0.05 * t, delay: hit, type: 'highpass', from: 4000, to: 7000 });
    T(2637, 0.3, { vol: 0.06, delay: hit, type: 'sine', slide: 1760 });
    if (t >= 2) a.noise(0.2, { vol: 0.25, delay: hit + 0.26 + 0.04 * t, type: 'highpass', from: 6000, to: 3000 });
    if (t >= 4) { a.noise(0.6, { vol: 0.4, delay: hit + 0.48, from: 3000, to: 200 }); T(3951, 0.4, { vol: 0.05, delay: hit + 0.48, type: 'sine' }); }
  },
  // 風: ヒュオオと うずまく
  wind: (a, T, t) => {
    a.noise(0.4 + 0.2 * t, { vol: 0.22 + 0.05 * t, type: 'bandpass', from: 300, to: 2600, q: 3 + t });
    T(600, 0.3 + 0.15 * t, { vol: 0.03 + 0.01 * t, slide: 1400, type: 'sine', delay: 0.05 });
    if (t >= 3) a.noise(0.5, { vol: 0.25, delay: 0.3, type: 'bandpass', from: 2400, to: 500, q: 3 });
    if (t >= 4) a.noise(0.9, { vol: 0.3, delay: 0.5, from: 900, to: 120 });
  },
  // 爆発: キュイーンと 光って ドカン
  blast: (a, T, t) => {
    const hit = [0, 0.14, 0.14, 0.38, 0.56][t];
    T(900, Math.max(0.1, hit), { vol: 0.05, slide: 2600, type: 'sine' });
    const n = t === 2 ? 3 : 1;
    for (let i = 0; i < n; i++) {
      a.noise(0.45 + 0.15 * t, { vol: 0.45 + 0.05 * t, delay: hit + i * 0.11, from: 2200, to: 60 });
      T(90, 0.35 + 0.1 * t, { vol: 0.18 + 0.03 * t, delay: hit + i * 0.11, slide: 30, type: 'triangle' });
    }
    if (t >= 4) a.noise(1.1, { vol: 0.4, delay: hit + 0.15, from: 500, to: 40 });
  },
  // 雷: バリバリッ ゴロゴロ
  bolt: (a, T, t) => {
    const hit = [0, 0.12, 0.12, 0.26, 0.52][t];
    if (t >= 4) [523, 659, 784, 1047].forEach((f, i) => T(f, 0.3, { vol: 0.05, delay: i * 0.08, type: 'triangle' }));
    for (let i = 0; i < Math.min(4, t + 1); i++) a.noise(0.07, { vol: 0.45, delay: hit - 0.04 + i * 0.05, type: 'highpass', from: 2500, to: 2500 });
    a.noise(0.5 + 0.25 * t, { vol: 0.32 + 0.05 * t, delay: hit, from: 1400, to: 50 });
  },
  // 光: リーンと 鐘
  light: (a, T, t) => {
    [1047, 1319, 1568, 2093].slice(0, 2 + Math.min(2, t)).forEach((f, i) => T(f, 0.4 + 0.1 * t, { vol: 0.06, delay: i * 0.05, type: 'sine' }));
    a.noise(0.3, { vol: 0.15 + 0.03 * t, delay: 0.12, type: 'highpass', from: 5000, to: 8000 });
    if (t >= 3) T(523, 0.7, { vol: 0.07, delay: 0.15, type: 'triangle' });
  },
  // 闇: ズズズ…と すいこむ
  dark: (a, T, t) => {
    T(260, 0.4 + 0.12 * t, { vol: 0.12 + 0.02 * t, slide: 70, type: 'saw' });
    T(390, 0.4 + 0.12 * t, { vol: 0.05, slide: 100, type: 'sine', delay: 0.05 });
    a.noise(0.5 + 0.1 * t, { vol: 0.22 + 0.04 * t, type: 'bandpass', from: 1200, to: 150, q: 2 });
    if (t >= 3) a.noise(0.4, { vol: 0.3, delay: 0.3, from: 900, to: 60 });
  },
  // しょうめつ: 光の 矢が すいこまれる
  void: (a, T, t) => {
    [1047, 784, 523, 262].forEach((f, i) => T(f, 0.2, { vol: 0.09, delay: i * 0.06, type: 'triangle' }));
    T(200, 0.4, { vol: 0.06, delay: 0.22, slide: 1600, type: 'sine' });
    a.noise(0.7 + 0.1 * t, { vol: 0.35 + 0.03 * t, delay: 0.42, from: 5000, to: 80 });
  },
  // 回復: やさしい アルペジオ（段階で 音が ふえて キラキラ）
  heal: (a, T, t) => {
    [523, 659, 784, 1047, 1319, 1568, 2093].slice(0, 3 + t).forEach((f, i) => T(f, 0.2 + 0.03 * t, { vol: 0.065, delay: i * 0.055, type: 'sine' }));
    if (t >= 2) [2093, 2637].forEach((f, i) => T(f, 0.25, { vol: 0.03, delay: 0.25 + i * 0.08, type: 'sine' }));
    if (t >= 3) [523, 659, 784].forEach((f) => T(f, 0.6 + 0.1 * t, { vol: 0.04, delay: 0.32, type: 'triangle' }));
  },
  // 生き返り: 光が おりて くる 和音
  revive: (a, T, t) => {
    [392, 523, 659, 784, 1047].forEach((f, i) => T(f, 0.7 + 0.1 * t, { vol: 0.05, delay: i * 0.07, type: 'triangle', attack: 0.06 }));
    [1568, 2093, 2637].forEach((f, i) => T(f, 0.3, { vol: 0.035, delay: 0.3 + i * 0.07, type: 'sine' }));
    if (t >= 3) T(1047, 0.8, { vol: 0.04, delay: 0.35, type: 'sine', attack: 0.1 });
  },
  // つよく なる（▲）
  up: (a, T, t) => {
    [392, 523, 659, 784, 1047].slice(0, 3 + Math.min(2, t)).forEach((f, i) => T(f, 0.1, { vol: 0.08, delay: i * 0.05, type: 'triangle' }));
    T(1568, 0.25, { vol: 0.04, delay: 0.25, type: 'sine' });
    a.noise(0.2, { vol: 0.08, delay: 0.1, type: 'bandpass', from: 800, to: 3000, q: 2 });
  },
  // 力を ためる
  charge: (a, T, t) => {
    T(140, 0.45 + 0.05 * t, { vol: 0.08, slide: 560, type: 'saw' });
    a.noise(0.45, { vol: 0.16, type: 'bandpass', from: 300, to: 2000, q: 2 });
    T(880, 0.15, { vol: 0.06, delay: 0.42, type: 'square' });
  },
  // まもりの たて（キィン）
  shield: (a, T, t) => {
    T(1319, 0.08, { vol: 0.08, type: 'square' });
    T(2637, 0.4 + 0.05 * t, { vol: 0.06, delay: 0.03, type: 'sine' });
    T(330, 0.45, { vol: 0.06, delay: 0.05, type: 'triangle' });
    a.noise(0.12, { vol: 0.12, type: 'highpass', from: 4000, to: 6000 });
  },
  // よわく なる（▼）
  down: (a, T, t) => {
    [784, 659, 523, 392, 330].slice(0, 3 + Math.min(2, t)).forEach((f, i) => T(f, 0.12, { vol: 0.08, delay: i * 0.06, type: 'triangle' }));
    T(200, 0.4, { vol: 0.06, delay: 0.15, slide: 90, type: 'sine' });
  },
  // おたけび
  warcry: (a, T, t) => {
    a.noise(0.45, { vol: 0.35, type: 'bandpass', from: 400, to: 1200, q: 2 });
    T(150, 0.4 + 0.05 * t, { vol: 0.12, slide: 110, type: 'square' });
    T(225, 0.35, { vol: 0.06, slide: 160, type: 'saw', delay: 0.03 });
  },
  // 剣の きりさき（シュッ キン）
  slash: (a, T, t) => {
    a.noise(0.09, { vol: 0.3, type: 'highpass', from: 2000, to: 7000 });
    T(2400, 0.08, { vol: 0.05, delay: 0.09, type: 'square' });
    if (t >= 3) a.noise(0.25, { vol: 0.3, delay: 0.1, from: 1500, to: 100 });
  },
  // こぶし（ドスッ）
  punch: (a, T, t) => {
    a.noise(0.1 + 0.03 * t, { vol: 0.35 + 0.05 * t, from: 1600, to: 120 });
    T(110, 0.14 + 0.03 * t, { vol: 0.16, slide: 50, type: 'triangle' });
  },
  // 地ひびき
  quake: (a, T, t) => {
    a.noise(0.9 + 0.2 * t, { vol: 0.45 + 0.04 * t, from: 320, to: 35 });
    T(55, 0.6, { vol: 0.15, slide: 35, type: 'triangle', delay: 0.1 });
  },
};

export const SFX_R27 = {};
for (const [name, f] of Object.entries(FAMILY)) {
  for (let t = 1; t <= 4; t++) SFX_R27[`r7_${name}${t}`] = (a, T) => f(a, T, t);
}
