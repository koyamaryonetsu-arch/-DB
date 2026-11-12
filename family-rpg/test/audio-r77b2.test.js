// 第77回 B2: 作りなおした フィールド・町・洞窟・千年前の フィールド・第7章 第8章の ダンジョンの 曲（audio-r77b.js）
//   形（区切りの 長さ・ひとまわりの 秒）・前の音は 前の データ・強拍で メロディと ベースが ぶつからない・
//   ダンジョンの 曲は 強さで パートが ふえる・テンポ・夜の 楽器・たいこの チャンネル 2つ
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS } from '../public/js/client/audio.js';
import { R77B_TRACKS, R77B_DUNGEON_IDS } from '../public/js/client/audio-r77b.js';
import { CH6_TRACKS } from '../public/js/client/audio-ch6.js';
import { compileTrack, legacyChannels, midiOf, freqOf, MusicEngine } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';

const IDS = ['field', 'town', 'cave', 'past_field', 'c7_temple', 'c7i_castle', 'c8a_palace', 'c8b_temple'];
const loopSec = (c) => (c.form.slice(c.loopFrom).reduce((a, n) => a + c.segs[n].steps, 0) * 60) / c.bpm / 4;

// ───── 小さな にせの AudioContext（audio-engine-r77.test.js と 同じ 考え方）─────
class FakeParam {
  constructor(v = 0) { this.value = v; this.calls = []; }
  setValueAtTime(v, t) { this.calls.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v, t) { this.calls.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v, t) { this.calls.push(['exp', v, t]); return this; }
  setTargetAtTime(v, t, k) { this.calls.push(['target', v, t, k]); return this; }
  setValueCurveAtTime(c, t, d) { this.calls.push(['curve', c.length, t, d]); return this; }
  cancelScheduledValues() { return this; }
}
class FakeNode {
  constructor(ctx) {
    this.outs = [];
    for (const p of ['gain', 'frequency', 'detune', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[p] = new FakeParam(p === 'gain' ? 1 : 0);
    ctx.made++;
  }
  connect(n) { this.outs.push(n); return n; }
  disconnect() { this.outs = []; }
  start() {}
  stop() {}
  setPeriodicWave() {}
}
class FakeCtx {
  constructor() { this.made = 0; this.currentTime = 0; this.sampleRate = 8000; this.destination = new FakeNode(this); }
  createGain() { return new FakeNode(this); }
  createOscillator() { return new FakeNode(this); }
  createBiquadFilter() { return new FakeNode(this); }
  createBufferSource() { return new FakeNode(this); }
  createStereoPanner() { return new FakeNode(this); }
  createConvolver() { return new FakeNode(this); }
  createWaveShaper() { return new FakeNode(this); }
  createDynamicsCompressor() { return new FakeNode(this); }
  createPeriodicWave(re, im) { return { re, im }; }
  createBuffer(ch, len) { const d = [...Array(ch)].map(() => new Float32Array(len)); return { getChannelData: (i) => d[i], length: len }; }
}
function spyEngine(opts = {}) {
  const ctx = new FakeCtx();
  const eng = new MusicEngine(ctx, ctx.destination, { offline: true, ...opts });
  const log = [];
  eng.voice = (f, t, dur, inst, vel, dest) => log.push({ kind: 'v', f, t, inst, dest });
  eng.drum = (d, t, vel, dest) => log.push({ kind: 'd', d, t, dest });
  eng.legacyNote = (f, t) => log.push({ kind: 'ln', f, t });
  eng.legacyDrum = (d, t) => log.push({ kind: 'ld', d, t });
  return { eng, log };
}

test('第77回 B2: 8曲が 区切り（parts・sections・form・loopFrom）で 書いて あり、ゲームの 曲に かぶさって いる', () => {
  assert.deepEqual(Object.keys(R77B_TRACKS).sort(), [...IDS].sort());
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.ok(tr.parts && tr.sections && tr.form, id);
    assert.equal(tr.parts, R77B_TRACKS[id].parts, `${id}: かぶさって いる`);
    assert.deepEqual(tr.form, ['intro', 'A', 'A2', 'B', 'br'], id);
    assert.equal(tr.loopFrom, 1, `${id}: イントロは 1回だけ`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
  }
});

test('第77回 B2: どの 区切りも 全部の チャンネルが 同じ 長さで 小節の 倍数・ひとまわり 60〜90秒', () => {
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}: ${s.steps}`);
      // どの 区切りも メロディか ベースが 鳴る
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}`);
    }
    const sec = loopSec(c);
    assert.ok(sec >= 60 && sec <= 90, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    // 区切りごとに メロディ・ベース・たいこが ちがう
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(['A', 'A2', 'B', 'br'].map(sig)).size, 4, `${id}: 区切りが ちがう`);
  }
  assert.ok(loopSec(compileTrack(_TRACKS.field)) >= 80 && loopSec(compileTrack(_TRACKS.field)) <= 90, 'フィールドは 80〜90秒');
  const t = loopSec(compileTrack(_TRACKS.town));
  assert.ok(t >= 70 && t <= 80, `町は 70〜80秒 ${t}`);
});

