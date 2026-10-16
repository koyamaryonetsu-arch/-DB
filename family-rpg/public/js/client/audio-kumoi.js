// 第5章 Step 3・4 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・kumoi … クモイ地方（雲の 海の 上の フィールド。ふわりと うかぶ ような ヘ長調）
// ・hanono … 雲の上の町ハネノ（羽の ある 人々の しずかな 町。ト長調の やさしい 3つの 音の かさなり）
// ・sink_ruin … しずみゆく島の 古い 神殿（下へ 下へ。ニ短調で、ゆっくり かたむく ような ベース）
// ・gaia … 島を むしばむ 大ムカデ ガイアイーター（ホ短調の はやい ボス戦。かじる ような きざみ）
// 1小節 = 16。どの パートも 16小節（256）

// 和音の 名前 → [ベースの ね, 3つの 音]
const CHORD = {
  F: ['F', ['F', 'A', 'C']], C: ['C', ['C', 'E', 'G']], Gm: ['G', ['G', 'Bb', 'D']], Bb: ['Bb', ['Bb', 'D', 'F']], Dm: ['D', ['D', 'F', 'A']],
  G: ['G', ['G', 'B', 'D']], D: ['D', ['D', 'F#', 'A']], Am: ['A', ['A', 'C', 'E']], A: ['A', ['A', 'C#', 'E']], Em: ['E', ['E', 'G', 'B']], B: ['B', ['B', 'D#', 'F#']],
};
// 和音の 音を 上の オクターブへ（3つ目の 音が ねより 下に なる ときは 1つ 上）
function voiced(name, oct) {
  const [, notes] = CHORD[name];
  const order = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const idx = (n) => order.indexOf(n === 'Db' ? 'C#' : n);
  let o = oct, prev = -1;
  return notes.map((n) => {
    if (idx(n) <= prev) o++;
    prev = idx(n);
    return `${n}${o}`;
  });
}
// アルペジオ（1小節に 8つ）
const arp = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${b}:2 ${d}:2 ${b}:2 ${a}:2 ${b}:2 ${d}:2 r:2 `; }).join('');
// 3つの 音を かさねた のばし（1小節）
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
// ベース
const bassSlow = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:8 ${r}3:4 ${r}2:4 `; }).join('');
const bassWalk = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:6 ${r}3:2 ${r}2:4 r:4 `; }).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 `; }).join('');

const KUMOI_CHORDS = ['F', 'C', 'Gm', 'C', 'F', 'F', 'Gm', 'C', 'F', 'C', 'Bb', 'F', 'Bb', 'F', 'C', 'F'];
const HANONO_CHORDS = ['G', 'D', 'C', 'D', 'C', 'G', 'D', 'G', 'G', 'D', 'C', 'G', 'C', 'G', 'D', 'G'];
const RUIN_CHORDS = ['Dm', 'C', 'Am', 'Dm', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'C', 'F', 'Dm', 'Bb', 'Gm', 'A', 'Dm'];
const GAIA_CHORDS = ['Em', 'Em', 'Em', 'Am', 'C', 'Am', 'Em', 'D', 'G', 'C', 'D', 'B', 'C', 'Am', 'B', 'Em'];

