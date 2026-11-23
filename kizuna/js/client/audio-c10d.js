// 第99回 F: 第3部 第2章 第4幕「金の音と、星の橋」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c10d.md の「実装メモ（第2章 第4幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない。鏡の ボスの 曲も もとの お話の 曲を 借りて いない）。
//   c10d_stairs は 第5章の 星の塔の 曲（star_tower）の ふし 16小節を そのまま 使う（調も 同じ ニ短調）。
//   c10d_bridge・c10d_seven は スピカの歌（c9d_song）の 7ふしを 使う（c10d_seven は c10c_six と 同じ 作り）。
//
// ・c10d_stairs … 空への星の階段（ニ短調 96。星の塔の ふし。画面の 状態 gateStage〈開けた 門の 数 0〜4〉で
//     強さ 0・0.25・0.5・0.75・1（楽器が 1つずつ ふえる）と だん 0〜4（調が 半音ずつ 上がる・テンポが 少し 上がる）:
//     0 … 笛の ふしと ベースだけ   1 … ＋ ハープの 星の アルペジオ   2 … ＋ 弦の のばし   3 … ＋ たいこ
//     4 … ＋ ベルの 星（4小節ごとに 高く かけ上がる）。形は かわらない ので ふしの とちゅうから 止まらない
// ・c10d_gate … 色ガラスの門（ニの ドリア 156。短く きびきび した 戦い。オルゴールの ガラスの きらきら。
//     C は レ・ミ・ファ・ソ・ラ・シ を 1小節に 1つずつ 鳴らす〈ベルが 同じ 音で こたえる〉）
// ・c10d_mirror … さかさまメヌエット（ホ短調 3/4 120。いばった メヌエット。4小節の ふしに、鏡に うつった ように
//     上がり下がりが 逆の ふし〈音階の 上で さかさ〉が こたえる。A2 では こたえを オルゴールだけが 鳴らす〈鏡が かってに こたえる〉）
// ・c10d_bridge … 星の橋（ハ長調 88。54.5 秒。くり返さない。スピカの歌の 1〜6ふしめの 頭 → 大きく 広がる → 7ふしめ。
//     さいごの ド〈7ふしめの おしまいの 音〉の 手前の シで ふしが 止まり、ソの 和音と ハープ・ベルが のこる ＝ 止まりきらない）
// ・c10d_seven … そろった七つの音（ハ長調 144・さいごの 小節 116。13.7 秒。くり返さない。スピカの歌の 1〜7ふしめの 頭 →
//     ベルが レ・ミ・ファ・ソ・ラ・シ・ド〈集めた 7つの 星の音〉→ ドで 止まり、その 上に 高い レを 1つ〈8つめ。問い〉）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=b63ba00e848c';
import { C9C_TOOLS } from './audio-c9c.js?v=b63ba00e848c';
import { C9D_SONG } from './audio-c9d.js?v=b63ba00e848c';

const { SHARP, FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView } = C9A_TOOLS;
const { shift, midiOfName } = C9C_TOOLS;
const F = { sp: FLAT };
const F12 = { sp: SHARP, bar: 12 };

