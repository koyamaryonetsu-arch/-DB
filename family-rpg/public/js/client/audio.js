// おんがくと こうかおん（Web Audio で その場で つくる。きょくは すべて オリジナル）

const NOTE_BASE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

function freqOf(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const n = NOTE_BASE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

// 'C5:4 D5:2 r:2' → [{f, len}]
function parse(str) {
  return str.trim().split(/\s+/).map((tok) => {
    const [n, l] = tok.split(':');
    const len = Number(l || 4);
    if (n === 'r') return { f: 0, len };
    if (['k', 's', 'h'].includes(n)) return { drum: n, len };
    return { f: freqOf(n), len };
  });
}

// ───────────── きょく ─────────────
const TRACKS = {
  title: {
    bpm: 84,
    ch: [
      { w: 'pulse', v: 0.11, n: 'G4:4 C5:4 E5:4 G5:4 A5:8 G5:4 E5:4 F5:4 E5:4 D5:4 C5:4 D5:12 r:4 E5:4 G5:4 C6:6 B5:2 A5:8 F5:4 A5:4 G5:4 E5:4 D5:4 E5:4 C5:16' },
      { w: 'triangle', v: 0.22, n: 'C3:16 F2:16 D3:8 G2:8 G2:16 C3:16 F2:16 G2:16 C3:16' },
      { w: 'square', v: 0.04, n: 'E4:16 C4:16 A3:8 B3:8 B3:16 G4:16 A4:16 B3:16 E4:16' },
    ],
  },
  field: {
    bpm: 132,
    ch: [
      { w: 'pulse', v: 0.1, n: 'A4:4 D5:2 E5:2 F#5:4 E5:2 D5:2 B4:4 G5:4 F#5:2 E5:2 D5:4 C#5:4 E5:2 D5:2 C#5:2 B4:2 A4:4 D5:6 A4:2 D5:8 F#5:4 B5:2 A5:2 F#5:4 D5:4 G5:4 F#5:2 E5:2 D5:2 E5:2 B4:4 E5:4 G5:2 F#5:2 E5:4 D5:2 C#5:2 A4:4 C#5:4 E5:4 A5:4' },
      { w: 'triangle', v: 0.22, n: 'D3:4 A2:4 D3:4 A2:4 G2:4 D3:4 G2:4 D3:4 A2:4 E3:4 A2:4 E3:4 D3:4 A2:4 D3:4 D3:4 B2:4 F#3:4 B2:4 F#3:4 G2:4 D3:4 G2:4 D3:4 E3:4 B2:4 E3:4 B2:4 A2:4 E3:4 A2:4 C#3:4' },
      { w: 'square', v: 0.035, n: 'F#4:8 A4:8 G4:8 B4:8 E4:8 A4:8 F#4:8 D4:8 D4:8 F#4:8 B3:8 D4:8 G4:8 E4:8 E4:8 C#4:8' },
      { drums: true, v: 0.5, n: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 h:2 '.repeat(8) },
    ],
  },
  village: {
    bpm: 104,
    ch: [
      { w: 'pulse', v: 0.1, n: 'A4:6 C5:2 A4:4 G4:6 E4:2 G4:4 F4:4 A4:4 D5:4 C5:8 Bb4:4 A4:6 C5:2 F5:4 E5:4 D5:4 C5:4 D5:4 C5:4 A4:4 F4:12' },
      { w: 'triangle', v: 0.2, n: 'F2:12 C3:12 D3:12 Bb2:12 F2:12 C3:12 Bb2:12 F2:12' },
      { w: 'square', v: 0.035, n: 'r:4 A3:4 C4:4 r:4 G3:4 C4:4 r:4 F3:4 A3:4 r:4 F3:4 D4:4 r:4 A3:4 C4:4 r:4 G3:4 E4:4 r:4 F3:4 D4:4 r:4 A3:4 C4:4' },
    ],
  },
  town: {
    bpm: 116,
    ch: [
      { w: 'pulse', v: 0.1, n: 'D5:2 B4:2 G4:2 B4:2 D5:4 G5:4 E5:3 D5:1 B4:4 G4:4 E4:4 C5:2 E5:2 G5:4 E5:2 C5:2 E5:4 D5:4 F#5:4 A5:6 r:2 B5:4 A5:2 G5:2 D5:4 B4:4 G5:4 F#5:2 E5:2 B4:8 C5:2 E5:2 A5:4 D5:2 F#5:2 A5:4 G5:8 D5:4 G4:4' },
      { w: 'triangle', v: 0.22, n: 'G2:4 D3:4 G2:4 D3:4 E2:4 B2:4 E2:4 B2:4 C3:4 G2:4 C3:4 G2:4 D3:4 A2:4 D3:4 F#2:4 G2:4 D3:4 G2:4 D3:4 E2:4 B2:4 E2:4 B2:4 A2:4 E3:4 D3:4 F#2:4 G2:4 D3:4 G2:8' },
      { w: 'square', v: 0.03, n: 'B3:16 G3:16 E4:16 F#4:16 B3:16 G3:16 E4:8 F#4:8 B3:16' },
      { drums: true, v: 0.45, n: 'k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2 '.repeat(8) },
    ],
  },
  forest: {
    bpm: 100,
    ch: [
      { w: 'pulse', v: 0.09, n: 'E5:4 F#5:2 G5:2 A5:4 G5:2 F#5:2 E5:4 D5:4 B4:8 C#5:4 D5:2 E5:2 F#5:4 E5:2 D5:2 E5:16 G5:4 A5:2 B5:2 A5:4 G5:2 F#5:2 E5:4 F#5:4 D5:8 C#5:4 E5:4 A4:4 D5:4 E5:16' },
      { w: 'triangle', v: 0.2, n: 'E2:4 B2:4 E2:4 B2:4 D2:4 A2:4 D2:4 A2:4 A2:4 E3:4 A2:4 E3:4 E2:4 B2:4 E2:4 B2:4 G2:4 D3:4 G2:4 D3:4 D2:4 A2:4 D2:4 A2:4 A2:4 E3:4 A2:4 E3:4 E2:4 B2:4 E2:8' },
      { drums: true, v: 0.3, n: 'k:4 h:4 s:4 h:4 '.repeat(8) },
    ],
  },
  shrine: {
    bpm: 92,
    ch: [
      { w: 'triangle', v: 0.13, n: 'E5:2 B4:2 G4:2 B4:2 E5:2 B4:2 G4:2 B4:2 F#5:2 C#5:2 A4:2 C#5:2 F#5:2 C#5:2 A4:2 C#5:2 G5:2 D5:2 B4:2 D5:2 G5:2 D5:2 B4:2 D5:2 F#5:2 D5:2 A4:2 D5:2 E5:8' },
      { w: 'triangle', v: 0.16, n: 'E3:16 A2:16 G2:16 D3:8 E3:8' },
    ],
  },
  cave: {
    bpm: 84,
    ch: [
      { w: 'square', v: 0.06, n: 'A4:8 r:4 E5:4 D5:8 C5:4 B4:4 A4:4 C5:4 E5:4 G5:4 F5:12 E5:4 D5:8 r:4 F5:4 E5:8 C5:4 A4:4 B4:4 C5:4 D5:4 E5:4 A4:16' },
      { w: 'triangle', v: 0.22, n: 'A2:16 F2:16 C3:16 D3:16 Bb2:16 A2:16 E2:16 A2:16' },
      { w: 'saw', v: 0.025, n: 'E4:16 C4:16 G4:16 A4:16 F4:16 E4:16 G#4:16 E4:16' },
      { drums: true, v: 0.35, n: 'k:4 r:12 '.repeat(8) },
    ],
  },
  // 第2章: 海（6/8 の ふなうた）
  sea: {
    bpm: 120,
    ch: [
      { w: 'pulse', v: 0.1, n: 'C5:4 F5:2 A5:4 G5:2 F5:6 C5:6 D5:4 G5:2 Bb5:4 A5:2 G5:6 r:6 A5:4 G5:2 F5:4 E5:2 D5:4 E5:2 F5:4 D5:2 C5:4 A4:2 Bb4:4 G4:2 F4:12 A4:4 C5:2 F5:4 A5:2 C6:6 A5:6 Bb5:4 A5:2 G5:4 F5:2 E5:6 C5:6 D5:4 F5:2 Bb5:4 D6:2 C6:4 A5:2 F5:4 A5:2 G5:4 E5:2 C5:4 E5:2 F5:12' },
      { w: 'triangle', v: 0.22, n: 'F2:6 C3:6 F2:6 A2:6 Bb2:6 D3:6 C3:6 G2:6 F2:6 C3:6 Bb2:6 F2:6 C3:6 C2:6 F2:6 C3:6 F2:6 C3:6 F2:6 A2:6 Bb2:6 D3:6 C3:6 E3:6 Bb2:6 D3:6 F2:6 A2:6 C3:6 C2:6 F2:6 F2:6' },
      { w: 'square', v: 0.03, n: 'A4:12 A4:12 Bb4:12 G4:12 A4:12 F4:12 E4:12 F4:12 C5:12 C5:12 D5:12 C5:12 D5:12 C5:12 Bb4:12 A4:12' },
      { drums: true, v: 0.4, n: 'k:2 h:2 h:2 s:2 h:2 h:2 '.repeat(16) },
    ],
  },
  // 第2章: 嵐の塔
  tower: {
    bpm: 108,
    ch: [
      { w: 'pulse', v: 0.09, n: 'D5:4 F5:4 E5:2 D5:2 C#5:4 D5:6 A4:2 A4:8 Bb4:4 D5:4 C5:2 Bb4:2 A4:4 G4:6 A4:2 E4:8 F4:4 A4:4 D5:4 F5:4 E5:4 G5:4 A5:8 G5:2 F5:2 E5:2 D5:2 C#5:4 E5:4 D5:16' },
      { w: 'triangle', v: 0.24, n: ('D2:2 D3:2 '.repeat(8) + 'Bb1:2 Bb2:2 '.repeat(4) + 'A1:2 A2:2 '.repeat(4) + 'D2:2 D3:2 '.repeat(4) + 'C2:2 C3:2 '.repeat(4) + 'A1:2 A2:2 '.repeat(4) + 'D2:2 D3:2 '.repeat(4)) },
      { w: 'saw', v: 0.025, n: 'F4:16 F4:16 F4:16 E4:16 A4:16 G4:16 E4:16 F4:16' },
      { drums: true, v: 0.4, n: 'k:4 h:4 s:4 h:4 '.repeat(8) },
    ],
  },
  battle: {
    bpm: 152,
    ch: [
      { w: 'pulse', v: 0.1, n: 'E5:2 E5:2 B4:2 E5:2 G5:2 F#5:2 E5:2 B4:2 C5:2 C5:2 G4:2 C5:2 E5:2 D5:2 C5:2 G4:2 D5:2 D5:2 A4:2 D5:2 F#5:2 E5:2 D5:2 A4:2 B4:2 D#5:2 F#5:2 B5:2 A5:2 F#5:2 D#5:2 B4:2 G5:4 F#5:4 E5:4 B4:4 A4:4 C5:4 E5:4 A5:4 G5:4 E5:4 F#5:4 A5:4 B5:6 A5:2 G5:2 F#5:2 D#5:4' },
      { w: 'triangle', v: 0.24, n: 'E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 C2:2 C3:2 D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 D2:2 D3:2 B1:2 B2:2 B1:2 B2:2 B1:2 B2:2 B1:2 B2:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 E2:2 E3:2 A1:2 A2:2 A1:2 A2:2 A1:2 A2:2 A1:2 A2:2 C2:2 C3:2 C2:2 C3:2 D2:2 D3:2 D2:2 D3:2 B1:2 B2:2 B1:2 B2:2 B1:2 B2:2 B1:2 B2:2' },
      { w: 'square', v: 0.03, n: 'B4:16 G4:16 A4:16 F#4:16 B4:16 E4:16 E4:8 F#4:8 D#4:16' },
      { drums: true, v: 0.55, n: 'k:2 h:2 s:2 h:2 k:2 h:2 s:2 k:2 '.repeat(8) },
    ],
  },
  boss: {
    bpm: 164,
    ch: [
      { w: 'pulse', v: 0.1, n: 'D5:2 F5:2 A5:2 D6:2 C#6:2 A5:2 F5:2 E5:2 F5:2 D5:2 Bb4:2 D5:2 F5:4 E5:4 G5:2 Bb5:2 D6:2 Bb5:2 A5:2 G5:2 F5:2 E5:2 E5:4 C#5:4 A4:4 E5:4 D5:6 E5:2 F5:6 G5:2 A5:6 Bb5:2 A5:4 G5:4 G5:4 F5:4 E5:4 D5:4 C#5:4 E5:4 A5:8' },
      { w: 'triangle', v: 0.25, n: ('D2:2 D2:2 A2:2 D2:2 D2:2 D2:2 A2:2 D2:2 Bb1:2 Bb1:2 F2:2 Bb1:2 Bb1:2 Bb1:2 F2:2 Bb1:2 G1:2 G1:2 D2:2 G1:2 G1:2 G1:2 D2:2 G1:2 A1:2 A1:2 E2:2 A1:2 A1:2 A1:2 E2:2 A1:2 ').repeat(2) },
      { w: 'saw', v: 0.03, n: 'A4:16 F4:16 D4:16 C#4:16 A4:16 F4:16 D4:16 E4:16' },
      { drums: true, v: 0.6, n: 'k:2 s:2 k:2 s:2 k:1 k:1 s:2 k:2 s:2 '.repeat(8) },
    ],
  },
  festival: {
    bpm: 120,
    ch: [
      { w: 'pulse', v: 0.1, n: 'C5:2 E5:2 G5:2 E5:2 C5:2 E5:2 F5:2 A5:2 C6:2 A5:2 F5:2 A5:2 G5:2 F5:2 E5:2 D5:2 C5:2 B4:2 C5:6 G4:6 E5:2 G5:2 C6:2 G5:2 E5:2 G5:2 F5:2 E5:2 D5:2 A5:6 G5:3 F5:1 E5:2 D5:3 B4:1 G4:2 C5:12' },
      { w: 'triangle', v: 0.22, n: 'C3:6 G2:6 F2:6 C3:6 G2:6 G2:6 C3:6 C3:6 C3:6 G2:6 D3:6 F2:6 G2:6 G2:6 C3:12' },
      { drums: true, v: 0.45, n: 'k:2 h:2 h:2 s:2 h:2 h:2 '.repeat(8) },
    ],
  },
  danger: {
    bpm: 70,
    ch: [
      { w: 'square', v: 0.08, n: 'D4:4 D#4:4 D4:4 C#4:4 D4:8 A3:8 D4:4 F4:4 E4:4 D#4:4 D4:16' },
      { w: 'triangle', v: 0.25, n: 'D2:16 D2:16 D2:16 D2:16' },
      { drums: true, v: 0.5, n: 'k:8 k:8 '.repeat(4) },
    ],
  },
  // ジングル（くりかえさない）
  victory: {
    bpm: 150, once: true,
    ch: [
      { w: 'pulse', v: 0.12, n: 'C5:2 E5:2 G5:2 C6:6 G5:2 C6:10' },
      { w: 'triangle', v: 0.22, n: 'C3:12 C3:12' },
      { w: 'square', v: 0.05, n: 'G4:6 E5:6 C5:12' },
    ],
  },
  levelup: {
    bpm: 160, once: true,
    ch: [
      { w: 'pulse', v: 0.12, n: 'C5:2 E5:2 G5:2 C6:2 G5:2 C6:8' },
      { w: 'triangle', v: 0.2, n: 'C3:18' },
    ],
  },
  inn: {
    bpm: 90, once: true,
    ch: [
      { w: 'triangle', v: 0.16, n: 'E5:4 D5:4 C5:4 G4:4 A4:4 B4:4 C5:8' },
      { w: 'triangle', v: 0.16, n: 'C3:16 G2:8 C3:8' },
    ],
  },
  chapter: {
    bpm: 110, once: true,
    ch: [
      { w: 'pulse', v: 0.12, n: 'G4:3 G4:1 G4:4 C5:8 E5:4 D5:4 C5:8 G5:16' },
      { w: 'triangle', v: 0.22, n: 'C3:16 A2:8 F2:8 G2:8 C3:8' },
      { w: 'square', v: 0.04, n: 'E4:16 C4:8 A3:8 B3:8 E4:8' },
    ],
  },
  lose: {
    bpm: 80, once: true,
    ch: [
      { w: 'pulse', v: 0.1, n: 'A4:4 G#4:4 G4:4 F#4:12' },
      { w: 'triangle', v: 0.2, n: 'D3:12 D2:12' },
    ],
  },
};

// ───────────── こうかおん ─────────────
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.music = null;
    this.musicVol = 0.6;
    this.sfxVol = 0.8;
    this.track = null;
    this.resumeTrack = null;
    try {
      const s = JSON.parse(localStorage.getItem('kizuna_audio') || '{}');
      if (typeof s.music === 'number') this.musicVol = s.music;
      if (typeof s.sfx === 'number') this.sfxVol = s.sfx;
    } catch { /* */ }
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.master);
      // パルス波
      const real = new Float32Array(32), imag = new Float32Array(32);
      for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
      this.pulseWave = this.ctx.createPeriodicWave(real, imag);
      const len = this.ctx.sampleRate;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      setInterval(() => this.schedule(), 30);
      if (this.pending) this.play(this.pending);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.applySession();
  }

  // iPhone: アプリを きりかえたり でんわの あとは おとが とまるので、つぎに さわった ときに もどす
  resumeIfNeeded() {
    if (!this.ctx || this.ctx.state === 'running') return;
    try { this.ctx.resume().catch(() => {}); } catch { /* */ }
  }

  // iPhone の マナーモード（サイレントスイッチ）でも おとを だすか
  get silentPlay() {
    try { return !!JSON.parse(localStorage.getItem('kizuna_audio') || '{}').silentPlay; } catch { return false; }
  }

  set silentPlay(on) {
    try {
      const s = JSON.parse(localStorage.getItem('kizuna_audio') || '{}');
      s.silentPlay = !!on;
      localStorage.setItem('kizuna_audio', JSON.stringify(s));
    } catch { /* */ }
    this.applySession();
  }

  applySession() {
    try {
      if (navigator.audioSession) navigator.audioSession.type = this.silentPlay ? 'playback' : 'auto';
    } catch { /* */ }
  }

  setVolumes(music, sfx) {
    this.musicVol = music;
    this.sfxVol = sfx;
    if (this.musicGain) this.musicGain.gain.value = music;
    if (this.sfxGain) this.sfxGain.gain.value = sfx;
    try {
      const s = JSON.parse(localStorage.getItem('kizuna_audio') || '{}');
      localStorage.setItem('kizuna_audio', JSON.stringify({ ...s, music, sfx }));
    } catch { /* */ }
  }

  // ───── おんがく ─────
  play(id, { force = false } = {}) {
    if (id === 'resume') id = this.resumeTrack || this.lastLoop;
    if (!id) return this.stop();
    if (!this.ctx) {
      this.pending = id;
      return;
    }
    const tr = TRACKS[id];
    if (!tr) return;
    if (!tr.once) this.lastLoop = id;
    if (this.music && this.music.id === id && !force) return;
    if (tr.once && this.music && !TRACKS[this.music.id]?.once) this.resumeTrack = this.music.id;
    this.stop();
    const spb = 60 / tr.bpm / 4; // 16ぶおんぷ の びょう
    const out = this.ctx.createGain();
    out.gain.value = 1;
    out.connect(this.musicGain);
    this.music = {
      id, tr, spb, out,
      chans: tr.ch.map((c) => ({ ...c, seq: parse(c.n), i: 0, t: this.ctx.currentTime + 0.08 })),
      once: !!tr.once,
    };
  }

  stop(fade = 0.25) {
    if (!this.music) return;
    const m = this.music;
    this.music = null;
    try {
      m.out.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
      setTimeout(() => m.out.disconnect(), fade * 1000 + 200);
    } catch { /* */ }
  }

  schedule() {
    const m = this.music;
    if (!m || !this.ctx) return;
    const ahead = this.ctx.currentTime + 0.2;
    let allDone = true;
    for (const ch of m.chans) {
      while (ch.t < ahead) {
        if (ch.i >= ch.seq.length) {
          if (m.once) break;
          ch.i = 0;
        }
        const n = ch.seq[ch.i++];
        const dur = n.len * m.spb;
        if (ch.drums) this.drum(n.drum, ch.t, ch.v, m.out);
        else if (n.f) this.note(n.f, ch.t, dur, ch.w, ch.v, m.out);
        ch.t += dur;
      }
      if (ch.i < ch.seq.length) allDone = false;
    }
    if (m.once && allDone && this.ctx.currentTime > Math.max(...m.chans.map((c) => c.t))) {
      this.music = null;
      if (this.resumeTrack && this.autoResume !== false) {
        const r = this.resumeTrack;
        this.resumeTrack = null;
        this.play(r);
      }
    }
  }

  note(f, t, dur, wave, vol, out) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    if (wave === 'pulse') o.setPeriodicWave(this.pulseWave);
    else o.type = wave === 'saw' ? 'sawtooth' : wave || 'square';
    o.frequency.value = f;
    const g = ctx.createGain();
    const len = Math.max(0.05, dur * 0.92);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.setTargetAtTime(vol * (wave === 'triangle' ? 0.8 : 0.55), t + 0.02, 0.08);
    g.gain.setTargetAtTime(0, t + len - 0.03, 0.02);
    let node = o;
    if (wave === 'saw') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1400;
      o.connect(lp);
      node = lp;
    }
    node.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  drum(kind, t, vol, out) {
    const ctx = this.ctx;
    if (kind === 'k') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      g.gain.setValueAtTime(vol * 0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(out);
      o.start(t); o.stop(t + 0.16);
    } else {
      const s = ctx.createBufferSource();
      s.buffer = this.noiseBuf;
      const f = ctx.createBiquadFilter();
      f.type = kind === 'h' ? 'highpass' : 'bandpass';
      f.frequency.value = kind === 'h' ? 7000 : 1800;
      const g = ctx.createGain();
      const d = kind === 'h' ? 0.04 : 0.12;
      g.gain.setValueAtTime(vol * (kind === 'h' ? 0.25 : 0.45), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      s.connect(f); f.connect(g); g.connect(out);
      s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
    }
  }

  // ───── こうかおん ─────
  tone(f, dur, { type = 'square', vol = 0.2, delay = 0, slide = null, attack = 0.005 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    if (type === 'pulse') o.setPeriodicWave(this.pulseWave);
    else o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  noise(dur, { vol = 0.3, delay = 0, type = 'lowpass', from = 3000, to = 300, q = 1 } = {}) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfxGain);
    s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.02);
  }

  sfx(id) {
    if (!this.ctx) return;
    const T = (...a) => this.tone(...a);
    switch (id) {
      case 'cursor': T(880, 0.04, { vol: 0.08 }); break;
      case 'confirm': T(660, 0.05, { vol: 0.1 }); T(990, 0.07, { vol: 0.1, delay: 0.05 }); break;
      case 'cancel': T(520, 0.05, { vol: 0.1 }); T(390, 0.07, { vol: 0.1, delay: 0.05 }); break;
      case 'buzz': T(110, 0.14, { vol: 0.15 }); break;
      case 'talk': T(1200, 0.015, { vol: 0.03, type: 'triangle' }); break;
      case 'hit': this.noise(0.12, { vol: 0.35, from: 4000, to: 400 }); T(300, 0.1, { vol: 0.12, slide: 80 }); break;
      case 'crit': this.noise(0.18, { vol: 0.45, from: 6000, to: 300 }); T(1600, 0.12, { vol: 0.1 }); T(400, 0.2, { vol: 0.15, slide: 60, delay: 0.03 }); break;
      case 'hurt': this.noise(0.16, { vol: 0.4, from: 1500, to: 150 }); T(160, 0.16, { vol: 0.18, slide: 50 }); break;
      case 'miss': this.noise(0.18, { vol: 0.15, type: 'bandpass', from: 800, to: 3000, q: 3 }); break;
      case 'spell': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.08, { vol: 0.07, delay: i * 0.04, type: 'triangle' })); break;
      case 'fire': this.noise(0.45, { vol: 0.35, from: 600, to: 3000, type: 'lowpass' }); this.noise(0.35, { vol: 0.2, delay: 0.1, from: 3000, to: 400 }); break;
      case 'ice': [1760, 2093, 1568, 2349].forEach((f, i) => T(f, 0.12, { vol: 0.06, delay: i * 0.05, type: 'triangle' })); this.noise(0.25, { vol: 0.12, type: 'highpass', from: 5000, to: 8000 }); break;
      case 'wind': this.noise(0.5, { vol: 0.28, type: 'bandpass', from: 400, to: 2400, q: 4 }); break;
      case 'blast': this.noise(0.6, { vol: 0.6, from: 2000, to: 60 }); T(90, 0.4, { vol: 0.25, slide: 30, type: 'triangle' }); break;
      case 'bolt': this.noise(0.08, { vol: 0.5, type: 'highpass', from: 3000, to: 3000 }); this.noise(0.5, { vol: 0.4, delay: 0.06, from: 1500, to: 80 }); break;
      case 'dark': T(220, 0.4, { vol: 0.15, slide: 110, type: 'saw' }); this.noise(0.4, { vol: 0.2, from: 800, to: 100 }); break;
      case 'void': [1047, 784, 523, 262].forEach((f, i) => T(f, 0.2, { vol: 0.1, delay: i * 0.06, type: 'triangle' })); this.noise(0.7, { vol: 0.35, delay: 0.2, from: 5000, to: 100 }); break;
      case 'heal': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, 0.16, { vol: 0.07, delay: i * 0.06, type: 'sine' })); break;
      case 'buff': [392, 523, 659, 784].forEach((f, i) => T(f, 0.1, { vol: 0.08, delay: i * 0.05, type: 'triangle' })); break;
      case 'debuff': [784, 659, 523, 392].forEach((f, i) => T(f, 0.1, { vol: 0.08, delay: i * 0.05, type: 'triangle' })); break;
      case 'sleep': [660, 550, 440].forEach((f, i) => T(f, 0.25, { vol: 0.07, delay: i * 0.15, type: 'sine' })); break;
      case 'defeat': [600, 450, 300, 180].forEach((f, i) => T(f, 0.06, { vol: 0.1, delay: i * 0.05 })); break;
      case 'item': T(784, 0.08, { vol: 0.1, type: 'triangle' }); T(1047, 0.16, { vol: 0.1, delay: 0.08, type: 'triangle' }); break;
      case 'key': [523, 659, 784, 1047, 784, 1047].forEach((f, i) => T(f, 0.1, { vol: 0.09, delay: i * 0.08, type: 'pulse' })); break;
      case 'chest': T(220, 0.05, { vol: 0.12 }); T(330, 0.05, { vol: 0.12, delay: 0.05 }); T(880, 0.18, { vol: 0.1, delay: 0.12, type: 'triangle' }); break;
      case 'door': this.noise(0.2, { vol: 0.3, from: 500, to: 100 }); T(90, 0.15, { vol: 0.2, type: 'triangle' }); break;
      case 'stairs': [400, 350, 300, 250].forEach((f, i) => T(f, 0.05, { vol: 0.1, delay: i * 0.07 })); break;
      case 'join': [523, 659, 784, 1047].forEach((f, i) => T(f, 0.12, { vol: 0.09, delay: i * 0.09, type: 'pulse' })); break;
      case 'leave': [784, 659, 523].forEach((f, i) => T(f, 0.12, { vol: 0.08, delay: i * 0.1, type: 'pulse' })); break;
      case 'sparkle': [1568, 2093, 2637, 3136].forEach((f, i) => T(f, 0.2, { vol: 0.05, delay: i * 0.07, type: 'sine' })); break;
      case 'rumble': this.noise(1.2, { vol: 0.5, from: 300, to: 40 }); break;
      case 'thunder': this.noise(0.1, { vol: 0.6, type: 'highpass', from: 2000, to: 2000 }); this.noise(1.4, { vol: 0.5, delay: 0.08, from: 800, to: 30 }); break;
      case 'hammer': [0, 0.28, 0.56].forEach((d) => { T(1400, 0.08, { vol: 0.12, delay: d }); this.noise(0.06, { vol: 0.2, delay: d, from: 4000, to: 2000 }); }); break;
      case 'flee': this.noise(0.3, { vol: 0.2, type: 'bandpass', from: 2000, to: 400, q: 2 }); break;
      case 'bond': [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => T(f, 0.5, { vol: 0.07, delay: i * 0.06, type: 'triangle' })); break;
      case 'poison': [300, 360, 280].forEach((f, i) => T(f, 0.08, { vol: 0.08, delay: i * 0.08, type: 'sine' })); break;
      case 'encounter': this.noise(0.4, { vol: 0.35, type: 'bandpass', from: 300, to: 3000, q: 2 }); [330, 440, 554, 659].forEach((f, i) => T(f, 0.06, { vol: 0.08, delay: i * 0.04 })); break;
      case 'warn': T(880, 0.12, { vol: 0.1 }); T(880, 0.12, { vol: 0.1, delay: 0.18 }); break;
      case 'stamp': T(1047, 0.06, { vol: 0.07, type: 'triangle' }); T(1319, 0.08, { vol: 0.07, delay: 0.06, type: 'triangle' }); break;
      default:
    }
  }
}

export const TRACK_IDS = Object.keys(TRACKS);
export const _TRACKS = TRACKS;
export const _parse = parse;
