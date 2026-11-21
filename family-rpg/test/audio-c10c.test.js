// 第97回 F: 第3部 第2章 第3幕「紫と、うばわれた音」の 曲（audio-c10c.js）
//   6曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   空の 小島が クモイの ふし・bridgeStage で 楽器が 1つずつ ふえる・いばりんぼ行進曲が あわてる・三日月のかげが 少年の ふし・
//   ベルトの 工場の 3人組の かけら・ふたつの光の スピカの歌・6つの 音の 曲・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import { C10C_TRACKS, C10C_IDS, C10C_LINES, BRIDGE_NOTES, BRIDGE_INTENSITY, ALGOL_HEAD, FORT_TRIO, RIVAL_SPICA, SIX_NOTES } from '../public/js/client/audio-c10c.js';
import { C10B_TRACKS } from '../public/js/client/audio-c10b.js';
import { C9C_TRACKS } from '../public/js/client/audio-c9c.js';
import { C9A_TRIO_THEME } from '../public/js/client/audio-c9a.js';
import { C9D_SONG } from '../public/js/client/audio-c9d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, phaseOf, formOfPhase } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C10C_ISLES_TRACK, bridgeStageOf, bridgeIntensity, BRIDGE_STAGES,
} from '../public/js/client/audio-scene.js';

