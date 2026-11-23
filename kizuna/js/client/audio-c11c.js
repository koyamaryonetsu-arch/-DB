// 第103回 F: 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c11c.md の「実装メモ（第3章 第3幕 F班）」。
// 曲は すべて オリジナル（もとの お話や ほかの 作品の 曲を 借りて いない）。
//   c11c_hall の 低い 音の 楽器と c11c_rest は 少年の 曲（c9c_algol「つめたい光」）の ふし〈シ・ラ・ソ・ファ・ミ・レ・ド〉を 使う。
//   c11c_mecha は 3人組の 曲（c9a_trio・c9c_trio2）の ふしを 使う（ヘ長調 → ト長調 → イ長調。2つずつ 上がる 3つめ）。
//
// ・c11c_hall … 光のさくの回ろう（イ短調 92。考える 曲。ひんやり・少し きんちょう。リムの こちこち と ハープの 8分。
//     画面の 状態 pairStage〈相ぼうが 台に 立って いる 間 1〉で 強さ 0・1: 1 の 間は 低い のばし〈pad。少年の 色〉が
//     少年の ふし〈シ・ラ・ソ・ファ・ミ・レ・ド〉を 1小節に 1つずつ 足す。ふし・形・調・テンポは 同じ ＝ 足される だけ）
// ・c11c_rest … 小さな光（イ短調 → ハ長調 66。少年の ふしの はじめの 4小節を 長さ 2ばいで、笛で やわらかく。
//     B は 新しい ふしで ハ長調へ。オルゴールの 小さな 光。さいごは ハ長調の 和音 ＝ 少し 明るく）
// ・c11c_join … いっしょに行こう（イ短調 → イ長調 150。4.8 秒。くり返さない。ブラスの 小さな ファンファーレ。
//     イ短調で 始まり、イ長調の 和音で おわる。ふしは 5度〈ミ〉で 止まる ＝ 明るすぎない・強がり）
// ・c11c_mecha … やっぱりドタバタ3人組（イ長調 164。c9a_trio の ふしを イ長調へ〈c9c_trio2 から また 2つ 上げる〉。
//     B は 3つの 体〈同じ 音を 3つずつ ガシャ ガシャ ガシャ〉→ C は ブラスの ファンファーレ〈ごうか〉→ A2 → D メカ。ブラスが 前より 多い）
// ・c11c_ace … カードの行進（ト短調 124。きっちり した 行進。3小節で 1組〈カードを 3まい〉: 1小節め ベルが 3つの 音で
//     カードを ならべる・3小節め の おわりに めくる 音〈シェイカー ＋ リム〉。ふしの 組の 頭は 3つの 音の 合図〈短・短・長〉。
//     区切りは 3小節 × 3 ＝ 9小節。ボスの だんで テンポだけ 上がる〈1・1.1・1.18・1.25 倍〉。ピンチは ハープの 16分）
// ・c11c_door … 大とびらがひらく（ニ長調 96。10 秒。くり返さない。かねが 2つ ずつ 鳴る → タムが だんだん 近く〈大きな 物が
//     ゆっくり 開く〉→ シンバルと オルゴールの まぶしい 光。おわりは Asus4〈ラ・レ・ミ〉＝ とじきらない 和音）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS, C9A_TRIO_THEME } from './audio-c9a.js?v=ae1035a9a013';
import { C9C_TOOLS } from './audio-c9c.js?v=ae1035a9a013';
import { ALGOL_HEAD } from './audio-c10c.js?v=ae1035a9a013';

