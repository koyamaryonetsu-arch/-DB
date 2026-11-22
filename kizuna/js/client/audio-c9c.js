// 第92回 F: 第3部 第1章 第3幕「さかさのピラミッド」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3.md の「実装メモ（第3幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない）。c9c_pyramid は この ゲームの ピラミッドの 曲（pyramid）の ふしを さかさに した もの、
//   c9c_trio2 は 第1幕の 3人組の 曲（c9a_trio）の ふしを 使った もの
//
// ・c9c_river … 地下の川（イ短調〈ファ# の 明るさ〉6/8 104。いかだが ゆれる 3びょうし。ハープの ゆれと オルゴールの 水の しずく）
// ・c9c_pyramid … さかさのピラミッド（ニの 音階〈レ・ミb・ファ#・ソ・ラ・シb・ド#〉88。第4章の ピラミッドの ふしの 上がり下がりを 逆に した もの）。
//     画面の 状態 flipStage（0 ふつう・1 さかさ）で 楽器が かわる（さかさの 時は オルゴールが ふしを 鳴らし、ベースは のばし、たいこは リムと オープン）
// ・c9c_riddle … なぞなぞ勝負（ヘ長調 124。オルガンの とぼけた ふし。B は「ぽく ぽく ぽく … ちーん」と 考える 間）
// ・c9c_trio2 … またまたドタバタ3人組（ト長調 156。c9a_trio の ふし。B は 砂が おちる・C は 3人組の ふしを さかさに〈ひっくり返る〉）
// ・c9c_algol … つめたい光（イ短調 72。短い 場面の 曲。星の子の 7つの 音を 上から 下へ たどる。たいこ なし。こわく しない）
// ・c9c_note … ひとつめの星の音（ハ長調 96。10 秒の よろこびの 曲。くり返さない。ミの 音から 始まり ミで おわる）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS, C9A_TRIO_THEME, C9A_SEVEN } from './audio-c9a.js?v=9619c3d748be';

const { FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;

// ───────────── 小さな 道具（ふしを うつす・さかさに する）─────────────
const PCN = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const midiOfName = (n) => {
  const r = /^([A-G][#b]?)(-?\d)$/.exec(n);
  if (!r) throw new Error(`c9c note: ${n}`);
  return PCN[r[1]] + 12 * (Number(r[2]) + 1);
};
const nameOf = (m, sp = FLAT) => `${sp[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
// 'D5:4! r:4 …' の 音だけ fn（MIDI → MIDI）で かえる（長さと しるしは そのまま）
function mapNotes(str, fn, sp = FLAT) {
  return str.trim().split(/\s+/).map((tok) => {
    const k = tok.indexOf(':');
    const n = tok.slice(0, k);
    if (n === 'r') return tok;
    return `${nameOf(fn(midiOfName(n)), sp)}${tok.slice(k)}`;
  }).join(' ');
}
const shift = (str, d) => mapNotes(str, (m) => m + d);
// さかさ（上がり下がりを 逆に）: 音 m → sum - m（sum / 2 が 鏡の 音）
const mirror = (str, sum) => mapNotes(str, (m) => sum - m);
// どの 音も 弱く（ゴースト）
const ghost = (str) => str.trim().split(/\s+/).map((t) => (t.startsWith('r:') ? t : t.replace(/[!?]*$/, '?'))).join(' ');
const shiftChord = (bar, d) => bar.trim().split(/\s+/).map((sym) => {
  const r = /^([A-G][#b]?)(.*)$/.exec(sym);
  return `${FLAT[(PCN[r[1]] + d + 12) % 12]}${r[2]}`;
}).join(' ');

// ═════════════ c9c_river: 地下の川（イ短調 6/8 104）═════════════
// 暗いが わくわく する いかだ下り。ハープの ゆれ（0 2 1 3 2 1）・ベースの ゆり返し・オルゴールの 水の しずく（弱く、ばらばらの 所に）。
//   A 流れに 乗る → B 流れが 速く なる（ホ長調の 和音で どきどき）→ C さかさの 町の 下（大きな 空どう。ゆっくり 見上げる。まどの 明かりの きらきら）
//   → A2（高く）→ D 早瀬（8分で 走って A へ もどる）
// 1小節 = 16分音符 12（8分 6つ。強い 拍は 0 と 6）
const RB = 12;
const RIV = {
  intro: ['Am', 'Am'],
  A: ['Am', 'D', 'Am', 'G', 'C', 'G', 'Em', 'Am'],
  B: ['F', 'G', 'Em', 'Am', 'F', 'G', 'E', 'E'],
  C: ['C', 'Em', 'F', 'C', 'Am', 'Em', 'F', 'G'],
  A2: ['Am', 'D7', 'Am', 'G', 'C', 'G', 'Em', 'Am'],
  D: ['F', 'G', 'E', 'E'],
};
const RIV_A = [
  'E5:4! A5:2 C6:4 B5:2', 'A5:4! F#5:2 D5:6', 'E5:4! A5:2 C6:4 D6:2', 'B5:4! A5:2 G5:6',
  'E5:4! G5:2 C6:4 E6:2', 'D6:4! B5:2 G5:6', 'B5:4! G5:2 E5:4 F#5:2', 'A5:6! E5:6',
];
const RIV_B = [
  'A5:2! G5:2 A5:2 C6:4 A5:2', 'B5:2! A5:2 B5:2 D6:4 B5:2', 'G5:2! F#5:2 G5:2 B5:4 G5:2', 'A5:4! C6:2 E6:6',
  'F6:4! E6:2 C6:6', 'D6:4! B5:2 G5:6', 'G#5:4! B5:2 E6:4 D6:2', 'B5:6! G#5:4 B5:2',
];
const RIV_C = ['G5:6! E5:6', 'B5:6! G5:6', 'A5:6! C6:6', 'G5:12', 'E5:6! A5:6', 'G5:6! B5:6', 'C6:6! A5:4 F5:2', 'D6:6! B5:6'];
const RIV_A2 = [
  'A5:4! C6:2 E6:4 D6:2', 'C6:4! A5:2 F#5:6', 'E6:4! C6:2 A5:4 B5:2', 'D6:4! B5:2 G5:6',
  'G5:4! C6:2 E6:4 G6:2', 'D6:4! G6:2 D6:4 B5:2', 'E6:4! D6:2 B5:4 A5:2', 'A5:6! E5:4 r:2',
];
const RIV_D = [
  'C6:2! A5:2 F5:2 A5:2 C6:2 F6:2', 'D6:2! B5:2 G5:2 B5:2 D6:2 G6:2',
  'E6:2! B5:2 G#5:2 B5:2 E6:2 G#6:2', 'G#6:2! E6:2 D6:2 B5:2 G#5:2 E5:2',
];
const R12 = { bar: RB };
const ROCK = '0:2 2:2 1:2 3:2 2:2 1:2';
// 水の しずく（小節ごとに ちがう 所に 1〜2つぶ）
const DROPS = ['r:4 2:2? r:6', 'r:8 4:1? r:3', 'r:2 3:2? r:4 1:2? r:2', 'r:10 2:2?'];

const c9cRiver = {
  bpm: 104, bar: RB, reverb: 0.4, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    { i: 'pluck', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['r:12', 'r:6 B4:6?']),
      bassLine(RIV.intro, '1:4! 5:2 8:4 5:2', { lo: 36, ...R12 }),
      arp(RIV.intro, ROCK, { center: 67, ...R12 }),
      arp(RIV.intro, DROPS, { center: 84, ...R12 }),
      pad(RIV.intro, { center: 60, ...R12 }),
      drums(2, 'R:2! r:4 R:2? r:4', { last: 'R:2! r:4 R:2 t:2 tl:2' }),
    ],
    A: [
      bars(RIV_A),
      bassLine(RIV.A, '1:4! 5:2 8:4 5:2', { lo: 36, ...R12 }),
      arp(RIV.A, ROCK, { center: 67, ...R12 }),
      arp(RIV.A, DROPS, { center: 84, ...R12 }),
      pad(RIV.A, { center: 60, ...R12 }),
      drums(8, 'k:2! h:2? h:2? R:2 h:2? h:2?', { last: 'k:2! h:2? R:2 R:2 t:2 tl:2' }),
    ],
    // 流れが 速く なる
    B: [
      bars(RIV_B),
      bassLine(RIV.B, '1:2! 5:2 8:2 1:2 5:2 8:2', { lo: 36, ...R12 }),
      arp(RIV.B, '0:2 1:2 2:2 3:2 2:2 1:2', { center: 69, ...R12 }),
      arp(RIV.B, DROPS, { center: 86, ...R12 }),
      pad(RIV.B, { center: 62, ...R12 }),
      drums(8, 'k:2! h:2 h:2? s:2 h:2 k:2?', { last: 'k:2! s:1 s:1 s:2 t:2 th:2 tl:2' }),
    ],
    // さかさの 町の 下（見上げる。まどの 明かりが きらきら）
    C: [
      bars(RIV_C),
      bassLine(RIV.C, '1:6! 5:6', { lo: 36, ...R12 }),
      arp(RIV.C, '0:4? r:2 2:4? r:2', { center: 67, ...R12 }),
      arp(RIV.C, '0:2? r:2 2:2? r:2 4:2? r:2', { center: 82, ...R12 }),
      pad(RIV.C, { center: 62, ...R12 }),
      drums(8, 'R:2? r:4 R:2? r:4', { last: 'R:2! r:4 R:2 t:2 tl:2' }),
    ],
    A2: [
      bars(RIV_A2),
      bassLine(RIV.A2, '1:4! 5:2 8:4 5:2', { lo: 36, ...R12 }),
      arp(RIV.A2, '0:2 2:2 1:2 3:2 2:2 4:2', { center: 69, ...R12 }),
      guide(RIV.A2, 'x:6 x:6', { center: 76, ...R12 }),
      pad(RIV.A2, { center: 62, ...R12 }),
      drums(8, 'k:2! h:2 h:2? s:2 h:2? h:2?', { first: 'c:2! h:2 h:2? s:2 h:2? h:2?' }),
    ],
    // 早瀬
    D: [
      bars(RIV_D),
      bassLine(RIV.D, '1:2! 1:2 8:2 1:2 5:2 8:2', { lo: 36, ...R12 }),
      arp(RIV.D, '0:1 1:1 2:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 2:1 1:1', { center: 69, ...R12 }),
      arp(RIV.D, DROPS, { center: 86, ...R12 }),
      pad(RIV.D, { center: 62, ...R12 }),
      drums(4, 'k:2! s:2 h:2 k:2 s:2 h:2', { last: 'k:2! s:1 s:1 s:2 t:2 th:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
};

// ═════════════ c9c_pyramid: さかさのピラミッド（ニの 音階 88）═════════════
// 第4章の ピラミッドの 曲（pyramid。audio.js）の ふし 16小節を、レ（ニ）を 鏡に して 上がり下がりを 逆に した（さかさ言葉の 音楽）。
//   この 音階（レ・ミb・ファ#・ソ・ラ・シb・ド#）は レを 鏡に すると 同じ 音階に もどる ので、さかさに しても ピラミッドの ひびきの まま。
//   はじめの レは レの まま・ミb ↔ ド#・ファ# ↔ シb・ソ ↔ ラ。おわりは ソ（ト短調）に 着く（なつかしいが どこか ちがう）
//   A = 1〜8小節を さかさ（低め）・B = 9〜16小節を さかさ（1オクターブ上。のぼって いく）
//   C = A の ふしの 上で、オルゴールが もとの（さかさで ない）ピラミッドの ふしを 鳴らす（鏡の 2つの ふしは いつも 偶数の はなれ ＝ にごらない）
//   画面の 状態 flipStage（0 ふつう・1 さかさ。audio-scene.js が だん 0・1 に する）で 楽器が かわる:
//     ふつう … 四角い 波の メロディ（第4章と 同じ 色）・ハープの アルペジオ・ベース・のばし・たいこ（キック・ハット）
//     さかさ … オルゴールが メロディ・ベースは のばし・ハープは 休み・たいこは リムと オープンハット（fi で 音階を 上から 下へ）
//   もどる 時は イントロ（音階を 下から 上へ）から
// もとの ふし（audio.js の pyramid の 1つめの チャンネル。1行 1小節）
const PYR_ORIG = [
  'D5:4 Eb5:2 D5:2 C#5:4 Bb4:4', 'A4:6 Bb4:2 C#5:4 D5:4', 'Eb5:4 F#5:4 G5:3 F#5:1 Eb5:4', 'D5:12 r:4',
  'A5:4 G5:2 F#5:2 G5:4 Eb5:4', 'F#5:6 Eb5:2 D5:4 C#5:4', 'D5:2 Eb5:2 F#5:2 G5:2 A5:4 Bb5:4', 'A5:12 r:4',
  'Bb5:4 A5:2 G5:2 A5:4 F#5:4', 'G5:6 F#5:2 Eb5:4 D5:4', 'C#5:4 D5:2 Eb5:2 F#5:4 A5:4', 'G5:8 F#5:4 Eb5:4',
  'D5:4 Eb5:2 D5:2 C#5:4 Bb4:4', 'A4:4 C#5:4 Eb5:4 F#5:4', 'G5:4 F#5:2 Eb5:2 D5:4 C#5:4', 'D5:16',
];
const ACC = (b) => b.replace(/^(\S+?:\d+)/, '$1!');
// レ5（74）を 鏡に（148 - m）・レ6（86）を 鏡に（172 - m は 高すぎる ので 1オクターブ 下の 160 - m）
const PYR_A = PYR_ORIG.slice(0, 8).map((b) => ACC(mirror(b, 148)));
const PYR_B = PYR_ORIG.slice(8).map((b) => ACC(mirror(b, 160)));
const PYR_UP = PYR_ORIG.slice(0, 8).map((b) => ACC(shift(b, 12)));
const PYR = {
  intro: ['D', 'Gm'],
  A: ['Gm Eb', 'Gm Eb', 'A7', 'D', 'Gm A7', 'Eb D', 'D Gm', 'Gm'],
  B: ['D Gm', 'D A7', 'Eb Gm', 'D Eb', 'Gm Eb', 'Eb A7', 'A7 D', 'D'],
  // もとの ふしの 和音（第4章の ベースと 同じ ね）。さかさの C（fC）で もとの ふしを 四角い 波が 鳴らす 時
  orig: ['D A7', 'D A7', 'Eb', 'D', 'Gm', 'D', 'Gm', 'A'],
};
const PF = { sp: FLAT };
// 音階（レ・ミb・ファ#・ソ・ラ・シb・ド#・レ）を 上へ・下へ
const SCALE_UP = 'D5:2 Eb5:2 F#5:2 G5:2 A5:2 Bb5:2 C#6:2 D6:2';
const SCALE_DOWN = 'D6:2 C#6:2 Bb5:2 A5:2 G5:2 F#5:2 Eb5:2 D5:2';
const PYR_DR = 'k:4! h:2 h:2 s:4 h:4';
const PYR_FLIP_DR = 'R:4! r:2 o:2? R:4? r:2 o:2?';

const c9cPyramid = {
  bpm: 88, bar: 16, reverb: 0.4, night: {},
  parts: [
    { i: 'lead', w: 'pulse', v: 0.085, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0.5, pan: 0.25 },
    { i: 'musicbox', v: 0.07, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { drums: true, v: 0.3, minIntensity: 0.7 },
  ],
  sections: {
    // ── ふつう ──
    intro: [
      rest(2),
      bassLine(PYR.intro, '1:16', { lo: 38, ...PF }),
      `${SCALE_UP} ${SCALE_DOWN}`,
      rest(2),
      pad(PYR.intro, { center: 60, ...PF }),
      drums(2, 'r:16', { last: 'r:8 t:2? t:2? th:2 tl:2' }),
    ],
    A: [
      bars(PYR_A),
      bassLine(PYR.A, '1:6! 5:2 1:8', { lo: 38, ...PF }),
      arp(PYR.A, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 1:2', { center: 64, ...PF }),
      `${rest(7)} r:8 D6:8?`,
      pad(PYR.A, { center: 58, ...PF }),
      drums(8, PYR_DR, { last: 'k:4! h:2 h:2 s:2 s:2 s:2 s:2' }),
    ],
    B: [
      bars(PYR_B),
      bassLine(PYR.B, '1:4! 5:4 8:4 5:4', { lo: 38, ...PF }),
      arp(PYR.B, '0:2 1:2 2:2 3:2 0:2 1:2 2:2 3:2', { center: 64, ...PF }),
      `${rest(3)} r:8 D6:8? ${rest(3)} r:8 A6:8?`,
      pad(PYR.B, { center: 60, ...PF }),
      drums(8, 'k:4! h:2 h:2 s:4 h:2 k:2', { last: 'k:4! h:2 k:2 s:2 s:2 s:2 s:2' }),
    ],
    // もとの ふしが オルゴールで かさなる（なつかしい）
    C: [
      bars(PYR_A),
      bassLine(PYR.A, '1:8! 5:8', { lo: 38, ...PF }),
      rest(8),
      bars(PYR_UP.map(ghost)),
      pad(PYR.A, { center: 58, ...PF }),
      drums(8, 'k:4! R:4 R:4? R:4', { last: 'k:4! R:4 s:2 s:2 t:2 tl:2' }),
    ],
    // ── さかさ（flipStage 1）──
    fi: [
      rest(2),
      bassLine(PYR.intro, '1:16', { lo: 38, ...PF }),
      rest(2),
      ghost(`${SCALE_DOWN} ${SCALE_UP}`),
      pad(PYR.intro, { center: 64, ...PF }),
      drums(2, 'o:4? r:12', { last: 'r:8 o:2? r:2 o:2 R:2' }),
    ],
    fA: [
      rest(8),
      bassLine(PYR.A, '1:16', { lo: 38, ...PF }),
      rest(8),
      bars(PYR_A.map((b) => shift(b, 12))),
      pad(PYR.A, { center: 64, ...PF }),
      drums(8, PYR_FLIP_DR),
    ],
    fB: [
      rest(8),
      bassLine(PYR.B, '1:8 1:8', { lo: 38, ...PF }),
      rest(8),
      bars(PYR_B),
      pad(PYR.B, { center: 64, ...PF }),
      drums(8, PYR_FLIP_DR, { last: 'R:4! o:4 R:2 R:2 o:4' }),
    ],
    // さかさの C: もとの ふしを 四角い 波が 小さく・さかさの ふしを オルゴールが（C の 入れかえ）
    fC: [
      bars(PYR_ORIG.slice(0, 8).map(ghost)),
      bassLine(PYR.orig, '1:8 1:8', { lo: 38, ...PF }),
      rest(8),
      bars(PYR_A.map((b) => shift(b, 12))),
      pad(PYR.orig, { center: 60, ...PF }),
      drums(8, PYR_FLIP_DR, { last: 'R:4! o:4 R:2 R:2 o:4' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C'],
  loopFrom: 1,
  // だん 0 ＝ ふつう・だん 1 ＝ さかさ（テンポと 調は かえない。形だけ かわる）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1, form: ['fi', 'fA', 'fB', 'fC'], loopFrom: 1 },
  ],
};

// ═════════════ c9c_riddle: なぞなぞ勝負（ヘ長調 124）═════════════
// とぼけた なぞの 番人。オルガンの ふし（スタッカートと 休み ＝ 考える 間）・ベースの ぽつぽつ・マリンバの ぽく ぽく・ベルの「ちーん」。
//   A なぞを 出す（さいごは ド ＝ 「？」で 止まる）→ B 考える 間（リムの ぽく ぽく ぽく … ベルが ちーん）
//   → C 答えが わかった！（8分で 走る）→ A2（さいごは ファに 着く）。こわく ない
const RID = {
  intro: ['Dm', 'A7'],
  A: ['F', 'Dm', 'Gm', 'C7', 'F', 'Dm', 'Bb', 'C7'],
  B: ['Dm', 'Dm', 'Gm', 'Gm', 'Bb', 'Bb', 'C', 'C7'],
  C: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'],
  A2: ['F', 'Dm', 'Gm', 'C7', 'F', 'Dm', 'Bb C7', 'F'],
};
const RID_Q = [
  'A4:2.! C5:2. F5:2.! r:2 G5:2.! F5:2. A5:4', 'D5:2.! r:2 F5:2. A5:2. D6:4! r:4',
  'Bb5:2.! A5:2. G5:2. r:2 D5:2.! r:2 r:4', 'E5:2.! F5:2. G5:2. A5:2. Bb5:4! r:4',
  'C5:2.! F5:2. A5:2.! r:2 C6:2.! A5:2. F5:4', 'F5:2.! r:2 A5:2. D6:2. F6:4! r:4',
];
const RID_A = [...RID_Q, 'D6:2.! C6:2. Bb5:2. r:2 F5:2.! r:2 D5:4', 'C5:2.! E5:2. G5:2. Bb5:2. C6:8!'];
const RID_B = ['D5:4! r:4 F5:4 r:4', 'A5:4! r:12', 'Bb5:4! r:4 A5:4 r:4', 'G5:4! r:12', 'F5:4! r:4 D5:4 r:4', 'Bb5:4! r:12', 'C6:4! r:4 Bb5:4 r:4', 'G5:4! r:12'];
const RID_C = [
  'F5:2! G5:2 A5:2 C6:2 A5:2! G5:2 F5:2 A5:2', 'G5:2! A5:2 G5:2 E5:2 C5:2! E5:2 G5:2 C6:2',
  'A5:2! F5:2 D5:2 F5:2 A5:2! D6:2 C6:2 A5:2', 'Bb5:4! D6:4 F6:4! D6:4',
  'C6:2! A5:2 F5:2 A5:2 C6:2! F6:2 E6:2 C6:2', 'G5:2! E5:2 C5:2 E5:2 G5:2! C6:2 E6:2 G6:2',
  'F6:2! D6:2 Bb5:2 D6:2 F6:2! E6:2 D6:2 C6:2', 'C6:4! r:2 C6:2 C6:4! r:4',
];
const RID_A2 = [...RID_Q, 'D6:2.! C6:2. Bb5:2. r:2 E5:2.! r:2 G5:4', 'F5:4! A5:4 C6:4! F5:4'];
const RF = { sp: FLAT };
const POKU = 'R:4! R:4 R:4 R:4';

const c9cRiddle = {
  bpm: 124, bar: 16, reverb: 0.26, fill: 0,
  parts: [
    { i: 'organ', v: 0.07, role: 'lead' },
    { i: 'bass', v: 0.2, role: 'bass' },
    { i: 'marimba', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    // ぽく ぽく ぽく … ちーん
    intro: [
      rest(2),
      bassLine(RID.intro, ['1:4! r:12', '1:4! r:4 5:4 r:4'], { lo: 38, ...RF }),
      rest(2),
      bars(['r:16', 'r:12 A6:4!']),
      pad(RID.intro, { center: 60, mods: '?', ...RF }),
      drums(2, POKU, { last: 'R:4! R:4 R:4 r:4' }),
    ],
    // なぞを 出す
    A: [
      bars(RID_A),
      bassLine(RID.A, '1:2.! r:2 5:2. r:2 1:2.! r:2 5:2. r:2', { lo: 38, ...RF }),
      comp(RID.A, 'r:4 x:2.? r:2 r:4 x:2.? r:2', { center: 67, ...RF }),
      `${rest(3)} r:12 E6:4? ${rest(3)} r:12 C6:4?`,
      pad(RID.A, { center: 58, mods: '?', ...RF }),
      drums(8, 'k:4! h:2? h:2? s:4 h:2? h:2?', { last: 'k:4! h:2? h:2? s:2 r:2 r:4' }),
    ],
    // 考える 間（ぽく ぽく ぽく … ちーん）
    B: [
      bars(RID_B),
      bassLine(RID.B, '1:4! r:12', { lo: 38, ...RF }),
      arp(RID.B, '0:4? r:4 1:4? r:4', { center: 72, ...RF }),
      bars(['r:16', 'r:16', 'r:16', 'r:8 G6:8!', 'r:16', 'r:16', 'r:16', 'r:8 C7:8!']),
      pad(RID.B, { center: 60, ...RF }),
      drums(8, POKU, { last: 'R:4! R:4 r:8' }),
    ],
    // 答えが わかった！
    C: [
      bars(RID_C),
      bassLine(RID.C, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 38, ...RF }),
      comp(RID.C, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 67, ...RF }),
      `${rest(7)} C7:4! r:12`,
      pad(RID.C, { center: 60, ...RF }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: 'k:2! r:2 s:2 s:1 s:1 k:2! r:2 c:4!' }),
    ],
    A2: [
      bars(RID_A2),
      bassLine(RID.A2, '1:2.! r:2 8:2. r:2 5:2.! r:2 8:2. r:2', { lo: 38, ...RF }),
      comp(RID.A2, 'r:2 x:2.? r:2 x:2.? r:2 x:2.? r:2 x:2.?', { center: 67, ...RF }),
      guide(RID.A2, 'x:8 x:8', { center: 79, ...RF }),
      pad(RID.A2, { center: 60, ...RF }),
      drums(8, 'k:4! h:2? R:2 s:4 h:2? R:2?', { last: 'k:2! r:2 R:2 R:2 R:4! r:4' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ファ）と 半音上の ソb
  pinch: { n: 'F6:2 Gb6:2 F6:2 C6:2 F6:2 Gb6:2 F6:2 A6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c9c_trio2: またまたドタバタ3人組（ト長調 156）═════════════
// 第1幕の 3人組の 曲（c9a_trio。ヘ長調 144）の ふしを ト長調へ（2つ 上げて 少し 速く）。にぎやかで にくめない。
//   A = c9a_trio の A（チップの 砂が さらさら 落ちる）→ B 新しい ふし（ホ短調。砂が おちる。半音で すべり 落ちる）
//   → C 3人組の ふしを さかさに（ラを 鏡に。ト長調の まま「ひっくり返る」。チップの 砂は 下から 上へ）→ A2 → D メカ（c9a_trio の D）
const T2 = 2;
const TT = C9A_TRIO_THEME;
const TRIO2 = {
  intro: ['G', 'D7'],
  A: TT.chords.A.map((b) => shiftChord(b, T2)),
  B: ['Em', 'Em', 'B7', 'B7', 'Em', 'Am', 'B7', 'B7'],
  C: ['Em', 'Em', 'Am', 'Am', 'Em', 'Bm', 'Am', 'Em'],
  A2: TT.chords.A2.map((b) => shiftChord(b, T2)),
  D: TT.chords.D.map((b) => shiftChord(b, T2)),
};
const TRIO2_A = TT.A.map((b) => shift(b, T2));
const TRIO2_A2 = TT.A2.map((b) => shift(b, T2));
const TRIO2_D = TT.D.map((b) => shift(b, T2));
// ラ5（81）を 鏡に: m → 162 - m（ト長調の 音階は ラを 鏡に すると 同じ 音階に もどる）
const TRIO2_C = TRIO2_A.map((b) => mirror(b, 162));
const TRIO2_B = [
  'B5:2.! A#5:2. B5:2. G5:2. E5:2.! r:2 G5:2. B5:2.', 'E6:4! D#6:2. E6:2. B5:4 G5:4',
  'F#5:2.! r:2 F#5:2. G5:2. A5:2.! r:2 A5:2. B5:2.', 'D#6:4! C#6:2. D#6:2. B5:8',
  'G5:2.! F#5:2. G5:2. B5:2. E6:4! B5:4', 'C6:2.! B5:2. A5:2. G5:2. E5:4! A5:4',
  'F#5:2.! G5:2. A5:2. B5:2. D#6:4! F#6:4', 'B5:2.! A5:2. F#5:2. D#5:2. B4:4! r:4',
];
const OOMPAH = '1:4! 5:4 1:4 5:4';
// 砂（チップの 16分）: 上から 下へ ・ さかさの C は 下から 上へ
const SAND_DOWN = '5:1? 4:1? 3:1? 2:1? 1:1? 0:1? r:10';
const SAND_UP = '0:1? 1:1? 2:1? 3:1? 4:1? 5:1? r:10';

const c9cTrio2 = {
  bpm: 156, bar: 16, reverb: 0.18, fill: 0,
  parts: [
    { i: 'lead', w: 'square', v: 0.08, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'marimba', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'chip_arp', v: 0.024, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.5, minIntensity: 0 },
  ],
  sections: {
    // 砂時計を ひっくり返す（ポチッとね）
    intro: [
      rest(2),
      bassLine(TRIO2.intro, ['1:4! r:4 1:4 5:4', '1:2 1:2 1:2 1:2 5:8!'], { lo: 43 }),
      rest(2),
      comp(TRIO2.intro, ['x:2.! r:2 x:2.! r:2 x:4! r:4', 'x:2.! r:2 x:2.! r:2 x:2.! r:2 x:4!'], { center: 62 }),
      arp(TRIO2.intro, ['5:1 4:1 3:1 2:1 1:1 0:1 r:10', '0:1 1:1 2:1 3:1 4:1 5:1 r:10'], { center: 79 }),
      drums(2, ['k:2! r:2 k:2! r:2 s:4! r:4', 'k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1 c:4!']),
    ],
    A: [
      bars(TRIO2_A),
      bassLine(TRIO2.A, OOMPAH, { lo: 43 }),
      comp(TRIO2.A, 'r:4 x:4. r:4 x:4.', { center: 66 }),
      `${rest(4)} ${comp(TRIO2.A.slice(4), 'x:2.! r:6 x:2.! r:6', { center: 62 })}`,
      arp(TRIO2.A, SAND_DOWN, { center: 79 }),
      drums(8, 'k:4! s:4 k:4 s:4', { last: 'k:4! s:4 s:2 s:2 t:2 tl:2' }),
    ],
    // 砂が おちる
    B: [
      bars(TRIO2_B),
      bassLine(TRIO2.B, '1:2.! r:2 1:2. 5:2. 1:2.! r:2 8:2. 5:2.', { lo: 40 }),
      arp(TRIO2.B, '0:2. r:2 1:2. r:2 2:2. r:2 1:2. r:2', { center: 64 }),
      guide(TRIO2.B, 'x:8 x:8', { center: 60 }),
      arp(TRIO2.B, '5:1? 4:1? 3:1? 2:1? 1:1? 0:1? r:2 5:1? 4:1? 3:1? 2:1? 1:1? 0:1? r:2', { center: 79 }),
      drums(8, 'k:4! R:2 R:2 k:4 R:2 p:2', { last: 'k:2! r:2 k:2! r:2 r:4 c:4!' }),
    ],
    // ひっくり返る（3人組の ふしを さかさに）
    C: [
      bars(TRIO2_C),
      bassLine(TRIO2.C, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 40 }),
      comp(TRIO2.C, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 66 }),
      comp(TRIO2.C, 'x:2.! r:4 x:2.! r:8', { center: 62 }),
      arp(TRIO2.C, SAND_UP, { center: 79 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    A2: [
      bars(TRIO2_A2),
      bassLine(TRIO2.A2, '1:4! 5:2 5:2 1:4 5:4', { lo: 43 }),
      comp(TRIO2.A2, 'r:4 x:2. x:2. r:4 x:2. x:2.', { center: 66 }),
      guide(TRIO2.A2, 'x:4 x:4 x:8', { center: 67 }),
      arp(TRIO2.A2, SAND_DOWN, { center: 79 }),
      drums(8, 'k:4! s:2 k:2 k:4 s:4', { first: 'c:4! s:2 k:2 k:4 s:4', last: 'k:4! s:2 s:2 s:1 s:1 t:1 t:1 tl:2 c:2!' }),
    ],
    // メカ（同じ 音を きざむ）
    D: [
      bars(TRIO2_D),
      bassLine(TRIO2.D, '1:2.! 1:2. 1:2. 1:2. 1:4! 5:4', { lo: 40 }),
      arp(TRIO2.D, '0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1', { center: 68 }),
      comp(TRIO2.D, 'x:4! r:4 x:4! r:4', { center: 62 }),
      arp(TRIO2.D, SAND_DOWN, { center: 79 }),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', { last: 'k:2! k:2 s:2! s:2 t:2 t:2 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
  // ピンチ: 主音（ソ）と 半音の となり（こまって いるのに どこか おかしい）
  pinch: { n: 'G6:2 F#6:2 G6:2 D6:2 G6:2 F#6:2 G6:2 Ab6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c9c_algol: つめたい光（イ短調 72）═════════════
// 静かで つめたい（ベルの ふし・低い のばし・オルゴールの 星の きらめき・弦の 低い のばし。たいこは なし）。短い 場面の 曲（ひとまわり 40 秒）。
//   ふしは 星の子の 7つの 音（ド〜シ）を 上から 下へ（シ・ラ・ソ・ファ・ミ・レ・ド）＝ スピカと 鏡の よう。こわがらせない（大きな 音・低い うなりは 使わない）
//   B は 光が またたく（同じ 音を 強く・弱く。明るさが かわる 星）
const ALG = {
  intro: ['Am', 'Am'],
  A: ['Em', 'Am', 'Fmaj7', 'E', 'Am', 'Dm', 'Fmaj7', 'E'],
  B: ['Am', 'C', 'Dm', 'E'],
};
const SEVEN_DOWN = [...C9A_SEVEN].reverse();
const ALG_A = [
  `${SEVEN_DOWN.slice(0, 4).map((n, k) => `${n}:4${k ? '' : '!'}`).join(' ')}`,
  `${SEVEN_DOWN[4]}:4! ${SEVEN_DOWN[5]}:4 ${SEVEN_DOWN[6]}:8`,
  'r:4 E5:4 A5:4 C6:4', 'B5:12! r:4',
  'C6:4! B5:4 A5:4 G5:4', 'F5:4! E5:4 D5:8', 'r:4 D5:4 F5:4 A5:4', 'G#5:8! E5:8',
];
const ALG_B = ['E6:4! r:4 E6:4? r:4', 'E6:4? r:4 G6:4! r:4', 'F6:4! r:4 D6:4? r:4', 'B5:8! G#5:8?'];

const c9cAlgol = {
  bpm: 72, bar: 16, reverb: 0.5, night: {},
  parts: [
    { i: 'bell', v: 0.07, role: 'lead' },
    { i: 'sub_bass', v: 0.13, role: 'bass' },
    { i: 'pad', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.1 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 E6:8?']),
      bassLine(ALG.intro, '1:16', { lo: 33 }),
      pad(ALG.intro, { center: 62 }),
      arp(ALG.intro, ['r:4 4:2? r:10', 'r:12 2:2? r:2'], { center: 84 }),
      rest(2),
    ],
    A: [
      bars(ALG_A),
      bassLine(ALG.A, '1:16', { lo: 33 }),
      pad(ALG.A, { center: 62 }),
      arp(ALG.A, ['r:4 4:2? r:6 2:2? r:2', 'r:8 3:2? r:6'], { center: 84 }),
      `${rest(4)} ${guide(ALG.A.slice(4), 'x:16', { center: 57 })}`,
    ],
    // 光が またたく
    B: [
      bars(ALG_B),
      bassLine(ALG.B, '1:16', { lo: 33 }),
      pad(ALG.B, { center: 64 }),
      arp(ALG.B, 'r:2 2:2? r:4 r:2 4:2? r:4', { center: 84 }),
      guide(ALG.B, 'x:8 x:8', { center: 57 }),
    ],
  },
  form: ['intro', 'A', 'B'],
  loopFrom: 1,
};

// ═════════════ c9c_note: ひとつめの星の音（ハ長調 96。くり返さない）═════════════
// 星の音（ミ・黄）を 手に 入れた よろこび。4小節 = 10 秒（のこりの ひびきを 入れて 12 秒 いない）。
//   ミの 音から 始まり（ミ・ソ・ド・ミ）、さいごも 高い ミを のばす。ハープは 星の子の 7つの 音を ド〜シ と のぼる。ベルが 高い ミで きらり
const NOTE = { main: ['C', 'F', 'G', 'C'] };

const c9cNote = {
  bpm: 96, bar: 16, once: true, reverb: 0.4,
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    { i: 'pluck', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.32, minIntensity: 0 },
  ],
  sections: {
    main: [
      'E5:4! G5:4 C6:4 E6:4 D6:4! C6:4 A5:4 C6:4 B5:4! D6:4 G6:4 F6:4 E6:16!',
      bassLine(NOTE.main, ['1:8! 5:8', '1:8! 5:8', '1:8! 5:8', '1:16!'], { lo: 36 }),
      `${C9A_SEVEN.map((n) => `${n}:1`).join(' ')} C6:9 ${arp(NOTE.main.slice(1, 3), '0:2 1:2 2:2 3:2 2:2 1:2 0:2 r:2', { center: 72 })} C6:1 E6:1 G6:1 C7:13`,
      'r:8 E6:8? r:16 r:16 G6:4? C7:4? E7:8!',
      pad(NOTE.main, { center: 64 }),
      'R:4? r:12 r:16 r:8 tl:2? t:2? th:2 s:2 c:8! r:8',
    ],
  },
  form: ['main'],
};

for (const tr of [c9cRiver, c9cPyramid, c9cRiddle, c9cTrio2, c9cAlgol, c9cNote]) tr.ch = oldView(tr);

// テストが 見る: ピラミッドの もとの ふし・鏡（さかさ）の 道具・3人組の 調の うつし
export const C9C_PYRAMID_ORIG = PYR_ORIG;
export const C9C_TOOLS = { mirror, shift, midiOfName };
export const C9C_TRIO_SHIFT = T2;

// 曲の id は docs/plan-part3.md の 11-5（かえない）
export const C9C_TRACKS = {
  c9c_river: c9cRiver,
  c9c_pyramid: c9cPyramid,
  c9c_riddle: c9cRiddle,
  c9c_trio2: c9cTrio2,
  c9c_algol: c9cAlgol,
  c9c_note: c9cNote,
};
export const C9C_IDS = Object.keys(C9C_TRACKS);