const IDS = ['c10c_isles', 'c10c_colonel', 'c10c_stolen', 'c10c_fort', 'c10c_rival', 'c10c_six'];
const ONCE = ['c10c_stolen', 'c10c_six'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lineNotes = (list) => notesOf(parseNotes(list.join(' ')));

// ───── 小さな にせの AudioContext（audio-c10b.test.js と 同じ）─────
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

test('第97回 F: 6曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C10C_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C10C_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // 中ボスの 名前・もとの 作品・少年の 名前・「うばわれた」は 出さない
    assert.ok(!/ムスカ|ラピュタ|たいさ|大佐|軍|アルゴル|少年|うばわ|うばう|ぬすま|ソリトゥス|紫|むらさき|ホシドロ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c10c.js')), '漢字の しらべに 入って いる');
});

test('第97回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c10c_isles: [60, 90], c10c_colonel: [55, 90], c10c_fort: [55, 90], c10c_rival: [55, 90] };
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
  // 短い 2曲（三日月のかげ 15〜25 秒・6つの 音 10〜14 秒）
  const sto = compileTrack(_TRACKS.c10c_stolen);
  const ss = formSec(sto, sto.form);
  assert.ok(ss >= 15 && ss <= 25, `三日月のかげ ${ss.toFixed(1)} 秒`);
  const six = compileTrack(_TRACKS.c10c_six);
  const xs = formSec(six, six.form);
  assert.ok(xs >= 10 && xs <= 14, `6つの 音 ${xs.toFixed(1)} 秒`);
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

test('第97回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c10c_isles: [88, 104], c10c_colonel: [108, 124], c10c_stolen: [64, 80], c10c_fort: [104, 120], c10c_rival: [124, 140], c10c_six: [116, 132] };
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
    // 1小節 いじょう 休んだ あとは 新しい ふし
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
test('第97回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c10c_stolen: 8, c10c_six: 10 };
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

test('第97回 F: 空にかかる音の橋は クモイ地方の ふし・橋の 数で 楽器が 1つずつ ふえる・5色の 音の 虹', () => {
  const tr = _TRACKS.c10c_isles;
  const c = compileTrack(tr);
  // クモイ地方の 曲の ふし 16小節と 同じ 音・同じ 長さ
  const kumoi = parseNotes(_TRACKS.kumoi.ch[0].n).map((e) => [e.f ? Math.round(midiOf(e.f)) : 0, e.len]);
  const isles = parseNotes([...C10C_LINES.kumoiA, ...C10C_LINES.kumoiB].join(' ')).map((e) => [e.f ? Math.round(midiOf(e.f)) : 0, e.len]);
  assert.deepEqual(isles, kumoi, 'クモイの ふし');
  assert.deepEqual(notesOf(c.segs.A.parts[0]), lineNotes(C10C_LINES.kumoiA));
  assert.deepEqual(notesOf(c.segs.B.parts[0]), lineNotes(C10C_LINES.kumoiB));
  assert.ok(tr.bpm < _TRACKS.kumoi.bpm, '少し ゆっくり（ひろびろ）');
  assert.ok(!tr.phases, 'だんは 使わない（強さだけ）');
  // 強さの はしご: 笛・ベースは いつも、橋 1〜5本めで 0.2 ずつ
  assert.deepEqual(BRIDGE_INTENSITY, [0, 0.2, 0.4, 0.6, 0.8, 1]);
  const minI = c.parts.map((p) => p.minI);
  assert.deepEqual(minI, [0, 0, 0.2, 0.4, 0.6, 0.8, 1]);
  // 5色の 音: ハープ（赤）は レ・オルゴール（黄）は ミ から 入る・ベルの 虹は レ・ミ・ファ・ソ・ラ
  assert.deepEqual(BRIDGE_NOTES, ['D', 'E', 'F', 'G', 'A']);
  const harp = c.parts.findIndex((p) => p.inst === 'pluck');
  const mbox = c.parts.findIndex((p) => p.inst === 'musicbox');
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  assert.equal(notesOf(c.segs.A.parts[harp])[0], 86, 'ハープは 高い レ から');
  assert.equal(notesOf(c.segs.A.parts[mbox]).find((m) => m === 88), 88, 'オルゴールに 高い ミ');
  const bn = notesOf(c.segs.A.parts[bell]);
  assert.ok(bn.join(',').includes('86,88,89,91,93'), 'レ・ミ・ファ・ソ・ラ');
  for (const nm of ['A', 'B', 'C', 'A2']) {
    const s = notesOf(c.segs[nm].parts[bell]).join(',');
    assert.equal(s.split('86,88,89,91,93').length - 1, 2, `${nm}: 4小節ごとに 虹`);
  }
  // にせの エンジン: 橋が ふえる ほど 楽器と 音が ふえる
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const kinds = BRIDGE_INTENSITY.map((x) => {
    const { log } = run('c10c_isles', { intensity: x }, sec);
    return {
      insts: new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst)),
      sh: log.filter((e) => e.kind === 'd' && e.d === 'sh').length,
      kick: log.filter((e) => e.kind === 'd' && e.d === 'k').length,
      n: log.length,
    };
  });
  assert.deepEqual([...kinds[0].insts].sort(), ['bass', 'flute'], '0: 笛と ベースだけ');
  assert.ok(kinds[1].insts.has('pluck') && !kinds[1].insts.has('musicbox'), '1: ハープ');
  assert.ok(kinds[2].insts.has('musicbox') && kinds[2].sh === 0, '2: オルゴール');
  assert.ok(kinds[3].sh > 20 && kinds[3].kick === 0, '3: 風の シェイカー');
  assert.ok(kinds[4].kick > 0 && !kinds[4].insts.has('bell'), '4: たいこ');
  assert.ok(kinds[5].insts.has('bell'), '5: ベルの 虹');
  for (let i = 1; i < 6; i++) assert.ok(kinds[i].n > kinds[i - 1].n, `${i}: 音が ふえる ${kinds[i - 1].n}→${kinds[i].n}`);
});

test('第97回 F: 画面の bridgeStage を 読む・その 曲の 時だけ 強さを 送る', () => {
  assert.ok(FORM_KEYS0.includes('bridgeStage') && !FORM_KEYS.includes('bridgeStage'), 'addFormKey0');
  assert.equal(C10C_ISLES_TRACK, 'c10c_isles');
  assert.equal(BRIDGE_STAGES, 6);
  assert.equal(bridgeStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(bridgeStageOf(null), 0);
  assert.equal(bridgeStageOf({ field: { bridgeStage: 3 } }), 3);
  assert.equal(bridgeStageOf({ field: { bridgeStage: () => 4 } }), 4, '関数でも よい');
  assert.equal(bridgeStageOf({ field: { bridgeStage: 9 } }), 5);
  assert.equal(bridgeStageOf({ field: { bridgeStage: true } }), 5);
  assert.equal(bridgeStageOf({ field: { bridgeStage: -2 } }), 0);
  assert.equal(bridgeStageOf({ field: {}, bridgeStage: 2 }), 2);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(bridgeIntensity), [0, 0.2, 0.4, 0.6, 0.8, 1, 1]);
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
    const maps = { [mapId]: map, c10c_isles2: { id: 'c10c_isles2', kind, bgm }, c10c_isles3: { id: 'c10c_isles3', kind, bgm } };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // ダンジョンの 1階でも 深さでは なく 橋の 数
  assert.deepEqual(mk('c10c_isles1', 'c10c_isles').log, [['i', 0]], '橋なし');
  const b = mk('c10c_isles1', 'c10c_isles', { bridgeStage: 2 });
  assert.deepEqual(b.log, [['i', 0.4]]);
  b.g.field.bridgeStage = 5;
  b.sa.syncField(b.g, 1000);
  assert.deepEqual(b.log.slice(1), [['i', 1]], '5本 かかった');
  b.g.field.bridgeStage = 4;
  b.sa.syncField(b.g, 2000);
  assert.deepEqual(b.log.slice(2), [['i', 0.8]], '1本 消えた');
  assert.deepEqual(mk('c10c_isles2', 'c10c_isles', { bridgeStage: 1 }, 'c10c_isles', 'field').log, [['i', 0.2]], 'フィールドでも');
  // イベントの 曲でも 送る・ほかの 曲は 見ない
  assert.deepEqual(mk('c10c_isles1', 'c10c_colonel', { bridgeStage: 3 }, 'c10c_isles').log, [['i', 0.6]]);
  assert.deepEqual(mk('c10c_isles1', 'c10c_fort', { bridgeStage: 3 }).log.filter((x) => x[0] === 'p'), []);
  assert.deepEqual(mk('c10c_isles1', 'c10c_isles', { bridgeStage: 3 }).log.filter((x) => x[0] === 'p'), [], 'だんは 送らない');
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ bridgeStage: 0 }), 0);
});

