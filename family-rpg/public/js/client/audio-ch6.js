// 第2部 第6章 Step 1・2 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・past_field … 千年前の ミドリナ地方（ニ長調の のどかな 曲。今の フィールドより ゆったり、森の 風）
// ・past_village … 千年前の 里（ヘ長調。たき火の まわりの わらべ歌ふう）
// ・toki_shrine … 時のほこら（ホ短調。時計の 音の ような きざみと、ふしぎな のばし）
// ・toki_ruin … 時の遺せき・時の神殿（イ短調。2つの 時代を 行き来する ぼうけんの 曲）
// ・boss6 … 第6章の ボス（ハ短調の はやい 戦い。サンドクロック・ギアドン）
// ・zenmai … 影の時計師ゼンマイ（ト短調。ぜんまいじかけの ような とぎれる 音）
// 1小節 = 16。どの パートも 16小節（256）

const CHORD = {
  D: ['D', ['D', 'F#', 'A']], G: ['G', ['G', 'B', 'D']], A: ['A', ['A', 'C#', 'E']], Bm: ['B', ['B', 'D', 'F#']], Em: ['E', ['E', 'G', 'B']],
  F: ['F', ['F', 'A', 'C']], C: ['C', ['C', 'E', 'G']], Dm: ['D', ['D', 'F', 'A']], Bb: ['Bb', ['Bb', 'D', 'F']], Am: ['A', ['A', 'C', 'E']],
  B: ['B', ['B', 'D#', 'F#']], E: ['E', ['E', 'G#', 'B']], Cm: ['C', ['C', 'Eb', 'G']], Ab: ['Ab', ['Ab', 'C', 'Eb']], Fm: ['F', ['F', 'Ab', 'C']],
  Eb: ['Eb', ['Eb', 'G', 'Bb']], Gm: ['G', ['G', 'Bb', 'D']],
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
// アルペジオ（1小節に 8つ）・のばし・ベース
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
const arpBox = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); const [a2] = voiced(c, oct + 1); return `${a}:2 ${b}:2 ${d}:2 ${a2}:2 ${d}:2 ${b}:2 ${d}:2 ${a2}:2 `; }).join('');
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');
const bassToll = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}1:8 ${r}2:4 ${r}1:4 `; }).join('');
const bassWalk = (chords) => chords.map((c) => { const r = CHORD[c][0]; const [, , d] = voiced(c, 2); return `${r}2:8 ${d}:4 ${r}2:4 `; }).join('');
// ぜんまいの ような ベース（8分で とぎれとぎれ）
const bassTick = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:1 r:1 ${r}2:1 r:1 ${r}3:1 r:1 ${r}2:1 r:1 ${r}2:1 r:1 ${r}3:1 r:1 ${r}2:2 ${r}3:2 `; }).join('');
const bars = (list) => list.join(' ');

const FIELD_CH = ['D', 'G', 'D', 'A', 'Bm', 'G', 'A', 'A', 'G', 'D', 'Em', 'A', 'D', 'G', 'A', 'D'];
const VILLAGE_CH = ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'F', 'F'];
const SHRINE_CH = ['Em', 'C', 'D', 'Bm', 'Em', 'Am', 'B', 'B', 'C', 'D', 'Em', 'Em', 'Am', 'B', 'Em', 'Em'];
const RUIN_CH = ['Am', 'F', 'G', 'Em', 'Am', 'F', 'E', 'E', 'Dm', 'Am', 'Bb', 'E', 'F', 'G', 'Am', 'Am'];
const BOSS_CH = ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Fm', 'G', 'G', 'Ab', 'Bb', 'Eb', 'Cm', 'Fm', 'G', 'Cm', 'G'];
const ZENMAI_CH = ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Cm', 'D', 'D', 'Eb', 'F', 'Gm', 'Eb', 'Cm', 'D', 'Gm', 'D'];