test('第77回 B2: テンポ・スイング・メロディックな パートは 5つまで', () => {
  const range = { field: [126, 138], town: [100, 140], cave: [104, 112], past_field: [116, 126] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id] || [100, 120];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    assert.ok(tr.parts.some((p) => p.drums), `${id}: たいこ`);
    for (const p of tr.parts) if (p.i) assert.ok(INSTRUMENTS[p.i], `${id}: 楽器 ${p.i}`);
  }
  assert.ok(_TRACKS.town.swing >= 0.08 && _TRACKS.town.swing <= 0.14, '町は はずむ');
  // 前より 速い（ねむく ならない）
  for (const id of IDS) assert.ok(_TRACKS[id].bpm >= legacyChannels(_TRACKS[id]).bpm, `${id}: 前より おそい`);
});

test('第77回 B2: 前の音 では 前の データが 鳴る（legacyChannels）', () => {
  for (const id of ['past_field', 'c7_temple', 'c7i_castle', 'c8a_palace', 'c8b_temple']) {
    const lc = legacyChannels(_TRACKS[id]);
    assert.equal(lc.bpm, CH6_TRACKS[id].bpm, id);
    assert.deepEqual(lc.ch, CH6_TRACKS[id].ch, id);
    assert.equal(_TRACKS[id].ch, lc.ch, `${id}: 古い テストの tr.ch も 前の データ`);
  }
  assert.equal(legacyChannels(_TRACKS.field).bpm, 132);
  assert.ok(legacyChannels(_TRACKS.field).ch[0].n.startsWith('A4:4 D5:2 E5:2 F#5:4'));
  assert.equal(legacyChannels(_TRACKS.town).bpm, 116);
  assert.ok(legacyChannels(_TRACKS.town).ch[0].n.startsWith('D5:2 B4:2 G4:2 B4:2'));
  assert.equal(legacyChannels(_TRACKS.cave).bpm, 84);
  assert.ok(legacyChannels(_TRACKS.cave).ch[0].n.startsWith('A4:8 r:4 E5:4'));
  // 前の音の エンジンで 鳴らすと 前の 最初の 音（A4）が 前の テンポで 鳴る
  const { eng, log } = spyEngine({ mode: 'old' });
  eng.start('field', _TRACKS.field, 0);
  eng.pump(1);
  const first = log.filter((x) => x.kind === 'ln').sort((a, b) => a.t - b.t || b.f - a.f)[0];
  assert.ok(Math.abs(first.f - freqOf('A4')) < 0.01);
});

test('第77回 B2: 強拍（1拍目・3拍目）で メロディと ベースが ぶつからない（短2度・増4度・長7度）割合 85% 以上', () => {
  const at = (evs, step) => {
    let s = 0;
    for (const e of evs) {
      if (step >= s && step < s + e.len) return e.f ? e : null;
      s += e.len;
    }
    return null;
  };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    assert.ok(lead >= 0 && bass >= 0, id);
    let n = 0;
    let bad = 0;
    for (const s of Object.values(c.segs)) {
      for (let st = 0; st < s.steps; st += 8) {
        const m = at(s.parts[lead], st);
        const b = at(s.parts[bass], st);
        if (!m || !b) continue;
        n++;
        const iv = (((Math.round(midiOf(m.f)) - Math.round(midiOf(b.f))) % 12) + 12) % 12;
        if (iv === 1 || iv === 6 || iv === 11) bad++;
      }
    }
    assert.ok(n >= 40, `${id}: 強拍が すくない ${n}`);
    assert.ok(1 - bad / n >= 0.85, `${id}: ぶつかる ${bad}/${n}`);
  }
});

