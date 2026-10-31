// 第48回: 大技の「ためる」音と「はなつ」音（Web Audio で その場で つくる。audio.js の sfx() が 知らない なまえの ときに ここを 見る）
// ・ax_c_<ためかた> … ためはじめの 音（render/axfx.js が ためる ときに ならす）。ax_c_legend … 伝説の 段階の ゴゴゴゴ
// ・ax_beam・ax_slash・ax_orb・ax_boom・ax_holy・ax_ice・ax_water・ax_fire・ax_bolt … はなつ 音（技の def.sfx に 書く。今までの 音の なまえも つかえる）
// ・グループの 音（client/sfx-ax-g1.js 〜 g6.js。なまえは ax_g1_〜）も この SFX_AX に まざる（いちばん 下）
// a: Audio（tone・noise を もつ）  T: a.tone の みじかい かきかた
import { SFX_AX_G1 } from './sfx-ax-g1.js?v=7040d8c7ec18';
import { SFX_AX_G2 } from './sfx-ax-g2.js?v=7040d8c7ec18';
import { SFX_AX_G3 } from './sfx-ax-g3.js?v=7040d8c7ec18';
import { SFX_AX_G4 } from './sfx-ax-g4.js?v=7040d8c7ec18';
import { SFX_AX_G5 } from './sfx-ax-g5.js?v=7040d8c7ec18';
import { SFX_AX_G6 } from './sfx-ax-g6.js?v=7040d8c7ec18';
// 第49回: もとからの 技の グループ（client/sfx-ax-o1.js 〜 o6.js。なまえは ax_o1_〜）
import { SFX_AX_O1 } from './sfx-ax-o1.js?v=7040d8c7ec18';
import { SFX_AX_O2 } from './sfx-ax-o2.js?v=7040d8c7ec18';
import { SFX_AX_O3 } from './sfx-ax-o3.js?v=7040d8c7ec18';
import { SFX_AX_O4 } from './sfx-ax-o4.js?v=7040d8c7ec18';
import { SFX_AX_O5 } from './sfx-ax-o5.js?v=7040d8c7ec18';
import { SFX_AX_O6 } from './sfx-ax-o6.js?v=7040d8c7ec18';
// 第51回 W: 天気の 職業の 技の 音（なまえは ax_o10_〜）
import { SFX_AX_O10 } from './sfx-ax-o10.js?v=7040d8c7ec18';
// 第51回 C3: 幻の職業（o9）
import { SFX_AX_O9 } from './sfx-ax-o9.js?v=7040d8c7ec18';
// 第51回 C1: 幻の職業の 技の 音（o7）
import { SFX_AX_O7 } from './sfx-ax-o7.js?v=7040d8c7ec18';
// 第51回 C2: 幻の職業（o8）
import { SFX_AX_O8 } from './sfx-ax-o8.js?v=7040d8c7ec18';
const swell = (a, dur, from, to, vol = 0.18, delay = 0) => {
  // だんだん 大きく なる ざわざわ（みじかい ノイズを かさねる）
  const n = Math.max(2, Math.round(dur / 0.12));
  for (let i = 0; i < n; i++) a.noise(0.16, { vol: vol * (0.3 + 0.7 * (i / n)), delay: delay + (i * dur) / n, from: from + ((to - from) * i) / n, to: from * 0.6 });
};
const rise = (T, f0, f1, dur, vol = 0.06, type = 'triangle', delay = 0) => T(f0, dur, { vol, type, slide: f1, delay, attack: dur * 0.85 });