// ═════════════ c10d_stairs: 空への星の階段（ニ短調 96）═════════════
// 星の塔の てっぺんから 空へ のびる 一本道。星の塔の 曲（star_tower。ニ短調 92）の ふし 16小節を 少し 速く、高く のぼる 気持ちで。
//   A 星の塔の 1〜8小節 → B 9〜16小節 → C 空へ のぼる（新しい ふし。ヘ長調から 1小節ずつ 上へ）→ A2（さいごの 小節だけ ちがう）
//   開けた 門の 数（gateStage 0〜4）で 楽器が 1つずつ ふえ（強さ ＝ 門の 数 ÷ 4）、調が 半音ずつ 上がる（だん 0〜4）
const ST = {
  intro: ['Dm', 'A'],
  A: ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Gm', 'A', 'Dm'],
  B: ['F', 'C', 'Bb', 'Gm', 'Dm', 'Bb', 'A', 'D'],
  C: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm', 'Bb', 'A'],
  A2: ['Dm', 'Bb', 'C', 'Am', 'Dm', 'Gm', 'A', 'Dm A'],
};
// 星の塔の ふし（audio.js の star_tower の 1つめの チャンネルと 同じ 音・同じ 長さ）
const TOWER_A = [
  'A4:4! D5:4 E5:4 F5:4', 'G5:6! F5:2 D5:8', 'E5:4! G5:4 C6:6 B5:2', 'A5:12! r:4',
  'D6:4! C6:2 A5:2 F5:4 A5:4', 'G5:6! Bb5:2 D6:8', 'C#6:4! B5:2 A5:2 E5:4 G5:4', 'F5:12! r:4',
];
const TOWER_B = [
  'A5:4! C6:4 F6:6 E6:2', 'D6:4! C6:4 G5:8', 'F5:4! D5:2 F5:2 Bb5:4 D6:4', 'C6:6! Bb5:2 G5:8',
  'A5:4! F5:2 D5:2 E5:4 F5:4', 'G5:4! F5:2 E5:2 D5:4 Bb5:4', 'A5:4! G5:2 F5:2 E5:4 C#5:4', 'D5:16!',
];
// 空へ のぼる（1小節ずつ 和音の 根が 上がる。ふしの 頭も 上へ）
const STAIR_C = [
  'F5:4! A5:4 C6:8', 'G5:4! Bb5:4 D6:8', 'A5:4! C6:4 E6:8', 'Bb5:4! D6:4 F6:8',
  'E6:4! C6:4 G5:4 C6:4', 'D6:6! E6:2 F6:8', 'F6:4! E6:2 D6:2 Bb5:4 D6:4', 'C#6:8! E6:4 A5:4',
];
const STAIR_A2 = [...TOWER_A.slice(0, 7), 'D5:8! E5:4 C#5:4'];
// ハープの 星の アルペジオ（星の塔の 曲の 2つめの チャンネルと 同じ 形: 1・2・3・4・3・2・1・休み）
const STAR_ARP = '0:2 1:2 2:2 3:2 2:2 1:2 0:2 r:2';
const STAR_ARP_DOWN = '3:2 2:2 1:2 0:2 1:2 2:2 3:2 r:2';
// ベルの 星（強い 拍は さける）。4小節めの うしろは 高く かけ上がる
const STAR_BELL = 'r:4 2:1? r:5 r:2 3:1? r:3';
const STAR_RISE = 'r:8 0:1? 1:1? 2:1? 3:1? 4:1? 5:1? 6:2?';
const starBells = (prog) => prog.map((c, i) => arp([c.split(' ')[0]], i % 4 === 3 ? STAR_RISE : STAR_BELL, { center: 78, ...F })).join(' ');
const CLIMB_DR = 'k:4! h:4? s:4 h:4?';
// 強さ（gateStage 0〜4 → 0・0.25・0.5・0.75・1）。だんで 調が 半音ずつ 上がる（テンポも 少し）
export const GATE_INTENSITY = [0, 0.25, 0.5, 0.75, 1];
export const STAIRS_PHASES = [0, 1, 2, 3, 4].map((n) => ({ transpose: n, tempo: Math.round((1 + n * 0.01) * 100) / 100 }));

