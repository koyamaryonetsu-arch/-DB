// 第97回 F: 第3部 第2章 第3幕「紫と、うばわれた音」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c10c.md の「実装メモ（第2章 第3幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。中ボスの 曲も もとの 作品の メロディを 借りて いない）。
//   c10c_isles は 第5章の クモイ地方の 曲（kumoi）の ふし 16小節を そのまま 使う（調も 同じ ヘ長調）。
//   c10c_stolen・c10c_rival は 少年の 曲（c9c_algol「つめたい光」）の ふし〈シ・ラ・ソ・ファ・ミ・レ・ド〉を 使う。
//   c10c_rival の とちゅうで スピカの歌（c9d_song）の 1ふしめが 1回 重なる。
//   c10c_fort は 3人組の 曲（c9a_trio）の ふしの かけらを 使う。
//   c10c_six は スピカの歌の 1〜6ふしめの 頭の 小節を じゅんに 鳴らす（c10b_five と 同じ 作り）
//
// ・c10c_isles … 空にかかる音の橋（ヘ長調 96。クモイ地方の ふし。画面の 状態 bridgeStage〈かかって いる 橋の 数 0〜5〉で 強さ 0・0.2・… 1:
//     0 … 笛の ふしと ベースだけ（ひろびろ）
//     1 … ＋ ハープ（赤）  2 … ＋ オルゴール（黄）  3 … ＋ 風の シェイカー（緑）  4 … ＋ かるい たいこ（青）
//     5 … ＋ ベルの 虹（白。4小節ごとに 5色の 音 レ・ミ・ファ・ソ・ラ を かけ上がる）
//     ハープ・オルゴールの 入り方も それぞれ レ・ミ から 始まる きらめき（橋の 色の 音）。形は かわらない ので ふしの とちゅうから 止まらない）
// ・c10c_colonel … いばりんぼ行進曲（変ロ長調 116。ブラスの いばった 行進 → C で あわてる〈ト短調・テンポ 132・半音で ずり落ちる〉→ 気を 取り直して また いばる。雷の タム）
// ・c10c_stolen … 三日月のかげ（イ短調 72。20 秒。くり返さない。はっと する 1つの 音 → 少年の ふしを ベルで → しずかに おわる）
// ・c10c_fort … ガッチャンベルト工場（ニ短調 112。機械の きざみ。B で 3人組の ふしが こっそり〈チップの 音〉。C は ベルトが 逆回り）
// ・c10c_rival … ふたつの光（イ短調 132。少年の ふしの 戦い。C で スピカの歌の 1ふしめが 笛で 1回 重なる）
// ・c10c_six … そろった六つの音（ハ長調 124。13.5 秒。くり返さない。スピカの歌の 1〜6ふしめの 頭 → ベルが レ・ミ・ファ・ソ・ラ・シ〈集めた 6つの 星の音〉→ シで 止まる〈あと 1つ〉）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS, C9A_TRIO_THEME } from './audio-c9a.js?v=e3ea39586b77';
import { C9C_TOOLS } from './audio-c9c.js?v=e3ea39586b77';
import { C9D_SONG } from './audio-c9d.js?v=e3ea39586b77';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView } = C9A_TOOLS;
const { shift } = C9C_TOOLS;
const F = { sp: FLAT };

