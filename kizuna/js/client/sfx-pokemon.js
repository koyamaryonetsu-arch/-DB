// 第44回: ポケモンの 技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// なまえは 技の えんしゅつ（anim）と おなじ（render/battlefx-pokemon.js の PK_SFX）。あたる じかん（PK_HIT）に だいたい あわせて ある
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
const zap = (a, T, d = 0, vol = 0.3) => {
  a.noise(0.06, { vol, delay: d, type: 'highpass', from: 3500, to: 3500 });
  T(1800, 0.08, { vol: vol * 0.25, delay: d, type: 'saw', slide: 600 });
};
const splash = (a, d = 0, vol = 0.3) => a.noise(0.35, { vol, delay: d, type: 'bandpass', from: 2400, to: 500, q: 1.5 });
const whoosh = (a, d = 0, dur = 0.3, vol = 0.25) => a.noise(dur, { vol, delay: d, type: 'bandpass', from: 500, to: 2600, q: 3 });

export const SFX_PK = {
  // ピリッ・ピリッ
  pk_spark: (a, T) => { zap(a, T, 0, 0.28); zap(a, T, 0.08, 0.22); a.noise(0.12, { vol: 0.2, delay: 0.17, from: 3000, to: 600 }); },
  // ゴロゴロ… → ドガーン
  pk_thunder: (a, T) => {
    a.noise(0.35, { vol: 0.18, from: 300, to: 120 });
    for (let i = 0; i < 4; i++) zap(a, T, 0.04 + i * 0.06, 0.12);
    a.noise(0.1, { vol: 0.6, delay: 0.33, type: 'highpass', from: 2000, to: 2000 });
    a.noise(1.2, { vol: 0.5, delay: 0.38, from: 900, to: 30 });
  },
  // ヒュン！
  pk_quick: (a, T) => { whoosh(a, 0, 0.16, 0.3); T(1200, 0.12, { vol: 0.07, type: 'triangle', slide: 2400 }); a.noise(0.1, { vol: 0.3, delay: 0.16, from: 3000, to: 400 }); },
  // ぽっ・ぽっ・ぽっ
  pk_ember: (a, T) => { for (let i = 0; i < 3; i++) { a.noise(0.14, { vol: 0.22, delay: i * 0.08, from: 800, to: 2400 }); T(300, 0.06, { vol: 0.05, delay: i * 0.08, type: 'triangle', slide: 600 }); } },
  // ゴーッ → ボワッ
  pk_flame: (a) => {
    a.noise(0.5, { vol: 0.35, from: 500, to: 2600 });
    a.noise(0.6, { vol: 0.4, delay: 0.3, from: 2600, to: 200 });
  },
  // ビュッ・パシャ
  pk_water: (a, T) => { whoosh(a, 0, 0.22, 0.22); T(600, 0.12, { vol: 0.05, type: 'sine', slide: 1200 }); splash(a, 0.24, 0.28); },
  // ドドドッ・ザバーン
  pk_hydro: (a) => { a.noise(0.35, { vol: 0.35, from: 400, to: 1600 }); splash(a, 0.3, 0.45); a.noise(0.5, { vol: 0.3, delay: 0.32, from: 1200, to: 100 }); },
  // シュシュシュッ
  pk_leaf: (a) => { for (let i = 0; i < 5; i++) a.noise(0.06, { vol: 0.2, delay: i * 0.05, type: 'highpass', from: 4000, to: 6000 }); for (let i = 0; i < 3; i++) a.noise(0.05, { vol: 0.22, delay: 0.32 + i * 0.05, type: 'bandpass', from: 3000, to: 2000, q: 4 }); },
  // ウィィィン（ためる）→ ビーーッ
  pk_solar: (a, T) => {
    T(300, 0.6, { vol: 0.06, type: 'sine', slide: 1400 });
    [784, 988, 1175].forEach((f, i) => T(f, 0.15, { vol: 0.04, delay: i * 0.15, type: 'triangle' }));
    T(220, 0.45, { vol: 0.1, delay: 0.62, type: 'saw', slide: 180 });
    a.noise(0.5, { vol: 0.35, delay: 0.62, type: 'bandpass', from: 1500, to: 600, q: 1 });
  },
  // ブゥン（ためる）→ ヒュー → ドムッ
  pk_shadow: (a, T) => {
    T(110, 0.3, { vol: 0.12, type: 'saw', slide: 160 });
    T(400, 0.3, { vol: 0.05, delay: 0.26, type: 'sine', slide: 200 });
    a.noise(0.45, { vol: 0.4, delay: 0.55, from: 900, to: 60 });
    T(70, 0.3, { vol: 0.18, delay: 0.55, type: 'triangle', slide: 40 });
  },
  // ミョンミョンミョン…
  pk_psychic: (a, T) => { for (let i = 0; i < 4; i++) T(500 + i * 120, 0.16, { vol: 0.06, delay: i * 0.1, type: 'sine', slide: 900 + i * 120 }); a.noise(0.3, { vol: 0.2, delay: 0.38, type: 'bandpass', from: 1200, to: 2400, q: 3 }); },
  // ヒュー… → ドスン
  pk_bodyslam: (a, T) => {
    T(700, 0.38, { vol: 0.06, type: 'triangle', slide: 160 });
    a.noise(0.5, { vol: 0.6, delay: 0.4, from: 1000, to: 40 });
    T(60, 0.4, { vol: 0.3, delay: 0.4, type: 'triangle', slide: 30 });
  },
};
