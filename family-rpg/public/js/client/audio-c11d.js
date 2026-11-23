// 第104回 F: 第3部 第3章 第4幕「かがやきの女王と、八つめの音」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c11d.md の「実装メモ（第3章 第4幕 F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を 借りて いない）。今までの この ゲームの 曲の ふしを 使う 所:
//   c11d_tower … 星座の島（c11a_isle）・月の都の塔（c11b_tower）・回ろう（c11c_hall の こちこち）・スピカの歌（c9d_song）の 頭
//   c11d_duo   … 鏡の 曲（c10d_mirror の 問いと こたえ）と 月の 使いの 曲（c11b_oboro）
//   c11d_eight … 第1部の エンディング（ending5）の ふしの 頭 4小節 ＋ スピカの歌の 8つめの 音（c10d_seven の 高い レ）
//   c11d_queen2・c11d_end … スピカの歌（c9d_song）の 7ふし ＋ 新しい 8ふしめ
//   c11d_lamps … 月の都の おもて通り（c11b_front）と うら通り（c11b_back）の ふしを いっしょに
//
// ・c11d_scale … つめたい光の広間（ハ短調 66。おごそか・広い・つめたい。かねの ふし・オルガンの のばし・高い 弦。こわすぎない）
// ・c11d_tower … かがやきの塔（イ短調 104。のぼる 曲。画面の 状態 towerStage〈今 いる 階 1〜4〉で 強さ 0.25・0.5・0.75・1:
//     1 … ＋ ベル〈星座の島の ふしの かけら〉   2 … ＋ マリンバ〈月の都の塔の ふしの かけら〉
//     3 … ＋ リムと シェイカーの こちこち〈回ろうの たいこ〉   4 … ＋ 笛〈スピカの歌の 頭〉。ふし・形・調・テンポは 同じ）
// ・c11d_duo … かわるがわるのロンド（ニ短調 152。中ボス。4小節ずつ 鏡の ふし〈オルガン〉と 月の 使いの ふし〈笛〉が 入れかわる。
//     入れかわる 前の 小節に フィル〈前ぶれ〉）
// ・c11d_queen … ゆるがない星（ハ短調 116。気高い。高い ソ〈G6〉が オルガンで ずっと 鳴りつづける 上で 曲が 進む。
//     ボスの だんで テンポだけ 上がる〈1・1.06・1.12・1.18 倍。調は かえない ＝ ゆるがない〉）
// ・c11d_eight … のぼってくる小さな光（ハ長調 88。16.4 秒。くり返さない。オルゴールの 光が のぼる → 第1部の エンディングの ふしの 頭 →
//     ベルが レ・ミ・ファ・ソ・ラ・シ・ド と のぼって 高い レ〈8つめの 音〉。こんどは ソの 和音〈ソ・シ・レ〉の 中に おさまる → c11d_queen2 の ドへ）
// ・c11d_queen2 … つないだ手の歌（ハ長調 126。スピカの歌 7ふし ＋ 新しい 8ふしめ。前半の 高い ソは のこり、その 上で 歌が 広がる。
//     ブラス〈前半の ふしの 楽器〉は 和音を 鳴らす ＝ いっしょに 鳴る）
// ・c11d_lamps … みんなのランプのお祭り（ニ長調 104。おもて通りの ふし〈琴〉と うら通りの ふし〈笛。鏡で うら返した ふし〉が いっしょに。
//     イントロは ランプが 6つ ぜんぶ ともる）
// ・c11d_end … 空と地上をむすぶ橋（ハ長調 108〜。77.9 秒。くり返さない。スピカの歌を 8ふし さいごまで。7ふしめは 第2章の 橋〈c10d_bridge〉で
//     止まった ド まで 行き、8ふしめで やさしく おわる）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js';
import { C9C_TOOLS } from './audio-c9c.js';
import { C9D_SONG } from './audio-c9d.js';
import { MIRROR_LINES, EIGHTH_NOTE, BRIDGE_LAST } from './audio-c10d.js';
import { C11A_LINES } from './audio-c11a.js';
import { C11B_LINES, C11B_TRACKS } from './audio-c11b.js';
import { TOP_TRACKS } from './audio-top.js';

const { SHARP, FLAT, bassLine, comp, arp, guide, pad, drums, rest, bars, oldView, FILL } = C9A_TOOLS;
const { shift } = C9C_TOOLS;
const F = { sp: FLAT };
const S = { sp: SHARP };
const SONG = C9D_SONG;

// ───────────── 小さな 道具 ─────────────
// 音の 列（'E5:6 G5:2 C6:8 …'）を 1小節ずつ に 分ける（小節を またぐ 音は ない もの）
export function splitBars(str, bar = 16) {
  const out = [];
  let cur = [];
  let n = 0;
  for (const t of String(str).trim().split(/\s+/)) {
    cur.push(t);
    n += Number(/:(\d+)/.exec(t)[1]);
    if (n >= bar) {
      if (n > bar) throw new Error(`c11d splitBars: ${t}`);
      out.push(cur.join(' '));
      cur = [];
      n = 0;
    }
  }
  if (cur.length) throw new Error('c11d splitBars: のこり');
  return out;
}
// 3拍子の 小節（12）を 4拍子（16）に: さいごの 音を 4つ のばす（音と じゅんは そのまま）
const to16 = (b) => {
  const ts = b.trim().split(/\s+/);
  const last = ts.pop();
  const m = /^([^:]+):(\d+)(.*)$/.exec(last);
  return [...ts, `${m[1]}:${Number(m[2]) + 4}${m[3]}`].join(' ');
};
// やさしく（強い しるしを とる）
const soft = (b) => b.replace(/!/g, '');

