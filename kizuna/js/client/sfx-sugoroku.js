// 第50回 D2: すごろくの 音（Web Audio で その場で つくる。audio.js の tone・noise を つかう）
//   sgSound(game.audio, 'sg_bounce', 2) のように よぶ。audio.js の sfx() に ない なまえは ここ
//   arg … 音の 高さを かえる 数（さいころの はね・こまの 歩数・ルーレットの カチカチ）
const SG = {
  // さいころを なげる（ヒュッ）
  sg_throw: (a, T) => {
    a.noise(0.18, { vol: 0.22, type: 'bandpass', from: 900, to: 3200, q: 2 });
    T(500, 0.12, { vol: 0.04, type: 'triangle', slide: 900 });
  },
  // さいころが はねる（コトッ。arg … 何回め）
  sg_bounce: (a, T, n = 0) => {
    const v = Math.max(0.08, 0.3 - n * 0.07);
    a.noise(0.05, { vol: v, from: 2600, to: 500 });
    T(260 - n * 30, 0.06, { vol: v * 0.5, type: 'triangle', slide: 140 });
  },
  // さいころが 止まる（カタン → ピン）
  sg_dice_stop: (a, T) => {
    a.noise(0.06, { vol: 0.25, from: 2000, to: 400 });
    T(1319, 0.08, { vol: 0.07, delay: 0.06, type: 'pulse' });
    T(1760, 0.18, { vol: 0.07, delay: 0.12, type: 'pulse' });
  },
  // こまが 1マス すすむ（ポン。歩くほど 少し 高く）
  sg_step: (a, T, n = 0) => {
    const f = 520 * Math.pow(1.06, Math.min(12, n));
    T(f, 0.05, { vol: 0.07, type: 'triangle' });
    T(f * 1.5, 0.04, { vol: 0.03, delay: 0.02, type: 'sine' });
  },
  // こまが 止まる（トン）
  sg_land: (a, T) => {
    a.noise(0.08, { vol: 0.18, from: 1200, to: 200 });
    T(180, 0.1, { vol: 0.1, type: 'triangle', slide: 90 });
  },
  // 金貨が ジャラジャラ
  sg_coins: (a, T) => {
    for (let i = 0; i < 6; i++) {
      T(1600 + (i % 3) * 250, 0.05, { vol: 0.05, delay: i * 0.05, type: 'square' });
      T(2400 + (i % 2) * 300, 0.1, { vol: 0.035, delay: i * 0.05 + 0.03, type: 'triangle' });
    }
  },
  // 宝箱が ギィ…パカッ → キラーン
  sg_chest: (a, T) => {
    T(150, 0.2, { vol: 0.07, type: 'saw', slide: 260 });
    a.noise(0.08, { vol: 0.22, delay: 0.2, from: 2400, to: 600 });
    [784, 988, 1175, 1568].forEach((f, i) => T(f, 0.16, { vol: 0.06, delay: 0.26 + i * 0.06, type: 'triangle' }));
  },
  // わな（ビョン → ガッ）
  sg_trap: (a, T) => {
    T(300, 0.18, { vol: 0.1, type: 'square', slide: 900 });
    a.noise(0.16, { vol: 0.35, delay: 0.12, from: 1500, to: 150 });
    T(140, 0.18, { vol: 0.14, delay: 0.12, type: 'triangle', slide: 60 });
  },
  // ワープ（フィユーン）
  sg_warp: (a, T) => {
    T(300, 0.45, { vol: 0.07, type: 'sine', slide: 1800 });
    T(310, 0.45, { vol: 0.05, delay: 0.03, type: 'triangle', slide: 1900 });
    a.noise(0.4, { vol: 0.12, type: 'bandpass', from: 600, to: 4000, q: 3 });
  },
  // 星（キラキラ〜ン）
  sg_star: (a, T) => {
    [1568, 2093, 2637, 3136, 4186].forEach((f, i) => T(f, 0.22, { vol: 0.045, delay: i * 0.05, type: 'sine' }));
  },
  // 戦いの マス（ジャーン）
  sg_battle: (a, T) => {
    a.noise(0.35, { vol: 0.35, from: 3000, to: 200 });
    [220, 277, 330].forEach((f) => T(f, 0.4, { vol: 0.06, type: 'saw' }));
    T(110, 0.4, { vol: 0.12, type: 'triangle' });
  },
  // ボーナスチャンス（タラララ〜ン！）
  sg_bonus: (a, T) => {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => T(f, 0.12, { vol: 0.07, delay: i * 0.05, type: 'pulse' }));
    T(2093, 0.4, { vol: 0.05, delay: 0.32, type: 'triangle' });
    T(1568, 0.4, { vol: 0.04, delay: 0.32, type: 'triangle' });
  },
  // ルーレットの カチッ（arg … 高さ）
  sg_tick: (a, T, n = 0) => {
    T(1800 + (n % 2) * 200, 0.025, { vol: 0.06, type: 'square' });
  },
  // ルーレットが 止まる（ピンポーン）
  sg_wheel_stop: (a, T) => {
    T(1175, 0.18, { vol: 0.08, type: 'triangle' });
    T(1568, 0.3, { vol: 0.08, delay: 0.14, type: 'triangle' });
  },
  // 魔物の おみやげ（ぷるん♪）
  sg_gift: (a, T) => {
    T(700, 0.1, { vol: 0.08, type: 'sine', slide: 1100 });
    T(1047, 0.12, { vol: 0.06, delay: 0.12, type: 'triangle' });
    T(1319, 0.2, { vol: 0.06, delay: 0.2, type: 'triangle' });
  },
  // 家族の 応援（わーい！）
  sg_cheer: (a, T) => {
    [659, 784, 1047, 784, 1047, 1319].forEach((f, i) => T(f, 0.1, { vol: 0.06, delay: i * 0.07, type: 'pulse' }));
    a.noise(0.3, { vol: 0.08, delay: 0.1, type: 'bandpass', from: 1500, to: 2500, q: 1 });
  },
  // 落とし穴（ヒュ〜〜 ドスン）
  sg_fall: (a, T) => {
    T(1400, 0.6, { vol: 0.08, type: 'sine', slide: 200 });
    a.noise(0.25, { vol: 0.4, delay: 0.6, from: 900, to: 80 });
    T(90, 0.25, { vol: 0.15, delay: 0.6, type: 'triangle', slide: 45 });
  },
  // はしご（トントントン↑）
  sg_ladder: (a, T) => {
    [392, 440, 494, 523, 587, 659].forEach((f, i) => T(f, 0.06, { vol: 0.06, delay: i * 0.08, type: 'triangle' }));
  },
  // すごろく商人（チリンチリン）
  sg_merchant: (a, T) => {
    [0, 0.14].forEach((d) => { T(2093, 0.12, { vol: 0.05, delay: d, type: 'triangle' }); T(2637, 0.16, { vol: 0.04, delay: d + 0.03, type: 'sine' }); });
  },
  // ゴールの ファンファーレ（パッパカパーン）
  sg_fanfare: (a, T) => {
    const N = [[523, 0, 0.12], [523, 0.13, 0.08], [523, 0.22, 0.08], [659, 0.32, 0.12], [784, 0.46, 0.12], [659, 0.6, 0.1], [784, 0.72, 0.1], [1047, 0.84, 0.5]];
    for (const [f, d, l] of N) {
      T(f, l, { vol: 0.08, delay: d, type: 'pulse' });
      T(f / 2, l, { vol: 0.05, delay: d, type: 'triangle' });
    }
    T(1319, 0.5, { vol: 0.05, delay: 0.84, type: 'pulse' });
  },
  // 花火（ヒュ〜 パーン パチパチ）
  sg_firework: (a, T) => {
    T(600, 0.3, { vol: 0.03, type: 'sine', slide: 1600 });
    a.noise(0.35, { vol: 0.32, delay: 0.3, from: 2500, to: 120 });
    for (let i = 0; i < 4; i++) a.noise(0.04, { vol: 0.08, delay: 0.42 + i * 0.07, type: 'highpass', from: 5000, to: 4000 });
  },
  // 景品が 1つ 出る（シャラン）
  sg_reveal: (a, T) => {
    [1319, 1760, 2349].forEach((f, i) => T(f, 0.2, { vol: 0.05, delay: i * 0.04, type: 'sine' }));
  },
};

export function sgSound(audio, id, arg = 0) {
  if (!audio?.ctx || !SG[id]) return false;
  try {
    SG[id](audio, (...x) => audio.tone(...x), arg);
  } catch { /* 音が 出なくても すごろくは つづける */ }
  return true;
}
export const SG_SOUNDS = Object.keys(SG);
