// 第77回 B: 作りなおした 曲 その2（フィールド・町・洞窟・千年前の フィールド・第7章 第8章の ダンジョン）。audio.js が 前の 曲の 上に かぶせる。
// 前の データは audio.js が 自動で legacy（前の音）と ch（古い テスト用）に のこす。書き方は docs/plan-r77-audio.md の 2
// 曲の せつめい（キー・和音・形・強さの 段）は docs/plan-r77-audio-b2.md。曲は すべて オリジナル
//
// ・メロディは 手で 書く（1小節 = 16分音符 16）。ベース・きざみ・和音・たいこは 和音の ならびから 下の 小さな 道具で 作る
// ・ダンジョン・洞窟の 曲は 強さ（setIntensity）で パートが ふえる: 0 = メロディ・ベース・きざみ・軽い たいこ／0.55 = しっかりした たいこ／0.8 = 対旋律・厚い 和音

// ───────────── 小さな 道具 ─────────────
const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const QUAL = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus4: [0, 5, 7], dim: [0, 3, 6],
};
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const FLAT = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const B16 = 16;
const nm = (m, sp) => `${sp[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

function chordOf(sym) {
  const [main, sl] = sym.split('/');
  const m = /^([A-G][#b]?)(.*)$/.exec(main);
  if (!m || !QUAL[m[2]]) throw new Error(`r77b chord: ${sym}`);
  return { root: PC[m[1]], iv: QUAL[m[2]], bass: sl ? PC[sl] : PC[m[1]] };
}

// 和音の ならび（1小節に 'D' か 'Em A'（小節を 等分））→ その 小節の その 場所の 和音
function chordAt(bar, step) {
  const syms = bar.trim().split(/\s+/);
  const k = Math.min(syms.length - 1, Math.floor((step * syms.length) / B16));
  return chordOf(syms[k]);
}

// 型（'1:2! 5:2.' など）を 小節ごとに 読んで、1つずつ fn（和音・場所・しるし）で 音に する。型が 配列なら 小節ごとに かわるがわる
function walk(prog, pat, fn) {
  const pats = Array.isArray(pat) ? pat : [pat];
  return prog.map((bar, bi) => {
    const p = pats[bi % pats.length];
    let step = 0;
    return p.trim().split(/\s+/).map((tok) => {
      const mm = /^([^:]+):(\d+)([!?.~]*)$/.exec(tok);
      if (!mm) throw new Error(`r77b pattern: ${tok}`);
      const [, deg, len, mods] = mm;
      const at = step;
      step += Number(len);
      if (deg === 'r') return `r:${len}`;
      return `${fn(deg, chordAt(bar, at), at)}:${len}${mods}`;
    }).join(' ');
  }).join(' ');
}

// ベース: 1 根音・3・5・7（7の 和音だけ。ほかは 根音の オクターブ上）・8 オクターブ上・-5 下の 5度。lo … 根音の いちばん 低い 音（MIDI）
function bassLine(prog, pat, { lo = 38, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const r = lo + (((ch.bass - lo) % 12) + 12) % 12;
    const top = ch.root === ch.bass ? r : r + ((ch.root - ch.bass + 12) % 12);
    const d = { 1: r, 8: r + 12, 3: top + ch.iv[1], 5: top + ch.iv[2], 7: top + (ch.iv[3] ?? 12), '-5': top + ch.iv[2] - 12 }[deg];
    if (d === undefined) throw new Error(`r77b bass: ${deg}`);
    return nm(d, sp);
  });
}

// 和音の ならべ方（転回）: 平均が center に いちばん 近い もの
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
function comp(prog, pat, { center = 64, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const sel = deg === 'l' ? v.slice(0, 2) : deg === 'h' ? v.slice(-2) : v;
    return `[${sel.map((m) => nm(m, sp)).join(' ')}]`;
  });
}

// アルペジオ: 数字 = 和音の 下からの 何番目（3つの 和音なら 3 = 1オクターブ上の いちばん 下）
function arp(prog, pat, { center = 72, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const k = Number(deg);
    if (!Number.isInteger(k)) throw new Error(`r77b arp: ${deg}`);
    return nm(v[k % v.length] + 12 * Math.floor(k / v.length), sp);
  });
}

// 対旋律（ガイドトーン）: x の たびに、前の 音に いちばん 近い 和音の 音（同じ 音は 少し さける → ゆっくり 動く 線）
function guide(prog, pat, { center = 67, sp = SHARP, span = 6 } = {}) {
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
  });
}

// のばしの 和音（1つの 和音に 1つ）
function pad(prog, { center = 62, sp = SHARP, mods = '' } = {}) {
  return prog.map((bar) => {
    const syms = bar.trim().split(/\s+/);
    const len = B16 / syms.length;
    return syms.map((s) => `[${voicing(chordOf(s), center).map((m) => nm(m, sp)).join(' ')}]:${len}${mods}`).join(' ');
  }).join(' ');
}

// たいこ: n 小節。main は 型（配列なら かわるがわる）、first / last は さいしょ・さいごの 小節
function drums(n, main, { first, last } = {}) {
  const pats = Array.isArray(main) ? main : [main];
  return Array.from({ length: n }, (_, i) => (i === 0 && first ? first : i === n - 1 && last ? last : pats[i % pats.length])).join(' ');
}
const rest = (n) => Array.from({ length: n }, () => 'r:16').join(' ');
const bars = (list) => list.join(' ');

// ───────────── フィールド（ミドリナ地方。ニ長調 132。元気に 歩く）─────────────
const FIELD = {
  intro: ['D', 'G', 'Em', 'A'],
  A: ['D', 'G', 'A', 'D', 'Bm', 'G', 'Em A', 'A', 'D', 'G', 'A', 'F#m Bm', 'G', 'A', 'D', 'D'],
  A2: ['D', 'G', 'A', 'D', 'Bm', 'F#m', 'G', 'A', 'D', 'G', 'A', 'F#m Bm', 'G', 'Em A', 'D', 'D'],
  B: ['G', 'A', 'F#m', 'Bm', 'Em', 'A', 'D', 'D', 'G', 'Gm', 'Em7 A', 'A'],
  br: ['D', 'Em', 'G', 'A'],
};
// 前の 動機（ラ・レ・ミ・ファ#の のぼり）を A の 頭に
const FIELD_A = [
  'A4:2 D5:2 E5:2 F#5:4! E5:2 D5:2 A4:2', 'B4:2 D5:2 G5:4! G5:2 F#5:2 E5:2 D5:2', 'C#5:2 E5:2 A5:4! G5:2 F#5:2 E5:2 C#5:2', 'D5:6 A4:2 D5:4 r:4',
  'F#5:2. F#5:2 B5:4! A5:2 F#5:2 D5:4', 'G5:2 F#5:2 E5:4 D5:2 E5:2 B4:4', 'E5:2 G5:2 F#5:2 E5:2 C#5:4 E5:4', 'A5:6 G5:2 E5:4 r:4',
  'A4:2 D5:2 E5:2 F#5:4! E5:2 D5:2 F#5:2', 'G5:2 A5:2 B5:4! B5:2 A5:2 G5:2 D5:2', 'A5:2 G5:2 F#5:2 E5:2 C#5:4 A4:4', 'C#5:2 A4:2 C#5:2 F#5:2 F#5:2 D5:2 B4:4',
  'B4:2 D5:2 G5:6 B5:2 A5:2 G5:2', 'A5:4! E5:2 C#5:2 E5:2 G5:2 F#5:2 E5:2', 'F#5:4! E5:2 D5:2 A4:4 B4:2 C#5:2', 'D5:8 r:8',
];
const FIELD_A2 = [
  ...FIELD_A.slice(0, 4),
  'D6:2 C#6:2 B5:4! F#5:2 A5:2 B5:2 D6:2', 'C#6:4 A5:2 F#5:2 C#5:4 E5:2 F#5:2', 'G5:2 B5:2 D6:4! B5:2 G5:2 D5:2 E5:2', 'E5:4 C#5:2 E5:2 A5:8',
  ...FIELD_A.slice(8, 12),
  'B5:2 A5:2 G5:2 D5:2 B5:4! A5:2 G5:2', 'G5:2 F#5:2 E5:4 E5:2 A5:2 C#6:4', 'D6:4! A5:2 F#5:2 A5:4 C#6:4', 'D6:8 r:8',
];
// サビ: 長い 音で 高く 歌う
const FIELD_B = [
  'D6:6! B5:2 G5:4 A5:4', 'C#6:6 E6:2 C#6:4 A5:4', 'A5:6 F#5:2 C#6:4 B5:2 A5:2', 'B5:8 r:2 B5:2 C#6:2 D6:2',
  'E6:6! D6:2 B5:4 G5:4', 'A5:4 C#6:4 E6:4 D6:2 C#6:2', 'D6:6 A5:2 F#5:4 A5:4', 'D6:8 r:4 A5:2 B5:2',
  'D6:4! B5:2 D6:2 G6:6 F#6:2', 'G6:4 F6:2 D6:2 Bb5:8', 'A5:4 G5:2 F#5:2 E5:4 C#5:4', 'A5:8 r:8',
];
const FIELD_BR = ['r:8 A4:2 D5:2 E5:2 F#5:2', 'G5:4! r:4 B4:2 E5:2 F#5:2 G5:2', 'B5:4! r:4 B4:2 D5:2 G5:2 B5:2', 'A5:4! r:2 G5:2 F#5:2 E5:2 C#5:2 r:2'];

const field = {
  bpm: 132, bar: 16, reverb: 0.2, fill: 8,
  night: { lead: 'flute', pluck: 'marimba', strings: 'pad', bell: 'musicbox' },
  parts: [
    { i: 'lead', v: 0.1 },
    { i: 'bass', v: 0.17, role: 'bass' },
    { i: 'pluck', v: 0.04, minIntensity: 0 },
    { i: 'strings', v: 0.03, minIntensity: 0 },
    { i: 'bell', v: 0.024, minIntensity: 0, pan: 0.35 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:16 r:16 r:8 A4:2. B4:2. C#5:2. E5:2.',
      bassLine(FIELD.intro, ['1:8! 5:4 8:4', '1:8 5:4 8:4', '1:4! 5:2. 8:2 1:2. 5:2 8:2? 5:2', '1:2! 1:2. 8:2 1:2 5:2! 1:2. 8:2 5:2']),
      comp(FIELD.intro, ['r:16', 'r:16', 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', 'r:2 x:2. r:2 x:2. r:2 x:2. x:2. x:2.'], { center: 66 }),
      pad(FIELD.intro, { center: 64 }),
      arp(FIELD.intro, ['r:16', 'r:16', '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', '0:2 1:2 2:2 3:2 4:2 5:2 6:2 r:2'], { center: 76 }),
      bars(['c:4! r:4 k:4 r:4', 'k:4 r:4 k:4 r:4', 'k:4 h:4 k:4 h:4', 'k:2 h:2 s:2 h:2 k:2 s:2 s:1 s:1 s:1 s:1']),
    ],
    A: [
      bars(FIELD_A),
      bassLine(FIELD.A, '1:4! 5:2. 8:2 1:2. 5:2 8:2? 5:2'),
      comp(FIELD.A, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 66 }),
      `${rest(8)} ${guide(FIELD.A.slice(8), 'x:8 x:8', { center: 69 })}`,
      rest(16),
      drums(16, 'k:2! h:2? s:2 h:2? k:2 k:2? s:2 h:2?'),
    ],
    A2: [
      bars(FIELD_A2),
      bassLine(FIELD.A2, '1:2! 1:2. 8:2 1:2 1:2! 5:2. 8:2 5:2'),
      comp(FIELD.A2, 'x:2.! r:2 x:2. r:2 r:2 x:2. x:2. r:2', { center: 64 }),
      guide(FIELD.A2, 'x:6 x:2 x:8', { center: 67 }),
      `${rest(8)} ${arp(FIELD.A2.slice(8), '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 79 })}`,
      drums(16, 'k:2! h:2 s:2! h:2? k:2? k:2 s:2! o:2'),
    ],
    B: [
      bars(FIELD_B),
      bassLine(FIELD.B, '1:2! 8:2 5:2 8:2 1:2! 8:2 5:2 8:2'),
      comp(FIELD.B, 'x:4! r:2 x:2. r:2 x:2. x:4', { center: 67 }),
      pad(FIELD.B, { center: 64 }),
      arp(FIELD.B, ['0:2 2:2 4:2 2:2 1:2 3:2 5:2 3:2', '5:2 4:2 3:2 2:2 1:2 2:2 3:2 4:2'], { center: 72 }),
      drums(12, 'k:1! h:1? h:1 h:1? s:1! h:1? h:1 k:1 k:1! h:1? h:1 h:1? s:1! h:1? o:2', { first: 'c:1! h:1? h:1 h:1? s:1! h:1? h:1 k:1 k:1! h:1? h:1 h:1? s:1! h:1? o:2' }),
    ],
    br: [
      bars(FIELD_BR),
      bassLine(FIELD.br, '1:2! r:2 1:2. 8:2. r:2 1:2 5:2! 8:2'),
      comp(FIELD.br, 'x:2.! r:6 x:2. r:6', { center: 66 }),
      rest(4),
      arp(FIELD.br, '0:2. 2:2. 4:2. r:2 3:2. 1:2. 2:2. r:2', { center: 76 }),
      drums(4, 'k:2! r:2 tl:2 k:2 s:2! r:2 t:2 th:2', { last: 'k:2! r:2 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 町（ルミナの町。ト長調 120・スイング。あたたかく はずむ）─────────────
const TOWN = {
  intro: ['G', 'D'],
  A: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am D', 'G'],
  A2: ['G', 'Em', 'C', 'D', 'B7', 'Em', 'Am D', 'G'],
  B: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'G7', 'C', 'D', 'Bm', 'E7', 'Am', 'D', 'G', 'G'],
  br: ['G', 'C', 'Am', 'D'],
};
// 前の 動機（レ・シ・ソ・シ・レ・ソ）
const TOWN_A = [
  'D5:2. B4:2. G4:2. B4:2 D5:4! G5:4', 'E5:3 D5:1 B4:2. G4:2 E4:4 G4:2 B4:2', 'C5:2. E5:2. G5:4! E5:2 C5:2 E5:4', 'D5:2 F#5:2 A5:6 F#5:2 D5:4',
  'B5:4! A5:2 G5:2 D5:4 B4:4', 'G5:4 F#5:2 E5:2 B4:8', 'C5:2 E5:2 A5:4 D5:2 F#5:2 A5:4', 'G5:6! D5:2 G4:4 r:4',
];
const TOWN_A2 = [
  ...TOWN_A.slice(0, 4),
  'D#5:2 F#5:2 B5:4! A5:2 F#5:2 D#5:4', 'E5:2 G5:2 B5:4 G5:2 E5:2 B4:4', 'A5:4! G5:2 F#5:2 E5:2 F#5:2 G5:2 A5:2', 'G5:8 r:4 D5:2 E5:2',
];
const TOWN_B = [
  'G5:6! E5:2 C5:4 E5:4', 'F#5:6! D5:2 A4:4 D5:4', 'D5:2 E5:2 F#5:4! B5:4 A5:4', 'G5:8 r:4 E5:2 F#5:2',
  'G5:6 E5:2 C5:4 E5:4', 'F#5:6 D5:2 A5:4 C6:4', 'B5:6 A5:2 G5:4 D5:4', 'F5:4 D5:2 B4:2 G4:8',
  'E5:4 G5:4 C6:6! B5:2', 'A5:4 F#5:4 D6:6 C6:2', 'B5:4 F#5:2 D5:2 B4:4 D5:4', 'E5:2 G#5:2 B5:4 D6:4 B5:4',
  'C6:6! B5:2 A5:4 E5:4', 'F#5:2 G5:2 A5:4 C6:4 F#5:4', 'B5:4 A5:2 G5:2 A5:4 F#5:4', 'G5:12 r:4',
];
const TOWN_BR = ['r:8 D5:2. B4:2. G4:2. B4:2.', 'C5:4! r:4 E5:2. C5:2. G4:2. C5:2.', 'A4:4! r:4 C5:2. E5:2. A5:2. G5:2.', 'F#5:4! r:4 A5:2 F#5:2 D5:2 C5:2'];

const town = {
  bpm: 120, bar: 16, swing: 0.12, reverb: 0.14, fill: 8,
  night: { lead: 'bell', pluck: 'marimba', organ: 'pad' },
  parts: [
    { i: 'flute', v: 0.1 },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'pluck', v: 0.042, minIntensity: 0 },
    { i: 'marimba', v: 0.04, minIntensity: 0, pan: 0.4 },
    { i: 'organ', v: 0.026, minIntensity: 0, pan: -0.35 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(TOWN.intro, '1:2! r:2 5:2. 8:2 1:2 r:2 5:2. 3:2', { lo: 38 }),
      comp(TOWN.intro, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 67 }),
      arp(TOWN.intro, '0:2. 1:2. 2:2. 3:2. 4:2. 3:2. 2:2. 1:2.', { center: 74 }),
      rest(2),
      drums(2, 'k:2 h:2? R:2 h:2? k:2 h:2? R:2 h:2?'),
    ],
    A: [
      bars(TOWN_A),
      bassLine(TOWN.A, '1:2! r:2 5:2. 8:2 1:2 r:2 5:2. 3:2', { lo: 38 }),
      comp(TOWN.A, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 67 }),
      rest(8),
      rest(8),
      drums(8, 'k:2! h:2? R:2 h:2? k:2 h:2? R:2! h:2?'),
    ],
    A2: [
      bars(TOWN_A2),
      bassLine(TOWN.A2, '1:4! 3:4 1:4 5:4', { lo: 38 }),
      comp(TOWN.A2, 'r:2 x:2. r:2 x:2.! r:2 x:2. x:2? x:2.', { center: 67 }),
      arp(TOWN.A2, ['0:2. 1:2 2:2. 3:2 4:2. 3:2 2:2. 1:2', 'r:8 4:2. 3:2. 2:2. 1:2.'], { center: 74 }),
      pad(TOWN.A2, { center: 60 }),
      drums(8, 'k:2! h:2? s:2 h:2? k:2 k:2? s:2! h:2?'),
    ],
    B: [
      bars(TOWN_B),
      bassLine(TOWN.B, '1:2! 1:2. 5:2 8:2 1:2! 1:2. 5:2 3:2', { lo: 38 }),
      comp(TOWN.B, 'x:2! r:2 x:2. r:2 x:2 r:2 x:2. x:2.', { center: 66 }),
      guide(TOWN.B, 'x:4 x:4 x:8', { center: 76 }),
      pad(TOWN.B, { center: 62 }),
      drums(16, 'k:2! h:2 s:2! h:2? k:2 h:2 s:2! o:2', { first: 'c:2! h:2 s:2! h:2? k:2 h:2 s:2! o:2' }),
    ],
    br: [
      bars(TOWN_BR),
      bassLine(TOWN.br, '1:2! r:6 1:2. r:2 5:2. 8:2.', { lo: 38 }),
      comp(TOWN.br, 'x:2.! r:6 x:2. r:2 x:2. r:2', { center: 67 }),
      arp(TOWN.br, 'r:8 0:2. 1:2. 2:2. 3:2.', { center: 74 }),
      rest(4),
      drums(4, 'k:2! r:2 R:2 R:2? k:2 r:2 R:2 p:2', { last: 'k:2! r:2 R:2 r:2 s:1 s:1 s:1? s:1 t:1 t:1 tl:1 tl:1' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 洞窟（イ短調 108。なぞめいて いるが 拍が ある）─────────────
// 強さ: 0 = メロディ・ベース・マリンバ・軽い たいこ（リムと ハイハット）／0.55 = キック・スネア／0.8 = ベルの 対旋律・ストリングスの 和音
const CAVE = {
  intro: ['Am', 'Am'],
  A: ['Am', 'F', 'C', 'Dm', 'Bb', 'Am', 'E', 'Am'],
  A2: ['Am', 'F', 'C', 'G', 'F', 'Dm', 'E', 'E'],
  B: ['Dm', 'Am', 'Bb', 'F', 'Dm', 'Am', 'Bb', 'E', 'F', 'G', 'E', 'Am'],
  br: ['Am', 'Am', 'F', 'E'],
};
// 前の 動機（ラ … ミ・レ・ド・シ）
const CAVE_A = [
  'A4:4! r:2 C5:2 E5:6 D5:2', 'C5:4! r:2 B4:2 A4:6 C5:2', 'G4:4! r:2 C5:2 E5:4 G5:4', 'F5:6! E5:2 D5:4 A4:4',
  'D5:4! r:2 F5:2 Bb5:6 A5:2', 'A5:4 G5:2 E5:2 C5:4 E5:4', 'G#5:4! E5:2 D5:2 B4:4 G#4:4', 'A4:8 r:8',
];
const CAVE_A2 = [
  ...CAVE_A.slice(0, 3),
  'D5:6! B4:2 G4:4 B4:4', 'A4:4 C5:4 F5:6 E5:2', 'D5:4 F5:4 A5:6 G5:2', 'G#5:6! E5:2 B4:4 D5:4', 'E5:8 r:4 B4:2 D5:2',
];
const CAVE_B = [
  'F5:8! A5:4 D6:4', 'C6:6 B5:2 A5:8', 'Bb5:6! A5:2 F5:4 D5:4', 'C5:4 F5:4 A5:8',
  'D6:6! C6:2 A5:4 F5:4', 'E5:4 A5:4 C6:6 B5:2', 'D6:4 Bb5:4 F5:4 D5:4', 'E5:4 G#5:4 B5:8',
  'C6:6! A5:2 F5:4 A5:4', 'B5:6 G5:2 D5:4 G5:4', 'G#5:4 B5:4 E6:6 D6:2', 'C6:4 B5:2 G#5:2 A5:8',
];
const CAVE_BR = ['r:16', 'r:8 A4:2. C5:2. E5:2. r:2', 'r:16', 'r:8 G#4:2. B4:2. D5:2. r:2'];
const CAVE_FILL = 'k:2! r:2 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1';

const cave = {
  bpm: 108, bar: 16, reverb: 0.4, night: {},
  parts: [
    { i: 'chip_square', v: 0.085, minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'marimba', v: 0.05, minIntensity: 0, pan: -0.3 },
    { drums: true, v: 0.36, minIntensity: 0 },
    { drums: true, v: 0.5, minIntensity: 0.55 },
    { i: 'bell', v: 0.03, minIntensity: 0.8, pan: 0.4 },
    { i: 'strings', v: 0.028, minIntensity: 0.8, pan: -0.15 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(CAVE.intro, ['1:8! r:8', '1:3! 1:3 8:2 1:3 5:3 8:2'], { lo: 33 }),
      arp(CAVE.intro, '0:2. 2:2 1:2. 3:2 0:2. 2:2 1:2. 3:2', { center: 69 }),
      drums(2, ['r:16', 'R:2! h:2? h:2 h:2? R:2 h:2? h:2 R:2?']),
      drums(2, ['r:16', 'r:8 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1']),
      rest(2),
      pad(CAVE.intro, { center: 62 }),
    ],
    A: [
      bars(CAVE_A),
      bassLine(CAVE.A, '1:3! 1:3 8:2 1:3 5:3 8:2', { lo: 33 }),
      arp(CAVE.A, '0:2. 2:2 1:2. 3:2 0:2. 2:2 1:2. 3:2', { center: 69 }),
      drums(8, 'R:2! h:2? h:2 h:2? R:2 h:2? h:2 R:2?'),
      drums(8, 'k:4! r:2 k:2 s:4! r:2 k:2', { first: 'c:4! r:2 k:2 s:4! r:2 k:2', last: CAVE_FILL }),
      guide(CAVE.A, 'x:8 x:8', { center: 76 }),
      pad(CAVE.A, { center: 62 }),
    ],
    A2: [
      bars(CAVE_A2),
      bassLine(CAVE.A2, '1:2! 1:1? 1:1 8:2 1:2. 1:2! 5:2 8:2 5:2?', { lo: 33 }),
      arp(CAVE.A2, '0:1 1:1? 2:1 1:1? 3:1 1:1? 2:1 1:1? 0:1 1:1? 2:1 1:1? 3:1 2:1? 4:1 2:1?', { center: 69 }),
      drums(8, 'R:2! h:1? h:1? h:2 R:2 h:2? R:2 h:2 h:2?'),
      drums(8, 'k:2! r:2 s:2 k:2 r:2 k:2 s:2! r:2', { last: CAVE_FILL }),
      guide(CAVE.A2, 'x:4 x:4 x:8', { center: 74 }),
      pad(CAVE.A2, { center: 64 }),
    ],
    B: [
      bars(CAVE_B),
      bassLine(CAVE.B, '1:4! 1:2. 8:2 1:4 5:2 8:2', { lo: 33 }),
      arp(CAVE.B, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 72 }),
      drums(12, 'h:2 h:2? o:2 h:2? h:2 h:2? o:2 h:2?'),
      drums(12, 'k:2! k:2? s:2! r:2 k:2 r:2 s:2! t:1 t:1', { first: 'c:2! k:2? s:2! r:2 k:2 r:2 s:2! t:1 t:1', last: CAVE_FILL }),
      arp(CAVE.B, ['0:4 1:4 2:8', '2:4 1:4 0:8'], { center: 79 }),
      pad(CAVE.B, { center: 64 }),
    ],
    br: [
      bars(CAVE_BR),
      bassLine(CAVE.br, '1:2! r:2 1:2. r:2 8:2! r:2 5:2. 1:2?', { lo: 33 }),
      arp(CAVE.br, '0:2. r:2 0:2. 2:2. r:2 1:2. 3:2. r:2', { center: 69 }),
      drums(4, 'R:2! r:2 R:2 R:2? r:2 R:2 R:2 R:2?'),
      drums(4, 'k:4! r:4 k:2 k:2 r:4', { last: CAVE_FILL }),
      rest(4),
      pad(CAVE.br, { center: 60 }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 千年前の フィールド（千年前の ミドリナ地方。ニ長調 120。広く 古い 世界。ふえ ＋ ストリングス）─────────────
const PAST = {
  intro: ['D', 'G', 'D', 'A'],
  A: ['D', 'G', 'D', 'A', 'Bm', 'G', 'Em A', 'D'],
  A2: ['D', 'C', 'G', 'D', 'Bm', 'F#m', 'G A', 'D'],
  B: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D', 'Em', 'F#m', 'G', 'D', 'G', 'A', 'Bm', 'A'],
  br: ['D', 'C', 'G', 'A'],
};
// 前の 動機（ファ#・ラ・レ・ド#）
const PAST_A = [
  'F#5:4! A5:4 D6:6 C#6:2', 'B5:4 G5:4 B5:4 D6:4', 'A5:6 F#5:2 D5:4 F#5:4', 'E5:8 A5:4 C#6:4',
  'D6:4! B5:2 F#5:2 B5:4 D6:4', 'G5:4 B5:4 D6:4 B5:4', 'E5:4 G5:4 A5:4 C#6:4', 'D6:12 r:4',
];
const PAST_A2 = [
  PAST_A[0], 'C6:4! G5:4 E5:4 G5:4', 'B5:6 A5:2 G5:4 D5:4', 'F#5:8 A5:4 D6:4',
  'D6:4 C#6:2 B5:2 F#5:4 B5:4', 'C#6:6 B5:2 A5:4 F#5:4', 'G5:4 B5:4 A5:4 C#6:4', 'D6:8 A5:4 F#5:4',
];
const PAST_B = [
  'D6:8! B5:4 G5:4', 'C#6:8 E6:4 C#6:4', 'A5:6 F#5:2 C#6:8', 'B5:12 A5:2 B5:2',
  'D6:6! E6:2 D6:4 B5:4', 'C#6:6 D6:2 E6:4 A5:4', 'F#6:8! E6:4 D6:4', 'D6:12 r:4',
  'E6:6! D6:2 B5:4 G5:4', 'A5:6 B5:2 C#6:8', 'D6:4 B5:4 G5:4 B5:4', 'A5:12 r:4',
  'B5:6 C#6:2 D6:8', 'E6:6! D6:2 C#6:4 A5:4', 'D6:6 C#6:2 B5:4 F#5:4', 'E5:8 A5:4 C#6:4',
];
const PAST_BR = ['r:16', 'r:8 E5:4 G5:4', 'D5:12 r:4', 'C#5:8 E5:4 A4:4'];

const past_field = {
  bpm: 120, bar: 16, reverb: 0.3, fill: 8,
  night: { lead: 'soft_lead', pluck: 'bell', strings: 'pad', brass: 'flute' },
  parts: [
    { i: 'flute', v: 0.1 },
    { i: 'bass', v: 0.16, role: 'bass' },
    { i: 'strings', v: 0.034, minIntensity: 0 },
    { i: 'pluck', v: 0.038, minIntensity: 0, pan: 0.4 },
    { i: 'brass', v: 0.04, minIntensity: 0, pan: -0.35 },
    { drums: true, v: 0.42, minIntensity: 0 },
  ],
  sections: {
    intro: [
      'r:16 r:16 r:16 r:8 A4:4 C#5:4',
      bassLine(PAST.intro, '1:8! 5:4 8:4'),
      pad(PAST.intro, { center: 60 }),
      arp(PAST.intro, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 67 }),
      guide(PAST.intro, 'x:8 x:8', { center: 62 }),
      bars(['tl:4! r:4 tl:4 r:4', 'tl:4! r:4 tl:4 tl:2 tl:2', 'k:4! h:2? h:2 tl:4 h:2? h:2', 'k:4! h:2? h:2 s:2 s:2 t:1 t:1 tl:1 tl:1']),
    ],
    A: [
      bars(PAST_A),
      bassLine(PAST.A, '1:6! 5:2 8:4 5:4'),
      pad(PAST.A, { center: 60 }),
      arp(PAST.A, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 67 }),
      rest(8),
      drums(8, 'k:4! h:2? h:2 s:4! h:2? h:2?'),
    ],
    A2: [
      bars(PAST_A2),
      bassLine(PAST.A2, '1:4! 5:2 1:2 8:4 5:2 3:2'),
      pad(PAST.A2, { center: 62 }),
      arp(PAST.A2, '0:2 2:2 4:2 2:2 1:2 3:2 5:2 3:2', { center: 67 }),
      guide(PAST.A2, 'x:8 x:8', { center: 62 }),
      drums(8, 'k:2! h:2? s:2 h:2? k:2 h:2? s:2! h:2?'),
    ],
    B: [
      bars(PAST_B),
      bassLine(PAST.B, '1:2! 1:2 5:2 1:2 8:2! 5:2 1:2 5:2'),
      pad(PAST.B, { center: 65 }),
      arp(PAST.B, '0:2. 2:2. 4:2 5:2 0:2. 2:2. 4:2 5:2', { center: 67 }),
      guide(PAST.B, 'x:6 x:2 x:8', { center: 62 }),
      drums(16, 'k:2! h:2 s:2! h:2? k:2! k:2 s:2! o:2', { first: 'c:2! h:2 s:2! h:2? k:2! k:2 s:2! o:2' }),
    ],
    br: [
      bars(PAST_BR),
      bassLine(PAST.br, '1:8! 5:4 8:4'),
      pad(PAST.br, { center: 60 }),
      rest(4),
      guide(PAST.br, 'x:4.! x:4. x:8', { center: 64 }),
      drums(4, 'tl:2! tl:2? t:2 tl:2? k:2 tl:2 t:2 th:2', { last: 'k:2! r:2 tl:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 第7章 みどりの水の神殿（ト長調 112。流れる 水の マリンバ ＋ はねる ベース）─────────────
const C7T = {
  intro: ['G', 'G'],
  A: ['G', 'D', 'Em', 'C', 'G', 'Bm', 'C', 'D'],
  A2: ['G', 'D', 'Em', 'C', 'Am', 'D', 'G', 'G'],
  B: ['C', 'D', 'Bm', 'Em', 'C', 'D', 'G', 'G', 'Am', 'Bm', 'C', 'D'],
  br: ['Em', 'C', 'Am', 'D'],
};
// 前の 動機（シ・レ・ソ・ファ#）を 1オクターブ 下で
const C7T_A = [
  'B4:2. B4:2 D5:4 G5:6! F#5:2', 'A5:4! F#5:4 D5:6 E5:2', 'E5:2. E5:2 G5:4 B5:6! A5:2', 'G5:4 E5:4 C5:6 D5:2',
  'D5:2 G5:2 B5:4! B5:2 A5:2 G5:2 D5:2', 'F#5:4 D5:2 F#5:2 B5:6 A5:2', 'G5:2 E5:2 C5:4 E5:2 G5:2 C6:4', 'A5:8 F#5:4 D5:4',
];
const C7T_A2 = [
  ...C7T_A.slice(0, 3),
  'G5:4 E5:4 C6:6 B5:2', 'A5:4 C6:4 E6:6! D6:2', 'C6:4 A5:4 F#5:4 A5:4', 'G5:6 D5:2 B5:4 A5:4', 'G5:8 r:8',
];
const C7T_B = [
  'E5:6! G5:2 C6:8', 'D6:6 C6:2 A5:8', 'B5:6 A5:2 F#5:4 D5:4', 'E5:4 G5:4 B5:8',
  'C6:6! D6:2 E6:4 C6:4', 'D6:6 A5:2 F#5:4 A5:4', 'G5:4 B5:4 D6:6 C6:2', 'B5:12 r:4',
  'C6:6 B5:2 A5:4 E5:4', 'D6:6 B5:2 F#5:4 B5:4', 'E6:4! D6:2 C6:2 G5:4 E5:4', 'F#5:4 A5:4 D6:8',
];
const C7T_BR = ['r:8 B4:2. E5:2. G5:2. r:2', 'r:8 C5:2. E5:2. G5:2. r:2', 'r:8 A4:2. C5:2. E5:2. r:2', 'F#5:4! r:4 A5:2. r:2 D5:2 r:2'];
const C7T_FILL = 'k:2! r:2 s:2 k:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1';

const c7_temple = {
  bpm: 112, bar: 16, reverb: 0.32, night: {},
  parts: [
    { i: 'lead', v: 0.085, minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'marimba', v: 0.042, minIntensity: 0, pan: 0.3 },
    { drums: true, v: 0.32, minIntensity: 0 },
    { drums: true, v: 0.5, minIntensity: 0.55 },
    { i: 'bell', v: 0.03, minIntensity: 0.8, pan: -0.4 },
    { i: 'pad', v: 0.032, minIntensity: 0.8 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(C7T.intro, ['1:8! r:8', '1:3! 1:3 5:2 8:3 1:3 5:2']),
      arp(C7T.intro, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1', { center: 72 }),
      drums(2, ['r:16', 'h:2! h:2? R:2 h:2? h:2 h:2? R:2 h:1? h:1?']),
      drums(2, ['r:16', 'r:8 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1']),
      rest(2),
      pad(C7T.intro, { center: 64 }),
    ],
    A: [
      bars(C7T_A),
      bassLine(C7T.A, '1:3! 1:3 5:2 8:3 1:3 5:2'),
      arp(C7T.A, '0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1', { center: 72 }),
      drums(8, 'h:2! h:2? R:2 h:2? h:2 h:2? R:2 h:1? h:1?'),
      drums(8, 'k:2! r:2 s:2! r:1 k:1 r:2 k:2 s:2! r:2', { first: 'c:2! r:2 s:2! r:1 k:1 r:2 k:2 s:2! r:2', last: C7T_FILL }),
      guide(C7T.A, 'x:8 x:8', { center: 79 }),
      pad(C7T.A, { center: 64 }),
    ],
    A2: [
      bars(C7T_A2),
      bassLine(C7T.A2, '1:3! 1:3 5:2 1:2 8:2 5:2 3:2'),
      arp(C7T.A2, '0:1 2:1 4:1 2:1 1:1 3:1 5:1 3:1 2:1 4:1 6:1 4:1 3:1 5:1 4:1 2:1', { center: 72 }),
      drums(8, 'h:1! h:1? h:1? h:1? R:2 h:2? h:1 h:1? h:1? h:1? R:2 h:2?'),
      drums(8, 'k:2! h:2? s:2! k:2 r:2 k:2 s:2! h:2?', { last: C7T_FILL }),
      arp(C7T.A2, ['5:4 4:4 3:8', '3:4 4:4 5:8'], { center: 74 }),
      pad(C7T.A2, { center: 66 }),
    ],
    B: [
      bars(C7T_B),
      bassLine(C7T.B, '1:2! 8:2? 1:2 8:2? 1:2! 8:2? 5:2 8:2?'),
      arp(C7T.B, '0:2 2:2 4:2 5:2 4:2 2:2 3:2 1:2', { center: 72 }),
      drums(12, 'h:2! h:2? o:2 h:2? h:2 h:2? o:2 h:2?'),
      drums(12, 'k:2! r:2 s:2! r:2 k:2 k:2 s:2! r:2', { first: 'c:2! r:2 s:2! r:2 k:2 k:2 s:2! r:2', last: C7T_FILL }),
      guide(C7T.B, 'x:6 x:2 x:8', { center: 76 }),
      pad(C7T.B, { center: 64 }),
    ],
    br: [
      bars(C7T_BR),
      bassLine(C7T.br, '1:4! r:4 1:3 1:3 5:2'),
      arp(C7T.br, '0:2. 2:2. 4:2. 2:2. r:8', { center: 72 }),
      drums(4, 'R:2! r:2 h:2? R:2 r:2 R:2 h:2? r:2'),
      drums(4, 'k:4! r:4 k:2 k:2 r:4', { last: C7T_FILL }),
      rest(4),
      pad(C7T.br, { center: 62 }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 第7章 氷の竜の城（ロ短調 116。オルゴールの 氷の つぶ ＋ 竜の 走る ベース）─────────────
const C7I = {
  intro: ['Bm', 'Bm'],
  A: ['Bm', 'G', 'D', 'A', 'Bm', 'Em', 'F#', 'F#'],
  A2: ['Bm', 'G', 'D', 'A', 'G', 'A', 'F#', 'Bm'],
  B: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D', 'Em', 'F#', 'Bm', 'F#'],
  br: ['Bm', 'G', 'Em', 'F#'],
};
// 前の 動機（ファ#・シ・レ・ド#）
const C7I_A = [
  'F#5:4! B5:4 D6:6 C#6:2', 'B5:4 G5:4 D5:6 E5:2', 'A5:2. A5:2 F#5:4 D5:6 E5:2', 'E5:4 C#5:4 A4:8',
  'B4:2 D5:2 F#5:2 B5:2 D6:4! B5:4', 'G5:4 E5:4 B4:6 C#5:2', 'A#4:4 C#5:4 F#5:6 E5:2', 'F#5:8 r:8',
];
const C7I_A2 = [
  ...C7I_A.slice(0, 2),
  'F#5:4 A5:4 D6:4! F#6:4', 'E6:6 C#6:2 A5:8', 'D6:4 B5:4 G5:6 A5:2', 'C#6:4 A5:4 E5:6 F#5:2', 'A#5:6! C#6:2 F#6:4 E6:4', 'D6:4 C#6:2 A#5:2 B5:8',
];
const C7I_B = [
  'D6:6! B5:2 G5:8', 'E6:6 C#6:2 A5:8', 'C#6:6 A5:2 F#5:4 A5:4', 'B5:6 C#6:2 D6:8',
  'G6:6! F#6:2 D6:4 B5:4', 'E6:6 D6:2 C#6:4 A5:4', 'F#6:6 E6:2 D6:4 A5:4', 'D6:12 r:4',
  'E6:4! B5:4 G5:4 B5:4', 'C#6:4 A#5:4 F#5:4 C#6:4', 'D6:6 C#6:2 B5:4 F#5:4', 'F#5:8 r:8',
];
const C7I_BR = ['r:16', 'r:16', 'r:8 B4:2. E5:2. G5:2. B5:2.', 'A#5:4! r:4 C#6:2. r:2 F#5:2 r:2'];
const C7I_FILL = 'k:2! k:1 k:1 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1';

const c7i_castle = {
  bpm: 116, bar: 16, reverb: 0.34, night: {},
  parts: [
    { i: 'saw_lead', v: 0.075, minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'musicbox', v: 0.04, minIntensity: 0, pan: 0.35 },
    { drums: true, v: 0.32, minIntensity: 0 },
    { drums: true, v: 0.5, minIntensity: 0.55 },
    { i: 'brass', v: 0.038, minIntensity: 0.8, pan: -0.35 },
    { i: 'strings', v: 0.03, minIntensity: 0.8 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(C7I.intro, ['1:8! r:8', '1:2! 1:1 1:1 1:2 1:1 1:1 1:2! 1:1 1:1 5:2 8:1 8:1'], { lo: 35 }),
      arp(C7I.intro, '0:2. 2:2. 1:2. 3:2. 2:2. 4:2. 3:2. 5:2.', { center: 76 }),
      drums(2, ['r:16', 'h:2! h:2? R:2 h:2? h:2! h:2? R:2 h:2?']),
      drums(2, ['r:16', 'r:8 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1']),
      rest(2),
      pad(C7I.intro, { center: 62 }),
    ],
    A: [
      bars(C7I_A),
      bassLine(C7I.A, '1:2! 1:1 1:1 1:2 1:1 1:1 1:2! 1:1 1:1 5:2 8:1 8:1', { lo: 35 }),
      arp(C7I.A, '0:2. 2:2. 1:2. 3:2. 2:2. 4:2. 3:2. 5:2.', { center: 76 }),
      drums(8, 'h:2! h:2? R:2 h:2? h:2! h:2? R:2 h:2?'),
      drums(8, 'k:2! k:1 k:1 s:2! r:2 k:2 k:1 k:1 s:2! r:2', { first: 'c:2! k:1 k:1 s:2! r:2 k:2 k:1 k:1 s:2! r:2', last: C7I_FILL }),
      guide(C7I.A, 'x:8 x:8', { center: 64 }),
      pad(C7I.A, { center: 62 }),
    ],
    A2: [
      bars(C7I_A2),
      bassLine(C7I.A2, '1:2! 1:1 1:1 8:2 1:1 1:1 1:2! 1:1 1:1 5:2 5:1 3:1', { lo: 35 }),
      arp(C7I.A2, '3:2. 2:2. 1:2. 0:2. 1:2. 2:2. 3:2. 4:2.', { center: 76 }),
      drums(8, 'h:1! h:1? h:1 h:1? R:2 h:2? h:1! h:1? h:1 h:1? R:2 h:2?'),
      drums(8, 'k:2! h:2? s:2! k:1 k:1 k:2 h:2? s:2! h:2?', { last: C7I_FILL }),
      guide(C7I.A2, 'x:4. x:4 x:8', { center: 66 }),
      pad(C7I.A2, { center: 64 }),
    ],
    B: [
      bars(C7I_B),
      bassLine(C7I.B, '1:4! 1:2 1:1 1:1 1:4! 5:2 8:2', { lo: 35 }),
      arp(C7I.B, '0:2 1:2 2:2 3:2 4:2 5:2 4:2 3:2', { center: 76 }),
      drums(12, 'h:2! o:2? h:2 h:2? h:2! o:2? h:2 h:2?'),
      drums(12, 'k:2! h:2 s:2! h:2 k:2! k:2 s:2! h:1 h:1', { first: 'c:2! h:2 s:2! h:2 k:2! k:2 s:2! h:1 h:1', last: C7I_FILL }),
      guide(C7I.B, 'x:6 x:2 x:8', { center: 66 }),
      pad(C7I.B, { center: 64 }),
    ],
    br: [
      bars(C7I_BR),
      bassLine(C7I.br, '1:2! 1:1 1:1 1:2 1:1 1:1 1:2! 1:1 1:1 5:2 8:1 8:1', { lo: 35 }),
      arp(C7I.br, '0:4. 2:4. 4:4. 2:4.', { center: 76 }),
      drums(4, 'R:2! r:2 R:2 R:2? r:2 R:2 R:2 R:2?'),
      drums(4, 'k:2! k:1 k:1 r:4 k:2! k:1 k:1 r:4', { last: C7I_FILL }),
      comp(C7I.br, 'x:2!. r:6 x:2. r:6', { center: 62 }),
      rest(4),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 第8章 月の王宮の地下迷宮（ニ短調 108。和声の 短音階 ＝ 砂の 国の ふしぎな 音階。ウードの ような はじく 音 ＋ たいこ）─────────────
const C8A = {
  intro: ['Dm', 'Dm'],
  A: ['Dm', 'Bb', 'A', 'Dm', 'Gm', 'Dm', 'Bb A', 'A'],
  A2: ['Dm', 'C', 'Bb', 'A', 'Gm', 'A', 'Dm', 'Dm'],
  B: ['Bb', 'C', 'A', 'Dm', 'Bb', 'C', 'F', 'A', 'Gm', 'Eb', 'A', 'A'],
  br: ['Dm', 'Dm', 'Bb', 'A'],
};
// 前の 動機（レ・ミ・ファ・ラ）に こまかい かざり
const C8A_A = [
  'D5:2! E5:1 F5:1 A5:6 G5:2 F5:2 E5:2', 'F5:4! E5:2 D5:2 Bb4:6 r:2', 'C#5:2! D5:1 C#5:1 E5:4 A5:6 G5:2', 'F5:2 E5:2 D5:2 C#5:2 D5:8',
  'G5:2! A5:1 Bb5:1 D6:6 C6:2 Bb5:2 A5:2', 'A5:4 F5:2 D5:2 A5:6 G5:2', 'F5:2 G5:2 F5:2 D5:2 E5:2 F5:2 E5:2 C#5:2', 'A5:8 r:8',
];
const C8A_A2 = [
  C8A_A[0], 'E5:4! D5:2 C5:2 G5:6 r:2', 'F5:2! G5:1 F5:1 D5:4 Bb5:6 A5:2', 'C#6:4 Bb5:2 A5:2 E5:4 G5:4',
  'D6:6 C6:2 Bb5:4 G5:4', 'A5:2 Bb5:2 C#6:4 E6:4 C#6:2 Bb5:2', 'A5:4 F5:2 E5:2 D5:4 A4:4', 'D5:8 r:8',
];
const C8A_B = [
  'D6:6! C6:2 Bb5:4 F5:4', 'E6:6 D6:2 C6:4 G5:4', 'C#6:6 Bb5:2 A5:4 E5:4', 'F5:4 A5:4 D6:8',
  'F6:6! D6:2 Bb5:4 D6:4', 'E6:6 C6:2 G5:4 C6:4', 'A5:4 C6:4 F6:6 E6:2', 'E6:8 C#6:4 A5:4',
  'D6:6! Bb5:2 G5:4 Bb5:4', 'G5:4 Bb5:4 Eb6:8', 'C#6:4! E6:4 D6:2 C#6:2 Bb5:2 A5:2', 'A5:8 r:8',
];
const C8A_BR = ['r:16', 'r:16', 'r:16', 'r:8 A5:2. Bb5:2. C#6:2. r:2'];
const C8A_FILL = 'k:2! r:2 p:2 r:2 tl:1 tl:1 t:1 t:1 th:1 th:1 s:1 s:1';
const C8A_SP = { sp: FLAT };

const c8a_palace = {
  bpm: 108, bar: 16, reverb: 0.3, night: {},
  parts: [
    { i: 'chip_lead', v: 0.08, minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'pluck', v: 0.048, minIntensity: 0, pan: -0.3 },
    { drums: true, v: 0.34, minIntensity: 0 },
    { drums: true, v: 0.46, minIntensity: 0.55 },
    { i: 'strings', v: 0.03, minIntensity: 0.8, pan: 0.35 },
    { i: 'pad', v: 0.03, minIntensity: 0.8 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(C8A.intro, ['1:8! r:8', '1:3! 1:3 8:2 1:2! 5:2 8:2 5:2?'], C8A_SP),
      arp(C8A.intro, '0:2! 0:1 1:1 2:2 1:2 0:2. 2:2 1:1 0:1 1:2', { center: 62, ...C8A_SP }),
      drums(2, ['tl:2! R:1 R:1 tl:2 R:2 tl:2! R:2 R:1 R:1 R:2?', 'tl:2! R:1 R:1 tl:2 R:2 tl:2! R:2 R:1 R:1 R:2?']),
      drums(2, ['r:16', 'r:8 tl:1 tl:1 t:1 t:1 th:1 th:1 s:1 s:1']),
      rest(2),
      pad(C8A.intro, { center: 57, ...C8A_SP }),
    ],
    A: [
      bars(C8A_A),
      bassLine(C8A.A, '1:3! 1:3 8:2 1:2! 5:2 8:2 5:2?', C8A_SP),
      arp(C8A.A, '0:2! 0:1 1:1 2:2 1:2 0:2. 2:2 1:1 0:1 1:2', { center: 62, ...C8A_SP }),
      drums(8, 'tl:2! R:1 R:1 tl:2 R:2 tl:2! R:2 R:1 R:1 R:2?'),
      drums(8, 'k:2! r:2 p:2 r:2 k:2 k:2 p:2! r:2', { first: 'c:2! r:2 p:2 r:2 k:2 k:2 p:2! r:2', last: C8A_FILL }),
      guide(C8A.A, 'x:8 x:8', { center: 69, ...C8A_SP }),
      pad(C8A.A, { center: 57, ...C8A_SP }),
    ],
    A2: [
      bars(C8A_A2),
      bassLine(C8A.A2, '1:2! r:1 1:1 5:2 8:2 1:2! r:1 1:1 5:2 3:2', C8A_SP),
      arp(C8A.A2, '0:1! 1:1? 2:1 1:1? 0:1 1:1? 2:1 3:1 2:1! 1:1? 0:1 1:1? 2:1 1:1? 0:2', { center: 62, ...C8A_SP }),
      drums(8, 'tl:2! R:1 R:1 R:2 tl:1 tl:1 tl:2! R:2 R:1 R:1 R:1 R:1'),
      drums(8, 'k:2! h:2? s:2! h:2? k:2 k:2 s:2! p:2', { last: C8A_FILL }),
      guide(C8A.A2, 'x:4 x:4 x:8', { center: 69, ...C8A_SP }),
      pad(C8A.A2, { center: 60, ...C8A_SP }),
    ],
    B: [
      bars(C8A_B),
      bassLine(C8A.B, '1:4! 5:2 8:2 1:4! 5:2 8:2', C8A_SP),
      arp(C8A.B, '0:2 1:2 2:2 3:2 2:2 1:2 2:2 3:2', { center: 64, ...C8A_SP }),
      drums(12, 'tl:2! R:2 o:2? R:2 tl:2 R:2 o:2? R:2?'),
      drums(12, 'k:2! h:2 s:2! h:2 k:2 h:2 s:2! p:2', { first: 'c:2! h:2 s:2! h:2 k:2 h:2 s:2! p:2', last: C8A_FILL }),
      guide(C8A.B, 'x:6 x:2 x:8', { center: 67, ...C8A_SP }),
      pad(C8A.B, { center: 60, ...C8A_SP }),
    ],
    br: [
      bars(C8A_BR),
      bassLine(C8A.br, '1:3! 1:3 8:2 1:3 1:3 5:2', C8A_SP),
      arp(C8A.br, '0:2! 0:1 1:1 2:2 1:2 0:2. 2:2 1:1 0:1 1:2', { center: 62, ...C8A_SP }),
      drums(4, 'tl:2! R:1 R:1 tl:2 R:1 R:1 tl:2! tl:1 R:1 tl:2 R:1 R:1'),
      drums(4, 'k:4! r:4 k:2 p:2 r:4', { last: C8A_FILL }),
      rest(4),
      pad(C8A.br, { center: 57, ...C8A_SP }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ───────────── 第8章 よみの海底神殿（ホ短調 104。オルガンの 和音 ＋ 低い はじく 音の きざみ。青い 火の ような 冷たい ベル）─────────────
const C8B = {
  intro: ['Em', 'Em'],
  A: ['Em', 'C', 'Am', 'B', 'Em', 'C', 'D', 'B'],
  A2: ['Em', 'C', 'Am', 'B', 'C', 'D', 'B', 'Em'],
  B: ['G', 'D', 'Em', 'C', 'Am', 'B', 'Em', 'C', 'Am', 'D', 'B', 'B'],
  br: ['Em', 'Em', 'C', 'B'],
};
// 前の 動機（ミ・ソ・シ／ド・シ・ラ・ソ）
const C8B_A = [
  'E5:6! G5:2 B5:6 A5:2', 'C6:4 B5:2 A5:2 G5:6 E5:2', 'A5:4 C6:4 E5:6 F#5:2', 'D#5:4 F#5:4 B5:8',
  'B5:4! A5:2 G5:2 E5:4 G5:4', 'E5:4 G5:4 C6:6 B5:2', 'A5:4 F#5:4 D5:6 E5:2', 'F#5:4 D#5:4 B4:8',
];
const C8B_A2 = [
  ...C8B_A.slice(0, 3),
  'D#5:4 F#5:4 B5:4 D#6:4', 'E6:6! D6:2 C6:4 G5:4', 'F#5:4 A5:4 D6:6 C6:2', 'B5:4 A5:2 F#5:2 D#5:4 F#5:4', 'E5:8 r:8',
];
const C8B_B = [
  'D6:6! B5:2 G5:8', 'A5:6 D6:2 F#5:8', 'G5:6 B5:2 E6:8', 'E6:4 D6:2 C6:2 G5:8',
  'C6:6! B5:2 A5:4 E5:4', 'D#6:6 B5:2 F#5:4 A5:4', 'G5:4 B5:4 E6:6 D6:2', 'C6:12 r:4',
  'A5:6 C6:2 E6:8', 'D6:6! C6:2 A5:4 F#5:4', 'D#6:6 F#6:2 B5:8', 'B5:8 r:8',
];
const C8B_BR = ['r:16', 'r:8 E5:2. G5:2. B5:2. r:2', 'r:16', 'r:8 D#5:2. F#5:2. B5:2. r:2'];
const C8B_FILL = 'k:2! r:2 s:2 r:2 tl:1 tl:1 tl:1 t:1 t:1 th:1 s:1 s:1';

const c8b_temple = {
  bpm: 104, bar: 16, reverb: 0.42, night: {},
  parts: [
    { i: 'soft_lead', v: 0.1, minIntensity: 0 },
    { i: 'bass', v: 0.17, role: 'bass', minIntensity: 0 },
    { i: 'pluck', v: 0.05, minIntensity: 0, pan: 0.3 },
    { i: 'organ', v: 0.026, minIntensity: 0, pan: -0.3 },
    { drums: true, v: 0.32, minIntensity: 0 },
    { drums: true, v: 0.5, minIntensity: 0.55 },
    { i: 'bell', v: 0.03, minIntensity: 0.8, pan: 0.45 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(C8B.intro, ['1:8! r:8', '1:2! 1:2? 8:2? 1:2 1:2! 1:2? 5:2? 1:2'], { lo: 33 }),
      arp(C8B.intro, '0:2. 1:2. 2:2. 1:2. 0:2. 1:2. 2:2. 3:2.', { center: 59 }),
      pad(C8B.intro, { center: 64 }),
      drums(2, ['r:16', 'h:2! h:2? h:2 R:2 h:2? h:2 R:2 h:2?']),
      drums(2, ['r:16', 'r:8 tl:1 tl:1 tl:1 t:1 t:1 th:1 s:1 s:1']),
      rest(2),
    ],
    A: [
      bars(C8B_A),
      bassLine(C8B.A, '1:2! 1:2? 8:2? 1:2 1:2! 1:2? 5:2? 1:2', { lo: 33 }),
      arp(C8B.A, '0:2. 1:2. 2:2. 1:2. 0:2. 1:2. 2:2. 3:2.', { center: 59 }),
      comp(C8B.A, 'x:4! r:4 x:2. x:2. r:4', { center: 64 }),
      drums(8, 'h:2! h:2? h:2 R:2 h:2? h:2 R:2 h:2?'),
      drums(8, 'k:2! r:2 r:2 k:2 s:2! r:2 r:2 k:2', { first: 'c:2! r:2 r:2 k:2 s:2! r:2 r:2 k:2', last: C8B_FILL }),
      arp(C8B.A, '0:2 2:2? 4:2 2:2? 1:2 3:2? 5:2 3:2?', { center: 77 }),
    ],
    A2: [
      bars(C8B_A2),
      bassLine(C8B.A2, '1:2! 1:2? 8:2? 1:2 1:2! 3:2? 5:2? 8:2', { lo: 33 }),
      arp(C8B.A2, '0:1. 0:1? 1:2. 2:2. 3:1. 3:1? 2:2. 1:2. 0:2. 1:2', { center: 59 }),
      comp(C8B.A2, 'x:6 x:2 r:4 x:4', { center: 65 }),
      drums(8, 'h:1! h:1? h:1? h:1? R:2 h:2? h:1 h:1? h:1? h:1? R:2 h:2?'),
      drums(8, 'k:2! r:2 s:2! k:2 r:2 k:2 s:2! r:2', { last: C8B_FILL }),
      guide(C8B.A2, 'x:4 x:4 x:8', { center: 79 }),
    ],
    B: [
      bars(C8B_B),
      bassLine(C8B.B, '1:4! 8:2? 1:2 1:4! 5:2? 8:2', { lo: 33 }),
      arp(C8B.B, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 1:2', { center: 60 }),
      pad(C8B.B, { center: 64 }),
      drums(12, 'h:2! o:2? h:2 R:2 h:2? o:2? R:2 h:2?'),
      drums(12, 'k:2! r:2 s:2! r:2 k:2 k:2 s:2! r:2', { first: 'c:2! r:2 s:2! r:2 k:2 k:2 s:2! r:2', last: C8B_FILL }),
      arp(C8B.B, '5:2 4:2? 3:2 2:2? 3:2 4:2? 5:2 4:2?', { center: 74 }),
    ],
    br: [
      bars(C8B_BR),
      bassLine(C8B.br, '1:2! r:2 r:2 1:2 1:2! r:2 1:2 r:2', { lo: 33 }),
      arp(C8B.br, '0:2. r:2 0:2. 1:2. r:2 2:2. 1:2. r:2', { center: 59 }),
      pad(C8B.br, { center: 62 }),
      drums(4, 'R:2! r:2 h:2? R:2 r:2 R:2 h:2? R:2?'),
      drums(4, 'k:4! r:4 k:2 k:2 r:4', { last: C8B_FILL }),
      rest(4),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

export const R77B_TRACKS = { field, town, cave, past_field, c7_temple, c7i_castle, c8a_palace, c8b_temple };
// テスト用（どの 曲が ダンジョンの 強さの 作りか）
export const R77B_DUNGEON_IDS = ['cave', 'c7_temple', 'c7i_castle', 'c8a_palace', 'c8b_temple'];