// ═════════════ c11d_scale: つめたい光の広間（ハ短調 66）═════════════
// 光の はかりが ある 白い 広間。おごそか・広い・つめたい。ベルの かね（長い 音）・オルガンの のばし・高い 弦・オルゴールの 冷たい きらり。
//   A かねの ふし（ソ → ミb の 6度で 広く）→ B 少し 高く（ラb の 和音で うつくしく。ソの 和音で 止まって A へ）。こわすぎない（ゆっくり・たいこは 遠い タムだけ）
const SC = {
  intro: ['Cm', 'G'],
  A: ['Cm', 'G', 'Ab', 'G', 'Cm', 'Fm Bb', 'Ab G', 'Cm'],
  B: ['Ab', 'Eb', 'Fm', 'Cm', 'Ab', 'Fm', 'G', 'G'],
};
const SCALE_A = [
  'G5:8! Eb6:8', 'D6:8! B5:4 G5:4', 'C6:8! Eb6:8', 'D6:12! r:4',
  'C6:8! G6:8', 'F6:8! D6:8', 'Eb6:8! D6:4 B5:4', 'C6:12! r:4',
];
const SCALE_B = [
  'Eb6:8! C6:8', 'Bb5:8! G5:8', 'Ab5:8! C6:4 F6:4', 'Eb6:12! r:4',
  'C6:8! Eb6:8', 'F6:8! Ab6:8', 'G6:8! F6:4 D6:4', 'B5:12! r:4',
];
// 冷たい きらり（強い 拍は さける）
const GLINT = ['r:6 4:2? r:8', 'r:10 3:2? r:4'];

