/*
 * audio.js - chiptune sound engine + original score (Web Audio API only, no audio files).
 * Exposes exactly one global: `Sound`.  All melodies here are original compositions.
 *
 *   Sound.unlock()             call from inside a user-gesture handler (pointerdown/keydown/click...)
 *   Sound.playBGM(name)        loop a BGM track (no-op if it is already the current track)
 *   Sound.stopBGM(fadeMs=300)
 *   Sound.currentBGM()         -> name | null   (the track that should be playing)
 *   Sound.playJingle(name)     -> Promise<void>; the BGM pauses and resumes where it was afterwards
 *   Sound.sfx(name)            one-shot effect, layered over the music
 *   Sound.setMuted(b) / Sound.isMuted()
 *   Sound.setVolume(v)         master volume 0..1 (default 0.5); Sound.getVolume()
 *   Sound.list()               -> { bgm: [...], jingles: [...], sfx: [...] }
 *
 * Integration notes
 *  - Nothing makes sound until unlock() has been called from a user gesture.  Calling it on
 *    every pointerdown/keydown is fine (cheap, idempotent).  After the first call the module
 *    also retries on pointerup/touchend/click/keydown, because mobile browsers only accept
 *    those as "activation" events and iOS may interrupt the context after calls/app switches.
 *  - Before unlock every call is a silent no-op, but playBGM() remembers the track and it
 *    starts on unlock.  If Web Audio is missing or fails, everything stays a silent no-op.
 *  - playBGM() during a jingle is deferred until the jingle ends (the jingle is not cut).
 *    After a jingle, the paused BGM resumes where it was unless playBGM/stopBGM was called
 *    meanwhile - including synchronously in the promise's .then().  For the battle victory
 *    fanfare call Sound.stopBGM(0) first, so battle music does not come back afterwards.
 *  - Muting suspends the AudioContext (saves battery); playJingle() resolves at once while
 *    muted.  The context is also suspended while the page is hidden.
 *  - Sound._debug holds test hooks (MML parser, per-track durations, offline rendering).
 */
