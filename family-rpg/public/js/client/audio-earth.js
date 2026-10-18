// 第5章 Step 6・7 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・earth_temple … 大地の神殿（ニ短調の ゆっくりした 曲。木の 根の 奥へ 下りていく、ふかい 大地の こどう）
// ・nocto_1 … ノクト（1回目）（ハ短調の はやい ボス戦。ひとりで 立ちむかう 強さと、さびしさ）
// ・kumoi_dusk … 影の城が うかんだ あとの クモイ地方（ホ短調。夕ぐれの 雲の 海。kumoi の かわり）
// 1小節 = 16。どの パートも 16小節（256）

// 和音の 名前 → [ベースの ね, 3つの 音]
const CHORD = {
  Dm: ['D', ['D', 'F', 'A']], Am: ['A', ['A', 'C', 'E']], Bb: ['Bb', ['Bb', 'D', 'F']], C: ['C', ['C', 'E', 'G']], Gm: ['G', ['G', 'Bb', 'D']],
  A: ['A', ['A', 'C#', 'E']], F: ['F', ['F', 'A', 'C']], Cm: ['C', ['C', 'Eb', 'G']], Ab: ['Ab', ['Ab', 'C', 'Eb']], Eb: ['Eb', ['Eb', 'G', 'Bb']],
  Fm: ['F', ['F', 'Ab', 'C']], G: ['G', ['G', 'B', 'D']], Em: ['E', ['E', 'G', 'B']], D: ['D', ['D', 'F#', 'A']], B: ['B', ['B', 'D#', 'F#']],
};
const IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
// 和音の 音を 上の オクターブへ（3つ目の 音が ねより 下に なる ときは 1つ 上）
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
// ゆっくり 上って 下りる アルペジオ（1小節に 4つ）
const arpSlow = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:4 ${b}:4 ${d}:4 ${b}:4 `; }).join('');
// きざむ アルペジオ（1小節に 8つ）
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
// 3つの 音を かさねた のばし（1小節）
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
// ベース
const bassDeep = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:12 ${r}2:4 `; }).join('');
const bassLong = (chords) => chords.map((c) => `${CHORD[c][0]}2:16 `).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');

const TEMPLE_CHORDS = ['Dm', 'Am', 'Bb', 'C', 'Dm', 'Gm', 'A', 'Dm', 'F', 'C', 'Bb', 'Am', 'Gm', 'Dm', 'A', 'Dm'];
const NOCTO_CHORDS = ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Fm', 'G', 'Cm', 'Ab', 'Eb', 'Bb', 'G', 'Ab', 'Fm', 'G', 'G'];
const DUSK_CHORDS = ['Em', 'Am', 'D', 'G', 'C', 'Am', 'B', 'B', 'Em', 'G', 'C', 'D', 'Am', 'Em', 'B', 'Em'];

const bars = (list) => list.join(' ');

export const EARTH_TRACKS = {
  earth_temple: {
    bpm: 80,
    ch: [
      { w: 'triangle', v: 0.12, n: bars([
        'D5:6 E5:2 F5:4 A5:4', 'E5:8 C5:4 E5:4', 'D5:4 F5:4 Bb5:6 A5:2', 'G5:8 E5:4 C5:4',
        'F5:4 E5:2 D5:2 A4:8', 'Bb4:4 D5:4 G5:6 F5:2', 'E5:6 C#5:2 A4:8', 'D5:12 r:4',
        'A5:4 C6:4 A5:2 G5:2 F5:4', 'G5:8 E5:8', 'F5:4 D5:4 Bb4:4 D5:4', 'C5:6 E5:2 A5:8',
        'Bb5:4 A5:2 G5:2 D5:8', 'F5:4 A5:4 D6:6 C6:2', 'A5:4 G5:2 E5:2 C#5:8', 'D5:12 r:4',
      ]) },
      // 根の 奥で しずくが おちる ような アルペジオ
      { w: 'sine', v: 0.05, n: arpSlow(TEMPLE_CHORDS, 3) },
      { w: 'triangle', v: 0.2, n: bassDeep(TEMPLE_CHORDS) },
      // 大地の こどう（ひくい たいこ）
      { drums: true, v: 0.14, n: 'k:8 k:4 h:4 '.repeat(15) + 'k:4 k:4 k:4 h:4' },
    ],
  },
  nocto_1: {
    bpm: 168,
    ch: [
      { w: 'pulse', v: 0.1, n: bars([
        'C5:2 Eb5:2 G5:2 C6:2 Bb5:2 G5:2 Eb5:2 G5:2', 'C6:4 G5:2 Eb5:2 D5:4 Eb5:4', 'C5:2 Eb5:2 Ab5:4 G5:2 F5:2 Eb5:4', 'D5:2 F5:2 Bb5:4 Ab5:4 F5:4',
        'G5:2 G5:2 Eb5:2 C5:2 C6:4 Bb5:4', 'Ab5:2 F5:2 C5:4 F5:4 Ab5:4', 'B5:4 G5:4 D5:4 B4:4', 'C5:8 Eb5:4 G5:4',
        'Ab5:2 C6:2 Eb6:4 D6:2 C6:2 Bb5:4', 'G5:2 Bb5:2 Eb6:4 D6:2 Bb5:2 G5:4', 'F5:4 Bb5:4 D6:4 C6:2 Bb5:2', 'B5:4 D6:4 G6:4 F6:2 D6:2',
        'Eb6:4 C6:2 Ab5:2 Eb5:4 Ab5:4', 'F5:2 Ab5:2 C6:4 B5:2 Ab5:2 F5:4', 'G5:2 B5:2 D6:4 F6:4 D6:4', 'B5:4 G5:4 D5:4 G4:4',
      ]) },
      { w: 'saw', v: 0.03, n: arpFast(NOCTO_CHORDS, 4) },
      // ベース（ひとりで かけぬける ような きざみ）
      { w: 'triangle', v: 0.25, n: bassDrive(NOCTO_CHORDS) },
      { drums: true, v: 0.55, n: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 k:2 '.repeat(15) + 'k:2 k:2 s:2 k:2 s:2 s:2 s:2 s:2' },
    ],
  },
  kumoi_dusk: {
    bpm: 92,
    ch: [
      { w: 'sine', v: 0.09, n: bars([
        'B4:4 E5:4 G5:6 F#5:2', 'E5:8 C5:4 A4:4', 'D5:4 F#5:4 A5:6 G5:2', 'G5:8 D5:8',
        'E5:4 G5:4 C6:6 B5:2', 'A5:8 E5:4 C5:4', 'D#5:4 F#5:4 B5:8', 'B4:12 r:4',
        'G5:4 B5:4 E6:6 D6:2', 'D6:4 B5:4 G5:8', 'E5:4 G5:4 C6:4 B5:4', 'A5:4 F#5:4 D5:8',
        'C5:4 E5:4 A5:6 G5:2', 'G5:4 E5:2 D5:2 B4:8', 'D#5:4 F#5:2 A5:2 B5:8', 'E5:12 r:4',
      ]) },
      // 夕ぐれの 雲の ような のばし
      { w: 'triangle', v: 0.04, n: pads(DUSK_CHORDS, 4, 1) },
      { w: 'triangle', v: 0.16, n: bassLong(DUSK_CHORDS) },
    ],
  },
};
