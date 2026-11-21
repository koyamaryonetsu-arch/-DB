// 第99回 F: 第3部 第2章 第4幕「金の音と、星の橋」の 曲（audio-c10d.js）
//   5曲が ある・id が 約束どおり・区切りの 長さ・ひとまわりの 秒・音の 高さ・強拍の ぶつかり・大きさの そろえ・名前・
//   星の 階段が 星の塔の ふし・gateStage で 楽器が 1つずつ ふえ 調が 上がる・門の 番人の 6つの 音・鏡の さかさの こたえ・
//   星の橋が スピカの歌の 7ふしで さいごの ドの 手前で 止まる・7つの 音の 曲・今の 曲が かわって いない
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { _TRACKS, TRACK_IDS } from '../public/js/client/audio.js';
import {
  C10D_TRACKS, C10D_IDS, C10D_LINES, GATE_INTENSITY, STAIRS_PHASES, GATE_NOTES, MIRROR_LINES, mirrorBar, scaleIndex,
  BRIDGE_HEADS, BRIDGE_LAST, SEVEN_NOTES, EIGHTH_NOTE,
} from '../public/js/client/audio-c10d.js';
import { C10C_TRACKS } from '../public/js/client/audio-c10c.js';
import { C10B_TRACKS } from '../public/js/client/audio-c10b.js';
import { C9D_SONG } from '../public/js/client/audio-c9d.js';
import { compileTrack, legacyChannels, midiOf, MusicEngine, parseNotes, phaseOf, formOfPhase } from '../public/js/client/music-engine.js';
import { INSTRUMENTS } from '../public/js/client/music-inst.js';
import { TRACK_NAMES } from '../public/js/client/audio-names.js';
import { TRACK_TRIM } from '../public/js/client/audio-trim.js';
import { checkText, gameFiles } from '../tools/kanji-check.mjs';
import {
  SceneAudio, battleBgm, battlePhase, FORM_KEYS, FORM_KEYS0, isPart3Track,
  C10D_STAIRS_TRACK, gateStageOf, gateIntensity, GATE_STAGES, bridgeStageOf,
} from '../public/js/client/audio-scene.js';

const IDS = ['c10d_stairs', 'c10d_gate', 'c10d_mirror', 'c10d_bridge', 'c10d_seven'];
const ONCE = ['c10d_bridge', 'c10d_seven'];
const LOOPED = IDS.filter((id) => !ONCE.includes(id));
const secOf = (c, nm) => (c.segs[nm].steps * 60) / (c.segs[nm].bpm || c.bpm) / 4;
const formSec = (c, form, from = 0) => form.slice(from).reduce((a, n) => a + secOf(c, n), 0);
const notesOf = (evs) => evs.filter((e) => e.f).map((e) => Math.round(midiOf(e.f)));
const lineNotes = (list) => notesOf(parseNotes(list.join(' ')));

// ───── 小さな にせの AudioContext（audio-c10c.test.js と 同じ）─────
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

test('第99回 F: 5曲（約束の id）が 区切りで 書いて あり、ゲームの 曲に 入って いる・名前・大きさの そろえ・漢字の しらべ', () => {
  assert.deepEqual(C10D_IDS, IDS);
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.parts, C10D_TRACKS[id].parts, `${id}: 入って いる`);
    assert.ok(tr.sections && tr.form, id);
    assert.ok(TRACK_IDS.includes(id), id);
    assert.ok(isPart3Track(id), `${id}: 第3部の 曲`);
    assert.ok(TRACK_NAMES[id], `${id}: 名前`);
    assert.deepEqual(checkText(TRACK_NAMES[id]).filter((p) => p.kind !== 'kana'), [], id);
    assert.ok(!/\s/.test(TRACK_NAMES[id]), `${id}: スペース なし`);
    assert.ok(Number.isFinite(TRACK_TRIM[id]) && Math.abs(TRACK_TRIM[id]) <= 3, `${id}: 大きさの そろえ ${TRACK_TRIM[id]}`);
    // ボスの 名前・もとの お話・「止まる」「足りない」・少年・女王は 出さない
    assert.ok(!/ミラーレ|白雪|しらゆき|女王|止ま|とま|足りな|たりな|アルゴル|少年|かがやきの使い|ソリトゥス|8つ|八つ|やっつ/.test(TRACK_NAMES[id]), `${id}: ネタバレ ${TRACK_NAMES[id]}`);
    assert.ok(tr.night && !Object.keys(tr.night).length, `${id}: 夜の 楽器の かえは しない`);
  }
  for (const id of LOOPED) assert.ok(!_TRACKS[id].once && _TRACKS[id].loopFrom >= 1, `${id}: くり返す`);
  for (const id of ONCE) assert.equal(_TRACKS[id].once, true, `${id}: くり返さない`);
  assert.equal(new Set(Object.values(TRACK_NAMES)).size, Object.keys(TRACK_NAMES).length, '名前が かさならない');
  assert.ok(gameFiles().some((f) => f.endsWith('public/js/client/audio-c10d.js')), '漢字の しらべに 入って いる');
});

