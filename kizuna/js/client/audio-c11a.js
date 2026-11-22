// 第101回 F: 第3部 第3章 第1幕「星の船と、星座の島」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c11a.md の「実装メモ（第3章 第1幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。海の ボスの 曲も もとの お話の 曲を 借りて いない）。
//   c11a_launch は スピカの歌（c9d_song）の 1ふしめの 頭 2小節を 変ホ長調に うつして 使う。
//
// ・c11a_sea … 星の海のふな歌（変ホ長調 6/8 84。第3章の 顔。船の ゆれ〈ハープの 0 1 2 3 2 1〉。ヘ長調の 和音〈ラの ナチュラル〉で
//     少し ふしぎに。たいこは シェイカーと 遠い タムだけ〈重さが ない〉。地上の 世界地図と ちがう 楽器〈やわらかい リード〉）
// ・c11a_isle … ひとふでの星座（イ長調 84。考える 曲。画面の 状態 conStage〈島で できた 星座の 数 0〜2〉で 強さ 0・0.5・1:
//     0 … 笛・ベース・ハープの きざみ   1 … ＋ オルゴールの 星   2 … ＋ 弦の のばし・かるい たいこ。形・調は かえない）
// ・c11a_perch … とまり木のランプ（ヘ長調 3/4 88。小さな 村の 夜。ハープの ワルツの きざみ・ベルの ランプが ときどき）
// ・c11a_const … つながる星（ニ長調 132。5.5 秒。くり返さない。ベルの 星が 1つずつ ともる → 笛と ハープが 線で つなぐ → 和音）
// ・c11a_launch … 空へこぎ出せ（変ホ長調 120。24 秒。くり返さない。7つの 音が のぼる → スピカの歌の 頭 → 雲の 上 →
//     さいごは 変ホ長調の 主和音 ＝ 星の海のふな歌の はじめの 和音へ そのまま つながる）
// ・c11a_beast … またたく三つの星（ハ短調 152。中ボス。ベルが 3つの 音を くり返す〈強い 拍を さける。16分の 3つ組で 4拍子と ずれる〉）
// ・c11a_pirate … 大波どたばたマーチ（ト短調 140。幕の ボス。いさましい 行進 ＋ こっけいな 半音の すべり。
//     チク・タクを ずっと きざむ〈マリンバの 高い 音と 低い 音 ＋ リムの 4分〉。ピンチは マリンバの 16分 ＝ きざみが 倍に 速く 聞こえる）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=8604ab7ba7a1';
import { C9C_TOOLS } from './audio-c9c.js?v=8604ab7ba7a1';
import { C9D_SONG } from './audio-c9d.js?v=8604ab7ba7a1';

const { SHARP, FLAT, bassLine, comp, arp, pad, drums, rest, bars, oldView } = C9A_TOOLS;
const { shift } = C9C_TOOLS;
const F = { sp: FLAT };
const S = { sp: SHARP };
const F12 = { sp: FLAT, bar: 12 };

// ═════════════ c11a_sea: 星の海のふな歌（変ホ長調 6/8 84）═════════════
// 星の船で 星の海を 進む。広く・ゆったり・少し ふしぎ。夜空の 上なので 明るすぎず かなしすぎず。
//   A 船の ゆれの ふし（2小節め・6小節めの ヘ長調 ＝ ラの ナチュラルで ふしぎに）→ B 高く 広く（ハ短調から）
//   → C 遠くの 門（変ト長調・へ短調を 通る しずかな ふしぎ。オルゴールの 星が ふえる）→ A2（変ホで 落ち着く）
// 1小節 = 16分音符 12（8分 6つ。強い 拍は 0 と 6）
const SB = 12;
const SEA = {
  intro: ['Eb', 'F'],
  A: ['Eb', 'F', 'Cm', 'Ab', 'Eb', 'F', 'Ab', 'Bb'],
  B: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'F', 'Bb'],
  C: ['Ab', 'Gm', 'Fm', 'Bb', 'Gb', 'Ab', 'F', 'Bb'],
  A2: ['Eb', 'F', 'Cm', 'Ab', 'Eb', 'F', 'Ab Bb', 'Eb'],
};
const SEA_A = [
  'G5:4! F5:2 G5:4 Bb5:2', 'A5:6! C6:4 A5:2', 'G5:4! Eb5:2 G5:4 C6:2', 'Bb5:6! Ab5:6',
  'G5:4! F5:2 G5:4 Bb5:2', 'C6:4! A5:2 F5:4 A5:2', 'Eb6:6! C6:4 Ab5:2', 'F5:12!',
];
const SEA_B = [
  'Eb6:6! D6:4 C6:2', 'C6:6! Bb5:4 Ab5:2', 'Bb5:4! G5:2 Bb5:4 Eb6:2', 'D6:12!',
  'Eb6:6! G6:4 F6:2', 'Eb6:6! C6:4 Ab5:2', 'A5:4! C6:2 F6:4 Eb6:2', 'D6:6! C6:4 Bb5:2',
];
const SEA_C = [
  'C6:12!', 'Bb5:6! D6:6', 'Ab5:6! C6:4 Ab5:2', 'D6:12!',
  'Bb5:6! Db6:4 Bb5:2', 'C6:6! Eb6:4 C6:2', 'C6:4! A5:2 F5:4 A5:2', 'Bb5:4! C6:2 D6:6',
];
const SEA_A2 = [...SEA_A.slice(0, 7), 'Eb6:12!'];
// 船の ゆれ（ハープ。8分 6つで 上って 下りる）
const ROCK = '0:2 1:2 2:2 3:2 2:2 1:2';
// 星の きらきら（オルゴール。強い 拍は さける）
const TWINKLE = 'r:4 4:1? r:3 r:2 5:1? r:1';
const TWINKLE2 = 'r:2 4:1? r:1 5:1? r:3 3:1? r:3';
// 波の さらさら（シェイカー）と 遠い タム（2小節に 1つ）
const SWELL = ['tl:2? r:4 sh:2? sh:2? sh:2?', 'r:6 sh:2? sh:2? sh:2?'];