const c10dStairs = {
  bpm: 96, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.15, role: 'bass', minIntensity: 0 },
    // 門 1つ: ハープの 星の アルペジオ
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0.25, pan: -0.25 },
    // 門 2つ: 弦の のばし
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0.5, pan: 0.25 },
    // 門 3つ: たいこ
    { drums: true, v: 0.3, minIntensity: 0.75 },
    // 門 4つ: ベルの 星
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 1, pan: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 E5:4 C#5:4',
      bassLine(ST.intro, '1:16', { lo: 38, ...F }),
      arp(ST.intro, STAR_ARP, { center: 70, ...F }),
      pad(ST.intro, { center: 62, mods: '?', ...F }),
      drums(2, 'r:16', { last: 'r:8 t:2? t:2 th:2 th:2' }),
      `${rest(1)} ${arp(['A'], STAR_RISE, { center: 78, ...F })}`,
    ],
    A: [
      bars(TOWER_A),
      bassLine(ST.A, '1:8! 5:8', { lo: 38, ...F }),
      arp(ST.A, STAR_ARP, { center: 70, ...F }),
      pad(ST.A, { center: 62, ...F }),
      drums(8, CLIMB_DR, { last: 'k:4! h:2 h:2 s:2 s:2 t:2 th:2' }),
      starBells(ST.A),
    ],
    B: [
      bars(TOWER_B),
      bassLine(ST.B, '1:4! 1:4 5:4 1:4', { lo: 38, ...F }),
      arp(ST.B, STAR_ARP, { center: 70, ...F }),
      pad(ST.B, { center: 64, ...F }),
      drums(8, CLIMB_DR, { last: 'k:4! s:2 s:2 s:2 s:2 tl:2 tl:2' }),
      starBells(ST.B),
    ],
    // 空へ のぼる
    C: [
      bars(STAIR_C),
      bassLine(ST.C, '1:4! 5:4 8:4 5:4', { lo: 38, ...F }),
      arp(ST.C, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 72, ...F }),
      guide(ST.C, 'x:8 x:8', { center: 67, ...F }),
      drums(8, 'k:4! h:2 h:2? s:4 k:2 h:2?', { first: 'c:4! h:2 h:2? s:4 k:2 h:2?', last: 'k:2! k:2 s:2 s:2 t:2 t:2 th:2 c:2' }),
      starBells(ST.C),
    ],
    A2: [
      bars(STAIR_A2),
      bassLine(ST.A2, '1:8! 5:8', { lo: 38, ...F }),
      arp(ST.A2, STAR_ARP_DOWN, { center: 70, ...F }),
      pad(ST.A2, { center: 62, ...F }),
      drums(8, CLIMB_DR, { first: 'c:4! h:4? s:4 h:4?', last: 'k:4! s:2 s:2 t:2 t:2 th:2 th:2' }),
      starBells(ST.A2),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // だん ＝ gateStage（形は かえない ＝ ふしの とちゅうから 止まらない。調が 半音ずつ・テンポが 1% ずつ 上がる）
  phases: STAIRS_PHASES,
};

// ═════════════ c10d_gate: 色ガラスの門（ニの ドリア 156）═════════════
// 門の 番人（鏡の かけらの 兵）との 戦い。短く きびきび。オルゴールの ガラスの きらきら（強い 拍は さける 8分）と 弦の きざみ。
//   A 番人の ふし → B かけらが 光る（長い 音）→ C 6つの 音（1小節に 1つずつ レ・ミ・ファ・ソ・ラ・シ。ベルが 同じ 音で こたえる。
//   7小節めで 6つを 一気に かけ上がる）→ A2
const GT = {
  intro: ['Dm', 'A'],
  A: ['Dm', 'C', 'Dm', 'Am', 'Dm', 'C', 'G', 'A'],
  B: ['F', 'C', 'G', 'Dm', 'Bb', 'F', 'G', 'A'],
  C: ['Dm', 'C', 'F', 'G', 'Am', 'Em', 'Dm', 'A'],
};
const GATE_A = [
  'A5:2! A5:1 A5:1 D6:2 A5:2 F5:4! D5:4', 'E5:2! G5:2 C6:2 E6:2 D6:4! C6:2 G5:2',
  'F5:2! A5:2 D6:2 F6:2 E6:4! D6:2 A5:2', 'C6:6! B5:2 A5:4! E5:4',
  'A5:2! A5:1 A5:1 D6:2 A5:2 G5:4! F5:4', 'E5:2! G5:2 C6:2 G5:2 E6:4! D6:2 C6:2',
  'B5:2! D6:2 G6:2 D6:2 B5:4! G5:4', 'C#6:4! E6:4 A5:4! r:4',
];
const GATE_B = [
  'A5:6! G5:2 F5:4! C6:4', 'G5:6! E5:2 C5:4! E5:4', 'D5:4! G5:4 B5:4! D6:4', 'A5:12! r:4',
  'D6:6! C6:2 Bb5:4! F5:4', 'A5:6! G5:2 F5:4! A5:4', 'B5:4! D6:4 G6:4! F6:4', 'E6:8! C#6:4 A5:4',
];
// 6つの 音（レ 赤・ミ 黄・ファ 緑・ソ 青・ラ 白・シ むらさき）を 1小節に 1つずつ。その 音が 小節の 頭と まん中
export const GATE_NOTES = ['D', 'E', 'F', 'G', 'A', 'B'];
const GATE_C = [
  'D6:4! A5:2 F5:2 D6:4! r:4', 'E6:4! C6:2 G5:2 E6:4! r:4', 'F6:4! C6:2 A5:2 F6:4! r:4', 'G6:4! D6:2 B5:2 G6:4! r:4',
  'A5:4! E5:2 C5:2 A5:4! r:4', 'B5:4! G5:2 E5:2 B5:4! r:4', 'D5:2! E5:2 F5:2 G5:2 A5:2! B5:2 C6:2 D6:2', 'E6:4! C#6:4 A5:4! E5:4',
];
// ベルの こたえ（その 小節の 音を 高い 所〈オクターブ 6〉で、2拍めに 1つ）
const GATE_BELL = [...GATE_NOTES.map((n) => `r:4 ${n}6:2? r:10`), 'r:16', 'r:16'];
const GLASS = 'r:2 0:2? 1:2? 2:2? r:2 3:2? 2:2? 1:2?';
const GLASS2 = 'r:2 2:2? 1:2? 3:2? r:2 2:2? 4:2? 3:2?';
const GATE_A2 = [...GATE_A.slice(0, 7), 'C#6:4! E6:4 A5:2! B5:2 C#6:2 E6:2'];
const GATE_DR = 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2';

