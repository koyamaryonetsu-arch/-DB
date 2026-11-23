// 第95回 F: 第3部 第2章 第2幕「青と白」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c10b.md の「実装メモ（第2章 第2幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。2人の 中ボスの 曲も もとの 作品の メロディを 借りて いない）。
//   c10b_blue は 第4章の 砂の底の神殿の 曲（sand_temple）の ふし 16小節を 6/8 に して 使う（ふしの 形と 和音は 同じ）。
//   c10b_night は シロガネ地方の 曲（snow。白銀の湖も この 曲）の 頭〈ミ・ソ・シ・ミ〉から 始まる。
//   c10b_five は スピカの歌（c9d_song）の 1〜5ふしめの 頭の 小節を じゅんに 鳴らす
//
// ・c10b_blue … 水鏡のうらがわ（イ短調 6/8 84。いかだが ゆれる 舟歌。画面の 状態 waterStage〈0 水なし・1 中・2 上〉で だん 0〜2:
//     0 … マリンバ〈かわいた 木の 音〉が ふしを 短く・リム・ベースは ぽつん。ト短調〈ふしは レから〉・少し 速く
//     1 … 笛の ふし・ハープの しずく・のばし・かるい たいこ。イ短調〈ふしは ミから。神殿の 曲と 同じ 頭〉
//     2 … ハープが ふし・笛は 長い 音・のばしと 長い ベース・たいこは ほぼ なし。変ロ短調〈ふしは ファから〉・少し おそく〈水の 中〉
//     「音が 高いほど 水も 高い」に 合わせ、だんごとに 調が 上がる〈レ → ミ → ファ〉。だんが かわると 次の 小節から その だんの イントロへ）
// ・c10b_gecko … さらさら砂のタンゴ（ニ短調 120。オルガン〈手風琴〉の ふし・ハバネラの ベース・シェイカーの さらさら・ブラスの「パッ」。きどって いて にくめない）
// ・c10b_night … すきとおる夜の湖（ホ短調 64。26.3 秒。くり返さない。ベルと オルゴールの ガラスの ような 高い 音。たいこ なし）
// ・c10b_white … 氷の下のしのび足（ホ短調 104。ピチカートの ふしと 休み。画面の 状態 alertStage〈0 遠い・1 近い・2 見つかった〉:
//     0 … 強さ 0.4（ふし・ベース・オルゴールの 氷・チクタク）
//     1 … 強さ 0.7（＋ 低い 音が ドッ・ドッと しのびよる。ふしの とちゅうから 止まらない）
//     2 … 強さ 1・テンポ 1.15 倍・「見つかった！」の 形〈ブラスの パッ・半音で ずり落ちる・ポルカの たいこ〉。こわすぎない）
// ・c10b_owl … 月夜の手品ワルツ（ト短調 3/4 152。同じ ふしを 笛・オルゴール・ハープが かわるがわる〈3人に 見える〉。オルゴールの きらめき）
// ・c10b_five … そろった五つの音（ハ長調 108。13.3 秒。くり返さない。スピカの歌の 1〜5ふしめの 頭 → さいごに ベルが レ・ミ・ファ・ソ・ラ〈集めた 5つの 星の音〉）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=dc7c9b067c89';
import { C9C_TOOLS } from './audio-c9c.js?v=dc7c9b067c89';
import { C9D_SONG } from './audio-c9d.js?v=dc7c9b067c89';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView } = C9A_TOOLS;
const { shift } = C9C_TOOLS;
const F = { sp: FLAT };
// 6/8・3/4 の 小節（16分 12）
const B12 = { bar: 12 };
const F12 = { sp: FLAT, bar: 12 };

// 音を 短く（2 いじょうの 長さの 音を 16分 1つ ＋ 休みに。かわいた 木の 音）
const dry = (str) => str.trim().split(/\s+/).map((t) => {
  const m = /^([^:]+):(\d+)([!?.~]*)$/.exec(t);
  if (!m || m[1] === 'r' || Number(m[2]) < 2) return t;
  return `${m[1]}:1${m[3].replace(/[~.]/g, '')} r:${Number(m[2]) - 1}`;
}).join(' ');

