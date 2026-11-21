// 第95回 F: 第3部 第2章 第2幕「青と白」の 曲（audio-c10b.js）
//   6曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   水鏡のうらがわが 神殿の ふし・waterStage で 楽器と 調（レ・ミ・ファ）が かわる・しのび足が alertStage で 低い 音 → 見つかった！・
//   タンゴの シェイカー・夜の 湖・手品ワルツの 3つの 楽器・5つの 音の 曲・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C10B_TRACKS, C10B_IDS, C10B_LINES, WATER_TRANSPOSE, ALERT_INTENSITY, OWL_VOICES } from '../public/js/client/audio-c10b.js';
import { C10A_TRACKS } from '../public/js/client/audio-c10a.js';
import { C9D_TRACKS, C9D_SONG } from '../public/js/client/audio-c9d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase, phaseOf, DRUMS } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C10B_BLUE_TRACK, C10B_WHITE_TRACK, waterStageOf, alertStageOf, alertIntensity,
} from '../public/js/client/audio-scene.js';

const IDS = ['c10b_blue', 'c10b_gecko', 'c10b_night', 'c10b_white', 'c10b_owl', 'c10b_five'];
const ONCE = ['c10b_night', 'c10b_five'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const firstNote = (evs) => notesOf(evs)[0];
// しのびよる 低い 音（c10b_white の sub_bass）だけは 低くて よい
const LOW_PART = { c10b_white: 3 };

// ───── 小さな にせの AudioContext（audio-c10a.test.js と 同じ）─────
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
const run = (id, { phase = 0, intensity = 1 } = {}, sec) => {
  const { eng, log } = spyEngine();
  eng.start(id, _TRACKS[id], 0);
  eng.adaptive.setPhase(phase);
  eng.adaptive.setIntensity(intensity);
  eng.pump(sec);
  return { log, eng };
};

test('第95回 F: 6曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ', () => {
  assert.deepEqual(C10B_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C10B_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // 中ボスの 名前・もとの 作品・少年の 名前は 出さない
    assert.ok(!/ゲッコー|トカゲ|しんし|クロコ|フクロウ|かい盗|怪盗|キッド|シロ|アルゴル|ソリトゥス|モルガナ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
});

test('第95回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c10b_blue: [55, 90], c10b_gecko: [55, 90], c10b_white: [50, 90], c10b_owl: [55, 90] };
  const bar = { c10b_blue: 12, c10b_owl: 12 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, bar[id] ?? 16, id);
    for (const [nm, s] of Object.entries(c.segs)) {
      const lens = s.parts.map((p) => p.reduce((a, e) => a + e.len, 0));
      assert.ok(lens.every((l) => l === s.steps), `${id} ${nm}: ${lens.join(',')}`);
      assert.equal(s.steps % c.bar, 0, `${id} ${nm}`);
      assert.ok(s.parts.some((p) => p.some((e) => e.f > 0)), `${id} ${nm}: 音が ある`);
    }
    if (ONCE.includes(id)) continue;
    const [lo, hi] = range[id];
    const sec = formSec(c, c.form, c.loopFrom);
    assert.ok(sec >= lo && sec <= hi, `${id}: ひとまわり ${sec.toFixed(1)} 秒`);
    const loopNames = c.form.slice(c.loopFrom);
    const sig = (nm) => c.parts.map((p, i) => JSON.stringify(c.segs[nm].parts[i].slice(0, 24))).join('|');
    assert.equal(new Set(loopNames.map(sig)).size, new Set(loopNames).size, `${id}: 区切りが ちがう`);
  }
  // 短い 2曲（夜の 湖 20〜30 秒・5つの 音 10〜14 秒）
  const night = compileTrack(_TRACKS.c10b_night);
  const ns = formSec(night, night.form);
  assert.ok(ns >= 20 && ns <= 30, `夜の 湖 ${ns.toFixed(1)} 秒`);
  const five = compileTrack(_TRACKS.c10b_five);
  const fs = formSec(five, five.form);
  assert.ok(fs >= 10 && fs <= 14, `5つの 音 ${fs.toFixed(1)} 秒`);
  for (const id of ONCE) {
    const { eng, log } = spyEngine();
    eng.start(id, _TRACKS[id], 0);
    eng.pump(60);
    const c = compileTrack(_TRACKS[id]);
    const sec = formSec(c, c.form);
    assert.ok(eng.player.done(60), `${id}: おわる`);
    assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `${id}: ${sec.toFixed(1)} 秒`);
    assert.ok(Math.max(...log.map((x) => x.t)) < sec, `${id}: さいごの 音は おわりより 前`);
  }
});

