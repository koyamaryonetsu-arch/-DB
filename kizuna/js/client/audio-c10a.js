// 第94回 F: 第3部 第2章 第1幕「赤と緑」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c10a.md の「実装メモ（第2章 第1幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。2人の 中ボスの 曲も もとの 作品の メロディを 借りて いない）。
//   c10r_road・c10r_run は 第3章の 炎の山の 曲（volcano）の ふし 16小節を そのまま 使う（行きは おそく・帰りは 速く）。
//   c10_fork は スピカの歌（c9d_song）の 1ふしめ を 中に もつ。c10g_roots は ささやきの森の 曲（forest）の 頭〈ミ・ファ#・ソ・ラ〉から 始まる
//
// ・c10_fork … ふたつの道しるべ（ハ長調 108。26.7 秒。くり返さない。スピカの歌の 1ふしめ → 赤〈ハ短調・炎の山の 頭〉と 緑〈ホ長調・森の 頭〉→ 高い ミで おわる）
// ・c10r_road … 炎の山の古い道（ハ短調 76。炎の山の ふしを 半分より おそく、やわらかい 笛と ハープで 静かに。遠くで ようがんが ドーンと ひくい タム）
// ・c10r_run … かけ上がる帰り道（ハ短調 152。同じ ふしを 2倍の 速さで。画面の 状態 lavaStage〈0〜3。ようがんが 近いほど 大きい〉で
//     強さ 0.4・0.6・0.8・1.0 ＝ たいこと 低い 音が ふえる。テンポも 少し 上がる〈1・1.02・1.04・1.06 倍〉。くり返しの とちゅうでも 次の 小節から かわる）
// ・c10r_boss … ガタゴト大発明（ヘ長調 136。マリンバの 16分が 機械の ガタゴト。とぼけた ふし・ドリルの 16分の 同じ 音。にくめない）
// ・c10g_roots … 大地の下の根の国（ト長調 92。明るく 広い。森の 頭の 4つの 音を ハ長調の 和音の 上で〈ふわっと 明るい〉。オルゴールの ほうしが まう）
// ・c10g_boss … いたずらスウィング（イ短調 126。はねる 8分。ピチカートの ふしが 半音で しのびより、ブラスが「ぶっ」と こたえる。にくめない）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=96e031897dcd';
import { C9D_SONG } from './audio-c9d.js?v=96e031897dcd';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;

// ハ短調・ヘ長調の 音の 名前（レb・ミb・ラb・シb）
const CM = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const F = { sp: FLAT };
const M = { sp: CM };

// ═════════════ 炎の山の ふし（第3章 volcano の メロディ 16小節。音も 長さも 同じ）═════════════
const VOLC = [
  'C5:2! r:2 C5:2 Eb5:2 G5:4 F5:2 Eb5:2', 'D5:2! Eb5:2 C5:4 G4:8',
  'Db5:2! r:2 Db5:2 F5:2 Ab5:4 G5:2 F5:2', 'Eb5:2! F5:2 Db5:4 Ab4:8',
  'G5:4! Ab5:2 G5:2 Eb5:4 C5:4', 'D5:4! Eb5:2 D5:2 B4:8',
  'Bb4:4! D5:4 F5:4 Bb5:4', 'Ab5:6! G5:2 B4:4 D5:4',
  'C6:4! Ab5:2 F5:2 C5:4 F5:4', 'G5:2! Ab5:2 G5:2 F5:2 Eb5:4 C5:4',
  'Db6:4! Ab5:2 F5:2 Db5:4 F5:4', 'Ab5:2! Bb5:2 Ab5:2 F5:2 Eb5:4 Db5:4',
  'C5:4! Eb5:4 Ab5:4 C6:4', 'D6:4! Bb5:4 F5:4 D5:4',
  'B5:6! G5:2 D5:4 B4:4', 'G5:2! F5:2 Eb5:2 D5:2 B4:8',
];
// 和音（第3章の ベースと 同じ 根音。6小節めと 8小節めの うしろ半分は ソの 和音 ＝ シの 音が ぶつからない）
const VCH = ['Cm', 'Cm', 'Db', 'Db', 'Cm', 'Cm G', 'Bb', 'Ab G', 'Fm', 'Fm', 'Db', 'Db', 'Ab', 'Bb', 'G', 'G'];
const VA = VOLC.slice(0, 8);
const VB = VOLC.slice(8);
const VCA = VCH.slice(0, 8);
const VCB = VCH.slice(8);