// ═════════════ c10b_blue: 水鏡のうらがわ（イ短調 6/8 84）═════════════
// 第4章の 砂の底の神殿の ふし（4/4）を 6/8 の 舟歌に（頭の ミ・ラ・ソ・ミ・レ・ド は 同じ。和音も 神殿と 同じ ならび）。
//   A 神殿の 前半 → B 後半 → C 水鏡が ゆれる（ハ長調の 明るさ。高い 所）→ A2 マリンバの 対旋律
const BLUE = {
  intro: ['Am', 'E'],
  A: ['Am', 'Am', 'Dm', 'Am', 'Am', 'Em', 'F', 'G'],
  B: ['F', 'Dm', 'C', 'Am', 'Dm', 'G', 'E', 'Am'],
  C: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'E'],
};
const BLUE_A = [
  'E5:3! A5:3 G5:2 E5:1 D5:3', 'C5:5! D5:1 E5:6', 'F5:3! E5:2 D5:1 C5:3 B4:3', 'A4:9! r:3',
  'E5:3! A5:3 B5:2 C6:1 B5:3', 'A5:5! G5:1 E5:6', 'F5:3! G5:2 A5:1 G5:3 E5:3', 'D5:9! r:3',
];
const BLUE_B = [
  'C6:3! A5:2 G5:1 F5:3 A5:3', 'F5:5! E5:1 D5:6', 'E5:3! C5:2 D5:1 E5:3 G5:3', 'A5:9! r:3',
  'G5:3! F5:2 E5:1 D5:3 C5:3', 'B4:5! C5:1 D5:6', 'E5:2! D5:2 C5:2 B4:3 G#4:3', 'A4:9! r:3',
];
const BLUE_C = [
  'A5:3! C6:3 A5:3 F5:3', 'B5:3! D6:3 B5:3 G5:3', 'G5:3! B5:3 E6:6', 'C6:6! B5:3 A5:3',
  'F5:3! A5:3 D6:3 C6:3', 'B5:6! G5:3 D5:3', 'E5:3! G5:3 C6:3 B5:3', 'B5:6! G#5:3 E5:3',
];
// ハープの しずく（6/8 で 上がって 下がる）
const DRIP = '0:2 1:2 2:2 3:2 2:2 1:2';
const DRIP2 = '0:2 2:2 1:2 3:2 2:2 1:2';
const DRY_BASS = '1:2! r:4 5:2 r:4';
const DRY_DR = 'R:1! r:5 R:1? r:2 R:1? r:2';
// だん（waterStage 0〜2）の 調と テンポ。ふしの はじめの 音が レ・ミ・ファ に なる
export const WATER_TRANSPOSE = [-2, 0, 1];

