// 第49回 O5（家・学校・料理）: もとからの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o5_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o5_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは O5 だけが さわる
// ── 小さな 音の ぶひん
// ブン（ふる 風）
const bun = (a, d = 0, v = 0.25) => a.noise(0.16, { vol: v, delay: d, type: 'bandpass', from: 500, to: 1600, q: 1.2 });
// ドスン・ドーン（おもい）
const don = (a, T, d = 0, v = 0.45) => { a.noise(0.3, { vol: v, delay: d, from: 1400, to: 50 }); T(90, 0.26, { vol: 0.2, type: 'triangle', slide: 40, delay: d }); };
// バシン・パーン（はたく）
const pan = (a, T, d = 0, v = 0.45) => { a.noise(0.05, { vol: v, delay: d, type: 'highpass', from: 2200, to: 2200 }); a.noise(0.16, { vol: v * 0.6, delay: d + 0.02, from: 3000, to: 400 }); T(700, 0.05, { vol: 0.05, type: 'square', delay: d }); };
// トン（包丁）
const ton = (a, T, d = 0, v = 0.3) => { a.noise(0.04, { vol: v, delay: d, type: 'bandpass', from: 1800, to: 900, q: 3 }); T(320, 0.05, { vol: 0.06, type: 'triangle', delay: d }); };
// キン（金属の きらり）
const kin = (T, f, d = 0, v = 0.05) => { T(f, 0.3, { vol: v, type: 'sine', delay: d }); T(f * 1.5, 0.22, { vol: v * 0.6, type: 'sine', delay: d + 0.02 }); };
// ボワッ（炎）
const fire = (a, d = 0, v = 0.4, len = 0.45) => { a.noise(len, { vol: v, delay: d, from: 500, to: 2600 }); a.noise(len * 0.8, { vol: v * 0.7, delay: d + len * 0.5, from: 2400, to: 200 }); };
// ジュウ（焼ける）
const juu = (a, d = 0, v = 0.25, len = 0.5) => a.noise(len, { vol: v, delay: d, type: 'highpass', from: 4000, to: 6000 });
// ポン（かわいい はじけ）
const pon = (T, f = 660, d = 0, v = 0.08) => T(f, 0.08, { vol: v, type: 'sine', slide: f * 1.6, delay: d });
// ピロン・メロディ
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.1, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));
// キラキラ（きらめき）
const kira = (T, d = 0, v = 0.04) => arp(T, [2093, 2637, 3136, 4186], 0.05, { vol: v, type: 'sine', delay: d, dur: 0.18 });
// ふわっ（やわらかい 風）
const fuwa = (a, d = 0, v = 0.18) => a.noise(0.35, { vol: v, delay: d, type: 'bandpass', from: 400, to: 900, q: 0.8 });
// ピシャーン（いなずま）
const thunder = (a, T, d = 0, v = 0.5) => { a.noise(0.06, { vol: v, delay: d, type: 'highpass', from: 2600, to: 2600 }); a.noise(0.4, { vol: v * 0.8, delay: d + 0.04, from: 1000, to: 40 }); T(1600, 0.08, { vol: 0.05, type: 'saw', slide: 300, delay: d }); };
// ザッ（はく）
const zatt = (a, d = 0, v = 0.25) => a.noise(0.14, { vol: v, delay: d, type: 'bandpass', from: 2400, to: 1200, q: 0.8 });
// いやしの 音（チャラーン）
const heal = (T, d = 0, v = 0.05) => arp(T, [784, 988, 1175, 1568], 0.06, { vol: v, type: 'triangle', delay: d, dur: 0.22 });
// 上がる 音（強く なる）
const up = (T, d = 0, v = 0.05) => arp(T, [523, 659, 784, 1047], 0.05, { vol: v, type: 'square', delay: d, dur: 0.08 });
// 下がる 音（弱く なる）
const down = (T, d = 0, v = 0.05) => arp(T, [784, 622, 494, 392], 0.06, { vol: v, type: 'square', delay: d, dur: 0.08 });
// 声っぽい ポワン（ふきだし）
const voice = (T, f, d = 0, n = 2, v = 0.06) => { for (let i = 0; i < n; i++) T(f * (i % 2 ? 1.2 : 1), 0.08, { vol: v, type: 'square', slide: f * 1.1, delay: d + i * 0.09 }); };

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
  // ── 小学生
  ax_o5_randoseru: (a, T) => { bun(a, 0); bun(a, 0.12); don(a, T, 0.28); },
  ax_o5_aisatsu: (a, T) => { voice(T, 523, 0, 4, 0.07); up(T, 0.3); },
  ax_o5_recorder: (a, T) => { arp(T, [784, 880, 740, 988, 698], 0.07, { type: 'sine', vol: 0.07, dur: 0.12 }); T(660, 0.3, { vol: 0.05, type: 'sine', slide: 520, delay: 0.38 }); },
  ax_o5_kyuushoku: (a, T) => { voice(T, 440, 0, 4, 0.05); pon(T, 880, 0.3); heal(T, 0.32); },
  ax_o5_kakekko: (a, T) => { T(1200, 0.05, { vol: 0.06, type: 'square' }); for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.2, delay: 0.08 + i * 0.06, from: 900, to: 400 }); don(a, T, 0.28, 0.35); },
  ax_o5_janken: (a, T) => { voice(T, 587, 0, 3, 0.06); pan(a, T, 0.3, 0.25); arp(T, [784, 1047], 0.06, { delay: 0.32 }); },
  ax_o5_dodge: (a, T) => { a.noise(0.2, { vol: 0.25, type: 'bandpass', from: 800, to: 2400, q: 1.5 }); pan(a, T, 0.25, 0.55); T(220, 0.15, { vol: 0.1, type: 'sine', slide: 440, delay: 0.32 }); },
  ax_o5_yume: (a, T) => { T(392, 0.35, { vol: 0.06, type: 'sine', slide: 784 }); kira(T, 0.3); },
  ax_o5_rocket: (a, T) => { a.noise(0.36, { vol: 0.3, from: 400, to: 3000 }); T(200, 0.3, { vol: 0.06, type: 'saw', slide: 900 }); don(a, T, 0.36, 0.5); },
  ax_o5_radio: (a, T) => { arp(T, [523, 659, 784, 659, 523, 659, 784, 1047], 0.07, { type: 'square', vol: 0.05, dur: 0.07 }); up(T, 0.6, 0.04); },
  // ── 料理人
  ax_o5_houchou: (a, T) => { ton(a, T, 0.12); ton(a, T, 0.21); ton(a, T, 0.3); kin(T, 2637, 0.32, 0.03); },
  ax_o5_soup: (a, T) => { fuwa(a, 0, 0.15); fuwa(a, 0.15, 0.12); heal(T, 0.3); },
  ax_o5_tsuyobi: (a, T) => { T(1800, 0.04, { vol: 0.05, type: 'square' }); T(1800, 0.04, { vol: 0.05, type: 'square', delay: 0.08 }); fire(a, 0.1, 0.4, 0.4); },
  ax_o5_spice: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.15, delay: i * 0.06, type: 'highpass', from: 4000, to: 4000 }); fire(a, 0.3, 0.35, 0.25); T(1200, 0.25, { vol: 0.05, type: 'sine', slide: 1800, delay: 0.56 }); },
  ax_o5_stamina: (a, T) => { juu(a, 0, 0.25, 0.6); up(T, 0.35); },
  ax_o5_mijin: (a, T) => { for (let i = 0; i < 6; i++) ton(a, T, 0.06 + i * 0.055, 0.22); kin(T, 3136, 0.4, 0.03); },
  ax_o5_tsumami: (a, T) => { a.noise(0.1, { vol: 0.15, type: 'bandpass', from: 1200, to: 2400, q: 2 }); pon(T, 700, 0.3); for (let i = 0; i < 3; i++) T(220, 0.06, { vol: 0.06, type: 'triangle', delay: 0.45 + i * 0.09 }); },
  ax_o5_flambe: (a, T) => { juu(a, 0, 0.2, 0.15); fire(a, 0.06, 0.5, 0.5); },
  ax_o5_fullcourse: (a, T) => { for (let i = 0; i < 4; i++) kin(T, 1568 + i * 200, i * 0.07, 0.03); pan(a, T, 0.3, 0.15); heal(T, 0.38); },
  ax_o5_kakushi: (a, T) => { a.noise(0.08, { vol: 0.12, type: 'highpass', from: 5000, to: 7000 }); kin(T, 3520, 0.3, 0.07); },
  ax_o5_daikaryoku: (a, T) => { T(160, 0.06, { vol: 0.1, type: 'square' }); T(160, 0.06, { vol: 0.1, type: 'square', delay: 0.12 }); fire(a, 0.18, 0.55, 0.5); },
  // ── ニート
  ax_o5_makura: (a, T) => { fuwa(a, 0, 0.18); a.noise(0.25, { vol: 0.35, delay: 0.32, from: 800, to: 100 }); },
  ax_o5_gorogoro: (a, T) => { T(140, 0.18, { vol: 0.1, type: 'triangle', slide: 100 }); T(140, 0.18, { vol: 0.1, type: 'triangle', slide: 100, delay: 0.2 }); heal(T, 0.35, 0.04); },
  ax_o5_potechi: (a, T) => { a.noise(0.08, { vol: 0.4, type: 'highpass', from: 2000, to: 3000, delay: 0.08 }); for (let i = 0; i < 5; i++) a.noise(0.03, { vol: 0.12, delay: 0.2 + i * 0.06, type: 'highpass', from: 3500, to: 3500 }); },
  ax_o5_yofukashi: (a, T) => { arp(T, [1319, 1568, 1319, 1568], 0.06, { vol: 0.04 }); kin(T, 2637, 0.32, 0.05); },
  ax_o5_ashita: (a, T) => { voice(T, 330, 0, 3, 0.05); a.noise(0.3, { vol: 0.2, delay: 0.32, from: 800, to: 200 }); },
  ax_o5_guguru: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.03, { vol: 0.12, delay: i * 0.05, type: 'highpass', from: 3000, to: 3000 }); T(1760, 0.08, { vol: 0.06, type: 'sine', delay: 0.18 }); pan(a, T, 0.3, 0.35); },
  ax_o5_nidone: (a, T) => { for (let i = 0; i < 6; i++) T(2400, 0.03, { vol: 0.04, type: 'square', delay: 0.16 + i * 0.035 }); T(800, 0.03, { vol: 0.08, type: 'square', delay: 0.38 }); T(110, 0.3, { vol: 0.06, type: 'triangle', delay: 0.45 }); },
  ax_o5_jersey: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.06, { vol: 0.15, delay: i * 0.07, type: 'bandpass', from: 700, to: 1400, q: 1 }); a.noise(0.45, { vol: 0.35, delay: 0.2, type: 'bandpass', from: 600, to: 2400, q: 0.7 }); },
  ax_o5_ippatsu: (a, T) => { fuwa(a, 0, 0.2); fire(a, 0.08, 0.3, 0.25); don(a, T, 0.32, 0.6); },
  ax_o5_kyou: (a, T) => { T(1047, 0.05, { vol: 0.07, type: 'square' }); fire(a, 0.05, 0.25, 0.2); pan(a, T, 0.28, 0.5); },
  ax_o5_ofuton: (a, T) => { a.noise(0.25, { vol: 0.15, type: 'bandpass', from: 300, to: 900, q: 1 }); T(330, 0.1, { vol: 0.06, type: 'sine', slide: 220, delay: 0.25 }); kin(T, 1568, 0.32, 0.04); },
  // ── おかん
  ax_o5_negiri: (a, T) => { voice(T, 494, 0, 4, 0.06); a.noise(0.15, { vol: 0.15, delay: 0.3, type: 'highpass', from: 2000, to: 5000 }); down(T, 0.36); },
  ax_o5_bentou: (a, T) => { pon(T, 600, 0.12); heal(T, 0.3); },
  ax_o5_katazuke: (a, T) => { voice(T, 392, 0, 2, 0.08); zatt(a, 0.22); zatt(a, 0.32); pon(T, 330, 0.62, 0.07); },
  ax_o5_ame: (a, T) => { voice(T, 587, 0, 3, 0.05); pon(T, 880, 0.32); T(1319, 0.2, { vol: 0.04, type: 'sine', delay: 0.36 }); },
  ax_o5_idobata: (a, T) => { for (let i = 0; i < 7; i++) T(380 + (i % 3) * 120, 0.05, { vol: 0.05, type: 'square', delay: i * 0.06 }); T(440, 0.3, { vol: 0.04, type: 'sine', slide: 220, delay: 0.42 }); },
  ax_o5_bargain: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.2, delay: i * 0.08, from: 900, to: 400 }); a.noise(0.15, { vol: 0.25, delay: 0.32, type: 'bandpass', from: 1500, to: 800, q: 1 }); },
  // ── 中学生
  ax_o5_bukatsu: (a, T) => { T(2200, 0.3, { vol: 0.06, type: 'square' }); voice(T, 330, 0.35, 2, 0.06); up(T, 0.4); },
  ax_o5_smash: (a, T) => { bun(a, 0, 0.3); a.noise(0.06, { vol: 0.3, delay: 0.08, type: 'highpass', from: 3000, to: 3000 }); pan(a, T, 0.33, 0.55); },
  ax_o5_test: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.04, { vol: 0.1, delay: i * 0.05, type: 'highpass', from: 4000, to: 6000 }); T(1047, 0.08, { vol: 0.05, type: 'square', delay: 0.34 }); down(T, 0.45, 0.04); },
  ax_o5_hankou: (a, T) => { voice(T, 300, 0, 3, 0.06); for (let i = 0; i < 4; i++) don(a, T, 0.16 + i * 0.11, 0.25); },
  ax_o5_gasshou: (a, T) => { [523, 659, 784].forEach((f) => T(f, 0.6, { vol: 0.04, type: 'sine' })); heal(T, 0.36, 0.04); },
  ax_o5_zenkoku: (a, T) => { a.noise(0.5, { vol: 0.15, type: 'bandpass', from: 800, to: 1200, q: 0.6 }); for (let i = 0; i < 3; i++) don(a, T, 0.4 + i * 0.08, 0.35); },
  ax_o5_relay: (a, T) => { pan(a, T, 0, 0.4); for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.18, delay: 0.1 + i * 0.07, from: 900, to: 400 }); don(a, T, 0.42, 0.45); },
  // ── パティシエ
  ax_o5_cream: (a, T) => { T(300, 0.3, { vol: 0.05, type: 'sine', slide: 500 }); a.noise(0.12, { vol: 0.25, delay: 0.36, from: 600, to: 200 }); },
  ax_o5_candy: (a, T) => { for (let i = 0; i < 6; i++) pon(T, 880 + i * 120, i * 0.06, 0.05); kira(T, 0.4); },
  ax_o5_cake: (a, T) => { pon(T, 520, 0.16); arp(T, [784, 988, 1175], 0.07, { type: 'sine', vol: 0.06, delay: 0.36 }); },
  ax_o5_choco: (a, T) => { T(220, 0.35, { vol: 0.06, type: 'sine', slide: 110 }); juu(a, 0.38, 0.25, 0.3); down(T, 0.5, 0.04); },
  ax_o5_macaron: (a, T) => { for (let i = 0; i < 4; i++) pon(T, 500 + i * 100, 0.1 + i * 0.06, 0.06); for (let i = 0; i < 3; i++) a.noise(0.12, { vol: 0.25, delay: 0.42 + i * 0.05, from: 1600, to: 200 }); },
  ax_o5_sugar: (a, T) => { a.noise(0.35, { vol: 0.12, type: 'highpass', from: 5000, to: 7000 }); kin(T, 2093, 0.38, 0.05); },
  ax_o5_kaori: (a, T) => { T(2093, 0.3, { vol: 0.06, type: 'sine' }); fuwa(a, 0.25, 0.15); T(660, 0.4, { vol: 0.04, type: 'sine', slide: 440, delay: 0.4 }); },
  ax_o5_wedding: (a, T) => { [0, 0.25].forEach((d) => { T(1568, 0.4, { vol: 0.07, type: 'sine', delay: 0.3 + d }); T(2349, 0.3, { vol: 0.04, type: 'sine', delay: 0.31 + d }); }); },
  ax_o5_okashi: (a, T) => { ton(a, T, 0, 0.2); ton(a, T, 0.08, 0.2); ton(a, T, 0.16, 0.2); heal(T, 0.4); },
  // ── 最強のおかん
  ax_o5_kaminari: (a, T) => { a.noise(0.3, { vol: 0.2, from: 300, to: 80 }); voice(T, 330, 0.1, 3, 0.07); thunder(a, T, 0.36, 0.55); },
  ax_o5_okawari: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.08, { vol: 0.15, delay: 0.1 + i * 0.18, type: 'bandpass', from: 600, to: 400, q: 1 }); heal(T, 0.45); },
  ax_o5_oosouji: (a, T) => { zatt(a, 0, 0.3); zatt(a, 0.15, 0.3); a.noise(0.35, { vol: 0.3, delay: 0.32, type: 'bandpass', from: 2000, to: 600, q: 0.7 }); },
  ax_o5_slipper: (a, T) => { pan(a, T, 0.24, 0.45); pan(a, T, 0.34, 0.45); pan(a, T, 0.44, 0.55); },
  ax_o5_ai: (a, T) => { T(392, 0.3, { vol: 0.05, type: 'sine', slide: 523 }); arp(T, [1047, 1319, 1568, 2093], 0.05, { type: 'sine', vol: 0.06, delay: 0.36, dur: 0.3 }); },
  ax_o5_kaji: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.06, { vol: 0.15, delay: i * 0.05, from: 600, to: 300 }); juu(a, 0.2, 0.2, 0.15); kin(T, 2637, 0.38, 0.05); up(T, 0.45); },
  ax_o5_binta: (a, T) => { T(1400, 0.35, { vol: 0.04, type: 'sine', slide: 600 }); pan(a, T, 0.42, 0.65); don(a, T, 0.44, 0.35); },
  ax_o5_chabudai: (a, T) => { T(160, 0.25, { vol: 0.06, type: 'saw', slide: 120 }); don(a, T, 0.42, 0.5); for (let i = 0; i < 4; i++) a.noise(0.06, { vol: 0.2, delay: 0.5 + i * 0.06, type: 'highpass', from: 2400, to: 4000 }); },
  // ── クリエイター
  ax_o5_kago: (a, T) => { bun(a, 0); a.noise(0.25, { vol: 0.35, delay: 0.32, type: 'bandpass', from: 2400, to: 900, q: 1 }); },
  ax_o5_kusuri: (a, T) => { a.noise(0.08, { vol: 0.15, type: 'bandpass', from: 2000, to: 3000, q: 2 }); pon(T, 700, 0.36); heal(T, 0.4); },
  ax_o5_point: (a, T) => { arp(T, [1319, 1760], 0.08, { vol: 0.05, type: 'sine', delay: 0.28 }); arp(T, [1319, 1760], 0.08, { vol: 0.05, type: 'sine', delay: 0.48 }); },
  ax_o5_spray: (a, T) => { a.noise(0.12, { vol: 0.3, type: 'highpass', from: 3000, to: 5000 }); a.noise(0.12, { vol: 0.3, delay: 0.14, type: 'highpass', from: 3000, to: 5000 }); kira(T, 0.38, 0.03); },
  ax_o5_shohou: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.12, delay: 0.2 + i * 0.05, type: 'bandpass', from: 2400, to: 1600, q: 2 }); heal(T, 0.4); },
  ax_o5_ooyasuuri: (a, T) => { for (let i = 0; i < 4; i++) T(1568, 0.08, { vol: 0.06, type: 'sine', delay: i * 0.1 }); a.noise(0.2, { vol: 0.2, delay: 0.3, from: 800, to: 200 }); pan(a, T, 0.45, 0.35); },
  ax_o5_kenkou: (a, T) => { for (let i = 0; i < 3; i++) T(1760, 0.05, { vol: 0.06, type: 'sine', delay: 0.15 + i * 0.13 }); heal(T, 0.45); },
  // ── 高校生
  ax_o5_seishun: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.05, { vol: 0.15, delay: i * 0.08, from: 900, to: 400 }); a.noise(0.2, { vol: 0.35, delay: 0.38, type: 'highpass', from: 2500, to: 6000 }); kira(T, 0.42); },
  ax_o5_bunkasai: (a, T) => { a.noise(0.4, { vol: 0.12, type: 'bandpass', from: 900, to: 1300, q: 0.6 }); pon(T, 660, 0.4); up(T, 0.45); },
  ax_o5_shuugaku: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.18, { vol: 0.3, delay: 0.12 + i * 0.09, from: 800, to: 100 }); },
  ax_o5_yuujou: (a, T) => { T(330, 0.2, { vol: 0.06, type: 'triangle' }); arp(T, [784, 988, 1175, 1568, 1976], 0.06, { type: 'sine', vol: 0.06, delay: 0.38, dur: 0.3 }); },
  ax_o5_mirai: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.15, delay: i * 0.07, from: 900, to: 400 }); T(1200, 0.2, { vol: 0.05, type: 'sine', slide: 2400, delay: 0.3 }); don(a, T, 0.5, 0.6); },
  ax_o5_hanabi: (a, T) => { T(400, 0.35, { vol: 0.05, type: 'sine', slide: 1400 }); don(a, T, 0.32, 0.45); don(a, T, 0.46, 0.4); don(a, T, 0.6, 0.5); },
  // ── 三ツ星シェフ
  ax_o5_tetsujin: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.08, { vol: 0.3, delay: 0.2 + i * 0.08, type: 'highpass', from: 2500, to: 7000 }); kin(T, 3136, 0.48, 0.07); },
  ax_o5_ajimi: (a, T) => { T(660, 0.06, { vol: 0.05, type: 'sine', slide: 900, delay: 0.2 }); voice(T, 523, 0.36, 1, 0.07); T(1568, 0.1, { vol: 0.06, type: 'square', delay: 0.45 }); },
  ax_o5_honoo: (a, T) => { fire(a, 0, 0.35, 0.3); fire(a, 0.15, 0.35, 0.3); fire(a, 0.3, 0.5, 0.4); },
  ax_o5_osusume: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.05, { vol: 0.1, delay: 0.1 + i * 0.05, type: 'bandpass', from: 2400, to: 1800, q: 3 }); pan(a, T, 0.42, 0.2); kira(T, 0.48); },
  ax_o5_mitsuboshi: (a, T) => { kin(T, 1568, 0); kin(T, 1976, 0.08); kin(T, 2349, 0.16); for (let i = 0; i < 4; i++) kin(T, 1319, 0.26 + i * 0.06, 0.025); heal(T, 0.5); },
  ax_o5_kyuukyoku: (a, T) => { pan(a, T, 0.3, 0.2); fire(a, 0.42, 0.5, 0.35); arp(T, [1047, 1319, 1568, 2093], 0.05, { type: 'sine', vol: 0.05, delay: 0.62, dur: 0.15 }); },
  ax_o5_salad: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.03, { vol: 0.14, delay: i * 0.05, type: 'highpass', from: 3000, to: 5000 }); heal(T, 0.5); },
  // ── 合体技
  ax_o5_sankan: (a, T) => { a.noise(0.12, { vol: 0.2, type: 'bandpass', from: 600, to: 300, q: 1 }); voice(T, 587, 0.5, 2, 0.07); up(T, 0.62); },
  ax_o5_todoke: (a, T) => { voice(T, 440, 0, 4, 0.06); for (let i = 0; i < 3; i++) a.noise(0.04, { vol: 0.12, delay: 0.35 + i * 0.07, from: 800, to: 400 }); pon(T, 600, 0.55); heal(T, 0.62); },
  ax_o5_hataraki: (a, T) => { fuwa(a, 0); voice(T, 330, 0.15, 4, 0.07); for (let i = 0; i < 2; i++) don(a, T, 0.62 + i * 0.08, 0.35); },
  ax_o5_gyouretsu: (a, T) => { voice(T, 523, 0.05, 4, 0.06); juu(a, 0.3, 0.12, 0.3); heal(T, 0.62); },
  ax_o5_kyuuri: (a, T) => { a.noise(0.05, { vol: 0.2, delay: 0.1, type: 'highpass', from: 3000, to: 3000 }); a.noise(0.1, { vol: 0.18, delay: 0.45, type: 'bandpass', from: 900, to: 500, q: 1 }); voice(T, 523, 0.56, 3, 0.06); heal(T, 0.68, 0.04); },
  ax_o5_techou: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.04, { vol: 0.12, delay: 0.1 + i * 0.07, type: 'bandpass', from: 2400, to: 1600, q: 2 }); pon(T, 700, 0.55); pon(T, 880, 0.62); arp(T, [1047, 1568, 2093], 0.05, { type: 'sine', vol: 0.05, delay: 0.7, dur: 0.1 }); },
  ax_o5_jump: (a, T) => { voice(T, 440, 0, 3, 0.07); T(300, 0.4, { vol: 0.05, type: 'sine', slide: 900, delay: 0.2 }); don(a, T, 0.78, 0.65); },
  ax_o5_daisakusen: (a, T) => { zatt(a, 0.12); zatt(a, 0.26); for (let i = 0; i < 3; i++) a.noise(0.04, { vol: 0.15, delay: 0.4 + i * 0.05, type: 'bandpass', from: 1200, to: 900, q: 2 }); pon(T, 300, 0.78, 0.08); },
  ax_o5_matsuri: (a, T) => { don(a, T, 0.2, 0.35); don(a, T, 0.36, 0.35); T(500, 0.25, { vol: 0.05, type: 'sine', slide: 1400, delay: 0.3 }); don(a, T, 0.6, 0.45); kira(T, 0.7, 0.03); },
  ax_o5_zenin: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.18, delay: 0.1 + i * 0.06, from: 900, to: 400 }); T(600, 0.4, { vol: 0.05, type: 'saw', slide: 1200, delay: 0.3 }); don(a, T, 0.78, 0.7); },
  ax_o5_kaigi: (a, T) => { for (let i = 0; i < 8; i++) T(260 + (i % 3) * 40, 0.07, { vol: 0.05, type: 'triangle', delay: 0.2 + i * 0.07 }); T(220, 0.2, { vol: 0.05, type: 'sine', slide: 110, delay: 0.78 }); },
};

export const SFX_AX_O5 = Object.fromEntries(Object.entries(RAW).map(([id, fn]) => [id, fit(fn)]));
