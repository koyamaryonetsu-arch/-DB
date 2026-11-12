// 第77回 B: 作りなおした 曲 その1（戦闘・ボス・勝利）。audio.js が 前の 曲の 上に かぶせる。
// 前の データは audio.js が 自動で legacy（前の音）と ch（古い テスト用）に のこす。書き方は docs/plan-r77-audio.md の 2
// 第77回 B1: battle（第1部）・battle2（第2部）・battle_strong（強敵）・boss・victory。くわしくは docs/plan-r77-audio-b1.md
//
// ベース・和音・アルペジオは 「和音の ならび」と 「1小節の 型」から 作る（下の 小さな 道具）。メロディと たいこは そのまま 書く。
//   型の 中の 字: L = 和音の 根音（低い）・H = その 1オクターブ上・F = 5度上・X = 和音（[..]）・Y = 和音の 上の 2音（かるい）・0〜3 = 和音の 音（アルペジオ。3 = 0 の 1オクターブ上）
//   和音の ならびで ['C', 'D'] と 書くと 1小節を 半分ずつ（型の 音が 小節の まん中を またぐ ときは 2つに 分ける）

const SEMI = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const midi = (n) => {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(n);
  return SEMI[m[1]] + 12 * (Number(m[2]) + 1);
};
const nm = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const up = (n, s) => nm(midi(n) + s);

// 和音: b = ベースの 根音・v = 和音の 音（まん中の 高さ）
const CHORDS = {
  Em: { b: 'E2', v: ['B3', 'E4', 'G4'] },
  C: { b: 'C2', v: ['C4', 'E4', 'G4'] },
  D: { b: 'D2', v: ['D4', 'F#4', 'A4'] },
  B7: { b: 'B1', v: ['B3', 'D#4', 'F#4', 'A4'] },
  B: { b: 'B1', v: ['B3', 'D#4', 'F#4'] },
  Am: { b: 'A1', v: ['C4', 'E4', 'A4'] },
  Bm: { b: 'B1', v: ['B3', 'D4', 'F#4'] },
  G: { b: 'G1', v: ['B3', 'D4', 'G4'] },
  Gm: { b: 'G1', v: ['Bb3', 'D4', 'G4'] },
  F: { b: 'F2', v: ['A3', 'C4', 'F4'] },
  Eb: { b: 'Eb2', v: ['Bb3', 'Eb4', 'G4'] },
  Cm: { b: 'C2', v: ['C4', 'Eb4', 'G4'] },
  Dm: { b: 'D2', v: ['D4', 'F4', 'A4'] },
  Bb: { b: 'Bb1', v: ['Bb3', 'D4', 'F4'] },
  Ab: { b: 'Ab1', v: ['Ab3', 'C4', 'Eb4'] },
  Db: { b: 'Db2', v: ['Ab3', 'Db4', 'F4'] },
  Fm: { b: 'F2', v: ['Ab3', 'C4', 'F4'] },
  A: { b: 'A1', v: ['A3', 'C#4', 'E4'] },
};

function sub(sym, c, o) {
  const ch = CHORDS[c];
  if (sym === 'r') return 'r';
  if (sym === 'L') return ch.b;
  if (sym === 'H') return up(ch.b, 12);
  if (sym === 'F') return up(ch.b, 7);
  const sh = 12 * (o.oct || 0);
  if (sym === 'Y') return `[${ch.v.slice(-2).map((n) => up(n, sh)).join(' ')}]`;
  if (sym === 'X') return `[${ch.v.map((n) => up(n, sh)).join(' ')}]`;
  const k = Number(sym);
  const tones = [...ch.v.slice(0, 3), up(ch.v[0], 12)];
  return up(tones[k], sh);
}

// 1小節（16）を 型から 作る
function fillBar(pat, chord, o = {}) {
  const [c1, c2] = Array.isArray(chord) ? chord : [chord, chord];
  const out = [];
  let pos = 0;
  for (const tok of pat.trim().split(/\s+/)) {
    const [, sym, l, mods] = /^([^:]+):(\d+)(.*)$/.exec(tok);
    const len = Number(l);
    const pieces = c1 !== c2 && pos < 8 && pos + len > 8 ? [[8 - pos, c1], [pos + len - 8, c2]] : [[len, pos < 8 ? c1 : c2]];
    for (const [n, c] of pieces) out.push(`${sub(sym, c, o)}:${n}${mods}`);
    pos += len;
  }
  return out.join(' ');
}
// 和音の ならび × 型（型は 1つ か 小節ごとの ならび）
const gen = (chords, pat, o) => chords.map((c, i) => fillBar(Array.isArray(pat) ? pat[i % pat.length] : pat, c, o)).join(' ');
const rep = (s, n) => Array(n).fill(s).join(' ');
const J = (...a) => a.join(' ');

