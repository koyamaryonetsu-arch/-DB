// 第5章 Step 9 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・nocto_true … ノクト（本気）（イ短調の はやい ボス戦。1回目〈nocto_1〉より 高く 強く、とちゅうで 思い出の オルゴールの ような 長調が まざる）
// ・solitus … 魔王ソリトゥス（ニ短調。ひくい オルガンの のばしと、半音で ゆれる ひとりぼっちの ことば。いちばん さいごの 戦い）
// ・ending5 … エンディング・第1部 完（ハ長調の ゆっくりした 曲。星祭りの 夜空と、5つの 守り星。ふりかえりの 文の うしろでも ながれる）
// 1小節 = 16。どの パートも 16小節（256）

const CHORD = {
  Am: ['A', ['A', 'C', 'E']], F: ['F', ['F', 'A', 'C']], G: ['G', ['G', 'B', 'D']], E: ['E', ['E', 'G#', 'B']], C: ['C', ['C', 'E', 'G']],
  Dm: ['D', ['D', 'F', 'A']], Em: ['E', ['E', 'G', 'B']], Bb: ['Bb', ['Bb', 'D', 'F']], A: ['A', ['A', 'C#', 'E']], Gm: ['G', ['G', 'Bb', 'D']],
  Eb: ['Eb', ['Eb', 'G', 'Bb']], Cm: ['C', ['C', 'Eb', 'G']], Fm: ['F', ['F', 'Ab', 'C']], D: ['D', ['D', 'F#', 'A']],
};
const IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
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
// きざむ アルペジオ（1小節に 8つ）・オルゴールの アルペジオ（1小節に 8つ。上って 下りる）・のばし・ベース
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
const arpBox = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); const [a2] = voiced(c, oct + 1); return `${a}:2 ${b}:2 ${d}:2 ${a2}:2 ${d}:2 ${b}:2 ${d}:2 ${a2}:2 `; }).join('');
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');
const bassToll = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}1:8 ${r}2:4 ${r}1:4 `; }).join('');
const bassWalk = (chords) => chords.map((c) => { const r = CHORD[c][0]; const [, , d] = voiced(c, 2); return `${r}2:8 ${d}:4 ${r}2:4 `; }).join('');
const bars = (list) => list.join(' ');

const NOCTO_CHORDS = ['Am', 'Am', 'F', 'G', 'Am', 'Dm', 'E', 'E', 'F', 'G', 'C', 'Am', 'Dm', 'F', 'E', 'E'];
const SOLITUS_CHORDS = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'A', 'A', 'Eb', 'Cm', 'Dm', 'Bb', 'Gm', 'Eb', 'A', 'A'];
const END_CHORDS = ['C', 'G', 'Am', 'F', 'C', 'Em', 'F', 'G', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'C'];

export const TOP_TRACKS = {
  nocto_true: {
    bpm: 172,
    ch: [
      { w: 'pulse', v: 0.1, n: bars([
        'A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:2 E6:2', 'A6:4 E6:2 C6:2 B5:4 C6:4', 'A5:2 C6:2 F6:4 E6:2 D6:2 C6:4', 'B5:2 D6:2 G6:4 F6:4 D6:4',
        'E6:2 E6:2 C6:2 A5:2 A6:4 G6:4', 'F6:2 D6:2 A5:4 D6:4 F6:4', 'G#6:4 E6:4 B5:4 G#5:4', 'A5:8 B5:4 G#5:4',
        // 思い出の オルゴールの ような ところ（長調）
        'C6:4 E6:4 G6:6 F6:2', 'D6:4 G6:4 B6:6 A6:2', 'G6:4 E6:4 C6:4 E6:4', 'A6:6 G6:2 E6:8',
        'F6:2 A6:2 D7:4 C7:2 A6:2 F6:4', 'A6:4 F6:2 C6:2 A6:4 C7:4', 'B6:2 G#6:2 E6:4 D7:4 B6:4', 'G#6:4 E6:4 B5:4 E5:4',
      ]) },
      { w: 'saw', v: 0.028, n: arpFast(NOCTO_CHORDS, 4) },
      { w: 'triangle', v: 0.25, n: bassDrive(NOCTO_CHORDS) },
      { drums: true, v: 0.58, n: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 s:2 k:2 s:1 s:1 s:2 s:2 s:2' },
    ],
  },
  solitus: {
    bpm: 150,
    ch: [
      { w: 'square', v: 0.08, n: bars([
        'D5:4 F5:4 A5:4 G#5:4', 'A5:8 F5:4 D5:4', 'Bb5:4 D6:4 C#6:4 Bb5:4', 'A5:4 E5:4 C#5:8',
        'D5:2 F5:2 A5:2 D6:2 C#6:4 A5:4', 'G5:4 Bb5:4 D6:4 G5:4', 'E5:2 G5:2 C#6:4 Bb5:4 G5:4', 'A5:12 r:4',
        'Eb6:4 G5:4 Bb5:4 Eb6:4', 'D6:4 C6:2 Bb5:2 G5:8', 'F5:4 A5:4 D6:4 F6:4', 'F6:4 D6:2 Bb5:2 F5:8',
        'G5:4 Bb5:4 D6:4 G6:4', 'G6:2 F6:2 Eb6:2 D6:2 Eb6:4 Bb5:4', 'A5:4 C#6:4 E6:4 G6:4', 'F6:4 E6:4 D6:4 C#6:4',
      ]) },
      // ひくい オルガンの のばし（和音の 5度の 音）
      { w: 'saw', v: 0.032, n: pads(SOLITUS_CHORDS, 3, 2) },
      { w: 'triangle', v: 0.28, n: bassToll(SOLITUS_CHORDS) },
      { drums: true, v: 0.5, n: 'k:4 h:2 h:2 s:4 k:2 h:2 '.repeat(15) + 'k:2 k:2 s:2 k:2 s:2 s:2 s:2 s:2' },
    ],
  },
  ending5: {
    bpm: 84,
    ch: [
      { w: 'triangle', v: 0.13, n: bars([
        'E5:6 G5:2 C6:8', 'D6:4 B5:4 G5:8', 'A5:4 C6:4 E6:6 D6:2', 'C6:8 A5:8',
        'G5:4 E5:4 C6:6 B5:2', 'B5:8 G5:8', 'A5:4 C6:4 F6:4 E6:4', 'D6:12 r:4',
        'C6:4 A5:4 F5:4 A5:4', 'B5:4 D6:4 G6:6 F6:2', 'E6:4 D6:4 B5:4 G5:4', 'C6:6 B5:2 A5:8',
        'F5:4 A5:4 D6:6 C6:2', 'B5:4 G5:4 D6:4 F6:4', 'E6:6 D6:2 C6:4 G5:4', 'C6:16',
      ]) },
      // オルゴールの アルペジオ（思い出の 迷宮の 曲と おなじ 音色で、明るく）
      { w: 'sine', v: 0.055, n: arpBox(END_CHORDS, 4) },
      { w: 'triangle', v: 0.19, n: bassWalk(END_CHORDS) },
      // 星が またたく ような 小さな 音
      { drums: true, v: 0.08, n: 'h:4 h:4 h:4 h:2 h:2 '.repeat(15) + 'h:4 h:4 h:8' },
    ],
  },
};
