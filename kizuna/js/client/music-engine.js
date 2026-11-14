// 第77回 A: 音楽の エンジン（Web Audio。どの BaseAudioContext でも 動く … AudioContext・OfflineAudioContext）
//
//   new MusicEngine(ctx, dest, { mode, quality, adaptive, trims })
//     mode    … 'new'（新しい音）・'old'（前の音。第76回までと まったく 同じ 鳴らし方 … LegacyPlayer）
//     quality … 'fine'（きれい）・'light'（かるい … 厚みの 重ねと 残きょうを 止める）
//   engine.start(id, track) / stop(fade) / pump(until) / done()
//   engine.playAmbience(id) / stopAmbience()
//
// 曲の データの 書き方・楽器・場面で かわる 音楽の つかい方は docs/plan-r77-audio.md（チーム B・C との やくそく）。
// このファイルは 画面（window）を さわらない。node の テストでも 読みこめる（AudioContext が なければ 何も 鳴らさない）。
import { INSTRUMENTS, defaultInstrument, ROLE_PAN, HARMONY_PANS, ROLE_SEND, DEFAULT_NIGHT, WAVE_LEVEL } from './music-inst.js?v=283f9a2c8227';
import { startAmbience } from './music-amb.js?v=283f9a2c8227';

export const NOTE_BASE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

export function freqOf(name) {
  const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const n = NOTE_BASE[m[1]] + (Number(m[2]) + 1) * 12;
  return 440 * Math.pow(2, (n - 69) / 12);
}

export const midiOf = (f) => 69 + 12 * Math.log2(f / 440);

// ───────────── 楽譜を 読む ─────────────
// 前の 読み方（第76回までと 同じ。前の音 で つかう）: 'C5:4 D5:2 r:2' → [{f, len}]
export function legacyParse(str) {
  return str.trim().split(/\s+/).map((tok) => {
    const [n, l] = tok.split(':');
    const len = Number(l || 4);
    if (n === 'r') return { f: 0, len };
    if (['k', 's', 'h'].includes(n)) return { drum: n, len };
    return { f: freqOf(n), len };
  });
}

// たいこの 名前（rim は R と 同じ）
export const DRUMS = ['k', 's', 'h', 'o', 'c', 'p', 't', 'th', 'tl', 'R'];
const DRUM_SET = new Set([...DRUMS, 'rim']);
const ACCENT = 1.35;
const GHOST = 0.5;

// 新しい 読み方（前の 書き方は 同じ 結果。ふえた 書き方:
//   C5:4!  アクセント（強く）   C5:4?  ゴースト（弱く）   C5:4~  タイ（次が 同じ 音なら つなぐ・ちがう 音なら レガート）
//   C5:4.  スタッカート（短く）  [C4 E4 G4]:8  和音   たいこ: k s h o（オープン） c（シンバル） p（クラップ） t th tl（タム） R（リム）
export function parseNotes(str) {
  const toks = String(str ?? '').trim().match(/\[[^\]]*\](?::\S*)?|\S+/g) || [];
  const out = [];
  let tiePrev = false;
  for (const tok of toks) {
    let name;
    let rest = '';
    if (tok[0] === '[') {
      const j = tok.indexOf(']');
      name = tok.slice(0, j + 1);
      rest = tok.slice(j + 1);
      if (rest[0] === ':') rest = rest.slice(1);
    } else {
      const k = tok.indexOf(':');
      if (k < 0) {
        const mm = /^(.*?)([!?~.]*)$/.exec(tok);
        name = mm[1];
        rest = mm[2];
      } else {
        name = tok.slice(0, k);
        rest = tok.slice(k + 1).split(':')[0];
      }
    }
    const mm = /^(.*?)([!?~.]*)$/.exec(rest);
    const len = Number(mm[1] || 4);
    const mods = mm[2];
    const ev = { len };
    if (name === 'r') ev.f = 0;
    else if (DRUM_SET.has(name)) ev.drum = name === 'rim' ? 'R' : name;
    else if (name[0] === '[') {
      const fs = name.slice(1, -1).trim().split(/\s+/).map(freqOf).filter((f) => f > 0);
      ev.f = fs[0] || 0;
      if (fs.length > 1) ev.fs = fs;
    } else ev.f = freqOf(name);
    if (mods.includes('!')) ev.acc = ACCENT;
    else if (mods.includes('?')) ev.acc = GHOST;
    if (mods.includes('.')) ev.stac = true;
    const tie = mods.includes('~');
    const prev = out[out.length - 1];
    if (tiePrev && prev) {
      if (!ev.drum && ev.f && samePitch(prev, ev)) {
        prev.len += ev.len;
        tiePrev = tie;
        continue;
      }
      prev.leg = true;
    }
    tiePrev = tie;
    out.push(ev);
  }
  if (tiePrev && out.length) out[out.length - 1].leg = true;
  return out;
}

function samePitch(a, b) {
  const fa = a.fs || [a.f];
  const fb = b.fs || [b.f];
  return fa.length === fb.length && fa.every((f, i) => Math.abs(f - fb[i]) < 0.01);
}

// ───────────── 曲を 組み立てる（形・役わり・楽器） ─────────────
// 古い 曲の ベースは 大きめ（三角波 0.22 前後）なので 少し 下げる（ほかの パートが 聞こえる ように）
const LEGACY_BASS = 0.8;
const ROLE_MIN_INTENSITY = { lead: 0, bass: 0, harmony: 0.3, drums: 0.55 };
export const DEFAULT_PHASES = [
  { transpose: 0, tempo: 1 },
  { transpose: 1, tempo: 1.06 },
  { transpose: 2, tempo: 1.12 },
  { transpose: 3, tempo: 1.16 },
];

const compiled = new WeakMap();

function partStats(events) {
  let w = 0;
  let sum = 0;
  let notes = 0;
  let lenSum = 0;
  for (const e of events) {
    if (e.drum || !e.f) continue;
    const m = midiOf(e.f);
    sum += m * e.len;
    w += e.len;
    notes++;
    lenSum += e.len;
  }
  return { avg: w ? sum / w : 0, avgLen: notes ? lenSum / notes : 0, notes };
}

