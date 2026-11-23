// 第102回 F: 第3部 第3章 第2幕「月の都と、名前のランプ」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3-c11b.md の「実装メモ（第3章 第2幕 F班）」。
// 曲は すべて オリジナル（もとの 昔話や ほかの 作品の 曲を 借りて いない。和の ひびきは 楽器の 色〈はじく 音 ＝ 琴・
//   オルガンの のばし ＝ 笙〉と 音の ならび〈ニ短調に ミb を まぜた 形〉だけで、古い 曲の ふしは 使って いない）。
//   c11b_call は スピカの歌（c9d_song）の 1ふしめの はじめの 3つの 音（ミ・ソ・ラ）を 使う。
//
// ・c11b_front … 月の都のおもて通り（ニ長調 112。はじく 音〈琴〉の ふし・オルガンの のばし〈笙〉・ベルの きらきら。
//     拍は きっちり〈ベースは 8分の スタッカート・リムは 2拍めと 4拍め〉。明るいが あたたかく ない）
// ・c11b_back … うら通りのランプ（ロ短調 92。おもての ふしを ミ〈と シb〉を 鏡に して うら返した 形 ＝ 上がり下がりが 逆。
//     ニ長調の 音の ならびは 鏡で そのまま なので、ニ長調 ↔ ロ短調・和音も D ↔ Bm・G ↔ F#m・A ↔ Em に 入れかわる。
//     笛・ハープ・弦・オルゴールの ランプ・シェイカー。小さく あたたかい 夜）
// ・c11b_tower … おもてとうらの塔（ホ短調 88。考える 曲。画面の 状態 sideStage〈0 おもて・1 うら〉で 曲の だん 0・1:
//     0 … マリンバの ふし・ベルの 8分・リムと ハット（かたい）   1 … 笛の ふし・弦の のばし・シェイカーと タム（やわらかい）。
//     ふし・ベース・形・調・テンポは 同じ。かわると 次の 小節から その 方の イントロへ）
// ・c11b_plaza … 名前のランプの広場（ト長調 88。13.6 秒。くり返さない。ベルの ランプが 1小節に 6つ ずつ ならぶ →
//     さいごの 小節だけ 5つ〈いちばん 上の 1つが ない〉。ふしは ト長調の 和音の 3度で おわる）
// ・c11b_call … 名前をよぶ声（ハ長調 132。1.8 秒。くり返さない。スピカの歌の はじめの 3つの 音〈ミ・ソ・ラ〉＋ ベルの こだま）
// ・c11b_keeper … ひかってかげって（イ長調 ⇔ イ短調 152。中ボス。4小節ごとに 明るい〈イ長調・高い・ベルの 16分〉と
//     暗い〈イ短調・低い・弦の のばし〉が かわる。かわる 前の 小節に フィル〈前ぶれ〉）
// ・c11b_oboro … しずかな月の雲（ニ短調 80。幕の ボス。笛の 長い 音・琴の 8分・笙の のばし・タムの こどう。
//     A → B〈せまる。ベースが 4分〉→ C〈しずかに こわい〉。ボスの だんで テンポだけ 上がる〈1.15・1.25・1.3 倍。調は かえない〉。
//     ピンチは 琴の 16分）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは audio-c9a.js と 同じ 小さな 道具（C9A_TOOLS）で 作る
import { C9A_TOOLS } from './audio-c9a.js?v=dc7c9b067c89';
import { C9C_TOOLS } from './audio-c9c.js?v=dc7c9b067c89';
import { C9D_SONG } from './audio-c9d.js?v=dc7c9b067c89';

const { SHARP, FLAT, bassLine, comp, arp, pad, drums, rest, bars, oldView } = C9A_TOOLS;
const { mirror } = C9C_TOOLS;
const F = { sp: FLAT };
const S = { sp: SHARP };

