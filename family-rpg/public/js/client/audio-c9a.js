// 第90回 F: 第3部 第1章 第1幕「星ふるえの夜」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・はやさ・つなぐ 所）は docs/plan-part3.md の「実装メモ（F班）」。
// 曲は すべて オリジナル（ほかの 作品の 曲を まねて いない）。c9a_festival だけ この ゲームの お祭りの 曲（festival）の 編曲
//
// ・c9a_festival … 1年後の 星祭り（ハ長調 6/8 112。お祭りの 曲と 同じ メロディ。楽器が ふえ、和音が 大人に。N は 夜の しずかな 区切り・A3 は ニ長調へ 上がる）
// ・c9a_forest … 星ふるえの森（ホ長調 100。ささやきの森の 頭の 形〈ミ・ファ#・ソ・ラ〉を 明るい 音に かえた ふしぎな 森。高い オルゴールの きらきら）
// ・c9a_child … 星の子の テーマ（ハ長調・イ短調 76。ド・レ・ミ・ファ・ソ・ラ・シを 1つずつ たどる ふし ＝ 七つの 星の音の もと）
// ・c9a_cave … 星の石の地下道（ニの ドリア 96。強さで パートが ふえる: 0.4 笛・しずく・きざみ → 0.6 低音 → 0.8 のばし → 1.0 ベル・たいこ）
// ・c9a_trio … 3人組と メカの 戦い（ヘ長調 144。どたばた した 行進。にくめない 敵）
// ・c9a_trial … ともしびの ためし（ト短調 → ト長調 100。夜 → 夜明け前 → 夜明け。時間で もりあがる。だん 1〜3 は 夜明けの めもりで つなげる）
// ・battle3 … 第3部の ふつうの 戦い（ロ短調 166。サビは ニ長調で 星の子の 7つの 音を のぼる）
//
// メロディは 手で 書く。ベース・きざみ・和音・アルペジオは 和音の ならびから 下の 小さな 道具で 作る
// （道具は audio-c8r.js と 同じ 考え方。1小節の 長さ bar を えらべる ように した ＝ お祭りは 6/8 で bar 12）