const c10bBlue = {
  bpm: 84, bar: 12, reverb: 0.42, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.16, role: 'bass' },
    // かわいた 木の 音（waterStage 0 の ふし・A2 の 対旋律）
    { i: 'marimba', v: 0.22, role: 'harmony', minIntensity: 0, pan: -0.1 },
    // ハープ（しずく・waterStage 2 の ふし）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.26, minIntensity: 0 },
  ],
  sections: {
    // ── waterStage 1（中・ふつう）──
    intro: [
      rest(2, 12),
      bassLine(BLUE.intro, '1:12', { lo: 40, ...B12 }),
      rest(2, 12),
      arp(BLUE.intro, DRIP, { center: 64, ...B12 }),
      pad(BLUE.intro, { center: 60, mods: '?', ...B12 }),
      drums(2, 'r:12', { last: 'r:6 tl:3? tl:3' }),
    ],
    A: [
      bars(BLUE_A),
      bassLine(BLUE.A, '1:6! 5:6', { lo: 40, ...B12 }),
      rest(8, 12),
      arp(BLUE.A, DRIP, { center: 64, ...B12 }),
      pad(BLUE.A, { center: 60, mods: '?', ...B12 }),
      drums(8, 'k:6! h:3? h:3?', { last: 'k:6! R:3? R:3' }),
    ],
    B: [
      bars(BLUE_B),
      bassLine(BLUE.B, '1:6! 8:3 5:3', { lo: 40, ...B12 }),
      rest(8, 12),
      arp(BLUE.B, DRIP2, { center: 64, ...B12 }),
      pad(BLUE.B, { center: 60, mods: '?', ...B12 }),
      drums(8, 'k:6! h:3? R:3?', { last: 'k:3! R:3 tl:3? tl:3' }),
    ],
    // 水鏡が ゆれる（高い 所で 明るく）
    C: [
      bars(BLUE_C),
      bassLine(BLUE.C, '1:9! 5:3', { lo: 40, ...B12 }),
      rest(8, 12),
      arp(BLUE.C, '0:3 1:3 2:3 3:3', { center: 66, ...B12 }),
      pad(BLUE.C, { center: 62, ...B12 }),
      drums(8, 'k:6! R:3? h:3?', { last: 'k:3! R:3 R:2 R:2 tl:2' }),
    ],
    // マリンバの 対旋律
    A2: [
      bars(BLUE_A),
      bassLine(BLUE.A, '1:6! 5:3 8:3', { lo: 40, ...B12 }),
      guide(BLUE.A, 'x:3? r:3 x:3? x:3?', { center: 69, ...B12 }),
      arp(BLUE.A, DRIP, { center: 64, ...B12 }),
      pad(BLUE.A, { center: 60, mods: '?', ...B12 }),
      drums(8, 'k:6! h:3? h:3?', { last: 'k:6! R:3? R:3' }),
    ],
    // ── waterStage 0（水なし。かわいた 木の 音と 少ない 音）──
    dI: [
      rest(2, 12),
      bassLine(BLUE.intro, '1:1! r:11', { lo: 40, ...B12 }),
      arp(BLUE.intro, '0:1! r:2 2:1 r:2 1:1 r:5', { center: 72, ...B12 }),
      rest(2, 12),
      rest(2, 12),
      drums(2, 'R:1! r:2 R:1? r:2 R:1? r:5'),
    ],
    dA: [rest(8, 12), bassLine(BLUE.A, DRY_BASS, { lo: 40, ...B12 }), bars(BLUE_A.map(dry)), rest(8, 12), rest(8, 12), drums(8, DRY_DR)],
    dB: [rest(8, 12), bassLine(BLUE.B, DRY_BASS, { lo: 40, ...B12 }), bars(BLUE_B.map(dry)), rest(8, 12), rest(8, 12), drums(8, DRY_DR, { last: 'R:1! r:2 R:1 r:2 R:1 R:1 R:1 r:3' })],
    dC: [rest(8, 12), bassLine(BLUE.C, '1:1! r:2 1:1? r:2 5:1 r:5', { lo: 40, ...B12 }), bars(BLUE_C.map(dry)), rest(8, 12), rest(8, 12), drums(8, 'R:1! r:5 R:1? r:5')],
    // ── waterStage 2（上。水の 中: ハープの ふし・長い ひびき）──
    wI: [
      rest(2, 12),
      bassLine(BLUE.intro, '1:12', { lo: 33, ...B12 }),
      rest(2, 12),
      bars(['A4:1? C5:1? E5:1? A5:1? C6:1? E6:1? r:6', 'r:12']),
      pad(BLUE.intro, { center: 62, ...B12 }),
      drums(2, 'tl:3? r:9', { last: 'r:12' }),
    ],
    wA: [guide(BLUE.A, 'x:12', { center: 76, ...B12 }), bassLine(BLUE.A, '1:12', { lo: 33, ...B12 }), rest(8, 12), bars(BLUE_A), pad(BLUE.A, { center: 60, ...B12 }), drums(8, 'r:12', { first: 'tl:3? r:9' })],
    wB: [guide(BLUE.B, 'x:12', { center: 76, ...B12 }), bassLine(BLUE.B, '1:12', { lo: 33, ...B12 }), rest(8, 12), bars(BLUE_B), pad(BLUE.B, { center: 60, ...B12 }), drums(8, 'r:12', { first: 'tl:3? r:9' })],
    wC: [guide(BLUE.C, 'x:12', { center: 78, ...B12 }), bassLine(BLUE.C, '1:12', { lo: 33, ...B12 }), rest(8, 12), bars(BLUE_C), pad(BLUE.C, { center: 62, ...B12 }), drums(8, 'r:12', { first: 'tl:3? r:9' })],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // だん ＝ waterStage（0 水なし・1 中・2 上）。調が 上がる（ふしの はじめが レ・ミ・ファ）。形が かわる だんは その イントロから
  phases: [
    { transpose: WATER_TRANSPOSE[0], tempo: 1.04, form: ['dI', 'dA', 'dB', 'dC'], loopFrom: 1 },
    { transpose: WATER_TRANSPOSE[1], tempo: 1 },
    { transpose: WATER_TRANSPOSE[2], tempo: 0.94, form: ['wI', 'wA', 'wB', 'wC'], loopFrom: 1 },
  ],
};