// ───────────── うら返す（鏡）─────────────
// 音 m → MIRROR_SUM - m。MIRROR_SUM を 12 で わった あまりが 8（ミ＋ミ ＝ シb＋シb）なので、ニ長調の 音の ならび
//   （レ ミ ファ# ソ ラ シ ド#）は 鏡に うつしても 同じ ならび（ミ・シb を 中心に 左右が そろって いる）。
//   和音も ニ長調の 中で うつる: D ↔ Bm・G ↔ F#m・A ↔ Em（長調 ↔ 短調）。164 は 1オクターブ 上げて 高さを そろえた 値（中心 シb5）
export const MIRROR_SUM = 164;
const PCS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
// 和音（長・短の 3和音）を 鏡に うつす（'D' → 'Bm'）
export function invChord(sym) {
  const m = /^([A-G][#b]?)(m?)$/.exec(sym);
  if (!m) throw new Error(`c11b chord: ${sym}`);
  const r = PCS[m[1]];
  const pcs = (m[2] ? [0, 3, 7] : [0, 4, 7]).map((x) => (r + x) % 12);
  const inv = new Set(pcs.map((p) => (((MIRROR_SUM - p) % 12) + 12) % 12));
  for (let root = 0; root < 12; root++) {
    for (const [q, iv] of [['', [0, 4, 7]], ['m', [0, 3, 7]]]) {
      if (iv.every((x) => inv.has((root + x) % 12))) return `${SHARP[root]}${q}`;
    }
  }
  throw new Error(`c11b inv: ${sym}`);
}
const invBar = (bar) => bar.trim().split(/\s+/).map(invChord).join(' ');
const invProg = (prog) => prog.map(invBar);

// ═════════════ c11b_front: 月の都のおもて通り（ニ長調 112）═════════════
// 明るく ととのった 町。ていねいで つめたい。はじく 音（琴の ような）の ふしは 4分と 付点で きっちり。
//   A ととのった 通り → B 少し 高く（宮の 方へ）→ A2（さいごは ラ ＝ 主和音の 5度。とじない 冷たさ）
const FR = {
  intro: ['D', 'A'],
  A: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'Em', 'A'],
  B: ['G', 'A', 'F#m', 'Bm', 'Em', 'A', 'D', 'A'],
  A2: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'Em A', 'D'],
};
const FRONT_INTRO = 'r:16 r:8 A5:4 C#6:4';
const FRONT_A = [
  'D6:4! A5:4 F#5:4 A5:4', 'E6:6! C#6:2 A5:8', 'D6:4! B5:4 F#5:4 B5:4', 'C#6:8! A5:8',
  'B5:4! D6:4 G5:4 B5:4', 'A5:6! F#5:2 D5:8', 'G5:4! B5:4 E6:4 D6:4', 'C#6:12! r:4',
];
const FRONT_B = [
  'B5:4! C#6:4 D6:4 E6:4', 'E6:8! C#6:4 A5:4', 'A5:4! B5:4 C#6:4 A5:4', 'B5:12! r:4',
  'G5:4! A5:4 B5:4 G5:4', 'C#6:4! E6:4 A5:8', 'F#5:4! A5:4 D6:4 F#5:4', 'E5:8! C#6:8',
];
const FRONT_A2 = [...FRONT_A.slice(0, 6), 'G5:4! B5:4 E6:4 C#6:4', 'A5:12! r:4'];
// きっちり した 拍（キック・ハット・リムは 2拍めと 4拍め）
const FRONT_DR = 'k:2! h:2 R:2 h:2 k:2 h:2 R:2 h:2';