const { SHARP, FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;
const { shift } = C9C_TOOLS;
const F = { sp: FLAT };
const S = { sp: SHARP };

// ═════════════ c11c_hall: 光のさくの回ろう（イ短調 92）═════════════
// 光の さくが ならぶ 長い 道。相ぼうを 台に 立たせる なぞを 考える 曲。ひんやり（ベルの ふし）・少し きんちょう（リムの こちこち・
//   ハープの 8分・ベースの 4分）。A 問いかける → B 少し 高く（ソ# の きんちょう）→ A2（ラで おわる）。
//   pairStage 1 の 間は 低い のばし（少年の 色 ＝ c9c_algol の pad）が 1小節に 1つずつ 少年の ふしを 下へ たどる
const HL = {
  intro: ['Am', 'E'],
  A: ['Em', 'Am', 'C', 'F', 'Am', 'Dm', 'F', 'E'],
  B: ['Dm', 'Am', 'Dm', 'E', 'F', 'C', 'Dm', 'E'],
  A2: ['Em', 'Am', 'C', 'F', 'Am', 'Dm', 'F E', 'Am'],
};
const HALL_INTRO = 'r:16 r:8 E5:4 G#5:4';
const HALL_A = [
  'E5:4! G5:4 B5:6 r:2', 'A5:4! C6:4 E6:4 C6:4', 'C6:4! B5:2 A5:2 G5:8', 'A5:4! C6:4 F5:6 r:2',
  'E5:4! A5:4 C6:6 r:2', 'D6:4! F6:4 A6:4 F6:4', 'C6:4! A5:4 F5:4 A5:4', 'G#5:12! r:4',
];
const HALL_B = [
  'F6:6! E6:2 D6:8', 'E6:4! C6:4 A5:8', 'D6:4! F6:4 A6:6 r:2', 'G#6:8! E6:4 B5:4',
  'A6:6! G6:2 F6:8', 'E6:4! G6:4 C6:8', 'F6:4! D6:4 A5:4 D6:4', 'B5:8! G#5:4 E5:4',
];
const HALL_A2 = [...HALL_A.slice(0, 6), 'C6:4! A5:4 B5:4 G#5:4', 'A5:12! r:4'];
// 少年の ふし（シ・ラ・ソ・ファ・ミ・レ・ド）を 低く、1小節に 1つ。8小節めは 和音の 音
export const HALL_PAIR_A = 'B3:16 A3:16 G3:16 F3:16 E3:16 D3:16 C3:16 E3:16';
const HALL_PAIR_A2 = 'B3:16 A3:16 G3:16 F3:16 E3:16 D3:16 C3:16 A3:16';
// 考える きざみ（ハープの 8分）・こちこち（リムと シェイカー）
const HALL_PICK = '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2';
const HALL_DR = 'R:4? sh:2? sh:2? R:4? sh:2? sh:2?';
// 強さ（pairStage 0・1 → 0・1）
export const PAIR_INTENSITY = [0, 1];

const c11cHall = {
  bpm: 92, bar: 16, reverb: 0.45, fill: 0, night: {},
  parts: [
    { i: 'bell', v: 0.07, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.14, role: 'bass', minIntensity: 0 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // 相ぼうが 台に 立って いる 間だけ: 低い のばし（少年の 色）
    { i: 'pad', v: 0.06, role: 'harmony', minIntensity: 1, pan: 0 },
    { drums: true, v: 0.22, minIntensity: 0 },
  ],
  sections: {
    intro: [
      HALL_INTRO,
      bassLine(HL.intro, '1:16', { lo: 40, ...S }),
      arp(HL.intro, ['r:16', HALL_PICK], { center: 64, ...S }),
      pad(HL.intro, { center: 62, mods: '?', ...S }),
      'A3:16 B3:16',
      drums(2, 'r:16', { last: 'r:8 R:4? sh:2? sh:2?' }),
    ],
    A: [
      bars(HALL_A),
      bassLine(HL.A, '1:4! 1:4 1:4 1:4', { lo: 40, ...S }),
      arp(HL.A, HALL_PICK, { center: 64, ...S }),
      pad(HL.A, { center: 62, mods: '?', ...S }),
      HALL_PAIR_A,
      drums(8, HALL_DR, { last: 'R:4? sh:2? sh:2? tl:4? tl:4?' }),
    ],
    // 少し 高く
    B: [
      bars(HALL_B),
      bassLine(HL.B, '1:4! 1:4 5:4 1:4', { lo: 40, ...S }),
      arp(HL.B, '0:2 2:2 1:2 2:2 0:2 2:2 1:2 3:2', { center: 66, ...S }),
      pad(HL.B, { center: 64, mods: '?', ...S }),
      guide(HL.B, 'x:8 x:8', { center: 54, ...S }),
      drums(8, HALL_DR, { last: 'R:4? tl:4? tl:4? th:4?' }),
    ],
    A2: [
      bars(HALL_A2),
      bassLine(HL.A2, [...Array(7).fill('1:4! 1:4 1:4 1:4'), '1:16'], { lo: 40, ...S }),
      arp(HL.A2, HALL_PICK, { center: 64, ...S }),
      pad(HL.A2, { center: 62, mods: '?', ...S }),
      HALL_PAIR_A2,
      drums(8, HALL_DR, { first: 'tl:4? sh:2? sh:2? R:4? sh:2? sh:2?', last: 'R:4? r:12' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11c_rest: 小さな光（イ短調 → ハ長調 66）═════════════
// ひと休みの 小部屋。少年が 自分の 話を する。A は 少年の 曲（c9c_algol）の はじめの 4小節（ALGOL_HEAD）を
//   長さ 2ばい・強い しるし なしで、笛で やわらかく（つめたい ベル → あたたかい 笛）。B は 新しい ふしで ハ長調へ
//   （オルゴールの 小さな 光が ふえる）。さいごは ハ長調の 和音 ＝ かなしく しすぎない・少し 明るく
const slow = (list) => list.join(' ').trim().split(/\s+/).map((t) => {
  const m = /^([^:]+):(\d+)([!?.~]*)$/.exec(t);
  return `${m[1]}:${Number(m[2]) * 2}${m[3].replace('!', '')}`;
}).join(' ');
export const REST_SLOW = slow(ALGOL_HEAD);
const RS = {
  intro: ['Am', 'Em'],
  A: ['Em', 'Dm', 'Am', 'F', 'Am', 'F', 'Em', 'E'],
  B: ['F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'],
};
const REST_B = [
  'A5:8 C6:4 B5:4', 'B5:8 D6:4 G5:4', 'G5:8 B5:4 E6:4', 'C6:12 r:4',
  'A5:4 C6:4 F6:8', 'D6:8 B5:4 G5:4', 'E6:8 D6:4 C6:4', 'C6:12 r:4',
];
// 小さな 光（オルゴール。強い 拍は さける）
const REST_LIGHT = ['r:6 4:2? r:8', 'r:16'];
const REST_LIGHT_B = ['r:6 4:2? r:6 5:2?', 'r:2 3:2? r:4 r:6 4:2?'];

const c11cRest = {
  bpm: 66, bar: 16, reverb: 0.5, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    // 少年の 色（やわらかい のばし）
    { i: 'pad', v: 0.055, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { i: 'pluck', v: 0.043, role: 'harmony', minIntensity: 0, pan: 0.2 },
    // 小さな 光
    { i: 'musicbox', v: 0.036, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.17, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 E5:8',
      bassLine(RS.intro, '1:16', { lo: 33, ...S }),
      pad(RS.intro, { center: 62, mods: '?', ...S }),
      arp(RS.intro, '0:4 1:4 2:4 1:4', { center: 64, ...S }),
      arp(RS.intro, ['r:16', 'r:6 4:2? r:8'], { center: 82, ...S }),
      drums(2, 'r:16', { last: 'r:8 sh:4? r:4' }),
    ],
    A: [
      REST_SLOW,
      bassLine(RS.A, '1:16', { lo: 33, ...S }),
      pad(RS.A, { center: 62, mods: '?', ...S }),
      arp(RS.A, '0:4 1:4 2:4 1:4', { center: 64, ...S }),
      arp(RS.A, REST_LIGHT, { center: 82, ...S }),
      drums(8, ['r:16', 'r:8 sh:4? r:4']),
    ],
    // 小さな 光が ふえる（ハ長調へ）
    B: [
      bars(REST_B),
      bassLine(RS.B, [...Array(6).fill('1:8 5:8'), '1:8 5:8', '1:16'], { lo: 33, ...S }),
      pad(RS.B, { center: 64, mods: '?', ...S }),
      arp(RS.B, '0:4 1:4 2:4 3:4', { center: 64, ...S }),
      arp(RS.B, REST_LIGHT_B, { center: 82, ...S }),
      drums(8, ['tl:4? r:12', 'r:8 sh:4? r:4'], { last: 'r:16' }),
    ],
  },
  form: ['intro', 'A', 'B'],
  loopFrom: 1,
};

// ═════════════ c11c_join: いっしょに行こう（イ短調 → イ長調 150。くり返さない）═════════════
// 少年が なかまに なる 短い 曲（3小節 ＝ 4.8 秒）。ブラスの 小さな ファンファーレ。イ短調で 始まり（強がり）、
//   さいごは イ長調の 和音。ふしは 5度（ミ）で 止まる（いちばん 上の ラまで 行かない ＝ 明るすぎない）
const JN = ['Am', 'F G', 'A'];
export const JOIN_MEL = 'A5:2! r:2 A5:2 C6:2 E6:4! D6:2 C6:2 D6:4! C6:2 A5:2 B5:4! D6:4 E6:12! r:4';
const c11cJoin = {
  bpm: 150, bar: 16, once: true, reverb: 0.35, night: {},
  parts: [
    { i: 'brass', v: 0.07, role: 'lead' },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.32, minIntensity: 0 },
  ],
  sections: {
    S: [
      JOIN_MEL,
      bassLine(JN, ['1:4! 1:4 1:4 5:4', '1:4! 1:4 1:4! 1:4', '1:12! r:4'], { lo: 33, ...S }),
      pad(JN, { center: 60, mods: '?', ...S }),
      `${comp(JN.slice(0, 2), 'x:2! r:6 x:2 r:6', { center: 67, ...S })} ${pad(JN.slice(2), { center: 67, ...S })}`,
      `${rest(2)} ${arp(JN.slice(2), 'r:4 3:2? 4:2? 5:4? r:4', { center: 80, ...S })}`,
      'k:4! s:2 s:2 k:4 s:4 k:4! s:4 s:1 s:1 s:1 s:1 t:2 tl:2 c:8! r:8',
    ],
  },
  form: ['S'],
};

// ═════════════ c11c_mecha: やっぱりドタバタ3人組（イ長調 164）═════════════
// 3人組の メカ 3号。c9a_trio（ヘ長調 144）→ c9c_trio2（ト長調 156）→ これ（イ長調 164）。ふしは c9a_trio の ふしを 4つ 上げた 物
//   （c9c_trio2 から また 2つ 上げた ＝ 3つめ）。にぎやかで にくめない。前より 少し ごうか（ブラスが ずっと 鳴る・ファンファーレの C）。
//   A = c9a_trio の A → B 3つの 体（頭・うで・足。同じ 音を 3つずつ ガシャ ガシャ ガシャ）→ C ブラスの ファンファーレ → A2 → D メカ（c9a_trio の D）
export const MECHA_SHIFT = 4;
const TT = C9A_TRIO_THEME;
const shiftChord = (bar, d) => bar.trim().split(/\s+/).map((sym) => {
  const r = /^([A-G][#b]?)(.*)$/.exec(sym);
  const pc = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }[r[1]];
  return `${SHARP[(pc + d + 12) % 12]}${r[2]}`;
}).join(' ');
const MC = {
  intro: ['A', 'E7'],
  A: TT.chords.A.map((b) => shiftChord(b, MECHA_SHIFT)),
  B: ['F#m', 'F#m', 'C#7', 'C#7', 'F#m', 'Bm', 'C#7', 'C#7'],
  C: ['D', 'E', 'C#m', 'F#m', 'Bm', 'E', 'A', 'E7'],
  A2: TT.chords.A2.map((b) => shiftChord(b, MECHA_SHIFT)),
  D: TT.chords.D.map((b) => shiftChord(b, MECHA_SHIFT)),
};
const MECHA_A = TT.A.map((b) => shift(b, MECHA_SHIFT));
const MECHA_A2 = TT.A2.map((b) => shift(b, MECHA_SHIFT));
const MECHA_D = TT.D.map((b) => shift(b, MECHA_SHIFT));
// 3つの 体（同じ 音を 3つずつ）
const MECHA_B = [
  'F#5:2.! F#5:2. F#5:2. r:2 A5:2.! A5:2. A5:2. r:2', 'C#6:2.! C#6:2. C#6:2. r:2 F#6:4! r:4',
  'G#5:2.! G#5:2. G#5:2. r:2 B5:2.! B5:2. B5:2. r:2', 'B5:4! G#5:4 C#6:4! r:4',
  'A5:2.! A5:2. A5:2. r:2 C#6:2.! C#6:2. C#6:2. r:2', 'D6:2.! D6:2. D6:2. r:2 F#6:4! D6:4',
  'C#6:2.! B5:2. G#5:2. r:2 G#5:4! r:4', 'C#6:2.! r:2 C#6:2. r:2 G#5:4! r:4',
];
// ブラスの ファンファーレ（ごうか）
const MECHA_C = [
  'F#5:2! A5:2 D6:2 F#6:2 A6:4! F#6:4', 'G#5:2! B5:2 E6:2 G#6:2 B5:4! E6:4',
  'E6:4! C#6:2 G#5:2 C#6:4! E6:4', 'F#6:8! C#6:4 A5:4',
  'D6:2! C#6:2 B5:2 C#6:2 D6:4! F#6:4', 'E6:2! D6:2 C#6:2 B5:2 G#5:4! B5:4',
  'A5:4! C#6:4 E6:4! A6:4', 'G#6:2.! r:2 E6:2. r:2 D6:2.! r:2 B5:2. r:2',
];
const OOMPAH = '1:4! 5:4 1:4 5:4';
// 3号の「ジャン ジャン ジャン」
export const MECHA_HITS = 'x:2! r:2 x:2! r:2 x:2! r:6';

const c11cMecha = {
  bpm: 164, bar: 16, reverb: 0.2, fill: 0, night: {},
  parts: [
    { i: 'lead', w: 'square', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'marimba', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.3 },
    // ごうか: ブラスが ずっと 鳴る
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'chip_arp', v: 0.022, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.5, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(MC.intro, ['1:2! r:2 1:2! r:2 1:2! r:6', '1:2 1:2 1:2 1:2 5:8!'], { lo: 40, ...S }),
      rest(2),
      comp(MC.intro, [MECHA_HITS, 'x:2.! r:2 x:2.! r:2 x:2.! r:2 x:4!'], { center: 64, ...S }),
      arp(MC.intro, ['r:16', '0:1 1:1 2:1 3:1 4:1 5:1 r:10'], { center: 79, ...S }),
      drums(2, ['k:2! r:2 k:2! r:2 k:2! r:6', 'k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1 c:4!']),
    ],
    A: [
      bars(MECHA_A),
      bassLine(MC.A, OOMPAH, { lo: 40, ...S }),
      comp(MC.A, 'r:4 x:4. r:4 x:4.', { center: 68, ...S }),
      guide(MC.A, 'x:4 x:4 x:8', { center: 62, ...S }),
      arp(MC.A, 'r:8 0:1? 1:1? 2:1? r:5', { center: 79, ...S }),
      drums(8, 'k:4! s:4 k:4 s:4', { last: 'k:4! s:4 s:2 s:2 t:2 tl:2' }),
    ],
    // 3つの 体（頭・うで・足）
    B: [
      bars(MECHA_B),
      bassLine(MC.B, '1:2.! r:2 1:2. 5:2. 1:2.! r:2 8:2. 5:2.', { lo: 40, ...S }),
      arp(MC.B, '0:2. r:2 1:2. r:2 2:2. r:2 1:2. r:2', { center: 66, ...S }),
      comp(MC.B, 'x:2.! x:2. x:2. r:10', { center: 60, ...S }),
      arp(MC.B, 'r:2 2:1? 1:1? 0:1? r:11', { center: 79, ...S }),
      drums(8, 'k:2! k:2 k:2 r:2 s:4 p:4', { last: 'k:2! r:2 k:2! r:2 r:4 c:4!' }),
    ],
    // ファンファーレ（ごうか）
    C: [
      bars(MECHA_C),
      bassLine(MC.C, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 40, ...S }),
      comp(MC.C, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 68, ...S }),
      guide(MC.C, 'x:4 x:4 x:4 x:4', { center: 64, ...S }),
      arp(MC.C, '0:1? 1:1? 2:1? 3:1? r:12', { center: 79, ...S }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    A2: [
      bars(MECHA_A2),
      bassLine(MC.A2, '1:4! 5:2 5:2 1:4 5:4', { lo: 40, ...S }),
      comp(MC.A2, 'r:4 x:2. x:2. r:4 x:2. x:2.', { center: 68, ...S }),
      guide(MC.A2, 'x:4 x:4 x:4 x:4', { center: 65, ...S }),
      arp(MC.A2, 'r:8 0:1? 1:1? 2:1? r:5', { center: 79, ...S }),
      drums(8, 'k:4! s:2 k:2 k:4 s:4', { first: 'c:4! s:2 k:2 k:4 s:4', last: 'k:4! s:2 s:2 s:1 s:1 t:1 t:1 tl:2 c:2!' }),
    ],
    // メカ（同じ 音を きざむ）
    D: [
      bars(MECHA_D),
      bassLine(MC.D, '1:2.! 1:2. 1:2. 1:2. 1:4! 5:4', { lo: 40, ...S }),
      arp(MC.D, '0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1', { center: 70, ...S }),
      comp(MC.D, 'x:4! r:4 x:4! r:4', { center: 62, ...S }),
      arp(MC.D, '0:1? 1:1? 2:1? r:13', { center: 79, ...S }),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', { last: 'k:2! k:2 s:2! s:2 t:2 t:2 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
  // ピンチ: 主音（ラ）と 半音の となり（こまって いるのに どこか おかしい）
  pinch: { n: 'A6:2 G#6:2 A6:2 E6:2 A6:2 G#6:2 A6:2 Bb6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c11c_ace: カードの行進（ト短調 124）═════════════
// カードの よろいの、きちんと した 隊長（幕の ボス）。きっちり した 行進（ブラスの ふし・ベースの ブン・チャッ・スネア）。
//   どこも 3小節で 1組（カード 3まい）: 1小節め ベルが 3つの 音で カードを ならべる → 3小節めの おわりに めくる 音（シェイカー ＋ リム ＝
//   紙と 木）。ふしの 組の 頭は 3つの 音の 合図（短・短・長）。区切りは 3小節 × 3 ＝ 9小節（イントロは 3小節 ＝ 1組）。
//   A ト短調 → B 変ロ長調（カードの マーク）→ A2。ボスの だんで テンポだけ 上がる（1・1.1・1.18・1.25 倍）
export const ACE_GROUP = 3;
const AC = {
  intro: ['Gm', 'Gm', 'D'],
  A: ['Gm', 'Gm', 'D', 'Cm', 'Gm', 'D', 'Eb', 'Cm D', 'Gm'],
  B: ['Bb', 'F', 'Bb', 'Eb', 'Bb', 'F', 'Cm', 'D', 'D'],
  A2: ['Gm', 'Gm', 'D', 'Cm', 'Gm', 'D', 'Eb', 'Cm D', 'Gm'],
};
const ACE_INTRO = ['D5:2! D5:2 G5:4! r:8', 'r:16', 'r:8 D5:4 F#5:4'];
const ACE_A = [
  'D5:2! D5:2 G5:4 Bb5:4! A5:2 G5:2', 'D6:4! C6:2 Bb5:2 A5:4! G5:4', 'F#5:4! A5:4 D6:4! r:4',
  'C6:2! C6:2 Eb6:4 G6:4! Eb6:4', 'D6:4! Bb5:2 A5:2 G5:4! Bb5:4', 'A5:4! F#5:4 D5:4! r:4',
  'Bb5:2! Bb5:2 Eb6:4 G6:4! F6:2 Eb6:2', 'Eb6:4! D6:2 C6:2 A5:4! F#5:4', 'G5:4! D5:4 G5:4! r:4',
];
const ACE_B = [
  'F5:2! F5:2 Bb5:4 D6:4! C6:2 Bb5:2', 'C6:4! A5:2 F5:2 A5:4! C6:4', 'D6:4! F6:4 Bb5:4! r:4',
  'G5:2! G5:2 Bb5:4 Eb6:4! D6:2 C6:2', 'D6:4! Bb5:2 F5:2 Bb5:4! D6:4', 'C6:4! A5:4 F5:4! r:4',
  'C6:2! C6:2 Eb6:4 G5:4! C6:4', 'D6:4! A5:2 F#5:2 A5:4! C6:4', 'F#5:4! A5:4 D6:4! r:4',
];
const ACE_A2 = [...ACE_A.slice(0, 8), 'G5:4! Bb5:4 G5:4! r:4'];
// 3小節で 1組: ならべる・ならべる・めくる（さいごの シェイカー ＋ リム）
export const ACE_FLIP = 'sh:1? R:1!';
const ACE_DR = ['k:4! s:4 k:4 s:4', 'k:4! s:4 k:2 k:2 s:4', `k:4! s:4 k:2 s:2 ${ACE_FLIP} r:2`];
// カードを ならべる 3つの 音（ベル）
const ACE_CARDS = ['r:8 0:2? 1:2? 2:2? r:2', 'r:16', 'r:16'];
export const ACE_TEMPOS = [1, 1.1, 1.18, 1.25];

const c11cAce = {
  bpm: 124, bar: 16, reverb: 0.25, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.07, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // カードの ひかり
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(ACE_INTRO),
      bassLine(AC.intro, ['1:4! r:12', '1:4! r:12', '1:4! r:4 1:4 5:4'], { lo: 38, ...F }),
      comp(AC.intro, ['r:16', 'r:16', 'x:2! r:2 x:2 r:2 x:2! r:6'], { center: 64, ...F }),
      arp(AC.intro, ['r:8 0:2? 1:2? 2:2? r:2', 'r:8 0:2? 1:2? 2:2? r:2', 'r:8 0:2? 1:2? 2:2? r:2'], { center: 79, ...F }),
      pad(AC.intro, { center: 60, mods: '?', ...F }),
      drums(3, 'k:4! r:12', { last: `k:4! s:2 s:2 s:1 s:1 s:2 ${ACE_FLIP} r:2` }),
    ],
    A: [
      bars(ACE_A),
      bassLine(AC.A, '1:4! 5:4 1:4 5:4', { lo: 38, ...F }),
      comp(AC.A, 'r:2 x:2 r:2 x:2 r:2 x:2 r:2 x:2', { center: 64, ...F }),
      arp(AC.A, ACE_CARDS, { center: 79, ...F }),
      pad(AC.A, { center: 60, mods: '?', ...F }),
      drums(9, ACE_DR),
    ],
    // カードの マーク（変ロ長調）
    B: [
      bars(ACE_B),
      bassLine(AC.B, '1:4! 5:4 8:4 5:4', { lo: 38, ...F }),
      comp(AC.B, 'x:2! r:2 x:2 r:2 x:2! r:2 x:2 r:2', { center: 65, ...F }),
      arp(AC.B, ACE_CARDS, { center: 81, ...F }),
      pad(AC.B, { center: 62, ...F }),
      drums(9, ACE_DR, { last: `k:2! s:1 s:1 s:2 s:2 s:1 s:1 s:2 ${ACE_FLIP} r:2` }),
    ],
    A2: [
      bars(ACE_A2),
      bassLine(AC.A2, '1:4! 5:4 1:4 5:4', { lo: 38, ...F }),
      comp(AC.A2, 'r:2 x:2 r:2 x:2 r:2 x:2 r:2 x:2', { center: 64, ...F }),
      arp(AC.A2, ACE_CARDS, { center: 79, ...F }),
      pad(AC.A2, { center: 62, ...F }),
      drums(9, ACE_DR, { first: 'c:4! s:4 k:4 s:4' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
  // ボスの だん: テンポだけ 上がる（調は かえない）
  phases: ACE_TEMPOS.map((tempo) => ({ transpose: 0, tempo })),
  // ピンチ: カードを くる ハープの 16分（ソと レ）
  pinch: { n: Array.from({ length: 8 }, () => 'G6:1 D6:1').join(' '), i: 'pluck', v: 0.03 },
};

// ═════════════ c11c_door: 大とびらがひらく（ニ長調 96。くり返さない）═════════════
// 王宮の 大とびら。4小節 ＝ 10 秒。1小節め かねが 2つ（レ・ラ）→ 2小節め かね（レ・ファ#）と 低い タムが ゆっくり →
//   3小節め タムが だんだん こまかく（大きな 物が 開いて いく）・弦が のぼる → 4小節め シンバルと オルゴールの まぶしい 光。
//   おわりは Asus4（ラ・レ・ミ）で とじない（先が ある）
const DR = ['D', 'Bm', 'G', 'Asus4'];
export const DOOR_LAST = DR.at(-1);
const c11cDoor = {
  bpm: 96, bar: 16, once: true, reverb: 0.6, night: {},
  parts: [
    // かね
    { i: 'bell', v: 0.08, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // まぶしい 光
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'organ', v: 0.025, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.34, minIntensity: 0 },
  ],
  sections: {
    S: [
      'D6:4! r:4 A5:4! r:4 D6:4! r:4 F#6:4! r:4 G6:8! D6:4 B5:4 A6:16!',
      bassLine(DR, ['1:16', '1:16', '1:8 5:8', '1:16'], { lo: 33, ...S }),
      `${pad(DR.slice(0, 2), { center: 60, mods: '?', ...S })} ${pad(DR.slice(2), { center: 64, ...S })}`,
      `${rest(2)} ${arp(DR.slice(2, 3), 'r:8 0:2? 1:2? 2:2? 3:2?', { center: 76, ...S })} ${arp(DR.slice(3), '3:1 4:1 5:1 6:1 5:1 4:1 5:1 6:1 7:2 r:6', { center: 76, ...S })}`,
      `${rest(1)} ${pad(DR.slice(1), { center: 67, mods: '?', ...S })}`,
      'tl:4! r:12 tl:8? tl:4? tl:4 tl:2 tl:2 tl:2 tl:2 tl:1 tl:1 t:1 t:1 t:1 th:1 th:1 th:1 c:8! r:8',
    ],
  },
  form: ['S'],
};

for (const tr of [c11cHall, c11cRest, c11cJoin, c11cMecha, c11cAce, c11cDoor]) tr.ch = oldView(tr);

// テストが 見る ふし・和音
export const C11C_LINES = {
  hallA: HALL_A, hallB: HALL_B, hallA2: HALL_A2, restB: REST_B, mechaA: MECHA_A, mechaA2: MECHA_A2, mechaB: MECHA_B, mechaD: MECHA_D,
  aceIntro: ACE_INTRO, aceA: ACE_A, aceB: ACE_B, aceA2: ACE_A2,
};
export const C11C_CHORDS = { hall: HL, rest: RS, join: JN, mecha: MC, ace: AC, door: DR };

// 曲の id は docs/plan-part3-c11c.md の 19-5（かえない）
export const C11C_TRACKS = {
  c11c_hall: c11cHall,
  c11c_rest: c11cRest,
  c11c_join: c11cJoin,
  c11c_mecha: c11cMecha,
  c11c_ace: c11cAce,
  c11c_door: c11cDoor,
};
export const C11C_IDS = Object.keys(C11C_TRACKS);
