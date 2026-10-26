// 第49回 O4（町の 仕事・乗り物・設備・スポーツ）: もとからの 技の 音（sfx-ax.js が まぜる）。なまえは 'ax_o4_' で はじめる。1つ 0.8びょう まで
// 書きかたは sfx-ax.js と おなじ: ax_o4_〜: (a, T) => { a.noise(…); T(f, dur, { vol, type, slide, delay }); }
// この ファイルは O4 だけが さわる
// ドン
const don = (a, T, d = 0, v = 0.45) => { a.noise(0.3, { vol: v, delay: d, from: 1600, to: 50 }); T(85, 0.28, { vol: 0.2, type: 'triangle', slide: 40, delay: d }); };
// ピコン（○）
const pikon = (T, d = 0, v = 0.06) => { T(1319, 0.08, { vol: v, type: 'square', delay: d }); T(1976, 0.18, { vol: v, type: 'square', delay: d + 0.08 }); };
// キラーン
const kira = (T, d = 0, v = 0.05) => [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.22, { vol: v, type: 'sine', delay: d + i * 0.05 }));
// ガタン
const gatan = (a, d = 0, v = 0.3) => { a.noise(0.07, { vol: v, delay: d, from: 900, to: 200 }); a.noise(0.07, { vol: v * 0.8, delay: d + 0.11, from: 800, to: 150 }); };
// ゴォォ（はしる 風）
const gou = (a, dur = 0.5, d = 0, v = 0.35) => a.noise(dur, { vol: v, delay: d, type: 'bandpass', from: 300, to: 1400, q: 0.7 });
// カキーン
const kakiin = (a, T, d = 0, v = 0.08) => { a.noise(0.04, { vol: 0.4, delay: d, type: 'highpass', from: 3000, to: 3000 }); T(2093, 0.4, { vol: v, type: 'sine', delay: d }); T(3136, 0.3, { vol: v * 0.6, type: 'sine', delay: d + 0.01 }); };
// ズバン（ミット）
const zuban = (a, T, d = 0) => { a.noise(0.06, { vol: 0.45, delay: d, type: 'highpass', from: 1500, to: 1500 }); a.noise(0.18, { vol: 0.35, delay: d + 0.02, from: 1200, to: 100 }); };
// シュッ（風を きる）
const shu = (a, d = 0, v = 0.3) => a.noise(0.14, { vol: v, delay: d, type: 'bandpass', from: 1500, to: 4500, q: 1.5 });
// パーン（花火）
const paan = (a, T, d = 0) => { a.noise(0.05, { vol: 0.4, delay: d, type: 'highpass', from: 2500, to: 2500 }); a.noise(0.5, { vol: 0.2, delay: d + 0.05, type: 'highpass', from: 3000, to: 6000 }); };
// ジャー（水）
const jaa = (a, dur = 0.6, d = 0, v = 0.35) => { a.noise(dur, { vol: v, delay: d, type: 'highpass', from: 1500, to: 3500 }); a.noise(dur * 0.8, { vol: v * 0.5, delay: d + 0.05, type: 'bandpass', from: 600, to: 900, q: 1 }); };
// ブォォン（機械）
const buon = (T, dur = 0.5, d = 0, f = 90, v = 0.1) => { T(f, dur, { vol: v, type: 'saw', slide: f * 1.6, delay: d, attack: dur * 0.4 }); T(f * 2, dur, { vol: v * 0.5, type: 'square', slide: f * 3, delay: d, attack: dur * 0.4 }); };
// ソヨソヨ（すずしい 風）
const soyo = (a, dur = 0.6, d = 0, v = 0.18) => { a.noise(dur * 0.5, { vol: v, delay: d, type: 'bandpass', from: 1200, to: 2400, q: 2 }); a.noise(dur * 0.5, { vol: v, delay: d + dur * 0.45, type: 'bandpass', from: 2000, to: 900, q: 2 }); };
// ピッ
const pi = (T, d = 0, f = 2093, v = 0.06) => T(f, 0.06, { vol: v, type: 'square', delay: d });
// サイレンの ウー
const uu = (T, d = 0, v = 0.05) => { T(660, 0.35, { vol: v, type: 'saw', slide: 990, delay: d }); T(990, 0.35, { vol: v, type: 'saw', slide: 660, delay: d + 0.35 }); };
const arp = (T, fs, gap, o = {}) => fs.forEach((f, i) => T(f, o.dur || 0.12, { vol: o.vol || 0.06, type: o.type || 'square', delay: (o.delay || 0) + i * gap }));