export const SFX_AX = {
  // 気: ゴォォ…（ひくい うなり＋のぼる 音）
  ax_c_ki: (a, T) => { swell(a, 0.6, 200, 900, 0.2); rise(T, 90, 260, 0.6, 0.08, 'saw'); },
  // チャクラ: ヒュルル…（まわる 風）
  ax_c_chakra: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.18, { vol: 0.14, delay: i * 0.12, type: 'bandpass', from: 600 + i * 300, to: 2400, q: 5 }); rise(T, 300, 900, 0.5, 0.05, 'sine'); },
  // ゴム: シュウウ（湯気）＋ どくん
  ax_c_gomu: (a, T) => { a.noise(0.6, { vol: 0.16, type: 'highpass', from: 3000, to: 5000 }); [0, 0.28].forEach((d) => { T(70, 0.12, { vol: 0.2, delay: d, type: 'sine', slide: 50 }); T(60, 0.12, { vol: 0.16, delay: d + 0.12, type: 'sine', slide: 45 }); }); },
  // 呼吸: スゥゥ…（すいこむ）
  ax_c_breath: (a, T) => { a.noise(0.55, { vol: 0.2, type: 'bandpass', from: 1800, to: 500, q: 2 }); rise(T, 400, 600, 0.5, 0.03, 'sine'); },
  // 剣: チャキッ…キィン
  ax_c_sword: (a, T) => { T(2400, 0.04, { vol: 0.1, type: 'square' }); a.noise(0.05, { vol: 0.2, type: 'highpass', from: 5000, to: 7000 }); T(3136, 0.5, { vol: 0.05, delay: 0.12, type: 'sine' }); T(4186, 0.4, { vol: 0.03, delay: 0.14, type: 'sine' }); },
  // 竜: グルル…（ひくい うなり）
  ax_c_dragon: (a, T) => { T(80, 0.6, { vol: 0.14, type: 'saw', slide: 120, attack: 0.3 }); swell(a, 0.5, 300, 700, 0.15); [1319, 1760].forEach((f, i) => T(f, 0.3, { vol: 0.04, delay: 0.25 + i * 0.08, type: 'triangle' })); },
  // 聖: キラキラ…（かねの 音）
  ax_c_holy: (a, T) => { [1047, 1319, 1568, 2093, 2637].forEach((f, i) => T(f, 0.4, { vol: 0.05, delay: i * 0.08, type: 'sine' })); },
  // 魔法: ポロロン（のぼる アルペジオ）
  ax_c_magic: (a, T) => { [523, 659, 784, 988, 1175, 1568].forEach((f, i) => T(f, 0.16, { vol: 0.05, delay: i * 0.06, type: 'triangle' })); rise(T, 200, 400, 0.5, 0.03, 'sine'); },
  // 錬金術: パチパチ（青い いなずま）＋ キーン
  ax_c_alchemy: (a, T) => { for (let i = 0; i < 6; i++) a.noise(0.04, { vol: 0.18, delay: i * 0.07, type: 'highpass', from: 4000, to: 4000 }); rise(T, 600, 1800, 0.5, 0.04, 'sine'); },
  // アイドル: キラッ☆（ドミソ）
  ax_c_idol: (a, T) => { [784, 988, 1175, 1568].forEach((f, i) => T(f, 0.14, { vol: 0.06, delay: i * 0.05, type: 'pulse' })); T(2637, 0.3, { vol: 0.04, delay: 0.22, type: 'sine' }); },
  // 手品・わざ: シャッ（カード）＋ ポン
  ax_c_tech: (a, T) => { for (let i = 0; i < 4; i++) a.noise(0.04, { vol: 0.16, delay: i * 0.06, type: 'highpass', from: 3000, to: 6000 }); a.noise(0.3, { vol: 0.18, delay: 0.3, from: 1200, to: 200 }); T(880, 0.08, { vol: 0.05, delay: 0.3, type: 'triangle' }); },
  // 氷: キィン…（つめたい）
  ax_c_ice: (a, T) => { [2093, 2637, 3136].forEach((f, i) => T(f, 0.35, { vol: 0.04, delay: i * 0.09, type: 'sine' })); a.noise(0.5, { vol: 0.1, type: 'highpass', from: 6000, to: 8000 }); },
  // 星: ピロリン
  ax_c_star: (a, T) => { [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.2, { vol: 0.05, delay: i * 0.07, type: 'sine' })); },
  ax_c_generic: (a, T) => { rise(T, 300, 900, 0.4, 0.05, 'triangle'); swell(a, 0.3, 400, 1200, 0.1); },
  // 伝説: ゴゴゴゴ…（地ひびき＋たかまる 音）
  ax_c_legend: (a, T) => { a.noise(0.7, { vol: 0.4, from: 260, to: 40 }); rise(T, 110, 440, 0.55, 0.08, 'saw', 0.05); rise(T, 220, 880, 0.55, 0.05, 'triangle', 0.1); },
  // ビーム: ドォォォン（はなつ）
  ax_beam: (a, T) => { a.noise(0.08, { vol: 0.5, type: 'highpass', from: 3000, to: 3000 }); a.noise(0.9, { vol: 0.5, delay: 0.04, from: 2400, to: 80 }); T(140, 0.7, { vol: 0.16, type: 'saw', slide: 60, delay: 0.02 }); },
  // 斬げき: ズバッ
  ax_slash: (a, T) => { a.noise(0.12, { vol: 0.45, type: 'highpass', from: 2500, to: 7000 }); a.noise(0.2, { vol: 0.3, delay: 0.08, from: 3000, to: 300 }); T(1800, 0.1, { vol: 0.05, type: 'saw', slide: 400 }); },
  // たま: ギュイィン → ドン
  ax_orb: (a, T) => { T(300, 0.35, { vol: 0.08, type: 'saw', slide: 1200 }); a.noise(0.3, { vol: 0.2, type: 'bandpass', from: 800, to: 2400, q: 3 }); a.noise(0.5, { vol: 0.45, delay: 0.38, from: 1800, to: 60 }); },
  // 大爆発
  ax_boom: (a, T) => { a.noise(0.9, { vol: 0.65, from: 2200, to: 40 }); T(70, 0.6, { vol: 0.3, type: 'triangle', slide: 30 }); },
  ax_holy: (a, T) => { [1047, 1319, 1568, 2093].forEach((f, i) => T(f, 0.5, { vol: 0.06, delay: i * 0.04, type: 'sine' })); a.noise(0.6, { vol: 0.25, delay: 0.1, type: 'highpass', from: 3000, to: 6000 }); },
  ax_ice: (a, T) => { a.noise(0.08, { vol: 0.4, type: 'highpass', from: 5000, to: 7000 }); [2349, 1760, 2637].forEach((f, i) => T(f, 0.2, { vol: 0.05, delay: 0.05 + i * 0.05, type: 'triangle' })); a.noise(0.4, { vol: 0.3, delay: 0.12, from: 4000, to: 600 }); },
  ax_water: (a) => { a.noise(0.4, { vol: 0.35, from: 400, to: 1800 }); a.noise(0.6, { vol: 0.4, delay: 0.3, type: 'bandpass', from: 2400, to: 400, q: 1.5 }); },
  ax_fire: (a) => { a.noise(0.5, { vol: 0.4, from: 500, to: 3000 }); a.noise(0.7, { vol: 0.45, delay: 0.25, from: 2800, to: 120 }); },
  ax_bolt: (a, T) => { a.noise(0.08, { vol: 0.6, type: 'highpass', from: 2500, to: 2500 }); a.noise(1.0, { vol: 0.5, delay: 0.06, from: 900, to: 30 }); T(1800, 0.1, { vol: 0.06, type: 'saw', slide: 300 }); },
};

