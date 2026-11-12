// 第80回 F: 第8章 第4幕「時のはざま」の 曲（audio.js が 前の 曲の 上に かぶせる。書き方は docs/plan-r77-audio.md の 2）
// 曲の せつめい（キー・形・強さと だんの 作り・はかった 数字）は docs/plan-r80-audio.md。曲は すべて オリジナル
//
// ・c8r_hall … 時の広間（イ長調 88。止まった 時間と 時計の きざみ。強さ 0.4 = ベルと きざみ → 1.0 = 全部）
// ・c8r_wing … 4つの つばさ（ホ短調 112。はじく 音と 低音の リズム。今までの ダンジョンの 動機を 1フレーズずつ）
// ・c8r_gate … 時の門番（嬰ヘ短調 156。上品で つめたい → サビで 重く。だんで キーと テンポ・ピンチ）
// ・c8r_last … 最後の回廊（ニ長調 120。ミドリナ地方と 千年前の ミドリナ地方の 動機を 合わせる）
// ・solitus … 最後の戦い（だん 0 ニ短調 140 おそろしい ／ だん 1 ニ短調 92 かなしい ／ だん 2 ニ長調 152 みんなの 力）
//            だんごとに 区切りの ならび（phases[n].form）が かわる。前の音 では 第1部の 曲（legacy）
// ・ending2 … エンディング（第2部。ト長調 84。勝利の 動機 → 町の 動機 → 大きく 広がる）
//
// メロディは 手で 書く（1小節 = 16分音符 16）。ベース・きざみ・和音・アルペジオは 和音の ならびから 下の 小さな 道具で 作る
// （道具は audio-r77b.js と 同じ 考え方。和音は 1小節に 'D' か 'Em A'（小節を 等分））

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
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  if (!m || !QUAL[m[2]]) throw new Error(`c8r chord: ${sym}`);
  return { root: PC[m[1]], iv: QUAL[m[2]] };
}

function chordAt(bar, step) {
  const syms = bar.trim().split(/\s+/);
  return chordOf(syms[Math.min(syms.length - 1, Math.floor((step * syms.length) / B16))]);
}

// 型（'1:2! 5:2.' など）を 小節ごとに 読んで fn（字・和音）で 音に する。型が 配列なら 小節ごとに かわるがわる
function walk(prog, pat, fn) {
  const pats = Array.isArray(pat) ? pat : [pat];
  return prog.map((bar, bi) => {
    let step = 0;
    return pats[bi % pats.length].trim().split(/\s+/).map((tok) => {
      const mm = /^([^:]+):(\d+)([!?.~]*)$/.exec(tok);
      if (!mm) throw new Error(`c8r pattern: ${tok}`);
      const [, deg, len, mods] = mm;
      const at = step;
      step += Number(len);
      if (deg === 'r') return `r:${len}`;
      return `${fn(deg, chordAt(bar, at))}:${len}${mods}`;
    }).join(' ');
  }).join(' ');
}

// ベース: 1 根音・8 オクターブ上・5 5度・3 3度・-5 下の 5度。lo … 根音の いちばん 低い 音（MIDI）。強拍（0・8）は いつも 1 か 8
function bassLine(prog, pat, { lo = 38, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const r = lo + (((ch.root - lo) % 12) + 12) % 12;
    const d = { 1: r, 8: r + 12, 3: r + ch.iv[1], 5: r + ch.iv[2], '-5': r + ch.iv[2] - 12 }[deg];
    if (d === undefined) throw new Error(`c8r bass: ${deg}`);
    return nm(d, sp);
  });
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
function comp(prog, pat, { center = 64, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const sel = deg === 'l' ? v.slice(0, 2) : deg === 'h' ? v.slice(-2) : v;
    return `[${sel.map((m) => nm(m, sp)).join(' ')}]`;
  });
}

// アルペジオ: 数字 = 和音の 下からの 何番目（和音の 数を こえると 1オクターブ上）
function arp(prog, pat, { center = 72, sp = SHARP } = {}) {
  return walk(prog, pat, (deg, ch) => {
    const v = voicing(ch, center);
    const k = Number(deg);
    if (!Number.isInteger(k)) throw new Error(`c8r arp: ${deg}`);
    return nm(v[k % v.length] + 12 * Math.floor(k / v.length), sp);
  });
}

// 対旋律（ガイドトーン）: x の たびに 前の 音に いちばん 近い 和音の 音（同じ 音は 少し さける）
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
const FILL = 'k:2! r:2 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1';

// ═════════════ c8r_hall: 時の広間（イ長調 88）═════════════
// 止まった 時間: maj7 の のばしと ベル。時計の きざみ（リム ＝ チク・ハイハット ＝ タク）が ずっと 鳴る（ねむく ならない）
// 強さ（クリアした つばさの 数。audio-scene.js）: 0.4 ベル・きざみ ／ 0.55 ＋ 低音 ／ 0.7 ＋ のばし ／ 0.85 ＋ 笛の 対旋律 ／ 1.0 ＋ ハープ・たいこ
const HALL = {
  intro: ['Amaj7', 'Amaj7'],
  A: ['Amaj7', 'F#m7', 'Dmaj7', 'Esus4 E', 'Amaj7', 'C#m7', 'Dmaj7', 'Esus4'],
  A2: ['Amaj7', 'F#m7', 'Dmaj7', 'Esus4 E', 'F#m7', 'C#m7', 'Bm7', 'Esus4 E'],
  B: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'Bm7', 'Esus4 E'],
  br: ['Dmaj7', 'Esus4'],
};
// 時計の 鐘のような 4つの 音（ミ・ド#・シ・ド#）から
const HALL_A = [
  'E5:4! C#5:4 B4:4 C#5:4', 'A5:6 G#5:2 F#5:8', 'F#5:4! E5:4 A5:4 F#5:4', 'E5:12 r:4',
  'E5:4! C#6:4 B5:4 A5:4', 'G#5:6 E5:2 C#5:8', 'D5:4 F#5:4 A5:4 B5:4', 'A5:6 B5:2 E5:8',
];
const HALL_A2 = [
  ...HALL_A.slice(0, 4),
  'C#6:4! A5:4 F#5:4 A5:4', 'B5:6 G#5:2 E5:8', 'D6:4 C#6:4 B5:4 F#5:4', 'E5:6 F#5:2 G#5:8',
];
const HALL_B = [
  'A5:8! C#6:4 B5:4', 'A5:6 F#5:2 D5:8', 'E5:4 A5:4 C#6:6 B5:2', 'B5:12 r:4',
  'C#6:8! E6:4 C#6:4', 'D6:6 C#6:2 A5:8', 'B5:4 A5:4 F#5:4 D5:4', 'E5:8 G#5:4 B5:4',
];
const HALL_BR = ['F#5:4 A5:4 E6:8', 'r:8 B4:4 C#5:4'];
const TICK = 'R:4! h:4? R:4 h:4?';
const TICK8 = 'R:2! h:2? h:2? h:2? R:2 h:2? h:2? h:2?';

