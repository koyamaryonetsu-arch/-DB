// 第2部 第8章 第2幕「よみの 青い火」の 戦いの 曲（B: 戦い。audio.js の TRACKS に まぜる）
// ・yomi_imps … ペイニックと パニクル（ホ短調の せわしない 曲。小おにが ばたばた かけまわる ような はねる メロディー）
// ・yomi_king … よみの王ハデロス（ニ短調。おしゃべりな 王さまらしい、はずむ リズムの 少し おしゃれな ボスの 曲。海の 底の ひびく ベース）
// 1小節 = 16。どの パートも 16小節（256）。マップの 曲（海底神殿）は A（audio-ch6.js）
const CHORD = {
  Em: ['E', ['E', 'G', 'B']], C: ['C', ['C', 'E', 'G']], D: ['D', ['D', 'F#', 'A']], B: ['B', ['B', 'D#', 'F#']], Am: ['A', ['A', 'C', 'E']],
  G: ['G', ['G', 'B', 'D']], Dm: ['D', ['D', 'F', 'A']], Bb: ['Bb', ['Bb', 'D', 'F']], Gm: ['G', ['G', 'Bb', 'D']], A: ['A', ['A', 'C#', 'E']],
  F: ['F', ['F', 'A', 'C']],
};
const IDX = { C: 0, 'C#': 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, Bb: 10, B: 11 };
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
// アルペジオ（1小節に 8つ）・のばし・はずむ ベース・歩く ベース
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');
const bassSwing = (chords) => chords.map((c) => { const r = CHORD[c][0]; const [, b, d] = voiced(c, 2); return `${r}2:3 ${r}2:1 ${b}:3 ${b}:1 ${d}:3 ${d}:1 ${b}:4 `; }).join('');

const IMPS_CH = ['Em', 'C', 'D', 'B', 'Em', 'Am', 'B', 'B', 'C', 'D', 'G', 'Em', 'Am', 'B', 'Em', 'B'];
const KING_CH = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'F', 'Gm', 'A', 'Bb', 'C', 'F', 'Dm', 'Gm', 'A', 'Dm', 'A'];

export const C8B_TRACKS = {
  yomi_imps: {
    bpm: 168,
    ch: [
      { w: 'pulse', v: 0.1, n: bars([
        'E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:2 B5:2', 'C6:4 G5:2 E5:2 C6:4 E6:4', 'D6:2 F#6:2 A6:4 F#6:4 D6:4', 'B5:2 D#6:2 F#6:4 D#6:4 B5:4',
        'E6:2 E6:2 G6:2 B6:2 G6:4 E6:4', 'A5:2 C6:2 E6:4 C6:2 A5:2 E5:4', 'F#5:4 A5:2 B5:2 D#6:4 F#6:4', 'B5:8 r:4 B4:4',
        'C6:2 E6:2 G6:4 E6:2 C6:2 G5:4', 'D6:2 F#6:2 A6:4 F#6:2 D6:2 A5:4', 'G5:2 B5:2 D6:4 B5:4 G5:4', 'E5:2 G5:2 B5:4 G5:4 E5:4',
        'A5:2 A5:2 C6:2 E6:2 A6:4 E6:4', 'B5:2 D#6:2 F#6:4 A6:4 F#6:4', 'E6:2 B5:2 G5:2 E5:2 B4:4 E5:4', 'F#5:4 D#5:4 B4:4 r:4',
      ]) },
      { w: 'saw', v: 0.026, n: arpFast(IMPS_CH, 4) },
      { w: 'triangle', v: 0.24, n: bassDrive(IMPS_CH) },
      { drums: true, v: 0.5, n: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 s:2 k:2 s:2 s:2 s:2 s:2' },
    ],
  },
  yomi_king: {
    bpm: 132,
    ch: [
      { w: 'square', v: 0.085, n: bars([
        'D5:3 F5:1 A5:4 G5:3 F5:1 E5:4', 'D5:3 D5:1 F5:4 Bb5:8', 'G5:3 A5:1 Bb5:4 D6:4 Bb5:4', 'A5:4 C#6:4 E6:4 A5:4',
        'D6:3 C6:1 A5:4 F5:3 E5:1 D5:4', 'F5:3 G5:1 A5:4 C6:8', 'Bb5:3 A5:1 G5:4 D5:4 G5:4', 'E5:4 A5:4 C#6:8',
        'D6:3 C6:1 Bb5:4 F5:4 D5:4', 'E5:3 G5:1 C6:4 E6:4 G6:4', 'F6:4 C6:4 A5:4 F5:4', 'D5:3 F5:1 A5:4 D6:8',
        'G5:3 Bb5:1 D6:4 G6:4 D6:4', 'C#6:3 E6:1 A6:4 G6:4 E6:4', 'F6:3 E6:1 D6:4 A5:4 F5:4', 'E5:4 C#5:4 A4:8',
      ]) },
      { w: 'sine', v: 0.05, n: pads(KING_CH, 4, 1) },
      { w: 'sine', v: 0.04, n: arpFast(KING_CH, 5) },
      { w: 'triangle', v: 0.26, n: bassSwing(KING_CH) },
      { drums: true, v: 0.4, n: 'k:3 h:1 s:3 h:1 k:3 k:1 s:3 h:1 '.repeat(16) },
    ],
  },
};
