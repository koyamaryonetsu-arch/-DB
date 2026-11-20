// 第91回 F: 第3部 第1章 第2幕「鉱山の底の先」の 曲（audio-c9b.js）
//   4曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・
//   名前・大地の下は 水晶の 柱の 数（pillarStage 0〜6）で 楽器が ふえる・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C9B_TRACKS, C9B_IDS, C9B_SEVEN } from '../public/js/client/audio-c9b.js';
import { C9A_TRACKS, C9A_SEVEN } from '../public/js/client/audio-c9a.js';
import { C8R_TRACKS } from '../public/js/client/audio-c8r.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, FORM_KEYS, isPart3Track,
  C9B_UNDER_TRACK, C9B_PILLAR_FLAGS, pillarIntensity, pillarStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c9b_under', 'c9b_village', 'c9b_hall', 'c9b_king'];
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c) => c.form.slice(c.loopFrom).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));

// ───── 小さな にせの AudioContext（audio-c9a.test.js と 同じ）─────
class FakeParam {
  constructor(v = 0) { this.value = v; }
  setValueAtTime() { return this; }
  linearRampToValueAtTime() { return this; }
  exponentialRampToValueAtTime() { return this; }
  setTargetAtTime() { return this; }
  setValueCurveAtTime() { return this; }
  cancelScheduledValues() { return this; }
}
class FakeNode {
  constructor() {
    for (const p of ['gain', 'frequency', 'detune', 'Q', 'pan', 'threshold', 'knee', 'ratio', 'attack', 'release']) this[p] = new FakeParam(p === 'gain' ? 1 : 0);
  }
  connect(n) { return n; }
  disconnect() {}
  start() {}
  stop() {}
  setPeriodicWave() {}
}
class FakeCtx {
  constructor() { this.currentTime = 0; this.sampleRate = 8000; this.destination = new FakeNode(); }
  createGain() { return new FakeNode(); }
  createOscillator() { return new FakeNode(); }
  createBiquadFilter() { return new FakeNode(); }
  createBufferSource() { return new FakeNode(); }
  createStereoPanner() { return new FakeNode(); }
  createConvolver() { return new FakeNode(); }
  createWaveShaper() { return new FakeNode(); }
  createDynamicsCompressor() { return new FakeNode(); }
  createPeriodicWave(re, im) { return { re, im }; }
  createBuffer(ch, len) { const d = [...Array(ch)].map(() => new Float32Array(len)); return { getChannelData: (i) => d[i], length: len }; }
}
function spyEngine() {
  const ctx = new FakeCtx();
  const eng = new MusicEngine(ctx, ctx.destination, { offline: true });
  const log = [];
  eng.voice = (f, t, dur, inst, vel, dest) => log.push({ kind: 'v', f, t, inst, dest });
  eng.drum = (d, t, vel, dest) => log.push({ kind: 'd', d, t, dest });
  return { eng, log };
}