// ───────────── グループの 音（G0 が 書いた。グループは client/sfx-ax-gN.js だけ さわる。なまえは ax_gN_〜） ─────────────
// 音の なまえ → グループ（テストが 見る）
export const SFX_AX_GROUP = {};
for (const [g, table] of Object.entries({
  g1: SFX_AX_G1, g2: SFX_AX_G2, g3: SFX_AX_G3, g4: SFX_AX_G4, g5: SFX_AX_G5, g6: SFX_AX_G6,
  o1: SFX_AX_O1, o2: SFX_AX_O2, o3: SFX_AX_O3, o4: SFX_AX_O4, o5: SFX_AX_O5, o6: SFX_AX_O6, o7: SFX_AX_O7, o8: SFX_AX_O8, o9: SFX_AX_O9, o10: SFX_AX_O10,
})) {
  for (const [id, fn] of Object.entries(table)) {
    if (!id.startsWith(`ax_${g}_`)) throw new Error(`sfx-ax-${g}.js: 音の なまえ ${id} は ax_${g}_ で はじめる`);
    if (SFX_AX[id]) throw new Error(`sfx-ax-${g}.js: 音 ${id} は もう ある`);
    SFX_AX[id] = fn;
    SFX_AX_GROUP[id] = g;
  }
}
