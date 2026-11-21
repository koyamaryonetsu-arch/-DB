// 第101回 F: 第3部 第3章 第1幕「星の船と、星座の島」の 曲（audio-c11a.js）
//   7曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   星の海の舟歌が 6/8 で 重さが ない・ひとふでの星座が conStage で 楽器が ふえる・星座が できた 短い 曲・
//   こぎ出す 曲が スピカの歌の 頭で 星の海の 和音で おわる・3つの 星の くり返し・チク・タクが ずっと 入る・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import {
  C11A_TRACKS, C11A_IDS, C11A_LINES, CON_INTENSITY, CONST_STARS, LAUNCH_SONG, LAUNCH_LAST_CHORD, THREE_STARS, TICK_TOCK,
} from '../public/js/client/audio-c11a.js';
import { C10D_TRACKS } from '../public/js/client/audio-c10d.js';
import { C9D_SONG } from '../public/js/client/audio-c9d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, formOfPhase } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C11A_ISLE_TRACK, conStageOf, conIntensity, CON_STAGES, gateStageOf, bridgeStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c11a_sea', 'c11a_isle', 'c11a_perch', 'c11a_const', 'c11a_launch', 'c11a_beast', 'c11a_pirate'];
const ONCE = ['c11a_const', 'c11a_launch'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lineNotes = (list) => notesOf(parseNotes(list.join(' ')));
// 1つの パートの 音を { t, len, m } に
const timeline = (p) => {
  let t = 0;
  return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null, acc: e.acc, drum: e.drum }; t += e.len; return o; });
};

// ───── 小さな にせの AudioContext（audio-c10d.test.js と 同じ）─────
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

test('第101回 F: 7曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C11A_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C11A_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // ボスの 名前・もとの お話・ボスの しかけ・この 幕で 言わない ことは 出さない
    assert.ok(!/ピーター|パン|フック|ワニ|わに|サメ|さめ|ザメ|船長|せんちょう|海ぞく|かいぞく|チクタク|チク・タク|時計|とけい|けもの|かがやき|使い|アルゴル|少年|女王|月の都|ソリトゥス|ヨイ|門|8つ|八つ|やっつ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c11a.js')), '漢字の しらべに 入って いる');
});