test('第95回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c10b_blue: [76, 92], c10b_gecko: [112, 128], c10b_night: [56, 72], c10b_white: [96, 112], c10b_owl: [140, 168], c10b_five: [100, 116] };
  for (const id of IDS) {
    const tr = _TRACKS[id];
    const [lo, hi] = range[id];
    assert.ok(tr.bpm >= lo && tr.bpm <= hi, `${id}: bpm ${tr.bpm}`);
    assert.ok(tr.parts.filter((p) => !p.drums).length <= 5, `${id}: パートが 多い`);
    if (id !== 'c10b_night') assert.ok(tr.parts.some((p) => p.drums), `${id}: たいこ`);
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
      const [a, b] = LOW_PART[id] === i ? [26, 50] : [48, 100];
      if (ns.length) assert.ok(Math.min(...ns) >= a && Math.max(...ns) <= b, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    // 1小節 いじょう 休んだ あとは 新しい ふし（手品ワルツの 笛は ほかの 楽器に ふしを わたして 休む）
    for (const s of all) {
      let prev = null;
      let gap = 0;
      for (const e of s.parts[lead]) {
        if (!e.f) { gap += e.len; continue; }
        const m = Math.round(midiOf(e.f));
        if (prev !== null && gap < c.bar) assert.ok(Math.abs(m - prev) <= 12, `${id} ${s.name}: とび ${prev}→${m}`);
        prev = m;
        gap = 0;
      }
    }
  }
});

// 強拍（小節の 頭と まん中）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第95回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  // 手品ワルツは ふしが 3つの 楽器を 回る ので 笛の 強拍は 少ない
  const minN = { c10b_night: 10, c10b_five: 10, c10b_owl: 24 };
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
          if (iv === 1 || iv === 6 || iv === 11) bad.push(`${nm} ${st} ぶつかり ${m.m}/${b.m}`);
        }
        const ns = c.parts.map((p, i) => (p.drums ? null : at(i, st))).filter(Boolean);
        for (let a = 0; a < ns.length; a++) for (let b2 = a + 1; b2 < ns.length; b2++) {
          const d = Math.abs(ns[a].m - ns[b2].m);
          if (d === 1 || d === 13) bad.push(`${nm} ${st} にごり ${ns[a].m}/${ns[b2].m}`);
        }
      }
    }
    assert.ok(n >= (minN[id] ?? 40), `${id}: 強拍が すくない ${n}`);
    assert.deepEqual(bad, [], id);
  }
});

