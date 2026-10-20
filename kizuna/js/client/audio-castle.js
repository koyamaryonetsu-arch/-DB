// 第5章 Step 8 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・castle_wind … 影の城 1〜4階「風の階」（イ短調。黒い 城を ふきぬける 風の うず）
// ・castle_fire … 影の城 5〜8階「炎の階」（ニ短調の きざむ 曲。ふき上がる 炎の 柱）
// ・castle_water … 影の城 9〜12階「水の階」（ヘ長調の しずかな 曲。水鏡の ように すんだ、でも さびしい 音）
// ・phantom … 3人の まぼろし（ストルム・イグニア・モルガナ）との 戦い（ト短調の はやい ボス戦）
// 1小節 = 16。どの パートも 16小節（256）

// 和音の 名前 → [ベースの ね, 3つの 音]
const CHORD = {
  Am: ['A', ['A', 'C', 'E']], F: ['F', ['F', 'A', 'C']], G: ['G', ['G', 'B', 'D']], Em: ['E', ['E', 'G', 'B']], Dm: ['D', ['D', 'F', 'A']],
  E: ['E', ['E', 'G#', 'B']], C: ['C', ['C', 'E', 'G']], Bb: ['Bb', ['Bb', 'D', 'F']], A: ['A', ['A', 'C#', 'E']], Gm: ['G', ['G', 'Bb', 'D']],
  Eb: ['Eb', ['Eb', 'G', 'Bb']], Cm: ['C', ['C', 'Eb', 'G']], D: ['D', ['D', 'F#', 'A']],
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
// うずを まく 風の ような アルペジオ（1小節に 8つ）
const arpSwirl = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${d}:2 ${b}:2 ${d}:2 ${a}:2 ${b}:2 ${d}:2 ${b}:2 `; }).join('');
// きざむ アルペジオ（1小節に 8つ）
const arpFast = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${d}:2 ${b}:2 ${d}:2 `; }).join('');
// ベース
const bassLong = (chords) => chords.map((c) => `${CHORD[c][0]}2:16 `).join('');
const bassDeep = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:12 ${r}2:4 `; }).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');
const bassPulse = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:4 ${r}3:4 ${r}2:4 ${r}3:4 `; }).join('');

const WIND_CHORDS = ['Am', 'F', 'G', 'Em', 'Am', 'Dm', 'E', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'Am', 'E', 'E'];
const FIRE_CHORDS = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'A', 'A', 'Bb', 'C', 'Dm', 'Am', 'Gm', 'Bb', 'A', 'A'];
const WATER_CHORDS = ['F', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'F', 'Am', 'Bb', 'C', 'Dm', 'Bb', 'C', 'F'];
const PHANTOM_CHORDS = ['Gm', 'Gm', 'Eb', 'F', 'Gm', 'Cm', 'D', 'D', 'Eb', 'Bb', 'F', 'Gm', 'Cm', 'Eb', 'D', 'D'];

const bars = (list) => list.join(' ');