test('第97回 F: いばりんぼ行進曲は いばった 行進 → あわてる（速く・半音で ずり落ちる）→ また いばる・雷の タム', () => {
  const tr = _TRACKS.c10c_colonel;
  const c = compileTrack(tr);
  assert.equal(tr.parts[0].i, 'brass', 'ブラスの 行進');
  assert.deepEqual(c.form, ['intro', 'A', 'B', 'C', 'D']);
  assert.equal(c.segs.C.bpm, 132, 'あわてる 区切りは 速い');
  assert.ok(!c.segs.A.bpm && !c.segs.D.bpm);
  // あわてる: 16分の 8分が 多い・さいごは 半音で 6つ ずり落ちる
  const cn = notesOf(c.segs.C.parts[0]);
  const tail = cn.slice(-8);
  assert.ok(tail.slice(1).every((m, i) => tail[i] - m === 1), `半音で ずり落ちる ${tail}`);
  const lens = (nm) => c.segs[nm].parts[0].filter((e) => e.f).map((e) => e.len);
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(avg(lens('C')) < avg(lens('A')) * 0.7, 'C は ばたばた');
  // D は A と 同じ ふし（おしまいだけ ちがう）
  assert.deepEqual(notesOf(c.segs.D.parts[0]).slice(0, 35), notesOf(c.segs.A.parts[0]).slice(0, 35));
  // 雷: 低い タムと シンバル
  const dr = c.parts.findIndex((p) => p.drums);
  const tl = Object.values(c.segs).reduce((a, s) => a + s.parts[dr].filter((e) => e.drum === 'tl').length, 0);
  assert.ok(tl >= 10, `雷の タム ${tl}`);
  assert.ok(c.segs.intro.parts[dr].some((e) => e.drum === 'c'));
  // ふつうの ボスの だん・ピンチは 主音から・こわく ない（長調の 区切りが 多い）
  assert.ok(!tr.phases);
  assert.equal(tr.pinch.n.split(' ')[0], 'Bb5:2');
  assert.equal(battleBgm({ snapBgm: 'c10c_colonel', mapId: 'c10c_isles3', has: (x) => !!_TRACKS[x] }), 'c10c_colonel');
  assert.equal(battleBgm({ snapBgm: 'battle', mapId: 'c10c_isles1', has: (x) => !!_TRACKS[x] }), 'battle3');
});

