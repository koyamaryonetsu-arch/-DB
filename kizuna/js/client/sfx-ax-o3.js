// 第49回 O3（会社と お金）: もとからの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o3_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o3_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは O3 だけが さわる
// ・会社と お金の 音: ハンコの ポン・レジの ピッ・金貨の チャリン・電車の プシュー・キーボードの カタカタ・ゴルフの カキーン…

// ポン（みじかい まるい 音）
const pon = (T, d = 0, f = 880, v = 0.08) => { T(f, 0.08, { vol: v, type: 'sine', slide: f * 0.6, delay: d }); };
// ならぶ 音（f の じゅんに）
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.1, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));
// ヒュッ（風を きる）
const whoosh = (a, d = 0, dur = 0.2, v = 0.3, from = 600, to = 2600) => a.noise(dur, { vol: v, delay: d, type: 'bandpass', from, to, q: 1.2 });
// ドン（ひくい）
const thud = (a, T, d = 0, v = 0.45) => { a.noise(0.28, { vol: v, delay: d, from: 1200, to: 40 }); T(90, 0.26, { vol: 0.2, type: 'triangle', slide: 40, delay: d }); };
// パシッ（たたく）
const slap = (a, d = 0, v = 0.4) => { a.noise(0.06, { vol: v, delay: d, type: 'highpass', from: 2400, to: 5000 }); a.noise(0.1, { vol: v * 0.5, delay: d + 0.02, from: 2000, to: 400 }); };
// カチン（グラス・金属）
const clink = (T, d = 0, v = 0.05) => { T(2637, 0.28, { vol: v, type: 'sine', delay: d }); T(3520, 0.22, { vol: v * 0.7, type: 'sine', delay: d + 0.01 }); };
// ピッ（電子音）
const beep = (T, d = 0, f = 1760, v = 0.05) => T(f, 0.06, { vol: v, type: 'square', delay: d });
// チャリン（金貨）
const coin = (T, d = 0, v = 0.05) => { T(1976, 0.06, { vol: v, type: 'square', delay: d }); T(2637, 0.22, { vol: v, type: 'square', delay: d + 0.06 }); };
// きらきら
const twinkle = (T, d = 0, v = 0.04) => arp(T, [2093, 2637, 3136, 4186], 0.05, { type: 'sine', dur: 0.18, vol: v, delay: d });
// ファンファーレ（パンパカパーン）
const fanfare = (T, d = 0, v = 0.06) => { arp(T, [523, 523, 523], 0.09, { type: 'square', dur: 0.07, vol: v, delay: d }); T(784, 0.32, { vol: v, type: 'square', delay: d + 0.28 }); T(1047, 0.3, { vol: v * 0.6, type: 'triangle', delay: d + 0.28 }); };
// ゴゴゴ（ひくい ゆれ）
const rumble = (a, d = 0, dur = 0.5, v = 0.3) => a.noise(dur, { vol: v, delay: d, from: 300, to: 60 });
// プシュー（空気）
const pshh = (a, d = 0, v = 0.25) => a.noise(0.45, { vol: v, delay: d, type: 'highpass', from: 3000, to: 1500 });
// カタカタ（キーボード）
const typing = (a, d = 0, n = 8, gap = 0.045) => { for (let i = 0; i < n; i++) a.noise(0.025, { vol: 0.18, delay: d + i * gap, type: 'highpass', from: 4000, to: 4000 }); };
// ねむい（ゆらぐ ひくい 音）
const sleepy = (T, d = 0) => { T(392, 0.3, { vol: 0.05, type: 'sine', slide: 330, delay: d }); T(330, 0.35, { vol: 0.05, type: 'sine', slide: 262, delay: d + 0.3 }); };
// 回復の ふわっ
const heal = (T, d = 0) => arp(T, [784, 988, 1175, 1568], 0.06, { type: 'triangle', dur: 0.2, vol: 0.045, delay: d });
// 力が 上がる（シャキーン）
const up = (T, d = 0) => { T(600, 0.2, { vol: 0.06, type: 'triangle', slide: 1800, delay: d }); clink(T, d + 0.16, 0.035); };
// 大きな 爆発
const boom = (a, T, d = 0, v = 0.55) => { a.noise(0.36, { vol: v, delay: d, from: 1800, to: 40 }); T(70, 0.3, { vol: 0.24, type: 'triangle', slide: 30, delay: d }); };