export const CH6_TRACKS = {
  past_field: {
    bpm: 104,
    ch: [
      { w: 'triangle', v: 0.13, n: bars([
        'F#5:4 A5:4 D6:6 C#6:2', 'B5:4 G5:4 B5:4 D6:4', 'A5:6 F#5:2 D5:4 F#5:4', 'E5:8 A5:4 C#6:4',
        'D6:4 B5:2 F#5:2 B5:4 D6:4', 'G5:4 B5:4 D6:4 B5:4', 'C#6:4 A5:4 E5:4 A5:4', 'A5:12 r:4',
        'G5:4 B5:4 D6:4 G6:4', 'F#6:4 D6:4 A5:8', 'G5:4 E5:4 B5:6 A5:2', 'C#6:4 E6:4 A5:8',
        'F#5:2 A5:2 D6:4 F#6:4 E6:4', 'D6:4 B5:4 G5:4 B5:4', 'C#6:4 E6:4 A6:4 G6:4', 'F#6:12 r:4',
      ]) },
      { w: 'sine', v: 0.05, n: arpBox(FIELD_CH, 4) },
      { w: 'triangle', v: 0.2, n: bassWalk(FIELD_CH) },
      { drums: true, v: 0.18, n: 'k:4 h:4 s:4 h:4 '.repeat(16) },
    ],
  },
  past_village: {
    bpm: 88,
    ch: [
      { w: 'square', v: 0.07, n: bars([
        'A5:4 C6:4 F6:6 E6:2', 'E6:4 D6:4 C6:8', 'D6:4 F6:4 A6:4 F6:4', 'D6:6 C6:2 Bb5:8',
        'A5:4 F5:4 A5:4 C6:4', 'G5:4 E5:4 C6:8', 'Bb5:4 D6:4 F6:4 D6:4', 'C6:8 E5:4 G5:4',
        'F5:4 A5:4 D6:4 F6:4', 'F6:4 D6:4 Bb5:8', 'A5:4 C6:4 F6:4 A6:4', 'G6:6 E6:2 C6:8',
        'D6:4 Bb5:4 F5:4 Bb5:4', 'C6:4 E6:4 G6:4 E6:4', 'F6:6 E6:2 C6:4 A5:4', 'F5:12 r:4',
      ]) },
      { w: 'sine', v: 0.05, n: arpBox(VILLAGE_CH, 4) },
      { w: 'triangle', v: 0.19, n: bassWalk(VILLAGE_CH) },
      { drums: true, v: 0.14, n: 'h:4 k:4 h:4 s:4 '.repeat(16) },
    ],
  },
  toki_shrine: {
    bpm: 76,
    ch: [
      { w: 'sine', v: 0.12, n: bars([
        'E5:6 G5:2 B5:8', 'C6:4 B5:4 G5:8', 'A5:6 F#5:2 D5:8', 'F#5:8 B4:8',
        'E5:4 G5:4 B5:4 E6:4', 'C6:6 B5:2 A5:8', 'B5:4 D#6:4 F#6:4 D#6:4', 'B5:12 r:4',
        'G5:4 C6:4 E6:6 D6:2', 'D6:4 A5:4 F#5:8', 'G5:4 B5:4 E6:4 B5:4', 'E6:12 r:4',
        'C6:4 A5:4 E5:4 A5:4', 'D#6:4 B5:4 F#5:4 B5:4', 'G5:6 F#5:2 E5:8', 'E5:16',
      ]) },
      { w: 'saw', v: 0.026, n: pads(SHRINE_CH, 3, 1) },
      { w: 'triangle', v: 0.22, n: bassToll(SHRINE_CH) },
      // 時計の こちこちと いう 音
      { drums: true, v: 0.1, n: 'h:4 h:4 h:4 h:4 '.repeat(16) },
    ],
  },
  toki_ruin: {
    bpm: 96,
    ch: [
      { w: 'pulse', v: 0.09, n: bars([
        'A5:4 E5:4 A5:2 B5:2 C6:4', 'C6:4 A5:4 F5:8', 'G5:4 B5:4 D6:4 B5:4', 'E5:8 G5:4 B5:4',
        'A5:2 C6:2 E6:4 D6:4 C6:4', 'A5:4 C6:4 F6:8', 'E6:4 G#5:4 B5:4 E6:4', 'E6:12 r:4',
        'D6:4 F6:4 A6:4 F6:4', 'E6:4 C6:4 A5:8', 'Bb5:4 D6:4 F6:4 D6:4', 'G#5:8 B5:4 E6:4',
        'F6:4 C6:4 A5:4 C6:4', 'G5:4 B5:4 D6:4 G6:4', 'E6:4 C6:4 A5:4 E5:4', 'A5:12 r:4',
      ]) },
      { w: 'saw', v: 0.024, n: arpFast(RUIN_CH, 4) },
      { w: 'triangle', v: 0.22, n: bassWalk(RUIN_CH) },
      { drums: true, v: 0.32, n: 'k:2 h:2 h:2 h:2 s:2 h:2 h:2 h:2 '.repeat(16) },
    ],
  },
  boss6: {
    bpm: 160,
    ch: [
      { w: 'pulse', v: 0.1, n: bars([
        'C6:2 Eb6:2 G6:2 C7:2 Bb6:2 G6:2 Eb6:2 G6:2', 'Ab6:4 Eb6:2 C6:2 Ab5:4 C6:4', 'Bb5:2 D6:2 F6:4 Eb6:4 D6:4', 'B5:2 D6:2 G6:4 F6:4 D6:4',
        'C6:2 C6:2 Eb6:2 G6:2 C7:4 Bb6:4', 'Ab6:2 F6:2 C6:4 F6:4 Ab6:4', 'G6:4 D6:4 B5:4 G5:4', 'G5:8 B5:4 D6:4',
        'Eb6:4 C6:2 Ab5:2 Eb6:4 Ab6:4', 'F6:4 D6:2 Bb5:2 F6:4 Bb6:4', 'G6:4 Eb6:4 Bb5:4 Eb6:4', 'C6:2 Eb6:2 G6:4 Eb6:4 C6:4',
        'F6:4 Ab6:4 C7:4 Ab6:4', 'G6:4 B6:4 D7:4 B6:4', 'C7:2 G6:2 Eb6:2 C6:2 G5:4 C6:4', 'D6:4 B5:4 G5:4 D5:4',
      ]) },
      { w: 'saw', v: 0.028, n: arpFast(BOSS_CH, 4) },
      { w: 'triangle', v: 0.25, n: bassDrive(BOSS_CH) },
      { drums: true, v: 0.56, n: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 s:2 k:2 s:1 s:1 s:2 s:2 s:2' },
    ],
  },
  zenmai: {
    bpm: 120,
    ch: [
      { w: 'square', v: 0.08, n: bars([
        'G5:1 r:1 Bb5:1 r:1 D6:2 r:2 G5:1 r:1 Bb5:1 r:1 D6:4', 'C6:2 Bb5:2 A5:2 G5:2 F#5:4 D5:4', 'Eb6:1 r:1 D6:1 r:1 C6:2 Bb5:2 G5:4 r:4', 'F#5:4 A5:4 D6:4 C6:4',
        'G5:1 r:1 G5:1 r:1 Bb5:2 D6:2 G6:4 F6:4', 'Eb6:4 C6:4 G5:4 Eb6:4', 'D6:2 C6:2 Bb5:2 A5:2 F#5:4 A5:4', 'D6:12 r:4',
        'G6:2 F6:2 Eb6:4 Bb5:4 G5:4', 'A5:2 C6:2 F6:4 Eb6:4 C6:4', 'Bb5:2 D6:2 G6:4 D6:4 Bb5:4', 'Eb6:4 G6:4 Bb6:8',
        'C6:2 Eb6:2 G6:4 Eb6:2 C6:2 G5:4', 'D6:2 F#6:2 A6:4 F#6:4 D6:4', 'G6:4 D6:2 Bb5:2 G5:8', 'D5:4 F#5:4 A5:4 C6:4',
      ]) },
      { w: 'pulse', v: 0.03, n: arpFast(ZENMAI_CH, 4) },
      { w: 'triangle', v: 0.22, n: bassTick(ZENMAI_CH) },
      { drums: true, v: 0.26, n: 'h:2 h:2 s:2 h:2 h:2 h:2 s:2 h:2 '.repeat(16) },
    ],
  },
};
