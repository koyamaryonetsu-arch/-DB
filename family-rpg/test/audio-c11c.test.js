// 第103回 F: 第3部 第3章 第3幕「はかりの回ろうと、ふたつの光」の 曲（audio-c11c.js）
//   6曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   回ろうが pairStage で 低い 楽器が 1つ 足される（ふし・形・調は 同じ）・ひと休みが 少年の ふしを ゆっくり やわらかく・
//   いっしょにが 短い・メカ 3号が 3人組の 前の 2つの ふしの 3つめ・隊長が 3小節 1組と めくる 音・大とびらが とじない 和音・
//   今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import {
  C11C_TRACKS, C11C_IDS, C11C_LINES, C11C_CHORDS, PAIR_INTENSITY, HALL_PAIR_A, REST_SLOW, JOIN_MEL, MECHA_SHIFT, MECHA_HITS,
  ACE_GROUP, ACE_FLIP, ACE_TEMPOS, DOOR_LAST,
} from '../public/js/client/audio-c11c.js';
import { C11B_TRACKS } from '../public/js/client/audio-c11b.js';
import { C9A_TRIO_THEME } from '../public/js/client/audio-c9a.js';
import { ALGOL_HEAD } from '../public/js/client/audio-c10c.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase, phaseOf } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C11C_HALL_TRACK, PAIR_STAGES, pairStageOf, pairIntensity, sideStageOf, conStageOf, gateStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c11c_hall', 'c11c_rest', 'c11c_join', 'c11c_mecha', 'c11c_ace', 'c11c_door'];
const ONCE = ['c11c_join', 'c11c_door'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lensOf = (evs) => evs.map((e) => [e.f ? 'n' : 'r', e.len]);
const lineNotes = (list) => notesOf(parseNotes([list].flat().join(' ')));
const pcOf = (m) => ((m % 12) + 12) % 12;
const timeline = (p) => {
  let t = 0;
  return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null, acc: e.acc, drum: e.drum, fs: e.fs }; t += e.len; return o; });
};
const chordPcs = (e) => [...new Set((e.fs || [e.f]).map((f) => pcOf(Math.round(midiOf(f)))))].sort((a, b) => a - b);

// ───── 小さな にせの AudioContext（audio-c11b.test.js と 同じ）─────
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
const run = (id, { phase = 0, intensity = 1, pinch = false } = {}, sec) => {
  const { eng, log } = spyEngine();
  eng.start(id, _TRACKS[id], 0);
  eng.adaptive.setPhase(phase);
  eng.adaptive.setIntensity(intensity);
  eng.adaptive.setPinch(pinch);
  eng.pump(sec);
  return { log, eng };
};