test('第95回 F: 水鏡のうらがわは 神殿の ふし（6/8）・waterStage で 楽器と 調が かわる（レ・ミ・ファから）', () => {
  const tr = _TRACKS.c10b_blue;
  const c = compileTrack(tr);
  // 神殿の 曲の ふし 16小節と 同じ 音の ならび（ところどころ 音を たした 所は 6/8 の かざり）。頭の 6つは そのまま
  const temple = notesOf(parseNotes(_TRACKS.sand_temple.ch[0].n));
  const blue = notesOf(parseNotes([...C10B_LINES.blueA, ...C10B_LINES.blueB].join(' ')));
  assert.deepEqual(blue.slice(0, 6), [...temple.slice(0, 4), 74, 72], '頭 ミ・ラ・ソ・ミ・レ・ド');
  assert.equal(blue.at(-1), temple.at(-1), 'さいごは ラ');
  assert.ok(Math.abs(blue.length - temple.length) <= 6, `音の 数 ${blue.length} / ${temple.length}`);
  assert.equal(tr.bpm, _TRACKS.sand_temple.bpm, '神殿と 同じ はやさ');
  // だん 0・1・2: 調が 上がる（ふしの はじめが レ・ミ・ファ）
  assert.deepEqual(WATER_TRANSPOSE, [-2, 0, 1]);
  assert.equal(tr.phases.length, 3);
  const first = (n) => {
    const f = formOfPhase(c, n);
    const lead = [0, 2, 3].map((p) => firstNote(c.segs[f.form[f.loopFrom]].parts[p])).find((x) => x);
    return (lead + phaseOf(c, n).transpose) % 12;
  };
  assert.deepEqual([0, 1, 2].map(first), [2, 4, 5], 'レ・ミ・ファ');
  assert.ok(phaseOf(c, 0).tempo > 1 && phaseOf(c, 2).tempo < 1, '水なしは 少し 速く・水の 中は 少し おそく');
  // 0: マリンバ（かわいた 木の 音）が ふしを 短く・笛 ハープ のばし は 休み
  const mar = c.parts.findIndex((p) => p.inst === 'marimba');
  const harp = c.parts.findIndex((p) => p.inst === 'pluck');
  const padI = c.parts.findIndex((p) => p.inst === 'pad');
  const f0 = formOfPhase(c, 0).form;
  for (const nm of f0) {
    for (const p of [0, harp, padI]) assert.equal(notesOf(c.segs[nm].parts[p]).length, 0, `0 ${nm}: パート ${p} は 休み`);
  }
  assert.deepEqual(notesOf(c.segs.dA.parts[mar]), notesOf(c.segs.A.parts[0]), '0: マリンバが 同じ ふし');
  assert.ok(c.segs.dA.parts[mar].filter((e) => e.f).every((e) => e.len === 1), '0: 短い 音');
  const dr = c.parts.findIndex((p) => p.drums);
  assert.ok(c.segs.dA.parts[dr].filter((e) => e.drum).every((e) => e.drum === 'R'), '0: たいこは リム（木の 音）だけ');
  // 1: 笛の ふし・ハープの しずく
  assert.equal(formOfPhase(c, 1), c, '1 は 曲の 形');
  assert.ok(notesOf(c.segs.A.parts[harp]).length >= 48, '1: ハープの しずく');
  // 2: ハープが ふし・笛は 長い 音・のばしと 長い ベース・たいこは ほとんど なし
  assert.deepEqual(notesOf(c.segs.wA.parts[harp]), notesOf(c.segs.A.parts[0]), '2: ハープが 同じ ふし');
  assert.ok(c.segs.wA.parts[0].filter((e) => e.f).every((e) => e.len === 12), '2: 笛は 1小節 のばす');
  assert.ok(c.segs.wA.parts[1].filter((e) => e.f).every((e) => e.len === 12), '2: ベースも 長い');
  assert.ok(c.segs.wA.parts[dr].filter((e) => e.drum).length <= 1, '2: たいこ ほぼ なし');
  // にせの エンジン: 0 は 音が 少ない・2 は 長い 音
  const sec = 30;
  const count = (n) => run('c10b_blue', { phase: n }, sec).log.filter((x) => x.kind === 'v').length;
  const [n0, n1] = [count(0), count(1)];
  assert.ok(n0 * 2 < n1, `0 は 少ない ${n0} / ${n1}`);
  const insts = (n) => new Set(run('c10b_blue', { phase: n }, sec).log.filter((x) => x.kind === 'v').map((x) => x.inst));
  assert.ok(!insts(0).has('flute') && insts(0).has('marimba'), '0: 木の 音');
  assert.ok(insts(1).has('flute') && insts(2).has('pad'), '1・2');
});