test('第97回 F: 三日月のかげは 少年の ふし・はっと する 音は 1つだけ・ラで しずかに おわる', () => {
  const tr = _TRACKS.c10c_stolen;
  const c = compileTrack(tr);
  // c9c_algol の A の 1〜4小節と 同じ 音の ならび
  const algA = notesOf(compileTrack(_TRACKS.c9c_algol).segs.A.parts[0]);
  const head = lineNotes(ALGOL_HEAD);
  assert.deepEqual(head, algA.slice(0, head.length), '少年の ふし');
  assert.deepEqual(head.slice(0, 7).map((m) => m % 12), [11, 9, 7, 5, 4, 2, 0], 'シ・ラ・ソ・ファ・ミ・レ・ド');
  assert.deepEqual(notesOf(c.segs.S.parts[0]), head);
  assert.equal(tr.parts[0].i, 'bell');
  // はっと する: たいこは さいしょの 小節だけ（タム 1つと シンバル 1つ）
  const dr = c.parts.findIndex((p) => p.drums);
  const hits = Object.values(c.segs).flatMap((s) => s.parts[dr].filter((e) => e.drum));
  assert.deepEqual(hits.map((e) => e.drum), ['tl', 'c']);
  assert.ok(c.segs.S.parts[dr].every((e) => !e.drum) && c.segs.E.parts[dr].every((e) => !e.drum));
  // こわすぎない: 低い うなり（C2 より 下の 長い 音）は 1小節め だけ・アクセントの 音は 少ない
  const accents = Object.values(c.segs).flatMap((s) => s.parts.flatMap((p) => p.filter((e) => e.f && (e.acc ?? 1) > 1)));
  assert.ok(accents.length <= 8, `強い 音 ${accents.length}`);
  // しずかに おわる: ラ（主音）で、弱い 音・たいこなし
  const end = notesOf(c.segs.E.parts[0]);
  assert.equal(end.at(-1) % 12, 9, 'ラで おわる');
  assert.equal(notesOf(c.segs.E.parts[1]).at(-1) % 12, 9);
});

test('第97回 F: ガッチャンベルト工場は 機械の きざみ・3人組の ふしが こっそり・ベルトが 逆回り', () => {
  const tr = _TRACKS.c10c_fort;
  const c = compileTrack(tr);
  assert.ok(!tr.phases, '画面の 状態は なし');
  const mar = c.parts.findIndex((p) => p.inst === 'marimba');
  const chip = c.parts.findIndex((p) => p.inst === 'chip_square');
  // 機械の きざみ: マリンバが 1小節に 8つ（A・B の 後半・C・A2）
  for (const nm of ['A', 'C', 'A2']) assert.equal(notesOf(c.segs[nm].parts[mar]).length, 64, `${nm}: きざみ`);
  // B: はじめの 4小節は 工場の ふしが 休み、チップが 3人組の 曲（c9a_trio）の 1〜4小節（音は 同じ。みじかく こっそり）
  const trio = lineNotes(C9A_TRIO_THEME.A.slice(0, 4));
  assert.deepEqual(lineNotes(FORT_TRIO), trio);
  assert.deepEqual(notesOf(c.segs.B.parts[chip]).slice(0, trio.length), trio, '3人組の ふし');
  assert.ok(c.segs.B.parts[chip].filter((e) => e.f).slice(0, trio.length).every((e) => e.stac), 'みじかく（スタッカート）');
  let t = 0;
  for (const e of c.segs.B.parts[0]) {
    if (t < 64) assert.ok(!e.f, 'B の 前半は 工場の ふしが 休み');
    t += e.len;
  }
  // C: ベルトが 逆回り（きざみが 上から 下へ）
  const dir = (nm) => {
    const ns = notesOf(c.segs[nm].parts[mar]).slice(0, 4);
    return Math.sign(ns[3] - ns[0]);
  };
  assert.equal(dir('A'), 1, 'A は 上へ');
  assert.equal(dir('C'), -1, 'C は 下へ');
  // A2: 3人組の ふしの 形が 工場の ふしと いっしょに 動く（2回）
  assert.equal(notesOf(c.segs.A2.parts[chip]).length, 12);
});

test('第97回 F: ふたつの光は 少年の ふしの 戦い・C で スピカの歌の 1ふしめが 1回だけ 重なる', () => {
  const tr = _TRACKS.c10c_rival;
  const c = compileTrack(tr);
  // A の 頭は 少年の ふし（シ・ラ・ソ・ファ・ミ・レ・ド）
  const a = notesOf(c.segs.A.parts[0]);
  assert.deepEqual(a.slice(0, 7).map((m) => m % 12), [11, 9, 7, 5, 4, 2, 0], 'A');
  // C は 半分の 速さで 7つの 音を 下へ
  const cc = c.segs.C.parts[0].filter((e) => e.f);
  assert.deepEqual(cc.slice(0, 7).map((e) => Math.round(midiOf(e.f)) % 12), [11, 9, 7, 5, 4, 2, 0], 'C');
  assert.ok(cc.slice(0, 6).every((e) => e.len === 8), '半分の 速さ');
  // スピカの 笛: C の はじめの 4小節で スピカの歌の 1ふしめ・ほかの 区切りでは 鳴らない
  assert.deepEqual(RIVAL_SPICA, C9D_SONG.phrases[0]);
  const fl = c.parts.findIndex((p) => p.inst === 'flute');
  assert.ok(fl >= 0 && c.parts[fl].role === 'harmony');
  assert.deepEqual(notesOf(c.segs.C.parts[fl]), lineNotes(C9D_SONG.phrases[0]), 'スピカの歌');
  for (const nm of c.form.filter((n) => n !== 'C')) assert.equal(notesOf(c.segs[nm].parts[fl]).length, 0, `${nm}: 笛は 休み`);
  // かなしすぎない・はげしすぎない: テンポ 140 いか・たいこは 1小節に 8つ いか
  assert.ok(tr.bpm <= 140);
  const dr = c.parts.findIndex((p) => p.drums);
  const perBar = c.segs.A.parts[dr].filter((e) => e.drum).length / 8;
  assert.ok(perBar <= 8.5, `たいこ ${perBar}`);
  assert.equal(tr.pinch.n.split(' ')[0], 'A5:2', 'ピンチは 主音から');
  assert.ok(!tr.phases, 'ふつうの ボスの だん（HP 半分で）');
  assert.equal(battleBgm({ snapBgm: 'c10c_rival', mapId: 'c10c_fort3', has: (x) => !!_TRACKS[x] }), 'c10c_rival');
});

