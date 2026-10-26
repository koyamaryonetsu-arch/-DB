// 第49回 O1（剣・和・かげの 仕事）: もとからの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o1_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o1_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは O1 だけが さわる
// こまかい 音の ぶひん（d … おくれ びょう、v … 大きさ）
const zan = (a, T, d = 0, v = 1) => { a.noise(0.1, { vol: 0.42 * v, delay: d, type: 'highpass', from: 2600, to: 7000 }); a.noise(0.18, { vol: 0.28 * v, delay: d + 0.06, from: 3200, to: 300 }); T(1600, 0.08, { vol: 0.04 * v, delay: d, type: 'saw', slide: 500 }); };
const shu = (a, d = 0, v = 1) => a.noise(0.07, { vol: 0.32 * v, delay: d, type: 'highpass', from: 4000, to: 9000 });
const don = (a, T, d = 0, v = 1) => { a.noise(0.5, { vol: 0.5 * v, delay: d, from: 1600, to: 50 }); T(80, 0.35, { vol: 0.22 * v, delay: d, type: 'triangle', slide: 35 }); };
const chin = (T, d = 0, v = 1) => { T(2637, 0.4, { vol: 0.06 * v, delay: d, type: 'sine' }); T(3951, 0.3, { vol: 0.035 * v, delay: d + 0.01, type: 'sine' }); };
const kin = (a, T, d = 0, v = 1) => { T(1760, 0.18, { vol: 0.08 * v, delay: d, type: 'square', slide: 1500 }); T(2349, 0.25, { vol: 0.05 * v, delay: d, type: 'triangle' }); a.noise(0.08, { vol: 0.3 * v, delay: d, type: 'highpass', from: 3000, to: 6000 }); };
const gashan = (a, T, d = 0, v = 1) => { for (let i = 0; i < 5; i++) a.noise(0.06, { vol: 0.3 * v, delay: d + i * 0.035, type: 'highpass', from: 2500 + i * 600, to: 7000 }); T(1200, 0.2, { vol: 0.05 * v, delay: d, type: 'square', slide: 400 }); };
const fire = (a, d = 0, v = 1, dur = 0.4) => { a.noise(dur, { vol: 0.34 * v, delay: d, from: 500, to: 2800 }); a.noise(dur, { vol: 0.3 * v, delay: d + dur * 0.4, from: 2600, to: 160 }); };
const wind = (a, d = 0, v = 1, dur = 0.35) => a.noise(dur, { vol: 0.26 * v, delay: d, type: 'bandpass', from: 500, to: 2600, q: 4 });
const zap = (a, T, d = 0, v = 1) => { a.noise(0.08, { vol: 0.5 * v, delay: d, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.4, { vol: 0.35 * v, delay: d + 0.05, from: 900, to: 60 }); T(1800, 0.08, { vol: 0.05 * v, delay: d, type: 'saw', slide: 300 }); };
const bell = (T, notes, step = 0.06, d = 0, v = 1, type = 'sine') => notes.forEach((f, i) => T(f, 0.3, { vol: 0.05 * v, delay: d + i * step, type }));
const poof = (a, d = 0, v = 1) => { a.noise(0.3, { vol: 0.3 * v, delay: d, from: 1200, to: 200 }); };
const coin = (T, d = 0, v = 1) => { T(1976, 0.06, { vol: 0.06 * v, delay: d, type: 'square' }); T(2637, 0.2, { vol: 0.05 * v, delay: d + 0.05, type: 'square' }); };
const pip = (T, d = 0, f = 1800, v = 1) => T(f, 0.05, { vol: 0.06 * v, delay: d, type: 'square' });
const roar = (a, T, d = 0, v = 1) => { T(130, 0.5, { vol: 0.14 * v, delay: d, type: 'saw', slide: 180 }); a.noise(0.5, { vol: 0.3 * v, delay: d, type: 'bandpass', from: 400, to: 900, q: 1.5 }); };
const rise = (T, f0, f1, dur, d = 0, v = 1, type = 'triangle') => T(f0, dur, { vol: 0.06 * v, delay: d, type, slide: f1, attack: dur * 0.8 });
const ice = (a, T, d = 0, v = 1) => { a.noise(0.06, { vol: 0.35 * v, delay: d, type: 'highpass', from: 5000, to: 7000 }); [2349, 2637, 3136].forEach((f, i) => T(f, 0.18, { vol: 0.04 * v, delay: d + 0.04 + i * 0.05, type: 'triangle' })); };
const dark = (a, T, d = 0, v = 1) => { T(110, 0.45, { vol: 0.14 * v, delay: d, type: 'saw', slide: 70 }); a.noise(0.35, { vol: 0.22 * v, delay: d, type: 'bandpass', from: 300, to: 900, q: 2 }); };

// 1つの 音は 0.8びょう まで（おそく はじまる 音・ながい 音は みじかく する）
const MAX = 0.8;
const fit = (o, dur) => {
  o = o || {};
  const delay = Math.min(o.delay || 0, MAX - 0.06);
  return [Math.max(0.04, Math.min(dur, MAX - delay)), { ...o, delay }];
};
const clamp = (fn) => (a, T) => fn(
  { noise: (dur, o) => { const [d, oo] = fit(o, dur); return a.noise(d, oo); } },
  (f, dur, o) => { const [d, oo] = fit(o, dur); return T(f, d, oo); },
);

const RAW = {
  // ───── 戦士 ─────
  ax_o1_kabau: (a, T) => { a.noise(0.16, { vol: 0.3, from: 1800, to: 400 }); kin(a, T, 0.24, 1.2); T(330, 0.3, { vol: 0.08, delay: 0.26, type: 'triangle' }); },
  ax_o1_tame: (a, T) => { rise(T, 120, 300, 0.25); T(70, 0.15, { vol: 0.25, delay: 0.24, type: 'sine', slide: 45 }); T(70, 0.15, { vol: 0.2, delay: 0.42, type: 'sine', slide: 45 }); },
  ax_o1_kabuto: (a, T) => { wind(a, 0, 0.8, 0.15); kin(a, T, 0.2, 1.3); gashan(a, T, 0.24, 0.6); },
  ax_o1_majin: (a, T) => { T(90, 0.2, { vol: 0.12, type: 'saw', slide: 60 }); zan(a, T, 0.16, 1.3); don(a, T, 0.22, 1); },
  ax_o1_mai: (a, T) => { [0.02, 0.12, 0.22, 0.32].forEach((d) => shu(a, d, 1.1)); chin(T, 0.5, 1.2); },
  ax_o1_tamashii: (a, T) => { fire(a, 0, 0.7, 0.25); zan(a, T, 0.22, 1.2); don(a, T, 0.26, 1.3); },
  ax_o1_daichi: (a, T) => { don(a, T, 0.2, 1.2); for (let i = 0; i < 5; i++) a.noise(0.12, { vol: 0.25, delay: 0.3 + i * 0.08, from: 800, to: 120 }); },
  ax_o1_midare: (a, T) => { for (let i = 0; i < 4; i++) zan(a, T, 0.12 + i * 0.09, 0.7); chin(T, 0.55); },
  // ───── スパイ ─────
  ax_o1_knife: (a, T) => { a.noise(0.2, { vol: 0.24, type: 'bandpass', from: 2000, to: 4000, q: 3 }); kin(a, T, 0.2, 0.9); },
  ax_o1_hensou: (a, T) => { poof(a, 0, 1.2); bell(T, [988, 1319, 1760], 0.07, 0.2); T(2637, 0.2, { vol: 0.04, delay: 0.45, type: 'sine' }); },
  ax_o1_kimitsu: (a, T) => { shu(a, 0.1, 1.3); zan(a, T, 0.14, 0.7); a.noise(0.15, { vol: 0.14, delay: 0.32, type: 'bandpass', from: 1200, to: 2400, q: 2 }); },
  ax_o1_gas: (a, T) => { pip(T, 0, 2400); a.noise(0.6, { vol: 0.2, delay: 0.05, type: 'highpass', from: 3000, to: 5000 }); T(660, 0.4, { vol: 0.03, delay: 0.3, type: 'sine', slide: 440 }); },
  ax_o1_action: (a, T) => { T(220, 0.06, { vol: 0.15, type: 'square' }); wind(a, 0.05, 0.8, 0.2); [0.26, 0.36, 0.46].forEach((d) => { a.noise(0.08, { vol: 0.4, delay: d, from: 2400, to: 300 }); T(300, 0.06, { vol: 0.1, delay: d, type: 'square', slide: 140 }); }); },
  ax_o1_mission: (a, T) => { [0, 0.08, 0.16, 0.24].forEach((d) => pip(T, d, 1800)); pip(T, 0.32, 2600); zan(a, T, 0.34, 1.3); bell(T, [2093, 2637, 3136], 0.05, 0.55, 0.8); },
  ax_o1_pen: (a, T) => { pip(T, 0, 2400); for (let i = 0; i < 6; i++) a.noise(0.04, { vol: 0.25, delay: 0.18 + i * 0.05, type: 'highpass', from: 3000, to: 3000 }); T(900, 0.3, { vol: 0.04, delay: 0.18, type: 'saw', slide: 1200 }); },
  // ───── バトルマスター ─────
  ax_o1_moroba: (a, T) => { zan(a, T, 0.18, 1.3); a.noise(0.2, { vol: 0.2, delay: 0.3, type: 'bandpass', from: 1500, to: 600, q: 2 }); },
  ax_o1_musou: (a, T) => { zan(a, T, 0.12, 1); zan(a, T, 0.2, 1.1); kin(a, T, 0.22, 0.6); },
  ax_o1_otakebi: (a, T) => { roar(a, T, 0, 1.2); T(98, 0.6, { vol: 0.1, type: 'square', slide: 80, delay: 0.05 }); },
  ax_o1_tension: (a, T) => { fire(a, 0, 1, 0.3); T(196, 0.4, { vol: 0.08, delay: 0.1, type: 'saw', slide: 600 }); don(a, T, 0.26, 0.9); bell(T, [784, 1047, 1319], 0.05, 0.3); },
  ax_o1_hakai: (a, T) => { wind(a, 0, 1, 0.25); zan(a, T, 0.28, 1.4); gashan(a, T, 0.32, 1.2); don(a, T, 0.32, 1.1); },
  ax_o1_bakuretsu: (a, T) => { zan(a, T, 0.16, 1.2); [0.28, 0.38, 0.48].forEach((d) => don(a, T, d, 0.7)); },
  // ───── パラディン ─────
  ax_o1_daibougyo: (a, T) => { kin(a, T, 0.16, 1.3); T(523, 0.4, { vol: 0.06, delay: 0.2, type: 'triangle' }); bell(T, [1047, 1319], 0.08, 0.3, 0.7); },
  ax_o1_seiken: (a, T) => { bell(T, [1319, 1568, 2093], 0.05, 0); zan(a, T, 0.18, 1.1); },
  ax_o1_gcross: (a, T) => { rise(T, 800, 2400, 0.3, 0, 0.8, 'sine'); zan(a, T, 0.3, 1.1); bell(T, [1047, 1568, 2093], 0.06, 0.34); },
  ax_o1_aegis: (a, T) => { bell(T, [1047, 1319, 1568, 2093], 0.07, 0); T(523, 0.5, { vol: 0.07, delay: 0.32, type: 'sine' }); T(1047, 0.4, { vol: 0.04, delay: 0.32, type: 'sine' }); },
  ax_o1_judgment: (a, T) => { T(1600, 0.3, { vol: 0.05, type: 'sine', slide: 600 }); don(a, T, 0.3, 1.3); bell(T, [1568, 2093, 2637], 0.08, 0.45, 0.9); },
  // ───── 魔法戦士 ─────
  ax_o1_kaen: (a, T) => { fire(a, 0, 0.8, 0.2); zan(a, T, 0.2, 1.1); fire(a, 0.24, 0.6, 0.3); },
  ax_o1_hyouketsu: (a, T) => { ice(a, T, 0.18, 1.2); zan(a, T, 0.2, 0.8); ice(a, T, 0.36, 0.8); },
  ax_o1_inazuma: (a, T) => { zap(a, T, 0, 0.9); zan(a, T, 0.24, 1.1); for (let i = 0; i < 4; i++) a.noise(0.04, { vol: 0.2, delay: 0.34 + i * 0.06, type: 'highpass', from: 3000, to: 3000 }); },
  ax_o1_force: (a, T) => { for (let i = 0; i < 4; i++) T(2000 + i * 300, 0.05, { vol: 0.04, delay: i * 0.06, type: 'square' }); gashan(a, T, 0.28, 1.4); },
  // ───── 忍者 ─────
  ax_o1_shuriken: (a, T) => { [0, 0.06, 0.12].forEach((d) => shu(a, d)); [0.26, 0.34, 0.42].forEach((d) => kin(a, T, d, 0.6)); poof(a, 0.6, 0.6); },
  ax_o1_bunshin: (a, T) => { poof(a, 0, 1.3); T(440, 0.15, { vol: 0.05, delay: 0.2, type: 'triangle', slide: 660 }); T(440, 0.15, { vol: 0.05, delay: 0.34, type: 'triangle', slide: 660 }); },
  ax_o1_kagenui: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.3, delay: 0.1 + i * 0.05, from: 3000, to: 800 }); T(1200, 0.25, { vol: 0.05, delay: 0.36, type: 'sine', slide: 1000 }); },
  ax_o1_happou: (a, T) => { for (let i = 0; i < 8; i++) shu(a, i * 0.025, 0.8); for (let i = 0; i < 5; i++) kin(a, T, 0.32 + i * 0.06, 0.5); },
  // ───── サムライ ─────
  ax_o1_iai: (a, T) => { shu(a, 0.06, 1.4); zan(a, T, 0.1, 1.2); chin(T, 0.6, 1.3); },
  ax_o1_mineuchi: (a, T) => { a.noise(0.12, { vol: 0.5, delay: 0.2, from: 2400, to: 300 }); T(300, 0.12, { vol: 0.2, delay: 0.2, type: 'square', slide: 120 }); bell(T, [1568, 1760, 1568, 1760], 0.08, 0.38, 0.8, 'triangle'); },
  ax_o1_tsubame: (a, T) => { zan(a, T, 0.1, 1); T(1200, 0.2, { vol: 0.05, delay: 0.24, type: 'sine', slide: 2400 }); zan(a, T, 0.26, 0.8); },
  ax_o1_zeni: (a, T) => { a.noise(0.2, { vol: 0.2, type: 'bandpass', from: 3000, to: 5000, q: 2 }); for (let i = 0; i < 6; i++) coin(T, 0.3 + i * 0.07, 0.8); },
  ax_o1_ittou: (a, T) => { T(60, 0.25, { vol: 0.05, type: 'sine' }); zan(a, T, 0.28, 1.5); don(a, T, 0.3, 1.2); chin(T, 0.65); },
  ax_o1_shinkuu: (a, T) => { [0.1, 0.2, 0.3].forEach((d) => wind(a, d, 1, 0.25)); zan(a, T, 0.22, 0.8); },
  // ───── 殺し屋 ─────
  ax_o1_kyuusho: (a, T) => { shu(a, 0.04, 1.3); T(3136, 0.15, { vol: 0.06, delay: 0.1, type: 'square' }); chin(T, 0.14, 0.8); },
  ax_o1_kehai: (a, T) => { a.noise(0.6, { vol: 0.16, type: 'bandpass', from: 1600, to: 400, q: 2 }); T(440, 0.5, { vol: 0.03, type: 'sine', slide: 220 }); },
  ax_o1_dokubari: (a, T) => { pip(T, 0.08, 3200); T(2400, 0.06, { vol: 0.06, delay: 0.2, type: 'square' }); for (let i = 0; i < 4; i++) T(500 + i * 120, 0.06, { vol: 0.05, delay: 0.3 + i * 0.07, type: 'sine', slide: 800 }); },
  ax_o1_arashi: (a, T) => { T(2400, 0.3, { vol: 0.05, type: 'sine' }); for (let i = 0; i < 5; i++) kin(a, T, 0.3 + i * 0.07, 0.5); },
  ax_o1_hissatsu: (a, T) => { [0, 0.1, 0.2].forEach((d) => pip(T, d, 1400)); a.noise(0.2, { vol: 0.1, delay: 0.1, type: 'bandpass', from: 600, to: 300, q: 2 }); zan(a, T, 0.36, 1.5); don(a, T, 0.38, 0.9); },
  ax_o1_haigo: (a, T) => { poof(a, 0, 1); shu(a, 0.24, 1); zan(a, T, 0.32, 1.2); T(880, 0.12, { vol: 0.05, delay: 0.5, type: 'square', slide: 1320 }); },
  // ───── 魔剣士 ─────
  ax_o1_darkblade: (a, T) => { dark(a, T, 0, 1); zan(a, T, 0.24, 1.3); },
  ax_o1_soul: (a, T) => { dark(a, T, 0, 0.8); zan(a, T, 0.22, 1.1); T(880, 0.4, { vol: 0.04, delay: 0.38, type: 'sine', slide: 440 }); T(1320, 0.3, { vol: 0.03, delay: 0.46, type: 'sine', slide: 660 }); },
  ax_o1_jubaku: (a, T) => { zan(a, T, 0.2, 1.1); for (let i = 0; i < 8; i++) a.noise(0.04, { vol: 0.2, delay: 0.32 + i * 0.045, type: 'highpass', from: 2400, to: 5000 }); },
  ax_o1_ankoku: (a, T) => { T(70, 0.6, { vol: 0.16, type: 'saw', slide: 55 }); a.noise(0.5, { vol: 0.2, type: 'bandpass', from: 300, to: 700, q: 2 }); a.noise(0.15, { vol: 0.2, delay: 0.45, from: 1200, to: 200 }); },
  ax_o1_hades: (a, T) => { fire(a, 0, 0.8, 0.35); dark(a, T, 0.1, 0.8); zan(a, T, 0.38, 1.5); don(a, T, 0.4, 1.3); },
  ax_o1_yamijuuji: (a, T) => { zan(a, T, 0.16, 1.1); zan(a, T, 0.28, 1.1); don(a, T, 0.34, 1.3); dark(a, T, 0.36, 0.6); },
  // ───── ソードマスター ─────
  ax_o1_koumyou: (a, T) => { bell(T, [1568, 2093, 2637], 0.04, 0); zan(a, T, 0.22, 1.2); T(1047, 0.4, { vol: 0.05, delay: 0.3, type: 'sine', slide: 2093 }); },
  ax_o1_yoroi: (a, T) => { kin(a, T, 0.2, 1.4); gashan(a, T, 0.3, 1.4); don(a, T, 0.3, 0.8); },
  ax_o1_inochi: (a, T) => { dark(a, T, 0, 0.6); zan(a, T, 0.22, 1.2); for (let i = 0; i < 4; i++) T(600 + i * 200, 0.12, { vol: 0.04, delay: 0.36 + i * 0.06, type: 'sine' }); },
  ax_o1_raijin: (a, T) => { a.noise(0.25, { vol: 0.2, from: 200, to: 600 }); zap(a, T, 0.2, 1.3); zan(a, T, 0.32, 1.2); },
  ax_o1_zenken: (a, T) => { fire(a, 0.1, 0.5, 0.15); ice(a, T, 0.2, 0.7); zap(a, T, 0.3, 0.6); zan(a, T, 0.4, 1); chin(T, 0.6, 1.4); },
  ax_o1_sennotachi: (a, T) => { for (let i = 0; i < 10; i++) shu(a, 0.04 + i * 0.045, 0.9); chin(T, 0.62, 1.5); },
  // ───── 将軍 ─────
  ax_o1_gorei: (a, T) => { T(196, 0.6, { vol: 0.12, type: 'saw', slide: 220, attack: 0.2 }); T(294, 0.5, { vol: 0.06, delay: 0.1, type: 'square', slide: 330 }); don(a, T, 0.36, 0.7); },
  ax_o1_ikkiuchi: (a, T) => { a.noise(0.25, { vol: 0.22, from: 600, to: 2400 }); zan(a, T, 0.26, 1.4); don(a, T, 0.3, 0.8); },
  ax_o1_kagemusha: (a, T) => { a.noise(0.3, { vol: 0.14, type: 'bandpass', from: 2000, to: 800, q: 3 }); a.noise(0.3, { vol: 0.14, delay: 0.3, type: 'bandpass', from: 2000, to: 800, q: 3 }); T(330, 0.4, { vol: 0.03, delay: 0.2, type: 'sine' }); },
  ax_o1_oniwaban: (a, T) => { a.noise(0.15, { vol: 0.25, type: 'bandpass', from: 1500, to: 600, q: 1 }); for (let i = 0; i < 4; i++) shu(a, 0.28 + i * 0.08, 1); poof(a, 0.66, 0.7); },
  ax_o1_gunbai: (a, T) => { a.noise(0.18, { vol: 0.3, type: 'bandpass', from: 600, to: 1600, q: 1.2 }); [0, 0.1, 0.2, 0.3, 0.4].forEach((d) => pip(T, 0.3 + d * 0.6, 2400, 0.6)); bell(T, [1047, 1319, 1568], 0.06, 0.45); },
  ax_o1_tenka: (a, T) => { T(2400, 0.04, { vol: 0.1, type: 'square' }); bell(T, [1568, 2093], 0.06, 0.06); zan(a, T, 0.4, 1.5); don(a, T, 0.42, 1.4); },
  ax_o1_touitsu: (a, T) => { a.noise(0.12, { vol: 0.3, from: 3000, to: 900 }); bell(T, [523, 659, 784, 1047, 1319, 1568], 0.06, 0.2, 1.1); },
  // ───── 掛け合わせ技 ─────
  ax_o1_mahouken: (a, T) => { T(400, 0.25, { vol: 0.05, type: 'saw', slide: 1200 }); zan(a, T, 0.24, 1.3); a.noise(0.3, { vol: 0.25, delay: 0.3, from: 2400, to: 300 }); },
  ax_o1_senka: (a, T) => { T(660, 0.25, { vol: 0.05, type: 'sine', slide: 990 }); don(a, T, 0.24, 1); bell(T, [1319, 1760, 2349, 2637], 0.05, 0.3); },
  ax_o1_kaensenpu: (a, T) => { fire(a, 0, 0.8, 0.25); for (let i = 0; i < 4; i++) a.noise(0.18, { vol: 0.24, delay: 0.2 + i * 0.1, from: 400 + i * 300, to: 2600 }); },
  ax_o1_niou: (a, T) => { don(a, T, 0.18, 1.2); kin(a, T, 0.22, 0.8); T(392, 0.4, { vol: 0.06, delay: 0.24, type: 'triangle' }); },
  ax_o1_iyashimai: (a, T) => { bell(T, [784, 988, 1175, 1568, 1976], 0.08, 0); a.noise(0.5, { vol: 0.1, delay: 0.1, type: 'highpass', from: 4000, to: 7000 }); },
  ax_o1_hayate: (a, T) => { wind(a, 0, 1.2, 0.15); a.noise(0.08, { vol: 0.5, delay: 0.1, from: 2400, to: 300 }); T(320, 0.08, { vol: 0.15, delay: 0.1, type: 'square', slide: 160 }); wind(a, 0.16, 0.7, 0.3); },
  ax_o1_madoromi: (a, T) => { [523, 659, 587, 523, 440].forEach((f, i) => T(f, 0.2, { vol: 0.05, delay: i * 0.13, type: 'sine' })); },
  ax_o1_medoro: (a, T) => { fire(a, 0, 0.5, 0.15); ice(a, T, 0.1, 0.8); T(600, 0.3, { vol: 0.06, delay: 0.2, type: 'saw', slide: 2400 }); a.noise(0.4, { vol: 0.45, delay: 0.44, from: 2000, to: 60 }); },
  // ───── 合体技 ─────
  ax_o1_xmahouken: (a, T) => { T(400, 0.35, { vol: 0.05, type: 'saw', slide: 1600 }); zan(a, T, 0.5, 1.2); zan(a, T, 0.58, 1.2); don(a, T, 0.62, 1); },
  ax_o1_xbreak: (a, T) => { [0.1, 0.2, 0.3, 0.4].forEach((d, i) => (i % 2 ? a.noise(0.08, { vol: 0.4, delay: d, from: 2400, to: 300 }) : zan(a, T, d, 0.8))); don(a, T, 0.56, 1.3); },
  ax_o1_hannin: (a, T) => { T(300, 0.06, { vol: 0.12, delay: 0.1, type: 'square' }); [392, 523, 659, 784].forEach((f, i) => T(f, 0.25, { vol: 0.07, delay: 0.25 + i * 0.05, type: 'pulse' })); gashan(a, T, 0.55, 1); },
  ax_o1_nichirin: (a, T) => { fire(a, 0, 1, 0.4); zan(a, T, 0.6, 1.4); fire(a, 0.62, 0.8, 0.18); },
  ax_o1_rival: (a, T) => { a.noise(0.25, { vol: 0.2, from: 800, to: 2400 }); kin(a, T, 0.44, 1.5); zan(a, T, 0.46, 1); },
  ax_o1_ikazuchi: (a, T) => { zap(a, T, 0.1, 1.3); zan(a, T, 0.55, 1.2); },
  ax_o1_delta: (a, T) => { [0.1, 0.26, 0.42].forEach((d, i) => T(1568 + i * 400, 0.2, { vol: 0.06, delay: d, type: 'square' })); don(a, T, 0.74, 1.5); },
  ax_o1_sanken: (a, T) => { [0.2, 0.32, 0.44].forEach((d, i) => zan(a, T, d, 0.9 + i * 0.1)); chin(T, 0.6, 1.4); },
  ax_o1_finale: (a, T) => { rise(T, 400, 1600, 0.5, 0, 1, 'saw'); bell(T, [1047, 1319, 1568, 2093], 0.05, 0.2); don(a, T, 0.74, 1.6); },
  ax_o1_nazo: (a, T) => { [0, 0.1, 0.2, 0.3].forEach((d) => shu(a, d, 0.8)); T(1047, 0.15, { vol: 0.06, delay: 0.5, type: 'square' }); T(1568, 0.3, { vol: 0.07, delay: 0.6, type: 'square' }); },
};

export const SFX_AX_O1 = Object.fromEntries(Object.entries(RAW).map(([id, fn]) => [id, clamp(fn)]));