test('第95回 F: 画面の waterStage・alertStage を 読む・その 曲の 時だけ だんを 送る', () => {
  assert.ok(FORM_KEYS0.includes('waterStage') && FORM_KEYS0.includes('alertStage'), 'addFormKey0');
  assert.ok(!FORM_KEYS.includes('waterStage') && !FORM_KEYS.includes('alertStage'));
  assert.equal(C10B_BLUE_TRACK, 'c10b_blue');
  assert.equal(C10B_WHITE_TRACK, 'c10b_white');
  // 水は 出て いない 間 1（中）・見はりは 0
  assert.equal(waterStageOf({ field: {} }), 1);
  assert.equal(waterStageOf(null), 1);
  assert.equal(waterStageOf({ field: { waterStage: 0 } }), 0);
  assert.equal(waterStageOf({ field: { waterStage: () => 2 } }), 2, '関数でも よい');
  assert.equal(waterStageOf({ field: { waterStage: 7 } }), 2);
  assert.equal(waterStageOf({ field: {}, waterStage: 0 }), 0);
  assert.equal(alertStageOf({ field: {} }), 0);
  assert.equal(alertStageOf({ field: { alertStage: 1.6 } }), 1);
  assert.equal(alertStageOf({ field: { alertStage: true } }), 2);
  assert.equal(alertStageOf({ field: { alertStage: -1 } }), 0);
  assert.equal(alertStageOf({ field: { alertStage: 0 }, alertStage: 2 }), 0, '画面の field が 先');
  assert.deepEqual([0, 1, 2, 5].map(alertIntensity), [0.4, 0.7, 1, 1]);
  assert.deepEqual(ALERT_INTENSITY, [0.4, 0.7, 1]);
  const mk = (mapId, bgm, extra = {}, playing = bgm) => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind: 'dungeon', bgm };
    const maps = { [mapId]: map, c10b_white2: { id: 'c10b_white2', kind: 'dungeon', bgm }, c10b_white3: { id: 'c10b_white3', kind: 'dungeon', bgm } };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // 水鏡のうらがわ（2まいの 階 ＝ 強さ 1）
  assert.deepEqual(mk('c10b_blue1', 'c10b_blue').log, [['i', 1], ['p', 1]], '出て いない 間は 中');
  const b = mk('c10b_blue1', 'c10b_blue', { waterStage: 2 });
  assert.deepEqual(b.log, [['i', 1], ['p', 2]]);
  b.g.field.waterStage = 0;
  b.sa.syncField(b.g, 1000);
  assert.deepEqual(b.log.slice(2), [['p', 0]], '水が ぬけると');
  // しのび足（ダンジョンの 深さでは なく 見はりの 近さ）
  assert.deepEqual(mk('c10b_white1', 'c10b_white').log, [['i', 0.4], ['p', 0]]);
  const w = mk('c10b_white1', 'c10b_white', { alertStage: 1 });
  assert.deepEqual(w.log, [['i', 0.7], ['p', 1]]);
  w.g.field.alertStage = 2;
  w.sa.syncField(w.g, 1000);
  assert.deepEqual(w.log.slice(2), [['i', 1], ['p', 2]], '見つかった');
  // イベントの 曲でも 送る
  assert.deepEqual(mk('c10b_white1', 'c10b_night', { alertStage: 1 }, 'c10b_white').log, [['i', 0.7], ['p', 1]]);
  assert.deepEqual(mk('c10b_blue1', 'c10b_gecko', { waterStage: 0 }, 'c10b_blue').log, [['p', 0]]);
  // ほかの 曲は 見ない
  assert.deepEqual(mk('c10b_blue1', 'c10b_gecko', { waterStage: 2, alertStage: 2 }).log.filter((x) => x[0] === 'p'), []);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ alertStage: 0 }), 0);
  assert.equal(boss({ waterStage: 2 }), 2);
});

test('第95回 F: しのび足は 休みの 多い ピチカート・alertStage 1 で 低い 音・2 で 見つかった！（速く にぎやか）', () => {
  const tr = _TRACKS.c10b_white;
  const c = compileTrack(tr);
  assert.equal(c.parts[0].inst, 'pluck', 'ピチカート');
  // 休みが 多い: A の ふしの 音の 長さは 半分 いか
  const len = (ev, f) => ev.filter(f).reduce((a, e) => a + e.len, 0);
  const a = c.segs.A.parts[0];
  assert.ok(len(a, (e) => e.f) * 2 < len(a, () => true), '音は 半分 より 少ない');
  // 1 は 形が かわらない（とちゅうから 止まらない）・2 は 見つかった の 形と 速さ
  assert.equal(formOfPhase(c, 0), c);
  assert.equal(formOfPhase(c, 1), c);
  assert.deepEqual(formOfPhase(c, 2).form, ['xI', 'xA']);
  assert.ok(phaseOf(c, 2).tempo >= 1.1 && phaseOf(c, 2).tempo <= 1.25, '速く');
  assert.equal(phaseOf(c, 1).tempo, 1);
  const minI = c.parts.map((p) => p.minI);
  assert.equal(minI[3], 0.7, '低い 音は 1 から');
  // にせの エンジン
  const bar = (16 * 60) / c.bpm / 4;
  const sec = secOf(c, 'intro') + bar * 8;
  const counts = [0, 1, 2].map((n) => {
    const { log } = run('c10b_white', { phase: n, intensity: alertIntensity(n) }, sec);
    return {
      low: log.filter((x) => x.inst === 'sub_bass').length,
      brass: log.filter((x) => x.inst === 'brass').length,
      drums: log.filter((x) => x.kind === 'd').length,
      snare: log.filter((x) => x.kind === 'd' && x.d === 's').length,
    };
  });
  assert.equal(counts[0].low, 0, '遠い 間は 低い 音なし');
  assert.ok(counts[1].low > 0, '近いと 低い 音');
  assert.equal(counts[0].brass + counts[1].brass, 0, 'ブラスは 見つかった 時だけ');
  assert.ok(counts[2].brass > 0 && counts[2].snare > 4 && counts[2].drums > counts[0].drums * 2, `にぎやか ${JSON.stringify(counts)}`);
  // こわすぎない: 見つかった の ふしは 長調・短調の 音だけ（ずり落ちる 半音は おわりの かざり）
  const x = notesOf(c.segs.xA.parts[0]);
  assert.ok(x.filter((m) => ![4, 6, 7, 9, 11, 0, 2, 3].includes(m % 12)).length <= 2, 'ホ短調の 音');
});