const c8r_hall = {
  bpm: 88, bar: 16, reverb: 0.4, night: {},
  parts: [
    { i: 'bell', v: 0.13, role: 'lead', minIntensity: 0 },
    { i: 'sub_bass', v: 0.17, role: 'bass', minIntensity: 0.55 },
    { i: 'pad', v: 0.034, role: 'harmony', minIntensity: 0.7, pan: -0.3 },
    { i: 'flute', v: 0.055, role: 'harmony', minIntensity: 0.85, pan: 0.35 },
    { i: 'pluck', v: 0.034, role: 'harmony', minIntensity: 1, pan: -0.4 },
    { drums: true, v: 0.42, minIntensity: 0 },
    { drums: true, v: 0.4, minIntensity: 1 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'E6:4 C#6:4 B5:4 A5:4']),
      bassLine(HALL.intro, ['r:16', '1:16'], { lo: 33 }),
      pad(HALL.intro, { center: 64 }),
      rest(2),
      rest(2),
      drums(2, TICK),
      rest(2),
    ],
    A: [
      bars(HALL_A),
      bassLine(HALL.A, '1:8! 5:4 8:4', { lo: 33 }),
      pad(HALL.A, { center: 64 }),
      `${rest(4)} ${guide(HALL.A.slice(4), 'x:8 x:8', { center: 69 })}`,
      arp(HALL.A, '0:2 1:2 2:2 3:2 2:2 1:2 0:2 1:2', { center: 62 }),
      drums(8, TICK),
      drums(8, 'k:4! r:4 r:4 k:4?'),
    ],
    A2: [
      bars(HALL_A2),
      bassLine(HALL.A2, '1:4! 8:4 1:4 5:4', { lo: 33 }),
      pad(HALL.A2, { center: 65 }),
      guide(HALL.A2, 'x:6 x:2 x:8', { center: 69 }),
      arp(HALL.A2, '0:2 2:2 1:2 3:2 2:2 4:2 3:2 1:2', { center: 64 }),
      drums(8, TICK8),
      drums(8, 'k:4! r:4 R:4 r:2 k:2?'),
    ],
    B: [
      bars(HALL_B),
      bassLine(HALL.B, '1:6! 1:2 5:4 8:4', { lo: 33 }),
      pad(HALL.B, { center: 66 }),
      guide(HALL.B, 'x:4 x:4 x:8', { center: 72 }),
      arp(HALL.B, '0:1 1:1 2:1 3:1 2:1 1:1 0:1 1:1 2:1 3:1 4:1 3:1 2:1 1:1 2:1 1:1', { center: 64 }),
      drums(8, 'R:4! h:2? h:2? R:4 h:2? o:2?'),
      drums(8, 'k:4! r:2 k:2 s:4? r:4', { first: 'c:4! r:2 k:2 s:4? r:4' }),
    ],
    br: [
      bars(HALL_BR),
      bassLine(HALL.br, '1:16', { lo: 33 }),
      pad(HALL.br, { center: 64 }),
      rest(2),
      arp(HALL.br, '0:2. 1:2. 2:2. 3:2. r:8', { center: 66 }),
      drums(2, TICK),
      drums(2, 'k:4! r:12', { last: 'r:8 tl:2? t:2? th:2? s:2?' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ═════════════ c8r_wing: 4つの つばさ（ホ短調 112）═════════════
// はじく 音の くりかえしと 低音の リズム。mem（思い出の 区切り）で 今までの ダンジョンの 動機を 4小節ずつ:
//   月の王宮（c8a_palace。ダルブッカの タム）→ よみの海底神殿（c8b_temple。しずかな リム）→ くろがねの空中ようさい（c8c_fort。行進の スネア）→ 氷の竜の城（c7i_castle。走る ベース）
//   どれも この 曲の キー（ホ短調）に うつした
const WING = {
  intro: ['Em', 'Em'],
  A: ['Em', 'Em', 'C', 'D', 'Am', 'Em', 'C', 'B'],
  B: ['C', 'D', 'G', 'Em', 'Am', 'D', 'B7', 'B7'],
  mem: ['Em', 'C', 'B', 'Em', 'Em', 'C', 'Am', 'B', 'Em', 'C', 'D', 'Em', 'Em', 'C', 'G', 'D'],
  br: ['C', 'B'],
};
const WING_A = [
  'B4:2! E5:2 G5:2 B5:4 A5:2 G5:2 F#5:2', 'G5:4 E5:2 F#5:2 G5:4. A5:2 B5:2', 'C6:4! B5:2 A5:2 G5:4 E5:4', 'F#5:4 A5:4 D6:6 C6:2',
  'C6:4! B5:2 A5:2 E5:4 A5:4', 'G5:4 F#5:2 E5:2 B4:8', 'E5:2 G5:2 C6:6 B5:2 A5:2 G5:2', 'F#5:6! D#5:2 B4:8',
];
const WING_B = [
  'E6:6! D6:2 C6:4 G5:4', 'F#6:6 E6:2 D6:4 A5:4', 'G6:4 F#6:2 E6:2 D6:4 B5:4', 'E6:12 r:4',
  'C6:6! B5:2 A5:4 E6:4', 'D6:6 C6:2 A5:4 F#5:4', 'D#6:6 F#6:2 A6:4 F#6:4', 'B5:8 r:4 B4:2 D#5:2',
];
const WING_MEM = [
  // 月の王宮（ニ短調 → ホ短調）
  'E5:2! F#5:1 G5:1 B5:6 A5:2 G5:2 F#5:2', 'G5:4! F#5:2 E5:2 C5:6 r:2', 'D#5:2! E5:1 D#5:1 F#5:4 B5:6 A5:2', 'G5:2 F#5:2 E5:2 D#5:2 E5:8',
  // よみの海底神殿（ホ短調）
  'E5:6! G5:2 B5:6 A5:2', 'C6:4 B5:2 A5:2 G5:6 E5:2', 'A5:4 C6:4 E5:6 F#5:2', 'D#5:4 F#5:4 B5:8',
  // くろがねの空中ようさい（ハ短調 → ホ短調）
  'E5:3! E5:1 G5:4 B5:6 r:2', 'C6:4 B5:2 A5:2 G5:8', 'D5:3! D5:1 F#5:4 A5:6 r:2', 'G5:4 F#5:2 E5:2 E5:8',
  // 氷の竜の城（ロ短調 → ホ短調）
  'B4:4! E5:4 G5:6 F#5:2', 'E5:4 C5:4 G4:6 A4:2', 'D5:2. D5:2 B4:4 G4:6 A4:2', 'A4:4 F#4:4 D5:4 F#5:4',
];
const WING_BR = ['C6:4! B5:2 A5:2 G5:4 E5:4', 'F#5:8 D#5:4 B4:4'];
const W_ARP = '0:2! 1:2 2:2 1:2 3:2 1:2 2:2 1:2';
const W_ARP16 = '0:1! 2:1 1:1 2:1 3:1 2:1 1:1 2:1 0:1! 2:1 1:1 2:1 3:1 2:1 4:1 2:1';

const c8r_wing = {
  bpm: 112, bar: 16, reverb: 0.32, night: {},
  parts: [
    { i: 'lead', w: 'square', v: 0.085, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.18, role: 'bass', minIntensity: 0 },
    { i: 'pluck', w: 'square', v: 0.045, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'strings', v: 0.028, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'bell', v: 0.03, role: 'harmony', minIntensity: 0, pan: 0.45 },
    { drums: true, v: 0.45, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(WING.intro, ['1:3! 1:3 1:2 8:3! 1:3 5:2', '1:3! 1:3 1:2 8:2 5:2 8:2 1:2'], { lo: 33 }),
      arp(WING.intro, W_ARP, { center: 64 }),
      rest(2),
      rest(2),
      drums(2, ['k:4! r:4 k:4 r:4', FILL]),
    ],
    A: [
      bars(WING_A),
      bassLine(WING.A, '1:3! 1:3 1:2 8:3! 1:3 5:2', { lo: 33 }),
      arp(WING.A, W_ARP, { center: 64 }),
      `${rest(4)} ${pad(WING.A.slice(4), { center: 62 })}`,
      rest(8),
      drums(8, 'k:2! h:2 R:2 h:2 k:2 k:2 R:2! h:2', { last: FILL }),
    ],
    B: [
      bars(WING_B),
      bassLine(WING.B, '1:2! 8:2 1:2 8:2 1:2! 8:2 5:2 8:2', { lo: 33 }),
      arp(WING.B, W_ARP16, { center: 66 }),
      pad(WING.B, { center: 64 }),
      guide(WING.B, 'x:8 x:8', { center: 76 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! o:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! o:2', last: FILL }),
    ],
    mem: [
      bars(WING_MEM),
      [
        bassLine(WING.mem.slice(0, 4), '1:2! r:1 1:1 8:2 1:2 1:2! r:1 1:1 5:2 8:2', { lo: 33 }),
        bassLine(WING.mem.slice(4, 8), '1:8! 5:4 8:4', { lo: 33 }),
        bassLine(WING.mem.slice(8, 12), '1:4! 5:4 1:4! 5:4', { lo: 33 }),
        bassLine(WING.mem.slice(12), '1:2! 1:1 1:1 8:2 1:1 1:1 1:2! 1:1 1:1 8:2 5:2', { lo: 33 }),
      ].join(' '),
      [
        arp(WING.mem.slice(0, 4), '0:2. r:2 2:1 1:1 0:2. 3:2. r:2 2:2. 1:2', { center: 62 }),
        arp(WING.mem.slice(4, 8), '0:4 1:4 2:4 1:4', { center: 60 }),
        comp(WING.mem.slice(8, 12), 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 62 }),
        arp(WING.mem.slice(12), W_ARP16, { center: 66 }),
      ].join(' '),
      [
        rest(4),
        pad(WING.mem.slice(4, 8), { center: 62 }),
        rest(4),
        pad(WING.mem.slice(12), { center: 64 }),
      ].join(' '),
      // ベル: それぞれの 思い出の はじめに 1つ
      bars(['B5:8! r:8', rest(3), 'E6:8! r:8', rest(3), 'B5:8! r:8', rest(3), 'G5:8! r:8', rest(3)]),
      [
        drums(4, 'k:2! r:2 t:2 R:2 k:2 R:2 t:2 tl:2'),
        drums(4, 'k:4! h:2? R:2 h:4? R:4'),
        drums(4, 'k:2! r:2 s:2! r:2 k:2 k:2 s:2! s:1 s:1'),
        drums(4, 'k:2! k:1 k:1 s:2! k:2 k:2! k:1 k:1 s:2! h:2', { last: FILL }),
      ].join(' '),
    ],
    br: [
      bars(WING_BR),
      bassLine(WING.br, '1:2! 8:2 1:2 8:2 1:2! 1:1 1:1 8:2 5:2', { lo: 33 }),
      arp(WING.br, W_ARP16, { center: 64 }),
      pad(WING.br, { center: 64 }),
      rest(2),
      drums(2, 'k:2! h:2 s:2 h:2 k:2 s:1 s:1 s:2 s:2', { last: 'c:4! r:4 tl:2 t:2 th:2 s:2' }),
    ],
  },
  form: ['intro', 'A', 'B', 'mem', 'br'],
  loopFrom: 1,
};

// ═════════════ c8r_gate: 時の門番（嬰ヘ短調 156）═════════════
// A・A' は 上品で つめたい（スタッカートの メヌエットふうの メロディ・オルゴールの アルペジオ・リムの たいこ）。G（ナポリの 和音）で 見くだす ひびき
// B（サビ）は 重い（のびる メロディ・ブラスの 打ちこみ・ダブルの キック）。C は 半音で からかう つなぎ
const GATE = {
  intro: ['F#m', 'C#'],
  A: ['F#m', 'Bm', 'C#', 'F#m', 'D', 'Bm', 'G', 'C#'],
  A2: ['F#m', 'Bm', 'C#', 'F#m', 'D', 'E', 'A', 'C#'],
  B: ['F#m', 'D', 'E', 'C#', 'F#m', 'D', 'G', 'C#', 'Bm', 'C#', 'F#m', 'D', 'Bm', 'G', 'C#', 'C#'],
  C: ['F#m', 'F#m', 'G', 'G', 'D', 'D', 'C#', 'C#'],
};
const GATE_A = [
  'C#6:2! B5:1 C#6:1 A5:2. F#5:2. C#6:4 F#6:4', 'D6:2! C#6:1 D6:1 B5:2. F#5:2. D6:4 B5:4', 'F6:2! D#6:1? F6:1 G#6:4 F6:2 C#6:2 G#5:4', 'F#6:4! C#6:2. A5:2. F#5:8',
  'A5:2! G#5:1? A5:1 F#5:2. D5:2. A5:4 D6:4', 'D6:2! C#6:1? D6:1 B5:2. F#5:2. F#6:4 D6:4', 'D6:4! B5:2 G5:2 B5:4 D6:4', 'C#6:4 G#5:2 F5:2 G#5:8',
];
const GATE_A2 = [
  ...GATE_A.slice(0, 4),
  'F#6:4! D6:2 A5:2 F#6:4 A6:4', 'G#6:4 E6:2 B5:2 G#5:4 B5:4', 'A6:4! E6:2 C#6:2 A5:4 C#6:4', 'G#6:6 F6:2 C#6:8',
];
const GATE_B = [
  'F#5:8! A5:4 C#6:4', 'D6:6 C#6:2 A5:8', 'B5:8! G#5:4 E5:4', 'F5:4 G#5:4 C#6:8',
  'F#5:6! A5:2 C#6:4 F#6:4', 'F#6:6 E6:2 D6:4 A5:4', 'G6:6! F#6:2 D6:4 B5:4', 'F6:8 C#6:4 G#5:4',
  'D6:8! F#6:4 D6:4', 'C#6:6 F5:2 G#5:8', 'A5:8! C#6:4 F#6:4', 'F#6:6 A6:2 D6:8',
  'B5:6! D6:2 F#6:8', 'G6:6 F#6:2 D6:4 B5:4', 'F6:8! G#6:4 F6:4', 'C#6:12 r:4',
];
const GATE_C = [
  'F#5:1! G5:1? F#5:2. r:2 C#6:2. r:2 C6:1? C#6:1 A5:2. r:2', 'F#6:2. r:2 E6:2. r:2 C#6:2. r:2 A5:2 B5:2',
  'G5:1! G#5:1? G5:2. r:2 D6:2. r:2 C#6:1? D6:1 B5:2. r:2', 'G6:2. r:2 F#6:2. r:2 D6:2. r:2 B5:2 C#6:2',
  'A5:4! D6:4 F#6:4 E6:2 D6:2', 'A5:4 C#6:2 B5:2 A5:4 F#5:4', 'G#5:4! C#6:4 F6:4 G#6:4', 'C#6:2! r:2 F5:2 G#5:2 C#6:2 F6:2 G#6:4',
];

const c8r_gate = {
  bpm: 156, bar: 16, reverb: 0.2,
  parts: [
    { i: 'lead', w: 'pulse', v: 0.1, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.19, role: 'bass', minIntensity: 0 },
    { i: 'musicbox', v: 0.034, role: 'harmony', minIntensity: 0, pan: 0.4 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'brass', v: 0.05, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { drums: true, v: 0.55, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 C#6:2. G#5:2. F5:2. C#5:2.']),
      bassLine(GATE.intro, ['1:2! r:2 1:2! r:2 1:2! r:6', '1:2! r:2 1:2! r:2 1:1 1:1 1:1 1:1 8:4!'], { lo: 33 }),
      rest(2),
      pad(GATE.intro, { center: 64 }),
      comp(GATE.intro, ['x:2! r:2 x:2! r:2 x:2! r:6', 'x:2! r:2 x:2! r:2 r:4 x:4!'], { center: 62 }),
      drums(2, ['k:2! r:2 k:2! r:2 k:2! r:2 s:1 s:1 s:1 s:1', 'c:2! r:2 k:2! r:2 t:2 t:2 tl:2 tl:2']),
    ],
    A: [
      bars(GATE_A),
      bassLine(GATE.A, '1:2! 8:2? 5:2 8:2? 1:2! 8:2? 5:2 8:2?', { lo: 33 }),
      arp(GATE.A, '0:2. 1:2. 2:2. r:2 4:2. 3:2. 2:2. r:2', { center: 79 }),
      `${rest(4)} ${pad(GATE.A.slice(4), { center: 64 })}`,
      rest(8),
      drums(8, 'k:2! h:2 R:2 h:2 k:2 h:2 R:2! h:2', { last: 'k:2! h:2 R:2 h:2 R:1 R:1 t:1 t:1 th:1 th:1 tl:1 tl:1' }),
    ],
    A2: [
      bars(GATE_A2),
      bassLine(GATE.A2, '1:2! 1:2 8:2 1:2 1:2! 1:2 5:2 8:2', { lo: 33 }),
      arp(GATE.A2, '0:2 1:2 2:2 r:2 4:2 3:2 2:2 r:2', { center: 79 }),
      pad(GATE.A2, { center: 65 }),
      comp(GATE.A2, 'x:2! r:14', { center: 62 }),
      drums(8, 'k:2! h:1 h:1? s:2! h:2 k:2 k:1 h:1? s:2! h:2', { first: 'c:2! h:1 h:1? s:2! h:2 k:2 k:1 h:1? s:2! h:2', last: FILL }),
    ],
    B: [
      bars(GATE_B),
      bassLine(GATE.B, '1:2! 1:2 r:2 1:2 1:2! 1:1 1:1 8:2 1:2', { lo: 33 }),
      `${rest(8)} ${arp(GATE.B.slice(8), '0:2? 1:2? 2:2? 3:2? 4:2? 3:2? 2:2? 1:2?', { center: 81 })}`,
      pad(GATE.B, { center: 66 }),
      comp(GATE.B, 'x:2! r:6 x:2. r:2 x:4!', { center: 62 }),
      drums(16, 'k:2! k:2 s:2! k:2 k:2! k:2 s:2! t:1 tl:1', { first: 'c:2! k:2 s:2! k:2 k:2! k:2 s:2! t:1 tl:1', last: FILL }),
    ],
    C: [
      bars(GATE_C),
      bassLine(GATE.C, '1:4! r:2 1:2 1:4! r:2 8:2', { lo: 33 }),
      arp(GATE.C, '0:2. r:2 2:2. r:2 4:2. r:2 3:2. r:2', { center: 81 }),
      rest(8),
      comp(GATE.C, 'x:2.! r:6 x:2. r:6', { center: 62 }),
      drums(8, 'tl:2! tl:2 t:2 tl:2 k:2! t:2 th:2 t:2', { last: 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  // 変身（だん）: 0 嬰ヘ短調 → 1 ト短調 → 2 イ短調 → 3 ロ短調（テンポも 少しずつ）
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 1, tempo: 1.03 },
    { transpose: 3, tempo: 1.06 },
    { transpose: 5, tempo: 1.1 },
  ],
  // ピンチ: 高い ファ#・ド# を きざみ、半音上の ソで 見くだす
  pinch: { n: 'F#6:2! C#6:2 F#6:2 G6:2 F#6:2! C#6:2 F#6:2 F6:2', i: 'chip_arp', v: 0.03 },
};

// ═════════════ c8r_last: 最後の回廊（ニ長調 120）═════════════
// A は ミドリナ地方の 動機（ラ・レ・ミ・ファ#）、A' は 千年前の ミドリナ地方の 動機（ファ#・ラ・レ・ド#）＋ ブラスが ミドリナの 動機。
// B（サビ）は 2つの 動機を 交互に 大きく。ベースと たいこは ずっと 前へ 進む 8分
const LAST = {
  intro: ['Bm', 'A'],
  A: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'],
  A2: ['D', 'G', 'Bm', 'A', 'G', 'A', 'F#m', 'Bm'],
  B: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D', 'Em', 'F#m', 'G', 'A', 'Bm', 'G', 'A', 'A'],
  br: ['G', 'A', 'Bm', 'A'],
};
const LAST_A = [
  'A4:2 D5:2 E5:2 F#5:4! A5:2 G5:2 F#5:2', 'E5:6 C#5:2 A4:4 E5:4', 'F#5:2 B5:2 C#6:2 D6:4! C#6:2 B5:2 F#5:2', 'G5:8 B5:4 D6:4',
  'A5:2 D6:2 E6:2 F#6:4! E6:2 D6:2 A5:2', 'C#6:6 B5:2 A5:4 E5:4', 'B5:4 A5:2 G5:2 D5:4 G5:4', 'A5:8 C#6:4 E6:4',
];
const LAST_A2 = [
  'F#5:4! A5:4 D6:6 C#6:2', 'B5:4 G5:4 B5:4 D6:4', 'F#5:4! B5:4 D6:6 C#6:2', 'C#6:4 A5:4 E5:8',
  'D6:4! B5:2 G5:2 B5:4 D6:4', 'E6:6 C#6:2 A5:8', 'C#6:4 A5:2 F#5:2 A5:4 C#6:4', 'B5:8 r:4 A5:2 B5:2',
];
// ブラス: A' で ミドリナ地方の 動機を 下で
const LAST_A2_BRASS = [
  'A3:2 D4:2 E4:2 F#4:6 E4:2 D4:2', 'D4:8 B3:8', 'F#4:2 B3:2 C#4:2 D4:6 C#4:2 B3:2', 'C#4:8 E4:8',
  'B3:2 D4:2 E4:2 G4:6 F#4:2 E4:2', 'E4:8 C#4:8', 'C#4:8 A3:8', 'D4:8 F#4:8',
];
const LAST_B = [
  'D5:4! G5:4 A5:4 B5:4', 'C#6:8 B5:4 A5:4', 'A5:6 F#5:2 C#6:8', 'B5:12 A5:2 B5:2',
  'D6:4! G6:4 E6:4 D6:4', 'C#6:6 D6:2 E6:8', 'F#6:8! E6:4 D6:4', 'D6:8 r:4 A5:2 B5:2',
  'G5:6! A5:2 B5:4 E6:4', 'C#6:6 B5:2 A5:4 F#5:4', 'B5:4 D6:4 G6:6 F#6:2', 'E6:8 C#6:4 A5:4',
  'D6:6! C#6:2 B5:4 F#5:4', 'G5:4 B5:4 D6:4 G6:4', 'F#6:6 E6:2 C#6:4 E6:4', 'E6:8 r:4 A5:2 C#6:2',
];
// ブラス: B の 前半は 千年前の 動機（ファ#・ラ・レ・ド#）を 下で
const LAST_B_BRASS = [
  'B3:4! D4:4 G4:6 F#4:2', 'E4:8 C#4:8', 'C#4:4! F#4:4 A4:8', 'F#4:8 D4:8',
  'B3:4! D4:4 G4:6 F#4:2', 'E4:8 A4:8', 'F#4:4! A4:4 D5:6 C#5:2', 'D5:8 A4:8',
];
const LAST_BR = ['r:8 A4:2. D5:2. E5:2. F#5:2.', 'G5:4! r:4 E5:2. F#5:2. G5:2. A5:2.', 'B5:4! r:4 F#5:2. B5:2. C#6:2. D6:2.', 'E6:4! r:4 C#6:2 A5:2 E5:2 C#5:2'];

const c8r_last = {
  bpm: 120, bar: 16, reverb: 0.26, night: {},
  parts: [
    { i: 'lead', w: 'square', v: 0.09, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.18, role: 'bass', minIntensity: 0 },
    { i: 'pluck', w: 'square', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.35 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'brass', v: 0.045, role: 'harmony', minIntensity: 0, pan: -0.15 },
    { drums: true, v: 0.5, minIntensity: 0 },
  ],
  sections: {
    intro: [
      bars(['r:16', 'r:8 F#5:2 A5:2 B5:2 C#6:2']),
      bassLine(LAST.intro, ['1:2! 1:2 1:2 1:2 1:2! 1:2 1:2 1:2', '1:2! 1:2 1:2 1:2 1:2! 1:2 8:2 5:2']),
      comp(LAST.intro, 'x:2! r:2 x:2. r:2 x:2 r:2 x:2. r:2', { center: 64 }),
      pad(LAST.intro, { center: 62 }),
      rest(2),
      drums(2, ['k:2! r:2 k:2 r:2 k:2! r:2 k:2 r:2', FILL]),
    ],
    A: [
      bars(LAST_A),
      bassLine(LAST.A, '1:2! 1:2 8:2 1:2 1:2! 1:2 5:2 8:2'),
      arp(LAST.A, '0:2 1:2 2:2 1:2 3:2 1:2 2:2 1:2', { center: 66 }),
      `${rest(4)} ${pad(LAST.A.slice(4), { center: 64 })}`,
      rest(8),
      drums(8, 'k:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2 k:2 s:2! h:2', last: FILL }),
    ],
    A2: [
      bars(LAST_A2),
      bassLine(LAST.A2, '1:2! 8:2 1:2 8:2 1:2! 8:2 5:2 8:2'),
      comp(LAST.A2, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 67 }),
      pad(LAST.A2, { center: 66 }),
      bars(LAST_A2_BRASS),
      drums(8, 'k:2! h:1 h:1? s:2! h:2 k:2 k:1 h:1? s:2! o:2', { last: FILL }),
    ],
    B: [
      bars(LAST_B),
      bassLine(LAST.B, '1:2! 8:2 1:2 8:2 1:2! 1:1 1:1 8:2 5:2'),
      arp(LAST.B, '0:1 1:1 2:1 3:1 2:1 1:1 2:1 3:1 4:1 3:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 68 }),
      pad(LAST.B, { center: 64 }),
      `${bars(LAST_B_BRASS)} ${guide(LAST.B.slice(8), 'x:4! r:4 x:8', { center: 64 })}`,
      drums(16, 'k:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1', { first: 'c:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1', last: FILL }),
    ],
    br: [
      bars(LAST_BR),
      bassLine(LAST.br, '1:2! r:2 1:2. 8:2. r:2 1:2 5:2! 8:2'),
      comp(LAST.br, 'x:2.! r:6 x:2. r:6', { center: 64 }),
      rest(4),
      comp(LAST.br, 'x:4! r:12', { center: 60 }),
      drums(4, 'k:2! r:2 tl:2 k:2 s:2! r:2 t:2 th:2', { last: 'k:2! r:2 s:2 r:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'br'],
  loopFrom: 1,
};

// ═════════════ solitus: 最後の戦い（3だん）═════════════
// だんごとに 区切りの ならび（phases[n].form）が かわる（エンジンは 次の 小節の 頭で その だんの 形の はじめへ）。
//   だん 0 … おそろしい: ニ短調 140。オルガンの 和音・ブラスの 打ちこみ・ナポリの Eb。頭は 第1部の 同じ 曲の 頭（レ・ファ・ラ・ソ#）
//   だん 1 … かなしい: ニ短調 92。オルゴールが ひとりで 歌う。メロディ（のこぎり）と ブラスは やすみ・心ぞうの 音の たいこ
//   だん 2 … みんなの 力: ニ長調 152。今までの 主題が もどる（ミドリナ地方 → 町 → 勝利 → 千年前の ミドリナ地方 → だん 0 の 頭が 長調に）
const SOL = {
  intro: ['Dm', 'Eb'],
  A: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Eb', 'A'],
  A2: ['Dm', 'Dm', 'Bb', 'A', 'Bb', 'Gm', 'Eb', 'A'],
  B: ['Gm', 'Dm', 'Eb', 'A', 'Gm', 'Dm', 'Bb', 'A', 'Gm', 'Eb', 'A', 'A'],
  C: ['Dm', 'Dm', 'Eb', 'Eb', 'Dm', 'Dm', 'Eb', 'A'],
  t1: ['Dm', 'Dm'],
  S1: ['Dm', 'Bbmaj7', 'Gm7', 'A', 'Dm', 'Bbmaj7', 'Gm7', 'Asus4 A'],
  S2: ['F', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm7', 'A'],
  S3: ['Gm', 'Dm', 'Bb', 'F', 'Gm', 'Dm', 'Gm7 A', 'Dm'],
  t2: ['Bb', 'C'],
  H1: ['D', 'G', 'A', 'D', 'Bm', 'G', 'Em A', 'A'],
  H2: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em A', 'D'],
  H3: ['G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'D', 'Em', 'F#m', 'G', 'D', 'Bb', 'C', 'D', 'D'],
  H4: ['D', 'F#m', 'G', 'A', 'Bm', 'G', 'A', 'A'],
};
const SF = { sp: FLAT };
// だん 0
const SOL_A = [
  'D5:4! F5:4 A5:4 G#5:4', 'A5:8 F5:4 D5:4', 'Bb5:4! D6:4 C#6:4 Bb5:4', 'A5:4 E5:4 C#5:8',
  'D6:2! C#6:2 D6:2 A5:2 F5:4 D5:4', 'G5:4 Bb5:4 D6:4 G5:4', 'Eb6:4! D6:2 Bb5:2 G5:4 Bb5:4', 'A5:8 G5:2 F5:2 E5:2 C#5:2',
];
const SOL_A2 = [
  ...SOL_A.slice(0, 4),
  'F6:4! D6:2 Bb5:2 F5:4 Bb5:4', 'G6:6 F6:2 D6:4 Bb5:4', 'Eb6:4 G6:4 Bb6:4 G6:4', 'A6:4! E6:4 C#6:4 A5:4',
];
const SOL_B = [
  'Bb5:8! A5:4 G5:4', 'F5:8 E5:4 D5:4', 'G5:6! Bb5:2 Eb6:8', 'C#6:8 E6:4 A5:4',
  'D6:8! C6:4 Bb5:4', 'A5:8 G5:4 F5:4', 'F5:6 G5:2 Bb5:8', 'A5:12 r:4',
  'G5:4! Bb5:4 D6:4 G6:4', 'G6:6 F6:2 Eb6:8', 'E6:4! C#6:4 A5:4 G5:4', 'A5:4 G#5:4 A5:8',
];
const SOL_C = [
  'D5:2! r:2 D5:2. r:2 A4:2 r:2 Bb4:2 A4:2', 'D5:2! r:2 D5:2. r:2 F5:2 E5:2 D5:2 C#5:2',
  'Eb5:2! r:2 Eb5:2. r:2 Bb4:2 r:2 C5:2 Bb4:2', 'Eb5:2! r:2 Eb5:2. r:2 G5:2 F5:2 Eb5:2 D5:2',
  'A5:4! F5:4 D5:4 F5:4', 'A5:4 D6:4 F6:4 E6:4', 'G6:4! Eb6:4 Bb5:4 G5:4', 'A5:4 C#6:4 E6:8',
];
// だん 1（オルゴール）
const SOL_T1 = ['D5:4! F5:4 A5:4 G#5:4', 'A5:16'];
const SOL_S1 = [
  'A5:6 G5:2 F5:4 E5:4', 'D5:8 F5:4 D5:4', 'Bb5:6 A5:2 G5:4 D5:4', 'E5:8 C#5:4 E5:4',
  'F5:6 E5:2 D5:4 A5:4', 'D6:6 C6:2 Bb5:4 F5:4', 'G5:4 A5:4 Bb5:4 D6:4', 'D6:8 C#6:8',
];
const SOL_S2 = [
  'C6:6! A5:2 F5:8', 'E5:6 G5:2 C6:8', 'D6:6 C6:2 A5:4 F5:4', 'E5:12 r:4',
  'D5:4 F5:4 Bb5:6 A5:2', 'A5:6 G5:2 F5:4 C5:4', 'Bb5:6 A5:2 G5:4 F5:4', 'E5:8 r:8',
];
const SOL_S3 = [
  'D6:8! C6:4 Bb5:4', 'A5:6 G#5:2 A5:8', 'F5:6 E5:2 D5:8', 'C5:12 r:4',
  'Bb5:6 A5:2 G5:8', 'F5:6 E5:2 D5:8', 'D5:4 E5:4 C#5:8', 'D5:16',
];
// だん 2
const SOL_H1 = [
  'A5:2 D6:2 E6:2 F#6:4! E6:2 D6:2 A5:2', 'B5:2 D6:2 G6:4! G6:2 F#6:2 E6:2 D6:2', 'C#6:2 E6:2 A6:4! G6:2 F#6:2 E6:2 C#6:2', 'D6:6 A5:2 D6:4 F#6:4',
  'F#6:6! E6:2 D6:4 B5:4', 'D6:4 B5:2 G5:2 B5:4 D6:4', 'E6:4 G6:4 F#6:4 E6:4', 'E6:8 C#6:4 A5:4',
];
const SOL_H2 = [
  'A5:2. F#5:2. D5:2. F#5:2 A5:4! D6:4', 'B5:3 A5:1 F#5:2. D5:2 B4:4 D5:2 F#5:2', 'G5:2. B5:2. D6:4! B5:2 G5:2 B5:4', 'A5:2 C#6:2 E6:6 C#6:2 A5:4',
  'F#5:2! A5:2 D6:3! C#6:1 D6:1 E6:1 F#6:4! E6:2', 'D6:2 C#6:2 E6:2 D6:6 B5:4', 'G5:4 B5:4 A5:4 C#6:4', 'D6:12! r:4',
];
const SOL_H3 = [
  'D6:8! B5:4 G5:4', 'C#6:8 E6:4 C#6:4', 'A5:6 F#5:2 C#6:8', 'B5:12 A5:2 B5:2',
  'D6:6! E6:2 D6:4 B5:4', 'C#6:6 D6:2 E6:4 A5:4', 'F#6:8! E6:4 D6:4', 'D6:8 F#5:4 A5:4',
  'F#5:4! A5:4 D6:6 C#6:2', 'C#6:6 B5:2 A5:8', 'B5:4 D6:4 G6:6 F#6:2', 'F#6:8 E6:4 D6:4',
  'F6:6! D6:2 Bb5:8', 'E6:6! D6:2 C6:4 E6:4', 'D6:4 F#6:4 A6:8', 'A6:4 F#6:4 D6:8',
];
const SOL_H4 = [
  'D6:4! F#6:4 A6:4 G#6:4', 'A6:8 F#6:4 C#6:4', 'B5:4! D6:4 G6:6 F#6:2', 'E6:8 C#6:4 A5:4',
  'D6:6 C#6:2 B5:4 F#5:4', 'G5:4 B5:4 D6:4 G6:4', 'F#6:6 E6:2 C#6:4 E6:4', 'A6:8 r:4 A5:2 C#6:2',
];
// だん 2 の ブラス: H3 の 前半で 千年前の 動機を 下で
const SOL_H3_BRASS = [
  'B3:4! D4:4 G4:6 F#4:2', 'E4:8 C#4:8', 'C#4:4! F#4:4 A4:8', 'F#4:8 D4:8',
  'B3:4! D4:4 G4:6 F#4:2', 'E4:8 A4:8', 'F#4:4! A4:4 D5:6 C#5:2', 'D5:8 A4:8',
];
const D_DOOM = 'k:2! r:2 k:2 r:2 s:2! r:2 k:1 k:1 tl:2';
const D_DOOM2 = 'k:2! k:1 k:1 s:2! k:2 k:2! tl:2 s:2! t:1 tl:1';
const D_HEART = 'k:2! k:2? r:12';
const D_HERO = 'k:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1';

const solitus = {
  bpm: 140, bar: 16, reverb: 0.24,
  parts: [
    { i: 'saw_lead', v: 0.085, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.19, role: 'bass', minIntensity: 0 },
    { i: 'organ', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.3 },
    { i: 'musicbox', v: 0.06, role: 'harmony', minIntensity: 0, pan: 0.3 },
    { i: 'brass', v: 0.05, role: 'harmony', minIntensity: 0, pan: 0.15 },
    { drums: true, v: 0.55, minIntensity: 0 },
  ],
  sections: {
    // ── だん 0（おそろしい）──
    intro: [
      rest(2),
      bassLine(SOL.intro, '1:8! 1:4 -5:4', { lo: 31, ...SF }),
      pad(SOL.intro, { center: 60, ...SF }),
      bars(['r:8 A6:2? r:6', 'r:8 G6:2? r:6']),
      comp(SOL.intro, ['x:2! r:14', 'x:2! r:2 x:2! r:2 x:8!'], { center: 58, ...SF }),
      drums(2, ['k:4! r:4 tl:4 r:4', 'k:4! r:4 tl:1 tl:1 tl:1 tl:1 t:1 t:1 th:1 th:1']),
    ],
    A: [
      bars(SOL_A),
      bassLine(SOL.A, '1:2! 1:2 1:2 8:2 1:2! 1:2 1:2 8:2', { lo: 31, ...SF }),
      pad(SOL.A, { center: 60, ...SF }),
      bars(['D7:2? r:14', rest(3), 'D7:2? r:14', rest(3)]),
      comp(SOL.A, 'x:2! r:6 x:2! r:6', { center: 58, ...SF }),
      drums(8, D_DOOM, { first: 'c:2! r:2 k:2 r:2 s:2! r:2 k:1 k:1 tl:2' }),
    ],
    A2: [
      bars(SOL_A2),
      bassLine(SOL.A2, '1:1! 1:1 1:1 1:1 8:1 1:1 1:1 1:1 1:1! 1:1 1:1 1:1 5:1 1:1 8:1 1:1', { lo: 31, ...SF }),
      pad(SOL.A2, { center: 62, ...SF }),
      arp(SOL.A2, '0:2? 1:2? 2:2? 3:2? 2:2? 1:2? 0:2? 1:2?', { center: 81, ...SF }),
      comp(SOL.A2, 'x:2! r:1 x:1! r:4 x:2! r:6', { center: 58, ...SF }),
      drums(8, D_DOOM2, { last: FILL }),
    ],
    B: [
      bars(SOL_B),
      bassLine(SOL.B, '1:4! 1:2 8:2 1:4! 5:2 8:2', { lo: 31, ...SF }),
      pad(SOL.B, { center: 62, ...SF }),
      rest(12),
      guide(SOL.B, 'x:8! x:8', { center: 62, ...SF }),
      drums(12, 'k:2! h:2 s:2! h:2 k:2! k:2 s:2! h:2', { first: 'c:2! h:2 s:2! h:2 k:2! k:2 s:2! h:2', last: FILL }),
    ],
    C: [
      bars(SOL_C),
      bassLine(SOL.C, '1:2! r:2 1:2. r:2 1:2! r:2 1:2 1:2', { lo: 31, ...SF }),
      pad(SOL.C, { center: 58, ...SF }),
      bars(['r:16', 'r:16', 'r:8 Bb6:2? r:6', 'r:16', 'r:16', 'r:16', 'r:8 G6:2? r:6', 'r:8 E6:2? r:6']),
      comp(SOL.C, 'x:2! r:14', { center: 58, ...SF }),
      drums(8, 'tl:2! r:2 tl:2 r:2 k:2! r:2 t:2 tl:2', { last: 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1' }),
    ],
    // ── だん 1（かなしい。92）──
    t1: { bpm: 92, ch: [
      rest(2),
      bassLine(SOL.t1, ['1:16', 'r:16'], { lo: 31, ...SF }),
      `${pad(['Dm'], { center: 62, ...SF })} r:16`,
      bars(SOL_T1),
      rest(2),
      drums(2, D_HEART),
    ] },
    S1: { bpm: 92, ch: [
      rest(8),
      bassLine(SOL.S1, '1:16', { lo: 31, ...SF }),
      pad(SOL.S1, { center: 60, ...SF }),
      bars(SOL_S1),
      rest(8),
      drums(8, D_HEART),
    ] },
    S2: { bpm: 92, ch: [
      rest(8),
      bassLine(SOL.S2, '1:8 5:8', { lo: 31, ...SF }),
      pad(SOL.S2, { center: 62, ...SF }),
      bars(SOL_S2),
      rest(8),
      drums(8, ['k:2! k:2? r:12', 'k:2! k:2? r:8 R:4?']),
    ] },
    S3: { bpm: 92, ch: [
      rest(8),
      bassLine(SOL.S3, '1:8 1:8', { lo: 31, ...SF }),
      pad(SOL.S3, { center: 60, ...SF }),
      bars(SOL_S3),
      rest(8),
      drums(8, D_HEART, { last: 'k:2! k:2? r:4 tl:2? t:2? th:2? s:2?' }),
    ] },
    // ── だん 2（みんなの 力。152）──
    t2: { bpm: 152, ch: [
      bars(['r:16', 'r:8 C6:2 D6:2 E6:2 G6:2']),
      bassLine(SOL.t2, '1:2! 1:2 1:2 1:2 1:2! 1:2 1:2 1:2', { lo: 31, ...SF }),
      pad(SOL.t2, { center: 62, ...SF }),
      rest(2),
      bars(['Bb3:4! D4:4 F4:4 Bb4:4', 'C4:4! E4:4 G4:4 C5:4']),
      drums(2, ['k:2! s:2 s:2 s:2 k:2! s:2 s:2 s:2', 's:1 s:1 s:1 s:1 s:1 s:1 s:1 s:1 t:1 t:1 t:1 t:1 th:1 th:1 c:2!']),
    ] },
    H1: { bpm: 152, ch: [
      bars(SOL_H1),
      bassLine(SOL.H1, '1:2! 8:2 1:2 8:2 1:2! 8:2 5:2 8:2', { lo: 31 }),
      pad(SOL.H1, { center: 64 }),
      arp(SOL.H1, '0:2? 1:2? 2:2? 3:2? 4:2? 3:2? 2:2? 1:2?', { center: 81 }),
      guide(SOL.H1, 'x:8 x:8', { center: 62 }),
      drums(8, D_HERO, { first: 'c:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1', last: FILL }),
    ] },
    H2: { bpm: 152, ch: [
      bars(SOL_H2),
      bassLine(SOL.H2, '1:2! 1:2 8:2 1:2 1:2! 1:2 5:2 8:2', { lo: 31 }),
      comp(SOL.H2, 'r:2 x:2. r:2 x:2. r:2 x:2. r:2 x:2.', { center: 66 }),
      rest(8),
      guide(SOL.H2, 'x:4 x:4 x:8', { center: 62 }),
      drums(8, 'k:2! h:1 h:1? s:2! h:2 k:2 k:1 h:1? s:2! h:2', { last: FILL }),
    ] },
    H3: { bpm: 152, ch: [
      bars(SOL_H3),
      bassLine(SOL.H3, '1:2! 8:2 1:2 8:2 1:2! 1:1 1:1 8:2 5:2', { lo: 31 }),
      pad(SOL.H3, { center: 64 }),
      arp(SOL.H3, '0:2? 1:2? 2:2? 3:2? 4:2? 5:2? 4:2? 2:2?', { center: 79 }),
      `${bars(SOL_H3_BRASS)} ${comp(SOL.H3.slice(8), 'x:2! r:1 x:1! r:4 x:2! r:2 x:4!', { center: 62 })}`,
      drums(16, D_HERO, { first: 'c:2! o:2 s:2! h:2 k:2! o:2 s:2! h:1 k:1', last: FILL }),
    ] },
    H4: { bpm: 152, ch: [
      bars(SOL_H4),
      bassLine(SOL.H4, '1:4! 5:2 8:2 1:4! 5:2 8:2', { lo: 31 }),
      pad(SOL.H4, { center: 64 }),
      arp(SOL.H4, '0:2? 1:2? 2:2? 3:2? 4:2? 3:2? 2:2? 1:2?', { center: 84 }),
      guide(SOL.H4, 'x:8! x:8', { center: 64 }),
      drums(8, 'k:2! h:2 s:2! h:2 k:2! k:2 s:2! o:2', { first: 'c:2! h:2 s:2! h:2 k:2! k:2 s:2! o:2', last: 'k:2! k:2 s:2! s:2 s:1 s:1 s:1 s:1 th:1 th:1 tl:1 tl:1' }),
    ] },
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
  // だん（setPhase）: キー・テンポは かえず、区切りの ならびを かえる（form）。だん 3 は だん 2 と 同じ
  phases: [
    { transpose: 0, tempo: 1 },
    { transpose: 0, tempo: 1, form: ['t1', 'S1', 'S2', 'S3'], loopFrom: 1 },
    { transpose: 0, tempo: 1, form: ['t2', 'H1', 'H2', 'H3', 'H4'], loopFrom: 1 },
  ],
  // ピンチ: 高い レ・ラ と 導音の ド#（短調でも 長調でも 合う）
  pinch: { n: 'D6:2! A5:2 D6:2 A5:2 C#6:2! A5:2 D6:2 A5:2', i: 'chip_arp', v: 0.032 },
};

// ═════════════ ending2: エンディング（第2部。ト長調 84）═════════════
// イントロは 勝利の 動機（ベルで ゆっくり）。A は 町の 動機（笛）、A' で 弦が 入る。B で イ長調へ 上がって 大きく 広がる。C で ト長調に もどる
const END = {
  intro: ['G', 'D G'],
  A: ['G', 'Bm', 'C', 'D', 'Em', 'C', 'Am D', 'G'],
  A2: ['G', 'Bm', 'C', 'D', 'Em', 'C', 'Am D', 'G'],
  B: ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'],
  C: ['C', 'D', 'Bm', 'Em', 'Am', 'D', 'G', 'D7'],
};
const END_INTRO_BELL = ['B5:2! D6:2 G6:3! F#6:1 G6:1 A6:1 B6:4! A6:2', 'G6:2 F#6:2 A6:2 G6:10'];
const END_A = [
  'D5:4 B4:2 G4:2 B4:4 G5:4', 'F#5:6 E5:2 D5:8', 'E5:4 C5:2 G4:2 C5:4 E5:4', 'A5:8 F#5:4 D5:4',
  'G5:4 E5:2 B4:2 E5:4 G5:4', 'G5:6 F#5:2 E5:8', 'C5:4 E5:4 F#5:4 A5:4', 'G5:12 r:4',
];
const END_A2 = [
  ...END_A.slice(0, 4),
  'B5:4 G5:2 E5:2 G5:4 B5:4', 'C6:6 B5:2 A5:4 G5:4', 'A5:4 C6:4 D6:4 C6:4', 'B5:12 r:4',
];
const END_B = [
  'A5:6! F#5:2 D6:8', 'B5:6 G#5:2 E6:8', 'E6:6 D6:2 C#6:4 G#5:4', 'A5:8 C#6:4 F#6:4',
  'F#6:6! E6:2 D6:4 A5:4', 'G#6:6 F#6:2 E6:4 B5:4', 'A6:6 E6:2 C#6:4 E6:4', 'A5:12 r:4',
];
const END_C = [
  'G5:6 E5:2 C5:8', 'F#5:6 E5:2 D5:8', 'D5:4 F#5:4 B5:6 A5:2', 'G5:12 r:4',
  'C6:6 B5:2 A5:4 E5:4', 'F#5:6 A5:2 D6:8', 'B5:4 A5:2 G5:2 D5:4 G5:4', 'A5:8 r:4 D5:4',
];

const ending2 = {
  bpm: 84, bar: 16, reverb: 0.34, night: {},
  parts: [
    { i: 'flute', v: 0.1, role: 'lead', minIntensity: 0 },
    { i: 'bass', v: 0.15, role: 'bass', minIntensity: 0 },
    { i: 'pluck', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.35 },
    { i: 'strings', v: 0.03, role: 'harmony', minIntensity: 0, pan: -0.35 },
    { i: 'bell', v: 0.04, role: 'harmony', minIntensity: 0, pan: 0.45 },
    { drums: true, v: 0.36, minIntensity: 0 },
  ],
  sections: {
    intro: [
      rest(2),
      bassLine(END.intro, ['1:16', '1:8 1:8'], { lo: 36 }),
      rest(2),
      pad(END.intro, { center: 62 }),
      bars(END_INTRO_BELL),
      drums(2, ['r:16', 'r:12 c:4?']),
    ],
    A: [
      bars(END_A),
      bassLine(END.A, '1:8! 5:4 8:4', { lo: 36 }),
      arp(END.A, '0:2 1:2 2:2 3:2 4:2 3:2 2:2 1:2', { center: 64 }),
      rest(8),
      bars(['r:16', 'r:16', 'r:16', 'r:8 A5:4? D6:4?', 'r:16', 'r:16', 'r:16', 'r:8 B5:4? D6:4?']),
      drums(8, 'R:4! h:4? R:4 h:4?'),
    ],
    A2: [
      bars(END_A2),
      bassLine(END.A2, '1:4! 5:4 8:4 5:4', { lo: 36 }),
      arp(END.A2, '0:2 2:2 1:2 3:2 2:2 4:2 3:2 1:2', { center: 64 }),
      pad(END.A2, { center: 62 }),
      guide(END.A2, 'x:8 x:8', { center: 74 }),
      drums(8, 'k:4! h:4? R:4 h:2? k:2?'),
    ],
    B: [
      bars(END_B),
      bassLine(END.B, '1:4! 1:2 8:2 1:4! 5:2 8:2', { lo: 33 }),
      arp(END.B, '0:1 1:1 2:1 3:1 2:1 1:1 2:1 3:1 4:1 3:1 2:1 3:1 4:1 5:1 4:1 3:1', { center: 66 }),
      pad(END.B, { center: 64 }),
      guide(END.B, 'x:4 x:4 x:8', { center: 78 }),
      drums(8, 'k:4! h:2 h:2 s:4! h:2 k:2', { first: 'c:4! h:2 h:2 s:4! h:2 k:2', last: 'k:4! h:2 s:2 s:1 s:1 t:1 t:1 th:1 th:1 tl:1 tl:1' }),
    ],
    C: [
      bars(END_C),
      bassLine(END.C, '1:8! 5:4 8:4', { lo: 36 }),
      arp(END.C, '0:4 1:4 2:4 3:4', { center: 64 }),
      pad(END.C, { center: 62 }),
      bars(['r:16', 'r:16', 'r:16', 'r:8 B5:4? E6:4?', 'r:16', 'r:16', 'r:16', 'r:8 F#5:4? A5:4?']),
      drums(8, 'R:4! h:4? R:4 h:4?', { last: 'R:4! h:4? r:4 c:4?' }),
    ],
  },
  form: ['intro', 'A', 'A2', 'B', 'C'],
  loopFrom: 1,
};

// 新しい id の 曲の ch: 古い テスト（tr.ch を 前の 書き方で 見る）と「前の音」用に、自分の 楽譜を 前の 書き方へ うつした もの
// （しるしを とる・和音は いちばん 上の 音・ふえた たいこは k/s/h。form の じゅんに つなぐ）。audio-r77a.js の oldView と 同じ 考え方
const OLD_DRUM = { k: 'k', s: 's', h: 'h', o: 'h', c: 'h', p: 's', R: 's', t: 'k', th: 'k', tl: 'k', r: 'r' };
const toks = (x) => String(x).trim().match(/\[[^\]]*\](?::\S*)?|\S+/g) || [];
const tokLen = (t) => Number(/:(\d+)/.exec(t.slice(t.lastIndexOf(']') + 1))[1]);
function oldView(tr) {
  const sec = (nm) => (Array.isArray(tr.sections[nm]) ? tr.sections[nm] : tr.sections[nm].ch);
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
for (const tr of [c8r_hall, c8r_wing, c8r_gate, c8r_last, ending2]) tr.ch = oldView(tr);

export const C8R_TRACKS = { c8r_hall, c8r_wing, c8r_gate, c8r_last, solitus, ending2 };
export const C8R_IDS = Object.keys(C8R_TRACKS);