// ───────────── 小さな 道具 ─────────────
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const QUAL = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7], dim: [0, 3, 6],
};
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const nm = (m, sp) => `${sp[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

function chordOf(sym) {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  if (!m || !QUAL[m[2]]) throw new Error(`c9a chord: ${sym}`);
  return { root: PC[m[1]], iv: QUAL[m[2]] };
}

// 小節（'C' か 'Em G7' … 小節を 等分）の step の 所の 和音
function chordAt(bar, step, bl) {
  const syms = bar.trim().split(/\s+/);
  return chordOf(syms[Math.min(syms.length - 1, Math.floor((step * syms.length) / bl))]);
}

// 型（'1:2! 5:2.' など）を 小節ごとに 読んで fn（字・和音）で 音に する。型が 配列なら 小節ごとに かわるがわる
function walk(prog, pat, fn, bl = 16) {
  const pats = Array.isArray(pat) ? pat : [pat];
  return prog.map((bar, bi) => {
    let step = 0;
    return pats[bi % pats.length].trim().split(/\s+/).map((tok) => {
      const mm = /^([^:]+):(\d+)([!?.~]*)$/.exec(tok);
      if (!mm) throw new Error(`c9a pattern: ${tok}`);
      const [, deg, len, mods] = mm;
      const at = step;
      step += Number(len);
      if (deg === 'r') return `r:${len}`;
      return `${fn(deg, chordAt(bar, at, bl))}:${len}${mods}`;
    }).join(' ');
  }).join(' ');
}

// ベース: 1 根音・8 オクターブ上・5 5度・3 3度・-5 下の 5度。lo … 根音の いちばん 低い 音（MIDI）
function bassLine(prog, pat, { lo = 38, sp = SHARP, bar = 16 } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const r = lo + (((ch.root - lo) % 12) + 12) % 12;
    const d = { 1: r, 8: r + 12, 3: r + ch.iv[1], 5: r + ch.iv[2], '-5': r + ch.iv[2] - 12 }[deg];
    if (d === undefined) throw new Error(`c9a bass: ${deg}`);
    return nm(d, sp);
  }, bar);
}

// 和音の ならべ方: 平均が center に いちばん 近い 転回
function voicing(ch, center) {
  const pcs = ch.iv.map((x) => (ch.root + x) % 12);
  let best = null;
  for (let k = 0; k < pcs.length; k++) {
    const rot = [...pcs.slice(k), ...pcs.slice(0, k)];
    let m = center - 7 + (((rot[0] - (center - 7)) % 12) + 12) % 12;
    const v = [m];
    for (const p of rot.slice(1)) {
      m += ((p - m) % 12 + 12) % 12 || 12;
      v.push(m);
    }
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    if (!best || Math.abs(mean - center) < best.d) best = { v, d: Math.abs(mean - center) };
  }
  return best.v;
}

// きざみの 和音: x = 和音ぜんぶ・l = 下の 2つ・h = 上の 2つ
function comp(prog, pat, { center = 64, sp = SHARP, bar = 16 } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const sel = deg === 'l' ? v.slice(0, 2) : deg === 'h' ? v.slice(-2) : v;
    return `[${sel.map((m) => nm(m, sp)).join(' ')}]`;
  }, bar);
}

// アルペジオ: 数字 = 和音の 下からの 何番目（和音の 数を こえると 1オクターブ上）
function arp(prog, pat, { center = 72, sp = SHARP, bar = 16 } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const k = Number(deg);
    if (!Number.isInteger(k)) throw new Error(`c9a arp: ${deg}`);
    return nm(v[k % v.length] + 12 * Math.floor(k / v.length), sp);
  }, bar);
}

// 対旋律（ガイドトーン）: x の たびに 前の 音に いちばん 近い 和音の 音（同じ 音は 少し さける）
function guide(prog, pat, { center = 67, sp = SHARP, span = 6, bar = 16 } = {}) {
  let prev = center;
  return walk(prog, pat, (deg, ch) => {
    const pcs = ch.iv.slice(0, 3).map((x) => (ch.root + x) % 12);
    let best = null;
    for (let m = center - span; m <= center + span; m++) {
      if (!pcs.includes(((m % 12) + 12) % 12)) continue;
      const score = Math.abs(m - prev) + (m === prev ? 1.5 : 0) + (((m % 12) + 12) % 12 === ch.root ? 0.4 : 0);
      if (!best || score < best.s) best = { m, s: score };
    }
    prev = best.m;
    return nm(best.m, sp);
  }, bar);
}

// のばしの 和音（1つの 和音に 1つ）
function pad(prog, { center = 62, sp = SHARP, mods = '', bar = 16 } = {}) {
  return prog.map((b) => {
    const syms = b.trim().split(/\s+/);
    const len = bar / syms.length;
    return syms.map((s) => `[${voicing(chordOf(s), center).map((m) => nm(m, sp)).join(' ')}]:${len}${mods}`).join(' ');
  }).join(' ');
}

// たいこ: n 小節。main は 型（配列なら かわるがわる）、first / last は さいしょ・さいごの 小節
function drums(n, main, { first, last } = {}) {
  const pats = Array.isArray(main) ? main : [main];
  return Array.from({ length: n }, (_, i) => (i === 0 && first ? first : i === n - 1 && last ? last : pats[i % pats.length])).join(' ');
}
const rest = (n, bar = 16) => Array.from({ length: n }, () => `r:${bar}`).join(' ');
const bars = (list) => list.join(' ');
const FILL = 'k:2! r:2 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1';

// ═════════════ c9a_festival: 1年後の 星祭り（ハ長調 6/8 112）═════════════
// お祭りの 曲（festival。6/8 の 8小節）と 同じ メロディ。1年ぶんの 成長 ＝ 楽器が ふえて、和音が 少し 大人に なる。
//   A 笛と ハープの きざみ（前の 曲に いちばん 近い）→ A2 ＋ 弦の のばし・ベル・和音を かえる → B（新しい ふし。イ短調の なつかしさ）
//   → N（夜の しずかな 区切り。たいこを 止め、ベルが こだま）→ A3（ニ長調へ 上がって ぜんぶの 楽器）→ br（ト長調を 通って ハ長調へ もどる）
// 1小節 = 16分音符 12（8分 6つ。強い 拍は 0 と 6）
const FB = 12;
const FEST = {
  intro: ['C', 'G'],
  A: ['C', 'F', 'G', 'C', 'C', 'Dm', 'G', 'C'],
  A2: ['C', 'F', 'Em G7', 'C Am', 'Am', 'Dm', 'G7', 'C'],
  B: ['Am', 'Em', 'F', 'C', 'Dm', 'Am', 'F', 'G'],
  N: ['C', 'F', 'G7', 'C', 'Am', 'Dm', 'G', 'C'],
  A3: ['D', 'G', 'A', 'D', 'Bm', 'Em', 'A7', 'D'],
  br: ['G', 'G7'],
};
// festival の メロディ（audio.js の festival の 1つめの チャンネルと 同じ 音）
const FEST_A = [
  'C5:2! E5:2 G5:2 E5:2 C5:2 E5:2', 'F5:2! A5:2 C6:2 A5:2 F5:2 A5:2', 'G5:2! F5:2 E5:2 D5:2 C5:2 B4:2', 'C5:6! G4:6',
  'E5:2! G5:2 C6:2 G5:2 E5:2 G5:2', 'F5:2! E5:2 D5:2 A5:6', 'G5:3! F5:1 E5:2 D5:3 B4:1 G4:2', 'C5:12',
];
const FEST_A2 = [
  'C5:2! E5:2 G5:2 E5:2 C5:2 E5:2', 'F5:2! A5:2 C6:2 A5:2 F5:2 A5:2', 'G5:2! F5:2 E5:2 D5:2 C5:2 B4:2', 'C5:6! r:2 E5:2 G5:2',
  'E5:2! G5:2 C6:2 G5:2 E5:2 G5:2', 'F5:2! E5:2 D5:2 A5:6', 'G5:3! F5:1 E5:2 D5:3 B4:1 G4:2', 'C5:8 r:4',
];
const FEST_B = [
  'E5:6! A5:4 B5:2', 'G5:6 E5:4 D5:2', 'C5:2! F5:2 A5:2 C6:4 A5:2', 'G5:12',
  'F5:6! A5:4 D6:2', 'C6:6 A5:4 E5:2', 'F5:4! G5:2 A5:6', 'D6:6 B5:2 A5:2 G5:2',
];
// 夜: ゆったり（8分 → 4分）
const FEST_N = [
  'C5:4 E5:2 G5:6', 'A5:4 G5:2 F5:6', 'D5:4 E5:2 F5:4 D5:2', 'E5:12',
  'C5:4 E5:2 A5:6', 'A5:4 G5:2 F5:6', 'D5:4 F5:2 B4:6', 'C5:12',
];
// A3: 2つ 上（ニ長調）
const FEST_A3 = [
  'D5:2! F#5:2 A5:2 F#5:2 D5:2 F#5:2', 'G5:2! B5:2 D6:2 B5:2 G5:2 B5:2', 'A5:2! G5:2 F#5:2 E5:2 D5:2 C#5:2', 'D5:6! A4:6',
  'F#5:2! A5:2 D6:2 A5:2 F#5:2 A5:2', 'G5:2! F#5:2 E5:2 B5:6', 'A5:3! G5:1 F#5:2 E5:3 C#5:1 A4:2', 'D5:12',
];
const FEST_BR = ['D6:6 B5:6', 'B5:2 A5:2 G5:2 F5:2 D5:4'];
const F6 = { bar: FB };
const F_COMP = 'r:2 x:2. x:2. r:2 x:2. x:2.';
const F_DR = 'k:2! h:2? h:2? s:2 h:2? h:2?';

const c9aFestival = {
  bpm: 112, bar: FB, reverb: 0.28, legacyOf: 'festival',
  // 夜（そとの 村）: 笛 → ベル・ハープ → マリンバ（たいこは エンジンが 小さく する）
  night: { lead: 'bell', pluck: 'marimba' },
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'bell', v: 0.038, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { drums: true, v: 0.4, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2, FB),
      bassLine(FEST.intro, ['1:12', '1:6 5:6'], { lo: 36, ...F6 }),
      comp(FEST.intro, F_COMP, { center: 64, ...F6 }),
      pad(FEST.intro, { center: 62, ...F6 }),
      bars(['C6:2 E6:2 G6:2 E6:2 C6:2 E6:2', 'D6:2 B5:2 G5:2 D6:6']),
      drums(2, 'r:12', { last: 'r:6 s:2? s:2 s:2!' }),
    ],
    A: [
      bars(FEST_A),
      bassLine(FEST.A, '1:6! 5:6', { lo: 36, ...F6 }),
      comp(FEST.A, F_COMP, { center: 64, ...F6 }),
      rest(8, FB),
      bars(['r:12', 'r:12', 'r:12', 'r:6 G5:2? C6:2? E6:2?', 'r:12', 'r:12', 'r:12', 'r:6 E6:2? D6:2? C6:2?']),
      drums(8, F_DR),
    ],
    A2: [
      bars(FEST_A2),
      bassLine(FEST.A2, '1:4! 5:2 8:4 5:2', { lo: 36, ...F6 }),
      comp(FEST.A2, F_COMP, { center: 65, ...F6 }),
      pad(FEST.A2, { center: 62, ...F6 }),
      arp(FEST.A2, '0:2 1:2 2:2 3:2 2:2 1:2', { center: 79, ...F6 }),
      drums(8, 'k:2! h:2 h:2 s:2! h:2 k:2?', { first: 'c:2! h:2 h:2 s:2! h:2 k:2?' }),
    ],
    B: [
      bars(FEST_B),
      bassLine(FEST.B, '1:6! 5:4 8:2', { lo: 33, ...F6 }),
      arp(FEST.B, '0:2 1:2 2:2 3:2 2:2 1:2', { center: 64, ...F6 }),
      guide(FEST.B, 'x:6 x:6', { center: 69, ...F6 }),
      rest(8, FB),
      drums(8, 'k:2! h:2? R:2 s:2 h:2? R:2?', { last: 'k:2! r:2 s:2 s:1 s:1 t:2 tl:2' }),
    ],
    N: [
      bars(FEST_N),
      bassLine(FEST.N, '1:12', { lo: 36, ...F6 }),
      rest(8, FB),
      pad(FEST.N, { center: 60, ...F6 }),
      // こだま: 笛の ふしの あとを 1オクターブ 上で
      bars(['r:6 G6:6?', 'r:6 F6:6?', 'r:6 D6:6?', 'r:6 G6:2? E6:2? C6:2?', 'r:6 A6:6?', 'r:6 F6:6?', 'r:6 B5:6?', 'r:6 G5:2? E5:2? G5:2?']),
      drums(8, 'R:2? r:10'),
    ],
    A3: [
      bars(FEST_A3),
      bassLine(FEST.A3, '1:2! 1:2 5:2 8:4 5:2', { lo: 38, ...F6 }),
      comp(FEST.A3, F_COMP, { center: 66, ...F6 }),
      guide(FEST.A3, 'x:6 x:6', { center: 74, ...F6 }),
      arp(FEST.A3, '0:2 1:2 2:2 3:2 4:2 3:2', { center: 81, ...F6 }),
      drums(8, 'k:2! h:2 k:2? s:2! h:2 h:2', { first: 'c:2! h:2 k:2? s:2! h:2 h:2' }),
    ],
    br: [
      bars(FEST_BR),
      bassLine(FEST.br, '1:6! 5:6', { lo: 36, ...F6 }),
      comp(FEST.br, 'x:2.! r:4 x:2.! r:4', { center: 65, ...F6 }),
      pad(FEST.br, { center: 62, ...F6 }),
      rest(2, FB),
      drums(2, 'k:2! h:2 h:2 s:2 h:2 h:2', { last: 'k:2! r:2 s:1 s:1 s:2 t:2 tl:2' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'N', 'A3', 'br'],
  loopFrom: 1,
};

// ═════════════ c9a_forest: 星ふるえの森（ホ長調 100）═════════════
// 知って いる 森（ささやきの森 forest の 頭: ミ・ファ#・ソ・ラ）が、星の 光で 少し ふしぎに なった。同じ 長さと 形で、ソ → ソ#・ラ → シ（明るい 音）。
//   和音は ホ長調に ハ長調・ニ長調の 和音を まぜる（ふしぎ。こわく しない）・B の さいごは ファ# の 長三和音（明るい ひかり）
//   高い オルゴールの きらきら・ベルの しずく・笛の メロディ
const FOR = {
  intro: ['E', 'Cmaj7'],
  A: ['E', 'Cmaj7', 'E', 'D', 'E', 'Cmaj7', 'Am', 'B'],
  B: ['C#m', 'A', 'E', 'B', 'C#m', 'A', 'F#', 'B'],
  A2: ['E', 'Cmaj7', 'E', 'D', 'E', 'Cmaj7', 'Am', 'B'],
  C: ['Cmaj7', 'D', 'Cmaj7', 'B'],
};
const FOR_A = [
  'E5:4! F#5:2 G#5:2 B5:4 G#5:2 F#5:2', 'G5:4 F#5:2 E5:2 G5:8', 'G#5:4! A#5:2 B5:2 E6:4 D#6:2 B5:2', 'D6:4 C#6:2 A5:2 F#5:8',
  'B5:4! A5:2 G#5:2 E5:4 F#5:2 G#5:2', 'E6:4 D6:2 B5:2 G5:8', 'A5:4 C6:4 E6:4 C6:4', 'D#6:8 B5:4 F#5:4',
];
const FOR_B = [
  'G#5:6! C#6:2 E6:8', 'C#6:4 B5:2 A5:2 E5:8', 'B5:6 G#5:2 E5:4 F#5:4', 'F#5:12 r:4',
  'E6:6! D#6:2 C#6:4 G#5:4', 'A5:6 B5:2 C#6:4 E6:4', 'A#5:6 C#6:2 F#6:8', 'D#6:4 C#6:4 B5:8',
];
const FOR_A2 = [
  'E5:4! F#5:2 G#5:2 B5:4 G#5:2 F#5:2', 'G5:4 F#5:2 E5:2 C6:8', 'B5:4! A#5:2 B5:2 E6:4 F#6:2 G#6:2', 'F#6:4 E6:2 D6:2 A5:8',
  'G#5:4! A5:2 B5:2 E6:4 D#6:2 B5:2', 'G5:4 E5:2 G5:2 E6:8', 'E6:4 C6:4 A5:4 C6:4', 'B5:8 D#6:4 F#6:4',
];
const FOR_C = ['G5:8 E5:8', 'F#5:8 A5:8', 'E6:8 G5:8', 'F#5:12 r:4'];
// きらきら（オルゴール）: 16分の 上がり下がり
const SPARK = '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 2:1';
const SPARK8 = '0:2 2:2 1:2 3:2 2:2 4:2 3:2 1:2';

const c9aForest = {
  bpm: 100, bar: 16, reverb: 0.36,
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.15, role: 'bass' },
    { i: 'musicbox', v: 0.028, role: 'harmony', minIntensity: 0, pan: 0.35 },
    { i: 'pad', v: 0.032, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'bell', v: 0.032, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { drums: true, v: 0.34, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(FOR.intro, '1:16', { lo: 40 }),
      arp(FOR.intro, SPARK, { center: 83 }),
      pad(FOR.intro, { center: 64 }),
      bars(['B6:4? r:4 G#6:4? r:4', 'E6:4? r:4 G6:4? r:4']),
      drums(2, 'r:16', { last: 'r:12 R:2? R:2' }),
    ],
    A: [
      bars(FOR_A),
      bassLine(FOR.A, '1:6! 5:2 8:4 5:4', { lo: 40 }),
      arp(FOR.A, SPARK8, { center: 81 }),
      pad(FOR.A, { center: 64 }),
      bars(['r:16', 'r:12 B6:4?', 'r:16', 'r:12 A6:4?', 'r:16', 'r:12 B6:4?', 'r:16', 'r:12 F#6:4?']),
      drums(8, 'k:4! h:2? R:2 r:2 h:2? R:4?'),
    ],
    B: [
      bars(FOR_B),
      bassLine(FOR.B, '1:4! 5:4 8:4 5:4', { lo: 37 }),
      arp(FOR.B, SPARK, { center: 81 }),
      pad(FOR.B, { center: 65 }),
      guide(FOR.B, 'x:8 x:8', { center: 76 }),
      drums(8, 'k:4! h:2? h:2? R:4 h:2? k:2?', { last: 'k:4! r:4 R:2 R:2 t:2? tl:2' }),
    ],
    A2: [
      bars(FOR_A2),
      bassLine(FOR.A2, '1:4! 1:2 5:2 8:4 5:4', { lo: 40 }),
      arp(FOR.A2, SPARK, { center: 83 }),
      pad(FOR.A2, { center: 65 }),
      guide(FOR.A2, 'x:4 x:4 x:8', { center: 79 }),
      drums(8, 'k:4! h:2? R:2 k:2 h:2? R:4?', { first: 'c:4? h:2? R:2 k:2 h:2? R:4?' }),
    ],
    // 光の しずく（たいこを 止め、ベルと オルゴールだけ 高く）
    C: [
      bars(FOR_C),
      bassLine(FOR.C, '1:16', { lo: 40 }),
      arp(FOR.C, '0:4 2:4 1:4 3:4', { center: 84 }),
      pad(FOR.C, { center: 62 }),
      bars(['E6:4? r:4 B6:4? r:4', 'F#6:4? r:4 A6:4? r:4', 'G6:4? r:4 E6:4? r:4', 'D#6:4? r:4 B5:4? r:4']),
      drums(4, 'r:16', { last: 'r:8 R:2? R:2? R:2 R:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2', 'C'],
  loopFrom: 1,
};

// ═════════════ c9a_child: 星の子の テーマ（ハ長調・イ短調 76）═════════════
// ド・レ・ミ（イ短調の 和音）→ ファ・ソ・ラ（ヘ長調の 和音）→ シ（ホ短調の 和音で とまる ＝ さびしさ）。
//   2回目は シ → ド（ハ長調）で とけて あたたかく なる。この 7つの 音が 第3部の「七つの 星の音」の もと（1つの 音が 1つの 星）
//   B は あたたかい 新しい ふし（ヘ長調の 和音から）。A2 は 笛の 対旋律と ハープ
const CHILD = {
  intro: ['F', 'C'],
  A: ['Am', 'F', 'Em', 'F G', 'Am', 'F', 'G', 'C'],
  B: ['F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'G'],
  A2: ['Am', 'F', 'Em', 'F G', 'Am', 'F', 'G', 'C'],
  br: ['F', 'G'],
};
// 7つの 音（ド〜シ）を 1つずつ たどる
export const C9A_SEVEN = ['C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5'];
const CHILD_A = [
  'C5:6! D5:2 E5:8', 'F5:6 G5:2 A5:8', 'B5:12 r:4', 'A5:4 G5:4 D5:8',
  'C5:6! D5:2 E5:8', 'F5:6 G5:2 A5:8', 'B5:8 D6:4 B5:4', 'C6:16',
];
const CHILD_B = [
  'A5:4! G5:4 F5:4 E5:4', 'D5:8 G5:8', 'E5:4 G5:4 B5:6 A5:2', 'A5:12 r:4',
  'F5:4 E5:4 D5:4 F5:4', 'G5:4 A5:4 B5:4 D6:4', 'C6:8 E6:4 D6:4', 'D6:4 B5:4 G5:8',
];
const CHILD_A2 = [
  'C5:6! D5:2 E5:8', 'F5:6 G5:2 A5:8', 'B5:8 E6:4 B5:4', 'A5:4 G5:4 E5:4 D5:4',
  'C5:6! D5:2 E5:8', 'F5:6 G5:2 A5:8', 'B5:8 D6:4 B5:4', 'C6:12 r:4',
];
const CHILD_BR = ['A5:8 C6:8', 'B5:12 r:4'];

const c9aChild = {
  bpm: 76, bar: 16, reverb: 0.42, night: {},
  parts: [
    { i: 'bell', v: 0.13, role: 'lead' },
    { i: 'sub_bass', v: 0.16, role: 'bass' },
    { i: 'pad', v: 0.032, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'flute', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'pluck', v: 0.034, role: 'harmony', minIntensity: 0, pan: 0.1 },
    { drums: true, v: 0.3, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(CHILD.intro, '1:16', { lo: 36 }),
      pad(CHILD.intro, { center: 62 }),
      rest(2),
      // ハープが 7つの 音を 下から 1つずつ
      bars([arp(['F'], '0:2 1:2 2:2 3:2 4:2 5:2 6:4', { center: 64 }), 'C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 B5:4']),
      drums(2, 'r:16', { last: 'r:12 R:4?' }),
    ],
    A: [
      bars(CHILD_A),
      bassLine(CHILD.A, '1:8! 5:8', { lo: 33 }),
      pad(CHILD.A, { center: 62 }),
      `${rest(4)} ${guide(CHILD.A.slice(4), 'x:8 x:8', { center: 69 })}`,
      arp(CHILD.A, '0:4 1:4 2:4 1:4', { center: 60 }),
      drums(8, 'R:8? R:4? r:4'),
    ],
    B: [
      bars(CHILD_B),
      bassLine(CHILD.B, '1:8! 5:4 8:4', { lo: 33 }),
      pad(CHILD.B, { center: 64 }),
      guide(CHILD.B, 'x:8 x:8', { center: 72 }),
      arp(CHILD.B, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 1:2', { center: 62 }),
      drums(8, 'k:4? r:4 R:4? r:4'),
    ],
    A2: [
      bars(CHILD_A2),
      bassLine(CHILD.A2, '1:8! 5:4 8:4', { lo: 33 }),
      pad(CHILD.A2, { center: 63 }),
      guide(CHILD.A2, 'x:4 x:4 x:8', { center: 69 }),
      arp(CHILD.A2, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 64 }),
      drums(8, 'k:4? r:4 R:4? r:2 R:2?'),
    ],
    br: [
      bars(CHILD_BR),
      bassLine(CHILD.br, '1:16', { lo: 36 }),
      pad(CHILD.br, { center: 62 }),
      rest(2),
      arp(CHILD.br, '0:2 1:2 2:2 3:2 4:2 5:2 6:4', { center: 64 }),
      drums(2, 'R:8? r:8'),
    ],
  },
  form: ['intro', 'A', 'B', 'A2', 'br'],
  loopFrom: 1,
};

// ═════════════ c9a_cave: 星の石の地下道（ニの ドリア 96）═════════════
// しずかで くらいが こわく ない（ドリアの シ ＝ ト長調の 和音の あかるさ）。光の輪の 遊び（明かりが ひろがる）に 合わせて、強さで パートが ふえる:
//   0.4（地下1階）笛・ハープの しずく・リムの きざみ ／ 0.6（地下2階）＋ 低音 ／ 0.8（地下3階）＋ のばし ／ 1.0（地下4階）＋ ベルの 対旋律・たいこ
//   強さは audio-scene.js の「ダンジョンの 深さ」（c9a_b1〜c9a_b4 → 0.4・0.6・0.8・1.0）
const CAVE = {
  intro: ['Dm', 'Dm'],
  A: ['Dm', 'G', 'Dm', 'G', 'F', 'C', 'Em', 'A'],
  B: ['F', 'G', 'Am', 'Dm', 'F', 'G', 'A', 'A'],
  A2: ['Dm', 'G', 'Dm', 'G', 'F', 'C', 'Em', 'A'],
  br: ['G', 'A'],
};
const CAVE_A = [
  'D5:6! F5:2 A5:8', 'B5:6 A5:2 G5:8', 'F5:4 D5:4 A4:8', 'D5:16',
  'C5:6! F5:2 A5:8', 'G5:6 E5:2 C5:8', 'B4:4 E5:4 G5:4 B5:4', 'C#6:8 A5:4 E5:4',
];
const CAVE_B = [
  'A5:6! C6:2 F6:8', 'D6:6 B5:2 G5:8', 'C6:6 B5:2 A5:4 E5:4', 'F5:12 r:4',
  'A5:4 C6:4 F6:4 E6:4', 'D6:6 C6:2 B5:8', 'C#6:6 B5:2 A5:4 E5:4', 'E5:12 r:4',
];
const CAVE_A2 = [
  'A5:6! D6:2 F6:8', 'D6:6 C6:2 B5:8', 'A5:4 F5:4 D5:4 F5:4', 'D5:4 G5:4 B5:8',
  'A5:6! G5:2 F5:8', 'E5:6 G5:2 C6:8', 'B5:4 G5:4 E5:4 G5:4', 'A5:8 C#6:4 E6:4',
];
const CAVE_BR = ['B5:8 D6:8', 'C#6:8 E5:8'];
// しずく（高い ハープ。ぽつ・ぽつ と 間を あけて）
const DRIP = '0:2. r:2 2:2. r:2 1:2. r:2 3:2. r:2';
const TICK = 'R:4! r:4 R:2? r:2 h:4?';

const c9aCave = {
  bpm: 96, bar: 16, reverb: 0.42, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead', minIntensity: 0 },
    { i: 'sub_bass', v: 0.17, role: 'bass', minIntensity: 0.6 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { i: 'pad', v: 0.032, role: 'harmony', minIntensity: 0.8, pan: -0.35 },
    { i: 'bell', v: 0.034, role: 'harmony', minIntensity: 1, pan: 0.3 },
    { drums: true, v: 0.34, minIntensity: 0 },
    { drums: true, v: 0.36, minIntensity: 1 },
  ],
  sections: {
    intro: [
      bars(['r:8 A4:8?', 'D5:16?']),
      bassLine(CAVE.intro, '1:16', { lo: 38 }),
      arp(CAVE.intro, DRIP, { center: 74 }),
      pad(CAVE.intro, { center: 62 }),
      rest(2),
      drums(2, TICK),
      rest(2),
    ],
    A: [
      bars(CAVE_A),
      bassLine(CAVE.A, '1:8! 5:4 8:4', { lo: 38 }),
      arp(CAVE.A, DRIP, { center: 74 }),
      pad(CAVE.A, { center: 62 }),
      `${rest(4)} ${guide(CAVE.A.slice(4), 'x:8 x:8', { center: 79 })}`,
      drums(8, TICK),
      drums(8, 'k:4! r:4 r:2 k:2? r:4'),
    ],
    B: [
      bars(CAVE_B),
      bassLine(CAVE.B, '1:6! 1:2 5:4 8:4', { lo: 38 }),
      arp(CAVE.B, '0:2. 2:2. 1:2. 3:2. 2:2. 4:2. 3:2. 1:2.', { center: 74 }),
      pad(CAVE.B, { center: 64 }),
      guide(CAVE.B, 'x:4 x:4 x:8', { center: 81 }),
      drums(8, 'R:4! h:2? h:2? R:4 h:2? h:2?'),
      drums(8, 'k:4! r:2 k:2 s:4? r:4', { last: 'k:4! r:4 t:2? t:2 tl:2 tl:2' }),
    ],
    A2: [
      bars(CAVE_A2),
      bassLine(CAVE.A2, '1:4! 8:4 1:4 5:4', { lo: 38 }),
      arp(CAVE.A2, '0:2. r:2 2:2. 1:2. r:2 3:2. 2:2. r:2', { center: 76 }),
      pad(CAVE.A2, { center: 63 }),
      guide(CAVE.A2, 'x:6 x:2 x:8', { center: 79 }),
      drums(8, 'R:2! h:2? h:2? h:2? R:2 h:2? h:2? h:2?'),
      drums(8, 'k:4! r:4 R:4 r:2 k:2?'),
    ],
    br: [
      bars(CAVE_BR),
      bassLine(CAVE.br, '1:16', { lo: 38 }),
      arp(CAVE.br, DRIP, { center: 74 }),
      pad(CAVE.br, { center: 62 }),
      rest(2),
      drums(2, TICK),
      drums(2, 'k:4! r:12', { last: 'r:8 tl:2? t:2? th:2? R:2?' }),
    ],
  },
  form: ['intro', 'A', 'B', 'A2', 'br'],
  loopFrom: 1,
};

// ═════════════ c9a_trio: 3人組と メカの 戦い（ヘ長調 144）═════════════
// 明るく どたばた した 行進（ポルカの ブン・チャッ）。スタッカートの メロディ・マリンバの うら打ち・ブラスの「ジャン！」。
//   B は 悪だくみ（ニ短調。半音の となりの 音で こそこそ）→ C は おいかけっこ（走る ベース）→ A2 → D は メカ（同じ 音を きざむ）
//   にくめない 敵（こわく ない）。ある 作品の 曲を まねて いない
const TRIO = {
  intro: ['F', 'C7'],
  A: ['F', 'F', 'C7', 'C7', 'F', 'Bb', 'C7', 'F'],
  B: ['Dm', 'Dm', 'A7', 'A7', 'Dm', 'Gm', 'A7', 'A7'],
  C: ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C7', 'F', 'C7'],
  A2: ['F', 'F', 'C7', 'C7', 'F', 'Bb', 'C7', 'F'],
  D: ['Bb', 'F', 'Bb', 'F', 'Gm', 'Dm', 'G', 'C7'],
};
const TRIO_A = [
  'C5:2.! F5:2. A5:2. F5:2. C6:4! A5:2. r:2', 'A5:2.! G5:2. F5:2. G5:2. A5:4 r:4', 'G5:2.! Bb5:2. G5:2. E5:2. C5:4! E5:2. G5:2.', 'Bb5:4 A5:2. G5:2. C6:4! r:4',
  'C5:2.! F5:2. A5:2. F5:2. C6:4! A5:2. r:2', 'D6:4! C6:2. Bb5:2. F5:4 D5:4', 'E5:2.! G5:2. Bb5:2. G5:2. E5:2. D5:2. C5:2. E5:2.', 'F5:4! r:2 C5:2. F5:4! r:4',
];
const TRIO_B = [
  'D5:2.! r:2 D5:2. E5:2. F5:2. r:2 F5:2. G5:2.', 'A5:4! G#5:2. A5:2. F5:4 D5:4', 'E5:2.! r:2 E5:2. F5:2. G5:2. r:2 G5:2. A5:2.', 'C#6:4! B5:2. C#6:2. A5:8',
  'D6:2.! r:2 D6:2. C6:2. A5:2. r:2 F5:2. A5:2.', 'Bb5:4! A5:2. G5:2. D5:4 G5:4', 'A5:2. G5:2. F5:2. E5:2. C#5:4! E5:4', 'A4:2.! r:2 A4:2. r:2 G5:4! r:4',
];
const TRIO_C = [
  'F5:2! G5:2 A5:2 Bb5:2 D6:4 Bb5:4', 'E5:2! F5:2 G5:2 A5:2 C6:4 G5:4', 'A5:2! B5:2 C6:2 D6:2 E6:4 C6:4', 'F6:4! E6:2 D6:2 A5:8',
  'G5:2! A5:2 Bb5:2 C6:2 D6:4 Bb5:4', 'C6:2! Bb5:2 A5:2 G5:2 E5:4 G5:4', 'A5:4! F5:4 C6:4 A5:4', 'G5:2. G5:2. G5:2. r:2 Bb5:4! r:4',
];
const TRIO_A2 = [
  'C5:2.! F5:2. A5:2. F5:2. C6:4! A5:2. r:2', 'A5:2.! Bb5:2. A5:2. G5:2. F5:2. G5:2. A5:4', 'G5:2.! Bb5:2. G5:2. E5:2. C5:4! E5:2. G5:2.', 'C6:2.! Bb5:2. A5:2. G5:2. E5:2. G5:2. C6:4!',
  'C5:2.! F5:2. A5:2. F5:2. C6:4! A5:2. r:2', 'D6:4! C6:2. Bb5:2. F5:4 D5:4', 'E5:2.! G5:2. Bb5:2. G5:2. E5:2. D5:2. C5:2. E5:2.', 'F5:2.! A5:2. C6:2. F6:2.! r:2 C6:2. F5:4!',
];
// メカ: 同じ 音を きざむ（ガシャン ガシャン）
const TRIO_D = [
  'F5:2.! F5:2. F5:2. F5:2. D5:4! F5:4', 'A5:2.! A5:2. A5:2. A5:2. C6:4! A5:4', 'Bb5:2.! Bb5:2. A5:2. Bb5:2. D6:4! Bb5:4', 'C6:8! A5:4 F5:4',
  'G5:2.! Bb5:2. D6:2. Bb5:2. G5:4! D5:4', 'F5:2.! A5:2. D6:2. A5:2. F5:4! A5:4', 'B5:4! D6:4 G6:4 D6:4', 'E6:2.! r:2 C6:2. r:2 Bb5:2. r:2 G5:2. E5:2.',
];
const OOMPAH = '1:4! 5:4 1:4 5:4';

const c9aTrio = {
  bpm: 144, bar: 16, reverb: 0.18, fill: 0,
  parts: [
    { i: 'lead', w: 'square', v: 0.085, role: 'lead' },
    { i: 'bass', v: 0.18, role: 'bass' },
    { i: 'marimba', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.35 },
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'chip_square', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.1 },
    { drums: true, v: 0.5, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(TRIO.intro, ['1:4! r:4 1:4 r:4', '1:2 1:2 1:2 1:2 5:8!'], { lo: 41, sp: FLAT }),
      rest(2),
      comp(TRIO.intro, ['x:2.! r:2 x:2.! r:2 x:4! r:4', 'x:2.! r:2 x:2.! r:2 x:2.! r:2 x:4!'], { center: 62, sp: FLAT }),
      rest(2),
      drums(2, ['k:2! r:2 k:2! r:2 s:4! r:4', 'k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1 c:4!']),
    ],
    A: [
      bars(TRIO_A),
      bassLine(TRIO.A, OOMPAH, { lo: 41, sp: FLAT }),
      comp(TRIO.A, 'r:4 x:4. r:4 x:4.', { center: 64, sp: FLAT }),
      `${rest(4)} ${comp(TRIO.A.slice(4), 'x:2.! r:6 x:2.! r:6', { center: 60, sp: FLAT })}`,
      rest(8),
      drums(8, 'k:4! s:4 k:4 s:4', { last: 'k:4! s:4 s:2 s:2 t:2 tl:2' }),
    ],
    B: [
      bars(TRIO_B),
      bassLine(TRIO.B, '1:2.! r:2 1:2. 5:2. 1:2.! r:2 8:2. 5:2.', { lo: 38, sp: FLAT }),
      arp(TRIO.B, '0:2. r:2 1:2. r:2 2:2. r:2 1:2. r:2', { center: 62, sp: FLAT }),
      guide(TRIO.B, 'x:8 x:8', { center: 58, sp: FLAT }),
      rest(8),
      drums(8, 'k:4! R:2 R:2 k:4 R:2 p:2', { last: 'k:2! r:2 k:2! r:2 r:4 c:4!' }),
    ],
    C: [
      bars(TRIO_C),
      bassLine(TRIO.C, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2', { lo: 38, sp: FLAT }),
      comp(TRIO.C, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 64, sp: FLAT }),
      comp(TRIO.C, 'x:2.! r:4 x:2.! r:8', { center: 60, sp: FLAT }),
      guide(TRIO.C, 'x:4 x:4 x:4 x:4', { center: 72, sp: FLAT }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    A2: [
      bars(TRIO_A2),
      bassLine(TRIO.A2, '1:4! 5:2 5:2 1:4 5:4', { lo: 41, sp: FLAT }),
      comp(TRIO.A2, 'r:4 x:2. x:2. r:4 x:2. x:2.', { center: 64, sp: FLAT }),
      guide(TRIO.A2, 'x:4 x:4 x:8', { center: 65, sp: FLAT }),
      guide(TRIO.A2, 'x:8 x:8', { center: 76, sp: FLAT }),
      drums(8, 'k:4! s:2 k:2 k:4 s:4', { first: 'c:4! s:2 k:2 k:4 s:4', last: 'k:4! s:2 s:2 s:1 s:1 t:1 t:1 tl:2 c:2!' }),
    ],
    D: [
      bars(TRIO_D),
      bassLine(TRIO.D, '1:2.! 1:2. 1:2. 1:2. 1:4! 5:4', { lo: 38, sp: FLAT }),
      arp(TRIO.D, '0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1 0:1 1:1 2:1 1:1', { center: 66, sp: FLAT }),
      comp(TRIO.D, 'x:4! r:4 x:4! r:4', { center: 60, sp: FLAT }),
      rest(8),
      drums(8, 'k:2! k:2 s:2! h:2 k:2! k:2 s:2! p:2', { last: 'k:2! k:2 s:2! s:2 t:2 t:2 tl:2 c:2!' }),
    ],
  },
  form: ['intro', 'A', 'B', 'C', 'A2', 'D'],
  loopFrom: 1,
  // ピンチ: 主音と 半音の となり（こまって いるのに どこか おかしい）
  pinch: { n: 'F6:2 E6:2 F6:2 C6:2 F6:2 E6:2 F6:2 Gb6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c9a_trial: ともしびの ためし（ト短調 → ト長調 100）═════════════
// おごそかな ためし。夜（ト短調。笛ひとつと オルガン・低い たいこ）→ 夜明け前（変ロ長調。ブラスが 入り、高く なる）→ 夜明け（ト長調。ベルの 光・いちばん 高い）
//   夜明けの ふし（D1）は 星の子の 7つの 音（ソ・ラ・シ・ド・レ・ミ・ファ#）を のぼる ＝ 星の子の 光が 夜を こえる
//   時間で もりあがる: はじめの 1回だけ 夜（intro・N1・N2）・T1 → そのあと T2・D1・D2・D3・Dx を くりかえす（だん 0）
//   夜明けの めもりで つなぐ 時（B班。docs/plan-part3.md の「実装メモ（F班）」）: だん 1 夜明け前から ／ だん 2 夜明けだけ ／ だん 3 夜明けを 2つ 上で
const TRIAL = {
  intro: ['Gm', 'Gm'],
  N1: ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Cm', 'D', 'D'],
  N2: ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Cm', 'D', 'D'],
  T1: ['Eb', 'F', 'Bb', 'Gm', 'Eb', 'F', 'Dm', 'D'],
  T2: ['Eb', 'F', 'Gm', 'Gm', 'Eb', 'F', 'D', 'D'],
  D1: ['G', 'C', 'D', 'G', 'Em', 'C', 'Am', 'D'],
  D2: ['G', 'Bm', 'C', 'G', 'Em', 'C', 'D', 'D'],
  D3: ['C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G'],
  Dx: ['C', 'D', 'G', 'D'],
};
const TRIAL_N1 = [
  'G4:8! Bb4:4 D5:4', 'D5:6 C5:2 Bb4:8', 'G4:8! Bb4:4 Eb5:4', 'D5:6 C5:2 A4:8',
  'Bb4:8! D5:4 G5:4', 'G5:6 F5:2 Eb5:8', 'D5:4 F#5:4 A5:4 F#5:4', 'D5:12 r:4',
];
const TRIAL_N2 = [
  'D5:8! G5:4 Bb5:4', 'Bb5:6 A5:2 G5:8', 'G5:8! Bb5:4 Eb6:4', 'D6:6 C6:2 A5:8',
  'Bb5:6 A5:2 G5:4 D5:4', 'Eb5:6 F5:2 G5:4 C6:4', 'A5:4 F#5:4 D5:4 F#5:4', 'A5:12 r:4',
];
const TRIAL_T1 = [
  'G5:6! Bb5:2 Eb6:8', 'C6:6 A5:2 F5:8', 'D6:6 C6:2 Bb5:8', 'Bb5:6 A5:2 G5:8',
  'Eb6:6 D6:2 Bb5:4 G5:4', 'A5:6 C6:2 F6:8', 'F6:6 E6:2 D6:4 A5:4', 'F#5:8 A5:8',
];
const TRIAL_T2 = [
  'G5:4! Bb5:4 Eb6:4 G6:4', 'F6:6 Eb6:2 C6:8', 'D6:6 C6:2 Bb5:4 G5:4', 'D6:12 r:4',
  'Eb6:4 D6:4 Bb5:4 G5:4', 'A5:4 C6:4 F6:8', 'F#6:6 E6:2 D6:4 A5:4', 'D6:8 F#6:4 A6:4',
];
const TRIAL_D1 = [
  'G5:6! A5:2 B5:8', 'C6:6 D6:2 E6:8', 'F#6:12 r:4', 'G6:8 D6:4 B5:4',
  'E6:6 D6:2 B5:8', 'C6:6 B5:2 G5:8', 'A5:6 B5:2 C6:4 E6:4', 'D6:12 r:4',
];
const TRIAL_D2 = [
  'B5:6! A5:2 G5:8', 'F#5:6 G5:2 B5:8', 'C6:6 D6:2 E6:8', 'D6:12 r:4',
  'G6:6 F#6:2 E6:8', 'E6:6 D6:2 C6:8', 'A5:4 D6:4 F#6:4 A6:4', 'F#6:8 D6:8',
];
const TRIAL_D3 = [
  'E6:6! D6:2 C6:8', 'D6:6 E6:2 F#6:8', 'F#6:6 E6:2 D6:8', 'B5:12 r:4',
  'C6:4 D6:4 E6:4 G6:4', 'F#6:6 G6:2 A6:8', 'G6:16', 'D6:8 B5:8',
];
const TRIAL_DX = ['E6:8 G6:8', 'F#6:8 A6:8', 'G6:16', 'r:16'];
const HEART = 'tl:4! r:4 tl:4? r:4';

const c9aTrial = {
  bpm: 100, bar: 16, reverb: 0.4, fill: 0,
  parts: [
    { i: 'flute', v: 0.1, role: 'lead' },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'organ', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.05 },
    { i: 'bell', v: 0.034, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { drums: true, v: 0.45, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(TRIAL.intro, '1:16', { lo: 31, sp: FLAT }),
      pad(TRIAL.intro, { center: 58, sp: FLAT }),
      rest(2),
      rest(2),
      drums(2, HEART),
    ],
    N1: [
      bars(TRIAL_N1),
      bassLine(TRIAL.N1, '1:16', { lo: 31, sp: FLAT }),
      pad(TRIAL.N1, { center: 58, sp: FLAT }),
      rest(8),
      rest(8),
      drums(8, HEART),
    ],
    N2: [
      bars(TRIAL_N2),
      bassLine(TRIAL.N2, '1:8! 5:8', { lo: 31, sp: FLAT }),
      pad(TRIAL.N2, { center: 60, sp: FLAT }),
      rest(8),
      // 星（ベルの しずく）
      bars(['r:8 D6:4? r:4', 'r:8 G6:4? r:4', 'r:8 Bb6:4? r:4', 'r:8 A6:4? r:4', 'r:8 D6:4? r:4', 'r:8 G6:4? r:4', 'r:8 F#6:4? r:4', 'r:8 A6:4? r:4']),
      drums(8, 'tl:4! r:4 tl:4 r:2 tl:2?'),
    ],
    T1: [
      bars(TRIAL_T1),
      bassLine(TRIAL.T1, '1:8! 5:4 8:4', { lo: 31, sp: FLAT }),
      pad(TRIAL.T1, { center: 60, sp: FLAT }),
      guide(TRIAL.T1, 'x:8 x:8', { center: 60, sp: FLAT }),
      arp(TRIAL.T1, '0:4 1:4 2:4 1:4', { center: 74, sp: FLAT }),
      drums(8, 'k:4! r:4 tl:4 r:2 t:2?'),
    ],
    T2: [
      bars(TRIAL_T2),
      bassLine(TRIAL.T2, '1:4! 1:4 5:4 8:4', { lo: 31, sp: FLAT }),
      pad(TRIAL.T2, { center: 62, sp: FLAT }),
      guide(TRIAL.T2, 'x:4 x:4 x:8', { center: 63, sp: FLAT }),
      arp(TRIAL.T2, '0:2 1:2 2:2 1:2 0:2 1:2 2:2 3:2', { center: 76, sp: FLAT }),
      drums(8, 'k:4! h:2? h:2? s:4 h:2? k:2', { last: 'k:4! r:2 tl:2 t:2 t:2 th:2 th:2' }),
    ],
    D1: [
      bars(TRIAL_D1),
      bassLine(TRIAL.D1, '1:4! 8:4 5:4 8:4', { lo: 31 }),
      pad(TRIAL.D1, { center: 64 }),
      guide(TRIAL.D1, 'x:8 x:8', { center: 64 }),
      arp(TRIAL.D1, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 79 }),
      drums(8, 'k:4! h:2 h:2 s:4! h:2 k:2', { first: 'c:4! h:2 h:2 s:4! h:2 k:2' }),
    ],
    D2: [
      bars(TRIAL_D2),
      bassLine(TRIAL.D2, '1:2! 1:2 8:2 1:2 5:2! 1:2 8:2 5:2', { lo: 31 }),
      pad(TRIAL.D2, { center: 65 }),
      comp(TRIAL.D2, 'x:4! r:2 x:2 x:4 r:4', { center: 62 }),
      arp(TRIAL.D2, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 79 }),
      drums(8, 'k:2! h:2 h:2 h:2 s:2! h:2 k:2 h:2', { last: FILL }),
    ],
    D3: [
      bars(TRIAL_D3),
      bassLine(TRIAL.D3, '1:4! 8:4 1:4 8:4', { lo: 31 }),
      pad(TRIAL.D3, { center: 66 }),
      guide(TRIAL.D3, 'x:4 x:4 x:4 x:4', { center: 67 }),
      arp(TRIAL.D3, '0:2 1:2 2:2 3:2 4:2 5:2 4:2 3:2', { center: 81 }),
      drums(8, 'k:2! h:2 s:2 h:2 k:2! k:2 s:2! h:2', { first: 'c:2! h:2 s:2 h:2 k:2! k:2 s:2! h:2' }),
    ],
    // 日の 出の 和音（ブラスの のばし・ティンパニの ロール）
    Dx: [
      bars(TRIAL_DX),
      bassLine(TRIAL.Dx, '1:16', { lo: 31 }),
      pad(TRIAL.Dx, { center: 64 }),
      pad(TRIAL.Dx, { center: 60 }),
      arp(TRIAL.Dx, '0:4 1:4 2:4 3:4', { center: 84 }),
      drums(4, 'k:4! r:12', { first: 'c:4! r:12', last: 'tl:1 tl:1 tl:1 tl:1 tl:1 tl:1 tl:1 tl:1 t:1 t:1 t:1 t:1 th:1 th:1 th:1 th:1!' }),
    ],
  },
  form: ['intro', 'N1', 'N2', 'T1', 'T2', 'D1', 'D2', 'D3', 'Dx'],
  loopFrom: 4,
  // だん（夜明けの めもり）: キーと テンポは だん 3 だけ 上げる。形は 夜明け前 → 夜明け
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1, form: ['T1', 'T2', 'D1', 'D2', 'D3', 'Dx'], loopFrom: 1 },
    { transpose: 0, tempo: 1, form: ['D1', 'D2', 'D3', 'Dx'], loopFrom: 0 },
    { transpose: 2, tempo: 1.03, form: ['D1', 'D2', 'D3', 'Dx'], loopFrom: 0 },
  ],
  pinch: { n: 'G6:4 D6:4 G6:4 D6:4', i: 'bell', v: 0.03 },
};

// ═════════════ battle3: 第3部の ふつうの 戦い（ロ短調 166）═════════════
// 第1部（ホ短調 164）・第2部（ト短調 170）と ちがう キー。弦の のばしと オルゴールの きらきらで 広がりを 出す。
//   B（サビ）は ニ長調で 星の子の 7つの 音（レ・ミ・ファ#・ソ・ラ・シ・ド#）を のぼる
const B3 = {
  intro: ['Bm', 'F#'],
  A: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
  A2: ['Bm', 'G', 'D', 'A', 'G', 'A', 'F#m', 'A'],
  B: ['D', 'G', 'A', 'D', 'Bm', 'G', 'Em', 'A'],
  C: ['Bm', 'Bm', 'G', 'G', 'Em', 'Em', 'F#', 'F#'],
  D: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D'],
  br: ['Em', 'F#', 'G', 'F#'],
};
const B3_A = [
  'B4:2! D5:2 F#5:2 B5:4 A5:2 F#5:2 D5:2', 'G5:4! F#5:2 G5:2 B5:4 D6:4', 'A5:4! F#5:2 D5:2 A5:6 F#5:2', 'E5:4! C#5:2 E5:2 A5:8',
  'B5:2! C#6:2 D6:2 F#6:4 E6:2 D6:2 C#6:2', 'B5:4! G5:2 B5:2 D6:4 G6:4', 'E6:4! D6:2 B5:2 G5:4 E5:4', 'F#5:4! A#5:4 C#6:6 r:2',
];
const B3_A2 = [
  'B4:2! D5:2 F#5:2 B5:4 A5:2 F#5:2 D5:2', 'G5:4! F#5:2 G5:2 B5:4 D6:4', 'A5:4! F#5:2 D5:2 A5:6 F#5:2', 'E5:4! C#5:2 E5:2 A5:8',
  'D6:4! B5:2 G5:2 D6:4 G6:4', 'E6:4! C#6:2 A5:2 E6:4 A6:4', 'F#6:6 E6:2 C#6:4 A5:4', 'E6:4 C#6:2 A5:2 E5:8',
];
const B3_B = [
  'D5:6! E5:2 F#5:8', 'G5:6 A5:2 B5:8', 'C#6:12 E6:4', 'D6:8! A5:4 F#5:4',
  'B5:6 C#6:2 D6:8', 'D6:4 B5:2 G5:2 B5:4 D6:4', 'E6:6 F#6:2 G6:8', 'E6:4 C#6:4 A5:4 E5:4',
];
const B3_C = [
  'F#5:3! F#5:3 B5:2 A5:3 F#5:3 D5:2', 'B5:3! B5:3 D6:2 C#6:4 B5:4', 'G5:3! G5:3 B5:2 D6:3 B5:3 G5:2', 'D6:4! E6:2 D6:2 B5:8',
  'E5:3! E5:3 G5:2 B5:3 G5:3 E5:2', 'G5:4! A5:2 B5:2 E6:8', 'F#5:3! F#5:3 A#5:2 C#6:3 A#5:3 F#5:2', 'C#6:4! A#5:4 F#5:8',
];
const B3_D = [
  'B5:8! D6:8', 'C#6:8 E6:8', 'F#6:8 C#6:8', 'D6:12 r:4',
  'G5:8 B5:4 D6:4', 'C#6:8 A5:4 E6:4', 'F#6:8 D6:8', 'A5:12 r:4',
];
const B3_BR = ['G5:4! B5:4 E6:8', 'F#5:4 A#5:4 C#6:8', 'B5:4 D6:4 G6:8', 'F#6:4! C#6:4 A#5:4 F#5:4'];
const B3_DR = 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2';

const battle3 = {
  bpm: 166, bar: 16, reverb: 0.2, fill: 0,
  parts: [
    { i: 'lead', w: 'square', v: 0.085, role: 'lead' },
    { i: 'bass', v: 0.19, role: 'bass' },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'brass', v: 0.042, role: 'harmony', minIntensity: 0, pan: -0.05 },
    { i: 'musicbox', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.4 },
    { drums: true, v: 0.55, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(B3.intro, ['1:2! 1:2 1:2! 1:2 1:2! 1:2 1:2 8:2', '1:2! 1:2 1:2! 1:2 1:1 1:1 1:1 1:1 8:4!'], { lo: 35 }),
      pad(B3.intro, { center: 64 }),
      comp(B3.intro, ['x:2.! r:2 x:2.! r:2 x:2.! r:2 x:4!', 'x:2.! r:2 x:2.! r:2 x:4! x:4!'], { center: 62 }),
      arp(B3.intro, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 79 }),
      drums(2, ['k:2! r:2 k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1', 'c:2! r:2 k:2! r:2 t:2 t:2 tl:2 tl:2']),
    ],
    A: [
      bars(B3_A),
      bassLine(B3.A, '1:2! 1:2 8:2 1:2 1:2! 1:2 8:2 5:2', { lo: 35 }),
      pad(B3.A, { center: 62 }),
      rest(8),
      arp(B3.A, '0:2 1:2 2:2 3:2 2:2 1:2 2:2 3:2', { center: 79 }),
      drums(8, B3_DR, { last: FILL }),
    ],
    A2: [
      bars(B3_A2),
      bassLine(B3.A2, '1:2! 8:2 1:2 8:2 1:2! 8:2 5:2 8:2', { lo: 35 }),
      pad(B3.A2, { center: 64 }),
      guide(B3.A2, 'x:8 x:8', { center: 62 }),
      arp(B3.A2, '0:2 2:2 1:2 3:2 2:2 4:2 3:2 1:2', { center: 79 }),
      drums(8, B3_DR, { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    B: [
      bars(B3_B),
      bassLine(B3.B, '1:4! 8:2 1:2 5:4 8:4', { lo: 38 }),
      pad(B3.B, { center: 66 }),
      guide(B3.B, 'x:4 x:4 x:8', { center: 64 }),
      arp(B3.B, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 81 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2! h:2 s:2! o:2', { first: 'c:2! h:2 s:2! h:2 k:2! h:2 s:2! o:2', last: FILL }),
    ],
    C: [
      bars(B3_C),
      bassLine(B3.C, '1:3! 1:3 1:2 1:3! 1:3 5:2', { lo: 35 }),
      pad(B3.C, { center: 62 }),
      comp(B3.C, 'x:3.! x:3. r:2 x:3.! x:3. r:2', { center: 60 }),
      rest(8),
      drums(8, 'k:3! k:3 s:2! k:3 k:3 s:2!', { last: 'k:3! k:3 s:2! s:2 t:2 tl:2 c:2!' }),
    ],
    D: [
      bars(B3_D),
      bassLine(B3.D, '1:4! 8:4 5:4 8:4', { lo: 38 }),
      pad(B3.D, { center: 66 }),
      guide(B3.D, 'x:8 x:8', { center: 62 }),
      arp(B3.D, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 81 }),
      drums(8, 'k:4! h:2 h:2 s:4! h:2 k:2', { first: 'c:4! h:2 h:2 s:4! h:2 k:2' }),
    ],
    br: [
      bars(B3_BR),
      bassLine(B3.br, '1:2! 1:2 1:2 8:2 1:2! 1:2 5:2 8:2', { lo: 35 }),
      pad(B3.br, { center: 64 }),
      comp(B3.br, 'x:2.! r:2 x:2.! r:2 x:4! r:4', { center: 62 }),
      arp(B3.br, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 79 }),
      drums(4, 'k:2! h:2 s:2! h:2 k:2 s:1 s:1 s:2 s:2', { last: 'c:4! r:4 tl:2 t:2 th:2 s:2' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C', 'D', 'br'],
  loopFrom: 1,
  // ピンチ: 主音（シ）と 半音上の ド（ロ短調。ふつうの きまりの 主音は ベースの 長さで きまり、この 曲では ソに なる ので 書く）
  pinch: { n: 'B6:2 C7:2 B6:2 F#6:2 B6:2 C7:2 B6:2 D7:2', i: 'chip_arp', v: 0.035 },
};

// 新しい id の 曲の ch: 古い テスト（tr.ch を 前の 書き方で 見る）と「前の音」用に、自分の 楽譜を 前の 書き方へ うつした もの
// （しるしを とる・和音は いちばん 上の 音・ふえた たいこは k/s/h。form の じゅんに つなぐ）。audio-c8r.js の oldView と 同じ 考え方
//   c9a_festival の「前の音」は お祭りの 曲（legacyOf: 'festival'）
const OLD_DRUM = { k: 'k', s: 's', h: 'h', o: 'h', c: 'h', p: 's', R: 's', t: 'k', th: 'k', tl: 'k', r: 'r' };
const toks = (x) => String(x).trim().match(/\[[^\]]*\](?::\S*)?|\S+/g) || [];
const tokLen = (t) => Number(/:(\d+)/.exec(t.slice(t.lastIndexOf(']') + 1))[1]);
function oldView(tr) {
  const sec = (name) => (Array.isArray(tr.sections[name]) ? tr.sections[name] : tr.sections[name].ch);
  return tr.parts.map((p, i) => ({
    ...(p.drums ? { drums: true } : { w: p.w || (p.role === 'bass' ? 'triangle' : 'square') }),
    v: p.v,
    n: tr.form.map((name) => {
      const list = sec(name);
      const steps = Math.max(...list.map((x) => (x ? toks(x).reduce((a, t) => a + tokLen(t), 0) : 0)));
      if (!list[i]) return `r:${steps}`;
      return toks(list[i]).map((t) => {
        const len = tokLen(t);
        const name2 = t[0] === '[' ? t.slice(1, t.indexOf(']')).trim().split(/\s+/).pop() : t.split(':')[0];
        return `${p.drums ? OLD_DRUM[name2] : name2}:${len}`;
      }).join(' ');
    }).join(' '),
  }));
}
for (const tr of [c9aFestival, c9aForest, c9aChild, c9aCave, c9aTrio, c9aTrial, battle3]) tr.ch = oldView(tr);

// 曲の id は shared/maps/c9a-flags.js の C9A_TRACKS と 同じ（かえない）。battle3 は audio-scene.js の PART3_BATTLE
export const C9A_TRACKS = {
  c9a_festival: c9aFestival,
  c9a_forest: c9aForest,
  c9a_child: c9aChild,
  c9a_cave: c9aCave,
  c9a_trio: c9aTrio,
  c9a_trial: c9aTrial,
  battle3,
};
export const C9A_IDS = Object.keys(C9A_TRACKS);