test('第95回 F: タンゴは シェイカーの さらさら・ハバネラの ベース・ピンチ', () => {
  assert.ok(DRUMS.includes('sh'), 'シェイカーの たいこ');
  const tr = _TRACKS.c10b_gecko;
  const c = compileTrack(tr);
  const shIdx = c.parts.findIndex((p, i) => p.drums && Object.values(c.segs).some((s) => s.parts[i].some((e) => e.drum === 'sh')));
  assert.ok(shIdx >= 0, 'シェイカーの パート');
  for (const nm of ['A', 'B', 'C', 'A2']) assert.ok(c.segs[nm].parts[shIdx].filter((e) => e.drum === 'sh').length >= 48, `${nm}: さらさら`);
  // ハバネラ（タン・タタ・タン）: A の ベースは 1小節に 5つ、さいしょは 16分 3つ ぶん
  const bassA = c.segs.A.parts[1].filter((e) => e.f);
  assert.equal(bassA.length, 40);
  assert.equal(bassA[0].len, 3);
  assert.equal(tr.parts[0].i, 'organ', '手風琴の かわり');
  assert.equal(tr.pinch.n.split(' ')[0], 'D6:2', 'ピンチは 主音から');
  assert.ok(!tr.phases, 'ふつうの ボスの だん（HP 半分で）');
  // にせの エンジンで シェイカーが 鳴る
  const { log } = run('c10b_gecko', {}, 10);
  assert.ok(log.filter((x) => x.kind === 'd' && x.d === 'sh').length > 30);
});

test('第95回 F: 夜の 湖は シロガネ地方の 頭・ガラスの ような 高い 音・たいこ なし・ミで おわる', () => {
  const tr = _TRACKS.c10b_night;
  const c = compileTrack(tr);
  const snow = notesOf(parseNotes(_TRACKS.snow.ch[0].n));
  const s = notesOf(c.segs.S.parts[0]);
  assert.deepEqual(s.slice(0, 4), snow.slice(0, 4).map((m) => m + 12), '頭 ミ・ソ・シ・ミ（1オクターブ 上）');
  assert.ok(!tr.parts.some((p) => p.drums), 'たいこ なし');
  assert.equal(tr.parts[0].i, 'bell');
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  const high = Object.values(c.segs).flatMap((x) => notesOf(x.parts[mb]));
  assert.ok(Math.min(...high) >= 79, `高い 音 ${Math.min(...high)}`);
  assert.equal(notesOf(c.segs.E.parts[0]).at(-1), 88, '高い ミで おわる');
});