export const KUMOI_TRACKS = {
  kumoi: {
    bpm: 104,
    ch: [
      { w: 'pulse', v: 0.08, n: 'C5:4 F5:4 A5:6 G5:2 F5:4 E5:2 D5:2 C5:8 D5:4 G5:4 Bb5:6 A5:2 G5:12 r:4 A5:4 C6:4 D6:4 C6:2 Bb5:2 A5:6 G5:2 F5:8 G5:4 A5:2 Bb5:2 A5:4 G5:4 E5:12 r:4 F5:4 A5:4 C6:6 Bb5:2 A5:4 G5:2 F5:2 E5:8 D5:4 F5:4 Bb5:4 A5:2 G5:2 A5:12 r:4 Bb5:4 A5:2 G5:2 F5:4 D5:4 C5:4 F5:4 A5:8 G5:6 A5:2 Bb5:4 E5:4 F5:12 r:4' },
      // 雲が 流れる ような アルペジオ
      { w: 'triangle', v: 0.05, n: arp(KUMOI_CHORDS, 4) },
      { w: 'triangle', v: 0.2, n: bassSlow(KUMOI_CHORDS) },
      { drums: true, v: 0.1, n: 'k:4 h:4 h:4 h:4 '.repeat(15) + 'k:4 h:4 s:4 h:2 h:2' },
    ],
  },
  hanono: {
    bpm: 96,
    ch: [
      { w: 'pulse', v: 0.08, n: 'D5:4 G5:4 B5:4 A5:4 G5:6 F#5:2 E5:4 D5:4 C5:4 E5:4 G5:4 F#5:2 E5:2 D5:12 r:4 E5:4 G5:4 C6:4 B5:2 A5:2 B5:6 A5:2 G5:8 A5:4 F#5:4 D5:4 E5:2 F#5:2 G5:12 r:4 B5:4 D6:4 B5:2 A5:2 G5:4 A5:6 B5:2 A5:4 F#5:4 G5:4 E5:4 C5:4 E5:4 D5:12 r:4 C5:4 D5:4 E5:4 G5:4 B5:8 A5:4 G5:4 A5:4 G5:2 F#5:2 E5:4 F#5:4 G5:12 r:4' },
      // やさしい 3つの 音の かさなり（羽の ように ふわっと）
      { w: 'sine', v: 0.05, n: pads(HANONO_CHORDS, 4, 1) },
      { w: 'triangle', v: 0.18, n: bassWalk(HANONO_CHORDS) },
    ],
  },
  sink_ruin: {
    bpm: 84,
    ch: [
      { w: 'pulse', v: 0.08, n: 'D5:6 E5:2 F5:4 A5:4 G5:4 F5:4 E5:8 C5:6 D5:2 E5:4 G5:4 F5:4 E5:4 D5:8 A5:6 G5:2 F5:4 E5:4 D5:4 F5:4 A5:8 Bb5:4 A5:4 G5:4 E5:4 A5:12 r:4 D6:6 C6:2 A5:4 F5:4 G5:4 A5:4 E5:8 F5:6 E5:2 D5:4 C5:4 D5:4 E5:4 A4:8 Bb4:4 D5:4 F5:4 A5:4 G5:8 E5:8 F5:4 E5:4 C#5:4 E5:4 D5:12 r:4' },
      // ゆっくり かたむく ような アルペジオ（かいだんを 下りる）
      { w: 'square', v: 0.02, n: arp(RUIN_CHORDS, 3) },
      { w: 'triangle', v: 0.22, n: bassSlow(RUIN_CHORDS) },
      { drums: true, v: 0.12, n: 'k:8 h:4 s:4 '.repeat(15) + 'k:4 k:4 s:4 s:4' },
    ],
  },
  gaia: {
    bpm: 172,
    ch: [
      { w: 'pulse', v: 0.1, n: 'E5:2 E5:2 G5:2 E5:2 B5:4 A5:2 G5:2 F#5:2 G5:2 A5:2 F#5:2 E5:8 E5:2 E5:2 G5:2 B5:2 D6:4 C6:2 B5:2 A5:2 B5:2 C6:2 A5:2 B5:8 C6:4 B5:2 A5:2 G5:4 F#5:2 G5:2 A5:4 G5:2 F#5:2 E5:4 D#5:4 E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:2 B5:2 A5:8 F#5:8 G5:2 G5:2 B5:2 G5:2 D6:4 C6:2 B5:2 C6:2 B5:2 A5:2 G5:2 A5:8 F#5:2 A5:2 C6:2 F#6:2 E6:4 D6:2 C6:2 B5:8 D#5:8 E5:2 F#5:2 G5:2 A5:2 B5:4 C6:2 D6:2 E6:4 D6:2 C6:2 B5:4 A5:4 G5:2 F#5:2 E5:2 F#5:2 G5:2 A5:2 B5:4 E5:12 r:4' },
      { w: 'saw', v: 0.03, n: pads(GAIA_CHORDS, 4, 0) },
      // ベース（島の 根を かじる ような きざみ）
      { w: 'triangle', v: 0.25, n: bassDrive(GAIA_CHORDS) },
      { drums: true, v: 0.6, n: 'k:2 h:2 s:2 k:2 k:2 h:2 s:2 h:2 '.repeat(15) + 'k:2 s:1 s:1 s:2 k:2 s:2 s:2 k:1 k:1 s:2' },
    ],
  },
};