// 1小節の 長さ（16分音符の かず）。bar が なければ たいこの キックの 場所から 4/4（16）か 6/8・3/4（12）かを きめる
function detectBar(tr, partsEvents, total) {
  if (tr.bar) return tr.bar;
  const di = partsEvents.findIndex((p) => p.drums);
  if (di >= 0) {
    const score = (B) => {
      let pos = 0;
      let hit = 0;
      let all = 0;
      for (const e of partsEvents[di].events) {
        if (e.drum === 'k') {
          all++;
          if (pos % B === 0) hit++;
        }
        pos += e.len;
      }
      return all ? hit / all : 0;
    };
    const s16 = score(16);
    const s12 = score(12);
    if (s12 > s16 + 0.15 && total % 12 === 0) return 12;
    return 16;
  }
  return total % 16 !== 0 && total % 12 === 0 ? 12 : 16;
}

// 曲の データ → エンジンが つかう 形（キャッシュ）。曲の データは かえない
export function compileTrack(tr) {
  if (compiled.has(tr)) return compiled.get(tr);
  let partDefs;
  let secSrc;
  let form;
  let loopFrom;
  if (tr.sections) {
    const names = Object.keys(tr.sections);
    const first = tr.sections[names[0]];
    const firstList = Array.isArray(first) ? first : first.ch;
    partDefs = (tr.parts || tr.ch || firstList.map((e) => (typeof e === 'string' ? {} : e))).map((c) => ({ ...c }));
    secSrc = {};
    for (const nm of names) {
      const s = tr.sections[nm];
      const list = Array.isArray(s) ? s : s.ch;
      secSrc[nm] = {
        bpm: Array.isArray(s) ? undefined : s.bpm,
        notes: partDefs.map((_, i) => {
          const e = list[i];
          if (e == null) return '';
          return typeof e === 'string' ? e : e.n || '';
        }),
      };
    }
    form = (tr.form || names).filter((n) => secSrc[n]);
    loopFrom = Math.max(0, Math.min(form.length - 1, tr.loopFrom ?? 0));
  } else {
    partDefs = tr.ch.map((c) => ({ ...c }));
    secSrc = { main: { notes: tr.ch.map((c) => c.n) } };
    form = ['main'];
    loopFrom = 0;
  }
  // 区切りごとに 読む
  const segs = {};
  for (const [nm, s] of Object.entries(secSrc)) {
    const parts = s.notes.map((n) => parseNotes(n));
    const steps = Math.max(1, ...parts.map((p) => p.reduce((a, e) => a + e.len, 0)));
    segs[nm] = { name: nm, bpm: s.bpm, steps, parts };
  }
  // 役わり（さいしょの 区切りで きめる）
  const firstSeg = segs[form[0]];
  const allEvents = partDefs.map((p, i) => Object.values(segs).flatMap((s) => s.parts[i]));
  const stats = allEvents.map((ev) => partStats(ev));
  const melodic = partDefs.map((p, i) => i).filter((i) => !partDefs[i].drums && stats[i].notes > 0);
  const roles = partDefs.map((p) => (p.drums ? 'drums' : p.role || null));
  let leadIdx = roles.findIndex((r) => r === 'lead');
  if (leadIdx < 0 && melodic.length) {
    leadIdx = melodic.find((i) => !roles[i]) ?? -1;
    if (leadIdx >= 0) roles[leadIdx] = 'lead';
  }
  if (!roles.includes('bass')) {
    const cand = melodic.filter((i) => !roles[i]).sort((a, b) => stats[a].avg - stats[b].avg)[0];
    if (cand !== undefined && stats[cand].avg < 57) roles[cand] = 'bass';
  }
  for (let i = 0; i < roles.length; i++) if (!roles[i]) roles[i] = 'harmony';
  let hi = 0;
  const bar = detectBar(tr, partDefs.map((p, i) => ({ drums: !!p.drums, events: firstSeg.parts[i] })), firstSeg.steps);
  const parts = partDefs.map((p, i) => {
    const role = roles[i];
    const st = stats[i];
    const style = st.avgLen >= 8 ? 'long' : st.avgLen <= 2.6 ? 'short' : 'mid';
    const high = st.avg >= 76;
    const inst = p.drums ? null : (INSTRUMENTS[p.i] ? p.i : defaultInstrument(p.w, role, { style, high }));
    let pan = p.pan;
    if (pan === undefined) pan = role === 'harmony' ? HARMONY_PANS[hi++ % HARMONY_PANS.length] : ROLE_PAN[role] ?? 0;
    const minI = p.minIntensity ?? (p.layer != null ? Math.min(1, p.layer * 0.25) : ROLE_MIN_INTENSITY[role] ?? 0);
    return {
      idx: i, drums: !!p.drums, w: p.w, inst, v: (p.v ?? 0.1) * (p.drums || !p.w ? 1 : (WAVE_LEVEL[p.w] ?? 1) * (role === 'bass' ? LEGACY_BASS : 1)), pan, role, style, high, avg: st.avg,
      minI, send: p.send ?? ROLE_SEND[role] ?? 1, oct: p.oct || 0,
    };
  });
  // 主音（ピンチの 重ねに つかう）: ベースの 長さで いちばん 多い 音
  const bassIdx = parts.findIndex((p) => p.role === 'bass');
  const pc = new Array(12).fill(0);
  for (const e of (bassIdx >= 0 ? allEvents[bassIdx] : allEvents[leadIdx] || [])) if (e.f) pc[Math.round(midiOf(e.f)) % 12] += e.len;
  const tonic = pc.indexOf(Math.max(...pc));
  const once = !!tr.once;
  const bpm = tr.bpm || 120;
  const c = {
    src: tr, bpm, once, bar, parts, segs, form, loopFrom, tonic,
    auto: tr.auto ?? (!tr.sections && !once),
    swing: Math.max(0, Math.min(0.3, tr.swing || 0)),
    reverb: tr.reverb ?? (once ? 0.3 : bpm >= 150 ? 0.16 : bpm < 96 ? 0.34 : 0.24),
    fill: tr.fill || 0,
    night: tr.night || DEFAULT_NIGHT,
    pinch: tr.pinch || null,
    phases: tr.phases || DEFAULT_PHASES,
    // 第80回: だんごとの 形（phases[n].form が ある だんは その 区切りの ならびを くりかえす。ない だんは 曲の form）
    phaseForms: (tr.phases || []).map((ph) => {
      const f = Array.isArray(ph?.form) ? ph.form.filter((n) => segs[n]) : null;
      return f && f.length ? { form: f, loopFrom: Math.max(0, Math.min(f.length - 1, ph.loopFrom ?? 0)) } : null;
    }),
    transpose: tr.transpose || 0,
    leadIdx: parts.findIndex((p) => p.role === 'lead'),
    drumIdx: parts.findIndex((p) => p.drums),
    expanded: new Map(),
  };
  compiled.set(tr, c);
  return c;
}

