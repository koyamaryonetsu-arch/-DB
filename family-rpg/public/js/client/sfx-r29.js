// 第29回の るろうに剣士の 道の 看板の技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// 音の ならびは render/battlefx-jobs6.js の あたる じかんに だいたい あわせて ある
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
// 刀を ぬく 音（シャキン）
const shing = (a, T, d = 0, vol = 1) => {
  a.noise(0.05, { vol: 0.3 * vol, delay: d, type: 'highpass', from: 5000, to: 7000 });
  T(2637, 0.18, { vol: 0.06 * vol, delay: d, type: 'triangle', slide: 3520 });
  T(3951, 0.12, { vol: 0.03 * vol, delay: d + 0.02, type: 'sine' });
};
// 刀を さやに おさめる 音（カチン）
const clink = (a, T, d = 0) => {
  T(1760, 0.04, { vol: 0.08, delay: d, type: 'square' });
  a.noise(0.03, { vol: 0.2, delay: d, from: 4000, to: 2000 });
};
export const SFX_R29 = {
  // 竜つい閃: ヒュウ…と 落ちて ズドン
  r29_tsui: (a, T) => {
    T(1400, 0.06, { vol: 0.05, type: 'sine', slide: 300 });
    shing(a, T, 0.02);
    a.noise(0.45, { vol: 0.45, delay: 0.06, from: 1800, to: 60 });
    T(80, 0.4, { vol: 0.16, delay: 0.06, slide: 40, type: 'triangle' });
    clink(a, T, 0.45);
  },
  // 竜巣閃: シュシュシュシュッと 何回も
  r29_sou: (a, T) => {
    for (let i = 0; i < 8; i++) a.noise(0.04, { vol: 0.22, delay: 0.02 + i * 0.08, type: 'highpass', from: 3000 + (i % 3) * 800, to: 6000 });
    shing(a, T, 0, 0.7);
    clink(a, T, 0.8);
  },
  // 九頭竜閃: キュイーンと あつまって ズバァン
  r29_kuzu: (a, T) => {
    T(600, 0.12, { vol: 0.06, type: 'sine', slide: 2400 });
    for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.18, delay: i * 0.025, type: 'highpass', from: 4000, to: 6000 });
    shing(a, T, 0.1);
    a.noise(0.5, { vol: 0.45, delay: 0.12, from: 2600, to: 80 });
    T(110, 0.35, { vol: 0.14, delay: 0.12, slide: 50, type: 'triangle' });
    clink(a, T, 0.6);
  },
  // 天かける竜のひらめき: シャキン → ヒュオオ（すいこむ 風・竜が のぼる）→ ズバァン
  r29_amakakeru: (a, T) => {
    shing(a, T, 0, 1.2);
    a.noise(0.7, { vol: 0.28, delay: 0.15, type: 'bandpass', from: 300, to: 2600, q: 4 });
    T(500, 0.6, { vol: 0.04, delay: 0.2, slide: 1600, type: 'sine' });
    shing(a, T, 0.55, 1.2);
    a.noise(0.7, { vol: 0.5, delay: 0.6, from: 2400, to: 50 });
    T(70, 0.6, { vol: 0.18, delay: 0.6, slide: 35, type: 'triangle' });
    clink(a, T, 1.25);
  },
};