test('第103回 F: 6曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C11C_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C11C_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // ボスの 名前・もとの お話・物語の ひみつ・この 幕で 言わない ことは 出さない（前の 幕の きまり ＋ この 幕の もの）
    assert.ok(!/オボロ|おぼろ|朧|かぐや|竹|たけ|姫|ひめ|女王|じょおう|王女|むすめ|娘|わすれ|忘|むかえ|迎|天人|てんにん|衣|ころも|はかり|ながされ|流され|使い|番人|ばんにん|アルゴル|少年|ソリトゥス|カイ|ミラーレ|鏡|8つ|八つ|やっつ|足りない|たりない|ない$/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(!/アリス|ハート|トランプ|兵隊|へいたい|隊長|たいちょう|近衛|このえ|首|くび|はねよ|スペード|ダイヤ|クラブ|食べ|たべ|わけ|ひみつ|星の音|かげの台/.test(TRACK_NAMES[id]), `${id}: ネタバレ（この 幕） ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c11c.js')), '漢字の しらべに 入って いる');
});

test('第103回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう・短い 2曲の 長さ', () => {
  const range = { c11c_hall: [50, 80], c11c_rest: [45, 80], c11c_mecha: [40, 70], c11c_ace: [40, 70] };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, 16, id);
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
  // いっしょに 3〜5 秒・大とびら 8〜12 秒
  const want = { c11c_join: [3, 5], c11c_door: [8, 12] };
  for (const id of ONCE) {
    const c = compileTrack(_TRACKS[id]);
    const sec = formSec(c, c.form);
    assert.ok(sec >= want[id][0] && sec <= want[id][1], `${id}: ${sec.toFixed(2)} 秒`);
    const { eng, log } = spyEngine();
    eng.start(id, _TRACKS[id], 0);
    eng.pump(60);
    assert.ok(eng.player.done(60), `${id}: おわる`);
    assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `${id}: ${sec.toFixed(1)} 秒`);
    assert.ok(Math.max(...log.map((x) => x.t)) < sec, `${id}: さいごの 音は おわりより 前`);
  }
});

test('第103回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい・とびすぎない', () => {
  const range = {
    c11c_hall: [84, 100], c11c_rest: [60, 72], c11c_join: [132, 160], c11c_mecha: [160, 172], c11c_ace: [116, 132], c11c_door: [84, 104],
  };
  // ふしの 高さ（ひと休みは 少年の ふしと 同じ 高さ〈ド5 から〉・メカは 3人組の ふしを 上げた 高さ〈ミ5〜シ6〉）
  const mel = { c11c_rest: [60, 93], c11c_mecha: [62, 96] };
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
    const ml = all.flatMap((s) => notesOf(s.parts[lead]));
    const bs = all.flatMap((s) => notesOf(s.parts[bass]));
    const [mlo, mhi] = mel[id] || [67, 93];
    assert.ok(Math.min(...ml) >= mlo && Math.max(...ml) <= mhi, `${id}: メロディ ${Math.min(...ml)}〜${Math.max(...ml)}`);
    assert.ok(Math.min(...bs) >= 31 && Math.max(...bs) <= 62, `${id}: ベース ${Math.min(...bs)}〜${Math.max(...bs)}`);
    for (let i = 0; i < c.parts.length; i++) {
      if (c.parts[i].drums || i === lead || i === bass) continue;
      const ns = all.flatMap((s) => notesOf(s.parts[i]));
      if (ns.length) assert.ok(Math.min(...ns) >= 48 && Math.max(...ns) <= 100, `${id} パート ${i}: ${Math.min(...ns)}〜${Math.max(...ns)}`);
    }
    // 1小節 いじょう 休んだ あとは 新しい ふし。区切りを またいでも（form の じゅん・くり返しの もどりも）見る
    const order = [...c.form, ...c.form.slice(c.loopFrom ?? c.form.length)];
    let prev = null;
    let gap = 0;
    for (const nm of order) {
      for (const e of c.segs[nm].parts[lead]) {
        if (!e.f) { gap += e.len; continue; }
        const m = Math.round(midiOf(e.f));
        if (prev !== null && gap < c.bar) assert.ok(Math.abs(m - prev) <= 12, `${id} ${nm}: とび ${prev}→${m}`);
        prev = m;
        gap = 0;
      }
    }
  }
});

// 強拍（小節の 頭と まん中）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
//   強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない（回ろうの 足される 低い 楽器も ふくめて）
test('第103回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c11c_join: 5, c11c_door: 6, c11c_rest: 24 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    const beats = [0, c.bar / 2];
    let n = 0;
    const bad = [];
    for (const nm of Object.keys(c.segs)) {
      const s = c.segs[nm];
      const tl = s.parts.map(timeline);
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let b0 = 0; b0 < s.steps; b0 += c.bar) for (const off of beats) {
        const st = b0 + off;
        const b = at(bass, st);
        const m = at(lead, st);
        if (m && b) {
          n++;
          const iv = pcOf(m.m - b.m);
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

test('第103回 F: 回ろうは pairStage で 低い 楽器（少年の 色）が 1つ 足される（ふし・形・調・テンポは 同じ）', () => {
  const tr = _TRACKS.c11c_hall;
  const c = compileTrack(tr);
  assert.deepEqual(PAIR_INTENSITY, [0, 1]);
  // 足されるのは pad の 1つだけ（ほかは 強さ 0 から 鳴る）
  assert.deepEqual(c.parts.map((p) => p.minI), [0, 0, 0, 0, 1, 0]);
  const pi = c.parts.findIndex((p) => p.minI === 1);
  assert.equal(c.parts[pi].inst, 'pad', '少年の 曲（つめたい光）の のばしの 楽器');
  assert.ok(!tr.phases, 'だんは ない ＝ イントロへ もどらない');
  assert.equal(formOfPhase(c, 1), c, '形は かわらない');
  // 低い 音（ド3〜シ3）。A の 区切りは 少年の ふし（シ・ラ・ソ・ファ・ミ・レ・ド）を 1小節に 1つ
  const low = Object.values(c.segs).flatMap((s) => notesOf(s.parts[pi]));
  assert.ok(Math.max(...low) <= 60 && Math.min(...low) >= 48, `低い ${Math.min(...low)}〜${Math.max(...low)}`);
  const algol = lineNotes(ALGOL_HEAD).slice(0, 7);
  assert.deepEqual(notesOf(c.segs.A.parts[pi]).slice(0, 7), algol.map((m) => m - 24), '少年の ふしを 2オクターブ 下で');
  assert.deepEqual(lineNotes(HALL_PAIR_A).slice(0, 7).map(pcOf), [11, 9, 7, 5, 4, 2, 0]);
  // にせの エンジンで 鳴らす: 0 と 1 で ちがうのは pad だけ
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const kinds = PAIR_INTENSITY.map((x) => {
    const { log } = run('c11c_hall', { intensity: x }, sec);
    return {
      insts: [...new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst))].sort(),
      drums: log.filter((e) => e.kind === 'd').length,
      bell: log.filter((e) => e.inst === 'bell').map((e) => [e.f, e.t]),
      n: log.length,
    };
  });
  assert.deepEqual(kinds[0].insts, ['bass', 'bell', 'pluck', 'strings'], '0: ふつう');
  assert.deepEqual(kinds[1].insts, ['bass', 'bell', 'pad', 'pluck', 'strings'], '1: ＋ 低い のばし');
  assert.equal(kinds[1].drums, kinds[0].drums, 'たいこは 同じ');
  assert.deepEqual(kinds[1].bell, kinds[0].bell, 'ふしは 同じ（高さも 時も）');
  assert.ok(kinds[1].n > kinds[0].n);
  // ひんやり・少し きんちょう: ベルの ふし・リムの こちこち（キック・スネアなし）・ソ# が ある
  assert.equal(c.parts[0].inst, 'bell');
  const dr = c.parts.findIndex((p) => p.drums);
  for (const s of Object.values(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['R', 'sh', 'tl', 'th'].includes(e.drum)), 'かるい たいこ');
  assert.ok(lineNotes(C11C_LINES.hallB).map(pcOf).includes(8), 'ソ#');
  assert.equal(pcOf(notesOf(c.segs.A2.parts[0]).at(-1)), 9, 'ラで おわる');
});

test('第103回 F: 画面の pairStage を 読む・回ろうの 曲の 時だけ 強さを 送る（ダンジョンでも・だんは 送らない）', () => {
  assert.ok(FORM_KEYS0.includes('pairStage') && !FORM_KEYS.includes('pairStage'), 'addFormKey0');
  assert.equal(C11C_HALL_TRACK, 'c11c_hall');
  assert.equal(PAIR_STAGES, 2);
  assert.equal(pairStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(pairStageOf(null), 0);
  assert.equal(pairStageOf({ field: { pairStage: 1 } }), 1);
  assert.equal(pairStageOf({ field: { pairStage: () => 1 } }), 1, '関数でも よい');
  assert.equal(pairStageOf({ field: { pairStage: true } }), 1);
  assert.equal(pairStageOf({ field: { pairStage: false } }), 0);
  assert.equal(pairStageOf({ field: { pairStage: 3 } }), 1);
  assert.equal(pairStageOf({ field: { pairStage: -1 } }), 0);
  assert.equal(pairStageOf({ field: {}, pairStage: 1 }), 1);
  assert.deepEqual([0, 1].map(pairIntensity), PAIR_INTENSITY);
  const mk = (mapId, bgm, extra = {}, playing = bgm, kind = 'dungeon') => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind, bgm };
    const maps = {};
    for (const id of ['c11c_hall1', 'c11c_hall2', 'c11c_hall3']) maps[id] = { id, kind, bgm };
    maps[mapId] = map;
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // 回ろうの 1階（ダンジョン）: 台に だれも いない 間は 0（深さの 強さでは ない）
  assert.deepEqual(mk('c11c_hall1', 'c11c_hall').log, [['i', 0]]);
  assert.deepEqual(mk('c11c_hall3', 'c11c_hall').log, [['i', 0]], '3階でも 0');
  const r = mk('c11c_hall2', 'c11c_hall', { pairStage: 1 });
  assert.deepEqual(r.log, [['i', 1]]);
  r.g.field.pairStage = 0;
  r.sa.syncField(r.g, 1000);
  assert.deepEqual(r.log.slice(1), [['i', 0]], '台を はなれると 次の 小節から');
  // 戦いの あとに もどったら（曲が 新しく なったら）送りなおす
  r.g.field.pairStage = 1;
  r.au.play('c11c_hall');
  r.sa.syncField(r.g, 2000, true);
  assert.deepEqual(r.log.slice(2), [['i', 1]]);
  // だんは 送らない
  assert.equal(r.log.filter((x) => x[0] === 'p').length, 0);
  // イベントの 曲でも 送る・ほかの 曲・ジングルの 間は 送らない
  assert.deepEqual(mk('c11b_front', 'c11b_front', { pairStage: 1 }, 'c11c_hall', 'field').log, [['i', 1]]);
  assert.deepEqual(mk('c11c_rest', 'c11c_rest', { pairStage: 1 }, 'c11c_rest', 'field').log, [['i', 1]], 'ひと休みは ふつう');
  assert.deepEqual(mk('c11c_hall2', 'c11c_hall', { pairStage: 1 }, 'c11c_join').log, [], 'ジングルの 間は さわらない');
  // ほかの しるしとは まざらない
  assert.equal(sideStageOf({ field: { pairStage: 1 } }), 0);
  assert.equal(conStageOf({ field: { pairStage: 1 } }), 0);
  assert.equal(gateStageOf({ field: { pairStage: 1 } }), 0);
  assert.equal(pairStageOf({ field: { sideStage: 1, conStage: 2 } }), 0);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ pairStage: 0 }), 0);
});

test('第103回 F: ひと休みは 少年の ふしを 長さ 2ばいで やわらかく（笛・強い しるし なし）・さいごは ハ長調で 少し 明るく', () => {
  const tr = _TRACKS.c11c_rest;
  const c = compileTrack(tr);
  const algol = compileTrack(_TRACKS.c9c_algol);
  // 少年の 曲（c9c_algol）の A の はじめの 4小節 ＝ ALGOL_HEAD
  const algolA = notesOf(algol.segs.A.parts[0]);
  const head = lineNotes(ALGOL_HEAD);
  assert.deepEqual(algolA.slice(0, head.length), head, 'ALGOL_HEAD は つめたい光の ふし');
  // ひと休みの A は 同じ 音・長さ 2ばい
  const mine = parseNotes(c.segs.A.parts.length ? REST_SLOW : '');
  assert.deepEqual(notesOf(c.segs.A.parts[0]), head, '同じ 音');
  assert.deepEqual(lensOf(c.segs.A.parts[0]).map(([k, l]) => [k, l / 2]), lensOf(parseNotes(ALGOL_HEAD.join(' '))), '長さ 2ばい');
  assert.ok(mine.length > 0);
  // 秒でも ゆっくり（もとの 曲より 1音が 長い）
  const sec1 = (cc, nm) => (cc.segs[nm].parts[0].find((e) => e.f).len * 60) / cc.bpm / 4;
  assert.ok(sec1(c, 'A') > sec1(algol, 'A') * 2, 'ゆっくり');
  // やわらかく: つめたい ベル → 笛、強い しるしが ない
  assert.equal(algol.parts[0].inst, 'bell');
  assert.equal(c.parts[0].inst, 'flute');
  assert.ok(!REST_SLOW.includes('!'), '強い しるし なし');
  assert.ok(!C11C_LINES.restB.join(' ').includes('!'));
  // 少年の 色（pad の のばし）と 小さな 光（オルゴール）
  assert.ok(c.parts.some((p) => p.inst === 'pad') && c.parts.some((p) => p.inst === 'musicbox'));
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  assert.ok(notesOf(c.segs.B.parts[mb]).length > notesOf(c.segs.A.parts[mb]).length, 'B で 光が ふえる');
  // さいごは ハ長調（ベースは ド・のばしは ド・ミ・ソ・ふしは ド）
  const last = c.form.at(-1);
  assert.equal(pcOf(notesOf(c.segs[last].parts[1]).at(-1)), 0);
  const padP = c.parts.findIndex((p) => p.inst === 'pad');
  assert.deepEqual(chordPcs(c.segs[last].parts[padP].filter((e) => e.f).at(-1)), [0, 4, 7], 'ハ長調の 和音');
  assert.equal(pcOf(notesOf(c.segs[last].parts[0]).at(-1)), 0);
  assert.deepEqual(C11C_CHORDS.rest.B.slice(-2), ['C', 'C']);
  // しずか: たいこは 弱い 音だけ
  const dr = c.parts.findIndex((p) => p.drums);
  for (const s of Object.values(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['tl', 'sh'].includes(e.drum)));
});

test('第103回 F: いっしょに行こうは 短い ファンファーレ（イ短調で 始まり イ長調で おわる・ふしは ミで 止まる）', () => {
  const tr = _TRACKS.c11c_join;
  const c = compileTrack(tr);
  assert.equal(c.segs.S.steps / c.bar, 3, '3小節');
  assert.equal(c.parts[0].inst, 'brass');
  const tl = timeline(c.segs.S.parts[0]).filter((e) => e.m !== null);
  // 1小節めは イ短調（ド の ナチュラル）
  assert.ok(tl.filter((e) => e.t < 16).some((e) => pcOf(e.m) === 0), 'イ短調で 始まる');
  // さいごは イ長調の 和音（ド#）
  const padP = c.parts.findIndex((p) => p.inst === 'pad');
  assert.deepEqual(chordPcs(c.segs.S.parts[padP].filter((e) => e.f).at(-1)), [1, 4, 9], 'イ長調');
  assert.equal(pcOf(notesOf(c.segs.S.parts[1]).at(-1)), 9, 'ベースは ラ');
  // ふしは ミ（5度）で 止まる ＝ 明るすぎない・高い ラまで 行かない
  assert.equal(pcOf(tl.at(-1).m), 4);
  assert.ok(Math.max(...tl.map((e) => e.m)) < 93);
  assert.equal(notesOf(parseNotes(JOIN_MEL)).length, tl.length);
});

test('第103回 F: メカ 3号は 3人組の 前の 2つの ふしの 3つめ（同じ ふしの 頭・2つずつ 上がる・少し 速く・ブラスが 多い）', () => {
  const trio = compileTrack(_TRACKS.c9a_trio);
  const trio2 = compileTrack(_TRACKS.c9c_trio2);
  const me = compileTrack(_TRACKS.c11c_mecha);
  assert.equal(MECHA_SHIFT, 4);
  // A の 区切りの ふし: 1号 ＋4 ＝ 2号 ＋2 ＝ 3号（音も 長さも）
  const a1 = notesOf(trio.segs.A.parts[0]);
  const a2 = notesOf(trio2.segs.A.parts[0]);
  const a3 = notesOf(me.segs.A.parts[0]);
  assert.deepEqual(a3, a1.map((m) => m + 4), '1号の ふしを 4つ 上');
  assert.deepEqual(a3, a2.map((m) => m + 2), '2号の ふしを 2つ 上');
  assert.deepEqual(lensOf(me.segs.A.parts[0]), lensOf(trio.segs.A.parts[0]), '長さも 同じ');
  // 頭の 1小節（ド・ファ・ラ・ファ・ド → ミ・ラ・ド#・ラ・ミ）
  assert.deepEqual(lineNotes(C11C_LINES.mechaA[0]), lineNotes(C9A_TRIO_THEME.A[0]).map((m) => m + 4));
  // メカの D と A2 も 同じ ふし（4つ 上）
  assert.deepEqual(notesOf(me.segs.D.parts[0]), notesOf(trio.segs.D.parts[0]).map((m) => m + 4));
  assert.deepEqual(notesOf(me.segs.A2.parts[0]), notesOf(trio.segs.A2.parts[0]).map((m) => m + 4));
  // 調: ヘ → ト → イ（ベースの はじめの 音）
  const root = (cc) => pcOf(notesOf(cc.segs.A.parts[1])[0]);
  assert.deepEqual([root(trio), root(trio2), root(me)], [5, 7, 9]);
  // 少し 速く
  assert.ok(_TRACKS.c9a_trio.bpm < _TRACKS.c9c_trio2.bpm && _TRACKS.c9c_trio2.bpm < _TRACKS.c11c_mecha.bpm);
  // 形は 同じ ならび（intro・A・B・C・A2・D）
  assert.deepEqual(me.form, trio.form);
  // 少し ごうか: ブラスの 音が 前の 2つより 多い
  const brassN = (cc) => {
    const bi = cc.parts.findIndex((p) => p.inst === 'brass');
    return cc.form.slice(cc.loopFrom).reduce((a, nm) => a + notesOf(cc.segs[nm].parts[bi]).length, 0);
  };
  assert.ok(brassN(me) > brassN(trio2) && brassN(me) > brassN(trio), `ブラス ${brassN(trio)}・${brassN(trio2)} → ${brassN(me)}`);
  // 3つの 体（B）: 同じ 音を 3つずつ
  const tlB = timeline(me.segs.B.parts[0]).filter((e) => e.m !== null);
  let triples = 0;
  for (let i = 0; i + 2 < tlB.length; i++) if (tlB[i].m === tlB[i + 1].m && tlB[i].m === tlB[i + 2].m && (i === 0 || tlB[i - 1].m !== tlB[i].m)) triples++;
  assert.ok(triples >= 8, `3つずつ ${triples}`);
  assert.equal(MECHA_HITS.split(' ').filter((t) => t.startsWith('x')).length, 3, '3号の ジャン ジャン ジャン');
  // こっけい・元気: 速い・ピンチは 半音の となり
  assert.ok(_TRACKS.c11c_mecha.pinch.n.includes('G#6') && _TRACKS.c11c_mecha.pinch.n.includes('Bb6'));
  assert.equal(battleBgm({ snapBgm: 'c11c_mecha', mapId: 'c11b_front', has: (x) => !!_TRACKS[x] }), 'c11c_mecha');
});

test('第103回 F: カードの行進は 3小節で 1組（3つの 音の 合図・ベルの 3まい・めくる 音）・ボスの だんで テンポだけ 上がる', () => {
  const tr = _TRACKS.c11c_ace;
  const c = compileTrack(tr);
  assert.equal(ACE_GROUP, 3);
  const g = ACE_GROUP * c.bar;
  for (const nm of c.form) assert.equal(c.segs[nm].steps % g, 0, `${nm}: 3小節の まとまり`);
  assert.equal(c.segs.intro.steps, g, 'イントロは 1組');
  for (const nm of c.form.slice(c.loopFrom)) assert.equal(c.segs[nm].steps, 3 * g, `${nm}: 3組 ＝ 9小節`);
  const dr = c.parts.findIndex((p) => p.drums);
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  for (const nm of c.form) {
    const s = c.segs[nm];
    // めくる 音（シェイカー すぐ あとに リム ＝ 紙と 木）は 組の 3小節めだけ・どの 組にも 1つ
    const tl = timeline(s.parts[dr]);
    const flips = tl.filter((e, i) => e.drum === 'sh' && tl[i + 1]?.drum === 'R' && tl[i + 1].t === e.t + 1).map((e) => Math.floor(e.t / c.bar));
    const groups = s.steps / g;
    assert.deepEqual(flips, Array.from({ length: groups }, (_, k) => k * 3 + 2), `${nm}: めくる 音`);
    // ベルは 組の 1小節めに 3つの 音（カードを ならべる）
    if (nm !== 'intro') {
      const bt = timeline(s.parts[bell]).filter((e) => e.m !== null);
      for (let k = 0; k < groups; k++) {
        const inG = bt.filter((e) => e.t >= k * g && e.t < (k + 1) * g);
        assert.equal(inG.length, 3, `${nm} 組 ${k}: 3まい`);
        assert.ok(inG.every((e) => e.t < k * g + c.bar), `${nm} 組 ${k}: 1小節め`);
      }
    }
    // ふしの 組の 頭は 3つの 音の 合図（短・短・長。はじめの 2つは 同じ 音）
    const lt = timeline(s.parts[0]);
    for (let k = 0; k < groups; k++) {
      const head = lt.filter((e) => e.t >= k * g).slice(0, 3);
      assert.deepEqual(head.map((e) => e.len), [2, 2, 4], `${nm} 組 ${k}: 合図の 長さ`);
      assert.ok(head.every((e) => e.m !== null) && head[0].m === head[1].m && head[2].m > head[1].m, `${nm} 組 ${k}: 合図の 音`);
    }
  }
  assert.equal(ACE_FLIP, 'sh:1? R:1!');
  // きっちり した 行進: ブラスの ふし・ベースは 4分・スネアは 2拍めと 4拍め
  assert.equal(c.parts[0].inst, 'brass');
  for (const e of timeline(c.segs.A.parts[1])) if (e.m !== null) assert.equal(e.t % 4, 0);
  const snA = timeline(c.segs.A.parts[dr]).filter((e) => e.drum === 's' && e.t < 32).map((e) => e.t % 16);
  assert.deepEqual(snA, [4, 12, 4, 12]);
  // ト短調（シb・ファ#）
  const pcs = lineNotes(C11C_LINES.aceA).map(pcOf);
  assert.ok(pcs.includes(10) && pcs.includes(6));
  // ボスの だん: テンポだけ 上がる（調・形は かえない）
  assert.deepEqual(ACE_TEMPOS, [1, 1.1, 1.18, 1.25]);
  for (let n = 0; n < 4; n++) {
    assert.equal(phaseOf(c, n).transpose, 0);
    assert.equal(phaseOf(c, n).tempo, ACE_TEMPOS[n]);
    assert.equal(formOfPhase(c, n), c);
  }
  const n0 = run('c11c_ace', { phase: 0 }, 20).log.length;
  const n2 = run('c11c_ace', { phase: 2 }, 20).log.length;
  assert.ok(n2 > n0, `速く なる ${n0}→${n2}`);
  // ピンチ: ハープの 16分
  assert.equal(tr.pinch.i, 'pluck');
  assert.ok(parseNotes(tr.pinch.n).every((e) => e.len === 1));
  assert.equal(battleBgm({ snapBgm: 'c11c_ace', mapId: 'c11c_door', has: (x) => !!_TRACKS[x] }), 'c11c_ace');
});

test('第103回 F: 大とびらがひらくは かね → だんだん 近づく タム → まぶしい 光・おわりは とじきらない 和音', () => {
  const tr = _TRACKS.c11c_door;
  const c = compileTrack(tr);
  assert.equal(c.segs.S.steps / c.bar, 4, '4小節');
  assert.equal(c.parts[0].inst, 'bell', 'かね');
  // 1・2小節めは かねが 2つずつ
  const lt = timeline(c.segs.S.parts[0]).filter((e) => e.m !== null);
  assert.deepEqual([0, 1].map((b) => lt.filter((e) => e.t >= b * 16 && e.t < b * 16 + 16).length), [2, 2]);
  // タムが だんだん こまかく（1〜3小節め）・4小節めの 頭に シンバル
  const dr = c.parts.findIndex((p) => p.drums);
  const dt = timeline(c.segs.S.parts[dr]).filter((e) => e.drum);
  const toms = [0, 1, 2].map((b) => dt.filter((e) => e.t >= b * 16 && e.t < b * 16 + 16 && ['tl', 't', 'th'].includes(e.drum)).length);
  assert.ok(toms[0] < toms[1] && toms[1] < toms[2], `タム ${toms}`);
  assert.ok(dt.some((e) => e.t === 48 && e.drum === 'c'), 'まぶしい 光');
  // まぶしい 光: オルゴールの こまかい 音は 4小節めに いちばん 多い
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  const mt = timeline(c.segs.S.parts[mb]).filter((e) => e.m !== null);
  assert.ok(mt.filter((e) => e.t >= 48).length >= 8);
  // とじきらない: さいごの 和音は Asus4（ラ・レ・ミ。ド# が ない ＝ 長調でも 短調でも ない）、ニ長調の 主和音で おわらない
  assert.equal(DOOR_LAST, 'Asus4');
  for (const nm of ['strings', 'organ']) {
    const p = c.parts.findIndex((x) => x.inst === nm);
    const last = chordPcs(c.segs.S.parts[p].filter((e) => e.f).at(-1));
    assert.deepEqual(last, [2, 4, 9], `${nm}: Asus4`);
  }
  assert.equal(pcOf(notesOf(c.segs.S.parts[1]).at(-1)), 9, 'ベースは ラ（主音の レに もどらない）');
});

test('第103回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C11B_TRACKS), 'c9a_trio', 'c9c_trio2', 'c9c_algol', 'battle3', 'field']) {
    assert.ok(!(id in C11C_TRACKS), id);
    if (C11B_TRACKS[id]) assert.equal(_TRACKS[id].parts, C11B_TRACKS[id].parts, id);
  }
  for (const id of ['c11c_hall', 'c11c_rest', 'c11c_join', 'c11c_mecha', 'c11c_door']) {
    assert.equal(formOfPhase(compileTrack(_TRACKS[id]), 2), compileTrack(_TRACKS[id]), id);
  }
});
