// 第80回 F: 第8章 第4幕「時のはざま」の 曲（audio-c8r.js）
//   形（区切りの 長さ・ひとまわりの 秒）・強拍の ぶつかり・時の広間の 強さの 段・最後の 戦いの 3だん（だんごとの 形）・
//   今までの 動機の 思い出・名前・つなぎ（広間の 強さ・形態の しるしを 足す）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C8R_TRACKS, C8R_IDS } from '../public/js/client/audio-c8r.js';
import { R77A_TRACKS } from '../public/js/client/audio-r77a.js';
import { R77B_TRACKS } from '../public/js/client/audio-r77b.js';
import { TOP_TRACKS } from '../public/js/client/audio-top.js';
import { CH6_TRACKS } from '../public/js/client/audio-ch6.js';
import { compileTrack, legacyChannels, midiOf, formOfPhase, phaseOf, MusicEngine } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { checkText } from '../tools/kanji-check.mjs';
import { SceneAudio, hallIntensity, HALL_WING_FLAGS, FORM_KEYS, addFormKey, battlePhase, bossStage } from '../public/js/client/audio-scene.js';

const IDS = ['c8r_hall', 'c8r_wing', 'c8r_gate', 'c8r_last', 'c8r_solitus', 'ending2'];
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c, f = c) => f.form.slice(f.loopFrom).reduce((a, n) => a + secOf(c, n), 0);

// ───── 小さな にせの AudioContext（audio-r77b2.test.js と 同じ）─────
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
  return { eng, log };
}
const partOf = (eng, x) => eng.player.strips.findIndex((s) => s.g === x.dest);