const c11aSea = {
  bpm: 84, bar: SB, reverb: 0.5, fill: 0, night: {},
  parts: [
    { i: 'soft_lead', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.14, role: 'bass' },
    // 船の ゆれ
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.2 },
    // 星の きらきら
    { i: 'musicbox', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { drums: true, v: 0.24, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:12 r:6 C5:4 F5:2',
      bassLine(SEA.intro, '1:12', { lo: 39, ...F12 }),
      arp(SEA.intro, ROCK, { center: 64, ...F12 }),
      pad(SEA.intro, { center: 60, mods: '?', ...F12 }),
      arp(SEA.intro, ['r:12', TWINKLE], { center: 76, ...F12 }),
      drums(2, 'r:12', { last: 'r:6 sh:2? sh:2? sh:2?' }),
    ],
    A: [
      bars(SEA_A),
      bassLine(SEA.A, '1:6! 5:6', { lo: 39, ...F12 }),
      arp(SEA.A, ROCK, { center: 64, ...F12 }),
      pad(SEA.A, { center: 60, mods: '?', ...F12 }),
      arp(SEA.A, [TWINKLE, 'r:12'], { center: 76, ...F12 }),
      drums(8, SWELL),
    ],
    // 高く 広く
    B: [
      bars(SEA_B),
      bassLine(SEA.B, '1:6! 5:4 8:2', { lo: 39, ...F12 }),
      arp(SEA.B, '0:2 1:2 2:2 3:2 4:2 3:2', { center: 66, ...F12 }),
      pad(SEA.B, { center: 62, ...F12 }),
      arp(SEA.B, TWINKLE, { center: 76, ...F12 }),
      drums(8, SWELL, { last: 'tl:2? r:4 tl:2? t:2? th:2?' }),
    ],
    // 遠くの 門（しずかな ふしぎ）
    C: [
      bars(SEA_C),
      bassLine(SEA.C, '1:12!', { lo: 39, ...F12 }),
      arp(SEA.C, '0:2 2:2 1:2 3:2 2:2 1:2', { center: 64, ...F12 }),
      pad(SEA.C, { center: 60, mods: '?', ...F12 }),
      arp(SEA.C, TWINKLE2, { center: 76, ...F12 }),
      drums(8, ['r:6 sh:2? r:4', 'tl:2? r:10']),
    ],
    A2: [
      bars(SEA_A2),
      bassLine(SEA.A2, '1:6! 5:6', { lo: 39, ...F12 }),
      arp(SEA.A2, ROCK, { center: 64, ...F12 }),
      pad(SEA.A2, { center: 60, mods: '?', ...F12 }),
      arp(SEA.A2, [TWINKLE, TWINKLE2], { center: 76, ...F12 }),
      drums(8, SWELL, { last: 'tl:2? r:4 sh:2? sh:2? sh:2?' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11a_isle: ひとふでの星座（イ長調 84）═════════════
// 星座の 島。ひとふで書きの なぞを 考える 曲。しずかで きらきら。
//   A 問いかける ふし（休みを 入れて ゆっくり）→ B 少し 高く（考えが まとまって くる）→ A2（イ長調に 落ち着く）
//   島で できた 星座の 数（conStage 0〜2）で 楽器が ふえる（強さ ＝ 星座の 数 ÷ 2。形・調・テンポは かえない）
const ISL = {
  intro: ['A', 'D'],
  A: ['A', 'D', 'A', 'E', 'F#m', 'D', 'Bm', 'E'],
  B: ['D', 'C#m', 'Bm', 'A', 'D', 'E', 'F#m', 'E'],
  A2: ['A', 'D', 'A', 'E', 'F#m', 'D', 'Bm E', 'A'],
};
const ISLE_A = [
  'E5:4! A5:4 B5:4 C#6:4', 'A5:8! F#5:4 E5:4', 'E5:4! A5:4 C#6:4 E6:4', 'D6:4! C#6:4 B5:8',
  'C#6:6! B5:2 A5:8', 'F#5:4! A5:4 C#6:8', 'D6:4! C#6:4 B5:4 A5:4', 'B5:12! r:4',
];
const ISLE_B = [
  'F#6:4! E6:4 D6:8', 'E6:4! C#6:4 G#5:8', 'F#5:4! B5:4 D6:4 C#6:4', 'C#6:12! r:4',
  'A5:4! D6:4 F#6:4 E6:4', 'G#6:6! F#6:2 E6:8', 'C#6:4! A5:4 F#5:4 A5:4', 'B5:8! G#5:4 E5:4',
];
const ISLE_A2 = [...ISLE_A.slice(0, 7), 'A5:12! r:4'];
// 考える きざみ（ハープの 8分。1・3・2・4）
const THINK = '0:2 2:2 1:2 3:2 0:2 2:2 1:2 3:2';
// できた 星座の 星（オルゴール。強い 拍は さける）
const CON_STAR = 'r:2 4:1? r:3 3:1? r:3 r:2 5:1? r:3';
const ISLE_DR = 'tl:4? sh:2? r:2 R:2? r:2 sh:2? r:2';
// 強さ（conStage 0〜2 → 0・0.5・1）
export const CON_INTENSITY = [0, 0.5, 1];

const c11aIsle = {
  bpm: 84, bar: 16, reverb: 0.45, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.14, role: 'bass', minIntensity: 0 },
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    // 星座 1つ: オルゴールの 星
    { i: 'musicbox', v: 0.04, role: 'harmony', minIntensity: 0.5, pan: 0.3 },
    // 星座 2つ: 弦の のばし と かるい たいこ
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 1, pan: -0.05 },
    { drums: true, v: 0.24, minIntensity: 1 },
  ],
  sections: {
    intro: [
      'r:16 r:8 A4:4 E5:4',
      bassLine(ISL.intro, '1:16', { lo: 40, ...S }),
      arp(ISL.intro, THINK, { center: 66, ...S }),
      arp(ISL.intro, ['r:16', CON_STAR], { center: 76, ...S }),
      pad(ISL.intro, { center: 62, mods: '?', ...S }),
      drums(2, 'r:16', { last: 'r:8 R:2? r:2 R:2? r:2' }),
    ],
    A: [
      bars(ISLE_A),
      bassLine(ISL.A, '1:8! 5:8', { lo: 40, ...S }),
      arp(ISL.A, THINK, { center: 66, ...S }),
      arp(ISL.A, CON_STAR, { center: 76, ...S }),
      pad(ISL.A, { center: 62, mods: '?', ...S }),
      drums(8, ISLE_DR),
    ],
    // 少し 高く
    B: [
      bars(ISLE_B),
      bassLine(ISL.B, '1:8! 5:4 1:4', { lo: 40, ...S }),
      arp(ISL.B, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 2:2', { center: 68, ...S }),
      arp(ISL.B, 'r:2 5:1? r:3 4:1? r:3 r:2 3:1? r:1 4:1? r:1', { center: 76, ...S }),
      pad(ISL.B, { center: 64, mods: '?', ...S }),
      drums(8, ISLE_DR, { last: 'tl:4? sh:2? r:2 tl:2? r:2 th:2? r:2' }),
    ],
    A2: [
      bars(ISLE_A2),
      bassLine(ISL.A2, '1:8! 5:8', { lo: 40, ...S }),
      arp(ISL.A2, THINK, { center: 66, ...S }),
      arp(ISL.A2, CON_STAR, { center: 76, ...S }),
      pad(ISL.A2, { center: 62, mods: '?', ...S }),
      drums(8, ISLE_DR),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11a_perch: とまり木のランプ（ヘ長調 3/4 88）═════════════
// 光の 弱い 星の 人たちの 小さな 村。あたたかく 小さく、夜の ランプ。さびしく しすぎない（長調・ハープの ワルツ）。
//   A 小さな ワルツ → B 少し 高く（ランプの 明かりが ゆれる）→ A2（ヘ長調で おわる）
// 1小節 = 16分音符 12（4分 3つ。強い 拍は 1拍め）
const PR = {
  intro: ['F', 'C'],
  A: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C'],
  B: ['Bb', 'F', 'Gm', 'Dm', 'Bb', 'Am', 'Gm', 'C'],
  A2: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb C', 'F'],
};
const PERCH_A = [
  'A5:4! C6:4 A5:4', 'F5:8! D5:4', 'D6:4! C6:4 Bb5:4', 'G5:8! E5:4',
  'A5:4! C6:4 F6:4', 'E6:4! D6:4 C6:4', 'D6:4! Bb5:4 G5:4', 'C6:8! r:4',
];
const PERCH_B = [
  'F6:6! D6:2 Bb5:4', 'C6:8! A5:4', 'Bb5:4! D6:4 G6:4', 'F6:8! r:4',
  'D6:4! F6:4 D6:4', 'C6:4! E6:4 A5:4', 'Bb5:6! A5:2 G5:4', 'G5:4! C6:4 E6:4',
];
const PERCH_A2 = [...PERCH_A.slice(0, 7), 'F5:8! r:4'];
const WALTZ = 'r:4 x:4? x:4?';
// ランプ（ベル。2小節に 1つ、2拍めの うら）
const LAMP = ['r:6 4:2? r:4', 'r:12'];
const PERCH_DR = 'tl:4? sh:4? sh:4?';

const c11aPerch = {
  bpm: 88, bar: 12, reverb: 0.36, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.14, role: 'bass' },
    // ワルツの きざみ（ハープ）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // ランプ
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.2, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:12 r:4 C5:4 F5:4',
      bassLine(PR.intro, '1:4! r:4 5:4', { lo: 41, ...F12 }),
      comp(PR.intro, WALTZ, { center: 64, ...F12 }),
      pad(PR.intro, { center: 60, mods: '?', ...F12 }),
      arp(PR.intro, LAMP, { center: 80, ...F12 }),
      drums(2, 'r:12', { last: 'r:4 sh:4? sh:4?' }),
    ],
    A: [
      bars(PERCH_A),
      bassLine(PR.A, '1:4! r:4 5:4', { lo: 41, ...F12 }),
      comp(PR.A, WALTZ, { center: 64, ...F12 }),
      pad(PR.A, { center: 60, mods: '?', ...F12 }),
      arp(PR.A, LAMP, { center: 80, ...F12 }),
      drums(8, PERCH_DR),
    ],
    // ランプの 明かりが ゆれる
    B: [
      bars(PERCH_B),
      bassLine(PR.B, '1:4! r:4 5:4', { lo: 41, ...F12 }),
      arp(PR.B, 'r:4 1:2? 2:2? 3:2? 2:2?', { center: 66, ...F12 }),
      pad(PR.B, { center: 62, mods: '?', ...F12 }),
      arp(PR.B, ['r:6 4:2? r:4', 'r:6 3:2? r:2 5:2?'], { center: 80, ...F12 }),
      drums(8, PERCH_DR, { last: 'tl:4? tl:4? sh:4?' }),
    ],
    A2: [
      bars(PERCH_A2),
      bassLine(PR.A2, '1:4! r:4 5:4', { lo: 41, ...F12 }),
      comp(PR.A2, WALTZ, { center: 64, ...F12 }),
      pad(PR.A2, { center: 60, mods: '?', ...F12 }),
      arp(PR.A2, LAMP, { center: 80, ...F12 }),
      drums(8, PERCH_DR, { last: 'tl:4? r:8' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11a_const: つながる星（ニ長調 132。くり返さない）═════════════
// 星座が できた。1小節め ベルの 星が 1つずつ ともる（4つ）→ 2小節め 笛と ハープが 16分で 線を つなぐ → 3小節め 和音で 光る
export const CONST_STARS = ['D6', 'F#6', 'A6', 'D7'];
const c11aConst = {
  bpm: 132, bar: 16, once: true, reverb: 0.45, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.14, role: 'bass' },
    // 星（ベル）
    { i: 'bell', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.1 },
    // 線（ハープ）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { drums: true, v: 0.24, minIntensity: 0 },
  ],
  sections: {
    S: [
      'r:16 A5:2! B5:2 D6:2 E6:2 F#6:4! A6:4 D6:12! r:4',
      bassLine(['D', 'A', 'D'], ['1:16', '1:16', '1:12! r:4'], { lo: 38, ...S }),
      `${CONST_STARS.map((n) => `r:2 ${n}:2!`).join(' ')} r:16 D7:8? r:8`,
      `r:16 ${arp(['A'], '0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 r:8', { center: 66, ...S })} ${arp(['D'], '0:2 1:2 2:2 3:2 4:4? r:4', { center: 66, ...S })}`,
      `r:16 r:16 ${pad(['D'], { center: 62, ...S })}`,
      'R:2? r:2 R:2? r:2 R:2? r:2 R:2? r:2 r:8 t:2? th:2 th:2 th:2 c:4! r:12',
    ],
  },
  form: ['S'],
};

// ═════════════ c11a_launch: 空へこぎ出せ（変ホ長調 120。くり返さない）═════════════
// 星の船が 光の 橋を かけ上がり、橋の 先から 空へ（24 秒）。
//   intro ベルが 7つの 音を のぼる（船が 動き出す・タムの ロール）→ R スピカの歌の 1ふしめの 頭 2小節（変ホ長調）→ のぼる
//   → S 雲の 上（いちばん 高い）→ F 変ホ長調の 主和音で おわる（星の海のふな歌の はじめの 和音と 同じ ＝ そのまま つながる）
const LA = {
  intro: ['Ab', 'Bb'],
  R: ['Eb', 'Cm', 'Ab', 'Bb'],
  S: ['Ab', 'Bb', 'Gm', 'Cm'],
  F: ['Ab Bb', 'Eb'],
};
// スピカの歌の 1ふしめの 頭 2小節（ハ長調 → 変ホ長調 ＝ 3つ 上）
export const LAUNCH_SONG = C9D_SONG.phrases[0].slice(0, 2).map((b) => shift(b, 3));
const LAUNCH_R = [...LAUNCH_SONG, 'Ab5:4! C6:4 Eb6:4 F6:4', 'G6:4! F6:4 D6:4 Bb5:4'];
const LAUNCH_S = ['C6:6! Eb6:2 Ab6:8', 'G6:4! F6:4 D6:4 F6:4', 'G6:6! D6:2 Bb5:8', 'Eb6:4! D6:4 C6:4 G5:4'];
const LAUNCH_F = ['Ab5:4! C6:4 D6:4 F6:4', 'G6:12! r:4'];
// さいごの 和音（星の海のふな歌の はじめの 和音と 同じ）
export const LAUNCH_LAST_CHORD = LA.F.at(-1);
const c11aLaunch = {
  bpm: 120, bar: 16, once: true, reverb: 0.45, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'strings', v: 0.032, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.32, minIntensity: 0 },
  ],
  sections: {
    // 7つの 音が のぼる
    intro: [
      'r:16 r:8 Bb4:4! Eb5:4',
      bassLine(LA.intro, '1:16', { lo: 39, ...F }),
      pad(LA.intro, { center: 60, mods: '?', ...F }),
      arp(LA.intro, ['0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:1 1:1 2:1 3:1 4:1 5:1 6:1 7:1 r:8'], { center: 64, ...F }),
      'Eb6:2? F6:2? G6:2? Ab6:2? Bb6:2? C7:2? r:4 D7:4! r:12',
      drums(2, 'r:8 tl:2? tl:2? t:2? t:2?', { last: 't:1 t:1 t:1 t:1 th:1 th:1 th:1 th:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1' }),
    ],
    // スピカの歌の 頭 → のぼる
    R: [
      bars(LAUNCH_R),
      bassLine(LA.R, '1:4! 5:4 8:4 5:4', { lo: 39, ...F }),
      pad(LA.R, { center: 62, ...F }),
      arp(LA.R, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64, ...F }),
      bars(['r:16', 'r:16', 'r:8 Eb7:4? r:4', 'r:8 D7:4? r:4']),
      drums(4, 'k:4! h:2 h:2? s:4 h:2 k:2', { first: 'c:4! h:2 h:2? s:4 h:2 k:2', last: 'k:4! h:2 h:2 s:2 s:2 t:2 th:2' }),
    ],
    // 雲の 上
    S: [
      bars(LAUNCH_S),
      bassLine(LA.S, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2', { lo: 39, ...F }),
      pad(LA.S, { center: 64, ...F }),
      arp(LA.S, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 66, ...F }),
      bars(['C7:4? r:12', 'r:8 F6:4? Bb6:4?', 'G6:4? r:12', 'r:8 Eb7:4? r:4']),
      drums(4, 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', last: 'k:2! h:2 s:2 h:2 tl:2 t:2 th:2 s:2' }),
    ],
    // 変ホ長調の 主和音で おわる（星の海へ）
    F: [
      bars(LAUNCH_F),
      bassLine(LA.F, ['1:4! 5:4 1:4! 5:4', '1:12! r:4'], { lo: 39, ...F }),
      pad(LA.F, { center: 62, ...F }),
      arp(LA.F, ['0:2 1:2 2:2 3:2 0:2 1:2 2:2 3:2', '0:2 1:2 2:2 3:2 4:2 5:2? r:4'], { center: 66, ...F }),
      'r:8 Bb6:4? D7:4? Eb7:8? r:8',
      drums(2, 's:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 tl:2! t:2 th:2 c:2!', { last: 'c:4! r:12' }),
    ],
  },
  form: ['intro', 'R', 'S', 'F'],
};

// ═════════════ c11a_beast: またたく三つの星（ハ短調 152）═════════════
// 星の 光で できた けもの（中ボス）。きらきら して いるが 強い。体は 3つの 星。
//   ベルが 3つの 音（和音の いちばん 上・下・まん中）を くり返す（強い 拍は 休み。8分の 3つ組 2回）。
//   A けものの ふし → B 光る（変ホ長調の 和音。ヘ長調で ラの ナチュラル）→ C 3つの 星（どの 小節も 3つの 音から 始まる。2小節ずつ 上へ）→ A2
const BS = {
  intro: ['Cm', 'G'],
  A: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'],
  B: ['Eb', 'Bb', 'Cm', 'G', 'Ab', 'Eb', 'F', 'G'],
  C: ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G', 'G'],
};
const BEAST_A = [
  'G5:2! G5:2 C6:2 Eb6:2 D6:4! C6:4', 'Eb6:6! C6:2 Ab5:8!', 'F5:2! Ab5:2 C6:2 F6:2 Eb6:4! C6:4', 'D6:6! B5:2 G5:8!',
  'G5:2! G5:2 C6:2 Eb6:2 G6:4! F6:4', 'Eb6:4! C6:4 Ab5:4! C6:4', 'D6:4! F6:4 Bb5:4! D6:4', 'B5:8! D6:4 G5:4',
];
const BEAST_B = [
  'G6:6! F6:2 Eb6:8!', 'D6:6! C6:2 Bb5:8!', 'C6:4! Eb6:4 G6:4! Eb6:4', 'D6:12! r:4',
  'C6:6! Eb6:2 Ab6:8!', 'Bb5:4! Eb6:4 G6:8!', 'A6:6! G6:2 F6:8!', 'G6:4! F6:4 D6:4 B5:4',
];
// 3つの 星: どの 小節も 3つの 音（4分・4分・2分）
const BEAST_C = [
  'C6:4! G5:4 Eb6:8!', 'D6:4! Eb6:4 C6:8', 'C6:4! Ab5:4 Eb6:8!', 'F6:4! Eb6:4 C6:8',
  'C6:4! Ab5:4 F6:8!', 'G6:4! F6:4 Eb6:4 C6:4', 'D6:4! B5:4 G6:8!', 'F6:4! D6:4 B5:4 G5:4',
];
const BEAST_A2 = [...BEAST_A.slice(0, 7), 'B5:4! D6:4 G6:4! F6:4'];
// 3つの 星の くり返し（上・下・まん中。強い 拍は 休み）
export const THREE_STARS = 'r:2 2:2? 0:2? 1:2? r:2 2:2? 0:2? 1:2?';
const BEAST_DR = 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2';

const c11aBeast = {
  bpm: 152, bar: 16, reverb: 0.3, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.065, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // 3つの 星
    { i: 'bell', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'musicbox', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.38, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 G5:4! B5:4',
      bassLine(BS.intro, '1:2! 1:2 1:2 1:2 1:2 1:2 1:2 1:2', { lo: 36, ...F }),
      arp(BS.intro, THREE_STARS, { center: 84, ...F }),
      comp(BS.intro, ['x:2! r:14', 'x:2! r:6 x:2 r:2 x:2 r:2'], { center: 64, ...F }),
      rest(2),
      drums(2, ['c:4! r:12', 'k:2! s:2 s:2 k:2 s:1 s:1 s:2 t:2 th:2']),
    ],
    A: [
      bars(BEAST_A),
      bassLine(BS.A, '1:2! 1:2 8:2 1:2 1:2! 1:2 8:2 5:2', { lo: 36, ...F }),
      arp(BS.A, THREE_STARS, { center: 84, ...F }),
      comp(BS.A, 'x:2! r:6 x:2 r:2 x:2 r:2', { center: 64, ...F }),
      rest(8),
      drums(8, BEAST_DR, { last: 'k:2! h:2 s:2 h:2 s:1 s:1 s:2 t:2 tl:2' }),
    ],
    // 光る（オルゴールの きらきらが 加わる）
    B: [
      bars(BEAST_B),
      bassLine(BS.B, '1:4! 1:2 1:2 5:4 1:2 1:2', { lo: 36, ...F }),
      arp(BS.B, THREE_STARS, { center: 86, ...F }),
      pad(BS.B, { center: 62, mods: '?', ...F }),
      arp(BS.B, 'r:2 4:1? r:1 3:1? r:3 r:2 5:1? r:1 4:1? r:3', { center: 78, ...F }),
      drums(8, 'k:4! s:2? h:2 k:2 h:2 s:4', { last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
    // 3つの 星
    C: [
      bars(BEAST_C),
      bassLine(BS.C, '1:4! 1:4 1:4! 1:4', { lo: 36, ...F }),
      arp(BS.C, THREE_STARS, { center: 84, ...F }),
      pad(BS.C, { center: 62, ...F }),
      rest(8),
      drums(8, 'k:4! R:4 s:4 R:4', { first: 'c:4! R:4 s:4 R:4', last: 's:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 tl:2! tl:2 th:2 c:2!' }),
    ],
    A2: [
      bars(BEAST_A2),
      bassLine(BS.A, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2', { lo: 36, ...F }),
      arp(BS.A, THREE_STARS, { center: 84, ...F }),
      comp(BS.A, 'x:2! r:2 x:2 r:2 x:2 r:2 x:2 r:2', { center: 64, ...F }),
      rest(8),
      drums(8, BEAST_DR, { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ド）と 半音上
  pinch: { n: 'C6:2 Db6:2 C6:2 G5:2 C6:2 Db6:2 C6:2 Eb6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c11a_pirate: 大波どたばたマーチ（ト短調 140）═════════════
// えらそうで こわがりな 海の ボスと、時計の 鳴る 大きな 生きもの。いさましい 行進 ＋ こっけいさ。
//   チク・タクを ずっと きざむ: マリンバ（4分。和音の 上の 音〈チク・強く〉と 下の 音〈タク・弱く〉を かわるがわる）と リムの 4分。
//   A いばった 行進（付点の はね）→ B こっけい（スタッカート・半音で すべり下りる ＝ あわてる）
//   → C 近づく（ふしは 長い 音・ベースは うすく・チク・タクが 前に 出る）→ A2
//   ピンチの だん: マリンバが 16分で きざむ（チク・タクが 倍の 速さに 聞こえる）
const PI = {
  intro: ['Gm', 'D'],
  A: ['Gm', 'F', 'Eb', 'D', 'Gm', 'F', 'Eb', 'D'],
  B: ['Bb', 'F', 'Gm', 'D', 'Eb', 'Bb', 'C', 'D'],
  C: ['Gm', 'Gm', 'Eb', 'Eb', 'Cm', 'Cm', 'D', 'D'],
  A2: ['Gm', 'F', 'Eb', 'D', 'Gm', 'F', 'Eb D', 'Gm'],
};
const PIRATE_A = [
  'G5:3! A5:1 Bb5:4 D6:4! G5:4', 'A5:3! Bb5:1 C6:4 F6:4! C6:4', 'Bb5:3! C6:1 Eb6:4 G6:4! Eb6:4', 'F#6:6! E6:2 D6:8!',
  'G5:3! A5:1 Bb5:4 D6:4! G6:4', 'F6:3! Eb6:1 D6:4 C6:4! A5:4', 'Bb5:4! G5:4 Eb6:4! C6:4', 'D6:4! A5:4 F#5:4! D5:4',
];
const PIRATE_B = [
  'D6:2! r:2 D6:2 r:2 F6:2! r:2 D6:2 r:2', 'C6:2! r:2 C6:2 r:2 A5:2! r:2 F5:2 r:2',
  'Bb5:2! A5:2 Bb5:2 B5:2 C6:2! C#6:2 D6:4', 'A6:2! r:6 D6:2! r:6',
  'G6:2! r:2 G6:2 r:2 Eb6:2! r:2 Bb5:2 r:2', 'F6:2! r:2 F6:2 r:2 D6:2! r:2 Bb5:2 r:2',
  // 半音で すべり下りる（あわてる）
  'E6:2! Eb6:2 D6:2 Db6:2 C6:4! G5:4', 'D6:4! F#6:4 A6:4! D6:4',
];
const PIRATE_C = [
  'G5:8! Bb5:8', 'A5:8! G5:8', 'G5:8! Bb5:8', 'C6:8! Bb5:8',
  'Eb6:8! C6:8', 'G6:8! Eb6:8', 'F#6:8! A6:8', 'D6:4! C6:4 A5:4 F#5:4',
];
const PIRATE_A2 = [...PIRATE_A.slice(0, 6), 'Bb5:4! G5:4 A5:4! F#5:4', 'G5:8! r:4 D5:4'];
// チク・タク（マリンバ。4分ごとに 上〈強く〉・下〈弱く〉）とリムの 4分
export const TICK_TOCK = '2:4! 0:4? 2:4! 0:4?';
const CLOCK = 'R:4! R:4? R:4! R:4?';
const MARCH = 'k:4! s:2 h:2 k:2 k:2 s:4';
const POMPA = 'r:4 x:4 r:4 x:4';

const c11aPirate = {
  bpm: 140, bar: 16, reverb: 0.26, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.065, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // チク・タク（木の 打楽器）
    { i: 'marimba', v: 0.06, role: 'harmony', minIntensity: 0, pan: 0.3 },
    // ピチカートの ずんちゃ
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.34, minIntensity: 0 },
    // 時計（リム）
    { drums: true, v: 0.26, minIntensity: 0 },
  ],
  sections: {
    // チク・タクだけで 始まる
    intro: [
      'r:16 r:8 D5:4! D5:4',
      bassLine(PI.intro, ['r:16', '1:4! r:4 1:4! 1:4'], { lo: 38, ...F }),
      arp(PI.intro, TICK_TOCK, { center: 76, ...F }),
      rest(2),
      pad(PI.intro, { center: 60, mods: '?', ...F }),
      drums(2, 'r:16', { last: 'r:8 s:2 s:2 s:1 s:1 s:2' }),
      drums(2, CLOCK),
    ],
    A: [
      bars(PIRATE_A),
      bassLine(PI.A, '1:4! 5:4 1:4! 5:4', { lo: 38, ...F }),
      arp(PI.A, TICK_TOCK, { center: 76, ...F }),
      comp(PI.A, POMPA, { center: 62, ...F }),
      rest(8),
      drums(8, MARCH, { first: 'c:4! s:2 h:2 k:2 k:2 s:4', last: 'k:4! s:2 s:2 s:1 s:1 s:2 t:2 tl:2' }),
      drums(8, CLOCK),
    ],
    // こっけい（あわてる）
    B: [
      bars(PIRATE_B),
      bassLine(PI.B, '1:4! 5:4 1:4! 5:4', { lo: 38, ...F }),
      arp(PI.B, TICK_TOCK, { center: 76, ...F }),
      comp(PI.B, 'r:4 x:2 r:2 r:4 x:2 r:2', { center: 62, ...F }),
      rest(8),
      drums(8, 'k:4! s:2? r:2 k:4 s:2? r:2', { last: 's:1 s:1 s:1 s:1 s:2 r:2 tl:2 t:2 th:2 c:2!' }),
      drums(8, CLOCK),
    ],
    // 近づいて くる（チク・タクが 前に 出る）
    C: [
      bars(PIRATE_C),
      bassLine(PI.C, '1:4! r:4 1:4! r:4', { lo: 38, ...F }),
      arp(PI.C, TICK_TOCK, { center: 76, ...F }),
      rest(8),
      pad(PI.C, { center: 58, ...F }),
      drums(8, 'k:4! r:4 k:4 r:4', { last: 'k:4! r:4 tl:2 tl:2 t:2 th:2' }),
      drums(8, 'R:4! R:4 R:4! R:4'),
    ],
    A2: [
      bars(PIRATE_A2),
      bassLine(PI.A2, '1:4! 5:4 1:4! 5:4', { lo: 38, ...F }),
      arp(PI.A2, TICK_TOCK, { center: 76, ...F }),
      comp(PI.A2, POMPA, { center: 62, ...F }),
      rest(8),
      drums(8, MARCH, { first: 'c:4! s:2 s:2 k:2 k:2 s:2 s:2', last: 'k:4! s:2 s:2 k:2 s:2 c:4!' }),
      drums(8, CLOCK),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: マリンバが 16分で チク・タク（主音 ソと その 下の レ）＝ きざみが 倍の 速さに 聞こえる
  pinch: { n: Array.from({ length: 8 }, () => 'G6:1 D6:1').join(' '), i: 'marimba', v: 0.035 },
};

for (const tr of [c11aSea, c11aIsle, c11aPerch, c11aConst, c11aLaunch, c11aBeast, c11aPirate]) tr.ch = oldView(tr);

// テストが 見る ふし
export const C11A_LINES = {
  seaA: SEA_A, seaB: SEA_B, seaC: SEA_C, isleA: ISLE_A, isleB: ISLE_B, perchA: PERCH_A,
  launchR: LAUNCH_R, launchF: LAUNCH_F, beastC: BEAST_C, pirateB: PIRATE_B,
};

// 曲の id は docs/plan-part3-c11a.md の 17-5（かえない）
export const C11A_TRACKS = {
  c11a_sea: c11aSea,
  c11a_isle: c11aIsle,
  c11a_perch: c11aPerch,
  c11a_const: c11aConst,
  c11a_launch: c11aLaunch,
  c11a_beast: c11aBeast,
  c11a_pirate: c11aPirate,
};
export const C11A_IDS = Object.keys(C11A_TRACKS);