export const CASTLE_TRACKS = {
  castle_wind: {
    bpm: 108,
    ch: [
      { w: 'triangle', v: 0.11, n: bars([
        'A4:4 C5:4 E5:6 D5:2', 'C5:8 A4:4 F4:4', 'G4:4 B4:4 D5:6 C5:2', 'B4:8 G4:4 E4:4',
        'A4:2 B4:2 C5:4 E5:4 A5:4', 'F5:6 E5:2 D5:4 A4:4', 'G#4:4 B4:4 E5:8', 'A4:12 r:4',
        'C5:4 F5:4 A5:6 G5:2', 'G5:8 D5:4 B4:4', 'C5:4 E5:4 G5:4 C6:4', 'A5:8 E5:4 C5:4',
        'D5:4 F5:4 A5:6 F5:2', 'E5:4 C5:4 A4:8', 'B4:4 G#4:4 E4:4 G#4:4', 'B4:8 E5:8',
      ]) },
      // 城を ふきぬける 風の うず
      { w: 'sine', v: 0.045, n: arpSwirl(WIND_CHORDS, 4) },
      { w: 'triangle', v: 0.17, n: bassLong(WIND_CHORDS) },
      { drums: true, v: 0.1, n: 'k:4 h:4 h:4 h:4 '.repeat(15) + 'k:4 h:4 k:4 h:4' },
    ],
  },
  castle_fire: {
    bpm: 132,
    ch: [
      { w: 'pulse', v: 0.09, n: bars([
        'D5:2 F5:2 A5:4 G5:2 F5:2 E5:4', 'D5:4 A4:4 D5:4 F5:4', 'Bb4:2 D5:2 F5:4 Bb5:4 A5:4', 'C#5:4 E5:4 A5:8',
        'D6:4 C6:2 A5:2 F5:4 D5:4', 'G5:4 Bb5:4 D6:4 Bb5:4', 'A5:2 G5:2 E5:4 C#5:4 E5:4', 'A4:12 r:4',
        'F5:4 D5:4 Bb4:4 D5:4', 'E5:4 G5:4 C6:6 Bb5:2', 'A5:4 F5:4 D5:8', 'C5:4 E5:4 A5:8',
        'Bb5:4 G5:4 D5:4 G5:4', 'F5:4 D5:2 Bb4:2 F5:4 Bb5:4', 'A5:4 E5:4 C#5:4 E5:4', 'A5:8 A4:8',
      ]) },
      // ふき上がる 炎の 柱の きざみ
      { w: 'saw', v: 0.028, n: arpFast(FIRE_CHORDS, 3) },
      { w: 'triangle', v: 0.22, n: bassPulse(FIRE_CHORDS) },
      { drums: true, v: 0.32, n: 'k:4 s:4 k:2 k:2 s:4 '.repeat(15) + 'k:2 k:2 s:2 k:2 s:2 s:2 s:4' },
    ],
  },
  castle_water: {
    bpm: 84,
    ch: [
      { w: 'sine', v: 0.1, n: bars([
        'A4:4 C5:4 F5:6 E5:2', 'E5:8 G4:4 C5:4', 'D5:4 F5:4 A5:6 G5:2', 'E5:8 C5:8',
        'D5:4 F5:4 Bb5:6 A5:2', 'A5:8 F5:4 C5:4', 'Bb4:4 D5:4 G5:4 F5:4', 'E5:12 r:4',
        'F5:4 A5:4 C6:6 A5:2', 'E5:4 A5:4 C6:8', 'D6:4 Bb5:4 F5:4 D5:4', 'E5:4 G5:4 C6:8',
        'A5:4 F5:4 D5:6 E5:2', 'F5:4 D5:4 Bb4:8', 'C5:4 E5:4 G5:4 Bb5:4', 'A5:12 r:4',
      ]) },
      // 水面に おちる しずくの ような アルペジオ
      { w: 'triangle', v: 0.05, n: arpSlow(WATER_CHORDS, 4) },
      { w: 'triangle', v: 0.17, n: bassDeep(WATER_CHORDS) },
    ],
  },
  phantom: {
    bpm: 176,
    ch: [
      { w: 'pulse', v: 0.1, n: bars([
        'G5:2 Bb5:2 D6:2 G6:2 F6:2 D6:2 Bb5:2 D6:2', 'G6:4 D6:2 Bb5:2 A5:4 Bb5:4', 'G5:2 Bb5:2 Eb6:4 D6:2 C6:2 Bb5:4', 'A5:2 C6:2 F6:4 Eb6:4 C6:4',
        'D6:2 D6:2 Bb5:2 G5:2 G6:4 F6:4', 'Eb6:2 C6:2 G5:4 C6:4 Eb6:4', 'F#6:4 D6:4 A5:4 F#5:4', 'G5:8 Bb5:4 D6:4',
        'Eb6:2 G6:2 Bb6:4 A6:2 G6:2 F6:4', 'D6:2 F6:2 Bb6:4 A6:2 F6:2 D6:4', 'C6:4 F6:4 A6:4 G6:2 F6:2', 'G6:4 D6:4 Bb5:4 G5:4',
        'C6:4 Eb6:2 G6:2 F6:4 Eb6:4', 'Bb5:2 Eb6:2 G6:4 F6:2 Eb6:2 Bb5:4', 'A5:2 D6:2 F#6:4 A6:4 F#6:4', 'D6:4 A5:4 F#5:4 D5:4',
      ]) },
      { w: 'saw', v: 0.03, n: arpFast(PHANTOM_CHORDS, 4) },
      { w: 'triangle', v: 0.25, n: bassDrive(PHANTOM_CHORDS) },
      { drums: true, v: 0.55, n: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 k:2 s:2 s:2 s:2 k:2 s:2' },
    ],
  },
};
