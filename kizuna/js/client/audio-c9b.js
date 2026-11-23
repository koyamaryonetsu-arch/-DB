// 第91回 F: 第3部 第1章 第2幕「鉱山の底の先」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3.md の「実装メモ（第2幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。大王の 曲も もとの 作品の メロディを 借りて いない）
//
// ・c9b_under … 大地の下（ホ短調 80。広くて 暗いが こわく ない。水晶の 柱を ともした 数 pillarStage 0〜6 で 楽器が 1つずつ ふえる）
// ・c9b_village … ヒカリゴケの里（ニ長調 104。マリンバの ぽこぽこした 村。B は 明かりが へった しずかな 区切り）
// ・c9b_hall … 大王のやしき（イ短調 100。ぬき足 さし足の スタッカート。B は 見つかりそうな どきどき・C は ごちそうの 間で にんまり）
// ・c9b_king … デデドン大王（ハ短調 132。いばった 行進。どっしり した 低い 音。C は にくめない おどけた 区切り）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=28060a38724e';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;

// ═════════════ c9b_under: 大地の下（ホ短調 80）═════════════
// 広い 暗やみ。ゆっくりの 笛・ハープの しずく・のばしの 和音。ロ長調の 和音（レ#）と ト長調・ハ長調の 和音で、ふしぎで 少し さびしいが こわく ない。
//   水晶の 柱を ともした 数（pillarStage 0〜6 → 強さ 0.4〜1.0。audio-scene.js）で 楽器が 1つずつ ふえる:
//   0 のばし・しずく（ごく しずか）→ 1 ＋ 笛 → 2 ＋ 低音 → 3 ＋ リムの きざみ → 4 ＋ ベル（星の子の 7つの 音）→ 5 ＋ 低い タム → 6 ＋ キックと スネア
//   スピカが いっしょに 歩いて いる しるしに、イントロの しずくと B の さいごの ベルで 星の子の 7つの 音（ソ〜ファ#。C9A_SEVEN の 形）を 小さく のぼる
const UNDER = {
  intro: ['Em', 'C'],
  A: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'D', 'B'],
  B: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'C'],
  A2: ['Em', 'C', 'Am', 'Em', 'C', 'D', 'Bm', 'B'],
};
const UNDER_A = [
  'B4:8! E5:4 G5:4', 'G5:6 E5:2 C5:8', 'A4:8 C5:4 E5:4', 'D#5:12 r:4',
  'E5:8! G5:4 B5:4', 'C6:6 B5:2 G5:8', 'A5:6 F#5:2 D5:8', 'F#5:8 D#5:4 B4:4',
];
const UNDER_B = [
  'E5:6! G5:2 C6:8', 'D6:6 C6:2 A5:8', 'B5:6 A5:2 F#5:8', 'G5:12 r:4',
  'A5:6 B5:2 C6:8', 'D6:6 E6:2 F#6:8', 'G5:16', 'C6:8 G5:4 E5:4',
];
const UNDER_A2 = [
  'E5:4! G5:4 B5:4 E6:4', 'E6:6 D6:2 C6:8', 'C6:6 B5:2 A5:8', 'G5:6 F#5:2 E5:8',
  'E5:6 G5:2 C6:8', 'D6:6 C6:2 A5:4 F#5:4', 'F#5:6 D5:2 B4:8', 'D#5:8 F#5:4 B5:4',
];
// 星の子の 7つの 音（ド〜シ の 形）を ト長調で（ソ・ラ・シ・ド・レ・ミ・ファ#）→ さいごに 上の ソ
const SEVEN_UP = (oct) => ['G', 'A', 'B', 'C', 'D', 'E', 'F#'].map((n, k) => `${n}${k < 3 ? oct : oct + 1}`);
const SPIKA = `${SEVEN_UP(5).map((n) => `${n}:2?`).join(' ')} G6:2?`;
const DRIP = '0:2. r:2 2:2. r:2 1:2. r:2 3:2. r:2';