// 区切りの 次（form の 次。さいごまで 行ったら loopFrom へ もどって loop を 1つ ふやす。once の 曲は おわり）
//   f … 今 鳴らして いる 形（{ form, loopFrom }。ふだんは 曲の 形 c）
export function nextPos(c, pos, loop, f = c) {
  if (pos + 1 < f.form.length) return { pos: pos + 1, loop, ended: false };
  if (c.once) return { pos, loop, ended: true };
  return { pos: f.loopFrom, loop: loop + 1, ended: false };
}

// 第80回: その だんの 形（phases[n].form が なければ 曲の 形）。だんの 番号は phaseOf と 同じく さいごの だんで 止まる
export function formOfPhase(c, n) {
  const list = c.phaseForms || [];
  if (!list.length) return c;
  return list[Math.max(0, Math.min(list.length - 1, n))] || c;
}

// 曲の はじめから n こ 分の 区切りの ならび（[区切りの 名前, 何回目の くりかえし]）。テストと 書き出しの どうぐ用
export function formWalk(c, n) {
  const out = [];
  let pos = 0;
  let loop = 0;
  for (let i = 0; i < n; i++) {
    out.push([c.form[pos], loop]);
    const nx = nextPos(c, pos, loop);
    if (nx.ended) break;
    pos = nx.pos;
    loop = nx.loop;
  }
  return out;
}

// 拍の 強さ（小節の 頭を 少し 強く・うらを 少し 弱く）
export function beatAccent(step, bar) {
  if (step % bar === 0) return 1.12;
  if (bar % 2 === 0 && step % (bar / 2) === 0) return 1.05;
  if (step % 4 === 0) return 1;
  if (step % 2 === 0) return 0.94;
  return 0.88;
}

// フィルイン（小節の 後ろ 半分）。16 → 8つ、12 → 6つ
function fillPattern(win) {
  const pat = win >= 8 ? ['s', 's', 's', 's', 'th', 'th', 'tl', 'tl'] : ['s', 's', 'th', 'th', 'tl', 'tl'];
  const n = Math.min(pat.length, Math.floor(win));
  return pat.slice(0, n).map((d, i) => ({ drum: d, off: win - n + i, vel: 0.6 + 0.4 * (i / Math.max(1, n - 1)) }));
}

// 1回分（区切り × くりかえしの 何回目）を 小節ごとの 音の リストに。同じ 入力なら いつも 同じ 結果（キャッシュ）
//   variant … 自動アレンジの 何回目か（0〜3）。auto: false の 曲は いつも 0
//   item: { p, step, len, fs, vel, gate, leg, drum, inst, octShift }
export function expandPass(c, segName, variant = 0) {
  const key = `${segName}:${variant}`;
  if (c.expanded.has(key)) return c.expanded.get(key);
  const seg = c.segs[segName];
  const B = c.bar;
  const nBars = Math.ceil(seg.steps / B);
  const bars = Array.from({ length: nBars }, () => []);
  const v = c.auto ? variant % 4 : 0;
  const lead = c.leadIdx;
  const push = (it) => {
    const b = Math.min(nBars - 1, Math.floor(it.step / B));
    bars[b].push(it);
  };
  seg.parts.forEach((events, p) => {
    const part = c.parts[p];
    if (!part) return;
    let step = 0;
    for (const e of events) {
      const at = step;
      step += e.len;
      if (e.drum) {
        let d = e.drum;
        let vel = (e.acc ?? 1) * beatAccent(at, B);
        if (v === 2) {
          if (d === 's') d = 'R';
          if (d === 'h' || d === 'o') vel *= 0.7;
        }
        push({ p, step: at, len: e.len, drum: d, vel });
        if (v === 3 && d === 's') push({ p, step: at, len: e.len, drum: 'p', vel: vel * 0.55 });
        continue;
      }
      if (!e.f) continue;
      const fs = e.fs || [e.f];
      let vel = (e.acc ?? 1) * beatAccent(at, B);
      let gate = e.stac ? 0.45 : e.leg ? 1.02 : null;
      let inst = part.inst;
      // 2回目: ハーモニーの 楽器を かえる（はじく 音 → マリンバ など）
      if (v === 1 && part.role === 'harmony') inst = INSTRUMENTS[part.inst]?.alt || part.inst;
      if (v === 2) {
        if (part.role === 'harmony') vel *= 0.55;
        if (part.role === 'bass' && gate === null) gate = 0.6;
        if (p === lead) inst = INSTRUMENTS[part.inst]?.alt || part.inst;
      }
      push({ p, step: at, len: e.len, fs, vel, gate, leg: !!e.leg, inst });
      // 2回目・4回目: メロディに 1オクターブの 重ね（高い 曲は 下へ）
      if ((v === 1 || v === 3) && p === lead) {
        push({ p, step: at, len: e.len, fs, vel: vel * 0.4, gate, leg: !!e.leg, inst, octShift: part.avg >= 79 ? -12 : 12, layer: true });
      }
    }
  });
  // フィルイン・シンバル（たいこの パートが ある 曲だけ）
  if (c.drumIdx >= 0) {
    const fillBars = new Set();
    if (c.fill) for (let b = 0; b < nBars; b++) if ((b + 1) % c.fill === 0) fillBars.add(b);
    if (v === 1 || v === 3) fillBars.add(nBars - 1);
    for (const b of fillBars) {
      const bs = b * B;
      const bLen = Math.min(B, seg.steps - bs);
      const win = Math.floor(bLen / 2);
      const from = bs + bLen - win;
      bars[b] = bars[b].filter((it) => !(it.drum && it.step >= from));
      for (const f of fillPattern(win)) bars[b].push({ p: c.drumIdx, step: from + f.off, len: 1, drum: f.drum, vel: f.vel });
    }
    if (v === 1 || v === 3) bars[0].push({ p: c.drumIdx, step: 0, len: 4, drum: 'c', vel: 0.8 });
  }
  for (const list of bars) list.sort((a, b) => a.step - b.step || a.p - b.p);
  const res = { steps: seg.steps, bars, bpm: seg.bpm };
  c.expanded.set(key, res);
  return res;
}