// ═════════════ c10c_isles: 空にかかる音の橋（ヘ長調 96）═════════════
// 空の 小島。クモイ地方の 曲（kumoi。ヘ長調 104）の ふし 16小節を 少し ゆっくり、高く ひろびろと。
//   A クモイの 1〜8小節 → B 9〜16小節 → C 雲の 海が ひろがる（新しい ふし。ニ短調から）→ A2（さいごの 小節だけ ちがう）
//   橋の 数（bridgeStage 0〜5）で 楽器が 1つずつ ふえる（強さ ＝ 橋の 数 ÷ 5。パートの minIntensity が 0.2 ずつ）
const ISL = {
  intro: ['F', 'C'],
  A: ['F', 'C', 'Gm', 'C', 'F', 'F', 'Gm', 'C'],
  B: ['F', 'C', 'Bb', 'F', 'Bb', 'F', 'C', 'F'],
  C: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Gm', 'Bb', 'C'],
};
// クモイ地方の ふし（audio-kumoi.js の kumoi の 1つめの チャンネルと 同じ 音・同じ 長さ）
const KUMOI_A = [
  'C5:4! F5:4 A5:6 G5:2', 'F5:4! E5:2 D5:2 C5:8', 'D5:4! G5:4 Bb5:6 A5:2', 'G5:12! r:4',
  'A5:4! C6:4 D6:4 C6:2 Bb5:2', 'A5:6! G5:2 F5:8', 'G5:4! A5:2 Bb5:2 A5:4 G5:4', 'E5:12! r:4',
];
const KUMOI_B = [
  'F5:4! A5:4 C6:6 Bb5:2', 'A5:4! G5:2 F5:2 E5:8', 'D5:4! F5:4 Bb5:4 A5:2 G5:2', 'A5:12! r:4',
  'Bb5:4! A5:2 G5:2 F5:4 D5:4', 'C5:4! F5:4 A5:8', 'G5:6! A5:2 Bb5:4 E5:4', 'F5:12! r:4',
];
// 雲の 海（高く 長い 音）
const ISL_C = [
  'A5:8! D6:4 C6:4', 'Bb5:6! A5:2 F5:8', 'C6:8! A5:4 C6:4', 'G5:12! r:4',
  'F5:4! A5:4 D6:8', 'D6:6! C6:2 Bb5:8', 'D6:4! C6:4 Bb5:4 A5:4', 'C6:8! Bb5:4 G5:4',
];
const ISL_A2 = [...KUMOI_A.slice(0, 7), 'E5:8! G5:4 Bb5:4'];
// 5色の 橋の 音（レ 赤・ミ 黄・ファ 緑・ソ 青・ラ 白）
export const BRIDGE_NOTES = ['D', 'E', 'F', 'G', 'A'];
// ベルの 虹（4小節めの うしろで 5色の 音を かけ上がる。強い 拍は さける）
const RAINBOW = `r:10 ${BRIDGE_NOTES.map((n, k) => `${n}6:${k === 4 ? 2 : 1}${k === 4 ? '!' : '?'}`).join(' ')}`;
const BELL_SPARK = 'r:4 2:1? r:7 1:1? r:3';
const bellBars = (prog) => prog.map((c, i) => (i % 4 === 3 ? RAINBOW : arp([c], BELL_SPARK, { center: 84 }))).join(' ');
// ハープ（赤）: 小節の はじめの うらに レの きらめき → 和音の アルペジオ
const HARP = '0:2 1:2 2:2 3:2 2:2 1:2 0:2 r:2';
const harpBars = (prog) => prog.map((c, i) => (i % 4 === 0 ? `r:2 D6:1? r:1 ${arp([c], '2:2 3:2 2:2 1:2 0:2 r:2', { center: 72 })}` : arp([c], HARP, { center: 72 }))).join(' ');
// オルゴール（黄）: 高い 所で ぽつん・ぽつん（4小節ごとに ミの きらめき）
const MBOX = 'r:4 3:1? r:3 r:4 4:1? r:3';
const mboxBars = (prog) => prog.map((c, i) => (i % 4 === 1 ? `r:4 E6:1? r:3 ${arp([c], 'r:4 4:1? r:3', { center: 84 })}` : arp([c], MBOX, { center: 84 }))).join(' ');
const WIND = 'sh:4? sh:2 sh:2? sh:4? sh:2 sh:2?';
const SKY_DR = 'k:4! r:4 R:4? r:2 k:2?';
// 強さ（bridgeStage 0〜5 → 0・0.2・…・1）
export const BRIDGE_INTENSITY = [0, 0.2, 0.4, 0.6, 0.8, 1];

