// 第26回の 職業の 看板の技の 音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
export const SFX_R26 = {
  // カードが シュシュシュッと とぶ
  cardfly: (a) => { [0, 0.06, 0.12, 0.18].forEach((d) => a.noise(0.06, { vol: 0.2, delay: d, type: 'highpass', from: 2500, to: 7000 })); },
  // ねらいを さだめる ピピッ
  scope: (a, T) => { T(1760, 0.05, { vol: 0.07, type: 'square' }); T(1760, 0.05, { vol: 0.07, delay: 0.09, type: 'square' }); a.noise(0.08, { vol: 0.25, delay: 0.14, type: 'highpass', from: 3000, to: 5000 }); },
  // 黒い 車の エンジン（ブロロロ）
  engine: (a, T) => { T(70, 0.7, { vol: 0.16, slide: 110, type: 'saw' }); a.noise(0.7, { vol: 0.25, from: 500, to: 120 }); },
  // ぐにゃ〜っと ゆがむ
  warp: (a, T) => { T(300, 0.5, { vol: 0.1, slide: 900, type: 'sine' }); T(900, 0.4, { vol: 0.06, slide: 250, delay: 0.25, type: 'triangle' }); },
  // ピカッと ひらめく（ピキーン）
  kirari: (a, T) => { T(2637, 0.05, { vol: 0.09, type: 'square' }); T(3951, 0.45, { vol: 0.08, delay: 0.05, type: 'sine' }); T(5274, 0.3, { vol: 0.04, delay: 0.12, type: 'sine' }); },
  // プゥ〜（ひくい ブーという 音が さがっていく）
  pu: (a, T) => { T(160, 0.55, { vol: 0.16, slide: 80, type: 'saw' }); a.noise(0.5, { vol: 0.14, type: 'lowpass', from: 500, to: 120 }); },
  // ひみつ道具（テッテレー）
  gadget: (a, T) => { [784, 988, 1175].forEach((f, i) => T(f, 0.08, { vol: 0.09, delay: i * 0.08, type: 'pulse' })); T(1568, 0.4, { vol: 0.09, delay: 0.24, type: 'pulse' }); },
  // ザバーッと 水しぶき
  splash: (a, T) => { a.noise(0.5, { vol: 0.35, type: 'bandpass', from: 2400, to: 500, q: 1.5 }); [1200, 1600, 1000].forEach((f, i) => T(f, 0.06, { vol: 0.05, delay: 0.1 + i * 0.07, type: 'sine', slide: f * 1.6 })); },
  // ムキッ（ぐっと ちからを こめる）
  muscle: (a, T) => { T(110, 0.12, { vol: 0.16, type: 'square', slide: 160 }); T(220, 0.18, { vol: 0.14, delay: 0.12, type: 'square', slide: 330 }); a.noise(0.25, { vol: 0.4, delay: 0.12, from: 1200, to: 60 }); },
  // ポンッ（分身が あらわれる）と 大きな たま
  pon: (a, T) => { [0, 0.07, 0.14].forEach((d) => { a.noise(0.08, { vol: 0.25, delay: d, from: 2000, to: 400 }); T(520, 0.06, { vol: 0.06, delay: d, slide: 900, type: 'sine' }); }); a.noise(0.5, { vol: 0.35, delay: 0.25, type: 'bandpass', from: 300, to: 2400, q: 2 }); },
};
