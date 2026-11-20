// 第92回 F: 第3部 第1章 第3幕「さかさのピラミッド」の 曲（audio-c9c.js）
//   6曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   ピラミッドの ふしを さかさに した・flipStage で 楽器が かわる・3人組の ふし・星の音の 曲の 長さ・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C9C_TRACKS, C9C_IDS, C9C_PYRAMID_ORIG, C9C_TRIO_SHIFT } from '../public/js/client/audio-c9c.js';
import { C9B_TRACKS } from '../public/js/client/audio-c9b.js';
import { C9A_TRACKS, C9A_SEVEN } from '../public/js/client/audio-c9a.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, FORM_KEYS, isPart3Track, C9C_PYRAMID_TRACK, flipStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c9c_river', 'c9c_pyramid', 'c9c_riddle', 'c9c_trio2', 'c9c_algol', 'c9c_note'];
const LOOPED = IDS.filter((id) => id !== 'c9c_note');
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const loopSec = (c) => c.form.slice(c.loopFrom).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const mOf = (n) => ({ C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 })[n[0]] + (n.includes('#') ? 1 : 0) + 12 * Number(n.slice(-1));
const steps = (ns) => ns.slice(1).map((m, k) => m - ns[k]);

// ───── 小さな にせの AudioContext（audio-c9b.test.js と 同じ）─────
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