const c9bUnder = {
  bpm: 80, bar: 16, reverb: 0.45, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead', minIntensity: 0.5 },
    { i: 'sub_bass', v: 0.16, role: 'bass', minIntensity: 0.6 },
    { i: 'pad', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { i: 'pluck', v: 0.055, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { i: 'bell', v: 0.032, role: 'harmony', minIntensity: 0.8, pan: -0.05 },
    { drums: true, v: 0.28, minIntensity: 0.7 },
    { drums: true, v: 0.3, minIntensity: 0.9 },
    { drums: true, v: 0.32, minIntensity: 1 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 G4:8?']),
      bassLine(UNDER.intro, '1:16', { lo: 40 }),
      pad(UNDER.intro, { center: 62 }),
      // しずくが 星の子の 7つの 音を 1つずつ（スピカの 足音）
      `${SPIKA} ${arp(['C'], DRIP, { center: 76 })}`,
      rest(2),
      drums(2, 'r:16', { last: 'r:12 R:4?' }),
      rest(2),
      rest(2),
    ],
    A: [
      bars(UNDER_A),
      bassLine(UNDER.A, '1:8! 5:8', { lo: 40 }),
      pad(UNDER.A, { center: 62 }),
      arp(UNDER.A, DRIP, { center: 76 }),
      `${rest(4)} ${guide(UNDER.A.slice(4), 'x:8 x:8', { center: 81 })}`,
      drums(8, 'R:4! r:4 h:2? r:2 R:4?'),
      drums(8, 'tl:4! r:12', { last: 'tl:4! r:4 tl:2? r:2 t:2? r:2' }),
      drums(8, 'k:4! r:4 s:4? r:4'),
    ],
    B: [
      bars(UNDER_B),
      bassLine(UNDER.B, '1:8! 5:4 8:4', { lo: 40 }),
      pad(UNDER.B, { center: 64 }),
      arp(UNDER.B, '0:2. 2:2. 1:2. 3:2. 2:2. 4:2. 3:2. 1:2.', { center: 76 }),
      // さいごの 2小節: ベルが 星の子の 7つの 音を のぼって 上の ソ
      `${rest(6)} ${SPIKA} G6:8? r:8`,
      drums(8, 'R:2! h:2? h:2? h:2? R:2 h:2? h:2? h:2?'),
      drums(8, 'tl:4! r:4 t:4? r:4'),
      drums(8, 'k:4! h:2? r:2 s:4 r:2 k:2?'),
    ],
    A2: [
      bars(UNDER_A2),
      bassLine(UNDER.A2, '1:6! 1:2 5:8', { lo: 40 }),
      pad(UNDER.A2, { center: 63 }),
      arp(UNDER.A2, '0:2. r:2 2:2. 1:2. r:2 3:2. 2:2. r:2', { center: 78 }),
      guide(UNDER.A2, 'x:4 x:4 x:8', { center: 79 }),
      drums(8, 'R:4! h:2? h:2? R:4 h:2? R:2?'),
      drums(8, 'tl:4! r:4 tl:4? r:4'),
      drums(8, 'k:4! h:2? h:2? s:4! h:2? k:2?', { last: FILL }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c9b_village: ヒカリゴケの里（ニ長調 104）═════════════
// 小さな 地下の 民の 村。マリンバの ぽこぽこ（スタッカートの 8分）・ベースの ブン ブン・ハープの うら打ち・オルゴールの 光る こけ。
//   B は 明かりが へって 少し 元気が ない 区切り（ロ短調。たいこは リムだけ・マリンバは ゆっくり・笛が さびしく よりそう）
//   C は 元気が もどる 短い はし（ト → イ → ロ短調 → イ）
const VIL = {
  intro: ['D', 'A'],
  A: ['D', 'G', 'D', 'A', 'D', 'G', 'A7', 'D'],
  B: ['Bm', 'Em', 'A', 'D', 'Bm', 'G', 'Em', 'A'],
  A2: ['D', 'G', 'D', 'A', 'Bm', 'G', 'A7', 'D'],
  C: ['G', 'A', 'Bm', 'A'],
};
const VIL_A = [
  'A4:2.! D5:2. F#5:2. A5:2. F#5:4 D5:4', 'B5:2.! A5:2. G5:2. A5:2. B5:4 G5:4', 'A5:2.! F#5:2. D5:2. F#5:2. A5:4 r:4', 'E5:2.! F#5:2. G5:2. F#5:2. E5:4 C#5:4',
  'F#5:2.! A5:2. D6:2. A5:2. F#5:4 A5:4', 'G5:2.! B5:2. D6:2. B5:2. G5:4 D5:4', 'E5:2.! G5:2. C#6:2. E6:2. C#6:4 A5:4', 'D6:4! A5:2. F#5:2. D5:4! r:4',
];
const VIL_B = [
  'F#5:8 D5:4 B4:4', 'G5:8 E5:4 B4:4', 'A4:6 C#5:2 E5:8', 'F#5:12 r:4',
  'B4:8 D5:4 F#5:4', 'G5:6 A5:2 B5:8', 'B5:6 A5:2 G5:4 E5:4', 'E5:8 C#5:4 A4:4',
];
const VIL_A2 = [
  'A4:2.! D5:2. F#5:2. A5:2. D6:4 A5:4', 'B5:2.! D6:2. B5:2. G5:2. D5:4 G5:4', 'F#5:2.! A5:2. D6:2. F#6:2. D6:2. A5:2. F#5:4', 'E5:2.! A5:2. C#6:2. A5:2. E5:4 r:4',
  'D5:2.! F#5:2. B5:2. F#5:2. D5:4 F#5:4', 'G5:2.! B5:2. D6:2. B5:2. G5:4 B5:4', 'C#6:2.! B5:2. A5:2. G5:2. E5:4 C#5:4', 'D5:4! F#5:2. A5:2. D6:4! r:4',
];
const VIL_C = ['D5:4 G5:4 B5:4 D6:4', 'C#6:4 B5:4 A5:4 E5:4', 'D6:4 C#6:4 B5:4 F#5:4', 'E5:4 C#5:4 A4:8'];
const VIL_COMP = 'r:4 x:2. r:2 r:4 x:2. r:2';

const c9bVillage = {
  bpm: 104, bar: 16, reverb: 0.26, night: {},
  parts: [
    { i: 'marimba', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'pluck', v: 0.034, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'flute', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'musicbox', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0.05 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 A4:2.? C#5:2.? E5:2.? r:2']),
      bassLine(VIL.intro, '1:4! 5:4 1:4 5:4', { lo: 38 }),
      comp(VIL.intro, VIL_COMP, { center: 66 }),
      rest(2),
      bars(['F#6:2? r:6 A6:2? r:6', 'E6:2? r:6 C#6:2? r:6']),
      drums(2, 'R:4? r:4 R:4? r:4', { last: 'R:4! r:4 R:2 R:2 R:2 R:2' }),
    ],
    A: [
      bars(VIL_A),
      bassLine(VIL.A, '1:4! 5:4 1:4 5:4', { lo: 38 }),
      comp(VIL.A, VIL_COMP, { center: 66 }),
      rest(8),
      arp(VIL.A, '0:2? r:6 2:2? r:6', { center: 86 }),
      drums(8, 'k:4! R:2? R:2 s:4 R:2? k:2?'),
    ],
    // 明かりが へった しずかな 区切り
    B: [
      bars(VIL_B),
      bassLine(VIL.B, '1:8 5:8', { lo: 38 }),
      arp(VIL.B, '0:4? r:4 1:4? r:4', { center: 62 }),
      guide(VIL.B, 'x:8 x:8', { center: 69 }),
      bars(['r:16', 'r:16', 'r:16', 'r:12 A6:4?', 'r:16', 'r:16', 'r:16', 'r:12 C#6:4?']),
      drums(8, 'R:8? r:8', { last: 'R:4? r:4 R:2? R:2 R:2 R:2' }),
    ],
    A2: [
      bars(VIL_A2),
      bassLine(VIL.A2, '1:2! r:2 5:2 r:2 8:2! r:2 5:2 r:2', { lo: 38 }),
      comp(VIL.A2, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 66 }),
      guide(VIL.A2, 'x:8 x:8', { center: 76 }),
      arp(VIL.A2, '0:2? 2:2? 1:2? 3:2? r:8', { center: 86 }),
      drums(8, 'k:4! R:2? h:2? s:4 R:2? k:2?', { first: 'c:4! R:2? h:2? s:4 R:2? k:2?' }),
    ],
    C: [
      bars(VIL_C),
      bassLine(VIL.C, '1:4! 1:4 5:4 8:4', { lo: 38 }),
      comp(VIL.C, VIL_COMP, { center: 66 }),
      guide(VIL.C, 'x:4 x:4 x:8', { center: 74 }),
      arp(VIL.C, '0:2 2:2 1:2 3:2 2:2 4:2 3:2 1:2', { center: 84 }),
      drums(4, 'k:4! h:2? h:2? s:4! h:2? h:2?', { last: 'k:2! r:2 s:2 s:1 s:1 t:2 t:2 tl:2 tl:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2', 'C'],
  loopFrom: 1,
};

// ═════════════ c9b_hall: 大王のやしき（イ短調 100）═════════════
// ぬき足 さし足（スタッカートの ハープの メロディ・ベースの ぬき足・リムの こつこつ）。ブラスの「ブッ」・ベルの「ドキッ」で こっけいに。
//   B は 見つかりそうな どきどき（弦の のばし・低い タムの 心ぞう）→ A2 → C は ごちそうの 間（ハ長調。にんまり しながら こっそり）
const HALL = {
  intro: ['Am', 'E'],
  A: ['Am', 'E', 'Am', 'E', 'F', 'C', 'Dm', 'E'],
  B: ['Dm', 'Dm', 'Am', 'Am', 'F', 'E', 'F', 'E'],
  A2: ['Am', 'E', 'Am', 'E', 'F', 'C', 'Dm E', 'Am'],
  C: ['C', 'G', 'C', 'G', 'F', 'C', 'Dm', 'E'],
};
const HALL_A = [
  'A4:2.! r:2 C5:2. r:2 E5:2.! r:2 C5:2. r:2', 'B4:2.! r:2 G#4:2. r:2 E5:2.! r:2 r:4', 'A4:2.! r:2 C5:2. r:2 E5:2.! r:2 A5:2.! r:2', 'G#5:2.! A5:2. G#5:2. F5:2. E5:2.! r:6',
  'A5:2.! r:2 F5:2. r:2 C5:2.! r:2 F5:2. r:2', 'G5:2.! r:2 E5:2. r:2 C5:2.! r:2 E5:2. r:2', 'F5:2.! r:2 D5:2. r:2 A5:2.! G#5:2. A5:2. B5:2.', 'G#5:4! r:4 E5:2. r:2 r:4',
];
const HALL_B = [
  'D5:2.! E5:2. F5:2. r:2 A5:4! r:4', 'A5:2.! G5:2. F5:2. E5:2. D5:4! r:4', 'C5:2.! D5:2. E5:2. r:2 A5:4! r:4', 'A5:2.! G#5:2. A5:2. B5:2. C6:4! r:4',
  'C6:2.! B5:2. A5:2. G5:2. F5:4! r:4', 'E5:2.! F5:2. G#5:2. r:2 B5:4! r:4', 'A5:2.! r:2 C6:2. r:2 F6:4! r:4', 'E6:4! r:4 B5:2.? r:2 G#5:2.? r:2',
];
const HALL_A2 = [
  'E5:2.! r:2 A5:2. r:2 C6:2.! r:2 A5:2. r:2', 'B5:2.! r:2 G#5:2. r:2 E5:2.! r:2 G#5:2. r:2', 'A5:2.! r:2 C6:2. r:2 E6:2.! r:2 C6:2. r:2', 'B5:2.! C6:2. B5:2. A5:2. G#5:2.! r:6',
  'F5:2.! r:2 A5:2. r:2 C6:2.! r:2 A5:2. r:2', 'E5:2.! r:2 G5:2. r:2 C6:2.! r:2 G5:2. r:2', 'F5:2.! r:2 A5:2. r:2 G#5:2.! r:2 B5:2. r:2', 'A5:4! r:4 r:2 E5:2.? A4:2.! r:2',
];
const HALL_C = [
  'E5:2.! G5:2. C6:2. G5:2. E5:2.! G5:2. C6:2. r:2', 'D5:2.! G5:2. B5:2. G5:2. D5:2.! G5:2. B5:2. r:2', 'G5:2.! C6:2. E6:2. C6:2. G5:2.! E5:2. C5:2. r:2', 'B4:2.! D5:2. G5:2. D5:2. B4:4! r:4',
  'A5:2.! C6:2. F6:2. C6:2. A5:2.! F5:2. C5:2. r:2', 'G5:2.! E5:2. C5:2. E5:2. G5:4! r:4', 'F5:2.! E5:2. D5:2. E5:2. F5:2.! A5:2. D6:2. r:2', 'B5:4! r:4 G#5:2.? r:2 E5:2.? r:2',
];
const TIPTOE = 'R:2! r:2 h:2? r:2 R:2 r:2 h:2? r:2';

const c9bHall = {
  bpm: 100, bar: 16, reverb: 0.3, night: {},
  parts: [
    { i: 'pluck', v: 0.17, role: 'lead' },
    { i: 'bass', v: 0.25, role: 'bass' },
    { i: 'strings', v: 0.06, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'bell', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 B4:2.? r:2 E5:2.? r:2']),
      bassLine(HALL.intro, '1:2.! r:6 1:2.! r:6', { lo: 33 }),
      pad(HALL.intro, { center: 57, mods: '?' }),
      `${comp(['Am'], 'x:2.! r:14', { center: 60 })} r:16`,
      rest(2),
      drums(2, 'R:2! r:6 R:2? r:6', { last: 'R:2! r:6 R:2? r:2 R:2? R:2?' }),
    ],
    A: [
      bars(HALL_A),
      bassLine(HALL.A, '1:2.! r:2 5:2. r:2 1:2.! r:2 5:2. r:2', { lo: 33 }),
      // 弦は ささやく（B で 大きく なる）
      pad(HALL.A, { center: 57, mods: '?' }),
      // ブッ（4小節め の うら・8小節め の 頭）
      `${rest(3)} ${comp([HALL.A[3]], 'r:12 x:2.? r:2', { center: 60 })} ${rest(3)} ${comp([HALL.A[7]], 'x:2.! r:14', { center: 60 })}`,
      `${rest(7)} r:8 B6:2? r:6`,
      drums(8, TIPTOE),
    ],
    // 見つかりそう（どきどき）
    B: [
      bars(HALL_B),
      bassLine(HALL.B, '1:2.! r:6 1:2.! r:6', { lo: 33 }),
      pad(HALL.B, { center: 60 }),
      rest(8),
      `${rest(7)} r:8 G#6:2? r:6`,
      drums(8, 'tl:4! r:2 tl:2? r:8', { last: 'tl:2! tl:2 r:2 tl:2 t:2 r:2 th:2? th:2' }),
    ],
    A2: [
      bars(HALL_A2),
      bassLine(HALL.A2, '1:2.! r:2 8:2. r:2 5:2.! r:2 8:2. r:2', { lo: 33 }),
      pad(HALL.A2, { center: 62 }),
      `${rest(7)} ${comp([HALL.A2[7]], 'x:2.! r:6 x:2.! r:6', { center: 60 })}`,
      rest(8),
      drums(8, 'k:2! r:2 h:2? r:2 R:2 r:2 h:2? R:2?'),
    ],
    // ごちそうの 間（にんまり）
    C: [
      bars(HALL_C),
      bassLine(HALL.C, '1:2.! 5:2. 8:2. 5:2. 1:2.! 5:2. 8:2. 5:2.', { lo: 33 }),
      pad(HALL.C, { center: 60, mods: '?' }),
      comp(HALL.C, 'r:4 x:2.? r:2 r:4 x:2.? r:2', { center: 62 }),
      arp(HALL.C, '0:2? r:6 2:2? r:6', { center: 86 }),
      drums(8, 'k:2! h:2? R:2 h:2? k:2 h:2? R:2 h:2?', { last: 'k:2! r:2 R:2 R:2 t:2 t:2 tl:2 r:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2', 'C'],
  loopFrom: 1,
};

// ═════════════ c9b_king: デデドン大王（ハ短調 132）═════════════
// いばった 行進（ブラスの ふし・ベースの どっしりした ブン・チャ・ティンパニの ドン）。でも にくめない（C は ハ長調の おどけた 区切り。マリンバの うら打ち）。
//   A 行進（ハ短調）→ B いばった ファンファーレ（変ホ長調）→ C おどけ（おなかが すいた）→ A2 → D 大ジャンプ（いちばん 高く。さいごは タムの 下りの あと シンバル）
//   もとの 作品（ある ゲームの 大王の テーマ）の メロディは 借りて いない
const KING = {
  intro: ['Cm', 'G'],
  A: ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Fm', 'G', 'G'],
  B: ['Eb', 'Bb', 'Eb', 'Ab', 'Eb', 'Bb', 'Ab Bb', 'Eb'],
  C: ['F', 'C', 'F', 'G', 'F', 'C', 'Dm', 'G'],
  A2: ['Cm', 'Cm', 'Ab', 'G', 'Fm', 'Cm', 'G', 'G'],
  D: ['Ab', 'Bb', 'G', 'Cm', 'Ab', 'Bb', 'G', 'G'],
};
const KING_A = [
  'G4:6! G4:2 C5:4! Eb5:4', 'G5:6! F5:2 Eb5:4 D5:4', 'C5:6! Eb5:2 Ab5:4 G5:4', 'G5:4! D5:4 B4:8',
  'C5:6! C5:2 Eb5:4! G5:4', 'Ab5:6! G5:2 F5:4 C5:4', 'D5:6! Eb5:2 D5:4 B4:4', 'G4:4! r:4 G4:2! G4:2 G4:4!',
];
const KING_B = [
  'Bb4:4! Eb5:4 G5:6 Bb5:2', 'Bb5:6! Ab5:2 F5:4 D5:4', 'Eb5:4! G5:4 Bb5:6 Eb6:2', 'C6:6! Bb5:2 Ab5:8',
  'G5:4! Bb5:4 Eb6:6 D6:2', 'D6:6! C6:2 Bb5:4 F5:4', 'C6:4! Ab5:4 Bb5:4! D6:4', 'Eb6:8! r:2 Bb5:2 G5:2 Eb5:2',
];
const KING_C = [
  'A5:2.! r:2 F5:2. r:2 C5:2.! r:2 F5:2. A5:2.', 'G5:2.! r:2 E5:2. r:2 C5:2.! r:2 r:4', 'A5:2.! r:2 C6:2. r:2 F5:2.! r:2 A5:2. C6:2.', 'B5:2.! A5:2. G5:2. F5:2. D5:4! r:4',
  'C6:2.! r:2 A5:2. r:2 F5:2.! r:2 A5:2. r:2', 'E5:2.! G5:2. C6:2. G5:2. E5:2.! r:2 C5:2. r:2', 'F5:2.! E5:2. D5:2. E5:2. F5:2.! A5:2. D6:2. r:2', 'G5:4! r:2 G5:2. B5:4! r:4',
];
const KING_A2 = [
  'C5:6! Eb5:2 G5:4! C6:4', 'Eb6:6! D6:2 C6:4 G5:4', 'Ab5:6! G5:2 Eb5:4 C5:4', 'D5:4! G5:4 B5:8',
  'C6:6! Ab5:2 F5:4 Ab5:4', 'G5:6! Eb5:2 C5:4 Eb5:4', 'D5:4! G5:4 B5:4 D6:4', 'G5:4! D5:4 G5:2! G5:2 G5:4!',
];
const KING_D = [
  'Eb6:6! C6:2 Ab5:8', 'F6:6! D6:2 Bb5:8', 'D6:6! B5:2 G5:4 B5:4', 'C6:12! r:4',
  'C6:4! Eb6:4 Ab6:6 G6:2', 'F6:6! Eb6:2 D6:4 Bb5:4', 'B5:4! D6:4 G6:4 F6:4', 'G6:4! r:4 D6:2 B5:2 G5:4',
];
const KF = { sp: FLAT };
const MARCH = 'tl:2! k:2 s:4 k:4! s:2 s:2?';

const c9bKing = {
  bpm: 132, bar: 16, reverb: 0.22, fill: 0,
  parts: [
    { i: 'brass', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.19, role: 'bass' },
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'marimba', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'bell', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.05 },
    { drums: true, v: 0.55, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['C5:4! r:4 C5:4! r:4', 'G4:4! r:4 G4:2! G4:2 G4:4!']),
      bassLine(KING.intro, '1:4! r:4 1:4! r:4', { lo: 31, ...KF }),
      pad(KING.intro, { center: 60, ...KF }),
      rest(2),
      rest(2),
      drums(2, 'tl:4! r:4 tl:4! r:4', { last: 'tl:4! r:4 tl:2 tl:2 t:2 th:2' }),
    ],
    A: [
      bars(KING_A),
      bassLine(KING.A, '1:4! 5:4 1:4! 5:4', { lo: 31, ...KF }),
      pad(KING.A, { center: 60, ...KF }),
      comp(KING.A, 'r:4 x:2.? r:2 r:4 x:2.? r:2', { center: 67, ...KF }),
      rest(8),
      drums(8, MARCH, { last: 'tl:2! k:2 s:4 tl:2 tl:2 t:2 th:2' }),
    ],
    B: [
      bars(KING_B),
      bassLine(KING.B, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 31, ...KF }),
      pad(KING.B, { center: 64, ...KF }),
      comp(KING.B, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 70, ...KF }),
      guide(KING.B, 'x:8 x:8', { center: 82, ...KF }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 h:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 h:2 s:2! h:2', last: FILL }),
    ],
    // おどけ（おなかが すいた）
    C: [
      bars(KING_C),
      bassLine(KING.C, '1:2.! r:2 5:2. r:2 1:2.! r:2 5:2. r:2', { lo: 31, ...KF }),
      rest(8),
      comp(KING.C, 'r:2 x:2.? r:2 x:2.? r:2 x:2.? r:2 x:2.?', { center: 70, ...KF }),
      rest(8),
      drums(8, 'k:2! r:2 s:2. r:2 k:2 r:2 s:2? r:2', { last: 'k:2! r:2 s:2 r:2 tl:2 t:2 th:2 r:2' }),
    ],
    A2: [
      bars(KING_A2),
      bassLine(KING.A2, '1:2! 1:2 5:2 1:2 1:2! 1:2 5:2 8:2', { lo: 31, ...KF }),
      pad(KING.A2, { center: 62, ...KF }),
      comp(KING.A2, VIL_COMP, { center: 67, ...KF }),
      guide(KING.A2, 'x:4 x:4 x:8', { center: 79, ...KF }),
      drums(8, 'tl:2! k:2 s:2! h:2 k:2! h:2 s:2! h:2', { first: 'c:2! k:2 s:2! h:2 k:2! h:2 s:2! h:2' }),
    ],
    // 大ジャンプ
    D: [
      bars(KING_D),
      bassLine(KING.D, '1:4! 8:4 5:4 8:4', { lo: 31, ...KF }),
      pad(KING.D, { center: 66, ...KF }),
      comp(KING.D, 'x:2.! r:2 x:2. r:2 x:2.! r:2 x:2. r:2', { center: 70, ...KF }),
      arp(KING.D, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 81, ...KF }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2! k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2! k:2 s:2! h:2', last: 'tl:2! tl:2 t:2 t:2 th:2 th:2 c:4!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
  // ピンチ: 主音（ド）と 半音上の レb（こまって いるのに どこか おかしい）
  pinch: { n: 'C6:2 Db6:2 C6:2 G5:2 C6:2 Db6:2 C6:2 Eb6:2', i: 'chip_arp', v: 0.03 },
};

for (const tr of [c9bUnder, c9bVillage, c9bHall, c9bKing]) tr.ch = oldView(tr);
// 大地の下の 前の音: 低音の 長い のばし（三角の 波）と 3つの たいこ（どれも k・s に なる）が かさなって われる ので 小さく
c9bUnder.ch = c9bUnder.ch.map((ch, i) => (ch.drums || i === 1 ? { ...ch, v: Math.round(ch.v * 0.4 * 1000) / 1000 } : ch));

// 星の子の 7つの 音（ド〜シ）と 同じ 形（全音・全音・半音・全音・全音・全音）を ト長調で のぼる ことを テストが 見る
export const C9B_SEVEN = SEVEN_UP(5);

// 曲の id は docs/plan-part3.md の 10-4（かえない）
export const C9B_TRACKS = {
  c9b_under: c9bUnder,
  c9b_village: c9bVillage,
  c9b_hall: c9bHall,
  c9b_king: c9bKing,
};
export const C9B_IDS = Object.keys(C9B_TRACKS);