// ベースの 型（強拍 0・8 は いつも 根音）
const B_PUMP = 'L:2! H:2 L:2 H:2 L:2! H:2 L:2 H:2';
const B_PUMP16 = 'L:2! H:2 L:2 H:2 L:2! H:2 L:1 L:1 H:2';
const B_GALLOP = 'L:2! L:1 L:1 H:2 L:1 L:1 L:2! L:1 L:1 H:2 F:2';
const B_DRIVE = 'L:2! L:2 L:2 L:2 L:2! L:2 H:2 L:2';
const B_SYNC = 'L:3! L:3 L:2 H:3! L:3 L:2';
const B_SIXT = 'L:1! L:1? L:1 L:1? H:1! L:1? L:1 L:1? L:1! L:1? L:1 L:1? H:1! L:1? F:1 L:1?';
const B_HALF = 'L:4! r:2 L:2 L:4! r:2 H:2';
const B_HEAVY = 'L:2! L:2 r:2 L:2 L:2! L:1 L:1 H:2 L:2';
// 和音・アルペジオの 型
const P_LONG = 'X:16';
const P_HALF = 'X:8 X:8';
const S_OFF = 'r:4 X:2. r:6 X:2! r:2';
const S_PUSH = 'X:2! r:4 X:2. r:8';
const S_ONE = 'X:2! r:14';
const S_HITS = 'X:2! r:1 X:1! r:4 X:2! r:2 X:4!';
const A_UP = '0:2 1:2 2:4 3:2 2:2 1:4';
const A_ROLL = '0:4 1:4 2:4 3:4';

// ───────────── たいこ（1小節 = 16） ─────────────
const D_ROCK = 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2';
const D_ROCK_CR = 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2';
const D_BUSY = 'k:2! h:2 s:2! h:1 h:1? k:2 k:1 h:1? s:2! h:2';
const D_DRIVE = 'k:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1';
const D_DRIVE_CR = 'c:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1';
const D_TOM = 'k:2! h:2 t:2 k:2 s:2! th:1 th:1 t:2 tl:2';
const D_HALF = 'k:2! h:2 h:2 k:2 s:4! h:2 tl:2';
const D_HALF_CR = 'c:2! h:2 h:2 k:2 s:4! h:2 tl:2';
const D_DBL = 'k:2! h:1 k:1 s:2! h:2 k:2! h:1 k:1 s:2! tl:2';
const D_HEAVY = 'k:2! h:2 s:2! h:2 k:2! k:2 s:2! t:1 tl:1';
const D_TOMS = 'tl:2! tl:2 t:2 tl:2 k:2! t:2 th:2 t:2';
const D_SKIP = 'k:2! h:1 h:1? s:2! h:1 h:1? k:1 k:1 h:2 s:2! h:1 h:1?';
const D_FOUR = 'k:2! h:2 p:2 h:2 k:2! h:2 p:2! h:1 h:1?';