// ═════════════ c10b_gecko: さらさら砂のタンゴ（ニ短調 120）═════════════
// 砂の しんし。きどった タンゴ。オルガン（手風琴の かわり）の ふしは 長い 音の あとに 小さな かざり（半音下から）・とつぜん 止まる「ぽん」。
//   ベースは ハバネラ（タン・タタ・タン）、ピアノの かわりの ハープは 3・3・2 の きざみ。シェイカーの さらさら（体から こぼれる 砂）。
//   A きどって 登場 → B ヘ長調で 見せびらかす（ストリングス）→ C かわいた 砂（シェイカーと ふしの かけらだけ）→ A2 ブラスが 足される
const GK = {
  intro: ['Dm', 'A7'],
  A: ['Dm', 'Dm', 'A7', 'Dm', 'Gm', 'Dm', 'A7', 'Dm'],
  B: ['F', 'C7', 'F', 'Bb', 'Gm', 'C7', 'F', 'A7'],
  C: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A7'],
};
const GK_A = [
  'A5:6! G#5:1 A5:1 F5:4 D5:4', 'E5:2! F5:2 G5:2 A5:2 D6:4! r:4',
  'C#6:6! B5:1 C#6:1 E6:4 A5:4', 'D6:4! A5:2 F5:2 D5:4! r:4',
  'Bb5:6! A5:1 Bb5:1 G5:4 D5:4', 'F5:2! G5:2 A5:2 Bb5:2 A5:4! r:2 F5:2',
  'E5:2! F5:2 G5:2 Bb5:2 C#6:4! E6:2 C#6:2', 'D6:2! r:2 A5:2 r:2 D5:4! r:4',
];
const GK_B = [
  'C6:6! Bb5:1 A5:1 G5:4 F5:4', 'E5:2! F5:2 G5:2 Bb5:2 C6:4! Bb5:2 G5:2',
  'A5:6! G5:1 A5:1 C6:4 F6:4', 'D6:4! C6:2 Bb5:2 F5:4! r:4',
  'G5:2! A5:2 Bb5:2 D6:2 G6:4! F6:2 D6:2', 'E6:4! D6:2 C6:2 Bb5:2 G5:2 E5:4',
  'F5:3! A5:3 C6:2 F6:4! r:4', 'E6:2! C#6:2 A5:2 G5:2 E5:4! C#5:4',
];
const GK_C = [
  'D5:2! r:6 F5:2 r:2 A5:4', 'D6:2! r:2 C#6:1 D6:1 r:10',
  'D5:2! r:6 F5:2 r:2 Bb5:4', 'C#6:4! r:4 E5:4! r:4',
  'F5:2! r:6 A5:2 r:2 D6:4', 'F6:2! r:2 E6:1 F6:1 r:2 D6:8!',
  'Bb5:2! A5:2 G5:2 D5:2 G5:4! r:4', 'A5:2! r:2 G5:2 r:2 E5:2! r:2 C#5:2 r:2',
];
const HABANERA = '1:3! 1:1 5:2 r:2 1:4! 5:4';
const MARCATO = '1:2.! r:2 1:2. r:2 1:2.! r:2 5:2. r:2';
const T332 = 'x:3.! x:3. x:2.! r:8';
const TANGO_K = 'k:4! R:4? k:4! R:2 R:2?';
const SAND = 'sh:2! sh:1? sh:1? sh:2 sh:1? sh:1? sh:2! sh:1? sh:1? sh:2 sh:1? sh:1?';