test('第91回 F: 4曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ', () => {
  assert.deepEqual(C9B_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C9B_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form && tr.loopFrom >= 1, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
  }
  assert.equal(TRACK_NAMES.c9b_king, 'デデドン大王');
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第91回 F: 区切りの 長さ・ひとまわり 60〜90秒・区切りごとに ちがう', () => {
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
    assert.ok(sec >= 60 && sec <= 90, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
});

test('第91回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c9b_under: [72, 88], c9b_village: [96, 116], c9b_hall: [92, 108], c9b_king: [120, 144] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    assert.ok(tr.parts.some((p) => p.drums), `${id}: たいこ`);
    for (const p of tr.parts) if (p.i) assert.ok(INSTRUMENTS[p.i], `${id}: 楽器 ${p.i}`);
    const c = compileTrack(tr);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    assert.equal(c.parts.filter((p) => p.role === 'lead').length, 1, id);
    assert.equal(c.parts.filter((p) => p.role === 'bass').length, 1, id);
    const pans = c.parts.filter((p) => p.role === 'harmony').map((p) => p.pan);
    assert.ok(Math.abs(pans.reduce((a, b) => a + b, 0)) <= 0.35, `${id}: 左右 ${pans}`);
    const all = Object.values(c.segs);
    const mel = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    assert.ok(Math.min(...mel) >= 67 && Math.max(...mel) <= 93, `${id}: メロディ ${Math.min(...mel)}〜${Math.max(...mel)}`);
    assert.ok(Math.min(...bs) >= 31 && Math.max(...bs) <= 62, `${id}: ベース ${Math.min(...bs)}〜${Math.max(...bs)}`);
    for (let i = 0; i < c.parts.length; i++) {
      if (c.parts[i].drums || i === lead || i === bass) continue;
      const ns = all.flatMap((s) => notesOf(s.parts[i]));
      if (ns.length) assert.ok(Math.min(...ns) >= 48 && Math.max(...ns) <= 100, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    for (const s of all) {
      const ns = notesOf(s.parts[lead]);
      for (let k = 1; k < ns.length; k++) assert.ok(Math.abs(ns[k] - ns[k - 1]) <= 12, `${id} ${s.name}: とび ${ns[k - 1]}→${ns[k]}`);
    }
  }
});

// 強拍（1拍目・3拍目）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第91回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const tl = s.parts.map((p) => {
        let t = 0;
        return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null }; t += e.len; return o; });
      });
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let st = 0; st < s.steps; st += c.bar / 2) {
        const m = at(lead, st), b = at(bass, st);
        if (m && b) {
          n++;
          const iv = (((m.m - b.m) % 12) + 12) % 12;
          if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st} ぶつかり`);
        }
        const ns = c.parts.map((p, i) => (p.drums ? null : at(i, st))).filter(Boolean);
        for (let a = 0; a < ns.length; a++) for (let b2 = a + 1; b2 < ns.length; b2++) {
          const d = Math.abs(ns[a].m - ns[b2].m);
          if (d === 1 || d === 13) bad.push(`${nm} ${st} にごり`);
        }
      }
    }
    assert.ok(n >= 40, `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第91回 F: 大地の下は 水晶の 柱の 数（pillarStage 0〜6）で 楽器が 1つずつ ふえる', () => {
  const tr = _TRACKS.c9b_under;
  const c = compileTrack(tr);
  // 段 → 強さ（0 → 0.4 … 6 → 1.0）
  const xs = [0, 1, 2, 3, 4, 5, 6].map(pillarIntensity);
  assert.deepEqual(xs, [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]);
  assert.equal(pillarIntensity(-1), 0.4);
  assert.equal(pillarIntensity(9), 1);
  assert.ok(FORM_KEYS.includes('pillarStage'));
  const on = (x) => c.parts.map((p, i) => i).filter((i) => x >= c.parts[i].minI - 1e-9);
  assert.deepEqual(xs.map((x) => on(x).length), [2, 3, 4, 5, 6, 7, 8], '1つずつ ふえる');
  const kind = (i) => (c.parts[i].drums ? 'drums' : c.parts[i].inst);
  assert.deepEqual(on(0.4).map(kind), ['pad', 'pluck'], '0 は のばしと しずくだけ（ごく しずか）');
  assert.deepEqual(on(1).map(kind), ['flute', 'sub_bass', 'pad', 'pluck', 'bell', 'drums', 'drums', 'drums'], '6 で 全部');
  // しずくは どの 区切りでも 鳴る（0 でも 音が とぎれない）。のばしも
  for (const nm of c.form) for (const i of on(0.4)) assert.ok(c.segs[nm].parts[i].some((e) => e.f > 0), `${nm} ${kind(i)}`);
  // 星の子の 7つの 音（ド〜シ と 同じ 形）を イントロの しずくと B の ベルで のぼる
  const up = (ns) => ns.slice(1, 7).map((m, k) => m - ns[k]);
  const mOf = (n) => ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[n[0]] + (n.includes('#') ? 1 : 0) + 12 * Number(n.slice(-1));
  const seven = [2, 2, 1, 2, 2, 2];
  assert.deepEqual(up(C9A_SEVEN.map(mOf)), seven, '星の子の 7つの 音の 形');
  assert.deepEqual(up(C9B_SEVEN.map(mOf)), seven);
  assert.deepEqual(up(notesOf(c.segs.intro.parts[3])), seven, 'イントロの しずく');
  const bellB = notesOf(c.segs.B.parts[4]);
  assert.deepEqual(up(bellB), seven, 'B の ベル');
  assert.deepEqual(bellB.slice(0, 7).map((m) => m % 12), [7, 9, 11, 0, 2, 4, 6], 'ソ〜ファ#');
  // にせの エンジン: 0 は しずかで、6 は 厚い
  const bar = (16 * 60) / c.bpm / 4;
  const run = (x) => {
    const { eng, log } = spyEngine();
    eng.start('c9b_under', tr, 0);
    eng.adaptive.setIntensity(x);
    eng.pump(bar * 12);
    return log;
  };
  const a = run(0.4);
  assert.ok(a.filter((x) => x.kind === 'v').every((x) => ['pad', 'pluck', 'strings', 'marimba'].includes(x.inst)), '0 は のばしと しずく');
  assert.ok(!a.some((x) => x.kind === 'd'), '0 は たいこ なし');
  const b = run(1);
  assert.ok(b.length > a.length * 2, `6 は 厚い ${a.length} → ${b.length}`);
  for (const inst of ['flute', 'sub_bass', 'bell']) assert.ok(b.some((x) => x.inst === inst), inst);
  assert.ok(b.some((x) => x.d === 'k') && b.some((x) => x.d === 'tl'));
});

