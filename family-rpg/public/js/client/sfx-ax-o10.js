// 第51回 W（天気の 職業）: 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o10_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax-o5.js と おなじ: ax_o10_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは W だけが さわる
// ── 小さな 音の ぶひん
// ピカッ（いなずまの はじまり）
const pika = (a, T, d = 0, v = 0.4) => { a.noise(0.05, { vol: v, delay: d, type: 'highpass', from: 3000, to: 3000 }); T(1800, 0.06, { vol: 0.05, type: 'saw', slide: 400, delay: d }); };
// ゴロゴロ（とおい かみなり）
const goro = (a, d = 0, v = 0.3, len = 0.5) => a.noise(len, { vol: v, delay: d, from: 260, to: 50 });
// ピシャーン（ちかい かみなり）
const thunder = (a, T, d = 0, v = 0.5) => { pika(a, T, d, v); a.noise(0.4, { vol: v * 0.8, delay: d + 0.04, from: 1000, to: 40 }); };
// ザーッ（雨）
const zaa = (a, d = 0, v = 0.25, len = 0.5) => a.noise(len, { vol: v, delay: d, type: 'highpass', from: 2400, to: 3600 });
// ピチャ（しずく）
const picha = (T, d = 0, v = 0.05) => T(1400, 0.06, { vol: v, type: 'sine', slide: 2400, delay: d });
// ボワッ（炎）
const fire = (a, d = 0, v = 0.35, len = 0.4) => { a.noise(len, { vol: v, delay: d, from: 500, to: 2600 }); a.noise(len * 0.8, { vol: v * 0.7, delay: d + len * 0.5, from: 2400, to: 200 }); };
// ジリジリ（あつい）
const jiri = (a, d = 0, v = 0.18, len = 0.45) => a.noise(len, { vol: v, delay: d, type: 'bandpass', from: 5000, to: 6000, q: 4 });
// ヒュウ（風）
const wind = (a, d = 0, v = 0.25, len = 0.5) => a.noise(len, { vol: v, delay: d, type: 'bandpass', from: 400, to: 1400, q: 1.2 });
// メロディ
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.1, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));
// 天気予報の ジングル（ピンポン パンポン ふう）
const jingle = (T, d = 0, v = 0.06) => arp(T, [784, 988, 1175, 1568], 0.08, { vol: v, type: 'triangle', delay: d, dur: 0.14 });
// いやしの 音
const heal = (T, d = 0, v = 0.05) => arp(T, [784, 988, 1175, 1568], 0.06, { vol: v, type: 'triangle', delay: d, dur: 0.22 });
// 上がる 音
const up = (T, d = 0, v = 0.05) => arp(T, [523, 659, 784, 1047], 0.05, { vol: v, type: 'square', delay: d, dur: 0.08 });
// キラキラ
const kira = (T, d = 0, v = 0.04) => arp(T, [2093, 2637, 3136, 4186], 0.05, { vol: v, type: 'sine', delay: d, dur: 0.18 });
// ポン（ひらく）
const pon = (T, f = 660, d = 0, v = 0.08) => T(f, 0.08, { vol: v, type: 'sine', slide: f * 1.6, delay: d });

// 0.8びょう を こえる 音は 時間を ちぢめる（音の 長さを はかって、こえた ぶんだけ ぜんぶ はやく）
function fit(fn) {
  let end = 0;
  const dry = { tone: () => {}, noise: (dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); } };
  fn(dry, (f, dur, o = {}) => { end = Math.max(end, (o.delay || 0) + dur); });
  if (end <= 0.78) return fn;
  const k = 0.78 / end;
  const sc = (o = {}) => ({ ...o, delay: (o.delay || 0) * k });
  return (a, T) => fn({ noise: (dur, o) => a.noise(dur * k, sc(o)), tone: (...x) => a.tone(...x) }, (f, dur, o) => T(f, dur * k, sc(o)));
}