const c11dScale = {
  bpm: 66, bar: 16, reverb: 0.6, fill: 0, night: {},
  parts: [
    // かね
    { i: 'bell', v: 0.085, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    // オルガンの のばし
    { i: 'organ', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // 高い 弦（つめたく 広い）
    { i: 'strings', v: 0.022, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.05 },
    { drums: true, v: 0.22, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'C6:8! r:8 G5:8! r:8',
      bassLine(SC.intro, '1:16', { lo: 36, ...F }),
      pad(SC.intro, { center: 60, mods: '?', ...F }),
      rest(2),
      arp(SC.intro, ['r:16', 'r:10 3:2? r:4'], { center: 84, ...F }),
      drums(2, 'tl:4? r:12', { last: 'tl:4? r:8 tl:2? tl:2?' }),
    ],
    A: [
      bars(SCALE_A),
      bassLine(SC.A, ['1:16', '1:16', '1:16', '1:16', '1:16', '1:8! 1:8', '1:8! 1:8', '1:16'], { lo: 36, ...F }),
      pad(SC.A, { center: 60, ...F }),
      `${rest(4)} ${guide(SC.A.slice(4), 'x:16', { center: 76, ...F })}`,
      arp(SC.A, GLINT, { center: 84, ...F }),
      drums(8, ['tl:4? r:12', 'r:16'], { last: 'tl:4? r:4 tl:2? r:2 tl:2? tl:2?' }),
    ],
    // 少し 高く・うつくしく
    B: [
      bars(SCALE_B),
      bassLine(SC.B, '1:8! 5:8', { lo: 36, ...F }),
      pad(SC.B, { center: 62, ...F }),
      guide(SC.B, 'x:8 x:8', { center: 77, ...F }),
      arp(SC.B, ['r:6 4:2? r:6 3:2?', 'r:10 3:2? r:4'], { center: 84, ...F }),
      drums(8, ['tl:4? r:12', 'r:8 tl:4? r:4'], { first: 'c:4? r:12', last: 'tl:4? r:4 tl:2? tl:2? t:2? th:2?' }),
    ],
  },
  form: ['intro', 'A', 'B'],
  loopFrom: 1,
};

// ═════════════ c11d_tower: かがやきの塔（イ短調 104）═════════════
// 王宮の さいごの 塔を 1階ずつ のぼる。ブラスの のぼる ふし・ベース・キックと タム（のぼる 足どり）。
//   画面の 状態 towerStage（今 いる 階 1〜4）で 強さ 0.25・0.5・0.75・1。階ごとに、その 幕の 曲の 楽器や ふしが 1つずつ 足される:
//   1 階 … ベル: 星座の島（c11a_isle）の ふしの 頭 2小節（イ長調 → ハ長調へ うつす。A の 1・2小節め）
//   2 階 … マリンバ: 月の都の塔（c11b_tower。おもての 楽器）の ふしの 頭 2小節（ホ短調 → イ短調。A の 5・6小節め）
//   3 階 … 2つめの たいこ: 回ろう（c11c_hall）の リムと シェイカーの こちこち（同じ 形）
//   4 階 … 笛: スピカの歌（c9d_song）の 1ふしめの 頭 2小節（B の 5・6小節め）
//   どの 階でも ふし・形・調・テンポは 同じ（イントロへ もどらない。かわるのは 次の 小節の 頭から）
const TW = {
  intro: ['Am', 'E'],
  A: ['C', 'F', 'G', 'Am', 'Am', 'F', 'Dm', 'E'],
  B: ['Em', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'E'],
  C: ['F', 'G', 'Em', 'Am', 'Dm', 'E', 'F', 'E'],
};
const TOWER_INTRO = 'r:16 r:8 B5:4 G#5:4';
const TOWER_A = [
  'E5:16!', 'F5:8! A5:8', 'G5:4! A5:4 B5:4 D6:4', 'C6:8! B5:4 A5:4',
  'E5:12! r:4', 'F5:8! A5:8', 'F5:4! A5:4 D6:4 F6:4', 'E6:8! B5:4 G#5:4',
];
const TOWER_B = [
  'B5:16!', 'C6:8! E6:8', 'A5:4! C6:4 F6:4 E6:4', 'D6:12! r:4',
  'C6:16!', 'C6:8! E6:8', 'F6:4! E6:4 D6:4 A5:4', 'G#5:8! B5:4 E6:4',
];
// のぼる（1小節ずつ 高く）
const TOWER_C = [
  'A5:4! C6:4 F6:8', 'B5:4! D6:4 G6:8', 'B5:4! E6:4 G6:8', 'C6:4! E6:4 A6:8',
  'A6:6! F6:2 D6:8', 'G#6:6! E6:2 B5:8', 'A6:4! F6:4 C6:4 A5:4', 'B5:8! G#5:4 E5:4',
];
// 1 階: 星座の島の ふしの 頭（イ長調 → ハ長調 ＝ 3つ 上）
export const TOWER_ISLE_SHIFT = 3;
export const TOWER_ISLE = C11A_LINES.isleA.slice(0, 2).map((b) => shift(b, TOWER_ISLE_SHIFT));
// 2 階: 月の都の塔の ふしの 頭（ホ短調 → イ短調 ＝ 5つ 上）
export const TOWER_MOON_SHIFT = 5;
export const TOWER_MOON = C11B_LINES.towerA.slice(0, 2).map((b) => shift(b, TOWER_MOON_SHIFT));
// 3 階: 回ろうの こちこち（c11c_hall の たいこと 同じ 形）
export const TOWER_HALL_DR = 'R:4? sh:2? sh:2? R:4? sh:2? sh:2?';
// 4 階: スピカの歌の 1ふしめの 頭
export const TOWER_SONG = SONG.phrases[0].slice(0, 2);
// 強さ（towerStage 0〜4 → 0・0.25・0.5・0.75・1。0 は 出て いない 間）
export const TOWER_INTENSITY = [0, 0.25, 0.5, 0.75, 1];
// ベルの 星（かけらの ない 小節）・マリンバの 考える きざみ（うしろ半分）
const STAR = 'r:4 2:1? r:5 r:2 3:1? r:3';
const THINK = 'r:8 0:2? 2:2? 1:2? 3:2?';
const CLIMB = 'k:4! h:2? h:2? tl:4 h:2? k:2';

const c11dTower = {
  bpm: 104, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.062, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.16, role: 'bass', minIntensity: 0 },
    // 1 階: 星座の島（ベル）
    { i: 'bell', v: 0.05, role: 'harmony', minIntensity: 0.25, pan: -0.25 },
    // 2 階: 月の都の塔（マリンバ）
    { i: 'marimba', v: 0.075, role: 'harmony', minIntensity: 0.5, pan: 0.25 },
    // 4 階: スピカの歌（笛）
    { i: 'flute', v: 0.085, role: 'harmony', minIntensity: 1, pan: 0 },
    { drums: true, v: 0.3, minIntensity: 0 },
    // 3 階: 回ろうの こちこち
    { drums: true, v: 0.2, minIntensity: 0.75 },
  ],
  sections: {
    intro: [
      TOWER_INTRO,
      bassLine(TW.intro, ['1:16', '1:4! 1:4 1:4 1:4'], { lo: 40, ...S }),
      arp(TW.intro, ['r:16', STAR], { center: 84, ...S }),
      arp(TW.intro, ['r:16', THINK], { center: 72, ...S }),
      rest(2),
      drums(2, 'k:4! r:12', { last: 'k:4! r:4 tl:2 tl:2 t:2 th:2' }),
      drums(2, 'r:16', { last: 'r:8 R:4? sh:2? sh:2?' }),
    ],
    A: [
      bars(TOWER_A),
      bassLine(TW.A, '1:4! 5:4 8:4 5:4', { lo: 40, ...S }),
      `${bars(TOWER_ISLE)} ${arp(TW.A.slice(2), STAR, { center: 84, ...S })}`,
      `${arp(TW.A.slice(0, 4), THINK, { center: 72, ...S })} ${bars(TOWER_MOON)} ${arp(TW.A.slice(6), THINK, { center: 72, ...S })}`,
      rest(8),
      drums(8, CLIMB, { last: 'k:4! h:2? h:2? s:2 s:2 t:2 th:2' }),
      drums(8, TOWER_HALL_DR),
    ],
    B: [
      bars(TOWER_B),
      bassLine(TW.B, '1:4! 5:4 8:4 5:4', { lo: 40, ...S }),
      arp(TW.B, STAR, { center: 84, ...S }),
      arp(TW.B, THINK, { center: 72, ...S }),
      `${rest(4)} ${bars(TOWER_SONG)} ${rest(2)}`,
      drums(8, CLIMB, { first: 'c:4! h:2? h:2? tl:4 h:2? k:2', last: 'k:4! h:2? s:2 s:2 s:2 t:2 th:2' }),
      drums(8, TOWER_HALL_DR, { last: 'R:4? sh:2? sh:2? R:2? R:2? R:2? R:2?' }),
    ],
    // のぼる
    C: [
      bars(TOWER_C),
      bassLine(TW.C, '1:2! 1:2 8:2 1:2 5:2 1:2 8:2 1:2', { lo: 40, ...S }),
      arp(TW.C, 'r:2 1:1? r:3 r:2 2:1? r:3 r:2 3:1? r:1', { center: 84, ...S }),
      arp(TW.C, '0:2 1:2 2:2 3:2 0:2 1:2 2:2 3:2', { center: 72, ...S }),
      rest(8),
      drums(8, 'k:2! h:2 tl:2 h:2 k:2 k:2 t:2 h:2', { first: 'c:2! h:2 tl:2 h:2 k:2 k:2 t:2 h:2', last: FILL }),
      drums(8, TOWER_HALL_DR, { last: 'R:2? R:2? R:2? R:2? sh:2? sh:2? sh:2? sh:2?' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C'],
  loopFrom: 1,
};

// ═════════════ c11d_duo: かわるがわるのロンド（ニ短調 152）═════════════
// 中ボス（2人で。前に 出る 方が 入れかわる）。4小節ずつ、鏡の ふし（c10d_mirror の 問い・こたえ。ホ短調 → ニ短調。3拍子 → 4拍子
//   〈小節の さいごの 音を 4つ のばす〉。オルガン）と、月の 使いの ふし（c11b_oboro の A・B。ニ短調の まま。笛）が かわるがわる。
//   鏡の 4小節は ハープシコードふうの うら打ち、月の 使いの 4小節は 琴の 8分と タムの こどう。入れかわる 前の 小節に フィル（前ぶれ）
export const DUO_BLOCK = 4;
export const DUO_MIRROR_SHIFT = -2;
const mirrorBlock = (list) => list.map((b) => shift(to16(b), DUO_MIRROR_SHIFT));
const OBORO_SRC = { A: splitBars(C11B_TRACKS.c11b_oboro.sections.A[0]), B: splitBars(C11B_TRACKS.c11b_oboro.sections.B[0]) };
// 区切りの 4つの かたまり: 鏡 → 月 → 鏡 → 月
export const DUO_BLOCKS = {
  A: [
    { who: 'mirror', bars: mirrorBlock(MIRROR_LINES.A.q), ch: ['Dm', 'F', 'Bb', 'Dm'] },
    { who: 'oboro', bars: OBORO_SRC.A.slice(0, 4), ch: ['Dm', 'Eb', 'Gm', 'Dsus4'] },
    { who: 'mirror', bars: mirrorBlock(MIRROR_LINES.A.a), ch: ['Am', 'Bb', 'C7', 'A7'] },
    { who: 'oboro', bars: OBORO_SRC.A.slice(4, 8), ch: ['Bb', 'Eb', 'Gm', 'Dm'] },
  ],
  B: [
    { who: 'mirror', bars: mirrorBlock(MIRROR_LINES.B.q), ch: ['F', 'Bb', 'C', 'F'] },
    { who: 'oboro', bars: OBORO_SRC.B.slice(0, 4), ch: ['Gm', 'Eb', 'Bb', 'Dsus4'] },
    { who: 'mirror', bars: mirrorBlock(MIRROR_LINES.B.a), ch: ['F', 'Gm', 'Dm', 'C'] },
    { who: 'oboro', bars: OBORO_SRC.B.slice(4, 8), ch: ['Gm', 'Eb', 'Bb', 'A'] },
  ],
};
const MIRROR_DR = 'k:2! h:2 s:2 h:2 k:2 h:2 s:2 h:2';
const OBORO_DR = 'tl:2! h:2 R:2 h:2 tl:2 tl:2 R:2 h:2';
// 入れかわる 前ぶれ（かたまりの さいごの 小節）
const SWAP_FILL = ['k:2! h:2 s:2 h:2 s:1 s:1 s:1 s:1 t:2 tl:2', 'tl:2! tl:2 R:2 tl:2 t:2 t:2 th:2 th:2'];
function duoSection(blocks, { first } = {}) {
  const prog = blocks.flatMap((b) => b.ch);
  const isM = (b) => b.who === 'mirror';
  return [
    blocks.map((b) => (isM(b) ? bars(b.bars) : rest(DUO_BLOCK))).join(' '),
    blocks.map((b) => bassLine(b.ch, isM(b) ? '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 1:2' : '1:4! 1:4 1:4 1:4', { lo: 38, ...F })).join(' '),
    blocks.map((b) => (isM(b) ? rest(DUO_BLOCK) : bars(b.bars))).join(' '),
    blocks.map((b) => (isM(b) ? comp(b.ch, 'r:4 x:2. r:2 r:4 x:2. r:2', { center: 64, ...F }) : arp(b.ch, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 69, ...F }))).join(' '),
    pad(prog, { center: 60, mods: '?', ...F }),
    blocks.map((b, k) => drums(DUO_BLOCK, isM(b) ? MIRROR_DR : OBORO_DR, { first: k === 0 ? first : undefined, last: SWAP_FILL[isM(b) ? 0 : 1] })).join(' '),
  ];
}
const DU = { intro: ['Dm', 'A'] };

const c11dDuo = {
  bpm: 152, bar: 16, reverb: 0.3, fill: 0, night: {},
  parts: [
    // 鏡の ふし（オルガン）
    { i: 'organ', v: 0.07, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // 月の 使いの ふし（笛）
    { i: 'flute', v: 0.1, role: 'harmony', minIntensity: 0, pan: 0 },
    // はじく 音（鏡の 間は うら打ち・月の 間は 琴の 8分）
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.024, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 E5:4! C#6:4',
      bassLine(DU.intro, ['1:2! r:2 1:2! r:2 1:2! r:6', '1:2! 1:2 1:2 1:2 5:2! 5:2 5:2 5:2'], { lo: 38, ...F }),
      'r:16 r:12 D6:4',
      comp(DU.intro, ['x:2! r:2 x:2! r:2 x:2! r:6', 'r:4 x:2. r:2 r:4 x:2. r:2'], { center: 64, ...F }),
      pad(DU.intro, { center: 60, mods: '?', ...F }),
      drums(2, ['k:2! r:2 k:2! r:2 k:2! r:6', 'k:2! s:2 s:2 k:2 s:1 s:1 s:2 t:2 th:2']),
    ],
    A: duoSection(DUO_BLOCKS.A),
    B: duoSection(DUO_BLOCKS.B, { first: 'c:2! h:2 s:2 h:2 k:2 h:2 s:2 h:2' }),
  },
  form: ['intro', 'A', 'B'],
  loopFrom: 1,
  // ボスの だん: テンポだけ 少し 上がる
  phases: [1, 1.05, 1.1, 1.15].map((tempo) => ({ transpose: 0, tempo })),
  // ピンチ: 主音（レ）と 半音上
  pinch: { n: 'D6:2 Eb6:2 D6:2 A5:2 D6:2 Eb6:2 D6:2 F6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c11d_queen: ゆるがない星（ハ短調 116）═════════════
// さいごの ボス・前半。まっすぐで うつくしく こわい。悪者では ない（気高い・ゆるがない）。
//   北の 空で 動かない 星 ＝ 高い ソ（G6）が オルガンで はじめから おわりまで 鳴りつづける（1つの 音だけ）。その 下で ブラスの 気高い ふし。
//   A まっすぐ → B うつくしく（ラb の 和音から 高く）→ C しずかで こわい（長い 音。動かない 星だけが 光る）→ A2。
//   はげしすぎない（キックは 1拍めと 3拍め・スネアは 少し）。ボスの だんで テンポだけ 上がる（調は かえない ＝ ゆるがない）
export const QUEEN_STAR = 'G6';
const star = (n) => `${QUEEN_STAR}:${n * 16}`;
const QN = {
  intro: ['Cm', 'G'],
  A: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Eb', 'Fm G', 'Cm'],
  B: ['Ab', 'Bb', 'Gm', 'Cm', 'Fm', 'Bb', 'Eb', 'G'],
  C: ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G', 'G'],
  A2: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Eb', 'Fm G', 'Cm'],
};
const QUEEN_A = [
  'G5:6! C6:2 Eb6:8', 'Eb6:4! C6:4 Ab5:8', 'F5:6! Ab5:2 C6:8', 'B5:8! D6:4 G5:4',
  'C6:6! Eb6:2 G6:8', 'Bb5:4! G5:4 Eb6:8', 'D6:4! C6:4 B5:4 D6:4', 'C6:12! r:4',
];
const QUEEN_B = [
  'Eb6:6! F6:2 Eb6:4 C6:4', 'D6:6! Eb6:2 F6:8', 'G6:6! F6:2 D6:8', 'Eb6:12! r:4',
  'C6:6! D6:2 Eb6:4 F6:4', 'F6:4! Eb6:4 D6:8', 'Eb6:4! G6:4 Bb5:4 Eb6:4', 'D6:8! B5:4 G5:4',
];
const QUEEN_C = [
  'G5:16!', 'Eb5:8! G5:8', 'C6:16!', 'Ab5:8! C6:8',
  'F5:16!', 'Ab5:8! F5:8', 'G5:16!', 'B5:12! r:4',
];
const QUEEN_A2 = [...QUEEN_A.slice(0, 6), 'D6:4! B5:4 G5:4 B5:4', 'C6:12! r:4'];
// ベルの 冷たい ひかり（強い 拍は さける ＝ 星と ぶつからない）
const QBELL = 'r:2 2:2? r:2 1:2? r:2 2:2? r:2 3:2?';
const QDR = 'k:4! h:2? h:2? s:4 h:2? h:2?';
export const QUEEN_TEMPOS = [1, 1.06, 1.12, 1.18];

const c11dQueen = {
  bpm: 116, bar: 16, reverb: 0.45, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.068, role: 'lead' },
    { i: 'bass', v: 0.17, role: 'bass' },
    // 動かない 星（ずっと 同じ 1つの 音）
    { i: 'organ', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 G5:4! B5:4',
      bassLine(QN.intro, ['1:16', '1:4! 1:4 1:4 1:4'], { lo: 36, ...F }),
      star(2),
      pad(QN.intro, { center: 62, mods: '?', ...F }),
      arp(QN.intro, ['r:16', QBELL], { center: 81, ...F }),
      drums(2, 'tl:4! r:12', { last: 'k:4! r:4 tl:2 tl:2 t:2 th:2' }),
    ],
    A: [
      bars(QUEEN_A),
      bassLine(QN.A, '1:4! 1:4 1:4 1:4', { lo: 36, ...F }),
      `${star(4)} ${star(4)}`,
      pad(QN.A, { center: 62, ...F }),
      arp(QN.A, QBELL, { center: 81, ...F }),
      drums(8, QDR, { last: 'k:4! h:2? s:2 s:2 s:2 t:2 th:2' }),
    ],
    // うつくしく 高く
    B: [
      bars(QUEEN_B),
      bassLine(QN.B, '1:8! 5:8', { lo: 36, ...F }),
      `${star(4)} ${star(4)}`,
      pad(QN.B, { center: 64, ...F }),
      arp(QN.B, 'r:2 2:2? 1:2? 2:2? r:2 3:2? 2:2? 1:2?', { center: 81, ...F }),
      drums(8, 'k:4! h:2? h:2? s:4 k:2 h:2?', { first: 'c:4! h:2? h:2? s:4 k:2 h:2?', last: FILL }),
    ],
    // しずかで こわい（動かない 星だけが 光る）
    C: [
      bars(QUEEN_C),
      bassLine(QN.C, '1:16', { lo: 36, ...F }),
      `${star(4)} ${star(4)}`,
      pad(QN.C, { center: 60, mods: '?', ...F }),
      arp(QN.C, ['r:16', 'r:10 2:2? r:4'], { center: 81, ...F }),
      drums(8, ['tl:4! r:12', 'tl:4? r:12'], { last: 'tl:4! r:4 tl:2 tl:2 t:2 th:2' }),
    ],
    A2: [
      bars(QUEEN_A2),
      bassLine(QN.A2, [...Array(7).fill('1:4! 1:4 1:4 1:4'), '1:16'], { lo: 36, ...F }),
      `${star(4)} ${star(4)}`,
      pad(QN.A2, { center: 62, ...F }),
      arp(QN.A2, QBELL, { center: 81, ...F }),
      drums(8, QDR, { first: 'c:4! h:2? h:2? s:4 h:2? h:2?', last: 'k:4! r:4 tl:2 tl:2 r:4' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ボスの だん: テンポだけ 上がる（調は かえない）
  phases: QUEEN_TEMPOS.map((tempo) => ({ transpose: 0, tempo })),
  // ピンチ: ハープの 16分（ドと 星の ソ）
  pinch: { n: Array.from({ length: 8 }, () => 'C6:1 G6:1').join(' '), i: 'pluck', v: 0.03 },
};

// ═════════════ c11d_eight: のぼってくる小さな光（ハ長調 88。くり返さない）═════════════
// 戦いの 中の 短い 場面（6小節 ＝ 16.4 秒）。1小節め しずかに、オルゴールの 小さな 光が 下から のぼって 来る →
//   2〜5小節め 第1部の エンディング（ending5）の ふしの 頭 4小節を 笛で やさしく（強い しるし なし。和音も 同じ C・G・Am・F）→
//   6小節め ベルが レ・ミ・ファ・ソ・ラ・シ・ド と のぼって 高い レ（8つめの 音。c10d_seven で 問いの まま だった 音）。
//   こんどは ソの 和音（ソ・シ・レ）の 中に おさまる。おわりの ソの 和音は c11d_queen2 の はじめの ドの 和音へ つながる
export const ENDING5_HEAD = splitBars(TOP_TRACKS.ending5.ch[0].n).slice(0, 4);
export const EIGHT_LAST_CHORD = 'G';
const EI = { intro: ['Am'], head: ['C', 'G', 'Am', 'F'], last: [EIGHT_LAST_CHORD] };
export const EIGHT_RUN = `r:2 ${['D6', 'E6', 'F6', 'G6', 'A6', 'B6'].map((n) => `${n}:1?`).join(' ')} C7:2? ${EIGHTH_NOTE}:6!`;
const c11dEight = {
  bpm: 88, bar: 16, once: true, reverb: 0.55, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'sub_bass', v: 0.14, role: 'bass' },
    { i: 'pad', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.15 },
    // 小さな 光（オルゴール）
    { i: 'musicbox', v: 0.034, role: 'harmony', minIntensity: 0, pan: 0.2 },
    // 8つめの 音（ベル）
    { i: 'bell', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.2, minIntensity: 0 },
  ],
  sections: {
    S: [
      `r:16 ${ENDING5_HEAD.map(soft).join(' ')} B5:8 D6:8`,
      `${bassLine(EI.intro, '1:16', { lo: 33 })} ${bassLine(EI.head, '1:8 5:8', { lo: 36 })} ${bassLine(EI.last, '1:16', { lo: 36 })}`,
      `${pad(EI.intro, { center: 57, mods: '?' })} ${pad(EI.head, { center: 60, mods: '?' })} ${pad(EI.last, { center: 62 })}`,
      // 小さな 光が のぼる → エンディングの オルゴール（ending5 と 同じ 形: 上って 下りる）
      `${arp(EI.intro, '0:2? 1:2? 2:2? 3:2? 4:2? 5:2? 6:2? 7:2?', { center: 66 })} ${arp(EI.head, '0:2? 1:2? 2:2? 3:2? 2:2? 1:2? 2:2? 3:2?', { center: 72 })} ${arp(EI.last, '3:2? r:14', { center: 72 })}`,
      `${rest(5)} ${EIGHT_RUN}`,
      `${rest(4)} r:12 tl:2? tl:2? c:8? r:8`,
    ],
  },
  form: ['S'],
};

// ═════════════ c11d_queen2: つないだ手の歌（ハ長調 126）═════════════
// さいごの ボス・後半。八つの 音が そろって、みんなで 手を つなぐ。スピカの歌が 主役（笛）。
//   1〜7ふしめは c9d_song と 同じ ふし・同じ 和音。8ふしめは 新しい（7ふしめの こたえ ＝ ラ → ファの 6度で 広がり、
//   いちばん 高い ソを 通って、8つめの 音〈レ〉を ソの 和音の 中で 歌い、ドで おわる）。
//   前半の 動かない 星（高い ソ・オルガン）は のこる。その 上で 歌が 広がる。前半の ふしの 楽器（ブラス）は 和音を 鳴らす（いっしょに 鳴る）。
//   S 1〜4ふしめ → T 5〜8ふしめ（7・8ふしめは 弦が 1オクターブ 下で いっしょに 歌う ＝ みんなで）
export const SONG8 = ['A5:6! C6:2 F6:8', 'G6:6! F6:2 D6:8', 'E6:4! C6:4 A5:4 E6:4', 'D6:8! C6:8'];
export const SONG8_CHORDS = ['F', 'G', 'Am', 'G C'];
export const SONG_ALL = [...SONG.phrases, SONG8];
export const SONG_ALL_CHORDS = [...SONG.chords, SONG8_CHORDS];
const Q2 = {
  intro: ['C', 'G'],
  S: SONG_ALL_CHORDS.slice(0, 4).flat(),
  T: SONG_ALL_CHORDS.slice(4, 8).flat(),
};
const Q2_DR = 'k:4! h:2 h:2 s:4 h:2 k:2';
const phraseDr = (n, { first } = {}) => Array.from({ length: n }, (_, k) => drums(4, Q2_DR, {
  first: k === 0 && first ? first : undefined,
  last: k === n - 1 ? 'k:2! k:2 s:2 s:2 t:2 t:2 th:2 c:2!' : 'k:4! h:2 s:2 s:2 s:2 t:2 th:2',
})).join(' ');

const c11dQueen2 = {
  bpm: 126, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    // スピカの 声
    { i: 'flute', v: 0.125, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // 動かない 星（前半から のこる）
    { i: 'organ', v: 0.024, role: 'harmony', minIntensity: 0, pan: 0 },
    // 弦（のばし → 7・8ふしめは ふしを 1オクターブ 下で）
    { i: 'strings', v: 0.034, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // ブラスの 和音（前半の ふしの 楽器が いっしょに）
    { i: 'brass', v: 0.032, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:8 G5:4! B5:4',
      bassLine(Q2.intro, ['1:4! 5:4 8:4 5:4', '1:4! 5:4 1:4! 5:4'], { lo: 36 }),
      star(2),
      pad(Q2.intro, { center: 62 }),
      comp(Q2.intro, ['x:4! r:4 x:4 r:4', 'x:2! r:2 x:2 r:2 x:2! r:2 x:4'], { center: 65 }),
      drums(2, 'k:4! h:2 h:2 s:4 h:2 k:2', { last: 'k:2! k:2 s:2 s:2 s:1 s:1 t:1 t:1 th:2 c:2!' }),
    ],
    S: [
      bars(SONG_ALL.slice(0, 4).flat()),
      bassLine(Q2.S, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      `${star(4)} ${star(4)} ${star(4)} ${star(4)}`,
      pad(Q2.S, { center: 62 }),
      comp(Q2.S, 'r:4 x:2! r:2 r:4 x:2 r:2', { center: 65 }),
      phraseDr(4, { first: 'c:4! h:2 h:2 s:4 h:2 k:2' }),
    ],
    T: [
      bars(SONG_ALL.slice(4, 8).flat()),
      bassLine(Q2.T, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      `${star(4)} ${star(4)} ${star(4)} ${star(4)}`,
      `${pad(Q2.T.slice(0, 8), { center: 62 })} ${bars(SONG_ALL.slice(6, 8).flat().map((b) => shift(b, -12)))}`,
      comp(Q2.T, 'x:2! r:2 x:2 r:2 r:4 x:4', { center: 65 }),
      phraseDr(4, { first: 'c:4! h:2 h:2 s:4 h:2 k:2' }),
    ],
  },
  form: ['intro', 'S', 'T'],
  loopFrom: 1,
  phases: [1, 1.04, 1.08, 1.12].map((tempo) => ({ transpose: 0, tempo })),
  // ピンチ: ハープの 16分（ドと 星の ソ）
  pinch: { n: Array.from({ length: 8 }, () => 'C6:1 G6:1').join(' '), i: 'pluck', v: 0.03 },
};

// ═════════════ c11d_lamps: みんなのランプのお祭り（ニ長調 104）═════════════
// 名前の ランプを ともす 日（月の都の 広場）。しまわれて いた ランプが 全部 もどる。あたたかい お祭り。
//   おもて通りの ふし（c11b_front。琴の はじく 音）と うら通りの ふし（c11b_back ＝ おもてを 鏡で うら返した ふし。笛）を いっしょに 鳴らす
//   （長さは 同じ・上がり下がりが 逆。2つの 間は いつも 偶数の 半音 ＝ 半音で ぶつからない）。和音は 2つの ふしが どちらも 入る 物に
//   えらび直した（A7 など）。イントロは ランプ（オルゴール）が 1小節に 6つ ずつ、2小節とも ぜんぶ ともる。
//   A（おもて A ＋ うら A）→ B（おもて B ＋ うら B）→ A2（さいごは ラ と シ が D6 の 和音で そろう）
const LP = {
  intro: ['D', 'A'],
  A: ['D', 'A', 'Bm', 'A7', 'G A7', 'Bm', 'A7 Em', 'A7'],
  B: ['A7 D', 'A7', 'Bm7 A7', 'Bm7', 'A7', 'A7', 'D', 'A7'],
  A2: ['D', 'A', 'Bm', 'A7', 'G A7', 'Bm', 'A7', 'D'],
};
// ランプ（c11b_plaza の 6つ）
const LAMPS6 = '0:2 1:2 2:2 3:2 4:2 5:2 r:4';
const LAMP_DR = 'k:2! sh:2 R:2 sh:2 k:2 k:2 R:2 sh:2';
const LAMP_PAIR = { A: ['frontA', 'backA'], B: ['frontB', 'backB'], A2: ['frontA2', 'backA2'] };

const c11dLamps = {
  bpm: 104, bar: 16, reverb: 0.38, fill: 0, night: {},
  parts: [
    // おもて通りの ふし（琴）
    { i: 'pluck', v: 0.19, role: 'lead' },
    { i: 'bass', v: 0.2, role: 'bass' },
    // うら通りの ふし（笛）
    { i: 'flute', v: 0.085, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // ランプ
    { i: 'musicbox', v: 0.036, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: [
      C11B_LINES.frontIntro,
      bassLine(LP.intro, '1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2', { lo: 38, ...S }),
      C11B_LINES.backIntro,
      pad(LP.intro, { center: 57, mods: '?', ...S }),
      arp(LP.intro, LAMPS6, { center: 80, ...S }),
      drums(2, 'k:2! r:6 R:2 sh:2 R:2 sh:2', { last: 'k:2! sh:2 R:2 sh:2 k:2 R:2 R:2 R:2' }),
    ],
    ...Object.fromEntries(Object.entries(LAMP_PAIR).map(([nm, [fk, bk]]) => [nm, [
      bars(C11B_LINES[fk]),
      bassLine(LP[nm], nm === 'A2'
        ? [...Array(7).fill('1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2'), '1:2! r:2 5:2 r:2 1:4! r:4']
        : '1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2', { lo: 38, ...S }),
      bars(C11B_LINES[bk]),
      pad(LP[nm], { center: 57, mods: nm === 'B' ? '' : '?', ...S }),
      arp(LP[nm], nm === 'B' ? ['r:6 4:2? r:6 3:2?', 'r:2 5:2? r:4 r:6 4:2?'] : ['r:6 4:2? r:8', 'r:16'], { center: 80, ...S }),
      drums(8, LAMP_DR, nm === 'A2'
        ? { first: 'c:2! sh:2 R:2 sh:2 k:2 k:2 R:2 sh:2', last: 'k:2! sh:2 R:2 sh:2 k:4! r:4' }
        : { last: 'k:2! sh:2 R:2 R:2 k:2 R:2 R:2 R:2' }),
    ]])),
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11d_end: 空と地上をむすぶ橋（ハ長調。くり返さない）═════════════
// 第3部の おわり。星の橋が さいごまで かかり、スピカが えらぶ 道・題の 画面。77.9 秒。
//   第2章の 橋（c10d_bridge）は 7ふしめの さいごの ド の 手前（シ）で 止まった。こんどは その つづきで、スピカの歌を 8ふし さいごまで。
//   intro（90。ベルが 8つの 音〈レ〜ド・高い レ〉を しずかに のぼる）→ s12 1・2ふしめ（108。笛と ハープだけ・しずか）
//   → s34 3・4ふしめ（＋ 弦）→ s56 5・6ふしめ（＋ たいこ。大きく 広がる）→ s7 7ふしめ（いちばん 大きい。さいごの ド まで 行く。
//   弦が 1オクターブ 下で いっしょに）→ s8 8ふしめ（96。やさしく）→ outro（80。ドの 和音で しずかに おわる）
const EN = {
  intro: ['C'],
  s12: SONG_ALL_CHORDS.slice(0, 2).flat(),
  s34: SONG_ALL_CHORDS.slice(2, 4).flat(),
  s56: SONG_ALL_CHORDS.slice(4, 6).flat(),
  s7: SONG_ALL_CHORDS[6],
  s8: SONG_ALL_CHORDS[7],
  outro: ['C'],
};
export const END_BPM = { intro: 90, s12: 108, s34: 108, s56: 108, s7: 108, s8: 96, outro: 80 };
const echoBell = (phrases) => phrases.map((ph) => `r:16 r:16 r:16 r:8 ${shift(`${ph[3].trim().split(/\s+/).find((t) => !t.startsWith('r:')).split(':')[0]}:8`, 12)}?`).join(' ');
const HARP = '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2';

const c11dEnd = {
  bpm: 108, bar: 16, once: true, reverb: 0.5, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'sub_bass', v: 0.15, role: 'bass' },
    { i: 'strings', v: 0.034, role: 'harmony', minIntensity: 0, pan: -0.2 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    // 8つの 音が しずかに のぼる（7つの 星の音 ＋ 高い レ）
    intro: { bpm: END_BPM.intro, ch: [
      'r:16',
      bassLine(EN.intro, '1:16', { lo: 36 }),
      rest(1),
      arp(EN.intro, '0:4? 1:4? 2:4? 3:4?', { center: 64 }),
      `${['D6', 'E6', 'F6', 'G6', 'A6', 'B6', 'C7'].map((n) => `${n}:2?`).join(' ')} ${EIGHTH_NOTE}:2?`,
      'r:16',
    ] },
    // しずか（笛と ハープ）
    s12: { bpm: END_BPM.s12, ch: [
      bars(SONG_ALL.slice(0, 2).flat()),
      bassLine(EN.s12, '1:16', { lo: 36 }),
      rest(8),
      arp(EN.s12, HARP, { center: 64 }),
      echoBell(SONG_ALL.slice(0, 2)),
      rest(8),
    ] },
    // ＋ 弦
    s34: { bpm: END_BPM.s34, ch: [
      bars(SONG_ALL.slice(2, 4).flat()),
      bassLine(EN.s34, '1:8! 5:8', { lo: 36 }),
      pad(EN.s34, { center: 62, mods: '?' }),
      arp(EN.s34, HARP, { center: 64 }),
      echoBell(SONG_ALL.slice(2, 4)),
      drums(8, 'r:16', { last: 'r:12 tl:2? tl:2' }),
    ] },
    // 大きく 広がる（＋ たいこ）
    s56: { bpm: END_BPM.s56, ch: [
      bars(SONG_ALL.slice(4, 6).flat()),
      bassLine(EN.s56, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      pad(EN.s56, { center: 64 }),
      arp(EN.s56, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 66 }),
      echoBell(SONG_ALL.slice(4, 6)),
      drums(8, 'k:4! r:4 tl:4 r:4', { first: 'c:4! r:4 tl:4 k:4', last: 'k:4! r:4 tl:2 tl:2 t:2 th:2' }),
    ] },
    // 7ふしめ（みんなで。さいごの ド まで）
    s7: { bpm: END_BPM.s7, ch: [
      bars(SONG_ALL[6]),
      bassLine(EN.s7, ['1:4! 5:4 8:4 5:4', '1:4! 5:4 8:4 5:4', '1:4! 5:4 1:4! 5:4', '1:16!'], { lo: 36 }),
      bars(SONG_ALL[6].map((b) => shift(b, -12))),
      arp(EN.s7, ['0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 5:2 6:2 7:2'], { center: 64 }),
      bars(['G6:4? r:12', 'r:16', 'r:16', 'C7:8! r:8']),
      drums(4, 'k:4! r:4 tl:4? r:4', { first: 'c:4! r:4 tl:4? r:4', last: 'c:4! r:4 tl:4? r:4' }),
    ] },
    // 8ふしめ（やさしく）
    s8: { bpm: END_BPM.s8, ch: [
      bars(SONG_ALL[7]),
      bassLine(EN.s8, ['1:8! 5:8', '1:8! 5:8', '1:8! 5:8', '1:8! 1:8'], { lo: 36 }),
      pad(EN.s8, { center: 62 }),
      arp(EN.s8, HARP, { center: 64 }),
      bars(['r:16', `r:8 ${EIGHTH_NOTE}:8?`, 'r:16', 'r:8 C7:8?']),
      drums(4, 'tl:4? r:12', { last: 'tl:4? r:12' }),
    ] },
    // しずかに おわる
    outro: { bpm: END_BPM.outro, ch: [
      'C6:12 r:4',
      bassLine(EN.outro, '1:16', { lo: 36 }),
      pad(EN.outro, { center: 62, mods: '?' }),
      arp(EN.outro, '0:2? 1:2? 2:2? 3:2? 4:4? r:4', { center: 64 }),
      'r:4 E6:4? G6:4? C7:4?',
      'r:16',
    ] },
  },
  form: ['intro', 's12', 's34', 's56', 's7', 's8', 'outro'],
};

for (const tr of [c11dScale, c11dTower, c11dDuo, c11dQueen, c11dEight, c11dQueen2, c11dLamps, c11dEnd]) tr.ch = oldView(tr);
// 前の音: 塔は たいこが 2つ 重なるので 小さめに（われない ように）
c11dTower.ch = c11dTower.ch.map((ch) => ({ ...ch, v: Math.round(ch.v * (ch.drums ? 0.55 : 0.75) * 1000) / 1000 }));

// テストが 見る ふし・和音
export const C11D_LINES = {
  scaleA: SCALE_A, scaleB: SCALE_B, towerA: TOWER_A, towerB: TOWER_B, towerC: TOWER_C,
  queenA: QUEEN_A, queenB: QUEEN_B, queenC: QUEEN_C, queenA2: QUEEN_A2, bridgeLast: BRIDGE_LAST,
};
export const C11D_CHORDS = { scale: SC, tower: TW, duo: DU, queen: QN, eight: EI, queen2: Q2, lamps: LP, end: EN };

// 曲の id は docs/plan-part3-c11d.md の 20-6（かえない）
export const C11D_TRACKS = {
  c11d_scale: c11dScale,
  c11d_tower: c11dTower,
  c11d_duo: c11dDuo,
  c11d_queen: c11dQueen,
  c11d_eight: c11dEight,
  c11d_queen2: c11dQueen2,
  c11d_lamps: c11dLamps,
  c11d_end: c11dEnd,
};
export const C11D_IDS = Object.keys(C11D_TRACKS);