test('第97回 F: 6つの 音は スピカの歌の 1〜6ふしめの 頭を じゅんに・さいごに レ・ミ・ファ・ソ・ラ・シ・ソの 和音で 止まる', () => {
  const tr = _TRACKS.c10c_six;
  const c = compileTrack(tr);
  const lead = notesOf(c.segs.S.parts[0]);
  const heads = C9D_SONG.phrases.slice(0, 6).map((ph) => notesOf(parseNotes(ph[0])));
  assert.deepEqual(lead.slice(0, heads.flat().length), heads.flat(), '1〜6ふしめの はじめの 小節');
  assert.deepEqual(C10C_LINES.sixHeads, C9D_SONG.phrases.slice(0, 6).map((ph) => ph[0]));
  // c10b_five と 同じ 作り（5ふしめまでは 同じ）
  const five = compileTrack(_TRACKS.c10b_five);
  assert.deepEqual(lead.slice(0, heads.slice(0, 5).flat().length), notesOf(five.segs.S.parts[0]).slice(0, heads.slice(0, 5).flat().length));
  assert.deepEqual(tr.parts.map((p) => p.i || 'drums'), C10B_TRACKS.c10b_five.parts.map((p) => p.i || 'drums'), '同じ 楽器');
  // ベルが 頭の 音（1オクターブ 上）を 1小節に 1つ → さいごに 6つの 星の音
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  const bn = notesOf(c.segs.S.parts[bell]);
  assert.deepEqual(bn.slice(0, 6), heads.map((h) => h[0] + 12), 'ミ・ミ・ド・ミ・ラ・ド');
  assert.deepEqual(SIX_NOTES, ['D', 'E', 'F', 'G', 'A', 'B']);
  assert.deepEqual(bn.slice(6).map((m) => m % 12), [2, 4, 5, 7, 9, 11], 'レ・ミ・ファ・ソ・ラ・シ');
  // ドで おわらない（あと 1つ）: さいごの ベースは ソ・ふしは シ
  assert.equal(notesOf(c.segs.S.parts[1]).at(-1) % 12, 7, 'ソの 和音');
  assert.equal(lead.at(-1) % 12, 11, 'ふしは シで 止まる');
  assert.equal(c.segs.S.steps / c.bar, 7, '7小節');
});

test('第97回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C10B_TRACKS), ...Object.keys(C9C_TRACKS), 'kumoi', 'c9a_trio', 'c9d_song', 'battle3']) {
    assert.ok(!(id in C10C_TRACKS), id);
    if (C10B_TRACKS[id]) assert.equal(_TRACKS[id].parts, C10B_TRACKS[id].parts, id);
    if (C9C_TRACKS[id]) assert.equal(_TRACKS[id].parts, C9C_TRACKS[id].parts, id);
  }
  assert.ok(Array.isArray(_TRACKS.kumoi.ch) && !_TRACKS.kumoi.sections, 'クモイの 曲は 前の まま');
  // だんの 形は ない（フィールドの 曲は 強さだけ・戦いは ふつうの だん）
  for (const id of IDS) assert.equal(formOfPhase(compileTrack(_TRACKS[id]), 2), compileTrack(_TRACKS[id]), id);
  assert.equal(phaseOf(compileTrack(_TRACKS.c10c_colonel), 1).transpose, 1);
});