const RAW = {
  // ── 気象予報士
  ax_o10_pika: (a, T) => { goro(a, 0, 0.15, 0.25); thunder(a, T, 0.26, 0.4); },
  ax_o10_zaa: (a, T) => { zaa(a, 0.05, 0.22, 0.55); picha(T, 0.3); picha(T, 0.42, 0.04); },
  ax_o10_poka: (a, T) => { T(392, 0.3, { vol: 0.05, type: 'sine', slide: 784 }); heal(T, 0.28); },
  ax_o10_yohou: (a, T) => { jingle(T, 0); pon(T, 880, 0.32); up(T, 0.4); },
  ax_o10_jiri: (a, T) => { jiri(a, 0, 0.16, 0.4); fire(a, 0.34, 0.3, 0.3); },
  ax_o10_goro: (a, T) => { goro(a, 0, 0.3, 0.5); thunder(a, T, 0.36, 0.45); zaa(a, 0.1, 0.12, 0.6); },
  ax_o10_atari: (a, T) => { jingle(T, 0, 0.05); arp(T, [1047, 1319], 0.08, { delay: 0.18, vol: 0.06 }); zaa(a, 0.32, 0.28, 0.45); thunder(a, T, 0.5, 0.4); },
  // ── お天気キャスター
  ax_o10_mark: (a, T) => { pon(T, 660, 0); T(500, 0.2, { vol: 0.05, type: 'triangle', slide: 1400, delay: 0.06 }); thunder(a, T, 0.36, 0.5); },
  ax_o10_kasa: (a, T) => { zaa(a, 0, 0.14, 0.5); for (let i = 0; i < 4; i++) pon(T, 520 + i * 90, 0.24 + i * 0.05, 0.07); up(T, 0.5); },
  ax_o10_taiyou: (a, T) => { T(262, 0.5, { vol: 0.06, type: 'triangle', slide: 523 }); kira(T, 0.24); heal(T, 0.4, 0.04); },
  ax_o10_zubari: (a, T) => { arp(T, [523, 659, 784], 0.05, { vol: 0.06 }); T(1568, 0.25, { vol: 0.07, type: 'square', delay: 0.26 }); up(T, 0.42); },
  ax_o10_keihou: (a, T) => { for (let i = 0; i < 3; i++) T(i % 2 ? 660 : 880, 0.1, { vol: 0.05, type: 'square', delay: i * 0.12 }); zaa(a, 0.3, 0.35, 0.45); },
  ax_o10_moushou: (a, T) => { T(220, 0.4, { vol: 0.05, type: 'saw', slide: 880 }); jiri(a, 0.1, 0.18, 0.4); fire(a, 0.4, 0.4, 0.35); },
  ax_o10_zensen: (a, T) => { jingle(T, 0, 0.05); wind(a, 0.2, 0.18, 0.3); zaa(a, 0.4, 0.25, 0.35); thunder(a, T, 0.5, 0.45); },
  ax_o10_kumo: (a, T) => { goro(a, 0, 0.3, 0.45); wind(a, 0.1, 0.15, 0.3); thunder(a, T, 0.44, 0.45); },
  // ── 天候をあやつる者
  ax_o10_ikazuchi: (a, T) => { T(2400, 0.03, { vol: 0.08, type: 'square' }); goro(a, 0.08, 0.3, 0.3); thunder(a, T, 0.4, 0.65); T(60, 0.4, { vol: 0.25, type: 'triangle', slide: 30, delay: 0.42 }); },
  ax_o10_megumi: (a, T) => { zaa(a, 0, 0.1, 0.6); for (let i = 0; i < 5; i++) picha(T, 0.1 + i * 0.09, 0.04); heal(T, 0.45); },
  ax_o10_taifuu: (a, T) => { wind(a, 0, 0.3, 0.7); a.noise(0.5, { vol: 0.3, delay: 0.2, type: 'bandpass', from: 300, to: 900, q: 0.8 }); T(110, 0.5, { vol: 0.08, type: 'saw', slide: 70, delay: 0.3 }); },
  ax_o10_niji: (a, T) => { arp(T, [523, 587, 659, 698, 784, 880, 988], 0.05, { vol: 0.05, type: 'triangle', dur: 0.2 }); kira(T, 0.4); up(T, 0.56); },
  ax_o10_gouu: (a, T) => { goro(a, 0, 0.2, 0.3); zaa(a, 0.15, 0.45, 0.6); a.noise(0.4, { vol: 0.4, delay: 0.4, type: 'bandpass', from: 2400, to: 400, q: 1.5 }); },
  ax_o10_sanren: (a, T) => { thunder(a, T, 0.12, 0.35); thunder(a, T, 0.3, 0.45); thunder(a, T, 0.48, 0.6); },
  ax_o10_gourei: (a, T) => { fire(a, 0, 0.25, 0.2); zaa(a, 0.2, 0.25, 0.25); thunder(a, T, 0.45, 0.6); kira(T, 0.62); },
  ax_o10_tenkiame: (a, T) => { zaa(a, 0, 0.08, 0.5); kira(T, 0.1); heal(T, 0.36); },
};

export const SFX_AX_O10 = {};
for (const [id, fn] of Object.entries(RAW)) SFX_AX_O10[id] = fit(fn);