// ───────────── 場面で かわる 音楽（チーム C の つかう ところ） ─────────────
// set〜 は「次の 小節の 頭」で 効く（latch）。強さは 曲ごとに おぼえる（戦いの あとに ダンジョンの 曲へ もどっても そのまま）
export class AdaptiveState {
  constructor() {
    this.want = { intensity: 1, pinch: false, phase: 0, tod: 'day' };
    this.cur = { ...this.want };
    this.byTrack = new Map();
    this.track = null;
  }

  setIntensity(x) {
    const v = Number(x);
    this.want.intensity = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
    if (this.track) this.byTrack.set(this.track, this.want.intensity);
  }

  setPinch(on) { this.want.pinch = !!on; }

  setPhase(n) {
    const v = Math.round(Number(n));
    this.want.phase = Number.isFinite(v) ? Math.max(0, Math.min(3, v)) : 0;
  }

  setTimeOfDay(tod) { this.want.tod = tod === 'night' ? 'night' : 'day'; }

  // 曲が かわった（ピンチ・だんは もとに。強さは その 曲で 前に きめた 値。昼夜は そのまま）
  onTrack(id) {
    this.track = id;
    this.want.pinch = false;
    this.want.phase = 0;
    this.want.intensity = this.byTrack.get(id) ?? 1;
    this.cur = { ...this.want };
  }

  latch() {
    this.cur = { ...this.want };
    return this.cur;
  }
}

// テンポを 1小節ごとに 目標へ 1/3 ずつ 近づける（ぴったりに なったら おわり）
export function nextTempo(cur, target) {
  const d = target - cur;
  if (Math.abs(d) < 0.004) return target;
  return cur + d / 3;
}

export function phaseOf(c, n) {
  const list = c.phases;
  return list[Math.max(0, Math.min(list.length - 1, n))] || { transpose: 0, tempo: 1 };
}

// スイング: 8分の うらを おくらせる（1拍 = 16分 4つ の 中で）
export function swingPos(x, s) {
  if (!s) return x;
  const beat = Math.floor(x / 4);
  const q = x - beat * 4;
  return beat * 4 + (q <= 2 ? q * (1 + s) : 2 + 2 * s + (q - 2) * (1 - s));
}

// ───────────── 音を 作る（ノード） ─────────────
const NATIVE = { sine: 'sine', triangle: 'triangle', sawtooth: 'sawtooth', square: 'square', pulse50: 'square' };
const WAVE_HARM = {
  soft: [1, 0.28, 0.1, 0.04],
  organ: [1, 0.7, 0.45, 0, 0.3, 0, 0, 0.22],
  warm: [1, 0.42, 0.22, 0.12, 0.07, 0.04, 0.02],
};

function legacyWaveType(w) {
  if (w === 'pulse') return 'pulse25';
  if (w === 'saw') return 'sawtooth';
  if (w === 'square') return 'pulse50';
  return w || 'pulse25';
}

// 小さな らんすう（同じ たねなら 同じ ならび。曲の くりかえしが 毎回 同じに 聞こえる ため・テストの ため）
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeImpulse(ctx, sec = 1.7, seed = 7) {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * sec);
  const buf = ctx.createBuffer(2, len, sr);
  const r = rng(seed);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const tt = i / sr;
      // 時間が たつほど こもる（高い 音から 消える）
      const k = 0.55 - 0.45 * Math.min(1, tt / sec);
      lp += k * ((r() * 2 - 1) - lp);
      const pre = tt < 0.012 ? tt / 0.012 : 1;
      d[i] = lp * Math.exp(-tt * 3.6) * pre;
    }
  }
  return buf;
}

function softClipCurve() {
  const n = 2048;
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    const a = Math.abs(x);
    // 0.6 までは そのまま、それより 上は なめらかに 0.97 へ
    const y = a <= 0.6 ? a : 0.6 + 0.37 * Math.tanh((a - 0.6) / 0.37);
    c[i] = Math.sign(x) * y;
  }
  return c;
}

// 音楽の 通り道（全部の 曲で 1つ）: 曲 → ピンチの 明るさ → コンプ → リミッター → やわらかい クリップ → dest
//                                    残きょう（1つの ConvolverNode）→ コンプ
export function createBus(ctx, dest, quality = 'fine') {
  const input = ctx.createGain();
  const tension = ctx.createBiquadFilter();
  tension.type = 'peaking';
  tension.frequency.value = 2800;
  tension.Q.value = 0.8;
  tension.gain.value = 0;
  // 明るさ（高い 音を 少し 前へ。ねむく ならない ように）
  const air = ctx.createBiquadFilter();
  air.type = 'highshelf';
  air.frequency.value = 4500;
  air.gain.value = 3;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 10;
  comp.ratio.value = 3;
  comp.attack.value = 0.006;
  comp.release.value = 0.22;
  const makeup = ctx.createGain();
  // コンプは 自動で 音を 大きく する ので、ここで もどす（前の音と だいたい 同じ 大きさに。曲ごとの そろえは audio-trim.js）
  makeup.gain.value = 0.55;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -5;
  lim.knee.value = 2;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.09;
  const clip = ctx.createWaveShaper();
  clip.curve = softClipCurve();
  input.connect(tension);
  tension.connect(air);
  air.connect(comp);
  comp.connect(makeup);
  makeup.connect(lim);
  lim.connect(clip);
  clip.connect(dest);
  const revIn = ctx.createGain();
  const revOut = ctx.createGain();
  revOut.gain.value = 0.85;
  let conv = null;
  const bus = {
    input, tension, comp, revIn, revOut, ambIn: ctx.createGain(),
    setQuality(q) {
      try { revIn.disconnect(); } catch { /* */ }
      if (q === 'light') return;
      if (!conv) {
        conv = ctx.createConvolver();
        conv.buffer = makeImpulse(ctx);
        conv.connect(revOut);
        revOut.connect(comp);
      }
      revIn.connect(conv);
    },
  };
  bus.ambIn.connect(comp);
  bus.setQuality(quality);
  return bus;
}