test('第92回 F: 6曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ', () => {
  assert.deepEqual(C9C_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C9C_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  assert.equal(_TRACKS.c9c_note.once, true, '星の音の 曲は くり返さない');
  // ボスの 名前（ナゾカケ・ヒックリカエール）や 少年の 名前は 出さない
  for (const id of IDS) assert.ok(!/ナゾカケ|ヒックリ|アルゴル|ホシドロ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第92回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c9c_river: [60, 90], c9c_pyramid: [60, 90], c9c_riddle: [60, 90], c9c_trio2: [60, 90], c9c_algol: [30, 50] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, id === 'c9c_river' ? 12 : 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    if (id === 'c9c_note') {
      const sec = c.form.reduce((a, n) => a + secOf(c, n), 0);
      assert.ok(sec >= 8 && sec <= 11, `星の音: ${sec.toFixed(1)} 秒`);
      continue;
    }
    const sec = loopSec(c);
    const [lo, hi] = range[id];
    assert.ok(sec >= lo && sec <= hi, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
});

test('第92回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c9c_river: [96, 112], c9c_pyramid: [80, 92], c9c_riddle: [116, 132], c9c_trio2: [148, 164], c9c_algol: [64, 80], c9c_note: [88, 104] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    // 少年の 曲だけ たいこ なし（静か）
    assert.equal(tr.parts.some((p) => p.drums), id !== 'c9c_algol', `${id}: たいこ`);
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
    // ピラミッドは さかさに した ふしの いちばん 下が ファ#4（66）
    const melLo = id === 'c9c_pyramid' ? 66 : 67;
    assert.ok(Math.min(...mel) >= melLo && Math.max(...mel) <= 93, `${id}: メロディ ${Math.min(...mel)}〜${Math.max(...mel)}`);
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

// 強拍（4/4 は 1・3拍め、6/8 は 1・4つめ）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
//   強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない。ピラミッドの さかさの 区切り（fi・fA・fB・fC）も 見る
test('第92回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c9c_algol: 16, c9c_note: 6 };
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
    assert.ok(n >= (minN[id] ?? 40), `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第92回 F: ピラミッドの ふしは 第4章の ピラミッドの ふしを さかさ（上がり下がりを 逆）に した もの', () => {
  // もとの ふしは 第4章の 曲（audio.js の pyramid）と 同じ
  const orig = parseNotes(_TRACKS.pyramid.ch[0].n);
  const mine = parseNotes(C9C_PYRAMID_ORIG.join(' '));
  assert.deepEqual(mine.map((e) => [Math.round(e.f ? midiOf(e.f) : 0), e.len]), orig.map((e) => [Math.round(e.f ? midiOf(e.f) : 0), e.len]));
  const c = compileTrack(_TRACKS.c9c_pyramid);
  const half = (k) => parseNotes(C9C_PYRAMID_ORIG.slice(k, k + 8).join(' '));
  for (const [nm, k] of [['A', 0], ['B', 8], ['C', 0]]) {
    const ev = c.segs[nm].parts[0];
    const src = half(k);
    assert.deepEqual(ev.map((e) => e.len), src.map((e) => e.len), `${nm}: 長さは 同じ`);
    const a = notesOf(ev), o = notesOf(src);
    assert.deepEqual(steps(a), steps(o).map((x) => (x === 0 ? 0 : -x)), `${nm}: 上がり下がりが 逆`);
    // 音階（レ・ミb・ファ#・ソ・ラ・シb・ド#）の まま
    for (const m of a) assert.ok([2, 3, 6, 7, 9, 10, 1].includes(m % 12), `${nm}: 音階の 外 ${m}`);
  }
  // A の はじめは レ・おわりは ソ（ト短調に 着く）
  const aNotes = notesOf(c.segs.A.parts[0]);
  assert.equal(aNotes[0] % 12, 2);
  assert.equal(aNotes[aNotes.length - 1] % 12, 7);
  // C は オルゴールが もとの（さかさで ない）ふしを 1オクターブ上で 鳴らす
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  assert.deepEqual(notesOf(c.segs.C.parts[mb]), notesOf(half(0)).map((m) => m + 12));
});

test('第92回 F: ピラミッドは flipStage（0 ふつう・1 さかさ）で 楽器が かわる', () => {
  const tr = _TRACKS.c9c_pyramid;
  const c = compileTrack(tr);
  assert.ok(FORM_KEYS.includes('flipStage'));
  assert.equal(C9C_PYRAMID_TRACK, 'c9c_pyramid');
  assert.equal(formOfPhase(c, 0), c, 'だん 0 は ふつうの 形');
  assert.deepEqual(formOfPhase(c, 1).form, ['fi', 'fA', 'fB', 'fC']);
  assert.equal(formOfPhase(c, 3).form[1], 'fA', 'だんが 大きくても さかさ');
  for (const ph of tr.phases) assert.deepEqual([ph.transpose, ph.tempo], [0, 1], 'テンポと 調は かえない');
  // さかさの 区切りは ふつうの 区切りと 同じ ふしを オルゴールが 鳴らす
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  assert.deepEqual(notesOf(c.segs.fA.parts[mb]), notesOf(c.segs.A.parts[0]).map((m) => m + 12));
  assert.deepEqual(notesOf(c.segs.fB.parts[mb]), notesOf(c.segs.B.parts[0]));
  // にせの エンジンで 鳴らす
  const bar = (16 * 60) / c.bpm / 4;
  const run = (phase) => {
    const { eng, log } = spyEngine();
    eng.start('c9c_pyramid', tr, 0);
    eng.adaptive.setPhase(phase);
    eng.pump(bar * 10);
    return log;
  };
  const a = run(0);
  const b = run(1);
  assert.ok(a.some((x) => x.inst === 'lead') && a.some((x) => x.inst === 'pluck'), 'ふつうは 四角い 波と ハープ');
  assert.ok(a.some((x) => x.d === 'k') && !a.some((x) => x.d === 'o'), 'ふつうは キック');
  assert.ok(!b.some((x) => x.inst === 'lead') && !b.some((x) => x.inst === 'pluck'), 'さかさは 四角い 波と ハープが 休み');
  assert.ok(b.filter((x) => x.inst === 'musicbox').length > a.filter((x) => x.inst === 'musicbox').length * 3, 'さかさは オルゴールが ふし');
  assert.ok(b.some((x) => x.d === 'o') && !b.some((x) => x.d === 'k'), 'さかさは リムと オープン');
  // 強さ（ピラミッドの 階）: 1階 0.4 でも ふし・ベース・のばしは 鳴る。ハープは 0.5・たいこは 0.7 から
  const on = (x) => c.parts.filter((p) => x >= p.minI - 1e-9).map((p) => (p.drums ? 'drums' : p.inst));
  assert.deepEqual(on(0.4), ['lead', 'bass', 'musicbox', 'pad']);
  assert.deepEqual(on(1), ['lead', 'bass', 'pluck', 'musicbox', 'pad', 'drums']);
});

test('第92回 F: 画面の flipStage を 読む・その 場所の 曲が ピラミッドの 時だけ だんを 送る', () => {
  assert.equal(flipStageOf({ field: {} }), 0);
  assert.equal(flipStageOf({ field: { flipStage: 1 } }), 1);
  assert.equal(flipStageOf({ field: { flipStage: true } }), 1);
  assert.equal(flipStageOf({ field: { flipStage: () => 1 } }), 1, '関数でも よい');
  assert.equal(flipStageOf({ field: {}, flipStage: 1 }), 1);
  assert.equal(flipStageOf({ field: { flipStage: 0 }, flipStage: 1 }), 0, '画面の field が 先');
  assert.equal(flipStageOf({ field: { flipStage: 5 } }), 1);
  assert.equal(flipStageOf(null), 0);
  const mk = (mapId, bgm, extra = {}) => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind: 'field', bgm };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps: { [mapId]: map } });
    au.play(bgm);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  assert.deepEqual(mk('c9c_p1', 'c9c_pyramid').log, [['i', 1], ['p', 0]]);
  const r = mk('c9c_p1', 'c9c_pyramid', { flipStage: 1 });
  assert.deepEqual(r.log, [['i', 1], ['p', 1]]);
  r.g.field.flipStage = 0;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(2), [['p', 0]], 'ひっくり返すと 次の 小節から');
  // 戦いの あとに もどったら（曲が 新しく なったら）送りなおす
  r.g.field.flipStage = 1;
  r.au.play('c9c_pyramid');
  r.sa.syncField(r.g, 2000, true);
  assert.deepEqual(r.log.slice(3), [['i', 1], ['p', 1]]);
  // ほかの 曲・今の 場所は だんを 送らない
  assert.deepEqual(mk('c9c_river', 'c9c_river', { flipStage: 1 }).log, [['i', 1]]);
  assert.deepEqual(mk('overworld', 'field').log, [['i', 1]]);
  // 戦い: 第3部の ふつうの 戦いは battle3。ボスの 曲は B班が snap.bgm で えらぶ
  const hasT = (id) => !!_TRACKS[id];
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c9c_river', has: hasT }), 'battle3');
  assert.equal(battleBgm({ snapBgm: 'c9c_riddle', mapId: 'c9c_p2', has: hasT }), 'c9c_riddle');
  assert.equal(battleBgm({ snapBgm: 'c9c_trio2', mapId: 'c9c_p4', has: hasT }), 'c9c_trio2');
});

test('第92回 F: 3人組の 曲は 第1幕の ふしを 使い、少し 速い', () => {
  const trio = compileTrack(_TRACKS.c9a_trio);
  const t2 = compileTrack(_TRACKS.c9c_trio2);
  assert.ok(t2.bpm > trio.bpm, `${trio.bpm} → ${t2.bpm}`);
  assert.equal(t2.parts[0].inst, 'lead');
  for (const nm of ['A', 'A2', 'D']) {
    const a = notesOf(trio.segs[nm].parts[0]).map((m) => m + C9C_TRIO_SHIFT);
    assert.deepEqual(notesOf(t2.segs[nm].parts[0]), a, `${nm}: 同じ ふし（ト長調）`);
    assert.deepEqual(t2.segs[nm].parts[0].map((e) => e.len), trio.segs[nm].parts[0].map((e) => e.len), `${nm}: 同じ 長さ`);
  }
  // C は A の ふしを さかさに（ト長調の まま）
  const ca = notesOf(t2.segs.C.parts[0]);
  assert.deepEqual(steps(ca), steps(notesOf(t2.segs.A.parts[0])).map((x) => (x === 0 ? 0 : -x)));
  for (const m of ca) assert.ok([0, 2, 4, 6, 7, 9, 11].includes(m % 12), `C: ト長調の 外 ${m}`);
  // ボスの だんは ふつう（HP 半分で 上がる）・ピンチは 主音（ソ）から
  assert.ok(!_TRACKS.c9c_trio2.phases);
  assert.equal(_TRACKS.c9c_trio2.pinch.n.split(' ')[0], 'G6:2');
});

test('第92回 F: 川は 6/8 で ゆれる・なぞなぞは 考える 間・少年は 7つの 音を 下る・星の音は ミから', () => {
  // 川: 6/8（1小節 12）。ベースは ゆり返し（1小節に 2つ いじょう）・オルゴールの しずくは 弱い
  const river = compileTrack(_TRACKS.c9c_river);
  const mbR = river.parts.findIndex((p) => p.inst === 'musicbox');
  assert.ok(river.segs.A.parts[mbR].filter((e) => e.f).every((e) => e.acc === 0.5), 'しずくは 弱く');
  // なぞなぞ: B は リムの ぽく ぽく だけ・ベルの ちーん・メロディは 休みが 多い
  const rid = compileTrack(_TRACKS.c9c_riddle);
  const dr = rid.parts.findIndex((p) => p.drums);
  assert.ok(rid.segs.B.parts[dr].filter((e) => e.drum).every((e) => e.drum === 'R'), 'B の たいこは リムだけ');
  const bell = rid.parts.findIndex((p) => p.inst === 'bell');
  assert.ok(rid.segs.B.parts[bell].some((e) => e.f), 'ちーん');
  const restRate = (nm) => { const ev = rid.segs[nm].parts[0]; return ev.filter((e) => !e.f).reduce((a, e) => a + e.len, 0) / rid.segs[nm].steps; };
  assert.ok(restRate('B') >= 0.6, `考える 間 ${restRate('B')}`);
  assert.ok(restRate('C') < 0.2, '答えが わかると 走る');
  // 少年: 星の子の 7つの 音を 上から 下へ（シ・ラ・ソ・ファ・ミ・レ・ド）
  const alg = compileTrack(_TRACKS.c9c_algol);
  const down = notesOf(alg.segs.A.parts[0]).slice(0, 7);
  assert.deepEqual(down, C9A_SEVEN.map(mOf).map((m) => m + 12).reverse());
  // 星の音: ミから 始まり ミで おわる・くり返さない・ハープは 7つの 音を のぼる
  const note = compileTrack(_TRACKS.c9c_note);
  const nm = notesOf(note.segs.main.parts[0]);
  assert.equal(nm[0] % 12, 4, 'ミから');
  assert.equal(nm[nm.length - 1] % 12, 4, 'ミで おわる');
  assert.equal(note.once, true);
  const harp = notesOf(note.segs.main.parts[2]).slice(0, 7);
  assert.deepEqual(harp, C9A_SEVEN.map(mOf).map((m) => m + 12));
  const { eng, log } = spyEngine();
  eng.start('c9c_note', _TRACKS.c9c_note, 0);
  eng.pump(30);
  assert.ok(eng.player.done(30), 'おわる');
  assert.ok(Math.abs(eng.player.endT - 10) < 1e-6, `4小節 = 10 秒 ${eng.player.endT}`);
  assert.ok(Math.max(...log.map((x) => x.t)) < 11, 'さいごの 音は 11 秒 より 前');
});

test('第92回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C9A_TRACKS), ...Object.keys(C9B_TRACKS), 'battle', 'field', 'pyramid']) {
    assert.ok(!(id in C9C_TRACKS), id);
    if (C9A_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9A_TRACKS[id].parts, id);
    if (C9B_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9B_TRACKS[id].parts, id);
  }
});