export const SFX_AX_O4 = {
  // ── 鉄道員・運転士
  ax_o4_yoshi: (a, T) => { a.noise(0.05, { vol: 0.25, type: 'highpass', from: 4000, to: 6000 }); pikon(T, 0.15); },
  ax_o4_bell: (a, T) => { for (let i = 0; i < 8; i++) T(2400, 0.05, { vol: 0.05, type: 'square', delay: i * 0.05 }); pi(T, 0.45, 1568, 0.07); },
  ax_o4_announce: (a, T) => { T(1319, 0.3, { vol: 0.07, type: 'sine' }); T(1047, 0.4, { vol: 0.07, type: 'sine', delay: 0.25 }); T(880, 0.12, { vol: 0.05, type: 'triangle', delay: 0.55 }); },
  ax_o4_brake: (a, T) => { T(3200, 0.6, { vol: 0.07, type: 'saw', slide: 2600 }); a.noise(0.6, { vol: 0.25, type: 'highpass', from: 4000, to: 3000 }); gatan(a, 0.5, 0.3); },
  ax_o4_teikoku: (a, T) => { T(1800, 0.04, { vol: 0.08, type: 'square' }); gatan(a, 0.15, 0.35); don(a, T, 0.22, 0.35); },
  ax_o4_kaisou: (a, T) => { gatan(a, 0, 0.3); gatan(a, 0.22, 0.3); a.noise(0.25, { vol: 0.3, delay: 0.42, type: 'highpass', from: 2000, to: 5000 }); },
  ax_o4_shinkansen: (a, T) => { gou(a, 0.35, 0, 0.4); T(220, 0.3, { vol: 0.06, type: 'saw', slide: 880 }); don(a, T, 0.2, 0.5); },
  ax_o4_shuuden: (a, T) => { T(392, 0.4, { vol: 0.08, type: 'saw' }); T(494, 0.4, { vol: 0.06, type: 'saw' }); gou(a, 0.3, 0.1, 0.35); don(a, T, 0.28, 0.45); don(a, T, 0.4, 0.35); },
  ax_o4_anzen: (a, T) => { for (let i = 0; i < 4; i++) pikon(T, i * 0.09, 0.05); },
  ax_o4_tokkyu: (a, T) => { shu(a, 0, 0.45); T(600, 0.15, { vol: 0.05, type: 'saw', slide: 1800 }); don(a, T, 0.18, 0.45); },
  ax_o4_horn: (a, T) => { T(370, 0.7, { vol: 0.1, type: 'saw' }); T(466, 0.7, { vol: 0.08, type: 'saw' }); T(554, 0.6, { vol: 0.05, type: 'square' }); },
  ax_o4_tsuuka: (a, T) => { gatan(a, 0, 0.25); gou(a, 0.3, 0.08, 0.4); don(a, T, 0.24, 0.4); },
  ax_o4_renketsu: (a, T) => { for (let i = 0; i < 4; i++) { a.noise(0.06, { vol: 0.4, delay: i * 0.1, from: 3000, to: 400 }); T(900, 0.04, { vol: 0.05, type: 'square', delay: i * 0.1 }); } don(a, T, 0.42, 0.45); },
  ax_o4_saikou: (a, T) => { T(300, 0.35, { vol: 0.07, type: 'saw', slide: 2400 }); gou(a, 0.4, 0.2, 0.45); don(a, T, 0.36, 0.55); },
  ax_o4_kaisoku: (a, T) => { gatan(a, 0, 0.25); gatan(a, 0.18, 0.25); gou(a, 0.3, 0.3, 0.4); don(a, T, 0.42, 0.4); },
  ax_o4_anzen_unten: (a, T) => { pi(T, 0, 1760); T(2637, 0.3, { vol: 0.05, type: 'sine', delay: 0.12 }); T(1319, 0.3, { vol: 0.05, type: 'sine', delay: 0.2 }); },
  // ── 野球
  ax_o4_bunt: (a, T) => { a.noise(0.04, { vol: 0.3, type: 'highpass', from: 2500, to: 2500 }); T(880, 0.08, { vol: 0.06, type: 'triangle' }); },
  ax_o4_fastball: (a, T) => { shu(a, 0, 0.35); zuban(a, T, 0.22); },
  ax_o4_tourui: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.05, { vol: 0.2, delay: i * 0.07, from: 1200, to: 300 }); a.noise(0.3, { vol: 0.3, delay: 0.3, type: 'bandpass', from: 900, to: 300, q: 0.8 }); },
  ax_o4_ouen: (a, T) => { arp(T, [784, 784, 880, 988, 784], 0.1, { type: 'square', vol: 0.05, dur: 0.09 }); a.noise(0.4, { vol: 0.12, delay: 0.2, type: 'bandpass', from: 800, to: 1600, q: 0.5 }); },
  ax_o4_slide: (a, T) => { a.noise(0.35, { vol: 0.3, type: 'bandpass', from: 700, to: 250, q: 0.8 }); don(a, T, 0.3, 0.4); },
  ax_o4_homerun: (a, T) => { kakiin(a, T, 0.05); paan(a, T, 0.45); },
  ax_o4_keien: (a, T) => { for (let i = 0; i < 4; i++) { T(523, 0.08, { vol: 0.05, type: 'triangle', delay: i * 0.12 }); a.noise(0.04, { vol: 0.15, delay: i * 0.12 + 0.06, from: 1500, to: 300 }); } },
  ax_o4_sayonara: (a, T) => { kakiin(a, T, 0, 0.09); a.noise(0.6, { vol: 0.18, delay: 0.2, type: 'bandpass', from: 700, to: 1500, q: 0.4 }); paan(a, T, 0.4); },
  ax_o4_nagashi: (a, T) => { a.noise(0.04, { vol: 0.35, type: 'highpass', from: 3000, to: 3000 }); T(1760, 0.2, { vol: 0.06, type: 'sine' }); T(1200, 0.4, { vol: 0.04, type: 'sine', slide: 2400, delay: 0.1 }); },
  ax_o4_makyuu: (a, T) => { T(500, 0.4, { vol: 0.05, type: 'sine', slide: 700 }); T(700, 0.4, { vol: 0.03, type: 'sine', slide: 450, delay: 0.1 }); zuban(a, T, 0.42); },
  ax_o4_160: (a, T) => { T(400, 0.2, { vol: 0.07, type: 'saw', slide: 2000 }); shu(a, 0.02, 0.45); zuban(a, T, 0.2); don(a, T, 0.24, 0.4); },
  ax_o4_sweeper: (a, T) => { a.noise(0.4, { vol: 0.3, type: 'bandpass', from: 2400, to: 700, q: 3 }); zuban(a, T, 0.36); },
  ax_o4_challenge: (a, T) => { for (let i = 0; i < 5; i++) T(1800 - i * 200, 0.06, { vol: 0.04, type: 'square', delay: i * 0.05 }); pikon(T, 0.38, 0.07); },
  ax_o4_grandslam: (a, T) => { for (let i = 0; i < 4; i++) kakiin(a, T, i * 0.11, 0.05); paan(a, T, 0.5); },
  ax_o4_fanfare: (a, T) => { arp(T, [523, 659, 784, 1047, 1047], 0.09, { type: 'square', vol: 0.06, dur: 0.12 }); paan(a, T, 0.4); },
  ax_o4_jougai: (a, T) => { kakiin(a, T, 0, 0.1); T(1760, 0.4, { vol: 0.04, type: 'sine', slide: 3200, delay: 0.1 }); don(a, T, 0.6, 0.5); },
  // ── 地方公務員・国家公務員
  ax_o4_madoguchi: (a, T) => { pi(T, 0, 1568); a.noise(0.06, { vol: 0.3, delay: 0.25, from: 1500, to: 300 }); },
  ax_o4_bousai: (a, T) => { T(500, 0.3, { vol: 0.05, type: 'saw', slide: 800 }); T(800, 0.2, { vol: 0.04, type: 'saw', slide: 500, delay: 0.3 }); T(988, 0.12, { vol: 0.06, type: 'triangle', delay: 0.45 }); },
  ax_o4_josetsu: (a, T) => { a.noise(0.08, { vol: 0.3, type: 'bandpass', from: 3000, to: 1500, q: 2 }); a.noise(0.3, { vol: 0.4, delay: 0.25, from: 900, to: 120 }); T(2637, 0.2, { vol: 0.03, type: 'sine', delay: 0.35 }); },
  ax_o4_jumin: (a, T) => { T(659, 0.15, { vol: 0.05, type: 'sine' }); T(523, 0.3, { vol: 0.05, type: 'sine', delay: 0.15 }); kira(T, 0.3, 0.03); },
  ax_o4_tsuukou: (a, T) => { a.noise(0.12, { vol: 0.45, from: 2500, to: 200 }); pi(T, 0.2, 1760); pi(T, 0.3, 1760); },
  ax_o4_yuru: (a, T) => { [0, 0.12, 0.24].forEach((d) => T(600, 0.07, { vol: 0.05, type: 'triangle', slide: 900, delay: d })); T(1319, 0.25, { vol: 0.05, type: 'sine', slide: 1760, delay: 0.38 }); },
  ax_o4_takidashi: (a, T) => { for (let i = 0; i < 5; i++) T(180 + i * 20, 0.06, { vol: 0.05, type: 'sine', delay: i * 0.06 }); kira(T, 0.32, 0.03); },
  ax_o4_shorui: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.06, { vol: 0.15, delay: i * 0.08, type: 'highpass', from: 2000, to: 4000 }); a.noise(0.4, { vol: 0.4, delay: 0.32, type: 'bandpass', from: 1800, to: 300, q: 0.6 }); },
  ax_o4_kouhou: (a, T) => { arp(T, [784, 988, 1175, 1568], 0.1, { type: 'sine', vol: 0.05, dur: 0.12 }); T(110, 0.4, { vol: 0.08, type: 'saw', slide: 90, delay: 0.3 }); },
  ax_o4_matsuri: (a, T) => { don(a, T, 0, 0.35); don(a, T, 0.2, 0.35); arp(T, [880, 988, 1175], 0.08, { type: 'triangle', vol: 0.05, delay: 0.4 }); },
  ax_o4_yuki: (a, T) => { for (let i = 0; i < 5; i++) a.noise(0.12, { vol: 0.28, delay: i * 0.1, from: 1200, to: 150 }); },
  ax_o4_kairan: (a, T) => { a.noise(0.04, { vol: 0.2, from: 1500, to: 400 }); a.noise(0.04, { vol: 0.2, delay: 0.1, from: 1500, to: 400 }); T(988, 0.1, { vol: 0.05, type: 'triangle', delay: 0.3 }); T(1319, 0.1, { vol: 0.05, type: 'triangle', delay: 0.4 }); },
  ax_o4_houritsu: (a, T) => { a.noise(0.15, { vol: 0.3, type: 'bandpass', from: 2000, to: 800, q: 1 }); kira(T, 0.2, 0.04); a.noise(0.06, { vol: 0.35, delay: 0.5, from: 1200, to: 200 }); },
  ax_o4_roppou: (a, T) => { shu(a, 0, 0.3); don(a, T, 0.25, 0.5); },
  ax_o4_yosan: (a, T) => { for (let i = 0; i < 6; i++) T(2400 + (i % 3) * 300, 0.05, { vol: 0.04, type: 'square', delay: i * 0.05 }); pikon(T, 0.38, 0.05); },
  ax_o4_kisha: (a, T) => { for (let i = 0; i < 6; i++) { a.noise(0.04, { vol: 0.35, delay: i * 0.09, type: 'highpass', from: 3000, to: 5000 }); T(3000, 0.03, { vol: 0.04, type: 'square', delay: i * 0.09 + 0.02 }); } },
  ax_o4_hanko: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.07, { vol: 0.35, delay: i * 0.12, from: 1200, to: 150 }); don(a, T, 0.5, 0.4); },
  ax_o4_project: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.06, { vol: 0.18, delay: i * 0.08, type: 'bandpass', from: 2400, to: 3600, q: 2 }); kira(T, 0.4, 0.05); },
  ax_o4_touben: (a, T) => { T(160, 0.75, { vol: 0.06, type: 'saw', slide: 150 }); T(320, 0.7, { vol: 0.03, type: 'square', slide: 300 }); },
  // ── 警察官
  ax_o4_taiho: (a, T) => { shu(a, 0, 0.25); a.noise(0.06, { vol: 0.45, delay: 0.32, type: 'highpass', from: 2500, to: 2500 }); T(1400, 0.08, { vol: 0.06, type: 'square', delay: 0.33 }); },
  ax_o4_keibou: (a, T) => { a.noise(0.1, { vol: 0.45, from: 2400, to: 200 }); for (let i = 0; i < 4; i++) a.noise(0.03, { vol: 0.15, delay: 0.12 + i * 0.05, type: 'highpass', from: 4000, to: 4000 }); },
  ax_o4_shokumu: (a, T) => { T(2000, 0.03, { vol: 0.06, type: 'square' }); a.noise(0.25, { vol: 0.15, delay: 0.3, type: 'bandpass', from: 2000, to: 3000, q: 2 }); T(660, 0.15, { vol: 0.05, type: 'triangle', slide: 990, delay: 0.5 }); },
  ax_o4_pipi: (a, T) => { T(2900, 0.12, { vol: 0.07, type: 'square' }); T(2900, 0.4, { vol: 0.07, type: 'square', delay: 0.16 }); },
  ax_o4_seigi: (a, T) => { kira(T, 0, 0.05); a.noise(0.12, { vol: 0.4, delay: 0.2, type: 'highpass', from: 2000, to: 6000 }); don(a, T, 0.3, 0.5); },
  ax_o4_sasumata: (a, T) => { a.noise(0.15, { vol: 0.3, from: 900, to: 200 }); a.noise(0.06, { vol: 0.4, delay: 0.32, type: 'highpass', from: 1500, to: 1500 }); T(220, 0.15, { vol: 0.08, type: 'square', delay: 0.33 }); },
  // ── 消防士
  ax_o4_housui: (a, T) => { jaa(a, 0.7, 0, 0.4); },
  ax_o4_teate: (a, T) => { a.noise(0.05, { vol: 0.2, type: 'highpass', from: 3000, to: 3000 }); T(880, 0.1, { vol: 0.05, type: 'triangle', delay: 0.3 }); kira(T, 0.35, 0.03); },
  ax_o4_kyujo: (a, T) => { a.noise(0.3, { vol: 0.15, type: 'bandpass', from: 1500, to: 600, q: 2 }); T(392, 0.1, { vol: 0.06, type: 'square', delay: 0.4 }); kira(T, 0.45, 0.05); },
  ax_o4_hyoshigi: (a, T) => { for (const d of [0, 0.3]) { T(2200, 0.05, { vol: 0.12, type: 'square', delay: d }); a.noise(0.05, { vol: 0.3, delay: d, type: 'bandpass', from: 2500, to: 2500, q: 3 }); } },
  ax_o4_hashigo: (a, T) => { T(200, 0.35, { vol: 0.06, type: 'saw', slide: 500 }); shu(a, 0.3, 0.4); don(a, T, 0.4, 0.45); },
  ax_o4_issei: (a, T) => { uu(T, 0, 0.04); jaa(a, 0.6, 0.15, 0.45); },
  ax_o4_shoukaki: (a, T) => { a.noise(0.75, { vol: 0.35, type: 'highpass', from: 4000, to: 2500 }); },
  // ── 設備屋・ryonetsu・天才しせつ管理者
  ax_o4_spanner: (a, T) => { shu(a, 0, 0.25); a.noise(0.06, { vol: 0.45, delay: 0.28, type: 'highpass', from: 1800, to: 1800 }); T(2200, 0.25, { vol: 0.05, type: 'triangle', delay: 0.3 }); for (let i = 0; i < 3; i++) T(3000 - i * 400, 0.05, { vol: 0.04, type: 'square', delay: 0.45 + i * 0.08 }); },
  ax_o4_tenken: (a, T) => { for (let i = 0; i < 3; i++) pi(T, 0.1 + i * 0.1, 2093); pikon(T, 0.42, 0.05); },
  ax_o4_haikan: (a, T) => { for (let i = 0; i < 3; i++) a.noise(0.04, { vol: 0.2, delay: i * 0.08, type: 'highpass', from: 3000, to: 3000 }); for (let i = 0; i < 4; i++) T(300 + i * 60, 0.08, { vol: 0.05, type: 'sine', slide: 500 + i * 60, delay: 0.32 + i * 0.07 }); },
  ax_o4_shiunten: (a, T) => { T(1800, 0.03, { vol: 0.1, type: 'square' }); buon(T, 0.6, 0.08, 70, 0.08); },
  ax_o4_duct: (a, T) => { a.noise(0.35, { vol: 0.35, type: 'bandpass', from: 400, to: 900, q: 0.6 }); T(700, 0.12, { vol: 0.06, type: 'triangle', slide: 1400, delay: 0.4 }); a.noise(0.15, { vol: 0.3, delay: 0.5, type: 'bandpass', from: 2400, to: 900, q: 1 }); },
  ax_o4_kouji: (a, T) => { T(150, 0.35, { vol: 0.07, type: 'saw', slide: 300 }); don(a, T, 0.38, 0.55); a.noise(0.3, { vol: 0.25, delay: 0.42, type: 'highpass', from: 2000, to: 4000 }); },
  ax_o4_shinkuu: (a, T) => { buon(T, 0.4, 0, 110, 0.06); a.noise(0.35, { vol: 0.3, delay: 0.15, type: 'bandpass', from: 3000, to: 400, q: 1.5 }); don(a, T, 0.5, 0.45); },
  ax_o4_yuka: (a, T) => { T(392, 0.4, { vol: 0.05, type: 'sine' }); T(523, 0.4, { vol: 0.04, type: 'sine', delay: 0.15 }); kira(T, 0.35, 0.03); },
  ax_o4_koushin: (a, T) => { a.noise(0.05, { vol: 0.25, type: 'highpass', from: 3000, to: 3000 }); pi(T, 0.2, 2093, 0.07); soyo(a, 0.5, 0.3, 0.2); },
  ax_o4_chiller: (a, T) => { buon(T, 0.45, 0, 60, 0.09); a.noise(0.4, { vol: 0.25, delay: 0.25, type: 'highpass', from: 2500, to: 5000 }); [2637, 3136, 2349].forEach((f, i) => T(f, 0.1, { vol: 0.04, type: 'sine', delay: 0.45 + i * 0.07 })); },
  ax_o4_kanki: (a, T) => { a.noise(0.12, { vol: 0.25, from: 1200, to: 400 }); soyo(a, 0.6, 0.15, 0.22); },
  ax_o4_shoene: (a, T) => { T(2000, 0.03, { vol: 0.08, type: 'square' }); T(1568, 0.3, { vol: 0.05, type: 'sine', delay: 0.15 }); kira(T, 0.3, 0.04); },
  ax_o4_netsugen: (a, T) => { a.noise(0.08, { vol: 0.35, from: 800, to: 2000 }); a.noise(0.7, { vol: 0.45, delay: 0.08, from: 400, to: 2600 }); T(70, 0.6, { vol: 0.12, type: 'saw', slide: 50, delay: 0.1 }); },
  ax_o4_yochou: (a, T) => { pi(T, 0, 1760); pi(T, 0.25, 1760); T(2637, 0.08, { vol: 0.05, type: 'square', delay: 0.4 }); pikon(T, 0.48, 0.05); },
  ax_o4_saiteki: (a, T) => { for (let i = 0; i < 3; i++) pi(T, i * 0.08, 2349); buon(T, 0.5, 0.25, 80, 0.07); soyo(a, 0.5, 0.3, 0.2); },
  ax_o4_inverter: (a, T) => { T(220, 0.75, { vol: 0.06, type: 'sine', slide: 660, attack: 0.3 }); T(440, 0.7, { vol: 0.03, type: 'triangle', slide: 1320, attack: 0.3 }); },
  ax_o4_zenkan: (a, T) => { pi(T, 0, 2093); soyo(a, 0.7, 0.1, 0.2); kira(T, 0.5, 0.05); },
  ax_o4_demand: (a, T) => { T(800, 0.4, { vol: 0.06, type: 'saw', slide: 200 }); a.noise(0.3, { vol: 0.2, type: 'bandpass', from: 1500, to: 500, q: 2 }); T(1200, 0.06, { vol: 0.08, type: 'square', delay: 0.5 }); don(a, T, 0.55, 0.35); },
  ax_o4_hirameki: (a, T) => { T(1047, 0.06, { vol: 0.07, type: 'square' }); T(2093, 0.3, { vol: 0.07, type: 'square', delay: 0.07 }); kira(T, 0.15, 0.04); a.noise(0.3, { vol: 0.35, delay: 0.5, type: 'highpass', from: 2000, to: 6000 }); },
  ax_o4_seigyo: (a, T) => { for (let i = 0; i < 4; i++) pi(T, i * 0.07, 2349 + i * 200); buon(T, 0.4, 0.3, 70, 0.08); kira(T, 0.6, 0.04); },
  ax_o4_twin: (a, T) => { for (let i = 0; i < 6; i++) T(1200 + i * 250, 0.05, { vol: 0.04, type: 'square', delay: i * 0.05 }); pi(T, 0.4, 2637); don(a, T, 0.62, 0.5); },
  // ── 合体技
  ax_o4_renewal: (a, T) => { for (let i = 0; i < 3; i++) T(1800, 0.05, { vol: 0.06, type: 'square', delay: i * 0.12 }); kira(T, 0.4, 0.05); soyo(a, 0.4, 0.4, 0.25); },
  ax_o4_nantoka: (a, T) => { T(660, 0.3, { vol: 0.05, type: 'triangle', slide: 440 }); for (let i = 0; i < 6; i++) a.noise(0.06, { vol: 0.25, delay: 0.3 + i * 0.07, from: 2500, to: 600 }); },
  ax_o4_reform: (a, T) => { a.noise(0.05, { vol: 0.4, type: 'highpass', from: 3000, to: 3000 }); for (let i = 0; i < 4; i++) don(a, T, 0.2 + i * 0.08, 0.3); T(1568, 0.25, { vol: 0.05, type: 'triangle', delay: 0.6 }); },
  ax_o4_rensei: (a, T) => { a.noise(0.05, { vol: 0.4, type: 'highpass', from: 3000, to: 3000 }); T(200, 0.4, { vol: 0.06, type: 'saw', slide: 600, delay: 0.1 }); don(a, T, 0.62, 0.55); },
  ax_o4_gyakuten: (a, T) => { arp(T, [784, 988, 1175], 0.1, { type: 'triangle', vol: 0.05 }); kakiin(a, T, 0.4, 0.1); paan(a, T, 0.7); },
  ax_o4_uukanpi: (a, T) => { uu(T, 0, 0.035); for (let i = 0; i < 3; i++) T(1760, 0.06, { vol: 0.05, type: 'square', delay: 0.1 + i * 0.15 }); T(960, 0.22, { vol: 0.04, type: 'sine', delay: 0.3 }); T(770, 0.22, { vol: 0.04, type: 'sine', delay: 0.52 }); },
  ax_o4_hakkeyoi: (a, T) => { a.noise(0.08, { vol: 0.25, type: 'bandpass', from: 1500, to: 900, q: 2 }); don(a, T, 0.25, 0.5); don(a, T, 0.5, 0.45); },
};