const Sound = (() => {
  'use strict';

  // =====================================================================
  // Engine constants
  // =====================================================================
  const LOOKAHEAD = 0.2;      // seconds of music scheduled ahead of the audio clock
  const TICK_MS = 25;         // scheduler period
  const TPQ = 48;             // ticks per quarter note
  const WHOLE = TPQ * 4;      // ticks per whole note (192)
  const SWITCH_FADE = 0.15;   // BGM -> BGM fade-out (s)
  const JINGLE_FADE = 0.06;   // BGM fade-out before a jingle (s)
  const RESUME_FADE = 0.45;   // fade-in when a paused BGM resumes mid-song (s)
  const DEFAULT_VOLUME = 0.5;
  const MAX_SFX = 8;          // simultaneous sfx instances (oldest is cut)
  // Peak level of one full-volume voice before the master gain.
  const LVL = { pulse: 0.375, tri: 0.19, drum: 0.48, sfx: 1.1 };

  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const volCurve = (v) => (v <= 0 ? 0 : Math.pow(v, 1.6));

  // =====================================================================
  // Waveforms (built once per AudioContext)
  // =====================================================================
  const HARM = 96;

  // Wraps a PeriodicWave; `comp` scales it to a common loudness (browsers peak-normalise waves).
  function makeWave(c, re, im, targetRms) {
    const pw = c.createPeriodicWave(re, im);
    let ss = 0;
    for (let k = 1; k < re.length; k++) ss += re[k] * re[k] + im[k] * im[k];
    const rms = Math.sqrt(ss / 2);
    let pk = 1e-9;
    const N = 512;
    for (let i = 0; i < N; i++) {
      let y = 0;
      const x = (2 * Math.PI * i) / N;
      for (let k = 1; k < re.length; k++) y += re[k] * Math.cos(k * x) + im[k] * Math.sin(k * x);
      if (Math.abs(y) > pk) pk = Math.abs(y);
    }
    return { pw, comp: targetRms / (rms / pk) };
  }

  function pulseWave(c, duty, loud) {
    const re = new Float32Array(HARM + 1), im = new Float32Array(HARM + 1);
    for (let k = 1; k <= HARM; k++) {
      re[k] = Math.sin(2 * Math.PI * k * duty) / (Math.PI * k);
      im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (Math.PI * k);
    }
    return makeWave(c, re, im, 0.5 * loud);
  }

  // 4-bit stepped triangle (32 steps, like the classic console bass channel).
  function triWave(c) {
    const M = 32, x = [];
    for (let i = 0; i < M; i++) x.push(i < 16 ? 15 - i : i - 16);
    const re = new Float32Array(65), im = new Float32Array(65);
    for (let n = 1; n <= 64; n++) {
      let xr = 0, xi = 0;
      for (let k = 0; k < M; k++) {
        const a = (-2 * Math.PI * n * k) / M;
        xr += x[k] * Math.cos(a);
        xi += x[k] * Math.sin(a);
      }
      const u = (Math.PI * n) / M;
      const s = Math.sin(u) / u;            // zero-order-hold sinc
      const hr = s * Math.cos(-u), hi = s * Math.sin(-u);
      const cr = (xr * hr - xi * hi) / M, ci = (xr * hi + xi * hr) / M;
      re[n] = 2 * cr;
      im[n] = -2 * ci;
    }
    const w = makeWave(c, re, im, 0.577);
    w.comp = 1;
    return w;
  }

  function noiseBuffer(c) {
    const n = Math.floor(c.sampleRate);
    const b = c.createBuffer(1, n, c.sampleRate);
    const d = b.getChannelData(0);
    let s = 0x2f6b1a53;
    for (let i = 0; i < n; i++) {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
      d[i] = ((s >>> 0) / 4294967296) * 2 - 1;
    }
    return b;
  }

  const kits = new WeakMap();
  function getKit(c) {
    let k = kits.get(c);
    if (k) return k;
    k = {
      w: {
        p12: pulseWave(c, 0.125, 0.8),
        p25: pulseWave(c, 0.25, 0.9),
        p50: pulseWave(c, 0.5, 1.0),
        tri: triWave(c),
      },
      noise: noiseBuffer(c),
    };
    kits.set(c, k);
    return k;
  }
  const DUTY = ['p12', 'p25', 'p50', 'p25']; // @0..@3

  // =====================================================================
  // Envelopes, vibrato, note & drum voices
  // =====================================================================
  // [attack, sustain level, decay time-constant, release]
  const ENVS = [
    [0.004, 1.0, 0.0, 0.035],  // E0 organ / flat
    [0.006, 0.7, 0.12, 0.05],  // E1 brass: accent, then settle
    [0.003, 0.0, 0.3, 0.06],   // E2 pluck / harp
    [0.002, 0.0, 0.07, 0.02],  // E3 staccato blip
    [0.08, 1.0, 0.0, 0.15],    // E4 swell / pad
    [0.002, 0.0, 0.6, 0.3],    // E5 bell
    [0.02, 0.6, 0.25, 0.09],   // E6 soft lead
    [0.035, 0.85, 0.35, 0.12], // E7 strings
    [0.003, 0.35, 0.08, 0.04], // E8 punchy (fast decay to 35%)
    [0.003, 0.0, 0.14, 0.03],  // E9 short pluck (arpeggios)
  ];
  const VIB = [0, 10, 20, 35];  // V0..V3 depth in cents
  const VIB_RATE = 5.6, VIB_DELAY = 0.16;
  const vibCache = new Map();

  function setVibrato(param, at, dur, cents, det) {
    const key = cents + ':' + det + ':' + Math.round(dur * 50);
    let curve = vibCache.get(key);
    if (!curve) {
      const n = Math.max(4, Math.ceil(dur * 60));
      curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * dur;
        const amt = t < VIB_DELAY ? 0 : Math.min(1, (t - VIB_DELAY) / 0.15);
        curve[i] = det + cents * amt * Math.sin(2 * Math.PI * VIB_RATE * (t - VIB_DELAY));
      }
      if (vibCache.size > 200) vibCache.clear();
      vibCache.set(key, curve);
    }
    try { param.setValueCurveAtTime(curve, at, dur); } catch (e) { param.value = det; }
  }

  function playTone(c, w, dest, freq, at, gate, peak, env, vib, det, reg) {
    const osc = c.createOscillator();
    osc.setPeriodicWave(w.pw);
    osc.frequency.value = freq;
    const A = Math.min(env[0], gate * 0.5), S = env[1], tc = env[2], R = env[3];
    const off = at + gate, end = off + R;
    if (vib && gate > 0.22) setVibrato(osc.detune, at, end - at, VIB[vib], det);
    else if (det) osc.detune.value = det;
    const g = c.createGain(), gp = g.gain;
    gp.setValueAtTime(0, at);
    gp.linearRampToValueAtTime(peak, at + A);
    let lvl = peak;
    if (S < 1 && tc > 0) {
      gp.setTargetAtTime(peak * S, at + A, tc);
      lvl = peak * (S + (1 - S) * Math.exp(-(gate - A) / tc));
    }
    gp.setValueAtTime(lvl, off);
    gp.linearRampToValueAtTime(0, end);
    osc.connect(g);
    g.connect(dest);
    osc.start(at);
    osc.stop(end + 0.01);
    reg(osc, g);
  }

  // Filtered-noise burst.  o: {type, f, f2, q, v, a, tc, d, rate}
  function noiseHit(c, k, dest, at, o, reg) {
    const src = c.createBufferSource();
    src.buffer = k.noise;
    src.loop = true;
    if (o.rate) src.playbackRate.value = o.rate;
    const f = c.createBiquadFilter();
    f.type = o.type || 'highpass';
    f.frequency.setValueAtTime(o.f, at);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, at + o.d);
    f.Q.value = o.q || 0.7;
    const g = c.createGain(), gp = g.gain, a = o.a || 0.001;
    gp.setValueAtTime(0, at);
    gp.linearRampToValueAtTime(o.v, at + a);
    gp.setTargetAtTime(0, at + a, o.tc);
    src.connect(f);
    f.connect(g);
    g.connect(dest);
    src.start(at, Math.random() * 0.8);
    src.stop(at + o.d);
    reg(src, g, f);
  }

  // Pitch-dropping triangle thump (kick, toms, timpani). o: {f, f2, sd, v, tc, d}
  function thump(c, k, dest, at, o, reg) {
    const osc = c.createOscillator();
    osc.setPeriodicWave(k.w.tri.pw);
    osc.frequency.setValueAtTime(o.f, at);
    osc.frequency.exponentialRampToValueAtTime(o.f2, at + o.sd);
    const g = c.createGain(), gp = g.gain;
    gp.setValueAtTime(0, at);
    gp.linearRampToValueAtTime(o.v, at + 0.002);
    gp.setTargetAtTime(0, at + 0.002, o.tc);
    osc.connect(g);
    g.connect(dest);
    osc.start(at);
    osc.stop(at + o.d);
    reg(osc, g);
  }

  // Drum kit for the noise channel (index = semitone of the MML note letter).
  const DRUMS = [
    (c, k, d, t, v, r) => { // 0 c: kick
      thump(c, k, d, t, { f: 170, f2: 46, sd: 0.07, v: v * 1.1, tc: 0.06, d: 0.28 }, r);
      noiseHit(c, k, d, t, { type: 'lowpass', f: 1500, v: v * 0.3, tc: 0.008, d: 0.04 }, r);
    },
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'bandpass', f: 2600, q: 2, v: v * 0.8, tc: 0.012, d: 0.06 }, r), // 1 c+: rim
    (c, k, d, t, v, r) => { // 2 d: snare
      noiseHit(c, k, d, t, { type: 'highpass', f: 900, v: v * 0.75, tc: 0.05, d: 0.24 }, r);
      thump(c, k, d, t, { f: 230, f2: 150, sd: 0.04, v: v * 0.45, tc: 0.03, d: 0.09 }, r);
    },
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'bandpass', f: 2000, q: 0.8, v: v * 0.55, tc: 0.06, d: 0.24 }, r), // 3 d+: soft snare
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'highpass', f: 7000, v: v * 0.5, tc: 0.014, d: 0.07 }, r), // 4 e: closed hat
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'highpass', f: 6000, v: v * 0.4, tc: 0.08, d: 0.4 }, r), // 5 f: open hat
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'bandpass', f: 5500, q: 1.2, v: v * 1.4, a: 0.01, tc: 0.022, d: 0.09 }, r), // 6 f+: shaker
    (c, k, d, t, v, r) => thump(c, k, d, t, { f: 150, f2: 85, sd: 0.12, v: v, tc: 0.09, d: 0.34 }, r), // 7 g: low tom
    (c, k, d, t, v, r) => thump(c, k, d, t, { f: 200, f2: 115, sd: 0.11, v: v, tc: 0.08, d: 0.3 }, r), // 8 g+: mid tom
    (c, k, d, t, v, r) => thump(c, k, d, t, { f: 270, f2: 150, sd: 0.1, v: v, tc: 0.07, d: 0.28 }, r), // 9 a: high tom
    (c, k, d, t, v, r) => thump(c, k, d, t, { f: 100, f2: 92, sd: 0.3, v: v, tc: 0.28, d: 1.1 }, r), // 10 a+: timpani
    (c, k, d, t, v, r) => noiseHit(c, k, d, t, { type: 'highpass', f: 3200, v: v * 0.5, tc: 0.35, d: 1.5 }, r), // 11 b: crash
  ];

  // =====================================================================
  // MML parser
  // ---------------------------------------------------------------------
  //  Notes     c d e f g a b, then + or # (sharp) / - (flat), length, dots:  c4  d+8.  e-16
  //  Rest      r8             Tie  ^8 (extends the previous note or rest:  c4^16)
  //  Octave    o4  > (up)  < (down)          Default length  l8   (l8. allowed)
  //  Volume    v0..v15        Gate  q1..q8 (sounding part in 8ths; q8 = legato)
  //  Timbre    @0..@3 pulse duty 12.5 / 25 / 50 / 75 %
  //  Envelope  E0..E9 (see ENVS)    Vibrato V0..V3    Detune D<cents>   Transpose k<semitones>
  //  Tempo     t<bpm> (quarter notes per minute; mirror tempo changes in every channel)
  //  Loops     [ ... ]n  - the part after an optional | is skipped on the last pass
  //  L         loop point: the track repeats from here (default: from the start)
  //  /         bar check: warns (debug) if it is not on a bar line
  //  Lengths   1 2 4 8 16 32 64, triplets 3 6 12 24 48 (whole note = 192 ticks)
  //  Noise channel: the note letter picks a drum (octave ignored):
  //    c kick, c+ rim, d snare, d+ soft snare, e closed hat, f open hat,
  //    f+ shaker, g low tom, g+ mid tom, a high tom, a+ timpani, b crash
  // =====================================================================
  const NOTE_SEMI = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const isDigit = (ch) => ch >= '0' && ch <= '9';

  function expandLoops(s, warn) {
    const re = /\[([^[\]]*)\](\d*)/;
    let guard = 0;
    while (s.indexOf('[') >= 0 && ++guard < 1000) {
      const m = re.exec(s);
      if (!m) { warn.push('unbalanced ['); s = s.replace(/[[\]]/g, ''); break; }
      const n = m[2] ? parseInt(m[2], 10) : 2;
      const cut = m[1].indexOf('|');
      const head = cut < 0 ? m[1] : m[1].slice(0, cut);
      const tail = cut < 0 ? '' : m[1].slice(cut + 1);
      let body = '';
      for (let k = 0; k < n; k++) body += head + (k < n - 1 ? tail : '');
      s = s.slice(0, m.index) + body + s.slice(m.index + m[0].length);
    }
    if (s.indexOf(']') >= 0) { warn.push('unbalanced ]'); s = s.replace(/\]/g, ''); }
    return s;
  }

  function parseMML(src, kind, bpm0, barTicks) {
    const warn = [];
    const s = expandLoops(String(src || '').replace(/\s+/g, ''), warn);
    const drum = kind === 'noise';
    const bar = barTicks || WHOLE;
    const ev = [];
    let i = 0, pos = 0, sec = 0, bars = 0;
    let oct = 4, dlen = TPQ, vol = 12, q = 7, duty = 1, env = kind === 'pulse' ? 1 : 0;
    let vib = 0, det = 0, tr = 0;
    let spt = 60 / ((bpm0 || 120) * TPQ);
    let last = null, lastRest = true, loopSec = null, loopTick = null;

    const int = (def) => {
      let j = i, sign = 1;
      if (s[j] === '-' || s[j] === '+') { sign = s[j] === '-' ? -1 : 1; j++; }
      let k = j;
      while (k < s.length && isDigit(s[k])) k++;
      if (k === j) return def;
      i = k;
      return sign * parseInt(s.slice(j, k), 10);
    };
    const length = () => {
      let k = i;
      while (k < s.length && isDigit(s[k])) k++;
      let t = dlen;
      if (k > i) {
        const n = parseInt(s.slice(i, k), 10);
        i = k;
        if (n > 0 && WHOLE % n === 0) t = WHOLE / n;
        else { warn.push('bad length ' + n); t = n > 0 ? Math.round(WHOLE / n) : dlen; }
      }
      let add = t;
      while (s[i] === '.') { add /= 2; t += add; i++; }
      if (t % 1) warn.push('fractional ticks near ' + i);
      return t;
    };
    const barCheck = () => {
      bars++;
      const r = pos % bar;
      if (r) warn.push(`bar ${bars}: off by ${r} ticks near "${s.slice(Math.max(0, i - 30), i)}"`);
    };

    while (i < s.length) {
      const ch = s[i++];
      if (NOTE_SEMI[ch] !== undefined) {
        let semi = NOTE_SEMI[ch];
        while (s[i] === '+' || s[i] === '#' || s[i] === '-') { semi += s[i] === '-' ? -1 : 1; i++; }
        const t = length(), d = t * spt;
        const m = drum ? ((semi % 12) + 12) % 12 : 12 * (oct + 1) + semi + tr;
        last = { t: sec, d, m, v: vol / 15, e: env, w: duty, q: q / 8, vib, det };
        ev.push(last);
        lastRest = false;
        pos += t; sec += d;
      } else if (ch === 'r') {
        const t = length();
        pos += t; sec += t * spt;
        lastRest = true;
      } else if (ch === '^') {
        while (s[i] === '/') { i++; barCheck(); }
        const t = length();
        if (last && !lastRest) last.d += t * spt;
        pos += t; sec += t * spt;
      } else if (ch === 'o') oct = int(oct);
      else if (ch === '>') oct++;
      else if (ch === '<') oct--;
      else if (ch === 'l') dlen = length();
      else if (ch === 'v') vol = clamp(int(vol), 0, 15);
      else if (ch === 'q') q = clamp(int(q), 1, 8);
      else if (ch === '@') duty = clamp(int(duty), 0, 3);
      else if (ch === 'E') env = clamp(int(env), 0, ENVS.length - 1);
      else if (ch === 'V') vib = clamp(int(vib), 0, VIB.length - 1);
      else if (ch === 'D') det = int(0);
      else if (ch === 'k') tr = int(0);
      else if (ch === 't') {
        let k = i;
        while (k < s.length && (isDigit(s[k]) || s[k] === '.')) k++;
        const b = parseFloat(s.slice(i, k));
        i = k;
        if (b > 0) spt = 60 / (b * TPQ); else warn.push('bad tempo');
      } else if (ch === 'L') {
        if (loopSec !== null) warn.push('duplicate L');
        loopSec = sec; loopTick = pos;
      } else if (ch === '/') barCheck();
      else warn.push(`unknown "${ch}" at ${i - 1}`);
    }
    return { ev, sec, ticks: pos, loopSec, loopTick, bars, warn };
  }

  // Compile a track definition: { tempo, bar?, loop?, kinds?, ch: [pulse1, pulse2, tri, noise] }
  function compileTrack(name, def) {
    const kinds = def.kinds || ['pulse', 'pulse', 'tri', 'noise'];
    const warn = [], chans = [];
    let len = 0, loopStart = null;
    def.ch.forEach((src, idx) => {
      if (!src) return;
      const kind = kinds[idx] || 'pulse';
      const r = parseMML(src, kind, def.tempo, def.bar);
      r.warn.forEach((w) => warn.push(`${name} ch${idx}: ${w}`));
      chans.push({ kind, ev: r.ev, len: r.sec, ticks: r.ticks, loopSec: r.loopSec, loopIdx: 0 });
      if (r.sec > len) len = r.sec;
      if (loopStart === null && r.loopSec !== null) loopStart = r.loopSec;
    });
    if (loopStart === null) loopStart = 0;
    const loopLen = len - loopStart;
    for (const ch of chans) ch.loopIdx = lowerBound(ch.ev, loopStart - 1e-6);
    return { name, loop: def.loop !== false && loopLen > 0.05, len, loopStart, loopLen, chans, warn };
  }

  function lowerBound(ev, t) {
    let lo = 0, hi = ev.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ev[mid].t < t) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  // =====================================================================
  // Player: schedules one compiled track into an AudioContext (live or offline)
  // =====================================================================
  class Player {
    constructor(c, kit, dest, trk, opts) {
      this.c = c;
      this.kit = kit;
      this.trk = trk;
      this.done = false;
      this.alive = new Set();
      this.out = c.createGain();
      this.out.connect(dest);
      const when = opts.when, pos = clamp(opts.pos || 0, 0, trk.len);
      this.basis = when - pos;
      if (opts.fadeIn) {
        this.out.gain.setValueAtTime(0, when);
        this.out.gain.linearRampToValueAtTime(1, when + opts.fadeIn);
      }
      this.st = trk.chans.map((ch) => ({ ch, idx: lowerBound(ch.ev, pos - 1e-6), off: 0, fin: false }));
      this.reg = (src, ...nodes) => {
        this.alive.add(src);
        src.onended = () => {
          this.alive.delete(src);
          try { src.disconnect(); for (const n of nodes) n.disconnect(); } catch (e) { /* ignore */ }
        };
      };
    }

    nextAt(s) {
      const ev = s.ch.ev;
      if (s.fin || !ev.length) return Infinity;
      if (s.idx < ev.length) return this.basis + s.off + ev[s.idx].t;
      if (!this.trk.loop || s.ch.loopIdx >= ev.length) return Infinity;
      return this.basis + s.off + this.trk.loopLen + ev[s.ch.loopIdx].t;
    }

    // Schedule every event that starts before `horizon`.
    pump(now, horizon) {
      if (this.done) return;
      let next = Infinity;
      for (const s of this.st) next = Math.min(next, this.nextAt(s));
      if (next < now - 0.12) this.basis += now - next + 0.03; // main thread stalled: shift, don't drop
      let active = false;
      for (const s of this.st) {
        const ev = s.ch.ev;
        if (s.fin || !ev.length) continue;
        for (;;) {
          if (s.idx >= ev.length) {
            if (!this.trk.loop || s.ch.loopIdx >= ev.length) { s.fin = true; break; }
            s.idx = s.ch.loopIdx;
            s.off += this.trk.loopLen;
          }
          const e = ev[s.idx], at = this.basis + s.off + e.t;
          if (at >= horizon) break;
          if (at > now - 0.03) this.note(s.ch.kind, e, Math.max(at, now));
          s.idx++;
        }
        if (!s.fin) active = true;
      }
      if (!active) this.done = true;
    }

    note(kind, e, at) {
      const c = this.c, k = this.kit;
      if (kind === 'noise') {
        const fn = DRUMS[e.m];
        if (fn) fn(c, k, this.out, at, e.v * LVL.drum, this.reg);
        return;
      }
      const tri = kind === 'tri';
      const w = tri ? k.w.tri : k.w[DUTY[e.w]];
      const gate = Math.max(0.025, e.d * e.q);
      const peak = e.v * (tri ? LVL.tri : LVL.pulse) * w.comp;
      playTone(c, w, this.out, mtof(e.m), at, gate, peak, ENVS[e.e], e.vib, e.det, this.reg);
    }

    // Song position (s) at audio time `now`, folded into the loop.
    position(now) {
      let p = now - this.basis;
      const t = this.trk;
      if (t.loop && p >= t.len) p = t.loopStart + ((p - t.loopStart) % t.loopLen);
      return clamp(p, 0, t.len);
    }

    stopAt(t) {
      this.done = true;
      for (const s of this.alive) { try { s.stop(t); } catch (e) { /* ignore */ } }
      const out = this.out;
      const ms = Math.max(0, (t - this.c.currentTime) * 1000) + 120;
      setTimeout(() => { try { out.disconnect(); } catch (e) { /* ignore */ } }, ms);
    }

    fadeOut(now, sec) {
      const g = this.out.gain;
      sec = Math.max(0.005, sec);
      try {
        g.cancelScheduledValues(now);
        g.setValueAtTime(g.value, now);
        g.linearRampToValueAtTime(0, now + sec);
      } catch (e) { /* ignore */ }
      this.stopAt(now + sec + 0.01);
    }
  }

  // =====================================================================
  // Sound effects
  // =====================================================================
  function sfxEnv(gp, t, v, d, o) {
    const a = Math.min(o.a || 0.002, d * 0.5);
    gp.setValueAtTime(0, t);
    gp.linearRampToValueAtTime(v, t + a);
    const kind = o.env || 'decay';
    if (kind === 'hold') {
      const r = Math.min(o.r || 0.015, d - a);
      gp.setValueAtTime(v, t + d - r);
      gp.linearRampToValueAtTime(0, t + d);
    } else if (kind === 'lin') {
      gp.linearRampToValueAtTime(0, t + d);
    } else {
      const tc = Math.max(0.002, (d - a) / 4), tEnd = Math.max(t + a, t + d - 0.004);
      gp.setTargetAtTime(0, t + a, tc);
      gp.setValueAtTime(v * Math.exp(-(tEnd - t - a) / tc), tEnd);
      gp.linearRampToValueAtTime(0, t + d);
    }
  }

  const SFX_COMP = { sine: 0.7, sawtooth: 0.8, triangle: 0.85 };

  // Tiny synth toolkit handed to every sfx definition.
  function makeFx(c, k, out, reg) {
    const fx = {
      // o: {w, f, f2, f3, sd, lin, d, v, a, r, env, det, vr, vd}
      tone(t, o) {
        const osc = c.createOscillator(), w = k.w[o.w || 'p50'];
        if (w) osc.setPeriodicWave(w.pw); else osc.type = o.w;
        const fp = osc.frequency;
        fp.setValueAtTime(o.f, t);
        if (o.f2) {
          const te = t + (o.sd || o.d);
          if (o.lin) fp.linearRampToValueAtTime(o.f2, te); else fp.exponentialRampToValueAtTime(o.f2, te);
          if (o.f3) fp.exponentialRampToValueAtTime(o.f3, t + o.d);
        }
        if (o.det) osc.detune.value = o.det;
        const g = c.createGain();
        const comp = w ? w.comp : SFX_COMP[o.w] || 0.7;
        sfxEnv(g.gain, t, (o.v == null ? 0.6 : o.v) * LVL.sfx * comp, o.d, o);
        osc.connect(g);
        g.connect(out);
        if (o.vr) {
          const lfo = c.createOscillator(), lg = c.createGain();
          lfo.frequency.value = o.vr;
          lg.gain.value = o.vd || 20;
          lfo.connect(lg);
          lg.connect(fp);
          lfo.start(t);
          lfo.stop(t + o.d + 0.02);
          reg(lfo, lg);
        }
        osc.start(t);
        osc.stop(t + o.d + 0.02);
        reg(osc, g);
        return t + o.d;
      },
      // o: {type, f, f2, f3, sd, q, rate, rate2, d, v, a, r, env}
      noise(t, o) {
        const src = c.createBufferSource();
        src.buffer = k.noise;
        src.loop = true;
        if (o.rate) {
          src.playbackRate.setValueAtTime(o.rate, t);
          if (o.rate2) src.playbackRate.exponentialRampToValueAtTime(o.rate2, t + o.d);
        }
        const f = c.createBiquadFilter();
        f.type = o.type || 'lowpass';
        f.frequency.setValueAtTime(o.f || 3000, t);
        if (o.f2) {
          f.frequency.exponentialRampToValueAtTime(o.f2, t + (o.sd || o.d));
          if (o.f3) f.frequency.exponentialRampToValueAtTime(o.f3, t + o.d);
        }
        f.Q.value = o.q == null ? 0.7 : o.q;
        const g = c.createGain();
        sfxEnv(g.gain, t, (o.v == null ? 0.6 : o.v) * LVL.sfx, o.d, o);
        src.connect(f);
        f.connect(g);
        g.connect(out);
        src.start(t, Math.random() * 0.5);
        src.stop(t + o.d + 0.02);
        reg(src, g, f);
        return t + o.d;
      },
      // Plays MIDI notes `ms` every `step` seconds with tone options `o`.
      seq(t, ms, step, o) {
        let end = t;
        ms.forEach((m, i) => {
          if (m == null) return;
          end = Math.max(end, fx.tone(t + i * step, Object.assign({}, o, { f: mtof(m) })));
        });
        return end;
      },
    };
    return fx;
  }

  let textFlip = false;

  // Each definition schedules its sound at time t and returns the end time.
  const SFX = {
    cursor: (x, t) => x.tone(t, { w: 'p50', f: 1760, d: 0.035, v: 0.3, env: 'hold', r: 0.01 }),
    confirm: (x, t) => {
      x.tone(t, { w: 'p50', f: 1046.5, d: 0.045, v: 0.32, env: 'hold' });
      return x.tone(t + 0.05, { w: 'p50', f: 1568, d: 0.1, v: 0.32 });
    },
    cancel: (x, t) => {
      x.tone(t, { w: 'p50', f: 784, d: 0.045, v: 0.32, env: 'hold' });
      return x.tone(t + 0.05, { w: 'p50', f: 523.3, d: 0.09, v: 0.32 });
    },
    buzz: (x, t) => {
      for (const o of [0, 0.11]) {
        x.tone(t + o, { w: 'p50', f: 110, d: 0.08, v: 0.36, env: 'hold' });
        x.tone(t + o, { w: 'p25', f: 116.5, d: 0.08, v: 0.3, env: 'hold' });
      }
      return t + 0.19;
    },
    text: (x, t) => {
      textFlip = !textFlip;
      return x.tone(t, { w: 'p25', f: textFlip ? 1480 : 1319, d: 0.016, v: 0.13, env: 'hold', r: 0.006 });
    },
    hit: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 5000, f2: 500, d: 0.13, v: 0.75 });
      return x.tone(t, { w: 'p50', f: 220, f2: 70, d: 0.1, v: 0.35 });
    },
    crit: (x, t) => {
      x.tone(t, { w: 'p25', f: 2637, d: 0.06, v: 0.3 });
      x.noise(t + 0.04, { type: 'lowpass', f: 7000, f2: 300, d: 0.3, v: 0.85 });
      x.tone(t + 0.04, { w: 'p50', f: 420, f2: 50, d: 0.26, v: 0.4 });
      return x.noise(t + 0.15, { type: 'lowpass', f: 3000, f2: 200, d: 0.22, v: 0.6 });
    },
    hurt: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 4000, f2: 500, d: 0.3, v: 0.85, rate: 0.6 });
      return x.tone(t, { w: 'p50', f: 180, f2: 60, d: 0.18, v: 0.3 });
    },
    miss: (x, t) => x.noise(t, { type: 'bandpass', f: 500, f2: 3500, f3: 900, sd: 0.1, q: 2.5, d: 0.24, v: 0.6, a: 0.05 }),
    enemyDie: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 2500, f2: 200, d: 0.45, v: 0.35, a: 0.02 });
      return x.tone(t, { w: 'p25', f: 1200, f2: 70, d: 0.45, v: 0.4, vr: 30, vd: 60 });
    },
    spell: (x, t) => {
      const up = [84, 88, 91, 96, 100, 103, 108];
      x.seq(t, up, 0.035, { w: 'p12', d: 0.09, v: 0.3 });
      x.seq(t + 0.07, up, 0.035, { w: 'p12', d: 0.09, v: 0.14 });
      return x.noise(t, { type: 'highpass', f: 8000, d: 0.36, v: 0.14, a: 0.1 });
    },
    fire: (x, t) => {
      x.noise(t, { type: 'bandpass', f: 400, f2: 2500, f3: 700, sd: 0.15, q: 1.2, d: 0.6, v: 0.85, a: 0.03 });
      x.tone(t, { w: 'p50', f: 110, f2: 55, d: 0.4, v: 0.16 });
      for (let i = 0; i < 6; i++) x.noise(t + 0.05 + Math.random() * 0.45, { type: 'highpass', f: 3000, d: 0.03, v: 0.4 });
      return t + 0.62;
    },
    ice: (x, t) => {
      x.noise(t, { type: 'highpass', f: 7000, d: 0.35, v: 0.22, a: 0.05 });
      return x.seq(t, [100, 96, 103, 98, 105], 0.06, { w: 'triangle', d: 0.18, v: 0.45 });
    },
    wind: (x, t) => {
      x.noise(t, { type: 'bandpass', f: 300, f2: 1800, f3: 500, sd: 0.35, q: 4, d: 0.8, v: 0.8, a: 0.15 });
      return x.noise(t + 0.1, { type: 'bandpass', f: 600, f2: 2400, f3: 800, sd: 0.3, q: 6, d: 0.7, v: 0.45, a: 0.12 });
    },
    heal: (x, t) => {
      const up = [72, 76, 79, 84, 88, 91];
      x.seq(t, up, 0.05, { w: 'p25', d: 0.12, v: 0.3 });
      x.seq(t + 0.09, up.map((m) => m + 12), 0.05, { w: 'p12', d: 0.1, v: 0.12 });
      return x.tone(t + 0.3, { w: 'p25', f: mtof(96), d: 0.35, v: 0.25 });
    },
    buff: (x, t) => {
      x.tone(t, { w: 'p25', f: 330, f2: 990, d: 0.18, v: 0.32, env: 'hold' });
      x.tone(t + 0.18, { w: 'p25', f: 440, f2: 1320, d: 0.2, v: 0.32, env: 'hold' });
      return x.tone(t + 0.38, { w: 'p25', f: 1320, d: 0.16, v: 0.25 });
    },
    debuff: (x, t) => {
      x.tone(t, { w: 'p25', f: 1100, f2: 280, d: 0.25, v: 0.32, vr: 18, vd: 40, env: 'hold' });
      return x.tone(t + 0.22, { w: 'p25', f: 900, f2: 200, d: 0.3, v: 0.3, vr: 18, vd: 30 });
    },
    sleep: (x, t) => x.seq(t, [79, 76, 72], 0.17, { w: 'triangle', d: 0.32, v: 0.55, vr: 5, vd: 6 }),
    poison: (x, t) => {
      [300, 240, 330, 200].forEach((f, i) => x.tone(t + i * 0.08, { w: 'p50', f, f2: f * 0.6, d: 0.07, v: 0.28 }));
      return x.noise(t, { type: 'lowpass', f: 800, d: 0.34, v: 0.18 });
    },
    stairs: (x, t) => {
      let end = t;
      [392, 330, 294, 247, 196].forEach((f, i) => {
        end = x.tone(t + i * 0.09, { w: 'triangle', f, f2: f * 0.7, d: 0.07, v: 0.6 });
      });
      return end;
    },
    door: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 1200, d: 0.05, v: 0.5 });
      x.tone(t + 0.01, { w: 'p50', f: 150, f2: 210, lin: true, d: 0.12, v: 0.18, env: 'hold' });
      return x.tone(t + 0.13, { w: 'triangle', f: 120, f2: 70, d: 0.1, v: 0.6 });
    },
    locked: (x, t) => {
      x.tone(t, { w: 'triangle', f: 110, f2: 55, d: 0.12, v: 0.7 });
      x.noise(t, { type: 'lowpass', f: 400, d: 0.1, v: 0.5 });
      x.noise(t + 0.07, { type: 'bandpass', f: 2500, d: 0.025, v: 0.3 });
      return x.noise(t + 0.12, { type: 'bandpass', f: 2200, d: 0.025, v: 0.25 });
    },
    chest: (x, t) => {
      x.tone(t, { w: 'p25', f: 180, f2: 240, lin: true, d: 0.1, v: 0.16, env: 'hold' });
      x.seq(t + 0.08, [67, 72, 76, 79], 0.05, { w: 'p25', d: 0.1, v: 0.3 });
      return x.tone(t + 0.28, { w: 'p25', f: mtof(84), d: 0.28, v: 0.28 });
    },
    bump: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 500, d: 0.04, v: 0.2 });
      return x.tone(t, { w: 'triangle', f: 95, f2: 55, d: 0.08, v: 0.38 });
    },
    run: (x, t) => {
      for (let i = 0; i < 7; i++) x.noise(t + i * 0.06, { type: 'bandpass', f: 1400, q: 1.5, d: 0.035, v: 0.5 - i * 0.04 });
      return x.noise(t + 0.4, { type: 'bandpass', f: 2000, f2: 600, d: 0.2, v: 0.3 });
    },
    encounter: (x, t) => {
      x.noise(t, { type: 'bandpass', f: 200, f2: 5000, q: 1.5, d: 0.5, v: 0.6, a: 0.3 });
      x.tone(t, { w: 'p12', f: 110, f2: 1760, d: 0.5, v: 0.25, a: 0.2 });
      return x.noise(t + 0.48, { type: 'highpass', f: 3000, d: 0.35, v: 0.45 });
    },
    explosion: (x, t) => {
      x.noise(t, { type: 'lowpass', f: 4000, f2: 120, d: 1.2, v: 0.9 });
      x.noise(t, { type: 'lowpass', f: 1500, f2: 100, d: 1.2, v: 0.7, rate: 0.35 });
      return x.tone(t, { w: 'sine', f: 110, f2: 30, d: 0.5, v: 0.9 });
    },
    warp: (x, t) => {
      x.tone(t, { w: 'p12', f: 200, f2: 1600, d: 0.6, v: 0.3, vr: 14, vd: 90, a: 0.05 });
      return x.tone(t + 0.05, { w: 'p25', f: 1600, f2: 200, d: 0.6, v: 0.2, vr: 11, vd: 70, a: 0.05 });
    },
    coin: (x, t) => {
      x.seq(t, [88, 92, 88, 92], 0.04, { w: 'p25', d: 0.036, v: 0.28, env: 'hold' });
      return x.tone(t + 0.16, { w: 'p25', f: mtof(96), d: 0.22, v: 0.28 });
    },
    step: (x, t) => x.noise(t, { type: 'lowpass', f: 900, d: 0.025, v: 0.14 }),
    swamp: (x, t) => {
      x.noise(t, { type: 'bandpass', f: 500, f2: 150, q: 2, d: 0.12, v: 0.5 });
      return x.tone(t, { w: 'p50', f: 140, f2: 70, d: 0.08, v: 0.18 });
    },
    equip: (x, t) => {
      x.noise(t, { type: 'highpass', f: 5000, d: 0.12, v: 0.35 });
      return x.seq(t, [100, 105], 0.025, { w: 'p12', d: 0.14, v: 0.26 });
    },
  };
  const SFX_GAP = { text: 30, step: 60, cursor: 25 }; // min ms between repeats (default 30)
  // Per-effect loudness trims (balanced against the music by offline measurement).
  const SFX_GAIN = {
    cursor: 3.4, confirm: 2.7, cancel: 2.4, buzz: 0.75, text: 2.5, hit: 2.5, crit: 1.2, hurt: 1.5,
    miss: 2.8, enemyDie: 1.9, spell: 1.1, fire: 0.95, ice: 0.8, wind: 1.7, heal: 1.15, buff: 1,
    debuff: 0.7, sleep: 0.7, poison: 1.6, stairs: 0.8, door: 0.8, locked: 2, chest: 1.25, bump: 1.75,
    run: 1.9, encounter: 0.9, explosion: 1.1, warp: 1.1, coin: 1.05, step: 5, swamp: 3.2, equip: 2.1,
  };

  // Schedules sfx `name` into context c at time `at`; returns the instance.
  function startSfx(c, k, dest, name, at) {
    const out = c.createGain();
    out.gain.value = SFX_GAIN[name] || 1;
    out.connect(dest);
    const srcs = new Set();
    const reg = (src, ...nodes) => {
      srcs.add(src);
      src.onended = () => {
        srcs.delete(src);
        try { src.disconnect(); for (const n of nodes) n.disconnect(); } catch (e) { /* ignore */ }
        if (!srcs.size) { try { out.disconnect(); } catch (e) { /* ignore */ } }
      };
    };
    const end = SFX[name](makeFx(c, k, out, reg), at) || at + 0.5;
    return { out, srcs, end };
  }

  // =====================================================================
  // Score - every track below is an original composition.
  // Channels: [pulse 1, pulse 2, triangle bass, noise drums]
  // =====================================================================
  const BGM = {};
  const JINGLES = {};

  // ---------------------------------------------------------------------
  // title - "Overture of the Dawn Crown": majestic brass march. B-flat major, 104 bpm, 2+24 bars.
  // Form: fanfare intro | A (theme) | A' (climb to D, full cadence) | B (sequence in A minor) -> A
  // ---------------------------------------------------------------------
  BGM.title = {
    tempo: 104,
    ch: [
      `k-2 o4 @1 v12 E1 V1 q7 l8
       g8. g16 >c8. c16 e4 g4 / f8. e16 d8. c16 d2 / L
       e4. f g2 / a4. g e2 / f4. g a4 >c4 / <b2 g2 /
       e4. f g2 / g+4. a b2 / >c4. <b a4 f4 / g1 /
       e4. f g2 / a4. g e2 / f4. g a4 >c4 / <b2 >d2 /
       <a2 >c4. <a / g2 e4. c / d4 e f g4 <b4 / >c2. r4 /
       a g a >c <b4 a4 / g f+ g b a4 g4 / f e f a g4 f4 / e2 g+2 /
       a g a >c <b4 a4 / a g a >d c4 <a4 / b-4. a g4 f4 / g2 d e f d /`,

      `k-2 o4 @2 v8 E1 q7 l8
       c8. c16 e8. e16 g4 >c4 / <a8. g16 f8. e16 f2 / L
       o5 c4. d e2 / e4. e c2 / c4. e f4 a4 / g2 d2 /
       c4. d e2 / e4. e g+2 / a4. g+ f4 c4 / d2 <b2 > /
       c4. d e2 / e4. e c2 / c4. e f4 a4 / g2 b2 /
       f2 a4. f / e2 c4. <g > / <b4 >c d d4 <g4 > / <g2. r4 > /
       @1 v7 E4 q8 o5 c1 / <b1 / a1 / g+1 / >c1 / d1 / d1 / <b2 >d2 /`,

      `k-2 o3 E0 q6 v15 l4
       c8. c16 c8. c16 c c / <g8. g16 g8. g16 g2 / L
       o2 c>c<g>g / o2 a>a<e>e / o2 f>f<c>c / o2 g>g<d>d /
       o2 c>c<g>g / o2 e>e<g+>g+ / o2 a>a<f>f / o2 g>g<gb /
       o2 c>c<g>g / o2 a>a<e>e / o2 f>f<c>c / o2 g>g<b>d /
       o2 f>f<a>c / o2 g>g<g>g / o2 g>d<gb / o3 c<g>c r /
       o2 a>e<a>e / o2 ebeb / o2 f>c<f>c / o2 ebeg+ /
       o2 a>e<a>e / o2 dada / o2 b->f<b->f / o2 g>d<gb /`,

      `v11 l8
       d8. d16 d8. d16 c4 c4 / d8. d16 d8. d16 d16d16d16d16 d16d16d16d16 / L
       [b4 d8. d16 c4 d4 / c4 d8. d16 c4 d4 / c4 d8. d16 c4 d4 / c4 d4 c4 d16d16d16d16 /
        c4 d8. d16 c4 d4 / c4 d8. d16 c4 d4 / c4 d8. d16 c4 d4 / c4 d4 c4 d16d16d16d16 /]2
       [cedecede / cedecede / cedecede / cede d16d16d16d16 d16d16d16d16 /]2`,
    ],
  };

  // ---------------------------------------------------------------------
  // castle - "Hall of the Silver Throne": stately sarabande (accent on beat 2),
  // harpsichord arpeggios and timpani. D major, 3/4, 100 bpm, 32 bars.
  // Form: A | A (flute third below) | B (dominant key) | A (final cadence)
  // ---------------------------------------------------------------------
  const CASTLE_A1 = 'e4 g4. f8 / e4 >c4. <b8 / a4 g4 f4 / d2. / e4 g4. f8 / e4 >c4. <b8 /';
  const CASTLE_ARP = 'o4 ceg ege / o4 cea eae / o4 cfa faf / o3 b>dg dgd / o4 ceg ege / o4 cea eae / o4 dfa fgf /';
  BGM.castle = {
    tempo: 100,
    bar: 144,
    ch: [
      `k2 o5 @1 v11 E6 V1 q7 l8 L
       ${CASTLE_A1} a4. g f4 / e2. /
       ${CASTLE_A1} a4. g f4 / e2. /
       b4 g4. a / >c4 <a4. b / a4 f+4 d4 / g2. /
       e4 f4 g4 / a4 b4 >c4 / <b4. a f+4 / g2 f4 /
       ${CASTLE_A1} a4 g f e d / c2. /`,

      `k2 @1 v7 E9 q6 l8 L
       ${CASTLE_ARP} o4 cege c4 /
       @2 v7 E6 q7 o5 c4 e4. d / c4 a4. g / f4 e4 d4 / <b2. > / c4 e4. d / c4 a4. g / f4. e d4 / c2. /
       @1 v7 E9 q6
       o3 b>eg ege / o4 cea eae / o4 df+a f+>c<f+ / o3 b>dg dgd /
       o4 ceg ege / o4 cea eae / o4 df+a f+>c<f+ / o3 b>df dgd /
       ${CASTLE_ARP} o4 cege c4 /`,

      `k2 E0 q7 v14 l4 L
       [o3 c2 <g / o2 a2 >e / o2 f2 >c / o2 g2 >d / o3 c2 <g / o2 a2 >e / o2 d2 g / o3 c2 <g /]2
       o2 e2 b / o2 a2 >e / o2 d2 a / o2 g2 >d / o3 c2 <g / o2 a2 >e / o2 d2 f+ / o2 g2 b /
       o3 c2 <g / o2 a2 >e / o2 f2 >c / o2 g2 >d / o3 c2 <g / o2 a2 >e / o2 d2 g / o3 c2. /`,

      `v10 l8 L
       [a+4 r4 r4 / r2. / a+4 r4 r4 / r4 r4 d+ d+ /]4
       [a+4 r2 / r2. / a+4 r4 a+4 / r4 d+ d+ d+ d+ /]2
       [a+4 r4 r4 / r2. / a+4 r4 r4 / r4 r4 d+ d+ /]2`,
    ],
  };

  // ---------------------------------------------------------------------
  // town - "Market Square": warm, lilting oom-pah with a syncopated tune.
  // F major, 116 bpm, 24 bars.  Form: A | A (horn counter-line) | B (subdominant bridge)
  // ---------------------------------------------------------------------
  BGM.town = {
    tempo: 116,
    ch: [
      `k-7 o5 @1 v12 E6 V1 q7 l8 L
       [cdeg^4ed / cdea^4ge / fefa^4gf / e4d4r4<g4> /
        cdeg^4ed / cdea^4>c<b / a4f4ed<b4> / c2.r4 /]2
       a4>c4<agf4 / g4e4c4e4 / f4a4fed4 / d2r4g4 /
       a4>c4<agf4 / g4e4>c4<ba / f+4a4d4f+4 / g4f4edc<b> /`,

      `k-7 o5 @2 v7 E3 q4 l8 L
       rergrerg / rerarera / rfrarfra / rdrfrdrf / rergrerg / rerarera / rfrardrf / rergrerg /
       @1 v8 E7 q8 o4 e2g2 / a2e2 / f2a2 / g2f2 / e2g2 / e2a2 / a2g2 / e2.r4 /
       @2 v7 E3 q4 o5 rfrarfra / rergrerg / rdrfrdrf / rdrgrdrg / rfrarfra / rergrera / rdrf+rdrf+ / rdrfrdrf /`,

      `k5 E0 q4 v15 l4 L
       [o3 c<g>c<g / o2 a>e<a>e / o2 f>c<f>c / o2 g>d<gb / o3 c<g>c<g / o2 a>e<a>e / o2 dagb / o3 c<g>c<g /]2
       o2 f>c<f>c / o2 e>c<eg / o2 dada / o2 g>d<g>d / o2 f>c<f>c / o2 eba>e / o2 daf+a / o2 g>d<gb /`,

      `v9 l8 L [cec+ecec+e / cec+ecec+e / cec+ecec+e / cec+e c c+16c+16 c+e /]6`,
    ],
  };

  // ---------------------------------------------------------------------
  // village - "Hearthsmoke": small folk tune in 6/8, whistle lead, bVII (mixolydian) cadences.
  // G major, 6/8 (dotted quarter = 66), 32 bars.  Form: A | A (whistle harmony) | B | B (octave up)
  // ---------------------------------------------------------------------
  const VILLAGE_A = 'cdeg4e / f4ag4e / dcde4c / d4.<g4.> / cdega16g16e / a4>c<a4f / f4d<b-4>d / c4.r4. /';
  const VILLAGE_B = 'e4aa4g / f4a>c4<a / g4ec4e / d4.d4e / f4ef4a / g4ec4e / f4d<b-4>d / c4.r4. /';
  BGM.village = {
    tempo: 99,
    bar: 144,
    ch: [
      `k-5 o5 @0 v11 E6 V2 q7 l8 L
       ${VILLAGE_A} ${VILLAGE_A} ${VILLAGE_B} @1 ${VILLAGE_B}`,

      `k-5 @1 v8 E9 q5 l8 L
       o4 regreg / rfarfa / regreg / rdgrdg / regreg / rfarfa / rdfrdf / regreg /
       @0 v7 E6 q8 o4 e4.g4. / a4.g4. / g4.e4. / d4.<b4.> / e4.g4. / a4.f4. / f4.d4. / e4.r4. /
       @1 v8 E9 q5
       [o4 rearea / rfarfa / regreg / rdgrdg / rfarfa / regreg / rdfrdf / regreg /]2`,

      `k-5 o3 E0 q6 v14 l8 L
       [c4.g4. / f4.c4. / c4.g4. / g4.d4. / c4.g4. / f4.c4. / b-4.f4. / c4.g4. /]2
       [a4.e4. / f4.c4. / c4.g4. / g4.d4. / f4.c4. / c4.g4. / b-4.f4. / c4.g4. /]2`,

      `v6 l8 L [grf+d+rf+ / grf+d+rf+ / grf+d+rf+ / grf+d+f+f+ /]8`,
    ],
  };

  // ---------------------------------------------------------------------
  // tavern - "The Tipsy Lantern": bouncy 12/8 shuffle with off-beat piano chops.
  // A major, 12/8 (dotted quarter = 120), 24 bars.  Form: A | A (fiddle thirds) | B
  // ---------------------------------------------------------------------
  BGM.tavern = {
    tempo: 180,
    bar: 288,
    ch: [
      `k-3 o5 @2 v11 E8 q7 l8 L
       [e4eg4ec4eg4. / a4a>c4<af4a>c4.< / g4ge4gf4ed4c / d4.<g4.>d4ef4d /
        e4eg4ec4eg4. / a4a>c4<af4a>c4.< / g4fe4df4ed4<b> / c4.<g4.>c4.r4. /]2
       e4aa4b>c4<ba4g / f4aa4gf4ed4f / g4bb4ag4fe4d / e4.c4.<g4.>c4. /
       e4aa4b>c4<ba4g / f4aa4gf4ed4f / g4fe4fg4ab4g / >c4.<g4.c4.r4. /`,

      `k-3 @1 v8 E3 q5 l8 L
       o4 r4er4gr4er4g / r4fr4ar4fr4a / r4er4gr4er4g / r4dr4fr4dr4f /
       r4er4gr4er4g / r4fr4ar4fr4a / r4dr4fr4dr4f / r4er4gr4er4g /
       @1 v7 E8 q7 o5 c4ce4c<g4>ce4. / f4fa4fc4fa4. / e4ec4ed4c<b4a> / <b4.d4.b4>cd4<b> /
       c4ce4c<g4>ce4. / f4fa4fc4fa4. / e4dc4<b>d4c<b4g> / <e4.e4.e4.r4.> /
       @1 v8 E3 q5 o4
       r4cr4er4cr4e / r4dr4fr4dr4a / r4dr4fr4dr4f / r4er4gr4er4g /
       r4cr4er4cr4e / r4dr4fr4dr4a / r4dr4fr4dr4f / r4er4gr4er4. /`,

      `k-3 E0 q5 v15 l8 L
       [o3 c4.<g4.>c4.<g4. / o3 f4.c4.f4.c4. / o3 c4.<g4.>c4.<g4. / o2 g4.>d4.<g4.b4. /
        o3 c4.<g4.>c4.<g4. / o3 f4.c4.f4.c4. / o2 g4.>d4.<g4.>f4. / o3 c4.<g4.>c4.r4. /]2
       o2 a4.>e4.<a4.>e4. / o2 d4.a4.d4.a4. / o2 g4.>d4.<g4.b4. / o3 c4.<g4.>c4.e4. /
       o2 a4.>e4.<a4.>e4. / o2 d4.a4.d4.a4. / o2 g4.>d4.<g4.b4. / o3 c4.<g4.>c4.r4. /`,

      `v9 l8 L [c4ed4ec4ed4e / c4ed4ec4ed4e / c4ed4ec4ed4e / c4ed4ec4eddd /]6`,
    ],
  };

  // ---------------------------------------------------------------------
  // field - "Wide Horizon": main overworld march. D major, 132 bpm, 2+32 bars.
  // Form: intro | A (theme) | B (lyrical, Am-F-Bb colours) | A | C (climb & run-up)
  // ---------------------------------------------------------------------
  const FIELD_A1 = 'c4 <g8 >c8 e4 g4 / a4. g8 f8 e8 f4 / e4 c8 e8 a4. g8 / f+4 e8 f+8 g2 /';
  const FIELD_A2 = 'c4 <g8 >c8 e4 g4 / a4. b8 >c4 <a4 / g4 f8 e8 d4 <b4 >/';
  BGM.field = {
    tempo: 132,
    ch: [
      `k2 o5 @1 v12 E1 V1 q7 l8
       r1 / r2 <g a b >d / L
       ${FIELD_A1} ${FIELD_A2} c2. r4 /
       e2 c d e4 / g2 e f+ g4 / a4. g f4 a4 / g2. e4 /
       f4. e d4 f4 / e4. d c4 e4 / d4 f4 b-4. a / g2 f4 d4 /
       ${FIELD_A1} ${FIELD_A2} c2 r e f g /
       >c4. <a f4 a4 / b4. g d4 g4 / g+4 b4 >d4 <b4 / >c2. <a4 /
       a4 >c4 <a4 f4 / b4 >d4 <b4 g4 / e4 g4 >c4 <a4 / g2 <g a b >d /`,

      `k2 o4 @0 v8 E9 q6 l8
       [r e]4 / [r d]2 [r f]2 / L
       cege cege / cfaf cfaf / cege ceae / df+af+ dgbg /
       cege cege / cfaf cfaf / cege dfgb / cege c4 r4 /
       @1 v7 E4 q8 o5 c1 / <b1 / >c1 / c1 / <a1 / a1 / b-1 / b2 >d2 /
       @0 v5 E1 q7 o5 r16 c4 <g8 >c8 e4 g4 a4. g8 f8 e8 f4 e4 c8 e8 a4. g8 f+4 e8 f+8 g2
       c4 <g8 >c8 e4 g4 a4. b8 >c4 <a4 g4 f8 e8 d4 <b4 >c2 r8 e8 f8 g16 /
       v8 E9 q6
       o4 a>cfc<a>cfc / o4 b>dgd<b>dgd / o4 g+b>d<bg+b>e<b / o4 a>cec<a>cec /
       o4 a>cfc<a>cfc / o4 b>dgd<b>dgd / o4 g>cec<a>cfc / o4 b>dfd<b>dfg /`,

      `k2 o3 E0 q6 l4 v15
       c <g >c <g / o2 g >d <g b / L
       o3 c<g>c<g / o3 fcfc / o3 c<gae / o2 df+gb /
       o3 c<g>c<g / o3 fcfa / o2 g>g<g>f / o3 c<g>c<g /
       o2 a>e<a>e / o2 ebeb / o2 f>c<f>c / o3 c<g>c<g /
       o2 dada / o2 a>e<a>e / o2 b->f<b->f / o2 g>d<gb /
       o3 c<g>c<g / o3 fcfc / o3 c<gae / o2 df+gb /
       o3 c<g>c<g / o3 fcfa / o2 g>g<g>f / o3 c<g>ce /
       o3 fcfc / o3 gdgd / o3 e<b>eg+ / o3 aeae /
       o3 fcfc / o3 gdgd / o3 cefa / o3 gd<gb /`,

      `v11 l8
       cedecede / cede d16d16d16d16 dd / L
       [cedecede / cedeccde / cedecede / cede d16d16d16d16 dd /]2
       [c4 ee d4 ee / c4 ee d4 ee / c4 ee d4 ee / cede d16d16d16d16 dd /]2
       [cedecede / cedeccde / cedecede / cede d16d16d16d16 dd /]2
       [bedecede / cedecede / cedeccde / cede d16d16d16d16 dd /]2`,
    ],
  };

  // ---------------------------------------------------------------------
  // night - "Starlit Road": the field theme recast in the minor, harp arpeggios.
  // A minor (Aeolian with a raised 4th colour), 88 bpm, 24 bars.
  // ---------------------------------------------------------------------
  const NIGHT_A = 'c4 <g8 >c8 e-4 g4 / a-4. g8 f8 e-8 f4 / e-4 c8 e-8 a-4. g8 / f+4 e-8 f+8 g2 /' +
    'c4 <g8 >c8 e-4 g4 / a-4. b-8 >c4 <a-4 / g4 f8 e-8 d4 <b4 > /';
  const NIGHT_ARP = '[o3 cg>e-<g]2 / [o3 f>ca-c]2 / o3 cg>e-<g o3 a->e->c<e- / o3 da>f+<a o3 g>db<g /' +
    '[o3 cg>e-<g]2 / [o3 f>ca-c]2 / o3 cg>e-<g o3 g>dfd / [o3 cg>e-<g]2 /';
  BGM.night = {
    tempo: 88,
    ch: [
      `k-3 o5 @0 v10 E6 V2 q8 L
       ${NIGHT_A} c2. r4 /
       c2. e-4 / <b-2. g4 / a-2 g4 f4 / g2. r4 /
       >c2. e-4 / g2. b-4 / a-4. g8 f4 d4 / c2. r4 /
       @2 v9 o4 ${NIGHT_A} c1 /`,

      `k-3 @0 v8 E2 q8 l8 L
       ${NIGHT_ARP}
       [o3 a->e->c<e-]2 / [o3 e-b->g<b-]2 / [o3 f>ca-c]2 / [o3 g>db<g]2 /
       [o3 a->e->c<e-]2 / [o3 e-b->g<b-]2 / o3 f>ca-c o3 g>dfd / [o3 cg>e-<g]2 /
       ${NIGHT_ARP}`,

      `k-3 o3 E0 q7 v13 l2 L
       c<g / >f c / c <a- / d g / >c<g / >f c / <g g / >c<g /
       a- e- / e- b- / f >c / <g d / a- e- / e- b- / f g / >c<g /
       >c<g / >f c / c <a- / d g / >c<g / >f c / <g g / >c1 /`,

      `v10 l4 L [r f+ r f+ /]23 r f+ r8 f+8 f+ /`,
    ],
  };

  // ---------------------------------------------------------------------
  // cave - "Where the Lamps Go Out": pedal-point bass ostinato with a falling inner line,
  // dripping bell notes and a slow hollow lead.  G minor (Phrygian touches), 76 bpm, 2+16 bars.
  // ---------------------------------------------------------------------
  const CAVE_AM = 'o2 a>a<a>g<a>f<a>e /', CAVE_F = 'o2 f>f<f>e<f>d<f>c /', CAVE_E = 'o2 e>e<e>d<e>c<eb /';
  const CAVE_DM = 'o2 d>d<d>c<d>f<da /', CAVE_BB = 'o2 b->b-<b->a<b->g<b->f /';
  const drip1 = (n) => `r4 ${n}16 r8. r2 /`;
  const drip2 = (n, m) => `r8. ${n}16 r4 ${m}16 r8. r4 /`;
  BGM.cave = {
    tempo: 76,
    ch: [
      `k-2 @2 v10 E7 V2 q8 l8
       r1 / r1 / L
       o5 e2. de / o5 c2<b4a4 / o5 c2.<b-a / o4 g+1 /
       o5 e2. fe / o5 a2g4e4 / o5 f2e4d4 / o5 e1 /
       o5 d2. ef / o5 a2f4d4 / o5 e2. dc / o4 a1 /
       o5 f2. ed / o5 d2f2 / o5 e2f2 / o4 g+1 /`,

      `k-2 @0 v9 E5 q8 l8
       ${drip1('o6e')} ${drip2('o5b', 'o6c')} L
       ${drip1('o6e')} ${drip2('o5b', 'o6c')} ${drip1('o6c')} ${drip2('o5g+', 'o6e')}
       ${drip1('o6e')} ${drip2('o5a', 'o6c')} ${drip1('o6f')} ${drip2('o5b', 'o6e')}
       ${drip1('o6d')} ${drip2('o5a', 'o6f')} ${drip1('o6e')} ${drip2('o5b', 'o6c')}
       ${drip1('o6d')} ${drip2('o5b-', 'o6f')} ${drip1('o5b')} ${drip2('o5g+', 'o6e')}`,

      `k-2 E0 q6 v13 l8
       ${CAVE_AM} ${CAVE_AM} L
       ${CAVE_AM} ${CAVE_AM} ${CAVE_F} ${CAVE_E} ${CAVE_AM} ${CAVE_AM} ${CAVE_F} ${CAVE_E}
       ${CAVE_DM} ${CAVE_DM} ${CAVE_AM} ${CAVE_AM} ${CAVE_BB} ${CAVE_BB} ${CAVE_E} ${CAVE_E}`,

      `v7 l8 g2r2 / r1 / L [g2r2 / r1 /]8`,
    ],
  };

  // ---------------------------------------------------------------------
  // tower - "The Stair Without End": Lydian harp arpeggios that climb a whole step
  // every 8 bars (C -> D -> E Lydian) under a floating lead.  3/4, 96 bpm, 24 bars.
  // ---------------------------------------------------------------------
  const TOWER_M = 'o5 g2. / f+2a4 / e2. / d4e4f+4 / e2c4 / d2f+4 / g+2. / a2f+4 /';
  const TOWER_ARP = 'o4 ceg b>eg / o4 cdf+ a>df+ / o4 ceg b>eg / o4 cdf+ a>df+ / o4 cea >cea /' +
    'o3 b>df+ b>df+ / o4 ceg+ >ceg+ / o4 df+a >df+a /';
  const TOWER_B = 'o3 c2. / c2. / c2. / c2. / o2 a2. / b2. / o3 c2. / d2. /';
  BGM.tower = {
    tempo: 96,
    bar: 144,
    ch: [
      `@0 v10 E4 V2 q8 l4 L k0 ${TOWER_M} k2 ${TOWER_M} k4 ${TOWER_M}`,
      `@0 v8 E2 q8 l8 L k0 ${TOWER_ARP} k2 ${TOWER_ARP} k4 ${TOWER_ARP}`,
      `E0 q8 v12 L k0 ${TOWER_B} k2 ${TOWER_B} k4 ${TOWER_B}`,
      `v5 L [a+2. / r2. / r2. / r2. /]6`,
    ],
  };

  // ---------------------------------------------------------------------
  // shrine - "Vigil of Still Water": slow hymn over organ pedal and bell arpeggios,
  // closing on a IV - iv - I "amen".  E-flat major, 66 bpm, 16 bars.
  // ---------------------------------------------------------------------
  BGM.shrine = {
    tempo: 66,
    ch: [
      `k3 o5 @1 v10 E4 V1 q8 l4 L
       e2g2 / a2.g / a2>c2< / g2d2 / e2g2 / b2g2 / a2gf / e1 /
       a2e2 / g2b2 / a2.f / g1 / f2a2 / e2c2 / a2a-2 / g1 /`,

      `k3 @0 v8 E5 q8 l8 L
       [o4 cg>e<g]2 / [o3 a>e>c<e]2 / [o3 f>cac]2 / [o3 g>dbd]2 /
       [o4 cg>e<g]2 / [o3 eb>g<b]2 / [o3 f>cac]2 / [o4 cg>e<g]2 /
       [o3 a>e>c<e]2 / [o3 eb>g<b]2 / [o3 f>cac]2 / [o4 cg>e<g]2 /
       [o3 da>f<a]2 / [o3 a>e>c<e]2 / o3 f>cac o3 f>ca-c / [o4 cg>e<g]2 /`,

      `k3 E0 q8 v12 l1 L
       o3 c / o2 a / f / g / o3 c / o2 e / f / o3 c / o2 a / e / f / o3 c / o2 d / a / f / o3 c /`,

      '',
    ],
  };

  // ---------------------------------------------------------------------
  // battle - "Steel on the Wind": driving 3+3+2 hook over octave-pumping bass,
  // 16th-note arpeggios.  E minor, 160 bpm, 2+32 bars.  Form: intro | A | B | A | C
  // ---------------------------------------------------------------------
  const BATTLE_A = 'o5 e4.a4.b4 / o6 c4.o5 b4.a4 / o5 b4.o6 d4.o5 g4 / o5 a2 r e f+ g+ /' +
    'o5 a4.o6 c4.e4 / o6 f4.e4.c4 / o6 d4.c4.o5 b4 / o5 g+2 r e f+ g+ /';
  const BATTLE_ARP = 'o4 [a>cec<]4 / o4 [fa>c<a]4 / o4 [gb>d<b]4 / o4 [a>cec<]4 /' +
    'o4 [a>cec<]4 / o4 [fa>c<a]4 / o4 [dfaf]2 [eg+bg+]2 / o4 [eg+bg+]4 /';
  const BATTLE_BA = 'o2 [a>a<]4 / o2 [f>f<]4 / o2 [g>g<]4 / o2 [a>a<]4 /' +
    'o2 [a>a<]4 / o2 [f>f<]4 / o2 [d>d<]2 [e>e<]2 / o2 [e>e<]4 /';
  const BATTLE_DR = 'cedeccde / cedeccde / cedeccde / cede d16d16d16d16 d16d16d /';
  BGM.battle = {
    tempo: 160,
    ch: [
      `k-5 @1 v12 E8 V1 q7 l8
       o4 arar>cr<br / o4 e16f16f+16g16 g+16a16a+16b16 >c16c+16d16d+16 e4 / L
       ${BATTLE_A}
       E1 o5 a2f4d4 / o5 e2c4o4a4 / o5 d2f4b-4 / o5 g+2.e4 /
       o5 a2o6 d4c4 / o5 b2a4e4 / o5 f4e4f4g4 / o5 g+2b2 /
       E8 ${BATTLE_A}
       o5 aarara>c<a / o5 bbrbrb>d<b / o5 g+g+rg+rg+bg+ / o5 aara>c4e4 /
       o5 ffrfrfaf / o5 ggrgrgbg / o5 b-b-rb->d4f4 / o5 g+2 r e f+ g+ /`,

      `k-5 @0 v7 E9 q6 l16
       o4 e8r8e8r8g8r8f+8r8 / o3 eff+g g+aa+b >cc+dd+ e4 / L
       ${BATTLE_ARP}
       @1 E3 l8 o4 rfrarfra / o4 rerarera / o4 rfrb-rfrb- / o4 rerg+rerg+ /
       o4 rfrarfra / o4 rerarera / o4 rfrb-rerg / o4 rerg+rerg+ /
       @0 E9 l16 ${BATTLE_ARP}
       o4 [fa>c<a]4 / o4 [gb>d<b]4 / o4 [eg+bg+]4 / o4 [a>cec<]4 /
       o4 [fa>c<a]4 / o4 [gb>d<b]4 / o4 [fb->d<b-]4 / o4 [eg+bg+]4 /`,

      `k-5 E0 q6 v15 l8
       o2 arararar / o2 [e>e<]4 / L
       ${BATTLE_BA}
       o2 [d>d<]4 / o2 [a>a<]4 / o2 [b->b-<]4 / o2 [e>e<]4 /
       o2 [d>d<]4 / o2 [a>a<]4 / o2 b->b-<b->b- o3 c>c<c>c / o2 [e>e<]4 /
       ${BATTLE_BA}
       o2 [f>f<]4 / o2 [g>g<]4 / o2 [e>e<]4 / o2 [a>a<]4 /
       o2 [f>f<]4 / o2 [g>g<]4 / o2 [b->b-<]4 / o2 [e>e<]4 /`,

      `v11 l8
       crcrcrcr / d16d16d16d16 d16d16d16d16 d16d16d16d16 b4 / L
       [${BATTLE_DR}]2 [cedecede / cedecede / cedecede / cede d16d16d16d16 d16d16d /]2
       [${BATTLE_DR}]2 bedeccde / cedeccde / cedeccde / cede d16d16d16d16 d16d16d /
       bedeccde / cedeccde / cedeccde / cede d16d16d16d16 d16d16d /`,
    ],
  };

  // ---------------------------------------------------------------------
  // boss - "Crown of Cinders": relentless D-minor gallop with b2 (E-flat) bass stabs,
  // tritone tremolos and a soaring B section.  176 bpm, 2+32 bars.  Form: intro | A | B | A | C
  // ---------------------------------------------------------------------
  const BOSS_A = 'o5 ddrdfdag+ / o5 a4rab-ag+f / o5 ddrdfdb-a / o5 c+4e4g4b-4 /' +
    'o5 ddrdfdag+ / o5 a4rao6co5b-ag / o5 fedefgg+a / o5 arara4r4 /';
  const BOSS_TR = 'o4 [da]8 / o4 [da]8 / o4 [db-]8 / o4 [c+g]8 / o4 [da]8 / o4 [da]8 / o4 [db-]4[c+g]4 / o4 [c+g]8 /';
  const B_DM = 'o2 dd>d<de-d>d<d /', B_BB = 'o2 b-b->b-<b->c<b->b-<b- /', B_A7 = 'o2 aa>a<ab-a>a<a /';
  const B_GM = 'o2 gg>g<ga-g>g<g /', B_EB = 'o2 e-e->e-<e-ee->e-<e- /', B_GA = 'o2 gg>g<g aa>a<a /';
  const BOSS_BA = `${B_DM} ${B_DM} ${B_BB} ${B_A7} ${B_DM} ${B_DM} ${B_GA} ${B_A7}`;
  const BOSS_DR = 'bc16c16dccc16c16de / cc16c16dccc16c16de / cc16c16dccc16c16de / cc16c16dcd16d16d16d16 d16d16d /';
  BGM.boss = {
    tempo: 176,
    ch: [
      `@2 v12 E8 V1 q7 l8
       o4 d4r4d4r4 / o4 e-4r4d4r4 / L
       ${BOSS_A}
       E1 o4 g2b-2 / o4 a2g2 / o4 b-2o5 e-2 / o5 d2c2 / o5 d2f2 / o5 e-2d2 / o5 c+2e2 / o5 e4f4g4b-4 /
       E8 ${BOSS_A}
       o5 ggrgb-g>d<b- / o6 c4 o5 rb-agf+g / o5 ggrgb-g>e-<b- / o5 e4g4b-4o6c+4 /
       o5 ddrdfdag+ / o5 ffrfb-f>d<b- / o5 gfe-dc+def / o5 a2o6c+4e4 /`,

      `@0 v7 E9 q6 l16
       o3 d4r4d4r4 / o3 e-4r4d4r4 / L
       ${BOSS_TR}
       @1 E3 l8 o4 gb->d<b-gb->d<b- / o4 gb->d<b-gb->d<b- / o4 gb->e-<b-gb->e-<b- / o4 gb->e-<b-gb->e-<b- /
       o4 fb->d<b-fb->d<b- / o4 fb->d<b-fb->d<b- / o4 c+egb-c+egb- / o4 c+egb-c+egb- /
       @0 E9 l16 ${BOSS_TR}
       o4 [gb-]8 / o4 [gb-]8 / o4 [gb-]8 / o4 [c+g]8 / o4 [da]8 / o4 [db-]8 / o4 [db-]4[c+g]4 / o4 [c+g]8 /`,

      `E0 q6 v15 l8
       o2 [d>d<]4 / o2 [e->e-<]2 [d>d<]2 / L
       ${BOSS_BA}
       ${B_GM} ${B_GM} ${B_EB} ${B_EB} ${B_BB} ${B_BB} ${B_A7} ${B_A7}
       ${BOSS_BA}
       ${B_GM} ${B_GM} ${B_EB} ${B_A7} ${B_DM} ${B_BB} ${B_GA} ${B_A7}`,

      `v9 l8
       a+a+a+a+a+a+a+a+ / a+16a+16a+16a+16 a+16a+16a+16a+16 d16d16d16d16 b4 / L
       [${BOSS_DR}]8`,
    ],
  };

  // ---------------------------------------------------------------------
  // ending - "Lanterns on the Homeward Road": lyrical theme over a descending bass,
  // bittersweet minor iv and a bVI-bVII-I lift.  D major, 84 bpm, 24 bars.  Form: A | B | A'
  // ---------------------------------------------------------------------
  const END_A6 = 'o5 g2age4 / o5 d2edo4b4 / o5 c2dea4 / o5 g2.r4 / o5 a2b-af4 / o5 g2fec4 /';
  const END_ARP6 = 'o4 cg>ce o4 cg>ce / o3 b>dgb o3 b>dgb / o3 a>ea>c o3 a>ea>c / o3 g>egb o3 g>egb /' +
    'o3 f>cfa o3 f>cfa / o3 eg>ce o3 eg>ce /';
  const END_BASS6 = 'o3 c2<g2 / o2 b2>g2 / o2 a2>e2 / o2 g2>e2 / o2 f2>c2 / o2 e2>c2 /';
  BGM.ending = {
    tempo: 84,
    ch: [
      `k2 @1 v11 E7 V2 q8 l8 L
       ${END_A6} o5 d2efa4 / o5 g1 /
       o5 e2a4.g / o5 g2e4.d / o5 c2f4.e / o5 e2.r4 /
       o5 a-2g4.f / o5 e2g4.c / o5 e-2f2 / o5 g1 /
       ${END_A6} o5 d2efb4 / o6 c1 /`,

      `k2 @0 v8 E2 q8 l8 L
       ${END_ARP6} o3 da>cf o3 da>cf / o3 g>dgb o3 g>dgb /
       @1 v7 E7 o5 c1 / o4 b1 / a1 / g1 / o5 c1 / o4 g1 / o5 c2d2 / e1 /
       @0 v8 E2 ${END_ARP6} o3 da>cf o3 g>dfb / o4 cg>ce o4 cg>ce /`,

      `k2 E0 q8 v13 L
       ${END_BASS6} o2 d2a2 / o2 g2>d2 /
       o2 a2>e2 / o2 e2b2 / o2 f2>c2 / o3 c2<g2 / o2 f2>c2 / o2 e2>c2 / o2 a-2b-2 / o3 c2<g2 /
       ${END_BASS6} o2 d2g2 / o3 c2<g2 /`,

      `v7 l8 L [c2d+2 /]8 [c4f+f+d+4f+f+ /]8 b2d+2 / [c2d+2 /]6 a+4a+4a+2 /`,
    ],
  };

  // =====================================================================
  // Jingles (non-looping).  The BGM pauses while one plays.
  // =====================================================================
  // victory - bright rising fanfare that lands on a held tonic.  D major, 150 bpm, ~4.8 s.
  JINGLES.victory = {
    tempo: 150,
    loop: false,
    ch: [
      'k2 @1 v12 E1 V1 q7 l8 o5 ceg o6 c^8 o5 g o6 ce / o6 d4c o5 ab4g4 / o6 c o5 geg o6 c2 /',
      'k2 @2 v8 E1 q7 l8 o4 g>ceg^8eg>c / o5 a4afg4d4 / o5 eeceg2 /',
      'k2 E0 q6 v15 l8 o3 ccc4ccc4 / o2 f4f4g4g4 / o3 c<g>c<g>c2 /',
      'v11 l8 c4ddc4dd / c4ddc4d16d16d16d16 / b2r2 /',
    ],
  };

  // levelup - quick ascending flourish, rising sequence to the high tonic.  C major, 150 bpm, ~3.2 s.
  JINGLES.levelup = {
    tempo: 150,
    loop: false,
    ch: [
      '@1 v12 E1 q7 l8 o4 ceg>c<b>dg4 / o5 egfag>c4. /',
      '@2 v8 E1 q7 l8 o3 g>ceggb>d4 / o5 cedfeg4. /',
      'E0 q6 v15 l4 o3 cc<gg / o3 c<g>c.r8 /',
      'v11 l8 cedecedd / cedeb4.r /',
    ],
  };

  // inn - two-bar lullaby: a sleepy descent, then a sunrise arpeggio.  F major, 6/8, ~4.8 s.
  JINGLES.inn = {
    tempo: 75,
    bar: 144,
    loop: false,
    ch: [
      'k5 @0 v10 E6 V2 q8 l8 o5 e4dc4<g / o4 ceg>c4. /',
      'k5 @0 v6 E5 q8 l8 o4 g4.e4. / o3 g>ceg4. /',
      'k5 E0 q8 v12 o3 c4.<g4. / o3 c2. /',
      '',
    ],
  };

  // save - church chime: bell arpeggio over a plagal (I-IV-I) organ cadence.  E-flat, 100 bpm, ~3.6 s.
  JINGLES.save = {
    tempo: 100,
    loop: false,
    ch: [
      'k3 @0 v11 E5 q8 l8 o4 eg>cefag4 / >c2',
      'k3 @2 v7 E4 q8 o4 g2a4g4 / >e2',
      'k3 E0 q8 v12 o3 c2f4c4 / c2',
      '',
    ],
  };

  // item - key item: dotted heroic call rising to the high third.  B-flat major, 130 bpm, ~3.7 s.
  JINGLES.item = {
    tempo: 130,
    loop: false,
    ch: [
      'k-2 @1 v12 E1 V1 q7 o5 g4e8.g16>c4<b8.>d16 / c4.d8e2 /',
      'k-2 @2 v8 E1 q7 o5 e4c8.e16g4g8.b16 / a4.b8>c2 /',
      'k-2 E0 q6 v15 o3 c4c4<g4g4 / o2 f4.g8>c2 /',
      'v11 c8d16d16d8d8c8d16d16d8d8 / c4.d8b2 /',
    ],
  };

  // join - a bouncy "welcome aboard".  D major, 140 bpm, ~3.4 s.
  JINGLES.join = {
    tempo: 140,
    loop: false,
    ch: [
      'k2 @1 v11 E8 q7 l8 o5 cegefage / o5 dgb>dc4r4 /',
      'k2 @1 v6 E3 q5 l8 o4 rergrarg / o4 rbr>de4r4 /',
      'k2 E0 q6 v15 l4 o3 cefe / o2 gb>cr /',
      'v10 l8 cedecede / cedec4r4 /',
    ],
  };

  // gameover - chromatic lament (E, D#, D, C, B, A) slowing to a stop.  G minor, ~5.8 s.
  JINGLES.gameover = {
    tempo: 90,
    loop: false,
    ch: [
      'k-2 @2 v11 E7 V2 q8 o5 e2d+4d4 / t76 c4<b4a2 /',
      'k-2 @0 v7 E7 q8 o4 a2a4f4 / t76 e4d4c2 /',
      'k-2 E0 q8 v13 o2 a2b4>d4 / t76 <e4e4a2 /',
      'v8 r1 / t76 r2a+2 /',
    ],
  };

  // curse - ominous tritone fall over a sinking bass.  ~3.4 s.
  JINGLES.curse = {
    tempo: 70,
    loop: false,
    ch: [
      '@2 v10 E7 V3 q8 o4 b-4e4e-2 /',
      '@0 v7 E4 V3 q8 o5 e4<b-4a2 /',
      'E0 q8 v13 o2 e2e-2 /',
      'v9 a+4r4a+2 /',
    ],
  };

  // =====================================================================
  // Runtime state & public API
  // =====================================================================
  const has = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
  const nowMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const hidden = () => typeof document !== 'undefined' && document.visibilityState === 'hidden';

  let AC = null;
  try { AC = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) || null; } catch (e) { AC = null; }
  let ctx = null, kit = null, bus = null;
  let unlocked = false, muted = false, volume = DEFAULT_VOLUME;
  let bgmName = null;    // logical current BGM (what should be playing)
  let bgm = null;        // Player of the BGM that is actually running
  let jingle = null;     // { player, resolve, timer }
  let resumeInfo = null; // { name, pos } BGM paused by a jingle
  let timer = null, suspendTimer = null, lastResume = -1e9, listening = false, everRan = false;
  const sfxLive = [];
  const sfxLast = Object.create(null);
  const compiled = Object.create(null);
  const warned = Object.create(null);

  function track(name) {
    if (compiled[name]) return compiled[name];
    const def = has(BGM, name) ? BGM[name] : has(JINGLES, name) ? JINGLES[name] : null;
    return def ? (compiled[name] = compileTrack(name, def)) : null;
  }
  function warnOnce(kind, name) {
    const key = kind + ':' + name;
    if (warned[key]) return;
    warned[key] = true;
    try { console.warn(`Sound: unknown ${kind} "${name}"`); } catch (e) { /* ignore */ }
  }

  // music / jingle / sfx buses -> gentle low-pass -> master volume -> safety limiter -> out
  function buildBus(c, gain, noLimiter) {
    const master = c.createGain();
    master.gain.value = gain;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 12000;
    lp.Q.value = 0.5;
    const music = c.createGain(), jin = c.createGain(), fx = c.createGain();
    music.connect(lp);
    jin.connect(lp);
    fx.connect(lp);
    lp.connect(master);
    let tail = master;
    if (!noLimiter && c.createDynamicsCompressor) {
      // Only engages near full scale (loud sfx over music at high volume).
      const lim = c.createDynamicsCompressor();
      lim.threshold.value = -4;
      lim.knee.value = 4;
      lim.ratio.value = 12;
      lim.attack.value = 0.003;
      lim.release.value = 0.25;
      master.connect(lim);
      tail = lim;
    }
    tail.connect(c.destination);
    return { master, music, jingle: jin, fx };
  }

  const masterTarget = () => (muted ? 0 : volCurve(volume));
  function applyMaster() {
    if (!ctx) return;
    try { bus.master.gain.setTargetAtTime(masterTarget(), ctx.currentTime, 0.015); } catch (e) { /* ignore */ }
  }
  function resumeCtx() {
    if (!ctx || ctx.state === 'running' || ctx.state === 'closed') return;
    lastResume = nowMs();
    try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  }
  function suspendCtx() {
    if (!ctx || ctx.state !== 'running') return;
    try { const p = ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ }
  }
  // iOS: starting a (silent) buffer inside the gesture fully unlocks output.
  function primeSilence() {
    try {
      const s = ctx.createBufferSource();
      s.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      s.connect(ctx.destination);
      s.onended = () => { try { s.disconnect(); } catch (e) { /* ignore */ } };
      s.start(0);
    } catch (e) { /* ignore */ }
  }
  const audible = () => ctx && (ctx.state === 'running' || nowMs() - lastResume < 500);

  // Start the context from inside a user gesture.  While muted this is still done until the
  // context has run once, so that a later non-gesture resume() (e.g. unmuting from saved
  // settings) is allowed on iOS; onstatechange suspends it again right away.
  function kick() {
    if (!ctx || hidden() || ctx.state === 'running' || (muted && everRan)) return;
    resumeCtx();
    primeSilence();
  }
  // Re-try on later gestures: touch pointerdown is not an activation event on mobile, and
  // iOS may "interrupt" the context after a phone call or app switch.
  function onGesture() {
    if (unlocked) kick();
  }
  function listen() {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    const opt = { capture: true, passive: true };
    ['pointerup', 'touchend', 'mouseup', 'click', 'keydown'].forEach((type) => {
      try { window.addEventListener(type, onGesture, opt); } catch (e) { /* ignore */ }
    });
  }
  function onVisibility() {
    if (!ctx) return;
    if (hidden()) suspendCtx();
    else if (unlocked && !muted) resumeCtx();
  }
  try {
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') window.addEventListener('pageshow', onVisibility);
  } catch (e) { /* ignore */ }

  function disable() {
    AC = null;
    try { if (ctx && ctx.close) ctx.close(); } catch (e) { /* ignore */ }
    ctx = null; bgm = null; jingle = null;
  }

  function pumpAll() {
    if (!ctx) return;
    const now = ctx.currentTime, h = now + LOOKAHEAD;
    if (bgm) bgm.pump(now, h);
    if (jingle) jingle.player.pump(now, h);
  }
  function ensureTimer() {
    if (timer) return;
    timer = setInterval(() => {
      try {
        if (!ctx || (!bgm && !jingle)) { clearInterval(timer); timer = null; return; }
        pumpAll();
      } catch (e) { /* ignore */ }
    }, TICK_MS);
  }
  function startBGM(name, pos, fadeIn, delay) {
    const trk = track(name);
    if (!trk || !ctx) return;
    bgm = new Player(ctx, kit, bus.music, trk, { when: ctx.currentTime + (delay || 0.03), pos, fadeIn });
    ensureTimer();
    pumpAll();
  }

  function unlock() {
    try {
      if (!AC) return;
      if (!ctx) {
        try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
        kit = getKit(ctx);
        bus = buildBus(ctx, masterTarget());
        ctx.onstatechange = () => {
          if (!ctx || ctx.state !== 'running') return;
          everRan = true;
          if (muted || hidden()) suspendCtx();
        };
        listen();
      }
      unlocked = true;
      kick();
      if (bgmName && !bgm && !jingle) startBGM(bgmName, 0, 0);
    } catch (e) {
      disable();
    }
  }

  function playBGM(name) {
    try {
      if (!has(BGM, name)) { warnOnce('bgm', name); return; }
      if (name === bgmName) return;
      bgmName = name;
      resumeInfo = null;
      if (!ctx || !unlocked || jingle) return; // starts on unlock / after the jingle
      let delay = 0.03;
      if (bgm) {
        bgm.fadeOut(ctx.currentTime, SWITCH_FADE);
        bgm = null;
        delay = SWITCH_FADE * 0.7;
      }
      startBGM(name, 0, 0, delay);
    } catch (e) { /* never throw */ }
  }

  function stopBGM(fadeMs) {
    try {
      const ms = typeof fadeMs === 'number' && isFinite(fadeMs) ? Math.max(0, fadeMs) : 300;
      bgmName = null;
      resumeInfo = null;
      if (bgm && ctx) bgm.fadeOut(ctx.currentTime, ms / 1000);
      bgm = null;
    } catch (e) { /* never throw */ }
  }

  function playJingle(name) {
    try {
      if (!has(JINGLES, name)) { warnOnce('jingle', name); return Promise.resolve(); }
      if (!ctx || !unlocked || muted) return Promise.resolve();
      const trk = track(name);
      return new Promise((resolve) => {
        const now = ctx.currentTime;
        let delay = 0.02;
        if (jingle) { // cut the previous jingle short
          clearTimeout(jingle.timer);
          jingle.player.fadeOut(now, 0.03);
          jingle.resolve();
          jingle = null;
          delay = 0.05;
        }
        if (bgm) {
          resumeInfo = { name: bgmName, pos: bgm.position(now) };
          bgm.fadeOut(now, JINGLE_FADE);
          bgm = null;
          delay = JINGLE_FADE + 0.03;
        }
        const j = { player: new Player(ctx, kit, bus.jingle, trk, { when: now + delay }), resolve, timer: 0 };
        j.timer = setTimeout(() => finishJingle(j), (delay + trk.len) * 1000 + 20);
        jingle = j;
        ensureTimer();
        pumpAll();
      });
    } catch (e) {
      return Promise.resolve();
    }
  }

  function finishJingle(j) {
    if (jingle !== j) return;
    jingle = null;
    try { j.player.stopAt(ctx.currentTime + 1); } catch (e) { /* ignore */ }
    j.resolve();
    // Resume after the promise callbacks ran, so a playBGM()/stopBGM() made in
    // `.then()` wins over resuming the paused track.
    setTimeout(() => {
      try {
        if (jingle || bgm || !bgmName || !ctx) return;
        const pos = resumeInfo && resumeInfo.name === bgmName ? resumeInfo.pos : 0;
        resumeInfo = null;
        startBGM(bgmName, pos, pos > 0 ? RESUME_FADE : 0);
      } catch (e) { /* ignore */ }
    }, 0);
  }

  function sfx(name) {
    try {
      if (!has(SFX, name)) { warnOnce('sfx', name); return; }
      if (!ctx || !unlocked || muted || !audible()) return;
      const t = nowMs();
      if (sfxLast[name] !== undefined && t - sfxLast[name] < (SFX_GAP[name] || 30)) return;
      sfxLast[name] = t;
      const now = ctx.currentTime;
      for (let i = sfxLive.length - 1; i >= 0; i--) if (sfxLive[i].end < now) sfxLive.splice(i, 1);
      while (sfxLive.length >= MAX_SFX) {
        const old = sfxLive.shift();
        try {
          old.out.gain.setTargetAtTime(0, now, 0.006);
          old.srcs.forEach((s) => { try { s.stop(now + 0.04); } catch (e) { /* ignore */ } });
        } catch (e) { /* ignore */ }
      }
      sfxLive.push(startSfx(ctx, kit, bus.fx, name, now + 0.005));
    } catch (e) { /* never throw */ }
  }

  function setMuted(b) {
    try {
      muted = !!b;
      if (!ctx) return;
      applyMaster();
      clearTimeout(suspendTimer);
      if (muted) suspendTimer = setTimeout(() => { if (muted) suspendCtx(); }, 150);
      else if (unlocked && !hidden()) resumeCtx();
    } catch (e) { /* never throw */ }
  }

  function setVolume(v) {
    try {
      v = Number(v);
      if (!isFinite(v)) return;
      volume = clamp(v, 0, 1);
      applyMaster();
    } catch (e) { /* never throw */ }
  }

  const list = () => ({ bgm: Object.keys(BGM), jingles: Object.keys(JINGLES), sfx: Object.keys(SFX) });

  // ---------------------------------------------------------------- debug
  function renderOffline(kind, name, seconds, vol, opts) {
    return new Promise((resolve, reject) => {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      const sr = 44100, n = Math.ceil(sr * seconds);
      const oc = new OAC(1, n, sr);
      const k = getKit(oc);
      const b = buildBus(oc, volCurve(vol == null ? DEFAULT_VOLUME : vol), opts && opts.noLimiter);
      if (kind === 'sfx') {
        if (!has(SFX, name)) throw new Error('no sfx ' + name);
        startSfx(oc, k, b.fx, name, 0.01);
      } else {
        let t = typeof name === 'object' ? compileTrack('custom', name) : track(name);
        if (!t) throw new Error('no track ' + name);
        if (opts && opts.solo != null) t = Object.assign({}, t, { chans: [t.chans[opts.solo]] });
        new Player(oc, k, kind === 'jingle' ? b.jingle : b.music, t, { when: 0.01, pos: (opts && opts.pos) || 0 }).pump(0, seconds);
      }
      const done = (buf) => {
        const d = buf.getChannelData(0), W = 4410;
        let peak = 0, ss = 0, wss = 0, wn = 0, maxRms = 0;
        for (let i = 0; i < d.length; i++) {
          const x = d[i], a = x < 0 ? -x : x;
          if (a > peak) peak = a;
          ss += x * x; wss += x * x;
          if (++wn === W) { maxRms = Math.max(maxRms, Math.sqrt(wss / W)); wn = 0; wss = 0; }
        }
        const res = { peak, rms: Math.sqrt(ss / d.length), maxRms };
        if (opts && opts.pcm) {
          const i16 = new Int16Array(d.length);
          for (let i = 0; i < d.length; i++) i16[i] = clamp(Math.round(d[i] * 32767), -32768, 32767);
          let bin = '';
          const u8 = new Uint8Array(i16.buffer);
          for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
          res.pcm = btoa(bin);
        }
        resolve(res);
      };
      const r = oc.startRendering();
      if (r && r.then) r.then(done, reject); else oc.oncomplete = (e) => done(e.renderedBuffer);
    });
  }

  const _debug = {
    parse: (mml, kind, bpm, bar) => parseMML(mml, kind || 'pulse', bpm || 120, bar || WHOLE),
    compile: (name) => track(name),
    trackDurations(name) {
      const t = track(name);
      if (!t) return null;
      return {
        name, loop: t.loop, len: t.len, loopStart: t.loopStart,
        channels: t.chans.map((c) => c.len),
        ticks: t.chans.map((c) => c.ticks),
        loopPoints: t.chans.map((c) => c.loopSec),
        notes: t.chans.map((c) => c.ev.length),
        warnings: t.warn.slice(),
      };
    },
    render: renderOffline,
    state: () => ({
      available: !!AC, unlocked, muted, volume, ctxState: ctx ? ctx.state : null,
      bgm: bgmName, bgmRunning: !!bgm, jingle: !!jingle, sfxLive: sfxLive.length,
      bgmNodes: bgm ? bgm.alive.size : 0, timer: !!timer,
    }),
  };

  return {
    unlock,
    playBGM,
    stopBGM,
    currentBGM: () => bgmName,
    playJingle,
    sfx,
    setMuted,
    isMuted: () => muted,
    setVolume,
    getVolume: () => volume,
    list,
    _debug,
  };
})();
