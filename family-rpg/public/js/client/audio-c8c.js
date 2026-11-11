// 第2部 第8章 第3幕「くろがねの 空中ようさい」の 戦いの 曲（B: 戦い。audio.js の TRACKS に まぜる）
// ・kamek_magic … マジカメック（ト短調 BPM152。ふしぎな 魔法が くるくる 回る ような、ちょっと いたずらっぽい 曲。高い ベルの アルペジオ）
// ・bowser_king … 初代大魔王クッパード（ハ短調 BPM144。どしん どしんと 重い ベースと、ごうかいな メロディーの 大魔王の 曲）
// 1小節 = 16。どの パートも 16小節（256）。マップの 曲（空中ようさい）は A
const CHORD = {
  Gm: ['G', ['G', 'Bb', 'D']], Eb: ['Eb', ['Eb', 'G', 'Bb']], F: ['F', ['F', 'A', 'C']], D: ['D', ['D', 'F#', 'A']], Cm: ['C', ['C', 'Eb', 'G']],
  Bb: ['Bb', ['Bb', 'D', 'F']], Ab: ['Ab', ['Ab', 'C', 'Eb']], G: ['G', ['G', 'B', 'D']], Fm: ['F', ['F', 'Ab', 'C']], Dm: ['D', ['D', 'F', 'A']],
};
const IDX = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
function voiced(name, oct) {
  const [, notes] = CHORD[name];
  let o = oct, prev = -1;
  return notes.map((n) => {
    const i = IDX[n];
    if (i <= prev) o++;
    prev = i;
    return `${n}${o}`;
  });
}
const bars = (list) => list.join(' ');
// アルペジオ（1小節に 8つ）・のばし・重い ベース・はずむ ベース
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
const bassHeavy = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:3 ${r}2:1 ${r}2:2 r:2 ${r}2:3 ${r}2:1 ${r}3:2 ${r}2:2 `; }).join('');
const bassSkip = (chords) => chords.map((c) => { const r = CHORD[c][0]; const [, b, d] = voiced(c, 2); return `${r}2:2 r:2 ${d}:2 r:2 ${b}:2 r:2 ${d}:2 ${b}:2 `; }).join('');

const KAMEK_CH = ['Gm', 'Eb', 'F', 'D', 'Gm', 'Cm', 'D', 'D', 'Eb', 'F', 'Bb', 'Gm', 'Cm', 'D', 'Gm', 'D'];
const KING_CH = ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Fm', 'G', 'G', 'Ab', 'Bb', 'Eb', 'Cm', 'Fm', 'G', 'Cm', 'G'];

export const C8C_TRACKS = {
  kamek_magic: {
    bpm: 152,
    ch: [
      { w: 'square', v: 0.08, n: bars([
        'G5:2 A5:2 Bb5:4 D6:4 Bb5:4', 'Eb6:3 D6:1 C6:2 Bb5:2 G5:8', 'F5:2 A5:2 C6:4 F6:4 C6:4', 'D6:4 F#5:4 A5:4 D5:4',
        'Bb5:2 D6:2 G6:4 F6:2 D6:2 Bb5:4', 'C6:2 Eb6:2 G6:4 Eb6:4 C6:4', 'A5:2 F#5:2 D5:4 F#5:4 A5:4', 'D6:8 r:4 D5:4',
        'Eb5:2 G5:2 Bb5:4 Eb6:4 Bb5:4', 'F5:2 A5:2 C6:4 F6:4 C6:4', 'D6:3 C6:1 Bb5:4 F5:4 D5:4', 'G5:2 Bb5:2 D6:4 G6:8',
        'Eb6:2 C6:2 G5:4 C6:4 Eb6:4', 'F#6:3 E6:1 D6:4 A5:4 F#5:4', 'G6:2 D6:2 Bb5:2 G5:2 D5:4 G5:4', 'A5:4 F#5:4 D5:8',
      ]) },
      { w: 'sine', v: 0.045, n: arpFast(KAMEK_CH, 5) },
      { w: 'triangle', v: 0.05, n: pads(KAMEK_CH, 4, 1) },
      { w: 'triangle', v: 0.24, n: bassSkip(KAMEK_CH) },
      { drums: true, v: 0.4, n: 'k:2 h:2 h:2 s:2 h:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 k:2 s:2 s:2 s:2 s:2 s:2' },
    ],
  },
  bowser_king: {
    bpm: 144,
    ch: [
      { w: 'square', v: 0.09, n: bars([
        'C5:4 Eb5:2 G5:2 C6:6 B5:2', 'Ab5:4 C6:4 Eb6:6 D6:2', 'Bb5:4 D6:2 F6:2 Bb5:8', 'G5:4 B5:4 D6:4 G5:4',
        'C6:3 Bb5:1 G5:4 Eb5:4 C5:4', 'F5:3 Ab5:1 C6:4 F6:4 C6:4', 'D6:4 B5:4 G5:4 B5:4', 'D6:8 G5:4 G4:4',
        'Ab5:3 G5:1 F5:4 Eb5:4 C5:4', 'Bb5:3 Ab5:1 G5:4 F5:4 D5:4', 'Eb5:4 G5:4 Bb5:4 Eb6:4', 'C6:6 Bb5:2 G5:8',
        'F5:4 Ab5:4 C6:4 F6:4', 'D6:4 F6:4 B5:4 D6:4', 'C6:4 G5:4 Eb5:4 C5:4', 'B4:4 D5:4 G5:8',
      ]) },
      { w: 'saw', v: 0.03, n: arpFast(KING_CH, 4) },
      { w: 'sine', v: 0.05, n: pads(KING_CH, 3, 2) },
      { w: 'triangle', v: 0.28, n: bassHeavy(KING_CH) },
      { drums: true, v: 0.55, n: 'k:2 k:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 k:2 s:2 k:2 s:2 s:2 s:2 s:2' },
    ],
  },
};