const c11bFront = {
  bpm: 112, bar: 16, reverb: 0.3, fill: 0, night: {},
  parts: [
    // 琴の ような はじく 音の ふし
    { i: 'pluck', v: 0.21, role: 'lead' },
    { i: 'bass', v: 0.22, role: 'bass' },
    // 笙の ような のばし
    { i: 'organ', v: 0.036, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // つめたい きらきら
    { i: 'bell', v: 0.055, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      FRONT_INTRO,
      bassLine(FR.intro, '1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2', { lo: 38, ...S }),
      pad(FR.intro, { center: 67, mods: '?', ...S }),
      arp(FR.intro, 'r:2 2:2? r:2 1:2? r:2 2:2? r:2 3:2?', { center: 81, ...S }),
      drums(2, 'r:4 R:2? r:6 R:2? r:2', { last: 'r:4 R:2? r:2 h:2 h:2 R:2 h:2' }),
    ],
    A: [
      bars(FRONT_A),
      bassLine(FR.A, '1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2', { lo: 38, ...S }),
      pad(FR.A, { center: 67, mods: '?', ...S }),
      arp(FR.A, 'r:2 2:2? r:2 1:2? r:2 2:2? r:2 3:2?', { center: 81, ...S }),
      drums(8, FRONT_DR, { last: 'k:2! h:2 R:2 h:2 k:2 R:2 R:2 R:2' }),
    ],
    // 少し 高く
    B: [
      bars(FRONT_B),
      bassLine(FR.B, '1:2! r:2 1:2 r:2 5:2! r:2 8:2 r:2', { lo: 38, ...S }),
      pad(FR.B, { center: 69, ...S }),
      arp(FR.B, 'r:2 3:2? r:2 2:2? r:2 1:2? r:2 2:2?', { center: 81, ...S }),
      drums(8, FRONT_DR, { last: 'k:2! R:2 R:2 R:2 k:2 h:2 R:2! r:2' }),
    ],
    A2: [
      bars(FRONT_A2),
      bassLine(FR.A2, [...Array(7).fill('1:2! r:2 5:2 r:2 1:2! r:2 5:2 r:2'), '1:2! r:2 5:2 r:2 1:4! r:4'], { lo: 38, ...S }),
      pad(FR.A2, { center: 67, mods: '?', ...S }),
      arp(FR.A2, 'r:2 2:2? r:2 1:2? r:2 2:2? r:2 3:2?', { center: 81, ...S }),
      drums(8, FRONT_DR, { first: 'c:2! h:2 R:2 h:2 k:2 h:2 R:2 h:2', last: 'k:2! h:2 R:2 h:2 k:4! r:4' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11b_back: うら通りのランプ（ロ短調 92）═════════════
// 光の 弱い 星たちが かくれて くらす 町。おもての ふしを 鏡で うら返した 形（長さは 同じ・上がり下がりが 逆・ニ長調 → ロ短調）。
//   和音も 鏡（D → Bm・A → Em・G → F#m …）。小さく あたたかい 夜の ランプ。さびしく しすぎない（ゆっくり・笛・ハープ）
const BK = {
  intro: invProg(FR.intro),
  A: invProg(FR.A),
  B: invProg(FR.B),
  A2: invProg(FR.A2),
};
const inv = (list) => list.map((b) => mirror(b, MIRROR_SUM));
const BACK_INTRO = mirror(FRONT_INTRO, MIRROR_SUM);
const BACK_A = inv(FRONT_A);
const BACK_B = inv(FRONT_B);
const BACK_A2 = inv(FRONT_A2);
// ランプ（オルゴール。2小節に 1つ、強い 拍は さける）
const LAMP = ['r:6 4:2? r:8', 'r:16'];
const BACK_DR = 'sh:4? sh:2? sh:2? tl:4? sh:4?';

const c11bBack = {
  bpm: 92, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.14, role: 'bass' },
    // やわらかい ハープの 4分
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.026, role: 'harmony', minIntensity: 0, pan: 0.2 },
    // 夜の ランプ
    { i: 'musicbox', v: 0.035, role: 'harmony', minIntensity: 0, pan: 0.05 },
    { drums: true, v: 0.2, minIntensity: 0 },
  ],
  sections: {
    intro: [
      BACK_INTRO,
      bassLine(BK.intro, '1:8! 5:8', { lo: 38, ...S }),
      arp(BK.intro, '0:4 1:4 2:4 1:4', { center: 64, ...S }),
      pad(BK.intro, { center: 62, mods: '?', ...S }),
      arp(BK.intro, ['r:16', 'r:6 4:2? r:8'], { center: 80, ...S }),
      drums(2, 'r:16', { last: 'r:8 sh:4? sh:4?' }),
    ],
    A: [
      bars(BACK_A),
      bassLine(BK.A, '1:8! 5:8', { lo: 38, ...S }),
      arp(BK.A, '0:4 1:4 2:4 1:4', { center: 64, ...S }),
      pad(BK.A, { center: 62, mods: '?', ...S }),
      arp(BK.A, LAMP, { center: 80, ...S }),
      drums(8, BACK_DR),
    ],
    B: [
      bars(BACK_B),
      bassLine(BK.B, '1:8! 5:4 1:4', { lo: 38, ...S }),
      arp(BK.B, '0:4 2:4 1:4 2:4', { center: 64, ...S }),
      pad(BK.B, { center: 64, mods: '?', ...S }),
      arp(BK.B, ['r:6 4:2? r:8', 'r:6 3:2? r:4 5:2? r:2'], { center: 80, ...S }),
      drums(8, BACK_DR, { last: 'sh:4? tl:4? tl:4? sh:4?' }),
    ],
    A2: [
      bars(BACK_A2),
      bassLine(BK.A2, [...Array(7).fill('1:8! 5:8'), '1:16'], { lo: 38, ...S }),
      arp(BK.A2, '0:4 1:4 2:4 1:4', { center: 64, ...S }),
      pad(BK.A2, { center: 62, mods: '?', ...S }),
      arp(BK.A2, LAMP, { center: 80, ...S }),
      drums(8, BACK_DR, { first: 'tl:4? sh:2? sh:2? tl:4? sh:4?', last: 'tl:4? r:12' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
};

// ═════════════ c11b_tower: おもてとうらの塔（ホ短調 88）═════════════
// 名前の 塔。おもてと うらを 行き来する なぞを 考える 曲。ふし・ベース・形は 1つ。
//   だん 0（おもて）… マリンバの ふし・ベルの 8分（1・3・2・4 ＝ 考える きざみ）・キックと リムと ハット（かたい 音）
//   だん 1（うら）  … 笛の ふし・弦の のばし・シェイカーと 遠い タム（やわらかい 音）
//   A 問いかける → B 少し 高く → A2（ホで おわる）。かわると 次の 小節の 頭から その 方の イントロへ（調・テンポは かえない）
const TW = {
  intro: ['Em', 'B'],
  A: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'Am B', 'Em'],
  B: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'C', 'B'],
  A2: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'Am B', 'Em'],
};
const TOWER_INTRO = 'r:16 r:8 B4:4 D#5:4';
const TOWER_A = [
  'E5:4! G5:4 B5:6 r:2', 'C6:4! B5:4 G5:4 E5:4', 'A5:4! C6:4 E6:6 r:2', 'D#6:6! C6:2 B5:8',
  'G5:4! B5:4 E6:4 G6:4', 'G6:4! E6:4 C6:8', 'A5:4! C6:4 B5:4 D#6:4', 'E6:12! r:4',
];
const TOWER_B = [
  'E6:6! D6:2 C6:8', 'D6:6! E6:2 F#6:8', 'F#6:4! D6:4 B5:8', 'G5:4! B5:4 E6:8',
  'C6:4! E6:4 A6:8', 'F#6:6! E6:2 D6:8', 'E6:4! C6:4 G5:4 C6:4', 'B5:8! D#6:4 B5:4',
];
const TOWER_A2 = [...TOWER_A.slice(0, 7), 'B5:4! G5:4 E5:8'];
// 考える きざみ（ベル）・かたい たいこ
const THINK = '0:2 2:2 1:2 3:2 0:2 2:2 1:2 3:2';
const HARD_DR = 'k:4! h:2? h:2? R:4 h:2? h:2?';
const SOFT_DR = 'sh:4? sh:2? sh:2? tl:4? sh:4?';
// 1つの 区切りを おもて（かたい）か うら（やわらかい）で 書く。パートの じゅん: マリンバ・ベース・笛・ベル・弦・たいこ
function towerSec(prog, intro, mel, bassPat, { soft, n = prog.length, first, last } = {}) {
  const line = intro ? mel : bars(mel);
  return [
    soft ? rest(n) : line,
    bassLine(prog, bassPat, { lo: 40, ...S }),
    soft ? line : rest(n),
    soft ? rest(n) : arp(prog, intro ? ['r:16', THINK] : THINK, { center: 79, ...S }),
    soft ? pad(prog, { center: 64, mods: '?', ...S }) : rest(n),
    intro ? drums(n, 'r:16', { last: soft ? 'r:8 sh:4? tl:4?' : 'r:8 R:4 h:2? h:2?' })
      : drums(n, soft ? SOFT_DR : HARD_DR, { first: first?.[soft ? 1 : 0], last: last?.[soft ? 1 : 0] }),
  ];
}
const towerSections = {};
for (const soft of [false, true]) {
  const k = (nm) => (soft ? `u${nm}` : nm);
  towerSections[k('intro')] = towerSec(TW.intro, true, TOWER_INTRO, '1:16', { soft });
  towerSections[k('A')] = towerSec(TW.A, false, TOWER_A, '1:8! 5:8', { soft });
  towerSections[k('B')] = towerSec(TW.B, false, TOWER_B, '1:4! 5:4 1:4 5:4', { soft, last: ['k:4! h:2? R:2 R:4 tl:2? t:2?', 'sh:4? tl:4? tl:4? t:4?'] });
  towerSections[k('A2')] = towerSec(TW.A2, false, TOWER_A2, '1:8! 5:8', { soft, first: ['k:4! R:2 h:2? R:4 h:2? h:2?', 'tl:4? sh:2? sh:2? tl:4? sh:4?'], last: ['k:4! r:12', 'tl:4? r:12'] });
}
// だん（sideStage）: 0 おもて ・ 1 うら。うらの 形は おもての 形の 名前に u を つけた もの
export const TOWER_SIDE_FORM = ['uintro', 'uA', 'uB', 'uA2'];

const c11bTower = {
  bpm: 88, bar: 16, reverb: 0.4, fill: 0, night: {},
  parts: [
    // おもて: かたい 音
    { i: 'marimba', v: 0.09, role: 'lead' },
    { i: 'bass', v: 0.14, role: 'bass' },
    // うら: やわらかい 音（ふしは マリンバと 同じ）
    { i: 'flute', v: 0.1, role: 'harmony', minIntensity: 0, pan: 0 },
    { i: 'bell', v: 0.035, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.25 },
    { drums: true, v: 0.22, minIntensity: 0 },
  ],
  sections: towerSections,
  form: ['intro', 'A', 'B', 'A2'],
  loopFrom: 1,
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1, form: TOWER_SIDE_FORM, loopFrom: 1 },
  ],
};

// ═════════════ c11b_plaza: 名前のランプの広場（ト長調 88。くり返さない）═════════════
// 都の 星 みんなの 名前の ランプ。ベルの ランプが 1小節に 6つ ずつ 下から ともる（4小節）。
//   さいごの 小節は 5つで 止まる（いちばん 上の 1つが ない）。ふしは ト長調の 3度（シ）で そっと おわる（かなしく しすぎない）
const PL = ['G', 'Em', 'C', 'D', 'G'];
export const PLAZA_LAMPS = '0:2 1:2 2:2 3:2 4:2 5:2 r:4';
export const PLAZA_LAST = '0:2 1:2 2:2 3:2 4:2 r:6';
const PLAZA_MEL = ['B5:8! D6:4 G6:4', 'G6:8! E6:4 B5:4', 'C6:8! E6:4 G6:4', 'F#6:8! D6:4 A5:4', 'B5:12 r:4'];
const c11bPlaza = {
  bpm: 88, bar: 16, once: true, reverb: 0.5, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.13, role: 'bass' },
    // 名前の ランプ
    { i: 'bell', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { drums: true, v: 0.2, minIntensity: 0 },
  ],
  sections: {
    S: [
      bars(PLAZA_MEL),
      bassLine(PL, ['1:16', '1:16', '1:16', '1:8 5:8', '1:12 r:4'], { lo: 38, ...S }),
      `${arp(PL.slice(0, 4), PLAZA_LAMPS, { center: 78, ...S })} ${arp(PL.slice(4), PLAZA_LAST, { center: 78, ...S })}`,
      pad(PL, { center: 64, mods: '?', ...S }),
      drums(5, 'r:16', { first: 'tl:4? r:12', last: 'sh:4? r:12' }),
    ],
  },
  form: ['S'],
};

// ═════════════ c11b_call: 名前をよぶ声（ハ長調 132。くり返さない）═════════════
// 「よびかける」。スピカの歌の 1ふしめの はじめの 3つの 音（ミ・ソ・ラ。長さも 同じ 6・2 ＋ さいごを のばす）と ベルの こだま
export const CALL_NOTES = C9D_SONG.phrases[0][0].split(' ').slice(0, 3);
const CALL_LINE = [...CALL_NOTES.slice(0, 2), CALL_NOTES[2].replace(/:\d+/, ':8')].join(' ');
const c11bCall = {
  bpm: 132, bar: 16, once: true, reverb: 0.45, night: {},
  parts: [
    { i: 'flute', v: 0.11, role: 'lead' },
    { i: 'bass', v: 0.12, role: 'bass' },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.2 },
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { drums: true, v: 0.18, minIntensity: 0 },
  ],
  sections: {
    S: [
      CALL_LINE,
      'C3:16',
      'r:8 A6:4? E6:4?',
      pad(['C'], { center: 62, mods: '?', ...S }),
      'r:8 sh:2? r:6',
    ],
  },
  form: ['S'],
};