// ───────────── 新しい音の 曲 ─────────────
const DRUM_GAIN = 1;
// たいこごとの 大きさ（前の 音より 少し 大きく。--calib で はかった）
const DRUM_LEVEL = { k: 0.6, s: 0.45, h: 0.5, o: 0.45, c: 0.45, p: 0.5, t: 0.6, th: 0.6, tl: 0.6, R: 0.6 };

class NewPlayer {
  constructor(eng, id, tr, at) {
    this.eng = eng;
    this.ctx = eng.ctx;
    this.id = id;
    this.c = compileTrack(tr);
    this.pos = 0;
    this.loop = 0;
    this.bar = 0;
    this.t = at;
    this.tempo = 1;
    this.transpose = 0;
    this.ended = false;
    this.endT = Infinity;
    this.pinchStep = 0;
    const ctx = this.ctx;
    const trim = Math.pow(10, (eng.trims?.[id] || 0) / 20);
    this.out = ctx.createGain();
    this.out.gain.value = trim;
    this.out.connect(eng.bus.input);
    this.rev = ctx.createGain();
    this.rev.gain.value = trim;
    this.rev.connect(eng.bus.revIn);
    this.strips = this.c.parts.map((p) => this.strip(p.pan, this.c.reverb * p.send));
    this.on = this.c.parts.map(() => true);
    this.hat = this.strip(0.3, this.c.reverb * 0.3);
    this.hatOn = true;
    this.pinchStrip = null;
    this.night = false;
  }

  strip(pan, send) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    let pn = null;
    if (ctx.createStereoPanner) {
      pn = ctx.createStereoPanner();
      pn.pan.value = pan;
      g.connect(pn);
    }
    const tail = pn || g;
    const s = ctx.createGain();
    s.gain.value = send;
    tail.connect(this.out);
    tail.connect(s);
    s.connect(this.rev);
    return { g, pn, s, base: send };
  }

  stop(fade) {
    const t = this.ctx.currentTime;
    for (const n of [this.out, this.rev]) {
      try {
        n.gain.cancelScheduledValues(t);
        n.gain.setValueAtTime(n.gain.value, t);
        n.gain.setTargetAtTime(0, t, Math.max(0.01, fade / 3));
      } catch { /* */ }
    }
    const { out, rev } = this;
    setTimeout(() => { try { out.disconnect(); rev.disconnect(); } catch { /* */ } }, fade * 1000 + 300);
    this.ended = true;
    this.endT = 0;
  }

  done(now) { return this.ended && now > this.endT; }

  pump(until, now = -Infinity) {
    let guard = 0;
    while (!this.ended && this.t < until && guard++ < 512) this.stepBar(now);
  }

  stepBar(now) {
    const c = this.c;
    const st = this.eng.adaptive ? this.eng.adaptive.latch() : { intensity: 1, pinch: false, phase: 0, tod: 'day' };
    // だんで 形が かわる 曲（phases[n].form）: 次の 小節の 頭から その だんの 形の はじめへ
    const fm = formOfPhase(c, st.phase);
    if (fm !== (this.fm || c)) {
      this.fm = fm;
      this.pos = 0;
      this.loop = 0;
      this.bar = 0;
    }
    const segName = (this.fm || c).form[this.pos];
    const ex = expandPass(c, segName, this.loop);
    const B = c.bar;
    const bs = this.bar * B;
    const barSteps = Math.min(B, ex.steps - bs);
    const ph = phaseOf(c, st.phase);
    this.tempo = nextTempo(this.tempo, ph.tempo || 1);
    this.transpose = (ph.transpose || 0) + c.transpose;
    const bpm = (ex.bpm || c.bpm) * this.tempo;
    const spb = 60 / bpm / 4;
    const t0 = this.t;
    const barDur = swingPos(barSteps, c.swing) * spb;
    const light = this.eng.quality === 'light';
    // 強さ・夜・ピンチ（小節の 頭で なめらかに）
    const night = st.tod === 'night';
    c.parts.forEach((p, i) => {
      const on = st.intensity >= p.minI - 1e-9;
      const str = this.strips[i];
      if (on !== this.on[i]) {
        str.g.gain.setTargetAtTime(on ? 1 : 0, t0, 0.04);
        this.on[i] = on;
      }
      if (night !== this.night) str.s.gain.setTargetAtTime(str.base * (night ? 1.5 : 1) + (night ? 0.08 : 0), t0, 0.1);
    });
    // ハイハットも たいこと いっしょに（たいこの パートが 2つ ある 曲は、どちらかが 鳴って いれば 鳴らす）
    const hatOn = c.parts.some((p, i) => p.drums && this.on[i]);
    if (hatOn !== this.hatOn) {
      this.hat.g.gain.setTargetAtTime(hatOn ? 1 : 0, t0, 0.04);
      this.hatOn = hatOn;
    }
    this.night = night;
    this.eng.setTension(st.pinch, t0);
    const late = now > t0 + barDur;
    if (late) this.eng.lateBars++;
    else {
      const tmul = Math.pow(2, this.transpose / 12);
      for (const it of ex.bars[this.bar] || []) {
        const p = c.parts[it.p];
        if (!this.on[it.p]) continue;
        if (it.layer && st.intensity < 0.8) continue;
        const rel = it.step - bs;
        const ts = t0 + swingPos(rel, c.swing) * spb;
        if (ts < now) {
          this.eng.dropped++;
          continue;
        }
        const dur = (swingPos(rel + it.len, c.swing) - swingPos(rel, c.swing)) * spb;
        if (it.drum) {
          const dest = (it.drum === 'h' || it.drum === 'o') ? this.hat.g : this.strips[it.p].g;
          let vel = p.v * it.vel * DRUM_GAIN;
          if (night) vel *= 0.65;
          this.eng.drum(it.drum, ts, vel, dest);
          continue;
        }
        let inst = it.inst || p.inst;
        if (night) inst = nightInst(c, p, inst);
        const mul = tmul * Math.pow(2, ((p.oct || 0) * 12 + (it.octShift || 0)) / 12);
        const fs = it.fs;
        const vel = (p.v * it.vel) / Math.sqrt(fs.length);
        for (const f of fs.slice(0, 4)) {
          this.eng.voice(f * mul, ts, dur, inst, vel, this.strips[it.p].g, { gate: it.gate, leg: it.leg, light, night, legacyW: p.w });
        }
      }
      if (st.pinch) this.pinchBar(t0, barSteps, spb, tmul);
    }
    this.pinchStep += barSteps;
    this.t = t0 + barDur;
    this.bar++;
    if (bs + barSteps >= ex.steps) {
      this.bar = 0;
      const nx = nextPos(c, this.pos, this.loop, this.fm || c);
      this.pos = nx.pos;
      this.loop = nx.loop;
      if (nx.ended) {
        this.ended = true;
        this.endT = this.t;
      }
    }
  }

  // ピンチの 重ね: 高い 音で 主音と 半音上を 8分で きざむ（曲に pinch: { n, i, v } が あれば それを くりかえす）
  pinchBar(t0, steps, spb, tmul) {
    const c = this.c;
    if (!this.pinchStrip) this.pinchStrip = this.strip(0.38, c.reverb * 0.6);
    const g = this.pinchStrip.g;
    if (c.pinch?.n) {
      if (!this.pinchSeq) {
        let at = 0;
        const on = [];
        for (const e of parseNotes(c.pinch.n)) {
          if (e.f) on.push({ at, e });
          at += e.len;
        }
        this.pinchSeq = { on, total: at || 1 };
      }
      const { on, total } = this.pinchSeq;
      const a0 = this.pinchStep;
      for (let k = Math.floor(a0 / total); k * total < a0 + steps; k++) {
        for (const { at, e } of on) {
          const x = at + k * total;
          if (x < a0 || x >= a0 + steps) continue;
          for (const f of e.fs || [e.f]) {
            this.eng.voice(f * tmul, t0 + (x - a0) * spb, e.len * spb, c.pinch.i || 'chip_arp', (c.pinch.v || 0.035) * (e.acc ?? 1), g, { light: this.eng.quality === 'light' });
          }
        }
      }
      return;
    }
    const root = 72 + c.tonic + 12;
    for (let s = 0; s < steps; s += 2) {
      const m = root + (((this.pinchStep + s) / 2) % 2 ? 1 : 0);
      const f = 440 * Math.pow(2, (m - 69) / 12);
      this.eng.voice(f * tmul, t0 + s * spb, 2 * spb, 'chip_arp', 0.03 * (s % 4 === 0 ? 1.15 : 0.85), g, { light: true });
    }
  }
}