test('第95回 F: 手品ワルツは 同じ ふしを 3つの 楽器が かわるがわる（3人に 見える）', () => {
  const tr = _TRACKS.c10b_owl;
  const c = compileTrack(tr);
  assert.equal(c.bar, 12, '3/4');
  const vIdx = OWL_VOICES.map((v) => c.parts.findIndex((p) => p.inst === v));
  assert.ok(vIdx.every((i) => i >= 0));
  const T = notesOf(parseNotes(C10B_LINES.owlT.join(' ')));
  const U = notesOf(parseNotes(C10B_LINES.owlU.join(' ')));
  // 小節ごとの 音（オルゴールの きらめきは 弱い 音 ＝ 数えない）
  const barsOf = (ev) => {
    const out = [];
    let t = 0;
    for (const e of ev) {
      const b = Math.floor(t / 12);
      (out[b] ||= []);
      if (e.f && (e.acc ?? 1) >= 1) out[b].push(Math.round(midiOf(e.f)));
      t += e.len;
    }
    return out;
  };
  const who = { A: [0, 1, 2], B: [2, 0, 1], A2: [2, 0, 1] };
  for (const [nm, order] of Object.entries(who)) {
    const theme = nm === 'B' ? U : T;
    const per = vIdx.map((i) => barsOf(c.segs[nm].parts[i]));
    order.forEach((w, r) => {
      const got = per[w].slice(r * 4, r * 4 + 4).flat();
      assert.deepEqual(got, theme, `${nm}: ${r + 1}つめは ${OWL_VOICES[w]}`);
      for (let k = 0; k < 3; k++) if (k !== w) assert.equal(per[k].slice(r * 4, r * 4 + 4).flat().length, 0, `${nm}: ${OWL_VOICES[k]} は 休み`);
    });
    // 4つめは 3つ そろう
    const tut = per.map((p) => p.slice(12, 16).flat().map((m) => m % 12));
    assert.deepEqual(tut[0], tut[1]);
    assert.deepEqual(tut[0], tut[2]);
  }
  // シャッフル: 1小節ごとに 入れかわる
  const cPer = vIdx.map((i) => barsOf(c.segs.C.parts[i]));
  for (let b = 0; b < 8; b++) assert.equal(cPer.filter((p) => (p[b] || []).length).length, 1, `C ${b + 1}小節め`);
  // ワルツ: ベースは 1拍め・ストリングスは 2・3拍め
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  assert.equal(c.segs.A.parts[str][0].f, 0);
  assert.equal(c.segs.A.parts[1][0].len, 4);
  assert.equal(tr.pinch.n.split(' ')[0], 'G6:2', 'ピンチは 主音から');
  // 戦いの 曲を ボスの bgm に するのは B班（snap.bgm を そのまま 使う）。ふつうの 戦いは battle3
  for (const id of ['c10b_gecko', 'c10b_owl']) {
    assert.equal(battleBgm({ snapBgm: id, mapId: 'c10b_white3', has: (x) => !!_TRACKS[x] }), id);
    assert.ok(!_TRACKS[id].phases, `${id}: ふつうの ボスの だん`);
  }
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c10b_blue1', has: (x) => !!_TRACKS[x] }), 'battle3');
});

test('第95回 F: 5つの 音は スピカの歌の 1〜5ふしめの 頭を じゅんに・さいごに レ・ミ・ファ・ソ・ラ・ソの 和音で 止まる', () => {
  const tr = _TRACKS.c10b_five;
  const c = compileTrack(tr);
  const lead = notesOf(c.segs.S.parts[0]);
  const heads = C9D_SONG.phrases.slice(0, 5).map((ph) => notesOf(parseNotes(ph[0])));
  assert.deepEqual(lead.slice(0, heads.flat().length), heads.flat(), '1〜5ふしめの はじめの 小節');
  assert.deepEqual(C10B_LINES.fiveHeads, C9D_SONG.phrases.slice(0, 5).map((ph) => ph[0]));
  // ベルが 頭の 音（1オクターブ 上）を 1小節に 1つ → さいごに 5つの 星の音
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const bn = notesOf(c.segs.S.parts[bell]);
  assert.deepEqual(bn.slice(0, 5), heads.map((h) => h[0] + 12), 'ミ・ミ・ド・ミ・ラ');
  assert.deepEqual(bn.slice(5).map((m) => m % 12), [2, 4, 5, 7, 9], 'レ・ミ・ファ・ソ・ラ');
  // ドで おわらない（あと 2つ）: さいごの ベースは ソ
  assert.equal(notesOf(c.segs.S.parts[1]).at(-1) % 12, 7, 'ソの 和音');
  assert.notEqual(lead.at(-1) % 12, 0, 'ふしも ドで 止まらない');
});

test('第95回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C10A_TRACKS), ...Object.keys(C9D_TRACKS), 'sand_temple', 'snow', 'battle', 'field']) {
    assert.ok(!(id in C10B_TRACKS), id);
    if (C10A_TRACKS[id]) assert.equal(_TRACKS[id].parts, C10A_TRACKS[id].parts, id);
    if (C9D_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9D_TRACKS[id].parts, id);
  }
  assert.ok(Array.isArray(_TRACKS.sand_temple.ch) && !_TRACKS.sand_temple.sections, '神殿の 曲は 前の まま');
});