const c10bGecko = {
  bpm: 120, bar: 16, reverb: 0.2, fill: 0, night: {},
  parts: [
    { i: 'organ', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'brass', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.34, minIntensity: 0 },
    // シェイカー（さらさら）
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // 砂が こぼれる（シェイカーだけ）→ ブラスの「パッ・パッ・パーン」で 登場
    intro: [
      rest(2),
      bassLine(GK.intro, ['r:16', '1:3! r:1 1:2 r:2 1:4! r:4'], { lo: 38, ...F }),
      comp(GK.intro, ['r:16', T332], { center: 62, ...F }),
      comp(GK.intro, ['r:16', 'x:2.! r:2 x:2. r:2 x:4! r:4'], { center: 64, ...F }),
      rest(2),
      drums(2, 'r:16', { last: 'k:4! r:4 k:4! r:4' }),
      drums(2, SAND),
    ],
    A: [
      bars(GK_A),
      bassLine(GK.A, HABANERA, { lo: 38, ...F }),
      comp(GK.A, T332, { center: 62, ...F }),
      comp(GK.A, ['r:12 x:2.! r:2', 'r:16'], { center: 64, ...F }),
      rest(8),
      drums(8, TANGO_K, { last: 'k:4! R:4 k:2 k:2 R:2 R:2' }),
      drums(8, SAND),
    ],
    // 見せびらかす（ストリングスの 長い 音）
    B: [
      bars(GK_B),
      bassLine(GK.B, MARCATO, { lo: 38, ...F }),
      comp(GK.B, 'x:2.! r:2 x:2. r:2 x:2.! r:2 x:2. r:2', { center: 62, ...F }),
      comp(GK.B, ['r:16', 'r:12 x:2.! r:2'], { center: 64, ...F }),
      guide(GK.B, 'x:8 x:8', { center: 67, ...F }),
      drums(8, 'k:4! R:4 k:4! R:4', { last: 'k:4! R:4 k:2 R:2 k:2 k:2' }),
      drums(8, SAND),
    ],
    // かわいた 砂（シェイカーと ベースと ふしの かけら）
    C: [
      bars(GK_C),
      bassLine(GK.C, '1:3! r:5 1:4! r:4', { lo: 38, ...F }),
      rest(8),
      rest(8),
      pad(GK.C, { center: 60, mods: '?', ...F }),
      drums(8, 'r:16', { last: 'r:8 R:2 R:2 R:2 R:2' }),
      drums(8, 'sh:4! sh:2? sh:2? sh:4 sh:2? sh:2?'),
    ],
    // ブラスが 足される
    A2: [
      bars(GK_A),
      bassLine(GK.A, HABANERA, { lo: 38, ...F }),
      comp(GK.A, T332, { center: 62, ...F }),
      comp(GK.A, 'r:4 x:2.! r:2 r:4 x:2. r:2', { center: 64, ...F }),
      guide(GK.A, 'x:8 x:8', { center: 69, ...F }),
      drums(8, TANGO_K, { first: 'c:4! R:4? k:4! R:2 R:2?', last: 'k:2! k:2 R:2 R:2 k:2 R:2 k:4!' }),
      drums(8, SAND),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（レ）と 半音上
  pinch: { n: 'D6:2 Eb6:2 D6:2 A5:2 D6:2 Eb6:2 D6:2 F6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10b_night: すきとおる夜の湖（ホ短調 64。くり返さない）═════════════
// 夜の 白銀の湖。氷が すきとおる 場面（26.3 秒）。たいこ なし。ベルの ふしは シロガネ地方の 曲の 頭〈ミ・ソ・シ・ミ〉を 1オクターブ 上で、
//   オルゴールが ガラスの ような 高い 音で きらり。さいごは ミを 長く のばして しんと おわる
const NIGHT = {
  I: ['Em'],
  S: ['Em', 'Am', 'G', 'C', 'B'],
  E: ['Em'],
};
const NIGHT_S = ['E5:4! G5:4 B5:4 E6:4', 'D6:6! C6:2 B5:4 A5:4', 'G5:4! B5:4 D6:8', 'E6:6! D6:2 C6:8', 'D#6:8! F#6:4 B5:4'];

const c10bNight = {
  bpm: 64, bar: 16, once: true, reverb: 0.5, night: {},
  parts: [
    { i: 'bell', v: 0.09, role: 'lead' },
    { i: 'sub_bass', v: 0.13, role: 'bass' },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.022, role: 'harmony', minIntensity: 0, pan: -0.05 },
  ],
  sections: {
    I: [
      'r:16',
      bassLine(NIGHT.I, '1:16', { lo: 36 }),
      'B6:4? r:4 E7:4? r:4',
      pad(NIGHT.I, { center: 60, mods: '?' }),
      'r:16',
    ],
    S: [
      bars(NIGHT_S),
      bassLine(NIGHT.S, '1:16', { lo: 36 }),
      arp(NIGHT.S, 'r:4 0:2? 2:2? r:4 1:2? 3:2?', { center: 86 }),
      pad(NIGHT.S, { center: 60 }),
      guide(NIGHT.S, 'x:16?', { center: 72 }),
    ],
    E: [
      'E6:16!',
      bassLine(NIGHT.E, '1:16', { lo: 36 }),
      'r:4 G6:4? B6:4? E7:4?',
      pad(NIGHT.E, { center: 62 }),
      'B5:16?',
    ],
  },
  form: ['I', 'S', 'E'],
};

// ═════════════ c10b_white: 氷の下のしのび足（ホ短調 104）═════════════
// こっそり 進む。ピチカート（はじく 音）の ふしは 16分 1つずつ と 休み（ぬき足 さし足）。ベースも ぽつ ぽつ。オルゴールが 氷の きらり。
//   画面の 状態 alertStage（audio-scene.js が 強さと だんに する）:
//     0 … 強さ 0.4。ふし・ベース・オルゴール・チクタク
//     1 … 強さ 0.7。＋ 低い 音が ドッ・ドッと しのびよる（形は かわらない ＝ ふしの とちゅうから 止まらない）
//     2 … だん 2。テンポ 1.15 倍で「見つかった！」の 形（ブラスの パッ・半音で ずり落ちる ふし・ポルカの たいこ。にぎやかで おかしい）
//   A しのび足 → B 半音で そろりと のぼる（ハ長調の 和音）→ A2（ベースが 少し かわる・オルゴールが こたえる）
const WH = {
  intro: ['Em', 'B7'],
  A: ['Em', 'Em', 'Am', 'B7', 'Em', 'C', 'Am B7', 'Em'],
  B: ['C', 'C', 'Am', 'B', 'C', 'C', 'Am', 'B7'],
  xI: ['B7'],
};
const WH_A = [
  'E5:1! r:1 G5:1 r:1 B5:1 r:3 B5:1! r:1 A#5:1 B5:1 G5:1 r:3',
  'E6:1! r:3 D#6:1 E6:1 r:2 B5:1! r:7',
  'A5:1! r:1 C6:1 r:1 E6:1 r:3 E6:1! D#6:1 E6:1 r:1 C6:1 r:3',
  'B5:1! r:1 A5:1 r:1 F#5:1 r:1 D#5:1 r:1 B4:2! r:6',
  'G5:1! r:1 B5:1 r:1 E6:1 r:3 E6:1! r:1 D#6:1 E6:1 B5:1 r:3',
  'E6:1! r:1 C6:1 r:1 G5:1 r:3 C6:1! r:1 B5:1 C6:1 G5:1 r:3',
  'A5:1! r:1 C6:1 r:1 E6:1 r:3 D#6:1! r:1 F#6:1 r:1 B5:1 r:3',
  'E6:1! r:3 B5:1 r:3 E5:2! r:6',
];
const WH_B = [
  'G5:1! r:3 G#5:1 r:3 A5:1! r:7',
  'A#5:1! r:3 B5:1 r:3 C6:2! r:6',
  'E6:1! r:1 C6:1 r:1 A5:1 r:3 E5:1! r:7',
  'D#6:1! r:1 B5:1 r:1 F#5:1 r:3 D#5:2! r:6',
  'E5:1! r:3 E5:1 r:3 G5:1! r:7',
  'G5:1! r:1 C6:1 r:1 E6:1 r:3 G6:2! r:6',
  'F#6:1! r:3 E6:1 r:3 C6:1! r:3 A5:1 r:3',
  'B5:1! r:1 A5:1 r:1 F#5:1 r:1 D#5:1 r:1 B4:4! r:4',
];
// 見つかった！（8分で うめる。さいごは 半音で ずり落ちる）
const WH_X = [
  'E5:2! G5:2 B5:2 G5:2 B5:2! E6:2 B5:2 G5:2',
  'E6:2! D#6:2 E6:2 B5:2 G5:2! B5:2 E5:2 G5:2',
  'A5:2! C6:2 E6:2 C6:2 A5:2! E6:2 D#6:2 E6:2',
  'D#6:2! C6:2 B5:2 A5:2 F#5:2! D#5:2 B4:4',
  'G5:2! B5:2 E6:2 B5:2 G6:2! F#6:2 E6:2 B5:2',
  'E6:2! C6:2 G5:2 C6:2 E6:2! G6:2 E6:2 C6:2',
  'C6:2! B5:2 A5:2 E5:2 D#6:2! C6:2 B5:2 A5:2',
  'G5:2! F#5:2 F5:2 E5:2 E5:2! r:2 B4:2 E5:2',
];
const TIPTOE = 'h:1? r:3 R:1? r:3 h:1? r:3 R:1? r:3';
const ICE = 'r:12 2:2? r:2';
// しのびよる 低い 音（ドッ・ドッ。強い 拍は さける）
const CREEP = 'r:2 1:1? r:1 1:1 r:3 r:2 1:1? r:1 1:1 r:3';
// 強さ（alertStage 0〜2）
export const ALERT_INTENSITY = [0.4, 0.7, 1];

const c10bWhite = {
  bpm: 104, bar: 16, reverb: 0.3, fill: 0, night: {},
  parts: [
    { i: 'pluck', v: 0.34, role: 'lead' },
    { i: 'bass', v: 0.3, role: 'bass' },
    { i: 'musicbox', v: 0.036, role: 'harmony', minIntensity: 0, pan: 0.3 },
    // しのびよる 低い 音（alertStage 1 から）
    { i: 'sub_bass', v: 0.13, role: 'harmony', minIntensity: 0.7, pan: 0 },
    // 見つかった 時の ブラス
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { drums: true, v: 0.32, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(WH.intro, '1:1! r:7 5:1 r:7', { lo: 40 }),
      arp(WH.intro, ICE, { center: 86 }),
      bassLine(WH.intro, CREEP, { lo: 28 }),
      rest(2),
      drums(2, TIPTOE),
    ],
    A: [
      bars(WH_A),
      bassLine(WH.A, '1:1! r:3 5:1 r:3 1:1! r:3 5:1 r:3', { lo: 40 }),
      arp(WH.A, ICE, { center: 86 }),
      bassLine(WH.A, CREEP, { lo: 28 }),
      rest(8),
      drums(8, TIPTOE),
    ],
    // そろりと のぼる
    B: [
      bars(WH_B),
      bassLine(WH.B, '1:1! r:7 1:1! r:3 5:1 r:3', { lo: 40 }),
      arp(WH.B, 'r:12 0:1? 2:1? r:2', { center: 86 }),
      bassLine(WH.B, CREEP, { lo: 28 }),
      rest(8),
      drums(8, 'R:1? r:7 R:1? r:3 h:1? r:3'),
    ],
    // オルゴールが こたえる
    A2: [
      bars(WH_A),
      bassLine(WH.A, '1:1! r:3 8:1 r:3 1:1! r:3 5:1 r:3', { lo: 40 }),
      arp(WH.A, 'r:4 0:1? r:3 r:4 2:1? 1:1? r:2', { center: 86 }),
      bassLine(WH.A, CREEP, { lo: 28 }),
      rest(8),
      drums(8, TIPTOE, { last: 'h:1? r:3 R:1? r:3 R:1 R:1 r:2 R:1? r:3' }),
    ],
    // ── alertStage 2（見つかった！）──
    xI: [
      'B5:2! A#5:2 A5:2 G#5:2 G5:4! r:4',
      bassLine(WH.xI, '1:4! r:4 1:2 1:2 5:2 r:2', { lo: 40 }),
      'r:16',
      'r:16',
      comp(WH.xI, 'x:4! r:12', { center: 64 }),
      'c:4! r:4 s:2 s:2 t:2 tl:2',
    ],
    xA: [
      bars(WH_X),
      bassLine(WH.A, '1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2', { lo: 40 }),
      arp(WH.A, ICE, { center: 86 }),
      bassLine(WH.A, 'r:2 1:2 r:4 r:2 1:2 r:4', { lo: 28 }),
      comp(WH.A, 'r:2 x:2! r:4 r:2 x:2 r:4', { center: 64 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { last: 'k:2! s:1 s:1 s:2 s:1 s:1 t:2 th:2 tl:2 tl:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
  // だん ＝ alertStage。0 と 1 は 同じ 形（強さで 低い 音が ふえる）・2 は「見つかった！」の 形
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1.15, form: ['xI', 'xA'], loopFrom: 1 },
  ],
};

// ═════════════ c10b_owl: 月夜の手品ワルツ（ト短調 3/4 152）═════════════
// 白い かい盗。しゃれた ワルツ（ベースは 1拍め、ストリングスが 2・3拍め）。同じ ふし（4小節）を 笛 → オルゴール → ハープが
//   かわるがわる 鳴らし（3人に 見える）、4つめで 3つ そろう（ハープは 1オクターブ 下）。オルゴールの 上がる きらめき（手品）。
//   A 笛・オルゴール・ハープ → B 変ロ長調の ふしを ハープ・笛・オルゴール → C シャッフル（1小節ごとに 入れかわる）→ A2 ハープ・笛・オルゴール（場所が かわった）
const OW = {
  intro: ['Gm', 'Gm', 'D7', 'D7'],
  T: ['Gm', 'Cm', 'D7', 'Gm'],
  K: ['Eb', 'Cm', 'D7', 'D7'],
  U: ['Bb', 'Eb', 'F7', 'Bb'],
  L: ['Gm', 'Eb', 'Cm', 'D7'],
  C: ['Cm', 'Gm', 'Cm', 'D7', 'Eb', 'Bb', 'Cm', 'D7'],
};
const OW_T = ['D5:4! G5:2 A5:2 Bb5:4', 'Eb6:6! D6:2 C6:4', 'A5:4! F#5:2 D5:2 A5:2 C6:2', 'G5:8! r:4'];
const OW_K = ['G5:4! Bb5:4 Eb6:4', 'G6:4! Eb6:4 C6:4', 'F#6:6! D6:2 A5:4', 'D6:4! C6:2 A5:2 F#5:4'];
const OW_U = ['F5:4! Bb5:2 C6:2 D6:4', 'G6:6! F6:2 Eb6:4', 'C6:4! A5:2 F5:2 A5:2 Eb6:2', 'D6:8! r:4'];
const OW_L = ['D6:4! Bb5:4 G5:4', 'G5:4! Bb5:4 Eb6:4', 'Eb6:6! D6:2 C6:4', 'D6:12!'];
const OW_C = [
  'G5:2! Ab5:2 G5:2 Eb5:2 C5:4', 'D6:2! Eb6:2 D6:2 Bb5:2 G5:4', 'G6:2! Ab6:2 G6:2 Eb6:2 C6:4', 'F#6:2! G6:2 A6:2 F#6:2 D6:4',
  'G5:4! Bb5:2 Eb6:2 G6:4', 'F6:4! D6:2 Bb5:2 F5:4', 'Eb6:4! C6:2 G5:2 Eb5:4', 'D5:2! F#5:2 A5:2 C6:2 D6:4',
];
// 3つの 楽器（0 笛・1 オルゴール・2 ハープ）
export const OWL_VOICES = ['flute', 'musicbox', 'pluck'];
// ふし（4小節）を who の じゅんに 4小節ずつ。さいごの 4小節（tutti）は 3つ そろって（ハープは 1オクターブ 下）。
//   オルゴールが ふしを 鳴らさない 小節は 上がる きらめき（手品。強い 拍は さける）
const SPARK = 'r:8 0:1? 1:1? 2:1? 3:1?';
const WALTZ_STR = 'r:4 x:4 x:4';
function owlSection(themeProg, theme, tuttiProg, tutti, who, { bass = '1:4! r:8', str = WALTZ_STR, dr = 'k:4! h:4? h:4?', last } = {}) {
  const prog = [...themeProg, ...themeProg, ...themeProg, ...tuttiProg];
  const voice = (k) => {
    const out = [];
    who.forEach((w, r) => theme.forEach((b, i) => {
      if (w === k) out.push(b);
      else if (k === 1) out.push(arp([prog[r * 4 + i]], SPARK, { center: 86, ...F12 }));
      else out.push('r:12');
    }));
    for (const b of tutti) out.push(k === 2 ? shift(b, -12) : b);
    return out.join(' ');
  };
  return [
    voice(0),
    bassLine(prog, bass, { lo: 38, ...F12 }),
    voice(1),
    voice(2),
    comp(prog, str, { center: 62, ...F12 }),
    drums(16, dr, { last }),
  ];
}
// 1小節ごとに 入れかわる（シャッフル）
function owlShuffle(line, who) {
  return [0, 1, 2].map((k) => line.map((b, i) => (who[i % who.length] === k ? b : 'r:12')).join(' '));
}

const c10bOwl = {
  bpm: 152, bar: 12, reverb: 0.3, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    { i: 'musicbox', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'pluck', v: 0.06, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // 幕が 上がる（オルゴールの きらめき・ワルツの きざみ）
    intro: [
      rest(4, 12),
      bassLine(OW.intro, '1:4! r:8', { lo: 38, ...F12 }),
      arp(OW.intro, ['0:1? 1:1? 2:1? 3:1? 4:1? 5:1? r:6', 'r:12', '0:1? 1:1? 2:1? 3:1? 4:1? 5:1? r:6', 'r:8 3:1? 2:1? 1:1? 0:1?'], { center: 84, ...F12 }),
      rest(4, 12),
      comp(OW.intro, WALTZ_STR, { center: 62, ...F12 }),
      drums(4, 'k:4! r:8', { last: 'k:4! R:4 R:2 R:2?' }),
    ],
    A: owlSection(OW.T, OW_T, OW.K, OW_K, [0, 1, 2], { last: 'k:4! R:4 R:2 R:2' }),
    B: owlSection(OW.U, OW_U, OW.L, OW_L, [2, 0, 1], { bass: '1:4! r:4 5:4', dr: 'k:4! R:4? R:4?', last: 'k:4! R:2 R:2 R:2 R:2' }),
    // シャッフル（1小節ごとに 3つの 楽器が 入れかわる）
    C: (() => {
      const [fl, mb, pl] = owlShuffle(OW_C, [0, 1, 2]);
      return [
        fl,
        bassLine(OW.C, '1:4! 5:4 r:4', { lo: 38, ...F12 }),
        mb,
        pl,
        comp(OW.C, 'r:4 x:2 x:2 x:4', { center: 62, ...F12 }),
        drums(8, 'k:4! R:2 R:2? R:4', { last: 'k:4! R:2 R:2 R:2 R:2' }),
      ];
    })(),
    // 場所が かわった（ハープ → 笛 → オルゴール）
    A2: owlSection(OW.T, OW_T, OW.K, OW_K, [2, 0, 1], { bass: '1:4! r:4 5:4', last: 'k:4! R:4 k:2 R:2' }),
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ソ）と 半音上
  pinch: { n: 'G6:2 Ab6:2 G6:2 D6:2 G6:2 Ab6:2 G6:2 Bb6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10b_five: そろった五つの音（ハ長調 108。くり返さない）═════════════
// 5つの 台が 光る。スピカの歌の 1〜5ふしめの はじめの 小節を 1小節ずつ じゅんに（笛）。ベルは その ふしの 頭の 音を 1オクターブ 上で。
//   さいごの 小節は ベルが レ・ミ・ファ・ソ・ラ（集めた 5つの 星の音）を のぼり、ソの 和音で 止まる（あと 2つ）
const FIVE_HEADS = C9D_SONG.phrases.slice(0, 5).map((ph) => ph[0]);
const FIVE_CH = [...C9D_SONG.chords.slice(0, 5).map((c) => c[0]), 'F G'];
const headOf = (b) => b.trim().split(/\s+/)[0].split(':')[0];
const FIVE_BELL = [...FIVE_HEADS.map((b) => `${shift(`${headOf(b)}:8`, 12)}! r:8`), 'D6:2 E6:2 F6:2 G6:2 A6:8!'];

const c10bFive = {
  bpm: 108, bar: 16, once: true, reverb: 0.4, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    S: [
      bars([...FIVE_HEADS, 'C6:4! D6:4 E6:4! G6:4']),
      `${bassLine(FIVE_CH.slice(0, 5), '1:4! 5:4 1:4 5:4', { lo: 36 })} ${bassLine(FIVE_CH.slice(5), '1:4! 5:4 1:8!', { lo: 36 })}`,
      bars(FIVE_BELL),
      arp(FIVE_CH, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
      pad(FIVE_CH, { center: 62 }),
      drums(6, 'k:4! h:4? R:4 h:4?', { first: 'c:4! h:4? R:4 h:4?', last: 'c:4! r:4 tl:2 t:2 th:2 c:2?' }),
    ],
  },
  form: ['S'],
};

for (const tr of [c10bBlue, c10bGecko, c10bNight, c10bWhite, c10bOwl, c10bFive]) tr.ch = oldView(tr);

// テストが 見る: 神殿の ふし（6/8）・夜の 湖・スピカの歌の 頭・3つの 楽器の ふし
export const C10B_LINES = { blueA: BLUE_A, blueB: BLUE_B, nightS: NIGHT_S, fiveHeads: FIVE_HEADS, owlT: OW_T, owlU: OW_U, owlC: OW_C };

// 曲の id は docs/plan-part3-c10b.md の 14-4（かえない）
export const C10B_TRACKS = {
  c10b_blue: c10bBlue,
  c10b_gecko: c10bGecko,
  c10b_night: c10bNight,
  c10b_white: c10bWhite,
  c10b_owl: c10bOwl,
  c10b_five: c10bFive,
};
export const C10B_IDS = Object.keys(C10B_TRACKS);