// ═════════════ battle: ふつうの 戦い（第1部）ホ短調 164 ═════════════
// 前の 曲の 動機（ミ ミ シ ミ ソ ファ# ミ シ）を A に そのまま。A は Em C D B7 の 前の 和音。B（サビ）は C D Bm Em で ひらく
const BT = {
  intro: ['Em', 'B7'],
  A: ['Em', 'C', 'D', 'B7', 'Em', 'Am', ['C', 'D'], 'B'],
  A2: ['Em', 'C', 'Am', 'B7', 'C', 'D', 'Em', 'B7'],
  B: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'B7', 'C', 'D', 'B7', 'Em', 'C', 'Am', 'B7', 'Em'],
  C: ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'C', 'C', 'Am', 'C', 'B', 'B'],
};
const battle = {
  bpm: 164, reverb: 0.16, fill: 8,
  parts: [
    { i: 'lead', w: 'pulse', v: 0.1 },
    { i: 'bass', v: 0.19 },
    { i: 'strings', v: 0.03 },
    { i: 'chip_square', v: 0.035 },
    { i: 'pluck', w: 'square', v: 0.035 },
    { drums: true, v: 0.55 },
  ],
  sections: {
    intro: [
      J('E5:2! r:2 E5:2! r:2 E5:2! r:2 E5:2. r:2', 'F#5:2! r:2 F#5:2! r:2 A5:4! B5:4!'),
      J('E2:2! E2:2 E2:2! E2:2 E2:2! E2:2 E2:2 E3:2', 'B1:2! B1:2 B1:2! B1:2 B1:1 B1:1 B1:1 B1:1 B2:4!'),
      gen(BT.intro, P_LONG),
      gen(BT.intro, S_HITS),
      null,
      J('k:2! r:2 k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1', 'c:2! r:2 k:2! r:2 t:2 t:2 tl:2 tl:2'),
    ],
    // A: 前の メロディ（8分の きざみ）。うすい 和音
    A: [
      J(
        'E5:2! E5:2. B4:2 E5:2 G5:2! F#5:2 E5:2 B4:2',
        'C5:2! C5:2. G4:2 C5:2 E5:2! D5:2 C5:2 G4:2',
        'D5:2! D5:2. A4:2 D5:2 F#5:2! E5:2 D5:2 A4:2',
        'B4:2 D#5:2 F#5:2 B5:2! A5:4 F#5:2 D#5:2',
        'G5:4! F#5:2 E5:2 B4:4 E5:4',
        'A4:2 C5:2 E5:2 A5:2! G5:4 E5:4',
        'G5:4 E5:4 F#5:4! A5:4',
        'B5:6! A5:2 G5:2 F#5:2 D#5:4',
      ),
      gen(BT.A, B_PUMP),
      gen(BT.A, P_LONG),
      null,
      null,
      J(D_ROCK_CR, rep(D_ROCK, 7)),
    ],
    // A': 同じ 頭で 上へ。ベースは 16分の ギャロップ・はじく 音の アルペジオ・こまかい たいこ
    A2: [
      J(
        'E5:2! E5:2. B4:2 E5:2 G5:2! A5:2 B5:2 G5:2',
        'C6:4! G5:2 A5:2 G5:2 E5:2 C5:2 E5:2',
        'A5:2! A5:2. E5:2 A5:2 C6:2! B5:2 A5:2 E5:2',
        'F#5:4! D#5:2 F#5:2 B5:4! A5:4',
        'G5:4! E5:2 G5:2 C6:4 G5:2 A5:2',
        'A5:4! F#5:2 A5:2 D6:4 C6:2 A5:2',
        'B5:4. G5:2 B5:2 E6:4! D6:2 B5:2',
        'D#6:6! C6:2 B5:2 A5:2 F#5:4',
      ),
      gen(BT.A2, B_PUMP16),
      null,
      null,
      gen(BT.A2, A_UP),
      J('c:2! h:1 h:1? s:2! h:1 h:1? k:2 k:1 h:1? s:2! h:2', rep(D_BUSY, 7)),
    ],
    // B（サビ）: のびる メロディ・ブラスの うら打ち・ひらいた ハイハット。いちばん 厚い
    B: [
      J(
        'E5:6! D5:2 E5:4 G5:4',
        'F#5:6 E5:2 F#5:4 A5:4',
        'B5:8! A5:4 F#5:4',
        'G5:12 E5:2 F#5:2',
        'A5:6! G5:2 E5:4 C6:4',
        'A5:6 F#5:2 D6:4 C6:4',
        'B5:6! A5:2 G5:4 D5:4',
        'F#5:8 D#5:4 F#5:4',
        'E5:6! D5:2 E5:4 G5:4',
        'F#5:6 E5:2 F#5:4 A5:4',
        'B5:6! A5:2 B5:4 D#6:4',
        'E6:12! D6:2 C6:2',
        'C6:4! G5:4 E5:4 G5:4',
        'A5:4 E5:4 C6:4 A5:4',
        'B5:6 A5:2 F#5:4 D#5:4',
        'E5:12! r:4',
      ),
      gen(BT.B, B_DRIVE),
      gen(BT.B, P_LONG),
      gen(BT.B, S_OFF),
      gen(BT.B, A_ROLL),
      J(D_DRIVE_CR, rep(D_DRIVE, 7), D_DRIVE_CR, rep(D_DRIVE, 7)),
    ],
    // つなぎ: みじかく 切った メロディ・ベースは 16分・タムの 型。さいごに もりあげて A へ
    C: [
      J(
        'E5:1! E5:1? r:2 B4:2. E5:2. r:2 G5:2! F#5:2. E5:2.',
        'r:2 D5:2. E5:2. G5:2. A5:2! G5:2. E5:2. D5:2.',
        'E5:1! E5:1? r:2 C5:2. E5:2. r:2 G5:2! A5:2. G5:2.',
        'r:2 G5:2. E5:2. G5:2. C6:2! G5:2. E5:2. G5:2.',
        'A5:1! A5:1? r:2 E5:2. A5:2. r:2 C6:2! B5:2. A5:2.',
        'r:2 E5:2. A5:2. C6:2. E6:2! C6:2. A5:2. E5:2.',
        'G5:2. E5:2. G5:2. C6:2. E6:2! C6:2. G5:2. E5:2.',
        'E6:4! D6:2 C6:2 G5:4! E5:4',
        'A5:4! r:2 A5:2 C6:4! r:2 C6:2',
        'C6:4! r:2 C6:2 E6:4! r:2 E6:2',
        'B5:4! r:4 A5:4! r:4',
        'F#5:2! G5:2! A5:2! B5:2! r:8',
      ),
      J(gen(BT.C.slice(0, 8), B_HALF), gen(BT.C.slice(8), B_SIXT)),
      null,
      J(rep('r:16', 8), gen(BT.C.slice(8), S_PUSH)),
      J(rep('r:16', 4), gen(BT.C.slice(4, 8), A_ROLL), rep('r:16', 4)),
      J(rep(D_TOM, 7), D_TOMS, rep(D_SKIP, 3), 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1'),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  pinch: { n: 'E6:2! B5:2 E6:2 F6:2 E6:2! B5:2 E6:2 D#6:2', i: 'chip_arp', v: 0.032 },
};

// ═════════════ battle2: ふつうの 戦い（第2部）ト短調 170 ═════════════
// battle と 同じ 頭（ソ ソ レ ソ）と 同じ 形・同じ つなぎの きざみ。でも 上へ 上へ 進む（Gm F Eb F）・ベースは 3+3+2
const B2 = {
  intro: ['Gm', 'D'],
  A: ['Gm', 'F', 'Eb', 'F', 'Gm', 'F', 'Eb', 'D'],
  A2: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Bb', ['Eb', 'D'], 'Gm'],
  B: ['Eb', 'F', 'Dm', 'Gm', 'Eb', 'F', 'Bb', 'D', 'Eb', 'F', 'Dm', 'Gm', 'Cm', 'D', 'Gm', 'Gm'],
  C: ['Gm', 'Gm', 'Eb', 'Eb', 'Cm', 'Cm', 'Gm', 'Gm', 'Cm', 'Eb', 'D', 'D'],
};
const battle2 = {
  bpm: 170, reverb: 0.16, fill: 8, legacyOf: 'battle',
  parts: [
    { i: 'lead', w: 'square', v: 0.085 },
    { i: 'bass', v: 0.19 },
    { i: 'strings', v: 0.03 },
    { i: 'chip_square', v: 0.035 },
    { i: 'pluck', w: 'pulse', v: 0.09 },
    { drums: true, v: 0.55 },
  ],
  sections: {
    intro: [
      J('G5:2! r:2 G5:2! r:2 G5:2! r:2 G5:2. r:2', 'A5:2! r:2 A5:2! r:2 C6:4! D6:4!'),
      J('G1:3! G1:3 G1:2 G2:3! G1:3 G1:2', 'D2:2! D2:2 D2:2! D2:2 D2:1 D2:1 D2:1 D2:1 D3:4!'),
      gen(B2.intro, P_LONG),
      gen(B2.intro, S_HITS),
      null,
      J('k:2! r:2 k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1', 'c:2! r:2 k:2! r:2 th:2 t:2 tl:2 tl:2'),
    ],
    A: [
      J(
        'G5:2! G5:2. D5:2 G5:2 Bb5:2! C6:2 D6:2 Bb5:2',
        'C6:4! A5:2 F5:2 A5:4! C6:2 A5:2',
        'Bb5:2! Bb5:2. G5:2 Bb5:2 Eb6:2! D6:2 C6:2 Bb5:2',
        'A5:6! G5:2 F5:4 C5:4',
        'G5:2! G5:2. D5:2 G5:2 Bb5:2! C6:2 D6:2 F6:2',
        'F6:4! Eb6:2 D6:2 C6:4! A5:4',
        'Bb5:4! G5:2 Eb5:2 G5:4! Bb5:4',
        'A5:6! F#5:2 D5:4 A5:4',
      ),
      gen(B2.A, B_SYNC),
      null,
      gen(B2.A, S_ONE),
      gen(B2.A, A_ROLL),
      J('c:2! h:1 h:1? s:2! h:1 h:1? k:1 k:1 h:2 s:2! h:1 h:1?', rep(D_SKIP, 7)),
    ],
    A2: [
      J(
        'D6:2! D6:2. Bb5:2 D6:2 G6:2! F6:2 D6:2 Bb5:2',
        'C6:2! Bb5:2 G5:2 Bb5:2 Eb6:4! Bb5:2 C6:2',
        'C6:2! C6:2. G5:2 C6:2 Eb6:2! D6:2 C6:2 G5:2',
        'F#5:4! A5:4 D6:4! C6:4',
        'Bb5:6! A5:2 G5:4 D5:4',
        'F5:2 G5:2 Bb5:2 C6:2 D6:4! F6:4',
        'Eb6:4! Bb5:4 C6:4! A5:4',
        'G5:8! D5:2 G5:2 A5:2 Bb5:2',
      ),
      gen(B2.A2, B_PUMP16),
      gen(B2.A2, P_LONG),
      gen(B2.A2, S_ONE),
      null,
      J(D_ROCK_CR, rep(D_FOUR, 3), D_ROCK, rep(D_FOUR, 3)),
    ],
    B: [
      J(
        'G5:6! F5:2 G5:4 Bb5:4',
        'A5:6! G5:2 A5:4 C6:4',
        'D6:8! C6:4 A5:4',
        'Bb5:12! A5:2 Bb5:2',
        'G5:6! F5:2 G5:4 Eb6:4',
        'D6:6! C6:2 A5:4 F5:4',
        'F5:4! Bb5:4 D6:4! F6:4',
        'F#5:4! A5:4 D6:8!',
        'G5:6! F5:2 G5:4 Bb5:4',
        'A5:6! G5:2 A5:4 C6:4',
        'D6:6! C6:2 D6:4 F6:4',
        'G6:12! F6:2 Eb6:2',
        'Eb6:6! D6:2 C6:4 G5:4',
        'F#5:4! A5:4 C6:4! D6:4',
        'Bb5:6! A5:2 G5:4 D5:4',
        'G5:12! r:4',
      ),
      gen(B2.B, B_DRIVE),
      gen(B2.B, P_LONG),
      gen(B2.B, S_OFF),
      gen(B2.B, A_ROLL),
      J(D_DRIVE_CR, rep(D_DRIVE, 7), D_DRIVE_CR, rep(D_DRIVE, 7)),
    ],
    C: [
      J(
        'G5:1! G5:1? r:2 D5:2. G5:2. r:2 Bb5:2! A5:2. G5:2.',
        'r:2 F5:2. G5:2. Bb5:2. D6:2! Bb5:2. G5:2. F5:2.',
        'G5:1! G5:1? r:2 Eb5:2. G5:2. r:2 Bb5:2! C6:2. Bb5:2.',
        'r:2 Bb5:2. G5:2. Bb5:2. Eb6:2! D6:2. Bb5:2. G5:2.',
        'C6:1! C6:1? r:2 G5:2. C6:2. r:2 Eb6:2! D6:2. C6:2.',
        'r:2 G5:2. C6:2. Eb6:2. G6:2! Eb6:2. C6:2. G5:2.',
        'D6:2. Bb5:2. G5:2. Bb5:2. D6:2! G6:2. D6:2. Bb5:2.',
        'G6:4! F6:2 D6:2 Bb5:4! G5:4',
        'C6:4! r:2 C6:2 Eb6:4! r:2 Eb6:2',
        'Eb6:4! r:2 Eb6:2 G6:4! r:2 G6:2',
        'D6:4! r:4 C6:4! r:4',
        'A5:2! Bb5:2! C6:2! D6:2! r:8',
      ),
      J(gen(B2.C.slice(0, 8), B_PUMP), gen(B2.C.slice(8), B_GALLOP)),
      null,
      J(rep('r:16', 8), gen(B2.C.slice(8), S_HITS)),
      J(rep('r:16', 4), gen(B2.C.slice(4, 8), A_ROLL), rep('r:16', 4)),
      J(rep(D_TOM, 7), D_TOMS, rep(D_BUSY, 3), 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1'),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  pinch: { n: 'G6:2! D6:2 G6:2 Ab6:2 G6:2! D6:2 G6:2 F#6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ battle_strong: 強敵との 戦い ハ短調 154 ═════════════
// 重い ブラスの メロディ（頭は battle と 同じ「ド ド ソ ド」の 型）・タム・ナポリの 和音（Db）で きんちょう。B は ハーフタイム
const BS = {
  intro: ['Cm', 'G'],
  A: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Db', 'G'],
  A2: ['Fm', 'Cm', 'Ab', 'G', 'Fm', 'Cm', 'Db', 'G'],
  B: ['Ab', 'Bb', 'Eb', 'Cm', 'Ab', 'Bb', 'G', 'G', 'Fm', 'G', 'Eb', 'Ab', 'Fm', 'Db', 'G', 'G'],
  C: ['Cm', 'Cm', 'Ab', 'Ab', 'Fm', 'Fm', 'G', 'G'],
};
const battleStrong = {
  bpm: 154, reverb: 0.2, fill: 8, legacyOf: 'battle',
  parts: [
    { i: 'brass', v: 0.1 },
    { i: 'bass', v: 0.2 },
    { i: 'strings', v: 0.032 },
    { i: 'brass', v: 0.04 },
    { i: 'pluck', w: 'saw', v: 0.06 },
    { drums: true, v: 0.6 },
  ],
  sections: {
    intro: [
      J('C5:2! r:2 C5:2! r:2 G4:4! r:4', 'B4:2! r:2 B4:2! r:2 D5:4! G5:4!'),
      J('C2:2! r:2 C2:2! r:2 C2:4! r:4', 'G1:2! r:2 G1:2! r:2 G1:4! G2:4!'),
      gen(BS.intro, P_LONG),
      J('[C4 Eb4 G4]:2! r:2 [C4 Eb4 G4]:2! r:2 [C4 Eb4 G4]:4! r:4', '[B3 D4 G4]:2! r:2 [B3 D4 G4]:2! r:2 [B3 D4 G4]:4! [B3 D4 F4]:4!'),
      null,
      J('tl:2! tl:2 t:2 t:2 tl:2! tl:2 t:2 th:2', 'k:2! r:2 k:2! r:2 tl:1 tl:1 t:1 t:1 th:1 th:1 s:1 s:1'),
    ],
    A: [
      J(
        'C5:2! C5:2. G4:2 C5:2 Eb5:6! D5:2',
        'G4:4! Bb4:2 C5:2 Eb5:4! D5:2 C5:2',
        'C5:2! C5:2. Ab4:2 C5:2 F5:6! Eb5:2',
        'D5:4! F5:4 Bb5:4! Ab5:4',
        'G5:6! F5:2 Eb5:4 C5:4',
        'D5:2 Eb5:2 F5:2 G5:2 Ab5:4! G5:4',
        'F5:4! Ab5:4 Db6:6! Ab5:2',
        'G5:8! F5:2 Eb5:2 D5:2 B4:2',
      ),
      gen(BS.A, B_DRIVE),
      gen(BS.A, P_LONG),
      gen(BS.A, S_ONE),
      null,
      J('c:2! h:2 s:2! h:2 k:2! k:2 s:2! t:1 tl:1', rep(D_HEAVY, 7)),
    ],
    A2: [
      J(
        'F5:2! F5:2. C5:2 F5:2 Ab5:6! G5:2',
        'G5:4! Eb5:2 C5:2 G5:4! F5:2 Eb5:2',
        'Ab5:2! Ab5:2. Eb5:2 Ab5:2 C6:6! Bb5:2',
        'B5:4! D6:4 B5:4 G5:4',
        'C6:6! Bb5:2 Ab5:4 F5:4',
        'G5:6 F5:2 Eb5:4 G5:4',
        'Ab5:4! F5:4 Db6:6! C6:2',
        'B5:8! D6:4 B5:4',
      ),
      gen(BS.A2, B_PUMP16),
      gen(BS.A2, P_LONG),
      gen(BS.A2, S_ONE),
      gen(BS.A2, A_ROLL),
      J('c:2! h:1 k:1 s:2! h:2 k:2! h:1 k:1 s:2! tl:2', rep(D_DBL, 7)),
    ],
    // B: ハーフタイム（スネアは 3拍目だけ）。のびる ブラスと 厚い 和音
    B: [
      J(
        'Eb5:4! Ab5:4 C6:6 Bb5:2',
        'Bb5:8! Ab5:4 F5:4',
        'G5:6! F5:2 Eb5:4 G5:4',
        'C6:12! G5:4',
        'Eb5:4! Ab5:4 C6:6 Db6:2',
        'D6:8! Bb5:4 F5:4',
        'B5:6! C6:2 D6:4 F6:4',
        'D6:12! r:4',
        'C6:4! Ab5:4 F5:6 G5:2',
        'B5:4! G5:4 D6:4 B5:4',
        'Bb5:6! G5:2 Eb5:4 G5:4',
        'C6:12! Eb6:4',
        'F6:6! Eb6:2 C6:4 Ab5:4',
        'Db6:6! C6:2 Ab5:4 F5:4',
        'D6:4! B5:4 G5:4 B5:4',
        'D6:12! r:4',
      ),
      gen(BS.B, B_HALF),
      gen(BS.B, P_LONG),
      gen(BS.B, 'Y:4! r:4 Y:6 r:2'),
      gen(BS.B, A_ROLL),
      J(D_HALF_CR, rep(D_HALF, 7), D_HALF_CR, rep(D_HALF, 7)),
    ],
    // つなぎ: タムの 太鼓・ドド の 短い ブラス・ベースは 16分
    C: [
      J(
        'C5:2! C5:2. r:4 Eb5:2! Eb5:2. r:4',
        'G5:2! G5:2. r:4 F5:2! Eb5:2. D5:4',
        'C5:2! C5:2. r:4 Eb5:2! Eb5:2. r:4',
        'Ab5:2! Ab5:2. r:4 Eb5:2! C5:2. Eb5:4',
        'F5:2! F5:2. r:4 Ab5:2! Ab5:2. r:4',
        'C6:2! C6:2. r:4 Ab5:2! F5:2. C5:4',
        'B4:2! D5:2 G5:2 B5:2 D6:4! B5:4',
        'G5:2! F5:2! Eb5:2! D5:2! r:8',
      ),
      J(gen(BS.C.slice(0, 4), B_HEAVY), gen(BS.C.slice(4), B_SIXT)),
      null,
      gen(BS.C, 'X:2! r:6 X:2! r:6'),
      null,
      J(rep(D_TOMS, 6), D_TOM, 'k:2! k:2 s:2! s:2 tl:1 tl:1 t:1 t:1 th:1 th:1 s:1 s:1'),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  pinch: { n: 'C6:2! G5:2 C6:2 Db6:2 C6:2! G5:2 C6:2 B5:2', i: 'chip_arp', v: 0.032 },
};

// ═════════════ boss: ボス ニ短調 172 ═════════════
// 前の 動機（レ ファ ラ レ ド# ラ ファ ミ）を A に。イントロは ブラスの 打ちこみ。C は Eb（半音上の 和音）で こわさを 出す
const BO = {
  intro: ['Dm', 'Bb', 'Eb', 'A'],
  A: ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', ['Gm', 'A'], 'Dm'],
  A2: ['Dm', 'Bb', 'Gm', 'A', 'Eb', 'C', 'Bb', 'A'],
  B: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'A', 'Gm', 'A', 'Dm', 'Bb', 'Gm', 'Eb', 'A', 'A'],
  C: ['Dm', 'Dm', 'Bb', 'Bb', 'Gm', 'Gm', 'Eb', 'Eb', 'Dm', 'Bb', 'A', 'A'],
};
const boss = {
  bpm: 172, reverb: 0.2, fill: 8,
  parts: [
    { i: 'lead', w: 'pulse', v: 0.1 },
    { i: 'bass', v: 0.2 },
    { i: 'brass', v: 0.045 },
    { i: 'strings', v: 0.03 },
    { i: 'pluck', w: 'saw', v: 0.06 },
    { drums: true, v: 0.6 },
  ],
  sections: {
    // イントロ: ブラスの 打ちこみ（ベース・たいこも 同じ 所で）
    intro: [
      J(rep('r:16', 3), 'A4:2! C#5:2 E5:2 G5:2 A5:2! G5:2 E5:2 C#5:2'),
      J(gen(BO.intro.slice(0, 3), 'L:2! r:1 L:1! r:4 L:2! r:2 L:4!'), 'A1:2! A1:2 A1:2 A1:2 A1:2! A1:2 A2:2 A1:2'),
      J(rep('r:16', 3), '[A3 C#4 E4 G4]:16'),
      J(gen(BO.intro.slice(0, 3), S_HITS), '[A3 C#4 E4]:4! r:4 [A3 C#4 E4]:4! r:4'),
      null,
      J(rep('k:2! r:1 k:1! r:4 k:2! r:2 c:4!', 3), 'tl:2! tl:2 t:2 t:2 th:2 th:2 s:1 s:1 s:1 s:1'),
    ],
    A: [
      J(
        'D5:2! F5:2 A5:2 D6:3! C#6:1 A5:2 F5:2 E5:2',
        'F5:2! D5:2 Bb4:2 D5:2 F5:4! G5:4',
        'G5:2! Bb5:2 D6:2 Bb5:2 G5:2! F5:2 E5:2 D5:2',
        'C#5:4! E5:4 A5:4! G5:4',
        'D5:6! E5:2 F5:6 G5:2',
        'F5:6! G5:2 Bb5:6 A5:2',
        'G5:4! F5:4 E5:4! C#5:4',
        'D5:2! A4:2 D5:2 F5:2 A5:8!',
      ),
      gen(BO.A, 'L:2! L:2 F:2 L:2 L:2! L:2 F:2 L:2'),
      null,
      gen(BO.A, S_ONE),
      null,
      J('c:2! h:1 h:1? k:2 s:2! k:1 k:1 h:2 s:2! h:2', rep('k:2! h:1 h:1? k:2 s:2! k:1 k:1 h:2 s:2! h:2', 7)),
    ],
    // A': 1オクターブ上・ブラスが 強拍を おす・Eb C の あたらしい 和音
    A2: [
      J(
        'D6:2! F6:2 A5:2 D6:2 F6:3! E6:1 D6:2 A5:2',
        'D6:2! Bb5:2 F5:2 Bb5:2 D6:4! C6:4',
        'Bb5:2! G5:2 D5:2 G5:2 Bb5:4! A5:4',
        'C#6:6! B5:2 A5:4 E5:4',
        'G5:4! Bb5:4 Eb6:6! D6:2',
        'E6:4! C6:4 G5:4! E5:4',
        'F5:4! D5:4 Bb5:4! D6:4',
        'C#6:8! E6:4 A5:4',
      ),
      gen(BO.A2, B_PUMP16),
      gen(BO.A2, S_ONE),
      null,
      null,
      J('c:2! h:1 k:1 s:2! h:2 k:2! h:1 k:1 s:2! h:2', rep(D_DBL, 7)),
    ],
    // B（サビ）: ヘ長調へ ひらく。いちばん 厚い
    B: [
      J(
        'A5:6! G5:2 A5:4 C6:4',
        'G5:6! F5:2 E5:4 G5:4',
        'F5:6! E5:2 F5:4 A5:4',
        'D6:12! C6:2 Bb5:2',
        'A5:6! G5:2 A5:4 C6:4',
        'E6:6! D6:2 C6:4 G5:4',
        'F6:6! D6:2 Bb5:4 D6:4',
        'C#6:8! E6:8',
        'D6:6! C6:2 Bb5:4 G5:4',
        'E6:6! D6:2 C#6:4 A5:4',
        'F6:6! E6:2 D6:4 A5:4',
        'D6:12! F6:4',
        'Bb5:6! A5:2 G5:4 D6:4',
        'Eb6:6! D6:2 Bb5:4 G5:4',
        'C#6:4! E6:4 C#6:4 A5:4',
        'A5:12! r:4',
      ),
      gen(BO.B, B_DRIVE),
      gen(BO.B, 'r:4 Y:2. r:6 Y:2! r:2'),
      gen(BO.B, P_LONG),
      gen(BO.B, A_ROLL),
      J(D_DRIVE_CR, rep(D_DRIVE, 7), D_DRIVE_CR, rep(D_DRIVE, 7)),
    ],
    // つなぎ: ハーフタイムの 重い たいこ・メロディは 切って・さいごに かけあがる
    C: [
      J(
        'D5:2! F5:2. A5:2. r:2 D6:2! r:2 C6:2. A5:2.',
        'r:4 A5:2. F5:2. D5:4! r:4',
        'D5:2! F5:2. Bb5:2. r:2 D6:2! r:2 C6:2. Bb5:2.',
        'r:4 Bb5:2. F5:2. D5:4! r:4',
        'D5:2! G5:2. Bb5:2. r:2 D6:2! r:2 C6:2. Bb5:2.',
        'r:4 Bb5:2. G5:2. D5:4! r:4',
        'Eb5:2! G5:2. Bb5:2. r:2 Eb6:2! r:2 C6:2. Bb5:2.',
        'r:4 Bb5:2. G5:2. Eb5:4! r:4',
        'F5:4! A5:4 D6:4! F6:4',
        'F6:4! D6:4 Bb5:4! F5:4',
        'E6:4! r:4 C#6:4! r:4',
        'A5:2! B5:2! C#6:2! E6:2! r:8',
      ),
      J(gen(BO.C.slice(0, 8), B_HALF), gen(BO.C.slice(8), B_GALLOP)),
      J(gen(BO.C.slice(0, 8), 'X:2! r:14'), gen(BO.C.slice(8), S_HITS)),
      J(gen(BO.C.slice(0, 8), P_LONG), rep('r:16', 4)),
      null,
      J(rep(D_HALF, 3), D_TOMS, rep(D_HALF, 3), D_TOMS, rep(D_HEAVY, 3), 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1'),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  // だん: 0 ニ短調 → 1 ホ短調 → 2 ヘ短調 → 3 ト短調（テンポも 少しずつ 上がる）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 2, tempo: 1.04 },
    { transpose: 3, tempo: 1.07 },
    { transpose: 5, tempo: 1.1 },
  ],
  // ピンチ: 高い レ・ラ を きざみ、2拍ごとに 半音上の ミb で ゆさぶる
  pinch: { n: 'D6:2! A5:2 D6:2 A5:2 Eb6:2! A5:2 D6:2 A5:2', i: 'chip_arp', v: 0.034 },
};

// ═════════════ victory: 勝利の ジングル ハ長調 144（前と 同じ 32（16分）= 約3.3びょう） ═════════════
// 前の 動機（ミ ソ ド … ミ … ド）を のこし、ブラスの 和音（C Am F G C）・タムの ロール・さいごに シンバル
const victory = {
  bpm: 144, once: true, reverb: 0.3,
  parts: [
    { i: 'lead', w: 'pulse', v: 0.12 },
    { i: 'brass', v: 0.06 },
    { i: 'bass', v: 0.19 },
    { i: 'musicbox', v: 0.04 },
    { drums: true, v: 0.45 },
  ],
  sections: {
    main: [
      'E5:2! G5:2 C6:3! B5:1 C6:1 D6:1 E6:4! D6:2 C6:2 B5:2 D6:2 C6:10!',
      '[C4 E4 G4]:4! r:4 [C4 E4 A4]:6! [C4 F4 A4]:2 [B3 D4 G4]:4! [B3 D4 F4]:4 [C4 E4 G4 C5]:8!',
      'C3:4! G2:4 A2:6 F2:2 G2:4! G2:2 G2:2 C3:8!',
      'r:16 r:8 C6:1 E6:1 G6:1 C7:1 G6:1 E6:1 C6:2',
      'k:4! t:2 t:2 k:4 tl:2 tl:2 k:2! s:1 s:1 th:2 t:1 tl:1 c:8!',
    ],
  },
  form: ['main'],
};

// 新しい id の 曲（battle2・battle_strong）の ch: 古い テスト（tr.ch を 前の 書き方で 見る・メロディが ほかの 曲と かさならない）用に、
// 自分の 楽譜を 前の 書き方へ うつした もの（しるしを とる・和音は いちばん 上の 音・ふえた たいこは k/s/h）。鳴らすのには つかわない
// （新しい音は parts と sections、前の音は legacyOf の 曲の 前の データ）
const OLD_DRUM = { k: 'k', s: 's', h: 'h', o: 'h', c: 'h', p: 's', R: 's', t: 'k', th: 'k', tl: 'k', r: 'r' };
const toks = (s) => String(s).trim().match(/\[[^\]]*\](?::\S*)?|\S+/g) || [];
const tokLen = (t) => Number(/:(\d+)/.exec(t.slice(t.lastIndexOf(']') + 1))[1]);
function oldView(tr) {
  return tr.parts.map((p, i) => ({
    ...(p.drums ? { drums: true } : { w: p.w || (i === 1 ? 'triangle' : 'square') }),
    v: p.v,
    n: tr.form.map((nm) => {
      const sec = tr.sections[nm];
      const steps = Math.max(...sec.map((s) => (s ? toks(s).reduce((a, t) => a + tokLen(t), 0) : 0)));
      if (!sec[i]) return `r:${steps}`;
      return toks(sec[i]).map((t) => {
        const len = tokLen(t);
        const name = t[0] === '[' ? t.slice(1, t.indexOf(']')).trim().split(/\s+/).pop() : t.split(':')[0];
        return `${p.drums ? OLD_DRUM[name] : name}:${len}`;
      }).join(' ');
    }).join(' '),
  }));
}
battle2.ch = oldView(battle2);
battleStrong.ch = oldView(battleStrong);

export const R77A_TRACKS = { battle, battle2, battle_strong: battleStrong, boss, victory };