export const SFX_AX_O3 = {
  // ── 会社員
  ax_o3_meishi: (a, T) => { twinkle(T, 0, 0.03); whoosh(a, 0.12, 0.15, 0.2, 1200, 3000); pon(T, 0.3, 660, 0.07); },
  ax_o3_horenso: (a, T) => { pon(T, 0, 1320); pon(T, 0.08, 1568); pon(T, 0.16, 1760); up(T, 0.26); },
  ax_o3_kaban: (a, T) => { whoosh(a, 0, 0.22, 0.3, 400, 1600); slap(a, 0.24, 0.5); thud(a, T, 0.25, 0.3); },
  ax_o3_zangyo: (a, T) => { for (let i = 0; i < 5; i++) beep(T, i * 0.06, 2400, 0.03); T(200, 0.3, { vol: 0.08, type: 'saw', slide: 500, delay: 0.25 }); },
  ax_o3_coffee: (a, T) => { a.noise(0.25, { vol: 0.12, type: 'bandpass', from: 800, to: 400, q: 2 }); T(523, 0.3, { vol: 0.05, type: 'sine', slide: 440, delay: 0.32 }); },
  ax_o3_teiji: (a, T) => { beep(T, 0.18, 1200, 0.06); T(400, 0.35, { vol: 0.06, type: 'triangle', slide: 1600, delay: 0.22 }); whoosh(a, 0.24, 0.3, 0.25); },
  ax_o3_presen: (a, T) => { a.noise(0.03, { vol: 0.2, type: 'highpass', from: 3000, to: 3000 }); a.noise(0.03, { vol: 0.2, delay: 0.15, type: 'highpass', from: 3000, to: 3000 }); sleepy(T, 0.3); },
  ax_o3_kanpai: (a, T) => { clink(T, 0.24, 0.07); clink(T, 0.29, 0.05); a.noise(0.3, { vol: 0.1, delay: 0.3, type: 'highpass', from: 5000, to: 7000 }); heal(T, 0.4); },
  ax_o3_eigyo: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.04, { vol: 0.2, delay: i * 0.07, from: 900, to: 300 }); a.noise(0.08, { vol: 0.25, delay: 0.2, type: 'bandpass', from: 1500, to: 800, q: 2 }); thud(a, T, 0.34); },
  ax_o3_nouki: (a, T) => { a.noise(0.15, { vol: 0.3, type: 'highpass', from: 2000, to: 4000 }); for (let i = 0; i < 5; i++) a.noise(0.04, { vol: 0.22, delay: 0.15 + i * 0.07, from: 900, to: 300 }); thud(a, T, 0.33, 0.3); },
  ax_o3_bonus: (a, T) => { whoosh(a, 0, 0.3, 0.1, 1500, 3000); twinkle(T, 0.22, 0.05); fanfare(T, 0.3, 0.04); },
  ax_o3_shuriken: (a, T) => { for (let i = 0; i < 4; i++) whoosh(a, i * 0.05, 0.1, 0.2, 2000, 5000); for (let i = 0; i < 3; i++) slap(a, 0.3 + i * 0.05, 0.25); },
  ax_o3_coffee2: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.06, { vol: 0.1, delay: i * 0.08, type: 'bandpass', from: 700, to: 500, q: 3 }); heal(T, 0.36); },
  // ── アルバイト
  ax_o3_danboru: (a, T) => { whoosh(a, 0, 0.28, 0.25, 300, 1200); thud(a, T, 0.3, 0.55); a.noise(0.15, { vol: 0.2, delay: 0.32, type: 'bandpass', from: 600, to: 300, q: 2 }); },
  ax_o3_irasshai: (a, T) => { T(660, 0.12, { vol: 0.07, type: 'square' }); T(880, 0.12, { vol: 0.07, type: 'square', delay: 0.12 }); T(988, 0.25, { vol: 0.07, type: 'square', slide: 880, delay: 0.24 }); a.noise(0.3, { vol: 0.15, delay: 0.1, type: 'bandpass', from: 1200, to: 800, q: 1 }); },
  ax_o3_reji: (a, T) => { for (let i = 0; i < 4; i++) beep(T, 0.14 + i * 0.08, 1976, 0.06); a.noise(0.3, { vol: 0.12, delay: 0.46, type: 'bandpass', from: 2500, to: 2500, q: 4 }); },
  ax_o3_makanai: (a, T) => { a.noise(0.3, { vol: 0.08, type: 'bandpass', from: 600, to: 300, q: 2 }); heal(T, 0.28); },
  ax_o3_shift: (a, T) => { whoosh(a, 0, 0.2, 0.15, 1500, 800); whoosh(a, 0.05, 0.2, 0.15, 800, 1500); for (let i = 0; i < 4; i++) beep(T, 0.3 + i * 0.07, 1400, 0.03); },
  ax_o3_cart: (a, T) => { for (let i = 0; i < 8; i++) a.noise(0.05, { vol: 0.2, delay: i * 0.06, type: 'bandpass', from: 500, to: 300, q: 3 }); thud(a, T, 0.28, 0.35); },
  ax_o3_yakin: (a, T) => { T(330, 0.3, { vol: 0.05, type: 'sine', slide: 220 }); T(200, 0.25, { vol: 0.08, type: 'saw', slide: 600, delay: 0.24 }); },
  ax_o3_bell: (a, T) => { T(2093, 0.6, { vol: 0.08, type: 'sine', delay: 0.08 }); T(4186, 0.4, { vol: 0.03, type: 'sine', delay: 0.08 }); },
  ax_o3_kaikin: (a, T) => { fanfare(T, 0, 0.05); twinkle(T, 0.35, 0.035); },
  ax_o3_nenmatsu: (a, T) => { for (let i = 0; i < 6; i++) slap(a, 0.16 + i * 0.07, 0.3); T(196, 0.5, { vol: 0.12, type: 'sine', delay: 0.55 }); T(392, 0.4, { vol: 0.05, type: 'sine', delay: 0.55 }); },
  ax_o3_wanope: (a, T) => { for (let i = 0; i < 5; i++) { a.noise(0.05, { vol: 0.2, delay: i * 0.11, from: 1200, to: 300 }); beep(T, i * 0.11 + 0.02, 1500 + i * 120, 0.03); } },
  ax_o3_smile: (a, T) => { T(784, 0.12, { vol: 0.06, type: 'triangle', slide: 1175 }); twinkle(T, 0.15, 0.045); heal(T, 0.3); },
  // ── 部長
  ax_o3_kaigi: (a, T) => { a.noise(0.08, { vol: 0.15, type: 'bandpass', from: 400, to: 300, q: 2 }); for (let i = 0; i < 4; i++) beep(T, 0.12 + i * 0.12, 1000, 0.025); sleepy(T, 0.4); },
  ax_o3_golf: (a, T) => { whoosh(a, 0, 0.18, 0.3, 800, 3000); T(1568, 0.25, { vol: 0.07, type: 'triangle', delay: 0.12 }); a.noise(0.05, { vol: 0.3, delay: 0.12, type: 'highpass', from: 3000, to: 3000 }); whoosh(a, 0.15, 0.2, 0.12, 2400, 4000); },
  ax_o3_hanko: (a, T) => { whoosh(a, 0, 0.25, 0.12, 400, 900); thud(a, T, 0.3, 0.35); pon(T, 0.3, 523, 0.1); up(T, 0.45); },
  ax_o3_homeru: (a, T) => { a.noise(0.06, { vol: 0.15, type: 'highpass', from: 3000, to: 5000 }); a.noise(0.06, { vol: 0.15, delay: 0.1, type: 'highpass', from: 3000, to: 5000 }); twinkle(T, 0.3, 0.05); },
  ax_o3_idou: (a, T) => { a.noise(0.08, { vol: 0.15, type: 'highpass', from: 3000, to: 3000 }); T(600, 0.5, { vol: 0.06, type: 'sine', slide: 2400, delay: 0.36 }); whoosh(a, 0.36, 0.4, 0.2, 800, 3000); },
  ax_o3_shucchou: (a, T) => { for (let i = 0; i < 4; i++) { whoosh(a, i * 0.12, 0.18, 0.18); slap(a, 0.24 + i * 0.12, 0.35); } },
  ax_o3_modoshi: (a, T) => { a.noise(0.15, { vol: 0.35, delay: 0.3, type: 'highpass', from: 2000, to: 6000 }); T(1200, 0.35, { vol: 0.05, type: 'sine', slide: 300, delay: 0.55 }); a.noise(0.25, { vol: 0.12, delay: 0.55, type: 'bandpass', from: 2000, to: 600, q: 2 }); },
  ax_o3_settai: (a, T) => { T(330, 0.1, { vol: 0.05, type: 'sine', slide: 260 }); whoosh(a, 0.2, 0.2, 0.35, 800, 3200); a.noise(0.06, { vol: 0.35, delay: 0.26, type: 'highpass', from: 3000, to: 3000 }); T(2093, 0.3, { vol: 0.07, type: 'triangle', delay: 0.26 }); for (let i = 0; i < 5; i++) a.noise(0.03, { vol: 0.14, delay: 0.6 + i * 0.04, type: 'bandpass', from: 1500, to: 1500, q: 1 }); },
  // ── 正社員
  ax_o3_shainsho: (a, T) => { T(300, 0.15, { vol: 0.06, type: 'triangle', slide: 900 }); slap(a, 0.2, 0.5); clink(T, 0.2, 0.05); },
  ax_o3_chourei: (a, T) => { arp(T, [523, 659, 784, 1047], 0.08, { type: 'triangle', dur: 0.2, vol: 0.06 }); up(T, 0.32); },
  ax_o3_yukyu: (a, T) => { a.noise(0.6, { vol: 0.15, type: 'bandpass', from: 400, to: 900, q: 0.8 }); heal(T, 0.4); },
  ax_o3_gear: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.03, { vol: 0.2, delay: i * 0.06, type: 'bandpass', from: 1800, to: 1800, q: 4 }); thud(a, T, 0.38, 0.35); },
  ax_o3_onsen: (a, T) => { T(220, 0.3, { vol: 0.12, type: 'sine', delay: 0.1 }); T(440, 0.4, { vol: 0.04, type: 'sine', delay: 0.1 }); heal(T, 0.38); },
  ax_o3_ookuchi: (a, T) => { a.noise(0.35, { vol: 0.15, type: 'bandpass', from: 2000, to: 3000, q: 3 }); thud(a, T, 0.38, 0.5); coin(T, 0.45, 0.04); },
  ax_o3_shusse: (a, T) => { arp(T, [392, 523, 659, 784, 1047], 0.07, { type: 'square', dur: 0.08, vol: 0.05 }); T(1568, 0.3, { vol: 0.06, type: 'triangle', delay: 0.42 }); twinkle(T, 0.45, 0.035); },
  ax_o3_trophy: (a, T) => { T(523, 0.15, { vol: 0.07, type: 'square' }); T(523, 0.12, { vol: 0.07, type: 'square', delay: 0.16 }); T(784, 0.4, { vol: 0.07, type: 'square', delay: 0.3 }); twinkle(T, 0.4, 0.04); },
  // ── 社ちく
  ax_o3_drink: (a, T) => { a.noise(0.12, { vol: 0.3, type: 'highpass', from: 3000, to: 1500 }); for (let i = 0; i < 3; i++) T(180, 0.08, { vol: 0.1, type: 'sine', slide: 120, delay: 0.2 + i * 0.09 }); heal(T, 0.45); },
  ax_o3_nagai: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.05, { vol: 0.08, delay: i * 0.06, type: 'bandpass', from: 2500, to: 2000, q: 3 }); sleepy(T, 0.42); },
  ax_o3_iji: (a, T) => { T(110, 0.3, { vol: 0.12, type: 'saw', slide: 220 }); whoosh(a, 0.1, 0.2, 0.25); thud(a, T, 0.3, 0.5); },
  ax_o3_peko: (a, T) => { for (let i = 0; i < 3; i++) T(440, 0.08, { vol: 0.06, type: 'triangle', slide: 300, delay: i * 0.13 }); T(300, 0.3, { vol: 0.06, type: 'sine', slide: 200, delay: 0.46 }); },
  ax_o3_shuuden: (a, T) => { for (let i = 0; i < 4; i++) { a.noise(0.04, { vol: 0.2, delay: i * 0.12, from: 900, to: 300 }); slap(a, 0.26 + i * 0.12, 0.3); } pshh(a, 0.7, 0.2); },
  ax_o3_mail: (a, T) => { for (let i = 0; i < 5; i++) { T(1568, 0.05, { vol: 0.05, type: 'square', delay: 0.3 + i * 0.06 }); T(2093, 0.06, { vol: 0.05, type: 'square', delay: 0.33 + i * 0.06 }); } },
  ax_o3_drink3: (a, T) => { for (let i = 0; i < 3; i++) T(180, 0.08, { vol: 0.1, type: 'sine', slide: 120, delay: 0.16 + i * 0.18 }); a.noise(0.3, { vol: 0.4, delay: 0.6, from: 600, to: 2600 }); },
  // ── 楽天カードマン
  ax_o3_card: (a, T) => { whoosh(a, 0, 0.2, 0.3, 1500, 5000); slap(a, 0.22, 0.45); },
  ax_o3_point: (a, T) => { for (let i = 0; i < 4; i++) pon(T, 0.1 + i * 0.08, 988 + i * 120, 0.07); heal(T, 0.45); },
  ax_o3_ribo: (a, T) => { slap(a, 0.3, 0.3); for (let i = 0; i < 3; i++) a.noise(0.1, { vol: 0.12, delay: 0.32 + i * 0.17, type: 'bandpass', from: 2500, to: 2500, q: 5 }); },
  ax_o3_tights: (a, T) => { a.noise(0.06, { vol: 0.2, type: 'highpass', from: 4000, to: 6000 }); up(T, 0.15); },
  ax_o3_dance: (a, T) => { beep(T, 0, 880, 0.05); beep(T, 0.12, 1175, 0.05); for (let i = 0; i < 4; i++) whoosh(a, 0.16 + i * 0.04, 0.12, 0.18, 2000, 5000); slap(a, 0.36, 0.3); },
  ax_o3_okaimono: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.04, { vol: 0.15, delay: i * 0.06, from: 900, to: 300 }); for (let i = 0; i < 6; i++) { slap(a, 0.3 + i * 0.09, 0.2); T(1760, 0.05, { vol: 0.04, type: 'square', delay: 0.3 + i * 0.09 }); } },
  // ── 社長
  ax_o3_tsuru: (a, T) => { T(1400, 0.4, { vol: 0.08, type: 'saw', slide: 900, delay: 0.1 }); T(1050, 0.35, { vol: 0.05, type: 'square', slide: 700, delay: 0.12 }); a.noise(0.4, { vol: 0.15, delay: 0.1, type: 'bandpass', from: 1600, to: 800, q: 2 }); },
  ax_o3_jet: (a, T) => { a.noise(0.8, { vol: 0.4, from: 300, to: 2400 }); T(120, 0.7, { vol: 0.1, type: 'saw', slide: 200 }); },
  ax_o3_meirei: (a, T) => { whoosh(a, 0, 0.3, 0.15, 300, 900); boom(a, T, 0.32, 0.5); T(1047, 0.3, { vol: 0.06, type: 'square', delay: 0.42 }); up(T, 0.5); },
  ax_o3_kabunushi: (a, T) => { for (let i = 0; i < 8; i++) a.noise(0.08, { vol: 0.1, delay: i * 0.05, type: 'bandpass', from: 600 + (i % 3) * 300, to: 900, q: 3 }); for (let i = 0; i < 3; i++) T(600 + i * 200, 0.1, { vol: 0.05, type: 'triangle', slide: 900 + i * 200, delay: 0.45 + i * 0.08 }); },
  ax_o3_baishu: (a, T) => { thud(a, T, 0.36, 0.4); T(400, 0.3, { vol: 0.05, type: 'sine', slide: 1600, delay: 0.42 }); coin(T, 0.6, 0.05); },
  ax_o3_oneman: (a, T) => { a.noise(0.1, { vol: 0.2, from: 800, to: 300 }); whoosh(a, 0.2, 0.2, 0.35); boom(a, T, 0.4, 0.55); },
  ax_o3_topdown: (a, T) => { T(1800, 0.45, { vol: 0.06, type: 'sine', slide: 300 }); boom(a, T, 0.46, 0.6); },
  ax_o3_daihoushutsu: (a, T) => { for (let i = 0; i < 6; i++) coin(T, 0.1 + i * 0.07, 0.035); fanfare(T, 0.46, 0.04); },
  // ── キャリア組
  ax_o3_seisaku: (a, T) => { a.noise(0.08, { vol: 0.12, type: 'highpass', from: 3000, to: 3000 }); pon(T, 0.36, 523, 0.1); clink(T, 0.42, 0.06); up(T, 0.52); },
  ax_o3_ronpa: (a, T) => { for (let i = 0; i < 3; i++) slap(a, 0.3 + i * 0.11, 0.35); a.noise(0.3, { vol: 0.35, delay: 0.58, type: 'highpass', from: 4000, to: 8000 }); T(3136, 0.2, { vol: 0.04, type: 'sine', delay: 0.6 }); },
  ax_o3_nemawashi: (a, T) => { a.noise(0.45, { vol: 0.15, type: 'bandpass', from: 300, to: 600, q: 1 }); a.noise(0.1, { vol: 0.25, delay: 0.52, from: 600, to: 200 }); T(150, 0.2, { vol: 0.1, type: 'saw', slide: 90, delay: 0.52 }); },
  ax_o3_kiki: (a, T) => { T(880, 0.25, { vol: 0.06, type: 'square' }); T(880, 0.25, { vol: 0.06, type: 'square', delay: 0.3 }); clink(T, 0.4, 0.07); a.noise(0.1, { vol: 0.3, delay: 0.4, type: 'highpass', from: 2000, to: 4000 }); },
  ax_o3_houkaisei: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.04, { vol: 0.15, delay: i * 0.06, type: 'highpass', from: 2000, to: 3000 }); whoosh(a, 0.44, 0.15, 0.3, 2000, 6000); },
  ax_o3_hakusho: (a, T) => { T(1400, 0.4, { vol: 0.05, type: 'sine', slide: 300 }); boom(a, T, 0.4, 0.55); a.noise(0.25, { vol: 0.15, delay: 0.5, type: 'highpass', from: 2000, to: 3000 }); },
  ax_o3_kaikaku: (a, T) => { whoosh(a, 0.1, 0.3, 0.25, 300, 1200); boom(a, T, 0.4, 0.6); pon(T, 0.7, 1320, 0.05); },
  ax_o3_yosan: (a, T) => { a.noise(0.06, { vol: 0.4, delay: 0.45, type: 'highpass', from: 3000, to: 7000 }); T(2637, 0.1, { vol: 0.05, type: 'square', delay: 0.45 }); for (let i = 0; i < 4; i++) coin(T, 0.56 + i * 0.05, 0.03); },
  // ── たたき上げ社長
  ax_o3_genba: (a, T) => { clink(T, 0, 0.04); whoosh(a, 0.15, 0.2, 0.3, 400, 1600); a.noise(0.3, { vol: 0.4, delay: 0.38, from: 1600, to: 200 }); thud(a, T, 0.38, 0.4); },
  ax_o3_doronko: (a, T) => { a.noise(0.15, { vol: 0.3, delay: 0.1, type: 'bandpass', from: 400, to: 200, q: 2 }); a.noise(0.35, { vol: 0.4, delay: 0.32, from: 600, to: 2600 }); heal(T, 0.5); },
  ax_o3_zensha: (a, T) => { a.noise(0.3, { vol: 0.15, type: 'bandpass', from: 500, to: 900, q: 1 }); arp(T, [392, 523, 659, 784], 0.07, { type: 'square', dur: 0.12, vol: 0.05, delay: 0.38 }); },
  ax_o3_satsutaba: (a, T) => { whoosh(a, 0, 0.3, 0.3, 400, 1600); slap(a, 0.34, 0.6); for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.08, delay: 0.45 + i * 0.07, type: 'highpass', from: 3000, to: 5000 }); },
  ax_o3_ryokou: (a, T) => { a.noise(0.5, { vol: 0.2, type: 'bandpass', from: 200, to: 400, q: 1 }); T(220, 0.3, { vol: 0.12, type: 'sine', delay: 0.5 }); heal(T, 0.56); },
  ax_o3_tatakiage: (a, T) => { for (let i = 0; i < 5; i++) pon(T, i * 0.06, 523 + i * 120, 0.06); T(1600, 0.2, { vol: 0.05, type: 'sine', slide: 400, delay: 0.3 }); boom(a, T, 0.46, 0.6); },
  ax_o3_shovelcar: (a, T) => { T(150, 0.6, { vol: 0.1, type: 'saw', slide: 260 }); a.noise(0.4, { vol: 0.25, delay: 0.1, type: 'bandpass', from: 400, to: 800, q: 2 }); a.noise(0.2, { vol: 0.4, delay: 0.6, type: 'highpass', from: 1500, to: 4000 }); rumble(a, 0.6, 0.2, 0.3); },
  // ── ブラックきぎょうの星
  ax_o3_kyujitsu: (a, T) => { slap(a, 0.08, 0.35); a.noise(0.3, { vol: 0.35, delay: 0.3, from: 600, to: 2400 }); beep(T, 0.48, 2000, 0.04); },
  ax_o3_tomari: (a, T) => { a.noise(0.2, { vol: 0.1, type: 'bandpass', from: 500, to: 300, q: 2 }); sleepy(T, 0.15); heal(T, 0.5); },
  ax_o3_norma: (a, T) => { T(200, 0.25, { vol: 0.08, type: 'square', slide: 800 }); a.noise(0.2, { vol: 0.4, delay: 0.26, type: 'highpass', from: 3000, to: 8000 }); boom(a, T, 0.45, 0.55); },
  ax_o3_zenin: (a, T) => { for (let i = 0; i < 8; i++) a.noise(0.05, { vol: 0.2, delay: i * 0.055, from: 900, to: 250 }); thud(a, T, 0.46, 0.45); },
  ax_o3_shimekiri: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.15, delay: i * 0.07, type: 'highpass', from: 2500, to: 3500 }); typing(a, 0.2, 6, 0.045); slap(a, 0.46, 0.6); boom(a, T, 0.48, 0.35); },
  // ── 合体技
  ax_o3_tsukin: (a, T) => { rumble(a, 0, 0.4, 0.3); pshh(a, 0.42, 0.3); a.noise(0.2, { vol: 0.25, delay: 0.62, type: 'bandpass', from: 400, to: 200, q: 2 }); },
  ax_o3_point10: (a, T) => { T(1568, 0.06, { vol: 0.06, type: 'square', delay: 0.06 }); T(2093, 0.1, { vol: 0.06, type: 'square', delay: 0.12 }); for (let i = 0; i < 5; i++) whoosh(a, 0.15 + i * 0.05, 0.12, 0.15, 2000, 5000); for (let i = 0; i < 4; i++) coin(T, 0.56 + i * 0.05, 0.035); },
  ax_o3_ogori: (a, T) => { fanfare(T, 0, 0.04); clink(T, 0.64, 0.07); clink(T, 0.68, 0.05); },
};