test('第101回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう・短い 2曲の 長さ', () => {
  const range = { c11a_sea: [55, 90], c11a_isle: [55, 90], c11a_perch: [40, 75], c11a_beast: [40, 70], c11a_pirate: [40, 70] };
  const barOf = { c11a_sea: 12, c11a_perch: 12 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    assert.equal(c.bar, barOf[id] || 16, id);
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
  // 星座が できた 4〜6 秒・こぎ出す 20〜30 秒
  const cs = compileTrack(_TRACKS.c11a_const);
  const css = formSec(cs, cs.form);
  assert.ok(css >= 4 && css <= 6, `星座 ${css.toFixed(2)} 秒`);
  const la = compileTrack(_TRACKS.c11a_launch);
  const las = formSec(la, la.form);
  assert.ok(las >= 20 && las <= 30, `こぎ出す ${las.toFixed(1)} 秒`);
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

test('第101回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい・とびすぎない', () => {
  const range = {
    c11a_sea: [76, 92], c11a_isle: [76, 92], c11a_perch: [80, 96], c11a_const: [120, 144], c11a_launch: [112, 132], c11a_beast: [144, 168], c11a_pirate: [132, 152],
  };
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

// 強拍（4拍子は 小節の 頭と まん中・6/8 は 0 と 6・3/4 は 1・2・3拍め）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
//   強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第101回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const beatsOf = { c11a_sea: [0, 6], c11a_perch: [0, 4, 8] };
  const minN = { c11a_const: 3, c11a_launch: 16 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    const beats = beatsOf[id] || [0, c.bar / 2];
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const tl = s.parts.map(timeline);
      const at = (i, st) => tl[i].find((e) => st >= e.t && st < e.t + e.len && e.m !== null);
      for (let b0 = 0; b0 < s.steps; b0 += c.bar) for (const off of beats) {
        const st = b0 + off;
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

test('第101回 F: 星の海の舟歌は 6/8 の 船の ゆれ・重さが ない・少し ふしぎ（ラの ナチュラル）', () => {
  const tr = _TRACKS.c11a_sea;
  const c = compileTrack(tr);
  assert.equal(c.bar, 12, '6/8');
  assert.ok(tr.bpm <= 90, 'ゆったり');
  // 地上の 世界地図と ちがう 色（ふしは やわらかい リード）
  assert.equal(tr.parts[0].i, 'soft_lead');
  assert.notEqual(tr.parts[0].i, _TRACKS.field?.parts?.[0]?.i ?? '');
  // 重さが ない: キック・スネアは 使わない（シェイカーと 遠い タムだけ）
  const dr = c.parts.findIndex((p) => p.drums);
  for (const [nm, s] of Object.entries(c.segs)) {
    assert.ok(s.parts[dr].every((e) => !e.drum || ['sh', 'tl', 't', 'th'].includes(e.drum)), `${nm}: かるい たいこ`);
  }
  // 船の ゆれ: ハープが どの 小節も 8分 6つ
  const pl = c.parts.findIndex((p) => p.inst === 'pluck');
  for (const nm of ['A', 'B', 'C', 'A2']) {
    const n = c.segs[nm].parts[pl].filter((e) => e.f).length;
    assert.equal(n, 6 * 8, `${nm}: ゆれ ${n}`);
  }
  // 少し ふしぎ: 変ホ長調に ない ラの ナチュラル（ヘ長調の 和音）が ふしに 入る
  const pcs = lineNotes([...C11A_LINES.seaA, ...C11A_LINES.seaB, ...C11A_LINES.seaC]).map((m) => m % 12);
  assert.ok(pcs.filter((p) => p === 9).length >= 4, 'ラの ナチュラル');
  // 明るすぎない・かなしすぎない: 長調で 始まり、短調の 和音も まざる
  const chs = c.segs.A.parts[1].filter((e) => e.f).length;
  assert.ok(chs >= 8, 'ベースが ある');
  assert.deepEqual(c.form, ['intro', 'A', 'B', 'C', 'A2']);
});

test('第101回 F: ひとふでの星座は できた 星座の 数で 楽器が ふえる（形・調は かえない）', () => {
  const tr = _TRACKS.c11a_isle;
  const c = compileTrack(tr);
  assert.deepEqual(CON_INTENSITY, [0, 0.5, 1]);
  assert.deepEqual(c.parts.map((p) => p.minI), [0, 0, 0, 0.5, 1, 1]);
  assert.ok(!tr.phases, 'だんは ない');
  assert.equal(formOfPhase(c, 2), c, '形は かわらない');
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const kinds = CON_INTENSITY.map((x) => {
    const { log } = run('c11a_isle', { intensity: x }, sec);
    return {
      insts: new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst)),
      drums: log.filter((e) => e.kind === 'd').length,
      n: log.length,
      first: log.find((e) => e.inst === 'flute')?.f,
    };
  });
  assert.deepEqual([...kinds[0].insts].sort(), ['bass', 'flute', 'pluck'], '0: 笛・ベース・ハープ');
  assert.equal(kinds[0].drums, 0);
  assert.ok(kinds[1].insts.has('musicbox') && !kinds[1].insts.has('strings') && kinds[1].drums === 0, '1: ＋ オルゴールの 星');
  assert.ok(kinds[2].insts.has('strings') && kinds[2].drums >= 16, '2: ＋ 弦と たいこ');
  for (let i = 1; i < 3; i++) {
    assert.ok(kinds[i].n > kinds[i - 1].n, `${i}: 音が ふえる`);
    assert.equal(kinds[i].first, kinds[0].first, `${i}: 調は かわらない`);
  }
  // しずか: たいこは 弱い 音だけ
  const dr = c.parts.findIndex((p) => p.drums);
  for (const s of Object.values(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['tl', 'th', 'sh', 'R'].includes(e.drum)));
});

test('第101回 F: 画面の conStage を 読む・その 曲の 時だけ 強さを 送る（だんは 送らない）', () => {
  assert.ok(FORM_KEYS0.includes('conStage') && !FORM_KEYS.includes('conStage'), 'addFormKey0');
  assert.equal(C11A_ISLE_TRACK, 'c11a_isle');
  assert.equal(CON_STAGES, 3);
  assert.equal(conStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(conStageOf(null), 0);
  assert.equal(conStageOf({ field: { conStage: 1 } }), 1);
  assert.equal(conStageOf({ field: { conStage: () => 2 } }), 2, '関数でも よい');
  assert.equal(conStageOf({ field: { conStage: 9 } }), 2);
  assert.equal(conStageOf({ field: { conStage: true } }), 2);
  assert.equal(conStageOf({ field: { conStage: -2 } }), 0);
  assert.equal(conStageOf({ field: {}, conStage: 1 }), 1);
  assert.deepEqual([0, 1, 2, 3].map(conIntensity), [0, 0.5, 1, 1]);
  assert.deepEqual(CON_INTENSITY, [0, 1, 2].map(conIntensity));
  const mk = (mapId, bgm, extra = {}, playing = bgm, kind = 'field') => {
    const log = [];
    const au = {
      music: null,
      play(id) { au.music = { id }; },
      setIntensity: (x) => log.push(['i', x]),
      setPhase: (x) => log.push(['p', x]),
      setPinch: () => {}, setTimeOfDay: () => {}, playAmbience: () => {}, stopAmbience: () => {},
    };
    const map = { id: mapId, kind, bgm };
    const maps = { [mapId]: map, c11a_isle2: { id: 'c11a_isle2', kind, bgm }, c11a_isle3: { id: 'c11a_isle3', kind, bgm } };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  assert.deepEqual(mk('c11a_isle1', 'c11a_isle').log, [['i', 0]], '星座なし');
  const b = mk('c11a_isle1', 'c11a_isle', { conStage: 1 });
  assert.deepEqual(b.log, [['i', 0.5]]);
  b.g.field.conStage = 2;
  b.sa.syncField(b.g, 1000);
  assert.deepEqual(b.log.slice(1), [['i', 1]], '2つめが できた');
  // 島を 出て べつの 島（0 から）
  b.g.field.conStage = 0;
  b.sa.syncField(b.g, 2000);
  assert.deepEqual(b.log.slice(2), [['i', 0]]);
  // ダンジョンの 形の マップでも 深さでは なく 星座の 数
  assert.deepEqual(mk('c11a_isle3', 'c11a_isle', { conStage: 1 }, 'c11a_isle', 'dungeon').log, [['i', 0.5]], 'ダンジョンでも');
  // イベントの 曲でも 送る・ほかの 曲は 見ない・だんは 送らない
  assert.deepEqual(mk('c11a_isle1', 'c11a_sea', { conStage: 2 }, 'c11a_isle').log, [['i', 1]]);
  assert.deepEqual(mk('c11a_isle1', 'c11a_isle', { conStage: 2 }, 'c11a_const').log, [], 'ジングルの 間は さわらない');
  assert.deepEqual(mk('c11a_isle1', 'c11a_isle', { conStage: 2 }).log.filter((x) => x[0] === 'p'), [], 'だんは 送らない');
  // 門の 数・橋の 数とは まざらない
  assert.equal(gateStageOf({ field: { conStage: 2 } }), 0);
  assert.equal(bridgeStageOf({ field: { conStage: 2 } }), 0);
  assert.equal(conStageOf({ field: { gateStage: 3, bridgeStage: 2 } }), 0);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ conStage: 0 }), 0);
});

test('第101回 F: とまり木のランプは 3拍子の 小さな ワルツ・長調・ランプの ベルは ときどき', () => {
  const tr = _TRACKS.c11a_perch;
  const c = compileTrack(tr);
  assert.equal(c.bar, 12);
  // さびしく しすぎない: 長調で 始まり 長調で おわる
  assert.deepEqual(lineNotes([C11A_LINES.perchA[0]]).slice(0, 1).map((m) => m % 12), [9]);
  const a2 = notesOf(c.segs.A2.parts[0]);
  assert.equal(a2.at(-1) % 12, 5, 'ファで おわる');
  // ワルツ: ハープの 和音は 2・3拍め（1拍めは 休み）
  const pl = c.parts.findIndex((p) => p.inst === 'pluck');
  for (const e of timeline(c.segs.A.parts[pl])) if (e.m !== null) assert.ok(e.t % 12 !== 0, `1拍め ${e.t}`);
  // ランプ: ベルは 2小節に 1つ くらい（小さい）
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const nb = notesOf(c.segs.A.parts[bell]).length;
  assert.ok(nb >= 3 && nb <= 6, `ランプ ${nb}`);
  // 小さい: たいこは 弱い 音だけ
  const dr = c.parts.findIndex((p) => p.drums);
  for (const s of Object.values(c.segs)) assert.ok(s.parts[dr].every((e) => !e.drum || ['tl', 'sh'].includes(e.drum)));
});

test('第101回 F: つながる星は 星が 1つずつ ともり、線で つながり、和音で 光る', () => {
  const tr = _TRACKS.c11a_const;
  const c = compileTrack(tr);
  assert.equal(c.segs.S.steps / c.bar, 3, '3小節');
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const tl = timeline(c.segs.S.parts[bell]).filter((e) => e.m !== null);
  // 1小節めに 星が 4つ、1つずつ 高く（間を あけて）
  const first = tl.filter((e) => e.t < 16);
  assert.deepEqual(first.map((e) => e.m), lineNotes(CONST_STARS.map((n) => `${n}:1`)));
  assert.ok(first.every((e, i) => i === 0 || (e.m > first[i - 1].m && e.t - first[i - 1].t === 4)), '1つずつ');
  // 2小節め: 笛と ハープが 16分で のぼって つなぐ
  const pl = c.parts.findIndex((p) => p.inst === 'pluck');
  const run2 = timeline(c.segs.S.parts[pl]).filter((e) => e.m !== null && e.t >= 16 && e.t < 32);
  assert.ok(run2.length >= 8 && run2.every((e, i) => i === 0 || e.m > run2[i - 1].m), '線が のぼる');
  assert.ok(notesOf(c.segs.S.parts[0]).length >= 6);
  // 3小節め: 和音（ニ長調）と シンバル
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  assert.ok(timeline(c.segs.S.parts[str]).some((e) => e.m !== null && e.t >= 32));
  assert.equal(notesOf(c.segs.S.parts[0]).at(-1) % 12, 2, 'レで 光る');
  const dr = c.parts.findIndex((p) => p.drums);
  assert.ok(timeline(c.segs.S.parts[dr]).some((e) => e.drum === 'c' && e.t === 32));
});

test('第101回 F: 空へこぎ出せは 7つの 音で 動き出し、スピカの歌の 頭、星の海の舟歌の はじめの 和音で おわる', () => {
  const tr = _TRACKS.c11a_launch;
  const c = compileTrack(tr);
  assert.deepEqual(c.form, ['intro', 'R', 'S', 'F']);
  // イントロ: ベルが 7つ のぼる
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const iv = notesOf(c.segs.intro.parts[bell]);
  assert.equal(iv.length, 7);
  assert.ok(iv.every((m, i) => i === 0 || m > iv[i - 1]), 'のぼる');
  // スピカの歌の 1ふしめの 頭 2小節（3つ 上 ＝ 変ホ長調）
  assert.equal(LAUNCH_SONG.length, 2);
  assert.deepEqual(lineNotes(LAUNCH_SONG), lineNotes(C9D_SONG.phrases[0].slice(0, 2)).map((m) => m + 3));
  assert.deepEqual(notesOf(c.segs.R.parts[0]).slice(0, lineNotes(LAUNCH_SONG).length), lineNotes(LAUNCH_SONG));
  assert.deepEqual(parseNotes(LAUNCH_SONG.join(' ')).map((e) => e.len), parseNotes(C9D_SONG.phrases[0].slice(0, 2).join(' ')).map((e) => e.len), '長さも 同じ');
  // わくわく: S が いちばん 高い
  const top = (nm) => Math.max(...notesOf(c.segs[nm].parts[0]));
  assert.ok(top('S') >= top('R') && top('S') >= top('F'));
  // おわり: 変ホ長調の 主和音（星の海の舟歌の はじめの 和音と 同じ）。ベースは ミb、ふしは その 和音の 音
  const sea = _TRACKS.c11a_sea;
  assert.equal(LAUNCH_LAST_CHORD, 'Eb');
  const seaFirst = compileTrack(sea).segs.intro.parts[1].find((e) => e.f);
  const lastBass = notesOf(c.segs.F.parts[1]).at(-1);
  assert.equal(lastBass % 12, 3, 'ベースは ミb');
  assert.equal(Math.round(midiOf(seaFirst.f)) % 12, 3, '舟歌も ミb から');
  assert.ok([3, 7, 10].includes(notesOf(c.segs.F.parts[0]).at(-1) % 12), 'ふしは 主和音の 音');
  // さいごの 小節は ドミナントでは なく 主和音（弦の のばし）
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  const lastPad = c.segs.F.parts[str].filter((e) => e.f).at(-1);
  assert.equal(Math.round(midiOf(lastPad.f)) % 12 === 3 || Math.round(midiOf(lastPad.f)) % 12 === 7 || Math.round(midiOf(lastPad.f)) % 12 === 10, true);
});

test('第101回 F: またたく三つの星は 3つの 音を くり返す（強い 拍は 休み）・3つの 星の ふし', () => {
  const tr = _TRACKS.c11a_beast;
  const c = compileTrack(tr);
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  assert.equal(THREE_STARS.split(' ').filter((t) => !t.startsWith('r:')).length, 6, '3つの 音が 2回');
  for (const nm of c.form) {
    const tl = timeline(c.segs[nm].parts[bell]).filter((e) => e.m !== null);
    assert.ok(tl.length >= 6 * (c.segs[nm].steps / 16), `${nm}: 星 ${tl.length}`);
    for (const e of tl) assert.ok(e.t % 8 !== 0, `${nm}: 強い 拍 ${e.t}`);
    // 1小節の 中で 3つの 音が 2回（同じ 3つ）
    for (let b0 = 0; b0 < c.segs[nm].steps; b0 += 16) {
      const ms = tl.filter((e) => e.t >= b0 && e.t < b0 + 16).map((e) => e.m);
      assert.equal(new Set(ms).size, 3, `${nm} ${b0}: 3つの 音`);
      assert.deepEqual(ms.slice(0, 3), ms.slice(3, 6));
    }
  }
  // C: どの 小節も 3つの 音から 始まる（3つの 星）
  for (const b of C11A_LINES.beastC) assert.ok(lineNotes([b]).length >= 3);
  // きらきら して いるが 強い: 速い・短調・ピンチは 主音から
  assert.ok(tr.bpm >= 150);
  assert.equal(tr.pinch.n.split(' ')[0], 'C6:2');
  assert.equal(battleBgm({ snapBgm: 'c11a_beast', mapId: 'c11a_isle3', has: (x) => !!_TRACKS[x] }), 'c11a_beast');
});

test('第101回 F: 大波どたばたマーチは チク・タクが ずっと 入り、ピンチで きざみが 速く 聞こえる', () => {
  const tr = _TRACKS.c11a_pirate;
  const c = compileTrack(tr);
  const mar = c.parts.findIndex((p) => p.inst === 'marimba');
  assert.equal(TICK_TOCK, '2:4! 0:4? 2:4! 0:4?');
  // どの 区切りの どの 小節も、マリンバが 4分ごとに 上（チク・強い）・下（タク・弱い）
  for (const nm of c.form) {
    const tl = timeline(c.segs[nm].parts[mar]).filter((e) => e.m !== null);
    assert.equal(tl.length, c.segs[nm].steps / 4, `${nm}: 4分ごと`);
    for (let k = 0; k + 1 < tl.length; k += 2) {
      assert.equal(tl[k].t % 8, 0);
      assert.ok(tl[k].m > tl[k + 1].m, `${nm}: チク（上）・タク（下）`);
      assert.ok((tl[k + 1].acc ?? 1) < (tl[k].acc ?? 1), `${nm}: タクは 弱く`);
    }
  }
  // リムの 4分も ずっと（2つめの たいこ）
  const drs = c.parts.map((p, i) => (p.drums ? i : -1)).filter((i) => i >= 0);
  assert.equal(drs.length, 2);
  for (const nm of c.form) {
    const rims = timeline(c.segs[nm].parts[drs[1]]).filter((e) => e.drum === 'R');
    assert.equal(rims.length, c.segs[nm].steps / 4, `${nm}: リム`);
  }
  // ピンチ: マリンバが 16分（ふだんの チク・タク〈4分〉の 4倍の こまかさ）
  assert.equal(tr.pinch.i, 'marimba');
  const pn = parseNotes(tr.pinch.n);
  assert.ok(pn.every((e) => e.len === 1) && pn.length === 16, '16分');
  assert.equal(tr.pinch.n.split(' ')[0], 'G6:1');
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const nPinch = run('c11a_pirate', { pinch: true }, sec).log.filter((e) => e.inst === 'marimba').length;
  const nCalm = run('c11a_pirate', { pinch: false }, sec).log.filter((e) => e.inst === 'marimba').length;
  assert.ok(nPinch >= nCalm * 3, `ピンチで きざみが ふえる ${nCalm}→${nPinch}`);
  // こっけい: B に 半音で すべり下りる 所
  const b7 = lineNotes([C11A_LINES.pirateB[6]]);
  assert.deepEqual(b7.slice(0, 4).map((m, i) => (i ? b7[i - 1] - m : 0)), [0, 1, 1, 1]);
  // いさましい: ト短調の 行進（キックと スネア）
  assert.ok(c.segs.A.parts[drs[0]].some((e) => e.drum === 'k') && c.segs.A.parts[drs[0]].some((e) => e.drum === 's'));
  assert.ok(!tr.phases, 'ふつうの ボスの だん');
  assert.equal(battleBgm({ snapBgm: 'c11a_pirate', mapId: 'c11_sea', has: (x) => !!_TRACKS[x] }), 'c11a_pirate');
});

test('第101回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C10D_TRACKS), 'c9d_song', 'battle3', 'field']) {
    assert.ok(!(id in C11A_TRACKS), id);
    if (C10D_TRACKS[id]) assert.equal(_TRACKS[id].parts, C10D_TRACKS[id].parts, id);
  }
  for (const id of ['c11a_beast', 'c11a_pirate', 'c11a_const', 'c11a_launch', 'c11a_sea', 'c11a_perch']) {
    assert.equal(formOfPhase(compileTrack(_TRACKS[id]), 2), compileTrack(_TRACKS[id]), id);
  }
});