test('第99回 F: 区切りの 長さ・ひとまわりの 秒・区切りごとに ちがう', () => {
  const range = { c10d_stairs: [60, 90], c10d_gate: [40, 70], c10d_mirror: [45, 90] };
  const barOf = { c10d_mirror: 12 };
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
  // 星の橋 40〜60 秒・7つの 音 10〜14 秒
  const br = compileTrack(_TRACKS.c10d_bridge);
  const bs = formSec(br, br.form);
  assert.ok(bs >= 40 && bs <= 60, `星の橋 ${bs.toFixed(1)} 秒`);
  const sv = compileTrack(_TRACKS.c10d_seven);
  const ss = formSec(sv, sv.form);
  assert.ok(ss >= 10 && ss <= 14, `7つの 音 ${ss.toFixed(1)} 秒`);
  for (const id of ONCE) {
    const { eng, log } = spyEngine();
    eng.start(id, _TRACKS[id], 0);
    eng.pump(90);
    const c = compileTrack(_TRACKS[id]);
    const sec = formSec(c, c.form);
    assert.ok(eng.player.done(90), `${id}: おわる`);
    assert.ok(Math.abs(eng.player.endT - sec) < 1e-6, `${id}: ${sec.toFixed(1)} 秒`);
    assert.ok(Math.max(...log.map((x) => x.t)) < sec, `${id}: さいごの 音は おわりより 前`);
  }
});

test('第99回 F: テンポ・パートは 5つまで・楽器・音の 高さの はんい', () => {
  const range = { c10d_stairs: [88, 104], c10d_gate: [144, 168], c10d_mirror: [108, 132], c10d_bridge: [80, 96], c10d_seven: [132, 150] };
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
  // 星の 階段は だんで 調が 上がっても メロディは 93（ラ）を 少し こえる だけ
  const st = compileTrack(_TRACKS.c10d_stairs);
  const top = Math.max(...Object.values(st.segs).flatMap((s) => notesOf(s.parts[0])));
  assert.ok(top + STAIRS_PHASES.at(-1).transpose <= 96, `いちばん 上 ${top}`);
});

