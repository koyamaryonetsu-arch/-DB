#!/usr/bin/env node
// 第77回 A: 曲を 耳の かわりに はかる どうぐ（ヘッドレスの chromium の OfflineAudioContext で 書き出して 数字に する）
//
//   node tools/audio-render.mjs                       … ぜんぶの 曲を 前の音・新しい音で 書き出して 表に する（ふつう 30びょう。
//                                                      くりかえしの 1回目と 2回目を くらべる ため、短い 曲は 2回ぶん）
//   node tools/audio-render.mjs battle field          … えらんだ 曲だけ
//   node tools/audio-render.mjs --wav <dir> battle    … WAV も 書く（<id>-old.wav・<id>-new.wav）
//   node tools/audio-render.mjs --write-trim          … 新しい音の 音量を そろえる 表（public/js/client/audio-trim.js）を 書く
//   node tools/audio-render.mjs --nodes               … いちばん いそがしい 曲の 1びょうあたりの ノードの かず（きれい・かるい）
//   node tools/audio-render.mjs --calib               … 楽器ごとの 音量（1音）を 前の 波と くらべる
//   node tools/audio-render.mjs --adapt battle        … 場面で かわる 音楽を ためす（10びょうで ピンチ、20びょうで だん 1）
//   そのほか: --seconds 30  --quality light  --json <file>  --jobs 4  --raw（仕上げを 通さない）  --solo <n>（n ばんめの チャンネルだけ）
//
// はかる もの: peak（0.98 より 下）・RMS（dBFS）・明るさ（スペクトルの 重心 Hz）・音の 出だしの かず（1びょうあたり）・
//             左右の 広がり（side/mid）・くりかえしの 1回目と 2回目の にている 度合い（1 = まったく 同じ）
// 音が われる（peak ≥ 0.98）・音が ない（RMS < -50 dB）曲が あれば 1 で おわる
// ・public/ の ファイルを この どうぐの 中の 小さな サーバーで くばる（public/ には 何も おかない）
import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');
const PW = process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright/index.mjs';
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const MIME = { '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.html': 'text/html; charset=utf-8' };