// ═════════════ c10_fork: ふたつの道しるべ（ハ長調 108。くり返さない）═════════════
// 12小節 = 26.7 秒。ハープが 星の子の 7つの 音を のぼる → スピカの歌の 1ふしめ（笛）
//   → 赤い 光（ハ短調。炎の山の 頭 ド・ド・ミb・ソ）と 緑の 光（ホ長調。森の 頭 ミ・ファ#・ソ#）が 1小節ずつ
//   → ファ → ソ → ラb → シb と のぼって ハ長調へ。高い ミで おわる（旅が 広がる わくわく）
const FORK = {
  intro: ['C', 'F'],
  S: C9D_SONG.chords[0],
  D: ['Cm', 'E', 'F G', 'Ab Bb'],
  E: ['C', 'C'],
};
const FORK_D = [
  'C5:2! C5:2 Eb5:2 G5:2 F5:2! Eb5:2 D5:2 Eb5:2',
  'E5:4! F#5:2 G#5:2 B5:4 G#5:2 F#5:2',
  'A5:4! C6:4 B5:4! D6:4',
  'C6:4! Eb6:4 D6:4! F6:4',
];
const FORK_E = ['C6:4! E6:4 G6:8', 'E6:12! r:4'];

const c10Fork = {
  bpm: 108, bar: 16, once: true, reverb: 0.4,
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'pad', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.32, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(FORK.intro, '1:16', { lo: 36 }),
      bars(['C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:4', arp(['F'], '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 64 })]),
      pad(FORK.intro, { center: 62, mods: '?' }),
      bars(['r:8 E6:8?', 'r:16']),
      drums(2, 'r:16', { last: 'r:8 t:2? t:2? th:2 tl:2' }),
    ],
    // スピカの歌の 1ふしめ
    S: [
      bars(C9D_SONG.phrases[0]),
      bassLine(FORK.S, '1:4! 5:4 1:4 5:4', { lo: 36 }),
      arp(FORK.S, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
      pad(FORK.S, { center: 62 }),
      bars(['r:16', 'r:16', 'r:16', 'r:8 G6:8?']),
      drums(4, 'k:4! h:4? R:4 h:4?', { last: 'k:4! h:4? R:2 R:2 t:2 tl:2' }),
    ],
    // 赤と 緑の 光の すじ（2つの 方向）
    D: [
      bars(FORK_D),
      bassLine(FORK.D, '1:4! 5:4 1:4 5:4', { lo: 36, ...M }),
      arp(FORK.D, '0:2! 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 66, ...M }),
      pad(FORK.D, { center: 62, ...M }),
      bars(['C6:4? r:12', 'B6:4? r:12', 'r:16', 'r:8 F6:8?']),
      drums(4, 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', last: FILL }),
    ],
    // ハ長調で 広がって おわる
    E: [
      bars(FORK_E),
      bassLine(FORK.E, ['1:4! 5:4 8:8', '1:12! r:4'], { lo: 36 }),
      bars(['0:2 1:2 2:2 3:2 4:2 5:2 6:2 r:2', 'r:16'].map((p, i) => (i ? p : arp(['C'], p, { center: 70 })))),
      pad(FORK.E, { center: 64 }),
      bars(['r:8 G6:4? C7:4?', 'E7:4? r:12']),
      drums(2, 'c:4! r:4 tl:2 t:2 th:2 r:2', { last: 'c:4! k:4 r:8' }),
    ],
  },
  form: ['intro', 'S', 'D', 'E'],
};

// ═════════════ c10r_road: 炎の山の古い道（ハ短調 76）═════════════
// 炎の山の 古い 道を 下る。第3章の 炎の山の ふし（144）を 76 で（半分より おそく）。やわらかい 笛・ハープの ゆっくりの 分散和音・
//   低い のばし（ずっと 下で ようがんが うなる）。たいこは 遠くの ひくい タム（ドーン）と リムだけ。
//   A 炎の山の 前半 → B 後半 → C 遠くで ようがんが 赤く 光る（ふしは 長い 音だけ。ベルが ぽつり）
const ROAD = {
  intro: ['Cm', 'Cm'],
  C: ['Ab', 'Fm', 'Db', 'Cm', 'Ab', 'Fm', 'Db', 'G'],
};
const ROAD_C = [
  'Eb5:8! C5:8', 'F5:8! Ab5:4 C6:4', 'Db6:8! Ab5:4 F5:4', 'G5:12! r:4',
  'Ab5:8! C6:8', 'C6:8! F5:8', 'F5:8! Ab5:4 Db6:4', 'D6:8! B5:8',
];
const ROAD_DR = 'tl:4? r:8 R:4?';

const c10rRoad = {
  bpm: 76, bar: 16, reverb: 0.46, night: {},
  parts: [
    { i: 'soft_lead', v: 0.09, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pluck', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.26, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(ROAD.intro, '1:16', { lo: 36, ...M }),
      pad(ROAD.intro, { center: 60, mods: '?', ...M }),
      arp(ROAD.intro, '0:4? 1:4? 2:4? 1:4?', { center: 64, ...M }),
      bars(['r:8 G6:8?', 'r:16']),
      drums(2, 'tl:4? r:12', { last: 'tl:4? r:4 tl:2? r:6' }),
    ],
    A: [
      bars(VA),
      bassLine(VCA, '1:8! 5:8', { lo: 36, ...M }),
      pad(VCA, { center: 60, ...M }),
      arp(VCA, '0:4? r:4 2:4? r:4', { center: 64, ...M }),
      bars(['r:16', 'r:12 G6:4?', 'r:16', 'r:12 Ab6:4?', 'r:16', 'r:12 G6:4?', 'r:16', 'r:16']),
      drums(8, ROAD_DR, { last: 'tl:4? r:4 R:2? R:2? tl:2 r:2' }),
    ],
    B: [
      bars(VB),
      bassLine(VCB, '1:8! 5:4 8:4', { lo: 36, ...M }),
      pad(VCB, { center: 62, ...M }),
      arp(VCB, '0:2? 1:2? 2:2? 1:2? 0:2? 1:2? 2:2? 3:2?', { center: 64, ...M }),
      rest(8),
      drums(8, 'tl:4? r:4 R:4? r:2 R:2?', { last: 'tl:4? r:4 tl:2 tl:2 t:2? tl:2' }),
    ],
    // 遠くで ようがんが 赤く 光る
    C: [
      bars(ROAD_C),
      bassLine(ROAD.C, '1:16', { lo: 33, ...M }),
      pad(ROAD.C, { center: 60, mods: '?', ...M }),
      rest(8),
      bars(['r:4 Eb6:2? r:10', 'r:16', 'r:4 Ab6:2? r:10', 'r:16', 'r:4 C7:2? r:10', 'r:16', 'r:4 Ab6:2? r:10', 'r:8 G6:8?']),
      drums(8, 'tl:4? r:12', { last: 'tl:4? r:4 R:2? r:2 R:2? R:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C'],
  loopFrom: 1,
};

// ═════════════ c10r_run: かけ上がる帰り道（ハ短調 152）═════════════
// 同じ 道の 帰り。c10r_road と 同じ 炎の山の ふしを 2倍の 速さで（76 → 152）。ベースは 8分で せかす。
//   画面の 状態 lavaStage（0〜3。ようがんが 近いほど 大きい）→ 強さ 0.4・0.6・0.8・1.0 で パートが ふえる:
//     0 … ふし・ベース・弦の きざみ・キックと ハイハット（あせる けど こわく ない）
//     1 … ＋ スネア・低い うなり（オクターブ下の のばし）
//     2 … ＋ ひくい タムの かけ足
//     3 … ＋ 低い ブラスの「ドン！」。テンポも だんで 1.06 倍まで
//   区切り: intro 山が うなる → A 炎の山の 前半 → B 後半 → C かけ上がる（8分の 分散和音）→ A2 → D あと 少し（ソの 上で のぼる）
const RUN = {
  intro: ['Cm', 'Cm'],
  C: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G'],
  D: ['Ab', 'Bb', 'G', 'G'],
};
const RUN_C = [
  'G5:2! Eb5:2 C5:2 Eb5:2 G5:2! C6:2 G5:2 Eb5:2', 'Ab5:2! Eb5:2 C5:2 Eb5:2 Ab5:2! C6:2 Ab5:2 Eb5:2',
  'Bb5:2! F5:2 D5:2 F5:2 Bb5:2! D6:2 Bb5:2 F5:2', 'B5:2! G5:2 D5:2 G5:2 B5:2! D6:2 F6:2 D6:2',
  'C6:2! G5:2 Eb5:2 G5:2 C6:2! Eb6:2 C6:2 G5:2', 'C6:2! Ab5:2 Eb5:2 Ab5:2 C6:2! Eb6:2 C6:2 Ab5:2',
  'C6:2! Ab5:2 F5:2 Ab5:2 C6:2! F6:2 C6:2 Ab5:2', 'B5:2! D6:2 G6:4! F6:2 D6:2 B5:4',
];
const RUN_D = ['C5:4! Eb5:4 Ab5:4 Eb5:4', 'D5:4! F5:4 Bb5:4 F5:4', 'B4:4! D5:4 G5:4 B5:4', 'D6:4! B5:4 G5:2 F5:2 D5:2 B4:2'];
// 強さ（lavaStage 0〜3）と パートの はじまり
export const LAVA_INTENSITY = [0.4, 0.6, 0.8, 1];
const RUN_BASS = '1:2! 1:2 8:2 1:2 1:2! 1:2 8:2 1:2';
const RUN_STR = 'x:2.! r:6 x:2. r:6';
const RUN_LOW = '1:8! 1:8';
const RUN_BRASS = 'l:4! r:12';
const RUN_K = 'k:2! r:2 h:2 r:2 k:2! r:2 h:2 h:2';
const RUN_S = 'r:4 s:4! r:2 k:2 s:4!';
const RUN_T = 'tl:2! r:6 tl:2 r:2 tl:2 r:2';
// 区切りの 4つの パート（ふし以外）: ベース・弦・低い うなり・ブラス・たいこ 3つ
const runBody = (prog, n, { bass = RUN_BASS, str = RUN_STR, k = RUN_K, s = RUN_S, t = RUN_T, last = {} } = {}) => [
  bassLine(prog, bass, { lo: 40, ...M }),
  comp(prog, str, { center: 66, ...M }),
  bassLine(prog, RUN_LOW, { lo: 28, ...M }),
  comp(prog, RUN_BRASS, { center: 55, ...M }),
  drums(n, k, { last: last.k }),
  drums(n, s, { last: last.s }),
  drums(n, t, { last: last.t }),
];

const c10rRun = {
  bpm: 152, bar: 16, reverb: 0.18, fill: 0, night: {},
  parts: [
    { i: 'lead', w: 'square', v: 0.075, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.2 },
    // 低い うなり（ベースの 1オクターブ下）。lavaStage 1 から
    { i: 'sub_bass', v: 0.12, role: 'harmony', minIntensity: 0.6, pan: 0 },
    // 低い ブラスの「ドン！」。lavaStage 3 だけ
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 1, pan: -0.2 },
    { drums: true, v: 0.34, minIntensity: 0 },
    { drums: true, v: 0.36, minIntensity: 0.6 },
    { drums: true, v: 0.34, minIntensity: 0.8 },
  ],
  sections: {
    // 山が うなる（ふしは 休み）
    intro: [
      rest(2),
      bassLine(RUN.intro, '1:2! 1:2 1:2 1:2 1:2! 1:2 1:2 1:2', { lo: 40, ...M }),
      comp(RUN.intro, 'x:16', { center: 64, ...M }),
      bassLine(RUN.intro, '1:16', { lo: 28, ...M }),
      comp(RUN.intro, 'r:12 x:4!', { center: 55, ...M }),
      drums(2, 'k:4! r:12', { last: 'k:4! r:4 k:2 k:2 k:2 k:2' }),
      drums(2, 'r:16', { last: 'r:8 s:2 s:2 s:1 s:1 s:1 s:1' }),
      drums(2, 'tl:4! r:12', { last: 'tl:2 tl:2 tl:2 tl:2 t:2 t:2 th:2 th:2' }),
    ],
    A: [bars(VA), ...runBody(VCA, 8, { last: { s: 'r:4 s:2 s:2 s:2 s:2 s:1 s:1 s:1 s:1' } })],
    B: [bars(VB), ...runBody(VCB, 8, { bass: '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', last: { t: 'tl:2 r:2 t:2 r:2 th:2 th:2 th:2 th:2' } })],
    // かけ上がる
    C: [bars(RUN_C), ...runBody(RUN.C, 8, { str: 'x:4! r:4 x:4! r:4', k: 'k:2! h:2 k:2 h:2 k:2! r:2 r:2 h:2' })],
    A2: [bars(VA), ...runBody(VCA, 8, { bass: '1:2! 5:2 8:2 5:2 1:2! 5:2 8:2 5:2', str: 'r:4 x:2. r:6 x:2. r:2' })],
    // あと 少し（ソの 上で のぼる → A の ドへ）
    D: [bars(RUN_D), ...runBody(RUN.D, 4, { str: 'x:4! r:4 x:4! r:4', last: { k: 'k:2! r:2 k:2 r:2 k:2 r:2 k:2 k:2', s: 's:2 r:2 s:2 r:2 s:1 s:1 s:1 s:1 s:2 s:2', t: 'tl:2 r:2 tl:2 r:2 t:2 r:2 th:2 th:2' } })],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
  // だん ＝ lavaStage（形は かえない ＝ ふしの とちゅうから 止まらない。テンポだけ 少し 上がる）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1.02 },
    { transpose: 0, tempo: 1.04 },
    { transpose: 0, tempo: 1.06 },
  ],
};

// ═════════════ c10r_boss: ガタゴト大発明（ヘ長調 136）═════════════
// たまごの 形の 科学者と ドリルの メカ。にくめない。マリンバの 16分（根音と 5度の 行ったり 来たり）が 機械の ガタゴト、
//   たいこは キックと リムの「ガタ・ゴト」。ふしは とぼけた 行進（休みで「ぽん」と 止まる）。
//   A とぼけた 行進 → B ドリル（ニ短調。同じ 音の 16分「ギュイーン」）→ C あつく なって ひと休み（半分の 速さに 聞こえる）→ A2 ブラスが 足される
const RB = {
  intro: ['F', 'C7'],
  A: ['F', 'F', 'C7', 'C7', 'F', 'Bb', 'C7', 'F'],
  B: ['Dm', 'Dm', 'Bb', 'A7', 'Dm', 'Dm', 'Gm', 'A7'],
  C: ['Bb', 'F', 'Gm', 'C7', 'Bb', 'F', 'G7', 'C7'],
};
const RB_A = [
  'C5:2! F5:2 r:2 F5:2 A5:2! r:2 G5:2 F5:2', 'C6:4! A5:2 F5:2 C5:4! r:4',
  'E5:2! G5:2 r:2 G5:2 Bb5:2! r:2 A5:2 G5:2', 'C6:4! Bb5:2 G5:2 E5:4! r:4',
  'A5:2! C6:2 r:2 C6:2 F6:2! r:2 E6:2 D6:2', 'D6:4! Bb5:2 G5:2 F5:4! D5:4',
  'C5:2! C#5:2 D5:2 D#5:2 E5:4! G5:4', 'F5:4! r:2 C5:2 F5:4! r:4',
];
const RB_B = [
  'D5:1! D5:1 D5:1 D5:1 F5:2 D5:2 A5:2! r:2 A5:2 r:2', 'A5:2! G#5:2 A5:2 G#5:2 A5:2! F5:2 E5:2 D5:2',
  'D5:1! D5:1 D5:1 D5:1 F5:2 D5:2 Bb5:2! r:2 Bb5:2 r:2', 'C#6:2! A5:2 E5:2 A5:2 G5:4! E5:4',
  'F5:1! F5:1 F5:1 F5:1 A5:2 F5:2 D6:2! r:2 D6:2 r:2', 'D6:2! C#6:2 D6:2 C#6:2 D6:2! A5:2 F5:2 D5:2',
  'G5:2! Bb5:2 D6:2 Bb5:2 G5:2! D5:2 G5:2 Bb5:2', 'A5:2! G5:2 E5:2 C#5:2 A4:4! r:4',
];
const RB_C = [
  'F5:6! D5:2 Bb4:8', 'C5:6! A4:2 F5:8', 'G5:4! Bb5:4 D6:4 Bb5:4', 'C6:12! r:2 Bb5:2',
  'D6:6! C6:2 Bb5:8', 'A5:6! G5:2 F5:8', 'B5:4! D6:4 F6:4 D6:4', 'E6:4! C6:4 G5:2 E5:2 C5:4',
];
const GATA = '0:1 2:1 0:1 2:1 1:1 2:1 0:1 2:1 0:1 2:1 0:1 2:1 1:1 2:1 0:1 2:1';
const GATA_DR = 'k:2! R:2 h:2 R:2 s:2! R:2 k:2 h:2';

const c10rBoss = {
  bpm: 136, bar: 16, reverb: 0.18, fill: 0,
  parts: [
    { i: 'chip_lead', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'marimba', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'brass', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    // メカが 動き出す（マリンバの ガタゴトだけ → ブラスの「ぷっ」）
    intro: [
      rest(2),
      bassLine(RB.intro, '1:4! r:4 1:4 r:4', { lo: 41, ...F }),
      arp(RB.intro, GATA, { center: 70, ...F }),
      comp(RB.intro, ['r:16', 'r:12 x:4!'], { center: 64, ...F }),
      rest(2),
      drums(2, 'k:4! R:4 k:4 R:4', { last: 'k:2! R:2 k:2 R:2 s:2 s:2 t:2 tl:2' }),
    ],
    A: [
      bars(RB_A),
      bassLine(RB.A, '1:4! 5:4 1:4 5:4', { lo: 41, ...F }),
      arp(RB.A, GATA, { center: 67, ...F }),
      comp(RB.A, 'r:4 x:2! r:6 x:2 r:2', { center: 64, ...F }),
      pad(RB.A, { center: 62, mods: '?', ...F }),
      drums(8, GATA_DR, { last: 'k:2! R:2 h:2 R:2 s:2 s:2 t:2 tl:2' }),
    ],
    // ドリル
    B: [
      bars(RB_B),
      bassLine(RB.B, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2', { lo: 38, ...F }),
      arp(RB.B, '0:1 0:1 0:1 0:1 2:1 2:1 2:1 2:1 1:1 1:1 1:1 1:1 2:1 2:1 2:1 2:1', { center: 69, ...F }),
      comp(RB.B, 'x:2! r:2 r:4 x:2! r:2 r:4', { center: 64, ...F }),
      guide(RB.B, 'x:8 x:8', { center: 64, ...F }),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! R:2', { first: 'c:2! k:2 s:2! h:2 k:2! k:2 s:2! R:2', last: FILL }),
    ],
    // あつく なって ひと休み（たいこは 半分）
    C: [
      bars(RB_C),
      bassLine(RB.C, '1:8! 5:8', { lo: 41, ...F }),
      arp(RB.C, '0:2 r:2 2:2 r:2 0:2 r:2 2:2 r:2', { center: 67, ...F }),
      rest(8),
      pad(RB.C, { center: 64, ...F }),
      drums(8, 'k:4! R:4 h:4 R:4', { last: 'k:4! R:4 s:2 s:2 t:2 tl:2' }),
    ],
    // ブラスが 足される
    A2: [
      bars(RB_A),
      bassLine(RB.A, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 41, ...F }),
      arp(RB.A, GATA, { center: 67, ...F }),
      comp(RB.A, 'x:2.! r:2 x:2. r:2 x:2.! r:2 x:2. r:2', { center: 64, ...F }),
      guide(RB.A, 'x:4 x:4 x:8', { center: 69, ...F }),
      drums(8, 'k:2! R:2 s:2! R:2 k:2 k:2 s:2! R:2', { first: 'c:2! R:2 s:2! R:2 k:2 k:2 s:2! R:2', last: FILL }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ファ）と 半音上（こまって いるのに どこか おかしい）
  pinch: { n: 'F6:2 Gb6:2 F6:2 C6:2 F6:2 Gb6:2 F6:2 A6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10g_roots: 大地の下の根の国（ト長調 92）═════════════
// 天じょうから たれ下がる 大きな 根と 葉の 世界。暗く ない・広い。ささやきの森の 頭〈ミ・ファ#・ソ・ラ〉を ハ長調の 和音の 上で
//   （ファ# が ふわっと 明るい）、長い 音で のびやかに。オルゴールの 分散和音が 光る ほうし。
//   A 森の 頭から → B 高く 広がる（いちばん 高い ラ）→ C ほうしが まう（たいこ なし・低い 所で 森の 頭）→ A2 弦の 対旋律
const ROOTS = {
  intro: ['C', 'D'],
  A: ['C', 'G', 'Am', 'D', 'C', 'G', 'Em', 'D'],
  B: ['Em', 'C', 'G', 'D', 'Em', 'C', 'A', 'D'],
  C: ['C', 'D', 'Em', 'Em', 'C', 'D', 'G', 'D'],
};
const ROOTS_A = [
  'E5:4! F#5:2 G5:2 A5:8', 'B5:6! A5:2 G5:4 D5:4', 'E5:4! F#5:2 G5:2 A5:4 C6:4', 'B5:12! A5:4',
  'G5:4! A5:2 B5:2 C6:4 E6:4', 'D6:6! B5:2 G5:8', 'E6:4! D6:2 B5:2 G5:4 A5:4', 'F#5:12! r:4',
];
const ROOTS_B = [
  'G5:6! B5:2 E6:8', 'E6:4! D6:2 C6:2 G5:8', 'B5:6! D6:2 G6:8', 'F#6:4! E6:2 D6:2 A5:8',
  'G6:6! F#6:2 E6:8', 'E6:4! D6:2 C6:2 E6:4 G6:4', 'C#6:6! E6:2 A6:8', 'F#6:8! D6:4 A5:4',
];
const ROOTS_C = [
  'E5:8! G5:8', 'F#5:8! A5:8', 'G5:4! A5:4 B5:8', 'E5:12! r:4',
  'C6:8! G5:4 A5:4', 'A5:8! F#5:4 D5:4', 'B5:8! D6:8', 'A5:12! r:4',
];
const SPORE = '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 2:1';
const SPORE8 = '0:2? 2:2? 1:2? 3:2? 2:2? 4:2? 3:2? 1:2?';

const c10gRoots = {
  bpm: 92, bar: 16, reverb: 0.4, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'musicbox', v: 0.028, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'pad', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(ROOTS.intro, '1:16', { lo: 40 }),
      arp(ROOTS.intro, SPORE, { center: 83 }),
      pad(ROOTS.intro, { center: 64 }),
      rest(2),
      drums(2, 'r:16', { last: 'r:12 R:2? R:2' }),
    ],
    A: [
      bars(ROOTS_A),
      bassLine(ROOTS.A, '1:6! 5:2 8:4 5:4', { lo: 40 }),
      arp(ROOTS.A, SPORE8, { center: 81 }),
      pad(ROOTS.A, { center: 64 }),
      rest(8),
      drums(8, 'k:4! h:2? R:2 r:2 h:2? R:4?'),
    ],
    // 高く 広がる
    B: [
      bars(ROOTS_B),
      bassLine(ROOTS.B, '1:4! 5:4 8:4 5:4', { lo: 40 }),
      arp(ROOTS.B, SPORE, { center: 81 }),
      pad(ROOTS.B, { center: 65 }),
      guide(ROOTS.B, 'x:8 x:8', { center: 72 }),
      drums(8, 'k:4! h:2? h:2? R:4 h:2? k:2?', { last: 'k:4! r:4 R:2 R:2 t:2? tl:2' }),
    ],
    // ほうしが まう（たいこ なし）
    C: [
      bars(ROOTS_C),
      bassLine(ROOTS.C, '1:16', { lo: 40 }),
      arp(ROOTS.C, '0:4? 2:4? 1:4? 3:4?', { center: 86 }),
      pad(ROOTS.C, { center: 62, mods: '?' }),
      rest(8),
      drums(8, 'r:16', { last: 'r:8 R:2? R:2? R:2 R:2' }),
    ],
    // 弦の 対旋律
    A2: [
      bars(ROOTS_A),
      bassLine(ROOTS.A, '1:4! 1:2 5:2 8:4 5:4', { lo: 40 }),
      arp(ROOTS.A, SPORE, { center: 83 }),
      pad(ROOTS.A, { center: 65 }),
      guide(ROOTS.A, 'x:4 x:4 x:8', { center: 74 }),
      drums(8, 'k:4! h:2? R:2 k:2 h:2? R:4?', { first: 'c:4? h:2? R:2 k:2 h:2? R:4?' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
};

// ═════════════ c10g_boss: いたずらスウィング（イ短調 126。はねる 8分）═════════════
// しめった マントの だんしゃくと 小さな 飛ぶ メカ。にくめない。ピチカートの ふしが 半音下から しのびより、
//   ブラスが うらで「ぶっ」と こたえる。ベースは 4分で 歩く。チップの 分散和音が 飛ぶ メカの ブーン。
//   A しのびあし → B ハ長調で 飛び回る → C カビが ひろがる（ニ短調。休みの 多い ふし）→ A2 ブラスと オルガンが 足される
const GB = {
  intro: ['Am', 'E7'],
  A: ['Am', 'Am', 'Dm', 'E7', 'Am', 'F', 'E7', 'Am'],
  B: ['C', 'C', 'F', 'G7', 'C', 'Am', 'D7', 'G7'],
  C: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'E7', 'E7'],
};
const GB_A = [
  'E5:2! r:2 D#5:2 E5:2 C6:4! A5:4', 'B5:2! A5:2 r:2 E5:2 A5:4! r:4',
  'F5:2! r:2 E5:2 F5:2 D6:4! A5:4', 'G#5:2! A5:2 B5:2 D6:2 B5:4! G#5:4',
  'E6:2! r:2 D#6:2 E6:2 C6:4! A5:4', 'C6:2! A5:2 F5:2 A5:2 C6:4! r:4',
  'B5:2! r:2 A#5:2 B5:2 D6:4! G#5:4', 'A5:4! r:2 E5:2 A4:4! r:4',
];
const GB_B = [
  'G5:2! A5:2 G5:2 E5:2 C5:4! E5:4', 'G5:2! r:2 G5:2 G#5:2 A5:4! G5:4',
  'A5:2! C6:2 A5:2 F5:2 C6:4! A5:4', 'B5:2! D6:2 F6:2 D6:2 B5:4! G5:4',
  'E6:2! D6:2 C6:2 G5:2 E5:4! G5:4', 'A5:2! B5:2 C6:2 E6:2 A5:4! r:4',
  'F#5:2! A5:2 C6:2 A5:2 F#5:4! D5:4', 'G5:2! F5:2 D5:2 B4:2 G4:4! r:4',
];
const GB_C = [
  'D5:2! r:2 F5:2 r:2 A5:2! r:2 F5:2 r:2', 'A5:2! G#5:2 A5:2 r:2 D6:4! r:4',
  'D5:2! r:2 F5:2 r:2 Bb5:2! r:2 F5:2 r:2', 'C#6:4! r:2 A5:2 E5:4! r:4',
  'F5:2! r:2 A5:2 r:2 D6:2! r:2 A5:2 r:2', 'F6:4! E6:2 D6:2 A5:4! r:4',
  'G#5:2! B5:2 D6:2 B5:2 E6:4! D6:4', 'B5:2! G#5:2 E5:2 D5:2 B4:4! E5:4',
];
const WALK = '1:4! 5:4 8:4 5:4';
const BUZZ = '0:1 1:1 2:1 3:1 2:1 1:1 r:2 0:1 1:1 2:1 3:1 2:1 1:1 r:2';

const c10gBoss = {
  bpm: 126, bar: 16, swing: 0.18, reverb: 0.2, fill: 0,
  parts: [
    { i: 'pluck', v: 0.13, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'brass', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'chip_arp', v: 0.018, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'organ', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    // メカが ブーンと 飛んで くる
    intro: [
      rest(2),
      bassLine(GB.intro, '1:4! r:4 1:4 r:4', { lo: 40 }),
      comp(GB.intro, ['r:16', 'r:12 x:4!'], { center: 62 }),
      arp(GB.intro, BUZZ, { center: 76 }),
      rest(2),
      drums(2, 'R:4! r:4 R:4 r:4', { last: 'R:2! R:2 R:2 R:2 s:2 s:2 t:2 tl:2' }),
    ],
    A: [
      bars(GB_A),
      bassLine(GB.A, WALK, { lo: 40 }),
      comp(GB.A, 'r:4 x:2! r:6 x:2 r:2', { center: 62 }),
      rest(8),
      pad(GB.A, { center: 64, mods: '?' }),
      drums(8, 'k:4! h:2 h:2 s:4! h:2 h:2', { last: 'k:4! h:2 h:2 s:2 s:2 t:2 tl:2' }),
    ],
    // 飛び回る
    B: [
      bars(GB_B),
      bassLine(GB.B, '1:4! 3:4 5:4 8:4', { lo: 40 }),
      comp(GB.B, 'x:2! r:2 r:4 x:2 r:2 r:4', { center: 62 }),
      arp(GB.B, BUZZ, { center: 79 }),
      rest(8),
      drums(8, 'k:4! h:2 h:2 s:4! h:2 k:2', { last: 'k:2! r:2 k:2! r:2 s:2 s:2 c:4!' }),
    ],
    // カビが ひろがる（休みの 多い ふし。オルガンの のばし）
    C: [
      bars(GB_C),
      bassLine(GB.C, '1:4! r:4 5:4 r:4', { lo: 38 }),
      comp(GB.C, 'r:12 x:4', { center: 62 }),
      rest(8),
      pad(GB.C, { center: 62 }),
      drums(8, 'k:4! r:4 R:4 r:2 R:2', { last: 'k:4! R:4 s:2 s:2 t:2 tl:2' }),
    ],
    // ブラスと オルガンが 足される
    A2: [
      bars(GB_A),
      bassLine(GB.A, '1:4! 5:4 8:2 5:2 3:4', { lo: 40 }),
      comp(GB.A, 'x:2! r:2 x:2 r:2 r:4 x:2 r:2', { center: 62 }),
      arp(GB.A, BUZZ, { center: 79 }),
      pad(GB.A, { center: 64 }),
      drums(8, 'k:2! h:2 s:2 h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ラ）と 半音上
  pinch: { n: 'A6:2 Bb6:2 A6:2 E6:2 A6:2 Bb6:2 A6:2 C7:2', i: 'chip_arp', v: 0.03 },
};

for (const tr of [c10Fork, c10rRoad, c10rRun, c10rBoss, c10gRoots, c10gBoss]) tr.ch = oldView(tr);

// テストが 見る: 炎の山の ふし・森の 頭・スピカの歌の 1ふしめ
export const C10A_LINES = { volc: VOLC, volcChords: VCH, roots: ROOTS_A, forkRedGreen: FORK_D };

// 曲の id は docs/plan-part3-c10a.md の 13-6（かえない）
export const C10A_TRACKS = {
  c10_fork: c10Fork,
  c10r_road: c10rRoad,
  c10r_run: c10rRun,
  c10r_boss: c10rBoss,
  c10g_roots: c10gRoots,
  c10g_boss: c10gBoss,
};
export const C10A_IDS = Object.keys(C10A_TRACKS);