// 強拍（小節の 頭と まん中。3拍子は 1拍めと 2拍めの うら＝ まん中）: メロディと ベースが 短2度・増4度・長7度で ぶつからない。
//   強拍で 鳴る パートどうしが 短2度（と 1オクターブ上）で にごらない
test('第99回 F: 強拍で ぶつからない・にごらない（0こ）', () => {
  const minN = { c10d_seven: 12, c10d_bridge: 24 };
  for (const id of IDS) {
    const c = compileTrack(_TRACKS[id]);
    const lead = c.parts.findIndex((p) => p.role === 'lead');
    const bass = c.parts.findIndex((p) => p.role === 'bass');
    // 3拍子は 1拍めと 2拍め・3拍めも 見る
    const beats = c.bar === 12 ? [0, 4, 6, 8] : [0, c.bar / 2];
    let n = 0;
    const bad = [];
    for (const [nm, s] of Object.entries(c.segs)) {
      const tl = s.parts.map((p) => {
        let t = 0;
        return p.map((e) => { const o = { t, len: e.len, m: e.f ? Math.round(midiOf(e.f)) : null }; t += e.len; return o; });
      });
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

test('第99回 F: 空への星の階段は 星の塔の ふし・門の 数で 楽器が 1つずつ ふえ、調が 半音ずつ 上がる', () => {
  const tr = _TRACKS.c10d_stairs;
  const c = compileTrack(tr);
  // 星の塔の 曲の ふし 16小節と 同じ 音・同じ 長さ
  const tower = parseNotes(_TRACKS.star_tower.ch[0].n).map((e) => [e.f ? Math.round(midiOf(e.f)) : 0, e.len]);
  const stairs = parseNotes([...C10D_LINES.towerA, ...C10D_LINES.towerB].join(' ')).map((e) => [e.f ? Math.round(midiOf(e.f)) : 0, e.len]);
  assert.deepEqual(stairs, tower, '星の塔の ふし');
  assert.deepEqual(notesOf(c.segs.A.parts[0]), lineNotes(C10D_LINES.towerA));
  assert.deepEqual(notesOf(c.segs.B.parts[0]), lineNotes(C10D_LINES.towerB));
  assert.ok(tr.bpm > _TRACKS.star_tower.bpm, '少し 速く（のぼる）');
  // のぼる ふし: 1〜6小節の 頭が 上へ
  const heads = C10D_LINES.stairC.slice(0, 4).map((b) => lineNotes([b])[0]);
  assert.ok(heads.every((m, i) => i === 0 || m > heads[i - 1]), `のぼる ${heads}`);
  // 強さの はしご: 笛・ベースは いつも、門 1〜4つめで 0.25 ずつ
  assert.deepEqual(GATE_INTENSITY, [0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual(c.parts.map((p) => p.minI), [0, 0, 0.25, 0.5, 0.75, 1]);
  // だん: 調が 半音ずつ（0〜4）・テンポは 少しずつ・形は かえない
  assert.deepEqual(STAIRS_PHASES.map((p) => p.transpose), [0, 1, 2, 3, 4]);
  for (let i = 1; i < 5; i++) assert.ok(STAIRS_PHASES[i].tempo > STAIRS_PHASES[i - 1].tempo && STAIRS_PHASES[i].tempo <= 1.05);
  for (let i = 0; i < 5; i++) {
    assert.equal(phaseOf(c, i).transpose, i);
    assert.equal(formOfPhase(c, i), c, '形は かわらない');
  }
  // にせの エンジン: 門が ふえる ほど 楽器と 音が ふえ、音が 高く なる
  const sec = secOf(c, 'intro') + secOf(c, 'A');
  const kinds = GATE_INTENSITY.map((x, n) => {
    const { log } = run('c10d_stairs', { intensity: x, phase: n }, sec);
    const flute = log.filter((e) => e.kind === 'v' && e.inst === 'flute').map((e) => e.f);
    return {
      insts: new Set(log.filter((e) => e.kind === 'v').map((e) => e.inst)),
      kick: log.filter((e) => e.kind === 'd' && e.d === 'k').length,
      n: log.length,
      first: flute[0],
    };
  });
  assert.deepEqual([...kinds[0].insts].sort(), ['bass', 'flute'], '0: 笛と ベースだけ');
  assert.ok(kinds[1].insts.has('pluck') && !kinds[1].insts.has('strings'), '1: ハープ');
  assert.ok(kinds[2].insts.has('strings') && kinds[2].kick === 0, '2: 弦');
  assert.ok(kinds[3].kick >= 6 && !kinds[3].insts.has('bell'), '3: たいこ');
  assert.ok(kinds[4].insts.has('bell'), '4: ベルの 星');
  for (let i = 1; i < 5; i++) {
    assert.ok(kinds[i].n > kinds[i - 1].n, `${i}: 音が ふえる ${kinds[i - 1].n}→${kinds[i].n}`);
    assert.ok(Math.abs(kinds[i].first / kinds[0].first - 2 ** (i / 12)) < 1e-6, `${i}: 半音 ${i} つ 上`);
  }
});

test('第99回 F: 画面の gateStage を 読む・その 曲の 時だけ 強さと だんを 送る', () => {
  assert.ok(FORM_KEYS0.includes('gateStage') && !FORM_KEYS.includes('gateStage'), 'addFormKey0');
  assert.equal(C10D_STAIRS_TRACK, 'c10d_stairs');
  assert.equal(GATE_STAGES, 5);
  assert.equal(gateStageOf({ field: {} }), 0, '出て いない 間は 0');
  assert.equal(gateStageOf(null), 0);
  assert.equal(gateStageOf({ field: { gateStage: 3 } }), 3);
  assert.equal(gateStageOf({ field: { gateStage: () => 2 } }), 2, '関数でも よい');
  assert.equal(gateStageOf({ field: { gateStage: 9 } }), 4);
  assert.equal(gateStageOf({ field: { gateStage: true } }), 4);
  assert.equal(gateStageOf({ field: { gateStage: -2 } }), 0);
  assert.equal(gateStageOf({ field: {}, gateStage: 1 }), 1);
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(gateIntensity), [0, 0.25, 0.5, 0.75, 1, 1]);
  assert.deepEqual(GATE_INTENSITY, [0, 1, 2, 3, 4].map(gateIntensity));
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
    const maps = { [mapId]: map, c10d_stair2: { id: 'c10d_stair2', kind, bgm }, c10d_stair3: { id: 'c10d_stair3', kind, bgm } };
    const g = { sky: { isNight: () => false, flying: false }, field: { mapId, map, me: { x: 1, y: 1 }, nightOverride: null, hasFlag: () => false, areaName: () => '', weatherKind: () => null, areaBgm: () => bgm, ...extra } };
    const sa = new SceneAudio(au, { tracks: _TRACKS, maps });
    au.play(playing);
    sa.syncField(g, 0, true);
    return { log, sa, g, au };
  };
  // ダンジョンの 3階でも 深さでは なく 門の 数
  assert.deepEqual(mk('c10d_stair3', 'c10d_stairs').log, [['i', 0], ['p', 0]], '門なし');
  const b = mk('c10d_stair1', 'c10d_stairs', { gateStage: 2 });
  assert.deepEqual(b.log, [['i', 0.5], ['p', 2]]);
  b.g.field.gateStage = 3;
  b.sa.syncField(b.g, 1000);
  assert.deepEqual(b.log.slice(2), [['i', 0.75], ['p', 3]], '門を 開けた');
  b.g.field.gateStage = 4;
  b.sa.syncField(b.g, 2000);
  assert.deepEqual(b.log.slice(4), [['i', 1], ['p', 4]], '4つ そろった');
  assert.deepEqual(mk('c10d_stair2', 'c10d_stairs', { gateStage: 1 }, 'c10d_stairs', 'field').log, [['i', 0.25], ['p', 1]], 'フィールドでも');
  // イベントの 曲でも 送る・ほかの 曲は 見ない
  assert.deepEqual(mk('c10d_stair1', 'c10d_gate', { gateStage: 3 }, 'c10d_stairs').log, [['i', 0.75], ['p', 3]]);
  assert.deepEqual(mk('c10d_stair1', 'c10d_mirror', { gateStage: 3 }).log.filter((x) => x[0] === 'p'), []);
  // 橋の 数（c10c）とは まざらない
  assert.equal(bridgeStageOf({ field: { gateStage: 3 } }), 0);
  // 戦いの pub に 出ても こまらない（0 から 数える しるし）
  const boss = (o) => battlePhase({ boss: true, enemies: [{ side: 'enemy', boss: true, hp: 90, maxHp: 100, ...o }] });
  assert.equal(boss({ gateStage: 0 }), 0);
});

test('第99回 F: 色ガラスの門は 短く きびきび・ガラスの きらきら・C で 6つの 音を 1つずつ', () => {
  const tr = _TRACKS.c10d_gate;
  const c = compileTrack(tr);
  assert.deepEqual(GATE_NOTES, ['D', 'E', 'F', 'G', 'A', 'B']);
  // C の 1〜6小節: 小節の 頭の 音が レ・ミ・ファ・ソ・ラ・シ（その 小節の まん中も 同じ 音）
  const C = c.segs.C.parts[0];
  const at = (st) => {
    let t = 0;
    for (const e of C) { if (st >= t && st < t + e.len && e.f) return Math.round(midiOf(e.f)); t += e.len; }
    return null;
  };
  const pcs = [2, 4, 5, 7, 9, 11];
  for (let k = 0; k < 6; k++) {
    assert.equal(at(k * 16) % 12, pcs[k], `${k + 1}小節め の 頭`);
    assert.equal(at(k * 16 + 8) % 12, pcs[k], `${k + 1}小節め の まん中`);
  }
  // 7小節めで 6つを 一気に かけ上がる
  assert.deepEqual(lineNotes([C10D_LINES.gateC[6]]).slice(0, 6).map((m) => m % 12), pcs);
  // ベルが 同じ 6つの 音で こたえる（C だけ）
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  assert.deepEqual(notesOf(c.segs.C.parts[bell]).map((m) => m % 12), pcs);
  for (const nm of c.form.filter((n) => n !== 'C')) assert.equal(notesOf(c.segs[nm].parts[bell]).length, 0, `${nm}: ベルは 休み`);
  // ガラスの きらきら: オルゴールが どの 区切りにも、強い 拍は さける
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  for (const nm of ['A', 'B', 'A2']) {
    let t = 0;
    let n = 0;
    for (const e of c.segs[nm].parts[mb]) {
      if (e.f) { n++; assert.ok(t % 8 !== 0, `${nm}: 強い 拍 ${t}`); }
      t += e.len;
    }
    assert.ok(n >= 40, `${nm}: きらきら ${n}`);
  }
  // 短く きびきび: 速い・ひとまわり 1分 いない・ピンチは 主音から
  assert.ok(tr.bpm >= 150);
  assert.ok(formSec(c, c.form, c.loopFrom) < 60);
  assert.equal(tr.pinch.n.split(' ')[0], 'D5:2');
  assert.ok(!tr.phases, 'ふつうの ボスの だん');
  assert.equal(battleBgm({ snapBgm: 'c10d_gate', mapId: 'c10d_stair1', has: (x) => !!_TRACKS[x] }), 'c10d_gate');
});

test('第99回 F: さかさまメヌエットは 3拍子・問いに 鏡の さかさの こたえ・A2 は オルゴールだけが こたえる', () => {
  const tr = _TRACKS.c10d_mirror;
  const c = compileTrack(tr);
  assert.equal(c.bar, 12, '3拍子');
  assert.equal(tr.parts[0].i, 'organ');
  // 鏡: 音階の 上で 上がり下がりが 逆（となりの 音との 差が 同じ 大きさで 向きが 逆）
  for (const [k, { q, a, axis }] of Object.entries(MIRROR_LINES)) {
    const qi = lineNotes(q).map(scaleIndex);
    const ai = lineNotes(a).map(scaleIndex);
    assert.equal(qi.length, ai.length, k);
    const ax = scaleIndex(lineNotes([`${axis}:1`])[0]);
    qi.forEach((x, i) => assert.equal(x + ai[i], 2 * ax, `${k}: 鏡の 音 ${i}`));
    for (let i = 1; i < qi.length; i++) assert.equal(qi[i] - qi[i - 1] + (ai[i] - ai[i - 1]), 0, `${k}: さかさ ${i}`);
    // 長さは 同じ
    assert.deepEqual(parseNotes(a.join(' ')).map((e) => e.len), parseNotes(q.join(' ')).map((e) => e.len), `${k}: 長さ`);
  }
  assert.equal(mirrorBar('E5:4! G5:2 B5:2', 'B5'), 'F#6:4! D6:2 B5:2');
  // A・B・C の ふしは 問い 4小節 → こたえ 4小節
  for (const k of ['A', 'B', 'C']) assert.deepEqual(notesOf(c.segs[k].parts[0]), lineNotes([...MIRROR_LINES[k].q, ...MIRROR_LINES[k].a]), k);
  // A: オルゴールが こたえを 弱く なぞる・A2: こたえは オルゴールだけ（オルガンは 休み）
  const mb = c.parts.findIndex((p) => p.inst === 'musicbox');
  const tail = (nm, i) => {
    let t = 0;
    const out = [];
    for (const e of c.segs[nm].parts[i]) { if (t >= 48 && e.f) out.push(e); t += e.len; }
    return out;
  };
  assert.deepEqual(tail('A', mb).map((e) => Math.round(midiOf(e.f))), lineNotes(MIRROR_LINES.A.a));
  assert.ok(tail('A', mb).every((e) => (e.acc ?? 1) < 1), 'A: 弱く');
  assert.deepEqual(tail('A2', mb).map((e) => Math.round(midiOf(e.f))), lineNotes(MIRROR_LINES.A.a));
  assert.equal(tail('A2', 0).length, 0, 'A2: オルガンは こたえない');
  // にくめないが 少し つめたい: 短調・ピンチは 主音（ミ）から
  assert.equal(tr.pinch.n.split(' ')[0], 'E6:2');
  assert.ok(!tr.phases);
  assert.equal(battleBgm({ snapBgm: 'c10d_mirror', mapId: 'c10d_summit', has: (x) => !!_TRACKS[x] }), 'c10d_mirror');
});

test('第99回 F: のびてゆく星の橋は スピカの歌の 7ふし・大きく 広がって さいごの ドの 手前（シ）で 止まる', () => {
  const tr = _TRACKS.c10d_bridge;
  const c = compileTrack(tr);
  assert.deepEqual(c.form, ['intro', 'P', 'W', 'F']);
  // P: スピカの歌の 1〜6ふしめの 頭（どの ふしも はじめの 小節から）
  assert.deepEqual(BRIDGE_HEADS.map((h) => h[0]), C9D_SONG.phrases.slice(0, 6).map((ph) => ph[0]));
  assert.deepEqual(notesOf(c.segs.P.parts[0]), lineNotes(BRIDGE_HEADS.flat()));
  // F: 7ふしめの 1〜3小節（さいごの 小節 C6:16 は 鳴らさない）
  assert.deepEqual(BRIDGE_LAST, C9D_SONG.phrases[6].slice(0, 3));
  const fl = notesOf(c.segs.F.parts[0]);
  assert.deepEqual(fl, lineNotes(BRIDGE_LAST));
  assert.equal(fl.at(-1) % 12, 11, 'シで 止まる');
  assert.equal(C9D_SONG.phrases[6][3], 'C6:16', 'のこった 1音は ド');
  const all = Object.values(c.segs).flatMap((s) => notesOf(s.parts[0]));
  assert.equal(all.at(-1), 83, 'さいごの ふしの 音は シ（ドへ 帰らない）');
  // 止まりきらない: さいごの 小節は ふしが 休み、ソの 和音（ベース ソ）と ハープ・ベルが のこる
  const lastBar = (i) => {
    let t = 0;
    const out = [];
    for (const e of c.segs.F.parts[i]) { if (t >= 48 && e.f) out.push(e); t += e.len; }
    return out;
  };
  assert.equal(lastBar(0).length, 0);
  assert.deepEqual(notesOf(lastBar(1)).map((m) => m % 12), [7], 'ベースは ソ');
  const pluck = c.parts.findIndex((p) => p.inst === 'pluck');
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  assert.ok(lastBar(pluck).length >= 3 && lastBar(bell).length >= 1, 'ハープと ベルが のこる');
  // かなしく しない: 和音は 長調が 多い・おわりは ソの 長和音
  // 大きく 広がる: W の ふしが いちばん 高い・たいこの シンバル
  const top = (nm) => Math.max(...notesOf(c.segs[nm].parts[0]));
  assert.ok(top('W') >= top('P') && top('W') >= top('F'), 'W が いちばん 高い');
  const dr = c.parts.findIndex((p) => p.drums);
  assert.ok(c.segs.W.parts[dr].some((e) => e.drum === 'c') && c.segs.F.parts[dr].some((e) => e.drum === 'c'));
  // だんだん 大きく: 弦は 3ふしめから・たいこは 5ふしめから
  const str = c.parts.findIndex((p) => p.inst === 'strings');
  let t = 0;
  for (const e of c.segs.P.parts[str]) { if (t < 64) assert.ok(!e.f, '弦は 3ふしめから'); t += e.len; }
  t = 0;
  for (const e of c.segs.P.parts[dr]) { if (t < 128) assert.ok(!e.drum, 'たいこは 5ふしめから'); t += e.len; }
  // イントロ: 7つの 星の音（ド〜シ）が のぼる
  assert.deepEqual(notesOf(c.segs.intro.parts[bell]).map((m) => m % 12), [0, 2, 4, 5, 7, 9, 11]);
});

test('第99回 F: そろった七つの音は スピカの歌の 1〜7ふしめの 頭・ベルが レ〜ドを のぼり、上に 問いの 音を 1つ', () => {
  const tr = _TRACKS.c10d_seven;
  const c = compileTrack(tr);
  const lead = notesOf(c.segs.S.parts[0]);
  const heads = C9D_SONG.phrases.map((ph) => notesOf(parseNotes(ph[0])));
  assert.deepEqual(lead, heads.flat(), '1〜7ふしめの はじめの 小節');
  assert.deepEqual(C10D_LINES.sevenHeads, C9D_SONG.phrases.map((ph) => ph[0]));
  // c10c_six と 同じ 作り（6ふしめまでは 同じ・同じ 楽器）
  const six = compileTrack(_TRACKS.c10c_six);
  const n6 = heads.slice(0, 6).flat().length;
  assert.deepEqual(lead.slice(0, n6), notesOf(six.segs.S.parts[0]).slice(0, n6));
  assert.deepEqual(tr.parts.map((p) => p.i || 'drums'), C10C_TRACKS.c10c_six.parts.map((p) => p.i || 'drums'), '同じ 楽器');
  // ベルが 頭の 音（1オクターブ 上）を 1小節に 1つ → さいごに 7つの 星の音 → 上に 1つ
  const bell = c.parts.findIndex((p) => p.inst === 'bell');
  assert.deepEqual(notesOf(c.segs.S.parts[bell]), heads.map((h) => h[0] + 12));
  assert.deepEqual(SEVEN_NOTES, ['D', 'E', 'F', 'G', 'A', 'B', 'C']);
  const run = notesOf(c.segs.E.parts[bell]);
  assert.deepEqual(run.slice(0, 7).map((m) => m % 12), [2, 4, 5, 7, 9, 11, 0], 'レ・ミ・ファ・ソ・ラ・シ・ド');
  assert.ok(run.slice(1, 7).every((m, i) => m > run[i]), 'のぼる');
  assert.equal(run.length, 8, '8つめが 1つ');
  assert.equal(EIGHTH_NOTE, 'D7');
  assert.ok(run[7] > run[6], '8つめは ドの 上');
  const eighth = c.segs.E.parts[bell].filter((e) => e.f).at(-1);
  assert.ok((eighth.acc ?? 1) < 1, '8つめは 弱く（問い）');
  // ドで 止まる: さいごの ふし・ベースは ド
  assert.equal(notesOf(c.segs.E.parts[0]).at(-1) % 12, 0, 'ふしは ドで 止まる');
  assert.equal(notesOf(c.segs.E.parts[1]).at(-1) % 12, 0, 'ドの 和音');
  assert.equal(c.segs.S.steps / c.bar, 7, '7小節');
  assert.equal(c.segs.E.steps / c.bar, 1, '＋ 1小節');
  assert.ok(c.segs.E.bpm < tr.bpm, 'さいごの 小節は 少し ゆっくり');
  // 8つめの 音が おわりの 前に しっかり 鳴る（おわりまで 0.4 秒 いじょう）
  let t = 0;
  let tq = 0;
  for (const e of c.segs.E.parts[bell]) { if (e.f) tq = t; t += e.len; }
  assert.ok(((16 - tq) * 60) / c.segs.E.bpm / 4 >= 0.4);
});

test('第99回 F: 前の音 用の ch・今まで の 曲は かわって いない', () => {
  for (const id of IDS) {
    const tr = _TRACKS[id];
    assert.equal(tr.ch.length, tr.parts.length, id);
    for (const ch of tr.ch) for (const t of ch.n.split(/\s+/)) assert.match(t, ch.drums ? /^[kshr]:\d+$/ : /^(r|[A-G][#b]?\d):\d+$/, `${id}: ${t}`);
    const total = (ch) => ch.n.split(/\s+/).reduce((a, t) => a + Number(t.split(':')[1]), 0);
    assert.equal(new Set(tr.ch.map(total)).size, 1, `${id}: 前の音の チャンネルの 長さ`);
    assert.equal(legacyChannels(tr).ch, tr.ch, id);
  }
  for (const id of [...Object.keys(C10C_TRACKS), ...Object.keys(C10B_TRACKS), 'star_tower', 'c9d_song', 'battle3']) {
    assert.ok(!(id in C10D_TRACKS), id);
    if (C10C_TRACKS[id]) assert.equal(_TRACKS[id].parts, C10C_TRACKS[id].parts, id);
    if (C10B_TRACKS[id]) assert.equal(_TRACKS[id].parts, C10B_TRACKS[id].parts, id);
  }
  assert.ok(Array.isArray(_TRACKS.star_tower.ch) && !_TRACKS.star_tower.sections, '星の塔の 曲は 前の まま');
  // だんの 形は ない（戦いは ふつうの だん）
  for (const id of ['c10d_gate', 'c10d_mirror', 'c10d_bridge', 'c10d_seven']) assert.equal(formOfPhase(compileTrack(_TRACKS[id]), 2), compileTrack(_TRACKS[id]), id);
  assert.equal(phaseOf(compileTrack(_TRACKS.c10d_mirror), 1).transpose, 1);
});