test('第77回 B2: ダンジョン・洞窟の 曲は 強さで パートが ふえる（0 = きざみ／0.55 = たいこ／0.8 = 対旋律・和音）', () => {
  assert.deepEqual(R77B_DUNGEON_IDS, ['cave', 'c7_temple', 'c7i_castle', 'c8a_palace', 'c8b_temple']);
  const has = (c, i, pred) => Object.values(c.segs).some((s) => s.parts[i].some(pred));
  for (const id of R77B_DUNGEON_IDS) {
    const c = compileTrack(_TRACKS[id]);
    const at0 = c.parts.filter((p) => p.minI === 0);
    assert.ok(at0.some((p) => p.role === 'lead') && at0.some((p) => p.role === 'bass'), `${id}: 強さ 0 で メロディ・ベース`);
    // 強さ 0 の 軽い たいこ（ハイハット・リム）と、16分・8分の きざみの ハーモニー
    const light = c.parts.findIndex((p) => p.drums && p.minI === 0);
    assert.ok(light >= 0 && has(c, light, (e) => e.drum === 'h' || e.drum === 'R'), `${id}: 軽い たいこ`);
    assert.ok(!has(c, light, (e) => e.drum === 'k'), `${id}: 軽い たいこに キックは 入れない`);
    const kiz = c.parts.findIndex((p) => p.role === 'harmony' && p.minI === 0);
    assert.ok(kiz >= 0 && c.parts[kiz].style === 'short', `${id}: きざみ`);
    // 0.55 で キック・スネア
    const heavy = c.parts.findIndex((p) => p.drums && p.minI === 0.55);
    assert.ok(heavy >= 0 && has(c, heavy, (e) => e.drum === 'k') && has(c, heavy, (e) => e.drum === 's' || e.drum === 'p'), `${id}: しっかりした たいこ`);
    // 0.8 で 対旋律か 厚い 和音
    const top = c.parts.filter((p, i) => p.minI === 0.8 && has(c, i, (e) => e.f > 0));
    assert.ok(top.length >= 1, `${id}: 0.8 の パート`);
    // 1階（0.4）では しっかりした たいこ・0.8 の パートは 鳴らない
    assert.ok(c.parts.every((p) => p.minI <= 0.4 || p.minI >= 0.55), id);
    // 夜でも 楽器は かわらない（ダンジョンの 中）
    assert.deepEqual(_TRACKS[id].night, {}, id);
  }
});

test('第77回 B2: 強さ 0.4 と 1.0 で 鳴る 音が ちがい、0.4 でも ハイハットが 鳴る（たいこの チャンネル 2つ）', () => {
  for (const id of R77B_DUNGEON_IDS) {
    const c = compileTrack(_TRACKS[id]);
    const bar = (16 * 60) / c.bpm / 4;
    const run = (x) => {
      const { eng, log } = spyEngine();
      eng.start(id, _TRACKS[id], 0);
      eng.adaptive.setIntensity(x);
      eng.pump(bar * 10);
      return { log, p: eng.player };
    };
    const lo = run(0.4);
    const hi = run(1);
    // 軽い たいこ（ハイハット・リム・タム）は 0.4 でも 鳴る。ハイハットは たいこの パートが 1つでも 鳴って いれば 消えない（エンジンの なおし）
    const lightIdx = c.parts.findIndex((p) => p.drums && p.minI === 0);
    assert.ok(lo.log.filter((x) => x.kind === 'd' && (x.dest === lo.p.strips[lightIdx].g || x.dest === lo.p.hat.g)).length >= 30, `${id}: 0.4 の 軽い たいこ`);
    const hats = lo.log.filter((x) => x.kind === 'd' && (x.d === 'h' || x.d === 'o'));
    assert.ok(hats.every((x) => x.dest === lo.p.hat.g), `${id}: ハイハット`);
    if (id !== 'c8a_palace') assert.ok(hats.length > 0, `${id}: 0.4 の ハイハット`);
    assert.ok(!lo.p.hat.g.gain.calls.some((k) => k[0] === 'target' && k[1] === 0), `${id}: 0.4 で ハイハットが 消えない`);
    assert.ok(!lo.log.some((x) => x.d === 'k'), `${id}: 0.4 で キックなし`);
    assert.ok(hi.log.some((x) => x.d === 'k'), `${id}: 1.0 で キック`);
    assert.ok(hi.log.length > lo.log.length * 1.2, `${id}: 1.0 は 厚い ${lo.log.length} → ${hi.log.length}`);
    // 0.4 でも 小節ごとに 拍が ある（1小節に 4つ 以上の たいこ・きざみ）
    const kiz = lo.log.filter((x) => x.kind === 'd' || x.inst === c.parts.find((p) => p.role === 'harmony' && p.minI === 0).inst);
    assert.ok(kiz.length >= 4 * 8, `${id}: きざみ ${kiz.length}`);
  }
});

test('第77回 B2: フィールド・町・千年前の フィールドは いつも ぜんぶ 鳴り、夜の 楽器を 曲に 合わせて 書いて ある', () => {
  for (const id of ['field', 'town', 'past_field']) {
    const tr = _TRACKS[id];
    const c = compileTrack(tr);
    assert.ok(c.parts.every((p) => p.minI === 0), `${id}: 強さに かかわらず 鳴る`);
    assert.ok(tr.night && Object.keys(tr.night).length >= 2, id);
    for (const v of Object.values(tr.night)) assert.ok(INSTRUMENTS[v], `${id}: 夜の 楽器 ${v}`);
    // 夜に リードが かわる
    const { eng, log } = spyEngine();
    eng.adaptive.setTimeOfDay('night');
    eng.start(id, tr, 0);
    eng.pump(30);
    const lead = log.filter((x) => x.kind === 'v' && x.dest === eng.player.strips[c.leadIdx].g);
    assert.ok(lead.length > 0 && lead.every((x) => x.inst === tr.night.lead), `${id}: 夜の リード`);
  }
});