test('第91回 F: 大地の下の 強さは 画面の pillarStage か、柱の フラグの 数（ほかの 曲・今の 場所は かわらない）', () => {
  assert.equal(C9B_UNDER_TRACK, 'c9b_under');
  assert.deepEqual(C9B_PILLAR_FLAGS, ['c9_pillar1', 'c9_pillar2', 'c9_pillar3', 'c9_pillar4', 'c9_pillar5', 'c9_pillar6']);
  const flags = new Set(['c9_pillar1', 'c9_pillar4', 'c9_pillar5']);
  const has = (f) => flags.has(f);
  assert.equal(pillarStageOf({ field: {} }, has), 3, 'フラグの 数');
  assert.equal(pillarStageOf({ field: { pillarStage: 5 } }, has), 5, '画面の 状態が 先');
  assert.equal(pillarStageOf({ field: { pillarStage: () => 6 } }, has), 6, '関数でも よい');
  assert.equal(pillarStageOf({ field: {}, pillarStage: 2 }, has), 2);
  assert.equal(pillarStageOf({ field: { pillarStage: 99 } }, has), 6);
  assert.equal(pillarStageOf({ field: {} }), 0);
  // にせの ゲーム
  const mk = (mapId, bgm, extra = {}) => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(x),
      setPinch: () => {}, setPhase: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind: 'field', bgm };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: has, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps: { [mapId]: map } });
    au.play(bgm);
    sa.syncField(g, 0, true);
    return { log, sa, g };
  };
  assert.deepEqual(mk('c9b_under', 'c9b_under').log, [0.7], '柱 3本 → 0.7');
  const r = mk('c9b_under', 'c9b_under', { pillarStage: 6 });
  assert.deepEqual(r.log, [1]);
  r.g.field.pillarStage = 1;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log, [1, 0.5], '柱が ふえたり へったり すると 次の 小節から');
  // ほかの 曲（村・やしき・今の フィールド）は 強さ 1 の まま
  assert.deepEqual(mk('c9b_under', 'c9b_village').log, [1]);
  assert.deepEqual(mk('overworld', 'field').log, [1]);
  // 戦い: c9b の マップは 第3部の 戦い（battle3）。大王の 戦いの 曲は B班が snap.bgm で えらぶ
  const hasT = (id) => !!_TRACKS[id];
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c9b_under', has: hasT }), 'battle3');
  assert.equal(battleBgm({ snapBgm: 'c9b_king', mapId: 'c9b_hall', has: hasT }), 'c9b_king');
});

test('第91回 F: 村・やしき・大王の 曲の 形', () => {
  const vil = compileTrack(_TRACKS.c9b_village);
  // 村: マリンバの ぽこぽこ（短い 音が 多い）・B は しずか（たいこは リムだけ・メロディは ゆっくり）
  assert.equal(vil.parts[0].inst, 'marimba');
  const dr = vil.parts.findIndex((p) => p.drums);
  assert.ok(vil.segs.B.parts[dr].filter((e) => e.drum).every((e) => e.drum === 'R'), 'B の たいこは リムだけ');
  const avgLen = (nm) => { const ev = vil.segs[nm].parts[0].filter((e) => e.f); return ev.reduce((a, e) => a + e.len, 0) / ev.length; };
  assert.ok(avgLen('B') > avgLen('A') * 2, 'B は ゆっくり');
  const cnt = (c, nm) => c.segs[nm].parts.reduce((a, p) => a + p.filter((e) => e.f || e.drum).length, 0);
  assert.ok(cnt(vil, 'B') < cnt(vil, 'A') * 0.6, 'B は 音が すくない');
  // やしき: スタッカートが 多い（ぬき足）・B は 低い タムの 心ぞう
  const hall = compileTrack(_TRACKS.c9b_hall);
  const leadA = hall.segs.A.parts[0].filter((e) => e.f);
  assert.ok(leadA.filter((e) => e.stac).length / leadA.length >= 0.8, 'ぬき足');
  const hdr = hall.parts.findIndex((p) => p.drums);
  assert.ok(hall.segs.B.parts[hdr].filter((e) => e.drum).every((e) => e.drum === 'tl' || e.drum === 't' || e.drum === 'th'), '心ぞう');
  // 大王: ブラスの ふし・ハ短調・低い ベース（ド 2）・ピンチは 主音（ド）から・ボスの だんは ふつう（HP 半分で 上がる）
  const king = compileTrack(_TRACKS.c9b_king);
  assert.equal(king.parts[0].inst, 'brass');
  assert.equal(Math.round(midiOf(king.segs.A.parts[0].find((e) => e.f).f)) % 12, 7, 'ハ短調の ソから');
  assert.equal(Math.min(...Object.values(king.segs).flatMap((s) => notesOf(s.parts[1]))), 31);
  assert.equal(_TRACKS.c9b_king.pinch.n.split(' ')[0], 'C6:2');
  assert.ok(!_TRACKS.c9b_king.phases);
  // D（大ジャンプ）が いちばん 高い
  const avg = (nm) => { const ns = notesOf(king.segs[nm].parts[0]); return ns.reduce((a, b) => a + b, 0) / ns.length; };
  for (const nm of ['A', 'B', 'C', 'A2']) assert.ok(avg('D') > avg(nm), nm);
});

test('第91回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C9A_TRACKS), ...Object.keys(C8R_TRACKS), 'battle', 'field', 'cave', 'mine']) {
    assert.ok(!(id in C9B_TRACKS), id);
    if (C9A_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9A_TRACKS[id].parts, id);
  }
});
