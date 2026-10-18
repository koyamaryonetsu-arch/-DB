// 第5章 Step 5 の 曲（client/audio.js の TRACKS に まぜる。きょくは すべて オリジナル）
// ・hoshiyomi … 星読みの里（星を 読む 人々の 里。イ短調と ハ長調を ゆききする、しずかで ふしぎな 曲）
// ・memory … ノクトの 思い出の 迷宮（オルゴールの ような ホ短調の ワルツふう。さびしくて、やさしい）
// ・nocto_shadow … ノクトの 影（ニ短調の はやい ボス戦。まねを する ように、同じ 形を くりかえす）
// 1小節 = 16。どの パートも 16小節（256）

// 和音の 名前 → [ベースの ね, 3つの 音]
const CHORD = {
  Am: ['A', ['A', 'C', 'E']], F: ['F', ['F', 'A', 'C']], C: ['C', ['C', 'E', 'G']], G: ['G', ['G', 'B', 'D']], Em: ['E', ['E', 'G', 'B']],
  D: ['D', ['D', 'F#', 'A']], B: ['B', ['B', 'D#', 'F#']], Dm: ['D', ['D', 'F', 'A']], Bb: ['Bb', ['Bb', 'D', 'F']], Gm: ['G', ['G', 'Bb', 'D']],
  A: ['A', ['A', 'C#', 'E']],
};
const ORDER = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
// 和音の 音を 上の オクターブへ（3つ目の 音が ねより 下に なる ときは 1つ 上）
function voiced(name, oct) {
  const [, notes] = CHORD[name];
  let o = oct, prev = -1;
  return notes.map((n) => {
    const i = ORDER.indexOf(n);
    if (i <= prev) o++;
    prev = i;
    return `${n}${o}`;
  });
}
// オルゴールの ような アルペジオ（1小節に 8つ）
const arp = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:2 ${d}:2 ${b}:2 ${d}:2 ${a}:2 ${d}:2 ${b}:2 r:2 `; }).join('');
// ワルツふう（1小節を 3つに。6・5・5）
const waltz = (chords, oct) => chords.map((c) => { const [a, b, d] = voiced(c, oct); return `${a}:6 ${b}:5 ${d}:5 `; }).join('');
// 3つの 音を かさねた のばし（1小節）
const pads = (chords, oct, i) => chords.map((c) => `${voiced(c, oct)[i]}:16 `).join('');
// ベース
const bassSlow = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:8 ${r}3:4 ${r}2:4 `; }).join('');
const bassLong = (chords) => chords.map((c) => `${CHORD[c][0]}2:16 `).join('');
const bassDrive = (chords) => chords.map((c) => { const r = CHORD[c][0]; return `${r}2:2 ${r}3:2 ${r}2:2 ${r}2:2 ${r}3:2 ${r}2:2 ${r}3:2 ${r}2:2 `; }).join('');

const VILLAGE_CHORDS = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'C', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'];
const MEMORY_CHORDS = ['Em', 'C', 'G', 'D', 'Em', 'Am', 'B', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'Em', 'B', 'Em'];
const SHADOW_CHORDS = ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'A', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Gm', 'A', 'A', 'Dm'];

export const HOSHIYOMI_TRACKS = {
  hoshiyomi: {
    bpm: 88,
    ch: [
      { w: 'pulse', v: 0.07, n: 'E5:4 A5:4 C6:4 B5:4 A5:6 G5:2 F5:4 E5:4 G5:4 E5:4 C5:4 E5:4 D5:12 r:4 E5:4 A5:4 C6:6 B5:2 A5:4 C6:4 F6:4 E6:4 D6:6 C6:2 B5:4 G5:4 C6:12 r:4 A5:4 F5:4 A5:4 C6:4 B5:6 A5:2 G5:8 E5:4 G5:4 B5:4 E6:4 C6:6 B5:2 A5:8 F5:4 A5:4 C6:4 A5:4 B5:4 D6:4 G5:8 E5:4 G5:4 C6:4 E6:4 C6:12 r:4' },
      // 星が またたく ような アルペジオ
      { w: 'triangle', v: 0.05, n: arp(VILLAGE_CHORDS, 4) },
      { w: 'triangle', v: 0.18, n: bassSlow(VILLAGE_CHORDS) },
      { drums: true, v: 0.08, n: 'k:4 h:4 h:4 h:4 '.repeat(15) + 'k:4 h:4 h:2 h:2 h:4' },
    ],
  },
  memory: {
    bpm: 76,
    ch: [
      { w: 'sine', v: 0.09, n: 'B5:4 G5:2 E5:2 B5:4 A5:4 G5:6 E5:2 C5:8 D5:4 G5:4 B5:4 D6:4 A5:12 r:4 B5:4 E6:4 D6:2 B5:2 G5:4 A5:6 C6:2 E5:8 F#5:4 A5:4 D#5:4 F#5:4 E5:12 r:4 E6:4 D6:2 C6:2 B5:4 G5:4 F#5:4 A5:4 D6:8 B5:4 G5:4 D5:4 G5:4 E5:6 G5:2 B5:8 C6:4 B5:2 A5:2 E5:4 A5:4 G5:4 B5:4 E5:8 D#6:4 B5:4 F#5:4 A5:4 E5:12 r:4' },
      // オルゴールの ワルツ
      { w: 'triangle', v: 0.05, n: waltz(MEMORY_CHORDS, 4) },
      { w: 'triangle', v: 0.16, n: bassLong(MEMORY_CHORDS) },
    ],
  },
  nocto_shadow: {
    bpm: 160,
    ch: [
      { w: 'pulse', v: 0.1, n: 'D5:2 F5:2 A5:2 D6:2 C6:2 A5:2 F5:2 A5:2 D6:4 A5:2 F5:2 E5:4 F5:4 D5:2 F5:2 Bb5:4 A5:2 G5:2 F5:4 E5:2 G5:2 C6:4 Bb5:4 G5:4 A5:2 A5:2 F5:2 D5:2 D6:4 C6:4 Bb5:4 A5:2 G5:2 D5:4 G5:4 C#6:4 A5:4 E5:4 C#5:4 D5:8 F5:4 A5:4 Bb5:2 D6:2 F6:4 E6:2 D6:2 C6:4 G5:2 C6:2 E6:4 D6:2 C6:2 Bb5:4 A5:4 C6:4 F6:4 E6:4 D6:6 A5:2 F5:8 G5:2 Bb5:2 D6:4 C6:2 Bb5:2 A5:4 E5:2 A5:2 C#6:4 E6:4 C#6:4 A5:4 G5:2 F5:2 E5:4 C#5:4 D5:12 r:4' },
      { w: 'saw', v: 0.03, n: pads(SHADOW_CHORDS, 4, 0) },
      // ベース（影が あとを ついてくる ような きざみ）
      { w: 'triangle', v: 0.25, n: bassDrive(SHADOW_CHORDS) },
      { drums: true, v: 0.55, n: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(15) + 'k:2 s:2 k:2 s:2 k:1 k:1 s:2 s:2 s:2' },
    ],
  },
};