function parseArgs(argv) {
  const a = { ids: [], seconds: 30, jobs: 4, quality: 'fine' };
  const flags = new Set(['write-trim', 'nodes', 'calib', 'adapt', 'no-trim', 'raw', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const s = argv[i];
    if (s.startsWith('--')) {
      const k = s.slice(2);
      if (flags.has(k)) a[k] = true;
      else a[k] = argv[++i];
    } else a.ids.push(s);
  }
  a.seconds = Number(a.seconds);
  a.jobs = Number(a.jobs);
  return a;
}

// ───────────── ブラウザの 中 ─────────────
const PAGE = `<!doctype html><meta charset="utf-8"><title>audio</title><script type="module">
import { _TRACKS } from '/js/client/audio.js';
import { MusicEngine, compileTrack, AdaptiveState } from '/js/client/music-engine.js';
import { INSTRUMENTS } from '/js/client/music-inst.js';
import { TRACK_TRIM } from '/js/client/audio-trim.js';

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar; im[i + k] += ai;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}

function analyze(buf, { start = 0.05, loop = 0 } = {}) {
  const sr = buf.sampleRate;
  const L = buf.getChannelData(0), R = buf.numberOfChannels > 1 ? buf.getChannelData(1) : L;
  const n = L.length;
  let peak = 0, sm = 0, ss = 0;
  const mono = new Float32Array(n);
  const s0 = Math.floor(start * sr);
  for (let i = 0; i < n; i++) {
    const l = L[i], r = R[i];
    const a = Math.max(Math.abs(l), Math.abs(r));
    if (a > peak) peak = a;
    const m = (l + r) / 2, s = (l - r) / 2;
    mono[i] = m;
    if (i >= s0) { sm += m * m; ss += s * s; }
  }
  const cnt = Math.max(1, n - s0);
  const rmsLin = Math.sqrt((sm + ss) / cnt);
  const rms = 20 * Math.log10(rmsLin + 1e-12);
  const width = Math.sqrt(ss / Math.max(1e-12, sm));
  // スペクトル（1024・ずらし 512）
  const N = 1024, H = 512;
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  const NB = 24;
  const edges = [];
  for (let b = 0; b <= NB; b++) edges.push(Math.min(N / 2, Math.max(1, Math.round(Math.pow(2, Math.log2(2) + (b / NB) * (Math.log2(N / 2) - 1))))));
  const frames = [];
  let cNum = 0, cDen = 0;
  const re = new Float32Array(N), im = new Float32Array(N);
  let prev = null;
  const flux = [];
  for (let off = s0; off + N <= n; off += H) {
    for (let i = 0; i < N; i++) { re[i] = mono[off + i] * win[i]; im[i] = 0; }
    fft(re, im);
    const mag = new Float32Array(N / 2);
    let e = 0, num = 0;
    for (let k = 1; k < N / 2; k++) {
      const m = Math.hypot(re[k], im[k]);
      mag[k] = m;
      e += m * m;
      num += m * m * (k * sr / N);
    }
    cNum += num; cDen += e;
    const bands = new Float32Array(NB);
    for (let b = 0; b < NB; b++) {
      let s = 0;
      for (let k = edges[b]; k < Math.max(edges[b] + 1, edges[b + 1]); k++) s += mag[k] * mag[k];
      bands[b] = Math.log10(s + 1e-9);
    }
    frames.push(bands);
    if (prev) {
      let f = 0;
      for (let b = 0; b < NB; b++) f += Math.max(0, bands[b] - prev[b]);
      flux.push(f);
    }
    prev = bands;
  }
  const centroid = cDen ? cNum / cDen : 0;
  // 出だし: 流れの 平均 ＋ ひろがりより 大きい 山（50ms より 近い ものは 1つ）
  let onsets = 0;
  if (flux.length) {
    const mean = flux.reduce((a, b) => a + b, 0) / flux.length;
    const sd = Math.sqrt(flux.reduce((a, b) => a + (b - mean) ** 2, 0) / flux.length);
    const thr = mean + 0.5 * sd;
    const gap = Math.ceil(0.05 * sr / H);
    let last = -1e9;
    for (let i = 1; i < flux.length - 1; i++) {
      if (flux[i] > thr && flux[i] >= flux[i - 1] && flux[i] >= flux[i + 1] && i - last >= gap) { onsets++; last = i; }
    }
  }
  const secs = cnt / sr;
  // くりかえしの 1回目と 2回目（ログの 帯の 強さの 相関）
  let sim = null;
  if (loop > 0) {
    const fpl = Math.floor(loop * sr / H);
    if (2 * fpl <= frames.length && fpl > 4) {
      const a = [], b = [];
      for (let i = 0; i < fpl; i++) for (let k = 0; k < NB; k++) { a.push(frames[i][k]); b.push(frames[i + fpl][k]); }
      const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length;
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < a.length; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
      sim = num / Math.sqrt(da * db + 1e-12);
    }
  }
  return { peak, rms, centroid, onsets: onsets / secs, width, sim, secs };
}

function toWav64(buf) {
  const ch = buf.numberOfChannels, n = buf.length;
  const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); data.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  data.setUint32(16, 16, true); data.setUint16(20, 1, true); data.setUint16(22, ch, true);
  data.setUint32(24, buf.sampleRate, true); data.setUint32(28, buf.sampleRate * ch * 2, true);
  data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true); w(36, 'data'); data.setUint32(40, n * ch * 2, true);
  const chs = [...Array(ch)].map((_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { data.setInt16(o, Math.max(-1, Math.min(1, chs[c][i])) * 32767, true); o += 2; }
  const bytes = new Uint8Array(data.buffer);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const NODE_MAKERS = ['createOscillator', 'createGain', 'createBiquadFilter', 'createBufferSource', 'createStereoPanner', 'createConvolver', 'createWaveShaper', 'createDynamicsCompressor', 'createPeriodicWave'];

window.loopSeconds = (id) => {
  const c = compileTrack(_TRACKS[id]);
  if (c.once) return 0;
  const steps = c.form.slice(c.loopFrom).reduce((a, nm) => a + c.segs[nm].steps, 0);
  return steps * 60 / c.bpm / 4;
};
window.introSeconds = (id) => {
  const c = compileTrack(_TRACKS[id]);
  return c.form.slice(0, c.loopFrom).reduce((a, nm) => a + c.segs[nm].steps, 0) * 60 / c.bpm / 4;
};
window.trackIds = () => Object.keys(_TRACKS);
window.isOnce = (id) => !!_TRACKS[id].once;

// script: [{ t, set: 'setPinch', arg }] … その 時間に 場面を かえる（ふだんの ゲームと 同じく 2びょう 先まで 予約）
window.renderTrack = async ({ id, mode, quality = 'fine', seconds, sr = 44100, wav = false, trims = true, script = [], raw = false, solo = null }) => {
  const ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
  let nodes = 0;
  for (const k of NODE_MAKERS) {
    const orig = ctx[k].bind(ctx);
    ctx[k] = (...a) => { nodes++; return orig(...a); };
  }
  const vol = ctx.createGain();
  vol.gain.value = 1;
  vol.connect(ctx.destination);
  const adaptive = new AdaptiveState();
  const eng = new MusicEngine(ctx, vol, { mode, quality, adaptive, trims: trims ? TRACK_TRIM : {}, seed: 77, offline: true });
  // raw: 仕上げ（コンプ・リミッター・残きょう）を 通さない（しらべる とき）
  if (raw) {
    const dummy = ctx.createGain();
    eng.bus = { input: vol, revIn: dummy, ambIn: vol, tension: ctx.createBiquadFilter(), setQuality() {} };
  }
  const base = nodes;
  // solo: その チャンネルだけ 鳴らす（ほかは v = 0。役わりは かわらない）
  const tr0 = _TRACKS[id];
  const tr = solo === null || !tr0.ch ? tr0 : { ...tr0, ch: tr0.ch.map((c, i) => (i === solo ? c : { ...c, v: 0 })) };
  eng.start(id, tr, 0.05);
  const AHEAD = 2;
  eng.pump(AHEAD);
  const steps = [...script].sort((a, b) => a.t - b.t);
  for (let T = 1; T < seconds; T += 1) {
    ctx.suspend(T).then(() => {
      try {
        for (const s of steps) if (s.t <= T && !s.done) { s.done = true; if (s.set === 'playAmbience') eng.playAmbience(s.arg); else adaptive[s.set](s.arg); }
        eng.pump(T + AHEAD);
      } catch (e) {
        console.error(String(e && e.stack || e));
      } finally {
        ctx.resume();
      }
    });
  }
  const buf = await ctx.startRendering();
  const res = analyze(buf, { start: 0.05, loop: window.loopSeconds(id) && window.introSeconds(id) === 0 ? window.loopSeconds(id) : 0 });
  res.nodesPerSec = (nodes - base) / seconds;
  if (wav) res.wav = toWav64(buf);
  return res;
};

// 1音の 音量（前の 波・楽器）
window.calib = async () => {
  const out = {};
  // sec … 書き出す 長さ。:short は 0.25びょうの 音（8分音符くらい）を 0.3びょうで はかる
  const one = async (fn, sec = 1.2) => {
    const ctx = new OfflineAudioContext(1, Math.round(44100 * sec), 44100);
    const eng = new MusicEngine(ctx, ctx.destination, { offline: true });
    fn(eng, ctx);
    const b = await ctx.startRendering();
    const d = b.getChannelData(0);
    let s = 0;
    for (let i = 0; i < d.length; i++) s += d[i] * d[i];
    return 20 * Math.log10(Math.sqrt(s / d.length) + 1e-12);
  };
  for (const w of ['pulse', 'square', 'triangle', 'sine', 'saw']) {
    out['old:' + w + ':A4'] = await one((e, c) => e.legacyNote(440, 0, 1, w, 0.1, c.destination));
    out['old:' + w + ':A2'] = await one((e, c) => e.legacyNote(110, 0, 1, w, 0.1, c.destination));
    out['old:' + w + ':short'] = await one((e, c) => e.legacyNote(440, 0, 0.25, w, 0.1, c.destination), 0.3);
  }
  for (const k of Object.keys(INSTRUMENTS)) {
    out[k + ':A4'] = await one((e, c) => e.voice(440, 0, 1, k, 0.1, c.destination, { legacyW: 'pulse' }));
    out[k + ':A2'] = await one((e, c) => e.voice(110, 0, 1, k, 0.1, c.destination, { legacyW: 'pulse' }));
    out[k + ':short'] = await one((e, c) => e.voice(440, 0, 0.25, k, 0.1, c.destination, { legacyW: 'pulse' }), 0.3);
  }
  for (const d of ['k', 's', 'h']) {
    out['old:drum:' + d] = await one((e, c) => e.legacyDrum(d, 0, 0.5, c.destination));
    out['new:drum:' + d] = await one((e, c) => e.drum(d, 0, 0.5, c.destination));
  }
  return out;
};
window.ready = true;
</script>`;

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer(async (req, res) => {
      const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (url === '/__audio.html') {
        res.writeHead(200, { 'content-type': MIME['.html'] });
        return res.end(PAGE);
      }
      const file = path.join(PUB, url);
      if (!file.startsWith(PUB) || !existsSync(file)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
      res.end(await readFile(file));
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

const f1 = (x, d = 1) => (x === null || x === undefined ? '  -  ' : x.toFixed(d));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(fileURLToPath(import.meta.url));
    return;
  }
  const { chromium } = await import(pathToFileURL(PW).href);
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/__audio.html`;
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-networking', '--disable-component-update'] });
  const pages = [];
  const nPages = Math.max(1, args.jobs);
  for (let i = 0; i < nPages; i++) {
    const p = await browser.newPage();
    p.on('pageerror', (e) => console.error('pageerror', e.message));
    p.on('console', (m) => { if (m.type() === 'error') console.error('console', m.text()); });
    await p.goto(base);
    await p.waitForFunction(() => window.ready === true);
    pages.push(p);
  }
  const page = pages[0];
  let exit = 0;
  try {
    if (args.calib) {
      const r = await page.evaluate(() => window.calib());
      for (const [k, v] of Object.entries(r)) console.log(k.padEnd(22), v.toFixed(1));
      return;
    }
    const all = await page.evaluate(() => window.trackIds());
    const ids = args.ids.length ? args.ids : all;
    for (const id of ids) if (!all.includes(id)) throw new Error(`曲が ない: ${id}`);
    const info = {};
    for (const id of all) info[id] = await page.evaluate((x) => ({ loop: window.loopSeconds(x), once: window.isOnce(x) }), id);
    const secsFor = (id) => {
      if (info[id].once) return 8;
      const L = info[id].loop;
      return Math.min(180, Math.max(args.seconds, 2 * L + 1.5));
    };

    if (args.nodes) {
      // いちばん いそがしい 曲: 新しい音（きれい）で 30びょう はかって 1びょうあたりの ノードが いちばん 多い 曲
      const loops = all.filter((id) => !info[id].once);
      const res = await pool(pages, loops, (p, id) => p.evaluate((o) => window.renderTrack(o), { id, mode: 'new', seconds: 20 }).then((r) => ({ id, n: r.nodesPerSec })));
      res.sort((a, b) => b.n - a.n);
      const top = res[0].id;
      console.log('1びょうあたりの ノード（新しい音・きれい）上位:', res.slice(0, 5).map((r) => `${r.id} ${r.n.toFixed(0)}`).join(' / '));
      for (const [mode, quality] of [['old', 'fine'], ['new', 'fine'], ['new', 'light']]) {
        const r = await page.evaluate((o) => window.renderTrack(o), { id: top, mode, quality, seconds: 30 });
        console.log(`${top} ${mode === 'old' ? '前の音' : '新しい音'}${mode === 'new' ? `（${quality === 'fine' ? 'きれい' : 'かるい'}）` : ''}: ${r.nodesPerSec.toFixed(0)} ノード/びょう  peak ${r.peak.toFixed(3)}`);
      }
      return;
    }

    if (args.adapt) {
      const id = ids[0] || 'battle';
      const script = [
        { t: 6, set: 'setIntensity', arg: 0.2 }, { t: 12, set: 'setIntensity', arg: 1 },
        { t: 16, set: 'setPinch', arg: true }, { t: 22, set: 'setPhase', arg: 1 },
        { t: 28, set: 'setTimeOfDay', arg: 'night' }, { t: 30, set: 'playAmbience', arg: 'waves' },
      ];
      const r = await page.evaluate((o) => window.renderTrack(o), { id, mode: 'new', seconds: 36, script, wav: !!args.wav });
      console.log(`${id} 場面で かわる: peak ${r.peak.toFixed(3)} RMS ${r.rms.toFixed(1)} dB 明るさ ${r.centroid.toFixed(0)} Hz`);
      if (args.wav) {
        await mkdir(args.wav, { recursive: true });
        await writeFile(path.join(args.wav, `${id}-adapt.wav`), Buffer.from(r.wav, 'base64'));
      }
      if (r.peak >= 0.98) exit = 1;
      return;
    }

    const wavIds = new Set(args.wav ? ids : []);
    const jobs = [];
    for (const id of ids) {
      for (const mode of ['old', 'new']) jobs.push({ id, mode, quality: args.quality, seconds: secsFor(id), wav: wavIds.has(id), trims: !args['no-trim'], raw: !!args.raw, solo: args.solo === undefined ? null : Number(args.solo) });
    }
    const t0 = Date.now();
    const results = await pool(pages, jobs, (p, j) => p.evaluate((o) => window.renderTrack(o), j).then((r) => ({ ...j, ...r })));
    const by = {};
    for (const r of results) (by[r.id] ||= {})[r.mode] = r;
    if (args.wav) {
      await mkdir(args.wav, { recursive: true });
      for (const r of results) if (r.wav) await writeFile(path.join(args.wav, `${r.id}-${r.mode}.wav`), Buffer.from(r.wav, 'base64'));
    }
    // 表
    console.log('曲'.padEnd(14), '| 前の音: peak  RMS   明るさ 出だし 広がり にてる | 新しい音: peak  RMS   明るさ 出だし 広がり にてる | ノード/s');
    const bad = [];
    for (const id of ids) {
      const o = by[id].old, n = by[id].new;
      const row = (x) => `${f1(x.peak, 3)} ${f1(x.rms).padStart(5)} ${f1(x.centroid, 0).padStart(5)} ${f1(x.onsets).padStart(5)} ${f1(x.width, 2).padStart(5)} ${f1(x.sim, 2).padStart(5)}`;
      console.log(id.padEnd(14), '|', row(o), ' |', row(n), ' |', n.nodesPerSec.toFixed(0).padStart(4));
      if (n.peak >= 0.98) bad.push(`${id}: 新しい音が われる（peak ${n.peak.toFixed(3)}）`);
      if (n.rms < -50) bad.push(`${id}: 新しい音が ない（RMS ${n.rms.toFixed(1)}）`);
      if (o.peak >= 0.98) console.log(`  （注意）${id}: 前の音の peak ${o.peak.toFixed(3)}（前の音は かえない）`);
    }
    const loops = ids.filter((id) => !info[id].once);
    const stat = (mode, k) => {
      const v = loops.map((id) => by[id][mode][k]).filter((x) => x !== null && x !== undefined).sort((a, b) => a - b);
      if (!v.length) return null;
      return { min: v[0], med: v[Math.floor(v.length / 2)], max: v[v.length - 1], mean: v.reduce((a, b) => a + b, 0) / v.length };
    };
    console.log('\nまとめ（くりかえす 曲）       前の音（最小 / 中央 / 最大）        新しい音（最小 / 中央 / 最大）');
    for (const [k, name, d] of [['peak', 'peak', 3], ['rms', 'RMS dB', 1], ['centroid', '明るさ Hz', 0], ['onsets', '出だし/s', 1], ['width', '広がり', 2], ['sim', '1回目と2回目', 3]]) {
      const a = stat('old', k), b = stat('new', k);
      const s = (x) => (x ? `${f1(x.min, d)} / ${f1(x.med, d)} / ${f1(x.max, d)}` : '-');
      console.log(name.padEnd(26), s(a).padEnd(34), s(b));
    }
    const nr = stat('new', 'rms');
    if (nr && loops.length > 1) {
      const out = loops.filter((id) => Math.abs(by[id].new.rms - nr.med) > 3);
      console.log(`新しい音の RMS: 中央 ${nr.med.toFixed(1)} dB から ±3 dB を 出る 曲 ${out.length}曲${out.length ? '（' + out.map((id) => `${id} ${by[id].new.rms.toFixed(1)}`).join(', ') + '）' : ''}`);
    }
    console.log(`かかった 時間 ${((Date.now() - t0) / 1000).toFixed(0)} びょう`);
    if (args.json) await writeFile(args.json, JSON.stringify(results.map(({ wav, ...r }) => r), null, 1));
    if (args['write-trim']) {
      // 目標: 前の音の くりかえす 曲の RMS の 中央（新しい音に かえても 音量が かわらない ように）
      const target = stat('old', 'rms')?.med ?? -19.6;
      const { TRACK_TRIM } = await import(pathToFileURL(path.join(PUB, 'js/client/audio-trim.js')).href + `?t=${Date.now()}`);
      const next = { ...TRACK_TRIM };
      for (const id of ids) {
        const cur = args['no-trim'] ? 0 : TRACK_TRIM[id] || 0;
        // ジングル（once）は 短くて 書き出しの 後ろが しずかなので、前の音の 同じ 曲と 同じ 大きさに する
        const want = info[id].once ? by[id].old.rms : target;
        const tr = Math.max(-12, Math.min(12, cur + (want - by[id].new.rms)));
        next[id] = Math.round(tr * 10) / 10;
      }
      const body = Object.keys(next).sort().map((k) => `  ${k}: ${next[k]},`).join('\n');
      await writeFile(path.join(PUB, 'js/client/audio-trim.js'), `// 第77回 A: 曲ごとの 音量の そろえ（dB。新しい音 だけ）。tools/audio-render.mjs --write-trim が 書く（手で なおさない）\n// 目標: 前の音の くりかえす 曲の RMS の 中央（${target.toFixed(1)} dBFS）。ジングルは 前の音の 同じ 曲と 同じ\nexport const TRACK_TRIM = {\n${body}\n};\n`);
      console.log(`audio-trim.js を 書いた（目標 ${target.toFixed(1)} dBFS）。もう一度 はかって たしかめる`);
    }
    if (bad.length) {
      console.log('\nだめ:\n' + bad.join('\n'));
      exit = 1;
    } else console.log('\nOK: 新しい音は どの 曲も われず、音が ある');
  } finally {
    await browser.close();
    srv.close();
  }
  process.exitCode = exit;
}

// ページを いくつか つかって 同時に
async function pool(pages, items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(pages.map(async (p) => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(p, items[i]);
    }
  }));
  return out;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
