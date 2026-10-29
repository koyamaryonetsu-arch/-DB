// 第51回 C1（o7）: 幻の職業（海賊王・伝説の超勇者・日の火影・天才しせつ管理者AI）の 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o7_' で はじめる。1つ 0.9びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o7_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur ?? 0.16, { vol: o.vol ?? 0.05, delay: (o.delay || 0) + i * gap, type: o.type || 'sine', slide: o.slide }));
const boom = (a, T, delay = 0, vol = 0.45) => { a.noise(0.6, { vol, delay, from: 1800, to: 50 }); T(90, 0.45, { vol: 0.16, delay, type: 'saw', slide: 40 }); };
const zap = (a, T, delay = 0, vol = 0.45) => { a.noise(0.06, { vol, delay, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.5, { vol: vol * 0.8, delay: delay + 0.04, from: 1200, to: 40 }); T(1600, 0.08, { vol: 0.05, delay, type: 'saw', slide: 300 }); };
const punch = (a, T, delay = 0, vol = 0.3) => { a.noise(0.05, { vol, delay, from: 1600, to: 300 }); T(160, 0.06, { vol: 0.08, delay, type: 'square', slide: 90 }); };
const laugh = (T, delay = 0, n = 6, f = 520, vol = 0.05) => { for (let i = 0; i < n; i++) T(f + (i % 2) * 90, 0.07, { vol, delay: delay + i * 0.09, type: 'square', slide: f - 120 }); };
const fire = (a, delay = 0, vol = 0.35) => { a.noise(0.5, { vol, delay, from: 500, to: 2600 }); a.noise(0.5, { vol, delay: delay + 0.2, from: 2400, to: 160 }); };
const beep = (T, fs, gap, delay = 0, vol = 0.045) => arp(T, fs, gap, { delay, vol, dur: gap * 0.85, type: 'square' });

export const SFX_AX_O7 = {
  // ── 海賊王 ──
  // ドドドドド（ゴムの こぶしの 連打）
  ax_o7_gatling: (a, T) => { for (let i = 0; i < 9; i++) punch(a, T, i * 0.07, 0.28); T(300, 0.3, { vol: 0.05, type: 'triangle', slide: 120 }); },
  // バサッ（旗）＋ ファンファーレ
  ax_o7_hata: (a, T) => { a.noise(0.25, { vol: 0.25, type: 'bandpass', from: 600, to: 1600, q: 1.5 }); arp(T, [523, 659, 784, 1047], 0.09, { vol: 0.05, type: 'saw', delay: 0.18, dur: 0.3 }); },
  // ワーッ（一味の かけ声）＋ ドーン
  ax_o7_ichimi: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.4 - i * 0.05, { vol: 0.16, delay: i * 0.05, type: 'bandpass', from: 700 + i * 300, to: 1300 + i * 200, q: 1.2 }); boom(a, T, 0.45, 0.4); },
  // ドンドットット ＋ ワハハ
  ax_o7_jiyuu: (a, T) => { [0, 0.12, 0.2, 0.28].forEach((d, i) => T(i ? 110 : 70, 0.12, { vol: 0.2, delay: d, type: 'sine', slide: 50 })); laugh(T, 0.35, 7, 480, 0.06); },
  // カンパーイ（コップ）＋ にぎやかな 音
  ax_o7_utage: (a, T) => { T(2093, 0.25, { vol: 0.06, type: 'sine' }); T(2637, 0.25, { vol: 0.05, delay: 0.03, type: 'sine' }); arp(T, [659, 784, 880, 1047, 880, 1047], 0.08, { vol: 0.045, type: 'pulse', delay: 0.15 }); laugh(T, 0.45, 4, 600, 0.04); },
  // ゴゴゴ（王の 気）
  ax_o7_haoh: (a, T) => { a.noise(0.8, { vol: 0.35, from: 240, to: 50 }); T(70, 0.7, { vol: 0.18, type: 'saw', slide: 55 }); a.noise(0.08, { vol: 0.35, delay: 0.3, type: 'highpass', from: 3000, to: 6000 }); },
  // ギュイーン → ドッカーン（太陽の こぶし）
  ax_o7_taiyou: (a, T) => { T(200, 0.5, { vol: 0.07, type: 'saw', slide: 900 }); boom(a, T, 0.55, 0.55); arp(T, [1047, 1319, 1568], 0.06, { vol: 0.04, delay: 0.6 }); },
  // 大船団（ボーッ ＋ 大ほう ＋ 笑い）
  ax_o7_fleet: (a, T) => { T(110, 0.5, { vol: 0.14, type: 'saw' }); T(165, 0.5, { vol: 0.08, type: 'saw' }); [0.5, 0.62, 0.74].forEach((d) => boom(a, T, d, 0.3)); laugh(T, 0.8, 4, 520, 0.04); },
  // ── 伝説の超勇者 ──
  // キィン ＋ バリバリ（雷の 剣）
  ax_o7_raiken: (a, T) => { T(3136, 0.3, { vol: 0.05, type: 'sine' }); a.noise(0.1, { vol: 0.4, delay: 0.05, type: 'highpass', from: 2500, to: 7000 }); zap(a, T, 0.3, 0.4); },
  // ハアアア…（気が もえあがる）
  ax_o7_kiup: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.18, { vol: 0.08 + i * 0.03, delay: i * 0.1, from: 300 + i * 150, to: 900 + i * 200 }); T(110, 0.6, { vol: 0.08, type: 'saw', slide: 260, attack: 0.5 }); },
  // ズバババ（雷の 輪）
  ax_o7_gigaslash: (a, T) => { a.noise(0.25, { vol: 0.4, type: 'highpass', from: 2000, to: 7000 }); zap(a, T, 0.25, 0.5); T(1200, 0.2, { vol: 0.05, delay: 0.25, type: 'saw', slide: 300 }); },
  // キラキラ（金の オーラ）
  ax_o7_aura: (a, T) => { arp(T, [784, 988, 1175, 1568, 1976, 2349], 0.06, { vol: 0.05, type: 'triangle' }); a.noise(0.4, { vol: 0.14, delay: 0.2, type: 'highpass', from: 3000, to: 6000 }); },
  // いのり（かねの 音）
  ax_o7_inori: (a, T) => { [1047, 1319, 1568, 2093].forEach((f, i) => T(f, 0.6, { vol: 0.05, delay: i * 0.1, type: 'sine' })); },
  // ゴロゴロ → ピシャーン
  ax_o7_gigadein: (a, T) => { a.noise(0.4, { vol: 0.2, from: 300, to: 120 }); zap(a, T, 0.45, 0.6); zap(a, T, 0.6, 0.35); },
  // バシバシバシ（雷の 連打）
  ax_o7_rengeki: (a, T) => { for (let i = 0; i < 7; i++) { punch(a, T, i * 0.08, 0.25); a.noise(0.03, { vol: 0.2, delay: i * 0.08, type: 'highpass', from: 4000, to: 4000 }); } },
  // かめはめデイン（ため → ドォォン ＋ バリバリ）
  ax_o7_kamedein: (a, T) => { T(160, 0.6, { vol: 0.08, type: 'saw', slide: 520, attack: 0.5 }); a.noise(0.6, { vol: 0.12, type: 'bandpass', from: 600, to: 2600, q: 2 }); a.noise(0.9, { vol: 0.5, delay: 0.62, from: 2400, to: 60 }); zap(a, T, 0.65, 0.4); zap(a, T, 0.8, 0.3); },
  // ── 日の火影 ──
  // ボン ボン ボン（分身が 出る けむり）
  ax_o7_bunshin: (a, T) => { for (let i = 0; i < 4; i++) { a.noise(0.15, { vol: 0.25, delay: i * 0.09, from: 900, to: 200 }); T(300 + i * 60, 0.06, { vol: 0.05, delay: i * 0.09, type: 'triangle' }); } },
  // ゴォッ ＋ ザン（炎の 太刀）
  ax_o7_kasha: (a, T) => { fire(a, 0, 0.3); for (let i = 0; i < 4; i++) a.noise(0.08, { vol: 0.35, delay: 0.3 + i * 0.08, type: 'highpass', from: 2500, to: 6000 }); },
  // ギュイイン（らせん丸）→ ドン
  ax_o7_rasen: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.2, { vol: 0.16, delay: i * 0.15, type: 'bandpass', from: 600 + i * 400, to: 2400, q: 5 }); boom(a, T, 0.55, 0.5); },
  // ヒュンヒュン（陽炎の 太刀）
  ax_o7_hirin: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.1, { vol: 0.25, delay: i * 0.07, type: 'bandpass', from: 1500, to: 4000, q: 3 }); fire(a, 0.4, 0.25); },
  // 意志（ひくい 太鼓 ＋ のぼる 音）
  ax_o7_ishi: (a, T) => { [0, 0.18].forEach((d) => T(80, 0.15, { vol: 0.22, delay: d, type: 'sine', slide: 50 })); arp(T, [440, 554, 659, 880], 0.09, { vol: 0.05, type: 'saw', delay: 0.3, dur: 0.25 }); },
  // ゴゴゴ → 大爆炎
  ax_o7_bijuu: (a, T) => { T(80, 0.7, { vol: 0.12, type: 'saw', slide: 160, attack: 0.5 }); boom(a, T, 0.75, 0.6); fire(a, 0.8, 0.3); },
  // ポウッ（あたたかい 結界）
  ax_o7_kekkai: (a, T) => { T(440, 0.5, { vol: 0.06, type: 'triangle', slide: 660 }); a.noise(0.5, { vol: 0.15, delay: 0.1, from: 400, to: 1400 }); arp(T, [880, 1109, 1319], 0.08, { vol: 0.04, delay: 0.3 }); },
  // 神楽（すずの 音 ＋ 炎）
  ax_o7_kagura: (a, T) => { for (let i = 0; i < 6; i++) T(2637 + (i % 2) * 300, 0.12, { vol: 0.035, delay: i * 0.1, type: 'sine' }); fire(a, 0.2, 0.3); for (let i = 0; i < 5; i++) a.noise(0.06, { vol: 0.25, delay: 0.5 + i * 0.07, type: 'highpass', from: 3000, to: 6000 }); },
  // ── 天才しせつ管理者AI ──
  // ピピピ ＋ スキャンの ブーン
  ax_o7_scan: (a, T) => { beep(T, [1568, 1760, 2093], 0.09); T(300, 0.5, { vol: 0.05, delay: 0.25, type: 'triangle', slide: 900 }); },
  // ウィーン ＋ 起動の 音
  ax_o7_mode: (a, T) => { T(200, 0.4, { vol: 0.06, type: 'saw', slide: 800 }); beep(T, [1047, 1319, 1568, 2093], 0.07, 0.35); },
  // ゴォー（空調）＋ キラッ
  ax_o7_aircon: (a, T) => { a.noise(0.7, { vol: 0.22, type: 'bandpass', from: 900, to: 600, q: 1 }); arp(T, [1319, 1760, 2093], 0.08, { vol: 0.04, delay: 0.4 }); },
  // カプセル ポン ポン
  ax_o7_pill: (a, T) => { for (let i = 0; i < 4; i++) T(700 + i * 120, 0.06, { vol: 0.06, delay: i * 0.09, type: 'square', slide: 1000 + i * 120 }); arp(T, [1568, 2093], 0.1, { vol: 0.04, delay: 0.45, dur: 0.3 }); },
  // ブーン → ピタッ（制御）
  ax_o7_demand: (a, T) => { T(500, 0.45, { vol: 0.06, type: 'saw', slide: 150 }); a.noise(0.05, { vol: 0.35, delay: 0.45, type: 'highpass', from: 2500, to: 6000 }); beep(T, [880, 660], 0.1, 0.5); },
  // ブブブ（ドローン）＋ ビビビ
  ax_o7_drone: (a, T) => { for (let i = 0; i < 6; i++) T(180 + (i % 2) * 20, 0.08, { vol: 0.05, delay: i * 0.06, type: 'saw' }); for (let i = 0; i < 6; i++) T(2400, 0.04, { vol: 0.04, delay: 0.35 + i * 0.06, type: 'square', slide: 1200 }); },
  // ピコーン ＋ 光
  ax_o7_hirameki: (a, T) => { T(1319, 0.08, { vol: 0.07, type: 'square' }); T(1976, 0.3, { vol: 0.06, delay: 0.08, type: 'square' }); a.noise(0.6, { vol: 0.2, delay: 0.4, type: 'highpass', from: 3000, to: 6000 }); },
  // 全館 完全最適化（起動音 ＋ 冷たい 風 ＋ チャイム）
  ax_o7_optimal: (a, T) => { beep(T, [784, 1047, 1319, 1568, 2093], 0.07); a.noise(0.6, { vol: 0.3, delay: 0.4, type: 'highpass', from: 5000, to: 7000 }); [523, 659, 784, 1047].forEach((f) => T(f, 0.4, { vol: 0.04, delay: 0.55, type: 'triangle' })); },
};
