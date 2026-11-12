// 第77回 A: まわりの 音（環境音）。音楽の 下に うすく ながす ループ（音の ファイルは つかわない）
//   waves（波）・wind（風）・market（市場の ざわめき）・fire（たき火）・cave_drip（洞窟の しずく）・rain（雨）
//   startAmbience(engine, dest, id) → { id, pump(until), stop(fade) }
//   ノードは つねに 10こ ほど ＋ ときどき 鳴る 小さな 音（しずく・パチパチ）

export const AMBIENCES = ['waves', 'wind', 'market', 'fire', 'cave_drip', 'rain'];

// 長めの ざあざあ（1びょうの くりかえしが 聞こえない ように 4びょう）
function longNoise(eng) {
  if (eng.ambNoise) return eng.ambNoise;
  const ctx = eng.ctx;
  const len = ctx.sampleRate * 4;
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = eng.rand() * 2 - 1;
  eng.ambNoise = b;
  return b;
}

export function startAmbience(eng, dest, id) {
  if (!AMBIENCES.includes(id)) return null;
  const ctx = eng.ctx;
  const t0 = ctx.currentTime;
  const R = eng.rand;
  const master = ctx.createGain();
  master.gain.setValueAtTime(0, t0);
  master.gain.setTargetAtTime(1, t0, 0.5);
  master.connect(dest);
  const srcs = [];
  const loop = (filters, level) => {
    const s = ctx.createBufferSource();
    s.buffer = longNoise(eng);
    s.loop = true;
    let head = s;
    for (const [type, f, q] of filters) {
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = f;
      fl.Q.value = q ?? 0.7;
      head.connect(fl);
      head = fl;
    }
    const g = ctx.createGain();
    g.gain.value = level;
    head.connect(g);
    g.connect(master);
    s.start(t0, R() * 3);
    srcs.push(s);
    return { s, g, filter: head === s ? null : head };
  };
  const lfo = (rate, depth, param) => {
    const o = ctx.createOscillator();
    o.frequency.value = rate;
    const g = ctx.createGain();
    g.gain.value = depth;
    o.connect(g);
    g.connect(param);
    o.start(t0);
    srcs.push(o);
  };
  // ときどき 鳴る 小さな 音
  const blip = (t, { type = 'sine', f0, f1, dec, vol, toRev = 0 }) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.6);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dec);
    o.connect(g);
    g.connect(master);
    if (toRev && eng.bus) {
      const s = ctx.createGain();
      s.gain.value = toRev;
      g.connect(s);
      s.connect(eng.bus.revIn);
    }
    o.start(t);
    o.stop(t + dec + 0.02);
  };
  const tick = (t, f, dec, vol) => {
    const s = ctx.createBufferSource();
    s.buffer = longNoise(eng);
    const fl = ctx.createBiquadFilter();
    fl.type = 'highpass';
    fl.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0005, t + dec);
    s.connect(fl);
    fl.connect(g);
    g.connect(master);
    s.start(t, R() * 3);
    s.stop(t + dec + 0.02);
  };
  let next = t0 + 0.3;
  let event = () => 1;
  let murmur = null;
  switch (id) {
    case 'waves': {
      const low = loop([['lowpass', 520, 0.5]], 0.09);
      const hiss = loop([['bandpass', 1900, 0.4]], 0.025);
      lfo(0.085, 0.075, low.g.gain);
      lfo(0.085, 0.022, hiss.g.gain);
      break;
    }
    case 'wind': {
      const w = loop([['bandpass', 520, 2.5]], 0.11);
      lfo(0.07, 320, w.filter.frequency);
      lfo(0.13, 0.08, w.g.gain);
      break;
    }
    case 'rain': {
      loop([['highpass', 1400], ['lowpass', 7000]], 0.045);
      event = (t) => {
        blip(t, { f0: 2200 + R() * 2400, f1: 1500, dec: 0.03, vol: 0.012 + R() * 0.012 });
        return 0.04 + R() * 0.09;
      };
      break;
    }
    case 'fire': {
      loop([['lowpass', 320]], 0.07);
      event = (t) => {
        tick(t, 2500 + R() * 3000, 0.008 + R() * 0.02, 0.04 + R() * 0.06);
        return 0.06 + R() * 0.35;
      };
      break;
    }
    case 'cave_drip': {
      loop([['lowpass', 160]], 0.06);
      event = (t) => {
        const f = 1100 + R() * 900;
        blip(t, { f0: f, f1: f * 0.62, dec: 0.16, vol: 0.05 + R() * 0.03, toRev: 0.9 });
        return 0.8 + R() * 2.2;
      };
      break;
    }
    case 'market': {
      murmur = loop([['bandpass', 650, 0.9]], 0.05);
      event = (t) => {
        // ざわざわ（大きさを ゆらす）と 話し声の ような 小さな 音・ときどき チリン
        murmur.g.gain.setTargetAtTime(0.03 + R() * 0.05, t, 0.06);
        if (R() < 0.6) {
          const f = 220 + R() * 260;
          blip(t + R() * 0.05, { type: 'triangle', f0: f, f1: f * (0.8 + R() * 0.4), dec: 0.08 + R() * 0.08, vol: 0.012 + R() * 0.01 });
        }
        if (R() < 0.03) blip(t, { f0: 2400 + R() * 600, f1: 2300, dec: 0.5, vol: 0.02 });
        return 0.12 + R() * 0.12;
      };
      break;
    }
    default: break;
  }
  return {
    id,
    pump(until) {
      let guard = 0;
      while (next < until && guard++ < 5000) {
        if (next < ctx.currentTime) next = ctx.currentTime + 0.02;
        next += event(next);
      }
    },
    stop(fade = 1.5) {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.setTargetAtTime(0, t, fade / 3);
      for (const s of srcs) { try { s.stop(t + fade * 1.5); } catch { /* */ } }
      setTimeout(() => { try { master.disconnect(); } catch { /* */ } }, fade * 1500 + 300);
      next = Infinity;
    },
  };
}
