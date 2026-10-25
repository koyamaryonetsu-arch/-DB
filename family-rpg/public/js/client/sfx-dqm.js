// 第45回: ドラクエふう（配合だけの 第2だん）の 技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// なまえは 技の えんしゅつ（anim）と おなじ（render/battlefx-dqm.js の DQ_SFX）。あたる じかん（DQ_HIT）に だいたい あわせて ある
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
const coin = (T, d = 0, vol = 0.06, f = 1800) => {
  T(f, 0.05, { vol, delay: d, type: 'square' });
  T(f * 1.5, 0.12, { vol: vol * 0.8, delay: d + 0.04, type: 'triangle' });
};
const whoosh = (a, d = 0, dur = 0.3, vol = 0.25, from = 500, to = 2600) => a.noise(dur, { vol, delay: d, type: 'bandpass', from, to, q: 3 });

export const SFX_DQ = {
  // チャリン チャリン ジャラジャラ
  dq_gold_rain: (a, T) => {
    for (let i = 0; i < 7; i++) coin(T, 0.12 + i * 0.045, 0.045, 1700 + (i % 3) * 260);
    a.noise(0.25, { vol: 0.16, delay: 0.38, type: 'highpass', from: 5000, to: 4000 });
    coin(T, 0.42, 0.07, 2100);
  },
  // ヒュルルル（花びらの かぜ）→ シャッ シャッ
  dq_rose_storm: (a, T) => {
    whoosh(a, 0, 0.45, 0.22, 400, 2200);
    T(900, 0.4, { vol: 0.03, type: 'sine', slide: 1500 });
    for (let i = 0; i < 3; i++) a.noise(0.07, { vol: 0.24, delay: 0.44 + i * 0.06, type: 'bandpass', from: 4000, to: 2200, q: 4 });
  },
  // サラサラ（はっぱ）→ キラキラ〜ン（回復）
  dq_world_tree: (a, T) => {
    a.noise(0.5, { vol: 0.1, type: 'highpass', from: 3000, to: 5000 });
    [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.3, { vol: 0.05, delay: 0.32 + i * 0.07, type: 'triangle' }));
    T(1568, 0.5, { vol: 0.03, delay: 0.66, type: 'sine' });
  },
  // ヒュ〜ドロドロ → ボッ
  dq_lantern: (a, T) => {
    T(500, 0.45, { vol: 0.06, type: 'sine', slide: 260 });
    T(510, 0.45, { vol: 0.04, delay: 0.02, type: 'sine', slide: 250 });
    a.noise(0.3, { vol: 0.32, delay: 0.46, from: 600, to: 2400 });
    a.noise(0.4, { vol: 0.2, delay: 0.6, from: 2000, to: 300 });
  },
  // カラカラカラ → ガシャーン
  dq_bone_king: (a, T) => {
    for (let i = 0; i < 6; i++) T(900 + (i % 2) * 300, 0.03, { vol: 0.08, delay: i * 0.055, type: 'square' });
    a.noise(0.3, { vol: 0.42, delay: 0.42, from: 3000, to: 300 });
    for (let i = 0; i < 4; i++) T(700 + i * 130, 0.04, { vol: 0.06, delay: 0.46 + i * 0.05, type: 'square' });
  },
  // はる・なつ・あき・ふゆ（4つの 音が うずを まく）→ キラーン
  dq_seasons: (a, T) => {
    [659, 784, 587, 880].forEach((f, i) => T(f, 0.18, { vol: 0.05, delay: i * 0.12, type: 'triangle', slide: f * 1.2 }));
    whoosh(a, 0.1, 0.5, 0.16, 600, 2000);
    a.noise(0.3, { vol: 0.3, delay: 0.64, type: 'bandpass', from: 2500, to: 1200, q: 2 });
    T(1760, 0.3, { vol: 0.04, delay: 0.64, type: 'sine' });
  },
  // ピピッ（目）→ ズバッ ズバッ
  dq_killer_slash: (a, T) => {
    T(1600, 0.04, { vol: 0.06, type: 'square' });
    T(2000, 0.04, { vol: 0.06, delay: 0.05, type: 'square' });
    a.noise(0.08, { vol: 0.35, delay: 0.1, type: 'highpass', from: 3000, to: 6000 });
    a.noise(0.1, { vol: 0.4, delay: 0.19, type: 'highpass', from: 3000, to: 6000 });
    T(300, 0.1, { vol: 0.08, delay: 0.2, type: 'saw', slide: 120 });
  },
  // ギギギ（ふたが ひらく）→ ガブッ
  dq_chomp: (a, T) => {
    T(140, 0.22, { vol: 0.08, type: 'saw', slide: 220 });
    a.noise(0.18, { vol: 0.12, type: 'bandpass', from: 800, to: 1400, q: 5 });
    a.noise(0.15, { vol: 0.55, delay: 0.33, from: 1600, to: 200 });
    T(90, 0.2, { vol: 0.25, delay: 0.33, type: 'triangle', slide: 50 });
  },
  // ゴゴゴ（竜が あらわれる）→ ゴオオッ（ほのお）
  dq_dragon_lord: (a, T) => {
    T(55, 0.6, { vol: 0.2, type: 'triangle', slide: 45 });
    a.noise(0.6, { vol: 0.2, from: 200, to: 120 });
    T(220, 0.25, { vol: 0.08, delay: 0.3, type: 'saw', slide: 110 });
    a.noise(0.6, { vol: 0.42, delay: 0.56, from: 400, to: 2600 });
    a.noise(0.8, { vol: 0.45, delay: 0.82, from: 2600, to: 150 });
  },
};