const c10cIsles = {
  bpm: 96, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.15, role: 'bass', minIntensity: 0 },
    // 1本め（赤）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0.2, pan: -0.25 },
    // 2本め（黄）
    { i: 'musicbox', v: 0.04, role: 'harmony', minIntensity: 0.4, pan: 0.3 },
    // 3本め（緑）風の シェイカー
    { drums: true, v: 0.26, minIntensity: 0.6 },
    // 4本め（青）かるい たいこ
    { drums: true, v: 0.3, minIntensity: 0.8 },
    // 5本め（白）ベルの 虹
    { i: 'bell', v: 0.045, role: 'harmony', minIntensity: 1, pan: -0.05 },
  ],
  sections: {
    intro: [
      'r:16 r:8 C5:4 F5:4',
      bassLine(ISL.intro, '1:16', { lo: 41, ...F }),
      harpBars(ISL.intro),
      mboxBars(ISL.intro),
      drums(2, WIND),
      drums(2, 'r:16', { last: 'r:8 tl:4? tl:4' }),
      `${rest(1)} ${RAINBOW}`,
    ],
    A: [
      bars(KUMOI_A),
      bassLine(ISL.A, '1:6! 1:2 5:8', { lo: 41, ...F }),
      harpBars(ISL.A),
      mboxBars(ISL.A),
      drums(8, WIND),
      drums(8, SKY_DR, { last: 'k:4! r:4 R:4 tl:2? tl:2' }),
      bellBars(ISL.A),
    ],
    B: [
      bars(KUMOI_B),
      bassLine(ISL.B, '1:8! 8:4 5:4', { lo: 41, ...F }),
      harpBars(ISL.B),
      mboxBars(ISL.B),
      drums(8, WIND),
      drums(8, 'k:4! r:4 R:4? R:2? k:2?', { last: 'k:4! r:4 R:2 R:2 tl:2 tl:2' }),
      bellBars(ISL.B),
    ],
    // 雲の 海が ひろがる
    C: [
      bars(ISL_C),
      bassLine(ISL.C, '1:12! 5:4', { lo: 41, ...F }),
      harpBars(ISL.C),
      mboxBars(ISL.C),
      drums(8, 'sh:8? sh:4 sh:4?'),
      drums(8, 'k:8! R:4? r:4', { last: 'k:4! r:4 tl:4? tl:4' }),
      bellBars(ISL.C),
    ],
    A2: [
      bars(ISL_A2),
      bassLine(ISL.A, '1:4! 5:4 8:4 5:4', { lo: 41, ...F }),
      harpBars(ISL.A),
      mboxBars(ISL.A),
      drums(8, WIND),
      drums(8, SKY_DR, { last: 'k:4! r:4 R:2 R:2 R:2 k:2' }),
      bellBars(ISL.A),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
};

// ═════════════ c10c_colonel: いばりんぼ行進曲（変ロ長調 116）═════════════
// むらさきの 軍服の たいさ。ブラスの いばった 行進（付点の「タッ・タ」）・チューバの ブン・チャッ・グロッケンの かざり。
//   A いばって 登場 → B 見せびらかす（変ホ長調の 和音で 胸を はる）→ C あわてる（ト短調・テンポ 132・16分で ばたばた・
//   さいごは 半音で ずり落ちる「あわわわ」）→ D 気を 取り直して また いばる（A と 同じ ふし。おしまいが 少し あせる）
//   雷の たいこ: 区切りの さいごに 低い タムの ゴロゴロと シンバル
const COL = {
  intro: ['Bb', 'F7'],
  A: ['Bb', 'Bb', 'F7', 'Bb', 'Eb', 'Bb', 'F7', 'Bb'],
  B: ['Eb', 'Eb', 'Bb', 'Bb', 'Cm', 'F7', 'Bb', 'F7'],
  C: ['Gm', 'D7', 'Gm', 'D7', 'Cm', 'Gm', 'D7', 'D7'],
};
const COL_A = [
  'F5:3! F5:1 Bb5:4! D6:6 Bb5:2', 'C6:3! Bb5:1 A5:2 Bb5:2 F5:8!', 'C6:3! C6:1 Eb6:4! D6:3 C6:1 A5:4', 'Bb5:4! F5:4 Bb4:4! r:4',
  'G5:3! G5:1 Bb5:4! Eb6:6 Bb5:2', 'D6:3! C6:1 Bb5:2 A5:2 Bb5:8!', 'C6:3! D6:1 Eb6:2 C6:2 A5:4! F5:4', 'Bb5:4! r:2 F5:2 Bb5:4! r:4',
];
const COL_B = [
  'G5:6! Ab5:2 Bb5:8', 'Eb6:6! D6:2 C6:4 Bb5:4', 'D6:6! C6:2 Bb5:8', 'F5:4! G5:4 Bb5:4! C6:4',
  'Eb6:6! D6:2 C6:8', 'A5:4! Bb5:4 C6:4! Eb6:4', 'D6:6! C6:2 Bb5:4 F5:4', 'C6:4! A5:4 F5:4! Eb5:4',
];
// あわてる（16分で ばたばた。さいごは 半音で ずり落ちる）
const COL_C = [
  'G5:2! A5:2 Bb5:2 A5:2 G5:2! F#5:2 G5:2 D5:2', 'F#5:2! G5:2 A5:2 C6:2 A5:2! G5:2 F#5:2 E5:2',
  'G5:2! Bb5:2 D6:2 Bb5:2 G5:2! F#5:2 F5:2 E5:2', 'D5:4! r:4 F#5:2! A5:2 D6:4',
  'C6:2! Eb6:2 D6:2 C6:2 G5:2! Ab5:2 G5:2 F#5:2', 'G5:2! Bb5:2 A5:2 G5:2 D6:2! C6:2 Bb5:2 A5:2',
  'F#5:2! A5:2 C6:2 Eb6:2 D6:2! C6:2 A5:2 F#5:2', 'D6:2! C#6:2 C6:2 B5:2 Bb5:2! A5:2 Ab5:2 G5:2',
];
// 気を 取り直す（A の ふし。おしまいが 少し あせる）
const COL_D = [...COL_A.slice(0, 7), 'Bb5:2! r:2 F5:1 F5:1 F5:2 Bb5:4! r:4'];
const MARCH = 'k:4! s:2 s:2? k:4 s:4';
const THUNDER = 'tl:2! tl:1 tl:1 tl:2 tl:2 c:8!';

const c10cColonel = {
  bpm: 116, bar: 16, reverb: 0.22, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.19, role: 'bass' },
    // ブン・チャッの チャッ
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // グロッケンの かざり
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // あわてる 時の マリンバ（ばたばた）
    { i: 'marimba', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    // 雷が 鳴って、ラッパの「パッ・パッ・パーン」
    intro: [
      'r:8 F5:3! F5:1 F5:4 Bb5:8! r:8',
      bassLine(COL.intro, ['1:8! r:8', '1:4! 1:4 5:4 1:4'], { lo: 34, ...F }),
      comp(COL.intro, ['r:16', 'x:4! x:4 x:4 r:4'], { center: 62, ...F }),
      rest(2),
      rest(2),
      drums(2, [THUNDER, 's:1 s:1 s:2 s:1 s:1 s:2 s:2! s:2 s:2 s:2!']),
    ],
    A: [
      bars(COL_A),
      bassLine(COL.A, '1:4! r:4 5:4 r:4', { lo: 34, ...F }),
      comp(COL.A, 'r:4 x:2. r:2 r:4 x:2. r:2', { center: 62, ...F }),
      bars(COL_A.map((b, i) => (i % 2 === 0 ? shift(b, 12).replace(/:(\d+)!?/g, ':$1?') : 'r:16'))),
      rest(8),
      drums(8, MARCH, { last: 'k:4! s:2 s:2 tl:2 tl:2 c:4!' }),
    ],
    // 見せびらかす
    B: [
      bars(COL_B),
      bassLine(COL.B, '1:4! 5:4 8:4 5:4', { lo: 34, ...F }),
      comp(COL.B, 'r:4 x:4. r:4 x:4.', { center: 64, ...F }),
      guide(COL.B, 'r:8 x:4? x:4?', { center: 84, ...F }),
      rest(8),
      drums(8, 'k:4! s:2? s:2 k:2 k:2 s:4!', { last: THUNDER }),
    ],
    // あわてる（ト短調・速い）
    C: {
      bpm: 132,
      ch: [
        bars(COL_C),
        bassLine(COL.C, '1:2! 5:2 1:2 5:2 1:2! 5:2 1:2 5:2', { lo: 38, ...F }),
        comp(COL.C, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 64, ...F }),
        rest(8),
        arp(COL.C, ['r:2 2:1? 1:1? 0:2? r:2 r:2 2:1? 1:1? 0:2? r:2', 'r:4 0:1? 1:1? 2:1? r:1 r:4 2:1? 1:1? 0:1? r:1'], { center: 70, ...F }),
        drums(8, 'k:2! s:1 s:1 k:2 s:2 k:2! s:1 s:1 s:2 s:1 s:1', { last: 's:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 tl:2! tl:2 th:2 c:2!' }),
      ],
    },
    // 気を 取り直して また いばる
    D: [
      bars(COL_D),
      bassLine(COL.A, '1:4! 1:2 1:2 5:4 r:4', { lo: 34, ...F }),
      comp(COL.A, 'r:4 x:2. r:2 r:4 x:2. r:2', { center: 62, ...F }),
      bars(COL_D.map((b, i) => (i % 2 === 1 ? shift(b, 12).replace(/:(\d+)!?/g, ':$1?') : 'r:16'))),
      rest(8),
      drums(8, MARCH, { first: 'c:4! s:2 s:2? k:4 s:4', last: 'k:2! r:2 s:1 s:1 s:2 tl:2! tl:2 tl:2 r:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'D'],
  loopFrom: 1,
  // ピンチ: 主音（シb）と 半音上（あせる）
  pinch: { n: 'Bb5:2 B5:2 Bb5:2 F5:2 Bb5:2 B5:2 Bb5:2 D6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10c_stolen: 三日月のかげ（イ短調 72。くり返さない）═════════════
// 紫の 音が うばわれる 短い 場面（20 秒）。1小節め は はっと する 1つの 音（弦の 和音・低い タム・ベルの 高い ミ）と しずけさ。
//   2〜5小節め は 少年の 曲（c9c_algol）の ふし〈シ・ラ・ソ・ファ・ミ・レ・ド → ミ・ラ・ド → シ〉を ベルで ゆっくり。
//   6小節め は ラを のばして しずかに おわる（オルゴールの 高い ミが きらり）。こわすぎない（大きな 音は 1つだけ・低い うなりなし）
const STO = {
  hit: ['Am'],
  S: ['Em', 'Am', 'Fmaj7', 'E'],
  E: ['Am'],
};
// c9c_algol の A の 1〜4小節と 同じ 音の ならび
export const ALGOL_HEAD = ['B5:4! A5:4 G5:4 F5:4', 'E5:4! D5:4 C5:8', 'r:4 E5:4 A5:4 C6:4', 'B5:12! r:4'];

const c10cStolen = {
  bpm: 72, bar: 16, once: true, reverb: 0.5, night: {},
  parts: [
    { i: 'bell', v: 0.08, role: 'lead' },
    { i: 'sub_bass', v: 0.12, role: 'bass' },
    { i: 'strings', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // はっと する（1つだけ）
    hit: [
      'E6:2! r:14',
      'A1:16',
      `${comp(STO.hit, 'x:4! r:12', { center: 64 })}`,
      'r:16',
      'r:8 [A4 E5]:8?',
      'tl:2! r:2 c:12',
    ],
    S: [
      bars(ALGOL_HEAD),
      bassLine(STO.S, '1:16', { lo: 33 }),
      guide(STO.S, 'x:16?', { center: 60 }),
      arp(STO.S, ['r:4 4:2? r:10', 'r:12 2:2? r:2'], { center: 86 }),
      pad(STO.S, { center: 62, mods: '?' }),
      drums(4, 'r:16'),
    ],
    E: [
      'r:4 E5:4? A5:8',
      bassLine(STO.E, '1:16', { lo: 33 }),
      'r:16',
      'r:8 E7:4? r:4',
      pad(STO.E, { center: 62, mods: '?' }),
      'r:16',
    ],
  },
  form: ['hit', 'S', 'E'],
};

// ═════════════ c10c_fort: ガッチャンベルト工場（ニ短調 112）═════════════
// 大地の下の とりでの ベルトの 工場。機械の きざみ（マリンバの 8分・ベースの 8分・ハットと リムの ガッチャン）。
//   A 工場の ふし（同じ 音を きざむ）→ B 3人組が こっそり 手つだう（はじめの 4小節は 工場の ふしが 休み、チップの 音で
//   3人組の 曲〈c9a_trio〉の 1〜4小節。ヘ長調 ＝ ニ短調の なかま）→ C レバーで ベルトが 逆回り（きざみが 上から 下へ）→
//   A2 工場の ふしに 3人組の ふしの 形が 重なる（チップの 音が いっしょに 動いて しまう おかしさ）
const FT = {
  intro: ['Dm', 'A'],
  A: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'],
  B: [...C9A_TRIO_THEME.chords.A.slice(0, 4), 'Dm', 'Dm', 'Gm', 'A'],
  C: ['Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'],
};
const FT_A = [
  'D5:2.! D5:2. F5:2. D5:2. A5:4! G5:2. F5:2.', 'E5:2.! F5:2. G5:2. E5:2. D5:4! r:4',
  'D5:2.! D5:2. F5:2. Bb5:2. D6:4! C6:2. Bb5:2.', 'C#6:4! A5:4 E5:4! C#5:4',
  'D5:2.! D5:2. F5:2. D5:2. A5:4! G5:2. F5:2.', 'E5:2.! F5:2. G5:2. A5:2. D6:4! A5:4',
  'G5:2.! Bb5:2. D6:2. Bb5:2. G5:4! Bb5:4', 'A5:2.! G5:2. F5:2. E5:2. C#5:4! E5:4',
];
// 3人組の ふし（c9a_trio の A の 1〜4小節 そのまま）
export const FORT_TRIO = C9A_TRIO_THEME.A.slice(0, 4);
const FT_B_LEAD = [...['r:16', 'r:16', 'r:16', 'r:16'], ...FT_A.slice(4)];
// 逆回り（長い 音）
const FT_C = [
  'F5:4! Bb5:4 D6:8', 'E6:4! D6:4 C6:8', 'D6:4! A5:4 F5:4! A5:4', 'D6:12! r:4',
  'D6:4! Bb5:4 F5:8', 'G5:4! C6:4 E6:8', 'C#6:4! E6:4 A5:4! C#6:4', 'E6:8! r:2 C#6:2 A5:2 E5:2',
];
// 3人組の ふしの 形を ニ短調に（ド・ファ・ラ・ファ・ド → ラ・レ・ファ・レ・ラ）
const TRIO_SHAPE = 'A4:2.! D5:2. F5:2. D5:2. A5:4! F5:2. r:2';
const BELT_UP = '0:2.! 1:2. 2:2. 1:2. 0:2. 1:2. 2:2. 3:2.';
const BELT_DOWN = '3:2.! 2:2. 1:2. 2:2. 3:2. 2:2. 1:2. 0:2.';
const CLANK = 'k:2! h:1 h:1 R:2 h:2 k:2 h:1 h:1 R:2! h:2';

const c10cFort = {
  bpm: 112, bar: 16, reverb: 0.2, fill: 0, night: {},
  parts: [
    { i: 'saw_lead', v: 0.065, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // 機械の きざみ
    { i: 'marimba', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.25 },
    // 3人組（こっそり）
    { i: 'chip_square', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'pad', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    // 機械が 動き出す
    intro: [
      'r:16 r:8 A5:2. G5:2. F5:2. E5:2.',
      bassLine(FT.intro, ['1:2.! r:6 1:2. r:6', '1:2.! 1:2. 1:2. 1:2. 5:2.! 5:2. 5:2. 5:2.'], { lo: 38, ...F }),
      arp(FT.intro, ['0:2.! r:6 0:2. r:6', BELT_UP], { center: 62, ...F }),
      rest(2),
      pad(FT.intro, { center: 60, mods: '?', ...F }),
      drums(2, ['k:2! r:6 k:2 r:6', CLANK]),
    ],
    A: [
      bars(FT_A),
      bassLine(FT.A, '1:2.! 1:2. 8:2. 1:2. 1:2.! 1:2. 8:2. 5:2.', { lo: 38, ...F }),
      arp(FT.A, BELT_UP, { center: 62, ...F }),
      rest(8),
      pad(FT.A, { center: 60, mods: '?', ...F }),
      drums(8, CLANK, { last: 'k:2! h:1 h:1 R:2 h:2 k:2 R:1 R:1 R:2! R:2' }),
    ],
    // 3人組が こっそり 手つだう
    B: [
      bars(FT_B_LEAD),
      `${bassLine(FT.B.slice(0, 4), '1:4! r:4 5:4 r:4', { lo: 38, ...F })} ${bassLine(FT.B.slice(4), '1:2.! 1:2. 8:2. 1:2. 1:2.! 1:2. 8:2. 5:2.', { lo: 38, ...F })}`,
      `${arp(FT.B.slice(0, 4), '0:2.! r:6 r:8', { center: 62, ...F })} ${arp(FT.B.slice(4), BELT_UP, { center: 62, ...F })}`,
      `${bars(FORT_TRIO.map((b) => b.replace(/:(\d+)!?/g, ':$1.').replace(/\.\./g, '.')))} ${arp(FT.B.slice(4), ['r:12 0:1? 1:1? 2:2?', 'r:16'], { center: 74, ...F })}`,
      pad(FT.B, { center: 60, mods: '?', ...F }),
      drums(8, ['R:2? r:6 R:2? r:6', 'R:2? r:6 R:2? r:2 R:1 R:1 r:2', 'R:2? r:6 R:2? r:6', 'R:2? r:6 R:2 R:2 R:2 R:2', CLANK, CLANK, CLANK, CLANK]),
    ],
    // ベルトが 逆回り
    C: [
      bars(FT_C),
      bassLine(FT.C, '1:4! 1:2. 1:2. 5:4 5:2. 5:2.', { lo: 38, ...F }),
      arp(FT.C, BELT_DOWN, { center: 64, ...F }),
      rest(8),
      pad(FT.C, { center: 60, ...F }),
      drums(8, 'k:2! h:2 R:2 h:2 k:2 h:2 R:2! h:2', { last: 'k:2! R:1 R:1 R:2 R:2 k:2 R:1 R:1 tl:2 tl:2' }),
    ],
    // 3人組の 形が 重なる
    A2: [
      bars(FT_A),
      bassLine(FT.A, '1:2.! 1:2. 8:2. 1:2. 1:2.! 1:2. 8:2. 5:2.', { lo: 38, ...F }),
      arp(FT.A, BELT_UP, { center: 62, ...F }),
      bars([TRIO_SHAPE, 'r:16', 'r:16', 'r:16', TRIO_SHAPE, 'r:16', 'r:16', 'r:16']),
      pad(FT.A, { center: 60, mods: '?', ...F }),
      drums(8, CLANK, { first: 'c:2! h:1 h:1 R:2 h:2 k:2 h:1 h:1 R:2! h:2', last: 'k:2! k:1 k:1 R:2 R:2 k:2 R:1 R:1 tl:2 tl:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
};

// ═════════════ c10c_rival: ふたつの光（イ短調 132）═════════════
// 少年との はじめての 戦い。少年の 曲（c9c_algol）の ふし〈シ・ラ・ソ・ファ・ミ・レ・ド〉を つめたい シンセで 8分・4分の 戦いの ふしに。
//   ベースの 8分と オルゴールの つめたい きらめき・弦の のばし。かなしすぎない・はげしすぎない（たいこは 8分の 中くらい）。
//   A 少年の ふし → B 光が またたく（c9c_algol の B）→ C ふたつの 光（少年の ふしは 半分の 速さで シ・ラ・ソ・ファ・ミ・レ・ド。
//   そこへ 笛が スピカの歌の 1ふしめを 1回だけ 重ねる）→ A2
const RIV = {
  intro: ['Am', 'E'],
  A: ['Em', 'Am', 'Fmaj7', 'E', 'Am', 'Dm', 'Fmaj7', 'E'],
  B: ['Am', 'C', 'Dm', 'E', 'Am', 'C', 'Dm', 'E'],
  C: ['Em Am', 'C F', 'C Dm', 'C', 'Am', 'Dm', 'Fmaj7', 'E'],
};
const RIV_A = [
  'B5:4! A5:4 G5:4! F5:4', 'E5:4! D5:4 C5:4! r:2 C5:2', 'A5:2! E5:2 A5:2 B5:2 C6:4! E6:2 C6:2', 'B5:6! A5:2 G#5:4! E5:4',
  'C6:4! B5:4 A5:4! G5:4', 'F5:4! E5:4 D5:4! r:4', 'r:2 D5:2 F5:2 A5:2 C6:4! A5:4', 'G#5:8! E5:4 G#5:4',
];
const RIV_B = [
  'E6:2! E6:2 r:2 E6:2? E6:2! r:2 D6:2 C6:2', 'E6:2! r:2 E6:2? r:2 G6:4! E6:4', 'F6:2! F6:2 r:2 F6:2? D6:4! A5:4', 'B5:4! G#5:4 E5:4! G#5:4',
  'A5:2! C6:2 E6:2 C6:2 A5:4! E5:4', 'G5:2! C6:2 E6:2 C6:2 G6:4! E6:4', 'F6:4! D6:4 A5:4! F5:4', 'E5:4! G#5:4 B5:4! D6:4',
];
// ふたつの 光: 少年の ふしは 半分の 速さで 7つの 音を 下へ（1〜4小節）→ c9c_algol の 5〜8小節
const RIV_C = [
  'B5:8! A5:8', 'G5:8! F5:8', 'E5:8! D5:8', 'C5:16!',
  'C6:4! B5:4 A5:4! G5:4', 'F5:4! E5:4 D5:8!', 'r:4 D5:4 F5:4! A5:4', 'G#5:8! E5:8',
];
// スピカの歌の 1ふしめ（c9d_song。笛。この 区切りで 1回だけ）
export const RIVAL_SPICA = C9D_SONG.phrases[0];
const RIV_A2 = [...RIV_A.slice(0, 7), 'G#5:4! B5:4 E5:4! E5:2 G#5:2'];
const RIV_DR = 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2';

const c10cRival = {
  bpm: 132, bar: 16, reverb: 0.3, fill: 0, night: {},
  parts: [
    { i: 'saw_lead', v: 0.07, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'musicbox', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.3 },
    // スピカの 笛（C だけ）
    { i: 'flute', v: 0.09, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 E5:4! G#5:4',
      bassLine(RIV.intro, ['1:2! 1:2 1:2 1:2 1:2 1:2 1:2 1:2', '1:2! 1:2 1:2 1:2 5:2! 5:2 5:2 5:2'], { lo: 33 }),
      pad(RIV.intro, { center: 62, mods: '?' }),
      arp(RIV.intro, ['r:2 4:1? r:5 r:2 2:1? r:5', 'r:2 4:1? r:3 3:1? r:1 2:1? r:1 1:1? r:1 0:1? r:3'], { center: 84 }),
      rest(2),
      drums(2, ['k:4! r:4 k:4 r:4', 'k:2! h:2 s:2 h:2 s:1 s:1 s:2 t:2 tl:2']),
    ],
    A: [
      bars(RIV_A),
      bassLine(RIV.A, '1:2! 1:2 8:2 1:2 1:2! 1:2 8:2 5:2', { lo: 33 }),
      guide(RIV.A, 'x:8 x:8', { center: 64 }),
      arp(RIV.A, 'r:2 4:1? r:3 2:1? r:1 r:2 3:1? r:3 1:1? r:1', { center: 84 }),
      rest(8),
      drums(8, RIV_DR, { last: 'k:2! h:2 s:2 h:2 s:1 s:1 s:2 t:2 tl:2' }),
    ],
    // 光が またたく
    B: [
      bars(RIV_B),
      bassLine(RIV.B, '1:4! 1:2 1:2 5:4 1:2 1:2', { lo: 33 }),
      pad(RIV.B, { center: 60 }),
      arp(RIV.B, 'r:2 2:1? r:3 4:1? r:1 r:2 3:1? r:3 2:1? r:1', { center: 86 }),
      rest(8),
      drums(8, 'k:4! s:2? h:2 k:2 h:2 s:4', { last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
    // ふたつの 光（スピカの 笛が 1回 重なる）
    C: [
      bars(RIV_C),
      bassLine(RIV.C, '1:4! 1:2 1:2 1:4! 1:2 1:2', { lo: 33 }),
      pad(RIV.C, { center: 60, mods: '?' }),
      arp(RIV.C, 'r:4 4:1? r:7 3:1? r:3', { center: 86 }),
      `${bars(RIVAL_SPICA)} ${rest(4)}`,
      drums(8, 'k:4! h:4? R:4 h:4?', { last: 'k:2! h:2 s:2 h:2 s:1 s:1 s:2 t:2 tl:2' }),
    ],
    A2: [
      bars(RIV_A2),
      bassLine(RIV.A, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2', { lo: 33 }),
      guide(RIV.A, 'x:4 x:4 x:8', { center: 64 }),
      arp(RIV.A, 'r:2 4:1? r:3 2:1? r:1 r:2 3:1? r:3 1:1? r:1', { center: 84 }),
      rest(8),
      drums(8, RIV_DR, { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ラ）と 半音上
  pinch: { n: 'A5:2 Bb5:2 A5:2 E5:2 A5:2 Bb5:2 A5:2 C6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10c_six: そろった六つの音（ハ長調 124。くり返さない）═════════════
// 6つの 台が 光る。スピカの歌の 1〜6ふしめの はじめの 小節を 1小節ずつ じゅんに（笛。c10b_five と 同じ 作りで 6ふしめまで）。
//   ベルは その ふしの 頭の 音を 1オクターブ 上で。さいごの 小節は ベルが レ・ミ・ファ・ソ・ラ・シ（集めた 6つの 星の音）を のぼり、
//   シを のばして ソの 和音で 止まる（ドへ 帰らない ＝ あと 1つ）
const SIX_HEADS = C9D_SONG.phrases.slice(0, 6).map((ph) => ph[0]);
const SIX_CH = [...C9D_SONG.chords.slice(0, 6).map((c) => c[0]), 'F G'];
const headOf = (b) => b.trim().split(/\s+/)[0].split(':')[0];
export const SIX_NOTES = ['D', 'E', 'F', 'G', 'A', 'B'];
const SIX_BELL = [
  ...SIX_HEADS.map((b) => `${shift(`${headOf(b)}:8`, 12)}! r:8`),
  `${SIX_NOTES.slice(0, 5).map((n) => `${n}6:2`).join(' ')} B6:6!`,
];

const c10cSix = {
  bpm: 124, bar: 16, once: true, reverb: 0.4, night: {},
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
      bars([...SIX_HEADS, 'D6:4! E6:4 F6:4! B5:4']),
      `${bassLine(SIX_CH.slice(0, 6), '1:4! 5:4 1:4 5:4', { lo: 36 })} ${bassLine(SIX_CH.slice(6), '1:4! 5:4 1:8!', { lo: 36 })}`,
      bars(SIX_BELL),
      arp(SIX_CH, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
      pad(SIX_CH, { center: 62 }),
      drums(7, 'k:4! h:4? R:4 h:4?', { first: 'c:4! h:4? R:4 h:4?', last: 'c:4! r:4 tl:2 t:2 th:2 c:2?' }),
    ],
  },
  form: ['S'],
};

for (const tr of [c10cIsles, c10cColonel, c10cStolen, c10cFort, c10cRival, c10cSix]) tr.ch = oldView(tr);

// テストが 見る: クモイの ふし・少年の ふし・3人組の ふし・スピカの歌の 頭
export const C10C_LINES = { kumoiA: KUMOI_A, kumoiB: KUMOI_B, islesA2: ISL_A2, colA: COL_A, colC: COL_C, rivA: RIV_A, rivC: RIV_C, sixHeads: SIX_HEADS };

// 曲の id は docs/plan-part3-c10c.md の 15-4（かえない）
export const C10C_TRACKS = {
  c10c_isles: c10cIsles,
  c10c_colonel: c10cColonel,
  c10c_stolen: c10cStolen,
  c10c_fort: c10cFort,
  c10c_rival: c10cRival,
  c10c_six: c10cSix,
};
export const C10C_IDS = Object.keys(C10C_TRACKS);