// ═════════════ c11b_keeper: ひかってかげって（イ長調 ⇔ イ短調 152）═════════════
// 大きな ランプを かかえた 番人（中ボス）。ランプは 明るい／暗いを くり返す。
//   どの 区切りも 4小節 明るい（イ長調。ふしが 高い・ベルの 8分・ハープの うら打ち）＋ 4小節 暗い（イ短調。ふしが 低い・弦の のばし・
//   ハープは 頭打ち）。かわる 前の 小節は たいこの フィル（前ぶれ）。きびきび
const KP = {
  intro: { bright: ['A'], dark: ['Am'] },
  A: { bright: ['A', 'D', 'E', 'A'], dark: ['Am', 'F', 'G', 'E'] },
  B: { bright: ['F#m', 'D', 'Bm', 'E'], dark: ['Dm', 'Am', 'F', 'E'] },
  C: { bright: ['Bm', 'E', 'A', 'E'], dark: ['F', 'G', 'Am', 'E'] },
};
KP.A2 = KP.A;
const KEEPER = {
  intro: ['r:16', 'r:8 E5:4! G#5:4'],
  A: [
    'A5:2! C#6:2 E6:2 A6:2 E6:4! C#6:4', 'F#6:4! D6:2 A5:2 D6:4! F#6:4', 'G#6:4! E6:2 B5:2 E6:4! G#6:4', 'A6:8! E6:4 C#6:4',
    'A5:4! C6:2 A5:2 E5:4! A5:4', 'F5:4! A5:2 F5:2 C6:4! A5:4', 'G5:4! B5:2 G5:2 D6:4! B5:4', 'G#5:4! B5:4 E6:4! D6:4',
  ],
  B: [
    'F#6:2! E6:2 C#6:2 A5:2 C#6:4! F#6:4', 'D6:4! F#6:4 A6:4! F#6:4', 'B5:2! D6:2 F#6:2 D6:2 B5:4! D6:4', 'E6:4! G#6:4 B5:4! E6:4',
    'D6:4! A5:2 F5:2 A5:4! D6:4', 'C6:4! A5:2 E5:2 A5:4! C6:4', 'A5:4! F5:2 C6:2 F5:4! A5:4', 'B5:4! G#5:4 E5:4! G#5:4',
  ],
  C: [
    'D6:4! B5:4 F#6:4! D6:4', 'E6:4! G#6:2 E6:2 B5:4! E6:4', 'C#6:2! E6:2 A6:4 E6:4! C#6:4', 'E6:4! B5:4 G#5:4! B5:4',
    'C6:4! A5:2 F5:2 C6:4! F6:4', 'D6:4! B5:2 G5:2 D6:4! G5:4', 'E6:4! C6:2 A5:2 E6:4! A5:4', 'B5:4! E6:4 G#5:4! E5:4',
  ],
};
KEEPER.A2 = [...KEEPER.A.slice(0, 7), 'B5:4! E6:4 G#5:4! E5:4'];
// 明るい 4小節・暗い 4小節
const BRIGHT_DR = 'k:2! h:2 s:2 h:2 k:2 k:2 s:2 o:2?';
const DARK_DR = 'k:4! tl:2? r:2 k:2 k:2 tl:4?';
const TO_DARK = 'k:2! s:1 s:1 s:2 s:1 s:1 tl:2 tl:2 th:2 tl:2';
const TO_BRIGHT = 'k:2! tl:2 tl:2 t:2 t:2 th:2 th:2 c:2!';
export const KEEPER_BLOCK = 4;
function keeperSec(nm, { first } = {}) {
  const { bright, dark } = KP[nm];
  const n = bright.length;
  if (nm === 'intro') {
    return [
      bars(KEEPER.intro),
      `${bassLine(bright, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 33, ...S })} ${bassLine(dark, '1:4! 1:2 1:2 1:4! 5:2 1:2', { lo: 33, ...S })}`,
      `${arp(bright, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 1:2', { center: 84, ...S })} ${rest(1)}`,
      `${rest(1)} ${pad(dark, { center: 57, ...S })}`,
      `${comp(bright, 'r:2 x:2 r:2 x:2 r:2 x:2 r:2 x:2', { center: 67, ...S })} ${comp(dark, 'x:2! r:6 x:2 r:2 x:2 r:2', { center: 60, ...S })}`,
      `c:2! h:2 s:2 h:2 k:2 k:2 s:2 h:2 ${TO_DARK}`,
    ];
  }
  return [
    bars(KEEPER[nm]),
    `${bassLine(bright, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 33, ...S })} ${bassLine(dark, '1:4! 1:2 1:2 1:4! 5:2 1:2', { lo: 33, ...S })}`,
    // ベル: 明るい 間だけ（光る ランプ）
    `${arp(bright, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 1:2', { center: 84, ...S })} ${rest(n)}`,
    // 弦: 暗い 間だけ（低い のばし）
    `${rest(n)} ${pad(dark, { center: 57, ...S })}`,
    `${comp(bright, 'r:2 x:2 r:2 x:2 r:2 x:2 r:2 x:2', { center: 67, ...S })} ${comp(dark, 'x:2! r:6 x:2 r:2 x:2 r:2', { center: 60, ...S })}`,
    `${drums(n, BRIGHT_DR, { first, last: TO_DARK })} ${drums(n, DARK_DR, { last: TO_BRIGHT })}`,
  ];
}
const c11bKeeper = {
  bpm: 152, bar: 16, reverb: 0.26, fill: 0, night: {},
  parts: [
    { i: 'brass', v: 0.065, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    // 明るい 間の ランプ
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // 暗い 間の のばし
    { i: 'strings', v: 0.032, role: 'harmony', minIntensity: 0, pan: -0.25 },
    { i: 'pluck', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: keeperSec('intro'),
    A: keeperSec('A'),
    B: keeperSec('B'),
    C: keeperSec('C'),
    A2: keeperSec('A2', { first: 'c:2! h:2 s:2 h:2 k:2 k:2 s:2 o:2?' }),
  },
  form: ['intro', 'A', 'B', 'C', 'A2'],
  loopFrom: 1,
  // ピンチ: ランプの 明かりが 16分で またたく（ラと ミ）
  pinch: { n: Array.from({ length: 8 }, () => 'A6:1 E6:1').join(' '), i: 'bell', v: 0.03 },
};

// ═════════════ c11b_oboro: しずかな月の雲（ニ短調 80）═════════════
// 雲の 車に 乗った、ていねいで つめたい 使い（幕の ボス）。しずかで こわい・うつくしい。はげしく たたかない。
//   笛（長い 音）・琴（はじく 音の 8分）・笙（オルガンの のばし）・ベルの 冷たい ひかり・タムの こどう。
//   ふしは ニ短調に ミb（ナポリの 和音 Eb）を まぜた 雅な 色。古い 曲の ふしは 使って いない。
//   A しずかに あらわれる → B せまる（ベースが 4分・こどうが 近く）→ C しずかに こわい（長い 音・ラの 和音で とまる）
//   ボスの だんで テンポだけ 上がる（ゆっくり せまって いた ものが 速く なる）。ピンチは 琴の 16分
const OB = {
  intro: ['Dm', 'Dsus4'],
  A: ['Dm', 'Eb', 'Gm', 'Dsus4', 'Bb', 'Eb', 'Gm', 'Dm'],
  B: ['Gm', 'Eb', 'Bb', 'Dsus4', 'Gm', 'Eb', 'Bb', 'A'],
  C: ['Dm', 'Dm', 'Eb', 'Eb', 'Gm', 'Gm', 'A', 'A'],
};
const OBORO_A = [
  'A5:8! r:2 Bb5:2 A5:4', 'G5:8! Bb5:4 Eb6:4', 'D6:6! Eb6:2 D6:8', 'A5:12! r:4',
  'F5:8! Bb5:4 D6:4', 'Eb6:6! D6:2 Bb5:8', 'G5:4! A5:4 Bb5:4 D6:4', 'D6:12! r:4',
];
const OBORO_B = [
  'D6:4! Eb6:4 G6:8!', 'G6:6! F6:2 Eb6:8', 'F6:4! D6:4 Bb5:8', 'A5:4! D6:4 G6:8',
  'D6:8! G6:4 A6:4', 'G6:8! Eb6:4 Bb5:4', 'F6:6! Eb6:2 D6:8', 'C#6:8! E6:4 A5:4',
];
const OBORO_C = [
  'A5:16!', 'D6:8! A5:8', 'G5:16!', 'Bb5:8! G5:8',
  'D6:16!', 'Bb5:8! D6:8', 'E6:16!', 'C#6:12! r:4',
];
// 琴（はじく 音）
const KOTO_A = 'r:4 0:2? 1:2? 2:4 r:4';
const KOTO_B = '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2';
const KOTO_C = ['r:8 2:2? 1:2? 0:4?', 'r:8 3:2? 2:2? 1:4?'];
export const OBORO_TEMPOS = [1, 1.15, 1.25, 1.3];
const c11bOboro = {
  bpm: 80, bar: 16, reverb: 0.55, fill: 0, night: {},
  parts: [
    // 笛（長い 音）
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.16, role: 'bass' },
    // 笙の ような のばし
    { i: 'organ', v: 0.022, role: 'harmony', minIntensity: 0, pan: -0.2 },
    // 琴の ような はじく 音
    { i: 'pluck', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.25 },
    // 冷たい 月の ひかり
    { i: 'bell', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:12 D6:4',
      bassLine(OB.intro, '1:16', { lo: 38, ...F }),
      pad(OB.intro, { center: 67, mods: '?', ...F }),
      arp(OB.intro, ['r:16', KOTO_A], { center: 69, ...F }),
      arp(OB.intro, ['r:12 4:2? r:2', 'r:16'], { center: 81, ...F }),
      drums(2, 'tl:4! r:12', { last: 'tl:4! r:4 tl:2? r:6' }),
    ],
    // しずかに あらわれる
    A: [
      bars(OBORO_A),
      bassLine(OB.A, '1:8! r:4 1:4', { lo: 38, ...F }),
      pad(OB.A, { center: 67, mods: '?', ...F }),
      arp(OB.A, KOTO_A, { center: 69, ...F }),
      arp(OB.A, ['r:12 4:2? r:2', 'r:16'], { center: 81, ...F }),
      drums(8, 'tl:4! r:4 tl:2? r:6', { last: 'tl:4! r:4 tl:2? R:2? tl:2? R:2?' }),
    ],
    // せまる
    B: [
      bars(OBORO_B),
      bassLine(OB.B, '1:4! 1:4 1:4 1:4', { lo: 38, ...F }),
      pad(OB.B, { center: 67, ...F }),
      arp(OB.B, KOTO_B, { center: 69, ...F }),
      arp(OB.B, ['r:12 4:2? r:2', 'r:4 5:2? r:10'], { center: 81, ...F }),
      drums(8, 'tl:4! R:4? tl:4 R:4?', { last: 'tl:2! tl:2 R:2? tl:2 t:2? t:2? th:2? th:2?' }),
    ],
    // しずかに こわい
    C: [
      bars(OBORO_C),
      bassLine(OB.C, '1:16', { lo: 38, ...F }),
      pad(OB.C, { center: 65, mods: '?', ...F }),
      arp(OB.C, KOTO_C, { center: 69, ...F }),
      arp(OB.C, ['r:16', 'r:8 4:2? r:6'], { center: 81, ...F }),
      drums(8, ['tl:2! tl:2? r:12', 'tl:2! tl:2? r:4 R:2? r:6'], { last: 'tl:2! tl:2? R:2? tl:2? tl:2 tl:2 t:2 th:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C'],
  loopFrom: 1,
  // ボスの だん: テンポだけ 上がる（調は かえない）
  phases: OBORO_TEMPOS.map((tempo) => ({ transpose: 0, tempo })),
  // ピンチ: 琴の 16分（レと ラ）
  pinch: { n: Array.from({ length: 8 }, () => 'D6:1 A5:1').join(' '), i: 'pluck', v: 0.03 },
};

for (const tr of [c11bFront, c11bBack, c11bTower, c11bPlaza, c11bCall, c11bKeeper, c11bOboro]) tr.ch = oldView(tr);

// テストが 見る ふし・和音
export const C11B_LINES = {
  frontIntro: FRONT_INTRO, frontA: FRONT_A, frontB: FRONT_B, frontA2: FRONT_A2,
  backIntro: BACK_INTRO, backA: BACK_A, backB: BACK_B, backA2: BACK_A2,
  towerA: TOWER_A, plaza: PLAZA_MEL, call: CALL_LINE, keeper: KEEPER, oboroA: OBORO_A,
};
export const C11B_CHORDS = { front: FR, back: BK, keeper: KP };

// 曲の id は docs/plan-part3-c11b.md の 18-5（かえない）
export const C11B_TRACKS = {
  c11b_front: c11bFront,
  c11b_back: c11bBack,
  c11b_tower: c11bTower,
  c11b_plaza: c11bPlaza,
  c11b_call: c11bCall,
  c11b_keeper: c11bKeeper,
  c11b_oboro: c11bOboro,
};
export const C11B_IDS = Object.keys(C11B_TRACKS);