test('第80回 F: 6曲が 区切りで 書いて あり、ゲームの 曲に かぶさって いる・名前（ネタバレ なし）', () => {
  assert.deepEqual(C8R_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C8R_TRACKS[id].parts, `${id}: かぶさって いる`);
    assert.ok(tr.sections && tr.form && tr.loopFrom === 1, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    // ボスの 名前・物語の 中みは 書かない
    for (const w of ['ソリトゥス', 'フリーゾン', '星']) assert.ok(!TRACK_NAMES[id].includes(w), `${id}: ${TRACK_NAMES[id]}`);
  }
  assert.equal(TRACK_NAMES.c8r_solitus, '最後の戦い');
  // 第1部の 最後の 戦いの 曲（solitus）は 第77回の まま（かぶせない）
  assert.equal(TRACK_NAMES.solitus, '魔王ソリトゥス');
  assert.ok(!('solitus' in C8R_TRACKS));
  assert.equal(_TRACKS.solitus.ch, TOP_TRACKS.solitus.ch);
  assert.equal(_TRACKS.solitus.bpm, TOP_TRACKS.solitus.bpm);
  assert.ok(!_TRACKS.solitus.sections && !_TRACKS.solitus.phases);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第80回 F: 区切りの 長さ・ひとまわり 60〜90秒（エンディングは 90秒 くらい）・区切りごとに ちがう', () => {
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    const sec = loopSec(c);
    if (id === 'ending2') assert.ok(sec >= 85 && sec <= 95, `${id}: ${sec}`);
    else assert.ok(sec >= 60 && sec <= 90, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    // 区切りごとに メロディ・ベース・たいこが ちがう
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
});

test('第80回 F: テンポ・メロディックな パートは 5つまで・楽器', () => {
  const range = { c8r_hall: [60, 100], c8r_wing: [104, 120], c8r_gate: [150, 165], c8r_last: [112, 126], c8r_solitus: [130, 150], ending2: [70, 100] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    assert.ok(tr.parts.some((p) => p.drums), `${id}: たいこ`);
    for (const p of tr.parts) if (p.i) assert.ok(INSTRUMENTS[p.i], `${id}: 楽器 ${p.i}`);
    const c = compileTrack(tr);
    assert.equal(c.parts.filter((p) => p.role === 'lead').length, 1, id);
    assert.equal(c.parts.filter((p) => p.role === 'bass').length, 1, id);
  }
  // 門番: 変身で キーと テンポが 上がる・ピンチ
  const gate = _TRACKS.c8r_gate;
  assert.equal(gate.phases.length, 4);
  for (let i = 1; i < 4; i++) {
    assert.ok(gate.phases[i].transpose > gate.phases[i - 1].transpose && gate.phases[i].tempo > gate.phases[i - 1].tempo, `門番 だん ${i}`);
  }
  assert.ok(gate.pinch?.n && gate.pinch.i === 'chip_arp');
  assert.ok(_TRACKS.c8r_solitus.pinch?.n);
});

// 強拍（1拍目・3拍目）: メロディ（最後の 戦いの だん 1 は オルゴール）と ベースが 短2度・増4度・長7度で ぶつからない
test('第80回 F: 強拍で メロディと ベースが ぶつからない（0こ）', () => {
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
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const mel = id === 'c8r_solitus' && /^(t1|S\d)$/.test(nm) ? 3 : lead;
      for (let st = 0; st < s.steps; st += 8) {
        const m = at(s.parts[mel], st);
        const b = at(s.parts[bass], st);
        if (!m || !b) continue;
        n++;
        const iv = (((Math.round(midiOf(m.f)) - Math.round(midiOf(b.f))) % 12) + 12) % 12;
        if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st}`);
      }
    }
    assert.ok(n >= 40, `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第80回 F: 時の広間は 強さで パートが ふえる（0.4 ベルと きざみ → 1.0 全部）', () => {
  const tr = _TRACKS.c8r_hall;
  const c = compileTrack(tr);
  const on = (x) => c.parts.map((p, i) => i).filter((i) => x >= c.parts[i].minI - 1e-9);
  // 0.4: ベル（メロディ）と きざみの たいこ だけ
  const lo = on(0.4);
  assert.deepEqual(lo.map((i) => c.parts[i].drums ? 'drums' : c.parts[i].inst), ['bell', 'drums']);
  // つばさ 1つごとに 1つ ふえる（0.55・0.7・0.85・1.0）
  const counts = [0, 1, 2, 3, 4].map((k) => on(hallIntensity((f) => HALL_WING_FLAGS.indexOf(f) >= 0 && HALL_WING_FLAGS.indexOf(f) < k)).length);
  assert.deepEqual(counts, [2, 3, 4, 5, 7]);
  assert.equal(on(1).length, c.parts.length, '1.0 で 全部');
  // きざみ（リム）は 0.4 でも 1小節に 2つ 以上・キックは 1.0 だけ
  const tick = c.parts.findIndex((p) => p.drums && p.minI === 0);
  for (const nm of c.form) {
    const s = c.segs[nm];
    assert.ok(s.parts[tick].filter((e) => e.drum === 'R').length >= (s.steps / 16) * 2, `${nm}: きざみ`);
    assert.ok(!s.parts[tick].some((e) => e.drum === 'k'), nm);
  }
  // にせの エンジンで: 0.4 は ベルと たいこ だけ・1.0 は 厚い
  const bar = (16 * 60) / c.bpm / 4;
  const run = (x) => {
    const { eng, log } = spyEngine();
    eng.start('c8r_hall', tr, 0);
    eng.adaptive.setIntensity(x);
    eng.pump(bar * 12);
    return { log, eng };
  };
  const a = run(0.4);
  const voices = a.log.filter((x) => x.kind === 'v');
  assert.ok(voices.length > 10 && voices.every((x) => x.inst === 'bell' || x.inst === 'soft_lead'), '0.4 は ベルだけ');
  assert.ok(!a.log.some((x) => x.d === 'k'), '0.4 で キックなし');
  assert.ok(a.log.filter((x) => x.kind === 'd').length >= 2 * 10, '0.4 でも きざみ');
  const b = run(1);
  assert.ok(b.log.length > a.log.length * 2, `1.0 は 厚い ${a.log.length} → ${b.log.length}`);
  for (const inst of ['sub_bass', 'pad', 'flute', 'pluck']) assert.ok(b.log.some((x) => x.inst === inst), inst);
  assert.deepEqual(tr.night, {});
});

test('第80回 F: 時の広間の 強さ ＝ クリアした つばさの 数（SceneAudio）', () => {
  assert.deepEqual(HALL_WING_FLAGS, ['c8w_moon', 'c8w_fire', 'c8w_iron', 'c8w_ice']);
  assert.equal(hallIntensity(() => false), 0.4);
  assert.equal(hallIntensity((f) => f === 'c8w_ice'), 0.55);
  assert.equal(hallIntensity((f) => f !== 'c8w_moon'), 0.85);
  assert.equal(hallIntensity(() => true), 1);
  // にせの ゲーム（広間の マップは A班が 作る。ここでは 形だけ）
  const log = [];
  const au = {
    music: null,
    play(id) { au.music = { id }; log.push(['play', id]); },
    setIntensity: (x) => log.push(['intensity', x]),
    setPinch: () => {}, setPhase: () => {},
    setTimeOfDay: (x) => log.push(['tod', x]),
    playAmbience: (x) => log.push(['amb', x]),
    stopAmbience: () => log.push(['amb', null]),
  };
  const flags = new Set();
  const map = { id: 'c8r_hall', kind: 'dungeon', bgm: 'c8r_hall', w: 10, h: 10 };
  const g = {
    sky: { isNight: () => false, flying: false },
    field: { mapId: 'c8r_hall', map, me: { x: 5, y: 5 }, nightOverride: null, hasFlag: (f) => flags.has(f), areaName: () => '', weatherKind: () => null, areaBgm: () => map.bgm },
  };
  const sa = new SceneAudio(au, { tracks: _TRACKS, maps: { c8r_hall: map } });
  au.play('c8r_hall');
  sa.syncField(g, 0, true);
  assert.deepEqual(log.find((x) => x[0] === 'intensity'), ['intensity', 0.4]);
  log.length = 0;
  flags.add('c8w_moon');
  flags.add('c8w_fire');
  sa.syncField(g, 1000);
  assert.deepEqual(log, [['intensity', 0.7]]);
  log.length = 0;
  flags.add('c8w_iron');
  flags.add('c8w_ice');
  sa.syncField(g, 2000);
  assert.deepEqual(log, [['intensity', 1]]);
  // つばさ（2階）・回廊（3階）は 今の「階で 強さ」の まま（ほかの 曲の 時は 広間の きまりを つかわない）
  const wing = { id: 'c8r_moon_1', kind: 'dungeon', bgm: 'c8r_wing' };
  const sa2 = new SceneAudio(au, { tracks: _TRACKS, maps: { c8r_moon_1: wing, c8r_moon_2: { id: 'c8r_moon_2', kind: 'dungeon', bgm: 'c8r_wing' } } });
  g.field.mapId = 'c8r_moon_1';
  g.field.map = wing;
  g.field.areaBgm = () => 'c8r_wing';
  flags.clear();
  assert.equal(sa2.fieldState(g).intensity, 1);
});

test('第80回 F: 最後の 戦いの 3だん（だん 0 おそろしい・1 かなしい・2 みんなの 力）は 区切りの ならびが かわる', () => {
  const tr = _TRACKS.c8r_solitus;
  const c = compileTrack(tr);
  // だん 0 は 曲の 形・だん 1・2 は それぞれの 形・だん 3 は だん 2 と 同じ
  assert.equal(formOfPhase(c, 0), c);
  assert.deepEqual(formOfPhase(c, 1).form, ['t1', 'S1', 'S2', 'S3']);
  assert.deepEqual(formOfPhase(c, 2).form, ['t2', 'H1', 'H2', 'H3', 'H4']);
  assert.equal(formOfPhase(c, 3), formOfPhase(c, 2));
  for (let n = 0; n <= 3; n++) assert.ok(phaseOf(c, n).transpose === 0 && phaseOf(c, n).tempo === 1, `だん ${n}: キーと テンポは そのまま`);
  // どの だんも ひとまわり 60〜90秒・だん 1 は おそく・だん 2 は はやい
  for (let n = 0; n <= 2; n++) {
    const s = loopSec(c, formOfPhase(c, n));
    assert.ok(s >= 60 && s <= 90, `だん ${n}: ${s}`);
  }
  assert.ok(c.segs.S1.bpm < c.bpm && c.segs.H1.bpm > c.bpm);
  // 区切りの 中み: だん 1 は メロディ（のこぎり）と ブラスが やすみ・オルゴールが 歌う。だん 0・2 は メロディが 鳴る
  const has = (nm, i) => c.segs[nm].parts[i].some((e) => e.f > 0);
  for (const nm of ['t1', 'S1', 'S2', 'S3']) {
    assert.ok(!has(nm, 0) && !has(nm, 4), `${nm}: メロディ・ブラスは やすみ`);
    assert.ok(has(nm, 3), `${nm}: オルゴール`);
  }
  for (const nm of ['A', 'A2', 'B', 'C', 'H1', 'H2', 'H3', 'H4']) assert.ok(has(nm, 0), nm);
  // だん 2 は 長調（ファ#）・だん 0 は 短調（ファ）
  const pcs = (nm) => new Set(c.segs[nm].parts[0].filter((e) => e.f).map((e) => Math.round(midiOf(e.f)) % 12));
  assert.ok(pcs('H1').has(6) && !pcs('H1').has(5));
  assert.ok(pcs('A').has(5) && !pcs('A').has(6));
  // 前の音 では 自分の 楽譜を 前の 書き方に うつした もの（だん 0）。第1部の 曲は つかわない
  const lc = legacyChannels(tr);
  assert.equal(lc.bpm, tr.bpm);
  assert.equal(lc.ch, tr.ch);
  assert.notDeepEqual(lc.ch, TOP_TRACKS.solitus.ch);
});

test('第80回 F: 最後の 戦い: setPhase で 次の 小節から その だんの 区切りへ（にせの エンジン）', () => {
  const tr = _TRACKS.c8r_solitus;
  const c = compileTrack(tr);
  const { eng, log } = spyEngine();
  eng.start('c8r_solitus', tr, 0);
  eng.pump(12);
  const p = eng.player;
  // だん 0: のこぎりの メロディ・ブラスが 鳴る
  assert.ok(log.some((x) => x.kind === 'v' && partOf(eng, x) === 0));
  assert.ok(log.some((x) => x.kind === 'v' && partOf(eng, x) === 4));
  const t1 = p.t;
  eng.adaptive.setPhase(1);
  eng.pump(t1 + 30);
  const after1 = log.filter((x) => x.t >= t1 && x.kind === 'v');
  assert.ok(after1.length > 10);
  assert.ok(after1.every((x) => partOf(eng, x) !== 0 && partOf(eng, x) !== 4), 'だん 1: メロディ・ブラスは やすみ');
  assert.ok(after1.some((x) => x.inst === 'musicbox'), 'だん 1: オルゴール');
  // 最初の オルゴールは「レ・ファ・ラ・ソ#」（t1 の はじめ）
  const box = after1.filter((x) => x.inst === 'musicbox').slice(0, 4).map((x) => Math.round(midiOf(x.f)));
  assert.deepEqual(box, [74, 77, 81, 80]);
  // だん 1 は テンポが おそい（1小節が 長い）
  const t2 = p.t;
  eng.adaptive.setPhase(2);
  eng.pump(t2 + 20);
  const after2 = log.filter((x) => x.t >= t2 && x.kind === 'v');
  const lead2 = after2.filter((x) => partOf(eng, x) === 0);
  assert.ok(lead2.length > 10, 'だん 2: メロディが もどる');
  assert.ok(after2.some((x) => partOf(eng, x) === 4), 'だん 2: ブラス');
  // だん 2 は つなぎ（ド・レ・ミ・ソ）→ ミドリナ地方の 動機（ラ・レ・ミ・ファ#）
  assert.deepEqual(lead2.slice(0, 8).map((x) => Math.round(midiOf(x.f))), [84, 86, 88, 91, 81, 86, 88, 90]);
  assert.equal(p.fm, formOfPhase(c, 2));
  // ほかの 曲は だんで 形が かわらない
  const b = spyEngine();
  b.eng.start('boss', _TRACKS.boss, 0);
  b.eng.adaptive.setPhase(2);
  b.eng.pump(10);
  assert.equal(b.eng.player.fm || b.eng.player.c, b.eng.player.c);
  assert.equal(formOfPhase(compileTrack(_TRACKS.boss), 2), compileTrack(_TRACKS.boss));
});

// 動機の 音の 動き（半音の 差）
const steps = (notes) => notes.slice(1).map((m, i) => m - notes[i]);
const firstNotes = (str, n) => String(str).trim().split(/\s+/).filter((t) => !t.startsWith('r:')).slice(0, n).map((t) => Math.round(midiOf(440 * 2 ** ((({ C: 0, 'C#': 1, D: 2, Eb: 3, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, Ab: 8, A: 9, Bb: 10, B: 11 })[/^([A-G][#b]?)/.exec(t)[1]] + 12 * (Number(/(-?\d):/.exec(t)[1]) + 1) - 69) / 12))));
const leadOf = (tr, sec) => (Array.isArray(tr.sections[sec]) ? tr.sections[sec][0] : tr.sections[sec].ch[0]);

test('第80回 F: つばさの 思い出の 区切りに 4つの ダンジョンの 動機・回廊に 2つの フィールドの 動機・エンディングは 勝利と 町の 動機', () => {
  const wingMem = leadOf(_TRACKS.c8r_wing, 'mem').split(/\s+/);
  // 4小節ずつ（1小節 = 16）に 分けて、それぞれの 頭 4音が もとの 動機と 同じ 動き
  const barsOf = (tokens) => {
    const out = [];
    let cur = [], len = 0;
    for (const t of tokens) {
      cur.push(t);
      len += Number(/:(\d+)/.exec(t)[1]);
      if (len % 64 === 0) { out.push(cur.join(' ')); cur = []; }
    }
    return out;
  };
  const phrases = barsOf(wingMem);
  assert.equal(phrases.length, 4);
  const src = [leadOf(R77B_TRACKS.c8a_palace, 'A'), leadOf(R77B_TRACKS.c8b_temple, 'A'), CH6_TRACKS.c8c_fort.ch[0].n, leadOf(R77B_TRACKS.c7i_castle, 'A')];
  for (let i = 0; i < 4; i++) assert.deepEqual(steps(firstNotes(phrases[i], 6)), steps(firstNotes(src[i], 6)), `思い出 ${i + 1}`);
  // 回廊: A は ミドリナ地方・A' は 千年前の ミドリナ地方
  assert.deepEqual(steps(firstNotes(leadOf(_TRACKS.c8r_last, 'A'), 4)), steps(firstNotes(leadOf(R77B_TRACKS.field, 'A'), 4)));
  assert.deepEqual(steps(firstNotes(leadOf(_TRACKS.c8r_last, 'A2'), 4)), steps(firstNotes(leadOf(R77B_TRACKS.past_field, 'A'), 4)));
  // エンディング: イントロ（ベル）は 勝利の 動機・A は 町の 動機
  const end = _TRACKS.ending2;
  assert.deepEqual(steps(firstNotes(end.sections.intro[4], 8)), steps(firstNotes(leadOf(R77A_TRACKS.victory, 'main'), 8)));
  assert.deepEqual(steps(firstNotes(leadOf(end, 'A'), 4)), steps(firstNotes(leadOf(R77B_TRACKS.town, 'A'), 4)));
  // 最後の 戦いの だん 0 の 頭は 第1部の 曲の 頭（レ・ファ・ラ・ソ#）
  assert.deepEqual(firstNotes(leadOf(_TRACKS.c8r_solitus, 'A'), 4), firstNotes(TOP_TRACKS.solitus.ch[0].n, 4));
});

test('第80回 F: 前の音 用の ch（新しい id）・前の音 では その ch が 鳴る', () => {
  for (const id of ['c8r_hall', 'c8r_wing', 'c8r_gate', 'c8r_last', 'c8r_solitus', 'ending2']) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const lc = legacyChannels(tr);
    assert.equal(lc.bpm, tr.bpm);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(lc.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
  }
});

test('第80回 F: 形態の しるしを 足せる（B班の 最後の ボスの 段）', () => {
  for (const k of ['slPhase', 'zen', 'c8form', 'bwForm']) assert.ok(FORM_KEYS.includes(k), k);
  const key = 'r80TestForm';
  assert.equal(bossStage({ species: 'x', boss: true, [key]: 3, hp: 90, maxHp: 100 }), 0, '足す 前は 読まない（HP で 0）');
  addFormKey(key);
  addFormKey(key);
  assert.equal(FORM_KEYS.filter((k) => k === key).length, 1, '同じ 名前は 1つ');
  assert.equal(bossStage({ species: 'x', boss: true, [key]: 3, hp: 90, maxHp: 100 }), 2);
  assert.equal(battlePhase({ boss: true, enemies: [{ species: 'x', boss: true, side: 'enemy', [key]: 2, hp: 90, maxHp: 100 }] }), 1);
  FORM_KEYS.splice(FORM_KEYS.indexOf(key), 1);
});