function nightInst(c, p, inst) {
  const m = c.night || {};
  if (m[p.idx] && INSTRUMENTS[m[p.idx]]) return m[p.idx];
  if (m[inst] && INSTRUMENTS[m[inst]]) return m[inst];
  if (m[p.role] && INSTRUMENTS[m[p.role]]) return m[p.role];
  return inst;
}

// ───────────── 前の音（第76回までの 鳴らし方を そのまま） ─────────────
const OLD_TOKEN = /^(r|[kshr]|[A-G][#b]?-?\d)(:\d+)?$/;
const LEGACY_DRUM = { k: 'k', s: 's', h: 'h', o: 'h', c: 'h', p: 's', R: 's', t: 'k', th: 'k', tl: 'k' };

// 前の音で 鳴らす チャンネル: tr.legacy（チーム B が 作りなおした 曲の 前の データ）→ tr.ch → 区切りを つなげた もの
export function legacyChannels(tr) {
  if (tr.legacy?.ch) return { bpm: tr.legacy.bpm || tr.bpm, ch: tr.legacy.ch };
  if (tr.ch) return { bpm: tr.bpm, ch: tr.ch };
  const c = compileTrack(tr);
  const ch = c.parts.map((p, i) => ({
    w: p.drums ? undefined : (p.w || 'square'),
    drums: p.drums || undefined,
    v: p.v,
    n: c.form.map((nm) => tr.sections[nm] && (Array.isArray(tr.sections[nm]) ? tr.sections[nm][i] : tr.sections[nm].ch[i])).map((e) => (typeof e === 'string' ? e : e?.n || '')).join(' '),
  }));
  return { bpm: tr.bpm, ch };
}

function legacySeq(str) {
  const toks = String(str || '').trim().split(/\s+/).filter(Boolean);
  if (toks.every((t) => OLD_TOKEN.test(t))) return legacyParse(str);
  // 新しい 書き方 → 前の 形へ（和音は 1音ずつ・ふえた たいこは k/s/h に）
  return parseNotes(str).flatMap((e) => {
    if (e.drum) return [{ drum: LEGACY_DRUM[e.drum] || 's', len: e.len }];
    if (e.fs) return e.fs.map((f, i) => ({ f, len: i === e.fs.length - 1 ? e.len : 0, hold: e.len }));
    return [{ f: e.f || 0, len: e.len }];
  });
}

class LegacyPlayer {
  constructor(eng, id, tr, at) {
    this.eng = eng;
    this.ctx = eng.ctx;
    this.id = id;
    const lc = legacyChannels(tr);
    const spb = 60 / lc.bpm / 4; // 16ぶおんぷ の びょう
    const out = this.ctx.createGain();
    out.gain.value = 1;
    out.connect(eng.dest);
    this.m = {
      id, tr, spb, out,
      chans: lc.ch.map((c) => ({ ...c, seq: legacySeq(c.n), i: 0, t: at })),
      once: !!tr.once,
    };
  }

  stop(fade) {
    const m = this.m;
    try {
      m.out.gain.setTargetAtTime(0, this.ctx.currentTime, fade / 3);
      setTimeout(() => m.out.disconnect(), fade * 1000 + 200);
    } catch { /* */ }
    this.stopped = true;
  }

  pump(until) {
    const m = this.m;
    if (this.stopped) return;
    for (const ch of m.chans) {
      while (ch.t < until) {
        if (ch.i >= ch.seq.length) {
          if (m.once) break;
          ch.i = 0;
        }
        const n = ch.seq[ch.i++];
        const dur = n.len * m.spb;
        // ドラムの パートの r は やすみ（音を 出さない）
        if (ch.drums) { if (n.drum) this.eng.legacyDrum(n.drum, ch.t, ch.v, m.out); }
        else if (n.f) this.eng.legacyNote(n.f, ch.t, n.hold ? n.hold * m.spb : dur, ch.w, ch.v, m.out);
        ch.t += dur;
      }
    }
  }

  done(now) {
    const m = this.m;
    if (this.stopped) return true;
    if (!m.once) return false;
    const allDone = m.chans.every((c) => c.i >= c.seq.length);
    return allDone && now > Math.max(...m.chans.map((c) => c.t));
  }
}

// ───────────── エンジン ─────────────
export class MusicEngine {
  // dest … 音量の ノード（GameAudio の musicGain）。trims … 曲ごとの 音量の そろえ（dB。新しい音だけ）
  constructor(ctx, dest, { mode = 'new', quality = 'fine', adaptive = null, trims = {}, seed = 1, offline = null } = {}) {
    this.ctx = ctx;
    // オフライン（書き出し）では「おくれ」を 見ない
    this.offline = offline ?? (typeof OfflineAudioContext !== 'undefined' && ctx instanceof OfflineAudioContext);
    this.lateBars = 0;
    this.dropped = 0;
    this.dest = dest;
    this.mode = mode === 'old' ? 'old' : 'new';
    this.quality = quality === 'light' ? 'light' : 'fine';
    this.adaptive = adaptive || new AdaptiveState();
    this.trims = trims;
    this.rand = rng(seed);
    this.player = null;
    this.amb = null;
    this.tensionOn = false;
    // 前の音の 波（第76回までと 同じ）
    const real = new Float32Array(32), imag = new Float32Array(32);
    for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * 0.25);
    this.pulseWave = ctx.createPeriodicWave(real, imag);
    const len = ctx.sampleRate;
    this.noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.waves = {};
    this.bus = null;
  }

  ensureBus() {
    if (!this.bus) this.bus = createBus(this.ctx, this.dest, this.quality);
    return this.bus;
  }

  wave(type) {
    if (this.waves[type]) return this.waves[type];
    const real = new Float32Array(32), imag = new Float32Array(32);
    if (type === 'pulse25' || type === 'pulse12') {
      const duty = type === 'pulse25' ? 0.25 : 0.125;
      for (let n = 1; n < 32; n++) imag[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    } else {
      (WAVE_HARM[type] || [1]).forEach((a, i) => { imag[i + 1] = a; });
    }
    this.waves[type] = this.ctx.createPeriodicWave(real, imag);
    return this.waves[type];
  }

  setOsc(o, type) {
    if (NATIVE[type]) o.type = NATIVE[type];
    else o.setPeriodicWave(this.wave(type));
  }

  setQuality(q) {
    this.quality = q === 'light' ? 'light' : 'fine';
    if (this.bus) this.bus.setQuality(this.quality);
  }

  start(id, tr, at = null) {
    this.stop(0.25);
    if (!tr) return;
    const t = at ?? this.ctx.currentTime + 0.08;
    this.adaptive.onTrack(id);
    if (this.mode === 'old') {
      this.player = new LegacyPlayer(this, id, tr, t);
    } else {
      this.ensureBus();
      this.player = new NewPlayer(this, id, tr, t);
    }
  }

  stop(fade = 0.25) {
    if (!this.player) return;
    const p = this.player;
    this.player = null;
    p.stop(fade);
    if (this.bus && this.tensionOn) this.setTension(false, this.ctx.currentTime);
  }

  // until まで 音を 予約する（ふだんは 今 ＋ 0.2びょう。オフラインで 書き出す ときは 曲の さいごまで）
  pump(until) {
    const now = this.ctx.currentTime;
    if (this.player) this.player.pump(until, this.offline ? -Infinity : now);
    if (this.amb) this.amb.pump(until);
  }

  done() { return !!this.player && this.player.done(this.ctx.currentTime); }

  setTension(on, t) {
    if (!this.bus || on === this.tensionOn) return;
    this.tensionOn = on;
    this.bus.tension.gain.setTargetAtTime(on ? 4.5 : 0, t, 0.08);
  }

  // ── 環境音（波・風・市場・たき火・洞窟の しずく・雨）──
  playAmbience(id) {
    if (this.amb?.id === id) return;
    this.stopAmbience();
    if (!id || this.mode === 'old') return;
    const bus = this.ensureBus();
    this.amb = startAmbience(this, bus.ambIn, id);
  }

  stopAmbience(fade = 1.5) {
    if (!this.amb) return;
    this.amb.stop(fade);
    this.amb = null;
  }

  // ── 1音（新しい音）──
  //   f … Hz、t … はじまり、dur … 長さ（秒）、inst … 楽器の 名前、vel … 音量、dest … チャンネルの ノード
  voice(f, t, dur, inst, vel, dest, { gate = null, leg = false, light = false, night = false, legacyW = null } = {}) {
    const ctx = this.ctx;
    const P = INSTRUMENTS[inst] || INSTRUMENTS.lead;
    // osc: 'auto' の 楽器（lead・pluck）は 古い 波を そのまま つかう。gain は pulse で はかった ので、
    // ほかの 波（square など 大きい 波）は その ぶん 小さく（v の WAVE_LEVEL と 二重に ならない ように）
    const norm = P.osc === 'auto' ? WAVE_LEVEL.pulse / (WAVE_LEVEL[legacyW || 'pulse'] ?? 1) : 1;
    const peak = vel * (P.gain ?? 1) * norm;
    if (!(peak > 0) || !(f > 0) || f > 12000) return;
    const a = Math.max(P.a, leg ? 0.02 : 0);
    let rel;
    if (P.ring) rel = t + Math.min(Math.max(dur, 0.12), P.d * 1.5);
    else rel = t + Math.max(a + 0.012, dur * (gate ?? P.gate ?? 0.92));
    const stopAt = rel + P.r * 2.6 + 0.02;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(peak * P.s, t + a, Math.max(0.005, P.d / 3));
    g.gain.setTargetAtTime(0, rel, Math.max(0.005, P.r / 3));
    const type = P.osc === 'auto' ? legacyWaveType(legacyW) : P.osc;
    const o = ctx.createOscillator();
    this.setOsc(o, type);
    o.frequency.value = f;
    let head = o;
    let filt = null;
    if (P.filter) {
      filt = ctx.createBiquadFilter();
      filt.type = P.filter.type || 'lowpass';
      filt.Q.value = P.filter.q ?? 0.7;
      const base = Math.min(16000, P.filter.f * Math.pow(f / 261.6, P.filter.key ?? 0) * (night ? 0.7 : 1));
      const top = Math.min(18000, base + (P.filter.env || 0));
      filt.frequency.setValueAtTime(top, t);
      filt.frequency.setTargetAtTime(base, t + a * 0.5, Math.max(0.01, (P.filter.decay || 0.2) / 3));
      o.connect(filt);
      head = filt;
    }
    head.connect(g);
    g.connect(dest);
    const oscs = [o];
    let o2 = null;
    let det2 = 0;
    if (P.fm) {
      const mod = ctx.createOscillator();
      mod.type = 'sine';
      mod.frequency.value = f * P.fm.ratio;
      const mg = ctx.createGain();
      const dev = P.fm.index * f * P.fm.ratio;
      mg.gain.setValueAtTime(dev, t);
      mg.gain.setTargetAtTime(dev * 0.12, t, Math.max(0.01, P.fm.decay / 3));
      mod.connect(mg);
      mg.connect(o.frequency);
      oscs.push(mod);
    } else if (P.osc2 && !(light && !P.osc2.oct)) {
      o2 = ctx.createOscillator();
      const t2 = P.osc2.type === 'auto' ? type : P.osc2.type;
      this.setOsc(o2, t2);
      o2.frequency.value = f * Math.pow(2, (P.osc2.oct || 0) / 12);
      det2 = P.osc2.detune || 0;
      o2.detune.value = det2;
      const mix = P.osc2.mix ?? 1;
      if (mix < 0.999) {
        const mg = ctx.createGain();
        mg.gain.value = mix;
        o2.connect(mg);
        mg.connect(filt || g);
      } else o2.connect(filt || g);
      oscs.push(o2);
    }
    // ビブラート（ノードを ふやさず detune の カーブで）
    if (P.vib && rel - t > P.vib.delay + 0.08) {
      const vs = t + P.vib.delay;
      const vd = stopAt - vs;
      const n = Math.max(8, Math.min(400, Math.ceil(vd * P.vib.rate * 8)));
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const tt = (i / (n - 1)) * vd;
        curve[i] = P.vib.depth * Math.sin(2 * Math.PI * P.vib.rate * tt) * Math.min(1, tt / 0.3);
      }
      try {
        o.detune.setValueCurveAtTime(curve, vs, vd);
        if (o2) o2.detune.setValueCurveAtTime(curve.map((x) => x + det2), vs, vd);
      } catch { /* */ }
    }
    for (const x of oscs) {
      // ずらした 重ね（ユニゾン）は 1/4 周期 おくらせて はじめる（短い 音で 2つが そろって 大きく なりすぎない ように）
      x.start(x === o2 && P.osc2.detune && !P.osc2.oct ? t + 0.25 / f : t);
      x.stop(stopAt);
    }
  }

  // ── たいこ（新しい音）──
  noise(t, dur, { type = 'highpass', f = 7000, q = 0.7 } = {}) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    const fl = ctx.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    fl.Q.value = q;
    s.connect(fl);
    s.start(t, this.rand() * 0.5);
    s.stop(t + dur + 0.03);
    return fl;
  }

  drum(kind, t, vel0, dest) {
    const ctx = this.ctx;
    const vel = vel0 * (DRUM_LEVEL[kind] ?? 0.6);
    const light = this.quality === 'light';
    const env = (src, peak, dec, attack = 0.001) => {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + attack);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dec);
      src.connect(g);
      g.connect(dest);
      return g;
    };
    const tone = (type, f0, f1, sweep, peak, dec) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f1, t + sweep);
      env(o, peak, dec, 0.002);
      o.start(t);
      o.stop(t + dec + 0.02);
    };
    switch (kind) {
      case 'k':
        tone('sine', 190, 46, 0.09, vel * 1.25, 0.32);
        if (!light) env(this.noise(t, 0.02, { type: 'lowpass', f: 2600 }), vel * 0.25, 0.018);
        break;
      case 's':
        env(this.noise(t, 0.2, { type: 'bandpass', f: 2000, q: 0.7 }), vel * 0.75, 0.17);
        if (!light) tone('triangle', 200, 150, 0.05, vel * 0.4, 0.09);
        break;
      case 'h':
        env(this.noise(t, 0.05, { type: 'highpass', f: 7500 }), vel * 0.42, 0.045);
        break;
      case 'o':
        env(this.noise(t, 0.3, { type: 'highpass', f: 6500 }), vel * 0.32, 0.28);
        break;
      case 'c':
        env(this.noise(t, 1.4, { type: 'highpass', f: 4200 }), vel * 0.3, 1.3, 0.002);
        break;
      case 'p': {
        const src = this.noise(t, 0.2, { type: 'bandpass', f: 1300, q: 1.4 });
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        for (const k of [0, 0.011, 0.022]) {
          g.gain.setValueAtTime(vel * 0.8, t + k);
          g.gain.exponentialRampToValueAtTime(vel * 0.12, t + k + 0.01);
        }
        g.gain.exponentialRampToValueAtTime(0.0008, t + 0.16);
        src.connect(g);
        g.connect(dest);
        break;
      }
      case 't': tone('sine', 150, 96, 0.12, vel * 0.95, 0.28); break;
      case 'th': tone('sine', 215, 140, 0.11, vel * 0.9, 0.24); break;
      case 'tl': tone('sine', 108, 68, 0.13, vel * 1, 0.32); break;
      case 'R':
        tone('triangle', 1750, 1600, 0.02, vel * 0.35, 0.035);
        if (!light) env(this.noise(t, 0.03, { type: 'bandpass', f: 3200, q: 1.5 }), vel * 0.3, 0.025);
        break;
      default: break;
    }
  }

  // ── 前の音の 1音・たいこ（第76回までの note()・drum() を そのまま）──
  legacyNote(f, t, dur, wave, vol, out) {
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

  legacyDrum(kind, t, vol, out) {
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
}

// 話す 人の 名前 → 文字の 音の 高さ（Hz）。同じ 名前は いつも 同じ 高さ
const BLIP_STEPS = [0, 2, 4, 7, 9, 12, 14, 16, 19];
export function blipFreq(seed) {
  let h = 2166136261;
  const s = String(seed ?? '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const k = BLIP_STEPS[(h >>> 0) % BLIP_STEPS.length];
  return 523.25 * Math.pow(2, k / 12);
}