const c10dGate = {
  bpm: 156, bar: 16, reverb: 0.26, fill: 0, night: {},
  parts: [
    { i: 'lead', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // ガラスの きらきら
    { i: 'musicbox', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.3 },
    // 弦の きざみ
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.25 },
    // 6つの 音の こたえ（C だけ）
    { i: 'bell', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.38, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 E5:4! C#5:4',
      bassLine(GT.intro, '1:2! 1:2 1:2 1:2 1:2 1:2 1:2 1:2', { lo: 38, ...F }),
      arp(GT.intro, ['r:2 4:1? 3:1? 2:1? 1:1? 0:2? r:8', GLASS], { center: 84, ...F }),
      comp(GT.intro, ['x:2! r:14', 'x:2! r:6 x:2 r:2 x:2 r:2'], { center: 64, ...F }),
      rest(2),
      drums(2, ['c:4! r:12', 'k:2! s:2 s:2 k:2 s:1 s:1 s:2 t:2 th:2']),
    ],
    A: [
      bars(GATE_A),
      bassLine(GT.A, '1:2! 1:2 8:2 1:2 1:2! 1:2 8:2 5:2', { lo: 38, ...F }),
      arp(GT.A, GLASS, { center: 84, ...F }),
      comp(GT.A, 'x:2! r:6 x:2 r:2 x:2 r:2', { center: 64, ...F }),
      rest(8),
      drums(8, GATE_DR, { last: 'k:2! h:2 s:2 h:2 s:1 s:1 s:2 t:2 tl:2' }),
    ],
    // かけらが 光る
    B: [
      bars(GATE_B),
      bassLine(GT.B, '1:4! 1:2 1:2 5:4 1:2 1:2', { lo: 38, ...F }),
      arp(GT.B, GLASS2, { center: 86, ...F }),
      pad(GT.B, { center: 62, mods: '?', ...F }),
      rest(8),
      drums(8, 'k:4! s:2? h:2 k:2 h:2 s:4', { last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
    // 6つの 音
    C: [
      bars(GATE_C),
      bassLine(GT.C, '1:2! 1:2 1:2 1:2 5:2! 5:2 5:2 5:2', { lo: 38, ...F }),
      arp(GT.C, 'r:8 r:2 2:2? 1:2? 0:2?', { center: 84, ...F }),
      comp(GT.C, 'x:2! r:14', { center: 62, ...F }),
      bars(GATE_BELL),
      drums(8, 'k:2! h:2 R:2 h:2 k:2 h:2 R:2 h:2', { first: 'c:2! h:2 R:2 h:2 k:2 h:2 R:2 h:2', last: 's:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 tl:2! tl:2 th:2 c:2!' }),
    ],
    A2: [
      bars(GATE_A2),
      bassLine(GT.A, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2', { lo: 38, ...F }),
      arp(GT.A, GLASS2, { center: 84, ...F }),
      comp(GT.A, 'x:2! r:2 x:2 r:2 x:2 r:2 x:2 r:2', { center: 64, ...F }),
      rest(8),
      drums(8, GATE_DR, { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2', last: 'k:2! s:2 s:2 k:2 s:1 s:1 s:1 s:1 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（レ）と 半音上
  pinch: { n: 'D5:2 Eb5:2 D5:2 A4:2 D5:2 Eb5:2 D5:2 F5:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10d_mirror: さかさまメヌエット（ホ短調 3/4 120）═════════════
// 金の ふちの 大きな 鏡。いばった メヌエット（オルガンの ふし・ベースは 1拍め・ハープシコードふうの はじく 音が 2・3拍め）。
//   どの 区切りも 4小節の「問い」と、鏡に うつった ような「こたえ」（音階の 上で 上がり下がりを 逆に した ふし）。
//   A ホ短調の 問い → こたえ（オルゴールが こたえを なぞる。つめたい ガラス）→ B ト長調で いばる → C しずかで つめたい（長い 音）
//   → A2 問いは オルガン、こたえは オルゴールだけ（鏡が かってに こたえる。にくめないが 少し つめたい）
// 1小節 = 16分音符 12（4分 3つ）
const SCALE_STEPS = [0, 2, 3, 5, 7, 8, 10];
const E4 = 64;
// ホ短調（＝ト長調）の 音階の 何番目か
export const scaleIndex = (m) => {
  const rel = m - E4;
  const o = Math.floor(rel / 12);
  const d = SCALE_STEPS.indexOf(rel - 12 * o);
  if (d < 0) throw new Error(`c10d_mirror:${m}`);
  return o * 7 + d;
};
const midiOfIndex = (i) => {
  const o = Math.floor(i / 7);
  return E4 + 12 * o + SCALE_STEPS[i - 7 * o];
};
const nameOfSharp = (m) => `${SHARP[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
// 鏡の こたえ: axis の 音を 中心に、音階の 上で 上がり下がりを 逆に（長さと しるしは そのまま）
export function mirrorBar(bar, axis) {
  const ax = scaleIndex(midiOfName(axis));
  return bar.trim().split(/\s+/).map((tok) => {
    const k = tok.indexOf(':');
    const n = tok.slice(0, k);
    if (n === 'r') return tok;
    return `${nameOfSharp(midiOfIndex(2 * ax - scaleIndex(midiOfName(n))))}${tok.slice(k)}`;
  }).join(' ');
}
// 問い（4小節）と 鏡の 音
const MQ = {
  A: { q: ['E5:4! G5:2 B5:2 E6:4', 'D6:4! C6:2 B5:2 A5:4', 'G5:4! E5:2 G5:2 A5:2 B5:2', 'E5:6! B5:2 E6:4'], axis: 'B5' },
  B: { q: ['D6:4! B5:2 C6:2 D6:4', 'E6:4! D6:2 C6:2 B5:2 A5:2', 'A5:4! F#5:2 G5:2 A5:2 C6:2', 'B5:8! G5:4'], axis: 'C6' },
  C: { q: ['C6:8! B5:4', 'G5:8! E5:4', 'A5:4! C6:4 E6:4', 'B5:12!'], axis: 'A5' },
};
export const MIRROR_LINES = Object.fromEntries(Object.entries(MQ).map(([k, v]) => [k, { q: v.q, a: v.q.map((b) => mirrorBar(b, v.axis)), axis: v.axis }]));
const MR = {
  intro: ['Em', 'B7'],
  A: ['Em', 'G', 'C', 'Em', 'Bm', 'C', 'D7', 'B7'],
  B: ['G', 'C', 'D', 'G', 'G', 'Am', 'Em', 'D'],
  C: ['Am', 'Em', 'C', 'B7', 'Bm', 'G', 'D', 'Em'],
};
const ML = MIRROR_LINES;
const MINUET = 'r:4 x:4 x:4';
const MIN_DR = 'k:4! h:4? h:4?';
const ghostBar = (b) => b.trim().split(/\s+/).map((t) => (t.startsWith('r:') ? t : t.replace(/[!?]*$/, '?'))).join(' ');
// 問いの 間の オルゴールは 鏡の きらり（2拍めの うらに 1つ）
const GLINT = 'r:6 2:2? r:4';
const mirrorBox = (prog, sec, { answerOnly = false } = {}) => [
  ...prog.slice(0, 4).map((c) => arp([c], GLINT, { center: 86, ...F12 })),
  ...ML[sec].a.map((b) => (answerOnly ? b : ghostBar(b))),
].join(' ');

const c10dMirror = {
  bpm: 120, bar: 12, reverb: 0.34, fill: 0, night: {},
  parts: [
    { i: 'organ', v: 0.075, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    // ハープシコードふうの きざみ（2・3拍め）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    // 鏡の こたえ（オルゴール）
    { i: 'musicbox', v: 0.055, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.28, minIntensity: 0 },
  ],
  sections: {
    // 鏡が 下りて くる（ベルの ような オルゴールが 上から）
    intro: [
      'r:12 r:8 B5:4',
      bassLine(MR.intro, '1:4! r:8', { lo: 40, ...F12 }),
      comp(MR.intro, MINUET, { center: 62, ...F12 }),
      arp(MR.intro, ['r:2 5:2? 4:2? 3:2? 2:2? 1:2?', 'r:6 2:2? r:4'], { center: 82, ...F12 }),
      pad(MR.intro, { center: 60, mods: '?', ...F12 }),
      drums(2, 'k:4! r:8', { last: 'k:4! R:4 R:2 R:2?' }),
    ],
    A: [
      bars([...ML.A.q, ...ML.A.a]),
      bassLine(MR.A, '1:4! r:8', { lo: 40, ...F12 }),
      comp(MR.A, MINUET, { center: 62, ...F12 }),
      mirrorBox(MR.A, 'A'),
      pad(MR.A, { center: 60, mods: '?', ...F12 }),
      drums(8, MIN_DR, { last: 'k:4! R:4 R:2 R:2' }),
    ],
    // ト長調で いばる
    B: [
      bars([...ML.B.q, ...ML.B.a]),
      bassLine(MR.B, '1:4! r:4 5:4', { lo: 40, ...F12 }),
      comp(MR.B, 'r:4 x:2. x:2. x:4', { center: 64, ...F12 }),
      mirrorBox(MR.B, 'B'),
      pad(MR.B, { center: 62, ...F12 }),
      drums(8, 'k:4! R:4? R:4?', { first: 'c:4! R:4? R:4?', last: 'k:4! R:2 R:2 R:2 R:2' }),
    ],
    // しずかで つめたい
    C: [
      bars([...ML.C.q, ...ML.C.a]),
      bassLine(MR.C, '1:12!', { lo: 40, ...F12 }),
      comp(MR.C, 'r:4 x:4? r:4', { center: 62, ...F12 }),
      mirrorBox(MR.C, 'C'),
      pad(MR.C, { center: 60, ...F12 }),
      drums(8, 'r:4 h:4? r:4', { last: 'k:4! R:4 tl:2 tl:2' }),
    ],
    // 鏡が かってに こたえる
    A2: [
      bars([...ML.A.q, rest(4, 12)]),
      bassLine(MR.A, '1:4! r:4 5:4', { lo: 40, ...F12 }),
      comp(MR.A, MINUET, { center: 62, ...F12 }),
      mirrorBox(MR.A, 'A', { answerOnly: true }),
      pad(MR.A, { center: 60, mods: '?', ...F12 }),
      drums(8, MIN_DR, { first: 'c:4! h:4? h:4?', last: 'k:4! R:4 k:2 R:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: 主音（ミ）と 半音上
  pinch: { n: 'E6:2 F6:2 E6:2 B5:2 E6:2 F6:2 E6:2 G6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c10d_bridge: 星の橋（ハ長調 88。くり返さない）═════════════
// 7つの 音が 空へ のぼり、丘から 光の 橋が のびる（54.5 秒）。第2章で いちばん 大きな 曲。
//   intro ハープと ベルが 7つの 星の音（ド〜シ）を のぼる → P スピカの歌の 1〜6ふしめの 頭（1ふし 2小節。だんだん 楽器が ふえる。
//   5ふしめは 1・3小節め）→ W 大きく 広がる（いちばん 高い 所）→ F 7ふしめを みんなで（弦が 1オクターブ 下で いっしょに）。
//   7ふしめの さいごの ド（C6:16）の 手前の シで ふしが 止まり、ソの 和音・ハープ・ベルが のこる（止まりきらない。かなしく しない ＝ 長調）
const SONG = C9D_SONG;
const P_PICK = [[0, 1], [0, 1], [0, 1], [0, 1], [0, 2], [0, 1]];
export const BRIDGE_HEADS = P_PICK.map((ix, k) => ix.map((i) => SONG.phrases[k][i]));
const BR = {
  intro: ['F', 'G'],
  P: P_PICK.flatMap((ix, k) => ix.map((i) => SONG.chords[k][i])),
  W: ['Am', 'F G'],
  F: [...SONG.chords[6].slice(0, 3), 'G'],
};
const BR_W = ['E6:4! D6:4 C6:4 E6:4', 'F6:6! E6:2 D6:4 B5:4'];
// 7ふしめの 1〜3小節（さいごの ド の 手前で 止まる）
export const BRIDGE_LAST = SONG.phrases[6].slice(0, 3);
const BR_F = [...BRIDGE_LAST, 'r:16'];
// 弦: P の 前半は 休み → 3ふしめから のばし → W は のばし → F は ふしを 1オクターブ 下で
const BR_STR = [
  rest(4),
  pad(BR.P.slice(4), { center: 60, mods: '?' }),
];

const c10dBridge = {
  bpm: 88, bar: 16, once: true, reverb: 0.5, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    { i: 'strings', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // 7つの 星の音が のぼる
    intro: [
      rest(2),
      bassLine(BR.intro, '1:16', { lo: 36 }),
      rest(2),
      arp(BR.intro, ['0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 5:2 r:4'], { center: 64 }),
      bars(['r:2 C6:2? D6:2? E6:2? r:2 F6:2? G6:2? A6:2?', 'r:2 B6:6? r:8']),
      drums(2, 'r:16', { last: 'r:12 tl:2? tl:2' }),
    ],
    // スピカの歌の 1〜6ふしめの 頭
    P: [
      bars(BRIDGE_HEADS.flat()),
      bassLine(BR.P, '1:8! 5:8', { lo: 36 }),
      BR_STR.join(' '),
      arp(BR.P, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
      bars(BRIDGE_HEADS.flatMap((ph) => [`${shift(`${ph[0].split(':')[0]}:8`, 12)}? r:8`, 'r:16'])),
      // たいこは 5ふしめから（低い タムが 遠くで）
      `${rest(8)} ${drums(4, 'tl:4? r:12', { last: 'tl:4? r:4 tl:2 t:2 th:2 tl:2' })}`,
    ],
    // 大きく 広がる
    W: [
      bars(BR_W),
      bassLine(BR.W, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      pad(BR.W, { center: 64 }),
      arp(BR.W, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 66 }),
      bars(['C7:4? r:12', 'r:8 G6:4? B6:4?']),
      drums(2, 'k:4! r:4 tl:4 r:4', { first: 'c:4! r:4 tl:4 k:4', last: 'k:4! r:4 tl:2 tl:2 t:2 th:2' }),
    ],
    // 7ふしめ（みんなで）→ シで 止まる
    F: [
      bars(BR_F),
      bassLine(BR.F, ['1:4! 5:4 8:4 5:4', '1:4! 5:4 8:4 5:4', '1:4! 5:4 1:4! 5:4', '1:16'], { lo: 36 }),
      `${bars(BRIDGE_LAST.map((b) => shift(b, -12)))} ${pad(['G'], { center: 62, mods: '?' })}`,
      arp(BR.F, ['0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2? r:6'], { center: 64 }),
      bars(['G6:4? r:12', 'r:16', 'r:16', 'r:4 B6:4? r:8']),
      drums(4, 'k:4! r:4 tl:4? r:4', { first: 'c:4! r:4 tl:4? r:4', last: 'c:4? r:12' }),
    ],
  },
  form: ['intro', 'P', 'W', 'F'],
};

// ═════════════ c10d_seven: そろった七つの音（ハ長調 144。くり返さない）═════════════
// 7つの 台が 光る。スピカの歌の 1〜7ふしめの はじめの 小節を 1小節ずつ じゅんに（笛。c10c_six と 同じ 作りで 7ふしめまで）。
//   ベルは その ふしの 頭の 音を 1オクターブ 上で。さいごの 小節（E。少し ゆっくり 116）は ベルが レ・ミ・ファ・ソ・ラ・シ・ド
//   （集めた 7つの 星の音）を のぼり、ドで 止まる。その 上に 高い レを 1つ（8つめ。問いの ような 音）
const SEVEN_HEADS = SONG.phrases.map((ph) => ph[0]);
const SEVEN_CH = SONG.chords.map((c) => c[0]);
const headOf = (b) => b.trim().split(/\s+/)[0].split(':')[0];
export const SEVEN_NOTES = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];
// 8つめ（問い）
export const EIGHTH_NOTE = 'D7';
const SEVEN_BELL = SEVEN_HEADS.map((b) => `${shift(`${headOf(b)}:8`, 12)}! r:8`);
const SEVEN_RUN = `${SEVEN_NOTES.slice(0, 6).map((n) => `${n}6:1`).join(' ')} r:2 C7:4! ${EIGHTH_NOTE}:4?`;

const c10dSeven = {
  bpm: 144, bar: 16, once: true, reverb: 0.4, night: {},
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
      bars(SEVEN_HEADS),
      bassLine(SEVEN_CH, '1:4! 5:4 1:4 5:4', { lo: 36 }),
      bars(SEVEN_BELL),
      arp(SEVEN_CH, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 64 }),
      pad(SEVEN_CH, { center: 62 }),
      drums(7, 'k:4! h:4? R:4 h:4?', { first: 'c:4! h:4? R:4 h:4?', last: 'k:4! h:4? tl:2 t:2 th:2 th:2' }),
    ],
    // ドで 止まり、上に 問いの 音
    E: {
      bpm: 116,
      ch: [
        'G5:4! B5:4 C6:8!',
        bassLine(['G C'], '1:4! 5:4 1:8!', { lo: 36 }),
        SEVEN_RUN,
        arp(['G C'], '0:2 1:2 2:2 3:2 0:2 1:2 2:4', { center: 64 }),
        pad(['G C'], { center: 62 }),
        'k:4! r:4 c:4! r:4',
      ],
    },
  },
  form: ['S', 'E'],
};

for (const tr of [c10dStairs, c10dGate, c10dMirror, c10dBridge, c10dSeven]) tr.ch = oldView(tr);

// テストが 見る: 星の塔の ふし・のぼる ふし・6つの 音の ふし・鏡の 問いと こたえ・スピカの歌の 頭
export const C10D_LINES = {
  towerA: TOWER_A, towerB: TOWER_B, stairC: STAIR_C, stairA2: STAIR_A2,
  gateA: GATE_A, gateC: GATE_C, bridgeW: BR_W, sevenHeads: SEVEN_HEADS,
};

// 曲の id は docs/plan-part3-c10d.md の 16-4（かえない）
export const C10D_TRACKS = {
  c10d_stairs: c10dStairs,
  c10d_gate: c10dGate,
  c10d_mirror: c10dMirror,
  c10d_bridge: c10dBridge,
  c10d_seven: c10dSeven,
};
export const C10D_IDS = Object.keys(C10D_TRACKS);
